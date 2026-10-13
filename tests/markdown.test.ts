import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Markdown } from "../src/components/Markdown";

const render = (content: string) => renderToStaticMarkup(createElement(Markdown, { children: content }));

test("blocos com e sem linguagem usam o editor sem aninhar elementos pre", () => {
  const html = render('Use `print` aqui.\n\n```python\nprint("Olá")\n\nprint(2)\n```\n\n```\ntexto simples\n```');
  expect((html.match(/<pre\b/g) ?? []).length).toBe(2);
  expect((html.match(/aria-label="Copiar código"/g) ?? []).length).toBe(2);
  expect(html).toContain("<code>print</code>");
  expect(html).not.toMatch(/<pre[^>]*>\s*<div/);
  expect(html).toContain("3 linhas");
  expect(html).toContain("1 linha");
});

test("preserva C++ e linguagens desconhecidas e exibe HTML como texto seguro", () => {
  const html = render('```c++\nint main() {}\n```\n\n```desconhecida\n<script>alert(1)</script>\n```');
  expect(html).toContain("c++");
  expect(html).toContain("desconhecida");
  expect(html).not.toContain("<script>");
  expect(html).toContain("&lt;script&gt;");
});
