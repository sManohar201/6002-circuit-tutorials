(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const ch = (n, file, part, where, html) => `<p class="aside">${html} <a href="${file}#${part}">Boylestad Chapter ${n}, ${where} →</a></p>`;
  const ohm = (r) => si(r, "Ω");
  const two = (a, b) => `<div class="two" style="align-items:start"><div>${a}</div><div>${b}</div></div>`;

  /* JFET symbol. Gate from (x−30,y); drain ends at (x+22,y−40); source at (x+22,y+40). n-channel arrow points in. */
  function jfet(x, y, o = {}) {
    let s = `<line class="w" x1="${x - 30}" y1="${y}" x2="${x}" y2="${y}"/><line class="w" x1="${x}" y1="${y - 24}" x2="${x}" y2="${y + 24}" style="stroke-width:3.5"/>`;
    s += `<polyline class="w" points="${x},${y - 16} ${x + 22},${y - 16} ${x + 22},${y - 40}"/><polyline class="w" points="${x},${y + 16} ${x + 22},${y + 16} ${x + 22},${y + 40}"/>`;
    s += o.p ? `<polygon class="nd" points="${x - 22},${y} ${x - 12},${y - 5} ${x - 12},${y + 5}"/>` : `<polygon class="nd" points="${x - 2},${y} ${x - 12},${y - 5} ${x - 12},${y + 5}"/>`;
    if (o.labels) s += S.t(x + 30, y - 30, "D", { a: "start", cls: "s m" }) + S.t(x + 30, y + 38, "S", { a: "start", cls: "s m" }) + S.t(x - 30, y - 8, "G", { a: "start", cls: "s m" });
    return s;
  }
  /* MOSFET symbol with substrate tied to source. o.enh: dashed channel. o.p: p-channel (arrow points out). */
  function mosfet(x, y, o = {}) {
    let s = `<line class="w" x1="${x - 30}" y1="${y}" x2="${x - 10}" y2="${y}"/><line class="w" x1="${x - 10}" y1="${y - 18}" x2="${x - 10}" y2="${y + 18}"/>`;
    s += o.enh ? [[-22, -10], [-6, 6], [10, 22]].map(([a, b]) => `<line class="w" x1="${x - 3}" y1="${y + a}" x2="${x - 3}" y2="${y + b}" style="stroke-width:3.5"/>`).join("") : `<line class="w" x1="${x - 3}" y1="${y - 22}" x2="${x - 3}" y2="${y + 22}" style="stroke-width:3.5"/>`;
    s += `<polyline class="w" points="${x - 3},${y - 16} ${x + 18},${y - 16} ${x + 18},${y - 40}"/><polyline class="w" points="${x - 3},${y + 16} ${x + 18},${y + 16} ${x + 18},${y + 40}"/>`;
    s += `<polyline class="w" points="${x - 3},${y} ${x + 18},${y} ${x + 18},${y + 16}"/>`;
    s += o.p ? `<polygon class="nd" points="${x + 12},${y} ${x + 3},${y - 5} ${x + 3},${y + 5}"/>` : `<polygon class="nd" points="${x - 1},${y} ${x + 8},${y - 5} ${x + 8},${y + 5}"/>`;
    if (o.labels) s += S.t(x + 26, y - 30, "D", { a: "start", cls: "s m" }) + S.t(x + 26, y + 38, "S", { a: "start", cls: "s m" }) + S.t(x - 30, y - 8, "G", { a: "start", cls: "s m" });
    return s;
  }

  /* n-channel JFET, square law. Volts and mA. VP < 0. Returns I_D in mA. */
  function jfetID(VGS, VDS, IDSS, VP) {
    const Vov = VGS - VP;
    if (Vov <= 0 || VDS <= 0) return 0;
    if (VDS < Vov) return (IDSS / (VP * VP)) * (2 * Vov * VDS - VDS * VDS);
    return IDSS * Math.pow(1 - VGS / VP, 2);
  }
  const shockley = (VGS, IDSS, VP) => (VGS / VP >= 1 ? 0 : IDSS * Math.pow(1 - VGS / VP, 2));

  /* JFET cross-section: n channel between two p gate regions, depletion drawn from the reverse bias along the channel. */
  function jfetSection(VGS, VDS, VP) {
    const W = 46, top = 40, bot = 230, cx = 200, Vsat = Math.max(0, VGS - VP), Vend = Math.min(VDS, Vsat);
    let s = `<rect x="${cx - 70}" y="${top}" width="140" height="${bot - top}" style="fill:var(--cool-soft);stroke:var(--ink)"/>`;
    s += `<rect x="${cx - 70}" y="${top + 40}" width="24" height="${bot - top - 80}" style="fill:var(--accent-soft);stroke:var(--ink)"/><rect x="${cx + 46}" y="${top + 40}" width="24" height="${bot - top - 80}" style="fill:var(--accent-soft);stroke:var(--ink)"/>`;
    const depth = (t) => {
      const Vr = Math.max(0, -VGS) + Vend * t;
      return Math.min(W, W * Math.sqrt((0.3 + Vr) / (0.3 + Math.abs(VP))));
    };
    const ys = [];
    for (let i = 0; i <= 20; i++) ys.push(bot - 40 - ((bot - top - 80) * i) / 20);
    const L = ys.map((y, i) => [cx - 46 + depth(i / 20), y]), R = ys.map((y, i) => [cx + 46 - depth(i / 20), y]);
    const poly = (edge, x0) => `<polygon points="${x0},${ys[0]} ${edge.map((p) => p.join(",")).join(" ")} ${x0},${ys[20]}" style="fill:var(--card);opacity:.9;stroke:var(--line)"/>`;
    s += poly(L, cx - 46) + poly(R, cx + 46);
    const pinched = VGS <= VP || VDS >= Vsat;
    s += S.t(cx, top - 10, "D (drain)", { cls: "s" }) + S.t(cx, bot + 20, "S (source)", { cls: "s" }) + S.t(cx - 82, (top + bot) / 2 + 4, "G", { a: "end", cls: "a" }) + S.t(cx + 82, (top + bot) / 2 + 4, "G", { a: "start", cls: "a" });
    s += S.t(cx - 58, top + 32, "p", { cls: "a s" }) + S.t(cx + 58, top + 32, "p", { cls: "a s" }) + S.t(cx, top + 22, "n channel", { cls: "c s" });
    if (pinched && VGS > VP) s += `<circle cx="${cx}" cy="${ys[20]}" r="7" style="fill:none;stroke:var(--bad);stroke-width:2"/>` + S.t(cx + 90, top + 44, "pinch-off", { a: "start", cls: "b s" });
    return S.svg(400, 260, s, { max: 400, label: "Cross-section of an n-channel JFET with depletion regions" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Voltage control, and the JFET", mins: 20,
    blurb: "A FET's input is a voltage, not a current. Inside a JFET: a channel squeezed by two junctions.",
    takeaway: "The BJT is current-controlled (I_C set by I_B); the FET is voltage-controlled (I_D set by V_GS). FETs are unipolar: only electrons (n-channel) or only holes (p-channel) carry the current. Compared with BJTs: much higher input impedance (1 MΩ to hundreds of MΩ), lower voltage gain, better temperature stability, smaller (good for ICs), but MOSFETs need careful handling. JFET (n-channel): an n-type channel from drain (D, top) to source (S, bottom), with p-type regions on both sides tied to the gate (G). The gate–channel junctions are reverse-biased, so I_G = 0. Depletion is wider near the drain, because the reverse bias there is larger.",
    steps: [
      { k: "learn", title: "Current control vs voltage control", b: [
        `<div class="two"><div class="tile"><h3>BJT</h3><p>I<sub>C</sub> = βI<sub>B</sub>: a <b>current</b> controls the output current.</p></div><div class="tile"><h3>FET</h3><p>I<sub>D</sub> set by V<sub>GS</sub>: a <b>voltage</b> controls it, through an electric field. (The "field effect".)</p></div></div>`,
        `<p>Like npn and pnp, FETs come as <b>n-channel</b> and <b>p-channel</b>. But they're <b>unipolar</b>: one kind of carrier only (electrons in n-channel, holes in p-channel).</p>`,
        seen("The MOSFET as a switch and an amplifier, with v_GS controlling i_D.", "07-mosfet-amplifier.html#p3", "Chapter 7, Part 3"),
      ]},
      { k: "check", title: "FET or BJT?", b: [
        { t: "sort", q: "Which device does each statement favour?", bins: ["FET", "BJT"], items: [
          ["Input impedance from 1 MΩ to hundreds of MΩ", 0, "The gate draws (almost) no current."],
          ["Bigger voltage gain for the same circuit", 1, "Its output current is far more sensitive to its input."],
          ["More stable with temperature", 0, "One of the FET's selling points."],
          ["Small enough to pack millions onto a chip", 0, "That's why ICs are mostly MOSFETs."],
          ["Less fussy about handling (static)", 1, "MOSFETs can be killed by static on their thin gate oxide (Part 10)."],
        ]},
      ]},
      { k: "learn", title: "Inside a JFET", b: [
        `<p>A bar of n-type silicon is the <b>channel</b>. Drain (D) on top, source (S) at the bottom. Two p-type regions sit in its sides, tied together as the <b>gate</b> (G).</p>`,
        `<p>Each p–n junction has a depletion region with no free carriers. Widen the depletion regions and the channel narrows. Think of a water pipe with a valve: the gate squeezes the flow from source to drain.</p>`,
        `<div class="key">The gate junctions are always <b>reverse-biased</b> in use, so <b>I<sub>G</sub> = 0</b>. That's the JFET's first rule, like V<sub>BE</sub> = 0.7 V for the BJT.</div>`,
      ]},
      { k: "play", title: "Squeeze the channel", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), vd = el(`<span class="verdict"></span>`), ro = el(`<div></div>`);
          let VGS = 0, VDS = 2;
          const IDSS = 10, VP = -5;
          function draw() {
            f.innerHTML = jfetSection(VGS, VDS, VP);
            const ID = jfetID(VGS, VDS, IDSS, VP), sat = VGS - VP;
            ro.innerHTML = readout([["V<sub>GS</sub>", fmt(VGS, 2) + " V"], ["V<sub>DS</sub>", fmt(VDS, 3) + " V"], ["I<sub>D</sub>", fmt(ID, 3) + " mA"], ["I<sub>G</sub>", "0"]]);
            vd.className = "verdict " + (VGS <= VP ? "no" : VDS >= sat ? "mid" : "ok");
            vd.textContent = VGS <= VP ? "V_GS has reached V_P: the depletion regions close the channel everywhere. I_D = 0." : VDS >= sat ? `Pinched off at the drain end. I_D stops rising and holds at ${fmt(ID, 3)} mA.` : "Open channel: I_D grows with V_DS, roughly like a resistor.";
          }
          host.append(f, slider({ id: id + "-ds", label: "Drain–source voltage V<sub>DS</sub>", min: 0, max: 10, step: 0.1, value: VDS, show: (v) => fmt(v, 3) + " V" }, (v) => { VDS = v; draw(); }).el,
            slider({ id: id + "-gs", label: "Gate–source voltage V<sub>GS</sub>", min: -6, max: 0, step: 0.1, value: 0, show: (v) => fmt(v, 2) + " V" }, (v) => { VGS = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">The uncoloured areas beside the gates are the depletion regions. With V<sub>GS</sub> = 0, raise V<sub>DS</sub>: the top of the channel narrows first, because the channel voltage there (and so the reverse bias) is highest.</p>`,
      ]},
      { k: "predict", title: "Why wider at the top?", b: [
        { t: "mcq", q: "Drain at +2 V, source and gate at 0 V. Halfway up the channel the voltage is about 1 V. Where is the junction most reverse-biased?", opts: [
          ["Near the drain: the channel is at about +2 V there while the gate is at 0 V", true, "Reverse bias = channel voltage − gate voltage. It's largest at the drain end, so depletion is widest there."],
          ["Near the source", false, "At the source the channel is at 0 V, the same as the gate: no extra reverse bias."],
          ["Equal everywhere", false, "The current through the channel's resistance makes the voltage rise along it."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the gate of a JFET control the current without drawing current itself?", model: "The gate is the p side of junctions that are kept reverse-biased, so no gate current flows. Changing the gate voltage changes how wide the depletion regions are, which changes how wide the conducting channel is. A narrower channel lets less drain current through." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Drain curves: pinch-off and I_DSS", mins: 25,
    blurb: "I_D against V_DS for each V_GS: an ohmic region, then a flat current-source region.",
    takeaway: "With V_GS = 0: I_D rises almost linearly with V_DS (ohmic), bends as the channel narrows, then levels off at I_DSS once V_DS reaches |V_P|: pinch-off. Pinch-off doesn't stop the current; a thin, dense channel remains and the JFET acts like a current source. I_DSS (drain–source current with the gate Shorted to the source) is the maximum drain current. Making V_GS more negative pinches off sooner and at lower current; at V_GS = V_P (negative for n-channel) I_D ≈ 0: cutoff. Pinch-off happens at V_DS = V_GS − V_P (the locus). Right of the locus: saturation (constant-current, linear amplification) region, used by amplifiers. On datasheets V_P appears as V_GS(off).",
    steps: [
      { k: "learn", title: "With the gate tied to the source", b: [
        `<p>Set V<sub>GS</sub> = 0 and raise V<sub>DS</sub>:</p>`,
        `<ol><li>At first the channel is a resistor: I<sub>D</sub> rises in a straight line.</li><li>The depletion regions grow near the drain, the channel narrows, the curve bends.</li><li>At V<sub>DS</sub> = |V<sub>P</sub>| the regions nearly meet: <b>pinch-off</b>. From there on I<sub>D</sub> stays at <b>I<sub>DSS</sub></b>.</li></ol>`,
        `<div class="key">"Pinch-off" is a misleading name: the current does <b>not</b> drop to zero. A very thin channel with a very high current density remains. (If the current stopped, the voltage drop that causes the pinch would vanish too.)</div>`,
        `<p class="aside">I<sub>DSS</sub>: Drain-to-Source current with the gate Shorted to the source. It's the most current the JFET will pass.</p>`,
      ]},
      { k: "play", title: "The drain curves", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), vd = el(`<span class="verdict"></span>`), ro = el(`<div></div>`);
          let VGS = -1, VDS = 8;
          const IDSS = 10, VP = -5;
          function draw() {
            const series = [0, -1, -2, -3, -4].map((g) => ({ f: (v) => jfetID(g, v, IDSS, VP), cls: Math.abs(g - VGS) < 0.01 ? "s1" : "s5" }));
            series.push({ f: (v) => (v <= -VP ? (IDSS * v * v) / (VP * VP) : NaN), to: -VP, cls: "s4" });
            if (![0, -1, -2, -3, -4].some((g) => Math.abs(g - VGS) < 0.01)) series.push({ f: (v) => jfetID(VGS, v, IDSS, VP), cls: "s1" });
            const ID = jfetID(VGS, VDS, IDSS, VP);
            f.innerHTML = plot({ x: [0, 15], y: [0, 11], xt: [0, 5, 10, 15], yt: [0, 2, 4, 6, 8, 10], xl: "V_DS (V)", yl: "I_D (mA)", series, marks: [{ x: VDS, y: ID }], texts: [{ x: 11, y: 10.4, s: "V_GS = 0" }, { x: 5.4, y: 8.4, s: "pinch-off locus" }], label: "JFET drain characteristics with IDSS = 10 mA and VP = −5 V" });
            const region = VGS <= VP ? 2 : VDS < VGS - VP ? 1 : 0;
            ro.innerHTML = readout([["I<sub>D</sub>", fmt(ID, 3) + " mA"], ["Pinch-off at V<sub>DS</sub> = V<sub>GS</sub> − V<sub>P</sub>", fmt(Math.max(0, VGS - VP), 3) + " V"]]);
            vd.className = "verdict " + ["ok", "mid", "no"][region];
            vd.textContent = ["Saturation (constant-current) region: right of the locus. Changing V_DS barely changes I_D. Amplifiers live here.", "Ohmic region: left of the locus. The JFET behaves like a resistor set by V_GS.", "Cutoff: V_GS ≤ V_P, so I_D ≈ 0."][region];
          }
          host.append(f, slider({ id: id + "-gs", label: "V<sub>GS</sub>", min: -5.5, max: 0, step: 0.1, value: VGS, show: (v) => fmt(v, 2) + " V" }, (v) => { VGS = v; draw(); }).el,
            slider({ id: id + "-ds", label: "V<sub>DS</sub>", min: 0, max: 15, step: 0.1, value: VDS, show: (v) => fmt(v, 3) + " V" }, (v) => { VDS = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">This JFET: I<sub>DSS</sub> = 10 mA, V<sub>P</sub> = −5 V. Grey curves are V<sub>GS</sub> = 0, −1, −2, −3, −4 V. The red dashed curve is the pinch-off locus.</p>`,
      ]},
      { k: "predict", title: "Read the spacing", b: [
        { t: "mcq", q: "Each grey curve is 1 V of V_GS apart. What do you notice about the gaps between their flat levels?", opts: [
          ["They shrink as V_GS goes more negative: the response isn't linear", true, "Equal steps in V_GS give smaller and smaller steps in I_D. Compare the BJT, where equal steps in I_B give equal steps in I_C."],
          ["They're all equal", false, "Look at the gap between 0 and −1 V versus −3 and −4 V."],
          ["They grow as V_GS goes more negative", false, "It's the other way."],
        ]},
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Same JFET: I<sub>DSS</sub> = 10 mA, V<sub>P</sub> = −5 V.</p>`,
        { t: "num", q: "At V_GS = −2 V, at what V_DS does the channel pinch off?", a: 3, unit: "V", hint: "V_DS = V_GS − V_P. Careful with the two minus signs.", why: "−2 − (−5) = 3 V." },
        { t: "num", q: "V_GS = −6 V and V_DS = 10 V. What's I_D?", a: 0, unit: "mA", hint: "Compare V_GS with V_P.", why: "V_GS is beyond V_P, so the channel is closed: cutoff, I_D = 0." },
        { t: "mcq", q: "A datasheet lists V_GS(off) = −3 V. What is that in this book's notation?", opts: [
          ["V_P = −3 V", true, "Datasheets usually call the pinch-off voltage V_GS(off): the gate voltage that turns the JFET off."],
          ["I_DSS", false, "That's a current."],
          ["The breakdown voltage", false, "Breakdown is V_(BR)GSS or V_DS max."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What are I_DSS and V_P, and where do you find them on the drain curves?", model: "I_DSS is the largest drain current, the flat level of the V_GS = 0 curve once the channel has pinched off. V_P is the gate–source voltage that cuts the current off completely; it's the V_GS of the curve that lies flat on the axis. For an n-channel JFET V_P is negative." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "A voltage-controlled resistor, p-channel, symbols", mins: 20,
    blurb: "Left of pinch-off the JFET is a resistor you tune with V_GS. Then the p-channel version and the symbols.",
    takeaway: "Ohmic (voltage-controlled resistance) region: left of the pinch-off locus, the drain–source resistance is r_d = r_o/(1 − V_GS/V_P)², where r_o is the resistance at V_GS = 0. Used for automatic gain control. p-channel JFET: p channel, n gate regions; all current directions and voltage polarities reverse; V_P is positive, V_DS negative on its curves. Very high V_DS causes breakdown (current shoots up): keep below V_DSmax. Symbols: the gate arrow points in for n-channel, out for p-channel (the way gate current would flow if the junction were forward-biased).",
    steps: [
      { k: "play", title: "Tune a resistor with a voltage", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let VGS = 0;
          const r0 = 5000, VP = -5;
          function draw() {
            const rd = r0 / Math.pow(1 - VGS / VP, 2);
            f.innerHTML = plot({ x: [-5, 0], y: [0, 100], xt: [-5, -4, -3, -2, -1, 0], yt: [0, 25, 50, 75, 100], xl: "V_GS (V)", yl: "r_d (kΩ)", series: [{ f: (v) => r0 / Math.pow(1 - v / VP, 2) / 1000, from: -4.5, cls: "s1" }], marks: [{ x: VGS, y: rd / 1000 }], label: "Channel resistance rising as VGS approaches VP" });
            ro.innerHTML = readout([["V<sub>GS</sub>", fmt(VGS, 2) + " V"], ["r<sub>d</sub>", ohm(rd)]]);
          }
          host.append(f, slider({ id: id + "-gs", label: "V<sub>GS</sub>", min: -4.5, max: 0, step: 0.05, value: 0, show: (v) => fmt(v, 2) + " V" }, (v) => { VGS = v; draw(); }).el, ro);
          draw();
        },
        `<div class="eq">r<sub>d</sub> = r<sub>o</sub> / (1 − V<sub>GS</sub>/V<sub>P</sub>)²    (left of pinch-off)</div>`,
        `<p class="aside">r<sub>o</sub> = 5 kΩ here (the resistance at V<sub>GS</sub> = 0), V<sub>P</sub> = −5 V. In the drain curves, the ohmic-region slopes get flatter as V<sub>GS</sub> goes negative: higher resistance. That's the same fact.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "r_o = 5 kΩ, V_P = −5 V. What's r_d at V_GS = −2.5 V?", a: 20000, unit: "Ω", hint: "1 − (−2.5)/(−5) = 0.5. Square it.", why: "5k/0.25 = 20 kΩ. Halfway to pinch-off quadruples the resistance." },
        { t: "num", q: "And at V_GS = −4 V?", a: 125000, unit: "Ω", hint: "1 − 0.8 = 0.2.", why: "5k/0.04 = 125 kΩ." },
        `<p class="aside">One use: automatic gain control. A JFET in a voltage divider acts as a resistor that a control voltage can turn up or down.</p>`,
      ]},
      { k: "learn", title: "The p-channel JFET", b: [
        `<p>Swap the materials: a <b>p</b>-type channel with <b>n</b>-type gate regions. Every current direction and voltage polarity reverses.</p>`,
        `<div class="two"><div class="tile"><h3>n-channel</h3><p>V<sub>GS</sub> from 0 down to V<sub>P</sub> &lt; 0. V<sub>DS</sub> positive.</p></div><div class="tile"><h3>p-channel</h3><p>V<sub>GS</sub> from 0 up to V<sub>P</sub> &gt; 0. V<sub>DS</sub> negative (source above drain).</p></div></div>`,
        `<p class="aside">At very high |V<sub>DS</sub>| the curves shoot straight up: <b>breakdown</b>. The current is then limited only by the outside circuit. Keep V<sub>DS</sub> below V<sub>DSmax</sub> on the datasheet.</p>`,
      ]},
      { k: "learn", title: "Symbols", b: [
        fig(S.svg(380, 130, jfet(90, 65, { labels: 1 }) + S.t(100, 125, "n-channel", { cls: "a s" }) + jfet(270, 65, { labels: 1, p: 1 }) + S.t(280, 125, "p-channel", { cls: "a s" }), { max: 380, label: "JFET symbols: n-channel arrow points in, p-channel arrow points out" })),
        `<div class="key">The arrow shows the direction gate current <i>would</i> flow if the junction were forward-biased: from p to n. n-channel: arrow points <b>in</b>. p-channel: points <b>out</b>.</div>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How can a JFET act as a variable resistor?", model: "Below pinch-off, in the ohmic region, the drain–source path behaves like a resistor. Its value depends on V_GS: the more negative the gate (for n-channel), the narrower the channel and the higher the resistance, roughly r_o/(1 − V_GS/V_P)². So a control voltage on the gate sets the resistance." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "The transfer curve", mins: 25,
    blurb: "One curve that says how the gate voltage sets the current: Shockley's equation.",
    takeaway: "BJT: I_C = βI_B, linear. JFET: Shockley's equation I_D = I_DSS(1 − V_GS/V_P)², a parabola (square law). End points: V_GS = 0 gives I_DSS; V_GS = V_P gives 0. Inverse: V_GS = V_P(1 − √(I_D/I_DSS)). The transfer curve can be read off the drain curves by projecting each curve's saturation level across to the I_D axis. It belongs to the device: the circuit around it never changes it (Chapter 7 intersects it with a circuit line). Watch the signs: V_GS and V_P are both negative for n-channel.",
    steps: [
      { k: "learn", title: "Shockley's equation", b: [
        `<div class="eq">I<sub>D</sub> = I<sub>DSS</sub> (1 − V<sub>GS</sub>/V<sub>P</sub>)²</div>`,
        `<p>Two constants from the datasheet (I<sub>DSS</sub>, V<sub>P</sub>), one control variable (V<sub>GS</sub>). The square makes it a parabola, not a straight line like I<sub>C</sub> = βI<sub>B</sub>.</p>`,
        ch(1, "01-semiconductor-diodes.html", "p4", "Part 4", "Same Shockley, different equation: he also gave us the diode equation."),
      ]},
      { k: "play", title: "From drain curves to transfer curve", b: [
        (host, id) => {
          const L = el(`<div class="fig"></div>`), R = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let VGS = -1;
          const IDSS = 10, VP = -5;
          function draw() {
            const ID = shockley(VGS, IDSS, VP);
            L.innerHTML = plot({ w: 300, h: 260, x: [-5, 0], y: [0, 11], xt: [-5, -4, -3, -2, -1, 0], yt: [0, 2, 4, 6, 8, 10], xl: "V_GS (V)", yl: "I_D (mA)", series: [{ f: (v) => shockley(v, IDSS, VP), cls: "s1" }, { pts: [[VGS, ID], [0, ID]], cls: "s5" }], marks: [{ x: VGS, y: ID }], label: "Transfer curve" });
            R.innerHTML = plot({ w: 300, h: 260, x: [0, 15], y: [0, 11], xt: [0, 5, 10, 15], yt: [0, 2, 4, 6, 8, 10], xl: "V_DS (V)", series: [{ f: (v) => jfetID(VGS, v, IDSS, VP), cls: "s1" }, { pts: [[0, ID], [15, ID]], cls: "s5" }, ...[0, -1, -2, -3, -4].map((g) => ({ f: (v) => jfetID(g, v, IDSS, VP), cls: "s5" }))], label: "Drain curves" });
            ro.innerHTML = readout([["V<sub>GS</sub>", fmt(VGS, 2) + " V"], ["1 − V<sub>GS</sub>/V<sub>P</sub>", fmt(1 - VGS / VP, 3)], ["I<sub>D</sub>", fmt(ID, 3) + " mA"]]);
          }
          host.append(el(`<div class="two" style="align-items:start"></div>`));
          host.lastChild.append(L, R);
          host.append(slider({ id: id + "-gs", label: "V<sub>GS</sub>", min: -5, max: 0, step: 0.1, value: VGS, show: (v) => fmt(v, 2) + " V" }, (v) => { VGS = v; draw(); }).el, ro);
          draw();
        },
        `<p>Each drain curve's flat (saturation) level, carried across to the I<sub>D</sub> axis, gives one point on the transfer curve. Only the saturation levels count: the ohmic region is ignored.</p>`,
      ]},
      { k: "learn", title: "A property of the device", b: [
        `<div class="key">The transfer curve belongs to the <b>device</b>. The circuit around the JFET never changes it. In Chapter 7 you'll draw the circuit's own line on the same axes; the Q-point is where they cross.</div>`,
        `<p>Going backwards, from a current to the gate voltage that gives it:</p>`,
        `<div class="eq">V<sub>GS</sub> = V<sub>P</sub> (1 − √(I<sub>D</sub>/I<sub>DSS</sub>))</div>`,
      ]},
      { k: "math", title: "Minus signs", b: [
        `<p>V<sub>GS</sub>/V<sub>P</sub> is a negative over a negative, so it's positive. With V<sub>GS</sub> = −2 V and V<sub>P</sub> = −5 V: (−2)/(−5) = +0.4, and 1 − 0.4 = 0.6.</p>`,
        `<p class="aside">Drop one minus sign and you get 1 + 0.4 = 1.4, a current bigger than I<sub>DSS</sub>. If your answer exceeds I<sub>DSS</sub> for an n-channel JFET with negative V<sub>GS</sub>, a sign got lost.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>I<sub>DSS</sub> = 10 mA, V<sub>P</sub> = −5 V.</p>`,
        { t: "num", q: "I_D at V_GS = −2 V?", a: 3.6, unit: "mA", hint: "10 × (0.6)².", why: "10 × 0.36 = 3.6 mA." },
        { t: "num", q: "What V_GS gives I_D = 2.5 mA?", a: -2.5, unit: "V", hint: "√(2.5/10) = 0.5. Then V_P × (1 − 0.5).", why: "−5 × 0.5 = −2.5 V." },
        { t: "num", q: "I_D at V_GS = −4.5 V?", a: 0.1, unit: "mA", hint: "1 − 0.9 = 0.1. Square it.", why: "10 × 0.01 = 0.1 mA. Near pinch-off the current dies fast." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the JFET's transfer curve not a straight line, and what does that mean for equal steps of V_GS?", model: "Because Shockley's equation squares (1 − V_GS/V_P), the transfer curve is a parabola. Equal steps in V_GS give large steps in I_D near V_GS = 0 and much smaller steps near pinch-off. Unlike the BJT's I_C = βI_B, the control isn't proportional." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Sketch it fast: the shorthand", mins: 20,
    blurb: "Four memorized points give the whole transfer curve. Works for p-channel too.",
    takeaway: "Shorthand plot points: V_GS = 0 → I_DSS; V_GS = 0.3V_P → I_DSS/2; V_GS = 0.5V_P → I_DSS/4; V_GS = V_P → 0. (From Shockley: at V_P/2, (1 − 0.5)² = 0.25; for I_DSS/2, V_GS = V_P(1 − √0.5) = 0.293V_P.) Often V_P/2 plus the two end points is accurate enough. For p-channel, use Shockley's equation as is: V_P and V_GS are positive, and the curve is the mirror image.",
    steps: [
      { k: "learn", title: "Four points to remember", b: [
        `<div class="tbl"><table><tr><th>V<sub>GS</sub></th><th>I<sub>D</sub></th></tr><tr><td>0</td><td>I<sub>DSS</sub></td></tr><tr><td>0.3V<sub>P</sub></td><td>I<sub>DSS</sub>/2</td></tr><tr><td>0.5V<sub>P</sub></td><td>I<sub>DSS</sub>/4</td></tr><tr><td>V<sub>P</sub></td><td>0</td></tr></table></div>`,
        `<p>Why? At V<sub>GS</sub> = V<sub>P</sub>/2: (1 − ½)² = ¼. And for I<sub>DSS</sub>/2: V<sub>GS</sub> = V<sub>P</sub>(1 − √½) = 0.293V<sub>P</sub> ≈ 0.3V<sub>P</sub>.</p>`,
        `<p class="aside">These work for <b>any</b> JFET, whatever its V<sub>P</sub>.</p>`,
      ]},
      { k: "play", title: "Sketch versus exact", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let IDSS = 16, VP = -4, pch = false;
          function draw() {
            const vp = pch ? -VP : VP, pts = [[0, IDSS], [0.3 * vp, IDSS / 2], [0.5 * vp, IDSS / 4], [vp, 0]];
            const x = pch ? [0, 8] : [-8, 0], xt = pch ? [0, 2, 4, 6, 8] : [-8, -6, -4, -2, 0];
            f.innerHTML = plot({ x, y: [0, 22], xt, yt: [0, 5, 10, 15, 20], xl: "V_GS (V)", yl: "I_D (mA)", series: [{ f: (v) => shockley(v, IDSS, vp), from: Math.min(0, vp), to: Math.max(0, vp), cls: "s1" }, { pts: pts.slice().sort((a, b) => a[0] - b[0]), cls: "s5" }], marks: pts.map(([a, b]) => ({ x: a, y: b, cls: "mk2" })), label: "Transfer curve with the four shorthand points" });
            ro.innerHTML = readout(pts.map(([a, b]) => [`V<sub>GS</sub> = ${fmt(a, 3)} V`, fmt(b, 3) + " mA"]));
          }
          host.append(f, toggle(["n-channel", "p-channel"], (k) => { pch = k === 1; draw(); }, 0),
            slider({ id: id + "-i", label: "I<sub>DSS</sub>", min: 4, max: 20, step: 1, value: IDSS, show: (v) => v + " mA" }, (v) => { IDSS = v; draw(); }).el,
            slider({ id: id + "-p", label: "|V<sub>P</sub>|", min: 1, max: 8, step: 0.5, value: 4, show: (v) => v + " V" }, (v) => { VP = -v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Blue dots: the four shorthand points. Orange: the exact Shockley curve. The dashed grey joins the dots with straight lines; a smooth curve through the dots is all you need.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>n-channel JFET: I<sub>DSS</sub> = 16 mA, V<sub>P</sub> = −4 V. Use the shorthand.</p>`,
        { t: "num", q: "V_GS for I_D = 8 mA?", a: -1.2, unit: "V", hint: "I_DSS/2 → 0.3V_P.", why: "0.3 × (−4) = −1.2 V." },
        { t: "num", q: "I_D at V_GS = −2 V?", a: 4, unit: "mA", hint: "−2 V is V_P/2.", why: "I_DSS/4 = 4 mA." },
        `<p>p-channel JFET: I<sub>DSS</sub> = 6 mA, V<sub>P</sub> = +5 V.</p>`,
        { t: "num", q: "I_D at V_GS = +2.5 V?", a: 1.5, unit: "mA", hint: "Same shorthand, positive signs.", why: "V_P/2 gives I_DSS/4 = 1.5 mA. The curve is the mirror image of an n-channel one." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What are the four shorthand points for a JFET transfer curve?", model: "At V_GS = 0 the current is I_DSS. At 0.3V_P it is half of I_DSS. At half of V_P it is a quarter of I_DSS. At V_P it is zero. Plot those and draw a smooth curve through them." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Datasheets, curve tracers and the BJT comparison", mins: 25,
    blurb: "What a JFET datasheet tells you, where it's safe to operate, and the rules to start any analysis.",
    takeaway: "Datasheet sections: maximum ratings (V_DS, V_DG, V_GS, forward gate current I_GF), thermal (P_D = V_DS·I_D at 25 °C, derated per °C above), electrical (V_GS(off) = V_P and I_DSS, with wide ranges: the 2N5457 lists V_P from −0.5 to −6 V and I_DSS from 1 to 5 mA, so designs must tolerate the spread), and typical curves. Safe operating region: right of the ohmic region, left of V_DSmax, below I_DSS and under the P_D curve. A curve tracer shows I_DSS directly; estimate V_P from where I_D = I_DSS/2: V_P = V_GS/0.3. JFET vs BJT: I_G ≈ 0 vs V_BE ≈ 0.7 V; I_D = I_S vs I_C ≈ I_E; Shockley vs I_C = βI_B. For a JFET circuit, start with I_G = 0 and find V_GS first.",
    steps: [
      { k: "learn", title: "Reading a JFET datasheet", b: [
        `<div class="two"><div class="tile"><h3>Maximum ratings</h3><p>V<sub>DS</sub>, V<sub>DG</sub>, V<sub>GS</sub> limits. I<sub>GF</sub>: forward gate current it survives (10 mA for the book's 2N5457), though normally I<sub>G</sub> = 0. Stay well clear.</p></div><div class="tile"><h3>Thermal</h3><p>P<sub>D</sub> = V<sub>DS</sub>I<sub>D</sub> at 25 °C, then a derating in mW/°C above that.</p></div><div class="tile"><h3>Electrical</h3><p>V<sub>GS(off)</sub> (= V<sub>P</sub>) and I<sub>DSS</sub>, often as wide ranges.</p></div><div class="tile"><h3>Typical curves</h3><p>How parameters change with voltage, current, temperature and frequency.</p></div></div>`,
        `<div class="key">The 2N5457's V<sub>P</sub> can be anywhere from −0.5 V to −6 V, and I<sub>DSS</sub> from 1 to 5 mA, for parts with the same number. A design has to work across that spread.</div>`,
      ]},
      { k: "check", title: "Power and derating", b: [
        { t: "num", q: "A JFET sits at V_DS = 12 V, I_D = 4 mA. Power dissipated?", a: 48, unit: "mW", hint: "P_D = V_DS·I_D.", why: "12 × 4 = 48 mW." },
        { t: "num", q: "Rated 625 mW at 25 °C, derated 5 mW/°C. Allowed power at 75 °C?", a: 375, unit: "mW", hint: "50 °C above 25 °C, 5 mW each.", why: "625 − 250 = 375 mW." },
        `<p class="aside">Book slip: the text says the 2N5457 handles "650 mW at room temperature", but its own datasheet table lists 625 mW. (Chapter 3's 2N4123 had the same mix-up.)</p>`,
      ]},
      { k: "play", title: "The safe operating region", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), vd = el(`<span class="verdict"></span>`);
          let VDS = 10, VGS = -1;
          const IDSS = 10, VP = -5, Pmax = 60, VDSmax = 25;
          function draw() {
            const ID = jfetID(VGS, VDS, IDSS, VP);
            const series = [0, -1, -2, -3, -4].map((g) => ({ f: (v) => jfetID(g, v, IDSS, VP), cls: "s5" }));
            series.push({ f: (v) => Pmax / v, from: 4, cls: "s4" }, { pts: [[VDSmax, 0], [VDSmax, 12]], cls: "s4" });
            f.innerHTML = plot({ x: [0, 30], y: [0, 12], xt: [0, 5, 10, 15, 20, 25, 30], yt: [0, 2, 4, 6, 8, 10, 12], xl: "V_DS (V)", yl: "I_D (mA)", series,
              areas: [{ f: (v) => Math.min(IDSS, Pmax / v, (IDSS * v * v) / (VP * VP)), from: 0.01, to: VDSmax, cls: "ar3" }],
              marks: [{ x: VDS, y: ID }], texts: [{ x: 16, y: 5.2, s: "P_D max" }, { x: 25.3, y: 11, s: "V_DSmax" }], label: "Drain curves with the normal operating region shaded" });
            const P = VDS * ID, bad = VDS > VDSmax ? "V_DS is past V_DSmax." : P > Pmax ? `P_D = ${fmt(P, 3)} mW: over the ${Pmax} mW limit.` : VDS < VGS - VP ? "Ohmic region: fine as a resistor, but not for linear amplification." : "";
            vd.className = "verdict " + (bad ? "no" : "ok");
            vd.textContent = bad || `Inside the region. P_D = ${fmt(P, 3)} mW.`;
          }
          host.append(f, slider({ id: id + "-ds", label: "V<sub>DS</sub>", min: 0, max: 30, step: 0.5, value: VDS, show: (v) => v + " V" }, (v) => { VDS = v; draw(); }).el,
            slider({ id: id + "-gs", label: "V<sub>GS</sub>", min: -5, max: 0, step: 0.1, value: VGS, show: (v) => fmt(v, 2) + " V" }, (v) => { VGS = v; draw(); }).el, vd);
          draw();
        },
        `<p class="aside">Green: the region for linear amplifier design. Left edge: the pinch-off locus (ohmic region beyond it). Right: V<sub>DSmax</sub> = 25 V. Top: I<sub>DSS</sub>. The dashed curve: a 60 mW power limit.</p>`,
      ]},
      { k: "learn", title: "Reading a curve tracer", b: [
        `<p>No handheld meter measures I<sub>DSS</sub> or V<sub>P</sub>, but a curve tracer draws the drain curves. I<sub>DSS</sub> is the top curve's level. V<sub>P</sub> is harder: the curves crowd together near cutoff. Use the shorthand backwards:</p>`,
        `<div class="eq">find the V<sub>GS</sub> curve where I<sub>D</sub> ≈ I<sub>DSS</sub>/2, then V<sub>P</sub> = V<sub>GS</sub>/0.3</div>`,
        { t: "num", q: "A trace shows I_DSS = 12 mA, and the curve at V_GS = −1.2 V sits at 6 mA. Estimate V_P.", a: -4, unit: "V", hint: "6 mA is I_DSS/2, so −1.2 V = 0.3V_P.", why: "−1.2/0.3 = −4 V." },
        { t: "num", q: "With that V_P, predict I_D at V_GS = −3 V.", a: 0.75, unit: "mA", hint: "12(1 − 0.75)².", why: "12 × 0.0625 = 0.75 mA. Check it against the trace to confirm your V_P." },
      ]},
      { k: "learn", title: "JFET vs BJT: the starting rules", b: [
        `<div class="two"><div class="tile"><h3>JFET</h3><p>I<sub>G</sub> ≅ 0 A<br>I<sub>D</sub> = I<sub>S</sub><br>I<sub>D</sub> = I<sub>DSS</sub>(1 − V<sub>GS</sub>/V<sub>P</sub>)²<br>Find <b>V<sub>GS</sub></b> first.</p></div><div class="tile"><h3>BJT</h3><p>V<sub>BE</sub> ≅ 0.7 V<br>I<sub>C</sub> ≅ I<sub>E</sub><br>I<sub>C</sub> = βI<sub>B</sub><br>Find <b>I<sub>B</sub></b> first.</p></div></div>`,
        `<p>Chapter 7 builds on exactly these. I<sub>G</sub> = 0 is to the JFET what V<sub>BE</sub> = 0.7 V was to the BJT: the fact you start from.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a JFET design have to cope with a range of I_DSS and V_P?", model: "Because transistors with the same part number vary widely: one datasheet allows V_P anywhere from about −0.5 to −6 V and I_DSS from 1 to 5 mA. A circuit designed only for typical values might put a different sample at a very different operating point, so the design must work across the whole spread." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Depletion-type MOSFET", mins: 25,
    blurb: "An insulated gate over a built-in channel. Works with either polarity of V_GS.",
    takeaway: "MOSFET = metal–oxide–semiconductor FET (also IGFET). Depletion type (n-channel): a p-type substrate (SS), n-doped source and drain linked by a built-in n channel, and a metal gate insulated from the channel by a thin SiO_2 layer. No direct gate connection, so input resistance is even higher than a JFET's and I_G = 0. V_GS = 0 gives I_DSS. Negative V_GS repels electrons and attracts holes from the substrate (recombination): fewer carriers, less current (depletion mode). Positive V_GS draws in extra electrons: current rises above I_DSS (enhancement mode), fast, so watch the maximum ratings. Shockley's equation holds on both sides. p-channel: everything reversed, mirror-image curves. Symbols: a gap for the insulated gate; a solid channel line; substrate arrow in for n-channel. Datasheets add a point like I_D(on) at a positive V_GS.",
    steps: [
      { k: "learn", title: "Construction", b: [
        `<ul><li><b>Substrate</b>: a slab of p-type silicon (sometimes its own terminal, SS; often tied to the source).</li><li><b>Source and drain</b>: n-doped regions, joined by a built-in <b>n channel</b>.</li><li><b>Gate</b>: metal, separated from the channel by a very thin layer of <b>SiO<sub>2</sub></b>, an insulator (dielectric).</li></ul>`,
        `<div class="key">There's <b>no electrical connection</b> between gate and channel. That insulating layer gives the MOSFET its very high input impedance (higher than a JFET's) and I<sub>G</sub> = 0.</div>`,
        `<p class="aside">Metal (contacts), Oxide (SiO<sub>2</sub>), Semiconductor (the base): MOS. Also called an insulated-gate FET, IGFET.</p>`,
      ]},
      { k: "learn", title: "Both directions of V_GS", b: [
        `<div class="two"><div class="tile"><h3>V<sub>GS</sub> &lt; 0: depletion</h3><p>The gate repels electrons into the substrate and pulls holes up. They recombine; fewer free carriers; less current, down to cutoff at V<sub>P</sub>.</p></div><div class="tile"><h3>V<sub>GS</sub> &gt; 0: enhancement</h3><p>The gate draws extra electrons in from the substrate. More carriers; current rises above I<sub>DSS</sub>, quickly.</p></div></div>`,
        `<p>Shockley's equation still works, on <b>both</b> sides of zero. Just keep the sign of V<sub>GS</sub>.</p>`,
      ]},
      { k: "play", title: "Past I_DSS", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), vd = el(`<span class="verdict"></span>`), ro = el(`<div></div>`);
          let VGS = 0;
          const IDSS = 8, VP = -3, Imax = 20;
          function draw() {
            const ID = shockley(VGS, IDSS, VP);
            f.innerHTML = plot({ x: [-3.5, 2.5], y: [0, 26], xt: [-3, -2, -1, 0, 1, 2], yt: [0, 5, 10, 15, 20, 25], xl: "V_GS (V)", yl: "I_D (mA)",
              areas: [{ f: () => 26, base: Imax, from: -3.5, to: 2.5, cls: "ar1" }], series: [{ f: (v) => shockley(v, IDSS, VP), cls: "s1" }, { pts: [[-3.5, Imax], [2.5, Imax]], cls: "s4" }],
              marks: [{ x: VGS, y: Math.min(ID, 26) }], texts: [{ x: -1.8, y: 22.3, s: "over I_D(max)" }, { x: -2.6, y: 9, s: "depletion" }, { x: 0.3, y: 3, s: "enhancement" }], label: "Depletion MOSFET transfer curve extending to positive VGS" });
            ro.innerHTML = readout([["V<sub>GS</sub>", fmt(VGS, 2) + " V"], ["I<sub>D</sub>", fmt(ID, 3) + " mA"]]);
            vd.className = "verdict " + (ID > Imax ? "no" : VGS > 0 ? "mid" : "ok");
            vd.textContent = ID > Imax ? "Over the 20 mA maximum. A positive gate voltage can do this easily." : VGS > 0 ? "Enhancement mode: more current than I_DSS." : "Depletion mode: between cutoff and I_DSS, just like a JFET.";
          }
          host.append(f, slider({ id: id + "-gs", label: "V<sub>GS</sub>", min: -3.5, max: 2.5, step: 0.05, value: 0, show: (v) => fmt(v, 2) + " V" }, (v) => { VGS = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">This MOSFET: I<sub>DSS</sub> = 8 mA, V<sub>P</sub> = −3 V, rated for 20 mA.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "I_DSS = 8 mA, V_P = −3 V. I_D at V_GS = +1 V?", a: 14.22, unit: "mA", tol: 0.01, hint: "1 − (+1)/(−3) = 1 + 1/3.", why: "8 × (4/3)² = 14.2 mA: nearly double I_DSS for just +1 V." },
        { t: "num", q: "At what V_GS does it reach its 20 mA rating?", a: 1.743, unit: "V", tol: 0.01, hint: "(1 − V_GS/V_P)² = 20/8 = 2.5. Take the square root.", why: "√2.5 = 1.581, so V_GS/3 = 0.581: V_GS = +1.74 V." },
        `<p class="aside">Be cautious when choosing positive values to plug in: the current climbs steeply.</p>`,
      ]},
      { k: "learn", title: "p-channel, symbols, datasheets", b: [
        fig(S.svg(380, 130, mosfet(90, 65, { labels: 1 }) + S.t(100, 125, "n-channel", { cls: "a s" }) + mosfet(270, 65, { labels: 1, p: 1 }) + S.t(280, 125, "p-channel", { cls: "a s" }), { max: 380, label: "Depletion MOSFET symbols with a solid channel line" })),
        `<p>The gap between the gate line and the channel shows the insulation. The <b>solid</b> channel line means a channel exists with no bias. The substrate arrow points <b>in</b> for n-channel. (Here the substrate is tied to the source; some symbols show it as a separate SS lead.)</p>`,
        `<p>p-channel: n-type substrate, p channel, everything reversed; the transfer curve is the mirror image about the I<sub>D</sub> axis. Datasheets add a point beyond I<sub>DSS</sub>, such as I<sub>D(on)</sub> = 9 mA at V<sub>GS</sub> = 3.5 V for the book's 2N3797.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a depletion-type MOSFET differ from a JFET in what V_GS it accepts?", model: "A JFET only works with V_GS between pinch-off and zero, because a forward-biased gate junction would conduct. The depletion MOSFET's gate is insulated, so V_GS can also go positive, pulling extra electrons into the channel and raising the current above I_DSS. Shockley's equation covers both sides." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const enhID = (VGS, VDS, k, VT) => {
    const Vov = VGS - VT;
    if (Vov <= 0 || VDS <= 0) return 0;
    return VDS < Vov ? k * (2 * Vov * VDS - VDS * VDS) : k * Vov * Vov;
  };
  const p8 = {
    id: "p8", title: "Enhancement-type MOSFET", mins: 25,
    blurb: "No channel until the gate voltage builds one. Threshold V_T, then a square law with constant k.",
    takeaway: "Enhancement type (n-channel): same construction but no built-in channel. With V_GS = 0 there are two back-to-back reverse-biased junctions: I_D ≈ 0. A positive V_GS pushes holes away from the oxide and attracts the substrate's minority electrons; at the threshold V_T (V_GS(Th) on datasheets) they form an induced n channel. Above V_T: I_D = k(V_GS − V_T)², with k = I_D(on)/(V_GS(on) − V_T)². Saturation starts at V_DSsat = V_GS − V_T (from V_DG = V_DS − V_GS). Below V_T, I_D = 0. Shockley's equation does not apply. p-channel: everything reversed (V_T and V_GS negative). Symbol: dashed channel line. Notation traps: this V_T is a threshold, not Chapter 1's thermal voltage; and 6.002's K/2 = this book's k.",
    steps: [
      { k: "learn", title: "No channel to start with", b: [
        `<p>Same parts as the depletion type, minus the built-in channel. With V<sub>GS</sub> = 0, the n-doped drain and source are separated by p-type substrate: two back-to-back reverse-biased junctions. <b>I<sub>D</sub> ≈ 0.</b></p>`,
        `<p>Make the gate positive. It pushes holes away from the oxide (a depletion region) and attracts the substrate's minority electrons, which pile up against the oxide. At the <b>threshold voltage V<sub>T</sub></b> there are enough of them to form an <b>induced n channel</b>.</p>`,
        `<div class="key"><b>Notation trap:</b> in Chapter 1, V<sub>T</sub> was the thermal voltage (26 mV). Here V<sub>T</sub> is the MOSFET's <b>threshold</b> (datasheets: V<sub>GS(Th)</sub>). Same letters, different quantity.</div>`,
      ]},
      { k: "learn", title: "The square law", b: [
        seen("The SCS model: i_D = (K/2)(v_GS − V_T)² in saturation.", "07-mosfet-amplifier.html#p3", "Chapter 7, Part 3"),
        `<div class="eq">I<sub>D</sub> = k (V<sub>GS</sub> − V<sub>T</sub>)²  for V<sub>GS</sub> &gt; V<sub>T</sub>    k = I<sub>D(on)</sub> / (V<sub>GS(on)</sub> − V<sub>T</sub>)²</div>`,
        `<div class="key"><b>Notation trap:</b> this book's <b>k</b> is 6.002's <b>K/2</b>.</div>`,
        `<p>The channel pinches off at the drain end once V<sub>DG</sub> = V<sub>DS</sub> − V<sub>GS</sub> gets small enough, at</p>`,
        `<div class="eq">V<sub>DSsat</sub> = V<sub>GS</sub> − V<sub>T</sub></div>`,
      ]},
      { k: "play", title: "Drain curves and transfer curve", b: [
        (host, id) => {
          const L = el(`<div class="fig"></div>`), R = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let VGS = 6;
          const VT = 2, k = 6 / 36;
          function draw() {
            const ID = enhID(VGS, 20, k, VT);
            L.innerHTML = plot({ w: 300, h: 260, x: [0, 9], y: [0, 9], xt: [0, 2, 4, 6, 8], yt: [0, 2, 4, 6, 8], xl: "V_GS (V)", yl: "I_D (mA)", series: [{ f: (v) => (v > VT ? k * (v - VT) * (v - VT) : 0), cls: "s1" }, { pts: [[VGS, ID], [9, ID]], cls: "s5" }], marks: [{ x: VGS, y: ID }], texts: [{ x: 2.1, y: 0.5, s: "V_T" }], label: "Enhancement MOSFET transfer curve" });
            R.innerHTML = plot({ w: 300, h: 260, x: [0, 15], y: [0, 9], xt: [0, 5, 10, 15], yt: [0, 2, 4, 6, 8], xl: "V_DS (V)", series: [...[3, 4, 5, 6, 7, 8].map((g) => ({ f: (v) => enhID(g, v, k, VT), cls: "s5" })), { f: (v) => enhID(VGS, v, k, VT), cls: "s1" }, { f: (v) => k * v * v, to: 7, cls: "s4" }], marks: [{ x: VGS - VT, y: ID, cls: "mk2" }], label: "Enhancement MOSFET drain curves with the VDSsat locus" });
            ro.innerHTML = readout([["V<sub>GS</sub>", fmt(VGS, 2) + " V"], ["I<sub>D</sub> = k(V<sub>GS</sub> − V<sub>T</sub>)²", fmt(ID, 3) + " mA"], ["V<sub>DSsat</sub> = V<sub>GS</sub> − V<sub>T</sub>", fmt(Math.max(0, VGS - VT), 3) + " V"]]);
          }
          host.append(el(`<div class="two" style="align-items:start"></div>`));
          host.lastChild.append(L, R);
          host.append(slider({ id: id + "-gs", label: "V<sub>GS</sub>", min: 0, max: 9, step: 0.1, value: VGS, show: (v) => fmt(v, 2) + " V" }, (v) => { VGS = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">This MOSFET: V<sub>T</sub> = 2 V and I<sub>D</sub> = 6 mA at V<sub>GS</sub> = 8 V. Grey: V<sub>GS</sub> = 3 to 8 V. Red dashed: the V<sub>DSsat</sub> locus. Notice the spacing between curves <b>grows</b> with V<sub>GS</sub>, the opposite of the JFET.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "V_T = 2 V, I_D(on) = 6 mA at V_GS(on) = 8 V. What's k, in mA/V²?", a: 0.1667, unit: "mA/V²", tol: 0.01, hint: "6 mA / (8 − 2)².", why: "6/36 = 0.167 mA/V² = 0.167 × 10⁻³ A/V²." },
        { t: "num", q: "I_D at V_GS = 5 V?", a: 1.5, unit: "mA", hint: "k × (5 − 2)².", why: "0.1667 × 9 = 1.5 mA." },
        { t: "num", q: "At V_GS = 6 V, from what V_DS is it in saturation?", a: 4, unit: "V", hint: "V_GS − V_T.", why: "6 − 2 = 4 V." },
        { t: "num", q: "A datasheet: V_GS(Th) = 3 V (average), I_D(on) = 5 mA at V_GS(on) = 10 V. k, in mA/V²?", a: 0.102, unit: "mA/V²", tol: 0.01, hint: "5/(10 − 3)².", why: "5/49 = 0.102 mA/V². Datasheets give a point like this instead of k itself." },
      ]},
      { k: "learn", title: "p-channel and symbols", b: [
        fig(S.svg(380, 130, mosfet(90, 65, { labels: 1, enh: 1 }) + S.t(100, 125, "n-channel", { cls: "a s" }) + mosfet(270, 65, { labels: 1, p: 1, enh: 1 }) + S.t(280, 125, "p-channel", { cls: "a s" }), { max: 380, label: "Enhancement MOSFET symbols with a dashed channel line" })),
        `<p>The only difference from the depletion symbol: the channel line is <b>dashed</b>, because there's no channel until you build one. p-channel: n substrate, p regions, everything reversed; V<sub>T</sub> and V<sub>GS</sub> negative, the transfer curve mirrored.</p>`,
        `<p class="aside">The "off" leakage I<sub>DSS</sub> of an enhancement MOSFET is tiny (nA), not the mA of a JFET. Same symbol name, very different meaning.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is an enhancement-type MOSFET off when V_GS = 0?", model: "There's no built-in channel. The n-type drain and source are separated by p-type substrate, forming two reverse-biased junctions, so almost no current flows. Only when the gate is made positive enough, past the threshold V_T, does it attract enough electrons to the surface to induce a conducting n channel." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Handling MOSFETs, and power MOSFETs", mins: 20,
    blurb: "A gate oxide so thin static can punch through it. And vertical MOSFETs that switch amps.",
    takeaway: "The thin SiO_2 layer can be broken down by static charge. Keep the shorting ring or foil on until the part is installed, touch ground first, hold the case, and switch power off before changing parts (transients). Back-to-back Zeners between gate and source clamp V_GS at either polarity (at the cost of a little input resistance). Power MOSFETs (VMOS with a V groove, UMOS/trench with a U groove) run the channel vertically: much shorter channels and wider current paths give low on-resistance, amps of current and over 10 W, faster switching (under half a BJT's switching time) and a positive temperature coefficient (resistance rises when hot, so current falls: no thermal runaway). Their large area brings large capacitances (C_iss in the thousands of pF for UMOS), which matter above about 100 kHz.",
    steps: [
      { k: "learn", title: "Static is the enemy", b: [
        `<p>The oxide layer that gives the MOSFET its huge input resistance is extremely thin. Static charge picked up from your surroundings can put enough voltage across it to break it down permanently.</p>`,
        `<ul><li>Leave the <b>shorting ring or foil</b> on the leads until the part is in the circuit. It holds every terminal pair at 0 V.</li><li>Touch ground before handling. Pick it up by the case.</li><li>Turn the power <b>off</b> before inserting or removing parts: the transients can exceed the ratings.</li></ul>`,
      ]},
      { k: "learn", title: "Zener protection", b: [
        `<p>Many MOSFETs have two Zeners back to back between gate and source. A transient of either polarity is clamped: one Zener breaks down, the other conducts forward.</p>`,
        ch(2, "02-diode-applications.html", "p13", "Part 13", "Back-to-back Zeners clip at V_Z by the book's convention."),
        { t: "num", q: "Two 24 V Zeners protect a gate. A +35 V transient arrives. Using the book's convention (forward-biased Zener = short), what's the most V_GS can reach?", a: 24, unit: "V", hint: "One Zener sits at V_Z, the other is treated as 0 V.", why: "24 V. A real forward drop would add about 0.7 V." },
        `<p class="aside">The price: a Zener's off resistance is lower than the oxide's, so input resistance drops. It's still high enough for most uses.</p>`,
      ]},
      { k: "learn", title: "Going vertical: VMOS and UMOS", b: [
        `<p>Ordinary (planar) MOSFETs handle under about 1 W. <b>Power MOSFETs</b> turn the channel on its side: current flows <b>vertically</b> from the source on top to the drain substrate below.</p>`,
        `<div class="two"><div class="tile"><h3>VMOS</h3><p>A V-shaped groove. Channel length set by a thin diffused layer: far shorter than a planar channel's 1–2 µm. Two parallel paths.</p></div><div class="tile"><h3>UMOS (trench)</h3><p>A U-shaped groove: easier to make with consistent thresholds, no sharp tip (better breakdown), narrower cells (2–10 µm), lower on-resistance.</p></div></div>`,
        `<div class="key">Short, wide channels: low <b>on-resistance</b>, amps of drain current, over 10 W. Example: a UMOS family at 11–45 A with on-resistances of a few mΩ.</div>`,
      ]},
      { k: "predict", title: "Hot MOSFET, what next?", b: [
        { t: "mcq", q: "Power MOSFETs have a positive temperature coefficient of resistance. A power MOSFET heats up. What happens to its current, and why does that matter?", opts: [
          ["Its resistance rises, so its current falls: it cools itself, no thermal runaway", true, "A negative coefficient would do the opposite: hotter → lower resistance → more current → hotter. That spiral is thermal runaway."],
          ["Its current rises, heating it further", false, "That's the runaway that a positive coefficient prevents."],
          ["Nothing changes", false, "The resistance does change with temperature; the sign of the change is the point."],
        ]},
        `<p class="aside">Two more advantages: less stored charge, so they switch in under half the time of a typical BJT. The catch: big areas mean big capacitances (C<sub>iss</sub>, C<sub>rss</sub>, C<sub>oss</sub>; UMOS input capacitance runs to thousands of pF), important above about 100 kHz.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do vertical power MOSFETs have such low on-resistance?", model: "The channel runs vertically, so its length is set by a thin diffused layer and can be much shorter than a planar channel. The vertical structure also gives a wide current path and two parallel paths between drain and source. Shorter and wider means lower resistance." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  function cmosFig(vin) {
    const on = vin > 2.5;
    let s = S.wire([250, 20], [250, 50]) + S.t(262, 26, "V_SS = 5 V", { a: "start", cls: "s" }) + `<line class="w" x1="236" y1="20" x2="264" y2="20"/>`;
    s += `<g transform="translate(0,180) scale(1,-1)">${mosfet(232, 90, { enh: 1, p: 1 })}</g>` + S.t(286, 95, on ? "Q2 off: very high R" : "Q2 on: low R", { a: "start", cls: on ? "s m" : "s g" });
    s += mosfet(232, 210, { enh: 1 }) + S.t(286, 215, on ? "Q1 on: low R" : "Q1 off: very high R", { a: "start", cls: on ? "s g" : "s m" });
    s += S.wire([250, 130], [250, 170]) + S.dot(250, 150) + S.wire([250, 150], [330, 150]) + S.dot(330, 150) + S.t(340, 155, "V_o ≈ " + (on ? "0 V" : "5 V"), { a: "start", cls: "a" });
    s += S.wire([202, 90], [150, 90], [150, 210], [202, 210]) + S.dot(150, 150) + S.wire([150, 150], [90, 150]) + S.dot(90, 150) + S.t(80, 155, "V_i = " + vin + " V", { a: "end", cls: "a" });
    s += S.wire([250, 250], [250, 270]) + S.gnd(250, 270);
    return S.svg(460, 300, s, { max: 460, label: "CMOS inverter: p-channel MOSFET on top, n-channel below, gates joined" });
  }
  const p10 = {
    id: "p10", title: "CMOS and MESFETs", mins: 25,
    blurb: "A p- and an n-channel MOSFET sharing one input: logic that barely uses power. Then GaAs FETs for speed.",
    takeaway: "CMOS (complementary MOS): a p-channel and an n-channel MOSFET on one substrate. As an inverter, both gates take the input and both drains form the output; the p-channel source goes to V_SS, the n-channel source to ground. Input high: n-channel on (low R), p-channel off (V_GS = 0): output ≈ 0 V. Input low: the reverse: output ≈ V_SS. Either way one transistor is off, so only leakage flows: very low power, plus high input impedance and fast switching. MESFET: GaAs with a Schottky (metal–semiconductor) gate instead of an oxide. Lower gate capacitance and GaAs's high electron mobility make it fast (RF and high-speed logic). Depletion type behaves like a depletion MOSFET; enhancement type like an enhancement MOSFET but with V_T limited to about 0–0.4 V. Only n-channel MESFETs are sold (holes are slow in GaAs). Input resistance: JFET > 100 MΩ, MOSFET > 10¹⁰ Ω, MESFET > 10¹² Ω; capacitance 1–10 pF (MESFET 1–5 pF).",
    steps: [
      { k: "learn", title: "Complementary MOS", b: [
        seen("CMOS gates: a pull-up and a pull-down network, so no static power.", "11-energy-power-digital.html#p5", "Chapter 11, Part 5"),
        `<p>Build a p-channel and an n-channel enhancement MOSFET on the same substrate: <b>CMOS</b>. Join their gates (the input) and their drains (the output). p-channel source to V<sub>SS</sub>, n-channel source to ground.</p>`,
      ]},
      { k: "play", title: "The CMOS inverter", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          function draw(k) {
            const vin = k === 0 ? 0 : 5;
            f.innerHTML = cmosFig(vin);
            const Ron = 1e3, Roff = 1e9, R1 = vin ? Ron : Roff, R2 = vin ? Roff : Ron, Vo = (5 * R1) / (R1 + R2), I = 5 / (R1 + R2);
            ro.innerHTML = readout([["V<sub>GS1</sub> (n-channel)", vin + " V"], ["V<sub>GS2</sub> (p-channel)", (vin - 5) + " V"], ["V<sub>o</sub> = V<sub>SS</sub>R<sub>1</sub>/(R<sub>1</sub> + R<sub>2</sub>)", si(Vo, "V")], ["Current (leakage)", si(I, "A")], ["Power", si(5 * I, "W")]]);
          }
          host.append(f, toggle(["Input 0 V", "Input 5 V"], draw, 1), ro);
          draw(1);
        },
        `<p class="aside">Using 1 kΩ for an "on" transistor and 1 GΩ for an "off" one. The output is a voltage divider between them, and the current is limited by the off transistor to leakage. A few nanowatts.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Input at 0 V, V_SS = 5 V. What's V_GS of the p-channel MOSFET, and is it on?", opts: [
          ["−5 V: past its (negative) threshold, so it's on", true, "Gate at 0 V, source at 5 V: V_GS = −5 V. A p-channel enhancement MOSFET turns on with a negative V_GS beyond V_T. The output is pulled up to 5 V."],
          ["0 V: off", false, "That's the n-channel one: its gate and source are both at 0 V."],
          ["+5 V: on", false, "The gate is below the source, so V_GS is negative."],
        ]},
        { t: "mcq", q: "Why does a CMOS inverter use almost no power while it holds either state?", opts: [
          ["One of the two transistors is always off, so only leakage can flow from V_SS to ground", true, "Power is only drawn briefly while switching."],
          ["The MOSFETs have no resistance", false, "The on one has some resistance, but no current flows through it in steady state."],
          ["V_SS is only 5 V", false, "Even at higher voltages the series off transistor blocks the current."],
        ]},
      ]},
      { k: "learn", title: "MESFETs: GaAs for speed", b: [
        `<p>Making MOSFETs from gallium arsenide is hard, but a <b>metal–semiconductor</b> gate is easy: deposit a metal such as tungsten straight onto an n-type GaAs channel. That's a Schottky barrier (Chapter 16), and the device is a <b>MESFET</b>.</p>`,
        `<ul><li>No insulator, so the gate sits closer to the channel and the stray capacitance is lower.</li><li>GaAs electrons are very mobile. Together: fast. Used in RF and high-speed computer circuits.</li><li>Negative gate voltage pushes electrons away from the channel (less current); positive pulls more in.</li></ul>`,
        `<div class="two"><div class="tile"><h3>Depletion MESFET</h3><p>Built-in channel. Analyzed like a depletion MOSFET.</p></div><div class="tile"><h3>Enhancement MESFET</h3><p>No channel; like an enhancement MOSFET. But V<sub>T</sub> is only about 0–0.4 V: the Schottky gate itself conducts at about 0.7 V.</p></div></div>`,
        `<p class="aside">Only n-channel MESFETs are made: holes are slow in GaAs, which would throw away the speed advantage. Channel lengths: 0.1 to 1 µm.</p>`,
      ]},
      { k: "check", title: "The whole family", b: [
        { t: "sort", q: "Match each FET to its typical input resistance.", bins: ["> 100 MΩ", "> 10¹⁰ Ω", "> 10¹² Ω"], items: [
          ["JFET", 0, "The reverse-biased gate junction leaks a little."],
          ["Depletion or enhancement MOSFET", 1, "The oxide insulates the gate."],
          ["MESFET", 2, "The book's table gives MESFETs the highest input resistance."],
        ]},
        { t: "sort", q: "Which transfer law fits?", bins: ["Shockley: I_DSS(1 − V_GS/V_P)²", "k(V_GS − V_T)²"], items: [
          ["n-channel JFET", 0, "Between V_P and 0."],
          ["Depletion MOSFET", 0, "On both sides of zero."],
          ["Enhancement MOSFET", 1, "Zero below V_T."],
          ["Depletion MESFET", 0, "Analyzed like a depletion MOSFET."],
          ["Enhancement MESFET", 1, "Like an enhancement MOSFET, with a small V_T."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What makes a MESFET faster than a silicon MOSFET?", model: "It's made of gallium arsenide, where electrons move much faster than in silicon, and its gate is a metal–semiconductor Schottky contact with no insulating layer, which lowers the gate capacitance. Lower capacitance and faster carriers both help at high frequencies." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edc6", eyebrow: "Boylestad · Chapter 6", title: "Field-Effect Transistors",
    intro: `<p>Ten parts: the JFET from the inside out, its drain and transfer curves and Shockley's equation, datasheets, then depletion and enhancement MOSFETs, handling, power MOSFETs, CMOS and MESFETs.</p><p>6.002 treated the MOSFET as a switch and an amplifier with a square-law model. This chapter adds the JFET and depletion MOSFET, and shows what's going on inside each device.</p><p class="aside">The "Computer Analysis" section isn't covered. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's problems in the book. They test whether the ideas stuck, so don't expect them to look like the examples here.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10],
    summary: `
      <h3>JFET (n-channel)</h3>
      <div class="eq">I<sub>G</sub> = 0    I<sub>D</sub> = I<sub>S</sub>    I<sub>D</sub> = I<sub>DSS</sub>(1 − V<sub>GS</sub>/V<sub>P</sub>)²    V<sub>GS</sub> = V<sub>P</sub>(1 − √(I<sub>D</sub>/I<sub>DSS</sub>))</div>
      <p>V<sub>GS</sub> = 0 → I<sub>DSS</sub> (maximum). V<sub>GS</sub> = V<sub>P</sub> → 0 (cutoff). Pinch-off at V<sub>DS</sub> = V<sub>GS</sub> − V<sub>P</sub>. Datasheets: V<sub>P</sub> = V<sub>GS(off)</sub>.</p>
      <div class="eq">Shorthand: 0 → I<sub>DSS</sub>;  0.3V<sub>P</sub> → I<sub>DSS</sub>/2;  0.5V<sub>P</sub> → I<sub>DSS</sub>/4;  V<sub>P</sub> → 0</div>
      <div class="eq">Ohmic region: r<sub>d</sub> = r<sub>o</sub>/(1 − V<sub>GS</sub>/V<sub>P</sub>)²    P<sub>D</sub> = V<sub>DS</sub>I<sub>D</sub></div>
      <h3>MOSFETs</h3>
      <p>Depletion type: Shockley's equation on both sides of V<sub>GS</sub> = 0; positive V<sub>GS</sub> gives I<sub>D</sub> &gt; I<sub>DSS</sub>.</p>
      <div class="eq">Enhancement: I<sub>D</sub> = k(V<sub>GS</sub> − V<sub>T</sub>)² for V<sub>GS</sub> &gt; V<sub>T</sub>    k = I<sub>D(on)</sub>/(V<sub>GS(on)</sub> − V<sub>T</sub>)²    V<sub>DSsat</sub> = V<sub>GS</sub> − V<sub>T</sub></div>
      <p>Traps: V<sub>T</sub> here is the threshold, not the thermal voltage. k = 6.002's K/2. p-channel devices: reverse every polarity; the curves mirror.</p>
      <h3>Symbols</h3>
      <p>Arrow in = n-channel, out = p-channel. JFET: gate touches the channel. MOSFET: gap (insulated gate); solid channel = depletion, dashed = enhancement.</p>
      <h3>Others</h3>
      <p>Handle MOSFETs with care (static); back-to-back Zeners protect the gate. Power MOSFETs (VMOS/UMOS): low on-resistance, positive temperature coefficient, fast. CMOS: one transistor always off, so very low power. MESFET: GaAs, Schottky gate, n-channel only, fast.</p>`,
  };
  Course.start(window.CHAPTER);
})();
