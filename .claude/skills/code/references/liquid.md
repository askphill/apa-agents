# Liquid Patterns

## Section Structure
Gold standard section: `apa-base/sections/hero.liquid:1-155`

### Standard Section Flow
1. Variable assignments in `{% liquid %}` block
2. Inline `{% stylesheet %}` block
3. HTML structure with render calls
4. `{% schema %}` at end

Reference: `apa-base/sections/hero.liquid`

---

## Utility Snippet Pattern
Settings snippets output class + style separated by `•`.

### Padding
Reference: `apa-base/snippets/padding-settings.liquid:1-12`
```liquid
{% capture padding %}{% render 'padding-settings', settings: section.settings %}{% endcapture %}
{% assign padding = padding | strip_newlines | strip | split: '•' %}
```
Usage: `class="{{ padding[0] }}" style="{{ padding[1] }}"`

### Gap
Reference: `apa-base/snippets/gap-settings.liquid:1-12`
Same pattern as padding.

### Flex
Reference: `apa-base/snippets/flex-class.liquid`
Returns class string directly (no `•` separator).

---

## Block Rendering

### Dynamic blocks
Reference: `apa-base/sections/hero.liquid:152`

### Static blocks
Reference: `apa-base/sections/product-list.liquid:19`

### Passing context to blocks
Reference: `apa-base/sections/product-list.liquid:58`

---

## Snippet Documentation
Use `{%- doc -%}` for snippet documentation.
Reference: `apa-base/snippets/text.liquid:1-8`

---

## Snippet Naming
Use `kebab-case` for all snippet names.
Examples: `padding-settings`, `gap-settings`, `flex-class`, `background-media`

---

## render vs include
Always use `render` (isolated scope). Never `include`.

---

## Empty State Handling
Check for blank content before rendering.
Reference: `apa-base/snippets/text.liquid:113-125`

---

## Attribute Capture Pattern
For complex attribute strings, use capture.
Reference: `apa-base/snippets/text.liquid:105-111`

---

## Class Construction
Build classes using:
- Direct strings
- Render calls for utility snippets
- Conditional additions with `{% if %}`

Reference: `apa-base/sections/hero.liquid:89`, `apa-base/sections/hero.liquid:149`

---

## Whitespace Control
Use `{%-` and `-%}` for whitespace control in logic.
Use `{{-` and `-}}` only when needed.
Reference: `apa-base/snippets/padding-settings.liquid:319-345`
