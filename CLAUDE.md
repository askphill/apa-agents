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
.claude/      # Agent system files
```

## Skills (read when starting a task)
| Skill | When | Location |
|-------|------|----------|
| Plan | New feature or planning phase | `.claude/skills/plan/SKILL.md` |
| Code | Implementation phase | `.claude/skills/code/SKILL.md` |
| QA | Verification phase | `.claude/skills/qa/SKILL.md` |
| Docs | Documentation phase | `.claude/skills/docs/SKILL.md` |

## Current Task
Check `.claude/tasks/` for active task JSON. Read it first.

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
