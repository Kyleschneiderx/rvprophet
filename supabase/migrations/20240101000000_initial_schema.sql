-- RV Prophet Initial Schema Migration
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'technician');
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE work_order_status AS ENUM (
  'draft',
  'submitted',
  'approved',
  'rejected',
  'pending_customer_approval',
  'customer_approved',
  'customer_rejected',
  'completed'
);
CREATE TYPE notification_type AS ENUM (
  'work_order_submitted',
  'work_order_approved',
  'work_order_rejected',
  'customer_approved',
  'customer_rejected',
  'general'
);
CREATE TYPE approval_action AS ENUM ('sent', 'viewed', 'approved', 'rejected');
CREATE TYPE delivery_method AS ENUM ('sms', 'email');

-- Dealerships table (multi-tenant support)
CREATE TABLE dealerships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  default_labor_rate NUMERIC(10,2) NOT NULL DEFAULT 95.00,
  currency_symbol TEXT NOT NULL DEFAULT '$',
  default_terms TEXT DEFAULT 'Payment due upon completion of service.',
  parts_markup_percent NUMERIC(5,2) NOT NULL DEFAULT 25.00,
  technicians_see_pricing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'technician',
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RVs table
CREATE TABLE rvs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  vin TEXT NOT NULL,
  nickname TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Parts table
CREATE TABLE parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  in_stock_qty INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Work Orders table
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  rv_id UUID NOT NULL REFERENCES rvs(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  issue_description TEXT NOT NULL,
  labor_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  labor_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  status work_order_status NOT NULL DEFAULT 'draft',
  technician_notes TEXT,
  manager_notes TEXT,
  technician_id UUID REFERENCES profiles(id),
  total_estimate NUMERIC(10,2) NOT NULL DEFAULT 0,
  approval_token UUID,
  approval_token_expires_at TIMESTAMPTZ,
  pdf_path TEXT,
  customer_notes TEXT,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Work Order Parts junction table
CREATE TABLE work_order_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id),
  name TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Work Order Photos metadata table
CREATE TABLE work_order_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  audience TEXT[] NOT NULL DEFAULT ARRAY['all'],
  action_label TEXT,
  action_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'general',
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer Approval Logs table
CREATE TABLE customer_approval_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  action approval_action NOT NULL,
  delivery_method delivery_method,
  ip_address INET,
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_dealership ON profiles(dealership_id);
CREATE INDEX idx_customers_dealership ON customers(dealership_id);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_rvs_dealership ON rvs(dealership_id);
CREATE INDEX idx_rvs_customer ON rvs(customer_id);
CREATE INDEX idx_parts_dealership ON parts(dealership_id);
CREATE INDEX idx_work_orders_dealership ON work_orders(dealership_id);
CREATE INDEX idx_work_orders_rv ON work_orders(rv_id);
CREATE INDEX idx_work_orders_customer ON work_orders(customer_id);
CREATE INDEX idx_work_orders_technician ON work_orders(technician_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_approval_token ON work_orders(approval_token);
CREATE INDEX idx_work_order_parts_work_order ON work_order_parts(work_order_id);
CREATE INDEX idx_work_order_photos_work_order ON work_order_photos(work_order_id);
CREATE INDEX idx_announcements_dealership ON announcements(dealership_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_dealership ON notifications(dealership_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_approval_logs_work_order ON customer_approval_logs(work_order_id);

-- Helper function to get current user's dealership_id
CREATE OR REPLACE FUNCTION get_user_dealership_id()
RETURNS UUID AS $$
  SELECT dealership_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_dealerships_updated_at BEFORE UPDATE ON dealerships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rvs_updated_at BEFORE UPDATE ON rvs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE dealerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_approval_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Dealerships: users can only see their own dealership
CREATE POLICY "Users can view own dealership" ON dealerships
  FOR SELECT USING (id = get_user_dealership_id());

CREATE POLICY "Owners can update dealership" ON dealerships
  FOR UPDATE USING (id = get_user_dealership_id() AND get_user_role() = 'owner');

-- Profiles: users can see profiles in their dealership
CREATE POLICY "Users can view dealership profiles" ON profiles
  FOR SELECT USING (dealership_id = get_user_dealership_id());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Owners can manage profiles" ON profiles
  FOR ALL USING (dealership_id = get_user_dealership_id() AND get_user_role() = 'owner');

-- Customers: scoped to dealership
CREATE POLICY "Users can view dealership customers" ON customers
  FOR SELECT USING (dealership_id = get_user_dealership_id());

CREATE POLICY "Users can create customers" ON customers
  FOR INSERT WITH CHECK (dealership_id = get_user_dealership_id());

CREATE POLICY "Users can update dealership customers" ON customers
  FOR UPDATE USING (dealership_id = get_user_dealership_id());

-- RVs: scoped to dealership
CREATE POLICY "Users can view dealership rvs" ON rvs
  FOR SELECT USING (dealership_id = get_user_dealership_id());

CREATE POLICY "Users can create rvs" ON rvs
  FOR INSERT WITH CHECK (dealership_id = get_user_dealership_id());

CREATE POLICY "Users can update dealership rvs" ON rvs
  FOR UPDATE USING (dealership_id = get_user_dealership_id());

-- Parts: scoped to dealership
CREATE POLICY "Users can view dealership parts" ON parts
  FOR SELECT USING (dealership_id = get_user_dealership_id());

CREATE POLICY "Users can create parts" ON parts
  FOR INSERT WITH CHECK (dealership_id = get_user_dealership_id());

CREATE POLICY "Users can update dealership parts" ON parts
  FOR UPDATE USING (dealership_id = get_user_dealership_id());

-- Work Orders: technicians see own, managers/owners see all
CREATE POLICY "Technicians view own work orders" ON work_orders
  FOR SELECT USING (
    dealership_id = get_user_dealership_id()
    AND (
      get_user_role() IN ('owner', 'manager')
      OR technician_id = auth.uid()
    )
  );

CREATE POLICY "Users can create work orders" ON work_orders
  FOR INSERT WITH CHECK (dealership_id = get_user_dealership_id());

CREATE POLICY "Technicians update own work orders" ON work_orders
  FOR UPDATE USING (
    dealership_id = get_user_dealership_id()
    AND (
      get_user_role() IN ('owner', 'manager')
      OR technician_id = auth.uid()
    )
  );

-- Work Order Parts: follow work order access
CREATE POLICY "Users can view work order parts" ON work_order_parts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM work_orders wo
      WHERE wo.id = work_order_id
      AND wo.dealership_id = get_user_dealership_id()
    )
  );

CREATE POLICY "Users can manage work order parts" ON work_order_parts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM work_orders wo
      WHERE wo.id = work_order_id
      AND wo.dealership_id = get_user_dealership_id()
    )
  );

-- Work Order Photos: follow work order access
CREATE POLICY "Users can view work order photos" ON work_order_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM work_orders wo
      WHERE wo.id = work_order_id
      AND wo.dealership_id = get_user_dealership_id()
    )
  );

CREATE POLICY "Users can manage work order photos" ON work_order_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM work_orders wo
      WHERE wo.id = work_order_id
      AND wo.dealership_id = get_user_dealership_id()
    )
  );

-- Announcements: scoped to dealership
CREATE POLICY "Users can view dealership announcements" ON announcements
  FOR SELECT USING (dealership_id = get_user_dealership_id());

CREATE POLICY "Managers can manage announcements" ON announcements
  FOR ALL USING (
    dealership_id = get_user_dealership_id()
    AND get_user_role() IN ('owner', 'manager')
  );

-- Notifications: users see own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (dealership_id = get_user_dealership_id());

-- Customer Approval Logs: scoped to dealership via work order
CREATE POLICY "Users can view approval logs" ON customer_approval_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM work_orders wo
      WHERE wo.id = work_order_id
      AND wo.dealership_id = get_user_dealership_id()
    )
  );

CREATE POLICY "System can create approval logs" ON customer_approval_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_orders wo
      WHERE wo.id = work_order_id
      AND wo.dealership_id = get_user_dealership_id()
    )
  );

-- Public access for customer approval (via token)
CREATE POLICY "Public can view work order by approval token" ON work_orders
  FOR SELECT USING (
    approval_token IS NOT NULL
    AND approval_token_expires_at > NOW()
  );

-- Analytics Views

-- Revenue metrics view
CREATE OR REPLACE VIEW revenue_metrics AS
SELECT
  DATE_TRUNC('day', wo.updated_at)::DATE as date,
  SUM(wo.total_estimate) as total_revenue,
  SUM((
    SELECT COALESCE(SUM(wop.unit_price * wop.quantity), 0)
    FROM work_order_parts wop
    WHERE wop.work_order_id = wo.id
  )) as parts_revenue,
  SUM(wo.labor_hours * wo.labor_rate) as labor_revenue,
  COUNT(*)::INTEGER as order_count
FROM work_orders wo
WHERE wo.status = 'completed'
  AND wo.dealership_id = get_user_dealership_id()
GROUP BY DATE_TRUNC('day', wo.updated_at)
ORDER BY date DESC;

-- Technician productivity view
CREATE OR REPLACE VIEW technician_productivity AS
SELECT
  p.id as technician_id,
  p.name as technician_name,
  COUNT(wo.id)::INTEGER as total_orders,
  COUNT(wo.id) FILTER (WHERE wo.status = 'completed')::INTEGER as completed_orders,
  COALESCE(SUM(wo.total_estimate) FILTER (WHERE wo.status = 'completed'), 0) as total_revenue,
  AVG(EXTRACT(EPOCH FROM (wo.updated_at - wo.created_at)) / 3600)
    FILTER (WHERE wo.status = 'completed') as avg_completion_time_hours
FROM profiles p
LEFT JOIN work_orders wo ON wo.technician_id = p.id
WHERE p.dealership_id = get_user_dealership_id()
  AND p.role = 'technician'
  AND p.status = 'active'
GROUP BY p.id, p.name;

-- Work order funnel view
CREATE OR REPLACE VIEW work_order_funnel AS
SELECT
  DATE_TRUNC('week', created_at)::DATE as week_start,
  COUNT(*) FILTER (WHERE status = 'draft')::INTEGER as draft_count,
  COUNT(*) FILTER (WHERE status = 'submitted')::INTEGER as submitted_count,
  COUNT(*) FILTER (WHERE status IN ('approved', 'pending_customer_approval', 'customer_approved'))::INTEGER as approved_count,
  COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_count
FROM work_orders
WHERE dealership_id = get_user_dealership_id()
  AND created_at > NOW() - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week_start DESC;

-- Create storage bucket for work order photos
-- Note: Run this in Supabase Dashboard > Storage > New bucket
-- Bucket name: work-order-photos
-- Public: false
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Storage policies (run after creating bucket)
-- Allow authenticated users to upload to their dealership folder
-- INSERT: storage.foldername(name)[1] = get_user_dealership_id()::text
-- SELECT: storage.foldername(name)[1] = get_user_dealership_id()::text
-- DELETE: storage.foldername(name)[1] = get_user_dealership_id()::text

-- Notification trigger for work order status changes
CREATE OR REPLACE FUNCTION notify_work_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_managers UUID[];
  v_manager_id UUID;
  v_technician_id UUID;
  v_dealership_id UUID;
  v_notification_type notification_type;
  v_title TEXT;
  v_message TEXT;
BEGIN
  -- Only process if status changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  v_dealership_id := NEW.dealership_id;
  v_technician_id := NEW.technician_id;

  -- Determine notification type and recipients based on new status
  CASE NEW.status
    WHEN 'submitted' THEN
      v_notification_type := 'work_order_submitted';
      v_title := 'Work Order Submitted';
      v_message := 'A work order has been submitted for review.';
      -- Notify all managers and owners
      SELECT ARRAY_AGG(id) INTO v_managers
      FROM profiles
      WHERE dealership_id = v_dealership_id
        AND role IN ('manager', 'owner')
        AND status = 'active';

      IF v_managers IS NOT NULL THEN
        FOREACH v_manager_id IN ARRAY v_managers LOOP
          INSERT INTO notifications (user_id, dealership_id, title, message, type, work_order_id)
          VALUES (v_manager_id, v_dealership_id, v_title, v_message, v_notification_type, NEW.id);
        END LOOP;
      END IF;

    WHEN 'approved' THEN
      v_notification_type := 'work_order_approved';
      v_title := 'Work Order Approved';
      v_message := 'Your work order has been approved by management.';
      -- Notify technician
      IF v_technician_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, dealership_id, title, message, type, work_order_id)
        VALUES (v_technician_id, v_dealership_id, v_title, v_message, v_notification_type, NEW.id);
      END IF;

    WHEN 'rejected' THEN
      v_notification_type := 'work_order_rejected';
      v_title := 'Work Order Rejected';
      v_message := 'Your work order has been rejected. Please review manager notes.';
      -- Notify technician
      IF v_technician_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, dealership_id, title, message, type, work_order_id)
        VALUES (v_technician_id, v_dealership_id, v_title, v_message, v_notification_type, NEW.id);
      END IF;

    WHEN 'customer_approved' THEN
      v_notification_type := 'customer_approved';
      v_title := 'Customer Approved Work Order';
      v_message := 'The customer has approved the work order estimate.';
      -- Notify managers and technician
      SELECT ARRAY_AGG(id) INTO v_managers
      FROM profiles
      WHERE dealership_id = v_dealership_id
        AND role IN ('manager', 'owner')
        AND status = 'active';

      IF v_managers IS NOT NULL THEN
        FOREACH v_manager_id IN ARRAY v_managers LOOP
          INSERT INTO notifications (user_id, dealership_id, title, message, type, work_order_id)
          VALUES (v_manager_id, v_dealership_id, v_title, v_message, v_notification_type, NEW.id);
        END LOOP;
      END IF;

      IF v_technician_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, dealership_id, title, message, type, work_order_id)
        VALUES (v_technician_id, v_dealership_id, v_title, v_message, v_notification_type, NEW.id);
      END IF;

    WHEN 'customer_rejected' THEN
      v_notification_type := 'customer_rejected';
      v_title := 'Customer Rejected Work Order';
      v_message := 'The customer has rejected the work order estimate.';
      -- Notify managers and technician
      SELECT ARRAY_AGG(id) INTO v_managers
      FROM profiles
      WHERE dealership_id = v_dealership_id
        AND role IN ('manager', 'owner')
        AND status = 'active';

      IF v_managers IS NOT NULL THEN
        FOREACH v_manager_id IN ARRAY v_managers LOOP
          INSERT INTO notifications (user_id, dealership_id, title, message, type, work_order_id)
          VALUES (v_manager_id, v_dealership_id, v_title, v_message, v_notification_type, NEW.id);
        END LOOP;
      END IF;

      IF v_technician_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, dealership_id, title, message, type, work_order_id)
        VALUES (v_technician_id, v_dealership_id, v_title, v_message, v_notification_type, NEW.id);
      END IF;

    ELSE
      -- No notification for other status changes
      NULL;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER work_order_status_notification
  AFTER UPDATE OF status ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_work_order_status_change();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
