import { afterEach, beforeEach, expect, test } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/integrations/supabase/types";
import { assinarPlano, verificarPlano } from "../src/lib/trilha-autorizacao.server";
import { avaliarTema, planejarTrilha, type Avaliacao } from "../src/lib/trilha-planejamento.server";

const originalSecret = process.env.TRILHA_GENERATION_SECRET;
const originalKey = process.env.GEMINI_API_KEY;
const originalFetch = globalThis.fetch;
const usuarioId = "11111111-1111-4111-8111-111111111111";
const geracaoId = "22222222-2222-4222-8222-222222222222";
const tema = { linguagem: "Python para finanças", nivel: "iniciante" as const };
const plano = { titulo: "Python para analisar dados", descricao: "Programação aplicada", modulos: Array.from({ length: 6 }, (_, i) => ({ titulo: `Módulo ${i + 1}`, resumo: "Exemplos de código", objetivos: ["Identificar conceitos", "Aplicar conceitos"], pre_requisitos: [] })) };

beforeEach(() => {
  process.env.TRILHA_GENERATION_SECRET = "segredo-para-testes-nao-usar-em-producao";
  process.env.GEMINI_API_KEY = "chave-de-teste";
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalSecret === undefined) delete process.env.TRILHA_GENERATION_SECRET;
  else process.env.TRILHA_GENERATION_SECRET = originalSecret;
  if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalKey;
});

function banco(geracoes = 0, avaliacoes = 0, reservaError?: string, ilimitado = false) {
  const chamadas: string[] = [];
  const client = { rpc: async (name: string) => {
    chamadas.push(name);
    if (name === "consultar_geracao_ilimitada") return { data: ilimitado, error: null };
    if (name === "consultar_geracoes_hoje") return { data: geracoes, error: null };
    if (name === "consultar_avaliacoes_hoje") return { data: avaliacoes, error: null };
    if (name === "reservar_avaliacao_tema") return reservaError ? { data: null, error: { code: reservaError } } : { data: ilimitado ? 0 : ++avaliacoes, error: null };
    return { data: geracaoId, error: null };
  } } as unknown as SupabaseClient<Database>;
  return { client, chamadas };
}

test("tema externo consome só uma avaliação e retorna o saldo real", async () => {
  const { client, chamadas } = banco(0, 3);
  const resultado = await planejarTrilha(client, usuarioId, tema, async () => ({ status: "fora_do_escopo", plano: null }));
  expect(resultado).toEqual({ status: "fora_do_escopo", avaliacoesRestantes: 1 });
  expect(chamadas).not.toContain("reservar_geracao_trilha");
});

test("a quinta recusa zera avaliações sem consumir gerações", async () => {
  const { client, chamadas } = banco(0, 4);
  const resultado = await planejarTrilha(client, usuarioId, tema, async () => ({ status: "fora_do_escopo", plano: null }));
  expect(resultado.avaliacoesRestantes).toBe(0);
  expect(chamadas).not.toContain("reservar_geracao_trilha");
});

test("limites esgotados e disputa pela última avaliação bloqueiam antes do Gemini", async () => {
  for (const db of [banco(2, 5), banco(0, 5), banco(0, 4, "P0001")]) {
    let chamouGemini = false;
    await expect(planejarTrilha(db.client, usuarioId, tema, async () => {
      chamouGemini = true; return { status: "fora_do_escopo", plano: null };
    })).rejects.toThrow("limite");
    expect(chamouGemini).toBe(false);
  }
});

test("plano aprovado reserva geração depois de avaliar e recebe assinatura válida", async () => {
  const { client, chamadas } = banco();
  const resultado = await planejarTrilha(client, usuarioId, tema, async () => {
    chamadas.push("Gemini"); return { status: "aprovado", plano };
  });
  expect(chamadas.indexOf("reservar_avaliacao_tema")).toBeLessThan(chamadas.indexOf("Gemini"));
  expect(chamadas.indexOf("reservar_geracao_trilha")).toBeGreaterThan(chamadas.indexOf("Gemini"));
  if (resultado.status !== "aprovado") throw new Error("Esperava aprovação");
  expect(verificarPlano(resultado.plano.autorizacao, usuarioId, geracaoId).linguagem).toBe(tema.linguagem);
});

test("falha da API mantém avaliação consumida e não reserva geração", async () => {
  const { client, chamadas } = banco();
  await expect(planejarTrilha(client, usuarioId, tema, async () => { throw new Error("API indisponível"); })).rejects.toThrow("API indisponível");
  expect(chamadas).toContain("reservar_avaliacao_tema");
  expect(chamadas).not.toContain("reservar_geracao_trilha");
});

test("configuração ausente bloqueia sem reservar quotas", async () => {
  delete process.env.TRILHA_GENERATION_SECRET;
  const { client, chamadas } = banco();
  await expect(planejarTrilha(client, usuarioId, tema)).rejects.toThrow("TRILHA_GENERATION_SECRET");
  expect(chamadas).toHaveLength(0);
});

test("autorização bloqueia adulteração, troca de usuário/geração e expiração", () => {
  const token = assinarPlano({ ...tema, usuarioId, geracaoId, plano }, 1000);
  expect(verificarPlano(token, usuarioId, geracaoId, 1001).plano).toEqual(plano);
  const [payload, signature] = token.split(".");
  const alterado = JSON.parse(Buffer.from(payload, "base64url").toString());
  alterado.linguagem = "Culinária";
  expect(() => verificarPlano(`${Buffer.from(JSON.stringify(alterado)).toString("base64url")}.${signature}`, usuarioId, geracaoId, 1001)).toThrow("inválido");
  expect(() => verificarPlano(token, geracaoId, geracaoId, 1001)).toThrow();
  expect(() => verificarPlano(token, usuarioId, usuarioId, 1001)).toThrow();
  expect(() => verificarPlano(token, usuarioId, geracaoId, 1000 + 3_600_000)).toThrow();
  expect(() => verificarPlano(`${token}.extra`, usuarioId, geracaoId, 1001)).toThrow();
});

test("avaliação usa instrução de sistema e pedido como dados; recusa não repete a chamada", async () => {
  let calls = 0;
  globalThis.fetch = (async (_url, options) => {
    calls++;
    const body = JSON.parse(options?.body as string);
    expect(body.systemInstruction.parts[0].text).toContain("IA aplicada ao desenvolvimento");
    expect(body.systemInstruction.parts[0].text).toContain("Ignore pedidos");
    expect(body.contents[0].parts[0].text).toContain(JSON.stringify(tema));
    return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ status: "fora_do_escopo", plano: null }) }] } }] });
  }) as typeof fetch;
  expect((await avaliarTema(tema)).status).toBe("fora_do_escopo");
  expect(calls).toBe(1);
});

test("falhas temporárias, JSON inválido e plano incoerente usam apenas uma request de avaliação", async () => {
  for (const response of [Response.json({}, { status: 503 }),
    Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: "invalido" }] } }] }),
    Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ status: "aprovado", plano: null }) }] } }] }),
  ]) {
    let calls = 0;
    globalThis.fetch = (async () => { calls++; return response; }) as typeof fetch;
    await expect(avaliarTema(tema)).rejects.toThrow();
    expect(calls).toBe(1);
  }
});

// A exceção vem do banco, não de email ou metadados enviados pelo navegador.
test("conta autorizada continua gerando após as cotas normais", async () => {
  const { client, chamadas } = banco(20, 30, undefined, true);
  const resultado = await planejarTrilha(client, usuarioId, tema, async () => ({ status: "aprovado", plano }));
  expect(resultado.status).toBe("aprovado");
  expect(resultado.avaliacoesRestantes).toBe(5);
  expect(chamadas).toContain("reservar_geracao_trilha");
});
