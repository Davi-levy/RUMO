import { expect, test } from "bun:test";
import { corrigir, corrigirObjetivo } from "../src/lib/correcao";
import { embaralharAlternativas, normalizarSaida, selecionarExercicios } from "../src/lib/exercicios";
import { EsqueletoSchema, ModuloSchema, incluirObjetivosPlanejados, normalizarSecoes, promptModulo, validarEsqueleto, validarModulo } from "../src/lib/trilha.server";
import { gerarJsonGemini, moduloJsonSchema } from "../src/lib/gemini.server";

const alternativas = [{ id: "a" as const, texto: "Primeiro" }, { id: "b" as const, texto: "Segundo" }, { id: "c" as const, texto: "Terceiro" }, { id: "d" as const, texto: "Quarto" }];
const escolha = (n: number) => ({ tipo: "multipla_escolha" as const, pergunta: `Questão ${n}`, alternativas, resposta_esperada: "a" as const, dica: "Revise o conceito", explicacao: "A primeira opção satisfaz o requisito." });
const saida = { tipo: "previsao_saida" as const, pergunta: 'Qual saída?\n```python\nprint("Olá")\n```', alternativas: null, resposta_esperada: "Olá", dica: "Observe o literal", explicacao: "print escreve Olá." };
const conteudo = ["Objetivos", "Pré-requisitos", "Conceitos", "Exemplo resolvido", "Prática guiada", "Erros comuns e resumo"].map(t => `## ${t}\nExplicação didática detalhada.`).join("\n") + '\n```python\nprint("Olá")\n```';

test("seleção usa previsão válida ou três escolhas e descarta excesso inválido", () => {
  expect(selecionarExercicios([escolha(1), escolha(2), escolha(3), saida, null])).toEqual([escolha(1), escolha(2), saida]);
  expect(selecionarExercicios([escolha(1), escolha(2), { ...saida, resposta_esperada: "a\nb" }, escolha(3)])).toEqual([escolha(1), escolha(2), escolha(3)]);
  expect(() => selecionarExercicios([escolha(1), saida])).toThrow();
});
test("alternativas repetidas, gabaritos inválidos e previsões sem código não são aproveitados", () => {
  for (const invalido of [{ ...escolha(3), alternativas: alternativas.map(a => ({ ...a, id: "a" })) },
    { ...escolha(3), alternativas: alternativas.map(a => ({ ...a, texto: "Mesmo texto" })) },
    { ...escolha(3), resposta_esperada: "z" }, { ...saida, pergunta: "Sem código" },
    { ...saida, resposta_esperada: "x".repeat(121) }]) {
    expect(() => selecionarExercicios([escolha(1), escolha(2), invalido])).toThrow();
  }
});
test("embaralhamento mantém os IDs e gabarito sem alterar o array original", () => {
  const ordem = embaralharAlternativas(alternativas, () => 0);
  expect(ordem.map(a => a.id)).toEqual(["b", "c", "d", "a"]);
  expect(ordem.find(a => a.id === "a")?.texto).toBe("Primeiro");
  expect(alternativas.map(a => a.id)).toEqual(["a", "b", "c", "d"]);
});
test("previsão separa código da pergunta e recusa resultados visuais ou tabulares", () => {
  const m = selecionarExercicios([escolha(1), escolha(2), { ...saida, pergunta: "Qual saída?", codigo: 'print("Olá")', linguagem_codigo: "python" }]);
  expect(m[2].pergunta).toContain('```python\nprint("Olá")\n```');
  for (const [linguagem_codigo, codigo] of [["sql", "SELECT COUNT(*) FROM usuarios;"], ["javascript", "const App = () => <span>Olá</span>;"], ["css", "p { color: red; }"]]) {
    const exercises = selecionarExercicios([escolha(1), escolha(2), { ...saida, pergunta: "Qual saída?", linguagem_codigo, codigo }, escolha(3)]);
    expect(exercises.every(ex => ex.tipo === "multipla_escolha")).toBe(true);
  }
});
test("seções finais separadas são unificadas sem alterar código, e objetivos assinados são persistidos", () => {
  const separado = conteudo.replace("## Erros comuns e resumo", "## Erros comuns") + "\n## Resumo\nSíntese";
  expect(normalizarSecoes(separado)).toContain("## Erros comuns e resumo");
  expect(normalizarSecoes(separado)).toContain("### Resumo");
  const codigo = conteudo + "\n```markdown\n## Erros comuns\n## Resumo\n```";
  expect(normalizarSecoes(codigo)).toBe(codigo);
  const salvo = incluirObjetivosPlanejados(conteudo, { titulo: "Módulo", resumo: "Resumo", objetivos: ["Objetivo aprovado 1", "Objetivo aprovado 2"], pre_requisitos: ["Pré-requisito externo aprovado"] });
  expect(salvo).toContain("- Objetivo aprovado 1");
  expect(salvo).toContain("- Pré-requisito externo aprovado");
  expect(salvo).toContain("## Conceitos");
});
test("correção preserva caixa, operadores, indentação e espaços internos", () => {
  expect(normalizarSaida("\r\n  Olá  mundo \t\r\n\r\n")).toBe("  Olá  mundo");
  for (const errada of ["olá", "Olá!", " Olá", "Olá mundo"]) expect(corrigirObjetivo(errada, saida).acertou).toBe(false);
  expect(corrigirObjetivo("\nOlá  \t\r\n", saida).acertou).toBe(true);
  expect(corrigirObjetivo("==", { ...saida, resposta_esperada: "=" }).acertou).toBe(false);
  expect(corrigirObjetivo("a", escolha(1)).acertou).toBe(true);
  expect(corrigirObjetivo("Primeiro", escolha(1)).acertou).toBe(false);
  expect(corrigir("PRINT", "print").acertou).toBe(true); // Compatibilidade legada.
});
test("erro objetivo mostra dica sem revelar gabarito ou explicação", () => {
  const errado = corrigirObjetivo("b", escolha(1));
  expect(errado.resultado).toBe("errou");
  expect(errado.feedback).toContain(escolha(1).dica);
  expect(errado.feedback).not.toContain(escolha(1).explicacao);
  expect(errado.feedback).not.toContain("Primeiro");
  expect(corrigirObjetivo("a", escolha(1)).feedback).toContain(escolha(1).explicacao);
});
test("planejamento exige objetivos e títulos distintos; prompt contém toda a sequência e nível", () => {
  const plano = EsqueletoSchema.parse({ titulo: "Python", descricao: "Descrição", modulos: Array.from({ length: 6 }, (_, i) => ({ titulo: `Módulo ${i + 1}`, resumo: "Resumo", objetivos: ["Identificar", "Aplicar"], pre_requisitos: [] })) });
  validarEsqueleto(plano);
  expect(() => validarEsqueleto({ ...plano, modulos: plano.modulos.map(m => ({ ...m, titulo: "Mesmo" })) })).toThrow();
  expect(EsqueletoSchema.safeParse({ ...plano, modulos: plano.modulos.map(m => ({ ...m, objetivos: [""] })) }).success).toBe(false);
  for (const nivel of ["iniciante", "intermediario", "avancado"] as const) {
    const prompt = promptModulo({ linguagem: "Python", nivel, tituloTrilha: plano.titulo, tituloModulo: plano.modulos[1].titulo, resumoModulo: "Resumo", posicao: 2, total: 6, plano });
    expect(prompt).toContain(JSON.stringify(plano));
    expect(prompt).toContain(nivel === "iniciante" ? "passo a passo" : nivel === "intermediario" ? "identifique bugs" : "casos extremos");
  }
});
test("conteúdo rejeita seções ausentes, código ausente e perguntas repetidas", () => {
  const m = ModuloSchema.parse({ conteudo, exercicios: [escolha(1), escolha(2), saida] });
  validarModulo(m);
  expect(() => validarModulo({ ...m, conteudo: conteudo.replace("## Conceitos", "## Outro") })).toThrow();
  expect(() => validarModulo({ ...m, conteudo: conteudo.replace(/```[\s\S]*?```/, "") })).toThrow();
  expect(() => validarModulo({ ...m, exercicios: [escolha(1), escolha(1), saida] })).toThrow();
});
test("quatro exercícios válidos não repetem a chamada Gemini", async () => {
  const fetchOriginal = globalThis.fetch; const key = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-key";
  let chamadas = 0;
  globalThis.fetch = (async () => { chamadas++; return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ conteudo, exercicios: [escolha(1), escolha(2), escolha(3), saida] }) }] } }] }); }) as typeof fetch;
  try {
    const result = await gerarJsonGemini({ prompt: () => "Módulo", schema: ModuloSchema, validar: validarModulo, responseSchema: moduloJsonSchema });
    expect(result.exercicios).toHaveLength(3); expect(chamadas).toBe(1);
  } finally { globalThis.fetch = fetchOriginal; if (key === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = key; }
});
