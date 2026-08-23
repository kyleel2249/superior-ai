const API_ROUTES = [
  "/api/health",
  "/api/status",
  "/api/v1/chat/completions",
  "/api/images",
  "/api/video",
  "/api/social",
  "/api/crm",
  "/api/billing",
  "/api/orgs",
  "/api/packs",
  "/api/factory",
  "/api/orchestrate",
  "/api/knowledge",
  "/api/repo",
  "/api/exec",
  "/api/audit",
  "/api/metrics",
];

export default function HomePage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1>SUPERIOR AI</h1>
      <p>
        This is a minimal placeholder home page. The README lists <code>/chat</code>, <code>/workspace</code>,{" "}
        <code>/studio</code>, <code>/admin/packs</code>, and <code>/publisher</code> as key routes, but none of those
        pages exist in the repo yet — only the API layer below is wired up so far.
      </p>
      <h2>Available API routes</h2>
      <ul>
        {API_ROUTES.map((route) => (
          <li key={route}>
            <code>{route}</code>
          </li>
        ))}
      </ul>
    </main>
  );
}
