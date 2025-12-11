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
  productiveTicketId?: string;
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
    productiveTicketId: undefined as string | undefined,
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
    if (args[i] === '--productive' && args[i + 1]) {
      result.productiveTicketId = args[i + 1];
    }
  }

  return result;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
Ask Phill Accelerator (APA) - Orchestrator

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
  --productive        Productive.io ticket ID (for create)

Examples:
  # Create a new task
  npm start create "Hero Section" --figma "https://figma.com/..."

  # Create task with Productive integration
  npm start create "Product Grid" --productive "12345"

  # Run orchestration
  npm start run hero-section

  # Dry run to preview
  npm start run hero-section --dry-run --verbose
`);
}

/**
 * Create a new task
 */
function createNewTask(
  name: string,
  requirements?: string,
  figmaUrl?: string,
  productiveTicketId?: string
): void {
  const task = createTask(name, requirements, figmaUrl, productiveTicketId);
  const taskPath = getTaskPath(task.meta.slug);

  // Ensure directory exists
  const dir = dirname(taskPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeTaskJson(taskPath, task);

  console.log(`\nCreated task: ${task.meta.name}`);
  console.log(`   Slug: ${task.meta.slug}`);
  console.log(`   Path: ${taskPath}`);
  if (productiveTicketId) {
    console.log(`   Productive: ${productiveTicketId}`);
  }
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
      createNewTask(
        args.name,
        args.requirements,
        args.figmaUrl,
        args.productiveTicketId
      );
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
  console.error('\nFatal error:', error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
});
