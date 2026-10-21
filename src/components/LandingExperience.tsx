import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, Play } from "lucide-react";
import { demoLessons } from "@/lib/public-content";
import { DemoExercise } from "./DemoExercise";
import { DemoTutor } from "./DemoTutor";
import { LanguageIcon } from "./LanguageIcon";
import { PublicFaq } from "./PublicFaq";

const steps = [
  {
    title: "Comece com uma ideia.",
    text: "Uma linguagem, uma dúvida ou um projeto que você quer tirar do papel. Seu objetivo dá direção ao estudo.",
    label: "Seu objetivo",
  },
  {
    title: "Encontre um caminho.",
    text: "Módulos com objetivos, explicações, exemplos de código e prática guiada. Um assunto de cada vez.",
    label: "Sua trilha",
  },
  {
    title: "Aprenda tentando.",
    text: "Leia o código, responda e entenda o retorno. Uma pista ajuda a pensar; a explicação ajuda a revisar.",
    label: "Sua prática",
  },
];
const outline = [
  "Python e mensagens",
  "Variáveis e respostas",
  "Condições e comandos",
  "Funções",
  "Eventos do Discord",
  "Seu primeiro bot",
];

function FlowPreview({ step }: { step: number }) {
  if (step === 0)
    return (
      <div className="flex h-full flex-col justify-center px-6 py-10 sm:px-9">
        <p className="mb-5 text-xs uppercase tracking-widest text-muted-foreground">
          Linguagem ou framework
        </p>
        <div className="border border-foreground/30 bg-black p-5">
          <blockquote className="text-lg leading-relaxed sm:text-xl">
            {demoLessons.python.goal}
          </blockquote>
          <div className="mt-7 inline-flex items-center gap-2 rounded-[3px] border border-border px-3 py-2 text-xs text-foreground/80">
            <img src="/icons/rumo.svg" alt="" width={15} height={13} />
            Rumo Atlas
            <ChevronDown
              className="ml-2 h-3 w-3 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
          <span className="mr-2 text-muted-foreground">Nível</span>
          <span className="border border-foreground/40 bg-white/[0.04] px-3 py-2">
            Iniciante
          </span>
          <span className="px-2 py-2 text-muted-foreground">Intermediário</span>
          <span className="px-2 py-2 text-muted-foreground">Avançado</span>
        </div>
        <p className="mt-7 max-w-md text-xs leading-relaxed text-muted-foreground">
          Um pedido específico ajuda a conectar os conceitos ao que você quer
          construir.
        </p>
      </div>
    );
  if (step === 1)
    return (
      <div className="px-6 py-8 sm:px-9">
        <div className="mb-7 flex items-center gap-2 text-xs text-muted-foreground">
          <LanguageIcon language="Python" />
          Python<span className="ml-auto">6 módulos · exemplo</span>
        </div>
        <h3 className="font-display text-2xl font-bold">
          Do primeiro texto ao primeiro bot.
        </h3>
        <ol className="mt-6 divide-y divide-border">
          {outline.map((title, i) => (
            <li key={title} className="flex items-center gap-4 py-3.5 text-sm">
              <span className="font-mono text-xs text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              {title}
              {i === 0 && (
                <span
                  className="ml-auto h-1.5 w-1.5 bg-foreground"
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          Cada módulo reúne conteúdo e exercícios. Os vídeos de apoio ficam em
          uma seção própria.
        </p>
      </div>
    );
  return (
    <div className="px-6 py-8 sm:px-9">
      <div className="mb-5 flex items-center justify-between text-xs text-muted-foreground">
        <span>Exercício aberto</span>
        <span>Python</span>
      </div>
      <pre className="mb-6 overflow-x-auto border-y border-border bg-black px-4 py-5 font-mono text-xs leading-7 sm:text-sm">
        <code>{demoLessons.python.code}</code>
      </pre>
      <DemoExercise lesson={demoLessons.python} />
    </div>
  );
}

export function LandingExperience() {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const reducedMotion = useReducedMotion();
  return (
    <>
      <section
        id="como-funciona"
        aria-labelledby="experience-title"
        className="scroll-mt-16 border-t border-border px-6 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-5xl">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Como funciona
          </p>
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6 sm:mb-16">
            <h2
              id="experience-title"
              className="max-w-xl text-balance font-display text-4xl font-bold leading-[1.08] sm:text-5xl"
            >
              Do seu objetivo
              <br />à próxima descoberta.
            </h2>
          </div>
          <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <div
              role="tablist"
              aria-label="Etapas de uma trilha"
              aria-orientation="vertical"
              className="border-t border-border"
            >
              {steps.map((step, i) => (
                <button
                  key={step.label}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`flow-tab-${i}`}
                  aria-controls="flow-preview"
                  aria-selected={active === i}
                  tabIndex={active === i ? 0 : -1}
                  onClick={() => setActive(i)}
                  onKeyDown={(event) => {
                    const index =
                      event.key === "ArrowDown"
                        ? (i + 1) % steps.length
                        : event.key === "ArrowUp"
                          ? (i + steps.length - 1) % steps.length
                          : event.key === "Home"
                            ? 0
                            : event.key === "End"
                              ? steps.length - 1
                              : null;
                    if (index !== null) {
                      event.preventDefault();
                      setActive(index);
                      tabs.current[index]?.focus();
                    }
                  }}
                  className={`group flex w-full cursor-pointer gap-5 border-b px-1 py-6 text-left transition-colors sm:py-8 ${active === i ? "border-foreground/50" : "border-border"}`}
                >
                  <span
                    className={`pt-1 font-mono text-xs ${active === i ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    0{i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block font-display text-xl font-bold transition-colors sm:text-2xl ${active === i ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
                    >
                      {step.title}
                    </span>
                    <span className="mt-3 block text-sm leading-relaxed text-muted-foreground">
                      {step.text}
                    </span>
                  </span>
                  <ArrowRight
                    className={`mt-1 h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none ${active === i ? "text-foreground" : "text-muted-foreground group-hover:translate-x-1"}`}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
            <div className="min-w-0 border border-border bg-[#050505]">
              <div className="flex items-center gap-3 border-b border-border px-5 py-4 text-[10px] uppercase tracking-widest text-muted-foreground">
                <img src="/icons/rumo.svg" alt="" width={18} height={16} />
                <span>Uma experiência RUMO</span>
                <span className="ml-auto">Prévia</span>
              </div>
              <motion.div
                key={active}
                id="flow-preview"
                role="tabpanel"
                aria-labelledby={`flow-tab-${active}`}
                tabIndex={0}
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.2 }}
                className="min-h-[430px] min-w-0"
              >
                <FlowPreview step={active} />
              </motion.div>
            </div>
          </div>
          <p className="mt-6 text-xs leading-relaxed text-muted-foreground lg:text-right">
            Exemplo ilustrativo. A geração acontece depois de entrar na sua
            conta.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="atlas-demo-title"
        className="border-t border-border px-6 py-20 sm:py-24"
      >
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[0.9fr_1fr] md:items-center md:gap-20">
          <div>
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Conheça o Atlas
            </p>
            <h2
              id="atlas-demo-title"
              className="text-balance font-display text-3xl font-bold leading-tight sm:text-4xl"
            >
              Uma dúvida pode abrir outro caminho.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Dentro de cada módulo, o Rumo Atlas ajuda a entender o conteúdo e
              oferece pistas para os exercícios. Aqui, experimente algumas
              perguntas sobre o exemplo de Python.
            </p>
            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              O tutor usa Gemini. As respostas de IA podem conter erros e
              merecem uma leitura crítica.
            </p>
          </div>
          <DemoTutor lesson={demoLessons.python} />
        </div>
      </section>

      <section
        aria-labelledby="videos-demo-title"
        className="border-t border-border px-6 py-20 sm:py-24"
      >
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1fr_0.9fr] md:items-center md:gap-20">
          <div className="order-2 min-w-0 border border-border md:order-1">
            <div className="relative flex aspect-video items-center justify-center bg-[#080808]">
              <div className="absolute left-5 top-5 flex items-center gap-2 text-xs text-muted-foreground">
                <LanguageIcon language="Python" />
                Python
              </div>
              <Play
                className="h-10 w-10 text-foreground/75"
                strokeWidth={1}
                aria-hidden="true"
              />
              <span className="absolute bottom-5 left-5 right-5 text-xs text-muted-foreground">
                Vídeos relacionados ao tema da sua trilha
              </span>
            </div>
            <div className="border-t border-border px-5 py-4">
              <p className="text-sm font-medium">
                Outro jeito de olhar para o mesmo assunto.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Prévia ilustrativa da seção de vídeos
              </p>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Vídeos de apoio
            </p>
            <h2
              id="videos-demo-title"
              className="text-balance font-display text-3xl font-bold leading-tight sm:text-4xl"
            >
              Leia. Pratique.
              <br />
              Veja por outro ângulo.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              As trilhas também buscam vídeos do YouTube sobre o que você está
              estudando. Um apoio para rever um conceito, acompanhar outra
              explicação e continuar explorando.
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="faq-title"
        className="border-t border-border px-6 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Antes de começar
              </p>
              <h2
                id="faq-title"
                className="font-display text-3xl font-bold sm:text-4xl"
              >
                Algumas respostas pelo caminho.
              </h2>
            </div>
          </div>
          <PublicFaq compact />
        </div>
      </section>
    </>
  );
}
