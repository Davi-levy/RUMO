import { useEffect, useRef, useState } from "react";
import { formatarTempoLimite } from "@/lib/trilha-limite";

export function LimiteTrilhasPopup({ reiniciaEm, onClose, tipo = "trilhas" }: {
  reiniciaEm: number;
  onClose: () => void;
  tipo?: "trilhas" | "avaliacoes";
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tempo, setTempo] = useState(() => formatarTempoLimite(reiniciaEm));

  useEffect(() => {
    const elemento = dialog.current;
    elemento?.showModal();
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      elemento?.close();
      document.body.style.overflow = overflowAnterior;
    };
  }, []);

  useEffect(() => {
    const atualizar = () => setTempo(formatarTempoLimite(reiniciaEm));
    atualizar();
    const timer = window.setInterval(atualizar, 1000);
    return () => window.clearInterval(timer);
  }, [reiniciaEm]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="limite-trilhas-titulo"
      aria-describedby="limite-trilhas-descricao limite-trilhas-tempo"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none items-center justify-center bg-background/60 px-6 text-foreground open:flex backdrop:bg-transparent backdrop:backdrop-blur-md"
    >
      <div className="w-full max-w-lg rounded-[14px] border border-border bg-background p-8 sm:p-10">
        <h2 id="limite-trilhas-titulo" className="font-display text-2xl font-bold">{tipo === "avaliacoes" ? "Limite de tentativas" : "Limite de trilhas"}</h2>
        <p id="limite-trilhas-descricao" className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {tipo === "avaliacoes"
            ? "Você atingiu o limite de tentativas para avaliar temas. As trilhas do RUMO devem estar relacionadas a programação e desenvolvimento. Tente gerar trilhas novamente mais tarde."
            : "Você já criou 2 trilhas hoje, o máximo permitido por enquanto. Aguarde o tempo do limite acabar para criar mais"}
        </p>
        <p id="limite-trilhas-tempo" className="mt-6 font-display text-sm font-bold tracking-tight">
          <strong>Tempo até seu limite acabar: {tempo} (horas e minutos)</strong>
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full cursor-pointer rounded-[10px] bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
        >
          Entendi
        </button>
      </div>
    </dialog>
  );
}
