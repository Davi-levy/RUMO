import { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface ItemMenuTrilha {
  id: string;
  numero: string;
  titulo: string;
  detalhe: string;
  concluido: boolean;
}

interface Props {
  itens: ItemMenuTrilha[];
  ativoId: string;
  onSelecionar: (id: string) => void;
  feitos: number;
  total: number;
}

export function TrilhaMenu({ itens, ativoId, onSelecionar, feitos, total }: Props) {
  const [aberto, setAberto] = useState(false);
  const ativo = itens.find((item) => item.id === ativoId);
  const pct = total ? Math.round((feitos / total) * 100) : 0;

  // Fecha a lista no celular depois de escolher um item.
  useEffect(() => setAberto(false), [ativoId]);

  return (
    <nav aria-label="Módulos da trilha" className="lg:sticky lg:top-28">
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls="trilha-menu-lista"
        onClick={() => setAberto((valor) => !valor)}
        className="flex w-full cursor-pointer items-center gap-3 border border-border px-4 py-3 text-left text-sm lg:hidden"
      >
        <span className="font-display text-xs text-muted-foreground">{ativo?.numero}</span>
        <span className="min-w-0 flex-1 truncate">{ativo?.titulo}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${aberto ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <div id="trilha-menu-lista" className={`${aberto ? "mt-2 block" : "hidden"} lg:mt-0 lg:block`}>
        <div className="hidden lg:block">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Progresso</p>
          <div className="mt-3 h-[2px] bg-border">
            <div className="h-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {total === 0 ? "Sem exercícios" : `${feitos} de ${total} exercícios · ${pct}%`}
          </p>
        </div>

        <ul className="mt-2 divide-y divide-border border border-border lg:mt-6 lg:divide-y-0 lg:border-0 lg:border-l">
          {itens.map((item) => {
            const selecionado = item.id === ativoId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={selecionado ? "page" : undefined}
                  onClick={() => onSelecionar(item.id)}
                  className={`flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left text-sm transition-colors lg:-ml-px lg:border-l lg:py-2.5 ${
                    selecionado
                      ? "text-foreground lg:border-foreground"
                      : "text-muted-foreground hover:text-foreground lg:border-transparent"
                  }`}
                >
                  <span className="mt-0.5 w-5 shrink-0 font-display text-xs">{item.numero}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block leading-snug ${selecionado ? "font-medium" : ""}`}>{item.titulo}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{item.detalhe}</span>
                  </span>
                  {item.concluido && <Check className="mt-0.5 h-4 w-4 shrink-0" aria-label="Concluído" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
