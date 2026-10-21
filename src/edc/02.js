(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  /* A short "you've already learned this" card that links back into the 6.002 book. */
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const ch1 = (html, part, where) => `<p class="aside">${html} <a href="01-semiconductor-diodes.html#${part}">Boylestad Chapter 1, ${where} →</a></p>`;
  const TAU = 2 * Math.PI, sinw = (t) => Math.sin(TAU * t), frac = (t) => t - Math.floor(t);
  const VK = { Si: 0.7, Ge: 0.3, GaAs: 1.2, Ideal: 0 };

  /* Round tick marks for an axis from lo to hi. */
  function ticks(lo, hi, n = 4) {
    const raw = (hi - lo) / n, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    const st = (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p, out = [];
    for (let v = Math.ceil(lo / st - 1e-9) * st; v <= hi + 1e-9; v += st) out.push(+v.toFixed(10));
    return out;
  }
  const ohm = (lg) => { const v = Math.pow(10, lg); return v >= 1000 ? fmt(v / 1000, 2) + "k" : fmt(v, 2); };
  const tlab = (v) => ({ 0: "0", 0.5: "T/2", 1: "T", 1.5: "3T/2", 2: "2T" }[v] || fmt(v));
  /* Two cycles of a waveform against time. */
  const wplot = (o) => plot(Object.assign({ x: [0, 2], xt: [0, 0.5, 1, 1.5, 2], xtf: tlab, xl: "t", h: 190 }, o));
  const avg = (f, n = 2000) => { let s = 0; for (let i = 0; i < n; i++) s += f((i + 0.5) / n); return s / n; };

  /* ---------- drawing helpers ---------- */
  const off = (s) => `<g opacity="0.3">${s}</g>`;
  /* A diode at any angle, anode at (x1,y1). */
  function dAt(x1, y1, x2, y2, cls) {
    const L = Math.hypot(x2 - x1, y2 - y1), a = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    return `<g transform="translate(${x1} ${y1}) rotate(${a.toFixed(2)})">${S.diode(0, 0, L, 0, "", { cls })}</g>`;
  }
  /* AC source: a circle with a sine wiggle. */
  function ac(cx, cy, label, side) {
    let s = `<circle class="el" cx="${cx}" cy="${cy}" r="18"/><path class="w" d="M${cx - 10} ${cy} q5 -11 10 0 t10 0" style="stroke-width:2"/>`;
    if (label) s += `<text x="${side === "right" ? cx + 26 : cx - 26}" y="${cy + 5}" text-anchor="${side === "right" ? "start" : "end"}">${label}</text>`;
    return s;
  }
  /* Battery lying in a horizontal wire: + on the left when V ≥ 0. */
  function batH(cx, cy, V, label) {
    const pl = V >= 0;
    return `<circle class="el" cx="${cx}" cy="${cy}" r="16"/><text x="${cx - 7}" y="${cy + 5}" text-anchor="middle" class="s">${pl ? "+" : "−"}</text><text x="${cx + 7}" y="${cy + 5}" text-anchor="middle" class="s">${pl ? "−" : "+"}</text>` + (label ? S.t(cx, cy - 24, label, { cls: "s" }) : "");
  }
  /* Vertical LED from (x,y1) [anode] to (x,y2); light arrows on the right. */
  function ledV(x, y1, y2, color, lit, cls) {
    const m = (y1 + y2) / 2, c = lit ? color : "var(--muted)";
    let s = lit ? `<circle cx="${x}" cy="${m}" r="17" style="fill:${color};opacity:.45"/>` : "";
    s += S.diode(x, y1, x, y2, "", { cls });
    [-8, 2].forEach((dy) => { s += `<line x1="${x + 13}" y1="${m + dy}" x2="${x + 24}" y2="${m + dy - 9}" style="stroke:${c};stroke-width:2"/><polygon points="${x + 27},${m + dy - 12} ${x + 19},${m + dy - 9} ${x + 24},${m + dy - 4}" style="fill:${c}"/>`; });
    return s;
  }
  /* Horizontal LED from (x1,y) [anode] to (x2,y); light arrows above. */
  function ledH(x1, y, x2, color, lit) {
    const m = (x1 + x2) / 2, c = lit ? color : "var(--muted)";
    let s = S.diode(x1, y, x2, y, "");
    [-7, 3].forEach((dx) => { s += `<line x1="${m + dx}" y1="${y - 13}" x2="${m + dx + 8}" y2="${y - 24}" style="stroke:${c};stroke-width:2"/><polygon points="${m + dx + 11},${y - 28} ${m + dx + 4},${y - 23} ${m + dx + 10},${y - 19}" style="fill:${c}"/>`; });
    return s;
  }
  /* Vertical Zener from anode (x,y1) to cathode (x,y2). */
  function zenV(x, y1, y2, cls) {
    const s = Math.sign(y2 - y1) || 1, bar = (y1 + y2) / 2 + s * 9, c = cls ? " " + cls : "";
    return S.diode(x, y1, x, y2, "", { cls }) + `<polyline class="w${c}" points="${x - 11},${bar} ${x - 16},${bar + 5 * s}"/><polyline class="w${c}" points="${x + 11},${bar} ${x + 16},${bar - 5 * s}"/>`;
  }
  /* The basic loop: source on the left, diode along the top, resistor down the right. */
  function loop(o = {}) {
    const cls = o.on ? "hl" : "";
    let s = S.wire([80, 92], [80, 40], [130, 40]) + (o.rev ? S.diode(210, 40, 130, 40, "", { cls }) : S.diode(130, 40, 210, 40, "", { cls })) + S.wire([210, 40], [280, 40]) + S.res(280, 40, 280, 170, o.R || "R", { side: "right" }) + S.wire([280, 170], [80, 170], [80, 128]);
    s += o.ac ? ac(80, 110, o.E || "v_i") : S.vsrc(80, 110, o.E || "E", { flip: o.flip });
    if (o.dl) s += S.t(170, 22, o.dl, { cls: "s" });
    return s;
  }

  /* =============== PART 1: load line =============== */
  const IsR = 1e-14, nR = 1.05, VTR = 0.026;
  const iReal = (V) => IsR * (Math.exp(V / (nR * VTR)) - 1);
  function qReal(E, R) { if (E <= 0) return [E, 0]; let a = 0, b = E; for (let k = 0; k < 80; k++) { const m = (a + b) / 2; if ((E - m) / R > iReal(m)) a = m; else b = m; } return [a, (E - a) / R]; }
  const qModel = (E, R, vk) => (E > vk ? [vk, (E - vk) / R] : [E, 0]);

  const p1 = {
    id: "p1", title: "Load-line analysis", mins: 20,
    blurb: "The circuit draws a straight line, the diode draws a curve. The answer is where they cross.",
    takeaway: "KVL gives the load line E = V_D + I_D·R, through (0, E/R) and (E, 0). The network sets the line, the device sets the curve, and the crossing is the Q-point. The 0.7 V model gives almost the same I_DQ as the real curve. The ideal model is only good when E ≫ V_K. At its Q-point the diode behaves like R_D = V_DQ/I_DQ, but only at that point.",
    steps: [
      { k: "learn", title: "Two rules at once", b: [
        seen("The load line: draw the circuit's straight line on the device's curve and read off the crossing.", "04-nonlinear-circuits.html#p4", "Chapter 4, Part 4"),
        fig(S.svg(360, 200, loop({ dl: "+ V_D −" }) + S.arrow(150, 66, 200, 66, "I_D", { ly: 88 }), { max: 360, label: "Series circuit: source E, a diode, and resistor R" })),
        `<p>The diode must obey its own curve. The rest of the circuit must obey KVL. The answer has to satisfy <b>both</b> at once.</p>`,
        `<div class="eq">E = V<sub>D</sub> + I<sub>D</sub>R</div>`,
        `<p class="aside">New in this book: putting the real curve and the simpler models side by side on the same load line.</p>`,
      ]},
      { k: "learn", title: "Two easy points", b: [
        `<p>KVL is a straight line on the diode's axes: the <b>load line</b>. You only need its two ends.</p>`,
        `<div class="two"><div class="tile"><h3>Set V<sub>D</sub> = 0</h3><p>Then I<sub>D</sub> = E/R. That's where the line meets the current axis.</p></div><div class="tile"><h3>Set I<sub>D</sub> = 0</h3><p>Then V<sub>D</sub> = E. That's where it meets the voltage axis.</p></div></div>`,
        `<p>Where it crosses the diode's curve is the <b>Q-point</b> ("quiescent": still, not moving). Drop down to read V<sub>DQ</sub>, across to read I<sub>DQ</sub>.</p>`,
      ]},
      { k: "predict", title: "Guess first", b: [
        { t: "mcq", q: "You double R and leave E alone. What changes on the graph?", opts: [
          ["The line's top end, E/R, halves. The diode curve stays put", true, "The line pivots around its bottom end (V_D = E), and the Q-point slides down the curve. The curve belongs to the diode, so the circuit can't move it."],
          ["The diode's curve shifts", false, "The curve is the device's own behaviour. Changing the network only changes the line."],
          ["The line's bottom end, V_D = E, moves", false, "That end is where I_D = 0, so R doesn't affect it. Check with E = V_D + I_D·R."],
        ]},
      ]},
      { k: "play", title: "Slide the load line", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let E = 8, R = 1000, m = 0;
          function draw() {
            const qs = [qReal(E, R), qModel(E, R, 0.7), qModel(E, R, 0)], [V, I] = qs[m];
            const xmax = Math.max(1.5, E * 1.08), ymax = (E / R) * 1000 * 1.18;
            const curve = m === 0 ? { f: (v) => 1000 * iReal(v), cls: "s2" } : m === 1 ? { pts: [[0, 0], [0.7, 0], [0.7, ymax * 3]], cls: "s2" } : { pts: [[0, 0], [0, ymax * 3]], cls: "s2" };
            const series = [{ pts: [[0, (E / R) * 1000], [E, 0]], cls: "s1" }, curve];
            if (m) series.unshift({ f: (v) => 1000 * iReal(v), cls: "s5" });
            f.innerHTML = plot({ x: [0, xmax], y: [0, ymax], xt: ticks(0, xmax), yt: ticks(0, ymax), xl: "V_D (V)", yl: "I_D (mA)", series, marks: [{ x: V, y: I * 1000, label: "Q" }], label: "Load line crossing the diode curve at the Q-point" });
            const RD = I > 0 ? V / I : Infinity;
            ro.innerHTML = readout([["V<sub>DQ</sub>", fmt(V, 3) + " V"], ["I<sub>DQ</sub>", si(I, "A")], ["V<sub>R</sub> = E − V<sub>DQ</sub>", fmt(E - V, 3) + " V"], ["R<sub>D</sub> = V<sub>DQ</sub>/I<sub>DQ</sub>", m === 2 ? "0 Ω (a short)" : si(RD, "Ω")]]);
            if (m === 0) { vd.className = "verdict mid"; vd.textContent = "This is the real diode. Switch models to compare."; }
            else {
              const err = ((I - qs[0][1]) / qs[0][1]) * 100;
              vd.className = "verdict " + (Math.abs(err) < 5 ? "ok" : Math.abs(err) < 15 ? "mid" : "no");
              vd.textContent = qs[0][1] > 0 ? `Current is ${fmt(Math.abs(err), 2)}% ${err >= 0 ? "above" : "below"} the real diode's.` : "The real diode is off here.";
            }
          }
          host.append(f, toggle(["Real diode curve", "0.7 V model", "Ideal diode"], (k) => { m = k; draw(); }, 0),
            slider({ id: id + "-e", label: "Source E", min: 0.5, max: 20, step: 0.1, value: 8, show: (v) => fmt(v, 3) + " V" }, (v) => { E = v; draw(); }).el,
            slider({ id: id + "-r", label: "Resistor R", min: 100, max: 10000, log: true, value: 1000, show: (v) => si(v, "Ω") }, (v) => { R = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">Orange: the load line. Blue: the diode model you picked. Grey dashed: the real diode, for comparison. Try a small E, like 1.5 V, then a big one.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "E = 6 V and R = 1.2 kΩ. Using the 0.7 V model, what's I_DQ?", a: 4.42, unit: "mA", hint: "The diode takes 0.7 V. The rest is across R.", why: "(6 − 0.7)/1.2 kΩ = 4.42 mA." },
        { t: "num", q: "Same circuit with the ideal model?", a: 5, unit: "mA", hint: "The ideal diode takes 0 V.", why: "6 V/1.2 kΩ = 5 mA: about 13% too high. That's the price of ignoring the 0.7 V." },
        { t: "mcq", q: "When is the ideal model good enough?", opts: [
          ["When the voltages around it are much bigger than 0.7 V, or when you only care what the diode does", true, "Then 0.7 V is a rounding error. The book uses the 0.7 V model whenever the voltages are small."],
          ["Always: diodes are basically switches", false, "Try E = 1.5 V in the widget. The ideal model gets the current badly wrong."],
          ["Never", false, "With E = 20 V the error is only a few percent, often less than the parts' tolerances."],
        ]},
      ]},
      { k: "learn", title: "Freeze the Q-point into a resistor", b: [
        `<p>At the Q-point, the diode is passing I<sub>DQ</sub> with V<sub>DQ</sub> across it. A resistor R<sub>D</sub> = V<sub>DQ</sub>/I<sub>DQ</sub> would do exactly the same.</p>`,
        ch1("This is the DC resistance R_D from", "p6", "Part 6"),
        { t: "num", q: "Back to E = 6 V, R = 1.2 kΩ with the 0.7 V model. What's R_D?", a: 158, unit: "Ω", tol: 0.02, hint: "R_D = V_DQ/I_DQ, using the 4.42 mA you found.", why: "0.7 V/4.42 mA ≈ 158 Ω. Put 158 Ω in place of the diode and you get the same 4.42 mA." },
        { t: "mcq", q: "Now E goes up to 9 V. Is the diode still 158 Ω?", opts: [
          ["No. New E, new Q-point, new R_D", true, "I_DQ becomes 6.92 mA, so R_D = 0.7/6.92 mA ≈ 101 Ω. R_D only describes the diode at one operating point."],
          ["Yes. It's the same diode", false, "Same diode, different operating point. A diode isn't a resistor: its V/I ratio changes with the current."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does changing R move the load line but never the diode's curve?", model: "The load line comes from KVL around the circuit, E = V_D + I_D·R, so it depends only on E and R. The curve is the diode's own V–I behaviour and doesn't care what it's connected to. The circuit only decides where on the curve the diode ends up: the Q-point." },
      ]},
    ],
  };

  /* =============== PART 2: series circuits =============== */
  const p2 = {
    id: "p2", title: "Series diode circuits", mins: 20,
    blurb: "Is it on or off? Pretend it's a resistor and see which way the current wants to go.",
    takeaway: "To find a diode's state, imagine a resistor in its place. If the current would flow along the arrow, and the push is more than V_K (Si 0.7, Ge 0.3, GaAs 1.2 V, ideal 0), it's on: replace it with V_K. Otherwise it's off: an open circuit, with zero current but possibly a large voltage. On diodes in series each take their V_K. One off diode in series stops the current for all of them, and the off one takes the whole voltage.",
    steps: [
      { k: "learn", title: "Pretend it's a resistor", b: [
        `<p>Before you can use a model, you need the diode's <b>state</b>: on or off.</p>`,
        `<ol><li>Mentally swap the diode for a resistor.</li><li>Which way would the current go?</li><li>Same way as the diode's arrow, and more than V<sub>K</sub> of push? Then it's <b>on</b>.</li></ol>`,
        `<div class="two"><div class="tile"><h3>On</h3><p>Replace it with a V<sub>K</sub> battery: Si 0.7 V, Ge 0.3 V, GaAs 1.2 V, ideal 0 V.</p></div><div class="tile"><h3>Off</h3><p>Replace it with an open circuit.</p></div></div>`,
        `<p class="aside">From here on the book ignores the diode's small forward resistance. It's tiny next to the other resistors.</p>`,
        ch1("These are the simplified and ideal models from", "p7", "Part 7"),
      ]},
      { k: "predict", title: "Guess first", b: [
        { t: "mcq", q: "A silicon diode, a 2 kΩ resistor and a 12 V battery in one loop. The diode is in backwards. How much voltage is across the diode?", opts: [
          ["12 V: all of it", true, "No current flows, so the resistor drops 0 V (V = IR). KVL says the rest, all 12 V, sits across the diode."],
          ["0 V, because it's off", false, "Off means no current, not no voltage. Check KVL around the loop."],
          ["0.7 V", false, "0.7 V is for an on diode. This one is off."],
        ]},
      ]},
      { k: "play", title: "The state finder", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          const types = ["Si", "Ge", "GaAs", "Ideal"], R = 2000;
          let E = 6, rev = false, ty = 0;
          function draw() {
            const vk = VK[types[ty]], dir = rev ? -1 : 1, push = E * dir, on = push > vk;
            const I = on ? (push - vk) / R : 0, VD = on ? vk : push, VR = on ? push - vk : 0, cw = Math.sign(E);
            let s = loop({ rev, on, flip: E < 0, E: fmt(Math.abs(E), 3) + " V", R: "2 kΩ", dl: types[ty] });
            if (cw) s += cw > 0 ? S.arrow(140, 70, 200, 70, "") : S.arrow(200, 70, 140, 70, "");
            s += S.t(170, 108, on ? "ON" : "OFF", { cls: on ? "a big" : "m big" });
            f.innerHTML = S.svg(360, 200, s, { max: 360, label: "Series loop with a source, a diode and a 2 kilohm resistor" });
            ro.innerHTML = readout([["As a resistor, current would go", cw === 0 ? "nowhere" : cw > 0 ? "clockwise" : "anticlockwise"], ["Along the diode's arrow?", cw === 0 ? "—" : cw === dir ? "yes" : "no"], ["Push along the arrow", fmt(push, 3) + " V (needs more than " + vk + " V)"], ["V<sub>D</sub> (anode − cathode)", fmt(VD, 3) + " V"], ["V<sub>R</sub>", fmt(VR, 3) + " V"], ["I<sub>D</sub>", si(I, "A")]]);
            vd.className = "verdict " + (on ? "ok" : "mid");
            vd.textContent = on ? "On: the diode takes V_K, the resistor gets the rest." : cw === dir && E !== 0 ? "Right direction, but not enough push. Still off." : "Off: no current, so the whole source voltage sits across the diode.";
          }
          host.append(f, slider({ id: id + "-e", label: "Source E (negative = flipped)", min: -12, max: 12, step: 0.1, value: 6, show: (v) => fmt(v, 3) + " V" }, (v) => { E = v; draw(); }).el,
            toggle(["Diode → (clockwise)", "Diode ← (reversed)"], (k) => { rev = k === 1; draw(); }, 0), toggle(types, (k) => { ty = k; draw(); }, 0), vd, ro);
          draw();
        },
        `<p class="aside">The blue arrow is where current would go if the diode were a resistor. Try E = 0.5 V with Si, then with Ge.</p>`,
      ]},
      { k: "learn", title: "Off is not the same as zero volts", b: [
        `<div class="two"><div class="tile"><h3>Open circuit</h3><p>Current is always 0. The voltage across it can be <b>anything</b>.</p></div><div class="tile"><h3>Short circuit</h3><p>Voltage is always 0. The current is whatever the rest of the circuit allows.</p></div></div>`,
        `<div class="key">KVL holds no matter what: DC, AC, pulses. If the current is zero, the resistors drop nothing, so the off diode takes the leftover voltage.</div>`,
      ]},
      { k: "learn", title: "Diodes in series", b: [
        `<p>Each <b>on</b> diode in the loop takes its own V<sub>K</sub>. Add them up and subtract from the source.</p>`,
        fig(S.svg(380, 200, S.wire([80, 92], [80, 40], [110, 40]) + S.diode(110, 40, 170, 40, "") + S.wire([170, 40], [210, 40]) + ledH(210, 40, 270, "#2fbf5a", false) + S.wire([270, 40], [310, 40]) + S.res(310, 40, 310, 170, "470 Ω", { side: "right" }) + S.wire([310, 170], [80, 170], [80, 128]) + S.vsrc(80, 110, "9 V") + S.t(140, 22, "Si", { cls: "s" }) + S.t(240, 72, "green LED", { cls: "s" }),
          { max: 380, label: "A 9 volt source, a silicon diode, a green LED and a 470 ohm resistor in series" })),
        { t: "num", q: "The green LED needs 2.2 V. What current flows?", a: 12.98, unit: "mA", hint: "Both diodes are on. Subtract 0.7 V and 2.2 V from 9 V first.", why: "(9 − 0.7 − 2.2)/470 Ω = 6.1 V/470 Ω ≈ 13.0 mA." },
      ]},
      { k: "check", title: "One backwards", b: [
        { t: "mcq", q: "Two silicon diodes in series with a resistor and 15 V. One of them is backwards. What's the voltage across the forward one?", opts: [
          ["0 V", true, "The backwards one blocks, so no current flows anywhere in the loop. A real diode with zero current has zero voltage across it. All 15 V sits across the backwards diode."],
          ["0.7 V", false, "0.7 V needs current flowing. Is any current flowing in this loop?"],
          ["7.5 V: they share it", false, "They don't share. The off diode is the open circuit, so it takes it all."],
        ]},
      ]},
      { k: "learn", title: "Shorthand for supplies", b: [
        `<p>"+12 V" at a terminal means a 12 V source from that point down to ground. "−3 V" means the terminal is 3 V <b>below</b> ground.</p>`,
        fig(S.svg(300, 300, S.supply(150, 40, "+12 V") + S.res(150, 40, 150, 110, "R_1 = 3.3 kΩ", { side: "right" }) + S.diode(150, 110, 150, 170, "Si", { side: "left" }) + S.wire([150, 170], [150, 190]) + S.dot(150, 190) + S.wire([150, 190], [220, 190]) + `<circle class="el" cx="225" cy="190" r="5"/>` + S.t(240, 195, "V_o", { a: "start", cls: "a" }) + S.res(150, 190, 150, 260, "R_2 = 1.5 kΩ", { side: "right" }) + `<circle class="el" cx="150" cy="265" r="5"/>` + S.t(140, 288, "−3 V", { a: "end" }),
          { max: 300, label: "From +12 volts: R1, a silicon diode, the output node, R2, down to minus 3 volts" })),
        { t: "num", q: "What current flows down the chain?", a: 2.98, unit: "mA", hint: "Total drop from top to bottom is 12 − (−3) = 15 V. The diode takes 0.7 V.", why: "(15 − 0.7)/(3.3 kΩ + 1.5 kΩ) = 14.3/4.8 kΩ ≈ 2.98 mA." },
        { t: "num", q: "What's V_o?", a: 1.47, unit: "V", tol: 0.03, hint: "Start at the bottom, −3 V, and climb up across R_2 by I·R_2.", why: "−3 V + (2.98 mA)(1.5 kΩ) = −3 + 4.47 ≈ +1.47 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you decide whether a diode in a circuit is on?", model: "Imagine the diode replaced by a resistor and work out which way the current would flow. If it flows the same way as the diode's arrow and the voltage pushing it is more than the knee voltage (0.7 V for silicon), the diode is on and I replace it with a 0.7 V drop. Otherwise it's off: an open circuit with no current, though it may have a large voltage across it." },
      ]},
    ],
  };

  /* =============== PART 3: parallel and series–parallel =============== */
  function polarity(E, colA, si) {
    /* Branch A conducts for + on top, branch B for − on top. LEDs break down at 3 V reverse; a Si diode blocks ~50 V. */
    const LEDV = { green: 2.2, blue: 5.0, red: 1.8 }, R = 330;
    const fA = LEDV[colA] + (si ? 0.7 : 0), fB = LEDV.red + (si ? 0.7 : 0), brA = 3 + (si ? 50 : 0), brB = 3 + (si ? 50 : 0);
    const pos = E > 0, mag = Math.abs(E), fwd = pos ? fA : fB, br = pos ? brB : brA;
    if (mag <= Math.min(fwd, br)) return { V: mag, I: 0, lit: null, broke: null };
    if (fwd <= br) return { V: fwd, I: (mag - fwd) / R, lit: pos ? "A" : "B", broke: null };
    return { V: br, I: (mag - br) / R, lit: null, broke: pos ? "B" : "A" };
  }
  const p3 = {
    id: "p3", title: "Parallel and series–parallel circuits", mins: 25,
    blurb: "Parallel parts share one voltage. That decides which diode gets to turn on.",
    takeaway: "Parallel elements always have the same voltage. Identical diodes in parallel share the current, which lets two small diodes carry what would burn out one. When parallel diodes have different V_K, the lowest one turns on first and holds the voltage there, so the others never turn on. LEDs have low reverse breakdown (about 3 V): a series silicon diode protects them. For series–parallel circuits, mark each on diode with its V_K and use KVL and KCL as usual.",
    steps: [
      { k: "learn", title: "Same voltage, shared current", b: [
        fig(S.svg(400, 200, S.wire([80, 92], [80, 40], [120, 40]) + S.res(120, 40, 200, 40, "150 Ω") + S.wire([200, 40], [330, 40]) + S.diode(250, 40, 250, 170, "Si", { side: "left" }) + S.diode(330, 40, 330, 170, "Si", { side: "left" }) + S.wire([250, 170], [330, 170]) + S.wire([250, 170], [80, 170], [80, 128]) + S.vsrc(80, 110, "5 V") + S.dot(250, 40) + S.dot(250, 170) + S.t(360, 110, "V_o", { a: "start", cls: "a" }),
          { max: 400, label: "5 volts through 150 ohms into two silicon diodes in parallel" })),
        `<p>Both diodes are on, so V<sub>o</sub> = 0.7 V. If they're identical, they split the current evenly.</p>`,
        { t: "num", q: "How much current does each diode carry?", a: 14.33, unit: "mA", tol: 0.02, hint: "Find the total through the 150 Ω first: (5 − 0.7)/150.", why: "28.7 mA total, so 14.3 mA each. Two diodes rated 20 mA can handle a current that would destroy one." },
      ]},
      { k: "predict", title: "Who wins?", b: [
        { t: "mcq", q: "A silicon diode and a green LED (2.2 V) are in parallel, fed from 12 V through 1 kΩ. Which ones conduct?", opts: [
          ["Only the silicon diode. The LED stays dark", true, "As the supply rises, the Si diode turns on at 0.7 V and holds the voltage there. The LED never sees the 2.2 V it needs."],
          ["Both", false, "If both were on, the same two points would be at 0.7 V and 2.2 V at once. Parallel parts must share one voltage."],
          ["Only the LED, because 12 V is plenty", false, "12 V is across the resistor and the pair, not across the LED alone. Watch it happen in the next step."],
        ]},
      ]},
      { k: "play", title: "Turn the supply up slowly", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let E = 0.4, siIn = true;
          function draw() {
            const R = 1000, VL = 2.2;
            let V, Isi = 0, Iled = 0;
            if (siIn) { V = Math.min(E, 0.7); Isi = E > 0.7 ? (E - 0.7) / R : 0; } else { V = Math.min(E, VL); Iled = E > VL ? (E - VL) / R : 0; }
            let s = S.wire([80, 92], [80, 40], [120, 40]) + S.res(120, 40, 200, 40, "1 kΩ") + S.wire([200, 40], [320, 40]) + S.wire([250, 170], [320, 170]) + S.wire([250, 170], [80, 170], [80, 128]) + S.vsrc(80, 110, fmt(E, 3) + " V");
            s += siIn ? S.diode(250, 40, 250, 170, "", { cls: Isi > 0 ? "hl" : "" }) + S.t(232, 110, "Si", { a: "end" }) : S.wire([250, 40], [250, 70]) + S.wire([250, 140], [250, 170]) + S.t(232, 110, "removed", { a: "end", cls: "s m" });
            s += ledV(320, 40, 170, "#2fbf5a", Iled > 0, Iled > 0 ? "hl" : "") + S.t(356, 110, "green", { a: "start", cls: "s" });
            f.innerHTML = S.svg(420, 200, s, { max: 420, label: "A source through 1 kilohm into a silicon diode in parallel with a green LED" });
            ro.innerHTML = readout([["Voltage across both", fmt(V, 3) + " V"], ["Si diode current", si(Isi, "A")], ["LED current", si(Iled, "A")]]);
            vd.className = "verdict " + (Iled > 0 ? "ok" : Isi > 0 ? "mid" : "mid");
            vd.textContent = Iled > 0 ? "With the Si diode gone, the LED lights at 2.2 V." : Isi > 0 ? "The Si diode turned on at 0.7 V and pins the voltage there. The LED never reaches 2.2 V." : "Not enough voltage yet for anything to turn on.";
          }
          host.append(f, slider({ id: id + "-e", label: "Supply", min: 0, max: 12, step: 0.1, value: 0.4, show: (v) => fmt(v, 3) + " V" }, (v) => { E = v; draw(); }).el,
            toggle(["Si diode connected", "Si diode removed"], (k) => { siIn = k === 0; draw(); }, 0), vd, ro);
          draw();
        },
        `<p>Real supplies take a moment to rise. The first diode to reach its V<sub>K</sub> turns on and clamps the voltage. Its current just grows; its voltage stays put.</p>`,
      ]},
      { k: "play", title: "A polarity tester", b: [
        `<p>Two LEDs, back to back. + on top lights one colour, − on top lights the other. But LEDs only survive about <b>3 V in reverse</b>.</p>`,
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          const COL = { green: "#2fbf5a", blue: "#3b7bff", red: "#ff3b2f" };
          let neg = false, colA = "green", siOn = false;
          function draw() {
            const E = neg ? -9 : 9, r = polarity(E, colA, siOn);
            const litA = r.lit === "A", litB = r.lit === "B";
            let s = S.wire([80, 92], [80, 40], [110, 40]) + S.res(110, 40, 190, 40, "330 Ω") + S.wire([190, 40], [330, 40]) + S.wire([230, 170], [330, 170]) + S.wire([230, 170], [80, 170], [80, 128]) + S.vsrc(80, 110, "9 V", { flip: neg });
            if (siOn) {
              s += ledV(230, 40, 105, COL[colA], litA, litA ? "hl" : "") + S.diode(230, 105, 230, 170, "", { cls: litA ? "hl" : "" });
              s += S.diode(330, 170, 330, 105, "", { cls: litB ? "hl" : "" }) + ledV(330, 105, 40, COL.red, litB, litB ? "hl" : "");
              s += S.t(212, 142, "Si", { a: "end", cls: "s" }) + S.t(312, 142, "Si", { a: "end", cls: "s" });
            } else s += ledV(230, 40, 170, COL[colA], litA, litA ? "hl" : "") + ledV(330, 170, 40, COL.red, litB, litB ? "hl" : "");
            s += S.t(212, 75, colA, { a: "end", cls: "s" }) + S.t(312, 75, "red", { a: "end", cls: "s" });
            if (r.broke) s += S.t(r.broke === "A" ? 230 : 330, 196, "BREAKDOWN", { cls: "b s" });
            f.innerHTML = S.svg(420, 205, s, { max: 420, label: "Polarity tester: two LEDs back to back across a 9 volt source through 330 ohms" });
            const name = (x) => (x === "A" ? colA : "red");
            ro.innerHTML = readout([["Voltage across the pair", fmt(r.V, 3) + " V"], ["Lit", r.lit ? name(r.lit) : "nothing"], ["Current", si(r.I, "A")]]);
            vd.className = "verdict " + (r.broke ? "no" : "ok");
            vd.textContent = r.broke ? `The ${name(r.broke)} LED is reverse biased past 3 V, so it breaks down first and locks the voltage at 3 V. Nothing lights, and that LED may be damaged.` : `The ${name(r.lit)} LED is on. The other sees ${fmt(r.V, 2)} V in reverse${siOn ? ", but its Si diode blocks it" : ", under its 3 V limit"}.`;
          }
          host.append(f, toggle(["+ on top", "− on top"], (k) => { neg = k === 1; draw(); }, 0), toggle(["Green + red", "Blue + red"], (k) => { colA = k ? "blue" : "green"; draw(); }, 0), toggle(["LEDs alone", "Si diode in series with each"], (k) => { siOn = k === 1; draw(); }, 0), vd, ro);
          draw();
        },
        `<p class="aside">Blue needs about 5 V forward, more than red can stand in reverse. A Si diode in series with each LED takes the reverse voltage instead.</p>`,
      ]},
      { k: "check", title: "Series–parallel", b: [
        fig(S.svg(400, 250, S.wire([80, 102], [80, 40], [110, 40]) + S.diode(110, 40, 190, 40, "D_1 Si") + S.wire([190, 40], [320, 40]) + S.dot(240, 40) + S.res(240, 40, 240, 140, "R_1 = 2.2 kΩ", { side: "left" }) + S.diode(320, 40, 320, 140, "D_2 Si") + S.wire([240, 140], [320, 140]) + S.dot(280, 140) + S.res(280, 140, 280, 220, "R_2 = 4.7 kΩ", { side: "right" }) + S.wire([280, 220], [80, 220], [80, 138]) + S.vsrc(80, 120, "12 V"),
          { max: 400, label: "12 volts, diode D1 in series, then R1 in parallel with diode D2, then R2 back to the source" })),
        `<p>Both diodes are on. Mark 0.7 V on each, then use Ohm's law, KVL and KCL.</p>`,
        { t: "num", q: "Current I_1 through R_1?", a: 0.318, unit: "mA", tol: 0.02, hint: "R_1 is in parallel with D_2. What voltage does that give it?", why: "R_1 has D_2's 0.7 V across it: 0.7/2.2 kΩ ≈ 0.318 mA." },
        { t: "num", q: "Current I_2 through R_2?", a: 2.255, unit: "mA", tol: 0.02, hint: "Go round the outside loop: 12 V minus both diode drops is left for R_2.", why: "(12 − 0.7 − 0.7)/4.7 kΩ = 10.6/4.7 kΩ ≈ 2.26 mA." },
        { t: "num", q: "Current through D_2?", a: 1.94, unit: "mA", tol: 0.02, hint: "KCL at the bottom node: what comes in through R_1 and D_2 leaves through R_2.", why: "2.26 − 0.318 ≈ 1.94 mA." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "A silicon diode and an LED are in parallel. Why can't both be on?", model: "Parallel elements must have the same voltage. As the voltage rises, the silicon diode reaches 0.7 V first and turns on. From then on its current grows but its voltage stays near 0.7 V, so the LED, which needs about 2 V, never gets enough to turn on." },
      ]},
    ],
  };

  /* =============== PART 4: AND/OR gates =============== */
  /* Guess-and-check for a 2-input diode gate. mode "or": anodes at inputs, R to ground. mode "and": cathodes at inputs, R to +5 V. */
  function gateSolve(mode, vin, g) {
    const and = mode === "and", R = 1000, ons = [0, 1].filter((i) => g[i]);
    let Vo;
    if (!ons.length) Vo = and ? 5 : 0;
    else {
      const lv = ons.map((i) => vin[i] + (and ? 0.7 : -0.7));
      if (Math.abs(lv[0] - lv[lv.length - 1]) > 1e-9) return { ok: false, msg: `If D1 and D2 were both on, the output would have to be ${fmt(lv[0], 2)} V and ${fmt(lv[1], 2)} V at the same time. One of them must be off.` };
      Vo = lv[0];
      const I = and ? (5 - Vo) / R : Vo / R;
      if (I <= 0) return { ok: false, msg: `With D${ons[0] + 1} on, the output would be ${fmt(Vo, 2)} V. That needs current to flow backwards through D${ons[0] + 1}, and an on diode only carries forward current.` };
    }
    for (const j of [0, 1]) if (!g[j]) {
      const fwd = and ? Vo - vin[j] : vin[j] - Vo;
      if (fwd >= 0.7 - 1e-9) return { ok: false, msg: `D${j + 1} is guessed off, but it would have ${fmt(fwd, 2)} V forward across it. That's ${Math.abs(fwd - 0.7) < 1e-9 ? "exactly" : "more than"} 0.7 V, so it would conduct.` };
    }
    return { ok: true, Vo, msg: `Your guess holds up. V_o = ${fmt(Vo, 2)} V, a logic ${Vo > 2.5 ? "1" : "0"}.` };
  }
  function gateWidget(mode) {
    return (host) => {
      const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
      const and = mode === "and", vin = [5, 0], g = [false, false];
      function draw() {
        const r = gateSolve(mode, vin, g);
        let s = "";
        [70, 170].forEach((y, i) => {
          const cls = g[i] ? "hl" : "", d = and ? S.diode(170, y, 70, y, "", { cls }) : S.diode(70, y, 170, y, "", { cls });
          s += `<circle class="el" cx="40" cy="${y}" r="5"/>` + S.wire([45, y], [70, y]) + (g[i] ? d : off(d)) + S.wire([170, y], [220, y]) + S.t(36, y - 14, `${"AB"[i]} = ${vin[i]} V`, { a: "start", cls: "s" }) + S.t(120, y + 30, `D${i + 1} ${g[i] ? "on" : "off"}`, { cls: "s m" });
        });
        s += S.wire([220, 70], [220, 170]) + S.dot(220, 120) + S.wire([220, 120], [330, 120]) + S.dot(280, 120) + `<circle class="el" cx="335" cy="120" r="5"/>` + S.t(335, 106, "V_o", { cls: "a" });
        s += and ? S.res(280, 120, 280, 50, "1 kΩ", { side: "right" }) + S.supply(280, 50, "+5 V") : S.res(280, 120, 280, 200, "1 kΩ", { side: "right" }) + S.gnd(280, 200);
        f.innerHTML = S.svg(380, 228, s, { max: 380, label: `Diode ${mode.toUpperCase()} gate with inputs A and B` });
        ro.innerHTML = readout([["Your guess", `D1 ${g[0] ? "on" : "off"}, D2 ${g[1] ? "on" : "off"}`], ["V<sub>o</sub>", r.ok ? fmt(r.Vo, 3) + " V" : "— (fix the guess first)"]]);
        vd.className = "verdict " + (r.ok ? "ok" : "no");
        vd.textContent = r.ok ? r.msg : "Contradiction. " + r.msg;
      }
      host.append(f, toggle(["A = 0 V", "A = 5 V"], (k) => { vin[0] = k * 5; draw(); }, 1), toggle(["B = 0 V", "B = 5 V"], (k) => { vin[1] = k * 5; draw(); }, 0),
        toggle(["Guess D1 off", "Guess D1 on"], (k) => { g[0] = k === 1; draw(); }, 0), toggle(["Guess D2 off", "Guess D2 on"], (k) => { g[1] = k === 1; draw(); }, 0), vd, ro);
      draw();
    };
  }
  const p4 = {
    id: "p4", title: "AND and OR gates", mins: 20,
    blurb: "Logic from two diodes and a resistor. Guess the states, then check your guess.",
    takeaway: "Positive logic: high voltage = 1, 0 V = 0. A diode OR gate (anodes at the inputs, R to ground) gives about V_high − 0.7 V if any input is high. A diode AND gate (cathodes at the inputs, R to the supply) gives about 0.7 V if any input is low, and only goes high when every input is high. The method: guess every diode's state, solve, then look for a contradiction. An on diode must carry forward current; an off diode must have less than 0.7 V forward.",
    steps: [
      { k: "learn", title: "Logic levels", b: [
        `<p>In <b>positive logic</b>, a high voltage means <b>1</b> and 0 V means <b>0</b>. Here, 1 = 5 V. (The book uses 10 V. The idea is the same.)</p>`,
        `<div class="two"><div class="tile"><h3>OR</h3><p>Output is 1 if <b>any</b> input is 1.</p></div><div class="tile"><h3>AND</h3><p>Output is 1 only if <b>every</b> input is 1.</p></div></div>`,
        `<p>The output doesn't have to be exactly 5 V or 0 V. It just has to be close enough to count.</p>`,
      ]},
      { k: "learn", title: "Guess, then check", b: [
        seen("The method of assumed states: guess, solve, check.", "16-diodes.html#p4", "Chapter 16, Part 4"),
        `<ol><li>Look at the "pressure" from each source and guess each diode's state.</li><li>Put in the models: 0.7 V for on, open for off. Solve.</li><li>Check. An on diode must carry current <b>forward</b>. An off diode must have <b>less than 0.7 V</b> forward across it.</li><li>Contradiction? Change the guess and try again.</li></ol>`,
        `<p class="aside">The 0.7 V model helps here: a diode needs a real 0.7 V push before it switches on.</p>`,
      ]},
      { k: "play", title: "Crack the OR gate", b: [
        gateWidget("or"),
        `<p>Set the inputs, then guess. The checker tells you if your guess contradicts itself. Try all four input combinations.</p>`,
      ]},
      { k: "play", title: "Crack the AND gate", b: [
        gateWidget("and"),
        `<p>Now the diodes face the other way and the resistor goes up to +5 V. Same game.</p>`,
      ]},
      { k: "check", title: "Why it works", b: [
        { t: "mcq", q: "In the OR gate with both inputs at 5 V, why is the output 4.3 V and not 5 V?", opts: [
          ["Each on diode drops 0.7 V between its input and the output", true, "That's why diode logic loses a little each time. 4.3 V still counts as a 1."],
          ["The resistor drops 0.7 V", false, "The output is the voltage across the resistor. What sits between the input and the output?"],
          ["The two diodes share the 5 V", false, "Both diodes are in parallel between the inputs and the output, so they each have 0.7 V."],
        ]},
        { t: "mcq", q: "In the AND gate, why does the resistor go to +5 V instead of ground?", opts: [
          ["Something has to push current through the diodes into a low input", true, "When an input is low, current flows from +5 V, through R and the diode, into that input. That pulls the output down to 0.7 V. With R to ground, nothing could ever turn the diodes on."],
          ["To make the output higher", false, "It does let the output go high, but think about what makes it go low."],
          ["It doesn't matter", false, "Try it in your head: with R to ground and the diodes pointing into the inputs, which way could current flow?"],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you check a guess about which diodes are on?", model: "Put in the models for the guess, 0.7 V for on diodes and open circuits for off ones, and solve. Then check every diode. Each on diode must carry current in its forward direction, and each off diode must have less than 0.7 V forward across it. If anything breaks those rules, the guess was wrong, so change it and solve again." },
      ]},
    ],
  };

  /* =============== PART 5: half-wave rectifier =============== */
  const p5 = {
    id: "p5", title: "Half-wave rectification", mins: 20,
    blurb: "Chop off half a sine wave and you're left with DC.",
    takeaway: "A sine wave averages to zero. A half-wave rectifier keeps one half, so the output averages V_dc = 0.318·V_m (that's V_m/π). With a silicon diode the output is 0.7 V lower while conducting, so V_dc ≈ 0.318(V_m − V_K). When V_m ≫ V_K, ignore V_K. The diode must survive the full reverse peak: PIV ≥ V_m.",
    steps: [
      { k: "learn", title: "Zero average in, DC out", b: [
        seen("The half-wave rectifier, solved by assumed states.", "16-diodes.html#p4", "Chapter 16, Part 4"),
        fig(S.svg(360, 200, loop({ ac: 1, E: "v_i" }) + S.t(320, 66, "+", { cls: "big" }) + S.t(320, 160, "−", { cls: "big" }) + S.t(330, 114, "v_o", { a: "start", cls: "a" }), { max: 360, label: "Half-wave rectifier: AC source, diode, resistor" })),
        `<p>Over a full cycle, a sine wave spends as much area below the axis as above: its <b>average is zero</b>.</p>`,
        `<p>The diode lets only one half through. Now there's net area above the axis, so the output has an average: a <b>DC level</b>. A diode used this way is called a <b>rectifier</b>.</p>`,
      ]},
      { k: "predict", title: "Guess first", b: [
        { t: "mcq", q: "The output is a row of half-humps with flat gaps between them. Is its average more or less than half of V_m?", opts: [
          ["Less", true, "Each hump averages about 0.64 V_m on its own, and then the flat gap halves that again: about 0.32 V_m."],
          ["More", false, "The output is zero for half the time. That drags the average a long way down."],
          ["Exactly half", false, "A hump is thinner than a rectangle of the same height, and half the time there's nothing."],
        ]},
      ]},
      { k: "play", title: "Rectify it", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const types = ["Ideal", "Si"];
          let Vm = 10, ty = 0, rev = false;
          function draw() {
            const vk = VK[types[ty]];
            const vo = (t) => { const v = Vm * sinw(t); return rev ? (v < -vk ? v + vk : 0) : v > vk ? v - vk : 0; };
            const a = avg(vo), top = Vm * 1.35;
            f.innerHTML = wplot({ y: [-top, top], yt: [-Vm, 0, Vm], yl: "v (V)", areas: [{ f: vo, n: 600 }], series: [{ f: (t) => Vm * sinw(t), cls: "s5" }, { f: vo, cls: "s1", n: 600 }, { pts: [[0, a], [2, a]], cls: "s3" }], label: "Input sine (dashed), rectified output, and its average (green)" });
            ro.innerHTML = readout([["Average of v<sub>o</sub> (V<sub>dc</sub>)", fmt(a, 3) + " V"], ["0.318 V<sub>m</sub>", fmt((rev ? -1 : 1) * 0.318 * Vm, 3) + " V"], ["0.318 (V<sub>m</sub> − V<sub>K</sub>)", fmt((rev ? -1 : 1) * 0.318 * Math.max(0, Vm - vk), 3) + " V"], ["Diode must withstand (PIV)", fmt(Vm, 3) + " V"]]);
          }
          host.append(f, slider({ id: id + "-v", label: "Peak V<sub>m</sub>", min: 1, max: 40, step: 0.5, value: 10, show: (v) => fmt(v, 3) + " V" }, (v) => { Vm = v; draw(); }).el,
            toggle(["Ideal diode", "Silicon diode"], (k) => { ty = k; draw(); }, 0), toggle(["Diode forward", "Diode flipped"], (k) => { rev = k === 1; draw(); }, 0), ro);
          draw();
        },
        `<p class="aside">The green line is the average. The shaded humps have the same area as a rectangle up to that line. Try V<sub>m</sub> = 2 V with silicon: the 0.7 V matters a lot. At 40 V it barely shows.</p>`,
        `<p>Flip the diode and the negative half gets through instead: the same DC level, with a minus sign.</p>`,
      ]},
      { k: "math", title: "Where 0.318 comes from", b: [
        `<p>Average = area under the curve over one period ÷ the period T.</p>`,
        `<p>One hump of a sine wave has area V<sub>m</sub>·T/π. (That comes from calculus; you can take it as given.) It's the only area in the whole period, so:</p>`,
        `<div class="eq">V<sub>dc</sub> = (V<sub>m</sub>T/π) / T = V<sub>m</sub>/π = 0.318 V<sub>m</sub></div>`,
        `<p>With silicon, each hump is V<sub>K</sub> shorter, and a little narrower too. The book's approximation, good when V<sub>m</sub> ≫ V<sub>K</sub>:</p>`,
        `<div class="eq">V<sub>dc</sub> ≈ 0.318 (V<sub>m</sub> − V<sub>K</sub>)</div>`,
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "A silicon half-wave rectifier, V_m = 15 V. Roughly what DC level?", a: 4.55, unit: "V", tol: 0.02, hint: "0.318 × (15 − 0.7).", why: "0.318 × 14.3 ≈ 4.55 V." },
        { t: "mcq", q: "V_m = 150 V. Should you bother including V_K?", opts: [
          ["Not really. It changes V_dc by about 0.2 V, under 0.5%", true, "0.318 × 0.7 ≈ 0.22 V. Your resistors' tolerances are bigger than that."],
          ["Yes, always", false, "Work out how big the difference is: 0.318 × 0.7 V."],
        ]},
      ]},
      { k: "learn", title: "Peak inverse voltage", b: [
        fig(S.svg(360, 200, S.wire([80, 92], [80, 40], [130, 40]) + off(S.diode(130, 40, 210, 40, "")) + S.wire([210, 40], [280, 40]) + S.res(280, 40, 280, 170, "R", { side: "right" }) + S.wire([280, 170], [80, 170], [80, 128]) + S.vsrc(80, 110, "V_m", { flip: true }) + S.t(170, 22, "− V_m +", { cls: "s b" }) + S.t(240, 110, "I = 0", { cls: "s m" }) + S.t(330, 110, "0 V", { a: "start", cls: "s" }),
          { max: 360, label: "At the negative peak the diode is off and all of V_m is across it" })),
        `<p>At the negative peak the diode is off. No current, so the resistor drops 0 V. KVL puts all of V<sub>m</sub> across the diode, the wrong way round.</p>`,
        `<div class="eq">PIV rating ≥ V<sub>m</sub>    (half-wave)</div>`,
        `<p class="aside">PIV = peak inverse voltage, also called PRV (peak reverse voltage). Exceed it and the diode breaks down.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a half-wave rectifier's output have a DC level when its input doesn't?", model: "A sine wave has equal area above and below the axis, so its average is zero. The diode only conducts in one half, so the output keeps the area on one side and is zero the rest of the time. That leaves a net average, the DC level, of about 0.318 times the peak." },
      ]},
    ],
  };

  /* =============== PART 6: full-wave =============== */
  function bridgeFig(on, sgn) {
    const T = [200, 30], B = [200, 190], L = [120, 110], Rr = [280, 110];
    const d = (a, b, k) => (on.includes(k) ? dAt(a[0], a[1], b[0], b[1], "hl") : off(dAt(a[0], a[1], b[0], b[1])));
    let s = d(T, Rr, 1) + d(B, Rr, 2) + d(L, T, 3) + d(L, B, 4);
    s += S.wire([200, 30], [200, 92]) + S.wire([200, 128], [200, 190]) + ac(200, 110, "v_i");
    if (sgn) s += S.t(214, 86, sgn > 0 ? "+" : "−", { a: "start", cls: "big" }) + S.t(214, 146, sgn > 0 ? "−" : "+", { a: "start", cls: "big" });
    s += S.wire([280, 110], [350, 110]) + S.res(350, 110, 350, 215, "R", { side: "right" }) + S.wire([350, 215], [60, 215], [60, 110], [120, 110]);
    [T, B, L, Rr].forEach((p) => (s += S.dot(p[0], p[1])));
    s += S.t(252, 60, "D1", { a: "start", cls: "s" }) + S.t(252, 172, "D2", { a: "start", cls: "s" }) + S.t(148, 60, "D3", { a: "end", cls: "s" }) + S.t(148, 172, "D4", { a: "end", cls: "s" });
    s += S.t(334, 128, "+", { cls: "s" }) + S.t(334, 206, "−", { cls: "s" }) + S.t(330, 170, "v_o", { a: "end", cls: "a" });
    if (on.length) s += S.arrow(372, 135, 372, 190, "");
    return S.svg(420, 230, s, { max: 420, label: "Bridge rectifier: four diodes in a diamond, AC source inside, load resistor outside" });
  }
  function ctFig(on, sgn) {
    let s = ac(40, 110, "") + S.wire([40, 92], [40, 60], [100, 60]) + S.wire([40, 128], [40, 160], [100, 160]) + S.ind(100, 60, 100, 160, "");
    s += `<line class="w" x1="114" y1="40" x2="114" y2="180"/><line class="w" x1="119" y1="40" x2="119" y2="180"/>`;
    s += S.ind(134, 30, 134, 110, "") + S.ind(134, 110, 134, 190, "");
    const d1 = S.diode(180, 30, 260, 30, "", { cls: on.includes(1) ? "hl" : "" }), d2 = S.diode(180, 190, 260, 190, "", { cls: on.includes(2) ? "hl" : "" });
    s += S.wire([134, 30], [180, 30]) + (on.includes(1) ? d1 : off(d1)) + S.wire([260, 30], [300, 30], [300, 190], [260, 190]) + S.wire([134, 190], [180, 190]) + (on.includes(2) ? d2 : off(d2));
    s += S.wire([134, 110], [170, 110]) + S.res(170, 110, 290, 110, "R") + S.wire([290, 110], [300, 110]) + S.dot(300, 110) + S.dot(134, 110);
    s += S.t(220, 14, "D1", { cls: "s" }) + S.t(220, 216, "D2", { cls: "s" }) + S.t(150, 134, "CT", { a: "start", cls: "s m" }) + S.t(230, 140, "− v_o +", { cls: "a s" });
    if (sgn) s += S.t(148, 52, sgn > 0 ? "+" : "−", { a: "start", cls: "big" }) + S.t(148, 182, sgn > 0 ? "−" : "+", { a: "start", cls: "big" });
    if (on.length) s += S.arrow(270, 152, 190, 152, "");
    return S.svg(340, 225, s, { max: 340, label: "Centre-tapped transformer rectifier: two diodes, load from their joined cathodes to the centre tap" });
  }
  const p6 = {
    id: "p6", title: "Full-wave rectification", mins: 25,
    blurb: "Steer both halves the same way through the load and the DC level doubles.",
    takeaway: "A full-wave rectifier sends both halves of the sine the same way through the load: V_dc = 0.636·V_m, twice the half-wave value. Bridge (4 diodes): two diodes conduct at a time, so with silicon V_o(max) = V_m − 2V_K and V_dc ≈ 0.636(V_m − 2V_K); PIV ≥ V_m. Centre-tapped transformer (2 diodes): one diode at a time, but each off diode sees its half-winding plus the load, so PIV ≥ 2V_m.",
    steps: [
      { k: "learn", title: "Use both halves", b: [
        `<p>A half-wave rectifier throws half the input away. The <b>bridge</b> uses four diodes to steer <b>both</b> halves the same way through R.</p>`,
        `<p>Twice the area above the axis, so twice the DC:</p>`,
        `<div class="eq">V<sub>dc</sub> = 2 × 0.318 V<sub>m</sub> = 0.636 V<sub>m</sub></div>`,
      ]},
      { k: "play", title: "Step through a cycle", b: [
        (host, id) => {
          const sch = el(`<div class="fig"></div>`), f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const Vm = 10;
          let t = 0.25, topo = 0, ty = 0;
          function draw() {
            const vk = ty ? 0.7 : 0, drop = topo === 0 ? 2 * vk : vk, vi = Vm * sinw(t), go = Math.abs(vi) > drop;
            const vo = (tt) => Math.max(0, Math.abs(Vm * sinw(tt)) - drop);
            const on = !go ? [] : topo === 0 ? (vi > 0 ? [1, 4] : [2, 3]) : vi > 0 ? [1] : [2];
            sch.innerHTML = topo === 0 ? bridgeFig(on, Math.sign(vi)) : ctFig(on, Math.sign(vi));
            f.innerHTML = wplot({ y: [-12, 14], yt: [-10, 0, 10], yl: "v (V)", series: [{ f: (tt) => Vm * sinw(tt), cls: "s5" }, { f: vo, cls: "s1", n: 600 }], marks: [{ x: t, y: vi, cls: "mk2" }, { x: t, y: vo(t) }], label: "Input (dashed) and full-wave output, with the current moment marked" });
            ro.innerHTML = readout([["v<sub>i</sub> now", fmt(vi, 3) + " V"], ["Conducting", on.length ? on.map((k) => "D" + k).join(" and ") : "none"], ["v<sub>o</sub> now", fmt(vo(t), 3) + " V"], ["V<sub>dc</sub> (average)", fmt(avg(vo), 3) + " V"], ["PIV per diode", topo === 0 ? "≥ V_m = 10 V" : "≥ 2V_m = 20 V"]]);
          }
          host.append(sch, f, slider({ id: id + "-t", label: "Moment in the cycle", min: 0, max: 2, step: 0.01, value: 0.25, show: (v) => fmt(v, 3) + " T" }, (v) => { t = v; draw(); }).el,
            toggle(["Bridge", "Centre-tapped transformer"], (k) => { topo = k; draw(); }, 0), toggle(["Ideal diodes", "Silicon diodes"], (k) => { ty = k; draw(); }, 0), ro);
          draw();
        },
        `<p>Watch the arrow on the load: it points the <b>same way</b> in both halves. For the centre-tapped version, each half of the secondary gives a peak of V<sub>m</sub>.</p>`,
      ]},
      { k: "check", title: "Which pair?", b: [
        { t: "sort", q: "In the bridge, which diodes conduct in each half?", bins: ["Top of v_i positive", "Top of v_i negative"], items: [
          ["D1", 0, "Current leaves the top of the source, goes through D1 to the + end of R."],
          ["D2", 1, "Now the bottom is positive: current goes up through D2 to the + end of R."],
          ["D3", 1, "Returning from the − end of R, current can only get back to the (now negative) top through D3."],
          ["D4", 0, "Current returns from R through D4 to the bottom of the source."],
        ]},
      ]},
      { k: "learn", title: "Two diodes in the path", b: [
        `<p>In the bridge, current always goes through <b>two</b> diodes. With silicon, each takes 0.7 V:</p>`,
        `<div class="eq">V<sub>o max</sub> = V<sub>m</sub> − 2V<sub>K</sub>     V<sub>dc</sub> ≈ 0.636 (V<sub>m</sub> − 2V<sub>K</sub>)</div>`,
        `<p class="aside">The centre-tapped version only has one diode in the path: V<sub>m</sub> − V<sub>K</sub>.</p>`,
        { t: "num", q: "A silicon bridge with V_m = 12 V. Roughly what DC level?", a: 6.74, unit: "V", tol: 0.02, hint: "Take off two diode drops before multiplying by 0.636.", why: "0.636 × (12 − 1.4) = 0.636 × 10.6 ≈ 6.74 V." },
      ]},
      { k: "learn", title: "PIV: why the centre tap costs more", b: [
        `<div class="two"><div class="tile"><h3>Bridge</h3><p>At the peak, an off diode sits right across the load: PIV ≥ V<sub>m</sub>.</p></div><div class="tile"><h3>Centre tap</h3><p>Go round the loop through the off diode: its half of the secondary (V<sub>m</sub>) <b>plus</b> the load (V<sub>m</sub>). PIV ≥ 2V<sub>m</sub>.</p></div></div>`,
        { t: "mcq", q: "A centre-tapped rectifier: each half of the secondary peaks at 20 V. What PIV should each diode have?", opts: [
          ["At least 40 V", true, "The off diode sees its own half-winding (20 V) plus the load voltage (20 V)."],
          ["At least 20 V", false, "That's the bridge rule. Here, add the load's voltage to the half-winding's when you go round the loop."],
          ["At least 10 V", false, "Each diode has to block more than the load voltage, not less."],
        ]},
      ]},
      { k: "whatif", title: "What if a diode fails?", b: [
        { t: "mcq", q: "In the bridge, D1 burns out and goes open. What does the output look like now?", opts: [
          ["Half-wave: only one half still has a complete path", true, "With D1 open, the D1–D4 path is broken. The D2–D3 path still works, so you get one hump per cycle and half the DC."],
          ["Nothing at all", false, "Three diodes still work. Is there still one complete path for one of the halves?"],
          ["Exactly the same", false, "Each half needs its own pair of diodes. One pair is now broken."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a bridge rectifier make both halves of the sine push current the same way through the load?", model: "The four diodes act like steering switches. In one half, one pair conducts and routes the current through the load from its + end to its − end. In the other half, the other pair conducts, and the current still enters the load at the same end. So the load sees a positive hump in each half, and the DC level doubles to 0.636 V_m." },
      ]},
    ],
  };

  /* =============== PART 7: clippers =============== */
  /* cfg 0 = series (battery, diode, output across R). cfg 1 = parallel (R in series, diode + battery across the output). */
  function clipOut(cfg, rev, Vb, vk) {
    return (v) => {
      if (cfg === 0) { const d = v - Vb; return !rev ? (d > vk ? d - vk : 0) : d < -vk ? d + vk : 0; }
      return !rev ? Math.min(v, Vb + vk) : Math.max(v, Vb - vk);
    };
  }
  function clipFig(cfg, rev, Vb, on) {
    const cls = on ? "hl" : "", lab = fmt(Math.abs(Vb), 3) + " V";
    let s;
    if (cfg === 0) {
      s = S.wire([80, 92], [80, 40], [124, 40]) + batH(140, 40, Vb, lab) + S.wire([156, 40], [180, 40]) + (rev ? S.diode(250, 40, 180, 40, "", { cls }) : S.diode(180, 40, 250, 40, "", { cls })) + S.wire([250, 40], [300, 40]) + S.res(300, 40, 300, 180, "R", { side: "left" }) + S.wire([300, 180], [80, 180], [80, 128]);
      s += S.t(330, 66, "+", { cls: "big" }) + S.t(330, 172, "−", { cls: "big" }) + S.t(340, 120, "v_o", { a: "start", cls: "a" }) + S.wire([300, 40], [320, 40]) + S.wire([300, 180], [320, 180]);
    } else {
      s = S.wire([80, 92], [80, 40], [110, 40]) + S.res(110, 40, 190, 40, "R") + S.wire([190, 40], [320, 40]) + S.dot(240, 40) + (rev ? S.diode(240, 110, 240, 40, "", { cls }) : S.diode(240, 40, 240, 110, "", { cls })) + S.wire([240, 110], [240, 120]) + S.vsrc(240, 138, lab, { flip: Vb < 0, side: "right" }) + S.wire([240, 156], [240, 180]) + S.dot(240, 180) + S.wire([320, 180], [80, 180], [80, 128]);
      s += S.t(340, 66, "+", { cls: "big" }) + S.t(340, 172, "−", { cls: "big" }) + S.t(350, 120, "v_o", { a: "start", cls: "a" });
    }
    s += ac(80, 110, "v_i");
    return S.svg(400, 200, s, { max: 400, label: cfg === 0 ? "Series clipper: source, battery, diode, resistor" : "Parallel clipper: resistor in series, diode and battery across the output" });
  }
  const p7 = {
    id: "p7", title: "Clippers", mins: 25,
    blurb: "Use a diode, and maybe a battery, to slice off part of a waveform.",
    takeaway: "A clipper removes part of a waveform without changing the rest. Series: the diode is in line with the load. Parallel: the diode is across the output. Method: (1) see where v_o is defined; (2) note which way each source pushes; (3) find the transition voltage, where the diode has V_K across it and zero current; (4) sketch v_o under v_i, on the same scales, using the on and off circuits. A square wave is easiest: just two DC cases.",
    steps: [
      { k: "learn", title: "Slice off part of a wave", b: [
        `<p>A <b>clipper</b> cuts away part of a signal and leaves the rest undistorted. The half-wave rectifier is the simplest one: a diode and a resistor.</p>`,
        `<div class="two"><div class="tile"><h3>Series</h3><p>The diode is in line with the load. Output only when the diode conducts.</p></div><div class="tile"><h3>Parallel</h3><p>The diode is in a branch across the output. When it conducts, it pins the output.</p></div></div>`,
        `<p>Add a battery and you choose <b>where</b> the cut happens.</p>`,
      ]},
      { k: "learn", title: "A four-step method", b: [
        `<ol><li><b>Where is v<sub>o</sub>?</b> Across R? Across the diode plus battery? Check first.</li><li><b>Which way does each source push?</b> Does the battery help the input turn the diode on, or fight it?</li><li><b>Find the transition voltage</b>: the input v<sub>i</sub> at which the diode has exactly V<sub>K</sub> across it (0 V if ideal) and zero current.</li><li><b>Sketch v<sub>o</sub> directly under v<sub>i</sub></b>, same scales. Use the "on" circuit on one side of the transition and the "off" circuit on the other.</li></ol>`,
      ]},
      { k: "predict", title: "Guess first", b: [
        fig(clipFig(0, false, 4, false)),
        { t: "mcq", q: "Ideal diode, 4 V battery fighting the input, input a 10 V peak sine. When does current flow?", opts: [
          ["Only while v_i is above 4 V", true, "The input has to beat the battery before the diode sees any forward voltage. Then v_o = v_i − 4 V, so the output peaks at 6 V."],
          ["During the whole positive half", false, "The battery opposes the input. Between 0 and 4 V, the input loses that fight."],
          ["Only while v_i is below −4 V", false, "Negative input pushes against the diode's arrow. It stays off there."],
        ]},
      ]},
      { k: "play", title: "The clipper lab", b: [
        (host, id) => {
          const sch = el(`<div class="fig"></div>`), f1 = el(`<div class="fig"></div>`), f2 = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let cfg = 0, rev = false, Vb = 4, ty = 0, sq = false;
          function draw() {
            const vk = ty ? 0.7 : 0, out = clipOut(cfg, rev, Vb, vk), vi = (t) => (sq ? (frac(t) < 0.5 ? 10 : -10) : 10 * sinw(t)), vo = (t) => out(vi(t));
            const tr = Vb + (rev ? -vk : vk);
            sch.innerHTML = clipFig(cfg, rev, Vb, false);
            const yt = [-15, -10, -5, 0, 5, 10, 15];
            f1.innerHTML = wplot({ y: [-17, 17], yt, yl: "v_i (V)", series: [{ f: vi, cls: "s5", n: 600 }, { pts: [[0, tr], [2, tr]], cls: "s4" }], label: "Input with the transition level marked (red dashed)" });
            f2.innerHTML = wplot({ y: [-17, 17], yt, yl: "v_o (V)", series: [{ f: vo, cls: "s1", n: 600 }], label: "Output, on the same scales" });
            let mx = -1e9, mn = 1e9;
            for (let i = 0; i <= 400; i++) { const v = vo(i / 200); mx = Math.max(mx, v); mn = Math.min(mn, v); }
            const onWhen = cfg === 0 ? (rev ? "v_i < " : "v_i > ") : rev ? "v_i < " : "v_i > ";
            ro.innerHTML = readout([["Transition at", "v<sub>i</sub> = " + fmt(tr, 3) + " V"], ["Diode on when", onWhen + fmt(tr, 3) + " V"], ["v<sub>o</sub> max", fmt(mx, 3) + " V"], ["v<sub>o</sub> min", fmt(mn, 3) + " V"]]);
          }
          host.append(sch, f1, f2, toggle(["Series", "Parallel"], (k) => { cfg = k; draw(); }, 0), toggle(["Diode one way", "Diode flipped"], (k) => { rev = k === 1; draw(); }, 0),
            slider({ id: id + "-b", label: "Battery (negative = flipped)", min: -8, max: 8, step: 0.5, value: 4, show: (v) => fmt(v, 3) + " V" }, (v) => { Vb = v; draw(); }).el,
            toggle(["Ideal diode", "Silicon diode"], (k) => { ty = k; draw(); }, 0), toggle(["Sine, 10 V peak", "Square, ±10 V"], (k) => { sq = k === 1; draw(); }, 0), ro);
          draw();
        },
        `<p class="aside">Red dashed line: the transition level. Find it before you look at the output. With silicon, it shifts by 0.7 V.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        fig(clipFig(0, false, -2, false)),
        `<p>Series clipper, ideal diode. This time the 2 V battery <b>helps</b> the input. Input: 8 V peak sine.</p>`,
        { t: "num", q: "What's the output's peak?", a: 10, unit: "V", hint: "When the diode is on, v_o = v_i plus the battery.", why: "8 + 2 = 10 V. The battery adds to the input while the diode conducts." },
        { t: "num", q: "Below what input voltage does the diode turn off?", a: -2, unit: "V", tol: 0.001, hint: "Transition: the diode has 0 V across it. What v_i makes v_i + 2 = 0?", why: "v_i = −2 V. Below that, the output is 0. So most of the negative half still gets through, shifted up by 2 V." },
      ]},
      { k: "learn", title: "Two-sided and square waves", b: [
        `<p>Put two parallel branches across the output, one diode each way, each with its own battery. One branch clips the top, the other clips the bottom.</p>`,
        { t: "mcq", q: "Two parallel branches: a diode pointing down with a 3 V battery, and one pointing up with a −5 V battery (ideal diodes). A 10 V peak sine goes in. What comes out?", opts: [
          ["The sine, flattened at +3 V on top and −5 V on the bottom", true, "Each branch only conducts past its own level. In between, both are off and v_o = v_i."],
          ["A flat line at 3 V", false, "The branches only conduct beyond their levels. Between −5 V and +3 V, nothing is clipped."],
          ["The sine, unchanged", false, "A 10 V peak goes well past both levels."],
        ]},
        `<p class="aside">Square waves are the easy case: only two input levels, so it's just two DC problems. A series clipper with a helping battery also <b>shifts</b> the whole signal up.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is a clipper's transition voltage, and how do you find it?", model: "It's the input voltage at which the diode switches between on and off. At that instant the diode has exactly V_K across it (0 V for an ideal diode) and still zero current, so the resistor drops nothing. Put those conditions in, use KVL, and solve for v_i. On one side of it, use the on circuit; on the other, the off circuit." },
      ]},
    ],
  };

  /* =============== PART 8: clampers =============== */
  /* rev false: diode points down (anode at output) and clamps the top at Vb + VK. rev true: clamps the bottom at Vb − VK. */
  function clampSim(vi, rev, Vb, vk, rcT) {
    const N = 400, cycles = 25, dt = 1 / N, lvl = rev ? Vb - vk : Vb + vk;
    let vC = 0;
    const out = [];
    for (let k = 0; k < cycles * N; k++) {
      const t = k * dt, v = vi(t);
      let vo = v - vC;
      if ((!rev && vo > lvl) || (rev && vo < lvl)) { vo = lvl; vC = v - vo; }
      else vC += (vo / rcT) * dt;
      if (k >= (cycles - 2) * N) out.push([t - (cycles - 2), vo]);
    }
    return out;
  }
  function clampFig(rev, Vb, o = {}) {
    const lab = fmt(Math.abs(Vb), 3) + " V";
    let s = S.wire([80, 92], [80, 40], [120, 40]) + S.cap(120, 40, 180, 40, "C") + S.wire([180, 40], [350, 40]) + S.dot(230, 40) + S.dot(300, 40);
    s += (rev ? S.diode(230, 105, 230, 40, "") : S.diode(230, 40, 230, 105, "")) + S.wire([230, 105], [230, 117]) + (Vb === 0 && o.noBat ? S.wire([230, 117], [230, 180]) : S.vsrc(230, 135, lab, { flip: Vb < 0, side: "left" }) + S.wire([230, 153], [230, 180]));
    s += S.res(300, 40, 300, 180, "R", { side: "right" }) + S.wire([350, 180], [80, 180], [80, 128]) + S.dot(230, 180) + S.dot(300, 180);
    s += S.t(362, 66, "+", { cls: "big" }) + S.t(362, 172, "−", { cls: "big" }) + S.t(372, 120, "v_o", { a: "start", cls: "a" }) + ac(80, 110, "v_i");
    return S.svg(410, 200, s, { max: 410, label: "Clamper: capacitor in series, diode with battery and resistor across the output" });
  }
  const p8 = {
    id: "p8", title: "Clampers", mins: 25,
    blurb: "A capacitor and a diode that slide a whole waveform up or down without changing its shape.",
    takeaway: "A clamper is a series capacitor plus a diode (and maybe a battery) and a resistor across the output. It shifts the waveform's DC level but keeps its shape and its peak-to-peak swing. Method: start with the half that turns the diode on; the capacitor charges instantly then; it holds its voltage while the diode is off (needs 5RC ≫ T/2); watch v_o's polarity; and check that output swing = input swing.",
    steps: [
      { k: "learn", title: "Shift, don't chop", b: [
        seen("The clamp, or DC restorer: a capacitor that charges to the input's lowest point.", "16-diodes.html#p6", "Chapter 16, Part 6"),
        fig(clampFig(false, 0, { noBat: true })),
        `<p>A <b>clamper</b> has a capacitor straight from input to output, and a diode and resistor across the output. It moves the waveform up or down. The shape stays the same.</p>`,
        `<p>It needs the time constant RC to be big: the capacitor must barely discharge while the diode is off. The book counts a capacitor as fully charged or discharged after <b>5 time constants</b>.</p>`,
      ]},
      { k: "learn", title: "A five-step method", b: [
        `<ol><li>Start with the part of the input that turns the diode <b>on</b>.</li><li>While it's on, the capacitor charges <b>instantly</b> to whatever the surrounding loop sets. (The diode shorts out R, so the time constant is tiny.)</li><li>While it's off, the capacitor <b>holds</b> its voltage.</li><li>Keep track of where v<sub>o</sub> is defined, and its polarity.</li><li><b>Check</b>: output peak-to-peak = input peak-to-peak. Always true for a clamper.</li></ol>`,
      ]},
      { k: "predict", title: "Guess first", b: [
        { t: "mcq", q: "Square wave ±10 V into the circuit above (ideal diode pointing down, no battery). What's the output?", opts: [
          ["A square wave from 0 V down to −20 V", true, "On the +10 V half the diode conducts and charges C to 10 V, so v_o = 0. On the −10 V half the diode is off: v_o = −10 − 10 = −20 V. Swing: 20 V, same as the input."],
          ["A square wave from −10 V to +10 V", false, "That's the input. The capacitor's stored 10 V shifts everything."],
          ["0 V all the time", false, "The diode only conducts in one half. In the other, the input and the capacitor's voltage add up."],
        ]},
      ]},
      { k: "play", title: "The clamper lab", b: [
        (host, id) => {
          const sch = el(`<div class="fig"></div>`), f1 = el(`<div class="fig"></div>`), f2 = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let hi = 10, lo = -10, Vb = 0, rev = false, ty = 0, sq = true, rcT = 20;
          function draw() {
            const vk = ty ? 0.7 : 0, mid = (hi + lo) / 2, amp = (hi - lo) / 2;
            const vi = (t) => (sq ? (frac(t) < 0.5 ? hi : lo) : mid + amp * sinw(t));
            const pts = clampSim(vi, rev, Vb, vk, rcT);
            let mx = -1e9, mn = 1e9;
            pts.slice(pts.length / 2).forEach(([, v]) => { mx = Math.max(mx, v); mn = Math.min(mn, v); });
            sch.innerHTML = clampFig(rev, Vb);
            const ylo = Math.min(lo, mn) - 3, yhi = Math.max(hi, mx) + 7, yt = ticks(ylo, Math.max(hi, mx) + 3);
            f1.innerHTML = wplot({ y: [ylo, yhi], yt, yl: "v_i (V)", series: [{ f: vi, cls: "s5", n: 600 }], label: "Input" });
            f2.innerHTML = wplot({ y: [ylo, yhi], yt, yl: "v_o (V)", series: [{ pts, cls: "s1" }, { pts: [[0, 0], [2, 0]], cls: "s5" }], label: "Clamped output, same scales" });
            const sw = mx - mn, insw = hi - lo, ok = Math.abs(sw - insw) < 0.03 * Math.max(1, insw);
            ro.innerHTML = readout([["Input swing", fmt(insw, 3) + " V"], ["Output swing", fmt(sw, 3) + " V"], ["Output top / bottom", fmt(mx, 3) + " V / " + fmt(mn, 3) + " V"], ["5RC compared with T/2", fmt(5 * rcT, 3) + " T vs 0.5 T"]]);
            vd.className = "verdict " + (ok ? "ok" : "no");
            vd.textContent = ok ? "Swings match: a clean shift." : "The capacitor discharges while the diode is off, so the output droops and the swing no longer matches. Make RC bigger.";
          }
          host.append(sch, f1, f2, toggle(["Diode points down", "Diode points up"], (k) => { rev = k === 1; draw(); }, 0),
            slider({ id: id + "-b", label: "Battery (negative = flipped)", min: -8, max: 8, step: 0.5, value: 0, show: (v) => fmt(v, 3) + " V" }, (v) => { Vb = v; draw(); }).el,
            slider({ id: id + "-h", label: "Input top", min: 0, max: 15, step: 0.5, value: 10, show: (v) => fmt(v, 3) + " V" }, (v) => { hi = v; draw(); }).el,
            slider({ id: id + "-l", label: "Input bottom", min: -15, max: 0, step: 0.5, value: -10, show: (v) => fmt(v, 3) + " V" }, (v) => { lo = v; draw(); }).el,
            slider({ id: id + "-rc", label: "Time constant RC", min: 0.05, max: 50, log: true, value: 20, show: (v) => fmt(v, 2) + " × T" }, (v) => { rcT = v; draw(); }).el,
            toggle(["Ideal diode", "Silicon diode"], (k) => { ty = k; draw(); }, 0), toggle(["Square wave", "Sine wave"], (k) => { sq = k === 0; draw(); }, 0), vd, ro);
          draw();
        },
        `<p class="aside">Diode pointing down pins the <b>top</b> of the output at the battery (+0.7 V for silicon). Pointing up pins the <b>bottom</b>. Try a sine: it gets shifted the same way. A square wave with the same peaks makes an outline for it.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        fig(clampFig(true, 2)),
        `<p>Ideal diode pointing up, 2 V battery (+ on top). The input is a square wave between +8 V and −4 V. RC is large.</p>`,
        { t: "num", q: "What's the lowest output voltage?", a: 2, unit: "V", tol: 0.001, hint: "When the diode conducts, the output is pinned to the battery.", why: "The diode conducts on the −4 V half and pins v_o at +2 V." },
        { t: "num", q: "And the highest?", a: 14, unit: "V", hint: "The swing must match: 8 − (−4) = 12 V.", why: "2 + 12 = 14 V. Step 5's swing check gets you there without any more circuit work." },
      ]},
      { k: "whatif", title: "What if RC is too small?", b: [
        { t: "mcq", q: "You pick R and C so that 5RC is shorter than half the period. What happens?", opts: [
          ["The capacitor drains while the diode is off, and the output no longer keeps the input's shape", true, "Try RC = 0.1 T in the lab: the flat tops sag toward zero. The clamper only works when 5RC ≫ T/2."],
          ["The shift just gets smaller, but the shape stays", false, "Look at the lab with a small RC: the flat parts of the square wave turn into curves."],
          ["Nothing changes", false, "The capacitor has to hold its charge for the whole off half. Can it, if it discharges in less time than that?"],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a clamper keep the input's peak-to-peak swing?", model: "Once the capacitor has charged, it holds a nearly constant voltage because RC is long compared with the period. The output is just the input minus that constant capacitor voltage. Subtracting a constant shifts the waveform up or down but can't change its shape or the distance between its top and bottom." },
      ]},
    ],
  };

  /* =============== PART 9: DC plus AC =============== */
  const p9 = {
    id: "p9", title: "A DC source and an AC source together", mins: 20,
    blurb: "Solve the DC, then the AC, then add. The diode matters for one and hardly at all for the other.",
    takeaway: "Use superposition. DC alone (AC source shorted): the 0.7 V model gives I_DQ. AC alone (DC source shorted): replace the diode with r_d = 26 mV/I_DQ and solve the divider. Add the two. A diode that stays on takes about 0.7 V off the DC level but barely touches the AC swing, because r_d is tiny next to the load. This only works if the diode stays on for the whole cycle.",
    steps: [
      { k: "learn", title: "One at a time", b: [
        seen("Small-signal analysis: a big DC value plus a small wiggle, where the device acts like a resistor for the wiggle.", "04-nonlinear-circuits.html#p7", "Chapter 4, Part 7"),
        fig(S.svg(360, 220, ac(80, 80, "v_s") + S.wire([80, 98], [80, 132]) + S.vsrc(80, 150, "E") + S.wire([80, 62], [80, 40], [130, 40]) + S.diode(130, 40, 210, 40, "Si") + S.wire([210, 40], [280, 40]) + S.res(280, 40, 280, 190, "R", { side: "right" }) + S.wire([280, 190], [80, 190], [80, 168]),
          { max: 360, label: "An AC source and a DC source in series with a diode and a resistor" })),
        `<ol><li><b>DC alone:</b> short the AC source. Use the 0.7 V model to find I<sub>DQ</sub>.</li><li><b>AC alone:</b> short the DC source. The diode becomes r<sub>d</sub> = 26 mV / I<sub>DQ</sub>.</li><li><b>Add</b> the two answers.</li></ol>`,
        ch1("r_d is the AC resistance from", "p6", "Part 6"),
      ]},
      { k: "play", title: "Add the wiggle", b: [
        (host, id) => {
          const f1 = el(`<div class="fig"></div>`), f2 = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          const R = 1000;
          let E = 5, vs = 1;
          function draw() {
            const ID = Math.max(1e-9, (E - 0.7) / R), rd = 0.026 / ID, k = R / (R + rd);
            const on = (t) => E + vs * sinw(t) > 0.7;
            const vR = (t) => (on(t) ? E - 0.7 + vs * sinw(t) * k : 0), vD = (t) => (on(t) ? 0.7 + vs * sinw(t) * (1 - k) : E + vs * sinw(t));
            const top = E + vs + 0.5;
            f1.innerHTML = wplot({ y: [0, top], yt: ticks(0, top), yl: "v_R (V)", series: [{ pts: [[0, E - 0.7], [2, E - 0.7]], cls: "s5" }, { f: vR, cls: "s1", n: 500 }], label: "Voltage across R: DC level plus the AC swing" });
            const ok = vs < E - 0.7, w = ok ? Math.max(0.01, vs * (1 - k) * 1.6) : 0.9;
            f2.innerHTML = wplot({ y: [0.7 - w, 0.7 + (ok ? w : 0.2)], yt: ticks(0.7 - w, 0.7 + (ok ? w : 0.2), 3), ytf: (v) => fmt(v, 4), yl: "v_D (V)", series: [{ f: vD, cls: "s2", n: 500 }], label: "Voltage across the diode" });
            ro.innerHTML = readout([["I<sub>DQ</sub>", si(ID, "A")], ["r<sub>d</sub> = 26 mV/I<sub>DQ</sub>", si(rd, "Ω")], ["Peak AC across R", si(vs * k, "V")], ["Peak AC across the diode", si(vs * (1 - k), "V")]]);
            vd.className = "verdict " + (ok ? "ok" : "no");
            vd.textContent = ok ? "The diode shifts the DC by 0.7 V but passes almost all of the AC swing." : "At the negative peaks the total drops below 0.7 V and the diode switches off. The small-signal method no longer applies.";
          }
          host.append(f1, f2, slider({ id: id + "-e", label: "DC source E", min: 1, max: 15, step: 0.1, value: 5, show: (v) => fmt(v, 3) + " V" }, (v) => { E = v; draw(); }).el,
            slider({ id: id + "-s", label: "AC peak v<sub>s</sub>", min: 0, max: 4, step: 0.05, value: 1, show: (v) => fmt(v, 3) + " V" }, (v) => { vs = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">R = 1 kΩ. Look at the diode graph's scale: it wiggles by millivolts. Now push v<sub>s</sub> past E − 0.7 V.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>E = 5 V, R = 1 kΩ, v<sub>s</sub> = 1 V peak.</p>`,
        { t: "num", q: "What's r_d?", a: 6.05, unit: "Ω", tol: 0.02, hint: "First I_DQ = (5 − 0.7)/1 kΩ. Then r_d = 26 mV/I_DQ.", why: "I_DQ = 4.3 mA, so r_d = 26 mV/4.3 mA ≈ 6.05 Ω." },
        { t: "num", q: "Peak AC voltage across the diode, in mV?", a: 6.01, unit: "mV", tol: 0.03, hint: "It's a divider: 1 V × r_d/(R + r_d).", why: "1 V × 6.05/1006 ≈ 6 mV. The other 994 mV appears across R." },
      ]},
      { k: "why", title: "What did the diode do?", b: [
        { t: "mcq", q: "Compared with a plain wire in place of the diode, the diode…", opts: [
          ["lowers the DC level by about 0.7 V, but leaves the AC swing almost unchanged", true, "For DC it's a 0.7 V drop. For AC it's a few ohms next to a kΩ: almost a short. That's because its curve is nearly vertical once it's fully on."],
          ["cuts the AC swing in half", false, "Check the readout: almost all of the AC appears across R."],
          ["blocks the AC completely", false, "It's on the whole time, so it passes the AC."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you analyse a diode circuit with both a DC and an AC source?", model: "Superposition. First turn off the AC source (short it) and find the DC operating point with the 0.7 V model. Then turn off the DC source (short it), replace the diode by its AC resistance r_d = 26 mV divided by the DC current, and solve for the AC voltages. Add the two results. This only works if the diode stays on for the whole cycle." },
      ]},
    ],
  };

  /* =============== PART 10: Zener regulator =============== */
  const ZR = 470, VZ = 8.2, IZM = 0.02;
  function zenerState(Vi, RL) {
    const V = (RL * Vi) / (ZR + RL);
    if (V < VZ) return { on: false, V, VL: V, IR: Vi / (ZR + RL), IL: V / RL, IZ: 0 };
    const IR = (Vi - VZ) / ZR, IL = VZ / RL;
    return { on: true, V, VL: VZ, IR, IL, IZ: IR - IL };
  }
  function zenerFig(st) {
    let s = S.wire([80, 92], [80, 40], [120, 40]) + S.res(120, 40, 200, 40, "470 Ω") + S.wire([200, 40], [330, 40]) + S.dot(250, 40) + zenV(250, 180, 40, st && st.on ? "hl" : "") + S.res(330, 40, 330, 180, "R_L", { side: "right" }) + S.wire([330, 180], [80, 180], [80, 128]) + S.dot(250, 180) + S.vsrc(80, 110, "V_i");
    s += S.t(232, 115, "8.2 V", { a: "end", cls: "s" });
    if (st && st.on) s += S.arrow(272, 85, 272, 140, "I_Z", { lx: 278, ly: 118, a: "start" });
    return S.svg(400, 200, s, { max: 400, label: "Zener regulator: V_i through 470 ohms into an 8.2 volt Zener in parallel with the load R_L" });
  }
  const p10 = {
    id: "p10", title: "Zener regulators", mins: 30,
    blurb: "Hold a steady voltage across a load, even when the load or the supply changes.",
    takeaway: "Step 1: remove the Zener and find the open-circuit voltage V = R_L·V_i/(R + R_L). If V ≥ V_Z it's on. Step 2: it locks at V_L = V_Z (never V), I_R = (V_i − V_Z)/R, I_L = V_Z/R_L, I_Z = I_R − I_L, P_Z = V_Z·I_Z ≤ P_ZM. Fixed V_i: R_L(min) = R·V_Z/(V_i − V_Z), I_L(min) = I_R − I_ZM, R_L(max) = V_Z/I_L(min). Fixed R_L: V_i(min) = (R_L + R)V_Z/R_L, V_i(max) = (I_ZM + I_L)R + V_Z.",
    steps: [
      { k: "learn", title: "What a regulator does", b: [
        `<p>A <b>regulator</b> keeps a supply's output voltage steady. The simplest one: a resistor R, then a Zener diode across the load R<sub>L</sub>.</p>`,
        fig(zenerFig(null)),
        `<p>The Zener sits reverse-biased. Once it reaches V<sub>Z</sub> it conducts against its arrow and holds the voltage there.</p>`,
        ch1("The Zener's three regions and their models are in", "p10", "Part 10"),
      ]},
      { k: "learn", title: "Two steps", b: [
        `<p><b>Step 1: is it on?</b> Take the Zener out. The load and R form a divider:</p>`,
        `<div class="eq">V = R<sub>L</sub>V<sub>i</sub> / (R + R<sub>L</sub>)</div>`,
        `<p>If V ≥ V<sub>Z</sub>, it's on. If not, it's off and plays no part.</p>`,
        `<p><b>Step 2: if on</b>, put in a V<sub>Z</sub> battery and solve:</p>`,
        `<div class="eq">V<sub>L</sub> = V<sub>Z</sub>    I<sub>R</sub> = (V<sub>i</sub> − V<sub>Z</sub>)/R    I<sub>L</sub> = V<sub>L</sub>/R<sub>L</sub>    I<sub>Z</sub> = I<sub>R</sub> − I<sub>L</sub>    P<sub>Z</sub> = V<sub>Z</sub>I<sub>Z</sub></div>`,
        `<div class="key">Step 1's V only tells you the state. Once the Zener turns on, it locks at V<sub>Z</sub>. The voltage never actually reaches V.</div>`,
      ]},
      { k: "predict", title: "Guess first", b: [
        { t: "mcq", q: "The Zener is on. You swap in a bigger R_L (a lighter load). What happens to the Zener's current?", opts: [
          ["It goes up", true, "I_R = (V_i − V_Z)/R doesn't change. The load takes less (I_L = V_Z/R_L), so the Zener takes the rest: I_Z = I_R − I_L grows."],
          ["It goes down", false, "Which current is fixed? I_R depends only on V_i, V_Z and R."],
          ["It stays the same", false, "The total I_R is fixed, but how it splits between the load and the Zener changes."],
        ]},
      ]},
      { k: "play", title: "The regulator lab", b: [
        (host, id) => {
          const sch = el(`<div class="fig"></div>`), f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let Vi = 20, RL = 1000;
          function draw() {
            const st = zenerState(Vi, RL), PZ = VZ * st.IZ;
            sch.innerHTML = zenerFig(st);
            const xs = (lg) => zenerState(Vi, Math.pow(10, lg)).VL;
            const hot = (lg) => { const z = zenerState(Vi, Math.pow(10, lg)); return z.on && z.IZ > IZM ? z.VL : NaN; };
            f.innerHTML = plot({ x: [2, 4], y: [0, 12], xt: [2, 2.5, 3, 3.5, 4], xtf: ohm, yt: [0, 4, 8.2, 12], xl: "R_L (Ω, log scale)", yl: "V_L (V)", series: [{ f: xs, cls: "s1", n: 300 }, { f: hot, cls: "s4", n: 300 }], marks: [{ x: Math.log10(RL), y: st.VL }], label: "Load voltage against load resistance. Red dashed: the Zener would overheat" });
            ro.innerHTML = readout([["Step 1: V with the Zener removed", fmt(st.V, 3) + " V"], ["State", st.on ? "on" : "off"], ["V<sub>L</sub>", fmt(st.VL, 3) + " V"], ["I<sub>R</sub>", si(st.IR, "A")], ["I<sub>L</sub>", si(st.IL, "A")], ["I<sub>Z</sub>", si(st.IZ, "A")], ["P<sub>Z</sub> (limit 164 mW)", si(PZ, "W")]]);
            vd.className = "verdict " + (!st.on ? "mid" : st.IZ > IZM ? "no" : "ok");
            vd.textContent = !st.on ? "Off: V is below 8.2 V, so the load gets the plain divider voltage." : st.IZ > IZM ? "On, but I_Z is over its 20 mA limit. The Zener would overheat." : "Regulating: V_L is held at 8.2 V.";
          }
          host.append(sch, f, slider({ id: id + "-v", label: "Supply V<sub>i</sub>", min: 0, max: 30, step: 0.1, value: 20, show: (v) => fmt(v, 3) + " V" }, (v) => { Vi = v; draw(); }).el,
            slider({ id: id + "-r", label: "Load R<sub>L</sub>", min: 100, max: 10000, log: true, value: 1000, show: (v) => si(v, "Ω") }, (v) => { RL = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">This Zener: V<sub>Z</sub> = 8.2 V, I<sub>ZM</sub> = 20 mA, so P<sub>ZM</sub> = 8.2 × 20 mA = 164 mW. The flat part of the graph is the regulating range.</p>`,
      ]},
      { k: "learn", title: "How light or heavy can the load be?", b: [
        `<p>Fix V<sub>i</sub> = 20 V and vary R<sub>L</sub>.</p>`,
        `<div class="two"><div class="tile"><h3>Too small an R<sub>L</sub></h3><p>The divider can't reach V<sub>Z</sub>. Smallest R<sub>L</sub>: set V = V<sub>Z</sub> and solve.</p></div><div class="tile"><h3>Too big an R<sub>L</sub></h3><p>The load takes too little, so the Zener takes too much. Smallest load current: I<sub>L</sub> = I<sub>R</sub> − I<sub>ZM</sub>.</p></div></div>`,
        `<div class="eq">R<sub>L min</sub> = R·V<sub>Z</sub>/(V<sub>i</sub> − V<sub>Z</sub>)    I<sub>L min</sub> = I<sub>R</sub> − I<sub>ZM</sub>    R<sub>L max</sub> = V<sub>Z</sub>/I<sub>L min</sub></div>`,
        { t: "num", q: "R_L(min) for this regulator at V_i = 20 V?", a: 327, unit: "Ω", tol: 0.02, hint: "470 × 8.2/(20 − 8.2).", why: "3854/11.8 ≈ 327 Ω. Check it in the lab: below about 327 Ω, the Zener turns off." },
        { t: "num", q: "R_L(max)?", a: 1.61, unit: "kΩ", tol: 0.02, hint: "I_R = (20 − 8.2)/470 first. Then I_L(min) = I_R − 20 mA. Then V_Z/I_L(min).", why: "I_R = 25.1 mA, so I_L(min) = 5.1 mA, and R_L(max) = 8.2/5.1 mA ≈ 1.61 kΩ. Above that, the red dashed part." },
      ]},
      { k: "learn", title: "How low or high can the supply go?", b: [
        `<p>Now fix R<sub>L</sub> = 1 kΩ and vary V<sub>i</sub>.</p>`,
        `<div class="eq">V<sub>i min</sub> = (R<sub>L</sub> + R)V<sub>Z</sub> / R<sub>L</sub>    I<sub>R max</sub> = I<sub>ZM</sub> + I<sub>L</sub>    V<sub>i max</sub> = I<sub>R max</sub>R + V<sub>Z</sub></div>`,
        `<p class="aside">Same idea: V<sub>i min</sub> is where the divider just reaches V<sub>Z</sub>. V<sub>i max</sub> is where the Zener's current hits its limit.</p>`,
        { t: "num", q: "V_i(min)?", a: 12.05, unit: "V", tol: 0.02, hint: "(1000 + 470) × 8.2/1000.", why: "1470 × 8.2/1000 ≈ 12.05 V." },
        { t: "num", q: "V_i(max)?", a: 21.45, unit: "V", tol: 0.02, hint: "I_L = 8.2 V/1 kΩ = 8.2 mA. Add I_ZM, multiply by R, then add V_Z.", why: "(20 + 8.2) mA × 470 Ω + 8.2 V = 13.25 + 8.2 ≈ 21.45 V. Between about 12 and 21.5 V, the output stays at 8.2 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In a Zener regulator, why does the Zener's current rise when the load gets lighter?", model: "Once the Zener is on, the load voltage is fixed at V_Z, so the current through the series resistor, I_R = (V_i − V_Z)/R, is fixed too. That current has to split between the load and the Zener. A lighter load (bigger R_L) takes less, so the Zener has to take more. If the load takes too little, the Zener's current passes I_ZM and it overheats." },
      ]},
    ],
  };

  /* =============== PART 11: voltage multipliers =============== */
  const MV = 15;
  function doublerFig(h) {
    const ph = h === 0 ? 0 : h % 2 ? 1 : -1, d1 = h === 1, d2 = h === 2;
    const vc1 = h >= 1 ? MV : 0, vc2 = h >= 2 ? 2 * MV : 0;
    let s = ac(60, 110, "v_s", "left") + S.wire([60, 92], [60, 40], [90, 40]) + S.cap(90, 40, 150, 40, "C1") + S.wire([150, 40], [200, 40]) + S.dot(200, 40);
    const D1 = S.diode(200, 40, 200, 180, "", { cls: d1 ? "hl" : "" }), D2 = S.diode(300, 40, 210, 40, "", { cls: d2 ? "hl" : "" });
    s += (d1 ? D1 : off(D1)) + (d2 ? D2 : off(D2)) + S.wire([200, 40], [210, 40]) + S.cap(300, 40, 300, 180, "C2") + S.wire([300, 180], [60, 180], [60, 128]) + S.dot(200, 180);
    s += S.t(182, 115, "D1", { a: "end", cls: "s" }) + S.t(255, 22, "D2", { cls: "s" });
    s += S.t(120, 80, `${vc1} V`, { cls: vc1 ? "a" : "m" }) + S.t(345, 115, `${vc2} V`, { a: "start", cls: vc2 ? "a" : "m" });
    if (ph) s += S.t(36, 80, ph > 0 ? "+" : "−", { cls: "big" }) + S.t(36, 150, ph > 0 ? "−" : "+", { cls: "big" });
    if (vc1) s += S.t(98, 66, "+", { cls: "s" }) + S.t(142, 66, "−", { cls: "s" });
    if (vc2) s += S.t(318, 58, "−", { cls: "s" }) + S.t(318, 172, "+", { cls: "s" });
    return S.svg(400, 200, s, { max: 400, label: "Half-wave voltage doubler: C1 in series, D1 across, D2 in series, C2 across the output" });
  }
  function ladderFig(n) {
    const xt = (j) => 60 + 80 * ((j + 1) / 2), xb = (j) => 60 + 80 * (j / 2) + 40, pos = (j) => (j % 2 ? [xt(j), 40] : [xb(j), 160]);
    const used = new Set();
    for (let j = n; j >= 1; j -= 2) used.add(j);
    let s = S.ind(60, 40, 60, 160, "") + `<line class="w" x1="40" y1="40" x2="40" y2="160"/><line class="w" x1="35" y1="40" x2="35" y2="160"/>`;
    for (let j = 1; j <= n; j++) {
      const [x, y] = pos(j), prev = j <= 2 ? [60, j === 1 ? 40 : 160] : pos(j - 2), hl = used.has(j) ? { tcls: "a" } : {};
      s += `<g${used.has(j) ? "" : ' opacity="0.45"'}>` + S.cap(prev[0], y, x, y, "C" + j, { side: j % 2 ? "above" : "below", ...hl }) + "</g>";
      const a = j === 1 ? [60, 160] : pos(j - 1);
      s += dAt(a[0], a[1], x, y) + S.dot(x, y);
    }
    const end = pos(n), start = n % 2 ? [60, 40] : [60, 160];
    s += S.dot(start[0], start[1]) + `<circle class="el" cx="${end[0]}" cy="${end[1] + (n % 2 ? -14 : 14)}" r="4"/>` + S.wire(end, [end[0], end[1] + (n % 2 ? -10 : 10)]);
    s += S.t(start[0] - 8, start[1] + (n % 2 ? -14 : 24), "from here", { a: "end", cls: "s a" }) + S.t(end[0] + 8, end[1] + (n % 2 ? -18 : 30), "to here: " + n + "V_m", { a: "start", cls: "s a" });
    return S.svg(Math.max(400, xb(n) + 220), 240, `<g transform="translate(70 20)">${s}</g>`, { label: "Voltage multiplier ladder with " + n + " stages" });
  }
  const p11 = {
    id: "p11", title: "Voltage multipliers", mins: 20,
    blurb: "Stack charged capacitors to get two, three or four times the transformer's peak.",
    takeaway: "Multipliers step up the DC output while the transformer only needs a peak of V_m. Half-wave doubler: one half-cycle charges C1 to V_m; the next adds the source and C1 to charge C2 to 2V_m. With a load, C2 sags and is topped up once per cycle, like a filtered half-wave rectifier. Full-wave doubler: C1 and C2 each charge to V_m and sit in series. Each diode needs PIV 2V_m. Extend the ladder: C1 has V_m, every other capacitor 2V_m; odd multiples measure from the top of the winding, even multiples from the bottom. Diodes = capacitors = the multiplying factor.",
    steps: [
      { k: "learn", title: "More volts from the same transformer", b: [
        `<p>A <b>voltage multiplier</b> gives a DC output of 2, 3, 4 or more times the transformer's peak V<sub>m</sub>. The transformer only has to deliver V<sub>m</sub>.</p>`,
        `<p>The trick: charge a capacitor on one half-cycle, then stack it on top of the source on the next.</p>`,
      ]},
      { k: "play", title: "Step through a doubler", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), note = el(`<p></p>`);
          let h = 0;
          const NOTES = [
            "Start: both capacitors are empty. The source peaks at 15 V.",
            "First positive half: D1 conducts. C1 charges to the peak, 15 V.",
            "Negative half: now the source and C1 are in series, both pushing the same way: 15 + 15 = 30 V. D2 conducts and charges C2 to 30 V.",
            "Next positive half: D2 is off. With no load, both capacitors simply stay charged. With a load, C2 would sag a little now and get topped up on the next negative half.",
          ];
          function draw() { f.innerHTML = doublerFig(h); note.innerHTML = NOTES[h]; }
          const nx = el(`<button type="button" class="btn">Next half-cycle</button>`), rs = el(`<button type="button" class="btn ghost">Reset</button>`);
          nx.addEventListener("click", () => { h = h >= 3 ? 2 : h + 1; draw(); });
          rs.addEventListener("click", () => { h = 0; draw(); });
          const row = el(`<div class="row"></div>`); row.append(nx, rs);
          host.append(f, row, note);
          draw();
        },
        `<p class="aside">Ideal diodes, no load. The output is across C2: twice the peak.</p>`,
      ]},
      { k: "learn", title: "Load, PIV, and the full-wave doubler", b: [
        `<div class="two"><div class="tile"><h3>With a load</h3><p>C2 discharges through it on one half and recharges to 2V<sub>m</sub> on the next. The output looks like a half-wave rectifier with a filter capacitor.</p></div><div class="tile"><h3>PIV</h3><p>Each diode must block <b>2V<sub>m</sub></b>.</p></div></div>`,
        `<p>The <b>full-wave doubler</b> uses two diodes the other way: one half-cycle charges C1 to V<sub>m</sub>, the other charges C2 to V<sub>m</sub>. In series they give 2V<sub>m</sub>.</p>`,
        `<p class="aside">Downside: C1 and C2 in series act as a smaller capacitor, so the output is filtered less well. Upside of both doublers: no centre-tapped transformer needed.</p>`,
      ]},
      { k: "play", title: "Keep stacking", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let n = 3;
          function draw() {
            f.innerHTML = ladderFig(n);
            ro.innerHTML = readout([["Output", n + " × V<sub>m</sub>"], ["Measured from", n % 2 ? "the top of the winding (odd multiple)" : "the bottom of the winding (even multiple)"], ["Diodes and capacitors", n + " of each"], ["Each diode's PIV", "2V<sub>m</sub>"], ["Transformer peak needed", "only V<sub>m</sub>"]]);
          }
          host.append(f, slider({ id: id + "-n", label: "Multiplying factor", min: 2, max: 6, step: 1, value: 3, show: (v) => v + "×" }, (v) => { n = v; draw(); }).el, ro);
          draw();
        },
        `<p>C1 charges to V<sub>m</sub>. Every capacitor after it charges to <b>2V<sub>m</sub></b>. The highlighted ones add up to the output.</p>`,
      ]},
      { k: "check", title: "Quick check", b: [
        { t: "mcq", q: "A quadrupler runs from a transformer with a 12 V peak. Ideal diodes, no load. Which is right?", opts: [
          ["48 V out; each diode must block 24 V; the transformer only needs a 12 V peak", true, "4 × 12 = 48 V. Every diode sees 2V_m = 24 V in reverse."],
          ["48 V out; each diode must block 48 V", false, "The diodes don't see the whole output. Each one sits across a 2V_m section."],
          ["24 V out", false, "That's a doubler. A quadrupler stacks four capacitor stages."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a half-wave voltage doubler reach twice the peak?", model: "On one half-cycle, the first diode conducts and charges the first capacitor to the source's peak, V_m. On the next half-cycle the source reverses, so the source and that charged capacitor are in series pushing the same way, for a total of 2V_m. The second diode conducts and charges the output capacitor to 2V_m." },
      ]},
    ],
  };

  /* =============== PART 12: practical (power and protection) =============== */
  const p12 = {
    id: "p12", title: "In practice: chargers and protection", mins: 25,
    blurb: "Battery chargers, the inductive kick, and diodes that guard other parts.",
    takeaway: "A battery charger is a step-down transformer and a full-wave rectifier; the battery only charges while the rectified voltage is above it, and the diodes stop it discharging back. Interrupting an inductor's current makes v = L·di/dt huge (an inductive kick). A diode across the coil gives the current a path (DC circuits only); an RC snubber works for AC too. Diodes also limit a voltage to about 0.7 V, block reverse current, and guard against wrong polarity.",
    steps: [
      { k: "play", title: "How a charger charges", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const Vp = 16;
          let Vb = 12;
          function draw() {
            const vo = (t) => Vp * Math.abs(sinw(t)), above = (t) => Math.max(vo(t), Vb);
            let frac2 = 0;
            for (let i = 0; i < 1000; i++) if (vo(i / 1000) > Vb) frac2++;
            f.innerHTML = wplot({ y: [0, 18], yt: [0, 4, 8, 12, 16], yl: "v (V)", areas: [{ f: above, base: Vb, n: 600 }], series: [{ f: vo, cls: "s1", n: 600 }, { pts: [[0, Vb], [2, Vb]], cls: "s2" }], label: "Full-wave rectified charger output against the battery voltage; shaded where the battery charges" });
            ro.innerHTML = readout([["Rectified peak", Vp + " V"], ["Its DC level, 0.636 × peak", fmt(0.636 * Vp, 3) + " V"], ["Battery voltage", fmt(Vb, 3) + " V"], ["Time spent charging", fmt(frac2 / 10, 3) + "% of each cycle"]]);
          }
          host.append(f, slider({ id: id + "-b", label: "Battery voltage", min: 6, max: 16, step: 0.1, value: 12, show: (v) => fmt(v, 3) + " V" }, (v) => { Vb = v; draw(); }).el, ro);
          draw();
        },
        `<p>The charger's DC level (about 10 V) is <b>below</b> the battery's 12 V. It still works: during the tops of the humps the voltage is higher than the battery's, and current flows in. Below that, the diodes stop the battery from pushing current back. This is <b>trickle charging</b>.</p>`,
        `<p class="aside">A real charger needs a load connected to show this waveform: a diode with zero current has zero voltage across it, so it doesn't "rectify" anything you can see.</p>`,
      ]},
      { k: "learn", title: "The inductive kick", b: [
        `<p>An inductor won't let its current change instantly: v<sub>L</sub> = L·di/dt. Open a switch in series with a coil and you're demanding a huge di/dt.</p>`,
        `<p>The voltage spikes to thousands of volts and arcs across the switch contacts, damaging them.</p>`,
        { t: "num", q: "A relay coil, L = 0.1 H, carries 60 mA. A switch cuts it off in 1 µs. Roughly how big is the spike, in volts?", a: 6000, unit: "V", tol: 0.02, hint: "v = L × ΔI/Δt = 0.1 × 0.06/0.000001.", why: "0.1 × 0.06/10⁻⁶ = 6000 V, from a 12 V circuit." },
      ]},
      { k: "play", title: "Give the current somewhere to go", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          const L = 0.1, Rc = 200, I0 = 0.06, tau = (L / Rc) * 1000;
          function draw(k) {
            const i = (t) => (t < 0 ? I0 * 1000 : k ? I0 * 1000 * Math.exp(-t / tau) : Math.max(0, I0 * 1000 * (1 - t / 0.004)));
            f.innerHTML = plot({ x: [-0.5, 3], y: [0, 70], xt: [0, 1, 2, 3], yt: [0, 20, 40, 60], xl: "t (ms)", yl: "i_L (mA)", series: [{ f: i, cls: "s1", n: 600 }], texts: [{ x: 0.12, y: 44, s: "switch opens" }], label: "Coil current after the switch opens" });
            ro.innerHTML = readout(k ? [["Where the current goes", "round the loop through the diode"], ["Dies away with τ = L/R", fmt(tau, 3) + " ms"], ["Voltage across the switch", "≈ 12 V + 0.7 V"]] : [["Where the current goes", "nowhere, so it arcs"], ["Time to stop", "≈ 1 µs"], ["Voltage across the switch", "thousands of volts"]]);
            vd.className = "verdict " + (k ? "ok" : "no");
            vd.textContent = k ? "The diode is reverse-biased in normal use. When the switch opens, the coil's voltage flips and turns it on." : "The current is forced to zero almost at once: a huge di/dt.";
          }
          host.append(f, toggle(["No protection", "Diode across the coil"], draw, 0), vd, ro);
          draw(0);
        },
        `<p>The diode has to carry the coil's full current for a moment. A resistor in series with it makes the current die faster.</p>`,
      ]},
      { k: "learn", title: "Diode or snubber?", b: [
        `<div class="two"><div class="tile"><h3>Diode across the coil</h3><p>Works the same at any frequency. But only for DC: with an AC supply, it would conduct every other half-cycle.</p></div><div class="tile"><h3>Snubber (RC across the coil)</h3><p>About 0.01 µF with about 100 Ω. At the spike's high frequency, X<sub>C</sub> = 1/(2πfC) is tiny, so the capacitor soaks it up. Works for AC too.</p></div></div>`,
        `<p class="aside">A capacitor across the switch contacts does the same job for the switch. Capacitors in places like these are protection, not part of the circuit's normal function.</p>`,
        { t: "mcq", q: "A relay coil runs from a 24 V AC supply. Which protection fits?", opts: [
          ["An RC snubber", true, "A diode across an AC-driven coil would conduct on every other half-cycle and short the supply."],
          ["A diode across the coil", false, "That only works when the coil's normal voltage keeps the diode reverse-biased, which means DC."],
        ]},
      ]},
      { k: "learn", title: "Diodes as guards", b: [
        `<div class="key">Diodes are often there to stop a voltage going past 0.7 V, or to stop current flowing the wrong way.</div>`,
        `<div class="two"><div class="tile"><h3>Input limiter</h3><p>Two diodes back to back across an op-amp's input. Small signals pass; anything past ±0.7 V is clipped. The extra voltage drops across a series resistor.</p></div><div class="tile"><h3>Transistor guard</h3><p>A diode across a junction stops it seeing more than 0.7 V in reverse. A series diode blocks reverse current.</p></div><div class="tile"><h3>Polarity guard</h3><p>A diode across a sensitive load. Right polarity: it's off and does nothing. Wrong polarity: it conducts, and the load sees at most 0.7 V.</p></div></div>`,
        { t: "mcq", q: "An op-amp input has the back-to-back limiter. A 300 mV peak signal arrives, then a 2 V peak one. What reaches the op-amp?", opts: [
          ["300 mV untouched; the 2 V one clipped to about ±0.7 V", true, "Below 0.7 V neither diode conducts. Above it, one does and pins the input. The rest drops across the series resistor."],
          ["Both clipped to 0.7 V", false, "300 mV is too small to turn either diode on."],
          ["Both untouched", false, "2 V is well past 0.7 V, so one diode turns on at each peak."],
        ]},
        `<p class="aside">The same parts can be drawn in different places and still do the same job. Don't expect every circuit to look like the first one you saw.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does opening a switch in a relay circuit cause a huge voltage, and how does a diode fix it?", model: "An inductor resists sudden changes in current, and its voltage is L times the rate of change of current. Opening the switch tries to stop the current almost instantly, so di/dt and the voltage become enormous and arc across the contacts. A diode across the coil is off normally, but when the switch opens the coil's voltage reverses, the diode turns on, and the current keeps flowing round through the diode and dies away gently." },
      ]},
    ],
  };

  /* =============== PART 13: practical (backup, references, AC regulation) =============== */
  const p13 = {
    id: "p13", title: "In practice: backups, references and AC", mins: 25,
    blurb: "Diodes that pick a power source, set steady voltages, and square off AC.",
    takeaway: "Two diodes can pick whichever supply is higher (backup power). LEDs on AC light on alternate halves; parallel LEDs keep a sign working if one fails. A string of diodes holds a nearly fixed voltage whatever the load draws, unlike a resistor divider. Diodes and Zeners in series set several reference levels at once. Back-to-back Zeners clip AC at about ±V_Z (the book treats the forward-biased one as a short; with the 0.7 V it's ±(V_Z + 0.7)), and with a big enough input that makes a square wave.",
    steps: [
      { k: "play", title: "Backup power", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          function draw(k) {
            const car = k === 0, d1 = car, d2 = !car, V = car ? 13.3 : 8.3;
            const D1 = S.diode(190, 40, 270, 40, "", { cls: d1 ? "hl" : "" }), D2 = S.diode(190, 140, 270, 140, "", { cls: d2 ? "hl" : "" });
            let s = (car ? S.vsrc(110, 90, "car 14 V") + S.wire([110, 108], [110, 200]) : S.t(110, 94, "unplugged", { cls: "s m" })) + S.wire([110, car ? 72 : 60], [110, 40], [190, 40]) + (d1 ? D1 : off(D1)) + S.wire([270, 40], [310, 40], [310, 140], [270, 140]);
            s += S.vsrc(160, 165, "9 V", { side: "right" }) + S.wire([160, 147], [160, 140], [190, 140]) + (d2 ? D2 : off(D2)) + S.dot(310, 90) + S.wire([310, 90], [340, 90]) + S.box(340, 65, 90, 50, "radio");
            s += S.wire([160, 183], [160, 200]) + S.wire([110, 200], [385, 200], [385, 115]) + S.dot(160, 200) + S.t(230, 22, "D1", { cls: "s" }) + S.t(230, 122, "D2", { cls: "s" });
            f.innerHTML = S.svg(450, 215, s, { max: 450, label: "Car supply and a 9 volt backup battery feeding a radio through two diodes" });
            ro.innerHTML = readout([["D1", d1 ? "on" : "off"], ["D2", d2 ? "on" : car ? "off: 9 V vs 13.3 V on its cathode" : "off"], ["Radio gets", fmt(V, 3) + " V"]]);
          }
          host.append(f, toggle(["Radio in the car", "Radio taken out"], draw, 0), ro);
          draw(0);
        },
        `<p>Each source feeds the radio through its own diode. Whichever is higher wins; the other diode is reverse-biased and disconnects its source. When the car supply goes, the 9 V battery takes over and the clock and stations survive.</p>`,
      ]},
      { k: "learn", title: "LED signs and testers", b: [
        `<div class="two"><div class="tile"><h3>Polarity tester</h3><p>Green and red LEDs back to back, each with a Si diode in series (Part 3). The Si diodes guard the LEDs in reverse and drop the voltage to a comfortable level.</p></div><div class="tile"><h3>EXIT sign</h3><p>A string of LEDs on 120 V AC through a resistor. Put two LEDs in parallel at each step: if one fails open, the other keeps the string lit.</p></div></div>`,
        `<p class="aside">On AC the LEDs flick on and off 60 times a second, but they're fast and your eye smooths it into steady light. LEDs last longer and use less power than bulbs, which matters when a backup battery takes over.</p>`,
      ]},
      { k: "play", title: "Diodes versus a resistor", b: [
        `<p>You need about 3.2 V for a load, from a 6 V supply. Option 1: a series resistor sized for a 1 kΩ load. Option 2: four silicon diodes in series.</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let RL = 1000;
          const Rs = 820, vRes = (r) => (6 * r) / (Rs + r), vDio = () => 6 - 4 * 0.7;
          function draw() {
            f.innerHTML = plot({ x: [Math.log10(300), Math.log10(3000)], y: [0, 5], xt: [2.5, 3, 3.4], xtf: ohm, yt: [0, 1, 2, 3, 4, 5], xl: "R_L (Ω, log scale)", yl: "V_L (V)", series: [{ f: (lg) => vRes(Math.pow(10, lg)), cls: "s2" }, { f: () => vDio(), cls: "s1" }], marks: [{ x: Math.log10(RL), y: vRes(RL), cls: "mk2" }, { x: Math.log10(RL), y: vDio() }], label: "Load voltage against load resistance: resistor dropper (blue) and four diodes (orange)" });
            ro.innerHTML = readout([["Load", si(RL, "Ω")], ["With an 820 Ω resistor", fmt(vRes(RL), 3) + " V"], ["With four diodes", fmt(vDio(), 3) + " V"]]);
          }
          host.append(f, slider({ id: id + "-r", label: "Load resistance", min: 300, max: 3000, log: true, value: 1000, show: (v) => si(v, "Ω") }, (v) => { RL = v; draw(); }).el, ro);
          draw();
        },
        `<p>A resistor's drop depends on the current (V = IR), so the load voltage moves with the load. Each conducting diode drops about 0.7 V <b>whatever the current</b>, within its limits.</p>`,
      ]},
      { k: "check", title: "Stacked reference levels", b: [
        fig(S.svg(300, 280, `<g transform="translate(0 22)">` + S.supply(80, 30, "+15 V") + S.res(80, 30, 80, 90, "R", { side: "left" }) + S.wire([80, 90], [80, 100]) + S.dot(80, 100) + zenV(80, 160, 100) + S.dot(80, 160) + S.diode(80, 160, 80, 200, "") + S.dot(80, 200) + S.diode(80, 200, 80, 240, "") + S.gnd(80, 240) + S.wire([80, 100], [150, 100]) + S.t(158, 105, "V_1", { a: "start", cls: "a" }) + S.wire([80, 160], [150, 160]) + S.t(158, 165, "V_2", { a: "start", cls: "a" }) + S.wire([80, 200], [150, 200]) + S.t(158, 205, "V_3", { a: "start", cls: "a" }) + S.t(98, 135, "5.1 V Zener", { a: "start", cls: "s" }) + S.t(98, 184, "Si", { a: "start", cls: "s" }) + S.t(98, 224, "Si", { a: "start", cls: "s" }) + "</g>",
          { max: 300, label: "From +15 volts: a resistor, then a 5.1 volt Zener and two silicon diodes stacked to ground, with taps between them" })),
        `<p>Current flows down the stack, so the Zener conducts in reverse and the two diodes forward.</p>`,
        { t: "num", q: "What's V_1, at the top of the stack?", a: 6.5, unit: "V", tol: 0.01, hint: "Add up from ground: 0.7, then 0.7, then 5.1.", why: "V_3 = 0.7 V, V_2 = 1.4 V, V_1 = 6.5 V. Three steady references from one supply. The resistor takes the other 8.5 V." },
      ]},
      { k: "play", title: "Back-to-back Zeners on AC", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let A = 20, book = false;
          const Z = 12;
          function draw() {
            const lv = book ? Z : Z + 0.7, vi = (t) => A * sinw(t), vo = (t) => Math.max(-lv, Math.min(lv, vi(t)));
            const top = Math.max(A, lv) * 1.3;
            f.innerHTML = wplot({ y: [-top, top], yt: ticks(-top, top), yl: "v (V)", series: [{ f: vi, cls: "s5" }, { f: vo, cls: "s1", n: 600 }], label: "Input sine (dashed) and the output clipped by two back-to-back Zeners" });
            ro.innerHTML = readout([["Clip level", "± " + fmt(lv, 3) + " V"], ["Output", A <= lv ? "same as the input" : A > 3 * lv ? "almost a square wave" : "a sine with flat tops"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "Input peak", min: 5, max: 60, step: 0.5, value: 20, show: (v) => fmt(v, 3) + " V" }, (v) => { A = v; draw(); }).el,
            toggle(["Count the forward 0.7 V", "Book's shortcut: forward Zener = short"], (k) => { book = k === 1; draw(); }, 0), ro);
          draw();
        },
        `<p>Two 12 V Zeners, cathode to cathode, across the output, fed through a resistor. On each half, one Zener is in breakdown and the other is forward-biased. Until the input reaches that level, neither conducts and v<sub>o</sub> = v<sub>i</sub>.</p>`,
        `<p class="aside">The book treats the forward-biased Zener as a short, so it says the output clips at V<sub>Z</sub>. Use its convention in its problems. Turn the input way up and you get a rough <b>square-wave generator</b>.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a string of diodes hold a load's voltage steadier than a series resistor does?", model: "A resistor's voltage drop is I times R, so if the load draws more current the drop grows and the load's voltage falls. A conducting diode's drop stays near 0.7 V over a wide range of currents. So with diodes in series, the drop is nearly fixed and the load voltage barely changes when the load does." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edc2", eyebrow: "Boylestad · Chapter 2", title: "Diode Applications",
    intro: `<p>Thirteen short parts: load lines, working out which diodes are on, logic gates, rectifiers, clippers, clampers, Zener regulators, voltage multipliers, and real-world uses.</p><p>6.002 already gave you load lines, small-signal analysis and the clamp. Those parts open with a short recap that links back. This book adds lots of circuits and a step-by-step method for each kind.</p><p class="aside">The "Computer Analysis" section (PSpice/Multisim) isn't covered. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's problems in the book. They test whether the ideas stuck, so don't expect them to look like the examples here.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13],
    summary: `
      <h3>Load line</h3>
      <div class="eq">E = V<sub>D</sub> + I<sub>D</sub>R    ends: I<sub>D</sub> = E/R (V<sub>D</sub> = 0), V<sub>D</sub> = E (I<sub>D</sub> = 0)    R<sub>D</sub> = V<sub>DQ</sub>/I<sub>DQ</sub></div>
      <h3>Diode states</h3>
      <p>Pretend it's a resistor. Current along the arrow and push &gt; V<sub>K</sub> ⇒ on (V<sub>K</sub>: Si 0.7, Ge 0.3, GaAs 1.2, ideal 0 V). Off ⇒ open: zero current, any voltage. Parallel parts share one voltage: lowest V<sub>K</sub> wins. Gates: guess, solve, check (on: forward current; off: under 0.7 V).</p>
      <h3>Rectifiers</h3>
      <div class="eq">Half-wave: V<sub>dc</sub> = 0.318V<sub>m</sub> ≈ 0.318(V<sub>m</sub> − V<sub>K</sub>), PIV ≥ V<sub>m</sub></div>
      <div class="eq">Bridge: V<sub>dc</sub> = 0.636V<sub>m</sub> ≈ 0.636(V<sub>m</sub> − 2V<sub>K</sub>), PIV ≥ V<sub>m</sub>    Centre tap: PIV ≥ 2V<sub>m</sub></div>
      <h3>Clippers and clampers</h3>
      <p>Clipper: find where v<sub>o</sub> is, which way sources push, the transition voltage (V<sub>K</sub> across the diode, zero current), then sketch v<sub>o</sub> under v<sub>i</sub>. Clamper: start with the half that turns the diode on; C charges instantly when on, holds when off (5RC ≫ T/2); output swing = input swing.</p>
      <h3>DC + AC</h3>
      <p>Superposition: DC with 0.7 V model, AC with r<sub>d</sub> = 26 mV/I<sub>DQ</sub>, then add. Valid only if the diode stays on.</p>
      <h3>Zener regulator</h3>
      <div class="eq">State: V = R<sub>L</sub>V<sub>i</sub>/(R + R<sub>L</sub>) ≥ V<sub>Z</sub>?    On: V<sub>L</sub> = V<sub>Z</sub>, I<sub>R</sub> = (V<sub>i</sub> − V<sub>Z</sub>)/R, I<sub>L</sub> = V<sub>Z</sub>/R<sub>L</sub>, I<sub>Z</sub> = I<sub>R</sub> − I<sub>L</sub>, P<sub>Z</sub> = V<sub>Z</sub>I<sub>Z</sub></div>
      <div class="eq">R<sub>L min</sub> = RV<sub>Z</sub>/(V<sub>i</sub> − V<sub>Z</sub>)    I<sub>L min</sub> = I<sub>R</sub> − I<sub>ZM</sub>    R<sub>L max</sub> = V<sub>Z</sub>/I<sub>L min</sub></div>
      <div class="eq">V<sub>i min</sub> = (R<sub>L</sub> + R)V<sub>Z</sub>/R<sub>L</sub>    V<sub>i max</sub> = (I<sub>ZM</sub> + I<sub>L</sub>)R + V<sub>Z</sub></div>
      <h3>Multipliers</h3>
      <p>Doubler: C1 → V<sub>m</sub>, C2 → 2V<sub>m</sub>. Ladder: C1 = V<sub>m</sub>, the rest 2V<sub>m</sub>; odd multiples from the top of the winding, even from the bottom. Diodes = capacitors = factor. PIV 2V<sub>m</sub> each.</p>
      <h3>Practical</h3>
      <p>Chargers trickle-charge above the battery voltage. Inductive kick v = L di/dt: diode across the coil (DC) or RC snubber (AC). Diodes limit to 0.7 V, block reverse current, OR two supplies, and hold steady voltages.</p>`,
  };
  Course.start(window.CHAPTER);
})();
