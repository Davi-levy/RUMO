import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { LegalLinks } from "./LegalPage";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-6 pb-8 pt-12 sm:pt-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1 font-display text-xl font-bold tracking-[0.3em]"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
              <span>RUMO</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Um próximo passo para quem quer aprender programação.
            </p>
          </div>
          <nav
            aria-label="Conheça o RUMO"
            className="flex flex-col items-start gap-3 text-sm text-muted-foreground"
          >
            <p className="mb-1 text-xs uppercase tracking-widest text-foreground">
              O projeto
            </p>
            <Link
              to="/sobre"
              className="transition-colors hover:text-foreground"
            >
              Sobre o RUMO
            </Link>
            <a
              href="https://github.com/Davi-levy/RUMO"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              Código no GitHub{" "}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </nav>
          <nav
            aria-label="Comece a aprender"
            className="flex flex-col items-start gap-3 text-sm text-muted-foreground"
          >
            <p className="mb-1 text-xs uppercase tracking-widest text-foreground">
              Para começar
            </p>
            <Link
              to="/auth"
              className="transition-colors hover:text-foreground"
            >
              Entrar ou criar conta
            </Link>
          </nav>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-5 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            Conteúdo gerado por IA pode conter erros.
          </p>
          <LegalLinks />
        </div>
      </div>
    </footer>
  );
}
