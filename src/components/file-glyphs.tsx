import * as React from "react";

export type FileGlyphProps = {
  className?: string;
  "aria-hidden"?: boolean;
};

export function FileSpreadsheetGlyph({
  className,
  "aria-hidden": ariaHidden,
}: FileGlyphProps) {
  // Spreadsheet-like glyph: folded corner + grid lines.
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path
        d="M7 3.75h5.5L18.25 9.5V20.25c0 .966-.784 1.75-1.75 1.75H7c-.966 0-1.75-.784-1.75-1.75V5.5c0-.966.784-1.75 1.75-1.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 3.75V9.5H18.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M7.75 12.25h8.5M7.75 15.5h8.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M9.25 10v11M12 10v11M14.75 10v11"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

export function FileJsonGlyph({
  className,
  "aria-hidden": ariaHidden,
}: FileGlyphProps) {
  // JSON glyph: braces.
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path
        d="M10 4.5L6.5 12L10 19.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 4.5L17.5 12L14 19.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.75 8.2h.5M11.5 12h1M11.75 15.8h.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

export function FileParquetGlyph({
  className,
  "aria-hidden": ariaHidden,
}: FileGlyphProps) {
  // Parquet glyph: layered blocks.
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path
        d="M7 4.75h10c.966 0 1.75.784 1.75 1.75v3.6c0 .966-.784 1.75-1.75 1.75H7c-.966 0-1.75-.784-1.75-1.75V6.5c0-.966.784-1.75 1.75-1.75Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M7 12.55h10c.966 0 1.75.784 1.75 1.75V19.5c0 .966-.784 1.75-1.75 1.75H7c-.966 0-1.75-.784-1.75-1.75v-5.2c0-.966.784-1.75 1.75-1.75Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 7.5h6M9 15.6h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

export function FileExcelGlyph({
  className,
  "aria-hidden": ariaHidden,
}: FileGlyphProps) {
  // Excel-like glyph: folded sheet with an X.
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={ariaHidden}
    >
      <path
        d="M7 3.75h5.5L18.25 9.5V20.25c0 .966-.784 1.75-1.75 1.75H7c-.966 0-1.75-.784-1.75-1.75V5.5c0-.966.784-1.75 1.75-1.75Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 3.75V9.5H18.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.25 12.25 14.75 17.75"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M14.75 12.25 9.25 17.75"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

