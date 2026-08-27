"use client";

import type { ReactNode } from "react";

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

/** Staggered fade-up wrapper for lists of cards, so they animate in one after another rather than all at once. */
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
