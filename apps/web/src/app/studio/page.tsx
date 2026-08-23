const CAPABILITIES = [
  { route: "POST /api/campaigns", desc: "Plan a campaign: storyboard, targeting, and calls to action for a product/audience." },
  { route: "POST /api/video", desc: "Attempt media generation for a storyboard against a configured video provider." },
  { route: "POST /api/brand", desc: "Generate letterform/logo mark concepts, palette, and brand guide notes for a name." },
  { route: "POST /api/images", desc: "Attempt image generation against a configured image provider." },
];

export default function StudioPage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1>Creative Studio</h1>
      <p>
        Plan campaigns, generate brand marks, and produce creative assets. This studio is a thin UI over the
        creative, brand, and media-generation APIs — nothing here fabricates results: media-generation calls report
        honestly when a provider isn&apos;t configured instead of inventing a URL.
      </p>
      <h2>Available capabilities</h2>
      <ul>
        {CAPABILITIES.map((c) => (
          <li key={c.route} style={{ marginBottom: "0.75rem" }}>
            <code>{c.route}</code>
            <br />
            <span style={{ color: "#64748b", fontSize: 14 }}>{c.desc}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
