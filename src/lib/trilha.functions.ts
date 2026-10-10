import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { NIVEIS } from "./trilha.shared";
import type { Esqueleto, ModuloGerado } from "./trilha.server";
import { EsqueletoSchema, ModuloSchema, promptEsqueleto, promptModulo, validarEsqueleto, validarModulo } from "./trilha.server";
import { gerarJsonGemini, esqueletoJsonSchema, moduloJsonSchema } from "./gemini.server";

export const gerarEsqueleto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ linguagem: z.string().min(1).max(80), nivel: z.enum(NIVEIS) }).parse(input),
  )
  .handler(async ({ data }): Promise<Esqueleto> => gerarJsonGemini({
    prompt: erro => promptEsqueleto(data.linguagem, data.nivel, erro),
    schema: EsqueletoSchema, validar: validarEsqueleto, responseSchema: esqueletoJsonSchema,
  }));

export const gerarModulo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({
      linguagem: z.string().min(1).max(80),
      nivel: z.enum(NIVEIS),
      tituloTrilha: z.string().min(1).max(200),
      tituloModulo: z.string().min(1).max(200),
      resumoModulo: z.string().max(2000).default(""),
      posicao: z.number().int().min(1).max(20),
      total: z.number().int().min(1).max(20),
    }).refine(data => data.posicao <= data.total, "Posição maior que o total de módulos").parse(input),
  )
  .handler(async ({ data }): Promise<ModuloGerado> => gerarJsonGemini({
    prompt: erro => promptModulo(data, erro),
    schema: ModuloSchema, validar: validarModulo, responseSchema: moduloJsonSchema,
  }));
