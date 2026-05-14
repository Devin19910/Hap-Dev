const INDUSTRIES = [
  {
    name: "Salons & Barbershops",
    icon: "✂️",
    pain: "Missed calls = missed bookings",
    wins: [
      "AI answers WhatsApp inquiries instantly",
      "Books appointments and sends confirmations",
      "Reminds customers 24 hours before their slot",
    ],
  },
  {
    name: "Clinics & Dentists",
    icon: "🏥",
    pain: "Receptionists can't handle every message",
    wins: [
      "Handles FAQ: hours, services, insurance",
      "Confirms and reschedules appointments",
      "Captures patient details before the visit",
    ],
  },
  {
    name: "Gyms & Fitness",
    icon: "🏋️",
    pain: "Leads fall through after the first message",
    wins: [
      "Captures every inquiry as a qualified lead",
      "Answers pricing and class schedule questions",
      "Follows up automatically with interested prospects",
    ],
  },
  {
    name: "Immigration Consultants",
    icon: "📋",
    pain: "Complex questions, long response times",
    wins: [
      "AI handles common eligibility questions",
      "Books consultation appointments via WhatsApp",
      "Collects document checklists from new clients",
    ],
  },
  {
    name: "Plumbers & Tradespeople",
    icon: "🔧",
    pain: "Emergency calls missed = jobs lost to competitors",
    wins: [
      "AI responds instantly to emergency inquiries 24/7",
      "Books service appointments and collects job details",
      "Captures every lead even outside business hours",
    ],
  },
  {
    name: "Real Estate Agents",
    icon: "🏠",
    pain: "Buyers want instant answers — slow replies lose deals",
    wins: [
      "AI answers property inquiries instantly 24/7",
      "Books viewings and collects buyer requirements",
      "Captures every lead before they call a competitor",
    ],
  },
  {
    name: "Restaurants & Cafes",
    icon: "🍽️",
    pain: "Missed reservation requests = empty tables",
    wins: [
      "AI takes table bookings and confirms instantly",
      "Answers menu, hours, and delivery questions 24/7",
      "Captures takeaway orders and walk-in inquiries",
    ],
  },
]

const FEATURES = [
  { icon: "💬", title: "AI auto-reply", desc: "Powered by Claude, GPT-4o, or Gemini. Trained on your business — services, hours, FAQs." },
  { icon: "📅", title: "Appointment booking", desc: "AI detects booking intent and syncs confirmed slots to Google Calendar automatically." },
  { icon: "📋", title: "Lead capture", desc: "Every WhatsApp conversation becomes a contact in your CRM — HubSpot, Zoho, or internal." },
  { icon: "🔔", title: "Smart reminders", desc: "Automated follow-ups and appointment reminders sent directly over WhatsApp." },
  { icon: "📊", title: "Operations dashboard", desc: "View all conversations, contacts, and appointments in one place. No switching apps." },
  { icon: "🔌", title: "Connects to your tools", desc: "Google Calendar, HubSpot, Zoho CRM, n8n workflows. Works alongside what you already use." },
]

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    desc: "Try Nexora with no commitment.",
    limit: "50 AI replies / month",
    features: ["1 WhatsApp number", "Appointment booking", "Contacts dashboard", "Community support"],
    cta: "Start for free",
    highlight: false,
  },
  {
    name: "Basic",
    price: "$29",
    period: "/month",
    desc: "For growing local businesses.",
    limit: "500 AI replies / month",
    features: ["Everything in Free", "HubSpot + Zoho CRM sync", "Google Calendar sync", "n8n workflow triggers", "Email support"],
    cta: "Get Basic",
    highlight: true,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/month",
    desc: "For high-volume or multi-location businesses.",
    limit: "5,000 AI replies / month",
    features: ["Everything in Basic", "Custom AI personality", "Priority support", "Multi-location setup", "Dedicated onboarding"],
    cta: "Go Pro",
    highlight: false,
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 text-white">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-extrabold tracking-tight text-white">
            Nexora
          </a>
          <div className="hidden md:flex items-center gap-7 text-sm text-slate-400">
            <a href="#how-it-works" className="hover:text-white transition">How it works</a>
            <a href="#industries"   className="hover:text-white transition">Industries</a>
            <a href="#pricing"      className="hover:text-white transition">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/login"
              className="text-sm text-slate-400 hover:text-white transition hidden md:block">
              Sign in
            </a>
            <a href="/register"
              className="bg-brand-500 hover:bg-sky-400 transition text-white text-sm font-semibold px-4 py-2 rounded-lg">
              Start free trial
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <span className="inline-block bg-brand-500/10 text-brand-500 text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-6">
          WhatsApp AI · Built for Local Businesses
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight max-w-4xl mx-auto">
          Your business never misses
          <span className="text-brand-500"> a message</span> again
        </h1>
        <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Nexora connects an AI assistant to your WhatsApp. It replies to inquiries,
          books appointments, and captures leads automatically — 24 hours a day,
          7 days a week.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/register"
            className="bg-brand-500 hover:bg-sky-400 transition text-white font-semibold px-8 py-3.5 rounded-xl text-sm">
            Start free — no credit card
          </a>
          <a href="#how-it-works"
            className="border border-white/20 hover:border-white/40 transition text-white/80 hover:text-white font-medium px-8 py-3.5 rounded-xl text-sm">
            See how it works
          </a>
        </div>
        <p className="mt-5 text-xs text-slate-500">
          Free plan includes 50 AI replies/month. Setup takes under 10 minutes.
        </p>
      </section>

      {/* ── Integration logos ── */}
      <div className="border-y border-white/5 bg-white/[0.02] py-5">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-slate-500 text-xs font-medium tracking-wide uppercase">
          <span>Meta WhatsApp</span>
          <span className="text-white/10">·</span>
          <span>Google Calendar</span>
          <span className="text-white/10">·</span>
          <span>HubSpot</span>
          <span className="text-white/10">·</span>
          <span>Zoho CRM</span>
          <span className="text-white/10">·</span>
          <span>Claude · GPT-4o · Gemini</span>
          <span className="text-white/10">·</span>
          <span>n8n Workflows</span>
        </div>
      </div>

      {/* ── How it works ── */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold">Up and running in 10 minutes</h2>
          <p className="mt-3 text-slate-400 text-sm max-w-xl mx-auto">
            No developers needed. No complex setup. Just connect your WhatsApp and go.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Connect your WhatsApp",
              desc: "Link your existing WhatsApp Business number to Nexora via the Meta Cloud API. Takes about 5 minutes.",
            },
            {
              step: "02",
              title: "AI handles your messages",
              desc: "Nexora's AI reads every incoming message and replies instantly — answering questions, booking slots, and collecting lead info.",
            },
            {
              step: "03",
              title: "You stay in control",
              desc: "View every conversation, contact, and appointment in your dashboard. Confirm bookings, update contacts, or override the AI anytime.",
            },
          ].map((s) => (
            <div key={s.step} className="relative">
              <div className="text-5xl font-extrabold text-white/5 mb-4 leading-none">{s.step}</div>
              <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Industries ── */}
      <section id="industries" className="bg-white/[0.02] border-y border-white/5 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold">Built for your industry</h2>
            <p className="mt-3 text-slate-400 text-sm max-w-xl mx-auto">
              Nexora is pre-configured for the way each business type actually operates.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {INDUSTRIES.map((ind) => (
              <div key={ind.name}
                className="bg-slate-800/60 border border-white/10 rounded-2xl p-6 hover:border-brand-500/40 hover:bg-slate-800 transition">
                <div className="text-3xl mb-4">{ind.icon}</div>
                <h3 className="font-bold text-white text-base mb-1">{ind.name}</h3>
                <p className="text-slate-500 text-xs mb-4 italic">&ldquo;{ind.pain}&rdquo;</p>
                <ul className="flex flex-col gap-2">
                  {ind.wins.map((w) => (
                    <li key={w} className="flex items-start gap-2 text-slate-300 text-xs">
                      <span className="text-brand-500 mt-0.5 shrink-0">✓</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold">Everything your team needs</h2>
          <p className="mt-3 text-slate-400 text-sm max-w-xl mx-auto">
            One platform for WhatsApp AI, CRM, appointments, and operations.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title}
              className="bg-slate-800/40 border border-white/8 rounded-2xl p-6 hover:bg-slate-800/70 transition">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-1.5">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-white/[0.02] border-y border-white/5 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold">Simple, transparent pricing</h2>
            <p className="mt-3 text-slate-400 text-sm">
              Start free. Upgrade when you need more. Cancel anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map((p) => (
              <div key={p.name}
                className={`rounded-2xl p-7 flex flex-col gap-5 border ${
                  p.highlight
                    ? "bg-brand-500 border-brand-500 ring-2 ring-brand-500/40"
                    : "bg-slate-800/60 border-white/10"
                }`}>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${p.highlight ? "text-white/70" : "text-slate-400"}`}>
                    {p.name}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold">{p.price}</span>
                    <span className={`text-sm mb-1 ${p.highlight ? "text-white/70" : "text-slate-400"}`}>{p.period}</span>
                  </div>
                  <p className={`text-sm mt-1 ${p.highlight ? "text-white/80" : "text-slate-400"}`}>{p.desc}</p>
                </div>

                <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg w-fit ${
                  p.highlight ? "bg-white/15 text-white" : "bg-brand-500/10 text-brand-500"
                }`}>
                  {p.limit}
                </div>

                <ul className="flex flex-col gap-2.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${p.highlight ? "text-white/90" : "text-slate-300"}`}>
                      <span className={`shrink-0 mt-0.5 ${p.highlight ? "text-white" : "text-brand-500"}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <a href="/register"
                  className={`text-center py-3 rounded-xl font-semibold text-sm transition ${
                    p.highlight
                      ? "bg-white text-brand-500 hover:bg-slate-100"
                      : "bg-brand-500 text-white hover:bg-sky-400"
                  }`}>
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-3xl mx-auto px-6 py-28 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5">
          Ready to automate your<br />WhatsApp?
        </h2>
        <p className="text-slate-400 text-base mb-10 max-w-xl mx-auto">
          Join local businesses already using Nexora to reply faster, book more appointments,
          and never lose a lead again.
        </p>
        <a href="/register"
          className="inline-block bg-brand-500 hover:bg-sky-400 transition text-white font-bold px-10 py-4 rounded-xl text-base">
          Start your free trial
        </a>
        <p className="mt-4 text-xs text-slate-600">
          Free forever plan available. No credit card required.
        </p>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span className="font-bold text-white text-base">Nexora</span>
          <div className="flex gap-6">
            <a href="#how-it-works" className="hover:text-white transition">How it works</a>
            <a href="#industries"   className="hover:text-white transition">Industries</a>
            <a href="#pricing"      className="hover:text-white transition">Pricing</a>
            <a href="/login"        className="hover:text-white transition">Sign in</a>
          </div>
          <span>© 2026 Nexora. All rights reserved.</span>
        </div>
      </footer>

    </main>
  )
}
