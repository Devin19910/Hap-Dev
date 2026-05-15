"use client"
import { useState, useEffect } from "react"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export default function LoginPage() {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (localStorage.getItem("jwt")) window.location.replace("/dashboard")
  }, [])

  async function submit() {
    if (!email || !password) { setError("Enter your email and password"); return }
    setLoading(true); setError("")
    try {
      const body = new URLSearchParams({ username: email, password })
      const r = await fetch(`${API}/auth/token`, { method: "POST", body })
      if (!r.ok) {
        const e = await r.json()
        setError(e.detail ?? "Incorrect email or password")
        return
      }
      const { access_token } = await r.json()
      localStorage.setItem("jwt", access_token)
      window.location.replace("/dashboard")
    } catch {
      setError("Cannot reach server — is the backend running?")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-sm flex flex-col gap-5 shadow-xl">

        <div>
          <h1 className="text-white font-bold text-2xl">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your Nexora dashboard.</p>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Email address</label>
            <input
              className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="you@yourbusiness.com"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-400">Password</label>
              <a href="/forgot-password" className="text-xs text-sky-400 hover:text-sky-300">Forgot password?</a>
            </div>
            <input
              className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Your password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
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
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div className="text-center">
          <span className="text-slate-500 text-sm">Don&apos;t have an account? </span>
          <a href="/register" className="text-sky-400 text-sm hover:text-sky-300">
            Start free trial
          </a>
        </div>

      </div>
    </div>
  )
}
