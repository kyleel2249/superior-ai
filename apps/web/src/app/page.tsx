const PAGES = ["/login", "/studio", "/sales"];

const API_ROUTES = [
  "/api/health",
  "/api/status",
  "/api/models",
  "/api/v1/chat/completions",
  "/api/chat",
  "/api/memory",
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
        The README lists <code>/chat</code>, <code>/workspace</code>, <code>/studio</code>,{" "}
        <code>/admin/packs</code>, and <code>/publisher</code> as key routes. <code>/login</code>,{" "}
        <code>/studio</code>, and <code>/sales</code> exist below; <code>/chat</code>, <code>/workspace</code>,{" "}
        <code>/admin/packs</code>, and <code>/publisher</code> still don&apos;t have dedicated pages — only the API
        layer they&apos;d call is wired up so far.
      </p>
      <h2>Pages</h2>
      <ul>
        {PAGES.map((route) => (
          <li key={route}>
            <a href={route}>
              <code>{route}</code>
            </a>
          </li>
        ))}
      </ul>
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
