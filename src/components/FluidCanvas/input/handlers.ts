import type { FluidPointer, FluidRefs } from "../types";
import { splat } from "../simulation/core";
import { generateColor } from "../utils/helpers";

export function scaleByPixelRatio(input: number) {
  let pixelRatio = window.devicePixelRatio || 1;
  return Math.floor(input * pixelRatio);
}

export function updatePointerDownData(
  pointer: FluidPointer,
  id: number,
  posX: number,
  posY: number,
  canvas: HTMLCanvasElement,
  customColorGenerator?: () => number[]
) {
  pointer.id = id;
  pointer.down = true;
  pointer.moved = false;
  pointer.texcoordX = posX / canvas.width;
  pointer.texcoordY = 1.0 - posY / canvas.height;
  pointer.prevTexcoordX = pointer.texcoordX;
  pointer.prevTexcoordY = pointer.texcoordY;
  pointer.deltaX = 0;
  pointer.deltaY = 0;
  pointer.color = customColorGenerator
    ? customColorGenerator()
    : generateColor();
}

export function updatePointerMoveData(
  pointer: FluidPointer,
  posX: number,
  posY: number,
  canvas: HTMLCanvasElement,
  customColorGenerator?: () => number[]
) {
  pointer.prevTexcoordX = pointer.texcoordX;
  pointer.prevTexcoordY = pointer.texcoordY;
  pointer.texcoordX = posX / canvas.width;
  pointer.texcoordY = 1.0 - posY / canvas.height;
  pointer.deltaX = correctDeltaX(
    pointer.texcoordX - pointer.prevTexcoordX,
    canvas
  );
  pointer.deltaY = correctDeltaY(
    pointer.texcoordY - pointer.prevTexcoordY,
    canvas
  );
  pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;

  if (pointer.moved) {
    const now = Date.now();
    if (!pointer.lastColorUpdate || now - pointer.lastColorUpdate > 300) {
      pointer.color = customColorGenerator
        ? customColorGenerator()
        : generateColor();
      pointer.lastColorUpdate = now;
    }
  }
}

export function updatePointerUpData(pointer: FluidPointer) {
  pointer.down = false;
}

export function correctDeltaX(delta: number, canvas: HTMLCanvasElement) {
  let aspectRatio = canvas.width / canvas.height;
  if (aspectRatio < 1) delta *= aspectRatio;
  return delta;
}

export function correctDeltaY(delta: number, canvas: HTMLCanvasElement) {
  let aspectRatio = canvas.width / canvas.height;
  if (aspectRatio > 1) delta /= aspectRatio;
  return delta;
}

export function applyInputs(refs: FluidRefs, width: number, height: number) {
  refs.pointers.current.forEach((p: FluidPointer) => {
    if (p.moved) {
      p.moved = false;
      splatPointer(refs, p, width, height);
    }
  });
}

export function splatPointer(
  refs: FluidRefs,
  pointer: FluidPointer,
  width: number,
  height: number
) {
  let dx = pointer.deltaX * refs.config.current.SPLAT_FORCE;
  let dy = pointer.deltaY * refs.config.current.SPLAT_FORCE;
  splat(
    refs,
    pointer.texcoordX,
    pointer.texcoordY,
    dx,
    dy,
    { r: pointer.color[0], g: pointer.color[1], b: pointer.color[2] },
    width,
    height
  );
}
