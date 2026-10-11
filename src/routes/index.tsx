import { createFileRoute, Link } from "@tanstack/react-router";
import { Github, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { LanguageIcon } from "@/components/LanguageIcon";
import { LegalLinks } from "@/components/LegalPage";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RUMO" },
      { name: "description", content: "Trilhas de exercícios com feedback inteligente." },
    ],
  }),
  component: Index,
});

const linguagens = ["Python", "TypeScript", "Rust", "Go", "React", "SQL", "Java", "Kotlin", "Next.js", "C"];

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        <div className="relative max-w-5xl mx-auto text-center">
          {}

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] text-balance">
            <span>Aprenda a programar</span>
            <br />
            <span className="text-muted-foreground">com o apoio da IA</span>
          </h1>

          <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Trilhas de exercícios com feedback inteligente e personalizado.
          </p>

          <div className="mt-12 flex items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="ripple-btn px-8 py-4 bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Começar
            </Link>
            <Link
              to="/dashboard"
              className="px-8 py-4 border border-border text-foreground hover:border-foreground transition-colors"
            >
              Suas trilhas
            </Link>
          </div>
        </div>
      </section>

      {/* Bento */}
      <section id="como-funciona" className="px-6 py-32 border-t border-border scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground mb-4">Como funciona</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold leading-[1.1] mb-16 max-w-2xl">
            Tudo o que você precisa para sair do zero ou avançar
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bento md:col-span-2">
              <div className="font-mono text-xs text-muted-foreground mb-6">Trilhas</div>
              <h3 className="text-2xl font-medium mb-3">Qualquer linguagem, qualquer framework</h3>
              <p className="text-muted-foreground leading-relaxed max-w-md">
                Diga o que quer aprender e o seu nível. A trilha chega organizada em módulos, do básico ao avançado.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {linguagens.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1.5 border border-border px-2.5 py-1 font-mono text-xs text-muted-foreground">
                    <LanguageIcon language={l} />
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <div className="bento">
              <div className="font-mono text-xs text-muted-foreground mb-6">Exercícios</div>
              <h3 className="text-2xl font-medium mb-3">Correção na hora</h3>
              <p className="text-muted-foreground leading-relaxed">
                Responda e receba um retorno imediato sobre o que acertou e o que falta.
              </p>
            </div>

            <div className="bento">
              <div className="font-mono text-xs text-muted-foreground mb-6">Conteúdo</div>
              <h3 className="text-2xl font-medium mb-3">Explicações com exemplos</h3>
              <p className="text-muted-foreground leading-relaxed">
                Cada módulo traz texto claro e trechos de código para estudar no seu ritmo.
              </p>
            </div>

            <div className="bento md:col-span-2">
              <div className="font-mono text-xs text-muted-foreground mb-6">Progresso</div>
              <h3 className="text-2xl font-medium mb-3">Veja até onde você chegou</h3>
              <p className="text-muted-foreground leading-relaxed max-w-md">
                Seu avanço fica salvo na sua conta, trilha por trilha.
              </p>
              <div className="mt-8 h-1.5 w-full bg-secondary overflow-hidden">
                <div className="h-full w-[62%] bg-foreground" />
              </div>
              <div className="mt-3 flex justify-between font-mono text-xs text-muted-foreground">
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1 font-display font-bold tracking-[0.3em] text-foreground">
            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            <span className="logo-outline">RUMO</span>
          </div>
          <LegalLinks />
          <a
            href="https://github.com/Davi-levy/RUMO"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-foreground transition-colors"
            aria-label="GitHub do RUMO"
          >
            <Github size={18} />
            <span>GitHub do projeto</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
