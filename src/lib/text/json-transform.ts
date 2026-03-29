export interface JsonTransformResult {
  ok: boolean;
  text: string;
  error?: string;
}

function errorToMessage(error: unknown): string {
  if (error instanceof Error)
    return error.message || error.name || "Invalid JSON";
  if (typeof error === "string" && error.trim()) return error.trim();
  return "Invalid JSON";
}

export function formatJson(input: string, spaces: number): JsonTransformResult {
  const raw = input.trim().replace(/^\uFEFF/, "");
  if (!raw) return { ok: true, text: "" };
  try {
    const value = JSON.parse(raw) as unknown;
    const safeSpaces = Number.isFinite(spaces)
      ? Math.min(8, Math.max(0, Math.floor(spaces)))
      : 2;
    return { ok: true, text: JSON.stringify(value, null, safeSpaces) };
  } catch (e) {
    return { ok: false, text: "", error: errorToMessage(e) };
  }
}

export function minifyJson(input: string): JsonTransformResult {
  const raw = input.trim().replace(/^\uFEFF/, "");
  if (!raw) return { ok: true, text: "" };
  try {
    const value = JSON.parse(raw) as unknown;
    return { ok: true, text: JSON.stringify(value) };
  } catch (e) {
    return { ok: false, text: "", error: errorToMessage(e) };
  }
}
