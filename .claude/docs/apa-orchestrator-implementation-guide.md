# APA Orchestrator Implementation Guide

> Complete guide for building a TypeScript orchestrator with Claude Code SDK for automated Shopify theme development

## Executive Summary

This guide provides everything needed to build a production-ready orchestration system that:

- Spawns specialized subagents (planner/coder/qa/docs) via Claude Code SDK
- Auto-discovers skills from `.claude/skills/` directory
- Enforces tool restrictions (QA agent is read-only)
- Manages task state through JSON files
- Logs all activity to JSONL for debugging and analysis
- Handles escalation after 3 failed QA attempts

**Time estimate:** 2-3 hours for initial setup and testing

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Directory Structure](#2-directory-structure)
3. [Prerequisites](#3-prerequisites)
4. [Step 1: Create Subagent Definitions](#step-1-create-subagent-definitions)
5. [Step 2: Initialize Orchestrator Project](#step-2-initialize-orchestrator-project)
6. [Step 3: Type Definitions](#step-3-type-definitions)
7. [Step 4: Session Logger](#step-4-session-logger)
8. [Step 5: Utility Functions](#step-5-utility-functions)
9. [Step 6: Agent Configuration](#step-6-agent-configuration)
10. [Step 7: Main Orchestrator](#step-7-main-orchestrator)
11. [Step 8: CLI Entry Point](#step-8-cli-entry-point)
12. [Step 9: Task JSON Examples](#step-9-task-json-examples)
13. [Installation & First Run](#installation--first-run)
14. [Verification Checklist](#verification-checklist)
15. [Debugging Guide](#debugging-guide)
16. [SDK Reference](#sdk-reference)
17. [Next Steps & Enhancements](#next-steps--enhancements)

---

## 1. Architecture Overview

### System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TypeScript Orchestrator                       │
│                   (.apa/orchestrator/index.ts)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Read task JSON → Determine current phase                     │
│  2. Select appropriate subagent for phase                        │
│  3. Build context-aware prompt                                   │
│  4. Spawn subagent via SDK query()                              │
│  5. Stream and log all events                                    │
│  6. Update task JSON with results                                │
│  7. Transition to next phase or escalate                         │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
   │ apa-planner │     │  apa-coder  │     │   apa-qa    │
   │ (planning)  │     │  (coding)   │     │(verification)│
   │             │     │             │     │             │
   │ All tools   │     │ All tools   │     │ READ-ONLY   │
   │ + Skill     │     │ + Skill     │     │ No Write    │
   │             │     │             │     │ No Edit     │
   └─────────────┘     └─────────────┘     └─────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              ▼
                    ┌─────────────────┐
                    │    apa-docs     │
                    │ (documentation) │
                    │                 │
                    │   All tools     │
                    │   + Skill       │
                    └─────────────────┘
```

### Phase State Machine

```
┌──────────┐    plan approved    ┌──────────┐    code complete    ┌──────────┐
│ PLANNING │ ──────────────────► │  CODING  │ ──────────────────► │    QA    │
└──────────┘                     └──────────┘                     └──────────┘
                                       ▲                               │
                                       │                               │
                                       │ issues found                  │ all pass
                                       │ (attempt < 3)                 │
                                       │                               ▼
                                       │                     ┌─────────────────┐
                                       └──────────────────── │  DOCUMENTATION  │
                                                             └─────────────────┘
                                                                       │
                              ┌──────────────┐                         │ docs complete
                              │  ESCALATED   │                         │
                              │ (3 failures) │                         ▼
                              └──────────────┘                 ┌──────────────┐
                                                               │   COMPLETE   │
                                                               └──────────────┘
```

### Key Design Principles

1. **Context Isolation**: Each subagent starts fresh, loads only its skill
2. **Tool Restrictions**: QA agent cannot modify code (prevents accidental changes)
3. **Deterministic Verification**: QA uses Bash/Grep for verifiable checks
4. **Progressive Disclosure**: Skills loaded on-demand, not stuffed into context
5. **Comprehensive Logging**: Every tool call and result captured in JSONL
6. **Graceful Escalation**: 3-attempt limit before human intervention

---

## 2. Directory Structure

### Complete Project Layout

```
your-theme-project/
├── .claude/
│   ├── agents/                    # NEW: Subagent definitions
│   │   ├── apa-planner.md         # Planning specialist
│   │   ├── apa-coder.md           # Implementation specialist
│   │   ├── apa-qa.md              # QA specialist (READ-ONLY)
│   │   └── apa-docs.md            # Documentation specialist
│   │
│   ├── skills/                    # EXISTING: Keep as-is
│   │   ├── plan/
│   │   │   └── SKILL.md           # Planning methodology
│   │   ├── code/
│   │   │   └── SKILL.md           # Implementation patterns
│   │   ├── qa/
│   │   │   └── SKILL.md           # Verification procedures
│   │   └── docs/
│   │       └── SKILL.md           # Documentation templates
│   │
│   ├── docs/                      # EXISTING: Handover documentation
│   │   ├── 01-PROJECT-OVERVIEW.md
│   │   ├── 02-ARCHITECTURE.md
│   │   ├── 03-TASK-JSON-SCHEMA.md
│   │   └── 04-PATTERNS.md
│   │
│   └── settings.json              # Claude Code project settings
│
├── .apa/
│   ├── orchestrator/              # NEW: TypeScript orchestrator
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── index.ts               # Main entry point
│   │   ├── types.ts               # TypeScript type definitions
│   │   ├── agents.ts              # Agent configuration
│   │   ├── logger.ts              # JSONL session logging
│   │   └── utils.ts               # Helper functions
│   │
│   ├── tasks/                     # Task state files
│   │   └── {task-slug}.json       # Individual task states
│   │
│   └── logs/                      # Session logs
│       ├── {session-id}.jsonl     # Raw event log
│       └── {session-id}-summary.md # Human-readable summary
│
├── sections/                      # Shopify theme sections
├── blocks/                        # Theme blocks
├── snippets/                      # Liquid snippets
└── CLAUDE.md                      # Project instructions
```

---

## 3. Prerequisites

### Required Software

```bash
# Node.js 20+ (for native fetch and modern ES modules)
node --version  # Should be v20.0.0 or higher

# npm or pnpm
npm --version   # Should be v10.0.0 or higher

# Claude Code CLI (for testing agents manually)
claude --version
```

### Environment Variables

```bash
# Required: Anthropic API key
export ANTHROPIC_API_KEY="sk-ant-..."

# Optional: Enable debug logging
export DEBUG="claude:*"
```

### Existing Skills Verification

Before starting, verify your skills are in place:

```bash
# Check skills directory exists
ls -la .claude/skills/

# Verify each skill has SKILL.md
cat .claude/skills/plan/SKILL.md | head -20
cat .claude/skills/code/SKILL.md | head -20
cat .claude/skills/qa/SKILL.md | head -20
cat .claude/skills/docs/SKILL.md | head -20
```

---

## Step 1: Create Subagent Definitions

### File: `.claude/agents/apa-planner.md`

```markdown
---
name: apa-planner
description: Creates implementation plans for Shopify theme sections by analyzing requirements, existing patterns, and design specifications
tools: Read, Write, Bash, Grep, Glob
model: claude-sonnet-4-20250514
---

# APA Planner Agent

You are the planning specialist for the Automated Production Assistant (APA) system. Your role is to create detailed, actionable implementation plans for Shopify theme sections.

## Initialization Sequence

**ALWAYS execute these steps first, in order:**

1. Read your skill file: `.claude/skills/plan/SKILL.md`
2. Read the task JSON passed in the prompt
3. Read project patterns: `.claude/docs/04-PATTERNS.md`
4. Follow the skill's Discovery → Analysis → Planning → Documentation process

## Your Responsibilities

1. **Analyze Requirements**
   - Parse Figma design specifications
   - Identify all UI components needed
   - Map to existing block patterns

2. **Discovery Phase**
   - Search for similar existing sections
   - Identify reusable blocks and snippets
   - Document dependencies

3. **Create Implementation Plan**
   - Break work into atomic tasks
   - Specify exact file paths
   - Define acceptance criteria for each task
   - Estimate complexity

4. **Document Everything**
   - Write plan to task JSON
   - Include code snippets where helpful
   - Reference existing patterns by file path

## Task JSON Location

Your plans are written to `.apa/tasks/{task-slug}.json` following the schema defined in `.claude/docs/03-TASK-JSON-SCHEMA.md`.

## Output Requirements

Your plan MUST include:

- [ ] Overview of what will be built
- [ ] Technical approach with rationale
- [ ] List of tasks with descriptions and file paths
- [ ] Acceptance criteria (specific, testable)
- [ ] Dependencies and prerequisites
- [ ] Risk assessment

## Example Plan Structure

```json
{
  "plan": {
    "overview": "Hero section with animated gradient background...",
    "technical_approach": "Using existing gradient-block as base...",
    "tasks": [
      {
        "id": "task-001",
        "description": "Create hero-section.liquid with schema",
        "status": "pending",
        "files_affected": ["sections/hero-section.liquid"],
        "acceptance_criteria": [
          "File exists at sections/hero-section.liquid",
          "Schema includes all required settings",
          "Renders without Liquid errors"
        ]
      }
    ],
    "acceptance_criteria": [
      "Section renders correctly in theme editor",
      "All settings are functional",
      "Responsive on mobile/tablet/desktop"
    ]
  }
}
```

## Success Criteria

Your plan is complete when:

1. All requirements from the task are addressed
2. Every file path is absolute and verified to exist (or marked as new)
3. Acceptance criteria are specific enough to verify programmatically
4. Another agent could implement without asking questions
```

### File: `.claude/agents/apa-coder.md`

```markdown
---
name: apa-coder
description: Implements Shopify theme sections following approved plans with focus on code quality, patterns, and best practices
tools: Read, Write, Edit, Bash, Grep, Glob
model: claude-sonnet-4-20250514
---

# APA Coder Agent

You are the implementation specialist for the Automated Production Assistant (APA) system. Your role is to write high-quality Shopify theme code following approved plans.

## Initialization Sequence

**ALWAYS execute these steps first, in order:**

1. Read your skill file: `.claude/skills/code/SKILL.md`
2. Read the task JSON to get the approved plan
3. Read referenced pattern files from the plan
4. Follow the skill's implementation workflow

## Your Responsibilities

1. **Implement According to Plan**
   - Follow the plan exactly
   - Create files in specified locations
   - Use patterns referenced in the plan

2. **Maintain Code Quality**
   - Follow existing project conventions
   - Use semantic HTML
   - Write accessible code
   - Include helpful comments

3. **Update Task State**
   - Mark tasks complete as you finish them
   - Record files created/modified
   - Note any deviations from plan

4. **Verify Your Work**
   - Run `shopify theme check` after changes
   - Check for Liquid syntax errors
   - Validate JSON schema syntax

## Task JSON Location

Read plan and update progress in `.apa/tasks/{task-slug}.json`.

## Implementation Workflow

```
1. Read task JSON → Get plan
2. For each task in plan.tasks:
   a. Read any referenced files
   b. Implement the code
   c. Run verification (theme check)
   d. Update task status to "complete"
   e. Record files_created/files_modified
3. Final verification
4. Update task meta.status to "qa"
```

## Code Standards

### Liquid Files

```liquid
{% comment %}
  Section: Hero Section
  Description: Full-width hero with animated gradient
  
  Settings:
    - heading: Main heading text
    - subheading: Supporting text
    - cta_text: Button label
    - cta_link: Button URL
{% endcomment %}

{%- liquid
  assign heading = section.settings.heading
  assign subheading = section.settings.subheading
-%}

<section 
  class="hero-section"
  data-section-id="{{ section.id }}"
  data-section-type="hero"
>
  <!-- Content here -->
</section>

{% schema %}
{
  "name": "Hero Section",
  "tag": "section",
  "class": "hero-wrapper",
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Welcome"
    }
  ],
  "blocks": [],
  "presets": [
    {
      "name": "Hero Section"
    }
  ]
}
{% endschema %}
```

### Block Files

```liquid
{% comment %}
  Block: Gradient Background
  Parent: Hero Section
  
  Settings:
    - gradient_start: Start color
    - gradient_end: End color
    - angle: Gradient angle in degrees
{% endcomment %}

{%- liquid
  assign start = block.settings.gradient_start
  assign end = block.settings.gradient_end
  assign angle = block.settings.angle | default: 135
-%}

<div 
  class="gradient-bg"
  style="background: linear-gradient({{ angle }}deg, {{ start }}, {{ end }})"
  {{ block.shopify_attributes }}
>
  {{ block.settings.content }}
</div>
```

## Success Criteria

Implementation is complete when:

1. All planned tasks are marked complete
2. `shopify theme check` passes with no errors
3. Files created/modified are recorded in task JSON
4. Task status is updated to "qa"
```

### File: `.claude/agents/apa-qa.md`

```markdown
---
name: apa-qa
description: Validates Shopify theme sections against acceptance criteria using deterministic verification tools
tools: Read, Bash, Grep, Glob
model: claude-sonnet-4-20250514
---

# APA QA Agent

You are the quality assurance specialist for the Automated Production Assistant (APA) system. Your role is to verify implementations against acceptance criteria using deterministic tools.

## ⚠️ CRITICAL CONSTRAINT

**YOU HAVE READ-ONLY ACCESS TO THE CODEBASE.**

You CANNOT use:
- `Write` tool
- `Edit` tool
- Any command that modifies files

If you find issues that need fixing:
1. Document the issue in detail in task JSON
2. Set task status back to "coding"
3. Return control to orchestrator

**DO NOT attempt to fix code yourself. Document and escalate.**

## Initialization Sequence

**ALWAYS execute these steps first, in order:**

1. Read your skill file: `.claude/skills/qa/SKILL.md`
2. Read the task JSON to get acceptance criteria
3. Follow the skill's verification procedures exactly

## Your Responsibilities

1. **File Integrity Check** (ALWAYS FIRST)
   - Verify all expected files exist
   - Check file sizes are non-zero
   - Confirm file locations match plan

2. **Schema Validation**
   - Parse JSON schemas for syntax errors
   - Verify required fields are present
   - Check setting types are correct

3. **Liquid Syntax Verification**
   - Run `shopify theme check`
   - Parse output for errors/warnings
   - Document any issues found

4. **Acceptance Criteria Verification**
   - Test each criterion programmatically
   - Use Grep/Bash for content checks
   - Record pass/fail for each

5. **Document Findings**
   - Update task JSON with results
   - Include specific file paths and line numbers
   - Provide actionable fix descriptions

## Task JSON Location

Read implementation and update verification results in `.apa/tasks/{task-slug}.json`.

## Verification Commands

### File Existence

```bash
# Check file exists
test -f "sections/hero-section.liquid" && echo "EXISTS" || echo "MISSING"

# Check file is not empty
test -s "sections/hero-section.liquid" && echo "HAS_CONTENT" || echo "EMPTY"
```

### Schema Validation

```bash
# Extract and validate JSON schema
grep -Pzo '(?s){% schema %}.*?{% endschema %}' sections/hero-section.liquid | \
  sed '1d;$d' | jq .
```

### Content Checks

```bash
# Verify section has required elements
grep -c 'data-section-type' sections/hero-section.liquid

# Check for accessibility attributes
grep -E 'aria-|role=' sections/hero-section.liquid

# Verify schema has presets
grep -A5 '"presets"' sections/hero-section.liquid
```

### Theme Check

```bash
# Run Shopify theme check on specific file
shopify theme check --path sections/hero-section.liquid --output json
```

## Verification Result Format

```json
{
  "qa": {
    "verification_results": [
      {
        "criterion": "File exists at sections/hero-section.liquid",
        "status": "pass",
        "details": "File exists, size: 2.4KB"
      },
      {
        "criterion": "Schema includes heading setting",
        "status": "pass",
        "details": "Found at line 45"
      },
      {
        "criterion": "No Liquid syntax errors",
        "status": "fail",
        "details": "theme check found 2 errors: missing endif on line 23"
      }
    ],
    "issues": [
      {
        "severity": "critical",
        "description": "Missing endif tag causes render failure",
        "file": "sections/hero-section.liquid",
        "line": 23,
        "fix_suggestion": "Add {% endif %} after the conditional block"
      }
    ],
    "summary": {
      "total_criteria": 10,
      "passed": 8,
      "failed": 2,
      "recommendation": "return_to_coding"
    }
  }
}
```

## Decision Logic

```
IF all criteria pass:
  → Set task.meta.status = "documentation"
  → Clear any previous issues

ELSE IF issues found AND qa_attempts < 3:
  → Set task.meta.status = "coding"
  → Increment task.meta.qa_attempts
  → Document issues with fix suggestions

ELSE IF qa_attempts >= 3:
  → Set task.meta.status = "escalated"
  → Set task.meta.escalation_reason = "3 QA failures"
  → Human intervention required
```

## Success Criteria

QA is complete when:

1. All acceptance criteria have been tested
2. Results are documented in task JSON
3. Task status is updated appropriately
4. No code modifications were attempted
```

### File: `.claude/agents/apa-docs.md`

```markdown
---
name: apa-docs
description: Creates comprehensive documentation for Shopify theme sections including usage guides and technical references
tools: Read, Write, Bash, Grep, Glob
model: claude-sonnet-4-20250514
---

# APA Docs Agent

You are the documentation specialist for the Automated Production Assistant (APA) system. Your role is to create comprehensive documentation for completed theme sections.

## Initialization Sequence

**ALWAYS execute these steps first, in order:**

1. Read your skill file: `.claude/skills/docs/SKILL.md`
2. Read the task JSON to understand what was built
3. Read the implemented files to document accurately
4. Follow the skill's documentation templates

## Your Responsibilities

1. **Analyze Implementation**
   - Read all created/modified files
   - Understand the section's functionality
   - Identify all settings and their purposes

2. **Create README**
   - Usage instructions
   - Configuration options
   - Examples with screenshots references

3. **Technical Documentation**
   - Schema reference
   - Block documentation
   - CSS class reference
   - JavaScript API (if any)

4. **Update Task JSON**
   - Record documentation file paths
   - Mark task as complete

## Task JSON Location

Read implementation and update documentation status in `.apa/tasks/{task-slug}.json`.

## Documentation Templates

### Section README Template

```markdown
# {Section Name}

> {Brief description of what this section does}

## Quick Start

Add this section to any page in the theme editor:

1. Open the theme customizer
2. Click "Add section"
3. Select "{Section Name}"
4. Configure settings as needed

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| heading | text | "Welcome" | Main heading text |
| subheading | richtext | - | Supporting content |
| cta_text | text | "Learn More" | Button label |
| cta_link | url | - | Button destination |

## Blocks

This section supports the following blocks:

### {Block Name}

{Block description}

**Settings:**
- `setting_id` (type): Description

## Styling

### CSS Classes

| Class | Purpose |
|-------|---------|
| `.hero-section` | Main container |
| `.hero-section__content` | Content wrapper |
| `.hero-section__heading` | Heading element |

### CSS Custom Properties

```css
--hero-padding: 4rem;
--hero-max-width: 1200px;
```

## Examples

### Basic Usage

{Screenshot reference or description}

### With Custom Styling

{Screenshot reference or description}

## Accessibility

- Uses semantic HTML (`<section>`, `<h1>`, etc.)
- Includes ARIA labels where needed
- Supports keyboard navigation
- Color contrast meets WCAG AA

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## Changelog

### v1.0.0
- Initial release
```

### Technical Reference Template

```markdown
# {Section Name} - Technical Reference

## File Structure

```
sections/
└── {section-name}.liquid

blocks/
├── {block-1}.liquid
└── {block-2}.liquid

snippets/
└── {helper-snippet}.liquid

assets/
├── {section-name}.css
└── {section-name}.js
```

## Schema Definition

```json
{
  "name": "{Section Name}",
  "tag": "section",
  "class": "{css-class}",
  "settings": [...],
  "blocks": [...],
  "presets": [...]
}
```

## Liquid Variables

| Variable | Type | Description |
|----------|------|-------------|
| `section.settings.heading` | String | Main heading text |

## JavaScript API

### Initialization

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('[data-section-type="hero"]');
  sections.forEach(initHeroSection);
});
```

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `hero:loaded` | `{ sectionId }` | Fired when section initializes |

## Dependencies

- None (standalone section)

## Performance Considerations

- Lazy loads images below fold
- CSS is scoped to section
- JavaScript is optional enhancement
```

## Output Structure

```
docs/sections/{section-name}/
├── README.md              # User-facing documentation
├── TECHNICAL.md           # Developer reference
└── CHANGELOG.md           # Version history
```

## Success Criteria

Documentation is complete when:

1. README.md exists with all settings documented
2. Technical reference covers schema and implementation
3. Examples are provided for common use cases
4. Documentation paths recorded in task JSON
5. Task status updated to "complete"
```

---

## Step 2: Initialize Orchestrator Project

### File: `.apa/orchestrator/package.json`

```json
{
  "name": "apa-orchestrator",
  "version": "1.0.0",
  "description": "TypeScript orchestrator for APA multi-agent system",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "tsx index.ts",
    "dev": "tsx watch index.ts",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@anthropic-ai/claude-code": "^1.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### File: `.apa/orchestrator/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Step 3: Type Definitions

### File: `.apa/orchestrator/types.ts`

```typescript
import { z } from 'zod';

// ============================================================================
// Task JSON Schema
// ============================================================================

/**
 * Individual task within a plan
 */
export const TaskItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  status: z.enum(['pending', 'in_progress', 'complete']),
  files_affected: z.array(z.string()).optional(),
  acceptance_criteria: z.array(z.string()).optional(),
  completed_at: z.string().optional()
});

/**
 * Verification result for a single criterion
 */
export const VerificationResultSchema = z.object({
  criterion: z.string(),
  status: z.enum(['pass', 'fail', 'skipped']),
  details: z.string().optional(),
  verified_at: z.string().optional()
});

/**
 * Issue found during QA
 */
export const IssueSchema = z.object({
  severity: z.enum(['critical', 'major', 'minor']),
  description: z.string(),
  file: z.string().optional(),
  line: z.number().optional(),
  fix_suggestion: z.string().optional()
});

/**
 * Complete task state
 */
export const TaskSchema = z.object({
  meta: z.object({
    name: z.string(),
    slug: z.string(),
    status: z.enum([
      'planning',
      'coding', 
      'qa',
      'documentation',
      'review',
      'complete',
      'escalated'
    ]),
    current_phase: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    qa_attempts: z.number().default(0),
    escalation_reason: z.string().optional(),
    figma_url: z.string().optional(),
    requirements: z.string().optional()
  }),
  
  plan: z.object({
    overview: z.string().optional(),
    technical_approach: z.string().optional(),
    tasks: z.array(TaskItemSchema).optional(),
    acceptance_criteria: z.array(z.string()).optional(),
    dependencies: z.array(z.string()).optional(),
    risks: z.array(z.string()).optional(),
    created_at: z.string().optional(),
    created_by: z.string().optional()
  }).optional(),
  
  implementation: z.object({
    files_created: z.array(z.string()).optional(),
    files_modified: z.array(z.string()).optional(),
    completed_tasks: z.array(z.string()).optional(),
    started_at: z.string().optional(),
    completed_at: z.string().optional()
  }).optional(),
  
  qa: z.object({
    verification_results: z.array(VerificationResultSchema).optional(),
    issues: z.array(IssueSchema).optional(),
    summary: z.object({
      total_criteria: z.number(),
      passed: z.number(),
      failed: z.number(),
      recommendation: z.enum(['proceed', 'return_to_coding', 'escalate'])
    }).optional(),
    verified_at: z.string().optional()
  }).optional(),
  
  documentation: z.object({
    readme_path: z.string().optional(),
    technical_docs_path: z.string().optional(),
    changelog_path: z.string().optional(),
    created_at: z.string().optional()
  }).optional()
});

export type Task = z.infer<typeof TaskSchema>;
export type TaskItem = z.infer<typeof TaskItemSchema>;
export type VerificationResult = z.infer<typeof VerificationResultSchema>;
export type Issue = z.infer<typeof IssueSchema>;

// ============================================================================
// Phase & Agent Types
// ============================================================================

export type Phase = 
  | 'planning' 
  | 'coding' 
  | 'qa' 
  | 'documentation' 
  | 'review';

export type TaskStatus = Task['meta']['status'];

export type AgentName = 
  | 'apa-planner' 
  | 'apa-coder' 
  | 'apa-qa' 
  | 'apa-docs';

export type ToolName = 
  | 'Read' 
  | 'Write' 
  | 'Edit' 
  | 'Bash' 
  | 'Grep' 
  | 'Glob';

// ============================================================================
// Logging Types
// ============================================================================

export type LogEventType = 
  | 'session_start'
  | 'session_end'
  | 'phase_start'
  | 'phase_end'
  | 'prompt'
  | 'tool_call'
  | 'tool_result'
  | 'response'
  | 'error'
  | 'phase_transition'
  | 'escalation';

export interface LogEntry {
  timestamp: string;
  session_id: string;
  phase: string;
  agent: string;
  event_type: LogEventType;
  data: Record<string, unknown>;
  token_usage?: {
    input: number;
    output: number;
    cache_read?: number;
    cache_write?: number;
  };
  duration_ms?: number;
}

export interface SessionSummary {
  session_id: string;
  task_slug: string;
  started_at: string;
  ended_at: string;
  phases_executed: string[];
  total_tool_calls: number;
  total_tokens: number;
  errors: number;
  final_status: TaskStatus;
}

// ============================================================================
// SDK Types (simplified for reference)
// ============================================================================

export interface QueryOptions {
  prompt: string;
  cwd?: string;
  allowedTools?: ToolName[];
  model?: string;
  maxTurns?: number;
  systemPrompt?: string;
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions';
}

export interface QueryResult {
  result: string;
  num_turns: number;
  is_error: boolean;
  errors?: string[];
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_tokens?: number;
    cache_write_tokens?: number;
  };
}
```

---

## Step 4: Session Logger

### File: `.apa/orchestrator/logger.ts`

```typescript
import { mkdirSync, appendFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { LogEntry, LogEventType, SessionSummary, TaskStatus } from './types.js';

/**
 * Session logger that writes events to JSONL and generates summaries
 */
export class SessionLogger {
  private logDir: string;
  private sessionId: string;
  private taskSlug: string;
  private logPath: string;
  private summaryPath: string;
  private entries: LogEntry[] = [];
  private startTime: number;
  private currentPhase: string = 'init';
  private currentAgent: string = 'orchestrator';

  constructor(taskSlug: string) {
    this.taskSlug = taskSlug;
    this.startTime = Date.now();
    this.sessionId = `${this.startTime}-${taskSlug}`;
    this.logDir = join(process.cwd(), '.apa', 'logs');
    
    // Ensure log directory exists
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
    
    this.logPath = join(this.logDir, `${this.sessionId}.jsonl`);
    this.summaryPath = join(this.logDir, `${this.sessionId}-summary.md`);
    
    // Log session start
    this.log('session_start', { 
      task_slug: taskSlug,
      started_at: new Date().toISOString()
    });
  }

  /**
   * Set current context for logging
   */
  setContext(phase: string, agent: string): void {
    this.currentPhase = phase;
    this.currentAgent = agent;
  }

  /**
   * Core logging method
   */
  log(
    eventType: LogEventType, 
    data: Record<string, unknown>,
    tokenUsage?: LogEntry['token_usage']
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      phase: this.currentPhase,
      agent: this.currentAgent,
      event_type: eventType,
      data,
      token_usage: tokenUsage,
      duration_ms: Date.now() - this.startTime
    };
    
    this.entries.push(entry);
    
    // Append to JSONL file
    try {
      appendFileSync(this.logPath, JSON.stringify(entry) + '\n');
    } catch (error) {
      console.error('Failed to write log entry:', error);
    }
  }

  /**
   * Log phase start
   */
  logPhaseStart(phase: string, agent: string): void {
    this.setContext(phase, agent);
    this.log('phase_start', { phase, agent });
  }

  /**
   * Log phase end
   */
  logPhaseEnd(phase: string, success: boolean, reason?: string): void {
    this.log('phase_end', { phase, success, reason });
  }

  /**
   * Log prompt sent to agent
   */
  logPrompt(prompt: string): void {
    this.log('prompt', { 
      prompt,
      prompt_length: prompt.length 
    });
  }

  /**
   * Log tool call
   */
  logToolCall(toolName: string, input: unknown): void {
    this.log('tool_call', { 
      tool: toolName, 
      input,
      input_size: JSON.stringify(input).length
    });
  }

  /**
   * Log tool result
   */
  logToolResult(toolName: string, result: unknown, success: boolean): void {
    const resultStr = JSON.stringify(result);
    this.log('tool_result', { 
      tool: toolName, 
      success,
      result_size: resultStr.length,
      // Truncate large results in log
      result_preview: resultStr.length > 500 
        ? resultStr.slice(0, 500) + '...' 
        : result
    });
  }

  /**
   * Log agent response
   */
  logResponse(
    response: string, 
    numTurns: number, 
    tokenUsage: LogEntry['token_usage']
  ): void {
    this.log('response', {
      response_length: response.length,
      num_turns: numTurns,
      response_preview: response.length > 1000 
        ? response.slice(0, 1000) + '...' 
        : response
    }, tokenUsage);
  }

  /**
   * Log error
   */
  logError(error: Error | string, context?: Record<string, unknown>): void {
    const errorData = error instanceof Error 
      ? { 
          message: error.message, 
          stack: error.stack,
          name: error.name
        }
      : { message: String(error) };
    
    this.log('error', { ...errorData, ...context });
  }

  /**
   * Log phase transition
   */
  logPhaseTransition(fromPhase: string, toPhase: string, reason: string): void {
    this.log('phase_transition', {
      from: fromPhase,
      to: toPhase,
      reason
    });
  }

  /**
   * Log escalation
   */
  logEscalation(reason: string, attempts: number): void {
    this.log('escalation', {
      reason,
      attempts,
      requires_human: true
    });
  }

  /**
   * Generate human-readable summary
   */
  generateSummary(finalStatus: TaskStatus): string {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    // Collect statistics
    const phases = [...new Set(this.entries.map(e => e.phase))];
    const toolCalls = this.entries.filter(e => e.event_type === 'tool_call');
    const errors = this.entries.filter(e => e.event_type === 'error');
    
    // Calculate token totals
    const tokenUsage = this.entries.reduce((acc, e) => {
      if (e.token_usage) {
        acc.input += e.token_usage.input || 0;
        acc.output += e.token_usage.output || 0;
        acc.cache_read += e.token_usage.cache_read || 0;
        acc.cache_write += e.token_usage.cache_write || 0;
      }
      return acc;
    }, { input: 0, output: 0, cache_read: 0, cache_write: 0 });

    const totalTokens = tokenUsage.input + tokenUsage.output;

    // Tool usage breakdown
    const toolBreakdown = toolCalls.reduce((acc, e) => {
      const tool = e.data.tool as string;
      acc[tool] = (acc[tool] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Build summary markdown
    let summary = `# Session Summary

## Overview

| Metric | Value |
|--------|-------|
| **Session ID** | \`${this.sessionId}\` |
| **Task** | ${this.taskSlug} |
| **Duration** | ${this.formatDuration(duration)} |
| **Final Status** | ${finalStatus} |
| **Phases** | ${phases.length} |
| **Tool Calls** | ${toolCalls.length} |
| **Errors** | ${errors.length} |

## Token Usage

| Type | Count |
|------|-------|
| Input | ${tokenUsage.input.toLocaleString()} |
| Output | ${tokenUsage.output.toLocaleString()} |
| Cache Read | ${tokenUsage.cache_read.toLocaleString()} |
| Cache Write | ${tokenUsage.cache_write.toLocaleString()} |
| **Total** | **${totalTokens.toLocaleString()}** |

## Phase Execution

`;

    // Phase breakdown
    for (const phase of phases) {
      if (phase === 'init') continue;
      
      const phaseEntries = this.entries.filter(e => e.phase === phase);
      const phaseStart = phaseEntries.find(e => e.event_type === 'phase_start');
      const phaseEnd = phaseEntries.find(e => e.event_type === 'phase_end');
      const phaseTools = phaseEntries.filter(e => e.event_type === 'tool_call');
      const phaseErrors = phaseEntries.filter(e => e.event_type === 'error');
      
      summary += `### ${phase.charAt(0).toUpperCase() + phase.slice(1)}\n\n`;
      summary += `- **Agent**: ${phaseStart?.data?.agent || 'unknown'}\n`;
      summary += `- **Tool Calls**: ${phaseTools.length}\n`;
      summary += `- **Errors**: ${phaseErrors.length}\n`;
      summary += `- **Success**: ${phaseEnd?.data?.success ? '✅' : '❌'}\n`;
      
      if (phaseTools.length > 0) {
        const tools = phaseTools.map(e => e.data.tool as string);
        const uniqueTools = [...new Set(tools)];
        summary += `- **Tools Used**: ${uniqueTools.join(', ')}\n`;
      }
      
      summary += '\n';
    }

    // Tool usage breakdown
    summary += `## Tool Usage\n\n`;
    summary += `| Tool | Calls |\n|------|-------|\n`;
    for (const [tool, count] of Object.entries(toolBreakdown).sort((a, b) => b[1] - a[1])) {
      summary += `| ${tool} | ${count} |\n`;
    }
    summary += '\n';

    // Errors section
    if (errors.length > 0) {
      summary += `## Errors\n\n`;
      errors.forEach((e, i) => {
        summary += `### Error ${i + 1} (${e.phase})\n\n`;
        summary += `\`\`\`\n${e.data.message}\n\`\`\`\n\n`;
        if (e.data.stack) {
          summary += `<details><summary>Stack Trace</summary>\n\n\`\`\`\n${e.data.stack}\n\`\`\`\n\n</details>\n\n`;
        }
      });
    }

    // Log file reference
    summary += `## Log File\n\n`;
    summary += `Full session log: \`${this.logPath}\`\n\n`;
    summary += `\`\`\`bash\n# View all events\ncat ${this.logPath} | jq .\n\n`;
    summary += `# Filter by event type\ncat ${this.logPath} | jq 'select(.event_type == "tool_call")'\n\n`;
    summary += `# Filter by phase\ncat ${this.logPath} | jq 'select(.phase == "coding")'\n\`\`\`\n`;

    // Write summary file
    try {
      writeFileSync(this.summaryPath, summary);
    } catch (error) {
      console.error('Failed to write summary:', error);
    }

    return summary;
  }

  /**
   * Format duration in human-readable format
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Get paths for external reference
   */
  getLogPath(): string {
    return this.logPath;
  }

  getSummaryPath(): string {
    return this.summaryPath;
  }

  getSessionId(): string {
    return this.sessionId;
  }
}
```

---

## Step 5: Utility Functions

### File: `.apa/orchestrator/utils.ts`

```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { Task, TaskSchema, Phase, AgentName, TaskStatus } from './types.js';

// ============================================================================
// Task JSON Operations
// ============================================================================

/**
 * Read and validate task JSON file
 */
export function readTaskJson(taskPath: string): Task {
  if (!existsSync(taskPath)) {
    throw new Error(`Task file not found: ${taskPath}`);
  }
  
  const content = readFileSync(taskPath, 'utf-8');
  
  try {
    const data = JSON.parse(content);
    return TaskSchema.parse(data);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in task file: ${taskPath}`);
    }
    throw error;
  }
}

/**
 * Write task JSON file with formatting
 */
export function writeTaskJson(taskPath: string, task: Task): void {
  // Ensure directory exists
  const dir = dirname(taskPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  // Update timestamp
  task.meta.updated_at = new Date().toISOString();
  
  // Write with pretty formatting
  const content = JSON.stringify(task, null, 2);
  writeFileSync(taskPath, content, 'utf-8');
}

/**
 * Get task file path from slug
 */
export function getTaskPath(taskSlug: string): string {
  return join(process.cwd(), '.apa', 'tasks', `${taskSlug}.json`);
}

// ============================================================================
// Phase Management
// ============================================================================

/**
 * Get current phase from task status
 */
export function getPhase(task: Task): Phase {
  const statusToPhase: Record<TaskStatus, Phase | null> = {
    'planning': 'planning',
    'coding': 'coding',
    'qa': 'qa',
    'documentation': 'documentation',
    'review': 'review',
    'complete': null,
    'escalated': null
  };
  
  const phase = statusToPhase[task.meta.status];
  if (!phase) {
    throw new Error(`Task is in terminal status: ${task.meta.status}`);
  }
  
  return phase;
}

/**
 * Map phase to responsible agent
 */
export function phaseToAgent(phase: Phase): AgentName {
  const mapping: Record<Phase, AgentName> = {
    'planning': 'apa-planner',
    'coding': 'apa-coder',
    'qa': 'apa-qa',
    'documentation': 'apa-docs',
    'review': 'apa-docs'
  };
  return mapping[phase];
}

/**
 * Get next phase after successful completion
 */
export function getNextPhase(currentPhase: Phase): TaskStatus {
  const transitions: Record<Phase, TaskStatus> = {
    'planning': 'coding',
    'coding': 'qa',
    'qa': 'documentation',
    'documentation': 'review',
    'review': 'complete'
  };
  return transitions[currentPhase];
}

/**
 * Check if task should be escalated
 */
export function shouldEscalate(task: Task): boolean {
  return task.meta.qa_attempts >= 3;
}

/**
 * Check if task is in terminal state
 */
export function isTerminal(task: Task): boolean {
  return task.meta.status === 'complete' || task.meta.status === 'escalated';
}

// ============================================================================
// Prompt Building
// ============================================================================

/**
 * Build phase-specific prompt for agent
 */
export function buildPrompt(phase: Phase, task: Task): string {
  const taskPath = getTaskPath(task.meta.slug);
  
  const prompts: Record<Phase, string> = {
    planning: `# Planning Task: ${task.meta.name}

## Instructions

1. **First**, read your skill file at \`.claude/skills/plan/SKILL.md\`
2. **Then**, read the task JSON at \`${taskPath}\` for requirements
3. **Follow** the skill's Discovery → Analysis → Planning → Documentation process
4. **Write** your complete plan back to the task JSON

## Task Requirements

${task.meta.requirements || 'See task JSON for full requirements'}

## Figma Reference

${task.meta.figma_url ? `Design: ${task.meta.figma_url}` : 'No Figma URL provided'}

## Expected Output

Update the task JSON with:
- \`plan.overview\`: High-level description
- \`plan.technical_approach\`: Implementation strategy
- \`plan.tasks\`: List of atomic tasks with acceptance criteria
- \`plan.acceptance_criteria\`: Overall success criteria
- \`meta.status\`: Set to "coding" when complete`,

    coding: `# Implementation Task: ${task.meta.name}

## Instructions

1. **First**, read your skill file at \`.claude/skills/code/SKILL.md\`
2. **Then**, read the approved plan from \`${taskPath}\`
3. **Implement** each task following project patterns
4. **Update** task JSON as you complete each task
5. **Run** \`shopify theme check\` to verify your work

## Plan Summary

${task.plan?.overview || 'Read plan from task JSON'}

## Tasks to Complete

${task.plan?.tasks?.map(t => `- [ ] ${t.id}: ${t.description}`).join('\n') || 'Read tasks from task JSON'}

## Expected Output

- All files created/modified as specified in plan
- Update \`implementation.files_created\` and \`implementation.files_modified\`
- Mark completed tasks in \`plan.tasks[].status\`
- Set \`meta.status\` to "qa" when all tasks complete`,

    qa: `# QA Verification: ${task.meta.name}

## ⚠️ CRITICAL: READ-ONLY MODE

You have **READ-ONLY** access. Do not attempt to modify any files.
If issues are found, document them and set status back to "coding".

## Instructions

1. **First**, read your skill file at \`.claude/skills/qa/SKILL.md\`
2. **Then**, read the implementation from \`${taskPath}\`
3. **Verify** each acceptance criterion using deterministic tools
4. **Document** all findings in the task JSON

## Acceptance Criteria to Verify

${task.plan?.acceptance_criteria?.map((c, i) => `${i + 1}. ${c}`).join('\n') || 'Read criteria from task JSON'}

## Files to Verify

${task.implementation?.files_created?.map(f => `- ${f}`).join('\n') || 'Read file list from task JSON'}

## Verification Commands

\`\`\`bash
# File existence
test -f "path/to/file" && echo "EXISTS" || echo "MISSING"

# Theme check
shopify theme check --path path/to/file --output json

# Content verification
grep -c "pattern" path/to/file
\`\`\`

## Expected Output

Update task JSON with:
- \`qa.verification_results\`: Pass/fail for each criterion
- \`qa.issues\`: Any problems found (with file paths and line numbers)
- \`qa.summary\`: Overall assessment
- \`meta.status\`: "documentation" if pass, "coding" if fail`,

    documentation: `# Documentation Task: ${task.meta.name}

## Instructions

1. **First**, read your skill file at \`.claude/skills/docs/SKILL.md\`
2. **Then**, read the implementation from \`${taskPath}\`
3. **Create** comprehensive documentation following templates
4. **Update** task JSON with documentation paths

## Implementation Summary

${task.plan?.overview || 'Read from task JSON'}

## Files Implemented

${task.implementation?.files_created?.map(f => `- ${f}`).join('\n') || 'Read from task JSON'}

## Documentation to Create

1. \`docs/sections/${task.meta.slug}/README.md\` - User guide
2. \`docs/sections/${task.meta.slug}/TECHNICAL.md\` - Developer reference
3. \`docs/sections/${task.meta.slug}/CHANGELOG.md\` - Version history

## Expected Output

- Documentation files created
- Update \`documentation.readme_path\`, \`documentation.technical_docs_path\`
- Set \`meta.status\` to "review"`,

    review: `# Final Review: ${task.meta.name}

## Instructions

1. Verify all documentation is complete and accurate
2. Check that implementation matches plan
3. Confirm all acceptance criteria are met
4. Mark task as complete if everything is ready

## Checklist

- [ ] README.md exists and is comprehensive
- [ ] Technical documentation covers all settings
- [ ] Code matches documentation
- [ ] All QA criteria passed

## Expected Output

If everything is complete:
- Set \`meta.status\` to "complete"

If issues found:
- Document issues and set appropriate status`
  };

  return prompts[phase];
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Truncate string for display
 */
export function truncate(str: string, maxLength: number = 100): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Create initial task JSON
 */
export function createTask(
  name: string, 
  requirements?: string, 
  figmaUrl?: string
): Task {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  const now = new Date().toISOString();
  
  return {
    meta: {
      name,
      slug,
      status: 'planning',
      current_phase: 'planning',
      created_at: now,
      updated_at: now,
      qa_attempts: 0,
      figma_url: figmaUrl,
      requirements
    }
  };
}
```

---

## Step 6: Agent Configuration

### File: `.apa/orchestrator/agents.ts`

```typescript
import type { AgentName, ToolName } from './types.js';

/**
 * Agent configuration
 */
export interface AgentConfig {
  name: AgentName;
  description: string;
  tools: ToolName[];
  model: string;
  maxTurns: number;
  systemPromptAddition?: string;
}

/**
 * Tool configurations for each agent
 * 
 * CRITICAL: QA agent has NO Write or Edit tools
 * This prevents accidental code modification during verification
 */
export const AGENT_CONFIGS: Record<AgentName, AgentConfig> = {
  'apa-planner': {
    name: 'apa-planner',
    description: 'Creates implementation plans for Shopify theme sections',
    tools: ['Read', 'Write', 'Bash', 'Grep', 'Glob'],
    model: 'claude-sonnet-4-20250514',
    maxTurns: 50,
    systemPromptAddition: `
You are the APA Planner agent. Your first action MUST be to read your skill file at .claude/skills/plan/SKILL.md.

Follow the skill's methodology exactly:
1. Discovery - Find existing patterns
2. Analysis - Understand requirements
3. Planning - Create detailed plan
4. Documentation - Write to task JSON
`
  },
  
  'apa-coder': {
    name: 'apa-coder',
    description: 'Implements Shopify theme sections following approved plans',
    tools: ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'],
    model: 'claude-sonnet-4-20250514',
    maxTurns: 100,
    systemPromptAddition: `
You are the APA Coder agent. Your first action MUST be to read your skill file at .claude/skills/code/SKILL.md.

Follow the skill's implementation patterns:
1. Read the approved plan from task JSON
2. Implement each task in order
3. Use existing blocks as templates
4. Run theme check after each file
5. Update task JSON with progress
`
  },
  
  'apa-qa': {
    name: 'apa-qa',
    description: 'Validates implementations using deterministic verification',
    tools: ['Read', 'Bash', 'Grep', 'Glob'], // NO Write or Edit!
    model: 'claude-sonnet-4-20250514',
    maxTurns: 30,
    systemPromptAddition: `
You are the APA QA agent. Your first action MUST be to read your skill file at .claude/skills/qa/SKILL.md.

⚠️ CRITICAL CONSTRAINT: You have READ-ONLY access.
You CANNOT use Write or Edit tools. If you find issues:
1. Document them in detail in task JSON
2. Set status back to "coding"
3. Return control to orchestrator

Follow deterministic verification:
1. File integrity checks first
2. Schema validation
3. Theme check execution
4. Content verification with Grep
`
  },
  
  'apa-docs': {
    name: 'apa-docs',
    description: 'Creates comprehensive documentation for completed sections',
    tools: ['Read', 'Write', 'Bash', 'Grep', 'Glob'],
    model: 'claude-sonnet-4-20250514',
    maxTurns: 50,
    systemPromptAddition: `
You are the APA Docs agent. Your first action MUST be to read your skill file at .claude/skills/docs/SKILL.md.

Follow documentation templates:
1. Read implementation details
2. Create README.md with usage guide
3. Create TECHNICAL.md with developer reference
4. Update task JSON with paths
`
  }
};

/**
 * Get agent configuration by name
 */
export function getAgentConfig(name: AgentName): AgentConfig {
  const config = AGENT_CONFIGS[name];
  if (!config) {
    throw new Error(`Unknown agent: ${name}`);
  }
  return config;
}

/**
 * Validate that agent has required tool
 */
export function agentHasTool(agent: AgentName, tool: ToolName): boolean {
  return AGENT_CONFIGS[agent].tools.includes(tool);
}

/**
 * Get tools for agent as comma-separated string
 */
export function getAgentToolsString(agent: AgentName): string {
  return AGENT_CONFIGS[agent].tools.join(', ');
}
```

---

## Step 7: Main Orchestrator

### File: `.apa/orchestrator/orchestrator.ts`

```typescript
import { spawn } from 'child_process';
import { SessionLogger } from './logger.js';
import { getAgentConfig } from './agents.js';
import {
  readTaskJson,
  writeTaskJson,
  getTaskPath,
  getPhase,
  phaseToAgent,
  getNextPhase,
  shouldEscalate,
  isTerminal,
  buildPrompt,
  sleep,
  formatTimestamp
} from './utils.js';
import type { Task, Phase, AgentName, TaskStatus } from './types.js';

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  taskSlug: string;
  dryRun?: boolean;
  verbose?: boolean;
  maxPhases?: number;
}

/**
 * Main orchestrator class
 */
export class Orchestrator {
  private config: OrchestratorConfig;
  private logger: SessionLogger;
  private taskPath: string;
  private phasesExecuted: number = 0;

  constructor(config: OrchestratorConfig) {
    this.config = {
      maxPhases: 10,
      ...config
    };
    this.taskPath = getTaskPath(config.taskSlug);
    this.logger = new SessionLogger(config.taskSlug);
  }

  /**
   * Main orchestration loop
   */
  async run(): Promise<void> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 APA Orchestrator Starting`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📋 Task: ${this.config.taskSlug}`);
    console.log(`📁 Path: ${this.taskPath}`);
    console.log(`📝 Log: ${this.logger.getLogPath()}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      while (this.phasesExecuted < this.config.maxPhases!) {
        const task = readTaskJson(this.taskPath);
        
        // Check terminal states
        if (isTerminal(task)) {
          this.handleTerminalState(task);
          break;
        }
        
        // Check escalation
        if (shouldEscalate(task)) {
          await this.handleEscalation(task);
          break;
        }
        
        // Execute current phase
        const phase = getPhase(task);
        const agent = phaseToAgent(phase);
        
        console.log(`\n${'─'.repeat(40)}`);
        console.log(`📍 Phase: ${phase.toUpperCase()}`);
        console.log(`🤖 Agent: ${agent}`);
        console.log(`⏰ Time: ${formatTimestamp()}`);
        console.log(`${'─'.repeat(40)}\n`);
        
        this.logger.logPhaseStart(phase, agent);
        
        const success = await this.executePhase(phase, agent, task);
        
        this.logger.logPhaseEnd(phase, success);
        this.phasesExecuted++;
        
        // Brief pause between phases
        await sleep(1000);
      }
      
      if (this.phasesExecuted >= this.config.maxPhases!) {
        console.log(`\n⚠️ Max phases (${this.config.maxPhases}) reached`);
        this.logger.logError('Max phases reached', { 
          phases_executed: this.phasesExecuted 
        });
      }
      
    } catch (error) {
      this.logger.logError(error as Error);
      throw error;
    } finally {
      // Generate summary
      const task = readTaskJson(this.taskPath);
      const summary = this.logger.generateSummary(task.meta.status);
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 Session Complete`);
      console.log(`${'='.repeat(60)}`);
      console.log(`📄 Summary: ${this.logger.getSummaryPath()}`);
      console.log(`📁 Log: ${this.logger.getLogPath()}`);
      console.log(`${'='.repeat(60)}\n`);
    }
  }

  /**
   * Execute a single phase
   */
  private async executePhase(
    phase: Phase, 
    agent: AgentName, 
    task: Task
  ): Promise<boolean> {
    const config = getAgentConfig(agent);
    const prompt = buildPrompt(phase, task);
    
    this.logger.logPrompt(prompt);
    
    if (this.config.dryRun) {
      console.log(`[DRY RUN] Would execute ${agent} with prompt:`);
      console.log(prompt.slice(0, 500) + '...\n');
      return true;
    }
    
    try {
      // Execute agent via Claude CLI
      const result = await this.executeAgent(agent, prompt, config);
      
      // Read updated task to check result
      const updatedTask = readTaskJson(this.taskPath);
      
      // Log phase transition if status changed
      if (updatedTask.meta.status !== task.meta.status) {
        this.logger.logPhaseTransition(
          phase,
          updatedTask.meta.status,
          'Agent completed phase'
        );
      }
      
      return !result.isError;
      
    } catch (error) {
      this.logger.logError(error as Error, { phase, agent });
      console.error(`\n❌ Phase ${phase} failed:`, error);
      return false;
    }
  }

  /**
   * Execute agent via Claude CLI
   */
  private async executeAgent(
    agent: AgentName,
    prompt: string,
    config: ReturnType<typeof getAgentConfig>
  ): Promise<{ isError: boolean; output: string }> {
    return new Promise((resolve, reject) => {
      // Build Claude CLI command
      const args = [
        '--print', // Print output to stdout
        '--allowedTools', config.tools.join(','),
        '--model', config.model,
        '--max-turns', config.maxTurns.toString(),
        '-p', prompt // Prompt
      ];
      
      if (this.config.verbose) {
        console.log(`\n🔧 Executing: claude ${args.join(' ').slice(0, 100)}...\n`);
      }
      
      const proc = spawn('claude', args, {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          // Ensure agent uses project settings
          CLAUDE_CODE_SETTINGS_SOURCES: 'project'
        }
      });
      
      let stdout = '';
      let stderr = '';
      
      proc.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        
        // Stream output to console
        if (this.config.verbose) {
          process.stdout.write(text);
        }
        
        // Log tool calls (parse from output)
        this.parseAndLogToolCalls(text);
      });
      
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      proc.on('close', (code) => {
        if (code === 0) {
          this.logger.logResponse(stdout, 0, undefined);
          resolve({ isError: false, output: stdout });
        } else {
          this.logger.logError(`Process exited with code ${code}`, { stderr });
          resolve({ isError: true, output: stderr });
        }
      });
      
      proc.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Parse tool calls from agent output and log them
   */
  private parseAndLogToolCalls(output: string): void {
    // Simple parsing - look for tool markers in output
    // This is a simplified version; real implementation would parse structured output
    const toolPatterns = [
      /Using tool: (\w+)/g,
      /Tool: (\w+)/g,
      /Calling (\w+)/g
    ];
    
    for (const pattern of toolPatterns) {
      let match;
      while ((match = pattern.exec(output)) !== null) {
        this.logger.logToolCall(match[1], {});
      }
    }
  }

  /**
   * Handle terminal task state
   */
  private handleTerminalState(task: Task): void {
    if (task.meta.status === 'complete') {
      console.log(`\n✅ Task completed successfully!`);
      console.log(`   Section: ${task.meta.name}`);
      if (task.documentation?.readme_path) {
        console.log(`   Docs: ${task.documentation.readme_path}`);
      }
    } else if (task.meta.status === 'escalated') {
      console.log(`\n🚨 Task escalated - human intervention required`);
      console.log(`   Reason: ${task.meta.escalation_reason}`);
    }
  }

  /**
   * Handle escalation after max QA attempts
   */
  private async handleEscalation(task: Task): Promise<void> {
    const reason = `QA failed ${task.meta.qa_attempts} times`;
    
    console.log(`\n🚨 Escalating task: ${reason}`);
    
    this.logger.logEscalation(reason, task.meta.qa_attempts);
    
    // Update task status
    task.meta.status = 'escalated';
    task.meta.escalation_reason = reason;
    writeTaskJson(this.taskPath, task);
    
    // Print QA issues if available
    if (task.qa?.issues && task.qa.issues.length > 0) {
      console.log(`\n📋 Outstanding Issues:`);
      task.qa.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. [${issue.severity}] ${issue.description}`);
        if (issue.file) {
          console.log(`      File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
        }
      });
    }
  }
}
```

---

## Step 8: CLI Entry Point

### File: `.apa/orchestrator/index.ts`

```typescript
#!/usr/bin/env node

import { Orchestrator } from './orchestrator.js';
import { createTask, writeTaskJson, getTaskPath } from './utils.js';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

/**
 * Parse command line arguments
 */
function parseArgs(): {
  command: string;
  taskSlug?: string;
  name?: string;
  requirements?: string;
  figmaUrl?: string;
  dryRun: boolean;
  verbose: boolean;
} {
  const args = process.argv.slice(2);
  const result = {
    command: args[0] || 'help',
    taskSlug: undefined as string | undefined,
    name: undefined as string | undefined,
    requirements: undefined as string | undefined,
    figmaUrl: undefined as string | undefined,
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };
  
  // Find positional args
  const positional = args.filter(a => !a.startsWith('--') && !a.startsWith('-'));
  
  if (result.command === 'run' && positional[1]) {
    result.taskSlug = positional[1];
  } else if (result.command === 'create') {
    result.name = positional[1];
  }
  
  // Parse named args
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--requirements' && args[i + 1]) {
      result.requirements = args[i + 1];
    }
    if (args[i] === '--figma' && args[i + 1]) {
      result.figmaUrl = args[i + 1];
    }
  }
  
  return result;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
APA Orchestrator - Automated Production Assistant

Usage:
  npm start <command> [options]

Commands:
  run <task-slug>     Run orchestration for existing task
  create <name>       Create new task JSON
  help                Show this help message

Options:
  --dry-run           Show what would happen without executing
  --verbose, -v       Show detailed output
  --requirements      Task requirements (for create)
  --figma             Figma URL (for create)

Examples:
  # Create a new task
  npm start create "Hero Section" --figma "https://figma.com/..."

  # Run orchestration
  npm start run hero-section

  # Dry run to preview
  npm start run hero-section --dry-run --verbose
`);
}

/**
 * Create a new task
 */
function createNewTask(name: string, requirements?: string, figmaUrl?: string): void {
  const task = createTask(name, requirements, figmaUrl);
  const taskPath = getTaskPath(task.meta.slug);
  
  // Ensure directory exists
  const dir = dirname(taskPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  writeTaskJson(taskPath, task);
  
  console.log(`\n✅ Created task: ${task.meta.name}`);
  console.log(`   Slug: ${task.meta.slug}`);
  console.log(`   Path: ${taskPath}`);
  console.log(`\nNext steps:`);
  console.log(`   1. Edit ${taskPath} to add requirements`);
  console.log(`   2. Run: npm start run ${task.meta.slug}`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = parseArgs();
  
  switch (args.command) {
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
      
    case 'create':
      if (!args.name) {
        console.error('Error: Task name required');
        console.error('Usage: npm start create "Task Name"');
        process.exit(1);
      }
      createNewTask(args.name, args.requirements, args.figmaUrl);
      break;
      
    case 'run':
      if (!args.taskSlug) {
        console.error('Error: Task slug required');
        console.error('Usage: npm start run <task-slug>');
        process.exit(1);
      }
      
      const taskPath = getTaskPath(args.taskSlug);
      if (!existsSync(taskPath)) {
        console.error(`Error: Task not found: ${taskPath}`);
        console.error(`Create it first: npm start create "Task Name"`);
        process.exit(1);
      }
      
      const orchestrator = new Orchestrator({
        taskSlug: args.taskSlug,
        dryRun: args.dryRun,
        verbose: args.verbose
      });
      
      await orchestrator.run();
      break;
      
    default:
      console.error(`Unknown command: ${args.command}`);
      printHelp();
      process.exit(1);
  }
}

// Run
main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});
```

---

## Step 9: Task JSON Examples

### File: `.apa/tasks/hero-section.json` (Example)

```json
{
  "meta": {
    "name": "Hero Section",
    "slug": "hero-section",
    "status": "planning",
    "current_phase": "planning",
    "created_at": "2025-12-11T20:00:00.000Z",
    "updated_at": "2025-12-11T20:00:00.000Z",
    "qa_attempts": 0,
    "figma_url": "https://www.figma.com/design/xxx/yyy?node-id=123-456",
    "requirements": "Full-width hero section with animated gradient background, heading, subheading, and CTA button. Must support light/dark mode and be fully responsive."
  }
}
```

### Complete Task After All Phases (Example)

```json
{
  "meta": {
    "name": "Hero Section",
    "slug": "hero-section",
    "status": "complete",
    "current_phase": "review",
    "created_at": "2025-12-11T20:00:00.000Z",
    "updated_at": "2025-12-11T21:30:00.000Z",
    "qa_attempts": 1
  },
  "plan": {
    "overview": "Full-width hero section with animated gradient background. Uses existing gradient-block as base, adds new hero-section.liquid with schema for heading, subheading, and CTA.",
    "technical_approach": "Extend gradient-block pattern, add CSS custom properties for theming, JavaScript optional enhancement for animation.",
    "tasks": [
      {
        "id": "task-001",
        "description": "Create hero-section.liquid with schema",
        "status": "complete",
        "files_affected": ["sections/hero-section.liquid"],
        "acceptance_criteria": [
          "File exists at sections/hero-section.liquid",
          "Schema includes heading, subheading, cta_text, cta_link settings",
          "Preset defined for theme editor"
        ]
      },
      {
        "id": "task-002",
        "description": "Add gradient-bg block support",
        "status": "complete",
        "files_affected": ["blocks/gradient-bg.liquid"],
        "acceptance_criteria": [
          "Block renders gradient background",
          "Supports start/end colors and angle"
        ]
      }
    ],
    "acceptance_criteria": [
      "Section renders in theme editor",
      "All settings functional",
      "Responsive on mobile/tablet/desktop",
      "No theme check errors"
    ],
    "created_at": "2025-12-11T20:10:00.000Z",
    "created_by": "apa-planner"
  },
  "implementation": {
    "files_created": [
      "sections/hero-section.liquid",
      "assets/hero-section.css"
    ],
    "files_modified": [
      "blocks/gradient-bg.liquid"
    ],
    "completed_tasks": ["task-001", "task-002"],
    "started_at": "2025-12-11T20:20:00.000Z",
    "completed_at": "2025-12-11T20:45:00.000Z"
  },
  "qa": {
    "verification_results": [
      {
        "criterion": "File exists at sections/hero-section.liquid",
        "status": "pass",
        "details": "File exists, size: 2.4KB",
        "verified_at": "2025-12-11T20:50:00.000Z"
      },
      {
        "criterion": "Schema includes required settings",
        "status": "pass",
        "details": "All 4 settings found",
        "verified_at": "2025-12-11T20:50:00.000Z"
      },
      {
        "criterion": "No theme check errors",
        "status": "pass",
        "details": "0 errors, 0 warnings",
        "verified_at": "2025-12-11T20:51:00.000Z"
      }
    ],
    "issues": [],
    "summary": {
      "total_criteria": 4,
      "passed": 4,
      "failed": 0,
      "recommendation": "proceed"
    },
    "verified_at": "2025-12-11T20:51:00.000Z"
  },
  "documentation": {
    "readme_path": "docs/sections/hero-section/README.md",
    "technical_docs_path": "docs/sections/hero-section/TECHNICAL.md",
    "created_at": "2025-12-11T21:10:00.000Z"
  }
}
```

---

## Installation & First Run

### Step-by-Step Setup

```bash
# 1. Navigate to project root
cd /path/to/your/theme-project

# 2. Create orchestrator directory
mkdir -p .apa/orchestrator

# 3. Create all files from this guide
# (Copy each file to its location)

# 4. Create agent definitions
mkdir -p .claude/agents
# (Copy agent .md files)

# 5. Initialize orchestrator
cd .apa/orchestrator
npm install

# 6. Verify installation
npm run typecheck

# 7. Create tasks directory
mkdir -p ../.apa/tasks

# 8. Create first task
npm start create "Hero Section" --figma "https://figma.com/..."

# 9. Run orchestration (dry run first)
npm start run hero-section --dry-run --verbose

# 10. Run for real
npm start run hero-section --verbose
```

### Quick Start Script

```bash
#!/bin/bash
# setup-apa.sh - Run from project root

set -e

echo "🚀 Setting up APA Orchestrator..."

# Create directories
mkdir -p .apa/{orchestrator,tasks,logs}
mkdir -p .claude/agents

# Initialize npm project
cd .apa/orchestrator
npm init -y
npm install @anthropic-ai/claude-code zod
npm install -D typescript tsx @types/node

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy TypeScript files to .apa/orchestrator/"
echo "  2. Copy agent definitions to .claude/agents/"
echo "  3. Run: cd .apa/orchestrator && npm start create 'Your Section'"
```

---

## Verification Checklist

### Pre-Flight Checks

```bash
# Check Node.js version
node --version  # Should be v20+

# Check Claude CLI
claude --version

# Check API key
echo $ANTHROPIC_API_KEY | head -c 10

# Verify directory structure
tree .claude/agents .claude/skills -L 2

# Verify orchestrator files
ls -la .apa/orchestrator/

# Run typecheck
cd .apa/orchestrator && npm run typecheck
```

### After First Run

- [ ] Log file created in `.apa/logs/*.jsonl`
- [ ] Summary file created in `.apa/logs/*-summary.md`
- [ ] Task JSON updated with plan content
- [ ] No TypeScript errors
- [ ] No unexpected errors in console

---

## Debugging Guide

### Common Issues

**Issue: "Task file not found"**
```bash
# Check task exists
ls -la .apa/tasks/

# Create if missing
npm start create "Task Name"
```

**Issue: "Unknown agent"**
```bash
# Check agent definitions exist
ls -la .claude/agents/

# Verify frontmatter format
head -20 .claude/agents/apa-planner.md
```

**Issue: "Claude command not found"**
```bash
# Check Claude CLI installation
which claude

# Install if needed
npm install -g @anthropic-ai/claude-code
```

**Issue: "Permission denied"**
```bash
# Make scripts executable
chmod +x .apa/orchestrator/index.ts
```

### Log Analysis

```bash
# View all events
cat .apa/logs/*.jsonl | jq .

# Filter by event type
cat .apa/logs/*.jsonl | jq 'select(.event_type == "tool_call")'

# Filter by phase
cat .apa/logs/*.jsonl | jq 'select(.phase == "coding")'

# Count tool calls by type
cat .apa/logs/*.jsonl | jq -r 'select(.event_type == "tool_call") | .data.tool' | sort | uniq -c

# Find errors
cat .apa/logs/*.jsonl | jq 'select(.event_type == "error")'

# Calculate total tokens
cat .apa/logs/*.jsonl | jq -r 'select(.token_usage) | .token_usage | (.input + .output)' | awk '{sum+=$1} END {print sum}'
```

---

## SDK Reference

### Key SDK Functions

```typescript
// Import from CLI package
import { spawn } from 'child_process';

// Execute via CLI (recommended for now)
const proc = spawn('claude', [
  '--print',
  '--allowedTools', 'Read,Write,Bash',
  '--model', 'claude-sonnet-4-20250514',
  '--max-turns', '50',
  '-p', prompt
]);

// Alternative: Direct SDK import (when available)
// import { query } from '@anthropic-ai/claude-code';
// const result = await query({ prompt, options: {...} });
```

### Tool Names

| Tool | Description |
|------|-------------|
| `Read` | Read file contents |
| `Write` | Create/overwrite files |
| `Edit` | Modify existing files |
| `Bash` | Execute shell commands |
| `Grep` | Search file contents |
| `Glob` | Find files by pattern |

### Permission Modes

| Mode | Description |
|------|-------------|
| `default` | Ask for permission on each action |
| `acceptEdits` | Auto-approve file edits |
| `bypassPermissions` | Skip all permission checks |

---

## Next Steps & Enhancements

### Immediate (After Basic Setup Works)

1. **Add retry logic** for transient API errors
2. **Implement progress indicators** for long-running phases
3. **Add timeout handling** for stuck agents
4. **Create test task** with known good output

### Short-term (Week 1-2)

1. **Parallel phase execution** for independent tasks
2. **Resume capability** for interrupted orchestrations
3. **Webhook notifications** for phase completions
4. **Cost tracking** per phase and total

### Medium-term (Month 1)

1. **Web dashboard** for monitoring multiple orchestrations
2. **Task templates** for common section types
3. **Figma MCP integration** for direct design extraction
4. **Git integration** for automatic commits per phase

### Advanced (Future)

1. **Learning from history** - improve prompts based on past runs
2. **Multi-task orchestration** - parallel work on multiple sections
3. **Human-in-the-loop UI** - review and approve plans in browser
4. **Metrics and analytics** - success rates, time per phase, etc.

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    APA ORCHESTRATOR COMMANDS                 │
├─────────────────────────────────────────────────────────────┤
│ Create task:    npm start create "Name" --figma URL         │
│ Run task:       npm start run task-slug                     │
│ Dry run:        npm start run task-slug --dry-run           │
│ Verbose:        npm start run task-slug --verbose           │
├─────────────────────────────────────────────────────────────┤
│                         PHASES                               │
├─────────────────────────────────────────────────────────────┤
│ planning → coding → qa → documentation → review → complete  │
├─────────────────────────────────────────────────────────────┤
│                         AGENTS                               │
├─────────────────────────────────────────────────────────────┤
│ apa-planner  │ All tools      │ Creates implementation plan │
│ apa-coder    │ All tools      │ Implements the code         │
│ apa-qa       │ READ-ONLY      │ Verifies implementation     │
│ apa-docs     │ All tools      │ Creates documentation       │
├─────────────────────────────────────────────────────────────┤
│                      KEY PATHS                               │
├─────────────────────────────────────────────────────────────┤
│ Tasks:    .apa/tasks/{slug}.json                            │
│ Logs:     .apa/logs/{session}.jsonl                         │
│ Agents:   .claude/agents/apa-*.md                           │
│ Skills:   .claude/skills/{phase}/SKILL.md                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-11 | Initial comprehensive guide |

---

*This guide synthesizes insights from Anthropic's harness engineering research, HumanLayer's best practices, and multi-agent orchestration patterns to create a production-ready system for Shopify theme automation.*
