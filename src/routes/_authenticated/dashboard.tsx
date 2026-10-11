import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";
import { TechnologyBadge } from "@/components/TechnologyBadge";

export const Route = createFileRoute("/_authenticated/dashboard")({
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

  useEffect(() => {
    (async () => {
      const { data: ts } = await supabase
        .from("trilhas")
        .select("id, titulo, linguagem, nivel, descricao")
        .order("criado_em", { ascending: false });

      const { data: mods } = await supabase.from("modulos").select("id, trilha_id");
      const { data: exs } = await supabase.from("exercicios").select("id, modulo_id");
      const { data: resps } = await supabase.from("respostas").select("exercicio_id, acertou");

      const modTrilha = new Map((mods ?? []).map((m) => [m.id, m.trilha_id]));
      const exTrilha = new Map(
        (exs ?? []).map((e) => [e.id, modTrilha.get(e.modulo_id) ?? ""]),
      );

      const total = new Map<string, number>();
      exTrilha.forEach((tid) => total.set(tid, (total.get(tid) ?? 0) + 1));

      const acertos = new Map<string, number>();
      (resps ?? []).forEach((r) => {
        if (!r.acertou) return;
        const tid = exTrilha.get(r.exercicio_id);
        if (tid) acertos.set(tid, (acertos.get(tid) ?? 0) + 1);
      });

      setTrilhas(
        (ts ?? []).map((t) => ({
          ...t,
          total: total.get(t.id) ?? 0,
          acertos: acertos.get(t.id) ?? 0,
        })),
      );
      setCarregando(false);
    })();
  }, []);

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
                Escolha uma linguage/framework ou uma dúvida e a nossa IA monta a trilha completa para você.
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
            <p className="mt-16 text-sm text-muted-foreground">Carregando...</p>
          ) : trilhas.length === 0 ? (
            <div className="mt-16 border border-dashed border-border p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Você ainda não tem trilhas. Crie a primeira e comece a estudar.
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
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
                        <div className="h-[2px] bg-border">
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
        </main>
      </PageTransition>
    </div>
  );
}

