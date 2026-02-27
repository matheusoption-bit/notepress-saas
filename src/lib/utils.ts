/**
 * Utilitário de merge de classes CSS.
 * Combina clsx-like conditional classes sem dependências externas.
 * Compatible com Tailwind v4.
 */

type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[];

function toVal(mix: ClassValue): string {
  if (typeof mix === "string" || typeof mix === "number") return String(mix);
  if (Array.isArray(mix)) return mix.map(toVal).filter(Boolean).join(" ");
  return "";
}

/**
 * Junta classes condicionalmente, ignorando falsy values.
 * Uso: cn("base", condition && "conditional", "always")
 */
export function cn(...inputs: ClassValue[]): string {
  return inputs.map(toVal).filter(Boolean).join(" ");
}
