# Ask Phill Accelerator (APA)

## What
Shopify theme development using Theme Blocks architecture (Horizon-style).
No build tools. No Tailwind. Pure Liquid, CSS, vanilla JS.

## Why
Automated section building from Figma designs with structured QA and compound learning.

## Project Structure
```
blocks/           # Theme blocks (prefix with _ for private)
sections/         # Section files
snippets/         # Reusable snippets
assets/           # CSS, JS, images
scripts/schema/   # TypeScript schema modules
.claude/          # Agent system files
  ├── agents/     # Subagent definitions
  ├── orchestrator/  # TypeScript orchestrator
  ├── skills/     # Skill definitions
  ├── tasks/      # Task JSON files
  ├── knowledge/  # Accumulated learnings
  └── logs/       # Session logs
```

## Skills (read when starting a task)
| Skill | When | Location |
|-------|------|----------|
| Plan | New feature or planning phase | `.claude/skills/plan/SKILL.md` |
| Code | Implementation phase | `.claude/skills/code/SKILL.md` |
| QA | Verification phase | `.claude/skills/qa/SKILL.md` |
| Compound | Learning extraction | `.claude/skills/compound/SKILL.md` |
| Docs | Documentation phase | `.claude/skills/docs/SKILL.md` |

## Phase Flow
```
planning → coding → qa → compound → documentation → review → complete
```

## Current Task
Check `.claude/tasks/` for active task JSON. Read it first.

## Orchestrator Commands
```bash
cd .claude/orchestrator
npm start create "Section Name"     # Create new task
npm start run section-name          # Run orchestration
npm start run section-name --verbose  # With detailed output
```

## Development Commands
```bash
shopify theme dev      # Local server
shopify theme check    # Linting (run before commits)
pnpm schema:apply      # Apply TypeScript schemas
ls blocks/             # Discover existing blocks
```

## Productive.io Integration
If starting from a Productive ticket, use `/productive refine <ticket-id>` to generate a plan.

## Git
Commit after each task. Format: `[task-id] description`

## Block Discovery
Before creating new blocks, always run `ls blocks/` to check for reusable options.
