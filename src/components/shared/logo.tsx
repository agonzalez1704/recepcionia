import { cn } from "@/lib/utils";

/**
 * Marca GastroCare: dos swooshes entrelazados con gradiente navy → cian,
 * reconstruidos en SVG (no depende de un archivo de imagen).
 */
export function LogoMark({ className }: { className?: string }) {
  const id = "gc";
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden role="img">
      <defs>
        <linearGradient id={`${id}-a`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#182C61" />
          <stop offset="55%" stopColor="#1C6AC0" />
          <stop offset="100%" stopColor="#2BA9E0" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#1D3A7D" />
          <stop offset="50%" stopColor="#2387D4" />
          <stop offset="100%" stopColor="#4BC4F2" />
        </linearGradient>
      </defs>
      {/* Blade superior */}
      <path
        fill={`url(#${id}-a)`}
        d="M50 7c20 0 35 13 35 30 0 11-7 19-18 19-8 0-13-4-13-10 0-5 3-8 8-9 4-1 7 0 9 2-1-9-9-15-21-15-7 0-13 2-18 6 6-14 18-23 31-23z"
      />
      {/* Blade inferior (espejo) */}
      <path
        fill={`url(#${id}-b)`}
        d="M50 93c-20 0-35-13-35-30 0-11 7-19 18-19 8 0 13 4 13 10 0 5-3 8-8 9-4 1-7 0-9-2 1 9 9 15 21 15 7 0 13-2 18-6-6 14-18 23-31 23z"
      />
    </svg>
  );
}

type LogoProps = {
  variant?: "full" | "word" | "mark";
  className?: string;
  /** Texto del wordmark en blanco (para fondos oscuros como el sidebar). */
  inverted?: boolean;
};

export function Logo({ variant = "word", className, inverted = false }: LogoProps) {
  if (variant === "mark") {
    return <LogoMark className={cn("h-9 w-9", className)} />;
  }
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="h-9 w-9 shrink-0" />
      <div className="leading-none">
        <div className="flex items-baseline font-sans text-[19px] font-bold tracking-tight">
          <span className={inverted ? "text-white" : "text-brand-900"}>Gastro</span>
          <span className={inverted ? "text-cielo-400" : "text-brand-500"}>Care</span>
        </div>
        {variant === "full" && (
          <p
            className={cn(
              "mt-1 text-[10px] font-medium uppercase tracking-[0.18em]",
              inverted ? "text-white/55" : "text-brand-600/70",
            )}
          >
            Salud digestiva integral
          </p>
        )}
      </div>
    </div>
  );
}
