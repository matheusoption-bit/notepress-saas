import React from "react";
import { cn } from "@/lib/utils";

// ─── Card Root ────────────────────────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adiciona efeito hover de elevação */
  hoverable?: boolean;
  /** Adiciona borda com gradiente sutil */
  gradient?: boolean;
  /** Remove padding interno */
  noPadding?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ hoverable = false, gradient = false, noPadding = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Base
        "rounded-[var(--radius-xl)]",
        "bg-[--color-background-surface]",
        "border border-[--color-border-default]",
        "shadow-[var(--shadow-sm)]",
        // Padding padrão
        !noPadding && "p-5",
        // Hover
        hoverable && [
          "transition-all duration-[var(--transition-normal)]",
          "cursor-pointer",
          "hover:-translate-y-0.5",
          "hover:border-[--color-border-muted]",
          "hover:shadow-[var(--shadow-md)]",
          "hover:bg-[--color-background-elevated]",
        ],
        // Gradiente de borda
        gradient && "border-gradient",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

Card.displayName = "Card";

// ─── Card Header ──────────────────────────────────────────────────────────────

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adiciona linha divisória abaixo */
  divided?: boolean;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ divided = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-1",
        divided && "pb-4 mb-4 border-b border-[--color-border-default]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = "CardHeader";

// ─── Card Title ───────────────────────────────────────────────────────────────

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-base font-semibold tracking-tight",
        "text-[--color-text-primary]",
        "leading-snug",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
);

CardTitle.displayName = "CardTitle";

// ─── Card Description ─────────────────────────────────────────────────────────

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        "text-sm text-[--color-text-secondary] leading-relaxed",
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
);

CardDescription.displayName = "CardDescription";

// ─── Card Content ─────────────────────────────────────────────────────────────

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm text-[--color-text-secondary]", className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardContent.displayName = "CardContent";

// ─── Card Footer ──────────────────────────────────────────────────────────────

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  divided?: boolean;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ divided = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3",
        divided && "pt-4 mt-4 border-t border-[--color-border-default]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = "CardFooter";

// ─── Exports ──────────────────────────────────────────────────────────────────

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;
