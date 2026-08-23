"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("owner");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ok">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      setStatus("ok");
      setMessage(`Signed in as ${data.user.email} (${data.user.role}).`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 420, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1>Sign in</h1>
      <p style={{ color: "#64748b", fontSize: 14 }}>
        Dev-mode session login. In production with <code>OIDC_ISSUER_URL</code> set, this exchanges for a real OIDC
        flow instead.
      </p>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem", marginTop: "1.5rem" }}>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            style={{ padding: "0.5rem", border: "1px solid #cbd5e1", borderRadius: 6 }}
          />
        </label>
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ padding: "0.5rem", border: "1px solid #cbd5e1", borderRadius: 6 }}
          >
            <option value="owner">owner</option>
            <option value="admin">admin</option>
            <option value="member">member</option>
            <option value="viewer">viewer</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={status === "loading"}
          style={{ padding: "0.6rem", borderRadius: 6, border: "none", background: "#0a0a0a", color: "#e2e8f0" }}
        >
          {status === "loading" ? "Signing in..." : "Sign in"}
        </button>
      </form>
      {message && (
        <p style={{ marginTop: "1rem", color: status === "error" ? "#dc2626" : "#16a34a" }}>{message}</p>
      )}
    </main>
  );
}
