import { format, formatRelative, isToday, isYesterday, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatearFecha(date: Date | string, fmt = "PPP p"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt, { locale: es });
}

export function formatearChat(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isToday(d)) return `Hoy ${format(d, "HH:mm", { locale: es })}`;
  if (isYesterday(d)) return `Ayer ${format(d, "HH:mm", { locale: es })}`;
  return format(d, "d MMM HH:mm", { locale: es });
}

export function formatearRelativo(date: Date | string, base = new Date()): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatRelative(d, base, { locale: es });
}
