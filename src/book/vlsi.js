/* Weste & Harris's table of contents. `pdf` is the range in the per-chapter PDF file names,
   `pages` the printed pages (PDF page = printed page + 27), `probs` the page of that PDF file where the exercises start.
   `file` and `parts` are set once a chapter's tutorial is built. */
(window.BOOKS = window.BOOKS || {})["vlsi"] = {
  key: "vlsi", short: "CMOS VLSI", home: "vlsi.html", dir: "vlsi",
  title: "CMOS VLSI Tutorials",
  pdfFolder: "electroinc_devices_circuit_theory / cmos_vlsi",
  source: "Weste & Harris, CMOS VLSI Design: A Circuits and Systems Perspective, 4th edition",
  pdfPrefix: "CMOS VLSI Design A Circuits and Systems Perspective (4th Edition) by Neil H. E. Weste, David Money Harris (z-lib.org)-",
  sub: "How logic becomes transistors, wires and silicon, and how to make it fast, low-power and reliable. One tutorial per chapter; then the book's exercises.",
  intro: `<p>This is the chip designer's book. Every gate from Harris & Harris becomes transistors you size, wires you route, and delay, power and variation you budget.</p>
    <p>It builds on three things in this library: the <b>MOSFET</b> (Boylestad Chapter 6, 6.002 Chapters 6–7), <b>digital logic</b> (Harris & Harris 1–5) and the <b>chip-design math</b> (Math 24–39). Each chapter page says which ones it uses.</p>
    <p class="aside">The book marks some sections “Optional” or puts them on its website. The tutorials skip the web-only sections and keep optional ones short.</p>`,
  flow: [
    ["Tutorial", "Do the parts in order. About 20 minutes each, with a break after every part."],
    ["Book exercises", "Open that chapter's PDF and do the exercises at the end. They're the real test, and many are small design problems."],
    ["Check", "The PDFs have no answers. Commit to your answer, then ask Claude to check your reasoning. You'll get a guiding question first, not the answer."],
  ],
  groups: [
    {
      name: "Foundations",
      note: "The whole field in one chapter, then the transistor model and how chips are made.",
      items: [
        { n: 1, id: "vlsi1", title: "Introduction", pdf: "1-87", pages: "1-60", probs: 84, probsBook: 57, file: "01-introduction.html", parts: 11,
          blurb: "Transistors as switches, CMOS gates, layout, design partitioning, and an 8-bit MIPS processor from logic to silicon." },
        { n: 2, id: "vlsi2", title: "MOS Transistor Theory", pdf: "88-125", pages: "61-98", probs: 122, probsBook: 95, file: "02-mos-transistor.html", parts: 10,
          blurb: "Long-channel I-V, capacitances, velocity saturation, leakage, body effect, and the inverter's DC transfer curve." },
        { n: 3, id: "vlsi3", title: "CMOS Processing Technology", pdf: "126-167", pages: "99-140", probs: 166, probsBook: 139, file: "03-processing.html", parts: 10,
          blurb: "Wafers, wells, oxides, lithography, metal layers, design rules, process enhancements, manufacturing issues." },
      ]
    },
    {
      name: "Delay, power, wires and robustness",
      note: "The four things every chip designer budgets. This is the heart of the book.",
      items: [
        { n: 4, id: "vlsi4", title: "Delay", pdf: "168-207", pages: "141-180", probs: 203, probsBook: 176, file: "04-delay.html", parts: 10,
          blurb: "Transient response, the RC delay model, Elmore delay, the linear delay model, logical effort of paths." },
        { n: 5, id: "vlsi5", title: "Power", pdf: "208-237", pages: "181-210", probs: 236, probsBook: 209, file: "05-power.html", parts: 9,
          blurb: "Dynamic power, activity factor, static leakage, energy-delay trade-offs, low-power architectures." },
        { n: 6, id: "vlsi6", title: "Interconnect", pdf: "238-267", pages: "211-240", probs: 265, probsBook: 238, file: "06-interconnect.html", parts: 9,
          blurb: "Wire resistance and capacitance, wire delay, crosstalk, repeaters, logical effort with wires." },
        { n: 7, id: "vlsi7", title: "Robustness", pdf: "268-313", pages: "241-286", probs: 311, probsBook: 284, file: "07-robustness.html", parts: 9,
          blurb: "Process, voltage and temperature variation, reliability, scaling, statistical analysis, variation-tolerant design." },
      ]
    },
    {
      name: "Simulation and circuit design",
      note: "SPICE, then how real gates and flip-flops are built.",
      items: [
        { n: 8, id: "vlsi8", title: "Circuit Simulation", pdf: "314-353", pages: "287-326", probs: 351, probsBook: 324, file: "08-simulation.html", parts: 8,
          blurb: "A SPICE tutorial, device models, characterizing transistors and gates, interconnect simulation." },
        { n: 9, id: "vlsi9", title: "Combinational Circuit Design", pdf: "354-402", pages: "327-375", probs: 397, probsBook: 370, file: "09-combinational.html", parts: 11,
          blurb: "Static CMOS, ratioed, dynamic and pass-transistor circuits; circuit pitfalls; SOI and subthreshold design." },
        { n: 10, id: "vlsi10", title: "Sequential Circuit Design", pdf: "403-455", pages: "376-428", probs: 452, probsBook: 425, file: "10-sequential.html", parts: 11,
          blurb: "Sequencing methods, timing constraints, latch and flip-flop circuits, synchronizers." },
      ]
    },
    {
      name: "Subsystems",
      note: "The big blocks of a chip: arithmetic, memories, and the circuits around them.",
      items: [
        { n: 11, id: "vlsi11", title: "Datapath Subsystems", pdf: "456-523", pages: "429-496", probs: 521, probsBook: 494, file: "11-datapath.html", parts: 12,
          blurb: "Adders (ripple, carry-lookahead, prefix), comparators, counters, shifters, multipliers." },
        { n: 12, id: "vlsi12", title: "Array Subsystems", pdf: "524-575", pages: "497-548", probs: 573, probsBook: 546, file: "12-arrays.html", parts: 10,
          blurb: "SRAM cells and periphery, DRAM, ROM, CAMs, PLAs, robust memory design." },
        { n: 13, id: "vlsi13", title: "Special-Purpose Subsystems", pdf: "576-641", pages: "549-614", probs: 641, probsBook: 614, file: "13-special-purpose.html", parts: 11,
          blurb: "Packaging and cooling, power distribution, clocks, PLLs and DLLs, I/O, high-speed links." },
      ]
    },
    {
      name: "Methodology and test",
      note: "How real chips are designed in teams, and how you know they work.",
      items: [
        { n: 14, id: "vlsi14", title: "Design Methodology and Tools", pdf: "642-685", pages: "615-658", probs: 684, probsBook: 657, file: "14-methodology.html", parts: 9,
          blurb: "Structured design, design methods, design flows from RTL to GDS, design economics." },
        { n: 15, id: "vlsi15", title: "Testing, Debugging, and Verification", pdf: "686-725", pages: "659-698", probs: 724, probsBook: 697, file: "15-testing.html", parts: 9,
          blurb: "Testers, logic verification, silicon debug, manufacturing test, fault models, design for testability." },
      ]
    },
    {
      name: "Appendix",
      note: "An HDL reference by the same author as Harris & Harris Chapter 4.",
      items: [
        { n: "A", id: "vlsiA", title: "Hardware Description Languages", pdf: "726-811", pages: "699-784", probs: 803, probsBook: 776, file: "appA-hdl.html", parts: 8,
          blurb: "SystemVerilog and VHDL side by side: combinational and sequential logic, FSMs, parameterized modules, testbenches." },
      ]
    }
  ]
};
