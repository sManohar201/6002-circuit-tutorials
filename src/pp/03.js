(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const { bits, uval, bitRow, bitButtons, truthTable, gate, wave, inverter, nand2, nor2, fsm } = Digital;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seenHH = (html, href, where) => `<div class="key"><b>More in Harris & Harris:</b> ${html} <a href="../hh/${href}">${where} →</a></div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const mono = (s) => `<span class="mono">${s}</span>`;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const W = (v) => (v ? "w hl" : "w");

  /* =============== PART 1 =============== */
  function lampFig(p, g) {
    const on = p ? g === 0 : g === 1;
    let s = S.wire([100, 40], [230, 40], [230, 70]) + S.bulb(230, 92, on ? 0.8 : 0) + S.wire([230, 114], [230, 136]);
    s += S.nmos(216, 176, { p, cls: on ? "hl" : "dim" }) + S.t(180, 170, "gate", { a: "end", cls: "s" }) + S.t(180, 188, (g ? "1.2" : "0") + " V", { a: "end", cls: "s a" });
    s += S.wire([230, 216], [230, 236], [100, 236]) + S.vsrc(100, 138, "1.2 V") + S.wire([100, 40], [100, 120]) + S.wire([100, 156], [100, 236]);
    s += S.t(270, 180, on ? "acts like a wire" : "open circuit", { a: "start", cls: on ? "g" : "b" });
    return S.svg(420, 260, s, { max: 420, label: (p ? "P" : "N") + "-type transistor switching a bulb" });
  }
  const p1 = {
    id: "p1", title: "The transistor as a switch", mins: 15,
    blurb: "N-type closes when its gate is 1.2 V; P-type closes when its gate is 0 V.",
    takeaway: "Microprocessors are built from MOS (metal-oxide semiconductor) transistors: billions of them (Intel Broadwell-E5, 2016: over 7 billion; IBM Power9, 2017: 8 billion). Their electrical details are below this book's lowest level of abstraction. Logically they work like wall switches: a lamp glows only when there's a closed circuit from the supply through the lamp and back. A transistor has three terminals: gate, source, drain. N-type: gate at 1.2 V → source–drain acts like a piece of wire (short circuit); gate at 0 V → open circuit. P-type: the opposite (closed at 0 V, open at 1.2 V). Circuits with both types are CMOS (complementary MOS). Schematics usually show only the supply terminals, not the whole loop.",
    steps: [
      { k: "learn", title: "A wall switch", b: [
        `<p>A lamp glows only if electrons can flow in a <b>closed circuit</b>: supply → switch → lamp → back to the supply. Open the switch and the circuit breaks.</p>`,
        `<p>A computer does the same thing billions of times, with <b>MOS transistors</b> instead of wall switches. (Intel's Broadwell-E5 in 2016 had over 7 billion.)</p>`,
      ]},
      { k: "play", title: "Switch a bulb with a transistor", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let p = false, g = 1;
          const draw = () => { f.innerHTML = lampFig(p, g); };
          host.append(toggle(["N-type", "P-type"], (i) => { p = i === 1; draw(); }), toggle(["gate = 0 V", "gate = 1.2 V"], (i) => { g = i; draw(); }, 1), f);
          draw();
        },
        `<p class="aside">Three terminals: <b>gate</b>, <b>source</b>, <b>drain</b>. The gate decides whether source and drain are connected.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Is the transistor a closed circuit (wire) or an open circuit?", bins: ["Closed (wire)", "Open"], items: [
          ["N-type, gate at 1.2 V", 0, "N-type conducts when its gate is high."], ["N-type, gate at 0 V", 1, ""],
          ["P-type, gate at 0 V", 0, "P-type is the opposite of N-type."], ["P-type, gate at 1.2 V", 1, ""],
        ]},
      ]},
      { k: "learn", title: "CMOS", b: [
        `<p>Because N-type and P-type behave in opposite ways, circuits using both are called <b>CMOS</b>: complementary metal-oxide semiconductor.</p>`,
        `<p class="aside">How a transistor really works (electrons, oxides, thresholds) is below this book's lowest level of abstraction. Harris & Harris and CMOS VLSI go there.</p>`,
        seenHH("How nMOS and pMOS transistors work, with thresholds.", "01-zero-to-one.html#p8", "Chapter 1, Part 8"),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do N-type and P-type transistors differ as switches?", model: "An N-type transistor connects its source and drain (acts like a wire) when its gate is at the high voltage, 1.2 V, and is open when the gate is 0 V. A P-type is the opposite: closed when its gate is 0 V and open when it's at 1.2 V." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Gates from transistors", mins: 25,
    blurb: "NOT, NOR, OR, NAND, AND, and why a P-type never goes to ground.",
    takeaway: "Inverter: a P-type from 1.2 V to the output and an N-type from the output to 0 V, gates tied to the input. In = 0: P-type closed, N-type open, Out = 1.2 V. In = 1: Out = 0 V. NOR: two P-types in series (to 1.2 V) and two N-types in parallel (to ground): C is 1 only when A and B are both 0. OR = NOR followed by an inverter (6 transistors). Why not 4 transistors for OR, with P-types to ground and N-types to 1.2 V? A P-type connected to ground (or an N-type to 1.2 V) has a transmission voltage of about 0.5 V across it, so the outputs would be 1.0 V for a logical 0 and 0.7 V for a logical 1: useless. NAND: two P-types in parallel, two N-types in series: C is 0 only when A and B are both 1. AND = NAND followed by an inverter. From now on, gates are drawn as symbols (a bubble means NOT).",
    steps: [
      { k: "learn", title: "The inverter", b: [
        fig(inverter(0)),
        `<p>P-type on top, to 1.2 V. N-type below, to 0 V. Both gates tied to the input. In = 0: the P-type closes, Out = 1. In = 1: the N-type closes, Out = 0. That's NOT.</p>`,
      ]},
      { k: "play", title: "NOR and NAND", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), tt = el(`<div></div>`);
          let k = 0, A = 0, B = 1;
          function draw() {
            f.innerHTML = k === 0 ? nor2(A, B) : nand2(A, B);
            tt.innerHTML = truthTable(["A", "B"], ["C"], ([a, b]) => (k === 0 ? 1 - (a | b) : 1 - (a & b)), { hot: A * 2 + B });
          }
          host.append(toggle(["NOR", "NAND"], (i) => { k = i; draw(); }), toggle(["A = 0", "A = 1"], (v) => { A = v; draw(); }, A), toggle(["B = 0", "B = 1"], (v) => { B = v; draw(); }, B), f, tt);
          draw();
        },
        `<p class="aside">Highlighted transistors are closed. NOR: P-types in <b>series</b> (both must close to reach 1.2 V), N-types in <b>parallel</b> (either one pulls to 0 V). NAND is the mirror image.</p>`,
      ]},
      { k: "learn", title: "OR and AND need one more stage", b: [
        `<p>Add an inverter after a NOR and you get <b>OR</b>. Add one after a NAND and you get <b>AND</b>. Six transistors each.</p>`,
        `<p class="aside">Inside a CMOS gate, the natural output is inverted. That's why NAND and NOR are the cheaper gates.</p>`,
      ]},
      { k: "predict", title: "Why not 4 transistors?", b: [
        `<p>A student suggests an OR gate with just 4 transistors: swap the NOR's networks, so the N-types go up to 1.2 V and the P-types go down to ground.</p>`,
        { t: "mcq", q: "What goes wrong?", opts: [
          ["A P-type connected to ground (or an N-type to 1.2 V) loses about 0.5 V across it: the outputs come out 1.0 V for 0 and 0.7 V for 1", true, "The book's numbers. Logically it looks fine; electrically it's useless. A good reason to know the level below."],
          ["Nothing: it works and saves two transistors", false, "Logically the switch model says yes. The transistors' electrical behaviour says no."],
          ["It makes an AND gate instead", false, "The logic would be OR. The voltages are the problem."],
        ]},
      ]},
      { k: "learn", title: "Symbols from now on", b: [
        fig(S.svg(420, 90, gate("not", 20, 45).s + gate("and", 110, 45).s + gate("or", 200, 45).s + gate("nand", 290, 45).s + S.t(40, 85, "NOT", { cls: "s" }) + S.t(130, 85, "AND", { cls: "s" }) + S.t(225, 85, "OR", { cls: "s" }) + S.t(315, 85, "NAND", { cls: "s" }), { label: "Gate symbols" })),
        `<p>We now raise the level of abstraction: gates are drawn as symbols, not transistors. A <b>bubble</b> means NOT.</p>`,
      ]},
      { k: "check", title: "Count transistors", b: [
        { t: "mcq", q: "How many transistors does this book's 2-input AND gate use?", opts: [["6: a NAND (4) and an inverter (2)", true, "Right."], ["4", false, "That's the NAND alone."], ["2", false, "That's an inverter."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In a NOR gate, why are the P-type transistors in series and the N-type in parallel?", model: "The output must be 1 only when both inputs are 0. P-types in series close a path to 1.2 V only when both of their gates are 0. And the output must be 0 when either input is 1: N-types in parallel connect the output to ground if either gate is 1." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "More inputs, and logical completeness", mins: 15,
    blurb: "n-input gates, and why AND, OR and NOT are enough to build anything.",
    takeaway: "AND, OR, NAND and NOR extend to n inputs. n-input AND: output 1 only if ALL inputs are 1. n-input OR: output 1 if ANY input is 1 (0 only if all are 0). A set of gates is logically complete if any truth table can be built from them alone. {AND, OR, NOT} is logically complete (proved by the PLA in Part 6: any function is ANDs, ORs and NOTs). NAND alone is also logically complete: a NAND with its inputs tied together is a NOT, NAND + NOT is AND, and OR can be built from AND and NOT (DeMorgan).",
    steps: [
      { k: "learn", title: "n inputs", b: [
        `<div class="two"><div class="tile"><h3>n-input AND</h3><p>Output 1 only if <b>all</b> n inputs are 1.</p></div><div class="tile"><h3>n-input OR</h3><p>Output 1 if <b>any</b> input is 1. Output 0 only if all are 0.</p></div></div>`,
        truthTable(["A", "B", "C"], ["AND3"], ([a, b, c]) => a & b & c, { hot: 7 }),
      ]},
      { k: "predict", title: "Build a 3-input AND", b: [
        { t: "mcq", q: "Using the NAND idea, how would you build a 3-input AND from transistors?", opts: [
          ["3 N-types in series and 3 P-types in parallel (a 3-input NAND), then an inverter", true, "Series N-types pull down only when all three inputs are 1; the inverter turns NAND into AND. 8 transistors."],
          ["3 N-types in parallel, 3 P-types in series", false, "That's a 3-input NOR."],
          ["Two 2-input ANDs side by side", false, "Two ANDs in a chain would work (AND of AND), but that's 12 transistors, not the most direct way."],
        ]},
      ]},
      { k: "learn", title: "Logical completeness", b: [
        `<p>A set of gates is <b>logically complete</b> if you can build <i>any</i> truth table using only those gates.</p>`,
        `<div class="key">{AND, OR, NOT} is logically complete. A barrel of each is enough for any logic function. (Part 6 shows why.)</div>`,
      ]},
      { k: "predict", title: "Is NAND alone enough?", b: [
        `<p>Follow the book's hint, one step at a time.</p>`,
        { t: "mcq", q: "Step 1: can a NAND act as a NOT?", opts: [["Yes: tie both inputs together. NAND(A, A) = NOT(A AND A) = NOT A", true, "So NOT is covered."], ["No, a NAND always needs two different inputs", false, "Nothing stops you wiring the same signal to both."]] },
        { t: "mcq", q: "Step 2: then AND = NAND followed by that NOT. Step 3: can AND and NOT make OR?", opts: [["Yes: A OR B = NOT(NOT A AND NOT B), DeMorgan's law", true, "So NAND gives NOT, AND and OR: it's logically complete on its own."], ["No: OR needs its own gate", false, "Remember DeMorgan from Chapter 2."]] },
      ]},
      { k: "why", title: "Why this matters", b: [
        `<p>A chip factory could make just <b>one</b> kind of gate and still build any circuit. Real chips use many kinds for speed and area, but NAND and NOR really are the workhorses.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does it mean for NAND to be logically complete, and why is it?", model: "It means any logic function can be built from NAND gates alone. A NAND with both inputs tied together is a NOT; a NAND followed by that NOT is an AND; and OR is NOT(NOT A AND NOT B) by DeMorgan. Since AND, OR and NOT can build anything, so can NAND." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  function decoderFig(a, b) {
    const k = a * 2 + b;
    let s = `<rect class="box" x="150" y="30" width="110" height="170" rx="8"/>` + S.t(205, 120, "2-to-4", { cls: "s" }) + S.t(205, 136, "decoder", { cls: "s" });
    s += `<line class="${W(a)}" x1="70" y1="90" x2="150" y2="90"/>` + S.t(64, 95, "A = " + a, { a: "end" });
    s += `<line class="${W(b)}" x1="70" y1="140" x2="150" y2="140"/>` + S.t(64, 145, "B = " + b, { a: "end" });
    ["00", "01", "10", "11"].forEach((p, i) => { const y = 50 + i * 43, on = i === k; s += `<line class="${W(on)}" x1="260" y1="${y}" x2="330" y2="${y}"/>` + S.t(336, y + 5, `${on ? 1 : 0}  (AB = ${p})`, { a: "start", cls: on ? "a" : "s" }); });
    return S.svg(460, 230, s, { max: 460, label: "Two-to-four decoder" });
  }
  function muxFig(d, s1, s0) {
    const k = s1 * 2 + s0;
    let s = `<polygon class="box" points="180,30 250,60 250,180 180,210"/>` + S.t(215, 124, "MUX", { cls: "s" });
    d.forEach((v, i) => { const y = 55 + i * 43, on = i === k; s += `<line class="${on ? "w hl" : "w dim"}" x1="90" y1="${y}" x2="180" y2="${y}"/>` + S.t(84, y + 5, `${"ABCD"[i]} = ${v}`, { a: "end" }); });
    s += `<line class="w hl" x1="250" y1="120" x2="320" y2="120"/>` + S.t(326, 125, "OUT = " + d[k], { a: "start", cls: "big" });
    s += `<line class="w" x1="205" y1="196" x2="205" y2="235"/>` + S.t(212, 230, `S[1:0] = ${s1}${s0}`, { a: "start", cls: "s" });
    return S.svg(460, 245, s, { max: 460, label: "Four-input multiplexer" });
  }
  const p4 = {
    id: "p4", title: "Decoders and muxes", mins: 20,
    blurb: "A decoder recognises one pattern. A mux picks one input and passes it on.",
    takeaway: "Combinational logic (decision elements): outputs depend only on the inputs right now; nothing is stored. Decoder: n inputs, 2^n outputs; exactly one output is 1 (asserted), the one matching the input pattern. Used to interpret bit patterns, e.g. the LC-3's 4-bit opcode through a 4-to-16 decoder. Mux (multiplexer): selects one of its inputs and connects it to the output; select lines choose which. A 2-to-1 mux: two AND gates (one enabled by S, the other by NOT S) into an OR. A mux has 2^n inputs and n select lines; a 4-input mux needs 2 select lines S[1:0].",
    steps: [
      { k: "learn", title: "Combinational logic", b: [
        `<p>Two kinds of logic structures: ones that <b>store</b> information and ones that don't. Those that don't are <b>combinational</b>: the outputs depend only on the inputs <i>right now</i>, never on the past.</p>`,
        `<p>Three key examples: the decoder, the mux, and the one-bit adder.</p>`,
      ]},
      { k: "play", title: "The decoder", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let a = 1, b = 0;
          const draw = () => { f.innerHTML = decoderFig(a, b); };
          host.append(toggle(["A = 0", "A = 1"], (v) => { a = v; draw(); }, 1), toggle(["B = 0", "B = 1"], (v) => { b = v; draw(); }, 0), f);
          draw();
        },
        `<p>Exactly <b>one</b> output is 1: the one that matches the input pattern. We say that output is <b>asserted</b>. n inputs → 2<sup>n</sup> outputs.</p>`,
      ]},
      { k: "why", title: "What decoders are for", b: [
        `<p>Interpreting a bit pattern. In Chapter 5, each LC-3 instruction has a 4-bit <b>opcode</b> that says what work to do. A 4-to-16 decoder turns it into 16 lines, exactly one of which says “this is an ADD” (or a LOAD, or a BRANCH…).</p>`,
      ]},
      { k: "learn", title: "The 2-to-1 mux", b: [
        `<p>A <b>mux</b> picks one input and connects it to the output. Inside a 2-to-1 mux: A is ANDed with S̅, B is ANDed with S, and the two are ORed.</p>`,
        `<div class="two"><div class="tile"><p><b>S = 0:</b> the B-gate outputs 0 (an AND with a 0 input). The A-gate outputs A. C = A.</p></div><div class="tile"><p><b>S = 1:</b> the A-gate outputs 0. C = B.</p></div></div>`,
      ]},
      { k: "play", title: "A 4-input mux", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let d = [0, 1, 1, 0], s1 = 1, s0 = 0;
          const draw = () => { f.innerHTML = muxFig(d, s1, s0); };
          const bb = bitButtons("0110", (b) => { d = b.split("").map(Number); draw(); }, { label: "Data inputs A to D" });
          host.append(el(`<p class="aside">Data A, B, C, D:</p>`), bb.el, toggle(["S1 = 0", "S1 = 1"], (v) => { s1 = v; draw(); }, 1), toggle(["S0 = 0", "S0 = 1"], (v) => { s0 = v; draw(); }, 0), f);
          draw();
        },
        `<p class="aside">2<sup>n</sup> inputs need n select lines. Four inputs: two select lines, written S[1:0].</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "How many select lines does a 32-input mux need?", a: 5, tol: 0, why: "2⁵ = 32." },
        { t: "num", q: "How many outputs does a decoder with 5 inputs have?", a: 32, tol: 0, why: "2⁵ = 32, exactly one asserted at a time." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a mux do, and what does a decoder do?", model: "A mux selects one of its data inputs, chosen by the select lines, and passes it to the single output. A decoder takes an n-bit pattern and asserts exactly one of its 2^n outputs, the one corresponding to that pattern; all the others are 0." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  function rippleFig(a, b) {
    let c = 0, s = "";
    const sum = [], car = [0];
    for (let i = 0; i < 4; i++) { const ai = +a[3 - i], bi = +b[3 - i], t = ai + bi + c; sum[i] = t % 2; c = t > 1 ? 1 : 0; car[i + 1] = c; }
    for (let i = 0; i < 4; i++) {
      const x = 40 + (3 - i) * 95;
      s += `<rect class="box" x="${x}" y="70" width="64" height="56" rx="6"/>` + S.t(x + 32, 102, "+", { cls: "big" });
      s += `<line class="${W(+a[3 - i])}" x1="${x + 18}" y1="40" x2="${x + 18}" y2="70"/><line class="${W(+b[3 - i])}" x1="${x + 46}" y1="40" x2="${x + 46}" y2="70"/>`;
      s += S.t(x + 18, 34, `A${i}=${a[3 - i]}`, { cls: "s" }) + S.t(x + 46, 22, `B${i}=${b[3 - i]}`, { cls: "s" });
      s += `<line class="${W(sum[i])}" x1="${x + 32}" y1="126" x2="${x + 32}" y2="152"/>` + S.t(x + 32, 168, `S${i}=${sum[i]}`, { cls: "s a" });
      s += `<line class="${W(car[i + 1])}" x1="${x}" y1="98" x2="${x - 31}" y2="98"/>` + S.t(x - 16, 90, `C${i + 1}`, { cls: "s" });
    }
    s += `<line class="w" x1="${40 + 3 * 95 + 64}" y1="98" x2="${40 + 3 * 95 + 84}" y2="98"/>` + S.t(40 + 3 * 95 + 90, 102, "0", { a: "start", cls: "s" });
    return { svg: S.svg(430, 180, s, { max: 430, label: "Four-bit ripple adder" }), sum: sum.slice().reverse().join(""), cout: c };
  }
  const p5 = {
    id: "p5", title: "The one-bit adder", mins: 20,
    blurb: "Three bits in (A, B, carry in), two out (sum, carry out). Chain them to add numbers.",
    takeaway: "Binary addition column by column: each column adds A_i, B_i and the carry in C_i, giving the sum bit S_i and the carry out C_(i+1). One 1 among the three: S = 1, carry 0. Two 1s: S = 0, carry 1. Three 1s: S = 1, carry 1. Gate implementation: one AND gate for each input combination that produces a 1 (7 of the 8 rows; 000 produces nothing), feeding an OR for C_(i+1) and an OR for S_i. Chaining n one-bit adders, with each carry out feeding the next column's carry in (carry into column 0 = 0), adds two n-bit numbers. Historically: full adder (three inputs) vs half adder (two inputs, used where the carry in is 0); the book just says one-bit adder.",
    steps: [
      { k: "learn", title: "One column of addition", b: [
        `<p>Each column adds <b>three</b> bits: A<sub>i</sub>, B<sub>i</sub> and the carry in C<sub>i</sub>. It produces the sum bit S<sub>i</sub> and a carry out C<sub>i+1</sub>.</p>`,
        truthTable(["A_i", "B_i", "C_i"], ["C_i+1", "S_i"], ([a, b, c]) => [(a + b + c) >> 1, (a + b + c) & 1]),
        `<p class="aside">Count the 1s in a row: one 1 → sum 1. Two → sum 0, carry 1. Three → sum 1, carry 1 (3 = 11 in binary).</p>`,
      ]},
      { k: "learn", title: "Gates for it", b: [
        `<p>Give each input row that produces a 1 its own AND gate (inputs inverted where the row has a 0). OR together the AND gates for the rows where S<sub>i</sub> = 1; separately OR the ones where C<sub>i+1</sub> = 1.</p>`,
        `<p>Row 000 gives no 1 at all, so it needs no AND gate: 7 AND gates, 2 OR gates.</p>`,
      ]},
      { k: "play", title: "Chain four of them", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = "0111", b = "0101";
          function draw() { const r = rippleFig(a, b); f.innerHTML = r.svg; ro.innerHTML = readout([["A", `${a} = ${uval(a)}`], ["B", `${b} = ${uval(b)}`], ["Sum", `${r.cout}${r.sum} = ${uval(r.cout + r.sum)}`]]); }
          const A = bitButtons(a, (x) => { a = x; draw(); }, { label: "A" }), B = bitButtons(b, (x) => { b = x; draw(); }, { label: "B" });
          host.append(el(`<p class="aside">A[3:0]:</p>`), A.el, el(`<p class="aside">B[3:0]:</p>`), B.el, f, ro);
          draw();
        },
        `<p class="aside">Each carry out feeds the next column's carry in. Try 0111 + 0001: the carry ripples all the way left. For 16 bits, chain 16 of them.</p>`,
      ]},
      { k: "learn", title: "Full adder, half adder", b: [
        `<p>The rightmost column's carry in is 0, so it really only has two inputs. Historically a two-input adder is a <b>half adder</b> and a three-input one a <b>full adder</b>. The book just calls each one a one-bit adder.</p>`,
        seenHH("Faster adders: carry-lookahead and prefix adders.", "05-building-blocks.html#p1", "Chapter 5"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Column inputs A_i = 1, B_i = 1, C_i = 1. Outputs?", opts: [["S_i = 1, C_i+1 = 1", true, "1 + 1 + 1 = 3 = 11 in binary."], ["S_i = 0, C_i+1 = 1", false, "That's for two 1s."], ["S_i = 1, C_i+1 = 0", false, "That's for one 1."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you add two 8-bit numbers with one-bit adders?", model: "Use eight one-bit adders, one per column. Each adds its A bit, B bit and the carry from the column to its right, producing a sum bit and a carry to the column on its left. The rightmost carry in is 0, and the final carry out is the ninth bit." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "The PLA: any function from a table", mins: 20,
    blurb: "An AND gate for every row, an OR gate for every output. Program the connections.",
    takeaway: "A programmable logic array (PLA) is an AND array followed by an OR array. For n inputs it has 2^n n-input AND gates, one per truth-table row (each is 1 for exactly one input combination). It has one OR gate per output function (output column). To implement a function, connect an AND gate's output to the OR gate if that row has a 1 in that output column: “programming” the connections. A PLA with 2³ three-input ANDs and four ORs can implement any four functions of three variables (e.g., the one-bit adder's sum and carry). Since a PLA uses only AND, OR and NOT, any truth table can be built from them: {AND, OR, NOT} is logically complete.",
    steps: [
      { k: "learn", title: "One AND gate per row", b: [
        `<p>With 3 inputs there are 8 rows. Build 8 three-input AND gates, each wired (with inverters as needed) to output 1 for <b>exactly one</b> row. That's the <b>AND array</b>.</p>`,
        `<p>Then for each output column, an OR gate collects the AND gates of the rows where that column is 1. That's the <b>OR array</b>. Together: a <b>PLA</b>.</p>`,
      ]},
      { k: "play", title: "Program a PLA", b: [
        (host, id) => {
          const rows = el(`<div style="display:grid;gap:6px"></div>`), tt = el(`<div></div>`), ro = el(`<div></div>`);
          let conn = [0, 0, 0, 1, 0, 1, 1, 1];
          const btns = [];
          function draw() {
            btns.forEach((b, i) => { b.textContent = conn[i] ? "connected to W" : "not connected"; b.setAttribute("aria-pressed", String(!!conn[i])); });
            tt.innerHTML = truthTable(["A", "B", "C"], ["W"], (r) => conn[r[0] * 4 + r[1] * 2 + r[2]]);
            const terms = conn.map((v, i) => (v ? bits(i, 3).split("").map((c, j) => "ABC"[j] + (c === "0" ? "̅" : "")).join("") : null)).filter(Boolean);
            ro.innerHTML = readout([["W =", terms.length ? terms.join(" + ") : "0"], ["AND gates used", String(terms.length)]]);
          }
          for (let i = 0; i < 8; i++) {
            const r = el(`<div class="row" style="gap:10px;align-items:center"><span class="mono" style="min-width:12ch">AND for ${bits(i, 3)}</span></div>`);
            const b = btn("", "small");
            b.addEventListener("click", () => { conn[i] = 1 - conn[i]; draw(); });
            btns.push(b); r.appendChild(b); rows.appendChild(r);
          }
          const presets = { "Majority (adder carry)": [0, 0, 0, 1, 0, 1, 1, 1], "Adder sum (parity)": [0, 1, 1, 0, 1, 0, 0, 1], "A AND NOT B": [0, 0, 0, 0, 1, 1, 0, 0], "Clear": [0, 0, 0, 0, 0, 0, 0, 0] };
          host.append(toggle(Object.keys(presets), (k) => { conn = presets[Object.keys(presets)[k]].slice(); draw(); }), rows, ro, tt);
          draw();
        },
        `<p class="aside">Click a row to connect its AND gate to the OR gate W. The truth table follows. Any pattern of 1s you can make is a function the PLA can build. A̅ means NOT A.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "How many AND gates does a full PLA for 4 input variables have?", a: 16, tol: 0, why: "One per row: 2⁴ = 16." },
        { t: "mcq", q: "To build the one-bit adder from a PLA, how many OR gates do you program?", opts: [["2: one for the sum, one for the carry", true, "One OR gate per output column."], ["8", false, "8 is the number of AND gates (rows)."], ["1", false, "There are two output columns."]] },
      ]},
      { k: "why", title: "The proof of completeness", b: [
        `<p>A PLA uses only AND gates, OR gates and inverters, and it can build <b>any</b> truth table. So {AND, OR, NOT} is logically complete. Part 3's claim, proved.</p>`,
        `<p class="aside">Harris & Harris Chapter 2 calls this form “sum of products” and shows how to shrink it with Boolean algebra and Karnaugh maps.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a PLA implement a function given by a truth table?", model: "The AND array has one AND gate per row of the truth table, each producing 1 for exactly one input combination. For each output, the OR array has an OR gate connected to the AND gates of every row where that output is 1. So the OR gate's output is 1 exactly on those rows." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  function rsFig(Sv, Rv, a, b) {
    const t = gate("nand", 170, 70), u = gate("nand", 170, 190);
    let s = t.s + u.s;
    s += `<line class="${W(Sv)}" x1="60" y1="${t.ins[0][1]}" x2="${t.ins[0][0]}" y2="${t.ins[0][1]}"/>` + S.t(54, t.ins[0][1] + 5, "S = " + Sv, { a: "end" });
    s += `<line class="${W(Rv)}" x1="60" y1="${u.ins[1][1]}" x2="${u.ins[1][0]}" y2="${u.ins[1][1]}"/>` + S.t(54, u.ins[1][1] + 5, "R = " + Rv, { a: "end" });
    s += `<line class="${W(a)}" x1="${t.out[0]}" y1="70" x2="350" y2="70"/>` + S.t(356, 75, "a = " + a, { a: "start", cls: "big" });
    s += `<line class="${W(b)}" x1="${u.out[0]}" y1="190" x2="350" y2="190"/>` + S.t(356, 195, "b = " + b, { a: "start" });
    s += `<polyline class="${W(a)}" points="262,70 262,104 126,152 126,${u.ins[0][1]} ${u.ins[0][0]},${u.ins[0][1]}"/>` + S.dot(262, 70);
    s += `<polyline class="${W(b)}" points="282,190 282,156 112,108 112,${t.ins[1][1]} ${t.ins[1][0]},${t.ins[1][1]}"/>` + S.dot(282, 190);
    return S.svg(430, 250, s, { max: 430, label: "R-S latch made of two cross-coupled NAND gates" });
  }
  const p7 = {
    id: "p7", title: "Storing a bit: latches", mins: 25,
    blurb: "Two NAND gates feeding each other remember one bit. Add a write enable to control when.",
    takeaway: "The R-S latch stores one bit: two 2-input NAND gates, each output feeding one input of the other; the other inputs S and R are normally held at 1 (the quiescent state, storing a value with nothing trying to change it). Output a is the stored value. If a = 1, the lower NAND outputs b = 0, which keeps a = 1; if a = 0, b = 1 keeps a = 0. Set (store 1): make S = 0 briefly with R = 1. Reset/clear (store 0): make R = 0 briefly with S = 1. The value stays after S or R returns to 1, because one 0 input is enough to hold a NAND's output at 1. Never let S and R both be 0: a and b would both be 1 and the final state would depend on the transistors' electrical properties. At power-up the latch can be in either state. Gated D latch: two more NAND gates in front of the R-S latch, so the latch is set to D, but only while WE (write enable) is 1. With WE = 0, S = R = 1 and the latch holds.",
    steps: [
      { k: "learn", title: "Logic that remembers", b: [
        `<p>Combinational logic forgets: its outputs depend only on the inputs now. To build a computer we also need to <b>store</b> information.</p>`,
        `<p>The simplest storage element: two NAND gates, each one's output feeding back into the other. It's called an <b>R-S latch</b>, and it stores one bit.</p>`,
      ]},
      { k: "play", title: "Set, reset, hold", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), vd = el(`<span class="verdict"></span>`);
          let Sv = 1, Rv = 1, a = 0;
          function draw() {
            let b;
            if (Sv === 0 && Rv === 0) { a = 1; b = 1; }
            else if (Sv === 0) { a = 1; b = 0; }
            else if (Rv === 0) { a = 0; b = 1; }
            else b = 1 - a;
            f.innerHTML = rsFig(Sv, Rv, a, b);
            vd.className = "verdict " + (Sv === 0 && Rv === 0 ? "no" : Sv && Rv ? "ok" : "mid");
            vd.textContent = Sv === 0 && Rv === 0 ? "Forbidden: both outputs are 1. When S and R return to 1, the final state depends on the transistors, not the logic." : Sv && Rv ? `Quiescent: holding a = ${a}.` : Sv === 0 ? "Setting: a is forced to 1." : "Clearing: a is forced to 0.";
          }
          host.append(toggle(["S = 0", "S = 1"], (v) => { Sv = v; draw(); }, 1), toggle(["R = 0", "R = 1"], (v) => { Rv = v; draw(); }, 1), f, vd);
          draw();
        },
        `<p class="aside">Make S = 0, then put it back to 1: the latch keeps the 1. Then pulse R to 0. Highlighted wires carry 1.</p>`,
      ]},
      { k: "why", title: "Why it holds", b: [
        `<p>Say a = 1 and S = R = 1. The lower NAND has inputs a = 1 and R = 1, so b = 0. The upper NAND has an input b = 0, so its output a = 1. The loop keeps itself going.</p>`,
        `<p>Pulse S to 0: a goes to 1 no matter what. When S returns to 1, b = 0 is still holding a at 1, because <b>one 0 input is enough</b> to keep a NAND's output at 1.</p>`,
      ]},
      { k: "learn", title: "The rules", b: [
        `<ul><li><b>Set</b> (store 1): S = 0 briefly, R = 1.</li><li><b>Clear</b> (store 0): R = 0 briefly, S = 1.</li><li><b>Hold</b>: S = R = 1 (the <b>quiescent</b> state).</li><li><b>Never</b> S = R = 0 together.</li></ul>`,
        `<p class="aside">At power-up a latch can hold either value. That's fine: we never use it until we've set or cleared it.</p>`,
      ]},
      { k: "learn", title: "The gated D latch", b: [
        `<p>We want to choose <b>when</b> the latch changes. Put two more NAND gates in front, controlled by <b>WE</b> (write enable):</p>`,
        `<div class="two"><div class="tile"><h3>WE = 0</h3><p>Both front NANDs output 1: S = R = 1. The latch holds.</p></div><div class="tile"><h3>WE = 1</h3><p>D = 1 makes S = 0 (set); D = 0 makes R = 0 (clear). The latch takes the value of D.</p></div></div>`,
      ]},
      { k: "play", title: "Watch a D latch", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let D = 0, WE = 0, Q = 0;
          const hist = { D: [], WE: [], Q: [] };
          function step() { if (WE) Q = D; hist.D.push(D); hist.WE.push(WE); hist.Q.push(Q); ["D", "WE", "Q"].forEach((k) => { if (hist[k].length > 12) hist[k].shift(); }); f.innerHTML = wave([{ name: "D", v: hist.D }, { name: "WE", v: hist.WE }, { name: "Q", v: hist.Q, cls: "hl" }], { dx: 28 }); }
          const t = btn("Next moment →", "primary");
          t.addEventListener("click", step);
          host.append(toggle(["D = 0", "D = 1"], (v) => { D = v; }, 0), toggle(["WE = 0", "WE = 1"], (v) => { WE = v; }, 0), t, f);
          step();
        },
        `<p class="aside">Set D and WE, then press “Next moment”. While WE = 1, Q follows D. While WE = 0, Q holds, whatever D does.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does the write enable signal do in a gated D latch?", model: "It controls when the latch can change. While WE is 0, the extra gates keep S and R at 1, so the latch holds its value whatever D does. While WE is 1, the latch is set to whatever D is: D = 1 sets it, D = 0 clears it." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Memory", mins: 25,
    blurb: "Locations with addresses. A decoder picks the word; AND and OR gates read it out.",
    takeaway: "Memory is many locations, each with a unique address, each storing a value. Address space: the number of uniquely identifiable locations; n address bits give 2^n locations (2^10 ≈ a thousand = kilo, 2^20 ≈ a million = mega, 2^30 ≈ a billion = giga). “2 GB” really means 2^31 = 2,147,483,648 locations of one byte each. Addressability: the number of bits in each location. Most memories are byte-addressable (one ASCII character per location); scientific machines are often 64-bit addressable (one double-precision float each). A 2²-by-3-bit memory has 4 locations of 3 bits; address A[1:0], data D[2:0] (bits numbered right to left from 0; [high:low] is high−low+1 bits). Read: the address decoder asserts one word line; each stored bit is ANDed with its word line and ORed with the same bit of the other words: effectively a mux. Write: with WE asserted, D[2:0] goes into the gated latches on the asserted word line.",
    steps: [
      { k: "learn", title: "Addresses and contents", b: [
        `<p>Memory is a set of <b>locations</b>. Each has a unique <b>address</b> and holds a value.</p>`,
        `<div class="two"><div class="tile"><h3>Address space</h3><p>How many locations. n address bits → 2<sup>n</sup> locations.</p></div><div class="tile"><h3>Addressability</h3><p>How many bits each location holds. Most memories: 8 (a byte).</p></div></div>`,
        `<p>“2 GB of memory” really means 2<sup>31</sup> = 2,147,483,648 locations, one byte each.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A memory has 16-bit addresses and each location holds 16 bits (like the LC-3). How many bits does it store in total?", a: 1048576, tol: 0, unit: "bits", hint: "2¹⁶ locations × 16 bits each.", why: "65,536 × 16 = 1,048,576 bits (1 Mbit, or 128 KB)." },
        { t: "mcq", q: "Why are most memories byte-addressable?", opts: [["History: computers started out processing text, and one ASCII character is one byte, so each character gets its own address", true, "That's the book's reason."], ["Bytes are faster to read than words", false, "Not the reason given."]] },
      ]},
      { k: "play", title: "A 2²-by-3-bit memory", b: [
        (host, id) => {
          const out = el(`<div class="tbl"></div>`), ro = el(`<div></div>`);
          const mem = ["010", "110", "001", "101"];
          let A = 3, WE = 0, Din = "111";
          function draw(msg) {
            out.innerHTML = `<table><thead><tr><th>address</th><th>word line</th><th>D[2]</th><th>D[1]</th><th>D[0]</th></tr></thead><tbody>${mem.map((w, i) => `<tr${i === A ? ' style="background:var(--accent-soft)"' : ""}><td class="mono">${bits(i, 2)}</td><td>${i === A ? "<b>1 (asserted)</b>" : "0"}</td>${w.split("").map((c) => `<td class="mono">${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
            ro.innerHTML = readout([["A[1:0]", bits(A, 2)], ["D[2:0] out", mem[A]], ["Last action", msg || "read"]]);
          }
          const go = btn("Apply (one clock)", "primary");
          go.addEventListener("click", () => { if (WE) { mem[A] = Din; draw(`wrote ${Din} to location ${A}`); } else draw(`read ${mem[A]} from location ${A}`); });
          const dB = bitButtons(Din, (x) => { Din = x; }, { label: "Data in" });
          host.append(toggle(["A = 00", "A = 01", "A = 10", "A = 11"], (k) => { A = k; draw(); }, 3), toggle(["WE = 0 (read)", "WE = 1 (write)"], (k) => { WE = k; }, 0), el(`<p class="aside">Data in D[2:0]:</p>`), dB.el, go, out, ro);
          draw();
        },
        `<p class="aside">The decoder turns A[1:0] into four <b>word lines</b>; exactly one is asserted. Each bit is ANDed with its word line, then ORed with the same bit of the other words, so only the selected word reaches D[2:0]. That's a mux, with the decoder doing the selecting.</p>`,
      ]},
      { k: "learn", title: "Bit-range notation", b: [
        `<p>Bits are numbered from the right, starting at 0. <b>A[1:0]</b> means bits 1 down to 0: two bits. <b>D[2:0]</b>: three bits. In general [high:low] is high − low + 1 bits.</p>`,
        `<p class="aside">IR[15:12] would be the top 4 bits of a 16-bit register. You'll see exactly that in Chapter 5.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How is one word read out of the small memory?", model: "The address goes into a decoder, which asserts exactly one word line. Every stored bit is ANDed with its own word line, so only the selected word's bits get through; the same bit position of all the words is then ORed together, giving the selected word on D[2:0]." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const SODA = { nodes: [{ id: "A", x: 210, y: 50, label: "A", sub: "open" }, { id: "B", x: 100, y: 200, label: "B", sub: "5¢" }, { id: "C", x: 320, y: 200, label: "C", sub: "10¢" }],
    edges: [{ from: "A", to: "B", label: "5¢", bend: 30, lo: 16 }, { from: "B", to: "A", label: "10¢", bend: 30, lo: 16 }, { from: "A", to: "C", label: "10¢", bend: -30, lo: 16 }, { from: "C", to: "A", label: "5¢, 10¢", bend: -30, lo: 30 }, { from: "B", to: "C", label: "5¢", bend: -10 }] };
  const sodaNext = { A: { n: "B", d: "C" }, B: { n: "C", d: "A" }, C: { n: "A", d: "A" } };
  const p9 = {
    id: "p9", title: "State and finite state machines", mins: 25,
    blurb: "A sequential lock remembers history. A state is a snapshot. An FSM is states plus arrows.",
    takeaway: "Sequential logic circuits contain storage elements, so their outputs depend on the inputs now AND on what happened before (the stored history). A dial lock (R13-L22-R3) is really a sequential lock: R22-L13-R3 uses the same numbers but won't open. A four-wheel lock is truly combinational: only the current digits matter. The state of a system is a snapshot of all its relevant elements at one moment. The dial lock needs four states: A (nothing correct yet), B (R13 done), C (R13, L22 done), D (open). A finite state machine has five elements: a finite number of states, of external inputs, of external outputs, an explicit specification of all state transitions, and of what determines each output. A state diagram draws states as circles and transitions as arcs labelled with the input causing them (current state → next state). The next state depends on the current state and the current input. In this book, outputs depend only on the current state. A 15¢ soft-drink machine taking nickels and dimes needs only three states.",
    steps: [
      { k: "learn", title: "Two kinds of combination lock", b: [
        `<div class="two"><div class="tile"><h3>Dial lock</h3><p>R13, L22, R3. Using the same numbers in another order (R22, L13, R3) fails. It cares about <b>history</b>: it's really a <b>sequential</b> lock.</p></div><div class="tile"><h3>Four-wheel lock</h3><p>Line up the right four digits and it opens, however you got there. Truly <b>combinational</b>.</p></div></div>`,
        `<p>A <b>sequential logic circuit</b> = combinational logic + storage elements. Its outputs depend on the inputs now <i>and</i> on the stored history.</p>`,
      ]},
      { k: "learn", title: "State", b: [
        `<div class="key">The <b>state</b> of a system is a snapshot of all its relevant elements at one moment.</div>`,
        `<p>The dial lock needs four states: A (nothing correct yet), B (just did R13), C (did R13 then L22), D (open). A basketball game's state is its scoreboard. A tic-tac-toe game's state is the board.</p>`,
      ]},
      { k: "learn", title: "A finite state machine", b: [
        `<p>Five things define a <b>finite state machine</b>:</p>`,
        `<ol><li>a finite number of <b>states</b></li><li>a finite number of external <b>inputs</b></li><li>a finite number of external <b>outputs</b></li><li>every <b>state transition</b>, explicitly</li><li>what determines each <b>output</b>, explicitly</li></ol>`,
        `<p>A <b>state diagram</b> draws states as circles and transitions as arrows (arcs), each labelled with the input that causes it.</p>`,
      ]},
      { k: "play", title: "A 15¢ soft-drink machine", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), log = el(`<p class="aside"></p>`);
          let cur = "B", lastE = null;
          function draw() { f.innerHTML = fsm(SODA.nodes, SODA.edges, { cur, hotEdge: lastE, H: 250, label: "Soft drink machine state diagram" }); log.textContent = cur === "A" ? "State A: at least 15¢ inserted. Open: take your drink." : `State ${cur}: ${cur === "B" ? "5" : "10"}¢ inserted. Locked.`; }
          const n = btn("Insert a nickel (5¢)", "primary"), d = btn("Insert a dime (10¢)");
          n.addEventListener("click", () => { const nx = sodaNext[cur].n; lastE = SODA.edges.find((e) => e.from === cur && e.to === nx && /5/.test(e.label)); cur = nx; draw(); });
          d.addEventListener("click", () => { const nx = sodaNext[cur].d; lastE = SODA.edges.find((e) => e.from === cur && e.to === nx && /10/.test(e.label)); cur = nx; draw(); });
          const row = el(`<div class="row"></div>`); row.append(n, d);
          host.append(row, f, log);
          draw();
        },
        `<p class="aside">The output (open or locked) depends only on the state. The next state depends on the current state <b>and</b> the coin. No change is given: in state C a dime still just opens it.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "The soft-drink machine is in state B (5¢). Which input takes it straight to open?", opts: [["A dime", true, "5 + 10 = 15."], ["A nickel", false, "5 + 5 = 10: that's state C."], ["Either coin", false, "Only from C does either coin open it."]] },
        { t: "mcq", q: "Tic-tac-toe has 9 cells, each X, O or empty. What's an upper bound on its number of states?", opts: [["3⁹ = 19,683", true, "The real number is far smaller, because the rules forbid most boards."], ["9³ = 729", false, "Each of 9 cells has 3 choices: 3 × 3 × … nine times."], ["2⁹ = 512", false, "Each cell has 3 possibilities, not 2."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What decides the next state of a finite state machine, and what decides its output (in this book)?", model: "The next state is decided by the current state together with the current external input. In all the machines in this book, the output is decided by the current state alone." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const DS = { nodes: [{ id: "A", x: 90, y: 70, label: "00", sub: "off" }, { id: "B", x: 330, y: 70, label: "01", sub: "1, 2" }, { id: "C", x: 330, y: 220, label: "10", sub: "1–4" }, { id: "D", x: 90, y: 220, label: "11", sub: "all" }],
    edges: [{ from: "A", to: "B", label: "1" }, { from: "B", to: "C", label: "1" }, { from: "C", to: "D", label: "1" }, { from: "D", to: "A", label: "0, 1", lo: 24 }, { from: "B", to: "A", label: "0", bend: 30 }, { from: "C", to: "A", label: "0", bend: 0, lo: 10 }, { from: "A", to: "A", label: "0", ang: 180 }] };
  const LIGHTS = { A: [], B: [1, 2], C: [1, 2, 3, 4], D: [1, 2, 3, 4, 5] };
  function signFig(st) {
    const P = { 1: [50, 40], 2: [50, 140], 3: [110, 62], 4: [110, 118], 5: [170, 90] };
    let s = `<rect x="16" y="10" width="200" height="160" rx="10" style="fill:var(--paper);stroke:var(--line)"/>`;
    Object.entries(P).forEach(([k, [x, y]]) => { const on = LIGHTS[st].includes(+k); s += `<circle cx="${x}" cy="${y}" r="17" style="fill:${on ? "var(--accent)" : "var(--card)"};stroke:var(--ink)"/>` + S.t(x, y + 5, k, { cls: on ? "" : "s m" }); });
    s += S.t(116, 196, "DANGER · MOVE RIGHT", { cls: "s b" });
    return S.svg(240, 210, s, { max: 240, label: "Danger sign lights" });
  }
  const p10 = {
    id: "p10", title: "The clock and a synchronous FSM", mins: 25,
    blurb: "A computer changes state once per clock cycle. Example: a flashing danger sign.",
    takeaway: "The lock and drink machine are asynchronous: transitions happen whenever inputs arrive. Computers are synchronous: state transitions happen one after another at identical fixed intervals, controlled by a synchronous FSM and the clock. The clock alternates 0 and 1; a clock cycle starts at a 0→1 transition and ends at the next one. 2 GHz = 2 billion cycles per second, 0.5 ns each; the FSM makes one transition per cycle. Danger sign (“Danger, Move Right”, five lights): with the switch on, it cycles every second through all off → lights 1, 2 → lights 1–4 → all five, then repeats; with the switch off, it goes to (and stays in) all off. Four states need two storage elements: A = 00, B = 01, C = 10, D = 11 (element 2 holds the high bit). Combinational circuit 1 turns the current state into the light outputs (light 5 is the AND of both bits, state 11; lights 3 and 4 are on in states 10 and 11). Combinational circuit 2 turns the current state and the switch into the next state (element 2 becomes 1 only if the switch is on and the state is 01 or 10).",
    steps: [
      { k: "learn", title: "Asynchronous vs synchronous", b: [
        `<p>The soft-drink machine waits as long as you like between coins. Its transitions happen whenever an input arrives: it's <b>asynchronous</b>.</p>`,
        `<p>Computers are <b>synchronous</b>: one state transition per fixed interval, set by a <b>clock</b>.</p>`,
        fig(wave([{ name: "clock", v: [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0] }], { dx: 30, marks: [{ t: 0, label: "cycle" }, { t: 4, label: "cycle" }, { t: 8, label: "cycle" }] })),
        `<p>A clock cycle starts when the clock goes 0 → 1 and ends at the next 0 → 1. A 2 GHz laptop has 2 billion cycles per second, each 0.5 ns.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "How long is one clock cycle at 3.2 GHz?", a: 0.3125, tol: 0.01, unit: "ns", hint: "Period = 1/f.", why: "1 / 3.2×10⁹ = 0.3125 ns, about 312 ps." },
      ]},
      { k: "play", title: "The danger sign", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), g = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let cur = "A", sw = 1;
          const next = { A: "B", B: "C", C: "D", D: "A" };
          function draw() { f.innerHTML = signFig(cur); g.innerHTML = fsm(DS.nodes, DS.edges, { cur, H: 270, label: "Danger sign controller state diagram" }); ro.innerHTML = readout([["State (element 2, element 1)", { A: "00", B: "01", C: "10", D: "11" }[cur]], ["Lights on", LIGHTS[cur].join(", ") || "none"]]); }
          const t = btn("Clock tick (1 s) →", "primary");
          t.addEventListener("click", () => { cur = sw ? next[cur] : "A"; draw(); });
          host.append(toggle(["Switch OFF (0)", "Switch ON (1)"], (v) => { sw = v; }, 1), t, f, ro, g);
          draw();
        },
        `<p class="aside">With the switch on, each tick moves one step: 00 → 01 → 10 → 11 → 00. Turn it off and the next tick goes to 00 and stays there.</p>`,
      ]},
      { k: "learn", title: "The circuit", b: [
        `<p>Four states need <b>two</b> storage elements: A = 00, B = 01, C = 10, D = 11. Storage element 2 holds the high bit.</p>`,
        `<div class="two"><div class="tile"><h3>Combinational circuit 1</h3><p>Current state → lights. Light 5 is on only in state 11: an AND of both bits. Lights 3 and 4 are on in states 10 and 11.</p></div><div class="tile"><h3>Combinational circuit 2</h3><p>Current state + switch → next state. Element 2 must become 1 only if the switch is on and the state is 01 or 10.</p></div></div>`,
        `<p class="aside">The book's Figure 3.32 shows the gates. The exercises ask you to explain the rest of them, so they're left for you.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Using the state assignment above, lights 3 and 4 are on exactly when…", opts: [["the high bit (storage element 2) is 1", true, "States 10 and 11. So lights 3–4 can be driven by that bit (the book's OR gate X does the same job)."], ["the low bit is 1", false, "The low bit is 1 in 01 and 11, but lights 3–4 are off in 01."], ["both bits are 1", false, "That's light 5 only."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What are the two combinational circuits in the danger-sign controller for?", model: "One computes the outputs, which lights are on, from the current state stored in the two storage elements. The other computes the next state from the current state and the switch, and feeds it back into the storage elements so it becomes the current state on the next clock cycle." },
      ]},
    ],
  };

  /* =============== PART 11 =============== */
  /* Quarter-cycle slots: clock 1,1,0,0 per cycle (a cycle starts at the rising edge). */
  const CLK = [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0];
  const DIN = [0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1];
  function latchQ() { let q = 0; return DIN.map((d, i) => (q = CLK[i] ? d : q)); }
  function ffQ() { let q = 0; return DIN.map((d, i) => { if (i > 0 && CLK[i] === 1 && CLK[i - 1] === 0) q = DIN[i - 1]; return q; }); }
  const p11 = {
    id: "p11", title: "Flip-flops and registers", mins: 25,
    blurb: "Why a gated latch fails in a state machine, and how a master/slave flip-flop fixes it.",
    takeaway: "If an FSM's storage elements were gated D latches clocked by WE, then while WE = 1 the next-state logic's new outputs would immediately change the stored bits, which would change the next-state logic's outputs again, round and round: the state would be unpredictable. We need storage that can be read throughout the current clock cycle and written only at the start of the next. A master/slave flip-flop is two gated D latches: the master is written while the clock is 0 (second half B of the cycle), the slave while the clock is 1. During half A the master can't change, so the slave shows the current state all cycle; during half B the slave can't change while the master captures the next state. At the start of the next cycle the slave takes the master's value. A register is a set of n flip-flops storing one n-bit value. The LC-3's data path (Chapter 5) has 16-bit registers PC, IR, MAR, MDR, a register file of eight 16-bit registers, 1-bit registers N, Z, P, plus muxes, an adder and an ALU; the numbers on its wires say how many bits each carries.",
    steps: [
      { k: "learn", title: "The problem with latches", b: [
        `<p>Suppose the danger sign's storage elements were gated D latches, with the clock as WE. While the clock is 1, the latches are open:</p>`,
        `<ol><li>the next-state logic's outputs flow straight into the latches,</li><li>which changes the current state,</li><li>which changes the next-state logic's outputs,</li><li>which flow straight in again…</li></ol>`,
        `<p>The state races around the loop. By the end of the cycle you have no idea what state the machine is in, and the lights flicker.</p>`,
      ]},
      { k: "learn", title: "What we need", b: [
        `<div class="key">Storage that can be <b>read</b> all through the current clock cycle, and <b>written</b> only at the start of the next one.</div>`,
        `<p>That's a <b>flip-flop</b>. One kind: the <b>master/slave flip-flop</b>, two gated D latches in a row. The master's WE is 1 when the clock is 0; the slave's WE is 1 when the clock is 1.</p>`,
      ]},
      { k: "play", title: "Latch vs flip-flop", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let k = 2;
          function draw() {
            const sig = [{ name: "clock", v: CLK }, { name: "D", v: DIN }];
            if (k !== 1) sig.push({ name: "latch Q", v: latchQ(), cls: k === 0 ? "hl" : "" });
            if (k !== 0) sig.push({ name: "flip-flop Q", v: ffQ(), cls: k === 1 ? "hl" : "" });
            f.innerHTML = wave(sig, { dx: 22, x0: 90, marks: [0, 4, 8, 12].map((t) => ({ t })) });
          }
          host.append(toggle(["Latch", "Flip-flop", "Both"], (i) => { k = i; draw(); }, 2), f);
          draw();
        },
        `<p class="aside">Dashed lines mark the start of each clock cycle. The latch output follows D whenever the clock is 1, so it can change several times a cycle. The flip-flop output changes only at the dashed lines, to the value D had just before.</p>`,
      ]},
      { k: "why", title: "How the master/slave pair does it", b: [
        `<p><b>First half (clock 1):</b> the slave is open but the master is closed. The slave just shows the master's value, the current state, all half-cycle. The next-state logic computes from it.</p>`,
        `<p><b>Second half (clock 0):</b> the master is open and captures the next state; the slave is closed, so the output still doesn't change.</p>`,
        `<p><b>Next rising edge:</b> the slave opens and shows the master's new value. That's the new current state, steady for the whole new cycle.</p>`,
      ]},
      { k: "learn", title: "Registers", b: [
        `<p>A <b>register</b> is n flip-flops side by side, storing one n-bit value. It's read all cycle and written at the end of the cycle.</p>`,
        `<p>The LC-3 (Chapter 5) has 16-bit registers PC, IR, MAR and MDR, a <b>register file</b> of eight 16-bit registers, and three 1-bit registers N, Z, P. Its data path also has five muxes, an adder and an ALU: parts you now know how to build.</p>`,
        seenHH("Flip-flops, registers and timing in depth.", "03-sequential-logic.html#p1", "Chapter 3"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "How many flip-flops are in the LC-3's register file (eight 16-bit registers)?", a: 128, tol: 0, why: "8 × 16 = 128." },
        { t: "mcq", q: "Why does a state machine need flip-flops rather than gated latches?", opts: [["With latches, the new state flows back through the logic and changes again within the same cycle", true, "Flip-flops update once, at the clock edge, and hold steady all cycle."], ["Latches can't store a bit", false, "They can; the problem is when they change."], ["Flip-flops use fewer transistors", false, "They use more: two latches each."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain in two sentences how a master/slave flip-flop works.", model: "It's two gated latches in series: the master is open while the clock is 0 and the slave while the clock is 1, so they're never open at the same time. During the second half of a cycle the master captures the input, and at the start of the next cycle the slave passes it to the output, where it stays steady for the whole cycle." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp3", eyebrow: "Patt & Patel · Chapter 3", title: "Digital Logic Structures",
    intro: `<p>Eleven parts: transistors as switches, gates built from them, logical completeness, decoders and muxes, the one-bit adder, the PLA, latches, memory, state machines, the clock, and flip-flops.</p><p>By the end you'll recognise most of the parts of a real computer's data path. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. There are many: do them in sittings of 10. They test whether the ideas stuck, so don't expect them to look like the questions here.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11],
    summary: `
      <h3>Transistors and gates</h3>
      <p>N-type: closed when gate = 1.2 V. P-type: closed when gate = 0 V. CMOS uses both. NOR: P-types in series, N-types in parallel; NAND: the reverse. OR = NOR + NOT, AND = NAND + NOT. Never connect a P-type to ground or an N-type to the supply (≈0.5 V lost).</p>
      <h3>Combinational logic</h3>
      <p>Decoder: n in, 2<sup>n</sup> out, one asserted. Mux: 2<sup>n</sup> inputs, n select lines. One-bit adder: (A, B, C<sub>in</sub>) → (S, C<sub>out</sub>); chain n for n bits. PLA: one AND per row, one OR per output. {AND, OR, NOT} and NAND alone are logically complete.</p>
      <h3>Storage</h3>
      <p>R-S latch: two cross-coupled NANDs; S = 0 sets, R = 0 clears, both 1 holds, never both 0. Gated D latch: stores D while WE = 1. Memory: address space 2<sup>n</sup>, addressability = bits per location; decoder → word line → AND/OR read.</p>
      <h3>Sequential logic</h3>
      <p>State = snapshot of everything relevant. FSM: states, inputs, outputs, transitions, output rules. Next state = f(current state, input); output = f(current state). Synchronous FSMs change state once per clock cycle (period = 1/f).</p>
      <h3>Flip-flops</h3>
      <p>Master/slave: master open when clock = 0, slave when clock = 1; output changes only at the start of a cycle. Register = n flip-flops.</p>`,
  };
  Course.start(window.CHAPTER);
})();
