import { parse, stringify } from "yaml";

export interface JsonYamlTransformResult {
  ok: boolean;
  text: string;
  error?: string;
}

function errorToMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message || error.name || fallback;
  if (typeof error === "string" && error.trim()) return error.trim();
  return fallback;
}

function stripBom(input: string): string {
  return input.trim().replace(/^\uFEFF/, "");
}

export function jsonStringToYaml(
  input: string,
  indent: number,
): JsonYamlTransformResult {
  const raw = stripBom(input);
  if (!raw) return { ok: true, text: "" };
  try {
    const value = JSON.parse(raw) as unknown;
    const safeIndent = Number.isFinite(indent)
      ? Math.min(8, Math.max(1, Math.floor(indent)))
      : 2;
    const text = stringify(value, { indent: safeIndent });
    return { ok: true, text: text ?? "" };
  } catch (e) {
    return { ok: false, text: "", error: errorToMessage(e, "Invalid JSON") };
  }
}

export function yamlStringToJson(
  input: string,
  spaces: number,
): JsonYamlTransformResult {
  const raw = stripBom(input);
  if (!raw) return { ok: true, text: "" };
  try {
    const value = parse(raw) as unknown;
    if (value === undefined) {
      return {
        ok: false,
        text: "",
        error: "YAML parsed to undefined; cannot convert to JSON",
      };
    }
    const safeSpaces = Number.isFinite(spaces)
      ? Math.min(8, Math.max(0, Math.floor(spaces)))
      : 2;
    return {
      ok: true,
      text: JSON.stringify(
        value,
        null,
        safeSpaces === 0 ? undefined : safeSpaces,
      ),
    };
  } catch (e) {
    return { ok: false, text: "", error: errorToMessage(e, "Invalid YAML") };
  }
}

export function yamlStringToMinifiedJson(
  input: string,
): JsonYamlTransformResult {
  const raw = stripBom(input);
  if (!raw) return { ok: true, text: "" };
  try {
    const value = parse(raw) as unknown;
    if (value === undefined) {
      return {
        ok: false,
        text: "",
        error: "YAML parsed to undefined; cannot convert to JSON",
      };
    }
    return { ok: true, text: JSON.stringify(value) };
  } catch (e) {
    return { ok: false, text: "", error: errorToMessage(e, "Invalid YAML") };
  }
}
