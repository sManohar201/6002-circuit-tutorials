(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;

  const p1 = {
    id: "p1", title: "What a differential equation says", mins: 15,
    blurb: "It's a rule for the slope. Follow the slope step by step and the curve draws itself.",
    takeaway: "A differential equation gives the rate of change in terms of the present value. RC charging: C dv/dt = (V_S − v)/R, i.e. dv/dt = (V_S − v)/τ with τ = RC. The slope is proportional to the distance still to go, so the approach slows down: that's an exponential. Initial slope = (V_S − v(0))/τ: if it kept that slope, it would arrive in exactly one τ.",
    steps: [
      { k: "learn", title: "From KCL to a slope rule", b: [
        `<p>A resistor R from a source V<sub>S</sub> charges a capacitor C. The resistor's current is the capacitor's current:</p>`,
        `<div class="eq">(V<sub>S</sub> − v)/R = C dv/dt   →   dv/dt = (V<sub>S</sub> − v)/τ,  τ = RC</div>`,
        `<p class="aside">Read it aloud: "the voltage rises at a rate proportional to how far it still has to go".</p>`,
      ]},
      { k: "play", title: "Follow the slope", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let n = 8;
          function draw() {
            const h = 4 / n, pts = [[0, 0]];
            let v = 0; for (let k = 0; k < n; k++) { v += h * (1 - v); pts.push([(k + 1) * h, v]); }
            f.innerHTML = plot({ x: [0, 4], y: [0, 1.1], xt: [0, 1, 2, 3, 4], xtf: (x) => (x ? x + "τ" : "0"), yt: [0, 0.5, 1], ytf: (y) => (y === 1 ? "V_S" : fmt(y)), xl: "t", h: 230, series: [{ f: (x) => 1 - Math.exp(-x), cls: "s3" }, { pts, cls: "s1" }, { pts: [[0, 0], [1, 1]], cls: "s5" }], marks: pts.slice(0, -1).map(([x, y]) => ({ x, y, r: 4 })), label: "Stepping along the slope rule (orange) versus the exact curve (green)" });
            ro.innerHTML = readout([["Steps", n + " of " + fmt(h, 3) + "τ"], ["After 4τ: stepped / exact", fmt(v, 4) + " / " + fmt(1 - Math.exp(-4), 4)]]);
          }
          host.append(f, slider({ id: id + "-n", label: "Number of steps", min: 4, max: 60, step: 1, value: n }, (v) => { n = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Each orange step uses the slope rule at its start. More, smaller steps land on the green exponential. The dashed line is the initial slope: it reaches V<sub>S</sub> at exactly t = τ.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "V_S = 10 V, τ = 1 ms. When v = 2 V, how fast is it rising? (V/ms)", a: 8, unit: "V/ms", why: "(10 − 2)/1 ms = 8 V/ms." },
        { t: "mcq", q: "For L and R in series, i obeys L di/dt + Ri = V_S. Its τ is…", opts: [["L/R", true, "Divide by R: (L/R)di/dt + i = V_S/R."], ["LR", false, "Check units: H·Ω isn't seconds."], ["R/L", false, "That's 1/τ."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does an RC circuit's voltage approach its final value more and more slowly?", model: "The charging current, and so the rate of rise, is proportional to the voltage still left across the resistor, which is the distance to the final value. As the capacitor gets closer, that distance shrinks, so the rate shrinks with it." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "The first-order recipe", mins: 20,
    blurb: "Three numbers solve every first-order circuit: start, finish and τ.",
    takeaway: "Any first-order quantity: x(t) = x(∞) + [x(0⁺) − x(∞)]e^(−t/τ). Find x(0⁺) (capacitor voltage and inductor current can't jump), x(∞) (capacitor open, inductor short), and τ = R_Th·C or L/R_Th (R_Th = resistance seen by the C or L with sources zeroed). Then plug in.",
    steps: [
      { k: "learn", title: "Initial, final, τ", b: [
        `<div class="eq">x(t) = x(∞) + [x(0⁺) − x(∞)] e<sup>−t/τ</sup></div>`,
        `<div class="two"><div class="tile"><h3>x(0⁺)</h3><p>Just after the switch. v<sub>C</sub> and i<sub>L</sub> keep their values from just before.</p></div><div class="tile"><h3>x(∞)</h3><p>Long after: C acts as an open circuit, L as a short.</p></div><div class="tile"><h3>τ</h3><p>R<sub>Th</sub>C or L/R<sub>Th</sub>, with R<sub>Th</sub> the resistance the element sees.</p></div></div>`,
      ]},
      { k: "play", title: "Set the three numbers", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let x0 = 10, xf = 2, tau = 4;
          function draw() {
            f.innerHTML = plot({ x: [0, 20], y: [-12, 12], xt: [0, 4, 8, 12, 16, 20], yt: [-10, -5, 0, 5, 10], xl: "t (ms)", yl: "x", h: 240, series: [{ f: (t) => xf + (x0 - xf) * Math.exp(-t / tau), cls: "s1" }, { f: () => xf, cls: "s5" }], marks: [{ x: tau, y: xf + (x0 - xf) * Math.exp(-1) }], label: "First-order response from its initial to its final value" });
            ro.innerHTML = readout([["At t = τ", fmt(xf + (x0 - xf) * Math.exp(-1), 4) + " (63% of the way)"], ["At t = 8 ms", fmt(xf + (x0 - xf) * Math.exp(-8 / tau), 4)]]);
          }
          const mk = (k, lab, v, set, lo, hi, st, u) => slider({ id: id + k, label: lab, min: lo, max: hi, step: st, value: v, show: (x) => x + u }, (x) => { set(x); draw(); }).el;
          host.append(f, mk("a", "x(0⁺)", x0, (x) => (x0 = x), -10, 10, 0.5, " V"), mk("b", "x(∞)", xf, (x) => (xf = x), -10, 10, 0.5, " V"), mk("c", "τ", tau, (x) => (tau = x), 0.5, 10, 0.5, " ms"), ro);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "v_C(0⁺) = 10 V, v_C(∞) = 2 V, τ = 4 ms. v_C at 4 ms?", a: 4.943, unit: "V", tol: 0.01, why: "2 + 8 × 0.368 = 4.94 V." },
        { t: "num", q: "An inductor of 10 mH sees R_Th = 2 kΩ. τ in µs?", a: 5, unit: "µs", why: "L/R = 10⁻²/(2 × 10³) = 5 µs." },
        { t: "mcq", q: "A capacitor sits at 3 V. A switch closes connecting it through 1 kΩ to a 9 V source. Right after closing, v_C is…", opts: [["3 V", true, "A capacitor's voltage can't jump: it needs charge to move, which takes time."], ["9 V", false, "That's v_C(∞)."], ["6 V", false, "That's the resistor's voltage at 0⁺: 9 − 3."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What three things do you find to solve a first-order circuit, and how?", model: "The initial value just after the switch, using the fact that capacitor voltage and inductor current can't jump; the final value long after, treating the capacitor as open and the inductor as a short; and the time constant, from the Thevenin resistance seen by the element times C, or L divided by it. Then put them into final plus initial minus final times e to the minus t over tau." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Second order: the characteristic equation", mins: 25,
    blurb: "Guess e^(st), get a quadratic in s. Its roots decide: smooth, critical, or ringing.",
    takeaway: "d²x/dt² + 2α dx/dt + ω₀²x = 0. Try x = e^(st): s² + 2αs + ω₀² = 0, so s = −α ± √(α² − ω₀²). α > ω₀: two real roots, overdamped (slow, no overshoot). α = ω₀: critically damped. α < ω₀: complex roots −α ± jω_d with ω_d = √(ω₀² − α²): underdamped, e^(−αt) times a sinusoid at ω_d. Series RLC: α = R/2L, ω₀ = 1/√(LC).",
    steps: [
      { k: "learn", title: "Guess e^(st)", b: [
        `<div class="eq">x″ + 2αx′ + ω<sub>0</sub>²x = 0</div>`,
        `<p>Exponentials keep their shape when differentiated, so try x = e<sup>st</sup>: x′ = se<sup>st</sup>, x″ = s²e<sup>st</sup>. Divide out e<sup>st</sup>:</p>`,
        `<div class="eq">s² + 2αs + ω<sub>0</sub>² = 0   →   s = −α ± √(α² − ω<sub>0</sub>²)</div>`,
        `<p class="aside">That's a quadratic (<a href="07-quadratics.html">Module 7</a>). Its discriminant decides everything.</p>`,
      ]},
      { k: "play", title: "Dial the damping", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), g = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let z = 0.2; // α/ω₀, with ω₀ = 1
          function step(t) {
            const a = z;
            if (Math.abs(a - 1) < 1e-6) return 1 - (1 + t) * Math.exp(-t);
            if (a < 1) { const wd = Math.sqrt(1 - a * a); return 1 - Math.exp(-a * t) * (Math.cos(wd * t) + (a / wd) * Math.sin(wd * t)); }
            const r = Math.sqrt(a * a - 1), s1 = -a + r, s2 = -a - r; return 1 - (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1);
          }
          function draw() {
            const a = z, D = a * a - 1, R = D >= 0 ? [[-a + Math.sqrt(D), 0], [-a - Math.sqrt(D), 0]] : [[-a, Math.sqrt(-D)], [-a, -Math.sqrt(-D)]];
            f.innerHTML = plot({ x: [0, 20], y: [0, 1.8], xt: [0, 5, 10, 15, 20], yt: [0, 0.5, 1, 1.5], xl: "ω₀t", yl: "step response", h: 220, series: [{ f: step, cls: "s1", n: 400 }, { f: () => 1, cls: "s5" }], label: "Step response of a second-order system" });
            g.innerHTML = plot({ x: [-4, 1], y: [-1.5, 1.5], xt: [-4, -3, -2, -1, 0, 1], yt: [-1, 0, 1], xl: "real", yl: "imag", h: 200, w: 360, marks: R.map(([x, y]) => ({ x, y, cls: "mkb", r: 7 })), series: [{ f: (x) => Math.sqrt(Math.max(0, 1 - x * x)), from: -1, to: 0, cls: "s5" }, { f: (x) => -Math.sqrt(Math.max(0, 1 - x * x)), from: -1, to: 0, cls: "s5" }], label: "Roots of the characteristic equation in the s-plane (units of ω₀)" });
            ro.innerHTML = readout([["α/ω₀", fmt(a, 3)], ["Case", a < 1 ? "underdamped: rings at ω_d = " + fmt(Math.sqrt(1 - a * a), 3) + "ω₀" : Math.abs(a - 1) < 1e-6 ? "critically damped" : "overdamped"], ["Roots s/ω₀", R.map(([x, y]) => fmt(x, 3) + (y ? (y > 0 ? " + j" : " − j") + fmt(Math.abs(y), 3) : "")).join(",  ")], ["Q = ω₀/2α", fmt(1 / (2 * a), 3)]]);
          }
          host.append(f, g, slider({ id: id + "-z", label: "Damping α/ω₀", min: 0.05, max: 3, step: 0.05, value: z, show: (v) => fmt(v, 3) }, (v) => { z = Math.abs(v - 1) < 0.026 ? 1 : v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Underdamped roots sit on the dashed circle of radius ω₀. As damping grows they slide together, meet at −ω₀ (critical), then split along the real axis.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Series RLC: L = 1 mH, C = 1 µF. ω₀ in rad/s?", a: 31623, unit: "rad/s", tol: 0.005, why: "1/√(10⁻⁹) = 31 623 rad/s." },
        { t: "num", q: "With R = 10 Ω, α = R/2L = ? (s⁻¹)", a: 5000, unit: "s⁻¹", why: "10/0.002 = 5000. That's well below ω₀, so it rings." },
        { t: "num", q: "Ringing frequency ω_d = √(ω₀² − α²)? (rad/s)", a: 31225, unit: "rad/s", tol: 0.005, why: "√(10⁹ − 2.5 × 10⁷) = 31 225 rad/s." },
        { t: "num", q: "R for critical damping (α = ω₀)? (Ω)", a: 63.25, unit: "Ω", tol: 0.01, hint: "R = 2Lω₀.", why: "2 × 10⁻³ × 31 623 = 63.2 Ω." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What decides whether a second-order circuit rings or not?", model: "The roots of its characteristic equation, s equals minus alpha plus or minus the root of alpha squared minus omega naught squared. If alpha is less than omega naught the root is of a negative number, the roots are complex, and the response is a decaying sinusoid. If alpha is at least omega naught the roots are real and it settles without oscillating." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Forced response: a sinusoidal input", mins: 25,
    blurb: "Total response = transient (dies away) + steady state (follows the input). Phasors give the steady state.",
    takeaway: "For a linear circuit driven by a sinusoid, x(t) = x_h + x_p. The homogeneous part x_h = Ke^(−t/τ) dies away (the transient); the particular part x_p is a sinusoid at the input frequency (the steady state). RC driven by V cos ωt: x_p = [V/√(1 + (ωτ)²)]·cos(ωt − tan⁻¹ωτ). K comes from the initial condition applied to the TOTAL: K = x(0) − x_p(0). After about 5τ only the steady state is left. That's why 6.002 Chapter 13 can use phasors alone.",
    steps: [
      { k: "learn", title: "Two pieces", b: [
        `<div class="eq">τ dv/dt + v = V cos ωt</div>`,
        `<div class="two"><div class="tile"><h3>Homogeneous (transient)</h3><p>Solves τv′ + v = 0: Ke<sup>−t/τ</sup>. Fades out.</p></div><div class="tile"><h3>Particular (steady state)</h3><p>A sinusoid at ω: guess A cos ωt + B sin ωt, or use phasors (impedance divider).</p></div></div>`,
        `<div class="eq">v<sub>p</sub> = V/√(1 + (ωτ)²) · cos(ωt − tan⁻¹ωτ)</div>`,
        `<p class="aside">The same magnitude and phase as the RC low-pass H(jω) in <a href="16-bode.html">Module 16</a>.</p>`,
      ]},
      { k: "play", title: "Watch the transient fade", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let wt = 1, v0 = 0;
          const V = 10, tau = 1;
          function draw() {
            const w = wt / tau, A = V / (1 + wt * wt), vp = (t) => A * (Math.cos(w * t) + wt * Math.sin(w * t)), K = v0 - vp(0);
            f.innerHTML = plot({ x: [0, 12], y: [-12, 12], xt: [0, 2, 4, 6, 8, 10, 12], xtf: (v) => (v ? v + "τ" : "0"), yt: [-10, -5, 0, 5, 10], xl: "t", h: 240, series: [{ f: (t) => V * Math.cos(w * t), cls: "s5" }, { f: vp, cls: "s2" }, { f: (t) => vp(t) + K * Math.exp(-t / tau), cls: "s1" }], label: "Input (dashed), steady state (blue) and total response (orange)" });
            ro.innerHTML = readout([["Steady-state amplitude V/√(1 + (ωτ)²)", fmt(V / Math.sqrt(1 + wt * wt), 4) + " V"], ["Phase −tan⁻¹ωτ", fmt((-Math.atan(wt) * 180) / Math.PI, 4) + "°"], ["Transient K = v(0) − v_p(0)", fmt(K, 4) + " V"]]);
          }
          host.append(f, slider({ id: id + "-w", label: "ωτ", min: 0.2, max: 5, step: 0.1, value: wt }, (v) => { wt = v; draw(); }).el, slider({ id: id + "-v", label: "v(0)", min: -10, max: 10, step: 1, value: v0, show: (v) => v + " V" }, (v) => { v0 = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">V = 10 V. The orange total starts at v(0) and merges into the blue steady state within a few τ, whatever v(0) was.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "V = 10 V, ωτ = 1. Steady-state amplitude? (V)", a: 7.071, unit: "V", tol: 0.01, why: "10/√2 = 7.07 V, lagging 45°." },
        { t: "num", q: "Same, starting from v(0) = 0. K = v(0) − v_p(0), where v_p(0) = V/(1 + (ωτ)²). K = ?", a: -5, unit: "V", why: "v_p(0) = 10/2 = 5 V, so K = −5 V." },
        { t: "mcq", q: "Why can 6.002 Chapter 13 ignore the transient?", opts: [["It dies away as e^(−t/τ); 'sinusoidal steady state' means after it has gone", true, "Phasors find only the particular (steady) part."], ["There is no transient with sinusoids", false, "There is, unless the initial condition happens to match v_p(0)."], ["Because τ = 0", false, "Real circuits have τ > 0."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What are the two parts of a driven circuit's response, and which one do phasors give you?", model: "A transient part, the natural decaying exponential, whose size is set by the initial conditions, and a steady-state part that is a sinusoid at the input frequency. Phasors give only the steady-state part, which is all that's left after a few time constants." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "Second order: fitting the initial conditions", mins: 25,
    blurb: "A second-order solution has two unknown constants. x(0) and x′(0) pin them down.",
    takeaway: "Underdamped: x = x_f + e^(−αt)(A cos ω_d t + B sin ω_d t), with A = x(0) − x_f and B = [x′(0) + αA]/ω_d. Overdamped: x = x_f + A₁e^(s₁t) + A₂e^(s₂t), with A₁ + A₂ = x(0) − x_f and s₁A₁ + s₂A₂ = x′(0) (two equations, two unknowns). Circuit initial slopes come from element laws: dv_C/dt(0) = i_C(0)/C, di_L/dt(0) = v_L(0)/L.",
    steps: [
      { k: "learn", title: "Two constants, two conditions", b: [
        `<p>A second-order equation needs two facts at t = 0: the value x(0) and the slope x′(0).</p>`,
        `<div class="eq">x = x<sub>f</sub> + e<sup>−αt</sup>(A cos ω<sub>d</sub>t + B sin ω<sub>d</sub>t)</div>`,
        `<div class="two"><div class="tile"><h3>At t = 0</h3><div class="eq">x(0) = x<sub>f</sub> + A</div></div><div class="tile"><h3>Slope at t = 0</h3><div class="eq">x′(0) = −αA + ω<sub>d</sub>B</div></div></div>`,
      ]},
      { k: "play", title: "Set the start", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let x0 = 0, d0 = 0;
          const a = 1, wd = 2, xf = 1;
          function draw() {
            const A = x0 - xf, B = (d0 + a * A) / wd, x = (t) => xf + Math.exp(-a * t) * (A * Math.cos(wd * t) + B * Math.sin(wd * t));
            f.innerHTML = plot({ x: [0, 6], y: [-2, 3], xt: [0, 1, 2, 3, 4, 5, 6], yt: [-2, -1, 0, 1, 2, 3], xl: "t (s)", h: 240, series: [{ f: () => xf, cls: "s5" }, { f: x, cls: "s1" }, { f: (t) => x0 + d0 * t, from: 0, to: 0.6, cls: "s3" }], marks: [{ x: 0, y: x0 }], label: "Underdamped response with a chosen starting value and slope" });
            ro.innerHTML = readout([["A = x(0) − x_f", fmt(A, 3)], ["B = (x′(0) + αA)/ω_d", fmt(B, 3)], ["x(t)", `1 + e^(−t)(${fmt(A, 3)} cos 2t + ${fmt(B, 3)} sin 2t)`]]);
          }
          host.append(f, slider({ id: id + "-x", label: "x(0)", min: -1.5, max: 2.5, step: 0.25, value: x0 }, (v) => { x0 = v; draw(); }).el, slider({ id: id + "-d", label: "x′(0)", min: -4, max: 4, step: 0.5, value: d0 }, (v) => { d0 = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">x″ + 2x′ + 5x = 5: α = 1, ω₀ = √5, ω<sub>d</sub> = 2, x<sub>f</sub> = 1. The green stub is the starting slope.</p>`,
      ]},
      { k: "math", title: "Overdamped: a 2 × 2 system", b: [
        `<p>x″ + 3x′ + 2x = 2, x(0) = 0, x′(0) = 0. Roots s = −1, −2; x<sub>f</sub> = 1.</p>`,
        { t: "reveal", label: "Write the two conditions", html: `<div class="eq">A₁ + A₂ = 0 − 1 = −1<br>−A₁ − 2A₂ = 0</div>` },
        { t: "reveal", label: "Solve", html: `<div class="eq">A₁ = −2, A₂ = 1   →   x = 1 − 2e<sup>−t</sup> + e<sup>−2t</sup></div><p class="aside">Check: x(0) = 1 − 2 + 1 = 0 ✓; x′(0) = 2 − 2 = 0 ✓.</p>` },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Underdamped, α = 1, ω_d = 2, x_f = 1, x(0) = 0, x′(0) = 0. B = ?", a: -0.5, why: "A = −1; B = (0 + 1 × (−1))/2 = −0.5." },
        { t: "num", q: "A capacitor (C = 2 µF) carries i_C(0) = 4 mA at t = 0. dv_C/dt at t = 0 in V/ms?", a: 2, unit: "V/ms", why: "i/C = 4 mA/2 µF = 2000 V/s = 2 V/ms." },
        { t: "num", q: "x″ + 4x′ + 3x = 0, x(0) = 2, x′(0) = 0. Roots −1, −3. A₁ (on e^(−t)) = ?", a: 3, hint: "A₁ + A₂ = 2; −A₁ − 3A₂ = 0.", why: "A₁ = 3, A₂ = −1: x = 3e^(−t) − e^(−3t)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a second-order circuit need two initial conditions?", model: "Its solution has two independent pieces, each with an unknown constant. One fact, like the starting value, can only fix one combination of them, so you also need the starting slope, which in a circuit comes from the capacitor current or inductor voltage at that instant." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m15", eyebrow: "Math Toolkit · Module 15", title: "Differential Equations",
    intro: `<p>Five parts: what a differential equation says, the three-number recipe for first-order circuits, the characteristic equation for second-order ones, the forced (sinusoidal) response, and fitting initial conditions. You need <a href="08-exp-log.html">Module 8</a> (exponentials) and <a href="07-quadratics.html">Module 7</a> (quadratics) first.</p>`,
    after: `<p>For first-order problems, write the three numbers (initial, final, τ) before anything else. For second-order, find α and ω₀ first.</p>`,
    parts: [p1, p2, p3, p4, p5],
    summary: `
      <p>RC: dv/dt = (V<sub>S</sub> − v)/τ, τ = RC. RL: τ = L/R.</p>
      <div class="eq">x(t) = x(∞) + [x(0⁺) − x(∞)]e<sup>−t/τ</sup></div>
      <p>v<sub>C</sub> and i<sub>L</sub> can't jump. At ∞: C open, L short. τ = R<sub>Th</sub>C or L/R<sub>Th</sub>.</p>
      <div class="eq">s² + 2αs + ω<sub>0</sub>² = 0 → s = −α ± √(α² − ω<sub>0</sub>²)</div>
      <p>α &gt; ω₀ overdamped · α = ω₀ critical · α &lt; ω₀ underdamped, ω<sub>d</sub> = √(ω₀² − α²). Series RLC: α = R/2L, ω₀ = 1/√(LC), Q = ω₀/2α.</p>
      <p>Driven: x = transient (Ke<sup>−t/τ</sup>) + steady state (sinusoid at ω, from phasors); K = x(0) − x<sub>p</sub>(0).</p>
      <p>Underdamped: A = x(0) − x<sub>f</sub>, B = (x′(0) + αA)/ω<sub>d</sub>. Overdamped: A₁ + A₂ = x(0) − x<sub>f</sub>, s₁A₁ + s₂A₂ = x′(0). dv<sub>C</sub>/dt = i<sub>C</sub>/C, di<sub>L</sub>/dt = v<sub>L</sub>/L.</p>`,
  };
  Course.start(window.CHAPTER);
})();
