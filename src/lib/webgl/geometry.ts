/**
 * Build a thick-line triangle strip from a polyline via perpendicular extrusion.
 *
 * For each point, computes the averaged tangent from its neighbors, then offsets
 * perpendicular by ±halfWidth to produce 2 vertices. Rendered as gl.TRIANGLE_STRIP.
 *
 * @returns Float32Array of [x, y, x, y, ...] with 4*N floats (2 vertices × 2 components × N points)
 */
export function buildLineStripMesh(
  xs: Float32Array,
  ys: Float32Array,
  halfWidth: number,
): Float32Array {
  const n = xs.length;
  if (n < 2) return new Float32Array(0);

  // 2 vertices per point, 2 floats per vertex
  const out = new Float32Array(n * 4);

  for (let i = 0; i < n; i++) {
    // Compute tangent direction (average of adjacent segments)
    let tx: number, ty: number;

    if (i === 0) {
      tx = xs[1] - xs[0];
      ty = ys[1] - ys[0];
    } else if (i === n - 1) {
      tx = xs[n - 1] - xs[n - 2];
      ty = ys[n - 1] - ys[n - 2];
    } else {
      tx = xs[i + 1] - xs[i - 1];
      ty = ys[i + 1] - ys[i - 1];
    }

    // Normalize tangent
    const len = Math.sqrt(tx * tx + ty * ty);
    if (len > 0) {
      tx /= len;
      ty /= len;
    } else {
      tx = 1;
      ty = 0;
    }

    // Normal (perpendicular, rotated 90° CCW)
    const nx = -ty;
    const ny = tx;

    // Miter half-width (for averaged tangent, clamp to avoid spikes)
    // For interior points, compute miter scale from the dot product with segment normal
    let miterHW = halfWidth;
    if (i > 0 && i < n - 1) {
      // Segment normal for segment (i, i+1)
      const sx = xs[i + 1] - xs[i];
      const sy = ys[i + 1] - ys[i];
      const sLen = Math.sqrt(sx * sx + sy * sy);
      if (sLen > 0) {
        const snx = -sy / sLen;
        const sny = sx / sLen;
        const dot = nx * snx + ny * sny;
        if (Math.abs(dot) > 0.1) {
          miterHW = Math.min(halfWidth / Math.abs(dot), halfWidth * 2);
        }
      }
    }

    const ox = nx * miterHW;
    const oy = ny * miterHW;

    const idx = i * 4;
    out[idx] = xs[i] + ox;
    out[idx + 1] = ys[i] + oy;
    out[idx + 2] = xs[i] - ox;
    out[idx + 3] = ys[i] - oy;
  }

  return out;
}

/**
 * Build an area fill mesh as a triangle strip from data line to baseline.
 *
 * For each point, emits two vertices: (x, dataY) and (x, baseline).
 * Rendered as gl.TRIANGLE_STRIP.
 *
 * @returns Float32Array of [x, y, x, y, ...] with 4*N floats
 */
export function buildAreaMesh(
  xs: Float32Array,
  ys: Float32Array,
  baseline: number,
): Float32Array {
  const n = xs.length;
  if (n < 2) return new Float32Array(0);

  const out = new Float32Array(n * 4);

  for (let i = 0; i < n; i++) {
    const idx = i * 4;
    out[idx] = xs[i];
    out[idx + 1] = ys[i]; // data line (top)
    out[idx + 2] = xs[i];
    out[idx + 3] = baseline; // baseline (bottom)
  }

  return out;
}

/**
 * Build horizontal grid line segments for a panel.
 *
 * Rendered with gl.LINES (1px lines are fine for grids).
 *
 * @returns Float32Array of [x1, y1, x2, y2, ...] with 4 * yPositions.length floats
 */
export function buildGridLinesMesh(
  yPositions: number[],
  width: number,
): Float32Array {
  const out = new Float32Array(yPositions.length * 4);

  for (let i = 0; i < yPositions.length; i++) {
    const idx = i * 4;
    out[idx] = 0;
    out[idx + 1] = yPositions[i];
    out[idx + 2] = width;
    out[idx + 3] = yPositions[i];
  }

  return out;
}

/**
 * Build vertical grid line segments for a panel.
 *
 * Rendered with gl.LINES.
 *
 * @returns Float32Array of [x1, y1, x2, y2, ...] with 4 * xPositions.length floats
 */
export function buildVerticalGridLinesMesh(
  xPositions: number[],
  height: number,
): Float32Array {
  const out = new Float32Array(xPositions.length * 4);

  for (let i = 0; i < xPositions.length; i++) {
    const idx = i * 4;
    out[idx] = xPositions[i];
    out[idx + 1] = 0;
    out[idx + 2] = xPositions[i];
    out[idx + 3] = height;
  }

  return out;
}
