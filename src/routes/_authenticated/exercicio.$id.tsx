import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { corrigir, type Correcao } from "@/lib/correcao";
import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";

export const Route = createFileRoute("/_authenticated/exercicio/$id")({
  component: ExercicioPage,
});

interface Ex {
  id: string;
  pergunta: string;
  resposta_esperada: string;
  dica: string | null;
  explicacao: string | null;
  modulo_id: string;
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

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("exercicios")
        .select("id, pergunta, resposta_esperada, dica, explicacao, modulo_id")
        .eq("id", id)
        .maybeSingle();
      setEx(data ?? null);

      if (data) {
        const { data: mod } = await supabase
          .from("modulos")
          .select("trilha_id")
          .eq("id", data.modulo_id)
          .maybeSingle();
        setTrilhaId(mod?.trilha_id ?? null);

        const { data: anterior } = await supabase
          .from("respostas")
          .select("resposta, acertou, feedback")
          .eq("exercicio_id", id)
          .maybeSingle();
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
      setCarregando(false);
    })();
  }, [id]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!ex || !resposta.trim()) return;
    setEnviando(true);

    const res = corrigir(resposta, ex.resposta_esperada, ex.explicacao);
    setCorrecao(res);

    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      const { error } = await supabase.from("respostas").upsert(
        {
          usuario_id: user.user.id,
          exercicio_id: ex.id,
          resposta,
          acertou: res.acertou,
          feedback: res.feedback,
        },
        { onConflict: "usuario_id,exercicio_id" },
      );
      if (error) toast.error("Não foi possível salvar seu progresso.");
    }
    setEnviando(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageTransition>
        <main className="max-w-2xl mx-auto px-6 pt-32 pb-24">
          <button
            onClick={() =>
              trilhaId
                ? navigate({ to: "/trilha/$trilhaId", params: { trilhaId } })
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
              <h1 className="mt-4 font-display text-2xl font-bold leading-snug">{ex.pergunta}</h1>

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
                <textarea
                  value={resposta}
                  onChange={(e) => setResposta(e.target.value)}
                  rows={5}
                  placeholder="Sua resposta..."
                  className="w-full border border-border bg-transparent px-4 py-3 font-display text-sm outline-none focus:border-foreground transition-colors resize-none"
                />
                <button
                  type="submit"
                  disabled={enviando || !resposta.trim()}
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
                  {correcao.acertou && trilhaId && (
                    <Link
                      to="/trilha/$trilhaId"
                      params={{ trilhaId }}
                      className="mt-6 inline-flex text-xs underline hover:opacity-70 transition-opacity"
                    >
                      Continuar a trilha
                    </Link>
                  )}
                </motion.div>
              )}
            </>
          )}
        </main>
      </PageTransition>
    </div>
  );
}

