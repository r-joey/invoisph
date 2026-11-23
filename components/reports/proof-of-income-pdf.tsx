"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Profile } from "@/types/database.types";
import type { ProofOfIncomeSummary } from "@/lib/services/proof-of-income";
import { pdfMoney } from "@/components/invoices/service-invoice-pdf";
import { formatInvoiceDate } from "@/lib/services/invoices";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 54,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#0F172A",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0B192C",
    textAlign: "center",
    marginTop: 8,
  },
  subtitle: {
    fontSize: 8.5,
    textAlign: "center",
    color: "#475569",
    marginTop: 3,
  },
  issuerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  issuerLeft: { width: "58%" },
  issuerRight: { width: "38%", textAlign: "right" },
  issuerLine: { fontSize: 8, color: "#475569", marginTop: 1.5 },
  metaTitle: {
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 1.5,
    color: "#64748B",
    marginBottom: 1.5,
  },
  metaLine: { fontSize: 8.5, color: "#0F172A" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 18, gap: 12 },
  summaryCard: {
    flex: 1,
    padding: 7,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  summaryLabel: { fontSize: 7, fontWeight: "bold", letterSpacing: 1, color: "#64748B", marginBottom: 2 },
  summaryValue: { fontSize: 15, fontWeight: "bold", color: "#0B192C" },
  summarySub: { fontSize: 7.5, color: "#475569", marginTop: 1 },
  table: { marginTop: 20 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#0B192C",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  th: { fontSize: 7.5, fontWeight: "bold", color: "#FFFFFF", letterSpacing: 0.5 },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  td: { fontSize: 7.5, color: "#0F172A" },
  stampBox: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  stampTitle: { fontSize: 8, fontWeight: "bold", color: "#0B192C", marginBottom: 2 },
  stampText: { fontSize: 7.5, color: "#475569", marginTop: 1 },
  verificationBox: {
    marginTop: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    backgroundColor: "#F8FAFC",
  },
  verificationLabel: { fontSize: 7, fontWeight: "bold", color: "#64748B", marginBottom: 1 },
  verificationUrl: { fontSize: 7.5, color: "#0F172A" },
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

export function ProofOfIncomePdf({
  profile,
  summary,
}: {
  profile: Profile | null;
  summary: ProofOfIncomeSummary;
}) {
  const issuerName =
    profile?.registered_business_name || profile?.full_name || "Freelancer";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
  const verificationUrl = `${appUrl}/reports/proof-of-income`;

  return (
    <Document
      title={`Proof of Income — ${summary.period.start} to ${summary.period.end}`}
      author={issuerName}
      subject="BIR EoPT Proof of Income (RA 11976)"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          Consolidated Earnings &amp; Client Remittance Summary
        </Text>
        <Text style={styles.subtitle}>
          Proof of Income — sequential earnings record for embassy and bank
          credentialing
        </Text>

        {/* Issuer block + period metadata */}
        <View style={styles.issuerRow}>
          <View style={styles.issuerLeft}>
            <Text style={styles.issuerLine}>{issuerName}</Text>
            {profile?.full_name && profile.full_name !== issuerName && (
              <Text style={styles.issuerLine}>{profile.full_name}</Text>
            )}
            {profile?.registered_address && (
              <Text style={styles.issuerLine}>{profile.registered_address}</Text>
            )}
            <Text style={styles.issuerLine}>
              TIN: {profile?.tin_number || "—"} — RDO: {profile?.rdo_code || "—"}
              {profile?.email ? ` — Email: ${profile.email}` : ""}
            </Text>
          </View>
          <View style={styles.issuerRight}>
            <Text style={styles.metaTitle}>EARNINGS PERIOD</Text>
            <Text style={styles.metaLine}>
              {formatInvoiceDate(summary.period.start)} – {formatInvoiceDate(summary.period.end)}
            </Text>
            <Text style={styles.metaLine}>Invoices: {summary.invoiceCount}</Text>
            <Text style={styles.metaLine}>Generated: {formatInvoiceDate(new Date().toISOString())}</Text>
          </View>
        </View>

        {/* Totals summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL EARNINGS (PHP)</Text>
            <Text style={styles.summaryValue}>{pdfMoney(summary.totalPhp, "PHP")}</Text>
            {summary.byCurrency.map((c) => (
              <Text key={c.currency} style={styles.summarySub}>
                {c.currency}: {pdfMoney(c.total, c.currency)} ({pdfMoney(c.totalPhp, "PHP")})
              </Text>
            ))}
            {summary.byCurrency.length === 0 && (
              <Text style={styles.summarySub}>No paid invoices in this period.</Text>
            )}
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>PAID INVOICES</Text>
            <Text style={styles.summaryValue}>{summary.invoiceCount}</Text>
            <Text style={styles.summarySub}>BIR-compliant Service Invoices (RA 11976)</Text>
          </View>
        </View>

        {/* Earnings table */}
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.th, { width: "8%" }]}>#</Text>
            <Text style={[styles.th, { width: "20%" }]}>INVOICE</Text>
            <Text style={[styles.th, { width: "16%" }]}>DATE</Text>
            <Text style={[styles.th, { width: "24%" }]}>CLIENT</Text>
            <Text style={[styles.th, { width: "11%" }]}>COUNTRY</Text>
            <Text style={[styles.th, { width: "9%" }]}>CURRENCY</Text>
            <Text style={[styles.th, { width: "13%" }]}>AMOUNT</Text>
            <Text style={[styles.th, { width: "11%" }]}>PHP</Text>
            <Text style={[styles.th, { width: "10%" }]}>PAYMENT</Text>
          </View>
          {summary.rows.map((row, index) => (
            <View key={`${row.invoiceNumber}-${index}`} style={styles.tr} wrap={false}>
              <Text style={[styles.td, { width: "8%", fontSize: 7 }]}>{index + 1}</Text>
              <Text style={[styles.td, { width: "20%", fontSize: 7.5 }]}>{row.invoiceNumber}</Text>
              <Text style={[styles.td, { width: "16%" }]}>{formatInvoiceDate(row.issueDate)}</Text>
              <Text style={[styles.td, { width: "24%", fontSize: 7.5 }]}>{row.clientName}</Text>
              <Text style={[styles.td, { width: "11%", fontSize: 7.5 }]}>{row.clientCountry}</Text>
              <Text style={[styles.td, { width: "9%", fontSize: 7.5 }]}>{row.currency}</Text>
              <Text style={[styles.td, { width: "13%" }]}>{pdfMoney(row.amount, row.currency)}</Text>
              <Text style={[styles.td, { width: "11%", fontSize: 7.5 }]}>{pdfMoney(row.amountPhp, "PHP")}</Text>
              <Text style={[styles.td, { width: "10%", fontSize: 7.5 }]}>{row.paymentMethod || "—"}</Text>
            </View>
          ))}
          {summary.rows.length === 0 && (
            <Text style={styles.td}>No paid invoices in this period.</Text>
          )}
        </View>

        {/* Digital signature + verification */}
        <View style={styles.stampBox}>
          <Text style={styles.stampTitle}>
            DIGITAL SIGNATURE — Issuer: {profile?.tin_number || issuerName}
          </Text>
          <Text style={styles.stampText}>
            This certificate is issued electronically by InvoisPH. It is a proof of
            earnings for embassy and bank credentialing purposes — not an Official
            Receipt.
          </Text>
        </View>
        <View style={styles.verificationBox}>
          <Text style={styles.verificationLabel}>VERIFICATION</Text>
          <Text style={styles.verificationUrl}>Verification link: {verificationUrl}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            This certificate aggregates all paid BIR-compliant Service Invoices
            (RA 11976) issued by {issuerName} in the period {formatInvoiceDate(summary.period.start)} – {formatInvoiceDate(summary.period.end)}.
            Invoice amounts in foreign currencies are converted to PHP using BSP
            reference rates recorded on each invoice. Earnings should be interpreted
            in PHP for BIR filing purposes.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
