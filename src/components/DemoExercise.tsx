import { useId, useState } from "react";
import { Check, Lightbulb, RotateCcw } from "lucide-react";
import type { DemoLesson } from "@/lib/public-content";

export function DemoExercise({ lesson }: { lesson: DemoLesson }) {
  const id = useId();
  const [choice, setChoice] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "review" | null>(null);
  const [hint, setHint] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const finished = feedback === "correct" || revealed;
  const solution = lesson.choices.find((c) => c.id === lesson.correctId)!;

  function reset() {
    setChoice("");
    setFeedback(null);
    setHint(false);
    setRevealed(false);
  }

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (choice && !finished)
            setFeedback(choice === lesson.correctId ? "correct" : "review");
        }}
      >
        <fieldset disabled={finished}>
          <legend className="text-base font-medium leading-relaxed">
            {lesson.question}
          </legend>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {lesson.choices.map((option) => (
              <label
                key={option.id}
                htmlFor={`${id}-${option.id}`}
                className={`flex min-h-14 cursor-pointer items-center gap-3 border px-4 py-3 text-sm transition-colors hover:border-foreground/50 ${choice === option.id ? "border-foreground bg-white/[0.04]" : "border-border"} ${finished ? "cursor-default" : ""}`}
              >
                <input
                  id={`${id}-${option.id}`}
                  type="radio"
                  name={id}
                  value={option.id}
                  checked={choice === option.id}
                  onChange={() => {
                    setChoice(option.id);
                    setFeedback(null);
                  }}
                  className="h-4 w-4 shrink-0 accent-white"
                />
                <span className="break-words">{option.text}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={!choice || finished}
            className="cursor-pointer bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Verificar resposta
          </button>
          <button
            type="button"
            aria-expanded={hint}
            onClick={() => setHint((h) => !h)}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Lightbulb className="h-4 w-4" aria-hidden="true" />
            {hint ? "Ocultar dica" : "Uma dica?"}
          </button>
        </div>
      </form>
      {hint && (
        <p className="mt-4 border-l-2 border-border pl-4 text-sm leading-relaxed text-muted-foreground">
          {lesson.hint}
        </p>
      )}
      <div aria-live="polite" aria-atomic="true">
        {feedback === "review" && !revealed && (
          <div className="mt-5 border border-border bg-white/[0.02] p-4 text-sm leading-relaxed">
            <p className="font-medium">Revise sua resposta.</p>
            <p className="mt-2 text-muted-foreground">{lesson.hint}</p>
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="mt-3 min-h-10 cursor-pointer underline underline-offset-4 hover:opacity-70"
            >
              Ver solução
            </button>
          </div>
        )}
        {(feedback === "correct" || revealed) && (
          <div className="mt-5 border border-border bg-white/[0.02] p-4 text-sm leading-relaxed">
            <p className="flex items-center gap-2 font-medium">
              {!revealed && (
                <Check
                  className="h-4 w-4 text-emerald-400"
                  aria-hidden="true"
                />
              )}
              {revealed ? "Solução consultada" : "Correto!"}
            </p>
            {revealed && <p className="mt-2">Resposta: {solution.text}</p>}
            <p className="mt-2 text-muted-foreground">{lesson.explanation}</p>
            <button
              type="button"
              onClick={reset}
              className="mt-3 inline-flex min-h-10 cursor-pointer items-center gap-2 text-xs underline underline-offset-4 hover:opacity-70"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Recomeçar o exercício
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
