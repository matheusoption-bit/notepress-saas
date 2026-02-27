import React from "react";
import { cn } from "@/lib/utils";

// ─── Input Root ───────────────────────────────────────────────────────────────

type InputSize = "sm" | "md" | "lg";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: InputSize;
  /** Ícone à esquerda */
  leftElement?: React.ReactNode;
  /** Ícone ou botão à direita */
  rightElement?: React.ReactNode;
  /** Mensagem de erro */
  error?: string;
  /** Label associado (renderizado acima) */
  label?: string;
  /** Texto de apoio abaixo do campo */
  hint?: string;
}

const sizeStyles: Record<InputSize, string> = {
  sm: "h-7 px-2.5 text-xs rounded-[var(--radius-md)]",
  md: "h-9 px-3 text-sm rounded-[var(--radius-lg)]",
  lg: "h-11 px-4 text-base rounded-[var(--radius-xl)]",
};

const sizeIconPadding: Record<InputSize, { left: string; right: string }> = {
  sm: { left: "pl-7",  right: "pr-7"  },
  md: { left: "pl-9",  right: "pr-9"  },
  lg: { left: "pl-11", right: "pr-11" },
};

const sizeIconPos: Record<InputSize, string> = {
  sm: "top-1.5 text-sm",
  md: "top-2 text-base",
  lg: "top-3 text-base",
};

// ─── Componente ───────────────────────────────────────────────────────────────

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = "md",
      leftElement,
      rightElement,
      error,
      label,
      hint,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[--color-text-secondary] select-none"
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative flex items-center">
          {/* Ícone esquerdo */}
          {leftElement && (
            <span
              className={cn(
                "absolute left-3 flex items-center text-[--color-text-muted] pointer-events-none",
                sizeIconPos[size]
              )}
            >
              {leftElement}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              // Base
              "w-full",
              "bg-[--color-background-surface]",
              "text-[--color-text-primary]",
              "placeholder:text-[--color-text-muted]",
              // Borda
              "border",
              error
                ? "border-[--color-destructive]/60 focus:border-[--color-destructive]"
                : "border-[--color-border-muted] focus:border-[--color-border-focus]",
              // Foco
              "outline-none",
              "focus:ring-1",
              error
                ? "focus:ring-[--color-destructive]/30"
                : "focus:ring-[--color-primary]/20",
              // Sombra interna sutil
              "shadow-[var(--shadow-inner)]",
              // Transição
              "transition-all duration-[var(--transition-fast)]",
              // Disabled
              "disabled:opacity-40 disabled:cursor-not-allowed",
              // Tamanho
              sizeStyles[size],
              leftElement && sizeIconPadding[size].left,
              rightElement && sizeIconPadding[size].right,
              className
            )}
            {...props}
          />

          {/* Ícone/elemento direito */}
          {rightElement && (
            <span
              className={cn(
                "absolute right-3 flex items-center text-[--color-text-muted]",
                sizeIconPos[size]
              )}
            >
              {rightElement}
            </span>
          )}
        </div>

        {/* Mensagem de erro */}
        {error && (
          <p className="text-xs text-[--color-destructive] flex items-center gap-1">
            <ErrorIcon />
            {error}
          </p>
        )}

        {/* Hint */}
        {!error && hint && (
          <p className="text-xs text-[--color-text-muted]">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// ─── Ícone interno ────────────────────────────────────────────────────────────

function ErrorIcon() {
  return (
    <svg
      className="h-3 w-3 flex-shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ─── Textarea companion ───────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-medium text-[--color-text-secondary] select-none"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full min-h-[80px]",
            "bg-[--color-background-surface]",
            "text-[--color-text-primary] text-sm",
            "placeholder:text-[--color-text-muted]",
            "border rounded-[var(--radius-lg)]",
            "px-3 py-2",
            error
              ? "border-[--color-destructive]/60 focus:border-[--color-destructive]"
              : "border-[--color-border-muted] focus:border-[--color-border-focus]",
            "outline-none focus:ring-1",
            error
              ? "focus:ring-[--color-destructive]/30"
              : "focus:ring-[--color-primary]/20",
            "shadow-[var(--shadow-inner)]",
            "resize-y",
            "transition-all duration-[var(--transition-fast)]",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />

        {error && (
          <p className="text-xs text-[--color-destructive]">{error}</p>
        )}
        {!error && hint && (
          <p className="text-xs text-[--color-text-muted]">{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Input;
