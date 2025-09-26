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
  observacion text,
  servicios jsonb,
  repuestos jsonb,
  created_at timestamptz default now()
);

-- Ensure correo and telefono columns exist if the table was created earlier without them
alter table if exists public.repairs add column if not exists correo text;
alter table if exists public.repairs add column if not exists telefono text;

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

create table if not exists public.models (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  brand_id uuid references public.brands(id) on delete set null,
  created_at timestamptz default now()
);

-- Device types table (Tipo Equipo autogestionable)
create table if not exists public.device_types (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  created_at timestamptz default now()
);
