-- Insert initial store settings
INSERT INTO store_settings (setting_key, setting_value)
VALUES 
  ('store_status', '{"isOpen": true, "waitTimeMin": 15, "waitTimeMax": 22}'),
  ('admin_config', '{"allowOrders": true, "maintenanceMode": false}')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert initial wait time state
INSERT INTO wait_time_state (base_time, additional_time, last_order_time)
VALUES (15, 0, NOW())
ON CONFLICT DO NOTHING;

-- Insert sample products (based on the app structure)
INSERT INTO products (name, description, price, category, available)
VALUES
  ('Batata Frita Simples', 'Batata frita crocante e deliciosa', 15.00, 'batatas', true),
  ('Batata com Cheddar e Bacon', 'Batata frita coberta com cheddar cremoso e bacon crocante', 22.00, 'batatas', true),
  ('Batata com Calabresa', 'Batata frita com calabresa acebolada', 20.00, 'batatas', true),
  ('Refrigerante Lata', 'Coca-Cola, Guaraná ou Fanta', 5.00, 'bebidas', true),
  ('Suco Natural', 'Suco de laranja, limão ou abacaxi', 8.00, 'bebidas', true),
  ('Água Mineral', 'Água mineral 500ml', 3.00, 'bebidas', true)
ON CONFLICT DO NOTHING;
