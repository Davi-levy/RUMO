import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getTechnologies, getTechnology } from "../src/lib/tech-icons";
import { existsSync } from "node:fs";
import { TechnologyBadge } from "../src/components/TechnologyBadge";

const names = (text: string) => getTechnologies(text).map(technology => technology.name);
const badge = (language: string) => renderToStaticMarkup(createElement(TechnologyBadge, { language }));

describe("Tecnologias das trilhas", () => {
  test("etiquetas mostram tecnologias em vez de repetir o pedido completo", () => {
    const pedido = "Como fazer um jogo no roblox usando LuaU";
    expect(names(pedido)).toEqual(["Roblox", "Luau"]);
    expect(badge(pedido)).toContain("Luau");
    expect(badge(pedido)).not.toContain(pedido);
    expect(badge(pedido)).not.toContain('src="/icons/languages/.svg"');
    expect(badge("Como desenvolver um jogo com ferramenta desconhecida")).toContain("Programação");
    expect(badge("Como desenvolver um jogo com ferramenta desconhecida")).not.toContain("Como desenvolver");
    expect(badge("Tecnologia desconhecida")).toContain("Tecnologia desconhecida");
  });

  test("jogos, sistemas e IAs combinam tags sem repetir aliases", () => {
    expect(names("Como criar um jogo no Roblox Studio usando Luau")).toEqual(["Roblox", "Luau"]);
    expect(names("Plugins Minecraft com Java no Windows 11")).toEqual(["Minecraft", "Java", "Windows"]);
    expect(names("Android Studio, iOS e Linux")).toEqual(["Android", "iOS", "Linux"]);
    expect(names("Ubuntu Linux com Bash e Debian Linux")).toEqual(["Ubuntu", "Bash", "Debian"]);
    expect(names("GitHub Copilot e Microsoft Copilot com DeepSeek R1")).toEqual(["GitHub Copilot", "Microsoft Copilot", "DeepSeek"]);
    expect(names("Grok, Mistral AI, Qwen Coder, Meta Llama, Perplexity AI")).toEqual(["Grok", "Mistral", "Qwen", "Llama", "Perplexity"]);
    expect(names("metadados, androides, minecrafting, grokking")).toEqual([]);
    const html = badge("Roblox Studio com Luau, DeepSeek e Windows");
    expect(html).toContain("roblox.svg");
    expect(html).toContain("deepseek.svg");
    expect(html).toContain("Mais tecnologias: Windows");
    for (const nome of ["Linux", "Android", "iOS", "Windows", "macOS", "Ubuntu", "Debian", "Roblox", "Minecraft", "DeepSeek", "Grok", "Mistral", "Qwen", "Llama", "Perplexity", "Microsoft Copilot", "GitHub Copilot"]) {
      const tech = getTechnology(nome);
      expect(tech?.name).toBe(nome);
      expect(existsSync(new URL(`../public/icons/languages/${tech?.icon}.svg`, import.meta.url))).toBe(true);
    }
  });
  test("reconhece React Native e Expo sem adicionar React ou Go indevidamente", () => {
    expect(names("Como criar login com React Native Expo Go")).toEqual(["React Native", "Expo"]);
    expect(names("React com Expo")).toEqual(["React", "Expo"]);
  });

  test("mantém a ordem e elimina tecnologias repetidas e aliases", () => {
    expect(names("PYTHON, React.js, JavaScript, python, JS")).toEqual(["Python", "React", "JavaScript"]);
  });

  test("não confunde palavras parecidas nem linguagens diferentes", () => {
    expect(names("Reactive, Preact, C++, C#, JavaScript")).toEqual(["C++", "C#", "JavaScript"]);
    expect(names("Tecnologia desconhecida")).toEqual([]);
    expect(badge("Tecnologia desconhecida")).not.toContain("<img");
    expect(badge("Tecnologia desconhecida")).toContain("Tecnologia desconhecida");
  });

  test("novas tecnologias possuem SVGs locais e não duplicam nomes específicos", () => {
    const tecnologias = ["Ruby", "Ruby on Rails", "Lua", "PHP", "Laravel", "C++", "C#", "Swift", "Dart", "Flutter", "Node.js", "Vue.js", "Angular", "Svelte", "HTML", "CSS", "Bash", "R", "Scala", "Elixir", "Haskell", "Perl"];
    for (const nome of tecnologias) {
      const tech = getTechnology(nome);
      expect(tech?.name).toBe(nome);
      expect(existsSync(new URL(`../public/icons/languages/${tech?.icon}.svg`, import.meta.url))).toBe(true);
    }
    expect(names("Ruby on Rails com PHP e Laravel")).toEqual(["Ruby on Rails", "PHP", "Laravel"]);
    expect(names("cpp, csharp, NodeJS, Vue, HTML5, CSS3")).toEqual(["C++", "C#", "Node.js", "Vue.js", "HTML", "CSS"]);
    expect(names("Escala, fluttering, pearls, angularidade")).toEqual([]);
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
