(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;

  function cmosInv(o = {}) {
    let s = S.supply(200, 40, "V_S") + S.nmos(186, 80, { p: true, label: o.pl || "PFET", tcls: "s m" }) + S.nmos(186, 160, { label: o.nl || "NFET", tcls: "s m" }) + S.gnd(200, 200) +
      S.wire([156, 80], [130, 80], [130, 160], [156, 160]) + S.wire([60, 120], [130, 120]) + S.dot(130, 120) + S.dot(200, 120) + S.wire([200, 120], [310, 120]) + S.t(54, 125, o.in || "v_IN", { a: "end" }) + S.t(316, 125, "v_OUT", { a: "start", cls: "a" });
    if (o.cl) s += S.dot(270, 120) + S.cap(270, 120, 270, 200, "C_L") + S.gnd(270, 200);
    return S.svg(380, 230, s, { max: 380, label: "CMOS inverter: PFET from V_S to the output, NFET from the output to ground, gates tied together" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "The cost of charging a capacitor", mins: 20,
    blurb: "Fill a capacitor to V: the source pays CV², half is lost.",
    takeaway: "Charging C to V through any resistor: the source supplies CV², the capacitor stores ½CV², and the resistor burns ½CV², whatever R is. Discharging burns the stored ½CV² too.",
    steps: [
      { k: "learn", title: "Why energy matters", b: [
        `<p>A battery holds a fixed amount of energy: how fast you spend it sets battery life. The rate you spend it (power) sets how hot the chip gets. Both are design limits.</p>`,
        fig(S.svg(340, 180, S.wire([60, 72], [60, 30], [100, 30]) + `<line class="w" x1="100" y1="30" x2="132" y2="16"/>` + S.wire([140, 30], [160, 30]) + S.res(160, 30, 250, 30, "R") + S.wire([250, 30], [280, 30]) + S.cap(280, 30, 280, 150, "C") + S.wire([60, 108], [60, 150], [280, 150]) + S.vsrc(60, 90, "V", { side: "right" }) + S.t(120, 54, "t = 0", { cls: "s m" }), { max: 340, label: "Switch closing a source onto R in series with C" })),
      ]},
      { k: "math", title: "Integrate the power", b: [
        `<p>After the switch closes: i = (V/R)e<sup>−t/RC</sup>. Power from the source: p = V·i = (V²/R)e<sup>−t/RC</sup>.</p>`,
        `<div class="eq">w = ∫₀^∞ (V²/R)e<sup>−t/RC</sup> dt = (V²/R)·RC = CV²</div>`,
        `<p>Math boost: ∫₀^∞ e<sup>−t/τ</sup> dt = τ. (The area under a decaying exponential is its height times τ.)</p>`,
        { t: "num", q: "The capacitor ends at V, storing ½CV². How much did the resistor burn?", a: 0.5, unit: "× CV²", why: "CV² − ½CV² = ½CV². Check: ∫ i²R dt = (V²/R)·(RC/2) = ½CV² ✓" },
      ]},
      { k: "play", title: "Does R matter?", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let R = 1;
          function draw() {
            const C = 1, V = 2, tau = R * C, ps = (t) => (V * V / R) * Math.exp(-t / tau), pr = (t) => (V * V / R) * Math.exp(-2 * t / tau);
            f.innerHTML = plot({ x: [0, 6], y: [0, 9], xt: [0, 2, 4, 6], yt: [0, 4, 8], xl: "t (ms)", yl: "power (mW)", areas: [{ f: ps, cls: "ar2", n: 300 }, { f: pr, cls: "ar1", n: 300 }], series: [{ f: ps, cls: "s2" }, { f: pr, cls: "s1" }], label: "Power from the source and power in the resistor" });
            ro.innerHTML = readout([["R", fmt(R) + " kΩ"], ["source energy (blue area)", fmt(C * V * V) + " µJ"], ["burned in R (orange area)", fmt(0.5 * C * V * V) + " µJ"], ["stored", fmt(0.5 * C * V * V) + " µJ"]]);
          }
          host.append(f, slider({ id: id + "-r", label: "R", min: 0.5, max: 3, step: 0.25, value: R, show: (x) => fmt(x) + " kΩ" }, (x) => { R = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">C = 1 µF, V = 2 V. Changing R reshapes the curves (tall and short, or low and long) but never changes the areas.</p>`,
      ]},
      { k: "why", title: "An honest surprise", b: [
        { t: "mcq", q: "Why can't a smaller resistor reduce the loss?", opts: [["Smaller R means bigger current for a shorter time. i²R × time comes out the same: ½CV²", true, "The loss depends only on C and V. To lose less, you'd need to charge gradually (not a sudden step), which this circuit doesn't do."], ["It can, R = 0 gives no loss", false, "With R → 0 the current spike grows without limit; the loss stays ½CV² (it just moves into wires, sparks, radiation)."], ["The capacitor wastes it", false, "An ideal capacitor wastes nothing."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Where does the energy go when a source charges a capacitor through a resistor?", model: "The source supplies CV². Half of it ends up stored in the capacitor's electric field and half is burned as heat in the resistor, no matter what the resistance is. If the capacitor is later discharged through a resistor, its stored half is burned too." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Average power: static plus dynamic", mins: 20,
    blurb: "A switched RC circuit splits its power into two kinds.",
    takeaway: "Average power p = (energy per cycle)/T. It splits into static power (find it with capacitors removed) and dynamic power (charging/discharging capacitors, ∝ C·V²/T, independent of R).",
    steps: [
      { k: "learn", title: "The circuit", b: [
        fig(S.svg(400, 180, S.wire([60, 72], [60, 30], [100, 30]) + `<line class="w" x1="100" y1="30" x2="132" y2="16"/>` + S.wire([140, 30], [160, 30]) + S.res(160, 30, 250, 30, "R₁") + S.wire([250, 30], [340, 30]) + S.cap(280, 30, 280, 150, "C", { side: "left" }) + S.res(340, 30, 340, 150, "R₂", { side: "right" }) + S.wire([60, 108], [60, 150], [340, 150]) + S.vsrc(60, 90, "V", { side: "right" }) + S.dot(280, 30) + S.dot(280, 150) + S.t(120, 54, "S", { cls: "s m" }), { max: 400, label: "Switch, R1, then C parallel with R2" })),
        `<p>A square wave closes the switch for T/2, then opens it for T/2. Assume each interval is long enough for the transients to settle.</p>`,
        `<div class="eq">average power = (energy per cycle)/T</div>`,
      ]},
      { k: "learn", title: "The result", b: [
        `<div class="eq">p = V²/(2(R₁ + R₂)) + V<sub>TH</sub>²C/T,   V<sub>TH</sub> = V·R₂/(R₁ + R₂)</div>`,
        `<div class="two"><div class="tile"><h3>Static power</h3><p>V²/(R₁+R₂) for the half of the time the switch is closed. Find it by removing the capacitor (open).</p></div><div class="tile"><h3>Dynamic power</h3><p>C swings between 0 and V<sub>TH</sub> each cycle: ½CV<sub>TH</sub>² burned charging, ½CV<sub>TH</sub>² discharging. Grows with frequency f = 1/T.</p></div></div>`,
        `<p class="aside">Careful: you may use Thévenin to find v<sub>C</sub>, but <b>not</b> to compute power in the original resistors. Power isn't linear.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>V = 4 V, R₁ = R₂ = 1 kΩ, C = 1 µF, T = 1 s (slow enough to settle).</p>`,
        { t: "num", q: "Static power?", a: 4, unit: "mW", hint: "V²/(2(R₁+R₂)) = 16/4 kΩ.", why: "4 mW." },
        { t: "num", q: "Dynamic power?", a: 4, unit: "µW", hint: "V_TH = 2 V. V_TH²C/T = 4 × 1 µF / 1 s.", why: "4 µW: a thousand times smaller than the static part here." },
        { t: "num", q: "Now switch 100× faster (T = 10 ms; the slowest time constant, R₂C = 1 ms, still lets each half-cycle settle). Dynamic power?", a: 0.4, unit: "mW", why: "It scales with frequency: 0.4 mW. Static stays 4 mW. Much faster than this and the transients wouldn't settle, so these formulas would no longer apply." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between static and dynamic power?", model: "Static power is the steady current a circuit draws whenever a DC path exists from supply to ground; it doesn't depend on how often things switch. Dynamic power is spent charging and discharging capacitances each time a signal changes, so it grows with switching frequency, C and V²." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Power in resistor-pullup gates", mins: 20,
    blurb: "Static power dominates, by a lot.",
    takeaway: "Resistor (or NMOS) pull-up gates burn static power V_S²/(R_L + R_pd) whenever the pull-down conducts, plus dynamic power ≈ C_L·V_S²·f. With normal timing the static part is far larger.",
    steps: [
      { k: "learn", title: "The inverter with a load", b: [
        fig(S.svg(360, 220, S.supply(200, 40, "V_S") + S.res(200, 40, 200, 110, "R_L", { side: "right" }) + S.nmos(186, 150) + S.gnd(200, 190) + S.wire([156, 150], [80, 150]) + S.wire([200, 110], [300, 110]) + S.dot(200, 110) + S.dot(260, 110) + S.cap(260, 110, 260, 190, "C_L") + S.gnd(260, 190) + S.t(74, 155, "v_IN", { a: "end" }) + S.t(306, 115, "v_OUT", { a: "start", cls: "a" }), { max: 360, label: "Resistor-pullup inverter driving a load capacitance" })),
        `<p>C<sub>L</sub> = the gate capacitances it drives + wire capacitance.</p>`,
        `<div class="eq">p<sub>static</sub> (on) = V<sub>S</sub>²/(R<sub>L</sub> + R<sub>ON</sub>)   p<sub>dynamic</sub> = V<sub>S</sub>²R<sub>L</sub>²C<sub>L</sub>/((R<sub>L</sub> + R<sub>ON</sub>)²T) ≈ C<sub>L</sub>V<sub>S</sub>²f</div>`,
        `<p class="aside">For a symmetric square-wave input the pull-down is on half the time, so the average static power is half the "on" value.</p>`,
      ]},
      { k: "check", title: "Worst-case static power", b: [
        `<p>Pull-down network: MOSFET A in series with (B ∥ C). R<sub>L</sub> = 50 kΩ, each R<sub>ON</sub> = 5 kΩ, V<sub>S</sub> = 3 V.</p>`,
        { t: "num", q: "Worst case (all inputs high): effective resistance from V_S to ground?", a: 57.5, unit: "kΩ", hint: "50 + 5 + (5 ∥ 5).", why: "50 + 5 + 2.5 = 57.5 kΩ." },
        { t: "num", q: "Worst-case static power?", a: 156.5, tol: 0.02, unit: "µW", why: "9/57.5k ≈ 157 µW." },
      ]},
      { k: "check", title: "A full example", b: [
        `<p>Inverter with R<sub>PU</sub> = 60 kΩ ≫ R<sub>ON</sub>, V<sub>S</sub> = 1.2 V, C<sub>L</sub> = 15 fF, input a 100 MHz square wave. (R<sub>PU</sub>C<sub>L</sub> = 0.9 ns ≪ 5 ns half period, so transients settle.)</p>`,
        { t: "num", q: "Average static power (on half the time)?", a: 12, unit: "µW", hint: "½ × V²/R_PU = ½ × 1.44/60k.", why: "12 µW." },
        { t: "num", q: "Dynamic power C·V²·f?", a: 2.16, tol: 0.02, unit: "µW", why: "15 fF × 1.44 × 10⁸ = 2.16 µW." },
        { t: "mcq", q: "Which one would you attack first to save power?", opts: [["The static power: it's over 80% of the total and is burned even when nothing is happening", true, "That's exactly what CMOS (Part 5) eliminates."], ["The dynamic power", false, "It's the smaller part here."], ["Neither can be changed", false, "Changing the circuit style removes the static part."]] },
      ]},
      { k: "why", title: "Why static wins", b: [
        { t: "mcq", q: "The book shows p_static/p_dynamic ≈ ((R_L + R_ON)/R_L)·T/(2R_LC_L). Why is that big in normal operation?", opts: [["For a gate to work its outputs must settle within the cycle, so T ≫ R_LC_L, which makes the ratio large", true, "A correctly working resistor-pullup gate is almost forced to waste mostly static power."], ["Because R_ON is large", false, "R_ON ≪ R_L normally."], ["Because capacitors burn no energy", false, "Charging through resistors does burn energy; it's just small compared with the static part."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a resistor-pullup inverter burn power even when its input never changes?", model: "Whenever its input is high, the MOSFET is on and there's a direct path from the supply through R_L and the MOSFET to ground. Current flows continuously along it, burning V²/(R_L + R_ON), even if nothing is switching." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "NMOS logic", mins: 10,
    blurb: "Replace the big resistor with another MOSFET.",
    takeaway: "Chips don't use big resistors as pull-ups (too much area). NMOS logic uses an always-on n-channel MOSFET instead, but it still has a DC path when the pull-down is on, so it still burns static power.",
    steps: [
      { k: "learn", title: "A MOSFET as the pull-up", b: [
        fig(S.svg(300, 220, S.supply(150, 40, "V_S") + S.nmos(136, 80, { label: "pull-up" , tcls: "s m"}) + S.wire([106, 80], [70, 80]) + S.t(64, 84, "V_A", { a: "end" }) + S.nmos(136, 160, { label: "pull-down", tcls: "s m" }) + S.gnd(150, 200) + S.wire([106, 160], [70, 160]) + S.t(64, 164, "v_IN", { a: "end" }) + S.dot(150, 120) + S.wire([150, 120], [250, 120]) + S.t(256, 125, "out", { a: "start", cls: "a" }), { max: 300, label: "NMOS inverter with a MOSFET pull-up" })),
        `<p>The pull-up's gate sits at V<sub>A</sub> ≥ V<sub>S</sub> + V<sub>T</sub>, so it's always on: its R<sub>ON</sub> plays the role of R<sub>L</sub>. It's made long (high L/W) so its R<sub>ON</sub> is big enough for the static discipline. Real NMOS used special depletion-mode pull-ups that need no extra supply.</p>`,
        { t: "mcq", q: "Does NMOS logic fix the static power problem?", opts: [["No: when the pull-down conducts, current still flows straight from V_S to ground through the pull-up", true, "Same formulas as Part 3 with R_ON(pull-up) in place of R_L."], ["Yes, MOSFETs don't burn power", false, "An on MOSFET is a resistor that burns i²R_ON."], ["Yes, because the pull-up is always on", false, "Always on is exactly the problem."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the advantage and the remaining problem of NMOS logic?", model: "The advantage is area: an always-on MOSFET is much smaller than a large on-chip resistor. The problem remains static power: with the pull-up always on, any time the pull-down conducts there's a DC path from supply to ground." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "CMOS: no static power", mins: 25,
    blurb: "A p-channel pull-up that switches off exactly when the n-channel switches on.",
    takeaway: "CMOS uses an NFET pull-down and a PFET pull-up; for a valid input exactly one is on, so there's no DC path and no static power. Its power is dynamic: p = f·C_L·V_S², so lowering V_S helps a lot.",
    steps: [
      { k: "learn", title: "The PFET", b: [
        `<div class="tbl"><table><thead><tr><th></th><th>NFET</th><th>PFET</th></tr></thead><tbody>
          <tr><td>turns on when</td><td class="mono">v<sub>GS</sub> ≥ V<sub>Tn</sub> (e.g. +1 V)</td><td class="mono">v<sub>GS</sub> ≤ V<sub>Tp</sub> (e.g. −1 V): gate well <b>below</b> source</td></tr>
          <tr><td>symbol</td><td>plain gate</td><td>bubble on the gate</td></tr>
          <tr><td>its source sits at</td><td>the low side (ground)</td><td>the high side (V<sub>S</sub>)</td></tr></tbody></table></div>`,
        `<p>A PFET with its source at V<sub>S</sub> is ON when the gate is at 0 V (logic 0) and OFF when the gate is at V<sub>S</sub>. It's the complement of the NFET.</p>`,
      ]},
      { k: "play", title: "The CMOS inverter", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let x = 0;
          function draw() {
            f.innerHTML = cmosInv({ in: "v_IN = " + (x ? "V_S" : "0"), pl: x ? "PFET off" : "PFET ON", nl: x ? "NFET ON" : "NFET off" });
            ro.innerHTML = readout([["input", x ? "1" : "0"], ["output", x ? "0 (pulled to ground)" : "1 (pulled to V_S)"], ["path V_S → ground?", "none"]]);
          }
          host.append(toggle(["Input 0", "Input 1"], (k) => { x = k; draw(); }), f, ro);
          draw();
        },
        `<p class="aside">Whichever way the input sits, one of the two transistors is off, so there's never a resistive path from V<sub>S</sub> to ground: <b>no static power</b>.</p>`,
      ]},
      { k: "math", title: "Dynamic power, the easy way", b: [
        fig(cmosInv({ cl: true })),
        `<p>Each cycle: input low → PFET charges C<sub>L</sub> to V<sub>S</sub>, drawing charge Q = C<sub>L</sub>V<sub>S</sub> from the supply. Input high → NFET dumps that charge to ground. So every cycle the supply delivers Q at voltage V<sub>S</sub>:</p>`,
        `<div class="eq">energy per cycle = V<sub>S</sub>·Q = C<sub>L</sub>V<sub>S</sub>²  ⟹  p = f·C<sub>L</sub>·V<sub>S</sub>²</div>`,
        { t: "num", q: "Same 15 fF load, 1.2 V, 100 MHz as Part 3, but CMOS. Total power?", a: 2.16, tol: 0.02, unit: "µW", why: "Only the dynamic part remains: 2.16 µW instead of 14.16 µW." },
      ]},
      { k: "check", title: "A whole chip", b: [
        `<p>50 million gates, each driving about 1 fF, at 2 GHz and 1 V. About 25% of the gates switch each cycle.</p>`,
        { t: "num", q: "Dynamic power?", a: 25, unit: "W", hint: "0.25 × 5×10⁷ × 2×10⁹ × 10⁻¹⁵ × 1².", why: "25 W. Now you see why chips need heat sinks." },
        { t: "num", q: "Same chip at 0.7 V instead of 1 V. Power?", a: 12.25, tol: 0.02, unit: "W", why: "Power ∝ V²: 25 × 0.49 = 12.25 W. That's why supply voltages fell from 5 V to ~1 V over the decades." },
      ]},
      { k: "why", title: "Not quite zero", b: [
        { t: "mcq", q: "Real CMOS inputs take time to rise and fall. What extra loss does that cause?", opts: [["Midway through a transition both transistors are partly on, so a brief current flows straight from V_S to ground", true, "Short-circuit (crowbar) current. Leakage is another small static loss. Both are ignored in this book's simple models."], ["None", false, "There's a brief overlap."], ["The capacitor stops charging", false, "It still charges, just with some wasted current alongside."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does CMOS logic burn essentially no power when its inputs aren't changing?", model: "Its pull-up and pull-down networks are complementary: for any valid input, one of them is open. So there's never a steady path from the supply to ground, and with no steady current there's no static power. Energy is only used when capacitances are charged and discharged during switching." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Designing CMOS gates", mins: 25,
    blurb: "Pull-down for when the output is 0, its mirror image for the pull-up.",
    takeaway: "For output f: the NFET pull-down must conduct exactly when f = 0, and the PFET pull-up exactly when f = 1. Series in one network becomes parallel in the other. NAND: NFETs in series, PFETs in parallel.",
    steps: [
      { k: "learn", title: "NAND and NOR", b: [
        `<div class="tbl"><table><thead><tr><th></th><th>pull-down (NFETs)</th><th>pull-up (PFETs)</th></tr></thead><tbody>
          <tr><td>NAND</td><td>series: conducts when A·B</td><td>parallel: conducts when Ā + B̄</td></tr>
          <tr><td>NOR</td><td>parallel: conducts when A + B</td><td>series: conducts when Ā·B̄</td></tr></tbody></table></div>`,
        `<p>The pull-up conducts exactly when the pull-down doesn't. De Morgan in hardware: NOT(A·B) = Ā + B̄.</p>`,
      ]},
      { k: "play", title: "Build NOT(A·B + C)", b: [
        `<p>Pull-down: (A in series with B) in parallel with C. Pull-up: (A ∥ B) in series with C. NFET switches close when their input is 1; PFET switches close when it's 0.</p>`,
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const st = [0, 0, 0];
          function draw() {
            const [A, B, C] = st, upOn = (!A || !B) && !C, downOn = (A && B) || C, out = upOn ? 1 : 0;
            let s = S.supply(205, 30, "V_S") + S.wire([170, 30], [240, 30]) + S.sw(170, 30, 90, !A, { label: "A", side: "left" }) + S.sw(240, 30, 90, !B, { label: "B" }) + S.wire([170, 90], [240, 90]) + S.sw(205, 90, 150, !C, { label: "C" }) +
              S.wire([170, 150], [240, 150]) + S.dot(205, 150) + S.wire([240, 150], [330, 150]) + S.sw(170, 150, 210, !!A, { label: "A", side: "left" }) + S.sw(170, 210, 270, !!B, { label: "B", side: "left" }) + S.sw(240, 150, 270, !!C, { label: "C" }) + S.wire([170, 270], [240, 270]) + S.gnd(205, 270) +
              S.t(336, 155, "out = " + out, { a: "start", cls: "big " + (out ? "a" : "") }) + S.t(60, 60, "PFETs", { cls: "s m" }) + S.t(60, 215, "NFETs", { cls: "s m" });
            f.innerHTML = S.svg(440, 300, s, { max: 440, label: "CMOS gate for NOT(A·B + C) shown as switches" });
            ro.innerHTML = readout([["pull-up conducts", upOn ? "yes" : "no"], ["pull-down conducts", downOn ? "yes" : "no"], ["both at once?", upOn && downOn ? "YES (bad!)" : "never"]]);
          }
          const row = el(`<div class="row bits"></div>`);
          ["A", "B", "C"].forEach((n, k) => { const b = el(`<button type="button" class="btn small" aria-pressed="false">${n}</button>`); b.addEventListener("click", () => { st[k] ^= 1; b.setAttribute("aria-pressed", String(!!st[k])); draw(); }); row.appendChild(b); });
          host.append(row, f, ro);
          draw();
        },
      ]},
      { k: "check", title: "Your design", b: [
        { t: "mcq", q: "You want out = NOT((A + B)·C). Which pull-down?", opts: [["(A ∥ B) in series with C", true, "The pull-down conducts when (A + B)·C = 1. The pull-up is the mirror: (A in series with B) ∥ C, using PFETs."], ["A, B, C all in series", false, "That's NOT(A·B·C)."], ["(A in series with B) ∥ C", false, "That's the pull-up's shape (with PFETs)."]] },
        { t: "mcq", q: "CMOS gates naturally make inverted functions (NAND, NOR...). How do you get a plain AND?", opts: [["NAND followed by an inverter", true, "Costs one extra stage (and its delay)."], ["Swap the NFETs and PFETs", false, "Then each would be driven in the wrong region; a PFET pull-down can't pull fully to 0 V."], ["You can't", false, "Add an inverter."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you get the PFET network from the NFET network in a CMOS gate?", model: "Take the dual: every series connection in the pull-down becomes parallel in the pull-up and vice versa, with PFETs instead of NFETs. Then the pull-up conducts exactly when the pull-down doesn't, which is what gives CMOS its zero static power." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ch11", eyebrow: "Chapter 11", title: "Energy and Power in Digital Circuits",
    intro: `<p>Six parts. Where the energy goes when circuits switch: charging capacitors, <b>static vs dynamic</b> power, why resistor-pullup and NMOS logic waste power, and how <b>CMOS</b> fixes it.</p><p class="aside">Arrow keys ← → move between steps. Need a refresher? <a href="10-first-order-transients.html">Chapter 10</a>.</p>`,
    after: `<p>Open the Chapter 11 PDF and go to the <b>exercises and problems</b> at the end. For each, first ask: is there a static path from supply to ground?</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <h3>Charging a capacitor</h3>
      <div class="eq">source: CV² · stored: ½CV² · burned in R: ½CV² (any R)</div>
      <p>∫₀^∞ e<sup>−t/τ</sup>dt = τ. Discharging burns the stored ½CV².</p>
      <h3>Average power</h3>
      <p>p = energy per cycle / T = static + dynamic. Static: remove capacitors (open). Dynamic ∝ CV²/T, independent of R. Thévenin finds v<sub>C</sub>, not power.</p>
      <p>Switched R₁–C∥R₂ circuit (settling, symmetric): p = V²/(2(R₁+R₂)) + V<sub>TH</sub>²C/T.</p>
      <h3>Resistor-pullup / NMOS gates</h3>
      <div class="eq">p_static(on) = V_S²/(R_L + R_pd) · p_dynamic = V_S²R_L²C_L/((R_L+R_pd)²T) ≈ C_L V_S² f</div>
      <p>Worst case: all pull-downs on. Static dominates when T ≫ R<sub>L</sub>C<sub>L</sub>. NMOS: always-on MOSFET pull-up; still static power.</p>
      <h3>CMOS</h3>
      <p>NFET pull-down + PFET pull-up (PFET on when v<sub>GS</sub> ≤ V<sub>Tp</sub> < 0). Never both on → no static power.</p>
      <div class="eq">p = f·C_L·V_S² (× fraction switching)</div>
      <p>Lower V<sub>S</sub> → quadratic savings. Extra losses: short-circuit current during slow edges, leakage.</p>
      <h3>CMOS gate design</h3>
      <p>Pull-down conducts when f = 0; pull-up is its dual (series ↔ parallel). NAND: NFETs series, PFETs parallel. NOR: the reverse.</p>`,
  };
  Course.start(window.CHAPTER);
})();
