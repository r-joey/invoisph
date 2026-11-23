"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYMENT_TERM_PRESETS = exports.DEFAULT_INVOICE_DISCLAIMER = exports.WITHHOLDING_TAX_RATES = exports.PAYMENT_METHODS = exports.INVOICE_STATUS_BADGE = exports.INVOICE_STATUS_LABEL = void 0;
exports.round2 = round2;
exports.parseAmount = parseAmount;
exports.clamp = clamp;
exports.createEmptyLineItem = createEmptyLineItem;
exports.lineItemTotal = lineItemTotal;
exports.computeTotals = computeTotals;
exports.formatInvoiceNumber = formatInvoiceNumber;
exports.toDateInputValue = toDateInputValue;
exports.addDays = addDays;
exports.todayInputValue = todayInputValue;
exports.isOverdue = isOverdue;
exports.formatInvoiceDate = formatInvoiceDate;
exports.INVOICE_STATUS_LABEL = {
    draft: "Draft",
    sent: "Unpaid",
    paid: "Paid",
    cancelled: "Cancelled",
};
exports.INVOICE_STATUS_BADGE = {
    draft: "bg-slate-100 text-slate-700 border-slate-200",
    sent: "bg-amber-50 text-amber-800 border-amber-200",
    paid: "bg-emerald-50 text-emerald-800 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
};
/** Payment channels freelancers are actually paid through in the Philippines. */
exports.PAYMENT_METHODS = [
    "Wise",
    "PayPal",
    "Direct Bank",
    "GCash",
    "Maya",
];
/** Creditable withholding tax rates commonly withheld on Form 2307. */
exports.WITHHOLDING_TAX_RATES = [5, 10];
exports.DEFAULT_INVOICE_DISCLAIMER = "THIS SERVICE INVOICE COMPLIES WITH RA 11976 (EASE OF PAYING TAXES ACT).";
// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------
/** Round half-up to centavos without floating point drift (0.1 + 0.2 style). */
function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
function parseAmount(value) {
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
let itemKeySeed = 0;
function createEmptyLineItem() {
    itemKeySeed += 1;
    return {
        key: `item-${itemKeySeed}`,
        description: "",
        quantity: "1",
        rate: "",
    };
}
function lineItemTotal(item) {
    return round2(parseAmount(item.quantity) * parseAmount(item.rate));
}
function computeTotals(input) {
    const subtotal = round2(input.items.reduce((sum, item) => sum + lineItemTotal(item), 0));
    // A discount can never exceed the subtotal, and negatives are meaningless.
    const discount = clamp(round2(parseAmount(input.discount)), 0, subtotal);
    const totalOriginal = round2(subtotal - discount);
    const fxRate = input.currency === "PHP" ? 1 : round4(input.fxRate);
    const totalPhp = round2(totalOriginal * fxRate);
    const whtRate = clamp(input.whtRate, 0, 100);
    const whtAmountPhp = round2((totalPhp * whtRate) / 100);
    const netPayablePhp = round2(totalPhp - whtAmountPhp);
    return {
        subtotal,
        discount,
        totalOriginal,
        fxRate,
        totalPhp,
        whtRate,
        whtAmountPhp,
        netPayablePhp,
    };
}
function round4(value) {
    return Math.round((value + Number.EPSILON) * 10000) / 10000;
}
// ---------------------------------------------------------------------------
// Numbering
// ---------------------------------------------------------------------------
/**
 * Preview of the number the database will allocate next. The invoice insert
 * sends an empty invoice_number and the set_invoice_number trigger fills in the
 * real one, so this is display-only — see supabase/schema.sql.
 */
function formatInvoiceNumber(prefix, next) {
    const cleanPrefix = (prefix || "INV").trim().toUpperCase() || "INV";
    const safeNext = Number.isFinite(next) && next > 0 ? Math.floor(next) : 1;
    return `${cleanPrefix}-${String(safeNext).padStart(4, "0")}`;
}
// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------
/** Format a Date as the yyyy-mm-dd string that <input type="date"> expects. */
function toDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}
/** Today as yyyy-mm-dd in the user's local timezone (not UTC). */
function todayInputValue() {
    return toDateInputValue(new Date());
}
/** Payment-term presets offered by the builder, in days. */
exports.PAYMENT_TERM_PRESETS = [
    { label: "Due on receipt", days: 0 },
    { label: "Net 7", days: 7 },
    { label: "Net 15", days: 15 },
    { label: "Net 30", days: 30 },
];
/** An unpaid invoice past its due date, evaluated in local time. */
function isOverdue(invoice, today = todayInputValue()) {
    return invoice.status === "sent" && invoice.due_date < today;
}
function formatInvoiceDate(value) {
    if (!value)
        return "—";
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day)
        return value;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}
