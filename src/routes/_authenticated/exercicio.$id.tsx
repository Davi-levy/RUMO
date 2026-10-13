import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Correcao } from "@/lib/correcao";
import { responderExercicio, revelarSolucao } from "@/lib/exercicio.functions";
import { AlternativaSchema, type Alternativa, type TipoExercicio } from "@/lib/exercicios";
import { z } from "zod";
import { Markdown } from "@/components/Markdown";
import { ReportarExercicio } from "@/components/ReportarExercicio";
import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";

export const Route = createFileRoute("/_authenticated/exercicio/$id")({
  component: ExercicioPage,
});

interface Ex {
  id: string;
  pergunta: string;
  dica: string | null;
  modulo_id: string;
  tipo: TipoExercicio;
  alternativas: Alternativa[] | null;
}

function ExercicioPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [ex, setEx] = useState<Ex | null>(null);
  const [trilhaId, setTrilhaId] = useState<string | null>(null);
  const [resposta, setResposta] = useState("");
  const [correcao, setCorrecao] = useState<Correcao | null>(null);
  const [mostrarDica, setMostrarDica] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [mostrarSolucao, setMostrarSolucao] = useState(false);
  const [solucao, setSolucao] = useState<{ solucao: string; explicacao: string | null } | null>(null);
  const [revelando, setRevelando] = useState(false);
  const corrigirResposta = useServerFn(responderExercicio);
  const buscarSolucao = useServerFn(revelarSolucao);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setEx(null);
    setResposta("");
    setCorrecao(null);
    setMostrarDica(false);
    setMostrarSolucao(false);
    setSolucao(null);
    (async () => {
      try {
      const { data, error } = await supabase
        .from("exercicios")
        .select("id, pergunta, dica, modulo_id, tipo, alternativas")
        .eq("id", id)
        .maybeSingle();
      if (!ativo) return;
      if (error) throw error;
      const alternativas = z.array(AlternativaSchema).length(4).safeParse(data?.alternativas);
      setEx(data ? { ...data, alternativas: alternativas.success ? alternativas.data : null } : null);

      if (data) {
        const { data: mod } = await supabase
          .from("modulos")
          .select("trilha_id")
          .eq("id", data.modulo_id)
          .maybeSingle();
        if (!ativo) return;
        setTrilhaId(mod?.trilha_id ?? null);

        const { data: anterior } = await supabase
          .from("respostas")
          .select("resposta, acertou, feedback")
          .eq("exercicio_id", id)
          .maybeSingle();
        if (!ativo) return;
        if (anterior) {
          setResposta(anterior.resposta);
          setCorrecao({
            resultado: anterior.acertou ? "acertou" : "errou",
            acertou: anterior.acertou,
            score: anterior.acertou ? 1 : 0,
            feedback: anterior.feedback ?? "",
          });
        }
      }
      } catch { if (ativo) toast.error("Não foi possível carregar o exercício."); }
      finally { if (ativo) setCarregando(false); }
    })();
    return () => { ativo = false; };
  }, [id]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!ex || !resposta.trim() || enviando || (ex.tipo === "multipla_escolha" && !ex.alternativas)) return;
    setEnviando(true);
    setMostrarSolucao(false);
    try {
      const resultado = await corrigirResposta({ data: { id: ex.id, resposta } });
      setCorrecao(resultado);
    } catch { toast.error("Não foi possível corrigir e salvar sua resposta. Tente novamente."); }
    finally { setEnviando(false); }
  }

  async function verSolucao() {
    if (!ex || revelando) return;
    setRevelando(true);
    try {
      setSolucao(await buscarSolucao({ data: { id: ex.id } }));
      setMostrarSolucao(true);
    } catch { toast.error("Não foi possível carregar a solução."); }
    finally { setRevelando(false); }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageTransition>
        <main className="max-w-2xl mx-auto px-6 pt-32 pb-24">
          <button
            onClick={() =>
              trilhaId
                ? navigate({ to: "/trilha/$trilhaId", params: { trilhaId }, search: { modulo: ex?.modulo_id } })
                : navigate({ to: "/dashboard" })
            }
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar para a trilha
          </button>

          {carregando ? (
            <p className="mt-12 text-sm text-muted-foreground">Carregando...</p>
          ) : !ex ? (
            <p className="mt-12 text-sm text-muted-foreground">Exercício não encontrado.</p>
          ) : (
            <>
              <p className="mt-10 text-xs uppercase tracking-widest text-muted-foreground">Exercício</p>
              <h1 className="mt-4 font-display text-2xl font-bold leading-snug">{ex.tipo === "legado" ? ex.pergunta : ex.tipo === "multipla_escolha" ? "Escolha a alternativa correta" : "Preveja a saída do código"}</h1>
              {ex.tipo !== "legado" && <div className="mt-6"><Markdown>{ex.pergunta}</Markdown></div>}

              {ex.dica && (
                <div className="mt-6">
                  {mostrarDica ? (
                    <p className="border-l-2 border-border pl-4 text-sm text-muted-foreground">{ex.dica}</p>
                  ) : (
                    <button
                      onClick={() => setMostrarDica(true)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                    >
                      Ver dica
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={enviar} className="mt-10">
                {ex.tipo === "multipla_escolha" ? ex.alternativas ? (
                  <fieldset className="space-y-3">
                    <legend className="sr-only">Alternativas</legend>
                    {ex.alternativas.map((alternativa, i) => <label key={alternativa.id} className={`flex cursor-pointer items-start gap-3 border px-4 py-3 text-sm transition-colors ${resposta === alternativa.id ? "border-foreground" : "border-border hover:border-foreground"}`}>
                      <input type="radio" name="alternativa" value={alternativa.id} checked={resposta === alternativa.id} onChange={() => setResposta(alternativa.id)} disabled={enviando} className="mt-1 accent-white" />
                      <span className="text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
                      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">{alternativa.texto}</span>
                    </label>)}
                  </fieldset>
                ) : <p role="alert" className="text-sm text-muted-foreground">As alternativas estão incompletas. Você pode reportar este exercício abaixo.</p> : <>
                <label htmlFor="exercicio-resposta" className="sr-only">{ex.tipo === "previsao_saida" ? "Saída do código" : "Sua resposta"}</label>
                <textarea
                  id="exercicio-resposta"
                  value={resposta}
                  onChange={(e) => setResposta(e.target.value)}
                  rows={ex.tipo === "previsao_saida" ? 2 : 5}
                  maxLength={6000}
                  disabled={enviando}
                  placeholder={ex.tipo === "previsao_saida" ? "Digite a saída exata, preservando letras e símbolos..." : "Sua resposta..."}
                  className="w-full border border-border bg-transparent px-4 py-3 font-display text-sm outline-none focus:border-foreground transition-colors resize-none"
                />
                {ex.tipo === "previsao_saida" && <p className="mt-2 text-xs text-muted-foreground">Informe a saída de uma linha. Maiúsculas, símbolos e espaços internos fazem diferença.</p>}
                </>}
                <button
                  type="submit"
                  disabled={enviando || !resposta.trim() || (ex.tipo === "multipla_escolha" && !ex.alternativas)}
                  className="mt-4 bg-primary text-primary-foreground px-8 py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {enviando ? "Corrigindo..." : correcao ? "Enviar novamente" : "Enviar resposta"}
                </button>
              </form>

              {correcao && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-10 border border-border p-6"
                >
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {correcao.resultado === "acertou"
                      ? "Correto"
                      : correcao.resultado === "quase"
                        ? "Quase"
                        : "Revise"}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap">{correcao.feedback}</p>
                  {ex.tipo !== "legado" && !correcao.acertou && (
                    mostrarSolucao && solucao ? <div className="mt-6 text-sm">
                      <p className="font-medium">Solução</p>
                      <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-sm">{solucao.solucao}</pre>
                      {solucao.explicacao && <p className="mt-3 leading-relaxed whitespace-pre-wrap">{solucao.explicacao}</p>}
                    </div> : <button type="button" disabled={revelando || enviando} onClick={verSolucao} className="mt-6 cursor-pointer text-xs underline underline-offset-4 hover:opacity-70 disabled:opacity-40">{revelando ? "Carregando solução…" : "Ver solução"}</button>
                  )}
                  {correcao.acertou && trilhaId && (
                    <Link
                      to="/trilha/$trilhaId"
                      params={{ trilhaId }}
                      search={{ modulo: ex.modulo_id }}
                      className="mt-6 inline-flex text-xs underline hover:opacity-70 transition-opacity"
                    >
                      Continuar a trilha
                    </Link>
                  )}
                </motion.div>
              )}
              <ReportarExercicio key={ex.id} exercicioId={ex.id} />
            </>
          )}
        </main>
      </PageTransition>
    </div>
  );
}

