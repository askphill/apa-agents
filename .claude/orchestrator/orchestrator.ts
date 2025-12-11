import { spawn } from 'child_process';
import { SessionLogger } from './logger.js';
import { getAgentConfig } from './agents.js';
import {
  readTaskJson,
  writeTaskJson,
  getTaskPath,
  getPhase,
  phaseToAgent,
  shouldEscalate,
  isTerminal,
  buildPrompt,
  sleep,
  formatTimestamp,
  initializeKnowledgeBase
} from './utils.js';
import { updateMetrics } from './compound.js';
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
 * Main orchestrator class for Ask Phill Accelerator
 */
export class Orchestrator {
  private config: OrchestratorConfig;
  private logger: SessionLogger;
  private taskPath: string;
  private phasesExecuted: number = 0;

  constructor(config: OrchestratorConfig) {
    this.config = {
      maxPhases: 15, // Account for compound phase and retries
      ...config
    };
    this.taskPath = getTaskPath(config.taskSlug);
    this.logger = new SessionLogger(config.taskSlug);

    // Initialize knowledge base
    initializeKnowledgeBase();
  }

  /**
   * Main orchestration loop
   */
  async run(): Promise<void> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Ask Phill Accelerator - Orchestrator`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Task: ${this.config.taskSlug}`);
    console.log(`Path: ${this.taskPath}`);
    console.log(`Log: ${this.logger.getLogPath()}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      while (this.phasesExecuted < this.config.maxPhases!) {
        const task = readTaskJson(this.taskPath);

        // Check terminal states
        if (isTerminal(task)) {
          // Run compound phase before final exit if not already done
          if (!task.compound && (task.meta.status === 'complete' || task.meta.status === 'escalated')) {
            await this.runCompoundPhase(task);
          }
          this.handleTerminalState(task);
          break;
        }

        // Check escalation
        if (shouldEscalate(task)) {
          // Run compound before escalation
          await this.runCompoundPhase(task);
          await this.handleEscalation(task);
          break;
        }

        // Execute current phase
        const phase = getPhase(task);
        const agent = phaseToAgent(phase);

        console.log(`\n${'─'.repeat(40)}`);
        console.log(`Phase: ${phase.toUpperCase()}`);
        console.log(`Agent: ${agent}`);
        console.log(`Time: ${formatTimestamp()}`);
        console.log(`${'─'.repeat(40)}\n`);

        this.logger.logPhaseStart(phase, agent);

        const success = await this.executePhase(phase, agent, task);

        this.logger.logPhaseEnd(phase, success);
        this.phasesExecuted++;

        // Brief pause between phases
        await sleep(1000);
      }

      if (this.phasesExecuted >= this.config.maxPhases!) {
        console.log(`\nMax phases (${this.config.maxPhases}) reached`);
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
      console.log(`Session Complete`);
      console.log(`${'='.repeat(60)}`);
      console.log(`Summary: ${this.logger.getSummaryPath()}`);
      console.log(`Log: ${this.logger.getLogPath()}`);
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

    // Pass session info for compound phase
    const prompt = buildPrompt(
      phase,
      task,
      this.logger.getSessionId(),
      this.logger.getLogPath()
    );

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
      console.error(`\nPhase ${phase} failed:`, error);
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
        console.log(`\nExecuting: claude ${args.join(' ').slice(0, 100)}...\n`);
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
   * Run compound phase for learning extraction
   */
  private async runCompoundPhase(task: Task): Promise<void> {
    console.log(`\n${'─'.repeat(40)}`);
    console.log(`Phase: COMPOUND (Learning Extraction)`);
    console.log(`Agent: apa-compound`);
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
      0, // Patterns found (compound agent updates this)
      0  // Anti-patterns found (compound agent updates this)
    );

    this.logger.logPhaseEnd('compound', success);
  }

  /**
   * Infer task type from name
   */
  private inferTaskType(taskName: string): string {
    const name = taskName.toLowerCase();
    if (name.includes('hero')) return 'hero-section';
    if (name.includes('product')) return 'product-section';
    if (name.includes('collection')) return 'collection-section';
    if (name.includes('footer')) return 'footer-section';
    if (name.includes('header')) return 'header-section';
    if (name.includes('cart')) return 'cart-section';
    if (name.includes('blog')) return 'blog-section';
    if (name.includes('article')) return 'article-section';
    if (name.includes('contact')) return 'contact-section';
    if (name.includes('testimonial')) return 'testimonial-section';
    if (name.includes('faq')) return 'faq-section';
    return 'general-section';
  }

  /**
   * Handle terminal task state
   */
  private handleTerminalState(task: Task): void {
    if (task.meta.status === 'complete') {
      console.log(`\nTask completed successfully!`);
      console.log(`   Section: ${task.meta.name}`);
      if (task.documentation?.client_docs_path) {
        console.log(`   Client Docs: ${task.documentation.client_docs_path}`);
      }
      if (task.documentation?.developer_docs_path) {
        console.log(`   Developer Docs: ${task.documentation.developer_docs_path}`);
      }
    } else if (task.meta.status === 'escalated') {
      console.log(`\nTask escalated - human intervention required`);
      console.log(`   Reason: ${task.meta.escalation_reason}`);
    }
  }

  /**
   * Handle escalation after max QA attempts
   */
  private async handleEscalation(task: Task): Promise<void> {
    const reason = `QA failed ${task.meta.qa_attempts} times`;

    console.log(`\nEscalating task: ${reason}`);

    this.logger.logEscalation(reason, task.meta.qa_attempts);

    // Update task status
    task.meta.status = 'escalated';
    task.meta.escalation_reason = reason;
    writeTaskJson(this.taskPath, task);

    // Print QA issues if available
    if (task.qa?.issues && task.qa.issues.length > 0) {
      console.log(`\nOutstanding Issues:`);
      task.qa.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. [${issue.severity}] ${issue.description}`);
        if (issue.file) {
          console.log(`      File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
        }
      });
    }
  }
}
