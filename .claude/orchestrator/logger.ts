import { mkdirSync, appendFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { LogEntry, LogEventType, TaskStatus } from './types.js';

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
    this.logDir = join(process.cwd(), '.claude', 'logs');

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
      summary += `- **Success**: ${phaseEnd?.data?.success ? 'Yes' : 'No'}\n`;

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
