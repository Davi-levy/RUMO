// Black Gradient / Bloom Field, a partir dos parâmetros fornecidos do 21st.dev.
const seed = 452026671;
const phase = (offset: number) => {
  const value = Math.sin(seed + offset) * 43758;
  return (value - Math.floor(value)) * Math.PI * 2;
};

// O hash é calculado uma única vez. Só as posições variam durante a animação.
const blobs = [
  { rgb: "17, 17, 17", x: 72.39, y: 58.91, stops: [19.38, 38.75, 58.13, 77.5] },
  { rgb: "92, 92, 92", x: 37.53, y: 79.97, stops: [13.25, 26.5, 39.75, 53] },
  { rgb: "167, 167, 167", x: 41.45, y: 25.53, stops: [17.1, 34.2, 51.3, 68.4] },
  { rgb: "242, 242, 242", x: 72.25, y: 83.19, stops: [10.63, 21.25, 31.88, 42.5] },
].map((blob, i) => ({ ...blob, p: phase(i * 19 + 1), p2: phase(i * 19 + 7) }));

const grain = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity="0.075"/></svg>')}")`;
const vignette = "radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0) 52%, rgba(0, 0, 0, 0.024) 100%)";

export function blackGradientAt(t: number) {
  const ph = t * 0.24;
  const amt = 0.27;
  const dir = 1;
  const spin = ph * dir;
  return [grain, vignette, ...blobs.map(({ rgb, x, y, stops, p, p2 }) => {
    // Cada deslocamento é exatamente zero em t=0, sem arredondar posições.
    const cx = x + (Math.sin(spin * 0.55 + p) - Math.sin(p)) * 14 * amt;
    const cy = y + (Math.sin(spin * 0.43 + p2) - Math.sin(p2)) * 14 * amt;
    return `radial-gradient(circle at ${cx}% ${cy}%, rgba(${rgb}, 1) 0%, rgba(${rgb}, 0.844) ${stops[0]}%, rgba(${rgb}, 0.5) ${stops[1]}%, rgba(${rgb}, 0.156) ${stops[2]}%, rgba(${rgb}, 0) ${stops[3]}%)`;
  })].join(", ");
}
