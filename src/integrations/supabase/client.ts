import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function criarClienteSupabase() {
  // No navegador o Vite substitui import.meta.env; no servidor (SSR) usamos process.env.
  const url = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const chavePublica =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !chavePublica) {
    throw new Error(
      "Variáveis do Supabase ausentes. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY (veja .env.example).",
    );
  }

  return createClient<Database>(url, chavePublica, {
    auth: {
      storage: typeof window === "undefined" ? undefined : window.localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let instancia: ReturnType<typeof criarClienteSupabase> | undefined;

// Uso: import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof criarClienteSupabase>, {
  get(_, prop, receiver) {
    if (!instancia) instancia = criarClienteSupabase();
    return Reflect.get(instancia, prop, receiver);
  },
});
