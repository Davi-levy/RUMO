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
  ruby: { name: "Ruby", icon: "ruby", color: "#CC342D", aliases: [] },
  rails: { name: "Ruby on Rails", icon: "rails", color: "#D30001", aliases: ["rails", "ruby-on-rails", "ruby on rails", "rubyonrails"] },
  lua: { name: "Lua", icon: "lua", color: "#000080", aliases: [], darkClassName: "brightness-0 invert" },
  luau: { name: "Luau", icon: "", color: "#00A2FF", aliases: [] },
  php: { name: "PHP", icon: "php", color: "#777BB4", aliases: [] },
  laravel: { name: "Laravel", icon: "laravel", color: "#FF2D20", aliases: [] },
  cpp: { name: "C++", icon: "cplusplus", color: "#00599C", aliases: ["cpp", "cplusplus", "c plus plus"] },
  csharp: { name: "C#", icon: "csharp", color: "#512BD4", aliases: ["csharp", "c sharp", "c-sharp"] },
  swift: { name: "Swift", icon: "swift", color: "#F05138", aliases: [] },
  dart: { name: "Dart", icon: "dart", color: "#0175C2", aliases: [] },
  flutter: { name: "Flutter", icon: "flutter", color: "#02569B", aliases: [] },
  nodejs: { name: "Node.js", icon: "nodejs", color: "#5FA04E", aliases: ["node.js", "node js", "node-js", "node"] },
  vuejs: { name: "Vue.js", icon: "vuejs", color: "#4FC08D", aliases: ["vue.js", "vue js", "vue-js", "vue"] },
  angular: { name: "Angular", icon: "angular", color: "#DD0031", aliases: ["angularjs", "angular.js"] },
  svelte: { name: "Svelte", icon: "svelte", color: "#FF3E00", aliases: [] },
  html: { name: "HTML", icon: "html5", color: "#E34F26", aliases: ["html5", "html 5"] },
  css: { name: "CSS", icon: "css3", color: "#1572B6", aliases: ["css3", "css 3"] },
  bash: { name: "Bash", icon: "bash", color: "#4EAA25", aliases: ["gnu bash"], darkClassName: "brightness-0 invert" },
  git: { name: "Git", icon: "git", color: "#F05032", aliases: ["git scm", "git-scm"] },
  r: { name: "R", icon: "r", color: "#276DC3", aliases: ["r language", "r linguagem"] },
  scala: { name: "Scala", icon: "scala", color: "#DC322F", aliases: [] },
  elixir: { name: "Elixir", icon: "elixir", color: "#4B275F", aliases: [] },
  haskell: { name: "Haskell", icon: "haskell", color: "#5D4F85", aliases: [] },
  perl: { name: "Perl", icon: "perl", color: "#39457E", aliases: [] },
  claude: { name: "Claude", icon: "claude", color: "#D97757", aliases: ["claude ai", "claude code", "anthropic claude", "anthropic"] },
  gemini: { name: "Gemini", icon: "gemini", color: "#4285F4", aliases: ["google gemini", "gemini ai", "gemini cli"] },
  chatgpt: { name: "ChatGPT", icon: "openai", color: "#FFFFFF", aliases: ["chat gpt", "gpt", "openai", "open ai", "openai chatgpt"] },
  codex: { name: "Codex", icon: "openai", color: "#FFFFFF", aliases: ["openai codex", "codex cli"] },
  deepseek: { name: "DeepSeek", icon: "deepseek", color: "#4D6BFE", aliases: ["deep seek", "deepseek ai", "deepseek r1", "deepseek v3"] },
  grok: { name: "Grok", icon: "grok", color: "#FFFFFF", aliases: ["xai grok", "grok ai"], darkClassName: "brightness-0 invert" },
  mistral: { name: "Mistral", icon: "mistral", color: "#FF7000", aliases: ["mistral ai", "mistralai", "le chat"] },
  qwen: { name: "Qwen", icon: "qwen", color: "#615CED", aliases: ["qwen ai", "qwen coder", "qwen2", "qwen3"] },
  llama: { name: "Llama", icon: "llama", color: "#0866FF", aliases: ["meta llama", "llama ai", "llama 3", "llama 4"] },
  perplexity: { name: "Perplexity", icon: "perplexity", color: "#20808D", aliases: ["perplexity ai"] },
  copilot: { name: "Microsoft Copilot", icon: "copilot", color: "#0078D4", aliases: ["copilot", "microsoft copilot", "bing copilot"] },
  githubcopilot: { name: "GitHub Copilot", icon: "githubcopilot", color: "#FFFFFF", aliases: ["github copilot", "git hub copilot", "github-copilot"], darkClassName: "brightness-0 invert" },
  linux: { name: "Linux", icon: "linux", color: "#FCC624", aliases: ["gnu/linux", "gnu linux"] },
  android: { name: "Android", icon: "android", color: "#3DDC84", aliases: ["android studio", "android sdk"] },
  ios: { name: "iOS", icon: "ios", color: "#FFFFFF", aliases: ["iphone os", "ipados", "ipad os"], darkClassName: "brightness-0 invert" },
  windows: { name: "Windows", icon: "windows", color: "#0078D4", aliases: ["microsoft windows", "windows10", "windows11", "win10", "win11"] },
  macos: { name: "macOS", icon: "macos", color: "#FFFFFF", aliases: ["mac os", "mac os x", "osx", "os x"], darkClassName: "brightness-0 invert" },
  ubuntu: { name: "Ubuntu", icon: "ubuntu", color: "#E95420", aliases: ["ubuntu linux"] },
  debian: { name: "Debian", icon: "debian", color: "#A81D33", aliases: ["debian linux"] },
  roblox: { name: "Roblox", icon: "roblox", color: "#FFFFFF", aliases: ["roblox studio", "robloxstudio"], darkClassName: "brightness-0 invert" },
  minecraft: { name: "Minecraft", icon: "minecraft", color: "#62B47A", aliases: ["mine craft"], darkClassName: "brightness-0 invert" },
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
