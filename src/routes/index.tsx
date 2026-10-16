import { createFileRoute, Link } from "@tanstack/react-router";
import { Github, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { LanguageIcon } from "@/components/LanguageIcon";
import { LegalLinks } from "@/components/LegalPage";
import { HeroOrbits } from "@/components/HeroOrbits";
import { FlipWords } from "@/components/FlipWords";
import { techIcons } from "@/lib/tech-icons";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RUMO | Aprenda programação com apoio da IA" },
      { name: "description", content: "Aprenda linguagens e frameworks com trilhas personalizadas, exercícios e o tutor Rumo Atlas." },
    ],
  }),
  component: Index,
});

const linguagens = ["Python", "TypeScript", "Rust", "Go", "React", "SQL", "Java", "Kotlin", "Next.js", "C"];
const heroCores: Record<string, string> = {
  Python: techIcons.python.color,
  React: techIcons.react.color,
  TypeScript: techIcons.typescript.color,
  Django: "#44B78B",
  JavaScript: techIcons.javascript.color,
  "Next.js": "#FFFFFF",
  Rust: "#DEA584",
  Java: techIcons.java.color,
  Go: techIcons.go.color,
  Kotlin: techIcons.kotlin.color,
  C: techIcons.c.color,
  "C++": "#659AD2",
  "C#": "#A179DC",
  PHP: "#8892BF",
  Ruby: "#CC342D",
  Swift: "#F05138",
  Angular: "#DD0031",
  "Vue.js": "#4FC08D",
  Svelte: "#FF3E00",
  Laravel: "#FF2D20",
  Flutter: "#54C5F8",
  FastAPI: "#009688",
  Express: "#FFFFFF",
  Astro: "#FF5D01",
};
const heroTecnologias = Object.keys(heroCores);

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-32 px-6 overflow-hidden">
        <div className="relative max-w-5xl mx-auto grid items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
          <div className="min-w-0 text-center lg:text-left">
            <h1 className="font-display text-5xl md:text-6xl lg:text-[3.5rem] xl:text-6xl font-bold leading-[1.05] text-balance">
              <span>Aprenda a programar</span>
              <br />
              <FlipWords words={heroTecnologias} colors={heroCores} className="text-center lg:text-left" />
              <br />
              <span className="text-muted-foreground">com o apoio da IA</span>
            </h1>

            <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              Trilhas de exercícios com feedback inteligente e personalizado.
            </p>

            <div className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-4">
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
          <HeroOrbits />
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
              <div className="mt-8 h-2 w-full bg-secondary rounded-full overflow-hidden relative">
                <div className="h-full w-[62%] bg-foreground rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse motion-reduce:animate-none" />
                </div>
              </div>
              <div className="mt-3 flex justify-between font-mono text-xs text-muted-foreground">
                <span>Progresso da Trilha</span>
                <span className="font-bold text-foreground">62% concluído</span>
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
