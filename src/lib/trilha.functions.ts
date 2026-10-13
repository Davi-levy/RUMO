import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { NIVEIS } from "./trilha.shared";
import { ModuloSchema, promptModulo, validarModulo, incluirObjetivosPlanejados } from "./trilha.server";
import { gerarJsonGemini, moduloJsonSchema } from "./gemini.server";
import { reservarModulo } from "./trilha-quota.server";
import { consultarLimites, planejarTrilha, POLITICA_PROGRAMACAO } from "./trilha-planejamento.server";
import { verificarPlano } from "./trilha-autorizacao.server";
import { abrirConteudo, protegerConteudo } from "./conteudo-protegido.server";
import { embaralharAlternativas } from "./exercicios";

export const consultarLimiteDiario = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => consultarLimites(context.supabase));

export const gerarEsqueleto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ linguagem: z.string().trim().min(1).max(80), nivel: z.enum(NIVEIS) }).parse(input),
  )
  .handler(({ data, context }) => planejarTrilha(context.supabase, context.userId, data));

export const gerarModulo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({
      geracaoId: z.string().uuid(),
      autorizacao: z.string().min(1).max(120_000),
      posicao: z.number().int().min(1).max(6),
    }).parse(input),
  )
  .handler(async ({ data, context }): Promise<string> => {
    const aprovado = verificarPlano(data.autorizacao, context.userId, data.geracaoId);
    const modulo = aprovado.plano.modulos[data.posicao - 1];
    if (!modulo) throw new Error("Módulo ausente no plano aprovado.");
    await reservarModulo(context.supabase, data.geracaoId, data.posicao);
    const resultado = await gerarJsonGemini({
      systemInstruction: POLITICA_PROGRAMACAO,
      prompt: erro => promptModulo({
        linguagem: aprovado.linguagem, nivel: aprovado.nivel,
        tituloTrilha: aprovado.plano.titulo, tituloModulo: modulo.titulo,
        resumoModulo: modulo.resumo, posicao: data.posicao, total: aprovado.plano.modulos.length,
        plano: aprovado.plano,
      }, erro),
      schema: ModuloSchema, validar: validarModulo, responseSchema: moduloJsonSchema,
    });
    return protegerConteudo({ ...resultado, conteudo: incluirObjetivosPlanejados(resultado.conteudo, modulo) }, context.userId, data.geracaoId, data.posicao);
  });

export const salvarTrilhaGerada = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ geracaoId: z.string().uuid(), autorizacao: z.string().max(120_000),
    modulos: z.array(z.string().min(1).max(200_000)).length(6) }).parse(input))
  .handler(async ({ data, context }) => {
    const aprovado = verificarPlano(data.autorizacao, context.userId, data.geracaoId);
    const modulos = data.modulos.map((token, i) => ModuloSchema.parse(abrirConteudo(token, context.userId, data.geracaoId, i + 1)));
    const { data: trilha, error } = await context.supabase.from("trilhas").insert({ usuario_id: context.userId,
      linguagem: aprovado.linguagem, nivel: aprovado.nivel, titulo: aprovado.plano.titulo, descricao: aprovado.plano.descricao }).select("id").single();
    if (error || !trilha) throw new Error("Não foi possível salvar a trilha.");
    try {
      for (const [i, gerado] of modulos.entries()) {
        const { data: modulo, error: err } = await context.supabase.from("modulos").insert({ trilha_id: trilha.id,
          titulo: aprovado.plano.modulos[i].titulo, conteudo: gerado.conteudo, ordem: i }).select("id").single();
        if (err || !modulo) throw new Error();
        const { error: errEx } = await context.supabase.from("exercicios").insert(gerado.exercicios.map((ex, j) => ({
          modulo_id: modulo.id, tipo: ex.tipo, pergunta: ex.pergunta, resposta_esperada: ex.resposta_esperada,
          dica: ex.dica, explicacao: ex.explicacao, ordem: j,
          alternativas: ex.tipo === "multipla_escolha" ? embaralharAlternativas(ex.alternativas) : null,
        })));
        if (errEx) throw new Error();
      }
      return trilha.id;
    } catch {
      const { error: cleanup } = await context.supabase.from("trilhas").delete().eq("id", trilha.id);
      throw new Error(cleanup ? "Não foi possível salvar nem remover a trilha incompleta." : "Não foi possível salvar a trilha.");
    }
  });
