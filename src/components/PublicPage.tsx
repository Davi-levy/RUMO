import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "./Navbar";
import { SiteFooter } from "./SiteFooter";

export function PublicPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 pb-20 pt-28 sm:pb-28 sm:pt-36">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Voltar ao início
        </Link>
        <header className="mb-12 mt-12 max-w-3xl sm:mb-16">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="text-balance font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        </header>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
