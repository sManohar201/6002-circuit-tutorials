(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const cell = (v) => (typeof v === "number" ? fmt(Math.abs(v) < 1e-12 ? 0 : v, 3) : v);
  /* Matrix with brackets; entries may be numbers or HTML. rhs (optional) adds an augmented column after a bar. */
  const M = (rows, rhs) => {
    const n = rows[0].length;
    const cells = rows.map((r, i) => r.map((v) => `<span>${cell(v)}</span>`).join("") + (rhs ? `<span style="border-left:2px solid var(--muted);padding-left:12px">${cell(rhs[i])}</span>` : "")).join("");
    return `<span style="display:inline-grid;grid-template-columns:repeat(${n + (rhs ? 1 : 0)},auto);gap:2px 14px;padding:4px 10px;margin:0 4px;border-left:2px solid currentColor;border-right:2px solid currentColor;border-radius:7px;font-family:var(--mono);text-align:center;vertical-align:middle">${cells}</span>`;
  };
  const V = (xs) => M(xs.map((x) => [x]));
  const hl = (v) => `<b style="color:var(--accent)">${cell(v)}</b>`;
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;

  /* The three-node example used all module long (values in kΩ, mS, mA, V). */
  const ladder = (o = {}) => S.svg(580, 170,
    S.isrc(70, 95, "2 mA", { side: "left" }) + S.wire([70, 77], [70, 30], [160, 30]) +
    S.res(160, 30, 160, 140, "1k", {}) + S.res(160, 30, 310, 30, "1k", {}) + S.res(310, 30, 310, 140, "2k", {}) + S.res(310, 30, 460, 30, "1k", {}) + S.res(460, 30, 460, 140, "1k", {}) +
    S.wire([70, 113], [70, 140], [460, 140]) + S.dot(160, 30) + S.dot(310, 30) + S.dot(460, 30) +
    S.t(160, 18, "1", { cls: "lab" }) + S.t(310, 18, "2", { cls: "lab" }) + S.t(460, 18, "3", { cls: "lab" }) + S.gnd(270, 140) +
    (o.names ? S.t(146, 90, "a", { a: "end", cls: "lab" }) + S.t(235, 56, "b", { cls: "lab" }) + S.t(296, 90, "c", { a: "end", cls: "lab" }) + S.t(385, 56, "d", { cls: "lab" }) + S.t(446, 90, "e", { a: "end", cls: "lab" }) : ""),
    { label: "Three-node ladder: 2 mA into node 1; 1k from node 1 to ground; 1k from 1 to 2; 2k from 2 to ground; 1k from 2 to 3; 1k from 3 to ground" });

  const p1 = {
    id: "p1", title: "Fill in the boxes: G by inspection", mins: 25,
    blurb: "Every resistor drops the same little pattern into the matrix. Add them up and you have the circuit's equations.",
    takeaway: "Number the nodes (ground is 0, not in the matrix). Each resistor of conductance G = 1/R between nodes i and j “stamps” +G on (i, i) and (j, j) and −G on (i, j) and (j, i). A resistor from node i to ground stamps only +G on (i, i). A current source pushing I into node i adds +I to row i of the right-hand side (−I to the node it leaves). The result: diagonal = total conductance touching the node; off-diagonal = minus the conductance joining two nodes. That's KCL for every node at once, and it's exactly how SPICE builds its matrix.",
    steps: [
      { k: "learn", title: "Our circuit for this module", b: [
        fig(ladder({ names: true })),
        `<p>Three nodes plus ground. Conductances in mS: a = 1, b = 1, c = 0.5, d = 1, e = 1. The source pushes 2 mA into node 1.</p>`,
        `<p>You could write KCL at each node by hand. Instead, let each element drop its own pattern into the matrix.</p>`,
      ]},
      { k: "learn", title: "The stamp", b: [
        `<div class="two"><div class="tile"><h3>Resistor between i and j</h3><div class="eq" style="font-size:20px">col i  col j<br>${M([["+G", "−G"], ["−G", "+G"]])}</div><p>rows i and j</p></div><div class="tile"><h3>Resistor from i to ground</h3><div class="eq" style="font-size:20px">+G on (i, i)</div><p>Ground isn't in the matrix, so only one box.</p></div></div>`,
        `<div class="tile"><h3>Current source into node i</h3><p>+I in row i of the right-hand side vector (and −I in the row of the node it pulls from, if that isn't ground).</p></div>`,
        { t: "reveal", label: "Why does a resistor stamp exactly that?", html: `<p>The current leaving node i through the resistor is G(vᵢ − vⱼ) = +G·vᵢ − G·vⱼ. That's row i: +G under column i, −G under column j. The same current enters node j, giving row j: −G·vᵢ + G·vⱼ. The stamp is just KCL for that one element.</p>` },
      ]},
      { k: "play", title: "Stamp it, element by element", b: [
        (host) => {
          const els = [["a: 1k, node 1 to ground", [[0, 0, 1]], null], ["b: 1k, between 1 and 2", [[0, 0, 1], [1, 1, 1], [0, 1, -1], [1, 0, -1]], null], ["c: 2k, node 2 to ground", [[1, 1, 0.5]], null], ["d: 1k, between 2 and 3", [[1, 1, 1], [2, 2, 1], [1, 2, -1], [2, 1, -1]], null], ["e: 1k, node 3 to ground", [[2, 2, 1]], null], ["source: 2 mA into node 1", [], [0, 2]]];
          const box = el(`<div class="eq"></div>`), msg = el(`<p></p>`), row = el(`<div class="row"></div>`);
          const nb = el(`<button type="button" class="btn primary">Stamp the next element</button>`), rb = el(`<button type="button" class="btn ghost">Start again</button>`);
          let k = 0;
          function draw() {
            const G = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], I = [0, 0, 0], last = new Set();
            for (let n = 0; n < k; n++) { els[n][1].forEach(([i, j, v]) => { G[i][j] += v; if (n === k - 1) last.add(i + "," + j); }); if (els[n][2]) { I[els[n][2][0]] += els[n][2][1]; if (n === k - 1) last.add("rhs" + els[n][2][0]); } }
            box.innerHTML = `${M(G.map((r, i) => r.map((v, j) => (last.has(i + "," + j) ? hl(v) : v))))}${V(["v₁", "v₂", "v₃"])} = ${V(I.map((v, i) => (last.has("rhs" + i) ? hl(v) : v)))}`;
            msg.innerHTML = k === 0 ? "Empty matrix. Press the button." : `Just stamped <b>${els[k - 1][0]}</b> (highlighted).` + (k === els.length ? " Done: that's the whole circuit." : "");
            nb.disabled = k === els.length;
          }
          nb.addEventListener("click", () => { k = Math.min(els.length, k + 1); draw(); });
          rb.addEventListener("click", () => { k = 0; draw(); });
          row.append(nb, rb);
          host.append(el(fig(ladder({ names: true }))), box, msg, row);
          draw();
        },
        `<p class="aside">Units: mS in the matrix, mA on the right, so the answers come out in volts.</p>`,
      ]},
      { k: "predict", title: "Predict first", b: [
        { t: "mcq", q: "Add a 4th resistor, 500 Ω (2 mS), from node 1 to node 3. Which entries change?", opts: [["(1, 1) and (3, 3) go up by 2; (1, 3) and (3, 1) become −2", true, "The between-nodes stamp, placed at rows and columns 1 and 3."], ["Only (1, 3) and (3, 1)", false, "The diagonals change too: more conductance now touches nodes 1 and 3."], ["Only (1, 1)", false, "That's the stamp for a resistor to ground."]] },
      ]},
      { k: "why", title: "Read a G matrix like a map", b: [
        `<div class="eq">${M([[2, -1, 0], [-1, 2.5, -1], [0, -1, 2]])}</div>`,
        `<ul><li><b>Diagonal:</b> everything touching that node. Node 2 sees 1 + 0.5 + 1 = 2.5 mS.</li><li><b>Off-diagonal:</b> −(conductance joining the two nodes). A 0 means “no resistor between these nodes”.</li><li><b>Symmetric:</b> every stamp is symmetric.</li><li><b>Row sums:</b> each row adds up to that node's conductance to ground. Row 2: −1 + 2.5 − 1 = 0.5 ✓.</li></ul>`,
        `<div class="key"><b>Sanity check you can always do.</b> Diagonal entries positive, off-diagonals ≤ 0, symmetric, and each diagonal at least as big as the rest of its row added up (ignoring signs). A wrong sign or a missing stamp breaks one of these at a glance.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Node 2 of some circuit has 1 kΩ to node 1, 4 kΩ to ground and 2 kΩ to node 3. Its diagonal entry, in mS?", a: 1.75, unit: "mS", why: "1 + 0.25 + 0.5 = 1.75 mS." },
        { t: "num", q: "…and its entry in column 3 (mS)?", a: -0.5, unit: "mS", why: "Minus the conductance joining nodes 2 and 3: −1/2k = −0.5 mS." },
        { t: "mcq", q: "Row 1 of a G matrix is (3, −1, −2) mS. What connects node 1 to ground?", opts: [["Nothing: the row sums to 0", true, "Row sum = conductance to ground = 3 − 1 − 2 = 0."], ["3 mS", false, "That's everything touching node 1, including the 1 mS and 2 mS to other nodes."], ["Can't tell", false, "The row sum tells you."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe how to build a circuit's G matrix by inspection.", model: "Number the nodes, leave ground out. For each resistor, add its conductance to the diagonal entry of each node it touches, and if it joins two nodes, put minus its conductance in the two off-diagonal spots for that pair. Current sources go into the right-hand side vector of the node they push into." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Gaussian elimination", mins: 25,
    blurb: "Clear the numbers below the diagonal, then solve from the bottom up. The method every simulator uses.",
    takeaway: "Forward elimination: use row 1 to make zeros below it in column 1 (subtract a multiple m = entry/pivot of row 1 from each row below), then row 2 for column 2, and so on, until the matrix is upper-triangular. Do the same operations to the right-hand side. Back substitution: the last row has one unknown; solve it, then work upwards. For our ladder: v₃ = 1/3 V, v₂ = 2/3 V, v₁ = 4/3 V. Cost for a dense n×n matrix: about n³/3 multiplications. A zero pivot means swap rows (pivoting); a zero row means a singular matrix.",
    steps: [
      { k: "learn", title: "The idea", b: [
        `<p>A triangular system is easy: the last equation has one unknown, the one above it has two (but you already know one), and so on. <b>Elimination turns any system into a triangular one</b> using a single allowed move:</p>`,
        `<div class="key"><b>Subtract a multiple of one row from another.</b> (Including its right-hand side.) This doesn't change the solution: you're just combining true equations into another true equation.</div>`,
      ]},
      { k: "play", title: "Step through it", b: [
        (host) => {
          const S0 = [[[2, -1, 0], [-1, 2.5, -1], [0, -1, 2]], [2, 0, 0]];
          const ops = [
            ["Start: G | i", S0[0], S0[1], ""],
            ["Row 2 ← Row 2 − (−1/2)·Row 1", [[2, -1, 0], [0, 2, -1], [0, -1, 2]], [2, 1, 0], "The multiplier is (entry to kill)/(pivot) = −1/2. Column 1 below the pivot is now clear."],
            ["Row 3 ← Row 3 − (−1/2)·Row 2", [[2, -1, 0], [0, 2, -1], [0, 0, 1.5]], [2, 1, 0.5], "Pivot is now the 2 in row 2. Multiplier −1/2 again. The matrix is upper-triangular."],
            ["Back substitution: row 3", [[2, -1, 0], [0, 2, -1], [0, 0, 1.5]], [2, 1, 0.5], "1.5·v₃ = 0.5, so v₃ = 1/3 V."],
            ["Back substitution: row 2", [[2, -1, 0], [0, 2, -1], [0, 0, 1.5]], [2, 1, 0.5], "2v₂ − v₃ = 1, so v₂ = (1 + 1/3)/2 = 2/3 V."],
            ["Back substitution: row 1", [[2, -1, 0], [0, 2, -1], [0, 0, 1.5]], [2, 1, 0.5], "2v₁ − v₂ = 2, so v₁ = (2 + 2/3)/2 = 4/3 V. Done."],
          ];
          const box = el(`<div class="eq"></div>`), msg = el(`<p></p>`), row = el(`<div class="row"></div>`);
          const nb = el(`<button type="button" class="btn primary">Next operation</button>`), rb = el(`<button type="button" class="btn ghost">Start again</button>`);
          let k = 0;
          function draw() {
            const [t, A, b, why] = ops[k];
            box.innerHTML = M(A, b);
            msg.innerHTML = `<b>${t}.</b> ${why}`;
            nb.disabled = k === ops.length - 1;
          }
          nb.addEventListener("click", () => { k = Math.min(ops.length - 1, k + 1); draw(); });
          rb.addEventListener("click", () => { k = 0; draw(); });
          row.append(nb, rb);
          host.append(box, msg, row);
          draw();
        },
      ]},
      { k: "why", title: "Check it like an engineer", b: [
        fig(ladder()),
        `<p>v₁ = 4/3, v₂ = 2/3, v₃ = 1/3 V. Does KCL hold at node 2?</p>`,
        { t: "reveal", label: "Check", html: `<p>In from node 1: (4/3 − 2/3)/1k = 2/3 mA. Out to ground: (2/3)/2k = 1/3 mA. Out to node 3: (2/3 − 1/3)/1k = 1/3 mA. In = out ✓.</p><p class="aside">Also notice: node 3 sits on a 1k–1k divider from node 2, so v₃ = v₂/2. The matrix knew that without being told.</p>` },
      ]},
      { k: "learn", title: "Pivots and what can go wrong", b: [
        `<ul><li>The <b>pivot</b> is the diagonal entry you divide by at each stage.</li><li>A <b>zero pivot</b> (or a tiny one) means trouble. Fix: swap in a lower row with a bigger entry in that column. This is <b>pivoting</b>, and every real solver does it.</li><li>If a whole row turns into zeros, the matrix is <b>singular</b> (det = 0, Module 24): a floating node, or a loop of voltage sources.</li></ul>`,
        `<p class="aside">Cost: clearing column 1 touches about n² numbers, column 2 about (n − 1)², …, which adds to about n³/3 multiplications for a dense matrix.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Eliminate: Row 2 = (4, 5 | 6) with pivot row Row 1 = (2, 1 | 3). Multiplier?", a: 2, why: "4/2 = 2. New row 2 = (4, 5 | 6) − 2·(2, 1 | 3) = (0, 3 | 0)." },
        { t: "num", q: "So the system 2x + y = 3, 4x + 5y = 6 has y = ?", a: 0, why: "After elimination, 3y = 0, so y = 0, then 2x = 3 gives x = 1.5." },
        { t: "num", q: "Dense elimination on 1000 unknowns: about how many multiplications? Give the number in millions.", a: 333, unit: "million", tol: 0.05, why: "n³/3 = 10⁹/3 ≈ 333 million. Fine for a laptop. For a million unknowns it would be 3×10¹⁷: hopeless without the trick in Part 3." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is it allowed to subtract a multiple of one equation from another?", model: "Both equations are true for the solution, so any combination of them is also true for the solution. Subtracting a multiple just makes a new true equation with one fewer unknown in it, without changing what the answer is." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "LU and sparsity: how simulators go fast", mins: 20,
    blurb: "Record the elimination once and reuse it. And chip matrices are almost all zeros.",
    takeaway: "Elimination can be stored as G = L·U: U is the triangular result, L holds the multipliers. Factoring costs the n³/3; after that, each new right-hand side costs only about n² (two triangular sweeps). That's why a simulator can sweep sources or step through time cheaply when G doesn't change. Circuit matrices are sparse: each node touches only a few others, so almost every entry is 0. Sparse solvers store and work only on the non-zeros, which makes million-node chip simulations possible. Node ordering matters, because elimination can create new non-zeros (“fill-in”).",
    steps: [
      { k: "learn", title: "Record the recipe", b: [
        `<p>The elimination of Part 2 used two multipliers, both −1/2. Store them in a lower-triangular L; the result is U:</p>`,
        `<div class="eq">${M([[2, -1, 0], [-1, 2.5, -1], [0, -1, 2]])} = ${M([[1, 0, 0], [-0.5, 1, 0], [0, -0.5, 1]])}${M([[2, -1, 0], [0, 2, -1], [0, 0, 1.5]])}</div>`,
        `<p class="aside">G = L·U. Multiply it out to check row 2: −0.5·(2, −1, 0) + (0, 2, −1) = (−1, 2.5, −1) ✓.</p>`,
      ]},
      { k: "why", title: "Why bother?", b: [
        `<p>To solve G·v = i with the factors: first solve L·y = i (top down), then U·v = y (bottom up). Each sweep is about n²/2 work.</p>`,
        `<div class="two"><div class="tile"><h3>Factor once</h3><p>~n³/3. Paid when G changes.</p></div><div class="tile"><h3>Solve many</h3><p>~n² per right-hand side. A DC sweep of a current source, or a transient where the step stays fixed, reuses the same L and U.</p></div></div>`,
      ]},
      { k: "play", title: "How empty is a circuit matrix?", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let n = 20, extra = 0;
          function draw() {
            /* a ladder (tridiagonal) plus a few long-range links */
            const nz = new Set();
            for (let i = 0; i < n; i++) { nz.add(i + "," + i); if (i + 1 < n) { nz.add(i + "," + (i + 1)); nz.add(i + 1 + "," + i); } }
            for (let k = 0; k < extra; k++) { const a = (k * 7) % n, b = (k * 13 + 5) % n; if (a !== b) { nz.add(a + "," + b); nz.add(b + "," + a); } }
            const c = Math.min(14, 300 / n);
            let s = `<rect x="0" y="0" width="${n * c}" height="${n * c}" style="fill:none;stroke:var(--line)"/>`;
            nz.forEach((key) => { const [i, j] = key.split(",").map(Number); s += `<rect x="${j * c + 0.5}" y="${i * c + 0.5}" width="${c - 1}" height="${c - 1}" style="fill:${i === j ? "var(--accent)" : "var(--cool)"}"/>`; });
            f.innerHTML = S.svg(n * c, n * c, s, { label: "Pattern of non-zero entries in the matrix", max: 320 });
            ro.innerHTML = readout([["Entries", fmt(n * n, 4)], ["Non-zero", `${nz.size} (${fmt((100 * nz.size) / (n * n), 2)}%)`], ["At 1 million nodes, a ladder would be", "0.0003% non-zero"]]);
          }
          host.append(f, slider({ id: id + "-n", label: "Nodes in a ladder circuit", min: 5, max: 40, step: 1, value: n }, (v) => { n = v; draw(); }).el,
            slider({ id: id + "-x", label: "Extra cross-links", min: 0, max: 10, step: 1, value: extra }, (v) => { extra = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Each coloured square is a non-zero entry; everything else is 0. A real chip node connects to a handful of neighbours, so the matrix looks like this: a thin band plus scattered dots.</p>`,
      ]},
      { k: "learn", title: "Sparse solvers and fill-in", b: [
        `<ul><li>A sparse solver stores only the non-zeros and skips arithmetic on zeros. For circuit matrices the work grows roughly in proportion to n, not n³.</li><li><b>Fill-in:</b> eliminating a node can create new non-zeros (a new “connection” between its neighbours). Solvers reorder the nodes first to keep fill-in small.</li></ul>`,
        { t: "reveal", label: "See fill-in happen", html: `<p>A star: node 1 in the middle, joined to nodes 2, 3 and 4, which aren't joined to each other. Eliminate node 1 first and every pair of 2, 3, 4 gets a new non-zero entry: the matrix fills in. Eliminate 2, 3 and 4 first and node 1 last, and no new entries appear. Same answer, much less work.</p>` },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A simulator runs a transient with a fixed time step, and the circuit is linear. Why is each step cheap after the first?", opts: [["G stays the same, so L and U are reused; only a new right-hand side is solved", true, "Factor once, solve many."], ["Because the voltages don't change much", false, "Even if they changed a lot, the cost would be the same."], ["Because it skips elimination entirely", false, "It skips re-factoring, not solving."]] },
        { t: "mcq", q: "In a ladder circuit with 10 000 nodes, roughly what fraction of G is non-zero?", opts: [["About 0.03%", true, "≈ 3n non-zeros out of n²: 3/10 000."], ["About 3%", false, "That's 3/100: the fraction for a 100-node ladder."], ["About half", false, "Each row has at most 3 non-zeros."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can a simulator handle a matrix with a million rows?", model: "Because a circuit matrix is sparse: each node only connects to a few others, so nearly every entry is zero. A sparse solver stores and works on just the non-zeros, reorders nodes to keep fill-in small, and factors once to reuse the factors. The work grows roughly with the number of nodes instead of its cube." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Voltage sources: Modified Nodal Analysis", mins: 25,
    blurb: "A voltage source has no conductance to stamp. Give its current a name and add one equation.",
    takeaway: "An ideal voltage source can't be stamped as a conductance (it would be infinite). Modified Nodal Analysis (MNA) adds its current i_V as an extra unknown and its law vᵢ − vⱼ = V as an extra equation. Stamp: +1 in row i and −1 in row j of the new column (i_V leaves node i into the source's + terminal); +1, −1 in the new row under columns i and j; V on the right. The new diagonal entry is 0, so solvers must pivot. A negative i_V means current comes out of the + terminal: the source is delivering power.",
    steps: [
      { k: "why", title: "The problem", b: [
        `<p>A resistor says i = G·Δv. A voltage source says Δv = V, whatever the current. There's no G to stamp: you'd need G = ∞.</p>`,
        `<p>Fix: <b>make the source's current an unknown</b>. One more unknown needs one more equation, and the source supplies it: v<sub>+</sub> − v<sub>−</sub> = V.</p>`,
      ]},
      { k: "learn", title: "A worked MNA system", b: [
        fig(S.svg(420, 160, S.vsrc(50, 90, "5 V", { side: "left" }) + S.wire([50, 72], [50, 30], [130, 30]) + S.res(130, 30, 290, 30, "1k", {}) + S.res(290, 30, 290, 140, "1k", {}) + S.wire([50, 108], [50, 140], [290, 140]) + S.dot(130, 30) + S.dot(290, 30) + S.t(130, 18, "1", { cls: "lab" }) + S.t(300, 18, "2", { a: "start", cls: "lab" }) + S.gnd(170, 140) + S.arrow(72, 38, 72, 64, "i_V", { lx: 80, ly: 54, a: "start" }), { label: "A 5 V source at node 1, 1k from node 1 to node 2, 1k from node 2 to ground" })),
        `<p>Unknowns: v₁, v₂ and i<sub>V</sub> (taken as flowing from node 1 into the source's + terminal). Units mS, V, mA.</p>`,
        `<div class="eq">${M([[1, -1, hl(1)], [-1, 2, hl(0)], [hl(1), hl(0), hl(0)]])}${V(["v₁", "v₂", "i_V"])} = ${V([0, 0, hl(5)])}</div>`,
        `<p class="aside">Highlighted: the source's stamp. Rows 1–2 are KCL (with i<sub>V</sub> leaving node 1). Row 3 is the source's own law, v₁ = 5.</p>`,
      ]},
      { k: "math", title: "Solve it", b: [
        { t: "reveal", label: "Row 3", html: `<div class="eq">v₁ = 5 V</div>` },
        { t: "reveal", label: "Row 2", html: `<div class="eq">−5 + 2v₂ = 0 → v₂ = 2.5 V</div>` },
        { t: "reveal", label: "Row 1", html: `<div class="eq">5 − 2.5 + i_V = 0 → i_V = −2.5 mA</div><p>Negative: the current really flows <i>out</i> of the + terminal into the circuit. The source delivers 5 × 2.5 = 12.5 mW. The sign is information, not a mistake.</p>` },
      ]},
      { k: "why", title: "The zero on the diagonal", b: [
        `<p>Entry (3, 3) is 0. Plain elimination would divide by it at the last stage, or earlier if the source were numbered first. That's why MNA solvers always pivot (swap rows).</p>`,
        `<div class="key"><b>Chip-design echo.</b> Two ideal voltage sources in parallel, or a loop made only of voltage sources and inductors, make the MNA matrix singular. SPICE reports a “voltage source loop”: the same det = 0 idea as the floating node.</div>`,
      ]},
      { k: "play", title: "Try it", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let Vs = 5, R1 = 1, R2 = 1;
          function draw() {
            const G1 = 1 / R1, G2 = 1 / R2, v1 = Vs, v2 = (G1 * v1) / (G1 + G2), iV = -G1 * (v1 - v2);
            ro.innerHTML = readout([["MNA matrix", M([[G1, -G1, 1], [-G1, G1 + G2, 0], [1, 0, 0]])], ["v₁, v₂", `${fmt(v1, 3)} V, ${fmt(v2, 3)} V`], ["i_V", fmt(iV, 3) + " mA"], ["Source power delivered", fmt(-iV * Vs, 3) + " mW"]]);
          }
          host.append(slider({ id: id + "-v", label: "V", min: -10, max: 10, step: 0.5, value: Vs, show: (v) => fmt(v, 3) + " V" }, (v) => { Vs = v; draw(); }).el,
            slider({ id: id + "-1", label: "R between 1 and 2", min: 0.1, max: 10, step: 0.1, value: R1, show: (v) => fmt(v, 3) + " kΩ" }, (v) => { R1 = v; draw(); }).el,
            slider({ id: id + "-2", label: "R from 2 to ground", min: 0.1, max: 10, step: 0.1, value: R2, show: (v) => fmt(v, 3) + " kΩ" }, (v) => { R2 = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Whatever the sign of V, i<sub>V</sub> has the opposite sign: a source driving resistors always delivers power.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "How many unknowns does MNA have for a circuit with 6 non-ground nodes and 2 voltage sources?", opts: [["8", true, "6 node voltages + 2 source currents."], ["6", false, "Each voltage source adds its current as an unknown."], ["4", false, "Sources add unknowns; they don't remove them."]] },
        { t: "num", q: "A 3 V source drives a single 1.5 kΩ resistor to ground. MNA's i_V (mA, with i_V flowing into the + terminal)?", a: -2, unit: "mA", why: "2 mA flows out of the + terminal through the resistor, so i_V = −2 mA." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does Modified Nodal Analysis handle a voltage source?", model: "It can't be written as a conductance, so its current becomes an extra unknown, and its defining law, the voltage difference across it equals V, becomes an extra equation. The source's current appears in the KCL rows of the two nodes it touches." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "Transistors in the matrix", mins: 25,
    blurb: "A small-signal MOSFET is a controlled current source. Its stamp breaks the symmetry, which is what makes amplifiers one-way.",
    takeaway: "A voltage-controlled current source (VCCS) i = g_m(v_c+ − v_c−) flowing from node a to node b stamps +g_m at (a, c+), −g_m at (a, c−), −g_m at (b, c+), +g_m at (b, c−). It sits off the diagonal on one side only, so G is no longer symmetric: the gate controls the drain, but the drain doesn't control the gate. Lost symmetry = lost reciprocity = gain. Small-signal analysis of any transistor circuit is just MNA with g_m and r_o stamps; that's what SPICE's AC analysis does.",
    steps: [
      { k: "learn", title: "The small-signal MOSFET as a stamp", b: [
        `<p>From 6.002 Chapter 8: the small-signal MOSFET (source grounded) is a current g<sub>m</sub>v<sub>gs</sub> flowing from drain to source, plus r<sub>o</sub> from drain to source.</p>`,
        `<div class="two"><div class="tile"><h3>VCCS: g<sub>m</sub>·v<sub>c</sub> leaving node a</h3><p>Row a: +g<sub>m</sub> under the control node's column.<br>Row b: −g<sub>m</sub> there (if b isn't ground).</p></div><div class="tile"><h3>Why only one side?</h3><p>The current depends on v<sub>c</sub>, so the entry goes in <b>column c</b>, <b>row a</b>. Nothing puts a matching entry in row c, column a.</p></div></div>`,
      ]},
      { k: "math", title: "An amplifier with feedback", b: [
        fig(S.svg(560, 215, S.vsrc(70, 130, "v_in", { side: "left" }) + S.wire([70, 112], [70, 80], [110, 80]) + S.res(110, 80, 210, 80, "R_S", {}) + S.wire([210, 80], [250, 80]) + S.dot(250, 80) + S.t(240, 100, "g", { cls: "lab" }) +
          S.wire([250, 80], [250, 40], [300, 40]) + S.res(300, 40, 420, 40, "R_F", {}) + S.wire([420, 40], [460, 40], [460, 80]) + S.dot(460, 80) + S.t(472, 84, "d", { a: "start", cls: "lab" }) +
          S.wire([460, 80], [380, 80], [380, 108]) + S.dep(380, 130, "g_m·v_g", { down: true, side: "left" }) + S.wire([380, 152], [380, 190]) + S.res(460, 80, 460, 190, "R_D", {}) + S.wire([70, 148], [70, 190], [460, 190]) + S.gnd(300, 190), { label: "Small-signal amplifier: source through R_S into gate node g; R_F from g to drain node d; dependent current g_m times v_g from d to ground; R_D from d to ground" })),
        `<p class="aside">The gate draws no current, so node g only has R<sub>S</sub> and R<sub>F</sub> attached.</p>`,
        `<p>Node g: (v<sub>g</sub> − v<sub>in</sub>)G<sub>S</sub> + (v<sub>g</sub> − v<sub>d</sub>)G<sub>F</sub> = 0. Node d: (v<sub>d</sub> − v<sub>g</sub>)G<sub>F</sub> + G<sub>D</sub>v<sub>d</sub> + g<sub>m</sub>v<sub>g</sub> = 0.</p>`,
        `<div class="eq">${M([["G_S+G_F", "−G_F"], [hl("g_m") + "−G_F", "G_F+G_D"]])}${V(["v_g", "v_d"])} = ${V(["G_S·v_in", "0"])}</div>`,
        `<p class="aside">The g<sub>m</sub> sits in row d, column g: the drain current depends on the gate voltage. The matrix is no longer symmetric.</p>`,
      ]},
      { k: "math", title: "Numbers", b: [
        `<p>R<sub>S</sub> = 10 kΩ, R<sub>F</sub> = 100 kΩ, R<sub>D</sub> = 10 kΩ, g<sub>m</sub> = 1 mS, v<sub>in</sub> = 1 (small-signal units). In mS:</p>`,
        `<div class="eq">${M([[0.11, -0.01], [0.99, 0.11]])}${V(["v_g", "v_d"])} = ${V([0.1, 0])}</div>`,
        { t: "reveal", label: "det", html: `<div class="eq">0.11·0.11 − (−0.01)(0.99) = 0.0121 + 0.0099 = 0.022</div>` },
        { t: "reveal", label: "Solve (Cramer, or the 2×2 inverse)", html: `<div class="eq">v_g = 0.1·0.11/0.022 = 0.5     v_d = −0.99·0.1/0.022 = −4.5</div><p>Gain v<sub>d</sub>/v<sub>in</sub> = <b>−4.5</b>. Check KCL at d: −4.5/10k − 5/100k + 1m·0.5 = −0.45 − 0.05 + 0.5 = 0 mA ✓.</p>` },
      ]},
      { k: "play", title: "Turn up g_m", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let gm = 1, RF = 100;
          const GS = 0.1, GD = 0.1;
          function draw() {
            const GF = 1 / RF, a = GS + GF, b = -GF, c = gm - GF, d = GF + GD, D = a * d - b * c;
            const vg = (GS * d) / D, vd = (-c * GS) / D;
            ro.innerHTML = readout([["Matrix (mS)", M([[a, b], [c, d]])], ["Gain v_d/v_in", fmt(vd, 3)], ["Ideal-op-amp limit −R_F/R_S", fmt(-RF / 10, 3)], ["v_g (the “virtual ground” gets closer to 0)", fmt(vg, 3)]]);
          }
          host.append(slider({ id: id + "-g", label: "g_m", min: 0.1, max: 100, log: true, value: gm, show: (v) => fmt(v, 3) + " mS" }, (v) => { gm = v; draw(); }).el,
            slider({ id: id + "-f", label: "R_F", min: 20, max: 500, step: 10, value: RF, show: (v) => fmt(v, 3) + " kΩ" }, (v) => { RF = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">As g<sub>m</sub> grows, the gain heads for −R<sub>F</sub>/R<sub>S</sub> and the gate voltage heads for 0: the inverting op-amp result, now derived from the matrix. Feedback (Module 37) explains why.</p>`,
      ]},
      { k: "why", title: "Symmetry, reciprocity and gain", b: [
        `<p>Module 24 showed a resistor network's G is symmetric, so “push here, measure there” = “push there, measure here”. A passive network can't amplify.</p>`,
        `<div class="key"><b>Gain needs broken symmetry.</b> The g<sub>m</sub> stamp is one-sided: the input steers the output, but the output barely steers the input. Every amplifier, from one transistor to a whole op amp, shows up in the matrix as a lopsided pair of off-diagonal entries.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Common-source stage, no feedback: input node g driven directly, drain node d with R_D and r_o to ground. The KCL row for d is (G_D + g_o)v_d + g_m v_g = 0. Gain v_d/v_g?", opts: [["−g_m(R_D ∥ r_o)", true, "v_d = −g_m v_g/(G_D + g_o), and 1/(G_D + g_o) = R_D ∥ r_o."], ["+g_m R_D", false, "The current flows out of the drain node, so the sign is negative."], ["−g_m(R_D + r_o)", false, "Conductances add, so resistances combine in parallel."]] },
        { t: "num", q: "With g_m = 2 mS, R_D = 20 kΩ, r_o = 20 kΩ: gain magnitude?", a: 20, why: "R_D ∥ r_o = 10 kΩ; 2 mS × 10 kΩ = 20." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a transistor make the circuit matrix non-symmetric, and why does that matter?", model: "The transistor's current source depends on the gate voltage but feeds the drain node, so its entry sits in the drain row under the gate column with nothing matching in the gate row. That lost symmetry means the circuit is no longer reciprocal: signals go one way more than the other, which is exactly what lets it amplify." },
      ]},
    ],
  };

  const p6 = {
    id: "p6", title: "Master it", mins: 30,
    blurb: "Build, eliminate, interpret. Paper first.",
    takeaway: "You can build G and MNA matrices by inspection, solve them by elimination, explain LU reuse and sparsity, stamp a transistor, and read singular-matrix errors. That's how a simulator sees your schematic.",
    steps: [
      { k: "check", title: "Problem 1: build and solve", b: [
        `<p>Node 1: 2 kΩ to ground, 2 kΩ to node 2. Node 2: 1 kΩ to ground. A 3 mA source pushes into node 1.</p>`,
        { t: "num", q: "v₂ (V)?", a: 1.2, hint: "G = [[1, −0.5], [−0.5, 1.5]] mS, i = (3, 0) mA.", hint2: "Eliminate: row 2 + 0.5·row 1 gives (0, 1.25 | 1.5).", why: "v₂ = 1.5/1.25 = 1.2 V, then v₁ = 3 + 0.5 × 1.2 = 3.6 V. KCL at node 2: in (3.6 − 1.2)/2k = 1.2 mA, out 1.2/1k = 1.2 mA ✓." },
      ]},
      { k: "check", title: "Problem 2: a bridge row", b: [
        { t: "mcq", q: "A G matrix has row 3 = (−1, −2, 3, 0) mS and symmetric partners. What does node 3 connect to?", opts: [["1 mS to node 1, 2 mS to node 2, nothing to node 4, nothing to ground", true, "Off-diagonals give the links; row sum 0 means no path to ground from node 3 itself."], ["3 mS to ground", false, "The diagonal is everything touching node 3, not just ground."], ["It's floating", false, "It's connected to nodes 1 and 2; a node is only floating if its whole group has no path to ground."]] },
      ]},
      { k: "check", title: "Problem 3: MNA size", b: [
        { t: "num", q: "A circuit has 40 non-ground nodes, 3 independent voltage sources and 2 inductors (SPICE treats each inductor's current as an unknown too). How many unknowns?", a: 45, hint: "Node voltages, plus one current for each voltage source and each inductor.", why: "40 + 3 + 2 = 45." },
      ]},
      { k: "check", title: "Problem 4: the source-follower stamp", b: [
        `<p>Source follower, small-signal: gate driven by v<sub>in</sub>, drain at ac ground, output node s with R<sub>S</sub> to ground. Transistor current g<sub>m</sub>(v<sub>in</sub> − v<sub>s</sub>) flows into node s.</p>`,
        { t: "num", q: "KCL at s: G_S v_s − g_m(v_in − v_s) = 0. With g_m = 4 mS, R_S = 1 kΩ, gain v_s/v_in?", a: 0.8, hint: "Collect v_s terms: (G_S + g_m)v_s = g_m v_in.", why: "4/(1 + 4) = 0.8. Always a bit under 1: the follower's familiar result." },
      ]},
      { k: "check", title: "Problem 5: why it failed", b: [
        { t: "mcq", q: "A netlist has two ideal 1.8 V sources both connected from VDD to ground. DC analysis fails. Why?", opts: [["Two voltage sources in parallel: the MNA rows are identical and the matrix is singular", true, "Their currents can split any way at all, so there's no unique answer."], ["1.8 V is too low for SPICE", false, "Voltage level doesn't matter."], ["The nodes float", false, "VDD is pinned, very firmly; the problem is the currents."]] },
      ]},
      { k: "say", title: "Problem 6: explain it", b: [
        { t: "say", q: "Walk through what a circuit simulator does with a linear netlist to get the DC node voltages.", model: "It numbers the nodes, then stamps every element into an MNA matrix: conductances for resistors, extra rows and columns for voltage sources and inductors, one-sided gm entries for controlled sources, and sources into the right-hand side. Then it reorders for sparsity, factors the matrix into L and U with pivoting, and solves by forward and back substitution. A singular matrix means a floating node or a source loop." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m25", eyebrow: "Math Toolkit · Module 25", title: "Solving Circuits with Matrices",
    intro: `<p>Six parts: building the conductance matrix by inspection, Gaussian elimination, LU and sparsity, voltage sources (Modified Nodal Analysis), transistors as matrix stamps, and mastery problems.</p><p>By the end you'll know exactly what SPICE does with your schematic, and what its error messages mean.</p><p class="aside">Before this: Module 24 (matrices). Connects to 6.002 Chapters 2–3 (node method) and 8 (small-signal models).</p>`,
    after: `<p>Next: Module 26 asks which directions a matrix leaves unturned. Its answer, eigenvalues, is the same thing as a circuit's natural frequencies.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <p><b>Stamps:</b> resistor i–j: +G at (i,i), (j,j); −G at (i,j), (j,i). To ground: +G at (i,i). Current source into i: +I in row i of RHS.</p>
      <p>G: diagonal = total conductance at the node; off-diagonal = −link; symmetric; row sum = conductance to ground.</p>
      <p><b>Elimination:</b> multiplier = entry/pivot; subtract to clear below each pivot; back-substitute. Dense cost ≈ n³/3. Zero pivot → swap rows. Zero row → singular.</p>
      <p><b>LU:</b> G = LU; factor once (n³/3), solve each RHS in ~n². <b>Sparse:</b> few non-zeros per row; reorder to limit fill-in.</p>
      <p><b>MNA:</b> voltage source adds unknown i_V and row vᵢ − vⱼ = V. Zero diagonal → pivoting. i_V &lt; 0 (into +) = source delivers power.</p>
      <p><b>VCCS</b> g_m·v_c from a to b: +g_m at (a, c), −g_m at (b, c) (and opposite signs under c−). Non-symmetric → non-reciprocal → gain. CS gain −g_m(R_D ∥ r_o); follower g_mR_S/(1 + g_mR_S).</p>
      <p><b>Singular matrix</b> = floating node (no DC path to ground) or a loop of voltage sources/inductors.</p>`,
  };
  Course.start(window.CHAPTER);
})();
