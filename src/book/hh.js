/* Harris & Harris's table of contents (2nd edition). `pdf` is the range in the per-chapter PDF file names,
   `pages` the printed pages (PDF page = printed page + 25), `probs` the page of that PDF file where the exercises start.
   `file` and `parts` are set once a chapter's tutorial is built. */
(window.BOOKS = window.BOOKS || {})["hh"] = {
  key: "hh", short: "Harris & Harris", home: "hh.html", dir: "hh",
  title: "Digital Design Tutorials",
  pdfFolder: "electroinc_devices_circuit_theory / digital_design",
  pdfPrefix: "Digital Design and Computer Architecture (Harris, Sarah, Harris, David) (Z-Library)-",
  source: "Harris & Harris, Digital Design and Computer Architecture, 2nd edition",
  sub: "Logic design from gates to a pipelined MIPS processor, the way it's done in industry. One tutorial per chapter; then the book's exercises.",
  intro: `<p>This book takes you from a single gate to a working processor: Boolean logic, sequential circuits, hardware description languages, arithmetic blocks, the MIPS instruction set, and three ways to build the processor that runs it.</p>
    <p>It pairs with <b>Patt & Patel</b> (the ideas, a level at a time) and leads into <b>CMOS VLSI Design</b> (how each gate becomes transistors and wires). The library's suggested order says when to read which.</p>
    <p class="aside">The book shows every HDL example in both SystemVerilog and VHDL. The tutorials use SystemVerilog, which the CMOS VLSI book and most chip companies use.</p>`,
  flow: [
    ["Tutorial", "Do the parts in order. About 20 minutes each, with a break after every part."],
    ["Book exercises", "Open the PDF at the page the tutorial gives and do the exercises. The interview questions after them are a good final test."],
    ["Check", "The PDF has no answers. Commit to your answer, then ask Claude to check your reasoning. You'll get a guiding question first, not the answer."],
  ],
  groups: [
    {
      name: "Digital logic",
      note: "Bits and gates, combinational logic, and circuits with memory.",
      items: [
        { n: 1, id: "hh1", title: "From Zero to One", pdf: "1-79", pages: "3-54", probs: 62, probsBook: 37, file: "01-zero-to-one.html", parts: 10,
          blurb: "Abstraction, number systems, logic gates, logic levels and noise margins, CMOS transistors, power." },
        { n: 2, id: "hh2", title: "Combinational Logic Design", pdf: "80-133", pages: "55-108", probs: 122, probsBook: 97, file: "02-combinational-logic.html", parts: 10,
          blurb: "Boolean equations and algebra, bubble pushing, X and Z, Karnaugh maps, muxes and decoders, timing and glitches." },
        { n: 3, id: "hh3", title: "Sequential Logic Design", pdf: "134-197", pages: "109-172", probs: 187, probsBook: 162, file: "03-sequential-logic.html", parts: 11,
          blurb: "Latches and flip-flops, synchronous design, finite state machines, setup and hold, skew, metastability, parallelism." },
      ]
    },
    {
      name: "Describing and building hardware",
      note: "Writing hardware as code, then the standard blocks every chip is built from.",
      items: [
        { n: 4, id: "hh4", title: "Hardware Description Languages", pdf: "198-263", pages: "173-238", probs: 251, probsBook: 226, file: "04-hdl.html", parts: 10,
          blurb: "SystemVerilog modules, operators, structural models, registers, case and if, blocking vs nonblocking, FSMs, testbenches." },
        { n: 5, id: "hh5", title: "Digital Building Blocks", pdf: "264-319", pages: "239-294", probs: 307, probsBook: 282, file: "05-building-blocks.html", parts: 9,
          blurb: "Adders, subtractors, comparators, ALUs, shifters, multipliers, fixed and floating point, counters, memories, FPGAs." },
      ]
    },
    {
      name: "Computer architecture",
      note: "The MIPS instruction set, the processors that run it, and the memory system that feeds them.",
      items: [
        { n: 6, id: "hh6", title: "Architecture", pdf: "320-395", pages: "295-370", probs: 382, probsBook: 357, file: "06-architecture.html", parts: 11,
          blurb: "MIPS assembly and machine language, programming, addressing modes, compiling, assembling and loading, a look at x86." },
        { n: 7, id: "hh7", title: "Microarchitecture", pdf: "396-499", pages: "371-474", probs: 492, probsBook: 467, file: "07-microarchitecture.html", parts: 13,
          blurb: "Performance, single-cycle, multicycle and pipelined MIPS processors, hazards, exceptions, advanced techniques." },
        { n: 8, id: "hh8", title: "Memory and I/O Systems", pdf: "500-607", pages: "475-582", probs: 595, probsBook: 570, file: "08-memory-systems.html", parts: 13,
          blurb: "Locality, caches, virtual memory, memory-mapped I/O, embedded I/O on a real microcontroller, PC I/O." },
      ]
    },
    {
      name: "Appendices",
      note: "Appendix A shows how designs become real hardware. B is a reference table; C is a C primer (Patt & Patel teaches C in more depth).",
      items: [
        { n: "A", id: "hhA", title: "Digital System Implementation", pdf: "608-699", pages: "583-618", file: "appA-implementation.html", parts: 13,
          blurb: "74xx logic, FPGAs, ASICs, data sheets, logic families, packaging, transmission lines, economics." },
        { n: "B", id: "hhB", title: "MIPS Instructions", pdf: "608-699", pages: "619-622", file: "appB-mips-instructions.html", parts: 3,
          blurb: "Opcode and funct tables for every MIPS instruction in the book." },
        { n: "C", id: "hhC", title: "C Programming", pdf: "608-699", pages: "623-674", file: "appC-c-programming.html", parts: 9,
          blurb: "C for hardware people: variables, operators, functions, control flow, pointers, structures, libraries." },
      ]
    }
  ]
};
