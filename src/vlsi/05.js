(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const seenV = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const sup = (v) => "10" + String(v).replace("-", "⁻").split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d] || d).join("");

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Power, energy, and where half of it goes", mins: 20,
    blurb: "Charging a capacitor costs CV² from the supply. Half is stored, half becomes heat, whatever the transistor.",
    takeaway: "Why power matters: battery life (two AA cells ≈ 7 W·h; Li-ion ≈ 80 W·h/lb), cooling (~150 W per high-performance chip before liquid cooling), and electricity bills (US data centres used 61 billion kWh in 2006). Chips are now power-limited rather than area-limited; optimize power top-down, from the application and architecture first. Definitions: P(t) = I(t)V(t); E = ∫P dt; P_avg = E/T; 1 W = 1 J/s; 1 W·h = 3600 J. Resistor P = V²/R = I²R; source P = I·V_DD; a capacitor charged to V stores ½CV². An inverter charging C_L from 0 to V_DD draws CV_DD² from the supply: ½CV_DD² is stored and ½ is dissipated in the pMOS, independent of transistor size or speed; on the falling edge the stored half is dumped to GND through the nMOS with nothing drawn from the supply. Short-circuit current while both are partly on adds a little (2.7 fJ in the book's 150 fJ example).",
    steps: [
      { k: "learn", title: "Why chips are power-limited", b: [
        `<ul><li><b>Batteries:</b> a pair of rechargeable AA cells holds about 7 W·h.</li><li><b>Cooling:</b> above about 150 W, a chip needs liquid cooling or exotic heat sinks.</li><li><b>Electricity:</b> US data centres used 61 billion kWh in 2006, more than all the country's TVs.</li></ul>`,
        `<p>Chips used to be limited by how many transistors fit. Now they're limited by power, so <b>fast and energy-efficient mean the same thing</b>.</p>`,
        `<div class="key">Optimize power top-down: the biggest savings come from the application and architecture (turn things off!), not from tweaking circuits.</div>`,
      ]},
      { k: "learn", title: "Definitions", b: [
        `<div class="eq">P(t) = I(t)V(t)     E = ∫ P dt     P<sub>avg</sub> = E/T</div>`,
        `<p>1 W = 1 J/s. Batteries use watt-hours: 1 W·h = 3600 J. A capacitor charged to V stores <b>½CV<sup>2</sup></b>.</p>`,
        seen("Energy stored in capacitors and the power of switching logic.", "11-energy-power-digital.html#p1", "Chapter 11"),
      ]},
      { k: "play", title: "Charge a capacitor through any resistor", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let R = 5, C = 150;
          function draw() {
            const tau = R * C * 1e-3, Esup = C * 1, Ec = C / 2;
            f.innerHTML = plot({ x: [0, 5], y: [0, 1.05], xt: [0, 1, 2, 3, 4, 5], yt: [0, 0.5, 1], xl: "time / RC", yl: "fraction of final energy",
              series: [{ f: (t) => 1 - Math.exp(-t), cls: "s2" }, { f: (t) => Math.pow(1 - Math.exp(-t), 2) / 2, cls: "s1" }, { f: (t) => (1 - Math.exp(-t)) - Math.pow(1 - Math.exp(-t), 2) / 2, cls: "s5" }],
              texts: [{ x: 3.6, y: 0.9, s: "from supply" }, { x: 3.6, y: 0.4, s: "stored = heat" }, { x: 0.9, y: 0.5, s: "heat" }, { x: 1.6, y: 0.18, s: "stored" }], label: "Energy drawn and stored while charging a capacitor" });
            ro.innerHTML = readout([["Time constant RC", fmt(tau, 3) + " ps"], ["Energy from supply C·V²", fmt(Esup, 3) + " fJ"], ["Stored on C: ½CV²", fmt(Ec, 3) + " fJ"], ["Burned in the resistor", fmt(Esup - Ec, 3) + " fJ (always half)"]]);
          }
          host.append(f, slider({ id: id + "-r", label: "Resistance R (the pMOS)", min: 0.5, max: 50, log: true, value: R, show: (x) => fmt(x, 3) + " kΩ" }, (x) => { R = x; draw(); }).el,
            slider({ id: id + "-c", label: "Load capacitance C", min: 10, max: 500, step: 5, value: C, show: (x) => x + " fF" }, (x) => { C = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">V<sub>DD</sub> = 1 V. Energies as fractions of CV²: blue drawn from the supply, orange stored on C, dashed burned as heat. Heat runs ahead early (big current through R), but both end at exactly ½. Change R: only the time scale changes.</p>`,
      ]},
      { k: "learn", title: "One full cycle", b: [
        `<div class="two"><div class="tile"><h3>Output rises</h3><p>The supply delivers <b>CV<sub>DD</sub><sup>2</sup></b>. Half is stored on C; half heats the pMOS.</p></div><div class="tile"><h3>Output falls</h3><p>The supply delivers nothing. The stored ½CV<sub>DD</sub><sup>2</sup> heats the nMOS.</p></div></div>`,
        `<p>So each 0→1→0 cycle costs CV<sub>DD</sub><sup>2</sup>, no matter how big or fast the transistors are. A tiny blip of <b>short-circuit current</b> flows while both are partly on.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A gate charges 80 fF to 0.9 V. How much energy does the supply deliver?", a: 64.8, tol: 0.01, unit: "fJ", why: "CV² = 80 fF × 0.81 = 64.8 fJ; half of it, 32.4 fJ, ends up stored." },
        { t: "mcq", q: "You double the width of the pMOS that charges a fixed load. The energy lost in it per charge…", opts: [["Stays the same: ½CV², set only by C and V", true, "It charges faster but dissipates the same energy."], ["Halves", false, "Lower R means more current for less time: same energy."], ["Doubles", false, "Size doesn't enter."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does charging a capacitor from a fixed supply always waste half the energy?", model: "The supply pushes charge CV through at a constant voltage V, so it delivers CV². But the capacitor's voltage rises from 0 to V as it charges, so on average the charge is stored at only V/2, giving ½CV². The difference, also ½CV², is dropped across whatever resistance is in the way and becomes heat, regardless of its value." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Dynamic and static power", mins: 25,
    blurb: "P = αCV²f. Activity factors. Where the power goes in a real chip.",
    takeaway: "Switching at frequency f_sw: P_switching = C V_DD² f_sw. Write f_sw = α f with activity factor α = probability a node rises 0→1 in a cycle: clock 1; data ≤ 0.5; random data 0.25; typical static logic ~0.1. So P_switching = α C V_DD² f. Dynamic power = switching + short-circuit (usually < 10%: add 10% conservatively). Static power = (I_sub + I_gate + I_junct + I_contention)·V_DD. Modes: active (dominated by switching), standby (idle, clocks stopped: leakage), sleep (supplies off; costs time and energy to wake). Roughly a third of microprocessor power is clock, a third memory, a third logic and wires; in nanometer processes nearly a third is leakage (Sun's Niagara2: cores 32%, leakage 21%, I/O 13%...). Estimate switching power per node: capacitance (gate + diffusion + wire) × activity = effective capacitance; sum and multiply by V²f. Adiabatic and resonant schemes try to recycle the charge but rarely pay off.",
    steps: [
      { k: "learn", title: "The dynamic power equation", b: [
        `<div class="eq">P<sub>switching</sub> = α C V<sub>DD</sub><sup>2</sup> f</div>`,
        `<p>The <b>activity factor α</b> is the probability a node rises 0→1 in a given cycle (that's when it draws CV<sup>2</sup>).</p>`,
        `<div class="tbl"><table><tbody><tr><td>Clock</td><td>α = 1</td></tr><tr><td>Data that toggles every cycle</td><td>0.5 (max for data)</td></tr><tr><td>Random data</td><td>0.25</td></tr><tr><td>Typical static logic</td><td>~0.1</td></tr></tbody></table></div>`,
      ]},
      { k: "learn", title: "Everything that burns power", b: [
        `<div class="two"><div class="tile"><h3>Dynamic</h3><p>Charging load capacitance (switching). Short-circuit current while both networks are half-on.</p></div><div class="tile"><h3>Static</h3><p>Subthreshold, gate and junction leakage. Contention current in ratioed circuits.</p></div></div>`,
        `<div class="eq">P<sub>total</sub> = α C V<sub>DD</sub><sup>2</sup> f + P<sub>short-circuit</sub> + (I<sub>sub</sub> + I<sub>gate</sub> + I<sub>junct</sub> + I<sub>contention</sub>) V<sub>DD</sub></div>`,
        `<p>A rough split for processors: ⅓ clock, ⅓ memory, ⅓ logic and wires; and in nanometer processes, leakage is up to a third of the total.</p>`,
      ]},
      { k: "play", title: "Estimate a chip", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let nl = 200, al = 0.1, V = 0.9, f = 1.5;
          const nm = 800;
          function draw() {
            const lam = 0.02, c = 1.5e-15, Cl = nl * 1e6 * 10 * lam * c, Cm = nm * 1e6 * 4 * lam * c, P = (al * Cl + 0.02 * Cm) * V * V * f * 1e9;
            ro.innerHTML = readout([["Logic capacitance", fmt(Cl * 1e9, 3) + " nF"], ["Memory capacitance", fmt(Cm * 1e9, 3) + " nF"], ["Logic switching power", fmt(al * Cl * V * V * f * 1e9, 3) + " W"], ["Memory switching power", fmt(0.02 * Cm * V * V * f * 1e9, 3) + " W"], ["Total (+10% short-circuit)", fmt(P * 1.1, 3) + " W"]]);
          }
          host.append(slider({ id: id + "-n", label: "Logic transistors", min: 20, max: 1000, log: true, value: nl, show: (x) => fmt(x, 3) + " million" }, (x) => { nl = x; draw(); }).el,
            slider({ id: id + "-a", label: "Logic activity factor α", min: 0.01, max: 0.5, step: 0.01, value: al, show: (x) => fmt(x, 2) }, (x) => { al = x; draw(); }).el,
            slider({ id: id + "-v", label: "Supply V_DD", min: 0.6, max: 1.2, step: 0.01, value: V, show: (x) => fmt(x, 2) + " V" }, (x) => { V = x; draw(); }).el,
            slider({ id: id + "-f", label: "Clock f", min: 0.2, max: 4, step: 0.1, value: f, show: (x) => fmt(x, 2) + " GHz" }, (x) => { f = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">An imaginary SoC: logic transistors average 10λ wide, 800 million memory transistors 4λ wide with α = 0.02 (only one bank active), λ = 20 nm, 1.5 fF/µm of gate + diffusion. Wires ignored (they can be a lot). Try 1.2 V vs 0.9 V.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A block has 2 nF of switched capacitance, α = 0.15, V_DD = 0.8 V, f = 2 GHz. Switching power?", a: 0.384, tol: 0.01, unit: "W", why: "0.15 × 2 nF × 0.64 × 2 GHz = 0.384 W." },
        { t: "mcq", q: "A clock node and a random-data node have the same capacitance. Which dissipates more switching power?", opts: [["The clock: α = 1 vs 0.25, so 4×", true, "Clocks are the hungriest nets on a chip."], ["The data node", false, "Data switches at most every other cycle."], ["Equal", false, "Activity factors differ."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is the activity factor, and why is it only counted on rising transitions?", model: "It's the probability that a node goes from 0 to 1 in a given clock cycle. Energy is drawn from the supply only when the node is charged up, CV² each time; the falling transition just dumps the stored charge to ground without taking anything from the supply. So power is α times C V² times the clock frequency." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  function andNet(pa, chain) {
    const a = (p) => p * (1 - p);
    if (!chain) { const n1 = pa * pa, n2 = pa * pa, y = n1 * n2; return [["n1 = A·B", n1, a(n1)], ["n2 = C·D", n2, a(n2)], ["Y = n1·n2", y, a(y)]]; }
    const n1 = pa * pa, n2 = n1 * pa, y = n2 * pa; return [["n1 = A·B", n1, a(n1)], ["n2 = n1·C", n2, a(n2)], ["Y = n2·D", y, a(y)]];
  }
  const p3 = {
    id: "p3", title: "Activity: clock gating, probabilities, glitches", mins: 25,
    blurb: "Turn off what isn't working. Estimate how often nodes switch. Watch out for glitches.",
    takeaway: "The activity factor is the easiest lever: a block that's off has α = 0. Clock gating ANDs the clock with an enable to stop idle blocks: it saves the clock's α = 1 capacitance and stops all downstream register and logic activity; the enable must be stable while the clock is high (use an enable latch); gating early in the clock tree saves part of the global network too; enable logic is often critical. Switching probability: with P_i = probability node i is 1 and uncorrelated cycles, α_i = P̄_i·P_i = P_i(1 − P_i); random data P = 0.5 gives 0.25; structured data (upper bits of quantities) switch less. For uncorrelated inputs an AND2 gives P_Y = P_A·P_B (NAND: 1 − P_A·P_B). In the book's 4-input AND example a chain has lower intermediate activity than a tree. Reconvergent fanout makes signals correlated: use tools. Default guess before RTL: α = 0.1. Glitches: unequal input arrival causes spurious transitions; chains are prone; activity can exceed 1; glitching can dominate ripple-carry adders and array multipliers; assess with timing-aware simulation.",
    steps: [
      { k: "learn", title: "Clock gating", b: [
        `<p>The cheapest power is the power of a block that isn't running. <b>Clock gating</b> ANDs the clock with an enable:</p>`,
        `<ul><li>The gated registers stop toggling, so all the logic after them goes quiet too.</li><li>The clock net itself (α = 1, huge capacitance) stops. Gate high up the clock tree and you save part of the tree as well.</li><li>The enable must not change while the clock is high, or you'd chop a clock pulse: an <b>enable latch</b> holds it.</li></ul>`,
        `<p class="aside">A floating-point unit can be gated whenever no FP instructions are issuing. But enable logic is often on critical paths.</p>`,
      ]},
      { k: "learn", title: "Switching probability", b: [
        `<p>If P is the probability a node is 1, and cycles are independent, it rises (0 then 1) with probability</p>`,
        `<div class="eq">α = (1 − P) · P</div>`,
        `<p>Random data: P = 0.5, α = 0.25. The high bits of a bank balance or a sound sample are almost always 0, so they rarely switch. An AND2 with independent inputs: P<sub>Y</sub> = P<sub>A</sub>P<sub>B</sub>.</p>`,
        `<p class="aside">Reconvergent fanout (one signal reaching a gate by two routes) makes inputs correlated, and the simple formulas fail. Power tools handle it. With no data at all, guess α = 0.1.</p>`,
        `<p class="aside">Probability basics are in <a href="../math/34-probability.html">Math 34 →</a></p>`,
      ]},
      { k: "play", title: "Tree or chain?", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let pa = 0.5, chain = 0;
          function draw() { ro.innerHTML = readout(andNet(pa, chain).map(([n, p, a]) => [n, `P = ${fmt(p, 3)}, α = ${fmt(a, 3)}`]).concat([["Sum of α (relative power)", fmt(andNet(pa, chain).reduce((s, r) => s + r[2], 0), 3)]])); }
          host.append(toggle(["Tree: (AB)(CD)", "Chain: ((AB)C)D"], (i) => { chain = i; draw(); }),
            slider({ id: id + "-p", label: "Probability each input is 1", min: 0.05, max: 0.95, step: 0.01, value: pa, show: (x) => fmt(x, 2) }, (x) => { pa = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">A 4-input AND built from AND2 gates (a NAND–INV pair each). Same function, different internal activity: the chain's intermediate nodes are 1 less often. (Zero-delay estimate: glitches not included.)</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A node is 1 with probability 0.2, independently each cycle. Its activity factor?", a: 0.16, tol: 0.01, why: "0.8 × 0.2 = 0.16." },
        { t: "num", q: "An AND2's inputs are independently 1 with probability 0.6 and 0.5. Activity factor of its output?", a: 0.21, tol: 0.01, hint: "P_Y = 0.3.", why: "P = 0.3; α = 0.7 × 0.3 = 0.21." },
      ]},
      { k: "learn", title: "Glitches", b: [
        `<p>Probabilities assume zero delay. Real inputs arrive at different times, so outputs can flip and flip back: <b>glitches</b>. Each one costs real CV<sup>2</sup>.</p>`,
        `<ul><li>Long chains are worst: each stage can glitch on a late input.</li><li>Activity can exceed 1.</li><li>In ripple-carry adders and array multipliers, glitching can be <b>most</b> of the power.</li></ul>`,
        `<p>Only timing-aware simulation catches them. Balanced path delays reduce them.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does clock gating save so much more than just the clock's own power?", model: "When the clock to a block's registers stops, the registers stop changing, so none of the combinational logic after them sees new inputs and it stops switching too. On top of that the clock net itself, which switches every cycle and has a big capacitance, goes quiet, and gating early in the tree also silences part of the distribution network." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Capacitance: smaller gates, slightly slower", mins: 20,
    blurb: "A little delay buys a lot of energy. Size for energy under a delay constraint.",
    takeaway: "Wire capacitance: good floorplanning puts units that talk a lot close together. Device capacitance: fewer stages and smaller transistors; minimum-size gates off the critical path. Logical effort's best stage effort ~4 is for minimum delay; a larger effort costs little delay but shrinks gates a lot: e.g. buffers to pads or long wires at stage effort 8–12; small clocked transistors in registers (α ~10× logic); drive long wires with inverters or buffers (low g). Book example: a 64-bit Kogge-Stone adder re-sized for 10% more delay used 55% less energy. Energy model: a gate with logical effort g, parasitic p and drive x has gx gate and px diffusion capacitance; E = Σ α_i(c_i + p_i x_i + Σ_fanout g_j x_j) (in units of 3CV_DD²); minimize subject to arrival time ≤ D: a posynomial, one optimum. The energy-delay curve is steep near D_min, so slightly relaxed designs are much more efficient; delay can't go below D_min without upsizing the input (slowing the previous block).",
    steps: [
      { k: "learn", title: "Two kinds of capacitance", b: [
        `<ul><li><b>Wires:</b> floorplan so blocks that exchange lots of data sit next to each other.</li><li><b>Transistors:</b> fewer stages, smaller gates. Minimum-size gates on paths that aren't critical.</li></ul>`,
        `<p>Logical effort's stage effort of ~4 minimizes delay. But the delay curve is flat there, while gate sizes shrink fast as effort grows. So:</p>`,
        `<ul><li>Pad and long-wire buffers: stage effort 8–12.</li><li>Registers: keep clocked transistors small (they switch every cycle).</li><li>Long wires: drive them with inverters or buffers, not complex gates.</li></ul>`,
        seenV("Stage effort and the number of stages.", "04-delay.html#p9", "Chapter 4, Part 9"),
      ]},
      { k: "play", title: "Trade delay for energy", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let x = 4;
          const H = 256;
          const pt = (x) => { const f4 = H / (x * x * x), D = 3 * x + f4 + 4, E = 1 + x + x * x + x * x * x; return [D, E]; };
          function draw() {
            const curve = []; for (let v = 1.6; v <= 4.0001; v += 0.05) curve.push(pt(v));
            const [D, E] = pt(x), [D0, E0] = pt(4);
            f.innerHTML = plot({ x: [19, 70], y: [0, 90], xt: [20, 30, 40, 50, 60, 70], yt: [0, 30, 60, 90], xl: "path delay D (τ)", yl: "energy (sum of gate sizes)", series: [{ pts: curve, cls: "s1" }], marks: [{ x: D, y: E, label: `D = ${fmt(D, 3)}`, dx: 12, dy: E > 60 ? 22 : -12 }], label: "Energy against delay for a buffer chain" });
            ro.innerHTML = readout([["Stage efforts", `${fmt(x, 3)}, ${fmt(x, 3)}, ${fmt(x, 3)}, ${fmt(H / (x * x * x), 3)}`], ["Delay vs minimum", "+" + fmt(((D - D0) / D0) * 100, 3) + "%"], ["Energy vs minimum-delay sizing", "−" + fmt((1 - E / E0) * 100, 3) + "%"]]);
          }
          host.append(f, slider({ id: id + "-x", label: "Effort of the first three stages", min: 1.6, max: 4, step: 0.05, value: x, show: (v) => fmt(v, 3) }, (v) => { x = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Four inverters driving H = 256. Equal efforts of 4 give the minimum delay, 20τ. Shrink the first three stages: the last one bears more effort, but the gates (and their switched capacitance) get much smaller. Notice how steep the curve is near the minimum delay.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Where is it cheapest to give up delay for energy?", opts: [["Right near minimum delay, where the energy-delay curve is steep", true, "A few percent of delay can save tens of percent of energy (55% for 10% in the book's adder)."], ["Far from minimum delay", false, "There the curve is flat: little energy left to save."], ["Nowhere: energy and delay always trade one-for-one", false, "The curve is strongly nonlinear."]] },
      ]},
      { k: "learn", title: "Sizing for energy by computer", b: [
        `<p>A gate with logical effort g, parasitic p and drive x has gx units of input capacitance and px of diffusion. Total switching energy (in units of 3CV<sub>DD</sub><sup>2</sup>):</p>`,
        `<div class="eq">E = Σ<sub>nodes</sub> α<sub>i</sub> (wire c<sub>i</sub> + p<sub>i</sub>x<sub>i</sub> + Σ<sub>fanout</sub> g<sub>j</sub>x<sub>j</sub>)</div>`,
        `<p>Minimize E with every arrival time ≤ D. Like Chapter 4's sizing problem, it's a posynomial: one optimum, found fast. Sweep D to trace the energy-delay curve.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do energy-efficient designs avoid operating exactly at minimum delay?", model: "Near minimum delay, the last bit of speed requires big gates whose capacitance costs a lot of switching energy, so the energy-delay curve is very steep there. Relaxing the delay target slightly lets the sizes shrink a lot, cutting energy dramatically for a small delay penalty." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Voltage, frequency, short circuits", mins: 30,
    blurb: "V² is the big lever. Voltage domains, level converters, dynamic voltage scaling.",
    takeaway: "V_DD enters squared: pick the lowest V_DD that meets frequency (velocity saturation means less speed lost than long-channel models predict). Voltage domains: e.g. memories high (cell stability), processor medium, slow I/O low. A V_DDH gate can drive a V_DDL gate (but beware faster contamination delays and hold times); a V_DDL gate can't drive a V_DDH gate (its pMOS sees V_DDH − V_DDL: contention or leakage), so use a level converter (cross-coupled pMOS pull-ups; ~2 FO4 delay and power), ideally inside registers at clock boundaries. Clustered voltage scaling: V_DDL gates only late in a path, level converters at registers. Dynamic voltage (and frequency) scaling: choose the lowest frequency that finishes the work, then the lowest V_DD for that frequency (table, fuse-tuned per chip, or replica ring oscillator); with V ∝ f, energy for the work in a given time ∝ rate³ (half rate → ⅛ energy) vs ∝ rate at fixed supply; dithering between a few discrete levels recovers most of the benefit (two levels give > 80%); use switching regulators. Frequency: P ∝ f; multiple frequency domains. Short-circuit power grows with slow input edges, shrinks with large loads; < 10% with balanced edges; ~2% at V_t/V_DD = 0.3, ~10% at 0.2, zero above 0.5. Resonant clocks (an inductor with the clock capacitance; f = 1/(2π√(LC))) recycle energy: IBM Cell saved ~10% at 4–5 GHz; narrow frequency range, sinusoidal clock.",
    steps: [
      { k: "learn", title: "Voltage domains", b: [
        `<p>Since P ∝ V<sub>DD</sub><sup>2</sup>, give each part of the chip only the voltage it needs: memories higher (for stable cells), logic medium, slow I/O lower.</p>`,
        `<ul><li><b>High → low</b>: fine (but the low-voltage gate now switches faster than expected: check hold times).</li><li><b>Low → high</b>: broken. The receiving pMOS sees V<sub>DDH</sub> − V<sub>DDL</sub> on its gate and leaks or fights. Use a <b>level converter</b>: two cross-coupled pMOS pull-ups that restore a full swing. Costs about 2 FO4.</li></ul>`,
        `<p class="aside"><b>Clustered voltage scaling</b> puts low-voltage gates only at the ends of paths within a block, so converters are needed only at the registers.</p>`,
      ]},
      { k: "learn", title: "Dynamic voltage scaling", b: [
        `<p>Most systems don't need full speed all the time. <b>DVS</b> (DVFS): pick the lowest frequency that finishes the work on time, then the lowest V<sub>DD</sub> that supports it.</p>`,
        `<p>If V scales with f, the energy to do a workload in a fixed time scales with <b>rate³</b>: half speed, one-eighth the energy. Without DVS it only scales with rate.</p>`,
        `<p class="aside">Use a <b>switching</b> regulator to make the lower voltage, or the regulator just burns the power instead.</p>`,
      ]},
      { k: "play", title: "DVS with a few voltage levels", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let r = 0.7;
          const dith = (x) => (x <= 0.5 ? x * 0.25 : ((x - 0.5) / 0.5) * 1 + (1 - (x - 0.5) / 0.5) * 0.125);
          function draw() {
            f.innerHTML = plot({ x: [0, 1], y: [0, 1], xt: [0, 0.25, 0.5, 0.75, 1], yt: [0, 0.25, 0.5, 0.75, 1], xl: "required rate", yl: "normalized energy",
              series: [{ f: (x) => x, cls: "s5" }, { f: dith, cls: "s2" }, { f: (x) => x * x * x, cls: "s1" }], marks: [{ x: r, y: dith(r), cls: "mk" }], label: "Energy against required rate" });
            const t1 = Math.max(0, (r - 0.5) / 0.5);
            ro.innerHTML = readout([["Fixed supply", fmt(r, 3)], ["Ideal DVS (rate³)", fmt(r * r * r, 3)], ["Two levels (full and half speed)", fmt(dith(r), 3) + (r > 0.5 ? ` (${fmt(t1 * 100, 3)}% of the time at full speed)` : "")]]);
          }
          host.append(f, slider({ id: id + "-r", label: "Required rate (fraction of max performance)", min: 0.05, max: 1, step: 0.01, value: r, show: (x) => fmt(x, 2) }, (x) => { r = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Dashed: fixed V<sub>DD</sub>. Blue: two levels. Orange: ideal DVS. Below half rate: run at the half-speed level, then stop the clock. Above it: split time between the two levels. Two well-chosen levels capture over 80% of ideal DVS's savings.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "With ideal DVS (V ∝ f), a task needs 60% of full rate. Energy relative to running it at full voltage and speed?", a: 0.216, tol: 0.01, why: "0.6³ = 0.216." },
        { t: "mcq", q: "Why can a low-voltage gate not directly drive a high-voltage gate?", opts: [["Its 'high' leaves the receiver's pMOS partly on (V_gs = V_DDH − V_DDL): leakage or contention", true, "That's what level converters fix."], ["The signal would be too fast", false, "That's a hold-time concern in the other direction."], ["It would short the supplies together through wires", false, "The problem is in the receiving gate."]] },
      ]},
      { k: "learn", title: "Short-circuit current and resonance", b: [
        `<p><b>Short-circuit current</b> flows while both networks are partly on. It grows with slow input edges and falls with heavy loads. With balanced edges it's under 10%: about 2% at V<sub>t</sub>/V<sub>DD</sub> = 0.3, 10% at 0.2, and zero once V<sub>t</sub> &gt; V<sub>DD</sub>/2 (they can't both be on). Keep the previous stage's effort ≤ 4 so edges stay crisp.</p>`,
        `<p><b>Resonant clocks</b> add an inductor so the clock's energy sloshes between L and C instead of being dumped: f = 1/(2π√(LC)). IBM's Cell saved ~10% of chip power at 4–5 GHz. Catch: one frequency, sine-wave clock, and on-chip inductors are poor.</p>`,
        seen("LC resonance.", "14-resonance.html#p1", "Chapter 14"),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does lowering both voltage and frequency together save so much more than lowering frequency alone?", model: "Lowering frequency alone just stretches the same work over more time: the energy per operation, CV², is unchanged. Lowering the voltage too cuts the energy per operation quadratically, and the lower frequency is what makes the lower voltage possible. Together, power falls roughly with the cube of the rate, and energy for the work with its square." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  function stackLeak(eta, kg, S) { const Vx = (eta * 1) / (1 + 2 * eta + kg), ratio = Math.pow(10, (-eta * 1 * (1 + eta + kg)) / (S * (1 + 2 * eta + kg))); return { Vx, ratio }; }
  const p6 = {
    id: "p6", title: "Static power and the stack effect", mins: 25,
    blurb: "Leakage per micron, temperature, two OFF transistors in series, and estimating a chip.",
    takeaway: "Subthreshold leakage (V_ds above ~50 mV): I_sub = I_off·10^((V_gs + η(V_ds − V_DD) − k_γV_sb)/S); I_off ≈ 100 nA/µm (low-V_t) down to < 1 nA/µm (high-V_t); S ≈ 100 mV/decade; DIBL η ≈ 0.1 (rising with scaling). I_off rises 10–100× from 25 °C to 125 °C (V_t falls, S ∝ T): keep chips cool. Stack effect: two series OFF transistors: the middle node V_x rises until the currents match; the bottom transistor sees less DIBL, the top one a negative V_gs and body effect: V_x = ηV_DD/(1 + 2η + k_γ), leakage reduced by ~10^(−ηV_DD(1 + η + k_γ)/(S(1 + 2η + k_γ))), about 10× for typical numbers; three stacked even less. Raising V_t via halo doping or reverse body bias increases BTBT; negative gate drive increases GIDL. SOI: steeper slope. Gate leakage (nA/µm or A/mm²), very strong in thickness; pMOS ~10× less in SiO₂; depends on bias: an ON transistor with its source at a rail leaks fully, one with V_gs ≈ V_t barely; put OFF transistors near the rail. Leakage is input-pattern dependent (book's NAND3: 0.4 to 47 nA). Junction leakage (BTBT, GIDL) usually minor. Contention current in pseudo-nMOS, current-mode logic, analog: turn off in sleep. Static estimate: leaking width × leakage per width × fraction in the leaky state (~½), times V_DD.",
    steps: [
      { k: "learn", title: "Subthreshold leakage, again", b: [
        `<div class="eq">I<sub>sub</sub> = I<sub>off</sub> · 10<sup>(V<sub>gs</sub> + η(V<sub>ds</sub> − V<sub>DD</sub>) − k<sub>γ</sub>V<sub>sb</sub>) / S</sup></div>`,
        `<ul><li><b>I<sub>off</sub></b>: leakage at V<sub>gs</sub> = 0, V<sub>ds</sub> = V<sub>DD</sub>. About 100 nA/µm for low-V<sub>t</sub> devices, below 1 nA/µm for high-V<sub>t</sub>.</li><li><b>S</b> ≈ 100 mV/decade. <b>η</b> (DIBL) ≈ 0.1. <b>k<sub>γ</sub></b>: body effect.</li><li>Specified at 25 °C; 10–100× worse at 125 °C.</li></ul>`,
        seenV("Subthreshold slope and DIBL.", "02-mos-transistor.html#p6", "Chapter 2, Part 6"),
      ]},
      { k: "play", title: "The stack effect", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let eta = 0.1, kg = 0.1, S = 0.1;
          function draw() { const r = stackLeak(eta, kg, S); ro.innerHTML = readout([["Middle node V_x settles at", fmt(r.Vx * 1000, 3) + " mV"], ["Stack leakage ÷ single OFF transistor", fmt(r.ratio, 3)], ["Reduction", fmt(1 / r.ratio, 3) + "×"]]); }
          host.append(slider({ id: id + "-e", label: "DIBL coefficient η", min: 0.05, max: 0.2, step: 0.005, value: eta, show: (x) => fmt(x, 3) }, (x) => { eta = x; draw(); }).el,
            slider({ id: id + "-k", label: "Body effect k_γ", min: 0, max: 0.3, step: 0.01, value: kg, show: (x) => fmt(x, 2) }, (x) => { kg = x; draw(); }).el,
            slider({ id: id + "-s", label: "Subthreshold slope S", min: 0.07, max: 0.12, step: 0.001, value: S, show: (x) => fmt(x * 1000, 3) + " mV/dec" }, (x) => { S = x; draw(); }).el, ro);
          draw();
        },
        `<p>Two OFF nMOS in series (V<sub>DD</sub> = 1 V). The middle node floats up to a few tens of mV. The bottom transistor now has small V<sub>ds</sub> (little DIBL); the top one has negative V<sub>gs</sub> and a raised source. Both leak far less.</p>`,
        `<p class="aside">This uses the book's model, valid when V<sub>x</sub> is above a few v<sub>T</sub>. Stronger DIBL means a bigger benefit.</p>`,
      ]},
      { k: "learn", title: "Gate leakage and input patterns", b: [
        `<p>Gate leakage flows through the oxide of an <b>ON</b> transistor with a large V<sub>gs</sub>. In a stack, an ON transistor whose source sits near a threshold above ground barely leaks. So put the transistor that's usually OFF next to the rail.</p>`,
        `<p>Leakage depends strongly on the inputs: in the book's NAND3 data it ranges from 0.4 nA (all inputs 0, triple stack) to 47 nA (all inputs 1: three pMOS leaking plus full gate leakage). pMOS gate leakage in SiO<sub>2</sub> is ~10× smaller than nMOS.</p>`,
        `<p class="aside">Junction leakage (BTBT, GIDL) is usually minor. <b>Contention</b> current in pseudo-nMOS, current-mode logic and analog blocks is not leakage, but it's static too: switch those off in sleep.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A block has 20 mm of low-V_t transistor width leaking 50 nA/µm when OFF, half of it OFF at any time, V_DD = 0.9 V. Subthreshold static power?", a: 0.45, tol: 0.01, unit: "mW", hint: "20 mm = 20,000 µm; half of it is OFF.", why: "10,000 µm × 50 nA/µm = 0.5 mA; × 0.9 V = 0.45 mW." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do two OFF transistors in series leak much less than one?", model: "The node between them floats up slightly until both carry the same current. That small voltage gives the upper transistor a negative gate-to-source voltage and some body effect, and leaves the lower transistor with only a small drain voltage, so it loses most of its DIBL. Both effects push their thresholds up exponentially in the leakage equation, so the stack leaks perhaps ten times less." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Cutting leakage: gating, thresholds, body bias", mins: 25,
    blurb: "Switch off the supply. Use high-V_t where you can. Bias the body. Park the inputs.",
    takeaway: "Power gating: a header (pMOS) or footer (nMOS) switch disconnects a sleeping block from the supply; the block runs from a virtual rail V_DDV; output isolation gates hold outputs at valid levels; state must be saved (retention registers on a second supply, or copied to memory) or reset; entering and leaving sleep costs time and energy, so only worth it for long idle periods; inrush current must be ramped (IR and L di/dt noise, electromigration). Alternatively drop V_DD to ~300 mV to retain state. Once called MTCMOS (low-V_t logic, high-V_t switches). External gating via the regulator removes leakage completely but is slow (100s of nF of decoupling). nMOS footers are smaller, but pMOS headers keep GND constant (simpler for tools and multiple supplies). Size the switch (coarse-grained, shared by a block) for 5–10% delay: droop ≈ delay increase, R_switch = droop/I_avg, W = (R·µm)/R_switch; e.g. 45 nm Core processors use 1.5 m of pMOS switch per core. Choose L and W to maximize I_on/I_off; body-bias or overdrive the switch. Multiple V_t: start high-V_t everywhere, add low-V_t only on critical paths; or longer channels (Intel 65 nm: +10% length → −10% I_on, I_off ÷ 3). Thick oxides for I/O. Variable V_t (body bias): reverse body bias in sleep (too much, < −1.2 V, raises BTBT), forward body bias in active mode (> 0.4 V turns on diodes); needs extra well/substrate rails (charge pumps), separate p-wells need triple well; weaker below 90 nm as γ falls with t_ox. Input vector control: park inputs on the least leaky pattern (25–50% savings).",
    steps: [
      { k: "learn", title: "Power gating", b: [
        `<p>Put a big <b>header switch</b> (pMOS) between V<sub>DD</sub> and the block. The block runs from a <b>virtual V<sub>DD</sub></b>. Sleep: switch off, and the virtual rail sags towards 0.</p>`,
        `<ul><li><b>Isolation gates</b> force the block's outputs to valid levels while it's off.</li><li><b>State</b> is lost: save it (retention registers, or copy to memory) or reset on wake-up.</li><li><b>Wake-up costs</b> time and energy, so only gate blocks that will sleep long enough. Turn the switch on gradually to avoid a current surge.</li></ul>`,
        `<p class="aside">pMOS headers are usual even though nMOS footers would be smaller: keeping GND constant everywhere keeps designers and tools sane.</p>`,
      ]},
      { k: "play", title: "Size a header switch", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let P = 0.5, droop = 4;
          const Ron = 2000;
          function draw() { const I = P / 1.0, R = (droop / 100) / I, W = Ron / R; ro.innerHTML = readout([["Average current", fmt(I, 3) + " A"], ["Allowed switch resistance", fmt(R * 1000, 3) + " mΩ"], ["pMOS width at 2 kΩ·µm", fmt(W / 1000, 3) + " mm"]]); }
          host.append(slider({ id: id + "-p", label: "Block's average power at 1 V", min: 0.05, max: 5, log: true, value: P, show: (x) => fmt(x, 3) + " W" }, (x) => { P = x; draw(); }).el,
            slider({ id: id + "-d", label: "Allowed droop (≈ delay increase)", min: 1, max: 10, step: 0.5, value: droop, show: (x) => fmt(x, 2) + "%" }, (x) => { droop = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The average-current method: droop = I × R<sub>switch</sub>, and resistance scales as 1/width. It's conservative: at small V<sub>ds</sub> the switch's resistance is lower than its switching R, and simulation typically allows about half this width. Intel's 45 nm Core processors used 1.5 metres of switch transistor per core.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A block draws 0.8 A at 1 V. You allow 2% droop. pMOS on-resistance is 2 kΩ·µm. Header width?", a: 80, tol: 0.01, unit: "mm", hint: "R = 0.02 V / 0.8 A = 25 mΩ.", why: "2000 Ω·µm / 0.025 Ω = 80,000 µm = 80 mm." },
      ]},
      { k: "learn", title: "Thresholds: fixed and variable", b: [
        `<p><b>Multiple V<sub>t</sub>:</b> start with high-V<sub>t</sub> everywhere and swap in low-V<sub>t</sub> cells only where timing fails. Cells come in identical layouts differing only in V<sub>t</sub>. Or draw channels slightly longer: on Intel's 65 nm, +10% length cost 10% I<sub>on</sub> but cut I<sub>off</sub> 3×.</p>`,
        `<p><b>Body bias</b> (variable V<sub>t</sub>):</p>`,
        `<div class="two"><div class="tile"><h3>Reverse (sleep)</h3><p>Raise V<sub>t</sub> to cut leakage, e.g. substrate at −0.4 V, n-well at 1.4 V. Too much (beyond −1.2 V) increases BTBT.</p></div><div class="tile"><h3>Forward (active)</h3><p>Lower V<sub>t</sub> for speed. Beyond ~0.4 V the body diodes start conducting.</p></div></div>`,
        `<p class="aside">Body bias needs extra rails (cheap charge pumps: the well carries little current). It weakens below 90 nm because thinner oxide reduces γ. <b>Input vector control</b>: park inputs on the least leaky pattern before sleeping: 25–50% savings.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What are the costs of power gating a block?", model: "The header switch adds resistance, so the block runs a little slower (designed for maybe 5–10%) and the switch takes area. The block's state is lost unless saved, the outputs need isolation, and going to sleep and waking up take time and energy, including a current surge to recharge the virtual rail. So it only pays off if the block stays asleep long enough." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "The best V_DD and V_t", mins: 25,
    blurb: "Minimum energy lives below threshold. Minimum energy-delay product near V_DD ≈ 2V_t.",
    takeaway: "Minimum power alone is meaningless (do nothing slowly). Better metrics: minimum energy, minimum energy-delay product (EDP), minimum energy under a delay constraint. Power-delay product = energy. Minimum energy point: subthreshold (V_DD < V_t): ~10× less energy than normal operation but ≥ 1000× slower. Theoretical floor: kT ln 2 per operation; an ideal inverter needs V_min = 2 ln 2·v_T ≈ 36 mV for gain > 1. Real minimum balances switching energy C_eff V_DD² (falling quadratically) against leakage energy (I_sub V_DD × delay, rising exponentially as delay grows): E_total = V_DD²(C_eff + W_eff N k C_g 10^(−V_DD/S)); use minimum-width transistors; lower activity factor (relatively more leakage) pushes the optimum to higher V_DD and V_t; heat and variation push it up too. Book's 180 nm ring oscillator: optimum V_DD = 0.13 V, V_t = 0.37 V. EDP (ignoring leakage) ∝ C²V_DD³/(V_DD − V_t)^α, minimized at V_DD = 3V_t/(3 − α) ≈ 2V_t; with leakage, best V_t ~100–150 mV, ~4× better EDP than V_DD = 1 V, V_t = 0.3 V; at the optimum leakage ≈ half of dynamic energy. Minimum energy under a delay constraint: where delay and energy contours touch; also about half leakage, but the optimum is flat so many designs run with less leakage to help sleep modes.",
    steps: [
      { k: "learn", title: "Which metric?", b: [
        `<p>Minimum <i>power</i> is easy: do nothing, slowly. Useful metrics include time:</p>`,
        `<ul><li><b>Energy per operation</b> (power × delay, the “power-delay product”).</li><li><b>Energy-delay product</b> (EDP): balances both.</li><li><b>Minimum energy under a delay constraint</b>: what designers actually face.</li></ul>`,
      ]},
      { k: "play", title: "The minimum energy point", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let L = 4;
          const Sv = 0.09;
          function draw() {
            const K = Math.pow(10, L), Es = (v) => v * v, El = (v) => v * v * K * Math.pow(10, -v / Sv);
            let best = 0.3, be = 1e9; for (let v = 0.05; v <= 1; v += 0.001) { const e = Es(v) + El(v); if (e < be) { be = e; best = v; } }
            const lg = (g) => (v) => Math.log10(g(v));
            f.innerHTML = plot({ x: [0.05, 1], y: [-3, 1], xt: [0.1, 0.2, 0.4, 0.6, 0.8, 1], yt: [-3, -2, -1, 0, 1], ytf: sup, xl: "V_DD (V)", yl: "energy per cycle (arb.)", padL: 56,
              series: [{ f: lg(Es), cls: "s2" }, { f: lg(El), cls: "s5" }, { f: lg((v) => Es(v) + El(v)), cls: "s1" }], marks: [{ x: best, y: Math.log10(be), label: `min at ${fmt(best, 3)} V`, dy: 18 }], texts: [{ x: 0.75, y: 0.1, s: "switching" }, { x: 0.45, y: -1.4, s: "leakage" }], label: "Switching, leakage and total energy against supply voltage" });
            ro.innerHTML = readout([["Minimum-energy V_DD", fmt(best, 3) + " V"], ["Energy there vs at 1 V", fmt(be / (Es(1) + El(1)), 3) + "×"], ["Relative delay there vs 1 V (subthreshold model)", fmt(Math.pow(10, (1 - best) / Sv) * best, 3) + "× slower (roughly)"]]);
          }
          host.append(f, slider({ id: id + "-l", label: "Leakage weight (log₁₀): higher = lower activity factor", min: 2, max: 6, step: 0.1, value: L, show: (x) => fmt(x, 2) }, (x) => { L = x; draw(); }).el, ro);
          draw();
        },
        `<div class="eq">E = V<sub>DD</sub><sup>2</sup>(C<sub>eff</sub> + W<sub>eff</sub>NkC<sub>g</sub> 10<sup>−V<sub>DD</sub>/S</sup>)</div>`,
        `<p class="aside">Below threshold, switching energy falls as V<sup>2</sup>, but each operation takes exponentially longer, so leakage energy explodes. The minimum sits where they cross. Lower activity (fewer gates switching) means relatively more leakage, and the best V<sub>DD</sub> moves up. The delay readout is a rough subthreshold estimate.</p>`,
      ]},
      { k: "learn", title: "How low can logic go?", b: [
        `<p>For an inverter to have gain (slope steeper than −1, so noise margins exist), an ideal device needs at least <b>V<sub>min</sub> = 2 ln 2 · v<sub>T</sub> ≈ 36 mV</b> at room temperature. Inverters have run below 100 mV, but they're so slow that leakage wastes more than they save.</p>`,
        `<p>The book's 180 nm example found the minimum energy at V<sub>DD</sub> = 0.13 V, V<sub>t</sub> = 0.37 V: 10× less energy than normal, but thousands of times slower. Good for sensors, not CPUs.</p>`,
      ]},
      { k: "play", title: "Minimum energy-delay product", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 1.3, Vt = 0.3;
          function draw() {
            const edp = (v) => (v > Vt + 0.01 ? (v * v * v) / Math.pow(v - Vt, a) : NaN), vopt = (3 * Vt) / (3 - a), m = edp(vopt);
            f.innerHTML = plot({ x: [0.2, 1.5], y: [0, 4], xt: [0.2, 0.5, 1, 1.5], yt: [0, 1, 2, 3, 4], xl: "V_DD (V)", yl: "EDP / minimum", series: [{ f: (v) => edp(v) / m, cls: "s1" }], marks: [{ x: vopt, y: 1, label: `V_DD = ${fmt(vopt, 3)}`, dy: -14 }], label: "Energy-delay product against supply" });
            ro.innerHTML = readout([["Best V_DD = 3V_t/(3 − α)", fmt(vopt, 3) + " V"], ["V_DD / V_t", fmt(vopt / Vt, 3)], ["EDP at 1.0 V vs best", fmt(edp(1) / m, 3) + "×"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "α (velocity saturation)", min: 1, max: 2, step: 0.05, value: a, show: (x) => fmt(x, 3) }, (x) => { a = x; draw(); }).el,
            slider({ id: id + "-v", label: "Threshold V_t", min: 0.1, max: 0.45, step: 0.01, value: Vt, show: (x) => fmt(x, 2) + " V" }, (x) => { Vt = x; draw(); }).el, ro);
          draw();
        },
        `<div class="eq">EDP ∝ C<sup>2</sup>V<sub>DD</sub><sup>3</sup> / (V<sub>DD</sub> − V<sub>t</sub>)<sup>α</sup>   ⇒   V<sub>DD,opt</sub> = 3V<sub>t</sub>/(3 − α) ≈ 2V<sub>t</sub></div>`,
        `<p class="aside">Ignoring leakage. Including it, the best V<sub>t</sub> is around 100–150 mV, with EDP about 4× better than V<sub>DD</sub> = 1 V, V<sub>t</sub> = 0.3 V. At that optimum, leakage is about half of dynamic energy.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "V_t = 0.3 V, α = 1.3, leakage ignored. Supply for minimum EDP?", a: 0.529, tol: 0.01, unit: "V", why: "0.9/1.7 = 0.53 V." },
        { t: "mcq", q: "At the energy-optimal operating point under a delay constraint, leakage is typically…", opts: [["About half of dynamic energy, but the optimum is flat, so many designs run with less", true, "Less leakage also helps sleep modes."], ["Negligible", false, "If leakage were negligible, you'd lower V_t further for speed."], ["Dominant", false, "Then you'd raise V_t."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why doesn't lowering V_DD all the way down minimize energy?", model: "Switching energy falls with V_DD squared, but below threshold each operation slows exponentially, so the circuit spends far longer per operation leaking. Leakage energy per operation therefore rises sharply at very low voltage. The minimum is where the falling switching energy and rising leakage energy balance." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Low-power architecture, pitfalls, history", mins: 20,
    blurb: "Many simple cores, big memories, accelerators, sleep states. And a power density that never reached the sun.",
    takeaway: "Power-limited chips make energy efficiency = performance; that drove the shift to multicore. Pollack's rule: performance grows ~ √(transistors), so sprawling cores waste energy; many simpler cores exploit task/data parallelism, with shorter wires. Memories have low power density (tiny α, regular leakage control): prefer bigger memory over faster logic when either helps; often > half of chip area. Special-purpose accelerators can be ~10× more efficient (graphics, networking, crypto): heterogeneous chips. Software lags hardware. Parallelism (N units at f/N, lower V; mux overhead) and pipelining (less logic per cycle, lower V; register overhead) cut energy; with significant leakage, pipelining wins (parallel hardware leaks N×). Power management modes trade savings vs wake-up (book: Intel Atom: 2 W at 2 GHz/1 V; low-frequency 600 MHz/0.75 V; C1 clock off + L1 flushed, < 1 µs wake; C4 PLL off; C6 everything power-gated, < 80 mW, ~100 µs wake; 80–90% of time in C6 → 220 mW average). Worst-case power can be 2× normal ('thermal virus'): throttle on temperature or issue rate. Pitfalls: oversizing gates (doubles power, no speed); designing for speed regardless of power (two cores at 80% performance/50% power give 160% throughput); quoting power at a frequency instead of energy per operation; PDP at a slow frequency when EDP is meant; ignoring leakage. History: Colossus (1944, 2400 tubes, 15 kW); nMOS (contention power) gave way to CMOS (first in Swiss watches) in the mid-1980s; 1990s: V_DD scaled from 5 V; 2001 Gelsinger forecast reactor/rocket nozzle/sun power densities, which didn't happen: power levelled under ~150 W.",
    steps: [
      { k: "learn", title: "Architecture is the big lever", b: [
        `<ul><li><b>Pollack's rule:</b> a core's performance grows only as √(transistors). Many simpler cores beat one sprawling one, if software can use them.</li><li><b>Memory over logic:</b> memories have tiny activity factors and low power density. If a bigger cache or a faster core would both help, the cache is often cheaper in power.</li><li><b>Accelerators:</b> special-purpose units for graphics, networking or crypto can be ~10× more energy-efficient.</li></ul>`,
      ]},
      { k: "learn", title: "Parallel or pipelined", b: [
        `<div class="two"><div class="tile"><h3>Parallel</h3><p>N copies at f/N each, at lower V<sub>DD</sub>. Small mux overhead, but N× the leakage.</p></div><div class="tile"><h3>Pipelined</h3><p>N stages, less logic per cycle, lower V<sub>DD</sub>. Register overhead, but no extra copies leaking.</p></div></div>`,
        `<p>Now that leakage matters, pipelining usually wins. And since V<sub>DD</sub> is already near the best energy-delay point, the remaining savings are smaller than they used to be.</p>`,
      ]},
      { k: "learn", title: "Sleep states", b: [
        `<p>The book's Intel Atom: 2 W at 2 GHz and 1 V.</p>`,
        `<div class="tbl"><table><thead><tr><th>Mode</th><th>What's off</th><th>Wake-up</th></tr></thead><tbody>
          <tr><td>Low-frequency</td><td>nothing: 600 MHz at 0.75 V</td><td>active</td></tr>
          <tr><td>C1/C2</td><td>core clock; L1 flushed and gated</td><td>&lt; 1 µs</td></tr>
          <tr><td>C4</td><td>also the PLL</td><td>&lt; 30 µs</td></tr>
          <tr><td>C6</td><td>core and caches power-gated: &lt; 80 mW</td><td>&lt; 100 µs</td></tr></tbody></table></div>`,
        `<p>Spending 80–90% of the time in C6 brings average power down to 220 mW.</p>`,
        `<p class="aside">Worst-case code (a “thermal virus”) can draw 2× normal power. Rather than design for it, chips throttle when temperature or activity gets too high.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A chip draws 1.5 W active and 50 mW asleep. It's active 15% of the time (ignore transitions). Average power?", a: 0.2675, tol: 0.01, unit: "W", why: "0.15 × 1.5 + 0.85 × 0.05 = 0.225 + 0.0425 = 0.27 W." },
        { t: "sort", q: "Sound or pitfall?", bins: ["Sound", "Pitfall"], items: [
          ["Doubling every gate on a slow path to speed it up", 1, "On a gate-dominated path, delay barely changes and power doubles."],
          ["Two cores at 80% performance and 50% power instead of one big core", 0, "160% throughput at the same power, if the work parallelizes."],
          ["Quoting '10 mW at 1 GHz' rather than '10 pJ per operation'", 1, "Energy per operation is one clean number."],
          ["Ignoring leakage because dynamic power dominates when active", 1, "Leakage can be a third of power, and breaks sensitive circuits."],
          ["Gating power to blocks that will idle for a long time", 0, "That's the main way to kill leakage."],
        ]},
      ]},
      { k: "why", title: "A short history of power", b: [
        `<p>Colossus (1944) used 2400 vacuum tubes and 15 kW. Transistors brought milliwatts. Early MOS chips were nMOS, whose resistive pull-ups burned power whenever an output was 0. CMOS debuted in <b>Swiss watches</b>, where near-zero idle power mattered more than density, and took over mainstream chips in the mid-1980s when nMOS power became unbearable.</p>`,
        `<p>In the 1990s the 5 V standard fell to cut dynamic power, which forced V<sub>t</sub> down until leakage became a problem. In 2001, Intel's Pat Gelsinger warned that on trend, processors would soon reach the power density of a nuclear reactor, then a rocket nozzle, then the sun's surface. Designers changed course: clock gating, power gating, voltage domains, DVS and multicore kept chips under ~150 W.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why did power limits push the industry to multicore processors?", model: "Making one core faster by adding transistors gives performance only around the square root of the extra transistors, while power grows with them, so big single cores became energy-inefficient and hit cooling limits. Several simpler cores, each running at an efficient voltage and frequency, deliver more total throughput for the same power, provided the software can split the work." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "vlsi5", eyebrow: "CMOS VLSI · Chapter 5", title: "Power",
    intro: `<p>Nine parts: power and energy basics, dynamic and static power, activity and clock gating, sizing for energy, voltage and frequency scaling, leakage and the stack effect, power gating and thresholds, the best V<sub>DD</sub> and V<sub>t</sub>, and low-power architecture.</p><p>You'll reuse Chapter 2's leakage model and Chapter 4's logical effort. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. Several are estimates: write down every assumption (activity factor, capacitance per µm, fraction leaking) before you multiply.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9],
    summary: `
      <h3>Basics</h3>
      <p>P = IV; E = ∫P dt; capacitor ½CV². Charging C from V<sub>DD</sub> costs CV<sub>DD</sub><sup>2</sup>; half is stored, half heats the transistor.</p>
      <h3>Dynamic</h3>
      <div class="eq">P<sub>switching</sub> = α C V<sub>DD</sub><sup>2</sup> f</div>
      <p>α: clock 1, random data 0.25, logic ~0.1; α = P(1 − P). Short-circuit &lt; 10%. Levers: clock gating, smaller gates (slightly slower), lower V<sub>DD</sub> (domains, level converters, DVS: energy ∝ rate³), lower f.</p>
      <h3>Static</h3>
      <p>I<sub>sub</sub> = I<sub>off</sub>10<sup>(V<sub>gs</sub> + η(V<sub>ds</sub> − V<sub>DD</sub>) − k<sub>γ</sub>V<sub>sb</sub>)/S</sup>; stack effect ~10×; gate leakage on ON transistors. Levers: power gating (header sized for droop), high-V<sub>t</sub> by default, longer channels, body bias, input vector control.</p>
      <h3>Optimization</h3>
      <p>Minimum energy is subthreshold (slow). Min EDP: V<sub>DD</sub> = 3V<sub>t</sub>/(3 − α) ≈ 2V<sub>t</sub>. Under a delay constraint, leakage ≈ half of dynamic at the optimum.</p>
      <h3>Architecture</h3>
      <p>Pollack's rule, many simple cores, memories, accelerators, pipelining over parallelism when leaky, sleep states, thermal throttling.</p>`,
  };
  Course.start(window.CHAPTER);
})();
