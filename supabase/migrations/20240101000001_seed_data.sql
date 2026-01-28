-- RV Prophet Seed Data (Idempotent)
DO $$
DECLARE
  v_user_id UUID := '85accf9b-912f-4a6a-8b85-0a5670348969';
  v_dealership_id UUID;
  v_customer1_id UUID;
  v_customer2_id UUID;
  v_customer3_id UUID;
  v_rv1_id UUID;
  v_rv2_id UUID;
  v_rv3_id UUID;
  v_rv4_id UUID;
BEGIN
  -- Get or create dealership
  SELECT dealership_id INTO v_dealership_id FROM profiles WHERE id = v_user_id;

  IF v_dealership_id IS NULL THEN
    -- Create new dealership
    INSERT INTO dealerships (id, name, phone, email, default_labor_rate, currency_symbol, default_terms, parts_markup_percent, technicians_see_pricing)
    VALUES (
      gen_random_uuid(),
      'NorthStar RV Service Center',
      '(555) 123-4567',
      'service@northstarrv.com',
      95.00,
      '$',
      'Payment due upon completion of service. We accept all major credit cards.',
      25.00,
      false
    )
    RETURNING id INTO v_dealership_id;

    -- Create owner profile
    INSERT INTO profiles (id, dealership_id, name, email, role, status)
    VALUES (
      v_user_id,
      v_dealership_id,
      'Maya Torres',
      (SELECT email FROM auth.users WHERE id = v_user_id),
      'owner',
      'active'
    );

    RAISE NOTICE 'Created new dealership: %', v_dealership_id;
  ELSE
    RAISE NOTICE 'Using existing dealership: %', v_dealership_id;
  END IF;

  -- Create customers if they don't exist
  INSERT INTO customers (id, dealership_id, name, email, phone)
  VALUES (gen_random_uuid(), v_dealership_id, 'Ava Mitchell', 'ava.mitchell@email.com', '(555) 234-5678')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_customer1_id;

  IF v_customer1_id IS NULL THEN
    SELECT id INTO v_customer1_id FROM customers WHERE email = 'ava.mitchell@email.com' AND dealership_id = v_dealership_id;
  END IF;

  INSERT INTO customers (id, dealership_id, name, email, phone)
  VALUES (gen_random_uuid(), v_dealership_id, 'Lucas Reed', 'lucas.reed@email.com', '(555) 345-6789')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_customer2_id;

  IF v_customer2_id IS NULL THEN
    SELECT id INTO v_customer2_id FROM customers WHERE email = 'lucas.reed@email.com' AND dealership_id = v_dealership_id;
  END IF;

  INSERT INTO customers (id, dealership_id, name, email, phone)
  VALUES (gen_random_uuid(), v_dealership_id, 'Nia Patel', 'nia.patel@email.com', '(555) 456-7890')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_customer3_id;

  IF v_customer3_id IS NULL THEN
    SELECT id INTO v_customer3_id FROM customers WHERE email = 'nia.patel@email.com' AND dealership_id = v_dealership_id;
  END IF;

  -- Create RVs if they don't exist
  INSERT INTO rvs (id, dealership_id, customer_id, year, make, model, vin, nickname, notes)
  VALUES (gen_random_uuid(), v_dealership_id, v_customer1_id, 2022, 'Winnebago', 'View 24D', '1WVAA5A34N1234567', 'Road Runner', 'Regular maintenance customer')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_rv1_id;

  IF v_rv1_id IS NULL THEN
    SELECT id INTO v_rv1_id FROM rvs WHERE vin = '1WVAA5A34N1234567';
  END IF;

  INSERT INTO rvs (id, dealership_id, customer_id, year, make, model, vin, nickname, notes)
  VALUES (gen_random_uuid(), v_dealership_id, v_customer1_id, 2019, 'Airstream', 'Interstate 24GT', '1ATAA4G39K7654321', 'Silver Bullet', NULL)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_rv2_id;

  INSERT INTO rvs (id, dealership_id, customer_id, year, make, model, vin, nickname, notes)
  VALUES (gen_random_uuid(), v_dealership_id, v_customer2_id, 2021, 'Thor', 'Chateau 22E', '1THRA8E23M9876543', NULL, 'New customer - first service')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_rv3_id;

  INSERT INTO rvs (id, dealership_id, customer_id, year, make, model, vin, nickname, notes)
  VALUES (gen_random_uuid(), v_dealership_id, v_customer3_id, 2020, 'Forest River', 'Sunseeker 2400W', '1FRSS4W25L1357924', 'Sunny', NULL)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_rv4_id;

  -- Create parts if they don't exist (check by SKU)
  INSERT INTO parts (dealership_id, name, sku, description, price, in_stock_qty)
  SELECT v_dealership_id, 'RV Water Pump', 'WP-001', '12V DC water pump for RV fresh water system', 89.99, 15
  WHERE NOT EXISTS (SELECT 1 FROM parts WHERE sku = 'WP-001' AND dealership_id = v_dealership_id);

  INSERT INTO parts (dealership_id, name, sku, description, price, in_stock_qty)
  SELECT v_dealership_id, 'Slide-Out Motor', 'SOM-100', 'Replacement motor for electric slide-outs', 249.99, 3
  WHERE NOT EXISTS (SELECT 1 FROM parts WHERE sku = 'SOM-100' AND dealership_id = v_dealership_id);

  INSERT INTO parts (dealership_id, name, sku, description, price, in_stock_qty)
  SELECT v_dealership_id, 'Roof Sealant', 'RS-050', 'Self-leveling lap sealant for EPDM roofs', 24.99, 42
  WHERE NOT EXISTS (SELECT 1 FROM parts WHERE sku = 'RS-050' AND dealership_id = v_dealership_id);

  INSERT INTO parts (dealership_id, name, sku, description, price, in_stock_qty)
  SELECT v_dealership_id, 'LED Light Strip', 'LED-12', '12V warm white LED strip, 16ft', 34.99, 28
  WHERE NOT EXISTS (SELECT 1 FROM parts WHERE sku = 'LED-12' AND dealership_id = v_dealership_id);

  INSERT INTO parts (dealership_id, name, sku, description, price, in_stock_qty)
  SELECT v_dealership_id, 'Converter/Charger', 'CC-45', '45 amp progressive dynamics converter', 189.99, 5
  WHERE NOT EXISTS (SELECT 1 FROM parts WHERE sku = 'CC-45' AND dealership_id = v_dealership_id);

  INSERT INTO parts (dealership_id, name, sku, description, price, in_stock_qty)
  SELECT v_dealership_id, 'Furnace Blower Motor', 'FBM-200', 'Suburban furnace blower motor', 79.99, 8
  WHERE NOT EXISTS (SELECT 1 FROM parts WHERE sku = 'FBM-200' AND dealership_id = v_dealership_id);

  -- Create a sample work order if none exist
  IF NOT EXISTS (SELECT 1 FROM work_orders WHERE dealership_id = v_dealership_id) AND v_rv1_id IS NOT NULL THEN
    INSERT INTO work_orders (
      dealership_id, rv_id, customer_id, issue_description, labor_hours, labor_rate,
      status, technician_notes, total_estimate
    ) VALUES (
      v_dealership_id,
      v_rv1_id,
      v_customer1_id,
      'Water pump making noise and losing pressure. Customer reports intermittent water flow.',
      2.5,
      95.00,
      'submitted',
      'Inspected pump - bearing failure confirmed. Recommend full replacement.',
      327.49
    );
  END IF;

  -- Create a welcome announcement if none exist
  IF NOT EXISTS (SELECT 1 FROM announcements WHERE dealership_id = v_dealership_id) THEN
    INSERT INTO announcements (dealership_id, title, message, audience)
    VALUES (
      v_dealership_id,
      'Welcome to RV Prophet!',
      'Your dealership account is set up and ready to go. Start by adding customers and creating work orders.',
      ARRAY['all']
    );
  END IF;

  RAISE NOTICE 'Seed data setup complete!';
  RAISE NOTICE 'Dealership ID: %', v_dealership_id;
END $$;
