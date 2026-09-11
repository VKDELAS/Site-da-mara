-- ============================================================
-- 012_store_schedule_and_cron.sql
-- Batata Top Delivery - Sistema Automático de Abertura e Fechamento
-- ============================================================

-- 1. Garante que os campos de horário e ciclo existam no setting_value
UPDATE store_settings
SET setting_value = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          setting_value,
          '{openTime}',
          COALESCE(setting_value->'openTime', '"10:00"'::jsonb)
        ),
        '{closeTime}',
        COALESCE(setting_value->'closeTime', '"22:00"'::jsonb)
      ),
      '{autoSchedule}',
      COALESCE(setting_value->'autoSchedule', 'true'::jsonb)
    ),
    '{manualOverride}',
    COALESCE(setting_value->'manualOverride', 'false'::jsonb)
  ),
  '{lastCycleState}',
  COALESCE(setting_value->'lastCycleState', setting_value->'isOpen', 'true'::jsonb)
)
WHERE setting_key = 'store_status';

-- Caso o registro ainda não exista, insere com os valores padrão:
INSERT INTO store_settings (setting_key, setting_value)
VALUES (
  'store_status',
  '{
    "isOpen": true,
    "openTime": "10:00",
    "closeTime": "22:00",
    "autoSchedule": true,
    "manualOverride": false,
    "lastCycleState": true,
    "isDeliveryEnabled": true,
    "deliveryFee": 3.00,
    "isDeliveryFeeEnabled": true,
    "waitTimeMin": 15,
    "waitTimeMax": 22
  }'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;

-- 2. Função autônoma no PostgreSQL para verificar e atualizar o status da loja
CREATE OR REPLACE FUNCTION check_and_update_store_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_setting RECORD;
  v_val JSONB;
  v_open_time TEXT;
  v_close_time TEXT;
  v_auto_schedule BOOLEAN;
  v_manual_override BOOLEAN;
  v_last_cycle_state BOOLEAN;
  v_current_open BOOLEAN;
  
  v_now_sp TIMESTAMP;
  v_current_time_str TEXT;
  v_scheduled_open BOOLEAN;
  v_target_open BOOLEAN;
  v_target_override BOOLEAN;
  v_changed BOOLEAN := FALSE;
BEGIN
  -- Busca o registro atual de store_status
  SELECT * INTO v_setting
  FROM store_settings
  WHERE setting_key = 'store_status'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'store_status not found');
  END IF;

  v_val := v_setting.setting_value;

  -- Extrai campos com fallbacks seguros
  v_open_time := COALESCE(v_val->>'openTime', '10:00');
  v_close_time := COALESCE(v_val->>'closeTime', '22:00');
  v_auto_schedule := COALESCE((v_val->>'autoSchedule')::boolean, true);
  v_manual_override := COALESCE((v_val->>'manualOverride')::boolean, false);
  v_current_open := COALESCE((v_val->>'isOpen')::boolean, true);
  v_last_cycle_state := COALESCE((v_val->>'lastCycleState')::boolean, v_current_open);

  -- Horário atual no fuso de São Paulo (Iacanga - SP)
  v_now_sp := timezone('America/Sao_Paulo', NOW());
  v_current_time_str := to_char(v_now_sp, 'HH24:MI');

  -- Calcula se pelo horário a loja deveria estar aberta
  IF v_open_time <= v_close_time THEN
    -- Janela no mesmo dia (ex: 10:00 às 22:00)
    v_scheduled_open := (v_current_time_str >= v_open_time AND v_current_time_str < v_close_time);
  ELSE
    -- Janela que vira a meia-noite (ex: 18:00 às 02:00)
    v_scheduled_open := (v_current_time_str >= v_open_time OR v_current_time_str < v_close_time);
  END IF;

  v_target_open := v_current_open;
  v_target_override := v_manual_override;

  -- Se o agendamento automático estiver ativo
  IF v_auto_schedule THEN
    IF v_manual_override THEN
      -- Se houve sobreposição manual, verifica se atingiu a fronteira do próximo ciclo:
      -- A fronteira é atingida quando o ciclo programado muda de estado (ex: bateu 22:00 ou 10:00)
      IF v_scheduled_open != v_last_cycle_state THEN
        -- Novo ciclo atingido: cancela sobreposição e assume o ciclo programado!
        v_target_override := FALSE;
        v_target_open := v_scheduled_open;
        v_last_cycle_state := v_scheduled_open;
        v_changed := TRUE;
      END IF;
    ELSE
      -- Modo automático puro: garante que isOpen coincida com o horário
      IF v_current_open != v_scheduled_open THEN
        v_target_open := v_scheduled_open;
        v_last_cycle_state := v_scheduled_open;
        v_changed := TRUE;
      END IF;
    END IF;
  END IF;

  -- Atualiza o registro se houve mudança no status ou no override
  IF v_changed OR (v_target_open != v_current_open) OR (v_target_override != v_manual_override) THEN
    v_val := jsonb_set(v_val, '{isOpen}', to_jsonb(v_target_open));
    v_val := jsonb_set(v_val, '{manualOverride}', to_jsonb(v_target_override));
    v_val := jsonb_set(v_val, '{lastCycleState}', to_jsonb(v_last_cycle_state));
    v_val := jsonb_set(v_val, '{lastAutoSync}', to_jsonb(to_char(v_now_sp, 'YYYY-MM-DD"T"HH24:MI:SSOF')));

    UPDATE store_settings
    SET 
      setting_value = v_val,
      updated_at = NOW()
    WHERE setting_key = 'store_status';

    RETURN jsonb_build_object(
      'success', true, 
      'updated', true, 
      'isOpen', v_target_open, 
      'manualOverride', v_target_override,
      'currentTimeSP', v_current_time_str
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'updated', false, 
    'isOpen', v_current_open, 
    'manualOverride', v_manual_override,
    'currentTimeSP', v_current_time_str
  );
END;
$$;

-- Permissões de execução
GRANT EXECUTE ON FUNCTION check_and_update_store_status() TO authenticated, service_role, anon;

-- 3. Agendamento com pg_cron (se a extensão estiver disponível/instalada no Supabase)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  
  -- Remove agendamento anterior caso exista para não duplicar
  PERFORM cron.unschedule('store-auto-status-check')
  WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'store-auto-status-check'
  );

  -- Agenda execução a cada 1 minuto
  PERFORM cron.schedule(
    'store-auto-status-check',
    '* * * * *',
    'SELECT check_and_update_store_status();'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron não pôde ser ativado automaticamente (%s). O endpoint /api/cron/store-status servirá de contingência.', SQLERRM;
END;
$$;
