export type ImageResizeCropPreset =
  | "none"
  | "1:1"
  | "4:3"
  | "16:9"
  | "9:16";

export interface PixelSourceCrop {
  sx: number;
  sy: number;
  sWidth: number;
  sHeight: number;
}

export interface NormSourceCrop {
  nx: number;
  ny: number;
  nw: number;
  nh: number;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function cropRatio(preset: ImageResizeCropPreset): number | null {
  if (preset === "1:1") return 1;
  if (preset === "4:3") return 4 / 3;
  if (preset === "16:9") return 16 / 9;
  if (preset === "9:16") return 9 / 16;
  return null;
}

export function computeSourceCrop(args: {
  sw: number;
  sh: number;
  ratio: number | null;
}): PixelSourceCrop {
  if (!args.ratio) {
    return { sx: 0, sy: 0, sWidth: args.sw, sHeight: args.sh };
  }
  const { sw, sh } = args;
  const srcRatio = sw / sh;
  if (srcRatio > args.ratio) {
    const sWidth = Math.round(sh * args.ratio);
    const sx = Math.round((sw - sWidth) / 2);
    return { sx, sy: 0, sWidth, sHeight: sh };
  }
  const sHeight = Math.round(sw / args.ratio);
  const sy = Math.round((sh - sHeight) / 2);
  return { sx: 0, sy, sWidth: sw, sHeight };
}

export function maxCropSizeForRatio(sw: number, sh: number, R: number) {
  let w = Math.min(sw, sh * R);
  let h = w / R;
  if (h > sh) {
    h = sh;
    w = h * R;
  }
  return {
    sWidth: Math.max(1, Math.floor(w)),
    sHeight: Math.max(1, Math.floor(h)),
  };
}

export function minCropWidthForRatio(sw: number, sh: number, R: number) {
  const maxDim = Math.max(sw, sh);
  return Math.max(8, Math.floor(maxDim * 0.06));
}

export function pixelToNorm(
  crop: PixelSourceCrop,
  sw: number,
  sh: number,
): NormSourceCrop {
  return {
    nx: crop.sx / sw,
    ny: crop.sy / sh,
    nw: crop.sWidth / sw,
    nh: crop.sHeight / sh,
  };
}

export function normToPixel(
  norm: NormSourceCrop,
  sw: number,
  sh: number,
): PixelSourceCrop {
  let sx = Math.round(norm.nx * sw);
  let sy = Math.round(norm.ny * sh);
  let sWidth = Math.round(norm.nw * sw);
  let sHeight = Math.round(norm.nh * sh);
  sx = clamp(sx, 0, Math.max(0, sw - 1));
  sy = clamp(sy, 0, Math.max(0, sh - 1));
  sWidth = clamp(sWidth, 1, sw - sx);
  sHeight = clamp(sHeight, 1, sh - sy);
  return { sx, sy, sWidth, sHeight };
}

export function defaultPixelCropForPreset(
  sw: number,
  sh: number,
  preset: ImageResizeCropPreset,
): PixelSourceCrop {
  return computeSourceCrop({ sw, sh, ratio: cropRatio(preset) });
}

export function clampPixelCrop(
  sw: number,
  sh: number,
  crop: PixelSourceCrop,
): PixelSourceCrop {
  const sx = clamp(Math.round(crop.sx), 0, Math.max(0, sw - 1));
  const sy = clamp(Math.round(crop.sy), 0, Math.max(0, sh - 1));
  const sWidth = clamp(Math.round(crop.sWidth), 1, sw - sx);
  const sHeight = clamp(Math.round(crop.sHeight), 1, sh - sy);
  return { sx, sy, sWidth, sHeight };
}

export function translatePixelCrop(
  sw: number,
  sh: number,
  crop: PixelSourceCrop,
  dx: number,
  dy: number,
): PixelSourceCrop {
  return clampPixelCrop(sw, sh, {
    ...crop,
    sx: crop.sx + dx,
    sy: crop.sy + dy,
  });
}

/** Resize crop width (ratio preset) keeping visual center; clamp inside image. */
export function scalePixelCropWidth(
  sw: number,
  sh: number,
  crop: PixelSourceCrop,
  newWidth: number,
  R: number,
): PixelSourceCrop {
  const newHeight = Math.max(1, Math.round(newWidth / R));
  const cx = crop.sx + crop.sWidth / 2;
  const cy = crop.sy + crop.sHeight / 2;
  let sx = Math.round(cx - newWidth / 2);
  let sy = Math.round(cy - newHeight / 2);
  return clampPixelCrop(sw, sh, {
    sx,
    sy,
    sWidth: newWidth,
    sHeight: newHeight,
  });
}

/**
 * Maps the crop chosen on the reference image to another size so bulk jobs keep
 * the same intent (center + zoom vs max crop for the preset) instead of
 * stretching a single normalized rectangle when aspect ratios differ.
 */
export function resolveCropForImageSize(args: {
  norm: NormSourceCrop;
  refSw: number;
  refSh: number;
  sw: number;
  sh: number;
  preset: ImageResizeCropPreset;
}): PixelSourceCrop {
  const { norm, refSw, refSh, sw, sh, preset } = args;
  const presetR = cropRatio(preset);
  const refR = presetR ?? refSw / refSh;
  const targetR = presetR ?? sw / sh;

  const refPixel = normToPixel(norm, refSw, refSh);
  const refMax = maxCropSizeForRatio(refSw, refSh, refR);
  const zoom =
    refMax.sWidth > 0
      ? clamp(refPixel.sWidth / refMax.sWidth, 0.01, 1)
      : 1;
  const cx = (refPixel.sx + refPixel.sWidth / 2) / refSw;
  const cy = (refPixel.sy + refPixel.sHeight / 2) / refSh;

  const maxT = maxCropSizeForRatio(sw, sh, targetR);
  const rawMin = minCropWidthForRatio(sw, sh, targetR);
  const minW = Math.min(rawMin, maxT.sWidth);
  let sWidth = Math.round(maxT.sWidth * zoom);
  sWidth = clamp(sWidth, Math.min(minW, maxT.sWidth), maxT.sWidth);
  const sHeight = Math.max(1, Math.round(sWidth / targetR));
  const sx = Math.round(cx * sw - sWidth / 2);
  const sy = Math.round(cy * sh - sHeight / 2);
  return clampPixelCrop(sw, sh, { sx, sy, sWidth, sHeight });
}

export type CropCorner = "nw" | "ne" | "sw" | "se";

/**
 * Resize crop from a corner drag while keeping aspect R (width / height).
 * Opposite corner stays fixed in image space (before clamp).
 */
export function resizeCropFromCorner(args: {
  sw: number;
  sh: number;
  crop: PixelSourceCrop;
  corner: CropCorner;
  pointerX: number;
  pointerY: number;
  R: number;
}): PixelSourceCrop {
  const { sw, sh, crop, corner, pointerX, pointerY, R } = args;
  const { sx, sy, sWidth, sHeight } = crop;
  const maxD = maxCropSizeForRatio(sw, sh, R);
  const rawMinW = minCropWidthForRatio(sw, sh, R);
  const minW = Math.min(rawMinW, maxD.sWidth);
  const tMin = Math.max(minW / R, 1e-6);
  const rr = R * R + 1;

  let t: number;
  let tMax: number;

  switch (corner) {
    case "se": {
      t = (R * (pointerX - sx) + (pointerY - sy)) / rr;
      tMax = Math.min((sw - sx) / R, sh - sy);
      break;
    }
    case "nw": {
      const fx = sx + sWidth;
      const fy = sy + sHeight;
      t = (R * (fx - pointerX) + (fy - pointerY)) / rr;
      tMax = Math.min(fx / R, fy);
      break;
    }
    case "sw": {
      const fx = sx + sWidth;
      const fy = sy;
      t = (R * (fx - pointerX) - (fy - pointerY)) / rr;
      tMax = Math.min(fx / R, sh - fy);
      break;
    }
    case "ne": {
      const fx = sx;
      const fy = sy + sHeight;
      t = (R * (pointerX - fx) - (pointerY - fy)) / rr;
      tMax = Math.min(fy, (sw - fx) / R);
      break;
    }
  }

  const hi = Math.max(tMax, tMin);
  t = clamp(t, tMin, hi);

  switch (corner) {
    case "se": {
      const nw = R * t;
      const nh = t;
      return clampPixelCrop(sw, sh, { sx, sy, sWidth: nw, sHeight: nh });
    }
    case "nw": {
      const fx = sx + sWidth;
      const fy = sy + sHeight;
      const nw = R * t;
      const nh = t;
      return clampPixelCrop(sw, sh, {
        sx: fx - nw,
        sy: fy - nh,
        sWidth: nw,
        sHeight: nh,
      });
    }
    case "sw": {
      const fx = sx + sWidth;
      const fy = sy;
      const nw = R * t;
      const nh = t;
      return clampPixelCrop(sw, sh, {
        sx: fx - nw,
        sy: fy,
        sWidth: nw,
        sHeight: nh,
      });
    }
    case "ne": {
      const fx = sx;
      const fy = sy + sHeight;
      const nw = R * t;
      const nh = t;
      return clampPixelCrop(sw, sh, {
        sx: fx,
        sy: fy - nh,
        sWidth: nw,
        sHeight: nh,
      });
    }
  }
}
