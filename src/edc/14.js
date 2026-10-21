(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const ch = (n, file, part, where, html) => `<p class="aside">${html} <a href="${file}#${part}">Boylestad Chapter ${n}, ${where} →</a></p>`;
  const ohm = (r) => si(r, "Ω");
  const TAU = 2 * Math.PI, L10 = Math.log10, DEG = 180 / Math.PI;
  const hz = (f) => si(f, "Hz", 4);

  function fbFig() {
    let s = S.dot(20, 70) + S.t(20, 58, "V_s", { cls: "c" }) + S.wire([20, 70], [70, 70]) + `<circle class="el" cx="90" cy="70" r="20"/>` + S.t(90, 76, "Σ", { cls: "big" }) + S.t(74, 100, "−", { cls: "big" });
    s += S.wire([110, 70], [160, 70]) + S.t(135, 62, "V_i", { cls: "s m" }) + S.box(160, 40, 100, 60, "A") + S.wire([260, 70], [360, 70]) + S.dot(360, 70) + S.t(360, 58, "V_o", { cls: "a" });
    s += S.dot(320, 70) + S.wire([320, 70], [320, 150], [260, 150]) + S.box(160, 125, 100, 50, "β") + S.wire([160, 150], [90, 150], [90, 90]) + S.t(100, 140, "V_f = βV_o", { a: "start", cls: "s m" });
    return S.svg(400, 190, s, { max: 400, label: "Feedback amplifier block diagram: mixer, amplifier A and feedback network beta" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Feedback: trade gain for good behaviour", mins: 20,
    blurb: "Subtract a fraction of the output from the input. Lose gain, gain almost everything else.",
    takeaway: "A mixer subtracts the feedback signal V_f = βV_o from V_s; the amplifier sees V_i = V_s − V_f. Then V_o = AV_i = A(V_s − βV_o), so A_f = A/(1 + βA). Negative feedback (V_f opposing V_s) lowers the gain by (1 + βA) but gives higher input impedance (series), lower output impedance (voltage), better gain stability, wider frequency response, less noise and more linear operation. Positive feedback drives a circuit into oscillation.",
    steps: [
      { k: "learn", title: "The loop", b: [
        fig(fbFig()),
        `<div class="eq">V<sub>i</sub> = V<sub>s</sub> − βV<sub>o</sub>    V<sub>o</sub> = AV<sub>i</sub>    ⇒    A<sub>f</sub> = V<sub>o</sub>/V<sub>s</sub> = A/(1 + βA)</div>`,
        seen("Negative feedback around an op-amp: the gain becomes 1/β when A is huge.", "15-op-amp.html#p2", "Chapter 15, Part 2"),
        ch(10, "10-op-amps.html", "p5", "Part 5", "The same algebra gave −R<sub>f</sub>/R<sub>1</sub>."),
      ]},
      { k: "learn", title: "What you get for the lost gain", b: [
        `<div class="two"><div class="tile"><h3>Higher Z<sub>i</sub></h3><p>(series feedback)</p></div><div class="tile"><h3>Lower Z<sub>o</sub></h3><p>(voltage feedback)</p></div><div class="tile"><h3>Stable gain</h3><p>Set by β, not by the transistor.</p></div><div class="tile"><h3>Wider bandwidth</h3><p>Gain traded for frequency.</p></div><div class="tile"><h3>Less noise</h3><p>Reduced by (1 + βA).</p></div><div class="tile"><h3>More linear</h3><p>Distortion reduced too.</p></div></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A = 500, β = 0.04. A_f?", a: 23.81, tol: 0.01, hint: "1 + βA = 21.", why: "500/21 = 23.8, close to 1/β = 25." },
        { t: "mcq", q: "βA ≫ 1. A_f is about…", opts: [["1/β", true, "A cancels: A/(βA) = 1/β."], ["A", false, "That's with no feedback."], ["βA", false, "That's the loop gain."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does negative feedback make the gain depend on β rather than A?", model: "The gain with feedback is A over one plus beta A. When beta A is much bigger than one, the one is negligible and A cancels top and bottom, leaving one over beta. Beta is usually set by resistors, which are precise and stable, unlike the amplifier's own gain." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Four ways to connect feedback", mins: 25,
    blurb: "Sample voltage or current; return it in series or in shunt. Each choice moves Z_i and Z_o.",
    takeaway: "Voltage: the output voltage drives the feedback network. Current: the output current is sampled. Series: feedback voltage in series with the input. Shunt: feedback current in parallel with the input. Series raises input impedance: Z_if = Z_i(1 + βA). Shunt lowers it: Z_if = Z_i/(1 + βA). Voltage lowers output impedance: Z_of = Z_o/(1 + βA). Current raises it: Z_of = Z_o(1 + βA). Gains: voltage-series A_f = V_o/V_s (V/V), voltage-shunt V_o/I_s (Ω), current-series I_o/V_s (S), current-shunt I_o/I_s; each A_f = A/(1 + βA). Voltage-series gives high Z_i and low Z_o, ideal for cascades.",
    steps: [
      { k: "learn", title: "Two questions", b: [
        `<div class="tbl"><table><tr><th></th><th>Z<sub>if</sub></th><th>Z<sub>of</sub></th><th>A<sub>f</sub> is</th></tr><tr><td>Voltage-series</td><td>Z<sub>i</sub>(1 + βA) ↑</td><td>Z<sub>o</sub>/(1 + βA) ↓</td><td>V<sub>o</sub>/V<sub>s</sub></td></tr><tr><td>Current-series</td><td>Z<sub>i</sub>(1 + βA) ↑</td><td>Z<sub>o</sub>(1 + βA) ↑</td><td>I<sub>o</sub>/V<sub>s</sub></td></tr><tr><td>Voltage-shunt</td><td>Z<sub>i</sub>/(1 + βA) ↓</td><td>Z<sub>o</sub>/(1 + βA) ↓</td><td>V<sub>o</sub>/I<sub>s</sub></td></tr><tr><td>Current-shunt</td><td>Z<sub>i</sub>/(1 + βA) ↓</td><td>Z<sub>o</sub>(1 + βA) ↑</td><td>I<sub>o</sub>/I<sub>s</sub></td></tr></table></div>`,
        `<div class="key"><b>Input side:</b> series ↑, shunt ↓. <b>Output side:</b> voltage ↓, current ↑. Always by the factor (1 + βA).</div>`,
        `<p class="aside">After deriving Z<sub>if</sub> = Z<sub>i</sub>/(1 + βA), the book says it applies to "the voltage-series connection… and the voltage-shunt connection". Its own Table 14.2 shows it's the two <b>shunt</b> connections; series raises Z<sub>i</sub>.</p>`,
      ]},
      { k: "play", title: "Feedback lab (voltage-series)", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let b = 0.05; const A = -80, Zi = 12e3, Zo = 15e3;
          function draw() { const k = 1 + -b * A; ro.innerHTML = readout([["1 + βA (β = −" + fmt(b, 3) + ")", fmt(k, 4)], ["A<sub>f</sub> = A/(1 + βA)", fmt(A / k, 4)], ["Z<sub>if</sub> = Z<sub>i</sub>(1 + βA)", ohm(Zi * k)], ["Z<sub>of</sub> = Z<sub>o</sub>/(1 + βA)", ohm(Zo / k)]]); }
          host.append(slider({ id: id + "-b", label: "Feedback fraction |β| (A = −80, Z_i = 12 kΩ, Z_o = 15 kΩ)", min: 0, max: 0.5, step: 0.005, value: b, show: (v) => fmt(v, 3) }, (v) => { b = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">With an inverting amplifier, β is negative too, so βA is positive: still negative feedback.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Voltage-series: A = −80, β = −0.2, Z<sub>i</sub> = 12 kΩ, Z<sub>o</sub> = 15 kΩ.</p>`,
        { t: "num", q: "A_f?", a: -4.706, tol: 0.01, hint: "1 + βA = 1 + 16.", why: "−80/17 = −4.71." },
        { t: "num", q: "Z_if?", a: 204, unit: "kΩ", tol: 0.01, hint: "Z_i(1 + βA).", why: "204 kΩ." },
        { t: "num", q: "Z_of?", a: 882.4, unit: "Ω", tol: 0.01, hint: "Z_o/(1 + βA).", why: "882 Ω." },
        { t: "sort", q: "Which way does each change Z?", bins: ["Raises it", "Lowers it"], items: [["Series feedback, at the input", 0, "Z_i(1 + βA)."], ["Shunt feedback, at the input", 1, "Z_i/(1 + βA)."], ["Voltage feedback, at the output", 1, "Z_o/(1 + βA)."], ["Current feedback, at the output", 0, "Z_o(1 + βA)."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does voltage feedback lower the output impedance?", model: "If the load tries to pull the output voltage down, the feedback network feeds back less voltage, so the amplifier's input rises and drives the output back up. The output voltage barely changes when current is drawn, which is what a low output impedance means: lower by the factor one plus beta A." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Stable gain, wider bandwidth", mins: 20,
    blurb: "A 20% swing in A becomes a fraction of a percent in A_f. And the bandwidth stretches by (1 + βA).",
    takeaway: "Differentiating A_f = A/(1 + βA): |dA_f/A_f| = [1/|1 + βA|]·|dA/A| ≈ (1/|βA|)·|dA/A| for βA ≫ 1. With a resistive β, A_f ≈ 1/β doesn't depend on frequency, so frequency distortion drops. Noise and nonlinear distortion are reduced by (1 + βA) too (but extra stages to recover the gain can add noise back). Bandwidth: the upper 3-dB frequency rises and the lower falls; the gain–bandwidth product stays the same, so f_2f ≈ (1 + βA)f_2.",
    steps: [
      { k: "learn", title: "Gain stability", b: [
        `<div class="eq">|dA<sub>f</sub>/A<sub>f</sub>| = [1/|1 + βA|]·|dA/A| ≈ (1/|βA|)·|dA/A|</div>`,
        `<p>Temperature, ageing or a transistor swap changes A. Feedback divides that change by the loop gain.</p>`,
      ]},
      { k: "play", title: "Wiggle A", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let A = 2000; const b = 0.05;
          function draw() {
            const Af = A / (1 + b * A);
            f.innerHTML = plot({ x: [500, 4000], y: [0, 22], xt: [500, 1000, 2000, 3000, 4000], yt: [0, 10, 20], xl: "open-loop gain A", yl: "A_f", h: 210, series: [{ f: (x) => x / (1 + b * x), cls: "s1" }, { f: () => 1 / b, cls: "s5" }], marks: [{ x: A, y: Af }], label: "Closed-loop gain barely changes as A varies widely" });
            ro.innerHTML = readout([["A", fmt(A, 4)], ["A<sub>f</sub> (β = 0.05)", fmt(Af, 5)], ["1/β", "20"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "Open-loop gain A", min: 500, max: 4000, step: 10, value: A, show: (v) => fmt(v, 4) }, (v) => { A = v; draw(); }).el, ro);
          draw();
        },
        `<p>A doubles from 1000 to 2000; A<sub>f</sub> moves from 19.6 to 19.8.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A = 2000, β = 0.05, and A drifts by 15%. Change in A_f, in %?", a: 0.1485, unit: "%", tol: 0.01, hint: "15%/(1 + βA), with βA = 100.", why: "0.149% (0.15% with the 1/βA shortcut)." },
        { t: "num", q: "That amplifier's open-loop upper cutoff is 20 kHz. Upper cutoff with feedback?", a: 2.02, unit: "MHz", tol: 0.01, hint: "Gain–bandwidth stays the same: f_2 × (1 + βA).", why: "20 kHz × 101 = 2.02 MHz, at a gain of 19.8." },
      ]},
      { k: "learn", title: "Bandwidth", b: [
        fig(plot({ x: [0, 7], y: [0, 70], xt: [0, 1, 2, 3, 4, 5, 6, 7], xtf: (v) => si(Math.pow(10, v), "", 2).trim(), yt: [0, 20, 40, 60], xl: "f (Hz, log scale)", yl: "gain (dB)", h: 220, series: [{ f: (x) => 20 * L10(2000 / Math.hypot(1, Math.pow(10, x) / 2e4)), cls: "s5", n: 400 }, { f: (x) => { const f = Math.pow(10, x), Ar = 2000 / (1 + (f / 2e4) ** 2), Ai = (-2000 * (f / 2e4)) / (1 + (f / 2e4) ** 2); const nr = 1 + 0.05 * Ar, ni = 0.05 * Ai; return 20 * L10(Math.hypot(Ar, Ai) / Math.hypot(nr, ni)); }, cls: "s1", n: 400 }], texts: [{ x: 0.2, y: 8, s: "dashed: no feedback · orange: with feedback" }], label: "Feedback lowers the gain and extends the bandwidth" })),
        `<p>Same gain–bandwidth product: 100× less gain, 100× more bandwidth.</p>`,
        ch(9, "09-frequency-response.html", "p9", "Part 9", "The gain–bandwidth product."),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does negative feedback widen the bandwidth?", model: "At high frequencies the open-loop gain falls, but as long as beta A is still large, the closed-loop gain stays at about one over beta. Only when A has fallen so far that beta A approaches one does the closed-loop gain start to drop. That happens at a much higher frequency, by the factor one plus beta A, because the gain-bandwidth product is the same." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Feedback in real circuits", mins: 30,
    blurb: "A divider around an FET, an op-amp, an emitter follower, an unbypassed R_E, and a resistor from output to input.",
    takeaway: "Voltage-series, FET with divider R₁–R₂ from the output: A = −g_mR_L (R_L = R_D ∥ r_o ∥ (R₁ + R₂)), β = −R₂/(R₁ + R₂), A_f ≈ 1/β = −(R₁ + R₂)/R₂. Op-amp noninverting: β = R₂/(R₁ + R₂), A_f = A/(1 + βA) ≈ 1/β. Emitter follower: β = 1, A = h_feR_E/h_ie, A_f = h_feR_E/(h_ie + h_feR_E) ≈ 1. Current-series (unbypassed R_E): A = I_o/V_i = −h_fe/(h_ie + R_E), β = −R_E, A_f = A/(1 + βA) ≈ −h_fe/(h_ie + h_feR_E), A_vf = A_fR_C; Z_if ≈ h_ie + h_feR_E, Z_of = R_C(1 + βA). Voltage-shunt: op-amp inverting, β = −1/R_o, A_f = −R_o (transresistance), A_vf = −R_o/R₁. FET with R_F from drain to gate, source resistance R_S: A_vf = (−g_mR_D)·R_F/(R_F + g_mR_DR_S).",
    steps: [
      { k: "learn", title: "Voltage-series", b: [
        `<div class="two"><div class="tile"><h3>FET + divider</h3><p>R<sub>1</sub>, R<sub>2</sub> feed back V<sub>f</sub> = −R<sub>2</sub>V<sub>o</sub>/(R<sub>1</sub> + R<sub>2</sub>).</p><div class="eq">A = −g<sub>m</sub>R<sub>L</sub>    A<sub>f</sub> ≈ −(R<sub>1</sub> + R<sub>2</sub>)/R<sub>2</sub></div></div><div class="tile"><h3>Op-amp noninverting</h3><div class="eq">β = R<sub>2</sub>/(R<sub>1</sub> + R<sub>2</sub>)    A<sub>f</sub> ≈ 1/β</div></div><div class="tile"><h3>Emitter follower</h3><p>All of V<sub>o</sub> is fed back: β = 1.</p><div class="eq">A<sub>f</sub> = h<sub>fe</sub>R<sub>E</sub>/(h<sub>ie</sub> + h<sub>fe</sub>R<sub>E</sub>) ≈ 1</div></div></div>`,
        ch(5, "05-bjt-ac-analysis.html", "p5", "Part 5", "The follower's gain just under 1: this is why."),
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>FET with voltage-series feedback: g<sub>m</sub> = 3 mS, R<sub>D</sub> = 12 kΩ, r<sub>o</sub> = 12 kΩ, R<sub>1</sub> = 60 kΩ, R<sub>2</sub> = 15 kΩ (ignore R<sub>1</sub> + R<sub>2</sub> in R<sub>L</sub>).</p>`,
        { t: "num", q: "A without feedback?", a: -18, tol: 0.01, hint: "R_L = 12k ∥ 12k.", why: "−3 mS × 6 kΩ = −18." },
        { t: "num", q: "A_f?", a: -3.913, tol: 0.01, hint: "β = −0.2; 1 + βA = 4.6.", why: "−18/4.6 = −3.91 (1/β would say −5: βA isn't ≫ 1 here)." },
        { t: "num", q: "Op-amp: A = 200 000, R₁ = 4.7 kΩ, R₂ = 300 Ω. A_f?", a: 16.67, tol: 0.005, hint: "β = 0.06.", why: "16.665, essentially 1/β." },
      ]},
      { k: "learn", title: "Current-series: the unbypassed R_E", b: [
        `<p>The emitter current through R<sub>E</sub> makes a voltage that opposes the input: feedback proportional to the <b>output current</b>, in <b>series</b> with the input.</p>`,
        `<div class="eq">A = −h<sub>fe</sub>/(h<sub>ie</sub> + R<sub>E</sub>)    β = −R<sub>E</sub>    A<sub>f</sub> = A/(1 + βA)    A<sub>vf</sub> = A<sub>f</sub>R<sub>C</sub> ≈ −h<sub>fe</sub>R<sub>C</sub>/(h<sub>ie</sub> + h<sub>fe</sub>R<sub>E</sub>)</div>`,
        ch(5, "05-bjt-ac-analysis.html", "p4", "Part 4", "The same gain reduction, from the r<sub>e</sub> model."),
        { t: "num", q: "h_fe = 100, h_ie = 1.2 kΩ, R_E = 470 Ω, R_C = 3.3 kΩ. Voltage gain with feedback?", a: -6.781, tol: 0.02, hint: "A = −100/1670 S, β = −470 Ω, 1 + βA = 29.1; then × R_C.", why: "A_f = −2.05 mS, A_vf = −6.78 (the shortcut gives −6.85)." },
      ]},
      { k: "learn", title: "Voltage-shunt", b: [
        `<p>A resistor from output back to the input node returns a <b>current</b>. The op-amp inverting amplifier is the classic case: β = −1/R<sub>o</sub>, A<sub>f</sub> = −R<sub>o</sub> (a transresistance), A<sub>vf</sub> = −R<sub>o</sub>/R<sub>1</sub>.</p>`,
        `<div class="eq">FET with R<sub>F</sub>: A<sub>vf</sub> = (−g<sub>m</sub>R<sub>D</sub>)·R<sub>F</sub>/(R<sub>F</sub> + g<sub>m</sub>R<sub>D</sub>R<sub>S</sub>)</div>`,
        { t: "num", q: "g_m = 4 mS, R_D = 6.8 kΩ, source resistance R_S = 1.5 kΩ, R_F = 33 kΩ. A_vf?", a: -12.16, tol: 0.01, hint: "−g_mR_D = −27.2; g_mR_DR_S = 40.8 kΩ.", why: "−27.2 × 33/73.8 = −12.2." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is an unbypassed emitter resistor called current-series feedback?", model: "The voltage across R_E is set by the emitter current, which is essentially the output current. That voltage appears in series with the input signal in the base-emitter loop and opposes it. So the feedback samples the output current and returns a voltage in series with the input." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  /* Loop gain of a three-pole amplifier: βA = K/(1 + jw)^3, w normalized. */
  const loop = (K, w) => { const m = K / Math.pow(1 + w * w, 1.5), ph = -3 * Math.atan(w); return [m * Math.cos(ph), m * Math.sin(ph), m, ph]; };
  const p5 = {
    id: "p5", title: "When feedback turns positive: stability", mins: 30,
    blurb: "Phase shifts at high frequency can flip negative feedback to positive. Nyquist plots and margins tell you how close you are.",
    takeaway: "An amplifier's phase shift changes with frequency, so feedback that is negative in midband can become positive and the circuit may oscillate, even at frequencies outside the band of interest; a design must be stable at all frequencies. Nyquist plot: βA plotted on the complex plane as frequency rises (combining gain and phase Bode plots). Criterion: unstable if the curve encircles the −1 point (|βA| > 1 when the phase is 180°), stable otherwise. Gain margin GM = −|βA| in dB at the 180° frequency (0 dB is the border; any negative value of |βA| in dB is stable). Phase margin PM = 180° − |angle of βA| at the frequency where |βA| = 1 (0 dB).",
    steps: [
      { k: "learn", title: "Phase changes with frequency", b: [
        `<p>Midband, the fed-back signal opposes the input. But every pole adds phase shift as frequency rises. Three poles can add 180°: now the feedback <b>adds</b> to the input. If |βA| is still above 1 there, the circuit oscillates.</p>`,
        `<p class="aside">Harry Nyquist (Bell Labs) published the stability criterion in 1932.</p>`,
      ]},
      { k: "play", title: "Nyquist plot", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let K = 4;
          function draw() {
            const pts = []; for (let i = 0; i <= 400; i++) { const w = Math.pow(10, -2 + (i / 400) * 4), [x, y] = loop(K, w); pts.push([x, y]); }
            const mirror = pts.map(([x, y]) => [x, -y]), cross = loop(K, Math.sqrt(3)), wu = K > 1 ? Math.sqrt(Math.pow(K, 2 / 3) - 1) : null;
            const lim = Math.max(2, K * 1.1);
            f.innerHTML = plot({ x: [-lim * 0.6, lim], y: [-lim * 0.8, lim * 0.8], xt: [-1, 0, 1], yt: [0], ytf: () => "0", xl: "real (βA)", yl: "imag", h: 280, series: [{ pts, cls: "s1" }, { pts: mirror, cls: "s5" }], marks: [{ x: -1, y: 0, cls: "mkb", label: "−1" }, { x: cross[0], y: 0, cls: "mk2" }], label: "Nyquist plot of the loop gain with the minus-one point" });
            const pm = wu !== null ? 180 + loop(K, wu)[3] * DEG : null;
            ro.innerHTML = readout([["|βA| at 180°", fmt(K / 8, 4)], ["Encircles −1?", K > 8 ? "yes: unstable, it oscillates" : "no: stable"], ["Gain margin", fmt(-20 * L10(K / 8), 3) + " dB"], ["Phase margin", pm === null ? "—" : fmt(pm, 3) + "°"]]);
          }
          host.append(f, slider({ id: id + "-k", label: "Low-frequency loop gain (βA = K/(1 + jf/f_p)³)", min: 0.5, max: 16, step: 0.1, value: K, show: (v) => fmt(v, 3) }, (v) => { K = v; draw(); }).el, ro);
          draw();
        },
        `<p>The orange curve starts at K on the positive real axis (0°) and spirals in as frequency rises. It crosses the negative real axis (180°) at K/8. Push K past 8 and the curve wraps round −1.</p>`,
      ]},
      { k: "learn", title: "Gain and phase margins", b: [
        `<div class="two"><div class="tile"><h3>Gain margin</h3><p>At the frequency where the phase is 180°: GM = −20 log|βA|. Positive means room to spare; 0 dB is the edge.</p></div><div class="tile"><h3>Phase margin</h3><p>At the frequency where |βA| = 1: PM = 180° − |phase|. How much more phase lag would cause oscillation.</p></div></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Loop gain βA = 4/(1 + jf/f<sub>p</sub>)³.</p>`,
        { t: "num", q: "Gain margin in dB?", a: 6.021, unit: "dB", tol: 0.01, hint: "|βA| at 180° is 4/8.", why: "−20 log 0.5 = 6.02 dB." },
        { t: "num", q: "Phase margin?", a: 27.14, unit: "°", tol: 0.01, hint: "|βA| = 1 when (1 + w²)^1.5 = 4, so w = 1.233. Phase = −3 tan⁻¹ w.", why: "−152.9°, so PM = 27.1°." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does it mean for a Nyquist plot to encircle the −1 point?", model: "It means that at the frequency where the loop's phase shift reaches 180 degrees, the loop gain magnitude is greater than one. The fed-back signal is then in phase with the input and larger than it, so any disturbance grows: the amplifier oscillates." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Oscillators: Barkhausen", mins: 15,
    blurb: "Positive feedback with a loop gain of exactly one keeps a signal going with no input.",
    takeaway: "Oscillator: positive feedback with the right phase and |A_f| > 1. Sinusoidal oscillators give sines; pulse/square-wave oscillators switch between levels. Barkhausen criterion: βA = 1 (loop gain magnitude 1, total phase 0° or 360°) sustains oscillation with no input. In practice βA is made slightly greater than 1 so noise builds up into an oscillation; saturation then limits it to an average βA of 1. The closer βA is to 1, the purer the sine. Equivalently, in A_f = A/(1 + βA), βA = −1 makes the denominator 0 and the gain infinite.",
    steps: [
      { k: "learn", title: "Close the switch", b: [
        `<p>Imagine a signal V<sub>i</sub> at the amplifier input. After the amplifier and the feedback network it comes back as βAV<sub>i</sub>. If that's exactly V<sub>i</sub> (same size, same phase), you can remove the original and the loop keeps itself going.</p>`,
        `<div class="eq">βA = 1    (Barkhausen criterion)</div>`,
      ]},
      { k: "play", title: "From noise to oscillation", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let g = 1.1;
          function draw() {
            const env = (t) => Math.min(1, 0.03 * Math.exp((g - 1) * 3 * t));
            f.innerHTML = plot({ x: [0, 30], y: [-1.3, 1.3], xt: [0, 10, 20, 30], yt: [-1, 0, 1], xl: "cycles", h: 220, series: [{ f: (t) => { const e = env(t), v = Math.sin(TAU * t) * e * 1.15; return Math.max(-1, Math.min(1, v)); }, cls: "s1", n: 3000 }], label: "Oscillation building up from noise and then limited by saturation" });
          }
          host.append(f, slider({ id: id + "-g", label: "Loop gain βA", min: 0.8, max: 1.5, step: 0.01, value: g, show: (v) => fmt(v, 3) }, (v) => { g = v; draw(); }).el);
          draw();
        },
        `<p>Above 1, the tiny noise grows each trip round the loop until saturation clips it. Below 1, it dies away. Big βA: fast start but a flattened, less pure wave.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why is βA made a little greater than 1, not exactly 1?", opts: [["So noise grows into an oscillation; saturation then holds the average at 1", true, "Exactly 1 would never start reliably."], ["To make the output square", false, "That's a side effect of much bigger gain."], ["Because β can't be set precisely", false, "Not the reason."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "State the Barkhausen criterion and why it produces an oscillation.", model: "The loop gain beta A must equal one: magnitude one and zero total phase shift around the loop. Then whatever signal is at the input comes back around the loop exactly the same, so it sustains itself without any external input." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  /* Three-section RC network (series C, shunt R): transfer with x = 1/(wRC). */
  const ladder = (x) => { const re = 1 - 5 * x * x, im = x * x * x - 6 * x, m = 1 / Math.hypot(re, im), ph = (((-Math.atan2(im, re) * DEG) % 360) + 360) % 360; return [m, ph]; };
  function psFig() {
    let s = S.box(20, 60, 90, 60, "A") + S.t(65, 140, "amp (−)", { cls: "s m" }) + S.wire([110, 90], [140, 90]);
    [140, 230, 320].forEach((x, i) => { s += S.cap(x, 90, x + 60, 90, "C") + S.dot(x + 70, 90) + S.wire([x + 60, 90], [x + 90, 90]) + S.res(x + 70, 90, x + 70, 160, "R", { side: "right" }) + S.gnd(x + 70, 160); });
    s += S.wire([410, 90], [430, 90], [430, 30], [10, 30], [10, 90], [20, 90]) + S.t(220, 22, "fed back to the input: 180° and 1/29 at f", { cls: "s m" });
    return S.svg(460, 195, s, { max: 460, label: "Phase-shift oscillator: inverting amplifier and a three-section RC network" });
  }
  const p7 = {
    id: "p7", title: "Phase-shift oscillator", mins: 25,
    blurb: "An inverting amplifier plus three RC sections that add another 180° at one frequency.",
    takeaway: "Three RC sections (ideal source, open load) give exactly 180° at f = 1/(2πRC√6), where β = 1/29. With the amplifier's own 180° the loop is 360°; oscillation needs A > 29. The sections load each other, so they don't each give 60°. FET version: |A| = g_mR_L with R_L = R_D ∥ r_d, made somewhat above 29 to allow for loading. BJT version (voltage-shunt feedback through R into the transistor's input resistance): f = (1/2πRC)·1/√(6 + 4R_C/R), h_fe > 23 + 29R/R_C + 4R_C/R. Op-amp version: gain set by R_i and R_f above 29, frequency from Eq. 14.33.",
    steps: [
      { k: "learn", title: "180° from three RCs", b: [
        fig(psFig()),
        `<div class="eq">f = 1/(2πRC√6)    β = 1/29    need A &gt; 29</div>`,
      ]},
      { k: "play", title: "Find the 180° frequency", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let lf = 2.6; const R = 6.8e3, C = 10e-9, f0 = 1 / (TAU * R * C * Math.sqrt(6));
          function draw() {
            const fr = Math.pow(10, lf), [m, ph] = ladder(1 / (TAU * fr * R * C));
            f.innerHTML = plot({ x: [2, 4], y: [0, 280], xt: [2, 3, 4], xtf: (v) => si(Math.pow(10, v), "", 2).trim(), yt: [0, 90, 180, 270], xl: "f (Hz, log scale)", yl: "phase shift (°)", h: 230, series: [{ f: (x) => ladder(1 / (TAU * Math.pow(10, x) * R * C))[1], cls: "s1" }, { f: () => 180, cls: "s5" }], marks: [{ x: lf, y: ph }, { x: Math.log10(f0), y: 180, cls: "mk2" }], label: "Phase shift of the three-section RC network against frequency" });
            ro.innerHTML = readout([["f", hz(fr)], ["Phase shift of the network", fmt(ph, 4) + "°"], ["Attenuation |β|", "1/" + fmt(1 / m, 4)], ["f = 1/(2πRC√6)", hz(f0)]]);
          }
          host.append(f, slider({ id: id + "-f", label: "Frequency (R = 6.8 kΩ, C = 10 nF)", min: 2, max: 4, step: 0.005, value: lf, show: (v) => hz(Math.pow(10, v)) }, (v) => { lf = v; draw(); }).el, ro);
          draw();
        },
        `<p>Slide to the blue dot: exactly 180°, and the network passes 1/29 of its input. The amplifier must make that up.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "R = 6.8 kΩ, C = 10 nF. Oscillation frequency?", a: 955.5, unit: "Hz", tol: 0.01, hint: "1/(2πRC√6).", why: "956 Hz." },
        { t: "num", q: "Design: R = 8.2 kΩ, f = 800 Hz. C?", a: 9.905, unit: "nF", tol: 0.01, hint: "C = 1/(2πRf√6).", why: "9.9 nF (use 10 nF)." },
        { t: "num", q: "FET version: g_m = 6 mS, r_d = 50 kΩ, target |A| = 45. R_D?", a: 8.824, unit: "kΩ", tol: 0.01, hint: "R_L = 45/6 mS = 7.5 kΩ = R_D ∥ 50 kΩ.", why: "8.82 kΩ." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must the amplifier in a phase-shift oscillator have a gain of at least 29?", model: "At the one frequency where the three RC sections add up to 180 degrees of phase shift, they also attenuate the signal to one twenty-ninth. For the loop gain to reach one, the amplifier has to multiply by at least 29." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Wien bridge oscillator", mins: 20,
    blurb: "A bridge of R's and C's around an op-amp. Zero phase at one frequency, and a gain of 3 to sustain it.",
    takeaway: "Wien bridge: R₁, C₁ (series) and R₂, C₂ (parallel) set the frequency; R₃, R₄ set the gain. The op-amp output drives the bridge; the bridge output drives the op-amp inputs. Balance: R₃/R₄ = R₁/R₂ + C₂/C₁ and f_o = 1/(2π√(R₁C₁R₂C₂)). With R₁ = R₂ = R and C₁ = C₂ = C: f_o = 1/(2πRC) and R₃/R₄ = 2; a ratio a little above 2 makes it oscillate.",
    steps: [
      { k: "learn", title: "The bridge", b: [
        `<p>The frequency arm is a series RC feeding a parallel RC. At one frequency the arm's output is exactly <b>in phase</b> with its input and one-third as big. The op-amp (noninverting, gain 1 + R<sub>3</sub>/R<sub>4</sub>) supplies the 3.</p>`,
        `<div class="eq">f<sub>o</sub> = 1/(2π√(R<sub>1</sub>C<sub>1</sub>R<sub>2</sub>C<sub>2</sub>))    R<sub>3</sub>/R<sub>4</sub> = R<sub>1</sub>/R<sub>2</sub> + C<sub>2</sub>/C<sub>1</sub>    equal parts: f<sub>o</sub> = 1/(2πRC), R<sub>3</sub>/R<sub>4</sub> = 2</div>`,
      ]},
      { k: "play", title: "The frequency arm", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let R = 12e3, C = 4.7e-9;
          function draw() {
            const f0 = 1 / (TAU * R * C), mag = (fr) => { const q = TAU * fr * R * C - 1 / (TAU * fr * R * C); return 1 / Math.hypot(3, q); };
            f.innerHTML = plot({ x: [1, 6], y: [0, 0.4], xt: [1, 2, 3, 4, 5, 6], xtf: (v) => si(Math.pow(10, v), "", 2).trim(), yt: [0, 0.1, 0.2, 1 / 3], ytf: (v) => (v > 0.3 ? "1/3" : fmt(v)), xl: "f (Hz, log scale)", yl: "|β|", h: 220, series: [{ f: (x) => mag(Math.pow(10, x)), cls: "s1" }], marks: [{ x: Math.log10(f0), y: 1 / 3, label: "f_o = " + si(f0, "Hz", 3) }], label: "Wien network transfer peaking at one third at f_o" });
          }
          host.append(f, slider({ id: id + "-r", label: "R", min: 1e3, max: 100e3, log: true, value: R, show: ohm }, (v) => { R = v; draw(); }).el,
            slider({ id: id + "-c", label: "C", min: 0.1e-9, max: 100e-9, log: true, value: C, show: (v) => si(v, "F") }, (v) => { C = v; draw(); }).el);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "R = 12 kΩ, C = 4.7 nF (equal values). f_o?", a: 2822, unit: "Hz", tol: 0.01, hint: "1/(2πRC).", why: "2.82 kHz." },
        { t: "num", q: "Design 5 kHz with C = 10 nF. R?", a: 3183, unit: "Ω", tol: 0.01, hint: "R = 1/(2πf_oC).", why: "3.18 kΩ." },
        { t: "mcq", q: "R₄ = 10 kΩ. Which R₃ makes it oscillate?", opts: [["22 kΩ", true, "Ratio 2.2: just above 2."], ["15 kΩ", false, "1.5 < 2: the oscillation dies."], ["10 kΩ", false, "Ratio 1."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a Wien bridge oscillator need R_3/R_4 of about 2?", model: "At the oscillation frequency the RC arm passes one third of the output back with zero phase shift. A noninverting op-amp gain of three, which is one plus R_3 over R_4 with that ratio equal to two, brings the loop gain to one. Slightly more than two makes it start." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  function tankFig(kind) {
    const lab = kind === "C" ? ["X_1: C_1", "X_2: C_2", "X_3: L"] : ["X_1: L_1", "X_2: L_2", "X_3: C"];
    let s = S.box(150, 20, 100, 50, "amplifier") + S.wire([150, 45], [80, 45], [80, 110]) + S.wire([250, 45], [320, 45], [320, 110]);
    s += S.dot(80, 110) + S.dot(320, 110) + S.wire([80, 110], [140, 110]) + S.wire([260, 110], [320, 110]);
    s += (kind === "C" ? S.ind(140, 110, 260, 110, lab[2]) : S.cap(140, 110, 260, 110, lab[2], { side: "below" }));
    s += (kind === "C" ? S.cap(80, 110, 80, 190, lab[0], { side: "left" }) + S.cap(320, 110, 320, 190, lab[1], { side: "right" }) : S.ind(80, 110, 80, 190, lab[0], { side: "left" }) + S.ind(320, 110, 320, 190, lab[1], { side: "right" }));
    s += S.wire([80, 190], [80, 210], [320, 210], [320, 190]) + S.gnd(200, 210);
    return S.svg(420, 245, `<g transform="translate(10,0)">${s}</g>`, { max: 420, label: kind === "C" ? "Colpitts: two capacitors to ground and an inductor across" : "Hartley: two inductors to ground and a capacitor across" });
  }
  const p9 = {
    id: "p9", title: "LC oscillators: Colpitts and Hartley", mins: 20,
    blurb: "A resonant tank sets the frequency. Capacitor divider: Colpitts. Inductor divider: Hartley.",
    takeaway: "Basic resonant oscillator: X₁ and X₂ from the amplifier's input and output to ground, X₃ between them. Colpitts: X₁, X₂ capacitors, X₃ an inductor: f_o = 1/(2π√(LC_eq)), C_eq = C₁C₂/(C₁ + C₂). Hartley: X₁, X₂ inductors (with mutual inductance M), X₃ a capacitor: f_o = 1/(2π√(L_eqC)), L_eq = L₁ + L₂ + 2M. Tuned-input, tuned-output: an LC tank in each. FET, BJT and op-amp versions all use the same frequency formulas.",
    steps: [
      { k: "learn", title: "One shape, two choices", b: [
        (host) => { const f = el(`<div class="fig"></div>`); const d = (k) => { f.innerHTML = tankFig(k ? "L" : "C"); }; host.append(f, toggle(["Colpitts (C, C, L)", "Hartley (L, L, C)"], d, 0)); d(0); },
        `<div class="eq">Colpitts: f<sub>o</sub> = 1/(2π√(LC<sub>eq</sub>)), C<sub>eq</sub> = C<sub>1</sub>C<sub>2</sub>/(C<sub>1</sub> + C<sub>2</sub>)    Hartley: f<sub>o</sub> = 1/(2π√(L<sub>eq</sub>C)), L<sub>eq</sub> = L<sub>1</sub> + L<sub>2</sub> + 2M</div>`,
        seen("LC resonance: ω₀ = 1/√(LC).", "14-resonance.html#p1", "Chapter 14"),
        `<p class="aside">C<sub>1</sub> and C<sub>2</sub> are in series around the tank, hence the series formula. Edwin Colpitts and Ralph Hartley both worked for Western Electric/Bell around 1915.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Colpitts: L = 50 µH, C₁ = 1 nF, C₂ = 4.7 nF. f_o?", a: 783.8, unit: "kHz", tol: 0.01, hint: "C_eq = 1 × 4.7/5.7 nF = 825 pF.", why: "784 kHz." },
        { t: "num", q: "Hartley: L₁ = 200 µH, L₂ = 40 µH, M = 10 µH, C = 470 pF. f_o?", a: 455.3, unit: "kHz", tol: 0.01, hint: "L_eq = 260 µH.", why: "455 kHz." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What sets the frequency of a Colpitts oscillator?", model: "The resonant frequency of its tank: the inductor resonating with the two capacitors in series. The amplifier just makes up the losses; the oscillation happens where the tank gives the right phase shift, at one over two pi root L times C1 C2 over C1 plus C2." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  function xtalFig() {
    let s = S.wire([40, 40], [120, 40]) + S.res(120, 40, 190, 40, "R") + S.ind(190, 40, 270, 40, "L") + S.cap(270, 40, 340, 40, "C") + S.wire([340, 40], [420, 40]);
    s += S.dot(80, 40) + S.dot(380, 40) + S.wire([80, 40], [80, 110], [195, 110]) + S.cap(195, 110, 265, 110, "C_M", { side: "below" }) + S.wire([265, 110], [380, 110], [380, 40]) + S.dot(40, 40) + S.dot(420, 40);
    return S.svg(460, 160, s, { max: 460, label: "Crystal equivalent circuit: series R, L, C with a mounting capacitance C_M in parallel" });
  }
  const p10 = {
    id: "p10", title: "Crystal and unijunction oscillators", mins: 25,
    blurb: "Quartz for rock-steady frequency. A unijunction transistor for a cheap relaxation oscillator.",
    takeaway: "Quartz crystal: piezoelectric (stress gives voltage and vice versa) with a sharp mechanical resonance. Equivalent circuit: series R (friction), L (mass), C (compliance), with C_M (mounting) in parallel. Q typically 20 000, up to about 10⁶. Two resonances: series (series leg's reactances cancel; impedance minimum, = R) and, slightly higher, parallel/antiresonance (series leg's reactance equals C_M's; impedance maximum). Series-resonant circuits put the crystal in the feedback path (feedback largest at series resonance); parallel-resonant circuits use it as the inductor of a Colpitts-type tank (e.g. the Miller oscillator). Op-amp crystal oscillator with Zener limiting gives a square wave. Frequency stability comes from the crystal, not the transistor or supply. Unijunction relaxation oscillator: C_T charges through R_T until V_E reaches V_P (≈ ηV_BB plus a diode drop); the UJT fires and discharges C_T: sawtooth at the emitter, pulses at the bases. f_o ≈ 1/[R_TC_T ln(1/(1 − η))]; with η = 0.5, f_o ≈ 1.44/(R_TC_T). η is typically 0.4–0.6.",
    steps: [
      { k: "learn", title: "Inside a crystal", b: [
        fig(xtalFig()),
        `<p>L, C and R stand for the crystal's mass, springiness and friction. R is tiny, so Q is enormous (20 000 is typical). Two resonances, close together:</p>`,
        `<div class="two"><div class="tile"><h3>Series resonance</h3><p>X<sub>L</sub> = X<sub>C</sub> in the series leg: impedance minimum (just R). Use it in a feedback path.</p></div><div class="tile"><h3>Parallel (anti-) resonance</h3><p>Slightly higher: the leg resonates with C<sub>M</sub>. Impedance maximum. Use the crystal as a tank inductor.</p></div></div>`,
        `<p>The circuit's frequency is held by the crystal. Supply changes or transistor drift barely move it: that's why radios and clocks use crystals.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A crystal in the series feedback path from collector to base. At what frequency is the feedback largest?", opts: [["Its series-resonant frequency", true, "Impedance is minimum there."], ["Its parallel-resonant frequency", false, "That's where it blocks most."], ["Any frequency: crystals are resistive", false, "No."]] },
      ]},
      { k: "play", title: "Unijunction relaxation oscillator", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let eta = 0.6; const RT = 47e3, CT = 0.1e-6;
          function draw() {
            const T = RT * CT * Math.log(1 / (1 - eta)), saw = (t) => 1 - Math.exp(-((t % T) / (RT * CT)));
            f.innerHTML = plot({ x: [0, 4 * T], y: [0, 1], xt: [0, T, 2 * T, 3 * T, 4 * T], xtf: (v) => si(v, "s", 2), yt: [0, eta, 1], ytf: (v) => (v === 0 ? "0" : v === 1 ? "V_BB" : "V_P"), xl: "t", h: 210, series: [{ f: saw, cls: "s1", n: 1200 }, { f: () => eta, cls: "s5" }], label: "Sawtooth at the UJT emitter: charging to V_P then discharging" });
            ro.innerHTML = readout([["η", fmt(eta, 3)], ["f<sub>o</sub> = 1/[R<sub>T</sub>C<sub>T</sub> ln(1/(1 − η))]", hz(1 / T)]]);
          }
          host.append(f, slider({ id: id + "-e", label: "Stand-off ratio η (R_T = 47 kΩ, C_T = 0.1 µF)", min: 0.4, max: 0.8, step: 0.01, value: eta, show: (v) => fmt(v, 2) }, (v) => { eta = v; draw(); }).el, ro);
          draw();
        },
        `<div class="eq">f<sub>o</sub> ≈ 1/[R<sub>T</sub>C<sub>T</sub> ln(1/(1 − η))]    η = 0.5: f<sub>o</sub> ≈ 1.44/(R<sub>T</sub>C<sub>T</sub>)</div>`,
        ch(17, "17-pnpn-devices.html", "p6", "Part 6", "The unijunction transistor itself."),
        { t: "num", q: "R_T = 47 kΩ, C_T = 0.1 µF, η = 0.6. f_o?", a: 232.2, unit: "Hz", tol: 0.01, hint: "ln(1/0.4) = 0.916.", why: "1/(4.7 ms × 0.916) = 232 Hz." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is a crystal oscillator so stable in frequency?", model: "Because the frequency is set by the mechanical resonance of the quartz, which has an extremely high Q, tens of thousands or more. Its impedance changes so sharply near resonance that the circuit can only oscillate in a very narrow band, regardless of the transistor or supply voltage." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edc14", eyebrow: "Boylestad · Chapter 14", title: "Feedback and Oscillator Circuits",
    intro: `<p>Ten parts: negative feedback and its four connection types, gain stability and bandwidth, practical feedback circuits, stability (Nyquist, gain and phase margins), then oscillators: Barkhausen, phase-shift, Wien bridge, Colpitts and Hartley, crystal and unijunction.</p><p>It builds on 6.002 Chapter 15 (op-amp feedback) and Chapter 14 (resonance).</p><p class="aside">The "Computer Analysis" section isn't covered. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's problems in the book. They test whether the ideas stuck, so don't expect them to look like the examples here.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10],
    summary: `
      <h3>Negative feedback</h3>
      <div class="eq">A<sub>f</sub> = A/(1 + βA) ≈ 1/β    series: Z<sub>if</sub> = Z<sub>i</sub>(1 + βA)    shunt: Z<sub>if</sub> = Z<sub>i</sub>/(1 + βA)    voltage: Z<sub>of</sub> = Z<sub>o</sub>/(1 + βA)    current: Z<sub>of</sub> = Z<sub>o</sub>(1 + βA)</div>
      <div class="eq">|dA<sub>f</sub>/A<sub>f</sub>| = |dA/A|/|1 + βA| ≈ |dA/A|/|βA|    bandwidth × (1 + βA), same gain–bandwidth product</div>
      <h3>Circuits</h3>
      <div class="eq">FET voltage-series: A<sub>f</sub> ≈ −(R<sub>1</sub> + R<sub>2</sub>)/R<sub>2</sub>    follower β = 1    unbypassed R<sub>E</sub>: A<sub>vf</sub> ≈ −h<sub>fe</sub>R<sub>C</sub>/(h<sub>ie</sub> + h<sub>fe</sub>R<sub>E</sub>)    FET with R<sub>F</sub>: A<sub>vf</sub> = (−g<sub>m</sub>R<sub>D</sub>)R<sub>F</sub>/(R<sub>F</sub> + g<sub>m</sub>R<sub>D</sub>R<sub>S</sub>)</div>
      <h3>Stability</h3>
      <p>Unstable if the Nyquist plot of βA encircles −1. GM = −20 log|βA| at 180°; PM = 180° − |∠βA| where |βA| = 1.</p>
      <h3>Oscillators</h3>
      <div class="eq">Barkhausen βA = 1    phase-shift f = 1/(2πRC√6), β = 1/29, A &gt; 29    Wien f<sub>o</sub> = 1/(2π√(R<sub>1</sub>C<sub>1</sub>R<sub>2</sub>C<sub>2</sub>)), equal: 1/(2πRC), R<sub>3</sub>/R<sub>4</sub> = 2</div>
      <div class="eq">Colpitts f<sub>o</sub> = 1/(2π√(LC<sub>eq</sub>)), C<sub>eq</sub> = C<sub>1</sub>C<sub>2</sub>/(C<sub>1</sub> + C<sub>2</sub>)    Hartley L<sub>eq</sub> = L<sub>1</sub> + L<sub>2</sub> + 2M    UJT f<sub>o</sub> ≈ 1/[R<sub>T</sub>C<sub>T</sub> ln(1/(1 − η))]</div>`,
  };
  Course.start(window.CHAPTER);
})();
