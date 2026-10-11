import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { NIVEIS } from "./trilha.shared";
import type { Esqueleto, ModuloGerado } from "./trilha.server";
import { EsqueletoSchema, ModuloSchema, promptEsqueleto, promptModulo, validarEsqueleto, validarModulo } from "./trilha.server";
import { gerarJsonGemini, esqueletoJsonSchema, moduloJsonSchema } from "./gemini.server";
import { reservarGeracao, reservarModulo } from "./trilha-quota.server";
import { proximoReinicioDiario } from "./trilha-limite";

export const consultarLimiteDiario = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("consultar_geracoes_hoje");
    if (error || data === null) throw new Error("Não foi possível consultar seu limite diário.");
    return { usadas: data, restantes: Math.max(0, 2 - data), reiniciaEm: proximoReinicioDiario() };
  });

export const gerarEsqueleto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ linguagem: z.string().min(1).max(80), nivel: z.enum(NIVEIS) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<Esqueleto & { geracaoId: string }> => {
    const geracaoId = await reservarGeracao(context.supabase);
    const esqueleto = await gerarJsonGemini({
      prompt: erro => promptEsqueleto(data.linguagem, data.nivel, erro),
      schema: EsqueletoSchema, validar: validarEsqueleto, responseSchema: esqueletoJsonSchema,
    });
    return { ...esqueleto, geracaoId };
  });

export const gerarModulo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({
      geracaoId: z.string().uuid(),
      linguagem: z.string().min(1).max(80),
      nivel: z.enum(NIVEIS),
      tituloTrilha: z.string().min(1).max(200),
      tituloModulo: z.string().min(1).max(200),
      resumoModulo: z.string().max(2000).default(""),
      posicao: z.number().int().min(1).max(6),
      total: z.number().int().min(1).max(6),
    }).refine(data => data.posicao <= data.total, "Posição maior que o total de módulos").parse(input),
  )
  .handler(async ({ data, context }): Promise<ModuloGerado> => {
    await reservarModulo(context.supabase, data.geracaoId, data.posicao);
    return gerarJsonGemini({
      prompt: erro => promptModulo(data, erro),
      schema: ModuloSchema, validar: validarModulo, responseSchema: moduloJsonSchema,
    });
  });
