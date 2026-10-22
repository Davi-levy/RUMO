import { useEffect, useRef } from "react";
import { blackGradientAt } from "@/lib/black-gradient";

const initialBackground = blackGradientAt(0);

export function BlackGradientBackground() {
  const element = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const surface = element.current;
    if (!surface) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let elapsed = 0;
    let previous: number | null = null;
    let stopped = false;

    const tick = (now: number) => {
      if (stopped || document.hidden || reducedMotion.matches) return;
      if (previous !== null) elapsed += (now - previous) / 1000;
      previous = now;
      surface.style.backgroundImage = blackGradientAt(elapsed);
      frame = requestAnimationFrame(tick);
    };
    const synchronize = () => {
      cancelAnimationFrame(frame);
      previous = null;
      if (!document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(tick);
    };

    synchronize();
    reducedMotion.addEventListener("change", synchronize);
    document.addEventListener("visibilitychange", synchronize);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      reducedMotion.removeEventListener("change", synchronize);
      document.removeEventListener("visibilitychange", synchronize);
    };
  }, []);

  return <div ref={element} className="black-gradient-background" aria-hidden="true" style={{ backgroundImage: initialBackground }} />;
}
