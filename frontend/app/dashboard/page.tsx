"use client"
import { useEffect, useState } from "react"

const API = "http://localhost:8000"

type Client = { id: string; name: string; email: string; is_active: boolean }
type Sub = { tier: string; monthly_limit: number; requests_used: number; remaining: number }

export default function Dashboard() {
  const [apiKey, setApiKey] = useState("")
  const [authed, setAuthed] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [selected, setSelected] = useState<Client | null>(null)
  const [sub, setSub] = useState<Sub | null>(null)
  const [prompt, setPrompt] = useState("")
  const [provider, setProvider] = useState("claude")
  const [result, setResult] = useState("")
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newTier, setNewTier] = useState("free")

  function getHeaders(key: string) {
    return { "x-api-key": key, "Content-Type": "application/json" }
  }

  async function loadClients(key: string) {
    const r = await fetch(`${API}/clients`, { headers: getHeaders(key) })
    if (r.ok) setClients(await r.json())
  }

  async function loadSub(id: string) {
    const r = await fetch(`${API}/subscriptions/${id}`, { headers: getHeaders(apiKey) })
    if (r.ok) setSub(await r.json())
  }

  async function login() {
    if (!apiKey.trim()) { setLoginError("Please enter your API key"); return }
    setLoginLoading(true)
    setLoginError("")
    try {
      const r = await fetch(`${API}/clients`, { headers: getHeaders(apiKey) })
      if (r.ok) {
        const data = await r.json()
        setClients(data)
        setAuthed(true)
      } else if (r.status === 401) {
        setLoginError("Invalid API key")
      } else {
        setLoginError(`Server error: ${r.status}`)
      }
    } catch {
      setLoginError("Cannot reach backend at " + API + " — is Docker running?")
    } finally {
      setLoginLoading(false)
    }
  }

  async function createClient() {
    const r = await fetch(`${API}/clients`, {
      method: "POST",
      headers: getHeaders(apiKey),
      body: JSON.stringify({ name: newName, email: newEmail, tier: newTier }),
    })
    if (r.ok) { setNewName(""); setNewEmail(""); loadClients(apiKey) }
  }

  async function runAI() {
    if (!selected) return
    setLoading(true); setResult("")
    const r = await fetch(`${API}/ai/complete`, {
      method: "POST",
      headers: getHeaders(apiKey),
      body: JSON.stringify({ client_id: selected.id, prompt, provider }),
    })
    const data = await r.json()
    setResult(r.ok ? data.text : JSON.stringify(data))
    setLoading(false)
    loadSub(selected.id)
  }

  useEffect(() => { if (selected) loadSub(selected.id) }, [selected])

  if (!authed) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-2xl w-80 flex flex-col gap-4">
        <h1 className="text-white font-bold text-xl">Operator Dashboard</h1>
        <input
          className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          placeholder="Enter API secret key"
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          onKeyDown={e => e.key === "Enter" && login()}
        />
        {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
        <button
          onClick={login}
          disabled={loginLoading}
          className="bg-sky-500 text-white rounded-lg py-2 font-semibold hover:bg-sky-400 transition disabled:opacity-50"
        >
          {loginLoading ? "Checking..." : "Login"}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 p-4 flex flex-col gap-2 border-r border-white/10">
        <h2 className="font-bold text-lg mb-2">Clients</h2>
        {clients.map(c => (
          <button
            key={c.id}
            onClick={() => setSelected(c)}
            className={`text-left px-3 py-2 rounded-lg text-sm transition ${selected?.id === c.id ? "bg-sky-500" : "hover:bg-slate-700"}`}
          >
            {c.name}
            <span className="block text-xs opacity-60">{c.email}</span>
          </button>
        ))}

        {/* Add client */}
        <div className="mt-auto border-t border-white/10 pt-4 flex flex-col gap-2">
          <p className="text-xs text-white/50 font-semibold uppercase">Add Client</p>
          <input className="bg-slate-700 rounded px-2 py-1 text-sm" placeholder="Name" value={newName} onChange={e => setNewName(e.target.value)} />
          <input className="bg-slate-700 rounded px-2 py-1 text-sm" placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
          <select className="bg-slate-700 rounded px-2 py-1 text-sm" value={newTier} onChange={e => setNewTier(e.target.value)}>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
          </select>
          <button onClick={createClient} className="bg-sky-500 rounded py-1 text-sm font-semibold hover:bg-sky-400 transition">
            Create
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 flex flex-col gap-6">
        {selected ? (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{selected.name}</h1>
                <p className="text-white/50 text-sm">{selected.email}</p>
              </div>
              {sub && (
                <div className="bg-slate-800 rounded-xl px-4 py-3 text-sm">
                  <span className="font-semibold capitalize">{sub.tier}</span> plan ·{" "}
                  <span className="text-sky-400">{sub.requests_used} / {sub.monthly_limit}</span> requests used ·{" "}
                  <span className="text-green-400">{sub.remaining} remaining</span>
                </div>
              )}
            </div>

            {/* AI Playground */}
            <div className="bg-slate-800 rounded-2xl p-6 flex flex-col gap-4">
              <h2 className="font-semibold text-lg">AI Playground</h2>
              <div className="flex gap-3">
                {["claude", "openai", "gemini"].map(p => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition capitalize ${provider === p ? "bg-sky-500" : "bg-slate-700 hover:bg-slate-600"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <textarea
                className="bg-slate-700 rounded-xl p-3 text-sm min-h-24 resize-none"
                placeholder="Enter your prompt..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              />
              <button
                onClick={runAI}
                disabled={loading || !prompt}
                className="bg-sky-500 hover:bg-sky-400 disabled:opacity-50 transition rounded-xl py-2 font-semibold"
              >
                {loading ? "Running..." : "Run Automation"}
              </button>
              {result && (
                <div className="bg-slate-700 rounded-xl p-4 text-sm whitespace-pre-wrap">{result}</div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/30">
            Select a client to get started
          </div>
        )}
      </main>
    </div>
  )
}
