import { NextResponse } from "next/server";
import { HttpError } from "./tenant";

export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: { codigo: string; mensaje: string; detalles?: unknown } };

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiOk<T>>({ ok: true, data }, init);
}

export function err(status: number, codigo: string, mensaje: string, detalles?: unknown) {
  return NextResponse.json<ApiErr>(
    { ok: false, error: { codigo, mensaje, detalles } },
    { status },
  );
}

export function manejarError(e: unknown) {
  if (e instanceof HttpError) {
    return err(e.status, e.codigo, e.message, e.detalles);
  }
  console.error("Error no controlado:", e);
  return err(500, "error_interno", "Error inesperado del servidor");
}
