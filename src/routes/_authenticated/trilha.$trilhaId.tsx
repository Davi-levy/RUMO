import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";
import { Markdown } from "@/components/Markdown";
import { TechnologyBadge } from "@/components/TechnologyBadge";
import { TrilhaVideos } from "@/components/TrilhaVideos";
import { TrilhaMenu, type ItemMenuTrilha } from "@/components/TrilhaMenu";
import { TutorAtlas } from "@/components/TutorAtlas";

const VIDEOS = "videos";

export const Route = createFileRoute("/_authenticated/trilha/$trilhaId")({
  head: () => ({ meta: [{ title: "Estudar trilha | RUMO" }] }),
  // O módulo aberto fica na URL: recarregar a página ou compartilhar o link mantém a posição.
  validateSearch: (search: Record<string, unknown>): { modulo?: string } =>
    typeof search.modulo === "string" && search.modulo ? { modulo: search.modulo } : {},
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
  const { modulo: moduloUrl } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [trilha, setTrilha] = useState<{ titulo: string; descricao: string | null; linguagem: string } | null>(
    null,
  );
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [feitos, setFeitos] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    const controller = new AbortController();
    setCarregando(true);
    setErro(false);
    setTrilha(null);
    setModulos([]);
    setFeitos(new Set());
    (async () => {
      try {
        const { data: t, error: erroTrilha } = await supabase
          .from("trilhas")
          .select("titulo, descricao, linguagem")
          .eq("id", trilhaId)
          .abortSignal(controller.signal).maybeSingle();
        if (erroTrilha) throw erroTrilha;
        if (!ativo || !t) return;

        const { data: mods, error: erroModulos } = await supabase
          .from("modulos")
          .select("id, titulo, conteudo, ordem")
          .eq("trilha_id", trilhaId)
          .order("ordem").abortSignal(controller.signal);
        if (erroModulos) throw erroModulos;
        if (!ativo) return;

        const ids = (mods ?? []).map((m) => m.id);
        const { data: exs, error: erroExercicios } = ids.length
          ? await supabase
              .from("exercicios")
              .select("id, pergunta, ordem, modulo_id")
              .in("modulo_id", ids)
              .order("ordem").abortSignal(controller.signal)
          : { data: [], error: null };
        if (erroExercicios) throw erroExercicios;
        if (!ativo) return;

        const exercicioIds = (exs ?? []).map(e => e.id);
        const { data: resps, error: erroRespostas } = exercicioIds.length
          ? await supabase.from("respostas").select("exercicio_id, acertou").in("exercicio_id", exercicioIds).abortSignal(controller.signal)
          : { data: [], error: null };
        if (erroRespostas) throw erroRespostas;
        if (!ativo) return;
        setTrilha(t);
        setFeitos(new Set((resps ?? []).filter((r) => r.acertou).map((r) => r.exercicio_id)));

        setModulos(
          (mods ?? []).map((m) => ({
            ...m,
            exercicios: (exs ?? []).filter((e) => e.modulo_id === m.id),
          })),
        );
      } catch {
        if (ativo) setErro(true);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => { ativo = false; controller.abort(); };
  }, [trilhaId, tentativa]);

  const resumo = useMemo(
    () =>
      modulos.map((m) => {
        const total = m.exercicios.length;
        const ok = m.exercicios.filter((e) => feitos.has(e.id)).length;
        return { id: m.id, total, ok, concluido: total > 0 && ok === total };
      }),
    [modulos, feitos],
  );

  // Ordem de navegação: módulos e, por último, os vídeos de apoio.
  const sequencia = useMemo(
    () => (modulos.length ? [...modulos.map((m) => m.id), VIDEOS] : []),
    [modulos],
  );

  // Sem módulo na URL (ou com um id inválido), abre o primeiro ainda não concluído.
  const ativoId = useMemo(() => {
    if (moduloUrl && sequencia.includes(moduloUrl)) return moduloUrl;
    return resumo.find((r) => !r.concluido)?.id ?? modulos[0]?.id ?? "";
  }, [moduloUrl, sequencia, resumo, modulos]);

  const moduloAtivo = modulos.find((m) => m.id === ativoId);
  const posicao = sequencia.indexOf(ativoId);
  const anteriorId = posicao > 0 ? sequencia[posicao - 1] : null;
  const proximoId = posicao >= 0 && posicao < sequencia.length - 1 ? sequencia[posicao + 1] : null;

  function selecionar(id: string) {
    void navigate({ search: { modulo: id } });
  }

  // Cada troca de módulo começa do topo do conteúdo.
  useEffect(() => {
    if (ativoId) window.scrollTo({ top: 0 });
  }, [ativoId]);

  const itens: ItemMenuTrilha[] = [
    ...modulos.map((m, i): ItemMenuTrilha => {
      const r = resumo[i];
      return {
        id: m.id,
        numero: String(i + 1).padStart(2, "0"),
        titulo: m.titulo,
        detalhe: r.concluido ? "Concluído" : `${r.ok}/${r.total} exercícios`,
        concluido: r.concluido,
      };
    }),
    { id: VIDEOS, numero: "▶", titulo: "Vídeos de apoio", detalhe: "YouTube", concluido: false },
  ];

  const totalExercicios = resumo.reduce((soma, r) => soma + r.total, 0);
  const totalFeitos = resumo.reduce((soma, r) => soma + r.ok, 0);

  function rotuloDe(id: string) {
    if (id === VIDEOS) return "Vídeos de apoio";
    return modulos.find((m) => m.id === id)?.titulo ?? "";
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageTransition>
        <main className="max-w-6xl mx-auto px-6 pt-32 pb-24">
          <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar
          </Link>

          {carregando ? (
            <p role="status" className="mt-12 text-sm text-muted-foreground">Carregando sua trilha…</p>
          ) : erro ? (
            <div role="alert" className="mt-12 border border-border p-6 text-sm">
              <p>Não foi possível carregar esta trilha.</p>
              <button type="button" onClick={() => setTentativa(t => t + 1)} className="mt-4 cursor-pointer underline hover:opacity-70">Tentar novamente</button>
            </div>
          ) : !trilha ? (
            <p className="mt-12 text-sm text-muted-foreground">Trilha não encontrada.</p>
          ) : (
            <>
              <div className="mt-10 max-w-3xl">
                <TechnologyBadge language={trilha.linguagem} />
                <h1 className="mt-3 font-display text-4xl font-bold">{trilha.titulo}</h1>
                {trilha.descricao && <p className="mt-4 text-sm text-muted-foreground">{trilha.descricao}</p>}
              </div>

              {modulos.length === 0 ? (
                <div className="mt-14 text-sm text-muted-foreground">
                  <p>A geração desta trilha não foi concluída. Nenhum módulo foi salvo.</p>
                  <Link to="/nova-trilha" className="mt-4 inline-block border border-border px-4 py-2 text-foreground">
                    Gerar uma nova trilha
                  </Link>
                </div>
              ) : (
                <div className="mt-12 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14">
                  <TrilhaMenu
                    itens={itens}
                    ativoId={ativoId}
                    onSelecionar={selecionar}
                    feitos={totalFeitos}
                    total={totalExercicios}
                  />

                  <section className="min-w-0 max-w-3xl" aria-live="polite">
                    {ativoId === VIDEOS ? (
                      <div className="[&>section]:mt-0">
                        <TrilhaVideos key={trilhaId} trilhaId={trilhaId} />
                      </div>
                    ) : (
                      moduloAtivo && (
                        <article key={moduloAtivo.id}>
                          <p className="text-xs uppercase tracking-widest text-muted-foreground">
                            Módulo {posicao + 1} de {modulos.length}
                          </p>
                          <h2 className="mt-3 font-display text-3xl font-bold">{moduloAtivo.titulo}</h2>
                          <TutorAtlas key={moduloAtivo.id} moduloId={moduloAtivo.id} titulo={moduloAtivo.titulo} />

                          <div className="mt-8">
                            <Markdown>{moduloAtivo.conteudo}</Markdown>
                          </div>

                          <div className="mt-12 space-y-2">
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Exercícios</p>
                            {moduloAtivo.exercicios.map((e) => (
                              <Link
                                key={e.id}
                                to="/exercicio/$id"
                                params={{ id: e.id }}
                                className="block border border-border px-4 py-3 text-sm hover:border-foreground transition-colors"
                              >
                                <span className="text-muted-foreground mr-2">{feitos.has(e.id) ? "✓" : "○"}</span>
                                {e.pergunta}
                              </Link>
                            ))}
                          </div>
                        </article>
                      )
                    )}

                    <div className="mt-14 flex items-stretch justify-between gap-4 border-t border-border pt-6">
                      {anteriorId ? (
                        <button
                          type="button"
                          onClick={() => selecionar(anteriorId)}
                          className="min-w-0 cursor-pointer text-left text-sm hover:opacity-70 transition-opacity"
                        >
                          <span className="block text-xs uppercase tracking-widest text-muted-foreground">← Anterior</span>
                          <span className="mt-1 block truncate">{rotuloDe(anteriorId)}</span>
                        </button>
                      ) : (
                        <span />
                      )}
                      {proximoId && (
                        <button
                          type="button"
                          onClick={() => selecionar(proximoId)}
                          className="min-w-0 cursor-pointer text-right text-sm hover:opacity-70 transition-opacity"
                        >
                          <span className="block text-xs uppercase tracking-widest text-muted-foreground">Próximo →</span>
                          <span className="mt-1 block truncate">{rotuloDe(proximoId)}</span>
                        </button>
                      )}
                    </div>
                  </section>
                </div>
              )}
            </>
          )}
        </main>
      </PageTransition>
    </div>
  );
}
