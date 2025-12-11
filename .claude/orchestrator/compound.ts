import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import type { Task } from './types.js';

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

const KNOWLEDGE_DIR = join(process.cwd(), '.claude', 'knowledge');
const LEARNINGS_DIR = join(process.cwd(), '.claude', 'learnings');
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
      context += `### ${p.name}\n`;
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
  const taskPath = join(process.cwd(), '.claude', 'tasks', `${task.meta.slug}.json`);
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
**First Pass Success:** ${wasFirstPass ? 'Yes' : 'No'}

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

Follow the template in your skill file at \`.claude/skills/compound/SKILL.md\`

### 4. Update Knowledge Base

**If you found successful patterns:**
Append to \`.claude/knowledge/patterns.md\`

**If you found anti-patterns:**
Append to \`.claude/knowledge/anti-patterns.md\`

### 5. Update Task JSON

Add compound section to task JSON at \`${taskPath}\`:

\`\`\`json
{
  "compound": {
    "learnings_path": "${learningsPath}",
    "patterns_identified": [...],
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
