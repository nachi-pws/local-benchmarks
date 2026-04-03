# Project File Guide

This document explains every file in the LaiLai CLI project and why it exists.

## Root-Level Configuration Files

### `package.json`
**Purpose**: Node.js project manifest that defines metadata, dependencies, and npm scripts.

**Why it exists**: 
- Declares the project is an **ES modules** project (`"type": "module"`)
- Lists all runtime dependencies (chalk, commander, zod) and dev dependencies (typescript, tsx, tsup)
- Defines npm scripts for development (`npm run dev`), building (`npm run build`), and running (`npm start`)
- Specifies the bin entry point so the package can be installed globally as a CLI tool
- Sets Node.js engine requirement to ≥20.0.0

**Key settings explained**:
- `"type": "module"` — Enables ES modules (import/export syntax)
- `"main": "./dist/index.js"` — Points to the compiled entry point
- `"bin": { "lailai": "./dist/index.js" }` — Makes the package executable as `lailai` command when installed globally
- `"engines"` — Requires Node 20+ (has top-level await and modern features)

### `tsconfig.json`
**Purpose**: TypeScript compiler configuration that controls how .ts files are compiled.

**Why it exists**:
- **`target: "ES2022"`** — Compiles to modern JavaScript for Node 20
- **`module: "ESNext"`** — Outputs ES modules (import/export) without transpilation
- **`strict: true`** — Enables all strict type checking (catches more bugs at compile time)
- **`noUncheckedIndexedAccess: true`** — Prevents accessing array elements without type safety
- **`declaration: true`** — Generates `.d.ts` type definition files for library consumers
- **`outDir: "./dist"`** — Output location for compiled JavaScript
- **`rootDir: "./src"`** — Input location for TypeScript source files

**Strict options explained**:
- `noUnusedLocals: true` — Errors if you declare a variable but never use it
- `noUnusedParameters: true` — Errors if function parameters aren't used
- `noFallthroughCasesInSwitch: true` — Prevents accidental missing `break` statements

### `.gitignore`
**Purpose**: Tells Git which files and folders to exclude from version control.

**Why it exists**:
- **`node_modules/`** — Never commit dependencies (can be reinstalled with npm install)
- **`dist/`** — Never commit build outputs (regenerated with npm run build)
- **`.env`** — Never commit sensitive environment variables
- **IDE files** (`.vscode/`, `.idea/`) — Keep personal IDE settings out of the repo
- **Logs** — Keep runtime logs out of version control

---

## Source Code

### `src/index.ts`
**Purpose**: The main entry point of the CLI application.

**Why it exists**:
- **`#!/usr/bin/env node`** — Shebang line that makes the script executable as a binary when installed globally
- Imports required libraries: `commander` (CLI framework), `chalk` (colored output), `zod` (validation)
- Uses **Zod schema** to validate CLI arguments with error messages
- Uses **Commander** to parse `--name` flag and handle CLI logic
- Uses **Chalk** to display colored console output for better UX

**Code flow**:
1. Define validation schema with Zod
2. Create Commander program with description and version
3. Add `--name` option with default value "World"
4. Validate user input against schema
5. Display colored greeting using Chalk
6. Exit with error code if validation fails

**Libraries explained**:
- **Commander**: Parses command-line arguments and flags
- **Chalk**: Adds ANSI colors to terminal output (e.g., `chalk.green()`, `chalk.red()`)
- **Zod**: Runtime schema validation with TypeScript inference

---

## Documentation

### `README.md`
**Purpose**: Project overview and quick start guide for users and developers.

**Contains**:
- Prerequisites and setup instructions
- Commands for development, building, and running
- Instructions for global installation
- Project structure diagram
- Technology stack explanation
- License information

### `PROJECT-GUIDE.md` (this file)
**Purpose**: Detailed explanation of every file and the rationale behind the project structure.

---

## Dependency Explanation

### Runtime Dependencies (used in production)

#### `commander` (v12.0.0)
- **Purpose**: Command-line interface framework
- **Why**: Makes it easy to define CLI commands, flags, and options with built-in help text
- **Alternative**: yargs, minimist (but Commander is more modern and popular)

#### `chalk` (v5.3.0)
- **Purpose**: Terminal string styling with colors
- **Why**: Makes CLI output more readable and visually appealing
- **Alternative**: colorette (similar), colors (older)

#### `zod` (v3.22.4)
- **Purpose**: TypeScript-first schema validation library
- **Why**: Validates and transforms user input with full type safety and descriptive error messages
- **Alternative**: io-ts, Joi, Pinia (but Zod is most popular in modern TypeScript)

### Development Dependencies (only used during development/build)

#### `typescript` (v5.3.3)
- **Purpose**: TypeScript compiler
- **Why**: Enables static type checking and modern TypeScript features
- **Why installed as dev dep**: Only needed for compilation, not at runtime

#### `tsx` (v4.7.0)
- **Purpose**: Fast TypeScript executor without pre-compilation
- **Why**: Allows `npm run dev` to run TypeScript directly without waiting for a build
- **Why installed as dev dep**: Only used during development; production uses compiled JavaScript

#### `tsup` (v8.0.1)
- **Purpose**: Minimal, zero-config build tool
- **Why**: Bundles TypeScript into optimized ESM JavaScript for distribution
- **Alternative**: esbuild (lower level), webpack (overkill for CLI), tsc (slower)
- **Why installed as dev dep**: Only needed during the build step

#### `@types/node` (v20.10.0)
- **Purpose**: TypeScript type definitions for Node.js built-in APIs
- **Why**: Enables type checking for Node.js APIs like `process.exit()`
- **Why installed as dev dep**: Only needed for TypeScript compilation

---

## Scripts Explained

### `npm run dev`
```bash
npm run dev --name "Alice"
```
- Runs `tsx src/index.ts` which executes TypeScript directly without compilation
- Fastest for development/testing
- Useful for iterating quickly

### `npm run build`
```bash
npm run build
```
- Runs `tsup src/index.ts` to compile TypeScript to optimized JavaScript
- Outputs to `dist/index.js`
- Must be run before `npm start` or global installation
- Creates source maps and type definitions

### `npm start`
```bash
npm start -- --name "Alice"
```
- Runs the compiled `dist/index.js` to test the built application
- Mimics how users will run the CLI after installation

### `npm run type-check`
```bash
npm run type-check
```
- Runs TypeScript compiler without outputting files
- Checks for type errors
- Useful in CI/CD pipelines

---

## Workflow Recommendations

### For Development
1. Edit code in `src/`
2. Run `npm run dev --name "YourName"` to test changes immediately
3. No build step needed during development

### Before Publishing
1. Run `npm run build` to compile everything
2. Run `npm start -- --name "Test"` to verify the build works
3. Commit `package.json` and source files to Git (not `dist/`)

### For Global Installation
1. Build the project: `npm run build`
2. Install globally: `npm install -g .`
3. Use anywhere: `lailai --name "Alice"`

---

## ESM vs CommonJS Note

This project uses **ES Modules** (ESM):
- `import` / `export` syntax
- Requires `"type": "module"` in package.json
- Better for modern development
- Node 20 has excellent ESM support

**vs CommonJS** (older):
- `require()` / `module.exports` syntax
- Default in older Node versions
- Still widely used but being phased out

We chose ESM because:
- It's now the standard in JavaScript
- Better tree-shaking (unused code removal)
- Better for modern tooling
- All our dependencies support ESM
