import { createProgram, getUniforms } from "./context";

export class Program {
  uniforms: any = {};
  program: WebGLProgram;
  private gl: any;

  constructor(
    gl: any,
    vertexShader: WebGLShader | null,
    fragmentShader: WebGLShader | null,
  ) {
    this.gl = gl;
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      throw new Error("Failed to create WebGL program");
    }
    this.program = program;
    this.uniforms = getUniforms(gl, this.program);
  }

  bind() {
    this.gl?.useProgram(this.program);
  }
}
