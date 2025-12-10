export interface CVEntry {
    title: string;
    subtitle: string;
    period?: string;
    description?: string;
    details?: string[];
}

export const education: CVEntry[] = [
    {
        title: "B.S. of Computer Science, Sungkyunkwan University",
        subtitle: "Major GPA: 4.13/4.5, Total GPA: 3.86/4.5",
        description: "",
        details: [
            // "Honors: Scholarship for admission",
            // "Leadership: President of the department soccer club",
            // "Coursework: OS, Software Engineering, Computer Network, Programming Languages, Database, Algorithms, Automata, Data Structure, Open Source, System Programming, JAVA, C, C++, Computer Architecture, Patent and Start-up",
            // "Skills: Linux, Virtualization (VM/Container), C, C++, Java, SQL, Kotlin, Docker, Git, Mobile App Development (Android)"
        ]
    }
];

export const workExperience: CVEntry[] = [
    {
        title: "MeritzFire - Mobile Developer",
        subtitle: "IT Development Team @ Solution Unit",
        period: "2024 - 2025",
        description: "Sales support APP mobile development and management"
    },
    {
        title: "FADU Technologies - SSD IP Engineer",
        subtitle: "SoC Team [Offer Accepted]",
        period: "2024",
        description: "Fabless semiconductor company developing Flash SSD controllers and storage solutions"
    },
    {
        title: "Samsung Electronics - Software Intern",
        subtitle: "Solution PE Team @ Samsung Electronics DS",
        period: "2023",
        description: "Developed and optimized E-Storage performance benchmark tools for Apple devices",
        details: [
            "Built Mac OS & iOS testing frameworks utilizing C/C++ and Swift, developing filesystem test modules for both Sequential and Random Read/Write operations with advanced I/O controls (O_Sync, O_Direct, F_Nocache)",
            "Designed Aging test system to observe E-Storage Wearleveling characteristic during long-duration testing",
            "Implemented chunk-based data pattern verification that detects system testing failures and enables precise test repair from the point of interruption, significantly improving test reliability"
        ]
    },
    {
        title: "Posco International - Industry-Academic Cooperation Project",
        subtitle: "",
        period: "2020",
        description: "Developed an automatic collection system for economic/financial market information by country and item",
        details: [
            "Created a crawling program and web page to increase work efficiency for Posco-International staff",
            "Reduced crawling time from 55s to 10s by applying multiprocessing and multithreading"
        ]
    }
];

export const projectExperience: CVEntry[] = [
    // {
    //   title: "Enhanced XV6 - OS Project",
    //   subtitle: "",
    //   period: "2021",
    //   description: "A simple Unix-like operating system designed for educational purposes at MIT.",
    //   details: [
    //     "Added a Priority field to the existing Process Structure and implemented system calls for priority adjustment",
    //     "Implemented a Completely Fair Scheduler (CFS) using vruntime to ensure fair CPU allocation",
    //     "Enhanced memory mapping and memory management by implementing MMAP, Munmap, and a Page Fault handler",
    //     "Implemented page replacement using an LRU list & the Clock algorithm to manage swap-in/out when memory is low"
    //   ]
    // },
    // {
    //   title: "Maximize Open Source Program Branch Coverage using Limited Test Cases",
    //   subtitle: "Software Engineering",
    //   period: "2024",
    //   details: [
    //     "Developed 30 test cases to maximize branch coverage of the open-source C program 'find' command",
    //     "Achieved comprehensive code analysis and test case optimization using gcov tool",
    //     "Ranked 3rd among 100 students through persistent effort and dedication to maximizing performance metrics"
    //   ]
    // }
];
