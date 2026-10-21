(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const { sv, bits, uval, truthTable, wave, bitButtons } = Digital;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const c = (t) => `<code>${t}</code>`;

  const SILLY = `
module sillyfunction(input  logic a, b, c,
                     output logic y);
  assign y = ~a & ~b & ~c |
              a & ~b & ~c |
              a & ~b &  c;
endmodule`;
  const silly = (a, b, c) => ((1 - a) & (1 - b) & (1 - c)) | (a & (1 - b) & (1 - c)) | (a & (1 - b) & c);

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Describing hardware in text", mins: 20,
    blurb: "Modules, behavioral vs structural, and the two jobs of an HDL: simulation and synthesis.",
    takeaway: "Since the 1990s designers describe hardware in a hardware description language (HDL) and let CAD tools produce optimized gates. The two leading HDLs are SystemVerilog and VHDL (the book shows both; these tutorials use SystemVerilog). A module is a block of hardware with inputs and outputs. Behavioral models describe what a module does; structural models describe how it's built from simpler modules (hierarchy). SystemVerilog: module name(input logic …, output logic …); assign y = …; endmodule. logic is the signal type (0, 1, and also z and x). Verilog came from Gateway Design Automation (1984), became IEEE standard in 1995, and was extended into SystemVerilog (IEEE 1800-2009, files .sv). VHDL came from the US Department of Defense (1981, IEEE 1987, files .vhd). Simulation applies inputs and checks outputs before anything is built (finding bugs after fabrication is enormously expensive: Intel's FDIV bug cost $475 million). Synthesis turns the HDL into a netlist of gates and wires, optimizing as it goes. Only a subset of the language synthesizes; the rest is for testbenches. Biggest beginner mistake: treating HDL as a program. Think of blocks of combinational logic, registers and FSMs; sketch them first, then write the idioms for each.",
    steps: [
      { k: "learn", title: "Why HDLs", b: [
        `<p>Drawing gates by hand and simplifying truth tables is slow and error-prone. Since the 1990s, designers <b>describe</b> what the hardware should do in a <b>hardware description language</b> (HDL) and let tools build the gates.</p>`,
        `<p>Two HDLs dominate: <b>SystemVerilog</b> and <b>VHDL</b>. The book shows both side by side. These tutorials use SystemVerilog, which industry is trending towards and which the CMOS VLSI book uses.</p>`,
      ]},
      { k: "learn", title: "A first module", b: [
        sv(SILLY),
        `<p>A <b>module</b> has a name, inputs and outputs. ${c("assign")} describes combinational logic: ${c("~")} is NOT, ${c("&amp;")} is AND, ${c("|")} is OR. Signals are type ${c("logic")}.</p>`,
        `<div class="two"><div class="tile"><h3>Behavioral</h3><p>Describes <b>what</b> the module does, like the equation above.</p></div><div class="tile"><h3>Structural</h3><p>Describes <b>how</b> it's built from smaller modules. Hierarchy.</p></div></div>`,
      ]},
      { k: "play", title: "Simulate it", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          const A = [], B = [], C = [], Y = [];
          for (let i = 0; i < 8; i++) { const [a, b, cc] = bits(i, 3).split("").map(Number); A.push(a); B.push(b); C.push(cc); Y.push(silly(a, b, cc)); }
          f.innerHTML = wave([{ name: "a", v: A }, { name: "b", v: B }, { name: "c", v: C }, { name: "y", v: Y, cls: "hl" }], { dx: 40 });
          host.append(f);
        },
        `<p><b>Simulation</b> applies inputs and shows the outputs, before any hardware exists. y is 1 for abc = 000, 100 and 101, as the equation says.</p>`,
        `<p class="aside">Why bother? Fixing a bug in a shipped chip costs months and millions. Intel's Pentium FDIV bug forced a recall costing $475 million.</p>`,
      ]},
      { k: "learn", title: "Synthesis", b: [
        `<p><b>Synthesis</b> turns the HDL into a <b>netlist</b>: gates and the wires between them. It also optimizes. For ${c("sillyfunction")}, the three 3-input ANDs become two 2-input ANDs, exactly the minimization from Chapter 2:</p>`,
        `<div class="eq">y = b̅c̅ + ab̅</div>`,
        `<p class="aside">Not every HDL command becomes hardware. “Print a message” only makes sense in simulation. The book separates <b>synthesizable modules</b> from <b>testbenches</b>.</p>`,
      ]},
      { k: "why", title: "The most important warning", b: [
        `<div class="key">An HDL is <b>not</b> a programming language. It's a shorthand for hardware. If you don't know roughly what hardware your code will become, you won't like what you get.</div>`,
        `<p>So: sketch the blocks (combinational logic, registers, FSMs) and how they connect, <i>then</i> write the code, using the standard <b>idiom</b> for each kind of block.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What are simulation and synthesis, and why do you need both?", model: "Simulation runs the HDL description with test inputs and shows the outputs, so you can find bugs before anything is built. Synthesis converts the description into an actual netlist of gates and wires, optimizing it. You need simulation to know the design is right and synthesis to turn it into hardware." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Combinational logic: operators", mins: 25,
    blurb: "Bitwise and reduction operators, busses, and the conditional operator that makes muxes.",
    takeaway: "Busses are written logic [N−1:0] (little-endian: a[0] is the lsb). Bitwise operators act on each bit: ~ NOT, & AND, | OR, ^ XOR; ~(a & b) is NAND. assign out = expression; is a continuous assignment: re-evaluated whenever any right-hand input changes, so it describes combinational logic. Reduction operators put one operator across all the bits of a bus, implying one multi-input gate: &a (AND of all bits), |a, ^a (parity), ~&a, ~|a, ~^a. The conditional (ternary) operator s ? d1 : d0 picks d1 if s is 1, d0 otherwise: the idiom for a 2:1 mux; nested, s[1] ? (s[0] ? d3 : d2) : (s[0] ? d1 : d0) is a 4:1 mux. Comments: // to end of line, /* … */ blocks. SystemVerilog is case-sensitive; names can't start with a digit.",
    steps: [
      { k: "learn", title: "Busses and bitwise operators", b: [
        sv(`
module gates(input  logic [3:0] a, b,
             output logic [3:0] y1, y2, y3, y4, y5);
  assign y1 = a & b;     // AND
  assign y2 = a | b;     // OR
  assign y3 = a ^ b;     // XOR
  assign y4 = ~(a & b);  // NAND
  assign y5 = ~(a | b);  // NOR
endmodule`),
        `<p>${c("[3:0]")} makes a 4-bit bus, bits a[3] (msb) down to a[0]. Bitwise operators work on each bit separately: this module is 20 two-input gates.</p>`,
        `<p class="aside">${c("assign")} is a <b>continuous assignment</b>: whenever an input on the right changes, the output is recomputed. That's exactly combinational logic.</p>`,
      ]},
      { k: "play", title: "Operator lab", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let a = "1100", b = "1010", s = 0;
          function draw() {
            const A = uval(a), B = uval(b), m = (x) => bits(x & 15, 4);
            const red = (op) => { const v = a.split("").map(Number); return op === "&" ? v.reduce((p, q) => p & q) : op === "|" ? v.reduce((p, q) => p | q) : v.reduce((p, q) => p ^ q); };
            ro.innerHTML = readout([["a & b", m(A & B)], ["a | b", m(A | B)], ["a ^ b", m(A ^ B)], ["~(a & b)", m(~(A & B))], ["&a (reduction)", String(red("&"))], ["|a", String(red("|"))], ["^a (parity)", String(red("^"))], [`s ? a : b (s = ${s})`, s ? a : b]]);
          }
          const A = bitButtons(a, (x) => { a = x; draw(); }, { label: "a[3:0]" }), B = bitButtons(b, (x) => { b = x; draw(); }, { label: "b[3:0]" });
          host.append(el(`<p class="aside">a[3:0]:</p>`), A.el, el(`<p class="aside">b[3:0]:</p>`), B.el, toggle(["s = 0", "s = 1"], (v) => { s = v; draw(); }), ro);
          draw();
        },
        `<p class="aside">Reduction operators (${c("&amp;a")}, ${c("|a")}, ${c("^a")}) squash a whole bus into one bit: one big gate. ${c("^a")} is 1 when an odd number of bits are 1.</p>`,
      ]},
      { k: "learn", title: "The conditional operator = a mux", b: [
        sv(`
module mux2(input  logic [3:0] d0, d1,
            input  logic       s,
            output logic [3:0] y);
  assign y = s ? d1 : d0;
endmodule`),
        `<p>${c("s ? d1 : d0")}: if s is 1, choose d1; otherwise d0. That's the idiom for a <b>multiplexer</b>. Nest it for a 4:1 mux:</p>`,
        sv(`  assign y = s[1] ? (s[0] ? d3 : d2)
                  : (s[0] ? d1 : d0);`),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "a = 4'b1011. What is ^a?", opts: [["1", true, "Three 1s: odd parity, so XOR of all bits is 1."], ["0", false, "Count the 1s: there are three."], ["4'b1011", false, "Reduction operators produce one bit."]] },
        { t: "mcq", q: "Which line describes an 8-input NOR of bus x[7:0]?", opts: [["assign y = ~|x;", true, "Reduction NOR."], ["assign y = ~x;", false, "That's 8 separate inverters."], ["assign y = x | 8'b0;", false, "That just passes x through, bitwise."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between a & b and &a?", model: "a & b is a bitwise AND of two busses: each bit of the result is the AND of the matching bits of a and b, so it's as wide as the busses. &a is a reduction AND: it ANDs all the bits of a single bus together and gives one bit, like one big multi-input AND gate." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  function parseNum(t) {
    const m = String(t).trim().replace(/_/g, "").match(/^(\d+)?'([bodh])([0-9a-fA-FxXzZ]+)$/);
    if (!m) { const d = String(t).trim().replace(/_/g, ""); if (/^\d+$/.test(d)) return { size: "unsized (as wide as needed)", base: 10, val: +d, bits: (+d).toString(2) }; return null; }
    const base = { b: 2, o: 8, d: 10, h: 16 }[m[2]], digits = m[3].toLowerCase();
    if (/[xz]/.test(digits)) return { size: m[1] ? +m[1] : "unsized", base, val: "contains x or z", bits: digits };
    const v = parseInt(digits, base);
    if (isNaN(v)) return null;
    const N = m[1] ? +m[1] : null;
    let b = v.toString(2);
    if (N) b = b.length > N ? b.slice(-N) : b.padStart(N, "0");
    return { size: N || "unsized (as wide as needed)", base, val: N ? parseInt(b, 2) : v, bits: b };
  }
  const p3 = {
    id: "p3", title: "Internal signals, numbers, Z and X, swizzling", mins: 25,
    blurb: "Concurrency, precedence, how to write constants, floating and unknown values, and joining busses.",
    takeaway: "Internal variables (e.g., p = a ^ b, g = a & b in a full adder: s = p ^ cin, cout = g | (p & cin)) are declared as logic. HDL assignments are concurrent: order in the file doesn't matter, like real hardware. Precedence: ~ highest; then *, /, %; +, −; shifts; comparisons; ==, !=; & and ~&; ^ and ~^; | and ~|; ?: lowest. So AND binds tighter than OR. Numbers: N'Bvalue with N = size in bits, B = b, o, d or h; underscores ignored; unsized numbers default to decimal and are zero-padded to fit; '0 and '1 fill a bus with 0s or 1s. Give sizes explicitly. z means floating: a tristate buffer is assign y = en ? a : 4'bz;, and its output is a tri net (multiple drivers allowed). x means unknown/illegal (contention, or uninitialized flip-flops at simulation start). Gates resolve what they can: 0 & z = 0, otherwise z or x inputs give x. Seeing x in simulation almost always means a bug. Bit swizzling: {} concatenates, {3{d[0]}} repeats: {c[2:1], {3{d[0]}}, c[0], 3'b101} is 9 bits. Delays (#1 in assign #1 y = …;, with `timescale) are for simulation only; synthesis ignores them.",
    steps: [
      { k: "learn", title: "Internal signals run in parallel", b: [
        sv(`
module fulladder(input  logic a, b, cin,
                 output logic s, cout);
  logic p, g;            // internal signals
  assign p = a ^ b;
  assign g = a & b;
  assign s = p ^ cin;
  assign cout = g | (p & cin);
endmodule`),
        `<p>${c("p")} and ${c("g")} are internal: neither input nor output. The four ${c("assign")}s happen <b>concurrently</b>. You could list them in any order and get the same hardware, because they <i>are</i> hardware.</p>`,
        `<p class="aside">Precedence: ${c("~")} first, then ${c("&amp;")}, then ${c("^")}, then ${c("|")}, then ${c("?:")}. So ${c("g | p &amp; cin")} already means ${c("g | (p &amp; cin)")}; parentheses just make it clear.</p>`,
      ]},
      { k: "play", title: "Number decoder", b: [
        (host, id) => {
          const ro = el(`<div></div>`), inp = el(`<input class="mono" value="8'hAB" aria-label="SystemVerilog number" style="width:16ch">`);
          function draw() { const r = parseNum(inp.value); ro.innerHTML = r ? readout([["Size", String(r.size)], ["Base", String(r.base)], ["Value", String(r.val)], ["Bits stored", r.bits]]) : `<p class="aside">Not a SystemVerilog number. Try 3'b101, 9'h25, 6'o42, 8'b1010_1011, 3'd6 or 42.</p>`; }
          inp.addEventListener("input", draw);
          const row = el(`<div class="row"><span>Number:</span></div>`); row.append(inp);
          host.append(row, ro);
          draw();
        },
        `<p>Format: <b>N'Bvalue</b>. N = size in bits, B = base (b, o, d, h), then the value. Underscores are ignored, for readability. Without a size, the number is padded to fit; always give the size when it matters.</p>`,
      ]},
      { k: "learn", title: "z and x", b: [
        sv(`
module tristate(input  logic [3:0] a,
                input  logic       en,
                output tri   [3:0] y);
  assign y = en ? a : 4'bz;
endmodule`),
        `<p>${c("z")} means floating. A tristate output is declared ${c("tri")}, a <b>net</b> that may have several drivers. ${c("x")} means unknown: contention, or a flip-flop nobody has reset yet.</p>`,
        `<div class="tbl"><table><thead><tr><th>&amp;</th><th>0</th><th>1</th><th>z</th><th>x</th></tr></thead><tbody><tr><th>0</th><td>0</td><td>0</td><td>0</td><td>0</td></tr><tr><th>1</th><td>0</td><td>1</td><td>x</td><td>x</td></tr><tr><th>z</th><td>0</td><td>x</td><td>x</td><td>x</td></tr><tr><th>x</th><td>0</td><td>x</td><td>x</td><td>x</td></tr></tbody></table></div>`,
        `<p class="aside">An AND with a 0 input is 0 whatever the other input is. Otherwise unknowns spread. Seeing x in a simulation almost always means a bug.</p>`,
      ]},
      { k: "play", title: "Bit swizzling", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let cc = "110", d = "1";
          function draw() { const y = cc.slice(0, 2) + d + d + d + cc[2] + "101"; ro.innerHTML = readout([["c[2:1]", cc.slice(0, 2)], ["{3{d[0]}}", d + d + d], ["c[0]", cc[2]], ["3'b101", "101"], ["y (9 bits)", y]]); }
          const C = bitButtons(cc, (x) => { cc = x; draw(); }, { label: "c[2:0]" }), D = bitButtons(d, (x) => { d = x; draw(); }, { label: "d[0]" });
          host.append(el(sv("  assign y = {c[2:1], {3{d[0]}}, c[0], 3'b101};")), el(`<p class="aside">c[2:0]:</p>`), C.el, el(`<p class="aside">d[0]:</p>`), D.el, ro);
          draw();
        },
        `<p class="aside">${c("{}")} joins busses; ${c("{3{d[0]}}")} repeats d[0] three times. The size on ${c("3'b101")} matters: unsized, it could add extra zeros in the middle.</p>`,
      ]},
      { k: "learn", title: "Delays are for simulation", b: [
        sv("  assign #2 n1 = ab & bb & cb;   // 2 time units"),
        `<p>${c("#")} adds a delay in simulation (units set by ${c("`timescale 1ns/1ps")}). Useful for seeing cause and effect. <b>Synthesis ignores it</b>: real delays come from the real gates.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "What does 6'o42 store?", opts: [["100010 (34)", true, "Octal 42 = 4×8 + 2 = 34 = 100010 in 6 bits."], ["101010 (42)", false, "o means octal, not decimal."], ["000100 0010", false, "Octal digits are 3 bits each: 4 = 100, 2 = 010."]] },
        { t: "mcq", q: "w is a 6-bit bus. After assign w = 'b11;, what is w?", opts: [["000011", true, "Unsized constants are zero-padded on the left."], ["110000", false, "Padding goes in front (the most significant bits)."], ["11", false, "w is 6 bits wide; the constant is padded."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why doesn't the order of assign statements in a module matter?", model: "Because each assign describes a piece of hardware that's always running. Whenever any input on its right side changes, its output updates, no matter where the statement appears in the file. It's not a sequence of steps like a program; it's a set of connected circuits." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Structural modeling", mins: 15,
    blurb: "Build modules out of instances of other modules: hierarchy in code.",
    takeaway: "Structural modeling describes a module as connected instances of simpler modules. A 4:1 mux from three 2:1 muxes: mux2 lowmux(d0, d1, s[0], low); mux2 highmux(d2, d3, s[0], high); mux2 finalmux(low, high, s[1], y); with internal busses low and high. Each copy is an instance with its own name (regularity: one module reused). Instances can connect to parts of busses (mux2 lsbmux(d0[3:0], d1[3:0], s, y[3:0]) and msbmux on [7:4] make an 8-bit mux). Expressions like ~s are allowed in port lists but discouraged. Building logic from tristates is not recommended. Good style: describe complex systems hierarchically, structural at the top, behavioral at the leaves, and avoid mixing structural and behavioral descriptions in one module.",
    steps: [
      { k: "learn", title: "Instances", b: [
        sv(`
module mux4(input  logic [3:0] d0, d1, d2, d3,
            input  logic [1:0] s,
            output logic [3:0] y);
  logic [3:0] low, high;
  mux2 lowmux(d0, d1, s[0], low);
  mux2 highmux(d2, d3, s[0], high);
  mux2 finalmux(low, high, s[1], y);
endmodule`, { hl: [5, 6, 7] }),
        `<p>Each highlighted line is an <b>instance</b> of ${c("mux2")}, with its own name. The ports connect in order: d0, d1, s, y. ${c("low")} and ${c("high")} are internal busses wiring them together.</p>`,
        `<p class="aside">One module, used three times: regularity. The mux2 itself is described elsewhere (behaviorally, in Part 2).</p>`,
      ]},
      { k: "play", title: "Trace the instances", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let s1 = 1, s0 = 0;
          const d = ["0001", "0010", "0100", "1000"];
          function draw() { const low = s0 ? d[1] : d[0], high = s0 ? d[3] : d[2], y = s1 ? high : low; ro.innerHTML = readout([["d0, d1, d2, d3", d.join(", ")], ["lowmux → low", low], ["highmux → high", high], ["finalmux → y", y]]); }
          host.append(toggle(["s[1] = 0", "s[1] = 1"], (v) => { s1 = v; draw(); }, 1), toggle(["s[0] = 0", "s[0] = 1"], (v) => { s0 = v; draw(); }, 0), ro);
          draw();
        },
      ]},
      { k: "learn", title: "Parts of busses", b: [
        sv(`
module mux2_8(input  logic [7:0] d0, d1,
              input  logic       s,
              output logic [7:0] y);
  mux2 lsbmux(d0[3:0], d1[3:0], s, y[3:0]);
  mux2 msbmux(d0[7:4], d1[7:4], s, y[7:4]);
endmodule`),
        `<p>Two 4-bit muxes, one on each nibble, make an 8-bit mux. Connect instances to slices of busses with ${c("[high:low]")}.</p>`,
        `<div class="key">Style: top levels structural, leaves behavioral, and don't mix the two in one module.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "How many instances of a 1-bit full adder module would a structural 16-bit ripple-carry adder contain?", opts: [["16", true, "One per bit, carries chained between them."], ["1", false, "One instance only handles one bit."], ["32", false, "Each full adder handles one column of both operands."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's an instance, and why give each one a name?", model: "An instance is one copy of a module placed inside another module and wired to specific signals. Each needs its own name so tools (and people) can tell the copies apart, for example lowmux, highmux and finalmux are three separate pieces of hardware built from the same mux2 description." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Sequential logic idioms", mins: 25,
    blurb: "always_ff for flip-flops, resets and enables, and why latches are best avoided.",
    takeaway: "Synthesis tools recognize idioms; other styles may simulate fine but synthesize wrongly. Register: always_ff @(posedge clk) q <= d; (the statement runs only on the event in the sensitivity list, so q remembers its value otherwise). <= is a nonblocking assignment. always_ff tells tools you mean flip-flops (they warn otherwise). Asynchronous reset: always_ff @(posedge clk, posedge reset) if (reset) q <= 4'b0; else q <= d;. Synchronous reset: leave reset out of the sensitivity list. Enabled register: … else if (en) q <= d;. One always block can describe several registers: n1 <= d; q <= n1; is a two-flop synchronizer. Flip-flop outputs start as x in simulation, so reset your registers. Latch: always_latch if (clk) q <= d;. Avoid latches unless you know your tool supports them and you need one; watch out for unintended latches (tools warn).",
    steps: [
      { k: "learn", title: "The register idiom", b: [
        sv(`
module flop(input  logic       clk,
            input  logic [3:0] d,
            output logic [3:0] q);
  always_ff @(posedge clk)
    q <= d;
endmodule`),
        `<p>The statement inside runs only on the event in the <b>sensitivity list</b>, ${c("@(posedge clk)")}. At all other times ${c("q")} keeps its value. That's a flip-flop: d copied to q on the rising edge.</p>`,
        `<p class="aside">${c("&lt;=")} is a <b>nonblocking</b> assignment (Part 7 explains). ${c("always_ff")} tells the tools you intend flip-flops, so they can warn you if you accidentally describe something else.</p>`,
      ]},
      { k: "learn", title: "Resets and enables", b: [
        sv(`
  // asynchronous reset: reset is in the sensitivity list
  always_ff @(posedge clk, posedge reset)
    if (reset)   q <= 4'b0;
    else if (en) q <= d;      // enabled register`),
        sv(`
  // synchronous reset: only the clock is in the list
  always_ff @(posedge clk)
    if (reset) q <= 4'b0;
    else       q <= d;`),
      ]},
      { k: "play", title: "Async vs sync reset", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          const clk = [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1], rst = [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          let qa = 1, qs = 1, A = [], Sy = [];
          for (let t = 0; t < 16; t++) { const edge = t > 0 && clk[t] && !clk[t - 1]; if (rst[t]) qa = 0; else if (edge) qa = 1; if (edge) qs = rst[t - 1] ? 0 : 1; A.push(qa); Sy.push(qs); }
          f.innerHTML = wave([{ name: "clk", v: clk }, { name: "reset", v: rst }, { name: "q async", v: A, cls: "hl" }, { name: "q sync", v: Sy }], { dx: 22, x0: 80 });
          host.append(f);
        },
        `<p class="aside">d is held at 1 here. The reset pulse comes mid-cycle. The asynchronous flop clears <b>immediately</b>; the synchronous one doesn't notice until… it misses this pulse entirely, because reset is gone by the next rising edge. A synchronous reset must be held across a clock edge.</p>`,
      ]},
      { k: "learn", title: "Several registers in one block", b: [
        sv(`
module sync(input  logic clk, d,
            output logic q);
  logic n1;
  always_ff @(posedge clk)
    begin
      n1 <= d;
      q  <= n1;
    end
endmodule`),
        `<p>On each edge, d goes to n1 <i>and at the same time</i> the old n1 goes to q: two flip-flops, the synchronizer from Chapter 3. ${c("begin … end")} groups several statements.</p>`,
      ]},
      { k: "why", title: "Avoid latches", b: [
        sv(`
  always_latch
    if (clk) q <= d;   // transparent while clk is high`),
        `<p>That's how to write a latch if you must. But many tools handle latches poorly, and it's very easy to create one by accident (Part 6). Unless you have a good reason, use flip-flops. And if you can't tell whether you wanted a latch, you're thinking of HDL as a program.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Which sensitivity list gives an asynchronous reset?", opts: [["@(posedge clk, posedge reset)", true, "reset can trigger the block on its own, without a clock edge."], ["@(posedge clk)", false, "That's a synchronous reset: reset is only seen at clock edges."], ["@(reset)", false, "That would make a block that ignores the clock."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the always_ff @(posedge clk) idiom produce a flip-flop?", model: "The block only runs when the clock rises. At that instant q gets d; at every other time nothing assigns q, so it keeps its old value. Copy on the rising edge, hold otherwise: that's exactly a D flip-flop." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "always_comb, case and if", mins: 25,
    blurb: "Bigger combinational blocks, and the missing default that quietly creates a latch.",
    takeaway: "always_comb re-evaluates whenever any signal it reads changes (better than listing signals by hand). Inside it, use blocking assignments (=). case and if statements must be inside always blocks. A case statement implies combinational logic only if every input combination assigns the output; otherwise the output keeps its old value in the missing cases: sequential logic (a latch). So give case a default (the seven-segment decoder without default would remember its output for inputs 10–15). A 3:8 decoder written with case gets a default of 8'bx, prudent for simulation. if/else if/else chains describe priority logic (the priority circuit). casez treats ? as don't care (4'b1???: y = 4'b1000;). Synthesizers may turn a big case into a ROM.",
    steps: [
      { k: "learn", title: "always_comb", b: [
        sv(`
module sevenseg(input  logic [3:0] data,
                output logic [6:0] segments);
  always_comb
    case (data)
      //                 abc_defg
      0:       segments = 7'b111_1110;
      1:       segments = 7'b011_0000;
      2:       segments = 7'b110_1101;
      // ... 3 to 9 ...
      default: segments = 7'b000_0000;
    endcase
endmodule`, { hl: [10] }),
        `<p>${c("always_comb")} re-runs whenever anything it reads changes. Inside it, ${c("case")} picks an action by the value of ${c("data")}. Use blocking ${c("=")} here.</p>`,
      ]},
      { k: "predict", title: "What does a missing default do?", b: [
        { t: "mcq", q: "Delete the highlighted default line. data is a 4-bit input, so values 10–15 now match no case. What hardware results?", opts: [
          ["A latch: for 10–15 nothing is assigned, so segments must keep its old value", true, "Not assigning means remembering, and remembering needs storage. The book calls it strange behaviour for hardware."],
          ["The same circuit, outputs 0 for 10–15", false, "Nothing says 0. Unassigned means “keep the previous value”."],
          ["A compile error", false, "It's legal. That's what makes it dangerous; tools may only warn."],
        ]},
      ]},
      { k: "learn", title: "if/else = priority", b: [
        sv(`
module priorityckt(input  logic [3:0] a,
                   output logic [3:0] y);
  always_comb
    if      (a[3]) y = 4'b1000;
    else if (a[2]) y = 4'b0100;
    else if (a[1]) y = 4'b0010;
    else if (a[0]) y = 4'b0001;
    else           y = 4'b0000;
endmodule`),
        `<p>An if/else chain checks conditions in order: the first true one wins. That's priority logic. Every path ends with an assignment to y, so it's combinational.</p>`,
        sv(`
  always_comb
    casez (a)
      4'b1???: y = 4'b1000;   // ? = don't care
      4'b01??: y = 4'b0100;
      4'b001?: y = 4'b0010;
      4'b0001: y = 4'b0001;
      default: y = 4'b0000;
    endcase`),
        `<p class="aside">${c("casez")} treats ? as don't care: the same priority circuit, written as a truth table.</p>`,
      ]},
      { k: "bug", title: "Spot the latch", b: [
        { t: "sort", q: "Does each always_comb block describe pure combinational logic, or does it imply a latch?", bins: ["Combinational", "Implies a latch"], items: [
          ["if (en) y = a; else y = b;", 0, "Every path assigns y."],
          ["if (en) y = a;", 1, "When en is 0, y isn't assigned, so it must remember."],
          ["case (s) 2'b00: y = a; 2'b01: y = b; endcase   (s is 2 bits)", 1, "s = 10 and 11 aren't covered and there's no default."],
          ["y = 0; if (en) y = a;", 0, "A default value first, then a conditional override: every path assigns y."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a case statement without a default sometimes create a latch?", model: "In combinational logic every input combination must produce an output. If some input values don't match any case and there's no default, the output isn't assigned for them, which means it keeps its previous value. Keeping a previous value requires memory, so the tool infers a latch." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Blocking vs nonblocking", mins: 25,
    blurb: "= runs in order; <= updates everything at once. Four rules keep you safe.",
    takeaway: "Inside always blocks: blocking assignments (=) execute in order, like a program, each seeing the previous ones' new values. Nonblocking assignments (<=) are evaluated concurrently: all right-hand sides use old values, then all left-hand sides update together. Guidelines: (1) always_ff @(posedge clk) with nonblocking assignments for synchronous sequential logic; (2) continuous assign for simple combinational logic; (3) always_comb with blocking assignments for more complex combinational logic; (4) never assign the same signal in more than one always block or continuous assignment. Why: a full adder written with nonblocking assignments inside always_comb computes s from the old p and needs a second pass (slower simulation; and with an incomplete sensitivity list it stays wrong, mismatching the synthesized hardware). A synchronizer written with blocking assignments (n1 = d; q = n1;) copies d straight to q: one flip-flop, not two. So use nonblocking exclusively for sequential logic.",
    steps: [
      { k: "learn", title: "Two kinds of assignment", b: [
        `<div class="two"><div class="tile"><h3>Blocking ${c("=")}</h3><p>Executes in order. Each line sees the new values from the lines before it.</p></div><div class="tile"><h3>Nonblocking ${c("&lt;=")}</h3><p>All right-hand sides are read first (old values), then all left-hand sides update at once.</p></div></div>`,
      ]},
      { k: "play", title: "The synchronizer, both ways", b: [
        (host, id) => {
          const out = el(`<div></div>`);
          let k = 0;
          function draw() {
            const code = k ? sv(`
  always_ff @(posedge clk) begin
    n1 = d;    // blocking
    q  = n1;   // blocking: sees the NEW n1
  end`) : sv(`
  always_ff @(posedge clk) begin
    n1 <= d;   // nonblocking
    q  <= n1;  // nonblocking: uses the OLD n1
  end`);
            const res = k ? [["n1", "0"], ["q", "0  (d leapt straight to q)"]] : [["n1", "0"], ["q", "1  (the old n1)"]];
            out.innerHTML = code + `<p class="aside">Before the edge: d = 0, n1 = 1, q = 0. After the edge:</p>` + readout(res) + `<p class="aside">${k ? "One flip-flop: the synthesizer optimizes n1 away entirely. Not a synchronizer." : "Two flip-flops in a row. Correct."}</p>`;
          }
          host.append(toggle(["Nonblocking <=", "Blocking ="], (i) => { k = i; draw(); }), out);
          draw();
        },
      ]},
      { k: "learn", title: "The four rules", b: [
        `<ol><li><b>Sequential logic:</b> ${c("always_ff @(posedge clk)")} with <b>nonblocking</b> ${c("&lt;=")}.</li><li><b>Simple combinational logic:</b> continuous ${c("assign")}.</li><li><b>Complex combinational logic:</b> ${c("always_comb")} with <b>blocking</b> ${c("=")}.</li><li><b>Never</b> assign the same signal in more than one always block or assign statement.</li></ol>`,
        `<p class="aside">Breaking them can give code that simulates correctly but synthesizes to different hardware: the worst kind of bug.</p>`,
      ]},
      { k: "why", title: "Why blocking for combinational logic", b: [
        `<p>A full adder in ${c("always_comb")} with nonblocking assignments: when a changes, ${c("s &lt;= p ^ cin")} uses the <i>old</i> p. The block must run a second time to fix s. It gets there, but simulation is slower, and if the sensitivity list misses p, simulation stays wrong while the synthesized hardware is right: a simulation/synthesis mismatch.</p>`,
        `<p>With blocking assignments, p and g get their new values first, then s and cout use them, in one pass.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A shift register a → b → c, one flop each, written in one always_ff block. Which is right?", opts: [["b <= a; c <= b;", true, "Nonblocking: c gets the old b, so each value moves one place per clock."], ["b = a; c = b;", false, "Blocking: c gets the new b = a. The value jumps two places in one clock."], ["Either: order fixes it", false, "Reversing blocking statements can work, but the rule is simply: nonblocking for sequential logic."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "When do you use = and when <=, and why?", model: "Use nonblocking <= in always_ff blocks for sequential logic, so every register samples its input at the same instant, like real flip-flops. Use blocking = in always_comb blocks for combinational logic, so intermediate values are computed in order within one evaluation. Mixing them up can create the wrong hardware or a mismatch between simulation and synthesis." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const FSMCODE = `
module patternMoore(input  logic clk, reset, a,
                    output logic y);
  typedef enum logic [1:0] {S0, S1, S2} statetype;
  statetype state, nextstate;

  // state register
  always_ff @(posedge clk, posedge reset)
    if (reset) state <= S0;
    else       state <= nextstate;

  // next state logic
  always_comb
    case (state)
      S0: if (a) nextstate = S0; else nextstate = S1;
      S1: if (a) nextstate = S2; else nextstate = S1;
      S2: if (a) nextstate = S0; else nextstate = S1;
      default:   nextstate = S0;
    endcase

  // output logic
  assign y = (state == S2);
endmodule`;
  const p8 = {
    id: "p8", title: "FSMs in SystemVerilog", mins: 25,
    blurb: "Three parts: state register, next-state logic, output logic.",
    takeaway: "HDL state machines mirror the FSM structure: a state register (always_ff with reset), next-state logic (always_comb with case, using if for inputs) and output logic (assign or always_comb). typedef enum logic [1:0] {S0, S1, S2} statetype; names the states; encodings default to numerical order but tools treat them as suggestions (they may pick one-hot). The next-state case needs a default even if the unused encoding (11) should never occur, so the logic stays combinational. Equality compare: (state == S0). Moore output: y = (state == S2); Mealy output also uses the input: y = (a & state == S1);. Some synthesis tools only show a state diagram for FSMs, so make sure the HDL is right.",
    steps: [
      { k: "play", title: "Read the three parts", b: [
        (host, id) => {
          const out = el(`<div></div>`), note = el(`<p class="aside"></p>`);
          const parts = [[[7, 8, 9], "State register: a resettable flip-flop bank holding the current state. Nonblocking, always_ff."], [[12, 13, 14, 15, 16, 17, 18], "Next-state logic: combinational, always_comb + case. The default keeps it combinational even though the unused encoding should never occur."], [[21], "Output logic: Moore, so it depends only on the state."], [[3, 4], "Naming the states: an enumerated type, so the code reads S0, S1, S2 instead of bit patterns."]];
          function draw(i) { out.innerHTML = sv(FSMCODE, { hl: parts[i][0] }); note.textContent = parts[i][1]; }
          host.append(toggle(["State register", "Next-state logic", "Output logic", "State names"], draw, 0), note, out);
          draw(0);
        },
        `<p class="aside">This is Chapter 3's smiling snail (detects 0 then 1) as a Moore machine.</p>`,
      ]},
      { k: "learn", title: "Mealy version: change one line", b: [
        sv(`  assign y = (a & state == S1);   // Mealy: output uses the input too`),
        `<p>With only two states (S0, S1), the Mealy snail's output depends on the state <b>and</b> the input a.</p>`,
        `<p class="aside">State encodings in an enum are suggestions. A synthesis tool may choose one-hot instead, using more flip-flops and less logic.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why does the next-state case need a default even though state 11 never happens?", opts: [["Without it, nextstate isn't assigned for 11, which implies a latch; with it, the logic is purely combinational", true, "The same missing-default trap as Part 6."], ["To reset the FSM", false, "Reset is handled in the state register."], ["To make the FSM Mealy", false, "Defaults have nothing to do with Moore vs Mealy."]] },
        { t: "mcq", q: "You want y high in states S0 and S1. Which line?", opts: [["assign y = (state == S0 | state == S1);", true, "Two comparisons ORed."], ["assign y = state;", false, "That outputs the state bits, not a single flag."], ["assign y = (state != S1);", false, "That's high in S0 and S2."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe the three blocks of an FSM written in SystemVerilog.", model: "A state register: an always_ff block that resets to the start state and otherwise loads nextstate on each clock edge. Next-state logic: an always_comb case statement on the current state, using the inputs, with a default. Output logic: an assign (or always_comb) computing the outputs from the state, plus the inputs for a Mealy machine." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Types, parameters and generate", mins: 20,
    blurb: "logic vs wire and reg, signed numbers, modules with adjustable width, and hardware loops.",
    takeaway: "Old Verilog used reg (for anything assigned in an always block, register or not: confusing) and wire. SystemVerilog's logic replaces both for single-driver signals. Signals with multiple drivers (tristate busses) must be nets: tri (floats z when undriven, x on conflict); also trireg (keeps the previous value), triand, trior, tri0, tri1. Signals are unsigned by default; logic signed [3:0] a makes multiplication, comparison and arithmetic right shift treat it as 2's complement (addition is the same either way). Parameterized modules: module mux2 #(parameter width = 8) (… [width−1:0] …); instantiate with a new width as mux2 #(12) lowmux(…);. A parameterized N:2^N decoder: y = 0; y[a] = 1;. generate with a for loop (genvar i) produces a variable amount of hardware; use it with care, since it's easy to create a lot of hardware by accident.",
    steps: [
      { k: "learn", title: "logic, nets, and signed", b: [
        `<p>Old Verilog had ${c("reg")} (anything assigned in an always block, even if it isn't a register: endlessly confusing) and ${c("wire")}. SystemVerilog's ${c("logic")} replaces both whenever a signal has <b>one driver</b>.</p>`,
        `<p>Signals with <b>several drivers</b>, like a tristate bus, must be <b>nets</b>: ${c("tri")} floats (z) when nobody drives it and goes x on a conflict.</p>`,
        sv(`  logic signed [3:0] a, b;     // now a * b is a signed multiply`),
        `<p class="aside">Signals are unsigned by default. Addition doesn't care, but multiplication, comparison and arithmetic right shift do (Chapter 5).</p>`,
      ]},
      { k: "learn", title: "Parameterized modules", b: [
        sv(`
module mux2 #(parameter width = 8)
             (input  logic [width-1:0] d0, d1,
              input  logic             s,
              output logic [width-1:0] y);
  assign y = s ? d1 : d0;
endmodule

  mux2 #(12) lowmux(d0, d1, s[0], low);   // a 12-bit instance`),
        `<p>One description, any width. Default 8; override with ${c("#(12)")}. (Don't confuse this ${c("#( )")} with a ${c("#")} delay.)</p>`,
      ]},
      { k: "learn", title: "generate: hardware loops", b: [
        sv(`
module decoder #(parameter N = 3)
                (input  logic [N-1:0]    a,
                 output logic [2**N-1:0] y);
  always_comb begin
    y = 0;        // all outputs low...
    y[a] = 1;     // ...except the one selected by a
  end
endmodule`),
        `<p>A whole N:2<sup>N</sup> decoder in two lines. For a variable number of copies of hardware, ${c("generate")} with a ${c("for")} loop builds them, e.g. a chain of AND gates of any width.</p>`,
        `<div class="key">Use generate with care: a loop bound of 1024 means 1024 copies of hardware, not 1024 steps of time.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Which signal must be declared tri rather than logic?", opts: [["A bus driven by three chips' tristate buffers", true, "Multiple drivers need a net."], ["A flip-flop output", false, "One driver: logic."], ["The output of an assign statement", false, "One driver: logic."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the advantage of a parameterized module?", model: "You describe the hardware once with an adjustable width (or other parameter) and reuse it at many sizes, like an 8-bit and a 12-bit mux from the same code, instead of writing and maintaining a separate module for each size." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "Testbenches", mins: 25,
    blurb: "Code that tests code: apply inputs, check outputs, report errors.",
    takeaway: "A testbench is an HDL module (not synthesizable) that tests another module, the device under test (DUT, or unit under test). Simplest: instantiate the DUT, then in an initial block apply inputs with delays (a = 0; b = 0; c = 0; #10; …) and inspect waveforms by eye. Better: self-checking, with assert (y === 1) else $error(\"000 failed.\"); after each vector. === and !== compare correctly even with x and z. Best: put test vectors (inputs and expected outputs) in a file, load them with $readmemb(\"example.tv\", testvectors), generate a clock (always begin clk = 1; #5; clk = 0; #5; end), apply each vector on the rising edge, check outputs on the falling edge, count errors, and stop at the end of the file. initial blocks are for testbenches only: hardware can't run a magic sequence at power-up.",
    steps: [
      { k: "learn", title: "The device under test", b: [
        `<p>A <b>testbench</b> is a module that tests another module, the <b>device under test</b> (DUT). It has no inputs or outputs of its own, and it's never synthesized.</p>`,
        sv(`
module testbench1();
  logic a, b, c, y;
  sillyfunction dut(a, b, c, y);   // instantiate the DUT
  initial begin
    a = 0; b = 0; c = 0; #10;
    c = 1;               #10;
    b = 1; c = 0;        #10;
    // ... all 8 combinations ...
  end
endmodule`),
        `<p class="aside">${c("initial")} runs once at the start of simulation. Only in testbenches: real hardware can't run a sequence of steps at power-up.</p>`,
      ]},
      { k: "learn", title: "Self-checking", b: [
        sv(`
    a = 0; b = 0; c = 0; #10;
    assert (y === 1) else $error("000 failed.");`),
        `<p>Checking waveforms by eye is tedious and error-prone, especially weeks later. Let the testbench check: ${c("assert")} tests a condition and ${c("$error")} prints a message if it fails. Use ${c("===")}, which compares x and z correctly.</p>`,
        `<p>Best of all: put the vectors (inputs and expected output) in a file like ${c("example.tv")}, read it with ${c("$readmemb")}, apply one vector per clock, and count errors.</p>`,
      ]},
      { k: "play", title: "Run a testbench", b: [
        (host, id) => {
          const out = el(`<pre class="code"></pre>`);
          const designs = [["Correct", (a, b, cc) => silly(a, b, cc)], ["Bug: dropped a term", (a, b, cc) => ((1 - a) & (1 - b) & (1 - cc)) | (a & (1 - b) & (1 - cc))], ["Bug: wrong polarity", (a, b, cc) => ((1 - b) & (1 - cc)) | (a & b)]];
          let k = 0;
          function run() {
            let log = "", err = 0;
            for (let i = 0; i < 8; i++) { const [a, b, cc] = bits(i, 3).split("").map(Number), y = designs[k][1](a, b, cc), e = silly(a, b, cc); if (y !== e) { err++; log += `Error: inputs = ${a}${b}${cc}\n  outputs = ${y} (${e} expected)\n`; } }
            out.textContent = `# example.tv: 000_1 001_0 010_0 011_0 100_1 101_1 110_0 111_0\n${log}8 tests completed with ${err} errors`;
          }
          const go = btn("Run testbench", "primary");
          go.addEventListener("click", run);
          host.append(toggle(designs.map((d) => d[0]), (i) => { k = i; out.textContent = "Press Run."; }), go, out);
          run();
        },
        `<p class="aside">Pick a buggy DUT and run the same vectors. The testbench pinpoints exactly which inputs fail, without you looking at a single waveform.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why compare with === instead of == in a testbench?", opts: [["=== treats x and z as values to match, so an output stuck at x is reported as a failure", true, "With ==, comparing against x gives x, which an assert may not treat as false."], ["=== is faster", false, "It's about x and z, not speed."], ["== isn't allowed in testbenches", false, "It's allowed, just unreliable with x and z."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe a good testbench in a few sentences.", model: "It instantiates the device under test, generates a clock and reset, reads input/expected-output vectors from a file, applies one vector each cycle, and after the outputs settle compares them with the expected values using ===, printing an error message for each mismatch and a count at the end. Because it checks itself, it can be rerun any time the design changes." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "hh4", eyebrow: "Harris & Harris · Chapter 4", title: "Hardware Description Languages",
    intro: `<p>Ten parts on SystemVerilog: modules, simulation and synthesis, operators, numbers and z/x, structural modeling, sequential idioms, always_comb with case and if, blocking vs nonblocking, FSMs, parameters and generate, and testbenches.</p><p>The book also shows VHDL beside every example. If your course uses VHDL, read the right-hand columns; the ideas are identical. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. If you can, run them in a free simulator (ModelSim student edition, Icarus Verilog, or EDA Playground in a browser). Writing and simulating the code is the real test.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10],
    summary: `
      <h3>Big ideas</h3>
      <p>HDL describes hardware, not a program. Simulation checks it; synthesis turns it into a netlist. Sketch blocks first, then use idioms.</p>
      <h3>Combinational</h3>
      <p><code>assign y = ...;</code> Bitwise <code>~ &amp; | ^</code>; reduction <code>&amp;a |a ^a</code>; mux <code>s ? d1 : d0</code>; concatenate <code>{a, b}</code>, repeat <code>{3{x}}</code>. Numbers <code>N'Bvalue</code>. <code>z</code> floating, <code>x</code> unknown. <code>always_comb</code> + blocking <code>=</code>, with <code>case</code>/<code>if</code>; always give a default.</p>
      <h3>Sequential</h3>
      <p><code>always_ff @(posedge clk)</code> + nonblocking <code>&lt;=</code>. Async reset: <code>@(posedge clk, posedge reset)</code>. Enable: <code>else if (en)</code>. Avoid latches.</p>
      <h3>Structure and FSMs</h3>
      <p>Instances: <code>mux2 lowmux(d0, d1, s[0], low);</code>. FSM = state register + next-state <code>always_comb case</code> + output logic; <code>typedef enum</code>. Parameters: <code>#(parameter width = 8)</code>. <code>generate</code> loops build copies of hardware.</p>
      <h3>Testbenches</h3>
      <p>Instantiate the DUT; <code>initial</code> blocks; <code>assert (y === e) else $error(...)</code>; vectors from a file with <code>$readmemb</code>.</p>`,
  };
  Course.start(window.CHAPTER);
})();
