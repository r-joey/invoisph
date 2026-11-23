-- ==============================================================================
-- InvoisPH - BIR EoPT Service Invoicing & 8% Tax Tracker Database Schema
-- Optimized with Supabase Postgres & RLS Best Practices
-- ==============================================================================

-- 1. Profiles / User Business Settings
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  registered_business_name text, -- Trade name if registered (e.g. Juan De La Cruz Solutions)
  tin_number varchar(20),        -- 000-000-000-000 format
  rdo_code varchar(50),          -- e.g., "044 - Taguig / Pateros"
  registered_address text,
  is_vat_registered boolean default false,
  tax_regime varchar(30) default '8_percent_gross', -- '8_percent_gross' or 'graduated'
  currency_default varchar(5) default 'USD',
  next_invoice_number integer default 1,
  invoice_prefix varchar(10) default 'INV',
  logo_url text,
  onboarding_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Clients Table
create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  email text,
  country varchar(50) default 'United States',
  currency varchar(5) default 'USD',
  billing_address text,
  notes text,
  archived boolean default false,                          -- Soft-deleted from the directory until unarchived (Phase 2)
  manual_fx_rate numeric(10, 4),                            -- User-entered rate to PHP used when live FX data is unavailable (Phase 2)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Phase 2: idempotent migration for existing installs (create table is if-not-exists)
alter table public.clients add column if not exists archived boolean default false;
alter table public.clients add column if not exists manual_fx_rate numeric(10, 4);

-- 6. FX Rates Cache (Phase 2): Supabase-backed daily cache of exchange rates to PHP.
-- Service-role-only; rows are valid for ~24h from fetch time. The FX engine reads
-- the newest still-valid row before calling the live API.
create table if not exists public.fx_rates (
  id bigint generated always as identity primary key,
  source varchar(30) not null,                             -- 'live' | 'open_exchange'
  rates jsonb not null,                                    -- { "PHP": 1, "USD": 57.55, "EUR": 62.1, ... } rate of currency -> PHP
  fetched_at timestamptz not null default now(),
  valid_until timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Invoices Table (BIR EoPT Compliant Service Invoices)
create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  invoice_number varchar(50) not null, -- e.g., INV-0001
  issue_date date not null default current_date,
  due_date date not null,
  status varchar(20) default 'draft',  -- 'draft', 'sent', 'paid', 'cancelled'
  currency varchar(5) default 'USD',
  subtotal numeric(12, 2) not null default 0,
  discount numeric(12, 2) default 0,
  total_original_currency numeric(12, 2) not null default 0,
  
  -- BSP FX Rate fields
  bsp_fx_rate numeric(10, 4) not null default 1.0000, -- Exchange rate on invoice date
  total_in_php numeric(14, 2) not null default 0,      -- Calculated in PHP for BIR tracking
  
  -- BIR Specifics
  withholding_tax_rate numeric(5, 2) default 0, -- If local client deducts Form 2307 (usually 5% or 10%)
  withholding_tax_amount_php numeric(12, 2) default 0,
  net_amount_payable_php numeric(14, 2) not null default 0,
  payment_date date,
  payment_method varchar(30), -- 'Wise', 'PayPal', 'Direct Bank', 'GCash', 'Maya'
  notes_disclaimer text default 'THIS SERVICE INVOICE COMPLIES WITH RA 11976 (EASE OF PAYING TAXES ACT).',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Invoice Line Items
create table if not exists public.invoice_items (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  description text not null,
  rate_or_unit_price numeric(12, 2) not null,
  quantity numeric(8, 2) not null default 1,
  total_amount numeric(12, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Subscriptions / Payment Records
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan_tier varchar(20) default 'free', -- 'free', 'pro_monthly', 'pro_annual'
  status varchar(20) default 'active',  -- 'active', 'pending', 'past_due', 'cancelled'
  paymongo_payment_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance & fast RLS filtering
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_clients_user_id on public.clients(user_id);
create index if not exists idx_invoices_user_id on public.invoices(user_id);
create index if not exists idx_invoices_client_id on public.invoices(client_id);
create index if not exists idx_invoices_issue_date on public.invoices(issue_date);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoice_items_invoice_id on public.invoice_items(invoice_id);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_fx_rates_valid_until on public.fx_rates(valid_until);

-- Backstop for BIR sequential numbering: one number can never be reused per user.
-- The number itself is assigned by the set_invoice_number trigger at the end of
-- this file, so app code never has to compute or retry one.
create unique index if not exists uniq_invoices_user_invoice_number
  on public.invoices(user_id, invoice_number);

-- Explicit Data API permissions
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

-- Enable Row Level Security (RLS) on all exposed tables
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.subscriptions enable row level security;
alter table public.fx_rates enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Users can manage own profile" on public.profiles;
drop policy if exists "Users can manage own clients" on public.clients;
drop policy if exists "Users can manage own invoices" on public.invoices;
drop policy if exists "Users can manage items of own invoices" on public.invoice_items;
drop policy if exists "Users can read own subscription" on public.subscriptions;

-- High-performance RLS Policies (Wrapping auth.uid() in SELECT caches it per query)
create policy "Users can manage own profile" 
  on public.profiles 
  for all 
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can manage own clients" 
  on public.clients 
  for all 
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage own invoices" 
  on public.invoices 
  for all 
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can manage items of own invoices" 
  on public.invoice_items 
  for all 
  to authenticated
  using (
    exists (
      select 1 from public.invoices 
      where invoices.id = invoice_items.invoice_id and invoices.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.invoices 
      where invoices.id = invoice_items.invoice_id and invoices.user_id = (select auth.uid())
    )
  );

create policy "Users can read own subscription" 
  on public.subscriptions 
  for select 
  to authenticated
  using ((select auth.uid()) = user_id);

-- Secure Auto-provision profile trigger
-- Uses security definer with empty search_path to prevent hijacking
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  
  insert into public.subscriptions (user_id, plan_tier, status)
  values (new.id, 'free', 'active')
  on conflict do nothing;

  return new;
end;
$$;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================================================
-- Phase 3: BIR EoPT sequential Service Invoice numbering
-- ------------------------------------------------------------------------------
-- Callers insert an invoice with an empty invoice_number ('') and this BEFORE
-- INSERT trigger allocates the next number from the owner's profile counter in
-- the same transaction. Because the counter increment happens here:
--   * two concurrent inserts serialize on the profile row, so numbers can never
--     collide (the unique index above is the backstop, not the mechanism);
--   * a rolled-back insert also rolls back the increment, so a failed save does
--     not burn a number and leave a gap in the sequence.
-- The stored format is "<prefix>-<0001>", e.g. "INV-0001".
-- ==============================================================================

create or replace function public.assign_invoice_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  allocated integer;
  prefix text;
begin
  -- Explicit numbers (data imports / backfills) pass through untouched.
  if new.invoice_number is not null and btrim(new.invoice_number) <> '' then
    return new;
  end if;

  update public.profiles
     set next_invoice_number = coalesce(next_invoice_number, 1) + 1,
         updated_at = now()
   where id = new.user_id
  returning next_invoice_number - 1, invoice_prefix
    into allocated, prefix;

  if allocated is null then
    raise exception 'InvoisPH: no profile exists for user %', new.user_id;
  end if;

  new.invoice_number :=
    coalesce(nullif(btrim(prefix), ''), 'INV') || '-' || lpad(allocated::text, 4, '0');

  return new;
end;
$$;

drop trigger if exists set_invoice_number on public.invoices;
create trigger set_invoice_number
  before insert on public.invoices
  for each row execute function public.assign_invoice_number();
