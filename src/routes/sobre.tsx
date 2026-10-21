import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { PublicPage } from "@/components/PublicPage";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre o projeto | RUMO" },
      {
        name: "description",
        content:
          "Conheça a proposta educacional do RUMO, como a inteligência artificial participa do projeto e seus limites.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PublicPage
      eyebrow="Sobre o RUMO"
      title="Aprender ganha sentido quando existe um objetivo."
      description="Um projeto escolar que explora como a inteligência artificial pode ajudar a organizar o estudo de programação, conectar conceitos a interesses e abrir espaço para a prática."
    >
      <div className="grid gap-10 border-y border-border py-10 sm:grid-cols-[0.65fr_1.35fr] sm:gap-16 sm:py-14">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">
          Da curiosidade
          <br />
          ao próximo passo.
        </h2>
        <div className="space-y-5 text-sm leading-7 text-muted-foreground">
          <p>
            Quem começa a programar encontra muitas linguagens, tutoriais e
            caminhos possíveis. Transformar uma ideia em uma sequência de estudo
            pode ser uma dificuldade por si só.
          </p>
          <p>
            O RUMO parte do que a pessoa quer aprender. A proposta é organizar
            esse objetivo em módulos, apresentar conceitos com exemplos e
            oferecer exercícios para colocar a leitura em prática. O progresso
            fica associado à conta para ajudar a retomar o caminho.
          </p>
          <p>
            Como projeto educacional em evolução, o RUMO reúne conteúdo, prática
            e acompanhamento em um mesmo lugar. A experiência foi pensada para
            dar continuidade ao estudo e abrir espaço para dúvidas ao longo do
            caminho.
          </p>
        </div>
      </div>
      <section className="py-12 sm:py-16">
        <p className="mb-5 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          O papel da tecnologia
        </p>
        <h2 className="max-w-xl font-display text-3xl font-bold leading-tight">
          A IA organiza. A pessoa aprende, questiona e pratica.
        </h2>
        <div className="mt-9 grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="text-base font-medium">Trilhas e tutor</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              O Rumo Atlas usa Gemini para produzir conteúdo e oferecer
              explicações dentro dos módulos. O contexto da trilha orienta as
              respostas. Vídeos do YouTube complementam o material quando há
              resultados adequados.
            </p>
          </div>
          <div>
            <h3 className="text-base font-medium">Correção e acompanhamento</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Os exercícios objetivos são comparados ao gabarito salvo. A dica e
              a explicação ajudam a revisar uma tentativa. A correção não
              executa o código do aluno, e o gabarito gerado pela IA também pode
              conter erros.
            </p>
          </div>
        </div>
      </section>
      <section className="grid gap-6 border-t border-border py-10 sm:grid-cols-[0.65fr_1.35fr] sm:gap-16">
        <h2 className="font-display text-2xl font-bold">
          O que orienta o projeto
        </h2>
        <ul className="space-y-6 text-sm leading-7">
          <li>
            <h3 className="font-medium">Objetivos que fazem sentido</h3>
            <p className="mt-1 text-muted-foreground">
              Um bot, um site ou uma dúvida concreta podem ser pontos de partida
              para estudar os fundamentos.
            </p>
          </li>
          <li>
            <h3 className="font-medium">Participação ativa</h3>
            <p className="mt-1 text-muted-foreground">
              Ler o código, prever um resultado, tentar uma resposta e conversar
              sobre o que ainda não ficou claro.
            </p>
          </li>
          <li>
            <h3 className="font-medium">Transparência sobre os limites</h3>
            <p className="mt-1 text-muted-foreground">
              A IA pode inventar ou errar. O RUMO oferece relatos de exercícios
              com erro e incentiva conferir o conteúdo e consultar outras
              fontes.
            </p>
          </li>
        </ul>
      </section>
      <section className="border-t border-border py-10">
        <h2 className="font-display text-2xl font-bold">
          Um projeto construído em aberto.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
          A interface usa React e TanStack. Supabase cuida da autenticação e dos
          dados; Gemini participa da geração; e a aplicação é hospedada na
          Vercel. O código está disponível no GitHub, onde também é possível
          conhecer as contribuições e acompanhar o desenvolvimento.
        </p>
        <div className="mt-7 flex flex-wrap gap-5">
          <a
            href="https://github.com/Davi-levy/RUMO"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4 hover:opacity-70"
          >
            Conhecer o código
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>
      <div className="mt-4 border-t border-border pt-9">
        <Link
          to="/auth"
          className="inline-flex min-h-12 items-center gap-3 bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80"
        >
          Começar a aprender
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </PublicPage>
  );
}
