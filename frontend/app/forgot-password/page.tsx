"use client"
import { useState } from "react"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export default function ForgotPasswordPage() {
  const [step, setStep]         = useState<"email" | "sent">("email")
  const [email, setEmail]       = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")

  async function submit() {
    if (!email) { setError("Enter your email address"); return }
    setLoading(true); setError("")
    try {
      await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      // Always show "sent" — don't reveal whether email exists
      setStep("sent")
    } catch {
      setError("Cannot reach server — try again shortly")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-sm flex flex-col gap-5 shadow-xl">

        {step === "email" ? (
          <>
            <div>
              <h1 className="text-white font-bold text-2xl">Reset your password</h1>
              <p className="text-slate-400 text-sm mt-1">
                Enter your email and we will send you a reset link.
              </p>
            </div>

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

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="bg-sky-500 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-sky-400 transition disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>

            <div className="text-center">
              <a href="/login" className="text-sky-400 text-sm hover:text-sky-300">
                ← Back to sign in
              </a>
            </div>
          </>
        ) : (
          <>
            <div className="text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-2xl">
                ✓
              </div>
              <div>
                <h1 className="text-white font-bold text-xl">Check your email</h1>
                <p className="text-slate-400 text-sm mt-1">
                  If <span className="text-white">{email}</span> is registered, you will receive a reset link shortly.
                </p>
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-400 leading-relaxed">
              Did not get an email? Contact your Nexora operator — they can reset your password directly from the admin dashboard.
            </div>

            <a
              href="/login"
              className="block text-center bg-sky-500 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-sky-400 transition"
            >
              Back to sign in
            </a>
          </>
        )}
      </div>
    </div>
  )
}
