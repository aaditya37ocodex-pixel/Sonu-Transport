-- Sonu Transport company ledger. Money is integer paise. Timestamps are UTC.

create table if not exists company (
  id text primary key,
  legal_name text not null,
  display_name text not null,
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  gstin text not null default '',
  currency text not null default 'INR',
  timezone text not null default 'Asia/Kolkata',
  tax_bps integer not null default 0 check (tax_bps >= 0 and tax_bps <= 4000),
  trip_prefix text not null default 'TR',
  invoice_prefix text not null default 'INV',
  next_trip_no integer not null default 1001,
  next_invoice_no integer not null default 1001,
  recovery_code_hash text not null,
  recovery_is_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists trucks (
  id text primary key,
  company_id text not null references company (id),
  name text not null,
  plate text not null,
  plate_norm text not null,
  capacity_value numeric(12, 2),
  capacity_unit text not null default 'tonnes',
  notes text not null default '',
  service_hold boolean not null default false,
  archived_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, plate_norm)
);

create table if not exists customers (
  id text primary key,
  company_id text not null references company (id),
  name text not null,
  phone text not null default '',
  billing_address text not null default '',
  gstin text not null default '',
  notes text not null default '',
  archived_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists drivers (
  id text primary key,
  company_id text not null references company (id),
  name text not null,
  phone text not null default '',
  license_no text not null default '',
  license_expiry date,
  status text not null default 'active' check (status in ('active', 'inactive')),
  notes text not null default '',
  archived_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists staff_profiles (
  user_id text primary key references "user" (id) on delete cascade,
  company_id text not null references company (id),
  role text not null check (role in ('owner', 'dispatcher', 'accounts', 'driver')),
  phone text not null default '',
  driver_id text references drivers (id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists trips (
  id text primary key,
  company_id text not null references company (id),
  trip_number text not null,
  customer_id text not null references customers (id),
  truck_id text references trucks (id),
  driver_id text references drivers (id),
  origin text not null,
  destination text not null,
  scheduled_departure_at timestamptz not null,
  expected_arrival_at timestamptz,
  actual_departure_at timestamptz,
  actual_arrival_at timestamptz,
  goods_description text not null default '',
  weight_value numeric(12, 2),
  weight_unit text not null default 'tonnes',
  freight_paise integer not null default 0 check (freight_paise >= 0),
  status text not null check (status in ('draft', 'booked', 'in_progress', 'delivered', 'closed', 'cancelled')),
  notes text not null default '',
  source_trip_id text references trips (id),
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, trip_number)
);

create table if not exists fuel_logs (
  id text primary key,
  company_id text not null references company (id),
  truck_id text not null references trucks (id),
  trip_id text references trips (id),
  logged_at timestamptz not null,
  odometer_km integer,
  quantity_ml integer,
  total_paise integer not null check (total_paise >= 0),
  vendor_name text not null default '',
  notes text not null default '',
  flagged boolean not null default false,
  flag_reason text not null default '',
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id text primary key,
  company_id text not null references company (id),
  truck_id text references trucks (id),
  trip_id text references trips (id),
  category text not null check (category in ('toll', 'repair', 'tyres', 'parts', 'loading', 'driver_allowance', 'other')),
  expense_date date not null,
  amount_paise integer not null check (amount_paise >= 0),
  vendor_name text not null default '',
  description text not null default '',
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id text primary key,
  company_id text not null references company (id),
  invoice_number text not null,
  customer_id text not null references customers (id),
  trip_id text references trips (id),
  issue_date date not null,
  due_date date not null,
  subtotal_paise integer not null check (subtotal_paise >= 0),
  tax_paise integer not null check (tax_paise >= 0),
  total_paise integer not null check (total_paise >= 0),
  status text not null check (status in ('issued', 'partial', 'paid', 'void')),
  notes text not null default '',
  created_by text,
  created_at timestamptz not null default now(),
  unique (company_id, invoice_number)
);

create table if not exists payments (
  id text primary key,
  company_id text not null references company (id),
  direction text not null check (direction in ('in', 'out')),
  customer_id text references customers (id),
  trip_id text references trips (id),
  payment_date date not null,
  amount_paise integer not null check (amount_paise > 0),
  method text not null check (method in ('cash', 'upi', 'bank', 'cheque', 'other')),
  reference text not null default '',
  notes text not null default '',
  kind text not null default 'receipt' check (kind in ('receipt', 'advance', 'supplier')),
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists payment_allocations (
  id text primary key,
  payment_id text not null references payments (id) on delete cascade,
  invoice_id text not null references invoices (id),
  amount_paise integer not null check (amount_paise > 0),
  unique (payment_id, invoice_id)
);

create table if not exists adjustments (
  id text primary key,
  company_id text not null references company (id),
  customer_id text not null references customers (id),
  invoice_id text references invoices (id),
  amount_paise integer not null,
  reason text not null,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists maintenance_events (
  id text primary key,
  company_id text not null references company (id),
  truck_id text not null references trucks (id),
  event_type text not null,
  scheduled_on date not null,
  blocks_until date not null,
  completed_on date,
  odometer_km integer,
  cost_paise integer not null default 0 check (cost_paise >= 0),
  vendor_name text not null default '',
  notes text not null default '',
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists tyre_records (
  id text primary key,
  company_id text not null references company (id),
  truck_id text not null references trucks (id),
  identifier text not null,
  position text not null default '',
  installed_on date not null,
  installed_odometer integer,
  removed_on date,
  removed_odometer integer,
  cost_paise integer,
  notes text not null default '',
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id text primary key,
  company_id text not null references company (id),
  entity_type text not null check (entity_type in ('truck', 'driver', 'trip', 'customer', 'company')),
  entity_id text not null,
  document_type text not null,
  document_number text not null default '',
  issue_date date,
  expiry_date date,
  filename text not null default '',
  mime_type text not null default '',
  size_bytes integer not null default 0,
  content_base64 text,
  notes text not null default '',
  uploaded_by text,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id text primary key,
  company_id text not null references company (id),
  actor_user_id text,
  action text not null,
  entity_type text not null,
  entity_id text not null default '',
  summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists auth_attempts (
  id text primary key,
  email text not null,
  kind text not null,
  created_at timestamptz not null default now()
);

create index if not exists trips_truck_window_idx
  on trips (company_id, truck_id, status, scheduled_departure_at);
create index if not exists invoices_customer_idx on invoices (company_id, customer_id, issue_date);
create index if not exists payments_customer_idx on payments (company_id, customer_id, payment_date);
create index if not exists documents_expiry_idx on documents (company_id, expiry_date);
create index if not exists audit_company_idx on audit_logs (company_id, created_at desc);
create index if not exists fuel_truck_idx on fuel_logs (company_id, truck_id, logged_at);
create index if not exists auth_attempts_idx on auth_attempts (email, created_at);
