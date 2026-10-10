export const NIVEIS = ["iniciante", "intermediario", "avancado"] as const;
export type Nivel = (typeof NIVEIS)[number];
