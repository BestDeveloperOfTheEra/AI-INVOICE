import Link from "next/link";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AutoExtract AI",
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "0",
      "highPrice": "4999",
      "priceCurrency": "INR"
    },
    "featureList": "Invoice Extraction, AI Document Parsing, Medical Report OCR, Legal Document Processing"
  };

  return (
    <div className="flex flex-col items-center justify-center pt-24 pb-16 px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <section className="text-center w-full max-w-5xl mx-auto flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-blue-400 font-medium mb-4 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          ✨ Now supporting automated Invoice processing
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
          Turn your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Documents</span> 
          <br className="hidden md:block"/> into Data.
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Upload thousands of invoices, medical reports, and legal documents. 
          Extract structured data instantly into Excel, PDF, or our API Sandbox.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link href="/dashboard" className="px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-all shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)]">
            Start Extracting
          </Link>
          <a href="/api/docs" className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all backdrop-blur-sm">
            Explore Developers API
          </a>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="w-full max-w-6xl mx-auto mt-32 grid md:grid-cols-3 gap-6 px-4">
        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md hover:bg-white/[0.04] transition-colors">
          <div className="w-12 h-12 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-2xl mb-6">
            📄
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">Invoice Parsing</h3>
          <p className="text-gray-400 leading-relaxed">
            Automatically extract line items, totals, dates, and vendor information directly to your customized records.
          </p>
        </div>
        
        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md hover:bg-white/[0.04] transition-colors">
          <div className="w-12 h-12 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-2xl mb-6">
            🛠️
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">API Sandbox</h3>
          <p className="text-gray-400 leading-relaxed">
            Securely test and integrate our extraction engine directly into your own applications using our developer sandbox.
          </p>
        </div>
        
        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md hover:bg-white/[0.04] transition-colors">
          <div className="w-12 h-12 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl mb-6">
            📊
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">One-Click Exports</h3>
          <p className="text-gray-400 leading-relaxed">
            View extracted data directly on your dashboard. Export to Excel or PDF format, or email it instantly to clients.
          </p>
        </div>
      </section>
    </div>
  );
}
