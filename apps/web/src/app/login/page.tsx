"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@superior.local");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<string>("");

  async function loadMode() {
    const res = await fetch("/api/auth");
    const data = await res.json();
    setMode(data.mode);
  }

  useState(() => {
    loadMode();
  });

  async function devLogin() {
    setError(null);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: "owner" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Login failed");
      return;
    }
    setToken(data.token);
    if (typeof window !== "undefined") {
      localStorage.setItem("superior_token", data.token);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[var(--card)] border border-[var(--card-border)] space-y-6">
        <div>
          <Link href="/" className="text-xs text-zinc-500 hover:text-white">
            ← SUPERIOR AI
          </Link>
          <p className="text-sm text-zinc-400 mb-4">Sign-in is optional for local single-user use. Open the workspace to start immediately.</p>
      <h1 className="text-2xl font-semibold mt-2">Sign in</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Mode: <span className="text-indigo-300">{mode || "…"}</span>
          </p>
        </div>

        {mode === "oidc" ? (
          <div className="space-y-3 text-sm text-zinc-300">
            <p>OIDC is configured. Use your identity provider:</p>
            <a
              href="/api/auth/oidc/login"
              className="block text-center px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium"
            >
              Continue with SSO
            </a>
            <p className="text-xs text-zinc-500">
              Wire NextAuth/Auth.js providers with AUTH_OIDC_ISSUER, CLIENT_ID, CLIENT_SECRET.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="text-xs text-zinc-500">Email (dev auth)</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm"
            />
            <button
              onClick={devLogin}
              className="w-full px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium"
            >
              Dev sign in
            </button>
            <p className="text-xs text-zinc-500">
              Set AUTH_OIDC_ISSUER + AUTH_OIDC_CLIENT_ID to enable SSO in production.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
        {token && (
          <div className="text-xs text-emerald-400 break-all">
            Session created. Token stored in localStorage as superior_token.
            <div className="mt-2">
              <Link href="/chat" className="text-indigo-400 hover:underline">
                Open Command Center →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
