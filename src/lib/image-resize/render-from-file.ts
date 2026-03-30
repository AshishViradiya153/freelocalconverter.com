import {
  clampPixelCrop,
  defaultPixelCropForPreset,
  normToPixel,
  pixelToNorm,
  resolveCropForImageSize,
  type ImageResizeCropPreset,
  type NormSourceCrop,
} from "./norm-source-crop";
import {
  drawPipelineToCanvas,
  type FitPipelineMode,
  type ResizePipelineMode,
} from "./render-pipeline";

export interface ImageResizeRefDimensions {
  sw: number;
  sh: number;
}

export async function renderImageFileToPipelineCanvas(args: {
  file: File;
  cropPreset: ImageResizeCropPreset;
  normCrop: NormSourceCrop | null;
  refDimensions: ImageResizeRefDimensions | null;
  resizeMode: ResizePipelineMode;
  fitMode: FitPipelineMode;
  width: number;
  height: number;
}): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(args.file);
  try {
    const sw = bitmap.width;
    const sh = bitmap.height;
    if (sw <= 0 || sh <= 0) {
      throw new Error("Could not decode image dimensions.");
    }

    const norm =
      args.normCrop ??
      pixelToNorm(
        clampPixelCrop(
          sw,
          sh,
          defaultPixelCropForPreset(sw, sh, args.cropPreset),
        ),
        sw,
        sh,
      );
    const ref = args.refDimensions;
    const hasRef = ref !== null && ref.sw > 0 && ref.sh > 0;
    const crop = hasRef
      ? resolveCropForImageSize({
          norm,
          refSw: ref.sw,
          refSh: ref.sh,
          sw,
          sh,
          preset: args.cropPreset,
        })
      : clampPixelCrop(sw, sh, normToPixel(norm, sw, sh));

    return drawPipelineToCanvas({
      bitmap,
      crop,
      resizeMode: args.resizeMode,
      fitMode: args.fitMode,
      width: args.width,
      height: args.height,
    });
  } finally {
    bitmap.close();
  }
}
