import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { atualizarRecovery } from "@/lib/password-recovery";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  recovery: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, session: null, loading: true, recovery: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: true, recovery: false });

  useEffect(() => {
    // INITIAL_SESSION também restaura a sessão salva, sem uma leitura concorrente.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ user: session?.user ?? null, session, loading: false, recovery: atualizarRecovery(event, session?.user.id) });
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

