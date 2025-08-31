---
title: 'HPC - Parallel Computing Basics'
description: 'GPU Architecture를 살펴보기 전에 "Parallel Architecture"가 무엇인지'
date: 2024-05-10
technologies: ['Astro', 'TypeScript', 'Obsidian']
repoLink: 'https://github.com/example/life-archive'
---

GPU Architecture를 살펴보기 전에 "**Parallel Architecture**"가 무엇인지, 이러한 구조를 "**Parallel**"로 실행하기 위해서는 프로그램을 작성하는 것이 무엇인지를 살펴보려고 한다.
-> It will help us to realize why we need gpu architecture
-> 우리가 진짜 Parallel을 하기 위해서는 어떻게 software를 작성해야 하는지에 대해서 배우려고 한다.

# ​​​Types of Parallellism

어떤 걸 병렬처리 한다는 건 -> 여러개의 리소스를 사용해서
TV를 보는 것과 숙제를 하는 같이 하는 건 -> context switch  
크게 보면 Fine-grained Instruction Parallelism과 Higher abstarction level 이 존재한다

- ILP(Low Level) - Single Cycle에 more than one instruction
  대부분 하드웨어에 의해서 다루어진다. -> 하드웨어가 can be executed in parallel을 찾아서 병렬로 실행 (단위는 **Instruction Window**를 기반으로)
  ex) **Superscalar** - Can issue multiple instruction at a time
  -> 한꺼번에 Issue가 될 수 있는 Instruction을 찾아서 위치시킨다. (여기에는 Dependency가 존재하지 X)
  -> 이 과정에서 우리는 어떻게 Parallelism이 진행되는지 알 필요가 없다.
  -> Compiler가 Instruction을 재구성할 수도 있지만 대개 이건 하드웨어가 처리를 한다.

  **"개발자 관점" : Code에서 아무걱정을 하지 않아도 된다.**

  ***

- TLP(High Level)
  Thread는 하드웨어에 존재하지 않는다. == 하드웨어는 Only Instruction만 이해한다.
  Thread 개념 자체를 사용한다는 건 Software기반의 작업이라는 것이다.
  -> Parallelism은 explictly 하게 프로그램을 여러 조각으로 나눠야한다.
  **"개발자 관점"** : Explict하게 우리가 무엇을 해야하는지 표현해줘야 한다.
  ***
- DLP(High Level)
  GPU에서 DLP형태의 Parallelism을 제공해서 관심을 가져야 한다.
  DLP는 본질적으로 TLP 형태의 일부분이다.
  -> Constrained TLP구조이고 모든 스레드가 다른 데이터를 가지고 같은 행동을 하는 것이다. **"개발자 관점"** : Vector Instruction(load all the values)
  ***

# Flynn's Taxonomy

SISD - Oridinaty CPU (ILP)
MISD - X (not real world)
SIMD - DLP (Single Instruction poll, Single Thread)
MIMD - TLP(각 CPU는 다른 데이터를 가지고 다른 작업을 한다.) (e.g., multiple CPUs, Cluster level parallelism)

# How to Extract Parallelism in Hardware

> 하드웨어에서 병렬성을 어떻게 이끌어내고 활용할 수 있을까?

---

## ILP

Superscalar - **multiple instructions** issued at **a single cycle** from **a single thread**
아직 multiple thread라는 개념이 아직 X
ILP는 오직 Instruction Window(이걸 넘어갈 수 없음)에만 의존한다.
-> 만약이 Window 사이즈 만큼 병렬처리를 못하고 있다는 건 어떤 functional units이 놀고 있다는 것입니다.

---

## TLP

- Chip Multi Processors(CMP) - **Multi-Core**(Have own seperate issue, PC, register)
  **`Each Thread - Each Core`**
- **FIne-grained Multithreading - Single-Core**( **`Multiple Threads - Each Core`**)
  Issue instruction from different threads at different cycle
  -> 만약 FIne-grained가 없으면 오직 1개의 Thread의 instruction밖에 issue하지 못한다.
  -> 이 방식이 없으면 단일 스레드의 명령어만 issue할 수 있는데, 그 스레드가 **메모리 접근이나 I/O 같은 장기 지연(latency)을 유발하는 연산을 수행**하면, 해당 스레드가 stall되는 동안 **CPU는 아무 일도 하지 못하고 idle 상태**가 됩니다.
  > [!info] OS Thread Context Switch랑은 뭐가 다른건가?
  > ![[Pasted image 20250508151436.png]]
- Simultaneous MultiThreading(SMT) - **Single-Core**
  more aggresive version of a fine-grain multithreading
  Cycle 조각으로 여러 Thread를 병렬화하는 것이 아니라 Same Cycle에 Mix&Match
  multi-core라는 개념이 나오기 전부터 적용이 되었고 대부분에 CPU는 SMT를 지원한다. **`Multiple Threads - Each Core`**

---

## DLP

- Vector Processor(SIMD)
  Register, Memory range - Load amount of data from memory, execute everything at the same register
  single instuction - multiple pieces of data
  **`Each Thread - Each Core - Multiple Data`**

---

# Microprocessor Architecture Trends

#### **🔹 Single Threaded**

- **CISC Machines**
  Single Instruction많은 것들을 하고 그래서 Complex Instruction이라고 하는 거다.
- **RISC Machines(microcode)**
  여기서는 instruction의 양을 줄였고 **Simple Instruction**
  One Thing at a time
- **RISC Machines(pipelined)**
  Same Instruction이지만 우리는 이걸 여러 조각으로 쪼개서 여러 단계로 표현
  Fetch Decode Excute Load
  Up to this point it's all single threaded

#### **🔹 ILP**

- **RISC Machines(pipelined)**
- SuperScalar Processor

#### **🔹 Programs that have to be parallel**

- **Using a single core by multiple threads**
  - **Multithreaded Processor(Fine-Grained MultiThreading)**
    hardware has set of hardware resources to differentiate between different threads (PC, Register, stack pointer)
    한 사이클에서는 오직 한개의 스레드만 동작하긴 한다.(여러개의 스레드는 context switch)
    --> 이건 GPU가 DLP을 하는 과정에서 이 방식을 사용하기 때문에 나중에 참고할 것
  - **SMT**
    Each Cycle, Any Context max execute
- Using a single core by Single or multiple threads
  - VLIW(Very Long Instruction word)
    Move the responsiblity to Compiler
    Compiler가 코드를 분석하고 의존성을 확인해서 여러개의 병렬 묵음을 생성
    하드웨어가 체하지 않는다.
    ILP의 다른 형태이. AMD ARM의 Early
- Using a multiple cores by multiple threads
  CMPs
  -> CMP나 SMT 둘다 Each Core에서 여러개의 스레드가 (Chip level tlp)

#### **🔹 Vector computers**

#### **🔹 GPU**

# Parallelism vs. Concurrency

병렬성은 the pair of resources
sorting problem - divide & conquer (parallelism)

Concurrency 여러개의 job을 at the same time
스레드끼리의 컨텍스트 스위치
유저입장에서는 그렇게 보인다 같이 작동하는 것처럼
각 스레드가 각 CPU를 가진 것처럼

# Where the hardware actually provide the parallelism

프로그래머는 동시성을 인식해서 알려주는 것이다. (알고리즘 레벨에서)
여러 연산, 컴퓨터는 병렬화 하는데
여기서 알고리즘 변화가 필요할거다. -> 동시성을 최대화할 수 있게 소프트웨어 레벨에서

## Problems

1. 의존성()
2. 80명이 이 일을 나누면 비효율적 이 과정에서 매니징 할 때
   가끔 오래 걸릴 수도 있다.
3. 일을 잘 나누는 게 좋다.

# Parallel Algorithm Design

병렬 프로그램을 사용할 때 어떤 것들을 생각해야 하는지에 대해서 다룬다.

1. 병렬로 처리할 수 있는 연산이 뭐가 있는지 찾는다.
2. 이 일을 어떻게 파티션 할지(Data)
3. 그리 Manage

여기서 이게 얼마나 커야하는지, 그리고 언제 이 크기가 적당한지를 결정할 것인지
**타이밍, granality Issue**

그리고 나서 싱크로나이즈

어떻게 맵핑하는지에 따라서 차이가 많이 난다.
모든 과정이 병렬의 질을 나누는 데 사용된다.

# Task Decomposition

어떤 해결해야 하는 문제를 "chunks"의 작업 단위로 나누는 작업입니다.
기능 또는 연산 단위를 기준으로 나누는 걸 얘기하고 이거를 나중에 데이터 Decomposition으로 나누는 작업이다.

> [!info] **Main Idea**
> Create at least enough tasks to keep execution units on a machine busy

Thread의 개수가 많고 Thread 하나가 해야하는 일은 너무 작다.
쓰레드를 만드는 과정, 수행하는 과정, 끝내는 과정 모두 Management Overhead가 든다.
(Thread라이브러리를 써서 관리할 수도 있고, OS에서 관리할 수도 있다)
-> 쓰레드가 한 번 생성되면 일정 수준의 양을 하게 할 수도 있다. (4 rows per thread)
-> **Problem of task granularity**

만약에 2 Row, Half of Col -> **Syncronize**

# Options of Decomposition

## How to Decomposition

- Domain Decomposition(DLP) - Partitioning
  데이터셋을 작은 조각들로 나누는 경우
- Funtional Decomposition
  Work를 Different Types of work로 나누는 경우
  E.g., pipeline parallel algorithms

## When to Decomposition

- Static Decomposition
  Task와 데이터를 알고 있으면 도움이 된다.

- Dynamic Decomposition
  Sparse Matrix를 생각해보면 어떤 건 연산할 게 많고 어떤 건 적은 경우가 생길 수 있다.
  -> Load Imbalance 해결 가능
  하지만 그 과정에서 트랙킹해야하는 게 많기 떄문에 overhead 존재 가능

## How large/small are tasks?

- Coarse-Grained Tasks
  Computation > Communication
  Low overhead in communication
  왜? -> 청크를 크게 나누면 전체적으로 끝나는 시간이 스레드별로 **imbalance**
- Fine-Grained Tasks
  Computation < Communication
  Load Balance
  **Parallel execution overheads = communication/synchronization + idling + excess work**

## Summary

우리가 Decomposition에서 선택할 수 있는 옵션은 총 3가지가 존재한다.

1. 어떻게 나눌 것인지
   - Task Decomposition
   - Data Decomposition
2. 언제 나눌 것인지
   - Static Decomposition
   - Dynamic Decomposition -> overhead, but load balance
3. 얼마나 크게 나눌 것인지
   - Coarse
   - Fine
     Fine일수록 Load Inbalance는 가능하지만 Communication/Sync overhead가 존재
     ![[Pasted image 20250508171301.png]]

# Mapping and Scheduling

Mapping은 하드웨어(Processing Unit)에 Works(tasks)를 할당하고 - **Mapping**
Sceduling은 언제 그 work가 실행되어야 하는지를 명시하는 것 - Scheduling

> [!info] Total Overhead in Parallel Execution
> $Parallel\;Execution\;OverHead = Communication/Sync + Idling + Excess Work$
> $$T_0(Total Overhead) = p * T_p - T_s$$

## When to Mapping and Scheduling

- Static Mapping and Scheduling
  Task의 사이즈 불변하고 Task가 정적으로 생성되면 사용 가능
  Overhead는 줄일 수 있다.
  ![[Pasted image 20250508172128.png]]
- Dynamic mapping and scheduling
  Require tasks queue, task/data migration
  Higher Overhead, Reduce Load Imbalance
  ![[Pasted image 20250508172208.png]]

## Ways to minimize overheads

1. Map independent tasks to different processing units - **Maximize parallelism**
   -> 만약 dependent한 task를 넣으면 synchronize해야하는 오버헤드 존재(lock ... )
2. Assign tasks on critical path to processing units as soon as they become available - **Minimize load imbalance**
   -> **“가장 중요한 경로(critical path)“의 작업들은 가능한 빨리 실행되도록 유닛이 비자마자 배정하라**
3. Minimize communication by mapping process unit with dense interactions to the same processing units - **Minimize overheads**

이 방식으로 사용하려고 하면 서로 충돌이 날 수도 있다.
충분한 독립적인 작업을 찾을 수 없을 수도 있고 Critical Path를 줄이려고 하면 다른 Processing Unit에 넣어야 하기 때문에 의존성이 생길 수밖에 없다.

# Communication and Synchronization

병렬 Task 사이에서 데이터를 공유하는 것

### Communcation OverHead

- Prepare, Receive Shared Data
- Synchronization result in tasks waiting
- Contention from competing communicatio

### Data Sharing Method

- Message Passing Model(**Explicit**)
- Shared Memory Model(**Implicit**)
  Transparent to the programmer

### Types of Communication

- Collective(Multiple Entities)
  - Broadcast (one-to-all, all-to-all)
  - Multicast(To subset of threads)
  - Reduction (all-to-one)
  - Scatter and gather(not computing)
- Point-to-point(Give point to only one thread)
  - Lock
  - Producer-Consumer

### **Barrier Synchronization Primitives**

Dependency를 표현하는 보수적(conservative)인 방법
**Computation 단계를 Phase로 쪼개는 방법**

### **Coarse-grained Example**

Barrier, Centralized Barrier - 변수를 두고 얼마나 많은 스레드가 barrier에 도달했는지 센다.
-> sense, counter라는 변수를 가진다.
-> 마지막 스레드가 sense를 뒤집고, **global하게 broadcast**해줍니다.
다양한 phase들의 단계로 나뉜다.

아래 예시에서는 공유를 하는 1개의 Read-Only 변수가 존재하고 열단위 스레드 작업이 종료가 되고 이제 Row단위의 작업이 시작되는데 정보들이 P1,P2,P3에서 전달 되어야 한다.  
-> 근데 여기서 Barrier에서는 모든 프로세서가 멈춰야 하니 의존성을 강하게 제한할 수 있다.

![[Pasted image 20250507161435.png]]

### **Fine-Grained Example**

![[Pasted image 20250507161924.png]]

### 왜(언제) distributed Sync가 Centralized Sync보다 대체로 좋을까?

Core수가 적당히 많으면 Distributed Sync가 더 낫다

# Performance Model

## Basic Measures of Parallelism

$$Total Overhead; \quad T_0\;=pT_p\;-\;T_s$$
$$SpeedUp; \quad S_p\;=T_s\;/\;T_p$$
$$Efficiency; \quad E\;=S_p\;/\;p$$
만약에 $T_s$가 100초였고 코어가 5개일 때 $T_p$가 25초가 나왔다고 하자
$overhead$는 25초이고 $SpeedUp$은 4배가 나오고 $Efficiency$는 0.8이 나온다.
$Efficiency$가 1에 가깝게 나오면 나올수록 좋은 상황인 것이다.

## Amdahl's Law

$f$는 병렬화 가능한 작업의 비율을 얘기하고 $k$는 속도향상지수를 의미한다.
$T\quad = (1-f)T\;+fT$
$T_k\quad = (1-f)T\;+\frac{f}{K}T$
이 두 식을 기반으로 SpeedUp을 계산해본다면 아래와 같은 식이 나오게 된다.
$$SpeedUp\quad=\frac{T}{T_k}\quad=\frac{1}{(1-f)\;+\frac{f}{K}}$$

1. Large $f$ Case
   병렬처리 가능한 부분이 많은 상황을 얘기한다.
   애초에 $f$ 의 비율이 적다면 성능 향상이 많이 진행되지 않을 것이다.
   -> 코어가 무한대라고 해봤자 병렬처리 비율을 따라가게 되는 것이다.
   Task-Parallel computation은 고전 병렬처리 코어수가 적어야지 좋다.
2. Large $K$ Case
   코어수나 한꺼번에 처리할 수 있는 데이터 많은 경우를 생각하면 된다.
   - Data-Parallel Computation(K가 잘 확장 가능)
   - Task-Parallel Computation(작업의 수가 고정되어 있기 때문에 K가 잘 확장 X)

### Scalability

- Strong Scaling - 문제의 크기가 고정일 때 코어수에 따라서 얼마나 변하는지
- Weak Scaling - $Problem/p$는 고정 코어수가 확장됨에 다라 문제의 크기도 증가
  What would affect the scalability of an algorithm
  -> 코어가 많냐 적냐에 따라서 다르게 생각해야 한다.

# Designing Parallel Algorithm

Identify hotspots
-> 가장 많이 시간이 드는 연산 구간을 찾는다 by profile in sequential program
Identify bottleneck
-> 기대했는데 잘 안 되는 부분이 있다면 거기가 bottleneck

# Computation

Try to decrease the ciritical path
-> reduce the sequential bottleneck
-> minimize loading balance
-> reduce data dependence

# Synchronization and Load Imbalance

1. Use Distributed Version instead of centralized version
2. Lock Free
3. Avoid coarse-grained task decomposition
4. higher priority to ciritical works

# Communication

non-deterministic
