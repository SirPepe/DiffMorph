import { diff } from "../../src/lib/diff";
import { languageDefinition } from "../../src/languages/json";
import { toRenderData } from "../../src/lib/render";
import { toDom } from "../../src/output/toDom";
import { lang } from "../helpers";
const json = lang(languageDefinition);

describe("toDom", () => {
  test("renders tokens to DOM", () => {
    const renderData = toRenderData(
      diff([json("{}"), json("  {}"), json("    {\n}")])
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

  test.skip("renders tokens in boxes to DOM", () => {
    const keyframes = toRenderData(
      diff([
        json("[]"),
        json(
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
        ),
      ])
    );
    const [element, maxWidth, maxHeight] = toDom(keyframes);
    // console.log(element.children[0].outerHTML)
    expect(maxWidth).toBe(6);
    expect(maxHeight).toBe(1);
  });
});
