/**
 * Convert an oklch(L C H) CSS color string to [r, g, b] in sRGB [0..1].
 *
 * Pipeline: oklch → oklab → linear sRGB (via LMS cube roots) → sRGB gamma
 */
export function oklchToRgb(oklchStr: string): [number, number, number] {
  const match = oklchStr.match(
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/,
  );
  if (!match) {
    throw new Error(`Cannot parse oklch color: ${oklchStr}`);
  }

  const L = parseFloat(match[1]);
  const C = parseFloat(match[2]);
  const H = parseFloat(match[3]);

  // oklch → oklab
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // oklab → LMS (cube roots)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  // Cube to get LMS
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS → linear sRGB
  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  // linear sRGB → sRGB gamma
  return [linearToSrgb(lr), linearToSrgb(lg), linearToSrgb(lb)];
}

function linearToSrgb(x: number): number {
  const clamped = Math.max(0, Math.min(1, x));
  return clamped <= 0.0031308
    ? 12.92 * clamped
    : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
}

/**
 * Convert an oklch CSS string to a WebGL-ready Float32Array [r, g, b, a].
 */
export function colorToGLColor(
  color: string,
  alpha: number = 1.0,
): Float32Array {
  const [r, g, b] = oklchToRgb(color);
  return new Float32Array([r, g, b, alpha]);
}
