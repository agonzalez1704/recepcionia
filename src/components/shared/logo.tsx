import Image from "next/image";
import { cn } from "@/lib/utils";

// Logo oficial GastroCare. Guardar el PNG en: public/logo-gastrocare.png
const LOGO_SRC = "/logo-gastrocare.png";
const LOGO_W = 744;
const LOGO_H = 248;

type LogoProps = {
  /** Alto en px del logo (el ancho se ajusta solo). Default 36. */
  height?: number;
  className?: string;
  /**
   * Para fondos oscuros (sidebar navy): el wordmark del PNG es oscuro, así que
   * lo montamos sobre un chip blanco para que sea legible.
   */
  chip?: boolean;
  priority?: boolean;
};

export function Logo({ height = 36, className, chip = false, priority = false }: LogoProps) {
  const img = (
    <Image
      src={LOGO_SRC}
      alt="GastroCare — Salud digestiva integral"
      width={LOGO_W}
      height={LOGO_H}
      priority={priority}
      style={{ height, width: "auto" }}
      className="select-none"
    />
  );

  if (chip) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-xl bg-white px-3 py-2 shadow-sm",
          className,
        )}
      >
        {img}
      </span>
    );
  }
  return <span className={cn("inline-flex items-center", className)}>{img}</span>;
}
