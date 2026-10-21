(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const ohm = (r) => si(r, "Ω", 3);

  const p1 = {
    id: "p1", title: "When ≫ lets you drop a term", mins: 15,
    blurb: "a + b ≈ a when a is much bigger. How much bigger is 'much'?",
    takeaway: "If a ≫ b then a + b ≈ a, and the error is b/(a + b). Ratio 10:1 → about 9% error; 100:1 → about 1%. In parallel the opposite: big ∥ small ≈ small, same error sizes. Engineers usually accept 10:1. Examples: β + 1 ≈ β (β = 100: 1% error); R_B ∥ r_π ≈ r_π when R_B ≥ 10r_π; Boylestad's βR_E ≥ 10R_2 test for the approximate divider-bias method.",
    steps: [
      { k: "learn", title: "Drop the small one", b: [
        `<div class="eq">a + b ≈ a   when a ≫ b</div>`,
        `<p>The error you make is the fraction you threw away:</p>`,
        `<div class="eq">error = b / (a + b)</div>`,
        `<p class="aside">"≫" means "much greater than". In practice: at least 10 times.</p>`,
      ]},
      { k: "play", title: "How much is 'much'?", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let k = 10;
          function draw() {
            const err = 1 / (k + 1);
            f.innerHTML = plot({ x: [0, 3], y: [0, 50], xt: [0, 1, 2, 3], xtf: (v) => ["1:1", "10:1", "100:1", "1000:1"][v], yt: [0, 10, 25, 50], ytf: (v) => v + "%", xl: "ratio a:b", yl: "error", h: 220, series: [{ f: (x) => 100 / (Math.pow(10, x) + 1), cls: "s1" }], marks: [{ x: Math.log10(k), y: 100 * err }], label: "Error from dropping b, against the ratio a to b" });
            ro.innerHTML = readout([["a + b with b = 1", fmt(k + 1, 4)], ["Approximation a", fmt(k, 4)], ["Error b/(a + b)", fmt(100 * err, 3) + "%"], ["Same error for: big ∥ small ≈ small", fmt(100 * err, 3) + "%"]]);
          }
          host.append(f, slider({ id: id + "-k", label: "a is this many times b", min: 1, max: 1000, log: true, value: k, show: (v) => fmt(v, 3) + "×" }, (v) => { k = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Resistors themselves are often ±5%. Approximating at 10:1 or better hardly makes things worse.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "β = 120. Using β instead of β + 1: percent error?", a: 0.826, unit: "%", tol: 0.03, hint: "1/(β + 1).", why: "1/121 = 0.83%. That's why the books swap freely between I_E and I_C." },
        { t: "mcq", q: "R_B = 470 kΩ in parallel with r_π = 1.5 kΩ. Good approximation?", opts: [["1.5 kΩ: the big one hardly matters (0.3% error)", true, "Ratio 313:1."], ["470 kΩ", false, "In parallel the small one wins."], ["Can't approximate: compute exactly", false, "You can, but the approximation is within 0.3%."]] },
        { t: "mcq", q: "Divider bias: β = 80, R_E = 1.2 kΩ, R_2 = 15 kΩ. Is βR_E ≥ 10R_2?", opts: [["No: 96 kΩ < 150 kΩ, so use the exact method", true, "βR_E is only about 6× R_2."], ["Yes", false, "Compute both: 80 × 1.2 = 96 kΩ; 10 × 15 = 150 kΩ."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does it cost to treat a + b as just a when a is ten times b?", model: "The error is the part thrown away divided by the whole: one part in eleven, or about nine percent. At a hundred to one it's about one percent." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Small-x shortcuts", mins: 15,
    blurb: "When x is small, 1/(1 + x) ≈ 1 − x and (1 + x)ⁿ ≈ 1 + nx.",
    takeaway: "For |x| ≪ 1: (1 + x)ⁿ ≈ 1 + nx; 1/(1 + x) ≈ 1 − x; √(1 + x) ≈ 1 + x/2. The error is about the square of x (x = 0.05 → error ≈ 0.25%). Use them to see how a small change in one value (temperature, tolerance) moves the result.",
    steps: [
      { k: "learn", title: "Expand and drop x²", b: [
        `<div class="eq">(1 + x)² = 1 + 2x + x² ≈ 1 + 2x</div>`,
        `<p>If x = 0.03, x² = 0.0009, which is tiny next to 2x = 0.06. The general rule:</p>`,
        `<div class="two"><div class="tile"><div class="eq">(1 + x)<sup>n</sup> ≈ 1 + nx</div></div><div class="tile"><div class="eq">1/(1 + x) ≈ 1 − x</div></div></div>`,
        `<p class="aside">1/(1 + x) is (1 + x)⁻¹, so n = −1. √(1 + x) is n = ½: 1 + x/2.</p>`,
      ]},
      { k: "play", title: "Where it breaks", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let x = 0.1;
          function draw() {
            f.innerHTML = plot({ x: [-0.5, 0.5], y: [0.5, 2], xt: [-0.5, -0.25, 0, 0.25, 0.5], yt: [0.5, 1, 1.5, 2], xl: "x", h: 230, series: [{ f: (t) => 1 / (1 + t), cls: "s1" }, { f: (t) => 1 - t, cls: "s4" }], marks: [{ x, y: 1 / (1 + x) }], label: "1/(1+x) (solid) and the straight line 1 − x (dashed)" });
            const ex = 1 / (1 + x), ap = 1 - x;
            ro.innerHTML = readout([["Exact 1/(1 + x)", fmt(ex, 5)], ["Approx 1 − x", fmt(ap, 5)], ["Error", fmt((100 * Math.abs(ap - ex)) / ex, 3) + "%"]]);
          }
          host.append(f, slider({ id: id + "-x", label: "x", min: -0.4, max: 0.4, step: 0.01, value: x }, (v) => { x = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Close to x = 0 the line hugs the curve. Module 13 shows why: the line is the curve's tangent there.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "In your head: 1/1.04 ≈ ?", a: 0.96, tol: 0.003, why: "≈ 0.96 (exact 0.9615)." },
        { t: "num", q: "A current goes as (1 + x)² and x rises by 0.02. Roughly what percent does the current rise?", a: 4, unit: "%", tol: 0.05, hint: "1 + 2x.", why: "About 4% (exact 4.04%)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is (1 + x)² ≈ 1 + 2x good for small x but bad for x = 0.5?", model: "The exact answer is 1 plus 2x plus x squared, and the approximation drops the x squared. For small x that square is tiny, but at x equals 0.5 it's 0.25, which is a big chunk of the answer." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Feedback: when the 1 disappears", mins: 15,
    blurb: "A/(1 + βA) becomes 1/β once βA is large. The same move gives the ideal op-amp results.",
    takeaway: "Closed-loop gain A_f = A/(1 + βA). When βA ≫ 1, the 1 is negligible: A_f ≈ A/(βA) = 1/β, which doesn't depend on A at all. The fractional error is about 1/(βA). With A = 10⁵ and β = 0.01, A_f = 99.9 (0.1% below 100). This is why op-amp circuit gains are set by resistor ratios.",
    steps: [
      { k: "learn", title: "The limit", b: [
        `<div class="eq">A<sub>f</sub> = A / (1 + βA)</div>`,
        `<p>Divide top and bottom by βA:</p>`,
        `<div class="eq">A<sub>f</sub> = (1/β) × 1/(1 + 1/(βA)) ≈ (1/β)(1 − 1/(βA))</div>`,
        `<p class="aside">That's Part 1 and Part 2 combined: drop the small 1 in the denominator, and the small-x shortcut gives the error.</p>`,
      ]},
      { k: "play", title: "Raise the open-loop gain", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let A = 1000, beta = 0.01;
          function draw() {
            const Af = A / (1 + beta * A);
            f.innerHTML = plot({ x: [1, 7], y: [0, 1.1 / beta], xt: [1, 2, 3, 4, 5, 6, 7], xtf: (v) => "10" + "⁰¹²³⁴⁵⁶⁷"[v], yt: [0, 0.5 / beta, 1 / beta], xl: "A", yl: "A_f", h: 220, series: [{ f: (x) => Math.pow(10, x) / (1 + beta * Math.pow(10, x)), cls: "s1" }, { f: () => 1 / beta, cls: "s5" }], marks: [{ x: Math.log10(A), y: Af }], label: "Closed-loop gain against open-loop gain, approaching 1 over beta" });
            ro.innerHTML = readout([["βA", fmt(beta * A, 3)], ["A_f exact", fmt(Af, 5)], ["1/β", fmt(1 / beta, 4)], ["Below 1/β by", fmt((100 * (1 / beta - Af)) * beta, 3) + "%"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "Open-loop gain A", min: 10, max: 1e7, log: true, value: A, show: (v) => fmt(v, 3) }, (v) => { A = v; draw(); }).el,
            slider({ id: id + "-b", label: "Feedback fraction β", min: 0.001, max: 0.5, log: true, value: beta, show: (v) => fmt(v, 3) }, (v) => { beta = v; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A = 200 000, β = 0.05. A_f to 4 significant figures?", a: 19.998, tol: 0.0001, hint: "A/(1 + βA) = 200 000/10 001.", why: "19.998: within 0.01% of 1/β = 20." },
        { t: "mcq", q: "The op amp's A drops by half as it warms up (still 10⁵). What happens to A_f ≈ 1/β?", opts: [["Almost nothing: the error goes from 1/(βA) to 2/(βA), still tiny", true, "That's the point of feedback: the gain is set by β, which is set by resistors."], ["It halves", false, "Only if βA were small."], ["It doubles", false, "Lower A can't raise A_f."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a feedback amplifier's gain become nearly independent of the amplifier's own gain?", model: "The closed-loop gain is A over one plus beta A. When beta A is much bigger than one, the one can be dropped and the A's cancel, leaving one over beta. Beta is set by resistors, so the amplifier's own gain only affects a tiny error of about one over beta A." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m4", eyebrow: "Math Toolkit · Module 4", title: "Approximations",
    intro: `<p>Three parts: dropping small terms, small-x shortcuts, and the feedback limit. Both books approximate constantly. This module shows you when it's fair and what it costs, so you can judge each "≈" yourself.</p>`,
    after: `<p>Each time a book writes "≈", ask: what was dropped, and how big was it compared with what was kept?</p>`,
    parts: [p1, p2, p3],
    summary: `
      <div class="eq">a + b ≈ a (a ≫ b), error b/(a + b)     10:1 → 9%     100:1 → 1%</div>
      <p>Parallel: big ∥ small ≈ small, same error. β + 1 ≈ β. Boylestad divider bias: approximate if βR<sub>E</sub> ≥ 10R<sub>2</sub>.</p>
      <div class="eq">(1 + x)<sup>n</sup> ≈ 1 + nx     1/(1 + x) ≈ 1 − x     √(1 + x) ≈ 1 + x/2     error ~ x²</div>
      <div class="eq">A<sub>f</sub> = A/(1 + βA) ≈ 1/β when βA ≫ 1, error ≈ 1/(βA)</div>`,
  };
  Course.start(window.CHAPTER);
})();
