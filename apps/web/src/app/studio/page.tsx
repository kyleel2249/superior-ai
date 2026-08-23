"use client";

import { useState } from "react";
import { PageHeader, Card, Badge } from "@/components/ui";

interface ImageResult {
  mediaProduced: boolean;
  url?: string;
  message: string;
  provider?: string;
}
interface VideoResult {
  mediaProduced: boolean;
  message: string;
  storyBoard?: { scenes: Array<{ order: number; beat: string; seconds: number; description: string }> };
  disclaimer: string;
}

export default function StudioPage() {
  const [tab, setTab] = useState<"image" | "video">("image");

  const [prompt, setPrompt] = useState("");
  const [imageResult, setImageResult] = useState<ImageResult | null>(null);
  const [imageBusy, setImageBusy] = useState(false);

  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [videoResult, setVideoResult] = useState<VideoResult | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);

  async function generateImage() {
    if (!prompt.trim()) return;
    setImageBusy(true);
    setImageResult(null);
    try {
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      setImageResult(await res.json());
    } finally {
      setImageBusy(false);
    }
  }

  async function generateVideoPlan() {
    if (!product.trim() || !audience.trim()) return;
    setVideoBusy(true);
    setVideoResult(null);
    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, audience }),
      });
      setVideoResult(await res.json());
    } finally {
      setVideoBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Studio" subtitle="Image generation and video storyboard planning." />
      <div style={{ padding: "20px 32px 0" }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {(["image", "video"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? "var(--ink-800)" : "transparent",
                border: "1px solid var(--ink-700)",
                borderBottom: tab === t ? "1px solid var(--ink-800)" : "1px solid var(--ink-700)",
                borderRadius: "8px 8px 0 0",
                color: tab === t ? "var(--text-hi)" : "var(--text-mid)",
                padding: "8px 16px",
                fontSize: 13,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 32px 32px", maxWidth: 700 }}>
        {tab === "image" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image…"
                rows={3}
                style={{ width: "100%", background: "var(--ink-950)", border: "1px solid var(--ink-700)", borderRadius: 8, padding: 10, color: "var(--text-hi)", fontSize: 13.5, resize: "vertical" }}
              />
              <button
                onClick={generateImage}
                disabled={imageBusy || !prompt.trim()}
                style={{ marginTop: 10, background: "var(--signal)", color: "var(--ink-950)", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: imageBusy || !prompt.trim() ? 0.6 : 1 }}
              >
                {imageBusy ? "Generating…" : "Generate"}
              </button>
            </Card>
            {imageResult && (
              <Card>
                {imageResult.mediaProduced && imageResult.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageResult.url} alt={prompt} style={{ width: "100%", borderRadius: 8 }} />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Badge tone="warn">not generated</Badge>
                    <span style={{ fontSize: 13, color: "var(--text-mid)" }}>{imageResult.message}</span>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {tab === "video" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <input
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="Product name"
                style={{ width: "100%", marginBottom: 8, background: "var(--ink-950)", border: "1px solid var(--ink-700)", borderRadius: 8, padding: "8px 10px", color: "var(--text-hi)", fontSize: 13 }}
              />
              <input
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Target audience"
                style={{ width: "100%", marginBottom: 10, background: "var(--ink-950)", border: "1px solid var(--ink-700)", borderRadius: 8, padding: "8px 10px", color: "var(--text-hi)", fontSize: 13 }}
              />
              <button
                onClick={generateVideoPlan}
                disabled={videoBusy || !product.trim() || !audience.trim()}
                style={{ background: "var(--signal)", color: "var(--ink-950)", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", opacity: videoBusy ? 0.6 : 1 }}
              >
                {videoBusy ? "Planning…" : "Build storyboard"}
              </button>
            </Card>
            {videoResult && (
              <Card>
                <div style={{ marginBottom: 10 }}>
                  <Badge tone={videoResult.mediaProduced ? "ok" : "warn"}>{videoResult.mediaProduced ? "produced" : "planned only"}</Badge>
                </div>
                <p style={{ fontSize: 12.5, color: "var(--text-low)", margin: "0 0 12px" }}>{videoResult.disclaimer}</p>
                {videoResult.storyBoard?.scenes.map((s) => (
                  <div key={s.order} style={{ fontSize: 13, marginBottom: 6 }}>
                    <strong style={{ color: "var(--signal)", textTransform: "capitalize" }}>{s.beat}</strong>{" "}
                    <span style={{ color: "var(--text-low)", fontSize: 11 }}>({s.seconds}s)</span> — {s.description}
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
