import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--card-border)] bg-[var(--card)]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-sm">
              S
            </div>
            <span className="font-semibold tracking-tight text-lg">SUPERIOR AI</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-[var(--muted)]">
            <Link href="/chat" className="hover:text-white transition">
              Chat
            </Link>
            <Link href="/admin" className="hover:text-white transition">
              Admin
            </Link>
            <Link href="/projects" className="hover:text-white transition">
              Projects
            </Link>
            <Link
              href="/chat"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
            >
              Launch
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
          <p className="text-indigo-400 text-sm font-medium tracking-wide uppercase mb-4">
            Multi-Model Autonomous Expert Agent Platform
          </p>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            One AI.
            <br />
            An Entire Team Behind It.
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            SUPERIOR AI is not a chatbot. It is a Chief AI Officer + engineering department + research team + strategy
            team operating through one interface — with dynamic model routing, AI Council, continuous capacity, and
            durable task state.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/chat"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium transition shadow-lg shadow-indigo-500/20"
            >
              Open Command Center
            </Link>
            <Link
              href="/admin/providers"
              className="px-6 py-3 rounded-xl border border-zinc-700 hover:border-zinc-500 font-medium transition"
            >
              Configure Providers
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Model-Agnostic Router",
              body: "Dynamic registry. Future models register without redesign. Never claims availability without validation.",
            },
            {
              title: "AI Council",
              body: "Executive, Strategist, Researcher, Coding Team, Finance, Security — debate and verify before finalizing.",
            },
            {
              title: "Continuous Capacity",
              body: "Provider failover, multi-key pools, local fallback, queues. No artificial internal message limits.",
            },
            {
              title: "Durable Tasks",
              body: "Checkpointed state. Resume after disconnect or restart. Never lose work.",
            },
            {
              title: "Software Factory",
              body: "Requirements → architecture → code → tests → security → deploy — with approval gates.",
            },
            {
              title: "Truthfulness First",
              body: "No invented sources, test results, or execution status. Verification loops built in.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--card-border)] hover:border-indigo-500/40 transition"
            >
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-[var(--card-border)] py-8 text-center text-sm text-zinc-500">
        SUPERIOR AI · Production foundation · Model ecosystem will continually change — the platform is designed for it.
      </footer>
    </div>
  );
}
