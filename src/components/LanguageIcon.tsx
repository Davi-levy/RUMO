import { Database } from "lucide-react";

const icons: Record<string, string> = {
  Python: "python",
  JavaScript: "javascript",
  TypeScript: "typescript",
  Rust: "rust",
  Go: "go",
  React: "react",
  Java: "java",
  Kotlin: "kotlin",
  "Next.js": "nextjs",
  C: "c",
  Django: "django",
};

export function LanguageIcon({ language }: { language: string }) {
  if (language === "SQL") {
    return <Database className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
  }

  const icon = icons[language];
  if (!icon) return null;

  return (
    <img
      src={`/icons/languages/${icon}.svg`}
      alt=""
      width={14}
      height={14}
      className={`h-3.5 w-3.5 shrink-0 ${language === "Django" ? "brightness-0 invert" : language === "Rust" || language === "Next.js" ? "invert" : ""}`}
    />
  );
}
