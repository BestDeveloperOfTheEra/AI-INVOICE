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
    default: "AutoExtract - AI Document Processing & Invoice Extraction",
    template: "%s | AutoExtract AI"
  },
  description: "Automate your data extraction from Invoices, Medical Reports, and Legal Documents securely with AutoExtract AI. Export to Excel, PDF, and API.",
  keywords: ["AI Document Extraction", "Invoice Processing", "OCR API", "Automated Bookkeeping", "Invoice to Excel"],
  authors: [{ name: "AutoExtract Team" }],
  openGraph: {
    title: "AutoExtract - AI Document Processing",
    description: "Turn your Documents into Data instantly with AI.",
    url: "https://autoextract.in",
    siteName: "AutoExtract AI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoExtract - AI Document Processing",
    description: "Automate your data extraction from Invoices & Documents.",
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
        <Script 
          src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js" 
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
