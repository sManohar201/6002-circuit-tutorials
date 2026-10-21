(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const ch = (n, file, part, where, html) => `<p class="aside">${html} <a href="${file}#${part}">Boylestad Chapter ${n}, ${where} →</a></p>`;
  const par = (...r) => 1 / r.reduce((a, x) => a + 1 / x, 0);
  const ohm = (r) => si(r, "Ω");
  const TAU = 2 * Math.PI, L10 = Math.log10;
  const V = (v) => si(v, "V", 4);

  /* Op-amp triangle: inputs at y−20 (top) and y+20 (bottom), output at (x+72, y). Top input is − unless o.flip. */
  const oa = (x, y, o = {}) => `<polygon class="el" points="${x},${y - 42} ${x},${y + 42} ${x + 72},${y}"/>` +
    S.t(x + 13, y - 14, o.flip ? "+" : "−", { cls: "big" }) + S.t(x + 13, y + 27, o.flip ? "−" : "+", { cls: "big" });
  function bjtSym(x, y) {
    const L = Math.hypot(22, 19), ux = 22 / L, uy = 19 / L;
    let s = `<line class="w" x1="${x - 30}" y1="${y}" x2="${x}" y2="${y}"/><line class="w" x1="${x}" y1="${y - 20}" x2="${x}" y2="${y + 20}" style="stroke-width:3.5"/>`;
    s += `<polyline class="w" points="${x},${y - 9} ${x + 22},${y - 28} ${x + 22},${y - 50}"/><polyline class="w" points="${x},${y + 9} ${x + 22},${y + 28} ${x + 22},${y + 50}"/>`;
    const tx = x + 22 * 0.85, ty = y + 9 + 19 * 0.85, bx = tx - 9 * ux, by = ty - 9 * uy;
    return s + `<polygon class="nd" points="${tx},${ty} ${bx - 5 * uy},${by + 5 * ux} ${bx + 5 * uy},${by - 5 * ux}"/>`;
  }

  /* Basic differential amplifier. o.cs: constant-current source in place of R_E. o.hl: 1, 2 highlight an input. */
  function diffFig(o = {}) {
    let s = S.supply(250, 40, "+V_CC") + S.wire([172, 40], [328, 40]);
    s += S.res(172, 40, 172, 100, "R_C", { side: "left" }) + S.res(328, 40, 328, 100, "R_C", { side: "right" }) + S.wire([172, 100], [172, 120]) + S.wire([328, 100], [328, 120]);
    s += S.dot(172, 100) + S.dot(328, 100) + S.wire([172, 100], [215, 100]) + S.wire([328, 100], [285, 100]) + S.t(220, 105, "V_o1", { a: "start", cls: "a s" }) + S.t(280, 105, "V_o2", { a: "end", cls: "a s" });
    s += bjtSym(150, 170) + `<g transform="translate(500,0) scale(-1,1)">${bjtSym(150, 170)}</g>`;
    s += S.t(140, 205, "Q_1", { a: "end", cls: "s m" }) + S.t(360, 205, "Q_2", { a: "start", cls: "s m" });
    s += S.wire([172, 220], [172, 240], [328, 240], [328, 220]) + S.dot(250, 240) + S.t(258, 234, "V_E", { a: "start", cls: "s m" });
    s += o.cs ? S.isrc(250, 285, "I", { down: true, side: "right" }) + S.wire([250, 240], [250, 267]) + S.wire([250, 303], [250, 320]) : S.res(250, 240, 250, 320, "R_E", { side: "right" });
    s += S.t(250, 340, "−V_EE", { cls: "s" });
    s += S.dot(120, 170) + S.t(112, 175, "V_i1", { a: "end", cls: o.hl === 1 || o.hl === 3 ? "c" : "" }) + S.dot(380, 170) + S.t(388, 175, "V_i2", { a: "start", cls: o.hl === 2 || o.hl === 3 ? "c" : "" });
    return S.svg(500, 350, s, { max: 500, label: o.cs ? "Differential amplifier with a constant-current source in the emitter" : "Basic differential amplifier: two transistors sharing an emitter resistor" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Op amp at a glance", mins: 15,
    blurb: "Two inputs, one (or two) outputs. What goes in the + and − inputs, and what common-mode means.",
    takeaway: "An op-amp is a very high gain differential amplifier with high input impedance and low output impedance. + (noninverting) input: output in phase. − (inverting) input: output opposite. Single-ended input: signal on one input, other grounded. Double-ended (differential) input: V_d between the inputs, or two signals giving V_i1 − V_i2. Double-ended output: two outputs of opposite polarity; the difference V_o1 − V_o2 is 'floating' and twice either one. Common-mode: the same signal on both inputs ideally gives 0 V out. Common-mode rejection: differences amplified a lot, common signals (like noise) barely.",
    steps: [
      { k: "learn", title: "You've met it", b: [
        seen("The op amp as a huge-gain amplifier of v₊ − v₋, and feedback taming it.", "15-op-amp.html#p1", "Chapter 15, Part 1"),
        fig(S.svg(400, 170, oa(190, 85) + S.wire([150, 65], [190, 65]) + S.wire([150, 105], [190, 105]) + S.dot(150, 65) + S.dot(150, 105) + S.t(142, 70, "inverting input", { a: "end", cls: "s" }) + S.t(142, 110, "noninverting input", { a: "end", cls: "s" }) + S.wire([262, 85], [310, 85]) + S.dot(310, 85) + S.t(318, 90, "output", { a: "start", cls: "s" }), { max: 400, label: "Op-amp symbol with inverting and noninverting inputs" })),
        `<p>Boylestad builds it from the inside: an op-amp is a chain of <b>differential amplifier</b> stages. Very high gain, high input impedance, low output impedance.</p>`,
      ]},
      { k: "play", title: "Ways to drive it", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), cap = el(`<p></p>`);
          const modes = [
            ["Signal on +, − grounded", (t) => 0.3 * Math.sin(TAU * t), (t) => 0, (t) => 0.9 * Math.sin(TAU * t), "Single-ended into +: the output is in phase."],
            ["Signal on −, + grounded", (t) => 0, (t) => 0.3 * Math.sin(TAU * t), (t) => -0.9 * Math.sin(TAU * t), "Single-ended into −: the output is inverted."],
            ["Opposite signals", (t) => 0.3 * Math.sin(TAU * t), (t) => -0.3 * Math.sin(TAU * t), (t) => 1.1 * Math.sin(TAU * t), "Double-ended: the difference V_i1 − V_i2 is twice either input, and it's what gets amplified."],
            ["Same signal on both", (t) => 0.3 * Math.sin(TAU * t), (t) => 0.3 * Math.sin(TAU * t), (t) => 0.03 * Math.sin(TAU * t), "Common mode: ideally 0 V out. In practice a small output remains."],
          ];
          const draw = (k) => {
            const m = modes[k];
            f.innerHTML = plot({ x: [0, 2], y: [-1.2, 1.2], xt: [0, 1, 2], yt: [0], ytf: () => "0", xl: "time (cycles)", h: 200, series: [{ f: m[1], cls: "s2" }, { f: m[2], cls: "s3" }, { f: m[3], cls: "s1" }], texts: [{ x: 0.05, y: -1.05, s: "blue: + input · green: − input · orange: output" }], label: "Input and output waveforms for one way of driving the op amp" });
            cap.textContent = m[4];
          };
          host.append(f, toggle(modes.map((m) => m[0]), draw, 0), cap);
          draw(0);
        },
        `<div class="key"><b>Common-mode rejection:</b> amplify what's <b>different</b> between the inputs, reject what's <b>common</b>. Noise picked up on both wires is common, so it's largely rejected.</div>`,
      ]},
      { k: "learn", title: "Two outputs", b: [
        `<p>Some differential amplifiers have two outputs, always opposite. Taken between them (neither one ground), the output <b>floats</b> and is twice either: +10 V and −10 V give a 20 V difference.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "V_i1 = 3 mV and V_i2 = −3 mV. The difference signal?", opts: [["6 mV", true, "3 − (−3) = 6 mV."], ["0 mV", false, "That's what you'd get adding them."], ["3 mV", false, "The difference counts both."]] },
        { t: "mcq", q: "The same 50 mV hum appears on both inputs. An ideal differential amplifier's output from it?", opts: [["0 V", true, "Common-mode: the two halves cancel."], ["A large hum", false, "Only differences are amplified."], ["50 mV", false, "Not passed straight through either."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between differential and common-mode input signals, and why does it matter?", model: "A differential signal is the difference between the two inputs; a common-mode signal is what both inputs share. The amplifier gives a large gain to the difference and very little to the common part. That matters because noise usually appears equally on both inputs, so it gets rejected while the wanted signal gets amplified." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "The differential amplifier: DC bias", mins: 20,
    blurb: "Two matched transistors share an emitter resistor. Find the currents and voltages.",
    takeaway: "Bases at 0 V dc, so V_E = −0.7 V. I_E = (V_EE − 0.7 V)/R_E through the shared resistor. Matched transistors split it: I_C1 = I_C2 ≅ I_E/2. Collectors: V_C = V_CC − I_CR_C = V_CC − (I_E/2)R_C. Can run from a dual supply (shown) or a single supply.",
    steps: [
      { k: "learn", title: "The circuit", b: [
        fig(diffFig()),
        `<p>Two inputs, two outputs, emitters tied together. With the inputs at 0 V dc (sources look like shorts to ground for dc), the shared emitter sits one V<sub>BE</sub> below:</p>`,
        `<div class="eq">V<sub>E</sub> = −0.7 V    I<sub>E</sub> = (V<sub>EE</sub> − 0.7 V)/R<sub>E</sub>    I<sub>C1</sub> = I<sub>C2</sub> ≅ I<sub>E</sub>/2    V<sub>C</sub> = V<sub>CC</sub> − I<sub>C</sub>R<sub>C</sub></div>`,
      ]},
      { k: "predict", title: "Guess first", b: [
        { t: "mcq", q: "Double R_C. What happens to I_C?", opts: [["Nothing: I_E is set by V_EE and R_E", true, "Right. R_C only changes V_C."], ["I_C halves", false, "I_C comes from the emitter loop, which doesn't include R_C."], ["I_C doubles", false, "No."]] },
      ]},
      { k: "play", title: "Bias lab", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let VCC = 12, RE = 5600, RC = 6800;
          function draw() {
            const IE = (VCC - 0.7) / RE, IC = IE / 2, VC = VCC - IC * RC;
            ro.innerHTML = readout([["I<sub>E</sub> = (V<sub>EE</sub> − 0.7)/R<sub>E</sub>", si(IE, "A", 4)], ["I<sub>C</sub> each = I<sub>E</sub>/2", si(IC, "A", 4)], ["V<sub>C</sub> = V<sub>CC</sub> − I<sub>C</sub>R<sub>C</sub>", V(VC)], ["V<sub>CE</sub> = V<sub>C</sub> − (−0.7)", V(VC + 0.7)]]);
          }
          host.append(slider({ id: id + "-v", label: "V_CC = V_EE", min: 5, max: 15, step: 0.5, value: VCC, show: (v) => v + " V" }, (v) => { VCC = v; draw(); }).el,
            slider({ id: id + "-e", label: "R_E", min: 1000, max: 20000, step: 100, value: RE, show: ohm }, (v) => { RE = v; draw(); }).el,
            slider({ id: id + "-c", label: "R_C", min: 1000, max: 20000, step: 100, value: RC, show: ohm }, (v) => { RC = v; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>V<sub>CC</sub> = V<sub>EE</sub> = 12 V, R<sub>E</sub> = 5.6 kΩ, R<sub>C</sub> = 6.8 kΩ.</p>`,
        { t: "num", q: "I_E?", a: 2.018, unit: "mA", tol: 0.01, hint: "(12 − 0.7)/5.6 kΩ.", why: "2.02 mA." },
        { t: "num", q: "I_C in each transistor?", a: 1.009, unit: "mA", tol: 0.01, hint: "Half of I_E.", why: "1.01 mA." },
        { t: "num", q: "V_C?", a: 5.139, unit: "V", tol: 0.01, hint: "12 − 1.009 mA × 6.8 kΩ.", why: "5.14 V on both collectors." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you find the collector voltage of a basic differential amplifier?", model: "With the bases at zero volts, the emitters sit at minus 0.7 volts. The current through R_E is V_EE minus 0.7 over R_E. Matched transistors share it equally, so each collector current is half of that. The collector voltage is V_CC minus that half-current times R_C." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "The differential amplifier: gains and CMRR", mins: 30,
    blurb: "Big gain for differences, tiny gain for common signals. A current source makes the gap huge.",
    takeaway: "Single-ended (one input driven, other grounded, R_E large): I_b = V_i/(2βr_e), so A_v = V_o/V_i = R_C/(2r_e) at either collector. Double-ended: A_d = V_o/V_d = R_C/r_e, V_d = V_i1 − V_i2. Common-mode: A_c = βR_C/[r_i + 2(β + 1)R_E], with r_i = βr_e. The bigger R_E, the smaller A_c. A constant-current source in the emitter acts as a very large ac resistance (its r_o), making A_c tiny. Good differential amplifier: A_d ≫ A_c.",
    steps: [
      { k: "learn", title: "Where the signal goes", b: [
        fig(diffFig({ hl: 1 })),
        `<p>Drive V<sub>i1</sub>, ground V<sub>i2</sub>. With R<sub>E</sub> very large, the input current flows into Q<sub>1</sub>'s base, out its emitter and <b>into Q<sub>2</sub>'s emitter</b>, so it meets two base–emitter resistances in series:</p>`,
        `<div class="eq">V<sub>i</sub> − I<sub>b</sub>r<sub>i</sub> − I<sub>b</sub>r<sub>i</sub> = 0    I<sub>b</sub> = V<sub>i</sub>/(2βr<sub>e</sub>)    I<sub>c</sub> = V<sub>i</sub>/(2r<sub>e</sub>)</div>`,
        `<div class="eq">single-ended: A<sub>v</sub> = R<sub>C</sub>/(2r<sub>e</sub>)    double-ended: A<sub>d</sub> = R<sub>C</sub>/r<sub>e</sub></div>`,
        `<p class="aside">Both transistors carry the signal, which is why the factor 2 appears. Example 10.2 points to "Eq. (10.31)" for this gain; it's Eq. (10.4).</p>`,
      ]},
      { k: "learn", title: "Common-mode gain", b: [
        fig(diffFig({ hl: 3 })),
        `<p>Same signal on both bases: now both emitter currents go down through R<sub>E</sub>, which carries 2(β + 1)I<sub>b</sub>. R<sub>E</sub> fights back hard:</p>`,
        `<div class="eq">A<sub>c</sub> = βR<sub>C</sub>/[r<sub>i</sub> + 2(β + 1)R<sub>E</sub>]</div>`,
        ch(5, "05-bjt-ac-analysis.html", "p4", "Part 4", "An unbypassed emitter resistor reduces gain: same idea."),
      ]},
      { k: "play", title: "Single, double, common", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let mode = 0, RE = 5600, cs = false;
          function draw() {
            const IC = (12 - 0.7) / 5600 / 2, re = 0.026 / IC, RC = 6800, b = 100, REac = cs ? 250e3 : RE;
            const Av = RC / (2 * re), Ad = RC / re, Ac = (b * RC) / (b * re + 2 * (b + 1) * REac), vi = 0.002;
            const g = mode === 0 ? Av : mode === 1 ? Ad : Ac, vin = mode === 1 ? 2 * vi : vi, out = g * vin;
            f.innerHTML = plot({ x: [0, 2], y: [-1.2, 1.2], xt: [0, 1, 2], yt: [-1, -0.5, 0, 0.5, 1], xl: "time (cycles)", yl: "V_o (V)", h: 210, series: [{ f: (t) => -out * Math.sin(TAU * t), cls: "s1" }], label: "Output for the chosen input mode" });
            ro.innerHTML = readout([["Gain for this mode", fmt(g, 4)], ["Input", mode === 1 ? "V_d = 4 mV (±2 mV)" : "2 mV"], ["Output = gain × input", si(out, "V", 3)], ["A<sub>d</sub>/A<sub>c</sub> (CMRR)", fmt(Ad / Ac, 4) + " = " + fmt(20 * L10(Ad / Ac), 3) + " dB"]]);
          }
          host.append(f, toggle(["Single-ended", "Double-ended", "Common mode"], (k) => { mode = k; draw(); }, 0),
            toggle(["R_E = 5.6 kΩ", "Current source (r_o = 250 kΩ)"], (k) => { cs = k === 1; draw(); }, 0), ro);
          draw();
        },
        `<p class="aside">Part 2's amplifier: I<sub>C</sub> = 1.01 mA, r<sub>e</sub> = 25.8 Ω, β = 100. Inputs 2 mV peak.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Same amplifier: R<sub>C</sub> = 6.8 kΩ, I<sub>C</sub> = 1.009 mA, β = 100, R<sub>E</sub> = 5.6 kΩ.</p>`,
        { t: "num", q: "r_e?", a: 25.77, unit: "Ω", tol: 0.01, hint: "26 mV/I_C (each transistor's own current).", why: "25.8 Ω." },
        { t: "num", q: "Single-ended gain A_v?", a: 131.9, tol: 0.01, hint: "R_C/(2r_e).", why: "132." },
        { t: "num", q: "Common-mode gain A_c?", a: 0.5998, tol: 0.01, hint: "r_i = βr_e = 2.58 kΩ; denominator r_i + 2(101)(5.6 kΩ).", why: "680 000/1 133 777 = 0.600." },
        { t: "num", q: "With a current source of r_o = 250 kΩ in place of R_E, A_c?", a: 0.01346, tol: 0.01, hint: "Use 250 kΩ for R_E.", why: "0.0135: 45 times smaller." },
      ]},
      { k: "learn", title: "The current-source trick", b: [
        fig(diffFig({ cs: true })),
        `<p>Making R<sub>E</sub> huge would need a huge supply to keep the dc current. A <b>constant-current source</b> (a transistor biased as in Chapter 4) gives the dc current you want and a very large <b>ac</b> resistance, its r<sub>o</sub>.</p>`,
        ch(4, "04-dc-biasing-bjts.html", "p11", "Part 11", "Current sources and mirrors."),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a differential amplifier amplify differences much more than common signals?", model: "For a difference signal, one emitter current goes up as the other goes down, so the shared emitter node hardly moves and R_E carries no signal current. The gain is high, R_C over r_e. For a common signal, both emitter currents change the same way and all of it flows through R_E, which acts like a big unbypassed emitter resistor and kills the gain. A current source makes that resistance even bigger." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "BiFET, BiMOS and CMOS", mins: 15,
    blurb: "Mix device types inside the IC: FET inputs for high impedance, CMOS for low power.",
    takeaway: "BiFET: JFET input pair, bipolar current source (a current mirror sets equal bias). Higher input impedance than all-bipolar. BiMOS: MOSFET inputs with bipolar current sources, higher still. CMOS: complementary n- and p-channel enhancement MOSFETs. CMOS inverter: V_i = 0 → nMOS off (V_GS = 0), pMOS on (V_GS = −5 V), V_o = 5 V; V_i = 5 V → nMOS on, pMOS off, V_o ≈ 0. CMOS differential amplifier: pMOS input pair, nMOS current source; low power, suits battery use.",
    steps: [
      { k: "learn", title: "Mixing devices", b: [
        `<div class="two"><div class="tile"><h3>BiFET</h3><p>JFET inputs, bipolar current source (a current mirror gives each JFET the same bias). Higher input impedance than BJTs.</p></div><div class="tile"><h3>BiMOS</h3><p>MOSFET inputs, bipolar current sources. Even higher input impedance.</p></div><div class="tile"><h3>CMOS</h3><p>Complementary n- and p-channel MOSFETs only. Very low power: good for batteries.</p></div></div>`,
      ]},
      { k: "learn", title: "The CMOS inverter again", b: [
        seen("CMOS: one transistor pulls up, the other pulls down, and no static current flows.", "11-energy-power-digital.html#p5", "Chapter 11, Part 5"),
        `<div class="tbl"><table><tr><th>V<sub>i</sub></th><th>nMOS V<sub>GS</sub></th><th>pMOS V<sub>GS</sub></th><th>On</th><th>V<sub>o</sub></th></tr><tr><td>0 V</td><td>0 V (off)</td><td>−5 V (on)</td><td>pMOS</td><td>5 V</td></tr><tr><td>5 V</td><td>5 V (on)</td><td>0 V (off)</td><td>nMOS</td><td>0 V</td></tr></table></div>`,
        `<p class="aside">The pMOS source sits at +5 V, so its V<sub>GS</sub> = V<sub>i</sub> − 5 V. For the 5 V input the book says the output is pulled low "through conducting transistor Q<sub>2</sub>"; it's Q<sub>1</sub>, the nMOS.</p>`,
        ch(6, "06-fets.html", "p10", "Part 10", "Enhancement MOSFETs and CMOS."),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which design fits each need?", bins: ["BiFET or BiMOS", "CMOS"], items: [
          ["Input must draw almost no current from a high-impedance sensor", 0, "FET inputs give very high input impedance."],
          ["A battery-powered device that must sip power", 1, "CMOS has very low dissipation."],
          ["Bipolar current sources with FET inputs", 0, "That's the mixed design."],
          ["Only n- and p-channel MOSFETs", 1, "Complementary MOS."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why put FETs at the input of an op-amp?", model: "Because a FET gate draws almost no current, so the input impedance is far higher than with bipolar transistors. The amplifier then barely loads whatever is driving it." },
      ]},
    ],
  };

  /* Op-amp circuits. kind: inv, non, fol, sum, int, dif. o.l overrides labels; o.rc adds a compensating resistor on +. */
  function opFig(kind, o = {}) {
    const l = Object.assign({ R1: "R_1", Rf: "R_f", R2: "R_2", R3: "R_3", V1: "V_1", Vo: "V_o", C: "C", R: "R" }, o.l || {});
    let s = "", W = 380, H = 200;
    if (kind === "inv" || kind === "int" || kind === "dif") {
      s += oa(200, 120) + S.dot(50, 100) + S.t(42, 105, kind === "inv" ? l.V1 : "v_1(t)", { a: "end", cls: "c" });
      s += kind === "dif" ? S.cap(50, 100, 140, 100, l.C) : S.res(50, 100, 140, 100, kind === "int" ? l.R : l.R1);
      s += S.wire([140, 100], [200, 100]) + S.dot(170, 100) + S.wire([170, 100], [170, 45]) + S.wire([300, 45], [300, 120]);
      s += kind === "int" ? S.cap(170, 45, 300, 45, l.C) : S.res(170, 45, 300, 45, kind === "dif" ? l.R : l.Rf);
      s += S.wire([272, 120], [340, 120]) + S.dot(300, 120) + S.dot(340, 120) + S.t(340, 108, kind === "inv" ? l.Vo : "v_o(t)", { cls: "a" });
      if (o.rc) { s += S.wire([200, 140], [180, 140]) + S.res(180, 140, 180, 195, "R_C", { side: "left" }) + S.gnd(180, 195); H = 230; }
      else s += S.wire([200, 140], [180, 140], [180, 150]) + S.gnd(180, 150);
    } else if (kind === "non" || kind === "fol") {
      s += oa(200, 120, { flip: true }) + S.dot(60, 100) + S.t(52, 105, l.V1, { a: "end", cls: "c" }) + S.wire([60, 100], [200, 100]);
      s += S.wire([272, 120], [340, 120]) + S.dot(300, 120) + S.dot(340, 120) + S.t(340, 108, l.Vo, { cls: "a" });
      if (kind === "non") { s += S.wire([200, 140], [170, 140], [170, 180]) + S.dot(170, 180) + S.res(170, 180, 170, 250, l.R1, { side: "left" }) + S.gnd(170, 250) + S.res(170, 180, 300, 180, l.Rf, { side: "below" }) + S.wire([300, 180], [300, 120]); H = 280; }
      else { s += S.wire([200, 140], [180, 140], [180, 180], [300, 180], [300, 120]); H = 200; }
    } else if (kind === "sum") {
      s += oa(200, 140) + [[70, l.V1, l.R1], [120, "V_2", l.R2], [170, "V_3", l.R3]].map(([y, v, r]) => S.dot(40, y) + S.t(32, y + 5, v, { a: "end", cls: "c" }) + S.res(40, y, 120, y, r) + S.wire([120, y], [150, y])).join("");
      s += S.wire([150, 70], [150, 170]) + S.dot(150, 120) + S.wire([150, 120], [200, 120]) + S.dot(170, 120) + S.wire([170, 120], [170, 40]) + S.res(170, 40, 300, 40, l.Rf) + S.wire([300, 40], [300, 140]);
      s += S.wire([272, 140], [340, 140]) + S.dot(300, 140) + S.dot(340, 140) + S.t(340, 128, l.Vo, { cls: "a" }) + S.wire([200, 160], [185, 160], [185, 168]) + S.gnd(185, 168);
      H = 210;
    }
    const names = { inv: "Inverting amplifier", non: "Noninverting amplifier", fol: "Unity follower", sum: "Three-input summing amplifier", int: "Integrator: R in, C in the feedback path", dif: "Differentiator: C in, R in the feedback path" };
    return S.svg(W, H, s, { max: W, label: names[kind] });
  }

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Op-amp basics: gain set by two resistors", mins: 25,
    blurb: "A huge, sloppy gain plus feedback gives a precise gain of −R_f/R_1. And the 'virtual ground'.",
    takeaway: "Model: input resistance R_i (megohms), output resistance R_o (under 100 Ω), source A_vV_d. Ideal: R_i = ∞, R_o = 0, A_v = ∞. Constant-gain multiplier (input through R₁ to −, feedback R_f, + grounded): superposition gives V_i = R_fV₁/[R_f + (1 + A_v)R₁]; for A_v ≫ 1 and A_vR₁ ≫ R_f, V_o/V₁ = −R_f/R₁, set only by the resistors. R_f = R₁: gain −1 exactly. Virtual ground: V_i = V_o/A_v is tiny (−10 V/20 000 = 0.5 mV), so treat the − input as 0 V, but with no current into it. Then I = V₁/R₁ = −V_o/R_f.",
    steps: [
      { k: "learn", title: "The model", b: [
        seen("The same model, and the shortcut v₊ ≈ v₋.", "15-op-amp.html#p5", "Chapter 15, Part 5"),
        `<div class="two"><div class="tile"><h3>Practical</h3><p>R<sub>i</sub> a few MΩ between the inputs, R<sub>o</sub> under 100 Ω, a source A<sub>v</sub>V<sub>d</sub> with A<sub>v</sub> very large.</p></div><div class="tile"><h3>Ideal</h3><p>R<sub>i</sub> = ∞, R<sub>o</sub> = 0, A<sub>v</sub> = ∞.</p></div></div>`,
        fig(opFig("inv")),
      ]},
      { k: "learn", title: "Why the gain is −R_f/R_1", b: [
        `<p>Superpose V<sub>1</sub> and the output source at the − input, then solve for the tiny input voltage V<sub>i</sub>:</p>`,
        `<div class="eq">V<sub>i</sub> = R<sub>f</sub>V<sub>1</sub>/[R<sub>f</sub> + (1 + A<sub>v</sub>)R<sub>1</sub>]    V<sub>o</sub> = −A<sub>v</sub>V<sub>i</sub></div>`,
        `<p>When A<sub>v</sub> is huge, (1 + A<sub>v</sub>)R<sub>1</sub> swamps R<sub>f</sub>, and A<sub>v</sub> cancels:</p>`,
        `<div class="eq">V<sub>o</sub>/V<sub>1</sub> = −R<sub>f</sub>/R<sub>1</sub></div>`,
      ]},
      { k: "play", title: "How big must A_v be?", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let A = 1000, k = 20;
          function draw() {
            const g = (-A * k) / (k + (1 + A)), vi = (k * 0.5) / (k + (1 + A));
            ro.innerHTML = readout([["Ideal gain −R<sub>f</sub>/R<sub>1</sub>", fmt(-k, 4)], ["Real gain −A<sub>v</sub>R<sub>f</sub>/[R<sub>f</sub> + (1 + A<sub>v</sub>)R<sub>1</sub>]", fmt(g, 5)], ["Error", fmt((100 * (k + g)) / k, 3) + "%"], ["V<sub>i</sub> for V<sub>1</sub> = 0.5 V", si(vi, "V", 3)]]);
          }
          host.append(slider({ id: id + "-a", label: "Open-loop gain A_v", min: 10, max: 1e6, log: true, value: A, show: (v) => fmt(v, 3) }, (v) => { A = v; draw(); }).el,
            slider({ id: id + "-k", label: "R_f/R_1", min: 1, max: 100, step: 1, value: k, show: (v) => String(v) }, (v) => { k = v; draw(); }).el, ro);
          draw();
        },
        `<p>At A<sub>v</sub> = 200 000 (a typical op-amp) the gain is −20 to within 0.01%, and V<sub>i</sub> is microvolts.</p>`,
      ]},
      { k: "learn", title: "Virtual ground", b: [
        `<p>V<sub>i</sub> = V<sub>o</sub>/A<sub>v</sub>: a few volts divided by tens of thousands. Call it 0 V. The − input is a <b>virtual ground</b>: at ground potential, but <b>no current</b> flows into it. All of I goes through R<sub>f</sub>:</p>`,
        `<div class="eq">I = V<sub>1</sub>/R<sub>1</sub> = −V<sub>o</sub>/R<sub>f</sub>    ⇒    V<sub>o</sub>/V<sub>1</sub> = −R<sub>f</sub>/R<sub>1</sub></div>`,
        `<p class="aside">The "short" isn't physically there; it's a calculation shortcut that only works because A<sub>v</sub> is so large.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "V_o = −8 V and A_v = 50 000. Voltage between the op-amp inputs?", a: 0.16, unit: "mV", tol: 0.01, hint: "V_o/A_v.", why: "0.16 mV: next to the volts elsewhere, effectively 0." },
        { t: "num", q: "R_f/R₁ = 20, but the op-amp only has A_v = 1000. Actual gain?", a: -19.59, tol: 0.005, hint: "−A_vR_f/[R_f + (1 + A_v)R₁], with R₁ = 1 and R_f = 20.", why: "−20 000/1021 = −19.59: 2% low." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is a virtual ground, and why can you use it?", model: "It's the inverting input of an op-amp with negative feedback and the noninverting input grounded. The output is only a few volts and the gain is huge, so the voltage between the inputs is microvolts, effectively zero. So the inverting input sits at ground potential, but no current flows into it: all the input current goes on through the feedback resistor." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Inverting, noninverting, follower, summer", mins: 25,
    blurb: "Four everyday circuits, each solved with the virtual ground in one line.",
    takeaway: "Inverting: V_o = −(R_f/R₁)V₁. Noninverting (V₁ on +, R₁ and R_f divide the output back to −): V₁ = R₁V_o/(R₁ + R_f), so V_o/V₁ = 1 + R_f/R₁. The inverting form is more widely used (better frequency stability). Unity follower: V_o = V₁, like an emitter follower but exactly 1. Summing amplifier: V_o = −(R_f/R₁·V₁ + R_f/R₂·V₂ + R_f/R₃·V₃); each input gets its own gain.",
    steps: [
      { k: "play", title: "Four circuits", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), eq = el(`<div class="eq"></div>`), cap = el(`<p></p>`);
          const c = [
            ["inv", "V<sub>o</sub> = −(R<sub>f</sub>/R<sub>1</sub>)V<sub>1</sub>", "Inverting: virtual ground at −, so I = V<sub>1</sub>/R<sub>1</sub> flows on through R<sub>f</sub>."],
            ["non", "V<sub>o</sub> = (1 + R<sub>f</sub>/R<sub>1</sub>)V<sub>1</sub>", "Noninverting: the − input follows V<sub>1</sub>, and R<sub>1</sub>, R<sub>f</sub> divide V<sub>o</sub> down to V<sub>1</sub>. Gain is always at least 1."],
            ["fol", "V<sub>o</sub> = V<sub>1</sub>", "Unity follower: full feedback. Same polarity, gain exactly 1: a buffer."],
            ["sum", "V<sub>o</sub> = −(R<sub>f</sub>V<sub>1</sub>/R<sub>1</sub> + R<sub>f</sub>V<sub>2</sub>/R<sub>2</sub> + R<sub>f</sub>V<sub>3</sub>/R<sub>3</sub>)", "Summing: each input's current lands at the virtual ground and they add in R<sub>f</sub>."],
          ];
          const d = (k) => { f.innerHTML = opFig(c[k][0]); eq.innerHTML = c[k][1]; cap.innerHTML = c[k][2]; };
          host.append(f, toggle(["Inverting", "Noninverting", "Follower", "Summing"], d, 0), eq, cap);
          d(0);
        },
        seen("Noninverting and inverting amplifiers, and the follower.", "15-op-amp.html#p2", "Chapter 15, Parts 2–4"),
      ]},
      { k: "check", title: "Inverting and noninverting", b: [
        { t: "num", q: "Inverting: R₁ = 22 kΩ, R_f = 330 kΩ, V₁ = 0.4 V. V_o?", a: -6, unit: "V", hint: "−(R_f/R₁)V₁.", why: "−15 × 0.4 = −6 V." },
        { t: "num", q: "Noninverting: R₁ = 10 kΩ, R_f = 47 kΩ, V₁ = 0.25 V. V_o?", a: 1.425, unit: "V", hint: "(1 + R_f/R₁)V₁.", why: "5.7 × 0.25 = 1.425 V." },
        { t: "mcq", q: "You need a gain of +0.5. Which circuit?", opts: [
          ["None of these alone: noninverting can't go below 1", true, "Right. You'd attenuate first (a divider) or use two inverting stages."],
          ["Noninverting with R_f = 0.5R₁", false, "That gives 1.5."],
          ["Inverting with R_f = 0.5R₁", false, "That gives −0.5: the sign is wrong."],
        ]},
      ]},
      { k: "check", title: "Summing", b: [
        `<p>R<sub>f</sub> = 120 kΩ. V<sub>1</sub> = +0.5 V through R<sub>1</sub> = 40 kΩ, V<sub>2</sub> = −1.2 V through R<sub>2</sub> = 60 kΩ, V<sub>3</sub> = +2 V through R<sub>3</sub> = 240 kΩ.</p>`,
        { t: "num", q: "V_o?", a: -0.1, unit: "V", tol: 0.01, hint: "Gains 3, 2 and 0.5. Watch the sign of V₂.", why: "−[1.5 − 2.4 + 1.0] = −0.1 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a summing amplifier add voltages?", model: "Each input drives a current V over R into the virtual ground at the inverting input. None of it enters the op-amp, so all the currents add and flow through the feedback resistor. The output is minus R_f times that total current, so each input appears at the output multiplied by its own R_f over R." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Integrator and differentiator", mins: 25,
    blurb: "Put a capacitor in the feedback and the output ramps. Swap them and it differentiates.",
    takeaway: "Integrator (R in, C in feedback): V_o/V₁ = −1/(sCR) with s = jω, or v_o(t) = −(1/RC)∫v₁(t)dt. A constant input gives a ramp of slope −V₁/RC (it stops at saturation). Summing integrator: v_o = −[(1/R₁C)∫v₁ + (1/R₂C)∫v₂ + (1/R₃C)∫v₃]; analog computers label each input by its scale factor 1/RC. Differentiator (C in, R in feedback): v_o(t) = −RC dv₁/dt. Less used.",
    steps: [
      { k: "learn", title: "Capacitor in the feedback", b: [
        fig(opFig("int")),
        `<p>Virtual ground again: I = V<sub>1</sub>/R flows into C. With X<sub>C</sub> = 1/(sC):</p>`,
        `<div class="eq">V<sub>o</sub>/V<sub>1</sub> = −1/(sCR)    v<sub>o</sub>(t) = −(1/RC)∫v<sub>1</sub>(t) dt</div>`,
        `<p>Integrating means adding up the area under the input. A constant input keeps adding the same amount each second: a <b>ramp</b>.</p>`,
        seen("Op amps with capacitors: integrators and differentiators.", "15-op-amp.html#p7", "Chapter 15, Part 7"),
      ]},
      { k: "play", title: "Ramp lab", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let R = 470e3, C = 0.22e-6, V1 = 0.5;
          function draw() {
            const k = -V1 / (R * C), sat = 13, vo = (t) => Math.max(-sat, Math.min(sat, k * t));
            f.innerHTML = plot({ x: [0, 3], y: [-15, 15], xt: [0, 1, 2, 3], yt: [-13, -10, 0, 10, 13], xl: "t (s)", yl: "v_o (V)", h: 240, series: [{ f: vo, cls: "s1" }, { f: () => V1, cls: "s2" }], texts: [{ x: 2.2, y: V1 + 1.5, s: "v_1" }], label: "Integrator output ramp for a constant input, limited at ±13 V" });
            ro.innerHTML = readout([["RC", si(R * C, "s", 3)], ["Slope −V<sub>1</sub>/RC", fmt(k, 4) + " V/s"], ["Time to saturate (±13 V)", V1 === 0 ? "never" : si(13 / Math.abs(k), "s", 3)]]);
          }
          host.append(f,
            slider({ id: id + "-v", label: "Input V_1 (constant)", min: -2, max: 2, step: 0.05, value: V1, show: (v) => fmt(v, 3) + " V" }, (v) => { V1 = v; draw(); }).el,
            slider({ id: id + "-r", label: "R", min: 10e3, max: 1e6, log: true, value: R, show: ohm }, (v) => { R = v; draw(); }).el,
            slider({ id: id + "-c", label: "C", min: 0.01e-6, max: 10e-6, log: true, value: C, show: (v) => si(v, "F") }, (v) => { C = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The ramp flattens at about ±13 V: the op-amp can't swing past its supplies.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "R = 470 kΩ, C = 0.22 µF, constant input +0.5 V. Ramp slope?", a: -4.836, unit: "V/s", tol: 0.01, hint: "−V₁/RC. RC = 0.1034 s.", why: "−4.84 V/s: negative, because the integrator inverts." },
        { t: "num", q: "How long until the output reaches −10 V?", a: 2.068, unit: "s", tol: 0.01, hint: "10/4.836.", why: "2.07 s." },
        { t: "num", q: "Summing integrator: input 1 has R₁ = 250 kΩ, C = 2 µF. Its scale factor 1/(R₁C)?", a: 2, tol: 0.01, hint: "1/(250 kΩ × 2 µF).", why: "2: an analog computer would mark that input '2'." },
      ]},
      { k: "learn", title: "The differentiator", b: [
        fig(opFig("dif")),
        `<div class="eq">v<sub>o</sub>(t) = −RC dv<sub>1</sub>/dt</div>`,
        `<p>The output follows how fast the input changes. A ramp in gives a constant out.</p>`,
        { t: "num", q: "R = 10 kΩ, C = 0.1 µF. Input rising at 2 V/ms. Output?", a: -2, unit: "V", tol: 0.01, hint: "RC = 1 ms. Then −RC × slope.", why: "−1 ms × 2 V/ms = −2 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a constant input give a ramp out of an integrator?", model: "The virtual ground makes the input current constant, V_1 over R. That constant current flows into the feedback capacitor, so its voltage changes at a steady rate, I over C. The output is the negative of the capacitor voltage, so it ramps down at V_1 over RC volts per second until the op-amp saturates." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "DC offsets", mins: 25,
    blurb: "0 V in, not quite 0 V out. Two causes, two formulas, add the worst case.",
    takeaway: "Input offset voltage V_IO (spec sheet) gives V_o(offset) = V_IO(R₁ + R_f)/R₁: the noninverting gain. Bias currents I⁺_IB, I⁻_IB differ; with a compensating resistor R_C ≈ R₁ on the + input, only the difference matters: input offset current I_IO = I⁺_IB − I⁻_IB gives V_o(offset) = I_IOR_f. Total: |V_o(offset)| = |due to V_IO| + |due to I_IO| (polarities may differ; magnitudes give the worst case). Input bias current I_IB = (I⁺_IB + I⁻_IB)/2, so I⁺_IB = I_IB + I_IO/2, I⁻_IB = I_IB − I_IO/2.",
    steps: [
      { k: "learn", title: "Two sources of offset", b: [
        fig(opFig("inv", { rc: true })),
        `<p>Ground the input and the output still sits a few millivolts off. The maker can't know your gain, so it specs the <b>input</b> offsets:</p>`,
        `<div class="two"><div class="tile"><h3>V<sub>IO</sub>, input offset voltage</h3><p>Acts like a tiny source at the + input. It sees the noninverting gain:</p><div class="eq">V<sub>o</sub> = V<sub>IO</sub>(R<sub>1</sub> + R<sub>f</sub>)/R<sub>1</sub></div></div><div class="tile"><h3>I<sub>IO</sub>, input offset current</h3><p>The two input bias currents differ. With R<sub>C</sub> ≈ R<sub>1</sub> on the + input, only their difference shows:</p><div class="eq">V<sub>o</sub> = I<sub>IO</sub>R<sub>f</sub></div></div></div>`,
        `<p class="aside">That's what R<sub>C</sub> is for: it makes the equal parts of the two bias currents cancel.</p>`,
      ]},
      { k: "play", title: "Offset lab", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let VIO = 2e-3, IIO = 80e-9, R1 = 4700, Rf = 220e3;
          function draw() {
            const a = VIO * (1 + Rf / R1), b = IIO * Rf;
            ro.innerHTML = readout([["Due to V<sub>IO</sub>: V<sub>IO</sub>(1 + R<sub>f</sub>/R<sub>1</sub>)", si(a, "V", 4)], ["Due to I<sub>IO</sub>: I<sub>IO</sub>R<sub>f</sub>", si(b, "V", 4)], ["Worst-case total", si(a + b, "V", 4)]]);
          }
          host.append(slider({ id: id + "-v", label: "V_IO", min: 0, max: 6e-3, step: 0.1e-3, value: VIO, show: (v) => si(v, "V", 2) }, (v) => { VIO = v; draw(); }).el,
            slider({ id: id + "-i", label: "I_IO", min: 0, max: 200e-9, step: 5e-9, value: IIO, show: (v) => si(v, "A", 2) }, (v) => { IIO = v; draw(); }).el,
            slider({ id: id + "-1", label: "R_1", min: 1e3, max: 100e3, log: true, value: R1, show: ohm }, (v) => { R1 = v; draw(); }).el,
            slider({ id: id + "-f", label: "R_f", min: 10e3, max: 1e6, log: true, value: Rf, show: ohm }, (v) => { Rf = v; draw(); }).el, ro);
          draw();
        },
        `<p>Raise R<sub>f</sub>: both offsets grow. High gain amplifies offsets as well as signals.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>R<sub>1</sub> = 4.7 kΩ, R<sub>f</sub> = 220 kΩ, V<sub>IO</sub> = 2 mV, I<sub>IO</sub> = 80 nA.</p>`,
        { t: "num", q: "Output offset due to V_IO?", a: 95.62, unit: "mV", tol: 0.01, hint: "2 mV × (4.7k + 220k)/4.7k.", why: "2 mV × 47.8 = 95.6 mV." },
        { t: "num", q: "Due to I_IO?", a: 17.6, unit: "mV", tol: 0.01, hint: "I_IOR_f.", why: "80 nA × 220 kΩ = 17.6 mV." },
        { t: "num", q: "Worst-case total?", a: 113.2, unit: "mV", tol: 0.01, hint: "Add the magnitudes.", why: "113 mV." },
      ]},
      { k: "learn", title: "Bias current", b: [
        `<div class="eq">I<sub>IB</sub> = (I⁺<sub>IB</sub> + I⁻<sub>IB</sub>)/2    I⁺<sub>IB</sub> = I<sub>IB</sub> + I<sub>IO</sub>/2    I⁻<sub>IB</sub> = I<sub>IB</sub> − I<sub>IO</sub>/2</div>`,
        { t: "num", q: "I_IB = 120 nA, I_IO = 20 nA, with I⁺ > I⁻. The larger bias current?", a: 130, unit: "nA", tol: 0.01, hint: "I_IB + I_IO/2.", why: "130 nA (and 110 nA at the other input)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the input offset voltage get multiplied by 1 + R_f/R_1, even in an inverting amplifier?", model: "Because the offset acts like a small voltage source in series with the noninverting input. A signal entering there sees the noninverting gain, one plus R_f over R_1, regardless of how the real signal is connected." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  /* Output that tries to follow K sin(2πft) but can't change faster than SR (V/s). Two cycles after one to settle. */
  function slewed(K, f, SR) {
    const N = 3000, T = 1 / f, dt = T / N, out = [];
    let y = 0;
    for (let i = 0; i <= 3 * N; i++) {
      const tgt = K * Math.sin(TAU * f * i * dt), step = SR * dt;
      y += Math.max(-step, Math.min(step, tgt - y));
      if (i >= N && i % 6 === 0) out.push([(i - N) / N, y]);
    }
    return out;
  }
  const p9 = {
    id: "p9", title: "Frequency limits: gain–bandwidth and slew rate", mins: 30,
    blurb: "The gain rolls off with frequency, and the output can only change so fast.",
    takeaway: "Internal compensation keeps the op-amp stable but makes its open-loop gain A_VD roll off at 20 dB/decade from a cutoff f_C. Unity-gain bandwidth B₁ = f₁, where the gain reaches 1: f₁ = A_VD·f_C, the gain–bandwidth product. Feedback lowers the closed-loop gain A_CL, which makes it precise and stable, raises input impedance, lowers output impedance and widens the bandwidth. Slew rate SR = ΔV_o/Δt (V/µs): the fastest the output can change. Max closed-loop gain for an input changing at ΔV_i/Δt: A_CL = SR/(ΔV_i/Δt). For a sine v_o = K sin 2πft, the steepest slope is 2πfK, so f ≤ SR/(2πK) (ω ≤ SR/K). The bandwidth also limits f.",
    steps: [
      { k: "learn", title: "Open-loop roll-off", b: [
        fig(plot({ x: [0, 7], y: [-10, 125], xt: [0, 1, 2, 3, 4, 5, 6, 7], xtf: (v) => si(Math.pow(10, v), "", 2).trim(), yt: [0, 20, 40, 60, 80, 106], xl: "f (Hz, log scale)", yl: "A (dB)", series: [{ f: (x) => 20 * L10(2e5 / Math.sqrt(1 + Math.pow(Math.pow(10, x) / 5, 2))), cls: "s1", n: 400 }], marks: [{ x: L10(5), y: 103 }, { x: 6, y: 0, cls: "mk2" }], texts: [{ x: L10(5) + 0.15, y: 92, s: "f_C" }, { x: 6.05, y: 8, s: "f_1 = B_1" }], label: "Open-loop gain of a typical op-amp falling 20 dB per decade" })),
        `<div class="eq">f<sub>1</sub> = A<sub>VD</sub> f<sub>C</sub>    (unity-gain bandwidth = gain–bandwidth product)</div>`,
        `<p>An open-loop gain of 200 000 with B<sub>1</sub> = 1 MHz means the open-loop band ends at just 5 Hz. Feedback trades that gain for bandwidth.</p>`,
        ch(9, "09-frequency-response.html", "p9", "Part 9", "Same idea as the gain–bandwidth product of a transistor amplifier."),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "B₁ = 3 MHz, A_VD = 150 V/mV. f_C?", a: 20, unit: "Hz", tol: 0.01, hint: "150 V/mV = 150 000. f_C = f₁/A_VD.", why: "20 Hz." },
      ]},
      { k: "play", title: "Slew-rate limit", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let K = 5, fr = 20e3; const SR = 0.5e6;
          function draw() {
            const pts = slewed(K, fr, SR), fmax = SR / (TAU * K);
            f.innerHTML = plot({ x: [0, 2], y: [-11, 11], xt: [0, 1, 2], yt: [-10, -5, 0, 5, 10], xl: "time (cycles)", yl: "v_o (V)", h: 230, series: [{ f: (t) => K * Math.sin(TAU * t), cls: "s5" }, { pts, cls: "s1" }], label: "Wanted sine output (dashed) and the slew-limited actual output" });
            ro.innerHTML = readout([["Steepest slope wanted 2πfK", si(TAU * fr * K / 1e6, "", 3).trim() + " V/µs"], ["Slew rate", "0.5 V/µs"], ["f<sub>max</sub> = SR/(2πK)", si(fmax, "Hz", 3)], ["Result", fr <= fmax ? "clean sine" : "distorted: slew-limited"]]);
          }
          host.append(f,
            slider({ id: id + "-k", label: "Output peak K", min: 0.2, max: 10, step: 0.1, value: K, show: (v) => fmt(v, 2) + " V" }, (v) => { K = v; draw(); }).el,
            slider({ id: id + "-f", label: "Frequency", min: 1e3, max: 300e3, log: true, value: fr, show: (v) => si(v, "Hz", 3) }, (v) => { fr = v; draw(); }).el, ro);
          draw();
        },
        `<div class="eq">SR = ΔV<sub>o</sub>/Δt    sine: 2πfK ≤ SR    f ≤ SR/(2πK)</div>`,
        `<p>Push the frequency up and the sine turns into a triangle: the output is changing as fast as it can. Big outputs hit the limit at lower frequencies.</p>`,
      ]},
      { k: "check", title: "Slew-rate problems", b: [
        { t: "num", q: "SR = 0.8 V/µs. The input changes by 0.2 V in 5 µs. Largest closed-loop gain without slew limiting?", a: 20, tol: 0.01, hint: "A_CL = SR/(ΔV_i/Δt). ΔV_i/Δt = 0.04 V/µs.", why: "0.8/0.04 = 20." },
        { t: "num", q: "SR = 0.8 V/µs, gain 15, input 0.1 V peak. Highest sine frequency?", a: 84.88, unit: "kHz", tol: 0.01, hint: "K = 1.5 V. f = SR/(2πK).", why: "0.8 × 10⁶/(2π × 1.5) = 84.9 kHz." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between the bandwidth limit and the slew-rate limit?", model: "The bandwidth limit is about small signals: the gain falls as frequency rises, with gain times bandwidth fixed. The slew-rate limit is about large signals: the output simply can't change faster than so many volts per microsecond. A big output at a high frequency can be slew-limited even when it's inside the bandwidth, because the steepest slope, two pi f K, grows with the amplitude." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "Reading a 741 spec sheet", mins: 25,
    blurb: "Absolute maximums, typical and worst-case values, and what each number is for.",
    takeaway: "Absolute maximum ratings (typical 741): supply ±22 V, internal dissipation 500 mW, differential input 30 V, input voltage ±15 V. Electrical characteristics at ±15 V (typical / max): V_IO 1 / 6 mV, I_IO 20 / 200 nA, I_IB 80 / 500 nA; V_ICR ±12 to ±13 V; V_OM ±14 V typical (±12 V worst); A_VD 200 V/mV typical (20 V/mV min); r_i 2 MΩ (0.3 MΩ min); r_o 75 Ω; C_i 1.4 pF; CMRR 90 dB (70 min); I_CC 1.7 / 2.8 mA; P_D 50 / 85 mW. B₁ = 1 MHz, t_r = 0.3 µs, SR 0.5 V/µs. Use typical for expected behaviour, worst case for guarantees. P_D ≈ 2V_CCI_CC. Closed-loop output impedance: Z_o = r_o/(1 + βA), β the feedback fraction. Performance curves: A_VD rises with supply voltage; r_i falls and r_o rises with frequency.",
    steps: [
      { k: "learn", title: "The 741's key numbers", b: [
        `<div class="tbl"><table><tr><th>Parameter</th><th>Typical</th><th>Worst case</th></tr><tr><td>V<sub>IO</sub> input offset voltage</td><td>1 mV</td><td>6 mV</td></tr><tr><td>I<sub>IO</sub> input offset current</td><td>20 nA</td><td>200 nA</td></tr><tr><td>I<sub>IB</sub> input bias current</td><td>80 nA</td><td>500 nA</td></tr><tr><td>V<sub>OM</sub> output swing (±15 V supply)</td><td>±14 V</td><td>±12 V</td></tr><tr><td>A<sub>VD</sub> open-loop gain</td><td>200 V/mV</td><td>20 V/mV</td></tr><tr><td>r<sub>i</sub> input resistance</td><td>2 MΩ</td><td>0.3 MΩ</td></tr><tr><td>r<sub>o</sub> output resistance</td><td>75 Ω</td><td></td></tr><tr><td>CMRR</td><td>90 dB</td><td>70 dB</td></tr><tr><td>I<sub>CC</sub> supply current</td><td>1.7 mA</td><td>2.8 mA</td></tr><tr><td>P<sub>D</sub> power dissipation</td><td>50 mW</td><td>85 mW</td></tr><tr><td>B<sub>1</sub> unity-gain bandwidth</td><td>1 MHz</td><td></td></tr><tr><td>Slew rate</td><td>0.5 V/µs</td><td></td></tr></table></div>`,
        `<p><b>Absolute maximum ratings</b> are limits never to exceed: supply ±22 V, dissipation 500 mW, differential input 30 V, input ±15 V.</p>`,
        `<p class="aside">Typical: what you'll usually see. Worst case: what's guaranteed. Design for the worst case when it matters.</p>`,
      ]},
      { k: "check", title: "Power and current", b: [
        { t: "num", q: "An op-amp IC dissipates 400 mW from a ±10 V supply, half from each side. Current from each supply?", a: 20, unit: "mA", tol: 0.01, hint: "200 mW per supply = 10 V × I.", why: "20 mA." },
        { t: "num", q: "A 741 on ±15 V drawing the worst-case I_CC = 2.8 mA. Dissipation?", a: 84, unit: "mW", tol: 0.01, hint: "P_D ≈ 2V_CCI_CC.", why: "84 mW: right at the 85 mW worst-case figure." },
      ]},
      { k: "learn", title: "Feedback improves impedances", b: [
        `<p>With feedback fraction β = R<sub>1</sub>/(R<sub>1</sub> + R<sub>f</sub>), the output impedance drops enormously:</p>`,
        `<div class="eq">Z<sub>o</sub> = r<sub>o</sub>/(1 + βA)</div>`,
        seen("Feedback lowers the output resistance and raises the input resistance.", "15-op-amp.html#p6", "Chapter 15, Part 6"),
        { t: "num", q: "741 (r_o = 75 Ω, A = 200 000) with R₁ = 10 kΩ, R_f = 200 kΩ. Z_o?", a: 0.007874, unit: "Ω", tol: 0.01, hint: "β = 10/210 = 1/21.", why: "75/(1 + 9524) = 0.0079 Ω: practically zero." },
      ]},
      { k: "check", title: "Curves and units", b: [
        `<p>A performance curve shows A<sub>VD</sub> rising with supply voltage, power rising too, and r<sub>i</sub> falling, r<sub>o</sub> rising at higher frequencies.</p>`,
        { t: "num", q: "A curve reads 98 dB of open-loop gain. As a ratio?", a: 79430, tol: 0.01, hint: "10^(98/20).", why: "79 400." },
        { t: "num", q: "Cutoff f_C of a 741 with typical A_VD = 200 V/mV and B₁ = 1 MHz?", a: 5, unit: "Hz", tol: 0.01, hint: "f_C = B₁/A_VD.", why: "5 Hz. (Example 10.18 gets 50 Hz because it uses the 20 V/mV minimum.)" },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "When should you use the typical value from a spec sheet and when the worst case?", model: "Use typical values to predict what a circuit will usually do. Use worst-case values when the circuit has to work with any part off the shelf, for example to guarantee the output offset never exceeds a limit. The worst case can be several times the typical figure." },
      ]},
    ],
  };

  /* =============== PART 11 =============== */
  const p11 = {
    id: "p11", title: "Differential and common-mode, CMRR", mins: 25,
    blurb: "Split any pair of inputs into a difference and an average. Then CMRR tells you how much the average leaks.",
    takeaway: "V_d = V_i1 − V_i2; V_c = (V_i1 + V_i2)/2. Output: V_o = A_dV_d + A_cV_c. Opposite inputs ±V_s: V_d = 2V_s, V_c = 0, V_o = 2A_dV_s. Equal inputs: V_d = 0, V_o = A_cV_s. Measuring: V_i1 = −V_i2 = 0.5 V gives V_o = A_d (numerically); V_i1 = V_i2 = 1 V gives V_o = A_c. CMRR = A_d/A_c, or 20 log(A_d/A_c) dB. V_o = A_dV_d[1 + (1/CMRR)(V_c/V_d)]: large CMRR leaves almost pure A_dV_d.",
    steps: [
      { k: "play", title: "Split the inputs", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let v1 = 220e-6, v2 = 200e-6, cm = 200; const Ad = 5000;
          function draw() {
            const Vd = v1 - v2, Vc = (v1 + v2) / 2, Vo = Ad * Vd + (Ad / cm) * Vc;
            const bar = (y, val, lab, cls) => { const w = Math.min(380, Math.abs(val) * 1e6 * 0.9); return `<rect x="${val < 0 ? 200 - w : 200}" y="${y}" width="${w}" height="20" rx="4" style="fill:var(${cls})"/>` + S.t(10, y + 15, lab, { a: "start", cls: "s" }); };
            f.innerHTML = S.svg(600, 120, `<line class="w" x1="200" y1="10" x2="200" y2="110"/>` + bar(15, Vd, "V_d = " + si(Vd, "V", 3), "--accent") + bar(55, Vc, "V_c = " + si(Vc, "V", 3), "--cool"), { max: 600, label: "Bars for the difference and common parts of the inputs" });
            ro.innerHTML = readout([["A<sub>d</sub>V<sub>d</sub> (wanted)", si(Ad * Vd, "V", 4)], ["A<sub>c</sub>V<sub>c</sub> (leak), A<sub>c</sub> = A<sub>d</sub>/CMRR", si((Ad / cm) * Vc, "V", 4)], ["V<sub>o</sub>", si(Vo, "V", 4)], ["CMRR", fmt(cm, 3) + " = " + fmt(20 * L10(cm), 3) + " dB"]]);
          }
          host.append(f,
            slider({ id: id + "-1", label: "V_i1", min: -300e-6, max: 300e-6, step: 5e-6, value: v1, show: (v) => si(v, "V", 3) }, (v) => { v1 = v; draw(); }).el,
            slider({ id: id + "-2", label: "V_i2", min: -300e-6, max: 300e-6, step: 5e-6, value: v2, show: (v) => si(v, "V", 3) }, (v) => { v2 = v; draw(); }).el,
            slider({ id: id + "-c", label: "CMRR (A_d = 5000)", min: 10, max: 1e6, log: true, value: cm, show: (v) => fmt(v, 3) }, (v) => { cm = v; draw(); }).el, ro);
          draw();
        },
        `<div class="eq">V<sub>d</sub> = V<sub>i1</sub> − V<sub>i2</sub>    V<sub>c</sub> = ½(V<sub>i1</sub> + V<sub>i2</sub>)    V<sub>o</sub> = A<sub>d</sub>V<sub>d</sub> + A<sub>c</sub>V<sub>c</sub></div>`,
        `<p>Two nearly equal inputs have a small difference and a big common part. With a poor CMRR the common part leaks into the output noticeably.</p>`,
      ]},
      { k: "learn", title: "Measuring A_d, A_c and CMRR", b: [
        `<div class="two"><div class="tile"><h3>A<sub>d</sub></h3><p>V<sub>i1</sub> = +0.5 V, V<sub>i2</sub> = −0.5 V: V<sub>d</sub> = 1 V, V<sub>c</sub> = 0. V<sub>o</sub> reads A<sub>d</sub> directly.</p></div><div class="tile"><h3>A<sub>c</sub></h3><p>V<sub>i1</sub> = V<sub>i2</sub> = 1 V: V<sub>d</sub> = 0, V<sub>c</sub> = 1 V. V<sub>o</sub> reads A<sub>c</sub>.</p></div></div>`,
        `<div class="eq">CMRR = A<sub>d</sub>/A<sub>c</sub>    CMRR(dB) = 20 log<sub>10</sub>(A<sub>d</sub>/A<sub>c</sub>)    V<sub>o</sub> = A<sub>d</sub>V<sub>d</sub>[1 + (1/CMRR)(V<sub>c</sub>/V<sub>d</sub>)]</div>`,
        `<p class="aside">Example 10.21 says "Using Eq. (10.28)" for CMRR; it's (10.29). The derivation after it cites "Eq. (12.22)" and "(12.24)", left over from an older edition: read (10.28) and (10.29).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "V_d = 1 mV gives V_o = 6 V; V_c = 1 mV gives V_o = 3 mV. CMRR in dB?", a: 66.02, unit: "dB", tol: 0.005, hint: "A_d = 6000, A_c = 3.", why: "CMRR = 2000 = 66.0 dB." },
        `<p>V<sub>i1</sub> = 220 µV, V<sub>i2</sub> = 200 µV, A<sub>d</sub> = 5000.</p>`,
        { t: "num", q: "V_c?", a: 210, unit: "µV", tol: 0.01, hint: "The average.", why: "210 µV, against V_d = 20 µV." },
        { t: "num", q: "V_o with CMRR = 200?", a: 105.25, unit: "mV", tol: 0.005, hint: "A_dV_d = 100 mV; times [1 + (1/200)(210/20)].", why: "100 × 1.0525 = 105.3 mV: 5% error from the common part." },
        { t: "num", q: "V_o with CMRR = 10⁴?", a: 100.105, unit: "mV", tol: 0.0005, hint: "Same, with 1/10⁴.", why: "100.1 mV." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the common-mode rejection ratio matter most when the two inputs are nearly equal?", model: "Because then the difference signal is small and the common signal is large. The output's common-mode part is the common voltage times A_d over CMRR, so it's compared against A_d times a small difference. If the CMRR isn't large enough, the common part becomes a noticeable error. A big CMRR makes the output almost purely the amplified difference." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edc10", eyebrow: "Boylestad · Chapter 10", title: "Operational Amplifiers",
    intro: `<p>Eleven parts: the differential amplifier inside every op-amp (bias, gains, common-mode rejection), BiFET/BiMOS/CMOS versions, then op-amp basics, the standard circuits, integrators, dc offsets, frequency limits, a real spec sheet, and CMRR.</p><p>It builds on 6.002 Chapter 15. The new parts are what's inside the op-amp and how far a real one is from ideal.</p><p class="aside">The "Computer Analysis" section isn't covered. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's problems in the book. They test whether the ideas stuck, so don't expect them to look like the examples here.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11],
    summary: `
      <h3>Differential amplifier</h3>
      <div class="eq">I<sub>E</sub> = (V<sub>EE</sub> − 0.7 V)/R<sub>E</sub>    I<sub>C</sub> = I<sub>E</sub>/2    V<sub>C</sub> = V<sub>CC</sub> − I<sub>C</sub>R<sub>C</sub></div>
      <div class="eq">A<sub>v</sub> = R<sub>C</sub>/(2r<sub>e</sub>) single-ended    A<sub>d</sub> = R<sub>C</sub>/r<sub>e</sub>    A<sub>c</sub> = βR<sub>C</sub>/[r<sub>i</sub> + 2(β + 1)R<sub>E</sub>]</div>
      <h3>Basic circuits (virtual ground)</h3>
      <div class="eq">Inverting V<sub>o</sub> = −(R<sub>f</sub>/R<sub>1</sub>)V<sub>1</sub>    Noninverting V<sub>o</sub> = (1 + R<sub>f</sub>/R<sub>1</sub>)V<sub>1</sub>    Follower V<sub>o</sub> = V<sub>1</sub></div>
      <div class="eq">Summing V<sub>o</sub> = −Σ(R<sub>f</sub>/R<sub>k</sub>)V<sub>k</sub>    Integrator v<sub>o</sub> = −(1/RC)∫v<sub>1</sub> dt    Differentiator v<sub>o</sub> = −RC dv<sub>1</sub>/dt</div>
      <h3>Offsets</h3>
      <div class="eq">V<sub>o</sub> = V<sub>IO</sub>(R<sub>1</sub> + R<sub>f</sub>)/R<sub>1</sub> + I<sub>IO</sub>R<sub>f</sub> (worst case)    I<sub>IO</sub> = I⁺<sub>IB</sub> − I⁻<sub>IB</sub>    I<sub>IB</sub> = (I⁺<sub>IB</sub> + I⁻<sub>IB</sub>)/2</div>
      <h3>Frequency</h3>
      <div class="eq">f<sub>1</sub> = B<sub>1</sub> = A<sub>VD</sub>f<sub>C</sub>    SR = ΔV<sub>o</sub>/Δt    A<sub>CL</sub> ≤ SR/(ΔV<sub>i</sub>/Δt)    f ≤ SR/(2πK)</div>
      <h3>Common mode</h3>
      <div class="eq">V<sub>d</sub> = V<sub>i1</sub> − V<sub>i2</sub>    V<sub>c</sub> = ½(V<sub>i1</sub> + V<sub>i2</sub>)    V<sub>o</sub> = A<sub>d</sub>V<sub>d</sub> + A<sub>c</sub>V<sub>c</sub>    CMRR = A<sub>d</sub>/A<sub>c</sub> = 20 log(A<sub>d</sub>/A<sub>c</sub>) dB</div>
      <div class="eq">Z<sub>o</sub> = r<sub>o</sub>/(1 + βA)    P<sub>D</sub> ≈ 2V<sub>CC</sub>I<sub>CC</sub></div>`,
  };
  Course.start(window.CHAPTER);
})();
