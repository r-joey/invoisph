"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Client, Invoice, InvoiceItem, Profile } from "@/types/database.types";
import { formatInvoiceDate } from "@/lib/services/invoices";

/**
 * BIR EoPT Service Invoice as a print-ready A4 PDF.
 *
 * Only the standard Helvetica family is used (no font downloads), and amounts
 * are written as "PHP 1,234.56" rather than with the ₱ glyph, because the PDF
 * standard fonts do not carry U+20B1.
 */

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 54,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#0F172A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#0B192C",
    paddingBottom: 12,
  },
  bizName: { fontSize: 14, fontWeight: "bold", color: "#0B192C" },
  bizLine: { fontSize: 8.5, color: "#475569", marginTop: 2 },
  docLabel: {
    fontSize: 8,
    letterSpacing: 2.2,
    fontWeight: "bold",
    color: "#1E40AF",
    textAlign: "right",
  },
  docNumber: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0B192C",
    textAlign: "right",
    marginTop: 3,
  },
  statusChip: {
    marginTop: 4,
    alignSelf: "flex-end",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 7.5,
    fontWeight: "bold",
  },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  metaCol: { width: "48%" },
  label: {
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 1,
    color: "#64748B",
    marginBottom: 3,
  },
  strong: { fontSize: 9.5, fontWeight: "bold", color: "#0B192C" },
  metaLine: { fontSize: 8.5, color: "#475569", marginTop: 1.5 },
  metaPair: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 2,
  },
  metaPairLabel: { fontSize: 8.5, color: "#64748B", marginRight: 8 },
  metaPairValue: { fontSize: 8.5, color: "#0F172A", fontWeight: "bold" },
  table: { marginTop: 18 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#0B192C",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  th: { fontSize: 7.5, fontWeight: "bold", color: "#FFFFFF", letterSpacing: 0.6 },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  cDesc: { width: "52%" },
  cQty: { width: "14%", textAlign: "right" },
  cRate: { width: "17%", textAlign: "right" },
  cAmount: { width: "17%", textAlign: "right" },
  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalsBox: { width: "45%" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2.5,
  },
  totalLabel: { fontSize: 8.5, color: "#475569" },
  totalValue: { fontSize: 8.5, color: "#0F172A" },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#CBD5E1",
    marginTop: 3,
    paddingTop: 5,
  },
  grandLabel: { fontSize: 10, fontWeight: "bold", color: "#0B192C" },
  grandValue: { fontSize: 10, fontWeight: "bold", color: "#0B192C" },
  fxNote: {
    marginTop: 14,
    padding: 7,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
  },
  fxNoteText: { fontSize: 7.5, color: "#475569" },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    borderTopWidth: 0.75,
    borderTopColor: "#CBD5E1",
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: "#64748B", lineHeight: 1.4 },
});

export function pdfMoney(amount: number, currency: string): string {
  const formatted = amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
}

/**
 * Derived payment terms shown in the metadata box: "Net N" when a due date is
 * set after the issue date, "Due on receipt" when both are the same day.
 */
function paymentTermsText(invoice: Invoice): string | null {
  if (!invoice.issue_date || !invoice.due_date) return null;
  const issue = new Date(`${invoice.issue_date}T00:00:00`);
  const due = new Date(`${invoice.due_date}T00:00:00`);
  if (Number.isNaN(issue.getTime()) || Number.isNaN(due.getTime())) return null;
  if (due.getTime() <= issue.getTime()) return "Due on receipt";
  const days = Math.round((due.getTime() - issue.getTime()) / 86_400_000);
  return `Net ${Math.max(1, days)}`;
}

const STATUS_STYLE: Record<
  Invoice["status"],
  { bg: string; fg: string; label: string }
> = {
  draft: { bg: "#E2E8F0", fg: "#334155", label: "DRAFT" },
  sent: { bg: "#FEF3C7", fg: "#92400E", label: "UNPAID" },
  paid: { bg: "#D1FAE5", fg: "#065F46", label: "PAID" },
  cancelled: { bg: "#FEE2E2", fg: "#991B1B", label: "CANCELLED" },
};

export interface ServiceInvoicePdfProps {
  profile: Profile | null;
  client: Client | null;
  invoice: Invoice;
  items: InvoiceItem[];
}

export function ServiceInvoicePdf({
  profile,
  client,
  invoice,
  items,
}: ServiceInvoicePdfProps) {
  const status = STATUS_STYLE[invoice.status];
  const businessName =
    profile?.registered_business_name || profile?.full_name || "Freelancer";
  const isForeign = invoice.currency !== "PHP";

  return (
    <Document
      title={`Service Invoice ${invoice.invoice_number}`}
      author={businessName}
      subject="BIR EoPT Service Invoice (RA 11976)"
    >
      <Page size="A4" style={styles.page}>
        {/* Issuer / document identity */}
        <View style={styles.header}>
          <View style={{ width: "58%" }}>
            <Text style={styles.bizName}>{businessName}</Text>
            {profile?.full_name && profile.full_name !== businessName && (
              <Text style={styles.bizLine}>{profile.full_name}</Text>
            )}
            {profile?.registered_address && (
              <Text style={styles.bizLine}>{profile.registered_address}</Text>
            )}
            <Text style={styles.bizLine}>
              TIN: {profile?.tin_number || "—"}   RDO: {profile?.rdo_code || "—"}
            </Text>
            {profile?.is_vat_registered && (
              <Text style={styles.bizLine}>VAT Registered Taxpayer</Text>
            )}
            {profile?.email && (
              <Text style={styles.bizLine}>Email: {profile.email}</Text>
            )}
          </View>

          <View style={{ width: "40%" }}>
            <Text style={styles.docLabel}>SERVICE INVOICE</Text>
            <Text style={styles.docNumber}>{invoice.invoice_number}</Text>
            <Text
              style={[
                styles.statusChip,
                { backgroundColor: status.bg, color: status.fg },
              ]}
            >
              {status.label}
            </Text>
          </View>
        </View>

        {/* Bill-to and invoice metadata */}
        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.label}>BILL TO</Text>
            <Text style={styles.strong}>{client?.name || "—"}</Text>
            {client?.billing_address && (
              <Text style={styles.metaLine}>{client.billing_address}</Text>
            )}
            {client?.country && <Text style={styles.metaLine}>{client.country}</Text>}
            {client?.email && <Text style={styles.metaLine}>{client.email}</Text>}
          </View>

          <View style={styles.metaCol}>
            <View style={styles.metaPair}>
              <Text style={styles.metaPairLabel}>Date of Issue</Text>
              <Text style={styles.metaPairValue}>
                {formatInvoiceDate(invoice.issue_date)}
              </Text>
            </View>
            <View style={styles.metaPair}>
              <Text style={styles.metaPairLabel}>Due Date</Text>
              <Text style={styles.metaPairValue}>
                {formatInvoiceDate(invoice.due_date)}
              </Text>
            </View>
            {paymentTermsText(invoice) && (
              <View style={styles.metaPair}>
                <Text style={styles.metaPairLabel}>Payment Terms</Text>
                <Text style={styles.metaPairValue}>
                  {paymentTermsText(invoice)}
                </Text>
              </View>
            )}
            <View style={styles.metaPair}>
              <Text style={styles.metaPairLabel}>Currency</Text>
              <Text style={styles.metaPairValue}>{invoice.currency}</Text>
            </View>
            {invoice.status === "paid" && (
              <View style={styles.metaPair}>
                <Text style={styles.metaPairLabel}>Paid On</Text>
                <Text style={styles.metaPairValue}>
                  {formatInvoiceDate(invoice.payment_date)}
                  {invoice.payment_method ? ` · ${invoice.payment_method}` : ""}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Line items */}
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.cDesc]}>DESCRIPTION</Text>
            <Text style={[styles.th, styles.cQty]}>QTY</Text>
            <Text style={[styles.th, styles.cRate]}>RATE</Text>
            <Text style={[styles.th, styles.cAmount]}>AMOUNT</Text>
          </View>

          {items.map((item, index) => (
            <View key={item.id || index} style={styles.tr} wrap={false}>
              <Text style={[styles.cDesc, { fontSize: 8.5 }]}>
                {item.description}
              </Text>
              <Text style={[styles.cQty, { fontSize: 8.5 }]}>
                {Number(item.quantity)}
              </Text>
              <Text style={[styles.cRate, { fontSize: 8.5 }]}>
                {pdfMoney(Number(item.rate_or_unit_price), invoice.currency)}
              </Text>
              <Text style={[styles.cAmount, { fontSize: 8.5 }]}>
                {pdfMoney(Number(item.total_amount), invoice.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsWrap}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {pdfMoney(invoice.subtotal, invoice.currency)}
              </Text>
            </View>
            {Number(invoice.discount) > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={styles.totalValue}>
                  - {pdfMoney(invoice.discount, invoice.currency)}
                </Text>
              </View>
            )}
            <View style={styles.grandRow}>
              <Text style={styles.grandLabel}>TOTAL ({invoice.currency})</Text>
              <Text style={styles.grandValue}>
                {pdfMoney(invoice.total_original_currency, invoice.currency)}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>PHP equivalent</Text>
              <Text style={styles.totalValue}>
                {pdfMoney(invoice.total_in_php, "PHP")}
              </Text>
            </View>

            {Number(invoice.withholding_tax_rate) > 0 && (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    Less {Number(invoice.withholding_tax_rate)}% withheld (2307)
                  </Text>
                  <Text style={[styles.totalValue, { color: "#B45309" }]}>
                    - {pdfMoney(invoice.withholding_tax_amount_php, "PHP")}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { fontWeight: "bold" }]}>
                    Net collectible
                  </Text>
                  <Text style={[styles.totalValue, { fontWeight: "bold" }]}>
                    {pdfMoney(invoice.net_amount_payable_php, "PHP")}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Conversion provenance */}
        {isForeign && (
          <View style={styles.fxNote}>
            <Text style={styles.fxNoteText}>
              Conversion rate applied on this invoice: 1 {invoice.currency} = PHP{" "}
              {Number(invoice.bsp_fx_rate).toFixed(4)} — recorded so the PHP
              equivalent above stays auditable for BIR.
            </Text>
          </View>
        )}

        {/* Mandatory EoPT disclaimer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {invoice.notes_disclaimer ||
              "THIS SERVICE INVOICE COMPLIES WITH RA 11976 (EASE OF PAYING TAXES ACT)."}
          </Text>
          <Text style={styles.footerText}>
            This document is a Service Invoice, not an Official Receipt. It is
            valid for claiming expenses and tax credits. Keep all sequentially
            numbered invoices — including cancelled ones — for your BIR records.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
