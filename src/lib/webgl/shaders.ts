// --- GLSL Sources ---

const SOLID_VS = `#version 300 es
uniform vec2 u_resolution;
in vec2 a_position;

void main() {
  vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);
}
`;

const SOLID_FS = `#version 300 es
precision mediump float;
uniform vec4 u_color;
out vec4 fragColor;

void main() {
  fragColor = u_color;
}
`;

const GRADIENT_VS = `#version 300 es
uniform vec2 u_resolution;
uniform float u_panelHeight;
in vec2 a_position;
out float v_normalizedY;

void main() {
  vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);
  v_normalizedY = a_position.y / u_panelHeight;
}
`;

const GRADIENT_FS = `#version 300 es
precision mediump float;
uniform vec4 u_color;
in float v_normalizedY;
out vec4 fragColor;

void main() {
  float alpha = mix(0.4, 0.05, v_normalizedY);
  fragColor = vec4(u_color.rgb, alpha);
}
`;

// --- Compile helpers ---

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }
  return shader;
}

function linkProgram(
  gl: WebGL2RenderingContext,
  vs: WebGLShader,
  fs: WebGLShader,
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${info}`);
  }
  return program;
}

// --- Program interfaces ---

export interface SolidProgram {
  program: WebGLProgram;
  aPosition: number;
  uResolution: WebGLUniformLocation;
  uColor: WebGLUniformLocation;
}

export interface GradientProgram {
  program: WebGLProgram;
  aPosition: number;
  uResolution: WebGLUniformLocation;
  uPanelHeight: WebGLUniformLocation;
  uColor: WebGLUniformLocation;
}

export function createSolidProgram(gl: WebGL2RenderingContext): SolidProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, SOLID_VS);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, SOLID_FS);
  const program = linkProgram(gl, vs, fs);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return {
    program,
    aPosition: gl.getAttribLocation(program, "a_position"),
    uResolution: gl.getUniformLocation(program, "u_resolution")!,
    uColor: gl.getUniformLocation(program, "u_color")!,
  };
}

export function createGradientProgram(
  gl: WebGL2RenderingContext,
): GradientProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, GRADIENT_VS);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, GRADIENT_FS);
  const program = linkProgram(gl, vs, fs);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return {
    program,
    aPosition: gl.getAttribLocation(program, "a_position"),
    uResolution: gl.getUniformLocation(program, "u_resolution")!,
    uPanelHeight: gl.getUniformLocation(program, "u_panelHeight")!,
    uColor: gl.getUniformLocation(program, "u_color")!,
  };
}
