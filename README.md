# InvoisPH — BIR-Compliant EoPT Invoicing & 8% Flat Tax Tracker

InvoisPH is a micro-SaaS engineered for Filipino freelancers, remote workers, and digital contractors earning in USD, EUR, AUD, and other foreign currencies. Built in strict alignment with **Republic Act No. 11976 (Ease of Paying Taxes Act / EoPT)**.

---

## 🚀 Key Features

* **BIR EoPT Service Invoices:** Fully compliant Service Invoices (replacing outdated Official Receipts) with mandatory EoPT disclaimers and auto-incrementing sequential numbering.
* **Bangko Sentral ng Pilipinas (BSP) FX Sync:** Real-time reference conversion of foreign client earnings (USD/EUR/AUD/GBP) to Philippine Pesos on invoice date.
* **8% Flat Income Tax Tracker:** Live progress meter tracking the ₱250,000 statutory tax-free exemption bracket.
* **eBIRForms 1701Q / 1701A Mapper:** Instant translation of gross receipts and allowable deductions into exact boxes for quarterly filing.
* **1-Click Visa & Bank Loan Proof of Income:** Stamped, sequential earnings report designed to pass embassy (Japan/Schengen) and bank credit scrutiny.

---

## 🛠 Tech Stack

* **Framework:** Next.js 14 (App Router, Server & Client Components, TypeScript)
* **Design System & Styling:** Tailwind CSS, `shadcn/ui` design patterns, Lucide Icons
* **Typography:** `Plus Jakarta Sans` (Brand & UI), `JetBrains Mono` (Financial/Monospace inputs)
* **Backend & Database:** Supabase (PostgreSQL 15+, Row Level Security, SSR Auth)
* **Validation & Forms:** React Hook Form + Zod

---

## 📦 Getting Started

### 1. Prerequisites
* Node.js 18+ (tested with Node.js 22)
* pnpm (or npm / yarn)
* A Supabase project

### 2. Environment Setup
Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Supabase Schema Migration
Execute the SQL script located at [`supabase/schema.sql`](file:///d:/PROJECTS/invoisph/supabase/schema.sql) in your Supabase SQL Editor. This provisions:
1. `profiles` (Freelancer TIN, RDO, 8% tax regime, invoice sequence settings)
2. `clients` (Client directory with currency, address, and origin)
3. `invoices` (BIR EoPT Service Invoices with BSP exchange rates & withholding taxes)
4. `invoice_items` (Line items with description, quantity, and rate)
5. `subscriptions` (PayMongo subscription status)
6. `fx_rates` (Daily FX cache used by the exchange-rate engine)
7. Row Level Security (RLS) policies and user signup trigger.

The script is idempotent — **re-run it whenever you pull in a new phase.** Existing
installs must re-run it to receive later additions such as `set_invoice_number`,
the `before insert` trigger that allocates Service Invoice numbers atomically from
`profiles.next_invoice_number`. App code never generates an invoice number: the
builder inserts an empty `invoice_number` and the trigger assigns `INV-0001`,
`INV-0002`, … inside the same transaction, so a failed save never burns a number.

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📁 Project Structure

```
├── app/
│   ├── auth/
│   │   ├── callback/route.ts  # Supabase OAuth/Magic Link session exchange
│   │   └── signout/route.ts   # Session termination handler
│   ├── api/
│   │   └── fx-rates/route.ts  # Edge FX rates endpoint (cached daily)
│   ├── invoices/
│   │   ├── page.tsx           # Invoice list: tabs, totals, status updates
│   │   └── new/page.tsx       # Service Invoice builder (Phase 3)
│   ├── dashboard/page.tsx     # Freelancer dashboard & ₱250k tax tracker
│   ├── clients/page.tsx       # Client directory with archive support
│   ├── login/page.tsx         # Google One-Tap & Email Magic Link authentication
│   ├── onboarding/page.tsx    # BIR EoPT Freelancer onboarding wizard
│   ├── globals.css            # Tailwind theme, CSS variables & tokens
│   ├── layout.tsx             # Root layout with Plus Jakarta Sans & JetBrains Mono
│   └── page.tsx               # Product landing page & feature highlights
├── components/
│   ├── brand/
│   │   └── logo.tsx           # Official InvoisPH SVG logo with Selyo stamp mark
│   ├── clients/
│   │   └── client-modal.tsx   # Add/edit client dialog
│   ├── invoices/
│   │   └── mark-paid-modal.tsx # Payment channel + date capture
│   ├── layout/
│   │   └── app-header.tsx     # Shared authenticated navigation
│   └── ui/
│       ├── button.tsx         # Accessible button with brand variants
│       ├── card.tsx           # Dashboard & invoice card components
│       ├── input.tsx          # Styled input with error states
│       └── modal.tsx          # Base dialog with Escape/backdrop close
├── lib/
│   ├── constants/
│   │   └── rdos.ts            # Complete directory of Philippine BIR RDOs
│   ├── demo/
│   │   ├── clients.ts         # Demo directory for the no-Supabase preview
│   │   └── invoices.ts        # Demo invoices (localStorage)
│   ├── services/
│   │   ├── fx.ts              # FX engine: memory → Supabase → live → fallback
│   │   └── invoices.ts        # Invoice totals, WHT, numbering & date helpers
│   ├── supabase/
│   │   ├── client.ts          # Browser Supabase client
│   │   ├── server.ts          # Server-side Supabase client (cookie-based)
│   │   ├── service.ts         # Service-role client (cache writes only)
│   │   └── middleware.ts      # Auth protection & token refresh middleware
│   └── utils.ts               # Helper utilities (TIN mask, currency formatting)
├── middleware.ts              # Global Next.js middleware
├── supabase/
│   └── schema.sql             # PostgreSQL schema with RLS, triggers, numbering
└── types/
    └── database.types.ts      # Strict TypeScript schema definitions
```
