import {
  createGradientProgram,
  createSolidProgram,
  type GradientProgram,
  type SolidProgram,
} from "./shaders";

// Dark theme grid colors (hardcoded — app is always dark)
const GRID_COLOR = new Float32Array([0.153, 0.153, 0.165, 1.0]); // zinc-800
const SEPARATOR_COLOR = new Float32Array([0.247, 0.247, 0.275, 1.0]); // zinc-700

export interface PanelRenderData {
  top: number;
  height: number;
  lineMesh: Float32Array;
  lineColor: Float32Array;
  areaMesh: Float32Array | null;
  areaColor: Float32Array | null;
  gridMesh: Float32Array;
  gridVertexCount: number;
  /** Separator line mesh (2 vertices for GL_LINES) */
  separatorMesh: Float32Array;
}

interface PanelBuffers {
  lineVAO: WebGLVertexArrayObject;
  lineBuffer: WebGLBuffer;
  lineVertexCount: number;
  areaVAO: WebGLVertexArrayObject | null;
  areaBuffer: WebGLBuffer | null;
  areaVertexCount: number;
  gridVAO: WebGLVertexArrayObject;
  gridBuffer: WebGLBuffer;
  gridVertexCount: number;
  separatorVAO: WebGLVertexArrayObject;
  separatorBuffer: WebGLBuffer;
}

export class WebGLChartRenderer {
  private gl: WebGL2RenderingContext | null = null;
  private solidProgram: SolidProgram | null = null;
  private gradientProgram: GradientProgram | null = null;
  private canvas: HTMLCanvasElement;
  private panelBuffers: Map<number, PanelBuffers> = new Map();
  private dpr = 1;
  private cssHeight = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  init(): boolean {
    const gl = this.canvas.getContext("webgl2", {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
    });
    if (!gl) return false;

    this.gl = gl;

    try {
      this.solidProgram = createSolidProgram(gl);
      this.gradientProgram = createGradientProgram(gl);
    } catch (e) {
      console.error("WebGL shader compilation failed:", e);
      return false;
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return true;
  }

  resize(cssWidth: number, cssHeight: number): void {
    this.dpr = window.devicePixelRatio || 1;
    this.cssHeight = cssHeight;
    this.canvas.width = Math.round(cssWidth * this.dpr);
    this.canvas.height = Math.round(cssHeight * this.dpr);
  }

  updatePanelData(panelIndex: number, data: PanelRenderData): void {
    const gl = this.gl;
    if (!gl) return;

    // Clean up existing buffers for this panel
    this.deletePanelBuffers(panelIndex);

    const lineVAO = gl.createVertexArray()!;
    const lineBuffer = gl.createBuffer()!;
    const lineVertexCount = data.lineMesh.length / 2;
    this.setupVAO(gl, lineVAO, lineBuffer, data.lineMesh, this.solidProgram!.aPosition);

    let areaVAO: WebGLVertexArrayObject | null = null;
    let areaBuffer: WebGLBuffer | null = null;
    let areaVertexCount = 0;
    if (data.areaMesh) {
      areaVAO = gl.createVertexArray()!;
      areaBuffer = gl.createBuffer()!;
      areaVertexCount = data.areaMesh.length / 2;
      this.setupVAO(gl, areaVAO, areaBuffer, data.areaMesh, this.gradientProgram!.aPosition);
    }

    const gridVAO = gl.createVertexArray()!;
    const gridBuffer = gl.createBuffer()!;
    this.setupVAO(gl, gridVAO, gridBuffer, data.gridMesh, this.solidProgram!.aPosition);

    const separatorVAO = gl.createVertexArray()!;
    const separatorBuffer = gl.createBuffer()!;
    this.setupVAO(gl, separatorVAO, separatorBuffer, data.separatorMesh, this.solidProgram!.aPosition);

    this.panelBuffers.set(panelIndex, {
      lineVAO,
      lineBuffer,
      lineVertexCount,
      areaVAO,
      areaBuffer,
      areaVertexCount,
      gridVAO,
      gridBuffer,
      gridVertexCount: data.gridVertexCount,
      separatorVAO,
      separatorBuffer,
    });
  }

  render(
    panels: PanelRenderData[],
    marginLeft: number,
    marginTop: number,
    drawingWidth: number,
  ): void {
    const gl = this.gl;
    if (!gl) return;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.SCISSOR_TEST);

    for (let i = 0; i < panels.length; i++) {
      const panel = panels[i];
      const buffers = this.panelBuffers.get(i);
      if (!buffers) continue;

      // WebGL viewport: bottom-left origin, device pixels
      const vx = Math.round(marginLeft * this.dpr);
      const vy = Math.round(
        (this.cssHeight - marginTop - panel.top - panel.height) * this.dpr,
      );
      const vw = Math.round(drawingWidth * this.dpr);
      const vh = Math.round(panel.height * this.dpr);

      gl.viewport(vx, vy, vw, vh);
      gl.scissor(vx, vy, vw, vh);

      // 1. Grid lines
      gl.useProgram(this.solidProgram!.program);
      gl.uniform2f(this.solidProgram!.uResolution, drawingWidth, panel.height);
      gl.uniform4fv(this.solidProgram!.uColor, GRID_COLOR);
      gl.bindVertexArray(buffers.gridVAO);
      gl.drawArrays(gl.LINES, 0, buffers.gridVertexCount);

      // 2. Separator line
      gl.uniform4fv(this.solidProgram!.uColor, SEPARATOR_COLOR);
      gl.bindVertexArray(buffers.separatorVAO);
      gl.drawArrays(gl.LINES, 0, 2);

      // 3. Area fill (if present, behind line)
      if (buffers.areaVAO && panel.areaColor) {
        gl.useProgram(this.gradientProgram!.program);
        gl.uniform2f(
          this.gradientProgram!.uResolution,
          drawingWidth,
          panel.height,
        );
        gl.uniform1f(this.gradientProgram!.uPanelHeight, panel.height);
        gl.uniform4fv(this.gradientProgram!.uColor, panel.areaColor);
        gl.bindVertexArray(buffers.areaVAO);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffers.areaVertexCount);
      }

      // 4. Data line (on top)
      gl.useProgram(this.solidProgram!.program);
      gl.uniform2f(this.solidProgram!.uResolution, drawingWidth, panel.height);
      gl.uniform4fv(this.solidProgram!.uColor, panel.lineColor);
      gl.bindVertexArray(buffers.lineVAO);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, buffers.lineVertexCount);
    }

    gl.disable(gl.SCISSOR_TEST);
    gl.bindVertexArray(null);
  }

  dispose(): void {
    const gl = this.gl;
    if (!gl) return;

    for (const [index] of this.panelBuffers) {
      this.deletePanelBuffers(index);
    }
    this.panelBuffers.clear();

    if (this.solidProgram) {
      gl.deleteProgram(this.solidProgram.program);
      this.solidProgram = null;
    }
    if (this.gradientProgram) {
      gl.deleteProgram(this.gradientProgram.program);
      this.gradientProgram = null;
    }

    this.gl = null;
  }

  private setupVAO(
    gl: WebGL2RenderingContext,
    vao: WebGLVertexArrayObject,
    buffer: WebGLBuffer,
    data: Float32Array,
    attribLocation: number,
  ): void {
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(attribLocation);
    gl.vertexAttribPointer(attribLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  private deletePanelBuffers(index: number): void {
    const gl = this.gl;
    const buffers = this.panelBuffers.get(index);
    if (!gl || !buffers) return;

    gl.deleteVertexArray(buffers.lineVAO);
    gl.deleteBuffer(buffers.lineBuffer);
    if (buffers.areaVAO) gl.deleteVertexArray(buffers.areaVAO);
    if (buffers.areaBuffer) gl.deleteBuffer(buffers.areaBuffer);
    gl.deleteVertexArray(buffers.gridVAO);
    gl.deleteBuffer(buffers.gridBuffer);
    gl.deleteVertexArray(buffers.separatorVAO);
    gl.deleteBuffer(buffers.separatorBuffer);
    this.panelBuffers.delete(index);
  }
}
