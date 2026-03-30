"use client";

import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ReplaceAll,
  Search,
  X,
} from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAsRef } from "@/hooks/use-as-ref";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { cn } from "@/lib/utils";
import type { SearchState } from "@/types/data-grid";

export function DataGridSearchButton({
  searchState,
}: {
  searchState: SearchState | undefined;
}) {
  if (!searchState) return null;

  return (
    <Button
      type="button"
      variant={searchState.searchOpen ? "secondary" : "outline"}
      size="sm"
      className="bg-background dark:bg-input/30 dark:hover:bg-input/50"
      aria-label="Find in table"
      aria-pressed={searchState.searchOpen}
      onClick={() => searchState.onSearchOpenChange(!searchState.searchOpen)}
    >
      <Search className="size-4" />
      Search
    </Button>
  );
}

interface DataGridSearchProps extends SearchState {}

export const DataGridSearch = React.memo(DataGridSearchImpl, (prev, next) => {
  if (prev.searchOpen !== next.searchOpen) return false;

  if (!next.searchOpen) return true;

  if (
    prev.searchQuery !== next.searchQuery ||
    prev.matchIndex !== next.matchIndex
  ) {
    return false;
  }

  if (prev.readOnly !== next.readOnly) return false;

  if (prev.onSearchReplaceAll !== next.onSearchReplaceAll) return false;

  if (prev.searchMatches.length !== next.searchMatches.length) return false;

  for (let i = 0; i < prev.searchMatches.length; i++) {
    const prevMatch = prev.searchMatches[i];
    const nextMatch = next.searchMatches[i];

    if (!prevMatch || !nextMatch) return false;

    if (
      prevMatch.rowIndex !== nextMatch.rowIndex ||
      prevMatch.columnId !== nextMatch.columnId ||
      prevMatch.dataRowIndex !== nextMatch.dataRowIndex
    ) {
      return false;
    }
  }

  return true;
});

function DataGridSearchImpl({
  searchMatches,
  matchIndex,
  searchOpen,
  onSearchOpenChange,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  onNavigateToNextMatch,
  onNavigateToPrevMatch,
  readOnly,
  onSearchReplaceAll,
}: DataGridSearchProps) {
  const propsRef = useAsRef({
    onSearchOpenChange,
    onSearchQueryChange,
    onSearch,
    onNavigateToNextMatch,
    onNavigateToPrevMatch,
    onSearchReplaceAll,
  });

  const inputRef = React.useRef<HTMLInputElement>(null);
  const replaceInputRef = React.useRef<HTMLInputElement>(null);
  const [replaceOpen, setReplaceOpen] = React.useState(false);
  const [replaceQuery, setReplaceQuery] = React.useState("");

  React.useEffect(() => {
    if (searchOpen) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [searchOpen]);

  React.useEffect(() => {
    if (searchOpen && replaceOpen) {
      requestAnimationFrame(() => {
        replaceInputRef.current?.focus();
      });
    }
  }, [searchOpen, replaceOpen]);

  React.useEffect(() => {
    if (!searchOpen) return;

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        propsRef.current.onSearchOpenChange(false);
      }
    }

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [searchOpen, propsRef]);

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      event.stopPropagation();

      if (event.key === "Enter") {
        event.preventDefault();
        if (event.shiftKey) {
          propsRef.current.onNavigateToPrevMatch();
        } else {
          propsRef.current.onNavigateToNextMatch();
        }
      }
    },
    [propsRef],
  );

  const debouncedSearch = useDebouncedCallback((query: string) => {
    propsRef.current.onSearch(query);
  }, 150);

  const onChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      propsRef.current.onSearchQueryChange(value);
      debouncedSearch(value);
    },
    [propsRef, debouncedSearch],
  );

  const onTriggerPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      // prevent implicit pointer capture
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.hasPointerCapture(event.pointerId)) {
        target.releasePointerCapture(event.pointerId);
      }

      // Only prevent default if we're not clicking on the input
      // This allows text selection in the input while still preventing focus stealing elsewhere
      if (
        event.button === 0 &&
        event.ctrlKey === false &&
        event.pointerType === "mouse" &&
        !(event.target instanceof HTMLInputElement)
      ) {
        event.preventDefault();
      }
    },
    [],
  );

  const onPrevMatchPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) =>
      onTriggerPointerDown(event),
    [onTriggerPointerDown],
  );

  const onNextMatchPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) =>
      onTriggerPointerDown(event),
    [onTriggerPointerDown],
  );

  const onClose = React.useCallback(() => {
    propsRef.current.onSearchOpenChange(false);
  }, [propsRef]);

  const onPrevMatch = React.useCallback(() => {
    propsRef.current.onNavigateToPrevMatch();
  }, [propsRef]);

  const onNextMatch = React.useCallback(() => {
    propsRef.current.onNavigateToNextMatch();
  }, [propsRef]);

  const onToggleReplace = React.useCallback(() => {
    setReplaceOpen((open) => !open);
  }, []);

  const onReplaceQueryChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setReplaceQuery(event.target.value);
    },
    [],
  );

  const onReplaceAll = React.useCallback(() => {
    propsRef.current.onSearchReplaceAll(searchQuery, replaceQuery);
  }, [propsRef, searchQuery, replaceQuery]);

  if (!searchOpen) return null;

  return (
    <div
      role="search"
      data-slot="grid-search"
      className="fade-in-0 slide-in-from-top-2 absolute end-4 top-4 z-50 flex min-w-[min(100vw-2rem,22rem)] max-w-[min(100vw-2rem,36rem)] animate-in flex-col gap-2 rounded-lg border bg-background p-2"
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          aria-expanded={replaceOpen}
          aria-label={replaceOpen ? "Hide replace field" : "Show replace field"}
          onClick={onToggleReplace}
        >
          <ChevronRight
            className={cn(
              "size-4 transition-transform duration-200",
              replaceOpen && "rotate-90",
            )}
          />
        </Button>
        <Input
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="Find in table..."
          className="h-8 min-w-0 flex-1"
          ref={inputRef}
          value={searchQuery}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        <div className="flex shrink-0 items-center gap-1">
          <Button
            aria-label="Previous match"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onPrevMatch}
            onPointerDown={onPrevMatchPointerDown}
            disabled={searchMatches.length === 0}
          >
            <ChevronUp />
          </Button>
          <Button
            aria-label="Next match"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onNextMatch}
            onPointerDown={onNextMatchPointerDown}
            disabled={searchMatches.length === 0}
          >
            <ChevronDown />
          </Button>
          <Button
            aria-label="Close search"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>
      </div>
      {replaceOpen ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="size-7 shrink-0" aria-hidden />
          <Input
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Replace with…"
            className="h-8 min-w-0 flex-1 basis-48"
            ref={replaceInputRef}
            value={replaceQuery}
            onChange={onReplaceQueryChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            aria-label="Replace all"
            title="Replace all"
            disabled={
              readOnly || !searchQuery.trim() || searchMatches.length === 0
            }
            onClick={onReplaceAll}
          >
            <ReplaceAll className="size-4" />
          </Button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-1 text-muted-foreground text-xs">
        {searchMatches.length > 0 ? (
          <span>
            {matchIndex + 1} of {searchMatches.length}
          </span>
        ) : searchQuery ? (
          <span>No results</span>
        ) : replaceOpen ? (
          <span>Enter find text above, then set the replacement</span>
        ) : (
          <span>Type to search</span>
        )}
      </div>
    </div>
  );
}
