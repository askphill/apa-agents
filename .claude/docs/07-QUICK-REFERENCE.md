# APA Agent System - Quick Reference

## One-Line Summary
**1 Claude Code agent + 4 skills + pattern docs + task JSON = automated Shopify section building**

---

## The Flow
```
Figma URL → Plan Skill → Task JSON → Code Skill → QA Skill → Docs Skill → PR
                ↑                         ↑
                └── Human approves plan   └── 3 failures = escalate
```

---

## File Locations

| What | Where |
|------|-------|
| Agent config | `CLAUDE.md` (root) |
| Skills | `.apa/skills/[plan\|code\|qa\|docs]/` |
| Patterns | `.apa/patterns/[schema\|liquid\|css\|js].md` |
| Tasks | `.apa/tasks/[slug].json` |
| Hooks | `.claude/hooks.json` |

---

## Context Budget

| Component | Instructions | Notes |
|-----------|-------------|-------|
| Claude Code system | ~50 | Fixed |
| CLAUDE.md | ~30-40 | Keep minimal |
| Active skill | ~50-100 | One at a time |
| Pattern docs | ~100-150 | Only when coding |
| **TOTAL** | ~230-340 | Under ~40% of context |

---

## Key Commands

```bash
shopify theme dev       # Local server
shopify theme check     # Linting (always run)
ls blocks/              # Discover existing blocks
```

---

## Task JSON Phases

```
planning → coding → qa → documentation → review → complete
                    ↑
                    └── (loops on fail, max 3x)
```

---

## Skill Triggers

| Skill | Trigger Condition |
|-------|-------------------|
| Plan | No task JSON OR phase="planning" OR phase="review" |
| Code | phase="coding" AND has task with passes=false |
| QA | phase="qa" |
| Docs | phase="documentation" |

---

## Block Types (Theme Blocks/Horizon)

| Type | File | Targeting |
|------|------|-----------|
| Regular | `blocks/name.liquid` | Available via `@theme` |
| Private | `blocks/_name.liquid` | Must explicitly target |
| Static | Any | Via `{% content_for "block" %}` |

---

## Required Section Settings

Every section needs:
- `color_scheme` (type: color_scheme)
- `padding_top` (range: 0-100, step: 4, default: 40)
- `padding_bottom` (range: 0-100, step: 4, default: 40)

---

## Principles (memorize these)

1. **Less instructions = better** (all get ignored as count rises)
2. **Pointers not copies** (file:line references)
3. **JSON not markdown** (for task state)
4. **Deterministic first** (theme check, not Claude)
5. **Review plans, not code** (highest leverage)
6. **Code is regenerable** (plan is the artifact)
7. **3 strikes = escalate** (don't spin forever)

---

## Next Actions

1. [ ] Copy handover files to local machine
2. [ ] Open Claude Code in apa-base directory
3. [ ] Show Claude the repo structure
4. [ ] Identify 2-3 gold standard sections
5. [ ] Fill in pattern doc templates
6. [ ] Create CLAUDE.md from template
7. [ ] Test with a simple section
