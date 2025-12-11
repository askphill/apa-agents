# Compound Engineering Integration Plan

> Detailed implementation guide for adding compound learning capabilities to the APA Orchestrator

## Executive Summary

This plan integrates compound engineering into your existing orchestrator, transforming it from a stateless executor into a **learning system** where each task improves future tasks. The implementation adds:

1. **Compound Agent** - Extracts learnings from every session
2. **Knowledge Base** - Accumulates patterns and anti-patterns
3. **Smart Context Injection** - Feeds learnings into future planning/coding/QA
4. **Metrics Tracking** - Proves the compound effect is working

**Estimated Implementation Time:** 4-6 hours

---

## Table of Contents

1. [Architecture Changes](#1-architecture-changes)
2. [New Files to Create](#2-new-files-to-create)
3. [Existing Files to Modify](#3-existing-files-to-modify)
4. [Implementation Steps](#4-implementation-steps)
5. [Testing Strategy](#5-testing-strategy)
6. [Verification Checklist](#6-verification-checklist)

---

## 1. Architecture Changes

### Updated Phase Flow

**Before:**
```
planning → coding → qa → documentation → review → complete
```

**After:**
```
planning → coding → qa → COMPOUND → documentation → review → complete
                     ↓
              (on failure)
                     ↓
              COMPOUND → coding (retry)
```

**Key change:** Compound phase runs:
- After QA passes (capture success patterns)
- After QA fails but before retry (capture failure patterns)
- After escalation (capture what went wrong)

### New Directory Structure

```
.apa/
├── orchestrator/
│   ├── index.ts
│   ├── orchestrator.ts      # MODIFY: Add compound phase
│   ├── types.ts             # MODIFY: Add compound types
│   ├── agents.ts            # MODIFY: Add compound agent config
│   ├── utils.ts             # MODIFY: Add knowledge helpers
│   ├── logger.ts
│   └── compound.ts          # NEW: Compound phase logic
│
├── tasks/
├── logs/
│
├── learnings/               # NEW: Per-session learnings
│   └── .gitkeep
│
└── knowledge/               # NEW: Cumulative knowledge base
    ├── patterns.md          # NEW: Successful patterns
    ├── anti-patterns.md     # NEW: Failures to avoid
    ├── insights.md          # NEW: General insights
    └── metrics.json         # NEW: Compound metrics

.claude/
├── agents/
│   ├── apa-planner.md       # MODIFY: Add knowledge reading
│   ├── apa-coder.md         # MODIFY: Add pattern references
│   ├── apa-qa.md            # MODIFY: Add failure point checks
│   ├── apa-docs.md
│   └── apa-compound.md      # NEW: Compound agent
│
└── skills/
    ├── plan/
    ├── code/
    ├── qa/
    ├── docs/
    └── compound/            # NEW: Compound skill
        └── SKILL.md
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              KNOWLEDGE LAYER                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────────────┐ │
│  │  patterns.md    │  │ anti-patterns.md │  │  learnings/{task}-{ts}.md  │ │
│  │  (grows)        │  │  (grows)         │  │  (one per session)          │ │
│  └────────┬────────┘  └────────┬─────────┘  └──────────────┬──────────────┘ │
│           │                    │                           │                 │
│           └────────────────────┼───────────────────────────┘                 │
│                                │                                             │
│                                ▼                                             │
│                    ┌───────────────────────┐                                │
│                    │   Knowledge Helpers   │                                │
│                    │   (utils.ts)          │                                │
│                    └───────────┬───────────┘                                │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   PLANNING    │      │     CODING      │      │       QA        │
│               │      │                 │      │                 │
│ Reads:        │      │ Reads:          │      │ Reads:          │
│ - patterns    │      │ - patterns      │      │ - anti-patterns │
│ - anti-patterns│     │ - similar tasks │      │ - common failures│
│ - similar tasks│     │                 │      │                 │
└───────────────┘      └─────────────────┘      └────────┬────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────┐
                                               │    COMPOUND     │
                                               │                 │
                                               │ Writes:         │
                                               │ - learnings/    │
                                               │ - patterns.md   │
                                               │ - anti-patterns │
                                               │ - metrics.json  │
                                               └─────────────────┘
```

---

## 2. New Files to Create

### 2.1 Compound Agent Definition

**File:** `.claude/agents/apa-compound.md`

```markdown
---
name: apa-compound
description: Analyzes session outcomes and extracts learnings to improve future sessions
tools: Read, Write, Bash, Grep, Glob
model: claude-sonnet-4-20250514
---

# APA Compound Agent

You are the learning specialist for the Automated Production Assistant (APA) system. Your role is to analyze completed sessions and extract learnings that make future sessions more successful.

## Core Principle

> "Each feature should make the next feature easier to build."

Your job is to ensure this happens by capturing institutional knowledge after every session.

## Initialization Sequence

**ALWAYS execute these steps first:**

1. Read your skill file: `.claude/skills/compound/SKILL.md`
2. Read the task JSON for session context
3. Read the session log for detailed events
4. Follow the skill's analysis methodology

## Your Responsibilities

### 1. Analyze Session Outcome

- What was the task trying to accomplish?
- Did it succeed on first QA attempt?
- If not, what went wrong and why?
- What tools were used most/least?

### 2. Extract Patterns

**For successful sessions:**
- What approaches worked well?
- Are there reusable code patterns?
- What made this efficient?

**For failed/retry sessions:**
- What was the root cause?
- Was this preventable?
- What check would have caught this earlier?

### 3. Document Learnings

Write a structured learnings file to `.apa/learnings/{task-slug}-{timestamp}.md`

### 4. Update Knowledge Base

Append to cumulative files:
- `.apa/knowledge/patterns.md` - Add successful patterns
- `.apa/knowledge/anti-patterns.md` - Add failure patterns
- `.apa/knowledge/metrics.json` - Update statistics

### 5. Propose Skill Updates

If a pattern appears 3+ times, propose adding it to the relevant skill file.

## Output Requirements

Your learnings document MUST include:

- [ ] Session outcome (pass/fail/escalated)
- [ ] What worked (with file references)
- [ ] What didn't work (with root cause)
- [ ] Recommendations for future similar tasks
- [ ] Reusability assessment

## Success Criteria

Your analysis is complete when:

1. Learnings file created at correct path
2. Knowledge base files updated appropriately
3. Metrics incremented
4. Task JSON updated with compound section
5. Actionable insights documented (not generic observations)

## Anti-Patterns to Avoid

- ❌ Generic observations like "the task completed successfully"
- ❌ Missing file path references
- ❌ Learnings that aren't actionable
- ❌ Skipping the metrics update
- ❌ Not reading the session log for details
```

### 2.2 Compound Skill

**File:** `.claude/skills/compound/SKILL.md`

```markdown
# Compound Learning Skill

## Purpose

Extract actionable learnings from orchestration sessions to create a compounding knowledge effect where each task improves future tasks.

## Analysis Methodology

### Phase 1: Context Gathering

```bash
# Read task JSON for outcomes
cat .apa/tasks/{task-slug}.json | jq '.meta, .qa'

# Read session log for tool usage
cat .apa/logs/{session-id}.jsonl | jq -s '
  group_by(.event_type) | 
  map({type: .[0].event_type, count: length})
'

# Check QA results specifically
cat .apa/tasks/{task-slug}.json | jq '.qa.verification_results'
```

### Phase 2: Pattern Identification

**Success Indicators:**
- First-pass QA success
- Below-average tool call count
- No error events in log
- Clean theme check output

**Failure Indicators:**
- Multiple QA attempts
- Error events in log
- Theme check warnings/errors
- Escalation triggered

### Phase 3: Root Cause Analysis (for failures)

Use the "5 Whys" technique:

1. **What failed?** → QA criterion X failed
2. **Why did it fail?** → Missing element in schema
3. **Why was it missing?** → Planner didn't specify it
4. **Why didn't planner specify?** → No similar task reference
5. **Root cause** → Knowledge gap in planning phase

### Phase 4: Learnings Documentation

#### Learnings File Template

```markdown
# Session Learnings: {Task Name}

**Date:** {timestamp}
**Session ID:** {session-id}
**Duration:** {duration}

## Outcome Summary

| Metric | Value |
|--------|-------|
| Status | {pass/fail/escalated} |
| QA Attempts | {number} |
| Tool Calls | {number} |
| Errors | {number} |

## What Worked Well

### Pattern: {Name}

**Description:** {What the pattern does}

**Files involved:**
- `{file-path-1}`
- `{file-path-2}`

**Why it worked:** {Explanation}

**Reusable:** Yes/No

**Code snippet (if applicable):**
```liquid
{code}
```

## What Didn't Work

### Issue: {Name}

**Description:** {What went wrong}

**Root cause:** {5 Whys result}

**Files involved:**
- `{file-path}` (line {number})

**How it was fixed:** {Resolution}

**Prevention:** {How to avoid in future}

## Recommendations

### For Similar Tasks

1. {Specific recommendation with rationale}
2. {Specific recommendation with rationale}

### Skill Updates Proposed

| Skill | Proposed Change | Rationale |
|-------|-----------------|-----------|
| {skill} | {change} | {why} |

## Tags

`{task-type}` `{patterns-used}` `{outcome}`
```

### Phase 5: Knowledge Base Updates

#### Updating patterns.md

```markdown
## Pattern: {Name}

**Added:** {date}
**Source:** {task-slug}
**Success count:** {n}

**Description:**
{What this pattern accomplishes}

**When to use:**
{Conditions where this applies}

**Implementation:**
{How to apply this pattern}

**Example:**
```liquid
{code example}
```

**References:**
- Original task: `.apa/learnings/{task-slug}-{timestamp}.md`
- Files: `{file-paths}`

---
```

#### Updating anti-patterns.md

```markdown
## Anti-Pattern: {Name}

**Added:** {date}
**Source:** {task-slug}
**Failure count:** {n}

**Description:**
{What this anti-pattern looks like}

**Why it fails:**
{Root cause explanation}

**Detection:**
{How to spot this during planning/coding}

**Prevention:**
{Specific steps to avoid}

**Related QA checks:**
- {Check that would catch this}

---
```

### Phase 6: Metrics Update

Update `.apa/knowledge/metrics.json`:

```typescript
{
  // Increment total
  total_sessions: previous + 1,
  
  // Update success tracking
  first_pass_successes: previous + (firstPass ? 1 : 0),
  first_pass_rate: first_pass_successes / total_sessions,
  
  // Track attempts
  total_qa_attempts: previous + qa_attempts,
  average_qa_attempts: total_qa_attempts / total_sessions,
  
  // Track by task type
  by_task_type: {
    [taskType]: {
      count: previous + 1,
      first_pass_rate: ...
    }
  },
  
  // Monthly tracking for trends
  by_month: {
    [currentMonth]: {
      sessions: previous + 1,
      first_pass_rate: ...
    }
  },
  
  // Pattern tracking
  patterns_identified: previous + new_patterns,
  anti_patterns_identified: previous + new_anti_patterns
}
```

## Quality Checklist

Before completing compound phase:

- [ ] Learnings file has specific file references (not generic)
- [ ] Root cause identified for any failures
- [ ] Patterns are actionable (someone could apply them)
- [ ] Anti-patterns include prevention steps
- [ ] Metrics JSON is valid and updated
- [ ] Task JSON compound section is populated
```

### 2.3 Compound Phase Logic

**File:** `.apa/orchestrator/compound.ts`

```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import type { Task, LogEntry } from './types.js';

// ============================================================================
// Types
// ============================================================================

export interface CompoundMetrics {
  total_sessions: number;
  first_pass_successes: number;
  first_pass_rate: number;
  total_qa_attempts: number;
  average_qa_attempts: number;
  patterns_identified: number;
  anti_patterns_identified: number;
  by_task_type: Record<string, {
    count: number;
    first_pass_rate: number;
    total_qa_attempts: number;
  }>;
  by_month: Record<string, {
    sessions: number;
    first_pass_rate: number;
  }>;
  last_updated: string;
}

export interface PatternMatch {
  name: string;
  relevance: number;
  source: string;
  summary: string;
}

// ============================================================================
// Path Constants
// ============================================================================

const KNOWLEDGE_DIR = join(process.cwd(), '.apa', 'knowledge');
const LEARNINGS_DIR = join(process.cwd(), '.apa', 'learnings');
const PATTERNS_FILE = join(KNOWLEDGE_DIR, 'patterns.md');
const ANTI_PATTERNS_FILE = join(KNOWLEDGE_DIR, 'anti-patterns.md');
const INSIGHTS_FILE = join(KNOWLEDGE_DIR, 'insights.md');
const METRICS_FILE = join(KNOWLEDGE_DIR, 'metrics.json');

// ============================================================================
// Initialization
// ============================================================================

/**
 * Ensure all knowledge directories and files exist
 */
export function initializeKnowledgeBase(): void {
  // Create directories
  if (!existsSync(KNOWLEDGE_DIR)) {
    mkdirSync(KNOWLEDGE_DIR, { recursive: true });
  }
  if (!existsSync(LEARNINGS_DIR)) {
    mkdirSync(LEARNINGS_DIR, { recursive: true });
  }

  // Initialize patterns.md
  if (!existsSync(PATTERNS_FILE)) {
    writeFileSync(PATTERNS_FILE, `# Successful Patterns

> This file accumulates patterns that have proven successful across tasks.
> Each pattern includes context on when and how to apply it.

---

<!-- Patterns will be appended below -->

`);
  }

  // Initialize anti-patterns.md
  if (!existsSync(ANTI_PATTERNS_FILE)) {
    writeFileSync(ANTI_PATTERNS_FILE, `# Anti-Patterns to Avoid

> This file documents approaches that have failed, with root cause analysis.
> Reference this during planning to avoid repeating mistakes.

---

<!-- Anti-patterns will be appended below -->

`);
  }

  // Initialize insights.md
  if (!existsSync(INSIGHTS_FILE)) {
    writeFileSync(INSIGHTS_FILE, `# General Insights

> Cross-cutting learnings that don't fit into specific patterns.

---

<!-- Insights will be appended below -->

`);
  }

  // Initialize metrics.json
  if (!existsSync(METRICS_FILE)) {
    const initialMetrics: CompoundMetrics = {
      total_sessions: 0,
      first_pass_successes: 0,
      first_pass_rate: 0,
      total_qa_attempts: 0,
      average_qa_attempts: 0,
      patterns_identified: 0,
      anti_patterns_identified: 0,
      by_task_type: {},
      by_month: {},
      last_updated: new Date().toISOString()
    };
    writeFileSync(METRICS_FILE, JSON.stringify(initialMetrics, null, 2));
  }
}

// ============================================================================
// Knowledge Reading (for other phases)
// ============================================================================

/**
 * Get relevant patterns for a task based on keywords
 */
export function getRelevantPatterns(taskName: string, limit: number = 5): PatternMatch[] {
  if (!existsSync(PATTERNS_FILE)) return [];
  
  const content = readFileSync(PATTERNS_FILE, 'utf-8');
  const keywords = extractKeywords(taskName);
  
  // Parse patterns (split by ## Pattern:)
  const patterns = content.split(/## Pattern:/).slice(1);
  
  const matches: PatternMatch[] = patterns
    .map(p => {
      const lines = p.trim().split('\n');
      const name = lines[0]?.trim() || 'Unknown';
      const relevance = calculateRelevance(p, keywords);
      const sourceMatch = p.match(/\*\*Source:\*\* (.+)/);
      const source = sourceMatch ? sourceMatch[1] : 'unknown';
      
      // Extract first paragraph as summary
      const descMatch = p.match(/\*\*Description:\*\*\n([^\n]+)/);
      const summary = descMatch ? descMatch[1] : lines.slice(1, 3).join(' ').slice(0, 150);
      
      return { name, relevance, source, summary };
    })
    .filter(p => p.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
  
  return matches;
}

/**
 * Get relevant anti-patterns for a task
 */
export function getRelevantAntiPatterns(taskName: string, limit: number = 5): PatternMatch[] {
  if (!existsSync(ANTI_PATTERNS_FILE)) return [];
  
  const content = readFileSync(ANTI_PATTERNS_FILE, 'utf-8');
  const keywords = extractKeywords(taskName);
  
  const patterns = content.split(/## Anti-Pattern:/).slice(1);
  
  const matches: PatternMatch[] = patterns
    .map(p => {
      const lines = p.trim().split('\n');
      const name = lines[0]?.trim() || 'Unknown';
      const relevance = calculateRelevance(p, keywords);
      const sourceMatch = p.match(/\*\*Source:\*\* (.+)/);
      const source = sourceMatch ? sourceMatch[1] : 'unknown';
      const summary = lines.slice(1, 3).join(' ').slice(0, 150);
      
      return { name, relevance, source, summary };
    })
    .filter(p => p.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
  
  return matches;
}

/**
 * Get learnings from similar past tasks
 */
export function getSimilarTaskLearnings(taskName: string, limit: number = 3): string[] {
  if (!existsSync(LEARNINGS_DIR)) return [];
  
  const files = readdirSync(LEARNINGS_DIR).filter(f => f.endsWith('.md'));
  const keywords = extractKeywords(taskName);
  
  const matches = files
    .map(f => {
      const content = readFileSync(join(LEARNINGS_DIR, f), 'utf-8');
      const relevance = calculateRelevance(content, keywords);
      return { file: f, content, relevance };
    })
    .filter(m => m.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
  
  return matches.map(m => {
    // Extract summary section
    const summaryMatch = m.content.match(/## Outcome Summary[\s\S]*?(?=## What|$)/);
    const recommendMatch = m.content.match(/## Recommendations[\s\S]*?(?=## |$)/);
    
    return `### From: ${m.file}\n\n${summaryMatch?.[0] || ''}\n\n${recommendMatch?.[0] || ''}`;
  });
}

/**
 * Get current metrics
 */
export function getMetrics(): CompoundMetrics | null {
  if (!existsSync(METRICS_FILE)) return null;
  
  try {
    const content = readFileSync(METRICS_FILE, 'utf-8');
    return JSON.parse(content) as CompoundMetrics;
  } catch {
    return null;
  }
}

/**
 * Format knowledge context for agent prompts
 */
export function formatKnowledgeContext(taskName: string): string {
  const patterns = getRelevantPatterns(taskName);
  const antiPatterns = getRelevantAntiPatterns(taskName);
  const similarLearnings = getSimilarTaskLearnings(taskName);
  const metrics = getMetrics();
  
  let context = '';
  
  if (patterns.length > 0) {
    context += `## Relevant Successful Patterns\n\n`;
    patterns.forEach(p => {
      context += `### ${p.name}\n`;
      context += `${p.summary}\n`;
      context += `*Source: ${p.source}*\n\n`;
    });
  }
  
  if (antiPatterns.length > 0) {
    context += `## Anti-Patterns to Avoid\n\n`;
    antiPatterns.forEach(p => {
      context += `### ⚠️ ${p.name}\n`;
      context += `${p.summary}\n`;
      context += `*Source: ${p.source}*\n\n`;
    });
  }
  
  if (similarLearnings.length > 0) {
    context += `## Learnings from Similar Tasks\n\n`;
    context += similarLearnings.join('\n\n---\n\n');
    context += '\n\n';
  }
  
  if (metrics) {
    context += `## System Metrics\n\n`;
    context += `- Total sessions: ${metrics.total_sessions}\n`;
    context += `- First-pass success rate: ${(metrics.first_pass_rate * 100).toFixed(1)}%\n`;
    context += `- Average QA attempts: ${metrics.average_qa_attempts.toFixed(1)}\n`;
  }
  
  return context || 'No accumulated knowledge yet. This is an early session.';
}

// ============================================================================
// Knowledge Writing (for compound phase)
// ============================================================================

/**
 * Generate learnings file path
 */
export function getLearningsPath(taskSlug: string): string {
  const timestamp = Date.now();
  return join(LEARNINGS_DIR, `${taskSlug}-${timestamp}.md`);
}

/**
 * Append pattern to knowledge base
 */
export function appendPattern(pattern: string): void {
  const content = readFileSync(PATTERNS_FILE, 'utf-8');
  writeFileSync(PATTERNS_FILE, content + '\n' + pattern + '\n');
}

/**
 * Append anti-pattern to knowledge base
 */
export function appendAntiPattern(antiPattern: string): void {
  const content = readFileSync(ANTI_PATTERNS_FILE, 'utf-8');
  writeFileSync(ANTI_PATTERNS_FILE, content + '\n' + antiPattern + '\n');
}

/**
 * Update metrics after a session
 */
export function updateMetrics(
  taskSlug: string,
  taskType: string,
  qaAttempts: number,
  wasFirstPass: boolean,
  patternsFound: number,
  antiPatternsFound: number
): void {
  const metrics = getMetrics() || {
    total_sessions: 0,
    first_pass_successes: 0,
    first_pass_rate: 0,
    total_qa_attempts: 0,
    average_qa_attempts: 0,
    patterns_identified: 0,
    anti_patterns_identified: 0,
    by_task_type: {},
    by_month: {},
    last_updated: new Date().toISOString()
  };
  
  // Update totals
  metrics.total_sessions += 1;
  metrics.first_pass_successes += wasFirstPass ? 1 : 0;
  metrics.first_pass_rate = metrics.first_pass_successes / metrics.total_sessions;
  metrics.total_qa_attempts += qaAttempts;
  metrics.average_qa_attempts = metrics.total_qa_attempts / metrics.total_sessions;
  metrics.patterns_identified += patternsFound;
  metrics.anti_patterns_identified += antiPatternsFound;
  
  // Update by task type
  if (!metrics.by_task_type[taskType]) {
    metrics.by_task_type[taskType] = {
      count: 0,
      first_pass_rate: 0,
      total_qa_attempts: 0
    };
  }
  const typeMetrics = metrics.by_task_type[taskType];
  const prevTypeSuccesses = typeMetrics.first_pass_rate * typeMetrics.count;
  typeMetrics.count += 1;
  typeMetrics.first_pass_rate = (prevTypeSuccesses + (wasFirstPass ? 1 : 0)) / typeMetrics.count;
  typeMetrics.total_qa_attempts += qaAttempts;
  
  // Update by month
  const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
  if (!metrics.by_month[monthKey]) {
    metrics.by_month[monthKey] = {
      sessions: 0,
      first_pass_rate: 0
    };
  }
  const monthMetrics = metrics.by_month[monthKey];
  const prevMonthSuccesses = monthMetrics.first_pass_rate * monthMetrics.sessions;
  monthMetrics.sessions += 1;
  monthMetrics.first_pass_rate = (prevMonthSuccesses + (wasFirstPass ? 1 : 0)) / monthMetrics.sessions;
  
  // Update timestamp
  metrics.last_updated = new Date().toISOString();
  
  // Write back
  writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract keywords from task name for matching
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !['the', 'and', 'for', 'with', 'from'].includes(w));
}

/**
 * Calculate relevance score based on keyword matches
 */
function calculateRelevance(content: string, keywords: string[]): number {
  const lowerContent = content.toLowerCase();
  let score = 0;
  
  for (const keyword of keywords) {
    // Count occurrences
    const regex = new RegExp(keyword, 'gi');
    const matches = lowerContent.match(regex);
    if (matches) {
      score += matches.length;
    }
  }
  
  return score;
}

/**
 * Build compound prompt for the agent
 */
export function buildCompoundPrompt(
  task: Task,
  sessionId: string,
  logPath: string
): string {
  const taskPath = join(process.cwd(), '.apa', 'tasks', `${task.meta.slug}.json`);
  const learningsPath = getLearningsPath(task.meta.slug);
  const timestamp = new Date().toISOString();
  
  const wasFirstPass = task.meta.qa_attempts <= 1;
  const outcome = task.meta.status === 'escalated' 
    ? 'ESCALATED (requires human intervention)'
    : task.meta.status === 'complete'
    ? 'COMPLETED SUCCESSFULLY'
    : `IN PROGRESS (QA attempt ${task.meta.qa_attempts})`;
  
  return `# Compound Learning Phase: ${task.meta.name}

## Session Context

**Task:** ${task.meta.name}
**Session ID:** ${sessionId}
**Outcome:** ${outcome}
**QA Attempts:** ${task.meta.qa_attempts}
**First Pass Success:** ${wasFirstPass ? 'Yes ✅' : 'No ❌'}

## Your Mission

Extract learnings from this session that will help future tasks succeed.

> "Each feature should make the next feature easier to build."

## Analysis Tasks

### 1. Read Session Data

\`\`\`bash
# Task JSON (outcomes, QA results)
cat ${taskPath} | jq '.'

# Session log (all events)
cat ${logPath} | head -100

# Tool call summary
cat ${logPath} | jq -s 'map(select(.event_type == "tool_call")) | group_by(.data.tool) | map({tool: .[0].data.tool, count: length})'

# Error events
cat ${logPath} | jq 'select(.event_type == "error")'
\`\`\`

### 2. Analyze Outcome

${wasFirstPass ? `
**This was a first-pass success!** Focus on:
- What made this efficient?
- Are there reusable patterns?
- What should future similar tasks copy?
` : `
**This required ${task.meta.qa_attempts} QA attempts.** Focus on:
- What was the root cause of failure(s)?
- Could this have been prevented in planning?
- What check would have caught this earlier?
`}

${task.meta.status === 'escalated' ? `
**This task was ESCALATED.** This is critical to learn from:
- Why did it fail 3 times?
- Is there a fundamental issue with the approach?
- Should similar tasks be flagged for human review earlier?
` : ''}

### 3. Write Learnings Document

Create: \`${learningsPath}\`

Use this template:

\`\`\`markdown
# Session Learnings: ${task.meta.name}

**Date:** ${timestamp}
**Session ID:** ${sessionId}
**Outcome:** ${outcome}

## Outcome Summary

| Metric | Value |
|--------|-------|
| Status | ${task.meta.status} |
| QA Attempts | ${task.meta.qa_attempts} |
| First Pass | ${wasFirstPass ? 'Yes' : 'No'} |

## What Worked Well

### Pattern: [Name]

**Description:** [What this pattern does]

**Files involved:**
- [file paths]

**Why it worked:** [Explanation]

**Reusable:** Yes/No

## What Didn't Work

### Issue: [Name]

**Root cause:** [5 Whys analysis]

**Files involved:**
- [file path] (line [number])

**Prevention:** [How to avoid in future]

## Recommendations

1. [Specific, actionable recommendation]
2. [Specific, actionable recommendation]

## Tags

[task-type] [key-patterns] [outcome]
\`\`\`

### 4. Update Knowledge Base

**If you found successful patterns:**
Append to \`.apa/knowledge/patterns.md\`:

\`\`\`markdown
## Pattern: [Name]

**Added:** ${timestamp}
**Source:** ${task.meta.slug}

**Description:**
[What this pattern accomplishes]

**When to use:**
[Conditions where this applies]

**Implementation:**
[How to apply this pattern]

---
\`\`\`

**If you found anti-patterns:**
Append to \`.apa/knowledge/anti-patterns.md\`:

\`\`\`markdown
## Anti-Pattern: [Name]

**Added:** ${timestamp}
**Source:** ${task.meta.slug}

**Why it fails:**
[Root cause]

**Prevention:**
[How to avoid]

---
\`\`\`

### 5. Update Task JSON

Add compound section to task JSON:

\`\`\`json
{
  "compound": {
    "learnings_path": "${learningsPath}",
    "patterns_identified": [
      {
        "type": "success|failure|insight",
        "description": "...",
        "files": ["..."],
        "reusable": true
      }
    ],
    "knowledge_base_updated": true,
    "metrics_updated": true,
    "analyzed_at": "${timestamp}"
  }
}
\`\`\`

## Quality Checklist

Before completing:

- [ ] Learnings file created with specific file references
- [ ] Root cause identified for any failures (not just symptoms)
- [ ] Patterns are actionable (someone could apply them)
- [ ] Anti-patterns include prevention steps
- [ ] Task JSON compound section populated
- [ ] Knowledge base files updated if new patterns found

## Remember

You're building institutional memory. Future agents will read your learnings and make better decisions because of them. Be specific. Be actionable. Reference actual files.`;
}
```

### 2.4 Initialize Knowledge Base Files

**File:** `.apa/knowledge/patterns.md` (initial)

```markdown
# Successful Patterns

> This file accumulates patterns that have proven successful across tasks.
> Each pattern includes context on when and how to apply it.
> 
> **How to use:** Planner and coder agents read this file before starting work.
> Look for patterns relevant to your current task type.

---

<!-- Patterns will be appended below by the compound agent -->

```

**File:** `.apa/knowledge/anti-patterns.md` (initial)

```markdown
# Anti-Patterns to Avoid

> This file documents approaches that have failed, with root cause analysis.
> Reference this during planning to avoid repeating mistakes.
>
> **How to use:** Check this before planning to avoid known pitfalls.
> QA agent also references this to know what to watch for.

---

<!-- Anti-patterns will be appended below by the compound agent -->

```

**File:** `.apa/knowledge/metrics.json` (initial)

```json
{
  "total_sessions": 0,
  "first_pass_successes": 0,
  "first_pass_rate": 0,
  "total_qa_attempts": 0,
  "average_qa_attempts": 0,
  "patterns_identified": 0,
  "anti_patterns_identified": 0,
  "by_task_type": {},
  "by_month": {},
  "last_updated": "2025-12-11T00:00:00.000Z"
}
```

---

## 3. Existing Files to Modify

### 3.1 Update Types

**File:** `.apa/orchestrator/types.ts`

**Add these types:**

```typescript
// ============================================================================
// Compound Types (ADD TO EXISTING FILE)
// ============================================================================

/**
 * Pattern identified during compound analysis
 */
export const PatternSchema = z.object({
  type: z.enum(['success', 'failure', 'insight']),
  name: z.string(),
  description: z.string(),
  files: z.array(z.string()).optional(),
  reusable: z.boolean(),
  occurrences: z.number().optional()
});

export type Pattern = z.infer<typeof PatternSchema>;

/**
 * Skill update proposal
 */
export const SkillUpdateProposalSchema = z.object({
  skill: z.string(),
  change_type: z.enum(['add_pattern', 'add_example', 'add_warning']),
  content: z.string(),
  rationale: z.string()
});

export type SkillUpdateProposal = z.infer<typeof SkillUpdateProposalSchema>;

/**
 * Compound phase results
 */
export const CompoundResultSchema = z.object({
  learnings_path: z.string(),
  patterns_identified: z.array(PatternSchema),
  knowledge_base_updated: z.boolean(),
  metrics_updated: z.boolean(),
  skill_updates_proposed: z.array(SkillUpdateProposalSchema).optional(),
  analyzed_at: z.string()
});

export type CompoundResult = z.infer<typeof CompoundResultSchema>;

// UPDATE TaskSchema to include compound field
export const TaskSchema = z.object({
  // ... existing fields ...
  
  compound: CompoundResultSchema.optional()  // ADD THIS
});

// ADD to Phase type
export type Phase = 
  | 'planning' 
  | 'coding' 
  | 'qa' 
  | 'compound'  // ADD THIS
  | 'documentation' 
  | 'review';
```

### 3.2 Update Agent Configuration

**File:** `.apa/orchestrator/agents.ts`

**Add compound agent config:**

```typescript
// ADD to AGENT_CONFIGS object

'apa-compound': {
  name: 'apa-compound',
  description: 'Analyzes session outcomes and extracts learnings',
  tools: ['Read', 'Write', 'Bash', 'Grep', 'Glob'],
  model: 'claude-sonnet-4-20250514',
  maxTurns: 30,  // Compound should be fast
  systemPromptAddition: `
You are the APA Compound agent. Your job is to extract learnings from this session.

Your first action MUST be to read your skill file at .claude/skills/compound/SKILL.md.

Core principle: "Each feature should make the next feature easier to build."

You create this effect by:
1. Documenting what worked (patterns)
2. Documenting what didn't work (anti-patterns)
3. Updating the knowledge base for future agents
4. Tracking metrics to prove compounding is happening
`
}

// UPDATE AgentName type
export type AgentName = 
  | 'apa-planner' 
  | 'apa-coder' 
  | 'apa-qa' 
  | 'apa-docs'
  | 'apa-compound';  // ADD THIS
```

### 3.3 Update Utils

**File:** `.apa/orchestrator/utils.ts`

**Add these functions and update existing ones:**

```typescript
// ADD import at top
import { 
  formatKnowledgeContext, 
  buildCompoundPrompt,
  initializeKnowledgeBase 
} from './compound.js';

// UPDATE phaseToAgent function
export function phaseToAgent(phase: Phase): AgentName {
  const mapping: Record<Phase, AgentName> = {
    'planning': 'apa-planner',
    'coding': 'apa-coder',
    'qa': 'apa-qa',
    'compound': 'apa-compound',  // ADD THIS
    'documentation': 'apa-docs',
    'review': 'apa-docs'
  };
  return mapping[phase];
}

// UPDATE getNextPhase function
export function getNextPhase(currentPhase: Phase): TaskStatus {
  const transitions: Record<Phase, TaskStatus> = {
    'planning': 'coding',
    'coding': 'qa',
    'qa': 'compound',           // CHANGE: qa -> compound (not documentation)
    'compound': 'documentation', // ADD THIS
    'documentation': 'review',
    'review': 'complete'
  };
  return transitions[currentPhase];
}

// UPDATE buildPrompt to inject knowledge context
export function buildPrompt(phase: Phase, task: Task, sessionId?: string, logPath?: string): string {
  const taskPath = getTaskPath(task.meta.slug);
  
  // Get accumulated knowledge for context injection
  const knowledgeContext = formatKnowledgeContext(task.meta.name);
  
  const prompts: Record<Phase, string> = {
    planning: `# Planning Task: ${task.meta.name}

## Accumulated Knowledge

Before planning, review what the system has learned from previous tasks:

${knowledgeContext}

## Instructions

1. **Read your skill file**: \`.claude/skills/plan/SKILL.md\`
2. **Consider the knowledge above** when making decisions
3. **Read task requirements**: \`${taskPath}\`
4. **Create a detailed plan** that leverages successful patterns and avoids anti-patterns

[... rest of planning prompt ...]`,

    coding: `# Implementation Task: ${task.meta.name}

## Accumulated Knowledge

Reference these learnings during implementation:

${knowledgeContext}

## Instructions

1. **Read your skill file**: \`.claude/skills/code/SKILL.md\`
2. **Apply successful patterns** from the knowledge base
3. **Avoid documented anti-patterns**
4. **Read the approved plan**: \`${taskPath}\`

[... rest of coding prompt ...]`,

    qa: `# QA Verification: ${task.meta.name}

## Known Failure Points

Based on accumulated knowledge, watch for these issues:

${knowledgeContext}

## Instructions

1. **Read your skill file**: \`.claude/skills/qa/SKILL.md\`
2. **Check for documented anti-patterns**
3. **Verify against known failure points**

[... rest of QA prompt ...]`,

    compound: buildCompoundPrompt(task, sessionId || 'unknown', logPath || 'unknown'),

    documentation: `[... existing documentation prompt ...]`,

    review: `[... existing review prompt ...]`
  };

  return prompts[phase];
}
```

### 3.4 Update Orchestrator

**File:** `.apa/orchestrator/orchestrator.ts`

**Key changes:**

```typescript
// ADD import at top
import { 
  initializeKnowledgeBase, 
  updateMetrics,
  buildCompoundPrompt 
} from './compound.js';

// UPDATE constructor
constructor(config: OrchestratorConfig) {
  this.config = {
    maxPhases: 15,  // INCREASE to account for compound phase
    ...config
  };
  this.taskPath = getTaskPath(config.taskSlug);
  this.logger = new SessionLogger(config.taskSlug);
  
  // ADD: Initialize knowledge base
  initializeKnowledgeBase();
}

// UPDATE run() method to handle compound after QA failure
async run(): Promise<void> {
  // ... existing setup code ...

  try {
    while (this.phasesExecuted < this.config.maxPhases!) {
      const task = readTaskJson(this.taskPath);
      
      // Check terminal states
      if (isTerminal(task)) {
        // ADD: Run compound phase before final exit
        if (task.meta.status === 'complete' || task.meta.status === 'escalated') {
          await this.runCompoundPhase(task);
        }
        this.handleTerminalState(task);
        break;
      }
      
      // Check escalation
      if (shouldEscalate(task)) {
        // ADD: Run compound before escalation
        await this.runCompoundPhase(task);
        await this.handleEscalation(task);
        break;
      }
      
      // ... rest of phase execution ...
    }
  }
  // ... rest of method ...
}

// ADD new method for compound phase
private async runCompoundPhase(task: Task): Promise<void> {
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`📊 Phase: COMPOUND (Learning Extraction)`);
  console.log(`🤖 Agent: apa-compound`);
  console.log(`${'─'.repeat(40)}\n`);
  
  this.logger.logPhaseStart('compound', 'apa-compound');
  
  const success = await this.executePhase(
    'compound', 
    'apa-compound', 
    task
  );
  
  // Update metrics regardless of compound phase success
  const wasFirstPass = task.meta.qa_attempts <= 1;
  const taskType = this.inferTaskType(task.meta.name);
  
  updateMetrics(
    task.meta.slug,
    taskType,
    task.meta.qa_attempts,
    wasFirstPass,
    0,  // Patterns found (compound agent updates this)
    0   // Anti-patterns found (compound agent updates this)
  );
  
  this.logger.logPhaseEnd('compound', success);
}

// ADD helper to infer task type
private inferTaskType(taskName: string): string {
  const name = taskName.toLowerCase();
  if (name.includes('hero')) return 'hero-section';
  if (name.includes('product')) return 'product-section';
  if (name.includes('collection')) return 'collection-section';
  if (name.includes('footer')) return 'footer-section';
  if (name.includes('header')) return 'header-section';
  return 'general-section';
}

// UPDATE executePhase to pass session info for compound
private async executePhase(
  phase: Phase, 
  agent: AgentName, 
  task: Task
): Promise<boolean> {
  const config = getAgentConfig(agent);
  
  // Pass session info for compound phase
  const prompt = buildPrompt(
    phase, 
    task,
    this.logger.getSessionId(),  // ADD
    this.logger.getLogPath()     // ADD
  );
  
  // ... rest of method ...
}
```

### 3.5 Update Planner Agent

**File:** `.claude/agents/apa-planner.md`

**Add knowledge reading step:**

```markdown
## Initialization Sequence

**ALWAYS execute these steps first, in order:**

1. Read your skill file: `.claude/skills/plan/SKILL.md`
2. **NEW: Read accumulated knowledge:**
   - `.apa/knowledge/patterns.md` - Successful approaches to reuse
   - `.apa/knowledge/anti-patterns.md` - Mistakes to avoid
   - Check `.apa/learnings/` for similar task insights
3. Read the task JSON for requirements
4. Read project patterns: `.claude/docs/04-PATTERNS.md`
5. Follow the skill's Discovery → Analysis → Planning → Documentation process

## Knowledge Integration

When planning, actively look for:
- **Patterns to reuse:** Check if similar sections have documented patterns
- **Anti-patterns to avoid:** Don't repeat documented mistakes
- **Similar task learnings:** Apply insights from comparable work

If you find relevant patterns, reference them in your plan:
```json
{
  "plan": {
    "patterns_applied": [
      {
        "name": "pattern-name",
        "source": "task-slug",
        "adaptation": "How we're applying it here"
      }
    ]
  }
}
```
```

### 3.6 Update Coder Agent

**File:** `.claude/agents/apa-coder.md`

**Add pattern reference step:**

```markdown
## Initialization Sequence

**ALWAYS execute these steps first, in order:**

1. Read your skill file: `.claude/skills/code/SKILL.md`
2. Read the approved plan from task JSON
3. **NEW: Check for applicable patterns:**
   - If plan references patterns, read them from `.apa/knowledge/patterns.md`
   - Apply documented approaches where relevant
4. Read referenced pattern files from the plan
5. Follow the skill's implementation workflow

## Pattern Application

When implementing:
- Look for patterns mentioned in the plan
- Check anti-patterns before making decisions
- If you discover a new effective approach, note it for compound phase
```

### 3.7 Update QA Agent

**File:** `.claude/agents/apa-qa.md`

**Add failure point awareness:**

```markdown
## Initialization Sequence

**ALWAYS execute these steps first, in order:**

1. Read your skill file: `.claude/skills/qa/SKILL.md`
2. **NEW: Read documented failure points:**
   - `.apa/knowledge/anti-patterns.md` - Known issues to check for
   - Look for failures in similar task types
3. Read the task JSON to get acceptance criteria
4. Follow the skill's verification procedures exactly

## Enhanced Verification

In addition to acceptance criteria, verify against:
- All documented anti-patterns for this task type
- Common failure points from metrics
- Issues found in similar past tasks

If you find a new failure pattern, document it clearly for compound phase.
```

---

## 4. Implementation Steps

### Step 1: Create Directory Structure (5 min)

```bash
# From project root
mkdir -p .apa/knowledge
mkdir -p .apa/learnings
mkdir -p .claude/skills/compound
```

### Step 2: Create Knowledge Base Files (5 min)

```bash
# Create initial files
cat > .apa/knowledge/patterns.md << 'EOF'
# Successful Patterns

> Accumulated patterns from successful task completions.

---

EOF

cat > .apa/knowledge/anti-patterns.md << 'EOF'
# Anti-Patterns to Avoid

> Documented failures and how to prevent them.

---

EOF

cat > .apa/knowledge/metrics.json << 'EOF'
{
  "total_sessions": 0,
  "first_pass_successes": 0,
  "first_pass_rate": 0,
  "total_qa_attempts": 0,
  "average_qa_attempts": 0,
  "patterns_identified": 0,
  "anti_patterns_identified": 0,
  "by_task_type": {},
  "by_month": {},
  "last_updated": "2025-12-11T00:00:00.000Z"
}
EOF
```

### Step 3: Create Compound Agent (10 min)

Copy `.claude/agents/apa-compound.md` from section 2.1 above.

### Step 4: Create Compound Skill (10 min)

Copy `.claude/skills/compound/SKILL.md` from section 2.2 above.

### Step 5: Create compound.ts (20 min)

Copy `.apa/orchestrator/compound.ts` from section 2.3 above.

### Step 6: Update types.ts (10 min)

Add compound types from section 3.1.

### Step 7: Update agents.ts (5 min)

Add compound agent config from section 3.2.

### Step 8: Update utils.ts (15 min)

Add knowledge context injection from section 3.3.

### Step 9: Update orchestrator.ts (20 min)

Add compound phase handling from section 3.4.

### Step 10: Update Existing Agents (15 min)

Update planner, coder, and QA agents per sections 3.5-3.7.

### Step 11: Test (30 min)

```bash
# Run type check
cd .apa/orchestrator
npm run typecheck

# Create test task
npm start create "Test Hero Section"

# Run with verbose to see compound phase
npm start run test-hero-section --verbose
```

---

## 5. Testing Strategy

### Test 1: First Task (No Knowledge)

Run a task with empty knowledge base. Verify:
- [ ] Compound phase runs after QA
- [ ] Learnings file created in `.apa/learnings/`
- [ ] Metrics.json updated
- [ ] Task JSON has compound section

### Test 2: Second Similar Task

Run a similar task. Verify:
- [ ] Planner receives knowledge context
- [ ] Any relevant patterns are mentioned
- [ ] Metrics show 2 sessions

### Test 3: Failure Scenario

Intentionally create a task that will fail QA. Verify:
- [ ] Compound runs after failure (before retry)
- [ ] Anti-pattern documented
- [ ] On retry, coder sees the anti-pattern warning

### Test 4: Compound Effect

After 5+ tasks, verify:
- [ ] Metrics show trend data
- [ ] First-pass rate is tracked
- [ ] Patterns library has grown
- [ ] New tasks reference past learnings

---

## 6. Verification Checklist

### Pre-Flight

- [ ] All new files created
- [ ] All existing files updated
- [ ] `npm run typecheck` passes
- [ ] Knowledge directories exist
- [ ] Initial metrics.json is valid JSON

### After First Run

- [ ] Learnings file created with correct naming
- [ ] metrics.json total_sessions = 1
- [ ] Task JSON has compound section
- [ ] No errors in session log

### After Multiple Runs

- [ ] Patterns accumulating in patterns.md
- [ ] Anti-patterns accumulating (if failures occurred)
- [ ] First-pass rate is being calculated
- [ ] by_month tracking shows current month
- [ ] Agents are reading knowledge context (check prompts in log)

### Compound Effect Metrics

Track these over time:
- First-pass QA rate (should increase)
- Average QA attempts (should decrease)
- Time per task (should decrease for similar tasks)
- Patterns library size (should grow)

---

## Quick Reference

### New Files

| File | Purpose |
|------|---------|
| `.claude/agents/apa-compound.md` | Compound agent definition |
| `.claude/skills/compound/SKILL.md` | Compound methodology |
| `.apa/orchestrator/compound.ts` | Compound phase logic |
| `.apa/knowledge/patterns.md` | Success patterns |
| `.apa/knowledge/anti-patterns.md` | Failure patterns |
| `.apa/knowledge/metrics.json` | Compound metrics |
| `.apa/learnings/*.md` | Per-session learnings |

### Modified Files

| File | Changes |
|------|---------|
| `types.ts` | Add compound types |
| `agents.ts` | Add apa-compound config |
| `utils.ts` | Add knowledge helpers, update prompts |
| `orchestrator.ts` | Add compound phase execution |
| `apa-planner.md` | Add knowledge reading step |
| `apa-coder.md` | Add pattern reference step |
| `apa-qa.md` | Add failure point awareness |

### Phase Flow

```
planning → coding → qa ─┬─► compound → documentation → complete
                        │
                        └─► compound → coding (on failure)
```

---

*This integration transforms your orchestrator from executing tasks in isolation to building institutional knowledge that compounds over time.*
