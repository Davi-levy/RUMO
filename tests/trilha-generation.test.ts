import { describe, expect, test } from "bun:test";
import { executarGeracaoTrilha } from "../src/lib/trilha-generation";

const plano = { geracaoId: "e504fc13-dd42-42e6-91cc-68a077634c94", autorizacao: "assinatura-teste", titulo: "Python", descricao: "Fundamentos", modulos: [
  { titulo: "Variáveis", resumo: "Tipos", objetivos: ["Declarar variáveis", "Usar tipos"], pre_requisitos: [] }, { titulo: "Condições", resumo: "if", objetivos: ["Criar condições", "Comparar valores"], pre_requisitos: ["Variáveis"] },
  ...["Laços", "Coleções", "Funções", "Erros"].map(titulo => ({ titulo, resumo: `Aplicar ${titulo}`, objetivos: [`Identificar ${titulo}`, `Aplicar ${titulo}`], pre_requisitos: ["Condições"] })),
] };
const modulo = { conteudo: "Conteúdo", exercicios: [{ tipo: "previsao_saida" as const, pergunta: 'Saída de print("Olá")?', resposta_esperada: "Olá", alternativas: null, dica: "Literal", explicacao: "Imprime Olá" }] };
const tema = { linguagem: "Python", nivel: "iniciante" as const };

describe("Geração em etapas", () => {
  test("cancelar o planejamento ignora a resposta atrasada e não inicia módulos", async () => {
    const controller = new AbortController();
    let responder!: (value: typeof plano) => void;
    let iniciou!: () => void;
    const inicio = new Promise<void>(resolve => { iniciou = resolve; });
    const chamadas: string[] = [];
    const geracao = executarGeracaoTrilha(tema, {
      signal: controller.signal,
      gerarEsqueleto: () => { iniciou(); return new Promise(resolve => { responder = resolve; }); },
      gerarModulo: async () => { chamadas.push("modulo"); return modulo; },
      salvar: async () => { chamadas.push("salvar"); return "id"; },
      onPlano: () => chamadas.push("plano"), onModulo: () => chamadas.push("progresso"),
    });
    const rejeicao = geracao.catch(error => error);
    await inicio;
    controller.abort();
    expect(await rejeicao).toBeInstanceOf(DOMException);
    responder(plano);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(chamadas).toEqual([]);
  });

  test("cancelar um módulo ignora seu resultado e impede os próximos módulos e o salvamento", async () => {
    const controller = new AbortController();
    let responder!: (value: typeof modulo) => void;
    let iniciou!: () => void;
    const inicio = new Promise<void>(resolve => { iniciou = resolve; });
    let pedidos = 0;
    let salvou = false;
    let concluidos = 0;
    const geracao = executarGeracaoTrilha(tema, {
      signal: controller.signal, gerarEsqueleto: async () => plano,
      gerarModulo: () => { pedidos++; iniciou(); return new Promise(resolve => { responder = resolve; }); },
      salvar: async () => { salvou = true; return "id"; },
      onPlano: () => {}, onModulo: () => { concluidos++; },
    });
    const rejeicao = geracao.catch(error => error);
    await inicio;
    controller.abort();
    expect(await rejeicao).toBeInstanceOf(DOMException);
    responder(modulo);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(pedidos).toBe(1);
    expect(concluidos).toBe(0);
    expect(salvou).toBe(false);
  });
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
        expect(conteudo.modulos.map(m => m.titulo)).toEqual(plano.modulos.map(m => m.titulo));
        chamadas.push("salvar"); return "trilha-id";
      },
      onPlano: () => {}, onModulo: () => {},
    });
    expect(id).toBe("trilha-id");
    expect(chamadas).toEqual(["plano", ...plano.modulos.map(m => m.titulo), "salvar"]);
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
