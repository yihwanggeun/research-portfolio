---
title: 'CUrator - An Efficient LLM Execution Engine with Optimized Integration of CUDA Libraries'
description: 'GCUrator - An Efficient LLM Execution Engine with Optimized Integration of CUDA Libraries'
date: 2024-06-16
technologies: ['Astro', 'TypeScript', 'Obsidian']
repoLink: 'https://github.com/example/life-archive'
---

# CUrator - An Efficient LLM Execution Engine with Optimized Integration of CUDA Libraries

## 2. Background & Motivation

### 2.1 CUTLASS

CUTLASS is an open-source template-based library that enables developers to optimize GEMM and related operations on NVIDIA GPUs

**Supported Optimization Features:**

- **2-levels of hierachy tiling** : Warp-level and Threadblock-level tiling
- **Split-K optimization**
- **Thread Block Swizzle** : Threadblock scheduling to improve load balancing
- **Software Pipeline**
  ![[Pasted image 20250615144931.png]]

---

### 2.1.1 Tiling Configuration

CUTLASS divides the GEMM output space into **threadblock tiles (TBTs)**, each of which is further subdivided into **warp tiles (WTs)**.

Changing the size and shape of each has impact on GEMM performance

### 2.1.2 Software Pipelining

To hide memory latency and maintain high utilization, CUTLASS employs a software pipeline consisting of three concurrent stages:

1. **Global Memory → Shared Memory**  
2. **Shared Memory → Registers**  
3. **Computation**

### 2.1.3 Split-K Optimization

#### **Before Computation**

The K-Dimension GEMM is divided by **split-k factor.**
As a result, **multiple threadblocks** compute **partial result** for same output

#### **After Computation**

After partial GEMM computations are completed, CUTLASS launches a **parallel reduction kernel**. This kernel aggregates the partial results produced by different threadblocks

#### **Meaning**

Split-K Optimization allows user to adjust to the number of threadblock tiles to control the utilization of the GPU's computing core resources

#### **Concurrency**

CUTLASS performs semaphore-based data movement control
Different TBT store the result of GEMM in different shared memory
-> access on same global memory for when perfroming parallel reduction operation
-> In this case CUTLASS use **semaphore-based** memory access control

---

## 2.2 TVM BYOC Example

TVM BYOC is a part of the backend infrastructure of TVM which allows users to transform TVM graph IR into user-desirable graph IR

According to below Figure(c) BOLT framework use TVM BYOC to replace input graph IR with the user-desired IR based on **pattern table**

And BYOC allows node of input TVM graph IRs to be converted to third-party librarys, such as cuBLAS and CUTLASS
![[Pasted image 20250615152801.png]]

---

## 2.3 Limitations of Prior Reseach and Motivation

### Limitation in performance

- **Ansor:** Profiled a subset of the search space and trained the cost model to find the best tiling setting. -> Can't consider the hardware resources of the target GPU.
- **BOLT:** Utilizes the GEMM and Batch GEMM from the CUTLASS Library. -> Has a narrow search space for CUTLASS GEMM tuning.
  > There is potential for improving GEMM performance through the use of highly tuned CUTLASS GEMM kernel or cuBLAS

### Remain Limitation in Prior Research

1. Previous research has not focused on the **end-to-end LLM** execution as a primary target workload
2. It is necessary to avoid unwanted memory allocation overhead
3. it is important to implement efficient GEMM computation across the various GEMM and Hardware platform

---

## 2.4 Suggestion

**CUrator**, a novel end-to-end LLM execution engine that can execute modern LLMs in various GPU computing environments.

1. Modify the LLM graph based on the TVM IR into CUTLSS/cuBLAS friendly IR
2. Consider the allocation of memory resources for GEMM not to harm performance
3. Finds the best compilation parameters based on full search
4. Employ the batched split-K CUTLASS GEMM to enable a more comprehensive utilization

---

# 3. CUrator: An Efficient LLM Execution Engine Using Multiple CUDA Libraries

## Overview

### CUrators Compotents

#### (1) Graph Rewriter

Graph Rewriter transforms the input of **ONNX graph** into **CUTLASS- and cuBLAS-enabled TVM graphs** by detecting graph node patterns

Since cuBLAS kernels only reveive input data of the _Variable format_, the _Constant format_ is modified into a _Variable format_ to enable **cuBLAS BYOC in TVM**

TVM BYOC partitions the graph IR with a predefined pattern table
In the pattern table, there are several patterns for **Fused Multi-Head Attention(FMGA)**

CUrator lists the available tiling settings and **Brute-Force** searches for the best tiling parameter including CUTLASS **enabled batched split-k**

#### (2) Runtime Engine

Compiles each modified graph into executable binaries via either BOLT or TVM BYOC backends

---

## 3.1 Efficient TVM Integration of CUDA Libraries

CUrator converts the generic TVM graph IRs into both cuBLAS/CUTLASS friendly graph IRs

### 3.1.1 Construction of **cuBLAS-Enabled** Graph IR

#### (1) Traverses the input graph IR and extracts all data information if the data format is _constant_ (For preserving integrity)

#### (2) _Constant Data_ is replaced with the _Variable-Typed Data_

#### (3) CUrator generated the modified graph IR according to BYOC table

### 3.1.2 Best CUTLASS Tiling Setting Exploration Support

#### (1) Merge Several graph IR nodes into a fused GEMM operation baed on patterns in the CUTLASS table

#### (2) Find the best tiling setting for the target fused GEMM (Consider **_only single GEMM_**)

##### **Preparation Stage:**

CUrator collects the available tiling settigs for the target CUTLASS GEMMs for the target GPU and taget precision

CUrator first determines feasible tiling parameter by considering static assertion and CUDA-specific contraints

Based on detailed checklist, CUrator verifies the available tiling settings in the search space and sends them to the **Profiling Stage**
![[Pasted image 20250615163501.png]]

##### **Profiling Stage:**

CUrator finds the optimal tiling setting that performs the GEMM fastest

The available tiling parameters are first inserted as input parameters for the CUT-
LASS GEMM kernel and then compiled as an object file.

Finally, CUrator executes the compiled binaries and records the performance results in a text file.

---

### 3.1.3 CUTLASS-Friendly Graph IR Modification.

#### **Remove overhead for the reduction key**

therefore an unnecessary memory allocation is performed at the LLM inference time instead of allocating it at the build time.

it is necessary to allocate numerous reduction keys at inference time to fully utilize all SMs

Consequently, CU-rator relocates the reduction key allocation and initialization process in the CUTLASS split-K GEMM from inference time to build time

#### **Semaphore Algorithm in split-K**

The semaphore algorithm allows only a thread block that has acquired the key to access data in global memory while preventing accesses from other thread blocks

The number of keys : $\#key = (output_m/TVT_m) * (output_n/TBT_n)$

Therefore, CUrator modifies the original Graph IR to a split-K friendly Graph IR to help the CUTLASS kernel find the best tiling setting without the reduction key allocation overhead of split-K GEMMs.

By registering reduction keys in the input table and adding the parameter to the graph IR in the host-module, the reduction key can be allocated and initialized at build time

---

## 3.2 Split-K Support on Batch GEMM

the execution of LLM computations on modern GPUs often results in underutilization of GPU cores due to insufficient target GEMM size.

> CUrator exploits a batch GEMM integrated with the split-K mechanism to compensate for low core occupancy on the GPU during LLM operations.

the batched GEMM kernel with split-K opti-mization is not yet supported as a regular template in the latest version of the CUTLASS library.

CUrator applies the split-K algorithm to Batch GEMM by changing the threadblock organization by modifying the CUTLASS template

## ![[Pasted image 20250615165425.png]]

# 4. Evaluation

The time required to derive the first token, referred to as the Time To First Token (TTFT), has also become an important metric in evaluating the performance of recent LLMs

We therefore focus on optimizing the performance of GEMM operations, given the high proportion of execution time and the importance of TTFT.

## 4.1 Evaluation Setup

### **System Configuration**

The CUrator was implemented based on the BOLT [43] on top of TVM BYOC [13] infrastructure, including the CUTLASS [25] and cuBLAS [1] libraries.

In compiling cuBLAS runtime, include cuDNN module for softmax
In compiling CUTLASS runtime, include One Flow module for softmax

By leveraging the BOLT’s caching capabilities that store the best tiling setting for each GEMM, we ensure that GEMMs that have previously been profiled are not profiled again.

---

### **Baselines and CUrator Versions**

- **BOLT:** Default split-K parameter
- **Ansor:** Total Tuning Trials to 900
- **TensorRT-LLM:** Without the precision downscaling technique

Evaluated the end-to-end inference performance for each model without and with the FMHA technique

---

### **DataSet**

Obtain target LLMs from HuggingFace, import them int **PyTorch** to convert into **ONNX Model**, are converted to **Relay graph IR**

#### **Evaluation Environments**

- Both **single-precision** and **half-precision** LLM(Converted by TVM API)
- The sequence length of LLM was **512**
- **1, 4, 8 Batch size** for effectiveness of CUrator Batched GEMM

#### **Evaluation Model**

- BERT [16, 39] models (mini, tiny, small, medium, base, and large)
- GPT-2 [34] models (default, and medium)
- Llama models(openLlama-3B [17], MetaLlama3-8B [5])

---

## 4.2 End-to-End Inference Performance Evaluation

### **4.2.1 Single Precision (Normalized to _Ansor_)**

- CUTLAS-Oracle outperform the previous frameworks in most cases, cuBLAS sometimes shows the best performance

#### **vs TensorRT-LLM:**

- CUrator w/FMHA achieves an average speedup of up to 1.18X, 1.40X, ...
- CUrator may show slightly lower end-to-endinference performance than TensorRT-LLM in certain cases because CUrator does not perform target-GPU-specific

#### **vs Ansor:**

- Ansor can perform similarly or better than other frameworks when the model input is a single batch and the model size is small
- However, ansor cannot outperform other frameworks when the size of the GEMMs configuring the models increases **because Ansor does not understand GPU resources well.**

#### **vs BOLT**

BOLT performs worse than the other frameworks.

- BOLT performs worse than CUTLASS-Oracle because it often chooses the best tiling setting from a narrow search space
- Unlike CUrator, BOLT maps an un-tuned native TVM kernel to the Softmax operation
- BOLT’s Graph IR does not consider the performance overhead of reduction key allocation for split-K GEMMs at runtime.

> The potential performance gains from maximally optimized GEMM kernels are significantly higher than the gains from LLM-specific graph level optimizations.

## ![[Pasted image 20250615211315.png]]

### **4.2.2 Half Precision**

Excluding V100 because the tensor cores in the V100 GPU are used differently compared to the newer GPUs [36] (Ampere and later generations).

- CUrator w/ FMHA achieves an average speedup of up to 4.40×, 4.24×, 3.89×, and 6.20×over the Ansor framework

#### **vs TensorRT-LLM:**

- TensorRT-LLM often outperforms CUrator for models with a smaller hidden size
- Because the performance gains from various optimization techniques, such as FMHA, are higher than the performance gains from efficient GEMM operations.
- However, for larger models with a much larger hidden size, CUrator shows superior performance

#### **vs Ansor:**

Although Ansor supports auto tuning on multiple hardware, it does not consider resource utilization in detail for specific hardware well.

- Ansor performs worse than cuBLAS and CUTLASS-Oracle, which can fully utilize the given GPU resources.
- As BOLT does not provide Softmax kernel tuning, the GEMMs that configure the model can be faster than Ansor

#### **vs Bolt:**

BOLT often shows suboptimal performance in end-to-end inference when the Softmax computation bottleneck is a large portion of the inference time
![[Pasted image 20250615222836.png]]

---

### **4.2.3 CUTLASS Kernel Performance Analysis.**

Profiling results from the NVIDIA Nsight profiler [29] for common GEMMs used in the openLlama-3B model 2 on the A6000 GPU.

- CUTLASS kernels have only 26.22% pipeline stalls on average, compared to cuBLAS kernels
- Only 0.76x global memory accesses on average
  ![[Pasted image 20250615222849.png]]

---

## 4.3 Evaluation on Techniques of CUrator

### **4.3.1 Split-K Optimization.**

the proportion of split-K enabled and disabled CUTLASS GEMM kernels is determined
based on the GEMM dimensions of a target LLM.

As a result, the inference performance with the split-K option outperforms the performance without the split-K option by 1.09×and 1.08×for batch sizes of 1 and 4, respectively.

According to the above result, a significant number of GEMMs should be tuned with the split-K optimization since the output matrix size of GEMMs in recent LLMs is insufficient to fully utilize the entire GPU computing cores.

### **4.3.2 CUTLASS-Friendly Graph IR Modification**

we compare the CUTLASS-friendly graph IR with the original graph IR.

The CUTLASS-friendly Graph IR generally outperforms the original Graph IR in all cases.

This shows that CUTLASS-friendly Graph IR is generally effective across multiple GPUs.

According to Figure 9, the Graph IR Modification is effective as the number of cores increases for multiple GPUs.

GEMMs do not require the split-K algorithm on prior GPUs consisting of a small number of SMs, but the split-K algorithm is often required on modern GPUs consisting of many
SMs
![[Pasted image 20250616003947.png]]

### **4.3.3 Split-K Support on Batch GEMMs**

As the number of cores in GPUs increases, the Batch GEMM w/ split-K becomes more effective than other libraries for small-sized Batch GEMMs.

Batch GEMM with split-K is effectively applied when the input size is small, resulting in improved performance over cuBLAS.
![[Pasted image 20250616004340.png]]

---

## 4.4 Case Study

We have performed a case study to introduce six well-known auto-tuners [7, 45] to find the CUTLASS oracle tiling setting on the CUrator.

1. **Open-Tuner**
   Test 30×per GEMM on openLlama-3B
   Not found fair tiling settings for GEMM operations compared to ML-based tuners and CUrator
2. **ML-based Tuner**
   - Use GEMM profile information from BERT and GPT2 models
   - Cannot exploit the GPU potential as much as CUTLASS-Orcale when applied to the OpenLlama-3B model,
   - But they can show better performance than cuBLAS

The experimental results indicate that if an advanced auto-tuner is developed that can identify the tiling settings of the CUTLASS oracle it could approach the performance of CUrator within a small compilation time budget.

![[Pasted image 20250616005619.png]]

---

# 5. Related Works

In recent years, the field of deep learning computation has been in urgent need of faster computational speeds, and numerous researchers have been engaged in developing solutions to this problem.

## 5.1 Enhancing the efficiency of BLAS computations such as GEMM

_Improving the performance of linear algebra computations_

**Rahman et al. [35] and Malik [23] :**
**Machine learning** model to predict optimal tile sizes for several linear algebra computations as a replacement for a complex

**Huang et al. [18] :**
Detailed **analytical performance model** for Strassen’s algorithm, which is an advanced algorithm of the GEMM operation, in a GPU computing environment.

**Lym et al. [22] :**
Similarly constructed a novel **analytical cost model** for convolution operations in
GPU computing environments considering various compiler features such as the software pipelining technique.

**Zhang et al. [48] :**
Developed a detailed performance model for the SGEMM operation in GPUs based on the detailed **analysis** of the CUDA PTX (Parallel Thread Execution) ISA

**Yu et al. [45] :**
Introduced an end-to-end GEMM performance calibration framework based on a fully-connected **neural network model**, which predicts the best tiling parameters and compile parameters for the CUTLASS GEMM.

> However, they did not focus on the end-to-end performance of deep learning models.

_The CUrator is designed to focus on the performance of the entire deep learning computation process._

---

## 5.2 focusing on end-to-end performance optimization for various deep learning models.

**Chen et al. [12] : AutoTVM**
Learns various **domain-specific cost models** and uses them to optimize deep learning computations

**Li et al. [20] : AdaTune**
Incorporates **deep learning models** in order to enhance the compilation times and performance of tensor programs.

**Ahn et al. [4] : Chameleon**
**Reinforcement learning** techniques to reduce the compilation time of deep learning models while enhancing their execution performance.

**Zheng et al. [51] : FlexTensor**
Schedules tensor programs by considering **intrinsic features of various hardware**, **heuristic methods**, and **machine learning-based** methods to compile optimal ensor programs on various hardware platforms

**Ryu et al. [37] : OneShot**
A **neural network-based** tensor program tuning framework that can replace the laborious process of tensor program hand-tuning

**Jeon and Park et al. [19] : Collage**
Enables **sophisticated integration of various DL backends**, so that deep learning compilers on different platforms can fully benefit from optimizations provided by third-party libraries.

> They are unable to derive the optimal end-to-end LLM execution performance through a comprehensive search based on state-of-the-art third-party libraries.

_From this perspective, CUrator has the advantage of achieving optimal end-to-end LLM performance in modern GPU computing environments._

---

# 6. Conclusion

We proposed CUrator, an efficient modern LLM execution framework using maximally tuned third-party libraries on various GPUs.

The average end-to-end LLM execution speedups when maximally tuned are 1.50×and 4.99×in single and half precision

The use of CUrator as a fundamental tool for studying GEMM operations across a spectrum of GPUs will inevitably lead to the construction of robust analytical cost or predictive models, informed by the insights derived from the comprehensive analysis of CUrator.

---

# Abstract

Large Language Models (LLMs) such as **BERT**, **GPT**, and **LLaMA** rely heavily on **General Matrix Multiplication (GEMM)** operations, which dominate inference time. To accelerate GEMM on GPUs, libraries like **cuBLAS** and **CUTLASS** provide optimized implementations — with CUTLASS allowing fine-grained kernel tuning through

## Limitations of Prior Work

- Have not considered **different(various) model parameters** for modern LLMs
- Have not explored the impact of \*\*diverse GPU environments

## What CUrator Does

LLM Execution Engine, **End-To-End** LLM Performance using both cuBLAS and CUTLASS

**CUrator Main Technique :**

1. Generates CUTLASS-/cuBLAS-friendly graph IRs
   on various LLMs on the TVM framework
2. Perform comprehensive search for programmable tuning parameters in CUTLASS library

**CUrator's other optimization techniques:**

1. build-time reduction key initialization support for CUTLASS Split-K GEMMs
2. Split-K support for CUTLASS Batch GEMMs
3. Finally CUrator selects mapping path between cuBLAS and CUTLASS

## Evaluation

1.50x, 4,99x for representative LLMs on the A100 GPU in single and half precision

CUrator can provide the best direction for next-generation tuning frameworks by showing maximum end-end-to-end performance of various LLMs on various GPUs.

# 1. Introduction

To describe various DL models, deep learning frameworks(ONNX, PyTorch, TVM) have been introduced. And then to achieve the perfornamce of various computations, various SW-leel libraries(cuBLAS, cuDNN, CUTLASS) have been developed

## CUTLASS

An open source template-based BLAS library, CUTLASS can achieve excellent LLM performance by composing LLM computations based on CUTLASS

- Provide customizable features to optimize GEMM operation
- Example features : (Tiling Config, Optimization Factors, Memory Layout)
- Affect core and memory resource utilization
- Allow users to specify hardware friendly features

## Previous Studies

Ansor : Derives the optimal values of GEMM features through _evolutionaty search_
-> Sw-only auto-tuners cannot achieve the performance of closed-source libraries by hardware vendors
BOLT : Finds the optimal CUTLASS parameters by considering the underlying hardware
-> Still practical limitations of deep learning frameworks and GPU Libraries

(1) : Mapping coverage of kernels from the libraries is still low
The graph node must be matched to that required by library
(2) : Initialization process can be the main cause of performance degradation
several input-dependant initialization(Split-k key) incur high performance overhead
Solution : The input parameters of mapping kernels in model graphs can be performed once at build time so that the runtime overhead can be eliminated
(3) Hard to estimate the full potential of using the libraries(each kernel's performance varies depending on various system-related parameters)

## CUrator

1. Constructs CUTLASS/cuBLAS friendly computation graphs
2. CUTLASS backend perform extensive search for kernel specific parameters
3. build-time reduction key initialization for CUTLASS Split-k GEMMs
4. split-k support for CUTLASS Batch GEMMs
