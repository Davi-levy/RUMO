import { z } from "zod";
import { extrairJson } from "./trilha.server";

const ResponseSchema = z.object({
  promptFeedback: z.object({ blockReason: z.string().optional() }).optional(),
  candidates: z.array(z.object({
    finishReason: z.string().optional(),
    content: z.object({ parts: z.array(z.object({
      text: z.string().optional(), thought: z.boolean().optional(),
    })) }).optional(),
  })).optional(),
});

export async function gerarJsonGemini<T>(options: {
  prompt: (erroAnterior?: string) => string;
  schema: z.ZodType<T>;
  validar: (value: T) => void;
  responseSchema: Record<string, unknown>;
}) {
  const key = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
  if (!key) throw new Error("Configure GEMINI_API_KEY no servidor para gerar trilhas.");
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw new Error("GEMINI_MODEL inválido.");

  let erroAnterior: string | undefined;
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    let response: Response;
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        signal: AbortSignal.timeout(90_000),
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: options.prompt(erroAnterior) }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: options.responseSchema,
            maxOutputTokens: 8192,
          },
        }),
      });
    } catch {
      throw new Error("Não foi possível conectar ao Gemini ou o tempo de espera terminou. Tente novamente.");
    }

    // Nunca repassa o corpo de erros do provedor: pode conter informações sensíveis.
    if (!response.ok) {
      if (response.status === 429) throw new Error("Limite de uso do Gemini atingido. Aguarde e verifique a cota da API.");
      if (response.status === 401 || response.status === 403) throw new Error("O Gemini recusou o acesso. Verifique a chave e as permissões no servidor.");
      if (response.status === 404) throw new Error("Modelo Gemini indisponível. Verifique GEMINI_MODEL no servidor.");
      throw new Error("O Gemini não conseguiu gerar o conteúdo. Tente novamente.");
    }

    let result: z.infer<typeof ResponseSchema>;
    try {
      result = ResponseSchema.parse(await response.json());
    } catch {
      throw new Error("O Gemini retornou uma resposta inesperada. Tente novamente.");
    }
    const candidate = result.candidates?.[0];
    if (result.promptFeedback?.blockReason || (candidate?.finishReason && !["STOP", "MAX_TOKENS"].includes(candidate.finishReason))) {
      throw new Error("O Gemini não pôde gerar esse conteúdo. Tente outro tema.");
    }

    try {
      if (candidate?.finishReason === "MAX_TOKENS") throw new Error("Resposta incompleta");
      const text = candidate?.content?.parts.filter(p => !p.thought).map(p => p.text ?? "").join("") ?? "";
      const value = options.schema.parse(extrairJson(text));
      options.validar(value);
      return value;
    } catch {
      // Uma única nova tentativa para JSON incompleto ou conteúdo inválido.
      erroAnterior = "JSON incompleto ou conteúdo fora do formato solicitado";
    }
  }
  throw new Error("O Gemini não retornou conteúdo válido após duas tentativas. Tente novamente.");
}

const string = { type: "string" };
export const esqueletoJsonSchema = {
  type: "object",
  properties: {
    titulo: string, descricao: string,
    modulos: { type: "array", minItems: 6, maxItems: 6, items: {
      type: "object", properties: { titulo: string, resumo: string }, required: ["titulo", "resumo"],
    } },
  },
  required: ["titulo", "descricao", "modulos"],
};

export const moduloJsonSchema = {
  type: "object",
  properties: {
    conteudo: string,
    exercicios: { type: "array", minItems: 3, maxItems: 3, items: {
      type: "object", properties: {
        pergunta: string, resposta_esperada: string,
        dica: { type: ["string", "null"] }, explicacao: { type: ["string", "null"] },
      }, required: ["pergunta", "resposta_esperada"],
    } },
  },
  required: ["conteudo", "exercicios"],
};
