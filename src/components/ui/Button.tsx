import React from "react";
import { cn } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "success"
  | "outline"
  | "link";

type ButtonSize = "xs" | "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

// ─── Variantes ────────────────────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "bg-[--color-primary] text-white",
    "hover:bg-[--color-primary-hover]",
    "active:bg-[--color-primary-active]",
    "shadow-[0_0_0_0_transparent]",
    "hover:shadow-[var(--shadow-glow-primary)]",
    "border border-[--color-primary]/30",
  ].join(" "),

  secondary: [
    "bg-[--color-background-elevated] text-[--color-text-primary]",
    "hover:bg-[--color-border-muted]",
    "border border-[--color-border-muted]",
    "hover:border-[--color-border-focus]/40",
  ].join(" "),

  ghost: [
    "bg-transparent text-[--color-text-secondary]",
    "hover:bg-[--color-background-elevated]",
    "hover:text-[--color-text-primary]",
    "border border-transparent",
  ].join(" "),

  destructive: [
    "bg-[--color-destructive] text-white",
    "hover:bg-[--color-destructive-hover]",
    "border border-[--color-destructive]/30",
    "hover:shadow-[0_0_16px_0_rgb(239_68_68_/_0.3)]",
  ].join(" "),

  success: [
    "bg-[--color-success] text-white",
    "hover:bg-[--color-success-hover]",
    "border border-[--color-success]/30",
    "hover:shadow-[var(--shadow-glow-success)]",
  ].join(" "),

  outline: [
    "bg-transparent text-[--color-primary]",
    "border border-[--color-primary]/50",
    "hover:bg-[--color-primary-subtle]",
    "hover:border-[--color-primary]",
    "hover:text-[--color-primary-hover]",
  ].join(" "),

  link: [
    "bg-transparent text-[--color-primary]",
    "hover:text-[--color-primary-hover]",
    "underline-offset-4 hover:underline",
    "border border-transparent",
    "p-0 h-auto",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "h-6 px-2.5 text-[11px] gap-1.5 rounded-[var(--radius-sm)]",
  sm: "h-7 px-3 text-xs gap-1.5 rounded-[var(--radius-md)]",
  md: "h-9 px-4 text-sm gap-2 rounded-[var(--radius-lg)]",
  lg: "h-11 px-6 text-base gap-2.5 rounded-[var(--radius-xl)]",
  icon: "h-9 w-9 p-0 rounded-[var(--radius-lg)]",
};

// ─── Componente ───────────────────────────────────────────────────────────────

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base
          "inline-flex items-center justify-center",
          "font-medium select-none",
          "transition-all duration-[var(--transition-fast)]",
          "focus-visible:outline-2 focus-visible:outline-[--color-border-focus] focus-visible:outline-offset-2",
          "cursor-pointer",
          // Disabled
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
          // Variante + tamanho
          variantStyles[variant],
          variant !== "link" && sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <SpinnerIcon className={cn("animate-spin", children ? "mr-2" : "")} />
            {children}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="flex items-center">{leftIcon}</span>
            )}
            {children}
            {rightIcon && (
              <span className="flex items-center">{rightIcon}</span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

// ─── Ícone de loading interno ─────────────────────────────────────────────────

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default Button;
