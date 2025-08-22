import type { FluidRefs } from "../types";

export function getResolution(gl: any, resolution: number) {
  if (!gl) throw new Error("WebGL context not available");

  let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
  if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;

  let min = Math.round(resolution);
  let max = Math.round(resolution * aspectRatio);

  if (gl.drawingBufferWidth > gl.drawingBufferHeight)
    return { width: max, height: min };
  else return { width: min, height: max };
}

export function correctRadius(radius: number, width: number, height: number) {
  let aspectRatio = width / height;
  if (aspectRatio > 1) radius *= aspectRatio;
  return radius;
}

export function splat(
  refs: FluidRefs,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: any,
  width: number,
  height: number
) {
  const gl = refs.gl.current;
  const programs = refs.programs.current;
  const buffers = refs.buffers.current;
  const config = refs.config.current;

  if (
    !programs.splat ||
    !buffers.dye ||
    !buffers.velocity ||
    !buffers.blit ||
    !gl
  )
    return;

  programs.splat.bind();
  gl.uniform1i(
    programs.splat.uniforms.uTarget,
    buffers.velocity.read.attach(0)
  );
  gl.uniform1f(programs.splat.uniforms.aspectRatio, width / height);
  gl.uniform2f(programs.splat.uniforms.point, x, y);
  gl.uniform3f(programs.splat.uniforms.color, dx, dy, 0.0);
  gl.uniform1f(
    programs.splat.uniforms.radius,
    correctRadius(config.SPLAT_RADIUS / 100.0, width, height)
  );
  buffers.blit(buffers.velocity.write);
  buffers.velocity.swap();

  gl.uniform1i(programs.splat.uniforms.uTarget, buffers.dye.read.attach(0));
  gl.uniform3f(programs.splat.uniforms.color, color.r, color.g, color.b);
  buffers.blit(buffers.dye.write);
  buffers.dye.swap();
}

export function step(refs: FluidRefs, dt: number) {
  const gl = refs.gl.current;
  const programs = refs.programs.current;
  const buffers = refs.buffers.current;
  const config = refs.config.current;

  if (
    !programs ||
    !buffers ||
    !buffers.velocity ||
    !buffers.curl ||
    !buffers.divergence ||
    !buffers.pressure ||
    !buffers.dye ||
    !buffers.blit ||
    !gl
  )
    return;

  gl.disable(gl.BLEND);

  programs.curl.bind();
  gl.uniform2f(
    programs.curl.uniforms.texelSize,
    buffers.velocity.texelSizeX,
    buffers.velocity.texelSizeY
  );
  gl.uniform1i(
    programs.curl.uniforms.uVelocity,
    buffers.velocity.read.attach(0)
  );
  buffers.blit(buffers.curl);

  programs.vorticity.bind();
  gl.uniform2f(
    programs.vorticity.uniforms.texelSize,
    buffers.velocity.texelSizeX,
    buffers.velocity.texelSizeY
  );
  gl.uniform1i(
    programs.vorticity.uniforms.uVelocity,
    buffers.velocity.read.attach(0)
  );
  gl.uniform1i(programs.vorticity.uniforms.uCurl, buffers.curl.attach(1));
  gl.uniform1f(programs.vorticity.uniforms.curl, config.CURL);
  gl.uniform1f(programs.vorticity.uniforms.dt, dt);
  buffers.blit(buffers.velocity.write);
  buffers.velocity.swap();

  programs.divergence.bind();
  gl.uniform2f(
    programs.divergence.uniforms.texelSize,
    buffers.velocity.texelSizeX,
    buffers.velocity.texelSizeY
  );
  gl.uniform1i(
    programs.divergence.uniforms.uVelocity,
    buffers.velocity.read.attach(0)
  );
  buffers.blit(buffers.divergence);

  programs.clear.bind();
  gl.uniform1i(
    programs.clear.uniforms.uTexture,
    buffers.pressure.read.attach(0)
  );
  gl.uniform1f(programs.clear.uniforms.value, config.PRESSURE);
  buffers.blit(buffers.pressure.write);
  buffers.pressure.swap();

  programs.pressure.bind();
  gl.uniform2f(
    programs.pressure.uniforms.texelSize,
    buffers.velocity.texelSizeX,
    buffers.velocity.texelSizeY
  );
  gl.uniform1i(
    programs.pressure.uniforms.uDivergence,
    buffers.divergence.attach(0)
  );
  for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
    gl.uniform1i(
      programs.pressure.uniforms.uPressure,
      buffers.pressure.read.attach(1)
    );
    buffers.blit(buffers.pressure.write);
    buffers.pressure.swap();
  }

  programs.gradientSubtract.bind();
  gl.uniform2f(
    programs.gradientSubtract.uniforms.texelSize,
    buffers.velocity.texelSizeX,
    buffers.velocity.texelSizeY
  );
  gl.uniform1i(
    programs.gradientSubtract.uniforms.uPressure,
    buffers.pressure.read.attach(0)
  );
  gl.uniform1i(
    programs.gradientSubtract.uniforms.uVelocity,
    buffers.velocity.read.attach(1)
  );
  buffers.blit(buffers.velocity.write);
  buffers.velocity.swap();

  programs.advection.bind();
  gl.uniform2f(
    programs.advection.uniforms.texelSize,
    buffers.velocity.texelSizeX,
    buffers.velocity.texelSizeY
  );
  if (!refs.ext.current.supportLinearFiltering)
    gl.uniform2f(
      programs.advection.uniforms.dyeTexelSize,
      buffers.velocity.texelSizeX,
      buffers.velocity.texelSizeY
    );
  let velocityId = buffers.velocity.read.attach(0);
  gl.uniform1i(programs.advection.uniforms.uVelocity, velocityId);
  gl.uniform1i(programs.advection.uniforms.uSource, velocityId);
  gl.uniform1f(programs.advection.uniforms.dt, dt);
  gl.uniform1f(
    programs.advection.uniforms.dissipation,
    config.VELOCITY_DISSIPATION
  );
  buffers.blit(buffers.velocity.write);
  buffers.velocity.swap();

  if (!refs.ext.current.supportLinearFiltering)
    gl.uniform2f(
      programs.advection.uniforms.dyeTexelSize,
      buffers.dye.texelSizeX,
      buffers.dye.texelSizeY
    );
  gl.uniform1i(
    programs.advection.uniforms.uVelocity,
    buffers.velocity.read.attach(0)
  );
  gl.uniform1i(programs.advection.uniforms.uSource, buffers.dye.read.attach(1));
  gl.uniform1f(
    programs.advection.uniforms.dissipation,
    config.DENSITY_DISSIPATION
  );
  buffers.blit(buffers.dye.write);
  buffers.dye.swap();
}

export function render(refs: FluidRefs) {
  const gl = refs.gl.current;
  const programs = refs.programs.current;
  const buffers = refs.buffers.current;

  if (!programs.displayMaterial || !buffers.dye || !buffers.blit || !gl) return;

  programs.displayMaterial.bind();
  gl.uniform1i(
    programs.displayMaterial.uniforms.uTexture,
    buffers.dye.read.attach(0)
  );
  buffers.blit(null);
}

export function calcDeltaTime(
  lastUpdateTimeRef: React.MutableRefObject<number>
) {
  let now = Date.now();
  let dt = (now - lastUpdateTimeRef.current) / 1000;
  dt = Math.min(dt, 0.033333);
  lastUpdateTimeRef.current = now;
  return dt;
}
