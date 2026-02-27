import React from "react";
import { cn } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Direção da linha */
  orientation?: "horizontal" | "vertical";
  /** Texto central opcional */
  label?: string;
  /** Variante visual */
  variant?: "default" | "muted" | "gradient";
  /** Espaçamento vertical (apenas horizontal) */
  spacing?: "sm" | "md" | "lg";
}

const spacingMap = {
  sm: "my-3",
  md: "my-5",
  lg: "my-8",
};

// ─── Componente ───────────────────────────────────────────────────────────────

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  (
    {
      orientation = "horizontal",
      label,
      variant = "default",
      spacing = "md",
      className,
      ...props
    },
    ref
  ) => {
    // ── Linha estilizada ────────────────────────────────────────────────────
    const lineClass = cn(
      "flex-1",
      variant === "default"  && "border-t border-[--color-border-default]",
      variant === "muted"    && "border-t border-[--color-border-default]/50",
      variant === "gradient" && "h-px bg-gradient-to-r from-transparent via-[--color-border-muted] to-transparent border-0"
    );

    // ── Vertical ──────────────────────────────────────────────────────────
    if (orientation === "vertical") {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="vertical"
          className={cn(
            "inline-flex self-stretch",
            variant === "default" && "border-l border-[--color-border-default]",
            variant === "muted"   && "border-l border-[--color-border-default]/50",
            variant === "gradient" && [
              "w-px bg-gradient-to-b from-transparent via-[--color-border-muted] to-transparent border-0",
            ],
            className
          )}
          {...props}
        />
      );
    }

    // ── Horizontal com label ──────────────────────────────────────────────
    if (label) {
      return (
        <div
          ref={ref}
          role="separator"
          aria-orientation="horizontal"
          className={cn(
            "flex items-center gap-3",
            spacingMap[spacing],
            className
          )}
          {...props}
        >
          <span className={lineClass} />
          <span className="text-[11px] font-medium tracking-wider uppercase text-[--color-text-muted] whitespace-nowrap select-none">
            {label}
          </span>
          <span className={lineClass} />
        </div>
      );
    }

    // ── Horizontal simples ────────────────────────────────────────────────
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="horizontal"
        className={cn(
          spacingMap[spacing],
          variant !== "gradient"
            ? cn("border-t", variant === "default"
                ? "border-[--color-border-default]"
                : "border-[--color-border-default]/50"
              )
            : "h-px bg-gradient-to-r from-transparent via-[--color-border-muted] to-transparent",
          className
        )}
        {...props}
      />
    );
  }
);

Separator.displayName = "Separator";

export default Separator;
