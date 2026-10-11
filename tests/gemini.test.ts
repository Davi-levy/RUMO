import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { gerarJsonGemini, esqueletoJsonSchema, moduloJsonSchema } from "../src/lib/gemini.server";
import { EsqueletoSchema, ModuloSchema, validarEsqueleto, validarModulo, extrairJson, promptModulo, normalizarSecoes } from "../src/lib/trilha.server";
import exemplos from "./fixtures/conteudo-react.json";

const originalFetch = globalThis.fetch;
const originalKey = process.env.GEMINI_API_KEY;
const originalModel = process.env.GEMINI_MODEL;
const fixture = {
  titulo: "Python", descricao: "Fundamentos",
  modulos: Array.from({ length: 6 }, (_, i) => ({ titulo: `Módulo ${i + 1}`, resumo: "Fundamentos", objetivos: ["Identificar conceitos", "Aplicar conceitos"], pre_requisitos: [] })),
};
const generate = () => gerarJsonGemini({
  prompt: (error?: string) => error ? `Corrija: ${error}` : "Planeje uma trilha",
  schema: EsqueletoSchema, validar: validarEsqueleto, responseSchema: esqueletoJsonSchema,
});
const answer = (text: string, finishReason = "STOP") => Response.json({
  candidates: [{ finishReason, content: { parts: [{ text }] } }],
});

beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-key-only";
  process.env.GEMINI_MODEL = "gemini-test";
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalKey;
  if (originalModel === undefined) delete process.env.GEMINI_MODEL;
  else process.env.GEMINI_MODEL = originalModel;
});

describe("Gemini no servidor", () => {
  test("normaliza títulos equivalentes sem alterar código nem aceitar seções ausentes", () => {
    const original = exemplos[0].modulo;
    const conteudo = original.conteudo.replace("## Objetivos", "## **1. OBJETIVOS:**")
      .replace("## Pré-requisitos", "## Pre requisitos").replace("## Prática guiada", "## PRATICA GUIADA");
    const value = ModuloSchema.parse({ ...original, conteudo });
    expect(() => validarModulo(value)).not.toThrow();
    expect(normalizarSecoes("```markdown\n## **OBJETIVOS**\n```\n## **Conceitos**"))
      .toBe("```markdown\n## **OBJETIVOS**\n```\n## Conceitos");
    expect(() => validarModulo({ ...value, conteudo: value.conteudo.replace("## Conceitos", "## Outro assunto") })).toThrow("Seções");
  });

  test("nova tentativa explica a falha nos exercícios e usa múltipla escolha sem relaxar validação", async () => {
    let calls = 0;
    const original = exemplos[0].modulo;
    const args = { linguagem: "Ferramenta de programação", nivel: "iniciante" as const, tituloTrilha: fixture.titulo,
      tituloModulo: fixture.modulos[0].titulo, resumoModulo: fixture.modulos[0].resumo, posicao: 1, total: 6, plano: fixture };
    globalThis.fetch = (async (_url, options) => {
      calls++;
      if (calls === 2) {
        const prompt = JSON.parse(options?.body as string).contents[0].parts[0].text;
        expect(prompt).toContain("exercicios:");
        expect(prompt).toContain("três exercícios de múltipla escolha e nenhuma previsão");
        expect(prompt).not.toContain("RESPOSTA_PRIVADA");
      }
      return answer(JSON.stringify(calls === 1 ? { ...original, exercicios: [{ tipo: "incorreto", pergunta: "RESPOSTA_PRIVADA" }] } : original));
    }) as typeof fetch;
    const value = await gerarJsonGemini({ prompt: error => promptModulo(args, error), schema: ModuloSchema,
      validar: validarModulo, responseSchema: moduloJsonSchema });
    expect(value.exercicios).toHaveLength(3);
    expect(calls).toBe(2);
  });
  test("usa o modelo Flash-Lite como padrão", async () => {
    delete process.env.GEMINI_MODEL;
    globalThis.fetch = (async url => {
      expect(String(url)).toEndWith("models/gemini-3.5-flash-lite:generateContent");
      return answer(JSON.stringify(fixture));
    }) as typeof fetch;
    expect(await generate()).toEqual(fixture);
  });

  test("envia chave no header, modelo configurado e schema estruturado", async () => {
    globalThis.fetch = (async (url, options) => {
      expect(String(url)).toEndWith("models/gemini-test:generateContent");
      expect(String(url)).not.toContain("test-key-only");
      expect(new Headers(options?.headers).get("x-goog-api-key")).toBe("test-key-only");
      const body = JSON.parse(options?.body as string);
      expect(body.generationConfig.responseJsonSchema).toEqual(esqueletoJsonSchema);
      expect(options?.signal).toBeInstanceOf(AbortSignal);
      return answer(JSON.stringify(fixture));
    }) as typeof fetch;
    expect(await generate()).toEqual(fixture);
  });

  test("tenta novamente uma vez quando o conteúdo não passa na validação", async () => {
    let calls = 0;
    globalThis.fetch = (async (_url, options) => {
      calls++;
      if (calls === 2) expect(JSON.parse(options?.body as string).contents[0].parts[0].text).toContain("Corrija");
      return answer(JSON.stringify(calls === 1 ? { ...fixture, modulos: [] } : fixture));
    }) as typeof fetch;
    expect(await generate()).toEqual(fixture);
    expect(calls).toBe(2);
  });

  test("limita tentativas de respostas truncadas e rejeita JSON incompleto", async () => {
    let calls = 0;
    globalThis.fetch = (async () => { calls++; return answer('{"titulo":', "MAX_TOKENS"); }) as typeof fetch;
    await expect(generate()).rejects.toThrow("duas tentativas");
    expect(calls).toBe(2);
  });

  test("não repete chamadas de cota esgotada nem expõe o corpo do provedor", async () => {
    let calls = 0;
    globalThis.fetch = (async () => { calls++; return Response.json({ error: "test-key-only" }, { status: 429 }); }) as typeof fetch;
    await expect(generate()).rejects.toThrow("Limite de uso");
    expect(calls).toBe(1);
  });

  test("repete uma vez em falha temporária do provedor", async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls++;
      return calls === 1 ? Response.json({}, { status: 503 }) : answer(JSON.stringify(fixture));
    }) as typeof fetch;
    expect(await generate()).toEqual(fixture);
    expect(calls).toBe(2);
  });

  test.each([401, 403, 404, 500])("trata HTTP %i sem divulgar dados do provedor", async status => {
    globalThis.fetch = (async () => Response.json({ error: "test-key-only" }, { status })) as typeof fetch;
    const message = status === 401 || status === 403 ? "O Gemini recusou o acesso"
      : status === 404 ? "Modelo Gemini indisponível" : "O Gemini não conseguiu gerar";
    await expect(generate()).rejects.toThrow(message);
  });

  test("recusa configuração sem chave antes de enviar requisição", async () => {
    delete process.env.GEMINI_API_KEY;
    let calls = 0;
    globalThis.fetch = (async () => { calls++; return answer("{}"); }) as typeof fetch;
    await expect(generate()).rejects.toThrow("Configure GEMINI_API_KEY");
    expect(calls).toBe(0);
  });

  test("trata falha de rede sem divulgar dados internos", async () => {
    globalThis.fetch = (async () => { throw new Error("test-key-only"); }) as typeof fetch;
    await expect(generate()).rejects.toThrow("Não foi possível conectar");
  });

  test("recusa conteúdo bloqueado sem tentar novamente", async () => {
    globalThis.fetch = (async () => Response.json({ promptFeedback: { blockReason: "SAFETY" } })) as typeof fetch;
    await expect(generate()).rejects.toThrow("Tente outro tema");
  });

  test("valida conteúdo e exercícios de um módulo", async () => {
    const module = { conteudo: ['## Objetivos', '## Pré-requisitos', '## Conceitos', '## Exemplo resolvido', '## Prática guiada', '## Erros comuns e resumo'].map(t => t + '\nExplicação com exemplos.').join('\n') + '\n```python\nprint("Olá")\n```', exercicios: Array.from({ length: 3 }, (_, i) => ({
      tipo: "multipla_escolha", pergunta: `Questão ${i + 1}: qual função imprime?`, resposta_esperada: "a", dica: "Considere a saída", explicacao: "print exibe texto", alternativas: [{ id: "a", texto: "print" }, { id: "b", texto: "input" }, { id: "c", texto: "len" }, { id: "d", texto: "int" }],
    })) };
    globalThis.fetch = (async () => answer(JSON.stringify(module))) as typeof fetch;
    expect(await gerarJsonGemini({ prompt: () => "Escreva um módulo", schema: ModuloSchema,
      validar: validarModulo, responseSchema: moduloJsonSchema })).toEqual(module);
  });

  test("preserva blocos de código dentro de JSON, inclusive envolvido em cercas Markdown", () => {
    const value = { conteudo: 'Exemplo:\n```javascript\nconst obj = { nome: "Rumo" };\n```' };
    const json = JSON.stringify(value);
    expect(extrairJson(json)).toEqual(value);
    expect(extrairJson(`\`\`\`json\n${json}\n\`\`\``)).toEqual(value);
    expect(extrairJson(`Aqui está o módulo:\n${json}\nFim.`)).toEqual(value);
  });
});
