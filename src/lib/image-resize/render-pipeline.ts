import type { PixelSourceCrop } from "./norm-source-crop";

export type ResizePipelineMode = "none" | "width" | "height" | "fit";
export type FitPipelineMode = "contain" | "cover";

export function computeTargetSize(args: {
  sw: number;
  sh: number;
  resizeMode: ResizePipelineMode;
  width: number;
  height: number;
}) {
  if (args.resizeMode === "none") return { tw: args.sw, th: args.sh };
  if (args.resizeMode === "width") {
    const tw = Math.max(1, Math.round(args.width));
    const th = Math.max(1, Math.round((args.sh / args.sw) * tw));
    return { tw, th };
  }
  if (args.resizeMode === "height") {
    const th = Math.max(1, Math.round(args.height));
    const tw = Math.max(1, Math.round((args.sw / args.sh) * th));
    return { tw, th };
  }
  const tw = Math.max(1, Math.round(args.width));
  const th = Math.max(1, Math.round(args.height));
  return { tw, th };
}

export function drawPipelineToCanvas(args: {
  bitmap: CanvasImageSource;
  crop: PixelSourceCrop;
  resizeMode: ResizePipelineMode;
  fitMode: FitPipelineMode;
  width: number;
  height: number;
}): HTMLCanvasElement {
  const { sx, sy, sWidth, sHeight } = args.crop;
  const { tw, th } = computeTargetSize({
    sw: sWidth,
    sh: sHeight,
    resizeMode: args.resizeMode,
    width: args.width,
    height: args.height,
  });

  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize canvas.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  if (args.resizeMode === "fit") {
    const scale =
      args.fitMode === "cover"
        ? Math.max(tw / sWidth, th / sHeight)
        : Math.min(tw / sWidth, th / sHeight);
    const dw = Math.round(sWidth * scale);
    const dh = Math.round(sHeight * scale);
    const dx = Math.round((tw - dw) / 2);
    const dy = Math.round((th - dh) / 2);
    ctx.drawImage(args.bitmap, sx, sy, sWidth, sHeight, dx, dy, dw, dh);
  } else {
    ctx.drawImage(args.bitmap, sx, sy, sWidth, sHeight, 0, 0, tw, th);
  }

  return canvas;
}
