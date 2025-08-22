import { splat } from "../simulation/core";
import type { FluidRefs } from "../types";

export function generateColor(): number[] {
  let c = HSVtoRGB(Math.random(), 1.0, 1.0);
  c.r *= 0.15;
  c.g *= 0.15;
  c.b *= 0.15;
  return [c.r, c.g, c.b];
}

export function HSVtoRGB(h: number, s: number, v: number) {
  let r, g, b, i, f, p, q, t;
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      (r = v), (g = t), (b = p);
      break;
    case 1:
      (r = q), (g = v), (b = p);
      break;
    case 2:
      (r = p), (g = v), (b = t);
      break;
    case 3:
      (r = p), (g = q), (b = v);
      break;
    case 4:
      (r = t), (g = p), (b = v);
      break;
    case 5:
      (r = v), (g = p), (b = q);
      break;
    default:
      r = g = b = 0;
  }

  return { r, g, b };
}

export function multipleSplats(
  amount: number,
  refs: FluidRefs,
  width: number,
  height: number
) {
  for (let i = 0; i < amount; i++) {
    const color = generateColor();
    color[0] *= 10.0;
    color[1] *= 10.0;
    color[2] *= 10.0;
    const x = Math.random();
    const y = Math.random();
    const dx = 1000 * (Math.random() - 0.5);
    const dy = 1000 * (Math.random() - 0.5);
    splat(
      refs,
      x,
      y,
      dx,
      dy,
      { r: color[0], g: color[1], b: color[2] },
      width,
      height
    );
  }
}
