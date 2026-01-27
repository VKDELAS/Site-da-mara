-- Insert default adicionais (additions/extras)
INSERT INTO adicionais (id, name, price, available) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Catupiry', 4.00, true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Cheddar', 3.50, true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Bacon', 5.00, true),
  ('550e8400-e29b-41d4-a716-446655440004', 'Calabresa', 4.00, true),
  ('550e8400-e29b-41d4-a716-446655440005', 'Frango Desfiado', 5.00, true),
  ('550e8400-e29b-41d4-a716-446655440006', 'Milho', 2.00, true),
  ('550e8400-e29b-41d4-a716-446655440007', 'Ervilha', 2.00, true),
  ('550e8400-e29b-41d4-a716-446655440008', 'Azeitona', 2.50, true),
  ('550e8400-e29b-41d4-a716-446655440009', 'Queijo Ralado Extra', 3.00, true),
  ('550e8400-e29b-41d4-a716-446655440010', 'Molho Especial', 2.00, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  available = EXCLUDED.available,
  updated_at = NOW();

-- Display the count of adicionais
DO $$
DECLARE
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM adicionais;
  RAISE NOTICE 'Total de adicionais: %', total_count;
END $$;
