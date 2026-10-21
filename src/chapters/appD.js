(function () {
  const { plot, slider, readout, fmt, el } = Course;

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Two equations, two unknowns", mins: 20,
    blurb: "A formula you can apply in one line, and what det = 0 means.",
    takeaway: "For M₁₁x₁ + M₁₂x₂ = y₁ and M₂₁x₁ + M₂₂x₂ = y₂: Δ = M₁₁M₂₂ − M₁₂M₂₁; x₁ = (M₂₂y₁ − M₁₂y₂)/Δ, x₂ = (M₁₁y₂ − M₂₁y₁)/Δ. Swap the diagonal, negate the off-diagonal, divide by Δ. Each equation is a line; the answer is where they cross. Δ = 0 means parallel lines: no unique answer.",
    steps: [
      { k: "learn", title: "Where they come from", b: [
        `<p>The node method (Chapter 3) gives one equation per unknown node voltage. Two nodes:</p>`,
        `<div class="eq">M₁₁x₁ + M₁₂x₂ = y₁<br>M₂₁x₁ + M₂₂x₂ = y₂</div>`,
        `<p>In matrix form, <b>Mx = y</b>: M holds the conductances, x the unknowns, y the sources.</p>`,
      ]},
      { k: "learn", title: "The 2 × 2 recipe", b: [
        `<div class="key">Δ = M₁₁M₂₂ − M₁₂M₂₁</div>`,
        `<div class="eq">x₁ = (M₂₂y₁ − M₁₂y₂)/Δ      x₂ = (M₁₁y₂ − M₂₁y₁)/Δ</div>`,
        `<p>Memory trick: <b>swap</b> the two diagonal entries, <b>negate</b> the other two, multiply by y, divide by Δ.</p>`,
      ]},
      { k: "play", title: "Two lines crossing", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let m11 = 2, m12 = 1, m21 = 1, m22 = 3;
          const y1 = 5, y2 = 10;
          function draw() {
            const D = m11 * m22 - m12 * m21, ok = Math.abs(D) > 1e-9, x1 = (m22 * y1 - m12 * y2) / D, x2 = (m11 * y2 - m21 * y1) / D;
            const line = (a, b, y) => (Math.abs(b) > 1e-9 ? { f: (x) => (y - a * x) / b } : { pts: [[y / a, -10], [y / a, 10]] });
            f.innerHTML = plot({ x: [-6, 6], y: [-6, 6], xt: [-6, -3, 0, 3, 6], yt: [-6, -3, 0, 3, 6], xl: "x₁", yl: "x₂", series: [Object.assign(line(m11, m12, y1), { cls: "s2" }), Object.assign(line(m21, m22, y2), { cls: "s3" })], marks: ok ? [{ x: x1, y: x2 }] : [], label: "Each equation as a line; the solution is the crossing" });
            ro.innerHTML = readout([["equation 1 (blue)", `${fmt(m11)}x₁ + ${fmt(m12)}x₂ = ${y1}`], ["equation 2 (green)", `${fmt(m21)}x₁ + ${fmt(m22)}x₂ = ${y2}`], ["Δ", fmt(D, 3)], ["solution", ok ? `x₁ = ${fmt(x1, 3)}, x₂ = ${fmt(x2, 3)}` : "none unique: lines are parallel"]]);
          }
          const mk = (k, lab, v, set) => slider({ id: id + k, label: lab, min: -3, max: 3, step: 0.5, value: v, show: (x) => fmt(x) }, (x) => { set(x); draw(); }).el;
          host.append(f, mk("a", "M₁₁", m11, (x) => (m11 = x)), mk("b", "M₁₂", m12, (x) => (m12 = x)), mk("c", "M₂₁", m21, (x) => (m21 = x)), mk("d", "M₂₂", m22, (x) => (m22 = x)), ro);
          draw();
        },
        `<p class="aside">y₁ = 5, y₂ = 10. Make the rows proportional (try M₁₁ = 1, M₁₂ = 3, M₂₁ = 1, M₂₂ = 3) and Δ hits 0: parallel lines, no crossing.</p>`,
      ]},
      { k: "check", title: "A circuit example", b: [
        `<p>Node equations (conductances in mS, currents in mA, voltages in V):</p>`,
        `<div class="eq">3e₁ − 1e₂ = 4<br>−1e₁ + 2e₂ = 3</div>`,
        { t: "num", q: "Δ = ?", a: 5, why: "3 × 2 − (−1)(−1) = 6 − 1 = 5." },
        { t: "num", q: "e₁ = ?", a: 2.2, unit: "V", why: "(2 × 4 − (−1) × 3)/5 = (8 + 3)/5 = 2.2 V." },
        { t: "num", q: "e₂ = ?", a: 2.6, unit: "V", why: "(3 × 3 − (−1) × 4)/5 = (9 + 4)/5 = 2.6 V. Check: 3(2.2) − 2.6 = 4 ✓." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does it mean geometrically when Δ = 0?", model: "Each equation is a straight line in the (x₁, x₂) plane and the solution is where they cross. Δ = 0 means the lines have the same slope: parallel, so they either never cross (no solution) or lie on top of each other (endless solutions). Either way there's no unique answer." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Three or more: Cramer's rule", mins: 20,
    blurb: "Replace a column, take a determinant, divide.",
    takeaway: "Cramer's rule: x_n = det(B_n)/det(M), where B_n is M with column n replaced by y. 3 × 3 determinant: M₁₁M₂₂M₃₃ + M₁₂M₂₃M₃₁ + M₁₃M₂₁M₃₂ − M₃₁M₂₂M₁₃ − M₃₂M₂₃M₁₁ − M₃₃M₂₁M₁₂. Beyond 3 × 3, elimination (or a computer) is usually less work.",
    steps: [
      { k: "learn", title: "Cramer's rule", b: [
        `<div class="key">x<sub>n</sub> = det(B<sub>n</sub>) / det(M)</div>`,
        `<p>B<sub>n</sub> = M with its n-th column replaced by y. For 2 × 2 this gives exactly Part 1's formulas.</p>`,
        `<p>The 3 × 3 determinant: three "downhill" diagonal products minus three "uphill" ones.</p>`,
        `<div class="eq">det M = M₁₁M₂₂M₃₃ + M₁₂M₂₃M₃₁ + M₁₃M₂₁M₃₂ − M₃₁M₂₂M₁₃ − M₃₂M₂₃M₁₁ − M₃₃M₂₁M₁₂</div>`,
      ]},
      { k: "math", title: "Worked example", b: [
        `<div class="eq">2x₁ + x₂ + 0x₃ = 3<br>x₁ + 3x₂ + x₃ = 5<br>0x₁ + x₂ + 2x₃ = 3</div>`,
        { t: "reveal", label: "det M", html: `<div class="eq">2·3·2 + 1·1·0 + 0·1·1 − 0·3·0 − 1·1·2 − 2·1·1 = 12 − 2 − 2 = 8</div>` },
        { t: "reveal", label: "x₁: replace column 1 by y", html: `<div class="eq">B₁ = [3 1 0; 5 3 1; 3 1 2]: 18 + 3 + 0 − 0 − 3 − 10 = 8   →   x₁ = 8/8 = 1</div>` },
        `<p class="aside">Your turn for x₂ and x₃ below.</p>`,
      ]},
      { k: "check", title: "Finish it", b: [
        { t: "num", q: "x₂ = det(B₂)/8. x₂ = ?", a: 1, hint: "B₂ = [2 3 0; 1 5 1; 0 3 2]. Or substitute x₁ = 1 into the equations.", why: "det B₂ = 20 + 0 + 0 − 0 − 6 − 6 = 8, so x₂ = 1." },
        { t: "num", q: "x₃ = ?", a: 1, why: "From equation 3: x₂ + 2x₃ = 3 → x₃ = 1. Always check by substituting back." },
        { t: "mcq", q: "Five node voltages to find. Best plan?", opts: [["Eliminate step by step, or use a computer; Cramer by hand is a lot of algebra", true, "A 5 × 5 determinant by hand is error-prone. Use Cramer for 2 × 2 and 3 × 3, especially when you want a symbolic answer."], ["Cramer's rule by hand", false, "It works, but it's six 5 × 5 determinants."], ["It can't be solved", false, "It can, if det M ≠ 0."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe Cramer's rule in words.", model: "To find the n-th unknown, replace the n-th column of the coefficient matrix with the right-hand side, take that matrix's determinant, and divide by the determinant of the original matrix. It only works when that original determinant isn't zero." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "appD", eyebrow: "Appendix D", title: "Solving Simultaneous Linear Equations",
    intro: `<p>Two short parts: a one-line formula for 2 × 2 systems, and Cramer's rule for 3 × 3. Exactly what the node method in Chapter 3 produces.</p><p class="aside">Back to <a href="03-network-theorems.html">Chapter 3</a>. Arrow keys ← → move between steps.</p>`,
    after: `<p>Appendices have no problems of their own. Use these whenever a node or mesh analysis leaves you with two or three equations.</p>`,
    parts: [p1, p2],
    summary: `
      <h3>2 × 2</h3>
      <div class="eq">Δ = M₁₁M₂₂ − M₁₂M₂₁     x₁ = (M₂₂y₁ − M₁₂y₂)/Δ     x₂ = (M₁₁y₂ − M₂₁y₁)/Δ</div>
      <p>Δ = 0: parallel lines, no unique answer.</p>
      <h3>3 × 3 determinant</h3>
      <div class="eq">M₁₁M₂₂M₃₃ + M₁₂M₂₃M₃₁ + M₁₃M₂₁M₃₂ − M₃₁M₂₂M₁₃ − M₃₂M₂₃M₁₁ − M₃₃M₂₁M₁₂</div>
      <h3>Cramer's rule</h3>
      <p>x<sub>n</sub> = det(B<sub>n</sub>)/det(M), B<sub>n</sub> = M with column n replaced by y. Larger systems: elimination or a computer.</p>`,
  };
  Course.start(window.CHAPTER);
})();
