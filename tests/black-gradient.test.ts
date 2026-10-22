import { expect, test } from 'bun:test';
import { blackGradientAt } from '../src/lib/black-gradient';
const centers = (t: number) => [...blackGradientAt(t).matchAll(/circle at ([\d.-]+)% ([\d.-]+)%/g)].slice(1).map(m => [Number(m[1]), Number(m[2])]);

test('gradiente começa exatamente nos centros da referência, sem salto inicial', () => {
  expect(centers(0)).toEqual([[72.39,58.91],[37.53,79.97],[41.45,25.53],[72.25,83.19]]);
});

test('movimento é contínuo, determinístico e limitado em todas as cores', () => {
  const origin = centers(0);
  expect(blackGradientAt(10)).toBe(blackGradientAt(10));
  expect(blackGradientAt(0.001)).not.toBe(blackGradientAt(0));
  for (const t of [0.001,1,10,100,1000]) {
    const frame = centers(t);
    const next = centers(t + 0.0001);
    for (let i=0;i<frame.length;i++) for(let axis=0;axis<2;axis++) {
      expect(Math.abs(frame[i][axis]-origin[i][axis])).toBeLessThanOrEqual(14*0.27*2);
      expect(Math.abs(next[i][axis]-frame[i][axis])).toBeLessThan(0.0001);
    }
  }
});
