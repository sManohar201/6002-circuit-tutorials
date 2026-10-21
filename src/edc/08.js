(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const ch = (n, file, part, where, html) => `<p class="aside">${html} <a href="${file}#${part}">Boylestad Chapter ${n}, ${where} →</a></p>`;
  const par = (...r) => 1 / r.reduce((a, x) => a + 1 / x, 0);
  const ohm = (r) => si(r, "Ω");
  const kohm = (k) => si(k * 1000, "Ω");
  const shock = (IDSS, VP) => (v) => (v / VP >= 1 ? 0 : IDSS * Math.pow(1 - v / VP, 2));

  /* Small-signal common-source model between a top rail (y=40) and a bottom rail (y=170).
     o.rin: label of the gate resistor (R_G, R_1 ∥ R_2).  o.rd: draw r_d.  o.rl: add a load.  o.rs: add V_s and R_sig. */
  function csFig(o = {}) {
    const T = 40, B = 170, M = 105;
    let s = S.vsrc(60, M, o.rs ? "V_s" : "V_i") + S.wire([60, M - 18], [60, T]) + S.wire([60, M + 18], [60, B]), x = 60;
    if (o.rs) { s += S.res(60, T, 140, T, "R_sig"); x = 140; s += S.t(146, T + 18, "V_i", { a: "start", cls: "a s" }); }
    const xr = x + 50, xg = xr + 70;
    s += S.wire([x, T], [xg, T]) + S.res(xr, T, xr, B, o.rin || "R_G", { side: "right" }) + S.dot(xr, T) + S.dot(xr, B);
    s += S.dot(xg, T) + S.t(xg, T - 8, "G", { cls: "s m" }) + S.t(xg + 6, M - 4, "+", { cls: "s" }) + S.t(xg + 4, M + 14, "V_gs", { a: "start", cls: "s c" }) + S.t(xg + 6, B - 14, "−", { cls: "s" }) + S.dot(xg, B) + S.t(xg, B + 18, "S", { cls: "s m" });
    const xi = xg + 90;
    s += S.isrc(xi, M, "g_m·V_gs", { down: true, side: "right" }) + S.wire([xi, M - 18], [xi, T]) + S.wire([xi, M + 18], [xi, B]) + S.t(xi, T - 8, "D", { cls: "s m" });
    let xe = xi + 30;
    const add = (lab, cls) => { xe += 75; s += S.res(xe, T, xe, B, lab, { side: "right", cls }) + S.dot(xe, T) + S.dot(xe, B); };
    if (o.rd !== false) add("r_d");
    add(o.rdLab || "R_D");
    if (o.rl) add("R_L", "hl");
    s += S.wire([xi, T], [xe + 40, T]) + S.dot(xe + 40, T) + S.t(xe + 40, T - 10, "V_o", { cls: "a" }) + S.wire([60, B], [xg - 20, B]) + S.wire([xi - 30, B], [xe + 40, B]);
    s += S.wire([xg - 20, B], [xi - 30, B]);
    return S.svg(xe + 70, 205, s, { max: xe + 70, label: o.label || "Small-signal model of a common-source FET amplifier" });
  }
  function waves(gain, o = {}) {
    const inv = gain < 0, A = 0.85, ai = o.ai != null ? o.ai : 0.3;
    return plot({ x: [0, 2], y: [-1.2, 1.2], xt: [0, 0.5, 1, 1.5, 2], yt: [0], ytf: () => "0", xl: "time (cycles)", h: 190,
      series: [{ f: (t) => ai * Math.sin(2 * Math.PI * t), cls: "s2" }, { f: (t) => (inv ? -1 : 1) * A * Math.sin(2 * Math.PI * t), cls: "s1" }],
      texts: [{ x: 0.27, y: ai + 0.12, s: "v_i" }, { x: inv ? 0.75 : 0.3, y: inv ? 1.0 : A + 0.12, s: "v_o" }], label: "Input and output waveforms" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Transconductance g_m", mins: 25,
    blurb: "The FET's version of β: how much the drain current moves per volt at the gate.",
    takeaway: "ΔI_D = g_mΔV_GS, so g_m = ΔI_D/ΔV_GS: the slope of the transfer curve at the Q-point (units: siemens). For a JFET or depletion MOSFET, differentiating Shockley gives g_m = (2I_DSS/|V_P|)(1 − V_GS/V_P) = g_m0(1 − V_GS/V_P), with g_m0 = 2I_DSS/|V_P| the maximum, at V_GS = 0. g_m falls in a straight line to 0 at V_GS = V_P; at V_P/2 it's g_m0/2. In terms of current: g_m = g_m0√(I_D/I_DSS) (at I_DSS/4, half of g_m0). Datasheets call it g_fs or y_fs (forward transfer conductance, source common).",
    steps: [
      { k: "learn", title: "From β to g_m", b: [
        `<p>A BJT turns a small base current into a big collector current: β. A FET turns a small <b>gate voltage</b> change into a drain current change: the <b>transconductance</b>.</p>`,
        `<div class="eq">ΔI<sub>D</sub> = g<sub>m</sub>ΔV<sub>GS</sub>    g<sub>m</sub> = ΔI<sub>D</sub>/ΔV<sub>GS</sub>    (siemens)</div>`,
        `<p class="aside">"Trans" because it links output to input; "conductance" because it's a current over a voltage, like 1/R.</p>`,
        seen("g_m as the slope of the MOSFET's square law at the operating point.", "08-small-signal-model.html#p2", "Chapter 8, Part 2"),
      ]},
      { k: "play", title: "The slope at the Q-point", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let VGS = -1.5;
          const IDSS = 12, VP = -6, g0 = (2 * IDSS) / Math.abs(VP);
          function draw() {
            const ID = shock(IDSS, VP)(VGS), gm = g0 * (1 - VGS / VP);
            f.innerHTML = plot({ x: [-6, 0.5], y: [0, 13], xt: [-6, -5, -4, -3, -2, -1, 0], yt: [0, 3, 6, 9, 12], xl: "V_GS (V)", yl: "I_D (mA)",
              series: [{ f: shock(IDSS, VP), to: 0, cls: "s1" }, { f: (v) => ID + gm * (v - VGS), from: VGS - 1.5, to: VGS + 1.5, cls: "s2" }], marks: [{ x: VGS, y: ID }], label: "Transfer curve with the tangent line whose slope is gm" });
            ro.innerHTML = readout([["V<sub>GS</sub>", fmt(VGS, 3) + " V"], ["I<sub>D</sub>", fmt(ID, 3) + " mA"], ["g<sub>m</sub> (slope of the blue line)", fmt(gm, 3) + " mS"], ["g<sub>m</sub>/g<sub>m0</sub>", fmt(gm / g0, 3)]]);
          }
          host.append(f, slider({ id: id + "-v", label: "Q-point V<sub>GS</sub>", min: -5.8, max: 0, step: 0.1, value: VGS, show: (v) => fmt(v, 2) + " V" }, (v) => { VGS = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">JFET: I<sub>DSS</sub> = 12 mA, V<sub>P</sub> = −6 V. The curve is steepest at V<sub>GS</sub> = 0 and flat at pinch-off.</p>`,
      ]},
      { k: "learn", title: "The formula", b: [
        `<p>The slope of a curve is its derivative. Differentiate Shockley's equation:</p>`,
        `<div class="eq">g<sub>m</sub> = (2I<sub>DSS</sub>/|V<sub>P</sub>|)(1 − V<sub>GS</sub>/V<sub>P</sub>) = g<sub>m0</sub>(1 − V<sub>GS</sub>/V<sub>P</sub>)    g<sub>m0</sub> = 2I<sub>DSS</sub>/|V<sub>P</sub>|</div>`,
        `<p>g<sub>m0</sub> is the biggest it gets, at V<sub>GS</sub> = 0. |V<sub>P</sub>| (magnitude) keeps g<sub>m</sub> positive.</p>`,
        `<p class="aside">Math boost: d/dx of (1 − x/a)² is 2(1 − x/a)·(−1/a). The chain rule brings down the inner derivative.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>I<sub>DSS</sub> = 12 mA, V<sub>P</sub> = −6 V.</p>`,
        { t: "num", q: "g_m0?", a: 4, unit: "mS", hint: "2I_DSS/|V_P|.", why: "24/6 = 4 mS." },
        { t: "num", q: "g_m at V_GS = −1.5 V?", a: 3, unit: "mS", hint: "g_m0(1 − V_GS/V_P) = 4(1 − 0.25).", why: "3 mS." },
        { t: "num", q: "g_m at V_GS = −3 V (that's V_P/2)?", a: 2, unit: "mS", hint: "Half of V_P...", why: "4 × 0.5 = 2 mS: half of g_m0. g_m falls in a straight line from g_m0 to 0." },
      ]},
      { k: "learn", title: "g_m from the current", b: [
        `<p>From Shockley, (1 − V<sub>GS</sub>/V<sub>P</sub>) = √(I<sub>D</sub>/I<sub>DSS</sub>). So:</p>`,
        `<div class="eq">g<sub>m</sub> = g<sub>m0</sub>√(I<sub>D</sub>/I<sub>DSS</sub>)</div>`,
        { t: "sort", q: "Match the bias point to its g_m.", bins: ["g_m0", "0.707g_m0", "0.5g_m0"], items: [
          ["I_D = I_DSS", 0, "√1 = 1."],
          ["I_D = I_DSS/2", 1, "√0.5 = 0.707."],
          ["I_D = I_DSS/4", 2, "√0.25 = 0.5."],
          ["V_GS = V_P/2", 2, "Same point as I_DSS/4."],
        ]},
        `<p class="aside">On datasheets: <b>g<sub>fs</sub></b> or <b>y<sub>fs</sub></b> (forward transfer conductance, source common). The 2N5457 lists 1 to 5 mS.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Where on the transfer curve is g_m largest, and why?", model: "At V_GS = 0, where the drain current is I_DSS, because the transfer curve is steepest there. g_m is the slope of the curve, and the slope falls steadily to zero at pinch-off." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "The FET ac model", mins: 20,
    blurb: "An open circuit at the gate, a current source g_mV_gs, and r_d. Simpler than the BJT's.",
    takeaway: "Input: the gate is effectively an open circuit, Z_i(FET) = ∞ (about 10⁹ Ω for JFETs, 10¹² to 10¹⁵ Ω for MOSFETs and MESFETs). Output: r_d = 1/g_os = 1/y_os, the inverse slope of the drain curve at the Q-point with V_GS constant: r_d = ΔV_DS/ΔI_D. Flatter curves mean bigger r_d (ideal: ∞). r_d is usually smaller nearer V_GS = 0. The model: an open gate, a current source g_mV_gs from drain to source (its direction gives the 180° inversion), and r_d in parallel. Lower-case subscripts (V_gs) mark ac quantities. No current gain is defined: the input current is zero.",
    steps: [
      { k: "learn", title: "Input and output", b: [
        `<div class="two"><div class="tile"><h3>Input</h3><p>The gate draws essentially nothing: <b>Z<sub>i</sub> = ∞</b> (about 10⁹ Ω for JFETs; 10¹² to 10¹⁵ Ω for MOSFETs).</p></div><div class="tile"><h3>Output</h3><p><b>r<sub>d</sub> = 1/g<sub>os</sub> = 1/y<sub>os</sub></b>: like a BJT's r<sub>o</sub>. Datasheets give g<sub>os</sub> in µS.</p></div></div>`,
        `<div class="eq">r<sub>d</sub> = ΔV<sub>DS</sub>/ΔI<sub>D</sub>  with V<sub>GS</sub> held constant</div>`,
        `<p>The flatter the drain curve at the Q-point, the bigger r<sub>d</sub>. A perfectly flat curve means r<sub>d</sub> = ∞, an open circuit, the usual approximation.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A datasheet gives g_os = 25 µS. r_d?", a: 40, unit: "kΩ", hint: "1/g_os.", why: "1/25 µS = 40 kΩ." },
        { t: "num", q: "On a drain curve, V_DS rises 6 V and I_D rises 0.15 mA. r_d?", a: 40, unit: "kΩ", hint: "ΔV_DS/ΔI_D.", why: "6/0.15 = 40 kΩ." },
        `<p class="aside">r<sub>d</sub> changes with the operating point: usually lower near V<sub>GS</sub> = 0, higher further down.</p>`,
      ]},
      { k: "learn", title: "The model", b: [
        fig(csFig({ rin: "R_G", rdLab: "R_D", label: "FET small-signal model inside a fixed-bias amplifier" })),
        `<ul><li>Gate to source: <b>nothing</b> (open).</li><li>Drain to source: a current source <b>g<sub>m</sub>V<sub>gs</sub></b> pointing from drain to source, and <b>r<sub>d</sub></b> beside it.</li></ul>`,
        `<p>The source's direction makes the output inverted: when V<sub>gs</sub> rises, more current is pulled down through R<sub>D</sub>, and V<sub>o</sub> falls.</p>`,
        `<div class="key">A voltage-controlled current source. Compare the BJT model: no βr<sub>e</sub> at the input, because there's no input current at all. So the current gain isn't defined for FETs.</div>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the FET small-signal model differ from the BJT r_e model?", model: "The FET's input is an open circuit, because the gate draws no current, so there's no input resistance like βr_e. The output is a current source controlled by the input voltage, g_mV_gs, rather than by an input current, with r_d in parallel playing the role of r_o." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Common source: fixed bias and bypassed self-bias", mins: 25,
    blurb: "Z_i = R_G, Z_o = R_D ∥ r_d, A_v = −g_m(r_d ∥ R_D). Modest gain, huge input impedance.",
    takeaway: "Fixed bias (and self-bias with R_S bypassed by C_S): Z_i = R_G (the FET adds nothing). Z_o = R_D ∥ r_d ≈ R_D if r_d ≥ 10R_D (set V_i = 0, so V_gs = 0 and the source opens). A_v = −g_m(r_d ∥ R_D) ≈ −g_mR_D: 180° phase shift. g_m comes from the DC Q-point: g_m = g_m0(1 − V_GSQ/V_P). Typical FET gains are far below a BJT's, but Z_i is megohms.",
    steps: [
      { k: "learn", title: "Read it off the model", b: [
        fig(csFig({ rin: "R_G" })),
        `<div class="eq">Z<sub>i</sub> = R<sub>G</sub>    Z<sub>o</sub> = R<sub>D</sub> ∥ r<sub>d</sub>    A<sub>v</sub> = −g<sub>m</sub>(r<sub>d</sub> ∥ R<sub>D</sub>) ≅ −g<sub>m</sub>R<sub>D</sub></div>`,
        `<p>Z<sub>o</sub>: set V<sub>i</sub> = 0, so V<sub>gs</sub> = 0 and g<sub>m</sub>V<sub>gs</sub> = 0: the source opens. A<sub>v</sub>: V<sub>gs</sub> = V<sub>i</sub>, and the source current flows up through r<sub>d</sub> ∥ R<sub>D</sub> opposite to V<sub>o</sub>.</p>`,
        fig(waves(-5)),
        `<p class="aside">Self-bias with C<sub>S</sub> across R<sub>S</sub>: the capacitor shorts R<sub>S</sub> for ac, so the model and the answers are identical.</p>`,
        ch(5, "05-bjt-ac-analysis.html", "p3", "Part 3", "Same structure as the BJT's A_v = −(R_C ∥ r_o)/r_e."),
      ]},
      { k: "play", title: "Common-source lab", b: [
        (host, id) => {
          const ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          const p = { VGG: 1.5, RD: 1.5, VDD: 20 };
          let useRd = true;
          const IDSS = 12, VP = -6, rd = 40;
          function draw() {
            const VGS = -p.VGG, ID = shock(IDSS, VP)(VGS), gm = ((2 * IDSS) / 6) * (1 - VGS / VP), Ro = useRd ? par(p.RD, rd) : p.RD, VDS = p.VDD - ID * p.RD;
            ro.innerHTML = readout([["I<sub>DQ</sub>", fmt(ID, 3) + " mA"], ["g<sub>m</sub>", fmt(gm, 3) + " mS"], ["Z<sub>i</sub> = R<sub>G</sub>", "1 MΩ"], ["Z<sub>o</sub>", kohm(Ro)], ["A<sub>v</sub>", fmt(-gm * Ro, 3)]]);
            const sat = VDS < VGS - VP;
            vd.className = "verdict " + (sat ? "no" : "ok");
            vd.textContent = sat ? `V_DS = ${fmt(Math.max(0, VDS), 3)} V is below pinch-off (${fmt(VGS - VP, 3)} V): the JFET is in its ohmic region and this gain isn't valid.` : `DC check: V_DS = ${fmt(VDS, 3)} V, in the saturation region.`;
          }
          host.append(slider({ id: id + "-g", label: "V<sub>GG</sub> (V<sub>GS</sub> = −V<sub>GG</sub>)", min: 0, max: 5, step: 0.1, value: p.VGG, show: (v) => fmt(v, 2) + " V" }, (v) => { p.VGG = v; draw(); }).el,
            slider({ id: id + "-rd", label: "R<sub>D</sub>", min: 0.5, max: 5, step: 0.1, value: p.RD, show: (v) => kohm(v) }, (v) => { p.RD = v; draw(); }).el,
            toggle(["Include r_d = 40 kΩ", "Ignore r_d"], (k) => { useRd = k === 0; draw(); }, 0), vd, ro);
          draw();
        },
        `<p class="aside">Fixed bias: I<sub>DSS</sub> = 12 mA, V<sub>P</sub> = −6 V, V<sub>DD</sub> = 20 V, R<sub>G</sub> = 1 MΩ. Raising R<sub>D</sub> raises the gain, until the DC drop across R<sub>D</sub> pushes the JFET out of saturation.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Lab defaults: V<sub>GG</sub> = 1.5 V, R<sub>D</sub> = 1.5 kΩ, r<sub>d</sub> = 40 kΩ.</p>`,
        { t: "num", q: "I_DQ?", a: 6.75, unit: "mA", hint: "12(1 − 1.5/6)².", why: "12 × 0.5625 = 6.75 mA." },
        { t: "num", q: "Z_o?", a: 1.446, unit: "kΩ", tol: 0.01, hint: "R_D ∥ r_d.", why: "1.5 ∥ 40 = 1.446 kΩ." },
        { t: "num", q: "A_v (with r_d)?", a: -4.337, tol: 0.01, hint: "g_m = 3 mS. −g_m(r_d ∥ R_D).", why: "−3 × 1.446 = −4.34. Ignoring r_d: −4.5, about 4% off (r_d is 27 R_D)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is a FET amplifier's input impedance simply R_G?", model: "Because the FET's gate draws no current, it looks like an open circuit. The only thing the signal source sees is the gate resistor R_G (or the divider resistors) connected from gate to ground." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Self-bias with R_S left in", mins: 20,
    blurb: "Take away the bypass capacitor and the gain drops by (1 + g_mR_S).",
    takeaway: "Self-bias, R_S unbypassed: Z_i = R_G. Z_o = R_D when r_d is ignored (exactly: [1 + g_mR_S + R_S/r_d]R_D/[1 + g_mR_S + R_S/r_d + R_D/r_d], ≈ R_D if r_d ≥ 10R_D). A_v = −g_mR_D/(1 + g_mR_S + (R_D + R_S)/r_d) ≈ −g_mR_D/(1 + g_mR_S) if r_d ≥ 10(R_D + R_S). The (1 + g_mR_S) factor is negative feedback: R_S's voltage subtracts from the input, like the BJT's unbypassed R_E. 180° phase shift.",
    steps: [
      { k: "learn", title: "R_S stays in the circuit", b: [
        `<p>Without C<sub>S</sub>, R<sub>S</sub> sits between the source and ground for the signal. The drain current flows through it, so V<sub>gs</sub> is no longer V<sub>i</sub>:</p>`,
        `<div class="eq">V<sub>gs</sub> = V<sub>i</sub> − I<sub>d</sub>R<sub>S</sub></div>`,
        `<p>The current fights its own cause: negative feedback. Solve it out (ignoring r<sub>d</sub> first):</p>`,
        `<div class="eq">A<sub>v</sub> = −g<sub>m</sub>R<sub>D</sub>/(1 + g<sub>m</sub>R<sub>S</sub>)    Z<sub>o</sub> = R<sub>D</sub>    Z<sub>i</sub> = R<sub>G</sub></div>`,
        ch(5, "05-bjt-ac-analysis.html", "p4", "Part 4", "The same trade as the BJT's unbypassed R_E: less gain, more stability."),
      ]},
      { k: "learn", title: "Including r_d", b: [
        `<div class="eq">A<sub>v</sub> = −g<sub>m</sub>R<sub>D</sub> / [1 + g<sub>m</sub>R<sub>S</sub> + (R<sub>D</sub> + R<sub>S</sub>)/r<sub>d</sub>]</div>`,
        `<p>If r<sub>d</sub> ≥ 10(R<sub>D</sub> + R<sub>S</sub>), the last term is small and you're back to −g<sub>m</sub>R<sub>D</sub>/(1 + g<sub>m</sub>R<sub>S</sub>). Z<sub>o</sub> stays ≈ R<sub>D</sub> whenever r<sub>d</sub> ≥ 10R<sub>D</sub>.</p>`,
      ]},
      { k: "play", title: "Bypass or not", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let RS = 0.68, byp = false;
          const IDSS = 10, VP = -5, RD = 2.7, rd = 50;
          function draw() {
            let lo = 0, hi = IDSS;
            for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (shock(IDSS, VP)(-m * RS) > m) lo = m; else hi = m; }
            const ID = (lo + hi) / 2, VGS = -ID * RS, gm = ((2 * IDSS) / 5) * (1 - VGS / VP);
            const Av = byp ? -gm * par(rd, RD) : (-gm * RD) / (1 + gm * RS + (RD + RS) / rd);
            ro.innerHTML = readout([["I<sub>DQ</sub>", fmt(ID, 3) + " mA"], ["V<sub>GSQ</sub>", fmt(VGS, 3) + " V"], ["g<sub>m</sub>", fmt(gm, 3) + " mS"], ["1 + g<sub>m</sub>R<sub>S</sub>", byp ? "(bypassed)" : fmt(1 + gm * RS, 3)], ["A<sub>v</sub>", fmt(Av, 3)]]);
          }
          host.append(toggle(["R_S unbypassed", "C_S across R_S"], (k) => { byp = k === 1; draw(); }, 0),
            slider({ id: id + "-rs", label: "R<sub>S</sub>", min: 0.1, max: 3, step: 0.02, value: RS, show: (v) => kohm(v) }, (v) => { RS = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The Chapter 7 self-bias circuit: I<sub>DSS</sub> = 10 mA, V<sub>P</sub> = −5 V, R<sub>D</sub> = 2.7 kΩ, r<sub>d</sub> = 50 kΩ. R<sub>S</sub> changes the Q-point too, so g<sub>m</sub> moves as you slide.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>R<sub>S</sub> = 680 Ω: from Chapter 7, I<sub>DQ</sub> = 3.196 mA and V<sub>GSQ</sub> = −2.173 V.</p>`,
        { t: "num", q: "g_m?", a: 2.262, unit: "mS", tol: 0.01, hint: "g_m0 = 4 mS; times (1 − 2.173/5).", why: "4 × 0.5654 = 2.26 mS." },
        { t: "num", q: "A_v, unbypassed, ignoring r_d?", a: -2.406, tol: 0.01, hint: "−g_mR_D/(1 + g_mR_S).", why: "−6.107/2.538 = −2.41." },
        { t: "num", q: "A_v with C_S in place (include r_d = 50 kΩ)?", a: -5.793, tol: 0.01, hint: "−g_m(r_d ∥ R_D).", why: "−2.262 × 2.562 = −5.79: the bypass capacitor more than doubles the gain." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does an unbypassed source resistor reduce the gain?", model: "The drain current also flows through R_S, raising the source voltage. That reduces the actual gate–source voltage below the input voltage, so less current change results: negative feedback. The gain falls by the factor 1 + g_mR_S." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Voltage divider and common gate", mins: 25,
    blurb: "The divider changes only Z_i. Common gate: low Z_i, positive gain, like the BJT's common base.",
    takeaway: "Voltage divider (R_S bypassed): Z_i = R_1 ∥ R_2, Z_o = r_d ∥ R_D, A_v = −g_m(r_d ∥ R_D) ≈ −g_mR_D. Common gate (input at the source, gate grounded): Z_i = R_S ∥ (r_d + R_D)/(1 + g_mr_d) ≈ R_S ∥ 1/g_m (low). Z_o = R_D ∥ r_d ≈ R_D. A_v = (g_mR_D + R_D/r_d)/(1 + R_D/r_d) ≈ g_mR_D, positive: input and output in phase.",
    steps: [
      { k: "learn", title: "Voltage divider", b: [
        `<p>Set V<sub>DD</sub> to zero and R<sub>1</sub> lands beside R<sub>2</sub>, both from gate to ground. Everything else matches fixed bias:</p>`,
        fig(csFig({ rin: "R_1 ∥ R_2" })),
        `<div class="eq">Z<sub>i</sub> = R<sub>1</sub> ∥ R<sub>2</sub>    Z<sub>o</sub> = r<sub>d</sub> ∥ R<sub>D</sub>    A<sub>v</sub> = −g<sub>m</sub>(r<sub>d</sub> ∥ R<sub>D</sub>)</div>`,
        { t: "num", q: "R_1 = 4.7 MΩ, R_2 = 1 MΩ. Z_i?", a: 0.8246, unit: "MΩ", tol: 0.01, hint: "Parallel.", why: "4.7 × 1/5.7 = 0.825 MΩ." },
      ]},
      { k: "learn", title: "Common gate", b: [
        `<p>Gate to ground; signal into the source across R<sub>S</sub>; output at the drain. Now the input and output aren't isolated: the signal source drives the channel directly.</p>`,
        `<div class="eq">Z<sub>i</sub> = R<sub>S</sub> ∥ (r<sub>d</sub> + R<sub>D</sub>)/(1 + g<sub>m</sub>r<sub>d</sub>) ≅ R<sub>S</sub> ∥ 1/g<sub>m</sub>    Z<sub>o</sub> = R<sub>D</sub> ∥ r<sub>d</sub></div>`,
        `<div class="eq">A<sub>v</sub> = (g<sub>m</sub>R<sub>D</sub> + R<sub>D</sub>/r<sub>d</sub>)/(1 + R<sub>D</sub>/r<sub>d</sub>) ≅ +g<sub>m</sub>R<sub>D</sub></div>`,
        fig(waves(8)),
        ch(5, "05-bjt-ac-analysis.html", "p6", "Part 6", "The BJT's common base: low Z_i, same-size gain, no inversion."),
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Common gate: g<sub>m</sub> = 2.5 mS, r<sub>d</sub> = 30 kΩ, R<sub>S</sub> = 1.2 kΩ, R<sub>D</sub> = 3.3 kΩ.</p>`,
        { t: "num", q: "Z_i, full formula?", a: 321, unit: "Ω", tol: 0.02, hint: "(r_d + R_D)/(1 + g_mr_d) = 33.3k/76 first.", why: "438 Ω ∥ 1.2 kΩ = 321 Ω. The shortcut R_S ∥ 1/g_m gives 300 Ω." },
        { t: "num", q: "A_v, full formula?", a: 7.532, tol: 0.01, hint: "R_D/r_d = 0.11.", why: "(8.25 + 0.11)/1.11 = 7.53. The shortcut g_mR_D = 8.25 is about 10% high, because r_d < 10R_D here." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the common-gate input impedance low, when FETs are famous for high input impedance?", model: "Because the signal goes into the source, not the gate. The source carries the full drain current, and the current changes by g_m for every volt of change, so looking into the source you see roughly 1/g_m, a few hundred ohms, in parallel with R_S." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Source follower", mins: 20,
    blurb: "Output from the source: gain just under 1, in phase, low output impedance.",
    takeaway: "Source follower (common drain): output at the source, drain at ac ground. Z_i = R_G. Z_o = r_d ∥ R_S ∥ 1/g_m ≈ R_S ∥ 1/g_m (r_d barely matters; 1/g_m usually dominates). A_v = g_m(r_d ∥ R_S)/[1 + g_m(r_d ∥ R_S)] ≈ g_mR_S/(1 + g_mR_S): always below 1, in phase.",
    steps: [
      { k: "learn", title: "Output from the source", b: [
        seen("The source follower: gain g_mR_S/(1 + g_mR_S), output resistance about 1/g_m.", "08-small-signal-model.html#p6", "Chapter 8, Part 6"),
        `<p>With V<sub>DD</sub> as ac ground, the drain is the common terminal: <b>common drain</b>. g<sub>m</sub>V<sub>gs</sub>, r<sub>d</sub> and R<sub>S</sub> all run from the source node to ground, in parallel. And V<sub>gs</sub> = V<sub>i</sub> − V<sub>o</sub>.</p>`,
        `<div class="eq">Z<sub>i</sub> = R<sub>G</sub>    Z<sub>o</sub> = r<sub>d</sub> ∥ R<sub>S</sub> ∥ 1/g<sub>m</sub>    A<sub>v</sub> = g<sub>m</sub>(r<sub>d</sub> ∥ R<sub>S</sub>)/[1 + g<sub>m</sub>(r<sub>d</sub> ∥ R<sub>S</sub>)]</div>`,
        `<div class="key">The gain's denominator is the numerator plus 1, so A<sub>v</sub> is always <b>less than 1</b>, and positive.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>g<sub>m</sub> = 3 mS, r<sub>d</sub> = 40 kΩ, R<sub>S</sub> = 1.8 kΩ, R<sub>G</sub> = 1 MΩ.</p>`,
        { t: "num", q: "Z_o, all three in parallel?", a: 279.3, unit: "Ω", tol: 0.01, hint: "1/g_m = 333 Ω.", why: "40k ∥ 1.8k ∥ 333 Ω = 279 Ω. Without r_d: 281 Ω. 1/g_m dominates." },
        { t: "num", q: "A_v, with r_d?", a: 0.8379, tol: 0.01, hint: "r_d ∥ R_S = 1.72 kΩ; g_m times that = 5.17.", why: "5.17/6.17 = 0.838. Without r_d: 5.4/6.4 = 0.844." },
        { t: "mcq", q: "Compare with a BJT emitter follower (A_v ≈ 0.99). Why is the FET follower's gain noticeably lower?", opts: [
          ["g_mR_S is only around 5, while the BJT's equivalent R_E/r_e is in the hundreds", true, "A_v = x/(1 + x). With x ≈ 5 you get 0.83; with x ≈ 200 you get 0.995. FETs have much lower g_m than BJTs at the same current."],
          ["The FET's input resistance is too high", false, "High Z_i doesn't lower the voltage gain."],
          ["The FET inverts the signal", false, "Both followers are in phase."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What sets the output impedance of a source follower?", model: "R_S, r_d and 1/g_m all appear in parallel at the source. r_d is usually large, and 1/g_m is usually the smallest of the three, so the output impedance is roughly 1/g_m in parallel with R_S: a few hundred ohms." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Depletion and enhancement MOSFETs", mins: 20,
    blurb: "Same ac model. Only g_m's formula changes for the enhancement type.",
    takeaway: "D-MOSFETs: identical model and equations to the JFET (Shockley still holds), but V_GSQ can be positive, so g_m can exceed g_m0: g_m = g_m0(1 − V_GSQ/V_P) with V_GSQ > 0. E-MOSFETs: same model (open gate, g_mV_gs, r_d = 1/g_os = 1/y_os, g_m = g_fs = y_fs). From I_D = k(V_GS − V_GS(Th))²: g_m = 2k(V_GSQ − V_GS(Th)). Equivalent form: g_m = 2√(kI_DQ). This matches 6.002's g_m = K(V_GS − V_T), since k = K/2.",
    steps: [
      { k: "learn", title: "Depletion type: g_m can pass g_m0", b: [
        `<p>Shockley's equation, and so g<sub>m</sub> = g<sub>m0</sub>(1 − V<sub>GS</sub>/V<sub>P</sub>), still apply. With a positive V<sub>GSQ</sub>, the bracket exceeds 1.</p>`,
        { t: "num", q: "I_DSS = 8 mA, V_P = −3 V, V_GSQ = +0.5 V. g_m?", a: 6.222, unit: "mS", tol: 0.01, hint: "g_m0 = 16/3 = 5.33 mS; (1 − 0.5/(−3)) = 1.167.", why: "5.33 × 1.167 = 6.22 mS: above g_m0." },
        `<p class="aside">Everything else (Z<sub>i</sub>, Z<sub>o</sub>, A<sub>v</sub> for each configuration) is exactly as for the JFET.</p>`,
      ]},
      { k: "learn", title: "Enhancement type: a new g_m", b: [
        `<p>The model doesn't change. Differentiate the enhancement law instead:</p>`,
        `<div class="eq">I<sub>D</sub> = k(V<sub>GS</sub> − V<sub>GS(Th)</sub>)²    →    g<sub>m</sub> = 2k(V<sub>GSQ</sub> − V<sub>GS(Th)</sub>) = 2√(k·I<sub>DQ</sub>)</div>`,
        `<div class="key">6.002 wrote g<sub>m</sub> = K(V<sub>GS</sub> − V<sub>T</sub>). With k = K/2, that's the same as 2k(V<sub>GS</sub> − V<sub>T</sub>).</div>`,
        { t: "num", q: "The Chapter 7 feedback-bias MOSFET: k = 0.2 mA/V², V_GS(Th) = 3 V, V_GSQ = 7.21 V. g_m?", a: 1.683, unit: "mS", tol: 0.01, hint: "2 × 0.2 × (7.21 − 3).", why: "1.68 mS. Check: 2√(0.2 × 3.54) = 1.68 mS too." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's different about finding g_m for an enhancement MOSFET?", model: "Its transfer law is I_D = k(V_GS − V_GS(Th))² rather than Shockley's equation, so its slope is g_m = 2k(V_GSQ − V_GS(Th)). The rest of the small-signal model, and the analysis of each configuration, is the same as for a JFET." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  function dfFig() {
    const T = 50, B = 180;
    let s = S.vsrc(50, 115, "V_i") + S.wire([50, 97], [50, T], [150, T]) + S.wire([50, 133], [50, B], [460, B]);
    s += S.dot(150, T) + S.t(150, T - 10, "G", { cls: "s m" }) + S.t(158, 115, "V_gs", { a: "start", cls: "s c" }) + S.dot(150, B);
    s += S.wire([150, T], [150, 20]) + S.res(150, 20, 300, 20, "R_F") + S.wire([300, 20], [300, T]);
    s += S.isrc(300, 115, "g_m·V_gs", { down: true, side: "right" }) + S.wire([300, 97], [300, T], [460, T]) + S.wire([300, 133], [300, B]) + S.dot(300, T) + S.t(312, T + 14, "D", { a: "start", cls: "s m" });
    s += S.res(380, T, 380, B, "r_d", { side: "right" }) + S.res(440, T, 440, B, "R_D", { side: "right" }) + S.dot(380, T) + S.dot(440, T) + S.dot(380, B) + S.dot(440, B) + S.t(470, T - 6, "V_o", { a: "start", cls: "a" });
    return S.svg(510, 210, s, { max: 510, label: "Drain-feedback E-MOSFET amplifier model: RF from drain back to gate" });
  }
  const p8 = {
    id: "p8", title: "E-MOSFET drain feedback and divider", mins: 20,
    blurb: "R_F does nothing for DC, but for ac it's the only thing separating input from output.",
    takeaway: "Drain-feedback E-MOSFET: R_F carries no DC current (so V_GS = V_DS), but for ac it links output to input. Z_i = (R_F + r_d ∥ R_D)/[1 + g_m(r_d ∥ R_D)] ≈ R_F/(1 + g_mR_D) (Miller effect: R_F divided by about 1 + |A_v|). Z_o = R_F ∥ r_d ∥ R_D ≈ R_D. A_v = −g_m(R_F ∥ r_d ∥ R_D) ≈ −g_mR_D. E-MOSFET voltage divider: identical to the JFET divider: Z_i = R_1 ∥ R_2, Z_o = r_d ∥ R_D, A_v = −g_m(r_d ∥ R_D).",
    steps: [
      { k: "learn", title: "R_F matters for ac", b: [
        fig(dfFig()),
        `<p>For DC, R<sub>F</sub> could be replaced by a wire (no gate current). For ac it can't: without it, input and output would be joined and V<sub>o</sub> = V<sub>i</sub>. It's a high resistance between them.</p>`,
        `<div class="eq">Z<sub>i</sub> = (R<sub>F</sub> + r<sub>d</sub> ∥ R<sub>D</sub>)/[1 + g<sub>m</sub>(r<sub>d</sub> ∥ R<sub>D</sub>)] ≅ R<sub>F</sub>/(1 + g<sub>m</sub>R<sub>D</sub>)</div>`,
        `<div class="eq">Z<sub>o</sub> = R<sub>F</sub> ∥ r<sub>d</sub> ∥ R<sub>D</sub> ≅ R<sub>D</sub>    A<sub>v</sub> = −g<sub>m</sub>(R<sub>F</sub> ∥ r<sub>d</sub> ∥ R<sub>D</sub>) ≅ −g<sub>m</sub>R<sub>D</sub></div>`,
        ch(5, "05-bjt-ac-analysis.html", "p7", "Part 7", "Same story as BJT collector feedback: R_F looks |A_v| times smaller from the input."),
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>g<sub>m</sub> = 1.68 mS, r<sub>d</sub> = 50 kΩ, R<sub>D</sub> = 2.2 kΩ, R<sub>F</sub> = 10 MΩ.</p>`,
        { t: "num", q: "Z_i, full formula, in MΩ?", a: 2.2, unit: "MΩ", tol: 0.02, hint: "r_d ∥ R_D = 2.107 kΩ; g_m × that = 3.54.", why: "(10 M + 2.1 k)/4.54 = 2.2 MΩ. A 10 MΩ resistor appears as 2.2 MΩ." },
        { t: "num", q: "A_v?", a: -3.546, tol: 0.01, hint: "−g_m(R_F ∥ r_d ∥ R_D), and R_F hardly matters in that parallel.", why: "−1.683 × 2.107 = −3.55. The shortcut −g_mR_D gives −3.70." },
      ]},
      { k: "learn", title: "E-MOSFET divider: nothing new", b: [
        `<p>Swap a JFET for an E-MOSFET in the divider circuit and the ac network is identical:</p>`,
        `<div class="eq">Z<sub>i</sub> = R<sub>1</sub> ∥ R<sub>2</sub>    Z<sub>o</sub> = r<sub>d</sub> ∥ R<sub>D</sub>    A<sub>v</sub> = −g<sub>m</sub>(r<sub>d</sub> ∥ R<sub>D</sub>) ≅ −g<sub>m</sub>R<sub>D</sub></div>`,
        `<p class="aside">Only g<sub>m</sub> is calculated differently: 2k(V<sub>GSQ</sub> − V<sub>GS(Th)</sub>).</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In the drain-feedback circuit, why is Z_i much smaller than R_F?", model: "Because R_F connects the input to an output that swings in the opposite direction, about g_mR_D times as much. The voltage across R_F is roughly (1 + g_mR_D) times the input voltage, so it draws that much more current: from the input it looks like R_F divided by (1 + g_mR_D)." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Designing for a gain", mins: 20,
    blurb: "Run the equations backwards. Watch how DC choices shape the ac result.",
    takeaway: "Design usually fixes V_DD, the FET and the capacitors, and asks for resistors that give a gain or impedance. Start with the approximate equations, pick standard values, then check with the full ones. Remember DC and ac interact: g_m is larger near V_GS = 0 (so a small R_S), R_G is irrelevant for DC but sets Z_i and isolation for ac. Fixed bias at V_GSQ = 0: g_m = g_m0, so R_D ∥ r_d = |A_v|/g_m0. Self-bias bypassed: choose V_GSQ (e.g. V_P/4 for a high g_m), find I_D and g_m, then R_D ∥ r_d = |A_v|/g_m and R_S = −V_GSQ/I_DQ. Unbypassed: |A_v| = g_mR_D/(1 + g_mR_S), then check r_d ≥ 10(R_D + R_S).",
    steps: [
      { k: "learn", title: "Backwards, with care", b: [
        `<ol><li>Pick an operating point (it sets g<sub>m</sub>).</li><li>Use the approximate gain formula to find the resistor.</li><li>Round to a standard value; check the condition you assumed (like r<sub>d</sub> ≥ 10R<sub>D</sub>).</li></ol>`,
        `<div class="key">For parallel combinations, solve R<sub>D</sub> ∥ r<sub>d</sub> = X for R<sub>D</sub>: R<sub>D</sub> = X·r<sub>d</sub>/(r<sub>d</sub> − X).</div>`,
      ]},
      { k: "check", title: "Design 1: fixed bias at V_GS = 0", b: [
        `<p>I<sub>DSS</sub> = 12 mA, V<sub>P</sub> = −6 V, r<sub>d</sub> = 40 kΩ. You want A<sub>v</sub> = −12 with V<sub>GSQ</sub> = 0.</p>`,
        { t: "num", q: "R_D ∥ r_d must be?", a: 3, unit: "kΩ", hint: "At V_GS = 0, g_m = g_m0 = 4 mS.", why: "12/4 mS = 3 kΩ." },
        { t: "num", q: "R_D?", a: 3.243, unit: "kΩ", tol: 0.01, hint: "3 × 40/(40 − 3).", why: "3.24 kΩ: use 3.3 kΩ." },
      ]},
      { k: "check", title: "Design 2: self-bias, bypassed", b: [
        `<p>Same JFET. You want |A<sub>v</sub>| = 6, operating at V<sub>GSQ</sub> = V<sub>P</sub>/4 = −1.5 V (a high g<sub>m</sub>).</p>`,
        { t: "num", q: "I_DQ?", a: 6.75, unit: "mA", hint: "Shockley at −1.5 V.", why: "12 × 0.75² = 6.75 mA. g_m = 3 mS." },
        { t: "num", q: "R_D?", a: 2.105, unit: "kΩ", tol: 0.01, hint: "R_D ∥ r_d = 6/3 mS = 2 kΩ. Then solve for R_D.", why: "2 × 40/38 = 2.11 kΩ: use 2.2 kΩ (slightly more gain)." },
        { t: "num", q: "R_S, in Ω?", a: 222.2, unit: "Ω", tol: 0.01, hint: "R_S sets the DC point: −V_GSQ/I_DQ.", why: "1.5/6.75 mA = 222 Ω: use 220 Ω. C_S hides it from the ac." },
      ]},
      { k: "check", title: "Design 3: take C_S away", b: [
        { t: "num", q: "Same Q-point (R_S = 222 Ω, g_m = 3 mS), C_S removed. R_D for |A_v| = 6 (ignore r_d)?", a: 3.333, unit: "kΩ", tol: 0.01, hint: "6 = g_mR_D/(1 + g_mR_S).", why: "1 + 0.667 = 1.667; R_D = 6 × 1.667/3 = 3.33 kΩ. Then check r_d = 40 kΩ ≥ 10(3.3 + 0.22) = 35 kΩ: OK." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do DC choices matter for an ac design?", model: "Because the small-signal parameters depend on the operating point: g_m is set by where you bias the FET, and that comes from DC resistors like R_S. Resistors that seem unimportant for DC, like R_G, set the ac input impedance. So the DC and ac designs have to be balanced together." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "Loads, sources and cascades", mins: 25,
    blurb: "Same two-port rules as for BJTs, but simpler: the gate isolates input from output.",
    takeaway: "All the two-port equations from Chapter 5 apply: A_vL = [R_L/(R_L + R_o)]A_vNL, A_vs = [R_i/(R_i + R_sig)]A_vL, A_i = −A_vL·Z_i/R_L, and |A_vNL| > |A_vL| > |A_vs|. For FETs, the gate's isolation means Z_i generally doesn't depend on R_L and Z_o doesn't depend on R_sig (except feedback circuits like drain feedback). Bypassed self-bias with a load: A_vL = −g_m(r_d ∥ R_D ∥ R_L), Z_i = R_G, Z_o = r_d ∥ R_D. Cascades: multiply the loaded gains; stage 1's load is stage 2's Z_i. FET–FET: A_v ≈ (g_m1R_D1)(g_m2R_D2), Z_i = R_G1, Z_o = R_D2. FET–BJT: the FET gives a huge Z_i, the BJT the big gain, but the BJT's low Z_i loads the FET stage.",
    steps: [
      { k: "learn", title: "Two-port, again", b: [
        ch(5, "05-bjt-ac-analysis.html", "p9", "Part 9", "The two-port model: R_i, R_o and the no-load gain."),
        fig(csFig({ rin: "R_G", rs: true, rl: true })),
        `<div class="eq">A<sub>vL</sub> = −g<sub>m</sub>(r<sub>d</sub> ∥ R<sub>D</sub> ∥ R<sub>L</sub>)    A<sub>vs</sub> = [R<sub>G</sub>/(R<sub>G</sub> + R<sub>sig</sub>)]A<sub>vL</sub> ≅ A<sub>vL</sub></div>`,
        `<div class="key">The gate draws nothing, so the load can't reach back to change Z<sub>i</sub>, and the source resistance can't change Z<sub>o</sub>. (Feedback circuits like drain feedback are the exception.) With R<sub>G</sub> in MΩ, R<sub>sig</sub> hardly matters.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Bypassed self-bias: g<sub>m</sub> = 3 mS, R<sub>D</sub> = 2.2 kΩ, r<sub>d</sub> = 40 kΩ, R<sub>G</sub> = 1 MΩ. Load R<sub>L</sub> = 4.7 kΩ, source R<sub>sig</sub> = 10 kΩ.</p>`,
        { t: "num", q: "A_vL?", a: -4.333, tol: 0.01, hint: "All three in parallel: 2.2k ∥ 4.7k ∥ 40k.", why: "1.444 kΩ × 3 mS = −4.33." },
        { t: "num", q: "A_vs?", a: -4.29, tol: 0.01, hint: "Multiply by 1 MΩ/(1 MΩ + 10 kΩ).", why: "0.990 × −4.33 = −4.29. A BJT stage with Z_i ≈ 1 kΩ would lose 90% of the signal to that 10 kΩ source." },
      ]},
      { k: "learn", title: "Cascades", b: [
        `<p>Stage 1's load is stage 2's input. Two FET stages: stage 2's Z<sub>i</sub> is a megohm R<sub>G</sub>, so it barely loads stage 1:</p>`,
        `<div class="eq">A<sub>v</sub> = A<sub>v1</sub>A<sub>v2</sub> ≅ (−g<sub>m1</sub>R<sub>D1</sub>)(−g<sub>m2</sub>R<sub>D2</sub>)    Z<sub>i</sub> = R<sub>G1</sub>    Z<sub>o</sub> = R<sub>D2</sub></div>`,
        { t: "num", q: "Two identical stages: g_m = 3 mS, R_D = 2.2 kΩ, next stage's R_G = 1 MΩ. Overall gain (ignore r_d)?", a: 43.46, tol: 0.01, hint: "Stage 1: −3 × (2.2k ∥ 1M). Stage 2: −3 × 2.2k.", why: "(−6.59)(−6.6) = +43.5. Two inversions: positive." },
        `<p>A FET in front of a BJT gets you a huge Z<sub>i</sub> plus the BJT's big gain. But the BJT's input (around 1 kΩ) heavily loads the FET's drain.</p>`,
        { t: "num", q: "FET stage (g_m = 3 mS, R_D = 2.2 kΩ) drives a BJT stage with Z_i = 1.2 kΩ and A_v = −250. Overall gain?", a: 582.4, tol: 0.01, hint: "Stage 1 loaded: −3 × (2.2k ∥ 1.2k).", why: "Stage 1: −2.33. Total: (−2.33)(−250) = 582." },
        `<p class="aside">Book slip: Example 8.17 takes stage 2's gain "from Example 5.18", but Example 5.18 is the feedback pair; the RC-coupled BJT stage is Example 5.15.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why are FET amplifiers less affected by source resistance than BJT amplifiers?", model: "Because a FET amplifier's input impedance is usually megohms, set by R_G or the divider, so the voltage divider formed with the source resistance passes nearly all of the signal. A BJT stage often has an input impedance around a kilohm, so a source resistance of a few kilohms throws away most of the signal." },
      ]},
    ],
  };

  /* =============== PART 11 =============== */
  const p11 = {
    id: "p11", title: "Troubleshooting, mixers and silent switches", mins: 25,
    blurb: "Check the obvious first. Then: why JFET mixers need isolation resistors, and JFETs as switches.",
    takeaway: "Troubleshooting a small-signal amplifier: look for obvious damage (scorched areas, hot parts, bad joints), check DC voltages against the expected values, then trace an ac test signal from input to output with a scope (shape, polarity, amplitude, full cycle). No ac output: check the supply, that V_D is mid-range, that there's signal at the gate, and both sides of each coupling capacitor. JFET mixer: all channels can share one gate because Z_i is so high, but series isolation resistors (100 kΩ) keep a low-impedance source from swamping a high-impedance one (and from driving power back into it: a microphone can even act as a speaker). Silent switching: a JFET at V_GS = 0 is a low resistance (about 100 Ω), past pinch-off an open circuit (up to 10 GΩ). It's bilateral and DC-controlled, so it replaces noisy mechanical switches; an RC on the gate ignores spikes.",
    steps: [
      { k: "learn", title: "A troubleshooting routine", b: [
        `<ol><li>Look: scorched areas, components too hot to touch, poor solder joints, loose connections.</li><li>DC: compare voltages with the expected values.</li><li>ac: inject a test signal, follow it from input toward output.</li><li>At the faulty stage, scope the waveform: shape, polarity, amplitude, frequency, glitches, full cycle present?</li></ol>`,
        { t: "sort", q: "No ac output. Put the checks in a sensible category.", bins: ["Power and DC", "Signal path"], items: [
          ["Is the supply connected?", 0, "Check the obvious first."],
          ["Is V_D somewhere between 0 and V_DD?", 0, "A drain stuck at 0 or V_DD means no proper bias."],
          ["Is there an ac signal at the gate?", 1, "If not, the problem is before the FET."],
          ["Is there signal on both sides of each coupling capacitor?", 1, "An open capacitor passes nothing."],
        ]},
        `<p class="aside">In the lab: measure resistor values (overheated ones drift), make sure all grounds are common, and measure the input signal you're actually applying.</p>`,
      ]},
      { k: "play", title: "A three-channel mixer", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const Rm = 12, Rg = 0.6;
          function draw(k) {
            const R = k === 0 ? 0 : 100, a = R + Rm, b = R + Rg, wm = b / (a + b), wg = a / (a + b);
            const bar = (v, y, cls, lab) => `<rect x="150" y="${y}" width="${Math.max(1, v * 320)}" height="22" style="fill:var(--${cls})"/>` + S.t(140, y + 16, lab, { a: "end", cls: "s" }) + S.t(156 + Math.max(1, v * 320), y + 16, fmt(v, 3), { a: "start", cls: "s" });
            f.innerHTML = S.svg(560, 90, bar(wm, 10, "cool", "microphone") + bar(wg, 50, "accent", "guitar"), { max: 560, label: "Share of each source at the JFET gate" });
            ro.innerHTML = readout([["Isolation resistor", R ? "100 kΩ each" : "none"], ["v<sub>G</sub>", `${fmt(wm, 3)}·v<sub>mic</sub> + ${fmt(wg, 3)}·v<sub>guitar</sub>`]]);
          }
          host.append(f, toggle(["No isolation resistors", "100 kΩ isolation resistors"], draw, 0), ro);
          draw(0);
        },
        `<p>A microphone with 12 kΩ inside and a guitar amp with 600 Ω inside feed one JFET gate (the JFET's input is essentially open, so it doesn't load either). Superposition gives each source's share.</p>`,
        `<p class="aside">Without isolation, the low-impedance guitar swamps the mic, and can even push power back into it: a microphone is built like a small speaker and may start playing the guitar. With 100 kΩ in each line, both look nearly alike: an even mix.</p>`,
      ]},
      { k: "learn", title: "The silent switch", b: [
        `<p>Mechanical switches in audio lines make "pfft" noises and pick up interference on their long wires. A JFET can switch instead:</p>`,
        `<div class="two"><div class="tile"><h3>ON: V<sub>GS</sub> = 0</h3><p>R<sub>DS</sub> about 100 Ω. Next to a 47 kΩ series resistor, practically a short.</p></div><div class="tile"><h3>OFF: V<sub>GS</sub> = −10 V</h3><p>Past pinch-off: up to about 10 GΩ. An open circuit.</p></div></div>`,
        `<p>It's <b>bilateral</b> (passes signals both ways, unlike a diode) and controlled by DC, so it suits remote and computer control. In the book's two-channel summing amp, with both switches on, v<sub>o</sub> = −(v<sub>1</sub> + v<sub>2</sub>); with one on, v<sub>o</sub> ≈ −v<sub>1</sub>.</p>`,
        { t: "num", q: "The gate control goes through 2.2 MΩ to a 22 nF capacitor. Time constant, in ms?", a: 48.4, unit: "ms", hint: "τ = RC.", why: "2.2 MΩ × 22 nF = 48.4 ms. The slow gate means a short spike on the control line can't flip the switch." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why put a resistor in series with each input of a JFET mixer?", model: "Sources with different internal impedances, connected in parallel, don't mix evenly: the lowest-impedance source dominates the shared node. Large equal series resistors make every channel look about the same, so the signals mix in balance, and they stop one source from driving current into another." },
      ]},
    ],
  };

  /* =============== PART 12 =============== */
  const p12 = {
    id: "p12", title: "Phase shifters and motion detectors", mins: 20,
    blurb: "A JFET's resistance and a capacitor shift a signal's phase on command. And a FET that listens to body heat.",
    takeaway: "Phase-advance network (C in series, R_DS to ground): V_o = k_1V_i∠θ_1 with k_1 = R_DS/√(R_DS² + X_C²) and θ_1 = tan⁻¹(X_C/R_DS), from near 0° to almost 90°. Phase-retard network (R_DS in series, C to ground): k_2 = X_C/√(R_DS² + X_C²), θ_2 = −tan⁻¹(R_DS/X_C). R_DS is set by V_GS, so a DC voltage controls the phase; more phase shift costs amplitude. PIR motion detector: a pyroelectric element sees changing heat (a person crossing zones) as a slow ac-like signal with high internal impedance; a JFET source follower picks it up without loading it, followed by a low-frequency amplifier, a peak detector and comparator, and a driver. Steadily rising heat (a heater, a lamp) produces no alternating signal, so no alarm.",
    steps: [
      { k: "play", title: "A voltage-controlled phase shift", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let R = 3, adv = true;
          const XC = 1.447;
          function draw() {
            const mag = adv ? R / Math.hypot(R, XC) : XC / Math.hypot(R, XC), th = adv ? Math.atan(XC / R) : -Math.atan(R / XC);
            f.innerHTML = plot({ x: [0, 2], y: [-1.2, 1.2], xt: [0, 0.5, 1, 1.5, 2], yt: [0], ytf: () => "0", xl: "time (cycles)", h: 190, series: [{ f: (t) => Math.sin(2 * Math.PI * t), cls: "s2" }, { f: (t) => mag * Math.sin(2 * Math.PI * t + th), cls: "s1" }], texts: [{ x: 0.25, y: 1.08, s: "v_i" }], label: "Input and phase-shifted output" });
            ro.innerHTML = readout([["R<sub>DS</sub>", kohm(R)], ["X<sub>C</sub>", "1.447 kΩ"], ["Output size", fmt(mag, 3) + " × input"], ["Phase", fmt((th * 180) / Math.PI, 3) + "°"]]);
          }
          host.append(f, toggle(["Phase advance (C in series)", "Phase retard (R_DS in series)"], (k) => { adv = k === 0; draw(); }, 0),
            slider({ id: id + "-r", label: "R<sub>DS</sub> (set by V<sub>GS</sub>)", min: 0.2, max: 10, step: 0.1, value: R, show: (v) => kohm(v) }, (v) => { R = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">C = 0.022 µF at 5 kHz gives X<sub>C</sub> = 1.447 kΩ. Phase advance: shrink R<sub>DS</sub> and the phase grows toward 90°, but the output shrinks. That's the trade: angle against amplitude.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Phase advance with R_DS = 3 kΩ, X_C = 1.447 kΩ. Phase angle?", a: 25.75, unit: "°", tol: 0.01, hint: "tan⁻¹(X_C/R_DS).", why: "tan⁻¹(0.482) = 25.8°." },
        { t: "num", q: "Output magnitude, as a fraction of the input?", a: 0.9007, tol: 0.01, hint: "R_DS/√(R_DS² + X_C²).", why: "3/3.331 = 0.90." },
        { t: "mcq", q: "Keep R_DS fixed and raise the signal frequency. What happens to the advance network's phase shift?", opts: [
          ["It shrinks toward 0°: X_C falls", true, "Lower X_C relative to R_DS means less phase shift (and less loss). At low frequencies it approaches 90°."],
          ["It grows toward 90°", false, "That's what happens at lower frequencies."],
          ["Nothing", false, "X_C depends on frequency."],
        ]},
      ]},
      { k: "learn", title: "Passive infrared motion detection", b: [
        `<ol><li>A <b>pyroelectric</b> element makes a voltage that follows the heat falling on it. A filter passes only infrared; a parabolic reflector focuses one area's heat on it.</li><li>A person walking past crosses the sensor's zones: the heat level jumps up and down, a slow ac-like signal with a high internal impedance.</li><li>A <b>JFET source follower</b> picks it up without loading it (megohm input).</li><li>A low-frequency amplifier, a peak detector and a comparator decide whether the swing is big enough; a driver sets off the alarm.</li></ol>`,
        { t: "mcq", q: "Why doesn't switching on a heater or a lamp trigger it?", opts: [
          ["Their heat rises steadily: there's no alternating signal for the system to detect", true, "The detector responds to heat, not light, and the alarm chain only reacts to an oscillating signal."],
          ["The detector ignores all heat sources except people", false, "It can't tell what made the heat; it reacts to how the heat changes."],
          ["The JFET blocks DC", false, "The point is about the shape of the signal, rising versus alternating."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why use a JFET source follower right after the pyroelectric detector?", model: "The detector's signal comes from a source with a very high internal impedance. A JFET source follower has an input impedance of megohms, so it takes almost none of the signal's current and passes the voltage on with a low output impedance for the next stages." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edc8", eyebrow: "Boylestad · Chapter 8", title: "FET Amplifiers",
    intro: `<p>Twelve parts: the FET small-signal model (g<sub>m</sub> and r<sub>d</sub>), then Z<sub>i</sub>, Z<sub>o</sub> and A<sub>v</sub> for every common configuration, MOSFET versions, design, loads, cascades, troubleshooting and real circuits.</p><p>It mirrors Chapter 5 for the BJT, and builds on 6.002 Chapter 8. The gate's open circuit makes most of it simpler.</p><p class="aside">The "Computer Analysis" section isn't covered. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's problems in the book. They test whether the ideas stuck, so don't expect them to look like the examples here.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12],
    summary: `
      <h3>The model</h3>
      <div class="eq">g<sub>m</sub> = ΔI<sub>D</sub>/ΔV<sub>GS</sub> = g<sub>fs</sub> = y<sub>fs</sub>    g<sub>m0</sub> = 2I<sub>DSS</sub>/|V<sub>P</sub>|    g<sub>m</sub> = g<sub>m0</sub>(1 − V<sub>GS</sub>/V<sub>P</sub>) = g<sub>m0</sub>√(I<sub>D</sub>/I<sub>DSS</sub>)</div>
      <div class="eq">E-MOSFET: g<sub>m</sub> = 2k(V<sub>GSQ</sub> − V<sub>GS(Th)</sub>)    r<sub>d</sub> = 1/g<sub>os</sub> = 1/y<sub>os</sub> = ΔV<sub>DS</sub>/ΔI<sub>D</sub>    gate: open circuit</div>
      <h3>Configurations</h3>
      <div class="eq">Fixed / bypassed self-bias: Z<sub>i</sub> = R<sub>G</sub>, Z<sub>o</sub> = R<sub>D</sub> ∥ r<sub>d</sub>, A<sub>v</sub> = −g<sub>m</sub>(r<sub>d</sub> ∥ R<sub>D</sub>)    Divider: Z<sub>i</sub> = R<sub>1</sub> ∥ R<sub>2</sub></div>
      <div class="eq">Unbypassed R<sub>S</sub>: Z<sub>o</sub> ≅ R<sub>D</sub>, A<sub>v</sub> = −g<sub>m</sub>R<sub>D</sub>/[1 + g<sub>m</sub>R<sub>S</sub> + (R<sub>D</sub> + R<sub>S</sub>)/r<sub>d</sub>] ≅ −g<sub>m</sub>R<sub>D</sub>/(1 + g<sub>m</sub>R<sub>S</sub>)</div>
      <div class="eq">Common gate: Z<sub>i</sub> = R<sub>S</sub> ∥ (r<sub>d</sub> + R<sub>D</sub>)/(1 + g<sub>m</sub>r<sub>d</sub>) ≅ R<sub>S</sub> ∥ 1/g<sub>m</sub>, Z<sub>o</sub> = R<sub>D</sub> ∥ r<sub>d</sub>, A<sub>v</sub> ≅ +g<sub>m</sub>R<sub>D</sub></div>
      <div class="eq">Source follower: Z<sub>i</sub> = R<sub>G</sub>, Z<sub>o</sub> = r<sub>d</sub> ∥ R<sub>S</sub> ∥ 1/g<sub>m</sub>, A<sub>v</sub> = g<sub>m</sub>(r<sub>d</sub> ∥ R<sub>S</sub>)/[1 + g<sub>m</sub>(r<sub>d</sub> ∥ R<sub>S</sub>)] &lt; 1</div>
      <div class="eq">Drain feedback: Z<sub>i</sub> = (R<sub>F</sub> + r<sub>d</sub> ∥ R<sub>D</sub>)/[1 + g<sub>m</sub>(r<sub>d</sub> ∥ R<sub>D</sub>)] ≅ R<sub>F</sub>/(1 + g<sub>m</sub>R<sub>D</sub>), Z<sub>o</sub> = R<sub>F</sub> ∥ r<sub>d</sub> ∥ R<sub>D</sub>, A<sub>v</sub> = −g<sub>m</sub>(R<sub>F</sub> ∥ r<sub>d</sub> ∥ R<sub>D</sub>)</div>
      <h3>Systems</h3>
      <div class="eq">A<sub>vL</sub> = −g<sub>m</sub>(r<sub>d</sub> ∥ R<sub>D</sub> ∥ R<sub>L</sub>)    A<sub>vs</sub> = [R<sub>G</sub>/(R<sub>G</sub> + R<sub>sig</sub>)]A<sub>vL</sub>    Cascade: A<sub>v</sub> = A<sub>v1</sub>A<sub>v2</sub> (loaded)</div>
      <p>Phase: common source and drain feedback invert; common gate and source follower don't. Typical FET gains 2–20.</p>
      <h3>Applications</h3>
      <div class="eq">Phase advance: k<sub>1</sub> = R<sub>DS</sub>/√(R<sub>DS</sub>² + X<sub>C</sub>²), θ<sub>1</sub> = tan⁻¹(X<sub>C</sub>/R<sub>DS</sub>)    Retard: k<sub>2</sub> = X<sub>C</sub>/√(R<sub>DS</sub>² + X<sub>C</sub>²), θ<sub>2</sub> = −tan⁻¹(R<sub>DS</sub>/X<sub>C</sub>)</div>`,
  };
  Course.start(window.CHAPTER);
})();
