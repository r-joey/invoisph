"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { InvoisPHLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ClientModal } from "@/components/clients/client-modal";
import { Client } from "@/types/database.types";
import { FXRatesResponse, FALLBACK_RATES_TO_PHP } from "@/lib/services/fx";
import { INITIAL_DEMO_CLIENTS } from "@/lib/demo/clients";
import {
  Users,
  Plus,
  Search,
  Building,
  Mail,
  MapPin,
  Globe,
  Receipt,
  Edit2,
  Trash2,
  Archive,
  ArchiveRestore,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Sparkles,
  DollarSign,
  AlertCircle,
  LogOut,
} from "lucide-react";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Archived clients toggle (Phase 2)
  const [showArchived, setShowArchived] = useState(false);
  const archivedCount = useMemo(
    () => clients.filter((c) => c.archived).length,
    [clients]
  );

  // FX Rates state
  const [fxRates, setFxRates] = useState<FXRatesResponse | null>(null);
  const [fxLoading, setFxLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Fetch FX Rates
  const loadFxRates = async () => {
    try {
      setFxLoading(true);
      const res = await fetch("/api/fx-rates");
      if (res.ok) {
        const data = await res.json();
        setFxRates(data);
      }
    } catch (err) {
      console.error("Failed to load FX rates:", err);
    } finally {
      setFxLoading(false);
    }
  };

  // Fetch Clients
  useEffect(() => {
    async function loadClients() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setCurrentUserId(user.id);
          const { data, error } = await supabase
            .from("clients")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (!error && data && data.length > 0) {
            setClients(data);
          } else {
            // First time user with empty client list - show starter demo items or empty
            setClients(INITIAL_DEMO_CLIENTS);
          }
        } else {
          // Demo Mode
          setIsDemoMode(true);
          const localClients = localStorage.getItem("invoisph_demo_clients");
          if (localClients) {
            try {
              setClients(JSON.parse(localClients));
            } catch {
              setClients(INITIAL_DEMO_CLIENTS);
            }
          } else {
            setClients(INITIAL_DEMO_CLIENTS);
          }
        }
      } catch (err) {
        console.error("Client load failed:", err);
        setClients(INITIAL_DEMO_CLIENTS);
      } finally {
        setLoading(false);
      }
    }

    loadClients();
    loadFxRates();
  }, []);

  const handleSaveClient = async (clientData: Partial<Client>) => {
    const supabase = createClient();

    if (currentUserId && !isDemoMode) {
      if (clientData.id && !clientData.id.startsWith("demo-")) {
        // Update existing
        const { error } = await supabase
          .from("clients")
          .update({
            name: clientData.name!,
            email: clientData.email,
            country: clientData.country || "United States",
            currency: clientData.currency || "USD",
            billing_address: clientData.billing_address,
            notes: clientData.notes,
            archived: clientData.archived ?? false,
            manual_fx_rate: clientData.manual_fx_rate ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", clientData.id)
          .eq("user_id", currentUserId);

        if (error) throw error;

        setClients((prev) =>
          prev.map((c) =>
            c.id === clientData.id ? ({ ...c, ...clientData } as Client) : c
          )
        );
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("clients")
          .insert({
            user_id: currentUserId,
            name: clientData.name!,
            email: clientData.email,
            country: clientData.country || "United States",
            currency: clientData.currency || "USD",
            billing_address: clientData.billing_address,
            notes: clientData.notes,
            manual_fx_rate: clientData.manual_fx_rate ?? null,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setClients((prev) => [data, ...prev]);
        }
      }
    } else {
      // Local state / Demo mode handling
      if (clientData.id) {
        const updated = clients.map((c) =>
          c.id === clientData.id ? ({ ...c, ...clientData } as Client) : c
        );
        setClients(updated);
        localStorage.setItem("invoisph_demo_clients", JSON.stringify(updated));
      } else {
        const newClient: Client = {
          id: `demo-client-${Date.now()}`,
          user_id: "demo-user",
          name: clientData.name!,
          email: clientData.email || null,
          country: clientData.country || "United States",
          currency: clientData.currency || "USD",
          billing_address: clientData.billing_address || null,
          notes: clientData.notes || null,
          archived: false,
          manual_fx_rate: clientData.manual_fx_rate ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const updated = [newClient, ...clients];
        setClients(updated);
        localStorage.setItem("invoisph_demo_clients", JSON.stringify(updated));
      }
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Are you sure you want to remove this client from your directory?")) {
      return;
    }

    const supabase = createClient();

    if (currentUserId && !isDemoMode && !id.startsWith("demo-")) {
      await supabase.from("clients").delete().eq("id", id).eq("user_id", currentUserId);
    }

    const updated = clients.filter((c) => c.id !== id);
    setClients(updated);
    if (isDemoMode) {
      localStorage.setItem("invoisph_demo_clients", JSON.stringify(updated));
    }
  };

  const handleArchiveToggle = async (client: Client, archived: boolean) => {
    // Optimistic local update for a responsive UI
    const updated = clients.map((c) => (c.id === client.id ? { ...c, archived } : c));
    setClients(updated);

    if (isDemoMode || client.id.startsWith("demo-")) {
      localStorage.setItem("invoisph_demo_clients", JSON.stringify(updated));
      return;
    }

    if (!currentUserId) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("clients")
        .update({ archived })
        .eq("id", client.id)
        .eq("user_id", currentUserId);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to update archive status:", err);
      setClients(clients);
    }
  };

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (!showArchived && c.archived) return false;

      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.country.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCurrency =
        selectedCurrency === "ALL" || c.currency === selectedCurrency;

      return matchesSearch && matchesCurrency;
    });
  }, [clients, searchQuery, selectedCurrency, showArchived]);

  const uniqueCurrencies = useMemo(() => {
    const list = Array.from(new Set(clients.map((c) => c.currency)));
    return list;
  }, [clients]);

  const handleSignOut = async () => {
    document.cookie = "invoisph_demo=; path=/; max-age=0";
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    window.location.href = "/login";
  };

  const currentRates = fxRates?.ratesToPHP || FALLBACK_RATES_TO_PHP;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <InvoisPHLogo size="md" />
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-md text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/invoices"
                className="px-3 py-1.5 rounded-md text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors"
              >
                Invoices
              </Link>
              <Link
                href="/clients"
                className="px-3 py-1.5 rounded-md bg-navy-50 text-navy-900 font-bold"
              >
                Clients
              </Link>
              <Link
                href="/tax-dashboard"
                className="px-3 py-1.5 rounded-md text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors"
              >
                8% Tax Tracker
              </Link>
              <Link
                href="/reports"
                className="px-3 py-1.5 rounded-md text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors"
              >
                Proof of Income
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => {
                setEditingClient(null);
                setIsModalOpen(true);
              }}
              className="bg-navy-900 hover:bg-navy-800 text-white font-semibold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Client
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-slate-500 hover:text-red-600"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header & Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Client Directory
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage your local and international clients with automatic BSP exchange rate sync.
            </p>
          </div>

          <Button
            size="default"
            onClick={() => {
              setEditingClient(null);
              setIsModalOpen(true);
            }}
            className="bg-navy-900 hover:bg-navy-800 text-white font-bold shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Client
          </Button>
        </div>

        {/* BSP FX Rates Banner */}
        <div className="rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/50 p-4 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-selyo-800 text-white flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-navy-900 uppercase tracking-wide">
                    Exchange Rates to PHP (Daily)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    EoPT Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live daily rates to PHP; standard fallback rates when the FX API is offline.
                </p>
              </div>
            </div>

            {/* Live Ticker */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
              <div className="flex items-center gap-2 text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="font-bold text-navy-900">1 USD =</span>
                <span className="font-extrabold text-selyo-800">
                  ₱{currentRates.USD?.toFixed(2) || "58.55"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="font-bold text-navy-900">1 AUD =</span>
                <span className="font-extrabold text-selyo-800">
                  ₱{currentRates.AUD?.toFixed(2) || "38.25"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <span className="font-bold text-navy-900">1 EUR =</span>
                <span className="font-extrabold text-selyo-800">
                  ₱{currentRates.EUR?.toFixed(2) || "62.10"}
                </span>
              </div>

              <button
                type="button"
                onClick={loadFxRates}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Refresh FX rates"
              >
                <RefreshCw className={`w-4 h-4 ${fxLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Directory Stats & Search Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by client name, email, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-xs sm:text-sm bg-white"
            />
          </div>

          {/* Currency Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-slate-500 mr-1 hidden sm:inline">
              Currency:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCurrency("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCurrency === "ALL"
                  ? "bg-navy-900 text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              All ({clients.length})
            </button>
            {["USD", "AUD", "EUR", "PHP"].map((cur) => {
              const count = clients.filter((c) => c.currency === cur).length;
              if (count === 0 && !["USD", "PHP"].includes(cur)) return null;
              return (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setSelectedCurrency(cur)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedCurrency === cur
                      ? "bg-selyo-800 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cur} ({count})
                </button>
              );
            })}
          </div>

          {archivedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                showArchived
                  ? "bg-slate-200 text-slate-600 border border-slate-300"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {showArchived ? "Hide archived" : `Show archived (${archivedCount})`}
            </button>
          )}
        </div>

        {/* Clients Cards Grid */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-900 border-t-transparent" />
            <p className="text-xs font-semibold text-slate-500">Loading your clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 bg-white">
            <CardContent className="p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-navy-900 text-base">No clients found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery || selectedCurrency !== "ALL"
                    ? "Try adjusting your search query or currency filter."
                    : "Add your first international or local client to start generating BIR EoPT Service Invoices."}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingClient(null);
                  setIsModalOpen(true);
                }}
                className="bg-navy-900 hover:bg-navy-800 text-white font-semibold"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Your First Client
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClients.map((client) => {
              const clientRate =
                client.manual_fx_rate ?? (currentRates[client.currency] || 1.0);
              const isForeignCurrency = client.currency !== "PHP";

              return (
                <Card
                  key={client.id}
                  className="hover:shadow-md transition-all duration-200 border-slate-200 flex flex-col justify-between"
                >
                  <CardHeader className="pb-3 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base font-extrabold text-navy-900 leading-tight">
                          {client.name}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.country}</span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-navy-50 text-navy-900 border border-navy-100 font-mono">
                        {client.currency}
                      </span>
                    </div>

                    {isForeignCurrency && (
                      <div
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-mono flex items-center justify-between text-slate-600"
                        title={
                          fxRates?.source === "fallback" && client.manual_fx_rate == null
                            ? "FX API unavailable — enter a manual rate in Edit to override"
                            : undefined
                        }
                      >
                        <span className="font-semibold text-slate-500">FX to PHP:</span>
                        <span className="font-bold text-selyo-800">
                          {client.manual_fx_rate != null ? "Manual rate: " : ""}1 {client.currency} = ₱{clientRate.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2 text-xs text-slate-600">
                      {client.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}

                      {client.billing_address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 text-slate-500 text-[11px]">
                            {client.billing_address}
                          </span>
                        </div>
                      )}

                      {client.notes && (
                        <div className="p-2 rounded-md bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900">
                          <strong>Note:</strong> {client.notes}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        href={`/invoices/new?clientId=${client.id}`}
                        className="flex-1"
                      >
                        <Button
                          variant="accent"
                          size="sm"
                          className="w-full text-xs font-bold bg-selyo-800 hover:bg-selyo-700"
                        >
                          <Receipt className="w-3.5 h-3.5 mr-1.5" />
                          Bill Client
                        </Button>
                      </Link>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingClient(client);
                            setIsModalOpen(true);
                          }}
                          className="h-8 w-8 text-slate-600 hover:text-navy-900"
                          title="Edit Client"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleArchiveToggle(client, !client.archived)}
                          className="h-8 w-8 text-slate-400 hover:text-navy-900"
                          title={client.archived ? "Unarchive Client" : "Archive Client"}
                        >
                          {client.archived ? (
                            <ArchiveRestore className="w-3.5 h-3.5" />
                          ) : (
                            <Archive className="w-3.5 h-3.5" />
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteClient(client.id)}
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:border-red-200"
                          title="Delete Client"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Add / Edit Client Modal */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingClient(null);
        }}
        onSave={handleSaveClient}
        client={editingClient}
      />
    </div>
  );
}
