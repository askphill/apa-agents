# Plan Skill

## Purpose
Transform Figma designs and requirements into a structured implementation plan for Shopify theme sections.

## When to Use
- No task JSON exists for this feature
- Task JSON exists but phase is "planning"
- Task JSON phase is "review" (final verification)

## Prerequisites
- Feature name/slug
- Design context (from Figma or description)

## Files to Read
1. `references/discovery.md` - How to gather requirements and interview user
2. `references/design-interpretation.md` - Architecture decisions for blocks/sections
3. `references/planning.md` - How to structure the plan and task breakdown

## Outputs
- Task JSON file at `.claude/tasks/[slug].json`
- All tasks marked `passes: false`
- Acceptance criteria defined

## Process

### Step 1: Determine Workflow Mode
Ask the user how they want to work:

**Option A: Productive.io Integration**
If user has a Productive ticket:
- Use `/productive refine <ticket-id>` for the full workflow
- Productive handles: interview, plan creation, branch, ticket update
- After refinement: read the generated plan file and convert to task JSON

**Option B: Figma + Manual Flow**
If user provides Figma URL:
- Fetch design via MCP (if available) or ask for description
- Run discovery interview (see `discovery.md`)
- Create task JSON manually

**Option C: Description Only**
If user describes what they want:
- Run discovery interview
- Create task JSON based on description

### Step 2: Discovery (if not using Productive)
1. Run discovery questions (interactive with user)
2. Search existing blocks: `ls blocks/`
3. Search existing sections: `ls sections/`
4. Check for reusable presets in existing sections/blocks

### Step 3: Design Interpretation
1. Decide: reuse existing blocks vs create new
2. Decide: static vs dynamic blocks
3. Decide: need new presets in existing sections?
4. Identify schema settings needed
5. Identify data sources (metafields, metaobjects, collections, products)

### Step 4: Create Task Breakdown
1. Order tasks by dependencies
2. Each task = one atomic, committable unit
3. Define acceptance criteria per category

### Step 5: Present Summary
Show plan to user for approval before writing task JSON.

## Integration with Productive

If the user started from `/productive refine`:
1. Look for `PRODUCTIVE_TICKET_TASK_<number>.json` in repo root
2. Read the plan file
3. Convert `implementationSteps` to task JSON format
4. Convert `acceptanceCriteria` to our acceptance criteria format
5. Link task JSON to ticket via `sources.ticket_url`
