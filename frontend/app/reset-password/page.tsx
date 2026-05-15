"use client"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function ResetForm() {
  const params               = useSearchParams()
  const token                = params.get("token") ?? ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm]   = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const [done, setDone]         = useState(false)

  useEffect(() => {
    if (!token) setError("Invalid reset link — please request a new one.")
  }, [token])

  async function submit() {
    setError("")
    if (!password || !confirm) { setError("Enter and confirm your new password"); return }
    if (password !== confirm)  { setError("Passwords do not match"); return }
    if (password.length < 6)   { setError("Password must be at least 6 characters"); return }
    setLoading(true)
    try {
      const r = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      })
      if (!r.ok) {
        const e = await r.json()
        setError(e.detail ?? "Something went wrong")
        return
      }
      setDone(true)
    } catch {
      setError("Cannot reach server — try again shortly")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-sm flex flex-col gap-5 shadow-xl">

        {done ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-2xl">✓</div>
            <div>
              <h1 className="text-white font-bold text-xl">Password updated</h1>
              <p className="text-slate-400 text-sm mt-1">You can now sign in with your new password.</p>
            </div>
            <a
              href="/login"
              className="w-full block text-center bg-sky-500 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-sky-400 transition"
            >
              Sign in
            </a>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-white font-bold text-2xl">Set new password</h1>
              <p className="text-slate-400 text-sm mt-1">Choose a strong password for your account.</p>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">New password</label>
                <input
                  className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="At least 6 characters"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Confirm password</label>
                <input
                  className="bg-slate-700 text-white rounded-lg px-3 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Repeat your password"
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
              disabled={loading || !token}
              className="bg-sky-500 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-sky-400 transition disabled:opacity-50"
            >
              {loading ? "Saving…" : "Set new password"}
            </button>

            <div className="text-center">
              <a href="/login" className="text-sky-400 text-sm hover:text-sky-300">← Back to sign in</a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  )
}
