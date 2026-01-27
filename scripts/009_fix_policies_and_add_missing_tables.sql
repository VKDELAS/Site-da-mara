-- Removendo políticas existentes e recriando com IF NOT EXISTS
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view available products" ON products;
DROP POLICY IF EXISTS "Authenticated users can view all products" ON products;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items for their orders" ON order_items;
DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;
DROP POLICY IF EXISTS "Anyone can view store settings" ON store_settings;
DROP POLICY IF EXISTS "Anyone can view wait time" ON wait_time_state;
DROP POLICY IF EXISTS "Anyone can view available adicionais" ON adicionais;
DROP POLICY IF EXISTS "Anyone can view product adicionais" ON product_adicionais;

-- Criando tabela de endereços (addresses)
CREATE TABLE IF NOT EXISTS addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Iacanga',
  state TEXT NOT NULL DEFAULT 'SP',
  cep TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criando tabela de adicionais (adicional items)
CREATE TABLE IF NOT EXISTS adicionais (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criando tabela de relacionamento produtos-adicionais
CREATE TABLE IF NOT EXISTS product_adicionais (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  adicional_id UUID REFERENCES adicionais(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, adicional_id)
);

-- Adicionando coluna adicionais ao order_items para salvar os adicionais do pedido
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS adicionais JSONB DEFAULT '[]'::jsonb;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON addresses(is_default);
CREATE INDEX IF NOT EXISTS idx_product_adicionais_product_id ON product_adicionais(product_id);
CREATE INDEX IF NOT EXISTS idx_product_adicionais_adicional_id ON product_adicionais(adicional_id);
CREATE INDEX IF NOT EXISTS idx_adicionais_category ON adicionais(category);

-- Enable RLS on new tables
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE adicionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_adicionais ENABLE ROW LEVEL SECURITY;

-- Recreate all RLS policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Anyone can view available products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for their orders"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view active coupons"
  ON coupons FOR SELECT
  USING (active = true);

CREATE POLICY "Anyone can view store settings"
  ON store_settings FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view wait time"
  ON wait_time_state FOR SELECT
  USING (true);

-- Policies para addresses
CREATE POLICY "Users can view their own addresses"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own addresses"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id);

-- Policies para adicionais
CREATE POLICY "Anyone can view available adicionais"
  ON adicionais FOR SELECT
  USING (available = true);

CREATE POLICY "Anyone can view product adicionais"
  ON product_adicionais FOR SELECT
  USING (true);

-- Função para garantir apenas um endereço padrão por usuário
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE addresses
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_address
  BEFORE INSERT OR UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_address();
