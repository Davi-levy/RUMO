import { afterEach, expect, test } from "bun:test";
import { abrirConteudo, protegerConteudo } from "../src/lib/conteudo-protegido.server";

const original = process.env.TRILHA_GENERATION_SECRET;
afterEach(() => {
  if (original === undefined) delete process.env.TRILHA_GENERATION_SECRET;
  else process.env.TRILHA_GENERATION_SECRET = original;
});

test("gabaritos cifrados não podem ser lidos, alterados ou usados por outro usuário/módulo", () => {
  process.env.TRILHA_GENERATION_SECRET = "segredo-de-teste-com-mais-de-32-caracteres";
  const conteudo = { resposta_esperada: "GABARITO_PRIVADO", explicacao: "Explicação privada" };
  const token = protegerConteudo(conteudo, "usuario", "geracao", 1);
  expect(token).not.toContain("GABARITO_PRIVADO");
  expect(abrirConteudo(token, "usuario", "geracao", 1)).toEqual(conteudo);
  expect(() => abrirConteudo(token, "outro", "geracao", 1)).toThrow();
  expect(() => abrirConteudo(token, "usuario", "outra", 1)).toThrow();
  expect(() => abrirConteudo(token, "usuario", "geracao", 2)).toThrow();
  const partes = token.split(".");
  partes[2] = (partes[2][0] === "a" ? "b" : "a") + partes[2].slice(1);
  expect(() => abrirConteudo(partes.join("."), "usuario", "geracao", 1)).toThrow();
  expect(protegerConteudo(conteudo, "usuario", "geracao", 1)).not.toBe(token);
});
