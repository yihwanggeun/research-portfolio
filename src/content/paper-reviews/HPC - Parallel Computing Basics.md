---
title: 'HPC: Parallel Computing Basics'
description: 'A comprehensive overview of Parallel Architecture, Flynn’s Taxonomy, and strategies for extracting parallelism in hardware.'
date: 2024-05-10
technologies: ['HPC', 'Parallel Computing', 'Computer Architecture']
repoLink: ''
---

## Introduction

Before diving into GPU Architecture, it is essential to understand **"Parallel Architecture"** and how to write programs that effectively utilize these structures. This review covers the fundamental concepts of parallelism, hardware execution models, and algorithm design.

## Types of Parallelism

Parallelism involves using multiple resources to solve a problem. It can be categorized into different levels of abstraction:

### 1. ILP (Instruction Level Parallelism) - Low Level
*   **Concept**: Executing more than one instruction in a single cycle.
*   **Mechanism**: Handled mostly by hardware. The processor finds instructions within an **Instruction Window** that can be executed in parallel.
*   **Example**: **Superscalar** architectures issue multiple instructions at a time without dependency.
*   **Developer Perspective**: Generally, developers do not need to worry about this explicitly; the hardware and compiler handle it.

### 2. TLP (Thread Level Parallelism) - High Level
*   **Concept**: Using threads to perform tasks concurrently. "Thread" is a software concept; hardware only understands instructions.
*   **Mechanism**: Explicitly dividing the program into multiple threads.
*   **Developer Perspective**: Developers must explicitly define how to split tasks and manage synchronization.

### 3. DLP (Data Level Parallelism) - High Level
*   **Concept**: Performing the same operation on different data sets simultaneously.
*   **Mechanism**: Vector instructions (SIMD) or GPU execution models.
*   **Developer Perspective**: Utilizing vector instructions to load and process multiple data points at once.

---

## Flynn's Taxonomy

A classification of computer architectures based on the number of instruction streams and data streams:

*   **SISD (Single Instruction, Single Data)**: Ordinary CPU (exploits ILP).
*   **MISD (Multiple Instruction, Single Data)**: Rare in the real world (e.g., fault-tolerant systems).
*   **SIMD (Single Instruction, Multiple Data)**: DLP (Vector Processors, GPUs).
*   **MIMD (Multiple Instruction, Multiple Data)**: TLP (Multi-core CPUs, Clusters).

---

## Extracting Parallelism in Hardware

How does hardware enable parallelism?

### ILP (Instruction Level Parallelism)
*   **Superscalar**: Issues multiple instructions from a single thread in a single cycle.
*   **Constraint**: Limited by the **Instruction Window** size. If the window is full or dependencies exist, functional units may remain idle.

### TLP (Thread Level Parallelism)
*   **Chip Multi-Processors (CMP)**: Multi-Core CPUs where each core has its own resources (PC, registers).
*   **Fine-grained Multithreading**: Single core switching between threads every cycle to hide latency (e.g., memory access).
*   **Simultaneous Multithreading (SMT)**: A more aggressive approach where instructions from different threads are mixed and executed in the same cycle (e.g., Intel Hyper-Threading).

### DLP (Data Level Parallelism)
*   **Vector Processors (SIMD)**: Load a large amount of data and execute the same instruction on all of them. Efficient for matrix operations.

---

## Parallel Algorithm Design

Designing parallel algorithms requires careful consideration of decomposition, mapping, and scheduling.

### 1. Decomposition
Breaking down the problem into smaller chunks.
*   **Domain Decomposition**: Partitioning the dataset (Data Parallelism).
*   **Functional Decomposition**: Partitioning the work into different tasks (Task Parallelism).

**Granularity Issue**:
*   **Coarse-Grained**: Large tasks, low communication overhead, but potential for load imbalance.
*   **Fine-Grained**: Small tasks, better load balance, but high communication/synchronization overhead.

### 2. Mapping & Scheduling
*   **Mapping**: Assigning tasks to processing units.
*   **Scheduling**: Deciding when tasks execute.
*   **Static**: Predetermined at compile time (low overhead).
*   **Dynamic**: Determined at runtime (better load balance, higher overhead).

### 3. Communication & Synchronization
*   **Overhead**: Communication time, synchronization waits, and contention.
*   **Methods**:
    *   **Message Passing**: Explicit communication (e.g., MPI).
    *   **Shared Memory**: Implicit communication via shared variables (e.g., OpenMP, CUDA).

---

## Amdahl's Law & Scalability

### Amdahl's Law
The theoretical speedup of the execution of a task at fixed workload is limited by the serial part of the task.

$$SpeedUp = \frac{1}{(1-f) + \frac{f}{K}}$$

*   $f$: Fraction of the code that can be parallelized.
*   $K$: Number of processors.
*   **Implication**: Even with infinite cores, speedup is limited by the sequential portion ($1-f$).

### Scalability
*   **Strong Scaling**: Fixed problem size, increasing number of processors.
*   **Weak Scaling**: Fixed problem size *per processor*, increasing number of processors (problem size grows with processors).

---

## Conclusion

To achieve high performance in modern computing, understanding the underlying hardware architecture (ILP, TLP, DLP) and designing algorithms that minimize overhead (communication, synchronization) while maximizing parallelism is crucial. Specifically for GPUs, mastering DLP and minimizing memory divergence are key.
