# TypeScript CLI Testing Strategies

## Overview
This skill defines patterns for testing TypeScript CLI applications that are reliable, maintainable, and provide fast feedback.

## Testing Architecture

### Layer-Based Testing Strategy

```
CLI Application Layers:
┌─────────────────────────┐
│  I/O Layer (Chalk)      │ → E2E tests only (integration)
├─────────────────────────┤
│  CLI Layer (Commander)  │ → Unit + Integration tests
├─────────────────────────┤
│  Validation (Zod)       │ → Unit tests
├─────────────────────────┤
│  Business Logic         │ → Unit tests (mostly)
└─────────────────────────┘
```

**Strategy**: Extract business logic from CLI layer for easier testing

## Unit Testing Pattern

```typescript
// ✅ Good: Pure function in src/core.ts (no I/O)
export function calculatePrice(
  basePrice: number,
  taxRate: number
): number {
  return basePrice * (1 + taxRate);
}

// Easy to test - no mocking needed
// test/core.test.ts
import { calculatePrice } from '../src/core.js';

test('calculatePrice applies tax correctly', () => {
  expect(calculatePrice(100, 0.1)).toBe(110);
  expect(calculatePrice(200, 0.1)).toBe(220);
});
```

## Validation Testing

```typescript
// src/schemas.ts - Extract Zod schemas
import { z } from 'zod';

export const UserInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().int().positive(),
});

export type UserInput = z.infer<typeof UserInputSchema>;

// test/schemas.test.ts - Test validation rules
test('UserInputSchema validation', () => {
  // Valid input
  expect(
    UserInputSchema.safeParse({
      name: 'Alice',
      email: 'alice@example.com',
      age: 30,
    }).success
  ).toBe(true);

  // Invalid email
  expect(
    UserInputSchema.safeParse({
      name: 'Bob',
      email: 'not-an-email',
      age: 25,
    }).success
  ).toBe(false);

  // Negative age
  expect(
    UserInputSchema.safeParse({
      name: 'Charlie',
      email: 'charlie@example.com',
      age: -5,
    }).success
  ).toBe(false);
});
```

## Integration Testing (CLI Layer)

### Testing with Mock I/O

```typescript
// src/cli.ts
import { Command } from 'commander';

export function createProgram() {
  const program = new Command();
  program
    .option('--name <string>', 'Name to greet')
    .action((options) => {
      // Return value for testing
      return { greeting: `Hello, ${options.name}!` };
    });
  return program;
}

// test/cli.test.ts
import { createProgram } from '../src/cli.js';

test('CLI greeting option', async () => {
  const program = createProgram();
  const result = await program.parseAsync(
    ['node', 'cli.js', '--name', 'Alice'],
    { from: 'user' }
  );
  expect(result.greeting).toBe('Hello, Alice!');
});
```

### Testing Error Handling

```typescript
// ✅ Good: Test error paths
test('CLI rejects invalid input', () => {
  const inputSchema = z.object({
    age: z.number().int().positive(),
  });

  const result = inputSchema.safeParse({ age: -5 });
  expect(result.success).toBe(false);
  
  if (!result.success) {
    expect(result.error.errors[0].message).toContain('positive');
  }
});
```

## E2E Testing Pattern

### Using Child Process

```typescript
// test/e2e.test.ts
import { execSync } from 'child_process';

test('CLI returns correct greeting', () => {
  const output = execSync(
    'npm run dev -- --name Alice',
    { encoding: 'utf-8' }
  );
  expect(output).toContain('Hello, Alice');
});

test('CLI exits with error code on validation failure', () => {
  expect(() => {
    execSync('npm run dev -- --name ""', {
      stdio: 'pipe',
    });
  }).toThrow();
});
```

## Recommended Test Setup

### package.json Configuration

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0"
  }
}
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['test/**/*.test.ts'],
  },
});
```

## Testing Checklist

### Unit Tests
- [ ] Pure functions return expected values
- [ ] Edge cases handled correctly
- [ ] Validation schemas reject invalid input
- [ ] Error conditions produce correct messages

### Integration Tests
- [ ] CLI parses arguments correctly
- [ ] Options are passed to handlers
- [ ] Commands execute without errors
- [ ] Output is formatted correctly

### E2E Tests
- [ ] CLI runs from command line successfully
- [ ] Exit codes are correct (0 for success, >0 for failure)
- [ ] Help text displays correctly
- [ ] Real file I/O works end-to-end

## Testing Best Practices

```typescript
// ✅ Good: Arrange-Act-Assert pattern
test('calculateDiscount', () => {
  // Arrange
  const price = 100;
  const discountRate = 0.1;
  
  // Act
  const result = calculateDiscount(price, discountRate);
  
  // Assert
  expect(result).toBe(90);
});

// ✅ Good: Descriptive test names
test('calculateDiscount applies percentage reduction correctly', () => {
  // ...
});

// ✅ Good: Test one thing per test
test('calculateDiscount with valid input', () => { /* ... */ });
test('calculateDiscount rejects negative price', () => { /* ... */ });

// ❌ Bad: Testing multiple things
test('calculateDiscount works', () => {
  expect(calculateDiscount(100, 0.1)).toBe(90);
  expect(calculateDiscount(200, 0.2)).toBe(160);
  expect(calculateDiscount(-5, 0.1)).toThrow();
});
```

## Mocking Patterns

### Mocking File System

```typescript
// ✅ Strategy: Extract file ops into separate modules
// src/files.ts
import { promises as fs } from 'fs';

export async function readConfig(path: string): Promise<Config> {
  const data = await fs.readFile(path, 'utf-8');
  return JSON.parse(data);
}

// test/files.test.ts - Mock the file system
import { vi } from 'vitest';
import * as fileModule from '../src/files.js';

test('readConfig parses JSON correctly', async () => {
  vi.spyOn(fileModule, 'readConfig').mockResolvedValue({
    apiUrl: 'http://localhost:3000',
  });

  const config = await fileModule.readConfig('config.json');
  expect(config.apiUrl).toBe('http://localhost:3000');
});
```

### Mocking Network Requests

```typescript
// ✅ Strategy: Extract API calls
// src/api.ts
export async function fetchData(url: string): Promise<Data> {
  const response = await fetch(url);
  return response.json();
}

// test/api.test.ts
import { vi } from 'vitest';

test('fetchData makes correct request', async () => {
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ id: 1, name: 'Test' }),
  });

  const data = await fetchData('http://api.example.com/data');
  expect(fetch).toHaveBeenCalledWith('http://api.example.com/data');
  expect(data.name).toBe('Test');
});
```

## Snapshot Testing (Use Sparingly)

```typescript
// ⚠️ Only for complex output
test('help text format', () => {
  const help = program.helpInformation();
  expect(help).toMatchSnapshot();
});
```

**Note**: Use snapshots only for output that rarely changes. Prefer explicit assertions for business logic.

## Performance Testing

```typescript
// ✅ Test for reasonable performance
test('processes 1000 items in <100ms', () => {
  const items = Array.from({ length: 1000 }, (_, i) => i);
  
  const start = performance.now();
  const result = processItems(items);
  const end = performance.now();
  
  expect(result.length).toBe(1000);
  expect(end - start).toBeLessThan(100);
});
```

## Coverage Goals

- **Business logic**: Aim for 80%+ coverage
- **CLI layer**: 60-70% coverage (harder to test)
- **Configuration**: 100% coverage (critical path)
- **Don't obsess over 100% coverage** - test important paths

## Testing Antipatterns to Avoid

❌ **Don't**: Test implementation details
```typescript
// Bad - tests private behavior
test('internal function calls helper', () => {
  const spy = vi.spyOn(module, 'helperFunc');
  publicFunc();
  expect(spy).toHaveBeenCalled();
});
```

✅ **Do**: Test behavior
```typescript
// Good - tests observable behavior
test('public function returns correct result', () => {
  expect(publicFunc(input)).toBe(expectedOutput);
});
```

❌ **Don't**: Test external libraries
```typescript
// Bad - testing Commander, not our code
test('commander parses arguments', () => {
  program.option('--name <string>');
  // ...
});
```

✅ **Do**: Test how we use libraries
```typescript
// Good - testing our usage
test('CLI processes --name option correctly', () => {
  const result = parseCliArgs(['--name', 'Alice']);
  expect(result.name).toBe('Alice');
});
```

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- test/core.test.ts
```

## Continuous Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run type-check
```

## Related Skills
- TypeScript CLI Development (Core)
- Debugging CLI Applications
- Test Coverage Analysis
