(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  /* A matrix or column vector drawn with brackets. rows: array of arrays of strings or numbers. */
  const M = (rows) => `<span style="display:inline-grid;grid-template-columns:repeat(${rows[0].length},auto);gap:2px 14px;padding:4px 10px;margin:0 4px;border-left:2px solid currentColor;border-right:2px solid currentColor;border-radius:7px;font-family:var(--mono);text-align:center;vertical-align:middle">${rows.flat().map((v) => `<span>${typeof v === "number" ? fmt(v, 3) : v}</span>`).join("")}</span>`;
  const V = (xs) => M(xs.map((x) => [x]));
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;

  /* ---------- 2-D picture of a linear map: grid, unit square, basis arrows and an "F" ---------- */
  let clipN = 0;
  function arr(x1, y1, x2, y2, color, w = 3) {
    const ang = Math.atan2(y2 - y1, x2 - x1), h = 11, s = 6, L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 2) return "";
    const bx = x2 - h * Math.cos(ang), by = y2 - h * Math.sin(ang);
    return `<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" style="stroke:${color};stroke-width:${w}"/><polygon points="${x2},${y2} ${bx + s * Math.sin(ang)},${by - s * Math.cos(ang)} ${bx - s * Math.sin(ang)},${by + s * Math.cos(ang)}" style="fill:${color}"/>`;
  }
  const F_SHAPE = [[[0.25, 0.2], [0.25, 1.7], [1.1, 1.7]], [[0.25, 0.95], [0.8, 0.95]]];
  function mapFig(a, b, c, d, o = {}) {
    const W = 320, C0 = 160, k = o.k || 38, P = (x, y) => [C0 + k * (a * x + b * y), C0 - k * (c * x + d * y)], Q = (x, y) => [C0 + k * x, C0 - k * y];
    const cid = "mapclip" + ++clipN;
    let s = `<clipPath id="${cid}"><rect x="0" y="0" width="${W}" height="${W}"/></clipPath><g clip-path="url(#${cid})">`;
    for (let i = -4; i <= 4; i++) {
      s += `<line x1="${Q(i, -5)[0]}" y1="${Q(i, -5)[1]}" x2="${Q(i, 5)[0]}" y2="${Q(i, 5)[1]}" style="stroke:var(--line);stroke-width:1"/><line x1="${Q(-5, i)[0]}" y1="${Q(-5, i)[1]}" x2="${Q(5, i)[0]}" y2="${Q(5, i)[1]}" style="stroke:var(--line);stroke-width:1"/>`;
    }
    if (!o.noGrid) for (let i = -6; i <= 6; i++) {
      const [x1, y1] = P(i, -8), [x2, y2] = P(i, 8), [x3, y3] = P(-8, i), [x4, y4] = P(8, i);
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:var(--accent);stroke-width:1;opacity:.35"/><line x1="${x3}" y1="${y3}" x2="${x4}" y2="${y4}" style="stroke:var(--accent);stroke-width:1;opacity:.35"/>`;
    }
    const sq = [P(0, 0), P(1, 0), P(1, 1), P(0, 1)];
    s += `<polygon points="${sq.map((p) => p.join(",")).join(" ")}" style="fill:var(--accent);opacity:.22"/>`;
    s += `<line x1="0" y1="${C0}" x2="${W}" y2="${C0}" style="stroke:var(--muted);stroke-width:1.5"/><line x1="${C0}" y1="0" x2="${C0}" y2="${W}" style="stroke:var(--muted);stroke-width:1.5"/>`;
    F_SHAPE.forEach((line) => { s += `<polyline points="${line.map(([x, y]) => P(x, y).join(",")).join(" ")}" style="fill:none;stroke:var(--ink);stroke-width:4;stroke-linecap:round;stroke-linejoin:round"/>`; });
    s += arr(C0, C0, ...P(1, 0), "var(--accent)") + arr(C0, C0, ...P(0, 1), "var(--cool)");
    s += "</g>";
    return S.svg(W, W, s, { label: o.label || "A grid, a unit square, two arrows and a letter F, after the matrix acts on them", max: 320 });
  }
  /* Matrix sliders + presets around mapFig. extra(host-level) gets called after each draw with the matrix. */
  function mapWidget(host, id, start, extra) {
    const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
    let m = start.slice();
    function draw() {
      const [a, b, c, d] = m;
      f.innerHTML = mapFig(a, b, c, d);
      ro.innerHTML = extra(m);
    }
    const names = ["a (top left)", "b (top right)", "c (bottom left)", "d (bottom right)"];
    const sl = names.map((nm, i) => slider({ id: id + "-" + i, label: nm, min: -2, max: 2, step: 0.1, value: m[i], show: (v) => fmt(v, 2) }, (v) => { m[i] = v; draw(); }));
    const PRE = [["Identity", [1, 0, 0, 1]], ["Stretch x", [2, 0, 0, 1]], ["Shear", [1, 1, 0, 1]], ["Rotate 90°", [0, -1, 1, 0]], ["Flip", [-1, 0, 0, 1]], ["Squash", [1, 2, 0.5, 1]]];
    const pre = toggle(PRE.map((p) => p[0]), (i) => { PRE[i][1].forEach((v, j) => sl[j].set(v)); }, -1);
    host.append(f, pre, el(`<div class="two"></div>`), ro);
    const two = host.querySelector(".two");
    sl.forEach((s) => two.appendChild(s.el));
    draw();
  }

  const p1 = {
    id: "p1", title: "Vectors: lists that are also arrows", mins: 20,
    blurb: "One name for a bundle of numbers. Add them, scale them, and multiply them into a single number with the dot product.",
    takeaway: "A vector is an ordered list of numbers, like the node voltages of a circuit, v = (v₁, v₂, v₃). With 2 or 3 entries you can draw it as an arrow. Add vectors entry by entry (tip to tail); scale by multiplying every entry. Dot product a·b = a₁b₁ + a₂b₂ + …: a weighted sum, one number. Geometrically a·b = |a||b|cos θ, so a·b = 0 means the arrows are perpendicular (“orthogonal”: they share nothing). Total power in a circuit is a dot product: P = v·i. Length |a| = √(a·a).",
    steps: [
      { k: "learn", title: "One name for many numbers", b: [
        `<p>A circuit with three nodes has three node voltages. Instead of juggling v₁, v₂ and v₃ separately, bundle them:</p>`,
        `<div class="eq">v = ${V(["v₁", "v₂", "v₃"])} = ${V(["5 V", "3 V", "1 V"])}</div>`,
        `<p>That bundle is a <b>vector</b>: an ordered list. Order matters: the first entry is always node 1.</p>`,
        `<div class="two"><div class="tile"><h3>Picture 1: a list</h3><p>Any length. A chip simulation can have a vector of a million node voltages.</p></div><div class="tile"><h3>Picture 2: an arrow</h3><p>With two entries (x, y) it's an arrow from the origin to the point (x, y). The arrow picture gives the intuition; the list picture does the work.</p></div></div>`,
      ]},
      { k: "play", title: "Add and scale", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = [2, 1], b = [-1, 2], k = 1;
          function draw() {
            const C0 = 160, s = 32, P = (x, y) => [C0 + s * x, C0 - s * y];
            let g = "";
            for (let i = -5; i <= 5; i++) g += `<line x1="${P(i, -5)[0]}" y1="0" x2="${P(i, -5)[0]}" y2="320" style="stroke:var(--line)"/><line x1="0" y1="${P(0, i)[1]}" x2="320" y2="${P(0, i)[1]}" style="stroke:var(--line)"/>`;
            g += `<line x1="0" y1="${C0}" x2="320" y2="${C0}" style="stroke:var(--muted)"/><line x1="${C0}" y1="0" x2="${C0}" y2="320" style="stroke:var(--muted)"/>`;
            const ka = [k * a[0], k * a[1]], sum = [ka[0] + b[0], ka[1] + b[1]];
            g += arr(...P(ka[0], ka[1]), ...P(sum[0], sum[1]), "var(--cool)", 2).replace(/stroke-width:2/, "stroke-width:2;stroke-dasharray:5 4");
            g += arr(C0, C0, ...P(ka[0], ka[1]), "var(--accent)") + arr(C0, C0, ...P(b[0], b[1]), "var(--cool)") + arr(C0, C0, ...P(sum[0], sum[1]), "var(--good)", 4);
            g += S.t(P(ka[0], ka[1])[0] + 8, P(ka[0], ka[1])[1] - 6, k === 1 ? "a" : "ka", { a: "start", cls: "lab" }) + S.t(P(b[0], b[1])[0] - 8, P(b[0], b[1])[1] - 6, "b", { a: "end", cls: "lab" }) + S.t(P(sum[0], sum[1])[0] + 8, P(sum[0], sum[1])[1] + 16, "sum", { a: "start", cls: "lab" });
            f.innerHTML = S.svg(320, 320, g, { label: "Two arrows and their sum, drawn tip to tail", max: 320 });
            ro.innerHTML = readout([["k·a", `(${fmt(ka[0], 2)}, ${fmt(ka[1], 2)})`], ["b", `(${fmt(b[0], 2)}, ${fmt(b[1], 2)})`], ["k·a + b", `(${fmt(sum[0], 2)}, ${fmt(sum[1], 2)})`]]);
          }
          host.append(f,
            slider({ id: id + "-ax", label: "a, first entry", min: -3, max: 3, step: 0.5, value: a[0] }, (v) => { a[0] = v; draw(); }).el,
            slider({ id: id + "-ay", label: "a, second entry", min: -3, max: 3, step: 0.5, value: a[1] }, (v) => { a[1] = v; draw(); }).el,
            slider({ id: id + "-k", label: "Scale k (multiplies every entry of a)", min: -2, max: 2, step: 0.25, value: k }, (v) => { k = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Adding goes entry by entry, which is the same as putting the arrows tip to tail (the dashed blue copy of b). A negative k flips the arrow round.</p>`,
      ]},
      { k: "learn", title: "The dot product: a weighted sum", b: [
        `<div class="eq">a·b = a₁b₁ + a₂b₂ + a₃b₃ + …</div>`,
        `<p>Multiply matching entries, then add. You get <b>one number</b>, not a vector.</p>`,
        `<div class="two"><div class="tile"><h3>Shopping bill</h3><p>quantities (2, 1, 3) · prices (4, 10, 1) = 8 + 10 + 3 = 21. Each quantity is weighted by its price.</p></div><div class="tile"><h3>Circuit power</h3><p>Element voltages · element currents = v₁i₁ + v₂i₂ + … = total power P = v·i. (Tellegen's theorem says this adds to zero over a whole circuit: what the sources deliver, the loads absorb.)</p></div></div>`,
      ]},
      { k: "why", title: "What the dot product measures", b: [
        `<div class="eq">a·b = |a| |b| cos θ</div>`,
        `<p>θ is the angle between the arrows. So the dot product measures <b>how much the two point the same way</b>:</p>`,
        `<ul><li>same direction (θ = 0): as big as it can be, |a||b|</li><li>perpendicular (θ = 90°): exactly <b>0</b>. They share nothing.</li><li>opposite (θ = 180°): negative</li></ul>`,
        `<div class="key"><b>Remember this one.</b> “Dot product zero = they share nothing” is the whole secret of Fourier series (Module 30): sines of different frequencies are perpendicular in exactly this sense, which is why you can pull each one out on its own.</div>`,
        `<p class="aside">Length: |a| = √(a·a) = √(a₁² + a₂² + …), which is Pythagoras.</p>`,
      ]},
      { k: "predict", title: "Predict first", b: [
        { t: "mcq", q: "a = (3, 4), b = (4, −3). Without drawing: what's the angle between them?", opts: [["90°: a·b = 12 − 12 = 0", true, "Zero dot product means perpendicular. Draw them to see it."], ["0°: they have the same numbers", false, "Same digits, different arrangement and sign. Work out a·b."], ["45°", false, "Compute a·b first. It decides the angle."]] },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Length of the vector (3, 4)?", a: 5, why: "√(9 + 16) = √25 = 5." },
        { t: "num", q: "(1, 2, 3)·(4, 5, 6) = ?", a: 32, why: "4 + 10 + 18 = 32." },
        { t: "num", q: "Three elements have voltages (5, 3, 1) V and currents (2, −1, 0.5) mA, measured the same way. Total power absorbed, in mW?", a: 7.5, unit: "mW", why: "5×2 + 3×(−1) + 1×0.5 = 10 − 3 + 0.5 = 7.5 mW. The −3 mW element is delivering power: it's a source." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does it mean when the dot product of two vectors is zero, and why might that be useful?", model: "It means the vectors are perpendicular: neither has any component along the other, so they share nothing. That's useful because you can measure how much of one direction is inside a mixture without the other direction getting in the way. Fourier series use exactly this with sine waves." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "A matrix is a machine", mins: 25,
    blurb: "Feed in a vector, get a vector out. Rows are recipes; columns tell you where the arrows land.",
    takeaway: "A matrix times a vector gives a vector. Row view: each output entry is the dot product of one row with the input. Column view: the output is a mix of the columns, weighted by the input's entries: Ax = x₁(column 1) + x₂(column 2). So the columns are exactly where the basic arrows (1, 0) and (0, 1) land. Sizes: an m×n matrix eats an n-vector and returns an m-vector. Node equations are a matrix machine: G·v = i takes node voltages to the currents that must be injected.",
    steps: [
      { k: "learn", title: "Row view: recipes", b: [
        `<div class="eq">${M([[2, 1], [1, 3]])}${V([1, 2])} = ${V(["2·1 + 1·2", "1·1 + 3·2"])} = ${V([4, 7])}</div>`,
        `<p>Each row is a recipe: “take 2 of the first input and 1 of the second”. Each output entry is the dot product of one row with the input vector.</p>`,
      ]},
      { k: "learn", title: "Column view: mixing arrows", b: [
        `<div class="eq">1·${V([2, 1])} + 2·${V([1, 3])} = ${V([4, 7])}</div>`,
        `<p>Same answer, read differently: the output is <b>1 of column 1 plus 2 of column 2</b>. The input's entries say how much of each column to mix in.</p>`,
        `<div class="key"><b>The key picture.</b> Feed in (1, 0) and you get column 1 out. Feed in (0, 1) and you get column 2. <b>The columns are where the two basic arrows land.</b> Everything else follows, because every vector is a mix of those two.</div>`,
      ]},
      { k: "play", title: "Watch the machine act on the whole plane", b: [
        (host, id) => mapWidget(host, id, [1, 0.5, 0, 1], ([a, b, c, d]) => readout([["Matrix", M([[a, b], [c, d]])], ["(1, 0) lands on", `(${fmt(a, 2)}, ${fmt(c, 2)}) = column 1`], ["(0, 1) lands on", `(${fmt(b, 2)}, ${fmt(d, 2)}) = column 2`]])),
        `<p class="aside">The orange arrow is where (1, 0) goes; the blue one, (0, 1). The grid lines stay straight, evenly spaced and parallel: that is what “linear” means. Try the presets, then make your own.</p>`,
      ]},
      { k: "predict", title: "Predict first", b: [
        { t: "mcq", q: "What does the matrix [[0, −1], [1, 0]] do to the plane? (Rows written top first.)", fig: fig(mapFig(1, 0, 0, 1, { label: "The starting grid and letter F" })), opts: [["Rotates it 90° anticlockwise", true, "Column 1 is (0, 1): the orange arrow now points up. Column 2 is (−1, 0): the blue arrow points left. Check it with the Rotate preset."], ["Flips it left to right", false, "A flip would send (1, 0) to (−1, 0). Read column 1: it's (0, 1)."], ["Rotates it 90° clockwise", false, "Column 1 = (0, 1): (1, 0) swings up, which is anticlockwise."]] },
      ]},
      { k: "learn", title: "Why circuits care: G·v = i", b: [
        fig(S.svg(460, 170, S.isrc(40, 95, "I_s", { side: "left" }) + S.wire([40, 77], [40, 30], [130, 30]) + S.res(130, 30, 130, 140, "R₁", {}) + S.res(130, 30, 290, 30, "R₂", {}) + S.res(290, 30, 290, 140, "R₃", {}) + S.wire([40, 113], [40, 140], [290, 140]) + S.dot(130, 30) + S.dot(290, 30) + S.t(130, 20, "1", { cls: "lab" }) + S.t(300, 20, "2", { a: "start", cls: "lab" }) + S.gnd(165, 140), { label: "Two-node circuit: a current source into node 1, R1 to ground, R2 between nodes, R3 from node 2 to ground" })),
        `<p>KCL at each node, with G = 1/R:</p>`,
        `<div class="eq">${M([["G₁+G₂", "−G₂"], ["−G₂", "G₂+G₃"]])}${V(["v₁", "v₂"])} = ${V(["I_s", "0"])}</div>`,
        `<p>The conductance matrix <b>G</b> is a machine: give it node voltages and it returns the currents the sources would have to inject. Solving the circuit means running the machine <b>backwards</b>: we know the currents and want the voltages. That's Part 5.</p>`,
        `<p class="aside">Read the pattern: the diagonal holds the total conductance touching each node; off the diagonal, minus the conductance joining two nodes. Module 25 turns this into a fill-in-the-boxes method.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "[[1, 2], [3, 4]] times (5, 6): first entry of the result?", a: 17, why: "Row 1 · (5, 6) = 5 + 12 = 17." },
        { t: "num", q: "…and the second entry?", a: 39, why: "Row 2 · (5, 6) = 15 + 24 = 39." },
        { t: "mcq", q: "A 3×2 matrix (3 rows, 2 columns) times a 2-entry vector gives…", opts: [["A 3-entry vector", true, "One output per row."], ["A 2-entry vector", false, "The output has as many entries as the matrix has rows."], ["It can't be done", false, "It can: the 2 columns match the 2 entries."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain what the columns of a 2×2 matrix tell you about what it does.", model: "Column 1 is where the arrow (1, 0) ends up and column 2 is where (0, 1) ends up. Since every vector is a mix of those two, knowing where they land tells you where everything lands: the output is the same mix of the columns." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Chaining machines: matrix multiplication", mins: 25,
    blurb: "Do one machine, then another. That's a product, and the order matters.",
    takeaway: "AB means “do B first, then A”: (AB)x = A(Bx). Entry (i, j) of AB = row i of A · column j of B. Sizes: (m×n)(n×p) = m×p; the inner sizes must match. Order matters: AB ≠ BA in general (rotate-then-stretch ≠ stretch-then-rotate). The identity I changes nothing. Chip use: two-port (ABCD) matrices of cascaded stages multiply in order. Series R = [[1, R], [0, 1]], shunt G = [[1, 0], [G, 1]]; a series R then shunt R gives A = 1 + R/R_shunt and an unloaded gain of 1/A, the voltage divider.",
    steps: [
      { k: "learn", title: "Row times column", b: [
        `<div class="eq">${M([[1, 2], [0, 1]])}${M([[3, 0], [1, 1]])} = ${M([["1·3+2·1", "1·0+2·1"], ["0·3+1·1", "0·0+1·1"]])} = ${M([[5, 2], [1, 1]])}</div>`,
        `<p>Entry in row i, column j = <b>row i of the left matrix · column j of the right matrix</b>. It's the row view of Part 2, done once for each column of the right-hand matrix.</p>`,
        { t: "reveal", label: "Now the other order, BA", html: `<div class="eq">${M([[3, 0], [1, 1]])}${M([[1, 2], [0, 1]])} = ${M([[3, 6], [1, 3]])}</div><p>A different answer. <b>Order matters.</b></p>` },
      ]},
      { k: "play", title: "Rotate then stretch, or stretch then rotate?", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const R = [0, -1, 1, 0], St = [2, 0, 0, 1];
          const mul = (A, B) => [A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3], A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]];
          const opts = [["Neither (start)", [1, 0, 0, 1], "I"], ["Rotate 90°, then stretch x ×2", mul(St, R), "S·R"], ["Stretch x ×2, then rotate 90°", mul(R, St), "R·S"]];
          function show(i) {
            const [, m, nm] = opts[i];
            f.innerHTML = mapFig(...m, { k: 32 });
            ro.innerHTML = readout([["Product (rightmost acts first)", nm], ["Matrix", M([[m[0], m[1]], [m[2], m[3]]])]]);
          }
          host.append(toggle(opts.map((o) => o[0]), show, 0), f, ro);
          show(0);
        },
        `<p class="aside">Same two operations, different order, different result: one F ends up tall, the other wide. Matrix products are written right to left: in S·R, R acts first.</p>`,
      ]},
      { k: "learn", title: "Sizes and the identity", b: [
        `<div class="eq">(m×n)·(n×p) = m×p</div>`,
        `<p>The inner sizes must match: each row of the left needs as many entries as each column of the right. The outer sizes give the answer's shape.</p>`,
        `<p>The <b>identity</b> I has 1s on the diagonal and 0s elsewhere. IA = AI = A: the “do nothing” machine.</p>`,
        `<p class="aside">The <b>transpose</b> Aᵀ swaps rows and columns. A matrix with Aᵀ = A is <b>symmetric</b>. Every resistor network's G matrix is symmetric (Module 25 shows why).</p>`,
      ]},
      { k: "math", title: "Chip use: chaining stages", b: [
        `<p>A two-port (a box with an input pair and an output pair) can be written with an <b>ABCD matrix</b>: input (V₁, I₁) = T × output (V₂, I₂). Cascaded stages multiply, in order, like the machines above.</p>`,
        `<div class="two"><div class="tile"><h3>Series resistor R</h3><div class="eq">${M([[1, "R"], [0, 1]])}</div></div><div class="tile"><h3>Shunt conductance G to ground</h3><div class="eq">${M([[1, 0], ["G", 1]])}</div></div></div>`,
        `<p>Series 1 kΩ, then shunt 1 kΩ (G = 1 mS):</p>`,
        `<div class="eq">${M([[1, "1k"], [0, 1]])}${M([[1, 0], ["1m", 1]])} = ${M([[2, "1k"], ["1m", 1]])}</div>`,
        { t: "reveal", label: "What does A = 2 mean?", html: `<p>With nothing connected to the output, I₂ = 0, so V₁ = A·V₂ and the gain is V₂/V₁ = 1/A = <b>1/2</b>. That's the 1 kΩ–1 kΩ voltage divider. The matrix machinery agrees with what you already know, and it keeps working for ten stages, where by-hand loading gets painful.</p>` },
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<p>Someone multiplies</p><div class="eq">${M([[1, 2], [3, 4]])}${M([[5, 6], [7, 8]])} = ${M([[5, 12], [21, 32]])}</div>`,
        { t: "mcq", q: "What went wrong?", opts: [["They multiplied matching entries instead of row × column", true, "Correct: row 1 · column 1 = 5 + 14 = 19. The product is [[19, 22], [43, 50]]."], ["Nothing: that's the product", false, "Check entry (1, 1): row 1 of the left · column 1 of the right = 1·5 + 2·7."], ["They used the wrong order: it should be BA", false, "Order matters, but the error here is the method, not the order."]] },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A is 2×3 and B is 3×4. What is AB?", opts: [["2×4", true, "Inner 3s match; outer sizes give 2×4."], ["3×3", false, "The inner sizes cancel; the outer ones remain."], ["Not defined", false, "It is: 3 columns of A match 3 rows of B."]] },
        { t: "num", q: "Series 3 kΩ, then shunt 1 kΩ. Using ABCD, A = 1 + R·G. Unloaded gain V₂/V₁?", a: 0.25, why: "A = 1 + 3k × 1m = 4, gain 1/4. Divider check: 1k/(3k + 1k) = 0.25." },
        { t: "num", q: "[[2, 0], [1, 3]] × [[1, 4], [2, 1]]: entry in row 2, column 2?", a: 7, why: "Row 2 = (1, 3), column 2 = (4, 1): 4 + 3 = 7." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the order of matrix multiplication matter? Use the rotate/stretch example.", model: "A product means doing one operation after another. Rotating and then stretching sideways stretches the rotated shape, while stretching first and then rotating turns the stretched shape. The two results point in different directions, so AB and BA are different machines." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "The determinant: how much area scales", mins: 25,
    blurb: "One number that says how much a matrix stretches area, whether it flips, and whether it can be undone.",
    takeaway: "det [[a, b], [c, d]] = ad − bc. It is the factor by which the matrix scales area (volume in 3-D). Negative: the plane gets flipped. Zero: the plane is squashed onto a line, information is lost and the matrix has no inverse. 3×3: expand along the top row with signs + − +. In circuits, det G = 0 means the node equations aren't independent: a floating node with no DC path to ground, SPICE's “singular matrix” error.",
    steps: [
      { k: "play", title: "Area in, area out", b: [
        (host, id) => mapWidget(host, id, [1.5, 0.5, 0.5, 1], ([a, b, c, d]) => {
          const D = a * d - b * c;
          return readout([["det = ad − bc", fmt(D, 3)], ["Unit square's area becomes", fmt(Math.abs(D), 3)], ["Verdict", Math.abs(D) < 0.051 ? "squashed flat: no way back" : D < 0 ? "flipped (look at the F)" : "stretched, not flipped"]]);
        }),
        `<p class="aside">The shaded square starts with area 1. After the matrix acts it's a parallelogram of area |det|. Hit Squash: the parallelogram collapses to a line and det = 0. Hit Flip: the F is mirrored and det goes negative.</p>`,
      ]},
      { k: "learn", title: "The 2×2 formula and what it means", b: [
        `<div class="eq">det ${M([["a", "b"], ["c", "d"]])} = ad − bc</div>`,
        `<div class="tbl"><table><tr><th>det</th><th>Meaning</th></tr><tr><td>&gt; 0</td><td>areas scale by det; no flip</td></tr><tr><td>&lt; 0</td><td>areas scale by |det|; plane is flipped</td></tr><tr><td>= 0</td><td>plane squashed to a line (or a point): two different inputs give the same output, so you can't undo it</td></tr></table></div>`,
      ]},
      { k: "learn", title: "3×3: expand along the top row", b: [
        `<p>Take each top-row entry, times the 2×2 determinant left when you cross out its row and column, with signs <b>+ − +</b>:</p>`,
        `<div class="eq">det ${M([[2, -1, 0], [-1, 2, -1], [0, -1, 2]])}</div>`,
        steps([["+2 × det[[2, −1], [−1, 2]]", "2 × (4 − 1) = 6"], ["−(−1) × det[[−1, −1], [0, 2]]", "+1 × (−2 − 0) = −2"], ["+0 × (…)", "0"], ["Total", "4"]]),
        `<p class="aside">This is the G matrix (in siemens) of a ladder of four 1 Ω resistors: node 1 to ground, 1–2, 2–3, 3 to ground. Larger matrices work the same way, but by hand you'd use elimination instead (Module 25).</p>`,
      ]},
      { k: "why", title: "The floating node", b: [
        fig(S.svg(360, 120, S.wire([40, 60], [80, 60]) + S.res(80, 60, 260, 60, "R", {}) + S.wire([260, 60], [320, 60]) + S.dot(80, 60) + S.dot(260, 60) + S.t(80, 92, "node 1", { cls: "lab" }) + S.t(260, 92, "node 2", { cls: "lab" }) + S.t(180, 112, "no path to ground", { cls: "lab" }), { label: "Two nodes joined only by a resistor, with no connection to ground" })),
        `<div class="eq">G = ${M([["G", "−G"], ["−G", "G"]])}   det = G² − G² = 0</div>`,
        `<p>Physically: add 7 V to <i>both</i> nodes and no current changes. Infinitely many voltage answers fit, so the equations can't pick one. The determinant spots it: <b>det = 0</b>.</p>`,
        `<div class="key"><b>Real-world version.</b> A node connected only to capacitors (or to MOSFET gates) has no DC path to ground. At DC a capacitor is an open circuit, so that node floats, the matrix is singular, and SPICE stops with an error like “singular matrix” or “no DC path to ground”.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "det [[3, 1], [2, 4]] = ?", a: 10, why: "3·4 − 1·2 = 10." },
        { t: "mcq", q: "det [[2, 4], [1, 2]] = 0. What does the matrix do to the plane?", opts: [["Squashes it onto a line: column 2 is just 2 × column 1", true, "Both arrows land on the same line, so the whole plane does."], ["Rotates it", false, "A rotation keeps area: det = 1."], ["Doubles every area", false, "That would need det = 2."]] },
        { t: "num", q: "A matrix with det = −3 acts on a shape of area 2 cm². Area afterwards (cm²)?", a: 6, unit: "cm²", why: "|det| × 2 = 6. The minus sign means the shape is mirrored, not that area is negative." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a zero determinant mean a matrix can't be undone?", model: "Zero determinant means the matrix squashes the plane flat, onto a line or a point. Then different inputs land on the same output, so from the output alone you can't tell which input you started with. There's no unique way back, so no inverse." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "The inverse: running the machine backwards", mins: 25,
    blurb: "Undo a matrix, solve a circuit in one line, and read the inverse as a table of transfer resistances.",
    takeaway: "A⁻¹ undoes A: A⁻¹A = I. For 2×2: [[a, b], [c, d]]⁻¹ = (1/det)·[[d, −b], [−c, a]] (swap the diagonal, negate the other two, divide by det). It exists only if det ≠ 0. Solve Ax = b with x = A⁻¹b. For node equations, v = G⁻¹·i, and entry (i, j) of G⁻¹ is a transfer resistance: volts at node i per amp injected at node j. G⁻¹ is symmetric too (reciprocity). In practice simulators never form the inverse; elimination (Module 25) is faster.",
    steps: [
      { k: "learn", title: "The 2×2 recipe", b: [
        `<div class="eq">${M([["a", "b"], ["c", "d"]])}<sup>−1</sup> = <span style="font-size:.8em">1/(ad − bc)</span> ${M([["d", "−b"], ["−c", "a"]])}</div>`,
        `<p><b>Swap</b> the diagonal, <b>negate</b> the other two, <b>divide</b> by the determinant. That's why det = 0 kills it.</p>`,
        `<div class="eq">${M([[2, 1], [1, 3]])}<sup>−1</sup> = <span style="font-size:.8em">1/5</span> ${M([[3, -1], [-1, 2]])}</div>`,
        { t: "reveal", label: "Check it", html: `<div class="eq">${M([[2, 1], [1, 3]])}${M([[3, -1], [-1, 2]])} = ${M([[5, 0], [0, 5]])}</div><p>Divide by 5: the identity. Always worth the 20 seconds.</p>` },
      ]},
      { k: "math", title: "Solve a circuit in one line", b: [
        `<p>Part 2's circuit with R₁ = 1 kΩ, R₂ = 1 kΩ, R₃ = 2 kΩ and I<sub>s</sub> = 3 mA. Work in mS, kΩ, mA and V.</p>`,
        `<div class="eq">${M([[2, -1], [-1, 1.5]])}${V(["v₁", "v₂"])} = ${V([3, 0])}</div>`,
        { t: "reveal", label: "Determinant", html: `<div class="eq">det = 2 × 1.5 − (−1)(−1) = 2</div>` },
        { t: "reveal", label: "Inverse", html: `<div class="eq">G⁻¹ = ½ ${M([[1.5, 1], [1, 2]])} = ${M([[0.75, 0.5], [0.5, 1]])} kΩ</div>` },
        { t: "reveal", label: "Voltages", html: `<div class="eq">v = G⁻¹${V([3, 0])} = ${V(["2.25 V", "1.5 V"])}</div><p>Check KCL at node 2: in through R₂, (2.25 − 1.5)/1k = 0.75 mA; out through R₃, 1.5/2k = 0.75 mA ✓.</p>` },
      ]},
      { k: "why", title: "Read the inverse: transfer resistances", b: [
        `<p>v = G⁻¹·i says: <b>entry (i, j) of G⁻¹ is the voltage at node i per unit current injected at node j</b>. Its units are ohms.</p>`,
        `<ul><li>(G⁻¹)₁₁ = 0.75 kΩ: inject 1 mA at node 1 and node 1 rises 0.75 V. That's the resistance “seen” from node 1 to ground (1k ∥ (1k + 2k) = 0.75k ✓).</li><li>(G⁻¹)₂₁ = 0.5 kΩ: inject at node 1, node 2 rises 0.5 V per mA.</li><li>(G⁻¹)₁₂ = 0.5 kΩ too: inject at node 2, node 1 rises by the same amount.</li></ul>`,
        `<div class="key"><b>Reciprocity.</b> In any resistor network, “push here, measure there” equals “push there, measure here”. That's G⁻¹ being symmetric, and it comes free from G being symmetric.</div>`,
      ]},
      { k: "play", title: "Change the resistors", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let R1 = 1, R2 = 1, R3 = 2, I = 3;
          function draw() {
            const g11 = 1 / R1 + 1 / R2, g12 = -1 / R2, g22 = 1 / R2 + 1 / R3, D = g11 * g22 - g12 * g12;
            const i11 = g22 / D, i12 = -g12 / D, i22 = g11 / D;
            ro.innerHTML = readout([["G (mS)", M([[g11, g12], [g12, g22]])], ["det G", fmt(D, 3)], ["G⁻¹ (kΩ)", M([[i11, i12], [i12, i22]])], ["v₁, v₂", `${fmt(i11 * I, 3)} V, ${fmt(i12 * I, 3)} V`]]);
          }
          host.append(
            slider({ id: id + "-1", label: "R₁ (node 1 to ground)", min: 0.2, max: 10, step: 0.1, value: R1, show: (v) => fmt(v, 3) + " kΩ" }, (v) => { R1 = v; draw(); }).el,
            slider({ id: id + "-2", label: "R₂ (between the nodes)", min: 0.2, max: 10, step: 0.1, value: R2, show: (v) => fmt(v, 3) + " kΩ" }, (v) => { R2 = v; draw(); }).el,
            slider({ id: id + "-3", label: "R₃ (node 2 to ground)", min: 0.2, max: 10, step: 0.1, value: R3, show: (v) => fmt(v, 3) + " kΩ" }, (v) => { R3 = v; draw(); }).el,
            slider({ id: id + "-i", label: "I_s", min: 0, max: 5, step: 0.1, value: I, show: (v) => fmt(v, 3) + " mA" }, (v) => { I = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Watch G⁻¹ stay symmetric whatever you do. Make R₂ huge: the off-diagonal terms shrink towards 0, because the nodes stop talking to each other.</p>`,
      ]},
      { k: "learn", title: "In practice", b: [
        `<ul><li>An inverse exists only when det ≠ 0.</li><li>Computing a full inverse takes about three times the work of solving by elimination, and loses more accuracy to rounding. Circuit simulators <b>never</b> form G⁻¹; they factor G and solve (Module 25).</li><li>The inverse is still the best way to <i>think</i>: it tells you how every node responds to every source.</li></ul>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Inverse of [[4, 0], [0, 2]]?", opts: [["[[0.25, 0], [0, 0.5]]", true, "A diagonal matrix just scales each axis; undo each scale."], ["[[2, 0], [0, 4]]", false, "Swapping the diagonal is only half the recipe: also divide by det = 8."], ["[[−4, 0], [0, −2]]", false, "Negating isn't undoing."]] },
        { t: "num", q: "Inverse of [[1, 2], [3, 4]]: what's the top-left entry?", a: -2, why: "det = 4 − 6 = −2. Top-left = d/det = 4/(−2) = −2. Full inverse: [[−2, 1], [1.5, −0.5]]." },
        { t: "mcq", q: "Why has [[1, 2], [2, 4]] no inverse?", opts: [["Its determinant is 4 − 4 = 0", true, "Row 2 is twice row 1: the matrix squashes the plane onto a line."], ["It isn't symmetric", false, "Symmetry doesn't decide invertibility (and this one is symmetric anyway)."], ["It has no zeros in it", false, "Zeros don't matter; the determinant does."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does entry (2, 1) of G⁻¹ tell you about a circuit?", model: "It's the voltage that appears at node 2 for each amp of current injected into node 1, a transfer resistance. By reciprocity it equals entry (1, 2): pushing current in at node 2 gives the same voltage at node 1." },
      ]},
    ],
  };

  const p6 = {
    id: "p6", title: "Master it", mins: 30,
    blurb: "Mixed problems. Paper first, then type the answer. Use the hints only after a real try.",
    takeaway: "You can now: multiply matrices, read a matrix's columns as where the arrows land, use det for area, flips and solvability, invert a 2×2 and read G⁻¹ as transfer resistances, chain two-ports, and explain SPICE's singular-matrix error.",
    steps: [
      { k: "check", title: "Problem 1: solve with an inverse", b: [
        { t: "num", q: "Solve [[2, −1], [−1, 3]]·x = (1, 2). What is x₁?", a: 1, hint: "det = 6 − 1 = 5. Use the recipe: swap, negate, divide.", hint2: "Inverse = (1/5)[[3, 1], [1, 2]]. Multiply by (1, 2).", why: "x = (1/5)(3 + 2, 1 + 4) = (1, 1). Check row 1: 2 − 1 = 1 ✓." },
      ]},
      { k: "check", title: "Problem 2: the ladder", b: [
        `<p>Four 1 Ω resistors: node 1 to ground, 1–2, 2–3, 3 to ground. Inject 1 A into node 1. G = [[2, −1, 0], [−1, 2, −1], [0, −1, 2]] S.</p>`,
        { t: "num", q: "Voltage at node 3 (V)?", a: 0.25, hint: "Write the three KCL rows. The last row says −v₂ + 2v₃ = 0, so v₂ = 2v₃.", hint2: "Row 2: −v₁ + 2v₂ − v₃ = 0 gives v₁ = 3v₃. Row 1: 2v₁ − v₂ = 1.", why: "6v₃ − 2v₃ = 1, so v₃ = 0.25 V, v₂ = 0.5 V, v₁ = 0.75 V. Each step down the ladder loses some signal." },
      ]},
      { k: "check", title: "Problem 3: area", b: [
        { t: "num", q: "The matrix [[1, 2], [−1, 3]] acts on a 3 cm² shape. New area (cm²)?", a: 15, unit: "cm²", hint: "Area scales by |det|.", why: "det = 3 − (−2) = 5; 5 × 3 = 15 cm²." },
      ]},
      { k: "check", title: "Problem 4: two L-sections", b: [
        `<p>Each section: series 2 kΩ, then shunt 2 kΩ to ground. Two sections in cascade, nothing on the output.</p>`,
        { t: "num", q: "Overall gain V₂/V₁?", a: 0.2, hint: "One section: T = [[1 + RG, R], [G, 1]] = [[2, 2k], [0.5m, 1]]. Square it.", hint2: "Only the top-left entry of T·T matters: 2·2 + 2k·0.5m.", why: "A = 4 + 1 = 5, gain 1/5 = 0.2. By hand: the second section loads the first (2k ∥ 4k = 1.33k), giving 0.4 × 0.5 = 0.2 ✓." },
      ]},
      { k: "check", title: "Problem 5: the simulator error", b: [
        { t: "mcq", q: "A SPICE DC analysis fails with “singular matrix”. Node X connects only to one plate of a capacitor and to a MOSFET gate. Best fix?", opts: [["Give node X a DC path to ground, e.g. a large resistor or a proper bias connection", true, "At DC both elements are open circuits, so X floats and its row of G is all zeros: det G = 0."], ["Make the capacitor bigger", false, "A capacitor is open at DC whatever its size."], ["Use a smaller time step", false, "This is the DC solution; time steps don't enter."]] },
      ]},
      { k: "say", title: "Problem 6: explain it", b: [
        { t: "say", q: "Why is the G matrix of any resistor network symmetric?", model: "A resistor between nodes i and j adds its conductance to both diagonal entries and puts minus that conductance in both off-diagonal spots, (i, j) and (j, i). Every resistor does this symmetrically, so the whole matrix is symmetric. Physically it's reciprocity: the coupling from i to j equals the coupling from j to i." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m24", eyebrow: "Math Toolkit · Module 24", title: "Vectors and Matrices",
    intro: `<p>Six parts: vectors and the dot product, a matrix as a machine, multiplying matrices, the determinant, the inverse, and a set of mastery problems.</p><p>Why a chip designer needs this: every circuit simulator turns your schematic into a matrix equation and solves it. Eigenvalues (Module 26), noise (Module 36) and feedback (Module 37) all lean on the same ideas.</p><p class="aside">Before this: Simultaneous Equations (Module 6). Pictures first, formulas second.</p>`,
    after: `<p>Next, Module 25 turns any circuit into G·v = i by filling in boxes, then solves it the way SPICE does.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <p><b>Vector:</b> ordered list; add entry by entry; scale every entry. <b>Dot product</b> a·b = Σaᵢbᵢ = |a||b|cos θ; zero ⟺ perpendicular. |a| = √(a·a). Power P = v·i.</p>
      <p><b>Matrix × vector:</b> row view (each output = row · input) or column view (mix of columns). Columns = where (1, 0) and (0, 1) land. m×n eats n, returns m.</p>
      <p><b>Product:</b> (AB)ᵢⱼ = row i of A · column j of B. (m×n)(n×p) = m×p. AB ≠ BA in general. AB = do B, then A.</p>
      <div class="eq">det [[a, b], [c, d]] = ad − bc</div>
      <p>|det| = area scale factor; det &lt; 0 flips; det = 0 squashes → no inverse. 3×3: expand top row with + − +.</p>
      <div class="eq">[[a, b], [c, d]]⁻¹ = [[d, −b], [−c, a]] / (ad − bc)</div>
      <p>Solve Ax = b: x = A⁻¹b. G⁻¹ entries are transfer resistances; G and G⁻¹ are symmetric (reciprocity). Floating node → det G = 0 → “singular matrix”.</p>
      <p><b>ABCD:</b> series R [[1, R], [0, 1]], shunt G [[1, 0], [G, 1]]; cascade = multiply in order; unloaded gain = 1/A.</p>`,
  };
  Course.start(window.CHAPTER);
})();
