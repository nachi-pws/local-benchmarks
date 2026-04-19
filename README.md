# Local Benchmarks

A comprehensive suite of tools for benchmarking and analyzing local LLM (Large Language Model) performance using Node.js and GGUF model files.

## Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **GGUF Models**: Compatible GGUF format model files
- **llama-server**: Running on localhost:8000 (for some scripts)

For detailed setup instructions, see [PREREQUISITES-AND-PREP.md](PREREQUISITES-AND-PREP.md).

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure models** in `scripts/launchConfig.json` and prompts in `scripts/promptConfig.json`

3. **Run benchmarks**:
   ```bash
   npm run benchmark:compare
   ```

## Available Scripts

All scripts can be run from **any directory** - no need to `cd scripts`!

### Main Commands

| Command | Purpose | Usage |
|---------|---------|-------|
| `npm run benchmark:compare` | Multi-model benchmark with prompt selection | `npm run benchmark:compare` or `node scripts/compare-all-models-next.js --prompt=1` |
| `npm run benchmark:all` | Automated batch testing with logging | `npm run benchmark:all` |
| `npm run analyze:quality` | Analyze current model quality* | `npm run analyze:quality` |
| `npm run report` | Generate consolidated markdown report | `npm run report` |
| `npm run read:gguf` | Inspect GGUF model metadata | `npm run read:gguf` |

*Requires llama-server running on localhost:8000

### Script Details

#### 1. Multi-Model Benchmark
```bash
# Interactive prompt selection
npm run benchmark:compare

# Specify prompt and auto-start
node scripts/compare-all-models-next.js --prompt=1 --no-wait

# Resume after interruption at combination #42
node scripts/compare-all-models-next.js --prompt=1 --start=43
```

Options: `--prompt=N`, `--start=N`, `--no-wait`, `--help`

Output: Console + JSON report in `reports/benchmark-report-*.json`

#### 2. Report Generator
```bash
# Use reports folder (default)
npm run report

# Or specify custom folder
npm run report /path/to/reports
```

Input: `reports/*.json` files  
Output: `reports/consolidated-report-*.md` (markdown)

#### 3. Model Quality Analysis
```bash
npm run analyze:quality
```

Output: Console analysis + recommendations (requires llama-server)

#### 4. Read GGUF Properties
```bash
npm run read:gguf
```

Interactive: Select model ID → Display all GGUF metadata

#### 5. Batch Testing
```bash
npm run benchmark:all
```

Runs comprehensive tests with detailed logging to `scripts/run-all-benchmarks-*.log`

## Configuration

### Model Configuration (`scripts/launchConfig.json`)

```json
{
  "llamaServerVersions": {
    "default": "vulkan-b8672",
    "available": {
      "vulkan-b8672": {
        "path": "D:\\Llama-Server-Exes\\llama-b8672-bin-win-vulkan-x64\\llama-server.exe",
        "label": "Vulkan Build"
      }
    }
  },
  "models": [
    {
      "id": 1,
      "name": "Qwen3-Coder-30B",
      "filename": "Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf",
      "path": "D:\\Large-Lang-Models\\Models\\...",
      "parameters": {
        "temperature": 0.7,
        "top_p": 0.8,
        "top_k": 20,
        "ctx_size": 65536,
        "n_predict": -1,
        "n_threads": 4,
        "n_gpu_layers": 99,
        "flash_attn": true,
        "jinja": true
      }
    }
  ]
}
```

See [PREREQUISITES-AND-PREP.md](PREREQUISITES-AND-PREP.md) for complete configuration guide.

### Prompt Configuration (`scripts/promptConfig.json`)

```json
{
  "prompts": [
    {
      "id": 1,
      "name": "TypeScript Basics",
      "prompt": "What is TypeScript and why is it useful?",
      "category": "basics",
      "length": "short",
      "streaming": true,
      "enable_thinking": false
    }
  ]
}
```

## Architecture

### Path Resolution

All scripts use a unified `config-loader.js` utility for consistent path resolution:

- Works from any directory (root, scripts folder, or elsewhere)
- Auto-discovers project root directory
- Auto-creates reports folder if missing
- Supports JSONC format in config files

**Key Functions**:
- `getRootDir()` - Project root directory
- `getScriptsDir()` - Scripts folder path
- `getReportsDir()` - Reports folder (auto-created)
- `loadLaunchConfig()` - Load model config
- `loadPromptConfig()` - Load prompt config

### Project Structure

```
local-benchmarks/
├── scripts/                          # Main JavaScript benchmark scripts
│   ├── config-loader.js             # ⭐ Unified path resolver
│   ├── compare-all-models-next.js   # Multi-model benchmark
│   ├── run-all-benchmarks.js        # Batch testing
│   ├── analyze-model-quality.js     # Quality analysis
│   ├── report-generator.js          # Report consolidation
│   ├── read-gguf-properties.js      # GGUF inspector
│   ├── launchConfig.json            # Model & server config
│   └── promptConfig.json            # Test prompts
├── reports/                          # Generated reports (gitignored except sample/)
│   ├── sample/                      # Sample reports (version controlled)
│   ├── benchmark-report-*.json      # Generated JSON reports
│   └── consolidated-report-*.md     # Generated markdown reports
├── docs/                             # Documentation
├── archives/                         # Archived utilities
├── package.json                      # Dependencies
├── PREREQUISITES-AND-PREP.md        # Setup guide
├── PATH-RESOLUTION-REFACTOR.md      # Technical details
└── README.md                         # This file
```

## Technology Stack

- **Node.js**: Runtime
- **ES Modules**: Modern JavaScript
- **@huggingface/gguf**: GGUF file parsing
- **chalk**: Terminal formatting
- **jsonc-parser**: JSON with comments

## Examples

### Complete Workflow

```bash
# 1. Start from project root
cd D:\Project-Learning\local-benchmarks

# 2. Run benchmark with prompt selection
npm run benchmark:compare
# Select prompt 1: "TypeScript Basics"

# 3. Wait for completion (reports save automatically)

# 4. Generate consolidated report
npm run report

# 5. View results
code reports/consolidated-report-*.md
```

### Multi-Prompt Testing

```bash
# Test multiple prompts
node scripts/compare-all-models-next.js --prompt=1 --no-wait
# [wait for completion]
node scripts/compare-all-models-next.js --prompt=2 --no-wait

# Consolidate all results
npm run report
```

### Resume Interrupted Benchmark

```bash
# Interrupted at combination #42? Resume from #43
node scripts/compare-all-models-next.js --prompt=1 --start=43
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot find module './config-loader.js'" | Run from root: `npm run benchmark:compare` or `node scripts/...` |
| "launchConfig.json not found" | Verify files exist in `scripts/` with valid JSON |
| "Cannot connect to llama-server" | Start llama-server first on localhost:8000 |
| "Reports directory not found" | Scripts auto-create it; or manually: `mkdir reports` |

For detailed troubleshooting, see [PREREQUISITES-AND-PREP.md](PREREQUISITES-AND-PREP.md).

## Documentation

- **[PREREQUISITES-AND-PREP.md](PREREQUISITES-AND-PREP.md)** - Complete setup guide with GGUF downloads, llama-server installation, config details
- **[PATH-RESOLUTION-REFACTOR.md](scripts/PATH-RESOLUTION-REFACTOR.md)** - Technical details on path resolution system
- **[docs/](docs/)** - Additional guides and analysis
- **[archives/](archives/)** - Legacy scripts and utilities

## Features

- ✅ Multi-model & multi-server benchmarking
- ✅ Performance analysis (TTFT, total time, token count)
- ✅ Configurable test prompts
- ✅ Automated report generation
- ✅ GGUF metadata inspection
- ✅ Consistent path resolution from any directory
- ✅ Real-time streaming support
- ✅ Detailed logging and metrics

## Development

### Type Checking

```bash
npx tsc --noEmit
```

### Running Scripts Directly

```bash
# From any directory with absolute path
node D:\Project-Learning\local-benchmarks\scripts\compare-all-models-next.js

# Or from project root
node scripts/compare-all-models-next.js

# Or from scripts directory
cd scripts && node compare-all-models-next.js
```

## License

MIT

