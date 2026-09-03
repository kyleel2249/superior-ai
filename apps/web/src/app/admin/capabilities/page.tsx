"use client";

interface Capability {
  name: string;
  description: string;
  detail: string;
  href?: string;
}

interface Category {
  title: string;
  color: string;
  glow: string;
  items: Capability[];
}

const CATEGORIES: Category[] = [
  {
    title: "AI Model Layer",
    color: "#6366f1",
    glow: "card-glow--indigo",
    items: [
      {
        name: "Multi-provider model gateway",
        description: "Routes requests across OpenAI, Anthropic, xAI, Google, OpenRouter, Azure OpenAI, and local inference.",
        detail: "Each provider is a real adapter, not a mock. A model with no configured key returns CONFIGURATION_REQUIRED rather than a fabricated response, and provider keys can now be added directly from the Providers page without editing environment variables.",
        href: "/admin/providers",
      },
      {
        name: "Model discovery & benchmarking",
        description: "Live model listing per provider, plus a golden-task benchmark suite for comparing models.",
        detail: "Discovery makes a real API call to list available models. Benchmarks run actual prompts against actual models — results are stored and comparable over time, not simulated.",
      },
      {
        name: "Health monitoring & sandboxing",
        description: "Tracks real latency/error health per provider and gates new model versions through sandbox checks before promotion.",
        detail: "Health scores come from real request outcomes. A model can be promoted from sandbox to production only after passing defined checks.",
      },
    ],
  },
  {
    title: "Agents & Orchestration",
    color: "#38bdf8",
    glow: "card-glow--cyan",
    items: [
      {
        name: "Agent framework & templates",
        description: "A runtime for defining, instantiating, and cloning agent instances from reusable templates.",
        detail: "Agent instances get unique, collision-safe IDs. Templates can be cloned into new instances without redefining behavior from scratch.",
      },
      {
        name: "Code review agent",
        description: "Heuristic scanner for security, bug, performance, accessibility, and SEO issues in code — plus safe auto-fixes.",
        detail: "Catches real patterns: eval(), hardcoded secrets, innerHTML assignment, empty catch blocks, loose equality. Auto-fixes are re-scanned to verify they actually resolved the finding before being reported as fixed.",
      },
      {
        name: "Job queue with priority scheduling",
        description: "A bounded worker pool that processes background jobs (orchestration, audits, embeddings) in true priority order.",
        detail: "Concurrency is capped so priority ordering actually holds under load. Failed jobs retry automatically up to a configurable limit, then surface the real error.",
        href: "/admin/queue",
      },
    ],
  },
  {
    title: "Memory & Knowledge",
    color: "#34d399",
    glow: "card-glow--emerald",
    items: [
      {
        name: "Lexical RAG",
        description: "Chunking, keyword-overlap retrieval, and context building over ingested documents.",
        detail: "Returns an empty context rather than fabricating an answer when nothing in the corpus matches the query.",
      },
      {
        name: "Citation engine",
        description: "Matches claims to real provided sources and marks unsupported claims as unsupported.",
        detail: "Every citation traces back to an actual source in the input set — nothing is invented, and weak-overlap claims are explicitly flagged rather than force-cited.",
      },
      {
        name: "Contradiction detection",
        description: "Flags pairs of sources with opposing sentiment on the same topic, across every pair, not just adjacent ones.",
        detail: "Useful for research workflows where conflicting sources need surfacing before synthesis, not silent averaging.",
      },
    ],
  },
  {
    title: "Sales & Growth",
    color: "#fbbf24",
    glow: "card-glow--amber",
    items: [
      {
        name: "Lead scoring & qualification",
        description: "Weighted fit/intent/engagement scoring with an explicit qualification threshold (fit ≥ 50 and intent ≥ 40).",
        detail: "A lead is never marked qualified on fit or intent alone — both gates must clear, which is enforced in code and covered by tests.",
        href: "/admin/sales",
      },
      {
        name: "Growth experiment engine",
        description: "Generates structured A/B experiment proposals (headline, UGC, CTA, SEO) with hypotheses and variants.",
        detail: "Every experiment gets a collision-safe id even when multiple proposals are generated in the same millisecond.",
        href: "/admin/growth",
      },
      {
        name: "Autopilot permission tiers",
        description: "Four tiers (assist, recommend, semi-autonomous, autonomous) gate which actions an agent can take unsupervised.",
        detail: "Only the fully autonomous tier can send campaigns or schedule meetings — every other tier requires a human in the loop.",
      },
    ],
  },
  {
    title: "Customer Experience",
    color: "#f472b6",
    glow: "card-glow--fuchsia",
    items: [
      {
        name: "Support ticket routing",
        description: "Real sentiment detection (angry/urgent/confused/etc.) and role-based routing, with auto-escalation.",
        detail: "Angry or urgent tickets are automatically escalated to complaint resolution — this isn't a label, it changes the ticket's actual status and assignment.",
        href: "/admin/support",
      },
      {
        name: "Voice of Customer analysis",
        description: "Theme detection across pasted feedback, with retention risks and opportunities surfaced by sentiment.",
        detail: "NPS and CSAT scores always stay null with an explanatory note — they are never estimated from free text, only from real survey data.",
        href: "/admin/voc",
      },
      {
        name: "Trend alerts",
        description: "Flags a support trend once three or more tickets share a similar subject.",
        detail: "A single complaint never triggers an alert — this requires a real repeated pattern.",
      },
    ],
  },
  {
    title: "Business Intelligence",
    color: "#fb7185",
    glow: "card-glow--amber",
    items: [
      {
        name: "AI Workforce P&L",
        description: "Cost vs. estimated labor-value rollup, broken down by department, from real recorded task economics.",
        detail: "Labor value uses a clearly labeled $75/hr proxy and the whole report carries an explicit 'illustrative, not audited' disclaimer.",
        href: "/admin/pnl",
      },
      {
        name: "Competitor intelligence",
        description: "Structured competitor profiles and feature comparison tables.",
        detail: "Unobserved dimensions are marked 'Not observed publicly' rather than filled with plausible-sounding guesses. Traffic estimates stay explicitly 'Unknown' until real data is integrated.",
      },
      {
        name: "Product concept scoring",
        description: "Heuristic opportunity/demand/competition/execution-difficulty scoring for new product ideas, plus bull/bear investment cases.",
        detail: "Every investment case carries a 'not investment, legal, or financial advice' disclaimer and lists its own key risks and assumptions.",
      },
    ],
  },
  {
    title: "Security & Compliance",
    color: "#a78bfa",
    glow: "card-glow--indigo",
    items: [
      {
        name: "Role-based access control",
        description: "Four roles (owner, admin, member, viewer) with an explicit permission matrix — no implicit wildcard grants except for owner.",
        detail: "Denied by default: an action not explicitly listed for a role is refused, even for otherwise-privileged roles.",
      },
      {
        name: "Encryption & secret handling",
        description: "AES-256-GCM encryption for stored secrets (provider keys), with a clearly labeled plaintext fallback only when no encryption key is configured.",
        detail: "Tampered ciphertext fails to decrypt rather than silently returning garbage — verified by authentication-tag checks.",
      },
      {
        name: "GDPR data subject request tracking",
        description: "30-day SLA tracking for access/erasure/portability/rectification requests, with an approval-gated erasure plan.",
        detail: "Every erasure step requires explicit approval — there is no auto-delete path.",
      },
      {
        name: "SOC2 evidence readiness",
        description: "Tracks how complete your compliance evidence pack is — never claims certification.",
        detail: "This measures template completion against a checklist, not an audit outcome. A real SOC2 certification requires an actual third-party auditor.",
        href: "/admin/compliance",
      },
      {
        name: "Audit log",
        description: "Append-only ring buffer of security-relevant events — logins, config changes, privileged actions.",
        detail: "Filterable by actor, organization, and action prefix; requires an authenticated session to read in production.",
        href: "/admin/audit",
      },
    ],
  },
  {
    title: "Platform Foundation",
    color: "#22d3ee",
    glow: "card-glow--cyan",
    items: [
      {
        name: "Feature flags & config",
        description: "Env-driven feature flags with a real cache and explicit opt-in/opt-out semantics per flag.",
        detail: "Some flags default on and require an explicit '0' to disable; others default off and require an explicit '1' to enable — this is intentional per-flag, not accidental inconsistency.",
        href: "/admin/foundation",
      },
      {
        name: "Object storage",
        description: "Filesystem-backed storage with path-traversal protection.",
        detail: "Keys are sanitized against '..' segments, leading slashes, and null bytes before ever touching the filesystem.",
      },
      {
        name: "TTL cache",
        description: "In-memory cache with expiry and a bounded FIFO eviction policy.",
        detail: "Reading an expired key purges it as a side effect, so stats always reflect only live entries.",
      },
      {
        name: "Command palette",
        description: "⌘K / Ctrl+K to jump to any feature in this admin area.",
        detail: "Respects your saved preference — if you've turned it off, the shortcut does nothing.",
      },
    ],
  },
];

export default function CapabilitiesPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-10">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-bold text-gradient">Capabilities &amp; Features</h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
          What this platform actually does, organized by subsystem. Every capability below is
          real, implemented code you can exercise from the admin pages linked throughout — not
          marketing copy. Where a capability is intentionally limited (never fabricating a score,
          never claiming certification), that limit is called out explicitly.
        </p>
      </div>

      {CATEGORIES.map((cat, ci) => (
        <div key={cat.title} className="animate-fade-up" style={{ animationDelay: `${ci * 60}ms` }}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: cat.color }} />
            {cat.title}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {cat.items.map((item, i) => {
              const Wrapper = item.href ? "a" : "div";
              return (
                <Wrapper
                  key={item.name}
                  {...(item.href ? { href: item.href } : {})}
                  className={`card-glow ${cat.glow} rounded-xl p-5 block animate-fade-up ${
                    item.href ? "hover:brightness-110 transition cursor-pointer" : ""
                  }`}
                  style={{ animationDelay: `${ci * 60 + i * 40}ms` }}
                >
                  <div className="text-sm font-semibold text-white mb-1">{item.name}</div>
                  <p className="text-xs text-zinc-400 mb-2 leading-relaxed">{item.description}</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed border-t border-white/5 pt-2">
                    {item.detail}
                  </p>
                  {item.href && (
                    <div className="text-[11px] mt-2" style={{ color: cat.color }}>
                      Open →
                    </div>
                  )}
                </Wrapper>
              );
            })}
          </div>
        </div>
      ))}

      <div className="card-glow card-glow--intense rounded-2xl p-6 animate-fade-up">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-2">
          Design principle behind all of it
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Every subsystem above follows the same rule: when real data or a real capability isn&apos;t
          available, the system says so explicitly — <code className="chip">CONFIGURATION_REQUIRED</code>,
          {" "}<code className="chip">Unknown</code>, a null score with a note — rather than
          generating something plausible-looking. That&apos;s slower to demo but means what you see
          in these dashboards is what&apos;s actually true of your data and your configuration.
        </p>
      </div>
    </div>
  );
}
