# Ask Phill Accelerator (APA)

## What
Shopify theme development using Theme Blocks architecture (Horizon-style).
No build tools. No Tailwind. Pure Liquid, CSS, vanilla JS.

## Why
Automated section building from Figma designs with structured QA and compound learning.

## Global APA System
The APA orchestrator, agents, skills, and knowledge base are installed globally:

```
~/.claude/
  ├── agents/           # apa-planner, apa-coder, apa-qa, apa-docs, apa-compound
  ├── skills/apa/       # Skill definitions (plan, code, qa, docs, compound)
  └── apa/
      ├── orchestrator/ # TypeScript orchestrator
      ├── knowledge/    # Accumulated patterns and learnings
      ├── learnings/    # Per-session learning files
      └── logs/         # Session logs
```

## Project Structure
```
blocks/           # Theme blocks (prefix with _ for private)
sections/         # Section files
snippets/         # Reusable snippets
assets/           # CSS, JS, images
scripts/schema/   # TypeScript schema modules
.claude/
  ├── docs/       # Implementation guides (this repo)
  └── tasks/      # Project-specific task JSON files
```

## Skills (global)
| Skill | When | Location |
|-------|------|----------|
| Plan | New feature or planning phase | `~/.claude/skills/apa/plan/SKILL.md` |
| Code | Implementation phase | `~/.claude/skills/apa/code/SKILL.md` |
| QA | Verification phase | `~/.claude/skills/apa/qa/SKILL.md` |
| Compound | Learning extraction | `~/.claude/skills/apa/compound/SKILL.md` |
| Docs | Documentation phase | `~/.claude/skills/apa/docs/SKILL.md` |

## Phase Flow
```
planning → coding → qa → compound → documentation → review → complete
```

## Current Task
Check `.claude/tasks/` for active task JSON. Read it first.

## Orchestrator Commands
```bash
cd ~/.claude/apa/orchestrator
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
