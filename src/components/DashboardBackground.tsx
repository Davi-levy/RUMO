const paths = [
  "M-160 180C100 180 100 420 360 420S620 660 880 660 1180 420 1600 420",
  "M-160 600C140 600 140 260 440 260S740 100 1040 100 1300 340 1600 340",
  "M-160 820C200 820 200 580 560 580S940 820 1240 820 1440 620 1600 620",
  "M1040-120C1040 80 1300 80 1300 300S1100 520 1100 740 1360 940 1360 1080",
];

export function DashboardBackground() {
  return (
    <div className="trilhas-background" aria-hidden="true">
      <div className="trilhas-background-grid" />
      <div className="trilhas-background-glow" />
      <div className="trilhas-background-glow trilhas-background-glow-secondary" />
      <svg
        className="trilhas-background-paths"
        viewBox="0 0 1440 960"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        focusable="false"
      >
        {paths.map((d) => (
          <g key={d}>
            <path className="trilhas-background-track" d={d} />
            <path className="trilhas-background-spark" d={d} pathLength={1} />
          </g>
        ))}
      </svg>
    </div>
  );
}
