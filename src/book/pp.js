/* Patt & Patel's table of contents. One PDF for the whole book, so `pdf` is the PDF page range,
   `pages` the printed pages (PDF page = printed page + 29), `probs` the PDF page where the exercises start.
   `file` and `parts` are set once a chapter's tutorial is built. */
(window.BOOKS = window.BOOKS || {})["pp"] = {
  key: "pp", short: "Patt & Patel", home: "pp.html", dir: "pp",
  title: "Computing Systems Tutorials",
  pdfFolder: "study / Digital Design",
  pdfFile: "96a2b94d4be48285f2605d843a1e6db37da9a944.pdf",
  source: "Patt & Patel, Introduction to Computing Systems: From Bits & Gates to C/C++ & Beyond, 3rd edition",
  sub: "From transistors to a whole computer you can program, one level at a time. One tutorial per chapter; then the book's exercises.",
  intro: `<p>This book climbs the levels of a computer: bits, transistors, gates, memory, a small computer called the <b>LC-3</b>, its machine language, assembly, and finally C. By the end you know what every level does and why.</p>
    <p>It pairs with <b>Harris & Harris</b>: read Patt & Patel's chapter first for the idea, then Harris & Harris for the design detail. The library's suggested order says exactly when.</p>
    <p class="aside">Chapters 11–20 teach programming in C. They're the software side: worth doing, but optional on the way to chip design.</p>`,
  flow: [
    ["Tutorial", "Do the parts in order. About 20 minutes each, with a break after every part."],
    ["Book exercises", "Open the PDF at the page the tutorial gives and do the exercises at the end of the chapter. They're the real test."],
    ["Check", "The book's answers to selected exercises are on its website (mhhe.com/patt3), not in the PDF. Commit to your answer first, or ask Claude to check your reasoning."],
  ],
  groups: [
    {
      name: "Bits and gates",
      note: "What a computer is, how it stores information as bits, and the transistors and gates that do the work.",
      items: [
        { n: 1, id: "pp1", title: "Welcome Aboard", pdf: "30-53", pages: "1-24", probs: 49, probsBook: 20, file: "01-welcome-aboard.html", parts: 7,
          blurb: "Levels of abstraction, hardware vs software, the two big ideas: universal computers and levels of transformation." },
        { n: 2, id: "pp2", title: "Bits, Data Types, and Operations", pdf: "54-87", pages: "25-58", probs: 78, probsBook: 49, file: "02-bits-data-types.html", parts: 10,
          blurb: "Unsigned and 2's complement integers, binary arithmetic, overflow, logic operations, hex, floating point, ASCII." },
        { n: 3, id: "pp3", title: "Digital Logic Structures", pdf: "88-149", pages: "59-120", probs: 124, probsBook: 95, file: "03-digital-logic-structures.html", parts: 11,
          blurb: "MOS transistors, gates, decoders, muxes, adders, latches, memory, finite state machines, a first data path." },
      ]
    },
    {
      name: "A whole computer: the LC-3",
      note: "The von Neumann model, a real (small) instruction set, and your first programs in machine language.",
      items: [
        { n: 4, id: "pp4", title: "The von Neumann Model", pdf: "150-173", pages: "121-144", probs: 168, probsBook: 139, file: "04-von-neumann.html", parts: 8,
          blurb: "Memory, processing unit, input/output, control unit; the instruction cycle; changing the flow with branches." },
        { n: 5, id: "pp5", title: "The LC-3", pdf: "174-231", pages: "145-202", probs: 206, probsBook: 177, file: "05-lc3.html", parts: 9,
          blurb: "The LC-3's ISA: operate, data movement and control instructions, addressing modes, condition codes, the data path." },
        { n: 6, id: "pp6", title: "Programming", pdf: "232-259", pages: "203-230", probs: 249, probsBook: 220, file: "06-programming.html", parts: 6,
          blurb: "Systematic decomposition into sequence, decision and loop; debugging with breakpoints and single-stepping." },
      ]
    },
    {
      name: "Assembly, data structures and I/O",
      note: "Writing real programs for the LC-3: assembly language, subroutines, stacks, input/output and interrupts.",
      items: [
        { n: 7, id: "pp7", title: "Assembly Language", pdf: "260-291", pages: "231-262", probs: 274, probsBook: 245, file: "07-assembly.html", parts: 6,
          blurb: "Opcodes and labels, pseudo-ops, the two-pass assembler, the symbol table, linking multiple files." },
        { n: 8, id: "pp8", title: "Data Structures", pdf: "292-341", pages: "263-312", probs: 333, probsBook: 304, file: "08-data-structures.html", parts: 8,
          blurb: "Subroutines and JSR/RET, the stack, recursion, queues, character strings." },
        { n: 9, id: "pp9", title: "I/O", pdf: "342-407", pages: "313-378", probs: 381, probsBook: 352, file: "09-io.html", parts: 9,
          blurb: "Privilege and priority, device registers, polling, TRAP routines, interrupts, the supervisor stack." },
        { n: 10, id: "pp10", title: "A Calculator", pdf: "408-433", pages: "379-404", probs: 431, probsBook: 402, file: "10-calculator.html", parts: 7,
          blurb: "ASCII-to-binary conversion and back, arithmetic using a stack, a complete calculator program." },
      ]
    },
    {
      name: "Programming in C",
      note: "The same machine one level up: how C is compiled down to the LC-3. Optional on the way to chip design.",
      items: [
        { n: 11, id: "pp11", title: "Introduction to C/C++", pdf: "434-453", pages: "405-424", probs: 451, probsBook: 422, file: "11-intro-c.html", parts: 7,
          blurb: "Bridging from assembly to a high-level language: compilers vs interpreters, the compilation process, a first program." },
        { n: 12, id: "pp12", title: "Variables and Operators", pdf: "454-485", pages: "425-456", probs: 482, probsBook: 453, file: "12-variables-operators.html", parts: 10,
          blurb: "Types, scope, storage; operators, precedence; how variables live in memory and on the run-time stack." },
        { n: 13, id: "pp13", title: "Control Structures", pdf: "486-519", pages: "457-490", probs: 513, probsBook: 484, file: "13-control-structures.html", parts: 8,
          blurb: "if, if-else, while, for, do-while, switch, break and continue, and the LC-3 code each becomes." },
        { n: 14, id: "pp14", title: "Functions", pdf: "520-545", pages: "491-516", probs: 540, probsBook: 511, file: "14-functions.html", parts: 6,
          blurb: "Arguments and return values, the run-time stack and activation records, caller and callee." },
        { n: 15, id: "pp15", title: "Testing and Debugging", pdf: "546-565", pages: "517-536", probs: 561, probsBook: 532, file: "15-testing-debugging.html", parts: 5,
          blurb: "Syntactic, semantic and algorithmic errors; black-box and white-box testing; debuggers; defensive programming." },
      ]
    },
    {
      name: "C in depth",
      note: "Pointers, arrays, recursion, I/O, dynamic data structures and a first look at C++.",
      items: [
        { n: 16, id: "pp16", title: "Pointers and Arrays", pdf: "566-597", pages: "537-568", probs: 592, probsBook: 563, file: "16-pointers-arrays.html", parts: 8,
          blurb: "Addresses and pointers, pass by reference, arrays, strings, the link between arrays and pointers." },
        { n: 17, id: "pp17", title: "Recursion", pdf: "598-621", pages: "569-592", probs: 616, probsBook: 587, file: "17-recursion.html", parts: 6,
          blurb: "Recursion vs iteration, Towers of Hanoi, Fibonacci, binary search, escaping a maze, and the stack under it all." },
        { n: 18, id: "pp18", title: "I/O in C", pdf: "622-635", pages: "593-606", probs: 634, probsBook: 605, file: "18-io-in-c.html", parts: 5,
          blurb: "Streams, putchar and getchar, buffering, printf and scanf, files." },
        { n: 19, id: "pp19", title: "Dynamic Data Structures in C", pdf: "636-661", pages: "607-632", probs: 658, probsBook: 629, file: "19-dynamic-data.html", parts: 6,
          blurb: "Structures, typedef, the heap, malloc and free, linked lists." },
        { n: 20, id: "pp20", title: "Introduction to C++", pdf: "662-681", pages: "633-652", probs: 679, probsBook: 650, file: "20-intro-cpp.html", parts: 6,
          blurb: "Namespaces, references, overloading, classes, constructors, vectors and templates." },
      ]
    },
    {
      name: "Appendices",
      note: "Appendix C, the LC-3's microarchitecture, is the bridge to Harris & Harris Chapter 7. The others are references.",
      items: [
        { n: "A", id: "ppA", title: "The LC-3 ISA", pdf: "682-707", pages: "653-678", file: "appA-lc3-isa.html", parts: 5,
          blurb: "Every LC-3 instruction defined precisely, plus interrupt and exception processing." },
        { n: "B", id: "ppB", title: "From LC-3 to x86", pdf: "708-727", pages: "679-698", file: "appB-lc3-to-x86.html", parts: 7,
          blurb: "How a real, much bigger ISA compares: instruction formats, memory, internal state." },
        { n: "C", id: "ppC", title: "The Microarchitecture of the LC-3", pdf: "728-749", pages: "699-720", file: "appC-lc3-microarchitecture.html", parts: 5,
          blurb: "The state machine, data path and microprogrammed control that execute every LC-3 instruction." },
        { n: "D", id: "ppD", title: "The C Programming Language", pdf: "750-781", pages: "721-752", file: "appD-c-language.html", parts: 8,
          blurb: "A C reference manual: conventions, types, operators, control, the preprocessor, the standard library." },
        { n: "E", id: "ppE", title: "Useful Tables", pdf: "782-785", pages: "753-756", file: "appE-tables.html", parts: 3,
          blurb: "Prefixes, ASCII codes, powers of 2." },
      ]
    }
  ]
};
