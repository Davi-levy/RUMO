import { createHash } from "node:crypto";
import { getTechnologies } from "./tech-icons";

export type ContextoVideos = {
  linguagem: string;
  nivel: string;
  titulo: string;
  descricao: string | null;
  modulos: { titulo: string }[];
};

const normalizar = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const palavras = (value: string) => normalizar(value).match(/[a-z0-9+#]+/g) ?? [];
const contem = (value: string, term: string) => (` ${palavras(value).join(" ")} `).includes(` ${palavras(term).join(" ")} `);
const assuntos = [
  { pt: "login autenticação", en: "login authentication", aliases: ["login", "autenticacao", "authentication", "sign in", "signin", "auth"] },
  { pt: "banco de dados", en: "database", aliases: ["banco de dados", "database", "sql"] },
  { pt: "deploy publicação", en: "deployment publishing", aliases: ["deploy", "deployment", "publicacao", "publicar", "publishing"] },
  { pt: "formulários", en: "forms", aliases: ["formulario", "formularios", "form", "forms"] },
  { pt: "rotas navegação", en: "routing navigation", aliases: ["rotas", "roteamento", "routing", "navigation", "navegacao"] },
  { pt: "testes", en: "testing", aliases: ["testes", "testing", "tests", "test"] },
  { pt: "CRUD", en: "CRUD", aliases: ["crud"] },
  { pt: "entrevista", en: "interview", aliases: ["entrevista", "interview"] },
];
const ignorar = new Set(palavras("a o as os e de da do das dos com como em no na nos nas para por um uma ao que sua seu aprender aprendendo aprenda criar criando desenvolvendo desenvolvimento implementar implementando introdução fundamentos básico basicos básica básicas iniciante iniciantes intermediário intermediarios avançado avançada absoluto absolutos trilha curso tutorial programação completo completa sistema aplicativo aplicativos usando utilizando the and of with for to in on how learn learning create creating building build development introduction basics beginner beginners intermediate advanced course tutorial programming complete application applications using"));

export function prepararContextoVideos(contexto: ContextoVideos) {
  const principal = `${contexto.linguagem} ${contexto.titulo}`;
  const tecnologias = getTechnologies(contexto.linguagem);
  // Sem tecnologia no pedido, usamos o título; módulos podem citar ferramentas auxiliares.
  if (!tecnologias.length) tecnologias.push(...getTechnologies(contexto.titulo));
  const principais = assuntos.filter(assunto => assunto.aliases.some(alias => contem(principal, alias)));
  const termosTecnologia = new Set(tecnologias.flatMap(tech => [tech.name, ...tech.aliases].flatMap(palavras)));
  const termosAssunto = new Set(principais.flatMap(assunto => assunto.aliases.flatMap(palavras)));
  const especificos = [...new Set(palavras(principal))].filter(word => word.length > 2
    && !ignorar.has(word) && !termosTecnologia.has(word) && !termosAssunto.has(word)).slice(0, 5);
  const secundarios = assuntos.filter(assunto => !principais.includes(assunto)
    && assunto.aliases.some(alias => contexto.modulos.some(modulo => contem(modulo.titulo, alias))));
  const chave = createHash("sha256").update(JSON.stringify({
    versao: 2, linguagem: normalizar(contexto.linguagem), nivel: contexto.nivel,
    titulo: normalizar(contexto.titulo), descricao: normalizar(contexto.descricao ?? ""),
    modulos: contexto.modulos.map(modulo => normalizar(modulo.titulo)),
  })).digest("hex");

  return {
    chave,
    consulta(idioma: "pt" | "en") {
      const foco = principais.length ? principais[0][idioma].split(" ")[0]
        : especificos.length ? especificos.join(" ") : secundarios[0]?.[idioma] ?? "";
      const nivel = idioma === "pt" ? contexto.nivel
        : contexto.nivel === "avancado" ? "advanced" : contexto.nivel === "intermediario" ? "intermediate" : "beginner";
      // Consultas longas com sinônimos e nível eliminam tutoriais úteis no índice do YouTube.
      // O nível complementa pedidos gerais; pedidos específicos priorizam o assunto.
      return `${tecnologias.map(tech => tech.name).join(" ")} ${foco} ${foco ? "" : nivel} tutorial`.replace(/\s+/g, " ").trim();
    },
    relevancia(titulo: string, descricao: string): number {
      const texto = `${titulo} ${descricao}`;
      // React web não substitui React Native. Cada tecnologia explicitamente pedida deve aparecer.
      if (tecnologias.some(tech => ![tech.name, ...tech.aliases].some(alias => contem(texto, alias)))) return 0;
      if (/\b(interview|entrevista|vlog|news|noticias)\b/.test(normalizar(titulo))
        && !/\b(interview|entrevista|vlog|news|noticias)\b/.test(normalizar(principal))) return 0;
      // O assunto central precisa aparecer no título, não só entre palavras-chave da descrição.
      if (principais.length && !principais.some(assunto => assunto.aliases.some(alias => contem(titulo, alias)))) return 0;
      if (!principais.length && especificos.length && !especificos.some(term => contem(titulo, term))) return 0;
      if (!tecnologias.length && !principais.length && !especificos.length) return 0;
      return 1 + tecnologias.filter(tech => [tech.name, ...tech.aliases].some(alias => contem(titulo, alias))).length
        + principais.filter(assunto => assunto.aliases.some(alias => contem(titulo, alias))).length * 3
        + secundarios.filter(assunto => assunto.aliases.some(alias => contem(texto, alias))).length;
    },
  };
}
