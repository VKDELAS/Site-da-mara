import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error("Supabase URL or Key not configured")
  }

  return createClient(url, key)
}

function calculateSchedule(openTime: string, closeTime: string) {
  const now = new Date()
  const spTimeStr = now.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  })

  const [curH, curM] = spTimeStr.split(":").map(Number)
  const [openH, openM] = (openTime || "10:00").split(":").map(Number)
  const [closeH, closeM] = (closeTime || "22:00").split(":").map(Number)

  const curTotal = (isNaN(curH) ? 0 : curH) * 60 + (isNaN(curM) ? 0 : curM)
  const openTotal = (isNaN(openH) ? 10 : openH) * 60 + (isNaN(openM) ? 0 : openM)
  const closeTotal = (isNaN(closeH) ? 22 : closeH) * 60 + (isNaN(closeM) ? 0 : closeM)

  let scheduledOpen = false
  if (openTotal <= closeTotal) {
    scheduledOpen = curTotal >= openTotal && curTotal < closeTotal
  } else {
    scheduledOpen = curTotal >= openTotal || curTotal < closeTotal
  }

  return { scheduledOpen, spTimeStr }
}

async function handleStoreStatusCheck() {
  const supabase = getServiceClient()

  // 1. Tenta chamar a RPC PostgreSQL check_and_update_store_status() se disponível
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc("check_and_update_store_status")
    if (!rpcError && rpcData) {
      return NextResponse.json({
        success: true,
        source: "rpc",
        result: rpcData,
      })
    }
  } catch {
    // Continua para fallback em TypeScript caso a RPC não tenha sido instalada
  }

  // 2. Fallback direto via tabela store_settings
  const { data: row, error: fetchError } = await supabase
    .from("store_settings")
    .select("*")
    .eq("setting_key", "store_status")
    .maybeSingle()

  if (fetchError || !row) {
    return NextResponse.json(
      { success: false, error: fetchError?.message || "store_status not found" },
      { status: 500 }
    )
  }

  const val = row.setting_value || {}
  const openTime = val.openTime || "10:00"
  const closeTime = val.closeTime || "22:00"
  const autoSchedule = val.autoSchedule !== false
  let manualOverride = !!val.manualOverride
  const lastCycleState = val.lastCycleState !== undefined ? !!val.lastCycleState : !!val.isOpen
  let isOpen = !!val.isOpen

  const { scheduledOpen, spTimeStr } = calculateSchedule(openTime, closeTime)
  let changed = false

  if (autoSchedule) {
    if (manualOverride) {
      // Se atingiu a virada de ciclo programado, desativa sobreposição
      if (scheduledOpen !== lastCycleState) {
        manualOverride = false
        isOpen = scheduledOpen
        changed = true
      }
    } else {
      if (isOpen !== scheduledOpen) {
        isOpen = scheduledOpen
        changed = true
      }
    }
  }

  if (changed || val.openTime === undefined || val.closeTime === undefined) {
    const updatedVal = {
      ...val,
      isOpen,
      manualOverride,
      lastCycleState: scheduledOpen,
      openTime,
      closeTime,
      autoSchedule,
      lastAutoSync: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from("store_settings")
      .update({
        setting_value: updatedVal,
        updated_at: new Date().toISOString(),
      })
      .eq("setting_key", "store_status")

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      source: "fallback_updated",
      isOpen,
      manualOverride,
      currentTimeSP: spTimeStr,
    })
  }

  return NextResponse.json({
    success: true,
    source: "fallback_no_change",
    isOpen,
    manualOverride,
    currentTimeSP: spTimeStr,
  })
}

export async function GET() {
  return handleStoreStatusCheck()
}

export async function POST() {
  return handleStoreStatusCheck()
}
