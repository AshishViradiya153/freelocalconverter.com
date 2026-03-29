import type * as React from "react";

import { cn } from "@/lib/utils";

export const toolHeroTitleClassName =
  "font-semibold text-3xl tracking-tight md:text-4xl";

export const toolSectionHeadingClassName =
  "font-semibold text-lg tracking-tight text-foreground md:text-xl";

function ToolSectionHeading({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"h2">) {
  return (
    <h2 className={cn(toolSectionHeadingClassName, className)} {...props} />
  );
}

function ToolPage({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "container flex flex-col gap-6 py-4 md:gap-8 md:py-6",
        className,
      )}
      {...props}
    />
  );
}

function ToolHero({
  className,
  icon,
  title,
  description,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <header className={cn("flex flex-col gap-2", className)} {...props}>
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="mt-0.5 shrink-0 text-muted-foreground">{icon}</div>
        ) : null}
        <div className="min-w-0">
          <h1 className={toolHeroTitleClassName}>{title}</h1>
          {description ? (
            <p className="mt-2 max-w-4xl text-muted-foreground text-sm leading-relaxed md:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function ToolCard({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm md:p-5",
        className,
      )}
      {...props}
    />
  );
}

function ToolPane({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)} {...props} />
  );
}

function ToolPaneTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "font-medium text-muted-foreground text-xs uppercase tracking-[0.18em]",
        className,
      )}
      {...props}
    />
  );
}

function ToolToolbar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    />
  );
}

function toolEditorClassName(className?: string) {
  return cn(
    "h-[min(32rem,52vh)] min-h-[18rem] max-h-[65vh] resize-y overflow-auto font-mono text-xs leading-5",
    className,
  );
}

export {
  ToolCard,
  ToolHero,
  ToolPage,
  ToolPane,
  ToolPaneTitle,
  ToolSectionHeading,
  ToolToolbar,
  toolEditorClassName,
};
