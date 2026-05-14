"use client"
import { useState, useEffect } from "react"

type Plan = {
  name: string
  monthlyPrice: string
  yearlyPrice: string
  yearlyTotal: string
  savings: string
  period: string
  desc: string
  limit: string
  features: string[]
  cta: string
  highlight: boolean
  inrMonthlyPrice: string
  inrYearlyPrice: string
  inrYearlyTotal: string
  inrSavings: string
}

const PLANS: Plan[] = [
  {
    name: "Free",
    monthlyPrice: "$0",    yearlyPrice: "$0",    yearlyTotal: "",             savings: "",
    inrMonthlyPrice: "₹0", inrYearlyPrice: "₹0", inrYearlyTotal: "",          inrSavings: "",
    period: "/month",
    desc: "Try Nexora with no commitment.",
    limit: "50 AI replies / month",
    features: ["1 WhatsApp number", "Appointment booking", "Contacts dashboard", "Community support"],
    cta: "Start for free",
    highlight: false,
  },
  {
    name: "Basic",
    monthlyPrice: "$29",        yearlyPrice: "$24",        yearlyTotal: "$288/year",      savings: "Save $60/year",
    inrMonthlyPrice: "₹2,499",  inrYearlyPrice: "₹1,999",  inrYearlyTotal: "₹23,988/year", inrSavings: "Save ₹5,988/year",
    period: "/month",
    desc: "For growing local businesses.",
    limit: "500 AI replies / month",
    features: ["Everything in Free", "HubSpot + Zoho CRM sync", "Google Calendar sync", "n8n workflow triggers", "Email support"],
    cta: "Get Basic",
    highlight: true,
  },
  {
    name: "Pro",
    monthlyPrice: "$99",        yearlyPrice: "$83",        yearlyTotal: "$996/year",       savings: "Save $192/year",
    inrMonthlyPrice: "₹8,499",  inrYearlyPrice: "₹6,999",  inrYearlyTotal: "₹83,988/year", inrSavings: "Save ₹17,988/year",
    period: "/month",
    desc: "For high-volume or multi-location businesses.",
    limit: "5,000 AI replies / month",
    features: ["Everything in Basic", "Custom AI personality", "Priority support", "Multi-location setup", "Dedicated onboarding"],
    cta: "Go Pro",
    highlight: false,
  },
  {
    name: "Business",
    monthlyPrice: "$199",         yearlyPrice: "$166",        yearlyTotal: "$1,992/year",       savings: "Save $396/year",
    inrMonthlyPrice: "₹16,999",   inrYearlyPrice: "₹13,999",  inrYearlyTotal: "₹1,67,988/year", inrSavings: "Save ₹35,988/year",
    period: "/month",
    desc: "For businesses that need voice + WhatsApp AI.",
    limit: "Unlimited AI replies + calling",
    features: ["Everything in Pro", "AI phone calling agent", "Inbound call handling", "Call transcripts & recordings", "Outbound reminder calls"],
    cta: "Go Business",
    highlight: false,
  },
]

export default function PricingSection() {
  const [yearly, setYearly] = useState(false)
  const [isIndia, setIsIndia] = useState(false)

  useEffect(() => {
    fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) })
      .then((r) => r.json())
      .then((data) => { if (data?.country_code === "IN") setIsIndia(true) })
      .catch(() => {/* silently fall back to USD */})
  }, [])

  function price(p: Plan) {
    if (isIndia) return yearly ? p.inrYearlyPrice : p.inrMonthlyPrice
    return yearly ? p.yearlyPrice : p.monthlyPrice
  }
  function yearlyTotal(p: Plan)  { return isIndia ? p.inrYearlyTotal : p.yearlyTotal }
  function savings(p: Plan)      { return isIndia ? p.inrSavings     : p.savings     }

  return (
    <section id="pricing" className="bg-white/[0.02] border-y border-white/5 py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold">Simple, transparent pricing</h2>
          <p className="mt-3 text-slate-400 text-sm">
            Start free. Upgrade when you need more. Cancel anytime.
          </p>

          {isIndia && (
            <p className="mt-2 text-xs text-slate-500">
              Prices shown in Indian Rupees (INR). Billing processed in USD at checkout.
            </p>
          )}

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-slate-800/60 border border-white/10 rounded-full px-2 py-1.5">
            <button
              onClick={() => setYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
                !yearly ? "bg-brand-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2 ${
                yearly ? "bg-brand-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Yearly
              <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
                2 months free
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
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
                  <span className="text-4xl font-extrabold">{price(p)}</span>
                  <span className={`text-sm mb-1 ${p.highlight ? "text-white/70" : "text-slate-400"}`}>
                    {p.period}
                  </span>
                </div>
                {yearly && yearlyTotal(p) && (
                  <p className={`text-xs mt-1 ${p.highlight ? "text-white/60" : "text-slate-500"}`}>
                    {yearlyTotal(p)} · billed annually
                  </p>
                )}
                {yearly && savings(p) && (
                  <span className="inline-block mt-1.5 bg-green-500/20 text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {savings(p)}
                  </span>
                )}
                <p className={`text-sm mt-2 ${p.highlight ? "text-white/80" : "text-slate-400"}`}>{p.desc}</p>
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
  )
}
