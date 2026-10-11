import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface GlyphMatrixProps {
  glyphs?: string;
  cellSize?: number;
  mutationRate?: number;
  interval?: number;
  color?: string;
  className?: string;
}

const DEFAULT_GLYPHS = "01·•+*/\\<>=";
const MAX_CELLS = 10_000;
const finite = (value: number, fallback: number) => Number.isFinite(value) ? value : fallback;

export function GlyphMatrix({ glyphs = DEFAULT_GLYPHS, cellSize = 14,
  mutationRate = 0.04, interval = 90, color = "#ffffff", className }: GlyphMatrixProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const characters = Array.from(glyphs || DEFAULT_GLYPHS);
    const baseSize = Math.max(12, finite(cellSize, 14));
    const delay = Math.max(90, finite(interval, 90));
    const rate = Math.min(1, Math.max(0, finite(mutationRate, 0.04)));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let size = baseSize;
    let cols = 0;
    let rows = 0;
    let cells: string[] = [];
    let alphas: number[] = [];
    let raf = 0;
    let last = 0;
    let stopped = false;
    const randomGlyph = () => characters[Math.floor(Math.random() * characters.length)];

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.font = `${size - 2}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textBaseline = "top";
      ctx.fillStyle = "#ffffff";
      ctx.fillStyle = color;
      for (let i = 0; i < cells.length; i++) {
        ctx.globalAlpha = alphas[i];
        ctx.fillText(cells[i], (i % cols) * size, Math.floor(i / cols) * size);
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = Math.min(2, Math.max(1, finite(window.devicePixelRatio, 1)));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      size = Math.max(baseSize, Math.sqrt(width * height / MAX_CELLS));
      cols = Math.ceil(width / size);
      rows = Math.ceil(height / size);
      while (cols * rows > MAX_CELLS) {
        size *= 1.05;
        cols = Math.ceil(width / size);
        rows = Math.ceil(height / size);
      }
      cells = Array.from({ length: cols * rows }, randomGlyph);
      alphas = cells.map(() => 0.05 + Math.random() * 0.35);
      draw();
    };

    const tick = (time: number) => {
      if (stopped || document.hidden || reducedMotion.matches) { raf = 0; return; }
      if (time - last >= delay) {
        last = time;
        const mutations = Math.floor(cells.length * rate);
        for (let n = 0; n < mutations; n++) {
          const i = Math.floor(Math.random() * cells.length);
          cells[i] = randomGlyph();
          alphas[i] = 0.05 + Math.random() * 0.45;
        }
        draw();
      }
      raf = requestAnimationFrame(tick);
    };

    const updateMotion = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      last = performance.now();
      if (!stopped && !document.hidden && !reducedMotion.matches) raf = requestAnimationFrame(tick);
    };

    resize();
    updateMotion();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    document.addEventListener("visibilitychange", updateMotion);
    reducedMotion.addEventListener("change", updateMotion);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateMotion);
      reducedMotion.removeEventListener("change", updateMotion);
    };
  }, [glyphs, cellSize, mutationRate, interval, color]);

  return <canvas ref={canvasRef} aria-hidden="true" className={cn("pointer-events-none block h-full w-full", className)} />;
}
