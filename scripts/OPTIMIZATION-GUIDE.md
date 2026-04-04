# 🚀 Ollama Optimization Guide for GMLTEC EVO X2

## Current Status
- **Your TTFT**: 18-27s
- **UI TTFT**: 15.6s  
- **Gap**: 2-11s slower
- **GPU Speed**: 48 tokens/sec (suggests partial GPU usage)

---

## ⚡ Quick Fixes (Try These First)

### 1. **Enable Full GPU Offloading**

#### Windows (Ollama Desktop):
```
Settings → General → GPU Layers
Set to: 999 (use all layers)
Restart Ollama
```

#### Command Line (Most Reliable):
```powershell
# Stop running Ollama
# Run in PowerShell:
$env:OLLAMA_GPU_LAYERS=999
$env:OLLAMA_NUM_GPU=1
ollama serve
```

### 2. **Try Faster Quantization**

```bash
# Current: Q4_K_M (medium quality, medium speed)
# Try faster versions:
ollama pull gemma4:7b      # Faster, still good quality
ollama pull gemma2:27b     # Alternative 27B model
```

### 3. **Verify GPU is Being Used**

```powershell
node diagnose-ollama.js
# Look for "eval_speed" - should be 80+ tokens/sec for GPU
# If <20: GPU not being used
```

---

## 🔧 Advanced Configuration

### For EVO X2 with NPU:
```json
{
  "num_ctx": 1024,        // Reduce context for faster startup
  "num_batch": 512,       // Optimize batch for GPU
  "num_thread": 32,       // Use all CPU cores
  "num_gpu": 999,         // Use ALL GPU layers
  "top_k": 40,
  "top_p": 0.9,
  "temperature": 0.7
}
```

### Connection Pooling (Already Done)
```javascript
'Connection': 'keep-alive'  // Reuse TCP connection
'Content-Length': ...       // Proper content length
```

---

## 📊 Expected Performance by Config

| Config | GPU | TTFT | Throughput |
|--------|-----|------|-----------|
| Fully GPU | Yes | 14-16s | 100+ tokens/sec |
| Partial GPU | ~ | 18-25s | 40-80 tokens/sec |
| CPU Only | No | 60-120s | 5-20 tokens/sec |

**Your current: 48 tokens/sec = Partial GPU**

---

## 🎯 Optimization Checklist

- [ ] Check Ollama process GPU usage: `nvidia-smi` or Task Manager (GPU tab)
- [ ] Verify OLLAMA_GPU_LAYERS=999 is set
- [ ] Restart Ollama after environment changes
- [ ] Test with: `node test-ollama.js -s`
- [ ] Compare TTFT before/after
- [ ] If still >20s: Try gemma4:7b or alternative model

---

## 🆘 If Still Slow

**Problem**: TTFT still 20+s even after GPU settings
```powershell
# 1. Check what Ollama sees:
ollama show gemma4:26b

# 2. Check GPU is available:
nvidia-smi                    # If NVIDIA
rocm-smi                      # If AMD
Get-WmiObject Win32_VideoController | Select Name  # Windows

# 3. Update Ollama (may have better GPU support):
# Download latest from ollama.ai
```

**Problem**: Inconsistent TTFT (27s sometimes, 18s other times)
```
→ Model is being unloaded from GPU between requests
→ Use: ollama server (keep it running)
→ Or increase keep-alive timeout in client
```

---

## 📈 You're Getting Close!

18-19s TTFT is **competitive** for a 26B model. Ollama UI's 15.6s likely has:
- Model already pre-cached in VRAM
- Optimized internal batching
- Local IPC (not HTTP overhead)

Your 18-19s includes HTTP overhead + model loading from partial GPU cache.

✅ **Recommended**: Your current setup with GPU offloading optimization should get you to **15-18s TTFT**.
