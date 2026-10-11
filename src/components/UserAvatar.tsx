import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { perfilConta } from "@/lib/account";

export function UserAvatar({ user, className = "h-9 w-9" }: { user: User; className?: string }) {
  const { foto, iniciais } = perfilConta(user);
  const [fotoComErro, setFotoComErro] = useState<string>();
  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-[#262626] font-medium ${className}`}>
      {foto && foto !== fotoComErro ? (
        <img src={foto} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" onError={() => setFotoComErro(foto)} />
      ) : <span aria-hidden="true">{iniciais}</span>}
    </span>
  );
}
