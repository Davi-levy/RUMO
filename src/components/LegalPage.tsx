import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function LegalLinks() {
  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
      <Link to="/privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
      <Link to="/termos" className="hover:text-foreground transition-colors">Termos de Serviço</Link>
    </div>
  );
}

export function LegalContact() {
  return <a href="https://github.com/Davi-levy/RUMO/issues" className="underline underline-offset-4 hover:text-foreground">canal do projeto no GitHub</a>;
}

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-6">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between">
          <Link to="/" className="flex items-center gap-1 font-display text-xl font-bold tracking-[0.3em]">
            <ChevronRight className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            <span className="logo-outline">RUMO</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Voltar ao início</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mt-3 text-xs text-muted-foreground">Última atualização: 11 de outubro de 2026</p>
        <article className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:underline [&_a]:underline-offset-4">
          {children}
        </article>
      </main>
      <footer className="border-t border-border px-6 py-8"><LegalLinks /></footer>
    </div>
  );
}
