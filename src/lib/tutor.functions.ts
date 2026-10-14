import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { carregarTutor, enviarTutor } from "./tutor.server";
import { CursorTutorSchema } from "./tutor.shared";

export const consultarTutor = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ moduloId: z.string().uuid(), cursor: CursorTutorSchema.optional() }).parse(input))
  .handler(({ data, context }) => carregarTutor(context.supabase, context.userId, data.moduloId, data.cursor));

export const perguntarTutor = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid(), moduloId: z.string().uuid(), pergunta: z.string().trim().min(1).max(1500) }).parse(input))
  .handler(({ data, context }) => enviarTutor(context.supabase, context.userId, data));

export const avaliarTutor = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid(), avaliacao: z.union([z.literal(1), z.literal(-1)]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("avaliar_tutor", { p_id: data.id, p_avaliacao: data.avaliacao });
    if (error) throw new Error("Não foi possível salvar a avaliação.");
    return { salvo: true };
  });
