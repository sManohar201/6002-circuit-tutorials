(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const ch = (n, file, part, where, html) => `<p class="aside">${html} <a href="${file}#${part}">Boylestad Chapter ${n}, ${where} →</a></p>`;
  const ohm = (r) => si(r, "Ω");
  const TAU = 2 * Math.PI, L10 = Math.log10;
  const hz = (f) => si(f, "Hz", 4);
  const oa = (x, y, o = {}) => `<polygon class="el" points="${x},${y - 42} ${x},${y + 42} ${x + 72},${y}"/>` +
    S.t(x + 13, y - 14, o.flip ? "+" : "−", { cls: "big" }) + S.t(x + 13, y + 27, o.flip ? "−" : "+", { cls: "big" });
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

  /* Three noninverting/inverting stages in a row, drawn as gain boxes. */
  function chainFig(g) {
    let s = S.dot(30, 80) + S.t(30, 68, "V_i", { cls: "c" });
    g.forEach((v, i) => { const x = 70 + i * 140; s += S.wire([i ? x - 50 : 30, 80], [x, 80]) + S.box(x, 50, 90, 60, "") + S.t(x + 45, 76, "A_" + (i + 1), { cls: "s" }) + S.t(x + 45, 98, v, { cls: "a s" }); });
    const xe = 70 + g.length * 140 - 50;
    s += S.wire([xe, 80], [xe + 40, 80]) + S.dot(xe + 40, 80) + S.t(xe + 40, 68, "V_o", { cls: "a" });
    return S.svg(xe + 70, 130, s, { max: xe + 70, label: "Amplifier stages in cascade" });
  }

  /* Single-op-amp subtractor (difference amplifier). */
  function subFig() {
    let s = oa(220, 140) + S.dot(40, 120) + S.t(32, 125, "V_2", { a: "end", cls: "c" }) + S.res(40, 120, 130, 120, "R_2") + S.wire([130, 120], [220, 120]) + S.dot(170, 120);
    s += S.wire([170, 120], [170, 50]) + S.res(170, 50, 320, 50, "R_4") + S.wire([320, 50], [320, 140]) + S.wire([292, 140], [360, 140]) + S.dot(320, 140) + S.dot(360, 140) + S.t(360, 128, "V_o", { cls: "a" });
    s += S.dot(40, 160) + S.t(32, 165, "V_1", { a: "end", cls: "c" }) + S.res(40, 160, 130, 160, "R_1", { side: "below" }) + S.wire([130, 160], [220, 160]) + S.dot(190, 160) + S.res(190, 160, 190, 240, "R_3", { side: "left" }) + S.gnd(190, 240);
    return S.svg(400, 275, s, { max: 400, label: "One op-amp subtracting V_2 from V_1" });
  }

  /* Three-op-amp instrumentation amplifier. */
  function inaFig() {
    let s = oa(120, 70, { flip: true }) + oa(120, 250, { flip: true });
    s += S.dot(40, 50) + S.t(32, 55, "V_2", { a: "end", cls: "c" }) + S.wire([40, 50], [120, 50]) + S.dot(40, 230) + S.t(32, 235, "V_1", { a: "end", cls: "c" }) + S.wire([40, 230], [120, 230]);
    s += S.wire([192, 70], [230, 70]) + S.res(230, 70, 230, 130, "R", { side: "left" }) + S.res(230, 130, 230, 190, "R_P", { side: "left", cls: "hl", tcls: "a" }) + S.res(230, 190, 230, 250, "R", { side: "left" }) + S.wire([192, 250], [230, 250]);
    s += S.dot(230, 130) + S.dot(230, 190) + S.wire([230, 130], [100, 130], [100, 90], [120, 90]) + S.wire([230, 190], [100, 190], [100, 270], [120, 270]) + S.dot(230, 70) + S.dot(230, 250);
    s += oa(390, 160) + S.wire([230, 70], [270, 70]) + S.res(270, 70, 340, 70, "R") + S.wire([340, 70], [365, 70], [365, 140], [390, 140]) + S.dot(365, 70) + S.wire([365, 70], [365, 30]) + S.res(365, 30, 480, 30, "R") + S.wire([480, 30], [480, 160]);
    s += S.wire([230, 250], [270, 250]) + S.res(270, 250, 340, 250, "R", { side: "below" }) + S.wire([340, 250], [365, 250], [365, 180], [390, 180]) + S.dot(365, 250) + S.res(365, 250, 365, 300, "R", { side: "right" }) + S.gnd(365, 300);
    s += S.wire([462, 160], [510, 160]) + S.dot(480, 160) + S.dot(510, 160) + S.t(510, 148, "V_o", { cls: "a" });
    return S.svg(540, 335, s, { max: 540, label: "Three-op-amp instrumentation amplifier with gain-setting resistor R_P" });
  }

  /* Active filters. kind: lp1, lp2, hp1, hp2. */
  function filtFig(kind) {
    const hp = kind[0] === "h", two = kind[2] === "2";
    const ser = (x1, x2, lab) => (hp ? S.cap(x1, 100, x2, 100, "C_" + lab) : S.res(x1, 100, x2, 100, "R_" + lab));
    const sh = (x, lab) => S.dot(x, 100) + (hp ? S.res(x, 100, x, 165, "R_" + lab, { side: "right" }) : S.cap(x, 100, x, 165, "C_" + lab, { side: "right" })) + S.gnd(x, 165);
    let s = oa(280, 120, { flip: true }) + S.dot(50, 100) + S.t(42, 105, "V_1", { a: "end", cls: "c" });
    if (two) s += ser(50, 120, "1") + sh(130, "1") + S.wire([120, 100], [130, 100]) + ser(130, 200, "2") + sh(210, "2") + S.wire([200, 100], [280, 100]);
    else s += ser(50, 130, "1") + sh(150, "1") + S.wire([130, 100], [280, 100]);
    s += S.wire([280, 140], [255, 140], [255, 190]) + S.dot(255, 190) + S.res(255, 190, 255, 255, "R_G", { side: "left" }) + S.gnd(255, 255) + S.res(255, 190, 380, 190, "R_F", { side: "below" }) + S.wire([380, 190], [380, 120]);
    s += S.wire([352, 120], [420, 120]) + S.dot(380, 120) + S.dot(420, 120) + S.t(420, 108, "V_o", { cls: "a" });
    return S.svg(450, 290, s, { max: 450, label: (two ? "Second" : "First") + "-order " + (hp ? "high" : "low") + "-pass active filter" });
  }
  const lp = (f0, n) => (f) => 1 / Math.sqrt(1 + Math.pow(f / f0, 2 * n));
  const hpf = (f0, n) => (f) => 1 / Math.sqrt(1 + Math.pow(f0 / f, 2 * n));
  function bode(o) {
    return plot({ x: o.x || [1, 6], y: o.y || [-50, 5], xt: o.xt || [1, 2, 3, 4, 5, 6], xtf: (v) => si(Math.pow(10, v), "", 2).trim(), yt: o.yt || [-40, -20, -3, 0], xl: "f (Hz, log scale)", yl: o.yl || "A_v/A_v(pass) (dB)", series: o.series, marks: o.marks || [], texts: o.texts || [], label: o.label || "Filter response in dB against log frequency" });
  }
  const crv = (g, cls) => ({ f: (x) => 20 * L10(g(Math.pow(10, x))), cls: cls || "s1", n: 400 });

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Constant-gain stages", mins: 20,
    blurb: "One resistor ratio per stage. Chain stages and the gains multiply.",
    takeaway: "Inverting: A = −R_f/R₁. Noninverting: A = 1 + R_f/R₁. Cascaded stages: A = A₁A₂A₃ (signs multiply too: two inverting stages give a noninverting result). Design: pick R_f, then R₁ = R_f/|A| (inverting) or R₁ = R_f/(A − 1) (noninverting). Quad op-amp ICs (LM124, LM348) hold four op-amps, enough for a three-stage amplifier in one package.",
    steps: [
      { k: "learn", title: "Two building blocks", b: [
        ch(10, "10-op-amps.html", "p6", "Part 6", "Where these gains come from."),
        `<div class="two"><div class="tile"><h3>Inverting</h3><div class="eq">A = −R<sub>f</sub>/R<sub>1</sub></div></div><div class="tile"><h3>Noninverting</h3><div class="eq">A = 1 + R<sub>f</sub>/R<sub>1</sub></div></div></div>`,
      ]},
      { k: "check", title: "Warm-up", b: [
        { t: "num", q: "Inverting: R_f = 150 kΩ, R₁ = 3.3 kΩ, input 4 mV. Output?", a: -181.8, unit: "mV", tol: 0.01, hint: "A = −45.5.", why: "−45.45 × 4 mV = −182 mV." },
        { t: "num", q: "Noninverting: R_f = 68 kΩ, R₁ = 1.5 kΩ, input 50 µV. Output?", a: 2.317, unit: "mV", tol: 0.01, hint: "A = 1 + 45.3.", why: "46.33 × 50 µV = 2.32 mV." },
        `<p class="aside">Example 11.2 says the input is 120 mV, but its figure and its answer (12.12 mV) mean 120 µV.</p>`,
      ]},
      { k: "learn", title: "Stages in a row", b: [
        fig(chainFig(["1 + R_f/R_1", "−R_f/R_2", "−R_f/R_3"])),
        `<div class="eq">A = A<sub>1</sub>A<sub>2</sub>A<sub>3</sub></div>`,
        `<p>Two inverting stages: the signs cancel, so the whole chain is noninverting. Each op-amp's low output impedance drives the next stage without loading.</p>`,
        `<p class="aside">The book says the first stage's gain is "given by Eq. (11.1)"; for the noninverting stage it's Eq. (11.2).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>R<sub>f</sub> = 330 kΩ in all three stages. Stage 1 noninverting with R<sub>1</sub> = 6.8 kΩ, stage 2 inverting with R<sub>2</sub> = 22 kΩ, stage 3 inverting with R<sub>3</sub> = 47 kΩ.</p>`,
        { t: "num", q: "Overall gain?", a: 5216, tol: 0.01, hint: "49.53 × (−15) × (−7.02).", why: "+5216." },
        { t: "num", q: "Output for 40 µV in?", a: 0.2087, unit: "V", tol: 0.01, hint: "A × V_i.", why: "0.209 V, in phase with the input." },
      ]},
      { k: "check", title: "Design it", b: [
        `<p>You want stage gains of +12, −25 and −8, each with R<sub>f</sub> = 200 kΩ.</p>`,
        { t: "num", q: "R₁ for the +12 stage?", a: 18.18, unit: "kΩ", tol: 0.01, hint: "1 + R_f/R₁ = 12, so R_f/R₁ = 11.", why: "200/11 = 18.2 kΩ." },
        { t: "num", q: "R₂ for the −25 stage?", a: 8, unit: "kΩ", tol: 0.01, hint: "R_f/R₂ = 25.", why: "8 kΩ." },
        { t: "num", q: "Overall gain?", a: 2400, tol: 0.01, hint: "Multiply, signs too.", why: "12 × (−25) × (−8) = +2400." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does an even number of inverting stages give a noninverting amplifier?", model: "Each inverting stage multiplies by a negative gain. Two negatives make a positive, so after an even number of inverting stages the output is back in phase with the input." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Adding and subtracting", mins: 25,
    blurb: "Summing with different weights, and two ways to take a difference.",
    takeaway: "Summing: V_o = −(R_f/R₁·V₁ + R_f/R₂·V₂ + R_f/R₃·V₃). Works for ac signals of different frequencies too: each keeps its own frequency. Two-op-amp subtractor (invert V₁, then sum): V_o = −[(R_f/R₂)V₂ − (R_f/R₃)(R_f/R₁)V₁]. One-op-amp subtractor (superposition): V_o = [R₃/(R₁ + R₃)]·[(R₂ + R₄)/R₂]·V₁ − (R₄/R₂)V₂. With R₃/R₁ = R₄/R₂ it gives (R₄/R₂)(V₁ − V₂).",
    steps: [
      { k: "learn", title: "Summing", b: [
        fig(opFig("sum")),
        `<div class="eq">V<sub>o</sub> = −(R<sub>f</sub>V<sub>1</sub>/R<sub>1</sub> + R<sub>f</sub>V<sub>2</sub>/R<sub>2</sub> + R<sub>f</sub>V<sub>3</sub>/R<sub>3</sub>)</div>`,
      ]},
      { k: "play", title: "Mixing two signals", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let g1 = 12, g2 = 20;
          function draw() {
            const v1 = (t) => 0.04 * Math.sin(500 * t), v2 = (t) => 0.015 * Math.sin(2000 * t);
            f.innerHTML = plot({ x: [0, 0.03], y: [-1, 1], xt: [0, 0.01, 0.02, 0.03], xtf: (v) => fmt(v * 1000) + " ms", yt: [-1, -0.5, 0, 0.5, 1], xl: "t", yl: "v_o (V)", h: 230, series: [{ f: (t) => -(g1 * v1(t)), cls: "s2" }, { f: (t) => -(g2 * v2(t)), cls: "s3" }, { f: (t) => -(g1 * v1(t) + g2 * v2(t)), cls: "s1", n: 600 }], texts: [{ x: 0.001, y: -0.9, s: "blue: −g₁v₁ · green: −g₂v₂ · orange: sum" }], label: "Summing amplifier output made of two weighted sine waves" });
          }
          host.append(f, slider({ id: id + "-1", label: "R_f/R_1 (v₁ = 40 mV sin 500t)", min: 0, max: 20, step: 1, value: g1, show: (v) => String(v) }, (v) => { g1 = v; draw(); }).el,
            slider({ id: id + "-2", label: "R_f/R_2 (v₂ = 15 mV sin 2000t)", min: 0, max: 30, step: 1, value: g2, show: (v) => String(v) }, (v) => { g2 = v; draw(); }).el);
          draw();
        },
        { t: "mcq", q: "R_f = 240 kΩ, R₁ = 20 kΩ, R₂ = 12 kΩ, with the inputs above. V_o?", opts: [
          ["−[0.48 sin 500t + 0.30 sin 2000t] V", true, "Gains 12 and 20: 12 × 40 mV = 0.48 V, 20 × 15 mV = 0.30 V. Each keeps its own frequency."],
          ["−0.78 sin 500t V", false, "Different frequencies can't be merged into one sine."],
          ["+[0.48 sin 500t + 0.30 sin 2000t] V", false, "The summer inverts."],
        ]},
      ]},
      { k: "learn", title: "Subtracting with two op-amps", b: [
        `<p>Invert V<sub>1</sub> with one stage, then sum it with V<sub>2</sub> in a second:</p>`,
        `<div class="eq">V<sub>o</sub> = −[(R<sub>f</sub>/R<sub>2</sub>)V<sub>2</sub> − (R<sub>f</sub>/R<sub>3</sub>)(R<sub>f</sub>/R<sub>1</sub>)V<sub>1</sub>]</div>`,
        { t: "mcq", q: "R_f = 240 kΩ, R₁ = 60 kΩ, R₃ = 480 kΩ, R₂ = 120 kΩ. V_o?", opts: [
          ["2(V₁ − V₂)", true, "V₂'s gain is 240/120 = 2; V₁'s is (240/480)(240/60) = 2. V_o = −(2V₂ − 2V₁)."],
          ["2(V₂ − V₁)", false, "Mind the overall minus sign."],
          ["8V₁ − 2V₂", false, "V₁ passes through two gains: 4 and then 0.5."],
        ]},
      ]},
      { k: "learn", title: "Subtracting with one op-amp", b: [
        fig(subFig()),
        `<p>Superposition: V<sub>1</sub> sees a divider then the noninverting gain; V<sub>2</sub> sees the inverting gain.</p>`,
        `<div class="eq">V<sub>o</sub> = [R<sub>3</sub>/(R<sub>1</sub> + R<sub>3</sub>)]·[(R<sub>2</sub> + R<sub>4</sub>)/R<sub>2</sub>]·V<sub>1</sub> − (R<sub>4</sub>/R<sub>2</sub>)V<sub>2</sub></div>`,
        seen("Superposition: one source at a time, then add.", "03-network-theorems.html#p6", "Chapter 3, Part 6"),
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>R<sub>1</sub> = R<sub>2</sub> = 10 kΩ, R<sub>3</sub> = R<sub>4</sub> = 30 kΩ.</p>`,
        { t: "num", q: "V₁'s gain?", a: 3, tol: 0.01, hint: "(30/40) × (40/10).", why: "0.75 × 4 = 3." },
        { t: "num", q: "V₁ = 1.2 V, V₂ = 0.9 V. V_o?", a: 0.9, unit: "V", tol: 0.01, hint: "3V₁ − 3V₂.", why: "3 × 0.3 = 0.9 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the one-op-amp subtractor manage to subtract?", model: "V_2 goes into the inverting input, so it appears at the output with a negative gain, minus R_4 over R_2. V_1 goes through a divider into the noninverting input, so it appears with a positive gain. Choose the resistor ratios so the two gains match and the output is that gain times V_1 minus V_2." },
      ]},
    ],
  };

  function ccvsFig() {
    let s = oa(200, 120) + S.isrc(100, 150, "I_1", { side: "left" }) + S.wire([100, 132], [100, 100], [200, 100]) + S.wire([100, 168], [100, 190]) + S.gnd(100, 190);
    s += S.dot(170, 100) + S.wire([170, 100], [170, 45]) + S.res(170, 45, 300, 45, "R") + S.wire([300, 45], [300, 120]) + S.wire([272, 120], [340, 120]) + S.dot(300, 120) + S.dot(340, 120) + S.t(340, 108, "V_o", { cls: "a" });
    s += S.wire([200, 140], [180, 140], [180, 150]) + S.gnd(180, 150);
    return S.svg(380, 215, s, { max: 380, label: "Current-controlled voltage source: input current into the virtual ground, resistor in the feedback path" });
  }

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Buffers and controlled sources", mins: 25,
    blurb: "Isolate a load with a follower. Then make sources whose output is set by a voltage or a current.",
    takeaway: "Buffer (unity follower): V_o = V₁, very high input and very low output impedance, no inversion; it isolates a source from its load. One input can feed several buffers, and a load on one output barely affects the others. Controlled sources: VCVS: V_o = −(R_f/R₁)V₁ or (1 + R_f/R₁)V₁ = kV₁. VCCS (load R_L in the feedback path of an inverting stage): I_o = V₁/R₁ = kV₁, independent of R_L. CCVS (input current into the virtual ground, R in the feedback): V_o = −I₁R = kI₁. CCCS: I_o = I₁ + I₂ = (1 + R₁/R₂)I₁ = kI₁.",
    steps: [
      { k: "learn", title: "The buffer", b: [
        fig(opFig("fol")),
        `<div class="eq">V<sub>o</sub> = V<sub>1</sub></div>`,
        `<p>Gain 1, so why bother? Because it draws almost nothing from the source and can drive a heavy load. Feed one signal into two buffers and you get two outputs that can't disturb each other.</p>`,
        seen("The follower as a buffer.", "15-op-amp.html#p4", "Chapter 15, Part 4"),
      ]},
      { k: "learn", title: "Four controlled sources", b: [
        seen("Dependent sources: voltage or current controlled by another voltage or current.", "02-resistive-networks.html#p9", "Chapter 2, Part 9"),
        (host) => {
          const f = el(`<div class="fig"></div>`), eq = el(`<div class="eq"></div>`), cap = el(`<p></p>`);
          const c = [
            [() => opFig("non"), "V<sub>o</sub> = (1 + R<sub>f</sub>/R<sub>1</sub>)V<sub>1</sub> = kV<sub>1</sub>", "Voltage-controlled voltage source: any constant-gain amplifier (inverting gives k = −R<sub>f</sub>/R<sub>1</sub>)."],
            [() => opFig("inv", { l: { Rf: "R_L (load)", Vo: "" } }), "I<sub>o</sub> = V<sub>1</sub>/R<sub>1</sub> = kV<sub>1</sub>", "Voltage-controlled current source: the load sits in the feedback path. Its current is V<sub>1</sub>/R<sub>1</sub> whatever R<sub>L</sub> is (until the output saturates)."],
            [ccvsFig, "V<sub>o</sub> = −I<sub>1</sub>R = kI<sub>1</sub>", "Current-controlled voltage source: the input current can't enter the op-amp, so all of it flows through R."],
            [() => "", "I<sub>o</sub> = I<sub>1</sub> + I<sub>2</sub> = (1 + R<sub>1</sub>/R<sub>2</sub>)I<sub>1</sub> = kI<sub>1</sub>", "Current-controlled current source: I<sub>1</sub> flows through R<sub>1</sub>; the voltage it makes drives an extra current I<sub>2</sub> = I<sub>1</sub>R<sub>1</sub>/R<sub>2</sub> through R<sub>2</sub>, and the two join in the output."],
          ];
          const d = (k) => { f.innerHTML = c[k][0](); eq.innerHTML = c[k][1]; cap.innerHTML = c[k][2]; };
          host.append(f, toggle(["VCVS", "VCCS", "CCVS", "CCCS"], d, 0), eq, cap);
          d(0);
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "VCCS: V₁ = 3 V, R₁ = 1.5 kΩ, R_L = 2.2 kΩ. Load current?", a: 2, unit: "mA", tol: 0.01, hint: "V₁/R₁. R_L doesn't enter.", why: "2 mA." },
        { t: "mcq", q: "Same VCCS, R_L changed to 4.7 kΩ. Load current?", opts: [["Still 2 mA", true, "That's what makes it a current source. Only the output voltage changes: −2 mA × 4.7 kΩ = −9.4 V."], ["Less than 2 mA", false, "R_L isn't in the formula."], ["More than 2 mA", false, "No."]] },
        { t: "num", q: "CCVS: I₁ = 50 µA, R = 40 kΩ. V_o?", a: -2, unit: "V", tol: 0.01, hint: "−I₁R.", why: "−2 V." },
        { t: "num", q: "CCCS: R₁ = 9 kΩ, R₂ = 1 kΩ, I₁ = 0.2 mA. I_o?", a: 2, unit: "mA", tol: 0.01, hint: "(1 + R₁/R₂)I₁.", why: "10 × 0.2 mA = 2 mA." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the load current in the op-amp VCCS independent of the load?", model: "The inverting input is a virtual ground, so the current into R_1 is fixed at V_1 over R_1. None of it can go into the op-amp, so all of it flows through the load in the feedback path. The op-amp adjusts its output voltage to whatever is needed to push that current through the load." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Instrumentation circuits", mins: 25,
    blurb: "Meters, lamp and LED drivers, and the three-op-amp instrumentation amplifier.",
    takeaway: "Op-amp millivoltmeter (dc or ac): meter current |I_o/V₁| = (R_f/R₁)(1/R_S); high input impedance, scale set only by resistors. With R_f = R₁ = 100 kΩ and R_S = 10 Ω: 1 mA per 10 mV; doubling R_f halves the full-scale voltage. Display drivers: the op-amp output swings to saturation when + goes above −, feeding a transistor (I_C = βI_B) for a lamp, or an LED directly. Instrumentation amplifier (three op-amps, one quad IC): V_o = (1 + 2R/R_P)(V₁ − V₂); the single resistor R_P (often a pot) sets the gain.",
    steps: [
      { k: "learn", title: "A millivoltmeter", b: [
        `<p>An op-amp drives a meter movement through a small resistor R<sub>S</sub>. The meter current depends only on resistor values:</p>`,
        `<div class="eq">|I<sub>o</sub>/V<sub>1</sub>| = (R<sub>f</sub>/R<sub>1</sub>)(1/R<sub>S</sub>)</div>`,
        `<p>R<sub>f</sub> = R<sub>1</sub> = 100 kΩ, R<sub>S</sub> = 10 Ω gives 1 mA per 10 mV. A 1 mA meter then reads 10 mV full scale, and 5 mV is half scale. The ac version adds a rectifier and works the same way.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 1 mA meter, R_S = 10 Ω, R₁ = 100 kΩ. What R_f gives 20 mV full scale?", a: 50, unit: "kΩ", tol: 0.01, hint: "1 mA/20 mV = (R_f/100 kΩ)(1/10 Ω).", why: "R_f/R₁ = 0.5, so 50 kΩ." },
        { t: "num", q: "Lamp driver: the op-amp gives 25 mA to the base of a transistor with β = 30. Lamp current?", a: 750, unit: "mA", tol: 0.01, hint: "I_C = βI_B.", why: "750 mA." },
      ]},
      { k: "learn", title: "The instrumentation amplifier", b: [
        fig(inaFig()),
        `<div class="eq">V<sub>o</sub> = (1 + 2R/R<sub>P</sub>)(V<sub>1</sub> − V<sub>2</sub>) = k(V<sub>1</sub> − V<sub>2</sub>)</div>`,
        `<p>Two followers give both inputs a very high input impedance; the chain R, R<sub>P</sub>, R sets the gain; the last op-amp subtracts. Change <b>one</b> resistor (R<sub>P</sub>) to change the gain.</p>`,
      ]},
      { k: "play", title: "Set the gain", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let RP = 800, dv = 0.015; const R = 12e3;
          function draw() { const k = 1 + (2 * R) / RP; ro.innerHTML = readout([["k = 1 + 2R/R<sub>P</sub> (R = 12 kΩ)", fmt(k, 4)], ["V<sub>o</sub> = k(V<sub>1</sub> − V<sub>2</sub>)", si(k * dv, "V", 4)]]); }
          host.append(slider({ id: id + "-p", label: "R_P", min: 100, max: 100e3, log: true, value: RP, show: ohm }, (v) => { RP = v; draw(); }).el,
            slider({ id: id + "-d", label: "V_1 − V_2", min: -0.05, max: 0.05, step: 0.001, value: dv, show: (v) => si(v, "V", 3) }, (v) => { dv = v; draw(); }).el, ro);
          draw();
        },
        { t: "num", q: "R = 12 kΩ, R_P = 800 Ω, V₁ − V₂ = 15 mV. V_o?", a: 0.465, unit: "V", tol: 0.01, hint: "k = 1 + 24 000/800.", why: "31 × 15 mV = 0.465 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What makes the three-op-amp instrumentation amplifier better than a single-op-amp subtractor?", model: "Both inputs go straight into op-amp noninverting inputs, so both have very high input impedance and don't load the sensor. And the gain is set by a single resistor, R_P, so you can adjust it without upsetting the balance that the subtraction depends on." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Active filters: low-pass", mins: 25,
    blurb: "An RC network plus an amplifier: gain in the passband, a cutoff, and a slope that depends on the order.",
    takeaway: "Ideal filters: low-pass passes dc up to f_OH and nothing above; high-pass passes everything above f_OL; bandpass passes between the two. Active = RC network plus an amplifier for gain and buffering. First-order low-pass: one R₁C₁ into a noninverting amplifier: passband gain A_v = 1 + R_F/R_G, cutoff f_OH = 1/(2πR₁C₁), slope −20 dB/decade. Second-order (two RC sections): same gain and cutoff, −40 dB/decade, closer to ideal.",
    steps: [
      { k: "learn", title: "Ideal filters", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`);
          const sh = [
            [[1, 0], [3.5, 0], [3.5, -45], [6, -45]], [[1, -45], [3.5, -45], [3.5, 0], [6, 0]], [[1, -45], [2.5, -45], [2.5, 0], [4.5, 0], [4.5, -45], [6, -45]],
          ];
          const d = (k) => { f.innerHTML = bode({ series: [{ pts: sh[k], cls: "s1" }], yt: [-40, 0], label: "Ideal filter response" }); };
          host.append(f, toggle(["Low-pass", "High-pass", "Bandpass"], d, 0));
          d(0);
        },
        `<p>Real filters can't drop like a cliff. The more RC sections (the higher the <b>order</b>), the steeper the slope.</p>`,
        seen("Passive RC filters and their corner frequencies.", "13-sinusoidal-steady-state.html#p7", "Chapter 13, Part 7"),
      ]},
      { k: "learn", title: "First and second order", b: [
        (host) => { const f = el(`<div class="fig"></div>`); const d = (k) => { f.innerHTML = filtFig(k ? "lp2" : "lp1"); }; host.append(f, toggle(["First order", "Second order"], d, 0)); d(0); },
        `<div class="eq">A<sub>v</sub> = 1 + R<sub>F</sub>/R<sub>G</sub>    f<sub>OH</sub> = 1/(2πR<sub>1</sub>C<sub>1</sub>)</div>`,
        `<p>The RC network does the filtering; the noninverting amplifier adds gain and keeps the load from disturbing the RC network.</p>`,
      ]},
      { k: "play", title: "Low-pass lab", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let R = 3300, C = 0.01e-6, n = 1;
          function draw() {
            const f0 = 1 / (TAU * R * C);
            f.innerHTML = bode({ series: [crv(lp(f0, 1), n === 1 ? "s1" : "s5"), crv(lp(f0, 2), n === 2 ? "s1" : "s5")], marks: [{ x: L10(f0), y: -3 }], texts: [{ x: L10(f0) + 0.1, y: 1.5, s: "f_OH" }], label: "First- and second-order low-pass responses" });
            ro.innerHTML = readout([["f<sub>OH</sub> = 1/(2πR<sub>1</sub>C<sub>1</sub>)", hz(f0)], ["One decade above f<sub>OH</sub>", n === 1 ? "−20 dB" : "−40 dB"]]);
          }
          host.append(f, toggle(["First order", "Second order"], (k) => { n = k + 1; draw(); }, 0),
            slider({ id: id + "-r", label: "R_1", min: 100, max: 100e3, log: true, value: R, show: ohm }, (v) => { R = v; draw(); }).el,
            slider({ id: id + "-c", label: "C_1", min: 1e-9, max: 1e-6, log: true, value: C, show: (v) => si(v, "F") }, (v) => { C = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The plot shows the shape relative to the passband gain. Orange is the chosen order; dashed grey is the other.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "First-order low-pass: R₁ = 3.3 kΩ, C₁ = 0.01 µF. f_OH?", a: 4823, unit: "Hz", tol: 0.01, hint: "1/(2πR₁C₁).", why: "4.82 kHz." },
        { t: "num", q: "R_G = 10 kΩ, R_F = 22 kΩ. Passband gain in dB?", a: 10.1, unit: "dB", tol: 0.01, hint: "A_v = 3.2.", why: "20 log 3.2 = 10.1 dB." },
        { t: "num", q: "Second-order version, 10× above f_OH. How far below the passband?", a: -40, unit: "dB", tol: 0.01, hint: "Slope per decade.", why: "About −40 dB." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does going from a first-order to a second-order low-pass filter change, and what stays the same?", model: "The passband gain and the cutoff frequency stay the same. What changes is the slope above cutoff: twenty decibels per decade for first order, forty for second order, so the second-order filter is closer to the ideal brick wall." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "High-pass and bandpass", mins: 20,
    blurb: "Swap R and C for high-pass. Put a high-pass and a low-pass in a row for bandpass.",
    takeaway: "High-pass: swap the R and C positions. Gain A_v = 1 + R_F/R_G; f_OL = 1/(2πR₁C₁); +20 dB/decade below cutoff (first order), +40 (second order, with R₁ = R₂ and C₁ = C₂). Bandpass: a high-pass stage then a low-pass stage; f_OL = 1/(2πR₁C₁) from the first, f_OH = 1/(2πR₂C₂) from the second; needs f_OL < f_OH.",
    steps: [
      { k: "learn", title: "High-pass", b: [
        (host) => { const f = el(`<div class="fig"></div>`); const d = (k) => { f.innerHTML = filtFig(k ? "hp2" : "hp1"); }; host.append(f, toggle(["First order", "Second order"], d, 0)); d(0); },
        `<div class="eq">A<sub>v</sub> = 1 + R<sub>F</sub>/R<sub>G</sub>    f<sub>OL</sub> = 1/(2πR<sub>1</sub>C<sub>1</sub>)</div>`,
        `<p>Now the capacitor is in series: it blocks low frequencies and passes high ones.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Second-order high-pass: R<sub>1</sub> = R<sub>2</sub> = 4.7 kΩ, C<sub>1</sub> = C<sub>2</sub> = 0.022 µF, R<sub>G</sub> = 12 kΩ, R<sub>F</sub> = 36 kΩ.</p>`,
        { t: "num", q: "Passband gain?", a: 4, tol: 0.01, hint: "1 + R_F/R_G.", why: "4." },
        { t: "num", q: "f_OL?", a: 1539, unit: "Hz", tol: 0.01, hint: "1/(2πR₁C₁).", why: "1.54 kHz." },
      ]},
      { k: "play", title: "Build a bandpass", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let C1 = 0.22e-6, C2 = 1e-9; const R = 22e3;
          function draw() {
            const fL = 1 / (TAU * R * C1), fH = 1 / (TAU * R * C2), g = (ff) => hpf(fL, 1)(ff) * lp(fH, 1)(ff);
            f.innerHTML = plot({ x: [0, 6], y: [-50, 5], xt: [0, 1, 2, 3, 4, 5, 6], xtf: (v) => si(Math.pow(10, v), "", 2).trim(), yt: [-40, -20, -3, 0], xl: "f (Hz, log scale)", yl: "A_v/A_v(pass) (dB)", series: [crv(g)], marks: [{ x: L10(fL), y: -3 }, { x: L10(fH), y: -3 }], texts: [{ x: L10(fL) + 0.12, y: -9, s: "f_OL" }, { x: L10(fH) - 0.12, y: -9, s: "f_OH", a: "end" }], label: "Bandpass filter response" });
            ro.innerHTML = readout([["f<sub>OL</sub> = 1/(2πR<sub>1</sub>C<sub>1</sub>)", hz(fL)], ["f<sub>OH</sub> = 1/(2πR<sub>2</sub>C<sub>2</sub>)", hz(fH)], ["Works as bandpass?", fL < fH ? "yes" : "no: the bands don't overlap"]]);
          }
          host.append(f, slider({ id: id + "-1", label: "C_1 (high-pass stage, R_1 = 22 kΩ)", min: 1e-9, max: 10e-6, log: true, value: C1, show: (v) => si(v, "F") }, (v) => { C1 = v; draw(); }).el,
            slider({ id: id + "-2", label: "C_2 (low-pass stage, R_2 = 22 kΩ)", min: 10e-12, max: 1e-6, log: true, value: C2, show: (v) => si(v, "F") }, (v) => { C2 = v; draw(); }).el, ro);
          draw();
        },
        fig(S.svg(460, 110, S.dot(20, 55) + S.t(20, 43, "V_1", { cls: "c" }) + S.wire([20, 55], [70, 55]) + S.box(70, 25, 140, 60, "high-pass, f_OL") + S.wire([210, 55], [250, 55]) + S.box(250, 25, 140, 60, "low-pass, f_OH") + S.wire([390, 55], [430, 55]) + S.dot(430, 55) + S.t(430, 43, "V_o", { cls: "a" }), { max: 460, label: "Bandpass filter as a high-pass stage followed by a low-pass stage" })),
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>R<sub>1</sub> = R<sub>2</sub> = 22 kΩ, C<sub>1</sub> = 0.22 µF, C<sub>2</sub> = 1 nF.</p>`,
        { t: "num", q: "f_OL?", a: 32.88, unit: "Hz", tol: 0.01, hint: "1/(2π × 22 kΩ × 0.22 µF).", why: "32.9 Hz." },
        { t: "num", q: "f_OH?", a: 7234, unit: "Hz", tol: 0.01, hint: "1/(2π × 22 kΩ × 1 nF).", why: "7.23 kHz." },
        { t: "mcq", q: "You swap the capacitors (C₁ = 1 nF, C₂ = 0.22 µF). What happens?", opts: [["Almost nothing gets through", true, "Now f_OL = 7.2 kHz and f_OH = 33 Hz: the high-pass blocks everything the low-pass would let through."], ["The band widens", false, "The corners crossed over."], ["It becomes a high-pass filter", false, "Both stages still act; together they block nearly everything."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a two-stage bandpass filter set its two cutoff frequencies?", model: "The first stage is a high-pass filter whose R_1 C_1 sets the lower cutoff, and the second is a low-pass filter whose R_2 C_2 sets the upper cutoff. Only frequencies above the first and below the second get through both, and that only works if the lower cutoff is below the upper one." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edc11", eyebrow: "Boylestad · Chapter 11", title: "Op-Amp Applications",
    intro: `<p>Six parts: constant-gain stages and cascades, summing and subtracting, buffers and controlled sources, instrumentation circuits, then active low-pass, high-pass and bandpass filters.</p><p>Everything here uses the virtual-ground shortcut from Chapter 10.</p><p class="aside">The "Computer Analysis" section isn't covered. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's problems in the book. They test whether the ideas stuck, so don't expect them to look like the examples here.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <h3>Gain stages</h3>
      <div class="eq">Inverting A = −R<sub>f</sub>/R<sub>1</sub>    Noninverting A = 1 + R<sub>f</sub>/R<sub>1</sub>    Cascade A = A<sub>1</sub>A<sub>2</sub>A<sub>3</sub>    Buffer V<sub>o</sub> = V<sub>1</sub></div>
      <h3>Adding and subtracting</h3>
      <div class="eq">V<sub>o</sub> = −(R<sub>f</sub>V<sub>1</sub>/R<sub>1</sub> + R<sub>f</sub>V<sub>2</sub>/R<sub>2</sub> + R<sub>f</sub>V<sub>3</sub>/R<sub>3</sub>)    Two op-amps: V<sub>o</sub> = −[(R<sub>f</sub>/R<sub>2</sub>)V<sub>2</sub> − (R<sub>f</sub>/R<sub>3</sub>)(R<sub>f</sub>/R<sub>1</sub>)V<sub>1</sub>]</div>
      <div class="eq">One op-amp: V<sub>o</sub> = [R<sub>3</sub>/(R<sub>1</sub> + R<sub>3</sub>)][(R<sub>2</sub> + R<sub>4</sub>)/R<sub>2</sub>]V<sub>1</sub> − (R<sub>4</sub>/R<sub>2</sub>)V<sub>2</sub></div>
      <h3>Controlled sources</h3>
      <div class="eq">VCVS V<sub>o</sub> = kV<sub>1</sub>    VCCS I<sub>o</sub> = V<sub>1</sub>/R<sub>1</sub>    CCVS V<sub>o</sub> = −I<sub>1</sub>R    CCCS I<sub>o</sub> = (1 + R<sub>1</sub>/R<sub>2</sub>)I<sub>1</sub></div>
      <h3>Instruments</h3>
      <div class="eq">Meter |I<sub>o</sub>/V<sub>1</sub>| = (R<sub>f</sub>/R<sub>1</sub>)(1/R<sub>S</sub>)    Instrumentation amp V<sub>o</sub> = (1 + 2R/R<sub>P</sub>)(V<sub>1</sub> − V<sub>2</sub>)</div>
      <h3>Active filters</h3>
      <div class="eq">A<sub>v</sub> = 1 + R<sub>F</sub>/R<sub>G</sub>    f<sub>OH</sub> = 1/(2πR<sub>1</sub>C<sub>1</sub>) low-pass    f<sub>OL</sub> = 1/(2πR<sub>1</sub>C<sub>1</sub>) high-pass    20 dB/decade per order</div>`,
  };
  Course.start(window.CHAPTER);
})();
