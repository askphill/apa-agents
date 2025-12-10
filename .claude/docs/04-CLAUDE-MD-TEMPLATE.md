# APA Agent System - CLAUDE.md Template

## Design Principles

From research:
- Claude Code's system prompt uses ~50 instructions already
- Models can follow ~150-200 instructions reliably
- Less instructions = ALL instructions followed better
- Target: <60 lines
- Use progressive disclosure: point to files, don't embed content

---

## Ready-to-Use CLAUDE.md

Copy this to your repo root:

```markdown
# APA Theme Development

## What
Shopify theme development using Theme Blocks architecture (Horizon-style).
No build tools. No Tailwind. Pure Liquid, CSS, vanilla JS.

## Why
Automated section building from Figma designs with structured QA.

## Project Structure
```
blocks/       # Theme blocks (prefix with _ for private)
sections/     # Section files
snippets/     # Reusable snippets
assets/       # CSS, JS, images
.apa/         # Agent system files
```

## Skills (read when starting a task)
| Skill | When | Location |
|-------|------|----------|
| Plan | New feature or planning phase | `.apa/skills/plan/SKILL.md` |
| Code | Implementation phase | `.apa/skills/code/SKILL.md` |
| QA | Verification phase | `.apa/skills/qa/SKILL.md` |
| Docs | Documentation phase | `.apa/skills/docs/SKILL.md` |

## Patterns (read when coding)
- Schema conventions: `.apa/patterns/schema.md`
- Liquid patterns: `.apa/patterns/liquid.md`
- CSS architecture: `.apa/patterns/css.md`
- JS patterns: `.apa/patterns/js.md`

## Current Task
Check `.apa/tasks/` for active task JSON. Read it first.

## Commands
```bash
shopify theme dev      # Local server
shopify theme check    # Linting (run before commits)
ls blocks/             # Discover existing blocks
```

## Git
Commit after each task. Format: `[task-id] description`

## Block Discovery
Before creating new blocks, always run `ls blocks/` to check for reusable options.
```

---

## What NOT to Put in CLAUDE.md

❌ Don't include:
- Detailed coding conventions (put in pattern docs)
- Full schema examples (put in pattern docs)
- Workflow procedures (put in skill docs)
- One-off instructions (use slash commands)
- Style guidelines (LLMs learn from existing code)

---

## Extending with Slash Commands

For task-specific instructions, create slash commands instead:

`.claude/commands/start-feature.md`:
```markdown
Start a new feature. Read the Plan skill and begin discovery.
Figma URL: $ARGUMENTS
```

`.claude/commands/qa-check.md`:
```markdown
Run QA verification on current task. Read QA skill first.
```

---

## Hooks Configuration

Create `.claude/hooks.json`:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "shopify theme check --path ."
          }
        ]
      }
    ]
  }
}
```

This auto-runs theme check when Claude stops, catching issues early.
