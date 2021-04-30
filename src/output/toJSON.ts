import { RenderData, RenderDecoration, RenderText } from "../types";

export function toJSON(
  renderObject: RenderData<RenderText, RenderDecoration>
): string {
  return JSON.stringify(renderObject, (key, value) => {
    if (value instanceof Map) {
      return Object.fromEntries(value.entries());
    }
    return value;
  });
}
