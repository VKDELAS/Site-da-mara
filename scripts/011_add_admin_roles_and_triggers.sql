-- 1. Garante que a coluna 'role' existe na tabela public.profiles com valor default 'user'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Atualiza a função handle_new_user para determinar a role automaticamente durante o registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT := 'user';
BEGIN
  -- Determina a role de admin com base no e-mail exato, padrão 'admin' ou metadados de signup
  IF NEW.email = 'enzzobaraldo2008@gmail.com' 
     OR NEW.email LIKE '%admin%' 
     OR COALESCE(NEW.raw_user_meta_data->>'role', '') = 'admin' THEN
    assigned_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE 
  SET role = EXCLUDED.role,
      email = EXCLUDED.email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atualiza os usuários existentes na tabela profiles com base nas mesmas regras de admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'enzzobaraldo2008@gmail.com'
   OR email LIKE '%admin%';
