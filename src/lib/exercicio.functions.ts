import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const correcaoSchema = z.object({ resultado: z.enum(["acertou", "quase", "errou"]), acertou: z.boolean(), score: z.number(), feedback: z.string() });

export const responderExercicio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid(), resposta: z.string().min(1).max(6000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: resultado, error } = await context.supabase.rpc("avaliar_exercicio", { p_exercicio_id: data.id, p_resposta: data.resposta });
    if (error) throw new Error("Não foi possível corrigir e salvar a resposta.");
    return correcaoSchema.parse(resultado);
  });

export const revelarSolucao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: resultado, error } = await context.supabase.rpc("avaliar_exercicio", { p_exercicio_id: data.id, p_revelar: true });
    if (error) throw new Error("Envie uma resposta antes de consultar a solução.");
    return z.object({ solucao: z.string(), explicacao: z.string().nullable() }).parse(resultado);
  });
