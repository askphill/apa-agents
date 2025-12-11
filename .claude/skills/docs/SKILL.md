# Docs Skill

## Purpose
Generate documentation based on completed feature and its complexity.

## When to Use
- All tasks pass QA
- Task JSON phase is "documentation"

## Prerequisites
- Task JSON with all tasks `passes: true`
- Completed code in repo

## Files to Read
1. `templates/client-docs.liquid` - For merchant-facing docs (always generated)
2. `templates/developer-docs.md` - For dev docs (only if complexity flags set)

## Outputs
- **Always**: Client docs in `assets/apa-docs-[slug].liquid`
- **If complex**: Developer docs in `.claude/docs/features/[slug].md`
- Final git commit
- Minor issues log (if any)

## Process

### 1. Read Task JSON
Check complexity flags:
```json
{
  "complexity_flags": {
    "new_snippets_created": false,
    "metafields_used": false,
    "metaobjects_used": false,
    "custom_js_required": false
  }
}
```

### 2. Generate Client Docs (Always)
Create `assets/apa-docs-[slug].liquid`:
- Section overview
- Available settings explained
- Block types and their purpose
- Tips for merchants
- Presets available

### 3. Generate Developer Docs (If Complex)
Only if ANY complexity flag is true:
- Architecture decisions
- File dependencies
- Metafield/metaobject requirements
- JavaScript component documentation
- Customization notes

### 4. Update Task JSON
- Set phase to "review"
- Add documentation paths to outputs

### 5. Git Commit
```bash
git add assets/apa-docs-[slug].liquid
git add .claude/docs/features/[slug].md  # if created
git commit -m "[docs] Add documentation for [feature-name]"
```

## Documentation Style

### For Merchants (Client Docs)
- Clear, non-technical language
- Focus on "how to use"
- Include practical tips
- Explain what each setting does

### For Developers (Dev Docs)
- Technical accuracy
- Architecture rationale
- Dependencies and requirements
- How to extend or modify
