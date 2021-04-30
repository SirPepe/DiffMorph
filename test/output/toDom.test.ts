import { diff } from "../../src/lib/diff";
import { toRenderData } from "../../src/lib/render";
import { toDom } from "../../src/output/toDom";
import { process } from "../helpers";

describe("toDom", () => {
  test("renders tokens to DOM", () => {
    const renderData = toRenderData(
      process("json")(
        ["{}"],
        ["  {}"],
        ["    {\n}"],
      )
    );
    const [el, maxWidth, maxHeight] = toDom(renderData);
    expect(maxWidth).toBe(5);
    expect(maxHeight).toBe(2);
    const renderTokens = el.querySelector("pre > .language-json")?.children;
    expect(renderTokens?.length).toBe(2);
    const [a, b] = Array.from(renderTokens as any);
    expect(a).toMatchObject({ tagName: "SPAN", innerHTML: "{" });
    expect(b).toMatchObject({ tagName: "SPAN", innerHTML: "}" });
  });

  test("renders tokens in boxes to DOM", () => {
    const keyframes = toRenderData(
      process("json")(
        [
          "[]"
        ],
        [
          "[",
          {
            content: ["null"],
            hash: "asdf",
            id: "asdf1",
            isDecoration: false,
            language: undefined,
            data: { id: "hello" },
          },
          "]"
        ]
      ),
    );
    const [el, maxWidth, maxHeight] = toDom(keyframes);
    expect(maxWidth).toBe(6);
    expect(maxHeight).toBe(1);
    const renderTokens = el.querySelector("pre > .language-json")?.children;
    expect(renderTokens?.length).toBe(3);
    const [a, b, c] = Array.from(renderTokens as any);
    expect(a).toMatchObject({ tagName: "SPAN", innerHTML: "[" });
    expect(b).toMatchObject({ tagName: "SPAN", innerHTML: "]" });
    expect(c).toMatchObject({ className: expect.stringContaining("asdf1") });
    expect(c).toMatchObject({ className: expect.stringContaining("dm-box") });
    expect(c.children.length).toBe(1);
    expect(c.children[0]).toMatchObject({ tagName: "SPAN", innerHTML: "null" });
  });
});
