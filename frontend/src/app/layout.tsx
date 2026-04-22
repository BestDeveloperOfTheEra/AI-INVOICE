import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://autoextract.in'),
  title: {
    default: "AutoExtract AI - Advanced AI Invoice Reader & Data Extraction",
    template: "%s | AutoExtract AI"
  },
  description: "Stop manual data entry. AutoExtract AI is the ultimate AI Invoice Reader that extracts line items, taxes, and vendor data with 99% accuracy. Export to Excel, PDF, or API.",
  keywords: ["AI Invoice Reader", "Invoice Extraction Software", "Automated Invoice Processing", "Invoice OCR API", "Receipt Scanner AI", "Automated Accounts Payable", "Invoice to Excel Converter"],
  authors: [{ name: "AutoExtract Team" }],
  openGraph: {
    title: "AutoExtract AI - The Smartest AI Invoice Reader",
    description: "Convert any Invoice into structured data instantly. Automated Extraction for Invoices & Receipts.",
    url: "https://autoextract.in",
    siteName: "AutoExtract AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoExtract AI - Smart Invoice Reader",
    description: "Automate your data extraction from Invoices & Receipts with AI.",
  },
  alternates: {
    canonical: "/",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-mesh">
        <Script 
          src="https://checkout.razorpay.com/v1/checkout.js" 
          strategy="lazyOnload" 
        />
        <Script 
          src="https://accounts.google.com/gsi/client" 
          strategy="beforeInteractive"
        />

        <div className="print:hidden">
          <Navbar />
        </div>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
