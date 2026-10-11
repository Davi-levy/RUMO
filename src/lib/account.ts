import type { User } from "@supabase/supabase-js";

export function temGoogle(user: User): boolean {
  return user.identities?.some(identity => identity.provider === "google") === true
    || user.app_metadata.providers?.includes("google") === true
    || user.app_metadata.provider === "google";
}

export function perfilConta(user: User) {
  const google = user.identities?.find(identity => identity.provider === "google")?.identity_data;
  const texto = (value: unknown) => typeof value === "string" ? value.trim() : "";
  const nome = texto(user.user_metadata.nome) || texto(google?.full_name)
    || texto(user.user_metadata.full_name) || texto(user.user_metadata.name)
    || user.email?.split("@")[0] || "Usuário";
  const partes = nome.split(/\s+/);
  const iniciais = (partes.length > 1 ? partes[0][0] + partes.at(-1)![0] : nome.slice(0, 2)).toUpperCase();
  const foto = temGoogle(user) ? texto(google?.avatar_url) || texto(google?.picture)
    || texto(user.user_metadata.avatar_url) || texto(user.user_metadata.picture) : "";
  let fotoSegura: string | undefined;
  try { if (new URL(foto).protocol === "https:") fotoSegura = foto; } catch { /* Sem foto válida, exibir iniciais. */ }
  return { nome, iniciais, foto: fotoSegura };
}
