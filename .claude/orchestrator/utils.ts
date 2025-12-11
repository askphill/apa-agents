import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { Task, TaskSchema, Phase, AgentName, TaskStatus } from './types.js';
import {
  formatKnowledgeContext,
  buildCompoundPrompt,
  initializeKnowledgeBase
} from './compound.js';

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
  return join(process.cwd(), '.claude', 'tasks', `${taskSlug}.json`);
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
    'compound': 'compound',
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
    'compound': 'apa-compound',
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
    'qa': 'compound',
    'compound': 'documentation',
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
export function buildPrompt(
  phase: Phase,
  task: Task,
  sessionId?: string,
  logPath?: string
): string {
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
4. **Determine workflow mode**: Productive.io ticket, Figma, or description
5. **Create a detailed plan** that leverages successful patterns and avoids anti-patterns

## Task Requirements

${task.meta.requirements || 'See task JSON for full requirements'}

## Figma Reference

${task.meta.figma_url ? `Design: ${task.meta.figma_url}` : 'No Figma URL provided'}

## Productive.io Reference

${task.meta.productive_ticket_id ? `Ticket: ${task.meta.productive_ticket_id}` : 'No Productive ticket linked'}

## Expected Output

Update the task JSON with:
- \`plan.overview\`: High-level description
- \`plan.technical_approach\`: Implementation strategy
- \`plan.tasks\`: List of atomic tasks with acceptance criteria
- \`plan.acceptance_criteria\`: Overall success criteria
- \`meta.status\`: Set to "coding" when complete`,

    coding: `# Implementation Task: ${task.meta.name}

## Accumulated Knowledge

Reference these learnings during implementation:

${knowledgeContext}

## Instructions

1. **Read your skill file**: \`.claude/skills/code/SKILL.md\`
2. **Apply successful patterns** from the knowledge base
3. **Avoid documented anti-patterns**
4. **Read the approved plan**: \`${taskPath}\`
5. **Reference actual project files** for code patterns (no hardcoded examples)

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

## CRITICAL: READ-ONLY MODE

You have **READ-ONLY** access. Do not attempt to modify any files.
If issues are found, document them and set status back to "coding".

## Known Failure Points

Based on accumulated knowledge, watch for these issues:

${knowledgeContext}

## Instructions

1. **Read your skill file**: \`.claude/skills/qa/SKILL.md\`
2. **Check for documented anti-patterns**
3. **Verify against known failure points**
4. **Read the implementation from**: \`${taskPath}\`

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
- \`meta.status\`: "compound" if pass, "coding" if fail`,

    compound: buildCompoundPrompt(task, sessionId || 'unknown', logPath || 'unknown'),

    documentation: `# Documentation Task: ${task.meta.name}

## Instructions

1. **Read your skill file**: \`.claude/skills/docs/SKILL.md\`
2. **Read the implementation from**: \`${taskPath}\`
3. **Create** comprehensive documentation following templates
4. **Update** task JSON with documentation paths

## Implementation Summary

${task.plan?.overview || 'Read from task JSON'}

## Files Implemented

${task.implementation?.files_created?.map(f => `- ${f}`).join('\n') || 'Read from task JSON'}

## Documentation to Create

1. \`docs/client/${task.meta.slug}.liquid\` - Merchant guide (always)
2. \`docs/developer/${task.meta.slug}.md\` - Developer reference (if complex)

## Expected Output

- Documentation files created
- Update \`documentation.client_docs_path\`, \`documentation.developer_docs_path\`
- Set \`meta.status\` to "review"`,

    review: `# Final Review: ${task.meta.name}

## Instructions

1. Verify all documentation is complete and accurate
2. Check that implementation matches plan
3. Confirm all acceptance criteria are met
4. Mark task as complete if everything is ready

## Checklist

- [ ] Client docs exist and are comprehensive
- [ ] Developer docs exist (if complexity threshold met)
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
  figmaUrl?: string,
  productiveTicketId?: string
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
      requirements,
      productive_ticket_id: productiveTicketId
    }
  };
}

// Re-export for convenience
export { initializeKnowledgeBase };
