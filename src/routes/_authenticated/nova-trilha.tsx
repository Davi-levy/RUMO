import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { gerarEsqueleto, gerarModulo } from "@/lib/trilha.functions";
import { NIVEIS, type Nivel } from "@/lib/trilha.shared";
import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";

export const Route = createFileRoute("/_authenticated/nova-trilha")({
  component: NovaTrilha,
});

const rotulos: Record<Nivel, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

const sugestoes = ["Python", "JavaScript", "React", "TypeScript", "Rust", "Go", "SQL", "Django"];

function NovaTrilha() {
  const [linguagem, setLinguagem] = useState("");
  const [nivel, setNivel] = useState<Nivel>("iniciante");
  const [gerando, setGerando] = useState(false);
  const [passos, setPassos] = useState<{ texto: string; feito: boolean }[]>([]);
  const criarEsqueleto = useServerFn(gerarEsqueleto);
  const criarModulo = useServerFn(gerarModulo);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!linguagem.trim()) return;
    const tema = linguagem.trim();
    setGerando(true);
    setPassos([{ texto: "Planejando os módulos", feito: false }]);

    const concluir = (i: number) =>
      setPassos((p) => p.map((x, idx) => (idx === i ? { ...x, feito: true } : x)));

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Sessão expirada.");

      const esqueleto = await criarEsqueleto({ data: { linguagem: tema, nivel } });
      concluir(0);

      const { data: novaTrilha, error: errTrilha } = await supabase
        .from("trilhas")
        .insert({
          usuario_id: user.user.id,
          linguagem: tema,
          nivel,
          titulo: esqueleto.titulo,
          descricao: esqueleto.descricao,
        })
        .select("id")
        .single();
      if (errTrilha || !novaTrilha) throw errTrilha ?? new Error("Falha ao salvar a trilha.");

      setPassos([
        { texto: "Planejando os módulos", feito: true },
        ...esqueleto.modulos.map((m) => ({ texto: `Escrevendo: ${m.titulo}`, feito: false })),
      ]);

      const total = esqueleto.modulos.length;
      for (let i = 0; i < total; i++) {
        const plano = esqueleto.modulos[i]!;
        const gerado = await criarModulo({
          data: {
            linguagem: tema,
            nivel,
            tituloTrilha: esqueleto.titulo,
            tituloModulo: plano.titulo,
            resumoModulo: plano.resumo,
            posicao: i + 1,
            total,
          },
        });

        const { data: modulo, error: errModulo } = await supabase
          .from("modulos")
          .insert({
            trilha_id: novaTrilha.id,
            titulo: plano.titulo,
            conteudo: gerado.conteudo,
            ordem: i,
          })
          .select("id")
          .single();
        if (errModulo || !modulo) throw errModulo ?? new Error("Falha ao salvar o módulo.");

        const { error: errEx } = await supabase.from("exercicios").insert(
          gerado.exercicios.map((ex, j) => ({
            modulo_id: modulo.id,
            pergunta: ex.pergunta,
            resposta_esperada: ex.resposta_esperada,
            dica: ex.dica ?? null,
            explicacao: ex.explicacao ?? null,
            ordem: j,
          })),
        );
        if (errEx) throw errEx;

        concluir(i + 1);
      }

      toast.success("Trilha criada!");
      navigate({ to: "/trilha/$trilhaId", params: { trilhaId: novaTrilha.id } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar trilha";
      toast.error(msg);
      setGerando(false);
    }
  }

  const feitos = passos.filter((p) => p.feito).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageTransition>
        <main className="max-w-2xl mx-auto px-6 pt-32 pb-24">
          {gerando ? (
            <div className="py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                className="h-12 w-12 border border-border border-t-foreground rounded-full"
              />
              <h1 className="mt-10 font-display text-3xl font-bold">Gerando sua trilha</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Cada módulo é escrito separadamente. Não feche a página.
              </p>
              <div className="mt-8 h-px w-full bg-border">
                <motion.div
                  className="h-px bg-foreground"
                  animate={{ width: `${passos.length ? (feitos / passos.length) * 100 : 0}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <ul className="mt-8 space-y-3">
                {passos.map((p, i) => (
                  <li
                    key={`${p.texto}-${i}`}
                    className={`text-sm transition-colors ${
                      p.feito ? "text-foreground" : i === feitos ? "text-foreground" : "text-muted-foreground/40"
                    }`}
                  >
                    {p.feito ? "— " : i === feitos ? "› " : "  "}
                    {p.texto}
                  </li>
                ))}
              </ul>
            </div>

          ) : (
            <>
              <h1 className="font-display text-4xl font-bold">
                Nova trilha
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Diga o que você quer aprender. A IA monta os módulos, o conteúdo e os exercícios.
              </p>

              <form onSubmit={submit} className="mt-12 space-y-8">
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Linguagem ou framework
                  </label>
                  <input
                    value={linguagem}
                    onChange={(e) => setLinguagem(e.target.value)}
                    placeholder="Ex: React, Rust, Django..."
                    className="mt-3 w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sugestoes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setLinguagem(s)}
                        className="border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground">Nível</label>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {NIVEIS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNivel(n)}
                        className={`border px-4 py-3 text-sm transition-colors ${
                          nivel === n
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {rotulos[n]}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!linguagem.trim()}
                  className="w-full bg-primary text-primary-foreground py-4 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Gerar trilha com IA
                </button>
              </form>
            </>
          )}
        </main>
      </PageTransition>
    </div>
  );
}

