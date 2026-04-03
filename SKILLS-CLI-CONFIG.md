# TypeScript CLI Configuration Management

## Overview
This skill defines patterns for managing configuration in TypeScript CLI applications with validation, multiple sources (files, environment, flags), and type safety.

## Configuration Source Hierarchy

Typically in this order (highest to lowest priority):

```
1. CLI Flags (highest priority)
2. Environment Variables  
3. Config Files (.json, .env, etc.)
4. Defaults (lowest priority)
```

**Example**: If config sets `timeout: 30000`, but user passes `--timeout 10000`, the flag wins.

## Pattern: Single Responsibility Schema

```typescript
// src/config/schema.ts - Define ONE schema, reuse everywhere
import { z } from 'zod';

export const ConfigSchema = z.object({
  apiUrl: z.string().url(),
  timeout: z.number().int().positive(),
  retries: z.number().int().min(0).max(5),
  debug: z.boolean(),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

// Define defaults separately
export const CONFIG_DEFAULTS: AppConfig = {
  apiUrl: 'https://api.example.com',
  timeout: 30000,
  retries: 3,
  debug: false,
};
```

**Why separate schema from defaults?**
- Schema defines what's valid, not what's default
- Defaults are business logic
- Schema is reusable for many config sources

## Configuration Sources

### 1. Loading from Files

```typescript
// src/config/file.ts
import { promises as fs } from 'fs';
import { ConfigSchema } from './schema.js';

function getConfigPath(): string {
  // Check multiple locations
  const locations = [
    '.lailai/config.json',
    './config.json',
    '~/.lailai/config.json',
  ];
  
  for (const loc of locations) {
    if (fileExists(loc)) return loc;
  }
  
  return locations[0]; // Default to first location
}

export async function loadConfigFile(): Promise<Partial<AppConfig>> {
  const path = getConfigPath();
  
  try {
    const data = await fs.readFile(path, 'utf-8');
    const json = JSON.parse(data);
    
    // Validate BEFORE returning
    const result = ConfigSchema.partial().safeParse(json);
    if (!result.success) {
      throw new Error(`Invalid config file: ${result.error.message}`);
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return {}; // File doesn't exist, return empty partial
    }
    throw error; // Real error, re-throw
  }
}
```

### 2. Loading from Environment Variables

```typescript
// src/config/env.ts
import { ConfigSchema } from './schema.js';

export function loadConfigFromEnv(): Partial<AppConfig> {
  const env = process.env;
  
  // Map environment variables to config
  const partial = {
    ...(env.API_URL && { apiUrl: env.API_URL }),
    ...(env.TIMEOUT && { timeout: parseInt(env.TIMEOUT, 10) }),
    ...(env.RETRIES && { retries: parseInt(env.RETRIES, 10) }),
    ...(env.DEBUG && { debug: env.DEBUG === 'true' }),
  };
  
  // Validate the partial config
  const result = ConfigSchema.partial().safeParse(partial);
  if (!result.success) {
    throw new Error(`Invalid environment variables: ${result.error.message}`);
  }
  
  return result.data;
}
```

**Environment Variable Naming Convention**:
- Prefix: `APPNAME_` (e.g., `LAILAI_API_URL`)
- Uppercase with underscores
- Clear names that match config keys

### 3. Loading from CLI Flags

```typescript
// src/config/cli.ts
import { Command } from 'commander';
import { ConfigSchema } from './schema.js';

export function addConfigOptions(program: Command): void {
  program
    .option(
      '--api-url <url>',
      'API endpoint URL',
      'https://api.example.com'
    )
    .option(
      '--timeout <ms>',
      'Request timeout in milliseconds',
      '30000'
    )
    .option(
      '--retries <count>',
      'Number of retry attempts',
      '3'
    )
    .option(
      '--debug',
      'Enable debug logging',
      false
    );
}

export function extractConfigFromOptions(options: any): Partial<AppConfig> {
  const partial = {
    // Commander converts hyphens to camelCase
    ...(options.apiUrl && { apiUrl: options.apiUrl }),
    ...(options.timeout && { timeout: parseInt(options.timeout, 10) }),
    ...(options.retries && { retries: parseInt(options.retries, 10) }),
    ...(options.debug && { debug: options.debug }),
  };
  
  const result = ConfigSchema.partial().safeParse(partial);
  if (!result.success) {
    throw new Error(`Invalid CLI options: ${result.error.message}`);
  }
  
  return result.data;
}
```

## Pattern: Merged Config Loading

```typescript
// src/config/index.ts - Orchestrate all sources
import { loadConfigFile } from './file.js';
import { loadConfigFromEnv } from './env.js';
import { extractConfigFromOptions } from './cli.js';
import { ConfigSchema, CONFIG_DEFAULTS, AppConfig } from './schema.js';

export async function loadConfig(cliOptions?: any): Promise<AppConfig> {
  // Load in priority order (lowest to highest)
  // Each layer overrides the previous
  
  const fileConfig = await loadConfigFile();
  const envConfig = loadConfigFromEnv();
  const cliConfig = cliOptions ? extractConfigFromOptions(cliOptions) : {};
  
  // Merge with defaults as base
  const merged = {
    ...CONFIG_DEFAULTS,
    ...fileConfig,
    ...envConfig,
    ...cliConfig,
  };
  
  // Final validation with complete schema
  const result = ConfigSchema.safeParse(merged);
  
  if (!result.success) {
    const errors = result.error.flatten();
    console.error('Configuration Error:');
    Object.entries(errors.fieldErrors).forEach(([key, msgs]) => {
      console.error(`  ${key}: ${msgs?.join(', ')}`);
    });
    throw new Error('Invalid configuration');
  }
  
  return result.data;
}

// Export for testing
export { ConfigSchema, CONFIG_DEFAULTS };
export type { AppConfig };
```

## Usage in Main CLI

```typescript
// src/index.ts
import { Command } from 'commander';
import { addConfigOptions } from './config/cli.js';
import { loadConfig } from './config/index.js';
import chalk from 'chalk';

const program = new Command();

// Add all config options to CLI
addConfigOptions(program);

program
  .action(async (options) => {
    try {
      // Load merged config
      const config = await loadConfig(options);
      
      // Now use config with full type safety
      console.log(chalk.green('Configuration loaded:'));
      console.log(`  API URL: ${config.apiUrl}`);
      console.log(`  Timeout: ${config.timeout}ms`);
      console.log(`  Debug: ${config.debug}`);
    } catch (error) {
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });

await program.parseAsync(process.argv);
```

## Advanced: Typed Config with TypeScript

```typescript
// ✅ Good: Full type safety from Zod
const config = await loadConfig(options);

// TypeScript knows config.type is AppConfig
config.apiUrl;      // ✓ Correct
config.timeOut;     // ✗ Type error - typo caught
config.unknownKey;  // ✗ Type error - doesn't exist
```

## Config File Format Examples

### JSON Format
```json
{
  "apiUrl": "https://api.production.com",
  "timeout": 60000,
  "retries": 5,
  "debug": false
}
```

### YAML Format (with yaml package)
```yaml
apiUrl: https://api.production.com
timeout: 60000
retries: 5
debug: false
```

### Dotenv Format (.env)
```bash
API_URL=https://api.production.com
TIMEOUT=60000
RETRIES=5
DEBUG=false
```

## Pattern: Configuration in Code

```typescript
// src/config/presets.ts - Different environments
import { AppConfig } from './schema.js';

export const PRESETS = {
  development: {
    apiUrl: 'http://localhost:3000',
    timeout: 5000,
    retries: 1,
    debug: true,
  } satisfies AppConfig,
  
  production: {
    apiUrl: 'https://api.example.com',
    timeout: 30000,
    retries: 3,
    debug: false,
  } satisfies AppConfig,
};

// Usage
const env = process.env.NODE_ENV || 'development';
const preset = PRESETS[env as keyof typeof PRESETS];
```

## Testing Configuration

```typescript
// test/config.test.ts
import { ConfigSchema, CONFIG_DEFAULTS } from '../src/config/schema.js';
import { loadConfig } from '../src/config/index.js';

test('default config is valid', () => {
  const result = ConfigSchema.safeParse(CONFIG_DEFAULTS);
  expect(result.success).toBe(true);
});

test('loadConfig merges sources correctly', async () => {
  // Mock would need to be set up
  const config = await loadConfig({
    apiUrl: 'http://localhost:3000',
  });
  expect(config.apiUrl).toBe('http://localhost:3000');
  expect(config.timeout).toBe(CONFIG_DEFAULTS.timeout); // From defaults
});

test('invalid config throws error', () => {
  const result = ConfigSchema.safeParse({
    apiUrl: 'not-a-url', // Invalid URL
    timeout: 30000,
    retries: 0,
    debug: false,
  });
  expect(result.success).toBe(false);
});
```

## Configuration Validation Rules

```typescript
// ✅ Good: Domain-specific validation
export const ConfigSchema = z.object({
  // Strings
  apiUrl: z.string().url('Must be valid URL'),
  
  // Numbers with ranges
  timeout: z.number().int().positive('Must be positive'),
  retries: z.number().int().min(0).max(10),
  
  // Enums
  environment: z.enum(['development', 'staging', 'production']),
  
  // Optional values with defaults handled separately
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).optional(),
});
```

## Best Practices

1. **Validate at the boundary** - Validate when loading config, not when using it
2. **Single schema** - Define validation once, reuse everywhere
3. **Type inference** - Use `z.infer<typeof Schema>` for types
4. **Clear errors** - Validation errors should explain what's wrong
5. **Document defaults** - Keep `CONFIG_DEFAULTS` up to date
6. **Environment variable prefix** - Use a clear prefix to avoid conflicts
7. **Test all sources** - Test file, env, CLI, and merged configs
8. **Log effective config** - Debug logging should show what config is in use

## Common Patterns

### Feature Flags
```typescript
const featureFlags = z.object({
  betaFeatures: z.boolean().default(false),
  analyticsEnabled: z.boolean().default(true),
});
```

### Secret Management
```typescript
// Never log secrets!
if (config.debug) {
  console.log('Config:', {
    ...config,
    apiKey: '***', // Mask secret
  });
}
```

### Config Caching
```typescript
let cachedConfig: AppConfig | null = null;

export async function getConfig(): Promise<AppConfig> {
  if (!cachedConfig) {
    cachedConfig = await loadConfig();
  }
  return cachedConfig;
}
```

## Related Skills
- TypeScript CLI Development (Core)
- Zod Schema Design Patterns
- Error Handling in CLI Applications
