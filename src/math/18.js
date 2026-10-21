(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const sg = (v, d = 3) => (v < 0 ? " − " + fmt(-v, d) : " + " + fmt(v, d));
  const fac = (r) => (r === 0 ? "s" : `(s${sg(-r)})`); // factor for a root r: s − r

  const p1 = {
    id: "p1", title: "Roots and factors", mins: 20,
    blurb: "A root at s = r means a factor (s − r). Go between expanded and factored forms.",
    takeaway: "A polynomial in s: a sum of powers like s² + 3s + 2. Its roots are the s values that make it 0. Every root r gives a factor (s − r): roots −1 and −2 ⟺ (s + 1)(s + 2) = s² + 3s + 2. For s² + bs + c with roots r₁, r₂: b = −(r₁ + r₂) and c = r₁r₂. Real roots factor into real pieces; complex roots (D < 0) leave an unbreakable quadratic.",
    steps: [
      { k: "learn", title: "Root ⟺ factor", b: [
        `<div class="eq">s² + 3s + 2 = (s + 1)(s + 2)</div>`,
        `<p>Put s = −1: the first bracket is 0, so the whole product is 0. That's why −1 is a root. Every root r comes with a factor (s − r).</p>`,
        `<p class="aside">Watch the sign: a root at −2 gives (s − (−2)) = (s + 2).</p>`,
      ]},
      { k: "play", title: "Place two roots", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let r1 = -1, r2 = -2;
          function draw() {
            const b = -(r1 + r2), c = r1 * r2;
            f.innerHTML = plot({ x: [-6, 3], y: [-6, 10], xt: [-6, -4, -2, 0, 2], yt: [-4, 0, 4, 8], xl: "s", h: 220, series: [{ f: (s) => s * s + b * s + c, cls: "s1" }], marks: [{ x: r1, y: 0 }, { x: r2, y: 0, cls: "mk2" }], label: "Parabola with the two chosen roots" });
            ro.innerHTML = readout([["Factored", fac(r1) + fac(r2)], ["Expanded", `s²${sg(b)}s${sg(c)}`], ["b = −(r₁ + r₂), c = r₁r₂", `b = ${fmt(b)}, c = ${fmt(c)}`]]);
          }
          host.append(f, slider({ id: id + "-a", label: "Root r₁", min: -5, max: 2, step: 0.5, value: r1 }, (v) => { r1 = v; draw(); }).el, slider({ id: id + "-b", label: "Root r₂", min: -5, max: 2, step: 0.5, value: r2 }, (v) => { r2 = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Shortcut for factoring s² + bs + c by eye: find two numbers that multiply to c and add to b. For s² + 7s + 12: 3 and 4.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Factor s² + 7s + 10.", opts: [["(s + 2)(s + 5)", true, "2 × 5 = 10, 2 + 5 = 7."], ["(s − 2)(s − 5)", false, "That expands to s² − 7s + 10."], ["(s + 1)(s + 10)", false, "Adds to 11."]] },
        { t: "mcq", q: "Roots of s(s + 4)(s + 0.5)?", opts: [["0, −4, −0.5", true, "Each factor zero in turn. The bare s is the root 0."], ["4 and 0.5", false, "Signs flip: s + 4 = 0 at s = −4."], ["−4 and −0.5 only", false, "Don't forget the factor s itself."]] },
        { t: "num", q: "(s + 3)(s + 6) expanded: the constant term?", a: 18, tol: 0, why: "3 × 6 = 18 (and the s term is 9s)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a root at s = −3 mean the polynomial has a factor (s + 3)?", model: "If the polynomial is zero at s = −3, then writing it as a product, one of the factors must be zero there. The factor that is zero at s = −3 is s + 3, so it must be one of the pieces." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Completing the square", mins: 20,
    blurb: "Rewrite s² + bs + c as (s + α)² + ω². Complex roots and damped sinusoids live in this form.",
    takeaway: "s² + bs + c = (s + b/2)² + (c − b²/4). Halve the s coefficient, square it, add and subtract. When c > b²/4 the second part is positive, call it ω²: (s + α)² + ω² with α = b/2 and ω = √(c − b²/4). Its roots are −α ± jω: a damped sinusoid e^(−αt) at frequency ω. Example: s² + 2s + 5 = (s + 1)² + 4: α = 1, ω = 2.",
    steps: [
      { k: "learn", title: "Halve, square, adjust", b: [
        `<div class="eq">s² + 6s + 25</div>`,
        `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr><tr><td>half of 6</td><td>3</td></tr><tr><td>(s + 3)² = s² + 6s + 9</td><td>that's 9 of the 25</td></tr><tr><td>leftover</td><td>25 − 9 = 16 = 4²</td></tr></table></div>`,
        `<div class="eq">s² + 6s + 25 = (s + 3)² + 4²</div>`,
        `<p class="aside">The roots: (s + 3)² = −16, so s = −3 ± j4.</p>`,
      ]},
      { k: "play", title: "Any b and c", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let b = 2, c = 5;
          function draw() {
            const a = b / 2, rest = c - a * a;
            ro.innerHTML = readout([["s² + bs + c", `s²${sg(b)}s${sg(c)}`], ["(s + b/2)² + (c − b²/4)", `(s${sg(a)})²${sg(rest)}`], rest > 0 ? ["α, ω", `α = ${fmt(a, 3)}, ω = √${fmt(rest, 3)} = ${fmt(Math.sqrt(rest), 4)}`] : ["Leftover ≤ 0", "real roots: factor it instead (Part 1)"], ["Roots", rest > 0 ? `${fmt(-a, 3)} ± j${fmt(Math.sqrt(rest), 4)}` : `${fmt(-a + Math.sqrt(-rest), 4)} and ${fmt(-a - Math.sqrt(-rest), 4)}`]]);
          }
          host.append(slider({ id: id + "-b", label: "b", min: 0, max: 10, step: 1, value: b }, (v) => { b = v; draw(); }).el, slider({ id: id + "-c", label: "c", min: 0, max: 40, step: 1, value: c }, (v) => { c = v; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "s² + 4s + 13 = ?", opts: [["(s + 2)² + 9", true, "Half of 4 is 2; 13 − 4 = 9."], ["(s + 4)² − 3", false, "Use half the s coefficient."], ["(s + 2)² + 13", false, "(s + 2)² already contains 4 of the 13."]] },
        { t: "num", q: "s² + 10s + 125 = (s + α)² + ω². ω = ?", a: 10, why: "α = 5; 125 − 25 = 100, so ω = 10." },
        { t: "num", q: "And its roots are −5 ± jω. What is the real part?", a: -5, why: "−α = −5." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe how to complete the square on s² + bs + c.", model: "Take half the coefficient of s, call it alpha. Then s squared plus b s equals s plus alpha all squared, minus alpha squared. So the whole thing is s plus alpha squared, plus c minus alpha squared." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Partial fractions: distinct roots", mins: 25,
    blurb: "Split one big fraction into a sum of simple ones. The cover-up trick gets each number in one line.",
    takeaway: "If the bottom has distinct roots: N(s)/[(s − p₁)(s − p₂)…] = A₁/(s − p₁) + A₂/(s − p₂) + … Cover-up: A₁ = [the fraction with (s − p₁) covered], evaluated at s = p₁. Example: (s + 3)/[(s + 1)(s + 2)] → A at s = −1: 2/1 = 2; B at s = −2: 1/(−1) = −1. Only for proper fractions (top degree < bottom degree): otherwise divide first.",
    steps: [
      { k: "learn", title: "The goal", b: [
        `<div class="eq">(s + 3) / ((s + 1)(s + 2)) = A/(s + 1) + B/(s + 2)</div>`,
        `<p>Why bother? Each simple piece A/(s + a) is something a Laplace table can turn straight back into a time function (Module 21).</p>`,
      ]},
      { k: "learn", title: "Cover-up", b: [
        `<p>To find A, multiply both sides by (s + 1) and set s = −1. The B term vanishes. In practice: cover the (s + 1) and plug in s = −1.</p>`,
        `<div class="two"><div class="tile"><h3>A (cover s + 1, s = −1)</h3><div class="eq">(−1 + 3)/(−1 + 2) = 2</div></div><div class="tile"><h3>B (cover s + 2, s = −2)</h3><div class="eq">(−2 + 3)/(−2 + 1) = −1</div></div></div>`,
        `<div class="eq">(s + 3)/((s + 1)(s + 2)) = 2/(s + 1) − 1/(s + 2)</div>`,
        `<p class="aside">Check at s = 0: left = 3/2; right = 2 − ½ = 3/2 ✓.</p>`,
      ]},
      { k: "play", title: "The pieces add up", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let z = -3, p1 = -1, p2 = -4;
          function draw() {
            if (Math.abs(p1 - p2) < 1e-9) { ro.innerHTML = readout([["Poles equal", "that's a repeated root: Part 4"]]); f.innerHTML = ""; return; }
            const A = (p1 - z) / (p1 - p2), B = (p2 - z) / (p2 - p1);
            const F = (s) => (s - z) / ((s - p1) * (s - p2));
            f.innerHTML = plot({ x: [0, 6], y: [-1, 2], xt: [0, 2, 4, 6], yt: [-1, 0, 1, 2], xl: "s (real, ≥ 0)", h: 210, series: [{ f: (s) => A / (s - p1), cls: "s4" }, { f: (s) => B / (s - p2), cls: "s5" }, { f: F, cls: "s1" }, { f: (s) => A / (s - p1) + B / (s - p2), cls: "s3" }], label: "The fraction (orange), its two pieces (dashed) and their sum (green, on top of orange)" });
            ro.innerHTML = readout([["F(s)", `${fac(z)} / [${fac(p1)}${fac(p2)}]`], ["A (cover-up at s = " + fmt(p1) + ")", fmt(A, 4)], ["B (cover-up at s = " + fmt(p2) + ")", fmt(B, 4)], ["So", `${fmt(A, 4)}/${fac(p1)} ${B < 0 ? "−" : "+"} ${fmt(Math.abs(B), 4)}/${fac(p2)}`]]);
          }
          host.append(f, slider({ id: id + "-z", label: "Zero (top root)", min: -6, max: 0, step: 0.5, value: z }, (v) => { z = v; draw(); }).el, slider({ id: id + "-a", label: "Pole p₁", min: -6, max: -0.5, step: 0.5, value: p1 }, (v) => { p1 = v; draw(); }).el, slider({ id: id + "-b", label: "Pole p₂", min: -6, max: -0.5, step: 0.5, value: p2 }, (v) => { p2 = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The green sum lies exactly on the orange fraction for every s: the split is exact, not an approximation.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "5/[(s + 1)(s + 6)] = A/(s + 1) + B/(s + 6). A = ?", a: 1, why: "Cover (s + 1), s = −1: 5/5 = 1." },
        { t: "num", q: "And B = ?", a: -1, why: "Cover (s + 6), s = −6: 5/(−5) = −1." },
        { t: "num", q: "(2s + 4)/[s(s + 4)]: the coefficient on 1/s?", a: 1, hint: "Cover s, set s = 0.", why: "4/4 = 1 (and on 1/(s + 4): (−4)/(−4) = 1)." },
        { t: "mcq", q: "(s² + 1)/[(s + 1)(s + 2)]: can you use cover-up straight away?", opts: [["No: the top's degree equals the bottom's. Divide first to get 1 + (proper fraction)", true, "(s² + 1) = (s² + 3s + 2) − (3s + 1), so it's 1 − (3s + 1)/[(s + 1)(s + 2)]."], ["Yes", false, "Cover-up needs the top degree to be lower."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the cover-up method give the coefficient A for the factor (s − p)?", model: "Multiplying the whole equation by (s − p) leaves A on its own on the right, with every other term still multiplied by (s − p). Setting s equal to p makes those other terms zero, so A equals the rest of the fraction evaluated at p." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Repeated and complex roots", mins: 25,
    blurb: "A doubled root needs two terms. A complex pair stays together as one quadratic piece.",
    takeaway: "Repeated root (s − p)²: include A/(s − p) + B/(s − p)². B by cover-up (cover the whole square); A by plugging in another s value (or B′ via a derivative). Complex pair: keep (s + α)² + ω² intact and write its piece as (Cs + D)/((s + α)² + ω²), then rewrite the top as C(s + α) + E·ω so each part matches a table entry. Find unknowns by comparing coefficients or plugging in easy s values.",
    steps: [
      { k: "math", title: "Repeated: 1/[(s + 1)²(s + 2)]", b: [
        `<div class="eq">1/((s + 1)²(s + 2)) = A/(s + 1) + B/(s + 1)² + C/(s + 2)</div>`,
        { t: "reveal", label: "B: cover (s + 1)², s = −1", html: `<div class="eq">B = 1/(−1 + 2) = 1</div>` },
        { t: "reveal", label: "C: cover (s + 2), s = −2", html: `<div class="eq">C = 1/(−2 + 1)² = 1</div>` },
        { t: "reveal", label: "A: plug in s = 0", html: `<div class="eq">1/2 = A + 1 + 1/2  →  A = −1</div><p class="aside">Any s that isn't a root works. 0 is usually easiest.</p>` },
      ]},
      { k: "math", title: "Complex: (s + 3)/(s² + 2s + 5)", b: [
        `<p>Bottom: (s + 1)² + 2² (Part 2). Rewrite the top in terms of (s + 1) and the 2:</p>`,
        { t: "reveal", label: "Split the top", html: `<div class="eq">s + 3 = (s + 1) + 2</div>` },
        { t: "reveal", label: "Two table-ready pieces", html: `<div class="eq">(s + 1)/((s + 1)² + 2²) + 2/((s + 1)² + 2²)</div><p class="aside">In Module 21 these become e<sup>−t</sup>cos 2t + e<sup>−t</sup>sin 2t.</p>` },
      ]},
      { k: "math", title: "Mixed: 5/[s(s² + 2s + 5)]", b: [
        `<div class="eq">5/(s(s² + 2s + 5)) = A/s + (Cs + D)/(s² + 2s + 5)</div>`,
        { t: "reveal", label: "A by cover-up at s = 0", html: `<div class="eq">A = 5/5 = 1</div>` },
        { t: "reveal", label: "Compare the tops", html: `<div class="eq">5 = 1·(s² + 2s + 5) + (Cs + D)s = (1 + C)s² + (2 + D)s + 5</div><p>So C = −1, D = −2.</p>` },
        { t: "reveal", label: "Table-ready", html: `<div class="eq">1/s − (s + 2)/((s + 1)² + 4) = 1/s − (s + 1)/((s + 1)² + 4) − ½·2/((s + 1)² + 4)</div>` },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "2/[s²(s + 2)] = A/s + B/s² + C/(s + 2). B = ?", a: 1, hint: "Cover s², set s = 0.", why: "2/2 = 1." },
        { t: "num", q: "C = ?", a: 0.5, why: "Cover (s + 2), s = −2: 2/4 = 0.5." },
        { t: "num", q: "A = ? (plug in s = −1 or compare s² terms)", a: -0.5, hint: "s = −1: 2/1 = −A + B + C = −A + 1 + 0.5.", why: "A = −0.5. (Check s² terms: A + C = 0 ✓.)" },
        { t: "mcq", q: "Rewrite (2s + 7)/((s + 2)² + 9) as table-ready pieces.", opts: [["2(s + 2)/((s + 2)² + 3²) + 1·3/((s + 2)² + 3²)", true, "2s + 7 = 2(s + 2) + 3."], ["2s/((s + 2)² + 9) + 7/((s + 2)² + 9)", false, "The s on top must be shifted to (s + 2) to match the table."], ["It must be factored into real roots first", false, "The roots are complex; keep the quadratic."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a repeated root need two terms in a partial fraction expansion?", model: "With only A over (s − p), adding the pieces could never produce a squared factor in the denominator. You need both A over (s − p) and B over (s − p) squared so the combined fraction can match the double root." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m18", eyebrow: "Math Toolkit · Module 18", title: "Polynomials and Partial Fractions",
    intro: `<p>Four parts: roots and factors, completing the square, partial fractions with distinct roots, then repeated and complex roots. This is the algebra the inverse Laplace transform (Module 21) runs on. Quadratics (<a href="07-quadratics.html">Module 7</a>) first.</p>`,
    after: `<p>Partial fractions take practice. Redo the worked examples on paper without looking, then check every split by plugging in s = 0.</p>`,
    parts: [p1, p2, p3, p4],
    summary: `
      <p>Root r ⟺ factor (s − r). s² + bs + c: b = −(r₁ + r₂), c = r₁r₂.</p>
      <div class="eq">s² + bs + c = (s + b/2)² + (c − b²/4) = (s + α)² + ω²  → roots −α ± jω</div>
      <p>Distinct: N/[(s − p₁)(s − p₂)] = A₁/(s − p₁) + A₂/(s − p₂); cover-up: Aᵢ = rest of the fraction at s = pᵢ. Top degree ≥ bottom: divide first.</p>
      <p>Repeated (s − p)²: A/(s − p) + B/(s − p)²; B by cover-up, A by plugging in another s. Complex pair: (Cs + D)/((s + α)² + ω²), top rewritten as C(s + α) + Eω.</p>
      <p>Check any split at s = 0.</p>`,
  };
  Course.start(window.CHAPTER);
})();
