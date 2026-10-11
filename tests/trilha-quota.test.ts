import { describe, expect, test } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/integrations/supabase/types";
import { reservarGeracao, reservarModulo } from "../src/lib/trilha-quota.server";
import { executarGeracaoTrilha } from "../src/lib/trilha-generation";

function cliente(resultado: { data?: string | null; error: { code: string; message?: string } | null }) {
  return {
    rpc: async () => resultado,
    from: () => ({ insert: async () => resultado }),
  } as unknown as SupabaseClient<Database>;
}

describe("Limite de geração", () => {
  test("terceira tentativa não chega aos módulos nem à persistência", async () => {
    let chamouModulo = false;
    let salvou = false;
    await expect(executarGeracaoTrilha({ linguagem: "Python", nivel: "iniciante" }, {
      signal: new AbortController().signal,
      gerarEsqueleto: async () => {
        await reservarGeracao(cliente({ error: { code: "P0001" } }));
        throw new Error("Não deveria gerar o planejamento");
      },
      gerarModulo: async () => { chamouModulo = true; throw new Error("Não deveria gerar módulos"); },
      salvar: async () => { salvou = true; return "id"; },
      onPlano: () => {}, onModulo: () => {},
    })).rejects.toThrow("limite de 2 gerações por dia");
    expect(chamouModulo).toBe(false);
    expect(salvou).toBe(false);
  });

  test("falha na verificação do banco bloqueia a geração e não expõe detalhes", async () => {
    await expect(reservarGeracao(cliente({ error: { code: "08006", message: "Detalhes internos" } })))
      .rejects.toThrow("Não foi possível verificar seu limite diário");
    await expect(reservarGeracao(cliente({ data: null, error: null }))).rejects.toThrow();
  });

  test("uma reserva válida retorna a autorização dos módulos", async () => {
    expect(await reservarGeracao(cliente({ data: "id-autorizado", error: null }))).toBe("id-autorizado");
  });

  test("repetições e gerações não autorizadas são bloqueadas", async () => {
    await expect(reservarModulo(cliente({ error: { code: "23505" } }), "id", 1))
      .rejects.toThrow("já foi solicitado");
    await expect(reservarModulo(cliente({ error: { code: "42501" } }), "id", 1))
      .rejects.toThrow("Geração inválida ou expirada");
  });
});
