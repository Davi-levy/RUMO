import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { carregarRecomendacoes } from "./youtube-recomendacoes.server";

export const obterVideosTrilha = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ trilhaId: z.string().uuid() }).parse(input))
  .handler(({ data, context }) => carregarRecomendacoes(context.supabase, data.trilhaId));
