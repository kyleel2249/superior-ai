export type BrandStyle =
  | "geometric" | "curved" | "minimalist" | "luxury" | "futuristic"
  | "corporate" | "technology" | "playful" | "bold" | "architectural" | "monogram";

export interface LetterformConcept {
  id: string;
  name: string;
  initials: string;
  style: BrandStyle;
  concept: string;
  construction: string;
  negativeSpace?: string;
  svgMark: string;
  colorSuggestions: string[];
  typography: { headline: string; body: string };
  usage: string[];
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "SA";
}

function svgMonogram(letters: string, style: BrandStyle): string {
  const safe = letters.slice(0, 3).replace(/[^A-Z0-9]/gi, "") || "AI";
  const stroke = style === "minimalist" || style === "luxury" ? 1.5 : 2.5;
  const rx = style === "curved" || style === "playful" ? 12 : style === "geometric" ? 4 : 8;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="${safe} mark">
  <rect x="4" y="4" width="56" height="56" rx="${rx}" fill="#0a0a0a" stroke="#6366f1" stroke-width="${stroke}"/>
  <text x="32" y="40" text-anchor="middle" font-family="system-ui,Segoe UI,sans-serif" font-size="${safe.length > 2 ? 18 : 24}" font-weight="700" fill="#e2e8f0">${safe}</text>
</svg>`;
}

const STYLE_NOTES: Record<BrandStyle, string> = {
  geometric: "Angular joins, equal stroke, grid-aligned counters",
  curved: "Soft arcs connecting letter spines; organic negative space",
  minimalist: "Single-weight lines, maximum whitespace, no ornament",
  luxury: "High-contrast strokes, refined serifs or hairlines, restrained palette",
  futuristic: "Cut corners, tech bevels, slight italic thrust",
  corporate: "Stable verticals, balanced proportions, trust-forward",
  technology: "Modular blocks, circuit-like joins between glyphs",
  playful: "Rounded terminals, uneven rhythm, friendly scale",
  bold: "Heavy weight, tight tracking, high impact at small sizes",
  architectural: "Blueprint precision, structural cross-bars",
  monogram: "Interlocking letterforms sharing strokes",
};

export function generateLetterformConcepts(input: {
  brandName: string;
  initials?: string;
  industry?: string;
  personality?: string[];
  styles?: BrandStyle[];
  colors?: string[];
}) {
  const brandName = input.brandName.trim() || "Brand";
  const initials = (input.initials || initialsFromName(brandName)).toUpperCase();
  const industry = input.industry ?? "technology";
  const personality = input.personality?.length ? input.personality : ["clear", "modern", "trustworthy"];
  const styles: BrandStyle[] = input.styles?.length
    ? input.styles
    : ["geometric", "minimalist", "monogram", "futuristic", "corporate"];
  const palette = [
    { name: "Ink", hex: input.colors?.[0] ?? "#0a0a0a", role: "primary" },
    { name: "Signal", hex: input.colors?.[1] ?? "#6366f1", role: "accent" },
    { name: "Cloud", hex: input.colors?.[2] ?? "#e2e8f0", role: "surface text" },
    { name: "Slate", hex: "#64748b", role: "secondary" },
  ];
  const concepts = styles.map((style, i) => ({
    id: `mark_${Date.now().toString(36)}_${i}`,
    name: `${brandName} · ${style}`,
    initials,
    style,
    concept: `Combine ${initials.split("").join(" + ")} into a ${style} mark for ${industry}.`,
    construction: STYLE_NOTES[style],
    negativeSpace: style === "monogram" || style === "geometric"
      ? "Shared counters form a secondary abstract shape"
      : "Breathing room around glyph silhouette",
    svgMark: svgMonogram(initials, style),
    colorSuggestions: palette.map((p) => p.hex),
    typography: {
      headline: style === "luxury" ? "High-contrast serif or refined grotesk" : "Geometric sans",
      body: "Readable humanist or neutral sans, 1.5 line-height",
    },
    usage: ["app icon", "favicon", "social avatar", "wordmark lockup", "presentation cover"],
  }));
  return {
    id: `brand_${Date.now().toString(36)}`,
    brandName,
    industry,
    personality,
    concepts,
    palette,
    wordmarkNotes: `Wordmark: ${brandName} set in primary type; mark sits left or centered above on mobile.`,
    faviconNotes: "Use geometric/monogram SVG at 32×32; solid background for tab clarity.",
    socialAvatarNotes: "Crop mark with 10% padding; ensure contrast on light and dark themes.",
    brandGuideOutline: [
      "Logo clear space = height of primary initial",
      "Do not skew, recolor off-palette, or add shadows by default",
      "Minimum size 16px digital / 8mm print",
      "Co-branding: mark + partner wordmark with equal visual weight",
      "Motion: optional 200ms fade; no bounce for corporate/tech",
    ],
    createdAt: new Date().toISOString(),
  };
}

export function exportSvgDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
