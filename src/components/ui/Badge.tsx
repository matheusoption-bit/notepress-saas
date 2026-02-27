import React from "react";
import { cn } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "accent"
  | "outline"
  | "muted";

type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children?: React.ReactNode;
}

// ─── Variantes ────────────────────────────────────────────────────────────────

const variantStyles: Record<BadgeVariant, string> = {
  default: [
    "bg-[--color-background-elevated]",
    "text-[--color-text-secondary]",
    "border border-[--color-border-muted]",
  ].join(" "),

  primary: [
    "bg-[--color-primary-subtle]",
    "text-[--color-primary-hover]",
    "border border-[--color-primary]/20",
  ].join(" "),

  success: [
    "bg-[--color-success-subtle]",
    "text-[--color-success-hover]",
    "border border-[--color-success]/20",
  ].join(" "),

  warning: [
    "bg-[--color-warning-subtle]",
    "text-[--color-warning]",
    "border border-[--color-warning]/20",
  ].join(" "),

  destructive: [
    "bg-[--color-destructive-subtle]",
    "text-[--color-destructive-hover]",
    "border border-[--color-destructive]/20",
  ].join(" "),

  accent: [
    "bg-[--color-accent-subtle]",
    "text-[--color-accent-hover]",
    "border border-[--color-accent]/20",
  ].join(" "),

  outline: [
    "bg-transparent",
    "text-[--color-text-secondary]",
    "border border-[--color-border-muted]",
  ].join(" "),

  muted: [
    "bg-[--color-background-elevated]",
    "text-[--color-text-muted]",
    "border border-transparent",
  ].join(" "),
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "h-4 px-1.5 text-[10px] gap-1",
  md: "h-5 px-2 text-[11px] gap-1.5",
  lg: "h-6 px-2.5 text-xs gap-2",
};

const dotColors: Record<BadgeVariant, string> = {
  default:     "bg-[--color-text-muted]",
  primary:     "bg-[--color-primary]",
  success:     "bg-[--color-success]",
  warning:     "bg-[--color-warning]",
  destructive: "bg-[--color-destructive]",
  accent:      "bg-[--color-accent]",
  outline:     "bg-[--color-text-muted]",
  muted:       "bg-[--color-text-muted]",
};

// ─── Componente ───────────────────────────────────────────────────────────────

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = "default",
      size = "md",
      dot = false,
      className,
      children,
      ...props
    },
    ref
  ) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center",
        "font-medium tracking-wide",
        "rounded-[var(--radius-full)]",
        "whitespace-nowrap",
        "select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "flex-shrink-0 rounded-full",
            size === "sm" ? "w-1 h-1" : "w-1.5 h-1.5",
            dotColors[variant]
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
);

Badge.displayName = "Badge";

export default Badge;
