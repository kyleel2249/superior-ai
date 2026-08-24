/**
 * Contradiction detector across sources/snippets.
 */

export interface Contradiction {
  a: { title: string; url: string; excerpt: string };
  b: { title: string; url: string; excerpt: string };
  reason: string;
}

const POS = /\b(increase|grew|growth|success|leading|best|recommend|yes)\b/i;
const NEG = /\b(decline|fell|failure|worst|avoid|not recommend|no)\b/i;

export function detectSourceContradictions(
  sources: Array<{ title: string; url: string; snippet?: string }>
): Contradiction[] {
  const out: Contradiction[] = [];
  for (let i = 0; i < sources.length; i++) {
    for (let j = i + 1; j < sources.length; j++) {
      const a = sources[i]!;
      const b = sources[j]!;
      const sa = `${a.title} ${a.snippet ?? ""}`;
      const sb = `${b.title} ${b.snippet ?? ""}`;
      const aPos = POS.test(sa);
      const aNeg = NEG.test(sa);
      const bPos = POS.test(sb);
      const bNeg = NEG.test(sb);
      if ((aPos && bNeg) || (aNeg && bPos)) {
        out.push({
          a: { title: a.title, url: a.url, excerpt: (a.snippet ?? a.title).slice(0, 160) },
          b: { title: b.title, url: b.url, excerpt: (b.snippet ?? b.title).slice(0, 160) },
          reason: "Opposing sentiment/polarity on overlapping topic signals",
        });
      }
    }
  }
  return out;
}
