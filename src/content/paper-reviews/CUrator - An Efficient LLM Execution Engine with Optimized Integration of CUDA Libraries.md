---
title: 'CUrator: Efficient LLM Execution Engine'
description: 'An analysis of CUrator, an engine that optimizes LLM execution by integrating and tuning CUDA libraries like CUTLASS and cuBLAS.'
date: 2024-06-16
technologies: ['LLM', 'CUDA', 'System Architecture', 'Compilers']
repoLink: ''
---

## Abstract

Large Language Models (LLMs) such as **BERT**, **GPT**, and **LLaMA** rely heavily on **General Matrix Multiplication (GEMM)** operations, which dominate inference time. To accelerate GEMM on GPUs, libraries like **cuBLAS** and **CUTLASS** provide optimized implementations. **CUrator** is a novel framework that optimizes end-to-end LLM performance by generating CUTLASS/cuBLAS-friendly graph IRs and performing comprehensive parameter tuning.

---

## 1. Background & Motivation

### 1.1 CUTLASS
CUTLASS is an open-source template-based library that enables developers to optimize GEMM and related operations on NVIDIA GPUs. Key features include:
*   **Hierarchical Tiling**: Warp-level and Threadblock-level tiling.
*   **Split-K Optimization**: Divides the K-dimension of GEMM to increase parallelism.
*   **Software Pipelining**: Hides memory latency by overlapping data transfer and computation.

### 1.2 Limitations of Prior Work
*   **Ansor**: Uses evolutionary search but often fails to capture hardware-specific constraints.
*   **BOLT**: Uses CUTLASS but searches a narrow parameter space.
*   **General Limitation**: Previous research often overlooked end-to-end LLM execution performance and the overhead of memory allocation for auxiliary structures like reduction keys.

---

## 2. CUrator Overview

**CUrator** is designed to execute modern LLMs efficiently in various GPU environments. Its core components are:

### 2.1 Graph Rewriter
Transforms the input **ONNX graph** into **CUTLASS- and cuBLAS-enabled TVM graphs**.
*   **Pattern Matching**: Detects nodes suitable for library offloading (e.g., Fused Multi-Head Attention).
*   **Format Conversion**: Converts constant data to variable formats to enable cuBLAS BYOC support.

### 2.2 Runtime Engine
Compiles the modified graph into executable binaries. It employs a **Brute-Force** search strategy to find the best tiling parameters for CUTLASS kernels, ensuring optimal utilization of GPU resources.

---

## 3. Key Optimization Techniques

### 3.1 Efficient Integration of CUDA Libraries
CUrator converts generic TVM graph IRs into library-friendly IRs.
*   **cuBLAS-Enabled**: Replaces constant data with variable-typed data to ensure compatibility.
*   **CUTLASS-Enabled**: Merges graph nodes into fused GEMM operations and explores the best tiling settings.

### 3.2 Build-Time Reduction Key Allocation
In Split-K GEMM, reduction keys are needed to manage partial results. Allocating these at runtime incurs overhead.
*   **Optimization**: CUrator moves the allocation and initialization of reduction keys to **build time**, eliminating runtime overhead and improving inference latency.

### 3.3 Split-K Support for Batch GEMM
Modern GPUs often suffer from low occupancy with small batch sizes.
*   **Optimization**: CUrator applies Split-K optimization to **Batch GEMM** operations, allowing multiple thread blocks to work on the same matrix multiplication, thus improving core utilization.

---

## 4. Evaluation

### 4.1 Setup
*   **Hardware**: Evaluated on NVIDIA A100, A6000, and other modern GPUs.
*   **Models**: BERT, GPT-2, LLaMA (various sizes).
*   **Baselines**: BOLT, Ansor, TensorRT-LLM.

### 4.2 Results
*   **Single Precision**: CUrator outperforms BOLT and Ansor in most cases. It achieves comparable or better performance than TensorRT-LLM for certain model configurations.
*   **Half Precision**: Significant speedups observed (up to **6.20x** over Ansor) due to better utilization of Tensor Cores and optimized tiling.
*   **Split-K Impact**: Enabling Split-K for Batch GEMM resulted in **1.09x** speedup for small batch sizes, proving its effectiveness in low-latency scenarios.

---

## 5. Conclusion

CUrator demonstrates that integrating and tuning third-party libraries like CUTLASS and cuBLAS within a compiler framework can significantly boost LLM inference performance. By addressing specific bottlenecks like reduction key overhead and Batch GEMM utilization, CUrator provides a robust solution for deploying LLMs on diverse GPU architectures.
