import type * as PdfJs from "pdfjs-dist";

let pdfjsPromise: Promise<typeof PdfJs> | null = null;

export async function getPdfJs(): Promise<typeof PdfJs> {
  if (pdfjsPromise) return pdfjsPromise;

  pdfjsPromise = import("pdfjs-dist").then((mod) => {
    // Ensure the worker is bundled locally (no CDN).
    // Next/Turbopack can resolve this URL at build time.
    mod.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    return mod;
  });

  return pdfjsPromise;
}

