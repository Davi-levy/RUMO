import { expect, test } from "bun:test";
import python from "./fixtures/conteudo-python.json";
import react from "./fixtures/conteudo-react.json";
import sql from "./fixtures/conteudo-sql.json";
import { corrigirObjetivo } from "../src/lib/correcao";
import { EsqueletoSchema, ModuloSchema, validarEsqueleto, validarModulo } from "../src/lib/trilha.server";

// Referências geradas e revisadas manualmente. Não executamos os trechos.
const gabaritos = [["b", "c", "10"], ["a", "d", "7"], ["c", "b", "5"],
  ["b", "c", "b"], ["a", "d", "c"], ["c", "a", "false"],
  ["b", "c", "b"], ["a", "d", "a"], ["b", "a", "c"]];
const exemplos = [...python, ...react, ...sql];
for (const [i, exemplo] of exemplos.entries()) {
  test(`referência revisada: ${exemplo.linguagem} / ${exemplo.nivel}`, () => {
    const plano = EsqueletoSchema.parse(exemplo.planejamento);
    validarEsqueleto(plano);
    const modulo = ModuloSchema.parse(exemplo.modulo);
    validarModulo(modulo);
    const palavras = modulo.conteudo.split(/\s+/).length;
    expect(palavras).toBeGreaterThanOrEqual(350);
    expect(palavras).toBeLessThanOrEqual(600);
    for (const objetivo of plano.modulos[exemplo.posicao - 1].objetivos) expect(modulo.conteudo).toContain(objetivo);
    modulo.exercicios.forEach((ex, j) => {
      expect(ex.resposta_esperada).toBe(gabaritos[i][j]);
      expect(corrigirObjetivo(gabaritos[i][j], ex).acertou).toBe(true);
      expect(corrigirObjetivo("Resposta incorreta", ex).acertou).toBe(false);
    });
    if (exemplo.linguagem === "SQL" || (exemplo.linguagem === "React" && exemplo.nivel !== "avancado")) {
      expect(modulo.exercicios.every(ex => ex.tipo === "multipla_escolha")).toBe(true);
    }
  });
}
