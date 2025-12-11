# Discovery Process

## Starting the Interview

First, ask the user which workflow they prefer:

```
How would you like to approach this feature?

1. **Productive ticket** - I have a ticket ID, use /productive refine
2. **Figma design** - I have a Figma URL/screenshot
3. **Description** - I'll describe what I need

(If you have both a ticket AND Figma, start with the ticket - we can add the Figma link during refinement)
```

---

## Required Information to Gather

### From Figma (if provided)
- Overall section layout and structure
- Content types visible (text, images, products, collections)
- Responsive variations (desktop, tablet, mobile)
- Interactive elements (sliders, accordions, tabs, filters)
- Color/style variations shown
- Number of variations/states

### From User (always ask these)
1. **Purpose**: What is this section for? What problem does it solve?
2. **Content source**: Where does the data come from?
   - Static (merchant enters in theme editor)
   - Dynamic (collection, products, metafields, metaobjects)
   - Mixed
3. **Merchant control**: What should merchants be able to customize?
4. **Existing patterns**: Should this match any existing section's style/behavior?
5. **Presets**: Should this have multiple presets for different use cases?

### From Codebase (always check)
```bash
# Check existing blocks
ls blocks/

# Check existing sections for similar patterns
ls sections/

# Search for similar functionality
grep -r "similar-keyword" sections/ blocks/
```

For each potential component need:
- Can existing block be reused as-is?
- Can existing section preset cover this use case?
- Is there an existing block that needs a new preset?
- Must create entirely new block/section?

---

## Key Questions Checklist

### Content & Data Sources
- [ ] What content types are displayed? (text, images, products, collections, etc.)
- [ ] Where does the data come from? (theme editor, metafields, metaobjects, API)
- [ ] Are metafields/metaobjects needed? Which ones?
- [ ] Is this for a specific product/collection or generic?

### Schema & Settings
- [ ] What merchant controls are needed?
- [ ] What are sensible defaults?
- [ ] Should there be multiple presets?
- [ ] Are there conditional settings (show X only when Y is enabled)?

### Layout & Responsive
- [ ] What's the desktop layout?
- [ ] How does it change on tablet/mobile?
- [ ] Is there a mobile-specific design or just responsive scaling?

### Interactions & Behavior
- [ ] Are there interactive behaviors? (sliders, tabs, accordions, filters)
- [ ] Does it need JavaScript?
- [ ] Are there loading states or empty states to handle?

### Reuse & Presets
- [ ] Can an existing section with a new preset work?
- [ ] Can existing blocks be reused?
- [ ] Should new blocks also work in other sections (@theme)?

---

## Discovery Output Format

```json
{
  "workflow_mode": "productive|figma|description",
  "ticket_id": "15118555",
  "figma_url": "https://figma.com/...",

  "section_name": "Featured Collection Grid",
  "section_slug": "featured-collection-grid",
  "purpose": "Display products from a selected collection in a customizable grid",

  "data_sources": {
    "primary": "collection",
    "metafields": [],
    "metaobjects": [],
    "static_content": ["heading", "subheading", "button_text"]
  },

  "figma_observations": {
    "layout": "4-column grid on desktop, 2 on tablet, 1 on mobile",
    "content_types": ["product_card", "heading", "button"],
    "responsive_notes": "Grid collapses, product cards stack",
    "interactions": ["hover_state", "quick_add"],
    "variations": ["with_filters", "without_filters"]
  },

  "block_analysis": {
    "existing_reusable": [
      { "name": "text", "reason": "Standard heading block" }
    ],
    "existing_with_new_preset": [
      { "name": "_product-card", "preset_needed": "grid-variant", "reason": "Need different layout for grid" }
    ],
    "new_required": [
      { "name": "_collection-filters", "reason": "Filtering UI specific to this section" }
    ]
  },

  "preset_analysis": {
    "existing_section_works": false,
    "needs_new_presets": true,
    "preset_ideas": [
      { "name": "Grid - 4 columns", "use_case": "Standard product grid" },
      { "name": "Grid - With Filters", "use_case": "Filterable collection" }
    ]
  },

  "schema_settings_needed": [
    { "id": "collection", "type": "collection", "purpose": "Select which collection to display" },
    { "id": "products_per_row", "type": "range", "purpose": "Control grid columns" },
    { "id": "show_filters", "type": "checkbox", "purpose": "Toggle filter sidebar" },
    { "id": "quick_add_enabled", "type": "checkbox", "purpose": "Enable quick add to cart" }
  ],

  "user_clarifications": [
    { "question": "Should filters persist in URL?", "answer": "Yes, for sharing" },
    { "question": "Max products to show?", "answer": "12 with load more" }
  ]
}
```

---

## Interview Flow Example

```
Claude: "What kind of section are you building?"

User: "A product grid that shows products from a collection with filters"

Claude: "Great! Let me ask a few questions:

1. **Data source**: Should the merchant pick the collection in theme editor, or is this for a specific collection template?

2. **Filtering**: What should users filter by? (price, type, vendor, tags, metafields?)

3. **Product cards**: Should these use the existing _product-card block or need custom layout?

4. **Presets**: Do you want multiple presets like 'Grid Only' and 'Grid with Filters'?

5. **Existing patterns**: Any existing section this should match in style?"

[Continue based on answers...]
```
