# Block Patterns

## Block Types

### Public Blocks
Files without `_` prefix. Visible in theme editor block picker.
- Merchant-facing blocks (text, button, image)
- Merchant can add/remove/reorder

Examples: `apa-base/blocks/text.liquid`, `apa-base/blocks/button.liquid`

### Private Blocks
Files prefixed with `_`. NOT visible in theme editor block picker.
- Internal composition patterns
- Rendered via `content_for 'block'`
- Consistent component rendering

Examples: `apa-base/blocks/_product-card.liquid`, `apa-base/blocks/_carousel-navigation.liquid`

### Static Blocks
Blocks marked `"static": true` in presets. Fixed position, cannot be removed.
- Essential section structure
- Merchant can configure but not remove

Preset definition: `apa-base/sections/product-list.liquid:761-768`
Rendering with theme-check disable: `apa-base/sections/product-list.liquid:57-59`

---

## Block Rendering

### content_for 'block' Syntax
Basic usage: `apa-base/sections/product-list.liquid:19`
With closest context: `apa-base/sections/product-list.liquid:58`
Multiple context variables: `apa-base/sections/product-list.liquid:23-24`

### theme-check-disable for Loops
When rendering same static block ID in loop, disable UniqueStaticBlockId.
Reference: `apa-base/sections/product-list.liquid:57-59`

---

## Block Schema Structure

### Tag Property
All blocks use `"tag": null` - parent section handles wrapping.
Reference: `apa-base/blocks/text.liquid:7`

### Nested Blocks
Blocks accept child blocks via `blocks` property.
Reference: `apa-base/blocks/_product-card.liquid:116-144`

---

## Context Passing

### closest Variable
Pass context from parent to child blocks.
- `closest.product` - product context
- `closest.collection` - collection context

Section passing: `apa-base/sections/product-list.liquid:58`
Block receiving: `apa-base/blocks/_product-card.liquid:2`

### content_for 'blocks' (plural)
Renders all child blocks.
Reference: `apa-base/blocks/_product-card.liquid:89`
