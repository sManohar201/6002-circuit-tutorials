(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const ohm = (r) => si(r, "Ω", 3);
  const roots = (a, b, c) => { const d = b * b - 4 * a * c; if (d < 0) return { d, r: [] }; const s = Math.sqrt(d); return { d, r: d === 0 ? [-b / (2 * a)] : [(-b - s) / (2 * a), (-b + s) / (2 * a)] }; };

  const p1 = {
    id: "p1", title: "Expanding a square", mins: 15,
    blurb: "(a − b)² = a² − 2ab + b². A picture of a square shows where the middle term comes from.",
    takeaway: "(a + b)² = a² + 2ab + b² and (a − b)² = a² − 2ab + b². The 2ab is the two rectangles in the square picture: forgetting it is the most common slip. Device laws are squares: Boylestad's JFET I_D = I_DSS(1 − V_GS/V_P)² expands to I_DSS(1 − 2V_GS/V_P + V_GS²/V_P²).",
    steps: [
      { k: "play", title: "The square picture", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 3, b = 1.5;
          function draw() {
            const k = 220 / (a + b), A = a * k, B = b * k, x0 = 150, y0 = 10;
            let s = `<rect x="${x0}" y="${y0}" width="${A}" height="${A}" style="fill:var(--accent);opacity:.35"/>` +
              `<rect x="${x0 + A}" y="${y0}" width="${B}" height="${A}" style="fill:var(--cool);opacity:.35"/>` +
              `<rect x="${x0}" y="${y0 + A}" width="${A}" height="${B}" style="fill:var(--cool);opacity:.35"/>` +
              `<rect x="${x0 + A}" y="${y0 + A}" width="${B}" height="${B}" style="fill:var(--good);opacity:.4"/>` +
              `<rect class="box" x="${x0}" y="${y0}" width="${A + B}" height="${A + B}" style="fill:none"/>`;
            s += S.t(x0 + A / 2, y0 + A / 2 + 5, "a²", { cls: "lab" }) + S.t(x0 + A + B / 2, y0 + A / 2 + 5, "ab", { cls: "lab" }) + S.t(x0 + A / 2, y0 + A + B / 2 + 5, "ab", { cls: "lab" }) + (B > 26 ? S.t(x0 + A + B / 2, y0 + A + B / 2 + 5, "b²", { cls: "lab" }) : "");
            s += S.t(x0 - 10, y0 + A / 2, "a", { a: "end" }) + S.t(x0 - 10, y0 + A + B / 2 + 5, "b", { a: "end" });
            f.innerHTML = S.svg(520, 245, s, { label: "Square of side a plus b split into four pieces" });
            ro.innerHTML = readout([["(a + b)²", fmt((a + b) ** 2, 4)], ["a² + 2ab + b²", `${fmt(a * a, 4)} + ${fmt(2 * a * b, 4)} + ${fmt(b * b, 4)} = ${fmt(a * a + 2 * a * b + b * b, 4)}`], ["a² + b² (the slip)", fmt(a * a + b * b, 4) + "  ✗"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "a", min: 1, max: 5, step: 0.5, value: a }, (v) => { a = v; draw(); }).el, slider({ id: id + "-b", label: "b", min: 0.5, max: 5, step: 0.5, value: b }, (v) => { b = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The two blue rectangles are the 2ab. For (a − b)² the same pieces appear with a minus sign on the 2ab.</p>`,
      ]},
      { k: "learn", title: "A device law", b: [
        `<p>Boylestad's JFET law, written with x = V<sub>GS</sub>/V<sub>P</sub>:</p>`,
        `<div class="eq">I<sub>D</sub> = I<sub>DSS</sub>(1 − x)² = I<sub>DSS</sub>(1 − 2x + x²)</div>`,
        `<p class="aside">You'll expand like this when a second equation (like a bias line) has to be substituted in. That's Part 3.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "(V − 2)² = ?", opts: [["V² − 4V + 4", true, "a = V, b = 2: V² − 2·2·V + 4."], ["V² − 4", false, "Missing the middle term (and the sign of the last)."], ["V² + 4", false, "Missing −2ab = −4V."]] },
        { t: "num", q: "I_DSS = 10 mA, V_P = −5 V, V_GS = −2 V. I_D = I_DSS(1 − V_GS/V_P)² = ?", a: 3.6, unit: "mA", hint: "V_GS/V_P = 0.4.", why: "10 × 0.6² = 3.6 mA." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Where does the 2ab in (a + b)² come from?", model: "Picture a square with side a plus b. It splits into an a-by-a square, a b-by-b square, and two a-by-b rectangles. Those two rectangles are the 2ab, which is easy to forget if you only square each part." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "The quadratic formula", mins: 20,
    blurb: "Any ax² + bx + c = 0 is solved by one formula. The part under the root tells you how many answers.",
    takeaway: "ax² + bx + c = 0 → x = [−b ± √(b² − 4ac)]/(2a). Discriminant D = b² − 4ac: D > 0 → two real roots (the parabola crosses the axis twice), D = 0 → one, D < 0 → none real (complex roots, which in 6.002 Chapter 12 means ringing). Get the equation into the = 0 form first, and keep track of signs.",
    steps: [
      { k: "learn", title: "The formula", b: [
        `<div class="eq">ax² + bx + c = 0   →   x = (−b ± √(b² − 4ac)) / 2a</div>`,
        `<p>Steps: move everything to one side so it equals 0; read off a, b and c <b>with their signs</b>; compute D = b² − 4ac; then the two roots.</p>`,
      ]},
      { k: "play", title: "Shape the parabola", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 1, b = -5, c = 6;
          function draw() {
            const R = roots(a, b, c);
            f.innerHTML = plot({ x: [-6, 8], y: [-8, 12], xt: [-6, -4, -2, 0, 2, 4, 6, 8], yt: [-8, -4, 0, 4, 8, 12], xl: "x", yl: "ax²+bx+c", h: 260, series: [{ f: (x) => a * x * x + b * x + c, cls: "s1" }], marks: R.r.map((x) => ({ x, y: 0 })), label: "Parabola with its roots marked where it crosses zero" });
            ro.innerHTML = readout([["D = b² − 4ac", fmt(R.d, 4)], ["Roots", R.r.length ? R.r.map((x) => fmt(x, 4)).join(" and ") : "none real (D < 0)"]]);
          }
          const mk = (k, lab, v, set, lo, hi) => slider({ id: id + k, label: lab, min: lo, max: hi, step: 0.5, value: v }, (x) => { set(x); draw(); }).el;
          host.append(f, mk("a", "a", a, (x) => (a = x || 0.5), -3, 3), mk("b", "b", b, (x) => (b = x), -8, 8), mk("c", "c", c, (x) => (c = x), -8, 10), ro);
          draw();
        },
        `<p class="aside">Lift the parabola with c until it no longer touches the axis: D goes negative and the real roots vanish.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "2x² − 7x + 3 = 0. The larger root?", a: 3, hint: "D = 49 − 24 = 25.", why: "(7 + 5)/4 = 3 (the other is 0.5)." },
        { t: "num", q: "x² + 4x + 13 = 0. D = ?", a: -36, why: "16 − 52 = −36: no real roots. The roots are −2 ± j3 (complex numbers: 6.002 Appendix C)." },
        { t: "mcq", q: "Before using the formula on 3x² = 5x − 1, you rewrite it as…", opts: [["3x² − 5x + 1 = 0, so a = 3, b = −5, c = 1", true, "Everything on one side first."], ["a = 3, b = 5, c = −1", false, "Those are the signs before moving terms across."], ["a = 3, b = 5, c = 1", false, "Moving a term to the other side flips its sign."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does the sign of b² − 4ac tell you, in terms of the graph?", model: "It tells you how many times the parabola crosses zero. Positive means it crosses twice, two real roots; zero means it just touches, one root; negative means it never reaches the axis, so there are no real roots, only complex ones." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Choose the root that makes sense", mins: 20,
    blurb: "Device problems give two roots. Only one is on the part of the curve the law describes.",
    takeaway: "Substituting a straight bias line into a square law gives a quadratic with two roots, but the law holds only on one branch. JFET: reject the root with |V_GS| > |V_P| (beyond pinch-off). MOSFET: reject the root with V_GS < V_T. Always put each root back into both original equations and check the physical limits.",
    steps: [
      { k: "learn", title: "Self-bias, with numbers", b: [
        `<p>JFET with I<sub>DSS</sub> = 8 mA, V<sub>P</sub> = −4 V, R<sub>S</sub> = 1 kΩ. The bias line is V<sub>GS</sub> = −I<sub>D</sub>R<sub>S</sub> (I<sub>D</sub> in mA → volts).</p>`,
        `<div class="eq">I<sub>D</sub> = 8(1 − I<sub>D</sub>/4)²</div>`,
        { t: "reveal", label: "Expand and tidy", html: `<div class="eq">I<sub>D</sub> = 8 − 4I<sub>D</sub> + 0.5I<sub>D</sub>²  →  0.5I<sub>D</sub>² − 5I<sub>D</sub> + 8 = 0  →  I<sub>D</sub>² − 10I<sub>D</sub> + 16 = 0</div>` },
        { t: "reveal", label: "Roots", html: `<div class="eq">I<sub>D</sub> = (10 ± √(100 − 64))/2 = (10 ± 6)/2 = 8 mA or 2 mA</div>` },
      ]},
      { k: "play", title: "See both crossings", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let Rs = 1;
          function draw() {
            /* I = 8(1 − I·Rs/4)² → 0.5Rs²I² − (4Rs + 1)I + 8 = 0 */
            const q = roots(0.5 * Rs * Rs, -(4 * Rs + 1), 8).r;
            f.innerHTML = plot({ x: [-10, 0], y: [0, 12], xt: [-10, -8, -6, -4, -2, 0], yt: [0, 4, 8, 12], xl: "V_GS (V)", yl: "I_D (mA)", h: 260, series: [{ f: (v) => 8 * (1 - v / -4) ** 2, from: -4, to: 0, cls: "s2" }, { f: (v) => 8 * (1 - v / -4) ** 2, from: -10, to: -4, cls: "s5" }, { f: (v) => -v / Rs, cls: "s1" }], marks: q.map((i) => ({ x: -i * Rs, y: i, cls: -i * Rs < -4 ? "mkb" : "mk" })), label: "JFET transfer curve, its false branch dashed, and the self-bias line" });
            ro.innerHTML = readout(q.map((i) => [`I_D = ${fmt(i, 4)} mA → V_GS = ${fmt(-i * Rs, 4)} V`, -i * Rs < -4 ? "beyond pinch-off: reject" : "valid"]));
          }
          host.append(f, slider({ id: id + "-r", label: "R_S", min: 0.3, max: 3, step: 0.1, value: Rs, show: (v) => fmt(v) + " kΩ" }, (v) => { Rs = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The dashed curve is the formula carried past V<sub>P</sub>, where a real JFET is just off (I<sub>D</sub> = 0). The algebra doesn't know that, so it hands you the red root anyway.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "In the worked example, which root is the real operating point?", opts: [["I_D = 2 mA, V_GS = −2 V", true, "|−2| < |−4|: inside the curve."], ["I_D = 8 mA, V_GS = −8 V", false, "−8 V is past pinch-off (−4 V); there I_D would actually be 0."]] },
        { t: "num", q: "MOSFET: I_D = 0.5(V_GS − 2)² mA and the bias line is V_GS = 10 − 2I_D (I_D in mA). Valid V_GS? (V)", a: 4.372, unit: "V", tol: 0.01, hint: "Substitute I_D = (10 − V_GS)/2 and call V_GS u: 10 − u = (u − 2)², so u² − 3u − 6 = 0.", why: "u = (3 ± √33)/2 = 4.37 V or −1.37 V. Only 4.37 V is above V_T = 2 V; then I_D = (10 − 4.37)/2 = 2.81 mA." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does solving a device's square law give you a root you must throw away?", model: "The squared formula is a full parabola, but the device only follows it on one side, for a JFET between pinch-off and zero, for a MOSFET above threshold. The algebra finds both crossings of the parabola with the bias line, so one of them lies on the part the device never actually follows." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m7", eyebrow: "Math Toolkit · Module 7", title: "Quadratic Equations",
    intro: `<p>Three parts: expanding a square, the quadratic formula, and picking the physical root. The FET square laws and the second-order circuit equation both lead here.</p>`,
    after: `<p>Whenever an FET bias problem gives you two roots, say out loud why one of them is impossible before you move on.</p>`,
    parts: [p1, p2, p3],
    summary: `
      <div class="eq">(a ± b)² = a² ± 2ab + b²</div>
      <div class="eq">ax² + bx + c = 0 → x = (−b ± √(b² − 4ac))/2a</div>
      <p>D = b² − 4ac: &gt; 0 two real roots; = 0 one; &lt; 0 complex. Get "= 0" form first; signs come with a, b, c.</p>
      <p>Physical root: JFET needs |V<sub>GS</sub>| ≤ |V<sub>P</sub>|; MOSFET needs V<sub>GS</sub> &gt; V<sub>T</sub>. Check each root in both equations.</p>`,
  };
  Course.start(window.CHAPTER);
})();
