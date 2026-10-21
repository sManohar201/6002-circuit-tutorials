(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;
  const tbl = (head, rows) => `<div class="tbl"><table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`;
  const sup = (v) => String(v).replace("-", "⁻").replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);
  /* Harmonic amplitudes 1..K of one period of samples. */
  function harmonics(ys, K) {
    const N = ys.length, out = [];
    for (let k = 1; k <= K; k++) { let c = 0, s = 0; ys.forEach((y, n) => { c += y * Math.cos((2 * Math.PI * k * n) / N); s += y * Math.sin((2 * Math.PI * k * n) / N); }); out.push((2 / N) * Math.hypot(c, s)); }
    return out;
  }
  /* Classic block diagram: x → (+/−) → A → y, with β back to the summer. */
  const loop = (o = {}) => S.svg(500, 170, S.t(26, 70, "x", { cls: "lab" }) + S.wire([40, 65], [90, 65]) + `<circle cx="110" cy="65" r="20" style="fill:none;stroke:var(--ink);stroke-width:2.5"/>` + S.t(110, 72, "Σ", { cls: "big" }) + S.t(84, 56, "+", { cls: "lab" }) + S.t(122, 98, o.pos ? "+" : "−", { cls: "lab" }) +
    S.wire([130, 65], [200, 65]) + S.t(165, 56, "e", { cls: "lab" }) + S.box(200, 40, 80, 50, "A") + S.wire([280, 65], [400, 65]) + S.dot(360, 65) + S.t(420, 70, "y", { a: "start", cls: "lab" }) + S.wire([360, 65], [360, 140], [290, 140]) + S.box(210, 120, 80, 40, "β") + S.wire([210, 140], [110, 140], [110, 85]) + S.arrow(110, 100, 110, 87), { label: "Feedback loop: input x minus beta times y gives error e, which A amplifies to y" });

  const p1 = {
    id: "p1", title: "The loop: A, β and loop gain", mins: 25,
    blurb: "Amplify the difference between what you want and what you have. With enough gain, the result is set by the feedback network, not the amplifier.",
    takeaway: "Negative feedback: e = x − βy, y = A·e. Solving: y/x = A/(1 + Aβ). The loop gain T = Aβ is the gain all the way round the loop. When T ≫ 1, y/x ≈ 1/β: the closed-loop gain is set by β (usually a resistor or capacitor ratio, accurate) instead of A (large, but sloppy). The error left at the input is e = x/(1 + T): feedback drives it towards zero. Gain error ≈ 1/T (Module 29).",
    steps: [
      { k: "learn", title: "The loop", b: [
        fig(loop()),
        steps([["Error", "e = x − βy"], ["Amplifier", "y = A·e = A(x − βy)"], ["Collect y", "y(1 + Aβ) = Ax"], ["Closed-loop gain", "G = y/x = A/(1 + Aβ)"]]),
        `<div class="eq">T = Aβ  (loop gain)     G = A/(1 + T) ≈ 1/β when T ≫ 1</div>`,
      ]},
      { k: "play", title: "Turn up the open-loop gain", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let lA = 2, b = 0.1;
          function draw() {
            const A = 10 ** lA, T = A * b, G = A / (1 + T);
            f.innerHTML = plot({ x: [0, 6], y: [0, 1.2 / b], xt: [0, 1, 2, 3, 4, 5, 6], xtf: (v) => "10" + sup(v), yt: [0, 0.5 / b, 1 / b], xl: "open-loop gain A (log)", yl: "closed-loop gain", h: 210, series: [{ f: (x) => 10 ** x / (1 + 10 ** x * b), cls: "s1", n: 300 }, { f: () => 1 / b, cls: "s5" }], marks: [{ x: lA, y: G }], label: "Closed-loop gain against open-loop gain, approaching one over beta" });
            ro.innerHTML = readout([["A", fmt(A, 3)], ["Loop gain T = Aβ", fmt(T, 3)], ["Closed-loop G", fmt(G, 5)], ["Target 1/β", fmt(1 / b, 4)], ["Error 1/(1 + T)", fmt(100 / (1 + T), 3) + "%"]]);
          }
          host.append(el(fig(loop())), f, slider({ id: id + "-a", label: "Open-loop gain A (log₁₀)", min: 0, max: 6, step: 0.05, value: lA, show: (v) => fmt(10 ** v, 3) }, (v) => { lA = v; draw(); }).el,
            slider({ id: id + "-b", label: "Feedback fraction β", min: 0.01, max: 1, step: 0.01, value: b }, (v) => { b = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">With β = 0.1 the target is 10. A = 100 gives 9.09 (9% low). A = 10⁴ gives 9.99. Past that, more A barely changes G: the gain is now “set by β”. That's why op amps are built with huge, imprecise gain and used with precise resistor ratios.</p>`,
      ]},
      { k: "why", title: "The error shrinks", b: [
        `<div class="eq">e = x − βy = x/(1 + T)</div>`,
        `<p>The amplifier only needs a tiny input to produce its output, so the loop forces βy ≈ x. That's the origin of the op amp's “virtual short” (6.002 Chapter 15): not a law of nature, but a consequence of T being large.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A = 10⁵, β = 0.01. Closed-loop gain?", a: 99.9, tol: 0.001, why: "10⁵/(1 + 1000) = 99.90." },
        { t: "num", q: "A = 100, β = 0.1. Closed-loop gain?", a: 9.091, tol: 0.005, why: "100/11 = 9.09: only T = 10, so a 9% error." },
        { t: "num", q: "Non-inverting op-amp stage with R₁ = 1 kΩ to ground, R₂ = 9 kΩ feedback. β?", a: 0.1, why: "β = R₁/(R₁ + R₂) = 0.1 → ideal gain 10." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a feedback amplifier's gain depend on β rather than A when the loop gain is large?", model: "The loop amplifies the difference between the input and a fraction beta of the output. With a huge amplifier gain, only a tiny difference is needed, so the loop settles where beta times the output almost equals the input. The output is then about the input over beta, and A only affects the small leftover error, about one over the loop gain." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "What feedback buys: accuracy and linearity", mins: 25,
    blurb: "Feedback trades away gain. In return, the amplifier's drift and its distortion are both divided by 1 + T.",
    takeaway: "Desensitisation: the sensitivity of G to A is S = 1/(1 + T) (Module 27), so a 20% drop in A changes G by only 20%/(1 + T). Linearity: for the same output swing, distortion generated inside the loop is divided by about 1 + T, because the loop sees the error the distortion causes and corrects it. The price: closed-loop gain is (1 + T) times lower than A. Feedback can't fix errors outside the loop, such as in the β network itself (its accuracy sets the gain) or in the input sensing.",
    steps: [
      { k: "math", title: "Desensitisation", b: [
        steps([["G = A/(1 + Aβ)", ""], ["dG/dA = 1/(1 + Aβ)²", "quotient rule"], ["S = (dG/dA)(A/G)", "= 1/(1 + Aβ) = 1/(1 + T)"]]),
        `<p>A = 10⁵ drops to 5×10⁴ (temperature, process) with β = 0.01: G goes from 99.90 to 99.80. A 50% swing in A became a 0.1% swing in G.</p>`,
      ]},
      { k: "play", title: "Feedback straightens a curved amplifier", b: [
        (host, id) => {
          const tf = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let lT = 1, amp = 0.6;
          const A = 1000, Vs = 1, fA = (u) => Vs * Math.tanh((A * u) / Vs);
          function draw() {
            const T = 10 ** lT, b = T / A, G = A / (1 + T);
            const closed = (x) => { let lo = -Vs, hi = Vs; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (m - fA(x - b * m) > 0) hi = m; else lo = m; } return (lo + hi) / 2; };
            const open = (x) => Vs * Math.tanh((G * x) / Vs);
            const xin = amp / G, N = 256;
            const yc = [], yo = []; for (let n = 0; n < N; n++) { const x = xin * Math.sin((2 * Math.PI * n) / N); yc.push(closed(x)); yo.push(open(x)); }
            const hc = harmonics(yc, 3), ho = harmonics(yo, 3);
            const xr = (1.3 * Vs) / G;
            tf.innerHTML = plot({ x: [-xr, xr], y: [-1.2, 1.2], xt: [-xr, 0, xr], xtf: (v) => fmt(v * 1000, 2), yt: [-1, 0, 1], xl: "input x (mV)", yl: "output y (V)", h: 220, series: [{ f: (x) => G * x, cls: "s5" }, { f: open, cls: "s4", n: 300 }, { f: closed, cls: "s1", n: 300 }], label: "Transfer curves: ideal straight line (grey), open-loop amplifier with the same gain (red dashed), feedback amplifier (orange)" });
            ro.innerHTML = readout([["Loop gain T", fmt(T, 3)], ["Closed-loop gain", fmt(G, 3)], ["HD3 without feedback (same gain, same swing)", fmt((100 * ho[2]) / ho[0], 3) + "%"], ["HD3 with feedback", fmt((100 * hc[2]) / hc[0], 3) + "%"], ["Ratio", fmt(ho[2] / ho[0] / (hc[2] / hc[0] + 1e-12), 3) + "× better"]]);
          }
          host.append(tf, slider({ id: id + "-t", label: "Loop gain T (log₁₀)", min: 0, max: 2.5, step: 0.05, value: lT, show: (v) => fmt(10 ** v, 3) }, (v) => { lT = v; draw(); }).el,
            slider({ id: id + "-a", label: "Output swing (peak, saturates at 1 V)", min: 0.1, max: 0.95, step: 0.05, value: amp, show: (v) => v + " V" }, (v) => { amp = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The inner amplifier saturates smoothly at ±1 V (a tanh, like a differential pair). Red dashed: an open-loop amplifier with the same overall gain, which bends early. Orange: the feedback version, straight until right up near the rails. At the same output swing its 3rd harmonic is about (1 + T) times smaller: 10× at T = 10, about 90× at T = 100 (a little less close to the rails).</p>`,
      ]},
      { k: "why", title: "Why it works, and its limit", b: [
        `<p>Distortion inside the loop shows up at the output, gets fed back, and appears in the error signal with the opposite sign, so the amplifier pre-corrects for it. The more loop gain, the harder it corrects.</p>`,
        `<div class="key"><b>What feedback can't fix:</b> errors in β itself (resistor ratio accuracy and resistor nonlinearity), noise at the input (feedback divides the signal gain and the noise gain equally, so the input-referred noise doesn't change), and anything at frequencies where T has fallen away (Part 3).</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "An amplifier with T = 200 has its A drop by 30%. Approximate % change in closed-loop gain (magnitude)?", a: 0.149, tol: 0.05, why: "30%/(1 + 200) ≈ 0.15%." },
        { t: "num", q: "Open-loop HD2 is 2% at a given output swing. With T = 49, roughly what HD2 at the same swing (%)?", a: 0.04, tol: 0.05, why: "2%/(1 + 49) = 0.04%." },
        { t: "mcq", q: "A feedback amplifier uses resistors with 1% tolerance in β, and A has ±50% tolerance with T = 1000. Which dominates the gain error?", opts: [["The 1% resistors", true, "A's ±50% is divided by 1001 (±0.05%); β's error passes straight through."], ["A's ±50%", false, "Feedback suppresses it by 1 + T."], ["Equal", false, "Work out both."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does negative feedback reduce distortion?", model: "Distortion created inside the amplifier appears at the output and is fed back to the input, where it shows up in the error signal with the opposite sign. The amplifier then amplifies that correction, cancelling most of the distortion. The reduction is roughly the loop gain plus one, for the same output swing." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Bandwidth: the gain–bandwidth trade", mins: 25,
    blurb: "Close the loop around a one-pole amplifier: gain falls by 1 + T₀, bandwidth rises by the same factor. Their product stays put.",
    takeaway: "If A(s) = A₀/(1 + s/ω_p), the closed loop is G(s) = [A₀/(1 + A₀β)]/[1 + s/(ω_p(1 + A₀β))]: the DC gain divides by 1 + T₀ and the pole moves up by 1 + T₀. Gain × bandwidth = A₀ω_p (the gain–bandwidth product, GBW) is constant. On a Bode plot: the closed-loop curve is flat at 1/β until it hits the open-loop curve, then follows it down. Loop gain T(jω) = A(jω)β falls with frequency, so all of feedback's benefits fade at high frequencies. Rise time shrinks by the same factor (t_r = 0.35/f_3dB).",
    steps: [
      { k: "math", title: "Close the loop around one pole", b: [
        steps([["A(s) = A₀/(1 + s/ω_p)", "one pole"], ["G = A/(1 + Aβ) = A₀/(1 + s/ω_p + A₀β)", ""], ["Divide top and bottom by 1 + A₀β", "G = G₀/(1 + s/[ω_p(1 + A₀β)])"], ["So", "G₀ = A₀/(1 + T₀), ω_closed = ω_p(1 + T₀)"]]),
        `<div class="eq">G₀ × ω_closed = A₀ × ω_p = GBW</div>`,
      ]},
      { k: "play", title: "Bode picture", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let lG = 1;
          const A0 = 1e5, fp = 10, GBW = A0 * fp;
          function draw() {
            const Gt = 10 ** lG, b = 1 / Gt, T0 = A0 * b, G0 = A0 / (1 + T0), fc = fp * (1 + T0);
            const ol = (lf) => 20 * Math.log10(A0 / Math.hypot(1, 10 ** lf / fp)), cl = (lf) => 20 * Math.log10(G0 / Math.hypot(1, 10 ** lf / fc)), Tdb = (lf) => ol(lf) + 20 * Math.log10(b);
            f.innerHTML = plot({ x: [0, 7], y: [-20, 110], xt: [0, 1, 2, 3, 4, 5, 6, 7], xtf: (v) => "10" + sup(v), yt: [0, 20, 40, 60, 80, 100], ytf: (v) => v + " dB", xl: "f (Hz)", h: 240, series: [{ f: ol, cls: "s2", n: 300 }, { f: cl, cls: "s1", n: 300 }], marks: [{ x: Math.log10(fc), y: cl(Math.log10(fc)), cls: "mkb" }], label: "Open-loop gain (blue) and closed-loop gain (orange); the gap between them is the loop gain" });
            ro.innerHTML = readout([["Closed-loop gain", fmt(G0, 4) + " (" + fmt(20 * Math.log10(G0), 3) + " dB)"], ["Closed-loop bandwidth", si(fc, "Hz", 3)], ["Gain × bandwidth", si(G0 * fc, "Hz", 3) + " (GBW = 1 MHz)"], ["Loop gain at DC", fmt(T0, 3) + " (" + fmt(20 * Math.log10(T0), 3) + " dB)"]]);
          }
          host.append(f, slider({ id: id + "-g", label: "Closed-loop gain wanted (log₁₀)", min: 0, max: 4, step: 0.05, value: lG, show: (v) => fmt(10 ** v, 3) }, (v) => { lG = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Op amp: A₀ = 100 dB, pole at 10 Hz, so GBW = 1 MHz. Ask for gain 10: bandwidth 100 kHz. Gain 1000: 1 kHz. The vertical gap between blue and orange (in dB) is the loop gain; where it reaches 0 dB, feedback stops working.</p>`,
      ]},
      { k: "why", title: "Loop gain runs out", b: [
        `<p>T(f) = A(f)·β falls 20 dB/decade above the open-loop pole. At high frequencies there's little loop gain left, so distortion, sensitivity and output impedance all get worse there. A spec like “THD at 20 kHz” or “PSRR at 1 MHz” is really a question about T at that frequency.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Op amp with GBW = 10 MHz in a non-inverting gain of 100. Closed-loop bandwidth (kHz)?", a: 100, unit: "kHz", why: "10 MHz/100 = 100 kHz." },
        { t: "num", q: "Same stage: 10–90% rise time for a small step (µs)?", a: 3.5, tol: 0.01, why: "0.35/100 kHz = 3.5 µs." },
        { t: "num", q: "A₀ = 10⁴, f_p = 1 kHz, β = 0.1. Loop gain at 100 kHz (magnitude, approximately)?", a: 10, tol: 0.02, why: "A(100 kHz) ≈ 10⁴ × (1 k/100 k) = 100; × 0.1 = 10. Only 10 left, versus 1000 at DC." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does lowering a feedback amplifier's gain increase its bandwidth?", model: "With less closed-loop gain, beta is bigger, so the loop gain is bigger at every frequency. The loop keeps the gain at one over beta until the falling open-loop gain meets that level, and a lower level is met at a higher frequency. For a one-pole amplifier the gain times the bandwidth stays equal to the gain-bandwidth product." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Impedances: what series and shunt feedback do", mins: 25,
    blurb: "Feedback also changes how a circuit looks from outside. Sensing the output voltage makes it look like a voltage source; mixing in series raises the input impedance.",
    takeaway: "At the output: sampling the output voltage (shunt sensing) divides output impedance by 1 + T, making the output voltage-like; sampling the output current (series sensing) multiplies it by 1 + T, making it current-like. At the input: comparing voltages (series mixing) multiplies input impedance by 1 + T; comparing currents (shunt mixing) divides it by 1 + T. Op-amp follower: Z_out = r_o/(1 + A), Z_in = Z_id(1 + A). Inverting amp: the input node is a virtual ground (shunt mixing lowers its impedance to almost 0).",
    steps: [
      { k: "learn", title: "The four combinations", b: [
        tbl(["Feedback type", "Senses", "Mixes", "Z_in", "Z_out", "Ideal amplifier it becomes"], [["Series-shunt", "output voltage", "as a voltage", "× (1 + T)", "÷ (1 + T)", "voltage amplifier (non-inverting op amp)"], ["Shunt-shunt", "output voltage", "as a current", "÷ (1 + T)", "÷ (1 + T)", "transimpedance (inverting op amp, TIA)"], ["Series-series", "output current", "as a voltage", "× (1 + T)", "× (1 + T)", "transconductance (current source with feedback)"], ["Shunt-series", "output current", "as a current", "÷ (1 + T)", "× (1 + T)", "current amplifier (current mirror with feedback)"]]),
        `<p class="aside">Boylestad Chapter 14 lists these as the four feedback connection types.</p>`,
      ]},
      { k: "why", title: "The intuition", b: [
        `<ul><li><b>Sensing output voltage:</b> if a load tries to pull the output down, the loop sees it and pushes back. The output “refuses to move”: low impedance.</li><li><b>Sensing output current:</b> the loop holds the current constant whatever the load voltage: high impedance, a current source.</li><li><b>Series mixing:</b> the input voltage is opposed by the fed-back voltage, so the input draws almost no current: high impedance.</li><li><b>Shunt mixing:</b> the feedback current supplies whatever the input pushes in, holding the node still: low impedance, a virtual ground.</li></ul>`,
      ]},
      { k: "play", title: "The follower's output impedance", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let lA = 4, ro0 = 100;
          function draw() {
            const A = 10 ** lA, z = ro0 / (1 + A);
            f.innerHTML = plot({ x: [0, 6], y: [-4, 3], xt: [0, 1, 2, 3, 4, 5, 6], xtf: (v) => "10" + sup(v), yt: [-4, -2, 0, 2], ytf: (v) => "10" + sup(v), xl: "op-amp gain A", yl: "Z_out (Ω)", h: 200, series: [{ f: (x) => Math.log10(ro0 / (1 + 10 ** x)), cls: "s1" }], marks: [{ x: lA, y: Math.log10(z) }], label: "Follower output impedance against op-amp gain, log scales" });
            ro.innerHTML = readout([["Open-loop output resistance r_o", ro0 + " Ω"], ["A", fmt(A, 3)], ["Z_out = r_o/(1 + A)", si(z, "Ω", 3)]]);
          }
          host.append(f, slider({ id: id + "-a", label: "Op-amp gain (log₁₀)", min: 0, max: 6, step: 0.1, value: lA, show: (v) => fmt(10 ** v, 3) }, (v) => { lA = v; draw(); }).el,
            slider({ id: id + "-r", label: "r_o", min: 10, max: 1000, log: true, value: ro0, show: (v) => fmt(v, 3) + " Ω" }, (v) => { ro0 = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">A follower has β = 1, so T = A. With A = 10⁴ a 100 Ω output stage behaves like 0.01 Ω: a near-ideal voltage source, at DC. At high frequency A falls (Part 3) and Z<sub>out</sub> rises, looking inductive: why regulators and buffers need care with capacitive loads (Module 38).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A voltage regulator's pass device alone has 2 Ω output resistance; its loop gain is 500. Output resistance with feedback (mΩ)?", a: 4, tol: 0.01, why: "2/(1 + 500) ≈ 4 mΩ." },
        { t: "mcq", q: "A transimpedance amplifier (photodiode → op amp inverting input, R_F feedback). Its input impedance is…", opts: [["Very low: shunt mixing divides it by 1 + T (a virtual ground)", true, "So the photodiode sees a fixed voltage and all its current flows into R_F."], ["Very high", false, "That's series mixing (non-inverting input)."], ["R_F", false, "R_F/(1 + A), roughly."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does feedback that senses the output voltage lower the output impedance?", model: "If something tries to change the output voltage, by loading it for instance, the feedback senses the change, the error signal grows, and the amplifier drives the output back. So the output voltage barely moves for a given load current, which is what a low output impedance means: about the open-loop value divided by one plus the loop gain." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "Positive feedback and loop thinking", mins: 25,
    blurb: "Flip the sign and the loop amplifies its own errors. Below Aβ = 1 that's extra gain; above it you get memory and switching: latches, Schmitt triggers, oscillators.",
    takeaway: "Positive feedback: G = A/(1 − Aβ). As Aβ → 1, G → ∞. With Aβ > 1 and a saturating amplifier, the loop has two stable states and switches between them with hysteresis: a Schmitt trigger, a latch, an SRAM cell, a comparator's regeneration stage. Oscillators sit exactly at the boundary (|Aβ| = 1 at 0° around the loop, Module 38). Loop thinking: to analyse any loop, break it at one point, inject a test signal, see what comes back: that return ratio is T, and 1 + T (or 1 − T) is what the loop divides or multiplies by.",
    steps: [
      { k: "learn", title: "Change one sign", b: [
        fig(loop({ pos: true })),
        `<div class="eq">G = A/(1 − Aβ)</div>`,
        `<ul><li>Aβ &lt; 1: gain boosted, but touchy (sensitivity 1/(1 − Aβ) is large)</li><li>Aβ = 1: infinite gain: anything self-sustains (an oscillator, if the phase is right)</li><li>Aβ &gt; 1: the loop runs away until the amplifier saturates, then <b>stays there</b></li></ul>`,
      ]},
      { k: "play", title: "Hysteresis", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let b = 0.25;
          const A = 10, f0 = (u) => Math.tanh(A * u);
          function draw() {
            const xs = []; for (let i = 0; i <= 200; i++) xs.push(-1 + i / 100);
            const sweep = (list, y0) => { let y = y0; return list.map((x) => { for (let k = 0; k < 200; k++) y = f0(x + b * y); return [x, y]; }); };
            const up = sweep(xs, -1), dn = sweep(xs.slice().reverse(), 1);
            const T = A * b, th = T > 1 ? (() => { /* threshold: where the lower branch disappears */ for (const [x, y] of up) if (y > 0) return x; return 0; })() : 0;
            f.innerHTML = plot({ x: [-1, 1], y: [-1.2, 1.2], xt: [-1, -0.5, 0, 0.5, 1], yt: [-1, 0, 1], xl: "input x", yl: "output y", h: 230, series: [{ pts: up, cls: "s1" }, { pts: dn, cls: "s2" }], label: "Output as the input sweeps up (orange) and down (blue)" });
            ro.innerHTML = readout([["Loop gain Aβ", fmt(T, 3)], ["Behaviour", T < 0.999 ? "single curve: just extra gain" : "two branches: hysteresis (memory)"], ["Switching thresholds", T > 1 ? `±${fmt(Math.abs(th), 3)}` : "—"]]);
          }
          host.append(f, slider({ id: id + "-b", label: "Positive feedback β (A = 10)", min: 0, max: 0.4, step: 0.005, value: b }, (v) => { b = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Below Aβ = 1 the up and down sweeps trace the same (steeper) curve. Above 1 they split: going up, the output stays low until the input passes a threshold, then snaps high and stays high until the input falls past a lower threshold. That gap is hysteresis: a Schmitt trigger ignores noise smaller than it. Cross-coupled inverters with Aβ ≫ 1 form the latch inside every SRAM cell and flip-flop.</p>`,
      ]},
      { k: "learn", title: "Break the loop to find T", b: [
        `<p>For a real circuit, where exactly is “A” and where is “β”? You don't need to decide. Set the input to zero, cut the loop at any point, inject a test signal v<sub>t</sub>, and measure what comes back, v<sub>r</sub>, around the loop:</p>`,
        `<div class="eq">T = −v_r/v_t   (the return ratio)</div>`,
        `<p class="aside">Careful: the cut must keep the loading the same on both sides. Simulators do this with special probes (Middlebrook's or Tian's method) so the loop isn't disturbed. Module 38 uses T(jω) to decide stability.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Positive feedback with A = 10, β = 0.05. Closed-loop gain?", a: 20, why: "10/(1 − 0.5) = 20." },
        { t: "mcq", q: "Two cross-coupled inverters, each with small-signal gain −8. Loop gain around the pair?", opts: [["+64: positive feedback ≫ 1, so a bistable latch", true, "Two inversions make the loop positive."], ["−64: negative feedback", false, "Two minus signs make a plus."], ["−8", false, "Go all the way round: both inverters."]] },
        { t: "mcq", q: "Why does a comparator often include a little positive feedback?", opts: [["Hysteresis stops noise on a slow input from making the output chatter", true, "Noise smaller than the hysteresis window can't flip it back."], ["To increase its bandwidth", false, "It's about clean switching."], ["To lower its offset", false, "Hysteresis doesn't remove offset."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does positive feedback create memory in a circuit?", model: "With loop gain above one, any small deviation is amplified and fed back in the same direction until the amplifier saturates. Once there, the feedback holds it there, so the output stays in whichever state it reached even after the input returns. The circuit remembers its last state, with two thresholds to switch it, which is hysteresis." },
      ]},
    ],
  };

  const p6 = {
    id: "p6", title: "Master it", mins: 30,
    blurb: "Gain, accuracy, bandwidth, impedance and positive feedback.",
    takeaway: "You can compute closed-loop gain and error, predict desensitisation and distortion reduction, apply gain–bandwidth, predict impedance changes for each feedback type, and recognise positive-feedback behaviour.",
    steps: [
      { k: "check", title: "Problem 1: specify the op amp", b: [
        { t: "num", q: "You need a gain of 20 with ≤ 0.1% gain error. Minimum DC open-loop gain A (dB)?", a: 86, tol: 0.01, hint: "Error ≈ 1/T with β = 1/20, so T ≥ 1000.", why: "A ≥ 1000 × 20 = 2×10⁴ = 86 dB." },
      ]},
      { k: "check", title: "Problem 2: …and its bandwidth", b: [
        { t: "num", q: "The same stage must keep ≤ 0.1% error up to 10 kHz. Minimum GBW (MHz)? (Assume a single-pole op amp and that |T| must stay ≥ 1000 at 10 kHz.)", a: 200, tol: 0.02, hint: "At 10 kHz, A must still be ≥ 2×10⁴. For a one-pole amp, |A(f)| ≈ GBW/f.", why: "GBW ≥ 2×10⁴ × 10 kHz = 200 MHz. Precision at frequency is expensive: this is why audio and instrumentation amplifiers are specified carefully." },
      ]},
      { k: "check", title: "Problem 3: linearity", b: [
        { t: "num", q: "An amplifier stage has HD3 = 3% open loop. You need 0.01% at the same output. Minimum 1 + T?", a: 300, why: "3%/0.01% = 300 (taking distortion ∝ 1/(1 + T))." },
      ]},
      { k: "check", title: "Problem 4: impedance", b: [
        { t: "num", q: "A series-series feedback current source: transistor output resistance 50 kΩ, loop gain 99. Output resistance (MΩ)?", a: 5, why: "50 kΩ × (1 + 99) = 5 MΩ. (This is how a cascode or regulated cascode boosts output resistance.)" },
      ]},
      { k: "check", title: "Problem 5: which is it?", b: [
        { t: "mcq", q: "A circuit's output snaps between rails and holds its state when the input is removed. Its loop gain is…", opts: [["Positive and greater than 1", true, "Bistable: a latch."], ["Negative and large", false, "That gives a linear amplifier."], ["Exactly −1", false, "Negative feedback doesn't latch."]] },
      ]},
      { k: "say", title: "Problem 6: explain it", b: [
        { t: "say", q: "Summarise what negative feedback trades away and what it buys, and where its benefits run out.", model: "It trades away gain: the closed-loop gain is the open-loop gain divided by one plus the loop gain. In return, the gain becomes set by the accurate feedback network, sensitivity to the amplifier and its distortion shrink by one plus the loop gain, bandwidth grows for a one-pole amplifier, and input and output impedances move toward ideal values. The benefits fade where the loop gain falls, at high frequencies, and it can't correct errors in the feedback network or input noise." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m37", eyebrow: "Math Toolkit · Module 37", title: "Feedback Systems",
    intro: `<p>Six parts: the loop and loop gain, accuracy and linearity, gain–bandwidth, impedances, positive feedback and loop thinking, and mastery problems.</p><p>Why a chip designer needs this: op amps, regulators, bias circuits, PLLs and calibration loops are all feedback. Thinking in loop gain is a core analog skill.</p><p class="aside">Before this: Modules 16 (Bode) and 29 Part 4. Pairs with 6.002 Chapter 15 and Boylestad Chapters 10, 14.</p>`,
    after: `<p>Next: Module 38 asks when a feedback loop rings or oscillates, and how designers stop it.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <div class="eq">G = A/(1 + Aβ)   T = Aβ   G ≈ 1/β (T ≫ 1)   e = x/(1 + T)</div>
      <p>Gain error ≈ 1/T. Sensitivity to A: 1/(1 + T). Distortion inside the loop ÷ ≈ (1 + T) at the same output. Can't fix β errors or input noise.</p>
      <p><b>One-pole amp:</b> gain ÷ (1 + T₀), bandwidth × (1 + T₀); GBW = A₀f_p constant. T falls with frequency → benefits fade.</p>
      <p><b>Impedances:</b> sense voltage → Z_out ÷ (1 + T); sense current → × (1 + T); series mixing → Z_in × (1 + T); shunt mixing → ÷ (1 + T) (virtual ground). Follower Z_out = r_o/(1 + A).</p>
      <p><b>Positive:</b> G = A/(1 − Aβ); Aβ &gt; 1 + saturation → bistable, hysteresis (Schmitt, latch, SRAM). <b>Return ratio:</b> break the loop, T = −v_r/v_t.</p>`,
  };
  Course.start(window.CHAPTER);
})();
