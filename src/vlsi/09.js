(function () {
  const { S, plot, slider, toggle, readout, fmt, el } = Course;
  const seenV = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const fig = (s) => `<div class="fig">${s}</div>`;

  /* A vertical chain of transistors from V_DD (top) to GND (bottom).
     list: [{ p, g, cls, tap }] — p = pMOS, g = gate label, tap = label of a node drawn after this device. */
  function chain(list, o = {}) {
    const x = o.x || 150, W = o.W || 340;
    let s = `<line class="w" x1="${x - 40}" y1="20" x2="${x + 70}" y2="20" style="stroke-width:3"/>` + S.t(x + 76, 25, o.top || "V_DD", { a: "start", cls: "s" });
    list.forEach((d, i) => {
      const y = 60 + 80 * i;
      s += S.nmos(x - 14, y, { p: d.p, cls: d.cls || "" }) + S.t(x - 50, y + 5, d.g, { a: "end", cls: "s" });
      if (d.tap) { const ty = 100 + 80 * i; s += S.dot(x, ty) + `<line class="w" x1="${x}" y1="${ty}" x2="${x + 70}" y2="${ty}"/>` + S.t(x + 76, ty + 5, d.tap, { a: "start", cls: d.tcls || "big" }); }
    });
    const yb = 100 + 80 * (list.length - 1);
    s += o.bottom ? S.t(x, yb + 20, o.bottom, { cls: "s" }) : S.gnd(x, yb);
    (o.extra || []).forEach((e) => (s += e));
    return S.svg(W, yb + 30, s, { max: W, label: o.label || "Transistor chain" });
  }

  /* ---------- widgets ---------- */
  function ex92(host) {
    const out = el(`<div></div>`);
    const dN = (H) => 2 * Math.sqrt((16 / 9) * H) + 4, dA = (H) => 2 * Math.sqrt(2 * H) + 5;
    const draw = (H) => {
      out.innerHTML = fig(plot({ x: [1, 20], y: [5, 20], xt: [1, 5, 10, 15, 20], yt: [5, 10, 15, 20], xl: "path electrical effort H", yl: "D (τ)", h: 230, series: [{ f: dN, cls: "s1" }, { f: dA, cls: "s2" }], marks: [{ x: H, y: dN(H), label: "NANDs " + dN(H).toFixed(1), dy: 18 }, { x: H, y: dA(H), label: "AOI22 + inv " + dA(H).toFixed(1), dy: -12 }], label: "Delay of two designs for F = AB + CD" })) +
        readout([["NAND–NAND: G, P", "16/9, 4"], ["AOI22–inverter: G, P", "2, 5"], ["Best stage effort f̂ (NAND, AOI)", Math.sqrt((16 / 9) * H).toFixed(2) + ", " + Math.sqrt(2 * H).toFixed(2)]]);
    };
    host.append(slider({ id: "v9H", label: "H", min: 1, max: 20, step: 0.5, value: 5, show: (x) => x.toFixed(1) }, draw).el, out); draw(5);
  }
  function pseudoLE(host) {
    const out = el(`<div></div>`);
    const draw = (r) => {
      const gd = 1 / (3 * (1 - r)), gu = 1 / (3 * r), ga = (gd + gu) / 2;
      out.innerHTML = fig(plot({ x: [0.1, 0.7], y: [0, 3], xt: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7], yt: [0, 1, 2, 3], xl: "pull-up strength r (fraction of pull-down)", yl: "g", h: 240, series: [{ f: (x) => 1 / (3 * (1 - x)), cls: "s3" }, { f: (x) => 1 / (3 * x), cls: "s2" }, { f: (x) => (1 / (3 * (1 - x)) + 1 / (3 * x)) / 2, cls: "s1" }], marks: [{ x: r, y: ga, label: "g_avg " + ga.toFixed(2), dy: -12 }], texts: [{ x: 0.17, y: 2.6, s: "g_u (rising)" }, { x: 0.5, y: 1.25, s: "g_d (falling)" }], label: "Pseudo-nMOS inverter logical effort versus pull-up strength" })) +
        readout([["nMOS width (for net pull-down current I)", (1 / (1 - r)).toFixed(2)], ["g_d = width/3", gd.toFixed(2)], ["g_u", gu.toFixed(2)], ["Contention", r < 0.3 ? "mild: V_OL low" : r < 0.45 ? "noticeable: V_OL rising" : "heavy: V_OL too high for the next gate"]]);
    };
    host.append(slider({ id: "v9r", label: "Pull-up strength r", min: 0.1, max: 0.7, step: 0.01, value: 0.25, show: (x) => x.toFixed(2) }, draw).el, out); draw(0.25);
  }
  function dynWave(host) {
    const out = el(`<div></div>`);
    const clk = [[0, 0], [2, 0], [2.2, 1], [8, 1], [8.2, 0], [10, 0]];
    const S4 = [
      { name: "A stays 0", A: [[0, 0], [10, 0]], Y: [[0, 1], [10, 1]], note: "No path to ground: Y just stays precharged high. Correct (inverter of 0 = 1)." },
      { name: "A rises", A: [[0, 0], [4, 0], [4.3, 1], [10, 1]], Y: [[0, 1], [4.3, 1], [4.8, 0], [8.2, 0], [8.7, 1], [10, 1]], note: "A rises during evaluation, so Y falls. Correct. The precharge (clock low) restores Y." },
      { name: "A falls (non-monotonic)", A: [[0, 1], [4, 1], [4.3, 0], [10, 0]], Y: [[0, 1], [2.2, 1], [2.7, 0], [8.2, 0], [8.7, 1], [10, 1]], ghost: [[0, 1], [2.2, 1], [2.7, 0], [4.3, 0], [4.8, 1], [10, 1]], note: "A was 1 when evaluation began, so Y discharged. When A falls, nothing can pull Y back up: the precharge transistor is off. Y stays wrong until the next precharge. The dashed line is what a real inverter would do." },
      { name: "Dynamic → dynamic", A: [[0, 1], [2.2, 1], [2.7, 0], [8.2, 0], [8.7, 1], [10, 1]], Y: [[0, 1], [2.2, 1], [2.9, 0.25], [8.2, 0.25], [8.7, 1], [10, 1]], ghost: [[0, 1], [10, 1]], lab: "X", note: "Here the input is X, the output of an earlier dynamic gate. X starts high (precharged) and falls during evaluation. For a moment it is high, so the second gate starts to discharge Y. Y should stay 1 (dashed) but is ruined. Dynamic gates on the same clock can't drive each other directly." },
    ];
    let k = 0;
    const lane = (pts, off) => pts.map(([t, v]) => [t, off + 0.9 * v]);
    const draw = () => {
      const c = S4[k];
      const series = [{ pts: lane(clk, 3.0), cls: "s2" }, { pts: lane(c.A, 1.6), cls: "s3" }, { pts: lane(c.Y, 0.2), cls: "s1" }];
      if (c.ghost) series.push({ pts: lane(c.ghost, 0.2), cls: "s4" });
      out.innerHTML = fig(plot({ x: [0, 10], y: [0, 4.1], xt: [0, 2, 8, 10], xtf: (t) => (t === 2 ? "evaluate" : t === 8 ? "precharge" : ""), yt: [], h: 230, padL: 70, series, texts: [{ x: -1.4, y: 3.3, s: "clk" }, { x: -1.4, y: 1.9, s: c.lab || "A" }, { x: -1.4, y: 0.5, s: "Y" }], label: "Dynamic inverter waveforms" })) + `<p>${c.note}</p>`;
    };
    host.append(toggle(S4.map((c) => c.name), (i) => { k = i; draw(); }, 0), out); draw();
  }
  function chargeShare(host) {
    const out = el(`<div></div>`);
    const draw = (ratio) => {
      const v = 1 / (1 + ratio);
      out.innerHTML = fig(plot({ x: [0, 1], y: [0, 1.05], xt: [0, 0.25, 0.5, 0.75, 1], yt: [0, 0.5, 0.9, 1], xl: "C_x / C_Y", yl: "V_Y / V_DD", h: 220, series: [{ f: (x) => 1 / (1 + x), cls: "s1" }, { f: () => 0.9, cls: "s4" }], marks: [{ x: ratio, y: v, label: (100 * (1 - v)).toFixed(0) + "% droop", dy: 18 }], texts: [{ x: 0.62, y: 0.94, s: "10% budget" }], label: "Charge-sharing droop" })) +
        readout([["V_x = V_Y after sharing", (100 * v).toFixed(1) + "% of V_DD"], ["Droop", (100 * (1 - v)).toFixed(1) + "% of V_DD"]]);
    };
    host.append(slider({ id: "v9cs", label: "C_x / C_Y", min: 0, max: 1, step: 0.01, value: 0.2, show: (x) => x.toFixed(2) }, draw).el, out); draw(0.2);
  }
  function ex96(host) {
    const out = el(`<div></div>`);
    const d4 = (H) => 4 * Math.pow((125 * H) / 108, 0.25) + 5, d2 = (H) => 2 * Math.sqrt((5 * H) / 2) + 11 / 3;
    const draw = (H) => {
      out.innerHTML = fig(plot({ x: [1, 12], y: [6, 16], xt: [1, 2, 4, 6, 8, 10, 12], yt: [6, 8, 10, 12, 14, 16], xl: "H", yl: "D (τ)", h: 240, series: [{ f: d2, cls: "s2" }, { f: d4, cls: "s1" }], marks: [{ x: H, y: d2(H), label: "2-stage " + d2(H).toFixed(2), dy: d2(H) > d4(H) ? -12 : 20 }, { x: H, y: d4(H), label: "4-stage " + d4(H).toFixed(2), dy: d4(H) >= d2(H) ? -12 : 20 }], label: "Two-stage versus four-stage domino AND" })) +
        `<p>${d2(H) < d4(H) ? "The <b>2-stage</b> design (HI-skew NOR) is faster here." : "The <b>4-stage</b> design (domino buffers) is faster here."}</p>`;
    };
    host.append(slider({ id: "v9H6", label: "H", min: 1, max: 12, step: 0.1, value: 2, show: (x) => x.toFixed(1) }, draw).el, out); draw(2);
  }
  function vtDrop(host) {
    const out = el(`<div></div>`);
    let vdd = 1.0, vt = 0.3;
    const draw = () => {
      const lvl = vdd - vt;
      out.innerHTML = readout([["Pass nMOS delivers (ignoring body effect)", fmt(lvl, 3) + " V = " + ((100 * lvl) / vdd).toFixed(0) + "% of V_DD"], ["V_DD / V_t", (vdd / vt).toFixed(1)], ["Receiving pMOS sees |V_gs|", fmt(vt, 3) + " V: " + "still at threshold, so it isn't fully off"], ["LEAP-style circuits need V_DD ≥ 2V_t", vdd >= 2 * vt ? "OK" : "fails"]]);
    };
    host.append(slider({ id: "v9vdd", label: "V_DD", min: 0.5, max: 5, step: 0.05, value: vdd, show: (x) => x.toFixed(2) + " V" }, (x) => { vdd = x; draw(); }).el, slider({ id: "v9vt", label: "V_t", min: 0.2, max: 0.8, step: 0.01, value: vt, show: (x) => x.toFixed(2) + " V" }, (x) => { vt = x; draw(); }).el, out); draw();
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Why other circuit families exist", mins: 20,
    blurb: "Delay ∝ (C/I)·ΔV. Static CMOS is robust but drags pMOS capacitance along. Then bubble pushing and compound gates.",
    takeaway: "Combinational outputs depend only on present inputs. Delay t ∝ (C/I)ΔV (EQ 9.1); faster circuit families attack C, I or ΔV. nMOS gives more current per capacitance than pMOS, so nMOS networks are preferred; logical effort is proportional to C/I. Static CMOS puts nMOS and pMOS on every input, and on a falling output the pMOS add capacitance without helping, so its logical effort is relatively high. Faster families drive only nMOS with the inputs and pull up some other way (monitor inputs, outputs or a clock); some use reduced swings. Static CMOS is robust: given correct inputs it eventually produces the correct output; noise just adds delay. Alternatives (ratioed, dynamic, pass-transistor) suffer charge sharing, leakage, threshold drops and ratio constraints, so check every corner. 1994–2004 was the heyday of dynamic circuits; power, robustness and productivity have since removed them except where alternatives are painful (memory arrays). Bubble pushing: DeMorgan, NAND = OR of inverted inputs, NOR = AND of inverted inputs; F = AB + CD becomes three NAND2s (Example 9.1). Compound gates: F = AB + CD as AOI22 + inverter.",
    steps: [
      { k: "learn", title: "One equation behind it all", b: [
        `<p class="eq">t ∝ (C / I) · ΔV</p>`,
        `<p>To be faster, a circuit must have <b>less capacitance</b>, <b>more current</b>, or <b>a smaller voltage swing</b>.</p>`,
        `<p>Static CMOS puts an nMOS <i>and</i> a pMOS on every input. When the output falls, the pMOS only adds capacitance. Most other families drive inputs into nMOS only, and find some other way to pull the output up.</p>`,
        seenV("Logical effort is the C/I part of this equation.", "04-delay.html", "Chapter 4"),
      ]},
      { k: "check", title: "Predict", b: [
        { t: "mcq", q: "A new family claims to be fast because the inputs drive only nMOS transistors. What must it add?", opts: [["Some other way to pull the output high", true, "A weak always-on pMOS, a clocked pMOS, or feedback from the other output."], ["Nothing: nMOS can pull up fully", false, "An nMOS only pulls up to V_DD − V_t."], ["More pMOS on each input", false, "That's static CMOS again."]] },
      ]},
      { k: "learn", title: "Why static CMOS still wins most of the time", b: [
        `<div class="two"><div class="tile"><h3>Static CMOS</h3><p>Good noise margins, low power, insensitive to variation, supported by CAD tools. Noise only <i>delays</i> the right answer.</p></div><div class="tile"><h3>Alternatives</h3><p>Ratioed, dynamic, pass-transistor. Faster in places, but noise can produce a <i>wrong</i> answer.</p></div></div>`,
        `<p class="aside">The book's verdict: most design teams now use static CMOS exclusively for combinational logic. Dynamic logic survives mainly in memory arrays.</p>`,
      ]},
      { k: "learn", title: "Bubble pushing", b: [
        `<p class="eq">NAND = OR with inverted inputs &nbsp;·&nbsp; NOR = AND with inverted inputs</p>`,
        `<p>Example 9.1: F = AB + CD is two ANDs into an OR. Turn each AND into NAND + bubble, push the bubbles onto the OR's inputs: an OR of inverted inputs is a NAND. Result: <b>three NAND2 gates</b>.</p>`,
        `<p>Or use one compound gate: <b>AOI22</b> (computes NOT(AB + CD)) followed by an inverter.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A NOR2 whose inputs are Ā and B̄ computes…", opts: [["AB", true, "NOT(Ā + B̄) = AB by DeMorgan: a NOR with inverted inputs is an AND."], ["A + B", false, "That's a NAND of inverted inputs."], ["NOT(AB)", false, "Push the bubbles through carefully."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does static CMOS have a relatively high logical effort, and how do faster families attack this?", model: "Every input drives both an nMOS and a pMOS. The pMOS is wide because it's weak, and on a falling output it adds input capacitance without helping the current. Faster families let the inputs drive only nMOS transistors and pull the output up some other way: a weak always-on device, a clocked precharge device, or feedback. Some also reduce the voltage swing." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Compound gates and their logical effort", mins: 20,
    blurb: "Each input of an AOI gate has its own logical effort. Do compound gates always win? Example 9.2 says no.",
    takeaway: "Size compound gates for the drive of a unit inverter; logical effort of each input = its input capacitance / 3 (unit inverter); parasitic delay ≈ sum of transistor widths on the output / 3. Figure 9.4: inverter g = 1, p = 1; AOI21 gA = gB = 6/3, gC = 5/3, p = 7/3; AOI22 g = 6/3 on every input, p = 12/3; complex AOI Y = NOT(A(B+C) + DE): gA = 5/3, gB = gC = 8/3, gD = gE = 8/3, p = 16/3. Example 9.2: F = AB + CD, each input ≤ 20λ of transistor width, load 100λ: H = 5, B = 1. NAND–NAND: G = (4/3)² = 16/9, P = 4, F = 80/9, D = 2F^(1/2) + P = 10.0τ, f̂ = 3.0, second-stage input C = 100·(4/3)/3.0 ≈ 44λ. AOI22–inverter: G = 2, P = 5, F = 10, D = 11.3τ, f̂ = 3.2, inverter C ≈ 31λ. Compound gates don't always give faster circuits; simple NAND2s can be quite fast. Stage efforts in 2.4–6 mean the stage count is reasonable.",
    steps: [
      { k: "learn", title: "Counting capacitance per input", b: [
        `<div class="tbl"><table><thead><tr><th>Gate</th><th>Logical effort per input</th><th>p</th></tr></thead><tbody>
          <tr><td>Inverter</td><td>1</td><td>1</td></tr>
          <tr><td>AOI21: NOT(AB + C)</td><td>A, B: 6/3 · C: 5/3</td><td>7/3</td></tr>
          <tr><td>AOI22: NOT(AB + CD)</td><td>all: 6/3</td><td>12/3</td></tr>
          <tr><td>NOT(A(B+C) + DE)</td><td>A: 5/3 · B, C, D, E: 8/3</td><td>16/3</td></tr></tbody></table></div>`,
        `<p>Size for unit-inverter drive (series stacks get wider), add up each input's width (nMOS + pMOS), divide by 3. For p, add the widths touching the output and divide by 3.</p>`,
      ]},
      { k: "check", title: "Why is C cheaper in AOI21?", b: [
        { t: "mcq", q: "In the AOI21, why is input C's logical effort (5/3) lower than A's (6/3)?", opts: [["C's nMOS is alone (not in series), so it can be unit width", true, "A and B are a 2-high nMOS stack (width 2 each); C is a single nMOS (width 1). Their pMOS are both 4."], ["C has no pMOS", false, "Every static CMOS input has one."], ["C switches last", false, "Logical effort is about capacitance, not timing."]] },
      ]},
      { k: "play", title: "Example 9.2: NANDs or AOI22?", b: [
        `<p>F = AB + CD. Each input may present up to 20λ; the load is 100λ, so H = 5. Predict first: which is faster?</p>`,
        ex92,
      ]},
      { k: "check", title: "Check the numbers", b: [
        { t: "num", q: "NAND design at H = 5: what is the input capacitance (λ of transistor width) of the second NAND, using C_in = C_out·g / f̂ with f̂ = √(80/9)?", a: 44.7, tol: 0.03, why: "100 × (4/3) / 2.98 ≈ 44.7; the book rounds to 44λ." },
      ]},
      { k: "why", title: "The lesson", b: [
        `<p>Compound gates save a stage, but their tall stacks raise g and p. Two simple NAND2s beat AOI22 + inverter at every H. <b>Always compute; don't assume</b> that fewer stages is faster.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you estimate the logical effort and parasitic delay of each input of a compound gate?", model: "Size the transistors so the worst-case pull-up and pull-down each match a unit inverter. For each input, add the widths of the nMOS and pMOS it drives and divide by 3, the input capacitance of a unit inverter. For the parasitic delay, add the widths of the transistors connected to the output node and divide by 3." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Input ordering and asymmetric gates", mins: 20,
    blurb: "Put the late input nearest the output. Make a gate lopsided to favor the critical input.",
    takeaway: "NAND2 with diffusion parasitics (Figure 9.6): if the outer input B rises last, node x starts at V_DD − V_t ≈ V_DD and must be discharged: Elmore (R/2)(2C) + R(6C) = 7RC = 2.33τ. If the inner input A rises last, x is already at 0: 6RC = 2τ (τ = 3RC). Outer input = closest to the rail; inner input = closest to the output. Connect the latest-arriving signal to the inner input. The inner input has slightly higher logical effort (node x rises → negative feedback) but remains faster for reasonable fanouts. Asymmetric gates: in a series stack, put the early input on the outer transistor and make it wider; in a parallel network, give the early input a narrower transistor. Resettable buffer (Figure 9.7): nMOS A = 4/3, reset = 4: R/4 + 3R/4 = R; A's capacitance 4/3 + 2 = 10/3 → g = 10/9 (vs 4/3); limit → 1; reset's g gets much worse; its pMOS can shrink. With velocity saturation, collapse the stack: equivalent length = sum of reciprocal relative widths; Example 9.3 (noncritical 3× critical, V_DD = 1.0 V, V_t = 0.3 V, E_cL = 1.04 V): N = 1 + 1/3 = 4/3 → relative current 0.83 → widths 1.20 and 3.60 → g = (1.20 + 2)/3 = 1.07. Perfectly symmetric NAND (Figure 9.8): split each input across both positions, for arbiters.",
    steps: [
      { k: "learn", title: "Inner and outer inputs", b: [
        fig(chain([{ p: false, g: "A (inner)", tap: "x", tcls: "s" }, { p: false, g: "B (outer)" }], { top: "Y (output)", label: "NAND2 pull-down stack" })),
        `<p>The <b>inner</b> input is next to the output; the <b>outer</b> input is next to ground. The node between them is <b>x</b>.</p>`,
      ]},
      { k: "learn", title: "Which one should arrive last?", b: [
        `<div class="two"><div class="tile"><h3>B (outer) last</h3><p>A was already on, so x was charged up to about V<sub>DD</sub>. Both Y and x must be discharged: <b>7RC = 2.33τ</b>.</p></div><div class="tile"><h3>A (inner) last</h3><p>B was on, so x is already at 0. Only Y discharges: <b>6RC = 2τ</b>.</p></div></div>`,
        `<p class="key"><b>Rule:</b> connect the latest-arriving signal to the inner input.</p>`,
      ]},
      { k: "check", title: "Quick check", b: [
        { t: "mcq", q: "A NAND3 has inputs arriving at 10 ps, 30 ps and 50 ps. Which goes on the transistor next to the output?", opts: [["The 50 ps signal", true, "The last arrival should be inner: the nodes below it are already discharged."], ["The 10 ps signal", false, "That one should be outermost (nearest ground)."], ["It doesn't matter", false, "It changes the parasitic delay."]] },
      ]},
      { k: "learn", title: "Asymmetric gates", b: [
        `<p>A buffer with a rarely-used <b>reset</b> (Figure 9.7) can be built from a NAND2 that's lopsided:</p>`,
        `<div class="tbl"><table><tbody><tr><td>A (critical) nMOS</td><td>4/3</td></tr><tr><td>reset nMOS</td><td>4</td></tr><tr><td>Pull-down resistance</td><td>R/(4/3) + R/4 = R ✓</td></tr><tr><td>Capacitance on A</td><td>4/3 + 2 = 10/3 → g = <b>10/9</b></td></tr></tbody></table></div>`,
        `<p>Better than the usual 4/3. In the limit of a huge reset transistor, A's logical effort approaches 1, like an inverter. The reset input pays for it.</p>`,
      ]},
      { k: "learn", title: "With velocity saturation (Example 9.3)", b: [
        `<p>Series transistors carry more current than the simple model says. Collapse the stack into one transistor of length N = sum of 1/(relative width): with the outer device 3× wider, N = 1 + 1/3 = 4/3.</p>`,
        `<p>EQ 4.28 with V<sub>DD</sub> − V<sub>t</sub> = 0.7 V and E<sub>c</sub>L = 1.04 V gives relative current <b>0.83</b>. So the widths become 1/0.83 = <b>1.20</b> and <b>3.60</b>, and g = (1.20 + 2)/3 = <b>1.07</b>.</p>`,
        seenV("Velocity saturation and the stack equation.", "04-delay.html", "Chapter 4"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Using the simple (no velocity saturation) RC model, size a lopsided NAND2: noncritical outer nMOS width 6, critical inner nMOS width w, total pull-down resistance R. What is w?", a: 1.2, tol: 0.01, why: "R/w + R/6 = R → 1/w = 5/6 → w = 1.2." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the inner input of a NAND gate have a lower parasitic delay when it switches last?", model: "When the inner input switches last, the outer transistor has already been on, so the internal node between them has already been discharged to ground. Only the output capacitance must be discharged. If the outer input switches last, the internal node was charged near V_DD through the inner transistor, and that extra charge must be removed too, adding delay." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Skewed gates, P/N ratios, multiple V_t", mins: 20,
    blurb: "When only one edge matters, shrink the transistor for the other edge. And what P/N ratio should a library use?",
    takeaway: "HI-skew gates favor the rising output; LO-skew the falling output, by shrinking the noncritical transistors. g_u and g_d = input capacitance / that of an unskewed inverter with equal current for that transition. HI-skew inverter (pMOS 2, nMOS 1/2): g_u = 2.5/3 = 5/6, g_d = 2.5/1.5 = 5/3, g_avg = 5/4. Skew factor 2 is common. Figure 9.10: unskewed inverter 1/1/1, NAND2 4/3, NOR2 5/3; HI-skew inverter 5/6, 5/3, 5/4; NAND2 1, 2, 3/2; NOR2 3/2, 3, 9/4; LO-skew inverter 4/3, 2/3, 1; NAND2 2, 1, 3/2; NOR2 2, 1, 3/2 (better average than unskewed!). Alternate HI and LO when only one transition matters; skewed gates pair well with dynamic logic. P/N ratio: the ratio giving least average delay is the square root of the ratio giving equal rise and fall (Exercise 9.13). With mobility ratio 2: inverter P/N ≈ 1.4 → g_u = 1.14, g_d = 0.80, g_avg = 0.97 (only 3% faster); NAND2 g = 4/3; NOR2 P/N = 1 (pMOS 2): g_u = 2, g_d = 1, g_avg = 3/2. But smaller pMOS give unequal edges (worst-edge paths, slow rising outputs → hot electrons) and lower switching point/noise margin. Choose library P/N on area, power and reliability; 1.5–2 is common for inverters; cell pitch often sets it. Multiple V_t: low-V_t is faster but leaks exponentially more; use sparingly on critical paths, or only in the critical network of skewed gates.",
    steps: [
      { k: "learn", title: "HI-skew inverter", b: [
        `<p>Keep the pMOS at 2 (rising edge unchanged), shrink the nMOS to 1/2. Input capacitance 2.5.</p>`,
        `<div class="tbl"><table><tbody><tr><td>Rising: compare with an inverter of equal rise current (pMOS 2, nMOS 1: C = 3)</td><td>g<sub>u</sub> = 2.5/3 = <b>5/6</b></td></tr><tr><td>Falling: compare with an inverter of equal fall current (pMOS 1, nMOS 1/2: C = 1.5)</td><td>g<sub>d</sub> = 2.5/1.5 = <b>5/3</b></td></tr></tbody></table></div>`,
        `<p>The critical edge got cheaper (5/6 &lt; 1); the other edge paid.</p>`,
        seenV("Skewed gates and their switching thresholds.", "02-mos-transistor.html", "Chapter 2"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "LO-skew inverter: nMOS 1, pMOS 1 (half its unskewed width). What is g_d?", a: 0.6667, tol: 0.02, why: "C_in = 2. An unskewed inverter with the same fall current has C = 3, so g_d = 2/3." },
        { t: "num", q: "Same LO-skew inverter: g_u?", a: 1.3333, tol: 0.02, why: "An unskewed inverter with the same rise current (pMOS 1, nMOS 1/2) has C = 1.5, so g_u = 2/1.5 = 4/3." },
      ]},
      { k: "learn", title: "The catalog (skew factor 2)", b: [
        `<div class="tbl"><table><thead><tr><th></th><th>Inverter</th><th>NAND2</th><th>NOR2</th></tr></thead><tbody>
          <tr><td>Unskewed g<sub>avg</sub></td><td>1</td><td>4/3</td><td>5/3</td></tr>
          <tr><td>HI-skew g<sub>u</sub> / g<sub>avg</sub></td><td>5/6 / 5/4</td><td>1 / 3/2</td><td>3/2 / 9/4</td></tr>
          <tr><td>LO-skew g<sub>d</sub> / g<sub>avg</sub></td><td>2/3 / 1</td><td>1 / 3/2</td><td>1 / <b>3/2</b></td></tr></tbody></table></div>`,
        `<p>Surprise: the LO-skew NOR2's <i>average</i> (3/2) beats the unskewed NOR2 (5/3). Its huge pMOS add capacitance for both edges but only help one.</p>`,
      ]},
      { k: "learn", title: "So what P/N ratio?", b: [
        `<p>Least <i>average</i> delay comes at the <b>square root</b> of the equal-delay ratio (you prove this in Exercise 9.13). With mobility ratio 2, the inverter's best is P/N ≈ 1.4: only <b>3%</b> faster than 2:1.</p>`,
        `<p>But a smaller pMOS also means unequal edges (some paths hit every slow edge), slow rising outputs (hot-electron wear), and a lower switching point (less noise margin). Libraries pick P/N for <b>area, power and reliability</b>: 1.5–2 for inverters. For NOR gates, shrinking the pMOS helps both delay and area.</p>`,
        seenV("SPICE's flat optimum around 1.5–2.2.", "08-simulation.html", "Chapter 8"),
      ]},
      { k: "learn", title: "Multiple thresholds", b: [
        `<p>Low-V<sub>t</sub> transistors: more ON current, but exponentially more leakage. Use them sparingly, on critical paths, or only in the critical half of a skewed gate.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What do you gain and lose with a HI-skew gate?", model: "A HI-skew gate shrinks the nMOS, the transistors for the noncritical falling edge, while keeping the pMOS the same. The rising output keeps its speed with less input capacitance, so its logical effort for that edge drops below an unskewed gate's. The falling edge becomes slower, its logical effort rises, and the switching threshold moves up, which changes the noise margins." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Ratioed circuits: pseudo-nMOS", mins: 25,
    blurb: "Replace the whole pMOS network with one weak, always-on pMOS. Fast wide NORs, at the cost of static power and a ratio to get right.",
    takeaway: "Ratioed gates: an nMOS pull-down network fights a static load; the load must be weak enough for an acceptable 0 (ratio constraint). Stronger loads → faster rise but higher V_OL, worse noise margin, more static power. Old nMOS logic used resistors, enhancement loads (V_GG; only V_DD − V_t, worse with body effect) or depletion loads (negative V_t, V_gs = 0). Pseudo-nMOS: a grounded pMOS, always ON; V_out found where I_dsn = |I_dsp|; larger pMOS → faster rise, less sharp transfer curve, higher V_OL; static current flows while the output is low. pMOS ≈ 1/4 the strength (1/2 effective width) of the pull-down; best is process-dependent, 1/3–1/6. Logical effort (Figure 9.14), with pMOS current I/3, nMOS 4I/3, net fall current I: inverter g_d = 4/9, g_u = 4/3, g_avg = 8/9; NAND2 g_avg = 16/9; NOR2 g_avg = 8/9 for any number of inputs; p: inverter 12/9 avg, NOR2 20/9 avg (p_d = 10/9, p_u = 30/9). Pseudo-nMOS suits wide NORs, ROMs and PLAs. Example 9.4: k-input AND = unit inverters + k-input pseudo-nMOS NOR driving H: G = 8/9, f̂ = √(8H/9), NOR nMOS widths √(8H), pMOS half that, D = (4√2/3)√H + (8k + 13)/9 in τ: inputs only change the parasitic delay. Fails if V_OL > V_IL of the receiver, most likely in the SF corner. Replica biasing (Figure 9.17) sets the pull-up current by width ratios (1/3 ratio possible, g_avg = 3/4) but bias is relative to V_DD and still somewhat process-sensitive. Enable the pullup off when idle or for IDDQ test. Example 9.5: 32×48 ROM, 5:32 pseudo-nMOS decoder plus 48 bitline pullups, 360 µA/µm × 0.1 µm × 1.0 V = 36 µW each; 31 + 24 low → 1.98 mW. Ganged CMOS / symmetric NOR: two inverters' outputs tied; both pMOS on when both inputs 0 (fast rise), both off when both 1 (no static power); g_u = 1, g_d = 2/3, g_avg = 5/6.",
    steps: [
      { k: "learn", title: "A tug of war", b: [
        fig(chain([{ p: true, g: "GND", tap: "Y" }, { p: false, g: "A" }], { label: "Pseudo-nMOS inverter" })),
        `<p>The pMOS's gate is grounded: it is <b>always on</b>. When A = 1 the nMOS must win the fight. So the pMOS must be weak: about <b>1/4</b> of the pull-down's strength.</p>`,
        `<p>The output low level V<sub>OL</sub> isn't 0, and current flows from V<sub>DD</sub> to GND the whole time Y is low.</p>`,
      ]},
      { k: "check", title: "Predict", b: [
        { t: "mcq", q: "You make the pMOS stronger. What happens?", opts: [["Faster rising edge, but higher V_OL and more static power", true, "That's the ratio trade-off."], ["Everything gets better", false, "The falling edge fights a stronger pMOS, and V_OL rises."], ["No change: the nMOS always wins", false, "Only if it's much stronger."]] },
      ]},
      { k: "play", title: "How strong should the pull-up be?", b: [
        `<p>Let the pMOS deliver a fraction r of the nMOS current. Size the nMOS so the <i>net</i> falling current (pull-down minus pull-up) equals a unit inverter's.</p>`,
        pseudoLE,
        `<p class="aside">Logical effort alone would pick r = 0.5, but then the output only falls halfway: useless. r ≈ 1/4 is the book's compromise; it gives g<sub>d</sub> = 4/9, g<sub>u</sub> = 4/3, g<sub>avg</sub> = 8/9.</p>`,
      ]},
      { k: "learn", title: "Where pseudo-nMOS shines", b: [
        `<p>A k-input pseudo-nMOS NOR is just k nMOS in parallel plus one pMOS. Each input sees one nMOS, so <b>g<sub>avg</sub> = 8/9 no matter how many inputs</b>. Only the parasitic delay grows. Ideal for wide NORs, ROMs and PLAs.</p>`,
        `<p>NANDs are a bad fit: the series stack must be wide (NAND2 g<sub>avg</sub> = 16/9).</p>`,
        `<p>Example 9.4 (k-input AND = inverters + pseudo-nMOS NOR, load H): D = (4√2/3)√H + (8k + 13)/9. Adding inputs only touches the constant term.</p>`,
      ]},
      { k: "learn", title: "Corners and fixes", b: [
        `<p>It fails if V<sub>OL</sub> exceeds the next gate's V<sub>IL</sub>. Worst case: <b>SF</b> (slow nMOS, fast pMOS). Designing for SF forces weak pMOS in the normal corner.</p>`,
        `<p><b>Replica biasing</b> (Figure 9.17) generates a V<sub>bias</sub> so the pull-up delivers a set fraction of the pull-down current regardless of mobility. It allows a 1/3 ratio (g<sub>avg</sub> = 3/4). An <b>enable</b> can switch the pull-up off when idle or during IDDQ test.</p>`,
      ]},
      { k: "check", title: "Static power (Example 9.5 style)", b: [
        { t: "num", q: "A pseudo-nMOS pull-up: 360 µA/µm, 0.2 µm wide, V_DD = 1.0 V. A block has 40 such gates with low outputs. Static power in mW?", a: 2.88, tol: 0.02, why: "360 µA/µm × 0.2 µm × 1.0 V = 72 µW each; × 40 = 2.88 mW." },
      ]},
      { k: "learn", title: "Ganged CMOS (symmetric NOR)", b: [
        `<p>Tie the outputs of two inverters together (Figure 9.19). One input high: it behaves like pseudo-nMOS. Both 0: both pMOS pull up (fast). Both 1: both pMOS off (no static power). g<sub>u</sub> = 1, g<sub>d</sub> = 2/3, g<sub>avg</sub> = 5/6: faster and lower power than a pseudo-nMOS NOR2.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is the ratio constraint in a pseudo-nMOS gate, and why does it get checked in the SF corner?", model: "The always-on pMOS fights the nMOS pull-down when the output should be low, so the output only falls to a V_OL set by their relative strengths. The pMOS must be weak enough that V_OL stays below the next gate's V_IL with margin, yet strong enough for an acceptable rising delay. The worst case is slow nMOS with fast pMOS (SF), where the pull-up is relatively strongest and V_OL is highest." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "CVSL and dynamic gates", mins: 25,
    blurb: "Precharge high, then evaluate. Very low logical effort and no contention, but the inputs must only rise.",
    takeaway: "CVSL (cascode voltage switch logic): true and complementary inputs, two nMOS pull-down networks f and f̄ (conduction complements: series in one, parallel in the other) and cross-coupled pMOS; no static power. Networks can share transistors (4-input XOR). It needs both transitions (pull down one side, then the pMOS pulls up the other) plus contention, so it's usually slower and more power-hungry than static CMOS; its ideas underlie dual-rail domino and CPL. Dynamic gates: a clocked pMOS precharges Y high while φ = 0; evaluation (φ = 1) leaves Y high or discharges it. Fastest common family: low input capacitance, no contention, zero static power; but careful clocking, high dynamic power, noise sensitivity. Input high during precharge causes contention → add a clocked foot nMOS. Precharge sized for 2× unit resistance. Figure 9.25 (falling logical effort): unfooted inverter g_d = 1/3, p_d = 2/3; NAND2 2/3, 3/3; NOR2 1/3, 3/3; footed inverter 2/3, 3/3; NAND2 3/3, 4/3; NOR2 2/3, 5/3. Logical effort is independent of the number of inputs for wide NORs and muxes; parasitic delay grows. Monotonicity: inputs must be monotonically rising during evaluation (0→0, 0→1, 1→1; never 1→0). Dynamic outputs fall monotonically, so dynamic gates on the same clock can't drive each other directly.",
    steps: [
      { k: "learn", title: "CVSL", b: [
        `<p>Two nMOS networks: f pulls one output low, f̄ (the complement) pulls the other. Cross-coupled pMOS pull the opposite output high. No static power.</p>`,
        `<p>But a transition needs one side to fall, <i>then</i> the other to rise, with a fight in between. In practice CVSL is slower and hungrier than static CMOS. Its ideas return in dual-rail domino and CPL.</p>`,
      ]},
      { k: "learn", title: "A dynamic gate", b: [
        fig(chain([{ p: true, g: "φ", tap: "Y" }, { p: false, g: "A" }, { p: false, g: "φ (foot)" }], { label: "Footed dynamic inverter" })),
        `<div class="two"><div class="tile"><h3>Precharge (φ = 0)</h3><p>pMOS on, foot off: Y charges high.</p></div><div class="tile"><h3>Evaluate (φ = 1)</h3><p>pMOS off, foot on: Y discharges if the pull-down network conducts; otherwise it <i>floats</i> high.</p></div></div>`,
        `<p>The <b>foot</b> prevents a fight if an input is high during precharge. Unfooted gates are faster but need inputs guaranteed low during precharge.</p>`,
      ]},
      { k: "learn", title: "Tiny logical efforts", b: [
        `<div class="tbl"><table><thead><tr><th>Falling g<sub>d</sub> (p<sub>d</sub>)</th><th>Inverter</th><th>NAND2</th><th>NOR2</th></tr></thead><tbody><tr><td>Unfooted</td><td>1/3 (2/3)</td><td>2/3 (3/3)</td><td>1/3 (3/3)</td></tr><tr><td>Footed</td><td>2/3 (3/3)</td><td>3/3 (4/3)</td><td>2/3 (5/3)</td></tr></tbody></table></div>`,
        `<p>Compare static: 1, 4/3, 5/3. A dynamic NOR's g doesn't grow with inputs.</p>`,
      ]},
      { k: "play", title: "Monotonicity", b: [
        `<p>Before clicking each case: will Y end up right?</p>`,
        dynWave,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "During evaluation, which input behaviours are safe for a dynamic gate?", bins: ["Safe", "Breaks it"], items: [
          ["Starts low, stays low", 0, "Nothing discharges."],
          ["Starts low, rises", 0, "Monotonically rising: fine."],
          ["Starts high, stays high", 0, "Discharges once, correctly."],
          ["Starts high, falls", 1, "The output was already discharged and can't recover."],
          ["Is the output of another dynamic gate on the same clock", 1, "It starts high (precharged) and falls."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must the inputs of a dynamic gate rise monotonically during evaluation?", model: "During evaluation the precharge transistor is off, so the output can only be pulled down, never back up. If an input is high at the start of evaluation and later falls, the output may already have been discharged, and nothing can restore it until the next precharge. So inputs may stay low, rise, or stay high, but must never fall during evaluation." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Domino, dual-rail, keepers, charge sharing", mins: 25,
    blurb: "An inverter after each dynamic gate fixes monotonicity. Then the fixes for leakage, noise and charge sharing.",
    takeaway: "Domino gate = dynamic gate + static inverting gate (usually HI-skew, since its output rises monotonically). Precharge happens in parallel, evaluation ripples like falling dominos. Compound domino puts NAND/NOR in the static stage (e.g., 8-input mux = two 4-input dynamic muxes + HI-skew NAND2). Domino is noninverting; for inversion: put XOR in static logic at the end, delay clocks to later gates (CAMs, NOR–NOR PLAs), or dual-rail domino. Dual-rail: <code>sig_h</code>, <code>sig_l</code>: 00 precharged, 01 '0', 10 '1', 11 invalid; dynamic form of CVSL (DCVS); complete logic family; more area, wiring and power; loses wide-NOR efficiency; gives completion detection (NAND of the rails) for asynchronous design; interdigitate bus rails to limit coupling. Keepers: weak pMOS from the output inverter holds X high against leakage and noise; must beat leakage (wide NOR at burn-in) but slows the gate 5–10%; Montecito: keeper 6% of leaking pull-down width (8 × 1 µm → 0.48 µm); small gates use long keepers or split keepers; differential keepers for dual-rail; burn-in conditional keeper; separate feedback inverter avoids output crosstalk; sizing must handle FS (retain) and SF (delay) corners and ~5σ variation; adaptive and leakage-replica keepers. Charge sharing: V_x = V_Y = C_Y/(C_x + C_Y)·V_DD (EQ 9.3), worst for lightly loaded outputs and big internal nodes; fix with small secondary precharge transistors (every other node often enough); SOI is less susceptible. By the time feet, keepers and secondary precharge are added, domino is seldom more compact than static CMOS.",
    steps: [
      { k: "learn", title: "Domino", b: [
        `<p>Put a static inverter after each dynamic gate. The dynamic node X falls monotonically, so the inverter output <b>rises</b> monotonically: a safe input for the next dynamic gate.</p>`,
        `<p>All gates precharge together; in evaluation they fire one after another, like dominos. The inverter is usually <b>HI-skew</b>: only its rising edge matters.</p>`,
        `<p>Domino gates are <b>noninverting</b>. Ways out: put a final XOR in static logic, delay the clocks of later gates, or go <b>dual-rail</b>.</p>`,
      ]},
      { k: "learn", title: "Dual-rail domino", b: [
        `<div class="tbl"><table><thead><tr><th>sig_h</th><th>sig_l</th><th>Meaning</th></tr></thead><tbody><tr><td>0</td><td>0</td><td>precharged</td></tr><tr><td>0</td><td>1</td><td>'0'</td></tr><tr><td>1</td><td>0</td><td>'1'</td></tr><tr><td>1</td><td>1</td><td>invalid</td></tr></tbody></table></div>`,
        `<p>Every function is possible, plus a free <b>done</b> signal (one rail fired). The price: double the wires, more area and power.</p>`,
      ]},
      { k: "learn", title: "Keepers", b: [
        `<p>A floating-high node X leaks away, and an input bumping above V<sub>t</sub> can discharge it. A <b>keeper</b> is a weak pMOS driven by the output inverter: while Y is low it holds X high.</p>`,
        `<p>Too weak: leakage wins (worst for wide NORs at burn-in). Too strong: it fights real discharges and slows the gate (typically 5–10%). Montecito used 6% of the leaking pull-down width.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 16-input dynamic NOR with 0.5 µm pull-down transistors uses Montecito's 6% rule. Keeper width in µm?", a: 0.48, tol: 0.01, why: "16 × 0.5 = 8 µm of leaking width × 6% = 0.48 µm." },
      ]},
      { k: "learn", title: "Charge sharing", b: [
        fig(chain([{ p: true, g: "φ", tap: "Y (C_Y)" }, { p: false, g: "A = 1", tap: "x (C_x)", tcls: "s" }, { p: false, g: "B = 0" }], { label: "Dynamic NAND2 with charge sharing" })),
        `<p>Y is precharged high; x was left at 0. A rises, B stays low: Y should stay high. But A connects x to Y and they share charge:</p>`,
        `<p class="eq">V<sub>Y</sub> = C<sub>Y</sub> / (C<sub>x</sub> + C<sub>Y</sub>) · V<sub>DD</sub></p>`,
      ]},
      { k: "play", title: "How bad?", b: [
        chargeShare,
        `<p>Fix: small <b>secondary precharge</b> transistors that also charge x (often every other internal node). Keep them small: their diffusion slows evaluation.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a keeper do in a domino gate, and why can't it be large?", model: "When the dynamic node is supposed to stay high, the keeper, a weak pMOS controlled by the output inverter, supplies current to replace leakage and to resist noise on the inputs. When the node should fall, the pull-down network must overpower the keeper, so a strong keeper slows the gate. It has to be just strong enough to beat leakage and noise across process corners." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Dynamic paths: efforts, MODL, NP domino", mins: 20,
    blurb: "Domino buffers lower the path effort, so dynamic paths want more stages. A worked comparison, the Manchester carry chain, and NORA.",
    takeaway: "Domino buffer logical effort G = 5/9 footed (2/3 × 5/6), 5/18 unfooted (1/3 × 5/6): appending buffers decreases path effort. Best stage effort ≈ 2.76 for footed domino paths, 2.0 for unfooted [Sutherland99]; rule of thumb 2–3 (vs 4 for static). Example 9.6, 8-input domino AND: 4-stage (footed NAND4 g = 5/3, HI-skew inverter 5/6, footed NAND2 3/3, HI-skew inverter 5/6): G = 125/108, P = 5, D = 4(125H/108)^(1/4) + 5. 2-stage (two footed NAND4 into a HI-skew NOR2, g = 3/2): G = 5/2, P = 11/3, D = 2(5H/2)^(1/2) + 11/3. Static gates between dynamic stages use slow pMOS and cut the stage count, so use them only at low electrical effort. (The text says the 4-stage design wins for H > 2.9; its own equations cross near H ≈ 6.2.) MODL (multiple-output domino) computes nested functions in one gate: carry chain c_i = g_i + p_i·c_(i−1) as a Manchester carry chain; intermediate outputs need secondary precharge; inputs must be mutually exclusive to avoid sneak paths: define p_i = a_i XOR b_i, not a_i + b_i (otherwise with a4 = b4 = 1, c3 falsely fires). NP (NORA) domino replaces HI-skew static gates with predischarged pMOS-logic dynamic gates; worse logical effort (footed p-logic NOR2 2 vs 3/2, NAND2 4/3 vs 1) and very noise-sensitive (dynamic outputs drive dynamic inputs); little reason to use it. Zipper domino leaves precharge devices slightly on (like a keeper); never widely used.",
    steps: [
      { k: "learn", title: "Buffers that help", b: [
        `<p>A domino buffer (dynamic inverter + HI-skew inverter) has G = 2/3 × 5/6 = <b>5/9</b> footed, 5/18 unfooted. Less than 1! Adding one <i>reduces</i> the path effort.</p>`,
        `<p class="key">Static CMOS paths: aim for stage effort ≈ 4. Domino paths: aim for <b>2–3</b> (2.76 footed, 2.0 unfooted).</p>`,
        seenV("Best stage effort and the number of stages.", "04-delay.html", "Chapter 4"),
      ]},
      { k: "play", title: "Example 9.6: two stages or four?", b: [
        `<p>8-input domino AND. Four stages: footed NAND4 → HI-skew inverter → footed NAND2 → HI-skew inverter. Two stages: two footed NAND4 → HI-skew NOR2.</p>`,
        `<p class="eq">D<sub>4</sub> = 4(125H/108)<sup>1/4</sup> + 5 &nbsp;&nbsp; D<sub>2</sub> = 2(5H/2)<sup>1/2</sup> + 11/3</p>`,
        ex96,
      ]},
      { k: "check", title: "Check the book", b: [
        { t: "mcq", q: "Using the two equations, roughly where does the 4-stage design start to win?", opts: [["H ≈ 6", true, "Both give ≈ 11.54τ at H ≈ 6.2. The text says “for H > 2.9”, but at H = 2.9 the equations give 9.05τ (2-stage) vs 10.41τ (4-stage). Trust what you can check, and note the discrepancy."], ["H ≈ 2.9", false, "That's what the text says. Move the slider to 2.9 and compare."], ["Never", false, "Push H past 7."]] },
        `<p class="aside">The conclusion holds either way: the HI-skew NOR uses slow pMOS, so static logic between dynamic stages only pays off at low electrical effort.</p>`,
      ]},
      { k: "learn", title: "Manchester carry chain (MODL)", b: [
        `<p class="eq">c<sub>i</sub> = g<sub>i</sub> + p<sub>i</sub> c<sub>i−1</sub></p>`,
        `<p>Each carry is nested inside the next, so one dynamic chain can produce c1 … c4 at taps along the stack. Taps need secondary precharge. <b>Sneak paths:</b> g and p must be mutually exclusive, so p<sub>i</sub> = a<sub>i</sub> ⊕ b<sub>i</sub>. With p = a + b and a<sub>4</sub> = b<sub>4</sub> = 1, g<sub>4</sub> and p<sub>4</sub> are both on, and c<sub>3</sub> wrongly discharges through them.</p>`,
        `<p>You'll meet carry chains properly in Chapter 11.</p>`,
      ]},
      { k: "learn", title: "NP (NORA) and zipper", b: [
        `<p>NP domino replaces the static inverters with predischarged pMOS-logic dynamic gates. Worse logical effort and very noise-prone: noisy dynamic outputs feed sensitive dynamic inputs. The book: “little reason to use NORA.” Zipper domino never caught on either.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do domino paths prefer more stages than static CMOS paths?", model: "A domino buffer, a dynamic inverter followed by a HI-skew inverter, has a logical effort below one, so adding stages lowers the total path effort while adding only small parasitic delay. The best stage effort is therefore about 2 to 3 instead of about 4. Putting logic into the static stages instead uses slow pMOS transistors and is only worthwhile when the electrical effort is low." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Pass-transistor circuits", mins: 20,
    blurb: "Inputs on the diffusion terminals. Transmission gates, CPL, LEAP, and why most of the claims didn't survive.",
    takeaway: "Pass-transistor circuits apply inputs to source/drain as well as gates, using nMOS pass transistors or transmission gates. Essential in 6T SRAM cells; good for XOR-rich circuits (full adders, muxes); for general logic static CMOS is superior in speed, power and area [Zimmermann97]. Static CMOS is poorly suited to XOR (complex gate + two inverters), less so to NAND/NOR. CMOSTG: transmission gates plus a static output inverter to restore levels (bare TG muxes are nonrestoring). Unit TG resistance ≈ R: poor-direction resistance 2R (nMOS) and 4R (pMOS); passing 0: R ∥ 4R = 4R/5; passing 1: 2R ∥ 2R = R; usually equal-sized nMOS and pMOS. A TG mux with the previous stage's inverters is the static CMOS mux with intermediate nodes shorted (lower resistance, slightly more capacitance; usually a bit faster). Drawbacks of the TG form: delay depends on the driver (bad for timing tools; novices characterize with an ideal source and look twice as fast), diffusion inputs are noise-sensitive, extra contacts. Logical effort: begin stages at gate inputs; TG mux g = 6/3 from A or B. Avoid more than two TGs in series without buffering. Tristate: the version with A and enable swapped is logically equal but electrically worse (charge sharing onto a floating output). CPL: like CVSL but one half pulls up while the other pulls down; nMOS-only outputs reach V_DD − V_t, so add weak cross-coupled pMOS and LO-skew output inverters. LEAP: single-ended nMOS network, inverter output (LO-skew), weak pMOS feedback to restore the high level (fails if too strong); good for wide 1-of-N muxes; needs V_DD ≥ 2V_t. Others (DPTL, DPL, EEPL, PPL, SRPL, DCVSPG) are dual-rail; all slower and larger than CPL. Pass-transistor families faded: no modularity, hard timing analysis, library effort.",
    steps: [
      { k: "learn", title: "Inputs on the diffusion", b: [
        `<p>In every family so far, inputs drove only <b>gates</b>. Pass-transistor logic also feeds signals into <b>sources and drains</b>. Good fits: XOR-heavy logic (adders), multiplexers, and the 6T SRAM cell. For general logic, an independent study found static CMOS better in speed, power and area.</p>`,
      ]},
      { k: "learn", title: "Transmission gate resistance", b: [
        `<p>Each transistor passes one value well and the other poorly (about 2× its normal resistance: 2R for nMOS, 4R for pMOS):</p>`,
        `<div class="tbl"><table><tbody><tr><td>Passing 0</td><td>nMOS R ∥ pMOS 4R = <b>4R/5</b></td></tr><tr><td>Passing 1</td><td>nMOS 2R ∥ pMOS 2R = <b>R</b></td></tr></tbody></table></div>`,
        `<p>So a unit transmission gate ≈ R either way. Making the pMOS bigger barely helps resistance but adds capacitance.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A transmission gate uses a pMOS twice the unit width (nMOS unit). Estimate its resistance passing a 1, in units of R.", a: 0.6667, tol: 0.02, why: "nMOS poor direction: 2R. pMOS width 2 passing 1 (good direction): 2R/2 = R. 2R ∥ R = 2R/3." },
      ]},
      { k: "learn", title: "Nothing new under the sun", b: [
        `<p>Redraw a TG mux together with the inverters that drive it: it's the <b>static CMOS mux with its internal nodes shorted</b> (Figure 9.49). Usually a little faster; slightly more capacitance.</p>`,
        `<p>For logical effort, start each stage at a <b>gate</b> input. The TG mux has g = 6/3 from A or B, just like static. Don't put more than two TGs in series without a buffer.</p>`,
        `<p class="key"><b>Classic trap:</b> characterizing a TG circuit with an ideal voltage source on the diffusion input. It looks about twice as fast as it really is.</p>`,
      ]},
      { k: "play", title: "Threshold drops", b: [
        `<p>An nMOS passes a 1 only up to V<sub>DD</sub> − V<sub>t</sub> (and the body effect makes V<sub>t</sub> larger).</p>`,
        vtDrop,
        `<p class="aside">Old processes had V<sub>DD</sub> ≈ 5V<sub>t</sub>; modern ones ≈ 3V<sub>t</sub>. A drop that was tolerable then is not now.</p>`,
      ]},
      { k: "learn", title: "CPL and LEAP", b: [
        `<div class="two"><div class="tile"><h3>CPL</h3><p>Dual-rail nMOS networks: one side pulls down while the other pulls up (CVSL had to wait). Weak cross-coupled pMOS restore the full high level; LO-skew output inverters.</p></div><div class="tile"><h3>LEAP</h3><p>Single-rail nMOS network + inverter + weak pMOS feedback to restore the high level. Compact, good for wide 1-of-N muxes. Needs V<sub>DD</sub> ≥ 2V<sub>t</sub>.</p></div></div>`,
        `<p>DPL, EEPL, SRPL, PPL, DCVSPG, DPTL: all slower and larger than CPL, or with unbuffered-output noise problems.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does characterizing a transmission-gate circuit with an ideal voltage source on its input make it look too fast?", model: "In a real circuit the diffusion input is driven by a previous gate whose output resistance is in series with the transmission gate, so the delay depends on that driver as well as the transmission gate. An ideal voltage source has zero resistance, which removes about half of the real series resistance from the path. The circuit can look roughly twice as fast as it will be on the chip." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "Circuit pitfalls and noise budgets", mins: 25,
    blurb: "A catalog of how clever circuits fail: ratios, leakage, charge sharing, supply noise, injection, back-gate coupling. Then a domino noise budget.",
    takeaway: "Pitfalls: threshold drops, ratio failures, leakage, charge sharing, power supply noise, coupling, minority carrier injection, back-gate coupling, diffusion input noise sensitivity, races, delay matching, metastability, hot spots, soft errors, process sensitivity. Threshold drop: pass nMOS gives V_DD − V_t (body effect worse); leaves the next pMOS partly on (static power), may miss V_IH, slow approach; replace with TGs or weak pMOS feedback. Ratio failures: weak devices must be small enough (pseudo-nMOS, keepers, restorers, latch feedback); check SF and FS; latch with diffusion input must be checked together with its driver and wire. Leakage: t = C_node·ΔV / I_leak (EQ 9.6); fully dynamic gates without keepers aren't viable; wide NORs at burn-in; two OFF transistors in series leak much less (stack effect, DIBL). Charge sharing also when a dynamic node drives a transmission gate. Supply noise: IR drops and L di/dt; target 5–10% of V_DD; keep sensitive circuits close and on a shared low-resistance supply. Hot spots: nonuniform power → delay variation; electrothermal simulation. Minority carrier injection: node driven outside the rails forward-biases junctions; keep injectors (I/O pads) away, guard rings, substrate contacts. Back-gate coupling: a floating dynamic node drives the inner input of a static NAND; when the other input discharges the internal node, C_gs pulls the dynamic node down; drive the outer input instead. Diffusion inputs: noise below −V_t turns on a TG; standard cells buffer latch inputs (modularity). Process sensitivity: simulate all corners, voltages, temperatures (including burn-in); plan for migration (Pentium 4 repeaters spaced for future nodes). Domino noise budget (3.3 V example): HI-skew inverter V_IH = 2.08 V → NM_H = 37% V_DD for the dynamic output; dynamic gate with small keeper V_IL = 0.63 V → NM_L = 19% for the dynamic input; allocated to charge sharing, coupling, supply and feedthrough noise (output: charge sharing 10%, coupling 17%). Dynamic gates: worst noise margin in FS; HI-skew static gates in SF. NP and clock-delayed domino are risky: noisy dynamic outputs drive sensitive dynamic inputs.",
    steps: [
      { k: "learn", title: "Simple circuits are robust", b: [
        `<p>Every extra transistor is extra capacitance and another way to fail. Static CMOS is the most robust family; use it whenever possible. If you can't afford tools that check for these pitfalls, stick with static CMOS.</p>`,
      ]},
      { k: "learn", title: "Ratio failures and leakage", b: [
        `<p><b>Ratios:</b> any weak device that must lose a fight (pseudo-nMOS loads, keepers, latch feedback). A latch with a diffusion input must be checked <i>with its driver and the wire</i>: you can't verify it alone.</p>`,
        `<p><b>Leakage</b> slowly discharges a floating node:</p>`,
        `<p class="eq">t = C<sub>node</sub> · ΔV / I<sub>leak</sub></p>`,
        `<p>Two OFF transistors in series leak far less than one (the outer one sees less drain voltage, so less DIBL).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A floating dynamic node of 5 fF leaks 2 nA. How long (ns) until it droops 0.1 V?", a: 250, tol: 0.01, why: "5 fF × 0.1 V / 2 nA = 0.5 fC / 2 nA = 2.5 × 10⁻⁷ s = 250 ns." },
      ]},
      { k: "learn", title: "Noise you might not expect", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>Supply noise</b></td><td>IR drop and L·di/dt; budget 5–10% of V<sub>DD</sub>. Keep sensitive pairs close, on a shared supply wire.</td></tr>
          <tr><td><b>Minority carrier injection</b></td><td>A node driven below GND injects electrons that a nearby dynamic node collects. Keep I/O away; guard rings and substrate contacts.</td></tr>
          <tr><td><b>Back-gate coupling</b></td><td>A dynamic node on a static NAND's inner input gets dragged down through C<sub>gs</sub> when the internal node falls. Drive the outer input.</td></tr>
          <tr><td><b>Diffusion input noise</b></td><td>Noise below −V<sub>t</sub> on a latch's TG input turns it on and flips the stored bit. Standard cells buffer latch inputs.</td></tr>
          <tr><td><b>Hot spots</b></td><td>Uneven power makes hot regions slower.</td></tr></tbody></table></div>`,
      ]},
      { k: "check", title: "Name the pitfall", b: [
        { t: "sort", q: "Which pitfall is each?", bins: ["Charge sharing", "Back-gate coupling", "Minority carriers", "Process sensitivity"], items: [
          ["A dynamic output drives a transmission gate that turns on into a low node", 0, "Charge splits between the two capacitances."],
          ["An output pad rings below ground next to a domino gate", 2, "Forward-biased junctions inject electrons into the substrate."],
          ["A domino gate drives the input next to the output of a static NAND2", 1, "The inner transistor's C_gs couples the internal node's fall onto the dynamic node."],
          ["A latch works at TT but fails in the SF corner", 3, "Ratios shift with corners."],
        ]},
      ]},
      { k: "learn", title: "A domino noise budget", b: [
        `<p>3.3 V example: the HI-skew inverter reading a dynamic output has V<sub>IH</sub> = 2.08 V, so the dynamic <b>output</b> may droop <b>37%</b> of V<sub>DD</sub>. A dynamic gate with a small keeper has V<sub>IL</sub> = 0.63 V, so its <b>input</b> tolerates only <b>19%</b>.</p>`,
        `<p>Those margins are split among charge sharing, coupling, supply and feedthrough noise. For the dynamic output the big shares are coupling (17%) and charge sharing (10%).</p>`,
        `<p>Domino is a good arrangement: the noise-prone dynamic output drives a robust static gate, and the sensitive dynamic input is driven strongly by a static gate. NP and clock-delayed domino break that: risky.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is noise more dangerous in domino logic than in static CMOS?", model: "In static CMOS, noise only delays the output; an ON transistor keeps driving it back to the correct value. In domino, the dynamic node floats with only a weak keeper, and dynamic inputs have a noise margin of only about V_t. A noise event, such as charge sharing, coupling, leakage or supply noise, can discharge the node, and nothing restores it until the next precharge, so the result is a wrong value, not just a slow one." },
      ]},
    ],
  };

  /* =============== PART 11 =============== */
  const p11 = {
    id: "p11", title: "SOI, subthreshold, and the lessons of history", mins: 25,
    blurb: "A floating body that remembers, logic at 300 mV, and why most clever circuit families died.",
    takeaway: "SOI: transistors sit on buried oxide, surrounded by trench oxide: almost no diffusion capacitance (lower parasitic delay, dynamic power) and latchup immunity; IBM PowerPC from 1998. FD SOI: body thinner than the depletion width, fixed body charge (hard to make); PD SOI: body voltage floats. Charge enters via junction leakage and impact ionization, leaves via forward-biased source junction and capacitive coupling; idle devices reach equilibrium in ~µs, switching spills charge, shifting V_t. Advantages: lower capacitance; smaller V_t variation so lower nominal V_t; subthreshold slope 75–85 mV/decade (bulk ~90 mV/dec, n ≈ 1.5; not the hyped 60); FinFETs better still. Disadvantages: history effect (~8% delay variation, mismatch in sense amps → body contacts), parasitic bipolar (pass-gate leakage: source and drain high, body floats high, source pulled low → current pulse; hurts dynamic latches/gates; needs strong keepers ~1/4 strength), self-heating 10–15 °C for clock and I/O drivers; gated clocks see more skew. Subthreshold: minimum energy at V_DD < V_t, ~300–500 mV (higher if leakage dominates); kHz–low MHz; an order of magnitude less energy per operation; power orders of magnitude lower; S = 100 mV/dec → V_gs = 0.3 V leaks 1000× V_gs = 0. Sizing: voltage gives exponential speed, width only linear: use minimum widths and raise V_DD to meet speed; wires dominate capacitance, so small cells and good placement. Gates: static CMOS works to ~100 mV in principle; with variation ~300 mV; use simple gates (≤ AOI22 / NAND3); avoid wide parallel structures, ratioed circuits, weak-feedback latches and dynamic gates. Pitfalls and fallacies: failing to plan for technology (BiCMOS, Exponential), comparing to a strawman (40- vs 28-transistor adders), ignoring driver resistance, reporting only clock-to-Q, outrageous claims (no free lunch), no verification tools, sizing subthreshold circuits for speed. History: nMOS ratioed and dynamic logic; domino at Bell Labs (BELLMAC-32A); Alpha 21164 last without keepers (20 MHz minimum); MHz wars cut cycles to 10–12 FO4 with elaborate domino, Pentium 4 Prescott LVS; then power and debug pushed design back to static CMOS (IBM POWER6 5 GHz without dynamic datapaths). Dynamic logic remains in memory arrays.",
    steps: [
      { k: "learn", title: "Silicon on insulator", b: [
        `<p>The transistor sits on a layer of buried oxide, walled in by trench oxide. The source and drain no longer touch a conducting substrate: <b>almost no diffusion capacitance</b>, and <b>no latchup</b>.</p>`,
        `<p>But in partially depleted SOI the <b>body floats</b>. Its voltage, and so V<sub>t</sub>, depends on what the transistor has been doing.</p>`,
        seenV("SOI wafers and FinFETs.", "03-processing.html", "Chapter 3"),
      ]},
      { k: "learn", title: "The floating body", b: [
        `<div class="two"><div class="tile"><h3>Charge in (slow)</h3><p>Drain junction leakage; impact ionization holes.</p></div><div class="tile"><h3>Charge out</h3><p>Source junction forward-biases; a rising gate or drain couples the body up and spills charge.</p></div></div>`,
        `<ul><li><b>History effect:</b> delay depends on past switching (~8%), and matched pairs drift apart. Sense amps need body contacts.</li><li><b>Parasitic bipolar:</b> source/body/drain = an npn. Hold source and drain high, then pull the source low: a current pulse flows through an “off” transistor (pass-gate leakage). Dynamic nodes need strong keepers.</li><li><b>Self-heating:</b> oxide insulates heat too; clock and I/O drivers run 10–15 °C hotter.</li></ul>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Subthreshold slope S = n·v_T·ln 10 with v_T = 26 mV. What is S (mV/decade) for n = 1.5?", a: 89.8, tol: 0.02, why: "1.5 × 26 × 2.303 ≈ 90 mV/decade (bulk). Real SOI: 75–85; the “ideal 60” claim assumes n = 1." },
      ]},
      { k: "learn", title: "Subthreshold logic", b: [
        `<p>For pacemakers and energy-scavenging sensors, energy per operation is everything. The minimum-energy point is usually at <b>V<sub>DD</sub> ≈ 300–500 mV</b>, below V<sub>t</sub>. All transistors are “off”, but some are much more off than others:</p>`,
        `<p class="eq">I(V<sub>gs</sub> = 0.3 V) / I(V<sub>gs</sub> = 0) = 10<sup>0.3/S</sup> = 1000 for S = 100 mV/dec</p>`,
        `<p>Speed drops to kHz–MHz, energy per operation drops about 10×.</p>`,
        seenV("The minimum energy point.", "05-power.html", "Chapter 5"),
      ]},
      { k: "learn", title: "Designing for it", b: [
        `<ul><li><b>Sizing:</b> voltage buys speed exponentially, width only linearly. Use minimum widths; raise V<sub>DD</sub> slightly if you need speed.</li><li><b>Gates:</b> keep them simple (no worse than AOI22 or NAND3). Avoid wide parallel structures (off-leakage beats on-current), ratioed circuits, weak-feedback latches, and dynamic gates.</li><li><b>Wires</b> dominate capacitance: small cells, good placement.</li></ul>`,
      ]},
      { k: "check", title: "Spot the fallacy", b: [
        { t: "mcq", q: "A paper proposes doubling transistor widths in a subthreshold circuit to make it faster. The book's objection?", opts: [["The same speed could be had for less energy by raising V_DD a little", true, "Speed is exponential in voltage, linear in width."], ["Wider transistors leak less", false, "They leak more."], ["Subthreshold circuits can't be sped up", false, "They can: by voltage."]] },
      ]},
      { k: "why", title: "Lessons from history", b: [
        `<p>BiCMOS was hot in the early 1990s (hundreds of papers, the Pentium and Pentium Pro). Scaling made CMOS faster and supplies lower, and the bipolar V<sub>be</sub> became too large a fraction of V<sub>DD</sub>. A startup called Exponential poured over $40 million into a BiCMOS PowerPC and failed.</p>`,
        `<p>During the “MHz wars” (1994–2004) cycles shrank to 10–12 FO4 delays using elaborate domino and the Pentium 4's low-swing LVS logic. Power and silicon-debug pain then pushed designs back to static CMOS. IBM's POWER6 hit 5 GHz with no dynamic logic in its datapaths.</p>`,
        `<p class="key"><b>There's no free lunch.</b> If a circuit looks too good to be true, look for the strawman comparison, the ideal-source input, or the missing setup time.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do PD SOI circuits show a history effect, and which circuits does it hurt most?", model: "The body of a partially depleted SOI transistor is not tied to a supply, so its voltage depends on leakage and impact ionization charging it while idle, and on charge spilled off when the transistor switches. The body voltage shifts the threshold voltage, so a gate's delay depends on its recent activity. It hurts circuits that rely on matching, such as sense amplifiers and analog circuits, which then need body contacts." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "vlsi9", eyebrow: "CMOS VLSI · Chapter 9", title: "Combinational Circuit Design",
    intro: `<p>Eleven parts. Four on getting the most from static CMOS (bubble pushing, compound gates, input ordering, skewed gates), then the alternative families (pseudo-nMOS, dynamic and domino, pass transistors), the ways they fail, and finally SOI and subthreshold design.</p><p>Keep one equation in mind throughout: delay ∝ (C/I)·ΔV. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises. Many ask you to sketch or size a gate in a particular family: before sizing, write down which transistors fight, which nodes float, and which corner is the worst case. Some exercises need a simulator (Chapter 8).</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11],
    summary: `
      <h3>Static CMOS</h3>
      <p>Bubble pushing; compound gates (AOI21 g = 6/3, 6/3, 5/3; AOI22 6/3) aren't always faster than NAND–NAND. Latest input on the inner transistor (2τ vs 2.33τ). Asymmetric gates favor a critical input. HI-skew inverter g<sub>u</sub> = 5/6, g<sub>d</sub> = 5/3. Best average P/N = √(equal-delay ratio); libraries use 1.5–2.</p>
      <h3>Pseudo-nMOS</h3>
      <p>Always-on pMOS ≈ 1/4 strength; g<sub>avg</sub> 8/9 for any wide NOR; static power; V<sub>OL</sub> > 0; check SF.</p>
      <h3>Dynamic and domino</h3>
      <p>Precharge/evaluate; footed vs unfooted; inputs must rise monotonically. Domino = dynamic + HI-skew static; noninverting; dual-rail for any function. Keepers vs leakage; V<sub>Y</sub> = C<sub>Y</sub>/(C<sub>x</sub>+C<sub>Y</sub>)·V<sub>DD</sub>; secondary precharge. Target stage effort 2–3.</p>
      <h3>Pass transistors</h3>
      <p>TG ≈ R; threshold drops; CPL, LEAP (V<sub>DD</sub> ≥ 2V<sub>t</sub>). Characterize with the real driver.</p>
      <h3>Pitfalls, SOI, subthreshold</h3>
      <p>t = CΔV/I<sub>leak</sub>; noise budgets (37% / 19%). SOI: low C, floating body, history effect, pass-gate leakage, self-heating. Subthreshold: 300–500 mV, minimum widths, simple gates.</p>`,
  };
  Course.start(window.CHAPTER);
})();
