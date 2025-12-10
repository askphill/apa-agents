# APA Agent System - Pattern Doc Templates

## Overview

These are templates. Fill them in after examining your actual codebase.

Key principles:
- **Pointers not copies**: Use `file:line` references, not code blocks
- **Under 200 lines each**: Agent reads these during coding
- **APA-specific only**: Don't document what Claude already knows

---

## `.apa/patterns/schema.md` Template

```markdown
# Schema Conventions

## Setting ID Naming
[YOUR CONVENTION: snake_case? camelCase?]

Example: See `sections/[example].liquid:XX-XX`

## Standard Setting Groups (in order)
1. Content - [what goes here]
2. Layout - [what goes here]
3. Style - [what goes here]  
4. Spacing - [what goes here]
5. Visibility - [what goes here]

## Required Settings (every section)
Every section MUST include these settings. Reference: `sections/[gold-standard].liquid:XX-XX`

- `color_scheme` (type: color_scheme)
- `padding_top` (range, 0-100, step 4, default 40)
- `padding_bottom` (range, 0-100, step 4, default 40)
- [ADD ANY OTHERS YOU ALWAYS USE]

## Block Schema Patterns

### Accepting all theme blocks
Reference: `sections/[example].liquid:XX-XX`

### Explicit block targeting
Reference: `sections/[example].liquid:XX-XX`

### Static block definition
Reference: `sections/[example].liquid:XX-XX`

## Info Settings (merchant hints)
[YOUR PATTERN FOR ADDING HELPER TEXT]

## Translation Keys
[YOUR t: key naming convention]

## Presets
[YOUR preset naming/structure convention]
```

---

## `.apa/patterns/liquid.md` Template

```markdown
# Liquid Patterns

## Section Structure
Standard section layout reference: `sections/[gold-standard].liquid`

## Block Rendering

### Dynamic blocks
```liquid
{% content_for 'blocks' %}
```
Reference: `sections/[example].liquid:XX`

### Static blocks
```liquid
{% content_for "block", type: "...", id: "..." %}
```
Reference: `sections/[example].liquid:XX`

### Passing data to static blocks
Reference: `sections/[example].liquid:XX-XX`

## Snippet Usage

### When to create snippets
[YOUR CRITERIA]

### Snippet naming convention
[YOUR PATTERN: kebab-case? What prefixes?]

### render vs include
[YOUR PREFERENCE AND WHY]

## Empty State Handling
Reference: `sections/[example].liquid:XX-XX`

## Conditional Rendering
[YOUR PATTERNS FOR show/hide logic]

## Class Naming
[YOUR BEM/utility/other convention]

## Liquid Style
[YOUR PREFERENCES: whitespace control, tag formatting, etc.]
```

---

## `.apa/patterns/css.md` Template

```markdown
# CSS Architecture

## Where Styles Live
[YOUR APPROACH: inline in sections? Separate files? Both?]

## Custom Properties

### Color scheme integration
Reference: `sections/[example].liquid:XX-XX`

### Spacing variables
[YOUR CUSTOM PROPERTIES]

### Typography variables
[YOUR CUSTOM PROPERTIES]

## Breakpoints
[YOUR BREAKPOINT VALUES AND APPROACH]

Reference: `assets/[base-styles].css:XX-XX`

## Component Styling
[YOUR APPROACH: scoped styles? Global utilities?]

## Responsive Patterns
[YOUR MOBILE-FIRST OR DESKTOP-FIRST APPROACH]

## Animation/Transition Standards
[YOUR CONVENTIONS]

## Print Styles
[IF APPLICABLE]
```

---

## `.apa/patterns/js.md` Template

```markdown
# JavaScript Patterns

## Core Principles
- Vanilla JS only (no jQuery)
- [OTHER PRINCIPLES]

## Custom Elements
[IF YOU USE THEM: your patterns]

Reference: `assets/[example].js`

## Event Handling
[YOUR PATTERNS]

## Initialization
[YOUR PATTERN: DOMContentLoaded? Intersection Observer?]

## State Management
[YOUR APPROACH FOR COMPONENT STATE]

## Accessibility in JS
[YOUR PATTERNS FOR FOCUS MANAGEMENT, ARIA UPDATES]

## Error Handling
[YOUR PATTERNS]

## Performance
- [YOUR LAZY LOADING APPROACH]
- [YOUR DEBOUNCE/THROTTLE PATTERNS]
```

---

## `.apa/patterns/design-decisions.md` Template

```markdown
# Design Decision Guide

## Block Reuse Checklist
Before creating ANY new block:
1. Run `ls blocks/`
2. Check for similar functionality
3. Document decision in task JSON

## Static vs Dynamic Decision Matrix

| Scenario | Use Static | Use Dynamic |
|----------|------------|-------------|
| Fixed position element | ✓ | |
| Merchant-orderable content | | ✓ |
| [ADD YOUR SCENARIOS] | | |

## Private Block Criteria
Use underscore prefix (`_name.liquid`) when:
- [YOUR CRITERIA]

Examples in codebase:
- `blocks/_[example].liquid` - [why it's private]

## Targeting Strategy

### Use @theme when:
[YOUR CRITERIA]

### Use explicit targeting when:
[YOUR CRITERIA]

## Standard Settings by Section Type

### Collection sections
[YOUR STANDARD SETTINGS]

### Product sections
[YOUR STANDARD SETTINGS]

### Content sections
[YOUR STANDARD SETTINGS]

## Figma Interpretation

[YOUR SPECIFIC MAPPINGS, e.g.:]
- Auto-layout horizontal → flexbox row
- Auto-layout vertical → flexbox column
- [etc.]
```

---

## How to Fill These In

1. **Identify 2-3 gold standard sections** in your codebase
2. **Extract patterns** from those sections
3. **Add file:line references** to actual code
4. **Keep each doc under 200 lines**
5. **Test with Claude** - does it follow the patterns?

---

## After Filling In

Your `.apa/patterns/` folder should have:

```
.apa/patterns/
├── schema.md           # ~100-150 lines
├── liquid.md           # ~100-150 lines
├── css.md              # ~80-120 lines
├── js.md               # ~60-100 lines
└── design-decisions.md # ~100-150 lines
```

Total: ~500-650 lines of pattern docs, loaded only when coding.
