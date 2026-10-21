(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;

  /* ---------- drawings ---------- */
  // Inverter: V_S, R_L pullup, pulldown device between out (200,110) and ground (200,190). model: fet | on | off | ron
  function invFig(o = {}) {
    const m = o.model || "fet";
    let s = S.supply(200, 40, "V_S") + S.res(200, 40, 200, 110, o.RL || "R_L", { side: "right" }) + S.wire([200, 110], [290, 110]) + S.dot(200, 110) + S.t(296, 115, o.out || "v_OUT", { a: "start", cls: "a" }) + S.gnd(200, 190);
    if (m === "fet") s += S.nmos(186, 150) + S.wire([70, 150], [156, 150]);
    else {
      s += `<line class="w dim" x1="70" y1="150" x2="${m === "ron" ? 192 : 192}" y2="150" style="stroke-dasharray:4 4"/>`;
      if (m === "ron") s += S.sw(200, 110, 150, true) + S.res(200, 150, 200, 190, o.RON || "R_ON", { side: "right" });
      else s += S.sw(200, 110, 190, m === "on", { label: m === "on" ? "ON" : "OFF", tcls: "a" });
    }
    s += S.t(64, 155, o.in || "v_IN", { a: "end" });
    return S.svg(360, 220, s + (o.extra || ""), { max: 360, label: o.label || "Inverter: pull-up resistor from V_S to the output, MOSFET from the output to ground" });
  }
  // NAND (series pulldown) or NOR (parallel pulldown), switch-model view with live states
  function gate2Fig(kind, A, B) {
    let s = S.supply(200, 40, "V_S") + S.res(200, 40, 200, 110, "R_L", { side: "left" }) + S.dot(200, 110);
    let out;
    if (kind === "nand") {
      s += S.sw(200, 110, 190, A, { label: "A=" + A, tcls: A ? "a" : "" }) + S.sw(200, 190, 270, B, { label: "B=" + B, tcls: B ? "a" : "" }) + S.gnd(200, 270);
      out = A && B ? 0 : 1;
      s += S.wire([200, 110], [300, 110]);
    } else {
      s += S.wire([200, 110], [290, 110]) + S.sw(200, 110, 190, A, { label: "A=" + A, side: "left", tcls: A ? "a" : "" }) + S.sw(290, 110, 190, B, { label: "B=" + B, tcls: B ? "a" : "" }) + S.gnd(200, 190) + S.gnd(290, 190) + S.wire([290, 110], [340, 110]);
      out = A || B ? 0 : 1;
    }
    s += S.t(kind === "nand" ? 306 : 346, 115, "out = " + out, { a: "start", cls: "big " + (out ? "a" : "") });
    return { svg: S.svg(440, kind === "nand" ? 300 : 220, s, { max: 440, label: kind === "nand" ? "NAND: two switches in series pulling the output down" : "NOR: two switches in parallel pulling the output down" }), out };
  }
  // Transfer-curve plot with optional discipline lines
  function vtc(f, d, extra = {}) {
    const series = [{ f, cls: "s1", n: 500 }];
    if (d) series.push({ pts: [[d.VIL, 0], [d.VIL, 5]], cls: "s5" }, { pts: [[d.VIH, 0], [d.VIH, 5]], cls: "s5" }, { pts: [[0, d.VOL], [5, d.VOL]], cls: "s4" }, { pts: [[0, d.VOH], [5, d.VOH]], cls: "s4" });
    return plot(Object.assign({ x: [0, 5], y: [0, 5.2], xt: [0, 1, 2, 3, 4, 5], yt: [0, 1, 2, 3, 4, 5], xl: "v_IN (V)", yl: "v_OUT (V)", series, label: "Inverter transfer curve" }, extra));
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "The switch", mins: 15,
    blurb: "A three-terminal element: control decides short or open.",
    takeaway: "A switch has a control terminal. Control = 1: the input–output pair is a short (v = 0). Control = 0: it's an open (i = 0). Analyze a switch circuit as two linear circuits, one per state.",
    steps: [
      { k: "learn", title: "Three terminals", b: [
        `<div class="two"><div class="tile">${S.svg(160, 150, S.sw(80, 10, 140, true, { label: "ON", tcls: "a" }), { max: 160, label: "Closed switch" })}<p>Control = 1 → <b>short</b>: v = 0, any current.</p></div><div class="tile">${S.svg(160, 150, S.sw(80, 10, 140, false, { label: "OFF", tcls: "a" }), { max: 160, label: "Open switch" })}<p>Control = 0 → <b>open</b>: i = 0, any voltage.</p></div></div>`,
        `<p>Our first <b>three-terminal</b> element: input, output and a <b>control</b>. Treat it as two <b>ports</b>: the control port, and the input–output port.</p>`,
      ]},
      { k: "predict", title: "Its v–i graph", b: [
        { t: "mcq", q: "On a v–i graph of the input–output pair, what does the switch look like?", opts: [
          ["Two lines: the i axis (v = 0) when ON, and the v axis (i = 0) when OFF. Which one applies depends on the control", true, "Like a resistor whose resistance jumps between 0 and ∞. One graph per control value."],
          ["A single straight line through the origin", false, "That's one fixed resistor. A switch has two different behaviors."],
          ["An exponential, like a diode", false, "The ideal switch is just short or open."],
        ]},
      ]},
      { k: "check", title: "One circuit, two answers", b: [
        fig(S.svg(420, 190, S.wire([60, 82], [60, 30], [300, 30]) + S.wire([60, 118], [60, 170], [300, 170]) + S.isrc(60, 100, "6 mA") + S.res(170, 30, 170, 170, "R₁ = 2 kΩ", { side: "right" }) + S.wire([300, 30], [300, 50]) + S.sw(300, 50, 100, true) + S.res(300, 100, 300, 170, "R₂ = 4 kΩ", { side: "right" }) + S.dot(170, 30) + S.dot(170, 170), { max: 420, label: "6 mA source feeding R1 in parallel with a switch in series with R2" })),
        `<p>The switch is the only nonlinear part, so solve twice: once with a wire, once with a gap.</p>`,
        { t: "num", q: "Switch ON: current through R₁?", a: 4, unit: "mA", hint: "Current divider: R₁ gets I × R₂/(R₁ + R₂).", why: "6 × 4/6 = 4 mA." },
        { t: "num", q: "Switch OFF: current through R₁?", a: 6, unit: "mA", hint: "The R₂ branch is broken.", why: "All 6 mA has nowhere else to go." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can you use linear tools on a circuit with a switch in it?", model: "In each state the switch is just a wire or a gap, both linear. So I split the problem into two linear circuits, one for ON and one for OFF, solve each with the usual tools, and use whichever matches the control signal." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Logic with switches", mins: 15,
    blurb: "Series = AND, parallel = OR.",
    takeaway: "Switches in series conduct only if all are on: AND. Switches in parallel conduct if any is on: OR. Mechanical switches can't drive each other, so we need a switch controlled by a voltage: the MOSFET.",
    steps: [
      { k: "play", title: "Light the bulb", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`);
          let mode = 0; const st = [1, 0];
          function draw() {
            const lit = mode === 0 ? st[0] && st[1] : st[0] || st[1];
            let s = S.wire([50, 92], [50, 30], [90, 30]) + S.wire([50, 128], [50, 190], [300, 190], [300, 132]) + S.vsrc(50, 110, "V", { side: "right" }) + S.bulb(300, 110, lit ? 0.85 : 0) + S.wire([300, 30], [300, 88]);
            if (mode === 0) s += S.wire([90, 30], [100, 30]) + `<g transform="rotate(-90 140 30)">${S.sw(140, -10, 70, !!st[0])}</g>` + `<g transform="rotate(-90 240 30)">${S.sw(240, -10, 70, !!st[1])}</g>` + S.wire([180, 30], [200, 30]) + S.wire([280, 30], [300, 30]) + S.t(140, 64, "A", { cls: "big" }) + S.t(240, 64, "B", { cls: "big" });
            else s += S.wire([90, 30], [120, 30], [120, 10], [140, 10]) + S.wire([120, 30], [120, 62], [140, 62]) + `<g transform="rotate(-90 180 10)">${S.sw(180, -30, 50, !!st[0])}</g>` + `<g transform="rotate(-90 180 62)">${S.sw(180, 22, 102, !!st[1])}</g>` + S.wire([220, 10], [240, 10], [240, 62], [220, 62]) + S.wire([240, 30], [300, 30]) + S.t(180, 0, "A", { cls: "s" }) + S.t(180, 92, "B", { cls: "s" });
            f.innerHTML = S.svg(360, 235, `<g transform="translate(0,20)">${s}</g>`, { max: 360, label: "Bulb with switches A and B" });
          }
          const row = el(`<div class="row bits"></div>`);
          ["A", "B"].forEach((n, k) => { const b = el(`<button type="button" class="btn small" aria-pressed="${!!st[k]}">${n}</button>`); b.addEventListener("click", () => { st[k] ^= 1; b.setAttribute("aria-pressed", String(!!st[k])); draw(); }); row.appendChild(b); });
          host.append(toggle(["Series", "Parallel"], (k) => { mode = k; draw(); }), row, f);
          draw();
        },
        `<p class="aside">Tap A and B to close and open them.</p>`,
      ]},
      { k: "check", title: "Steer the current", b: [
        { t: "mcq", q: "Which switch arrangement lights a bulb for the function (A + B)·C?", opts: [
          ["A and B in parallel, and that pair in series with C", true, "Parallel makes the OR, series with C adds the AND."],
          ["A, B and C all in series", false, "That's A·B·C."],
          ["A in series with B, that pair in parallel with C", false, "That's A·B + C."],
        ]},
      ]},
      { k: "why", title: "The catch with mechanical switches", b: [
        { t: "mcq", q: "Why can't you build a big computer from push-button switches?", opts: [
          ["Each switch needs a finger (mechanical force). The output of one switch is a voltage, which can't press the next switch", true, "We need a switch whose control is a voltage, so one switch's output can drive the next. The MOSFET is that switch, and it's cheap to make by the billion."],
          ["They're too slow to turn on", false, "Speed matters too, but the deeper problem is that they can't drive each other at all."],
          ["They leak current", false, "Ideal mechanical switches don't leak."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a series connection of switches give AND?", model: "Current has only one path, and it passes through every switch. If any one switch is open, the path is broken. So the circuit conducts only when all the switches are closed: AND." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "The MOSFET and its S model", mins: 20,
    blurb: "A switch controlled by a voltage.",
    takeaway: "MOSFET terminals: gate G (control), drain D, source S. S model: v_GS ≥ V_T → D–S short; v_GS < V_T → D–S open. The gate draws no current (i_G = 0).",
    steps: [
      { k: "learn", title: "Meet the MOSFET", b: [
        fig(S.svg(300, 170, S.nmos(140, 85, { labels: true }) + S.t(70, 80, "gate", { a: "end", cls: "s m" }) + S.t(170, 30, "drain", { a: "start", cls: "s m" }) + S.t(170, 150, "source", { a: "start", cls: "s m" }) + S.t(230, 92, "v_DS", { cls: "a" }) + S.t(96, 120, "v_GS", { cls: "a" }), { max: 300, label: "n-channel MOSFET symbol with gate, drain and source" })),
        `<div class="tbl"><table><tbody>
          <tr><td><b>G</b> gate</td><td>control terminal</td></tr>
          <tr><td><b>D</b> drain</td><td>the channel end at higher voltage</td></tr>
          <tr><td><b>S</b> source</td><td>the other channel end. Current i<sub>DS</sub> flows D → S.</td></tr></tbody></table></div>`,
        `<p>MOSFET = Metal Oxide Semiconductor Field-Effect Transistor. This chapter uses the <b>n-channel</b> kind.</p>`,
      ]},
      { k: "play", title: "The S model", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let v = 0.5;
          function draw() {
            const on = v >= 1;
            f.innerHTML = S.svg(380, 170, S.nmos(110, 85, { labels: true }) + S.t(150, 96, "→", { cls: "big", a: "start" }) + S.sw(280, 20, 150, on, { label: on ? "ON: short" : "OFF: open", tcls: "a" }) + `<line class="w dim" x1="200" y1="85" x2="276" y2="85" style="stroke-dasharray:4 4"/>` + S.t(200, 76, "v_GS = " + fmt(v) + " V", { a: "start", cls: "s" }), { max: 380, label: "MOSFET and its switch model" });
            ro.innerHTML = readout([["v_GS", fmt(v) + " V"], ["V_T", "1 V"], ["drain–source", on ? "short (v_DS = 0)" : "open (i_DS = 0)"], ["gate current", "0"]]);
          }
          host.append(f, slider({ id: id + "-v", label: "Gate-to-source voltage v_GS", min: 0, max: 5, step: 0.1, value: v, show: (x) => fmt(x) + " V" }, (x) => { v = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">This book mostly uses V<sub>T</sub> = 1 V to keep numbers simple. Real n-channel devices are often around 0.7 V.</p>`,
      ]},
      { k: "learn", title: "As two ports", b: [
        `<div class="two"><div class="tile"><h3>Input (control) port</h3><p>G–S. An open circuit: i<sub>G</sub> = 0, always.</p></div><div class="tile"><h3>Output port</h3><p>D–S. Short if v<sub>GS</sub> ≥ V<sub>T</sub>, open if not.</p></div></div>`,
        `<div class="eq">v<sub>GS</sub> < V<sub>T</sub>: i<sub>DS</sub> = 0   v<sub>GS</sub> ≥ V<sub>T</sub>: v<sub>DS</sub> = 0</div>`,
      ]},
      { k: "why", title: "Why the gate matters so much", b: [
        { t: "mcq", q: "i_G = 0 always. Why is that so useful for building big digital systems?", opts: [
          ["A gate input draws no current, so connecting it to another gate's output doesn't disturb that output. You can connect gates freely (composability)", true, "Imagine the gate looked like 0 Ω: it would short out whatever drives it. With i_G = 0, outputs keep their valid levels no matter how they're connected."],
          ["It saves the battery", false, "Static power is a separate topic (Part 8). The key point is that gates don't load each other."],
          ["It makes the MOSFET faster", false, "Speed comes later (capacitance, Chapter 10)."],
        ]},
        `<p>Also: what happens at D and S never affects G. Output can't disturb input. Together these make gates <b>composable</b>.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe the S model in one breath.", model: "The gate draws no current. If the gate-to-source voltage is at least the threshold, the drain and source are shorted together; otherwise they're an open circuit." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Building gates from MOSFETs", mins: 25,
    blurb: "A pull-up resistor plus a pull-down network of switches.",
    takeaway: "Inverter = resistor from V_S to the output plus a MOSFET from the output to ground. Pull-down switches in series → NAND, in parallel → NOR. Any series/parallel network gives the inverse of that switch function.",
    steps: [
      { k: "learn", title: "The inverter", b: [
        fig(invFig()),
        `<p>The MOSFET's source is grounded, so v<sub>GS</sub> = v<sub>IN</sub>. R<sub>L</sub> (the <b>pull-up</b>) ties the output toward V<sub>S</sub>. The MOSFET (the <b>pull-down</b>) can yank it to ground.</p>`,
      ]},
      { k: "play", title: "Flip the input", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let v = 0;
          function draw() {
            const on = v >= 1, out = on ? 0 : 5;
            f.innerHTML = invFig({ model: on ? "on" : "off", in: "v_IN = " + fmt(v), out: "v_OUT = " + out + " V" });
            ro.innerHTML = readout([["MOSFET", on ? "ON" : "OFF"], ["v_OUT", out + " V"], ["logic", (on ? "1 → 0" : "0 → 1")]]);
          }
          host.append(f, slider({ id: id + "-v", label: "v_IN", min: 0, max: 5, step: 0.25, value: v, show: (x) => fmt(x) + " V" }, (x) => { v = x; draw(); }).el, ro);
          draw();
        },
        { t: "mcq", q: "When the MOSFET is OFF, why is the output 5 V, not 'floating'?", opts: [
          ["No current flows through R_L (the gate of the next stage draws none), so R_L drops 0 V and the output equals V_S", true, "That's the pull-up's job. With zero current, a resistor is just a wire as far as voltage goes."],
          ["Because the MOSFET outputs 5 V", false, "An OFF MOSFET is an open. It doesn't supply anything."],
          ["It is floating", false, "R_L ties it firmly to V_S."],
        ]},
      ]},
      { k: "learn", title: "Its transfer curve (S model)", b: [
        fig(vtc((x) => (x < 1 ? 5 : 0))),
        `<p>Below V<sub>T</sub> = 1 V the output is 5 V. Above it, 0 V. A perfect cliff.</p>`,
      ]},
      { k: "play", title: "NAND and NOR", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`);
          let kind = "nand"; const st = [1, 1];
          function draw() { f.innerHTML = gate2Fig(kind, st[0], st[1]).svg; }
          const row = el(`<div class="row bits"></div>`);
          ["A", "B"].forEach((n, k) => { const b = el(`<button type="button" class="btn small" aria-pressed="${!!st[k]}">${n}</button>`); b.addEventListener("click", () => { st[k] ^= 1; b.setAttribute("aria-pressed", String(!!st[k])); draw(); }); row.appendChild(b); });
          host.append(toggle(["Series pull-down", "Parallel pull-down"], (k) => { kind = k ? "nor" : "nand"; draw(); }), row, f);
          draw();
        },
        `<p class="aside">Switches drawn in their S-model state (each is a MOSFET). Series: the output is pulled low only if A <b>and</b> B are on → NOT(A·B) = NAND. Parallel: low if A <b>or</b> B → NOR.</p>`,
      ]},
      { k: "check", title: "Compound gates", b: [
        `<p>Pull-down network: MOSFETs A and B in series, and that pair in parallel with MOSFET C.</p>`,
        { t: "mcq", q: "What does the output compute?", opts: [
          ["NOT(A·B + C)", true, "The pull-down conducts for A·B + C, and conducting means output 0. So out = NOT(A·B + C). One gate instead of three."],
          ["A·B + C", false, "The pull-down network pulls the output LOW, so the function comes out inverted."],
          ["NOT(A + B)·C", false, "Series means AND here (A·B), not OR."],
        ]},
        { t: "mcq", q: "Which pull-down network gives out = NOT((A + B)·C)?", opts: [["A ∥ B, in series with C", true, "Parallel for the OR, series for the AND."], ["A, B, C all in parallel", false, "That's NOT(A + B + C)."], ["A in series with B, all parallel with C", false, "That's NOT(A·B + C)."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a MOSFET gate always come out 'inverting' (NAND, NOR, NOT)?", model: "The MOSFETs sit between the output and ground, so when their network conducts it pulls the output to 0. The output is 1 exactly when the network does NOT conduct. So the output is the complement of the switch function." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Checking a static discipline (S model)", mins: 20,
    blurb: "Read the four thresholds straight off the transfer curve.",
    takeaway: "Overlay V_IL, V_IH, V_OL, V_OH on the transfer curve. Inputs below V_IL must give outputs above V_OH, and inputs above V_IH must give outputs below V_OL.",
    steps: [
      { k: "learn", title: "The test", b: [
        `<div class="tbl"><table><tbody>
          <tr><td>V<sub>OH</sub></td><td>Is the gate's high output ≥ V<sub>OH</sub>?</td></tr>
          <tr><td>V<sub>OL</sub></td><td>Is its low output ≤ V<sub>OL</sub>?</td></tr>
          <tr><td>V<sub>IL</sub></td><td>Does every input below V<sub>IL</sub> give a valid high (inverter)?</td></tr>
          <tr><td>V<sub>IH</sub></td><td>Does every input above V<sub>IH</sub> give a valid low?</td></tr></tbody></table></div>`,
        `<p>The S-model inverter: outputs exactly 5 V or 0 V, and switches at V<sub>T</sub> = 1 V.</p>`,
      ]},
      { k: "play", title: "Try disciplines", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const d = { VIL: 0.8, VIH: 3.5, VOL: 0.6, VOH: 4.2 };
          function draw() {
            f.innerHTML = vtc((x) => (x < 1 ? 5 : 0), d);
            const ok = { VOH: 5 >= d.VOH, VOL: 0 <= d.VOL, VIL: d.VIL < 1, VIH: d.VIH >= 1 };
            ro.innerHTML = readout(Object.entries(ok).map(([k, v]) => [k.replace("V", "V_"), v ? "✓" : "✗ fails"])) + `<span class="verdict ${Object.values(ok).every(Boolean) ? "ok" : "no"}">${Object.values(ok).every(Boolean) ? "The inverter meets this discipline" : "It doesn't meet this discipline"}</span>`;
          }
          const box = el(`<div class="sliders"></div>`);
          [["VIL", "V_IL", 0.2, 2.5], ["VIH", "V_IH", 0.5, 4.8], ["VOL", "V_OL", 0.1, 2], ["VOH", "V_OH", 3, 5]].forEach(([k, lab, a, b]) => box.appendChild(slider({ id: id + k, label: lab, min: a, max: b, step: 0.1, value: d[k], show: (x) => fmt(x) + " V" }, (x) => { d[k] = x; draw(); }).el));
          host.append(f, box, ro);
          draw();
        },
        `<p class="aside">Dashed grey = input thresholds, dashed red = output thresholds.</p>`,
      ]},
      { k: "check", title: "Which one breaks it?", b: [
        { t: "mcq", q: "A discipline has V_OH = 4 V, V_OL = 1 V, V_IH = 3 V, V_IL = 1.2 V. Does the S-model inverter (V_T = 1 V) meet it?", opts: [
          ["No: inputs between 1 V and 1.2 V are valid 0s, but the inverter treats them as 1s", true, "Every input below V_IL must produce a high output. This inverter flips at 1 V, so V_IL can be at most just under 1 V."],
          ["Yes, its outputs are 0 V and 5 V", false, "The outputs are fine. The input side fails."],
          ["No: 5 V is above V_OH", false, "Being above V_OH is what's required."],
        ]},
        { t: "num", q: "What is the largest V_IL this inverter can satisfy?", a: 1, tol: 0.05, unit: "V", hint: "Below which input voltage is the output guaranteed high?", why: "Just under V_T = 1 V (the book writes 1⁻ V)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a NAND built with the S model have the same thresholds as the inverter?", model: "Each MOSFET still switches at exactly V_T and the outputs are still exactly 0 V or V_S, because ideal switches drop no voltage. Series or parallel doesn't change those levels, so the same thresholds come out." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "The SR model and the real device", mins: 20,
    blurb: "An ON MOSFET is a resistor, R_ON = R_n·L/W.",
    takeaway: "A real ON MOSFET has resistance R_ON, set by its shape: R_ON = R_n·L/W (like a resistor's R□·L/W). The SR model is valid for small v_DS with one fixed high gate voltage.",
    steps: [
      { k: "learn", title: "Switch + resistor", b: [
        fig(invFig({ model: "ron", in: "v_IN high" })),
        `<div class="eq">v<sub>GS</sub> ≥ V<sub>T</sub>: i<sub>DS</sub> = v<sub>DS</sub>/R<sub>ON</sub>   v<sub>GS</sub> < V<sub>T</sub>: i<sub>DS</sub> = 0</div>`,
        `<p>Real switches always have some resistance when on. The SR model adds it. Caveat: really R<sub>ON</sub> changes with v<sub>GS</sub>, and for large v<sub>DS</sub> the MOSFET stops acting like a resistor at all (Chapter 7). In digital circuits the gate is either low or one fixed high value, so one R<sub>ON</sub> is good enough.</p>`,
      ]},
      { k: "learn", title: "Inside the chip", b: [
        fig(S.svg(440, 180, `<rect x="20" y="110" width="400" height="60" style="fill:var(--accent-soft);stroke:var(--line)"/>` + S.t(220, 160, "p-type substrate", { cls: "s a" }) +
          `<rect x="60" y="100" width="90" height="30" rx="6" style="fill:var(--cool-soft);stroke:var(--cool)"/><rect x="290" y="100" width="90" height="30" rx="6" style="fill:var(--cool-soft);stroke:var(--cool)"/>` + S.t(105, 120, "n⁺ source", { cls: "s c" }) + S.t(335, 120, "n⁺ drain", { cls: "s c" }) +
          `<rect x="150" y="88" width="140" height="10" style="fill:var(--line)"/><rect x="150" y="62" width="140" height="26" style="fill:var(--muted);opacity:.6"/>` + S.t(220, 80, "gate", { cls: "s" }) + S.t(300, 93, "oxide", { a: "start", cls: "s m" }) +
          (`<line x1="150" y1="104" x2="290" y2="104" style="stroke:var(--cool);stroke-width:5;stroke-dasharray:6 4"/>`) + S.t(220, 52, "← L →", { cls: "s" }) + S.t(220, 140, "channel forms here when v_GS > V_T", { cls: "s m" }), { max: 440, label: "Cross-section of an n-channel MOSFET" })),
        `<p>A positive gate voltage pulls electrons up to the surface under the thin oxide. Past V<sub>T</sub> they form an n-type <b>channel</b> joining source and drain: the switch closes. No current crosses the oxide, so i<sub>G</sub> = 0.</p>`,
      ]},
      { k: "play", title: "Shape sets R_ON", b: [
        `<p>The channel is a thin resistive sheet of length L and width W: R<sub>ON</sub> = R<sub>n</sub>·L/W, where R<sub>n</sub> is the ON resistance per square (Chapter 1's R□ idea).</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let L = 0.2, W = 1;
          function draw() {
            const R = 5000 * L / W, sq = W / L;
            const l = 300 * L, w = Math.min(110, 14 * W);
            f.innerHTML = S.svg(420, 140, `<rect x="${210 - l / 2}" y="${60 - w / 2}" width="${l}" height="${w}" style="fill:var(--cool-soft);stroke:var(--cool)"/>` + S.t(210 - l / 2 - 6, 64, "S", { a: "end", cls: "s m" }) + S.t(210 + l / 2 + 6, 64, "D", { a: "start", cls: "s m" }) + S.t(210, 130, "top view: channel " + fmt(L) + " µm long × " + fmt(W) + " µm wide", { cls: "s m" }), { max: 420, label: "Channel shape" });
            ro.innerHTML = readout([["L/W", fmt(L / W)], ["squares in series", fmt(1 / sq)], ["R_ON (R_n = 5 kΩ)", si(R, "Ω")]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(slider({ id: id + "-l", label: "Length L", min: 0.1, max: 1, step: 0.05, value: L, show: (x) => fmt(x) + " µm" }, (x) => { L = x; draw(); }).el,
            slider({ id: id + "-w", label: "Width W", min: 0.2, max: 8, step: 0.1, value: W, show: (x) => fmt(x) + " µm" }, (x) => { W = x; draw(); }).el);
          host.append(f, box, ro);
          draw();
        },
      ]},
      { k: "check", title: "Sizing", b: [
        { t: "num", q: "R_n = 5 kΩ, L = 0.2 µm, W = 1 µm. R_ON = ?", a: 1, unit: "kΩ", hint: "L/W = 0.2.", why: "5 kΩ × 0.2 = 1 kΩ." },
        { t: "mcq", q: "You need half that R_ON without changing L. What do you do?", opts: [["Double W", true, "Twice as wide = two channels in parallel = half the resistance. The cost: more chip area (and, later, more capacitance)."], ["Double L", false, "Longer channel = more resistance."], ["Raise V_T", false, "V_T isn't part of the SR model's R_ON."]] },
        `<p class="aside">Chip makers keep shrinking the minimum L (from 8 µm in 1981 to well under 0.2 µm by 2002 in the authors' projects). Smaller means more logic per chip and faster circuits.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a wider MOSFET have a lower on-resistance?", model: "The channel acts like a resistive sheet. Making it wider is like putting more strips of the same length side by side in parallel, so more current can flow for the same voltage. That's why R_ON goes as L/W." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Designing gates with the SR model", mins: 25,
    blurb: "R_ON lifts the low output. Size things so it stays low enough.",
    takeaway: "With R_ON, the inverter's low output is a divider: V_OL = V_S·R_ON/(R_ON + R_L). It must be below V_T to switch the next gate off, and below the discipline's V_OL. Fix it with a bigger R_L or a wider MOSFET. Series stacks (NAND) need even more.",
    steps: [
      { k: "learn", title: "The low output isn't 0 any more", b: [
        fig(invFig({ model: "ron" })),
        `<div class="eq">v<sub>OUT,low</sub> = V<sub>S</sub> · R<sub>ON</sub>/(R<sub>ON</sub> + R<sub>L</sub>)</div>`,
        { t: "num", q: "V_S = 5 V, R_ON = 2 kΩ, R_L = 18 kΩ. Low output = ?", a: 0.5, unit: "V", why: "5 × 2/20 = 0.5 V." },
      ]},
      { k: "why", title: "The first requirement", b: [
        { t: "mcq", q: "This inverter's low output (0.5 V) drives another inverter with V_T = 1 V. What must be true for that to work at all?", opts: [
          ["The low output must be below V_T, so the next MOSFET actually turns OFF", true, "If the 'low' were above V_T, the next stage would read it as a 1. Condition: V_S·R_ON/(R_ON + R_L) < V_T."],
          ["The low output must be exactly 0 V", false, "Below V_T is enough to turn the next one off."],
          ["R_L must equal R_ON", false, "That gives V_S/2 = 2.5 V, far too high."],
        ]},
      ]},
      { k: "check", title: "Size the MOSFET", b: [
        `<p>V<sub>S</sub> = 5 V, V<sub>T</sub> = 1 V, R<sub>L</sub> = 12 kΩ, R<sub>n</sub> = 4 kΩ. The condition V<sub>S</sub>R<sub>ON</sub>/(R<sub>ON</sub> + R<sub>L</sub>) < V<sub>T</sub> rearranges to:</p>`,
        `<div class="eq">W/L > R<sub>n</sub>(V<sub>S</sub> − V<sub>T</sub>)/(V<sub>T</sub>·R<sub>L</sub>)</div>`,
        { t: "num", q: "Minimum W/L?", a: 1.333, tol: 0.02, hint: "4k × 4 V / (1 V × 12k).", why: "16/12 ≈ 1.33. Any W/L above that works." },
      ]},
      { k: "play", title: "Design an inverter", b: [
        `<p>Target discipline: V<sub>OL</sub> = 0.4 V, V<sub>OH</sub> = 4.5 V, V<sub>IL</sub> = 0.9 V, V<sub>IH</sub> = 4 V. Adjust R<sub>L</sub> and R<sub>ON</sub> until it passes.</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let RL = 18, RON = 2;
          const d = { VIL: 0.9, VIH: 4, VOL: 0.4, VOH: 4.5 };
          function draw() {
            const lo = (5 * RON) / (RON + RL);
            f.innerHTML = vtc((x) => (x < 1 ? 5 : lo), d);
            const ok = lo <= d.VOL;
            ro.innerHTML = readout([["low output", fmt(lo) + " V"], ["below V_T?", lo < 1 ? "yes" : "no"], ["≤ V_OL = 0.4?", ok ? "yes" : "no"]]) + `<span class="verdict ${ok ? "ok" : "no"}">${ok ? "Passes the discipline" : "Low output too high"}</span>`;
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(slider({ id: id + "-rl", label: "R_L", min: 2, max: 40, step: 1, value: RL, show: (x) => fmt(x) + " kΩ" }, (x) => { RL = x; draw(); }).el,
            slider({ id: id + "-ron", label: "R_ON", min: 0.2, max: 5, step: 0.1, value: RON, show: (x) => fmt(x) + " kΩ" }, (x) => { RON = x; draw(); }).el);
          host.append(f, box, ro);
          draw();
        },
        { t: "num", q: "Keeping R_ON = 2 kΩ, what's the smallest R_L that passes? (V_S·R_ON/(R_ON + R_L) ≤ 0.4)", a: 23, unit: "kΩ", hint: "R_L ≥ V_S·R_ON/0.4 − R_ON.", why: "5 × 2/0.4 − 2 = 25 − 2 = 23 kΩ. Big resistors take up lots of chip area, which is why real chips replace R_L with another transistor (active pull-ups)." },
      ]},
      { k: "check", title: "NAND: two in series", b: [
        fig(S.svg(300, 230, S.supply(150, 40, "V_S") + S.res(150, 40, 150, 100, "R_L", { side: "right" }) + S.dot(150, 100) + S.wire([150, 100], [230, 100]) + S.res(150, 100, 150, 150, "R_ON", { side: "right" }) + S.res(150, 150, 150, 200, "R_ON", { side: "right" }) + S.gnd(150, 200) + S.t(236, 105, "out", { a: "start", cls: "a" }), { max: 300, label: "NAND with both inputs high: R_L over two R_ON in series" })),
        { t: "num", q: "Both inputs high, R_ON = 2 kΩ each, R_L = 18 kΩ, V_S = 5 V. Low output?", a: 0.909, tol: 0.02, unit: "V", hint: "Pull-down is now 2R_ON = 4 kΩ.", why: "5 × 4/22 ≈ 0.91 V. Barely under V_T = 1 V, and it fails a 0.5 V V_OL. Stacking switches in series raises the low output." },
        { t: "mcq", q: "To keep a 3-input NAND as good as the inverter, what must change?", opts: [["Make each MOSFET about 3× wider (or R_L bigger)", true, "Three R_ON in series must total what one did. More switches in series → each must be bigger."], ["Nothing", false, "3R_ON in series lifts the low output even more."], ["Make the MOSFETs narrower", false, "That raises R_ON."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does R_ON force a trade-off in inverter design?", model: "The low output is a divider between R_ON and R_L. To make it small I need R_L much bigger than R_ON. Big R_L costs area, and a small R_ON needs a wide MOSFET, which also costs area. The discipline's V_OL sets how far I must push." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Gain, nonlinearity and power", mins: 25,
    blurb: "Why logic needs amplifiers, and what a gate burns.",
    takeaway: "Noise margins force gain > 1 through the forbidden region and gain < 1 in the valid regions, so logic gates must be nonlinear. A resistor-pullup gate burns V_S²/(R_L + R_pd) whenever its pull-down conducts.",
    steps: [
      { k: "learn", title: "Restoring a signal", b: [
        `<p>A buffer obeys V<sub>IL</sub> = 2 V, V<sub>IH</sub> = 3 V, V<sub>OL</sub> = 1 V, V<sub>OH</sub> = 4 V. A sender's 0 arrives as 1.6 V after noise. The buffer must output ≤ 1 V. It <b>cleans up</b> the signal, so noise doesn't build up from stage to stage.</p>`,
        `<div class="eq">Gain needed = (V<sub>OH</sub> − V<sub>OL</sub>)/(V<sub>IH</sub> − V<sub>IL</sub>) > 1</div>`,
        { t: "num", q: "Gain needed for this buffer's 2 V → 3 V input step?", a: 3, why: "(4 − 1)/(3 − 2) = 3. A 1 V input change must become a 3 V output change." },
      ]},
      { k: "play", title: "How steep must the curve be?", b: [
        `<p>A buffer curve v<sub>O</sub> = 2.5 + 2.5·tanh(k(v<sub>I</sub> − 2.5)). Find the smallest steepness k that keeps it out of the forbidden corners.</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let k = 0.8;
          const d = { VIL: 2, VIH: 3, VOL: 1, VOH: 4 };
          function draw() {
            const g = (x) => 2.5 + 2.5 * Math.tanh(k * (x - 2.5)), ok = g(2) <= 1 && g(3) >= 4;
            f.innerHTML = vtc(g, d, { xl: "v_I (V)", yl: "v_O (V)", label: "Buffer transfer curve" });
            ro.innerHTML = readout([["output at v_I = V_IL", fmt(g(2)) + " V"], ["output at v_I = V_IH", fmt(g(3)) + " V"], ["slope in the middle", fmt(2.5 * k, 2)]]) + `<span class="verdict ${ok ? "ok" : "no"}">${ok ? "Valid buffer" : "Not valid: valid inputs give invalid outputs"}</span>`;
          }
          host.append(f, slider({ id: id + "-k", label: "Steepness k", min: 0.2, max: 4, step: 0.05, value: k, show: (x) => fmt(x, 2) }, (x) => { k = x; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "why", title: "Why nonlinear?", b: [
        { t: "mcq", q: "A valid buffer has slope > 1 in the middle but must squash inputs 0–2 V into 0–1 V (slope < 1) at the ends. What does that imply?", opts: [
          ["The curve can't be a straight line: logic gates must be nonlinear", true, "A straight line has one slope everywhere. Gain > 1 in the middle and < 1 at the edges needs a curve. That's why you can't build a valid gate from resistors alone (they're linear and have gain ≤ 1)."],
          ["Any resistor network will do", false, "Resistor dividers have gain ≤ 1 everywhere, so they can never give a margin."],
          ["The buffer must be digital, so slopes don't matter", false, "The abstraction relies on these analog properties underneath."],
        ]},
        `<p class="aside">The curve may pass through the forbidden region. That's fine: the discipline only promises valid outputs for valid inputs.</p>`,
      ]},
      { k: "learn", title: "Power in a gate", b: [
        `<p>When the pull-down conducts, current flows from V<sub>S</sub> through R<sub>L</sub> and the pull-down network (resistance R<sub>pd</sub>) to ground:</p>`,
        `<div class="eq">P = V<sub>S</sub>² / (R<sub>L</sub> + R<sub>pd</sub>)</div>`,
        `<p>Input low (MOSFET off): no current, P = 0. Input high: maximum power, with R<sub>pd</sub> = R<sub>ON</sub>.</p>`,
        { t: "num", q: "V_S = 5 V, R_L = 18 kΩ, R_ON = 2 kΩ, input high. P = ?", a: 1.25, unit: "mW", hint: "25 V² / 20 kΩ.", why: "1.25 mW." },
      ]},
      { k: "whatif", title: "Scale it up", b: [
        { t: "num", q: "A chip has 10 million of these inverters, half with a high input at any moment. Total static power?", a: 6250, tol: 0.02, unit: "W", hint: "5 million × 1.25 mW.", why: "6250 W, more than a space heater! This is why resistor-pullup logic can't scale. Chapter 11's CMOS logic fixes it." },
      ]},
      { k: "check", title: "Power in a compound gate", b: [
        `<p>A gate with two pull-up branches is on when all inputs are high. Branch 1: R₆ over two R<sub>ON</sub> in series. Branch 2: R₇ over one R<sub>ON</sub>.</p>`,
        { t: "mcq", q: "Total power from V_S?", opts: [
          ["V_S²/(R₆ + 2R_ON) + V_S²/(R₇ + R_ON)", true, "Each branch is its own path from V_S to ground. Powers add."],
          ["V_S²/(R₆ + R₇ + 3R_ON)", false, "The branches are side by side, not in series."],
          ["Zero, since the output is low", false, "A low output with resistor pull-ups means current is flowing."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain why a logic gate needs gain greater than 1.", model: "Senders' outputs are held to a narrower range than receivers accept, to leave noise margins. So a gate must turn an input step from V_IL to V_IH into a bigger output step from V_OL to V_OH. A bigger output change than input change means gain greater than 1 in that region." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ch6", eyebrow: "Chapter 6", title: "The MOSFET Switch",
    intro: `<p>Eight parts. Chapter 5's gates were boxes. Now you build them: from <b>switches</b>, to the <b>MOSFET</b>, to real gate design with the S and SR models, and why logic needs gain and burns power.</p><p class="aside">Arrow keys ← → move between steps. Need a refresher? <a href="05-digital-abstraction.html">Chapter 5</a>.</p>`,
    after: `<p>Open the Chapter 6 PDF and go to the <b>exercises and problems</b> at the end. For each gate problem, first decide which MOSFET model (S or SR) the question needs.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8],
    summary: `
      <h3>Switch</h3>
      <p>Three terminals. Control 1: short (v = 0). Control 0: open (i = 0). Analyze as two linear subcircuits. Series = AND, parallel = OR.</p>
      <h3>MOSFET (n-channel)</h3>
      <p>G gate, D drain (higher voltage), S source. i<sub>G</sub> = 0. Ports: G–S control, D–S output.</p>
      <div class="eq">S model: v_GS ≥ V_T → v_DS = 0 · v_GS < V_T → i_DS = 0</div>
      <div class="eq">SR model: ON → i_DS = v_DS/R_ON · R_ON = R_n·L/W</div>
      <h3>Gates</h3>
      <p>Inverter: R<sub>L</sub> pull-up to V<sub>S</sub>, MOSFET pull-down to ground. Series pull-down → NAND, parallel → NOR. Network function F → output NOT F.</p>
      <h3>Static analysis</h3>
      <p>S model: outputs 0/V<sub>S</sub>, switching at V<sub>T</sub>, so V<sub>IL</sub> < V<sub>T</sub> ≤ V<sub>IH</sub>.</p>
      <div class="eq">SR inverter low: V_S·R_ON/(R_ON + R_L) · NAND (2 in series): V_S·2R_ON/(2R_ON + R_L)</div>
      <p>Must be < V<sub>T</sub> (to switch the next gate off) and ≤ V<sub>OL</sub>. Switching condition: W/L > R<sub>n</sub>(V<sub>S</sub> − V<sub>T</sub>)/(V<sub>T</sub>R<sub>L</sub>).</p>
      <h3>Gain and nonlinearity</h3>
      <div class="eq">|gain| through V_IL→V_IH ≥ (V_OH − V_OL)/(V_IH − V_IL) > 1</div>
      <p>Gain < 1 in the valid regions → gates must be nonlinear. Restoration keeps noise from accumulating. Composability: i<sub>G</sub> = 0 and output doesn't affect input.</p>
      <h3>Power</h3>
      <div class="eq">P = V_S²/(R_L + R_pd)</div>
      <p>Zero when the pull-down is off, maximum when it's on.</p>`,
  };
  Course.start(window.CHAPTER);
})();
