"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Client, Profile } from "@/types/database.types";
import type { FXRatesResponse } from "@/lib/services/fx";
import { FALLBACK_RATES_TO_PHP } from "@/lib/services/fx";
import { formatCurrency } from "@/lib/utils";
import {
  PAYMENT_TERM_PRESETS,
  WITHHOLDING_TAX_RATES,
  addDays,
  computeTotals,
  createEmptyLineItem,
  formatInvoiceDate,
  lineItemTotal,
  parseAmount,
  toDateInputValue,
  todayInputValue,
  type DraftLineItem,
  type InvoiceTotals,
} from "@/lib/services/invoices";
import {
  AlertCircle,
  CalendarDays,
  Globe2,
  Hash,
  Info,
  Plus,
  Trash2,
  User,
} from "lucide-react";

const BILLING_CURRENCIES = ["USD", "PHP", "EUR", "AUD", "GBP", "CAD", "SGD"] as const;

export interface InvoiceFormLinePayload {
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

/** What the form hands back to the page, which owns persistence. */
export interface InvoiceFormSubmit {
  clientId: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  status: "draft" | "sent";
  totals: InvoiceTotals;
  items: InvoiceFormLinePayload[];
}

/** Values used to pre-fill the form when editing an existing invoice. */
export interface InvoiceFormInitial {
  clientId: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  fxRate: number;
  discount: number;
  whtRate: number;
  items: DraftLineItem[];
}

interface InvoiceFormProps {
  mode: "create" | "edit";
  profile: Profile | null;
  clients: Client[];
  fx: FXRatesResponse | null;
  /** Invoice number shown in the corner (a preview when creating). */
  numberLabel: string;
  numberHint: string;
  initial?: InvoiceFormInitial;
  submitting: "draft" | "sent" | null;
  error: string | null;
  onSubmit: (payload: InvoiceFormSubmit) => void;
  onCancel?: () => void;
  /** True when the Free Starter limit is reached — disables submit and shows a banner. */
  upgradeRequired?: boolean;
}

export function InvoiceForm({
  mode,
  profile,
  clients,
  fx,
  numberLabel,
  numberHint,
  initial,
  submitting,
  error,
  onSubmit,
  onCancel,
  upgradeRequired,
}: InvoiceFormProps) {
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [issueDate, setIssueDate] = useState(initial?.issueDate ?? todayInputValue());
  const [dueDate, setDueDate] = useState(
    initial?.dueDate ?? toDateInputValue(addDays(new Date(), 15))
  );
  const [currency, setCurrency] = useState(
    initial?.currency ?? profile?.currency_default ?? "USD"
  );
  // Editing keeps the rate that was originally recorded on the invoice.
  const [fxOverride, setFxOverride] = useState(
    initial && initial.currency !== "PHP" ? String(initial.fxRate) : ""
  );
  const [items, setItems] = useState<DraftLineItem[]>(
    initial?.items && initial.items.length > 0
      ? initial.items
      : [createEmptyLineItem()]
  );
  const [discount, setDiscount] = useState(
    initial && initial.discount > 0 ? String(initial.discount) : ""
  );
  const [whtEnabled, setWhtEnabled] = useState(
    Boolean(initial && initial.whtRate > 0)
  );
  const [whtRate, setWhtRate] = useState<number>(initial?.whtRate || 5);
  const [localError, setLocalError] = useState<string | null>(null);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === clientId) ?? null,
    [clients, clientId]
  );

  const liveRate = useMemo(() => {
    if (currency === "PHP") return 1;
    return fx?.ratesToPHP?.[currency] ?? FALLBACK_RATES_TO_PHP[currency] ?? 1;
  }, [currency, fx]);

  const usingOverride = currency !== "PHP" && fxOverride.trim().length > 0;
  const effectiveRate =
    currency === "PHP" ? 1 : usingOverride ? parseAmount(fxOverride) : liveRate;

  const rateIsFallback =
    currency !== "PHP" && !usingOverride && (!fx || fx.source === "fallback");

  const totals = useMemo(
    () =>
      computeTotals({
        items,
        discount,
        currency,
        fxRate: effectiveRate,
        whtRate: whtEnabled ? whtRate : 0,
      }),
    [items, discount, currency, effectiveRate, whtEnabled, whtRate]
  );

  const handleClientChange = (id: string) => {
    setClientId(id);
    const client = clients.find((row) => row.id === id);
    if (!client) return;
    setCurrency(client.currency || "USD");
    // A client-level manual rate overrides live data for this client.
    setFxOverride(
      client.manual_fx_rate != null ? String(client.manual_fx_rate) : ""
    );
  };

  const handleIssueDateChange = (value: string) => {
    setIssueDate(value);
    if (!value) return;
    // Keep the chosen payment term, but never leave the due date behind.
    if (dueDate && dueDate >= value) return;
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return;
    setDueDate(toDateInputValue(addDays(new Date(year, month - 1, day), 15)));
  };

  const updateItem = (
    index: number,
    field: "description" | "quantity" | "rate",
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const addItem = () => setItems((prev) => [...prev, createEmptyLineItem()]);

  const removeItem = (index: number) =>
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index)
    );

  const validate = (): string | null => {
    if (!clientId) return "Select a client before saving this invoice.";
    if (items.length === 0) return "Add at least one line item.";
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (!item.description.trim()) return `Line ${index + 1} needs a description.`;
      if (parseAmount(item.rate) <= 0) {
        return `Line ${index + 1} needs a rate greater than zero.`;
      }
      if (parseAmount(item.quantity) <= 0) {
        return `Line ${index + 1} needs a quantity greater than zero.`;
      }
    }
    if (!issueDate) return "Choose an issue date.";
    if (!dueDate) return "Choose a due date.";
    if (dueDate < issueDate) return "The due date cannot be before the issue date.";
    if (currency !== "PHP" && effectiveRate <= 0) {
      return "Enter the exchange rate you used for this invoice.";
    }
    return null;
  };

  const submit = (status: "draft" | "sent") => {
    if (upgradeRequired) {
      setLocalError(
        "Free Starter tier — 3 invoices/month reached. Upgrade to Pro for unlimited invoices."
      );
      return;
    }
    const validationError = validate();
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError(null);
    onSubmit({
      clientId,
      issueDate,
      dueDate,
      currency,
      status,
      totals,
      items: items.map((item) => ({
        description: item.description.trim(),
        quantity: parseAmount(item.quantity),
        rate: parseAmount(item.rate),
        total: lineItemTotal(item),
      })),
    });
  };

  const visibleError = localError ?? error;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit("sent");
      }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
    >
      {/* ------------------------------ Left column -------------------- */}
      <div className="lg:col-span-2 space-y-6">
        {upgradeRequired && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Free Starter tier reached.</strong> Upgrade to Pro (₱299/mo)
              for unlimited invoices.
              <Link href="/pricing" className="underline font-bold ml-1">
                Upgrade now
              </Link>
            </span>
          </div>
        )}

        {visibleError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1">{visibleError}</span>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5 text-navy-900 font-bold text-base">
              <User className="w-4 h-4 text-selyo-800" />
              <CardTitle className="text-base">Bill To & Terms</CardTitle>
            </div>
            <CardDescription>
              Selecting a client fills in their billing currency and address.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="client"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Client <span className="text-red-500">*</span>
              </label>
              <select
                id="client"
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-selyo-600"
                required
              >
                <option value="">Select a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} — {client.country}
                  </option>
                ))}
              </select>
              {clients.length === 0 && (
                <p className="text-[11px] text-amber-700 mt-1">
                  No active clients yet.{" "}
                  <Link href="/clients" className="underline font-semibold">
                    Add a client first
                  </Link>
                  .
                </p>
              )}
              {selectedClient?.billing_address && (
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {selectedClient.billing_address}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="issue-date"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Date of Issue <span className="text-red-500">*</span>
                </label>
                <Input
                  id="issue-date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => handleIssueDateChange(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="due-date"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Payment Due <span className="text-red-500">*</span>
                </label>
                <Input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  min={issueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
              {PAYMENT_TERM_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    const [year, month, day] = issueDate.split("-").map(Number);
                    if (!year || !month || !day) return;
                    setDueDate(
                      toDateInputValue(
                        addDays(new Date(year, month - 1, day), preset.days)
                      )
                    );
                  }}
                  className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:text-navy-900 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5 text-navy-900 font-bold text-base">
              <Globe2 className="w-4 h-4 text-selyo-800" />
              <CardTitle className="text-base">Services Rendered</CardTitle>
            </div>
            <CardDescription>
              Bill a fixed fee (quantity 1) or hourly work (quantity = hours).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="hidden sm:grid grid-cols-12 gap-2 px-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-right">Qty / Hours</div>
              <div className="col-span-2 text-right">Rate</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>

            {items.map((item, index) => (
              <div key={item.key} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    placeholder="e.g. Monthly social media management"
                    aria-label={`Line ${index + 1} description`}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.25"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    className="text-right font-mono text-sm"
                    aria-label={`Line ${index + 1} quantity`}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => updateItem(index, "rate", e.target.value)}
                    placeholder="0.00"
                    className="text-right font-mono text-sm"
                    aria-label={`Line ${index + 1} rate`}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2 flex items-center justify-end gap-1.5">
                  <span className="font-mono text-xs font-semibold text-navy-900 truncate">
                    {formatCurrency(lineItemTotal(item), currency)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="h-8 w-8 shrink-0 text-slate-400 hover:text-red-600 disabled:opacity-30"
                    title="Remove line"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="font-semibold"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add line item
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Creditable Withholding Tax (Form 2307)
            </CardTitle>
            <CardDescription>
              Only when a local Philippine business client withholds tax before
              paying you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={whtEnabled}
                onChange={(e) => setWhtEnabled(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-selyo-800 focus:ring-selyo-600"
              />
              <span className="text-xs text-slate-700">
                <span className="font-semibold">
                  This client withholds creditable tax
                </span>
                <span className="block text-slate-500">
                  The withholding is recorded on the client&apos;s Form 2307 and
                  credited against your income tax.
                </span>
              </span>
            </label>

            {whtEnabled && (
              <div className="space-y-3 pl-7">
                <div className="flex items-center gap-1.5">
                  {WITHHOLDING_TAX_RATES.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setWhtRate(rate)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        whtRate === rate
                          ? "border-selyo-700 bg-blue-50 text-selyo-900 ring-2 ring-selyo-600/30"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                  <span className="text-[11px] text-slate-500">
                    of the PHP equivalent
                  </span>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">Withheld</span>
                    <span className="font-semibold text-amber-700">
                      − {formatCurrency(totals.whtAmountPhp)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-sans">
                      Client actually pays
                    </span>
                    <span className="font-bold text-navy-900">
                      {formatCurrency(totals.netPayablePhp)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------ Right column ------------------- */}
      <div className="space-y-6 lg:sticky lg:top-20">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5 text-navy-900 font-bold text-base">
              <Hash className="w-4 h-4 text-selyo-800" />
              <CardTitle className="text-base">Invoice Number</CardTitle>
            </div>
            <CardDescription>{numberHint}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-lg font-extrabold text-navy-900 text-center">
              {numberLabel}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Currency & Conversion</CardTitle>
            <CardDescription>
              The PHP equivalent is what your BIR records track.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="currency"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Billing Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value);
                  setFxOverride("");
                }}
                className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-selyo-600"
              >
                {BILLING_CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>

            {currency !== "PHP" ? (
              <>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">
                      Reference rate
                      {fx?.date ? ` · ${formatInvoiceDate(fx.date)}` : ""}
                    </span>
                    <span className="font-mono font-bold text-navy-900">
                      1 {currency} = ₱{effectiveRate.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Equivalent</span>
                    <span className="font-mono font-bold text-navy-900">
                      {formatCurrency(totals.totalPhp)}
                    </span>
                  </div>
                  <div className="pt-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        usingOverride
                          ? "bg-selyo-50 text-selyo-900"
                          : rateIsFallback
                            ? "bg-amber-100 text-amber-900"
                            : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {usingOverride
                        ? "Manual rate"
                        : rateIsFallback
                          ? "Offline baseline"
                          : fx?.source === "cached"
                            ? "Cached daily rate"
                            : fx?.source === "open_exchange"
                              ? "OpenExchangeRates"
                              : "Live rate"}
                    </span>
                  </div>
                </div>

                {rateIsFallback && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      Live rates are unavailable, so an offline baseline is shown.
                      Enter the official BSP rate you used before issuing this
                      invoice.
                    </span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="fx-override"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Rate used (optional override)
                  </label>
                  <Input
                    id="fx-override"
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={fxOverride}
                    onChange={(e) => setFxOverride(e.target.value)}
                    placeholder={liveRate.toFixed(4)}
                    className="font-mono text-sm"
                  />
                </div>
              </>
            ) : (
              <p className="text-[11px] text-slate-500">
                Peso invoice — no conversion applied.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-mono font-semibold text-slate-800">
                {formatCurrency(totals.subtotal, currency)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <label htmlFor="discount" className="text-slate-600 whitespace-nowrap">
                Discount
              </label>
              <Input
                id="discount"
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0.00"
                className="h-8 w-28 text-right font-mono text-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="font-bold text-navy-900">Total ({currency})</span>
              <span className="font-mono font-extrabold text-navy-900">
                {formatCurrency(totals.totalOriginal, currency)}
              </span>
            </div>

            {currency !== "PHP" && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600">PHP equivalent</span>
                <span className="font-mono font-bold text-selyo-800">
                  {formatCurrency(totals.totalPhp)}
                </span>
              </div>
            )}

            {totals.whtRate > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    Less {totals.whtRate}% withheld
                  </span>
                  <span className="font-mono text-amber-700">
                    − {formatCurrency(totals.whtAmountPhp)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-navy-900">Net collectible</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatCurrency(totals.netPayablePhp)}
                  </span>
                </div>
              </>
            )}

            <div className="pt-3 space-y-2">
              <Button
                type="submit"
                disabled={submitting !== null || upgradeRequired}
                className="w-full bg-navy-900 hover:bg-navy-800 text-white font-bold"
              >
                {submitting === "sent"
                  ? mode === "edit"
                    ? "Saving & marking sent..."
                    : "Issuing invoice..."
                  : "Save & Mark as Sent"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={submitting !== null || upgradeRequired}
                onClick={() => submit("draft")}
                className="w-full font-semibold"
              >
                {submitting === "draft" ? "Saving draft..." : "Save as Draft"}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={submitting !== null}
                  onClick={onCancel}
                  className="w-full font-semibold text-slate-500"
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
