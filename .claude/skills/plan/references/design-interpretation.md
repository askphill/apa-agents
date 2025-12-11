# Design Interpretation Guide

## Decision Framework

### 1. Existing Section/Block Check (FIRST!)

Before creating ANY new section or block, search what exists:

```bash
# List all sections and blocks
ls sections/
ls blocks/

# Search for similar functionality
grep -r "collection" sections/ blocks/ --include="*.liquid" -l
grep -r "product" sections/ blocks/ --include="*.liquid" -l

# Check existing schema files
ls scripts/schema/sections/
ls scripts/schema/blocks/
```

**Decision tree:**
- Existing section + existing preset works → **Use as-is**
- Existing section + new preset needed → **Add preset to existing section**
- Existing block + new preset needed → **Add preset to existing block**
- No similar exists → **Create new section/block**

### 2. Preset Analysis

Before creating new components, ask:
- Can an existing section preset cover this?
- Does an existing block need a new preset for this use case?
- Would adding presets be simpler than creating new files?

**Prompt the user:**
```
I found similar existing components:
- sections/product-list.liquid - could a new preset work?
- blocks/_product-card.liquid - already supports grid/list layouts

Would you prefer to:
1. Add a new preset to an existing section
2. Add a new preset to an existing block
3. Create entirely new components
```

### 3. Static vs Dynamic Block Decision

**Use STATIC blocks when:**
- Position is fixed (always at top, always at bottom)
- Merchant should NOT remove or reorder
- Content is structural (section header, section footer)
- Only one instance ever exists in section

**Use DYNAMIC blocks when:**
- Merchant controls quantity and order
- Content is repeatable (slides, features, team members)
- Flexibility is needed

### 4. Block Targeting Decision

**Use `@theme` when:**
- Section is generic container
- Maximum flexibility needed

**Use explicit targeting when:**
- Only specific blocks make sense
- Including private blocks (underscore prefix)

### 5. Private Block Decision

**Make a block PRIVATE (underscore prefix) when:**
- Only makes sense in specific section context
- Should not appear in general block picker
- Receives context from parent (via `closest`)

---

## Schema Settings Selection

### Prompt User for Schema Modules

Ask the user which schema setting groups they need:

```
Which schema setting groups does this section need?

LAYOUT & STRUCTURE:
[ ] layout-settings - Direction, alignment, gap, height, width
[ ] width-settings - Container width options
[ ] media-settings - Image/video with overlay options

CONTENT:
[ ] text-settings - Rich text with typography controls
[ ] product-grid-settings - Product list/grid options

SPACING:
[ ] padding-settings - Section padding with mobile overrides
[ ] gap-settings - Gap between elements

APPEARANCE:
[ ] color_scheme - Color scheme picker (almost always needed)
[ ] transparent_background - For overlay sections

Which do you need? (comma-separated or "all standard")
```

### Save Schema Preferences

After user selects, save their preferences to `.claude/preferences/schema-defaults.json`:

```json
{
  "last_used": ["layout-settings", "padding-settings", "color_scheme"],
  "section_defaults": {
    "hero": ["layout-settings", "media-settings", "padding-settings"],
    "product-grid": ["product-grid-settings", "padding-settings"]
  },
  "block_defaults": {
    "text": ["text-settings"],
    "button": ["width-settings"]
  }
}
```

### Available Shared Schema Modules

Location: `scripts/schema/shared/`

| Module | What it provides |
|--------|------------------|
| `layout-settings.ts` | Direction, alignment (h/v), gap, height, width, color scheme, media overlay, padding |
| `media-settings.ts` | Image/video with overlay, object-fit, mobile alternatives |
| `text-settings.ts` | Rich text, typography (preset, size, weight, spacing, transform), colors |
| `product-grid-settings.ts` | Product grid/list specific settings |
| `width-settings.ts` | Content width options |

### Snippets with Schema (auto-imported by shared modules)

| Snippet | What it provides |
|---------|------------------|
| `padding-settings` | Full padding control with mobile overrides |
| `gap-settings` | Gap control with mobile overrides |

---

## Schema Creation Workflow

### Ask: TypeScript or JSON?

```
How would you like to create the schema?

1. **TypeScript** (recommended) - Create scripts/schema/[sections|blocks]/[name].ts
   - Composable with shared modules
   - Type-safe
   - Auto-applies via `pnpm schema:apply`

2. **JSON only** - Write schema directly in liquid file
   - Simpler for small schemas
   - No reusable modules
```

### If TypeScript Selected

1. Create the schema file:
```typescript
// scripts/schema/sections/featured-collection.ts
import layoutSettings from '../shared/layout-settings';
import paddingSettings from '../snippets/padding-settings';

export default {
  settings: [
    {
      type: 'collection',
      id: 'collection',
      label: 't:settings.collection',
    },
    ...layoutSettings({ content_direction: 'column' }),
    ...paddingSettings(),
  ],
};
```

2. Run schema apply:
```bash
pnpm schema:apply
```

---

## Data Source Decisions

### Prompt User for Data Sources

```
Where does the content come from?

SHOPIFY OBJECTS:
[ ] collection - Collection picker
[ ] product - Single product picker
[ ] product_list - Multiple products picker

CUSTOM DATA:
[ ] metafields - Extended product/collection data (which namespace?)
[ ] metaobjects - Structured content types (which type?)

STATIC CONTENT:
[ ] text/richtext - Merchant enters in theme editor
[ ] image_picker - Image upload
[ ] url - Link picker

Which sources? (I'll help you plan the schema)
```

### Metafield/Metaobject Planning

If user selects metafields or metaobjects, ask:

```
For metafields:
- What namespace? (e.g., "custom", "product")
- What key? (e.g., "features", "sizing_info")
- What type? (single_line_text, multi_line_text, list.*, etc.)

For metaobjects:
- What type? (e.g., "team_member", "faq", "testimonial")
- Is it already created in Shopify admin?
- What fields does it have?
```

---

## Figma-to-Architecture Translation

| Figma Pattern | Architecture Decision |
|---------------|----------------------|
| Repeated similar elements | Blocks (check if existing works) |
| Fixed header/footer in section | Static block |
| Grid of products | Dynamic blocks OR direct render |
| Sidebar + content | CSS grid, not separate sections |
| Tabs/Accordion | JS component with blocks as content |
| Carousel/Slider | JS component with slide blocks |
| Filters | Dedicated block or snippet |

---

## Questions to Resolve Before Planning

- [ ] Can an existing section handle this with a new preset?
- [ ] Can existing blocks be reused (with or without new presets)?
- [ ] Which schema modules are needed?
- [ ] Should schema be TypeScript or JSON?
- [ ] What's static vs dynamic content?
- [ ] Where does data come from (editor, metafields, metaobjects)?
- [ ] Which blocks need `closest` context passing?
- [ ] Does this need custom JavaScript?
