"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type GlowVariant = "indigo" | "fuchsia" | "cyan" | "emerald" | "amber";

interface GlowCardProps {
  children: ReactNode;
  variant?: GlowVariant;
  intense?: boolean;
  className?: string;
  as?: "div" | "section" | "article";
}

/**
 * Wraps the .card-glow design system (globals.css) — animated gradient
 * border, hover lift, theme-aware (dark/light/midnight/aurora via
 * data-theme). Use this instead of ad-hoc bordered divs so every page
 * shares the same look established for the app.
 */
export function GlowCard({ children, variant, intense, className = "", as = "div" }: GlowCardProps) {
  const Tag = as;
  const variantClass = variant ? `card-glow--${variant}` : "";
  const intenseClass = intense ? "card-glow--intense" : "";
  return (
    <Tag className={`card-glow p-5 ${variantClass} ${intenseClass} ${className}`.trim()}>
      {children}
    </Tag>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  gradient?: boolean;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, gradient = true, actions }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 px-6 py-6 border-b border-[var(--card-border)] animate-fade-up">
      <div>
        <h1 className={`text-xl font-semibold tracking-tight ${gradient ? "text-gradient" : ""}`}>{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--text-secondary,#94a3b8)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function StatChip({ label, value, tone = "indigo" }: { label: string; value: ReactNode; tone?: GlowVariant }) {
  return (
    <GlowCard variant={tone} className="min-w-[140px]">
      <div className="text-[11px] uppercase tracking-wide text-[var(--text-secondary,#94a3b8)]">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-gradient">{value}</div>
    </GlowCard>
  );
}

/**
 * Perspective — establishes the 3D viewing context for any Reveal3D
 * children inside it. Without this, CSS perspective/rotateX/translateZ
 * on children has no visible depth (perspective is a property of the
 * containing block, not the transformed element itself).
 */
export function Perspective({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`perspective-3d ${className}`.trim()}>{children}</div>;
}

/**
 * Reveal3D — tilts an element in from a rotated/depth-shifted state to
 * flat as it actually scrolls into view, via a real IntersectionObserver
 * (not a page-load animation like animate-fade-up — this genuinely
 * triggers on scroll, once, the first time the element becomes visible).
 * Respects prefers-reduced-motion via the .scroll-3d CSS rule itself.
 */
export function Reveal3D({
  children,
  className = "",
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true); // graceful fallback — no observer support, just show it
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect(); // reveal once, don't re-trigger on scroll-back
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`scroll-3d ${visible ? "scroll-3d--visible" : ""} ${className}`.trim()}
      style={{ transitionDelay: visible ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}


export function Stagger({ children, gap = 60 }: { children: ReactNode[]; gap?: number }) {
  return (
    <>
      {children.map((child, i) => (
        <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * gap}ms` }}>
          {child}
        </div>
      ))}
    </>
  );
}
