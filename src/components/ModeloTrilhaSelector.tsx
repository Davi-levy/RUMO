import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export function ModeloTrilhaSelector() {
  const [aberto, setAberto] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const option = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!aberto) return;
    option.current?.focus();
    const fechar = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setAberto(false);
    };
    document.addEventListener("pointerdown", fechar);
    return () => document.removeEventListener("pointerdown", fechar);
  }, [aberto]);

  function selecionar() {
    setAberto(false);
    trigger.current?.focus();
  }

  return (
    <div ref={root} className="relative w-fit max-w-full"
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setAberto(false); }}
      onKeyDown={event => {
        if (event.key === "Escape" && aberto) { event.preventDefault(); selecionar(); }
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault();
          if (!aberto) setAberto(true);
          else option.current?.focus();
        }
      }}>
      <button ref={trigger} type="button" aria-haspopup="menu" aria-expanded={aberto} aria-controls={id}
        aria-label="Modelo de IA: Rumo Atlas" onClick={() => setAberto(value => !value)}
        className="inline-flex max-w-full cursor-pointer items-center gap-2 rounded-[4px] border border-border bg-black px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-white/25 hover:bg-[#060606] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
        <img src="/icons/rumo.svg" alt="" width={15} height={13} className="h-[13px] w-[15px] shrink-0" />
        <span className="opacity-80">Rumo Atlas</span>
        <ChevronDown className={`ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${aberto ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {aberto && (
        <div id={id} role="menu" aria-label="Modelo de IA" className="absolute left-0 top-full z-20 mt-2 w-full min-w-0 rounded-[4px] border border-border bg-black p-1 shadow-xl">
          <button ref={option} type="button" role="menuitemradio" aria-checked="true" onClick={selecionar}
            className="flex w-full cursor-pointer items-center gap-2 rounded-[2px] px-2 py-3 text-left text-xs text-foreground transition-colors hover:bg-[#060606] focus:bg-[#060606] focus:outline-none">
            <img src="/icons/rumo.svg" alt="" width={15} height={13} className="h-[13px] w-[15px] shrink-0" />
            <span className="flex-1">
              <span className="block">Rumo Atlas</span>
              <span className="mt-1 block text-[10px] text-muted-foreground">Powered by Gemini</span>
            </span>
            <Check className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
