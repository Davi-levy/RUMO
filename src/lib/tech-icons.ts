export type Technology = {
  name: string;
  icon: string;
  color: string;
  aliases: readonly string[];
  darkClassName?: string;
};

// SVGs locais: não dependemos de serviços externos para exibir as etiquetas.
export const techIcons: Record<string, Technology> = {
  python: { name: "Python", icon: "python", color: "#3776AB", aliases: ["py"] },
  javascript: { name: "JavaScript", icon: "javascript", color: "#F7DF1E", aliases: ["js", "java script"] },
  typescript: { name: "TypeScript", icon: "typescript", color: "#3178C6", aliases: ["ts", "type script"] },
  rust: { name: "Rust", icon: "rust", color: "#000000", aliases: [], darkClassName: "invert" },
  go: { name: "Go", icon: "go", color: "#00ADD8", aliases: ["golang"] },
  react: { name: "React", icon: "react", color: "#61DAFB", aliases: ["react.js", "reactjs", "react js"] },
  reactnative: { name: "React Native", icon: "react", color: "#61DAFB", aliases: ["react-native", "react native"] },
  expo: { name: "Expo", icon: "expo", color: "#FFFFFF", aliases: ["expo go", "expo sdk"] },
  java: { name: "Java", icon: "java", color: "#007396", aliases: [] },
  kotlin: { name: "Kotlin", icon: "kotlin", color: "#7F52FF", aliases: [] },
  nextjs: { name: "Next.js", icon: "nextjs", color: "#000000", aliases: ["next.js", "next js", "next-js"], darkClassName: "invert" },
  c: { name: "C", icon: "c", color: "#A8B9CC", aliases: [] },
  django: { name: "Django", icon: "django", color: "#092E20", aliases: [], darkClassName: "brightness-0 invert" },
  sql: { name: "SQL", icon: "database", color: "currentColor", aliases: [] },
  claude: { name: "Claude", icon: "claude", color: "#D97757", aliases: ["claude ai", "claude code", "anthropic claude", "anthropic"] },
  gemini: { name: "Gemini", icon: "gemini", color: "#4285F4", aliases: ["google gemini", "gemini ai", "gemini cli"] },
  chatgpt: { name: "ChatGPT", icon: "openai", color: "#FFFFFF", aliases: ["chat gpt", "gpt", "openai", "open ai", "openai chatgpt"] },
  codex: { name: "Codex", icon: "openai", color: "#FFFFFF", aliases: ["openai codex", "codex cli"] },
};

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");
const technologyByAlias = new Map(
  Object.entries(techIcons).flatMap(([key, technology]) =>
    [key, technology.name, ...technology.aliases].map(alias => [normalize(alias), technology] as const),
  ),
);

export function getTechnology(language: string): Technology | undefined {
  return technologyByAlias.get(normalize(language)) ?? getTechnologies(language)[0];
}

const technologyPatterns = [...technologyByAlias].map(([alias, technology]) => ({
  technology,
  pattern: new RegExp(
    `(^|[^\\p{L}\\p{N}_+#])(${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?=$|[^\\p{L}\\p{N}_+#])`,
    "gu",
  ),
}));

export function getTechnologies(language: string): Technology[] {
  const text = normalize(language);
  const matches = technologyPatterns.flatMap(({ technology, pattern }) =>
    [...text.matchAll(pattern)].map(match => ({
      technology, start: match.index + match[1].length,
      end: match.index + match[1].length + match[2].length,
    })),
  ).sort((a, b) => a.start - b.start || b.end - a.end);

  const technologies: Technology[] = [];
  let end = -1;
  for (const match of matches) {
    // O nome mais específico prevalece: React Native não duplica React;
    // Expo Go não adiciona a linguagem Go por engano.
    if (match.start < end) continue;
    end = match.end;
    if (!technologies.includes(match.technology)) technologies.push(match.technology);
  }
  return technologies;
}
