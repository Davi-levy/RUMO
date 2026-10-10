import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar" },
      {
        name: "description",
        content: "Acesse sua conta RUMO para criar trilhas de estudo de programação geradas por IA.",
      },
      { property: "og:title", content: "Entrar no RUMO" },
      { property: "og:description", content: "Crie sua conta e comece uma trilha de estudos gerada por IA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const mail = email.trim().toLowerCase();

    try {
      if (modo === "criar") {
        const { error } = await supabase.auth.signUp({
          email: mail,
          password: senha,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome: nome.trim() || mail.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Conta criada. Bem-vindo.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: mail, password: senha });
        if (error) throw error;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado";
      if (/Invalid login credentials/i.test(msg)) toast.error("Email ou senha incorretos.");
      else if (/already registered/i.test(msg)) toast.error("Este email já tem conta. Faça login.");
      else if (/Email not confirmed/i.test(msg)) toast.error("Confirme seu email antes de entrar.");
      else if (/at least/i.test(msg)) toast.error("A senha precisa ter no mínimo 6 caracteres.");
      else toast.error(msg);
    } finally {
      setEnviando(false);
    }
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="px-6 py-6">
        <Link to="/" className="flex items-center gap-1 font-display text-lg font-bold tracking-[0.3em]">
          <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
          <span className="logo-outline">RUMO</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <h1 className="font-display text-3xl font-bold">
            {modo === "entrar" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            As trilhas ficam salvas na sua conta
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {modo === "criar" && (
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
            />
            <input
              type="password"
              required
              minLength={6}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha"
              className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
            />
            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-primary text-primary-foreground py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {enviando ? "..." : modo === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={google}
            className="w-full border border-border py-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            Teste de auth google  
          </button>

          <button
            onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
            className="mt-8 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {modo === "entrar" ? "Não tem conta? Criar" : "Já tem conta? Entrar"}
          </button>
        </motion.div>
      </div>
    </main>
  );
}

