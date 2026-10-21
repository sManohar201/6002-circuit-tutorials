(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const ch = (n, file, part, where, html) => `<p class="aside">${html} <a href="${file}#${part}">Boylestad Chapter ${n}, ${where} →</a></p>`;
  const ohm = (r) => si(r, "Ω");
  const TAU = 2 * Math.PI, SQ3 = Math.sqrt(3);
  const V = (v) => si(v, "V", 4), A = (i) => si(i, "A", 4);
  const pct = (x) => fmt(100 * x, 4) + "%";
  function bjt(x, y) {
    const L = Math.hypot(22, 19), ux = 22 / L, uy = 19 / L;
    let s = `<line class="w" x1="${x - 30}" y1="${y}" x2="${x}" y2="${y}"/><line class="w" x1="${x}" y1="${y - 20}" x2="${x}" y2="${y + 20}" style="stroke-width:3.5"/>`;
    s += `<polyline class="w" points="${x},${y - 9} ${x + 22},${y - 28} ${x + 22},${y - 50}"/><polyline class="w" points="${x},${y + 9} ${x + 22},${y + 28} ${x + 22},${y + 50}"/>`;
    const tx = x + 22 * 0.85, ty = y + 9 + 19 * 0.85, bx = tx - 9 * ux, by = ty - 9 * uy;
    return s + `<polygon class="nd" points="${tx},${ty} ${bx - 5 * uy},${by + 5 * ux} ${bx + 5 * uy},${by - 5 * ux}"/>`;
  }

  function chainFig() {
    const box = (x, lab, wave) => S.box(x, 30, 96, 52, "") + S.t(x + 48, 50, lab, { cls: "s" }) + `<polyline class="w" style="stroke:var(--accent);stroke-width:2" points="${wave.map(([a, b]) => x + 18 + a * 60 + "," + (72 - b * 12)).join(" ")}"/>`;
    const sine = [], fw = [], rip = [], flat = [[0, 0.8], [1, 0.8]];
    for (let i = 0; i <= 40; i++) { const t = i / 40; sine.push([t, 0.5 + 0.5 * Math.sin(TAU * 2 * t) - 0.4]); fw.push([t, Math.abs(Math.sin(TAU * 2 * t))]); rip.push([t, 0.75 + 0.12 * Math.abs(Math.sin(TAU * 2 * t)) - 0.06]); }
    let s = S.t(10, 60, "120 V ac", { a: "start", cls: "s m" });
    s += S.wire([70, 56], [86, 56]) + box(86, "transformer", sine) + S.wire([182, 56], [196, 56]) + box(196, "rectifier", fw) + S.wire([292, 56], [306, 56]) + box(306, "filter", rip) + S.wire([402, 56], [416, 56]) + box(416, "regulator", flat) + S.wire([512, 56], [530, 56]) + S.t(534, 60, "dc", { a: "start", cls: "a s" });
    return S.svg(560, 100, s, { max: 560, label: "Power supply chain: transformer, rectifier, filter, regulator" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "From ac to steady dc: ripple and regulation", mins: 20,
    blurb: "Transform, rectify, filter, regulate. Two numbers grade the result: ripple and voltage regulation.",
    takeaway: "Power supply: transformer (steps 120 V rms down), rectifier (pulsating dc), capacitor filter (dc with ripple), regulator (steady dc that holds even if the input or load changes). Ripple r = V_r(rms)/V_dc × 100% (a dc meter reads V_dc; an ac meter through a capacitor reads V_r(rms)). Voltage regulation %V.R. = (V_NL − V_FL)/V_FL × 100%; 0% is a perfect source. Rectified signals: half-wave V_dc = 0.318V_m, V_r(rms) = 0.385V_m, r = 121%; full-wave V_dc = 0.636V_m, V_r(rms) = 0.308V_m, r = 48%. Full-wave is the better starting point.",
    steps: [
      { k: "learn", title: "The chain", b: [
        fig(chainFig()),
        ch(2, "02-diode-applications.html", "p5", "Chapter 2", "The rectifiers themselves."),
        `<div class="eq">r = V<sub>r</sub>(rms)/V<sub>dc</sub> × 100%    %V.R. = (V<sub>NL</sub> − V<sub>FL</sub>)/V<sub>FL</sub> × 100%</div>`,
      ]},
      { k: "play", title: "Rectified, not yet smooth", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const d = (k) => {
            const w = k ? (t) => Math.abs(Math.sin(TAU * t)) : (t) => Math.max(0, Math.sin(TAU * t)), dc = k ? 0.636 : 0.318;
            f.innerHTML = plot({ x: [0, 2], y: [0, 1.1], xt: [0, 1, 2], yt: [0, dc, 1], ytf: (v) => (v === 1 ? "V_m" : v === 0 ? "0" : fmt(v, 3) + "V_m"), xl: "time (cycles)", h: 210, series: [{ f: w, cls: "s1", n: 600 }, { f: () => dc, cls: "s5" }], label: "Rectified waveform and its dc level" });
            ro.innerHTML = readout([["V<sub>dc</sub>", k ? "0.636V<sub>m</sub>" : "0.318V<sub>m</sub>"], ["V<sub>r</sub>(rms)", k ? "0.308V<sub>m</sub>" : "0.385V<sub>m</sub>"], ["Ripple r", k ? "48%" : "121%"]]);
          };
          host.append(f, toggle(["Half-wave", "Full-wave"], d, 0), ro);
          d(0);
        },
        `<p>Half-wave has more ripple than dc. Full-wave doubles the dc and cuts the ripple to under half.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A supply reads 18 V dc and 0.9 V rms of ripple. Ripple in %?", a: 5, unit: "%", tol: 0.01, hint: "0.9/18.", why: "5%." },
        { t: "num", q: "15.6 V unloaded, 15 V at full load. Voltage regulation in %?", a: 4, unit: "%", tol: 0.01, hint: "(V_NL − V_FL)/V_FL.", why: "0.6/15 = 4%." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What do ripple and voltage regulation each tell you about a power supply?", model: "Ripple compares the leftover ac variation on the output with its dc level: smaller is smoother. Voltage regulation compares the no-load and full-load output voltages: smaller means the output holds steady when you draw current, closer to an ideal voltage source." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  /* Full-wave rectifier (60 Hz) into C with load RL. Returns samples over three half-cycles after settling. */
  function capFilter(Vm, C, RL) {
    const dt = 1e-5, pts = [];
    let v = Vm;
    for (let t = 0; t <= 0.05; t += dt) {
      const r = Vm * Math.abs(Math.sin(TAU * 60 * t));
      v = r > v ? r : v * Math.exp(-dt / (RL * C));
      if (t >= 0.025) pts.push([(t - 0.025) * 1000, v, r]);
    }
    return pts;
  }
  const p2 = {
    id: "p2", title: "The capacitor filter", mins: 30,
    blurb: "Charge to the peak, sag between peaks. Ripple, dc level and the price paid in diode current.",
    takeaway: "Diodes conduct for a short time T₁ near each peak, charging C to V_m; for T₂ the capacitor feeds the load and sags. Full-wave, 60 Hz line (I_dc in mA, C in µF, R_L in kΩ): V_r(rms) = I_dc/(4√3fC) = 2.4I_dc/C = 2.4V_dc/(R_LC); V_dc = V_m − I_dc/(4fC) = V_m − 4.17I_dc/C; r = 2.4I_dc/(CV_dc) × 100% = 2.4/(R_LC) × 100%. Triangular ripple: V_r(p) = √3V_r(rms), so V_dc = V_m − V_r(p) and the lowest point is V_m − 2V_r(p). Bigger C: less ripple, higher V_dc, but shorter T₁ and bigger peak diode current: I_peak = (T/T₁)I_dc (T = 1/120 s full-wave).",
    steps: [
      { k: "play", title: "Filter lab", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let C = 470e-6, RL = 100; const Vm = 20;
          function draw() {
            const pts = capFilter(Vm, C, RL), vmin = Math.min(...pts.map((p) => p[1])), Idc = (Vm - (Vm - vmin) / 2) / RL;
            const Vr = (2.4 * Idc * 1000) / (C * 1e6), Vdc = Vm - (4.17 * Idc * 1000) / (C * 1e6);
            f.innerHTML = plot({ x: [0, 25], y: [0, 22], xt: [0, 8.33, 16.67, 25], xtf: (v) => fmt(v, 3), yt: [0, 10, 20], xl: "t (ms)", yl: "volts", h: 230, series: [{ pts: pts.map((p) => [p[0], p[2]]), cls: "s5" }, { pts: pts.map((p) => [p[0], p[1]]), cls: "s1" }], label: "Capacitor-filter output over the rectified waveform" });
            ro.innerHTML = readout([["Load current I<sub>dc</sub> ≈", A(Idc)], ["V<sub>r</sub>(rms) = 2.4I<sub>dc</sub>/C", V(Vr)], ["V<sub>dc</sub> = V<sub>m</sub> − 4.17I<sub>dc</sub>/C", V(Vdc)], ["Ripple r", pct(Vr / Vdc)], ["Lowest point (simulated)", V(vmin)]]);
          }
          host.append(f, slider({ id: id + "-c", label: "Filter capacitor C", min: 10e-6, max: 4700e-6, log: true, value: C, show: (v) => si(v, "F") }, (v) => { C = v; draw(); }).el,
            slider({ id: id + "-r", label: "Load R_L", min: 20, max: 2000, log: true, value: RL, show: ohm }, (v) => { RL = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">V<sub>m</sub> = 20 V, full-wave, 60 Hz. Dashed: the rectified wave. Orange: across C. Heavier load or smaller C: deeper sag.</p>`,
      ]},
      { k: "learn", title: "The formulas (units matter)", b: [
        `<div class="eq">V<sub>r</sub>(rms) = 2.4I<sub>dc</sub>/C    V<sub>dc</sub> = V<sub>m</sub> − 4.17I<sub>dc</sub>/C    r = 2.4/(R<sub>L</sub>C) × 100%    (mA, µF, kΩ)</div>`,
        `<p>The ripple is roughly a triangle: V<sub>r</sub>(p) = √3V<sub>r</sub>(rms). The output sits between V<sub>m</sub> and V<sub>m</sub> − 2V<sub>r</sub>(p), with V<sub>dc</sub> mid-way.</p>`,
        `<p class="aside">Example 15.5 states C = 50 µF but its working uses 100 µF.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Full-wave, V<sub>m</sub> = 20 V, C = 470 µF, I<sub>dc</sub> = 200 mA.</p>`,
        { t: "num", q: "V_r(rms)?", a: 1.021, unit: "V", tol: 0.01, hint: "2.4 × 200/470.", why: "1.02 V." },
        { t: "num", q: "V_dc?", a: 18.23, unit: "V", tol: 0.01, hint: "20 − 4.17 × 200/470.", why: "18.2 V." },
        { t: "num", q: "Ripple in %?", a: 5.604, unit: "%", tol: 0.01, hint: "V_r(rms)/V_dc.", why: "5.6%." },
        { t: "num", q: "Lowest point of the output?", a: 16.46, unit: "V", tol: 0.01, hint: "V_m − 2√3V_r(rms).", why: "20 − 3.54 = 16.5 V." },
      ]},
      { k: "learn", title: "The cost: peak diode current", b: [
        `<div class="eq">I<sub>dc</sub> = (T<sub>1</sub>/T) I<sub>peak</sub>    ⇒    I<sub>peak</sub> = (T/T<sub>1</sub>) I<sub>dc</sub></div>`,
        `<p>All the charge for a whole cycle must go in during the short T<sub>1</sub>. A bigger C makes T<sub>1</sub> shorter, so the diodes see bigger current spikes.</p>`,
        { t: "num", q: "Full-wave (T = 8.33 ms), I_dc = 200 mA, diodes conduct for T₁ = 1 ms. I_peak?", a: 1.667, unit: "A", tol: 0.01, hint: "(T/T₁)I_dc.", why: "1.67 A: over eight times the load current." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why isn't a huge filter capacitor always the answer?", model: "A bigger capacitor does reduce the ripple and raise the dc level, but it also shortens the time near each peak during which the diodes conduct. They then have to deliver the whole cycle's charge in a shorter burst, so the peak diode current goes up, which stresses the diodes and transformer." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Adding an RC section", mins: 20,
    blurb: "A series R and a second capacitor: the dc drops a little, the ripple drops a lot.",
    takeaway: "An extra RC section after the capacitor filter passes the dc and attenuates the ripple. DC (capacitors open): V′_dc = [R_L/(R + R_L)]V_dc. AC: V′_r(rms) ≈ (X_C/R)V_r(rms), with X_C = 1.3/C at 120 Hz (C in µF, X_C in kΩ) for a full-wave rectifier. Analyse by superposition: dc and ac separately.",
    steps: [
      { k: "learn", title: "Two circuits in one", b: [
        fig(S.svg(460, 170, S.t(20, 60, "from C_1", { a: "start", cls: "s m" }) + S.wire([80, 50], [120, 50]) + S.res(120, 50, 220, 50, "R") + S.wire([220, 50], [330, 50]) + S.dot(260, 50) + S.cap(260, 50, 260, 130, "C_2", { side: "left" }) + S.dot(330, 50) + S.res(330, 50, 330, 130, "R_L", { side: "right" }) + S.wire([80, 130], [330, 130]) + S.gnd(200, 130) + S.t(400, 60, "V′_dc + V′_r", { cls: "a s" }), { max: 460, label: "RC filter section: series R, shunt C_2, then the load" })),
        `<div class="two"><div class="tile"><h3>DC: C<sub>2</sub> open</h3><div class="eq">V′<sub>dc</sub> = [R<sub>L</sub>/(R + R<sub>L</sub>)]V<sub>dc</sub></div></div><div class="tile"><h3>AC: C<sub>2</sub> small X<sub>C</sub></h3><div class="eq">V′<sub>r</sub> ≈ (X<sub>C</sub>/R)V<sub>r</sub>    X<sub>C</sub> = 1.3/C (kΩ, µF, 120 Hz)</div></div></div>`,
        seen("Superposition: handle each source separately.", "03-network-theorems.html#p6", "Chapter 3, Part 6"),
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>From the first filter: V<sub>dc</sub> = 40 V with 2 V rms ripple. RC section R = 220 Ω, C<sub>2</sub> = 47 µF, load 2.2 kΩ.</p>`,
        { t: "num", q: "V′_dc?", a: 36.36, unit: "V", tol: 0.01, hint: "40 × 2.2/2.42.", why: "36.4 V." },
        { t: "num", q: "X_C at 120 Hz, in Ω?", a: 27.66, unit: "Ω", tol: 0.01, hint: "1.3/47 kΩ.", why: "27.7 Ω." },
        { t: "num", q: "V′_r(rms)?", a: 0.2515, unit: "V", tol: 0.01, hint: "(X_C/R) × 2 V.", why: "0.25 V: eight times less ripple, for 10% less dc." },
        { t: "num", q: "New ripple in %?", a: 0.6915, unit: "%", tol: 0.01, hint: "V′_r/V′_dc.", why: "0.69%." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the RC section reduce the ripple much more than the dc?", model: "For dc the capacitor is open, so only the small drop across R against the load matters. For the 120 hertz ripple the capacitor's reactance is far smaller than R, so the ripple is divided down by roughly X_C over R, a big reduction." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  function seriesRegFig() {
    let s = S.dot(30, 60) + S.t(30, 48, "V_i", { cls: "c" }) + S.wire([30, 60], [272, 60]) + S.dot(130, 60) + S.res(130, 60, 130, 140, "R", { side: "left" }) + S.dot(130, 140);
    s += bjt(250, 110);
    s += S.wire([130, 140], [220, 140], [220, 110]) + S.diode(130, 220, 130, 140, "D_Z", { side: "left" }) + S.wire([130, 220], [130, 240]) + S.gnd(130, 240);
    s += S.wire([272, 160], [272, 180], [360, 180]) + S.dot(360, 180) + S.t(370, 185, "V_o = V_Z − V_BE", { a: "start", cls: "a s" }) + S.res(330, 180, 330, 240, "R_L", { side: "left" }) + S.dot(330, 180) + S.gnd(330, 240);
    return S.svg(500, 270, s, { max: 500, label: "Basic series regulator: a transistor in series with the load, its base held by a Zener" });
  }
  const p4 = {
    id: "p4", title: "Series regulators", mins: 30,
    blurb: "A transistor in series with the load, steered by comparing the output with a reference.",
    takeaway: "Series regulator: a series control element passes just enough of the input; a sampling circuit and comparator against a reference adjust it (output up → pass less; down → pass more). Basic (Zener holds Q₁'s base): V_o = V_Z − V_BE; V_CE = V_i − V_o; I_R = (V_i − V_Z)/R, I_L = V_o/R_L, I_B = I_L/β, I_Z = I_R − I_B. Improved (R₁–R₂ sample, Q₂ compares with the Zener): V_o = [(R₁ + R₂)/R₂](V_Z + V_BE2). Op-amp series regulator: V_o = (1 + R₁/R₂)V_Z. Current limiting: a small R_SC in the output; when its drop (≈ 0.7 V) turns Q₂ on, Q₂ steals Q₁'s base drive and caps the current. Foldback limiting (R₄–R₅ divider) reduces both current and voltage under overload.",
    steps: [
      { k: "learn", title: "The basic circuit", b: [
        fig(seriesRegFig()),
        `<p>The Zener pins the base at V<sub>Z</sub>; the emitter follows one V<sub>BE</sub> lower. If V<sub>o</sub> sags, V<sub>BE</sub> grows, Q<sub>1</sub> conducts more and pulls V<sub>o</sub> back up.</p>`,
        `<div class="eq">V<sub>o</sub> = V<sub>Z</sub> − V<sub>BE</sub>    I<sub>R</sub> = (V<sub>i</sub> − V<sub>Z</sub>)/R    I<sub>B</sub> = I<sub>L</sub>/β    I<sub>Z</sub> = I<sub>R</sub> − I<sub>B</sub></div>`,
        ch(2, "02-diode-applications.html", "p10", "Chapter 2", "The plain Zener regulator this improves on."),
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>V<sub>i</sub> = 18 V, V<sub>Z</sub> = 9.1 V, R = 330 Ω, β = 60, R<sub>L</sub> = 470 Ω.</p>`,
        { t: "num", q: "V_o?", a: 8.4, unit: "V", tol: 0.01, hint: "V_Z − 0.7 V.", why: "8.4 V." },
        { t: "num", q: "I_Z?", a: 26.67, unit: "mA", tol: 0.01, hint: "I_R = 26.97 mA, I_B = 17.87 mA/60.", why: "26.97 − 0.30 = 26.7 mA." },
      ]},
      { k: "learn", title: "Better versions", b: [
        `<div class="two"><div class="tile"><h3>Improved series</h3><p>R<sub>1</sub>, R<sub>2</sub> sample V<sub>o</sub>; Q<sub>2</sub> compares the sample with V<sub>Z</sub> and steers Q<sub>1</sub>'s base.</p><div class="eq">V<sub>o</sub> = [(R<sub>1</sub> + R<sub>2</sub>)/R<sub>2</sub>](V<sub>Z</sub> + V<sub>BE2</sub>)</div></div><div class="tile"><h3>Op-amp series</h3><p>The op-amp compares the sample with V<sub>Z</sub> and drives Q<sub>1</sub>.</p><div class="eq">V<sub>o</sub> = (1 + R<sub>1</sub>/R<sub>2</sub>)V<sub>Z</sub></div></div></div>`,
        ch(11, "11-op-amp-applications.html", "p1", "Part 1", "That's the noninverting gain, applied to V<sub>Z</sub>."),
        { t: "num", q: "Improved series: R₁ = 15 kΩ, R₂ = 10 kΩ, V_Z = 6.2 V. V_o?", a: 17.25, unit: "V", tol: 0.01, hint: "2.5 × (6.2 + 0.7).", why: "17.25 V." },
        { t: "num", q: "Op-amp series: R₁ = 18 kΩ, R₂ = 12 kΩ, V_Z = 5.1 V. V_o?", a: 12.75, unit: "V", tol: 0.01, hint: "(1 + 1.5) × 5.1.", why: "12.75 V." },
      ]},
      { k: "learn", title: "Protection", b: [
        `<p><b>Current limiting</b>: a small resistor R<sub>SC</sub> carries the load current. When its drop reaches about one V<sub>BE</sub>, Q<sub>2</sub> turns on and diverts Q<sub>1</sub>'s base current, so the load current can't rise further: I<sub>max</sub> ≈ 0.7 V/R<sub>SC</sub>.</p>`,
        `<p><b>Foldback limiting</b>: a divider R<sub>4</sub>–R<sub>5</sub> from the output makes Q<sub>2</sub> turn on harder as the output voltage falls, so under overload both current and voltage fold back, protecting the load and the regulator.</p>`,
        { t: "num", q: "R_SC = 1.2 Ω. Approximate current limit?", a: 583, unit: "mA", tol: 0.02, hint: "≈ 0.7 V/R_SC.", why: "About 0.58 A." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the basic series regulator hold its output steady?", model: "The Zener holds the transistor's base at a fixed voltage. The output is one base-emitter drop below that. If the output falls, the base-emitter voltage rises, the transistor conducts more and lifts the output; if it rises, the transistor conducts less. The transistor absorbs the difference between input and output." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  function shuntFig() {
    let s = S.dot(30, 50) + S.t(30, 38, "V_i", { cls: "c" }) + S.res(30, 50, 140, 50, "R_S") + S.wire([140, 50], [380, 50]) + S.dot(250, 50) + S.dot(380, 50) + S.t(388, 55, "V_L = V_Z + V_BE", { a: "start", cls: "a s" });
    s += S.wire([250, 50], [250, 60]) + bjt(228, 110) + S.wire([250, 160], [250, 220]) + S.diode(160, 110, 160, 50, "D_Z", { side: "left" }) + S.wire([160, 110], [198, 110]) + S.dot(160, 50);
    s += S.res(380, 50, 380, 220, "R_L", { side: "right" }) + S.wire([30, 220], [380, 220]) + S.gnd(300, 220);
    return S.svg(540, 255, s, { max: 540, label: "Basic shunt regulator: transistor across the load, Zener from output to its base" });
  }
  const p5 = {
    id: "p5", title: "Shunt and switching regulators", mins: 25,
    blurb: "Steal just enough current away from the load to hold its voltage. Or switch and filter for efficiency.",
    takeaway: "Shunt regulator: R_S drops the input; a control element in parallel with the load diverts current to hold V_L (output tries to rise → shunt more). Basic transistor shunt regulator: V_L = V_Z + V_BE; I_S = (V_i − V_L)/R_S; I_L = V_L/R_L; I_C = I_S − I_L (Zener and base current smaller by β). Improved (two transistors, larger load current): V_o = V_Z + V_BE2 + V_BE1. Op-amp shunt regulator: the op-amp compares a divider sample with V_Z and drives the shunt transistor. Switching regulator: passes the input to the load in pulses, then filters: complex but very efficient.",
    steps: [
      { k: "learn", title: "Shunt the excess", b: [
        fig(shuntFig()),
        `<div class="eq">V<sub>L</sub> = V<sub>Z</sub> + V<sub>BE</sub>    I<sub>S</sub> = (V<sub>i</sub> − V<sub>L</sub>)/R<sub>S</sub>    I<sub>C</sub> = I<sub>S</sub> − I<sub>L</sub></div>`,
        `<p>R<sub>S</sub> carries a fixed-ish current. Whatever the load doesn't take, the transistor takes. Load gets lighter → transistor takes more.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>V<sub>Z</sub> = 10 V, V<sub>i</sub> = 24 V, R<sub>S</sub> = 82 Ω, R<sub>L</sub> = 150 Ω.</p>`,
        { t: "num", q: "V_L?", a: 10.7, unit: "V", tol: 0.01, hint: "V_Z + V_BE.", why: "10.7 V." },
        { t: "num", q: "Collector current of the shunt transistor?", a: 90.87, unit: "mA", tol: 0.01, hint: "I_S = 13.3 V/82 Ω = 162 mA; I_L = 71.3 mA.", why: "162.2 − 71.3 = 90.9 mA." },
        { t: "mcq", q: "The load is disconnected. What happens to the transistor?", opts: [["It must carry all of I_S, its worst case", true, "All 162 mA, at 10.7 V: about 1.7 W."], ["It turns off", false, "It turns on harder."], ["Nothing changes", false, "The current has to go somewhere."]] },
      ]},
      { k: "learn", title: "Better shunts, and switching", b: [
        `<p>Two-transistor shunt: V<sub>o</sub> = V<sub>Z</sub> + V<sub>BE2</sub> + V<sub>BE1</sub>, with Q<sub>2</sub> boosting Q<sub>1</sub>'s base current for larger loads. An op-amp version compares a divider sample with V<sub>Z</sub>.</p>`,
        `<p><b>Switching regulators</b> chop the input into pulses and filter them. The switch is either fully on or fully off, so it wastes little power: much more efficient than a series or shunt element that drops the extra voltage as heat.</p>`,
        ch(12, "12-power-amplifiers.html", "p9", "Part 9", "Same idea as the class D amplifier."),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Compare a series regulator with a shunt regulator.", model: "A series regulator puts its control element in series with the load and drops the extra input voltage across it, passing only what the load needs. A shunt regulator puts its control element across the load and diverts excess current through a series resistor to hold the voltage. The shunt type wastes the most power at light load; the series type at a large input-output difference." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Three-terminal IC regulators", mins: 30,
    blurb: "IN, OUT, GND. The 78xx and 79xx families, their spec sheets, and checking the input never dips too low.",
    takeaway: "A regulator IC contains the reference, comparator, control element and overload protection. Three-terminal: unregulated V_i in, regulated V_o out, ground. Specs: input range, load regulation (output change with load current), line regulation (with input voltage). 78xx: fixed +5 to +24 V (7805, 7806, 7808, 7810, 7812, 7815, 7818, 7824, with minimum inputs 7.3, 8.3, 10.5, 12.5, 14.6, 17.7, 21.0, 27.1 V). 79xx: the negative versions. 7812 data: output 11.5–12.5 V, output regulation typically 4 mV (max 100 mV), short-circuit current 0.35 A, peak current 2.2 A (rated 1.5 A), dropout voltage 2 V: keep at least 2 V across the regulator. Design check: the filtered input's lowest point (V_m − 2V_r(p)) must stay above the IC's minimum input.",
    steps: [
      { k: "learn", title: "The 78 series", b: [
        `<div class="tbl"><table><tr><th>IC</th><th>V<sub>o</sub></th><th>Minimum V<sub>i</sub></th></tr><tr><td>7805</td><td>5 V</td><td>7.3 V</td></tr><tr><td>7806</td><td>6 V</td><td>8.3 V</td></tr><tr><td>7808</td><td>8 V</td><td>10.5 V</td></tr><tr><td>7810</td><td>10 V</td><td>12.5 V</td></tr><tr><td>7812</td><td>12 V</td><td>14.6 V</td></tr><tr><td>7815</td><td>15 V</td><td>17.7 V</td></tr><tr><td>7818</td><td>18 V</td><td>21.0 V</td></tr><tr><td>7824</td><td>24 V</td><td>27.1 V</td></tr></table></div>`,
        `<p>79xx parts do the same for negative outputs (the 7912 gives −12 V while its input is more negative than −14.6 V). C<sub>1</sub> at the input filters; C<sub>2</sub> at the output mostly kills high-frequency noise.</p>`,
      ]},
      { k: "learn", title: "Reading the 7812 sheet", b: [
        `<div class="two"><div class="tile"><h3>Output voltage</h3><p>11.5 V to 12.5 V, typically 12 V.</p></div><div class="tile"><h3>Output regulation</h3><p>Typically 4 mV change for 0.25–0.75 A, at most 100 mV.</p></div><div class="tile"><h3>Short-circuit current</h3><p>Limited to about 0.35 A.</p></div><div class="tile"><h3>Peak current</h3><p>About 2.2 A typical, though rated 1.5 A.</p></div><div class="tile"><h3>Dropout voltage</h3><p>2 V: the input must stay at least 2 V above the output.</p></div></div>`,
      ]},
      { k: "play", title: "Will it stay in regulation?", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let Idc = 0.3, C = 330e-6, ic = 2; const Vm = 20, mins = [["7808", 10.5], ["7810", 12.5], ["7812", 14.6], ["7815", 17.7]];
          function draw() {
            const vr = (2.4 * Idc * 1000) / (C * 1e6), vp = SQ3 * vr, vdc = Vm - vp, vlow = Vm - 2 * vp, need = mins[ic][1];
            f.innerHTML = plot({ x: [0, 25], y: [0, 22], xt: [0, 8.33, 16.67, 25], xtf: (v) => fmt(v, 3), yt: [0, need, Vm], ytf: (v) => fmt(v, 3), xl: "t (ms)", yl: "regulator input (V)", h: 220, series: [{ f: (t) => { const u = (t % 8.333) / 8.333; return u < 0.15 ? vlow + (Vm - vlow) * (u / 0.15) : Vm - (Vm - vlow) * ((u - 0.15) / 0.85); }, cls: "s1", n: 600 }, { f: () => need, cls: vlow >= need ? "s5" : "s4" }], label: "Filtered input sawtooth compared with the regulator minimum input" });
            ro.innerHTML = readout([["V<sub>r</sub>(rms) = 2.4I<sub>dc</sub>/C", V(vr)], ["V<sub>r</sub>(p) = √3V<sub>r</sub>(rms)", V(vp)], ["V<sub>dc</sub> = V<sub>m</sub> − V<sub>r</sub>(p)", V(vdc)], ["Lowest input V<sub>m</sub> − 2V<sub>r</sub>(p)", V(vlow)], [mins[ic][0] + " needs", fmt(need, 3) + " V: " + (vlow >= need ? "regulates" : "drops out")]]);
          }
          host.append(f, toggle(mins.map((m) => m[0]), (k) => { ic = k; draw(); }, 2),
            slider({ id: id + "-i", label: "Load current", min: 0.05, max: 1, step: 0.01, value: Idc, show: (v) => si(v, "A", 3) }, (v) => { Idc = v; draw(); }).el,
            slider({ id: id + "-c", label: "Filter C (V_m = 20 V)", min: 100e-6, max: 2200e-6, log: true, value: C, show: (v) => si(v, "F") }, (v) => { C = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Examples 15.13 and 15.14 take the lowest input as V<sub>m</sub> − V<sub>r</sub>(p) (15.13 even gets 8.35 V for both V<sub>dc</sub> and the minimum). With the book's own triangular ripple, V<sub>dc</sub> = V<sub>m</sub> − V<sub>r</sub>(p) is the middle, and the bottom is V<sub>m</sub> − 2V<sub>r</sub>(p). That's what this lab uses.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>V<sub>m</sub> = 20 V, C = 330 µF, I<sub>dc</sub> = 300 mA.</p>`,
        { t: "num", q: "Lowest point of the regulator input?", a: 12.44, unit: "V", tol: 0.01, hint: "V_r(rms) = 2.18 V; V_r(p) = 3.78 V; V_m − 2V_r(p).", why: "12.44 V." },
        { t: "mcq", q: "Can a 7810 regulate here?", opts: [["Just barely not: it needs 12.5 V", true, "12.44 V dips under 12.5 V at the bottom of each ripple. A bigger C or a lighter load fixes it."], ["Yes, easily", false, "Check the minimum: 12.5 V."], ["Only a 7812 would work", false, "A 7812 needs even more (14.6 V)."]] },
        { t: "num", q: "Same supply with a 7812 (needs 14.6 V). Highest load current that keeps regulation?", a: 214.3, unit: "mA", tol: 0.01, hint: "V_m − 2√3·2.4I/C ≥ 14.6.", why: "I ≤ 214 mA." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is dropout voltage and why does ripple matter for it?", model: "Dropout voltage is the minimum difference between the regulator's input and output, about 2 volts for a 78-series part. The filtered input isn't constant: it sags between peaks. Regulation is lost if even the lowest point of that ripple falls below the output plus the dropout voltage, so you check the bottom of the ripple, not the average." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  function lm317Fig() {
    let s = S.dot(30, 60) + S.t(30, 48, "V_i", { cls: "c" }) + S.wire([30, 60], [110, 60]) + S.box(110, 35, 120, 60, "LM317") + S.t(120, 52, "IN", { a: "start", cls: "s m" }) + S.t(220, 52, "OUT", { a: "end", cls: "s m" }) + S.t(170, 90, "ADJ", { cls: "s m" });
    s += S.wire([230, 60], [330, 60]) + S.dot(300, 60) + S.dot(330, 60) + S.t(338, 65, "V_o", { a: "start", cls: "a" }) + S.res(300, 60, 300, 140, "R_1 (V_ref across it)", { side: "right" }) + S.dot(300, 140) + S.wire([300, 140], [170, 140], [170, 95]) + S.res(300, 140, 300, 220, "R_2", { side: "right" }) + S.gnd(300, 220);
    return S.svg(470, 250, s, { max: 470, label: "LM317 with R_1 from OUT to ADJ and R_2 from ADJ to ground" });
  }
  const p7 = {
    id: "p7", title: "Adjustable regulators: the LM317", mins: 20,
    blurb: "Two resistors pick any output from 1.2 V to 37 V.",
    takeaway: "LM317: holds V_ref = 1.25 V between OUT and ADJ; a small I_adj (≈ 100 µA) flows out of ADJ. With R₁ from OUT to ADJ and R₂ from ADJ to ground: V_o = V_ref(1 + R₂/R₁) + I_adjR₂. Range 1.2 V to 37 V. Still needs about 2 V of headroom across it.",
    steps: [
      { k: "learn", title: "How it sets the output", b: [
        fig(lm317Fig()),
        `<p>The IC forces 1.25 V across R<sub>1</sub>, so R<sub>1</sub> carries 1.25 V/R<sub>1</sub>. That current (plus the small I<sub>adj</sub>) flows down R<sub>2</sub>:</p>`,
        `<div class="eq">V<sub>o</sub> = V<sub>ref</sub>(1 + R<sub>2</sub>/R<sub>1</sub>) + I<sub>adj</sub>R<sub>2</sub>    V<sub>ref</sub> = 1.25 V, I<sub>adj</sub> ≈ 100 µA</div>`,
      ]},
      { k: "play", title: "Turn R_2", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let R2 = 1500; const R1 = 220;
          function draw() { const a = 1.25 * (1 + R2 / R1), b = 1e-4 * R2; ro.innerHTML = readout([["1.25(1 + R<sub>2</sub>/R<sub>1</sub>)", V(a)], ["I<sub>adj</sub>R<sub>2</sub>", V(b)], ["V<sub>o</sub>", V(a + b)], ["Input needed (≈ V<sub>o</sub> + 2 V)", V(a + b + 2)]]); }
          host.append(slider({ id: id + "-r", label: "R_2 (R_1 = 220 Ω)", min: 0, max: 6000, step: 10, value: R2, show: ohm }, (v) => { R2 = v; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "R₁ = 220 Ω, R₂ = 1.5 kΩ. V_o?", a: 9.923, unit: "V", tol: 0.01, hint: "1.25 × 7.82 + 0.15 V.", why: "9.92 V." },
        { t: "num", q: "Design: 5 V out with R₁ = 240 Ω. R₂?", a: 706.4, unit: "Ω", tol: 0.01, hint: "1.25 + R₂(1.25/240 + 0.0001) = 5.", why: "706 Ω." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the LM317's output depend on R_2/R_1?", model: "The regulator keeps 1.25 volts between its output and adjust pins, which is across R_1, so a fixed current flows through R_1. That current also flows through R_2, so the output is 1.25 volts plus the drop across R_2: 1.25 times one plus R_2 over R_1, plus a small extra from the adjust-pin current." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Practical supplies and chargers", mins: 15,
    blurb: "From a capacitor-dropper to the switch-mode supply in your laptop charger.",
    takeaway: "Simple dc supply: a series capacitor drops the line voltage, then a rectifier and filter: cheap but no line isolation, must always draw some current, poor regulation. Transformer input: isolation and step-down; regulators then need heat sinks as power rises. Best linear supply: transformer, bridge, choke-and-capacitor filter, Zener reference, regulating transistor and op-amp feedback. Chopper (switch-mode) supply: line filter, rectify, chop the high dc at about 100 kHz under control of an IC that monitors the output, isolation transformer, rectify and filter: works over a wide input range, any line frequency, small, efficient, low heat. TV flyback supply: pulses at the 15 kHz horizontal rate into a step-up flyback transformer, rectified and filtered with a small capacitor (high frequency). Battery chargers: NiCad needs a supply above the battery voltage with current limiting; lead–acid needs the voltage held at the battery's rating.",
    steps: [
      { k: "learn", title: "A tour", b: [
        `<div class="two"><div class="tile"><h3>Capacitor dropper</h3><p>No transformer. Cheap, tiny current, no isolation from the mains.</p></div><div class="tile"><h3>Transformer + regulator</h3><p>Isolation and step-down. Heat sinks grow with power.</p></div><div class="tile"><h3>Chopper (switch-mode)</h3><p>Chop high dc at ~100 kHz, small transformer, feedback IC. Small, efficient, any input.</p></div><div class="tile"><h3>Flyback HV</h3><p>15 kHz pulses into a step-up transformer: small parts for kilovolts.</p></div></div>`,
        `<p>Higher frequency → smaller transformers and capacitors. That's why switch-mode supplies are so compact.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which supply fits?", bins: ["Capacitor dropper", "Chopper (switch-mode)", "Flyback"], items: [
          ["A night-light needing a few milliamps, cost above all", 0, "Tiny current, no isolation needed in a sealed unit."],
          ["A laptop charger that must work on 100–240 V, 50 or 60 Hz", 1, "Wide input range, independent of frequency."],
          ["Kilovolts for a picture tube", 2, "Step-up at the horizontal scan frequency."],
        ]},
        { t: "mcq", q: "Charging a lead–acid battery, what must the charger control?", opts: [["The voltage, so it doesn't exceed the battery's rating", true, "Lead–acid cells are charged at a held voltage."], ["Only the current, at any voltage", false, "That suits NiCad more."], ["Nothing: just connect a supply", false, "Overcharging damages it."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can a switch-mode supply be much smaller than a linear supply of the same power?", model: "Because it chops the dc at around 100 kilohertz instead of working at the 60 hertz line frequency. Transformers and filter capacitors needed for a given power shrink as the frequency rises, and the switching transistor wastes little power, so the heat sinks are small too." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edc15", eyebrow: "Boylestad · Chapter 15", title: "Power Supplies (Voltage Regulators)",
    intro: `<p>Eight parts: ripple and regulation, the capacitor filter, RC filter sections, series and shunt regulators (discrete and op-amp), switching regulators, three-terminal IC regulators, the adjustable LM317, and practical supplies.</p><p>It picks up where the rectifiers of Chapter 2 left off.</p><p class="aside">The "Computer Analysis" section isn't covered. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's problems in the book. They test whether the ideas stuck, so don't expect them to look like the examples here.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8],
    summary: `
      <h3>Measures</h3>
      <div class="eq">r = V<sub>r</sub>(rms)/V<sub>dc</sub>    %V.R. = (V<sub>NL</sub> − V<sub>FL</sub>)/V<sub>FL</sub>    half-wave: 0.318V<sub>m</sub>, 0.385V<sub>m</sub>, 121%    full-wave: 0.636V<sub>m</sub>, 0.308V<sub>m</sub>, 48%</div>
      <h3>Filters (mA, µF, kΩ; full-wave, 60 Hz)</h3>
      <div class="eq">V<sub>r</sub>(rms) = 2.4I<sub>dc</sub>/C = 2.4V<sub>dc</sub>/(R<sub>L</sub>C)    V<sub>dc</sub> = V<sub>m</sub> − 4.17I<sub>dc</sub>/C    r = 2.4/(R<sub>L</sub>C)    V<sub>r</sub>(p) = √3V<sub>r</sub>(rms)    I<sub>peak</sub> = (T/T<sub>1</sub>)I<sub>dc</sub></div>
      <div class="eq">RC section: V′<sub>dc</sub> = [R<sub>L</sub>/(R + R<sub>L</sub>)]V<sub>dc</sub>    V′<sub>r</sub> ≈ (X<sub>C</sub>/R)V<sub>r</sub>, X<sub>C</sub> = 1.3/C</div>
      <h3>Regulators</h3>
      <div class="eq">Series: V<sub>o</sub> = V<sub>Z</sub> − V<sub>BE</sub>; improved V<sub>o</sub> = [(R<sub>1</sub> + R<sub>2</sub>)/R<sub>2</sub>](V<sub>Z</sub> + V<sub>BE2</sub>); op-amp V<sub>o</sub> = (1 + R<sub>1</sub>/R<sub>2</sub>)V<sub>Z</sub>    Shunt: V<sub>L</sub> = V<sub>Z</sub> + V<sub>BE</sub>, I<sub>C</sub> = I<sub>S</sub> − I<sub>L</sub></div>
      <div class="eq">78xx/79xx: keep the input's lowest point above the minimum (dropout ≈ 2 V)    LM317: V<sub>o</sub> = 1.25(1 + R<sub>2</sub>/R<sub>1</sub>) + I<sub>adj</sub>R<sub>2</sub></div>`,
  };
  Course.start(window.CHAPTER);
})();
