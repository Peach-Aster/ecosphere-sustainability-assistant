/*
  # EcoSphere Sustainability Assistant Database Schema

  ## Overview
  Creates the database schema for the EcoSphere sustainability tracking application.
  
  ## New Tables
  
  ### `activities`
  Stores user carbon tracking activities (transport, energy, diet)
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `activity_type` (text: 'transport', 'energy', 'diet')
  - `activity_name` (text: specific activity like 'car', 'bike', 'electricity')
  - `value` (numeric: distance in km, energy in kWh, meals count)
  - `unit` (text: 'km', 'kwh', 'meals')
  - `carbon_emissions` (numeric: calculated CO2 in kg)
  - `date` (date: when activity occurred)
  - `created_at` (timestamptz)
  
  ### `carbon_scores`
  Stores daily aggregated carbon footprint scores
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `date` (date)
  - `total_emissions` (numeric: total CO2 in kg for the day)
  - `transport_emissions` (numeric)
  - `energy_emissions` (numeric)
  - `diet_emissions` (numeric)
  - `score` (integer: 0-100, higher is better/lower emissions)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### `products`
  Stores product sustainability information for eco-scanner
  - `id` (uuid, primary key)
  - `name` (text)
  - `category` (text)
  - `sustainability_score` (integer: 1-100)
  - `carbon_footprint` (numeric: kg CO2)
  - `eco_certifications` (text array)
  - `alternatives` (jsonb: suggested eco-friendly alternatives)
  - `description` (text)
  - `created_at` (timestamptz)
  
  ### `chat_messages`
  Stores AI sustainability coach chat history
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `role` (text: 'user' or 'assistant')
  - `content` (text)
  - `created_at` (timestamptz)
  
  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Products table is readable by all authenticated users
  
  ## Notes
  - All tables use UUIDs for primary keys
  - Foreign keys reference auth.users for user association
  - Timestamps use timestamptz for proper timezone handling
  - Carbon emissions calculated in kg CO2 equivalent
*/

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('transport', 'energy', 'diet')),
  activity_name text NOT NULL,
  value numeric NOT NULL CHECK (value >= 0),
  unit text NOT NULL,
  carbon_emissions numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activities
CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities"
  ON activities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
  ON activities FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create carbon_scores table
CREATE TABLE IF NOT EXISTS carbon_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  total_emissions numeric NOT NULL DEFAULT 0,
  transport_emissions numeric NOT NULL DEFAULT 0,
  energy_emissions numeric NOT NULL DEFAULT 0,
  diet_emissions numeric NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 100 CHECK (score >= 0 AND score <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_carbon_scores_user_date ON carbon_scores(user_id, date DESC);

-- Enable RLS
ALTER TABLE carbon_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for carbon_scores
CREATE POLICY "Users can view own carbon scores"
  ON carbon_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own carbon scores"
  ON carbon_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own carbon scores"
  ON carbon_scores FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own carbon scores"
  ON carbon_scores FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  sustainability_score integer NOT NULL CHECK (sustainability_score >= 1 AND sustainability_score <= 100),
  carbon_footprint numeric NOT NULL DEFAULT 0,
  eco_certifications text[] DEFAULT '{}',
  alternatives jsonb DEFAULT '[]',
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created ON chat_messages(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert sample products for eco-scanner
INSERT INTO products (name, category, sustainability_score, carbon_footprint, eco_certifications, alternatives, description) VALUES
  ('Plastic Water Bottle (Single-Use)', 'Beverages', 15, 0.082, ARRAY[]::text[], 
   '[{"name": "Reusable Stainless Steel Bottle", "score": 95, "savings": "Save 156kg CO2/year"}]'::jsonb,
   'Single-use plastic bottle with high environmental impact'),
  
  ('Reusable Stainless Steel Bottle', 'Beverages', 95, 0.001, ARRAY['BPA-Free', 'Recyclable'],
   '[]'::jsonb,
   'Durable, reusable water bottle that eliminates single-use plastic'),
  
  ('Beef (1kg)', 'Food', 20, 27.0, ARRAY[]::text[],
   '[{"name": "Plant-Based Protein", "score": 85, "savings": "Save 26kg CO2 per kg"}, {"name": "Chicken (1kg)", "score": 60, "savings": "Save 20kg CO2 per kg"}]'::jsonb,
   'High carbon footprint due to methane emissions and land use'),
  
  ('LED Light Bulb', 'Home', 90, 0.045, ARRAY['Energy Star'],
   '[]'::jsonb,
   'Energy-efficient lighting with 80% less energy consumption than incandescent'),
  
  ('Incandescent Light Bulb', 'Home', 25, 0.250, ARRAY[]::text[],
   '[{"name": "LED Light Bulb", "score": 90, "savings": "Save 82% energy"}]'::jsonb,
   'Inefficient lighting technology with high energy consumption'),
  
  ('Electric Vehicle', 'Transportation', 85, 0.053, ARRAY['Zero Emissions'],
   '[]'::jsonb,
   'Electric vehicle with significantly lower emissions than gasoline cars'),
  
  ('Gasoline Car', 'Transportation', 30, 0.192, ARRAY[]::text[],
   '[{"name": "Electric Vehicle", "score": 85, "savings": "Save 72% emissions"}, {"name": "Public Transit", "score": 75, "savings": "Save 80% emissions"}]'::jsonb,
   'Internal combustion engine vehicle with high carbon emissions'),
  
  ('Organic Cotton T-Shirt', 'Clothing', 80, 2.1, ARRAY['Organic', 'Fair Trade'],
   '[]'::jsonb,
   'Sustainably produced cotton clothing with minimal pesticide use'),
  
  ('Conventional Cotton T-Shirt', 'Clothing', 45, 5.5, ARRAY[]::text[],
   '[{"name": "Organic Cotton T-Shirt", "score": 80, "savings": "Save 62% water, 3.4kg CO2"}, {"name": "Recycled Polyester T-Shirt", "score": 75, "savings": "Save 70% energy"}]'::jsonb,
   'Standard cotton production with high water and pesticide use'),
  
  ('Solar Panel (per kW)', 'Energy', 92, 0.041, ARRAY['Clean Energy'],
   '[]'::jsonb,
   'Renewable energy generation with minimal ongoing emissions'),
  
  ('Coal Energy (per kWh)', 'Energy', 10, 0.820, ARRAY[]::text[],
   '[{"name": "Solar Panel", "score": 92, "savings": "Save 95% emissions"}, {"name": "Wind Energy", "score": 90, "savings": "Save 97% emissions"}]'::jsonb,
   'Fossil fuel energy with highest carbon emissions'),
  
  ('Bamboo Toothbrush', 'Personal Care', 88, 0.005, ARRAY['Biodegradable', 'Sustainable'],
   '[]'::jsonb,
   'Eco-friendly toothbrush made from sustainable bamboo'),
  
  ('Plastic Toothbrush', 'Personal Care', 35, 0.058, ARRAY[]::text[],
   '[{"name": "Bamboo Toothbrush", "score": 88, "savings": "Save 0.053kg CO2, biodegradable"}]'::jsonb,
   'Standard plastic toothbrush that takes 400+ years to decompose')
ON CONFLICT DO NOTHING;