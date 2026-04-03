#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { z } from 'zod';

// Define and validate CLI arguments using Zod
const CliArgsSchema = z.object({
  name: z.string().min(1, 'Name must not be empty').default('World'),
});

type CliArgs = z.infer<typeof CliArgsSchema>;

const program = new Command();

program
  .name('lailai')
  .description('A simple TypeScript CLI application')
  .version('1.0.0')
  .option('-n, --name <string>', 'Name to greet', 'World')
  .parse(process.argv);

const options = program.opts();

// Validate options with Zod
const result = CliArgsSchema.safeParse({ name: options.name });

if (!result.success) {
  console.error(chalk.red('❌ Validation Error:'));
  result.error.errors.forEach((error) => {
    console.error(chalk.red(`  - ${error.message}`));
  });
  process.exit(1);
}

const args: CliArgs = result.data;

// Main CLI logic
console.log(chalk.cyan('🎉 Welcome to LaiLai CLI!'));
console.log(chalk.green(`Hello, ${args.name}! 👋`));
console.log(chalk.blue('This is a TypeScript CLI powered by Commander, Chalk, and Zod.'));
