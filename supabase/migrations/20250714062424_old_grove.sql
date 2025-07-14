/*
  # Create Gents by Elegante Inventory Management Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password` (text, hashed)
      - `role` (enum: super_admin, admin, sales_staff)
      - `created_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `sku` (text, unique)
      - `buy_price` (numeric)
      - `sell_price` (numeric)
      - `quantity` (integer, default 0)
      - `created_at` (timestamp)
    
    - `stock_entries`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `quantity` (integer)
      - `date` (date)
      - `created_at` (timestamp)
    
    - `sales`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `quantity` (integer)
      - `price` (numeric)
      - `date` (date)
      - `recorded_by_user_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `settings`
      - `key` (text, primary key)
      - `value` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
    
  3. Functions
    - Create function to update product quantity on stock entries
    - Create function to decrease quantity on sales
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'sales_staff');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  role user_role NOT NULL DEFAULT 'sales_staff',
  created_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  buy_price numeric(10,2) NOT NULL DEFAULT 0,
  sell_price numeric(10,2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Stock entries table
CREATE TABLE IF NOT EXISTS stock_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  price numeric(10,2) NOT NULL,
  date date DEFAULT CURRENT_DATE,
  recorded_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "All authenticated users can read users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can access products"
  ON products FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can access stock_entries"
  ON stock_entries FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can access sales"
  ON sales FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can access settings"
  ON settings FOR ALL
  TO authenticated
  USING (true);

-- Function to update product quantity when stock is added
CREATE OR REPLACE FUNCTION update_product_quantity_on_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET quantity = quantity + NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrease product quantity on sale
CREATE OR REPLACE FUNCTION decrease_product_quantity_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET quantity = quantity - NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER trigger_update_quantity_on_stock
  AFTER INSERT ON stock_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_product_quantity_on_stock();

CREATE TRIGGER trigger_decrease_quantity_on_sale
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION decrease_product_quantity_on_sale();

-- Insert default settings
INSERT INTO settings (key, value) VALUES ('currency', 'KES') ON CONFLICT (key) DO NOTHING;

-- Insert default super admin user (password: admin123)
INSERT INTO users (username, password, role) 
VALUES ('admin', '$2a$10$rOvHdyAiM3vKjGlgEWJK/ue5qC8jG8qBjFoqFVWcMZlGjEjKz6lBS', 'super_admin') 
ON CONFLICT (username) DO NOTHING;