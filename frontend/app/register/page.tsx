"use client"
import { useState } from "react"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

const BUSINESS_TYPES = [
  { value: "general",     label: "General Business" },
  { value: "salon",       label: "Salon / Barbershop" },
  { value: "clinic",      label: "Clinic / Dentist" },
  { value: "gym",         label: "Gym / Fitness" },
  { value: "immigration", label: "Immigration Consultant" },
  { value: "plumber",     label: "Plumber / Plumbing" },
  { value: "trucking",    label: "Trucking Company" },
  { value: "restaurant",  label: "Restaurant / Cafe" },
  { value: "other",       label: "Other" },
]

export default function RegisterPage() {
  const [name, setName]         = useState("")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm]   = useState("")
  const [bType, setBType]       = useState("general")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  async function submit() {
    setError("")
    if (!name || !email || !password) { setError("All fields are required"); return }
    if (password !== confirm) { setError("Passwords do not match"); return }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return }

    setLoading(true)
    try {
      const r = await fetch(`${API}/tenants/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: name,
          email,
          password,
          business_type: bType,
        }),
      })
      const data = await r.json()
      if (!r.ok) { setError(data.detail ?? "Registration failed"); return }

      // Auto-login: store token and redirect to dashboard
      localStorage.setItem("jwt", data.access_token)
      window.location.href = "/dashboard"
    } catch {
      setError("Cannot reach server — is the backend running?")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md flex flex-col gap-5 shadow-xl">
        <div>
          <h1 className="text-white font-bold text-2xl">Start your free trial</h1>
          <p className="text-slate-400 text-sm mt-1">
            Set up your Nexora workspace in 30 seconds.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Business name</label>
            <input
              className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="e.g. Sunshine Salon"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Business type</label>
            <select
              className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full"
              value={bType}
              onChange={e => setBType(e.target.value)}
            >
              {BUSINESS_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email address</label>
            <input
              className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="you@yourbusiness.com"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Password</label>
            <input
              className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="At least 8 characters"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Confirm password</label>
            <input
              className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Repeat password"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
            />
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="bg-sky-500 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-sky-400 transition disabled:opacity-50"
        >
          {loading ? "Creating workspace…" : "Create free account"}
        </button>

        <div className="text-center">
          <span className="text-slate-500 text-sm">Already have an account? </span>
          <a href="/login" className="text-sky-400 text-sm hover:text-sky-300">Sign in</a>
        </div>

        <p className="text-slate-600 text-xs text-center">
          Free plan includes 50 AI requests/month. No credit card required.
        </p>
      </div>
    </div>
  )
}
