import Link from "next/link";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "AutoExtract AI - Invoice Reader",
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "0",
      "highPrice": "4999",
      "priceCurrency": "INR"
    },
    "featureList": "Invoice Extraction, AI Invoice Reader, Automated Billing, Receipt OCR, Accounts Payable Automation"
  };

  return (
    <div className="flex flex-col items-center justify-center pt-24 pb-16 px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Section */}
      <section className="text-center w-full max-w-5xl mx-auto flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-blue-600 dark:text-blue-400 font-medium mb-4 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          🚀 The AI-First Invoice Processing Solution
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-tight">
          The Smartest <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-600">AI Invoice Reader</span>
          <br className="hidden md:block" /> for Your Business.
        </h1>

        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Upload thousands of Invoices and Receipts. 
          Extract structured data instantly including Line Items, Tax, and Totals into Excel, PDF, or your own ERP via API.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link href="/dashboard" className="px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-all shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)]">
            Start Free Trial
          </Link>
          <a href="/api/docs" className="px-8 py-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-semibold hover:bg-gray-200 dark:hover:bg-white/10 transition-all backdrop-blur-sm">
            Developer API Docs
          </a>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section id="features" className="w-full max-w-6xl mx-auto mt-32 grid md:grid-cols-3 gap-6 px-4">
        <div className="p-8 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none backdrop-blur-md hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors relative group overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl mb-6">
            📄
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">Line Item Extraction</h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Our AI model goes beyond simple OCR. It understands the context of your invoices, extracting line items, descriptions, quantities, and unit prices with precision.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none backdrop-blur-md hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors relative group overflow-hidden">
          <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl mb-6">
            ⚡
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">Bulk Batch Processing</h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Stop uploading one by one. Process hundreds of invoices in a single batch. Perfect for monthly accounting and audit preparations.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none backdrop-blur-md hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors relative group overflow-hidden">
          <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl mb-6">
            🔗
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">ERP Integration API</h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Seamlessly push extracted invoice data directly into Tally, QuickBooks, Zoho, or your custom internal systems via our robust API.
          </p>
        </div>
      </section>

      {/* SEO Content Section: Why Choose AutoExtract AI */}
      <section className="w-full max-w-4xl mx-auto mt-40 px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight"> why businesses use our <span className="text-blue-600 dark:text-blue-500">AI Invoice Reader</span></h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-12">
          Manual data entry is prone to human error and costs your business hundreds of productive hours. 
          AutoExtract AI leverages advanced Large Language Models (LLMs) to read and understand invoices just like a human accountant would, but 100x faster.
        </p>

        <div className="grid md:grid-cols-2 gap-12 text-left mt-16">
          <div>
            <h4 className="text-foreground font-bold mb-4 flex items-center gap-2">
              <span className="text-green-600 dark:text-green-500">✓</span> Reduce Manual Entry by 95%
            </h4>
            <p className="text-gray-400">Automate your workflow and let your team focus on high-value tasks instead of copying numbers from PDFs.</p>
          </div>
          <div>
            <h4 className="text-foreground font-bold mb-4 flex items-center gap-2">
              <span className="text-green-600 dark:text-green-500">✓</span> 99.9% Extraction Accuracy
            </h4>
            <p className="text-gray-400">Our AI identifies vendor names, dates, SGST/CGST, and totals even on poorly scanned or hand-written invoices.</p>
          </div>
          <div>
            <h4 className="text-foreground font-bold mb-4 flex items-center gap-2">
              <span className="text-green-600 dark:text-green-500">✓</span> Multi-Currency & Language Support
            </h4>
            <p className="text-gray-400">Whether it's an invoice from Europe, Asia, or the USA, AutoExtract handles global formats with ease.</p>
          </div>
          <div>
            <h4 className="text-foreground font-bold mb-4 flex items-center gap-2">
              <span className="text-green-600 dark:text-green-500">✓</span> ISO-Grade Security
            </h4>
            <p className="text-gray-400">Your documents are processed securely and encrypted. We prioritize your privacy and data sovereignty.</p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="w-full max-w-6xl mx-auto mt-40 px-6 py-20 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-[3rem]">
        <h2 className="text-3xl md:text-5xl font-bold text-foreground text-center mb-16 tracking-tight">How it Works</h2>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-blue-600/20">1</div>
            <h3 className="text-xl font-bold text-foreground mb-3">Upload Documents</h3>
            <p className="text-gray-600 dark:text-gray-400">Drag and drop your PDF, JPG, or PNG invoices directly into our dashboard or use the API.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-blue-600/20">2</div>
            <h3 className="text-xl font-bold text-foreground mb-3">AI Processing</h3>
            <p className="text-gray-600 dark:text-gray-400">Our advanced AI models analyze the structure and extract every critical data point instantly.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-lg shadow-blue-600/20">3</div>
            <h3 className="text-xl font-bold text-foreground mb-3">Export & Sync</h3>
            <p className="text-gray-600 dark:text-gray-400">Download your data as Excel, CSV, or PDF, or let our API push it directly to your ERP software.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section for SEO */}
      <section className="w-full max-w-4xl mx-auto mt-40 mb-32 px-6">
        <h2 className="text-3xl md:text-5xl font-bold text-foreground text-center mb-16 tracking-tight">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-foreground mb-2">What is an AI Invoice Reader?</h3>
            <p className="text-gray-600 dark:text-gray-400">An AI Invoice Reader is a software that uses Artificial Intelligence and Machine Learning to automatically identify and extract data from invoices and receipts. Unlike traditional OCR, it understands the context and layout of different vendors.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-foreground mb-2">How accurate is the data extraction?</h3>
            <p className="text-gray-600 dark:text-gray-400">AutoExtract AI achieves up to 99.9% accuracy on standard invoices. It can handle line items, tax details, vendor information, and totals even on complex layouts or scanned documents.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-foreground mb-2">Can I export extraction results to Excel?</h3>
            <p className="text-gray-600 dark:text-gray-400">Yes! You can export your processed invoices directly to Excel, CSV, or PDF formats with a single click from your dashboard.</p>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none">
            <h3 className="text-lg font-bold text-foreground mb-2">Does it support Tally or Zoho Integration?</h3>
            <p className="text-gray-600 dark:text-gray-400">Absolutely. You can use our Developer API to push data directly into accounting software like Tally, Zoho Books, QuickBooks, and SAP.</p>
          </div>
        </div>
      </section>

      {/* Create Account Section */}
      <section className="w-full max-w-6xl mx-auto mt-40 px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-[4rem] p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px]"></div>
          
          <div className="space-y-8">
            <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter leading-none">
              CREATE <br /> ACCOUNT
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              Start extracting data today with our enterprise-grade neural engine. 
              Setup takes less than 60 seconds.
            </p>
            <div className="space-y-4">
               <div className="flex items-center gap-4 text-green-500 font-black uppercase tracking-widest text-xs bg-green-500/5 w-fit px-6 py-3 rounded-2xl border border-green-500/10">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                 Spam Protected
               </div>
               <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold italic">Bot detection & Neural Captcha active</p>
            </div>
            <Link href="/login?register=true" className="inline-block px-12 py-5 bg-blue-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-500 transition-all shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95">
              Initialize Signup
            </Link>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/10 rounded-[3rem] p-10 shadow-2xl rotate-2 group-hover:rotate-0 transition-transform duration-1000">
               <div className="space-y-6">
                  <div className="w-12 h-1 bg-blue-600/50 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-gray-100 dark:bg-white/5 rounded-md"></div>
                    <div className="h-10 w-full bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-1/2 bg-gray-100 dark:bg-white/5 rounded-md"></div>
                    <div className="h-10 w-full bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10"></div>
                  </div>
                  <div className="pt-4 space-y-4">
                    <div className="h-3 w-1/3 bg-blue-500/10 dark:bg-blue-500/20 rounded-md"></div>
                    <div className="h-14 w-full bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/30 rounded-2xl flex items-center justify-center gap-4">
                      <span className="text-blue-600 dark:text-blue-400 font-mono font-black">7 + 4 = </span>
                      <div className="w-12 h-8 bg-blue-100 dark:bg-blue-500/20 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-14 w-full bg-blue-600 rounded-xl shadow-lg"></div>
               </div>
            </div>
            {/* Floating Badges */}
            <div className="absolute -top-6 -right-6 bg-[#1a1a1a] border border-white/10 p-4 rounded-2xl shadow-2xl animate-bounce duration-[3000ms]">
               <span className="text-xl">🔒</span>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="w-full max-w-4xl mx-auto mt-40 mb-20 p-12 rounded-[2rem] bg-gradient-to-br from-blue-600/5 to-indigo-700/5 dark:from-blue-600/10 dark:to-indigo-700/10 border border-blue-500/10 dark:border-blue-500/20 text-center relative overflow-hidden backdrop-blur-xl">
        <div className="absolute inset-0 bg-blue-600/5 opacity-10"></div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 relative z-10">Ready to automate your Invoicing?</h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-10 max-w-2xl mx-auto relative z-10">Join 500+ businesses who have eliminated manual data entry. Start your free trial today.</p>
        <Link href="/login" className="inline-block px-10 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-all shadow-xl relative z-10">
          Get Started for Free
        </Link>
      </section>
    </div>
  );
}
