# APA Agent System - Complete Handover

> **Date**: December 10, 2025
> **Purpose**: Continue building the APA multi-agent system from local Claude Code
> **Status**: Architecture designed, ready to implement

---

## Quick Start

Read these files in order:
1. `00-START-HERE.md` - This file (overview)
2. `01-ARCHITECTURE.md` - System design and decisions
3. `02-SKILLS-STRUCTURE.md` - Skill library design
4. `03-TASK-JSON-SCHEMA.md` - Task state management
5. `04-CLAUDE-MD-TEMPLATE.md` - The minimal CLAUDE.md
6. `05-PATTERNS-TEMPLATES.md` - Pattern doc templates
7. `06-RESEARCH-SOURCES.md` - Key insights from source materials

---

## What We're Building

A **skill-based orchestration system** on top of Claude Code SDK that automates Shopify theme section development from Figma designs.

**NOT** 4 separate agents, but **1 Claude Code agent** with **4 skills** it loads as needed:
- Plan Skill (discovery, design interpretation, planning)
- Code Skill (implementation)
- QA Skill (verification)
- Docs Skill (documentation generation)

---

## Core Principles

1. **Skills = Procedural Knowledge** - Folders with expertise Claude loads on demand
2. **Progressive Disclosure** - CLAUDE.md routes to skills, skills route to details
3. **Less Instructions = Better** - ~150-200 instruction limit, Claude Code uses ~50 already
4. **JSON for Task State** - Agents less likely to corrupt JSON vs markdown
5. **Deterministic Tools First** - Use `shopify theme check`, not Claude for linting
6. **Pointers Not Copies** - Reference `file:line`, don't copy code into docs
7. **3-Attempt Limit** - QA failures escalate to human after 3 tries

---

## Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Theme Architecture | Theme Blocks (Horizon) | No build tools, no Tailwind |
| Agent Framework | Claude Code SDK | Production-ready, MCP support |
| Task Tracking | JSON files | Agents won't inappropriately modify |
| Context Management | Skills (progressive disclosure) | Stay under instruction limit |
| Verification | `shopify theme check` + MCP | Deterministic where possible |
| Block Discovery | `ls blocks/` at runtime | Always current, no stale registry |

---

## Next Steps (Priority Order)

1. **Show repo structure** to Claude Code - blocks/, sections/, existing patterns
2. **Identify 2-3 gold standard sections** - Agent learns from examples
3. **Draft pattern docs** - schema.md, liquid.md, css.md, js.md
4. **Create skill SKILL.md files** - Plan, Code, QA, Docs
5. **Build task JSON schema** - Formalize the structure
6. **Write orchestrator** - TypeScript on Claude Code SDK
7. **Test with simple section** - End-to-end validation

---

## Files in This Handover

```
apa-handover/
├── 00-START-HERE.md           # This file
├── 01-ARCHITECTURE.md         # Full system architecture
├── 02-SKILLS-STRUCTURE.md     # Skill folder design
├── 03-TASK-JSON-SCHEMA.md     # Complete JSON schema
├── 04-CLAUDE-MD-TEMPLATE.md   # Ready-to-use CLAUDE.md
├── 05-PATTERNS-TEMPLATES.md   # Pattern doc templates
└── 06-RESEARCH-SOURCES.md     # Key insights from sources
```

---

## To Continue in Claude Code

```bash
# Open Claude Code in your apa-base directory
cd /path/to/apa-base
claude

# Then say:
"I'm building an automated theme section development system. 
Read the handover files in [path/to/apa-handover/] starting with 00-START-HERE.md.
Then let's examine my repo structure so you can help draft the pattern docs."
```
