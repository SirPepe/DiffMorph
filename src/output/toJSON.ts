import { RenderData } from "../types";

export function toJSON(renderObject: RenderData): string {
  return JSON.stringify(renderObject, (key, value) => {
    if (value instanceof Map) {
      return Object.fromEntries(value.entries());
    }
    return value;
  });
}
