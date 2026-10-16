import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Mic, Square, Send, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { toast } from "sonner";
import { consultarTutor, perguntarTutor, avaliarTutor } from "@/lib/tutor.functions";
import type { CursorTutor, InteracaoTutor } from "@/lib/tutor.shared";
import { formatarTempoLimite, proximoReinicioDiario } from "@/lib/trilha-limite";
import { Markdown } from "./Markdown";
import { useDitado } from "@/hooks/useDitado";

export function TutorAtlas({ moduloId, titulo }: { moduloId: string; titulo: string }) {
  const [aberto, setAberto] = useState(false);
  return <>
    <button type="button" onClick={() => setAberto(true)} className="mt-5 inline-flex cursor-pointer items-center gap-2 border border-border px-4 py-2 text-xs hover:border-foreground transition-colors">
      <MessageCircle className="h-4 w-4" aria-hidden="true" />Perguntar ao Atlas
    </button>
    {aberto && <ConversaAtlas key={moduloId} moduloId={moduloId} titulo={titulo} onClose={() => setAberto(false)} />}
  </>;
}

function ConversaAtlas({ moduloId, titulo, onClose }: { moduloId: string; titulo: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const fim = useRef<HTMLDivElement>(null);
  const ativo = useRef(true);
  const atualizando = useRef(false);
  const [itens, setItens] = useState<InteracaoTutor[]>([]);
  const [texto, setTexto] = useState("");
  const textoAtual = useRef(texto);
  textoAtual.current = texto;
  const ditado = useDitado(transcricao => {
    const anterior = textoAtual.current;
    const proximo = `${anterior}${anterior && !/\s$/.test(anterior) ? " " : ""}${transcricao}`;
    if (proximo.length > 1500) { ditado.parar(); toast.info("O limite da pergunta é de 1.500 caracteres."); }
    textoAtual.current = proximo.slice(0, 1500);
    setTexto(textoAtual.current);
  });
  const [restantes, setRestantes] = useState<number | null>(null);
  const [reiniciaEm, setReiniciaEm] = useState(proximoReinicioDiario);
  const [agora, setAgora] = useState(Date.now);
  const [cursor, setCursor] = useState<CursorTutor | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [avaliando, setAvaliando] = useState<string | null>(null);
  const ler = useServerFn(consultarTutor);
  const enviar = useServerFn(perguntarTutor);
  const avaliar = useServerFn(avaliarTutor);
  const pendente = enviando || itens.some(i => i.estado === "pendente" && Date.parse(i.criado_em) + 120_000 > agora);

  async function atualizar(anteriores = false, manterHistorico = false) {
    if (atualizando.current) return;
    atualizando.current = true;
    try {
      const data = await ler({ data: { moduloId, ...(anteriores && cursor ? { cursor } : {}) } });
      if (!ativo.current) return;
      setItens(old => anteriores ? [...data.itens, ...old.filter(i => !data.itens.some(x => x.id === i.id))]
        : manterHistorico ? [...new Map([...old, ...data.itens].map(i => [i.id, i])).values()].sort((a, b) => a.criado_em.localeCompare(b.criado_em) || a.id.localeCompare(b.id)) : data.itens);
      if (!manterHistorico) setCursor(data.cursor);
      setRestantes(data.restantes); setReiniciaEm(data.reiniciaEm); setErro(false);
    } catch { if (ativo.current) setErro(true); }
    finally { atualizando.current = false; if (ativo.current) setCarregando(false); }
  }

  useEffect(() => {
    ativo.current = true;
    const el = dialog.current;
    el?.showModal();
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    void atualizar();
    return () => { ativo.current = false; el?.close(); document.body.style.overflow = anterior; };
  }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      setAgora(Date.now());
      if (!document.hidden && !enviando) void atualizar(false, true);
    }, pendente ? 4000 : 60_000);
    return () => clearInterval(timer);
  }, [pendente, enviando]);
  useEffect(() => { fim.current?.scrollIntoView({ block: "nearest" }); }, [enviando, itens.at(-1)?.id, itens.at(-1)?.estado]);

  async function perguntar(event: React.FormEvent) {
    event.preventDefault();
    if (!texto.trim() || ditado.ouvindo || pendente || carregando || erro || restantes === null || (restantes === 0 && agora < reiniciaEm)) return;
    const pergunta = texto.trim();
    const id = crypto.randomUUID();
    setEnviando(true); setTexto("");
    setItens(old => [...old, { id, pergunta, resposta: null, estado: "pendente", avaliacao: null, criado_em: new Date().toISOString() }]);
    try {
      const data = await enviar({ data: { id, moduloId, pergunta } });
      if (!ativo.current) return;
      setRestantes(data.restantes); setReiniciaEm(data.reiniciaEm);
      if (data.status === "ok") setItens(old => old.map(i => i.id === id ? data.interacao : i));
      else { setItens(old => old.filter(i => i.id !== id)); setTexto(pergunta); toast.error(data.status === "limite" ? "Limite diário de mensagens do Atlas atingido." : data.status === "pendente" ? "Aguarde a consulta em andamento." : "O Atlas está indisponível no momento."); }
    } catch {
      if (ativo.current) { toast.error("Não foi possível confirmar a resposta. Atualize a conversa antes de tentar novamente."); setItens(old => old.filter(i => i.id !== id)); setTexto(pergunta); setErro(true); }
    } finally { if (ativo.current) { setEnviando(false); void atualizar(false, true); } }
  }

  async function votar(id: string, avaliacao: 1 | -1) {
    if (avaliando) return;
    setAvaliando(id);
    try { await avaliar({ data: { id, avaliacao } }); if (ativo.current) setItens(old => old.map(i => i.id === id ? { ...i, avaliacao } : i)); }
    catch { toast.error("Não foi possível salvar sua avaliação."); }
    finally { if (ativo.current) setAvaliando(null); }
  }

  return <dialog ref={dialog} onCancel={e => { e.preventDefault(); onClose(); }} aria-labelledby="atlas-titulo" aria-describedby="atlas-modulo"
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none bg-black/50 text-foreground backdrop:bg-transparent open:flex open:justify-end">
    <section className="flex h-full w-full min-w-0 flex-col border-l border-border bg-[#050505] sm:max-w-[460px]">
      <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-5">
        <div className="min-w-0"><h2 id="atlas-titulo" className="flex items-center gap-2 font-display text-lg font-bold"><img src="/icons/rumo.svg" alt="" className="h-4 w-4" />Rumo Atlas</h2><p id="atlas-modulo" className="mt-2 truncate text-xs text-muted-foreground">{titulo}</p></div>
        <button type="button" onClick={onClose} aria-label="Fechar tutor" className="cursor-pointer p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2"><X className="h-5 w-5" /></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
        {carregando ? <p role="status" className="text-sm text-muted-foreground">Carregando conversa…</p> : <>
          {cursor && <button type="button" onClick={() => void atualizar(true)} className="mb-5 cursor-pointer text-xs underline">Carregar mensagens anteriores</button>}
          {itens.length === 0 && <p className="text-sm leading-relaxed text-muted-foreground">Olá! Posso explicar este módulo e oferecer pistas para os exercícios. Qual é sua dúvida?</p>}
          {itens.map(i => <div key={i.id} className="mb-6 space-y-3">
            <div className="ml-6 rounded-[4px] border border-border bg-[#111] p-3"><p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Você</p><p className="whitespace-pre-wrap break-words text-sm">{i.pergunta}</p></div>
            <div className="min-w-0 rounded-[4px] border border-border p-3"><p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Atlas</p>
              {i.estado === "concluida" && i.resposta ? <><Markdown>{i.resposta}</Markdown><div className="mt-3 flex gap-2" aria-label="Avaliar resposta">
                {([1, -1] as const).map(v => <button key={v} type="button" onClick={() => void votar(i.id, v)} disabled={avaliando === i.id} aria-label={v === 1 ? "Resposta útil" : "Resposta não foi útil"} aria-pressed={i.avaliacao === v} className={`cursor-pointer rounded-[3px] border p-2 transition-colors hover:border-foreground disabled:opacity-40 ${i.avaliacao === v ? "border-foreground text-foreground" : "border-border text-muted-foreground"}`}>{v === 1 ? <ThumbsUp className="h-3.5 w-3.5" /> : <ThumbsDown className="h-3.5 w-3.5" />}</button>)}
              </div></> : <p role="status" className="text-sm text-muted-foreground">{i.estado === "pendente" && Date.parse(i.criado_em) + 120_000 > agora ? "Atlas está pensando…" : "Não foi possível responder. Esta tentativa conta no limite diário."}</p>}
            </div>
          </div>)}
        </>}
        {erro && <div role="alert" className="mt-4 text-sm text-muted-foreground">Não foi possível atualizar a conversa. <button type="button" onClick={() => void atualizar()} className="cursor-pointer underline">Tentar novamente</button></div>}
        <div ref={fim} />
      </div>
      <form onSubmit={perguntar} className="border-t border-border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <p className="mb-3 text-xs text-muted-foreground" role="status">{restantes === null ? "Até 5 mensagens por dia." : `${restantes} de 5 mensagens restantes hoje.`}</p>
        {restantes === 0 && agora < reiniciaEm && <div role="status" className="mb-4 rounded-[4px] border border-border bg-[#0b0b0b] p-3 text-sm"><p>Você atingiu o limite de mensagens do Atlas. Tente novamente mais tarde.</p><strong className="mt-2 block text-xs">Tempo até seu limite acabar: {formatarTempoLimite(reiniciaEm, agora)} (horas e minutos)</strong></div>}
        <label htmlFor="atlas-pergunta" className="sr-only">Sua dúvida sobre este módulo</label>
        <textarea id="atlas-pergunta" value={texto} onChange={e => setTexto(e.target.value)} maxLength={1500} rows={3} placeholder="Não entendi esse exemplo…"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
          className="w-full resize-none rounded-[3px] border border-border bg-black px-3 py-3 text-sm outline-none focus:border-foreground" />
        <div className="mt-2 flex items-center justify-between gap-3"><span className="text-[10px] text-muted-foreground">{texto.length}/1500 · Powered by Gemini</span><div className="flex shrink-0 gap-2">
          <button type="button" onClick={ditado.alternar} disabled={!ditado.suportado || pendente} aria-pressed={ditado.ouvindo} aria-label={ditado.ouvindo ? "Parar ditado" : "Ditar pergunta"}
            title={ditado.suportado ? "Transcrição pelo navegador; pode utilizar um serviço externo de voz." : "Ditado indisponível neste navegador. Digite sua pergunta."}
            className={`cursor-pointer rounded-[3px] border p-2 transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40 ${ditado.ouvindo ? "border-red-400 text-red-400" : "border-border text-muted-foreground"}`}>
            {ditado.ouvindo ? <Square className="h-4 w-4" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button type="submit" disabled={ditado.ouvindo || pendente || carregando || erro || restantes === null || !texto.trim() || (restantes === 0 && agora < reiniciaEm)} className="inline-flex cursor-pointer items-center gap-2 bg-primary px-4 py-2 text-xs text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-3.5 w-3.5" aria-hidden="true" />Enviar</button>
        </div></div>
        {ditado.ouvindo && <p role="status" className="mt-2 text-xs text-muted-foreground">Ouvindo… Pare o ditado e revise o texto antes de enviar.</p>}
      </form>
    </section>
  </dialog>;
}
