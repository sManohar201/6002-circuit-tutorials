(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  /* A short "you've already learned this" card that links back into the 6.002 book. */
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const ch = (n, file, part, where, html) => `<p class="aside">${html} <a href="${file}#${part}">Boylestad Chapter ${n}, ${where} →</a></p>`;
  const off = (s) => `<g opacity="0.3">${s}</g>`;
  const par = (a, b) => (a * b) / (a + b);

  /* BJT symbol. Base lead from (x−30,y); collector ends at (x+22,y−50); emitter at (x+22,y+50). */
  function bjt(x, y, o = {}) {
    const c = o.cls ? " " + o.cls : "", L = Math.hypot(22, 19), ux = 22 / L, uy = 19 / L;
    let s = `<line class="w${c}" x1="${x - 30}" y1="${y}" x2="${x}" y2="${y}"/><line class="w${c}" x1="${x}" y1="${y - 20}" x2="${x}" y2="${y + 20}" style="stroke-width:3.5"/>`;
    s += `<polyline class="w${c}" points="${x},${y - 9} ${x + 22},${y - 28} ${x + 22},${y - 50}"/><polyline class="w${c}" points="${x},${y + 9} ${x + 22},${y + 28} ${x + 22},${y + 50}"/>`;
    const d = o.pnp ? -1 : 1, t = o.pnp ? 0.3 : 0.85, tx = x + 22 * t, ty = y + 9 + 19 * t, bx = tx - d * 9 * ux, by = ty - d * 9 * uy;
    s += `<polygon class="nd" points="${tx},${ty} ${bx - 5 * uy},${by + 5 * ux} ${bx + 5 * uy},${by - 5 * ux}"/>`;
    return s;
  }
  /* The four classic bias circuits. Transistor at (220,170): base lead from x=190, collector (242,120), emitter (242,220). */
  function biasFig(kind, L = {}, o = {}) {
    const top = 40;
    let s = bjt(220, 170, { pnp: o.pnp });
    if (kind === "feedback") {
      s += S.supply(242, top, L.VCC || "V_CC") + S.res(242, top, 242, 100, L.RC || "R_C", { side: "right" }) + S.wire([242, 100], [242, 120]) + S.dot(242, 100) + S.res(242, 100, 150, 100, L.RF || "R_F") + S.wire([150, 100], [150, 170], [190, 170]);
    } else {
      s += S.wire([150, top], [242, top]) + S.supply(196, top, L.VCC || "V_CC") + S.res(242, top, 242, 120, L.RC || "R_C", { side: "right" }) + S.res(150, top, 150, 170, kind === "divider" ? L.R1 || "R_1" : L.RB || "R_B", { side: "left" }) + S.wire([150, 170], [190, 170]) + S.dot(150, 170);
      if (kind === "divider") s += S.res(150, 170, 150, 290, L.R2 || "R_2", { side: "left" }) + S.gnd(150, 290);
    }
    s += kind === "fixed" || (kind === "feedback" && L.noRE) ? S.wire([242, 220], [242, 240]) + S.gnd(242, 240) : S.res(242, 220, 242, 290, L.RE || "R_E", { side: "right" }) + S.gnd(242, 290);
    if (o.nodes) s += S.t(256, 132, "V_C", { a: "start", cls: "a s" }) + S.t(256, 214, "V_E", { a: "start", cls: "a s" }) + S.t(178, 160, "V_B", { a: "end", cls: "a s" });
    if (o.extra) s += o.extra;
    return S.svg(o.w || 360, 320, s, { max: o.w || 360, label: `${kind} bias circuit` });
  }

  /* DC solution of a bias circuit. p holds VCC and resistors in ohms. */
  function solve(kind, p, beta) {
    const VBE = 0.7, RE = p.RE || 0;
    let IB;
    if (kind === "fixed") IB = (p.VCC - VBE) / p.RB;
    else if (kind === "emitter") IB = (p.VCC - VBE) / (p.RB + (beta + 1) * RE);
    else if (kind === "divider") { const RTh = par(p.R1, p.R2), ETh = (p.R2 * p.VCC) / (p.R1 + p.R2); IB = (ETh - VBE) / (RTh + (beta + 1) * RE); }
    else IB = (p.VCC - VBE) / (p.RF + beta * (p.RC + RE));
    IB = Math.max(0, IB);
    const ICsat = p.VCC / (p.RC + RE);
    let IC = beta * IB, sat = false;
    if (IC > ICsat) { IC = ICsat; sat = true; }
    const VCE = sat ? 0 : p.VCC - IC * (p.RC + RE), VE = IC * RE, VC = p.VCC - IC * p.RC;
    return { IB, IC, IE: IC + IB, VCE, VE, VC, VB: VE + VBE, ICsat, sat };
  }
  /* Approximate voltage-divider solution: ignore I_B. */
  function approxVD(p) {
    const VB = (p.R2 * p.VCC) / (p.R1 + p.R2), VE = VB - 0.7, IE = Math.max(0, VE / p.RE);
    return { VB, VE, IC: IE, VCE: p.VCC - IE * (p.RC + p.RE) };
  }

  /* Common-emitter curves (β ≈ 100) for load-line work. I_C in mA, I_B in µA. */
  const iCE = (IB, V) => (V <= 0 ? 0 : (0.1 * IB * (1 + V / 150) + 0.02) * (1 - Math.exp(-V / 0.15)));
  function qOnLine(IB, VCC, RC) {
    let a = 0, b = VCC;
    for (let k = 0; k < 60; k++) { const m = (a + b) / 2; if (iCE(IB, m) < ((VCC - m) / RC) * 1000) a = m; else b = m; }
    return [a, iCE(IB, a)];
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "The operating point", mins: 20,
    blurb: "Why a transistor needs DC first, and where on its curves to park it.",
    takeaway: "Any AC gain is energy taken from the DC supplies. Superposition lets you solve DC and AC separately. Biasing sets a fixed DC operating point, the Q-point. For a small-signal amplifier, park it mid-way in the active region, away from cutoff, saturation and the maximum ratings, where the curves are evenly spaced. Active: B–E forward, B–C reverse. Cutoff: both reverse. Saturation: both forward. The three workhorse relations: V_BE = 0.7 V, I_C = βI_B, I_E = (β + 1)I_B ≈ I_C. Usually find I_B first.",
    steps: [
      { k: "learn", title: "No free lunch", b: [
        `<div class="key">A transistor doesn't create energy. Any increase in AC voltage, current or power is energy moved over from the <b>DC supplies</b>.</div>`,
        `<p>So every amplifier has a DC part and an AC part. Superposition lets you solve them separately: this chapter is the DC part. (Chapter 5 is the AC part.)</p>`,
        `<p class="aside">They're not independent in design, though: the DC values you choose affect the AC behaviour, and vice versa.</p>`,
      ]},
      { k: "play", title: "Where to park it", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), note = el(`<div class="key"></div>`);
          const P = { A: [0.05, 0.05], B: [8, 4], C: [1.5, 0.8], D: [18, 4.3] };
          const NOTE = {
            A: "<b>A: no bias at all.</b> Zero current, zero voltage. Half of any input signal would just be cut off.",
            B: "<b>B: mid-way.</b> Room to swing both ways, and the curves are evenly spaced, so the gain is the same over the whole swing. Best for a small-signal amplifier.",
            C: "<b>C: near the corner.</b> Some swing both ways, but cutoff and saturation are close, and the curve spacing changes fast here: distortion.",
            D: "<b>D: near the limits.</b> Close to the maximum voltage and power. The output can't swing far upward without breaking a rating.",
          };
          function draw(k) {
            const key = "ABCD"[k];
            const series = [10, 20, 30, 40, 50, 60, 70, 80, 90].map((ib) => ({ f: (v) => iCE(ib, v), from: 0.001, cls: "s5" }));
            series.push({ f: (v) => 80 / v, from: 8, to: 22, cls: "s4" }, { pts: [[0, 10], [22, 10]], cls: "s4" }, { pts: [[20, 0], [20, 11]], cls: "s4" });
            f.innerHTML = plot({ x: [0, 22], y: [0, 11], xt: [0, 5, 10, 15, 20], yt: [0, 2, 4, 6, 8, 10], xl: "V_CE (V)", yl: "I_C (mA)", series, marks: Object.entries(P).map(([n, [x, y]]) => ({ x, y, label: n, cls: n === key ? "mk" : "mk2" })), label: "Collector curves with four possible operating points A to D and the maximum ratings" });
            note.innerHTML = NOTE[key];
          }
          host.append(f, toggle(["A", "B", "C", "D"], draw, 1), note);
          draw(1);
        },
        `<p class="aside">Red dashed: the limits (I<sub>C max</sub>, V<sub>CE max</sub> and the power curve). Power amplifiers (Chapter 12) choose differently; here we're biasing for small signals.</p>`,
      ]},
      { k: "check", title: "Which region?", b: [
        { t: "sort", q: "Match the junction biasing to the region.", bins: ["Active (linear)", "Cutoff", "Saturation"], items: [
          ["B–E forward, B–C reverse", 0, "The amplifying region."],
          ["B–E reverse, B–C reverse", 1, "Off."],
          ["B–E forward, B–C forward", 2, "Fully on: the collector junction has given up."],
        ]},
      ]},
      { k: "learn", title: "Three relations do almost everything", b: [
        `<div class="eq">V<sub>BE</sub> ≅ 0.7 V     I<sub>C</sub> = βI<sub>B</sub>     I<sub>E</sub> = (β + 1)I<sub>B</sub> ≅ I<sub>C</sub></div>`,
        `<p>In almost every circuit in this chapter: <b>find I<sub>B</sub> first</b> from the base–emitter loop. Then these three give you everything else.</p>`,
        `<p class="aside">One more design concern: temperature changes β and the leakage current, which can drag the Q-point away. Good bias circuits resist that. Part 14 measures it.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why put the Q-point in the middle of the active region for a small-signal amplifier?", model: "The signal makes the operating point swing up and down around the Q-point. In the middle there's room to swing both ways without hitting cutoff or saturation, it's away from the maximum ratings, and the curves are evenly spaced there, so equal input swings give equal output swings: low distortion." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const FB = { VCC: 15, RB: 330e3, RC: 3.3e3 };
  const p2 = {
    id: "p2", title: "Fixed bias", mins: 25,
    blurb: "The simplest bias circuit: one resistor sets the base current.",
    takeaway: "For DC, capacitors are open circuits. Base–emitter loop: I_B = (V_CC − V_BE)/R_B. Then I_C = βI_B (R_C doesn't affect it, as long as the transistor stays active) and V_CE = V_CC − I_C·R_C. Single subscripts are voltages to ground (V_B, V_C, V_E); double subscripts are differences: V_CE = V_C − V_E, V_BC = V_B − V_C (negative for an active npn).",
    steps: [
      { k: "learn", title: "The DC picture", b: [
        `<p>Amplifier circuits have coupling capacitors on the input and output. For DC (f = 0), X<sub>C</sub> = 1/(2πfC) is infinite: <b>capacitors are open circuits</b>. Remove them and what's left is the DC circuit.</p>`,
        fig(biasFig("fixed", {}, { nodes: 1 })),
        `<p>Both R<sub>B</sub> and R<sub>C</sub> hang off the same V<sub>CC</sub>. For analysis you can imagine two separate copies of V<sub>CC</sub>: one for the base loop, one for the collector loop. The only link between them is I<sub>B</sub>.</p>`,
      ]},
      { k: "learn", title: "Two loops", b: [
        `<div class="two"><div class="tile"><h3>Base–emitter loop</h3><p>V<sub>CC</sub> − I<sub>B</sub>R<sub>B</sub> − V<sub>BE</sub> = 0</p><div class="eq">I<sub>B</sub> = (V<sub>CC</sub> − V<sub>BE</sub>)/R<sub>B</sub></div></div><div class="tile"><h3>Collector–emitter loop</h3><p>I<sub>C</sub> = βI<sub>B</sub>, then</p><div class="eq">V<sub>CE</sub> = V<sub>CC</sub> − I<sub>C</sub>R<sub>C</sub></div></div></div>`,
        `<p class="aside">Easy to remember: I<sub>B</sub> is just Ohm's law for R<sub>B</sub>. One end is at V<sub>CC</sub>, the other at 0.7 V.</p>`,
        { t: "mcq", q: "You double R_C (and the transistor stays active). What happens to I_C?", opts: [
          ["Nothing: I_C = βI_B, and R_B alone sets I_B", true, "R_C only changes V_CE. Watch it happen in the next step."],
          ["It halves", false, "That would be true for a plain resistor circuit. Here the transistor sets I_C from I_B."],
          ["It doubles", false, "R_C isn't in the base loop at all."],
        ]},
      ]},
      { k: "play", title: "The fixed-bias lab", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          const p = { VCC: 12, RB: 470e3, RC: 2.2e3 };
          let beta = 100;
          function draw() {
            const r = solve("fixed", p, beta);
            f.innerHTML = biasFig("fixed", { RB: "R_B " + si(p.RB, "Ω", 2), RC: "R_C " + si(p.RC, "Ω", 2), VCC: p.VCC + " V" }, { nodes: 1 });
            ro.innerHTML = readout([["I<sub>B</sub>", si(r.IB, "A")], ["I<sub>C</sub>", si(r.IC, "A")], ["V<sub>CE</sub> = V<sub>C</sub>", fmt(r.VCE, 3) + " V"], ["V<sub>B</sub>", "0.7 V"], ["V<sub>BC</sub> = V<sub>B</sub> − V<sub>C</sub>", fmt(0.7 - r.VC, 3) + " V"]]);
            vd.className = "verdict " + (r.sat ? "no" : r.VCE < 0.25 * p.VCC || r.VCE > 0.75 * p.VCC ? "mid" : "ok");
            vd.textContent = r.sat ? "Saturated: βI_B asks for more current than R_C can pass. I_C is stuck at V_CC/R_C." : `Active. V_CE is ${fmt((r.VCE / p.VCC) * 100, 2)}% of V_CC.`;
          }
          host.append(f, slider({ id: id + "-rb", label: "R<sub>B</sub>", min: 100e3, max: 2e6, log: true, value: p.RB, show: (v) => si(v, "Ω") }, (v) => { p.RB = v; draw(); }).el,
            slider({ id: id + "-rc", label: "R<sub>C</sub>", min: 500, max: 10e3, log: true, value: p.RC, show: (v) => si(v, "Ω") }, (v) => { p.RC = v; draw(); }).el,
            slider({ id: id + "-b", label: "β", min: 50, max: 250, step: 5, value: 100 }, (v) => { beta = v; draw(); }).el,
            slider({ id: id + "-v", label: "V<sub>CC</sub>", min: 5, max: 20, step: 0.5, value: 12, show: (v) => v + " V" }, (v) => { p.VCC = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">Change R<sub>C</sub> and only V<sub>CE</sub> moves. Change β and I<sub>C</sub> follows it exactly: the weakness of fixed bias.</p>`,
      ]},
      { k: "learn", title: "Single and double subscripts", b: [
        `<div class="two"><div class="tile"><h3>Single: V<sub>C</sub></h3><p>Collector to <b>ground</b>. Red lead on C, black on ground.</p></div><div class="tile"><h3>Double: V<sub>CE</sub></h3><p>Collector to <b>emitter</b>. Red on C, black on E.</p></div></div>`,
        `<div class="eq">V<sub>CE</sub> = V<sub>C</sub> − V<sub>E</sub>     V<sub>BE</sub> = V<sub>B</sub> − V<sub>E</sub></div>`,
        `<p>Here V<sub>E</sub> = 0, so V<sub>CE</sub> = V<sub>C</sub> and V<sub>BE</sub> = V<sub>B</sub>. In later circuits they differ, and knowing which one you measured matters for troubleshooting.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Fixed bias: V<sub>CC</sub> = 15 V, R<sub>B</sub> = 330 kΩ, R<sub>C</sub> = 3.3 kΩ, β = 80.</p>`,
        { t: "num", q: "I_B, in µA?", a: 43.33, unit: "µA", tol: 0.01, hint: "(15 − 0.7)/330 kΩ.", why: "14.3 V/330 kΩ ≈ 43.3 µA." },
        { t: "num", q: "I_C, in mA?", a: 3.467, unit: "mA", tol: 0.01, why: "80 × 43.33 µA ≈ 3.47 mA." },
        { t: "num", q: "V_CE?", a: 3.56, unit: "V", tol: 0.02, hint: "15 − I_C × 3.3 kΩ.", why: "15 − 11.44 ≈ 3.56 V." },
        { t: "num", q: "V_BC?", a: -2.86, unit: "V", tol: 0.02, hint: "V_B − V_C, with V_B = 0.7 V and V_C = V_CE here.", why: "0.7 − 3.56 = −2.86 V. Negative: the base–collector junction is reverse-biased, as it should be." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In fixed bias, why doesn't R_C affect the collector current?", model: "The base current is set only by the base loop: V_CC, R_B and the 0.7 V junction. In the active region the collector current is β times that base current, regardless of R_C. R_C only decides how much voltage it drops, and so what V_CE is left. That holds until R_C is so big that the transistor saturates." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Saturation and the load line", mins: 25,
    blurb: "The most current a circuit can push, and a graph that shows where the Q-point sits.",
    takeaway: "To find the saturation current, short collector to emitter (V_CE = 0) and solve: for fixed bias I_Csat = V_CC/R_C. Stay well below it for linear amplification. The load line V_CE = V_CC − I_C·R_C runs from (V_CC, 0) to (0, V_CC/R_C). The Q-point is where it meets the I_B curve. Changing R_B moves the Q-point along the line; changing R_C changes the line's steepness; changing V_CC slides it parallel.",
    steps: [
      { k: "learn", title: "Saturation", b: [
        `<p><b>Saturated</b> means maxed out: the current can't go higher for this design. On the curves it's where they bunch up near V<sub>CE sat</sub>. The collector junction is no longer reverse-biased, so the output distorts.</p>`,
        `<p>Quick estimate: pretend the transistor is a <b>short</b> from collector to emitter (V<sub>CE</sub> = 0). Whatever current flows is I<sub>C sat</sub>.</p>`,
        `<div class="eq">Fixed bias:   I<sub>C sat</sub> = V<sub>CC</sub>/R<sub>C</sub></div>`,
        { t: "num", q: "V_CC = 15 V, R_C = 3.3 kΩ. I_Csat in mA?", a: 4.545, unit: "mA", tol: 0.01, why: "15/3.3 kΩ ≈ 4.55 mA. The 3.47 mA you found in Part 2 is about 3/4 of the way there." },
      ]},
      { k: "learn", title: "The transistor's load line", b: [
        seen("The load line on transistor curves, and staying out of the wrong region.", "07-mosfet-amplifier.html#p6", "Chapter 7, Part 6"),
        `<div class="eq">V<sub>CE</sub> = V<sub>CC</sub> − I<sub>C</sub>R<sub>C</sub></div>`,
        `<p>Two points: I<sub>C</sub> = 0 gives V<sub>CE</sub> = V<sub>CC</sub>. V<sub>CE</sub> = 0 gives I<sub>C</sub> = V<sub>CC</sub>/R<sub>C</sub> (I<sub>C sat</sub> again). Join them. The Q-point is where the line meets the transistor's I<sub>B</sub> curve.</p>`,
        `<p class="aside">It's called a load line because the load resistor R<sub>C</sub> sets its slope. Smaller R<sub>C</sub>, steeper line.</p>`,
      ]},
      { k: "play", title: "Move the Q-point", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let IB = 30, VCC = 14, RC = 2;
          function draw() {
            const [V, I] = qOnLine(IB, VCC, RC * 1000);
            const series = [10, 20, 30, 40, 50, 60, 70, 80].map((k) => ({ f: (v) => iCE(k, v), from: 0.001, cls: k === IB ? "s2" : "s5" }));
            series.push({ pts: [[0, VCC / RC], [VCC, 0]], cls: "s1" });
            f.innerHTML = plot({ x: [0, 21], y: [0, 10.5], xt: [0, 5, 10, 15, 20], yt: [0, 2, 4, 6, 8, 10], xl: "V_CE (V)", yl: "I_C (mA)", series, marks: [{ x: V, y: I, label: "Q" }], label: "Load line on the collector curves, with the Q-point where it meets the chosen base current" });
            ro.innerHTML = readout([["I<sub>CQ</sub>", fmt(I, 3) + " mA"], ["V<sub>CEQ</sub>", fmt(V, 3) + " V"], ["Line ends", `${VCC} V and ${fmt(VCC / RC, 3)} mA`]]);
          }
          host.append(f, slider({ id: id + "-ib", label: "I<sub>B</sub> (set by R<sub>B</sub>)", min: 10, max: 80, step: 10, value: 30, show: (v) => v + " µA" }, (v) => { IB = v; draw(); }).el,
            slider({ id: id + "-rc", label: "R<sub>C</sub>", min: 1, max: 6, step: 0.1, value: 2, show: (v) => fmt(v, 2) + " kΩ" }, (v) => { RC = v; draw(); }).el,
            slider({ id: id + "-v", label: "V<sub>CC</sub>", min: 6, max: 20, step: 0.5, value: 14, show: (v) => v + " V" }, (v) => { VCC = v; draw(); }).el, ro);
          draw();
        },
        `<div class="two"><div class="tile"><h3>Change R<sub>B</sub></h3><p>New I<sub>B</sub>: the Q-point slides along the same line.</p></div><div class="tile"><h3>Change R<sub>C</sub></h3><p>The line pivots around V<sub>CC</sub> on the axis.</p></div><div class="tile"><h3>Change V<sub>CC</sub></h3><p>The line slides, keeping its slope.</p></div></div>`,
      ]},
      { k: "check", title: "Work backwards", b: [
        `<p>A fixed-bias load line hits the V<sub>CE</sub> axis at 24 V and the I<sub>C</sub> axis at 8 mA. The Q-point sits on the I<sub>B</sub> = 30 µA curve.</p>`,
        { t: "num", q: "R_C, in kΩ?", a: 3, unit: "kΩ", hint: "The I_C intercept is V_CC/R_C.", why: "V_CC = 24 V (the V_CE intercept), so R_C = 24 V/8 mA = 3 kΩ." },
        { t: "num", q: "R_B, in kΩ?", a: 776.7, unit: "kΩ", tol: 0.01, hint: "I_B = (V_CC − 0.7)/R_B.", why: "(24 − 0.7)/30 µA ≈ 777 kΩ." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you find a circuit's saturation current quickly?", model: "Imagine a short circuit between the transistor's collector and emitter, so V_CE = 0, and work out the current that would flow through the collector circuit. For fixed bias that's V_CC/R_C. It's the top end of the load line, and the Q-point should stay well below it for linear amplification." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Emitter bias", mins: 25,
    blurb: "Add a resistor in the emitter and the circuit pushes back against changes.",
    takeaway: "With R_E: I_B = (V_CC − V_BE)/[R_B + (β + 1)R_E]. Seen from the base, R_E looks (β + 1) times bigger: R_i = (β + 1)R_E. V_CE = V_CC − I_C(R_C + R_E), V_E = I_E·R_E, V_C = V_CC − I_C·R_C, V_B = V_E + 0.7 V. I_Csat = V_CC/(R_C + R_E). It's more stable than fixed bias: when β rises, I_B falls, partly cancelling the change.",
    steps: [
      { k: "learn", title: "The base loop now has R_E in it", b: [
        fig(biasFig("emitter", {}, { nodes: 1 })),
        `<p>KVL round the base loop: V<sub>CC</sub> − I<sub>B</sub>R<sub>B</sub> − V<sub>BE</sub> − I<sub>E</sub>R<sub>E</sub> = 0. Put in I<sub>E</sub> = (β + 1)I<sub>B</sub> and solve:</p>`,
        `<div class="eq">I<sub>B</sub> = (V<sub>CC</sub> − V<sub>BE</sub>) / [R<sub>B</sub> + (β + 1)R<sub>E</sub>]</div>`,
        `<p>Same as fixed bias, plus one term in the bottom.</p>`,
      ]},
      { k: "learn", title: "R_E looks bigger from the base", b: [
        `<p>The emitter current is (β + 1) times the base current. So R<sub>E</sub> drops (β + 1) times more voltage than it would if only I<sub>B</sub> flowed through it. From the base, it <b>looks like</b> a resistor (β + 1) times bigger:</p>`,
        `<div class="eq">R<sub>i</sub> = (β + 1)R<sub>E</sub></div>`,
        `<p class="aside">That's an easy way to rebuild the I<sub>B</sub> formula: net voltage V<sub>CC</sub> − V<sub>BE</sub>, divided by R<sub>B</sub> plus the reflected R<sub>E</sub>. You'll meet this reflection again in Chapter 5.</p>`,
        { t: "num", q: "β = 120, R_E = 1 kΩ. What resistance does the base see in the emitter?", a: 121, unit: "kΩ", tol: 0.001, why: "(120 + 1) × 1 kΩ = 121 kΩ." },
      ]},
      { k: "learn", title: "The collector loop", b: [
        `<div class="eq">V<sub>CE</sub> = V<sub>CC</sub> − I<sub>C</sub>(R<sub>C</sub> + R<sub>E</sub>)   (using I<sub>E</sub> ≈ I<sub>C</sub>)</div>`,
        `<div class="eq">V<sub>E</sub> = I<sub>E</sub>R<sub>E</sub>    V<sub>C</sub> = V<sub>CC</sub> − I<sub>C</sub>R<sub>C</sub>    V<sub>B</sub> = V<sub>E</sub> + V<sub>BE</sub>    I<sub>C sat</sub> = V<sub>CC</sub>/(R<sub>C</sub> + R<sub>E</sub>)</div>`,
        `<p class="aside">The load line runs from V<sub>CC</sub> on the V<sub>CE</sub> axis to V<sub>CC</sub>/(R<sub>C</sub> + R<sub>E</sub>) on the I<sub>C</sub> axis.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Emitter bias: V<sub>CC</sub> = 18 V, R<sub>B</sub> = 560 kΩ, R<sub>C</sub> = 2.7 kΩ, R<sub>E</sub> = 1.2 kΩ, β = 100.</p>`,
        { t: "num", q: "I_B, in µA?", a: 25.4, unit: "µA", tol: 0.01, hint: "17.3 V divided by 560 kΩ + 101 × 1.2 kΩ.", why: "17.3/681.2 kΩ ≈ 25.4 µA." },
        { t: "num", q: "V_CE?", a: 8.09, unit: "V", tol: 0.02, hint: "I_C = 100 × 25.4 µA. Then 18 − I_C × 3.9 kΩ.", why: "I_C ≈ 2.54 mA, so V_CE ≈ 18 − 9.91 ≈ 8.09 V." },
        { t: "num", q: "V_C?", a: 11.14, unit: "V", tol: 0.02, hint: "18 − I_C × 2.7 kΩ.", why: "18 − 6.86 ≈ 11.14 V. V_E is about 3.05 V, and V_C − V_E gives back V_CE." },
      ]},
      { k: "play", title: "Fixed versus emitter bias", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          const A = { VCC: 18, RB: 680e3, RC: 2.7e3 }, B = { VCC: 18, RB: 560e3, RC: 2.7e3, RE: 1.2e3 };
          let beta = 100;
          const a0 = solve("fixed", A, 100), b0 = solve("emitter", B, 100);
          const pct = (x, x0) => (x0 ? (x >= x0 ? "+" : "") + fmt(((x - x0) / x0) * 100, 2) + "%" : "—");
          function draw() {
            const a = solve("fixed", A, beta), b = solve("emitter", B, beta);
            ro.innerHTML = readout([["Fixed bias I<sub>C</sub>", `${si(a.IC, "A")} (${pct(a.IC, a0.IC)})`], ["Fixed bias V<sub>CE</sub>", `${fmt(a.VCE, 3)} V (${pct(a.VCE, a0.VCE)})`], ["Emitter bias I<sub>C</sub>", `${si(b.IC, "A")} (${pct(b.IC, b0.IC)})`], ["Emitter bias V<sub>CE</sub>", `${fmt(b.VCE, 3)} V (${pct(b.VCE, b0.VCE)})`]]);
          }
          host.append(slider({ id: id + "-b", label: "β (both designs start at β = 100)", min: 50, max: 200, step: 5, value: 100 }, (v) => { beta = v; draw(); }).el, ro);
          draw();
        },
        `<p>Fixed: R<sub>B</sub> = 680 kΩ, R<sub>C</sub> = 2.7 kΩ. Emitter: R<sub>B</sub> = 560 kΩ, R<sub>C</sub> = 2.7 kΩ, R<sub>E</sub> = 1.2 kΩ. Both have about the same I<sub>C</sub> at β = 100. Now double β.</p>`,
        `<p class="aside">Why: a bigger β raises I<sub>C</sub>, which raises V<sub>E</sub>, which leaves less voltage across R<sub>B</sub>, which lowers I<sub>B</sub>. The circuit pushes back. You'll measure this properly in Part 14.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does an emitter resistor make the bias more stable?", model: "If the collector current tries to rise, for example because β went up, the emitter current and so the voltage across R_E rise too. The base is fed from a fixed supply through R_B, so a higher emitter voltage leaves less voltage across R_B and the base current falls. That lower base current pulls the collector current back down, partly cancelling the change." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const VDP = { VCC: 16, R1: 56e3, R2: 8.2e3, RC: 4.7e3, RE: 1.2e3 };
  const p5 = {
    id: "p5", title: "Voltage-divider bias: exact", mins: 25,
    blurb: "The most common bias circuit. Thévenin turns it into one you already know.",
    takeaway: "Voltage-divider bias makes the Q-point (I_CQ, V_CEQ) almost independent of β. Exact method: replace R1, R2 and V_CC by a Thévenin source: R_Th = R1 ∥ R2, E_Th = R2·V_CC/(R1 + R2). Then I_B = (E_Th − V_BE)/[R_Th + (β + 1)R_E], exactly the emitter-bias formula. V_CE = V_CC − I_C(R_C + R_E), I_Csat = V_CC/(R_C + R_E), same load line as emitter bias.",
    steps: [
      { k: "learn", title: "Two resistors set the base", b: [
        fig(biasFig("divider", {}, { nodes: 1 })),
        `<p>The earlier circuits' I<sub>C</sub> follows β. β drifts with temperature and varies a lot between transistors. This circuit, if designed well, holds I<sub>CQ</sub> and V<sub>CEQ</sub> almost fixed whatever β does. (I<sub>BQ</sub> still changes; the Q-point doesn't.)</p>`,
        `<p>Two ways to analyse it: <b>exact</b>, which always works, and a quicker <b>approximate</b> method (next part) that works when one condition holds.</p>`,
      ]},
      { k: "learn", title: "Thévenin the base", b: [
        seen("Thévenin equivalents: any linear two-terminal network is a source in series with a resistor.", "03-network-theorems.html", "Chapter 3"),
        `<p>Cut the circuit at the base. Look left at R<sub>1</sub>, R<sub>2</sub> and V<sub>CC</sub>.</p>`,
        `<div class="two"><div class="tile"><h3>R<sub>Th</sub></h3><p>Short V<sub>CC</sub>: R<sub>1</sub> and R<sub>2</sub> are in parallel.</p><div class="eq">R<sub>Th</sub> = R<sub>1</sub> ∥ R<sub>2</sub></div></div><div class="tile"><h3>E<sub>Th</sub></h3><p>Open-circuit voltage: a divider.</p><div class="eq">E<sub>Th</sub> = R<sub>2</sub>V<sub>CC</sub>/(R<sub>1</sub> + R<sub>2</sub>)</div></div></div>`,
        `<p>Now the base is fed by E<sub>Th</sub> through R<sub>Th</sub>: the emitter-bias circuit again.</p>`,
        `<div class="eq">I<sub>B</sub> = (E<sub>Th</sub> − V<sub>BE</sub>) / [R<sub>Th</sub> + (β + 1)R<sub>E</sub>]</div>`,
      ]},
      { k: "check", title: "Your turn: exact", b: [
        fig(biasFig("divider", { R1: "56 kΩ", R2: "8.2 kΩ", RC: "4.7 kΩ", RE: "1.2 kΩ", VCC: "16 V" })),
        `<p>β = 120.</p>`,
        { t: "num", q: "R_Th, in kΩ?", a: 7.153, unit: "kΩ", tol: 0.01, hint: "56 × 8.2/(56 + 8.2).", why: "459.2/64.2 ≈ 7.15 kΩ." },
        { t: "num", q: "E_Th?", a: 2.044, unit: "V", tol: 0.01, hint: "8.2/(56 + 8.2) × 16.", why: "≈ 2.04 V." },
        { t: "num", q: "I_C, in mA?", a: 1.058, unit: "mA", tol: 0.02, hint: "I_B = (2.044 − 0.7)/(7.15 kΩ + 121 × 1.2 kΩ). Then × 120.", why: "I_B ≈ 1.344/152.4 kΩ ≈ 8.82 µA, so I_C ≈ 1.06 mA." },
        { t: "num", q: "V_CE?", a: 9.76, unit: "V", tol: 0.02, hint: "16 − I_C × (4.7 + 1.2) kΩ.", why: "16 − 1.058 × 5.9 ≈ 9.76 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does Thévenin's theorem turn voltage-divider bias into a circuit you already know?", model: "Everything to the left of the base, R1, R2 and V_CC, is a linear network, so it can be replaced by a single source E_Th = R2·V_CC/(R1 + R2) in series with R_Th = R1 ∥ R2. Then the base is fed by a source through a resistor, with R_E in the emitter: exactly emitter bias, so I_B = (E_Th − 0.7)/(R_Th + (β + 1)R_E)." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Voltage-divider bias: the shortcut", mins: 20,
    blurb: "If the base current is tiny next to the divider's, skip it.",
    takeaway: "If βR_E ≥ 10R_2, the base draws so little that R1 and R2 act as a plain divider: V_B = R2·V_CC/(R1 + R2), V_E = V_B − 0.7 V, I_E = V_E/R_E ≈ I_C, V_CE = V_CC − I_C(R_C + R_E). β never appears, which is why the Q-point barely moves when β changes. If the condition fails, the shortcut can be off by tens of percent; use the exact method.",
    steps: [
      { k: "learn", title: "When I_B is negligible", b: [
        `<p>From the base, the emitter side looks like R<sub>i</sub> = (β + 1)R<sub>E</sub> ≈ βR<sub>E</sub> to ground. That's in parallel with R<sub>2</sub>.</p>`,
        `<p>If R<sub>i</sub> is much bigger than R<sub>2</sub>, almost all the divider current goes through R<sub>2</sub>, not into the base. Then R<sub>1</sub> and R<sub>2</sub> are effectively in series:</p>`,
        `<div class="eq">Test:  βR<sub>E</sub> ≥ 10R<sub>2</sub>     then     V<sub>B</sub> = R<sub>2</sub>V<sub>CC</sub>/(R<sub>1</sub> + R<sub>2</sub>)</div>`,
        `<div class="eq">V<sub>E</sub> = V<sub>B</sub> − 0.7     I<sub>C</sub> ≈ I<sub>E</sub> = V<sub>E</sub>/R<sub>E</sub>     V<sub>CE</sub> = V<sub>CC</sub> − I<sub>C</sub>(R<sub>C</sub> + R<sub>E</sub>)</div>`,
        `<p class="aside">No β anywhere. I<sub>B</sub> isn't even calculated.</p>`,
      ]},
      { k: "check", title: "Your turn: shortcut", b: [
        `<p>Same circuit as before: 56 kΩ, 8.2 kΩ, R<sub>C</sub> = 4.7 kΩ, R<sub>E</sub> = 1.2 kΩ, V<sub>CC</sub> = 16 V, β = 120.</p>`,
        { t: "mcq", q: "Does it pass the test βR_E ≥ 10R_2?", opts: [
          ["Yes: 144 kΩ ≥ 82 kΩ", true, "120 × 1.2 kΩ = 144 kΩ, and 10 × 8.2 kΩ = 82 kΩ."],
          ["No", false, "Work out both sides: 120 × 1.2 kΩ and 10 × 8.2 kΩ."],
        ]},
        { t: "num", q: "I_C with the shortcut, in mA?", a: 1.12, unit: "mA", tol: 0.01, hint: "V_B ≈ 2.044 V, V_E = V_B − 0.7, then divide by 1.2 kΩ.", why: "1.344/1.2 kΩ ≈ 1.12 mA, versus 1.06 mA exact: about 6% apart." },
        { t: "num", q: "V_CE with the shortcut?", a: 9.39, unit: "V", tol: 0.02, why: "16 − 1.12 × 5.9 ≈ 9.39 V, versus 9.76 V exact." },
      ]},
      { k: "play", title: "When the shortcut fails", b: [
        (host, id) => {
          const ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`), f = el(`<div class="fig"></div>`);
          let R2 = 8.2e3, beta = 120;
          const ratio = 56 / 8.2;
          function draw() {
            const p = Object.assign({}, VDP, { R2, R1: R2 * ratio }), ex = solve("divider", p, beta), ap = approxVD(p);
            const test = beta * p.RE, need = 10 * R2, err = ((ap.IC - ex.IC) / ex.IC) * 100;
            const betas = []; for (let b = 50; b <= 250; b += 5) betas.push(b);
            f.innerHTML = plot({ x: [50, 250], y: [0, 1.5], xt: [50, 100, 150, 200, 250], yt: [0, 0.5, 1, 1.5], xl: "β", yl: "I_C (mA)", series: [{ pts: betas.map((b) => [b, solve("divider", p, b).IC * 1000]), cls: "s1" }, { pts: [[50, ap.IC * 1000], [250, ap.IC * 1000]], cls: "s5" }], marks: [{ x: beta, y: ex.IC * 1000 }], label: "Exact collector current against beta, with the shortcut's answer as a dashed line" });
            ro.innerHTML = readout([["R<sub>1</sub>, R<sub>2</sub>", si(p.R1, "Ω") + ", " + si(R2, "Ω")], ["βR<sub>E</sub> vs 10R<sub>2</sub>", si(test, "Ω") + " vs " + si(need, "Ω")], ["I<sub>C</sub> exact", si(ex.IC, "A")], ["I<sub>C</sub> shortcut", si(ap.IC, "A") + ` (${err >= 0 ? "+" : ""}${fmt(err, 2)}%)`]]);
            vd.className = "verdict " + (test >= need ? "ok" : "no");
            vd.textContent = test >= need ? "Test passed: the shortcut is close." : "Test failed: the base current is no longer negligible. Use the exact method.";
          }
          host.append(f, slider({ id: id + "-r2", label: "Divider size R<sub>2</sub> (R<sub>1</sub> scales with it, same V<sub>B</sub>)", min: 1e3, max: 100e3, log: true, value: 8.2e3, show: (v) => si(v, "Ω") }, (v) => { R2 = v; draw(); }).el,
            slider({ id: id + "-b", label: "β", min: 50, max: 250, step: 5, value: 120 }, (v) => { beta = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">Orange: the exact I<sub>C</sub> as β changes. Grey dashed: the shortcut's answer, which ignores β. With small divider resistors the orange line is nearly flat: that's the β-independence. Make R<sub>2</sub> big and it tilts.</p>`,
        `<p>Saturation current and the load line are the same as for emitter bias: I<sub>C sat</sub> = V<sub>CC</sub>/(R<sub>C</sub> + R<sub>E</sub>).</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does the test βR_E ≥ 10R_2 check, and why does passing it make β irrelevant?", model: "It checks that the resistance looking into the base, about βR_E, is at least ten times R2. Then almost all the divider current flows through R2 and very little into the base, so the base voltage is just the divider voltage. The emitter voltage is that minus 0.7 V, and the emitter current is V_E/R_E. None of those steps involve β, so the Q-point stays put when β changes." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const CMP = {
    fixed: { VCC: 12, RB: 560e3, RC: 2.2e3 },
    emitter: { VCC: 12, RB: 470e3, RC: 2.2e3, RE: 680 },
    divider: { VCC: 12, R1: 22e3, R2: 4.7e3, RC: 2.2e3, RE: 680 },
    feedback: { VCC: 12, RF: 270e3, RC: 2.2e3, RE: 680 },
  };
  const p7 = {
    id: "p7", title: "Collector feedback", mins: 25,
    blurb: "Feed the base from the collector, and the circuit corrects itself.",
    takeaway: "Collector-feedback bias: R_F from collector to base. I_B = (V_CC − V_BE)/[R_F + β(R_C + R_E)] (taking I_C′ ≈ I_C). General pattern: I_B = V′/(R_F + βR′), so I_CQ = V′/(R_F/β + R′) → V′/R′ when R′ ≫ R_F/β: nearly independent of β. V_CE = V_CC − I_C(R_C + R_E), I_Csat = V_CC/(R_C + R_E). For DC, a capacitor in the middle of a split R_F is open, so R_B = R_F1 + R_F2. Ranking for β-stability: voltage divider and collector feedback best, then emitter bias, then fixed bias.",
    steps: [
      { k: "learn", title: "R_F from collector to base", b: [
        fig(biasFig("feedback", {}, { nodes: 1 })),
        `<p>The base is fed from the <b>collector</b>, not from V<sub>CC</sub>. The current in R<sub>C</sub> is I<sub>C</sub>′ = I<sub>C</sub> + I<sub>B</sub>, but I<sub>B</sub> is tiny, so take I<sub>C</sub>′ ≈ I<sub>C</sub> ≈ I<sub>E</sub>.</p>`,
        `<p>KVL from V<sub>CC</sub> down through R<sub>C</sub>, R<sub>F</sub>, the junction and R<sub>E</sub>:</p>`,
        `<div class="eq">I<sub>B</sub> = (V<sub>CC</sub> − V<sub>BE</sub>) / [R<sub>F</sub> + β(R<sub>C</sub> + R<sub>E</sub>)]</div>`,
        `<p>Now R<sub>C</sub> as well as R<sub>E</sub> is reflected into the base loop.</p>`,
      ]},
      { k: "math", title: "Why it barely needs β", b: [
        `<p>All these bias circuits share one pattern: I<sub>B</sub> = V′/(R<sub>F</sub> + βR′). Multiply by β:</p>`,
        `<div class="eq">I<sub>CQ</sub> = βV′/(R<sub>F</sub> + βR′) = V′/(R<sub>F</sub>/β + R′)</div>`,
        `<p>If R′ is much bigger than R<sub>F</sub>/β, the R<sub>F</sub>/β term hardly matters and I<sub>CQ</sub> ≈ V′/R′: <b>no β</b>.</p>`,
        `<div class="two"><div class="tile"><h3>Fixed bias</h3><p>R′ = 0. Fully at β's mercy.</p></div><div class="tile"><h3>Emitter bias</h3><p>R′ = R<sub>E</sub>.</p></div><div class="tile"><h3>Collector feedback</h3><p>R′ = R<sub>C</sub> + R<sub>E</sub>: bigger, so less sensitive.</p></div></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>V<sub>CC</sub> = 12 V, R<sub>F</sub> = 270 kΩ, R<sub>C</sub> = 2.2 kΩ, R<sub>E</sub> = 680 Ω, β = 100.</p>`,
        { t: "num", q: "I_C, in mA?", a: 2.025, unit: "mA", tol: 0.01, hint: "I_B = 11.3 V/(270 kΩ + 100 × 2.88 kΩ).", why: "I_B = 11.3/558 kΩ ≈ 20.25 µA, so I_C ≈ 2.03 mA." },
        { t: "num", q: "V_CE?", a: 6.17, unit: "V", tol: 0.02, why: "12 − 2.025 × 2.88 ≈ 6.17 V." },
        `<p class="aside">If R<sub>F</sub> is split in two with a capacitor from the middle to ground (to block AC feedback), the capacitor is open for DC: use R<sub>F1</sub> + R<sub>F2</sub>.</p>`,
      ]},
      { k: "play", title: "Which bias is most stable?", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let beta = 100;
          const K = ["fixed", "emitter", "divider", "feedback"], NM = { fixed: "fixed", emitter: "emitter", divider: "divider", feedback: "feedback" }, CL = { fixed: "s4", emitter: "s2", divider: "s3", feedback: "s1" };
          const base = {}; K.forEach((k) => (base[k] = solve(k, CMP[k], 100).IC));
          function draw() {
            const bs = []; for (let b = 50; b <= 250; b += 5) bs.push(b);
            f.innerHTML = plot({ x: [50, 250], y: [0, 6], xt: [50, 100, 150, 200, 250], yt: [0, 2, 4, 6], xl: "β", yl: "I_C (mA)", series: K.map((k) => ({ pts: bs.map((b) => [b, solve(k, CMP[k], b).IC * 1000]), cls: CL[k] })), marks: K.map((k) => ({ x: beta, y: solve(k, CMP[k], beta).IC * 1000, cls: "mk2" })), label: "Collector current against beta for four bias circuits that all give about 2 mA at beta 100" });
            ro.innerHTML = readout(K.map((k) => { const ic = solve(k, CMP[k], beta).IC; return [NM[k] + " bias", `${si(ic, "A")} (${ic >= base[k] ? "+" : ""}${fmt(((ic - base[k]) / base[k]) * 100, 2)}%)`]; }));
          }
          host.append(f, slider({ id: id + "-b", label: "β", min: 50, max: 250, step: 5, value: 100 }, (v) => { beta = v; draw(); }).el, ro);
          draw();
        },
        `<p>Four circuits, all giving about 2 mA at β = 100 from 12 V. Red dashed: fixed. Blue: emitter. Green: voltage divider. Orange: collector feedback. The flatter the line, the more stable.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In collector-feedback bias, what happens when β rises?", model: "A higher β tries to raise the collector current. More collector current means a bigger drop across R_C, so the collector voltage falls. The base is fed from the collector through R_F, so less voltage is left across R_F and the base current falls. That pulls the collector current back down, so it rises much less than β did." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Followers, common base, pnp and others", mins: 25,
    blurb: "Every other bias circuit yields to the same recipe: KVL round the base loop first.",
    takeaway: "Emitter follower (output at the emitter, collector at ground, R_E to −V_EE): I_B = (V_EE − V_BE)/[R_B + (β + 1)R_E], V_CE = V_EE − I_E·R_E. Common base: I_E = (V_EE − V_BE)/R_E, V_CE = V_EE + V_CC − I_E(R_C + R_E), V_CB = V_CC − I_C·R_C. Unusual circuits: write KVL round the loop containing the base–emitter junction, find I_B (or I_E), then the rest; with split supplies, Thévenin the base. pnp: the same equations, with V_BE = −0.7 V and currents and polarities reversed, so V_CE comes out negative.",
    steps: [
      { k: "learn", title: "The emitter follower", b: [
        `<p>Output taken from the <b>emitter</b>, collector at ground, R<sub>E</sub> down to a negative supply −V<sub>EE</sub>. (In Chapter 5 you'll see its gain is about 1 but its input resistance is high.)</p>`,
        `<div class="eq">I<sub>B</sub> = (V<sub>EE</sub> − V<sub>BE</sub>) / [R<sub>B</sub> + (β + 1)R<sub>E</sub>]     V<sub>CE</sub> = V<sub>EE</sub> − I<sub>E</sub>R<sub>E</sub></div>`,
        `<p class="aside">Same base-loop shape as emitter bias, with V<sub>EE</sub> doing V<sub>CC</sub>'s job.</p>`,
        { t: "num", q: "V_EE = 12 V, R_B = 220 kΩ, R_E = 2.2 kΩ, β = 100. What's I_E, in mA?", a: 2.58, unit: "mA", tol: 0.01, hint: "I_B = 11.3/(220 kΩ + 101 × 2.2 kΩ). Then I_E = 101 × I_B.", why: "I_B ≈ 11.3/442.2 kΩ ≈ 25.6 µA, so I_E ≈ 2.58 mA." },
        { t: "num", q: "And V_CE?", a: 6.32, unit: "V", tol: 0.02, why: "12 − 2.58 × 2.2 ≈ 6.32 V." },
      ]},
      { k: "learn", title: "Common base", b: [
        `<p>Signal into the emitter, base at (or near) ground, two supplies. The base–emitter loop contains only V<sub>EE</sub>, R<sub>E</sub> and the junction, so find <b>I<sub>E</sub></b> first:</p>`,
        `<div class="eq">I<sub>E</sub> = (V<sub>EE</sub> − V<sub>BE</sub>)/R<sub>E</sub>     V<sub>CE</sub> = V<sub>EE</sub> + V<sub>CC</sub> − I<sub>E</sub>(R<sub>C</sub> + R<sub>E</sub>)     V<sub>CB</sub> = V<sub>CC</sub> − I<sub>C</sub>R<sub>C</sub></div>`,
        { t: "num", q: "V_EE = 6 V, R_E = 2.2 kΩ, V_CC = 12 V, R_C = 3.3 kΩ. What's V_CB?", a: 4.05, unit: "V", tol: 0.02, hint: "I_E = 5.3/2.2 kΩ, and I_C ≈ I_E.", why: "I_E ≈ 2.41 mA, so V_CB ≈ 12 − 2.41 × 3.3 ≈ 4.05 V." },
      ]},
      { k: "learn", title: "Anything else", b: [
        `<div class="key">New circuit? Write KVL round the loop that contains the base–emitter junction. Solve for I<sub>B</sub> (or I<sub>E</sub>). Then I<sub>C</sub> = βI<sub>B</sub> and the collector loop give the rest.</div>`,
        `<div class="two"><div class="tile"><h3>Collector feedback, no R<sub>E</sub></h3><p>Drop R<sub>E</sub> from the formula: I<sub>B</sub> = (V<sub>CC</sub> − V<sub>BE</sub>)/(R<sub>B</sub> + βR<sub>C</sub>).</p></div><div class="tile"><h3>Supply on the emitter side</h3><p>Same loop idea; voltages may come out negative relative to ground.</p></div><div class="tile"><h3>Split supplies (+V<sub>CC</sub> and −V<sub>EE</sub>)</h3><p>Thévenin the divider between the two supplies, then treat it like voltage-divider bias.</p></div></div>`,
      ]},
      { k: "learn", title: "pnp transistors", b: [
        `<p>Same steps, same equations. Every current reverses and so does every polarity. With the usual double-subscript definitions, <b>V<sub>BE</sub> = −0.7 V</b> and V<sub>CE</sub> comes out negative.</p>`,
        fig(biasFig("divider", { R1: "39 kΩ", R2: "8.2 kΩ", RC: "2.7 kΩ", RE: "1 kΩ", VCC: "−12 V" }, { pnp: 1 })),
        `<p>β = 150. Test: 150 × 1 kΩ = 150 kΩ ≥ 82 kΩ, so use the shortcut.</p>`,
        { t: "num", q: "V_B?", a: -2.085, unit: "V", tol: 0.01, hint: "8.2/(39 + 8.2) × (−12).", why: "≈ −2.08 V." },
        { t: "num", q: "V_CE?", a: -6.88, unit: "V", tol: 0.02, hint: "V_E = V_B − V_BE = −2.085 − (−0.7). I_E = |V_E|/1 kΩ. Then V_CE = −12 + I_C(R_C + R_E).", why: "V_E ≈ −1.385 V, I_E ≈ 1.385 mA, V_CE ≈ −12 + 1.385 × 3.7 ≈ −6.88 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the general recipe for the DC analysis of a BJT circuit you've never seen before?", model: "Replace capacitors with open circuits. Find the loop that contains the base–emitter junction, put in 0.7 V for it, and use KVL with I_E = (β + 1)I_B to solve for the base current, or for the emitter current if that's simpler. Then I_C = βI_B, and KVL round the collector loop gives V_CE and the node voltages. For split supplies, Thévenin the base first; for pnp, flip the signs." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Designing a bias circuit", mins: 25,
    blurb: "Run the analysis backwards: from the Q-point you want to the resistors you need.",
    takeaway: "Design runs the analysis backwards, mostly with R = V/I. Then pick the nearest standard values and accept the small shift. Emitter-stabilized design: choose V_E ≈ V_CC/10, so R_E = V_E/I_E; R_C = (V_CC − V_CE − V_E)/I_C; I_B = I_C/β; R_B = (V_CC − V_BE − V_E)/I_B. Voltage-divider design: same V_E and R_E; V_B = V_E + 0.7; choose R_2 ≤ βR_E/10; then solve the divider for R_1.",
    steps: [
      { k: "learn", title: "Analysis in reverse", b: [
        `<p>In analysis you know the parts and find the Q-point. In <b>design</b> you're told the Q-point and must choose the parts. There's usually more than one answer, so you'll need a few judgement calls.</p>`,
        `<div class="eq">R = V<sub>R</sub>/I<sub>R</sub></div>`,
        `<p>Ohm's law does most of the work: figure out the voltage a resistor must drop and the current through it.</p>`,
        `<p class="aside">Then choose the nearest <b>standard value</b> (Appendix C lists them). Resistor and β tolerances are bigger than the error you introduce.</p>`,
      ]},
      { k: "learn", title: "A judgement call: V_E", b: [
        `<p>For emitter-stabilized circuits, the collector loop has two unknowns, R<sub>C</sub> and R<sub>E</sub>. Something has to be decided.</p>`,
        `<div class="key">Rule of thumb: set <b>V<sub>E</sub> ≈ V<sub>CC</sub>/10</b>. Enough for stability, but not so much that it eats into the output swing.</div>`,
        `<p class="aside">The book's examples range from a quarter to a tenth of V<sub>CC</sub>; a tenth is the cautious choice.</p>`,
      ]},
      { k: "check", title: "Design an emitter-bias circuit", b: [
        `<p>Target: V<sub>CC</sub> = 12 V, I<sub>CQ</sub> = 1.5 mA, V<sub>CEQ</sub> = 6 V, β = 120.</p>`,
        { t: "num", q: "R_E, in Ω?", a: 800, unit: "Ω", hint: "V_E = 12/10. R_E = V_E/I_E, with I_E ≈ I_C.", why: "1.2 V/1.5 mA = 800 Ω." },
        { t: "num", q: "R_C, in kΩ?", a: 3.2, unit: "kΩ", hint: "R_C drops whatever V_CE and V_E don't: 12 − 6 − 1.2.", why: "4.8 V/1.5 mA = 3.2 kΩ." },
        { t: "num", q: "R_B, in kΩ?", a: 808, unit: "kΩ", tol: 0.01, hint: "I_B = 1.5 mA/120. R_B drops 12 − 0.7 − 1.2.", why: "10.1 V/12.5 µA = 808 kΩ. Nearest standard value: 820 kΩ." },
      ]},
      { k: "learn", title: "Designing voltage-divider bias", b: [
        `<p>Same start: V<sub>E</sub> = V<sub>CC</sub>/10, R<sub>E</sub>, R<sub>C</sub>. Then V<sub>B</sub> = V<sub>E</sub> + 0.7 V.</p>`,
        `<p>Two unknowns, R<sub>1</sub> and R<sub>2</sub>, so make the divider "stiff": its current should be much bigger than I<sub>B</sub> (at least 10:1). That's the shortcut's test turned round:</p>`,
        `<div class="eq">R<sub>2</sub> ≤ βR<sub>E</sub>/10     then     V<sub>B</sub> = R<sub>2</sub>V<sub>CC</sub>/(R<sub>1</sub> + R<sub>2</sub>) → solve for R<sub>1</sub></div>`,
        { t: "num", q: "Same targets, now as voltage-divider bias with R_E = 800 Ω, β = 120. Largest R_2, in kΩ?", a: 9.6, unit: "kΩ", why: "120 × 800/10 = 9.6 kΩ." },
        { t: "num", q: "Using R_2 = 9.6 kΩ, what R_1 gives V_B = 1.9 V? (kΩ)", a: 51.0, unit: "kΩ", tol: 0.01, hint: "R_1 drops 12 − 1.9 while R_2 drops 1.9, carrying the same current.", why: "R_1 = 9.6 kΩ × 10.1/1.9 ≈ 51 kΩ, a standard value." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In a voltage-divider bias design, why do you choose R2 first and keep it small?", model: "There are two unknown divider resistors and only one equation, the divider ratio for V_B. A second condition is needed: the divider must carry much more current than the base, so that V_B doesn't depend on β. Keeping R2 at or below βR_E/10 guarantees that. Then the divider equation gives R1." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  function darlFig() {
    let s = S.wire([100, 40], [262, 40]) + S.supply(222, 40, "V_CC") + S.res(100, 40, 100, 140, "R_B", { side: "left" }) + S.wire([100, 140], [130, 140]) + bjt(160, 140) + S.wire([182, 90], [182, 40]) + S.wire([182, 190], [182, 220], [210, 220]) + bjt(240, 220) + S.wire([262, 170], [262, 40]) + S.res(262, 270, 262, 330, "R_E", { side: "right" }) + S.gnd(262, 330);
    s += S.t(150, 112, "Q1", { a: "end", cls: "s m" }) + S.t(230, 192, "Q2", { a: "end", cls: "s m" }) + S.t(275, 262, "V_E2", { a: "start", cls: "a s" });
    return S.svg(340, 360, s, { max: 340, label: "Darlington pair: Q1's emitter drives Q2's base" });
  }
  const p10 = {
    id: "p10", title: "Circuits with several transistors", mins: 25,
    blurb: "RC coupling, Darlington, cascode, feedback pair and direct coupling.",
    takeaway: "RC-coupled stages: capacitors block DC, so bias each stage separately. Darlington: Q1's emitter feeds Q2's base, β_D = β1β2, V_BED = V_BE1 + V_BE2 ≈ 1.4 V, I_B1 = (V_CC − V_BED)/[R_B + (β_D + 1)R_E]. Cascode: a three-resistor divider sets both bases; I_C1 ≈ I_C2. Feedback pair (npn + pnp): I_B1 = (V_CC − V_EB1)/(R_B + β1β2R_C). Direct coupling: no capacitors, so works down to DC, but each stage's DC levels set the next one's.",
    steps: [
      { k: "learn", title: "RC coupling", b: [
        `<p>The most common way to chain stages: a <b>coupling capacitor</b> from one stage's collector to the next one's base. It passes AC and blocks DC.</p>`,
        `<p>For DC analysis the capacitor is open, so each stage is on its own. Analyse each one with the methods you already have, each with its own copy of V<sub>CC</sub>.</p>`,
      ]},
      { k: "learn", title: "Darlington", b: [
        fig(darlFig()),
        `<p>Q1's emitter current is Q2's base current, so the gains multiply:</p>`,
        `<div class="eq">β<sub>D</sub> = β<sub>1</sub>β<sub>2</sub>     V<sub>BED</sub> = V<sub>BE1</sub> + V<sub>BE2</sub> ≈ 1.4 V     I<sub>B1</sub> = (V<sub>CC</sub> − V<sub>BED</sub>) / [R<sub>B</sub> + (β<sub>D</sub> + 1)R<sub>E</sub>]</div>`,
        `<p>It behaves like one transistor with a huge β. Output at the emitter: gain near 1 but very high input resistance. Output at a collector resistor: very high gain.</p>`,
        { t: "num", q: "β1 = 50, β2 = 80, V_CC = 12 V, R_B = 3.3 MΩ, R_E = 390 Ω. What's I_E2, in mA?", a: 8.72, unit: "mA", tol: 0.02, hint: "β_D = 4000. I_B1 = (12 − 1.4)/(3.3 MΩ + 4001 × 390 Ω). Then I_E2 ≈ β_D·I_B1.", why: "I_B1 ≈ 10.6/4.86 MΩ ≈ 2.18 µA, so I_E2 ≈ 4000 × 2.18 µA ≈ 8.72 mA." },
        { t: "num", q: "And V_E2?", a: 3.4, unit: "V", tol: 0.02, why: "8.72 mA × 390 Ω ≈ 3.40 V. V_C2 = V_CC, so V_CE2 = 12 − 3.4 = 8.6 V." },
      ]},
      { k: "learn", title: "Cascode and feedback pair", b: [
        `<div class="two"><div class="tile"><h3>Cascode</h3><p>Q1's collector feeds Q2's emitter: a common-emitter stage topped by a common-base stage. High gain, less "Miller" capacitance (Section 9.9). A three-resistor divider R<sub>1</sub>, R<sub>2</sub>, R<sub>3</sub> sets both bases.</p></div><div class="tile"><h3>Feedback pair</h3><p>A pnp and an npn together: high gain and good stability. I<sub>C2</sub> ≈ β<sub>1</sub>β<sub>2</sub>I<sub>B1</sub> and I<sub>B1</sub> = (V<sub>CC</sub> − V<sub>EB1</sub>)/(R<sub>B</sub> + β<sub>1</sub>β<sub>2</sub>R<sub>C</sub>).</p></div></div>`,
        `<p>For the cascode, assume the divider current dwarfs both base currents:</p>`,
        `<div class="eq">V<sub>B1</sub> = R<sub>3</sub>V<sub>CC</sub>/(R<sub>1</sub> + R<sub>2</sub> + R<sub>3</sub>)     V<sub>B2</sub> = (R<sub>2</sub> + R<sub>3</sub>)V<sub>CC</sub>/(R<sub>1</sub> + R<sub>2</sub> + R<sub>3</sub>)</div>`,
        { t: "num", q: "Cascode: R_1 = 6.8 kΩ (top), R_2 = 5.6 kΩ, R_3 = 4.7 kΩ (bottom), V_CC = 18 V. What's V_B2?", a: 10.84, unit: "V", tol: 0.01, hint: "(5.6 + 4.7)/(6.8 + 5.6 + 4.7) × 18.", why: "10.3/17.1 × 18 ≈ 10.84 V. Then V_C1 = V_E2 = V_B2 − 0.7 ≈ 10.14 V." },
      ]},
      { k: "learn", title: "Direct coupling", b: [
        `<p>No coupling capacitor: one stage's collector connects straight to the next base. Good: it amplifies very low frequencies, down to DC. Bad: any DC shift in one stage carries into the next.</p>`,
        `<p>Example: a voltage-divider stage whose collector drives an emitter follower (a buffer for a low-resistance load).</p>`,
        { t: "num", q: "Stage 1 has I_C1 = 1 mA, R_C = 5.6 kΩ, V_CC = 12 V. Its collector drives Q2's base; Q2 has R_E2 = 1.5 kΩ. What's I_E2, in mA?", a: 3.8, unit: "mA", tol: 0.01, hint: "V_B2 = V_C1 = 12 − 1 × 5.6. Then V_E2 = V_B2 − 0.7.", why: "V_B2 = 6.4 V, V_E2 = 5.7 V, I_E2 = 5.7/1.5 kΩ = 3.8 mA. (Treating Q2's base current as small next to 1 mA.)" },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do the betas multiply in a Darlington pair?", model: "Q1's emitter current is fed straight into Q2's base. Q1 multiplies its base current by about β1, and Q2 multiplies that by about β2. So the final emitter current is about β1·β2 times the original base current, as if it were one transistor with β_D = β1β2." },
      ]},
    ],
  };

  /* =============== PART 11 =============== */
  function mirrorFig(sat) {
    let s = S.wire([98, 40], [282, 40]) + S.supply(190, 40, "V_CC") + S.res(98, 40, 98, 100, "R", { side: "left" }) + S.dot(98, 100) + S.wire([98, 100], [98, 120]) + S.wire([98, 100], [190, 100], [190, 170]) + S.dot(190, 170) + S.wire([150, 170], [230, 170]);
    s += `<g transform="translate(240 0) scale(-1 1)">${bjt(120, 170)}</g>` + bjt(260, 170, { cls: sat ? "" : "" }) + S.res(282, 40, 282, 120, "R_L", { side: "right" }) + S.gnd(98, 220) + S.gnd(282, 220);
    s += S.t(84, 175, "Q1", { a: "end", cls: "s m" }) + S.t(300, 175, "Q2", { a: "start", cls: "s m" }) + S.arrow(120, 50, 120, 90, "") + S.t(128, 74, "I_control", { a: "start", cls: "c s" }) + S.arrow(310, 50, 310, 90, "") + S.t(318, 74, "I_L", { a: "start", cls: "c s" });
    return S.svg(380, 250, s, { max: 380, label: "Current mirror: Q1 wired as a diode sets the base voltage of Q2" });
  }
  const p11 = {
    id: "p11", title: "Current mirrors and current sources", mins: 25,
    blurb: "Copy a current from one branch to another, and hold a current steady whatever the load.",
    takeaway: "Current mirror: two matched transistors with their base–emitter junctions in parallel, so equal V_BE gives equal I_B and equal I_C. Q1's collector is tied to the bases. I_control = (V_CC − V_BE)/R, and I_L ≈ I_control as long as Q2 stays active. It self-corrects. More transistors on the same base line give more copies. An ideal current source has infinite parallel resistance. BJT current sources: a divider sets V_B, V_E = V_B − 0.7, I = (V_E + V_EE)/R_E; with a Zener instead, I = (V_Z − V_BE)/R_E, independent of the supply.",
    steps: [
      { k: "learn", title: "Two transistors, one V_BE", b: [
        fig(mirrorFig(false)),
        `<p>Q1 and Q2 are <b>identical</b> and their base–emitter junctions are in parallel. Same V<sub>BE</sub>, so the same I<sub>B</sub>, so the same I<sub>C</sub>.</p>`,
        `<p>Q1's collector is tied to the bases, so Q1 carries the control current: I<sub>control</sub> = I<sub>C1</sub> + 2I<sub>B</sub> ≈ I<sub>C1</sub> when β ≫ 2.</p>`,
        `<div class="eq">I<sub>control</sub> = (V<sub>CC</sub> − V<sub>BE</sub>)/R      I<sub>L</sub> = I<sub>C2</sub> ≈ I<sub>control</sub></div>`,
      ]},
      { k: "play", title: "Mirror a current", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          const VCC = 9;
          let R = 2200, RL = 1000;
          function draw() {
            const Ic = (VCC - 0.7) / R, IL = Math.min(Ic, (VCC - 0.2) / RL), sat = Ic * RL > VCC - 0.2;
            f.innerHTML = mirrorFig(sat);
            ro.innerHTML = readout([["I<sub>control</sub>", si(Ic, "A")], ["I<sub>L</sub>", si(IL, "A")], ["V<sub>C2</sub>", fmt(VCC - IL * RL, 3) + " V"]]);
            vd.className = "verdict " + (sat ? "no" : "ok");
            vd.textContent = sat ? "R_L is too big: Q2 saturates and can't pass the mirrored current." : "Mirroring: change R_L and I_L doesn't move.";
          }
          host.append(f, slider({ id: id + "-r", label: "Control resistor R", min: 1000, max: 20000, log: true, value: R, show: (v) => si(v, "Ω") }, (v) => { R = v; draw(); }).el,
            slider({ id: id + "-l", label: "Load R<sub>L</sub>", min: 100, max: 10000, log: true, value: RL, show: (v) => si(v, "Ω") }, (v) => { RL = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">V<sub>CC</sub> = 9 V. R sets the current; the load just takes it.</p>`,
        { t: "num", q: "V_CC = 9 V, R = 2.2 kΩ. What current is mirrored, in mA?", a: 3.77, unit: "mA", tol: 0.01, why: "(9 − 0.7)/2.2 kΩ ≈ 3.77 mA." },
      ]},
      { k: "why", title: "It corrects itself", b: [
        `<p>Suppose I<sub>L</sub> tries to rise. Follow the chain:</p>`,
        `<div class="eq">I<sub>L</sub>↑ → I<sub>B2</sub>↑ → V<sub>BE2</sub>↑ → V<sub>CE1</sub>↑ → V<sub>R</sub>↓ → I<sub>R</sub>↓ → I<sub>B</sub>↓ → I<sub>B2</sub>↓ → I<sub>L</sub>↓</div>`,
        `<p>The circuit pushes the current back. And it all happens at once, not step by step.</p>`,
        `<p class="aside">Put a third matched transistor on the same base line and you get a second copy of the same current. Other versions give higher output resistance, or use a JFET's I<sub>DSS</sub> (Chapter 6) as the reference.</p>`,
      ]},
      { k: "learn", title: "Current sources", b: [
        `<div class="two"><div class="tile"><h3>Voltage source</h3><p>Ideal: zero series resistance. Practical: a small R in series.</p></div><div class="tile"><h3>Current source</h3><p>Ideal: infinite parallel resistance, same current into any load. Practical: a very large R in parallel.</p></div></div>`,
        `<p>A BJT version: a divider sets the base (from ground down to −V<sub>EE</sub>), and R<sub>E</sub> sets the current.</p>`,
        `<div class="eq">V<sub>E</sub> = V<sub>B</sub> − 0.7     I ≈ I<sub>E</sub> = (V<sub>E</sub> − (−V<sub>EE</sub>))/R<sub>E</sub></div>`,
        `<p>Swap the lower divider resistor for a Zener and the base voltage is pinned, so:</p>`,
        `<div class="eq">I ≈ (V<sub>Z</sub> − V<sub>BE</sub>)/R<sub>E</sub>    (V<sub>EE</sub> doesn't appear)</div>`,
      ]},
      { k: "play", title: "Which source holds steady?", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let VEE = 16;
          const RE = 1500, Idiv = (v) => (v / 2 - 0.7) / RE * 1000, Iz = () => (5.1 - 0.7) / RE * 1000;
          function draw() {
            f.innerHTML = plot({ x: [8, 24], y: [0, 8], xt: [8, 12, 16, 20, 24], yt: [0, 2, 4, 6, 8], xl: "V_EE (V)", yl: "I (mA)", series: [{ f: Idiv, cls: "s2" }, { f: Iz, cls: "s1" }], marks: [{ x: VEE, y: Idiv(VEE), cls: "mk2" }, { x: VEE, y: Iz() }], label: "Output current against supply voltage for a divider current source (blue) and a Zener current source (orange)" });
            ro.innerHTML = readout([["Equal-resistor divider", fmt(Idiv(VEE), 3) + " mA"], ["5.1 V Zener", fmt(Iz(), 3) + " mA"]]);
          }
          host.append(f, slider({ id: id + "-v", label: "Supply V<sub>EE</sub>", min: 8, max: 24, step: 0.5, value: 16, show: (v) => "−" + v + " V" }, (v) => { VEE = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Both use R<sub>E</sub> = 1.5 kΩ. The divider version (two equal resistors) tracks the supply. The Zener version doesn't care.</p>`,
        { t: "num", q: "Divider version at V_EE = 16 V (equal resistors, R_E = 1.5 kΩ). Current, in mA?", a: 4.87, unit: "mA", tol: 0.01, hint: "V_B = −8 V, V_E = −8.7 V. The current through R_E is (V_E + 16)/1.5 kΩ.", why: "7.3/1.5 kΩ ≈ 4.87 mA." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a current mirror need two identical transistors?", model: "It works because both base–emitter junctions have the same voltage across them. Identical transistors then have the same base current and, with the same β, the same collector current. So the current set in Q1 by the resistor is copied into Q2. If the transistors differed, the same V_BE would give different currents and the copy would be wrong." },
      ]},
    ],
  };

  /* =============== PART 12 =============== */
  function invFig(on) {
    let s = `<circle class="el" cx="40" cy="170" r="5"/>` + S.t(40, 152, "V_i", { cls: "a" }) + S.wire([45, 170], [70, 170]) + S.res(70, 170, 170, 170, "R_B") + S.wire([170, 170], [190, 170]) + bjt(220, 170, { cls: on ? "hl" : "" }) + S.supply(242, 40, "V_CC = 5 V") + S.res(242, 40, 242, 100, "R_C", { side: "left" }) + S.wire([242, 100], [242, 120]) + S.dot(242, 100) + S.wire([242, 100], [320, 100]) + `<circle class="el" cx="325" cy="100" r="5"/>` + S.t(325, 86, "V_C", { cls: "a" }) + S.wire([242, 220], [242, 235]) + S.gnd(242, 235);
    return S.svg(380, 270, s, { max: 380, label: "Transistor inverter: input through R_B, collector to the supply through R_C" });
  }
  const p12 = {
    id: "p12", title: "Transistor switches", mins: 25,
    blurb: "Flip between cutoff and saturation: an inverter, and a switch.",
    takeaway: "As a switch, the transistor jumps between cutoff (I_C ≈ 0, open) and saturation (V_CE ≈ 0, closed), the two ends of the load line. Inverter: I_Csat = V_CC/R_C; make sure I_B > I_Csat/β_dc, with margin. R_sat = V_CEsat/I_Csat is small; R_cutoff = V_CC/I_CEO is huge. Switching times: t_on = t_r + t_d, t_off = t_s + t_f. Switching transistors are made for small times.",
    steps: [
      { k: "learn", title: "Two ends of the load line", b: [
        seen("The transistor as a switch, and logic built from switches.", "06-mosfet-switch.html#p1", "Chapter 6, Part 1"),
        fig(invFig(false)),
        `<p>For logic, the transistor doesn't sit in the middle. It jumps between <b>cutoff</b> (V<sub>i</sub> = 0: off, output high) and <b>saturation</b> (V<sub>i</sub> high: fully on, output low). The output is the opposite of the input: an <b>inverter</b>.</p>`,
        `<p class="aside">The book's simplification: I<sub>CEO</sub> ≈ 0 and V<sub>CE sat</sub> ≈ 0 (really 0.1–0.3 V).</p>`,
      ]},
      { k: "learn", title: "Make sure it saturates", b: [
        `<div class="eq">I<sub>C sat</sub> = V<sub>CC</sub>/R<sub>C</sub>     I<sub>B</sub> &gt; I<sub>C sat</sub>/β<sub>dc</sub></div>`,
        `<p>Just at the edge of saturation I<sub>B</sub> = I<sub>C sat</sub>/β. Give it more than that, with margin, and the Q-point is driven hard against the vertical axis.</p>`,
      ]},
      { k: "play", title: "The inverter lab", b: [
        (host, id) => {
          const sch = el(`<div class="fig"></div>`), f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          const VCC = 5, RC = 1000, hFE = 100;
          let RB = 68e3, hi = true;
          function draw() {
            const ICs = VCC / RC, IB = hi ? (VCC - 0.7) / RB : 0, need = ICs / hFE, IC = Math.min(hFE * IB, ICs), VC = VCC - IC * RC, sat = IB >= need;
            sch.innerHTML = invFig(hi);
            f.innerHTML = plot({ x: [0, 5.5], y: [0, 6], xt: [0, 1, 2, 3, 4, 5], yt: [0, 2, 4, 5, 6], xl: "V_CE (V)", yl: "I_C (mA)", series: [{ pts: [[0, ICs * 1000], [VCC, 0]], cls: "s1" }], marks: [{ x: VC, y: IC * 1000, label: hi ? (sat ? "on" : "stuck") : "off" }], label: "Inverter load line with the operating point" });
            ro.innerHTML = readout([["V<sub>i</sub>", hi ? "5 V" : "0 V"], ["I<sub>B</sub>", si(IB, "A")], ["Needed for saturation", "> " + si(need, "A")], ["V<sub>C</sub> (output)", fmt(VC, 3) + " V"]]);
            vd.className = "verdict " + (!hi || sat ? "ok" : "no");
            vd.textContent = !hi ? "Cutoff: no current, output = V_CC: a logic 1." : sat ? "Saturated: output ≈ 0 V, a logic 0." : "Not saturated: the output sits in between. Lower R_B.";
          }
          host.append(sch, f, toggle(["V_i = 0 V", "V_i = 5 V"], (k) => { hi = k === 1; draw(); }, 1),
            slider({ id: id + "-rb", label: "R<sub>B</sub>", min: 10e3, max: 500e3, log: true, value: RB, show: (v) => si(v, "Ω") }, (v) => { RB = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">V<sub>CC</sub> = 5 V, R<sub>C</sub> = 1 kΩ, h<sub>FE</sub> = 100. Find the largest R<sub>B</sub> that still saturates.</p>`,
      ]},
      { k: "check", title: "Design an inverter", b: [
        `<p>V<sub>CC</sub> = 12 V, I<sub>C sat</sub> = 8 mA, h<sub>FE</sub> = 200, input high = 12 V.</p>`,
        { t: "num", q: "R_C, in kΩ?", a: 1.5, unit: "kΩ", why: "12 V/8 mA = 1.5 kΩ." },
        { t: "num", q: "Minimum I_B for saturation, in µA?", a: 40, unit: "µA", why: "8 mA/200 = 40 µA." },
        { t: "num", q: "Aim 50% above that (60 µA). What R_B, in kΩ?", a: 188, unit: "kΩ", tol: 0.01, hint: "(12 − 0.7)/60 µA.", why: "≈ 188 kΩ. A standard 180 kΩ gives about 63 µA: comfortably saturated." },
      ]},
      { k: "learn", title: "Switch resistance and speed", b: [
        `<div class="two"><div class="tile"><h3>On</h3><div class="eq">R<sub>sat</sub> = V<sub>CE sat</sub>/I<sub>C sat</sub></div><p>e.g. 0.15 V/5 mA = 30 Ω: almost a short next to kΩ resistors.</p></div><div class="tile"><h3>Off</h3><div class="eq">R<sub>cutoff</sub> = V<sub>CC</sub>/I<sub>CEO</sub></div><p>e.g. 5 V/10 µA = 500 kΩ: almost open.</p></div></div>`,
        `<div class="eq">t<sub>on</sub> = t<sub>r</sub> + t<sub>d</sub>     t<sub>off</sub> = t<sub>s</sub> + t<sub>f</sub></div>`,
        `<p>Delay t<sub>d</sub>, rise t<sub>r</sub> (10% to 90%), storage t<sub>s</sub>, fall t<sub>f</sub> (90% to 10%). Turning off is usually slower: the stored charge (t<sub>s</sub>) has to clear first.</p>`,
        { t: "num", q: "t_d = 20 ns, t_r = 15 ns, t_s = 100 ns, t_f = 10 ns. What's t_off?", a: 110, unit: "ns", why: "t_s + t_f = 110 ns, versus t_on = 35 ns. Dedicated switching transistors get both down to tens of ns or less." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do you give an inverter more base current than I_Csat/β?", model: "I_Csat/β is just enough to reach the edge of saturation for a transistor with exactly that β. Real β varies and changes with temperature, so with exactly that current the transistor might not quite saturate and the output wouldn't be a clean low. Extra base current drives it hard into saturation so the output is close to 0 V whatever the transistor's actual β." },
      ]},
    ],
  };

  /* =============== PART 13 =============== */
  const FAULTS = [
    { name: "Circuit 1", VB: "2.14 V", VE: "1.44 V", VC: "7.38 V", RC: "7.38 V" },
    { name: "Circuit 2", VB: "0.02 V", VE: "0.02 V", VC: "12.0 V", RC: "12.0 V" },
    { name: "Circuit 3", VB: "0.72 V", VE: "0.02 V", VC: "0.00 V", RC: "12.0 V" },
    { name: "Circuit 4", VB: "3.56 V", VE: "2.86 V", VC: "3.06 V", RC: "3.06 V" },
  ];
  const p13 = {
    id: "p13", title: "Troubleshooting", mins: 20,
    blurb: "A few voltmeter readings to ground can tell you what's broken.",
    takeaway: "Know what to expect first. An active transistor has V_BE ≈ 0.7 V (−0.7 V for pnp) and, in an amplifier, V_CE about 25% to 75% of V_CC. V_CE ≈ 0.3 V means saturation; V_CE ≈ V_CC (no drop across R_C) means no collector current: an open connection or a dead transistor. Measure node voltages to ground with the black lead on ground; work out currents from voltages across known resistors. Check resistor values before fitting them.",
    steps: [
      { k: "learn", title: "Two numbers to check first", b: [
        `<div class="two"><div class="tile"><h3>V<sub>BE</sub></h3><p>About <b>0.7 V</b> if the transistor is on (red lead on base, black on emitter). 0 V, 4 V, 12 V or negative (for npn): suspect.</p></div><div class="tile"><h3>V<sub>CE</sub></h3><p>For an amplifier, usually <b>25% to 75% of V<sub>CC</sub></b>. Near 0.3 V: saturated. Near V<sub>CC</sub>: no collector current.</p></div></div>`,
        `<p>Easiest method: black lead on ground, touch each node with the red lead. V<sub>CC</sub>, then V<sub>C</sub>, then V<sub>E</sub>, each lower than the last.</p>`,
        `<p class="aside">Get currents from voltages across known resistors rather than breaking the circuit to insert an ammeter. And measure resistors before fitting them: 680 Ω in place of 680 kΩ makes a huge difference.</p>`,
      ]},
      { k: "play", title: "Probe four circuits", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let k = 0;
          function draw() {
            const F = FAULTS[k];
            const tag = (x, y, t) => `<rect x="${x}" y="${y - 15}" width="70" height="20" rx="4" style="fill:#10161d"/><text x="${x + 35}" y="${y}" text-anchor="middle" style="fill:#5cf29b;font-size:13px;font-family:var(--mono)">${t}</text>`;
            const extra = tag(266, 106, F.RC) + tag(266, 136, F.VC) + tag(160, 246, F.VE) + tag(40, 205, F.VB) + S.t(342, 102, "bottom of R_C", { a: "start", cls: "s m" }) + S.t(342, 132, "collector", { a: "start", cls: "s m" }) + S.t(195, 266, "V_E", { cls: "s m" }) + S.t(75, 225, "V_B", { cls: "s m" });
            f.innerHTML = biasFig("emitter", { RB: "470 kΩ", RC: "2.2 kΩ", RE: "680 Ω", VCC: "12 V" }, { extra, w: 460 });
            const num = (s) => parseFloat(s);
            ro.innerHTML = readout([["V<sub>BE</sub> = V<sub>B</sub> − V<sub>E</sub>", fmt(num(F.VB) - num(F.VE), 2) + " V"], ["V<sub>CE</sub> = V<sub>C</sub> − V<sub>E</sub>", fmt(num(F.VC) - num(F.VE), 2) + " V"], ["Drop across R<sub>C</sub>", fmt(12 - num(F.RC), 3) + " V"]]);
          }
          host.append(f, toggle(FAULTS.map((x) => x.name), (i) => { k = i; draw(); }, 0), ro);
          draw();
        },
        `<p>Same emitter-bias design (V<sub>CC</sub> = 12 V, β = 100) built four times. The meter readings are node voltages to ground. One works properly; three don't.</p>`,
      ]},
      { k: "check", title: "Your diagnosis", b: [
        { t: "sort", q: "What's going on in each?", bins: ["Working", "B–E shorted", "Collector not connected", "Saturated (wrong R_B)"], items: [
          ["Circuit 1", 0, "V_BE ≈ 0.7 V and V_CE ≈ 5.9 V, about half of V_CC. Healthy."],
          ["Circuit 2", 1, "V_B = V_E: zero V_BE. No collector current (V_C = V_CC). The base–emitter junction is shorted."],
          ["Circuit 3", 2, "V_BE is 0.7 V, so the junction works, but the bottom of R_C reads 12 V (no current through it) while the collector reads 0 V. The link between R_C and the collector is broken."],
          ["Circuit 4", 3, "V_CE is only 0.2 V: saturated. Too much base current, e.g. 47 kΩ fitted instead of 470 kΩ."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "A voltage-divider amplifier reads V_C = V_CC. What are the likely causes?", model: "If the collector is at V_CC, there's no voltage drop across R_C, so no collector current is flowing. Either the transistor isn't conducting, for example a damaged or shorted base–emitter junction or an open base circuit, or there's an open connection somewhere in the collector–emitter path. Next, check V_BE: about 0.7 V points to an open collector or emitter path; anything else points to the base side or the transistor." },
      ]},
    ],
  };

  /* =============== PART 14 =============== */
  const p14 = {
    id: "p14", title: "Bias stability", mins: 25,
    blurb: "How temperature drags the Q-point, and stability factors that measure it.",
    takeaway: "Heat raises β, lowers V_BE by about 2.5 mV/°C, and doubles I_CO every 10 °C. Stability factors measure the effect on I_C: S(I_CO) = ΔI_C/ΔI_CO, S(V_BE) = ΔI_C/ΔV_BE, S(β) = ΔI_C/Δβ. Smaller is more stable. Fixed bias: S(I_CO) ≈ β, S(V_BE) = −β/R_B, S(β) = I_C1/β1. Emitter bias: S(I_CO) = β(1 + R_B/R_E)/(β + R_B/R_E), from about β down to 1 as R_B/R_E falls; S(V_BE) = −(β/R_E)/(β + R_B/R_E); S(β) = I_C1(1 + R_B/R_E)/[β1(1 + β2 + R_B/R_E)]. For voltage-divider bias use R_Th; for collector feedback use R_C. Total: ΔI_C = S(I_CO)ΔI_CO + S(V_BE)ΔV_BE + S(β)Δβ. Keep R_B/R_E (or R_Th/R_E) small.",
    steps: [
      { k: "learn", title: "What heat does", b: [
        `<div class="two"><div class="tile"><h3>β</h3><p>Rises with temperature.</p></div><div class="tile"><h3>V<sub>BE</sub></h3><p>Falls about 2.5 mV per °C.</p></div><div class="tile"><h3>I<sub>CO</sub></h3><p>Doubles every 10 °C.</p></div></div>`,
        `<div class="readout"><div><span>−65 °C</span><b>I<sub>CO</sub> 0.2 pA · β 20 · V<sub>BE</sub> 0.85 V</b></div><div><span>25 °C</span><b>I<sub>CO</sub> 0.1 nA · β 50 · V<sub>BE</sub> 0.65 V</b></div><div><span>100 °C</span><b>I<sub>CO</sub> 20 nA · β 80 · V<sub>BE</sub> 0.48 V</b></div><div><span>175 °C</span><b>I<sub>CO</sub> 3.3 µA · β 120 · V<sub>BE</sub> 0.3 V</b></div></div>`,
        `<p class="aside">One silicon transistor (the book's Table 4.2). In fixed bias, I<sub>B</sub> stays put while all three push I<sub>C</sub> up: the Q-point climbs toward saturation.</p>`,
      ]},
      { k: "learn", title: "Stability factors", b: [
        `<div class="eq">S(I<sub>CO</sub>) = ΔI<sub>C</sub>/ΔI<sub>CO</sub>    S(V<sub>BE</sub>) = ΔI<sub>C</sub>/ΔV<sub>BE</sub>    S(β) = ΔI<sub>C</sub>/Δβ</div>`,
        `<div class="key">Each one says how much I<sub>C</sub> moves per unit change in that parameter. <b>Smaller is more stable</b>. (They'd be better called sensitivity factors.)</div>`,
        `<div class="eq">ΔI<sub>C</sub> = S(I<sub>CO</sub>)ΔI<sub>CO</sub> + S(V<sub>BE</sub>)ΔV<sub>BE</sub> + S(β)Δβ</div>`,
        `<p class="aside">Deriving them needs calculus; the book gives the results. You'll use them, not derive them.</p>`,
      ]},
      { k: "play", title: "S(I_CO) for emitter bias", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let beta = 50, lr = 1;
          const Sico = (r) => (beta * (1 + r)) / (beta + r);
          function draw() {
            const r = Math.pow(10, lr);
            f.innerHTML = plot({ x: [-2, 3], y: [0, 55], xt: [-2, -1, 0, 1, 2, 3], xtf: (v) => fmt(Math.pow(10, v)), yt: [0, 10, 20, 30, 40, 50], xl: "R_B/R_E (log scale)", yl: "S(I_CO)", series: [{ f: (x) => Sico(Math.pow(10, x)), cls: "s1" }, { pts: [[-2, beta], [3, beta]], cls: "s5" }, { pts: [[-2, 1], [3, 1]], cls: "s5" }], marks: [{ x: lr, y: Sico(r) }], label: "Stability factor S(I_CO) against R_B/R_E for emitter bias" });
            ro.innerHTML = readout([["R<sub>B</sub>/R<sub>E</sub>", fmt(r, 3)], ["S(I<sub>CO</sub>)", fmt(Sico(r), 3)], ["ΔI<sub>C</sub> for 25 → 100 °C (ΔI<sub>CO</sub> = 19.9 nA)", si(Sico(r) * 19.9e-9, "A")]]);
          }
          host.append(f, slider({ id: id + "-r", label: "R<sub>B</sub>/R<sub>E</sub>", min: -2, max: 3, step: 0.02, value: 1, show: (v) => fmt(Math.pow(10, v), 3) }, (v) => { lr = v; draw(); }).el,
            slider({ id: id + "-b", label: "β", min: 20, max: 120, step: 5, value: 50 }, (v) => { beta = v; draw(); }).el, ro);
          draw();
        },
        `<div class="eq">S(I<sub>CO</sub>) = β(1 + R<sub>B</sub>/R<sub>E</sub>) / (β + R<sub>B</sub>/R<sub>E</sub>)</div>`,
        `<p>Big R<sub>B</sub>/R<sub>E</sub>: it approaches β, the same as fixed bias (worst). Small R<sub>B</sub>/R<sub>E</sub>: it approaches 1 (best: I<sub>C</sub> changes only as much as I<sub>CO</sub> does). In between, roughly R<sub>B</sub>/R<sub>E</sub>.</p>`,
        `<p class="aside">The catch: good bias also wants R<sub>B</sub> bigger than R<sub>E</sub>. Design is a trade-off. Modern transistors leak so little that even S = 40 only shifts I<sub>C</sub> by about a microamp.</p>`,
      ]},
      { k: "learn", title: "The other two factors", b: [
        `<div class="two"><div class="tile"><h3>S(V<sub>BE</sub>)</h3><p>Fixed: −β/R<sub>B</sub>. Emitter: −(β/R<sub>E</sub>)/(β + R<sub>B</sub>/R<sub>E</sub>), which becomes −1/R<sub>E</sub> when β ≫ R<sub>B</sub>/R<sub>E</sub>. Bigger R<sub>E</sub>, more stable.</p></div><div class="tile"><h3>S(β)</h3><p>Fixed: I<sub>C1</sub>/β<sub>1</sub>. Emitter: I<sub>C1</sub>(1 + R<sub>B</sub>/R<sub>E</sub>)/[β<sub>1</sub>(1 + β<sub>2</sub> + R<sub>B</sub>/R<sub>E</sub>)]. β<sub>1</sub> is the starting β, β<sub>2</sub> the new one.</p></div></div>`,
        `<p class="aside">For voltage-divider bias, replace R<sub>B</sub> with R<sub>Th</sub>. For collector feedback, replace R<sub>E</sub> with R<sub>C</sub>. Note: the book prints Eq. 4.109 without the "1 +" in the bottom bracket, but its worked example and its summary both include it. The version above matches those.</p>`,
        { t: "num", q: "Fixed bias, β = 100, R_B = 330 kΩ. V_BE drops 0.17 V when it warms from 25 °C to 100 °C. How much does I_C rise, in µA?", a: 51.5, unit: "µA", tol: 0.02, hint: "S(V_BE) = −100/330 kΩ. Multiply by ΔV_BE = −0.17 V.", why: "(−0.303 mA/V)(−0.17 V) ≈ +51.5 µA." },
        { t: "num", q: "Emitter bias, R_B/R_E = 20, I_C = 1.5 mA at β1 = 50; β rises to β2 = 80. How much does I_C rise, in mA?", a: 0.187, unit: "mA", tol: 0.02, hint: "S(β) = 1.5 mA × 21/[50 × (1 + 80 + 20)]. Then × Δβ = 30.", why: "S(β) ≈ 31.5 mA/5050 ≈ 6.24 µA per unit of β; × 30 ≈ 0.187 mA, about a 12% rise." },
      ]},
      { k: "why", title: "Why each one resists", b: [
        `<div class="two"><div class="tile"><h3>Fixed bias</h3><p>I<sub>B</sub> = (V<sub>CC</sub> − V<sub>BE</sub>)/R<sub>B</sub>. Nothing in it reacts when I<sub>C</sub> rises. Least stable.</p></div><div class="tile"><h3>Emitter bias</h3><p>I<sub>C</sub>↑ → V<sub>E</sub>↑ → I<sub>B</sub>↓ → I<sub>C</sub>↓</p></div><div class="tile"><h3>Collector feedback</h3><p>I<sub>C</sub>↑ → V<sub>RC</sub>↑ → I<sub>B</sub>↓ → I<sub>C</sub>↓</p></div><div class="tile"><h3>Voltage divider</h3><p>V<sub>B</sub> fixed by the stiff divider. I<sub>C</sub>↑ → V<sub>E</sub>↑ → V<sub>BE</sub>↓ → I<sub>B</sub>↓. Most stable.</p></div></div>`,
        `<div class="key">General rule: keep R<sub>B</sub>/R<sub>E</sub> (or R<sub>Th</sub>/R<sub>E</sub>) as small as the rest of the design allows.</div>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a stability factor of 1 for S(I_CO) mean, and why can't it go lower?", model: "S(I_CO) = 1 means the collector current changes by exactly as much as the leakage current does, with no amplification of the leakage. It can't go below 1 because the leakage current flows into the collector directly, so I_C must rise at least by ΔI_CO. Higher values mean the circuit multiplies the leakage change; fixed bias multiplies it by about β." },
      ]},
    ],
  };

  /* =============== PART 15 =============== */
  const p15 = {
    id: "p15", title: "In practice", mins: 25,
    blurb: "BJTs used as diodes, relay drivers, lamp switches, constant-current sources, logic gates and a battery monitor.",
    takeaway: "A BJT with only two leads used is acting as a diode (cheaper in bulk and easy to make in ICs). Relay drivers need a diode across the coil to absorb the inductive kick at turn-off; the diode must carry the coil current. A cold lamp has low resistance: a series limiting resistor caps the turn-on surge. Voltage-divider bias makes a good constant-current source for a load in the collector, used in alarm loops. Saturated and cut-off transistors make OR (parallel) and AND (series) gates. A Zener plus a transistor can switch an LED when a supply drops below a threshold.",
    steps: [
      { k: "learn", title: "Not every BJT amplifies", b: [
        `<p>If a transistor has a lead unconnected, often the collector, it's probably being used as a <b>diode</b>: it's cheaper to buy transistors in bulk, and in ICs extra transistors are easier to make than separate diodes.</p>`,
        `<p>Typical jobs: a series diode, a 0.7 V step in a reference voltage, or a junction across a device so its voltage can't exceed 0.7 V.</p>`,
      ]},
      { k: "learn", title: "Relay driver", b: [
        ch(2, "02-diode-applications.html", "p12", "Part 12", "The inductive kick, and the diode that tames it, are in"),
        `<p>A pulse on the base turns the transistor on, and the collector current energizes the relay coil. At turn-off, the coil's current can't stop instantly: v<sub>L</sub> = L di/dt spikes, and that spike appears across the transistor's collector and emitter.</p>`,
        { t: "mcq", q: "With a diode across the coil, what rating matters most for the diode?", opts: [
          ["Its forward current: it must carry the full coil current at turn-off", true, "The coil's current switches straight into the diode, then dies away through the loop's resistance."],
          ["A high reverse voltage only", false, "In normal operation it only sees V_CC in reverse, which is modest. Its big job is carrying current."],
          ["None, it's never on", false, "It's off while the transistor is on, then takes the whole coil current at turn-off."],
        ]},
      ]},
      { k: "play", title: "Cold lamps and surges", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const VCC = 12, IBuA = 60;
          const lines = [["cold lamp", 400], ["hot lamp", 4000], ["cold lamp + 2.2 kΩ limiter", 2600]];
          function draw(k) {
            const [name, R] = lines[k], [V, I] = qOnLine(IBuA, VCC, R);
            const series = [20, 40, 60, 80].map((ib) => ({ f: (v) => iCE(ib, v), from: 0.001, cls: ib === IBuA ? "s2" : "s5" }));
            lines.forEach(([, r], j) => series.push({ pts: [[0, (VCC / r) * 1000], [VCC, 0]], cls: j === k ? "s1" : "s5" }));
            f.innerHTML = plot({ x: [0, 13], y: [0, 10], xt: [0, 4, 8, 12], yt: [0, 2, 4, 6, 8, 10], xl: "V_CE (V)", yl: "I_C (mA)", series, marks: [{ x: V, y: I }], label: "Load lines for a lamp in the collector: cold, hot, and cold with a limiting resistor" });
            ro.innerHTML = readout([["Collector load", name + " (" + si(R, "Ω") + ")"], ["I<sub>C</sub>", fmt(I, 3) + " mA"], ["V<sub>CE</sub>", fmt(V, 3) + " V"], ["State", V < 0.4 ? "saturated (switch fully on)" : "active: the current is set by β·I_B"]]);
          }
          host.append(f, toggle(["Cold lamp", "Hot lamp", "Cold + limiter"], draw, 0), ro);
          draw(0);
        },
        `<p>The transistor switches a lamp in its collector, with I<sub>B</sub> set by the base resistor. Hot, the lamp's resistance is high and the transistor saturates at a modest current. Cold, the filament's resistance is far lower, so the load line is much steeper and the current jumps to β·I<sub>B</sub>. A small series resistor caps that surge.</p>`,
        `<p class="aside">The resistances here are scaled down to fit the graph; the shape of the problem is what matters.</p>`,
      ]},
      { k: "learn", title: "Constant current and an alarm loop", b: [
        `<p>Fixed bias isn't a good current source: β changes from point to point, so I<sub>C</sub> drifts as the load changes. Voltage-divider bias is much better: I<sub>C</sub> ≈ (V<sub>B</sub> − 0.7)/R<sub>E</sub>, whatever the load in the collector.</p>`,
        `<p>An alarm uses one: a steady 4 mA flows through a loop of door and window sensors into a comparator that checks it against a 2 mA reference. Open any sensor and the current falls below 2 mA: the comparator's output drops and triggers the bell.</p>`,
        { t: "num", q: "The source's divider gives V_B = 4.78 V, and R_E = 1 kΩ. What loop current, in mA?", a: 4.08, unit: "mA", tol: 0.01, why: "(4.78 − 0.7)/1 kΩ ≈ 4.08 mA ≈ 4 mA." },
        `<p class="aside">The comparator is an op-amp (Chapter 10). Its low input impedance helps: a voltage spike on the line mostly drops across a series resistor, so it doesn't cause a false alarm.</p>`,
      ]},
      { k: "play", title: "Logic gates from switches", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let A = 1, B = 0, and = false;
          function draw() {
            const on = (x) => (x ? "hl" : ""), out = and ? A && B : A || B;
            let s;
            if (!and) s = S.wire([90, 40], [250, 40]) + S.supply(170, 40, "5 V") + bjt(90, 120, { cls: on(A) }) + bjt(250, 120, { cls: on(B) }) + S.wire([112, 70], [112, 40]) + S.wire([272, 70], [272, 40]) + S.wire([112, 170], [112, 190], [272, 190], [272, 170]) + S.dot(190, 190) + S.res(190, 190, 190, 260, "R_E", { side: "right" }) + S.gnd(190, 260);
            else s = S.supply(182, 40, "5 V") + S.wire([182, 40], [182, 50]) + bjt(160, 100, { cls: on(A) }) + bjt(160, 200, { cls: on(B) }) + S.dot(182, 250) + S.res(182, 250, 182, 310, "R_E", { side: "right" }) + S.gnd(182, 310);
            const outX = and ? 182 : 190, outY = and ? 250 : 190;
            s += S.wire([outX, outY], [330, outY]) + `<circle class="el" cx="335" cy="${outY}" r="5"/>` + S.t(335, outY - 14, "C = " + (out ? "5 V" : "0 V"), { cls: "a" });
            s += and ? S.t(126, 92, "A", { a: "end" }) + S.t(126, 192, "B", { a: "end" }) : S.t(56, 112, "A", { a: "end" }) + S.t(216, 112, "B", { a: "end" });
            f.innerHTML = S.svg(380, and ? 340 : 290, s, { max: 380, label: and ? "AND gate: two transistors in series" : "OR gate: two transistors in parallel" });
            ro.innerHTML = readout([["A", A ? "1 (on)" : "0 (off)"], ["B", B ? "1 (on)" : "0 (off)"], ["Output C", out ? "1" : "0"]]);
          }
          host.append(f, toggle(["OR (parallel)", "AND (series)"], (k) => { and = k === 1; draw(); }, 0), toggle(["A = 0", "A = 1"], (k) => { A = k; draw(); }, 1), toggle(["B = 0", "B = 1"], (k) => { B = k; draw(); }, 0), ro);
          draw();
        },
        `<p>Saturated ≈ short, cut off ≈ open. In <b>parallel</b>, either transistor can connect 5 V to the output: OR. In <b>series</b>, both must be on: AND.</p>`,
      ]},
      { k: "play", title: "A battery monitor", b: [
        (host, id) => {
          const ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let V = 9;
          function draw() {
            const tap = V * 0.6, on = tap >= 5.4;
            ro.innerHTML = readout([["Battery", fmt(V, 3) + " V"], ["Pot tap (set to 60%)", fmt(tap, 3) + " V"], ["Needed: Zener 4.7 V + V<sub>BE</sub> 0.7 V", "5.4 V"]]);
            vd.className = "verdict " + (on ? "ok" : "no");
            vd.textContent = on ? "Zener and transistor on: the green LED is lit." : "Not enough to turn on the Zener and the transistor: the LED goes out.";
          }
          host.append(slider({ id: id + "-v", label: "Battery voltage", min: 6, max: 10, step: 0.05, value: 9, show: (v) => fmt(v, 3) + " V" }, (v) => { V = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p>A pot across the battery feeds a 4.7 V Zener in series with the transistor's base–emitter junction. The LED sits in the collector. Set the pot so the tap reads 5.4 V at 9 V. When the battery sags, the tap drops below 5.4 V and the LED goes out.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is voltage-divider bias a better constant-current source than fixed bias?", model: "In fixed bias the base current is fixed, but the collector current is β times it, and β varies from point to point on the curves as the load moves the operating point. With voltage-divider bias the base voltage is fixed, so the emitter voltage and current, (V_B − 0.7)/R_E, are fixed regardless of β. The collector current equals that emitter current whatever load sits in the collector, within limits." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edc4", eyebrow: "Boylestad · Chapter 4", title: "DC Biasing: BJTs",
    intro: `<p>Fifteen parts: setting a BJT's operating point with the classic bias circuits, then load lines, design, multi-transistor circuits, current mirrors, switches, troubleshooting, temperature stability and real uses.</p><p>6.002 covered biasing and load lines for the MOSFET amplifier. The ideas carry over; this chapter adds the BJT's own circuits and formulas.</p><p class="aside">The "Computer Analysis" section isn't covered. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's problems in the book. They test whether the ideas stuck, so don't expect them to look like the examples here.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15],
    summary: `
      <h3>Always</h3>
      <div class="eq">V<sub>BE</sub> ≅ 0.7 V    I<sub>C</sub> = βI<sub>B</sub>    I<sub>E</sub> = (β + 1)I<sub>B</sub> ≅ I<sub>C</sub>    Capacitors open for DC. Find I<sub>B</sub> first.</div>
      <h3>Fixed bias</h3>
      <div class="eq">I<sub>B</sub> = (V<sub>CC</sub> − V<sub>BE</sub>)/R<sub>B</sub>    V<sub>CE</sub> = V<sub>CC</sub> − I<sub>C</sub>R<sub>C</sub>    I<sub>C sat</sub> = V<sub>CC</sub>/R<sub>C</sub></div>
      <h3>Emitter bias</h3>
      <div class="eq">I<sub>B</sub> = (V<sub>CC</sub> − V<sub>BE</sub>)/[R<sub>B</sub> + (β + 1)R<sub>E</sub>]    R<sub>i</sub> = (β + 1)R<sub>E</sub>    V<sub>CE</sub> = V<sub>CC</sub> − I<sub>C</sub>(R<sub>C</sub> + R<sub>E</sub>)    I<sub>C sat</sub> = V<sub>CC</sub>/(R<sub>C</sub> + R<sub>E</sub>)</div>
      <h3>Voltage-divider bias</h3>
      <div class="eq">Exact: R<sub>Th</sub> = R<sub>1</sub>∥R<sub>2</sub>, E<sub>Th</sub> = R<sub>2</sub>V<sub>CC</sub>/(R<sub>1</sub> + R<sub>2</sub>), I<sub>B</sub> = (E<sub>Th</sub> − V<sub>BE</sub>)/[R<sub>Th</sub> + (β + 1)R<sub>E</sub>]</div>
      <div class="eq">Shortcut if βR<sub>E</sub> ≥ 10R<sub>2</sub>: V<sub>B</sub> = R<sub>2</sub>V<sub>CC</sub>/(R<sub>1</sub> + R<sub>2</sub>), V<sub>E</sub> = V<sub>B</sub> − 0.7, I<sub>C</sub> ≈ V<sub>E</sub>/R<sub>E</sub></div>
      <h3>Collector feedback</h3>
      <div class="eq">I<sub>B</sub> = (V<sub>CC</sub> − V<sub>BE</sub>)/[R<sub>F</sub> + β(R<sub>C</sub> + R<sub>E</sub>)]    V<sub>CE</sub> = V<sub>CC</sub> − I<sub>C</sub>(R<sub>C</sub> + R<sub>E</sub>)</div>
      <h3>Follower, common base, pnp</h3>
      <div class="eq">EF: I<sub>B</sub> = (V<sub>EE</sub> − V<sub>BE</sub>)/[R<sub>B</sub> + (β + 1)R<sub>E</sub>], V<sub>CE</sub> = V<sub>EE</sub> − I<sub>E</sub>R<sub>E</sub>    CB: I<sub>E</sub> = (V<sub>EE</sub> − V<sub>BE</sub>)/R<sub>E</sub>, V<sub>CB</sub> = V<sub>CC</sub> − I<sub>C</sub>R<sub>C</sub></div>
      <p>pnp: same equations, V<sub>BE</sub> = −0.7 V, everything reversed.</p>
      <h3>Design</h3>
      <p>R = V/I. V<sub>E</sub> ≈ V<sub>CC</sub>/10. Divider: R<sub>2</sub> ≤ βR<sub>E</sub>/10. Then standard values.</p>
      <h3>Multi-stage</h3>
      <div class="eq">Darlington: β<sub>D</sub> = β<sub>1</sub>β<sub>2</sub>, V<sub>BED</sub> ≈ 1.4 V, I<sub>B1</sub> = (V<sub>CC</sub> − V<sub>BED</sub>)/[R<sub>B</sub> + (β<sub>D</sub> + 1)R<sub>E</sub>]    Mirror: I = (V<sub>CC</sub> − V<sub>BE</sub>)/R    Zener source: I = (V<sub>Z</sub> − V<sub>BE</sub>)/R<sub>E</sub></div>
      <h3>Switching</h3>
      <div class="eq">I<sub>C sat</sub> = V<sub>CC</sub>/R<sub>C</sub>    I<sub>B</sub> &gt; I<sub>C sat</sub>/β<sub>dc</sub>    R<sub>sat</sub> = V<sub>CE sat</sub>/I<sub>C sat</sub>    t<sub>on</sub> = t<sub>r</sub> + t<sub>d</sub>    t<sub>off</sub> = t<sub>s</sub> + t<sub>f</sub></div>
      <h3>Troubleshooting</h3>
      <p>V<sub>BE</sub> ≈ 0.7 V; V<sub>CE</sub> 25–75% of V<sub>CC</sub>. V<sub>CE</sub> ≈ 0.3 V: saturated. V<sub>C</sub> = V<sub>CC</sub>: no collector current.</p>
      <h3>Stability</h3>
      <div class="eq">ΔI<sub>C</sub> = S(I<sub>CO</sub>)ΔI<sub>CO</sub> + S(V<sub>BE</sub>)ΔV<sub>BE</sub> + S(β)Δβ    Emitter bias: S(I<sub>CO</sub>) = β(1 + R<sub>B</sub>/R<sub>E</sub>)/(β + R<sub>B</sub>/R<sub>E</sub>)</div>
      <div class="eq">S(V<sub>BE</sub>) = −(β/R<sub>E</sub>)/(β + R<sub>B</sub>/R<sub>E</sub>)    S(β) = I<sub>C1</sub>(1 + R<sub>B</sub>/R<sub>E</sub>)/[β<sub>1</sub>(1 + β<sub>2</sub> + R<sub>B</sub>/R<sub>E</sub>)]    Fixed: S(I<sub>CO</sub>) ≈ β, S(V<sub>BE</sub>) = −β/R<sub>B</sub>, S(β) = I<sub>C1</sub>/β<sub>1</sub></div>
      <p>Voltage divider: R<sub>B</sub> → R<sub>Th</sub>. Collector feedback: R<sub>E</sub> → R<sub>C</sub>. Keep R<sub>B</sub>/R<sub>E</sub> small.</p>`,
  };
  Course.start(window.CHAPTER);
})();
