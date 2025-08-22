import { compileShader, createProgram, getUniforms } from "./context";

export function hashCode(s: string) {
  if (s.length == 0) return 0;
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

export class Material {
  vertexShader: WebGLShader;
  fragmentShaderSource: string;
  programs: any[] = [];
  activeProgram: WebGLProgram | null = null;
  uniforms: any = {};
  private gl: any;

  constructor(
    gl: any,
    vertexShader: WebGLShader,
    fragmentShaderSource: string,
  ) {
    this.gl = gl;
    this.vertexShader = vertexShader;
    this.fragmentShaderSource = fragmentShaderSource;
  }

  setKeywords(keywords: string[]) {
    let hash = 0;
    for (let i = 0; i < keywords.length; i++) hash += hashCode(keywords[i]);

    let program = this.programs[hash];
    if (program == null) {
      let fragmentShader = compileShader(
        this.gl,
        this.gl.FRAGMENT_SHADER,
        this.fragmentShaderSource,
        keywords,
      );
      if (fragmentShader) {
        program = createProgram(this.gl, this.vertexShader, fragmentShader);
        this.programs[hash] = program;
      }
    }

    if (program == this.activeProgram) return;

    this.uniforms = getUniforms(this.gl, program);
    this.activeProgram = program;
  }

  bind() {
    if (!this.gl || !this.activeProgram) return;
    this.gl.useProgram(this.activeProgram);
  }
}
