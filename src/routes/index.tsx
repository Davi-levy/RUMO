import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { LandingExperience } from "@/components/LandingExperience";
import { HeroOrbits } from "@/components/HeroOrbits";
import { FlipWords } from "@/components/FlipWords";
import { techIcons } from "@/lib/tech-icons";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RUMO | Aprendizado Inteligente" },
      {
        name: "description",
        content:
          "Aprenda linguagens e frameworks com trilhas personalizadas, exercícios e o tutor Rumo Atlas.",
      },
    ],
  }),
  component: Index,
});

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
      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-32 px-6 overflow-hidden">
          <div className="relative max-w-5xl mx-auto grid items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
            <div className="min-w-0 text-center lg:text-left">
              <h1 className="font-display text-5xl md:text-6xl lg:text-[3.5rem] xl:text-6xl font-bold leading-[1.05] text-balance">
                <span>Aprenda a programar</span>
                <br />
                <FlipWords
                  words={heroTecnologias}
                  colors={heroCores}
                  className="text-center lg:text-left"
                />
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

        <LandingExperience />
      </main>
      <SiteFooter />
    </div>
  );
}
