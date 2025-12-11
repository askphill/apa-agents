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

/**
 * Skill update proposal
 */
export const SkillUpdateProposalSchema = z.object({
  skill: z.string(),
  change_type: z.enum(['add_pattern', 'add_example', 'add_warning']),
  content: z.string(),
  rationale: z.string()
});

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
      'compound',
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
    requirements: z.string().optional(),
    productive_ticket_id: z.string().optional()
  }),

  plan: z.object({
    overview: z.string().optional(),
    technical_approach: z.string().optional(),
    tasks: z.array(TaskItemSchema).optional(),
    acceptance_criteria: z.array(z.string()).optional(),
    dependencies: z.array(z.string()).optional(),
    risks: z.array(z.string()).optional(),
    patterns_applied: z.array(z.object({
      name: z.string(),
      source: z.string(),
      adaptation: z.string().optional()
    })).optional(),
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

  compound: CompoundResultSchema.optional(),

  documentation: z.object({
    client_docs_path: z.string().optional(),
    developer_docs_path: z.string().optional(),
    created_at: z.string().optional()
  }).optional(),

  sources: z.object({
    ticket_url: z.string().optional(),
    figma_url: z.string().optional(),
    productive_task_file: z.string().optional()
  }).optional()
});

export type Task = z.infer<typeof TaskSchema>;
export type TaskItem = z.infer<typeof TaskItemSchema>;
export type VerificationResult = z.infer<typeof VerificationResultSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type Pattern = z.infer<typeof PatternSchema>;
export type SkillUpdateProposal = z.infer<typeof SkillUpdateProposalSchema>;
export type CompoundResult = z.infer<typeof CompoundResultSchema>;

// ============================================================================
// Phase & Agent Types
// ============================================================================

export type Phase =
  | 'planning'
  | 'coding'
  | 'qa'
  | 'compound'
  | 'documentation'
  | 'review';

export type TaskStatus = Task['meta']['status'];

export type AgentName =
  | 'apa-planner'
  | 'apa-coder'
  | 'apa-qa'
  | 'apa-docs'
  | 'apa-compound';

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
