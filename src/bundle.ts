// Root for minified builds

import { DiffMorph, DMFrame } from "./element/element";
import { HighlightedCode } from "./element/highlight";

if (!window.customElements.get("dm-frame")) {
  window.customElements.define("dm-frame", DMFrame);
}

if (!window.customElements.get("diff-morph")) {
  window.customElements.define("diff-morph", DiffMorph);
}

if (!window.customElements.get("highlighted-code")) {
  window.customElements.define("highlighted-code", HighlightedCode);
}
