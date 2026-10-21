(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const { sv, bitButtons, truthTable } = Digital;
  const seenV = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const fig = (s) => `<div class="fig">${s}</div>`;
  const mono = (s) => `<span class="mono">${s}</span>`;

  /* ---------- widgets ---------- */
  function ncoWidget(host) {
    let inc = 1311, fclk = 100;
    const out = el(`<div></div>`);
    const draw = () => {
      const N = 16, M = 2 ** N, pts = [];
      let ph = 0;
      for (let k = 0; k <= 64; k++) { const top = Math.floor(ph / 2 ** (N - 8)); pts.push([k, Math.round(127 * Math.sin((2 * Math.PI * top) / 256))]); ph = (ph + inc) % M; }
      const stepPts = []; pts.forEach(([k, v], i) => { stepPts.push([k, v]); if (i + 1 < pts.length) stepPts.push([k + 1, v]); });
      const fout = (inc / M) * fclk;
      out.innerHTML = fig(plot({ x: [0, 64], y: [-140, 140], xt: [0, 16, 32, 48, 64], yt: [-128, 0, 127], xl: "clock cycles", yl: "sine ROM output", h: 220, series: [{ pts: stepPts, cls: "s1" }], label: "NCO output samples" })) +
        readout([["Phase accumulator", "16 bits: wraps every 2¹⁶ = 65536"], ["f<sub>out</sub> = increment × f<sub>clk</sub> / 2¹⁶", fmt(fout, 3) + " MHz"], ["Samples per period", fmt(M / inc, 3)]]);
    };
    host.append(slider({ id: "v14i", label: "Phase increment", min: 1, max: 16384, step: 1, value: inc, show: (x) => String(Math.round(x)) }, (x) => { inc = Math.round(x); draw(); }).el, out); draw();
  }
  function firWidget(host) {
    const sets = { "Moving average (5 taps)": [1, 1, 1, 1, 1].map((x) => x / 5), "Triangle (5 taps)": [1, 2, 3, 2, 1].map((x) => x / 9), "Single tap (no filtering)": [1] };
    const names = Object.keys(sets);
    let k = 0;
    const out = el(`<div></div>`);
    const draw = () => {
      const h = sets[names[k]];
      let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff - 0.5);
      const x = Array.from({ length: 60 }, (_, n) => (n >= 20 ? 1 : 0) + 0.35 * rnd());
      const y = x.map((_, n) => h.reduce((s, hk, kk) => s + hk * (n - kk >= 0 ? x[n - kk] : 0), 0));
      out.innerHTML = fig(plot({ x: [0, 59], y: [-0.6, 1.6], xt: [0, 20, 40, 59], yt: [0, 1], xl: "sample n", h: 220, series: [{ pts: x.map((v, n) => [n, v]), cls: "s3" }, { pts: y.map((v, n) => [n, v]), cls: "s1" }], label: "FIR filter smoothing a noisy step" })) +
        `<p class="mono">h = [${h.map((v) => v.toFixed(2)).join(", ")}] → Y[n] = Σ X[n − k]·h[k]: ${h.length} registers, ${h.length} multipliers, one adder tree</p>`;
    };
    host.append(toggle(names, (i) => { k = i; draw(); }, 0), out); draw();
  }
  function lutWidget(host) {
    const funcs = { "A·B·C·D": ([a, b, c, d]) => a & b & c & d, "NOT A": ([a]) => 1 - a, "SUM(A, B, C)": ([a, b, c]) => a ^ b ^ c, "A OR D": ([a, , , d]) => a | d };
    const names = Object.keys(funcs);
    let k = 0;
    const out = el(`<div></div>`);
    const draw = () => {
      const f = funcs[names[k]], bitsArr = [];
      for (let adr = 0; adr < 16; adr++) { const a = adr & 1, b = (adr >> 1) & 1, c = (adr >> 2) & 1, d = (adr >> 3) & 1; bitsArr.push(f([a, b, c, d])); }
      out.innerHTML = `<p>The 16 RAM bits (address 0 → 15, with A = bit 0 … D = bit 3):</p><p class="mono" style="font-size:1.2em;letter-spacing:.2em">${bitsArr.join("")}</p><p class="aside">Change the function and only the RAM contents change: the same hardware becomes a different gate.</p>`;
    };
    host.append(toggle(names, (i) => { k = i; draw(); }, 0), out); draw();
  }
  function yieldWidget(host) {
    let D = 0.4;
    const out = el(`<div></div>`);
    const draw = () => {
      out.innerHTML = fig(plot({ x: [0, 6], y: [0, 1], xt: [0, 1, 2, 3, 4, 5, 6], yt: [0, 0.25, 0.5, 0.75, 1], xl: "die area A (cm²)", yl: "yield", h: 230, series: [{ f: (A) => Math.exp(-A * D), cls: "s1" }], marks: [{ x: 1, y: Math.exp(-D), label: "1 cm²: " + (100 * Math.exp(-D)).toFixed(0) + "%" }], label: "Poisson yield versus die area" })) +
        readout([["Y = e<sup>−AD</sup> at 1 cm²", (100 * Math.exp(-D)).toFixed(1) + "%"], ["Largest die with 10% yield", (Math.log(10) / D).toFixed(2) + " cm²"]]);
    };
    host.append(slider({ id: "v14d", label: "Defect density D", min: 0.05, max: 2, step: 0.05, value: D, show: (x) => x.toFixed(2) + " /cm²" }, (x) => { D = x; draw(); }).el, out); draw();
  }
  function iterWidget(host) {
    let n = 100;
    const out = el(`<div></div>`);
    const draw = () => {
      const fast = (n * 2) / 8, slow = n * 5; // 2-hour loop in 8-hour days; 1 week = 5 working days
      out.innerHTML = readout([["Integrated team (2 hours per iteration)", fmt(fast, 3) + " working days ≈ " + fmt(fast / 5, 2) + " weeks"], ["Split front end / back end (1 week per iteration)", fmt(slow, 3) + " working days ≈ " + fmt(slow / 250, 2) + " years"]]);
    };
    host.append(slider({ id: "v14n", label: "Logic ↔ layout iterations", min: 1, max: 200, step: 1, value: n, show: (x) => String(Math.round(x)) }, (x) => { n = Math.round(x); draw(); }).el, out); draw();
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Domains, levels, and what a design system must do", mins: 15,
    blurb: "Behavior, structure, physical; architecture down to circuits. Design is a chain of transformations, each one checked.",
    takeaway: "Three domains: behavioral (what the system should do), structural (interconnection of components), physical (arrangement and geometry). Design flows from behavior to structure to physical via manual or automated transformations, each checked by comparing before and after (e.g., a power goal in the behavioral spec checked on the structural design with physical feedback). Each domain has options (wireless standard; logic family and clocking; chips, boards, enclosures) and levels of abstraction: architectural/functional, RTL, logic, circuit (block-diagram level for analog/RF). Gajski-Kuhn Y chart: three radial axes (behavioral: algorithms, programs, statements; structural: processors, ALUs, gates, transistors; physical: boards, chips, modules, cells, rectangles), concentric circles for abstraction levels. Good design systems give consistent descriptions in all domains and levels. Parameters: performance (speed, power, function, flexibility), die size (cost), time to design (engineering cost, schedule), ease of verification and test. Constraints enable automation; abstractions collapse detail. The choice of method should be economic: pick suitable methods, estimate chip cost, take the quickest route. Structured design reduces effort and raises the chance of success.",
    steps: [
      { k: "learn", title: "Three domains", b: [
        `<div class="tbl"><table><tbody><tr><td><b>Behavioral</b></td><td>what it should do (e.g., a low-power sensor radio)</td></tr><tr><td><b>Structural</b></td><td>which components, connected how (sensor, transceiver, processor, memory, battery)</td></tr><tr><td><b>Physical</b></td><td>how they're laid out: enclosure, boards, chips, cells, rectangles</td></tr></tbody></table></div>`,
        `<p>Design moves behavior → structure → physical through a series of transformations. <b>After each one, check it against the one before.</b></p>`,
        seenV("The Y chart and design abstractions.", "01-introduction.html", "Chapter 1"),
      ]},
      { k: "learn", title: "Levels of abstraction", b: [
        `<p>Within each domain: architecture → register-transfer level (RTL) → logic → circuit. The <b>Gajski-Kuhn Y chart</b> draws the three domains as spokes and the levels as rings: an algorithm, a processor and a chip are all at the outer ring; a statement, a transistor and a rectangle at the inner one.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which domain is each description in?", bins: ["Behavioral", "Structural", "Physical"], items: [
          ["A Verilog always block computing the next state", 0, "It says what happens, not how it's built."],
          ["A gate-level netlist", 1, "Components and connections."],
          ["A floorplan of the chip", 2, "Positions and shapes."],
          ["A standard-cell layout in GDS", 2, "Geometry."],
        ]},
      ]},
      { k: "learn", title: "What we're trading", b: [
        `<ul><li><b>Performance:</b> speed, power, function, flexibility</li><li><b>Die size</b> (cost)</li><li><b>Time to design</b> (engineering cost and schedule)</li><li><b>Ease of verification and test</b></li></ul>`,
        `<p>Two tools tame complexity: <b>constraints</b> (fixed-height cells, one clocking style) let tools automate; <b>abstractions</b> hide detail. And the choice of method should be <i>economic</i>: the cheapest, quickest route that meets the targets.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a good design flow check each transformation against the previous description?", model: "Each step from behavior to structure to layout, by person or tool, can introduce errors. Comparing the new description with the previous one, for example simulating both, formally checking logic equivalence, or comparing layout with schematic, catches mistakes where they were made, while they're still cheap to fix and before they reach silicon." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "A software radio, and hierarchy", mins: 20,
    blurb: "The chapter's running example: IQ modulation, mixing up and down, and deciding what runs in software and what gets dedicated hardware.",
    takeaway: "Software radio: transmit and receive any frequency and format; practical versions have bounds. Transmit path (IQ modulator): data → in-phase I(t) and quadrature Q(t); I × sin(ω_osc t) + Q × cos(ω_osc t) → DAC → intermediate frequency (IF); analog mixer with a local oscillator (LO) gives LO ± IF, filter picks one (20 MHz IF with 2.4 GHz LO → 2.42 or 2.38 GHz: upconversion). IQ constellations: AM (magnitude varies; e.g., 800 kHz carrier, 300 Hz–6 kHz audio), phase/FM (constant amplitude; 100 MHz carrier, 200 Hz–20 kHz), QPSK (2 bits on 4 phase points; 2.4 GHz ISM band, 10 Mb/s). Receive: mix RF with LO, low-pass to recover IF, ADC, digital mix with IF oscillator, digital LPF → I and Q → demodulator. Key operations: multiplication, sine generation, filtering (plus FFT, correlation, coding). Hierarchy (“divide and conquer”): split into modules until each is comprehensible or available prebuilt (library code); parallel hierarchy in behavioral, structural, physical domains with equivalence checks level by level; virtual components (IP). Example 14.1: whole radio on one microprocessor (instruction decode, PC, ALU [adder, Boolean unit, shifter], register file, memory). Example 14.2: per sample ≈ 2 multiplies (16 cycles each iterative), add, 2 table lookups (2 cycles), loop add ≈ 40 cycles → 40 ns at 1 GHz → Nyquist allows ≈ 12.5 MHz IF; better: dedicated IQ upconverter (NCO, multipliers, LPF) producing a value every cycle → up to ~500 MHz; the processor only handles the modulation data rate.",
    steps: [
      { k: "learn", title: "IQ modulation", b: [
        `<p>Any modulated carrier can be built from two amplitudes, <b>I</b> (in-phase) and <b>Q</b> (quadrature):</p>`,
        `<p class="eq">I(t)·sin(ωt) + Q(t)·cos(ωt)</p>`,
        `<div class="tbl"><table><tbody><tr><td>AM</td><td>only the length of the (I, Q) vector changes</td></tr><tr><td>Phase / FM</td><td>constant length, the angle moves</td></tr><tr><td>QPSK</td><td>four points: 2 bits per symbol</td></tr></tbody></table></div>`,
        `<p>Generate at a moderate <b>intermediate frequency</b> (IF), then an analog <b>mixer</b> multiplies by a local oscillator (LO) to make LO + IF and LO − IF.</p>`,
        `<p class="aside">Sines, phase and frequency: <a href="../math/10-sinusoids.html">Math 10 →</a></p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 30 MHz IF is mixed with a 5.8 GHz LO. What is the upper output frequency, in GHz?", a: 5.83, tol: 0.001, why: "LO + IF = 5.83 GHz (and LO − IF = 5.77 GHz; a filter keeps one)." },
      ]},
      { k: "learn", title: "Hierarchy", b: [
        `<p>Divide and conquer until each piece is understandable or already exists. Keep a <b>parallel hierarchy</b> in all three domains (HDL model, gate netlist, layout) and check them against each other level by level.</p>`,
        `<p>Example 14.1: put the whole radio in software on one processor: decode, PC, ALU (adder, Boolean unit, shifter), register file, memory. A few levels of hierarchy reach simple parts.</p>`,
      ]},
      { k: "learn", title: "Example 14.2: is software fast enough?", b: [
        `<p>Per output sample: two 16-bit iterative multiplies (16 cycles each), an add, two table lookups (2 cycles each), a loop-counter add: about <b>40 cycles</b>. At 1 GHz that's one sample per 40 ns: 25 Msamples/s, so by Nyquist an IF of at most <b>12.5 MHz</b>, before doing any modulation.</p>`,
        `<p>Move the fixed IQ upconversion (an oscillator, multipliers, filter) into <b>dedicated hardware</b> producing a sample every cycle: 1 GS/s, IF up to ~500 MHz. The processor now only supplies I and Q at the data rate.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Same software loop, but the processor runs at 2 GHz and multiplies take only 4 cycles each. Cycles per sample ≈ 4 + 4 + 1 + 2 + 2 + 1 = 14. Maximum IF in MHz (Nyquist)?", a: 71.4, tol: 0.02, why: "14 cycles / 2 GHz = 7 ns per sample → 143 MS/s → IF ≤ 71 MHz." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why move the IQ upconversion into dedicated hardware but keep the modulation in software?", model: "The upconversion has to produce a new sample every clock at a high rate and its structure is fixed: an oscillator, multipliers and a filter. Dedicated hardware does it every cycle at far lower energy than a processor taking tens of cycles per sample. Modulation formats differ between standards and change over time, and only need to run at the much lower data rate, so keeping them in software keeps the radio flexible and updatable." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Regularity, modularity, locality", mins: 20,
    blurb: "Reuse a few building blocks, give every module a clean interface, and keep communication local in space and time.",
    takeaway: "Regularity: divide into similar building blocks at every level (uniform transistors; fixed-height variable-length cell library; parameterized RAMs/ROMs; identical processors); eases verification and reuse. Example 14.3: NCO = registered phase accumulator incremented by a phase increment (+ phase offset for phase modulation) addressing a sine ROM (phase-to-amplitude); FIR filter Y[n] = Σ X[n − k]h[k] (EQ 14.1): registers, multipliers, adder; more taps → sharper cutoff, less ripple, more hardware. Common parts: registers, adders, multipliers → reuse the same full adder and flip-flop; NCO phase adder 16–32 bits, increment 8–16, FIR widths 1–12 bits. Example 14.4: keep programmability with a multiprocessor (4 processors) plus fixed IQ conversion; add a one-cycle multiplier to each processor (up to M× faster than iterative for M-bit), profiling-driven custom instructions (Tensilica), at the cost of area and power. Modularity: well-defined function and interface (behavioral, structural, physical: name, signal type, electrical and timing constraints; reasonable load and drive; inputs drive gates, not diffusion; position, layer, width; port classes input/output/bidirectional/power/ground, analog/digital); aids checking and SoC integration of IP. Locality: information hiding (no global variables); temporal locality: reference all signals to a clock (setup/hold on inputs, clock-to-output delays). Example 14.5: analog ADC/DAC near pads (short low-R power buses, isolated analog routing, guard rings, deep n-well); second floorplan with processors around a central bus: shorter, faster, lower-power bus. Table 14.1 software/hardware parallels.",
    steps: [
      { k: "learn", title: "Regularity", b: [
        `<p>Hierarchy alone can still produce hundreds of <i>different</i> modules. Regularity means using a few <b>similar building blocks</b> many times: one flip-flop, one full adder, one cell height, identical processors. Fewer things to design, verify and reuse.</p>`,
      ]},
      { k: "play", title: "The numerically controlled oscillator", b: [
        `<p>A register adds a <b>phase increment</b> every clock; its top bits address a sine ROM. A bigger increment steps through the table faster: higher frequency. Predict what doubling the increment does.</p>`,
        ncoWidget,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 32-bit phase accumulator clocked at 1 GHz. What increment gives a 10 MHz output? (to the nearest million)", a: 42.95, tol: 0.01, why: "inc = f_out × 2³² / f_clk = 0.01 × 4.295×10⁹ ≈ 42.95 million." },
      ]},
      { k: "play", title: "The FIR filter", b: [
        `<p class="eq">Y[n] = Σ<sub>k</sub> X[n − k]·h[k]</p>`,
        firWidget,
        `<p>Registers, multipliers and adders, again. So the radio can reuse one full-adder cell and one flip-flop everywhere.</p>`,
        `<p class="aside">Sampling and discrete-time signals: <a href="../math/32-sampling.html">Math 32 →</a></p>`,
      ]},
      { k: "learn", title: "Example 14.4: programmable and fast", b: [
        `<p>Keep the fixed IQ conversion in hardware and do the variable modulation on <b>four identical processors</b>. Need a bit more speed? Give each processor a one-cycle multiplier (up to M× faster than an M-cycle iterative multiply). Profile the code, find the bottleneck, add an instruction for it (Tensilica's approach), at some cost in area and power.</p>`,
      ]},
      { k: "learn", title: "Modularity and locality", b: [
        `<p><b>Modularity:</b> each block has a clear function and a fully specified interface: names, signal types, timing (setup, hold, delay), reasonable loads and drive, inputs into gates (not diffusion), pin positions and layers.</p>`,
        `<p><b>Locality:</b> hide internals (no “global variables”); reference every signal to a clock; and in the floorplan put things that talk a lot next to each other. Example 14.5: put the ADC and DAC by the pads, and arrange the four processors around a short central bus rather than along a long one.</p>`,
        seenV("Hierarchy, regularity, modularity and locality in Chapter 1.", "01-introduction.html", "Chapter 1"),
      ]},
      { k: "check", title: "Match the principle", b: [
        { t: "sort", q: "Which structured-design principle is each?", bins: ["Hierarchy", "Regularity", "Modularity", "Locality"], items: [
          ["All multipliers and adders use the same full-adder cell", 1, "Same building block everywhere."],
          ["Every block's inputs are registered with a documented setup time", 2, "A well-defined interface (and temporal locality)."],
          ["The radio is split into processor, IQ converter, ADC, DAC", 0, "Divide and conquer."],
          ["Blocks that communicate heavily are placed next to each other", 3, "Physical locality."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do regularity and modularity each reduce design effort?", model: "Regularity means designing a few building blocks well and using them many times, so there are fewer distinct parts to design, characterize and verify, and they can be reused. Modularity means each block has a well-defined function and interface, including timing and loading, so blocks can be designed and verified independently and connected without unexpected interactions." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Design methods I: processors and programmable logic", mins: 20,
    blurb: "Before designing a chip, ask whether you need one. Microcontrollers, PLDs and FPGAs.",
    takeaway: "Design methods in order of increasing investment; it's futile to design a custom chip if an off-the-shelf part meets the need at the same or lower cost. Microprocessor/DSP: single-chip microcontrollers (PIC) with RAM, nonvolatile memory, ADCs; DSPs (Analog Devices, TI); field-upgradable software; don't underestimate software cost; plan for integration: pick a processor available as an embedded core (ARM, MIPS, PowerPC) to keep the software. Programmable logic: programmable arrays, interconnect, or both; useful for assessing solutions and for making any chip reprogrammable. PLDs descend from PLAs (AND and OR planes); each crosspoint programmable by floating-gate transistor, fuse or RAM-controlled transistor; limited routing; predictable timing; PAL16 legacy. FPGAs: array of logic cells in programmable routing; one-time programmable (fuse/antifuse; Actel: antifuse at routing intersections, high resistance until a programming voltage drops it to a few ohms: tiny, fast, permanent) or SRAM/flash configured. CLBs use lookup tables: a 16 × 1 RAM computes any 4-input function (Table 14.2: A·B·C·D, ¬A, SUM(A, B, C)); a full adder in two CLBs; optional output register; routing switches (antifuses, transmission gates, or tristate buffers) between horizontal and vertical tracks; configurable I/O. Modern FPGAs: millions of gates, megabits of RAM, >10 GHz I/O, embedded processors and DSP blocks; best choice for many low-to-medium-volume applications.",
    steps: [
      { k: "learn", title: "Do you need a chip at all?", b: [
        `<p>Methods are ordered by <b>investment</b>. Start with the cheapest that works: a microcontroller (e.g. a PIC with built-in memory and ADCs) or a DSP. Software can be patched in the field, but don't underestimate its cost.</p>`,
        `<p>If you might integrate later, pick a processor that also exists as an <b>embedded core</b> (ARM, MIPS, PowerPC) so your software survives.</p>`,
      ]},
      { k: "learn", title: "Programmable logic devices", b: [
        `<p>PLDs grew from PLAs: an AND plane and an OR plane where every crosspoint can be switched in or out by a floating-gate transistor, a fuse, or a RAM bit. Little routing, but very predictable timing.</p>`,
        seenV("PLAs.", "12-arrays.html", "Chapter 12"),
      ]},
      { k: "learn", title: "FPGAs", b: [
        `<p>An array of <b>configurable logic blocks</b> (CLBs) in a sea of routing tracks, with programmable switches where tracks meet, and configurable I/O around the edge.</p>`,
        `<div class="two"><div class="tile"><h3>Antifuse (one-time)</h3><p>An open circuit until a programming voltage turns it into a few ohms. Tiny and fast, but permanent.</p></div><div class="tile"><h3>SRAM / flash</h3><p>Configuration stored in memory: reprogrammable, even after shipping.</p></div></div>`,
      ]},
      { k: "play", title: "A lookup table is a gate", b: [
        `<p>A 16 × 1 RAM addressed by four inputs can be <i>any</i> 4-input function: just store its truth table. Predict the 16 bits for ¬A before clicking.</p>`,
        lutWidget,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "How many different functions can a 4-input lookup table implement?", a: 65536, tol: 0.001, why: "Every pattern of 16 bits is a different function: 2¹⁶ = 65,536." },
      ]},
      { k: "learn", title: "FPGAs today", b: [
        `<p>Millions of gates, megabits of RAM, I/O beyond 10 GHz, embedded processors and DSP blocks. Low up-front cost and easy bug fixes make them the best choice for many low- to medium-volume products.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does an SRAM-based FPGA implement logic and connections?", model: "Logic is implemented in configurable logic blocks whose lookup tables are small RAMs: loading a function's truth table into a 16-bit RAM makes it compute any 4-input function, with an optional register on the output. Connections are made by programmable switches, controlled by configuration memory, where routing tracks meet. All of it is set by loading a configuration bitstream, so the chip can be reprogrammed." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Design methods II: gate arrays, cells, custom, platforms", mins: 20,
    blurb: "Personalize only the metal, place standard cells, push polygons, or assemble IP. And the gap between ASIC and custom.",
    takeaway: "Gate arrays / sea of gates (SOG): a common base of transistor rows personalized by metal and via masks to lower NRE; once popular for semicustom ASICs; still useful as reprogrammable areas for metal-only fixes during debug, and regular structures resemble restrictive design rules. SOG: continuous n and p rows, gates isolated by grounding nMOS or tying pMOS gates to V_DD (Figure 14.17c: NAND3). Cell-based: standard cell library, place and route; smaller, faster, lower power than FPGAs but high NRE (masks): high volume or high price. Libraries: SSI gates, memories (generated with data sheets), system modules, mixed-signal/RF; MSI (adders, multipliers) now synthesized from SSI. Table 14.3: inverters/buffers 1×–64×, NAND/NOR 2–8 inputs, XOR, AOI/OAI 21/22, muxes, adders, latches, flops (set/reset, scan), I/O pads; high/normal/low power (low-power: minimum-width transistors, save power on noncritical paths). Cell layout: fixed height (n and p widths, n–p spacing, rail spacing and widths), horizontal pitch = poly-to-metal2 contacted pitch; easily generated by software; optional clock in the rails or multiple supplies. Full custom: polygon pushing, symbolic layout with compaction (portable); now for highest-volume datapaths, analog/RF, cell libraries, memories, I/O; generators (silicon compilers) produce all views (behavioral, timing, logic, circuit, layout), e.g., custom placement of standard cells for a datapath. Gap: custom CPUs > 2 GHz vs synthesized ASICs ~200–350 MHz (Chinnery02: microarchitecture, sequencing overhead, circuit families, logic design, cell design, layout, margining); power: synthesized 3–7× custom, closable to 2.6×. Platform-based / SoC: IP blocks (RISC cores, memories, I/O) on common buses with C software; partition hardware/software (hardware-software codesign), extensible processors (Tensilica Xtensa); full circle to the processor. Table 14.4: rank NRE, unit cost, power, complexity, time to market, performance, flexibility. Use off-the-shelf if possible, FPGA for low volumes (100,000s), standard cells for medium/high volume, cell-based or custom for mixed-signal/RF/high speed; masks so costly that prototypes use multiproject chips. 2006: 3000–5000 custom designers, 50,000–100,000 ASIC designers; more FPGA and microcontroller designers; CAD vendors (Synopsys, Cadence, Mentor, Magma) target ASICs.",
    steps: [
      { k: "learn", title: "Gate arrays and sea of gates", b: [
        `<p>Fabricate a generic base of transistor rows in advance; a customer's design changes only the <b>metal and via masks</b>. Cheaper masks, quicker turnaround. A gate is isolated from its neighbour by turning off the transistors between them (nMOS gate to GND, pMOS gate to V<sub>DD</sub>).</p>`,
        `<p>Today: a small sea-of-gates area on a custom chip allows <b>metal-only bug fixes</b> late in the project.</p>`,
      ]},
      { k: "learn", title: "Standard cells", b: [
        `<p>A library of fixed-height cells (V<sub>DD</sub> along the top, GND along the bottom) placed in rows and routed automatically. Libraries offer gates in many drive strengths (1× to 64×), high/normal/low-power versions, flip-flops with reset and scan, memory generators and I/O pads.</p>`,
        `<p>Cell height = nMOS + pMOS widths + spacings + rails; cell width comes in steps of the contacted poly-to-metal2 pitch. Simple enough for software to generate.</p>`,
      ]},
      { k: "learn", title: "Full custom", b: [
        `<p>Draw every rectangle (“polygon pushing”), or place symbolic transistors and wires and let a compactor apply the rules (portable between processes). Today only for the highest-volume datapaths, analog/RF, cell libraries, memories and I/O, often via <b>generators</b> that produce every view of a block automatically.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Custom microprocessors exceed 2 GHz while synthesized ASICs run ~200–350 MHz in similar processes. Which reasons does the book list?", opts: [["Microarchitecture, sequencing overhead, circuit families, logic and cell design, layout, and margining", true, "Chinnery's study. Power differs too: synthesized designs use 3–7× more."], ["Only the transistors are different", false, "Same process."], ["ASICs use slower clocks by law", false, "No such rule."]] },
      ]},
      { k: "learn", title: "Platforms and systems on chip", b: [
        `<p>Assemble predesigned IP (processor cores, memories, I/O) on standard buses and program them in C. The work becomes partitioning between hardware and software, designing the application-specific blocks, and getting it all placed, routed and verified. We've come full circle to “use a processor”, which is why the processor choice matters from day one.</p>`,
      ]},
      { k: "learn", title: "Choosing", b: [
        `<p>Off-the-shelf if it meets the specs (NRE amortized over millions). FPGAs for low volumes (hundreds of thousands). Standard cells when power and unit cost matter at medium-to-high volume. Cell-based or custom for mixed-signal, RF and very high speed. Masks are now so expensive that even industrial prototypes share <b>multiproject</b> mask sets.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "When is an FPGA a better choice than a standard-cell ASIC, and when is it worse?", model: "An FPGA has almost no up-front cost and can be reprogrammed to fix bugs, so it wins at low to medium volumes and when time to market or flexibility matters. A standard-cell ASIC needs an expensive mask set and design flow, but each chip is smaller, faster and lower-power, so at high volumes, or when power and performance are critical, the lower unit cost and better efficiency repay the non-recurring cost." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "The RTL-to-gates flow", mins: 25,
    blurb: "Specify, write RTL, simulate, synthesize, prove equivalence, check timing, insert test, estimate power, and keep the loop short.",
    takeaway: "Design flow: procedures from specification to implementation without errors. Front end (behavioral/RTL) and back end (structural and physical synthesis). ASIC model: hand HDL to a third party (“throw it over the wall”); risky for demanding designs because prelayout timing estimates correlate poorly with postlayout wires; iteration time matters: 100 iterations at 2 hours (integrated) ≈ 5 weeks vs 1 week each (split) ≈ 2 years. RTL flow (Figure 14.20): specification → RTL in Verilog/VHDL with test benches, simulated hierarchically bottom-up (NC-Verilog, VCS, ModelSim, ActiveHDL); NCO example in behavioral Verilog (phase accumulator, quarter-wave sine ROM with address mirroring and sign inversion). RTL synthesis: generic gates and registers, optimization, technology mapping to a cell library; FSM decomposition, datapath and power optimization (Design Compiler, RTL Compiler, Synplify); output a mapped netlist (BUFX4, MX2X1, DFFHQX1…). Verification: rerun test benches on the netlist, or formal equivalence checking (Formality, Conformal) that mathematically proves the same Boolean functions (simulation only as good as its vectors); semantic and structural lint checks. Static timing analysis: fast and exhaustive over all paths (vs incomplete, slow timing simulation); library delays plus estimated or floorplan-based loads; checks max-delay (setup) and min-delay (hold); false paths and multicycle paths must be flagged; reports sorted by slack (negative = must fix) (ETS, PrimeTime). Test insertion: scan registers + ATPG, or BIST (DFT Max, Tetramax, LogicVision). Power analysis: activity from simulation vectors × switched capacitance; if too high, rethink the architecture (PrimePower, PowerMill). Synthesis also retargets designs between technologies (FPGA prototype, then ASIC).",
    steps: [
      { k: "learn", title: "Front end and back end", b: [
        `<p>Behavior (RTL) → <b>logic synthesis</b> → gates → <b>physical synthesis</b> → layout, with a check after each step. Traditionally an ASIC company writes the RTL and hands it over the wall to a vendor who does the back end.</p>`,
        `<p>The catch: before layout, wire lengths are guesses, so timing must iterate between logic and layout. The <b>iteration time</b> decides the schedule.</p>`,
      ]},
      { k: "play", title: "Why the loop must be short", b: [
        iterWidget,
      ]},
      { k: "learn", title: "Write and simulate the RTL", b: [
        `<p>From a specification, write synthesizable RTL (Verilog, SystemVerilog or VHDL) plus <b>test benches</b>. Verify bottom-up: each module, then their combinations. For example, the NCO's phase accumulator is just</p>`,
        sv(`always_ff @(posedge fclock)
  if (reset) phase <= initial_phase;
  else       phase <= phase + phase_increment;`),
        seenV("SystemVerilog and test benches.", "../hh/04-hdl.html", "Harris & Harris Ch 4"),
      ]},
      { k: "learn", title: "Synthesize, then prove it", b: [
        `<p><b>Synthesis</b> turns RTL into generic logic, optimizes it, and maps it onto library cells (BUFX4, MX2X1, DFFHQX1, …).</p>`,
        `<p>Did it do it right? Either rerun the test benches on the netlist, or use <b>formal equivalence checking</b>, which mathematically proves both describe the same Boolean functions. Simulation is only as good as its vectors; a proof covers everything.</p>`,
      ]},
      { k: "learn", title: "Static timing analysis", b: [
        `<p>Exhaustively checks every register-to-register path for <b>setup</b> (max-delay) and <b>hold</b> (min-delay), using library delays and estimated wire loads. Reports list paths by <b>slack</b>: negative slack must be fixed.</p>`,
        `<p>It can't know intent: a reset line that has many cycles to settle shows up as a failing path until you declare it a <b>false path</b> or <b>multicycle path</b>.</p>`,
        seenV("Setup and hold constraints.", "10-sequential.html", "Chapter 10"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A path's data arrives 1.83 ns after the clock edge; the capture flop needs it by 2.00 ns − 0.06 ns setup. Slack in ps?", a: 110, tol: 0.01, why: "Required 1.94 ns − arrival 1.83 ns = +0.11 ns = 110 ps (positive: it meets timing)." },
      ]},
      { k: "learn", title: "Test and power", b: [
        `<p><b>Test insertion</b> converts registers to scan registers (with automatic test pattern generation) or adds built-in self-test (Chapter 15). <b>Power analysis</b> estimates switched capacitance from simulation activity; if it's too high, go back to the architecture.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does formal equivalence checking give you that re-simulating the test benches doesn't?", model: "Simulation only checks the specific input sequences in the test benches, so a difference between RTL and netlist on untested inputs can slip through. A formal equivalence checker proves mathematically that the two descriptions compute the same Boolean functions for all inputs, so the transformation is verified completely, independent of test-vector quality." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Physical design, and the custom flow", mins: 20,
    blurb: "Place, floorplan, route, extract, re-time, check noise and IR; timing-driven placement. Then schematic, LVS, back-annotation and DRC for custom blocks.",
    takeaway: "Layout generation / physical synthesis: structural → physical. Inputs: netlist (Verilog/DEF), cell library (LEF: dimensions, ports, obstructions). Placement: constant-height variable-width cells in rows (no channels needed with many metal layers; rows flow around RAM and custom blocks); minimize wire length, or weighted by timing; save as DEF. Floorplanning: cluster communicating modules manually before placement. Routing: global (abstract channels with a cost function; move wires out of congested channels) then detailed (actual geometry; gridless routers handle variable pitch and foreign cells; route over cells; redundant vias and wider spacing for manufacturability); technology file of layers and pitches. Parasitic extraction (2D cross-sections, 2.5D lookup tables, 3D field solving; statistical 3D such as QuickCap) → SPEF/RSPF/ESPF. Rerun static timing with real loads: usually the bottleneck; iterate synthesis and P&R; transistor-level fast SPICE (Nanosim, UltraSim) where possible, especially for dynamic logic. Noise (crosstalk), IR drop and electromigration analyses. Timing-driven placement avoids endless place-route-extract loops (fixes undoing earlier fixes): critical-path cells placed to minimize wire delay; often one pass. Clock-tree routing before logic placement. Power re-estimated with extracted capacitance. Mixed-signal/custom flow (Figure 14.25): schematic/netlist → electrical rule check (unconnected ports) → SPICE (DC, AC, transient, noise, RF) → floorplan → custom layout (very time-consuming: 100 mask designers × 2 years for a large CPU; automate noncritical parts) → circuit extraction → layout versus schematic (graph isomorphism, then device parameters) → parasitic extraction (inductors by macro substitution) → back-annotate and resimulate (critical) → DRC (performance first) → reliability: power bus widths (electromigration, IR), substrate/well contacts, guard rings, substrate noise (SubstrateStorm); hierarchical; limited by simulation capacity.",
    steps: [
      { k: "learn", title: "Place and route", b: [
        `<ol><li><b>Floorplan:</b> cluster modules that talk to each other (often by hand).</li><li><b>Place:</b> standard cells in rows, flowing around RAMs and custom blocks, minimizing wire length (weighted by timing).</li><li><b>Clock tree:</b> route it early, to control skew.</li><li><b>Route:</b> global routing assigns nets to regions; detailed routing draws the wires (redundant vias and extra spacing where there's room).</li><li><b>Extract</b> R and C (2D, 2.5D or full 3D field solving).</li><li><b>Re-time</b> with real loads, then check crosstalk noise, IR drop, electromigration and power.</li></ol>`,
        seenV("Wire R, C and coupling.", "06-interconnect.html", "Chapter 6"),
      ]},
      { k: "learn", title: "Timing-driven placement", b: [
        `<p>Place → route → extract → time → find a violation → constrain → repeat… and each fix can undo an earlier one; some designs never converged. <b>Timing-driven placement</b> considers timing while placing, giving critical-path cells short wires, and often gets there in one pass.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why is post-route static timing “usually the bottleneck” of the flow?", opts: [["Only now are the real wire loads known, so timing estimates made before layout are revealed as wrong and synthesis/P&R must iterate", true, "Pre-layout wire lengths are guesses."], ["Timing tools are slow to install", false, "Not the issue."], ["Routing deletes timing constraints", false, "No."]] },
      ]},
      { k: "learn", title: "The custom / mixed-signal flow", b: [
        `<ol><li>Draw a <b>schematic</b>; electrical rule check (unconnected pins).</li><li><b>SPICE</b>: DC, AC, transient, noise.</li><li>Floorplan and draw the <b>layout</b> (slow: a big CPU could keep 100 mask designers busy for two years).</li><li>Extract a netlist and run <b>LVS</b> (layout versus schematic): match connectivity as graphs, then device sizes.</li><li>Extract parasitics, <b>back-annotate</b>, and resimulate. The book stresses this step.</li><li><b>DRC</b>, then reliability: power-bus widths, contacts, guard rings, substrate noise.</li></ol>`,
        seenV("Layout, DRC and extraction rules.", "03-processing.html", "Chapter 3"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which check catches it?", bins: ["ERC", "LVS", "DRC", "Back-annotated simulation"], items: [
          ["A transistor's gate was left unconnected in the schematic", 0, "Electrical rule check."],
          ["The layout has a transistor 2 µm wide where the schematic says 4 µm", 1, "LVS compares device parameters too."],
          ["Two metal1 wires are closer than the minimum spacing", 2, "Design rule check."],
          ["The circuit works in the schematic but is too slow once wire capacitance is added", 3, "Only resimulation with extracted parasitics shows it."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In a custom flow, why simulate again after extracting parasitics from the layout?", model: "The schematic simulation ignores the wire capacitance and resistance and the extra diffusion that the real layout adds. Extracting those parasitics and annotating them back onto the netlist shows how the circuit as drawn will actually behave. Discovering that it's too slow or noisy is cheap now and catastrophic after fabrication." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Design economics", mins: 25,
    blurb: "NRE, masks, dies per wafer, yield and margin: what a chip costs, and how many you must sell.",
    takeaway: "Selling price S_total = C_total/(1 − m) (EQ 14.2), m = profit margin (covering overhead and cost of sales). Costs: NRE, recurring, fixed. NRE F_total = E_total (engineering) + P_total (prototype) (EQ 14.3), amortized over volume or treated as an investment with a required return (e.g., $10M NRE → $100M revenue for 10×). Engineering: personnel (architecture, logic capture, simulation, layout, timing, DRC/tapeout, test generation) and support (computers, CAD, education); reuse and IP cut costs. Per engineer per year (US, ~2010): salary $50–100K, overhead $10–30K, computer $10K, digital front-end CAD $10K, analog CAD $100K, digital back-end CAD $1M (shared). Prototype: masks (exponentially rising; ~$5M full set at 45 nm), test fixtures ($1K–50K probe cards), package tooling (use standard packages); multiproject reticles (e.g., 20 projects share 200 sites; MOSIS; ~$1000/mm² at 0.6 µm; IP-protection worries). Example 14.6: 7 digital ($840K), 3 analog ($720K), 5 support ($350K), one 45 nm run with back-end tools $6M → $7.91M/year, two years ≈ $16M → need a ~$100M market; real 45 nm chips cost $20–50M; MPW won't prove yield across variation; maybe use a mature process. Recurring: in-house fabs need ~$10B/year sales at 45 nm; fabless companies use foundries (TSMC, UMC, IBM); R_total = R_process + R_package + R_test (EQ 14.4); R_process = W/(N·Y_w·Y_pa) (EQ 14.5): wafer $500–5000, die yield 70–90+%, package yield 95–99%; gross dies N = π[r²/A − 2r/√(2A)] (EQ 14.6). Example 14.7: $2000/(400 × 0.7) = $7.14; 60% margin → $17.86, profit $10.72; 5× ROI on $16M → $80M → ~7.4M chips. Poisson yield Y_w = e^(−AD) (EQ 14.7): small dice ~linear cost in area, large dice exponential; defect densities are secret and have fallen steadily (Figure 14.27 uses the Murphy model). Example 14.8: D = 0.4/cm²: 1 cm² → 67%; 10% yield → 5.75 cm². Fixed costs: data sheets, application notes, support (ASIC designer = walking data sheet), failure/yield analysis; document every chip, even academic test chips.",
    steps: [
      { k: "learn", title: "Three kinds of cost", b: [
        `<div class="tbl"><table><tbody><tr><td><b>NRE</b> (once)</td><td>engineering + prototypes (masks, probe cards, package tooling)</td></tr><tr><td><b>Recurring</b> (per chip)</td><td>wafer processing, packaging, testing</td></tr><tr><td><b>Fixed</b> (ongoing)</td><td>data sheets, application notes, customer support, yield analysis</td></tr></tbody></table></div>`,
        `<p class="eq">Price = cost / (1 − margin)</p>`,
      ]},
      { k: "learn", title: "Example 14.6: a startup's prototype", b: [
        `<div class="tbl"><table><tbody><tr><td>7 digital designers × ($70K + $30K + $10K + $10K)</td><td>$840K</td></tr><tr><td>3 analog designers × ($100K + $30K + $10K + $100K)</td><td>$720K</td></tr><tr><td>5 support staff × ($40K + $20K + $10K)</td><td>$350K</td></tr><tr><td>One 45 nm fab run + back-end tools</td><td>$6M</td></tr><tr><td><b>Per year</b></td><td><b>$7.91M</b></td></tr></tbody></table></div>`,
        `<p>Two years: ~$16M. Investors will want a ~$100M market. A full 45 nm mask set alone is ~$5M, which is why prototypes share <b>multiproject</b> wafers, and why a mature process can be the smarter choice.</p>`,
      ]},
      { k: "learn", title: "What one chip costs to make", b: [
        `<p class="eq">R<sub>process</sub> = W / (N · Y<sub>w</sub> · Y<sub>pa</sub>) &nbsp;&nbsp; N = π [ r²/A − 2r/√(2A) ]</p>`,
        `<p>W = wafer cost, N = whole dies per wafer (the second term subtracts partial dies at the round edge), Y<sub>w</sub> = die yield, Y<sub>pa</sub> = packaging yield.</p>`,
        `<p>Example 14.7: $2000 wafer, 400 dies, 70% yield → <b>$7.14</b> per die. A 60% margin → price $17.86, profit $10.72 each. A 5× return on $16M needs $80M profit → <b>about 7.4 million chips</b>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 300 mm wafer (r = 150 mm) and a 100 mm² die. Gross dies per wafer from EQ 14.6?", a: 640, tol: 0.01, why: "π(22500/100 − 300/√200) = π(225 − 21.2) ≈ 640." },
      ]},
      { k: "play", title: "Yield falls exponentially with area", b: [
        `<p class="eq">Y<sub>w</sub> = e<sup>−AD</sup></p>`,
        `<p>D = defects per cm². Predict: at D = 0.4, what fraction of 2 cm² dies work?</p>`,
        yieldWidget,
        `<p>Small dies: cost grows about linearly with area. Large dies: exponentially, because most of them catch a defect. Falling defect densities over the decades are what made today's huge chips affordable.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Wafer $3000, 600 gross dies, die yield 80%, package yield 95%. R_process in dollars?", a: 6.58, tol: 0.01, why: "3000 / (600 × 0.8 × 0.95) = 3000 / 456 ≈ $6.58." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the cost of a large die rise much faster than its area?", model: "A bigger die means fewer dies per wafer, which alone raises the cost roughly in proportion to area. But defects land randomly, and a larger die is more likely to contain one: with Poisson statistics the yield falls as e^(−AD). So the number of good dies falls exponentially and the cost per good die rises exponentially once the area times the defect density is large." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Schedules, people, reuse, documentation", mins: 20,
    blurb: "Fixed fab times, the edit-compile-debug loop, Brooks's law, hard/firm/soft IP, and writing the data sheet before the chip exists.",
    takeaway: "Estimate cost and schedule up front to choose a strategy; engineering usually dominates; extra engineering can shrink the die (lower R_process), but it's usually best to reach the market first, then shrink. Productivity: high-productivity methods, better technique, partitioning. Adding people to a late project makes it later (Brooks). Example 14.9 Gantt chart: spec 4 weeks, digital design 12 weeks (double for moderate complexity), P&R, fabrication 8 weeks and packaging (fixed ~10 weeks total), lab test, possible respin: about a year for a very simple chip. Tasks: architecture, HDL capture, verification, P&R, timing/signal integrity/reliability, DRC and tapeout (ERC, LVS, masks), test generation. Best predictor is the team's past performance; effort grows faster than linearly with the number of modules; reuse helps. Edit-compile-debug loop (HDL change → synthesized, placed, routed, timed): more than a day hurts; ideally a few hours. New average chips 18–24 months; respins ≤ 6 months; FPGA turnaround minutes; new microprocessors 3–5 years, usually with slips. Project management: resources, communication, risk reporting; rapid prototyping (startup: fixed time, get a working skeleton then add detail; risky) vs preplanned (large companies/military; feature-driven, stable, predictable when tasks are familiar). Design reuse/migration: once symbolic layout and mask resizing; now build or buy a new cell library and retarget the HDL (rerun timing and regressions). Virtual components / IP: hard (mask-level, fixed size and timing), firm (gate netlist, portable by netlist translation), soft (RTL; implementation by tools); Virtual Socket Interface Alliance; buying IP is negotiation; check quality and test bench; ~$100K for a USB controller with stack; cores ~1% royalty; reputable IP usually cheaper than redesign. Data sheets (even for internal ASICs, delivered before fabrication): summary (name, description, features, block diagram), pinout (name, type, function, pin number), operation, DC specs (absolute maximum supply, pin voltages, junction temperature; I/O style; V_IL/V_IH, V_OL/V_OH at current, input loading, quiescent, leakage, power-down currents), AC specs (setup/hold, clock-to-output, pulse widths, with timing diagrams; e.g., don't assume infinitely fast external memory), package diagram, principles-of-operation manual, user manual. Pitfalls: inadequate design flow (nanometer rules need industrial DRC and extraction), insufficient verification (82% of functional respins from lack of verification, 47% wrong specs, 14% bad IP), inaccurate parasitic extraction (sanity-check against hand calculations and silicon).",
    steps: [
      { k: "learn", title: "Schedules", b: [
        `<p>Some times are fixed: fabrication and packaging take about 10 weeks regardless. Design, debug and test stretch with complexity. A very simple chip takes about a year end to end; an average new chip 18–24 months; a new microprocessor 3–5 years, usually with slips.</p>`,
        `<p>Get to market first and shrink the die later: optimizing without market feedback risks having no market at all.</p>`,
        `<p class="key"><b>Brooks's law:</b> adding people to a late project makes it later.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "What does the book name as the best predictor of a team's design schedule?", opts: [["The team's own past performance", true, "Formulas exist, but history is more reliable."], ["The number of transistors", false, "Complexity matters, but it isn't the best predictor."], ["The size of the CAD budget", false, "Not a predictor of schedule."]] },
      ]},
      { k: "learn", title: "Keep the loop short", b: [
        `<p>The <b>edit-compile-debug loop</b>: change the HDL, then synthesize, place, route and time it. If it takes more than a day, productivity collapses; a few hours lets you fix several bugs a day. (FPGAs turn around in minutes, which is why FPGA prototyping is so valuable for ASIC verification.)</p>`,
      ]},
      { k: "learn", title: "Reuse and IP", b: [
        `<div class="tbl"><table><tbody><tr><td><b>Hard IP</b></td><td>mask-level layout: fixed size and known timing, but tied to one process</td></tr><tr><td><b>Firm IP</b></td><td>a gate netlist: portable by translating cells; timing depends on placement</td></tr><tr><td><b>Soft IP</b></td><td>RTL: most portable; implementation and timing left to the tools</td></tr></tbody></table></div>`,
        `<p>Buying IP is a negotiation (the book: more like haggling for a used car than buying cereal). Judge its quality and its test bench: a faulty block sinks your chip. If a reputable block exists, buying is usually cheaper than redesigning.</p>`,
      ]},
      { k: "learn", title: "Write the data sheet first", b: [
        `<p>Give the customer (even an internal one) the data sheet <b>before</b> fabrication: summary and block diagram, pinout, operation, <b>DC specs</b> (absolute maximum ratings; V<sub>IL</sub>, V<sub>IH</sub>, V<sub>OL</sub>, V<sub>OH</sub>; currents), <b>AC specs</b> (setup, hold, clock-to-output, with timing diagrams), and the package. Then a principles-of-operation manual and a user manual.</p>`,
        `<p class="aside">The book's warning: designs get snagged when chip designers assume infinitely fast external memories.</p>`,
      ]},
      { k: "check", title: "Pitfalls", b: [
        { t: "num", q: "In Synopsys's survey of chip respins with functional flaws, what percentage were due to lack of verification?", a: 82, tol: 0.001, why: "82% from insufficient verification; 47% had incorrect specifications; 14% had bad imported IP (a respin can have several causes)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why should a chip's data sheet be written and shared before the chip is fabricated?", model: "The data sheet is the interface between the chip and the system around it: voltages, timing, pins and behavior. Sharing it early lets board designers and other teams check that the chip will work in their system, and catch mismatched assumptions such as unrealistic timing for external memory, while the design can still be changed cheaply." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "vlsi14", eyebrow: "CMOS VLSI · Chapter 14", title: "Design Methodology and Tools",
    intro: `<p>Nine parts on how chips actually get designed: domains and abstractions, the structured-design principles applied to a software radio, the menu of design methods from microcontrollers to full custom, the RTL-to-GDS and custom flows, and the economics and management of a chip project.</p><p>Less circuit theory, more judgment. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises. Several ask you to choose a design approach or estimate cost: write down the assumptions you're making (volume, process, yield) before calculating, and say which one your answer is most sensitive to.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9],
    summary: `
      <h3>Principles</h3>
      <p>Behavioral, structural, physical domains; architecture/RTL/logic/circuit levels (Y chart); check every transformation. Hierarchy, regularity, modularity, locality.</p>
      <h3>Methods</h3>
      <p>Processor/DSP → PLD → FPGA (LUTs, antifuse or SRAM) → gate array/SOG → standard cells → full custom → platform SoC. Choose the cheapest that meets the spec; custom vs ASIC gap ~10× in speed, 3–7× in power.</p>
      <h3>Flows</h3>
      <p>RTL + test benches → synthesis → equivalence checking → static timing (slack, false/multicycle paths) → test insertion → power. Floorplan, place, clock tree, route, extract, re-time, noise/IR/EM; timing-driven placement. Custom: schematic, ERC, SPICE, layout, LVS, back-annotation, DRC.</p>
      <h3>Economics</h3>
      <p>Price = cost/(1 − m). NRE vs recurring; R = W/(N·Y<sub>w</sub>·Y<sub>pa</sub>), N = π[r²/A − 2r/√(2A)], Y = e<sup>−AD</sup>. Schedules 18–24 months; short edit-compile-debug loops; hard/firm/soft IP; data sheets before silicon; verify, verify.</p>`,
  };
  Course.start(window.CHAPTER);
})();
