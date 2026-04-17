# Test GGUF Models - Quick Start Guide

## 🎯 What This Script Does

Tests GGUF models running on llama-server with:
- Performance metrics (TTFT, tokens/sec, etc.)
- Multiple prompt options
- Customizable generation parameters
- Real-time streaming output
- Detailed diagnostics

---

## ⚡ Quick Start (Recommended)

### Step 1: Check Server Status
```powershell
cd D:\Project-Learning\lailai-cli\scripts
pwsh -File manage-server.ps1 status
```

**Output:**
- ✅ Server is RUNNING → Go to Step 3
- ❌ Server is NOT RUNNING → Go to Step 2

### Step 2: Start llama-server
```powershell
pwsh -File launch-qwen3coder.ps1
```
⏳ Wait for: "Server is ready!"

### Step 3: Run the Test (New Terminal)
```powershell
node test-gguf-models.js 1
```

**You'll be prompted to:**
1. Select a prompt (1-5)
2. Choose whether to include generation parameters

**Results will show:**
- 📊 Time to First Token (TTFT)
- ⏱️ Total generation time  
- 📈 Tokens per second
- 📄 Full model response

---

## 🛠️ Advanced Usage

### See Diagnostics
```bash
node test-gguf-models.js 1 --debug
```

### Stream Live Output
```bash
node test-gguf-models.js 1 --stream
```

### Specific Generation Mode
```bash
node test-gguf-models.js 1 --conservative  # Lower temperature
node test-gguf-models.js 1 --creative      # Higher temperature
node test-gguf-models.js 1 --balanced      # Balanced params
```

### Show Model Reasoning (if available)
```bash
node test-gguf-models.js 1 --reasoning
```

### Combine Flags
```bash
node test-gguf-models.js 1 --stream --creative --debug
```

---

## 📋 Server Management

### View Current Status
```powershell
pwsh -File manage-server.ps1 status
```

### View Configuration
```powershell
pwsh -File manage-server.ps1 config
```

### Start Server (Qwen3-Coder - recommended)
```powershell
pwsh -File manage-server.ps1 start
```

### Start Server (Generic model selection)
```powershell
pwsh -File manage-server.ps1 start -Model generic
```

### Stop Server
```powershell
pwsh -File manage-server.ps1 stop
```

### Restart Server
```powershell
pwsh -File manage-server.ps1 restart
```

---

## 🐛 Troubleshooting

### "Connection Refused" Error
```
❌ Error fetching models: connect ECONNREFUSED
```

**Solution:** Start llama-server first
```powershell
pwsh -File launch-qwen3coder.ps1
```

### "Model file not found"
```
❌ Model file not found at: D:\Large-Lang-Models\...
```

**Solution:** Verify model paths in `launchConfig.json`
```powershell
pwsh -File manage-server.ps1 config
```

### Server crashes on startup
```
[ERROR] Process exited immediately
```

**Causes:**
- Wrong executable path
- Not enough VRAM
- Incompatible GPU backend

**Solution:** Check manual launch output
```powershell
pwsh -File launch-gguf.ps1
```

### Slow model loading (takes 5+ minutes)
- This is **normal** for first load!
- Model is being loaded into VRAM
- Subsequent tests run much faster

---

## 📊 Available Models

View all configured models:
```powershell
pwsh -File manage-server.ps1 config
```

Currently available:
1. **Qwen3-Coder-30B-A3B** (recommended) - Code generation
2. **Gemma-4-31B** - General purpose
3. **Qwen3-VL-30B-A3B** - Vision-language
4. **GLM-4.6V-Flash** - Fast inference
5. **LFM2-24B-A2B** - Large finance model
6. **Qwen3.5-9B** - Small & fast
7. **SmolVLM-500M** - Tiny vision model
8. **Qwen3.5-27B** - Large general model
9. **Qwen3-Coder-Next** - Latest coder version

---

## 🚀 Performance Tips

### Optimize for Speed
```bash
node test-gguf-models.js 1 --balanced
```

### Optimize for Quality
```bash
node test-gguf-models.js 1 --conservative
```

### Monitor Live Generation
```bash
node test-gguf-models.js 1 --stream
```

### Check GPU Acceleration
Look for message like:
```
✅ GPU is active! (85.3 tokens/sec)
```
If not appearing, check:
- VRAM available
- GPU drivers updated
- launchConfig.json settings

---

## 📁 File Structure

```
scripts/
├── test-gguf-models.js          ← Main test script
├── manage-server.ps1            ← Server management utility
├── launch-qwen3coder.ps1        ← Start Qwen3-Coder
├── launch-gguf.ps1              ← Start generic GGUF model
├── launchConfig.json            ← Models & server config
├── promptConfig.json            ← Available test prompts
├── TROUBLESHOOTING.md           ← Detailed troubleshooting
└── QUICK-START.md               ← This file
```

---

## 🔗 API Endpoints

When server is running, access:

```
GET  http://localhost:8000/props
     → Model info & properties

POST http://localhost:8000/v1/chat/completions
     → Send prompts & get responses

GET  http://localhost:8000/health
     → Server health check
```

---

## 💡 Common Workflows

### Workflow 1: Quick Test
```
1. pwsh -File manage-server.ps1 status
2. pwsh -File launch-qwen3coder.ps1          [if needed]
3. node test-gguf-models.js 1 --stream
4. Select prompt (1-5)
5. View results
```

### Workflow 2: Compare Models
```
1. pwsh -File manage-server.ps1 status
2. pwsh -File launch-gguf.ps1                [select different model]
3. node test-gguf-models.js 1 --debug
4. Review TTFT and token speeds
5. Repeat with different models
```

### Workflow 3: Performance Profiling
```
1. Start server with conservative params
2. node test-gguf-models.js 1 --conservative
3. Start server with creative params
4. node test-gguf-models.js 1 --creative
5. Compare results in TROUBLESHOOTING.md
```

---

## ❓ FAQ

**Q: How long does the model take to load?**
A: First load: 3-5+ minutes. Cached loads: <1 second

**Q: Can I run multiple tests?**
A: Yes, keep server running, run script multiple times in different terminals

**Q: What VRAM do I need?**
A: Depends on model size. 30B models typically need 24GB+

**Q: Why is TTFT so slow?**
A: First token generation includes model processing overhead. Subsequent tokens are faster.

**Q: How do I use a different model?**
A: Use `launch-gguf.ps1` to interactively select models

**Q: Can I modify generation parameters?**
A: Yes, edit `launchConfig.json` in the model's `parameters` section

---

## 🆘 Need Help?

1. **See status:** `pwsh -File manage-server.ps1 status`
2. **View config:** `pwsh -File manage-server.ps1 config`  
3. **Enable debug:** `node test-gguf-models.js 1 --debug`
4. **Check logs:** See TROUBLESHOOTING.md
5. **Verify paths:** Ensure files exist in launchConfig.json

---

## 📝 Notes

- Keep llama-server terminal open while testing
- Each test can take several minutes (model-dependent)
- First token generation is slower than subsequent tokens
- GPU acceleration requires compatible hardware
- VRAM usage scales with model size

---

**Last Updated:** 2026-04-17
**Scripts Version:** Enhanced with diagnostics & auto-start
