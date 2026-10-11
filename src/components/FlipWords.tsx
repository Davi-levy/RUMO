import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FlipWords({ words, duration = 3000, className, colors }: {
  words: readonly string[];
  duration?: number;
  className?: string;
  colors?: Readonly<Record<string, string>>;
}) {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const delay = Number.isFinite(duration) ? Math.max(1000, duration) : 3000;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion || words.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex(value => (value + 1) % words.length);
    }, delay);
    return () => window.clearInterval(timer);
  }, [delay, reducedMotion, words.length]);

  const current = words[reducedMotion ? 0 : index % words.length] ?? "";
  return (
    <>
      <span className="sr-only">linguagens e frameworks</span>
      <span aria-hidden="true" className={cn("relative inline-grid text-left align-top", className)}>
        {/* Reserve the longest word's width so the heading and buttons stay still. */}
        {words.map((word, i) => (
          <span key={`${word}-${i}`} className="invisible col-start-1 row-start-1 whitespace-nowrap">{word}</span>
        ))}
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={current}
            className="absolute inset-x-0 top-0 whitespace-nowrap"
            style={{ color: colors?.[current] }}
            initial={reducedMotion ? false : { opacity: 0, y: 12, rotateX: -45, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
            exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -12, rotateX: 45, filter: "blur(4px)" }}
            transition={{ duration: reducedMotion ? 0 : 0.3, ease: "easeOut" }}
          >
            {Array.from(current).map((letter, i) => (
              <motion.span key={`${current}-${i}`} className="inline-block"
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.2, delay: reducedMotion ? 0 : i * 0.035 }}
              >{letter}</motion.span>
            ))}
          </motion.span>
        </AnimatePresence>
      </span>
    </>
  );
}
