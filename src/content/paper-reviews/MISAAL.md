---
title: "MISAAL paper reading"
description: "MISAAL: Mixed precision"
date: 2024-12-15
technologies: ["AI", "Compiler"]
pdf: "/research-portfolio/papers/MISAAL.pdf"
---

## 1. Overview & Problem Statement
MISAAL is a system designed to bridge the gap between complex hardware instructions (ISAs) and compiler optimizations.

### The Challenge
* **Complexity of Modern ISAs:** Modern architectures (AVX, Hexagon, ARM Neon) introduce complex compute and swizzle (data movement) instructions. [11]
* **Manual Backend Limitations:** Manually implementing backends for DSL compilers (like Halide, TVM) is error-prone, brittle, and unscalable. [12]
* **Limitations of Existing Synthesis:** Previous synthesis-based approaches (like Hydride and Rake) suffer from exponentially large search spaces, resulting in poor performance and excessive compilation times (sometimes taking hours). [13, 90]

### The Solution: MISAAL
MISAAL replaces manual pattern matching with a synthesis-based approach that generates code in seconds rather than hours. It relies on three main strategies: [91, 92]
1.  **Scalable Enumeration:** Using equivalence classes and offline execution. [15, 17, 18]
2.  **Optimized Data Movement:** Handling cross-lane compute and data swizzles automatically. [19]
3.  **Abstraction:** Reducing the number of rewrite rules through numeric parameter lifting. [20, 22]

---

## 2. Methodology and Design
MISAAL operates by generating rewrite rules in an offline stage and performing term rewriting at compile time. [101]

### A. Equivalence Class Based Enumeration
* **AutoLLVM IR:** MISAAL employs Hydride's similarity analysis to abstract semantically similar instructions into a target-agnostic IR called "AutoLLVM IR". [145, 146]
* **Search Space Reduction:** Instead of enumerating target-specific instructions directly, it enumerates using AutoLLVM IR to generate rewrite rule templates. This addresses the intractability caused by fixed types in traditional methods. [283]

### B. Automatic Complex Swizzle Discovery
* **The Swizzle Problem:** Manually reasoning about complex cross-lane operations (permutes/shuffles) is difficult and often incomplete. [181, 182]
* **Automated Solution:** MISAAL automatically derives complex data-swizzles offline from ISA semantics. It analyzes data-access patterns to create swizzles that interleave operands or deinterleave results as needed. [184, 186]

### C. Semantics-Based Search Space Pruning
* **Relevance Sets:** To manage the search space, MISAAL defines "Relevance Sets" of AutoLLVM IR operations to enumerate. [253]
* **Pruning Impact:** This technique reduces the enumeration space by orders of magnitude (e.g., from $3 \times 10^{12}$ to $2.9 \times 10^8$). [250]

### D. Target-Agnostic Rewrite Rule Abstraction
* **Parameter Lifting:** MISAAL abstracts numeric parameters (like vector size and bitwidth) into symbolic expressions. [322]
* **Efficiency:** This allows a single higher-order rewrite rule to represent many concrete patterns, significantly reducing the total number of rules required. [323]

---

## 3. Evaluation
MISAAL was evaluated against Halide (manual backend), Hydride, and Rake using 33 benchmarks from image processing and deep learning. [370]

### A. Compilation Time
* **Speedup:** MISAAL achieves order-of-magnitude reductions in compilation time compared to Hydride. [396]
    * **x86:** 16x faster (Geomean). [396]
    * **HVX:** 9x faster. [396]
    * **ARM:** 10x faster. [396]
* **Comparison to Rake:** MISAAL compiles 6.84x faster than Rake for HVX benchmarks. [417]
* **Complex Kernels:** For complex kernels requiring swizzling (e.g., convolution), MISAAL completes in seconds while Hydride can take over 5 hours. [410]

### B. Memory Usage
* **Efficiency:** MISAAL requires orders of magnitude less memory than Hydride. [423]
* **Edge Feasibility:** Peak memory usage is around 2.5 GB (feasible for edge devices), whereas Hydride can exceed 15 GB. [430]
* **Reduction:** It achieves an 18x memory reduction on x86 and 26x on ARM compared to prior work. [425]

### C. Performance (Runtime)
MISAAL generates code that is competitive with or better than the highly optimized, manually written Halide backend. [518]
* **x86:** Geomean speedup of **1.10x** (max 2.08x) over Halide. It effectively repurposes dot-product instructions and identifies saturation opportunities. [444, 446]
* **ARM:** Geomean speedup of **1.02x** over Halide. [451]
* **Hexagon (HVX):** Geomean relative performance of **0.98x** (competitive with Halide's aggressively optimized backend). [460]

### D. Rule Reduction
* **Abstraction Success:** The abstraction techniques reduced the number of total rewrite rules from 41,841 (concrete) to 2,215 (abstracted), a reduction of roughly **18.9x**. [494]

---

## 4. Conclusion
MISAAL successfully addresses the scalability and retargetability challenges of synthesis-based compilers. By automating the generation of components from vendor-provided pseudocode and employing offline optimization strategies (swizzle discovery, pruning, and abstraction), it delivers performance comparable to production compilers with significantly lower engineering effort. [507, 508, 518]