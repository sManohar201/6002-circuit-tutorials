(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const { cmosGate, spCount, spDual, sv, listing, truthTable, wave, inverter } = Digital;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const c = (t) => `<code>${t}</code>`;
  const seenHH = (html, href, where) => `<div class="key"><b>Seen in Harris & Harris:</b> ${html} <a href="../hh/${href}">${where} →</a></div>`;
  const sup = (v) => "10" + String(v).replace("-", "⁻").split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d] || d).join("");

  /* =============== PART 1 =============== */
  const CHIPS = [[1971, 2300, "4004"], [1978, 29000, "8086"], [1985, 275000, "386"], [1993, 3.1e6, "Pentium"], [2000, 42e6, "Pentium 4"], [2008, 820e6, "Core 2 Quad"]];
  const p1 = {
    id: "p1", title: "Fifty years of scaling", mins: 20,
    blurb: "From a two-transistor IC to billions, and why CMOS won.",
    takeaway: "1947: Bardeen and Brattain's point-contact transistor at Bell Labs. 1958: Kilby's first IC (two transistors, TI). 2008: Itanium over 2 billion transistors; a 16 Gb Flash over 4 billion: about 53% compound annual growth for 50 years. Bipolar transistors came first but their quiescent base current limits integration; MOSFETs draw almost no control current when idle. 1963: Wanlass (Fairchild) made CMOS gates using nanowatts, six orders of magnitude less than bipolar. pMOS-only, then nMOS processes (Intel 1101 SRAM, 4004) came first, but nMOS gates burn power while idle; in the 1980s CMOS took over nearly all digital logic. Moore's Law (1965): transistor counts double regularly (18 months then; Intel microprocessors every 26 months). SSI (<10 gates), MSI (<1000), LSI (<10,000), then VLSI. Dennard scaling: smaller transistors are faster, lower power, cheaper. Clock frequency doubled every ~34 months until the power wall around 2004 (≈3 GHz); now performance comes from more cores. Tiny transistors leak, so idle power matters again. Feature size: 10 µm (4004, 1971) to 45 nm (Core 2 Duo, 2008); a new node every 2–3 years, 30% smaller, twice the density. Design costs rise exponentially, so leading-edge processes suit only huge-volume or cutting-edge chips.",
    steps: [
      { k: "learn", title: "From one transistor to billions", b: [
        `<p>1947: the first transistor (Bell Labs). 1958: Kilby's first integrated circuit, two transistors. 2008: a single chip with over 2 billion.</p>`,
        `<p>That's roughly <b>53% growth per year for 50 years</b>. No other technology has grown so fast for so long.</p>`,
        `<p class="aside">And unusually, shrinking a transistor makes it faster, lower power <i>and</i> cheaper all at once. Most engineering is trade-offs; this was a free lunch for decades.</p>`,
      ]},
      { k: "learn", title: "Why CMOS won", b: [
        `<div class="two"><div class="tile"><h3>Bipolar</h3><p>Reliable, fast, but its control (base) terminal draws current <b>even when idle</b>. That limits how many fit on a chip.</p></div><div class="tile"><h3>MOSFET</h3><p>The gate draws almost <b>no current</b> when idle.</p></div></div>`,
        `<p>1963: Wanlass built gates from both nMOS and pMOS: <b>CMOS</b>, using nanowatts, a million times less than bipolar. nMOS-only chips (the Intel 4004) came first because they were cheaper, but they burn power while idle. By the 1980s, with hundreds of thousands of transistors per chip, CMOS took over.</p>`,
      ]},
      { k: "play", title: "Moore's Law", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let T = 26;
          function draw() {
            const line = (y) => Math.log10(2300) + ((y - 1971) * 12 / T) * Math.log10(2);
            f.innerHTML = plot({ x: [1970, 2010], y: [3, 9.5], xt: [1970, 1980, 1990, 2000, 2010], yt: [3, 4, 5, 6, 7, 8, 9], ytf: sup, xl: "year", yl: "transistors (Intel)", padL: 56,
              series: [{ f: line, cls: "s2" }], marks: CHIPS.map(([y, n, l]) => ({ x: y, y: Math.log10(n), label: l, dy: 16, dx: y > 2004 ? -10 : 8, a: y > 2004 ? "end" : "start" })), label: "Intel microprocessor transistor counts" });
            ro.innerHTML = readout([["Doubling every", T + " months"], ["Growth per year", fmt((Math.pow(2, 12 / T) - 1) * 100, 3) + "%"]]);
          }
          host.append(f, slider({ id: id + "-t", label: "Doubling time", min: 12, max: 40, step: 1, value: T, show: (x) => x + " months" }, (x) => { T = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Moore (1965) saw counts doubling every 18 months. Intel's processors have actually doubled about every 26 months. Fit the line by eye.</p>`,
      ]},
      { k: "learn", title: "Feature size and the power wall", b: [
        `<p>The <b>feature size</b> is the smallest transistor dimension a process can build: 10 µm for the 4004 (1971), 45 nm for the Core 2 Duo (2008). A new <b>node</b> arrives every 2–3 years, about <b>30% smaller</b> in each direction, fitting <b>twice</b> as many transistors in the same area (0.7 × 0.7 ≈ 0.5).</p>`,
        `<p>Clock speeds doubled every ~34 months, until about 2004, when they hit the <b>power wall</b> near 3 GHz. Since then, performance comes from more cores. And transistors are now so small they never quite turn off: <b>leakage</b> makes idle power a big deal again.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Start at 180 nm and shrink by 0.7× per node. What is the feature size after 5 nodes?", a: 30.25, tol: 0.02, unit: "nm", hint: "180 × 0.7⁵.", why: "180 × 0.168 = 30.3 nm. Five nodes is roughly 10–15 years." },
        { t: "mcq", q: "Why did clock frequencies stop rising around 2004?", opts: [["Power: faster switching of ever more transistors made chips too hot", true, "The power wall. Performance now comes from parallel cores."], ["Transistors stopped getting smaller", false, "They kept shrinking; that's why core counts rose."], ["Software couldn't use higher speeds", false, "It's a physical limit: power density."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why did CMOS replace bipolar and nMOS-only logic?", model: "Both bipolar and nMOS logic draw current even when the circuit is idle (base current in bipolar, a constant path in nMOS gates). With hundreds of thousands of transistors per chip, that static power became unacceptable. Static CMOS has, ideally, no current path from supply to ground when idle, so it uses far less power." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Transistors as switches, again", mins: 15,
    blurb: "A quick recap of nMOS and pMOS as switches, in this book's language.",
    takeaway: "Silicon is doped with group V (arsenic, n-type, free electrons) or group III (boron, p-type, holes); a p–n junction is a diode. A MOSFET is a gate (polysilicon since the 1970s; metal gates returned in 2007) over thin SiO₂ over the substrate (also called body or bulk). nMOS: p-type body (grounded), n+ source and drain; a high gate voltage inverts the surface into an n-type channel: ON. pMOS: n-type body (in an n-well, held at V_DD), p+ source and drain; ON when the gate is low; drawn with a bubble. Source and drain are physically interchangeable. V_DD (POWER, logic 1) was 5 V and is now about 1 V; GND (V_SS) is 0. Switch model: nMOS ON when g = 1, pMOS ON when g = 0.",
    steps: [
      { k: "learn", title: "Recap", b: [
        `<p>You met this in Harris & Harris. In this book's words: the transistor is a stack of a conducting <b>gate</b>, an insulating <b>oxide</b>, and the silicon <b>substrate</b> (also called the <b>body</b> or <b>bulk</b>). Source and drain sit on either side of the gate and are physically interchangeable.</p>`,
        `<div class="two"><div class="tile"><h3>nMOS</h3><p>p-type body, tied to GND. n+ source/drain. Gate high → channel inverts → <b>ON</b>.</p></div><div class="tile"><h3>pMOS</h3><p>n-type body (a <b>well</b>), tied to V<sub>DD</sub>. p+ source/drain. Gate low → <b>ON</b>. Bubble on the symbol.</p></div></div>`,
        seenHH("Doping, the MOSFET sandwich, and the switch model.", "01-zero-to-one.html#p8", "Chapter 1, Part 8"),
      ]},
      { k: "learn", title: "Supplies", b: [
        `<p><b>V<sub>DD</sub></b> (POWER, logic 1): 5 V in the 1970s–80s, then 3.3, 2.5, 1.8, 1.5, 1.2, 1.0 V… as transistors became too small to survive higher voltages. <b>GND</b> (V<sub>SS</sub>, logic 0): 0 V.</p>`,
        `<p class="aside">n+ and p+ mean heavily doped. Since the 1970s gates have been polysilicon (the name MOS stuck); metal gates came back in 2007 to solve materials problems.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "ON or OFF?", bins: ["ON", "OFF"], items: [["nMOS, gate = V_DD", 0, ""], ["nMOS, gate = GND", 1, ""], ["pMOS, gate = GND", 0, "pMOS turns on with a low gate."], ["pMOS, gate = V_DD", 1, ""]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must the pMOS transistor sit in an n-well?", model: "A pMOS transistor needs an n-type body under its gate, with p+ source and drain. On a p-type wafer, the n-well provides that n-type region, and it's tied to V_DD so its junctions with the p+ regions stay reverse-biased." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const GATES = {
    "Inverter": ["A", ["A"]],
    "NAND2": [{ s: ["A", "B"] }, ["A", "B"]],
    "NOR2": [{ p: ["A", "B"] }, ["A", "B"]],
    "NAND3": [{ s: ["A", "B", "C"] }, ["A", "B", "C"]],
    "AOI22": [{ p: [{ s: ["A", "B"] }, { s: ["C", "D"] }] }, ["A", "B", "C", "D"]],
    "OAI31": [{ s: [{ p: ["A", "B", "C"] }, "D"] }, ["A", "B", "C", "D"]],
  };
  const FUNCS = { "Inverter": "Y = A̅", "NAND2": "Y = (A·B)̅", "NOR2": "Y = (A + B)̅", "NAND3": "Y = (A·B·C)̅", "AOI22": "Y = (A·B + C·D)̅", "OAI31": "Y = ((A + B + C)·D)̅" };
  const p3 = {
    id: "p3", title: "Static CMOS gates", mins: 25,
    blurb: "Pull-down nMOS, pull-up pMOS, conduction complements. Plus four possible output states.",
    takeaway: "Inverter: pMOS to V_DD, nMOS to GND. k-input NAND: k series nMOS, k parallel pMOS. NOR: parallel nMOS, series pMOS. A static CMOS (complementary CMOS) gate has an nMOS pull-down network to GND and a pMOS pull-up network to V_DD, arranged so exactly one is ON for any input. Series transistors conduct only if all are ON; parallel if any is ON. Output states: pull-up ON only → 1; pull-down ON only → 0; both OFF → Z (floating, used for tristates and memory); both ON → X (crowbarred: contention, indeterminate level, static power), normally a bug. Conduction complements: transistors in series in the pull-down are in parallel in the pull-up, and vice versa.",
    steps: [
      { k: "learn", title: "The general shape", b: [
        `<p>Every static CMOS gate: a <b>pull-down network</b> of nMOS between the output and GND, and a <b>pull-up network</b> of pMOS between V<sub>DD</sub> and the output. For every input pattern exactly one network conducts.</p>`,
        `<div class="tbl"><table><thead><tr><th></th><th>pull-up OFF</th><th>pull-up ON</th></tr></thead><tbody><tr><th>pull-down OFF</th><td>Z (floating)</td><td>1</td></tr><tr><th>pull-down ON</th><td>0</td><td>X (crowbarred)</td></tr></tbody></table></div>`,
        `<p class="aside">Z is useful (tristates, memories). X means the networks fight: an unknown level and wasted static power. In a correct gate it never happens.</p>`,
        seenHH("NAND, NOR and conduction complements.", "01-zero-to-one.html#p9", "Chapter 1, Part 9"),
      ]},
      { k: "play", title: "Gate lab", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), ins = el(`<div></div>`);
          let k = "AOI22";
          const v = { A: 1, B: 1, C: 0, D: 1 };
          function inputs() { ins.innerHTML = ""; GATES[k][1].forEach((n) => ins.appendChild(toggle([n + " = 0", n + " = 1"], (x) => { v[n] = x; draw(); }, v[n]))); }
          function draw() { const g = cmosGate(GATES[k][0], v); f.innerHTML = g.svg; ro.innerHTML = readout([["Function", FUNCS[k]], ["Transistors", String(2 * spCount(GATES[k][0]))], ["Output", String(g.y)]]); }
          host.append(toggle(Object.keys(GATES), (i) => { k = Object.keys(GATES)[i]; inputs(); draw(); }, 4), ins, f, ro);
          inputs(); draw();
        },
        `<p class="aside">Highlighted boxes are ON transistors (pMOS boxes carry a bubble: they're ON when their input is 0). Whatever the inputs, exactly one network conducts.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "How many transistors in a 4-input NOR, and how are the pMOS arranged?", opts: [["8; four pMOS in series", true, "Parallel nMOS pull down if any input is 1; series pMOS pull up only if all are 0."], ["8; four pMOS in parallel", false, "That's the NAND arrangement."], ["4", false, "Each input drives one nMOS and one pMOS."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does crowbarred (X) mean in a CMOS gate, and why is it bad?", model: "Both the pull-up and pull-down networks are ON at once, so there's a direct path from V_DD to GND. The output settles at some in-between voltage set by the relative strengths of the transistors, and current flows continuously, wasting static power. A correctly designed static CMOS gate never does this." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Compound gates", mins: 25,
    blurb: "AOI and OAI gates do complex functions in one stage, with far fewer transistors.",
    takeaway: "A compound gate implements a complex inverting function in a single stage using series and parallel combinations. Y = (A·B + C·D)̅ (AND-OR-INVERT-22, AOI22): pull-down from the uninverted expression A·B + C·D (series A–B, series C–D, the two in parallel); pull-up by conduction complements (A ∥ B in series with C ∥ D). 8 transistors, versus 20 from discrete AND, AND, OR and inverter gates. OAI31: Y = ((A + B + C)·D)̅: pull-down D in series with (A ∥ B ∥ C); pull-up D in parallel with (A, B, C in series). AOI22 with C = A̅ makes a 2-input inverting mux. Good CMOS designers use compound gates rather than piles of AND/OR gates.",
    steps: [
      { k: "learn", title: "Deriving AOI22", b: [
        `<p>Target: Y = (A·B + C·D)̅. The pull-down must conduct exactly when the <b>uninverted</b> expression A·B + C·D is true.</p>`,
        `<ol><li>A·B: A and B in <b>series</b>. Same for C·D.</li><li>The OR: put those two stacks in <b>parallel</b>.</li><li>The pull-up: conduction complements. Swap series ↔ parallel: (A ∥ B) in series with (C ∥ D).</li></ol>`,
        `<p>8 transistors, one stage of delay. Built from separate ANDs, an OR and an inverter it would take <b>20</b>.</p>`,
      ]},
      { k: "play", title: "Build it, check it", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), tt = el(`<div></div>`);
          const v = { A: 0, B: 0, C: 1, D: 1 };
          const pd = GATES.AOI22[0];
          function draw() { f.innerHTML = cmosGate(pd, v).svg; tt.innerHTML = truthTable(["A", "B", "C", "D"], ["Y"], ([a, b, cc, d]) => 1 - ((a & b) | (cc & d)), { hot: v.A * 8 + v.B * 4 + v.C * 2 + v.D }); }
          ["A", "B", "C", "D"].forEach((n) => host.append(toggle([n + " = 0", n + " = 1"], (x) => { v[n] = x; draw(); }, v[n])));
          host.append(f, tt);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "For Y = ((A + B)·C)̅ (OAI21), what is the pull-down network?", opts: [["C in series with (A ∥ B)", true, "Pull down when (A + B)·C is true: an OR (parallel) in series with C."], ["C in parallel with (A, B in series)", false, "That's the pull-up (the complement)."], ["A, B, C all in series", false, "That would compute ABC."]] },
        { t: "num", q: "How many transistors does the OAI31 gate Y = ((A + B + C)·D)̅ use?", a: 8, tol: 0, why: "Four inputs, each driving one nMOS and one pMOS." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you design the pull-down and pull-up networks of a compound gate?", model: "Write the function so the output is the complement of some expression. Build the pull-down from that uninverted expression: AND becomes series, OR becomes parallel. Then build the pull-up as its conduction complement, swapping series and parallel, with pMOS transistors." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Pass transistors, transmission gates, tristates, muxes", mins: 25,
    blurb: "Strong and weak values, restoring vs nonrestoring circuits, and why muxes beat tristate busses.",
    takeaway: "Signal strength: how closely a signal approximates an ideal voltage source; the rails are the strongest. An nMOS passes a strong 0 but a degraded (weak) 1; a pMOS passes a strong 1 but a degraded 0. A single transistor used as a switch is a pass transistor; nMOS and pMOS in parallel make a transmission gate (pass gate) that passes both well, needing the control and its complement (double-rail). In static CMOS gates, nMOS only pass 0s and pMOS only 1s, so outputs are fully restored, gates work regardless of transistor sizes (not ratioed), and there's never a static path from V_DD to GND. Consequence: a single static CMOS stage is inverting; a “noninverting buffer” made by flipping the transistors gives degraded outputs (bad). Build noninverting functions from several inverting stages. Tristates: a transmission gate behaves like a tristate buffer but is nonrestoring (noise passes through; delays of chained pass gates grow quickly); a tristate inverter is restoring. Tristate busses suffer contention, floating levels and enable-timing problems, so muxes are now preferred. A 2:1 mux can be two transmission gates (compact, nonrestoring) or an inverting mux from tristate inverters or an AOI22 with C = A̅.",
    steps: [
      { k: "learn", title: "Strong and degraded", b: [
        `<div class="tbl"><table><thead><tr><th></th><th>passes 0</th><th>passes 1</th></tr></thead><tbody><tr><td>nMOS</td><td><b>strong</b></td><td>degraded (weak)</td></tr><tr><td>pMOS</td><td>degraded</td><td><b>strong</b></td></tr><tr><td>transmission gate (both)</td><td>strong</td><td>strong</td></tr></tbody></table></div>`,
        `<p>A lone transistor used as a switch is a <b>pass transistor</b>. Put an nMOS and pMOS in parallel and you get a <b>transmission gate</b>; it needs both the control and its complement (double-rail).</p>`,
      ]},
      { k: "why", title: "Why static CMOS gates invert", b: [
        `<p>In a static CMOS gate, nMOS only ever pull <i>down</i> (passing 0s) and pMOS only pull <i>up</i> (passing 1s). So outputs are always <b>fully restored</b> to the rails, and the gate works whatever the transistor sizes.</p>`,
        `<p>The price: one stage always inverts. Flipping the transistors to make a noninverting buffer means each one passes its weak value: bad. Build AND and OR from two inverting stages instead.</p>`,
      ]},
      { k: "learn", title: "Tristates and muxes", b: [
        `<div class="two"><div class="tile"><h3>Transmission gate</h3><p>Same truth table as a tristate buffer, only 2 transistors, but <b>nonrestoring</b>: noise on the input passes straight through, and chains of them get slow fast.</p></div><div class="tile"><h3>Tristate inverter</h3><p>An inverter with enable transistors in series: drives from the rails, so it's <b>restoring</b>. EN = 0: output floats.</p></div></div>`,
        `<p>Tristate busses used to be common, but contention, floating busses and enables switching at slightly different times across a big chip all cause trouble. <b>Muxes</b> are now preferred.</p>`,
        `<p class="aside">A 2:1 mux: two transmission gates (compact, nonrestoring), or two ganged tristate inverters (restoring, inverting).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "An nMOS pass transistor with gate at V_DD passes a 1. What does the output look like?", opts: [["A degraded 1, somewhat below V_DD", true, "Chapter 2 says exactly how far below (a threshold voltage)."], ["A strong 1", false, "nMOS passes 0s well, 1s poorly."], ["A 0", false, "It passes the value, just weakly."]] },
        { t: "mcq", q: "Why are muxes preferred to tristate busses on modern chips?", opts: [["Tristate busses risk contention and floating levels, and enables are hard to switch simultaneously across a large chip", true, "All three cost power or correctness."], ["Muxes use fewer transistors", false, "Not the reason given."], ["Tristates can't be built in CMOS", false, "They can: tristate inverters."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does fully restored mean, and why does static CMOS achieve it?", model: "Every output is driven all the way to V_DD or GND through ON transistors, so logic levels are restored to clean values at each gate instead of degrading along a chain. Static CMOS does this because its pull-down uses only nMOS, which pass strong 0s, and its pull-up uses only pMOS, which pass strong 1s." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const CLK = [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1], DD = [1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0];
  const p6 = {
    id: "p6", title: "Latches and flip-flops in CMOS", mins: 20,
    blurb: "A mux and two inverters make a latch. Two latches make a flip-flop.",
    takeaway: "A positive-level-sensitive D latch: a 2:1 mux (two transmission gates are fine here because the inverters restore) plus two inverters. CLK = 1: transparent, D flows to Q. CLK = 0: opaque; a feedback loop through the inverter pair holds Q. Invert the mux controls for a negative-level-sensitive latch. A positive-edge-triggered D flip-flop (master–slave): a negative-level-sensitive master then a positive-level-sensitive slave. CLK low: master follows D, slave holds. CLK rises: master goes opaque holding D, slave passes it to Q. Good practice adds input and output inverters (buffering, modularity). A register is a set of flip-flops sharing a clock. Hold-time failures can occur with too much clock skew; for class projects, two-phase nonoverlapping clocks (φ1, φ2 never high together) guarantee one latch is always opaque, eliminating hold problems.",
    steps: [
      { k: "learn", title: "A latch from a mux", b: [
        `<p>A D latch: a 2:1 mux and two inverters. CLK = 1: the mux passes D, which flows to Q (<b>transparent</b>). CLK = 0: the mux selects the feedback path, and the two inverters hold the value in a loop (<b>opaque</b>).</p>`,
        `<p class="aside">Here a transmission-gate mux is fine because the inverters restore the levels.</p>`,
      ]},
      { k: "play", title: "Master and slave", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let qm = 0, q = 0;
          const QM = [], Q = [];
          CLK.forEach((c, i) => { if (!c) qm = DD[i]; if (c) q = qm; QM.push(qm); Q.push(q); });
          f.innerHTML = wave([{ name: "CLK", v: CLK }, { name: "D", v: DD }, { name: "QM (master)", v: QM }, { name: "Q (slave)", v: Q, cls: "hl" }], { dx: 22, x0: 100, marks: [2, 6, 10, 14].map((t) => ({ t })) });
          host.append(f);
        },
        `<p class="aside">The master is transparent while CLK is low; the slave while CLK is high. So Q only changes at the dashed rising edges, to the value D had just before.</p>`,
      ]},
      { k: "learn", title: "Two-phase clocks", b: [
        `<p>With too much clock skew, a flip-flop can fail its hold time. Industrial teams spend great effort simulating for this. A simple alternative for student chips: clock the two latches with <b>two nonoverlapping phases</b> φ1 and φ2 that are never high at the same time. Then one latch is always opaque, and hold problems can't happen.</p>`,
        seenHH("Setup, hold and clock skew.", "03-sequential-logic.html#p9", "Chapter 3, Parts 9 and 10"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "How do you turn a positive-level-sensitive latch into a negative-level-sensitive one?", opts: [["Swap the mux control: let it pass D when CLK = 0", true, "Then it's transparent while the clock is low."], ["Add an inverter on Q", false, "That inverts the data, not the clock sensitivity."], ["Use pMOS only", false, "The polarity of the clock control is what matters."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a master–slave flip-flop only change at the clock edge?", model: "The two latches are transparent on opposite clock levels, so at any time one of them blocks the path from D to Q. While the clock is low the master follows D but the slave holds; when the clock rises the master freezes the last D and the slave passes it to Q. So Q changes only at the rising edge." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  function xsec(step) {
    const Y0 = 130, H = 200;
    let s = `<rect x="10" y="${Y0}" width="400" height="${H - Y0 + 10}" style="fill:var(--card);stroke:var(--line)"/>` + S.t(30, H - 2, "p-substrate", { a: "start", cls: "s m" });
    const box = (x1, x2, y1, y2, fill, op, lab) => `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" style="fill:${fill};opacity:${op};stroke:var(--ink);stroke-width:1"/>` + (lab ? S.t((x1 + x2) / 2, (y1 + y2) / 2 + 4, lab, { cls: "s" }) : "");
    if (step >= 1) s += box(210, 400, Y0, 185, "var(--cool-soft)", 1, "") + S.t(380, 180, "n-well", { a: "end", cls: "s c" });
    if (step >= 2) { s += box(103, 137, Y0 - 4, Y0, "var(--line)", 1) + box(258, 292, Y0 - 4, Y0, "var(--line)", 1) + box(103, 137, Y0 - 22, Y0 - 4, "var(--bad)", 0.75, "poly") + box(258, 292, Y0 - 22, Y0 - 4, "var(--bad)", 0.75, "poly"); }
    if (step >= 3) { [[66, 103], [137, 174], [350, 385]].forEach(([a, b]) => { s += box(a, b, Y0, Y0 + 16, "var(--cool)", 0.6, "n+"); }); }
    if (step >= 4) { [[20, 52], [221, 258], [292, 329]].forEach(([a, b]) => { s += box(a, b, Y0, Y0 + 16, "var(--accent)", 0.6, "p+"); }); }
    if (step >= 5) {
      const holes = [[28, 44], [76, 93], [147, 164], [231, 248], [302, 319], [359, 376]];
      let xx = 10; holes.forEach(([a, b]) => { s += box(xx, a, Y0 - 34, Y0, "var(--muted)", 0.25); xx = b; }); s += box(xx, 410, Y0 - 34, Y0, "var(--muted)", 0.25);
      s += S.t(200, Y0 - 40, "field oxide with contact cuts", { cls: "s m" });
    }
    if (step >= 6) {
      [[22, 100, "GND"], [140, 255, "Y"], [296, 382, "V_DD"]].forEach(([a, b, l]) => { s += box(a, b, Y0 - 52, Y0 - 34, "var(--muted)", 0.8, l); });
      [[28, 44], [76, 93], [147, 164], [231, 248], [302, 319], [359, 376]].forEach(([a, b]) => { s += box(a, b, Y0 - 34, Y0, "var(--muted)", 0.8); });
      s += S.t(120, 30, "gate A ties the two poly gates (off the page)", { a: "start", cls: "s m" });
    }
    s += S.t(100, H + 4, step >= 3 ? "nMOS" : "", { cls: "s" }) + S.t(275, H + 4, step >= 4 ? "pMOS" : "", { cls: "s" });
    return S.svg(420, H + 12, s, { max: 420, label: "Inverter cross-section during fabrication" });
  }
  const STEPS = [
    ["Bare wafer", "A nearly flawless single-crystal p-type silicon wafer, 15–30 cm across."],
    ["n-well", "Grow oxide; spin on photoresist; expose it through the n-well mask; remove the softened resist; etch the exposed oxide with HF; strip the resist; diffuse or implant n-type dopants where there's no oxide. The well spreads a little sideways."],
    ["Gate oxide and polysilicon", "Grow a very thin gate oxide in a furnace, deposit polysilicon by chemical vapour deposition (silane gas), dope it, and pattern it with the poly mask."],
    ["n+ diffusion", "Implant n-type dopants through a mask opening. The poly gate blocks them, so source and drain land exactly on either side of it: self-aligned. Also the well tap."],
    ["p+ diffusion", "Same again with the p-diffusion mask: the pMOS source and drain, and the substrate tap."],
    ["Field oxide and contacts", "Grow thick field oxide to insulate everything, then etch contact cuts where metal must touch diffusion or poly."],
    ["Metal", "Sputter aluminium over the wafer, filling the contacts, then plasma-etch it into wires: GND, V_DD and the output Y. Modern chips repeat contact + metal for 5–10+ layers."],
  ];
  const p7 = {
    id: "p7", title: "How an inverter is built", mins: 25,
    blurb: "Cross-section, masks, and photolithography, one layer at a time.",
    takeaway: "Inverter cross-section on a p-substrate: an n-well for the pMOS; n+ source/drain for the nMOS and p+ for the pMOS; polysilicon gates over thin gate oxide; thick field oxide insulating metal from everything except at contacts; metal GND, V_DD and Y lines. Heavily doped contacts are ohmic (metal on lightly doped silicon would be a Schottky diode). The substrate must be tied low (substrate tap, p+ to GND) and the n-well high (well tap, n+ to V_DD) to keep junctions reverse-biased. Fabrication uses photolithography: because a whole wafer is processed at once, cost is proportional to area, not transistor count, so smaller transistors are cheaper, faster and lower energy. A hypothetical six-mask set: n-well, polysilicon, n+ diffusion, p+ diffusion, contacts, metal. Steps: oxidize, spin photoresist, expose through a mask, develop, etch oxide with HF, strip resist (piranha), diffuse or ion-implant dopants; gate oxide and CVD polysilicon; self-aligned source/drain implants (the gate masks the channel); field oxide and contact cuts; sputter and plasma-etch aluminium. Modern processes add complex doping profiles, sub-wavelength lithography and many metal layers; foundries build designs from basic mask sets.",
    steps: [
      { k: "play", title: "Build an inverter", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let k = 0;
          const draw = () => { f.innerHTML = xsec(k); ro.innerHTML = readout([[`Step ${k}: ${STEPS[k][0]}`, STEPS[k][1]]]); };
          const nx = btn("Next step →", "primary"), bk = btn("← Back");
          nx.addEventListener("click", () => { k = Math.min(STEPS.length - 1, k + 1); draw(); });
          bk.addEventListener("click", () => { k = Math.max(0, k - 1); draw(); });
          const row = el(`<div class="row"></div>`); row.append(bk, nx);
          host.append(f, row, ro);
          draw();
        },
        `<p class="aside">Not to scale. Left: the nMOS with its substrate tap (p+). Right: the pMOS in the n-well with its well tap (n+).</p>`,
      ]},
      { k: "learn", title: "Taps", b: [
        `<p>The p-substrate and the n+ regions form p–n junctions; so do the n-well and the p+ regions. They must stay <b>reverse-biased</b>, so the substrate is tied to GND (<b>substrate tap</b>, p+) and the well to V<sub>DD</sub> (<b>well tap</b>, n+).</p>`,
        `<p class="aside">Contacts land on heavily doped silicon so they're ohmic. Metal on lightly doped silicon would form a Schottky diode that conducts one way only.</p>`,
      ]},
      { k: "learn", title: "Printing chips like books", b: [
        `<p>Every step processes the <b>whole wafer at once</b>, so a chip's cost depends on its <b>area</b>, not how many transistors it has. Shrink the transistors and each one gets cheaper, faster (shorter distance for electrons) and lower energy (fewer electrons to charge the gate).</p>`,
        `<p>Six masks define our inverter: <b>n-well, polysilicon, n+ diffusion, p+ diffusion, contacts, metal</b>. Real processes use many more, generated automatically from these.</p>`,
        `<p class="aside">A 1958 photoresist experiment found Jell-O worked as a mask. Lemon gave the best results.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why is the source/drain implant called self-aligned?", opts: [["The polysilicon gate itself blocks the dopants, so source and drain form exactly beside it, without precise mask alignment", true, "That's why the gate is patterned before the diffusions."], ["The masks line themselves up automatically", false, "It's the gate acting as a mask, not the masks."], ["Diffusion always aligns with the well", false, "Self-alignment is with the gate."]] },
        { t: "mcq", q: "What would happen without a substrate tap?", opts: [["The substrate could float up and forward-bias the junctions with the n+ source/drain", true, "Taps keep the substrate at GND and the well at V_DD."], ["The transistor would be faster", false, "It would be unreliable."], ["Nothing", false, "The junctions need a defined bias."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe how photolithography patterns one layer.", model: "Coat the wafer with a protective layer (like oxide) and then light-sensitive photoresist, shine light through a mask so only some areas are exposed, remove the softened resist, etch away the protective layer where it's uncovered, strip the remaining resist, and then process the exposed areas, for example by implanting dopants. The pattern on the mask ends up in the wafer." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Layout: design rules, cells, stick diagrams", mins: 30,
    blurb: "Lambda rules, W/L, standard-cell style layouts, and estimating area by counting tracks.",
    takeaway: "Design rules say how small features may be and how close together. Industrial rules are in microns; scalable lambda (λ) rules (Mead and Conway, MOSIS) use one parameter λ = half the minimum drawn channel length (180 nm process → λ = 0.09 µm), at some cost in density. Simple 2-metal n-well rules: metal and diffusion width and spacing 4λ; contacts 2λ × 2λ with 1λ surround; poly width 2λ; poly overlaps diffusion by 2λ to make a transistor and stays 1λ away elsewhere; poly and contacts spaced 3λ; n-well surrounds pMOS by 6λ and avoids nMOS by 6λ; metal3 typically 6λ wide. Below 180 nm, real rules are too complex for λ, but the intuition holds. Transistor size is W/L: a unit nMOS is 4λ/2λ (in 0.6 µm: 1.2/0.6 µm); pMOS are made about twice as wide because holes are slower; L is usually minimum (faster, smaller, lower power). Cell layout style: metal GND rail at the bottom, n-diffusion, p-diffusion, metal V_DD rail at the top; vertical poly gates; taps under the rails. Stick diagrams plan layout quickly, not to scale. Area estimate: a routing track (wire + space) is 8λ; count vertical and horizontal tracks, plus one extra track between nMOS and pMOS (well spacing 12λ). A 3-input NAND: 4 × 8λ = 32λ wide, 5 × 8λ = 40λ tall.",
    steps: [
      { k: "learn", title: "Lambda rules", b: [
        `<p>Design rules say how small and how close features can be. Scalable rules measure everything in <b>λ</b>, half the minimum channel length. A 180 nm process has λ = 0.09 µm. Move to a new process by changing λ.</p>`,
        `<div class="tbl"><table><tbody>
          <tr><td>Metal, diffusion</td><td>width and spacing 4λ</td></tr>
          <tr><td>Contacts</td><td>2λ × 2λ, surrounded by 1λ</td></tr>
          <tr><td>Polysilicon</td><td>width 2λ; overlaps diffusion by 2λ to make a transistor; 1λ away where none is wanted</td></tr>
          <tr><td>Poly, contacts</td><td>3λ apart</td></tr>
          <tr><td>n-well</td><td>surrounds pMOS by 6λ, keeps 6λ from nMOS</td></tr></tbody></table></div>`,
        `<p class="aside">Below 180 nm, real rules are too complex and process-specific for λ. Chapter 3 shows them; the λ intuition still helps.</p>`,
      ]},
      { k: "learn", title: "W/L and the unit transistor", b: [
        `<p>A transistor is described by its width/length, <b>W/L</b>. The minimum contacted nMOS, 4λ/2λ, is the <b>unit transistor</b> (1.2/0.6 µm in a 0.6 µm process).</p>`,
        `<p><b>pMOS are made about twice as wide</b>, because holes move more slowly than electrons; wider means the same current. <b>L is kept minimum</b>: short channels are faster, smaller and lower power.</p>`,
        `<p class="aside">Chapter 4 explains how to choose widths properly.</p>`,
      ]},
      { k: "learn", title: "Cell layout style", b: [
        `<p>A standard-cell layout uses four horizontal strips: <b>metal GND</b> at the bottom, <b>n-diffusion</b>, <b>p-diffusion</b>, <b>metal V<sub>DD</sub></b> at the top. Polysilicon runs <b>vertically</b> to form gates. Taps sit under the rails.</p>`,
        `<p>A <b>stick diagram</b> sketches this with coloured lines, not to scale: quick to draw, and good enough to estimate area.</p>`,
      ]},
      { k: "play", title: "Estimate cell area", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let vt = 4, ht = 5, lam = 0.09;
          function draw() { const w = vt * 8, h = ht * 8; ro.innerHTML = readout([["Width", `${vt} tracks × 8λ = ${w}λ`], ["Height", `${ht} tracks × 8λ = ${h}λ`], ["Area", `${w * h} λ²`], [`In a process with λ = ${lam} µm`, `${fmt(w * lam, 3)} × ${fmt(h * lam, 3)} µm = ${fmt(w * h * lam * lam, 3)} µm²`]]); }
          host.append(slider({ id: id + "-v", label: "Vertical tracks (inputs, outputs, internal wires)", min: 1, max: 12, step: 1, value: vt, show: String }, (x) => { vt = x; draw(); }).el,
            slider({ id: id + "-h", label: "Horizontal tracks (rails, wires, + 1 between n and p)", min: 3, max: 10, step: 1, value: ht, show: String }, (x) => { ht = x; draw(); }).el,
            toggle(["λ = 0.3 µm (0.6 µm)", "λ = 0.09 µm (180 nm)", "λ = 0.0325 µm (65 nm)"], (i) => { lam = [0.3, 0.09, 0.0325][i]; draw(); }, 1), ro);
          draw();
        },
        `<p class="aside">A routing <b>track</b> = a 4λ wire + 4λ space = 8λ. Layout area is set mostly by wires; transistors fit under them. Always add one track between the nMOS and pMOS rows: the well needs 12λ there. The defaults are a 3-input NAND: 32λ × 40λ.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A process has 130 nm minimum channel length. What is λ?", a: 0.065, tol: 0.01, unit: "µm", why: "λ = half the minimum channel length: 65 nm." },
        { t: "mcq", q: "Why are pMOS transistors usually drawn wider than nMOS?", opts: [["Holes are slower than electrons, so a pMOS needs more width to deliver the same current", true, "About twice as wide is typical."], ["pMOS sit in a well, which needs more room", false, "The well needs spacing, but the width is about current."], ["To make the gate noninverting", false, "Sizing doesn't change the logic."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How can you estimate a cell's area from a stick diagram?", model: "Count the vertical and horizontal wiring tracks it needs, including one extra horizontal track between the nMOS and pMOS rows for the well spacing. Each track is 8λ (a 4λ wire plus 4λ space), so width and height are the track counts times 8λ, then multiply for area. Transistors fit under the wires, so wires set the size." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Design partitioning", mins: 15,
    blurb: "Five levels of abstraction, structured design, and the Y-chart.",
    takeaway: "The hardest problem in modern VLSI isn't transistors but complexity: SoCs with billions of transistors and tens of millions of dollars of design effort, split across large teams. Five levels: architecture (what the system does: x86's instructions, registers, memory model), microarchitecture (registers and functional units: 386, Pentium, Core, Athlon… for x86), logic (how units are built: ripple-carry vs carry-lookahead adder), circuit (how transistors implement the logic: static CMOS, domino, pass transistors), physical (layout). They interact: transistor budgets shape the microarchitecture; a faster cache circuit can change the pipeline; deeper pipelines raise frequency but cost power. So these designs proceed partly in parallel, and VLSI favours “tall, skinny” engineers who know a little about everything. Structured design: hierarchy (chip → cores → units → blocks → cells → transistors), regularity (few distinct blocks, reused), modularity (well-defined interfaces), locality (keep information where it's used). The Y-chart shows behavioral (what), structural (how connected) and physical (how built) domains, each at many levels; design moves inward from behavior to structure to geometry, verifying each transformation.",
    steps: [
      { k: "learn", title: "Five levels", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>Architecture</b></td><td>What the system does: instructions, registers, memory model (x86).</td></tr>
          <tr><td><b>Microarchitecture</b></td><td>Registers and functional units (386, Pentium, Core, Athlon all run x86).</td></tr>
          <tr><td><b>Logic</b></td><td>How each unit is built (ripple-carry or lookahead adder).</td></tr>
          <tr><td><b>Circuit</b></td><td>How transistors implement the logic (static CMOS, domino, pass transistors).</td></tr>
          <tr><td><b>Physical</b></td><td>The layout.</td></tr></tbody></table></div>`,
        `<p>They're interdependent: a circuit trick that makes a cache one cycle faster can change the best microarchitecture. So the levels proceed partly in parallel, and the field rewards “tall, skinny” engineers who know something about every level.</p>`,
      ]},
      { k: "learn", title: "Structured design and the Y-chart", b: [
        `<p>Four principles: <b>hierarchy</b> (chip → cores → units → blocks → cells → transistors), <b>regularity</b> (reuse a few blocks), <b>modularity</b> (clean interfaces), <b>locality</b> (keep information near where it's used).</p>`,
        `<p>The <b>Y-chart</b> has three domains: <b>behavioral</b> (algorithm, FSM, Boolean equation), <b>structural</b> (processor, ALU, cell, transistor), <b>physical</b> (floorplan, placement, mask). Design moves from behavior to structure to geometry, checking at each step that nothing changed.</p>`,
        seenHH("Hierarchy, modularity and regularity from the start.", "01-zero-to-one.html#p1", "Chapter 1, Part 1"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which level does each decision belong to?", bins: ["Architecture", "Microarchitecture", "Logic", "Circuit", "Physical"], items: [
          ["Add a multiply instruction", 0, "It changes what programs can ask for."],
          ["Pipeline the processor in 5 stages", 1, "How the architecture is implemented."],
          ["Use a carry-lookahead adder", 2, "How a unit is built from logic."],
          ["Use domino gates in the adder", 3, "How transistors implement it."],
          ["Place the cache next to the ALU", 4, "Floorplan and layout."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't the five levels of design be done strictly one after another?", model: "Because decisions at each level depend on the others: how many transistors fit depends on physical design, which shapes the microarchitecture; a clever circuit can change which microarchitecture is best; clock speed depends on everything. Teams have to work on them partly in parallel and feed results back." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "Case study: an 8-bit MIPS chip", mins: 25,
    blurb: "Architecture to logic to circuits to netlists, for a real (small) processor.",
    takeaway: "The example is an 8-bit subset of MIPS: 32-bit instructions, eight 8-bit registers ($0 = 0), an 8-bit PC, instructions ADD, SUB, AND, OR, SLT, ADDI, BEQ, J, LB, SB in R, I and J formats (6-bit op; R-type adds 6-bit funct). It uses Harris & Harris's multicycle microarchitecture, modified for an 8-bit memory interface: fetching a 32-bit instruction takes four cycles (FSM states 0–3), then decode, then execute/memory/write-back states; an ALU decoder maps ALUOp and funct to ALUControl. Logic design starts from the top-level interface (two-phase clocks ph1/ph2, reset, an 8-bit memory bus), then a block diagram (controller and datapath), the datapath as wordslices or bitslices with a zipper driving select signals, a hierarchy tree down to standard cells, and HDL (RTL) descriptions: structural at the top, behavioral leaves. Circuit design: delay t ≈ C·V_DD/I (bigger load slower, more current faster); dynamic power ∝ C·V_DD²·f; static power I_static·V_DD. A full adder's carry: 26 transistors and 4 gate delays from AND/OR gates, or 12 transistors and 2 stages as a transistor-level design. Netlists: gate-level Verilog, transistor-level Verilog (tranif1 nMOS, tranif0 pMOS), and SPICE (M name drain gate source body type W L …; C name n1 n2 value), which carries the sizes and parasitics needed for timing and power.",
    steps: [
      { k: "learn", title: "The processor", b: [
        `<p>An 8-bit subset of MIPS: 32-bit instructions, eight 8-bit registers ($0 always 0), an 8-bit program counter, ten instructions (ADD, SUB, AND, OR, SLT, ADDI, BEQ, J, LB, SB) in three formats (R, I, J).</p>`,
        `<p>It uses the <b>multicycle</b> microarchitecture from Harris & Harris Chapter 7, but with an 8-bit memory bus, so fetching each 32-bit instruction takes <b>four cycles</b>, one byte at a time. A control FSM sequences everything.</p>`,
        `<p class="aside">Harris & Harris Chapters 6 and 7 cover MIPS and multicycle processors in detail. Treat it as a black box for now if you haven't read them.</p>`,
      ]},
      { k: "learn", title: "Logic design", b: [
        `<p>Top-down: the chip's pins (two-phase clocks ph1 and ph2, reset, an 8-bit memory interface), then a block diagram: <b>controller</b> (FSM + ALU decoder) and <b>datapath</b>.</p>`,
        `<p>The datapath is very regular: think of it as <b>wordslices</b> (columns: an 8-bit mux, an 8-bit adder) or <b>bitslices</b> (rows: one bit of everything). A <b>zipper</b> row drives each select signal and its complement to all eight bits, instead of an inverter in every mux.</p>`,
        sv(`
module adder(input  logic [7:0] a, b,
             input  logic       c,
             output logic [7:0] s,
             output logic       cout);
  wire [6:0] carry;
  fulladder fa0(a[0], b[0], c,        s[0], carry[0]);
  fulladder fa1(a[1], b[1], carry[0], s[1], carry[1]);
  // ... fa2 to fa6 ...
  fulladder fa7(a[7], b[7], carry[6], s[7], cout);
endmodule`),
        `<p class="aside">The HDL here is called the <b>RTL</b> (register transfer level) description: structural at the top, behavioral at the leaves.</p>`,
      ]},
      { k: "learn", title: "Circuit design: delay and power", b: [
        `<p>A gate drives the capacitance of the gates after it. Charging it with current I takes</p>`,
        `<div class="eq">t = C · V<sub>DD</sub> / I</div>`,
        `<p>More load, slower. More current (wider transistors), faster. Charging and discharging also costs <b>dynamic power</b>, about C·V<sub>DD</sub><sup>2</sup>·f, and OFF transistors leak <b>static power</b> I<sub>static</sub>·V<sub>DD</sub>. Chapters 2, 4 and 5 make this precise.</p>`,
        `<p>Circuit choices matter: a full adder's carry from AND/OR gates takes <b>26 transistors and 4 gate delays</b>; designed at the transistor level, <b>12 transistors and 2</b>.</p>`,
      ]},
      { k: "learn", title: "Netlists", b: [
        `<p>A circuit is written as a <b>netlist</b>. Three flavours, more detail each time:</p>`,
        sv(`  and g1(x, a, b);          // gate-level Verilog
  tranif1 n1(i1, gnd, a);   // transistor-level Verilog: nMOS (ON when gate = 1)
  tranif0 p1(i3, vdd, a);   //                           pMOS (ON when gate = 0)`),
        listing(`* SPICE: Mname drain gate source body type W= L=
MN1 I1 A GND GND NMOS W=2U L=0.6U AD=1.8P AS=3P
MP1 I3 A VDD VDD PMOS W=4U L=0.6U AD=3.6P AS=6P
CI1 I1 GND 6FF     * wiring capacitance`, { comment: "*" }),
        `<p>Only SPICE carries the transistor sizes and parasitic capacitances needed to predict speed and power. Note the fourth terminal: the <b>body</b>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "In the SPICE line MP2 I3 B VDD VDD PMOS W=4U L=0.6U, what are the gate and the body?", opts: [["Gate = B, body = VDD", true, "Order: drain (I3), gate (B), source (VDD), body (VDD)."], ["Gate = I3, body = VDD", false, "I3 is the drain."], ["Gate = VDD, body = B", false, "Check the order: drain gate source body."]] },
        { t: "mcq", q: "Doubling a gate's load capacitance, with the same drive current, does what to its delay?", opts: [["Doubles it", true, "t = C·V_DD/I."], ["Halves it", false, "More capacitance takes longer to charge."], ["Nothing", false, "Delay is proportional to load."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a SPICE netlist describe that a gate-level Verilog netlist doesn't?", model: "Transistor-level detail needed for timing and power: each transistor's type, its four terminals including the body, its width and length, diffusion areas, and extra wiring capacitances. A gate-level netlist only says which gates connect to which, so it can check function but not speed or power." },
      ]},
    ],
  };

  /* =============== PART 11 =============== */
  const DENS = [["Random logic (2-metal)", 1250], ["Datapath", 500], ["SRAM (per bit)", 1000], ["DRAM (per bit)", 100], ["ROM (per bit)", 100]];
  const p11 = {
    id: "p11", title: "Physical design, verification, fabrication", mins: 25,
    blurb: "Floorplans, standard cells, area estimates, checks, tapeout, masks, packaging and test.",
    takeaway: "Physical design starts with a floorplan: area and placement of major units, checked early and revised often (e.g., placing a cache next to the datapath might cut its latency to one cycle). The MIPS chip (0.6 µm, 1.5 × 1.5 mm = 5000λ square, 40 pads) is pad-limited; most commercial chips are core-limited. Structures: random logic, datapaths, arrays, analog, I/O. Standard cells (inverters, NANDs, flip-flops) tile in rows with shared rails; automatic place & route; more metal layers route over the cells. Snap-together cells need pitch matching; a slice plan lists wordslices and wire tracks to estimate datapath area and congestion. Area estimates per element: random logic 1000–1500 λ²/transistor, datapath 250–750, SRAM 1000 λ²/bit, DRAM and ROM 100 λ²/bit (don't forget periphery). Verification takes half or more of the effort: architectural models, HDL simulation with testbenches, gate-level simulation or formal equivalence, layout vs schematic (LVS), design rule checks (DRC), electrical rule checks (ERC). Tapeout sends GDS (or CIF) mask descriptions; mask sets cost about $250k at 180 nm and $3M at 65 nm; multi-project wafers (MOSIS) share costs (~$10k for 40 small chips at 130 nm). Fabless companies use foundries (TSMC…); wafers are 150–300 mm; turnaround up to ~10 weeks. Dice are packaged (DIP, flip-chip) and tested; built-in self-test cuts tester time. Objectives: reliability, performance, power, cost (NRE vs per-unit).",
    steps: [
      { k: "learn", title: "Floorplans", b: [
        `<p>Physical design begins with a <b>floorplan</b>: estimated area and position of each major unit. Do it early, and expect it to change the logic, and the logic to change it back.</p>`,
        `<p>The 8-bit MIPS chip: 1.5 × 1.5 mm in 0.6 µm, 40 I/O pads around the edge. Its area is set by the pads: <b>pad-limited</b>. Most commercial chips are <b>core-limited</b>.</p>`,
        `<p>Random logic is built from <b>standard cells</b> placed in rows and connected by automatic <b>place & route</b>; with enough metal layers, wires run over the cells. Regular structures (datapaths, memory arrays) get custom <b>pitch-matched</b> cells that snap together.</p>`,
      ]},
      { k: "play", title: "Area estimator", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let k = 0, n = 20000, lam = 0.09;
          function draw() { const a = n * DENS[k][1]; ro.innerHTML = readout([["Density", `${DENS[k][1]} λ² per ${k >= 2 ? "bit" : "transistor"}`], ["Area", `${fmt(a / 1e6, 3)} Mλ²`], [`With λ = ${lam} µm`, `${fmt(a * lam * lam / 1e6, 3)} mm²`]]); }
          host.append(toggle(DENS.map((d) => d[0]), (i) => { k = i; draw(); }, 0),
            slider({ id: id + "-n", label: "Transistors or bits", min: 1000, max: 1000000, log: true, value: n, show: (x) => Math.round(x).toLocaleString() }, (x) => { n = x; draw(); }).el,
            toggle(["λ = 0.3 µm", "λ = 0.09 µm", "λ = 0.0325 µm"], (i) => { lam = [0.3, 0.09, 0.0325][i]; draw(); }, 1), ro);
          draw();
        },
        `<p class="aside">Middle-of-range densities from the book's table. Memories also need decoders and periphery, often as much area again.</p>`,
      ]},
      { k: "learn", title: "Verification", b: [
        `<p>If anything can go wrong, it probably will. Verification takes <b>half or more</b> of the effort on a chip.</p>`,
        `<ul><li>Architecture: a model in C, say. Logic: HDL simulation with <b>testbenches</b>.</li><li>Circuits vs logic: simulate the gate- or transistor-level netlist, or use formal equivalence checking.</li><li>Layout vs circuits: <b>LVS</b> (layout vs schematic), <b>DRC</b> (design rules), <b>ERC</b> (electrical rules).</li></ul>`,
      ]},
      { k: "learn", title: "Tapeout to tested chip", b: [
        `<p><b>Tapeout</b>: send the mask descriptions (GDS) to the fab. A mask set costs around <b>$250,000 at 180 nm</b> and <b>$3 million at 65 nm</b>. Multi-project wafer services (like MOSIS) share one mask set among many small designs: about $10,000 for 40 small chips at 130 nm.</p>`,
        `<p>Fabs cost billions; most companies are <b>fabless</b> and use foundries like TSMC. Wafers are 150–300 mm; turnaround is up to ~10 weeks. Wafers are sawn into <b>dice</b>, packaged (wire-bonded DIP, or flip-chip with solder balls), and <b>tested</b>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Which check confirms the transistors in your layout are connected as in your schematic?", opts: [["LVS (layout vs schematic)", true, "DRC checks geometry rules; ERC checks electrical hazards."], ["DRC", false, "DRC checks widths and spacings."], ["A testbench", false, "Testbenches check logic function."]] },
        { t: "num", q: "Estimate the area of a 64 Kb SRAM's bit cells at 1000 λ²/bit with λ = 0.09 µm (bits only).", a: 0.53, tol: 0.03, unit: "mm²", hint: "65,536 bits × 1000 λ² × (0.09 µm)².", why: "65.5 Mλ² × 0.0081 µm² = 0.53 mm², before decoders and sense amplifiers." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do leading-edge processes only make sense for chips sold in huge volumes?", model: "Per-chip cost falls in smaller processes because more transistors fit in each area, but the one-time costs (design effort and masks, millions of dollars) rise steeply. Those NRE costs only pay off if they're spread over a very large number of chips, or if the chip needs cutting-edge performance." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "vlsi1", eyebrow: "CMOS VLSI · Chapter 1", title: "Introduction",
    intro: `<p>Eleven parts: fifty years of scaling, transistors as switches, static CMOS and compound gates, pass gates and muxes, CMOS latches and flip-flops, fabrication, layout and design rules, design partitioning, an 8-bit MIPS case study, and physical design through to tested chips.</p><p>Parts 2, 3 and 6 recap Harris & Harris quickly; the rest is new. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. Many ask you to sketch transistor schematics and stick diagrams: draw them on paper.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11],
    summary: `
      <h3>History</h3>
      <p>1947 transistor, 1958 IC, 1963 CMOS. Moore's law (×2 every ~2 years), Dennard scaling, the 2004 power wall. Node = 0.7× linear, 2× density.</p>
      <h3>Static CMOS</h3>
      <p>nMOS pull-down, pMOS pull-up, conduction complements. Outputs: 0, 1, Z (both off), X (both on). Compound gates (AOI22, OAI31) do complex inverting functions in one stage. nMOS pass strong 0s, pMOS strong 1s; transmission gates pass both but don't restore. Muxes over tristate busses. Latch = mux + inverters; flip-flop = master + slave; two-phase clocks avoid hold problems.</p>
      <h3>Fabrication and layout</h3>
      <p>Masks: n-well, poly, n+, p+, contact, metal. Photolithography; self-aligned source/drain; taps tie substrate to GND and wells to V<sub>DD</sub>. λ = half the minimum channel length; widths 4λ (metal, diffusion), 2λ (poly); unit transistor 4λ/2λ; pMOS ~2× wider. Track = 8λ; cell area ≈ tracks × 8λ.</p>
      <h3>Design</h3>
      <p>Architecture → microarchitecture → logic → circuit → physical. Hierarchy, regularity, modularity, locality. Delay t ≈ CV<sub>DD</sub>/I; dynamic power ∝ CV<sub>DD</sub><sup>2</sup>f. Netlists: gate, transistor (tranif1/0), SPICE. Verification: simulation, LVS, DRC, ERC. Tapeout (GDS), masks ($M), foundries, packaging, test.</p>`,
  };
  Course.start(window.CHAPTER);
})();
