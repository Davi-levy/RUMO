import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error && !isAuthSessionMissingError(error)) {
      if (error.status !== 401 && error.status !== 403) {
        // Falhas de conexão não significam que o usuário perdeu a sessão.
        throw new Error("Não foi possível verificar sua sessão. Tente novamente.");
      }
      await supabase.auth.signOut({ scope: "local" });
    }
    // A rota usa ssr: false; carregar /auth evita trocar a árvore durante a hidratação.
    if (error || !data.user) throw redirect({ to: "/auth", replace: true, reloadDocument: true });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [user, loading, navigate]);

  // Remove o conteúdo privado também quando a sessão termina em outra aba.
  if (loading || !user) return null;
  return <Outlet />;
}

