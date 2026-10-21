(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;

  const p1 = {
    id: "p1", title: "First order, initial condition included", mins: 20,
    blurb: "Transform, solve for V(s), invert. The three-number recipe of Module 15 falls out by itself.",
    takeaway: "Method: (1) transform every term, using sF − f(0) for derivatives; (2) solve the algebra for X(s); (3) partial fractions; (4) invert. RC charging τv′ + v = V_S (t ≥ 0), v(0) = V₀ gives V(s) = V₀/(s + 1/τ) + V_S/[s(τs + 1)], so v(t) = V_S + (V₀ − V_S)e^(−t/τ): exactly the first-order recipe.",
    steps: [
      { k: "learn", title: "Worked: RC charging", b: [
        `<div class="eq">τ v′ + v = V<sub>S</sub>,   v(0) = V<sub>0</sub></div>`,
        steps([["Transform", "τ(sV − V₀) + V = V_S/s"], ["Collect V", "(τs + 1)V = τV₀ + V_S/s"], ["Solve", "V = V₀/(s + 1/τ) + (V_S/τ)/[s(s + 1/τ)]"], ["Partial fractions", "(V_S/τ)/[s(s + 1/τ)] = V_S/s − V_S/(s + 1/τ)"], ["Invert", "v = V₀e^(−t/τ) + V_S(1 − e^(−t/τ))"]]),
        `<p class="aside">Tidied: v = V<sub>S</sub> + (V<sub>0</sub> − V<sub>S</sub>)e<sup>−t/τ</sup>: final value, initial value and τ, all in one go.</p>`,
      ]},
      { k: "play", title: "Two parts of V(s)", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let V0 = 4, Vs = 10;
          const tau = 2;
          function draw() {
            const zi = (t) => V0 * Math.exp(-t / tau), zs = (t) => Vs * (1 - Math.exp(-t / tau));
            f.innerHTML = plot({ x: [0, 12], y: [-10, 12], xt: [0, 2, 4, 6, 8, 10, 12], yt: [-10, -5, 0, 5, 10], xl: "t (ms)", h: 230, series: [{ f: zi, cls: "s4" }, { f: zs, cls: "s5" }, { f: (t) => zi(t) + zs(t), cls: "s1" }], label: "Response from the initial condition (red dashed), from the source (grey dashed), and total (orange)" });
            ro.innerHTML = readout([["From v(0): V₀/(s + 1/τ)", "V₀e^(−t/τ)"], ["From the source: V_S/(s(τs + 1))", "V_S(1 − e^(−t/τ))"], ["v at t = τ = 2 ms", fmt(zi(2) + zs(2), 4) + " V"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "V₀ = v(0)", min: -10, max: 10, step: 1, value: V0, show: (v) => v + " V" }, (v) => { V0 = v; draw(); }).el, slider({ id: id + "-b", label: "V_S", min: -10, max: 10, step: 1, value: Vs, show: (v) => v + " V" }, (v) => { Vs = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">τ = 2 ms. The s-domain answer splits naturally into a part caused by the initial condition and a part caused by the source. Their sum is the total.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "x′ + 5x = 10 (t ≥ 0), x(0) = 0. X(s) = ?", opts: [["10/(s(s + 5))", true, "sX + 5X = 10/s."], ["10/(s + 5)", false, "The constant 10 transforms to 10/s."], ["(10 + s)/(s(s + 5))", false, "x(0) = 0 adds nothing."]] },
        { t: "num", q: "So x(t) settles at? (final value)", a: 2, why: "10/(s(s + 5)) = 2/s − 2/(s + 5) → 2(1 − e^(−5t))." },
        { t: "num", q: "τ = 2 ms, V_S = 10 V, V₀ = 4 V. v at 2 ms? (V)", a: 7.793, unit: "V", tol: 0.01, why: "10 − 6e^(−1) = 7.79 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Outline the four steps for solving a differential equation with Laplace transforms.", model: "Transform every term, using s F minus the initial value for derivatives. Solve the resulting algebra for the unknown's transform. Break that into partial fractions. Then invert each piece with the table to get the time function." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Second order, real roots", mins: 25,
    blurb: "Two initial conditions drop in at once, and no constants are left to fit at the end.",
    takeaway: "ℒ{x″} = s²X − s·x(0) − x′(0). For x″ + 3x′ + 2x = 2, zero initial conditions: (s² + 3s + 2)X = 2/s → X = 2/[s(s + 1)(s + 2)] → x = 1 − 2e^(−t) + e^(−2t). The bracket (s² + 3s + 2) is the characteristic polynomial of Module 15: its roots are the poles.",
    steps: [
      { k: "learn", title: "Worked: x″ + 3x′ + 2x = 2", b: [
        steps([["Transform (x(0) = x′(0) = 0)", "s²X + 3sX + 2X = 2/s"], ["Solve", "X = 2/[s(s + 1)(s + 2)]"], ["Cover-up", "A(0) = 1, B(−1) = −2, C(−2) = 1"], ["Invert", "x = 1 − 2e^(−t) + e^(−2t)"]]),
        `<p class="aside">The same answer Module 15, Part 5 got by fitting A₁ and A₂. Here the initial conditions did that job automatically.</p>`,
      ]},
      { k: "math", title: "Non-zero initial conditions", b: [
        `<p>Same equation, now x(0) = 0 and x′(0) = 1:</p>`,
        { t: "reveal", label: "Transform", html: `<div class="eq">s²X − 0 − 1 + 3(sX − 0) + 2X = 2/s</div>` },
        { t: "reveal", label: "Solve", html: `<div class="eq">(s + 1)(s + 2)X = 2/s + 1 = (s + 2)/s   →   X = 1/(s(s + 1))</div>` },
        { t: "reveal", label: "Invert", html: `<div class="eq">x = 1 − e<sup>−t</sup></div><p class="aside">The (s + 2) cancelled: this start doesn't excite the e<sup>−2t</sup> mode at all. Check: x(0) = 0 ✓, x′(0) = 1 ✓.</p>` },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Transform x″ + 4x = 0 with x(0) = 3, x′(0) = 0.", opts: [["s²X − 3s + 4X = 0 → X = 3s/(s² + 4)", true, "So x = 3 cos 2t: an undamped oscillation."], ["s²X + 4X = 3", false, "x(0) multiplies s in the f″ rule: −s·x(0)."], ["X = 3/(s² + 4)", false, "That would be from x′(0) = 3, giving 1.5 sin 2t."]] },
        { t: "num", q: "x″ + 5x′ + 6x = 0, x(0) = 1, x′(0) = 0. X = (s + 5)/((s + 2)(s + 3)). Coefficient on e^(−2t)?", a: 3, hint: "Cover-up at s = −2: (3)/(1).", why: "3; on e^(−3t): (2)/(−1) = −2. x = 3e^(−2t) − 2e^(−3t)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Where do the characteristic roots of Module 15 show up in the Laplace method?", model: "When you collect the X terms, the bracket multiplying X of s is the characteristic polynomial. Its roots become poles of X of s, and each pole gives one exponential mode in the answer." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Underdamped: an RLC step", mins: 25,
    blurb: "Complex poles in, damped sinusoid out. Change R and watch the poles and the response together.",
    takeaway: "Series RLC, capacitor voltage, step V_S: LCv″ + RCv′ + v = V_S → V(s) = V_S/[s(LCs² + RCs + 1)] = V_S·ω₀²/[s(s² + 2αs + ω₀²)], α = R/2L, ω₀ = 1/√(LC). With L = 1 H, C = 0.2 F, R = 2 Ω: v″ + 2v′ + 5v = 5V_S → v = V_S[1 − e^(−t)(cos 2t + ½ sin 2t)]. Poles −1 ± j2.",
    steps: [
      { k: "learn", title: "Worked", b: [
        steps([["Circuit (L = 1, C = 0.2, R = 2, V_S = 1)", "0.2v″ + 0.4v′ + v = 1"], ["× 5, transform", "(s² + 2s + 5)V = 5/s"], ["Solve", "V = 5/[s(s² + 2s + 5)]"], ["Module 21, Part 4", "v = 1 − e^(−t)cos 2t − ½e^(−t)sin 2t"]]),
      ]},
      { k: "play", title: "Turn the resistor", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), g = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let R = 2;
          const L = 1, C = 0.2, w0 = 1 / Math.sqrt(L * C);
          function draw() {
            const a = R / (2 * L), D = a * a - w0 * w0;
            let v, poles;
            if (Math.abs(D) < 1e-6) { v = (t) => 1 - (1 + a * t) * Math.exp(-a * t); poles = [[-a, 0]]; }
            else if (D < 0) { const wd = Math.sqrt(-D); v = (t) => 1 - Math.exp(-a * t) * (Math.cos(wd * t) + (a / wd) * Math.sin(wd * t)); poles = [[-a, wd], [-a, -wd]]; }
            else { const r = Math.sqrt(D), s1 = -a + r, s2 = -a - r; v = (t) => 1 + (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s1 - s2); poles = [[s1, 0], [s2, 0]]; }
            f.innerHTML = plot({ x: [0, 8], y: [0, 2], xt: [0, 2, 4, 6, 8], yt: [0, 0.5, 1, 1.5, 2], xl: "t (s)", yl: "v_C (V)", h: 210, series: [{ f: () => 1, cls: "s5" }, { f: v, cls: "s1", n: 400 }], label: "Capacitor voltage step response" });
            g.innerHTML = plot({ x: [-6, 1], y: [-3, 3], xt: [-6, -4, -2, 0], yt: [-2, 0, 2], xl: "σ", yl: "jω", h: 180, w: 300, marks: poles.map(([x, y]) => ({ x, y, cls: "mkb", r: 7 })), label: "Poles of V(s) apart from the one at 0" });
            ro.innerHTML = readout([["α = R/2L, ω₀ = 1/√(LC)", `${fmt(a, 3)}, ${fmt(w0, 4)}`], ["Poles", poles.map(([x, y]) => fmt(x, 3) + (y ? (y > 0 ? " + j" : " − j") + fmt(Math.abs(y), 3) : "")).join(", ")], ["Case", D < -1e-6 ? "underdamped" : D > 1e-6 ? "overdamped" : "critically damped (R = 2√(L/C))"]]);
          }
          host.append(f, g, slider({ id: id + "-r", label: "R", min: 0.2, max: 12, step: 0.1, value: R, show: (v) => fmt(v) + " Ω" }, (v) => { R = Math.abs(v - 2 * Math.sqrt(5)) < 0.06 ? 2 * Math.sqrt(5) : v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">L = 1 H, C = 0.2 F, V<sub>S</sub> = 1 V. Critical damping at R = 2√(L/C) ≈ 4.47 Ω.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "L = 1 H, C = 0.2 F, R = 2 Ω. Peak overshoot: v at the first peak t = π/ω_d? (V)", a: 1.208, unit: "V", tol: 0.01, hint: "At t = π/2, cos 2t = −1 and sin 2t = 0.", why: "1 + e^(−π/2) = 1.208 V: 20.8% overshoot." },
        { t: "num", q: "R for critical damping with these L and C? (Ω)", a: 4.472, unit: "Ω", tol: 0.01, why: "2√(L/C) = 2√5 = 4.47 Ω." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the Laplace method show whether an RLC circuit will ring?", model: "Solving for V of s gives a quadratic in the denominator, s squared plus 2 alpha s plus omega naught squared. If its roots are complex, the inverse transform contains e to the minus alpha t times a sinusoid, so the circuit rings. Real roots give only exponentials." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "A sinusoidal input: transient and steady state together", mins: 25,
    blurb: "Laplace gives the whole response in one go: the dying transient and the phasor steady state.",
    takeaway: "RC (τ = 1 s) driven by cos t from v(0) = 0: V(s) = s/[(s + 1)(s² + 1)] = −0.5/(s + 1) + 0.5(s + 1)/(s² + 1), so v = −0.5e^(−t) + 0.5 cos t + 0.5 sin t. The pole at −1 (the circuit) gives the transient; the poles at ±j (the input) give the steady state 0.707 cos(t − 45°), the same as the phasor answer 1/(1 + j).",
    steps: [
      { k: "learn", title: "Worked", b: [
        steps([["Equation (τ = 1)", "v′ + v = cos t, v(0) = 0"], ["Transform", "(s + 1)V = s/(s² + 1)"], ["Split", "A/(s + 1) + (Bs + C)/(s² + 1)"], ["A by cover-up at −1", "A = −1/2"], ["Compare s² and constant terms", "A + B = 0 → B = ½;  A + C = 0 → C = ½"], ["Invert", "v = −½e^(−t) + ½cos t + ½sin t"]]),
      ]},
      { k: "play", title: "Poles from the circuit, poles from the input", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let w = 1;
          function draw() {
            /* v′ + v = cos ωt, v(0) = 0 → A = −1/(1 + ω²), steady = (cos ωt + ω sin ωt)/(1 + ω²) */
            const k = 1 / (1 + w * w), ss = (t) => k * (Math.cos(w * t) + w * Math.sin(w * t));
            f.innerHTML = plot({ x: [0, 15], y: [-1.2, 1.2], xt: [0, 5, 10, 15], yt: [-1, 0, 1], xl: "t (s)", h: 220, series: [{ f: (t) => Math.cos(w * t), cls: "s5" }, { f: ss, cls: "s2" }, { f: (t) => ss(t) - k * Math.exp(-t), cls: "s1" }], label: "Input (dashed), steady state (blue) and total (orange)" });
            ro.innerHTML = readout([["Transient (pole at −1)", `${fmt(-k, 3)}e^(−t)`], ["Steady state (poles at ±j" + fmt(w) + ")", `amplitude ${fmt(1 / Math.sqrt(1 + w * w), 3)}, phase ${fmt((-Math.atan(w) * 180) / Math.PI, 3)}°`], ["Phasor check: |1/(1 + jω)|", fmt(1 / Math.sqrt(1 + w * w), 3)]]);
          }
          host.append(f, slider({ id: id + "-w", label: "Input ω (rad/s)", min: 0.2, max: 4, step: 0.1, value: w }, (v) => { w = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The steady state always matches the phasor result. Laplace adds the transient that phasors leave out.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "In the worked example, the steady-state amplitude √(½² + ½²)?", a: 0.7071, tol: 0.01, why: "1/√2: the same as |1/(1 + j)|." },
        { t: "mcq", q: "Which poles of V(s) produce the steady state?", opts: [["The input's poles at ±j", true, "They never decay: the input keeps driving."], ["The circuit's pole at −1", false, "That one gives the transient e^(−t)."], ["Both equally", false, "Each pole contributes its own term."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In a Laplace solution with a sinusoidal input, which poles give the transient and which the steady state?", model: "The circuit's own poles, in the left half-plane, give terms that decay: the transient. The input's poles on the imaginary axis give a sinusoid that persists: the steady state, which matches what phasors would give." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m22", eyebrow: "Math Toolkit · Module 22", title: "Solving Differential Equations with Laplace",
    intro: `<p>Four parts: first order with an initial condition, second order with real roots, an underdamped RLC step, and a sinusoidal input. Each one redoes something from <a href="15-diff-eqs.html">Module 15</a> the Laplace way, so you can compare.</p>`,
    after: `<p>Try a 6.002 Chapter 10 or 12 problem both ways, classical and Laplace, and check that you get the same answer.</p>`,
    parts: [p1, p2, p3, p4],
    summary: `
      <p>Transform (sF − f(0), s²F − s f(0) − f′(0)) → solve for X(s) → partial fractions → invert.</p>
      <div class="eq">τv′ + v = V<sub>S</sub>, v(0) = V<sub>0</sub> → v = V<sub>S</sub> + (V<sub>0</sub> − V<sub>S</sub>)e<sup>−t/τ</sup></div>
      <p>The bracket multiplying X(s) is the characteristic polynomial; its roots are the circuit's poles. Series RLC step: V = V<sub>S</sub>ω₀²/[s(s² + 2αs + ω₀²)].</p>
      <p>Sinusoidal input: circuit poles → transient; input poles (±jω) → steady state = phasor answer.</p>`,
  };
  Course.start(window.CHAPTER);
})();
