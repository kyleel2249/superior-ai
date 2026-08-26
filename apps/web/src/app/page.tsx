import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-sm">S</div>
            <span className="font-semibold tracking-tight text-lg">SUPERIOR AI</span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-[var(--muted)] flex-wrap justify-end">
            <Link href="/workspace" className="hover:text-white">Workspace</Link>
            <Link href="/chat" className="hover:text-white">Chat</Link>
            <Link href="/studio" className="hover:text-white">Studio</Link>
            <Link href="/sales" className="hover:text-white">Sales</Link>
            <Link href="/competitors" className="hover:text-white">Competitors</Link>
            <Link href="/command" className="hover:text-white">Command</Link>
            <Link href="/ceo" className="hover:text-white">CEO</Link>
            <Link href="/marketing" className="hover:text-white">Marketing</Link>
            <Link href="/seo" className="hover:text-white">SEO</Link>
            <Link href="/login" className="hover:text-white">Login</Link>
            
            
            <Link href="/status" className="hover:text-white">Status</Link>
            <Link href="/advanced" className="hover:text-white">Advanced</Link>
            <Link href="/admin/control" className="hover:text-white">AI Control</Link>
            <Link href="/admin/overview" className="hover:text-white">Admin</Link>
            <Link href="/admin/packs" className="hover:text-white">Packs</Link>
            <Link href="/publisher" className="hover:text-white">Publish</Link>
            <Link href="/workspace" className="hover:text-white">Workspace</Link>
            <Link href="/chat" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium">Launch</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-12 text-center">
          <p className="text-indigo-400 text-sm font-medium tracking-wide uppercase mb-4">AI Business Operating System</p>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            One AI. An Entire Company Behind It.
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Creative Studio · Marketing Agency · Sales Organization · Research Lab · SEO · Competitor Intelligence · Software Factory · Executive Team — sharing memory, CRM, campaigns, and analytics.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/workspace" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium">Open Workspace</Link>
            <Link href="/chat" className="px-5 py-2.5 rounded-xl border border-zinc-700 hover:border-zinc-500 font-medium">Chat</Link>
            <Link href="/studio" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium">Creative Studio</Link>
            <Link href="/sales" className="px-5 py-2.5 rounded-xl border border-zinc-700 hover:border-zinc-500 font-medium">Sales</Link>
            <Link href="/competitors" className="px-5 py-2.5 rounded-xl border border-zinc-700 hover:border-zinc-500 font-medium">War Room</Link>
            <Link href="/ceo" className="px-5 py-2.5 rounded-xl border border-zinc-700 hover:border-zinc-500 font-medium">CEO Center</Link>
            <Link href="/marketing" className="px-5 py-2.5 rounded-xl border border-zinc-700 hover:border-zinc-500 font-medium">Marketing</Link>
            <Link href="/seo" className="px-5 py-2.5 rounded-xl border border-zinc-700 hover:border-zinc-500 font-medium">SEO</Link>
            <Link href="/daily" className="px-5 py-2.5 rounded-xl border border-zinc-700 hover:border-zinc-500 font-medium">Daily Intel</Link>
            <Link href="/dashboard" className="px-5 py-2.5 rounded-xl border border-zinc-700 hover:border-zinc-500 font-medium">KPI Dashboard</Link>
            <Link href="/brand" className="px-5 py-2.5 rounded-xl border border-zinc-700 hover:border-zinc-500 font-medium">Brand Studio</Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-5">
          {[
            { t: "Autonomous Media Studio", b: "UGC, skits, storyboards, multi-platform variants, realism controls, honest resolution labels." },
            { t: "SEO + Traffic Intelligence", b: "Keyword clusters, content factory, audits, competitor SEO — no guaranteed rankings." },
            { t: "Competitor War Room", b: "Public research, scorecards, traffic shells with provenance and confidence." },
            { t: "Sales Autopilot", b: "Leads, scoring, outreach drafts, funnel, CRM-ready — approval-gated sends." },
            { t: "Full Business Council", b: "CEO → Creative → Sales → Finance → Customer… department-to-department collaboration." },
            { t: "Master Growth Loop", b: "Research → Creative → Campaign → Leads → Close → Retain → Optimize." },
          ].map((f) => (
            <div key={f.t} className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--card-border)] hover:border-indigo-500/40 transition">
              <h3 className="font-semibold mb-2">{f.t}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.b}</p>
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
