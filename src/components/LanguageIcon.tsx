import { Database } from "lucide-react";
import { getTechnology } from "@/lib/tech-icons";

export function LanguageIcon({ language, originalColors = false }: { language: string; originalColors?: boolean }) {
  const technology = getTechnology(language);
  if (!technology || !technology.icon) return null;

  if (technology.icon === "database") {
    return <Database className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;
  }

  return (
    <img
      src={`/icons/languages/${technology.icon}.svg`}
      alt=""
      width={14}
      height={14}
      className={`h-3.5 w-3.5 shrink-0 ${originalColors && technology.icon === "django"
        ? "rounded-[2px] bg-white p-px"
        : technology.darkClassName ?? ""}`}
    />
  );
}
