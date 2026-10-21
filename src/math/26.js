(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const cell = (v) => (typeof v === "number" ? fmt(Math.abs(v) < 1e-12 ? 0 : v, 3) : v);
  const M = (rows) => `<span style="display:inline-grid;grid-template-columns:repeat(${rows[0].length},auto);gap:2px 14px;padding:4px 10px;margin:0 4px;border-left:2px solid currentColor;border-right:2px solid currentColor;border-radius:7px;font-family:var(--mono);text-align:center;vertical-align:middle">${rows.flat().map((v) => `<span>${cell(v)}</span>`).join("")}</span>`;
  const V = (xs) => M(xs.map((x) => [x]));
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;

  function arr(x1, y1, x2, y2, color, w = 3) {
    const ang = Math.atan2(y2 - y1, x2 - x1), h = 11, s = 6, L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 2) return "";
    const bx = x2 - h * Math.cos(ang), by = y2 - h * Math.sin(ang);
    return `<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" style="stroke:${color};stroke-width:${w}"/><polygon points="${x2},${y2} ${bx + s * Math.sin(ang)},${by - s * Math.cos(ang)} ${bx - s * Math.sin(ang)},${by + s * Math.cos(ang)}" style="fill:${color}"/>`;
  }
  /* Eigen-analysis of [[a, b], [c, d]]. */
  function eig(a, b, c, d) {
    const tr = a + d, det = a * d - b * c, disc = (tr * tr) / 4 - det;
    if (disc < -1e-12) return { tr, det, complex: true, re: tr / 2, im: Math.sqrt(-disc) };
    const r = Math.sqrt(Math.max(disc, 0)), ls = [tr / 2 + r, tr / 2 - r];
    const vec = (l) => {
      let v = Math.abs(b) > 1e-9 ? [b, l - a] : Math.abs(c) > 1e-9 ? [l - d, c] : null;
      if (!v) return null;
      const n = Math.hypot(...v);
      return [v[0] / n, v[1] / n];
    };
    let vs = ls.map(vec);
    if (!vs[0]) vs = Math.abs(a - ls[0]) < 1e-9 ? [[1, 0], [0, 1]] : [[0, 1], [1, 0]];
    return { tr, det, complex: false, ls, vs };
  }
  const lamStr = (E) => (E.complex ? `${fmt(E.re, 3)} ± j${fmt(E.im, 3)}` : `${fmt(E.ls[0], 3)} and ${fmt(E.ls[1], 3)}`);
  /* Plane picture: grid, eigen-direction lines, and optional input/output arrows. */
  function planeFig(A, o = {}) {
    const W = 320, C0 = 160, k = o.k || 40, P = (x, y) => [C0 + k * x, C0 - k * y];
    let s = "";
    for (let i = -4; i <= 4; i++) s += `<line x1="${P(i, 0)[0]}" y1="0" x2="${P(i, 0)[0]}" y2="${W}" style="stroke:var(--line)"/><line x1="0" y1="${P(0, i)[1]}" x2="${W}" y2="${P(0, i)[1]}" style="stroke:var(--line)"/>`;
    s += `<line x1="0" y1="${C0}" x2="${W}" y2="${C0}" style="stroke:var(--muted)"/><line x1="${C0}" y1="0" x2="${C0}" y2="${W}" style="stroke:var(--muted)"/>`;
    const E = eig(...A);
    if (!E.complex && o.lines !== false) E.vs.forEach((v) => { if (v) s += `<line x1="${P(-5 * v[0], -5 * v[1])[0]}" y1="${P(-5 * v[0], -5 * v[1])[1]}" x2="${P(5 * v[0], 5 * v[1])[0]}" y2="${P(5 * v[0], 5 * v[1])[1]}" style="stroke:var(--good);stroke-width:2;stroke-dasharray:6 5"/>`; });
    if (o.x) {
      const [x, y] = o.x, ax = A[0] * x + A[1] * y, ay = A[2] * x + A[3] * y;
      s += `<circle cx="${C0}" cy="${C0}" r="${k}" style="fill:none;stroke:var(--cool);stroke-width:1;stroke-dasharray:3 4"/>`;
      s += arr(C0, C0, ...P(ax, ay), "var(--accent)", 4) + arr(C0, C0, ...P(x, y), "var(--cool)");
      s += S.t(P(x, y)[0] + 6, P(x, y)[1] - 6, "x", { a: "start", cls: "lab" }) + S.t(P(ax, ay)[0] + 6, P(ax, ay)[1] + 16, "Ax", { a: "start", cls: "lab" });
    }
    if (o.extra) s += o.extra(P);
    return S.svg(W, W, s, { label: o.label || "Plane with the input arrow x (blue), the output Ax (orange) and the eigen-directions (green dashed)", max: 320 });
  }

  const p1 = {
    id: "p1", title: "Directions that don't turn", mins: 20,
    blurb: "Most arrows get knocked sideways by a matrix. A few special ones only stretch. Those are eigenvectors.",
    takeaway: "For most inputs x, the output Ax points in a new direction. An eigenvector is a direction that the matrix only stretches (or shrinks, or flips): Av = λv. The stretch factor λ is its eigenvalue. A 2×2 matrix has up to two such directions. They're the matrix's natural axes: along them, a complicated matrix acts like plain multiplication by a number.",
    steps: [
      { k: "play", title: "Hunt for the special directions", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const MS = [["[[2, 1], [1, 2]]", [2, 1, 1, 2]], ["[[3, 1], [0, 2]]", [3, 1, 0, 2]], ["Shear [[1, 1], [0, 1]]", [1, 1, 0, 1]], ["Rotation [[0, −1], [1, 0]]", [0, -1, 1, 0]]];
          let A = MS[0][1], th = 20, lines = false;
          function draw() {
            const x = [Math.cos((th * Math.PI) / 180), Math.sin((th * Math.PI) / 180)], ax = [A[0] * x[0] + A[1] * x[1], A[2] * x[0] + A[3] * x[1]];
            const cross = x[0] * ax[1] - x[1] * ax[0], dot = x[0] * ax[0] + x[1] * ax[1], ang = (Math.atan2(cross, dot) * 180) / Math.PI;
            f.innerHTML = planeFig(A, { x, lines, k: 36 });
            const par = Math.abs(ang) < 2 || Math.abs(Math.abs(ang) - 180) < 2;
            ro.innerHTML = readout([["Turn from x to Ax", fmt(ang, 3) + "°"], ["Stretch |Ax|/|x|", fmt(Math.hypot(...ax), 3)], ["", par ? "<span style='color:var(--good)'>Same line! This is an eigen-direction.</span>" : "knocked sideways"]]);
          }
          const sh = el(`<button type="button" class="btn small">Show the eigen-directions</button>`);
          sh.addEventListener("click", () => { lines = !lines; draw(); });
          host.append(toggle(MS.map((m) => m[0]), (i) => { A = MS[i][1]; draw(); }, 0), f,
            slider({ id: id + "-t", label: "Direction of x", min: 0, max: 180, step: 1, value: th, show: (v) => v + "°" }, (v) => { th = v; draw(); }).el, ro, el(`<div class="row"></div>`));
          host.lastElementChild.appendChild(sh);
          draw();
        },
        `<p class="aside">Sweep the blue input round. Usually the orange output points somewhere else. Find the angles where the turn is 0° (or 180°). For [[2, 1], [1, 2]] they're 45° (stretched ×3) and 135° (stretched ×1). The shear has only one; the rotation has none at all.</p>`,
      ]},
      { k: "learn", title: "The definition", b: [
        `<div class="eq">A v = λ v</div>`,
        `<p>“Multiplying by the matrix does the same as multiplying by the number λ” — but only for vectors along v.</p>`,
        `<ul><li><b>v</b>: the eigenvector (a direction; any length works, so we often scale it to length 1)</li><li><b>λ</b> (lambda): the eigenvalue, the stretch factor along that direction. Negative λ flips; 0 &lt; |λ| &lt; 1 shrinks.</li></ul>`,
        `<p class="aside">“Eigen” is German for “own”: the matrix's own directions.</p>`,
      ]},
      { k: "why", title: "Why anyone cares", b: [
        `<p>Any vector can be split into a piece along each eigenvector. Then the matrix acts on each piece by <b>just multiplying by a number</b>. A tangled, coupled problem breaks into independent simple ones.</p>`,
        `<div class="key"><b>The circuit punchline (Part 4).</b> Write a circuit's equations as x′ = Ax. Each eigen-direction then evolves on its own as e<sup>λt</sup>. The eigenvalues are the circuit's natural frequencies: the poles from the Laplace modules, and the s₁, s₂ of 6.002 Chapter 12.</div>`,
      ]},
      { k: "predict", title: "Predict first", b: [
        { t: "mcq", q: "A = [[3, 0], [0, 0.5]]. Which are eigenvectors?", opts: [["(1, 0) with λ = 3 and (0, 1) with λ = 0.5", true, "A diagonal matrix stretches each axis separately, so the axes are its eigen-directions."], ["(1, 1) with λ = 3.5", false, "A(1, 1) = (3, 0.5), which isn't a multiple of (1, 1)."], ["There are none", false, "Try (1, 0): A(1, 0) = (3, 0) = 3·(1, 0)."]] },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Is (1, −1) an eigenvector of [[2, 1], [1, 2]]? If so, what's λ?", opts: [["Yes, λ = 1", true, "A(1, −1) = (2 − 1, 1 − 2) = (1, −1) = 1·(1, −1)."], ["Yes, λ = 3", false, "λ = 3 belongs to (1, 1)."], ["No", false, "Multiply it out: you get (1, −1) back."]] },
        { t: "num", q: "A·(2, 2) for A = [[2, 1], [1, 2]]: first entry?", a: 6, why: "(2, 2) is along (1, 1), so A just triples it: (6, 6)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is an eigenvector, in plain words?", model: "A direction that the matrix doesn't turn. Vectors along it come out pointing the same way (or exactly backwards), only stretched or shrunk. The stretch factor is the eigenvalue." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Finding them: det(A − λI) = 0", mins: 25,
    blurb: "Eigenvalues are where A − λI squashes the plane. For 2×2 that's one quadratic.",
    takeaway: "Av = λv ⟺ (A − λI)v = 0. A non-zero v can only be sent to 0 if A − λI squashes the plane, so det(A − λI) = 0. For 2×2: λ² − (trace)λ + det = 0, where trace = a + d. Then the eigenvector solves (A − λI)v = 0: read it off either row. Checks: λ₁ + λ₂ = trace, λ₁λ₂ = det. Shortcuts: triangular → eigenvalues on the diagonal; symmetric → real eigenvalues and perpendicular eigenvectors.",
    steps: [
      { k: "learn", title: "From the definition to an equation", b: [
        steps([["Start", "Av = λv"], ["Move everything left", "Av − λv = 0"], ["Write λv as λIv", "(A − λI)v = 0"], ["A non-zero v goes to 0 only if A − λI squashes the plane (Module 24)", "det(A − λI) = 0"]]),
        `<div class="eq">λ² − (a + d)λ + (ad − bc) = 0</div>`,
        `<p class="aside">This is the <b>characteristic equation</b>. For 2×2 it's always: λ² − (trace)λ + (det) = 0.</p>`,
      ]},
      { k: "math", title: "Worked example", b: [
        `<div class="eq">A = ${M([[2, 1], [1, 2]])}</div>`,
        { t: "reveal", label: "Characteristic equation", html: `<div class="eq">λ² − 4λ + 3 = 0 → (λ − 3)(λ − 1) = 0 → λ = 3, 1</div>` },
        { t: "reveal", label: "Eigenvector for λ = 3", html: `<div class="eq">A − 3I = ${M([[-1, 1], [1, -1]])}</div><p>Row 1 says −v₁ + v₂ = 0, so v₂ = v₁: <b>v = (1, 1)</b>. (Row 2 says the same: it has to, because the matrix is squashed.)</p>` },
        { t: "reveal", label: "Eigenvector for λ = 1", html: `<div class="eq">A − I = ${M([[1, 1], [1, 1]])}</div><p>v₁ + v₂ = 0: <b>v = (1, −1)</b>. Perpendicular to (1, 1), as promised for a symmetric matrix.</p>` },
        { t: "reveal", label: "Check with trace and det", html: `<p>3 + 1 = 4 = trace ✓. 3 × 1 = 3 = det ✓.</p>` },
      ]},
      { k: "play", title: "Eigen-calculator", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let A = [2, 1, 1, 2];
          function draw() {
            const E = eig(...A);
            f.innerHTML = planeFig(A, { k: 36, extra: (P) => (E.complex ? "" : E.vs.map((v, i) => arr(160, 160, ...P(E.ls[i] * v[0], E.ls[i] * v[1]), "var(--accent)", 3)).join("")) });
            ro.innerHTML = readout([["A", M([[A[0], A[1]], [A[2], A[3]]])], ["trace, det", `${fmt(E.tr, 3)}, ${fmt(E.det, 3)}`], ["λ² − (trace)λ + det = 0 gives", lamStr(E)], ["Eigenvectors", E.complex ? "none real: the matrix rotates every direction" : E.vs.map((v) => `(${fmt(v[0], 2)}, ${fmt(v[1], 2)})`).join(" and ")]]);
          }
          const two = el(`<div class="two"></div>`);
          ["a", "b", "c", "d"].forEach((nm, i) => two.appendChild(slider({ id: id + nm, label: nm, min: -3, max: 3, step: 0.1, value: A[i], show: (v) => fmt(v, 2) }, (v) => { A[i] = v; draw(); }).el));
          host.append(f, two, ro);
          draw();
        },
        `<p class="aside">Green dashed lines are the eigen-directions; orange arrows are λ·v (unit v, stretched by its eigenvalue). Make b and c opposite in sign and large: the eigenvalues turn complex and the lines vanish (Part 3).</p>`,
      ]},
      { k: "learn", title: "Shortcuts worth knowing", b: [
        `<div class="tbl"><table><tr><th>Matrix type</th><th>Eigenvalues</th></tr><tr><td>Diagonal or triangular</td><td>the diagonal entries</td></tr><tr><td>Symmetric (G of any resistor network)</td><td>always real; eigenvectors perpendicular</td></tr><tr><td>Any n×n</td><td>sum = trace, product = det</td></tr><tr><td>det = 0</td><td>at least one eigenvalue is 0 (a squashed direction)</td></tr></table></div>`,
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<p>For A = [[4, 1], [2, 3]], someone writes the characteristic equation as λ² − 7λ − 10 = 0.</p>`,
        { t: "mcq", q: "What's wrong?", opts: [["The last term is +det = +(12 − 2) = +10, not −10", true, "λ² − 7λ + 10 = (λ − 5)(λ − 2): eigenvalues 5 and 2. Check: 5 + 2 = 7 = trace, 5 × 2 = 10 = det."], ["The middle term should be +7λ", false, "It's −(trace)λ = −7λ."], ["Nothing", false, "Check the product of the roots: it must equal det = 10."]] },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Larger eigenvalue of [[5, 2], [2, 2]]?", a: 6, why: "trace 7, det 6: λ² − 7λ + 6 = 0 → 6 and 1." },
        { t: "num", q: "Eigenvalues of [[3, 7], [0, −2]]: what is the negative one?", a: -2, why: "Triangular: read the diagonal, 3 and −2." },
        { t: "mcq", q: "Eigenvector of [[5, 2], [2, 2]] for λ = 6?", opts: [["(2, 1)", true, "A − 6I = [[−1, 2], [2, −4]]: −v₁ + 2v₂ = 0, so v = (2, 1)."], ["(1, 2)", false, "Check: A(1, 2) = (9, 6), not a multiple of (1, 2)."], ["(1, −2)", false, "That's the λ = 1 eigenvector."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does det(A − λI) = 0 find the eigenvalues?", model: "An eigenvector satisfies (A − λI)v = 0 with v not zero. A matrix can only send a non-zero vector to zero if it squashes the plane, and squashing means its determinant is zero. So the eigenvalues are exactly the λ that make det(A − λI) zero." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Complex eigenvalues: rotation", mins: 20,
    blurb: "When no direction survives, the eigenvalues go complex. Their size says grow or shrink; their angle says how fast it turns.",
    takeaway: "If the matrix turns every direction, the characteristic equation has complex roots λ = α ± jβ. Polar form λ = r·e^(±jθ): r = |λ| is the stretch per step, θ is the turn per step. Repeating the matrix (x, Ax, A²x, …) gives a spiral: inward if |λ| < 1, outward if |λ| > 1, a circle if |λ| = 1. Complex eigenvalues always come in conjugate pairs for real matrices. This is the matrix version of ringing.",
    steps: [
      { k: "learn", title: "The rotation matrix", b: [
        `<div class="eq">R = ${M([[0, -1], [1, 0]])}   λ² + 1 = 0   λ = ±j</div>`,
        `<p>A 90° rotation leaves no direction alone, so no real eigenvector exists. The algebra still answers: λ = ±j. And j is exactly “rotate by 90°” in the complex plane (Module 12).</p>`,
        `<p class="aside">General rotation by θ scaled by r: eigenvalues r(cos θ ± j sin θ) = r·e<sup>±jθ</sup>.</p>`,
      ]},
      { k: "play", title: "Apply the matrix again and again", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let r = 0.92, th = 25;
          function draw() {
            const t = (th * Math.PI) / 180, A = [r * Math.cos(t), -r * Math.sin(t), r * Math.sin(t), r * Math.cos(t)];
            let x = [2.5, 0], pts = [x];
            for (let k = 0; k < 40; k++) { x = [A[0] * x[0] + A[1] * x[1], A[2] * x[0] + A[3] * x[1]]; pts.push(x); if (Math.hypot(...x) > 6) break; }
            f.innerHTML = planeFig(A, { k: 36, lines: false, extra: (P) => `<polyline points="${pts.map((p) => P(p[0], p[1]).join(",")).join(" ")}" style="fill:none;stroke:var(--cool);stroke-width:1.5"/>` + pts.map((p, i) => `<circle cx="${P(p[0], p[1])[0]}" cy="${P(p[0], p[1])[1]}" r="${i ? 3.5 : 6}" style="fill:${i ? "var(--accent)" : "var(--good)"}"/>`).join("") });
            ro.innerHTML = readout([["Eigenvalues", `${fmt(r, 3)}·e^(±j${th}°) = ${fmt(A[0], 3)} ± j${fmt(Math.abs(A[2]), 3)}`], ["|λ|", fmt(r, 3)], ["Verdict", r < 0.995 ? "spirals in: decays" : r > 1.005 ? "spirals out: grows" : "circles forever"]]);
          }
          host.append(f, slider({ id: id + "-r", label: "Size r = |λ|", min: 0.8, max: 1.08, step: 0.01, value: r }, (v) => { r = v; draw(); }).el,
            slider({ id: id + "-t", label: "Turn θ per step", min: 5, max: 90, step: 1, value: th, show: (v) => v + "°" }, (v) => { th = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Green dot: the start. Each orange dot is one more multiplication by A. Plot either coordinate against step number and you'd see a decaying (or growing) oscillation.</p>`,
      ]},
      { k: "why", title: "The same story as ringing", b: [
        `<p>An underdamped RLC rings: it oscillates while the envelope decays. In the state plane (capacitor voltage, inductor current) that's an inward spiral. Complex eigenvalues are how a matrix says “oscillate”. Their real part (or, step by step, their size) says whether the oscillation dies or grows.</p>`,
        `<div class="key"><b>Two stability rules you'll meet again.</b> Continuous time (x′ = Ax, Part 4): stable when every eigenvalue has <b>real part &lt; 0</b>. Step by step (x<sub>k+1</sub> = Ax<sub>k</sub>, the z-transform world of Module 33): stable when every eigenvalue has <b>|λ| &lt; 1</b>.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Eigenvalues of [[0, 1], [−4, 0]]?", opts: [["±2j", true, "trace 0, det 4: λ² + 4 = 0."], ["±2", false, "That would need det = −4."], ["2 and −2 with real eigenvectors", false, "Try A(1, 2) = (2, −4): turned, not stretched."]] },
        { t: "num", q: "A step-by-step system has eigenvalues 0.6 ± j0.6. What is |λ|? (Then decide: stable?)", a: 0.8485, tol: 0.01, why: "√(0.36 + 0.36) = 0.849 < 1: stable, spiralling in by 15% per step." },
        { t: "mcq", q: "A real 2×2 matrix has eigenvalue 1 + 2j. The other eigenvalue must be…", opts: [["1 − 2j", true, "Complex eigenvalues of real matrices come in conjugate pairs."], ["−1 − 2j", false, "The sum must be the (real) trace, so the imaginary parts cancel and the real parts match."], ["Anything", false, "trace and det are real, which forces the conjugate."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What do the size and angle of a complex eigenvalue tell you when you apply the matrix repeatedly?", model: "The angle is how far each step turns the vector, so it sets the oscillation speed. The size is how much each step stretches it: below one the spiral shrinks and the oscillation dies out, above one it grows, and exactly one gives a steady circle." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Circuits that evolve: x′ = Ax", mins: 30,
    blurb: "Write a circuit's capacitor voltages and inductor currents as a vector. Its eigenvalues are the natural frequencies.",
    takeaway: "State variables: capacitor voltages and inductor currents (the energy holders). An unforced linear circuit obeys x′ = Ax. If x starts along an eigenvector, it stays on that line and decays (or grows) as e^(λt). Any start is a mix, so x(t) = c₁e^(λ₁t)v₁ + c₂e^(λ₂t)v₂. Series RLC with x = (v_C, i_L): A = [[0, 1/C], [−1/L, −R/L]], characteristic equation λ² + (R/L)λ + 1/(LC) = 0: exactly 6.002 Chapter 12's. Eigenvalues of A = natural frequencies = poles of H(s). Stable ⟺ all real parts &lt; 0.",
    steps: [
      { k: "learn", title: "State variables", b: [
        `<p>A circuit's “memory” lives in its capacitor voltages and inductor currents. Bundle them into a <b>state vector</b> x. With no input, every linear circuit obeys</p>`,
        `<div class="eq">dx/dt = A x</div>`,
        `<p>Series RLC, x = (v<sub>C</sub>, i<sub>L</sub>):</p>`,
        steps([["Capacitor: C dv_C/dt = i_L", "v_C′ = (1/C)·i_L"], ["KVL: L di_L/dt = −v_C − R·i_L", "i_L′ = −(1/L)v_C − (R/L)i_L"], ["As a matrix", "A = [[0, 1/C], [−1/L, −R/L]]"]]),
      ]},
      { k: "why", title: "Eigenvectors evolve on their own", b: [
        `<p>Suppose x(0) = v, an eigenvector. Then x′ = Av = λv: the rate of change points <b>along the same line</b>. So x stays on that line and just shrinks or grows: x(t) = e<sup>λt</sup>v.</p>`,
        `<p>Any start is a mix of eigenvectors, and each part does its own thing:</p>`,
        `<div class="eq">x(t) = c₁e<sup>λ₁t</sup>v₁ + c₂e<sup>λ₂t</sup>v₂</div>`,
        `<p class="aside">That's the general solution of 6.002 Chapter 12, read as a matrix fact.</p>`,
      ]},
      { k: "math", title: "The characteristic equation, again", b: [
        `<p>trace A = −R/L, det A = 0 − (1/C)(−1/L) = 1/(LC). So:</p>`,
        `<div class="eq">λ² + (R/L)λ + 1/(LC) = 0</div>`,
        `<div class="key"><b>Three names for one thing.</b> The eigenvalues of A = the roots s₁, s₂ of 6.002's characteristic equation = the poles of the circuit's transfer function (Module 23). Overdamped: two real negative eigenvalues. Underdamped: a complex pair −α ± jω<sub>d</sub>.</div>`,
      ]},
      { k: "play", title: "The RLC in the state plane", b: [
        (host, id) => {
          const pf = el(`<div class="fig"></div>`), tf = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let R = 0.6;
          function draw() {
            const A = [0, 1, -1, -R], E = eig(...A);
            /* integrate with RK4 from (1, 0) */
            const f = (x) => [A[0] * x[0] + A[1] * x[1], A[2] * x[0] + A[3] * x[1]];
            let x = [1, 0], pts = [[0, 1, 0]]; const h = 0.02;
            for (let k = 1; k <= 1000; k++) {
              const k1 = f(x), k2 = f([x[0] + (h / 2) * k1[0], x[1] + (h / 2) * k1[1]]), k3 = f([x[0] + (h / 2) * k2[0], x[1] + (h / 2) * k2[1]]), k4 = f([x[0] + h * k3[0], x[1] + h * k3[1]]);
              x = [x[0] + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), x[1] + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
              pts.push([k * h, x[0], x[1]]);
            }
            pf.innerHTML = planeFig(A, { k: 110, extra: (P) => `<polyline points="${pts.map((p) => P(p[1], p[2]).join(",")).join(" ")}" style="fill:none;stroke:var(--accent);stroke-width:2.5"/><circle cx="${P(1, 0)[0]}" cy="${P(1, 0)[1]}" r="6" style="fill:var(--good)"/>` + S.t(310, 175, "v_C", { a: "end", cls: "lab" }) + S.t(168, 14, "i_L", { a: "start", cls: "lab" }), label: "State plane: capacitor voltage across, inductor current up; the trajectory from v_C = 1" });
            tf.innerHTML = plot({ x: [0, 20], y: [-1, 1], xt: [0, 5, 10, 15, 20], yt: [-1, 0, 1], xl: "t", yl: "v_C", h: 180, series: [{ pts: pts.map((p) => [p[0], p[1]]), cls: "s1" }], label: "Capacitor voltage against time" });
            ro.innerHTML = readout([["Eigenvalues (L = C = 1)", lamStr(E)], ["Type", E.complex ? "complex pair: underdamped, spirals in" : Math.abs(E.ls[0] - E.ls[1]) < 0.02 ? "repeated: critically damped" : "two real: overdamped, no oscillation"]]);
          }
          host.append(pf, tf, slider({ id: id + "-r", label: "R (with L = 1 H, C = 1 F)", min: 0, max: 3, step: 0.05, value: R, show: (v) => fmt(v, 3) + " Ω" }, (v) => { R = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Start: capacitor charged to 1 V, no current. Small R: an inward spiral, which is ringing. R = 2 (critical): the eigenvalues merge at −1. R &gt; 2: two real eigenvalues, the green eigen-lines appear, and the path slides in along the slower one. R = 0: a closed circle (an ideal LC oscillator).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Series RLC: L = 1 mH, C = 1 µF, R = 10 Ω. Real part of the eigenvalues (s⁻¹)?", a: -5000, tol: 0.01, why: "trace = −R/L = −10 000, so each of the pair has real part −5000 s⁻¹ (= −α). 1/LC = 10⁹ gives ω₀ ≈ 31 600 rad/s, so they're complex: underdamped." },
        { t: "num", q: "Same L and C. Which R makes the two eigenvalues equal (critical damping), in Ω?", a: 63.25, tol: 0.01, why: "Equal roots when (R/L)² = 4/(LC): R = 2√(L/C) = 2√1000 = 63.2 Ω." },
        { t: "mcq", q: "A circuit's state matrix has eigenvalues −2 and +0.1. What happens?", opts: [["It's unstable: the +0.1 mode grows as e^(0.1t)", true, "One eigenvalue with positive real part is enough."], ["It's stable because −2 is bigger", false, "Every mode must decay. The growing one eventually wins."], ["It oscillates", false, "Real eigenvalues: no oscillation, just a slow runaway."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How are a circuit's natural frequencies related to eigenvalues?", model: "Writing the capacitor voltages and inductor currents as a state vector gives x prime equals A x. Along each eigenvector the state just grows or decays as e to the lambda t, so the eigenvalues of A are the circuit's natural frequencies, the same numbers as the roots of the characteristic equation and the poles of the transfer function." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "Decoupling: modes and interconnect delay", mins: 25,
    blurb: "Change to the eigenvector axes and a coupled problem falls apart into separate ones. A wire on a chip has a dominant time constant.",
    takeaway: "A = PDP⁻¹, with eigenvectors as the columns of P and eigenvalues on the diagonal of D. In eigenvector coordinates everything is decoupled, so powers are easy: Aᵏ = PDᵏP⁻¹. Each eigen-direction is a mode. A two-section RC line (R and C per section) has state matrix (1/RC)[[−2, 1], [1, −1]], eigenvalues (−3 ± √5)/2 · (1/RC), and so time constants 2.62RC and 0.38RC. The slow one dominates the delay; the Elmore estimate (3RC at the far end) is close to it.",
    steps: [
      { k: "learn", title: "Diagonalisation", b: [
        `<div class="eq">A = P D P⁻¹</div>`,
        `<ul><li><b>P</b>: the eigenvectors as columns (the new axes)</li><li><b>D</b>: the eigenvalues on the diagonal</li><li>Read right to left: switch into eigen-axes (P⁻¹), stretch each axis separately (D), switch back (P).</li></ul>`,
        `<div class="eq">${M([[2, 1], [1, 2]])} = ${M([[1, 1], [1, -1]])}${M([[3, 0], [0, 1]])}${M([[1, 1], [1, -1]])}<sup>−1</sup></div>`,
      ]},
      { k: "math", title: "Why it's powerful: powers", b: [
        `<p>A¹⁰ by brute force is nine matrix products. With eigenvectors it's nearly free:</p>`,
        `<div class="eq">A¹⁰ = P D¹⁰ P⁻¹ ,   D¹⁰ = diag(3¹⁰, 1¹⁰)</div>`,
        `<p>Even simpler: write the input as a mix of eigenvectors. (2, 0) = (1, 1) + (1, −1). So</p>`,
        `<div class="eq">A⁵(2, 0) = 3⁵(1, 1) + 1⁵(1, −1) = (244, 242)</div>`,
        `<p class="aside">After many steps, the biggest |λ| dominates everything. That's why one “dominant pole” often describes a whole amplifier, and why a slow mode sets a circuit's settling time.</p>`,
      ]},
      { k: "play", title: "A wire on a chip: two RC sections", b: [
        fig(S.svg(470, 140, S.vsrc(40, 85, "0", { side: "left" }) + S.wire([40, 67], [40, 30], [70, 30]) + S.res(70, 30, 170, 30, "R", {}) + S.wire([170, 30], [210, 30]) + S.dot(210, 30) + S.cap(210, 30, 210, 120, "C", {}) + S.res(210, 30, 330, 30, "R", {}) + S.wire([330, 30], [370, 30]) + S.dot(370, 30) + S.cap(370, 30, 370, 120, "C", {}) + S.wire([40, 103], [40, 120], [370, 120]) + S.t(210, 18, "v₁", { cls: "lab" }) + S.t(370, 18, "v₂", { cls: "lab" }) + S.gnd(120, 120), { label: "Two RC sections: driver at 0 V, R to node 1 with C to ground, R to node 2 with C to ground" })),
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let v1 = 1, v2 = 1;
          function draw() {
            /* RC = 1. A = [[-2, 1], [1, -1]]; eigen: l = (-3 ± √5)/2 */
            const l1 = (-3 + Math.sqrt(5)) / 2, l2 = (-3 - Math.sqrt(5)) / 2, E = eig(-2, 1, 1, -1);
            const [p, q] = E.vs; /* p for l1 (slow), q for l2 (fast) */
            const det = p[0] * q[1] - q[0] * p[1], c1 = (v1 * q[1] - q[0] * v2) / det, c2 = (p[0] * v2 - v1 * p[1]) / det;
            const x = (t, i) => c1 * Math.exp(l1 * t) * p[i] + c2 * Math.exp(l2 * t) * q[i];
            f.innerHTML = plot({ x: [0, 8], y: [-0.2, 1.2], xt: [0, 2, 4, 6, 8], xtf: (v) => v + "RC", yt: [0, 0.5, 1], xl: "t", h: 220, series: [{ f: (t) => x(t, 0), cls: "s2" }, { f: (t) => x(t, 1), cls: "s1" }, { f: (t) => c1 * Math.exp(l1 * t) * p[1], cls: "s5" }], label: "Node voltages discharging: node 1 blue, node 2 orange, slow mode alone dashed" });
            ro.innerHTML = readout([["Eigenvalues × RC", `${fmt(l1, 3)} and ${fmt(l2, 3)}`], ["Time constants", `${fmt(-1 / l1, 3)}RC (slow) and ${fmt(-1 / l2, 3)}RC (fast)`], ["Mix of start: slow, fast", `${fmt(c1, 3)}, ${fmt(c2, 3)}`]]);
          }
          host.append(f, slider({ id: id + "-1", label: "Start v₁", min: -1, max: 1, step: 0.1, value: v1 }, (v) => { v1 = v; draw(); }).el,
            slider({ id: id + "-2", label: "Start v₂", min: -1, max: 1, step: 0.1, value: v2 }, (v) => { v2 = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The driver drops to 0 and the wire discharges. Whatever the start, after about one RC only the slow mode (grey dashed) is left. Set v₁ = 0.6 and v₂ = 1 (roughly along the slow eigenvector, (0.53, 0.85)): almost no fast part at all. Set v₁ = 1, v₂ = −0.6: almost all fast.</p>`,
      ]},
      { k: "why", title: "Elmore delay: the chip designer's shortcut", b: [
        `<p>KCL at the two nodes gives C·v′ = (1/R)[[−2, 1], [1, −1]]v, so the eigenvalues are (−3 ± √5)/2 per RC: time constants <b>2.62RC</b> and <b>0.38RC</b>.</p>`,
        `<p>Elmore's rule estimates the delay to a node by adding, for each resistor on the path, R × (all the capacitance downstream of it):</p>`,
        `<div class="eq">τ_Elmore(node 2) = R(C + C) + R·C = 3RC</div>`,
        `<p>That's close to the dominant 2.62RC, without any eigenvalues. Routing tools use Elmore-style estimates on millions of wires; you now know what it's approximating.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A = [[2, 1], [1, 2]]. First entry of A¹⁰·(1, 1)?", a: 59049, why: "(1, 1) is an eigenvector with λ = 3: 3¹⁰ = 59 049." },
        { t: "num", q: "Elmore delay to the far end of three equal RC sections (in units of RC)?", a: 6, hint: "First R sees 3C downstream, the second 2C, the third C.", why: "3 + 2 + 1 = 6RC. For n sections it's n(n + 1)/2 · RC, which grows as n²: why long wires are slow and get buffers." },
        { t: "mcq", q: "Doubling a wire's length doubles both its total R and total C. Its delay roughly…", opts: [["Quadruples", true, "Delay ∝ RC, and both double. That's why long on-chip wires are cut up with repeaters."], ["Doubles", false, "Both R and C scale with length."], ["Stays the same", false, "Longer wire, more R and more C."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does one slow mode often decide how long a circuit takes to settle?", model: "The response is a sum of modes, each decaying as e to its eigenvalue times t. The fast modes die out quickly, so after a short while only the slowest one, the eigenvalue closest to zero, is left, and its time constant sets how long settling takes." },
      ]},
    ],
  };

  const p6 = {
    id: "p6", title: "Master it", mins: 30,
    blurb: "Characteristic equations, eigenvectors, stability and modes.",
    takeaway: "You can find eigenvalues and eigenvectors, read real vs complex, decide stability for x′ = Ax and xₖ₊₁ = Axₖ, connect them to natural frequencies and poles, and estimate wire delay.",
    steps: [
      { k: "check", title: "Problem 1", b: [
        { t: "num", q: "Smaller eigenvalue of [[1, 4], [2, 3]]?", a: -1, hint: "trace 4, det 3 − 8 = −5.", why: "λ² − 4λ − 5 = (λ − 5)(λ + 1): eigenvalues 5 and −1." },
      ]},
      { k: "check", title: "Problem 2", b: [
        { t: "mcq", q: "Eigenvector of [[1, 4], [2, 3]] for λ = 5?", opts: [["(1, 1)", true, "A − 5I = [[−4, 4], [2, −2]]: v₁ = v₂."], ["(2, −1)", false, "That's the λ = −1 eigenvector: A(2, −1) = (−2, 1)."], ["(1, 2)", false, "A(1, 2) = (9, 8)."]] },
      ]},
      { k: "check", title: "Problem 3: parallel RLC", b: [
        `<p>Parallel RLC, state (v<sub>C</sub>, i<sub>L</sub>): C v′ = −v/R − i, L i′ = v. So A = [[−1/(RC), −1/C], [1/L, 0]].</p>`,
        { t: "num", q: "With R = 1 kΩ, C = 1 µF, L = 1 H: real part of the eigenvalues (s⁻¹)?", a: -500, hint: "trace = −1/(RC). Are they complex? Compare (trace/2)² with det = 1/(LC).", why: "trace = −1000, det = 10⁶. (500)² = 2.5×10⁵ < 10⁶: complex, with real part −500 s⁻¹ and ω_d = √(10⁶ − 2.5×10⁵) ≈ 866 rad/s." },
      ]},
      { k: "check", title: "Problem 4: step-by-step stability", b: [
        { t: "mcq", q: "x(k + 1) = [[0.5, 0.4], [0.3, 0.6]]·x(k). Stable?", opts: [["Yes: eigenvalues 0.9 and 0.2, both |λ| < 1", true, "trace 1.1, det 0.18: λ² − 1.1λ + 0.18 = (λ − 0.9)(λ − 0.2)."], ["No: the entries add to more than 1", false, "Entries don't decide it; eigenvalues do."], ["Only if x starts small", false, "Linear stability doesn't depend on the start."]] },
      ]},
      { k: "check", title: "Problem 5: design", b: [
        { t: "num", q: "Series RLC with L = 10 µH, C = 1 nF. Smallest R that gives no ringing (Ω)?", a: 200, hint: "Critical damping: R = 2√(L/C).", why: "√(10⁻⁵/10⁻⁹) = √10⁴ = 100; R = 200 Ω." },
      ]},
      { k: "say", title: "Problem 6: explain it", b: [
        { t: "say", q: "Explain, using eigenvalues, why an LC circuit with no resistance oscillates forever but adding R makes it die out.", model: "With no R the state matrix has trace zero, so the eigenvalues are a purely imaginary pair, plus and minus j omega zero. Each mode goes as e to the j omega t, a rotation that never shrinks, so it oscillates forever. Adding R makes the trace minus R over L, which moves both eigenvalues to a negative real part, so every mode carries a decaying exponential and the ringing dies out." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m26", eyebrow: "Math Toolkit · Module 26", title: "Eigenvalues and Eigenvectors",
    intro: `<p>Six parts: directions a matrix doesn't turn, finding them with det(A − λI) = 0, complex eigenvalues as rotation, circuits as x′ = Ax, decoupling into modes (with on-chip wire delay), and mastery problems.</p><p>Why a chip designer needs this: eigenvalues are natural frequencies and poles. They decide stability, ringing, settling time and wire delay.</p><p class="aside">Before this: Modules 24 (matrices) and 15 (differential equations). Pairs with 6.002 Chapter 12 and Module 23.</p>`,
    after: `<p>Next: Module 27 (sensitivity) asks how much a circuit's output moves when each part drifts, the first step towards designing for real silicon.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <div class="eq">A v = λ v     det(A − λI) = 0</div>
      <p>2×2: λ² − (trace)λ + det = 0. Σλ = trace, Πλ = det. Eigenvector: solve (A − λI)v = 0 from one row.</p>
      <p>Triangular → diagonal entries. Symmetric → real λ, perpendicular v. det = 0 → a zero eigenvalue.</p>
      <p>Complex λ = r e<sup>±jθ</sup>: rotation by θ, scaling by r per step. Conjugate pairs for real A.</p>
      <p><b>x′ = Ax:</b> x(t) = Σ cᵢ e<sup>λᵢt</sup> vᵢ. Stable ⟺ all Re λ &lt; 0. <b>xₖ₊₁ = Axₖ:</b> stable ⟺ all |λ| &lt; 1.</p>
      <p>Series RLC: A = [[0, 1/C], [−1/L, −R/L]] → λ² + (R/L)λ + 1/LC = 0. Eigenvalues = natural frequencies = poles. Critical R = 2√(L/C).</p>
      <p>A = PDP⁻¹; Aᵏ = PDᵏP⁻¹. Slowest mode dominates settling. Two-section RC: τ = 2.62RC, 0.38RC; Elmore (far end) = 3RC; n sections: n(n + 1)/2·RC.</p>`,
  };
  Course.start(window.CHAPTER);
})();
