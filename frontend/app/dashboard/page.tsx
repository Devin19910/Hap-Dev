"use client"
import { useEffect, useState, useCallback } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "")

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

// ── Types ──────────────────────────────────────────────────────────────────

type AdminUser = { id: string; email: string; first_name: string; last_name: string; role: string; tenant_id: string | null }
type TenantInfo = { id: string; name: string; email: string; slug: string; status: string; business_type: string; is_active: boolean; has_whatsapp: boolean; has_hubspot: boolean; has_zoho: boolean; has_gcal: boolean; ai_provider: string; created_at: string }
type TenantConfig = { wa_phone_number_id?: string; wa_access_token?: string; wa_verify_token?: string; wa_business_name?: string; ai_provider?: string; hubspot_api_key?: string; zoho_client_id?: string; zoho_client_secret?: string; zoho_refresh_token?: string; google_client_id?: string; google_client_secret?: string; google_refresh_token?: string; google_calendar_id?: string; google_timezone?: string; vapi_api_key?: string; vapi_phone_number_id?: string; name?: string; business_type?: string }
type Client    = { id: string; name: string; email: string; api_key: string; is_active: boolean; created_at: string }
type Sub       = { tier: string; monthly_limit: number; requests_used: number; remaining: number; is_active: boolean }
type Job       = { id: string; client_id: string; provider: string; prompt: string; response: string | null; tokens_used: number; status: string; created_at: string }

type Appointment = {
  id: string
  client_id: string
  contact_id: string
  phone_number: string
  customer_name: string
  service: string
  notes: string
  requested_at_text: string
  scheduled_at: string | null
  duration_minutes: number
  status: string
  google_event_id: string
  reminder_sent: boolean
  created_at: string
  updated_at: string
}

type Contact = {
  id: string
  client_id: string
  phone_number: string
  email: string
  first_name: string
  last_name: string
  source: string
  crm_hubspot_id: string
  crm_zoho_id: string
  last_intent: string
  last_urgency: string
  last_summary: string
  notes: string
  tags: string
  status: string
  created_at: string
  updated_at: string
}

type Conversation = {
  id: string
  phone_number: string
  client_id: string
  display_name: string
  last_message: string
  last_reply: string
  last_intent: string
  message_count: string
  created_at: string
  updated_at: string
}

type Tab = "overview" | "clients" | "jobs" | "whatsapp" | "contacts" | "appointments" | "calls" | "settings" | "tenants" | "team"

type CallLog = {
  id: string
  client_id: string
  contact_id: string
  phone_number: string
  direction: string
  status: string
  duration_seconds: number
  transcript: string
  recording_url: string
  vapi_call_id: string
  ended_reason: string
  created_at: string
}

// ── API helpers ────────────────────────────────────────────────────────────

function authHeaders(token: string) {
  return { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
}

async function apiFetch(token: string, path: string, opts: RequestInit = {}) {
  const r = await fetch(`${API}${path}`, {
    ...opts,
    headers: { ...authHeaders(token), ...(opts.headers ?? {}) },
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: r.statusText }))
    throw new Error(err.detail ?? "Request failed")
  }
  return r.json()
}

// ── Sidebar ────────────────────────────────────────────────────────────────

const NAV: { id: Tab; label: string; icon: string; platformOnly?: boolean; tenantOnly?: boolean }[] = [
  { id: "overview",     label: "Overview",     icon: "◈" },
  { id: "clients",      label: "Clients",      icon: "👥",  platformOnly: true },
  { id: "jobs",         label: "Jobs",         icon: "⚙" },
  { id: "whatsapp",     label: "WhatsApp",     icon: "💬" },
  { id: "contacts",     label: "Contacts",     icon: "📋" },
  { id: "appointments", label: "Appointments", icon: "📅" },
  { id: "calls",        label: "Calls",        icon: "📞" },
  { id: "settings",     label: "Settings",     icon: "🔧" },
  { id: "tenants",      label: "Tenants",      icon: "🏢",  platformOnly: true },
  { id: "team",         label: "Team",         icon: "🔑",  platformOnly: true },
]

function Sidebar({ tab, setTab, user, onLogout }: {
  tab: Tab; setTab: (t: Tab) => void; user: AdminUser; onLogout: () => void
}) {
  return (
    <aside className="w-56 bg-slate-800 flex flex-col border-r border-white/10 shrink-0">
      <div className="px-5 py-4 border-b border-white/10">
        <p className="text-white font-bold text-sm">Nexora</p>
        <p className="text-slate-400 text-xs mt-0.5">Operations Hub</p>
      </div>
      <nav className="flex-1 py-3 px-2 flex flex-col gap-1">
        {NAV.filter(n => {
          const isTenant = user.tenant_id !== null && user.tenant_id !== undefined
          if (n.platformOnly && isTenant) return false
          return true
        }).map(n => (
          <button
            key={n.id}
            onClick={() => setTab(n.id)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition text-left
              ${tab === n.id ? "bg-sky-500 text-white" : "text-slate-300 hover:bg-slate-700"}`}
          >
            <span>{n.icon}</span>{n.label}
          </button>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-white text-sm font-medium">{user.first_name}</p>
        <p className="text-slate-400 text-xs capitalize">{user.role}</p>
        <button
          onClick={onLogout}
          className="mt-2 text-xs text-slate-400 hover:text-red-400 transition"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}

// ── Value Dashboard (tenant-facing impact panel) ──────────────────────────

type ValueStats = {
  messages_this_month: number
  hours_saved_this_month: number
  appointments_this_month: number
  leads_this_month: number
  total_messages: number
  total_appointments: number
  total_leads: number
}

function ValueDashboard({ token }: { token: string }) {
  const [stats, setStats]   = useState<ValueStats | null>(null)
  const [loading, setLoading] = useState(true)
  const monthName = new Date().toLocaleString("en-US", { month: "long" })

  useEffect(() => {
    apiFetch(token, "/stats/value")
      .then(s => { setStats(s); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="bg-slate-800 rounded-xl border border-white/5 p-6 animate-pulse">
      <div className="h-4 w-48 bg-slate-700 rounded mb-4" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-700 rounded-xl" />)}
      </div>
    </div>
  )

  if (!stats) return null

  const impactCards = [
    {
      icon: "💬",
      value: stats.messages_this_month,
      label: "Customer messages handled by AI",
      sub: `${stats.total_messages} total all time`,
      color: "from-sky-500/20 to-sky-500/5 border-sky-500/30",
      valueColor: "text-sky-400",
    },
    {
      icon: "⏱",
      value: `${stats.hours_saved_this_month}h`,
      label: "Hours saved this month",
      sub: "Based on 5 min per reply",
      color: "from-violet-500/20 to-violet-500/5 border-violet-500/30",
      valueColor: "text-violet-400",
    },
    {
      icon: "📅",
      value: stats.appointments_this_month,
      label: "Appointments captured automatically",
      sub: `${stats.total_appointments} total all time`,
      color: "from-green-500/20 to-green-500/5 border-green-500/30",
      valueColor: "text-green-400",
    },
    {
      icon: "👤",
      value: stats.leads_this_month,
      label: "New leads added to your CRM",
      sub: `${stats.total_leads} total all time`,
      color: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
      valueColor: "text-amber-400",
    },
  ]

  const hasActivity = stats.total_messages > 0

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Nexora Impact — {monthName}</h2>
          <p className="text-slate-400 text-sm mt-0.5">Here is what your AI assistant did for your business this month</p>
        </div>
        {hasActivity && (
          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
            AI is working ✓
          </span>
        )}
      </div>

      {/* Impact cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {impactCards.map(c => (
          <div key={c.label} className={`rounded-xl p-4 border bg-gradient-to-b ${c.color}`}>
            <div className="text-2xl mb-2">{c.icon}</div>
            <p className={`text-3xl font-bold ${c.valueColor}`}>{c.value}</p>
            <p className="text-white text-xs font-medium mt-1 leading-tight">{c.label}</p>
            <p className="text-slate-500 text-xs mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Zero state nudge */}
      {!hasActivity && (
        <div className="bg-slate-800/60 border border-white/5 rounded-xl px-5 py-4 text-sm text-slate-400">
          No activity yet — once customers start messaging your WhatsApp number, your stats will appear here automatically.
        </div>
      )}

      {/* Plain-language summary */}
      {hasActivity && (
        <div className="bg-slate-800 border border-white/5 rounded-xl px-5 py-4">
          <p className="text-slate-300 text-sm leading-relaxed">
            This month your AI assistant replied to{" "}
            <span className="text-white font-semibold">{stats.messages_this_month} customer messages</span>,
            saving you roughly{" "}
            <span className="text-white font-semibold">{stats.hours_saved_this_month} hours</span>{" "}
            of manual work. It automatically added{" "}
            <span className="text-white font-semibold">{stats.leads_this_month} new contacts</span>{" "}
            to your CRM and captured{" "}
            <span className="text-white font-semibold">{stats.appointments_this_month} appointment{stats.appointments_this_month !== 1 ? "s" : ""}</span>{" "}
            — all without you lifting a finger.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Overview tab ──────────────────────────────────────────────────────────

function OverviewTab({ token, clients, jobs, conversations, user }: {
  token: string; clients: Client[]; jobs: Job[]; conversations: Conversation[]; user: AdminUser
}) {
  const isTenant    = user.tenant_id !== null && user.tenant_id !== undefined
  const totalTokens = jobs.reduce((s, j) => s + (j.tokens_used ?? 0), 0)

  const platformStats = [
    { label: "Active Clients",   value: clients.length,               color: "text-sky-400" },
    { label: "Total Jobs",       value: jobs.length,                  color: "text-violet-400" },
    { label: "WA Conversations", value: conversations.length,         color: "text-green-400" },
    { label: "Tokens Used",      value: totalTokens.toLocaleString(), color: "text-amber-400" },
  ]

  const recent = [...jobs].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8)

  function clientName(id: string) {
    return clients.find(c => c.id === id)?.name ?? id.slice(0, 8)
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-white">Overview</h1>

      {/* Tenant users see value dashboard */}
      {isTenant && <ValueDashboard token={token} />}

      {/* Platform admins see platform-wide stats */}
      {!isTenant && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {platformStats.map(s => (
              <div key={s.label} className="bg-slate-800 rounded-xl p-4 border border-white/5">
                <p className="text-slate-400 text-xs mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-slate-800 rounded-xl border border-white/5">
            <div className="px-5 py-3 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white">Recent Jobs</h2>
            </div>
            {recent.length === 0 ? (
              <p className="px-5 py-8 text-slate-500 text-sm text-center">No jobs yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs border-b border-white/5">
                    <th className="px-5 py-2 text-left">Time</th>
                    <th className="px-5 py-2 text-left">Client</th>
                    <th className="px-5 py-2 text-left">Provider</th>
                    <th className="px-5 py-2 text-left">Status</th>
                    <th className="px-5 py-2 text-right">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(j => (
                    <tr key={j.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-5 py-2.5 text-slate-400 text-xs">{new Date(j.created_at).toLocaleString()}</td>
                      <td className="px-5 py-2.5 text-white">{clientName(j.client_id)}</td>
                      <td className="px-5 py-2.5 capitalize text-slate-300">{j.provider}</td>
                      <td className="px-5 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          j.status === "done" ? "bg-green-500/20 text-green-400"
                          : j.status === "failed" ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-400"
                        }`}>{j.status}</span>
                      </td>
                      <td className="px-5 py-2.5 text-right text-slate-400">{j.tokens_used}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Clients tab ────────────────────────────────────────────────────────────

function ClientsTab({ token, clients, reload }: { token: string; clients: Client[]; reload: () => void }) {
  const [selected, setSelected] = useState<Client | null>(null)
  const [sub, setSub]           = useState<Sub | null>(null)
  const [jobs, setJobs]         = useState<Job[]>([])
  const [name, setName]         = useState("")
  const [email, setEmail]       = useState("")
  const [tier, setTier]         = useState("free")
  const [prompt, setPrompt]     = useState("")
  const [provider, setProvider] = useState("claude")
  const [aiResult, setAiResult] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError]       = useState("")
  const [upgradeTier, setUpgradeTier] = useState("")

  async function selectClient(c: Client) {
    setSelected(c); setAiResult(""); setError("")
    const [s, j] = await Promise.all([
      apiFetch(token, `/subscriptions/${c.id}`).catch(() => null),
      apiFetch(token, `/ai/jobs/${c.id}`).catch(() => []),
    ])
    setSub(s); setJobs(j); setUpgradeTier(s?.tier ?? "free")
  }

  async function createClient() {
    if (!name || !email) return
    try {
      await apiFetch(token, "/clients", {
        method: "POST",
        body: JSON.stringify({ name, email, tier }),
      })
      setName(""); setEmail(""); setTier("free")
      reload()
    } catch (e: any) { setError(e.message) }
  }

  async function deactivate(id: string) {
    if (!confirm("Deactivate this client?")) return
    await apiFetch(token, `/clients/${id}`, { method: "DELETE" })
    if (selected?.id === id) { setSelected(null); setSub(null) }
    reload()
  }

  async function upgrade() {
    if (!selected || !upgradeTier) return
    await apiFetch(token, `/subscriptions/${selected.id}/upgrade`, {
      method: "PATCH",
      body: JSON.stringify({ tier: upgradeTier }),
    })
    selectClient(selected)
  }

  async function resetUsage() {
    if (!selected) return
    await apiFetch(token, `/subscriptions/${selected.id}/reset`, { method: "POST" })
    selectClient(selected)
  }

  async function runAI() {
    if (!selected || !prompt) return
    setAiLoading(true); setAiResult("")
    try {
      const r = await fetch(`${API}/ai/complete`, {
        method: "POST",
        headers: { "x-api-key": "change-me-in-production", "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: selected.id, prompt, provider }),
      })
      const d = await r.json()
      setAiResult(r.ok ? d.text : (d.detail ?? JSON.stringify(d)))
      selectClient(selected)
    } finally { setAiLoading(false) }
  }

  const usagePct = sub ? Math.min(100, Math.round((sub.requests_used / sub.monthly_limit) * 100)) : 0

  return (
    <div className="flex gap-6 h-full">
      {/* Left: list + create */}
      <div className="w-72 shrink-0 flex flex-col gap-4">
        <h1 className="text-xl font-bold text-white">Clients</h1>

        {/* Create form */}
        <div className="bg-slate-800 rounded-xl p-4 border border-white/5 flex flex-col gap-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Add Client</p>
          <input className="bg-slate-700 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Business name" value={name} onChange={e => setName(e.target.value)} />
          <input className="bg-slate-700 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <select className="bg-slate-700 text-white rounded-lg px-3 py-1.5 text-sm"
            value={tier} onChange={e => setTier(e.target.value)}>
            <option value="free">Free (50/mo)</option>
            <option value="basic">Basic (500/mo)</option>
            <option value="pro">Pro (5000/mo)</option>
          </select>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={createClient}
            className="bg-sky-500 text-white rounded-lg py-1.5 text-sm font-semibold hover:bg-sky-400 transition">
            Create
          </button>
        </div>

        {/* Client list */}
        <div className="flex flex-col gap-1 overflow-y-auto">
          {clients.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No clients yet</p>}
          {clients.map(c => (
            <button key={c.id} onClick={() => selectClient(c)}
              className={`text-left px-3 py-2.5 rounded-xl border transition ${
                selected?.id === c.id
                  ? "bg-sky-500 border-sky-400 text-white"
                  : "bg-slate-800 border-white/5 text-slate-300 hover:bg-slate-700"}`}>
              <p className="font-medium text-sm">{c.name}</p>
              <p className="text-xs opacity-60 mt-0.5">{c.email}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right: client detail */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{selected.name}</h2>
                <p className="text-slate-400 text-sm">{selected.email}</p>
              </div>
              <button onClick={() => deactivate(selected.id)}
                className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg transition">
                Deactivate
              </button>
            </div>

            {/* Subscription card */}
            {sub && (
              <div className="bg-slate-800 rounded-xl p-5 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-white capitalize">{sub.tier} Plan</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${sub.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {sub.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-2 rounded-full transition-all ${usagePct > 80 ? "bg-red-500" : usagePct > 60 ? "bg-amber-500" : "bg-sky-500"}`}
                      style={{ width: `${usagePct}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{sub.requests_used} / {sub.monthly_limit}</span>
                </div>
                <p className="text-xs text-slate-400">{sub.remaining} requests remaining this month</p>
                <div className="mt-4 flex gap-2">
                  <select className="bg-slate-700 text-white rounded-lg px-2 py-1.5 text-sm flex-1"
                    value={upgradeTier} onChange={e => setUpgradeTier(e.target.value)}>
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                  </select>
                  <button onClick={upgrade}
                    className="bg-sky-500 text-white rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-sky-400 transition">
                    Change Tier
                  </button>
                  <button onClick={resetUsage}
                    className="bg-slate-700 text-white rounded-lg px-3 py-1.5 text-sm hover:bg-slate-600 transition">
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* API Key */}
            <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Client API Key</p>
              <code className="text-xs text-amber-400 break-all">{selected.api_key}</code>
            </div>

            {/* AI Playground */}
            <div className="bg-slate-800 rounded-xl p-5 border border-white/5">
              <p className="text-sm font-semibold text-white mb-3">AI Playground</p>
              <div className="flex gap-2 mb-3">
                {["claude", "openai", "gemini"].map(p => (
                  <button key={p} onClick={() => setProvider(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                      provider === p ? "bg-sky-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
                    {p}
                  </button>
                ))}
              </div>
              <textarea
                className="w-full bg-slate-700 text-white rounded-xl p-3 text-sm min-h-20 resize-none outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Enter a prompt…"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              />
              <button onClick={runAI} disabled={aiLoading || !prompt}
                className="mt-2 w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl py-2 text-sm font-semibold transition">
                {aiLoading ? "Running…" : "Run"}
              </button>
              {aiResult && (
                <div className="mt-3 bg-slate-700 rounded-xl p-4 text-sm text-slate-200 whitespace-pre-wrap">{aiResult}</div>
              )}
            </div>

            {/* Recent jobs for this client */}
            {jobs.length > 0 && (
              <div className="bg-slate-800 rounded-xl border border-white/5">
                <p className="px-5 py-3 text-sm font-semibold text-white border-b border-white/10">Recent Jobs</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-white/5">
                      <th className="px-5 py-2 text-left">Time</th>
                      <th className="px-5 py-2 text-left">Provider</th>
                      <th className="px-5 py-2 text-left">Status</th>
                      <th className="px-5 py-2 text-right">Tokens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...jobs].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10).map(j => (
                      <tr key={j.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="px-5 py-2 text-slate-400">{new Date(j.created_at).toLocaleString()}</td>
                        <td className="px-5 py-2 capitalize text-slate-300">{j.provider}</td>
                        <td className="px-5 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            j.status === "done" ? "bg-green-500/20 text-green-400"
                            : j.status === "failed" ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"}`}>{j.status}</span>
                        </td>
                        <td className="px-5 py-2 text-right text-slate-400">{j.tokens_used}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center h-full text-slate-500">
            Select a client to view details
          </div>
        )}
      </div>
    </div>
  )
}

// ── Jobs tab ───────────────────────────────────────────────────────────────

function JobsTab({ token, clients }: { token: string; clients: Client[] }) {
  const [jobs, setJobs]       = useState<Job[]>([])
  const [filter, setFilter]   = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const all = await Promise.all(clients.map(c =>
        apiFetch(token, `/ai/jobs/${c.id}`).catch(() => [] as Job[])
      ))
      setJobs(all.flat().sort((a, b) => b.created_at.localeCompare(a.created_at)))
      setLoading(false)
    }
    if (clients.length) load()
    else setLoading(false)
  }, [clients, token])

  function clientName(id: string) {
    return clients.find(c => c.id === id)?.name ?? id.slice(0, 8)
  }

  const visible = filter === "all" ? jobs : jobs.filter(j => j.status === filter)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Jobs</h1>
        <div className="flex gap-2">
          {["all", "done", "failed", "pending"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                filter === s ? "bg-sky-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-white/5">
        {loading ? (
          <p className="px-5 py-8 text-slate-500 text-sm text-center">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="px-5 py-8 text-slate-500 text-sm text-center">No jobs found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs border-b border-white/10">
                <th className="px-5 py-2.5 text-left">Time</th>
                <th className="px-5 py-2.5 text-left">Client</th>
                <th className="px-5 py-2.5 text-left">Provider</th>
                <th className="px-5 py-2.5 text-left">Prompt</th>
                <th className="px-5 py-2.5 text-left">Status</th>
                <th className="px-5 py-2.5 text-right">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {visible.slice(0, 50).map(j => (
                <tr key={j.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-5 py-2.5 text-slate-400 text-xs whitespace-nowrap">{new Date(j.created_at).toLocaleString()}</td>
                  <td className="px-5 py-2.5 text-white whitespace-nowrap">{clientName(j.client_id)}</td>
                  <td className="px-5 py-2.5 capitalize text-slate-300">{j.provider}</td>
                  <td className="px-5 py-2.5 text-slate-300 max-w-xs truncate">{j.prompt.slice(0, 60)}{j.prompt.length > 60 ? "…" : ""}</td>
                  <td className="px-5 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      j.status === "done" ? "bg-green-500/20 text-green-400"
                      : j.status === "failed" ? "bg-red-500/20 text-red-400"
                      : "bg-amber-500/20 text-amber-400"}`}>{j.status}</span>
                  </td>
                  <td className="px-5 py-2.5 text-right text-slate-400">{j.tokens_used}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── In-app checkout modal ─────────────────────────────────────────────────

const PLAN_LABELS: Record<string, { name: string; monthly: string; yearly: string }> = {
  basic:    { name: "Basic",    monthly: "$29/mo",  yearly: "$290/yr" },
  pro:      { name: "Pro",      monthly: "$99/mo",  yearly: "$990/yr" },
  business: { name: "Business", monthly: "$199/mo", yearly: "$1,990/yr" },
}

function CheckoutForm({ token, tier, billingPeriod, onSuccess, onClose }:
  { token: string; tier: string; billingPeriod: string; onSuccess: () => void; onClose: () => void }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [error, setError]     = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true); setError("")

    const card = elements.getElement(CardElement)
    if (!card) { setLoading(false); return }

    const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({ type: "card", card })
    if (pmError) { setError(pmError.message ?? "Card error"); setLoading(false); return }

    try {
      const result = await apiFetch(token, "/billing/subscribe", {
        method: "POST",
        body: JSON.stringify({ tier, billing_period: billingPeriod, payment_method_id: paymentMethod.id }),
      })

      if (result?.client_secret) {
        const { error: confirmError } = await stripe.confirmCardPayment(result.client_secret)
        if (confirmError) { setError(confirmError.message ?? "Payment failed"); setLoading(false); return }
      }

      onSuccess()
    } catch (err: any) {
      setError(err?.message ?? "Payment failed. Please try again.")
      setLoading(false)
    }
  }

  const plan = PLAN_LABELS[tier]
  const price = billingPeriod === "yearly" ? plan.yearly : plan.monthly

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between">
        <span className="text-white font-semibold">{plan.name} Plan</span>
        <span className="text-sky-400 font-bold">{price}</span>
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1.5 block">Card details</label>
        <div className="bg-slate-700 border border-white/10 rounded-lg p-3">
          <CardElement options={{
            style: {
              base: { color: "#f1f5f9", fontSize: "14px", "::placeholder": { color: "#64748b" } },
              invalid: { color: "#f87171" },
            }
          }} />
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition">
          Cancel
        </button>
        <button type="submit" disabled={loading || !stripe}
          className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50 transition">
          {loading ? "Processing…" : `Pay ${price}`}
        </button>
      </div>

      <p className="text-xs text-slate-500 text-center">Secured by Stripe · Cancel anytime</p>
    </form>
  )
}

function CheckoutModal({ token, tier, billingPeriod, onSuccess, onClose }:
  { token: string; tier: string; billingPeriod: string; onSuccess: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg">Upgrade Plan</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
        </div>
        <Elements stripe={stripePromise}>
          <CheckoutForm token={token} tier={tier} billingPeriod={billingPeriod} onSuccess={onSuccess} onClose={onClose} />
        </Elements>
      </div>
    </div>
  )
}

function UpgradeButton({ token, tier, label, highlight, billingPeriod, onSuccess }:
  { token: string; tier: string; label: string; highlight?: boolean; billingPeriod: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
          highlight ? "bg-purple-600 hover:bg-purple-500 text-white" : "bg-sky-600 hover:bg-sky-500 text-white"
        }`}>
        {label}
      </button>
      {open && (
        <CheckoutModal token={token} tier={tier} billingPeriod={billingPeriod}
          onSuccess={() => { setOpen(false); onSuccess() }}
          onClose={() => setOpen(false)} />
      )}
    </>
  )
}

// ── Settings tab (tenant config) ──────────────────────────────────────────

const AI_PROVIDERS = ["claude", "openai", "gemini"]
const TIMEZONES    = ["Asia/Kolkata", "America/New_York", "America/Chicago", "America/Los_Angeles", "UTC"]

function SettingsTab({ token, user }: { token: string; user: AdminUser }) {
  const tenantId = user.tenant_id
  const [cfg, setCfg]     = useState<TenantConfig>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [usage, setUsage]         = useState<any>(null)
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")
  const [stripeSub, setStripeSub]         = useState<any>(null)
  const [subLoading, setSubLoading]       = useState(false)
  const [invoices, setInvoices]           = useState<any[]>([])
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [cancelling, setCancelling]       = useState(false)
  const [reactivating, setReactivating]   = useState(false)

  function refreshUsage() {
    if (!tenantId) return
    apiFetch(token, `/tenants/${tenantId}/usage`).catch(() => null).then(u => setUsage(u))
  }

  function fmtDate(ts: number | null) {
    if (!ts) return "—"
    return new Date(ts * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  function fmtAmount(cents: number, currency: string) {
    const sym: Record<string, string> = { usd: "$", inr: "₹", eur: "€", gbp: "£" }
    const s = sym[(currency ?? "usd").toLowerCase()] ?? (currency ?? "USD").toUpperCase() + " "
    return s + ((cents ?? 0) / 100).toFixed(2)
  }

  async function downloadInvoice(invoiceId: string) {
    const r = await fetch(`${API}/billing/invoices/${invoiceId}/download`, {
      headers: authHeaders(token),
    })
    if (!r.ok) return
    const blob = await r.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `nexora-invoice-${invoiceId}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async function cancelSub() {
    setCancelling(true)
    try {
      await apiFetch(token, "/billing/cancel", { method: "POST" })
      setCancelConfirm(false)
      const sub = await apiFetch(token, "/billing/subscription").catch(() => null)
      setStripeSub(sub)
    } catch (e: any) { alert(e.message) }
    finally { setCancelling(false) }
  }

  async function reactivateSub() {
    setReactivating(true)
    try {
      await apiFetch(token, "/billing/reactivate", { method: "POST" })
      const sub = await apiFetch(token, "/billing/subscription").catch(() => null)
      setStripeSub(sub)
    } catch (e: any) { alert(e.message) }
    finally { setReactivating(false) }
  }

  useEffect(() => {
    if (!tenantId) return
    Promise.all([
      apiFetch(token, `/tenants/${tenantId}`).catch(() => ({})),
      apiFetch(token, `/tenants/${tenantId}/usage`).catch(() => null),
    ]).then(([t, u]) => {
      setCfg({
        name:                t.name ?? "",
        business_type:       t.business_type ?? "general",
        ai_provider:         t.ai_provider ?? "",
        wa_phone_number_id:  t.wa_phone_number_id ?? "",
        wa_access_token:     t.wa_access_token ?? "",
        wa_verify_token:     t.wa_verify_token ?? "",
        wa_business_name:    t.wa_business_name ?? "",
        hubspot_api_key:     t.hubspot_api_key ?? "",
        zoho_client_id:      t.zoho_client_id ?? "",
        zoho_client_secret:  t.zoho_client_secret ?? "",
        zoho_refresh_token:  t.zoho_refresh_token ?? "",
        google_client_id:    t.google_client_id ?? "",
        google_client_secret: t.google_client_secret ?? "",
        google_refresh_token: t.google_refresh_token ?? "",
        google_calendar_id:  t.google_calendar_id ?? "primary",
        google_timezone:     t.google_timezone ?? "Asia/Kolkata",
        vapi_api_key:        t.vapi_api_key ?? "",
        vapi_phone_number_id: t.vapi_phone_number_id ?? "",
      })
      setUsage(u)
      setLoading(false)
    })
  }, [token, tenantId])

  useEffect(() => {
    if (!tenantId || !usage?.tier || usage.tier === "free") return
    setSubLoading(true)
    Promise.all([
      apiFetch(token, "/billing/subscription").catch(() => null),
      apiFetch(token, "/billing/invoices").catch(() => []),
    ]).then(([sub, invs]) => {
      setStripeSub(sub)
      setInvoices(Array.isArray(invs) ? invs : [])
      setSubLoading(false)
    })
  }, [token, tenantId, usage?.tier])

  const set = (key: keyof TenantConfig) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCfg(prev => ({ ...prev, [key]: e.target.value }))

  async function save() {
    if (!tenantId) return
    setSaving(true); setSaved(false)
    await apiFetch(token, `/tenants/${tenantId}/config`, {
      method: "PUT",
      body: JSON.stringify(cfg),
    }).catch(() => {})
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (!tenantId) return (
    <div className="text-slate-500 text-sm">Settings are only available for tenant accounts.</div>
  )

  if (loading) return <p className="text-slate-500 text-sm">Loading…</p>

  const usagePct = usage ? Math.min(100, Math.round((usage.requests_used / usage.monthly_limit) * 100)) : 0

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-xl font-bold text-white">Settings</h1>

      {/* Usage + Billing */}
      {usage && (
        <div className="bg-slate-800 rounded-xl p-5 border border-white/5">
          {/* Current plan badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                usage.tier === "business" ? "bg-purple-600 text-white" :
                usage.tier === "pro"      ? "bg-sky-600 text-white" :
                usage.tier === "basic"    ? "bg-emerald-600 text-white" :
                "bg-slate-600 text-slate-300"
              }`}>{usage.tier}</span>
              <p className="text-sm font-semibold text-white">Current Plan</p>
            </div>
            <span className="text-xs text-slate-400">{usage.requests_used} / {usage.monthly_limit} reqs</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-2 rounded-full transition-all ${usagePct > 80 ? "bg-red-500" : usagePct > 60 ? "bg-amber-500" : "bg-sky-500"}`}
              style={{ width: `${usagePct}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-2">{usage.remaining} requests remaining this month</p>

          {/* Upgrade section */}
          {usage.tier !== "business" && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-400">Upgrade your plan</p>
                {/* Billing period toggle */}
                <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-0.5">
                  <button onClick={() => setBillingPeriod("monthly")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${billingPeriod === "monthly" ? "bg-slate-500 text-white" : "text-slate-400 hover:text-white"}`}>
                    Monthly
                  </button>
                  <button onClick={() => setBillingPeriod("yearly")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${billingPeriod === "yearly" ? "bg-slate-500 text-white" : "text-slate-400 hover:text-white"}`}>
                    Yearly <span className="text-emerald-400">–17%</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {usage.tier === "free" && (
                  <UpgradeButton token={token} tier="basic" billingPeriod={billingPeriod} onSuccess={refreshUsage}
                    label={`Basic — ${billingPeriod === "yearly" ? "$290/yr" : "$29/mo"}`} />
                )}
                {(usage.tier === "free" || usage.tier === "basic") && (
                  <UpgradeButton token={token} tier="pro" billingPeriod={billingPeriod} onSuccess={refreshUsage}
                    label={`Pro — ${billingPeriod === "yearly" ? "$990/yr" : "$99/mo"}`} />
                )}
                <UpgradeButton token={token} tier="business" billingPeriod={billingPeriod} onSuccess={refreshUsage}
                  label={`Business — ${billingPeriod === "yearly" ? "$1,990/yr" : "$199/mo"}`} highlight />
              </div>
            </div>
          )}

        </div>
      )}

      {/* Subscription management */}
      {usage && usage.tier !== "free" && (
        <div className="bg-slate-800 rounded-xl p-5 border border-white/5">
          <h2 className="text-sm font-semibold text-white mb-4">Subscription Management</h2>

          {subLoading ? (
            <p className="text-slate-500 text-sm">Loading subscription details…</p>
          ) : stripeSub ? (
            <div className="flex flex-col gap-4">
              {stripeSub.cancel_at_period_end ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-amber-400 text-sm font-semibold mb-1">Subscription cancelling</p>
                  <p className="text-amber-300 text-xs">
                    Access continues until {fmtDate(stripeSub.current_period_end)}. You will not be charged again.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-slate-700/50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Next renewal</p>
                    <p className="text-sm font-semibold text-white">
                      {fmtDate(stripeSub.current_period_end)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-0.5">Amount</p>
                    <p className="text-sm font-semibold text-sky-400">
                      {fmtAmount(stripeSub.amount, stripeSub.currency)}/{stripeSub.interval}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                {stripeSub.cancel_at_period_end ? (
                  <button
                    onClick={reactivateSub}
                    disabled={reactivating}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-semibold transition"
                  >
                    {reactivating ? "Reactivating…" : "Reactivate subscription"}
                  </button>
                ) : cancelConfirm ? (
                  <>
                    <p className="text-xs text-red-400">Cancel at end of period?</p>
                    <button
                      onClick={cancelSub}
                      disabled={cancelling}
                      className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                    >
                      {cancelling ? "Cancelling…" : "Yes, cancel"}
                    </button>
                    <button
                      onClick={() => setCancelConfirm(false)}
                      className="text-xs text-slate-400 hover:text-white transition"
                    >
                      Keep plan
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setCancelConfirm(true)}
                    className="text-xs text-slate-400 hover:text-red-400 border border-slate-600 hover:border-red-500/40 px-4 py-2 rounded-lg transition"
                  >
                    Cancel subscription
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No active Stripe subscription found.</p>
          )}
        </div>
      )}

      {/* Invoice history */}
      {invoices.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-white/5">
          <div className="px-5 py-3 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Invoice History</h2>
          </div>
          <div className="divide-y divide-white/5">
            {invoices.map(inv => (
              <div key={inv.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-medium">{inv.number || inv.id.slice(-10)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {fmtDate(inv.created)} · {fmtAmount(inv.amount_paid, inv.currency)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    inv.status === "paid"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-700 text-slate-400"
                  }`}>{inv.status}</span>
                  <button
                    onClick={() => downloadInvoice(inv.id)}
                    className="text-xs text-sky-400 hover:text-sky-300 transition font-medium"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business info */}
      <Section title="Business">
        <Field label="Business name" value={cfg.name ?? ""} onChange={set("name")} />
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Business type</label>
          <select className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full"
            value={cfg.business_type ?? "general"} onChange={set("business_type")}>
            {["general","salon","clinic","gym","immigration","trucking","restaurant","other"].map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </div>
      </Section>

      {/* WhatsApp */}
      <Section title="WhatsApp Cloud API">
        <p className="text-xs text-slate-500 -mt-1 mb-2">
          Your webhook URL: <code className="text-sky-400">…/webhooks/whatsapp/{tenantId}</code>
        </p>
        <Field label="Phone Number ID" value={cfg.wa_phone_number_id ?? ""} onChange={set("wa_phone_number_id")} placeholder="From Meta developer dashboard" />
        <Field label="Access Token" value={cfg.wa_access_token ?? ""} onChange={set("wa_access_token")} placeholder="Permanent system user token" type="password" />
        <Field label="Verify Token" value={cfg.wa_verify_token ?? ""} onChange={set("wa_verify_token")} placeholder="Your chosen secret string" />
        <Field label="Business Name" value={cfg.wa_business_name ?? ""} onChange={set("wa_business_name")} placeholder="Used in AI reply context" />
      </Section>

      {/* AI */}
      <Section title="AI Provider">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Default provider</label>
          <div className="flex gap-2">
            {AI_PROVIDERS.map(p => (
              <button key={p} onClick={() => setCfg(c => ({ ...c, ai_provider: p }))}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize font-medium transition ${cfg.ai_provider === p ? "bg-sky-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* HubSpot */}
      <Section title="HubSpot CRM">
        <Field label="API Key (Private App Token)" value={cfg.hubspot_api_key ?? ""} onChange={set("hubspot_api_key")} placeholder="pat-eu1-…" type="password" />
      </Section>

      {/* Zoho */}
      <Section title="Zoho CRM">
        <Field label="Client ID" value={cfg.zoho_client_id ?? ""} onChange={set("zoho_client_id")} placeholder="1000.xxxx" />
        <Field label="Client Secret" value={cfg.zoho_client_secret ?? ""} onChange={set("zoho_client_secret")} placeholder="…" type="password" />
        <Field label="Refresh Token" value={cfg.zoho_refresh_token ?? ""} onChange={set("zoho_refresh_token")} placeholder="1000.xxxx" type="password" />
      </Section>

      {/* Vapi — AI Calling Agent (Business plan) */}
      <Section title="AI Calling Agent (Vapi)">
        <p className="text-xs text-slate-500 -mt-1 mb-2">
          Required for the Business plan calling feature. Get credentials at <span className="text-sky-400">vapi.ai</span>
        </p>
        <Field label="Vapi API Key" value={cfg.vapi_api_key ?? ""} onChange={set("vapi_api_key")} placeholder="vapi_…" type="password" />
        <Field label="Vapi Phone Number ID" value={cfg.vapi_phone_number_id ?? ""} onChange={set("vapi_phone_number_id")} placeholder="From Vapi dashboard → Phone Numbers" />
      </Section>

      {/* Google Calendar */}
      <Section title="Google Calendar">
        <Field label="Client ID" value={cfg.google_client_id ?? ""} onChange={set("google_client_id")} placeholder="xxxx.apps.googleusercontent.com" />
        <Field label="Client Secret" value={cfg.google_client_secret ?? ""} onChange={set("google_client_secret")} placeholder="GOCSPX-…" type="password" />
        <Field label="Refresh Token" value={cfg.google_refresh_token ?? ""} onChange={set("google_refresh_token")} placeholder="1//…" type="password" />
        <Field label="Calendar ID" value={cfg.google_calendar_id ?? "primary"} onChange={set("google_calendar_id")} placeholder="primary" />
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Timezone</label>
          <select className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full"
            value={cfg.google_timezone ?? "Asia/Kolkata"} onChange={set("google_timezone")}>
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl px-6 py-2 text-sm font-semibold transition">
          {saving ? "Saving…" : "Save Settings"}
        </button>
        {saved && <span className="text-green-400 text-sm">Saved!</span>}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-white/5 flex flex-col gap-3">
      <p className="text-sm font-semibold text-white border-b border-white/10 pb-2">{title}</p>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, placeholder = "", type = "text" }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1 block">{label}</label>
      <input
        className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-1 focus:ring-sky-500 font-mono"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  )
}

// ── Tenants tab (platform admin) ──────────────────────────────────────────

function TenantsTab({ token }: { token: string }) {
  const [tenants, setTenants]   = useState<TenantInfo[]>([])
  const [selected, setSelected] = useState<TenantInfo | null>(null)
  const [loading, setLoading]   = useState(true)
  const [actionMsg, setActionMsg] = useState("")

  useEffect(() => {
    apiFetch(token, "/tenants").then(data => { setTenants(data); setLoading(false) }).catch(() => setLoading(false))
  }, [token])

  async function suspend(id: string) {
    if (!window.confirm("Suspend this tenant?")) return
    await apiFetch(token, `/tenants/${id}/suspend`, { method: "POST" }).catch(() => {})
    setTenants(prev => prev.map(t => t.id === id ? { ...t, status: "suspended", is_active: false } : t))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: "suspended", is_active: false } : null)
    setActionMsg("Tenant suspended")
  }

  async function activate(id: string) {
    await apiFetch(token, `/tenants/${id}/activate`, { method: "POST" }).catch(() => {})
    setTenants(prev => prev.map(t => t.id === id ? { ...t, status: "active", is_active: true } : t))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: "active", is_active: true } : null)
    setActionMsg("Tenant activated")
  }

  return (
    <div className="flex gap-5 h-full">
      {/* Left: list */}
      <div className="w-72 shrink-0 flex flex-col gap-3">
        <h1 className="text-xl font-bold text-white">Tenants <span className="text-slate-500 text-base font-normal">({tenants.length})</span></h1>
        <div className="flex flex-col gap-1 overflow-y-auto flex-1">
          {loading ? (
            <p className="text-slate-500 text-sm text-center py-8">Loading…</p>
          ) : tenants.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No tenants yet</p>
          ) : tenants.map(t => (
            <button key={t.id} onClick={() => { setSelected(t); setActionMsg("") }}
              className={`text-left px-3 py-2.5 rounded-xl border transition ${
                selected?.id === t.id ? "bg-sky-500/10 border-sky-500/40"
                : "bg-slate-800 border-white/5 hover:bg-slate-700"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-white text-sm font-medium truncate">{t.name}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded capitalize whitespace-nowrap ${t.status === "active" ? "bg-green-500/20 text-green-400" : "bg-slate-700 text-slate-400"}`}>
                  {t.status}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5 capitalize">{t.business_type}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right: detail */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <div className="flex flex-col gap-4 max-w-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                <p className="text-slate-400 text-sm">{selected.email} · {selected.slug}</p>
              </div>
              <div className="flex gap-2">
                {selected.status === "active" ? (
                  <button onClick={() => suspend(selected.id)}
                    className="text-xs text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition">
                    Suspend
                  </button>
                ) : (
                  <button onClick={() => activate(selected.id)}
                    className="text-xs text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg hover:bg-green-500/10 transition">
                    Activate
                  </button>
                )}
              </div>
            </div>
            {actionMsg && <p className="text-green-400 text-sm">{actionMsg}</p>}

            <div className="bg-slate-800 rounded-xl p-5 border border-white/5 grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-slate-500 mb-1">Business type</p><p className="text-white capitalize">{selected.business_type}</p></div>
              <div><p className="text-xs text-slate-500 mb-1">AI provider</p><p className="text-white capitalize">{selected.ai_provider}</p></div>
              <div><p className="text-xs text-slate-500 mb-1">Registered</p><p className="text-slate-300 text-xs">{new Date(selected.created_at).toLocaleDateString()}</p></div>
            </div>

            <div className="bg-slate-800 rounded-xl p-5 border border-white/5">
              <p className="text-sm font-semibold text-white mb-3">Integrations</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "WhatsApp", active: selected.has_whatsapp },
                  { label: "HubSpot",  active: selected.has_hubspot },
                  { label: "Zoho CRM", active: selected.has_zoho },
                  { label: "Google Calendar", active: selected.has_gcal },
                ].map(i => (
                  <div key={i.label} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${i.active ? "bg-green-400" : "bg-slate-600"}`} />
                    <span className={`text-sm ${i.active ? "text-white" : "text-slate-500"}`}>{i.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
              <p className="text-xs text-slate-400 mb-1">Tenant ID</p>
              <code className="text-xs text-amber-400 break-all">{selected.id}</code>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            Select a tenant to view details
          </div>
        )}
      </div>
    </div>
  )
}

// ── Appointments tab ──────────────────────────────────────────────────────

const APPT_STATUS_STYLE: Record<string, string> = {
  pending:   "bg-amber-500/20 text-amber-400",
  confirmed: "bg-sky-500/20 text-sky-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-slate-700 text-slate-400",
}

function toLocalInput(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function AppointmentsTab({ token, clients }: { token: string; clients: Client[] }) {
  const [appts, setAppts]       = useState<Appointment[]>([])
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [clientFilter, setClientFilter] = useState("all")
  const [loading, setLoading]   = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [confirmMsg, setConfirmMsg] = useState("")
  // Confirm form state
  const [schedAt, setSchedAt]   = useState("")
  const [duration, setDuration] = useState(60)
  const [service, setService]   = useState("")
  const [notifyWA, setNotifyWA] = useState(true)

  async function load() {
    setLoading(true)
    const data: Appointment[] = await apiFetch(token, "/appointments").catch(() => [])
    setAppts(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [token])

  function select(a: Appointment) {
    setSelected(a)
    setConfirmMsg("")
    setSchedAt(toLocalInput(a.scheduled_at))
    setDuration(a.duration_minutes ?? 60)
    setService(a.service ?? "")
  }

  function clientName(id: string) {
    return clients.find(c => c.id === id)?.name ?? id.slice(0, 8)
  }

  async function confirm() {
    if (!selected || !schedAt) return
    setConfirming(true); setConfirmMsg("")
    try {
      const updated = await apiFetch(token, `/appointments/${selected.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({
          scheduled_at:    new Date(schedAt).toISOString(),
          duration_minutes: duration,
          service,
          notify_customer: notifyWA,
        }),
      })
      setSelected(updated)
      setAppts(prev => prev.map(a => a.id === updated.id ? updated : a))
      setConfirmMsg(notifyWA ? "Confirmed — WhatsApp notification sent!" : "Confirmed")
    } catch (e: any) {
      setConfirmMsg(`Error: ${e.message}`)
    }
    setConfirming(false)
  }

  async function cancelAppt() {
    if (!selected || !window.confirm("Cancel this appointment?")) return
    const updated = await apiFetch(token, `/appointments/${selected.id}/cancel`, { method: "POST" }).catch(() => null)
    if (updated) {
      setSelected(updated)
      setAppts(prev => prev.map(a => a.id === updated.id ? updated : a))
      setConfirmMsg("Appointment cancelled")
    }
  }

  async function markComplete() {
    if (!selected) return
    const updated = await apiFetch(token, `/appointments/${selected.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "completed" }),
    }).catch(() => null)
    if (updated) {
      setSelected(updated)
      setAppts(prev => prev.map(a => a.id === updated.id ? updated : a))
    }
  }

  const filtered = appts.filter(a => {
    const matchStatus = statusFilter === "all" || a.status === statusFilter
    const matchClient = clientFilter === "all" || a.client_id === clientFilter
    return matchStatus && matchClient
  })

  const pendingCount = appts.filter(a => a.status === "pending").length

  return (
    <div className="flex gap-5 h-full">
      {/* Left: list */}
      <div className="w-72 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            Appointments
            {pendingCount > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                {pendingCount}
              </span>
            )}
          </h1>
          <button onClick={load} className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-white/5">
            Refresh
          </button>
        </div>

        {/* Status filters */}
        <div className="flex gap-1 flex-wrap">
          {["all", "pending", "confirmed", "completed", "cancelled"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2 py-0.5 rounded text-xs capitalize transition ${
                statusFilter === s ? "bg-sky-500 text-white" : "bg-slate-800 border border-white/10 text-slate-400 hover:text-white"}`}>
              {s}
            </button>
          ))}
        </div>

        {clients.length > 0 && (
          <select className="bg-slate-800 text-white rounded-lg px-3 py-1.5 text-sm border border-white/5"
            value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="all">All clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}

        {/* List */}
        <div className="flex flex-col gap-1 overflow-y-auto flex-1">
          {loading ? (
            <p className="text-slate-500 text-sm text-center py-8">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No appointments</p>
          ) : filtered.map(a => (
            <button key={a.id} onClick={() => select(a)}
              className={`text-left px-3 py-2.5 rounded-xl border transition ${
                selected?.id === a.id
                  ? "bg-sky-500/10 border-sky-500/40"
                  : a.status === "pending"
                    ? "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10"
                    : "bg-slate-800 border-white/5 hover:bg-slate-700"}`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-white text-sm font-medium truncate">
                  {a.customer_name || a.phone_number || "Unknown"}
                </p>
                <span className={`text-xs px-1.5 py-0.5 rounded capitalize whitespace-nowrap ${APPT_STATUS_STYLE[a.status] ?? APPT_STATUS_STYLE.pending}`}>
                  {a.status}
                </span>
              </div>
              <p className="text-slate-400 text-xs truncate">{a.service || "No service specified"}</p>
              <p className="text-slate-500 text-xs mt-0.5">
                {a.scheduled_at
                  ? new Date(a.scheduled_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
                  : a.requested_at_text || "Time not set"}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Right: detail + confirm form */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <div className="flex flex-col gap-4 max-w-xl">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {selected.customer_name || selected.phone_number || "Unknown customer"}
                </h2>
                <p className="text-slate-400 text-sm">{clientName(selected.client_id)}</p>
              </div>
              <span className={`text-sm px-3 py-1 rounded-lg capitalize font-medium ${APPT_STATUS_STYLE[selected.status] ?? APPT_STATUS_STYLE.pending}`}>
                {selected.status}
              </span>
            </div>

            {/* Customer message */}
            {selected.notes && (
              <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
                <p className="text-xs text-slate-400 mb-2">Customer message</p>
                <p className="text-white text-sm whitespace-pre-wrap">{selected.notes}</p>
                {selected.requested_at_text && (
                  <p className="text-amber-400 text-xs mt-2">
                    Requested: <span className="text-white">{selected.requested_at_text}</span>
                  </p>
                )}
              </div>
            )}

            {/* Confirm / edit form */}
            {selected.status !== "cancelled" && (
              <div className="bg-slate-800 rounded-xl p-5 border border-white/5 flex flex-col gap-4">
                <p className="text-sm font-semibold text-white">
                  {selected.status === "pending" ? "Confirm Appointment" : "Edit Appointment"}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Date & Time</p>
                    <input
                      type="datetime-local"
                      className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-1 focus:ring-sky-500"
                      value={schedAt}
                      onChange={e => setSchedAt(e.target.value)}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Duration</p>
                    <select
                      className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full"
                      value={duration}
                      onChange={e => setDuration(Number(e.target.value))}
                    >
                      {[15, 30, 45, 60, 90, 120].map(m => (
                        <option key={m} value={m}>{m} min</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-1">Service</p>
                  <input
                    className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="e.g. Haircut, Dental checkup, Consultation"
                    value={service}
                    onChange={e => setService(e.target.value)}
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyWA}
                    onChange={e => setNotifyWA(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-300">Send WhatsApp confirmation to customer</span>
                </label>

                {confirmMsg && (
                  <p className={`text-sm ${confirmMsg.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>
                    {confirmMsg}
                  </p>
                )}

                <div className="flex gap-2">
                  <button onClick={confirm} disabled={confirming || !schedAt}
                    className="flex-1 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-semibold transition">
                    {confirming ? "Confirming…" : selected.status === "pending" ? "Confirm" : "Update"}
                  </button>
                  {selected.status === "confirmed" && (
                    <button onClick={markComplete}
                      className="bg-green-600 hover:bg-green-500 text-white rounded-lg px-4 py-2 text-sm font-semibold transition">
                      Done
                    </button>
                  )}
                  {selected.status !== "cancelled" && (
                    <button onClick={cancelAppt}
                      className="bg-slate-700 hover:bg-slate-600 text-red-400 rounded-lg px-4 py-2 text-sm transition">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Google Calendar + details */}
            <div className="bg-slate-800 rounded-xl p-4 border border-white/5 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 mb-1">Phone</p>
                <p className="text-white text-sm">{selected.phone_number || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Duration</p>
                <p className="text-white text-sm">{selected.duration_minutes} min</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Google Calendar</p>
                <p className={`text-xs font-mono ${selected.google_event_id ? "text-green-400" : "text-slate-600"}`}>
                  {selected.google_event_id ? "Synced ✓" : "Not synced"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Reminder sent</p>
                <p className={`text-xs ${selected.reminder_sent ? "text-green-400" : "text-slate-600"}`}>
                  {selected.reminder_sent ? "Yes ✓" : "Not yet"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Received</p>
                <p className="text-slate-300 text-xs">{new Date(selected.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            {pendingCount > 0
              ? `${pendingCount} pending appointment${pendingCount > 1 ? "s" : ""} waiting for confirmation`
              : "Select an appointment to view details"}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Contacts tab ──────────────────────────────────────────────────────────

const STATUS_OPTS = ["new", "contacted", "qualified", "converted", "lost"]
const STATUS_STYLE: Record<string, string> = {
  new:       "bg-sky-500/20 text-sky-400",
  contacted: "bg-violet-500/20 text-violet-400",
  qualified: "bg-amber-500/20 text-amber-400",
  converted: "bg-green-500/20 text-green-400",
  lost:      "bg-slate-700 text-slate-400",
}

function ContactsTab({ token, clients }: { token: string; clients: Client[] }) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selected, setSelected] = useState<Contact | null>(null)
  const [search, setSearch]     = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [clientFilter, setClientFilter] = useState("all")
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [syncMsg, setSyncMsg]   = useState("")
  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [newPhone, setNewPhone]   = useState("")
  const [newEmail, setNewEmail]   = useState("")
  const [newFirst, setNewFirst]   = useState("")
  const [newLast, setNewLast]     = useState("")
  const [newClient, setNewClient] = useState("")
  const [createErr, setCreateErr] = useState("")

  async function load() {
    setLoading(true)
    const data: Contact[] = await apiFetch(token, "/contacts").catch(() => [])
    setContacts(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [token])

  function clientName(id: string) {
    return clients.find(c => c.id === id)?.name ?? id.slice(0, 8)
  }

  async function saveField(field: string, value: string) {
    if (!selected) return
    setSaving(true)
    const updated = await apiFetch(token, `/contacts/${selected.id}`, {
      method: "PATCH",
      body: JSON.stringify({ [field]: value }),
    }).catch(() => null)
    if (updated) {
      setSelected(updated)
      setContacts(prev => prev.map(c => c.id === updated.id ? updated : c))
    }
    setSaving(false)
  }

  async function syncContact() {
    if (!selected) return
    setSyncMsg("Syncing…")
    const result = await apiFetch(token, `/contacts/${selected.id}/sync`, { method: "POST" }).catch(() => null)
    if (result) {
      setSyncMsg(`HubSpot: ${result.hubspot_id || "—"} | Zoho: ${result.zoho_id || "—"}`)
      load()
    } else {
      setSyncMsg("Sync failed — check backend logs")
    }
  }

  async function deleteContact() {
    if (!selected || !confirm("Delete this contact?")) return
    await apiFetch(token, `/contacts/${selected.id}`, { method: "DELETE" }).catch(() => {})
    setSelected(null)
    load()
  }

  async function createContact() {
    setCreateErr("")
    if (!newClient) { setCreateErr("Select a client"); return }
    if (!newPhone && !newEmail) { setCreateErr("Enter phone or email"); return }
    const c = await apiFetch(token, "/contacts", {
      method: "POST",
      body: JSON.stringify({
        client_id:    newClient,
        phone_number: newPhone,
        email:        newEmail,
        first_name:   newFirst,
        last_name:    newLast,
        source:       "manual",
      }),
    }).catch((e: any) => { setCreateErr(e.message); return null })
    if (c) {
      setNewPhone(""); setNewEmail(""); setNewFirst(""); setNewLast(""); setNewClient("")
      setShowCreate(false)
      load()
      setSelected(c)
    }
  }

  const filtered = contacts.filter(c => {
    const name = `${c.first_name} ${c.last_name}`.toLowerCase()
    const matchSearch = !search ||
      c.phone_number.includes(search) ||
      name.includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || c.status === statusFilter
    const matchClient = clientFilter === "all" || c.client_id === clientFilter
    return matchSearch && matchStatus && matchClient
  })

  return (
    <div className="flex gap-5 h-full">
      {/* Left: list + filters */}
      <div className="w-72 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Contacts</h1>
          <div className="flex gap-2">
            <button onClick={load} className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-white/5">
              Refresh
            </button>
            <button onClick={() => setShowCreate(v => !v)}
              className="text-xs bg-sky-500 text-white px-2 py-1 rounded hover:bg-sky-400 transition">
              + New
            </button>
          </div>
        </div>

        {/* Create form (collapsed by default) */}
        {showCreate && (
          <div className="bg-slate-800 rounded-xl p-3 border border-white/10 flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">New Contact</p>
            <select className="bg-slate-700 text-white rounded-lg px-2 py-1.5 text-xs"
              value={newClient} onChange={e => setNewClient(e.target.value)}>
              <option value="">Select client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input className="bg-slate-700 text-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="First name" value={newFirst} onChange={e => setNewFirst(e.target.value)} />
              <input className="bg-slate-700 text-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="Last name" value={newLast} onChange={e => setNewLast(e.target.value)} />
            </div>
            <input className="bg-slate-700 text-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Phone (+91...)" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
            <input className="bg-slate-700 text-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="Email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            {createErr && <p className="text-red-400 text-xs">{createErr}</p>}
            <button onClick={createContact}
              className="bg-sky-500 text-white rounded-lg py-1.5 text-xs font-semibold hover:bg-sky-400 transition">
              Create
            </button>
          </div>
        )}

        {/* Filters */}
        <input
          className="bg-slate-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500 border border-white/5"
          placeholder="Search name, phone, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-1 flex-wrap">
          {["all", ...STATUS_OPTS].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2 py-0.5 rounded text-xs capitalize transition ${
                statusFilter === s ? "bg-sky-500 text-white" : "bg-slate-800 border border-white/10 text-slate-400 hover:text-white"}`}>
              {s}
            </button>
          ))}
        </div>
        {clients.length > 0 && (
          <select className="bg-slate-800 text-white rounded-lg px-3 py-1.5 text-sm border border-white/5"
            value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="all">All clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}

        {/* List */}
        <div className="flex flex-col gap-1 overflow-y-auto flex-1">
          {loading ? (
            <p className="text-slate-500 text-sm text-center py-8">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No contacts found</p>
          ) : filtered.map(c => {
            const name = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.phone_number || c.email
            return (
              <button key={c.id} onClick={() => { setSelected(c); setSyncMsg("") }}
                className={`text-left px-3 py-2.5 rounded-xl border transition ${
                  selected?.id === c.id
                    ? "bg-sky-500/10 border-sky-500/40"
                    : "bg-slate-800 border-white/5 hover:bg-slate-700"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white text-sm font-medium truncate">{name}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded capitalize whitespace-nowrap ${STATUS_STYLE[c.status] ?? STATUS_STYLE.new}`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-slate-500 text-xs mt-0.5 truncate">{c.phone_number || c.email}</p>
                {c.last_intent && (
                  <span className={`mt-1 inline-block text-xs px-1.5 py-0.5 rounded capitalize ${intentStyle(c.last_intent)}`}>
                    {c.last_intent}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Right: detail */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <div className="flex flex-col gap-4 max-w-2xl">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {[selected.first_name, selected.last_name].filter(Boolean).join(" ") || selected.phone_number}
                </h2>
                <p className="text-slate-400 text-sm">{clientName(selected.client_id)} · {selected.source}</p>
              </div>
              <button onClick={deleteContact}
                className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg transition">
                Delete
              </button>
            </div>

            {/* Contact info */}
            <div className="bg-slate-800 rounded-xl p-5 border border-white/5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-400 mb-1">Phone</p>
                <p className="text-white">{selected.phone_number || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Email</p>
                <p className="text-white">{selected.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Created</p>
                <p className="text-slate-300 text-xs">{new Date(selected.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Last active</p>
                <p className="text-slate-300 text-xs">{new Date(selected.updated_at).toLocaleString()}</p>
              </div>
            </div>

            {/* Status + Tags */}
            <div className="bg-slate-800 rounded-xl p-5 border border-white/5 flex flex-col gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-2">Status</p>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_OPTS.map(s => (
                    <button key={s} onClick={() => saveField("status", s)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                        selected.status === s ? "bg-sky-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">Tags <span className="text-slate-600">(comma-separated, press Enter to save)</span></p>
                <input
                  className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-1 focus:ring-sky-500"
                  defaultValue={selected.tags}
                  onKeyDown={e => e.key === "Enter" && saveField("tags", (e.target as HTMLInputElement).value)}
                />
              </div>
            </div>

            {/* AI Triage */}
            {(selected.last_intent || selected.last_summary) && (
              <div className="bg-slate-800 rounded-xl p-5 border border-white/5 flex flex-col gap-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Last AI Triage</p>
                <div className="flex gap-3 flex-wrap">
                  {selected.last_intent && (
                    <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${intentStyle(selected.last_intent)}`}>
                      {selected.last_intent}
                    </span>
                  )}
                  {selected.last_urgency && (
                    <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${
                      selected.last_urgency === "high" ? "bg-red-500/20 text-red-400"
                      : selected.last_urgency === "medium" ? "bg-amber-500/20 text-amber-400"
                      : "bg-slate-700 text-slate-400"}`}>
                      {selected.last_urgency} urgency
                    </span>
                  )}
                </div>
                {selected.last_summary && (
                  <p className="text-slate-300 text-sm">{selected.last_summary}</p>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="bg-slate-800 rounded-xl p-5 border border-white/5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Notes <span className="text-slate-600 normal-case">(press Enter to save)</span>
              </p>
              <textarea
                className="w-full bg-slate-700 text-white rounded-xl p-3 text-sm min-h-24 resize-none outline-none focus:ring-1 focus:ring-sky-500"
                defaultValue={selected.notes}
                placeholder="Add operator notes…"
                onKeyDown={e => {
                  if (e.key === "Enter" && e.ctrlKey) saveField("notes", (e.target as HTMLTextAreaElement).value)
                }}
              />
              <p className="text-xs text-slate-600 mt-1">Ctrl+Enter to save</p>
            </div>

            {/* CRM Sync */}
            <div className="bg-slate-800 rounded-xl p-5 border border-white/5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">CRM Sync</p>
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">HubSpot ID</p>
                  <p className={`text-xs font-mono ${selected.crm_hubspot_id ? "text-green-400" : "text-slate-600"}`}>
                    {selected.crm_hubspot_id || "Not synced"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Zoho ID</p>
                  <p className={`text-xs font-mono ${selected.crm_zoho_id ? "text-green-400" : "text-slate-600"}`}>
                    {selected.crm_zoho_id || "Not synced"}
                  </p>
                </div>
              </div>
              <button onClick={syncContact}
                className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-4 py-1.5 text-sm transition">
                {saving ? "Saving…" : "Sync to CRMs"}
              </button>
              {syncMsg && <p className="text-xs text-slate-400 mt-2">{syncMsg}</p>}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            Select a contact to view details
          </div>
        )}
      </div>
    </div>
  )
}

// ── WhatsApp tab ──────────────────────────────────────────────────────────

const INTENT_STYLE: Record<string, string> = {
  booking:  "bg-sky-500/20 text-sky-400",
  support:  "bg-amber-500/20 text-amber-400",
  inquiry:  "bg-violet-500/20 text-violet-400",
  other:    "bg-slate-700 text-slate-400",
}

function intentStyle(intent: string) {
  return INTENT_STYLE[intent?.toLowerCase()] ?? INTENT_STYLE.other
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function WhatsAppTab({ token, clients }: { token: string; clients: Client[] }) {
  const [convos, setConvos]     = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [search, setSearch]     = useState("")
  const [loading, setLoading]   = useState(true)
  const [clientFilter, setClientFilter] = useState("all")

  async function load() {
    setLoading(true)
    const data: Conversation[] = await apiFetch(token, "/conversations").catch(() => [])
    setConvos(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [token])

  function clientName(id: string) {
    return clients.find(c => c.id === id)?.name ?? id.slice(0, 8)
  }

  const filtered = convos.filter(c => {
    const matchSearch = !search ||
      c.phone_number.includes(search) ||
      c.display_name.toLowerCase().includes(search.toLowerCase()) ||
      c.last_message.toLowerCase().includes(search.toLowerCase())
    const matchClient = clientFilter === "all" || c.client_id === clientFilter
    return matchSearch && matchClient
  })

  return (
    <div className="flex gap-5 h-full">
      {/* Left: list */}
      <div className="w-80 shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">WhatsApp</h1>
          <button onClick={load} className="text-xs text-slate-400 hover:text-white transition px-2 py-1 rounded bg-slate-800 border border-white/5">
            Refresh
          </button>
        </div>

        {/* Filters */}
        <input
          className="bg-slate-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500 border border-white/5"
          placeholder="Search number or name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {clients.length > 0 && (
          <select
            className="bg-slate-800 text-white rounded-lg px-3 py-1.5 text-sm border border-white/5"
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
          >
            <option value="all">All clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}

        {/* Conversation list */}
        <div className="flex flex-col gap-1 overflow-y-auto flex-1">
          {loading ? (
            <p className="text-slate-500 text-sm text-center py-8">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No conversations yet</p>
          ) : filtered.map(c => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className={`text-left px-3 py-3 rounded-xl border transition ${
                selected?.id === c.id
                  ? "bg-sky-500/10 border-sky-500/40"
                  : "bg-slate-800 border-white/5 hover:bg-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {c.display_name || c.phone_number}
                  </p>
                  {c.display_name && (
                    <p className="text-slate-500 text-xs">{c.phone_number}</p>
                  )}
                </div>
                <span className="text-slate-500 text-xs whitespace-nowrap mt-0.5">
                  {timeAgo(c.updated_at)}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1 truncate">{c.last_message || "—"}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {c.last_intent && (
                  <span className={`text-xs px-1.5 py-0.5 rounded capitalize font-medium ${intentStyle(c.last_intent)}`}>
                    {c.last_intent}
                  </span>
                )}
                <span className="text-xs text-slate-500">{c.message_count} msg{c.message_count !== "1" ? "s" : ""}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: detail */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="bg-slate-800 rounded-xl p-5 border border-white/5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {selected.display_name || selected.phone_number}
                  </h2>
                  {selected.display_name && (
                    <p className="text-slate-400 text-sm mt-0.5">{selected.phone_number}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {selected.last_intent && (
                    <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${intentStyle(selected.last_intent)}`}>
                      {selected.last_intent}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">{selected.message_count} messages</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Client: </span>
                  <span className="text-slate-300">{clientName(selected.client_id)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Last active: </span>
                  <span className="text-slate-300">{new Date(selected.updated_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500">First seen: </span>
                  <span className="text-slate-300">{new Date(selected.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Last customer message */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Customer message</p>
              <div className="bg-slate-700 rounded-xl p-4">
                <p className="text-white text-sm whitespace-pre-wrap">
                  {selected.last_message || <span className="text-slate-500 italic">No message recorded</span>}
                </p>
              </div>
            </div>

            {/* Last AI reply */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">AI reply sent</p>
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4">
                <p className="text-sky-100 text-sm whitespace-pre-wrap">
                  {selected.last_reply || <span className="text-slate-500 italic">No reply recorded</span>}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            Select a conversation to view details
          </div>
        )}
      </div>
    </div>
  )
}

// ── Calls tab ─────────────────────────────────────────────────────────────

function CallsTab({ token, clients }: { token: string; clients: Client[] }) {
  const [calls, setCalls]       = useState<CallLog[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<CallLog | null>(null)
  const [dialing, setDialing]   = useState(false)
  const [dialNum, setDialNum]   = useState("")
  const [dialPurpose, setDialPurpose] = useState("")
  const [dialErr, setDialErr]   = useState("")

  useEffect(() => {
    apiFetch(token, "/calls").then(d => { setCalls(d); setLoading(false) }).catch(() => setLoading(false))
  }, [token])

  async function makeCall() {
    if (!dialNum || !dialPurpose) { setDialErr("Phone number and purpose are required"); return }
    setDialing(true); setDialErr("")
    try {
      const log = await apiFetch(token, "/calls/outbound", {
        method: "POST",
        body: JSON.stringify({ phone_number: dialNum, purpose: dialPurpose }),
      })
      setCalls(prev => [log, ...prev])
      setDialNum(""); setDialPurpose("")
    } catch (e: any) {
      setDialErr(e.message ?? "Call failed")
    } finally {
      setDialing(false)
    }
  }

  const statusColor: Record<string, string> = {
    completed:   "text-green-400",
    "in-progress": "text-sky-400",
    ringing:     "text-amber-400",
    queued:      "text-slate-400",
    failed:      "text-red-400",
    "no-answer": "text-orange-400",
  }

  if (loading) return <p className="text-slate-500 text-sm">Loading…</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">AI Calling Agent</h1>
        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full font-medium">Business Plan</span>
      </div>

      {/* Outbound call trigger */}
      <div className="bg-slate-800 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-white">Make an outbound call</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="+1 (555) 000-0000"
            value={dialNum}
            onChange={e => setDialNum(e.target.value)}
          />
          <input
            className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="Purpose — e.g. appointment reminder for tomorrow at 2pm"
            value={dialPurpose}
            onChange={e => setDialPurpose(e.target.value)}
          />
        </div>
        {dialErr && <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{dialErr}</p>}
        <button
          onClick={makeCall}
          disabled={dialing}
          className="self-start bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl px-5 py-2 text-sm font-semibold transition"
        >
          {dialing ? "Calling…" : "📞 Call now"}
        </button>
      </div>

      {/* Call log */}
      <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/8">
          <h2 className="text-sm font-semibold text-white">Call history ({calls.length})</h2>
        </div>
        {calls.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-10">No calls yet</p>
        ) : (
          <div className="divide-y divide-white/5">
            {calls.map(c => (
              <div key={c.id}
                onClick={() => setSelected(selected?.id === c.id ? null : c)}
                className="px-5 py-3 hover:bg-slate-800/60 cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{c.direction === "inbound" ? "📲" : "📞"}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{c.phone_number}</p>
                      <p className="text-xs text-slate-500 capitalize">{c.direction} · {new Date(c.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    {c.duration_seconds > 0 && (
                      <span className="text-xs text-slate-400">{Math.floor(c.duration_seconds / 60)}m {c.duration_seconds % 60}s</span>
                    )}
                    <span className={`text-xs font-semibold capitalize ${statusColor[c.status] ?? "text-slate-400"}`}>{c.status}</span>
                  </div>
                </div>
                {selected?.id === c.id && c.transcript && (
                  <div className="mt-3 bg-slate-900/60 rounded-xl p-4">
                    <p className="text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wide">Transcript</p>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{c.transcript}</p>
                    {c.recording_url && (
                      <a href={c.recording_url} target="_blank" rel="noreferrer"
                        className="inline-block mt-3 text-xs text-sky-400 hover:text-sky-300">
                        🎙 Listen to recording
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Team tab (owner only) ──────────────────────────────────────────────────

function TeamTab({ token }: { token: string }) {
  const [users, setUsers]       = useState<AdminUser[]>([])
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirst]   = useState("")
  const [role, setRole]         = useState("operator")
  const [error, setError]       = useState("")
  const [success, setSuccess]   = useState("")

  useEffect(() => {
    apiFetch(token, "/auth/users").then(setUsers).catch(() => {})
  }, [token])

  async function createUser() {
    setError(""); setSuccess("")
    if (!email || !password || !firstName) { setError("All fields required"); return }
    try {
      await apiFetch(token, "/auth/users", {
        method: "POST",
        body: JSON.stringify({ email, password, first_name: firstName, role }),
      })
      setEmail(""); setPassword(""); setFirst(""); setRole("operator")
      setSuccess("User created")
      apiFetch(token, "/auth/users").then(setUsers)
    } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-xl font-bold text-white">Team</h1>

      {/* Current team */}
      <div className="bg-slate-800 rounded-xl border border-white/5">
        <p className="px-5 py-3 text-sm font-semibold text-white border-b border-white/10">Members</p>
        {users.map(u => (
          <div key={u.id} className="px-5 py-3 flex items-center justify-between border-b border-white/5 last:border-0">
            <div>
              <p className="text-sm text-white font-medium">{u.first_name} {u.last_name}</p>
              <p className="text-xs text-slate-400">{u.email}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${
              u.role === "owner" ? "bg-sky-500/20 text-sky-400" : "bg-slate-700 text-slate-400"}`}>
              {u.role}
            </span>
          </div>
        ))}
      </div>

      {/* Add team member */}
      <div className="bg-slate-800 rounded-xl p-5 border border-white/5 flex flex-col gap-3">
        <p className="text-sm font-semibold text-white">Add Team Member</p>
        <div className="grid grid-cols-2 gap-3">
          <input className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="First name" value={firstName} onChange={e => setFirst(e.target.value)} />
          <input className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <input className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-sky-500"
          placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <select className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          value={role} onChange={e => setRole(e.target.value)}>
          <option value="operator">Operator</option>
          <option value="owner">Owner</option>
        </select>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">{success}</p>}
        <button onClick={createUser}
          className="bg-sky-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-sky-400 transition">
          Add Member
        </button>
      </div>
    </div>
  )
}

// ── Root dashboard ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const [token, setToken]             = useState<string | null>(null)
  const [user, setUser]               = useState<AdminUser | null>(null)
  const [ready, setReady]             = useState(false)
  const [tab, setTab]                 = useState<Tab>("overview")
  const [clients, setClients]         = useState<Client[]>([])
  const [allJobs, setAllJobs]         = useState<Job[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("jwt")
    if (!saved) { setReady(true); return }
    apiFetch(saved, "/auth/me")
      .then(u => { setToken(saved); setUser(u); setReady(true) })
      .catch(() => { localStorage.removeItem("jwt"); setReady(true) })
  }, [])

  const loadClients = useCallback(async (t: string) => {
    const list: Client[] = await apiFetch(t, "/clients").catch(() => [])
    setClients(list)
    const jobs = await Promise.all(list.map(c =>
      apiFetch(t, `/ai/jobs/${c.id}`).catch(() => [] as Job[])
    ))
    setAllJobs(jobs.flat())
  }, [])

  const loadConversations = useCallback(async (t: string) => {
    const data: Conversation[] = await apiFetch(t, "/conversations").catch(() => [])
    setConversations(data)
  }, [])

  useEffect(() => {
    if (token) {
      loadClients(token)
      loadConversations(token)
    }
  }, [token, loadClients, loadConversations])

  function handleLogout() {
    localStorage.removeItem("jwt")
    setToken(null); setUser(null); setClients([]); setAllJobs([]); setConversations([])
    window.location.replace("/login")
  }

  if (!ready) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <p className="text-slate-500 text-sm">Loading…</p>
    </div>
  )

  if (!token || !user) {
    window.location.replace("/login")
    return null
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      <Sidebar tab={tab} setTab={setTab} user={user} onLogout={handleLogout} />
      <main className="flex-1 p-6 overflow-y-auto">
        {tab === "overview"  && <OverviewTab token={token} clients={clients} jobs={allJobs} conversations={conversations} user={user} />}
        {tab === "clients"   && <ClientsTab token={token} clients={clients} reload={() => loadClients(token)} />}
        {tab === "jobs"      && <JobsTab token={token} clients={clients} />}
        {tab === "whatsapp"  && <WhatsAppTab token={token} clients={clients} />}
        {tab === "contacts"     && <ContactsTab token={token} clients={clients} />}
        {tab === "appointments" && <AppointmentsTab token={token} clients={clients} />}
        {tab === "calls"        && <CallsTab token={token} clients={clients} />}
        {tab === "settings"     && <SettingsTab token={token} user={user} />}
        {tab === "tenants"      && <TenantsTab token={token} />}
        {tab === "team"         && user.role === "owner" && <TeamTab token={token} />}
      </main>
    </div>
  )
}
