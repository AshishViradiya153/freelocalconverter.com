/**
 * Browser RegExp testing with hard caps to reduce ReDoS / main-thread stalls.
 * Matching uses the same semantics as JavaScript `RegExp.prototype.exec`.
 */

export const REGEX_MAX_PATTERN_LENGTH = 2_000;
export const REGEX_MAX_SUBJECT_LENGTH = 512_000;
export const REGEX_MAX_MATCHES = 1_000;

export interface RegexFlagState {
  global: boolean;
  ignoreCase: boolean;
  multiline: boolean;
  dotAll: boolean;
  unicode: boolean;
  sticky: boolean;
  hasIndices: boolean;
}

export interface RegexMatchRow {
  index: number;
  end: number;
  match: string;
  captures: string[];
  named: Record<string, string>;
  /** Present when the `d` / `hasIndices` flag is on (modern engines). */
  indexRanges?: Array<[number, number] | undefined>;
}

export type RegexTestResult =
  | {
      ok: true;
      flagsUsed: string;
      subjectWasTruncated: boolean;
      matchesTruncated: boolean;
      matchCount: number;
      matches: RegexMatchRow[];
    }
  | {
      ok: false;
      kind: "syntax" | "limits";
      message: string;
    };

export function buildJsFlagString(flags: RegexFlagState): string {
  let s = "";
  if (flags.hasIndices) s += "d";
  if (flags.global) s += "g";
  if (flags.ignoreCase) s += "i";
  if (flags.multiline) s += "m";
  if (flags.dotAll) s += "s";
  if (flags.unicode) s += "u";
  if (flags.sticky) s += "y";
  return s;
}

function rowFromMatch(
  m: RegExpExecArray,
  flags: RegexFlagState,
): RegexMatchRow {
  const named = m.groups ? { ...m.groups } : {};
  const captures = m.slice(1).map((c) => (c === undefined ? "" : c));
  let indexRanges: Array<[number, number] | undefined> | undefined;
  if (flags.hasIndices && m.indices) {
    indexRanges = m.indices.map((pair) =>
      pair === undefined ? undefined : [pair[0], pair[1]],
    );
  }
  return {
    index: m.index,
    end: m.index + m[0].length,
    match: m[0],
    captures,
    named,
    indexRanges,
  };
}

export function runRegexTest(
  pattern: string,
  subject: string,
  flags: RegexFlagState,
): RegexTestResult {
  if (pattern.length > REGEX_MAX_PATTERN_LENGTH) {
    return {
      ok: false,
      kind: "limits",
      message: `Pattern is longer than ${REGEX_MAX_PATTERN_LENGTH} characters.`,
    };
  }

  let working = subject;
  let subjectWasTruncated = false;
  if (working.length > REGEX_MAX_SUBJECT_LENGTH) {
    working = working.slice(0, REGEX_MAX_SUBJECT_LENGTH);
    subjectWasTruncated = true;
  }

  const flagsUsed = buildJsFlagString(flags);
  let re: RegExp;
  try {
    re = new RegExp(pattern, flagsUsed);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, kind: "syntax", message };
  }

  const matches: RegexMatchRow[] = [];

  if (flags.global) {
    re.lastIndex = 0;
    while (matches.length < REGEX_MAX_MATCHES) {
      const m = re.exec(working);
      if (!m) break;
      matches.push(rowFromMatch(m, flags));
    }
    const more = re.exec(working);
    const matchesTruncated = more !== null;
    return {
      ok: true,
      flagsUsed,
      subjectWasTruncated,
      matchesTruncated,
      matchCount: matches.length,
      matches,
    };
  }

  const m = re.exec(working);
  if (m) matches.push(rowFromMatch(m, flags));
  return {
    ok: true,
    flagsUsed,
    subjectWasTruncated,
    matchesTruncated: false,
    matchCount: matches.length,
    matches,
  };
}

export interface FlagExplainRow {
  letter: string;
  label: string;
  description: string;
}

/** Static reference for UI “explain” panels (English; nav strings stay in messages). */
export const REGEX_FLAG_REFERENCE: FlagExplainRow[] = [
  {
    letter: "g",
    label: "global",
    description: "Find all matches; advances lastIndex after each match.",
  },
  {
    letter: "i",
    label: "ignoreCase",
    description:
      "Case-insensitive match for ASCII letters; Unicode casefolding when combined with u.",
  },
  {
    letter: "m",
    label: "multiline",
    description:
      "^ and $ match the start/end of each line, not only the string.",
  },
  {
    letter: "s",
    label: "dotAll",
    description: "Dot (.) matches newline characters.",
  },
  {
    letter: "u",
    label: "unicode",
    description:
      "Unicode mode; required for \\p{…} and treats code points correctly.",
  },
  {
    letter: "y",
    label: "sticky",
    description: "Match only from the current lastIndex (no search beyond it).",
  },
  {
    letter: "d",
    label: "hasIndices",
    description: "Expose start/end indices for each capture in match.indices.",
  },
];

/**
 * Lightweight pattern hints (not a full parser). Helps users spot risky or easy-to-misuse shapes.
 */
export function collectPatternExplainNotes(
  pattern: string,
  flags: RegexFlagState,
): string[] {
  const notes: string[] = [];
  if (pattern.length === 0) {
    notes.push(
      "An empty pattern matches an empty substring; with the global flag you may see many zero-length matches.",
    );
  }

  if (/\\p\{/.test(pattern) && !flags.unicode) {
    notes.push(
      "This pattern uses \\p{…} property escapes; enable the u (unicode) flag so they work in JavaScript.",
    );
  }

  if (/\(\?<=|\(\?<!/.test(pattern) && !flags.unicode) {
    notes.push(
      "Lookbehind is supported in modern JavaScript; unicode mode (u) is usually recommended with complex Unicode text.",
    );
  }

  // Heuristic nested-quantifier warning (classic backtracking foot-gun, not exhaustive).
  if (/\([^()]*[+*?][^()]*\)[+*?]/.test(pattern)) {
    notes.push(
      "Nested quantifiers can cause catastrophic backtracking on long strings. Prefer simpler alternatives, possessive/atomic patterns where your engine allows, or limit input size (this tool caps matches and subject length).",
    );
  }

  if (/\.\*(?:\?)?\.\*/.test(pattern)) {
    notes.push(
      "Adjacent .* runs often match the same span in different ways and can be very slow; consider a more specific class or tempered dot.",
    );
  }

  return notes;
}
