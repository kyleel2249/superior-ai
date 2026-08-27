import Link from "next/link";
import { GlowCard } from "@/components/GlowUI";

/**
 * AppShell (layout.tsx) already renders the site-wide nav/header, theme
 * toggle, and command palette for every page — this page only owns its
 * own hero + feature content, not a second header.
 */

const HERO_LINKS = [
  { href: "/workspace", label: "Open Workspace", primary: true },
  { href: "/chat", label: "Chat", primary: false },
  { href: "/studio", label: "Creative Studio", primary: true },
  { href: "/sales", label: "Sales", primary: false },
  { href: "/competitors", label: "War Room", primary: false },
  { href: "/ceo", label: "CEO Center", primary: false },
  { href: "/marketing", label: "Marketing", primary: false },
  { href: "/seo", label: "SEO", primary: false },
  { href: "/daily", label: "Daily Intel", primary: false },
  { href: "/dashboard", label: "KPI Dashboard", primary: false },
  { href: "/brand", label: "Brand Studio", primary: false },
  { href: "/publisher", label: "Publish", primary: false },
  { href: "/admin/overview", label: "Admin", primary: false },
  { href: "/admin/packs", label: "Packs", primary: false },
  { href: "/login", label: "Login", primary: false },
];

const FEATURES = [
  { t: "Autonomous Media Studio", b: "UGC, skits, storyboards, multi-platform variants, realism controls, honest resolution labels.", variant: "fuchsia" as const },
  { t: "SEO + Traffic Intelligence", b: "Keyword clusters, content factory, audits, competitor SEO — no guaranteed rankings.", variant: "cyan" as const },
  { t: "Competitor War Room", b: "Public research, scorecards, traffic shells with provenance and confidence.", variant: "amber" as const },
  { t: "Sales Autopilot", b: "Leads, scoring, outreach drafts, funnel, CRM-ready — approval-gated sends.", variant: "emerald" as const },
  { t: "Full Business Council", b: "CEO → Creative → Sales → Finance → Customer… department-to-department collaboration.", variant: "indigo" as const },
  { t: "Master Growth Loop", b: "Research → Creative → Campaign → Leads → Close → Retain → Optimize.", variant: "fuchsia" as const },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-12 text-center animate-fade-up">
          <p className="text-indigo-400 text-sm font-medium tracking-wide uppercase mb-4">AI Business Operating System</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-gradient">
            One AI. An Entire Company Behind It.
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Creative Studio · Marketing Agency · Sales Organization · Research Lab · SEO · Competitor Intelligence · Software Factory · Executive Team — sharing memory, CRM, campaigns, and analytics.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {HERO_LINKS.map((l) =>
              l.primary ? (
                <Link key={l.href} href={l.href} className="btn-rainbow px-5 py-2.5 rounded-xl font-medium">
                  {l.label}
                </Link>
              ) : (
                <Link
                  key={l.href}
                  href={l.href}
                  className="px-5 py-2.5 rounded-xl border border-zinc-700 hover:border-indigo-400/60 hover:bg-indigo-500/5 font-medium transition-colors"
                >
                  {l.label}
                </Link>
              )
            )}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div key={f.t} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <GlowCard variant={f.variant} className="h-full">
                <h3 className="font-semibold mb-2">{f.t}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.b}</p>
              </GlowCard>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-[var(--card-border)] py-8 text-center text-sm text-zinc-500">
        SUPERIOR AI · Continuous capacity · Shared memory across departments · Estimates labeled · No invented contacts or traffic
      </footer>
    </div>
  );
}
