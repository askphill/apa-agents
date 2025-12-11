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
You are the APA Planner agent for the Ask Phill Accelerator system.
Your first action MUST be to read your skill file at .claude/skills/plan/SKILL.md.

Follow the skill's methodology exactly:
1. Determine workflow mode (Productive.io, Figma, or description)
2. Discovery - Find existing patterns
3. Analysis - Understand requirements
4. Planning - Create detailed plan
5. Documentation - Write to task JSON
`
  },

  'apa-coder': {
    name: 'apa-coder',
    description: 'Implements Shopify theme sections following approved plans',
    tools: ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'],
    model: 'claude-sonnet-4-20250514',
    maxTurns: 100,
    systemPromptAddition: `
You are the APA Coder agent for the Ask Phill Accelerator system.
Your first action MUST be to read your skill file at .claude/skills/code/SKILL.md.

Follow the skill's implementation patterns:
1. Read the approved plan from task JSON
2. Reference actual project files for patterns (don't use hardcoded examples)
3. Implement each task in order
4. Run theme check and schema:apply after each file
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
You are the APA QA agent for the Ask Phill Accelerator system.
Your first action MUST be to read your skill file at .claude/skills/qa/SKILL.md.

CRITICAL CONSTRAINT: You have READ-ONLY access.
You CANNOT use Write or Edit tools. If you find issues:
1. Document them in detail in task JSON
2. Set status back to "coding"
3. Return control to orchestrator

Follow deterministic verification:
1. File integrity checks first
2. Schema validation
3. Theme check execution
4. Translation verification
5. Security and performance checks
`
  },

  'apa-docs': {
    name: 'apa-docs',
    description: 'Creates comprehensive documentation for completed sections',
    tools: ['Read', 'Write', 'Bash', 'Grep', 'Glob'],
    model: 'claude-sonnet-4-20250514',
    maxTurns: 50,
    systemPromptAddition: `
You are the APA Docs agent for the Ask Phill Accelerator system.
Your first action MUST be to read your skill file at .claude/skills/docs/SKILL.md.

Follow documentation templates:
1. Read implementation details
2. Create client docs (always)
3. Create developer docs (if complexity flags set)
4. Update task JSON with paths
`
  },

  'apa-compound': {
    name: 'apa-compound',
    description: 'Analyzes session outcomes and extracts learnings',
    tools: ['Read', 'Write', 'Bash', 'Grep', 'Glob'],
    model: 'claude-sonnet-4-20250514',
    maxTurns: 30, // Compound should be fast
    systemPromptAddition: `
You are the APA Compound agent for the Ask Phill Accelerator system.
Your job is to extract learnings from this session.

Your first action MUST be to read your skill file at .claude/skills/compound/SKILL.md.

Core principle: "Each feature should make the next feature easier to build."

You create this effect by:
1. Documenting what worked (patterns)
2. Documenting what didn't work (anti-patterns)
3. Updating the knowledge base for future agents
4. Tracking metrics to prove compounding is happening
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
