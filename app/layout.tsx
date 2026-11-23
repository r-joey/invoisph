import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "InvoisPH — BIR EoPT Service Invoicing & 8% Flat Tax Tracker",
  description:
    "Zero-Anxiety Invoicing & 8% BIR Tax Tracking for Filipino Freelancers and Remote Workers. Generate compliant EoPT Service Invoices with auto-BSP FX conversion.",
  keywords: [
    "BIR",
    "EoPT",
    "Service Invoice",
    "8% Tax Rate",
    "Filipino Freelancers",
    "Upwork Philippines",
    "eBIRForms 1701Q",
    "Invoicing Software PH",
  ],
};

export const viewport: Viewport = {
  themeColor: "#0B192C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        {children}
      </body>
    </html>
  );
}
