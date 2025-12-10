# APA Agent System - Skills Structure

## What Are Skills?

Skills are **organized folders containing procedural knowledge** that Claude loads on demand.

Key principles:
- **Progressive disclosure**: Only metadata visible until skill is activated
- **Self-contained**: Each skill has everything needed for its phase
- **Composable**: Skills can reference other skills and patterns
- **Versionable**: Just folders, work with Git

---

## Skills Directory Structure

```
.apa/skills/
├── plan/
│   ├── SKILL.md                    # Entry point, metadata, when to use
│   ├── discovery.md                # How to gather requirements
│   ├── design-interpretation.md    # Figma → architecture decisions
│   └── planning.md                 # How to create task plans
├── code/
│   ├── SKILL.md
│   └── implementation.md           # Implementation guidelines
├── qa/
│   ├── SKILL.md
│   └── verification.md             # Verification procedures
└── docs/
    ├── SKILL.md
    └── templates/
        ├── client-docs.liquid      # Template for merchant-facing docs
        └── developer-docs.md       # Template for dev docs
```

---

## SKILL.md Template Structure

Each SKILL.md follows this format:

```markdown
# [Skill Name]

## Purpose
[One sentence: what this skill does]

## When to Use
[Conditions that trigger this skill]

## Prerequisites
[What must exist before using this skill]

## Files to Read
[List of files in this skill folder to read]

## Pattern Docs Needed
[Which pattern docs to also load, if any]

## Outputs
[What this skill produces]

## Process
[High-level steps]
```

---

## Plan Skill

### `.apa/skills/plan/SKILL.md`

```markdown
# Plan Skill

## Purpose
Transform Figma designs and requirements into a structured implementation plan.

## When to Use
- No task JSON exists for this feature
- Task JSON exists but phase is "planning"
- Task JSON phase is "review" (final verification)

## Prerequisites
- Figma URL or design context
- Feature name/slug

## Files to Read
1. `discovery.md` - How to gather requirements
2. `design-interpretation.md` - How to make architecture decisions
3. `planning.md` - How to structure the plan

## Pattern Docs Needed
None during planning (patterns are for coding phase)

## Outputs
- Task JSON file at `.apa/tasks/[slug].json`
- All tasks marked `passes: false`
- Acceptance criteria defined

## Process
1. Fetch Figma design via MCP
2. Run discovery questions (interactive with user)
3. Search existing blocks: `ls blocks/`
4. Make design interpretation decisions
5. Create task breakdown
6. Define acceptance criteria
7. Write task JSON
8. Present summary for user approval
```

### `.apa/skills/plan/discovery.md`

```markdown
# Discovery Process

## Required Information to Gather

### From Figma
- Overall section layout and structure
- Content types visible (text, images, products, collections)
- Responsive variations (desktop, tablet, mobile)
- Interactive elements (sliders, accordions, tabs)
- Color/style variations shown

### From User (if not clear from Figma)
- Section name and purpose
- Is this for a specific store or base theme?
- Any existing sections this should match?
- Merchant customization requirements
- Performance considerations

### From Codebase
Run: `ls blocks/` to see existing blocks
For each potential block need, check if similar exists:
- Can existing block be reused as-is?
- Can existing block be extended?
- Must create new block?

## Discovery Output Format

```json
{
  "section_name": "",
  "section_slug": "",
  "purpose": "",
  "figma_observations": {
    "layout": "",
    "content_types": [],
    "responsive_notes": "",
    "interactions": []
  },
  "block_analysis": {
    "existing_reusable": [],
    "existing_extendable": [],
    "new_required": []
  },
  "user_clarifications": []
}
```
```

### `.apa/skills/plan/design-interpretation.md`

```markdown
# Design Interpretation Guide

## Decision Framework

### 1. Block Reuse Check
Before creating ANY new block:
1. Run `ls blocks/` 
2. For each potential block, search for similar functionality
3. Document decision in task JSON

Decision tree:
- Exact match exists → Reuse
- Similar exists, minor changes needed → Evaluate: extend vs new
- Nothing similar → Create new

### 2. Static vs Dynamic Block Decision

**Use STATIC blocks when:**
- Position is fixed (always at top, always at bottom)
- Merchant should NOT remove or reorder
- Content is structural (section header, section footer)
- Only one instance ever exists in section

**Use DYNAMIC blocks when:**
- Merchant controls quantity and order
- Content is repeatable (slides, features, team members)
- Flexibility is needed

**Implementation:**
```liquid
{% comment %} Static {% endcomment %}
{% content_for "block", type: "section-header", id: "header" %}

{% comment %} Dynamic {% endcomment %}
{% content_for 'blocks' %}
```

### 3. Block Targeting Decision

**Use `@theme` when:**
- Section is generic container
- Maximum flexibility needed
- Any block type makes sense

**Use explicit targeting when:**
- Only specific blocks make sense
- Including private blocks (underscore prefix)
- Need controlled set of options

```json
// Flexible
{ "blocks": [{ "type": "@theme" }] }

// Controlled
{ "blocks": [
  { "type": "slide" },
  { "type": "_slideshow-nav" }
]}
```

### 4. Private Block Decision

**Make a block PRIVATE (underscore prefix) when:**
- Only makes sense in specific section context
- Should not appear in general block picker
- Is a sub-component of a larger pattern

Examples:
- `_slide.liquid` - Only for slideshow
- `_accordion-item.liquid` - Only for accordion
- `_product-form-variant.liquid` - Only for product forms

### 5. Standard Settings (Always Include)

Every section MUST have:
```json
{
  "type": "color_scheme",
  "id": "color_scheme",
  "label": "Color scheme",
  "default": "scheme-1"
},
{
  "type": "range",
  "id": "padding_top",
  "label": "Top padding",
  "min": 0,
  "max": 100,
  "step": 4,
  "default": 40,
  "unit": "px"
},
{
  "type": "range",
  "id": "padding_bottom",
  "label": "Bottom padding",
  "min": 0,
  "max": 100,
  "step": 4,
  "default": 40,
  "unit": "px"
}
```

### 6. Figma-to-Schema Translation

| Figma Element | Schema Type | Notes |
|---------------|-------------|-------|
| Text content | `text` or `richtext` | richtext for multi-line |
| Heading | `text` | Often with `info` for hierarchy hint |
| Image | `image_picker` | |
| Product | `product` | |
| Collection | `collection` | |
| Link/Button | `url` + `text` | Two settings combined |
| Icon | `select` | From predefined set |
| Color | `color_scheme` or `color` | Prefer color_scheme |
| Show/hide | `checkbox` | |
| Number | `range` or `number` | range for bounded |
| Options | `select` | For predefined choices |
| Repeated element | Block | Check existing first |

### 7. Questions Checklist

Before completing discovery, ensure answers for:
- [ ] What existing blocks can be reused?
- [ ] What new blocks are needed?
- [ ] Which blocks are static vs dynamic?
- [ ] What block targeting approach?
- [ ] What settings does merchant need?
- [ ] What's the responsive behavior?
- [ ] Are there interactions requiring JS?
- [ ] Are metafields/metaobjects needed?
- [ ] Are new snippets needed?
```

### `.apa/skills/plan/planning.md`

```markdown
# Planning Process

## Task Breakdown Rules

1. **One task = One atomic unit of work**
   - Can be completed in one coding session
   - Results in committable code
   - Has clear verification criteria

2. **Task ordering matters**
   - Dependencies first
   - Shared code before consuming code
   - Blocks before sections that use them

3. **Each task must specify**
   - Files to create/modify
   - What "done" looks like
   - How to verify

## Standard Task Sequence

For a typical section with blocks:

```
1. Create private blocks (if any)
2. Create new theme blocks (if any)
3. Create section liquid structure
4. Create section schema
5. Add section styles
6. Add section JavaScript (if any)
7. Create snippet dependencies (if any)
8. Integration testing
```

## Task JSON Structure

See `03-TASK-JSON-SCHEMA.md` for complete schema.

## Acceptance Criteria Categories

Each feature needs acceptance criteria in these categories:

1. **Visual** - Matches Figma design
2. **Functional** - Interactions work correctly
3. **Content** - All content types render properly
4. **Responsive** - Works at all breakpoints
5. **Accessibility** - WCAG 2.1 AA compliant
6. **SEO** - Semantic HTML, structured data if needed
7. **Performance** - No render-blocking, optimized assets

## Plan Review Checklist

Before presenting plan to user:
- [ ] All discovery questions answered
- [ ] Block reuse decisions documented
- [ ] Static/dynamic decisions documented
- [ ] All tasks have clear verification
- [ ] Tasks are properly ordered
- [ ] Acceptance criteria cover all categories
- [ ] Complexity flags set correctly
```

---

## Code Skill

### `.apa/skills/code/SKILL.md`

```markdown
# Code Skill

## Purpose
Implement one task at a time following APA patterns and conventions.

## When to Use
- Task JSON exists
- Phase is "coding"
- There's a task with `passes: false`

## Prerequisites
- Task JSON with incomplete tasks
- Pattern docs in `.apa/patterns/`

## Files to Read
1. `implementation.md` - Implementation guidelines

## Pattern Docs Needed
Based on task type, load relevant patterns:
- Creating schemas → `patterns/schema.md`
- Writing Liquid → `patterns/liquid.md`
- Writing CSS → `patterns/css.md`
- Writing JS → `patterns/js.md`

## Outputs
- Implemented code for ONE task
- Git commit with task ID
- Updated task JSON

## Process
1. Read task JSON
2. Find first task with `passes: false`
3. Load relevant pattern docs
4. Implement the task
5. Self-verify: Does it render? Basic functionality?
6. Run `shopify theme check`
7. Git commit: `[task-id] description`
8. Update task JSON (set phase to "qa")
```

### `.apa/skills/code/implementation.md`

```markdown
# Implementation Guidelines

## Before Coding

1. Read the specific task from task JSON
2. Load relevant pattern docs
3. Check referenced files in codebase (the task should reference existing patterns)

## During Coding

### File Creation Order
When creating a new block:
1. Create the `.liquid` file
2. Add schema
3. Add styles (inline or reference)
4. Add JS if needed
5. Test renders

When creating a section:
1. Create section liquid with basic structure
2. Add schema settings
3. Add schema blocks configuration
4. Implement block rendering
5. Add styles
6. Add JS if needed

### Code Quality Checklist
Before considering task complete:
- [ ] Code follows patterns in pattern docs
- [ ] No hardcoded strings (use schema settings or translations)
- [ ] Accessible markup (semantic HTML, ARIA where needed)
- [ ] Responsive considerations in CSS
- [ ] `shopify theme check` passes

## After Coding

1. Verify it renders in browser
2. Commit with descriptive message
3. Update task JSON
```

---

## QA Skill

### `.apa/skills/qa/SKILL.md`

```markdown
# QA Skill

## Purpose
Verify implemented code meets acceptance criteria.

## When to Use
- Task JSON phase is "qa"

## Prerequisites
- Code has been committed
- Task JSON has current task info

## Files to Read
1. `verification.md` - Verification procedures

## Pattern Docs Needed
None (QA uses deterministic tools)

## Outputs
- Verification results
- PASS: Task marked `passes: true`
- FAIL: Feedback for code skill

## Process
1. Run `shopify theme check`
2. Visual verification via Chrome DevTools MCP
3. Functional testing
4. Accessibility audit
5. Check against acceptance criteria
6. Record verdict in task JSON
```

### `.apa/skills/qa/verification.md`

```markdown
# Verification Procedures

## Automated Checks

### 1. Theme Check (Required)
```bash
shopify theme check
```
Must pass with no errors. Warnings acceptable but should be reviewed.

### 2. Visual Check (Via Chrome DevTools MCP)
- Load the section in theme editor preview
- Compare against Figma design
- Check at breakpoints: desktop (1440px), tablet (768px), mobile (375px)

## Manual Verification

### 3. Functional Testing
For each interaction defined in acceptance criteria:
- Does it work as specified?
- Edge cases handled?
- Error states handled?

### 4. Accessibility Audit
Check for:
- Semantic HTML structure
- Heading hierarchy
- Alt text on images
- Keyboard navigation
- Color contrast (4.5:1 minimum)
- Focus indicators
- ARIA labels where needed

### 5. Content Verification
- All content types render
- Empty states handled
- Long content handled
- Special characters handled

## Verdict Format

```json
{
  "task_id": "task-1",
  "verdict": "PASS" | "FAIL",
  "checks": {
    "theme_check": { "passed": true, "notes": "" },
    "visual": { "passed": true, "notes": "" },
    "functional": { "passed": true, "notes": "" },
    "accessibility": { "passed": true, "notes": "" },
    "content": { "passed": true, "notes": "" }
  },
  "issues": [],
  "suggestions": []
}
```

## Failure Handling

On FAIL:
1. Document specific issues
2. Provide actionable feedback
3. Increment attempt counter
4. If attempts >= 3, trigger escalation
```

---

## Docs Skill

### `.apa/skills/docs/SKILL.md`

```markdown
# Docs Skill

## Purpose
Generate documentation based on completed feature and complexity.

## When to Use
- All tasks pass
- Phase is "documentation"

## Prerequisites
- Task JSON with all tasks `passes: true`
- Completed code in repo

## Files to Read
1. `templates/client-docs.liquid` - For merchant-facing docs
2. `templates/developer-docs.md` - For dev docs (if complexity flags)

## Pattern Docs Needed
None

## Outputs
- Client docs: `assets/apa-docs-feature-[slug].liquid`
- Developer docs (if needed): `.apa/docs/[slug].md`
- Final git commit
- Minor issues log (if any)

## Process
1. Read task JSON
2. Check complexity flags
3. Generate client docs (always)
4. If complexity flags set, generate developer docs
5. Commit documentation
6. Set phase to "review"
```

### `.apa/skills/docs/templates/client-docs.liquid`

```liquid
{% comment %}
  APA Documentation: [Feature Name]
  Generated: [Date]
  
  This file provides merchant-facing documentation for the [feature] section.
{% endcomment %}

{% comment %} Section Overview {% endcomment %}
{% comment %}
  [Feature Name]
  
  Purpose: [What this section does]
  
  Settings:
  [List of settings and what they control]
  
  Blocks:
  [List of blocks and their purpose]
  
  Tips:
  [Usage tips for merchants]
{% endcomment %}
```

### `.apa/skills/docs/templates/developer-docs.md`

```markdown
# [Feature Name] - Developer Documentation

## Overview
[What this feature does and why it was built this way]

## Files Created
- `sections/[name].liquid`
- `blocks/[name].liquid`
- [etc]

## Architecture Decisions
[Document key decisions and rationale]

## Dependencies
[Any snippets, metafields, metaobjects, or JS required]

## Customization Notes
[How to extend or modify this feature]

## Known Limitations
[Any limitations or edge cases]
```
