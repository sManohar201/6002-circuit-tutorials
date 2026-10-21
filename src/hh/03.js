(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const { bits, truthTable, gate, wave, fsm, bitButtons } = Digital;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seenPP = (html, href, where) => `<div class="key"><b>Seen in Patt & Patel:</b> ${html} <a href="../pp/${href}">${where} →</a></div>`;
  const mathLink = (html, href, where) => `<p class="aside">${html} <a href="../math/${href}">${where} →</a></p>`;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const W = (v) => (v ? "w hl" : "w");

  /* =============== PART 1 =============== */
  function invLoop(q) {
    let s = gate("not", 160, 60).s + `<path class="el" d="M260 132 L220 150 L260 168 Z"/><circle class="el" cx="215" cy="150" r="5"/><line class="w" x1="260" y1="150" x2="282" y2="150"/>`;
    s += `<polyline class="${W(q)}" points="210,60 320,60 320,150 282,150"/>` + S.t(328, 64, "Q = " + q, { a: "start", cls: "big" });
    s += `<polyline class="${W(1 - q)}" points="210,150 100,150 100,60 138,60"/>` + S.t(92, 154, "Q̅ = " + (1 - q), { a: "end", cls: "big" });
    s += S.t(180, 40, "I1", { cls: "s" }) + S.t(240, 190, "I2", { cls: "s" });
    return S.svg(430, 200, s, { max: 430, label: "Cross-coupled inverter pair" });
  }
  const p1 = {
    id: "p1", title: "A loop that remembers", mins: 15,
    blurb: "Two inverters in a loop have two stable states: one bit of memory.",
    takeaway: "Sequential logic's outputs depend on current and prior inputs: it has memory. The state is a set of bits (state variables) holding everything about the past needed to explain future behaviour. The basic memory element is a bistable element: two cross-coupled inverters (each one's output is the other's input). It's cyclic, so analyse by cases. Q = 0: I2's output Q̅ = 1, so I1's output Q = 0: consistent, stable. Q = 1: also stable. There's also a metastable state with both outputs about halfway (Section 3.5.4). N stable states store log₂N bits, so a bistable element stores 1 bit; Q (or Q̅) is the state variable. At power-up the state is unknown. Cross-coupled inverters have no inputs, so you can't control them; latches and flip-flops add inputs.",
    steps: [
      { k: "learn", title: "Sequential logic", b: [
        `<p>Combinational logic forgets. <b>Sequential</b> logic's outputs depend on current <i>and past</i> inputs: it has memory.</p>`,
        `<p>The <b>state</b> is a set of bits that holds everything about the past you need to predict the future. Those bits are <b>state variables</b>.</p>`,
      ]},
      { k: "play", title: "Two inverters in a loop", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), vd = el(`<span class="verdict ok"></span>`);
          const draw = (q) => { f.innerHTML = invLoop(q); vd.textContent = `Assume Q = ${q}: I2 makes Q̅ = ${1 - q}, so I1 makes Q = ${q}. Consistent: stable.`; };
          host.append(toggle(["Assume Q = 0", "Assume Q = 1"], draw, 0), f, vd);
          draw(0);
        },
        `<p>Both cases hold themselves up. Two stable states: the circuit is <b>bistable</b>, and stores one bit.</p>`,
        `<p class="aside">It's cyclic, so we can't just trace inputs to outputs. Analyse by cases: assume a value, see if it's consistent.</p>`,
      ]},
      { k: "predict", title: "Is that all?", b: [
        { t: "mcq", q: "Besides Q = 0 and Q = 1, can the loop sit anywhere else?", opts: [
          ["Yes, in theory: both outputs balanced halfway between 0 and 1 (metastable). It won't stay there long", true, "Like a ball balanced on a hilltop. Part 10 explains why this matters."],
          ["No, never", false, "There is a balance point in between: the metastable state."],
          ["Yes, it can stay at any voltage forever", false, "Only the exact balance point, and any disturbance knocks it off."],
        ]},
      ]},
      { k: "learn", title: "But no way to control it", b: [
        `<p>When power comes on, the loop lands in one state or the other, unpredictably. And it has no inputs, so you can't change it.</p>`,
        `<p>Latches and flip-flops are bistable elements <b>with inputs</b> to control the state.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do two cross-coupled inverters store one bit?", model: "They have two stable states: if Q is 0, the second inverter makes Q̅ = 1, which makes the first inverter output Q = 0 again, and the same works for Q = 1. Each state holds itself. Two stable states carry log₂2 = 1 bit." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  function srFig(Sv, Rv, q, qb) {
    const t = gate("nor", 170, 70), u = gate("nor", 170, 190);
    let s = t.s + u.s;
    s += `<line class="${W(Rv)}" x1="60" y1="${t.ins[0][1]}" x2="${t.ins[0][0]}" y2="${t.ins[0][1]}"/>` + S.t(54, t.ins[0][1] + 5, "R = " + Rv, { a: "end" });
    s += `<line class="${W(Sv)}" x1="60" y1="${u.ins[1][1]}" x2="${u.ins[1][0]}" y2="${u.ins[1][1]}"/>` + S.t(54, u.ins[1][1] + 5, "S = " + Sv, { a: "end" });
    s += `<line class="${W(q)}" x1="${t.out[0]}" y1="70" x2="350" y2="70"/>` + S.t(356, 75, "Q = " + q, { a: "start", cls: "big" });
    s += `<line class="${W(qb)}" x1="${u.out[0]}" y1="190" x2="350" y2="190"/>` + S.t(356, 195, "Q̅ = " + qb, { a: "start" });
    s += `<polyline class="${W(q)}" points="270,70 270,104 126,152 126,${u.ins[0][1]} ${u.ins[0][0]},${u.ins[0][1]}"/>` + S.dot(270, 70);
    s += `<polyline class="${W(qb)}" points="290,190 290,156 112,108 112,${t.ins[1][1]} ${t.ins[1][0]},${t.ins[1][1]}"/>` + S.dot(290, 190);
    s += S.t(195, 40, "N1", { cls: "s" }) + S.t(195, 230, "N2", { cls: "s" });
    return S.svg(440, 250, s, { max: 440, label: "SR latch built from two NOR gates" });
  }
  const p2 = {
    id: "p2", title: "The SR latch", mins: 20,
    blurb: "Two cross-coupled NOR gates: S sets, R resets, neither holds.",
    takeaway: "SR latch: two cross-coupled NOR gates N1 (inputs R and Q̅, output Q) and N2 (inputs S and Q, output Q̅). R = 1, S = 0: Q = 0 (reset). R = 0, S = 1: Q = 1 (set). R = S = 0: Q keeps its previous value Q_prev (memory), by the same case analysis as the inverter loop. R = S = 1: both outputs 0, a nonsense state (set and reset at once). Set = make TRUE, reset = make FALSE. The single state variable Q captures the whole history: all that matters is whether the latch was most recently set or reset. Any element with this truth table and symbol is an SR latch, however it's built (abstraction, modularity). Patt & Patel's NAND version is the same idea with active-low inputs.",
    steps: [
      { k: "learn", title: "Add inputs to the loop", b: [
        `<p>Replace the inverters with NOR gates. The spare inputs are <b>S</b> (set: make Q = 1) and <b>R</b> (reset: make Q = 0).</p>`,
        `<p>A NOR outputs 0 if <b>any</b> input is 1. That's the key to each case.</p>`,
      ]},
      { k: "play", title: "Drive the SR latch", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), vd = el(`<span class="verdict"></span>`);
          let Sv = 0, Rv = 0, q = 1;
          function draw() {
            let qb;
            if (Sv && Rv) { q = 0; qb = 0; } else if (Sv) { q = 1; qb = 0; } else if (Rv) { q = 0; qb = 1; } else qb = 1 - q;
            f.innerHTML = srFig(Sv, Rv, q, qb);
            vd.className = "verdict " + (Sv && Rv ? "no" : !Sv && !Rv ? "ok" : "mid");
            vd.textContent = Sv && Rv ? "S = R = 1: both outputs 0. The latch is told to set and reset at once." : Sv ? "Set: Q = 1." : Rv ? "Reset: Q = 0." : `Hold: Q remembers ${q}.`;
          }
          host.append(toggle(["S = 0", "S = 1"], (v) => { Sv = v; draw(); }, 0), toggle(["R = 0", "R = 1"], (v) => { Rv = v; draw(); }, 0), f, vd);
          draw();
        },
        `<p class="aside">Set S to 1 and back to 0: Q stays 1. Pulse R: Q goes to 0 and stays. Highlighted wires are 1.</p>`,
      ]},
      { k: "learn", title: "The truth table", b: [
        `<div class="tbl"><table><thead><tr><th>S</th><th>R</th><th>Q</th><th>Q̅</th><th></th></tr></thead><tbody>
          <tr><td>0</td><td>0</td><td>Q<sub>prev</sub></td><td>Q̅<sub>prev</sub></td><td>hold (memory)</td></tr>
          <tr><td>0</td><td>1</td><td>0</td><td>1</td><td>reset</td></tr>
          <tr><td>1</td><td>0</td><td>1</td><td>0</td><td>set</td></tr>
          <tr><td>1</td><td>1</td><td>0</td><td>0</td><td>nonsense</td></tr></tbody></table></div>`,
        `<p>All the history of S and R is captured by one bit, Q: was the latch most recently set or reset?</p>`,
        seenPP("The NAND version, with active-low S and R.", "03-digital-logic-structures.html#p7", "Chapter 3, Part 7"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Q is 0. The inputs go S = 1, then S = 0, then R = 1, then R = 0. What's Q now?", opts: [["0", true, "Set made it 1, reset made it 0, and it holds 0."], ["1", false, "The reset came after the set."], ["Unknown", false, "S and R were never both 1, so it's well defined."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does each input combination do to an SR latch?", model: "S = 1 sets Q to 1; R = 1 resets Q to 0; with both 0 the latch holds its previous value; both 1 is not used, because it tries to set and reset at once and makes both outputs 0." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const CLK16 = [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1];
  const p3 = {
    id: "p3", title: "D latch and D flip-flop", mins: 25,
    blurb: "Separate what (D) from when (CLK). Latches are transparent; flip-flops sample on the edge.",
    takeaway: "The SR latch mixes up what the state should be and when it should change. The D latch separates them: D says what, CLK says when. Internally, CLK = 0 forces S = R = 0 (hold); CLK = 1 makes S = D, R = D̅. So CLK = 1: transparent (Q = D, like a buffer); CLK = 0: opaque (Q holds). It's level-sensitive (a transparent latch). D flip-flop: two D latches back to back on complementary clocks, master L1 then slave L2 (node N1 between). CLK = 0: master transparent, slave opaque, D reaches N1. CLK = 1: master opaque, slave transparent, N1 reaches Q. So a D flip-flop copies D to Q on the rising edge of the clock and remembers its state at all other times (memorize this). Also called master-slave, edge-triggered or positive-edge-triggered; the triangle on the symbol marks an edge-triggered clock. Gate-level transistor count: NAND/NOR 4, NOT 2, AND 6; SR latch 8; D latch 22; D flip-flop 46.",
    steps: [
      { k: "learn", title: "What and when", b: [
        `<p>An SR latch's inputs say both <b>what</b> the state should be and <b>when</b> to change it. Designs get easier when those are separate.</p>`,
        `<div class="two"><div class="tile"><h3>D (data)</h3><p>What the next state should be.</p></div><div class="tile"><h3>CLK (clock)</h3><p>When the state may change.</p></div></div>`,
        `<p>The <b>D latch</b>: CLK = 1, it's <b>transparent</b> (Q = D). CLK = 0, it's <b>opaque</b> (Q holds). It's level-sensitive. And S = R = 1 can no longer happen.</p>`,
      ]},
      { k: "learn", title: "The D flip-flop", b: [
        `<p>Put two D latches back to back with opposite clocks: the <b>master</b> is transparent while CLK = 0, the <b>slave</b> while CLK = 1. There's always one opaque latch between D and Q, except at the instant the clock rises.</p>`,
        `<div class="key">A D flip-flop copies D to Q on the <b>rising edge</b> of the clock, and remembers its state at all other times.</div>`,
        `<p class="aside">The book says it plainly: reread that definition until you have it memorized. Forgetting it is the most common beginner mistake.</p>`,
      ]},
      { k: "play", title: "Draw D, compare latch and flop", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let D = [0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0];
          function draw() {
            let ql = 0, qf = 0;
            const L = D.map((d, i) => (ql = CLK16[i] ? d : ql)), F = D.map((d, i) => { if (i > 0 && CLK16[i] && !CLK16[i - 1]) qf = D[i - 1]; return qf; });
            f.innerHTML = wave([{ name: "CLK", v: CLK16 }, { name: "D", v: D }, { name: "Q latch", v: L, cls: "hl" }, { name: "Q flop", v: F }], { dx: 22, x0: 80, marks: [2, 6, 10, 14].map((t) => ({ t })) });
          }
          const bb = bitButtons(D.join(""), (b) => { D = b.split("").map(Number); draw(); }, { label: "D in each time slot" });
          host.append(el(`<p class="aside">Click to change D in each time slot:</p>`), bb.el, f);
          draw();
        },
        `<p class="aside">Dashed lines are rising edges. The latch follows D while CLK is high. The flop changes only at the dashed lines, to the value D had just before. (Both start at 0 here; in a real circuit the starting value is unknown.)</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "CLK is 1 and stays 1. D changes three times. How many times can each output change?", opts: [["Latch: three times. Flip-flop: zero times", true, "The latch is transparent the whole time; the flop only acts on a rising edge."], ["Both three times", false, "The flop ignores D except at the rising edge."], ["Both zero times", false, "A transparent latch passes D straight through."]] },
        { t: "num", q: "At gate level (NAND/NOR = 4, NOT = 2, AND = 6 transistors), an SR latch is 8 and a D latch is 22. A D flip-flop is two D latches plus one inverter. How many transistors?", a: 46, tol: 0, why: "2 × 22 + 2 = 46. Part 4 shows a 20-transistor version." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between a D latch and a D flip-flop?", model: "A D latch is level-sensitive: while the clock is high it's transparent and Q follows D; while the clock is low it holds. A D flip-flop is edge-triggered: it copies D to Q only at the rising edge of the clock and holds Q at all other times." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Registers, enables, resets", mins: 20,
    blurb: "Banks of flip-flops, and the extra controls real designs need. Plus compact transistor-level versions.",
    takeaway: "An N-bit register is N flip-flops sharing one CLK; D and Q are N-bit busses. Enabled flip-flop: EN = 1 loads D on the clock edge, EN = 0 keeps the old value. Build it with an input mux (recycle Q when EN = 0), or by gating the clock (AND CLK with EN), but clock gating delays the clock and EN must not change while CLK = 1: logic on the clock is generally a bad idea. Resettable flip-flop: RESET forces Q = 0 to put a system in a known state at power-up. Synchronous reset acts on the clock edge (an AND gate on D: with an active-low reset, 0 forces a 0 in); asynchronous reset acts immediately, independent of CLK. Settable flip-flops load 1. Transistor level: a single transmission gate makes a latch, but its output floats (a dynamic node) and it has no buffers, so noise can disturb it or drive it backwards; a robust 12-transistor latch adds input/output inverters and a feedback inverter plus tristate to keep the node static. A flip-flop from two such latches takes about 20 transistors.",
    steps: [
      { k: "learn", title: "Registers", b: [
        `<p>An <b>N-bit register</b> is N flip-flops with a shared clock, so all N bits update together. D<sub>3:0</sub> and Q<sub>3:0</sub> are 4-bit busses.</p>`,
        `<p>Registers are the key building block of almost every sequential circuit.</p>`,
        seenPP("Registers in the LC-3 data path.", "03-digital-logic-structures.html#p11", "Chapter 3, Part 11"),
      ]},
      { k: "play", title: "A 4-bit register with EN and RESET", b: [
        (host, id) => {
          const ro = el(`<div></div>`), log = el(`<p class="aside"></p>`);
          let D = "1011", Q = "0110", EN = 1, RST = 0;
          const draw = (m) => { ro.innerHTML = readout([["D[3:0]", D], ["Q[3:0]", Q]]); if (m) log.textContent = m; };
          const edge = btn("Rising clock edge ↑", "primary");
          edge.addEventListener("click", () => { if (RST) { Q = "0000"; draw("RESET = 1: Q cleared to 0000 on the edge (synchronous reset)."); } else if (EN) { Q = D; draw("EN = 1: D copied into Q."); } else draw("EN = 0: Q kept its old value."); });
          const bb = bitButtons(D, (b) => { D = b; draw(); }, { label: "D" });
          host.append(el(`<p class="aside">D[3:0]:</p>`), bb.el, toggle(["EN = 0", "EN = 1"], (v) => { EN = v; }, 1), toggle(["RESET = 0", "RESET = 1"], (v) => { RST = v; }, 0), edge, ro, log);
          draw("Change D, then press the clock edge. Nothing happens between edges.");
        },
      ]},
      { k: "learn", title: "Two ways to add an enable", b: [
        `<div class="two"><div class="tile"><h3>Input mux</h3><p>EN = 1: the mux passes D. EN = 0: it feeds Q back in, so the flop reloads its own value. Safe.</p></div><div class="tile"><h3>Gated clock</h3><p>AND the clock with EN. Cheaper, but it <b>delays the clock</b>, and if EN changes while CLK = 1 the flop sees a false edge.</p></div></div>`,
        `<div class="key">Performing logic on the clock is generally a bad idea. Do it only if you know exactly what you're doing (CMOS VLSI covers clock gating properly).</div>`,
      ]},
      { k: "learn", title: "Resets", b: [
        `<p>At power-up every flip-flop holds a random value. A <b>reset</b> forces a known state (0).</p>`,
        `<div class="two"><div class="tile"><h3>Synchronous</h3><p>Resets on the next rising edge. Easy: an AND gate on D.</p></div><div class="tile"><h3>Asynchronous</h3><p>Resets the instant RESET is asserted, clock or no clock. Needs changes inside the flop.</p></div></div>`,
        `<p class="aside">An <b>active-low</b> reset does its job when it's 0 (often written with a bar or a trailing b, like RESETb).</p>`,
      ]},
      { k: "learn", title: "Fewer transistors", b: [
        `<p>A latch is really a switch that's open or closed: a <b>transmission gate</b> can do it with 2 transistors. But alone it has two problems:</p>`,
        `<ul><li><b>Floating output:</b> when opaque, nothing holds Q. Leakage and noise can change it (a <b>dynamic</b> node).</li><li><b>No buffers:</b> noise on D can turn the switch on, and noise on Q can drive back into D.</li></ul>`,
        `<p>Real chips use a <b>12-transistor latch</b>: inverters buffer input and output, and an inverter plus a tristate feed back to hold the node (a <b>static</b> node). Two of these make a <b>20-transistor flip-flop</b>.</p>`,
        `<p class="aside">Rule: never expose a transmission gate's input or a sequential circuit's state node to the outside world.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why is an enabled flip-flop usually built with a mux rather than by gating the clock?", opts: [["Gating delays the clock and can create false edges if EN changes while CLK is high", true, "The mux version keeps the clock clean."], ["The mux version uses fewer transistors", false, "It actually uses more."], ["Gated clocks can't hold a value", false, "They can; the risk is timing."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between a synchronous and an asynchronous reset?", model: "A synchronous reset only takes effect on the next rising clock edge, like any other input to the flip-flop. An asynchronous reset forces the output to 0 immediately when it's asserted, whether or not the clock is running." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Why synchronous design", mins: 20,
    blurb: "Loops without registers oscillate or race. Put a register in every loop.",
    takeaway: "Some sequential circuits are kooky. Three inverters in a loop have no stable state (astable): a ring oscillator, period = 2 × (number of inverters) × t_pd (3 inverters at 1 ns: 6 ns), hard to predict because delays vary with manufacturing, voltage and temperature. Ben's “improved” D latch (Q = CLK·D + CLK̅·Q_prev, feeding Q back) has a race condition: if the CLK inverter is slow, Q can fall before CLK̅ rises when CLK falls, and the latch forgets. Asynchronous circuits with direct feedback are infamous for races. Fix: break every cyclic path with a register; the state then changes only at clock edges, and if the clock is slow enough all races are gone. Rules of synchronous sequential composition: every element is a register or combinational; at least one element is a register; all registers share the same clock; every cyclic path contains at least one register. Timing spec: t_pcq and t_ccq (clock-to-Q propagation and contamination delays), t_setup and t_hold. A flip-flop's next state S′ is D and its output Q is the current state S. Asynchronous design is more general (like analog vs digital) but harder; virtually all digital systems are synchronous.",
    steps: [
      { k: "learn", title: "A loop of three inverters", b: [
        `<p>Assume X = 0. Then Y = 1, Z = 0, so X = 1. Contradiction! The loop has <b>no stable state</b>: it's <b>astable</b>, and it oscillates. This is a <b>ring oscillator</b>.</p>`,
      ]},
      { k: "play", title: "Ring oscillator", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let N = 3, td = 1;
          function draw() {
            const T = 2 * N * td, slots = 4 * N, sigs = [];
            const base = (t) => ((Math.floor(t / N) % 2) + 2) % 2;
            for (let k = 0; k < 3; k++) { const v = []; for (let t = 0; t < slots; t++) v.push(base(t - k) ^ (k % 2)); sigs.push({ name: "node " + (k + 1), v }); }
            f.innerHTML = wave(sigs, { dx: Math.max(5, 320 / slots), x0: 70 });
            ro.innerHTML = readout([["Period T = 2·N·t_pd", fmt(T, 3) + " ns"], ["Frequency", si(1 / (T * 1e-9), "Hz")]]);
          }
          host.append(slider({ id: id + "-n", label: "Inverters in the loop (odd)", min: 3, max: 15, step: 2, value: N, show: (x) => String(x) }, (x) => { N = x; draw(); }).el,
            slider({ id: id + "-d", label: "Delay per inverter t_pd", min: 0.01, max: 2, step: 0.01, value: td, show: (x) => fmt(x * 1000, 3) + " ps" }, (x) => { td = x; draw(); }).el, f, ro);
          draw();
        },
        `<p class="aside">Each time slot is one inverter delay. Each edge travels around the loop twice per period (once rising, once falling), so T = 2 × N × t<sub>pd</sub>. Ring oscillators are really used, to measure how fast a chip's gates are.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Five inverters, each with 20 ps delay, in a loop. What's the oscillation frequency?", a: 5e9, tol: 0.01, unit: "Hz", hint: "T = 2 × 5 × 20 ps.", why: "T = 200 ps, so f = 5 GHz." },
      ]},
      { k: "learn", title: "Races", b: [
        `<p>Ben builds a cheaper D latch: Q = CLK·D + CLK̅·Q<sub>prev</sub>, with Q fed straight back. The truth table is right. But when CLK falls, if the inverter making CLK̅ is slower than the AND and OR gates, Q drops before CLK̅ rises to hold it. The latch forgets.</p>`,
        `<div class="key">A <b>race condition</b>: the behaviour depends on which of two paths is faster. It might work in one chip and fail in another, or only at some temperatures. Very hard to debug.</div>`,
      ]},
      { k: "learn", title: "The synchronous discipline", b: [
        `<p>Break every loop with a register. The state then changes only on clock edges; if the clock is slow enough for everything to settle, there are no races.</p>`,
        `<ol><li>Every element is a register or combinational logic.</li><li>At least one element is a register.</li><li>All registers get the <b>same</b> clock.</li><li>Every cyclic path contains at least one register.</li></ol>`,
        `<p class="aside">Asynchronous design is more general, like analog vs digital, and still has uses (crossing clock domains, real-world inputs). But virtually all digital systems are synchronous.</p>`,
      ]},
      { k: "check", title: "Synchronous or not?", b: [
        { t: "sort", q: "Is each circuit a synchronous sequential circuit?", bins: ["Yes", "No"], items: [
          ["Logic feeding a register whose output feeds back into the logic", 0, "That's an FSM."],
          ["Logic whose output feeds back into its own input, no register", 1, "A cyclic path with no register."],
          ["Two registers in a row, the second clocked through two inverters", 1, "The registers don't share the same clock signal."],
          ["Register → logic → register → logic → register (one clock)", 0, "That's a pipeline."],
          ["Logic → a D latch → logic", 1, "A latch is neither a register nor combinational."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do designers insist on a register in every loop?", model: "A loop without a register can oscillate, like a ring oscillator, or race, where the result depends on which path is faster. A register breaks the loop: the state only changes on clock edges, and if the clock period is long enough for the logic to settle, the next state is always well defined." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const TL = {
    nodes: [{ id: "S0", x: 90, y: 60, label: "S0", sub: "A grn" }, { id: "S1", x: 330, y: 60, label: "S1", sub: "A yel" }, { id: "S2", x: 330, y: 210, label: "S2", sub: "B grn" }, { id: "S3", x: 90, y: 210, label: "S3", sub: "B yel" }],
    edges: [{ from: "S0", to: "S0", label: "TA=1", ang: 180 }, { from: "S0", to: "S1", label: "TA=0" }, { from: "S1", to: "S2", label: "" }, { from: "S2", to: "S2", label: "TB=1", ang: 0 }, { from: "S2", to: "S3", label: "TB=0" }, { from: "S3", to: "S0", label: "" }],
  };
  const LIGHT = { S0: ["green", "red"], S1: ["yellow", "red"], S2: ["red", "green"], S3: ["red", "yellow"] };
  const p6 = {
    id: "p6", title: "Finite state machines: a traffic light", mins: 30,
    blurb: "From a written spec to a state diagram, tables, equations and a circuit.",
    takeaway: "An FSM = a state register (k bits, so up to 2^k states) + next-state logic + output logic, plus a clock and usually a reset. Moore machine: outputs depend only on the current state. Mealy machine: outputs depend on the current state and the inputs. Traffic-light example: inputs TA, TB (traffic present on Academic Ave and Bravado Blvd), outputs LA, LB (green, yellow or red), clock period 5 s, reset to S0. States: S0 (LA green, LB red) stays while TA, else → S1 (LA yellow) → S2 (LB green) stays while TB, else → S3 (LB yellow) → S0. State transition table (with X don't cares), binary state encoding S0 = 00 … S3 = 11, output encoding green 00, yellow 01, red 10. Next state: S1′ = S1 ⊕ S0; S0′ = S̅1S̅0T̅A + S1S̅0T̅B. Outputs: LA1 = S1, LA0 = S̅1S0, LB1 = S̅1, LB0 = S1S0. (S′ with a prime means next state, not complement.)",
    steps: [
      { k: "learn", title: "The FSM shape", b: [
        fig(S.svg(440, 120, S.box(70, 30, 90, 50, "") + S.t(115, 52, "next-state", { cls: "s" }) + S.t(115, 68, "logic", { cls: "s" }) + S.box(200, 30, 70, 50, "") + S.t(235, 52, "state", { cls: "s" }) + S.t(235, 68, "register", { cls: "s" }) + S.box(310, 30, 90, 50, "") + S.t(355, 52, "output", { cls: "s" }) + S.t(355, 68, "logic", { cls: "s" }) + S.arrow(10, 55, 68, 55) + S.t(10, 45, "inputs", { a: "start", cls: "s" }) + S.arrow(162, 55, 198, 55) + S.arrow(272, 55, 308, 55) + S.arrow(402, 55, 438, 55) + `<polyline class="w" points="235,80 235,104 115,104 115,82" style="stroke-dasharray:4 3"/>` + S.t(175, 116, "current state fed back", { cls: "s m" }), { label: "Moore finite state machine structure" })),
        `<div class="two"><div class="tile"><h3>Moore</h3><p>Outputs depend only on the <b>current state</b>.</p></div><div class="tile"><h3>Mealy</h3><p>Outputs depend on the current state <b>and the inputs</b>.</p></div></div>`,
        `<p class="aside">k state bits give at most 2<sup>k</sup> states: finite, hence the name.</p>`,
      ]},
      { k: "learn", title: "The spec", b: [
        `<p>A campus crossing: students on Academic Ave, footballers on Bravado Blvd, nobody looking. Sensors <b>TA</b>, <b>TB</b> say whether each road has traffic. Lights <b>LA</b>, <b>LB</b> are green, yellow or red. The clock ticks every 5 s; a reset puts the lights in a known state.</p>`,
        `<p>Rule: keep Academic green while it has traffic. When it's empty, Academic goes yellow for one tick, then red, and Bravado goes green. Same in reverse.</p>`,
      ]},
      { k: "play", title: "Run the controller", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let cur = "S0", TA = 1, TB = 1;
          const nxt = { S0: () => (TA ? "S0" : "S1"), S1: () => "S2", S2: () => (TB ? "S2" : "S3"), S3: () => "S0" };
          function draw() { f.innerHTML = fsm(TL.nodes, TL.edges, { cur, H: 270, label: "Traffic light controller state diagram" }); const enc = { S0: "00", S1: "01", S2: "10", S3: "11" }[cur]; ro.innerHTML = readout([["State S1:0", `${cur} = ${enc}`], ["LA (Academic)", LIGHT[cur][0]], ["LB (Bravado)", LIGHT[cur][1]]]); }
          const t = btn("Clock tick (5 s) →", "primary"), r = btn("Reset");
          t.addEventListener("click", () => { cur = nxt[cur](); draw(); });
          r.addEventListener("click", () => { cur = "S0"; draw(); });
          const row = el(`<div class="row"></div>`); row.append(t, r);
          host.append(toggle(["TA = 0 (Academic empty)", "TA = 1"], (v) => { TA = v; }, 1), toggle(["TB = 0 (Bravado empty)", "TB = 1"], (v) => { TB = v; }, 1), row, ro, f);
          draw();
        },
        `<p class="aside">This is a Moore machine: the lights are written inside the states. Arcs with no label always happen on the next tick.</p>`,
      ]},
      { k: "learn", title: "Tables and encodings", b: [
        `<div class="tbl"><table><thead><tr><th>S</th><th>TA</th><th>TB</th><th>S′</th></tr></thead><tbody><tr><td>S0</td><td>0</td><td>X</td><td>S1</td></tr><tr><td>S0</td><td>1</td><td>X</td><td>S0</td></tr><tr><td>S1</td><td>X</td><td>X</td><td>S2</td></tr><tr><td>S2</td><td>X</td><td>0</td><td>S3</td></tr><tr><td>S2</td><td>X</td><td>1</td><td>S2</td></tr><tr><td>S3</td><td>X</td><td>X</td><td>S0</td></tr></tbody></table></div>`,
        `<p>Encode states in binary (S0 = 00, S1 = 01, S2 = 10, S3 = 11) and lights in 2 bits (green 00, yellow 01, red 10). The table becomes a truth table for the next-state logic.</p>`,
        `<p class="aside">S′ (with a prime) means the next state, not a complement.</p>`,
      ]},
      { k: "learn", title: "The equations", b: [
        `<div class="eq">S′<sub>1</sub> = S<sub>1</sub> ⊕ S<sub>0</sub>    S′<sub>0</sub> = S̅<sub>1</sub>S̅<sub>0</sub>T̅<sub>A</sub> + S<sub>1</sub>S̅<sub>0</sub>T̅<sub>B</sub></div>`,
        `<div class="eq">LA<sub>1</sub> = S<sub>1</sub>   LA<sub>0</sub> = S̅<sub>1</sub>S<sub>0</sub>   LB<sub>1</sub> = S̅<sub>1</sub>   LB<sub>0</sub> = S<sub>1</sub>S<sub>0</sub></div>`,
        `<p>Then draw it: a 2-bit state register with reset, the next-state gates feeding it, the output gates reading from it.</p>`,
      ]},
      { k: "check", title: "Check an equation", b: [
        { t: "mcq", q: "Why is S′₁ = S₁ ⊕ S₀?", opts: [["S′₁ is 1 for current states 01 and 10 (S1 → S2, S2 → S2 or S3), and 0 for 00 and 11. That's exactly when S₁ ≠ S₀", true, "The TB and T̅B terms for state 10 cover both cases, so the input drops out."], ["Because the lights alternate", false, "Derive it from the table: list the current states whose next state has S₁ = 1."], ["It isn't; it depends on TA", false, "From state 00 the next state is 00 or 01: S′₁ = 0 either way."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "List the steps to design an FSM from a written specification.", model: "Identify the inputs and outputs. Sketch a state transition diagram. Write a state transition table and an output table (or one combined table for a Mealy machine). Choose state encodings. Write Boolean equations for the next-state and output logic. Sketch the circuit: state register, next-state logic, output logic." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const MOORE = { S0: { 0: "S1", 1: "S0", y: 0 }, S1: { 0: "S1", 1: "S2", y: 0 }, S2: { 0: "S1", 1: "S0", y: 1 } };
  const MEALY = { S0: { 0: ["S1", 0], 1: ["S0", 0] }, S1: { 0: ["S1", 0], 1: ["S0", 1] } };
  const p7 = {
    id: "p7", title: "Encodings, Moore vs Mealy", mins: 25,
    blurb: "Binary or one-hot? And a snail that smiles one cycle sooner if you let it look at its input.",
    takeaway: "State encoding changes the circuit. There's no simple way to find the best one except trying them (CAD tools help). Binary encoding: K states in log₂K bits. One-hot: K bits, exactly one 1: more flip-flops but often simpler next-state and output logic (one-cold: exactly one 0). Divide-by-3 counter (output high one cycle in three): binary needs 2 flip-flops; one-hot needs 3 (with settable/resettable flops to reset to S0) and its next-state logic is just wires (S′2 = S1, S′1 = S0, S′0 = S2, Y = S0). Moore machines label outputs in the states; Mealy machines label arcs input/output. The snail detecting “01”: the Moore machine needs 3 states (S2 = just saw 01, output 1); the Mealy machine needs 2, and its output rises a cycle sooner because it responds to the input directly. Delaying the Mealy output through a flip-flop would match the Moore output. Choose based on when you want outputs to respond.",
    steps: [
      { k: "learn", title: "Binary vs one-hot", b: [
        `<div class="two"><div class="tile"><h3>Binary</h3><p>Number the states: K states in log<sub>2</sub>K bits. Fewest flip-flops.</p></div><div class="tile"><h3>One-hot</h3><p>One bit per state, exactly one bit is 1. More flip-flops, but the logic is often much simpler.</p></div></div>`,
        `<p>Example: a <b>divide-by-3 counter</b> outputs 1 for one cycle in three (S0 → S1 → S2 → S0, Y = 1 in S0). One-hot: the next-state logic is just wires, S′<sub>1</sub> = S<sub>0</sub>, S′<sub>2</sub> = S<sub>1</sub>, S′<sub>0</sub> = S<sub>2</sub>, and Y = S<sub>0</sub>. The 1 circulates like a ring.</p>`,
        `<p class="aside">The one-hot version needs one <b>settable</b> flop so reset puts the 1 in S0.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "An FSM has 10 states. How many flip-flops does a binary encoding need?", a: 4, tol: 0, why: "2³ = 8 < 10 ≤ 16 = 2⁴. One-hot would need 10." },
      ]},
      { k: "learn", title: "The smiling snail", b: [
        `<p>A robot snail crawls along a tape of bits, one per clock cycle. It smiles (Y = 1) when the last two bits it crawled over were <b>0 then 1</b>.</p>`,
        `<div class="two"><div class="tile"><h3>Moore: 3 states</h3><p>S0 (nothing useful), S1 (just saw 0), S2 (just saw 01: smile). A 0 from any state goes to S1, because that 0 might start a new “01”.</p></div><div class="tile"><h3>Mealy: 2 states</h3><p>S0, S1 (just saw 0). Arcs labelled input/output: from S1, input 1 gives output 1.</p></div></div>`,
      ]},
      { k: "play", title: "Race the two snails", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let tape = "0100110111";
          function draw() {
            const A = tape.split("").map(Number);
            let sm = "S0", sl = "S0";
            const mS = [], mY = [], lS = [], lY = [];
            A.forEach((a) => { mS.push(sm); mY.push(MOORE[sm].y); lS.push(sl); lY.push(MEALY[sl][a][1]); sm = MOORE[sm][a]; sl = MEALY[sl][a][0]; });
            f.innerHTML = wave([{ name: "A", v: A }, { name: "Moore S", v: mS }, { name: "Moore Y", v: mY, cls: "hl" }, { name: "Mealy S", v: lS }, { name: "Mealy Y", v: lY, cls: "hl" }], { dx: 34, x0: 80 });
          }
          const bb = bitButtons(tape, (b) => { tape = b; draw(); }, { label: "Tape bits" });
          host.append(el(`<p class="aside">The tape (click to change bits):</p>`), bb.el, f);
          draw();
        },
        `<p class="aside">Each column is one clock cycle. The Mealy output goes high in the same cycle the 1 arrives; the Moore output waits for the state to change, one cycle later.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why does the Moore snail need a third state that the Mealy snail doesn't?", opts: [["Its output can only depend on the state, so “just saw 01, smile” must be a state of its own", true, "Mealy puts that output on the arc instead."], ["Moore machines can't have self-loops", false, "They can."], ["The Mealy machine forgets the last bit", false, "It remembers just enough: whether the last bit was 0."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the practical difference between a Moore and a Mealy output?", model: "A Moore output depends only on the state, so it changes just after a clock edge and stays steady through the cycle, but it reacts to an input a cycle later. A Mealy output depends on the inputs too, so it reacts within the same cycle, which can need fewer states, but it can change mid-cycle whenever the inputs change." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Factoring FSMs, and reading one from a circuit", mins: 15,
    blurb: "Split a messy machine into small talking ones. And reverse-engineer a mystery lock.",
    takeaway: "Factoring: break a complex FSM into several simpler interacting FSMs, where some outputs are other machines' inputs (hierarchy and modularity). Example: adding a parade mode to the traffic light (P enters, R leaves; stay with Bravado green) doubles the single FSM to 8 states, but factored it's a 2-state Mode FSM (output M) plus the Lights FSM with one change (stay in S2 while M or TB). Deriving an FSM from a schematic: list inputs, outputs and state bits; write next-state and output equations; make the tables; remove unreachable states; name the states; rewrite tables with names; draw the diagram; then say in words what it does (its purpose, not each transition).",
    steps: [
      { k: "learn", title: "Factoring", b: [
        `<p>Add a <b>parade mode</b> to the traffic light: input P starts it, R ends it, and during it Bravado stays green.</p>`,
        `<div class="two"><div class="tile"><h3>One big FSM</h3><p>Every state now needs a normal copy and a parade copy: 8 states and a tangle of arcs.</p></div><div class="tile"><h3>Factored</h3><p>A 2-state <b>Mode FSM</b> outputs M (parade on). The Lights FSM changes one arc: stay in S2 while M + TB.</p></div></div>`,
        `<p>That's hierarchy and modularity applied to state machines.</p>`,
      ]},
      { k: "learn", title: "Reading an FSM from a circuit", b: [
        `<ol><li>Identify inputs, outputs and state bits.</li><li>Write the next-state and output equations.</li><li>Make next-state and output tables.</li><li>Remove states that can never be reached.</li><li>Name each valid state.</li><li>Rewrite the tables with names, and draw the state diagram.</li><li>Say in words what the machine does.</li></ol>`,
        `<p class="aside">Step 7 matters most: describe the <b>purpose</b> (“it unlocks after seeing 3 then 1”), not each arc.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A 2-bit state register never reaches state 11 from any state. In the reduced tables you should…", opts: [["remove the rows for current state 11 (they can't happen)", true, "Unreachable states drop out, and their next states can be treated as don't cares when simplifying."], ["keep them and set their outputs to 1", false, "They never occur, so their outputs don't matter."], ["add a new state for them", false, "They're unreachable."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why factor a state machine?", model: "Because one machine that tracks everything at once can have a huge number of states and arcs. Splitting it into smaller machines that each track one thing, and pass signals to each other, keeps every machine simple to design, understand and change." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Timing: setup and hold", mins: 30,
    blurb: "How fast can the clock go? And the hold-time bug that no clock speed can fix.",
    takeaway: "A flip-flop samples D at the clock edge, like a camera: D must be still during an aperture from t_setup before the edge to t_hold after it (the dynamic discipline). Then signals can be treated as discrete in time (A[n] = value at the end of cycle n). Timing spec: after the edge, Q may start changing after t_ccq (clock-to-Q contamination delay) and settles by t_pcq (propagation delay). Clock period T_c = 1/f_c. Setup (max-delay) constraint between registers: T_c ≥ t_pcq + t_pd + t_setup, i.e. t_pd ≤ T_c − (t_pcq + t_setup); t_pcq + t_setup is the sequencing overhead. Hold (min-delay) constraint: t_ccq + t_cd ≥ t_hold, i.e. t_cd ≥ t_hold − t_ccq. Back-to-back flops (t_cd = 0) need t_hold ≤ t_ccq; flops are usually designed with t_hold ≈ 0. Setup violations are fixed by slowing the clock; hold violations can't be (you must redesign, e.g. add buffers to short paths), which can cost months and millions on a chip.",
    steps: [
      { k: "learn", title: "The camera analogy", b: [
        `<p>Photograph a frog jumping off a lily pad. Too early: frog on pad. Too late: ripples. Just as it jumps: a blur. A flip-flop sampling D is like that camera.</p>`,
        fig(wave([{ name: "CLK", v: [0, 0, 0, 1, 1, 1, 1, 0] }, { name: "D", v: ["x", "x", "stable", "stable", "x", "x", "x", "x"] }], { dx: 40, marks: [{ t: 2, label: "t_setup" }, { t: 3 }, { t: 4, label: "t_hold" }] })),
        `<div class="key"><b>Dynamic discipline:</b> D must be stable from t<sub>setup</sub> before the rising edge until t<sub>hold</sub> after it. That window is the <b>aperture</b>.</div>`,
      ]},
      { k: "learn", title: "The register timing spec", b: [
        `<div class="two"><div class="tile"><h3>t<sub>ccq</sub></h3><p>Clock-to-Q <b>contamination</b> delay: Q may start changing this soon after the edge.</p></div><div class="tile"><h3>t<sub>pcq</sub></h3><p>Clock-to-Q <b>propagation</b> delay: Q has definitely settled by now.</p></div></div>`,
        `<p>Between two registers R1 → logic → R2, two constraints follow:</p>`,
        `<div class="eq">Setup: T<sub>c</sub> ≥ t<sub>pcq</sub> + t<sub>pd</sub> + t<sub>setup</sub>      Hold: t<sub>ccq</sub> + t<sub>cd</sub> ≥ t<sub>hold</sub></div>`,
      ]},
      { k: "play", title: "Timing calculator", b: [
        (host, id) => {
          const ro = el(`<div></div>`), v1 = el(`<span class="verdict"></span>`), v2 = el(`<span class="verdict"></span>`);
          let tpcq = 70, ts = 40, ng = 5, gpd = 35, tccq = 30, th = 40, gcd = 20, nsh = 1, skew = 0;
          function draw() {
            const Tc = tpcq + ng * gpd + ts + skew, hold = tccq + nsh * gcd - (th + skew);
            ro.innerHTML = readout([["Minimum T_c", fmt(Tc, 3) + " ps"], ["Maximum f_c", si(1e12 / Tc, "Hz")], ["Sequencing overhead (t_pcq + t_setup + t_skew)", fmt(tpcq + ts + skew, 3) + " ps"], ["Hold slack (t_ccq + t_cd − t_hold − t_skew)", fmt(hold, 3) + " ps"]]);
            v1.className = "verdict ok"; v1.textContent = `Setup: fine at any clock slower than ${si(1e12 / Tc, "Hz")}.`;
            v2.className = "verdict " + (hold >= 0 ? "ok" : "no"); v2.textContent = hold >= 0 ? "Hold: met." : "Hold VIOLATED. No clock frequency fixes this. Slow down the short path.";
          }
          const sl = (k, lab, min, max, val, set) => slider({ id: id + k, label: lab, min, max, step: 1, value: val, show: (x) => x + (k.startsWith("-n") ? "" : " ps") }, (x) => { set(x); draw(); }).el;
          host.append(sl("-a", "t_pcq", 20, 150, tpcq, (x) => (tpcq = x)), sl("-b", "t_setup", 0, 100, ts, (x) => (ts = x)), sl("-n1", "Gates on the critical path", 1, 12, ng, (x) => (ng = x)), sl("-c", "Gate t_pd", 10, 80, gpd, (x) => (gpd = x)),
            sl("-d", "t_ccq", 0, 80, tccq, (x) => (tccq = x)), sl("-e", "t_hold", 0, 100, th, (x) => (th = x)), sl("-n2", "Gates on the short path", 0, 5, nsh, (x) => (nsh = x)), sl("-f", "Gate t_cd", 5, 60, gcd, (x) => (gcd = x)), sl("-g", "Clock skew t_skew", 0, 80, skew, (x) => (skew = x)), v1, v2, ro);
          draw();
        },
        `<p class="aside">Try setting the short path to 0 gates (back-to-back flops). Then raise t_hold above t_ccq. Then add skew. Part 10 explains skew.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Flops: t_pcq = 60 ps, t_setup = 30 ps. The critical path has 4 gates of 45 ps each. What's the maximum clock frequency?", a: 3.7037e9, tol: 0.01, unit: "Hz", hint: "T_c = 60 + 4×45 + 30.", why: "T_c = 270 ps, so f = 3.70 GHz." },
        { t: "mcq", q: "A chip comes back from the fab with a hold-time violation. What fixes it?", opts: [["Redesigning to add delay on the short path (e.g. buffers); the clock frequency can't help", true, "The hold constraint doesn't contain T_c at all. That's why hold bugs are so feared."], ["Run the clock slower", false, "Look at the hold equation: T_c isn't in it."], ["Run the clock faster", false, "Same reason."]] },
      ]},
      { k: "why", title: "Why hold time usually isn't a worry", b: [
        `<p>Two flip-flops wired directly (t<sub>cd</sub> = 0) need t<sub>hold</sub> ≤ t<sub>ccq</sub>. So flip-flops are usually designed with t<sub>hold</sub> ≈ 0, and the book mostly ignores hold time after this. But when it bites, it bites hard.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain the setup and hold constraints in your own words.", model: "Setup: after the clock edge, the first register's output takes up to t_pcq to change, the logic takes up to t_pd, and the result must arrive t_setup before the next edge. So the clock period must cover all three. Hold: after an edge, the fastest new data can reach the next register after t_ccq + t_cd; it must not arrive before t_hold has passed, or the register may capture the new data instead of the old." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "Clock skew, metastability, synchronizers", mins: 30,
    blurb: "Clocks don't arrive everywhere at once, and real-world inputs ignore your setup time.",
    takeaway: "Clock skew: the clock reaches different registers at slightly different times (different wire lengths, noise, clock gating). Worst case for setup: launch register late, capture register early: T_c ≥ t_pcq + t_pd + t_setup + t_skew. Worst case for hold: launch early, capture late: t_ccq + t_cd ≥ t_hold + t_skew. Skew adds to both setup and hold times; back-to-back flops fail if t_skew > t_ccq. Metastability: if D changes inside the aperture, Q can sit at an in-between voltage for an unbounded time before resolving (a ball balanced on a hilltop). P(t_res > t) = (T₀/T_c)·e^(−t/τ), for t ≫ t_pcq; T₀/T_c ≈ probability the input changes at a bad time; τ ≈ how fast the flop falls off the hill. Asynchronous inputs (buttons, sensors, other clock domains) must go through a synchronizer: two flip-flops in series, giving the first a whole cycle to resolve. Failure probability per input change: (T₀/T_c)e^(−(T_c − t_setup)/τ); with N changes per second, MTBF = T_c·e^((T_c − t_setup)/τ)/(N·T₀). MTBF grows exponentially with the waiting time.",
    steps: [
      { k: "learn", title: "Clock skew", b: [
        `<p>The clock travels on wires of different lengths, so it reaches different registers at different times: <b>clock skew</b>. Timing analysis assumes the worst case.</p>`,
        `<div class="two"><div class="tile"><h3>Setup worst case</h3><p>Launch late, capture early: less time for the logic.</p><div class="eq">T<sub>c</sub> ≥ t<sub>pcq</sub> + t<sub>pd</sub> + t<sub>setup</sub> + t<sub>skew</sub></div></div><div class="tile"><h3>Hold worst case</h3><p>Launch early, capture late: new data races in.</p><div class="eq">t<sub>ccq</sub> + t<sub>cd</sub> ≥ t<sub>hold</sub> + t<sub>skew</sub></div></div></div>`,
        `<p class="aside">Skew effectively increases both the setup time and the hold time. Try it in Part 9's calculator.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Back-to-back flip-flops have t_ccq = 30 ps and t_hold = 0. How much clock skew can they tolerate?", opts: [["Up to 30 ps", true, "t_ccq + 0 ≥ 0 + t_skew → t_skew ≤ 30 ps."], ["Any amount", false, "Skew adds to the hold requirement."], ["None", false, "t_ccq gives some margin."]] },
      ]},
      { k: "learn", title: "Metastability", b: [
        `<p>A button press arrives whenever it likes. If D changes <b>inside</b> the aperture, the flip-flop can capture a value partway between 0 and 1: a <b>metastable</b> state.</p>`,
        fig(S.svg(420, 140, `<path d="M20 120 Q 110 120 160 70 Q 210 20 260 70 Q 310 120 400 120" style="fill:none;stroke:var(--ink);stroke-width:2.5"/><circle cx="210" cy="33" r="11" style="fill:var(--accent)"/>` + S.t(70, 136, "stable 0", { cls: "s" }) + S.t(350, 136, "stable 1", { cls: "s" }) + S.t(210, 14, "metastable", { cls: "s a" }), { label: "Ball on a hill between two valleys" })),
        `<p>It eventually falls one way or the other, but how long it takes is <b>unbounded</b>: the closer to balanced, the longer. The chance it's still undecided after time t falls exponentially:</p>`,
        `<div class="eq">P(t<sub>res</sub> &gt; t) = (T<sub>0</sub>/T<sub>c</sub>) e<sup>−t/τ</sup></div>`,
      ]},
      { k: "learn", title: "The synchronizer", b: [
        `<p>Every asynchronous input goes through a <b>synchronizer</b>: two flip-flops in a row. The first may go metastable; it then has almost a whole clock cycle to resolve before the second samples it.</p>`,
        `<div class="eq">MTBF = T<sub>c</sub> e<sup>(T<sub>c</sub> − t<sub>setup</sub>)/τ</sup> / (N T<sub>0</sub>)</div>`,
        `<p class="aside">N = input changes per second. MTBF = mean time between failures. What counts as safe depends on the product: a phone you can reboot vs a pacemaker.</p>`,
      ]},
      { k: "play", title: "MTBF vs waiting time", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let tau = 150, T0 = 100, N = 10, Tc = 2.5;
          const ts = 100, YR = 3.156e7;
          const mtbf = (Tcn) => (Tcn * 1e-9 * Math.exp((Tcn * 1e-9 - ts * 1e-12) / (tau * 1e-12))) / (N * T0 * 1e-12);
          function draw() {
            f.innerHTML = plot({ x: [0.5, 5], y: [-6, 19], xt: [1, 2, 3, 4, 5], yt: [-6, -3, 0, 3, 6, 9, 12, 15, 18], ytf: (v) => "10" + String(v).replace("-", "⁻").split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d] || d).join(""), xl: "synchronizer period T_c (ns)", yl: "MTBF (seconds)", padL: 56,
              series: [{ f: (x) => Math.log10(mtbf(x)), cls: "s1" }, { f: () => Math.log10(YR), cls: "s5" }, { f: () => Math.log10(1e10 * YR), cls: "s4" }], marks: [{ x: Tc, y: Math.log10(mtbf(Tc)) }],
              texts: [{ x: 0.6, y: Math.log10(YR) + 0.5, s: "1 year" }], label: "Synchronizer MTBF against clock period, log scale" });
            const m = mtbf(Tc);
            ro.innerHTML = readout([["MTBF at this T_c", m < YR ? si(m, "s") : fmt(m / YR, 3) + " years"]]);
          }
          host.append(f, slider({ id: id + "-t", label: "Synchronizer period T_c", min: 0.5, max: 5, step: 0.05, value: Tc, show: (x) => fmt(x, 3) + " ns" }, (x) => { Tc = x; draw(); }).el,
            slider({ id: id + "-u", label: "τ (resolution time constant)", min: 50, max: 300, step: 5, value: tau, show: (x) => x + " ps" }, (x) => { tau = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">T<sub>0</sub> = 100 ps, t<sub>setup</sub> = 100 ps, N = 10 changes/s. The red dashed line is the age of the universe (~10<sup>10</sup> years). Each extra τ of waiting multiplies the MTBF by e ≈ 2.7.</p>`,
        mathLink("Exponentials and logs, if the curve feels strange:", "08-exp-log.html", "Math 8"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "With τ = 150 ps, by what factor does the MTBF grow when T_c goes from 2 ns to 3 ns? (Use MTBF ∝ T_c·e^(T_c/τ).)", a: 1178, tol: 0.02, hint: "(3/2) × e^(1 ns / 150 ps).", hint2: "1 ns / 150 ps = 6.67; e^6.67 ≈ 786.", why: "1.5 × e^6.67 ≈ 1.5 × 786 ≈ 1180. One extra nanosecond of waiting makes the synchronizer about a thousand times more reliable." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do asynchronous inputs need a synchronizer, and how does it work?", model: "An asynchronous input can change at any time, including during a flip-flop's setup/hold aperture, which can leave the flip-flop metastable for an unpredictable time. A synchronizer is two flip-flops in series: if the first goes metastable, it has nearly a full clock period to resolve before the second samples it. The chance it's still unresolved falls exponentially with that time, so the failure rate becomes tiny." },
      ]},
    ],
  };

  /* =============== PART 11 =============== */
  const BLK = [3, 2, 4, 1];
  const p11 = {
    id: "p11", title: "Parallelism and pipelining", mins: 25,
    blurb: "Latency vs throughput. More hardware, or an assembly line.",
    takeaway: "A token is a group of inputs processed into a group of outputs. Latency: the time for one token to pass through from start to end. Throughput: tokens produced per unit time. Cookie example: 5 min rolling + 15 min baking: latency 1/3 hour, throughput 3 trays/hour. Spatial parallelism: copies of the hardware (two ovens: 6 trays/hour). Temporal parallelism (pipelining): split the task into stages like an assembly line (second tray rolled while the first bakes: 4 trays/hour, limited by the longest stage). Both together: 8 trays/hour. Task with latency L: no parallelism → throughput 1/L; N copies or N equal stages → N/L; with unequal stages the throughput is 1/(longest stage). Pipelining a circuit means adding registers between blocks of logic: each stage's T_c = t_pcq + its logic delay + t_setup, the clock is set by the slowest stage, latency = stages × T_c (it grows a little, from register overhead and imperfect balance), throughput = 1/T_c. Dependencies (a task needing the previous task's result) limit parallelism.",
    steps: [
      { k: "learn", title: "Latency and throughput", b: [
        `<div class="two"><div class="tile"><h3>Latency</h3><p>How long one token takes from start to finish.</p></div><div class="tile"><h3>Throughput</h3><p>How many tokens come out per unit time.</p></div></div>`,
        `<p>Ben bakes cookies: 5 minutes to roll a tray, 15 to bake. Latency: 20 minutes. Throughput: 3 trays per hour.</p>`,
      ]},
      { k: "learn", title: "Two kinds of parallelism", b: [
        `<div class="two"><div class="tile"><h3>Spatial</h3><p>Duplicate the hardware. Alyssa brings her own tray and oven: <b>6 trays/hour</b>. Latency unchanged.</p></div><div class="tile"><h3>Temporal (pipelining)</h3><p>An assembly line. Ben rolls tray 2 while tray 1 bakes: a tray every 15 min, <b>4 trays/hour</b>.</p></div></div>`,
        `<p>Both together: 8 trays/hour. With N equal pipeline stages, throughput rises N times; with unequal stages, the <b>longest</b> stage sets the pace.</p>`,
      ]},
      { k: "play", title: "Pipeline a circuit", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let cut = [0, 0, 0];
          function draw() {
            const stages = []; let cur = 0;
            BLK.forEach((d, i) => { cur += d; if (i === BLK.length - 1 || cut[i]) { stages.push(cur); cur = 0; } });
            const ov = 0.5, Tc = Math.max(...stages) + ov, lat = stages.length * Tc;
            let s = "", x = 20;
            const reg = (x) => `<rect x="${x}" y="40" width="10" height="60" style="fill:var(--accent);stroke:var(--ink)"/>`;
            s += reg(x); x += 18;
            BLK.forEach((d, i) => { const w = Math.max(44, d * 26); s += S.box(x, 45, w, 50, "") + S.t(x + w / 2, 66, "CL" + (i + 1), { cls: "s" }) + S.t(x + w / 2, 84, d + " ns", { cls: "s m" }); x += w + 8; if (cut[i] || i === BLK.length - 1) { s += reg(x); x += 18; } });
            f.innerHTML = S.svg(420, 120, s, { max: 420, label: "Combinational blocks with pipeline registers" });
            ro.innerHTML = readout([["Stages", String(stages.length) + " (" + stages.map((t) => t + " ns").join(", ") + ")"], ["Clock period T_c (slowest stage + 0.5 ns overhead)", fmt(Tc, 3) + " ns"], ["Throughput", si(1e9 / Tc, "Hz")], ["Latency", fmt(lat, 3) + " ns"]]);
          }
          [0, 1, 2].forEach((i) => host.append(toggle([`no register after CL${i + 1}`, `register after CL${i + 1}`], (v) => { cut[i] = v; draw(); }, 0)));
          host.append(f, ro);
          draw();
        },
        `<p class="aside">Orange bars are registers (t<sub>pcq</sub> + t<sub>setup</sub> = 0.5 ns each stage). Find the two-stage split with the best throughput. Does latency go up or down?</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Blocks of 3, 2, 4, 1 ns with a single register after CL2 (and 0.5 ns overhead per stage). What is the throughput?", a: 1.818e8, tol: 0.01, unit: "Hz", hint: "Stages are 3+2 = 5 ns and 4+1 = 5 ns. T_c = 5.5 ns.", why: "1/5.5 ns ≈ 182 MHz, versus 1/10.5 ns ≈ 95 MHz unpipelined. Latency rises from 10.5 to 11 ns." },
        { t: "mcq", q: "Ben wants to taste each tray before starting the next. What does that do?", opts: [["Creates a dependency: the next task can't start until the previous one finishes, so no pipelining or parallelism helps", true, "Dependencies are the bane of parallelism. Chapter 7 deals with them in processors."], ["Nothing, if he has two ovens", false, "He still has to wait for each tray to finish."], ["Doubles throughput", false, "It removes the parallelism."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does pipelining increase throughput, and what does it cost?", model: "It inserts registers to split the logic into stages, so several tokens are in flight at once, one per stage, and the clock only has to cover the slowest stage instead of the whole path. Throughput goes up roughly with the number of stages. The cost is extra registers and their overhead, and latency rises a bit because each stage takes a full clock period plus register delay." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "hh3", eyebrow: "Harris & Harris · Chapter 3", title: "Sequential Logic Design",
    intro: `<p>Eleven parts: bistable elements, the SR latch, D latches and flip-flops, registers and resets, why synchronous design, finite state machines (a traffic light), encodings and Moore vs Mealy, factoring FSMs, setup and hold timing, skew and metastability, and pipelining.</p><p>Parts 9 and 10 are the timing analysis every chip designer does daily. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book, then the interview questions. They test whether the ideas stuck, so don't expect them to look like the questions here.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11],
    summary: `
      <h3>Storage elements</h3>
      <p>Bistable: two stable states, 1 bit. SR latch (NOR): S sets, R resets, 00 holds, 11 not used. D latch: transparent when CLK = 1. D flip-flop: copies D to Q on the rising edge, holds otherwise. Register = N flops, one clock. Enable (mux, not clock gating), reset (sync or async).</p>
      <h3>Synchronous design</h3>
      <p>Every element a register or combinational; same clock everywhere; a register in every loop. Avoids oscillation (ring oscillator T = 2N·t<sub>pd</sub>) and races.</p>
      <h3>FSMs</h3>
      <p>State register + next-state logic + output logic. Moore: outputs from state. Mealy: from state and inputs (one cycle sooner). Steps: I/O → diagram → tables → encoding (binary log<sub>2</sub>K bits, or one-hot K bits) → equations → circuit.</p>
      <h3>Timing</h3>
      <div class="eq">T<sub>c</sub> ≥ t<sub>pcq</sub> + t<sub>pd</sub> + t<sub>setup</sub> + t<sub>skew</sub>      t<sub>ccq</sub> + t<sub>cd</sub> ≥ t<sub>hold</sub> + t<sub>skew</sub></div>
      <p>Hold violations can't be fixed by the clock. Metastability: P(t<sub>res</sub> &gt; t) = (T<sub>0</sub>/T<sub>c</sub>)e<sup>−t/τ</sup>. Two-flop synchronizer; MTBF = T<sub>c</sub>e<sup>(T<sub>c</sub>−t<sub>setup</sub>)/τ</sup>/(N T<sub>0</sub>).</p>
      <h3>Parallelism</h3>
      <p>Latency (one token) vs throughput (tokens/s). Spatial: copies. Temporal: pipeline stages; T<sub>c</sub> set by the slowest stage; latency grows slightly. Dependencies limit both.</p>`,
  };
  Course.start(window.CHAPTER);
})();
