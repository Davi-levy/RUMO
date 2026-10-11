import { useEffect, useRef } from "react";
import { TriangleAlert } from "lucide-react";

export function CancelarTrilhaPopup({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const elemento = dialog.current;
    elemento?.showModal();
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      elemento?.close();
      document.body.style.overflow = anterior;
    };
  }, []);

  return (
    <dialog ref={dialog} aria-labelledby="cancelar-trilha-titulo" aria-describedby="cancelar-trilha-descricao"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none items-center justify-center bg-background/60 px-6 text-foreground open:flex backdrop:bg-transparent backdrop:backdrop-blur-md">
      <div className="w-full max-w-lg rounded-[4px] border border-border bg-[#0a0a0a] p-6 sm:p-8">
        <h2 id="cancelar-trilha-titulo" className="flex items-center gap-3 text-lg font-semibold">
          <TriangleAlert className="h-5 w-5 shrink-0" aria-hidden="true" />Cancelar geração da trilha?
        </h2>
        <p id="cancelar-trilha-descricao" className="mt-3 text-sm leading-relaxed text-muted-foreground">
          O conteúdo desta geração será descartado. Se a geração já foi iniciada, a tentativa continuará contando no limite diário.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button autoFocus type="button" onClick={onClose}
            className="cursor-pointer rounded-[4px] border border-border px-4 py-3 text-sm font-medium transition-colors hover:border-foreground hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
            Continuar gerando
          </button>
          <button type="button" onClick={onConfirm}
            className="cursor-pointer rounded-[4px] bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
            Cancelar Trilha
          </button>
        </div>
      </div>
    </dialog>
  );
}
