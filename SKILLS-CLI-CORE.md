# TypeScript CLI Development - Core Principles

## Overview
This skill defines best practices for building professional TypeScript CLI applications that are maintainable, type-safe, and user-friendly.

## Core Architecture Principles

### 1. Separation of Concerns
- **Parse Layer**: Use Commander to parse arguments
- **Validation Layer**: Use Zod to validate and transform input
- **Business Logic Layer**: Pure functions that don't touch CLI or I/O
- **Output Layer**: Use Chalk for formatted output

**Why**: Makes code testable, reusable, and maintainable

```typescript
// ❌ Bad: Business logic mixed with CLI
const options = program.opts();
if (options.name.length < 1) {
  console.log('Invalid!');
} else {
  console.log(`Hello ${options.name}`);
}

// ✅ Good: Separated concerns
const schema = z.object({ name: z.string().min(1) });
const validated = schema.parse({ name: options.name });
const greeting = generateGreeting(validated.name);
console.log(chalk.green(greeting));
```

### 2. Type Safety First
- Use strict TypeScript (`strict: true` in tsconfig.json)
- Define schemas with Zod for runtime validation
- Use discriminated unions for different command branches
- Avoid `any` at all costs

```typescript
// ✅ Good: Type-safe with Zod
const configSchema = z.object({
  apiUrl: z.string().url(),
  timeout: z.number().int().positive(),
  retries: z.number().min(0).max(5),
});

type Config = z.infer<typeof configSchema>;
```

### 3. User Experience
- Clear error messages with context
- Helpful hints when commands fail
- Color-coded output (errors in red, success in green)
- Validate early, fail fast

```typescript
// ✅ Good: Clear errors
if (!result.success) {
  console.error(chalk.red('❌ Configuration Error'));
  result.error.errors.forEach(err => {
    console.error(chalk.red(`  • ${err.path.join('.')}: ${err.message}`));
  });
  process.exit(1);
}
```

### 4. Exit Codes Matter
- `process.exit(0)` — Success
- `process.exit(1)` — General error
- `process.exit(2)` — Misuse of shell command
- Document your exit codes

### 5. ESM-First Development
- Always use `"type": "module"` in package.json
- Use `import`/`export` syntax
- Avoid `__dirname` (use `import.meta.url` instead)
- All modern dependencies support ESM

## File Structure Pattern

```
cli-project/
├── src/
│   ├── index.ts           # CLI entry point (shebang, top-level awaits)
│   ├── commands/          # Individual command handlers
│   ├── utils/             # Helper functions, validation schemas
│   ├── config/            # Configuration loading/validation
│   └── types/             # Shared TypeScript types
├── dist/                  # Compiled output (ESM)
├── package.json           # "type": "module", bin entry
├── tsconfig.json          # target: ES2022, module: ESNext
└── README.md              # Setup instructions
```

## Configuration Management Pattern

```typescript
// ✅ Good: Schema-driven configuration
import { z } from 'zod';

const ConfigSchema = z.object({
  apiUrl: z.string().url().default('https://api.example.com'),
  timeout: z.number().positive().default(30000),
  debug: z.boolean().default(false),
});

type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(overrides?: Partial<Config>): Config {
  const defaults = {
    apiUrl: 'https://api.example.com',
    timeout: 30000,
    debug: false,
  };
  
  const merged = { ...defaults, ...overrides };
  return ConfigSchema.parse(merged);
}
```

## Error Handling Strategy

```typescript
// ✅ Good: Structured error handling
class CLIError extends Error {
  constructor(
    message: string,
    public code: number = 1,
    public hint?: string
  ) {
    super(message);
  }
}

// ✅ Good: Error boundaries at top level
try {
  await main();
  process.exit(0);
} catch (error) {
  if (error instanceof CLIError) {
    console.error(chalk.red(`❌ ${error.message}`));
    if (error.hint) {
      console.log(chalk.yellow(`💡 Hint: ${error.hint}`));
    }
    process.exit(error.code);
  } else if (error instanceof Error) {
    console.error(chalk.red(`Unexpected error: ${error.message}`));
    process.exit(1);
  } else {
    console.error(chalk.red('Unknown error'));
    process.exit(1);
  }
}
```

## Async/Await in CLI

```typescript
// ✅ Good: Top-level await in ESM
import { someAsyncFunction } from './utils.js';

const result = await someAsyncFunction();
console.log(chalk.green(`Success: ${result}`));
```

## Testing Strategy

```typescript
// ✅ Strategy: Extract business logic from CLI layer
// src/core.ts - Pure functions without I/O
export function generateGreeting(name: string): string {
  return `Hello, ${name}!`;
}

// src/index.ts - CLI glue
const greeting = generateGreeting(options.name);
console.log(chalk.green(greeting));

// tests/core.test.ts - Easy to test
import { generateGreeting } from '../src/core.js';
test('generateGreeting', () => {
  expect(generateGreeting('Alice')).toBe('Hello, Alice!');
});
```

## Validation Patterns

### Input Validation (from user)
```typescript
import { z } from 'zod';

// Define schema once
const InputSchema = z.object({
  name: z.string().min(1, 'Name required'),
  age: z.number().int().min(0).max(150),
});

// Validate early
const result = InputSchema.safeParse(userInput);
if (!result.success) {
  // Handle errors with full context
  result.error.flatten();
}
```

### Config Validation (from files/env)
```typescript
// Always validate external config
const configFromFile = JSON.parse(fs.readFileSync('config.json'));
const validated = ConfigSchema.parse(configFromFile);
```

## Output Formatting Patterns

```typescript
import chalk from 'chalk';

// ✅ Error
console.error(chalk.red('❌ Something failed'));

// ✅ Success
console.log(chalk.green('✓ Operation complete'));

// ✅ Info
console.log(chalk.blue('ℹ FYI: Background task running'));

// ✅ Warning
console.log(chalk.yellow('⚠ Be careful with this option'));

// ✅ Structured data
console.table(data);

// ✅ Progress indication
const steps = ['Downloading...', 'Processing...', 'Uploading...'];
steps.forEach(step => console.log(chalk.cyan(`→ ${step}`));
);
```

## Performance Considerations

1. **Lazy load heavy dependencies**
   ```typescript
   // Only import if user calls this command
   if (command === 'heavy') {
     const heavyLib = await import('./heavy-lib.js');
   }
   ```

2. **Cache validated config**
   ```typescript
   let cachedConfig: Config | null = null;
   function getConfig(): Config {
     if (!cachedConfig) {
       cachedConfig = loadAndValidateConfig();
     }
     return cachedConfig;
   }
   ```

3. **Use tsup for optimal builds**
   - Tree-shakes unused code
   - Minifies output
   - Generates source maps

## Security Best Practices

1. **Never log secrets**
   ```typescript
   // ❌ Bad
   console.log('API Key:', apiKey);
   
   // ✅ Good
   console.log('API Key:', apiKey.slice(0, 4) + '****');
   ```

2. **Validate all external input**
   ```typescript
   // Always use Zod/schema validation
   const safe = InputSchema.parse(untrustedInput);
   ```

3. **Set proper exit codes**
   - Makes it easy to detect failures in scripts

## Documentation Checklist
- [ ] README with installation and usage
- [ ] Example commands with flags
- [ ] Environment variables documented
- [ ] Error codes documented
- [ ] Configuration file format documented
- [ ] Help text via `--help` flag (Commander provides this)

## Common Pitfalls to Avoid

❌ **Don't**: Mix CLI parsing and business logic
```typescript
program.action((options) => {
  if (options.file) {
    const data = fs.readFileSync(options.file);
    // ... process data ...
  }
});
```

✅ **Do**: Extract logic into functions
```typescript
function processFile(path: string) { /* ... */ }
program.action((options) => {
  if (options.file) {
    processFile(options.file);
  }
});
```

❌ **Don't**: Use CommonJS in an ESM project
```typescript
const express = require('express'); // Wrong!
```

✅ **Do**: Use ESM everywhere
```typescript
import express from 'express';
```

❌ **Don't**: Ignore validation
```typescript
const name = process.argv[2]; // Might be undefined
console.log(`Hello, ${name}`); // Could print "Hello, undefined"
```

✅ **Do**: Validate everything
```typescript
const result = InputSchema.safeParse({ name });
if (!result.success) {
  console.error('Invalid input');
  process.exit(1);
}
```

## Recommended Extensions & Tools

- **TypeScript Strict Mode**: Catch errors at compile time
- **tsx**: Fast development iteration without build step
- **tsup**: Minimal, zero-config bundling
- **Commander**: Most popular CLI framework
- **Chalk**: Colorful terminal output
- **Zod**: Safe runtime validation with types

## Related Skills
- Testing CLI Applications
- Configuration Management in TypeScript
- Building Distributable CLI Packages
