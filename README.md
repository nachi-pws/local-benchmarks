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

### Utility Commands

| Command | Purpose | Usage |
|---------|---------|-------|
| `.\launch-gguf.ps1` | Interactive model launcher for separate testing | See [Launching Individual Models](#launching-individual-models-for-testing) below |

**Note**: Utility scripts must be run from the `scripts/` directory using PowerShell.

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

## Launching Individual Models for Testing

The `launch-gguf.ps1` script allows you to interactively launch specific models with llama-server for isolated testing or API experimentation.

### Basic Usage

```powershell
# From scripts directory
cd D:\Project-Learning\local-benchmarks\scripts

# Default: localhost only (secure, local development)
.\launch-gguf.ps1

# Network accessible: bind to 0.0.0.0 (remote machine access)
.\launch-gguf.ps1 --network

# Show help and available options
.\launch-gguf.ps1 --help
```

### Binding Modes

**Default (`127.0.0.1` - Localhost Only)**
- Only accepts local connections from the same machine
- Secure for development and testing
- Suitable for: Local API testing, personal experiments
- Access: `http://127.0.0.1:8000`

**Network Mode (`0.0.0.0` - All Interfaces)**
- Accepts connections from any machine on your network
- ⚠️ Use with caution on public networks
- Suitable for: Team development, remote testing, cross-machine access
- Access: `http://<your-ip>:8000` from other machines
- Command: `.\launch-gguf.ps1 --network`

### Interactive Selection

When you run the script, it will prompt you to:

1. **Select a Model** (1-10):
   ```
   [1] Qwen3-Coder-30B-A3B
   [2] Gemma-4-31B
   [3] Qwen3-VL-30B-A3B
   [4] GLM-4.6V-Flash
   [5] LFM2-24B-A2B
   [6] Qwen3.5-9B
   [7] Devstral-Small-2-24B-Instruct
   [8] Qwen3.5-27B
   [9] Qwen3-Coder-Next-UD-Q5_K_M ⚠️ Requires vulkan-b8672+
   [10] Nemotron-3-Nano-30B-A3B
   ```

2. **Select llama-server Version**:
   - HIP-b8838 (HIP Radeon with recent fixes)
   - vulkan-b8672 (Vulkan - RECOMMENDED for Strix Halo)
   - HIP-b8665 (Legacy - avoid for Qwen3-Coder-Next)

3. **Review Configuration** and confirm startup

### Testing a Specific Model

```powershell
# Launch Qwen3-Coder-Next (model 9)
.\launch-gguf.ps1
# Enter: 9
# Select version: 2 (vulkan-b8672)
```

### Server Startup Display

The script shows binding mode at startup:

```
Binding Mode: LOCALHOST (local access only)

...
[READY] Server is ready!

=============================================================
               SERVER RUNNING SUCCESSFULLY
=============================================================

Model:        Qwen3-Coder-Next-UD-Q5_K_M
API Endpoint: http://127.0.0.1:8000/completion
PID:          27704
Binding:      127.0.0.1

=============================================================
```

Or with `--network` flag:

```
Binding Mode: NETWORK (accessible from other machines)

...
API Endpoint: http://0.0.0.0:8000/completion
Binding:      0.0.0.0
```

### Server is Ready When

The script will:
- Display binding mode at startup
- Show model loading progress in console
- Perform health checks via `/slots` endpoint
- Transition from `503 Service Unavailable` to `200 OK`
- Display final startup summary with binding address and parameter details

Once ready, you can:
- **Localhost mode** (`127.0.0.1`): Test the API locally via `curl` or Postman on `http://127.0.0.1:8000`
- **Network mode** (`0.0.0.0`): Access from other machines using your machine's IP address (e.g., `http://192.168.1.100:8000`)
- Send requests to `/v1/chat/completions` (OpenAI-compatible endpoint)
- Use `/v1/completions` for raw text completion

### Example: Quick API Test (Local)

```bash
# In a separate terminal, while server is running (localhost mode)
curl -X POST http://127.0.0.1:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "current",
    "messages": [{"role": "user", "content": "Hello, what is Rust?"}],
    "temperature": 0.7,
    "max_tokens": 200
  }'
```

### Example: Network Access

```powershell
# Terminal 1: Start server in network mode
.\launch-gguf.ps1 --network
# Note the binding: http://0.0.0.0:8000 (or use your machine's actual IP)

# Terminal 2: From another machine on the network
# Replace 192.168.1.100 with your machine's actual IP address
curl -X POST http://192.168.1.100:8000/v1/chat/completions `
  -H "Content-Type: application/json" `
  -d '{
    "model": "current",
    "messages": [{"role": "user", "content": "Hello from remote machine"}],
    "temperature": 0.7,
    "max_tokens": 200
  }'
```

### Stopping the Server

Simply press `Ctrl+C` in the llama-server terminal to gracefully shutdown.

---

## Server Startup: Understanding 503 Errors

### What Are the "503 Service Unavailable" Errors?

When launching a model with `launch-gguf.ps1`, you may see repeated messages like:

```
srv  log_server_r: done request: GET /slots 127.0.0.1 503
  Attempt 1/180 (elapsed: 32s)...
srv  log_server_r: done request: GET /slots 127.0.0.1 503
  Attempt 2/180 (elapsed: 34s)...
```

**These are completely normal and expected.**

### Why It Happens

1. **Model Loading in Progress**: The GGUF model is being loaded into GPU memory
   - Large models (30B+) can take 30-120 seconds
   - You'll see `load_tensors:` messages showing progress
   - Example: `load_tensors: offloaded 49/49 layers to GPU`

2. **Health Check Polling**: The script is automatically checking server readiness
   - Polls `/slots` endpoint every 2 seconds
   - Returns 503 while model loading is incomplete
   - Retries up to 180 times (360 seconds total)

3. **Not an Error**: The 503 response is the expected behavior during initialization
   - The server intentionally returns 503 until fully ready
   - This prevents incomplete requests during model loading

### When Startup is Complete

The script has succeeded when:
- Status changes from `503` to `200 OK`
- Model loading messages stop
- Script displays the **STARTUP CONFIGURATION SUMMARY** section
- Server opens an interactive shell, ready for requests

### If Startup Times Out

If you see `[ERROR] Max wait attempts exceeded` after 180 attempts:

1. Check GPU memory:
   ```powershell
   # Verify GPU has enough VRAM free
   Get-Process llama-server | Select-Object WorkingSet64
   ```

2. Verify llama-server executable path in `launchConfig.json`

3. Try a smaller model first to rule out GPU issues:
   - Model 6 (Qwen3.5-9B) or Model 5 (LFM2-24B) are faster to load

4. Increase the timeout in `launchConfig.json`:
   ```json
   "max_wait_attempts": 300,
   "startup_delay_ms": 60000
   ```

---

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

