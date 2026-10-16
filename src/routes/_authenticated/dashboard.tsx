import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";
import { TechnologyBadge } from "@/components/TechnologyBadge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Suas trilhas | RUMO" }] }),
  component: Dashboard,
});

interface TrilhaCard {
  id: string;
  titulo: string;
  linguagem: string;
  nivel: string;
  descricao: string | null;
  total: number;
  acertos: number;
}

const rotulos: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

function Dashboard() {
  const [trilhas, setTrilhas] = useState<TrilhaCard[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [mais, setMais] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    let ativo = true;
    const controller = new AbortController();
    setCarregando(true);
    setErro(false);
    (async () => {
      try {
        const { data, error } = await supabase.rpc("listar_resumo_trilhas", { p_offset: pagina * 12 }).abortSignal(controller.signal);
        if (error) throw error;
        if (!ativo) return;
        setTrilhas((data ?? []).slice(0, 12));
        setMais((data?.length ?? 0) > 12);
      } catch {
        if (ativo) setErro(true);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => { ativo = false; controller.abort(); };
  }, [pagina, tentativa]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageTransition>
        <main className="max-w-5xl mx-auto px-6 pt-32 pb-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="flex items-center gap-2 font-display text-4xl font-bold">
                <span>Suas trilhas</span>
                <img
                  src="/icons/trilhas.png"
                  alt=""
                  aria-hidden="true"
                  width={64}
                  height={64}
                  className="h-16 w-16 shrink-0 object-contain"
                />
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Escolha uma linguagem, um framework ou uma dúvida e a nossa IA monta a trilha completa para você.
              </p>
            </div>
            <Link
              to="/nova-trilha"
              className="bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Nova trilha
            </Link>
          </div>

          {carregando ? (
            <p role="status" className="mt-16 text-sm text-muted-foreground">Carregando suas trilhas…</p>
          ) : erro ? (
            <div role="alert" className="mt-16 border border-border p-6 text-sm">
              <p>Não foi possível carregar suas trilhas.</p>
              <button type="button" onClick={() => setTentativa(t => t + 1)} className="mt-4 cursor-pointer underline hover:opacity-70">Tentar novamente</button>
            </div>
          ) : trilhas.length === 0 ? (
            <div className="mt-16 border border-dashed border-border p-12 text-center">
              <p className="text-sm text-muted-foreground">
                {pagina === 0 ? "Você ainda não tem trilhas. Crie a primeira e comece a estudar." : "Não há trilhas nesta página. Volte à página anterior."}
              </p>
              <Link
                to="/nova-trilha"
                className="mt-6 inline-flex border border-border px-6 py-3 text-sm hover:bg-muted transition-colors"
              >
                Gerar minha primeira trilha
              </Link>
            </div>
          ) : (
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {trilhas.map((t, i) => {
                const pct = t.total ? Math.round((t.acertos / t.total) * 100) : 0;
                return (
                  <motion.div
                    key={t.id}
                    initial={reducedMotion ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reducedMotion ? 0 : i * 0.06, duration: reducedMotion ? 0 : 0.3 }}
                  >
                    <Link
                      to="/trilha/$trilhaId"
                      params={{ trilhaId: t.id }}
                      className="block border border-border p-6 hover:border-foreground transition-colors h-full"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-widest text-muted-foreground">
                        <TechnologyBadge language={t.linguagem} />
                        <span className="shrink-0">{rotulos[t.nivel] ?? t.nivel}</span>
                      </div>
                      <h2 className="mt-4 font-display text-xl font-bold">{t.titulo}</h2>
                      {t.descricao && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{t.descricao}</p>
                      )}
                      <div className="mt-6">
                        <div role="progressbar" aria-label={`Progresso de ${t.titulo}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-[2px] bg-border">
                          <div className="h-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {t.total === 0 ? "Geração incompleta · sem exercícios" : `${t.acertos} de ${t.total} exercícios · ${pct}%`}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
          {!carregando && !erro && (pagina > 0 || mais) && (
            <nav aria-label="Páginas de trilhas" className="mt-8 flex items-center justify-between gap-4 text-sm">
              <button type="button" disabled={pagina === 0} onClick={() => setPagina(p => p - 1)} className="cursor-pointer border border-border px-4 py-2 hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
              <span aria-live="polite">Página {pagina + 1}</span>
              <button type="button" disabled={!mais} onClick={() => setPagina(p => p + 1)} className="cursor-pointer border border-border px-4 py-2 hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40">Próxima</button>
            </nav>
          )}
        </main>
      </PageTransition>
    </div>
  );
}

