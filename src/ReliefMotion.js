export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = x => { const t = clamp(x); return t * t * (3 - 2 * t); };

export function reliefDepthAt(seconds, x, width, mobile = false, reduced = false) {
  const finalDepth = mobile ? .105 : .145;
  if (reduced) return finalDepth;
  const delay = (x / width + .5) * .38;
  const rise = smooth((seconds - .12 - delay) / 1.12);
  const progress = ((Math.max(0, seconds - 2) % 16) - 5) / 8;
  const envelope = progress > 0 && progress < 1 ? Math.sin(Math.PI * progress) ** 4 : 0;
  const waveX = (-.75 + clamp(progress) * 1.5) * width;
  const pressure = Math.exp(-(((x - waveX) / .95) ** 2)) * envelope * .018;
  return -.075 + (finalDepth + .075) * rise + pressure;
}
