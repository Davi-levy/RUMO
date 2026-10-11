import { describe, expect, test } from "bun:test";
import { executarGeracaoTrilha } from "../src/lib/trilha-generation";

const plano = { geracaoId: "e504fc13-dd42-42e6-91cc-68a077634c94", autorizacao: "assinatura-teste", titulo: "Python", descricao: "Fundamentos", modulos: [
  { titulo: "Variáveis", resumo: "Tipos" }, { titulo: "Condições", resumo: "if" },
] };
const modulo = { conteudo: "Conteúdo", exercicios: [{ pergunta: "Função de saída?", resposta_esperada: "print" }] };
const tema = { linguagem: "Python", nivel: "iniciante" as const };

describe("Geração em etapas", () => {
  test("gera todos os módulos em ordem antes de salvar qualquer trilha", async () => {
    const chamadas: string[] = [];
    const id = await executarGeracaoTrilha(tema, {
      signal: new AbortController().signal,
      gerarEsqueleto: async () => { chamadas.push("plano"); return plano; },
      gerarModulo: async pedido => {
        expect(pedido.geracaoId).toBe(plano.geracaoId);
        expect(pedido.autorizacao).toBe(plano.autorizacao);
        chamadas.push(pedido.tituloModulo); return modulo;
      },
      salvar: async conteudo => {
        expect(conteudo.modulos.map(m => m.titulo)).toEqual(["Variáveis", "Condições"]);
        chamadas.push("salvar"); return "trilha-id";
      },
      onPlano: () => {}, onModulo: () => {},
    });
    expect(id).toBe("trilha-id");
    expect(chamadas).toEqual(["plano", "Variáveis", "Condições", "salvar"]);
  });

  test("falha de um módulo não grava uma trilha vazia ou parcial", async () => {
    let salvou = false;
    await expect(executarGeracaoTrilha(tema, {
      signal: new AbortController().signal,
      gerarEsqueleto: async () => plano,
      gerarModulo: async pedido => { if (pedido.posicao === 2) throw new Error("Falha Gemini"); return modulo; },
      salvar: async () => { salvou = true; return "id"; }, onPlano: () => {}, onModulo: () => {},
    })).rejects.toThrow("Falha Gemini");
    expect(salvou).toBe(false);
  });

  test("sair da página durante uma chamada pendente interrompe o fluxo sem salvar", async () => {
    const controller = new AbortController();
    let salvou = false;
    await expect(executarGeracaoTrilha(tema, {
      signal: controller.signal, gerarEsqueleto: async () => plano,
      gerarModulo: () => { queueMicrotask(() => controller.abort()); return new Promise(() => {}); },
      salvar: async () => { salvou = true; return "id"; }, onPlano: () => {}, onModulo: () => {},
    })).rejects.toThrow();
    expect(salvou).toBe(false);
  });

  test("falha ao salvar é propagada ao formulário", async () => {
    await expect(executarGeracaoTrilha(tema, {
      signal: new AbortController().signal, gerarEsqueleto: async () => plano, gerarModulo: async () => modulo,
      salvar: async () => { throw new Error("Falha Supabase"); }, onPlano: () => {}, onModulo: () => {},
    })).rejects.toThrow("Falha Supabase");
  });
});
