# 📊 Comprehensive Benchmark Consolidation Report

**Generated:** 4/18/2026, 8:04:52 PM
**Analysis Date:** Sat Apr 18 2026

## 📑 Report Summary
- **Reports Analyzed:** 2
- **Unique Prompts:** 2
- **Model × Server Combos:** 18
- **Total Test Results:** 36

---

## 📈 Key Metrics

| Metric | Value |
|--------|-------|
| **Total Test Results** | 36 |
| **Model × Server Combos** | 18 |
| **Prompts Tested** | 2 |
| **Fastest TTFT** | 0.052s |
| **Slowest TTFT** | 1.267s |
| **Average TTFT** | 0.361s |
| **Fastest Total Time** | 0.727s |
| **Slowest Total Time** | 256.084s |
| **Average Total Time** | 51.342s |
| **Total Chars Generated** | 137,864 |
| **Average Chars/Test** | 3,830 |
| **Total Tokens Generated** | 33,432 |
| **Average Tokens/Test** | 929 |

---

## 🏅 Performance Rankings

### ⚡ Fastest Time to First Token

🥇 **SmolVLM-500M** (HIP-b8665): 0.089s
🥈 **GLM-4.6V-Flash** (HIP-b8665): 0.126s
🥉 **SmolVLM-500M** (vulkan-b8672): 0.126s
4. **LFM2-24B-A2B** (vulkan-b8672): 0.138s
5. **Qwen3.5-9B** (HIP-b8665): 0.177s

### ⚙️ Fastest Total Response Time

🥇 **SmolVLM-500M** (vulkan-b8672): 1.341s
🥈 **SmolVLM-500M** (HIP-b8665): 1.966s
🥉 **LFM2-24B-A2B** (vulkan-b8672): 4.077s
4. **LFM2-24B-A2B** (HIP-b8665): 4.405s
5. **Qwen3-Coder-30B-A3B** (vulkan-b8672): 7.971s

### 📝 Most Output (Verbosity)

🥇 **Qwen3-Coder-Next-UD-Q5_K_M** (vulkan-b8672): 4,266 tokens
🥈 **GLM-4.6V-Flash** (vulkan-b8672): 1,085 tokens
🥉 **GLM-4.6V-Flash** (HIP-b8665): 1,036 tokens
4. **Qwen3.5-27B** (vulkan-b8672): 993 tokens
5. **Qwen3.5-9B** (vulkan-b8672): 965 tokens

---

## 📋 Per-Prompt Analysis

### Ethical Reasoning
- **Category:** reasoning | **Length:** long
- **Streaming:** ✅

#### HIP-b8665

| Model | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- |
| Gemma-4-31B | 0.654s | 130.995s | 3,460 | 693 |
| GLM-4.6V-Flash | 0.158s | 136.186s | 4,942 | 1,006 |
| LFM2-24B-A2B | 0.298s | 6.846s | 3,021 | 705 |
| Qwen3-Coder-30B-A3B | 0.349s | 14.778s | 4,487 | 891 |
| Qwen3-Coder-Next-UD-Q5_K_M | 0.557s | 43.520s | 7,973 | 1,616 |
| Qwen3-VL-30B-A3B | 0.367s | 18.162s | 6,245 | 1,255 |
| Qwen3.5-27B | 0.532s | 243.980s | 6,020 | 1,214 |
| Qwen3.5-9B | 0.211s | 48.325s | 5,649 | 1,128 |
| SmolVLM-500M | 0.126s | 3.206s | 2,504 | 500 |

#### vulkan-b8672

| Model | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- |
| Gemma-4-31B | 0.803s | 119.487s | 3,630 | 710 |
| GLM-4.6V-Flash | 0.275s | 108.326s | 2,046 | 1,089 |
| LFM2-24B-A2B | 0.195s | 6.493s | 3,234 | 712 |
| Qwen3-Coder-30B-A3B | 0.808s | 10.818s | 3,667 | 724 |
| Qwen3-Coder-Next-UD-Q5_K_M | 0.432s | 197.461s | 21,782 | 8,192 |
| Qwen3-VL-30B-A3B | 0.839s | 14.884s | 5,996 | 1,224 |
| Qwen3.5-27B | 0.670s | 256.084s | 7,337 | 1,493 |
| Qwen3.5-9B | 0.220s | 36.780s | 4,741 | 982 |
| SmolVLM-500M | 0.156s | 1.731s | 1,547 | 293 |

### TypeScript Basics
- **Category:** basics | **Length:** short
- **Streaming:** ✅

#### HIP-b8665

| Model | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- |
| Gemma-4-31B | 0.331s | 78.776s | 3,259 | 772 |
| GLM-4.6V-Flash | 0.094s | 48.584s | 4,749 | 1,066 |
| LFM2-24B-A2B | 0.123s | 1.964s | 1,062 | 202 |
| Qwen3-Coder-30B-A3B | 0.116s | 5.197s | 1,487 | 323 |
| Qwen3-Coder-Next-UD-Q5_K_M | 0.184s | 10.049s | 1,273 | 279 |
| Qwen3-VL-30B-A3B | 0.159s | 6.886s | 2,282 | 505 |
| Qwen3.5-27B | 0.284s | 52.452s | 2,597 | 528 |
| Qwen3.5-9B | 0.143s | 24.075s | 2,099 | 569 |
| SmolVLM-500M | 0.052s | 0.727s | 544 | 111 |

#### vulkan-b8672

| Model | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- |
| Gemma-4-31B | 0.859s | 72.133s | 3,096 | 766 |
| GLM-4.6V-Flash | 0.251s | 48.628s | 4,805 | 1,080 |
| LFM2-24B-A2B | 0.081s | 1.661s | 952 | 180 |
| Qwen3-Coder-30B-A3B | 0.572s | 5.123s | 1,521 | 330 |
| Qwen3-Coder-Next-UD-Q5_K_M | 1.267s | 12.560s | 1,488 | 340 |
| Qwen3-VL-30B-A3B | 0.118s | 4.489s | 1,953 | 394 |
| Qwen3.5-27B | 0.376s | 45.623s | 2,286 | 492 |
| Qwen3.5-9B | 0.241s | 30.360s | 3,549 | 948 |
| SmolVLM-500M | 0.096s | 0.951s | 581 | 120 |

---

## 🏆 Consolidated Analysis

_Averages and aggregates across all prompts_

### HIP-b8665

| Model | Avg TTFT | Avg Total | Avg Chars | Avg Tokens | Tests |
| --- | --- | --- | --- | --- | --- |
| Gemma-4-31B | 0.492s | 104.885s | 3,360 | 733 | 2 |
| GLM-4.6V-Flash | 0.126s | 92.385s | 4,846 | 1,036 | 2 |
| LFM2-24B-A2B | 0.210s | 4.405s | 2,042 | 454 | 2 |
| Qwen3-Coder-30B-A3B | 0.233s | 9.988s | 2,987 | 607 | 2 |
| Qwen3-Coder-Next-UD-Q5_K_M | 0.370s | 26.785s | 4,623 | 948 | 2 |
| Qwen3-VL-30B-A3B | 0.263s | 12.524s | 4,264 | 880 | 2 |
| Qwen3.5-27B | 0.408s | 148.216s | 4,309 | 871 | 2 |
| Qwen3.5-9B | 0.177s | 36.200s | 3,874 | 849 | 2 |
| SmolVLM-500M | 0.089s | 1.966s | 1,524 | 306 | 2 |

### vulkan-b8672

| Model | Avg TTFT | Avg Total | Avg Chars | Avg Tokens | Tests |
| --- | --- | --- | --- | --- | --- |
| Gemma-4-31B | 0.831s | 95.810s | 3,363 | 738 | 2 |
| GLM-4.6V-Flash | 0.263s | 78.477s | 3,426 | 1,085 | 2 |
| LFM2-24B-A2B | 0.138s | 4.077s | 2,093 | 446 | 2 |
| Qwen3-Coder-30B-A3B | 0.690s | 7.971s | 2,594 | 527 | 2 |
| Qwen3-Coder-Next-UD-Q5_K_M | 0.850s | 105.010s | 11,635 | 4,266 | 2 |
| Qwen3-VL-30B-A3B | 0.478s | 9.687s | 3,975 | 809 | 2 |
| Qwen3.5-27B | 0.523s | 150.853s | 4,812 | 993 | 2 |
| Qwen3.5-9B | 0.231s | 33.570s | 4,145 | 965 | 2 |
| SmolVLM-500M | 0.126s | 1.341s | 1,064 | 207 | 2 |

---

## 📊 Model Performance Across Servers

### Qwen3-Coder-30B-A3B

| Server | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- |
| HIP-b8665 | 0.233s | 9.988s | 2,987 | 607 |
| vulkan-b8672 | 0.690s | 7.971s | 2,594 | 527 |

### Gemma-4-31B

| Server | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- |
| HIP-b8665 | 0.492s | 104.885s | 3,360 | 733 |
| vulkan-b8672 | 0.831s | 95.810s | 3,363 | 738 |

### Qwen3-VL-30B-A3B

| Server | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- |
| HIP-b8665 | 0.263s | 12.524s | 4,264 | 880 |
| vulkan-b8672 | 0.478s | 9.687s | 3,975 | 809 |

### GLM-4.6V-Flash

| Server | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- |
| HIP-b8665 | 0.126s | 92.385s | 4,846 | 1,036 |
| vulkan-b8672 | 0.263s | 78.477s | 3,426 | 1,085 |

### LFM2-24B-A2B

| Server | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- |
| HIP-b8665 | 0.210s | 4.405s | 2,042 | 454 |
| vulkan-b8672 | 0.138s | 4.077s | 2,093 | 446 |

### Qwen3.5-9B

| Server | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- |
| HIP-b8665 | 0.177s | 36.200s | 3,874 | 849 |
| vulkan-b8672 | 0.231s | 33.570s | 4,145 | 965 |

### SmolVLM-500M

| Server | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- |
| HIP-b8665 | 0.089s | 1.966s | 1,524 | 306 |
| vulkan-b8672 | 0.126s | 1.341s | 1,064 | 207 |

### Qwen3.5-27B

| Server | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- |
| HIP-b8665 | 0.408s | 148.216s | 4,309 | 871 |
| vulkan-b8672 | 0.523s | 150.853s | 4,812 | 993 |

### Qwen3-Coder-Next-UD-Q5_K_M

| Server | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- |
| HIP-b8665 | 0.370s | 26.785s | 4,623 | 948 |
| vulkan-b8672 | 0.850s | 105.010s | 11,635 | 4,266 |

---

## 📌 Report Files Analyzed

- benchmark-report-2026-04-18T04-26-24-601Z.json
- benchmark-report-2026-04-17T19-43-00-951Z.json

_Report generated on 4/18/2026, 8:04:52 PM_
