import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { NIVEIS } from "./trilha.shared";
import type { Esqueleto, ModuloGerado } from "./trilha.server";

// Mantém os contratos usados pela interface original durante a migração.
// A implementação Gemini será adicionada na etapa de integração de IA.
const indisponivel = "A geração de trilhas está temporariamente indisponível.";

export const gerarEsqueleto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ linguagem: z.string().min(1).max(80), nivel: z.enum(NIVEIS) }).parse(input),
  )
  .handler(async (): Promise<Esqueleto> => {
    throw new Error(indisponivel);
  });

export const gerarModulo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({
      linguagem: z.string().min(1).max(80),
      nivel: z.enum(NIVEIS),
      tituloTrilha: z.string().min(1),
      tituloModulo: z.string().min(1),
      resumoModulo: z.string().default(""),
      posicao: z.number().int().min(1),
      total: z.number().int().min(1),
    }).parse(input),
  )
  .handler(async (): Promise<ModuloGerado> => {
    throw new Error(indisponivel);
  });
