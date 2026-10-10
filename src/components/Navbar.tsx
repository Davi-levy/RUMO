import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saindo, setSaindo] = useState(false);

  async function sair() {
    if (saindo) return;
    setSaindo(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      await navigate({ to: "/auth", replace: true });
    } catch {
      toast.error("Não foi possível sair. Tente novamente.");
    } finally {
      setSaindo(false);
    }
  }

  return (
    <nav
      className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1 font-display text-xl font-bold tracking-[0.3em]">
          <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
          <span className="logo-outline">RUMO</span>
        </Link>
        <div className="flex items-center gap-8 text-sm">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-muted-foreground hover:text-foreground transition-colors"
                activeProps={{ className: "text-foreground" }}
              >
                Trilhas
              </Link>
              <button
                onClick={sair}
                disabled={saindo}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Sair
              </button>
            </>
          ) : (
            <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
          )}
        </div>
      </div>
  </nav>
  );
}

