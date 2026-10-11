import { z } from "zod";

import type { Nivel } from "./trilha.shared";
export { NIVEIS, type Nivel } from "./trilha.shared";

export function rotuloNivel(nivel: Nivel) {
  return nivel === "iniciante"
    ? "iniciante absoluto"
    : nivel === "intermediario"
      ? "intermediário"
      : "avançado";
}

// --- Etapa 1: esqueleto da trilha (rápido, poucos tokens) ---

export const EsqueletoSchema = z.object({
  titulo: z.string().max(200),
  descricao: z.string().max(1000),
  modulos: z.array(z.object({ titulo: z.string().max(200), resumo: z.string().max(2000) })).max(6),
});

export type Esqueleto = z.infer<typeof EsqueletoSchema>;

export function promptEsqueleto(linguagem: string, nivel: Nivel, erroAnterior?: string) {
  return `Você é um professor especialista em ${linguagem}. Planeje uma trilha de estudos em PORTUGUÊS DO BRASIL para um aluno de nível ${rotuloNivel(nivel)}.

Regras:
- Exatamente 6 módulos, em ordem didática crescente.
- "titulo": curto. "resumo": uma frase dizendo o que o módulo ensina.
- Não escreva o conteúdo dos módulos agora.

Responda SOMENTE com JSON válido, sem texto antes ou depois:
{"titulo":"...","descricao":"...","modulos":[{"titulo":"...","resumo":"..."}]}${
    erroAnterior ? `\n\nATENÇÃO: a resposta anterior foi rejeitada (${erroAnterior}). Devolva apenas o JSON completo e fechado.` : ""
  }`;
}

export function validarEsqueleto(e: Esqueleto) {
  if (!e.titulo.trim() || !e.descricao.trim()) throw new Error("título ou descrição vazios");
  if (e.modulos.length < 4) throw new Error(`só ${e.modulos.length} módulos foram planejados`);
  e.modulos.forEach((m, i) => {
    if (!m.titulo.trim()) throw new Error(`módulo ${i + 1} sem título`);
  });
}

// --- Etapa 2: conteúdo de um módulo por vez ---

export const ModuloSchema = z.object({
  conteudo: z.string(),
  exercicios: z.array(
    z.object({
      pergunta: z.string(),
      resposta_esperada: z.string(),
      dica: z.string().nullable().optional(),
      explicacao: z.string().nullable().optional(),
    }),
  ),
});

export type ModuloGerado = z.infer<typeof ModuloSchema>;

export function promptModulo(
  args: {
    linguagem: string;
    nivel: Nivel;
    tituloTrilha: string;
    tituloModulo: string;
    resumoModulo: string;
    posicao: number;
    total: number;
  },
  erroAnterior?: string,
) {
  return `Você é um professor especialista em ${args.linguagem}. Escreva o módulo ${args.posicao} de ${args.total} da trilha "${args.tituloTrilha}", para um aluno de nível ${rotuloNivel(args.nivel)}. Tudo em PORTUGUÊS DO BRASIL.

Módulo: "${args.tituloModulo}" — ${args.resumoModulo}

Regras:
- "conteudo": Markdown com 250 a 400 palavras, explicação clara + pelo menos um exemplo de código em bloco \`\`\`.
- 3 exercícios.
- "resposta_esperada" deve ser CURTA e objetiva (uma palavra, um termo, uma linha de código ou uma frase curta), porque a correção é por comparação textual. Nunca peça respostas dissertativas.
- "dica" é uma pista curta. "explicacao" explica em 1-2 frases por que a resposta é essa.
- Dentro das strings JSON use \\n para quebras de linha.

Responda SOMENTE com JSON válido, sem texto antes ou depois:
{"conteudo":"...","exercicios":[{"pergunta":"...","resposta_esperada":"...","dica":"...","explicacao":"..."}]}${
    erroAnterior ? `\n\nATENÇÃO: a resposta anterior foi rejeitada (${erroAnterior}). Devolva apenas o JSON completo e fechado.` : ""
  }`;
}

export function validarModulo(m: ModuloGerado) {
  if (m.conteudo.trim().length < 150) throw new Error("conteúdo muito curto");
  if (m.exercicios.length < 2) throw new Error("poucos exercícios");
  m.exercicios.forEach((ex, j) => {
    if (!ex.pergunta.trim() || !ex.resposta_esperada.trim())
      throw new Error(`exercício ${j + 1} incompleto`);
  });
}

// --- Parser tolerante a cercas de markdown / texto extra ---

export function extrairJson(text: string): unknown {
  let raw = text.trim();
  // O conteúdo do módulo contém cercas de código dentro das strings JSON.
  // Parsear primeiro impede confundi-las com uma cerca ao redor da resposta.
  try {
    return JSON.parse(raw);
  } catch {
    // Aceita também uma resposta envolvida em Markdown ou texto extra.
  }
  const fence = raw.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/i);
  if (fence?.[1]) raw = fence[1].trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("resposta sem JSON");
  if (start > 0 || end < raw.length - 1) raw = raw.slice(start, end + 1);
  return JSON.parse(raw);
}

