const PAGES = [
  { href: "/chat", label: "Command Center", note: "Chat · Orchestrate · Research (memory + RAG)" },
  { href: "/studio", label: "Creative Studio", note: "Campaigns, brand, image/video APIs" },
  { href: "/sales", label: "Sales", note: "CRM connectors (HubSpot / Salesforce)" },
  { href: "/login", label: "Login", note: "Optional auth for multi-user deployments" },
];

const API_ROUTES = [
  "/api/health",
  "/api/status",
  "/api/models?probe=1",
  "/api/chat",
  "/api/orchestrate",
  "/api/research",
  "/api/memory",
  "/api/knowledge",
  "/api/factory",
  "/api/brand",
  "/api/images",
  "/api/video",
  "/api/campaigns",
  "/api/social",
  "/api/crm",
  "/api/repo",
  "/api/exec",
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
        One AI. An entire team behind it.
      </p>
      <p>
        Use the <a href="/chat">Command Center</a> for memory-aware chat, multi-agent
        orchestration (plan → synthesis), and research with real URL fetches and citations.
        Models are AVAILABLE only after a live health check.
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
      <h2>API</h2>
      <ul>
        {API_ROUTES.map((route) => (
          <li key={route} style={{ marginBottom: 4 }}>
            <code>{route}</code>
          </li>
        ))}
      </ul>
      <p style={{ color: "#64748b", fontSize: 13, marginTop: "2rem" }}>
        No fabricated metrics, contacts, citations, or generation results.
      </p>
    </main>
  );
}
