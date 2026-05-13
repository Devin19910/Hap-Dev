export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-brand-900 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <span className="text-xl font-bold tracking-tight">AI Automation Co</span>
        <div className="flex gap-6 text-sm text-white/70">
          <a href="#services" className="hover:text-white transition">Services</a>
          <a href="#pricing" className="hover:text-white transition">Pricing</a>
          <a href="/dashboard" className="bg-brand-500 text-white px-4 py-2 rounded-lg hover:bg-sky-400 transition">
            Dashboard
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-4 pt-24 pb-20">
        <span className="text-brand-500 text-sm font-semibold tracking-widest uppercase mb-4">
          Powered by OpenAI · Claude · Gemini
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight max-w-3xl">
          Automate Your Business with AI
        </h1>
        <p className="mt-6 text-lg text-white/60 max-w-xl">
          We build smart automations that save time, generate content, and handle repetitive
          tasks — so you can focus on growing.
        </p>
        <div className="mt-10 flex gap-4">
          <a
            href="#pricing"
            className="bg-brand-500 hover:bg-sky-400 transition px-6 py-3 rounded-xl font-semibold text-white"
          >
            Get Started Free
          </a>
          <a
            href="#services"
            className="border border-white/20 hover:border-white/50 transition px-6 py-3 rounded-xl text-white/80"
          >
            See Services
          </a>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="px-8 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">What We Automate</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Content Generation", desc: "Blog posts, social media, emails — generated in seconds with your brand voice." },
            { title: "Data Processing", desc: "Extract, summarize, and classify data from documents, spreadsheets, or APIs." },
            { title: "Customer Support", desc: "AI chatbots that answer FAQs and triage tickets automatically." },
            { title: "Lead Research", desc: "Automated prospect research, enrichment, and outreach personalization." },
            { title: "Workflow Automation", desc: "Connect your tools (CRM, email, Notion) and automate hand-offs between them." },
            { title: "Custom AI Agents", desc: "Purpose-built AI agents for your specific business process or industry." },
          ].map((s) => (
            <div key={s.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition">
              <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
              <p className="text-white/60 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-8 py-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { tier: "Free", price: "$0", limit: "50 requests/mo", cta: "Start Free" },
            { tier: "Basic", price: "$29", limit: "500 requests/mo", cta: "Get Basic", highlight: true },
            { tier: "Pro", price: "$99", limit: "5,000 requests/mo", cta: "Go Pro" },
          ].map((p) => (
            <div
              key={p.tier}
              className={`rounded-2xl p-6 flex flex-col gap-4 border ${
                p.highlight
                  ? "bg-brand-500 border-brand-500"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="text-sm font-semibold uppercase tracking-widest">{p.tier}</div>
              <div className="text-4xl font-extrabold">{p.price}<span className="text-base font-normal">/mo</span></div>
              <div className="text-sm opacity-80">{p.limit}</div>
              <button className={`mt-auto py-2 rounded-xl font-semibold transition ${
                p.highlight
                  ? "bg-white text-brand-500 hover:bg-slate-100"
                  : "bg-brand-500 text-white hover:bg-sky-400"
              }`}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-white/30 text-sm border-t border-white/10">
        © 2026 AI Automation Co · Built with Claude, OpenAI & Gemini
      </footer>
    </main>
  )
}
