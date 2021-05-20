# DiffMorph

## <diff-morph>

Example:

```html
<diff-morph class="language-json" controls>
  <dm-frame>{}</dm-frame>
  <dm-frame>{ "hello": 42 }</dm-frame>
  <dm-frame>{ "hello": 42, "world": 42 }</dm-frame>
  <dm-frame>{ "hello": <mark>42</mark>, "world": 42 }</dm-frame>
</diff-morph>
```

### Attributes

* **`class`** must contain the programming languages as `language-whatever`
  (eg. `language-javascriptclass`)
* **`controls`** changes whether the element shows a toolbar with controls

### Custom Properties

* **`--dm-transition-time`** controls the transition duration for animations.
  Defaults to `500ms`

## Language support

### Tier 1

Languages in Tier 1 are priority languages with the best support that DiffMorph
can possibly deliver:

* **JSON:** regular old JSON
* **JSONC:** JSON with optional line and block comments
* **HTML:** any flavour of HTML (except XHTML; use XML for XHTML) with support
  for embedded CSS and JavaScript
* **XML:** XML (with namespaces, CDATA sections, xml declarations and more)

### Tier 2

Languages in Tier 2 are somewhat supported by DiffMorph and should work well
enough for most use cases. This list includes several "languages" that are
themselves not very well defined (eg. CLI syntax)

* **TOML:** [Tom's Obvious Minimal Language](https://toml.io/en/) v.1.0.0

### Tier 3
