# InvoisPH — Master Product & Development Blueprint
**The BIR-Compliant Invoicing, EoPT Service Invoicing, & 8% Flat Tax Tracker for Filipino Freelancers and Remote Workers**

---

## 1. Executive Summary & Product Vision

### 1.1 The Core Problem
Under Republic Act No. 11976 (the **Ease of Paying Taxes Act / EoPT**), all service providers and freelancers in the Philippines are required to transition from "Official Receipts" (OR) to **"Service Invoices" (SI)**. 

Filipino freelancers (Virtual Assistants, software engineers, digital marketers earning in USD/EUR/AUD on Upwork, Wise, Payoneer, or direct bank transfer) face three critical bottlenecks:
1. **Invoice Non-Compliance:** Unsure how to format BIR-mandated Service Invoices, assign sequential numbering, or declare foreign currency according to Bangko Sentral ng Pilipinas (BSP) exchange rates.
2. **Tax Anxiety & eBIRForms Confusion:** Most qualify for the **8% Flat Income Tax Rate**, but calculating the ₱250,000 statutory deduction across quarters and mapping values to `BIR Form 1701Q` and `1701A` is terrifying. Traditional CPAs charge ₱2,000–₱5,000/month.
3. **Visa & Bank Loan Rejections:** Freelancers struggle to prove steady income to foreign embassies (Japan/Schengen/US visas) or local banks (credit cards, auto/home loans) without clean, stamped earnings records.

### 1.2 The Solution: InvoisPH
A streamlined, mobile-friendly micro-SaaS designed for solo Filipino freelancers.
* Generates **legally compliant BIR Service Invoices** with auto-fetched BSP FX rates in seconds.
* Live-tracks cumulative quarterly gross receipts and maps exact line-item values to **eBIRForms 1701Q / 1701A**.
* Generates a **Bank/Visa Proof-of-Income Certificate** at the tap of a button.
* Monetized via local Philippine payment channels (**GCash, Maya, and QR Ph**).

---

## 2. Brand Identity & Design System

### 2.1 Brand Name & Tagline
* **Name:** `InvoisPH` (clean, localized phonetic spelling of "Invoice")
* **Tagline:** *"Zero-Anxiety Invoicing & 8% BIR Tax Tracking for Filipino Freelancers."*
* **Domain Candidates:** `invoisph.com`, `invois.ph`, `resibo.io`

### 2.2 Color Palette
| Token | Hex Code | Purpose / UI Placement |
| :--- | :--- | :--- |
| **Primary (Philippine Navy)** | `#0B192C` | Headers, primary navigation, strong text, dark mode bases |
| **Brand Accent (Selyo Blue)** | `#1E40AF` | Primary buttons, active states, brand marks |
| **Success / Tax-Paid Green** | `#10B981` | Paid status badges, ₱250,000 threshold meter, revenue graphs |
| **Alert / Due Date Amber** | `#F59E0B` | Upcoming tax deadline countdowns, unpaid invoice alerts |
| **Danger / Overdue Red** | `#EF4444` | Overdue invoices, missing TIN errors |
| **Neutral Background** | `#F8FAFC` | Light mode page background (Slate 50) |
| **Card Surface** | `#FFFFFF` | Tables, invoice sheets, dialog windows |
| **Text Primary** | `#0F172A` | Slate 900 body copy |
| **Text Secondary** | `#64748B` | Slate 500 helper labels, placeholders |

### 2.3 Typography
* **Primary Sans (UI & Marketing):** `Plus Jakarta Sans` or `Inter` (Google Fonts)
  * Clean, highly legible on mobile screens, authoritative yet approachable.
* **Numeric / Financial Monospace:** `JetBrains Mono` or `Geist Mono`
  * Applied to currency values (PHP, USD), invoice numbers, TIN inputs, and tax forms for precision alignment.

### 2.4 App Logo Specifications
The logo combines a digital document/stamp (representing the BIR "Selyo" or Service Invoice) with an upward growth tick in emerald and navy.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 48" width="200" height="48" fill="none">
  <!-- Icon Mark: Document + Check Stamp -->
  <rect x="4" y="6" width="36" height="36" rx="8" fill="#0B192C"/>
  <path d="M12 16H32" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M12 22H26" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M12 28H20" stroke="#94A3B8" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="30" cy="30" r="7" fill="#10B981"/>
  <path d="M27.5 30L29.5 32L33 28.5" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  
  <!-- Typography -->
  <text x="48" y="32" font-family="'Plus Jakarta Sans', sans-serif" font-weight="800" font-size="24" fill="#0B192C" letter-spacing="-0.5">Invois<tspan fill="#1E40AF">PH</tspan></text>
</svg>
```

---

## 3. Technology Stack & Operational Cost Architecture

Target operational cost: **₱0 to under $10/month** until reaching 200+ paying users.

```
+--------------------------------------------------------------------------+
|                                FRONTEND                                  |
|         Next.js 14/15 (App Router, React Server Components, TS)          |
|         Tailwind CSS v3/v4 + shadcn/ui + Lucide Icons + TanStack Table    |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
|                           BACKEND & DATABASE                             |
|         Supabase (PostgreSQL 15+, Row Level Security, Edge Functions)    |
|         Auth: Supabase Auth (Google OAuth + Magic Link / Email)          |
|         Storage: Supabase Storage (User branding/logos, PDF archives)    |
+--------------------------------------------------------------------------+
          |                                              |
          v                                              v
+-----------------------------+              +-----------------------------+
|        PDF GENERATOR        |              |     PAYMENT GATEWAY (PH)    |
|  @react-pdf/renderer (Edge) |              |  PayMongo / Xendit API      |
|  Client & Server-side PDF   |              |  (GCash, Maya, QR Ph, Card) |
+-----------------------------+              +-----------------------------+
          |                                              |
          v                                              v
+-----------------------------+              +-----------------------------+
|      EXCHANGE RATE SYNC     |              |     HOSTING & DEPLOYMENT    |
|  BSP Daily Exchange Scraper |              |  Vercel Hobby Tier (Free)   |
|  or Free OpenExchangeRates  |              |  Custom Domain via Cloudflare|
+-----------------------------+              +-----------------------------+
```

### Detailed Dependencies:
* **Framework:** Next.js (TypeScript)
* **UI Components:** `shadcn/ui` (Radix UI primitives)
* **Form Handling & Validation:** `react-hook-form` + `zod`
* **Data Fetching:** TanStack React Query + Supabase JS Client
* **PDF Engine:** `@react-pdf/renderer` (deterministic client/server rendering matching BIR layout requirements)
* **Date Utilities:** `date-fns`

---

## 4. Database Schema (PostgreSQL / Supabase DDL)

Copy-paste this schema directly into Supabase SQL editor:

```sql
-- 1. Profiles / User Business Settings
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  registered_business_name text, -- Trade name if registered
  tin_number varchar(20),        -- 000-000-000-000 format
  rdo_code varchar(10),          -- e.g., "044 - Taguig"
  registered_address text,
  is_vat_registered boolean default false,
  tax_regime varchar(30) default '8_percent_gross', -- '8_percent_gross' or 'graduated'
  currency_default varchar(5) default 'USD',
  next_invoice_number integer default 1,
  invoice_prefix varchar(10) default 'INV',
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Clients Table
create table public.clients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  email text,
  country varchar(50) default 'United States',
  currency varchar(5) default 'USD',
  billing_address text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Invoices Table (BIR EoPT Compliant)
create table public.invoices (
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
  payment_method varchar(30), -- 'Wise', 'PayPal', 'Direct Bank', 'GCash'
  notes_disclaimer text default 'THIS SERVICE INVOICE COMPLIES WITH RA 11976 (EASE OF PAYING TAXES ACT).',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Invoice Line Items
create table public.invoice_items (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  description text not null,
  rate_or_unit_price numeric(12, 2) not null,
  quantity numeric(8, 2) not null default 1,
  total_amount numeric(12, 2) not null
);

-- 5. Subscriptions / Payment Records
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan_tier varchar(20) default 'free', -- 'free', 'pro_monthly', 'pro_annual'
  status varchar(20) default 'active',  -- 'active', 'past_due', 'cancelled'
  paymongo_payment_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.subscriptions enable row level security;

-- RLS Policies (Users can only access their own records)
create policy "Users can manage own profile" on public.profiles for all using (auth.uid() = id);
create policy "Users can manage own clients" on public.clients for all using (auth.uid() = user_id);
create policy "Users can manage own invoices" on public.invoices for all using (auth.uid() = user_id);
create policy "Users can manage items of own invoices" on public.invoice_items 
  for all using (
    exists (
      select 1 from public.invoices 
      where invoices.id = invoice_items.invoice_id and invoices.user_id = auth.uid()
    )
  );
create policy "Users can read own subscription" on public.subscriptions for select using (auth.uid() = user_id);
```

---

## 5. Step-by-Step Implementation Roadmap

Execute this phase by phase in dedicated coding sessions.

### Phase 1: Foundation, Design Tokens & Auth Setup
* **Goal:** Initialize project repository, configure Tailwind theme, set up Supabase Auth, and build the onboarding profile flow.
* **Tasks:**
  1. Initialize Next.js 14 App Router project with TypeScript and Tailwind CSS.
  2. Install UI dependencies: `shadcn/ui`, `lucide-react`, `date-fns`, `@supabase/ssr`.
  3. Configure Google Fonts (`Plus Jakarta Sans` and `JetBrains Mono`) in `app/layout.tsx`.
  4. Run the Supabase SQL schema above to create tables and RLS policies.
  5. Build auth routes: `/login` (Google One-Tap and Email Magic Link) and `/auth/callback`.
  6. Build onboarding wizard at `/onboarding`:
     * Full Name & Registered Trade Name.
     * Taxpayer Identification Number (TIN) input with auto-formatting mask (`000-000-000-000`).
     * RDO selection dropdown (all major PH RDOs pre-filled).
     * Tax Regime toggle: **8% Flat Income Tax** (Default) vs **Graduated Rates**.
     * Preferred invoice prefix and starting number.

### Phase 2: Client Management & Currency Sync Engine
* **Goal:** Allow users to manage client directory and automatically sync foreign exchange rates.
* **Tasks:**
  1. Build `/clients` dashboard: Add, edit, archive clients.
  2. Create a lightweight Next.js Edge API route `/api/fx-rates` that pulls official BSP or OpenExchange daily conversion rates for USD, EUR, AUD, GBP to PHP.
  3. Cache daily rates in Supabase or KV so users don't exceed API rate limits.
  4. Build fallback logic: If offline or API fails, allow manual entry with a hint showing typical conversion rate.

### Phase 3: BIR EoPT Service Invoice Builder
* **Goal:** The core engine — create, edit, view, and save compliant Service Invoices.
* **Tasks:**
  1. Build `/invoices/new` interactive builder:
     * Client selector with instant autofill.
     * Dynamic line item editor (Add Item, Hourly Rate/Fixed Fee, Qty/Hours, Amount).
     * Auto-calculated Subtotal, Discounts, and Total.
     * Currency selector: If USD selected, display: *"BSP Rate on [Date]: ₱58.20 → Equivalent: ₱116,400.00"*.
     * Withholding Tax (Form 2307) toggle: For local Philippine B2B clients, calculate 5% creditable withholding tax deduction.
  2. Sequential numbering enforcement: Next invoice automatically increments from `profiles.next_invoice_number`.
  3. Invoice list view at `/invoices` with tab filters: `All`, `Draft`, `Unpaid`, `Paid`.
  4. Status updater (Mark as Paid with payment method: Wise, PayPal, Bank, GCash).

### Phase 4: Deterministic PDF Generation Engine
* **Goal:** Download and print pixel-perfect, BIR-compliant PDF invoices.
* **Tasks:**
  1. Install `@react-pdf/renderer`.
  2. Build `ServiceInvoicePdfTemplate.tsx` with standard Philippine invoice dimensions (A4 or Letter):
     * **Header:** Freelancer Name, Registered Business Name, Address, TIN, and Contact.
     * **Document Title:** Boldly branded as **"SERVICE INVOICE"** (per EoPT guidelines, NOT "Official Receipt").
     * **Metadata Box:** Invoice Number, Date of Issue, Due Date, Payment Terms.
     * **Client Box:** Name, Address, Country, Currency.
     * **Line Items Table:** Description, Rate, Quantity, Line Total.
     * **Totals Summary:** Total in Invoice Currency + Official PHP Equivalent for BIR records.
     * **Footer Disclaimer:** *"THIS DOCUMENT IS ISSUED PURSUANT TO THE EASE OF PAYING TAXES ACT (RA 11976). Valid for claiming expenses/tax credits."*
  3. Client-side one-click "Download PDF" and "Print" buttons.

### Phase 5: The 8% Tax Tracker & eBIRForm Mapper
* **Goal:** Turn raw invoice numbers into zero-effort quarterly tax filings.
* **Tasks:**
  1. Build `/tax-dashboard`:
     * **₱250,000 Tax-Free Threshold Meter:** Visual progress bar showing how much of the initial ₱250k deduction has been consumed for the calendar year.
     * **Quarterly Breakdown Cards:**
       * Q1 (Jan–Mar, Filed May 15)
       * Q2 (Apr–Jun, Filed Aug 15)
       * Q3 (Jul–Sep, Filed Nov 15)
       * Annual / Q4 (Jan–Dec, Filed Apr 15)
  2. **The "eBIRForms Cheat Sheet" Modal:**
     * A side-by-side replica showing user which exact box to fill in **BIR Form 1701Q**:
       * *Part II, Item 32 (Gross Sales/Receipts)* → Exact ₱ amount.
       * *Part II, Item 36 (Allowable Deduction ₱250k)* → Exact ₱ applied.
       * *Part II, Item 38 (Tax Due at 8%)* → Exact ₱ computed.
       * *Creditable Withholding Taxes (Form 2307, if any)* → Deducted.
       * *Net Tax Payable* → Final amount to pay via GCash/Maya/AUB.
  3. Exportable Tax Summary CSV for accountants (for users who still prefer an external CPA).

### Phase 6: Proof-of-Income / Visa Certificate Generator
* **Goal:** Empower freelancers to pass embassy and bank scrutiny.
* **Tasks:**
  1. Build `/reports/proof-of-income`.
  2. Select date range (e.g., "Last 6 Months" or "Last 12 Months").
  3. Generate formal PDF titled **"Consolidated Earnings & Client Remittance Summary"**:
     * Aggregates all paid invoices, currencies, dates, and client origins.
     * Displays cumulative PHP conversion totals.
     * Includes digital signature placeholder and QR code verification link to confirm authenticity.

### Phase 7: PayMongo Integration & Local Paywall
* **Goal:** Monetize seamlessly via GCash, Maya, and cards.
* **Tasks:**
  1. Set up PayMongo developer account (or Xendit).
  2. Tier limits logic:
     * **Free Starter Tier:** Up to 3 invoices/month, manual FX rates, standard PDF export.
     * **Pro Freelancer Tier (₱299/mo or ₱1,999/year):** Unlimited invoices, auto-synced BSP FX rates, eBIRForms 1701Q/1701A mapper, custom branding/logo, Proof-of-Income Visa report generator.
  3. Integrate PayMongo Checkout API for creating payment sessions (GCash, Maya, QR Ph, Credit/Debit).
  4. Create webhook listener `/api/webhooks/paymongo` to activate `pro` tier in `subscriptions` table upon successful payment.

---

## 6. Marketing, Distribution & Launch Playbook

### 6.1 Distribution Channels in the Philippines

```
+--------------------------------------------------------------------------+
|                       ORGANIC DISTRIBUTION CHANNELS                      |
+--------------------------------------------------------------------------+
       |                                |                           |
       v                                v                           v
[ Reddit Communities ]      [ Facebook Groups ]        [ TikTok & IG Reels ]
• r/buhaydigital (200k+)     • Freelancers Hub PH       • 30s BIR EoPT Hacks
• r/phinvest (150k+)        • Upwork VAs Philippines   • "How to pass Japan Visa"
• r/freelanceph             • Pinoy Digital Nomads     • eBIRForm 1701Q walk-thru
```

---

### 6.2 Pre-Launch Lead Magnet: The Free BIR EoPT Calculator
Before launching the full SaaS, launch a free, open-source 1-page calculator:
* **Tool:** `invoisph.com/free-tax-calculator`
* **Features:** Select income in USD/PHP → Computes 8% flat vs Graduated Tax → Shows exact savings → Captures email with CTA: *"Want to auto-generate EoPT Service Invoices and file in 2 minutes? Join our early beta (50% off for life)."*

---

### 6.3 Copywriting & Launch Materials

#### Post Material 1: Reddit (`r/buhaydigital` / `r/phinvest`)
> **Title:** I built a tool to solve the new BIR EoPT Service Invoice and 8% tax headache for fellow remote workers
>
> **Body:**
> Hey guys! Like many of you working for US/foreign clients, I was confused when RA 11976 (Ease of Paying Taxes Act) passed. We’re now required to issue "Service Invoices" instead of Official Receipts, and calculating foreign exchange rates with BSP daily rates to report the 8% flat tax on eBIRForms gave me massive anxiety every quarter.
>
> Most CPAs charge ₱3,000/month just to copy numbers into forms, and foreign invoice software (Freshbooks/Stripe) has no idea what a BIR Service Invoice is or how to format Philippine TINs.
>
> So I built **InvoisPH**:
> 1. Generates compliant Service Invoices (with correct BIR disclaimers and auto-fetched BSP exchange rates).
> 2. Tracks your ₱250,000 tax-free bracket across quarters.
> 3. Tells you the exact numbers to copy into BIR Form 1701Q / 1701A without guesswork.
> 4. Generates a clean Proof of Income summary for Japan/Schengen visa and credit card applications.
>
> It’s free for up to 3 invoices/month. Would love your honest feedback: [Link]

---

#### Post Material 2: Facebook Community Post (VA & Freelance Groups)
> **Hook:** Still confused about Service Invoices vs Official Receipts under the new BIR EoPT rules? 📄🇵🇭
>
> **Post:**
> If you're an online freelancer earning in USD/AUD/EUR, remember:
> ❌ Don't issue old "Official Receipts" anymore.
> ❌ Don't guess your USD-to-PHP rate (the BIR expects official BSP reference rates on the invoice date).
> ✅ You are likely qualified for the 8% Flat Tax rate (first ₱250,000 annual income is 100% tax-free!).
>
> We just launched **InvoisPH** to help Filipino freelancers generate BIR-compliant Service Invoices in 30 seconds and map your quarterly taxes automatically.
>
> Try it free: [Link]
> Tag a freelancer friend who needs this before the next quarterly filing!

---

#### Post Material 3: Short-Form Video Scripts (TikTok / Reels / Shorts)

* **Video 1: The Visa Denial Trap**
  * **Visual:** Creator pointing at green screen of a visa denial letter.
  * **Hook (0-3s):** *"The #1 reason Filipino freelancers get rejected for tourist visas or credit cards."*
  * **Pain (4-15s):** *"Embassies don't accept raw Upwork screenshots or messy bank statements. They want sequential, compliant invoices and tax proof showing consistent income."*
  * **Solution (16-25s):** *"With InvoisPH, you can turn your foreign client earnings into BIR-compliant Service Invoices and generate a verified 1-page Proof of Income report in one click."*
  * **CTA (26-30s):** *"Check the link in bio to try it free!"*

* **Video 2: eBIRForms Without Tears**
  * **Visual:** Fast screen recording showing complicated eBIRForm 1701Q vs InvoisPH 1-click cheat sheet.
  * **Hook (0-3s):** *"Stop paying an accountant ₱3,000 every quarter just for this."*
  * **Body (4-20s):** *"If you're on the 8% tax rate, you only need to fill out 4 boxes in eBIRForms. InvoisPH automatically tracks your ₱250,000 deduction, converts your USD earnings using official BSP rates, and tells you the exact numbers to copy-paste."*
  * **CTA (21-25s):** *"Save your money. Link in bio!"*

---

## 7. Solopreneur Daily Operating Checklist (5 Hours/Week)

When working full-time, follow this strict asynchronous routine:

| Day | Time | Task | Time Required |
| :--- | :--- | :--- | :--- |
| **Monday** | 8:00 PM – 8:45 PM | Check PayMongo payouts, answer Discord/email support tickets | 45 mins |
| **Wednesday**| 8:00 PM – 9:00 PM | Post 1 helpful guide/tip on `r/buhaydigital` or Facebook Groups | 60 mins |
| **Friday** | 7:30 PM – 8:30 PM | Schedule 2 TikTok/Reels videos for the weekend | 60 mins |
| **Saturday**| 10:00 AM – 1:00 PM | Code sprint: Bug fixes, feature improvements, user feature requests | 3 hours |
| **Total** | | | **~5.5 hours/week** |

---

## 8. Next Immediate Action

To begin development in your next session:
1. Open this folder: `C:\Users\Joey\.gemini\antigravity\scratch\invoisph`.
2. Review the database schema in **Section 4**.
3. Instruct Gemini: *"Let's begin Phase 1: Initialize the Next.js 14 project, configure Tailwind, Plus Jakarta Sans, and connect Supabase Auth."*
