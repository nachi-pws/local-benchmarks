# Local Benchmarks

A comprehensive suite of tools for benchmarking and analyzing local LLM (Large Language Model) performance using Node.js and GGUF model files.

## Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Local LLM Server**: Running LLM server (e.g., Ollama, LLaMA Server) on localhost
- **GGUF Models**: Compatible GGUF format model files

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run benchmarks**:
   ```bash
   npm run benchmark:all
   ```

## Available Scripts

### Main Benchmarking Commands

| Command | Script | Purpose |
|---------|--------|---------|
| `npm run benchmark:all` | `run-all-benchmarks.js` | Run comprehensive benchmarks across all configured models |
| `npm run benchmark:compare` | `compare-all-models-next.js` | Compare performance metrics between models |
| `npm run analyze:quality` | `analyze-model-quality.js` | Analyze and provide recommendations for model quality |
| `npm run report` | `report-generator.js` | Generate performance reports from benchmark data |
| `npm run read:gguf` | `read-gguf-properties.js` | Read and display GGUF model properties |

### Running Individual Scripts

You can also run scripts directly:

```bash
node scripts/run-all-benchmarks.js
node scripts/compare-all-models-next.js
node scripts/analyze-model-quality.js
node scripts/report-generator.js scripts/benchmark-report-*.json
node scripts/read-gguf-properties.js /path/to/model.gguf
```

## Configuration

### Model Configuration (`scripts/launchConfig.json`)

Define your models in `launchConfig.json`:

```json
{
  "models": [
    {
      "name": "Model Name",
      "filename": "model-filename.gguf",
      "parameters": "7B",
      "description": "Model description"
    }
  ]
}
```

### Prompt Configuration (`scripts/promptConfig.json`)

Define test prompts in `promptConfig.json` for benchmarking consistency.

## Project Structure

```
local-benchmarks/
├── scripts/                          # Main JavaScript benchmark scripts
│   ├── run-all-benchmarks.js        # Primary benchmark runner
│   ├── compare-all-models-next.js   # Model comparison utility
│   ├── analyze-model-quality.js     # Quality analysis tool
│   ├── report-generator.js          # Report generation
│   ├── read-gguf-properties.js      # GGUF property reader
│   ├── launchConfig.json            # Model configurations
│   ├── promptConfig.json            # Benchmark prompts
│   └── benchmark-report-*.json      # Generated benchmark reports
├── docs/                             # Documentation and guides
├── archives/                         # Archived scripts and utilities
├── package.json                      # Project dependencies
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # This file
```

## Technology Stack

- **Node.js**: JavaScript runtime for server-side execution
- **ES Modules**: Modern JavaScript module system
- **@huggingface/gguf**: GGUF file format parsing
- **chalk**: Terminal output coloring
- **jsonc-parser**: JSON with comments parsing

## Features

- ✅ Comprehensive LLM benchmarking
- ✅ Multi-model comparison
- ✅ Performance analysis and reporting
- ✅ GGUF model property inspection
- ✅ Configurable test prompts
- ✅ Detailed logging and metrics

## Development

### Type Checking

Check JavaScript syntax and types:

```bash
npx tsc --noEmit
```

## Troubleshooting

### Server Connection Issues

Ensure your LLM server is running and accessible:
- Default connection: `http://localhost:8000`
- Check server status and available models

### Missing Configuration Files

Ensure `launchConfig.json` and `promptConfig.json` exist in the `scripts/` directory with proper formatting.

### Module Not Found Errors

Run `npm install` to ensure all dependencies are installed.

## Documentation

- See [docs/](docs/) for detailed guides
- Archives in [archives/](archives/) contain additional utilities and examples

## License

MIT

