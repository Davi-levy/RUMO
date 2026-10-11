import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { TriangleAlert, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { consultarLimiteDiario, gerarEsqueleto, gerarModulo } from "@/lib/trilha.functions";
import { MENSAGEM_LIMITE_AVALIACOES, MENSAGEM_TEMA_RECUSADO, NIVEIS, type Nivel } from "@/lib/trilha.shared";
import { executarGeracaoTrilha } from "@/lib/trilha-generation";
import { Navbar } from "@/components/Navbar";
import { LanguageIcon } from "@/components/LanguageIcon";
import { PageTransition } from "@/components/PageTransition";
import { GlyphMatrix } from "@/components/GlyphMatrix";
import { LimiteTrilhasPopup } from "@/components/LimiteTrilhasPopup";
import { MENSAGEM_LIMITE_DIARIO, proximoReinicioDiario } from "@/lib/trilha-limite";

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
  const consultarLimite = useServerFn(consultarLimiteDiario);
  const [restantes, setRestantes] = useState<number | null>(null);
  const [limiteAtingido, setLimiteAtingido] = useState(false);
  const [avaliacoesRestantes, setAvaliacoesRestantes] = useState<number | null>(null);
  const [limiteAvaliacoes, setLimiteAvaliacoes] = useState(false);
  const [avisoRecusa, setAvisoRecusa] = useState(false);
  const [reiniciaEm, setReiniciaEm] = useState(() => proximoReinicioDiario());
  useEffect(() => {
    let ativo = true;
    const atualizar = () => {
      if (document.hidden) return;
      void consultarLimite().then(limite => {
        if (ativo) {
          setRestantes(limite.restantes);
          setAvaliacoesRestantes(limite.avaliacoesRestantes);
          setReiniciaEm(limite.reiniciaEm);
          if (limite.restantes > 0) setLimiteAtingido(false);
          if (limite.avaliacoesRestantes > 0) setLimiteAvaliacoes(false);
        }
      }).catch(() => {}); // A reserva no servidor continua sendo a verificação definitiva.
    };
    atualizar();
    // Atualiza entre abas e libera o botão quando o dia vira com a página aberta.
    window.addEventListener("focus", atualizar);
    const timer = window.setInterval(atualizar, 60_000);
    return () => {
      ativo = false;
      window.removeEventListener("focus", atualizar);
      window.clearInterval(timer);
    };
  }, [consultarLimite]);
  const navigate = useNavigate();
  const geracaoAtual = useRef<AbortController | null>(null);
  useEffect(() => () => geracaoAtual.current?.abort(), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (gerando) return;
    if (restantes === 0 && Date.now() < reiniciaEm) {
      setLimiteAtingido(true);
      return;
    }
    if (avaliacoesRestantes === 0 && Date.now() < reiniciaEm) {
      setLimiteAvaliacoes(true);
      return;
    }
    if (!linguagem.trim()) return;
    const tema = linguagem.trim();
    const controller = new AbortController();
    geracaoAtual.current = controller;
    const { signal } = controller;
    setGerando(true);
    setAvisoRecusa(false);
    setPassos([{ texto: "Planejando os módulos", feito: false }]);

    const concluir = (i: number) =>
      setPassos((p) => p.map((x, idx) => (idx === i ? { ...x, feito: true } : x)));
    let temaAprovado = false;

    try {
      const limite = await consultarLimite();
      signal.throwIfAborted();
      setRestantes(limite.restantes);
      setAvaliacoesRestantes(limite.avaliacoesRestantes);
      setReiniciaEm(limite.reiniciaEm);
      if (limite.restantes === 0) {
        setLimiteAtingido(true);
        return;
      }
      if (limite.avaliacoesRestantes === 0) {
        setLimiteAvaliacoes(true);
        return;
      }
      const { data: user, error: authError } = await supabase.auth.getUser();
      if (authError || !user.user) throw new Error("Sessão expirada.");
      signal.throwIfAborted();
      const userId = user.user.id;

      const trilhaId = await executarGeracaoTrilha({ linguagem: tema, nivel }, {
        signal,
        gerarEsqueleto: async data => {
          const resultado = await criarEsqueleto({ data });
          signal.throwIfAborted();
          setAvaliacoesRestantes(resultado.avaliacoesRestantes);
          if (resultado.status === "fora_do_escopo") {
            if (resultado.avaliacoesRestantes === 0) setLimiteAvaliacoes(true);
            else setAvisoRecusa(true);
            throw new Error(MENSAGEM_TEMA_RECUSADO);
          }
          temaAprovado = true;
          return resultado.plano;
        },
        gerarModulo: data => criarModulo({ data }),
        onPlano: plano => setPassos([
          { texto: "Planejando os módulos", feito: true },
          ...plano.modulos.map(m => ({ texto: `Escrevendo: ${m.titulo}`, feito: false })),
          { texto: "Salvando trilha", feito: false },
        ]),
        onModulo: i => concluir(i + 1),
        salvar: async ({ esqueleto, modulos }) => {
          let id: string | undefined;
          try {
            signal.throwIfAborted();
            const { data: trilha, error } = await supabase.from("trilhas").insert({
              usuario_id: userId, linguagem: tema, nivel,
              titulo: esqueleto.titulo, descricao: esqueleto.descricao,
            }).select("id").single();
            if (error || !trilha) throw new Error(error?.message ?? "Falha ao salvar a trilha.");
            id = trilha.id;
            signal.throwIfAborted();

            for (const [i, item] of modulos.entries()) {
              const { data: modulo, error: errModulo } = await supabase.from("modulos").insert({
                trilha_id: id, titulo: item.titulo, conteudo: item.gerado.conteudo, ordem: i,
              }).select("id").single();
              if (errModulo || !modulo) throw new Error(errModulo?.message ?? "Falha ao salvar o módulo.");
              signal.throwIfAborted();
              const { error: errEx } = await supabase.from("exercicios").insert(
                item.gerado.exercicios.map((ex, j) => ({
                  modulo_id: modulo.id, pergunta: ex.pergunta, resposta_esperada: ex.resposta_esperada,
                  dica: ex.dica ?? null, explicacao: ex.explicacao ?? null, ordem: j,
                })),
              );
              if (errEx) throw new Error(errEx.message);
              signal.throwIfAborted();
            }
            concluir(modulos.length + 1);
            return id;
          } catch (error) {
            if (id) {
              // RLS restringe a exclusão ao dono; o banco remove módulos e exercícios em cascata.
              const { data: removidas, error: cleanupError } = await supabase.from("trilhas")
                .delete().eq("id", id).eq("usuario_id", userId).select("id");
              if (cleanupError || !removidas?.length) {
                throw new Error("Falha ao salvar a trilha. Também não foi possível remover os dados incompletos.");
              }
            }
            throw error;
          }
        },
      });

      signal.throwIfAborted();
      toast.success("Trilha criada!");
      await navigate({ to: "/trilha/$trilhaId", params: { trilhaId } });
    } catch (err) {
      if (!signal.aborted) {
        if (err instanceof Error && err.message === MENSAGEM_LIMITE_DIARIO) {
          setLimiteAtingido(true);
        } else if (err instanceof Error && err.message === MENSAGEM_LIMITE_AVALIACOES) {
          setLimiteAvaliacoes(true);
        } else if (err instanceof Error && err.message === MENSAGEM_TEMA_RECUSADO) {
          // A recusa já aparece junto ao campo ou no popup de avaliações esgotadas.
        } else {
          toast.error(err instanceof Error ? err.message : "Erro ao gerar trilha");
        }
      }
    } finally {
      if (!signal.aborted) {
        setGerando(false);
        void consultarLimite().then(limite => {
          setRestantes(limite.restantes);
          setAvaliacoesRestantes(limite.avaliacoesRestantes);
          setReiniciaEm(limite.reiniciaEm);
          if (!temaAprovado && limite.avaliacoesRestantes === 0 && limite.restantes > 0) {
            setLimiteAvaliacoes(true);
          }
        }).catch(() => {});
      }
      if (geracaoAtual.current === controller) geracaoAtual.current = null;
    }
  }

  const feitos = passos.filter((p) => p.feito).length;

  return (
    <div className="relative isolate min-h-screen bg-background">
      <div aria-hidden="true" className="nova-trilha-background pointer-events-none absolute inset-x-0 top-0 -z-10 h-1/2 overflow-hidden">
        <GlyphMatrix />
      </div>
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
                Diga o que você quer aprender sobre programação e desenvolvimento. A IA monta os módulos, o conteúdo e os exercícios.
              </p>
              <p className="mt-3 text-xs text-muted-foreground" role="status">
                {restantes === 0
                  ? "Limite diário atingido. Você poderá gerar novas trilhas após 00h (horário de Brasília)."
                  : `Até 2 gerações por dia${restantes === null ? "" : ` · ${restantes} restante${restantes === 1 ? "" : "s"} hoje`}.`}
                {" "}Tentativas interrompidas também contam no limite.
              </p>
              <p className="mt-2 text-xs text-muted-foreground" role="status">
                Até 5 avaliações de tema por dia{avaliacoesRestantes === null ? "" : ` · ${avaliacoesRestantes} restante${avaliacoesRestantes === 1 ? "" : "s"} hoje`}.
                {" "}Temas recusados não descontam das 2 gerações.
              </p>

              <form onSubmit={submit} className="mt-12 space-y-8">
                <div>
                  <label htmlFor="trilha-tema" className="text-xs uppercase tracking-widest text-muted-foreground">
                    Linguagem ou framework
                  </label>
                  {avisoRecusa && avaliacoesRestantes !== null && avaliacoesRestantes > 0 && (
                    <div id="trilha-tema-recusa" role="alert" className="mt-3 flex items-start gap-3 rounded-[6px] border border-border bg-[#0d0d0d] px-4 py-3 text-sm">
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      <p className="flex-1 leading-relaxed text-muted-foreground">
                        Mantenha os pedidos relacionados a programação apenas! Você possui {avaliacoesRestantes} tentativa{avaliacoesRestantes === 1 ? " restante" : "s restantes"}.
                      </p>
                      <button type="button" aria-label="Fechar aviso de tema recusado" onClick={() => setAvisoRecusa(false)} className="cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-foreground">
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                  <input
                    id="trilha-tema"
                    maxLength={80}
                    aria-describedby={avisoRecusa && (avaliacoesRestantes ?? 0) > 0 ? "trilha-tema-recusa" : undefined}
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
                        className="inline-flex items-center gap-1.5 border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                      >
                        <LanguageIcon language={s} />
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
                  disabled={!linguagem.trim() && restantes !== 0 && avaliacoesRestantes !== 0}
                  className="w-full bg-primary text-primary-foreground py-4 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Gerar trilha com IA
                </button>
              </form>
            </>
          )}
        </main>
      </PageTransition>
      {limiteAtingido && (
        <LimiteTrilhasPopup reiniciaEm={reiniciaEm} onClose={() => setLimiteAtingido(false)} />
      )}
      {!limiteAtingido && limiteAvaliacoes && (
        <LimiteTrilhasPopup tipo="avaliacoes" reiniciaEm={reiniciaEm} onClose={() => setLimiteAvaliacoes(false)} />
      )}
    </div>
  );
}

