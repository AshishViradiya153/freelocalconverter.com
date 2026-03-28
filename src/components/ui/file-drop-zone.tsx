"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type FileDropZoneSize = "sm" | "md" | "lg";
export type FileDropZoneBadgeSize = "md" | "lg";

type FileIconProps = {
  className?: string;
  "aria-hidden"?: boolean;
};

export interface FileDropZoneProps {
  disabled: boolean;
  busy: boolean;
  accept: string;
  multiple?: boolean;
  onFiles: (files: FileList | null) => void;

  /** Repo-owned icon component for the file type. */
  fileIcon: React.ElementType<FileIconProps>;

  /** Optional label rendered above the drop card (used by `CsvCompare`). */
  topLabel?: React.ReactNode;

  /** Main label shown inside the card when no file is selected. */
  dropTitle: React.ReactNode;
  /** Optional secondary label (enables 2-line layout). */
  dropHint?: React.ReactNode;

  /** When set, overrides `dropTitle`. */
  fileName?: string | null;

  chooseLabel: React.ReactNode;
  chooseLabelWhenFileSelected?: React.ReactNode;

  /** Optional hint rendered under the card. */
  fileHint?: React.ReactNode;

  size?: FileDropZoneSize;
  badgeSize?: FileDropZoneBadgeSize;

  wrapperClassName?: string;
  inputId?: string;
  ariaLabel?: string;
  fullWidth?: boolean;
  /**
   * Optional icon rendered inside the badge.
   * Defaults to our repo-owned upload glyph.
   */
  badgeIcon?: React.ReactNode;
}

function UploadGlyph({ className }: { className?: string }) {
  // Repo-owned SVG upload glyph (no external icon dependency).
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 16V4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 8L12 3L17 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 16.5C4 19.5376 6.46243 22 9.5 22H14.5C17.5376 22 20 19.5376 20 16.5V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FileDropZone({
  disabled,
  busy,
  accept,
  multiple,
  onFiles,
  fileIcon: FileIcon,
  topLabel,
  dropTitle,
  dropHint,
  fileName,
  chooseLabel,
  chooseLabelWhenFileSelected,
  fileHint,
  size = "md",
  badgeSize,
  wrapperClassName,
  inputId,
  ariaLabel,
  fullWidth = false,
  badgeIcon,
}: FileDropZoneProps) {
  const effectiveBadgeSize: FileDropZoneBadgeSize =
    badgeSize ?? (size === "lg" ? "lg" : "md");
  const [isDragging, setIsDragging] = React.useState(false);
  const dragDepthRef = React.useRef(0);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const resolvedInputId = React.useMemo(() => {
    if (inputId) return inputId;
    // `useId()` can include `:`, which is valid in HTML but can be awkward for selectors.
    // We only use `getElementById` when `inputId` is explicitly provided.
    return undefined;
  }, [inputId]);

  const openPicker = React.useCallback(() => {
    if (disabled || busy) return;
    if (inputId) {
      document.getElementById(inputId)?.click();
      return;
    }
    inputRef.current?.click();
  }, [busy, disabled, inputId]);

  const commitFiles = React.useCallback(
    (files: FileList | null) => {
      dragDepthRef.current = 0;
      setIsDragging(false);
      onFiles(files);
    },
    [onFiles],
  );

  const onDrop = React.useCallback(
    (e: React.DragEvent) => {
      if (disabled || busy) return;
      e.preventDefault();
      e.stopPropagation();
      commitFiles(e.dataTransfer.files);
    },
    [busy, commitFiles, disabled],
  );

  const onDragEnter = React.useCallback(
    (e: React.DragEvent) => {
      if (disabled || busy) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current += 1;
      setIsDragging(true);
    },
    [busy, disabled],
  );

  const onDragOver = React.useCallback(
    (e: React.DragEvent) => {
      if (disabled || busy) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    },
    [busy, disabled],
  );

  const onDragLeave = React.useCallback(
    (e: React.DragEvent) => {
      if (disabled || busy) return;
      e.preventDefault();
      e.stopPropagation();

      const related = e.relatedTarget as Node | null;
      if (related && e.currentTarget.contains(related)) return;

      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setIsDragging(false);
    },
    [busy, disabled],
  );

  const iconClassName = cn({
    "size-8": size === "sm",
    "size-10": size !== "sm",
  });

  const iconWrapClassName = cn(
    "grid place-items-center rounded-lg bg-background/70 ring-1 ring-border/60",
    {
      "size-11": size === "sm",
      "size-12": size === "md",
      "size-14": size === "lg",
    },
  );

  const cardPadding = cn({
    "p-6": size === "sm",
    "p-8": size === "md",
    "p-10": size === "lg",
  });

  const minHeightClassName = cn({
    "min-h-28": size === "sm",
    "min-h-36": size === "md",
    "min-h-44": size === "lg",
  });

  const dropTitleClasses = cn({
    "text-center text-muted-foreground text-xs": size === "sm",
    "text-center text-muted-foreground text-sm": size !== "sm",
  });

  const badgeClasses = cn(
    "inline-flex items-center gap-1.5 rounded-md bg-background font-medium ring-1 ring-border/50",
    {
      "px-2.5 py-1 text-xs": effectiveBadgeSize === "md",
      "gap-2 px-3 py-1.5 text-sm": effectiveBadgeSize === "lg",
    },
  );

  const uploadIconClassName = cn({
    "size-3.5": effectiveBadgeSize === "md",
    "size-4": effectiveBadgeSize === "lg",
  });

  const buttonClassName = cn(
    "group relative overflow-hidden flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all",
    cardPadding,
    minHeightClassName,
    "border-border bg-muted/10",
    "hover:bg-muted/20 hover:-translate-y-px active:translate-y-0",
    // Radial glow + underline similar to footer link items.
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:opacity-0 before:transition-opacity before:bg-[radial-gradient(120%_120%_at_20%_0%,hsl(var(--primary)/0.18),transparent_60%)] group-hover:before:opacity-100",
    "after:pointer-events-none after:absolute after:inset-x-2 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:rounded-full after:transition-transform after:bg-gradient-to-r after:from-primary/50 after:via-primary/10 after:to-transparent group-hover:after:scale-x-100",
    isDragging &&
      "border-primary bg-primary/5 ring-1 ring-primary/30 before:opacity-100 after:scale-x-100",
    (disabled || busy) && "pointer-events-none opacity-60",
    fullWidth && "w-full",
    "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  );

  const badgeLabel = fileName
    ? (chooseLabelWhenFileSelected ?? chooseLabel)
    : chooseLabel;

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", wrapperClassName)}>
      {topLabel ? (
        <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
          {topLabel}
        </p>
      ) : null}

      <button
        type="button"
        disabled={disabled || busy}
        onClick={openPicker}
        onDrop={onDrop}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={buttonClassName}
        aria-label={ariaLabel}
      >
        <span className={iconWrapClassName} aria-hidden>
          <FileIcon
            className={cn(iconClassName, "text-muted-foreground")}
            aria-hidden
          />
        </span>

        {dropHint ? (
          <div className="space-y-1 text-center">
            <p className="font-medium text-sm">
              {fileName ? (
                <span className="font-medium text-foreground">{fileName}</span>
              ) : (
                dropTitle
              )}
            </p>
            <p className="text-muted-foreground text-xs">{dropHint}</p>
          </div>
        ) : (
          <p className={dropTitleClasses}>
            {fileName ? (
              <span className="font-medium text-foreground">{fileName}</span>
            ) : (
              dropTitle
            )}
          </p>
        )}

        <span className={badgeClasses}>
          {badgeIcon ? (
            <span
              className={cn("inline-flex items-center", uploadIconClassName)}
            >
              {badgeIcon}
            </span>
          ) : (
            <UploadGlyph
              className={cn("text-foreground", uploadIconClassName)}
            />
          )}
          {badgeLabel}
        </span>
      </button>

      <input
        ref={inputRef}
        id={resolvedInputId}
        type="file"
        accept={accept}
        className="sr-only"
        multiple={multiple}
        onChange={(e) => {
          commitFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />

      {fileHint ? (
        <p className="text-muted-foreground text-xs">{fileHint}</p>
      ) : null}
    </div>
  );
}
