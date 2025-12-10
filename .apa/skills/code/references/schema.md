# Schema Conventions

## Schema Root Properties Order
1. `name` - Translation key
2. `tag` - HTML wrapper tag
3. `class` - CSS class(es)
4. `limit` - Max instances
5. `blocks` - Block configuration
6. `disabled_on` - Disabled locations
7. `settings` - Settings array
8. `presets` - Section presets

### Sections
Reference: `apa-base/sections/hero.liquid:157-172`
- `tag`: `"section"` (standard) or `"aside"` (announcement-bar)
- `class`: `"shopify-section"` or `"shopify-section--{name}"`

### Blocks
Reference: `apa-base/blocks/text.liquid:3-7`
- `tag`: Always `null`

### disabled_on
Content sections disable header/footer.
Reference: `apa-base/sections/hero.liquid:170-172`

---

## Setting ID Naming
Use `snake_case` for all setting IDs.
Reference: `apa-base/sections/hero.liquid:175-733`

## Standard Setting Groups (order)
1. Content - collection, product, text
2. Layout - direction, alignment, columns
3. Height - section height options
4. Appearance - color scheme, overlays, backgrounds
5. Spacing - padding with mobile variations

Reference: `apa-base/sections/hero.liquid:173-1258`

---

## Required Settings
Every section needs `color_scheme`.
Reference: `apa-base/sections/hero.liquid:729-734`

## Spacing Settings Pattern
Padding with mobile override checkbox.
Reference: `apa-base/sections/hero.liquid:771-1258`

Pattern:
- `custom_padding_mobile` checkbox gates mobile settings
- Each direction: desktop + custom + mobile + mobile custom
- Options: none, content, xs, s, m, l, xl, xxl, custom
- Mobile uses `inherit_desktop` first

Mobile pattern: `apa-base/sections/hero.liquid:843-886`

## Gap Settings
Same structure as spacing.
Reference: `apa-base/sections/hero.liquid:510-622`

---

## visible_if
Conditional visibility.
Simple: `apa-base/sections/hero.liquid:213-214`
Complex: `apa-base/sections/hero.liquid:267-268`

## Translation Keys
- `t:settings.{name}` - labels
- `t:options.{value}` - options
- `t:names.{name}` - names
- `t:content.{header}` - headers
- `t:info.{key}` - info text
- `t:categories.{cat}` - categories

## Headers for Grouping
Group 4+ related settings.
Reference: `apa-base/sections/hero.liquid:192-193`
Conditional: `apa-base/sections/hero.liquid:244-246`

## Range Settings
- Gap: min 0, max 100, step 1, unit px
- Padding: min 0, max 160, step 2, unit px
- Height: min 200, max 1400, step 50, unit px

Reference: `apa-base/sections/hero.liquid:553-563`

## Presets
Reference: `apa-base/sections/hero.liquid:1260-1340`

## Color Scheme Inheritance
Blocks can inherit or override parent scheme.
Reference: `apa-base/blocks/_product-card.liquid:207-219`
