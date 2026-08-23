const PAGES = [
  { href: "/chat", label: "Chat", note: "Memory-aware conversation + model routing" },
  { href: "/studio", label: "Creative Studio", note: "Campaigns, brand, image/video APIs" },
  { href: "/sales", label: "Sales", note: "CRM connectors (HubSpot / Salesforce)" },
  { href: "/login", label: "Login", note: "Optional auth for multi-user deployments" },
];

const API_ROUTES = [
  "/api/health",
  "/api/status",
  "/api/models?probe=1",
  "/api/v1/chat/completions",
  "/api/chat",
  "/api/memory",
  "/api/orchestrate",
  "/api/brand",
  "/api/images",
  "/api/video",
  "/api/campaigns",
  "/api/social",
  "/api/crm",
  "/api/billing",
  "/api/orgs",
  "/api/packs",
  "/api/factory",
  "/api/knowledge",
  "/api/repo",
  "/api/exec",
  "/api/audit",
  "/api/metrics",
];

export default function HomePage() {
  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 720,
        margin: "0 auto",
        padding: "3rem 1.5rem",
      }}
    >
      <h1 style={{ marginBottom: "0.35rem" }}>SUPERIOR AI</h1>
      <p style={{ color: "#94a3b8", marginTop: 0 }}>
        One AI. An entire team behind it. — Production-oriented multi-model platform.
      </p>

      <p>
        Foundations now include a working <a href="/chat">/chat</a> UI wired to durable
        memory and the model gateway. Models are only marked AVAILABLE after a live health
        check (<code>GET /api/models?probe=1</code>). The orchestrator can plan safely by
        default, or synthesize with a real model when <code>mode=execute</code>.
      </p>

      <h2>Pages</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {PAGES.map((p) => (
          <li
            key={p.href}
            style={{
              marginBottom: "0.75rem",
              padding: "0.75rem 1rem",
              background: "#12151c",
              border: "1px solid #1e2430",
              borderRadius: 8,
            }}
          >
            <a href={p.href} style={{ fontWeight: 600, fontSize: 15 }}>
              {p.label}
            </a>
            <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
              <code>{p.href}</code> — {p.note}
            </div>
          </li>
        ))}
      </ul>

      <h2>API routes</h2>
      <ul>
        {API_ROUTES.map((route) => (
          <li key={route} style={{ marginBottom: 4 }}>
            <code>{route}</code>
          </li>
        ))}
      </ul>

      <p style={{ color: "#64748b", fontSize: 13, marginTop: "2rem" }}>
        No fabricated metrics, contacts, or generation results. Configure provider keys in{" "}
        <code>.env</code> to activate models.
      </p>
    </main>
  );
}
