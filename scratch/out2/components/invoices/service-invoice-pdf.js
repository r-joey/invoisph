"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceInvoicePdf = ServiceInvoicePdf;
const jsx_runtime_1 = require("react/jsx-runtime");
const renderer_1 = require("@react-pdf/renderer");
const invoices_1 = require("@/lib/services/invoices");
/**
 * BIR EoPT Service Invoice as a print-ready A4 PDF.
 *
 * Only the standard Helvetica family is used (no font downloads), and amounts
 * are written as "PHP 1,234.56" rather than with the ₱ glyph, because the PDF
 * standard fonts do not carry U+20B1.
 */
const styles = renderer_1.StyleSheet.create({
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
function pdfMoney(amount, currency) {
    const formatted = amount.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${currency} ${formatted}`;
}
const STATUS_STYLE = {
    draft: { bg: "#E2E8F0", fg: "#334155", label: "DRAFT" },
    sent: { bg: "#FEF3C7", fg: "#92400E", label: "UNPAID" },
    paid: { bg: "#D1FAE5", fg: "#065F46", label: "PAID" },
    cancelled: { bg: "#FEE2E2", fg: "#991B1B", label: "CANCELLED" },
};
function ServiceInvoicePdf({ profile, client, invoice, items, }) {
    const status = STATUS_STYLE[invoice.status];
    const businessName = profile?.registered_business_name || profile?.full_name || "Freelancer";
    const isForeign = invoice.currency !== "PHP";
    return ((0, jsx_runtime_1.jsx)(renderer_1.Document, { title: `Service Invoice ${invoice.invoice_number}`, author: businessName, subject: "BIR EoPT Service Invoice (RA 11976)", children: (0, jsx_runtime_1.jsxs)(renderer_1.Page, { size: "A4", style: styles.page, children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.header, children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: { width: "58%" }, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.bizName, children: businessName }), profile?.full_name && profile.full_name !== businessName && ((0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.bizLine, children: profile.full_name })), profile?.registered_address && ((0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.bizLine, children: profile.registered_address })), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.bizLine, children: ["TIN: ", profile?.tin_number || "—", "   RDO: ", profile?.rdo_code || "—"] }), profile?.is_vat_registered && ((0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.bizLine, children: "VAT Registered Taxpayer" }))] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: { width: "40%" }, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.docLabel, children: "SERVICE INVOICE" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.docNumber, children: invoice.invoice_number }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [
                                        styles.statusChip,
                                        { backgroundColor: status.bg, color: status.fg },
                                    ], children: status.label })] })] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.metaRow, children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.metaCol, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.label, children: "BILL TO" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.strong, children: client?.name || "—" }), client?.billing_address && ((0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.metaLine, children: client.billing_address })), client?.country && (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.metaLine, children: client.country }), client?.email && (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.metaLine, children: client.email })] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.metaCol, children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.metaPair, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.metaPairLabel, children: "Date of Issue" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.metaPairValue, children: (0, invoices_1.formatInvoiceDate)(invoice.issue_date) })] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.metaPair, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.metaPairLabel, children: "Payment Due" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.metaPairValue, children: (0, invoices_1.formatInvoiceDate)(invoice.due_date) })] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.metaPair, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.metaPairLabel, children: "Currency" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.metaPairValue, children: invoice.currency })] }), invoice.status === "paid" && ((0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.metaPair, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.metaPairLabel, children: "Paid On" }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.metaPairValue, children: [(0, invoices_1.formatInvoiceDate)(invoice.payment_date), invoice.payment_method ? ` · ${invoice.payment_method}` : ""] })] }))] })] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.table, children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.tableHead, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.th, styles.cDesc], children: "DESCRIPTION" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.th, styles.cQty], children: "QTY" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.th, styles.cRate], children: "RATE" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.th, styles.cAmount], children: "AMOUNT" })] }), items.map((item, index) => ((0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.tr, wrap: false, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.cDesc, { fontSize: 8.5 }], children: item.description }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.cQty, { fontSize: 8.5 }], children: Number(item.quantity) }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.cRate, { fontSize: 8.5 }], children: pdfMoney(Number(item.rate_or_unit_price), invoice.currency) }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.cAmount, { fontSize: 8.5 }], children: pdfMoney(Number(item.total_amount), invoice.currency) })] }, item.id || index)))] }), (0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.totalsWrap, children: (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.totalsBox, children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.totalRow, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.totalLabel, children: "Subtotal" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.totalValue, children: pdfMoney(invoice.subtotal, invoice.currency) })] }), Number(invoice.discount) > 0 && ((0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.totalRow, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.totalLabel, children: "Discount" }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.totalValue, children: ["- ", pdfMoney(invoice.discount, invoice.currency)] })] })), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.grandRow, children: [(0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.grandLabel, children: ["TOTAL (", invoice.currency, ")"] }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.grandValue, children: pdfMoney(invoice.total_original_currency, invoice.currency) })] }), isForeign && ((0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.totalRow, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.totalLabel, children: "PHP equivalent" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.totalValue, children: pdfMoney(invoice.total_in_php, "PHP") })] })), Number(invoice.withholding_tax_rate) > 0 && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.totalRow, children: [(0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.totalLabel, children: ["Less ", Number(invoice.withholding_tax_rate), "% withheld (2307)"] }), (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: [styles.totalValue, { color: "#B45309" }], children: ["- ", pdfMoney(invoice.withholding_tax_amount_php, "PHP")] })] }), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.totalRow, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.totalLabel, { fontWeight: "bold" }], children: "Net collectible" }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: [styles.totalValue, { fontWeight: "bold" }], children: pdfMoney(invoice.net_amount_payable_php, "PHP") })] })] }))] }) }), isForeign && ((0, jsx_runtime_1.jsx)(renderer_1.View, { style: styles.fxNote, children: (0, jsx_runtime_1.jsxs)(renderer_1.Text, { style: styles.fxNoteText, children: ["Conversion rate applied on this invoice: 1 ", invoice.currency, " = PHP", " ", Number(invoice.bsp_fx_rate).toFixed(4), " \u2014 recorded so the PHP equivalent above stays auditable for BIR."] }) })), (0, jsx_runtime_1.jsxs)(renderer_1.View, { style: styles.footer, fixed: true, children: [(0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.footerText, children: invoice.notes_disclaimer ||
                                "THIS SERVICE INVOICE COMPLIES WITH RA 11976 (EASE OF PAYING TAXES ACT)." }), (0, jsx_runtime_1.jsx)(renderer_1.Text, { style: styles.footerText, children: "This document is a Service Invoice, not an Official Receipt. It is valid for claiming expenses and tax credits. Keep all sequentially numbered invoices \u2014 including cancelled ones \u2014 for your BIR records." })] })] }) }));
}
