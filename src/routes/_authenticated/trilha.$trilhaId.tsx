import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";
import { Markdown } from "@/components/Markdown";

export const Route = createFileRoute("/_authenticated/trilha/$trilhaId")({
  component: TrilhaPage,
});

interface Modulo {
  id: string;
  titulo: string;
  conteudo: string;
  ordem: number;
  exercicios: { id: string; pergunta: string; ordem: number }[];
}

function TrilhaPage() {
  const { trilhaId } = Route.useParams();
  const [trilha, setTrilha] = useState<{ titulo: string; descricao: string | null; linguagem: string } | null>(
    null,
  );
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [feitos, setFeitos] = useState<Set<string>>(new Set());
  const [aberto, setAberto] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: t } = await supabase
        .from("trilhas")
        .select("titulo, descricao, linguagem")
        .eq("id", trilhaId)
        .maybeSingle();
      setTrilha(t ?? null);

      const { data: mods } = await supabase
        .from("modulos")
        .select("id, titulo, conteudo, ordem")
        .eq("trilha_id", trilhaId)
        .order("ordem");

      const ids = (mods ?? []).map((m) => m.id);
      const { data: exs } = ids.length
        ? await supabase
            .from("exercicios")
            .select("id, pergunta, ordem, modulo_id")
            .in("modulo_id", ids)
            .order("ordem")
        : { data: [] };

      const { data: resps } = await supabase.from("respostas").select("exercicio_id, acertou");
      setFeitos(new Set((resps ?? []).filter((r) => r.acertou).map((r) => r.exercicio_id)));

      setModulos(
        (mods ?? []).map((m) => ({
          ...m,
          exercicios: (exs ?? []).filter((e) => e.modulo_id === m.id),
        })),
      );
      setAberto(mods?.[0]?.id ?? null);
      setCarregando(false);
    })();
  }, [trilhaId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageTransition>
        <main className="max-w-3xl mx-auto px-6 pt-32 pb-24">
          <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar
          </Link>

          {carregando ? (
            <p className="mt-12 text-sm text-muted-foreground">Carregando...</p>
          ) : !trilha ? (
            <p className="mt-12 text-sm text-muted-foreground">Trilha não encontrada.</p>
          ) : (
            <>
              <p className="mt-10 text-xs uppercase tracking-widest text-muted-foreground">
                {trilha.linguagem}
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold">
                {trilha.titulo}
              </h1>
              {trilha.descricao && <p className="mt-4 text-sm text-muted-foreground">{trilha.descricao}</p>}

              <div className="mt-14 divide-y divide-border border-y border-border">
                {modulos.map((m, i) => {
                  const total = m.exercicios.length;
                  const ok = m.exercicios.filter((e) => feitos.has(e.id)).length;
                  const concluido = total > 0 && ok === total;
                  const open = aberto === m.id;

                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <button
                        onClick={() => setAberto(open ? null : m.id)}
                        className="w-full py-6 flex items-center gap-4 text-left group"
                      >
                        <span className="font-display text-xs text-muted-foreground w-6">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1 text-sm font-medium group-hover:opacity-70 transition-opacity">
                          {m.titulo}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {concluido ? "concluído" : `${ok}/${total}`}
                        </span>
                      </button>

                      {open && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="overflow-hidden pb-8 pl-10"
                        >
                          <Markdown>{m.conteudo}</Markdown>


                          <div className="mt-8 space-y-2">
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">
                              Exercícios
                            </p>
                            {m.exercicios.map((e) => (
                              <Link
                                key={e.id}
                                to="/exercicio/$id"
                                params={{ id: e.id }}
                                className="block border border-border px-4 py-3 text-sm hover:border-foreground transition-colors"
                              >
                                <span className="text-muted-foreground mr-2">
                                  {feitos.has(e.id) ? "✓" : "○"}
                                </span>
                                {e.pergunta}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </PageTransition>
    </div>
  );
}

