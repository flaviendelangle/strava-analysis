import { useMemo } from "react";

import { useTheme } from "~/hooks/useTheme";

// ---------------------------------------------------------------------------
// OKLCH → sRGB conversion (moved from webgl/colors.ts to centralise)
// ---------------------------------------------------------------------------

function linearToSrgb(x: number): number {
  const clamped = Math.max(0, Math.min(1, x));
  return clamped <= 0.0031308
    ? 12.92 * clamped
    : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
}

/**
 * Convert an oklch(L C H) CSS color string to [r, g, b] in sRGB [0..1].
 *
 * Pipeline: oklch → oklab → linear sRGB (via LMS cube roots) → sRGB gamma
 */
export function oklchToRgb(oklchStr: string): [number, number, number] {
  const match = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/.exec(oklchStr);
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

/** Convert an oklch CSS string to a hex color string. */
export function oklchToHex(oklchStr: string): string {
  const [r, g, b] = oklchToRgb(oklchStr);
  const toHex = (c: number) =>
    Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Convert an oklch CSS string to a WebGL-ready Float32Array [r, g, b, a]. */
export function oklchToGL(oklchStr: string, alpha = 1.0): Float32Array {
  const [r, g, b] = oklchToRgb(oklchStr);
  return new Float32Array([r, g, b, alpha]);
}

// ---------------------------------------------------------------------------
// Generic CSS color → RGB conversion (handles any browser-resolved format)
// ---------------------------------------------------------------------------

let probeCtx: CanvasRenderingContext2D | null = null;

/**
 * Convert any valid CSS color string (oklch, lab, rgb, hsl, etc.)
 * to [r, g, b] in sRGB [0..1] using a canvas 2D context.
 */
function cssColorToRgb(color: string): [number, number, number] {
  if (!probeCtx) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    probeCtx = canvas.getContext("2d", { willReadFrequently: true })!;
  }
  probeCtx.clearRect(0, 0, 1, 1);
  probeCtx.fillStyle = color;
  probeCtx.fillRect(0, 0, 1, 1);
  const [r, g, b] = probeCtx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

function cssColorToHex(color: string): string {
  const [r, g, b] = cssColorToRgb(color);
  const toHex = (c: number) =>
    Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function cssColorToGL(color: string, alpha = 1.0): Float32Array {
  const [r, g, b] = cssColorToRgb(color);
  return new Float32Array([r, g, b, alpha]);
}

// ---------------------------------------------------------------------------
// CSS variable resolution
// ---------------------------------------------------------------------------

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

// ---------------------------------------------------------------------------
// Chart tokens
// ---------------------------------------------------------------------------

export interface ChartTokens {
  /** 8 hex colors for chart series (x-charts) */
  palette: string[];
  /** 8 OKLCH strings for chart series (WebGL / SVG) */
  paletteOklch: string[];
  /** 8 Float32Array RGBA colors for chart series (WebGL) */
  paletteGL: Float32Array[];
  /** Grid line color */
  grid: { hex: string; gl: Float32Array };
  /** Separator / axis line color */
  gridStrong: { hex: string; gl: Float32Array };
  /** Axis tick label color (hex) */
  axisLabel: string;
  /** Crosshair line color (hex) */
  crosshair: string;
  /** Card background hex (for crosshair dot stroke) */
  cardBg: string;
}

const PALETTE_KEYS = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--chart-6",
  "--chart-7",
  "--chart-8",
] as const;

function resolveTokens(): ChartTokens {
  const paletteCss = PALETTE_KEYS.map((key) => getCSSVar(key));
  const palette = paletteCss.map(cssColorToHex);
  const paletteOklch = paletteCss;
  const paletteGL = paletteCss.map((c) => cssColorToGL(c));

  const gridCss = getCSSVar("--chart-grid");
  const gridStrongCss = getCSSVar("--chart-grid-strong");
  const axisLabelCss = getCSSVar("--chart-axis-label");
  const crosshairCss = getCSSVar("--chart-crosshair");
  const cardCss = getCSSVar("--card");

  return {
    palette,
    paletteOklch,
    paletteGL,
    grid: { hex: cssColorToHex(gridCss), gl: cssColorToGL(gridCss) },
    gridStrong: {
      hex: cssColorToHex(gridStrongCss),
      gl: cssColorToGL(gridStrongCss),
    },
    axisLabel: cssColorToHex(axisLabelCss),
    crosshair: cssColorToHex(crosshairCss),
    cardBg: cssColorToHex(cardCss),
  };
}

/**
 * React hook that returns chart design tokens resolved from CSS variables.
 * Re-resolves when the theme (light/dark) changes.
 */
export function useChartTokens(): ChartTokens {
  const { resolvedTheme } = useTheme();
  return useMemo(() => {
    if (typeof window === "undefined") {
      // SSR fallback — return empty tokens; they'll be resolved on the client
      return {
        palette: [],
        paletteOklch: [],
        paletteGL: [],
        grid: { hex: "#000", gl: new Float32Array([0, 0, 0, 1]) },
        gridStrong: { hex: "#000", gl: new Float32Array([0, 0, 0, 1]) },
        axisLabel: "#888",
        crosshair: "#888",
        cardBg: "#000",
      };
    }
    return resolveTokens();
  }, [resolvedTheme]);
}

// ---------------------------------------------------------------------------
// Standard margin presets
// ---------------------------------------------------------------------------

export const CHART_MARGINS = {
  /** Standard single-panel chart with y-axis on left */
  standard: { left: 72, right: 24, top: 16, bottom: 32 },
  /** Compact margin for dense multi-panel layouts */
  compact: { top: 8, right: 16, bottom: 36, left: 56 },
  /** Dual-axis chart with labels on both sides */
  dualAxis: { left: 40, right: 40, top: 20, bottom: 24 },
} as const;
