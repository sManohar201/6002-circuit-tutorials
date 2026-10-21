(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  /* Numerical mean of g over one period [0, 1). */
  const mean = (g, n = 2000) => { let s = 0; for (let i = 0; i < n; i++) s += g((i + 0.5) / n); return s / n; };
  const WAVES = [
    ["Sine", (x) => Math.sin(2 * Math.PI * x)],
    ["Half-wave", (x) => Math.max(0, Math.sin(2 * Math.PI * x))],
    ["Full-wave", (x) => Math.abs(Math.sin(2 * Math.PI * x))],
    ["Square ±1", (x) => (x < 0.5 ? 1 : -1)],
    ["Pulse, 25% duty", (x) => (x < 0.25 ? 1 : 0)],
  ];

  const p1 = {
    id: "p1", title: "Area under a curve", mins: 15,
    blurb: "An integral adds up thin slices. Charge is the area under a current graph.",
    takeaway: "∫ₐᵇ f(x) dx = the signed area between the curve and the x-axis from a to b (area below the axis counts negative). Charge q = ∫ i dt; a capacitor's voltage change Δv = (1/C)∫ i dt. A constant current I for time T gives q = IT, so Δv = IT/C. The integral undoes the derivative.",
    steps: [
      { k: "learn", title: "Thin slices", b: [
        fig(plot({ x: [0, 4], y: [0, 3], xt: [0, 1, 2, 3, 4], yt: [0, 1, 2, 3], xl: "t", yl: "i", h: 190, areas: [{ f: (x) => 1 + 0.5 * x, from: 0.5, to: 3.5, cls: "ar1" }], series: [{ f: (x) => 1 + 0.5 * x, cls: "s1" }], label: "Area under a straight current graph" })),
        `<div class="eq">q = ∫ i dt  = area under the i(t) graph</div>`,
        `<p class="aside">Each thin slice is i × Δt, a little charge. The integral adds them all up. For straight-edged shapes you can use rectangle and triangle areas.</p>`,
      ]},
      { k: "play", title: "Charge a capacitor", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let I = 2, T = 3;
          const C = 1; // µF
          function draw() {
            f.innerHTML = plot({ x: [0, 6], y: [0, 5], xt: [2, 4, 6], yt: [1, 2, 3, 4, 5], xl: "t (ms)", yl: "i (mA)", h: 180, areas: [{ f: () => I, from: 0, to: T, cls: "ar1" }], series: [{ pts: [[0, I], [T, I], [T, 0], [6, 0]], cls: "s1" }], label: "Current pulse with its area shaded" });
            ro.innerHTML = readout([["Area = I × T", fmt(I * T, 3) + " µC (mA × ms)"], ["Δv = q/C on 1 µF", fmt((I * T) / C, 3) + " V"]]);
          }
          host.append(f, slider({ id: id + "-i", label: "Current", min: 0.5, max: 5, step: 0.5, value: I, show: (v) => v + " mA" }, (v) => { I = v; draw(); }).el,
            slider({ id: id + "-t", label: "Duration", min: 0.5, max: 6, step: 0.5, value: T, show: (v) => v + " ms" }, (v) => { T = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">mA × ms = µC, and µC ÷ µF = V: another cancelling pair.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A current ramps from 0 to 4 mA over 2 ms (a triangle). Charge delivered? (µC)", a: 4, unit: "µC", hint: "Triangle: ½ × base × height.", why: "½ × 2 ms × 4 mA = 4 µC." },
        { t: "num", q: "That charge into a 0.5 µF capacitor (starting at 0 V). Final voltage?", a: 8, unit: "V", why: "4 µC/0.5 µF = 8 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the area under a current graph relate to a capacitor's voltage?", model: "The area under current against time is the total charge delivered. A capacitor's voltage change is that charge divided by its capacitance, so the voltage climbs in step with the accumulated area." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Average value", mins: 15,
    blurb: "Average = area over one period ÷ the period. It's what a dc meter reads.",
    takeaway: "Average (dc value) = (1/T)∫₀ᵀ v dt: flatten the area into a rectangle of width T; its height is the average. Sine: 0. Half-wave rectified: V_m/π = 0.318V_m. Full-wave: 2V_m/π = 0.637V_m. Pulse of height V and duty cycle D: D·V. One hump of a sine has area 2V_m/ω.",
    steps: [
      { k: "play", title: "Flatten the area", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let w = 1;
          function draw() {
            const g = WAVES[w][1], m = mean(g);
            f.innerHTML = plot({ x: [0, 2], y: [-1.2, 1.2], xt: [0, 1, 2], xtf: (v) => (v ? v + "T" : "0"), yt: [-1, 0, 1], h: 210, areas: [{ f: (x) => g(x % 1), from: 0, to: 1, cls: "ar1", n: 400 }], series: [{ f: (x) => g(x % 1 === 0 && x > 0 ? 0.9999 : x % 1), cls: "s1", n: 600 }, { f: () => m, cls: "s5" }], label: "Waveform with its area over one period and its average level" });
            ro.innerHTML = readout([["Average (dashed)", fmt(m, 3) + " × peak"]]);
          }
          host.append(toggle(WAVES.map((x) => x[0]), (i) => { w = i; draw(); }, 1), f, ro);
          draw();
        },
        `<p class="aside">Imagine the shaded area poured into a tank of width T. The level it settles at is the average.</p>`,
      ]},
      { k: "math", title: "Where V_m/π comes from", b: [
        `<p>Area of one hump of V<sub>m</sub> sin θ from θ = 0 to π:</p>`,
        `<div class="eq">∫₀<sup>π</sup> V<sub>m</sub> sin θ dθ = V<sub>m</sub>[−cos θ]₀<sup>π</sup> = V<sub>m</sub>(1 + 1) = 2V<sub>m</sub></div>`,
        `<p>Half-wave: one hump per 2π, so average = 2V<sub>m</sub>/2π = V<sub>m</sub>/π. Full-wave: two humps, 2V<sub>m</sub>/π.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 5 V pulse train with 30% duty cycle. Average?", a: 1.5, unit: "V", why: "0.3 × 5 = 1.5 V." },
        { t: "num", q: "Half-wave rectifier, 20 V peak (ideal diode). dc output?", a: 6.37, unit: "V", tol: 0.01, why: "20/π = 6.37 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the average of a full-wave rectified sine twice that of a half-wave one?", model: "Both have humps of the same area, but full-wave puts a hump in every half cycle while half-wave leaves every other half cycle empty. Twice the area in the same period means twice the average." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "rms, power and energy", mins: 20,
    blurb: "rms is root-mean-square: square it, average it, root it. Stored energy is an integral too.",
    takeaway: "rms = √[(1/T)∫ v² dt]. Sine: V_m/√2. Square wave ±V: V. Full-wave rectified: V_m/√2 too (squaring removes the sign). Average power into R: V_rms²/R. Energy stored: capacitor ½CV², inductor ½LI² (integrals of p = vi). A CMOS gate switching C at frequency f burns P = CV²f.",
    steps: [
      { k: "play", title: "Square, average, root", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let w = 0;
          function draw() {
            const g = WAVES[w][1], ms = mean((x) => g(x) ** 2), m = mean(g);
            f.innerHTML = plot({ x: [0, 1], y: [-1.2, 1.2], xt: [0, 0.5, 1], xtf: (v) => (v ? v + "T" : "0"), yt: [-1, 0, 1], h: 210, areas: [{ f: (x) => g(x) ** 2, cls: "ar2", n: 400 }], series: [{ f: g, cls: "s1", n: 600 }, { f: (x) => g(x) ** 2, cls: "s2", n: 600 }, { f: () => Math.sqrt(ms), cls: "s5" }], label: "Waveform (orange), its square (blue) and its rms level (dashed)" });
            ro.innerHTML = readout([["Mean of v² (blue area ÷ T)", fmt(ms, 3)], ["rms = √(mean of v²)", fmt(Math.sqrt(ms), 3) + " × peak"], ["Average, for comparison", fmt(m, 3) + " × peak"]]);
          }
          host.append(toggle(WAVES.map((x) => x[0]), (i) => { w = i; draw(); }), f, ro);
          draw();
        },
        `<p class="aside">Squaring makes everything positive, so a sine's rms isn't 0 even though its average is.</p>`,
      ]},
      { k: "learn", title: "Stored energy", b: [
        `<div class="two"><div class="tile"><h3>Capacitor</h3><div class="eq">w = ½CV²</div></div><div class="tile"><h3>Inductor</h3><div class="eq">w = ½LI²</div></div></div>`,
        `<p class="aside">Both come from integrating power p = vi while the element charges up: with i = C dv/dt, ∫ vC dv = ½CV².</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A sine of 10 V peak across 50 Ω. Average power? (W)", a: 1, unit: "W", why: "V_rms = 7.07 V; 7.07²/50 = 1 W." },
        { t: "num", q: "Energy in a 470 µF capacitor at 16 V? (mJ)", a: 60.16, unit: "mJ", tol: 0.01, why: "½ × 470 µ × 256 = 60.2 mJ." },
        { t: "num", q: "A 20 pF load switched at 50 MHz between 0 and 3.3 V. P = CV²f in mW?", a: 10.89, unit: "mW", tol: 0.01, why: "20 p × 10.89 × 50 M = 10.9 mW." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe how to find the rms of any waveform.", model: "Square the waveform at every instant, take the average of that squared signal over one period, then take the square root. The name says the steps backwards: root of the mean of the square." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Antiderivatives: the derivative backwards", mins: 20,
    blurb: "To find an area exactly, find a function whose derivative is your curve. Then subtract two values.",
    takeaway: "F is an antiderivative of f if F′ = f. Then ∫ₐᵇ f dx = F(b) − F(a) (the fundamental theorem). Table: ∫xⁿ dx = xⁿ⁺¹/(n+1) (n ≠ −1); ∫1/x dx = ln x; ∫e^(ax) dx = e^(ax)/a; ∫sin ωt dt = −cos(ωt)/ω; ∫cos ωt dt = sin(ωt)/ω. Indefinite integrals get '+ C'. Check any answer by differentiating it.",
    steps: [
      { k: "learn", title: "Run Module 13 backwards", b: [
        `<p>The area under f from a up to x grows at rate f(x). So the area function's derivative is f, and finding areas means undoing derivatives.</p>`,
        `<div class="eq">∫<sub>a</sub><sup>b</sup> f(x) dx = F(b) − F(a),   where F′ = f</div>`,
        `<div class="tbl"><table><tr><th>f</th><th>∫ f (an antiderivative)</th></tr><tr><td>xⁿ</td><td>xⁿ⁺¹/(n + 1)</td></tr><tr><td>1/x</td><td>ln x</td></tr><tr><td>e<sup>ax</sup></td><td>e<sup>ax</sup>/a</td></tr><tr><td>sin ωt</td><td>−cos(ωt)/ω</td></tr><tr><td>cos ωt</td><td>sin(ωt)/ω</td></tr></table></div>`,
        `<p class="aside">Each row is a row of the derivative table read right to left.</p>`,
      ]},
      { k: "play", title: "Area grows at rate f", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let X = 1.5;
          const g = (t) => Math.exp(-t), G = (t) => 1 - Math.exp(-t);
          function draw() {
            f.innerHTML = plot({ x: [0, 4], y: [0, 1.1], xt: [0, 1, 2, 3, 4], yt: [0, 0.5, 1], xl: "t", h: 230, areas: [{ f: g, from: 0, to: X, cls: "ar1" }], series: [{ f: g, cls: "s1" }, { f: G, cls: "s2" }], marks: [{ x: X, y: G(X), cls: "mk2" }], label: "e to the minus t (orange), the shaded area up to t, and the area function (blue)" });
            ro.innerHTML = readout([["Shaded area ∫₀ᵗ e^(−u) du", fmt(G(X), 4)], ["F(t) − F(0) with F = −e^(−t)", `${fmt(-Math.exp(-X), 4)} − (−1) = ${fmt(G(X), 4)}`]]);
          }
          host.append(f, slider({ id: id + "-x", label: "Upper limit t", min: 0, max: 4, step: 0.05, value: X }, (v) => { X = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The blue curve is the running area. Its slope at any t equals the height of the orange curve there.</p>`,
      ]},
      { k: "math", title: "A capacitor fed a ramp", b: [
        `<p>A current ramp i = kt flows into C from t = 0 to T. Voltage reached:</p>`,
        { t: "reveal", label: "Integrate", html: `<div class="eq">v = (1/C)∫<sub>0</sub><sup>T</sup> kt dt = (1/C)[kt²/2]<sub>0</sub><sup>T</sup> = kT²/(2C)</div><p class="aside">Same as the triangle area ½ × T × kT, divided by C.</p>` },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "∫₀² 3t² dt = ?", a: 8, why: "[t³]₀² = 8." },
        { t: "num", q: "∫₀¹ e^(−2t) dt = ?", a: 0.4323, tol: 0.01, hint: "Antiderivative −e^(−2t)/2.", why: "(1 − e⁻²)/2 = 0.432." },
        { t: "num", q: "∫₀^π sin θ dθ = ?", a: 2, why: "[−cos θ]₀^π = 1 + 1 = 2: one sine hump (Part 2)." },
        { t: "mcq", q: "How do you check ∫ e^(5t) dt = e^(5t)/5 + C?", opts: [["Differentiate the answer: (e^(5t)/5)′ = e^(5t) ✓", true, "Always available, always quick."], ["Integrate again", false, "That goes the wrong way."], ["You can't check integrals", false, "Differentiating undoes them."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does finding an area come down to undoing a derivative?", model: "As you slide the right edge of the area along, the area grows at a rate equal to the curve's height there. So the area function's derivative is the curve itself, and the area between two points is the difference of any function whose derivative is the curve." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "Substitution, by parts, and integrals to infinity", mins: 25,
    blurb: "The three techniques the Laplace transform needs. All three are worked with e^(−st).",
    takeaway: "Substitution: if the integrand has a function of (s + a)t, treat that as one variable: ∫e^(−(s+a)t) dt = −e^(−(s+a)t)/(s + a). By parts: ∫u dv = uv − ∫v du (choose u to get simpler when differentiated, like t). Improper: ∫₀^∞ means the limit as the upper end → ∞; ∫₀^∞ e^(−at) dt = 1/a only if a > 0 (otherwise it diverges). Combined: ∫₀^∞ t e^(−st) dt = 1/s².",
    steps: [
      { k: "learn", title: "Substitution", b: [
        `<p>e<sup>−(s+a)t</sup> is e<sup>kt</sup> with k = −(s + a). The table row ∫e<sup>kt</sup> dt = e<sup>kt</sup>/k still applies:</p>`,
        `<div class="eq">∫ e<sup>−(s+a)t</sup> dt = −e<sup>−(s+a)t</sup> / (s + a)</div>`,
        `<p class="aside">General form: ∫f(g(x))g′(x)dx = ∫f(u)du with u = g(x). Here u = −(s + a)t, du = −(s + a)dt.</p>`,
      ]},
      { k: "play", title: "Out to infinity", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 1, T = 3;
          function draw() {
            const area = Math.abs(a) < 1e-9 ? T : (1 - Math.exp(-a * T)) / a;
            f.innerHTML = plot({ x: [0, 10], y: [0, 3], xt: [0, 2, 4, 6, 8, 10], yt: [0, 1, 2, 3], xl: "t", h: 220, areas: [{ f: (t) => Math.exp(-a * t), from: 0, to: T, cls: "ar1" }], series: [{ f: (t) => Math.exp(-a * t), cls: "s1" }], label: "e to the minus a t with the area from 0 to T shaded" });
            ro.innerHTML = readout([["∫₀ᵀ e^(−at) dt = (1 − e^(−aT))/a", fmt(area, 4)], ["As T → ∞", a > 0 ? "→ 1/a = " + fmt(1 / a, 4) : "grows without limit: diverges"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "a", min: -0.3, max: 3, step: 0.05, value: a }, (v) => { a = v; draw(); }).el, slider({ id: id + "-t", label: "Upper limit T", min: 0.5, max: 10, step: 0.1, value: T }, (v) => { T = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">With a &gt; 0 the curve dies away fast enough that the total area settles at 1/a. With a ≤ 0 it never settles. That's why Laplace transforms come with a condition like "for s &gt; −a".</p>`,
      ]},
      { k: "learn", title: "Integration by parts", b: [
        `<p>From the product rule (uv)′ = u′v + uv′, integrate both sides and rearrange:</p>`,
        `<div class="eq">∫ u dv = uv − ∫ v du</div>`,
        `<p>Use it when the integrand is a product, and one factor (u) gets simpler when differentiated. For t·e<sup>−st</sup>: u = t (→ du = dt), dv = e<sup>−st</sup>dt (→ v = −e<sup>−st</sup>/s).</p>`,
      ]},
      { k: "math", title: "∫₀^∞ t e^(−st) dt", b: [
        { t: "reveal", label: "Apply by parts", html: `<div class="eq">[−t e<sup>−st</sup>/s]<sub>0</sub><sup>∞</sup> + (1/s)∫<sub>0</sub><sup>∞</sup> e<sup>−st</sup> dt</div>` },
        { t: "reveal", label: "Evaluate (s > 0)", html: `<div class="eq">0 − 0 + (1/s)(1/s) = 1/s²</div><p class="aside">t e<sup>−st</sup> → 0 as t → ∞ because the exponential wins over t. This is the Laplace transform of t, used in Module 19.</p>` },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "∫₀^∞ e^(−4t) dt = ?", a: 0.25, why: "1/a = 1/4." },
        { t: "num", q: "∫₀^∞ t e^(−2t) dt = ?", a: 0.25, hint: "Same steps as the worked example with s = 2.", why: "1/s² = 1/4." },
        { t: "num", q: "A current 3e^(−t/τ) mA with τ = 2 ms flows forever into a capacitor. Total charge? (µC)", a: 6, unit: "µC", hint: "∫₀^∞ 3e^(−t/τ) dt = 3τ.", why: "3 mA × 2 ms = 6 µC." },
        { t: "mcq", q: "For ∫ t·e^(3t) dt by parts, choose…", opts: [["u = t, dv = e^(3t) dt", true, "t differentiates to 1 (simpler); e^(3t) integrates easily."], ["u = e^(3t), dv = t dt", false, "Then ∫v du has t², which is worse."], ["Neither: it can't be done", false, "It can: the result is e^(3t)(t/3 − 1/9) + C."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "When does ∫₀^∞ e^(−at) dt have a finite value, and what is it?", model: "Only when a is positive, so the exponential decays. Then the area from zero to infinity settles to one over a. If a is zero or negative the curve doesn't die away and the area grows without limit." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m14", eyebrow: "Math Toolkit · Module 14", title: "Integrals and Averages",
    intro: `<p>Five parts: integrals as areas, average values, rms with stored energy, then antiderivatives and the three techniques Laplace transforms need (substitution, by parts, integrals to infinity). Capacitor charging, rectifier dc levels, power-amplifier efficiency and ripple all use these.</p>`,
    after: `<p>Most integrals in these books are areas of rectangles, triangles or sine humps. Sketch the shape first.</p>`,
    parts: [p1, p2, p3, p4, p5],
    summary: `
      <p>∫ f dx = signed area. q = ∫ i dt; Δv = q/C; constant I for T: Δv = IT/C.</p>
      <p>Average = (1/T)∫ v dt. Sine 0 · half-wave V<sub>m</sub>/π · full-wave 2V<sub>m</sub>/π · pulse DV. One sine hump: area 2V<sub>m</sub> (in θ).</p>
      <div class="eq">rms = √[(1/T)∫ v² dt]     sine V<sub>m</sub>/√2     P = V<sub>rms</sub>²/R</div>
      <div class="eq">½CV²     ½LI²     P = CV²f</div>
      <p>∫<sub>a</sub><sup>b</sup> f = F(b) − F(a), F′ = f. ∫xⁿ = xⁿ⁺¹/(n+1) · ∫1/x = ln x · ∫e<sup>ax</sup> = e<sup>ax</sup>/a · ∫sin ωt = −cos ωt/ω · ∫cos ωt = sin ωt/ω.</p>
      <div class="eq">∫u dv = uv − ∫v du     ∫<sub>0</sub><sup>∞</sup> e<sup>−at</sup> dt = 1/a (a &gt; 0)     ∫<sub>0</sub><sup>∞</sup> t e<sup>−st</sup> dt = 1/s²</div>`,
  };
  Course.start(window.CHAPTER);
})();
