import type { FFmpeg } from "@ffmpeg/ffmpeg";

export async function createBrowserFfmpeg(): Promise<FFmpeg> {
  const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
    import("@ffmpeg/ffmpeg"),
    import("@ffmpeg/util"),
  ]);

  const ffmpeg = new FFmpeg();
  const base = `${location.origin}/ffmpeg-core/umd`;
  await ffmpeg.load({
    coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
  });

  return ffmpeg;
}
