import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { configurarGoogleIdentity, receberLoginGoogle } from "@/lib/google-identity";

export function GoogleSignInButton({ disabled, onBusyChange }: { disabled: boolean; onBusyChange: (busy: boolean) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const props = useRef({ disabled, onBusyChange });
  props.current = { disabled, onBusyChange };
  const ocupado = useRef(false);
  const [estado, setEstado] = useState<"carregando" | "pronto" | "erro">("carregando");
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    const elementoInicial = container.current;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
    if (!clientId) { setEstado("erro"); return; }
    const cancelarCallback = receberLoginGoogle(async (token, nonce) => {
      if (!ativo || props.current.disabled || ocupado.current) return;
      ocupado.current = true;
      props.current.onBusyChange(true);
      try {
        const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token, nonce });
        if (error) throw error;
        // AuthPage observa a nova sessão e leva ao dashboard.
      } catch {
        toast.error("Não foi possível entrar com Google. Confira a configuração ou tente novamente.");
      } finally {
        ocupado.current = false;
        if (ativo) props.current.onBusyChange(false);
      }
    });
    configurarGoogleIdentity(clientId).then(sdk => {
      if (!ativo || !container.current) return;
      container.current.replaceChildren();
      sdk.renderButton(container.current, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        locale: "pt-BR",
      });
      setEstado("pronto");
    }).catch(() => { if (ativo) setEstado("erro"); });
    return () => { ativo = false; cancelarCallback(); elementoInicial?.replaceChildren(); };
  }, [tentativa]);

  return (
    <div aria-busy={disabled || estado === "carregando"}>
      <div ref={container} inert={disabled} className={`flex min-h-10 justify-center ${disabled ? "opacity-50" : ""}`} />
      {estado === "carregando" && <p role="status" className="py-3 text-center text-sm text-muted-foreground">Carregando login Google...</p>}
      {estado === "erro" && (
        <div className="text-center text-sm text-muted-foreground">
          <p role="status">Login Google indisponível no momento.</p>
          <button type="button" disabled={disabled} onClick={() => { setEstado("carregando"); setTentativa(value => value + 1); }} className="mt-2 underline underline-offset-4">Tentar novamente</button>
        </div>
      )}
    </div>
  );
}
