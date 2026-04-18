# 📊 Comprehensive Benchmark Consolidation Report

**Generated:** 4/19/2026, 12:28:39 AM
**Analysis Date:** Sun Apr 19 2026

## 📑 Report Summary
- **Reports Analyzed:** 1
- **Unique Prompts:** 1
- **Model × Server Combos:** 21
- **Total Test Results:** 21

---

## 📈 Key Metrics

| Metric | Value |
|--------|-------|
| **Total Test Results** | 21 |
| **Model × Server Combos** | 21 |
| **Unique Model Loads** | 21 |
| **Prompts Tested** | 1 |
| **Fastest Model Load** | 6.023s |
| **Slowest Model Load** | 100.496s |
| **Average Model Load** | 22.363s |
| **Fastest TTFT** | 0.078s |
| **Slowest TTFT** | 2.252s |
| **Average TTFT** | 0.438s |
| **Fastest Total Time** | 1.840s |
| **Slowest Total Time** | 87.028s |
| **Average Total Time** | 33.191s |
| **Total Chars Generated** | 53,343 |
| **Average Chars/Test** | 2,540 |
| **Total Tokens Generated** | 12,085 |
| **Average Tokens/Test** | 575 |

---

## 🏅 Performance Rankings

### 🚀 Fastest Model Load Time (Server Spawn)

🥇 **Qwen3.5-9B** (vulkan-b8672): 6.023s
🥈 **Qwen3.5-9B** (HIP-b8665): 6.034s
🥉 **GLM-4.6V-Flash** (vulkan-b8672): 8.033s
4. **Qwen3-VL-30B-A3B** (vulkan-b8672): 8.045s
5. **LFM2-24B-A2B** (vulkan-b8672): 10.051s

### ⚡ Fastest Time to First Token

🥇 **LFM2-24B-A2B** (vulkan-b8672): 0.078s
🥈 **GLM-4.6V-Flash** (vulkan-b8672): 0.091s
🥉 **GLM-4.6V-Flash** (HIP-b8665): 0.096s
4. **LFM2-24B-A2B** (HIP-b8665): 0.104s
5. **Qwen3.5-9B** (HIP-b8665): 0.118s

### ⚙️ Fastest Total Response Time

🥇 **LFM2-24B-A2B** (vulkan-b8672): 1.840s
🥈 **LFM2-24B-A2B** (HIP-b8665): 2.146s
🥉 **Qwen3-Coder-30B-A3B** (vulkan-b8672): 5.229s
4. **Qwen3-Coder-30B-A3B** (HIP-b8665): 5.860s
5. **Qwen3-VL-30B-A3B** (vulkan-b8672): 5.992s

### 📝 Most Output (Verbosity)

🥇 **GLM-4.6V-Flash** (HIP-b8665): 1,298 tokens
🥈 **GLM-4.6V-Flash** (vulkan-b8672): 1,140 tokens
🥉 **Gemma-4-31B** (HIP-b8665): 840 tokens
4. **Gemma-4-31B** (vulkan-b8672): 771 tokens
5. **Qwen3.5-9B** (HIP-b8665): 759 tokens

---

## 📋 Per-Prompt Analysis

### TypeScript Basics
- **Category:** basics | **Length:** short
- **Streaming:** ✅

#### HIP-b8838

| Model | Model Load* | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | N/A | N/A | N/A | 1,644 | 361 |
| Qwen3-Coder-Next-UD-Q5_K_M | N/A | N/A | N/A | 1,637 | 404 |
| Qwen3.5-27B | N/A | N/A | N/A | 2,950 | 651 |
_*Model Load is measured at first spawn; cached on subsequent prompts_

#### vulkan-b8672

| Model | Model Load* | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | N/A | N/A | N/A | 2,844 | 636 |
| Gemma-4-31B | N/A | N/A | N/A | 3,255 | 771 |
| GLM-4.6V-Flash | N/A | N/A | N/A | 5,020 | 1,140 |
| LFM2-24B-A2B | N/A | N/A | N/A | 1,092 | 204 |
| Qwen3-Coder-30B-A3B | N/A | N/A | N/A | 1,729 | 378 |
| Qwen3-Coder-Next-UD-Q5_K_M | N/A | N/A | N/A | 1,497 | 339 |
| Qwen3-VL-30B-A3B | N/A | N/A | N/A | 2,555 | 527 |
| Qwen3.5-27B | N/A | N/A | N/A | 2,915 | 612 |
| Qwen3.5-9B | N/A | N/A | N/A | 1,821 | 450 |
_*Model Load is measured at first spawn; cached on subsequent prompts_

#### HIP-b8665

| Model | Model Load* | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | N/A | N/A | N/A | 1,686 | 387 |
| Gemma-4-31B | N/A | N/A | N/A | 3,448 | 840 |
| GLM-4.6V-Flash | N/A | N/A | N/A | 5,755 | 1,298 |
| LFM2-24B-A2B | N/A | N/A | N/A | 1,163 | 223 |
| Qwen3-Coder-30B-A3B | N/A | N/A | N/A | 1,618 | 367 |
| Qwen3-Coder-Next-UD-Q5_K_M | N/A | N/A | N/A | 2,662 | 636 |
| Qwen3-VL-30B-A3B | N/A | N/A | N/A | 2,540 | 567 |
| Qwen3.5-27B | N/A | N/A | N/A | 2,466 | 535 |
| Qwen3.5-9B | N/A | N/A | N/A | 3,046 | 759 |
_*Model Load is measured at first spawn; cached on subsequent prompts_

---

## 🏆 Consolidated Analysis

_Averages and aggregates across all prompts_

### HIP-b8665

| Model | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens | Tests |
| --- | --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 20.102s | 1.777s | 40.259s | 1,686 | 387 | 1 |
| Gemma-4-31B | 16.090s | 0.324s | 87.028s | 3,448 | 840 | 1 |
| GLM-4.6V-Flash | 12.047s | 0.096s | 59.372s | 5,755 | 1,298 | 1 |
| LFM2-24B-A2B | 12.081s | 0.104s | 2.146s | 1,163 | 223 | 1 |
| Qwen3-Coder-30B-A3B | 16.880s | 0.147s | 5.860s | 1,618 | 367 | 1 |
| Qwen3-Coder-Next-UD-Q5_K_M | 100.496s | 0.178s | 16.440s | 2,662 | 636 | 1 |
| Qwen3-VL-30B-A3B | 10.056s | 0.146s | 7.787s | 2,540 | 567 | 1 |
| Qwen3.5-27B | 18.081s | 0.291s | 53.587s | 2,466 | 535 | 1 |
| Qwen3.5-9B | 6.034s | 0.118s | 29.031s | 3,046 | 759 | 1 |
_Load Time: measured from llama-server spawn to first response (0 = already cached)

### HIP-b8838

| Model | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens | Tests |
| --- | --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 20.107s | 1.784s | 37.256s | 1,644 | 361 | 1 |
| Qwen3-Coder-Next-UD-Q5_K_M | 86.453s | 0.197s | 10.411s | 1,637 | 404 | 1 |
| Qwen3.5-27B | 18.090s | 0.308s | 64.448s | 2,950 | 651 | 1 |
_Load Time: measured from llama-server spawn to first response (0 = already cached)

### vulkan-b8672

| Model | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens | Tests |
| --- | --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 16.070s | 2.252s | 64.737s | 2,844 | 636 | 1 |
| Gemma-4-31B | 14.074s | 0.431s | 72.187s | 3,255 | 771 | 1 |
| GLM-4.6V-Flash | 8.033s | 0.091s | 51.094s | 5,020 | 1,140 | 1 |
| LFM2-24B-A2B | 10.051s | 0.078s | 1.840s | 1,092 | 204 | 1 |
| Qwen3-Coder-30B-A3B | 12.488s | 0.133s | 5.229s | 1,729 | 378 | 1 |
| Qwen3-Coder-Next-UD-Q5_K_M | 44.248s | 0.134s | 9.263s | 1,497 | 339 | 1 |
| Qwen3-VL-30B-A3B | 8.045s | 0.121s | 5.992s | 2,555 | 527 | 1 |
| Qwen3.5-27B | 14.065s | 0.363s | 56.799s | 2,915 | 612 | 1 |
| Qwen3.5-9B | 6.023s | 0.135s | 16.242s | 1,821 | 450 | 1 |
_Load Time: measured from llama-server spawn to first response (0 = already cached)

---

## 📊 Model Performance Across Servers

### Devstral-Small-2-24B-Instruct

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| HIP-b8838 | 20.107s | 1.784s | 37.256s | 1,644 | 361 |
| vulkan-b8672 | 16.070s | 2.252s | 64.737s | 2,844 | 636 |
| HIP-b8665 | 20.102s | 1.777s | 40.259s | 1,686 | 387 |

### Qwen3.5-27B

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| HIP-b8838 | 18.090s | 0.308s | 64.448s | 2,950 | 651 |
| vulkan-b8672 | 14.065s | 0.363s | 56.799s | 2,915 | 612 |
| HIP-b8665 | 18.081s | 0.291s | 53.587s | 2,466 | 535 |

### Qwen3-Coder-Next-UD-Q5_K_M

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| HIP-b8838 | 86.453s | 0.197s | 10.411s | 1,637 | 404 |
| vulkan-b8672 | 44.248s | 0.134s | 9.263s | 1,497 | 339 |
| HIP-b8665 | 100.496s | 0.178s | 16.440s | 2,662 | 636 |

### Qwen3-Coder-30B-A3B

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| vulkan-b8672 | 12.488s | 0.133s | 5.229s | 1,729 | 378 |
| HIP-b8665 | 16.880s | 0.147s | 5.860s | 1,618 | 367 |

### Gemma-4-31B

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| vulkan-b8672 | 14.074s | 0.431s | 72.187s | 3,255 | 771 |
| HIP-b8665 | 16.090s | 0.324s | 87.028s | 3,448 | 840 |

### Qwen3-VL-30B-A3B

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| vulkan-b8672 | 8.045s | 0.121s | 5.992s | 2,555 | 527 |
| HIP-b8665 | 10.056s | 0.146s | 7.787s | 2,540 | 567 |

### GLM-4.6V-Flash

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| vulkan-b8672 | 8.033s | 0.091s | 51.094s | 5,020 | 1,140 |
| HIP-b8665 | 12.047s | 0.096s | 59.372s | 5,755 | 1,298 |

### LFM2-24B-A2B

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| vulkan-b8672 | 10.051s | 0.078s | 1.840s | 1,092 | 204 |
| HIP-b8665 | 12.081s | 0.104s | 2.146s | 1,163 | 223 |

### Qwen3.5-9B

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| vulkan-b8672 | 6.023s | 0.135s | 16.242s | 1,821 | 450 |
| HIP-b8665 | 6.034s | 0.118s | 29.031s | 3,046 | 759 |

---

## 📌 Report Files Analyzed

- benchmark-report-2026-04-18T16-13-06-806Z.json

_Report generated on 4/19/2026, 12:28:39 AM_
