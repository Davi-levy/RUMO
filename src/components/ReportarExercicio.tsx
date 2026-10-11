import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function ReportarExercicio({ exercicioId }: { exercicioId: string }) {
  const [aberto, setAberto] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  useEffect(() => {
    let ativo = true;
    void supabase.from("relatos_exercicios").select("id").eq("exercicio_id", exercicioId).maybeSingle()
      .then(({ data }) => { if (ativo && data) setEnviado(true); }, () => {
        // Uma falha na consulta não impede responder ou tentar enviar o relato.
      });
    return () => { ativo = false; };
  }, [exercicioId]);

  async function enviar(event: React.FormEvent) {
    event.preventDefault();
    if (enviando || enviado || observacao.length > 1000) return;
    setEnviando(true);
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) throw new Error("Sessão expirada.");
      const { error } = await supabase.from("relatos_exercicios").insert({
        usuario_id: data.user.id, exercicio_id: exercicioId, observacao: observacao.trim() || null,
      });
      if (error && error.code !== "23505") throw error;
      setEnviado(true);
      setAberto(false);
      toast.success("Relato enviado. Obrigado por avisar.");
    } catch {
      toast.error("Não foi possível enviar o relato. Tente novamente.");
    } finally { setEnviando(false); }
  }

  return (
    <div className="mt-10 border-t border-border pt-6">
      {enviado ? <p role="status" className="text-xs text-muted-foreground">Relato enviado. Obrigado por avisar.</p>
        : !aberto ? <button type="button" onClick={() => setAberto(true)} className="cursor-pointer text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Reportar exercício com erro</button>
          : <form onSubmit={enviar} className="space-y-3">
            <label htmlFor="relato-observacao" className="block text-sm">O que parece estar errado? <span className="text-muted-foreground">(opcional)</span></label>
            <textarea id="relato-observacao" value={observacao} onChange={event => setObservacao(event.target.value)} maxLength={1000} rows={3} disabled={enviando}
              className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground" />
            <div className="flex gap-3">
              <button type="submit" disabled={enviando} className="cursor-pointer bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-40">{enviando ? "Enviando..." : "Enviar relato"}</button>
              <button type="button" disabled={enviando} onClick={() => setAberto(false)} className="cursor-pointer px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
            </div>
          </form>}
    </div>
  );
}
