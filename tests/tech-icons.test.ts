import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getTechnologies } from "../src/lib/tech-icons";
import { TechnologyBadge } from "../src/components/TechnologyBadge";

const names = (text: string) => getTechnologies(text).map(technology => technology.name);
const badge = (language: string) => renderToStaticMarkup(createElement(TechnologyBadge, { language }));

describe("Tecnologias das trilhas", () => {
  test("reconhece React Native e Expo sem adicionar React ou Go indevidamente", () => {
    expect(names("Como criar login com React Native Expo Go")).toEqual(["React Native", "Expo"]);
    expect(names("React com Expo")).toEqual(["React", "Expo"]);
  });

  test("mantém a ordem e elimina tecnologias repetidas e aliases", () => {
    expect(names("PYTHON, React.js, JavaScript, python, JS")).toEqual(["Python", "React", "JavaScript"]);
  });

  test("não confunde palavras parecidas nem linguagens diferentes", () => {
    expect(names("Reactive, Preact, C++, C#, JavaScript")).toEqual(["JavaScript"]);
    expect(names("Tecnologia desconhecida")).toEqual([]);
    expect(badge("Tecnologia desconhecida")).not.toContain("<img");
    expect(badge("Tecnologia desconhecida")).toContain("Tecnologia desconhecida");
  });

  test("exibe até três etiquetas e sinaliza as demais com +", () => {
    const html = badge("Python, React, Java, Kotlin e Django");
    expect((html.match(/<img\b/g) ?? []).length).toBe(3);
    expect(html).toContain("Mais tecnologias: Kotlin, Django");
    expect(html).not.toContain("kotlin.svg");
    expect(html).not.toContain("django.svg");
  });

  test("duas ou três tecnologias aparecem sem o sinal de mais", () => {
    expect(badge("React com Expo")).toContain("expo.svg");
    expect(badge("React com Expo")).toContain("react.svg");
    expect(badge("Python, React e Java")).not.toContain("Mais tecnologias");
  });
});
