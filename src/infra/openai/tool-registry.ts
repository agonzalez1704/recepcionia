import type { ToolDef, ToolRegistry } from "@/core/ports/ia";

export function crearToolRegistry(): ToolRegistry {
  const tools = new Map<string, ToolDef<unknown, unknown>>();
  return {
    registrar<I, O>(tool: ToolDef<I, O>) {
      tools.set(tool.nombre, tool as unknown as ToolDef<unknown, unknown>);
    },
    listar() {
      return Array.from(tools.values());
    },
    obtener(nombre: string) {
      return tools.get(nombre);
    },
  };
}
