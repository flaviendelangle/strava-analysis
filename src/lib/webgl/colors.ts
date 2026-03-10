import { oklchToRgb } from "~/lib/chartTokens";

export { oklchToRgb };

/**
 * Convert a CSS color string (hex or oklch) to a WebGL-ready Float32Array [r, g, b, a].
 */
export function colorToGLColor(color: string, alpha = 1.0): Float32Array {
  // Fast path for hex colors (#rrggbb)
  const hexMatch = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
  if (hexMatch) {
    return new Float32Array([
      parseInt(hexMatch[1], 16) / 255,
      parseInt(hexMatch[2], 16) / 255,
      parseInt(hexMatch[3], 16) / 255,
      alpha,
    ]);
  }

  // Fallback: oklch strings
  const [r, g, b] = oklchToRgb(color);
  return new Float32Array([r, g, b, alpha]);
}
