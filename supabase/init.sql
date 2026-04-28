create extension if not exists "uuid-ossp";

-- Supabase SQL to create clients table
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  first_name text,
  middle_name text,
  last_name text,
  document text,
  email text,
  contact text,
  address text,
  created_at timestamptz default now()
);

alter table public.clients enable row level security;
drop policy if exists clients_read_all on public.clients;
create policy clients_read_all on public.clients
  for select to anon, authenticated
  using (true);
drop policy if exists clients_write_all on public.clients;
create policy clients_write_all on public.clients
  for all to anon, authenticated
  using (true)
  with check (true);

-- Repairs table
create table if not exists public.repairs (
  id uuid primary key default uuid_generate_v4(),
  nro text,
  client_id uuid references public.clients(id),
  client_name text,
  client_rut text,
  correo text,
  telefono text,
  tipo_dcto text,
  estado_pago text,
  estado_reparacion text,
  tipo_pago text,
  tipo_equipo text,
  marca text,
  modelo text,
  serie text,
  accesorios text,
  falla text,
  diagnostico text,
  observacion text,
  servicios jsonb,
  repuestos jsonb,
  created_at timestamptz default now()
);

alter table public.repairs enable row level security;
drop policy if exists repairs_read_all on public.repairs;
create policy repairs_read_all on public.repairs
  for select to anon, authenticated
  using (true);
drop policy if exists repairs_write_all on public.repairs;
create policy repairs_write_all on public.repairs
  for all to anon, authenticated
  using (true)
  with check (true);

-- Ensure correo, telefono and diagnostico columns exist if the table was created earlier without them
alter table if exists public.repairs add column if not exists correo text;
alter table if exists public.repairs add column if not exists telefono text;
alter table if exists public.repairs add column if not exists diagnostico text;

-- Users table for admin/worker accounts (profiles linked to Supabase Auth - auth.users.uuid)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  auth_uid uuid,
  email text unique,
  first_name text,
  last_name text,
  role text default 'worker', -- 'admin' or 'worker'
  created_at timestamptz default now()
);

alter table public.users enable row level security;
drop policy if exists users_read_all on public.users;
create policy users_read_all on public.users
  for select to anon, authenticated
  using (true);
drop policy if exists users_write_all on public.users;
create policy users_write_all on public.users
  for all to anon, authenticated
  using (true)
  with check (true);

-- Add a local_password column for temporary local admin password storage (optional)
alter table if exists public.users add column if not exists local_password text;

-- Function to compute total historic sum (net + IVA) for all repairs
-- Use CREATE OR REPLACE to make this idempotent when re-applying the script
create or replace function public.total_historic_sum()
returns numeric
language sql
stable
as $$
  select coalesce(sum(
    (
      coalesce((select sum((elem->>'value')::numeric) from jsonb_array_elements(servicios) as elem), 0)
      + coalesce((select sum((elem->>'price')::numeric) from jsonb_array_elements(repuestos) as elem), 0)
    ) * 1.19
  ), 0)
  from public.repairs;
$$;

-- Brands and Models tables for device metadata
create table if not exists public.brands (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  created_at timestamptz default now()
);

alter table public.brands enable row level security;
drop policy if exists brands_read_all on public.brands;
create policy brands_read_all on public.brands
  for select to anon, authenticated
  using (true);
drop policy if exists brands_write_all on public.brands;
create policy brands_write_all on public.brands
  for all to anon, authenticated
  using (true)
  with check (true);

create table if not exists public.models (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  brand_id uuid references public.brands(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.models enable row level security;
drop policy if exists models_read_all on public.models;
create policy models_read_all on public.models
  for select to anon, authenticated
  using (true);
drop policy if exists models_write_all on public.models;
create policy models_write_all on public.models
  for all to anon, authenticated
  using (true)
  with check (true);

-- Device types table (Tipo Equipo autogestionable)
create table if not exists public.device_types (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  created_at timestamptz default now()
);

alter table public.device_types enable row level security;
drop policy if exists device_types_read_all on public.device_types;
create policy device_types_read_all on public.device_types
  for select to anon, authenticated
  using (true);
drop policy if exists device_types_write_all on public.device_types;
create policy device_types_write_all on public.device_types
  for all to anon, authenticated
  using (true)
  with check (true);
