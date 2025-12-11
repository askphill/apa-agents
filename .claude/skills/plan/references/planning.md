# Planning Process

## Task Breakdown Rules

1. **One task = One atomic unit of work**
   - Can be completed in one coding session
   - Results in committable code
   - Has clear verification criteria

2. **Task ordering matters**
   - Dependencies first
   - Schema files before liquid files (if using TypeScript schemas)
   - Blocks before sections that use them
   - Presets added to existing files before new files created

3. **Each task must specify**
   - Files to create/modify
   - What "done" looks like
   - How to verify

## Standard Task Sequence

### For adding presets to existing section/block:
```
1. Analyze existing schema structure
2. Add new preset to schema (TS or JSON)
3. Run pnpm schema:apply (if TS)
4. Test preset in theme editor
```

### For new section with existing blocks:
```
1. Create TypeScript schema file (if chosen)
2. Create section liquid structure
3. Run pnpm schema:apply (if TS)
4. Add section styles
5. Add section JavaScript (if any)
6. Test in theme editor
```

### For new section with new blocks:
```
1. Create private block schemas (if any, TS)
2. Create private block liquid files
3. Create theme block schemas (if any, TS)
4. Create theme block liquid files
5. Run pnpm schema:apply
6. Create section schema (TS)
7. Create section liquid structure
8. Run pnpm schema:apply
9. Add section styles
10. Add section JavaScript (if any)
11. Test in theme editor
```

## Task JSON Location
`.claude/tasks/[slug].json`

See `.claude/docs/03-TASK-JSON-SCHEMA.md` for complete schema.

## Schema Creation Decision

Include in plan which approach:
- **TypeScript schema** → create `scripts/schema/[sections|blocks]/[name].ts`
- **JSON schema** → write directly in liquid file

If TypeScript, document which shared modules to import:
- `layout-settings` - for sections with media/layout options
- `text-settings` - for text blocks
- `padding-settings` - for section spacing
- `gap-settings` - for element spacing
- `media-settings` - for image/video sections

## Preset Planning

If adding presets to existing components, document:
- Which existing file gets the preset
- What settings the preset overrides
- Preset name (use translation key: `t:presets.[name]`)

## Acceptance Criteria Categories

Each feature needs acceptance criteria in these categories:

1. **Visual** - Matches Figma design
2. **Functional** - Interactions work correctly
3. **Content** - All content types render properly
4. **Responsive** - Works at all breakpoints
5. **Accessibility** - WCAG 2.1 AA compliant
6. **Theme Editor** - Settings work correctly, presets selectable
7. **Schema** - `pnpm schema:apply` runs without errors

## Plan Review Checklist

Before presenting plan to user:
- [ ] All discovery questions answered
- [ ] Existing section/block reuse evaluated
- [ ] Preset opportunities identified
- [ ] Schema approach decided (TS vs JSON)
- [ ] Schema modules selected (if TS)
- [ ] Data sources identified (metafields, metaobjects, etc.)
- [ ] Static/dynamic block decisions documented
- [ ] All tasks have clear verification
- [ ] Tasks are properly ordered
- [ ] Acceptance criteria cover all categories
