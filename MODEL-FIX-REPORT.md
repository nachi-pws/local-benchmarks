# Model Quality Fix Report

## Problems Identified

### LFM2-24B-A2B-Q4_0 ❌ **WORST**
- **Quantization**: Q4_0 (lowest quality, causes token corruption like "andenth")
- **Original Params**: temp=0.8, repeat_penalty=1.0
- **Issue**: Produces gibberish and repetitive text
- **Fix Applied**: temp=0.4, repeat_penalty=1.25

### Gemma-4-31B-it-Q4_K_M ⚠️ **PROBLEMATIC**
- **Quantization**: Q4_K_M (better than Q4_0 but still degraded)
- **Original Params**: temp=1.0 (way too high!), repeat_penalty=1.0
- **Issue**: High temperature causes hallucinations on quantized model
- **Fix Applied**: temp=0.5, repeat_penalty=1.15

### GLM-4.6V-Flash-Q8_0 ⚠️ **MODERATE** 
- **Quantization**: Q8_0 (much better quality than Q4)
- **Original Params**: temp=1.0, repeat_penalty=1.0, top_k=0
- **Issue**: top_k=0 + high temp = unstable sampling
- **Fix Applied**: temp=0.6, repeat_penalty=1.2, top_k=40

### Qwen3-Coder-Q4_K_M ✅ **BEST**
- **Quantization**: Q4_K_M (same as Gemma but better model architecture)
- **Params**: temp=0.7, repeat_penalty=1.05
- **Status**: Works well, produces coherent output

## Key Insights

**Temperature vs Quantization Risk:**
```
Q4_0 quantized:  Max temp = 0.3-0.4
Q4_K_M quantized: Max temp = 0.5-0.7
Q8_0 quantized:   Max temp = 0.7-0.9
Full precision:   Max temp = 1.0+
```

**Repeat Penalty Rule:**
```
Q4_0:   repeat_penalty ≥ 1.25 (aggressive)
Q4_K_M: repeat_penalty ≥ 1.15 (moderate)
Q8_0:   repeat_penalty ≥ 1.10 (light)
```

## Files Updated

1. **launchConfig.json**
   - Gemma-4: temperature 1.0 → 0.5, repeat_penalty 1.0 → 1.15
   - GLM-4.6V: temperature 1.0 → 0.6, repeat_penalty 1.0 → 1.2, top_k 0 → 40
   - LFM2: temperature 0.8 → 0.4, repeat_penalty 1.0 → 1.25

2. **test-gguf-models.js**
   - Loads parameters from launchConfig.json
   - Supports --conservative/--balanced/--creative overrides
   - Displays parameter source in output

3. **New diagnostic scripts**
   - `diagnose-models.js`: Tests basic completion quality
   - `analyze-model-quality.js`: Shows quality issues and recommendations

## Recommendation: Use Qwen3-Coder

For stable, reproducible results with your current models:
- **Best**: Qwen3-Coder-Q4_K_M (native llama architecture)
- **Acceptable**: Qwen3-VL-Q2_K (even lower quantization = better quality)
- **Avoid**: LFM2-Q4_0 (token corruption unavoidable)

## Test Commands

```bash
# Test current model with fixed parameters
node test-gguf-models.js 1

# Test with conservative safety override
node test-gguf-models.js 1 --conservative

# Analyze current model
node analyze-model-quality.js

# Run diagnostics
node diagnose-models.js
```

## Next Steps

1. **Switch llama-server model** to Qwen3-Coder (most stable)
2. **Monitor output quality** - if still poor, reduce temperature further
3. **Consider upgrading** LFM2 to higher quantization (Q5_K_M or Q6_K)
