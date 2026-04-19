# Prerequisites and Setup Guide for Local Benchmarks

## 🎯 Quick Start Checklist

- [ ] Install Node.js (v18+)
- [ ] Install npm dependencies
- [ ] Download GGUF model files
- [ ] Download llama-server executables
- [ ] Configure `launchConfig.json` with model paths
- [ ] Configure `launchConfig.json` with server paths
- [ ] Configure `promptConfig.json` with test prompts
- [ ] Create required directories
- [ ] Verify setup with test command

---

## 📦 Node.js & npm Dependencies

### System Requirements

- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher (comes with Node.js)
- **RAM**: 128GB+ recommended (for large models)
- **GPU**: Optional but recommended (supports HIP, Vulkan, CUDA via llama-server)

### Installation

1. **Download Node.js**
   - Visit: https://nodejs.org/
   - Download LTS version (v20+)
   - Install and verify: `node --version` and `npm --version`

2. **Install Project Dependencies**
   ```bash
   cd d:\Project-Learning\local-benchmarks
   npm install
   ```

### Dependencies Installed

| Package | Purpose | Version |
|---------|---------|---------|
| `@huggingface/gguf` | Read GGUF model metadata | ^0.4.1 |
| `chalk` | Terminal colors/formatting | ^5.3.0 |
| `jsonc-parser` | Parse JSON with comments | ^3.3.1 |
| `@types/node` | TypeScript Node.js types | ^20.19.39 |
| `typescript` | TypeScript compiler | ^5.3.3 |

### Available NPM Scripts

```bash
npm run benchmark:all      # Run all benchmark combinations
npm run benchmark:compare  # Run multi-model comparison with prompt selection
npm run analyze:quality    # Analyze model output quality
npm run report             # Generate consolidated report from saved results
npm run read:gguf          # Read and display GGUF model metadata
```

---

## 🤖 GGUF Model Files

### Where to Download GGUF Models

GGUF models are quantized versions of large language models optimized for local inference.

| Model | Download URL | Recommended Quant | File Size |
|-------|-------------|-------------------|-----------|
| **Qwen3-Coder-30B** | https://huggingface.co/Qwen/Qwen3-Coder-30B-Instruct-GGUF | Q4_K_M | ~18GB |
| **Qwen3-VL-30B** | https://huggingface.co/Qwen/Qwen3-VL-30B-Instruct-GGUF | Q2_K | ~12GB |
| **Gemma-4-31B** | https://huggingface.co/unsloth/gemma-4-31B-it-GGUF | Q4_K_M | ~19GB |
| **GLM-4.6V-Flash** | https://huggingface.co/ggml-org/GLM-4.6V-Flash-GGUF | Q8_0 | ~30GB |

### Download Methods

#### Option 1: Using Hugging Face CLI (Recommended)
```bash
# Install huggingface-cli
pip install huggingface-hub

# Download specific file
huggingface-cli download Qwen/Qwen3-Coder-30B-Instruct-GGUF Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf --local-dir D:\Large-Lang-Models\Models
```

#### Option 2: Manual Download
1. Visit the HuggingFace URL
2. Navigate to the specific `.gguf` file
3. Click "Download"
4. Save to your models directory (typically `D:\Large-Lang-Models\Models\`)

#### Option 3: Using BitTorrent (Fast)
- Some repos provide `.torrent` files for faster downloads
- Use a torrent client (qBittorrent, Transmission, etc.)

### Storage Organization

Create this folder structure:
```
D:\Large-Lang-Models\
├── Models\
│   ├── Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf
│   ├── Qwen3-VL-30B-A3B-Instruct-Q2_K.gguf
│   ├── gemma-4-31B-it-Q4_K_M.gguf
│   ├── GLM-4.6V-Flash-Q8_0.gguf
│   └── mmproj-*.gguf (vision model projections)
├── Chat-Templates\
│   └── glm-4.6v-chat-template.jinja
└── Backups\
```

### Vision Models: Additional Files

Vision models (Qwen3-VL, GLM-4.6V) require multimodal projection files:

```bash
# Download mmproj for Qwen3-VL
huggingface-cli download Qwen/Qwen3-VL-30B-Instruct-GGUF mmproj-F16.gguf --local-dir D:\Large-Lang-Models\Models

# Download mmproj for GLM-4.6V
huggingface-cli download ggml-org/GLM-4.6V-Flash-GGUF mmproj-GLM-4.6V-Flash-Q8_0.gguf --local-dir D:\Large-Lang-Models\Models
```

### Quantization Levels Explained

| Quant | Meaning | Quality | Speed | File Size |
|-------|---------|---------|-------|-----------|
| F32 | 32-bit float | ⭐⭐⭐⭐⭐ | 🐢 | Largest |
| F16 | 16-bit float | ⭐⭐⭐⭐ | 🐎 | Large |
| Q8_0 | 8-bit quantized | ⭐⭐⭐⭐ | 🏃 | Medium |
| Q4_K_M | 4-bit (medium) | ⭐⭐⭐ | ⚡ | Small |
| Q2_K | 2-bit extreme | ⭐⭐ | 🚀 | Tiny |

---

## 🖥️ Llama-Server Executables

Llama-server is the backend inference engine that runs models locally.

### Where to Download

**Official llama.cpp Releases**: https://github.com/ggerganov/llama.cpp/releases

Download the appropriate build for your system and GPU:

| Build Type | Use Case | Download |
|-----------|----------|----------|
| **Vulkan** | AMD GPU / Integrated GPU | `llama-*-win-vulkan-x64.zip` |
| **HIP** | AMD Radeon GPU | `llama-*-win-hip-radeon-x64.zip` |
| **CUDA** | NVIDIA GPU | `llama-*-win-cuda-x64.zip` |
| **CPU** | CPU-only (fallback) | `llama-*-win-x64.zip` |

### Recommended Builds by Hardware

#### AMD Ryzen 9 (Strix Halo / Integrated GPU)
- **Primary**: Vulkan build (b8672+) - uses iGPU via Vulkan
- **Fallback**: CPU-only build

#### NVIDIA GPU
- Use CUDA build for best performance

#### Intel CPU (no GPU)
- Use CPU-only build

### Storage Organization

```
D:\Llama-Server-Exes\
├── llama-b8838-bin-win-hip-radeon-x64\
│   ├── llama-server.exe
│   ├── *.dll
│   └── README.md
├── llama-b8672-bin-win-vulkan-x64\
│   ├── llama-server.exe
│   ├── *.dll
│   └── README.md
└── (more versions as needed)
```

### Installation Steps

1. **Download ZIP**: https://github.com/ggerganov/llama.cpp/releases
2. **Extract**: Unzip to `D:\Llama-Server-Exes\llama-b[VERSION]-bin-win-[GPU]-x64\`
3. **Verify**: Run `llama-server.exe --version` to test
4. **Add to PATH** (optional): 
   ```powershell
   # PowerShell (as Admin)
   $env:Path += ";D:\Llama-Server-Exes\llama-b8838-bin-win-hip-radeon-x64"
   ```

---

## ⚙️ Configuration: launchConfig.json

### File Location
```
d:\Project-Learning\local-benchmarks\scripts\launchConfig.json
```

### Structure Overview

```json
{
  "llamaServerVersions": {
    "default": "vulkan-b8672",
    "available": {
      // Server definitions here
    }
  },
  "server": {
    "port": 8000,
    "host": "127.0.0.1",
    // ... server settings
  },
  "models": [
    // Model definitions here
  ]
}
```

### Step 1: Configure Server Versions

Replace the `llamaServerVersions.available` section with your downloaded versions:

```json
"llamaServerVersions": {
  "default": "vulkan-b8672",
  "available": {
    "vulkan-b8672": {
      "path": "D:\\Llama-Server-Exes\\llama-b8672-bin-win-vulkan-x64\\llama-server.exe",
      "label": "Vulkan Build 8672 - Recommended for Strix Halo"
    },
    "hip-b8838": {
      "path": "D:\\Llama-Server-Exes\\llama-b8838-bin-win-hip-radeon-x64\\llama-server.exe",
      "label": "HIP Build 8838 - Alternative for Radeon"
    }
  }
}
```

**Important**: Use double backslashes (`\\`) in JSON file paths.

### Step 2: Configure Models

For each model you downloaded, add an entry:

```json
"models": [
  {
    "id": 1,
    "name": "Qwen3-Coder-30B",
    "filename": "Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf",
    "path": "D:\\Large-Lang-Models\\Models\\Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf",
    "description": "Qwen3 Coder 30B MoE - Code-specialized model",
    "parameters": {
      "temperature": 0.7,
      "top_p": 0.8,
      "top_k": 20,
      "ctx_size": 65536,
      "n_predict": -1,
      "n_threads": 4,
      "n_gpu_layers": 99,
      "flash_attn": true,
      "jinja": true,
      "cache_type_k": "q8_0",
      "cache_type_v": "q8_0"
    }
  }
]
```

### Step 3: Configure Server Settings

```json
"server": {
  "port": 8000,                           // HTTP server port
  "host": "127.0.0.1",                   // Listen address
  "startup_delay_ms": 30000,             // Max wait for startup
  "health_check_endpoint": "/health",    // Health check URL
  "health_check_timeout_ms": 3000,       // Health check timeout
  "max_wait_attempts": 60,               // Max health check attempts
  "attempt_interval_ms": 2000            // Wait between attempts
}
```

### Parameter Definitions

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `temperature` | float | 0.7 | 0.0-1.0; lower = deterministic, higher = creative |
| `top_p` | float | 0.9 | Nucleus sampling; controls diversity |
| `top_k` | int | 40 | Only consider top K most likely tokens |
| `repeat_penalty` | float | 1.0 | Penalize repeated tokens (>1.0 = more penalty) |
| `ctx_size` | int | 32768 | Context window size |
| `n_predict` | int | -1 | Max output tokens; -1 = no limit (use EOS) |
| `n_threads` | int | 8 | CPU threads for inference |
| `n_gpu_layers` | int | 99 | Layers offloaded to GPU (99 = all) |
| `flash_attn` | bool | true | Flash Attention optimization |
| `jinja` | bool | true | Use Jinja template formatting |
| `cache_type_k` | string | "f16" | KV cache quantization (f16, q8_0) |
| `cache_type_v` | string | "f16" | KV cache quantization (f16, q8_0) |
| `mmproj` | string | "" | Multimodal projection file path (vision models) |
| `chat_template_file` | string | "" | Custom Jinja template file (if needed) |

---

## 💬 Configuration: promptConfig.json

### File Location
```
d:\Project-Learning\local-benchmarks\scripts\promptConfig.json
```

### Structure Overview

```json
{
  "prompts": [
    // Prompt definitions here
  ],
  "defaultParameters": {
    // Default sampling parameters
  },
  "presets": {
    // Preset parameter sets
  }
}
```

### Adding Test Prompts

Each prompt entry defines a test case:

```json
{
  "id": 1,
  "name": "Simple Code Task",
  "prompt": "Write a function to calculate factorial in TypeScript",
  "category": "code",
  "length": "short",
  "streaming": true,
  "enable_thinking": false
}
```

### Prompt Configuration Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Unique identifier (1, 2, 3, ...) |
| `name` | string | Display name in reports |
| `prompt` | string | Actual text sent to model |
| `category` | string | Category for grouping (code, reasoning, basics, etc.) |
| `length` | string | short/medium/long - informational only |
| `streaming` | bool | true=streaming response, false=one-shot |
| `enable_thinking` | bool | true=enable extended thinking (for Gemma-4), false=normal |

### Prompt Categories

Create categories that match your testing goals:

| Category | Examples |
|----------|----------|
| `basics` | "What is TypeScript?" |
| `code` | "Write a function to..." |
| `reasoning` | "Explain why..." "Analyze..." |
| `architecture` | "Best practices for REST APIs" |
| `math` | "Solve this equation..." |
| `safety` | "Ethical reasoning tasks" |

### Streaming vs One-Shot

```json
// Streaming: chunks of tokens arrive in real-time
{
  "id": 1,
  "name": "Streaming Response",
  "prompt": "...",
  "streaming": true  // Default for most cases
}

// One-shot: entire response arrives at once
{
  "id": 2,
  "name": "One-Shot Response",
  "prompt": "...",
  "streaming": false  // When response fits in single HTTP chunk
}
```

### Enabling Extended Thinking (Gemma-4 Only)

```json
{
  "id": 5,
  "name": "Complex Reasoning",
  "prompt": "Analyze this ethical dilemma...",
  "enable_thinking": true  // Gemma-4 will show thinking process
}
```

### Complete Example Configuration

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
    },
    {
      "id": 2,
      "name": "Function Implementation",
      "prompt": "Write a TypeScript function that validates email addresses using regex",
      "category": "code",
      "length": "medium",
      "streaming": true,
      "enable_thinking": false
    },
    {
      "id": 3,
      "name": "Complex Analysis",
      "prompt": "Analyze the trade-offs between using microservices vs monolithic architecture",
      "category": "reasoning",
      "length": "long",
      "streaming": true,
      "enable_thinking": true
    }
  ],
  "defaultParameters": {
    "stream": true,
    "n_predict": 512,
    "temperature": 0.5,
    "top_k": 40,
    "top_p": 0.9
  },
  "presets": {
    "conservative": {
      "temperature": 0.1,
      "top_k": 20,
      "top_p": 0.8,
      "description": "Focused, deterministic output"
    },
    "balanced": {
      "temperature": 0.5,
      "top_k": 40,
      "top_p": 0.9,
      "description": "Default balanced mode"
    },
    "creative": {
      "temperature": 0.7,
      "top_k": 50,
      "top_p": 0.95,
      "description": "More diverse output"
    }
  }
}
```

---

## 📁 Directory Structure Setup

Ensure this complete structure exists:

```
d:\Project-Learning\local-benchmarks\
├── package.json                          # Node dependencies
├── tsconfig.json                        # TypeScript config
├── .gitignore                           # Git ignore rules
├── README.md                            # Main documentation
├── PREREQUISITES-AND-PREP.md            # This file
│
├── scripts/                             # Executable scripts
│   ├── launchConfig.json               # ⭐ Server & model paths
│   ├── promptConfig.json               # ⭐ Test prompts
│   ├── compare-all-models-next.js      # Multi-model benchmark
│   ├── report-generator.js             # Consolidate reports
│   ├── analyze-model-quality.js        # Quality analysis
│   ├── read-gguf-properties.js         # Read GGUF metadata
│   └── run-all-benchmarks.js           # Run all tests
│
├── reports/                            # Generated reports
│   ├── sample/                         # Sample reports (version controlled)
│   │   └── benchmark-report-*.json
│   ├── benchmark-report-*.json         # Your generated reports (gitignored)
│   └── consolidated-report-*.md        # Your consolidated reports (gitignored)
│
├── docs/                               # Documentation
│   ├── IMPROVEMENTS-SUMMARY.md
│   ├── MODEL-USABILITY-ANALYSIS.md
│   └── OPTIMIZATION-GUIDE.md
│
├── archives/                           # Old scripts and docs
│   ├── test-ollama.js
│   ├── compare-all-models.js
│   └── docs/
│
└── node_modules/                       # Dependencies (gitignored)
    ├── @huggingface/gguf/
    ├── chalk/
    ├── jsonc-parser/
    └── ...
```

---

## ✅ Verification Checklist

After setup, verify everything works:

### 1. Check Node Installation
```bash
node --version  # Should be v18+
npm --version   # Should be v9+
```

### 2. Install Dependencies
```bash
cd d:\Project-Learning\local-benchmarks
npm install
```

### 3. Verify GGUF Files Exist
```bash
# PowerShell
Test-Path "D:\Large-Lang-Models\Models\Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf"
Test-Path "D:\Large-Lang-Models\Models\gemma-4-31B-it-Q4_K_M.gguf"
```

### 4. Verify Llama-Server Executables
```bash
# PowerShell
Test-Path "D:\Llama-Server-Exes\llama-b8672-bin-win-vulkan-x64\llama-server.exe"

# Test execution
D:\Llama-Server-Exes\llama-b8672-bin-win-vulkan-x64\llama-server.exe --version
```

### 5. Validate Configuration Files
```bash
npm run read:gguf  # Should list available GGUF files without errors
```

### 6. Run a Single Model Test
```bash
# Test with first model, first prompt (interactive selection)
npm run benchmark:compare

# Or directly specify prompt:
node scripts/compare-all-models-next.js --prompt=1
```

### 7. Check Report Generation
```bash
# Generate consolidated report from sample data
npm run report scripts/
```

---

## 🚀 Running Your First Benchmark

### Option 1: Interactive Selection (Recommended)

```bash
npm run benchmark:compare
```

This will:
1. Display available prompts
2. Ask you to select one
3. Run all model × server combinations
4. Generate comprehensive report

### Option 2: Non-Interactive Mode

```bash
# Run with prompt #2 directly, auto-start
node scripts/compare-all-models-next.js --prompt=2 --no-wait
```

### Option 3: Resume After Interruption

```bash
# If interrupted at combination #42, resume from #43
node scripts/compare-all-models-next.js --prompt=1 --start=43
```

### Typical Output

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    COMPREHENSIVE MODEL BENCHMARK SUITE                        ║
║                  Multi-Model × Multi-Version Performance Analysis              ║
╚═══════════════════════════════════════════════════════════════════════════════╝

✅ Selected: TypeScript Basics

🖥️  Server versions to test: vulkan-b8672, hip-b8838
📦 Models to test: 4 models

⚡ Total combinations: 4 models × 2 versions = 8 tests

[Combination #1/8] ════════════════════════════════════════════════════════════════
   Model ID: 1 | Name: Qwen3-Coder-30B-A3B
   Server: vulkan-b8672

🚀 Launching llama-server...
   Server: vulkan-b8672
   Model: Qwen3-Coder-30B-A3B
   Port: 8000

🧪 Testing: Qwen3-Coder-30B-A3B
   Prompt: "TypeScript Basics" (18 chars)
   
   ✅ Total: 2.345s | 156 chars | 39 tokens
```

---

## 📊 Understanding Benchmark Results

### Key Metrics

| Metric | Meaning |
|--------|---------|
| **TTFT** | Time to First Token (latency perception) |
| **Total Time** | Time from request to complete response |
| **Response Length** | Characters in generated response |
| **Token Count** | Estimated tokens in response |
| **Model Load Time** | Time to load model on first spawn |

### Report Files

After benchmarking, you'll find:

```
reports/
├── benchmark-report-2026-04-19T14-23-45-123Z.json  # Raw results
└── consolidated-report-2026-04-19T14-23.md         # Human-readable summary
```

**JSON Report Structure**:
```json
{
  "timestamp": "2026-04-19T14:23:45.123Z",
  "prompt": { /* prompt definition */ },
  "results": [
    {
      "modelName": "Qwen3-Coder-30B",
      "serverVersion": "vulkan-b8672",
      "ttftMs": 245,
      "totalMs": 2345,
      "responseLength": 156,
      "tokenCount": 39,
      "success": true
    }
  ]
}
```

---

## 🔧 Troubleshooting

### Problem: llama-server fails to start

**Solution**:
1. Verify executable exists: `Test-Path "D:\Llama-Server-Exes\...\llama-server.exe"`
2. Check GPU drivers are installed
3. Try CPU-only build to test basic functionality
4. Check if port 8000 is already in use: `netstat -ano | findstr :8000`

### Problem: GGUF file not found

**Solution**:
1. Verify path in `launchConfig.json` uses double backslashes
2. Check file actually exists at that path
3. Run: `npm run read:gguf` to see detected models

### Problem: Out of memory errors

**Solution**:
1. Use smaller quantization (Q2_K instead of Q4_K_M)
2. Reduce `ctx_size` in model parameters
3. Reduce `n_gpu_layers` to offload fewer layers to GPU
4. Use CPU-only inference instead of GPU

### Problem: Timeout waiting for model to load

**Solution**:
1. Increase `startup_delay_ms` in `launchConfig.json`
2. Check server output for errors (set `VERBOSE_SERVER_OUTPUT = true`)
3. Verify model file is not corrupted (try another model first)

### Problem: Chat template errors for GLM models

**Solution**:
1. Download GLM tokenizer_config.json from HuggingFace
2. Extract Jinja template to file
3. Set `chat_template_file` path in model parameters
4. Verify with `--verbose` flag

---

## 📚 Additional Resources

### Official Documentation
- **llama.cpp**: https://github.com/ggerganov/llama.cpp
- **HuggingFace GGUF**: https://huggingface.co/docs/hub/gguf
- **Model Cards**: 
  - Qwen3: https://huggingface.co/Qwen
  - Gemma: https://huggingface.co/google/gemma-4-9b-it
  - GLM: https://huggingface.co/THUDM

### Related Documentation in This Project
- [Model Usability Analysis](./docs/MODEL-USABILITY-ANALYSIS.md)
- [Optimization Guide](./docs/OPTIMIZATION-GUIDE.md)
- [Improvements Summary](./docs/IMPROVEMENTS-SUMMARY.md)

---

## 💾 Backup & Recovery

### Backup Configuration
```bash
# Backup your configurations
cp scripts/launchConfig.json scripts/launchConfig.json.backup
cp scripts/promptConfig.json scripts/promptConfig.json.backup
```

### Restore from Backup
```bash
# If configuration gets corrupted
cp scripts/launchConfig.json.backup scripts/launchConfig.json
cp scripts/promptConfig.json.backup scripts/promptConfig.json
```

---

## 📝 Notes

- All paths use `\\` for Windows file paths in JSON
- Model files can be very large (12-30GB); ensure sufficient disk space
- First run will be slower due to model loading and JIT compilation
- Subsequent runs cache models in memory (if server stays running)
- GPU memory is shared with system; monitor usage during benchmarking

---

**Last Updated**: April 19, 2026  
**Status**: ✅ Complete Setup Guide
