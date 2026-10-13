import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { segredoGeracao } from "./trilha-autorizacao.server";

function chave() { return createHash("sha256").update(`rumo:conteudo:v1:${segredoGeracao()}`).digest(); }

export function protegerConteudo(conteudo: unknown, usuarioId: string, geracaoId: string, posicao: number) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", chave(), iv);
  cipher.setAAD(Buffer.from(`${usuarioId}:${geracaoId}:${posicao}`));
  const payload = Buffer.concat([cipher.update(JSON.stringify(conteudo), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), payload].map(b => b.toString("base64url")).join(".");
}

export function abrirConteudo(token: string, usuarioId: string, geracaoId: string, posicao: number): unknown {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || parts.some(p => !/^[\w-]+$/.test(p))) throw new Error();
    const [iv, tag, payload] = parts.map(p => Buffer.from(p, "base64url"));
    const cipher = createDecipheriv("aes-256-gcm", chave(), iv);
    cipher.setAAD(Buffer.from(`${usuarioId}:${geracaoId}:${posicao}`));
    cipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([cipher.update(payload), cipher.final()]).toString("utf8"));
  } catch { throw new Error("Conteúdo inválido. Inicie uma nova geração."); }
}
