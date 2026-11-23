// Renders the Service Invoice PDF template in Node to prove it produces a valid
// document (the app calls the same component through @react-pdf/renderer).
const path = require("path");
const fs = require("fs");
const Module = require("module");

// The template imports via the "@/" alias, which Next resolves at build time.
// Map it onto the tsc output so plain Node can require the same source.
const OUT = path.join(__dirname, "out2");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (typeof request === "string" && request.startsWith("@/")) {
    request = path.join(OUT, request.slice(2));
  }
  return originalResolve.call(this, request, ...rest);
};

const React = require("react");
const { renderToBuffer } = require("@react-pdf/renderer");
const {
  ServiceInvoicePdf,
} = require(path.join(OUT, "components/invoices/service-invoice-pdf.js"));

const profile = {
  id: "p1",
  email: "juan@example.com",
  full_name: "Juan De La Cruz",
  registered_business_name: "Juan Creative & Tech Services",
  tin_number: "123-456-789-000",
  rdo_code: "044 - Taguig / Pateros",
  registered_address: "Unit 402, Sunshine Tower, Mandaluyong City, Metro Manila",
  is_vat_registered: false,
  tax_regime: "8_percent_gross",
  currency_default: "USD",
  next_invoice_number: 5,
  invoice_prefix: "INV",
  logo_url: null,
  onboarding_completed: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const clientUs = {
  id: "c1",
  user_id: "u1",
  name: "Apex Growth Marketing LLC",
  email: "billing@apexgrowth.io",
  country: "United States",
  currency: "USD",
  billing_address: "555 California St, Suite 300, San Francisco, CA 94104, USA",
  notes: null,
  archived: false,
  manual_fx_rate: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const clientPh = {
  ...clientUs,
  id: "c2",
  name: "Manila Creative Labs Corp",
  email: "finance@manilacreative.ph",
  country: "Philippines",
  currency: "PHP",
  billing_address: "26th Floor, High Street South Corporate Plaza, BGC, Taguig City",
};

function makeInvoice(overrides) {
  const base = {
    id: "i1",
    user_id: "u1",
    client_id: "c1",
    invoice_number: "INV-0007",
    issue_date: "2026-11-23",
    due_date: "2026-12-08",
    status: "sent",
    currency: "USD",
    subtotal: 1800,
    discount: 0,
    total_original_currency: 1800,
    bsp_fx_rate: 58.55,
    total_in_php: 105390,
    withholding_tax_rate: 0,
    withholding_tax_amount_php: 0,
    net_amount_payable_php: 105390,
    payment_date: null,
    payment_method: null,
    notes_disclaimer:
      "THIS SERVICE INVOICE COMPLIES WITH RA 11976 (EASE OF PAYING TAXES ACT).",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return { ...base, ...overrides };
}

function makeItems(invoiceId, entries) {
  return entries.map((entry, index) => ({
    id: `${invoiceId}-item-${index}`,
    invoice_id: invoiceId,
    description: entry.description,
    rate_or_unit_price: entry.rate,
    quantity: entry.quantity,
    total_amount: entry.rate * entry.quantity,
    created_at: new Date().toISOString(),
  }));
}

async function render(name, element) {
  const buffer = await renderToBuffer(element);
  const file = path.join(__dirname, name);
  fs.writeFileSync(file, buffer);
  const head = buffer.subarray(0, 5).toString("latin1");
  console.log(
    `${name}: ${buffer.length} bytes, header=${JSON.stringify(head)}, valid=${head === "%PDF-"}`
  );
  return buffer.length;
}

(async () => {
  const usdInvoice = makeInvoice({ id: "i1" });
  const usdItems = makeItems("i1", [
    { description: "Social media management — November 2026 retainer", rate: 1200, quantity: 1 },
    { description: "Ad creative production (hours)", rate: 40, quantity: 15 },
  ]);

  const phpInvoice = makeInvoice({
    id: "i2",
    client_id: "c2",
    invoice_number: "INV-0008",
    currency: "PHP",
    status: "paid",
    subtotal: 45000,
    discount: 3000,
    total_original_currency: 42000,
    bsp_fx_rate: 1,
    total_in_php: 42000,
    withholding_tax_rate: 5,
    withholding_tax_amount_php: 2100,
    net_amount_payable_php: 39900,
    payment_date: "2026-11-18",
    payment_method: "Direct Bank",
  });
  const phpItems = makeItems("i2", [
    { description: "Brand identity system — final milestone", rate: 45000, quantity: 1 },
  ]);

  const a = await render(
    "sample-invoice-usd.pdf",
    React.createElement(ServiceInvoicePdf, {
      profile,
      client: clientUs,
      invoice: usdInvoice,
      items: usdItems,
    })
  );

  const b = await render(
    "sample-invoice-php.pdf",
    React.createElement(ServiceInvoicePdf, {
      profile,
      client: clientPh,
      invoice: phpInvoice,
      items: phpItems,
    })
  );

  if (a < 2000 || b < 2000) {
    console.error("PDF output looks too small — template probably rendered blank.");
    process.exit(1);
  }
  console.log("PDF RENDER OK");
})().catch((err) => {
  console.error("PDF RENDER FAILED:", err);
  process.exit(1);
});
