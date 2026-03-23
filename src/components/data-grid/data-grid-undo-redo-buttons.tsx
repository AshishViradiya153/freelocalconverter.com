"use client";

import { Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataGridUndoRedoButtonsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  className?: string;
}

export function DataGridUndoRedoButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  className,
}: DataGridUndoRedoButtonsProps) {
  return (
    <div
      role="group"
      aria-label="Undo and redo"
      className={cn("flex items-center gap-1", className)}
    >
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="bg-background dark:bg-input/30 dark:hover:bg-input/50"
        aria-label="Undo"
        disabled={!canUndo}
        onClick={onUndo}
      >
        <Undo2 />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="bg-background dark:bg-input/30 dark:hover:bg-input/50"
        aria-label="Redo"
        disabled={!canRedo}
        onClick={onRedo}
      >
        <Redo2 />
      </Button>
    </div>
  );
}
