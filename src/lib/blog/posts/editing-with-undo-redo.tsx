import { BlogProse } from "../post-prose";
import type { BlogPostMeta } from "../types";

export const meta: BlogPostMeta = {
  slug: "editing-with-undo-redo",
  title: "Editing CSVs safely: cells, rows, columns, and undo/redo",
  description:
    "How to edit tabular data in a browser grid, when to use row and column operations, and why undo/redo matters for trustworthy ad hoc cleanup.",
  publishedAt: "2025-03-22",
  category: "guide",
  readTimeMinutes: 8,
  keywords: ["edit csv online", "undo redo spreadsheet", "csv column reorder"],
};

export function BlogPostContent() {
  return (
    <BlogProse>
      <p>
        View-only CSV tools are enough for quick reads, but many workflows need{" "}
        <strong>lightweight edits</strong>: fix a typo in a product title,
        normalize a status flag, insert a missing row from a stakeholder email,
        or duplicate a block of lines before re-uploading to another system. A
        capable grid editor treats the CSV as{" "}
        <strong>mutable tabular data</strong> while still letting you{" "}
        <strong>download</strong> a standard file at the end.
      </p>

      <h2>Cell editing and paste</h2>
      <p>
        Inline cell editing should commit values predictably, on blur, Enter, or
        Tab, so you do not lose work when moving focus. <strong>Paste</strong>{" "}
        from spreadsheets often arrives as TSV; good viewers map that into the
        grid and may extend the table when the clipboard has more rows or
        columns than the current selection.
      </p>
      <p>
        Watch for <strong>type drift</strong>: a column that looks numeric might
        be stored as text after mixed edits. If downstream systems require
        strict types, validate before export.
      </p>

      <h2>Rows and columns</h2>
      <ul>
        <li>
          <strong>Insert/delete rows</strong> for line-level fixes without
          touching unrelated records.
        </li>
        <li>
          <strong>Reorder rows</strong> when sequence matters for manual review
          handoffs (even if the source system will resort later).
        </li>
        <li>
          <strong>Column operations</strong> (rename, insert, cut, paste, delete)
          mirror spreadsheet power users who prepare exports for tools with
          rigid schemas.
        </li>
      </ul>

      <h2>Why undo/redo is non-negotiable</h2>
      <p>
        Bulk paste, mistaken deletes, and aggressive find-and-replace are where
        tables go wrong. Multi-level <strong>undo</strong> and{" "}
        <strong>redo</strong> restore confidence: you can experiment, revert,
        and keep a mental model of &quot;safe exploration.&quot; For teams, this
        is as much about <strong>auditability</strong> as convenience. Paired
        with clear export naming, you can trace which version of a file left the
        browser.
      </p>

      <h2>Session persistence</h2>
      <p>
        Some products (including ours) persist your session in{" "}
        <strong>browser storage</strong> so a refresh does not wipe hours of
        cleanup. That is helpful for long tasks but reinforces the need to{" "}
        <strong>clear data</strong> on shared machines and to understand what
        your privacy policy promises about local retention.
      </p>
    </BlogProse>
  );
}
