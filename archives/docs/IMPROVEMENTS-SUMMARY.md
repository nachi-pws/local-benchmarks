# 🔧 Script Improvements Summary

## Problem Found
The `test-gguf-models.js` script failed with **ECONNREFUSED** when trying to connect to llama-server because:
1. ❌ llama-server was not running
2. ❌ Script had no diagnostic capabilities
3. ❌ No way to verify server status
4. ❌ No auto-start or helpful error messages

## Solutions Implemented

### 1. Enhanced test-gguf-models.js
✅ **Added server status checking**
- Detects if llama-server is running before running tests
- Provides clear diagnostic output

✅ **Added auto-start capability**
- Can automatically launch llama-server with `--auto-start` flag
- Handles configuration file issues gracefully
- Waits up to 5 minutes for server initialization

✅ **Better error handling**
- Clear messages explaining what's wrong
- Suggests next steps for resolution
- Improved debug logging

### 2. New: manage-server.ps1
✅ **Simple server management utility**
```powershell
pwsh -File manage-server.ps1 status   # Check if running
pwsh -File manage-server.ps1 start    # Start server
pwsh -File manage-server.ps1 stop     # Stop server  
pwsh -File manage-server.ps1 config   # View configuration
```

### 3. Documentation
✅ **QUICK-START.md** - Quick reference guide
✅ **TROUBLESHOOTING.md** - Complete troubleshooting reference

---

## How to Use

### Option A: Manual Start (Most Reliable)
```powershell
# Terminal 1: Start llama-server
cd D:\Project-Learning\lailai-cli\scripts
pwsh -File launch-qwen3coder.ps1

# Terminal 2: Run test (after server is ready)
node test-gguf-models.js 1
```

### Option B: Check Status First
```powershell
# Check if server is running
pwsh -File manage-server.ps1 status

# If not running:
pwsh -File manage-server.ps1 start

# Then run test:
node test-gguf-models.js 1
```

### Option C: Auto-Start (Experimental)
```powershell
# Automatically start server and run test
node test-gguf-models.js 1 --auto-start --debug
```

---

## Available Commands

### test-gguf-models.js
```bash
node test-gguf-models.js [PROMPT_ID] [OPTIONS]

OPTIONS:
  --debug, -d              # Show detailed debug output
  --stream, -s             # Stream live tokens
  --reasoning, -r          # Show model reasoning
  --auto-start, -a         # Auto-launch llama-server
  --conservative           # Conservative parameters
  --creative               # Creative parameters
  --balanced               # Balanced parameters

EXAMPLES:
  node test-gguf-models.js 1 --debug
  node test-gguf-models.js 1 --stream --creative
  node test-gguf-models.js 1 --auto-start
```

### manage-server.ps1
```powershell
pwsh -File manage-server.ps1 [COMMAND] [OPTIONS]

COMMANDS:
  status                   # Show server status
  start                    # Start llama-server
  stop                     # Stop llama-server
  restart                  # Restart llama-server
  config                   # Show configuration

OPTIONS:
  -Model qwen              # Use Qwen3-Coder (default)
  -Model generic           # Use generic model selector

EXAMPLES:
  pwsh -File manage-server.ps1 status
  pwsh -File manage-server.ps1 config
  pwsh -File manage-server.ps1 start
```

---

## Workflow Recommendations

### ✅ Best Approach (Recommended)
```
1. Terminal 1:
   pwsh -File manage-server.ps1 status
   # If ❌, run: pwsh -File launch-qwen3coder.ps1
   # Wait for "Server is ready!"

2. Terminal 2:
   node test-gguf-models.js 1
   # Select prompt (1-5)
   # View results
```

### ⚡ Quick Check
```
1. pwsh -File manage-server.ps1 status
2. If running: node test-gguf-models.js 1 --stream
3. If not: pwsh -File manage-server.ps1 start
```

### 🔧 Debugging
```
1. node test-gguf-models.js 1 --debug
   # See what's happening

2. pwsh -File manage-server.ps1 config
   # Verify file paths exist

3. Check TROUBLESHOOTING.md
   # For detailed solutions
```

---

## Key Improvements

| Issue | Before | After |
|-------|--------|-------|
| Server not running? | ❌ Cryptic error | ✅ Clear diagnostic + next steps |
| How to check status? | ❌ No way | ✅ `manage-server.ps1 status` |
| Where to start server? | ❌ Had to find script | ✅ Clear instructions in output |
| Configuration unclear? | ❌ Manual JSON editing | ✅ `manage-server.ps1 config` |
| Auto-start llama-server? | ❌ Not possible | ✅ `--auto-start` flag |
| First-time user help? | ❌ No guide | ✅ QUICK-START.md + TROUBLESHOOTING.md |

---

## File Changes

### Modified Files
- **test-gguf-models.js**
  - Added: `spawn` import from child_process
  - Added: `isPortOpen()` function
  - Added: `diagnoseServer()` function  
  - Added: `autoStartServer()` function
  - Modified: `main()` to check server first
  - Added: `--auto-start` flag support

### New Files
- **manage-server.ps1** - Server management utility
- **QUICK-START.md** - Quick reference guide
- **TROUBLESHOOTING.md** - Complete troubleshooting
- **IMPROVEMENTS-SUMMARY.md** - This file

---

## Testing

### Verify Installation
```powershell
# 1. Check server status
pwsh -File manage-server.ps1 status
# Output: ❌ Status : NOT RUNNING

# 2. View configuration
pwsh -File manage-server.ps1 config
# Output: Shows all available models and versions

# 3. Test diagnostics
node test-gguf-models.js 1 --debug
# Output: Shows diagnostic info and suggests next steps
```

### Start Server & Test
```powershell
# 1. Start server
pwsh -File launch-qwen3coder.ps1
# [Wait for "Server is ready!"]

# 2. Check status
pwsh -File manage-server.ps1 status
# Output: ✅ Status : RUNNING

# 3. Run test
node test-gguf-models.js 1
# Select prompt, view results
```

---

## Troubleshooting Common Issues

### Issue: "ECONNREFUSED"
**Cause:** llama-server not running
**Fix:** `pwsh -File launch-qwen3coder.ps1`

### Issue: "Model file not found"  
**Cause:** Wrong path in launchConfig.json
**Fix:** `pwsh -File manage-server.ps1 config`

### Issue: "Version not found in launchConfig"
**Cause:** Config mismatch (found & fixed)
**Fix:** Script now handles this automatically

### Issue: Auto-start doesn't work
**Cause:** Experimental feature
**Fix:** Use manual start: `pwsh -File launch-qwen3coder.ps1`

---

## Next Steps

1. ✅ Test the diagnostic:
   ```bash
   node test-gguf-models.js 1 --debug
   ```

2. ✅ Check configuration:
   ```powershell
   pwsh -File manage-server.ps1 config
   ```

3. ✅ Start server:
   ```powershell
   pwsh -File launch-qwen3coder.ps1
   ```

4. ✅ Run a test:
   ```bash
   node test-gguf-models.js 1
   ```

5. ✅ Explore advanced options:
   ```bash
   node test-gguf-models.js 1 --stream --creative
   ```

---

## Support Resources

- **Quick Start:** See `QUICK-START.md`
- **Troubleshooting:** See `TROUBLESHOOTING.md`
- **Configuration:** Run `pwsh -File manage-server.ps1 config`
- **Server Status:** Run `pwsh -File manage-server.ps1 status`
- **Debug Info:** Run `node test-gguf-models.js 1 --debug`

---

**All improvements are backward compatible!** Existing workflows still work, new features are optional.

