# APA Agent System - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                                │
│              (TypeScript on Claude Code SDK)                     │
│                                                                  │
│   • Reads task JSON to determine current phase                   │
│   • Instructs agent which skill to load                          │
│   • Manages phase transitions                                    │
│   • Handles escalation after 3 QA failures                       │
│   • Controls context (fresh session per phase if needed)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLAUDE CODE SDK                             │
│                   (single agent runtime)                         │
│                                                                  │
│   • Loads CLAUDE.md automatically (minimal, ~40 lines)           │
│   • Agent reads skills when instructed                           │
│   • Uses MCP servers for external connectivity                   │
│   • Executes commands, edits files, git commits                  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │   MCP:   │   │   MCP:   │   │   MCP:   │
        │  Figma   │   │  Chrome  │   │   Git    │
        │          │   │ DevTools │   │          │
        └──────────┘   └──────────┘   └──────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      KNOWLEDGE LAYER                             │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    SKILLS LIBRARY                        │   │
│   │   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │   │
│   │   │  PLAN  │ │  CODE  │ │   QA   │ │  DOCS  │          │   │
│   │   │ SKILL  │ │ SKILL  │ │ SKILL  │ │ SKILL  │          │   │
│   │   └────────┘ └────────┘ └────────┘ └────────┘          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   PATTERN DOCS                           │   │
│   │   schema.md │ liquid.md │ css.md │ js.md                │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    TASK JSON                             │   │
│   │            (persistent state across contexts)            │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Four Skills

### 1. PLAN SKILL
**When**: Start of new feature, no task JSON exists or phase is "planning"
**Loads**: 
- `skills/plan/SKILL.md`
- `skills/plan/discovery.md`
- `skills/plan/design-interpretation.md`
- `skills/plan/planning.md`

**Does**:
- Fetches Figma design via MCP
- Interactive Q&A to gather requirements
- Searches existing blocks (`ls blocks/`)
- Decides: reuse blocks vs create new, static vs dynamic, settings needed
- Creates task JSON with all tasks marked `passes: false`
- Creates acceptance criteria
- Presents summary for user approval

**Also**: Final review after all tasks complete - verifies acceptance criteria against Figma

### 2. CODE SKILL
**When**: Task JSON exists, phase is "coding", there's a task with `passes: false`
**Loads**:
- `skills/code/SKILL.md`
- `skills/code/implementation.md`
- Relevant pattern docs (schema.md, liquid.md, css.md, js.md)

**Does**:
- Reads task JSON, finds first `passes: false` task
- Implements that ONE task only
- References pattern docs for conventions
- Self-checks: does it render? basic functionality?
- Git commits with descriptive message + task ID
- Updates task JSON, hands off to QA

### 3. QA SKILL
**When**: Task JSON phase is "qa"
**Loads**:
- `skills/qa/SKILL.md`
- `skills/qa/verification.md`
- Relevant checklists

**Does**:
- Runs `shopify theme check`
- Visual verification via Chrome DevTools MCP
- Functional testing (interactions work)
- Accessibility audit (WCAG 2.1 AA)
- Compares against acceptance criteria

**Verdict**:
- PASS → Mark task `passes: true`, move to next task or docs phase
- FAIL → Feedback to Code skill (max 3 attempts, then escalate)

### 4. DOCS SKILL
**When**: All tasks pass, phase is "documentation"
**Loads**:
- `skills/docs/SKILL.md`
- `skills/docs/templates/`

**Does**:
- Checks complexity flags in task JSON
- Writes client docs (`assets/apa-docs-feature-[slug].liquid`)
- If complexity flags triggered: writes developer docs
- Final git commit
- Creates PR (if configured)
- Outputs minor issues log

---

## Orchestration Flow

```
START
  │
  ▼
┌─────────────────────────────────────┐
│ Check: Does task JSON exist?        │
└─────────────────────────────────────┘
  │
  ├── NO ──► Load PLAN SKILL ──► Discovery ──► Create Task JSON
  │
  ▼ YES
┌─────────────────────────────────────┐
│ Read task JSON, check phase         │
└─────────────────────────────────────┘
  │
  ├── phase: "planning" ──► Load PLAN SKILL ──► Complete planning
  │
  ├── phase: "coding" ──► Find first task with passes: false
  │   │
  │   ├── Found ──► Load CODE SKILL ──► Implement ──► Commit ──► Set phase: "qa"
  │   │
  │   └── All pass ──► Set phase: "documentation"
  │
  ├── phase: "qa" ──► Load QA SKILL ──► Verify
  │   │
  │   ├── PASS ──► Mark task passes: true ──► Set phase: "coding" (next task)
  │   │
  │   └── FAIL ──► Increment attempt counter
  │       │
  │       ├── attempts < 3 ──► Feedback ──► Set phase: "coding"
  │       │
  │       └── attempts >= 3 ──► ESCALATE TO USER
  │
  ├── phase: "documentation" ──► Load DOCS SKILL ──► Generate docs ──► Set phase: "review"
  │
  └── phase: "review" ──► Load PLAN SKILL ──► Final verification against Figma
      │
      ├── PASS ──► Set status: "complete" ──► END
      │
      └── Issues found ──► Log to minor_issues ──► END (with notes)
```

---

## Escalation Flow

After 3 failed QA attempts on a single task:

```
┌────────────────────────────────────────────────────────────────┐
│                     ESCALATION TO USER                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Task: [task-id] - [description]                               │
│                                                                 │
│  Issue Summary:                                                 │
│  [What's failing and why]                                      │
│                                                                 │
│  Attempt History:                                               │
│  1. [What was tried] → [Result]                                │
│  2. [What was tried] → [Result]                                │
│  3. [What was tried] → [Result]                                │
│                                                                 │
│  Agent Analysis:                                                │
│  [Root cause hypothesis]                                       │
│                                                                 │
│  Proposed Solutions:                                            │
│  A. [Option with tradeoffs]                                    │
│  B. [Option with tradeoffs]                                    │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│  Options:                                                       │
│  [1] Grant 3 more attempts                                     │
│  [2] I'll fix manually, then continue                          │
│  [3] Skip this task, log to minor issues                       │
│  [4] Abort this feature                                        │
└────────────────────────────────────────────────────────────────┘
```

---

## Context Management Strategy

Based on research: ~40% context window usage is where quality degrades.

**Strategy**: Fresh context per phase transition (optional, configurable)

```
PLAN SKILL    → Creates task JSON, compacts learnings into it
              → NEW CONTEXT
CODE SKILL    → Reads task JSON, implements, commits
              → NEW CONTEXT  
QA SKILL      → Reads task JSON + code, verifies
              → NEW CONTEXT (or same if small)
DOCS SKILL    → Reads task JSON + code, generates docs
```

Task JSON is the **persistent memory** between contexts.

---

## MCP Servers Required

| MCP Server | Purpose | Used By |
|------------|---------|---------|
| Figma | Fetch design context | Plan Skill |
| Chrome DevTools | Visual verification, testing | QA Skill |
| Git (or built-in) | Commits, history | All Skills |

---

## Theme Blocks Reference (Horizon Architecture)

### Three Block Types
1. **Regular** (`/blocks/name.liquid`) - Available with @theme
2. **Private** (`/blocks/_name.liquid`) - Underscore prefix, explicit targeting only
3. **Static** - Via `{% content_for "block", type: "...", id: "..." %}`

### Block Rendering
```liquid
{% comment %} Dynamic - merchant controls order {% endcomment %}
{% content_for 'blocks' %}

{% comment %} Static - developer controls position {% endcomment %}
{% content_for "block", type: "header", id: "section-header" %}

{% comment %} Static with data passing {% endcomment %}
{% content_for "block", type: "slide", id: "slide-1", color: "#111" %}
```

### Schema Targeting
```json
// Accept all theme blocks
{ "blocks": [{ "type": "@theme" }] }

// Accept specific blocks only  
{ "blocks": [{ "type": "slide" }, { "type": "_slideshow-controls" }] }

// Accept theme blocks + app blocks
{ "blocks": [{ "type": "@theme" }, { "type": "@app" }] }
```

### Static Blocks in JSON (Theme Editor Storage)
```json
{
  "blocks": {
    "static-header": {
      "type": "header",
      "static": true,
      "settings": {}
    },
    "dynamic-1": {
      "type": "text",
      "settings": {}
    }
  },
  "block_order": ["dynamic-1"]  // Static blocks NOT in block_order
}
```

### {% doc %} Requirement
Static blocks MUST include {% doc %} with @example showing usage.

---

## Verification Commands

```bash
# Linting (deterministic - always use this)
shopify theme check

# Local development
shopify theme dev

# Block discovery
ls blocks/

# Git operations
git add -A && git commit -m "[task-id] description"
```

---

## File Structure

```
apa-base/
├── CLAUDE.md                          # Minimal (~40 lines), routes to skills
├── .apa/
│   ├── skills/
│   │   ├── plan/
│   │   │   ├── SKILL.md
│   │   │   ├── discovery.md
│   │   │   ├── design-interpretation.md
│   │   │   └── planning.md
│   │   ├── code/
│   │   │   ├── SKILL.md
│   │   │   └── implementation.md
│   │   ├── qa/
│   │   │   ├── SKILL.md
│   │   │   └── verification.md
│   │   └── docs/
│   │       ├── SKILL.md
│   │       └── templates/
│   │           ├── client-docs.liquid
│   │           └── developer-docs.md
│   ├── patterns/
│   │   ├── schema.md
│   │   ├── liquid.md
│   │   ├── css.md
│   │   └── js.md
│   ├── tasks/
│   │   └── [slug].json
│   └── hooks/
│       └── settings.json
├── blocks/
├── sections/
├── snippets/
├── assets/
├── config/
├── layout/
├── locales/
└── templates/
```
