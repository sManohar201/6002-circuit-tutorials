(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;
  const tbl = (head, rows) => `<div class="tbl"><table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`;
  const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
  /* Harmonic amplitudes 1..K of a periodic sample array (one period). */
  function harmonics(ys, K) {
    const N = ys.length, out = [];
    for (let k = 1; k <= K; k++) { let c = 0, s = 0; ys.forEach((y, n) => { c += y * Math.cos((2 * Math.PI * k * n) / N); s += y * Math.sin((2 * Math.PI * k * n) / N); }); out.push((2 / N) * Math.hypot(c, s)); }
    return out;
  }

  const p1 = {
    id: "p1", title: "Taylor series: a polynomial copy", mins: 25,
    blurb: "Match a function's value, slope, curvature, and so on at one point. The polynomial that does it is the Taylor series.",
    takeaway: "Near x = a, f(x) ≈ f(a) + f′(a)(x − a) + f″(a)(x − a)²/2! + f‴(a)(x − a)³/3! + … Each term matches one more derivative: value, slope, curvature… Around a = 0 (a Maclaurin series): eˣ = 1 + x + x²/2 + x³/6 + …, sin x = x − x³/6 + …, cos x = 1 − x²/2 + …, 1/(1 − x) = 1 + x + x² + … (only for |x| < 1). More terms fit a wider range. The first term you drop tells you roughly how big the error is.",
    steps: [
      { k: "learn", title: "Copy the function one derivative at a time", b: [
        `<p>You want a simple polynomial that behaves like f(x) near x = 0.</p>`,
        steps([["Match the value", "p(x) = f(0)"], ["Also match the slope (Module 13's tangent line)", "+ f′(0)·x"], ["Also match the curvature", "+ f″(0)·x²/2"], ["Also match the rate of change of curvature…", "+ f‴(0)·x³/6"]]),
        `<div class="eq">f(x) ≈ Σ f⁽ⁿ⁾(0)·xⁿ/n!</div>`,
        `<p class="aside">Why divide by n!? Differentiating xⁿ n times gives n!, so dividing makes the n-th derivative of the polynomial come out exactly f⁽ⁿ⁾(0).</p>`,
      ]},
      { k: "play", title: "Add terms and watch the fit spread", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const FN = [
            ["eˣ", Math.exp, (n) => 1 / fact(n), [-3, 3], [-1, 12], [0, 4, 8, 12]],
            ["sin x", Math.sin, (n) => (n % 2 ? ((n - 1) / 2) % 2 ? -1 : 1 : 0) / fact(n), [-7, 7], [-2, 2], [-2, -1, 0, 1, 2]],
            ["ln(1 + x)", (x) => (x > -1 ? Math.log(1 + x) : NaN), (n) => (n === 0 ? 0 : (n % 2 ? 1 : -1) / n), [-1, 2.5], [-3, 2], [-3, -2, -1, 0, 1, 2]],
            ["1/(1 − x)", (x) => 1 / (1 - x), () => 1, [-2, 1.5], [-2, 8], [-2, 0, 2, 4, 6, 8]],
          ];
          let fi = 0, N = 2;
          function draw() {
            const [nm, fn, co, xr, yr, yt] = FN[fi], p = (x) => { let s = 0; for (let n = 0; n <= N; n++) s += co(n) * x ** n; return s; };
            f.innerHTML = plot({ x: xr, y: yr, xt: [Math.ceil(xr[0]), 0, Math.floor(xr[1])], yt, xl: "x", yl: nm, h: 240, series: [{ f: fn, cls: "s2", n: 500 }, { f: p, cls: "s1", n: 500 }], label: "The function (blue) and its Taylor polynomial (orange)" });
            const terms = []; for (let n = 0; n <= N; n++) { const c = co(n); if (Math.abs(c) > 1e-12) terms.push(`${n ? (c < 0 ? "− " : "+ ") : c < 0 ? "−" : ""}${Math.abs(c) === 1 && n ? "" : fmt(Math.abs(c), 3)}${n ? (n === 1 ? "x" : "x" + "⁰¹²³⁴⁵⁶⁷⁸⁹"[n] ) : ""}`); }
            ro.innerHTML = readout([["Polynomial", terms.join(" ") || "0"], ["Value at x = 1: function / polynomial", `${fmt(fn(1), 4)} / ${fmt(p(1), 4)}`]]);
          }
          host.append(toggle(FN.map((x) => x[0]), (i) => { fi = i; draw(); }, 0), f, slider({ id: id + "-n", label: "Highest power N", min: 0, max: 9, step: 1, value: N }, (v) => { N = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Each extra term widens the region where orange hugs blue. Try 1/(1 − x): beyond x = 1 (and below −1) adding terms makes it <i>worse</i>. Some series only work inside a radius. ln(1 + x) has the same limit.</p>`,
      ]},
      { k: "learn", title: "The series to know by heart", b: [
        tbl(["Function", "Series near 0", "Valid for"], [["eˣ", "1 + x + x²/2 + x³/6 + …", "all x"], ["sin x", "x − x³/6 + x⁵/120 − …", "all x"], ["cos x", "1 − x²/2 + x⁴/24 − …", "all x"], ["1/(1 − x)", "1 + x + x² + x³ + …", "|x| &lt; 1"], ["ln(1 + x)", "x − x²/2 + x³/3 − …", "−1 &lt; x ≤ 1"], ["(1 + x)ⁿ", "1 + nx + n(n − 1)x²/2 + …", "|x| &lt; 1"]]),
        `<p class="aside">6.002 Appendix B used these to prove Euler's formula: put jθ into eˣ and the real and imaginary parts are cos θ and sin θ.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Estimate e^0.1 with 1 + x + x²/2.", a: 1.105, tol: 0.001, why: "1 + 0.1 + 0.005 = 1.105. True: 1.10517. The next term, x³/6 ≈ 0.00017, is the error." },
        { t: "mcq", q: "Why does 1/(1 − x) = 1 + x + x² + … fail at x = 2?", opts: [["The terms 1, 2, 4, 8, … grow without limit, but 1/(1 − 2) = −1", true, "A geometric series only converges for |x| < 1."], ["It works fine", false, "Add the terms: they run off to infinity."], ["Because x = 2 is a pole", false, "The pole is at x = 1; the series' radius of convergence is the distance to it."]] },
        { t: "num", q: "cos(0.2) by 1 − x²/2?", a: 0.98, tol: 0.001, why: "1 − 0.02 = 0.98. True: 0.980067." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is a Taylor series, intuitively?", model: "It's a polynomial built to copy a function near one point: the first term matches its value, the next its slope, the next its curvature, and so on. The more derivatives you match, the further from the point the copy stays accurate." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Approximations that run circuits", mins: 20,
    blurb: "First-order expansions are the tools behind ‘small signal’, ‘much less than’ and every quick estimate.",
    takeaway: "Keep the first term that matters: (1 + x)ⁿ ≈ 1 + nx; √(1 + x) ≈ 1 + x/2; 1/(1 + x) ≈ 1 − x; eˣ ≈ 1 + x; ln(1 + x) ≈ x; all for |x| ≪ 1. Error ≈ the next term. Exponential diode/BJT: e^(v/V_T) ≈ 1 + v/V_T is accurate to 5% only while v &lt; about 2.6 mV (relative error ≈ v/(2V_T)). Parallel resistors: R₁ ∥ R₂ ≈ R₂(1 − R₂/R₁) when R₂ ≪ R₁. A good engineer states the size of the dropped term, not just “≈”.",
    steps: [
      { k: "learn", title: "The first-order toolkit", b: [
        tbl(["Exact", "Approximation", "Next term (error)"], [["(1 + x)ⁿ", "1 + nx", "n(n − 1)x²/2"], ["√(1 + x)", "1 + x/2", "−x²/8"], ["1/(1 + x)", "1 − x", "+x²"], ["eˣ", "1 + x", "x²/2"], ["ln(1 + x)", "x", "−x²/2"], ["sin x, tan x", "x", "∓x³/6, +x³/3"]]),
        `<p class="aside">Rule of thumb: with x = 0.1 the first-order answer is good to about 1% (the x² term is 0.01); with x = 0.3 only to ~5–10%.</p>`,
      ]},
      { k: "math", title: "How small is ‘small signal’ for a BJT?", b: [
        `<p>Collector current i<sub>C</sub> = I<sub>C</sub>e<sup>v/V_T</sup>, with v the signal on top of the bias. Expand:</p>`,
        `<div class="eq">i_C = I_C(1 + v/V_T + v²/(2V_T²) + …)</div>`,
        `<p>The small-signal model keeps only v/V<sub>T</sub> (that's g<sub>m</sub> = I<sub>C</sub>/V<sub>T</sub>). The first dropped term compared with the kept one: <b>v/(2V<sub>T</sub>)</b>.</p>`,
        { t: "reveal", label: "So how small?", html: `<p>For 5% error: v/(2 × 26 mV) = 0.05 → v ≈ 2.6 mV. For 1%: about 0.5 mV. A BJT is linear only for <b>a few millivolts</b> of input. That's why BJT amplifiers either use tiny inputs, emitter degeneration, or feedback.</p>` },
      ]},
      { k: "play", title: "See the error grow", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let v = 5;
          function draw() {
            const ex = Math.exp(v / 26) - 1, li = v / 26;
            f.innerHTML = plot({ x: [-30, 30], y: [-1, 2], xt: [-30, -15, 0, 15, 30], yt: [-1, 0, 1, 2], xl: "v (mV)", yl: "Δi_C/I_C", h: 220, series: [{ f: (x) => Math.exp(x / 26) - 1, cls: "s1" }, { f: (x) => x / 26, cls: "s4" }], marks: [{ x: v, y: ex }], label: "Exact exponential change in current (orange) and the small-signal straight line (dashed)" });
            ro.innerHTML = readout([["Exact Δi/I", fmt(ex, 4)], ["Small-signal v/V_T", fmt(li, 4)], ["Error", fmt((100 * (li - ex)) / ex, 3) + "%"], ["Predicted ≈ −v/(2V_T)", fmt((-100 * v) / 52, 3) + "%"]]);
          }
          host.append(f, slider({ id: id + "-v", label: "Signal v", min: -30, max: 30, step: 0.5, value: v, show: (x) => fmt(x, 3) + " mV" }, (x) => { v = Math.abs(x) < 0.25 ? 0.5 : x; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "learn", title: "Everyday estimates", b: [
        `<ul><li><b>Parallel:</b> R₁ ∥ R₂ = R₂/(1 + R₂/R₁) ≈ R₂(1 − R₂/R₁). 1 kΩ ∥ 100 kΩ ≈ 1 kΩ × 0.99 = 990 Ω (exact 990.1).</li><li><b>Hypotenuse:</b> √(a² + b²) ≈ a(1 + b²/2a²) when b ≪ a. Magnitude of 1 + j0.1: ≈ 1.005.</li><li><b>Phase:</b> arctan x ≈ x (radians) for small x: arctan 0.1 ≈ 0.1 rad = 5.7°.</li><li><b>Square root of a near-square:</b> √(1.02) ≈ 1.01.</li></ul>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "1/(1.03) by first order?", a: 0.97, tol: 0.001, why: "1 − 0.03 = 0.97. Exact 0.97087: the error is about x² = 0.0009." },
        { t: "num", q: "√(1.1) by first order?", a: 1.05, tol: 0.001, why: "1 + 0.05. Exact 1.0488." },
        { t: "num", q: "For a MOSFET, i_D = (k/2)(V_ov + v)². Ratio of the v² term to the linear term is v/(2V_ov). With V_ov = 0.2 V, what signal (mV) gives 5% error?", a: 20, unit: "mV", why: "v/(0.4) = 0.05 → v = 20 mV: about 8× more linear room than the BJT's 2.6 mV, because 2V_ov = 0.4 V ≫ 2V_T = 52 mV." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you decide whether an approximation is good enough?", model: "Look at the first term you dropped and estimate its size relative to the terms you kept. If that ratio is a few percent and the specification allows it, the approximation is fine. Saying how big the error is matters as much as the approximation itself." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Distortion: what the higher terms do", mins: 30,
    blurb: "Feed a pure sine into a curved transfer function and harmonics come out. Taylor coefficients predict exactly how much.",
    takeaway: "Write the device as y = a₁x + a₂x² + a₃x³ + … and drive it with x = A cos ωt. Since cos² = (1 + cos 2ωt)/2 and cos³ = (3cos ωt + cos 3ωt)/4: the x² term makes DC and 2ω; the x³ term makes 3ω (and changes the gain at ω). HD2 ≈ (a₂/a₁)(A/2), HD3 ≈ (a₃/a₁)(A²/4). BJT: HD2 = A/(4V_T) (1% at A ≈ 1 mV). MOSFET square law: HD2 = A/(4V_ov). A differential pair is odd-symmetric (tanh), so even harmonics cancel: HD3 = A²/(48V_T²) for a BJT pair. Doubling A doubles HD2 and quadruples HD3.",
    steps: [
      { k: "learn", title: "Powers of a cosine make harmonics", b: [
        `<div class="eq">cos²θ = ½ + ½cos 2θ     cos³θ = ¾cos θ + ¼cos 3θ</div>`,
        `<p>So for y = a₁x + a₂x² + a₃x³ with x = A cos ωt:</p>`,
        tbl(["Term", "Produces"], [["a₁x", "a₁A at ω (the wanted output)"], ["a₂x²", "a₂A²/2 at DC and a₂A²/2 at 2ω"], ["a₃x³", "¾a₃A³ at ω (gain change) and ¼a₃A³ at 3ω"]]),
        `<div class="eq">HD2 ≈ (a₂/a₁)·A/2     HD3 ≈ (a₃/a₁)·A²/4</div>`,
      ]},
      { k: "play", title: "Drive real device curves", b: [
        (host, id) => {
          const wf = el(`<div class="fig"></div>`), sp = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const DEV = [
            ["BJT (exponential)", (v) => Math.exp(v / 26), 50, (A) => [A / 104, (A * A) / (24 * 676)]],
            ["MOSFET (square law, V_ov = 200 mV)", (v) => (v > -200 ? (200 + v) ** 2 : 0), 250, (A) => [A / 800, 0]],
            ["BJT differential pair (tanh)", (v) => Math.tanh(v / 52), 100, (A) => [0, (A * A) / (48 * 676)]],
          ];
          let di = 0, A = 5;
          function draw() {
            const [, g, , pred] = DEV[di], N = 256, ys = [];
            for (let n = 0; n < N; n++) ys.push(g(A * Math.cos((2 * Math.PI * n) / N)));
            const m = ys.reduce((a, b) => a + b, 0) / N, ac = ys.map((y) => y - m), H = harmonics(ac, 5), h1 = H[0] || 1, pk = Math.max(...ac.map(Math.abs)) || 1;
            wf.innerHTML = plot({ x: [0, 2], y: [-1.3, 1.3], xt: [0, 1, 2], yt: [-1, 0, 1], xl: "time (cycles)", h: 180, series: [{ f: (t) => Math.cos(2 * Math.PI * t), cls: "s5" }, { pts: Array.from({ length: 2 * N + 1 }, (_, n) => [n / N, ac[n % N] / pk]), cls: "s1" }], label: "Input cosine (grey) and the device output (orange), both scaled to the same height" });
            const db = H.map((h) => Math.max(-80, 20 * Math.log10(h / h1 + 1e-12))), pts = [];
            db.forEach((d, i) => { pts.push([i + 0.75, -80], [i + 0.75, d], [i + 1.25, d], [i + 1.25, -80]); });
            sp.innerHTML = plot({ x: [0.5, 5.5], y: [-80, 5], xt: [1, 2, 3, 4, 5], xtf: (v) => v + "ω", yt: [-80, -60, -40, -20, 0], ytf: (v) => v + " dB", xl: "harmonic", h: 180, series: [{ pts, cls: "s2" }], label: "Harmonic levels relative to the fundamental, in dB" });
            const [p2, p3] = pred(A);
            ro.innerHTML = readout([["HD2 measured", fmt((100 * H[1]) / h1, 3) + "%"], ["HD2 Taylor estimate", p2 ? fmt(100 * p2, 3) + "%" : "0 (cancels)"], ["HD3 measured", fmt((100 * H[2]) / h1, 3) + "%"], ["HD3 Taylor estimate", p3 ? fmt(100 * p3, 3) + "%" : "≈ 0"]]);
          }
          const amp = slider({ id: id + "-a", label: "Input amplitude A", min: 0.5, max: 50, step: 0.5, value: A, show: (v) => fmt(v, 3) + " mV" }, (v) => { A = v; draw(); });
          host.append(toggle(DEV.map((d) => d[0]), (i) => { di = i; draw(); }, 0), wf, sp, amp.el, ro);
          draw();
        },
        `<p class="aside">The orange output is scaled to the input's height so the shape difference shows. For small A the Taylor estimates match the measured harmonics closely; for big A the higher terms join in and they drift apart. The differential pair has no 2nd harmonic at all.</p>`,
      ]},
      { k: "why", title: "Why the differential pair is special", b: [
        `<p>Its output is odd: f(−v) = −f(v) (tanh). An odd function's Taylor series has only odd powers, so a₂ = a₄ = … = 0: <b>no even harmonics</b>. That symmetry trick is why almost every analog chip input stage is differential.</p>`,
        `<div class="key"><b>Scaling rules worth remembering.</b> HD2 ∝ A, HD3 ∝ A². Drop the input by 6 dB (½): HD2 falls 6 dB, HD3 falls 12 dB. When a measurement doesn't follow this, something else (clipping, slewing) is going on.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "BJT stage, input amplitude 2 mV. HD2 in %?", a: 1.92, tol: 0.03, why: "A/(4V_T) = 2/104 = 1.9%." },
        { t: "num", q: "MOSFET stage with V_ov = 0.25 V, input 50 mV. HD2 in %?", a: 5, unit: "%", why: "50/(4 × 250) = 5%." },
        { t: "mcq", q: "An amplifier has HD3 = 0.4% at 100 mV input. At 50 mV, HD3 is about…", opts: [["0.1%", true, "HD3 ∝ A²: half the amplitude, a quarter of the distortion."], ["0.2%", false, "That's the rule for HD2."], ["0.4%", false, "Harmonic distortion depends on amplitude."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a curved transfer characteristic create harmonics?", model: "A curve can be written as a sum of powers of the input. Squaring a cosine gives a constant plus a cosine at twice the frequency, and cubing it gives a component at three times the frequency. So each curvature term in the Taylor series makes its own harmonic, with a size set by its coefficient and the input amplitude." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Geometric series: loops, DACs and settling", mins: 25,
    blurb: "1 + x + x² + … turns up wherever something goes round a loop or halves again and again.",
    takeaway: "1 + x + x² + … + x^(N−1) = (1 − x^N)/(1 − x); for |x| < 1 the infinite sum is 1/(1 − x). Binary DAC: ½ + ¼ + … + 1/2^N = 1 − 2^(−N): full scale is one LSB short of the reference. Feedback: G = A/(1 + Aβ) = (1/β)·1/(1 + 1/(Aβ)) ≈ (1/β)(1 − 1/(Aβ)): the gain error is about 1/(loop gain). A first-order loop that removes a fraction (1 − x) of the error each cycle leaves xⁿ after n cycles: 10 bits of settling needs xⁿ < 2^(−10).",
    steps: [
      { k: "learn", title: "The sum", b: [
        steps([["S = 1 + x + x² + … + x^(N−1)", ""], ["xS = x + x² + … + x^N", "(shift everything by one)"], ["Subtract", "S − xS = 1 − x^N"], ["So", "S = (1 − x^N)/(1 − x)"]]),
        `<div class="eq">|x| &lt; 1:   1 + x + x² + … = 1/(1 − x)</div>`,
      ]},
      { k: "math", title: "A DAC's full scale", b: [
        `<p>An N-bit binary DAC weights its bits ½, ¼, ⅛, … of V<sub>ref</sub>. All bits on:</p>`,
        `<div class="eq">½ + ¼ + … + 1/2^N = 1 − 2^(−N)</div>`,
        `<p>An 8-bit DAC with V<sub>ref</sub> = 1 V tops out at 255/256 V = 0.996 V: one LSB (3.9 mV) short. The geometric sum says so in one line.</p>`,
      ]},
      { k: "why", title: "Feedback as a series", b: [
        `<p>A loop with forward gain A and feedback β (Module 37): G = A/(1 + Aβ). Pull out 1/β:</p>`,
        `<div class="eq">G = (1/β)·1/(1 + 1/T),   T = Aβ</div>`,
        `<p>With T large, 1/T is small, so use 1/(1 + y) ≈ 1 − y + y² − …:</p>`,
        `<div class="eq">G ≈ (1/β)(1 − 1/T)</div>`,
        `<div class="key"><b>Gain error ≈ 1/(loop gain).</b> Want a gain of 10 accurate to 0.1%? You need T ≥ 1000, so A ≥ 10 000. This one line sizes the op amp's open-loop gain in countless designs.</div>`,
      ]},
      { k: "play", title: "Settling, cycle by cycle", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let x = 0.5, bits = 10;
          function draw() {
            const n = Math.ceil(Math.log(2 ** -bits) / Math.log(x)), pts = [];
            let e = 1; for (let k = 0; k <= 30; k++) { pts.push([k, Math.log10(e)]); e *= x; }
            f.innerHTML = plot({ x: [0, 30], y: [-6, 0], xt: [0, 10, 20, 30], yt: [-6, -4, -2, 0], ytf: (v) => "10" + String(v).replace("-", "⁻").replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]), xl: "cycles", yl: "error left (log)", h: 200, series: [{ pts, cls: "s1" }, { f: () => Math.log10(2 ** -bits), cls: "s4" }], label: "Remaining error after each cycle on a log scale, with the target line" });
            ro.innerHTML = readout([["Error left after n cycles", "xⁿ"], ["Target", "2⁻" + bits + " = " + fmt(2 ** -bits, 3)], ["Cycles needed", n]]);
          }
          host.append(f, slider({ id: id + "-x", label: "Fraction of error left each cycle, x", min: 0.05, max: 0.9, step: 0.05, value: x }, (v) => { x = v; draw(); }).el,
            slider({ id: id + "-b", label: "Accuracy wanted (bits)", min: 4, max: 16, step: 1, value: bits }, (v) => { bits = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Switched-capacitor circuits, successive-approximation ADCs and digital calibration loops all shrink an error by a fixed factor per cycle. On a log scale that's a straight line; its slope is log x.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "1 + 0.5 + 0.25 + … (forever) = ?", a: 2, why: "1/(1 − 0.5) = 2." },
        { t: "num", q: "Feedback amplifier with 1/β = 100 and A = 10⁵. Gain error in %?", a: 0.1, unit: "%", why: "T = Aβ = 1000; error ≈ 1/T = 0.1%." },
        { t: "num", q: "A 12-bit DAC with V_ref = 2.048 V. Full-scale output (V)?", a: 2.0475, tol: 0.0001, why: "2.048 × (1 − 2⁻¹²) = 2.048 − 0.0005 = 2.0475 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is a feedback amplifier's gain error roughly one over the loop gain?", model: "The closed-loop gain is one over beta times one over one plus one over T. When T is large, one over one plus a small number is about one minus that small number, so the gain is one over beta reduced by a fraction of about one over T." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "Limits, l'Hôpital and dominant terms", mins: 20,
    blurb: "What happens at the edges: 0/0 cases, very large and very small values, and which term wins.",
    takeaway: "A limit asks what a function approaches. For 0/0 (or ∞/∞), l'Hôpital's rule: lim f/g = lim f′/g′. Taylor series do the same job: (1 − e^(−x))/x → 1 because 1 − e^(−x) ≈ x. As a variable gets large or small, keep the dominant term: H(jω) = 1/(1 + jωτ) → 1 when ωτ ≪ 1 and → 1/(jωτ) when ωτ ≫ 1. Those two limits are the Bode asymptotes. Always check a formula's limits: they catch most algebra mistakes.",
    steps: [
      { k: "learn", title: "0/0 needs a closer look", b: [
        `<p>sin x/x at x = 0 is 0/0: meaningless as written. But near 0, sin x ≈ x, so sin x/x ≈ 1. The <b>limit</b> is 1.</p>`,
        `<div class="eq">l'Hôpital: if f(a) = g(a) = 0,  lim f/g = lim f′/g′</div>`,
        `<p class="aside">Why it works: near a, f ≈ f′(a)(x − a) and g ≈ g′(a)(x − a). The (x − a) cancels. It's the Taylor idea again.</p>`,
      ]},
      { k: "math", title: "An RC example", b: [
        `<p>An RC charges towards V. Average current drawn over the first t seconds, divided by the initial current V/R, is (τ/t)(1 − e<sup>−t/τ</sup>). What happens for very short t?</p>`,
        { t: "reveal", label: "Use the series", html: `<div class="eq">1 − e^(−t/τ) ≈ t/τ − (t/τ)²/2</div><p>So (τ/t)(1 − e<sup>−t/τ</sup>) ≈ 1 − t/(2τ) → <b>1</b>: at the very start the capacitor looks like a short and the full V/R flows. Sanity check passed.</p>` },
      ]},
      { k: "play", title: "Which term wins?", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let lw = 0;
          function draw() {
            const w = 10 ** lw, mag = 1 / Math.hypot(1, w);
            f.innerHTML = plot({ x: [-2, 2], y: [-45, 5], xt: [-2, -1, 0, 1, 2], xtf: (v) => "10" + (v < 0 ? "⁻" : "") + "⁰¹²"[Math.abs(v)], yt: [-40, -20, 0], ytf: (v) => v + " dB", xl: "ωτ", yl: "|H|", h: 220, series: [{ f: (x) => -10 * Math.log10(1 + 10 ** (2 * x)), cls: "s1" }, { f: () => 0, cls: "s5", to: 0.4 }, { f: (x) => -20 * x, cls: "s4", from: -0.4 }], marks: [{ x: lw, y: 20 * Math.log10(mag) }], label: "First-order low-pass magnitude (orange) with its two dominant-term limits (dashed)" });
            ro.innerHTML = readout([["ωτ", fmt(w, 3)], ["Exact |H| = 1/√(1 + (ωτ)²)", fmt(mag, 4)], ["Dominant-term guess", w < 1 ? "1 (the 1 wins)" : fmt(1 / w, 4) + " (the ωτ wins)"]]);
          }
          host.append(f, slider({ id: id + "-w", label: "log₁₀(ωτ)", min: -2, max: 2, step: 0.05, value: lw }, (v) => { lw = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Away from ωτ = 1 one term dominates and the simple limit is excellent: Module 16's straight-line Bode plot. Only near the corner do both terms matter (−3 dB exactly at ωτ = 1).</p>`,
      ]},
      { k: "why", title: "Check every formula at its limits", b: [
        `<ul><li>Divider R₂/(R₁ + R₂): R₂ → ∞ should give 1 ✓; R₂ → 0 should give 0 ✓.</li><li>Capacitor impedance 1/(jωC): ω → 0 should be an open ✓.</li><li>Parallel R ∥ 0 = 0 ✓.</li></ul>`,
        `<div class="key"><b>A habit of experts.</b> Before trusting a derived formula, push each variable to 0 and ∞ and see if the circuit would really do that. Most algebra slips fail this test instantly.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "lim (eˣ − 1)/x as x → 0?", a: 1, why: "eˣ − 1 ≈ x, or l'Hôpital: eˣ/1 → 1." },
        { t: "mcq", q: "Someone derives the output resistance of a circuit as R_o = r_o(1 + g_mR_S) + R_S. Check: with R_S = 0 it should be r_o. Does it pass?", opts: [["Yes: it gives r_o", true, "Good sign (this is the cascode/degeneration formula)."], ["No: it gives 0", false, "Put R_S = 0: r_o·1 + 0 = r_o."], ["Can't tell", false, "Limits always tell you something."]] },
        { t: "num", q: "|1/(1 + jωτ)| at ωτ = 100: dominant-term estimate?", a: 0.01, why: "1/(ωτ) = 0.01, i.e. −40 dB. Exact 0.009999." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is checking limits a good way to catch mistakes?", model: "At the extremes, zero or infinity, a circuit usually does something obvious: a capacitor becomes an open or a short, a divider gives all or nothing. If a derived formula doesn't reproduce those obvious cases, there's an error in it, so pushing each variable to its limits is a fast test." },
      ]},
    ],
  };

  const p6 = {
    id: "p6", title: "Master it", mins: 30,
    blurb: "Expansions, distortion, geometric sums and limits.",
    takeaway: "You can build and use Taylor series, judge how small ‘small’ is, predict harmonic distortion from device curves, use geometric series for DACs, loops and settling, and test formulas at their limits.",
    steps: [
      { k: "check", title: "Problem 1", b: [
        { t: "num", q: "Second-order Taylor estimate of ln(1.2)?", a: 0.18, tol: 0.001, hint: "x − x²/2 with x = 0.2.", why: "0.2 − 0.02 = 0.18. True: 0.1823." },
      ]},
      { k: "check", title: "Problem 2: diode linearity", b: [
        { t: "num", q: "A diode biased at 1 mA gets a 1 mV signal. Ratio of the second-harmonic current to the fundamental (%)?", a: 0.96, tol: 0.03, hint: "Same exponential as the BJT: HD2 = A/(4V_T).", why: "1/104 ≈ 0.96%." },
      ]},
      { k: "check", title: "Problem 3: degeneration", b: [
        `<p>A degenerated stage has a₂/a₁ reduced by a factor (1 + g<sub>m</sub>R<sub>E</sub>)², roughly.</p>`,
        { t: "num", q: "A BJT stage with HD2 = 10% gets g_mR_E = 4. New HD2 (%)?", a: 0.4, unit: "%", hint: "Divide by (1 + 4)².", why: "10/25 = 0.4%. Feedback trades gain for linearity (Module 37)." },
      ]},
      { k: "check", title: "Problem 4: loop gain", b: [
        { t: "num", q: "You need closed-loop gain 4 with error below 0.05%. Minimum open-loop gain A?", a: 8000, hint: "Error ≈ 1/(Aβ) with β = 1/4.", why: "Aβ ≥ 2000 → A ≥ 8000." },
      ]},
      { k: "check", title: "Problem 5: settling", b: [
        { t: "num", q: "A loop keeps 30% of its error each cycle. Cycles to reach 12-bit accuracy (2⁻¹²)?", a: 7, tol: 0, hint: "0.3ⁿ < 2.44×10⁻⁴. Take logs.", why: "n > ln(2.44×10⁻⁴)/ln 0.3 = 6.9, so 7 cycles." },
      ]},
      { k: "say", title: "Problem 6: explain it", b: [
        { t: "say", q: "Explain why a differential pair has much lower second-harmonic distortion than a single transistor, using Taylor series.", model: "A single transistor's curve, exponential or square law, has a non-zero second-order Taylor coefficient, and that term turns a sine into a second harmonic. A differential pair's output is an odd function of the differential input, like tanh, so all even-power terms are zero. With no x squared term there is no second harmonic, leaving the third harmonic, which is much smaller for small signals." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m29", eyebrow: "Math Toolkit · Module 29", title: "Series and Approximations",
    intro: `<p>Six parts: Taylor series, the first-order toolkit (and how small ‘small signal’ is), distortion from the higher terms, geometric series in DACs, feedback and settling, limits and dominant terms, and mastery problems.</p><p>Why a chip designer needs this: every hand analysis is an approximation. Knowing exactly what you dropped, and how big it is, separates a quick estimate from a guess.</p><p class="aside">Before this: Modules 4 (approximations), 8 (exp/log) and 13 (derivatives). Pairs with 6.002 Appendix B and Chapter 8.</p>`,
    after: `<p>Next: Module 30 builds any periodic wave out of sines, which is how harmonics, distortion and spectra are measured.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <div class="eq">f(x) ≈ Σ f⁽ⁿ⁾(a)(x − a)ⁿ/n!</div>
      <p>eˣ = 1 + x + x²/2 + …; sin x = x − x³/6; cos x = 1 − x²/2; 1/(1 − x) = Σxⁿ (|x| &lt; 1); ln(1 + x) = x − x²/2; (1 + x)ⁿ ≈ 1 + nx. Error ≈ first dropped term.</p>
      <p>BJT small-signal error ≈ v/(2V_T) (5% at 2.6 mV). MOSFET ≈ v/(2V_ov).</p>
      <p><b>Distortion:</b> y = a₁x + a₂x² + a₃x³, x = A cos ωt. HD2 ≈ (a₂/a₁)A/2, HD3 ≈ (a₃/a₁)A²/4. BJT HD2 = A/4V_T; MOSFET A/4V_ov; BJT diff pair HD3 = A²/48V_T² (no even harmonics). HD2 ∝ A, HD3 ∝ A².</p>
      <p><b>Geometric:</b> Σ₀^(N−1) xᵏ = (1 − x^N)/(1 − x); ∞ sum 1/(1 − x). DAC full scale 1 − 2^(−N). Feedback gain error ≈ 1/T. Settling: error xⁿ.</p>
      <p><b>Limits:</b> l'Hôpital lim f/g = lim f′/g′. Keep the dominant term (Bode asymptotes). Check every formula at 0 and ∞.</p>`,
  };
  Course.start(window.CHAPTER);
})();
