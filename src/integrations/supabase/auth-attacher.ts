import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

// Registrado como functionMiddleware global em `src/start.ts`: sem ele, o navegador
// não envia o token de login nas chamadas às funções de servidor.
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
