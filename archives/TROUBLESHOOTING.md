# LLAMA-SERVER Troubleshooting Guide

## Problem: test-gguf-models.js fails with ECONNREFUSED

The script expects llama-server to be running on `localhost:8000`, but it's not available.

### Error Message
```
Error: connect ECONNREFUSED ::1:8000
Error: connect ECONNREFUSED 127.0.0.1:8000
```

---

## Solutions (in order)

### Option 1: Manual Start (Most Reliable)
Start llama-server using the dedicated launch scripts:

```powershell
# For Qwen3 Coder (Recommended)
cd D:\Project-Learning\lailai-cli\scripts
pwsh -File launch-qwen3coder.ps1

# OR for generic GGUF models
pwsh -File launch-gguf.ps1
```

**Expected behavior:**
- Script shows "SELECT MODEL" menu
- Shows "SELECT LLAMA-SERVER VERSION" menu
- Starts loading the model (takes 3-5+ minutes)
- Displays "Server is ready!" when complete
- Keep this terminal open!

**Then in another terminal:**
```powershell
cd D:\Project-Learning\lailai-cli\scripts
node test-gguf-models.js 1
```

---

### Option 2: Quick Diagnostic Check
See if llama-server is running and get error details:

```powershell
node test-gguf-models.js 1 --debug
```

**Output will show:**
- ✅ if server is running
- ❌ if server is NOT running
- Clear next steps to fix it

---

### Option 3: Auto-Start (Experimental)
⚠️ **Note:** This feature auto-starts llama-server in background. May not work reliably in all environments.

```powershell
# Start with auto-launch enabled
node test-gguf-models.js 1 --auto-start --debug
```

**This will:**
1. Check if llama-server is running
2. If not, spawn llama-server process
3. Wait up to 5 minutes for it to initialize
4. Run the test automatically

---

## Configuration Files

### launchConfig.json
**Location:** `scripts/launchConfig.json`

Contains:
- `llamaServerVersions`: Available llama-server builds and their paths
- `models`: GGUF models with optimized parameters
- `server`: Host/port configuration

**If auto-start fails:** Verify paths exist:
```json
{
  "llamaServerVersions": {
    "available": {
      "vulkan-b8672": {
        "path": "D:\\Llama-Server-Exes\\llama-b8672-bin-win-vulkan-x64\\llama-server.exe"
        // ☝️ Verify this executable exists!
      }
    }
  },
  "models": [
    {
      "path": "D:\\Large-Lang-Models\\Models\\Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf"
      // ☝️ Verify this model file exists!
    }
  ]
}
```

---

## Common Issues

### Issue 1: "Process exited immediately (possible crash)"
**Cause:** llama-server executable path is wrong or llama-server crashed

**Fix:**
1. Verify `launchConfig.json` paths exist
2. Check GPU/VRAM availability
3. Try manual launch with more debugging

### Issue 2: "Server did not respond after ~300 seconds"
**Cause:** Model loading took too long or server didn't start

**Fix:**
1. Check system resources (memory, GPU)
2. Use manual startup for better diagnostics
3. Check `launch-gguf.ps1` output for errors

### Issue 3: "Model file not found"
**Cause:** Model path in launchConfig.json is incorrect

**Fix:**
```powershell
# Verify model file exists
Test-Path "D:\Large-Lang-Models\Models\Qwen3-Coder-30B-A3B-Instruct-Q4_K_M.gguf"

# Update path in launchConfig.json if needed
```

### Issue 4: "Cannot find llama-server executable"
**Cause:** llama-server not installed or path wrong

**Fix:**
1. Install llama-server if missing
2. Update `launchConfig.json` with correct path
3. Verify version folder exists: `D:\Llama-Server-Exes\`

---

## Recommended Workflow

```
1. Terminal 1: Start llama-server manually
   cd scripts
   pwsh -File launch-qwen3coder.ps1
   [Wait for "Server is ready!" message]

2. Terminal 2: Run the test
   cd scripts
   node test-gguf-models.js 1
   [Select prompt ID when asked]
   [Script tests model performance]

3. Results displayed in Terminal 2
```

---

## Flags Reference

```bash
node test-gguf-models.js [PROMPT_ID] [OPTIONS]

OPTIONS:
  --debug, -d              Show detailed debug logging
  --stream, -s             Use streaming mode (live tokens)
  --reasoning, -r          Show model reasoning/thinking
  --auto-start, -a         Auto-launch llama-server if not running
  --conservative           Use conservative generation parameters
  --creative               Use creative generation parameters
  --balanced               Use balanced generation parameters

EXAMPLES:
  node test-gguf-models.js 1 --debug
  node test-gguf-models.js 1 --stream --creative
  node test-gguf-models.js 1 --auto-start --debug
```

---

## Server Health Check

To verify llama-server is running outside of this script:

```powershell
# PowerShell
$response = Invoke-WebRequest -Uri "http://localhost:8000/props" -TimeoutSec 5 -UseBasicParsing
$response.StatusCode  # Should be 200
```

or

```bash
# Windows Command Line
curl http://localhost:8000/props
```

If successful, you'll see JSON with model information.

---

## Performance Notes

- **First run** takes 3-5+ minutes (model loading)
- **Token generation speed** depends on GPU/VRAM
- **TTFT (Time to First Token)** indicates model responsiveness
- Watch for "GPU is active!" message for GPU acceleration confirmation

---

## Next Steps

1. ✅ Verify llama-server paths in `launchConfig.json`
2. ✅ Start llama-server with: `pwsh -File launch-qwen3coder.ps1`
3. ✅ Run test with: `node test-gguf-models.js 1`
4. ✅ Check results for performance metrics
