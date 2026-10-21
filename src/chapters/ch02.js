(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const pl = (pts) => pts.map((p) => p.join(",")).join(" ");
  const COLORS = ["var(--accent)", "var(--cool)", "var(--good)", "var(--bad)"];

  /* ---------- the ladder circuit used all chapter (book Fig 2.1) ---------- */
  const LADDER_NODES = [
    { name: "a", segs: [[[50, 92], [50, 30], [90, 30]]], lx: 40, ly: 22 },
    { name: "b", segs: [[[190, 30], [230, 30]]], lx: 210, ly: 18 },
    { name: "c", segs: [[[320, 30], [350, 30]]], lx: 350, ly: 18 },
    { name: "d", segs: [[[50, 128], [50, 190], [350, 190]]], lx: 200, ly: 212 },
  ];
  function ladderParts(lab = ["R1", "R2", "R3", "R4"], v = "V") {
    return S.res(90, 30, 190, 30, lab[0]) + S.res(210, 30, 210, 190, lab[1]) + S.res(230, 30, 320, 30, lab[2]) + S.res(350, 30, 350, 190, lab[3]) + S.vsrc(50, 110, v) + S.dot(210, 30) + S.dot(210, 190);
  }
  function ladderFig(o = {}) {
    let s = LADDER_NODES.map((n) => n.segs.map((g) => `<polyline class="w" points="${pl(g)}"/>`).join("")).join("") + ladderParts(o.lab, o.v);
    return S.svg(420, 225, s + (o.extra || ""), { max: 420, label: o.label || "A source and four resistors" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Circuit vocabulary: nodes, branches, loops", mins: 15,
    blurb: "The words every circuit equation is built from.",
    takeaway: "A node is a whole connected piece of ideal wire, a branch is one element, and a loop is any closed path through branches.",
    steps: [
      { k: "learn", title: "Three words", b: [
        `<div class="fig">${ladderFig()}</div>`,
        `<div class="two">
          <div class="tile"><h3>Branch</h3><p>One two-terminal element. This circuit has 5: the source and four resistors.</p></div>
          <div class="tile"><h3>Node</h3><p>A point where two or more element terminals are joined by wire.</p></div>
          <div class="tile"><h3>Loop</h3><p>Any closed path you can trace along branches, back to where you started.</p></div>
        </div>`,
        `<p>"Solving" a circuit means finding the voltage across and current through every branch.</p>`,
      ]},
      { k: "play", title: "Find every node", b: [
        `<p>Tap the wires. Each tap lights up the <b>whole</b> connected piece of wire it belongs to.</p>`,
        (host) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div class="feedback" aria-live="polite">Nodes found: 0</div>`);
          const found = [];
          function draw() {
            let s = "";
            LADDER_NODES.forEach((n, k) => {
              const on = found.includes(k);
              n.segs.forEach((g) => { s += `<polyline class="w" points="${pl(g)}" ${on ? `style="stroke:${COLORS[found.indexOf(k)]};stroke-width:6"` : ""}/>`; });
              if (on) s += `<text x="${n.lx}" y="${n.ly}" text-anchor="middle" class="big" style="fill:${COLORS[found.indexOf(k)]}">${n.name}</text>`;
            });
            s += ladderParts();
            LADDER_NODES.forEach((n, k) => n.segs.forEach((g) => { s += `<polyline class="hit" data-k="${k}" tabindex="0" role="button" aria-label="Wire" points="${pl(g)}"/>`; }));
            fig.innerHTML = S.svg(420, 225, s, { max: 420, label: "Tap wires to find nodes" });
            fig.querySelectorAll(".hit").forEach((h) => {
              const go = () => { const k = +h.dataset.k; if (!found.includes(k)) found.push(k); draw(); };
              h.addEventListener("click", go);
              h.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
            });
            ro.className = "feedback" + (found.length === 4 ? " ok" : "");
            ro.innerHTML = `Nodes found: <b>${found.length}</b>` + (found.length === 4 ? ". That's all of them. Notice the long bottom wire is <b>one</b> node, even though it touches three elements far apart." : "");
          }
          host.append(fig, ro);
          draw();
        },
        { t: "num", q: "How many nodes does this circuit have?", a: 4, hint: "Count the separate colored wire pieces.", why: "4 nodes: a, b, c, d." },
        { t: "num", q: "How many branches?", a: 5, hint: "One branch per element.", why: "5 branches: V, R1, R2, R3, R4." },
      ]},
      { k: "predict", title: "A spread-out node", b: [
        { t: "mcq", q: "Four elements hang off one long ideal wire that bends around a corner. How many nodes does that wire make?",
          fig: `<div class="fig">${S.svg(380, 180, S.wire([30, 40], [350, 40], [350, 150]) + ["A", "B", "C"].map((n, k) => S.wire([70 + k * 110, 40], [70 + k * 110, 70]) + S.box(50 + k * 110, 70, 40, 40, n)).join("") + S.wire([350, 150], [320, 150]) + S.box(280, 130, 40, 40, "D") + S.dot(70, 40) + S.dot(180, 40) + S.dot(290, 40), { max: 380, label: "Four elements on one bent wire" })}</div>`,
          opts: [
            ["1", true, "Ideal wire has no voltage drop anywhere along it, so the whole piece is one electrical point. A node doesn't have to be a single dot in space."],
            ["3, one for each dot", false, "The dots are just drawing habits. They're all joined by ideal wire, so they're the same node."],
            ["4, one per element", false, "Count connected wire pieces, not elements."],
          ]},
      ]},
      { k: "learn", title: "Two kinds of equations", b: [
        `<p>Each branch has a <b>branch voltage</b> and a <b>branch current</b>, labeled with associated variables (Chapter 1). Every circuit problem is built from two kinds of equations:</p>`,
        `<div class="two"><div class="tile"><h3>Element laws</h3><p>What each part does by itself. v = iR, v = V, i = I… (Chapter 1)</p></div><div class="tile"><h3>Connection laws</h3><p>How parts constrain each other once wired together: <b>KCL</b> and <b>KVL</b>. Next two parts.</p></div></div>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In your own words, why can a node be spread out over a long wire?", model: "Because the wire is ideal, there's no voltage difference anywhere along it. Every point on that wire is electrically the same place, so the whole connected wire counts as a single node." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  function nodeFig(items, o = {}) {
    // items: [ [dir: 'L'|'R'|'U'|'D', into: bool, label] ]
    const c = [170, 100], pos = { L: [40, 100], R: [300, 100], U: [170, 10], D: [170, 190] };
    let s = "";
    items.forEach(([d, into, lab]) => {
      const p = pos[d];
      s += S.wire(p, c);
      const a = [p[0] + (c[0] - p[0]) * 0.25, p[1] + (c[1] - p[1]) * 0.25], b = [p[0] + (c[0] - p[0]) * 0.7, p[1] + (c[1] - p[1]) * 0.7];
      s += into ? S.arrow(a[0], a[1], b[0], b[1], "") : S.arrow(b[0], b[1], a[0], a[1], "");
      const lx = d === "L" ? 90 : d === "R" ? 250 : 200, ly = d === "U" ? 50 : d === "D" ? 160 : 86;
      s += S.t(lx, ly, lab, { cls: "c", a: d === "U" || d === "D" ? "start" : "middle" });
    });
    return S.svg(340, 200, s + S.dot(170, 100) + (o.extra || ""), { max: 340, label: o.label || "Currents at a node" });
  }
  const p2 = {
    id: "p2", title: "KCL: what flows in must flow out", mins: 20,
    blurb: "Kirchhoff's current law, signs, and series elements.",
    takeaway: "KCL: the currents into any node add up to zero. A node can't store charge, so whatever flows in flows out.",
    steps: [
      { k: "learn", title: "Kirchhoff's current law", b: [
        `<div class="key"><b>KCL:</b> the sum of all currents flowing <b>into</b> a node is zero.</div>`,
        `<p>Why? Chapter 1's rule 2: no charge may pile up at a node. If more flowed in than out, charge would build up there. So KCL is just <b>conservation of charge</b>.</p>`,
        `<p>Water picture: at a pipe junction, the water arriving each second equals the water leaving.</p>`,
        `<div class="eq">i₁ + i₂ + … + i<sub>N</sub> = 0   (all drawn into the node)</div>`,
      ]},
      { k: "play", title: "Balance a node", b: [
        `<p>All four arrows are <b>drawn</b> pointing in. Set three currents, and KCL decides the fourth. Watch the dots for the <b>real</b> direction.</p>`,
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const v = [3, -1, 2];
          function draw() {
            const i4 = -(v[0] + v[1] + v[2]);
            const all = [...v, i4], dirs = ["L", "U", "R", "D"];
            const pos = { L: [40, 100], R: [300, 100], U: [170, 10], D: [170, 190] };
            let flows = "";
            all.forEach((x, k) => { flows += S.flow([pos[dirs[k]], [170, 100]], x, 1.2); });
            fig.innerHTML = nodeFig(dirs.map((d, k) => [d, true, (k === 3 ? "i₄ = " : "i" + "₁₂₃"[k] + " = ") + fmt(all[k]) + " A"]), { extra: flows });
            const parts = all.map((x) => (x < 0 ? "(" + fmt(x) + ")" : fmt(x)));
            ro.innerHTML = `<div class="eq">${parts.join(" + ")} = 0</div><p class="aside">A negative value means the current really flows <b>out</b>, against the drawn arrow. i₄ = ${fmt(i4)} A, so ${fmt(Math.abs(i4))} A actually flows ${i4 > 0 ? "in" : i4 < 0 ? "out" : "nowhere"} on that wire.</p>`;
          }
          const box = el(`<div class="sliders"></div>`);
          ["i₁ (left)", "i₂ (top)", "i₃ (right)"].forEach((lab, k) => box.appendChild(slider({ id: id + "-" + k, label: lab, min: -5, max: 5, step: 0.5, value: v[k], show: (x) => fmt(x) + " A" }, (x) => { v[k] = x; draw(); }).el));
          host.append(fig, box, ro);
          draw();
        },
      ]},
      { k: "learn", title: "Three ways to say the same thing", b: [
        `<div class="tbl"><table><tbody>
          <tr><td>Sum into the node = 0</td><td class="mono">Σ i<sub>in</sub> = 0</td></tr>
          <tr><td>Sum out of the node = 0</td><td class="mono">Σ i<sub>out</sub> = 0</td></tr>
          <tr><td>What goes in = what comes out</td><td class="mono">Σ in = Σ out</td></tr></tbody></table></div>`,
        `<p>Use whichever is easiest. Just be consistent about each arrow's direction.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Find i.", fig: `<div class="fig">${nodeFig([["L", true, "4 A"], ["U", true, "1 A"], ["R", false, "7 A"], ["D", true, "i"]])}</div>`, a: 2, unit: "A", hint: "Everything flowing in (4 A, 1 A and i) must equal everything flowing out (7 A).", why: "4 + 1 + i = 7, so i = 2 A." },
        { t: "num", q: "Now find i here.", fig: `<div class="fig">${nodeFig([["L", true, "6 A"], ["D", true, "i"], ["R", false, "2 A"]])}</div>`, a: -4, unit: "A", hint: "Same idea: in = out. Don't be afraid of a negative answer.", why: "6 + i = 2, so i = −4 A." },
        { t: "mcq", q: "What does i = −4 A mean physically?", opts: [
          ["4 A really flows out of the node on that wire, against the drawn arrow", true, "The arrow was a guess. The minus sign says the guess was backwards. Nothing is wrong with the analysis."],
          ["The answer is impossible", false, "Negative currents are fine. They just point the other way."],
          ["4 A flows in", false, "The arrow points in, and the value is negative, so the real flow is out."],
        ]},
      ]},
      { k: "learn", title: "Series elements share one current", b: [
        `<div class="fig">${S.svg(380, 90, S.wire([20, 45], [60, 45]) + S.res(60, 45, 160, 45, "") + S.wire([160, 45], [220, 45]) + S.res(220, 45, 320, 45, "") + S.wire([320, 45], [360, 45]) + S.dot(190, 45) + S.arrow(165, 70, 185, 70, "i₁", { ly: 86 }) + S.arrow(195, 70, 215, 70, "i₂", { ly: 86 }), { max: 380, label: "Two elements in series" })}</div>`,
        `<p>At the node between two series elements, only two wires meet. KCL gives <span class="mono">i₁ = i₂</span>. The current has nowhere else to go.</p>`,
        `<div class="key">Elements in <b>series</b> all carry the <b>same current</b>.</div>`,
      ]},
      { k: "why", title: "One equation comes free", b: [
        `<p>For the ladder circuit (4 nodes) you could write KCL at all 4 nodes. But only 3 of them carry new information.</p>`,
        { t: "mcq", q: "Why is the last node's KCL equation always redundant?", opts: [
          ["Every branch current enters one node and leaves another, so adding all the node equations gives 0 = 0", true, "Each current appears once with + and once with −. So the last equation is just a combination of the others. N nodes give N − 1 independent KCL equations."],
          ["The last node is always ground, which doesn't obey KCL", false, "Every node obeys KCL. The point is that the information is already contained in the others."],
          ["It isn't. You need all N equations", false, "Try adding them up: everything cancels."],
        ]},
        `<div class="key">A circuit with <b>N nodes</b> has <b>N − 1</b> independent KCL equations.</div>`,
      ]},
      { k: "bug", title: "What's wrong with this circuit?", b: [
        `<div class="fig">${S.svg(260, 180, S.wire([60, 72], [60, 20], [200, 20], [200, 72]) + S.wire([60, 108], [60, 160], [200, 160], [200, 108]) + S.isrc(60, 90, "1 A") + S.isrc(200, 90, "2 A", { side: "right", down: true }), { max: 260, label: "Two current sources in one loop" })}</div>`,
        { t: "mcq", q: "A 1 A current source and a 2 A current source are wired in one loop. What's the problem?", opts: [
          ["It breaks KCL. Each source demands a different current through the same series loop", true, "Series elements must share one current, but the sources insist on 1 A and 2 A. Charge would have to pile up at the nodes. The book doesn't study circuits like this: in real life something would 'give'."],
          ["Nothing. The currents add to 3 A", false, "In a single loop there's only one current. Two sources can't both set it."],
          ["Current sources can't be drawn pointing down", false, "Direction is fine. The problem is that the two values disagree."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain KCL to a friend using the idea of charge, not just the formula.", model: "Charge can't be created, destroyed or stored at a node. So every bit of charge flowing into a junction each second has to flow out each second. Add up the currents with signs (in positive, out negative) and you get zero." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "KVL: every loop comes home", mins: 20,
    blurb: "Kirchhoff's voltage law, the sign rule, and parallel elements.",
    takeaway: "KVL: the voltages around any closed loop add up to zero. Voltage works like height: walk any loop back to the start and you've climbed exactly as much as you've dropped.",
    steps: [
      { k: "learn", title: "Voltage is like height", b: [
        `<p>Every node has a "height" (its potential). A branch voltage is the height difference between its two ends.</p>`,
        `<p>Walk a hiking loop and return to your car: total climbing minus total descending is <b>zero</b>. Same for voltage.</p>`,
        `<div class="key"><b>KVL:</b> the sum of branch voltages around any closed loop is zero.</div>`,
        `<p>Another way to say it: the voltage between two nodes is the <b>same along every path</b>. That's Chapter 1's rule 1 again. KVL is a statement of <b>energy conservation</b> for a unit charge.</p>`,
      ]},
      { k: "play", title: "Walk the loop", b: [
        `<p>Sign rule from the book: going around, give each voltage <b>the sign you meet first</b>. Enter at + → add it. Enter at − → subtract it.</p>`,
        (host) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const H = { c: 0, a: 9, b: 5 };
          const routes = [
            { name: "Clockwise", seq: [["c", "a", "source", -9, "meet − first"], ["a", "b", "R1", +4, "meet + first"], ["b", "c", "R2", +5, "meet + first"]] },
            { name: "Counterclockwise", seq: [["c", "b", "R2", -5, "meet − first"], ["b", "a", "R1", -4, "meet − first"], ["a", "c", "source", +9, "meet + first"]] },
          ];
          let r = 0, k = 0;
          const NP = { a: [60, 40], b: [240, 40], c: [150, 190] };
          function draw() {
            const R = routes[r], done = R.seq.slice(0, k), sum = done.reduce((t, x) => t + x[3], 0);
            const cur = k === 0 ? "c" : R.seq[k - 1][1];
            const hl = (name) => done.some((x) => x[2] === name);
            let s = S.wc(hl("source") ? "hl" : "", [60, 92], [60, 40]) + S.wc(hl("source") ? "hl" : "", [60, 128], [60, 190], [150, 190]) +
              S.res(60, 40, 240, 40, "R1: 4 V", { cls: hl("R1") ? "hl" : "" }) + S.res(240, 40, 240, 190, "R2: 5 V", { side: "left", cls: hl("R2") ? "hl" : "" }) + S.wc(hl("R2") ? "hl" : "", [240, 190], [150, 190]) +
              S.vsrc(60, 110, "9 V") + S.t(80, 32, "+", { cls: "a" }) + S.t(222, 32, "−", { cls: "a" }) + S.t(256, 62, "+", { cls: "a" }) + S.t(256, 182, "−", { cls: "a" }) +
              S.t(48, 30, "a", { cls: "big" }) + S.t(252, 30, "b", { cls: "big" }) + S.t(150, 212, "c", { cls: "big" });
            s += `<circle cx="${NP[cur][0]}" cy="${NP[cur][1]}" r="9" style="fill:var(--accent);stroke:var(--card);stroke-width:3"/>`;
            // altitude panel
            const Y = (v) => 190 - v * 16;
            s += `<line x1="330" y1="${Y(0)}" x2="330" y2="${Y(10)}" class="w dim"/>` + [0, 5, 9].map((v) => `<line x1="324" y1="${Y(v)}" x2="336" y2="${Y(v)}" class="w"/>` + S.t(316, Y(v) + 4, v + " V", { a: "end", cls: "s m" })).join("");
            Object.entries(H).forEach(([n, v]) => { s += `<circle cx="360" cy="${Y(v)}" r="5" class="nd"/>` + S.t(374, Y(v) + 5, n, { a: "start" }); });
            s += `<circle cx="360" cy="${Y(H[cur])}" r="9" style="fill:var(--accent);opacity:.7"/>` + S.t(345, 12, "height", { cls: "s m" });
            fig.innerHTML = S.svg(400, 225, s, { max: 400, label: "Walking around a loop" });
            ro.innerHTML = `<div class="tbl"><table><thead><tr><th>Step</th><th>Through</th><th>Rule</th><th>Adds</th></tr></thead><tbody>${done.map((x) => `<tr><td>${x[0]} → ${x[1]}</td><td>${x[2]}</td><td>${x[4]}</td><td class="mono">${x[3] > 0 ? "+" : "−"}${Math.abs(x[3])}</td></tr>`).join("")}</tbody></table></div><div class="eq">Running total: ${fmt(sum)} V ${k === 3 ? "✓ back home, total 0" : ""}</div>`;
            stepBtn.disabled = k === 3;
          }
          const stepBtn = el(`<button type="button" class="btn primary">Take the next step</button>`);
          stepBtn.addEventListener("click", () => { k = Math.min(3, k + 1); draw(); });
          const again = el(`<button type="button" class="btn ghost">Start over</button>`);
          again.addEventListener("click", () => { k = 0; draw(); });
          const btnRow = el(`<div class="row"></div>`);
          btnRow.append(stepBtn, again);
          host.append(toggle(routes.map((x) => x.name), (j) => { r = j; k = 0; draw(); }), fig, btnRow, ro);
          draw();
        },
        `<p class="aside">Either direction gives zero. The equation just comes out multiplied by −1.</p>`,
      ]},
      { k: "check", title: "Find the missing voltage", b: [
        { t: "num", q: "Around this loop, what is v?", fig: `<div class="fig">${S.svg(320, 210,
            S.wire([60, 82], [60, 30], [90, 30]) + S.res(90, 30, 230, 30, "5 V") + S.wire([230, 30], [260, 30]) + S.res(260, 30, 260, 180, "v", { side: "right" }) + S.wire([260, 180], [230, 180]) + S.res(230, 180, 90, 180, "3 V", { side: "below" }) + S.wire([90, 180], [60, 180], [60, 118]) + S.vsrc(60, 100, "12 V") +
            S.t(100, 22, "+", { cls: "a" }) + S.t(220, 22, "−", { cls: "a" }) + S.t(276, 52, "+", { cls: "a" }) + S.t(276, 172, "−", { cls: "a" }) + S.t(220, 172, "+", { cls: "a" }) + S.t(100, 172, "−", { cls: "a" }),
            { max: 320, label: "A loop with one unknown voltage" })}</div>`, a: 4, unit: "V", hint: "Walk clockwise from the bottom-left corner: up through the source (meet − first), then each resistor (meet + first). Set the total to 0.", why: "−12 + 5 + v + 3 = 0, so v = 4 V. The source's 12 V is shared out as 5 + 4 + 3." },
      ]},
      { k: "learn", title: "Parallel elements share one voltage", b: [
        `<div class="fig">${S.svg(300, 160, S.wire([60, 20], [240, 20]) + S.wire([60, 140], [240, 140]) + S.res(100, 20, 100, 140, "") + S.res(200, 20, 200, 140, "") + S.dot(100, 20) + S.dot(200, 20) + S.dot(100, 140) + S.dot(200, 140) + S.t(124, 85, "v₁", { cls: "a" }) + S.t(224, 85, "v₂", { cls: "a" }), { max: 300, label: "Two elements in parallel" })}</div>`,
        `<p>Two elements in parallel connect the same two nodes. Walk the little loop between them: <span class="mono">v₁ − v₂ = 0</span>.</p>`,
        `<div class="key">Elements in <b>parallel</b> all have the <b>same voltage</b>. (Mirror image of series → same current.)</div>`,
      ]},
      { k: "predict", title: "How many loop equations do you need?", b: [
        `<div class="fig">${ladderFig()}</div>`,
        `<p>You could draw many loops here, but only some give new information. The book's count: a circuit with <b>B branches</b> and <b>N nodes</b> has <b>B − N + 1</b> independent loops.</p>`,
        { t: "num", q: "How many independent KVL equations does the ladder circuit have?", a: 2, hint: "B = 5 branches, N = 4 nodes.", why: "5 − 4 + 1 = 2. For example the left window (V, R1, R2) and the right window (R2, R3, R4). The big outer loop adds nothing new: it's the sum of the two." },
        { t: "mcq", q: "Why does the outer loop (V, R1, R3, R4) add nothing new?", opts: [
          ["Adding the two window equations gives it, because R2's voltage cancels", true, "R2 is walked once in each direction, so it drops out and you're left with the outer loop. It's already 'known'."],
          ["It's too big to count", false, "Size has nothing to do with it. It's about whether the equation can be built from others."],
          ["Outer loops never obey KVL", false, "Every loop obeys KVL. This one just isn't independent."],
        ]},
      ]},
      { k: "bug", title: "What's wrong with this circuit?", b: [
        `<div class="fig">${S.svg(260, 170, S.wire([60, 72], [60, 20], [200, 20], [200, 72]) + S.wire([60, 108], [60, 150], [200, 150], [200, 108]) + S.vsrc(60, 90, "1 V") + S.vsrc(200, 90, "2 V", { side: "right" }), { max: 260, label: "Two voltage sources in parallel" })}</div>`,
        { t: "mcq", q: "A 1 V source sits in parallel with a 2 V source. What's the problem?", opts: [
          ["It breaks KVL. Parallel elements must share one voltage, but they insist on 1 V and 2 V", true, "Walk the loop: −1 + 2 ≠ 0. A real version would push enormous current and damage the sources. Same as the mismatched batteries in Chapter 1."],
          ["Nothing. You get 1.5 V", false, "Ideal sources don't compromise. Each holds its own value no matter what."],
          ["Nothing. You get 3 V", false, "That's what happens in series. In parallel they fight."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is KVL really a statement about energy?", model: "Voltage is the energy per unit charge needed to move between two points. If you carry a charge around a closed loop and back to the start, it ends with the same energy it began with. So the gains and losses (the branch voltages) must add up to zero." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "The basic method", mins: 25,
    blurb: "A four-step recipe that solves any circuit, plus an energy check.",
    takeaway: "Label everything, write element laws, write KCL and KVL, then solve. A circuit with B branches has 2B unknowns and exactly 2B independent equations. Power supplied always equals power absorbed.",
    steps: [
      { k: "learn", title: "The recipe", b: [
        `<ol><li><b>Label</b> every branch current and voltage. Any direction you like, but follow associated variables on each branch.</li><li><b>Element laws</b> for every element.</li><li><b>KCL</b> at N − 1 nodes and <b>KVL</b> around B − N + 1 loops.</li><li><b>Solve</b> the equations together.</li></ol>`,
        `<p>Steps 1–3 are bookkeeping. Step 4 is just algebra.</p>`,
      ]},
      { k: "play", title: "Count the equations", b: [
        (host) => {
          const ro = el(`<div></div>`), fig = el(`<div class="fig"></div>`);
          const cs = [
            ["Source + one resistor", 2, 2, S.svg(260, 150, S.wire([60, 57], [60, 20], [200, 20], [200, 30]) + S.res(200, 30, 200, 130, "R", { side: "right" }) + S.wire([200, 130], [60, 130], [60, 93]) + S.vsrc(60, 75, "V"), { max: 260 })],
            ["Voltage divider", 3, 3, S.svg(260, 200, S.wire([60, 82], [60, 20], [200, 20]) + S.res(200, 20, 200, 100, "R1", { side: "right" }) + S.res(200, 100, 200, 180, "R2", { side: "right" }) + S.wire([200, 180], [60, 180], [60, 118]) + S.vsrc(60, 100, "V") + S.dot(200, 100), { max: 260 })],
            ["Ladder circuit", 5, 4, ladderFig()],
          ];
          function pick(k) {
            const [, B, N, f] = cs[k];
            fig.innerHTML = f;
            ro.innerHTML = readout([["Branches B", B], ["Nodes N", N], ["Unknowns 2B", 2 * B], ["Element laws", B], ["KCL: N − 1", N - 1], ["KVL: B − N + 1", B - N + 1], ["Total equations", B + (N - 1) + (B - N + 1)]]);
          }
          host.append(toggle(cs.map((c) => c[0]), pick), fig, ro);
          pick(0);
        },
        `<div class="key">Equations always match unknowns: B + (N − 1) + (B − N + 1) = <b>2B</b>. That's why the method always works.</div>`,
      ]},
      { k: "play", title: "Run the recipe on a tiny circuit", b: [
        (host) => {
          const fig = S.svg(300, 170, S.wire([70, 67], [70, 20], [230, 20], [230, 40]) + S.res(230, 40, 230, 130, "5 Ω", { side: "right" }) + S.wire([230, 130], [230, 150], [70, 150], [70, 103]) + S.isrc(70, 85, "2 A") +
            S.t(110, 62, "+", { cls: "a" }) + S.t(110, 118, "−", { cls: "a" }) + S.t(118, 90, "v₁", { cls: "a", a: "start" }) + S.arrow(92, 22, 92, 52, "i₁", { lx: 84, ly: 42, a: "end" }) +
            S.t(205, 62, "+", { cls: "a" }) + S.t(205, 118, "−", { cls: "a" }) + S.t(196, 90, "v₂", { cls: "a", a: "end" }) + S.arrow(275, 30, 275, 60, "i₂", { lx: 284, ly: 50, a: "start" }), { max: 300, label: "Current source and resistor with labels" });
          const steps = [
            ["1 · Label", "Both branches labeled with the current arrow entering the + terminal (associated)."],
            ["2 · Element laws", "Source: <span class='mono'>i₁ = −2 A</span> (it pushes 2 A up, against the i₁ arrow).<br>Resistor: <span class='mono'>v₂ = 5 i₂</span>"],
            ["3 · KCL and KVL", "KCL at the top node: <span class='mono'>i₁ + i₂ = 0</span><br>KVL around the loop: <span class='mono'>v₁ = v₂</span>"],
            ["4 · Solve", "<span class='mono'>i₂ = −i₁ = 2 A</span> → <span class='mono'>v₂ = 5 × 2 = 10 V</span> → <span class='mono'>v₁ = 10 V</span>. Done: all four unknowns found."],
          ];
          const log = el(`<div style="display:grid;gap:8px"></div>`);
          let k = 0;
          const btn = el(`<button type="button" class="btn primary">Show step 1</button>`);
          btn.addEventListener("click", () => {
            const [h, t] = steps[k];
            log.appendChild(el(`<div class="feedback"><b>${h}</b><br>${t}</div>`));
            k++;
            if (k >= steps.length) { btn.disabled = true; btn.textContent = "All steps shown"; } else btn.textContent = "Show step " + (k + 1);
          });
          host.append(el(`<div class="fig">${fig}</div>`), log, btn);
        },
      ]},
      { k: "math", title: "Solving equations together", b: [
        `<p>Two tricks do almost everything in this book:</p>`,
        `<div class="two"><div class="tile"><h3>Substitution</h3><p>If you know one thing, swap it in everywhere. <span class="mono">i₂ = −i₁</span> and <span class="mono">i₁ = −2</span> → <span class="mono">i₂ = 2</span>.</p></div><div class="tile"><h3>Adding equations</h3><p>Two true equations added together give a true equation (balance scale: add the same to both sides).</p></div></div>`,
        `<p>Example: <span class="mono">x + y = 9</span> and <span class="mono">x − y = 3</span>. Add them: the y's cancel, <span class="mono">2x = 12</span>.</p>`,
        { t: "num", q: "So what is x?", a: 6, hint: "2x = 12. Divide both sides by 2.", why: "x = 6, and then y = 9 − 6 = 3." },
        `<p class="aside">For bigger systems the book uses matrices and Cramer's rule (Appendix D). Chapter 3 shows smarter methods that avoid most of this algebra.</p>`,
      ]},
      { k: "whatif", title: "Flip the labels", b: [
        { t: "mcq", q: "Redo the tiny circuit with the resistor's labels reversed (arrow up, + at the bottom). What changes in the answers?", opts: [
          ["i₂ and v₂ come out with opposite signs (−2 A, −10 V). The physical current and voltage are identical", true, "Labels are bookkeeping. Physics can't depend on which way you drew an arrow, so only the signs of the flipped variables change."],
          ["The current becomes 4 A", false, "Nothing physical changed, so the amount of current can't change."],
          ["The circuit can no longer be solved", false, "Any labeling works, as long as each branch follows the associated convention."],
        ]},
      ]},
      { k: "learn", title: "The quick way", b: [
        `<p>You don't have to write every equation first. Chain them in a smart order:</p>`,
        `<div class="eq" style="font-size:18px">source law → KCL → resistor law → KVL</div>`,
        `<p>Current source sets 2 A → KCL: all of it goes through the resistor → Ohm: 10 V → KVL: the source has 10 V too. Same answers, four short moves.</p>`,
      ]},
      { k: "learn", title: "Energy check: nothing is free", b: [
        `<p>Once you know every v and i, add up the power into every element (associated labels). It must total <b>zero</b>: power supplied = power absorbed.</p>`,
        `<div class="tbl"><table><thead><tr><th>Element</th><th>v × i</th><th>Meaning</th></tr></thead><tbody><tr><td>Current source</td><td class="mono">10 × (−2) = −20 W</td><td>supplies 20 W</td></tr><tr><td>Resistor</td><td class="mono">10 × 2 = +20 W</td><td>absorbs 20 W</td></tr><tr><td><b>Total</b></td><td class="mono"><b>0 W</b></td><td>✓ energy conserved</td></tr></tbody></table></div>`,
        `<p>Two uses: <b>checking</b> an answer, and sometimes <b>finding</b> one without much algebra.</p>`,
      ]},
      { k: "bug", title: "Check a classmate's answer", b: [
        `<div class="fig">${S.svg(300, 170, S.wire([70, 67], [70, 20], [230, 20], [230, 40]) + S.res(230, 40, 230, 130, "1 kΩ", { side: "right" }) + S.wire([230, 130], [230, 150], [70, 150], [70, 103]) + S.vsrc(70, 85, "5 V") + S.arrow(170, 20, 120, 20, "i", { ly: 12 }), { max: 300, label: "5 volt source and 1 kilohm resistor with current arrow pointing into the source" })}</div>`,
        `<div class="feedback">A classmate says <b>i = +5 mA</b> (arrow as drawn, flowing into the source's + terminal).</div>`,
        { t: "mcq", q: "Use energy to judge it. Is +5 mA right?", opts: [
          ["No. Then the source would absorb 25 mW and the resistor would also absorb 25 mW, with nobody supplying", true, "Power can't come from nowhere. Flip the sign: i = −5 mA. Then the source supplies 25 mW and the resistor absorbs 25 mW."],
          ["Yes. 5 V ÷ 1 kΩ = 5 mA", false, "The size is right. Check the sign: which way does current really flow out of a source's + terminal?"],
          ["Can't tell without solving the whole circuit again", false, "The energy check needs only the numbers you already have. That's what makes it quick."],
        ]},
      ]},
      { k: "check", title: "Solve it with energy alone", b: [
        `<div class="fig">${S.svg(300, 160, S.wire([70, 62], [70, 20], [230, 20], [230, 35]) + S.res(230, 35, 230, 125, "2 kΩ", { side: "right" }) + S.wire([230, 125], [230, 140], [70, 140], [70, 98]) + S.isrc(70, 80, "4 mA") + S.t(150, 75, "+", { cls: "a" }) + S.t(150, 105, "−", { cls: "a" }) + S.t(150, 92, "v", { cls: "a" }), { max: 300 })}</div>`,
        { t: "num", q: "The source supplies 0.004 × v watts. The resistor absorbs v² / 2000 watts. Set them equal. What is v?", a: 8, unit: "V", hint: "0.004 v = v²/2000. Divide both sides by v (v isn't 0), then multiply by 2000.", why: "0.004 = v/2000, so v = 8 V. (Ohm's law agrees: 4 mA × 2 kΩ = 8 V.)" },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the basic method always give exactly enough equations?", model: "Each of the B branches has 2 unknowns (v and i), so 2B unknowns. Each branch gives one element law (B equations), KCL gives N − 1, and KVL gives B − N + 1. Together that's 2B independent equations: exactly enough." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  function dividerFig(V, R1, R2) {
    const I = V / (R1 + R2), v1 = I * R1, v2 = I * R2;
    const H = 180, h1 = V > 0 ? (H * v1) / V : H / 2;
    return S.svg(400, 240,
      S.wire([60, 102], [60, 30], [220, 30]) + S.res(220, 30, 220, 120, "R1") + S.res(220, 120, 220, 210, "R2") + S.wire([220, 210], [60, 210], [60, 138]) + S.vsrc(60, 120, "V") + S.dot(220, 120) +
      S.t(262, 52, "+", { cls: "a" }) + S.t(262, 80, "v₁", { cls: "a" }) + S.t(262, 112, "−", { cls: "a" }) + S.t(262, 142, "+", { cls: "a" }) + S.t(262, 170, "v₂", { cls: "a" }) + S.t(262, 202, "−", { cls: "a" }) +
      `<rect x="320" y="30" width="34" height="${h1}" style="fill:var(--accent)"/><rect x="320" y="${30 + h1}" width="34" height="${H - h1}" style="fill:var(--cool)"/>` +
      S.t(370, 30 + h1 / 2 + 5, fmt(v1) + " V", { a: "start", cls: "s" }) + S.t(370, 30 + h1 + (H - h1) / 2 + 5, fmt(v2) + " V", { a: "start", cls: "s" }) + S.t(337, 228, "V split", { cls: "s m" }) +
      S.flow([[60, 102], [60, 30], [220, 30], [220, 210], [60, 210], [60, 138]], I * 1000, 1.5), { max: 400, label: "Voltage divider" });
  }
  const p5 = {
    id: "p5", title: "Series resistors and voltage dividers", mins: 20,
    blurb: "Resistances add, and voltage splits in proportion.",
    takeaway: "Series resistors add: R1 + R2. A voltage divider gives v₂ = V × R2 / (R1 + R2): each resistor takes a share of the voltage in proportion to its resistance.",
    steps: [
      { k: "learn", title: "Series resistances add", b: [
        `<div class="eq">R<sub>S</sub> = R₁ + R₂ + … + R<sub>N</sub></div>`,
        `<p>Why: series resistors carry the same current i (KCL). Their voltages add (KVL): <span class="mono">v = iR₁ + iR₂ = i(R₁ + R₂)</span>. From outside, that's one resistor of R₁ + R₂.</p>`,
        `<p>Chapter 1 check: putting resistors end to end is like making one longer wire, and R grows with length.</p>`,
      ]},
      { k: "play", title: "Split a voltage", b: [
        `<div class="eq">v₂ = V × R₂ / (R₁ + R₂)</div>`,
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let V = 10, R1 = 3000, R2 = 2000;
          function draw() {
            fig.innerHTML = dividerFig(V, R1, R2);
            const I = V / (R1 + R2);
            ro.innerHTML = readout([["Current V/(R₁+R₂)", si(I, "A")], ["v₁", fmt(I * R1) + " V"], ["v₂", fmt(I * R2) + " V"], ["Fraction R₂/(R₁+R₂)", fmt(R2 / (R1 + R2))]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(
            slider({ id: id + "-v", label: "Source V", min: 0, max: 12, step: 0.5, value: 10, show: (v) => fmt(v) + " V" }, (v) => { V = v; draw(); }).el,
            slider({ id: id + "-1", label: "R₁", min: 500, max: 10000, step: 500, value: 3000, show: (v) => si(v, "Ω") }, (v) => { R1 = v; draw(); }).el,
            slider({ id: id + "-2", label: "R₂", min: 500, max: 10000, step: 500, value: 2000, show: (v) => si(v, "Ω") }, (v) => { R2 = v; draw(); }).el);
          host.append(fig, box, ro);
          draw();
        },
        `<div class="key">Bigger resistor, bigger share. <span class="mono">v₁ / v₂ = R₁ / R₂</span>, and <span class="mono">v₁ + v₂ = V</span>.</div>`,
      ]},
      { k: "predict", title: "Predict before you calculate", b: [
        { t: "mcq", q: "V = 10 V, R₁ = 9 kΩ, R₂ = 1 kΩ. What is v₂?", opts: [
          ["1 V", true, "R₂ is 1 part out of 10 total, so it gets 1/10 of the voltage. Designing a divider is choosing this ratio."],
          ["9 V", false, "That's v₁. The bigger resistor takes the bigger share."],
          ["5 V", false, "Only if the resistors were equal."],
          ["0.9 V", false, "R₂/(R₁+R₂) = 1/10, not 9/100."],
        ]},
      ]},
      { k: "whatif", title: "A temperature sensor", b: [
        `<p>Make R₂ a part whose resistance rises as it warms. The rest of the divider stays fixed.</p>`,
        { t: "mcq", q: "The room gets warmer. What does v₂ do?", opts: [
          ["Rises", true, "R₂ becomes a bigger share of the total, so it takes a bigger share of V. Measuring v₂ tells you the temperature. Many real sensors work like this."],
          ["Falls", false, "v₂ = V·R₂/(R₁+R₂). If R₂ grows, does the fraction grow or shrink?"],
          ["Stays the same", false, "The ratio of the resistors changed, so the split changes."],
        ]},
      ]},
      { k: "learn", title: "Many resistors, same idea", b: [
        `<div class="eq">v<sub>n</sub> = V × R<sub>n</sub> / (R₁ + R₂ + … + R<sub>N</sub>)</div>`,
        `<p>Each resistor's share = its resistance ÷ the total. Energy check: each resistor absorbs <span class="mono">i²R<sub>n</sub></span>, and together they absorb exactly what the source supplies, <span class="mono">V²/(R₁+…+R<sub>N</sub>)</span>.</p>`,
        `<p class="aside">With conductances (G = 1/R) the two-resistor divider reads v₂ = V·G₁/(G₁+G₂). Note it's the <b>opposite</b> conductance on top. Keep that in mind for the next part.</p>`,
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<div class="feedback">A student writes the divider as <span class="mono">v₂ = V × R₁ / (R₁ + R₂)</span>.</div>`,
        { t: "mcq", q: "How could you catch this mistake without looking anything up?", opts: [
          ["Test an extreme: if R₂ = 0 (a wire), v₂ must be 0, but this formula gives V", true, "Extreme cases are a great self-check. A wire can't have voltage across it, so the formula must give 0 when R₂ = 0. The right one has R₂ on top."],
          ["Check the units", false, "Both versions have the same units (volts), so units can't catch this one."],
          ["You can't. Both are correct", false, "They give different answers whenever R₁ ≠ R₂, so at most one is right."],
        ]},
      ]},
      { k: "check", title: "Design one", b: [
        { t: "num", q: "You have a 12 V supply and want 3 V across R₂ = 1 kΩ. What should R₁ be?", a: 3000, unit: "Ω", hint: "3 V is a quarter of 12 V, so R₂ must be a quarter of the total.", hint2: "Total = 4 kΩ, and R₂ = 1 kΩ.", why: "R₁ = 3 kΩ. Then R₂/(R₁+R₂) = 1/4 and v₂ = 3 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain, without the formula, why the bigger resistor in a voltage divider gets the bigger voltage.", model: "Both resistors carry the same current, since they're in series. Voltage across a resistor is current times resistance, so with the same current the bigger resistance needs more voltage. The source's voltage gets split in proportion to the resistances." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Parallel resistors and current dividers", mins: 20,
    blurb: "Conductances add, and current prefers the easy path.",
    takeaway: "Parallel resistors: R1R2/(R1 + R2), always smaller than either one. A current divider gives i₁ = I × R₂/(R₁ + R₂): more current takes the smaller resistor.",
    steps: [
      { k: "learn", title: "Parallel: conductances add", b: [
        `<div class="eq">G<sub>P</sub> = G₁ + G₂  ·  R₁ ∥ R₂ = R₁R₂ / (R₁ + R₂)</div>`,
        `<p>Why: parallel resistors share one voltage v (KVL). Their currents add (KCL): <span class="mono">i = v/R₁ + v/R₂</span>. More paths → more current for the same voltage → less resistance.</p>`,
        `<ul><li>For N resistors: 1/R<sub>P</sub> = 1/R₁ + 1/R₂ + … + 1/R<sub>N</sub></li><li>N equal resistors R in parallel: <b>R / N</b></li></ul>`,
        `<p>Chapter 1 check: side-by-side resistors act like one fatter wire, and R shrinks as area grows.</p>`,
      ]},
      { k: "predict", title: "Estimate first", b: [
        { t: "mcq", q: "4 kΩ ∥ 4 kΩ = ?", opts: [["2 kΩ", true, "Two equal paths: R/2."], ["8 kΩ", false, "That's series. Parallel always gives less than either resistor."], ["4 kΩ", false, "Two paths let through twice the current, so resistance halves."]] },
        { t: "mcq", q: "1 kΩ ∥ 1 MΩ ≈ ?", opts: [["Just under 1 kΩ", true, "The 1 MΩ path carries almost nothing. The result (999 Ω) is a little below the smaller resistor."], ["About 500 kΩ", false, "Parallel results are always below the smallest resistor."], ["About 1 MΩ", false, "Parallel results are always below the smallest resistor, here 1 kΩ."]] },
        `<div class="key">Parallel is always <b>smaller than the smallest</b> resistor. Use it as a sanity check.</div>`,
      ]},
      { k: "play", title: "Split a current", b: [
        `<div class="eq">i₁ = I × R₂ / (R₁ + R₂)</div>`,
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let I = 6, R1 = 1000, R2 = 2000;
          function draw() {
            const i1 = (I * R2) / (R1 + R2), i2 = (I * R1) / (R1 + R2), v = (I / 1000) * (R1 * R2) / (R1 + R2);
            fig.innerHTML = S.svg(380, 200,
              S.wire([60, 77], [60, 30], [300, 30]) + S.wire([60, 113], [60, 170], [300, 170]) + S.isrc(60, 95, "I") + S.res(180, 30, 180, 170, "R₁", { side: "right" }) + S.res(300, 30, 300, 170, "R₂", { side: "right" }) + S.dot(180, 30) + S.dot(180, 170) +
              S.flow([[60, 77], [60, 30], [180, 30]], I, 6, 2 + I * 0.8) + S.flow([[180, 30], [180, 170]], i1, 6, 2 + i1 * 0.8) + S.flow([[180, 30], [300, 30], [300, 170]], i2, 6, 2 + i2 * 0.8) + S.flow([[300, 170], [60, 170], [60, 113]], I, 6, 2 + I * 0.8) +
              S.t(194, 145, fmt(i1) + " mA", { a: "start", cls: "c" }) + S.t(314, 145, fmt(i2) + " mA", { a: "start", cls: "c" }), { max: 380, label: "Current divider" });
            ro.innerHTML = readout([["i₁ through R₁", fmt(i1) + " mA"], ["i₂ through R₂", fmt(i2) + " mA"], ["Shared voltage", fmt(v) + " V"], ["R₁ ∥ R₂", si((R1 * R2) / (R1 + R2), "Ω")]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(
            slider({ id: id + "-i", label: "Source I", min: 1, max: 10, step: 0.5, value: 6, show: (v) => fmt(v) + " mA" }, (v) => { I = v; draw(); }).el,
            slider({ id: id + "-1", label: "R₁", min: 500, max: 10000, step: 500, value: 1000, show: (v) => si(v, "Ω") }, (v) => { R1 = v; draw(); }).el,
            slider({ id: id + "-2", label: "R₂", min: 500, max: 10000, step: 500, value: 2000, show: (v) => si(v, "Ω") }, (v) => { R2 = v; draw(); }).el);
          host.append(fig, box, ro);
          draw();
        },
        `<p class="aside">Thicker, faster dots = more current.</p>`,
      ]},
      { k: "why", title: "Why the opposite resistor is on top", b: [
        { t: "mcq", q: "In the voltage divider, R₂ is on top for v₂. In the current divider, R₂ is on top for i₁. Why the switch?", opts: [
          ["Current prefers the easier path. A big R₂ pushes more current into R₁", true, "In conductance form it lines up again: i₁ = I·G₁/(G₁+G₂). Each path's share of current matches its share of conductance. Voltage dividers and current dividers are mirror images (duals)."],
          ["It's a convention. Either way works", false, "Try R₂ = ∞ (open). All current must go through R₁, so i₁ = I. Only R₂-on-top gives that."],
          ["Because currents are negative", false, "Signs have nothing to do with it."],
        ]},
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<div class="feedback">A student writes <span class="mono">i₁ = I × R₁ / (R₁ + R₂)</span>.</div>`,
        { t: "mcq", q: "Which extreme case exposes the mistake fastest?", opts: [
          ["R₁ = 0 (a wire). All current should take the wire, so i₁ = I. Their formula gives 0", true, "A short steals all the current. A formula that gives zero current through a short is wrong."],
          ["R₁ = R₂", false, "With equal resistors both formulas give I/2, so this case can't tell them apart."],
          ["I = 0", false, "Every formula gives 0 when there's no current at all."],
        ]},
      ]},
      { k: "check", title: "Your turn", b: [
        `<div class="fig">${S.svg(380, 180, S.wire([60, 72], [60, 25], [300, 25]) + S.wire([60, 108], [60, 155], [300, 155]) + S.isrc(60, 90, "6 mA") + S.res(180, 25, 180, 155, "1 kΩ", { side: "right" }) + S.res(300, 25, 300, 155, "2 kΩ", { side: "right" }) + S.dot(180, 25) + S.dot(180, 155), { max: 380 })}</div>`,
        { t: "num", q: "How much current flows through the 1 kΩ resistor?", a: 4, unit: "mA", hint: "i₁ = I × (the other resistor) / (sum).", why: "6 × 2/3 = 4 mA. The smaller resistor takes the bigger share." },
        { t: "num", q: "What voltage is across both resistors?", a: 4, unit: "V", hint: "Pick either resistor and use Ohm's law, or use I × (R₁ ∥ R₂).", why: "4 mA × 1 kΩ = 4 V. Check: 6 mA × (2/3 kΩ) = 4 V too." },
      ]},
      { k: "predict", title: "A building-blocks puzzle", b: [
        `<p>You have three 1 kΩ resistors. You may use one, two or all three, in series and/or parallel.</p>`,
        { t: "mcq", q: "Which value can you NOT make?", opts: [
          ["750 Ω", true, "The possible values are 333, 500, 667, 1000, 1500, 2000 and 3000 Ω. 750 Ω isn't among them."],
          ["667 Ω", false, "Two in series (2 kΩ) in parallel with one: 2k ∥ 1k = 667 Ω."],
          ["1500 Ω", false, "Two in parallel (500 Ω) plus one in series: 1500 Ω."],
          ["333 Ω", false, "All three in parallel: 1k / 3 = 333 Ω."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is two resistors in parallel always less than the smaller one?", model: "Adding a second path in parallel can only let more current through for the same voltage. Even a huge resistor adds a little current. More current at the same voltage means less resistance, so the combination is below the smaller resistor, which alone would already carry that much current." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  function ladderStage(st) {
    const V = S.vsrc(50, 110, "12 V"), bot = (x) => S.wire([50, 128], [50, 190], [x, 190]), top = S.wire([50, 92], [50, 30], [90, 30]);
    if (st === 0) return S.svg(420, 225, top + bot(350) + S.wire([190, 30], [230, 30]) + S.wire([320, 30], [350, 30]) + S.res(90, 30, 190, 30, "R1 2k") + S.res(210, 30, 210, 190, "R2 6k") + S.res(230, 30, 320, 30, "R3 1k") + S.res(350, 30, 350, 190, "R4 2k") + V + S.dot(210, 30) + S.dot(210, 190), { max: 420 });
    if (st === 1) return S.svg(420, 225, top + bot(350) + S.wire([190, 30], [350, 30]) + S.res(90, 30, 190, 30, "R1 2k") + S.res(210, 30, 210, 190, "R2 6k") + S.res(350, 30, 350, 190, "3k", { cls: "hl", tcls: "a" }) + S.t(350, 214, "R3 + R4", { cls: "a s" }) + V + S.dot(210, 30) + S.dot(210, 190), { max: 420 });
    if (st === 2) return S.svg(420, 225, top + bot(210) + S.wire([190, 30], [210, 30]) + S.res(90, 30, 190, 30, "R1 2k") + S.res(210, 30, 210, 190, "2k", { cls: "hl", tcls: "a" }) + S.t(270, 214, "6k ∥ 3k", { cls: "a s" }) + V, { max: 420 });
    return S.svg(420, 225, S.wire([50, 92], [50, 30], [210, 30]) + bot(210) + S.res(210, 30, 210, 190, "4k", { cls: "hl", tcls: "a" }) + S.t(270, 214, "2k + 2k", { cls: "a s" }) + V, { max: 420 });
  }
  const p7 = {
    id: "p7", title: "Collapse, then expand", mins: 25,
    blurb: "The fast way to solve: combine resistors, then work back out.",
    takeaway: "Collapse series and parallel groups into one resistor, find the current, then expand back step by step using Ohm's law and dividers. Symmetry and equal-voltage nodes can simplify even more.",
    steps: [
      { k: "learn", title: "The slow way and the fast way", b: [
        `<div class="fig">${ladderStage(0)}</div>`,
        `<p>The basic method on this circuit means <b>10 equations</b> (5 branches × 2). The book solves them with a matrix. It works, but it's tedious.</p>`,
        `<p>The fast way has two moves: <b>collapse</b> resistors into one, find the current, then <b>expand</b> back out.</p>`,
      ]},
      { k: "play", title: "Collapse… then expand", b: [
        (host) => {
          const fig = el(`<div class="fig"></div>`), txt = el(`<div class="feedback" aria-live="polite"></div>`);
          const stages = [
            [0, "Start. Goal: every voltage and current."],
            [1, "<b>Collapse 1:</b> R3 and R4 are in series (same current, nothing branches off between them): 1k + 2k = <b>3 kΩ</b>."],
            [2, "<b>Collapse 2:</b> R2 and that 3 kΩ connect the same two nodes, so they're in parallel: 6k ∥ 3k = 18/9 = <b>2 kΩ</b>."],
            [3, "<b>Collapse 3:</b> R1 is in series with that 2 kΩ: <b>4 kΩ</b> total. Ohm: i₁ = 12 V / 4 kΩ = <b>3 mA</b>."],
            [2, "<b>Expand 1:</b> back to R1 + 2k. 3 mA flows through both: v₁ = 3 mA × 2k = <b>6 V</b>, and the 2k part gets <b>6 V</b>. (KVL: 6 + 6 = 12 ✓)"],
            [1, "<b>Expand 2:</b> that 6 V is across both R2 and the 3k branch. i₂ = 6/6k = <b>1 mA</b>, i₃ = 6/3k = <b>2 mA</b>. (KCL: 1 + 2 = 3 ✓)"],
            [0, "<b>Expand 3:</b> 2 mA flows through R3 and R4: v₃ = 2 mA × 1k = <b>2 V</b>, v₄ = 2 mA × 2k = <b>4 V</b>. (2 + 4 = 6 ✓) Solved, with no matrix."],
          ];
          let k = 0;
          const b1 = el(`<button type="button" class="btn ghost">← Back</button>`), b2 = el(`<button type="button" class="btn primary">Next move →</button>`);
          function draw() { fig.innerHTML = ladderStage(stages[k][0]); txt.innerHTML = `<span class="aside">Move ${k} of ${stages.length - 1}</span><br>` + stages[k][1]; b1.disabled = k === 0; b2.disabled = k === stages.length - 1; }
          b1.addEventListener("click", () => { k--; draw(); });
          b2.addEventListener("click", () => { k++; draw(); });
          const row = el(`<div class="row"></div>`); row.append(b1, b2);
          host.append(fig, txt, row);
          draw();
        },
      ]},
      { k: "why", title: "When is it really parallel?", b: [
        { t: "mcq", q: "In move 2 we combined R2 with (R3 + R4) in parallel. Why can't we combine R1 with R2 in parallel?", opts: [
          ["Parallel means connecting the same two nodes. R2 and (R3+R4) both join nodes b and d. R1 joins a and b", true, "Always check the two end nodes. Elements are in parallel only if they share both ends, and in series only if nothing else branches off between them."],
          ["R1 is horizontal and R2 is vertical", false, "How things are drawn on paper doesn't matter. Only the node connections do."],
          ["You can, it just gives a different answer", false, "R1 and R2 don't share both nodes, so they simply aren't in parallel."],
        ]},
      ]},
      { k: "learn", title: "Use symmetry: a cube of resistors", b: [
        `<p>Twelve equal resistors R form the edges of a cube. What's the resistance between opposite corners A and B? Push a current I in at A and out at B.</p>`,
        (host) => {
          const V = { A: [60, 180], f10: [180, 180], f11: [180, 60], f01: [60, 60], b00: [130, 130], b10: [250, 130], B: [250, 10], b01: [130, 10] };
          const g1 = [["A", "f10"], ["A", "f01"], ["A", "b00"]], g3 = [["b10", "B"], ["b01", "B"], ["f11", "B"]];
          const g2 = [["f10", "f11"], ["f11", "f01"], ["b00", "b10"], ["b01", "b00"], ["f10", "b10"], ["f01", "b01"]];
          const fig = el(`<div class="fig"></div>`), txt = el(`<div class="feedback" aria-live="polite"></div>`);
          const msgs = [
            "Start: current I enters at A.",
            "From A, three identical edges lead away, and the cube looks the same down each one. So I splits <b>equally: I/3</b> each.",
            "Each of those three corners passes its I/3 on along two identical edges: <b>I/6</b> on each of the six middle edges.",
            "The current rejoins on the last three edges: <b>I/3</b> each, arriving at B.",
            "Add the voltage drops along any path A → B: R·(I/3) + R·(I/6) + R·(I/3) = <b>(5/6) R·I</b>. So the cube's resistance is <b>5R/6</b>.",
          ];
          let k = 0;
          function draw() {
            const line = (e, col, lab) => { const [p, q] = [V[e[0]], V[e[1]]]; return `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" class="w" style="${col ? "stroke:" + col + ";stroke-width:5" : ""}"/>` + (lab ? `<text x="${(p[0] + q[0]) / 2 + 6}" y="${(p[1] + q[1]) / 2 - 4}" class="s" style="fill:${col}">${lab}</text>` : ""); };
            let s = "";
            g2.forEach((e) => (s += line(e, k >= 2 ? "var(--cool)" : "", k >= 2 ? "I/6" : "")));
            g1.forEach((e) => (s += line(e, k >= 1 ? "var(--accent)" : "", k >= 1 ? "I/3" : "")));
            g3.forEach((e) => (s += line(e, k >= 3 ? "var(--good)" : "", k >= 3 ? "I/3" : "")));
            Object.values(V).forEach((p) => (s += S.dot(p[0], p[1])));
            s += S.t(46, 196, "A", { cls: "big" }) + S.t(264, 14, "B", { cls: "big" });
            fig.innerHTML = S.svg(300, 210, s, { max: 300, label: "Cube of twelve resistors" });
            txt.innerHTML = msgs[k];
            nb.disabled = k === msgs.length - 1;
          }
          const nb = el(`<button type="button" class="btn primary">Next →</button>`), rb = el(`<button type="button" class="btn ghost">Start over</button>`);
          nb.addEventListener("click", () => { k++; draw(); });
          rb.addEventListener("click", () => { k = 0; draw(); });
          const row = el(`<div class="row"></div>`); row.append(nb, rb);
          host.append(fig, txt, row);
          draw();
        },
        `<div class="key">Before grinding through algebra, look for <b>symmetry</b>. It can turn 26 unknowns into a few lines.</div>`,
      ]},
      { k: "why", title: "Joining equal-voltage nodes", b: [
        `<p>By symmetry, the three corners next to A all sit at the same voltage. The book connects them with a wire, turning the cube into simple series and parallel groups.</p>`,
        { t: "mcq", q: "Why doesn't adding a wire between two equal-voltage nodes change anything?", opts: [
          ["With zero voltage difference across it, no current flows through the new wire", true, "A wire only carries current if something pushes current through it. With equal voltages at both ends there's no push, so the rest of the circuit can't tell the wire is there."],
          ["Wires never carry current", false, "Wires carry current all the time. This one doesn't because its ends are at the same voltage."],
          ["It does change things, but only a little", false, "It changes nothing at all. That's what makes the trick exact."],
        ]},
      ]},
      { k: "learn", title: "Shorthand: ground and supply arrows", b: [
        `<div class="two">
          <div class="tile"><h3>Full drawing</h3>${S.svg(200, 200, S.wire([50, 82], [50, 20], [150, 20]) + S.res(150, 20, 150, 100, "R1", { side: "right" }) + S.res(150, 100, 150, 180, "R2", { side: "right" }) + S.wire([150, 180], [50, 180], [50, 118]) + S.vsrc(50, 100, "5 V") + S.dot(150, 100) + S.t(120, 104, "v", { cls: "a", a: "end" }), { max: 200 })}</div>
          <div class="tile"><h3>Shorthand</h3>${S.svg(200, 200, S.supply(100, 50, "5 V") + S.res(100, 50, 100, 120, "R1", { side: "right" }) + S.res(100, 120, 100, 175, "R2", { side: "right" }) + S.gnd(100, 175) + S.dot(100, 120) + S.wire([100, 120], [60, 120]) + S.t(52, 124, "v", { cls: "a", a: "end" }), { max: 200 })}</div>
        </div>`,
        `<ul><li><b>Upward arrow</b> = a node held at the supply voltage (the battery isn't drawn).</li><li><b>Ground</b> (stacked lines) = the reference node, 0 V.</li><li>A voltage written next to a node is measured <b>from ground</b>.</li></ul>`,
      ]},
      { k: "predict", title: "Attach a load to a divider", b: [
        `<p>Two 10 kΩ resistors split 10 V into 5 V. Now you connect a device (a "load" R<sub>L</sub>) across the bottom resistor.</p>`,
        { t: "mcq", q: "What happens to the output voltage?", opts: [
          ["It drops below 5 V", true, "The load sits in parallel with the bottom resistor, and parallel is always smaller. A smaller bottom share gets a smaller voltage. Try it below."],
          ["It stays 5 V", false, "The divider formula assumed nothing else was connected. The load changes the bottom resistance."],
          ["It rises above 5 V", false, "Parallel resistance can only be smaller than 10 kΩ, never bigger."],
        ]},
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let RL = 10000;
          function draw() {
            const Rb = (10000 * RL) / (10000 + RL), vo = (10 * Rb) / (10000 + Rb);
            fig.innerHTML = S.svg(320, 210, S.supply(100, 40, "10 V") + S.res(100, 40, 100, 110, "10k", { side: "left" }) + S.res(100, 110, 100, 180, "10k", { side: "left" }) + S.gnd(100, 180) + S.wire([100, 110], [220, 110]) + S.res(220, 110, 220, 180, "R_L", { side: "right" }) + S.gnd(220, 180) + S.dot(100, 110) + S.t(160, 102, "v = " + fmt(vo) + " V", { cls: "a" }), { max: 320, label: "Divider with a load" });
            ro.innerHTML = readout([["Bottom: 10k ∥ R_L", si(Rb, "Ω")], ["Output v", fmt(vo) + " V"]]);
          }
          host.append(fig, slider({ id: id + "-rl", label: "Load R_L", min: 100, max: 1e6, log: true, value: 10000, show: (v) => si(v, "Ω") }, (v) => { RL = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">A big load (≫ 10 kΩ) barely matters. A small one drags the output down. Remember this "loading" effect: it shows up all through the book.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe 'collapse, then expand' in your own words, as steps someone else could follow.", model: "1) Repeatedly combine resistors that are clearly in series or parallel until one resistor is left. 2) Use Ohm's law to find the current from the source. 3) Undo the combinations one at a time, and at each stage use Ohm's law and the voltage or current divider to find the voltages and currents of the pieces you just split apart." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const twoSrcFig = (V, I, v2) => S.svg(400, 200,
    S.wire([60, 82], [60, 30], [100, 30]) + S.res(100, 30, 200, 30, "R1") + S.wire([200, 30], [320, 30], [320, 82]) + S.res(220, 30, 220, 170, "R2", { side: "right" }) + S.wire([60, 118], [60, 170], [320, 170], [320, 118]) +
    S.vsrc(60, 100, "V") + S.isrc(320, 100, "I", { side: "right" }) + S.dot(220, 30) + S.dot(220, 170) + (v2 != null ? S.t(234, 148, "v₂ = " + fmt(v2) + " V", { a: "start", cls: "a" }) : ""), { max: 400, label: "A circuit with a voltage source and a current source" });
  const p8 = {
    id: "p8", title: "Two sources, and looking into a black box", mins: 20,
    blurb: "Circuits the shortcuts can't collapse, and the v–i line of any box.",
    takeaway: "With two sources, each answer is a sum of a part caused by each source. And any box made of a source and a resistor is fully described by one straight v–i line: two numbers.",
    steps: [
      { k: "learn", title: "When collapsing doesn't work", b: [
        `<div class="fig">${twoSrcFig()}</div>`,
        `<p>With two sources, there's no single "source current" to find, so collapse-and-expand doesn't apply. The basic method still works. Its result for the middle voltage:</p>`,
        `<div class="eq">v₂ = <span class="a">V · R₂/(R₁+R₂)</span> + I · R₁R₂/(R₁+R₂)</div>`,
        `<p>Look at the shape: one piece that depends only on V, plus one piece that depends only on I.</p>`,
      ]},
      { k: "play", title: "See the two pieces add up", b: [
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), bar = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let V = 6, I = 2;
          const R1 = 1000, R2 = 1000;
          function draw() {
            const fromV = (V * R2) / (R1 + R2), fromI = ((I / 1000) * R1 * R2) / (R1 + R2), v2 = fromV + fromI;
            fig.innerHTML = twoSrcFig(V, I, v2);
            const W = 360, sc = W / 12;
            bar.innerHTML = S.svg(400, 60, `<rect x="20" y="15" width="${Math.max(0, fromV * sc)}" height="26" style="fill:var(--accent)"/><rect x="${20 + fromV * sc}" y="15" width="${Math.max(0, fromI * sc)}" height="26" style="fill:var(--cool)"/>` + S.t(20, 58, "0", { cls: "s m" }) + S.t(380, 58, "12 V", { cls: "s m" }), { max: 400, label: "v2 as two stacked pieces" });
            ro.innerHTML = readout([["Piece from V", fmt(fromV) + " V"], ["Piece from I", fmt(fromI) + " V"], ["v₂ total", fmt(v2) + " V"]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(
            slider({ id: id + "-v", label: "Voltage source V", min: 0, max: 12, step: 0.5, value: 6, show: (v) => fmt(v) + " V" }, (v) => { V = v; draw(); }).el,
            slider({ id: id + "-i", label: "Current source I", min: 0, max: 12, step: 0.5, value: 2, show: (v) => fmt(v) + " mA" }, (v) => { I = v; draw(); }).el);
          host.append(fig, el(`<p class="aside">R₁ = R₂ = 1 kΩ. <span style="color:var(--accent-ink)">Orange</span> = caused by V. <span style="color:var(--cool)">Blue</span> = caused by I.</p>`), bar, box, ro);
          draw();
        },
      ]},
      { k: "whatif", title: "Turn one source off", b: [
        { t: "mcq", q: "Set I = 0 (a current source pushing nothing is an open circuit). What's v₂?", opts: [
          ["V · R₂/(R₁+R₂): a plain voltage divider", true, "With the current source doing nothing, only V, R1 and R2 are left, and that's a divider."],
          ["0", false, "V still drives current through R1 and R2."],
          ["V", false, "R1 takes part of the voltage."],
        ]},
        { t: "mcq", q: "Now set V = 0 (a voltage source at 0 V acts like a wire). What's v₂?", opts: [
          ["I × (R₁ ∥ R₂): the current source drives R1 and R2 in parallel", true, "With V shorted, R1 and R2 both run from the top node to the bottom, so they're in parallel across the current source."],
          ["I × R₂", false, "R1 is now connected from the top node to the bottom too, so it shares the current."],
          ["0", false, "The current source still pushes current through the resistors."],
        ]},
        `<div class="key">Each source's piece can be found with the other source turned off, and then you add the pieces up. Chapter 3 turns this into a method: <b>superposition</b>.</div>`,
      ]},
      { k: "play", title: "Measure a mystery box", b: [
        `<p>A box hides a source V and a resistor R in series. You can't open it. Push a test current i in and read the voltage v.</p>`,
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let V = 3, R = 2, it = 1;
          function draw() {
            const v = V + it * R;
            fig.innerHTML = plot({ x: [-2, 12], y: [-4, 4], xt: [0, 2, 4, 6, 8, 10, 12], yt: [-4, -2, 0, 2, 4], xl: "v (V)", yl: "i (A)", series: [{ f: (x) => (x - V) / R, cls: "s1" }], marks: [{ x: v, y: it, label: "test point" }, { x: V, y: 0, cls: "mk2", label: "v at i = 0: " + fmt(V) + " V", dy: 18 }, { x: 0, y: -V / R, cls: "mk2", label: "i at v = 0: " + fmt(-V / R) + " A", dx: 8, dy: 18 }], label: "v–i line of the mystery box" });
            ro.innerHTML = readout([["Test current i", fmt(it) + " A"], ["Measured v = V + iR", fmt(v) + " V"], ["Slope = 1/R", fmt(1 / R) + " A/V"]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(
            slider({ id: id + "-t", label: "Test current pushed in", min: -3, max: 3, step: 0.25, value: 1, show: (v) => fmt(v) + " A" }, (v) => { it = v; draw(); }).el,
            slider({ id: id + "-v", label: "Hidden V (peek)", min: 0, max: 8, step: 0.5, value: 3, show: (v) => fmt(v) + " V" }, (v) => { V = v; draw(); }).el,
            slider({ id: id + "-r", label: "Hidden R (peek)", min: 0.5, max: 6, step: 0.5, value: 2, show: (v) => fmt(v) + " Ω" }, (v) => { R = v; draw(); }).el);
          host.append(fig, box, ro);
          draw();
        },
        `<div class="eq">v = V + i R   ⇔   i = (v − V)/R</div>`,
      ]},
      { k: "why", title: "What can you learn from outside?", b: [
        { t: "mcq", q: "Two different boxes give exactly the same v–i line. Can any circuit you connect them to tell them apart?", opts: [
          ["No. The outside world only sees v and i at the terminals, and those match", true, "This is the black-box idea from Chapter 1 paying off. The line is set by just two numbers (slope and intercept). Chapter 3's Thévenin theorem says any linear box acts like one source plus one resistor."],
          ["Yes, if you use a big enough current", false, "The line already describes every current. Same line, same behavior."],
          ["Yes, by measuring the power", false, "Power at the terminals is v × i, and both are the same for both boxes."],
        ]},
      ]},
      { k: "check", title: "Read a line", b: [
        { t: "num", q: "A box's line crosses i = 0 at 6 V, and crosses v = 0 at a current of −2 A. What's its internal resistance?", a: 3, unit: "Ω", hint: "From v = V + iR: at v = 0, i = −V/R.", why: "R = V / 2 A = 6 / 2 = 3 Ω." },
      ]},
      { k: "play", title: "Who's supplying the power?", b: [
        `<p>Back to the two-source circuit, with R₁ = R₂ = 1 kΩ and V = 6 V. Slide the current source and watch the power ledger.</p>`,
        (host, id) => {
          const ro = el(`<div></div>`), fb = el(`<div class="feedback"></div>`);
          let I = 4;
          function draw() {
            const V = 6, Ia = I / 1000, v2 = V / 2 + 500 * Ia, i1 = (V - v2) / 1000;
            const pV = V * i1, pI = v2 * Ia, pR1 = Math.pow(V - v2, 2) / 1000, pR2 = (v2 * v2) / 1000;
            const row = (n, p, src) => `<tr><td>${n}</td><td class="mono">${fmt(Math.abs(p) * 1000)} mW</td><td>${src ? (p > 1e-12 ? "supplies" : p < -1e-12 ? "<b style='color:var(--bad)'>absorbs</b>" : "neither") : "absorbs"}</td></tr>`;
            ro.innerHTML = `<div class="tbl"><table><thead><tr><th>Element</th><th>Power</th><th>Doing</th></tr></thead><tbody>${row("Voltage source", pV, true)}${row("Current source", pI, true)}${row("R₁", pR1)}${row("R₂", pR2)}</tbody></table></div>` +
              readout([["Supplied total", fmt((Math.max(0, pV) + Math.max(0, pI)) * 1000) + " mW"], ["Absorbed total", fmt((pR1 + pR2 + Math.max(0, -pV)) * 1000) + " mW"]]);
            fb.className = "feedback" + (pV < 0 ? " no" : "");
            fb.innerHTML = pV < 0 ? "The current source pushes the middle node above 6 V, so current flows <b>backwards into</b> the voltage source. It's absorbing power, like a battery being charged." : "The voltage source is supplying power. Push I higher and see what happens.";
          }
          host.append(slider({ id: id + "-i", label: "Current source I", min: 0, max: 12, step: 0.5, value: 4, show: (v) => fmt(v) + " mA" }, (v) => { I = v; draw(); }).el, ro, fb);
          draw();
        },
        `<p class="aside">Sources don't always supply. That's why the book uses signs and the associated convention instead of assuming.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does it mean that each answer in a two-source circuit is 'a piece from V plus a piece from I'?", model: "Each source contributes its own part to every voltage and current, as if the other source were turned off (a current source opened, a voltage source replaced by a wire). The real answer is just those parts added together. That works because the circuit is linear." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Dependent sources: control", mins: 25,
    blurb: "Sources whose value is set by something elsewhere in the circuit.",
    takeaway: "A dependent source's output (a voltage or current) is set by a voltage or current elsewhere. Its control port draws no power, so you can solve the input side first, then the output side.",
    steps: [
      { k: "learn", title: "Small effort, big effect", b: [
        `<p>A gas pedal controls hundreds of horsepower. A tap handle controls water flow. A dimmer controls a lamp. In each case a <b>tiny</b> input controls a <b>large</b> output.</p>`,
        `<p>The ideal circuit version is the <b>dependent (controlled) source</b>: a diamond whose value is set by a voltage or current somewhere else. Controlling it takes <b>zero power</b>.</p>`,
        `<div class="fig">${S.svg(380, 170, S.wire([40, 40], [110, 40]) + S.wire([40, 130], [110, 130]) + S.dot(40, 40) + S.dot(40, 130) + S.t(52, 90, "v_IN", { cls: "a", a: "start" }) + S.t(75, 30, "i_IN = 0", { cls: "s c" }) + `<rect x="110" y="20" width="160" height="130" rx="10" class="zone"/>` + S.t(190, 164, "dependent source", { cls: "s a" }) + S.wire([190, 40], [190, 63]) + S.dep(190, 85, "g·v_IN", { side: "right" }) + S.wire([190, 107], [190, 130]) + S.wire([190, 40], [340, 40]) + S.wire([190, 130], [340, 130]) + S.dot(340, 40) + S.dot(340, 130) + S.t(340, 152, "output port", { cls: "s m", a: "end" }) + S.t(60, 160, "control port", { cls: "s m" }), { max: 380, label: "Dependent source with a control port and an output port" })}</div>`,
        `<p>It has two ports: a <b>control (input) port</b> that senses something, and an <b>output port</b> that supplies the controlled voltage or current.</p>`,
      ]},
      { k: "play", title: "A voltage-controlled current source", b: [
        `<div class="eq">i<sub>OUT</sub> = g · v<sub>IN</sub></div>`,
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let vin = 3, g = 2, RL = 1000;
          function draw() {
            const iout = (g / 1000) * vin, vout = iout * RL;
            fig.innerHTML = S.svg(420, 200,
              S.wire([60, 82], [60, 30], [130, 30]) + S.wire([60, 118], [60, 170], [130, 170]) + S.vsrc(60, 100, fmt(vin) + " V") + S.dot(130, 30) + S.dot(130, 170) + S.t(140, 104, "v_IN", { cls: "a", a: "start" }) + S.t(100, 196, "input side", { cls: "s m" }) +
              `<line x1="185" y1="15" x2="185" y2="185" class="w dim" style="stroke-dasharray:4 5"/>` +
              S.wire([250, 82], [250, 30], [360, 30], [360, 45]) + S.wire([250, 118], [250, 170], [360, 170], [360, 155]) + S.dep(250, 100, "", {}) + S.t(222, 104, "g·v_IN", { a: "end", cls: "s" }) + S.res(360, 45, 360, 155, si(RL, "Ω"), { side: "right" }) + S.t(310, 196, "output side", { cls: "s m" }) +
              S.flow([[250, 78], [250, 30], [360, 30], [360, 170], [250, 170], [250, 122]], iout * 1000, 3), { max: 420, label: "Voltage-controlled current source driving a resistor" });
            ro.innerHTML = readout([["Input current", "0 (open port)"], ["i_OUT = g·v_IN", si(iout, "A")], ["v across load", fmt(vout) + " V"], ["Power into load", si(iout * vout, "W")]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(
            slider({ id: id + "-v", label: "Control voltage v_IN", min: 0, max: 5, step: 0.25, value: 3, show: (v) => fmt(v) + " V" }, (v) => { vin = v; draw(); }).el,
            slider({ id: id + "-g", label: "Transconductance g", min: 0.5, max: 5, step: 0.5, value: 2, show: (v) => fmt(v) + " mS" }, (v) => { g = v; draw(); }).el,
            slider({ id: id + "-r", label: "Load R_L", min: 200, max: 2000, step: 100, value: 1000, show: (v) => si(v, "Ω") }, (v) => { RL = v; draw(); }).el);
          host.append(fig, box, ro);
          draw();
        },
        `<p class="aside">g has units of conductance (A per V = siemens), so it's called <b>transconductance</b>.</p>`,
      ]},
      { k: "predict", title: "Four kinds, four units", b: [
        `<p>Control by voltage or current, output a voltage or current: four combinations. Each has a coefficient. Work out its unit from the equation.</p>`,
        { t: "sort", q: "What unit does each coefficient have?", bins: ["siemens (A/V)", "no unit", "ohms (V/A)"], items: [
          ["VCCS: i_OUT = g · v_IN", 0, "Current ÷ voltage = siemens. g is the transconductance."],
          ["CCCS: i_OUT = β · i_IN", 1, "Current ÷ current: no unit. β is a current transfer ratio (current gain)."],
          ["VCVS: v_OUT = μ · v_IN", 1, "Voltage ÷ voltage: no unit. μ is a voltage transfer ratio (voltage gain)."],
          ["CCVS: v_OUT = r · i_IN", 2, "Voltage ÷ current = ohms. r is the transresistance."],
        ]},
        `<p class="aside">Symbols: diamond with an arrow = dependent current source. Diamond with + and − = dependent voltage source.</p>`,
      ]},
      { k: "learn", title: "The control port just watches", b: [
        `<div class="two"><div class="tile"><h3>Voltage-controlled</h3><p>The control port is an <b>open circuit</b>: i<sub>IN</sub> = 0. It reads a voltage without drawing current.</p></div><div class="tile"><h3>Current-controlled</h3><p>The control port is a <b>short circuit</b>: v<sub>IN</sub> = 0. It reads a current without taking any voltage.</p></div></div>`,
        `<p>Either way it takes zero power and doesn't disturb what it measures. So the book often <b>doesn't draw the control port</b>. It just labels the diamond with the controlling variable, like "g·v₁" or "β·i₁".</p>`,
      ]},
      { k: "learn", title: "Solve in order: input side, then output side", b: [
        `<p>The <b>sequential method</b>, with numbers: control voltage 3 V, g = 2 mS, load 1 kΩ.</p>`,
        `<ol><li><b>Input side first.</b> The 3 V source sits across an open port: v<sub>IN</sub> = 3 V, i<sub>IN</sub> = 0. Done, the output can't affect it.</li><li><b>Output side.</b> Treat the diamond as an ordinary source of g·v<sub>IN</sub> = 2 mS × 3 V = <b>6 mA</b>. Through 1 kΩ: <b>6 V</b>.</li><li><b>Energy:</b> the load absorbs 6 mA × 6 V = 36 mW. The dependent source supplies 36 mW. The input side supplies 0 W.</li></ol>`,
        { t: "mcq", q: "The control side supplies 0 W, but the dependent source delivers 36 mW. Where does that energy come from?", opts: [
          ["From a power supply connected to the device, which the ideal symbol doesn't show", true, "Real controlled devices (like the MOSFETs coming in Chapters 6–7) have power-supply connections. The ideal model hides them to keep things simple, but energy is still conserved."],
          ["Nowhere. Dependent sources create energy", false, "Nothing creates energy. The book notes that the power terminals are simply not drawn."],
          ["From the control voltage source", false, "The control port draws zero current, so the control source delivers v × 0 = 0 W."],
        ]},
      ]},
      { k: "why", title: "Why order works here", b: [
        { t: "mcq", q: "The sequential method works here but not for the ladder circuit. What's different?", opts: [
          ["The ideal dependent source separates the circuit: the input side can't 'feel' anything on the output side", true, "The control port is a pure open (or short) that just watches. Information flows one way, input to output, so you can solve in that order. In the ladder, every part affects every other part."],
          ["Dependent-source circuits are always simpler", false, "They can be complicated. What matters is whether the output feeds back into the input."],
          ["The ladder has more resistors", false, "Number of parts isn't the issue. Two-way coupling is."],
        ]},
        `<p class="aside">If a circuit wires the output back to the control side (feedback), you're back to solving everything together. That's coming in later chapters.</p>`,
      ]},
      { k: "check", title: "A current-controlled current source", b: [
        `<div class="fig">${S.svg(420, 190, S.wire([60, 77], [60, 30], [150, 30], [150, 40]) + S.wire([60, 113], [60, 160], [150, 160], [150, 140]) + S.vsrc(60, 95, "5 V") + S.res(150, 40, 150, 140, "1 kΩ", { side: "right" }) + S.arrow(126, 55, 126, 85, "i₁", { lx: 116, ly: 75, a: "end" }) +
          S.wire([270, 72], [270, 30], [370, 30], [370, 40]) + S.wire([270, 118], [270, 160], [370, 160], [370, 140]) + S.dep(270, 95, "", { kind: "i" }) + S.t(240, 99, "50·i₁", { a: "end", cls: "s" }) + S.res(370, 40, 370, 140, "10 Ω", { side: "right" }), { max: 420, label: "Current-controlled current source" })}</div>`,
        { t: "num", q: "Step 1, input side: what is i₁?", a: 5, unit: "mA", hint: "5 V directly across 1 kΩ.", why: "i₁ = 5 V / 1 kΩ = 5 mA." },
        { t: "num", q: "Step 2, output side: the source makes 50·i₁ through the 10 Ω resistor. What's the voltage across that resistor?", a: 2.5, unit: "V", hint: "50 × 5 mA = 250 mA. Then Ohm's law.", why: "250 mA × 10 Ω = 2.5 V." },
      ]},
      { k: "learn", title: "Why you'll see diamonds again", b: [
        `<p>Real devices with three or more terminals, like the <b>MOSFET</b> transistor (Chapters 6–8), have one pair of terminals controlling what happens at another pair. We'll model them with dependent sources.</p>`,
        `<div class="key">Dependent sources are how this book models <b>amplifiers</b>: a small input signal controls a big output.</div>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What makes a dependent source different from an independent one, and why can we often solve its circuit in two separate stages?", model: "An independent source has a fixed value. A dependent source's value is set by a voltage or current elsewhere in the circuit. Because its ideal control port draws no power and doesn't disturb what it senses, the input side behaves the same whatever is on the output side. So you solve the input side first, then treat the dependent source as a known source and solve the output side." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ch2", eyebrow: "Chapter 2", title: "Resistive Networks",
    intro: `<p>Nine short parts. Chapter 1 gave you the parts. Now you learn the two laws that connect them, and four ways to solve circuits: the basic method, dividers, collapse-and-expand, and the sequential method for dependent sources.</p><p class="aside">Arrow keys ← → move between steps. Need a refresher? <a href="01-circuit-abstraction.html">Chapter 1</a>.</p>`,
    after: `<p>Open the Chapter 2 PDF and go straight to the <b>exercises and problems</b> at the end. Expect them to combine ideas in ways these parts didn't show. That's the test.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9],
    summary: `
      <h3>Vocabulary</h3>
      <p><b>Branch</b> = one element. <b>Node</b> = a connected piece of ideal wire joining terminals. <b>Loop</b> = closed path along branches.</p>
      <h3>Kirchhoff's laws</h3>
      <div class="eq">KCL: Σ i into a node = 0 · KVL: Σ v around a loop = 0</div>
      <p>KVL sign rule: use the first sign you meet on each element. Series → same current. Parallel → same voltage. Independent equations: N − 1 KCL, B − N + 1 KVL.</p>
      <h3>Basic method</h3>
      <ol><li>Label every v and i (associated variables).</li><li>Element laws (B equations).</li><li>KCL at N − 1 nodes, KVL around B − N + 1 loops.</li><li>Solve the 2B equations.</li></ol>
      <h3>Energy conservation</h3>
      <p>Σ (v × i) over all elements = 0: supplied = absorbed. Use it to check answers or to find them.</p>
      <h3>Series and parallel</h3>
      <div class="eq">R_S = R₁ + R₂ + … · 1/R_P = 1/R₁ + 1/R₂ + … · R₁∥R₂ = R₁R₂/(R₁+R₂)</div>
      <p>N equal resistors in parallel: R/N. Parallel is always below the smallest.</p>
      <h3>Dividers</h3>
      <div class="eq">v₂ = V·R₂/(R₁+R₂) · i₁ = I·R₂/(R₁+R₂) = I·G₁/(G₁+G₂)</div>
      <p>Self-check with extremes (R → 0 or R → ∞). Attaching a load across a divider lowers its output.</p>
      <h3>Collapse, then expand</h3>
      <p>Combine series/parallel groups → find the source current → expand back with Ohm's law and dividers. Use symmetry. Nodes at equal voltage can be joined by a wire.</p>
      <h3>Notation</h3>
      <p>Upward arrow = supply voltage node. Ground symbol = 0 V reference. Node voltages are measured from ground.</p>
      <h3>Two sources and black boxes</h3>
      <p>Each variable = (piece from V) + (piece from I) in a linear circuit. A source + series R box: v = V + iR. Open-circuit voltage V, short-circuit current −V/R (associated labels).</p>
      <h3>Dependent sources</h3>
      <div class="tbl"><table><thead><tr><th>Type</th><th>Law</th><th>Coefficient</th></tr></thead><tbody><tr><td>VCCS</td><td class="mono">i = g·v_IN</td><td>g, siemens (transconductance)</td></tr><tr><td>CCCS</td><td class="mono">i = β·i_IN</td><td>β, no unit</td></tr><tr><td>VCVS</td><td class="mono">v = μ·v_IN</td><td>μ, no unit</td></tr><tr><td>CCVS</td><td class="mono">v = r·i_IN</td><td>r, ohms (transresistance)</td></tr></tbody></table></div>
      <p>Ideal control port: open (voltage-controlled) or short (current-controlled), zero power. Sequential method: solve the input side, then the output side.</p>`,
  };
  Course.start(window.CHAPTER);
})();
