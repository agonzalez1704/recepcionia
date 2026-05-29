import { describe, it, expect } from "vitest";
import { crearToolRegistry } from "./tool-registry";
import type { ToolDef } from "@/core/ports/ia";

function fakeTool(nombre: string): ToolDef<unknown, unknown> {
  return {
    nombre,
    descripcion: `tool ${nombre}`,
    parametros: { type: "object", properties: {} },
    ejecutar: async () => ({}),
  };
}

describe("ToolRegistry", () => {
  it("registra y obtiene tool", () => {
    const r = crearToolRegistry();
    r.registrar(fakeTool("foo"));
    expect(r.obtener("foo")?.nombre).toBe("foo");
  });

  it("listar devuelve todas las tools", () => {
    const r = crearToolRegistry();
    r.registrar(fakeTool("a"));
    r.registrar(fakeTool("b"));
    r.registrar(fakeTool("c"));
    expect(r.listar().map((t) => t.nombre)).toEqual(["a", "b", "c"]);
  });

  it("obtener devuelve undefined para tool no registrada", () => {
    const r = crearToolRegistry();
    expect(r.obtener("inexistente")).toBeUndefined();
  });

  it("re-registrar misma key sobrescribe", () => {
    const r = crearToolRegistry();
    r.registrar(fakeTool("foo"));
    r.registrar({ ...fakeTool("foo"), descripcion: "nueva" });
    expect(r.obtener("foo")?.descripcion).toBe("nueva");
    expect(r.listar()).toHaveLength(1);
  });
});
