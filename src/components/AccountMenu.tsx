import { useEffect, useId, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { perfilConta, temGoogle } from "@/lib/account";
import { desativarLoginAutomaticoGoogle } from "@/lib/google-identity";
import { UserAvatar } from "./UserAvatar";

export function AccountMenu({ user }: { user: User }) {
  const [aberto, setAberto] = useState(false);
  const [conta, setConta] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [proximoEmail, setProximoEmail] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const navigate = useNavigate();

  useEffect(() => {
    if (!aberto) return;
    menu.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const fechar = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setAberto(false);
    };
    document.addEventListener("pointerdown", fechar);
    return () => document.removeEventListener("pointerdown", fechar);
  }, [aberto]);

  async function sair() {
    if (saindo) return;
    setSaindo(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      desativarLoginAutomaticoGoogle();
      await navigate({ to: "/auth", replace: true });
    } catch {
      toast.error("Não foi possível sair. Tente novamente.");
      setSaindo(false);
    }
  }

  return (
    <div ref={root} className="relative" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setAberto(false);
    }}>
      <button ref={trigger} type="button" aria-label="Menu da conta" aria-haspopup="menu" aria-expanded={aberto} aria-controls={id}
        className="account-menu-trigger flex cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => setAberto(!aberto)} onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setAberto(true); }
        }}>
        <UserAvatar user={user} />
      </button>
      <div ref={menu} id={id} role="menu" aria-label="Conta" aria-hidden={!aberto} inert={!aberto} data-open={aberto}
        className="account-dropdown absolute right-0 top-full mt-3 w-48 rounded-xl border border-white/10 bg-[#0b0b0c] p-2 shadow-[0_12px_36px_rgba(0,0,0,0.55)]"
        onKeyDown={(event) => {
          const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
          const current = items.indexOf(document.activeElement as HTMLButtonElement);
          if (event.key === "Escape") { event.preventDefault(); setAberto(false); trigger.current?.focus(); }
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const index = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
            items[index]?.focus();
          }
        }}>
        <button type="button" role="menuitem" className="account-menu-item flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-muted-foreground outline-none" onClick={() => { setAberto(false); setConta(true); }}>
          <UserRound className="h-4 w-4" />Conta
        </button>
        <div role="separator" className="mx-3 my-1.5 border-t border-white/[0.08]" />
        <button type="button" role="menuitem" disabled={saindo} onClick={sair} className="account-menu-item flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-muted-foreground outline-none disabled:opacity-50">
          <LogOut className="h-4 w-4" />{saindo ? "Saindo..." : "Sair"}
        </button>
      </div>
      {conta && <AccountPopup user={user} proximoEmail={proximoEmail} onEmailSent={() => setProximoEmail(Date.now() + 60_000)} onClose={() => { setConta(false); trigger.current?.focus(); }} />}
    </div>
  );
}

function AccountPopup({ user, proximoEmail, onEmailSent, onClose }: { user: User; proximoEmail: number; onEmailSent: () => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [verificado, setVerificado] = useState<User | null>(null);
  const [erro, setErro] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [agora, setAgora] = useState(Date.now());
  const segundos = Math.max(0, Math.ceil((proximoEmail - agora) / 1000));
  const perfil = perfilConta(verificado ?? user);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    let active = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user || data.user.id !== user.id) setErro(true);
      else setVerificado(data.user);
    }).catch(() => { if (active) setErro(true); });
    return () => { active = false; element?.close(); document.body.style.overflow = overflow; };
  }, [user.id]);

  useEffect(() => {
    if (proximoEmail <= Date.now()) return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setAgora(now);
      if (now >= proximoEmail) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [proximoEmail]);

  async function enviarEmail() {
    if (enviando || Date.now() < proximoEmail) return;
    setEnviando(true);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user?.email || data.user.id !== user.id) throw new Error("session");
      setVerificado(data.user);
      if (temGoogle(data.user)) return;
      const result = await supabase.auth.resetPasswordForEmail(data.user.email, { redirectTo: `${window.location.origin}/redefinir-senha` });
      if (result.error) throw result.error;
      onEmailSent();
      toast.success("Confira seu email para redefinir a senha.");
    } catch {
      toast.error("Não foi possível enviar o email. Aguarde um pouco e tente novamente.");
    } finally { setEnviando(false); }
  }

  return <dialog ref={dialog} aria-labelledby={id} onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none items-center justify-center bg-black/60 p-6 text-foreground backdrop:bg-transparent backdrop-blur-md open:flex">
    <div className="relative w-full max-w-sm rounded-2xl border border-border bg-[#181818] p-7 shadow-xl">
      <button type="button" aria-label="Fechar conta" className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground" onClick={onClose}><X className="h-5 w-5" /></button>
      <h2 id={id} className="font-display text-xl font-bold">Conta</h2>
      <div className="mt-6 flex items-center gap-4">
        <UserAvatar user={verificado ?? user} className="h-14 w-14 text-lg" />
        <div className="min-w-0"><p className="break-words font-medium">{perfil.nome}</p><p className="mt-1 break-all text-sm text-muted-foreground">{(verificado ?? user).email}</p></div>
      </div>
      <div className="mt-6 border-t border-border pt-5 text-sm">
        {erro ? <p role="alert" className="text-muted-foreground">Não foi possível verificar sua conta. Feche e tente novamente.</p>
          : !verificado ? <p role="status" className="text-muted-foreground">Carregando conta...</p>
          : temGoogle(verificado) ? <p className="text-muted-foreground">Conta vinculada ao Google. A troca de senha não está disponível no RUMO.</p>
          : <><p className="text-muted-foreground">Enviaremos um link para seu email para você escolher uma nova senha.</p>
            <button type="button" disabled={enviando || segundos > 0} onClick={enviarEmail} className="mt-4 w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50">{enviando ? "Enviando..." : segundos > 0 ? `Aguarde ${segundos}s` : "Redefinir senha"}</button></>}
      </div>
    </div>
  </dialog>;
}
