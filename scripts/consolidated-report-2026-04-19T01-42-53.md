# 📊 Comprehensive Benchmark Consolidation Report

**Generated:** 4/19/2026, 9:42:53 AM
**Analysis Date:** Sun Apr 19 2026

## 📑 Report Summary
- **Reports Analyzed:** 5
- **Unique Prompts:** 5
- **Model × Server Combos:** 30
- **Total Test Results:** 150

---

## 🧪 Testing Configuration Overview

### 📝 Prompts Tested (5)

- **TypeScript Basics** 
  - Category: basics | Length: short
  - **Prompt:** What is TypeScript?
- **JavaScript Variables** 
  - Category: javascript | Length: short
  - **Prompt:** Explain the difference between var, let, and const in JavaScript
- **Code Generation** 
  - Category: code | Length: short
  - **Prompt:** Write a function to calculate the factorial of a number in TypeScript
- **REST API Best Practices** 
  - Category: architecture | Length: short
  - **Prompt:** List 5 best practices for REST APIs
- **Ethical Reasoning**  🧠
  - Category: reasoning | Length: long
  - **Prompt:** ### 8. ETHICAL REASONING & SAFETY : A researcher discovers a zero-day vulnerability in widely-used medical device software. They can: (A) sell it to a bug bounty program for $50k, (B) sell it on the black market for $500k, or (C) disclose it responsibly for $0 but potential recognition. Analyze the ethical dimensions of each choice without making a recommendation. Identify stakeholders and potential consequences for each option.

### 🖥️ Llama-Server Versions

- **HIP-b8838**
  - Build 8838 (HIP Radeon)  - more fixes + b8833 (ggml-webgpu: fix compiler warnings and refactor FlashAttention encoding
- **vulkan-b8672**
  - Latest Vulkan Build - RECOMMENDED for EVO X2 Strix Halo (replace b8672 with build number)
- **HIP-b8665**
  - Build 8665 (HIP Radeon) - DEPRECATED: GPU unused on Strix Halo Windows. ⚠️ BROKEN FOR QWEN3-CODER-NEXT (missing Feb 4 llama.cpp fix). Use vulkan-b8672 instead.

### 🤖 Models Tested (10)

- **Qwen3-Coder-30B-A3B**
  - Qwen3 Coder 30B MoE - Code-specialized (3B active params). Best for code generation. 256K native context.
- **Gemma-4-31B**
  - Gemma 4 31B Dense - Reasoning, coding, multimodal (256K context). Google's flagship open model.
- **Qwen3-VL-30B-A3B**
  - Qwen3 Vision Language 30B MoE - Multimodal text+image (256K native). Requires mmproj file.
- **GLM-4.6V-Flash**
  - GLM 4.6 Vision Flash - Multi-modal reasoning, optimized speed. Requires external Jinja template.
- **LFM2-24B-A2B**
  - LFM2 24B active - Liquid AI hybrid SSM+attention model. General purpose. (⚠️ Q4_0 = lower quality, consider Q4_K_M upgrade)
- **Qwen3.5-9B**
  - Qwen 3.5 9B - Fast, lightweight, high quality at small size (262K native context). Best for quick tasks.
- **Devstral-Small-2-24B-Instruct**
  - Devstral Small 2 24B - Dense coding model optimized for agentic software engineering. Tool-calling, vision capabilities, 256K context. Mistral AI.
- **Qwen3.5-27B**
  - Qwen 3.5 27B - Dense flagship model with hybrid Gated DeltaNet+Attention. Reasoning, coding, multilingual (262K native context). Q5_K_M quantization.
- **Qwen3-Coder-Next-UD-Q5_K_M**
  - Qwen3 Coder Next 80B MoE (3B active) - Agentic coding with long-horizon reasoning, tool-calling, and execution recovery. Fast code generation with 256K native context.
- **Nemotron-3-Nano-30B-A3B**
  - Nemotron 3 Nano 30B A3B - NVIDIA hybrid MoE (30B total / 3.5B active). Agentic reasoning, tool-calling, multilingual. 256K native context. Supports 1M context.

---

## 📈 Key Metrics

| Metric | Value |
|--------|-------|
| **Total Test Results** | 150 |
| **Model × Server Combos** | 30 |
| **Unique Model Loads** | 30 |
| **Prompts Tested** | 5 |
| **Fastest Model Load** | 6.016s |
| **Slowest Model Load** | 80.408s |
| **Average Model Load** | 19.187s |
| **Fastest TTFT** | 0.069s |
| **Slowest TTFT** | 2.659s |
| **Average TTFT** | 0.424s |
| **Fastest Total Time** | 1.622s |
| **Slowest Total Time** | 290.696s |
| **Average Total Time** | 51.758s |
| **Total Chars Generated** | 623,134 |
| **Average Chars/Test** | 4,154 |
| **Total Tokens Generated** | 165,586 |
| **Average Tokens/Test** | 1,104 |

---

## 🏅 Performance Rankings

### 🚀 Fastest Model Load Time (Server Spawn)

🥇 **Qwen3.5-9B** (HIP-b8665): 6.016s
🥈 **Qwen3.5-9B** (HIP-b8838): 6.019s
🥉 **Qwen3.5-9B** (vulkan-b8672): 6.024s
4. **Qwen3-VL-30B-A3B** (vulkan-b8672): 8.029s
5. **GLM-4.6V-Flash** (vulkan-b8672): 8.044s

### ⚡ Fastest Time to First Token

🥇 **LFM2-24B-A2B** (vulkan-b8672): 0.099s
🥈 **GLM-4.6V-Flash** (vulkan-b8672): 0.100s
🥉 **GLM-4.6V-Flash** (HIP-b8665): 0.134s
4. **GLM-4.6V-Flash** (HIP-b8838): 0.141s
5. **Qwen3.5-9B** (vulkan-b8672): 0.142s

### ⚙️ Fastest Total Response Time

🥇 **LFM2-24B-A2B** (vulkan-b8672): 5.151s
🥈 **LFM2-24B-A2B** (HIP-b8665): 5.229s
🥉 **LFM2-24B-A2B** (HIP-b8838): 5.290s
4. **Qwen3-VL-30B-A3B** (vulkan-b8672): 7.765s
5. **Qwen3-Coder-30B-A3B** (vulkan-b8672): 8.432s

### 📝 Most Output (Verbosity)

🥇 **Qwen3-Coder-Next-UD-Q5_K_M** (vulkan-b8672): 5,051 tokens
🥈 **Qwen3-Coder-Next-UD-Q5_K_M** (HIP-b8838): 3,629 tokens
🥉 **Qwen3-Coder-Next-UD-Q5_K_M** (HIP-b8665): 2,104 tokens
4. **Nemotron-3-Nano-30B-A3B** (vulkan-b8672): 1,577 tokens
5. **Nemotron-3-Nano-30B-A3B** (HIP-b8838): 1,381 tokens

---

## 📋 Per-Prompt Analysis

### Ethical Reasoning
- **Category:** reasoning | **Length:** long
- **Streaming:** ✅

#### HIP-b8838

| Model | Model Load* | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 20.094s | 2.113s | 107.437s | 5,030 | 1,065 |
| Gemma-4-31B | 18.094s | 0.717s | 138.905s | 3,717 | 741 |
| GLM-4.6V-Flash | 10.047s | 0.173s | 135.162s | 5,060 | 1,036 |
| LFM2-24B-A2B | 12.048s | 0.263s | 6.986s | 3,185 | 724 |
| Nemotron-3-Nano-30B-A3B | 26.176s | 0.480s | 53.812s | 14,255 | 2,919 |
| Qwen3-Coder-30B-A3B | 16.356s | 0.375s | 13.879s | 4,328 | 845 |
| Qwen3-Coder-Next-UD-Q5_K_M | 56.267s | 0.486s | 215.591s | 20,930 | 8,192 |
| Qwen3-VL-30B-A3B | 10.049s | 0.366s | 17.842s | 6,158 | 1,182 |
| Qwen3.5-27B | 18.067s | 0.523s | 261.581s | 6,530 | 1,329 |
| Qwen3.5-9B | 6.019s | 0.210s | 45.075s | 5,306 | 1,052 |
_*Model Load is measured at first spawn; cached on subsequent prompts_

#### vulkan-b8672

| Model | Model Load* | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 16.103s | 2.659s | 114.773s | 5,402 | 1,140 |
| Gemma-4-31B | 14.079s | 0.785s | 129.438s | 3,749 | 737 |
| GLM-4.6V-Flash | 8.044s | 0.152s | 126.682s | 5,384 | 1,068 |
| LFM2-24B-A2B | 10.033s | 0.179s | 6.914s | 3,531 | 769 |
| Nemotron-3-Nano-30B-A3B | 20.112s | 0.835s | 49.783s | 14,392 | 2,877 |
| Qwen3-Coder-30B-A3B | 14.205s | 0.245s | 13.688s | 5,192 | 987 |
| Qwen3-Coder-Next-UD-Q5_K_M | 80.408s | 0.406s | 196.243s | 21,674 | 8,192 |
| Qwen3-VL-30B-A3B | 8.029s | 0.238s | 12.405s | 5,606 | 1,101 |
| Qwen3.5-27B | 14.066s | 0.655s | 255.593s | 7,347 | 1,449 |
| Qwen3.5-9B | 6.024s | 0.204s | 35.820s | 3,850 | 809 |
_*Model Load is measured at first spawn; cached on subsequent prompts_

#### HIP-b8665

| Model | Model Load* | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 20.129s | 2.078s | 102.339s | 4,715 | 1,014 |
| Gemma-4-31B | 18.091s | 0.633s | 133.498s | 3,670 | 739 |
| GLM-4.6V-Flash | 12.055s | 0.160s | 190.818s | 2,215 | 1,269 |
| LFM2-24B-A2B | 12.074s | 0.271s | 7.003s | 3,189 | 748 |
| Nemotron-3-Nano-30B-A3B | 24.144s | 0.502s | 44.738s | 11,465 | 2,502 |
| Qwen3-Coder-30B-A3B | 16.401s | 0.384s | 14.005s | 4,256 | 843 |
| Qwen3-Coder-Next-UD-Q5_K_M | 54.271s | 0.513s | 214.849s | 17,551 | 8,192 |
| Qwen3-VL-30B-A3B | 10.031s | 0.418s | 12.149s | 4,257 | 849 |
| Qwen3.5-27B | 18.083s | 0.533s | 290.696s | 6,623 | 1,347 |
| Qwen3.5-9B | 6.016s | 0.205s | 33.100s | 3,213 | 635 |
_*Model Load is measured at first spawn; cached on subsequent prompts_

### REST API Best Practices
- **Category:** architecture | **Length:** short
- **Streaming:** ✅

#### HIP-b8838

| Model | Model Load* | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 20.076s | 1.789s | 57.462s | 2,266 | 565 |
| Gemma-4-31B | 16.074s | 0.404s | 78.725s | 2,661 | 748 |
| GLM-4.6V-Flash | 10.041s | 0.137s | 30.524s | 3,031 | 669 |
| LFM2-24B-A2B | 12.050s | 0.088s | 5.125s | 1,999 | 540 |
| Nemotron-3-Nano-30B-A3B | 24.138s | 0.209s | 15.067s | 3,077 | 847 |
| Qwen3-Coder-30B-A3B | 16.595s | 0.151s | 5.288s | 1,517 | 330 |
| Qwen3-Coder-Next-UD-Q5_K_M | 54.309s | 0.181s | 257.347s | 27,515 | 8,192 |
| Qwen3-VL-30B-A3B | 10.030s | 0.183s | 7.225s | 2,182 | 534 |
| Qwen3.5-27B | 18.083s | 0.286s | 69.054s | 2,742 | 693 |
| Qwen3.5-9B | 6.035s | 0.124s | 37.790s | 2,438 | 680 |
_*Model Load is measured at first spawn; cached on subsequent prompts_

#### vulkan-b8672

| Model | Model Load* | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 16.084s | 2.237s | 42.602s | 1,576 | 414 |
| Gemma-4-31B | 14.066s | 0.454s | 66.975s | 2,724 | 716 |
| GLM-4.6V-Flash | 10.048s | 0.085s | 32.287s | 3,224 | 721 |
| LFM2-24B-A2B | 10.063s | 0.083s | 4.729s | 1,903 | 530 |
| Nemotron-3-Nano-30B-A3B | 20.102s | 0.169s | 22.182s | 4,785 | 1,358 |
| Qwen3-Coder-30B-A3B | 12.350s | 0.153s | 5.397s | 1,517 | 391 |
| Qwen3-Coder-Next-UD-Q5_K_M | 42.229s | 0.192s | 208.085s | 27,453 | 8,192 |
| Qwen3-VL-30B-A3B | 8.033s | 0.134s | 6.734s | 2,372 | 606 |
| Qwen3.5-27B | 14.082s | 0.379s | 56.515s | 2,546 | 608 |
| Qwen3.5-9B | 6.027s | 0.132s | 33.231s | 2,289 | 728 |
_*Model Load is measured at first spawn; cached on subsequent prompts_

#### HIP-b8665

| Model | Model Load* | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 20.096s | 1.827s | 69.817s | 2,676 | 690 |
| Gemma-4-31B | 18.081s | 0.406s | 80.821s | 2,871 | 791 |
| GLM-4.6V-Flash | 10.041s | 0.128s | 45.771s | 4,330 | 1,003 |
| LFM2-24B-A2B | 12.060s | 0.126s | 5.995s | 2,273 | 652 |
| Nemotron-3-Nano-30B-A3B | 24.144s | 0.218s | 12.683s | 2,843 | 736 |
| Qwen3-Coder-30B-A3B | 16.502s | 0.159s | 5.481s | 1,544 | 341 |
| Qwen3-Coder-Next-UD-Q5_K_M | 56.275s | 0.167s | 22.571s | 3,287 | 884 |
| Qwen3-VL-30B-A3B | 10.053s | 0.181s | 6.383s | 1,817 | 471 |
| Qwen3.5-27B | 18.138s | 0.286s | 68.940s | 2,818 | 692 |
| Qwen3.5-9B | 6.032s | 0.131s | 29.907s | 1,616 | 435 |
_*Model Load is measured at first spawn; cached on subsequent prompts_

### Code Generation
- **Category:** code | **Length:** short
- **Streaming:** ✅

#### HIP-b8838

| Model | Model Load* | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 20.111s | 1.807s | 30.945s | 1,125 | 296 |
| Gemma-4-31B | 18.126s | 0.400s | 83.340s | 2,521 | 792 |
| GLM-4.6V-Flash | 10.047s | 0.138s | 57.388s | 4,957 | 1,254 |
| LFM2-24B-A2B | 12.076s | 0.182s | 3.548s | 1,301 | 363 |
| Nemotron-3-Nano-30B-A3B | 24.127s | 0.203s | 10.027s | 2,183 | 570 |
| Qwen3-Coder-30B-A3B | 16.530s | 0.186s | 14.134s | 3,446 | 878 |
| Qwen3-Coder-Next-UD-Q5_K_M | 54.304s | 0.229s | 16.890s | 2,283 | 655 |
| Qwen3-VL-30B-A3B | 10.044s | 0.216s | 5.035s | 1,401 | 363 |
| Qwen3.5-27B | 18.085s | 0.325s | 68.206s | 2,458 | 684 |
| Qwen3.5-9B | 6.024s | 0.144s | 19.745s | 1,675 | 531 |
_*Model Load is measured at first spawn; cached on subsequent prompts_

#### vulkan-b8672

| Model | Model Load* | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 16.109s | 2.237s | 31.488s | 1,136 | 301 |
| Gemma-4-31B | 14.057s | 0.431s | 69.211s | 2,516 | 740 |
| GLM-4.6V-Flash | 10.064s | 0.089s | 44.444s | 3,992 | 990 |
| LFM2-24B-A2B | 10.041s | 0.087s | 2.881s | 1,104 | 318 |
| Nemotron-3-Nano-30B-A3B | 20.115s | 0.160s | 5.964s | 1,457 | 358 |
| Qwen3-Coder-30B-A3B | 12.547s | 0.154s | 11.646s | 3,263 | 849 |
| Qwen3-Coder-Next-UD-Q5_K_M | 44.228s | 0.209s | 11.651s | 1,797 | 481 |
| Qwen3-VL-30B-A3B | 8.032s | 0.118s | 3.925s | 1,329 | 350 |
| Qwen3.5-27B | 14.060s | 0.385s | 52.191s | 2,057 | 562 |
| Qwen3.5-9B | 6.021s | 0.125s | 22.710s | 2,071 | 621 |
_*Model Load is measured at first spawn; cached on subsequent prompts_

#### HIP-b8665

| Model | Model Load* | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 20.080s | 1.798s | 33.746s | 1,270 | 325 |
| Gemma-4-31B | 18.090s | 0.418s | 78.993s | 2,629 | 773 |
| GLM-4.6V-Flash | 10.061s | 0.143s | 51.747s | 4,672 | 1,132 |
| LFM2-24B-A2B | 12.054s | 0.197s | 2.309s | 793 | 235 |
| Nemotron-3-Nano-30B-A3B | 22.142s | 0.240s | 12.483s | 2,723 | 724 |
| Qwen3-Coder-30B-A3B | 16.530s | 0.159s | 13.483s | 3,209 | 840 |
| Qwen3-Coder-Next-UD-Q5_K_M | 54.277s | 0.188s | 14.893s | 2,000 | 579 |
| Qwen3-VL-30B-A3B | 10.054s | 0.209s | 5.634s | 1,598 | 411 |
| Qwen3.5-27B | 18.087s | 0.315s | 59.873s | 2,145 | 602 |
| Qwen3.5-9B | 6.048s | 0.137s | 41.085s | 3,469 | 1,055 |
_*Model Load is measured at first spawn; cached on subsequent prompts_

### JavaScript Variables
- **Category:** javascript | **Length:** short
- **Streaming:** ✅

#### HIP-b8838

| Model | Model Load* | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 18.087s | 1.800s | 62.077s | 2,448 | 612 |
| Gemma-4-31B | 20.097s | 0.431s | 96.352s | 3,378 | 915 |
| GLM-4.6V-Flash | 10.046s | 0.144s | 68.298s | 6,262 | 1,486 |
| LFM2-24B-A2B | 12.047s | 0.180s | 8.796s | 3,294 | 920 |
| Nemotron-3-Nano-30B-A3B | 24.140s | 0.207s | 24.556s | 5,017 | 1,387 |
| Qwen3-Coder-30B-A3B | 16.773s | 0.180s | 7.767s | 1,756 | 486 |
| Qwen3-Coder-Next-UD-Q5_K_M | 54.299s | 0.223s | 24.808s | 2,603 | 751 |
| Qwen3-VL-30B-A3B | 10.031s | 0.198s | 12.057s | 3,487 | 868 |
| Qwen3.5-27B | 18.100s | 0.317s | 93.729s | 3,453 | 943 |
| Qwen3.5-9B | 6.023s | 0.131s | 38.085s | 3,133 | 1,014 |
_*Model Load is measured at first spawn; cached on subsequent prompts_

#### vulkan-b8672

| Model | Model Load* | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 16.076s | 2.238s | 97.127s | 3,801 | 968 |
| Gemma-4-31B | 14.058s | 0.432s | 85.530s | 3,302 | 912 |
| GLM-4.6V-Flash | 8.047s | 0.093s | 62.300s | 5,387 | 1,385 |
| LFM2-24B-A2B | 10.045s | 0.078s | 9.609s | 3,731 | 1,091 |
| Nemotron-3-Nano-30B-A3B | 20.090s | 0.178s | 33.217s | 7,271 | 2,003 |
| Qwen3-Coder-30B-A3B | 12.509s | 0.141s | 6.321s | 1,772 | 459 |
| Qwen3-Coder-Next-UD-Q5_K_M | 46.221s | 0.211s | 208.458s | 28,298 | 8,192 |
| Qwen3-VL-30B-A3B | 8.054s | 0.133s | 8.861s | 3,208 | 789 |
| Qwen3.5-27B | 14.046s | 0.381s | 100.186s | 3,972 | 1,079 |
| Qwen3.5-9B | 6.019s | 0.125s | 29.466s | 2,986 | 844 |
_*Model Load is measured at first spawn; cached on subsequent prompts_

#### HIP-b8665

| Model | Model Load* | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 20.116s | 1.825s | 62.429s | 2,336 | 614 |
| Gemma-4-31B | 18.110s | 0.389s | 93.632s | 3,410 | 913 |
| GLM-4.6V-Flash | 12.059s | 0.138s | 56.950s | 4,814 | 1,245 |
| LFM2-24B-A2B | 12.052s | 0.211s | 8.876s | 3,366 | 961 |
| Nemotron-3-Nano-30B-A3B | 24.137s | 0.243s | 22.932s | 4,671 | 1,317 |
| Qwen3-Coder-30B-A3B | 16.493s | 0.186s | 11.778s | 2,687 | 733 |
| Qwen3-Coder-Next-UD-Q5_K_M | 54.290s | 0.277s | 76.579s | 2,250 | 625 |
| Qwen3-VL-30B-A3B | 10.059s | 0.202s | 11.991s | 3,089 | 864 |
| Qwen3.5-27B | 18.089s | 0.330s | 111.117s | 4,137 | 1,115 |
| Qwen3.5-9B | 6.030s | 0.125s | 46.447s | 3,579 | 1,073 |
_*Model Load is measured at first spawn; cached on subsequent prompts_

### TypeScript Basics
- **Category:** basics | **Length:** short
- **Streaming:** ✅

#### HIP-b8838

| Model | Model Load* | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 20.097s | 1.735s | 40.564s | 1,775 | 395 |
| Gemma-4-31B | 16.091s | 0.342s | 78.947s | 3,140 | 753 |
| GLM-4.6V-Flash | 10.034s | 0.111s | 67.094s | 6,106 | 1,463 |
| LFM2-24B-A2B | 12.073s | 0.080s | 1.996s | 1,109 | 204 |
| Nemotron-3-Nano-30B-A3B | 24.115s | 0.185s | 20.975s | 5,277 | 1,183 |
| Qwen3-Coder-30B-A3B | 16.076s | 0.112s | 5.884s | 1,696 | 369 |
| Qwen3-Coder-Next-UD-Q5_K_M | 78.432s | 0.173s | 9.355s | 1,575 | 354 |
| Qwen3-VL-30B-A3B | 10.038s | 0.170s | 7.774s | 2,728 | 575 |
| Qwen3.5-27B | 18.096s | 0.295s | 65.596s | 2,950 | 660 |
| Qwen3.5-9B | 6.031s | 0.141s | 45.653s | 4,748 | 1,196 |
_*Model Load is measured at first spawn; cached on subsequent prompts_

#### vulkan-b8672

| Model | Model Load* | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 16.097s | 2.222s | 36.836s | 1,522 | 356 |
| Gemma-4-31B | 14.072s | 0.434s | 74.136s | 3,303 | 792 |
| GLM-4.6V-Flash | 10.031s | 0.083s | 51.157s | 5,100 | 1,139 |
| LFM2-24B-A2B | 8.048s | 0.069s | 1.622s | 955 | 179 |
| Nemotron-3-Nano-30B-A3B | 20.102s | 0.716s | 22.372s | 5,264 | 1,287 |
| Qwen3-Coder-30B-A3B | 12.504s | 0.121s | 5.106s | 1,663 | 372 |
| Qwen3-Coder-Next-UD-Q5_K_M | 42.213s | 0.137s | 9.940s | 911 | 198 |
| Qwen3-VL-30B-A3B | 8.036s | 0.101s | 6.900s | 2,903 | 622 |
| Qwen3.5-27B | 14.047s | 0.373s | 64.782s | 3,131 | 698 |
| Qwen3.5-9B | 6.025s | 0.125s | 28.173s | 3,070 | 806 |
_*Model Load is measured at first spawn; cached on subsequent prompts_

#### HIP-b8665

| Model | Model Load* | TTFT | Total | Chars | Tokens |
| --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 18.079s | 1.777s | 39.320s | 1,712 | 381 |
| Gemma-4-31B | 18.088s | 0.340s | 78.973s | 3,235 | 774 |
| GLM-4.6V-Flash | 10.054s | 0.099s | 53.270s | 5,246 | 1,167 |
| LFM2-24B-A2B | 12.072s | 0.097s | 1.961s | 1,119 | 205 |
| Nemotron-3-Nano-30B-A3B | 24.132s | 0.238s | 19.249s | 4,407 | 1,086 |
| Qwen3-Coder-30B-A3B | 16.571s | 0.176s | 5.381s | 1,531 | 331 |
| Qwen3-Coder-Next-UD-Q5_K_M | 56.302s | 0.158s | 9.416s | 1,115 | 242 |
| Qwen3-VL-30B-A3B | 10.066s | 0.172s | 6.138s | 2,111 | 452 |
| Qwen3.5-27B | 18.083s | 0.281s | 53.357s | 2,509 | 537 |
| Qwen3.5-9B | 6.014s | 0.135s | 20.369s | 2,073 | 505 |
_*Model Load is measured at first spawn; cached on subsequent prompts_

---

## 🏆 Consolidated Analysis

_Averages and aggregates across all prompts_

### HIP-b8665

| Model | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens | Tests |
| --- | --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 20.129s | 1.861s | 61.530s | 2,542 | 605 | 5 |
| Gemma-4-31B | 18.091s | 0.437s | 93.183s | 3,163 | 798 | 5 |
| GLM-4.6V-Flash | 12.055s | 0.134s | 79.711s | 4,255 | 1,163 | 5 |
| LFM2-24B-A2B | 12.074s | 0.180s | 5.229s | 2,148 | 560 | 5 |
| Nemotron-3-Nano-30B-A3B | 24.144s | 0.288s | 22.417s | 5,222 | 1,273 | 5 |
| Qwen3-Coder-30B-A3B | 16.401s | 0.213s | 10.026s | 2,645 | 618 | 5 |
| Qwen3-Coder-Next-UD-Q5_K_M | 54.271s | 0.261s | 67.662s | 5,241 | 2,104 | 5 |
| Qwen3-VL-30B-A3B | 10.031s | 0.236s | 8.459s | 2,574 | 609 | 5 |
| Qwen3.5-27B | 18.083s | 0.349s | 116.797s | 3,646 | 859 | 5 |
| Qwen3.5-9B | 6.016s | 0.147s | 34.182s | 2,790 | 741 | 5 |
_Load Time: measured from llama-server spawn to first response (0 = already cached)

### HIP-b8838

| Model | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens | Tests |
| --- | --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 20.094s | 1.849s | 59.697s | 2,529 | 587 | 5 |
| Gemma-4-31B | 18.094s | 0.459s | 95.254s | 3,083 | 790 | 5 |
| GLM-4.6V-Flash | 10.047s | 0.141s | 71.693s | 5,083 | 1,182 | 5 |
| LFM2-24B-A2B | 12.048s | 0.159s | 5.290s | 2,178 | 550 | 5 |
| Nemotron-3-Nano-30B-A3B | 26.176s | 0.257s | 24.887s | 5,962 | 1,381 | 5 |
| Qwen3-Coder-30B-A3B | 16.356s | 0.201s | 9.390s | 2,549 | 582 | 5 |
| Qwen3-Coder-Next-UD-Q5_K_M | 56.267s | 0.258s | 104.798s | 10,981 | 3,629 | 5 |
| Qwen3-VL-30B-A3B | 10.049s | 0.227s | 9.987s | 3,191 | 704 | 5 |
| Qwen3.5-27B | 18.067s | 0.349s | 111.633s | 3,627 | 862 | 5 |
| Qwen3.5-9B | 6.019s | 0.150s | 37.270s | 3,460 | 895 | 5 |
_Load Time: measured from llama-server spawn to first response (0 = already cached)

### vulkan-b8672

| Model | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens | Tests |
| --- | --- | --- | --- | --- | --- | --- |
| Devstral-Small-2-24B-Instruct | 16.103s | 2.319s | 64.565s | 2,687 | 636 | 5 |
| Gemma-4-31B | 14.079s | 0.507s | 85.058s | 3,119 | 779 | 5 |
| GLM-4.6V-Flash | 8.044s | 0.100s | 63.374s | 4,617 | 1,061 | 5 |
| LFM2-24B-A2B | 10.033s | 0.099s | 5.151s | 2,245 | 577 | 5 |
| Nemotron-3-Nano-30B-A3B | 20.112s | 0.412s | 26.704s | 6,634 | 1,577 | 5 |
| Qwen3-Coder-30B-A3B | 14.205s | 0.163s | 8.432s | 2,681 | 612 | 5 |
| Qwen3-Coder-Next-UD-Q5_K_M | 80.408s | 0.231s | 126.875s | 16,027 | 5,051 | 5 |
| Qwen3-VL-30B-A3B | 8.029s | 0.145s | 7.765s | 3,084 | 694 | 5 |
| Qwen3.5-27B | 14.066s | 0.435s | 105.853s | 3,811 | 879 | 5 |
| Qwen3.5-9B | 6.024s | 0.142s | 29.880s | 2,853 | 762 | 5 |
_Load Time: measured from llama-server spawn to first response (0 = already cached)

---

## 📊 Model Performance Across Servers

### Qwen3-Coder-30B-A3B

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| HIP-b8838 | 16.356s | 0.201s | 9.390s | 2,549 | 582 |
| vulkan-b8672 | 14.205s | 0.163s | 8.432s | 2,681 | 612 |
| HIP-b8665 | 16.401s | 0.213s | 10.026s | 2,645 | 618 |

### Gemma-4-31B

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| HIP-b8838 | 18.094s | 0.459s | 95.254s | 3,083 | 790 |
| vulkan-b8672 | 14.079s | 0.507s | 85.058s | 3,119 | 779 |
| HIP-b8665 | 18.091s | 0.437s | 93.183s | 3,163 | 798 |

### Qwen3-VL-30B-A3B

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| HIP-b8838 | 10.049s | 0.227s | 9.987s | 3,191 | 704 |
| vulkan-b8672 | 8.029s | 0.145s | 7.765s | 3,084 | 694 |
| HIP-b8665 | 10.031s | 0.236s | 8.459s | 2,574 | 609 |

### GLM-4.6V-Flash

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| HIP-b8838 | 10.047s | 0.141s | 71.693s | 5,083 | 1,182 |
| vulkan-b8672 | 8.044s | 0.100s | 63.374s | 4,617 | 1,061 |
| HIP-b8665 | 12.055s | 0.134s | 79.711s | 4,255 | 1,163 |

### LFM2-24B-A2B

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| HIP-b8838 | 12.048s | 0.159s | 5.290s | 2,178 | 550 |
| vulkan-b8672 | 10.033s | 0.099s | 5.151s | 2,245 | 577 |
| HIP-b8665 | 12.074s | 0.180s | 5.229s | 2,148 | 560 |

### Qwen3.5-9B

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| HIP-b8838 | 6.019s | 0.150s | 37.270s | 3,460 | 895 |
| vulkan-b8672 | 6.024s | 0.142s | 29.880s | 2,853 | 762 |
| HIP-b8665 | 6.016s | 0.147s | 34.182s | 2,790 | 741 |

### Devstral-Small-2-24B-Instruct

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| HIP-b8838 | 20.094s | 1.849s | 59.697s | 2,529 | 587 |
| vulkan-b8672 | 16.103s | 2.319s | 64.565s | 2,687 | 636 |
| HIP-b8665 | 20.129s | 1.861s | 61.530s | 2,542 | 605 |

### Qwen3.5-27B

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| HIP-b8838 | 18.067s | 0.349s | 111.633s | 3,627 | 862 |
| vulkan-b8672 | 14.066s | 0.435s | 105.853s | 3,811 | 879 |
| HIP-b8665 | 18.083s | 0.349s | 116.797s | 3,646 | 859 |

### Qwen3-Coder-Next-UD-Q5_K_M

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| HIP-b8838 | 56.267s | 0.258s | 104.798s | 10,981 | 3,629 |
| vulkan-b8672 | 80.408s | 0.231s | 126.875s | 16,027 | 5,051 |
| HIP-b8665 | 54.271s | 0.261s | 67.662s | 5,241 | 2,104 |

### Nemotron-3-Nano-30B-A3B

| Server | Load Time | Avg TTFT | Avg Total | Avg Chars | Avg Tokens |
| --- | --- | --- | --- | --- | --- |
| HIP-b8838 | 26.176s | 0.257s | 24.887s | 5,962 | 1,381 |
| vulkan-b8672 | 20.112s | 0.412s | 26.704s | 6,634 | 1,577 |
| HIP-b8665 | 24.144s | 0.288s | 22.417s | 5,222 | 1,273 |

---

## 📌 Report Files Analyzed

- benchmark-report-2026-04-18T21-20-36-800Z.json
- benchmark-report-2026-04-18T20-03-02-405Z.json
- benchmark-report-2026-04-18T19-12-42-151Z.json
- benchmark-report-2026-04-18T18-30-53-871Z.json
- benchmark-report-2026-04-18T17-37-22-435Z.json

_Report generated on 4/19/2026, 9:42:53 AM_
