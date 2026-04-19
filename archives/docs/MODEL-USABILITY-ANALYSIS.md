# LFM2-Q4_0 and GLM Model Usability Analysis

## Can They Run? ✅ YES
Both models **can load and generate output** in llama-server.

## Are They Usable? ⚠️ PARTIALLY - with caveats

---

## LFM2-24B-A2B-Q4_0

### Current Status: 🔴 **NOT RECOMMENDED**

**Problems:**
1. **Q4_0 Quantization** (worst tier)
   - Causes token corruption ("andenth" instead of real words)
   - 50+ parameter reduction from full precision
   - Unreliable token selection

2. **Token Artifacts**
   - Repetitive sequences: "forlforforlforl"
   - Incomplete words: "and**enth**", "enthen**tith**"
   - Low coherence

3. **Parameter Sensitivity**
   - Needs extremely conservative settings (temp < 0.4, repeat_penalty > 1.25)
   - Even then, output quality is poor

**Best Use Cases (if you must use it):**
- Very simple queries with --conservative preset
- Fallback when other models unavailable
- Testing/debugging only

**Workaround (if needed):**
```bash
node test-gguf-models.js 1 --conservative  # Forces temp=0.1, repeat_penalty=1.25
```

**Example Output with Conservative Settings:**
```
Input: "What is TypeScript?"
Output: "TypeScript is a programming language that extends JavaScript with types."
# Basic but acceptable - not great, not terrible
```

---

## GLM-4.6V-Flash-Q8_0

### Current Status: 🟡 **CONDITIONAL - Might work with proper config**

**Advantages over LFM2:**
- Q8_0 quantization (much better than Q4_0)
- Vision+Language capable (multimodal)
- Stronger base model

**Current Issues:**
1. **Parameter Settings Were Wrong** (in original launchConfig)
   - Had `top_k: 0` (greedy sampling = less diverse, can repeat)
   - Temperature too high (1.0)
   - Repeat penalty too low (1.0)

2. **Fixed Parameters** (now in launchConfig):
   - Temperature: 1.0 → 0.6 ✓
   - Repeat penalty: 1.0 → 1.2 ✓
   - Top-K: 0 → 40 ✓

**Expected Improvement:** Moderate - should produce better output now

**Test It:**
```bash
# Switch to GLM in launchConfig then:
node test-gguf-models.js 1  # Test with new params
```

---

## Gemma-4-31B-it-Q4_K_M

### Current Status: 🟡 **USABLE - with parameter fixes**

**Same Q4_K_M quantization as Qwen3, but:**
- Original parameters were terrible (temp: 1.0!)
- Fixed to: temperature 0.5, repeat_penalty 1.15

**Expected Result:** Should produce decent output now (not as good as Qwen3, but usable)

---

## Summary Table

| Model | Quantization | Usable? | Quality Level | Recommendation |
|-------|--------------|---------|---------------|-----------------|
| **Qwen3-Coder** | Q4_K_M | ✅ Yes | Excellent | **USE THIS** |
| **Qwen3-VL** | Q2_K | ✅ Yes | Very Good | Good alternative |
| **Gemma-4** | Q4_K_M | ⚠️ Partial | Fair (with fixes) | Fallback |
| **GLM-4.6V** | Q8_0 | ⚠️ Partial | Fair (with fixes) | Fallback |
| **LFM2** | Q4_0 | ❌ No | Poor | **AVOID** |

---

## Real Issue: Quantization vs Training

The problem isn't just llama-server. It's:

1. **Quantization Quality**
   - Q4_0: Extreme compression, very lossy
   - Q4_K_M: Better compression, less lossy
   - Q8_0: Minimal compression, high quality
   - Full: No compression, perfect quality

2. **Model Architecture**
   - Some models handle quantization loss better
   - Qwen3 = robust design
   - LFM2 = sensitive to precision loss

3. **Training Differences**
   - Qwen3-Coder trained on code → better at precision tasks
   - GLM/LFM2 trained on general text → more tolerant of noise

---

## Migration Path

**Option 1: Keep Current Setup** ✅ Best
```
Use: Qwen3-Coder (current, excellent)
Backup: Qwen3-VL (vision-capable, very good)
Skip: LFM2, GLM
```

**Option 2: Upgrade Models** 💾 Better long-term
```
Replace: LFM2-Q4_0 → LFM2-Q6_K (higher quality)
Replace: GLM-Q8_0 → GLM-Q8_0 (keep, with fixed params)
Keep: Qwen3-Coder (main)
```

**Option 3: Use Higher Precision** 🔥 Best quality, needs more VRAM
```
Download: Q2_K or FP16 versions of LFM2/GLM
More VRAM required but much better quality
```

---

## Verdict: Can You Use Them?

| Model | In llama-server? | Production Ready? | Recommendation |
|-------|-----------------|------------------|-----------------|
| LFM2-Q4_0 | ✅ Yes | ❌ No | Delete, upgrade to Q6_K |
| GLM-4.6V-Q8_0 | ✅ Yes | ⚠️ Maybe | Keep, test with fixed params |
| Gemma-4-Q4_K_M | ✅ Yes | ⚠️ Maybe | Keep as backup with fixed params |

**IMPORTANT:** All three *can run*, but only **Qwen3-Coder produces reliable, production-quality output**.
