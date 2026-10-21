(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;
  const pct = (x, d = 3) => (x >= 0 ? "+" : "") + fmt(100 * x, d) + "%";
  /* Small seeded random generator so Monte Carlo pictures are repeatable. */
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const divider = (o = {}) => S.svg(290, 175, S.vsrc(70, 85, "V_in", { side: "left" }) + S.wire([70, 67], [70, 20], [170, 20]) + S.res(170, 20, 170, 85, "R₁", {}) + S.res(170, 85, 170, 150, "R₂", {}) + S.wire([170, 85], [230, 85]) + S.dot(170, 85) + S.t(236, 90, "V_out", { a: "start", cls: "lab" }) + S.wire([70, 103], [70, 150], [170, 150]) + S.gnd(120, 150), { label: "Voltage divider: R1 on top, R2 to ground, output at the middle" });

  const p1 = {
    id: "p1", title: "Many knobs: partial derivatives", mins: 20,
    blurb: "A circuit's output depends on many parts. Turn one knob, hold the rest: that slope is a partial derivative.",
    takeaway: "When f depends on several variables, ∂f/∂x is the slope you get by changing x alone while holding every other variable fixed. Treat the others as constants and differentiate as usual. Divider H = R₂/(R₁ + R₂): ∂H/∂R₂ = R₁/(R₁ + R₂)², ∂H/∂R₁ = −R₂/(R₁ + R₂)². Units: output per unit of the knob. Each partial answers “if this part drifts a bit, how much does the output move?”",
    steps: [
      { k: "learn", title: "Holding everything else still", b: [
        fig(divider()),
        `<div class="eq">H = V_out/V_in = R₂/(R₁ + R₂)</div>`,
        `<p>H depends on two knobs. Ask one question at a time: “if only R₂ changes, how fast does H change?” That's the <b>partial derivative</b> ∂H/∂R₂. The curly ∂ just means “other variables held fixed”.</p>`,
        `<p class="aside">Module 13, Part 5 introduced these. Here they become a design tool.</p>`,
      ]},
      { k: "math", title: "Work them out", b: [
        steps([["∂H/∂R₂: R₁ is a constant. Quotient rule", "[(R₁ + R₂)·1 − R₂·1]/(R₁ + R₂)²"], ["Simplify", "R₁/(R₁ + R₂)²   (positive: more R₂, more output)"], ["∂H/∂R₁: R₂ is a constant", "−R₂/(R₁ + R₂)²   (negative: more R₁, less output)"]]),
      ]},
      { k: "play", title: "Turn one knob at a time", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let R1 = 1, R2 = 3, which = 1;
          function draw() {
            const H = (a, b) => b / (a + b), h0 = H(R1, R2);
            const d1 = -R2 / (R1 + R2) ** 2, d2 = R1 / (R1 + R2) ** 2;
            const fx = which ? (x) => H(R1, x) : (x) => H(x, R2), x0 = which ? R2 : R1, s = which ? d2 : d1;
            f.innerHTML = plot({ x: [0.1, 8], y: [0, 1], xt: [0, 2, 4, 6, 8], yt: [0, 0.25, 0.5, 0.75, 1], xl: (which ? "R₂" : "R₁") + " (kΩ)", yl: "H", h: 220, series: [{ f: fx, cls: "s1" }, { f: (x) => h0 + s * (x - x0), cls: "s4" }], marks: [{ x: x0, y: h0 }], label: "H against one resistor with the other held fixed, with the tangent line" });
            ro.innerHTML = readout([["H", fmt(h0, 3)], ["∂H/∂R₁", fmt(d1, 3) + " per kΩ"], ["∂H/∂R₂", fmt(d2, 3) + " per kΩ"]]);
          }
          host.append(toggle(["Vary R₁ (hold R₂)", "Vary R₂ (hold R₁)"], (i) => { which = i; draw(); }, 1), f,
            slider({ id: id + "-1", label: "R₁", min: 0.2, max: 8, step: 0.1, value: R1, show: (v) => fmt(v, 3) + " kΩ" }, (v) => { R1 = v; draw(); }).el,
            slider({ id: id + "-2", label: "R₂", min: 0.2, max: 8, step: 0.1, value: R2, show: (v) => fmt(v, 3) + " kΩ" }, (v) => { R2 = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The dashed red line is the tangent: its slope is the partial derivative. The graph is a slice through a surface, taken along one knob.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "R₁ = 1 kΩ, R₂ = 3 kΩ. ∂H/∂R₂ in per kΩ?", a: 0.0625, why: "1/(4)² = 1/16 = 0.0625 per kΩ. Add 0.1 kΩ to R₂ and H rises by about 0.006." },
        { t: "mcq", q: "P = V²/R. What is ∂P/∂V?", opts: [["2V/R", true, "R is held constant: differentiate V²."], ["−V²/R²", false, "That's ∂P/∂R."], ["2V/R − V²/R²", false, "A partial derivative changes one variable only."]] },
        { t: "mcq", q: "I_D = (k/2)(V_GS − V_T)². What is ∂I_D/∂V_GS?", opts: [["k(V_GS − V_T): the transconductance g_m", true, "Chain rule, with k and V_T held fixed. g_m is a partial derivative."], ["(k/2)(V_GS − V_T)", false, "The 2 from the square cancels the ½."], ["−k(V_GS − V_T)", false, "That's ∂I_D/∂V_T."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a partial derivative tell a circuit designer?", model: "How fast the output changes when one particular part's value changes, with every other part held where it is. It's the slope along one knob, so it says which parts the output is most touchy about." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Percent per percent: normalised sensitivity", mins: 25,
    blurb: "Ask in percentages and the answers become simple numbers you can remember. And they explain why chips are built on ratios.",
    takeaway: "Normalised sensitivity S_x^f = (∂f/∂x)·(x/f) = (% change in f) per (% change in x) = d ln f/d ln x. Rules: f = K·xⁿ → S = n; for products and quotients the sensitivities add (with the power as the sign). f_c = 1/(2πRC): S_R = S_C = −1. Divider: S_R₁ = −S_R₂, so scaling every resistor together changes nothing. On a chip, absolute values vary by ±10–20% but ratios of matched parts hold to ~0.1%, so good IC design makes performance depend on ratios. MOSFET: S of I_D to V_T = −2V_T/V_ov, often −5 or worse.",
    steps: [
      { k: "learn", title: "Why percentages", b: [
        `<p>“∂H/∂R₂ = 0.0625 per kΩ” is hard to compare with “∂H/∂C = 3 per nF”. Asking in percent puts every part on the same footing:</p>`,
        `<div class="eq">S<sub>x</sub><sup>f</sup> = (∂f/∂x)·(x/f) = (Δf/f)/(Δx/x)</div>`,
        `<p>S = −1 means “1% more x gives 1% less f”. S = 0.5 means “1% more x gives 0.5% more f”.</p>`,
        `<p class="aside">Same thing in logs: S = d(ln f)/d(ln x), the slope on a log–log plot. That's why it's the natural measure for anything spread over decades.</p>`,
      ]},
      { k: "learn", title: "Rules you can do in your head", b: [
        `<div class="tbl"><table><tr><th>f</th><th>Sensitivity</th></tr><tr><td>K·x</td><td>S<sub>x</sub> = 1</td></tr><tr><td>K/x</td><td>S<sub>x</sub> = −1</td></tr><tr><td>K·xⁿ</td><td>S<sub>x</sub> = n</td></tr><tr><td>x·y</td><td>S<sub>x</sub> = 1, S<sub>y</sub> = 1</td></tr><tr><td>x/y</td><td>S<sub>x</sub> = 1, S<sub>y</sub> = −1</td></tr><tr><td>√(xy)</td><td>½ each</td></tr></table></div>`,
        `<p>Examples: f<sub>c</sub> = 1/(2πRC): S<sub>R</sub> = S<sub>C</sub> = −1. ω₀ = 1/√(LC): S<sub>L</sub> = S<sub>C</sub> = −½. Power V²/R: S<sub>V</sub> = 2, S<sub>R</sub> = −1.</p>`,
      ]},
      { k: "math", title: "The divider, in percent", b: [
        steps([["S_R₂ = (∂H/∂R₂)(R₂/H)", "[R₁/(R₁+R₂)²]·R₂·(R₁+R₂)/R₂ = R₁/(R₁+R₂)"], ["S_R₁ similarly", "−R₁/(R₁+R₂)"], ["Add them", "0"]]),
        `<div class="key"><b>The ratio trick.</b> S<sub>R₁</sub> + S<sub>R₂</sub> = 0: if both resistors drift by the same percentage, the output doesn't move at all. On a chip, every resistor in a batch may come out 15% high, but two resistors drawn side by side, the same way, match to about 0.1%. So IC designers build circuits whose behaviour depends only on <b>ratios</b>: dividers, current mirrors, capacitor ratios.</div>`,
      ]},
      { k: "play", title: "Chip reality: an RC filter vs a ratio", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let dR = 0.15, dC = 0.08;
          function draw() {
            const fc = 1 / ((1 + dR) * (1 + dC)) - 1;
            ro.innerHTML = readout([["RC low-pass f_c: linear estimate (S = −1 each)", pct(-(dR + dC))], ["f_c: exact", pct(fc)], ["Divider ratio with both R's equally off", "+0% (exact)"], ["Ratio with 0.1% mismatch between them", "about ±0.05%"]]);
          }
          host.append(slider({ id: id + "-r", label: "Batch shift in every R", min: -0.2, max: 0.2, step: 0.01, value: dR, show: (v) => pct(v, 2) }, (v) => { dR = v; draw(); }).el,
            slider({ id: id + "-c", label: "Batch shift in every C", min: -0.15, max: 0.15, step: 0.01, value: dC, show: (v) => pct(v, 2) }, (v) => { dC = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">An on-chip RC filter's corner can move by 20–30% from wafer to wafer. That's why chips use tricks: switched-capacitor filters set f by a capacitor <i>ratio</i> times a crystal clock, and RC filters get a tuning loop.</p>`,
      ]},
      { k: "why", title: "The transistor is touchy", b: [
        `<div class="eq">I_D = (k/2)(V_GS − V_T)²</div>`,
        `<p>Sensitivity to V<sub>T</sub>: S = (∂I/∂V<sub>T</sub>)(V<sub>T</sub>/I) = −k(V<sub>GS</sub> − V<sub>T</sub>)·V<sub>T</sub>/[(k/2)(V<sub>GS</sub> − V<sub>T</sub>)²] = <b>−2V<sub>T</sub>/V<sub>ov</sub></b>, where V<sub>ov</sub> = V<sub>GS</sub> − V<sub>T</sub>.</p>`,
        `<p>V<sub>T</sub> = 0.5 V, V<sub>ov</sub> = 0.2 V: S = −5. A 2% shift in V<sub>T</sub> (10 mV) moves the current 10%.</p>`,
        `<div class="key"><b>Design lesson.</b> Never bias a transistor by fixing its V<sub>GS</sub> from a resistor divider: the current would wander with every V<sub>T</sub> shift. Bias it with a current mirror instead, a ratio of two matched transistors, which cancels V<sub>T</sub>.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "LC oscillator: L is 4% high. By what % does f₀ change? (Give a signed number.)", a: -2, unit: "%", why: "S_L = −½: −½ × 4% = −2%." },
        { t: "num", q: "Non-inverting amp, G = 1 + R₂/R₁ = 10. Sensitivity of G to R₂?", a: 0.9, hint: "S = (∂G/∂R₂)(R₂/G) = (1/R₁)(R₂/G).", why: "(R₂/R₁)/G = 9/10 = 0.9. And S_R₁ = −0.9: ratio again." },
        { t: "num", q: "V_T = 0.45 V, V_ov = 0.15 V. Sensitivity of I_D to V_T?", a: -6, why: "−2 × 0.45/0.15 = −6. Low overdrive makes the current very touchy." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do IC designers prefer circuits whose behaviour depends on ratios of components?", model: "On a chip the absolute value of every resistor or capacitor can be off by ten or twenty percent, but nearby matched parts all drift together. A quantity that depends on a ratio has sensitivities that add to zero, so a common drift cancels out and only the small mismatch remains." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Many small changes at once: the total differential", mins: 25,
    blurb: "Add up each knob's effect. That's also exactly what a small-signal model is.",
    takeaway: "If every input changes a little, Δf ≈ Σ (∂f/∂xᵢ)·Δxᵢ (the total differential). In percent: Δf/f ≈ Σ Sᵢ·(Δxᵢ/xᵢ). It's a straight-line (tangent-plane) estimate, good for small changes and worse for big ones. The small-signal MOSFET model is exactly this: i_d = (∂I_D/∂V_GS)v_gs + (∂I_D/∂V_DS)v_ds = g_m·v_gs + g_o·v_ds. Small-signal analysis = total differential of the large-signal equations.",
    steps: [
      { k: "learn", title: "Add the effects", b: [
        `<div class="eq">Δf ≈ (∂f/∂x)Δx + (∂f/∂y)Δy + …</div>`,
        `<p>Each term is “how touchy × how much it moved”. For small moves the effects simply add, because a smooth surface looks flat when you zoom in (a tangent plane, like the tangent line of Module 13).</p>`,
        `<div class="eq">Δf/f ≈ S<sub>x</sub>·(Δx/x) + S<sub>y</sub>·(Δy/y) + …</div>`,
      ]},
      { k: "play", title: "How good is the straight-line estimate?", b: [
        (host, id) => {
          const ro = el(`<div></div>`), f = el(`<div class="fig"></div>`);
          let e1 = 0.05, e2 = -0.03;
          function draw() {
            const R1 = 1, R2 = 3, H = (a, b) => b / (a + b), h0 = H(R1, R2);
            const exact = H(R1 * (1 + e1), R2 * (1 + e2)) / h0 - 1, S2 = R1 / (R1 + R2), lin = -S2 * e1 + S2 * e2;
            f.innerHTML = plot({ x: [0, 0.5], y: [-0.2, 0.05], xt: [0, 0.1, 0.2, 0.3, 0.4, 0.5], xtf: (v) => fmt(100 * v, 2) + "%", yt: [-0.2, -0.1, 0], ytf: (v) => fmt(100 * v, 2) + "%", xl: "size of the change in R₁ (R₂ fixed)", yl: "ΔH/H", h: 200, series: [{ f: (x) => H(R1 * (1 + x), R2) / h0 - 1, cls: "s1" }, { f: (x) => -S2 * x, cls: "s4" }], label: "Exact change in H (orange) and the straight-line estimate (dashed) as R1's change grows" });
            ro.innerHTML = readout([["Linear estimate −¼·ΔR₁/R₁ + ¼·ΔR₂/R₂", pct(lin)], ["Exact", pct(exact)], ["Error of the estimate", pct(lin - exact)]]);
          }
          host.append(f, slider({ id: id + "-1", label: "R₁ change", min: -0.3, max: 0.3, step: 0.01, value: e1, show: (v) => pct(v, 2) }, (v) => { e1 = v; draw(); }).el,
            slider({ id: id + "-2", label: "R₂ change", min: -0.3, max: 0.3, step: 0.01, value: e2, show: (v) => pct(v, 2) }, (v) => { e2 = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Divider with R₁ = 1k, R₂ = 3k (S<sub>R₂</sub> = ¼, S<sub>R₁</sub> = −¼). For a few percent the estimate is spot on; at 30% it's off by a couple of percent. The graph shows the curve bending away from the tangent.</p>`,
      ]},
      { k: "why", title: "This is the small-signal model", b: [
        `<p>A MOSFET's large-signal current depends on two voltages: I<sub>D</sub>(V<sub>GS</sub>, V<sub>DS</sub>). Wiggle both a little and take the total differential:</p>`,
        `<div class="eq">i_d = (∂I_D/∂V_GS)·v_gs + (∂I_D/∂V_DS)·v_ds = g_m·v_gs + g_o·v_ds</div>`,
        `<p>g<sub>m</sub> and g<sub>o</sub> = 1/r<sub>o</sub> are just partial derivatives at the bias point. The small-signal circuit of 6.002 Chapter 8 is a drawing of this equation: a controlled source g<sub>m</sub>v<sub>gs</sub> in parallel with r<sub>o</sub>.</p>`,
        `<div class="key"><b>Every small-signal model you'll ever meet</b> (BJT r<sub>π</sub> and g<sub>m</sub>, diode r<sub>d</sub>, the h-parameters) is the total differential of the device's large-signal equations at its operating point. Valid while the wiggles stay small, which Part 2's curves show is a real limit.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "f_c = 1/(2πRC). R rises 3% and C falls 1%. Estimated % change in f_c?", a: -2, unit: "%", why: "−1·(+3%) + −1·(−1%) = −2%." },
        { t: "num", q: "I_D = (k/2)V_ov²(1 + λV_DS) with λ small. Treat it as a function of V_ov and V_DS. Sensitivity of I_D to V_ov?", a: 2, why: "I ∝ V_ov²: S = 2. So g_m = 2I_D/V_ov, a formula worth remembering." },
        { t: "mcq", q: "Why is small-signal analysis only valid for small signals?", opts: [["It keeps only the tangent-plane (first-derivative) terms; big swings bring in the curvature it ignores", true, "Large swings mean distortion: Module 29 handles the curvature terms."], ["Because transistors only work at low voltages", false, "It's about the size of the change around the bias point."], ["Because g_m is small", false, "g_m's size doesn't matter; the linearisation does."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How is a transistor's small-signal model related to partial derivatives?", model: "The large-signal current depends on the gate and drain voltages. For small wiggles around the bias point, the change in current is each partial derivative times its voltage wiggle, added up. Those partial derivatives are gm and the output conductance, so the small-signal model is just that total differential drawn as a circuit." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Error budgets: worst case vs RSS", mins: 25,
    blurb: "Stack every error the worst way, or add them like random noise. The answers differ a lot, and both matter.",
    takeaway: "Worst case: Δf/f ≤ Σ|Sᵢ|·tolᵢ, every error at its limit, all pushing the same way. Guaranteed but pessimistic. Statistical (RSS, root-sum-square): if the errors are independent and random, σ_f = √(Σ(Sᵢσᵢ)²). N equal independent errors give √N times one error, not N times. Five 1% contributions: worst case 5%, RSS 2.24%. An error budget lists each source, its sensitivity, its size, and its contribution, so you can see which one to fix. Fix the biggest: in RSS the largest term dominates.",
    steps: [
      { k: "learn", title: "Two ways to add errors", b: [
        `<div class="two"><div class="tile"><h3>Worst case</h3><div class="eq" style="font-size:20px">Σ |Sᵢ|·tolᵢ</div><p>Every part at its limit, all in the unlucky direction. Safe, but rarely happens.</p></div><div class="tile"><h3>RSS (statistical)</h3><div class="eq" style="font-size:20px">√Σ (Sᵢσᵢ)²</div><p>Independent random errors partly cancel. Adds like the sides of a right triangle.</p></div></div>`,
        `<p class="aside">Why squares? Independent random errors add their <i>variances</i> (Module 34). The square root turns variance back into a spread.</p>`,
      ]},
      { k: "play", title: "Monte Carlo: build 2000 circuits", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let N = 5, tol = 1;
          function draw() {
            const r = rng(7), T = 2000, xs = [];
            for (let t = 0; t < T; t++) { let s = 0; for (let i = 0; i < N; i++) s += (2 * r() - 1) * tol; xs.push(s); }
            const wc = N * tol, sd = Math.sqrt(xs.reduce((a, x) => a + x * x, 0) / T), rssU = tol * Math.sqrt(N / 3);
            const bins = 41, lo = -wc, w = (2 * wc) / bins, cnt = new Array(bins).fill(0);
            xs.forEach((x) => { const b = Math.min(bins - 1, Math.max(0, Math.floor((x - lo) / w))); cnt[b]++; });
            const mx = Math.max(...cnt), pts = [];
            cnt.forEach((c, i) => { const x0 = lo + i * w; pts.push([x0, 0], [x0, c / mx], [x0 + w, c / mx], [x0 + w, 0]); });
            const max3 = Math.max(...xs.map(Math.abs));
            f.innerHTML = plot({ x: [-wc, wc], y: [0, 1.1], xt: [-wc, -wc / 2, 0, wc / 2, wc], xtf: (v) => fmt(v, 2) + "%", yt: [], xl: "total error", h: 200, series: [{ pts, cls: "s2" }], marks: [{ x: 3 * sd, y: 0.05, cls: "mkb", label: "3σ", r: 5 }, { x: -3 * sd, y: 0.05, cls: "mkb", r: 5 }], label: "Histogram of the total error over 2000 simulated circuits" });
            ro.innerHTML = readout([["Worst case (all at the limit, same way)", "±" + fmt(wc, 3) + "%"], ["Largest seen in 2000 builds", "±" + fmt(max3, 3) + "%"], ["Spread σ (measured)", fmt(sd, 3) + "%"], ["RSS prediction for uniform ±tol: tol·√(N/3)", fmt(rssU, 3) + "%"]]);
          }
          host.append(f, slider({ id: id + "-n", label: "Number of error sources N", min: 1, max: 20, step: 1, value: N }, (v) => { N = v; draw(); }).el,
            slider({ id: id + "-t", label: "Each one's tolerance (uniform between ±)", min: 0.5, max: 5, step: 0.5, value: tol, show: (v) => "±" + v + "%" }, (v) => { tol = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Each “circuit” draws N independent errors anywhere in ±tol and adds them. The worst-case sum almost never happens: with N = 10 the histogram stays well inside the edges, and it grows into a bell shape (Module 35 explains why).</p>`,
      ]},
      { k: "math", title: "An error budget", b: [
        `<p>Output offset of an amplifier with gain 10, referred to the input. Independent sources, each given as a 1σ value:</p>`,
        `<div class="tbl"><table><tr><th>Source</th><th>σ (µV)</th><th>σ²</th></tr><tr><td>Input pair V<sub>T</sub> mismatch</td><td>800</td><td>640 000</td></tr><tr><td>Load mirror mismatch</td><td>400</td><td>160 000</td></tr><tr><td>Feedback resistor ratio</td><td>200</td><td>40 000</td></tr><tr><td>Everything else</td><td>200</td><td>40 000</td></tr></table></div>`,
        { t: "reveal", label: "Total", html: `<div class="eq">σ = √(880 000) ≈ 938 µV</div><p>Worst-case sum would be 1600 µV. Notice: the input pair alone gives 800 µV. Halving the <i>third</i> source saves almost nothing (from 938 to 922 µV); halving the first brings it to 632 µV. <b>In RSS, fix the biggest term.</b></p>` },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Four independent errors with σ = 3, 4, 0, 0 mV. Total σ (mV)?", a: 5, why: "√(9 + 16) = 5 mV." },
        { t: "num", q: "Nine equal independent errors of σ = 1%. Total σ (%)?", a: 3, unit: "%", why: "√9 × 1% = 3%, not 9%." },
        { t: "mcq", q: "When must you use worst case instead of RSS?", opts: [["When the errors aren't independent (they move together), or a single failure is unacceptable", true, "Correlated errors add directly: e.g. temperature shifts every part at once. And safety-critical limits need guarantees."], ["Never: RSS is always right", false, "RSS assumes independence and accepts a small failure rate."], ["Only for resistors", false, "It depends on how the errors behave, not what part they're in."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the RSS total smaller than the worst-case total?", model: "Worst case assumes every error sits at its limit and pushes the same way, which almost never happens. If the errors are independent, some push up and some push down and they partly cancel. Their variances add, so the spread grows like the square root of the sum of squares instead of the plain sum." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "Gradients and the best design", mins: 25,
    blurb: "The gradient points uphill. At the best design it's zero. Worked on a real chip problem: sizing a buffer chain.",
    takeaway: "The gradient ∇f = (∂f/∂x, ∂f/∂y, …) points in the direction of steepest increase; −∇f points downhill. At a minimum every partial derivative is 0. Optimisers (and transistor-sizing tools) step downhill along −∇f. Buffer chain driving 64× its input load with three stages of gain x, y/x, 64/y: delay ∝ x + y/x + 64/y. Setting both partials to zero gives x = 4, y = 16: every stage has the same gain, 4. That's the core of logical effort.",
    steps: [
      { k: "learn", title: "The gradient", b: [
        `<div class="eq">∇f = (∂f/∂x, ∂f/∂y)</div>`,
        `<p>Stand on a hillside. The gradient is an arrow pointing straight uphill; its length is how steep. Walk the other way and you go downhill fastest.</p>`,
        `<p>At the bottom of a valley there's no downhill: <b>all partial derivatives are zero</b>. That's how you find a best design with calculus: write the cost, set every partial to 0, solve.</p>`,
      ]},
      { k: "why", title: "A real chip problem: driving a big load", b: [
        `<p>A small gate must drive a load 64 times its own input capacitance (a long wire or an output pad). Use three inverters. If stage gains are g₁, g₂, g₃ with g₁g₂g₃ = 64, each stage's delay is roughly proportional to its gain, plus a fixed part.</p>`,
        `<p>Call the second stage's size x and the third's y (relative to the first). Gains: x, y/x, 64/y. Delay (ignoring the fixed parts):</p>`,
        `<div class="eq">D(x, y) = x + y/x + 64/y</div>`,
      ]},
      { k: "play", title: "Walk downhill", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let x = 10, y = 30;
          const D = (x, y) => x + y / x + 64 / y, lx = (v) => Math.log2(v);
          function draw() {
            const W = 320, H = 320, X = (v) => 24 + (lx(v) / 6) * 290, Y = (v) => 304 - (lx(v) / 6) * 290;
            let s = "";
            const n = 36;
            for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
              const xv = 2 ** ((6 * (i + 0.5)) / n), yv = 2 ** ((6 * (j + 0.5)) / n), d = D(xv, yv), t = Math.min(1, Math.log(d / 12) / Math.log(12));
              s += `<rect x="${24 + (i * 290) / n}" y="${304 - ((j + 1) * 290) / n}" width="${290 / n + 0.5}" height="${290 / n + 0.5}" style="fill:var(--cool);opacity:${(0.08 + 0.75 * t).toFixed(3)}"/>`;
            }
            [1, 4, 16, 64].forEach((v) => { s += S.t(X(v), 322, String(v), { cls: "lab" }) + S.t(18, Y(v) + 4, String(v), { a: "end", cls: "lab" }); });
            const gx = 1 - y / (x * x), gy = 1 / x - 64 / (y * y);
            const k = 40 / (Math.hypot(gx * x, gy * y) || 1), ex = X(x) - k * gx * x, ey = Y(y) + k * gy * y;
            s += `<circle cx="${X(4)}" cy="${Y(16)}" r="7" style="fill:none;stroke:var(--good);stroke-width:3"/>`;
            s += `<line x1="${X(x)}" y1="${Y(y)}" x2="${ex}" y2="${ey}" style="stroke:var(--accent);stroke-width:3"/><circle cx="${ex}" cy="${ey}" r="4" style="fill:var(--accent)"/><circle cx="${X(x)}" cy="${Y(y)}" r="7" style="fill:var(--bad)"/>`;
            f.innerHTML = S.svg(W + 10, H + 10, s, { label: "Map of delay over stage sizes x (across) and y (up), log scales; stronger blue is slower; red dot is your design, orange line points downhill, green ring is the best design", max: 330 });
            ro.innerHTML = readout([["Stage gains", `${fmt(x, 3)}, ${fmt(y / x, 3)}, ${fmt(64 / y, 3)}`], ["Delay D", fmt(D(x, y), 3)], ["∂D/∂x, ∂D/∂y", `${fmt(gx, 3)}, ${fmt(gy, 3)}`], ["Best possible", "12 (all gains 4)"]]);
          }
          const step = el(`<button type="button" class="btn primary">Take a downhill step</button>`), xs = slider({ id: id + "-x", label: "x (size of stage 2)", min: 1, max: 64, log: true, value: x, show: (v) => fmt(v, 3) }, (v) => { x = v; draw(); }), ys = slider({ id: id + "-y", label: "y (size of stage 3)", min: 1, max: 64, log: true, value: y, show: (v) => fmt(v, 3) }, (v) => { y = v; draw(); });
          step.addEventListener("click", () => {
            /* gradient step in log coordinates */
            const gx = (1 - y / (x * x)) * x, gy = (1 / x - 64 / (y * y)) * y, a = 0.08, cap = (u) => Math.max(-1, Math.min(1, u));
            xs.set(Math.min(64, Math.max(1, x * Math.exp(cap(-a * gx))))); ys.set(Math.min(64, Math.max(1, y * Math.exp(cap(-a * gy)))));
          });
          const row = el(`<div class="row"></div>`); row.appendChild(step);
          host.append(f, xs.el, ys.el, row, ro);
          draw();
        },
        `<p class="aside">Stronger blue = slower. The orange line points downhill (along −∇D). Press the button a few times and the red dot slides into the green ring at x = 4, y = 16, where both partials are 0.</p>`,
      ]},
      { k: "math", title: "Solve it exactly", b: [
        steps([["∂D/∂x = 1 − y/x² = 0", "y = x²"], ["∂D/∂y = 1/x − 64/y² = 0", "y² = 64x"], ["Substitute y = x²", "x⁴ = 64x → x³ = 64 → x = 4"], ["Then", "y = 16. Gains 4, 4, 4. D = 12"]]),
        `<div class="key"><b>Equal effort per stage.</b> The best chain gives every stage the same gain: the N-th root of the total. That's the heart of “logical effort”, the method digital designers use to size gates by hand. Calculus found it in four lines.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Two stages driving 100× load: D = x + 100/x. Best x?", a: 10, why: "dD/dx = 1 − 100/x² = 0 → x = 10. Each stage gain 10." },
        { t: "num", q: "Three stages driving a 1000× load. Best gain per stage?", a: 10, why: "Equal gains: ∛1000 = 10." },
        { t: "mcq", q: "At a point, ∇f = (0.3, −0.4). Which way should an optimiser step to decrease f?", opts: [["(−0.3, +0.4): opposite the gradient", true, "The gradient points uphill; go the other way."], ["(0.3, −0.4)", false, "That's uphill."], ["Anywhere: f is at a minimum", false, "Only if the gradient is (0, 0)."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How can calculus find the best sizes for a chain of buffers?", model: "Write the total delay as a function of the stage sizes. At the best design no small change in any size can reduce the delay, so every partial derivative must be zero. Setting them to zero and solving shows each stage should have the same gain, the root of the total load ratio." },
      ]},
    ],
  };

  const p6 = {
    id: "p6", title: "Master it", mins: 30,
    blurb: "Sensitivities, linear estimates, budgets and optima.",
    takeaway: "You can compute partials and normalised sensitivities, estimate combined drift, build an error budget, choose worst case vs RSS, see why IC design is ratio design, and find an optimum by setting the gradient to zero.",
    steps: [
      { k: "check", title: "Problem 1: the op-amp loop", b: [
        `<p>Closed-loop gain G = A/(1 + Aβ).</p>`,
        { t: "num", q: "Sensitivity of G to A, for A = 10⁵ and β = 0.01?", a: 0.000999, tol: 0.02, hint: "S = (∂G/∂A)(A/G). Show ∂G/∂A = 1/(1 + Aβ)².", hint2: "S simplifies to 1/(1 + Aβ).", why: "S = 1/(1 + Aβ) = 1/1001 ≈ 0.001. A 20% drop in A changes G by only 0.02%. Feedback trades gain for insensitivity (Module 37)." },
      ]},
      { k: "check", title: "Problem 2: current mirror", b: [
        `<p>Mirror output I<sub>out</sub> = I<sub>ref</sub>·(W/L)₂/(W/L)₁.</p>`,
        { t: "mcq", q: "Every transistor's W/L comes out 8% low in this batch. I_out changes by…", opts: [["About 0%", true, "Sensitivities +1 and −1 cancel: a ratio."], ["−8%", false, "Both W/L terms shift together."], ["+8%", false, "Ratio again."]] },
      ]},
      { k: "check", title: "Problem 3: estimate", b: [
        `<p>A bandwidth f = g<sub>m</sub>/(2πC) with g<sub>m</sub> = 2I<sub>D</sub>/V<sub>ov</sub>.</p>`,
        { t: "num", q: "I_D rises 10%, V_ov rises 5%, C rises 3%. Estimated % change in f?", a: 2, unit: "%", hint: "f ∝ I_D·V_ov⁻¹·C⁻¹.", why: "+10 − 5 − 3 = +2%." },
      ]},
      { k: "check", title: "Problem 4: budget", b: [
        { t: "num", q: "Errors of 6, 3 and 2 mV (independent σ). Total σ (mV)?", a: 7, hint: "Square, add, root.", why: "√(36 + 9 + 4) = √49 = 7 mV. The 6 mV term carries most of it." },
      ]},
      { k: "check", title: "Problem 5: optimum", b: [
        `<p>A design cost has one term that grows with R and one that shrinks with it: C(R) = R/R₀ + R₀/(4R), with R₀ = 10 kΩ.</p>`,
        { t: "num", q: "R that minimises C (kΩ)?", a: 5, hint: "dC/dR = 1/R₀ − R₀/(4R²) = 0.", why: "R² = R₀²/4 → R = R₀/2 = 5 kΩ." },
      ]},
      { k: "say", title: "Problem 6: explain it", b: [
        { t: "say", q: "A colleague biases a transistor with a fixed V_GS from a resistor divider. Using sensitivity, explain the risk and a better approach.", model: "The drain current's sensitivity to the threshold voltage is minus two V_T over the overdrive, which can be minus five or worse. So a small threshold shift between chips or with temperature changes the current by many percent. A current mirror sets V_GS from a matched reference transistor carrying a known current, so the threshold appears in both and cancels: the output depends on a ratio." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m27", eyebrow: "Math Toolkit · Module 27", title: "Sensitivity and Error Budgets",
    intro: `<p>Six parts: partial derivatives as knobs, percent-per-percent sensitivity, the total differential (and why it is the small-signal model), worst-case vs statistical error budgets, gradients and optimal sizing, and mastery problems.</p><p>Why a chip designer needs this: no two chips are identical. Every specification is met only if you know which parts the output is touchy about and design around them.</p><p class="aside">Before this: Module 13 (derivatives, including Part 5 on partials). Connects to 6.002 Chapter 8 and Boylestad Chapter 4 (stability factors).</p>`,
    after: `<p>Next: Module 28 shows how a simulator solves nonlinear circuits, with Newton's method running on exactly these derivatives.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <p><b>Partial</b> ∂f/∂x: change x, hold the rest. Divider: ∂H/∂R₂ = R₁/(R₁+R₂)², ∂H/∂R₁ = −R₂/(R₁+R₂)².</p>
      <div class="eq">S<sub>x</sub><sup>f</sup> = (∂f/∂x)(x/f) = d ln f / d ln x</div>
      <p>K·xⁿ → n; products add, quotients subtract. f_c = 1/2πRC: −1, −1. ω₀: −½, −½. Divider: S_R₁ = −S_R₂ → ratios cancel common drift. I_D vs V_T: −2V_T/V_ov. G = A/(1+Aβ): S_A = 1/(1+Aβ).</p>
      <p><b>Total differential:</b> Δf ≈ Σ(∂f/∂xᵢ)Δxᵢ; Δf/f ≈ ΣSᵢ(Δxᵢ/xᵢ). Small-signal model: i_d = g_m v_gs + g_o v_ds.</p>
      <p><b>Budgets:</b> worst case Σ|Sᵢ|tolᵢ; RSS √Σ(Sᵢσᵢ)² for independent errors; N equal → √N×. Fix the biggest term.</p>
      <p><b>Optimum:</b> ∇f = 0. Step along −∇f. Buffer chain: equal gain per stage = (total)^(1/N).</p>`,
  };
  Course.start(window.CHAPTER);
})();
