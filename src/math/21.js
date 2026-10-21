(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const sg = (v, d = 3) => (v < 0 ? " − " + fmt(-v, d) : " + " + fmt(v, d));
  const fac = (p) => (p === 0 ? "s" : `(s${sg(-p)})`);
  const ex = (p) => (p === 0 ? "" : `e^(${fmt(p, 3)}t)`);
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;

  const p1 = {
    id: "p1", title: "Distinct real poles", mins: 20,
    blurb: "Split into simple fractions, then read each one off the table as an exponential.",
    takeaway: "Recipe: factor the denominator, split into A/(s + a) pieces (cover-up), and turn each piece into Ae^(−at). (2s + 5)/((s + 1)(s + 3)) = 1.5/(s + 1) + 0.5/(s + 3) → f(t) = 1.5e^(−t) + 0.5e^(−3t). A pole at 0 gives a constant: A/s → A.",
    steps: [
      { k: "learn", title: "One example, all the steps", b: [
        steps([["F(s)", "(2s + 5)/((s + 1)(s + 3))"], ["Split", "A/(s + 1) + B/(s + 3)"], ["Cover-up at s = −1", "A = (−2 + 5)/(−1 + 3) = 1.5"], ["Cover-up at s = −3", "B = (−6 + 5)/(−3 + 1) = 0.5"], ["Table: 1/(s + a) → e^(−at)", "f(t) = 1.5e^(−t) + 0.5e^(−3t)"]]),
        `<p class="aside">Check: f(0) = 2. Initial value theorem: sF → 2s²/s² = 2 ✓.</p>`,
      ]},
      { k: "play", title: "Pick the poles", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let z = -2.5, p1 = -1, p2 = -3;
          function draw() {
            if (Math.abs(p1 - p2) < 1e-9) { f.innerHTML = ""; ro.innerHTML = readout([["Equal poles", "repeated: see Part 2"]]); return; }
            const A = (p1 - z) / (p1 - p2), B = (p2 - z) / (p2 - p1);
            const g1 = (t) => A * Math.exp(p1 * t), g2 = (t) => B * Math.exp(p2 * t);
            f.innerHTML = plot({ x: [0, 5], y: [-1.5, 2], xt: [0, 1, 2, 3, 4, 5], yt: [-1, 0, 1, 2], xl: "t", h: 220, series: [{ f: g1, cls: "s4" }, { f: g2, cls: "s5" }, { f: (t) => g1(t) + g2(t), cls: "s1" }], label: "The two exponential pieces (dashed) and their sum (orange)" });
            ro.innerHTML = readout([["F(s)", `${fac(z)}/[${fac(p1)}${fac(p2)}]`], ["Pieces", `${fmt(A, 3)}/${fac(p1)} ${B < 0 ? "−" : "+"} ${fmt(Math.abs(B), 3)}/${fac(p2)}`], ["f(t)", `${fmt(A, 3)}${ex(p1)} ${B < 0 ? "−" : "+"} ${fmt(Math.abs(B), 3)}${ex(p2)}`]]);
          }
          host.append(f, slider({ id: id + "-z", label: "Zero", min: -5, max: 0, step: 0.5, value: z }, (v) => { z = v; draw(); }).el, slider({ id: id + "-a", label: "Pole p₁", min: -5, max: 0, step: 0.5, value: p1 }, (v) => { p1 = v; draw(); }).el, slider({ id: id + "-b", label: "Pole p₂", min: -5, max: 0, step: 0.5, value: p2 }, (v) => { p2 = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Move a pole to 0: its piece becomes a constant that never dies, a final value.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "ℒ⁻¹{4/(s(s + 4))} = ?", opts: [["1 − e^(−4t)", true, "A at 0: 4/4 = 1; B at −4: 4/(−4) = −1."], ["4e^(−4t)", false, "That's 4/(s + 4)."], ["e^(−4t) − 1", false, "Check the signs: A = +1."]] },
        { t: "num", q: "(s + 5)/((s + 2)(s + 6)) = A/(s + 2) + B/(s + 6). A = ?", a: 0.75, why: "(−2 + 5)/(−2 + 6) = 3/4." },
        { t: "num", q: "B = ?", a: 0.25, why: "(−6 + 5)/(−6 + 2) = 1/4. So f = 0.75e^(−2t) + 0.25e^(−6t), and f(0) = 1 ✓." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe the recipe for inverting a transform whose denominator has distinct real roots.", model: "Factor the denominator, split the fraction into one A over (s plus a) term per root using the cover-up method, then turn each term into A times e to the minus a t from the table and add them up." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Repeated poles", mins: 20,
    blurb: "A squared factor brings a t·e^(−at) term along with the plain exponential.",
    takeaway: "B/(s + a)² → B·t·e^(−at); B/(s + a)³ → (B/2)t²e^(−at). So 1/(s(s + 1)²) = 1/s − 1/(s + 1) − 1/(s + 1)² → f = 1 − e^(−t) − t e^(−t). Repeated poles at the same spot = the critically damped case of Module 15.",
    steps: [
      { k: "learn", title: "Worked: 1/(s(s + 1)²)", b: [
        steps([["Split", "A/(s + 1) + B/(s + 1)² + C/s"], ["B: cover (s + 1)², s = −1", "1/(−1) = −1"], ["C: cover s, s = 0", "1/1 = 1"], ["A: plug in s = 1", "1/4 = A/2 − 1/4 + 1 → A = −1"], ["Table", "f(t) = 1 − e^(−t) − t e^(−t)"]]),
        `<p class="aside">Check: f(0) = 1 − 1 − 0 = 0 ✓ (sF → 0 as s → ∞); f(∞) = 1 ✓ (sF → 1 as s → 0).</p>`,
      ]},
      { k: "play", title: "Plain vs repeated", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 1;
          function draw() {
            f.innerHTML = plot({ x: [0, 8], y: [0, 1.1], xt: [0, 2, 4, 6, 8], yt: [0, 0.5, 1], xl: "t", h: 210, series: [{ f: (t) => 1 - Math.exp(-a * t), cls: "s5" }, { f: (t) => 1 - Math.exp(-a * t) - a * t * Math.exp(-a * t), cls: "s1" }], label: "Step response with one pole (dashed) and with a double pole (orange)" });
            ro.innerHTML = readout([["a/(s(s + a)) →", "1 − e^(−at) (dashed)"], ["a²/(s(s + a)²) →", "1 − e^(−at) − at·e^(−at) (orange)"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "a", min: 0.3, max: 3, step: 0.1, value: a }, (v) => { a = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The double pole starts flat (zero slope) and lags behind, the S-shaped critically damped rise.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "ℒ⁻¹{3/(s + 2)²} = ?", opts: [["3t e^(−2t)", true, "Double pole → t·e^(−at)."], ["3e^(−2t)", false, "That's 3/(s + 2)."], ["3e^(−4t)", false, "Squaring the bracket doesn't double a."]] },
        { t: "num", q: "f(t) = 1 − e^(−t) − t e^(−t). Value at t = 1?", a: 0.2642, tol: 0.01, why: "1 − 2/e = 0.264." },
        { t: "mcq", q: "ℒ⁻¹{(s + 3)/(s + 1)²}: write s + 3 = (s + 1) + 2 first. Result?", opts: [["e^(−t) + 2t e^(−t)", true, "(s + 1)/(s + 1)² = 1/(s + 1); 2/(s + 1)² → 2t e^(−t)."], ["(1 + 3t)e^(−t)", false, "Check the split: the leftover is 2, not 3."], ["e^(−t) + 2e^(−t)", false, "The squared term gives t e^(−t)."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What time term does a double pole at s = −a add?", model: "A term proportional to t times e to the minus a t, alongside the ordinary e to the minus a t term." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Complex poles", mins: 25,
    blurb: "Complete the square, line the top up with (s + α) and ω, and read off a damped cosine and sine.",
    takeaway: "(Cs + D)/((s + α)² + ω²) = C·(s + α)/((s + α)² + ω²) + E·ω/((s + α)² + ω²), with E = (D − Cα)/ω. Inverse: e^(−αt)[C cos ωt + E sin ωt]. Example: (s + 3)/(s² + 2s + 5) = [(s + 1) + 2]/((s + 1)² + 2²) → e^(−t)(cos 2t + sin 2t). Amplitude form if needed: √(C² + E²)·e^(−αt)cos(ωt − tan⁻¹(E/C)).",
    steps: [
      { k: "learn", title: "Worked: (s + 3)/(s² + 2s + 5)", b: [
        steps([["Complete the square", "s² + 2s + 5 = (s + 1)² + 2²"], ["Line up the top", "s + 3 = (s + 1) + 1·2"], ["Two table rows", "(s + 1)/((s + 1)² + 4) + 2/((s + 1)² + 4)"], ["Shifted cos and sin", "f(t) = e^(−t)cos 2t + e^(−t)sin 2t"]]),
        `<p class="aside">The 2 on top had to be written as 1 × ω (ω = 2) to match the sine row ω/((s + α)² + ω²).</p>`,
      ]},
      { k: "play", title: "Shape a damped sinusoid", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 1, w = 2, C = 1, D = 3;
          function draw() {
            const E = (D - C * a) / w, g = (t) => Math.exp(-a * t) * (C * Math.cos(w * t) + E * Math.sin(w * t)), A = Math.hypot(C, E);
            f.innerHTML = plot({ x: [0, 6], y: [-2.5, 2.5], xt: [0, 1, 2, 3, 4, 5, 6], yt: [-2, -1, 0, 1, 2], xl: "t", h: 220, series: [{ f: (t) => A * Math.exp(-a * t), cls: "s5" }, { f: (t) => -A * Math.exp(-a * t), cls: "s5" }, { f: g, cls: "s1" }], label: "Damped sinusoid inside its envelope" });
            ro.innerHTML = readout([["F(s)", `(${fmt(C)}s${sg(D)})/((s${sg(a)})² + ${fmt(w * w, 3)})`], ["E = (D − Cα)/ω", fmt(E, 3)], ["f(t)", `e^(−${fmt(a)}t)[${fmt(C)} cos ${fmt(w)}t ${E < 0 ? "−" : "+"} ${fmt(Math.abs(E), 3)} sin ${fmt(w)}t]`], ["Envelope height √(C² + E²)", fmt(A, 3)]]);
          }
          const mk = (k, lab, v, set, lo, hi, st) => slider({ id: id + k, label: lab, min: lo, max: hi, step: st, value: v }, (x) => { set(x); draw(); }).el;
          host.append(f, mk("a", "α (decay)", a, (x) => (a = x), 0.1, 3, 0.1), mk("w", "ω (frequency)", w, (x) => (w = x), 0.5, 6, 0.5), mk("c", "C (s coefficient on top)", C, (x) => (C = x), -2, 2, 0.5), mk("d", "D (constant on top)", D, (x) => (D = x), -4, 6, 0.5), ro);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "(2s + 7)/((s + 2)² + 9) → e^(−2t)[2 cos 3t + E sin 3t]. E = ?", a: 1, hint: "E = (D − Cα)/ω = (7 − 2 × 2)/3.", why: "E = 1." },
        { t: "mcq", q: "ℒ⁻¹{10/(s² + 4s + 29)} = ?", opts: [["2e^(−2t) sin 5t", true, "(s + 2)² + 25; 10 = 2 × 5."], ["10e^(−2t) sin 5t", false, "Write 10 as 2·ω with ω = 5."], ["2e^(−2t) cos 5t", false, "No s on top → sine only."]] },
        { t: "num", q: "e^(−t)(cos 2t + sin 2t): the envelope height √(C² + E²)?", a: 1.414, tol: 0.01, why: "√2." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe how to invert a transform with complex poles.", model: "Complete the square in the denominator to get s plus alpha squared plus omega squared. Rewrite the top as some multiple of s plus alpha plus some multiple of omega. The first piece gives e to the minus alpha t cosine omega t and the second gives e to the minus alpha t sine omega t." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "The full recipe, and checking", mins: 20,
    blurb: "Five steps that handle any rational F(s), plus the two checks that catch most slips.",
    takeaway: "1) Proper? If the top's degree ≥ the bottom's, divide first; a leftover constant k gives kδ(t). 2) Factor the bottom (complete the square for complex pairs). 3) Partial fractions. 4) Table rows plus the shift rule. 5) Check f(0⁺) = lim(s→∞) sF and f(∞) = lim(s→0) sF (when valid). Example: 5/(s(s² + 2s + 5)) → 1 − e^(−t)(cos 2t + ½ sin 2t).",
    steps: [
      { k: "learn", title: "Five steps", b: [
        `<ol><li><b>Proper?</b> Top degree &lt; bottom degree. If not, divide.</li><li><b>Factor</b> the bottom: real roots, repeated roots, complex pairs.</li><li><b>Partial fractions</b> (Module 18).</li><li><b>Table</b> plus the shift rule (Modules 19–20).</li><li><b>Check</b> with the initial and final value theorems.</li></ol>`,
      ]},
      { k: "math", title: "Worked: 5/(s(s² + 2s + 5))", b: [
        { t: "reveal", label: "Steps 2–3 (from Module 18, Part 4)", html: `<div class="eq">1/s − (s + 1)/((s + 1)² + 4) − ½·2/((s + 1)² + 4)</div>` },
        { t: "reveal", label: "Step 4", html: `<div class="eq">f(t) = 1 − e<sup>−t</sup>cos 2t − ½e<sup>−t</sup>sin 2t</div>` },
        { t: "reveal", label: "Step 5: check", html: `<p>f(0) = 1 − 1 − 0 = 0; sF = 5/(s² + 2s + 5) → 0 as s → ∞ ✓. f(∞) = 1; sF → 5/5 = 1 as s → 0 ✓ (poles −1 ± j2 in the left half).</p>` },
      ]},
      { k: "math", title: "Improper: (s + 2)/(s + 1)", b: [
        { t: "reveal", label: "Divide", html: `<div class="eq">(s + 2)/(s + 1) = 1 + 1/(s + 1)</div>` },
        { t: "reveal", label: "Invert", html: `<div class="eq">f(t) = δ(t) + e<sup>−t</sup></div><p class="aside">An impulse appears. In circuits, an improper transform usually means an idealised instant jump (like an ideal capacitor connected straight across a source).</p>` },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Someone inverts F = (s + 4)/(s(s + 2)) and gets f = 2 − e^(−2t). Check with the theorems.", opts: [["It passes both: f(0) = 1 = lim sF as s → ∞, and f(∞) = 2 = lim sF as s → 0. (It is correct.)", true, "A = 4/2 = 2 at s = 0; B = 2/(−2) = −1 at s = −2."], ["It fails the final value check", false, "sF → 4/2 = 2 as s → 0, matching f(∞) = 2."], ["It fails the initial value check", false, "sF → 1 as s → ∞; f(0) = 2 − 1 = 1 ✓."]] },
        { t: "mcq", q: "A candidate inverse of 6/(s(s + 3)) is 2 + e^(−3t). Verdict?", opts: [["Wrong: f(0) would be 3, but sF → 0 as s → ∞", true, "Correct answer: 2 − 2e^(−3t)."], ["Right", false, "Check f(0⁺)."], ["Can't tell without inverting", false, "The initial value theorem rejects it in one line."]] },
        { t: "num", q: "ℒ⁻¹{(2s² + 3)/(s² + 1)}: after dividing, the constant multiplying δ(t)?", a: 2, hint: "2s² + 3 = 2(s² + 1) + 1.", why: "2 + 1/(s² + 1) → 2δ(t) + sin t." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How can you catch a wrong inverse Laplace transform without redoing it?", model: "Compare the answer's value at t equals zero with the limit of s F of s as s goes to infinity, and its long-run value with the limit of s F of s as s goes to zero, when that's valid. If either disagrees, there's a slip." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m21", eyebrow: "Math Toolkit · Module 21", title: "Inverse Laplace Transforms",
    intro: `<p>Four parts: distinct real poles, repeated poles, complex poles, then the full recipe with checks. It's partial fractions (<a href="18-partial-fractions.html">Module 18</a>) plus the table and shift rule (Modules <a href="19-laplace-intro.html">19</a>–<a href="20-laplace-properties.html">20</a>).</p>`,
    after: `<p>Every inverse you do, finish with the f(0⁺) and f(∞) checks. They take seconds and catch sign slips.</p>`,
    parts: [p1, p2, p3, p4],
    summary: `
      <p>A/(s + a) → Ae<sup>−at</sup> · A/s → A · B/(s + a)² → Bte<sup>−at</sup> · B/(s + a)³ → (B/2)t²e<sup>−at</sup></p>
      <div class="eq">(Cs + D)/((s + α)² + ω²) → e<sup>−αt</sup>[C cos ωt + ((D − Cα)/ω) sin ωt]</div>
      <p>Recipe: proper? (divide; constant k → kδ(t)) → factor → partial fractions → table + shift → check f(0⁺) = lim<sub>s→∞</sub> sF, f(∞) = lim<sub>s→0</sub> sF.</p>`,
  };
  Course.start(window.CHAPTER);
})();
