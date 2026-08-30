"use client";

import { useEffect, useState } from "react";
import { GlowCard } from "@/components/GlowUI";

interface Operation {
  summary: string;
  operationId: string;
  tags?: string[];
  parameters?: { name: string; in: string; required?: boolean; description?: string }[];
  requestBody?: { required?: boolean };
  responses: Record<string, { description: string }>;
}

interface Spec {
  info: { title: string; version: string; description: string };
  tags: { name: string; description?: string }[];
  paths: Record<string, Record<string, Operation>>;
}

const METHOD_COLOR: Record<string, string> = {
  get: "card-glow--cyan",
  post: "card-glow--emerald",
  put: "card-glow--amber",
  delete: "card-glow--fuchsia",
};

export default function DocsPage() {
  const [spec, setSpec] = useState<Spec | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/openapi")
      .then((r) => r.json())
      .then(setSpec)
      .catch((e) => setError(String(e)));
  }, []);

  const endpointCount = spec ? Object.keys(spec.paths).length : 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-semibold">{spec?.info.title ?? "API Documentation"}</h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">{spec?.info.description}</p>
        <div className="flex gap-3 mt-4 text-xs text-zinc-500">
          <span>{endpointCount} documented endpoints</span>
          <span>·</span>
          <a href="/api/openapi" className="text-indigo-400 hover:text-indigo-300" target="_blank">
            Raw OpenAPI JSON ↗
          </a>
        </div>
      </div>

      {error && <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>}

      {spec &&
        spec.tags.map((tag, tagIdx) => {
          const entries = Object.entries(spec.paths).filter(([, ops]) =>
            Object.values(ops).some((op) => op.tags?.includes(tag.name))
          );
          if (entries.length === 0) return null;
          return (
            <section key={tag.name} className="space-y-3 animate-fade-up" style={{ animationDelay: `${tagIdx * 40}ms` }}>
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">{tag.name}</h2>
              <p className="text-xs text-zinc-500">{tag.description}</p>
              <div className="grid gap-3">
                {entries.map(([path, ops]) =>
                  Object.entries(ops)
                    .filter(([, op]) => op.tags?.includes(tag.name))
                    .map(([method, op]) => (
                      <GlowCard key={`${path}-${method}`} variant={method === "get" ? "cyan" : method === "post" ? "emerald" : "indigo"} className="p-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">{method}</span>
                          <span className="font-mono text-sm">{path}</span>
                        </div>
                        <p className="text-sm text-zinc-300 mt-2">{op.summary}</p>
                        {op.parameters && op.parameters.length > 0 && (
                          <div className="mt-2 text-xs text-zinc-500">
                            Params: {op.parameters.map((p) => `${p.name}${p.required ? "*" : ""}`).join(", ")}
                          </div>
                        )}
                        {op.requestBody && <div className="mt-1 text-xs text-zinc-500">Request body required</div>}
                        <div className="mt-2 flex gap-2 text-xs">
                          {Object.entries(op.responses).map(([code, r]) => (
                            <span key={code} className="chip">
                              {code}: {r.description.slice(0, 40)}
                              {r.description.length > 40 ? "…" : ""}
                            </span>
                          ))}
                        </div>
                      </GlowCard>
                    ))
                )}
              </div>
            </section>
          );
        })}
    </div>
  );
}
