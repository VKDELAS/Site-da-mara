-- Create adicionais (additions/extras) table
CREATE TABLE IF NOT EXISTS adicionais (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create junction table for products and adicionais (many-to-many relationship)
CREATE TABLE IF NOT EXISTS product_adicionais (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  adicional_id UUID REFERENCES adicionais(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, adicional_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_adicionais_available ON adicionais(available);
CREATE INDEX IF NOT EXISTS idx_product_adicionais_product_id ON product_adicionais(product_id);
CREATE INDEX IF NOT EXISTS idx_product_adicionais_adicional_id ON product_adicionais(adicional_id);

-- Enable Row Level Security
ALTER TABLE adicionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_adicionais ENABLE ROW LEVEL SECURITY;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_adicionais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_adicionais_timestamp
  BEFORE UPDATE ON adicionais
  FOR EACH ROW
  EXECUTE FUNCTION update_adicionais_updated_at();
