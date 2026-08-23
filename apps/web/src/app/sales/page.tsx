const CAPABILITIES = [
  { route: "GET /api/crm", desc: "List configured CRM providers (HubSpot, Salesforce)." },
  { route: "POST /api/crm { action: \"test\" }", desc: "Verify a CRM connector's credentials against the live provider API." },
  { route: "POST /api/crm { action: \"upsert_contact\" }", desc: "Create or update a lead/contact record in the connected CRM." },
  { route: "POST /api/crm { action: \"create_deal\" }", desc: "Create a deal/opportunity in the pipeline." },
];

export default function SalesPage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1>Sales &amp; Pipeline</h1>
      <p>
        Leads and pipeline moves go through official CRM APIs only — no invented contacts or deal data. Connect a
        HubSpot or Salesforce credential via environment variables to enable the connector below.
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
