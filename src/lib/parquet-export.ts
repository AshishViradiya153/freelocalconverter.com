import { sanitizeCsvDownloadFileBaseName } from "@/lib/csv-export";

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadParquetExport(
  buffer: ArrayBuffer,
  fileBaseName: string,
) {
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const base = sanitizeCsvDownloadFileBaseName(fileBaseName);
  triggerBrowserDownload(blob, `${base}.parquet`);
}

