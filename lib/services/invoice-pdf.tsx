"use client";

import type { Client, Invoice, InvoiceItem, Profile } from "@/types/database.types";

export interface InvoicePdfData {
  profile: Profile | null;
  client: Client | null;
  invoice: Invoice;
  items: InvoiceItem[];
}

/**
 * Renders and downloads the Service Invoice as a PDF.
 *
 * `@react-pdf/renderer` and the template are imported lazily so the ~500 kB
 * renderer only loads when someone actually clicks Download.
 */
export async function downloadInvoicePdf(data: InvoicePdfData): Promise<void> {
  const [{ pdf }, { ServiceInvoicePdf }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/invoices/service-invoice-pdf"),
  ]);

  const blob = await pdf(
    <ServiceInvoicePdf
      profile={data.profile}
      client={data.client}
      invoice={data.invoice}
      items={data.items}
    />
  ).toBlob();

  const safeNumber = data.invoice.invoice_number.replace(/[^\w.-]+/g, "-");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `InvoisPH-Service-Invoice-${safeNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a tick to start the download before releasing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
