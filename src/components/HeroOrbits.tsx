import type { CSSProperties } from "react";
import { techIcons } from "@/lib/tech-icons";

const orbits = [
  { technologies: ["claude", "gemini", "chatgpt"], size: "40%", duration: "40s", offset: 20, reverse: false },
  { technologies: ["react", "nextjs", "django"], size: "64%", duration: "55s", offset: 65, reverse: true },
  { technologies: ["python", "typescript", "java"], size: "88%", duration: "70s", offset: 105, reverse: false },
];

export function HeroOrbits() {
  return (
    <div className="hero-orbits" aria-hidden="true">
      <div className="hero-orbits-center">
        <svg viewBox="0 0 76 64" fill="none" className="hero-orbits-mark" focusable="false">
          <path d="m10 15 17 17-17 17" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M39 9h13c12 0 18 6 18 15 0 7-4 12-10 14l12 17H61L50 39h-2v16h-9V9Zm9 9v13h4c6 0 9-2 9-7s-3-6-9-6h-4Z" fill="currentColor" />
        </svg>
      </div>
      {orbits.map((orbit, orbitIndex) => (
        <div key={orbitIndex} className="hero-orbit" style={{
          "--orbit-size": orbit.size,
          "--orbit-duration": orbit.duration,
          "--orbit-direction": orbit.reverse ? "reverse" : "normal",
          "--icon-direction": orbit.reverse ? "normal" : "reverse",
        } as CSSProperties}>
          <div className="hero-orbit-ring">
            {orbit.technologies.map((key, index) => {
              const technology = techIcons[key];
              const angle = (orbit.offset + index * 120) * Math.PI / 180;
              return (
                <div key={key} className="hero-orbit-position" style={{
                  left: `${(50 + 50 * Math.cos(angle)).toFixed(4)}%`,
                  top: `${(50 + 50 * Math.sin(angle)).toFixed(4)}%`,
                }}>
                  <div className="hero-orbit-icon">
                    <img src={`/icons/languages/${technology.icon}.svg`} alt="" width={24} height={24}
                      className={key === "django" ? "rounded-sm bg-white p-0.5" : technology.darkClassName ?? ""} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
