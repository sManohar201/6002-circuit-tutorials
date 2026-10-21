(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;
  const tbl = (head, rows) => `<div class="tbl"><table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td class="mono">${c}</td>`).join("")}</tr>`).join("")}</table></div>`;

  /* The diode circuit used all module: 5 V, 1 kΩ, diode with I_S = 1e-14 A, V_T = 26 mV. */
  const Is = 1e-14, VT = 0.026, R = 1000, Vs = 5;
  const F = (v) => (v - Vs) / R + Is * (Math.exp(v / VT) - 1); /* KCL at the diode node: current out, in amps */
  const dF = (v) => 1 / R + (Is / VT) * Math.exp(v / VT);
  const circ = () => S.svg(300, 160, S.vsrc(60, 85, "5 V", { side: "left" }) + S.wire([60, 67], [60, 30], [100, 30]) + S.res(100, 30, 210, 30, "1 kΩ", {}) + S.wire([210, 30], [240, 30]) + S.diode(240, 30, 240, 140, "", {}) + S.dot(240, 30) + S.t(252, 26, "v", { a: "start", cls: "lab" }) + S.wire([60, 103], [60, 140], [240, 140]) + S.gnd(150, 140), { label: "5 V source, 1 kilohm resistor, diode to ground; v is the diode voltage" });
  const mA = (x) => fmt(1000 * x, 4) + " mA";

  const p1 = {
    id: "p1", title: "The problem, and bisection", mins: 20,
    blurb: "A diode circuit has no formula for its answer. Squeeze it out by halving an interval.",
    takeaway: "Nonlinear circuits give equations like (v − 5)/1k + I_S(e^(v/V_T) − 1) = 0 with no algebraic solution. Rewrite as F(v) = 0 and search. Bisection: start with an interval where F changes sign, test the middle, keep the half where the sign still changes. Each step halves the interval: 10 steps give 1000× (three more digits). It always works but is slow. Here v_D ≈ 0.6965 V, I ≈ 4.30 mA.",
    steps: [
      { k: "why", title: "No formula exists", b: [
        fig(circ()),
        `<p>KCL at the diode node, current leaving:</p>`,
        `<div class="eq">F(v) = (v − 5)/1000 + I_S(e<sup>v/V_T</sup> − 1) = 0</div>`,
        `<p>v appears both plain and inside an exponential. No rearranging gets v on its own. 6.002 Chapter 4 solved this graphically (load line) and by trial; simulators solve it by <b>iteration</b>: guess, improve, repeat.</p>`,
      ]},
      { k: "play", title: "Bisection", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), row = el(`<div class="row"></div>`);
          const nb = el(`<button type="button" class="btn primary">Halve the interval</button>`), rb = el(`<button type="button" class="btn ghost">Start again</button>`);
          let a = 0, b = 1, hist = [];
          function draw() {
            const m = (a + b) / 2;
            f.innerHTML = plot({ x: [0, 1], y: [-6, 6], xt: [0, 0.2, 0.4, 0.6, 0.8, 1], yt: [-5, 0, 5], xl: "v (V)", yl: "F(v) in mA", h: 220, areas: [{ f: () => 6, from: a, to: b, base: -6, cls: "ar1" }], series: [{ f: (v) => 1000 * F(v), cls: "s2" }], marks: [{ x: m, y: Math.max(-6, Math.min(6, 1000 * F(m))) }], label: "F(v) with the current interval shaded" });
            ro.innerHTML = readout([["Interval", `${fmt(a, 6)} V to ${fmt(b, 6)} V`], ["Width", si(b - a, "V", 3)], ["Steps taken", hist.length]]);
          }
          nb.addEventListener("click", () => { const m = (a + b) / 2; hist.push(m); if (F(m) > 0) b = m; else a = m; draw(); });
          rb.addEventListener("click", () => { a = 0; b = 1; hist = []; draw(); });
          row.append(nb, rb);
          host.append(f, row, ro);
          draw();
        },
        `<p class="aside">F is negative at 0 V (current flows in from the source) and hugely positive at 1 V (the diode would swallow amps). The answer is somewhere between. Each press tests the middle and keeps the half where F changes sign.</p>`,
      ]},
      { k: "learn", title: "How fast is it?", b: [
        `<p>Each step halves the interval. Starting 1 V wide:</p>`,
        tbl(["Steps", "Width", "Digits known"], [["10", "≈ 1 mV", "3"], ["20", "≈ 1 µV", "6"], ["30", "≈ 1 nV", "9"]]),
        `<p>Steady, guaranteed, but slow: about 3.3 steps per digit, forever. And it only works for one unknown. A chip has millions. Part 2's method is far faster.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Bisection on an interval 2 V wide. How many steps to get below 1 mV?", a: 11, tol: 0, why: "2/2ⁿ < 0.001 → 2ⁿ > 2000 → n = 11 (2¹¹ = 2048)." },
        { t: "mcq", q: "F(0.6) < 0 and F(0.8) > 0. Next interval after testing 0.7 with F(0.7) > 0?", opts: [["0.6 to 0.7", true, "The sign change is between 0.6 (negative) and 0.7 (positive)."], ["0.7 to 0.8", false, "Both ends would be positive: no sign change inside."], ["0.65 to 0.75", false, "Bisection keeps one half, it doesn't re-centre."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does bisection always find the answer, and why is it slow?", model: "If a smooth function is negative at one end of an interval and positive at the other, it must cross zero inside. Testing the middle and keeping the half where the sign still changes always keeps the crossing trapped. It's slow because each step only halves the uncertainty, so you gain one binary digit per step." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Newton's method: ride the tangent", mins: 25,
    blurb: "Replace the curve by its tangent, solve the straight line, repeat. The number of correct digits doubles every step.",
    takeaway: "Newton: x_new = x − F(x)/F′(x). Geometrically, follow the tangent line at your guess down to where it crosses zero. Near the answer the error squares each step (quadratic convergence): 1 correct digit → 2 → 4 → 8. It needs the derivative, and a reasonable starting guess; far away it can overshoot or wander. For √2: x_new = (x + 2/x)/2: 1, 1.5, 1.41667, 1.4142157…",
    steps: [
      { k: "learn", title: "The idea", b: [
        `<p>Near your guess, a smooth curve looks like its tangent line (Module 13). A straight line's zero is easy to find. So:</p>`,
        `<div class="eq">x_new = x − F(x)/F′(x)</div>`,
        steps([["Tangent at x", "y = F(x) + F′(x)·(t − x)"], ["Set y = 0 and solve for t", "t = x − F(x)/F′(x)"], ["Use t as the new guess", "repeat"]]),
      ]},
      { k: "play", title: "Watch it home in", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), row = el(`<div class="row"></div>`);
          const nb = el(`<button type="button" class="btn primary">Newton step</button>`), rb = el(`<button type="button" class="btn ghost">Start again</button>`);
          let x0 = 0.8, xs = [x0];
          const G = (x) => x * x - 2, dG = (x) => 2 * x;
          function draw() {
            const x = xs[xs.length - 1], tang = (t) => G(x) + dG(x) * (t - x);
            f.innerHTML = plot({ x: [0.5, 3.5], y: [-2, 10], xt: [1, 2, 3], yt: [0, 5, 10], xl: "x", yl: "F(x) = x² − 2", h: 230, series: [{ f: G, cls: "s2" }, { f: tang, cls: "s4" }], marks: xs.map((v, i) => ({ x: v, y: G(v), cls: i === xs.length - 1 ? "mk" : "mk2", r: 5 })), label: "Parabola x squared minus 2 with the tangent at the current guess" });
            ro.innerHTML = tbl(["Step", "x", "Error from √2"], xs.map((v, i) => [i, v.toPrecision(12), fmt(Math.abs(v - Math.SQRT2), 3)]));
          }
          nb.addEventListener("click", () => { const x = xs[xs.length - 1]; if (xs.length < 8) xs.push(x - G(x) / dG(x)); draw(); });
          rb.addEventListener("click", () => { xs = [x0]; draw(); });
          row.append(nb, rb);
          host.append(f, slider({ id: id + "-x", label: "Starting guess", min: 0.6, max: 3.4, step: 0.1, value: x0 }, (v) => { x0 = v; xs = [v]; draw(); }).el, row, ro);
          draw();
        },
        `<p class="aside">Watch the error column: 10⁻¹, 10⁻³, 10⁻⁶, 10⁻¹²: the exponent doubles each step. That's <b>quadratic convergence</b>. Bisection would need about 40 steps for what Newton does in 5.</p>`,
      ]},
      { k: "why", title: "Why the digits double", b: [
        `<p>Near the answer r, F(x) ≈ F′(r)(x − r) + ½F″(r)(x − r)². Newton removes the straight-line part exactly, so what's left is the curvature term: the new error is proportional to the <b>square</b> of the old one.</p>`,
        `<div class="key"><b>Error 10⁻³ → about 10⁻⁶ → about 10⁻¹².</b> Once Newton is close, it finishes in two or three steps. That's why simulators use it. The catch is the word “close”.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Newton for √2 from x = 1.5: x_new = (x + 2/x)/2 = ?", a: 1.41667, tol: 0.0001, why: "(1.5 + 1.3333)/2 = 1.41667. One step later: 1.4142157, already 6 digits." },
        { t: "mcq", q: "F(x) = x³ − 8 at x = 3: F = 19, F′ = 27. New guess?", opts: [["3 − 19/27 ≈ 2.30", true, "x − F/F′. Next steps: 2.04, 2.0006, …"], ["3 + 19/27", false, "Sign: subtract F/F′."], ["19/27", false, "That's the step size, not the new point."]] },
        { t: "mcq", q: "Newton needs F′(x). What happens if F′(x) ≈ 0 at your guess?", opts: [["The tangent is nearly flat, so it hits zero far away: a huge, wild step", true, "Dividing by a tiny slope throws the guess off the map."], ["It converges faster", false, "A flat tangent is the worst case."], ["Nothing special", false, "x − F/F′ blows up."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe Newton's method in words.", model: "At your current guess, draw the tangent line to the curve. Follow it down to where it crosses zero and use that as the next guess. Repeat. Close to the answer the curve is nearly straight, so each step removes most of the error and the number of correct digits roughly doubles." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Newton inside SPICE: companion models", mins: 30,
    blurb: "Each Newton step replaces every nonlinear device by its tangent: a conductance plus a current source. Then it's a linear circuit.",
    takeaway: "Linearise the diode at the guess v_k: i ≈ I_k + g_k(v − v_k), with g_k = dI/dv = (I_S/V_T)e^(v_k/V_T). That's a conductance g_k in parallel with a current source I_k − g_k·v_k: the companion model. Stamp it into the matrix (Module 25), solve the linear circuit, get v_(k+1). That's exactly one Newton step. Repeat until nothing changes. Starting far off, the exponential makes Newton crawl (171 steps from 0 V here); SPICE limits how far a junction voltage may move per step, which cuts it to about 11. The final companion conductance is the small-signal model.",
    steps: [
      { k: "learn", title: "Replace the diode by its tangent", b: [
        `<p>At the guess v<sub>k</sub>, the diode's current curve is approximately its tangent line:</p>`,
        `<div class="eq">i ≈ I_k + g_k·(v − v_k)     g_k = (I_S/V_T)·e<sup>v_k/V_T</sup></div>`,
        `<p>Rearranged: i = g<sub>k</sub>·v + (I<sub>k</sub> − g<sub>k</sub>v<sub>k</sub>). A conductance in parallel with a constant current source. That's a <b>companion model</b>.</p>`,
        fig(S.svg(470, 150, S.diode(60, 20, 60, 130, "", {}) + S.t(60, 145, "diode", { cls: "lab" }) + S.t(150, 80, "→", { cls: "big" }) + S.wire([250, 20], [320, 20]) + S.wire([250, 130], [320, 130]) + S.wire([250, 20], [250, 45]) + S.res(250, 45, 250, 105, "g_k", { side: "left" }) + S.wire([250, 105], [250, 130]) + S.wire([320, 20], [320, 57]) + S.isrc(320, 75, "I_k − g_k·v_k", { side: "right", down: true }) + S.wire([320, 93], [320, 130]), { label: "The diode replaced by a conductance g_k in parallel with a current source I_k minus g_k v_k" })),
      ]},
      { k: "why", title: "One linear solve = one Newton step", b: [
        `<p>With every nonlinear device replaced by its companion, the circuit is linear: stamp and solve (Module 25). The answer is v<sub>k+1</sub>. Re-linearise there and solve again.</p>`,
        `<div class="key"><b>That's SPICE's DC operating-point loop.</b> For a chip with a million transistors: build companion models for all of them (g<sub>m</sub>, g<sub>o</sub> and current sources from each device's equations), solve the big sparse linear system, repeat. Typically 5–50 iterations. With many unknowns, F′ becomes a matrix of partial derivatives (the Jacobian), and that matrix is exactly the circuit's small-signal conductance matrix.</div>`,
      ]},
      { k: "play", title: "Run the loop", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), row = el(`<div class="row"></div>`);
          const nb = el(`<button type="button" class="btn primary">One iteration</button>`), fb = el(`<button type="button" class="btn">Run to convergence</button>`), rb = el(`<button type="button" class="btn ghost">Start again</button>`);
          let v0 = 0.55, lim = false, vs = [v0];
          const step = (v) => { let d = -F(v) / dF(v); if (lim) d = Math.max(-0.1, Math.min(0.1, d)); return v + d; };
          function draw() {
            const v = vs[vs.length - 1], gk = dF(v) - 1 / R, Ik = Is * (Math.exp(v / VT) - 1);
            f.innerHTML = plot({ x: [0, 1], y: [0, 10], xt: [0, 0.2, 0.4, 0.6, 0.8, 1], yt: [0, 5, 10], xl: "v (V)", yl: "current (mA)", h: 220, series: [{ f: (x) => 1000 * Is * (Math.exp(x / VT) - 1), cls: "s1" }, { f: (x) => (1000 * (Vs - x)) / R, cls: "s2" }, { f: (x) => 1000 * (Ik + gk * (x - v)), cls: "s4" }], marks: [{ x: Math.min(1, v), y: Math.min(10, 1000 * Ik) }], label: "Diode curve (orange), resistor load line (blue), and the companion tangent (red dashed)" });
            const last = vs.slice(-4);
            ro.innerHTML = readout([["Iterations", vs.length - 1], ["Current guess v", fmt(v, 7) + " V"], ["Companion g_k", si(gk, "S", 3)], ["Residual |F| (KCL error)", si(Math.abs(F(v)), "A", 3)]]) + tbl(["k", "v_k (V)"], last.map((x, i) => [vs.length - last.length + i, x.toPrecision(10)]));
          }
          nb.addEventListener("click", () => { if (vs.length < 400) vs.push(step(vs[vs.length - 1])); draw(); });
          fb.addEventListener("click", () => { let n = 0; while (Math.abs(F(vs[vs.length - 1])) > 1e-12 && n++ < 400) vs.push(step(vs[vs.length - 1])); draw(); });
          rb.addEventListener("click", () => { vs = [v0]; draw(); });
          row.append(nb, fb, rb);
          host.append(f, slider({ id: id + "-v", label: "Starting guess", min: 0, max: 0.9, step: 0.05, value: v0, show: (v) => fmt(v, 3) + " V" }, (v) => { v0 = v; vs = [v]; draw(); }).el,
            toggle(["Plain Newton", "Limit each step to 0.1 V"], (i) => { lim = i === 1; vs = [v0]; draw(); }, 0), row, ro);
          draw();
        },
        `<p class="aside">From 0.55 V it converges in a handful of steps. Now set the start to 0 V and run to convergence with plain Newton: the first step leaps to 5 V, where e<sup>v/V<sub>T</sub></sup> is astronomically large, then crawls back about 26 mV per step (171 iterations). Turn on step limiting: 11.</p>`,
      ]},
      { k: "learn", title: "How SPICE keeps Newton tame", b: [
        `<ul><li><b>Junction voltage limiting:</b> never let a diode or transistor junction voltage jump by more than a little per iteration (SPICE uses a log-based rule).</li><li><b>Good starting guesses:</b> node sets, or the previous solution in a sweep.</li><li><b>Source stepping / gmin stepping:</b> if it still fails, ramp the supplies up from 0 in small steps, or add tiny conductances to ground and remove them gradually, so each solve starts close to the last.</li></ul>`,
        `<div class="key"><b>When SPICE says “no convergence in DC operating point”</b>, Newton wandered. Usual causes: a node with no DC path (Module 24), a model discontinuity, or a circuit with several stable states (a latch) and no hint which to pick.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "At v_k = 0.7 V, the diode current is 4.9 mA. Companion conductance g_k = I/V_T (mS), using V_T = 26 mV?", a: 188, tol: 0.02, why: "4.9 mA/26 mV ≈ 188 mS, i.e. about 5.3 Ω. (I_S e^(v/V_T)/V_T ≈ I/V_T.)" },
        { t: "mcq", q: "When Newton has converged, what is the final companion conductance g_k?", opts: [["The diode's small-signal conductance 1/r_d at the operating point", true, "The tangent at the answer is the small-signal model."], ["Zero", false, "The diode is conducting 4.3 mA: its slope is large."], ["1/R", false, "That belongs to the resistor."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain how a simulator finds the DC operating point of a circuit with diodes and transistors.", model: "It guesses node voltages, then replaces each nonlinear device by its tangent at that guess: a conductance in parallel with a current source. The circuit becomes linear, so it stamps and solves the matrix to get new voltages. It repeats this Newton step, limiting big jumps in junction voltages, until the voltages stop changing and KCL is satisfied." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Stepping through time", mins: 30,
    blurb: "A transient simulation turns derivatives into differences. Forward Euler, backward Euler and trapezoidal, and why simulators prefer the backward kinds.",
    takeaway: "For dv/dt = f(v): forward Euler v_(n+1) = v_n + h·f(v_n) (uses the old slope); backward Euler v_(n+1) = v_n + h·f(v_(n+1)) (uses the new slope, so you solve an equation each step); trapezoidal averages the two. For an RC with time constant τ: forward Euler multiplies the error by (1 − h/τ) each step, so it blows up if h > 2τ. Backward Euler multiplies by 1/(1 + h/τ): always stable. Trapezoidal is more accurate but can ring when h ≫ τ. Backward Euler turns a capacitor into a companion model: conductance C/h in parallel with a source C·v_n/h.",
    steps: [
      { k: "learn", title: "From derivative to difference", b: [
        `<p>An RC charging from a step: dv/dt = (V<sub>s</sub> − v)/τ. The computer can't do “infinitely small”. It takes steps of size h:</p>`,
        `<div class="tbl"><table><tr><th>Method</th><th>Update</th><th>Slope used</th></tr><tr><td>Forward Euler</td><td class="mono">v₊ = v + h·f(v)</td><td>old (start of step)</td></tr><tr><td>Backward Euler</td><td class="mono">v₊ = v + h·f(v₊)</td><td>new (end of step)</td></tr><tr><td>Trapezoidal</td><td class="mono">v₊ = v + (h/2)[f(v) + f(v₊)]</td><td>average</td></tr></table></div>`,
        `<p class="aside">The backward ones have v₊ on both sides: an equation to solve every step (for a circuit, a matrix solve, plus Newton if it's nonlinear). More work per step, but they can take far bigger steps.</p>`,
      ]},
      { k: "play", title: "Race the three methods", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let h = 0.5;
          function draw() {
            const N = Math.ceil(8 / h), fe = [[0, 0]], be = [[0, 0]], tr = [[0, 0]];
            let a = 0, b = 0, c = 0;
            for (let n = 1; n <= N; n++) { a = a + h * (1 - a); b = (b + h) / (1 + h); c = (c * (1 - h / 2) + h) / (1 + h / 2); fe.push([n * h, a]); be.push([n * h, b]); tr.push([n * h, c]); }
            f.innerHTML = plot({ x: [0, 8], y: [-0.5, 2], xt: [0, 2, 4, 6, 8], xtf: (v) => v + "τ", yt: [0, 0.5, 1, 1.5, 2], xl: "t", yl: "v", h: 240, series: [{ f: (t) => 1 - Math.exp(-t), cls: "s5" }, { pts: fe, cls: "s4" }, { pts: be, cls: "s2" }, { pts: tr, cls: "s3" }], label: "Exact RC charging (grey dashed), forward Euler (red), backward Euler (blue), trapezoidal (green)" });
            const g = (x) => fmt(x, 3);
            ro.innerHTML = readout([["Error multiplier per step, forward Euler (1 − h/τ)", g(1 - h)], ["Backward Euler 1/(1 + h/τ)", g(1 / (1 + h))], ["Trapezoidal (1 − h/2τ)/(1 + h/2τ)", g((1 - h / 2) / (1 + h / 2))], ["Exact e^(−h/τ)", g(Math.exp(-h))]]);
          }
          host.append(f, slider({ id: id + "-h", label: "Step size h", min: 0.1, max: 3, step: 0.05, value: h, show: (v) => fmt(v, 3) + "τ" }, (v) => { h = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Red = forward Euler, blue = backward, green = trapezoidal, grey = exact. Push h past τ: forward Euler overshoots; past 2τ it explodes. Backward Euler never misbehaves, just lags. Trapezoidal tracks best at small h but zig-zags at large h.</p>`,
      ]},
      { k: "why", title: "Why it matters: stiff circuits", b: [
        `<p>A chip has time constants from picoseconds (a tiny gate node) to microseconds (a bias filter). To see the microsecond behaviour you want steps of nanoseconds. Forward Euler would need h &lt; 2 × (the <i>smallest</i> τ), so picoseconds, for the whole run: a million times too many steps. Such circuits are called <b>stiff</b>.</p>`,
        `<div class="key"><b>That's why SPICE uses implicit methods</b> (backward Euler, trapezoidal, Gear): stable for any step, so the step can follow the slow action while the fast modes simply settle.</div>`,
      ]},
      { k: "learn", title: "A capacitor becomes a resistor (each step)", b: [
        `<p>Backward Euler for a capacitor: i<sub>n+1</sub> = C(v<sub>n+1</sub> − v<sub>n</sub>)/h = (C/h)·v<sub>n+1</sub> − (C/h)·v<sub>n</sub>.</p>`,
        `<div class="eq">capacitor → conductance C/h  ∥  current source (C/h)·v_n</div>`,
        `<p>Another companion model. Every time step, every capacitor and inductor becomes a resistor plus a source; every transistor becomes its Newton companion; then one sparse matrix solve. That loop, repeated millions of times, is a transient simulation.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "RC step response (τ = 1, from 0 towards 1), one forward-Euler step with h = 0.5. v after the step?", a: 0.5, why: "0 + 0.5 × (1 − 0) = 0.5. Exact: 1 − e^(−0.5) = 0.393." },
        { t: "num", q: "Same step with backward Euler?", a: 0.3333, tol: 0.01, why: "v₊ = (0 + 0.5)/1.5 = 0.333." },
        { t: "num", q: "…and trapezoidal?", a: 0.4, tol: 0.01, why: "v₊ = 0.5/(1 + 0.25) = 0.4: closest to the exact 0.393." },
        { t: "num", q: "Backward-Euler companion conductance of a 1 pF capacitor with a 1 ps step (in S)?", a: 1, why: "C/h = 10⁻¹²/10⁻¹² = 1 S, i.e. 1 Ω. Tiny steps make capacitors look like near-shorts in the matrix." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do circuit simulators prefer backward Euler or trapezoidal over forward Euler?", model: "Forward Euler is only stable when the step is smaller than about twice the fastest time constant, and chips have time constants down to picoseconds, so it would need impossibly many steps. Implicit methods like backward Euler stay stable for any step size, so the simulator can use steps sized for the slow behaviour it cares about." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "Error, tolerance and step control", mins: 20,
    blurb: "How accurate is a simulation? The step size sets the error, and the simulator adjusts it as it goes.",
    takeaway: "Global error shrinks like hᵖ, where p is the method's order: backward Euler p = 1 (halve h, halve the error), trapezoidal p = 2 (halve h, quarter the error). Simulators estimate the local error each step and shrink h at fast edges, grow it in quiet stretches (adaptive step). Tolerances (RELTOL ~ 10⁻³, ABSTOL ~ 1 pA, VNTOL ~ 1 µV) decide when Newton has converged and when a step is accurate enough. “Timestep too small” means the simulator kept shrinking h and still couldn't meet them, usually from a discontinuity or a non-converging Newton.",
    steps: [
      { k: "learn", title: "Order: how error scales", b: [
        tbl(["Method", "Order p", "Halve h → error"], [["Forward/backward Euler", "1", "÷2"], ["Trapezoidal", "2", "÷4"], ["Gear-2", "2", "÷4"]]),
        `<p>Higher order means you reach the same accuracy with bigger steps, i.e. less work.</p>`,
      ]},
      { k: "play", title: "Measure the order yourself", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const err = (h, m) => { const N = Math.round(2 / h); let v = 0; for (let n = 0; n < N; n++) v = m ? (v * (1 - h / 2) + h) / (1 + h / 2) : (v + h) / (1 + h); return Math.abs(v - (1 - Math.exp(-2))); };
          const hs = [0.4, 0.2, 0.1, 0.05, 0.025, 0.0125];
          f.innerHTML = plot({ x: [-2, -0.3], y: [-6, -1], xt: [-2, -1.5, -1, -0.5], xtf: (v) => fmt(10 ** v, 2), yt: [-6, -5, -4, -3, -2, -1], ytf: (v) => "10" + String(v).replace("-", "⁻").replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]), xl: "step h (log)", yl: "error at t = 2τ (log)", h: 240, series: [{ pts: hs.map((h) => [Math.log10(h), Math.log10(err(h, 0))]), cls: "s2" }, { pts: hs.map((h) => [Math.log10(h), Math.log10(err(h, 1))]), cls: "s3" }], marks: hs.map((h) => ({ x: Math.log10(h), y: Math.log10(err(h, 0)), cls: "mk2", r: 4 })).concat(hs.map((h) => ({ x: Math.log10(h), y: Math.log10(err(h, 1)), cls: "mk", r: 4 }))), label: "Log-log plot of error against step size for backward Euler (blue) and trapezoidal (green)" });
          ro.innerHTML = tbl(["h/τ", "Backward Euler error", "Trapezoidal error"], hs.map((h) => [h, err(h, 0).toExponential(2), err(h, 1).toExponential(2)]));
          host.append(f, ro);
        },
        `<p class="aside">On log–log axes the slope is the order: blue climbs 1 decade per decade of h, green 2. Check the table: each halving of h halves the blue error and quarters the green.</p>`,
      ]},
      { k: "learn", title: "Adaptive steps and tolerances", b: [
        `<ul><li>Each step, the simulator estimates its own error (e.g. by comparing two methods). Too big: reject and retry with smaller h. Comfortably small: grow h next time.</li><li>Result: tiny steps at clock edges, huge steps between them.</li><li>Newton has its own tolerances: change in each node voltage below RELTOL·|v| + VNTOL, KCL error below RELTOL·|i| + ABSTOL.</li></ul>`,
        `<div class="key"><b>Practical sense.</b> Default RELTOL = 10⁻³ means about 0.1% accuracy. Fine for most work, but not for measuring a 1 µV offset on a 1 V signal, or for long oscillator runs where small phase errors pile up. Tighten tolerances when the quantity you want is tiny compared with the signals around it.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A trapezoidal simulation has 1% error. You cut every step to a third. New error about…", opts: [["0.11%", true, "Order 2: (1/3)² = 1/9."], ["0.33%", false, "That would be first order."], ["0.04%", false, "That would be third order."]] },
        { t: "mcq", q: "You need the 10 µV output of a chopper amplifier riding on 1 V swings. What should you change?", opts: [["Tighten RELTOL (and VNTOL), and check the answer doesn't move when you tighten further", true, "0.1% of 1 V is 1 mV: a hundred times bigger than what you want to see."], ["Nothing: SPICE is exact", false, "It's exact only to its tolerances."], ["Use forward Euler", false, "Stability, not accuracy, would get worse."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How can you check that a simulation result is trustworthy?", model: "Tighten the tolerances or shrink the maximum step and run again. If the result doesn't change in the digits you care about, it's converged. If it moves, the original settings weren't accurate enough for that quantity." },
      ]},
    ],
  };

  const p6 = {
    id: "p6", title: "Master it", mins: 30,
    blurb: "Iterations, companion models, stability and accuracy.",
    takeaway: "You can solve nonlinear equations by bisection and Newton, build companion models, explain SPICE's DC loop and convergence aids, pick an integration method, and judge accuracy from step size and tolerances.",
    steps: [
      { k: "check", title: "Problem 1: by hand", b: [
        { t: "num", q: "Newton on F(x) = x² − 10 from x = 3: next guess (4 significant figures)?", a: 3.1667, tol: 0.001, hint: "x − (x² − 10)/(2x).", why: "3 − (−1)/6 = 3.1667. Then 3.16228, and √10 = 3.16228." },
      ]},
      { k: "check", title: "Problem 2: the diode circuit", b: [
        fig(circ()),
        { t: "num", q: "Use the fixed-point trick: I = (5 − v)/1k, then v = V_T ln(I/I_S). Start with v = 0.7 V. What is v after one pass (V, 4 decimals)?", a: 0.6965, tol: 0.0005, hint: "I = 4.3 mA. ln(4.3×10⁻³/10⁻¹⁴) = ln(4.3×10¹¹).", why: "ln(4.3×10¹¹) = 26.787, × 0.026 = 0.6965 V. The exact answer is 0.69648 V: this simple iteration converges fast because the log flattens errors." },
      ]},
      { k: "check", title: "Problem 3: stability limit", b: [
        { t: "num", q: "Fastest time constant in a circuit is 5 ps. Largest stable forward-Euler step (ps)?", a: 10, why: "h < 2τ = 10 ps. Backward Euler has no such limit." },
      ]},
      { k: "check", title: "Problem 4: companion inductor", b: [
        `<p>Backward Euler for an inductor: v<sub>n+1</sub> = L(i<sub>n+1</sub> − i<sub>n</sub>)/h.</p>`,
        { t: "mcq", q: "Its companion model is…", opts: [["A conductance h/L in parallel with a current source i_n", true, "i_(n+1) = (h/L)·v_(n+1) + i_n: conductance h/L plus a constant current i_n."], ["A conductance L/h with a voltage source", false, "Solve for i_(n+1): the conductance is h/L."], ["A short circuit", false, "Only in the DC limit (h → ∞)."]] },
      ]},
      { k: "check", title: "Problem 5: diagnose", b: [
        { t: "mcq", q: "A transient run of an SRAM cell stops with “timestep too small” exactly when the word line switches. Most likely cause?", opts: [["Newton can't converge at that instant: the cell is flipping between two stable states with a very sharp change", true, "The simulator shrinks h to help Newton, runs out of room, and gives up. Fixes: smoother input edges, better initial conditions, or relaxed tolerances."], ["The step size was set too small by the user", false, "The message means the simulator shrank it automatically."], ["SRAM can't be simulated", false, "It's simulated every day."]] },
      ]},
      { k: "say", title: "Problem 6: explain it", b: [
        { t: "say", q: "Put it together: describe one time step of a SPICE transient simulation of a CMOS inverter driving a capacitor.", model: "The simulator picks a step h. It replaces each capacitor by its integration companion, a conductance C over h with a current source from the last voltage. It guesses the new node voltages, replaces each transistor by its Newton companion at that guess, stamps everything into a sparse matrix and solves. It repeats the Newton loop until the voltages stop changing, checks the estimated time-step error against its tolerances, then accepts the step and chooses the next h, or rejects it and retries with a smaller one." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m28", eyebrow: "Math Toolkit · Module 28", title: "Numerical Methods: How Simulators Think",
    intro: `<p>Six parts: bisection, Newton's method, Newton inside SPICE (companion models and convergence aids), stepping through time (Euler and trapezoidal), error and step-size control, and mastery problems.</p><p>Why a chip designer needs this: you'll spend more time with a simulator than with a soldering iron. Knowing what it's doing turns its error messages into clues and its results into something you can trust.</p><p class="aside">Before this: Modules 13 (derivatives), 15 (differential equations) and 25 (matrix circuit solving). Pairs with 6.002 Chapter 4 (nonlinear circuits).</p>`,
    after: `<p>Next: Module 29 pushes tangent lines further, into Taylor series, distortion and the geometric series behind every feedback loop.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <p><b>Bisection:</b> keep the half with the sign change; ×½ per step (~3.3 steps per digit). Always works, slow.</p>
      <div class="eq">Newton: x₊ = x − F(x)/F′(x)</div>
      <p>Quadratic convergence (digits double) once close. Needs F′; can wander from bad guesses.</p>
      <p><b>Companion model</b> (diode at v_k): conductance g_k = (I_S/V_T)e^(v_k/V_T) ∥ source I_k − g_kv_k. One linear solve = one Newton step. Converged g_k = small-signal 1/r_d. Aids: junction limiting, source/gmin stepping.</p>
      <p><b>Time stepping</b> (dv/dt = f): FE v₊ = v + hf(v), stable only h &lt; 2τ_min. BE v₊ = v + hf(v₊), always stable. TR averages; order 2; may ring at big h. Stiff circuits → implicit methods.</p>
      <p>BE companions: C → conductance C/h ∥ source (C/h)v_n; L → conductance h/L ∥ source i_n.</p>
      <p><b>Accuracy:</b> error ∝ hᵖ (BE p = 1, TR p = 2). Adaptive steps; RELTOL ≈ 10⁻³. Check convergence by tightening and re-running.</p>`,
  };
  Course.start(window.CHAPTER);
})();
