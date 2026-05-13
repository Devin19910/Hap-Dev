"use client"
import { useEffect, useState, useCallback } from "react"

const API = "http://localhost:8000"

// ── Types ──────────────────────────────────────────────────────────────────

type AdminUser = { id: string; email: string; first_name: string; last_name: string; role: string }
type Client    = { id: string; name: string; email: string; api_key: string; is_active: boolean; created_at: string }
type Sub       = { tier: string; monthly_limit: number; requests_used: number; remaining: number; is_active: boolean }
type Job       = { id: string; client_id: string; provider: string; prompt: string; response: string | null; tokens_used: number; status: string; created_at: string }

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

type Tab = "overview" | "clients" | "jobs" | "whatsapp" | "contacts" | "team"

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

// ── Login screen ───────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (token: string, user: AdminUser) => void }) {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  async function submit() {
    if (!email || !password) { setError("Enter email and password"); return }
    setLoading(true); setError("")
    try {
      const body = new URLSearchParams({ username: email, password })
      const r = await fetch(`${API}/auth/token`, { method: "POST", body })
      if (!r.ok) { const e = await r.json(); setError(e.detail ?? "Login failed"); return }
      const { access_token } = await r.json()
      const user: AdminUser = await apiFetch(access_token, "/auth/me")
      localStorage.setItem("jwt", access_token)
      onLogin(access_token, user)
    } catch {
      setError("Cannot reach backend — is Docker running?")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-2xl w-80 flex flex-col gap-4 shadow-xl">
        <div>
          <h1 className="text-white font-bold text-xl">AI Platform</h1>
          <p className="text-slate-400 text-sm mt-1">Admin Dashboard</p>
        </div>
        <input
          className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
        />
        <input
          className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          onClick={submit}
          disabled={loading}
          className="bg-sky-500 text-white rounded-lg py-2 font-semibold hover:bg-sky-400 transition disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </div>
    </div>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: "overview",  label: "Overview",   icon: "◈" },
  { id: "clients",   label: "Clients",    icon: "👥" },
  { id: "jobs",      label: "Jobs",       icon: "⚙" },
  { id: "whatsapp",  label: "WhatsApp",   icon: "💬" },
  { id: "contacts",  label: "Contacts",   icon: "📋" },
  { id: "team",      label: "Team",       icon: "🔑" },
]

function Sidebar({ tab, setTab, user, onLogout }: {
  tab: Tab; setTab: (t: Tab) => void; user: AdminUser; onLogout: () => void
}) {
  return (
    <aside className="w-56 bg-slate-800 flex flex-col border-r border-white/10 shrink-0">
      <div className="px-5 py-4 border-b border-white/10">
        <p className="text-white font-bold text-sm">AI Platform</p>
        <p className="text-slate-400 text-xs mt-0.5">Operations Hub</p>
      </div>
      <nav className="flex-1 py-3 px-2 flex flex-col gap-1">
        {NAV.filter(n => n.id !== "team" || user.role === "owner").map(n => (
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

// ── Overview tab ──────────────────────────────────────────────────────────

function OverviewTab({ token, clients, jobs, conversations }: {
  token: string; clients: Client[]; jobs: Job[]; conversations: Conversation[]
}) {
  const totalTokens = jobs.reduce((s, j) => s + (j.tokens_used ?? 0), 0)
  const doneJobs    = jobs.filter(j => j.status === "done").length

  const stats = [
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
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
  const [tab, setTab]                 = useState<Tab>("overview")
  const [clients, setClients]         = useState<Client[]>([])
  const [allJobs, setAllJobs]         = useState<Job[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("jwt")
    if (!saved) return
    apiFetch(saved, "/auth/me")
      .then(u => { setToken(saved); setUser(u) })
      .catch(() => localStorage.removeItem("jwt"))
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

  function handleLogin(t: string, u: AdminUser) {
    setToken(t); setUser(u)
  }

  function handleLogout() {
    localStorage.removeItem("jwt")
    setToken(null); setUser(null); setClients([]); setAllJobs([]); setConversations([])
  }

  if (!token || !user) return <LoginScreen onLogin={handleLogin} />

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      <Sidebar tab={tab} setTab={setTab} user={user} onLogout={handleLogout} />
      <main className="flex-1 p-6 overflow-y-auto">
        {tab === "overview"  && <OverviewTab token={token} clients={clients} jobs={allJobs} conversations={conversations} />}
        {tab === "clients"   && <ClientsTab token={token} clients={clients} reload={() => loadClients(token)} />}
        {tab === "jobs"      && <JobsTab token={token} clients={clients} />}
        {tab === "whatsapp"  && <WhatsAppTab token={token} clients={clients} />}
        {tab === "contacts"  && <ContactsTab token={token} clients={clients} />}
        {tab === "team"      && user.role === "owner" && <TeamTab token={token} />}
      </main>
    </div>
  )
}
