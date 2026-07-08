-- YK FARMS POS - DATABASE SCHEMA
-- Paste this whole file into Supabase SQL Editor and click "Run"

-- 1. PRODUCTS: egg types/sizes you sell
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,               -- e.g. "Large Eggs", "Medium Eggs"
  unit text not null default 'crate', -- e.g. "crate", "piece"
  price numeric(10,2) not null,     -- price per unit
  current_stock integer not null default 0, -- how many units in stock right now
  low_stock_alert integer default 10, -- warn when stock drops below this
  created_at timestamptz default now()
);

-- 2. CUSTOMERS: retail and institutional buyers
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  customer_type text not null default 'retail', -- 'retail' or 'institutional'
  address text,
  created_at timestamptz default now()
);

-- 3. SALES: one row per transaction
create table sales (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  sale_date timestamptz default now(),
  total_amount numeric(10,2) not null default 0,
  amount_paid numeric(10,2) not null default 0,
  payment_status text not null default 'paid', -- 'paid', 'partial', 'unpaid'
  notes text,
  created_at timestamptz default now()
);

-- 4. SALE_ITEMS: line items within each sale
create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references sales(id) on delete cascade,
  product_id uuid references products(id),
  quantity integer not null,
  unit_price numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

-- 5. DEBTS: running balance owed per customer
create table debts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) unique,
  balance numeric(10,2) not null default 0,
  updated_at timestamptz default now()
);

-- 6. STOCK_MOVEMENTS: log of stock in/out, so current_stock always has a paper trail
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  movement_type text not null, -- 'in' (new supply) or 'out' (sold)
  quantity integer not null,
  reason text, -- e.g. "New delivery", "Sale #123", "Spoilage"
  created_at timestamptz default now()
);

-- Allow public access for now (we'll lock this down with proper auth later)
alter table products enable row level security;
alter table customers enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table debts enable row level security;
alter table stock_movements enable row level security;

create policy "Allow all for now" on products for all using (true) with check (true);
create policy "Allow all for now" on customers for all using (true) with check (true);
create policy "Allow all for now" on sales for all using (true) with check (true);
create policy "Allow all for now" on sale_items for all using (true) with check (true);
create policy "Allow all for now" on debts for all using (true) with check (true);
create policy "Allow all for now" on stock_movements for all using (true) with check (true);
