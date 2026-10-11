import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { isAuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { temGoogle } from "@/lib/account";

export const Route = createFileRoute("/redefinir-senha")({
  ssr: false,
  head: () => ({ meta: [{ title: "Redefinir senha | RUMO" }, { name: "robots", content: "noindex" }] }),
  component: RedefinirSenha,
});

function RedefinirSenha() {
  const { user, loading, recovery } = useAuth();
  const [verificado, setVerificado] = useState(false);
  const [erro, setErro] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user || !recovery) return;
    let active = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user || data.user.id !== user.id || temGoogle(data.user)) setErro(true);
      else setVerificado(true);
    }).catch(() => { if (active) setErro(true); });
    return () => { active = false; };
  }, [loading, recovery, user?.id]);

  async function sair() {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) { toast.error("Senha atualizada, mas não foi possível encerrar a sessão. Tente sair novamente."); return; }
    toast.success("Senha atualizada. Entre com sua nova senha.");
    await navigate({ to: "/auth", replace: true });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (enviando || !verificado || !recovery || !user || concluido) return;
    if (senha !== confirmacao) { toast.error("As senhas precisam ser iguais."); return; }
    setEnviando(true);
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user || data.user.id !== user.id || temGoogle(data.user)) { setErro(true); return; }
      const result = await supabase.auth.updateUser({ password: senha });
      if (result.error) throw result.error;
      setConcluido(true); setSenha(""); setConfirmacao("");
      await sair();
    } catch (error) {
      const code = isAuthError(error) ? error.code : undefined;
      toast.error(code === "weak_password" ? "Escolha uma senha mais forte." : code === "same_password" ? "Escolha uma senha diferente da anterior." : "Não foi possível redefinir a senha. Tente novamente.");
    } finally { setEnviando(false); }
  }

  const invalido = !loading && (!user || !recovery || erro);
  return <main className="flex min-h-screen flex-col bg-background">
    <Link to="/" className="p-6 font-display text-lg font-bold tracking-widest">RUMO</Link>
    <div className="flex flex-1 items-center justify-center px-6 pb-20">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl font-bold">Redefinir senha</h1>
        {concluido ? <><p className="mt-4 text-sm text-muted-foreground">Sua senha foi atualizada.</p><button type="button" onClick={() => { void sair().catch(() => toast.error("Não foi possível sair. Tente novamente.")); }} className="mt-6 w-full bg-primary py-3 text-primary-foreground">Sair e entrar novamente</button></>
          : invalido ? <><p role="alert" className="mt-4 text-sm text-muted-foreground">Este link é inválido ou expirou. Solicite outro link na sua conta.</p><Link to="/auth" className="mt-6 inline-block text-sm underline">Voltar para entrar</Link></>
          : loading || !verificado ? <p role="status" className="mt-4 text-sm text-muted-foreground">Verificando seu link...</p>
          : <form onSubmit={submit} className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">Escolha uma nova senha com pelo menos 6 caracteres.</p>
            <label className="block text-sm">Nova senha<input type="password" required minLength={6} autoComplete="new-password" value={senha} onChange={(event) => setSenha(event.target.value)} className="mt-2 w-full border border-border bg-transparent px-4 py-3" /></label>
            <label className="block text-sm">Confirmar nova senha<input type="password" required minLength={6} autoComplete="new-password" value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} className="mt-2 w-full border border-border bg-transparent px-4 py-3" /></label>
            <button type="submit" disabled={enviando} className="w-full bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{enviando ? "Atualizando..." : "Salvar nova senha"}</button>
          </form>}
      </div>
    </div>
  </main>;
}
