# Code Skill

## Purpose
Implement APA theme features following established patterns and conventions.

## When to Use
- Task JSON exists with phase "coding"
- There's a task with `passes: false`

## Prerequisites
- Task JSON with incomplete tasks
- Understanding of what to implement

## Files to Read
Based on task type, load relevant references:
1. `references/blocks.md` - Block types, rendering, context passing
2. `references/schema.md` - Schema conventions, settings patterns
3. `references/liquid.md` - Liquid patterns, snippets, structure
4. `references/css.md` - CSS architecture, custom properties, responsive
5. `references/js.md` - JavaScript patterns, custom elements

## Outputs
- Implemented code for ONE task
- Git commit with task ID
- Updated task JSON

## Process
1. Read task JSON
2. Find first task with `passes: false`
3. Load relevant resource docs from this skill
4. Implement following patterns
5. Self-verify: Does it render? Basic functionality?
6. Run `shopify theme check`
7. Git commit: `[task-id] description`
8. Update task JSON (set phase to "qa")
