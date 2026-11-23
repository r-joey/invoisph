"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Client } from "@/types/database.types";
import { FALLBACK_RATES_TO_PHP } from "@/lib/services/fx";
import { Globe, Mail, Building, MapPin, FileText, DollarSign } from "lucide-react";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Partial<Client>) => Promise<void>;
  client?: Client | null;
}

const COMMON_COUNTRIES = [
  "United States",
  "Australia",
  "United Kingdom",
  "Canada",
  "Singapore",
  "Philippines",
  "Germany",
  "Netherlands",
  "New Zealand",
  "Japan",
  "Ireland",
  "United Arab Emirates",
  "Other",
];

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
];

export function ClientModal({
  isOpen,
  onClose,
  onSave,
  client,
}: ClientModalProps) {
  const isEditing = Boolean(client?.id);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("United States");
  const [currency, setCurrency] = useState("USD");
  const [billingAddress, setBillingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [manualFxRate, setManualFxRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (client) {
      setName(client.name || "");
      setEmail(client.email || "");
      setCountry(client.country || "United States");
      setCurrency(client.currency || "USD");
      setBillingAddress(client.billing_address || "");
      setNotes(client.notes || "");
    } else {
      setName("");
      setEmail("");
      setCountry("United States");
      setCurrency("USD");
      setBillingAddress("");
      setNotes("");
    }
    setManualFxRate(client?.manual_fx_rate != null ? String(client.manual_fx_rate) : "");
    setError(null);
  }, [client, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Client or business name is required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await onSave({
        id: client?.id,
        name: name.trim(),
        email: email.trim() || null,
        country: country.trim(),
        currency: currency.trim(),
        billing_address: billingAddress.trim() || null,
        notes: notes.trim() || null,
        manual_fx_rate: manualFxRate.trim() ? Number(manualFxRate.trim()) : null,
        archived: client?.archived ?? false,
      });

      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to save client.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Client Details" : "Add New Client"}
      description="Clients will appear in your Service Invoice dropdown with auto-filled currency & billing address."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Client / Business Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <Input
              type="text"
              placeholder="e.g. Acme Tech Solutions LLC"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-9"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Contact / Billing Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <Input
                type="email"
                placeholder="billing@acme.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Client Country
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-selyo-600"
              >
                {COMMON_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Billing Currency (EoPT Service Invoice Default)
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {CURRENCIES.map((cur) => (
              <button
                key={cur.code}
                type="button"
                onClick={() => setCurrency(cur.code)}
                className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all text-center ${
                  currency === cur.code
                    ? "border-selyo-700 bg-blue-50 text-selyo-900 ring-2 ring-selyo-600/30"
                    : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                }`}
              >
                <span>{cur.code}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            When creating an invoice in this currency, InvoisPH auto-fetches live exchange rates to PHP.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Manual FX Rate to PHP (Optional)
          </label>
          <Input
            type="number"
            step="0.0001"
            min="0.0001"
            placeholder={String(FALLBACK_RATES_TO_PHP[currency] ?? "")}
            value={manualFxRate}
            onChange={(e) => setManualFxRate(e.target.value)}
            className="font-mono text-sm"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Overrides live rates for this client when exchange data is unavailable.
            Typical: 1 {currency} = ₱{FALLBACK_RATES_TO_PHP[currency]?.toFixed(2) ?? ""}.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Client Billing Address
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <textarea
              placeholder="e.g. 500 Howard Street, Suite 400, San Francisco, CA 94105, USA"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              rows={2}
              className="flex w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-selyo-600 focus-visible:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Internal Notes / Payment Terms
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              type="text"
              placeholder="e.g. Upwork Direct Contract, payment via Wise, Net 15"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            size="sm"
            className="bg-navy-900 hover:bg-navy-800 text-white font-semibold px-5"
            disabled={loading}
          >
            {loading ? "Saving Client..." : isEditing ? "Save Changes" : "Create Client"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
