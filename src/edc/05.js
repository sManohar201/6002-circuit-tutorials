(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  /* A short "you've already learned this" card that links back into the 6.002 book. */
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const ch = (n, file, part, where, html) => `<p class="aside">${html} <a href="${file}#${part}">Boylestad Chapter ${n}, ${where} →</a></p>`;
  const off = (s) => `<g opacity="0.3">${s}</g>`;
  const par = (...r) => 1 / r.reduce((a, x) => a + 1 / x, 0);
  const ohm = (r) => si(r, "Ω");
  const VT = 0.026;

  /* BJT symbol. Base lead from (x−30,y); collector ends at (x+22,y−50); emitter at (x+22,y+50). */
  function bjt(x, y, o = {}) {
    const c = o.cls ? " " + o.cls : "", L = Math.hypot(22, 19), ux = 22 / L, uy = 19 / L;
    let s = `<line class="w${c}" x1="${x - 30}" y1="${y}" x2="${x}" y2="${y}"/><line class="w${c}" x1="${x}" y1="${y - 20}" x2="${x}" y2="${y + 20}" style="stroke-width:3.5"/>`;
    s += `<polyline class="w${c}" points="${x},${y - 9} ${x + 22},${y - 28} ${x + 22},${y - 50}"/><polyline class="w${c}" points="${x},${y + 9} ${x + 22},${y + 28} ${x + 22},${y + 50}"/>`;
    const d = o.pnp ? -1 : 1, t = o.pnp ? 0.3 : 0.85, tx = x + 22 * t, ty = y + 9 + 19 * t, bx = tx - d * 9 * ux, by = ty - d * 9 * uy;
    s += `<polygon class="nd" points="${tx},${ty} ${bx - 5 * uy},${by + 5 * ux} ${bx + 5 * uy},${by - 5 * ux}"/>`;
    return s;
  }

  /* Small-signal common-emitter model drawn between a top rail (y=40) and a common bottom rail (y=170).
     o.rs: add V_s and R_s.  o.rin: label of the shunt resistor at the input (R_B, R′…).  o.zb: label of the base resistor.
     o.ro: draw r_o.  o.rc: collector resistor label.  o.rl: add a load.  o.zi / o.zo: show Z_i and Z_o markers. */
  function ceFig(o = {}) {
    const T = 40, B = 170, M = 105;
    let s = "", x = 60;
    s += S.vsrc(60, M, o.rs ? "V_s" : "V_i") + S.wire([60, M - 18], [60, T]) + S.wire([60, M + 18], [60, B]);
    if (o.rs) { s += S.res(60, T, 140, T, "R_s"); x = 140; s += S.t(146, T + 18, "V_i", { a: "start", cls: "a s" }); }
    const xr = x + 50, xb = o.rin ? xr + 80 : xr;
    s += S.wire([x, T], [xb, T]);
    if (o.rin) s += S.res(xr, T, xr, B, o.rin, { side: "right" }) + S.dot(xr, T) + S.dot(xr, B);
    s += S.res(xb, T, xb, B, o.zb || "βr_e", { side: "right" }) + S.t(xb, T - 8, "b", { cls: "s m" }) + S.t(xb - 12, B - 6, "e", { cls: "s m", a: "end" });
    const xi = xb + 110;
    s += S.isrc(xi, M, "βI_b", { down: true, side: "right" }) + S.wire([xi, M - 18], [xi, T]) + S.wire([xi, M + 18], [xi, B]) + S.t(xi, T - 8, "c", { cls: "s m" });
    let xe = xi;
    const add = (lab, cls) => { xe += 85; s += S.res(xe, T, xe, B, lab, { side: "right", cls }) + S.dot(xe, T) + S.dot(xe, B); };
    if (o.ro) add("r_o");
    if (o.rc !== null) add(o.rc || "R_C");
    if (o.rl) add("R_L", "hl");
    s += S.wire([xi, T], [xe + 40, T]) + S.dot(xe + 40, T) + S.t(xe + 40, T - 10, "V_o", { cls: "a" });
    s += S.wire([60, B], [xe + 40, B]) + S.dot(xe + 40, B);
    if (o.zi) s += S.t(xr - 14, B + 26, "Z_i →", { a: "end", cls: "c s" });
    if (o.zo) s += S.t(xe + 40, B + 26, "← Z_o", { a: "end", cls: "c s" });
    return S.svg(xe + 70, 205, s, { max: xe + 70, label: o.label || "Small-signal re model of a common-emitter amplifier" });
  }

  /* Input and output waveforms: v_i (small, blue) and v_o (orange), normalized. gain < 0 means inverted. */
  function waves(gain, o = {}) {
    const inv = gain < 0, A = o.big ? 1 : 0.85, ai = o.ai != null ? o.ai : 0.3;
    const out = (t) => (inv ? -1 : 1) * A * Math.sin(2 * Math.PI * t);
    return plot({ x: [0, 2], y: [-1.2, 1.2], xt: [0, 0.5, 1, 1.5, 2], yt: [0], ytf: () => "0", xl: "time (cycles)", h: o.h || 200,
      series: [{ f: (t) => ai * Math.sin(2 * Math.PI * t), cls: "s2" }, { f: out, cls: "s1" }],
      texts: [{ x: 0.27, y: ai + 0.12, s: o.li || "v_i" }, { x: inv ? 0.75 : 0.3, y: inv ? 1.0 : A + 0.12, s: o.lo || "v_o" }], label: "Input and output waveforms" });
  }

  /* The voltage-divider amplifier, drawn in four stages of being turned into its ac equivalent. */
  function acSteps(k) {
    const hi = (x) => (x ? "hl" : "");
    let s = "";
    const supply = S.supply(200, 40, "V_CC");
    s += k >= 1 ? off(supply) + S.t(210, 14, "V_CC → 0 V: top rail is ground", { a: "start", cls: "a s" }) : supply;
    s += S.wire([150, 40], [252, 40]) + (k >= 1 ? S.wc("hl", [150, 40], [252, 40]) : "");
    s += S.res(150, 40, 150, 170, "R_1", { side: "left" }) + S.res(252, 40, 252, 100, "R_C", { side: "left" }) + S.wire([252, 100], [252, 120]) + S.dot(252, 100);
    s += bjt(230, 170) + S.wire([150, 170], [200, 170]) + S.dot(150, 170);
    s += S.res(150, 170, 150, 290, "R_2", { side: "left" }) + S.gnd(150, 290);
    s += S.vsrc(40, 230, "v_i") + S.wire([40, 212], [40, 170], [70, 170]) + S.wire([40, 248], [40, 290]) + S.gnd(40, 290);
    s += k >= 2 ? S.wc("hl", [70, 170], [150, 170]) + S.wc("hl", [252, 100], [340, 100]) : S.cap(70, 170, 150, 170, "C_1") + S.cap(252, 100, 330, 100, "C_2", { side: "below" }) + S.wire([330, 100], [340, 100]);
    s += S.dot(340, 100) + S.t(350, 105, "v_o", { a: "start", cls: "a" });
    s += S.wire([252, 220], [252, 235]) + S.dot(252, 235) + S.wire([252, 235], [320, 235]) + S.wire([252, 300], [320, 300]) + S.gnd(286, 300);
    const re = S.res(252, 235, 252, 300, "R_E", { side: "left" });
    s += k >= 3 ? off(re) + S.t(238, 268, "✕", { cls: "b", a: "end" }) : k >= 2 ? re : re;
    s += k >= 2 ? S.wc("hl", [320, 235], [320, 300]) : S.cap(320, 235, 320, 300, "C_E", { side: "right" });
    return S.svg(430, 330, s, { max: 430, label: "Voltage-divider amplifier being reduced to its ac equivalent" });
  }
  function acRedrawn() {
    let s = S.vsrc(50, 150, "v_i") + S.wire([50, 132], [50, 60], [230, 60]) + S.wire([50, 168], [50, 250], [420, 250]);
    s += S.res(120, 60, 120, 250, "R_1", { side: "right" }) + S.res(190, 60, 190, 250, "R_2", { side: "right" }) + S.dot(120, 60) + S.dot(190, 60) + S.dot(120, 250) + S.dot(190, 250);
    s += S.wire([230, 60], [230, 150], [270, 150]) + bjt(300, 150) + S.wire([322, 200], [322, 250]) + S.wire([322, 100], [322, 60], [420, 60]);
    s += S.res(390, 60, 390, 250, "R_C", { side: "right" }) + S.dot(390, 60) + S.dot(390, 250) + S.dot(322, 250) + S.t(420, 50, "v_o", { cls: "a" });
    s += S.t(155, 285, "R′ = R_1 ∥ R_2", { cls: "s c" });
    return S.svg(460, 300, s, { max: 460, label: "The ac equivalent redrawn: R1 and R2 in parallel at the input, RC from collector to ground" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Where does the extra power come from?", mins: 20,
    blurb: "A small signal steers a big DC current. Then: how to turn an amplifier into its ac-only circuit.",
    takeaway: "An amplifier's output ac power can exceed its input ac power because the DC supply provides it: the transistor converts DC power into ac power under control of the small input. The ac swing can't go beyond the limits the DC level sets (it clips). The BJT amplifier is close enough to linear to use superposition: do the DC analysis first, then a separate ac analysis. One link remains: r_e in the ac model depends on the DC emitter current. To get the ac equivalent: (1) set DC supplies to zero (short to ground), (2) short the capacitors, (3) remove anything those shorts bypass, (4) redraw. Z_i looks into the input, Z_o looks back into the output; I_i and I_o are defined as flowing into the system, and Z_i = V_i/I_i, Z_o = V_o/I_o.",
    steps: [
      { k: "learn", title: "Power from nowhere?", b: [
        `<p>An amplifier's output signal carries more ac power than its input signal. Energy can't be created. So where does the extra come from?</p>`,
        `<div class="key">From the <b>DC supply</b>. The transistor acts as a valve: the tiny input signal opens and closes it, and the valve steers a big steady current from the supply into an ac current through the load.</div>`,
        `<div class="eq">efficiency η = P<sub>o(ac)</sub> / P<sub>i(dc)</sub>    (ac power to the load ÷ DC power supplied)</div>`,
      ]},
      { k: "play", title: "The valve and its limits", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), vd = el(`<span class="verdict"></span>`);
          let Idc = 2, Ipk = 1;
          function draw() {
            const iT = (t) => Math.max(0, Math.min(2 * Idc, Idc + Ipk * Math.sin(2 * Math.PI * t)));
            f.innerHTML = plot({ x: [0, 2], y: [0, 8], xt: [0, 0.5, 1, 1.5, 2], yt: [0, 2, 4, 6, 8], xl: "time (cycles)", yl: "i_T (mA)",
              series: [{ pts: [[0, Idc], [2, Idc]], cls: "s5" }, { f: iT, cls: "s1", n: 400 }], texts: [{ x: 1.55, y: Idc + 0.35, s: "I_dc" }], label: "Total current: DC level plus the ac swing" });
            const clip = Ipk > Idc;
            vd.className = "verdict " + (clip ? "no" : "ok");
            vd.textContent = clip ? "Clipped. The swing tried to go below zero current (and past the top limit). The DC level sets how big the ac swing can be." : "Clean: the ac swing rides on the DC level and stays inside it.";
          }
          host.append(f, slider({ id: id + "-dc", label: "DC level I<sub>dc</sub>", min: 1, max: 4, step: 0.1, value: 2, show: (v) => fmt(v, 2) + " mA" }, (v) => { Idc = v; draw(); }).el,
            slider({ id: id + "-ac", label: "Signal swing (peak)", min: 0, max: 4, step: 0.1, value: 1, show: (v) => fmt(v, 2) + " mA" }, (v) => { Ipk = v; draw(); }).el, vd);
          draw();
        },
        `<p class="aside">The flat tops are the circuit's limits: current can't go below zero, and can't go past what the supply and resistors allow. That's why DC design and ac design have to respect each other.</p>`,
      ]},
      { k: "learn", title: "Two analyses, one link", b: [
        seen("Small-signal analysis: bias at an operating point, then treat small wiggles with a linear circuit.", "08-small-signal-model.html#p3", "Chapter 8, Part 3"),
        `<p>The BJT amplifier is close enough to linear that <b>superposition</b> works. So you do the DC analysis first (Chapter 4), then a separate ac analysis.</p>`,
        `<div class="key">One thread ties them together: a part of the ac model, <b>r<sub>e</sub></b>, is set by the <b>DC</b> emitter current. You'll meet it in the next part.</div>`,
      ]},
      { k: "play", title: "Make the ac equivalent", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), note = el(`<p></p>`);
          const notes = [
            "The full amplifier. Capacitors C₁ and C₂ couple the signal in and out; C_E bypasses R_E.",
            "Step 1: set every DC supply to zero. V_CC becomes a short to ground, so R₁ and R_C now go to ground at the top.",
            "Step 2: replace every capacitor with a short. At signal frequencies their reactance is tiny.",
            "Step 3: remove anything a short bypasses. C_E shorts R_E, so R_E vanishes from the ac circuit.",
            "Step 4: redraw. R₁ and R₂ both run from base to ground: they're in parallel. R_C runs from collector to ground.",
          ];
          function draw(k) { f.innerHTML = k < 4 ? acSteps(k) : acRedrawn(); note.textContent = notes[k]; }
          host.append(f, toggle(["Start", "Step 1", "Step 2", "Step 3", "Step 4"], draw, 0), note);
          draw(0);
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "In the ac equivalent, why is R_C connected from the collector to ground?", opts: [
          ["Because its top end sat on V_CC, and V_CC becomes ground for ac", true, "A DC supply holds its voltage constant, so it has no ac voltage on it: for the signal it's the same as ground."],
          ["Because the capacitor shorts it", false, "No capacitor sits across R_C in this circuit."],
          ["Because the transistor grounds it", false, "The transistor sits between collector and emitter; R_C's other end goes to the supply rail."],
        ]},
        { t: "mcq", q: "Suppose C_E were left out of the circuit. What changes in the ac equivalent?", opts: [
          ["R_E stays in, between the emitter and ground", true, "Nothing shorts it any more. That changes the gain a lot, as Part 4 shows."],
          ["Nothing", false, "C_E was the only thing removing R_E."],
          ["R_C disappears", false, "C_E only touches the emitter side."],
        ]},
      ]},
      { k: "learn", title: "Directions and definitions", b: [
        `<p>Every system, from one transistor to a whole chip, gets the same four labels:</p>`,
        `<div class="two"><div class="tile"><h3>Z<sub>i</sub> = V<sub>i</sub>/I<sub>i</sub></h3><p>Impedance "looking into" the input.</p></div><div class="tile"><h3>Z<sub>o</sub> = V<sub>o</sub>/I<sub>o</sub></h3><p>Impedance "looking back into" the output, with the signal set to zero.</p></div></div>`,
        `<div class="key">By definition both <b>I<sub>i</sub> and I<sub>o</sub> flow <i>into</i> the system</b>. If the real output current flows out, its value gets a minus sign. That convention keeps Z<sub>i</sub> and Z<sub>o</sub> positive.</div>`,
        `<p class="aside">Keep the labels where the original circuit put them (input at the base, output at the collector) as you redraw.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How can an amplifier put out more signal power than it takes in?", model: "The extra power comes from the DC supply. The transistor uses the small input signal to control the large DC current, converting part of the DC power into ac power at the output. The output can't swing past the limits set by the DC operating point, or it clips." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "The re model", mins: 25,
    blurb: "Replace the transistor with a resistor and a current source. One value comes from the DC current.",
    takeaway: "Common emitter: the base–emitter diode becomes its ac resistance r_e = 26 mV/I_E (I_E from the DC analysis). Looking into the base you see (β + 1)r_e ≈ βr_e, because the emitter current is (β + 1) times the base current. The output is a current source βI_b, with r_o in parallel. r_o comes from the curves' slope: extend them to the Early voltage −V_A, then r_o = (V_A + V_CEQ)/I_CQ ≈ V_A/I_CQ. Typical: βr_e from a few hundred Ω to 6–7 kΩ; r_o 40–50 kΩ. Common base: input r_e (a few Ω to about 50 Ω), output αI_e, r_o in the MΩ range. For the common collector use the CE model. npn and pnp have the same ac model.",
    steps: [
      { k: "learn", title: "A model is a stand-in", b: [
        `<p>A <b>model</b> is a set of ordinary circuit elements that behaves like the device, under specific operating conditions. Swap it in for the transistor symbol and use the circuit methods you already know.</p>`,
        `<div class="two"><div class="tile"><h3>r<sub>e</sub> model</h3><p>Built from the actual operating point. The book's main model.</p></div><div class="tile"><h3>Hybrid (h) model</h3><p>Values from the datasheet, at the maker's operating point.</p></div><div class="tile"><h3>Hybrid π model</h3><p>Adds parts that matter at high frequency (Chapter 9).</p></div></div>`,
      ]},
      { k: "learn", title: "The input: a diode becomes a resistor", b: [
        `<p>Looking into the base, you see the base–emitter junction: a forward-biased diode carrying I<sub>E</sub>. For small signals, a diode is a resistor:</p>`,
        `<div class="eq">r<sub>e</sub> = 26 mV / I<sub>E</sub>    (I<sub>E</sub> from the DC analysis)</div>`,
        ch(1, "01-semiconductor-diodes.html", "p6", "Part 6", "Same idea as the diode's r<sub>d</sub> = 26 mV/I<sub>D</sub>."),
        { t: "num", q: "The DC analysis gives I_E = 1.3 mA. What's r_e?", a: 20, unit: "Ω", hint: "26 mV ÷ 1.3 mA. mV/mA gives ohms.", why: "26/1.3 = 20 Ω. Double the current and r_e halves." },
      ]},
      { k: "why", title: "Why the base sees β times more", b: [
        `<p>r<sub>e</sub> carries the <b>emitter</b> current, but the signal source only supplies the <b>base</b> current. So:</p>`,
        `<div class="eq">V<sub>be</sub> = I<sub>e</sub>r<sub>e</sub> = (β + 1)I<sub>b</sub>r<sub>e</sub>    so    Z<sub>i</sub> = V<sub>be</sub>/I<sub>b</sub> = (β + 1)r<sub>e</sub> ≅ βr<sub>e</sub></div>`,
        `<p>Viewed from the base, any resistance in the emitter looks (β + 1) times bigger. This "reflection" rule comes back again and again in this chapter.</p>`,
        { t: "num", q: "β = 150 and r_e = 20 Ω. What resistance does the signal see looking into the base?", a: 3000, unit: "Ω", hint: "βr_e.", why: "150 × 20 = 3 kΩ. (β + 1)r_e = 3.02 kΩ: the difference doesn't matter." },
      ]},
      { k: "learn", title: "The output: a current source", b: [
        `<p>If the output curves were perfectly flat and evenly spaced, the collector current would be exactly βI<sub>b</sub>, whatever the collector voltage. That's a <b>controlled current source</b>.</p>`,
        fig(ceFig({ zb: "βr_e", rc: null, label: "re model: βre between base and emitter, a βIb current source from collector to emitter" })),
        `<p class="aside">The input and output are now separate loops, linked only by the controlled source. Much easier to analyze than a diode wired into the output.</p>`,
      ]},
      { k: "play", title: "Early voltage and r_o", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let VA = 100, IB = 20;
          function draw() {
            const ic = (ib, v) => (0.1 * ib * (VA + v)) / VA, VQ = 8, IQ = ic(IB, VQ);
            const series = [10, 20, 30, 40].map((k) => ({ f: (v) => ic(k, v), from: -VA, to: 20, cls: k === IB ? "s1" : "s5" }));
            series.push(...[10, 20, 30, 40].map((k) => ({ f: (v) => ic(k, v), from: 0.3, to: 20, cls: k === IB ? "s1" : "s2" })));
            f.innerHTML = plot({ x: [-VA - 10, 20], y: [0, 6], xt: [-VA, -VA / 2, 0, 10, 20], yt: [0, 2, 4, 6], xl: "V_CE (V)", yl: "I_C (mA)", series, marks: [{ x: VQ, y: IQ }, { x: -VA, y: 0, cls: "mk2" }], texts: [{ x: -VA + 4, y: 0.6, s: "−V_A" }], label: "Output curves extended back to meet at the Early voltage" });
            const exact = (VA + VQ) / (IQ / 1000), approx = VA / (IQ / 1000);
            ro.innerHTML = readout([["I<sub>CQ</sub>", fmt(IQ, 3) + " mA"], ["r<sub>o</sub> = (V<sub>A</sub> + V<sub>CEQ</sub>)/I<sub>CQ</sub>", ohm(exact)], ["r<sub>o</sub> ≈ V<sub>A</sub>/I<sub>CQ</sub>", ohm(approx)]]);
          }
          host.append(f, slider({ id: id + "-va", label: "Early voltage V<sub>A</sub>", min: 30, max: 200, step: 5, value: 100, show: (v) => v + " V" }, (v) => { VA = v; draw(); }).el,
            slider({ id: id + "-ib", label: "Base current (picks the highlighted curve)", min: 10, max: 40, step: 10, value: 20, show: (v) => v + " µA" }, (v) => { IB = v; draw(); }).el, ro);
          draw();
        },
        `<p>Real curves slope upward. Extend them backward and they all meet at one point on the axis: <b>−V<sub>A</sub></b>, the <b>Early voltage</b> (found by James Early in 1952).</p>`,
        `<div class="eq">r<sub>o</sub> = (V<sub>A</sub> + V<sub>CEQ</sub>)/I<sub>CQ</sub> ≅ V<sub>A</sub>/I<sub>CQ</sub>    or from any curve: r<sub>o</sub> = ΔV<sub>CE</sub>/ΔI<sub>C</sub></div>`,
      ]},
      { k: "predict", title: "More current, more or less r_o?", b: [
        { t: "mcq", q: "Move to a higher base-current curve. What happens to r_o, and is that good?", opts: [
          ["r_o falls (steeper curve), which is worse: you want r_o large", true, "r_o ≈ V_A/I_CQ, so more current means less output resistance. A large r_o is better because it barely loads the output."],
          ["r_o rises, which is better", false, "Watch the readout: the curves get steeper as current rises."],
          ["r_o stays the same, because V_A is fixed", false, "V_A is fixed, but r_o divides it by I_CQ."],
        ]},
        { t: "num", q: "V_A = 120 V and I_CQ = 3 mA. Roughly what's r_o?", a: 40000, unit: "Ω", hint: "V_A/I_CQ. Volts over milliamps gives kΩ.", why: "120/3 = 40 kΩ. Typical r_o values are 40–50 kΩ." },
      ]},
      { k: "learn", title: "Common base, and the others", b: [
        `<div class="two"><div class="tile"><h3>Common base</h3><p>Input: just r<sub>e</sub> (a few Ω up to about 50 Ω). Output: a source αI<sub>e</sub>, plus r<sub>o</sub> in the <b>MΩ</b> range (the curves are nearly flat).</p></div><div class="tile"><h3>Common collector</h3><p>No new model: use the common-emitter one.</p></div></div>`,
        `<div class="key">npn or pnp? For DC the polarities flip. For ac, the signal swings both ways anyway, so <b>the ac model is the same</b>.</div>`,
        `<p class="aside">The common-base source is drawn opposite to the defined I<sub>o</sub> direction. That's why, as you'll see, common base has no phase flip and common emitter has a 180° flip.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the base of a common-emitter transistor look like βr_e and not just r_e?", model: "The resistance r_e carries the emitter current, which is (β + 1) times the base current. The input voltage across r_e is therefore (β + 1)I_b·r_e, so the ratio of input voltage to input (base) current is (β + 1)r_e, about βr_e." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  /* Fixed bias: DC then ac. Resistances in ohms. */
  function fixedAC(p) {
    const IB = Math.max(1e-9, (p.VCC - 0.7) / p.RB), IE = (p.beta + 1) * IB, re = VT / IE, IC = p.beta * IB;
    const VCE = p.VCC - IC * p.RC, ro = p.ro || Infinity, RCo = isFinite(ro) ? par(p.RC, ro) : p.RC;
    return { IB, IE, re, VCE, bre: p.beta * re, Zi: par(p.RB, p.beta * re), Zo: RCo, Av: -RCo / re };
  }
  const p3 = {
    id: "p3", title: "Common emitter: fixed bias and divider bias", mins: 25,
    blurb: "Plug the model in, read off Z_i, Z_o and the gain. Then the same thing with a voltage divider.",
    takeaway: "Fixed bias: Z_i = R_B ∥ βr_e ≈ βr_e (if R_B ≥ 10βr_e). Z_o = R_C ∥ r_o ≈ R_C (if r_o ≥ 10R_C). A_v = −(R_C ∥ r_o)/r_e ≈ −R_C/r_e. The minus sign means a 180° phase shift. β doesn't appear in A_v directly, but it's needed to find r_e. Voltage-divider bias with R_E bypassed: the same, with R_B replaced by R′ = R_1 ∥ R_2: Z_i = R′ ∥ βr_e, Z_o = R_C ∥ r_o, A_v = −(R_C ∥ r_o)/r_e. Z_o is found with V_i = 0, which makes I_b = 0 and opens the current source.",
    steps: [
      { k: "learn", title: "Plug in the model", b: [
        `<p>The fixed-bias amplifier, after the four steps: R<sub>B</sub> ends up across the input, R<sub>C</sub> across the output. Now replace the transistor with its model:</p>`,
        fig(ceFig({ rin: "R_B", ro: true, zi: true, zo: true })),
        `<p>Read the three answers straight off the picture.</p>`,
      ]},
      { k: "learn", title: "Z_i and Z_o", b: [
        `<div class="eq">Z<sub>i</sub> = R<sub>B</sub> ∥ βr<sub>e</sub>    ≅ βr<sub>e</sub> when R<sub>B</sub> ≥ 10βr<sub>e</sub></div>`,
        `<p>For Z<sub>o</sub>, set V<sub>i</sub> = 0. Then I<sub>b</sub> = 0, so βI<sub>b</sub> = 0: the current source becomes an <b>open circuit</b>. What's left looking back in:</p>`,
        `<div class="eq">Z<sub>o</sub> = R<sub>C</sub> ∥ r<sub>o</sub>    ≅ R<sub>C</sub> when r<sub>o</sub> ≥ 10R<sub>C</sub></div>`,
      ]},
      { k: "math", title: "Parallel shortcut", b: [
        `<p>Two resistors in parallel always give less than the smaller one. If one is 10 times bigger or more, the answer is within about 10% of the smaller one.</p>`,
        { t: "mcq", q: "470 kΩ ∥ 1.2 kΩ is closest to:", opts: [
          ["1.2 kΩ (a hair less)", true, "Exactly 1.197 kΩ. The big resistor barely matters."],
          ["470 kΩ", false, "Parallel is always below the smaller one."],
          ["About 235 kΩ", false, "That would be two equal 470 kΩ resistors."],
        ]},
      ]},
      { k: "learn", title: "The gain", b: [
        `<p>The source βI<sub>b</sub> pushes its current up through R<sub>C</sub> ∥ r<sub>o</sub>, opposite to the V<sub>o</sub> polarity:</p>`,
        `<div class="eq">V<sub>o</sub> = −βI<sub>b</sub>(R<sub>C</sub> ∥ r<sub>o</sub>)  and  I<sub>b</sub> = V<sub>i</sub>/βr<sub>e</sub>    →    A<sub>v</sub> = −(R<sub>C</sub> ∥ r<sub>o</sub>)/r<sub>e</sub> ≅ −R<sub>C</sub>/r<sub>e</sub></div>`,
        `<p>β cancels out. It's still hiding inside r<sub>e</sub>, because the DC analysis needed β to find I<sub>E</sub>.</p>`,
        `<div class="key">The <b>minus sign</b> means the output is flipped: a <b>180° phase shift</b>. When the input rises, the output falls.</div>`,
        fig(waves(-200)),
      ]},
      { k: "play", title: "Fixed-bias lab", b: [
        (host, id) => {
          const p = { VCC: 15, RB: 680e3, RC: 3.3e3, beta: 120, ro: 40e3 };
          let useRo = false;
          const ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          function draw() {
            const r = fixedAC({ ...p, ro: useRo ? p.ro : 0 });
            ro.innerHTML = readout([["DC: I<sub>E</sub>", si(r.IE, "A")], ["r<sub>e</sub> = 26 mV/I<sub>E</sub>", ohm(r.re)], ["βr<sub>e</sub>", ohm(r.bre)], ["Z<sub>i</sub>", ohm(r.Zi)], ["Z<sub>o</sub>", ohm(r.Zo)], ["A<sub>v</sub>", fmt(r.Av, 3)]]);
            const sat = r.VCE < 1;
            vd.className = "verdict " + (sat ? "no" : "ok");
            vd.textContent = sat ? `V_CE is only ${fmt(Math.max(r.VCE, 0), 2)} V: the transistor is at or near saturation, so the small-signal results don't apply. Raise R_B or lower R_C.` : `DC check: V_CE = ${fmt(r.VCE, 3)} V, comfortably active.`;
          }
          host.append(slider({ id: id + "-rb", label: "R<sub>B</sub>", min: 200e3, max: 2e6, log: true, value: p.RB, show: (v) => ohm(v) }, (v) => { p.RB = v; draw(); }).el,
            slider({ id: id + "-rc", label: "R<sub>C</sub>", min: 1e3, max: 10e3, log: true, value: p.RC, show: (v) => ohm(v) }, (v) => { p.RC = v; draw(); }).el,
            slider({ id: id + "-b", label: "β", min: 50, max: 250, step: 5, value: p.beta }, (v) => { p.beta = v; draw(); }).el,
            toggle(["Ignore r_o", "Include r_o = 40 kΩ"], (k) => { useRo = k === 1; draw(); }, 0), vd, ro);
          draw();
        },
        `<p>Try: raise R<sub>B</sub>. The DC current drops, so r<sub>e</sub> rises and the gain falls. The ac answer depends on the DC design.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Fixed bias: V<sub>CC</sub> = 9 V, R<sub>B</sub> = 390 kΩ, R<sub>C</sub> = 2.2 kΩ, β = 100. Ignore r<sub>o</sub> first.</p>`,
        { t: "num", q: "I_E from the DC analysis, in mA?", a: 2.149, unit: "mA", hint: "I_B = (V_CC − 0.7)/R_B, then I_E = (β + 1)I_B.", why: "I_B = 8.3/390k = 21.28 µA; I_E = 101 × 21.28 µA = 2.149 mA." },
        { t: "num", q: "r_e?", a: 12.1, unit: "Ω", hint: "26 mV ÷ I_E.", why: "26/2.149 = 12.10 Ω." },
        { t: "num", q: "Z_i?", a: 1206, unit: "Ω", hint: "R_B ∥ βr_e. βr_e = 1.21 kΩ.", why: "390 kΩ ∥ 1.21 kΩ = 1.206 kΩ: almost exactly βr_e." },
        { t: "num", q: "A_v?", a: -181.8, hint: "−R_C/r_e. Keep the sign.", why: "−2200/12.10 = −181.8." },
        { t: "num", q: "Now r_o = 30 kΩ. New A_v?", a: -169.4, hint: "Replace R_C with R_C ∥ r_o first. Is r_o ≥ 10R_C here?", why: "2.2 kΩ ∥ 30 kΩ = 2.05 kΩ, so A_v = −2050/12.10 = −169.4. r_o < 10R_C, so ignoring it cost about 7%." },
      ]},
      { k: "learn", title: "Voltage-divider bias", b: [
        `<p>With R<sub>E</sub> fully bypassed by C<sub>E</sub>, the ac circuit is the same as fixed bias. R<sub>1</sub> and R<sub>2</sub> both end up from base to ground, so they act as one resistor:</p>`,
        `<div class="eq">R′ = R<sub>1</sub> ∥ R<sub>2</sub>    Z<sub>i</sub> = R′ ∥ βr<sub>e</sub>    Z<sub>o</sub> = R<sub>C</sub> ∥ r<sub>o</sub>    A<sub>v</sub> = −(R<sub>C</sub> ∥ r<sub>o</sub>)/r<sub>e</sub></div>`,
        `<p class="aside">The divider usually pulls Z<sub>i</sub> lower than fixed bias would, because R′ is much smaller than a typical R<sub>B</sub>.</p>`,
        `<p>V<sub>CC</sub> = 18 V, R<sub>1</sub> = 39 kΩ, R<sub>2</sub> = 8.2 kΩ, R<sub>C</sub> = 3.3 kΩ, R<sub>E</sub> = 1 kΩ (bypassed), β = 110.</p>`,
        { t: "num", q: "Use the approximate divider method (βR_E ≥ 10R_2 holds). What's r_e?", a: 10.71, unit: "Ω", hint: "V_B = R_2V_CC/(R_1 + R_2), V_E = V_B − 0.7, I_E = V_E/R_E.", why: "V_B = 3.127 V, V_E = 2.427 V, I_E = 2.427 mA, r_e = 10.71 Ω." },
        { t: "num", q: "Z_i?", a: 1004, unit: "Ω", hint: "R′ = 39k ∥ 8.2k first. Then R′ ∥ βr_e.", why: "R′ = 6.78 kΩ, βr_e = 1.18 kΩ, so Z_i = 1.00 kΩ. Here R′ isn't 10× bigger, so it matters." },
        { t: "num", q: "A_v (ignore r_o)?", a: -308.1, hint: "−R_C/r_e.", why: "−3300/10.71 = −308." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the current source disappear when you find Z_o?", model: "Z_o is defined with the input signal set to zero. Then the base current I_b is zero, so the controlled source βI_b is zero, and a current source with zero current is an open circuit. Looking back into the output you only see R_C in parallel with r_o." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  /* Unbypassed emitter-bias model: β·r_e from base to the emitter node, the βI_b source from collector to emitter node, R_E from emitter node to ground. */
  function ebFig(o = {}) {
    const T = 40, E = 130, B = 210;
    let s = S.vsrc(60, 125, "V_i") + S.wire([60, 107], [60, T], [230, T]) + S.wire([60, 143], [60, B], [470, B]);
    s += S.res(140, T, 140, B, o.rb || "R_B", { side: "right" }) + S.dot(140, T) + S.dot(140, B);
    s += S.res(230, T, 230, E, "βr_e", { side: "right" }) + S.t(230, T - 8, "b", { cls: "s m" });
    s += S.wire([230, E], [340, E]) + S.dot(285, E) + S.t(296, E - 8, "e", { cls: "s m", a: "start" });
    s += S.res(285, E, 285, B, o.re || "R_E", { side: "right", cls: o.hl ? "hl" : "" }) + S.dot(285, B);
    s += S.isrc(340, 85, "βI_b", { down: true, side: "right" }) + S.wire([340, 67], [340, T], [470, T]) + S.wire([340, 103], [340, E]) + S.t(340, T - 8, "c", { cls: "s m" });
    s += S.res(430, T, 430, B, "R_C", { side: "right" }) + S.dot(430, T) + S.dot(430, B) + S.dot(470, T) + S.t(470, T - 10, "V_o", { cls: "a" });
    s += S.t(200, T + 22, "Z_b ↓", { cls: "c s", a: "end" }) + S.t(126, B + 26, "Z_i →", { cls: "c s", a: "end" });
    return S.svg(510, 245, s, { max: 510, label: "Small-signal model of an emitter-bias amplifier with R_E left in the emitter" });
  }
  /* Emitter bias, DC then ac. p: VCC, RB, RC, RE (total), RE1 (unbypassed part), beta. */
  function ebAC(p) {
    const IB = (p.VCC - 0.7) / (p.RB + (p.beta + 1) * p.RE), IE = (p.beta + 1) * IB, re = VT / IE;
    const Zb = p.beta * re + (p.beta + 1) * p.RE1;
    return { IE, re, Zb, Zi: par(p.RB, Zb), Av: (-p.beta * p.RC) / Zb };
  }
  const p4 = {
    id: "p4", title: "Common emitter with R_E: bypassed or not", mins: 25,
    blurb: "Leave R_E in for the signal and the gain drops, but stops depending on β.",
    takeaway: "Unbypassed R_E: Z_b = βr_e + (β + 1)R_E ≈ β(r_e + R_E) ≈ βR_E. Z_i = R_B ∥ Z_b. Z_o = R_C (for any r_o). A_v = −βR_C/Z_b ≈ −R_C/(r_e + R_E) ≈ −R_C/R_E: β drops out, so the gain is stable but small. Bypassed (C_E across R_E): back to Z_i = R_B ∥ βr_e and A_v = −R_C/r_e: big gain that follows β through r_e. Partly bypassed (R_E1 + R_E2, only R_E2 bypassed): DC uses R_E1 + R_E2, ac uses R_E1. The simple formulas hold if r_o ≥ 10(R_C + R_E).",
    steps: [
      { k: "learn", title: "R_E stays in", b: [
        `<p>No bypass capacitor this time, so R<sub>E</sub> stays in the ac circuit, between the emitter and ground. r<sub>o</sub> is left out: it makes the algebra much messier, and usually barely matters.</p>`,
        fig(ebFig()),
      ]},
      { k: "why", title: "What the base sees", b: [
        `<p>KVL round the input loop: V<sub>i</sub> = I<sub>b</sub>βr<sub>e</sub> + I<sub>e</sub>R<sub>E</sub>, with I<sub>e</sub> = (β + 1)I<sub>b</sub>. Divide by I<sub>b</sub>:</p>`,
        `<div class="eq">Z<sub>b</sub> = βr<sub>e</sub> + (β + 1)R<sub>E</sub> ≅ β(r<sub>e</sub> + R<sub>E</sub>) ≅ βR<sub>E</sub>    Z<sub>i</sub> = R<sub>B</sub> ∥ Z<sub>b</sub></div>`,
        `<p>The same reflection rule as before: anything in the emitter looks about β times bigger from the base.</p>`,
        { t: "mcq", q: "β = 100, r_e = 10 Ω, R_E = 1 kΩ. Roughly what is Z_b?", opts: [
          ["About 100 kΩ", true, "β(r_e + R_E) = 100 × 1010 Ω ≈ 101 kΩ. R_E dominates r_e."],
          ["About 1 kΩ", false, "That's βr_e, the bypassed case."],
          ["About 1.01 kΩ", false, "That's r_e + R_E without the β reflection."],
        ]},
      ]},
      { k: "learn", title: "The gain loses β", b: [
        `<p>With V<sub>i</sub> = 0 the source opens again, so <b>Z<sub>o</sub> = R<sub>C</sub></b>. For the gain:</p>`,
        `<div class="eq">I<sub>b</sub> = V<sub>i</sub>/Z<sub>b</sub>,  V<sub>o</sub> = −βI<sub>b</sub>R<sub>C</sub>    →    A<sub>v</sub> = −βR<sub>C</sub>/Z<sub>b</sub> ≅ −R<sub>C</sub>/(r<sub>e</sub> + R<sub>E</sub>) ≅ −R<sub>C</sub>/R<sub>E</sub></div>`,
        `<div class="key">β is gone, and r<sub>e</sub> (which changes with the operating point and temperature) barely matters. The gain is set by two resistors.</div>`,
      ]},
      { k: "predict", title: "Before you play", b: [
        { t: "mcq", q: "Swap in a transistor with twice the β. Which amplifier's gain changes more?", opts: [
          ["The bypassed one", true, "Its gain is −R_C/r_e, and r_e follows the DC current, which follows β. The unbypassed gain is ≈ −R_C/R_E, set by resistors."],
          ["The unbypassed one", false, "Its gain formula ≈ −R_C/R_E has no β in it."],
          ["Both change by the same amount", false, "Check with the lab on the next step."],
        ]},
      ]},
      { k: "play", title: "Gain against β", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const base = { VCC: 12, RB: 330e3, RC: 2.2e3, RE: 680 };
          let beta = 100;
          function draw() {
            const by = (b) => ebAC({ ...base, beta: b, RE1: 0 }).Av, un = (b) => ebAC({ ...base, beta: b, RE1: base.RE }).Av;
            const by0 = by(100), un0 = un(100);
            f.innerHTML = plot({ x: [50, 300], y: [0, 2.5], xt: [50, 100, 150, 200, 250, 300], yt: [0, 0.5, 1, 1.5, 2, 2.5], xl: "β", yl: "gain ÷ gain at β = 100",
              series: [{ f: (b) => by(b) / by0, cls: "s1" }, { f: (b) => un(b) / un0, cls: "s2" }], marks: [{ x: beta, y: by(beta) / by0 }, { x: beta, y: un(beta) / un0, cls: "mk2" }],
              texts: [{ x: 210, y: 2.15, s: "bypassed" }, { x: 210, y: 1.15, s: "unbypassed" }], label: "How each amplifier's gain changes with beta" });
            const B = ebAC({ ...base, beta, RE1: 0 }), U = ebAC({ ...base, beta, RE1: base.RE });
            ro.innerHTML = readout([["β", beta], ["r<sub>e</sub>", ohm(B.re)], ["Bypassed A<sub>v</sub>", fmt(B.Av, 3)], ["Bypassed Z<sub>i</sub>", ohm(B.Zi)], ["Unbypassed A<sub>v</sub>", fmt(U.Av, 3)], ["Unbypassed Z<sub>i</sub>", ohm(U.Zi)]]);
          }
          host.append(f, slider({ id: id + "-b", label: "β", min: 50, max: 300, step: 5, value: 100 }, (v) => { beta = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The circuit: V<sub>CC</sub> = 12 V, R<sub>B</sub> = 330 kΩ, R<sub>C</sub> = 2.2 kΩ, R<sub>E</sub> = 680 Ω. Both lines start at 1 at β = 100, so you can compare how much each one moves.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Same circuit with β = 100: the DC analysis gives I<sub>E</sub> = 2.863 mA, so r<sub>e</sub> = 9.08 Ω.</p>`,
        { t: "num", q: "Unbypassed: Z_b (use the full βr_e + (β + 1)R_E)?", a: 69590, unit: "Ω", tol: 0.01, hint: "100 × 9.08 + 101 × 680.", why: "908 + 68 680 = 69.59 kΩ." },
        { t: "num", q: "Unbypassed A_v = −βR_C/Z_b?", a: -3.161, tol: 0.01, hint: "−100 × 2200 / 69 590.", why: "−3.16. The shortcut −R_C/R_E gives −3.24: close." },
        { t: "num", q: "Now add C_E. A_v?", a: -242.2, tol: 0.01, hint: "−R_C/r_e.", why: "−2200/9.08 = −242. About 77 times more gain, bought with β-sensitivity and a much lower Z_i." },
      ]},
      { k: "play", title: "The middle road: bypass part of R_E", b: [
        (host, id) => {
          const ro = el(`<div></div>`), f = el(`<div class="fig"></div>`);
          const base = { VCC: 12, RB: 330e3, RC: 2.2e3, RE: 680, beta: 100 };
          let RE1 = 100;
          function draw() {
            const lo = ebAC({ ...base, beta: 50, RE1 }), mid = ebAC({ ...base, RE1 }), hi = ebAC({ ...base, beta: 200, RE1 });
            let s = S.wire([150, 20], [150, 40]) + S.res(150, 40, 150, 110, "R_E1 = " + ohm(RE1), { side: "right" }) + S.dot(150, 110) + S.res(150, 110, 150, 180, "R_E2 = " + ohm(base.RE - RE1), { side: "left" }) + S.wire([150, 110], [240, 110]) + S.cap(240, 110, 240, 180, "C_E", { side: "right" }) + S.wire([150, 180], [240, 180]) + S.gnd(195, 180) + S.t(160, 16, "emitter", { a: "start", cls: "s m" });
            f.innerHTML = S.svg(330, 210, s, { max: 330, label: "Emitter resistor split into an unbypassed part RE1 and a bypassed part RE2" });
            ro.innerHTML = readout([["A<sub>v</sub> at β = 50", fmt(lo.Av, 3)], ["A<sub>v</sub> at β = 100", fmt(mid.Av, 3)], ["A<sub>v</sub> at β = 200", fmt(hi.Av, 3)], ["Z<sub>i</sub> at β = 100", ohm(mid.Zi)], ["−R<sub>C</sub>/(r<sub>e</sub> + R<sub>E1</sub>)", fmt(-base.RC / (mid.re + RE1), 3)]]);
          }
          host.append(f, slider({ id: id + "-r", label: "Unbypassed part R<sub>E1</sub> (total stays 680 Ω)", min: 0, max: 680, step: 10, value: 100, show: (v) => ohm(v) }, (v) => { RE1 = v; draw(); }).el, ro);
          draw();
        },
        `<p>For <b>DC</b> the emitter resistance is R<sub>E1</sub> + R<sub>E2</sub> (the capacitor is open), so the bias doesn't change. For <b>ac</b> only R<sub>E1</sub> counts: use it wherever R<sub>E</sub> appears.</p>`,
        `<p class="aside">Slide R<sub>E1</sub> up from zero. A small unbypassed piece costs some gain but makes the gain far steadier across β.</p>`,
      ]},
      { k: "learn", title: "What about r_o?", b: [
        `<p>The full equations with r<sub>o</sub> are long. The book gives them without derivation. What matters is when you can skip them:</p>`,
        `<div class="eq">if r<sub>o</sub> ≥ 10(R<sub>C</sub> + R<sub>E</sub>):  Z<sub>b</sub> ≅ β(r<sub>e</sub> + R<sub>E</sub>)    if r<sub>o</sub> ≥ 10R<sub>C</sub>:  A<sub>v</sub> ≅ −βR<sub>C</sub>/Z<sub>b</sub>    Z<sub>o</sub> ≅ R<sub>C</sub> for any r<sub>o</sub></div>`,
        `<p class="aside">Why is Z<sub>o</sub> ≈ R<sub>C</sub> even with r<sub>o</sub>? With R<sub>E</sub> in the emitter, the transistor's own output resistance gets multiplied up (about 50 r<sub>o</sub> for β = 100, r<sub>e</sub> = 10 Ω, R<sub>E</sub> = 1 kΩ). Next to R<sub>C</sub> it vanishes.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What do you gain and what do you lose by leaving R_E unbypassed?", model: "You gain a higher input impedance (about βR_E) and a gain set by resistors, about −R_C/R_E, that hardly changes with β or temperature. You lose most of the gain: −R_C/R_E is much smaller than the bypassed −R_C/r_e." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Emitter follower", mins: 25,
    blurb: "Gain just under 1, high input impedance, tiny output impedance: a buffer.",
    takeaway: "Output from the emitter (collector at ac ground, so it's common collector). Z_i = R_B ∥ Z_b, Z_b ≈ β(r_e + R_E) ≈ βR_E: high. Z_o = R_E ∥ r_e ≈ r_e: very low. A_v = R_E/(R_E + r_e) ≈ 1, in phase. Used for impedance matching, like a transformer. With a divider, R_B → R_1 ∥ R_2; a collector resistor only sets the Q-point. With a load and source: replace R_E by R_E ∥ R_L, and Z_o = R_E ∥ (r_e + R′_s/β) with R′_s = R_s ∥ R_B. r_o barely matters for this circuit.",
    steps: [
      { k: "learn", title: "Output at the emitter", b: [
        seen("The source follower: gain about 1, high input resistance, low output resistance.", "08-small-signal-model.html#p6", "Chapter 8, Part 6"),
        `<p>Take the output from the <b>emitter</b>. The emitter always sits one V<sub>BE</sub> below the base, so it "follows" the input. The collector goes straight to V<sub>CC</sub>, which is ac ground: so this is really <b>common collector</b>.</p>`,
        `<div class="key">Output in phase with the input, slightly smaller: A<sub>v</sub> ≈ 1.</div>`,
      ]},
      { k: "learn", title: "Z_i: high", b: [
        `<p>R<sub>E</sub> is in the emitter, unbypassed, so it reflects to the base exactly as in Part 4:</p>`,
        `<div class="eq">Z<sub>b</sub> = βr<sub>e</sub> + (β + 1)R<sub>E</sub> ≅ βR<sub>E</sub>    Z<sub>i</sub> = R<sub>B</sub> ∥ Z<sub>b</sub></div>`,
      ]},
      { k: "why", title: "Z_o: tiny", b: [
        `<p>Look from the <b>emitter</b> instead. The emitter current is (β + 1)I<sub>b</sub> = (β + 1)V<sub>i</sub>/Z<sub>b</sub>. Divide top and bottom by (β + 1):</p>`,
        `<div class="eq">I<sub>e</sub> ≅ V<sub>i</sub>/(r<sub>e</sub> + R<sub>E</sub>)</div>`,
        `<p>That's a source V<sub>i</sub> driving r<sub>e</sub> in series with R<sub>E</sub>. Set V<sub>i</sub> = 0 and look in from the emitter:</p>`,
        `<div class="eq">Z<sub>o</sub> = R<sub>E</sub> ∥ r<sub>e</sub> ≅ r<sub>e</sub>    A<sub>v</sub> = R<sub>E</sub>/(R<sub>E</sub> + r<sub>e</sub>) ≅ 1</div>`,
        `<div class="key">Looking <b>into the base</b>, emitter resistance is multiplied by β. Looking <b>into the emitter</b>, base-side resistance is divided by β. Same transistor, two directions.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>V<sub>CC</sub> = 15 V, R<sub>B</sub> = 270 kΩ, R<sub>E</sub> = 2.2 kΩ, β = 120, collector straight to V<sub>CC</sub>.</p>`,
        { t: "num", q: "DC first: I_E, in mA?", a: 3.227, unit: "mA", tol: 0.01, hint: "I_B = (V_CC − V_BE)/[R_B + (β + 1)R_E].", why: "I_B = 14.3/536.2k = 26.67 µA, I_E = 121 × 26.67 µA = 3.227 mA. r_e = 8.06 Ω." },
        { t: "num", q: "Z_i, in kΩ?", a: 134.3, unit: "kΩ", hint: "Z_b = βr_e + (β + 1)R_E ≈ 267 kΩ. Then R_B ∥ Z_b.", why: "270k ∥ 267k ≈ 134 kΩ. A divider-biased follower would need large R_1 and R_2 to keep it this high." },
        { t: "num", q: "Z_o?", a: 8.03, unit: "Ω", tol: 0.02, hint: "R_E ∥ r_e.", why: "2.2 kΩ ∥ 8.06 Ω = 8.03 Ω." },
        { t: "num", q: "A_v?", a: 0.9964, tol: 0.002, hint: "R_E/(R_E + r_e).", why: "2200/2208 = 0.9964." },
      ]},
      { k: "play", title: "Why bother? The buffer test", b: [
        (host, id) => {
          const ro = el(`<div></div>`), f = el(`<div class="fig"></div>`);
          let Rs = 50e3, RL = 100;
          const RB = 270e3, RE = 2200, beta = 120, re = 8.057;
          function draw() {
            const direct = RL / (Rs + RL);
            const REL = par(RE, RL), Zb = beta * (re + REL), Zi = par(RB, Zb), vi = Zi / (Zi + Rs), Av = REL / (REL + re), viaF = vi * Av;
            const Zo = par(RE, re + par(Rs, RB) / beta);
            const w = 300, bar = (v, y, cls, lab) => `<rect x="150" y="${y}" width="${Math.max(1, v * w)}" height="22" style="fill:var(--${cls})"/>` + S.t(140, y + 16, lab, { a: "end", cls: "s" }) + S.t(156 + Math.max(1, v * w), y + 16, fmt(v * 1000, 3) + " mV", { a: "start", cls: "s" });
            f.innerHTML = S.svg(560, 90, bar(direct, 10, "bad", "direct") + bar(viaF, 50, "good", "via follower"), { max: 560, label: "Load voltage for a 1 V source, directly connected or through the follower" });
            ro.innerHTML = readout([["Z<sub>i</sub> of follower (loaded)", ohm(Zi)], ["Fraction reaching the base", fmt(vi, 3)], ["Follower gain with R<sub>L</sub>", fmt(Av, 3)], ["Z<sub>o</sub> = R<sub>E</sub> ∥ (r<sub>e</sub> + R′<sub>s</sub>/β)", ohm(Zo)], ["Improvement", fmt(viaF / direct, 3) + "×"]]);
          }
          host.append(f, slider({ id: id + "-rs", label: "Source resistance R<sub>s</sub>", min: 1e3, max: 200e3, log: true, value: Rs, show: (v) => ohm(v) }, (v) => { Rs = v; draw(); }).el,
            slider({ id: id + "-rl", label: "Load R<sub>L</sub>", min: 8, max: 10e3, log: true, value: RL, show: (v) => ohm(v) }, (v) => { RL = v; draw(); }).el, ro);
          draw();
        },
        `<p>A 1 V source with a high internal resistance has to drive a small load. Connected directly, the voltage divider eats almost all of it. Through the follower (the circuit above), the source sees a high Z<sub>i</sub> and the load sees a tiny Z<sub>o</sub>.</p>`,
        `<p class="aside">Two things to notice. The load sits in parallel with R<sub>E</sub>, so it lowers Z<sub>i</sub>. And the source resistance shows up in Z<sub>o</sub>, divided by β. A follower's Z<sub>i</sub> depends on its load and its Z<sub>o</sub> depends on its source.</p>`,
      ]},
      { k: "learn", title: "Variations", b: [
        `<div class="two"><div class="tile"><h3>Divider bias</h3><p>Replace R<sub>B</sub> by R′ = R<sub>1</sub> ∥ R<sub>2</sub> in Z<sub>i</sub>.</p></div><div class="tile"><h3>With a collector resistor</h3><p>R<sub>C</sub> only sets the Q-point. It doesn't show up in Z<sub>i</sub>, Z<sub>o</sub> or A<sub>v</sub>.</p></div><div class="tile"><h3>Including r<sub>o</sub></h3><p>If r<sub>o</sub> ≥ 10R<sub>E</sub>, nothing changes. Even if not, Z<sub>o</sub> and A<sub>v</sub> barely move and Z<sub>i</sub> drops a little.</p></div></div>`,
        `<p>The follower is used for <b>impedance matching</b>: high Z<sub>i</sub> to pick up a weak source, low Z<sub>o</sub> to drive the next stage. Like a transformer, but with no coils.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "An emitter follower has a gain below 1. Why is it still useful?", model: "Because it changes impedance levels. It has a high input impedance (about βR_E), so it draws little current and doesn't load a weak source, and a very low output impedance (about r_e), so it can drive a low-resistance load without the signal dropping. It passes the voltage along almost unchanged, in phase." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  function cbFig() {
    const T = 40, B = 170;
    let s = S.vsrc(60, 105, "V_i") + S.wire([60, 87], [60, T], [220, T]) + S.wire([60, 123], [60, B], [470, B]);
    s += S.res(140, T, 140, B, "R_E", { side: "right" }) + S.dot(140, T) + S.dot(140, B);
    s += S.res(220, T, 220, B, "r_e", { side: "right" }) + S.t(220, T - 8, "e", { cls: "s m" }) + S.t(232, B - 6, "b", { cls: "s m", a: "start" }) + S.dot(220, B);
    s += S.isrc(330, 105, "αI_e", { side: "right" }) + S.wire([330, 87], [330, T], [470, T]) + S.wire([330, 123], [330, B]) + S.t(330, T - 8, "c", { cls: "s m" });
    s += S.res(430, T, 430, B, "R_C", { side: "right" }) + S.dot(430, T) + S.dot(430, B) + S.dot(470, T) + S.t(470, T - 10, "V_o", { cls: "a" });
    s += S.arrow(160, T - 14, 200, T - 14, "I_e", { ly: T - 20 });
    return S.svg(510, 200, s, { max: 510, label: "Common-base small-signal model: re at the input, alpha Ie source at the output" });
  }
  const p6 = {
    id: "p6", title: "Common base", mins: 20,
    blurb: "Tiny input impedance, big voltage gain, no phase flip, current gain just under 1.",
    takeaway: "Common base: signal into the emitter, output at the collector, base at ac ground. Z_i = R_E ∥ r_e ≈ r_e (a few to about 50 Ω). Z_o = R_C (r_o is in MΩ). A_v = αR_C/r_e ≈ R_C/r_e, positive: no phase shift. A_i = −α ≈ −1. Its low Z_i makes it hard to drive from an ordinary source, which is why it's often paired with a follower or a CE stage (cascode).",
    steps: [
      { k: "learn", title: "Signal into the emitter", b: [
        `<p>Base at ac ground, signal into the emitter, output from the collector. Swap in the common-base model:</p>`,
        fig(cbFig()),
        `<div class="eq">Z<sub>i</sub> = R<sub>E</sub> ∥ r<sub>e</sub> ≅ r<sub>e</sub>    Z<sub>o</sub> = R<sub>C</sub>    A<sub>v</sub> = αR<sub>C</sub>/r<sub>e</sub> ≅ R<sub>C</sub>/r<sub>e</sub>    A<sub>i</sub> ≅ −1</div>`,
      ]},
      { k: "predict", title: "Same size, opposite sign?", b: [
        { t: "mcq", q: "Common emitter gives A_v ≈ −R_C/r_e. Common base gives ≈ +R_C/r_e. What does the sign difference mean?", opts: [
          ["Common base doesn't invert: input and output are in phase", true, "When the emitter is pushed up, less current flows, the collector rises too. Same size gain, no flip."],
          ["Common base has a smaller gain", false, "Same R_C/r_e size, give or take α."],
          ["Common base gives a negative output voltage", false, "The sign is about phase, not about the DC level."],
        ]},
        fig(waves(250)),
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>V<sub>EE</sub> = 3 V, R<sub>E</sub> = 1.5 kΩ, R<sub>C</sub> = 4.7 kΩ, α = 0.99.</p>`,
        { t: "num", q: "I_E?", a: 1.533, unit: "mA", tol: 0.01, hint: "(V_EE − V_BE)/R_E.", why: "2.3/1.5k = 1.533 mA. r_e = 16.96 Ω." },
        { t: "num", q: "Z_i?", a: 16.77, unit: "Ω", tol: 0.02, hint: "R_E ∥ r_e.", why: "1500 ∥ 16.96 = 16.77 Ω. Tiny." },
        { t: "num", q: "A_v?", a: 274.4, tol: 0.02, hint: "αR_C/r_e.", why: "0.99 × 4700/16.96 = 274. Positive." },
      ]},
      { k: "whatif", title: "Drive it from a real source", b: [
        `<p>Connect that amplifier to a source with R<sub>s</sub> = 600 Ω. The input is a voltage divider: R<sub>s</sub> against Z<sub>i</sub>.</p>`,
        { t: "num", q: "What fraction of the source voltage reaches the emitter?", a: 0.0272, tol: 0.03, hint: "Z_i/(Z_i + R_s).", why: "16.77/(616.77) = 0.027. Less than 3% gets in, so the overall gain is about 7.5, not 274." },
        `<p class="aside">That's the common base's weakness. Part 10 fixes it by putting a follower in front.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe the common-base amplifier's strengths and weakness.", model: "It gives a large voltage gain, about R_C/r_e, with no phase inversion, and its current gain is just under 1. Its weakness is a very low input impedance, about r_e, so most of a real source's signal is lost across the source resistance unless something with a low output impedance drives it." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  function cfFig(o = {}) {
    let s = S.vsrc(50, 160, "V_i") + S.wire([50, 142], [50, 110], [110, 110]) + S.wire([50, 178], [50, 230], [330, 230]);
    s += S.wire([110, 110], [110, 160], [170, 160]) + bjt(200, 160) + S.wire([222, 210], [222, 230]) + S.dot(222, 230);
    s += S.wire([222, 110], [222, 70]) + S.dot(222, 70) + S.res(222, 70, 110, 70, o.rf || "R_F") + S.wire([110, 70], [110, 110]) + S.dot(110, 110);
    s += S.wire([222, 70], [330, 70]) + S.res(290, 70, 290, 230, "R_C", { side: "right" }) + S.dot(290, 70) + S.dot(290, 230) + S.dot(330, 70) + S.t(330, 60, "V_o", { cls: "a" });
    return S.svg(380, 260, s, { max: 380, label: "Collector feedback amplifier, ac equivalent: RF from collector back to base" });
  }
  /* Collector dc feedback: R_F split in two, the middle grounded by C_3 (drawn going up to a ground). */
  function cdfFig() {
    let s = S.vsrc(50, 200, "V_i") + S.wire([50, 182], [50, 150], [110, 150]) + S.wire([50, 218], [50, 260], [330, 260]) + S.dot(110, 150);
    s += S.wire([110, 90], [110, 190], [170, 190]) + bjt(200, 190) + S.wire([222, 240], [222, 260]) + S.dot(222, 260) + S.wire([222, 140], [222, 90]);
    s += S.res(222, 90, 166, 90, "R_F2", { side: "below" }) + S.res(166, 90, 110, 90, "R_F1", { side: "below" }) + S.dot(166, 90) + S.dot(222, 90);
    s += S.cap(166, 90, 166, 40, "C_3", { side: "right" }) + `<line class="w" x1="152" y1="40" x2="180" y2="40"/><line class="w" x1="157" y1="34" x2="175" y2="34"/><line class="w" x1="162" y1="28" x2="170" y2="28"/>`;
    s += S.wire([222, 90], [330, 90]) + S.res(290, 90, 290, 260, "R_C", { side: "right" }) + S.dot(290, 90) + S.dot(290, 260) + S.dot(330, 90) + S.t(330, 80, "V_o", { cls: "a" });
    return S.svg(380, 290, s, { max: 380, label: "Collector dc feedback: RF split into RF1 and RF2 with capacitor C3 from the middle to ground" });
  }
  const p7 = {
    id: "p7", title: "Collector feedback", mins: 25,
    blurb: "A resistor from collector back to base: steady bias, but it drags the input impedance down.",
    takeaway: "Collector feedback (R_F from collector to base): Z_i = r_e/(1/β + R_C/R_F) for R_F ≫ R_C, Z_o ≈ R_C ∥ R_F, A_v ≈ −R_C/r_e (for R_F ≫ R_C), 180° shift. Insight: Z_i is βr_e in parallel with R_F/|A_v|. The big inverted output swing makes R_F draw far more current than its size suggests (the Miller effect, Chapter 9). With an emitter resistor: Z_i ≈ R_E/(1/β + (R_E + R_C)/R_F), A_v ≈ −R_C/R_E. Collector dc feedback splits R_F into R_F1 + R_F2 with a capacitor to ground in the middle: DC still sees R_F1 + R_F2, but for ac R_F1 sits across the input and R_F2 across the output: Z_i = R_F1 ∥ βr_e, Z_o = R_C ∥ R_F2 ∥ r_o, A_v = −(R_F2 ∥ R_C ∥ r_o)/r_e.",
    steps: [
      { k: "learn", title: "Feedback from collector to base", b: [
        ch(4, "04-dc-biasing-bjts.html", "p7", "Part 7", "You met this circuit for its steady DC bias."),
        fig(cfFig()),
        `<p>For ac, R<sub>F</sub> links output back to input, so the two halves of the model are no longer separate. The algebra gets longer (the book admits that even experienced people take a wrong turn or two). Here are the results:</p>`,
        `<div class="eq">Z<sub>i</sub> ≅ r<sub>e</sub> / (1/β + R<sub>C</sub>/R<sub>F</sub>)    Z<sub>o</sub> ≅ R<sub>C</sub> ∥ R<sub>F</sub>    A<sub>v</sub> ≅ −R<sub>C</sub>/r<sub>e</sub>    (R<sub>F</sub> ≫ R<sub>C</sub>)</div>`,
        `<p class="aside">The book writes R<sub>C</sub>/(R<sub>C</sub> + R<sub>F</sub>) in Z<sub>i</sub>; with R<sub>F</sub> ≫ R<sub>C</sub> that's about R<sub>C</sub>/R<sub>F</sub>.</p>`,
      ]},
      { k: "why", title: "Why Z_i drops so much", b: [
        `<p>Rewrite Z<sub>i</sub> as conductances added up:</p>`,
        `<div class="eq">1/Z<sub>i</sub> = 1/(βr<sub>e</sub>) + (R<sub>C</sub>/r<sub>e</sub>)/R<sub>F</sub> = 1/(βr<sub>e</sub>) + |A<sub>v</sub>|/R<sub>F</sub></div>`,
        `<p>So Z<sub>i</sub> = βr<sub>e</sub> ∥ (R<sub>F</sub>/|A<sub>v</sub>|). Why does R<sub>F</sub> act |A<sub>v</sub>| times smaller? Raise the base by 1 mV and the collector falls by |A<sub>v</sub>| mV. The voltage across R<sub>F</sub> is huge compared with the input, so it pulls a lot of current from the source.</p>`,
        `<div class="key">A resistor bridging an inverting gain looks |A<sub>v</sub>| times smaller from the input. Chapter 9 calls this the <b>Miller effect</b>.</div>`,
      ]},
      { k: "play", title: "Shrink R_F", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let RF = 220e3;
          const VCC = 12, RC = 3.3e3, beta = 150;
          function draw() {
            const IB = (VCC - 0.7) / (RF + beta * RC), IE = (beta + 1) * IB, re = VT / IE, Av = -RC / re;
            const Zi = re / (1 / beta + RC / (RC + RF));
            ro.innerHTML = readout([["I<sub>E</sub>", si(IE, "A")], ["r<sub>e</sub>", ohm(re)], ["βr<sub>e</sub> alone", ohm(beta * re)], ["R<sub>F</sub>/|A<sub>v</sub>|", ohm(RF / Math.abs(Av))], ["Z<sub>i</sub>", ohm(Zi)], ["Z<sub>o</sub> = R<sub>C</sub> ∥ R<sub>F</sub>", ohm(par(RC, RF))], ["A<sub>v</sub>", fmt(Av, 3)]]);
          }
          host.append(slider({ id: id + "-rf", label: "Feedback resistor R<sub>F</sub>", min: 50e3, max: 2e6, log: true, value: RF, show: (v) => ohm(v) }, (v) => { RF = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">V<sub>CC</sub> = 12 V, R<sub>C</sub> = 3.3 kΩ, β = 150. Changing R<sub>F</sub> also moves the DC current, so r<sub>e</sub> and the gain shift too.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Default lab values: R<sub>F</sub> = 220 kΩ gives I<sub>E</sub> = 2.386 mA, so r<sub>e</sub> = 10.90 Ω.</p>`,
        { t: "num", q: "Z_i, using the book's form r_e/(1/β + R_C/(R_C + R_F))?", a: 508.5, unit: "Ω", tol: 0.01, hint: "1/150 = 0.00667; 3.3/223.3 = 0.01478.", why: "10.90/0.02145 = 508 Ω. βr_e alone would be 1.64 kΩ." },
        { t: "num", q: "A_v (R_F ≫ R_C)?", a: -302.8, tol: 0.01, hint: "−R_C/r_e.", why: "−3300/10.90 = −303." },
      ]},
      { k: "learn", title: "Two variations", b: [
        `<div class="two"><div class="tile"><h3>Add R<sub>E</sub></h3><p>Z<sub>i</sub> ≅ R<sub>E</sub> / [1/β + (R<sub>E</sub> + R<sub>C</sub>)/R<sub>F</sub>]<br>Z<sub>o</sub> = R<sub>C</sub> ∥ R<sub>F</sub><br>A<sub>v</sub> ≅ −R<sub>C</sub>/R<sub>E</sub></p></div><div class="tile"><h3>Including r<sub>o</sub></h3><p>If r<sub>o</sub> ≥ 10R<sub>C</sub>, the results above stand. Otherwise put r<sub>o</sub> in parallel with R<sub>C</sub> everywhere: Z<sub>o</sub> = r<sub>o</sub> ∥ R<sub>C</sub> ∥ R<sub>F</sub>.</p></div></div>`,
      ]},
      { k: "play", title: "Collector dc feedback: split R_F", b: [
        fig(cdfFig()),
        `<p>Split R<sub>F</sub> into two and put a capacitor from the middle to ground. For DC the capacitor is open: the bias still sees R<sub>F1</sub> + R<sub>F2</sub>. For ac it grounds the middle: R<sub>F1</sub> hangs across the input and R<sub>F2</sub> across the output. No more Miller penalty.</p>`,
        (host, id) => {
          const ro = el(`<div></div>`);
          let RF1 = 100e3;
          const RF = 220e3, RC = 3.3e3, beta = 150, re = 10.9;
          function draw() {
            const RF2 = RF - RF1;
            ro.innerHTML = readout([["R<sub>F1</sub> / R<sub>F2</sub>", ohm(RF1) + " / " + ohm(RF2)], ["Z<sub>i</sub> = R<sub>F1</sub> ∥ βr<sub>e</sub>", ohm(par(RF1, beta * re))], ["Z<sub>o</sub> = R<sub>C</sub> ∥ R<sub>F2</sub>", ohm(par(RC, RF2))], ["A<sub>v</sub> = −(R<sub>F2</sub> ∥ R<sub>C</sub>)/r<sub>e</sub>", fmt(-par(RF2, RC) / re, 3)], ["Unsplit Z<sub>i</sub>, for comparison", ohm(508)]]);
          }
          host.append(slider({ id: id + "-s", label: "R<sub>F1</sub> (R<sub>F1</sub> + R<sub>F2</sub> = 220 kΩ, same DC bias)", min: 10e3, max: 210e3, step: 5e3, value: RF1, show: (v) => ohm(v) }, (v) => { RF1 = v; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does splitting R_F with a grounded capacitor raise the input impedance?", model: "In plain collector feedback, R_F connects the input to an output that swings |A_v| times as much, inverted, so R_F draws a large current and looks like R_F/|A_v| from the input. With the capacitor grounding the middle, R_F1 only has the input voltage across it, so it looks like its real value in parallel with βr_e. The DC path through R_F1 + R_F2 is unchanged, so the bias stays stable." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Adding a load and a source resistance", mins: 25,
    blurb: "Real amplifiers drive loads and are fed by real sources. Both cost gain.",
    takeaway: "No-load gain A_vNL = V_o/V_i; loaded gain A_vL = V_o/V_i with R_L; source gain A_vs = V_o/V_s with R_L and R_s. Always |A_vNL| > |A_vL| > |A_vs|. Bigger R_L → more gain; smaller R_s → more gain. Coupling capacitors keep R_L and R_s from changing the DC bias. CE (fixed or divider): A_vL = −(R_C ∥ R_L)/r_e (or −(R_C ∥ R_L ∥ r_o)/r_e), Z_i and Z_o unchanged. A_vs = [Z_i/(Z_i + R_s)]A_vL. Follower: replace R_E by R_E ∥ R_L. Current gain from voltage gain: A_iL = −A_vL·Z_i/R_L, where R_L is whatever resistor carries I_o.",
    steps: [
      { k: "learn", title: "Three gains", b: [
        `<div class="two"><div class="tile"><h3>No load</h3><p>A<sub>vNL</sub> = V<sub>o</sub>/V<sub>i</sub></p></div><div class="tile"><h3>Loaded</h3><p>A<sub>vL</sub> = V<sub>o</sub>/V<sub>i</sub> with R<sub>L</sub> attached</p></div><div class="tile"><h3>From the source</h3><p>A<sub>vs</sub> = V<sub>o</sub>/V<sub>s</sub> with R<sub>L</sub> and R<sub>s</sub></p></div></div>`,
        `<div class="key">For the same amplifier: <b>|A<sub>vNL</sub>| &gt; |A<sub>vL</sub>| &gt; |A<sub>vs</sub>|</b>. A packaged amplifier's listed gain is always the no-load one.</div>`,
      ]},
      { k: "learn", title: "Where R_L and R_s go", b: [
        fig(ceFig({ rs: true, rin: "R_B", rl: true, zi: true, zo: true })),
        `<p>R<sub>L</sub> lands in parallel with R<sub>C</sub>. R<sub>s</sub> forms a voltage divider with Z<sub>i</sub>.</p>`,
        `<div class="eq">A<sub>vL</sub> = −(R<sub>C</sub> ∥ R<sub>L</sub>)/r<sub>e</sub>    V<sub>i</sub> = Z<sub>i</sub>V<sub>s</sub>/(Z<sub>i</sub> + R<sub>s</sub>)    A<sub>vs</sub> = [Z<sub>i</sub>/(Z<sub>i</sub> + R<sub>s</sub>)]·A<sub>vL</sub></div>`,
        `<p class="aside">For this circuit Z<sub>i</sub> and Z<sub>o</sub> don't change. And thanks to the coupling capacitors, the DC bias doesn't either.</p>`,
      ]},
      { k: "play", title: "Load it, feed it", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const re = 10.22, RC = 3.3e3, Zi = 1224;
          let RL = 4.7e3, Rs = 600;
          function draw() {
            const NL = RC / re, L = par(RC, RL) / re, Sg = (Zi / (Zi + Rs)) * L, max = NL;
            const bar = (v, y, cls, lab) => `<rect x="130" y="${y}" width="${Math.max(1, (v / max) * 330)}" height="22" style="fill:var(--${cls})"/>` + S.t(120, y + 16, lab, { a: "end", cls: "s" }) + S.t(136 + Math.max(1, (v / max) * 330), y + 16, fmt(v, 3), { a: "start", cls: "s" });
            f.innerHTML = S.svg(540, 130, bar(NL, 10, "muted", "|A_vNL|") + bar(L, 50, "cool", "|A_vL|") + bar(Sg, 90, "accent", "|A_vs|"), { max: 540, label: "Bar chart of no-load, loaded and source gains" });
            ro.innerHTML = readout([["R<sub>C</sub> ∥ R<sub>L</sub>", ohm(par(RC, RL))], ["Z<sub>i</sub>/(Z<sub>i</sub> + R<sub>s</sub>)", fmt(Zi / (Zi + Rs), 3)], ["A<sub>iL</sub> = −A<sub>vL</sub>Z<sub>i</sub>/R<sub>L</sub>", fmt((L * Zi) / RL, 3)]]);
          }
          host.append(f, slider({ id: id + "-rl", label: "Load R<sub>L</sub>", min: 300, max: 100e3, log: true, value: RL, show: (v) => ohm(v) }, (v) => { RL = v; draw(); }).el,
            slider({ id: id + "-rs", label: "Source resistance R<sub>s</sub>", min: 10, max: 20e3, log: true, value: Rs, show: (v) => ohm(v) }, (v) => { Rs = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The amplifier: the fixed-bias lab default (r<sub>e</sub> = 10.2 Ω, R<sub>C</sub> = 3.3 kΩ, Z<sub>i</sub> = 1.22 kΩ). Push R<sub>L</sub> up toward open circuit and R<sub>s</sub> down toward a short: both gains climb back toward the no-load value.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Back to the Part 3 amplifier: r<sub>e</sub> = 12.10 Ω, R<sub>C</sub> = 2.2 kΩ, Z<sub>i</sub> = 1.206 kΩ.</p>`,
        { t: "num", q: "Add R_L = 2.2 kΩ. A_vL?", a: -90.91, tol: 0.01, hint: "R_C ∥ R_L first.", why: "1.1 kΩ/12.10 Ω = −90.9: half the no-load gain, since R_L = R_C." },
        { t: "num", q: "Also R_s = 600 Ω. A_vs?", a: -60.71, tol: 0.01, hint: "Multiply A_vL by Z_i/(Z_i + R_s).", why: "1206/1806 = 0.668; 0.668 × −90.9 = −60.7." },
      ]},
      { k: "learn", title: "Current gain, for free", b: [
        `<p>Once you have A<sub>v</sub>, you don't need a separate current-gain derivation. With I<sub>i</sub> = V<sub>i</sub>/Z<sub>i</sub> and I<sub>o</sub> = −V<sub>o</sub>/R<sub>L</sub> (minus because I<sub>o</sub> is defined flowing in):</p>`,
        `<div class="eq">A<sub>iL</sub> = I<sub>o</sub>/I<sub>i</sub> = −A<sub>vL</sub>·Z<sub>i</sub>/R<sub>L</sub></div>`,
        `<div class="key">R<sub>L</sub> here means the resistor the output current I<sub>o</sub> flows through. For an unloaded CE stage with I<sub>o</sub> defined in R<sub>C</sub>, that's R<sub>C</sub>.</div>`,
        `<p class="aside">Book slip: Section 5.13 says it will "demonstrate the validity of Eq. (5.82)". It means Eq. (5.85), this one.</p>`,
        { t: "num", q: "No-load CE stage: A_v = −240, Z_i = 1.5 kΩ, I_o defined in R_C = 4 kΩ. A_i?", a: 90, hint: "−A_v·Z_i/R_C.", why: "240 × 1.5/4 = 90." },
      ]},
      { k: "learn", title: "Followers with a load", b: [
        `<p>For the emitter follower, R<sub>L</sub> lands in parallel with R<sub>E</sub>. Replace R<sub>E</sub> by R<sub>E</sub> ∥ R<sub>L</sub> wherever it appears:</p>`,
        `<div class="eq">A<sub>vL</sub> = (R<sub>E</sub> ∥ R<sub>L</sub>)/(R<sub>E</sub> ∥ R<sub>L</sub> + r<sub>e</sub>)    Z<sub>b</sub> ≅ β(R<sub>E</sub> ∥ R<sub>L</sub>)    Z<sub>o</sub> ≅ r<sub>e</sub></div>`,
        `<p class="aside">So here, unlike the CE stage, the load <b>does</b> change Z<sub>i</sub>. You saw it in the buffer test.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the gain from the source always less than the loaded gain?", model: "Because the source resistance and the amplifier's input impedance form a voltage divider, so only the fraction Z_i/(Z_i + R_s) of the source voltage reaches the amplifier's input. The loaded gain then multiplies that smaller input, so A_vs = [Z_i/(Z_i + R_s)]A_vL, which is smaller." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  function twoPort(o = {}) {
    let s = "";
    if (o.rs) s += S.vsrc(40, 110, "V_s") + S.wire([40, 92], [40, 50]) + S.res(40, 50, 110, 50, "R_s") + S.wire([40, 128], [40, 170], [110, 170]);
    s += `<rect x="130" y="25" width="260" height="170" rx="10" style="fill:none;stroke:var(--line);stroke-width:2;stroke-dasharray:6 5"/>`;
    s += S.wire([110, 50], [170, 50]) + S.wire([110, 170], [400, 170]) + S.dot(110, 50) + S.dot(110, 170) + S.t(116, 44, "V_i", { a: "start", cls: "a s" });
    s += S.res(170, 50, 170, 170, "R_i", { side: "right" });
    s += S.vsrc(290, 110, "A_vNL·V_i", { side: "left", tcls: "s" }) + S.wire([290, 92], [290, 50]) + S.res(290, 50, 380, 50, "R_o") + S.wire([290, 128], [290, 170]) + S.wire([380, 50], [420, 50]);
    if (o.rl) s += S.res(440, 50, 440, 170, "R_L", { side: "right", cls: "hl" }) + S.wire([420, 50], [440, 50]) + S.wire([400, 170], [440, 170]);
    else s += S.wire([400, 170], [420, 170]);
    s += S.dot(420, 50) + S.dot(420, 170) + S.t(420, 40, "V_o", { cls: "a" }) + S.t(260, 20, "packaged amplifier", { cls: "s m" });
    return S.svg(500, 205, s, { max: 500, label: "Two-port amplifier model: input resistance Ri, output Thevenin source AvNL times Vi with Ro" });
  }
  const p9 = {
    id: "p9", title: "The two-port view", mins: 20,
    blurb: "Treat any amplifier as a sealed box with three numbers: Z_i, Z_o and its no-load gain.",
    takeaway: "A packaged amplifier is described by its no-load data: A_vNL, R_i = Z_i and R_o = Z_o. Model: R_i across the input; a Thévenin source A_vNL·V_i behind R_o at the output. Then A_vL = [R_L/(R_L + R_o)]A_vNL, V_i = [R_i/(R_i + R_s)]V_s, A_vs = [R_i/(R_i + R_s)][R_L/(R_L + R_o)]A_vNL, A_iL = −A_vL·R_i/R_L. Both reduction factors multiply: one weak factor ruins the total. Caution: for some circuits Z_i depends on R_L (follower, collector feedback) or Z_o depends on R_s (follower); then compute the right Z_i and Z_o first.",
    steps: [
      { k: "learn", title: "The sealed box", b: [
        seen("Thévenin: any linear box looks like a source and a resistor from its terminals.", "03-network-theorems.html#p8", "Chapter 3, Part 8"),
        `<p>A designer often gets a sealed amplifier and a datasheet, with no access inside. The datasheet's numbers are always <b>no-load</b> values: A<sub>vNL</sub>, R<sub>i</sub> (= Z<sub>i</sub>) and R<sub>o</sub> (= Z<sub>o</sub>).</p>`,
        fig(twoPort()),
        `<p>The output is a Thévenin source. With nothing attached, no current flows through R<sub>o</sub>, so V<sub>o</sub> = A<sub>vNL</sub>V<sub>i</sub>.</p>`,
      ]},
      { k: "learn", title: "Attach source and load", b: [
        fig(twoPort({ rs: true, rl: true })),
        `<p>Two voltage dividers, one at each end:</p>`,
        `<div class="eq">A<sub>vs</sub> = [R<sub>i</sub>/(R<sub>i</sub> + R<sub>s</sub>)] · [R<sub>L</sub>/(R<sub>L</sub> + R<sub>o</sub>)] · A<sub>vNL</sub></div>`,
        `<div class="eq">A<sub>vL</sub> = [R<sub>L</sub>/(R<sub>L</sub> + R<sub>o</sub>)]A<sub>vNL</sub>    A<sub>iL</sub> = −A<sub>vL</sub>R<sub>i</sub>/R<sub>L</sub></div>`,
      ]},
      { k: "play", title: "The weakest link", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const A = -320, Ri = 2500, Ro = 1500;
          let Rs = 1000, RL = 3000;
          function draw() {
            const fi = Ri / (Ri + Rs), fo = RL / (RL + Ro), tot = fi * fo;
            const bar = (v, y, cls, lab) => `<rect x="170" y="${y}" width="${Math.max(1, v * 300)}" height="22" style="fill:var(--${cls})"/>` + S.t(160, y + 16, lab, { a: "end", cls: "s" }) + S.t(176 + Math.max(1, v * 300), y + 16, fmt(v, 3), { a: "start", cls: "s" });
            f.innerHTML = S.svg(540, 130, bar(fi, 10, "cool", "input factor") + bar(fo, 50, "cool", "output factor") + bar(tot, 90, "accent", "product"), { max: 540, label: "The two reduction factors and their product" });
            ro.innerHTML = readout([["A<sub>vL</sub>", fmt(fo * A, 3)], ["A<sub>vs</sub>", fmt(tot * A, 3)], ["A<sub>iL</sub>", fmt((-fo * A * Ri) / RL, 3)]]);
          }
          host.append(f, slider({ id: id + "-rs", label: "R<sub>s</sub>", min: 10, max: 20e3, log: true, value: Rs, show: (v) => ohm(v) }, (v) => { Rs = v; draw(); }).el,
            slider({ id: id + "-rl", label: "R<sub>L</sub>", min: 100, max: 100e3, log: true, value: RL, show: (v) => ohm(v) }, (v) => { RL = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Box: A<sub>vNL</sub> = −320, R<sub>i</sub> = 2.5 kΩ, R<sub>o</sub> = 1.5 kΩ. Make one factor 0.9 and the other 0.2: the product is 0.18, close to the weak one. Good design needs both factors high.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Same box: A<sub>vNL</sub> = −320, R<sub>i</sub> = 2.5 kΩ, R<sub>o</sub> = 1.5 kΩ. R<sub>L</sub> = 3 kΩ, R<sub>s</sub> = 1 kΩ.</p>`,
        { t: "num", q: "A_vL?", a: -213.3, tol: 0.01, hint: "Multiply by R_L/(R_L + R_o).", why: "3/4.5 = 0.667, so −213.3." },
        { t: "num", q: "A_vs?", a: -152.4, tol: 0.01, hint: "Now also multiply by R_i/(R_i + R_s).", why: "2.5/3.5 = 0.714; 0.714 × −213.3 = −152.4." },
        { t: "num", q: "A_iL?", a: 177.8, tol: 0.01, hint: "−A_vL·R_i/R_L.", why: "213.3 × 2.5/3 = 177.8." },
      ]},
      { k: "whatif", title: "When the box isn't sealed tight", b: [
        `<p>The two-port model assumes R<sub>i</sub> ignores the load and R<sub>o</sub> ignores the source. Op-amp packages are designed to make that true. Single transistors often aren't:</p>`,
        { t: "sort", q: "Which number shifts when you attach things?", bins: ["Z_i changes with R_L", "Z_o changes with R_s", "Neither (CE, R_E bypassed)"], items: [
          ["Emitter follower, input side", 0, "R_L sits in parallel with R_E, and R_E is reflected into the base."],
          ["Emitter follower, output side", 1, "Z_o = R_E ∥ (r_e + R′_s/β): the source resistance appears divided by β."],
          ["Collector feedback, input side", 0, "R_F connects the output back to the input, so the load changes the gain and the Miller-reduced R_F."],
          ["Fixed-bias CE", 2, "Input and output halves are linked only by the current source."],
        ]},
        `<p class="aside">In those cases, work out Z<sub>i</sub> and Z<sub>o</sub> for the actual R<sub>L</sub> and R<sub>s</sub> first, then use the two-port equations.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What three numbers describe an amplifier in the two-port approach, and how do you get the gain with a source and load attached?", model: "The no-load voltage gain, the input resistance and the output resistance. The input resistance and source resistance form a divider at the input, and the output resistance and load form a divider at the output. Multiply the no-load gain by both divider factors to get the overall gain." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  function chain(stages) {
    /* stages: [{n, Zi, Zo, A}] boxes in a row, drawn left to right. */
    let s = S.vsrc(40, 100, "V_s") + S.wire([40, 82], [40, 60]) + S.res(40, 60, 100, 60, "R_s") + S.wire([40, 118], [40, 140], [100 + stages.length * 150 + 40, 140]);
    stages.forEach((st, i) => {
      const x = 110 + i * 150;
      s += S.wire([x - 10, 60], [x, 60]) + S.box(x, 35, 110, 80, "") + S.t(x + 55, 62, st.n, { cls: "s" }) + S.t(x + 55, 82, "A_vNL = " + st.A, { cls: "s m" }) + S.t(x + 55, 100, "Z_i " + st.Zi + " · Z_o " + st.Zo, { cls: "s m" });
      s += S.wire([x + 110, 60], [x + 140, 60]);
    });
    const xe = 100 + stages.length * 150 + 40;
    s += S.res(xe, 60, xe, 140, "R_L", { side: "right" }) + S.wire([xe - 10, 60], [xe, 60]) + S.t(xe, 50, "V_o", { cls: "a" });
    return S.svg(xe + 70, 165, s, { max: xe + 70, label: "Cascade of amplifier stages between a source and a load" });
  }
  const p10 = {
    id: "p10", title: "Cascades", mins: 25,
    blurb: "Stages in a row: each one loads the one before. Multiply the loaded gains.",
    takeaway: "Total gain A_vT = A_v1·A_v2·A_v3…, using each stage's LOADED gain: the load on stage 1 is Z_i of stage 2, and so on. A_iT = −A_vT·Z_i1/R_L. A follower in front of a low-Z_i stage (like common base) rescues the signal from the source divider. RC-coupled stages: coupling capacitors isolate the DC bias; for ac, stage 2's Z_i = R_1 ∥ R_2 ∥ βr_e loads stage 1. Cascode: a CE stage whose collector feeds the emitter of a CB stage. The CE stage sees the CB's r_e as its load, so its gain is about −1 (good for high frequency, Chapter 9); the CB stage supplies the gain, about R_C/r_e.",
    steps: [
      { k: "learn", title: "Multiply, but loaded", b: [
        seen("Two stages in a row: the second stage's input resistance loads the first.", "08-small-signal-model.html#p4", "Chapter 8, Part 4"),
        `<div class="eq">A<sub>vT</sub> = A<sub>v1</sub> · A<sub>v2</sub> · A<sub>v3</sub> · …    A<sub>iT</sub> = −A<sub>vT</sub>·Z<sub>i1</sub>/R<sub>L</sub></div>`,
        `<div class="key">Each A<sub>v</sub> is the gain <b>with the next stage attached</b>. The load on stage 1 is Z<sub>i2</sub>; the load on the last stage is R<sub>L</sub>. No stage ever runs at its no-load gain in a cascade.</div>`,
      ]},
      { k: "play", title: "A follower to the rescue", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let withEF = true, Rs = 2000;
          const RL = 4700, EF = { Zi: 12e3, Zo: 15, A: 1 }, CB = { Zi: 20, Zo: 4700, A: 200 };
          function draw() {
            f.innerHTML = withEF ? chain([{ n: "follower", Zi: "12k", Zo: "15", A: 1 }, { n: "common base", Zi: "20", Zo: "4.7k", A: 200 }]) : chain([{ n: "common base", Zi: "20", Zo: "4.7k", A: 200 }]);
            const a2 = (RL / (RL + CB.Zo)) * CB.A;
            let rows;
            if (withEF) {
              const a1 = (CB.Zi / (CB.Zi + EF.Zo)) * EF.A, inF = EF.Zi / (EF.Zi + Rs);
              rows = [["Stage 1 (loaded by 20 Ω)", fmt(a1, 3)], ["Stage 2 (loaded by R<sub>L</sub>)", fmt(a2, 3)], ["A<sub>vT</sub>", fmt(a1 * a2, 3)], ["Input factor Z<sub>i1</sub>/(Z<sub>i1</sub> + R<sub>s</sub>)", fmt(inF, 3)], ["A<sub>vs</sub>", fmt(inF * a1 * a2, 3)]];
            } else {
              const inF = CB.Zi / (CB.Zi + Rs);
              rows = [["Common base (loaded)", fmt(a2, 3)], ["Input factor", fmt(inF, 3)], ["A<sub>vs</sub>", fmt(inF * a2, 3)]];
            }
            ro.innerHTML = readout(rows);
          }
          host.append(f, toggle(["Follower + common base", "Common base alone"], (k) => { withEF = k === 0; draw(); }, 0),
            slider({ id: id + "-rs", label: "Source resistance R<sub>s</sub>", min: 50, max: 20e3, log: true, value: Rs, show: (v) => ohm(v) }, (v) => { Rs = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">No-load data on the boxes (the follower's Z<sub>i</sub> and Z<sub>o</sub> are its loaded values). Compare A<sub>vs</sub> with and without the follower. The follower's 15 Ω output against the CB's 20 Ω input still loses some signal: the match isn't perfect.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Use the default: follower then common base, R<sub>s</sub> = 2 kΩ, R<sub>L</sub> = 4.7 kΩ.</p>`,
        { t: "num", q: "Loaded gain of the follower?", a: 0.5714, tol: 0.01, hint: "Z_i2/(Z_i2 + Z_o1) × 1.", why: "20/35 = 0.571." },
        { t: "num", q: "Loaded gain of the common-base stage?", a: 100, tol: 0.01, hint: "R_L/(R_L + Z_o2) × 200.", why: "4.7/9.4 × 200 = 100." },
        { t: "num", q: "A_vs for the whole system?", a: 48.98, tol: 0.01, hint: "Input factor 12/(12 + 2), times the two stage gains.", why: "0.857 × 0.571 × 100 = 49. Without the follower: 20/2020 × 100 ≈ 0.99. About 50 times better." },
        { t: "num", q: "Total current gain A_iT?", a: -145.9, tol: 0.01, hint: "−A_vT·Z_i1/R_L, with A_vT = 57.14.", why: "−57.14 × 12/4.7 = −146. The minus sign is from the 'both currents flow in' convention." },
      ]},
      { k: "learn", title: "RC-coupled stages", b: [
        `<p>Two CE stages linked by a coupling capacitor C<sub>C</sub>. For DC it's open, so each stage has its own bias. For ac it's a short, so stage 2's input appears across stage 1's output.</p>`,
        `<div class="eq">A<sub>v1</sub> = −[R<sub>C</sub> ∥ Z<sub>i2</sub>]/r<sub>e1</sub>    Z<sub>i2</sub> = R<sub>1</sub> ∥ R<sub>2</sub> ∥ βr<sub>e2</sub></div>`,
        `<p>Two identical stages: R<sub>1</sub> = 33 kΩ, R<sub>2</sub> = 6.8 kΩ, R<sub>C</sub> = 3.3 kΩ, R<sub>E</sub> bypassed, β = 150, r<sub>e</sub> = 13 Ω.</p>`,
        { t: "num", q: "Z_i2?", a: 1449, unit: "Ω", tol: 0.01, hint: "33k ∥ 6.8k ∥ (150 × 13).", why: "5.64 kΩ ∥ 1.95 kΩ = 1.45 kΩ." },
        { t: "num", q: "Stage 1's loaded gain?", a: -77.45, tol: 0.01, hint: "−(R_C ∥ Z_i2)/r_e.", why: "3.3k ∥ 1.449k = 1.007 kΩ; ÷ 13 Ω = −77.5, far below the −254 it would give unloaded." },
        { t: "num", q: "Total no-load gain (stage 2 unloaded)?", a: 19660, tol: 0.01, hint: "Stage 2 unloaded: −R_C/r_e = −253.8. Multiply.", why: "(−77.45)(−253.8) ≈ +19 700. Two inversions make a positive gain." },
        `<p class="aside">Book slip: Example 5.15(b) says "with the 10-kΩ load applied", but its working (and its own question) uses 4.7 kΩ.</p>`,
      ]},
      { k: "learn", title: "Cascode", b: [
        `<p>Stack a CE transistor under a CB transistor: Q1's collector feeds Q2's emitter. Q1's load is just the input of a CB stage, r<sub>e2</sub>. With equal currents, r<sub>e1</sub> = r<sub>e2</sub>:</p>`,
        `<div class="eq">A<sub>v1</sub> = −r<sub>e2</sub>/r<sub>e1</sub> ≅ −1    A<sub>v2</sub> = R<sub>C</sub>/r<sub>e</sub>    A<sub>vT</sub> ≅ −R<sub>C</sub>/r<sub>e</sub></div>`,
        `<p>Same total gain as one CE stage. So why bother? The first stage has gain ≈ −1, which keeps the Miller effect small, and the CB stage handles high frequencies well. Chapter 9 shows why that matters. And the CE input gives a decent Z<sub>i</sub>, which a CB alone can't.</p>`,
        { t: "num", q: "A cascode with both transistors at I_E = 2 mA and R_C = 2.7 kΩ. Overall gain?", a: -207.7, tol: 0.01, hint: "r_e = 13 Ω. (−1) × R_C/r_e.", why: "−2700/13 = −208." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't you just multiply the datasheet (no-load) gains of cascaded stages?", model: "Because each stage is loaded by the input impedance of the next, and the loaded gain is less than the no-load gain. You have to find each stage's gain with the following stage attached as its load, and then multiply those loaded gains." },
      ]},
    ],
  };

  /* =============== PART 11 =============== */
  const p11 = {
    id: "p11", title: "Darlington and feedback pair", mins: 25,
    blurb: "Two transistors acting as one super-β transistor. What they do to Z_i, Z_o and A_i.",
    takeaway: "Darlington: β_D = β_1β_2, V_BE ≈ 1.4 V (packaged: up to about 2 V). Follower with R_E: I_B1 = (V_CC − V_BE1 − V_BE2)/(R_B + β_DR_E), Z_i = R_B ∥ β_DR_E, A_i ≈ β_DR_B/(R_B + β_DR_E), A_v ≈ 1, Z_o ≈ r_e1/β_2 + r_e2 (= 2r_e2, since I_E1 = I_E2/β_2). CE with R_E bypassed: Z_i′ = β_1(r_e1 + β_2r_e2), A_v = −β_DR_C/Z_i′, Z_o ≈ R_C ∥ r_o2, A_i (Z_i′ alone) = β_D. Feedback pair (pnp driving npn, acts like one pnp): Z_i′ ≈ β_1β_2R_C, A_v ≈ 1, Z_o ≈ r_e1/β_2, A_i = −β_1β_2R_B/(R_B + β_1β_2R_C).",
    steps: [
      { k: "learn", title: "Super-beta", b: [
        ch(4, "04-dc-biasing-bjts.html", "p10", "Part 10", "The Darlington's DC bias was in Chapter 4."),
        `<p>Q1's emitter drives Q2's base. Q1's emitter current is Q2's base current, so the gains multiply:</p>`,
        `<div class="eq">β<sub>D</sub> = β<sub>1</sub>β<sub>2</sub>    V<sub>BE</sub> = V<sub>BE1</sub> + V<sub>BE2</sub> ≈ 1.4 V</div>`,
        `<p class="aside">Sidney Darlington patented it in 1953. Packaged versions (such as the MPSA28: β<sub>D</sub> = 10 000, V<sub>BE(on)</sub> = 2 V, I<sub>C</sub> up to 800 mA) put both transistors on one chip with just three leads. Their I<sub>CEO</sub> leakage is much higher than a single transistor's.</p>`,
      ]},
      { k: "play", title: "Darlington follower lab", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          const p = { b1: 80, b2: 120, RB: 2.2e6, RE: 470, VCC: 15 };
          function draw() {
            const bD = p.b1 * p.b2, IB1 = (p.VCC - 1.4) / (p.RB + bD * p.RE), IE2 = bD * IB1, IE1 = IE2 / p.b2, re2 = VT / IE2, re1 = VT / IE1;
            ro.innerHTML = readout([["β<sub>D</sub>", fmt(bD, 4)], ["I<sub>B1</sub>", si(IB1, "A")], ["I<sub>E2</sub>", si(IE2, "A")], ["V<sub>E2</sub>", fmt(IE2 * p.RE, 3) + " V"], ["Z<sub>i</sub> = R<sub>B</sub> ∥ β<sub>D</sub>R<sub>E</sub>", ohm(par(p.RB, bD * p.RE))], ["A<sub>i</sub>", fmt((bD * p.RB) / (p.RB + bD * p.RE), 4)], ["r<sub>e1</sub>/β<sub>2</sub>", ohm(re1 / p.b2)], ["r<sub>e2</sub>", ohm(re2)], ["Z<sub>o</sub>", ohm(re1 / p.b2 + re2)]]);
          }
          host.append(slider({ id: id + "-b1", label: "β<sub>1</sub>", min: 40, max: 200, step: 5, value: p.b1 }, (v) => { p.b1 = v; draw(); }).el,
            slider({ id: id + "-b2", label: "β<sub>2</sub>", min: 40, max: 200, step: 5, value: p.b2 }, (v) => { p.b2 = v; draw(); }).el,
            slider({ id: id + "-re", label: "R<sub>E</sub>", min: 100, max: 2000, step: 10, value: p.RE, show: (v) => ohm(v) }, (v) => { p.RE = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">V<sub>CC</sub> = 15 V, R<sub>B</sub> = 2.2 MΩ. Watch the two Z<sub>o</sub> pieces as you move the sliders.</p>`,
      ]},
      { k: "why", title: "A coincidence that isn't", b: [
        { t: "mcq", q: "In the lab, r_e1/β_2 always equals r_e2 exactly. Why?", opts: [
          ["Because I_E1 = I_E2/β_2, so r_e1 = 26 mV/I_E1 = β_2·(26 mV/I_E2) = β_2·r_e2", true, "Q1 carries only Q2's base current, so its r_e is β_2 times bigger. Divide by β_2 and you're back to r_e2. So Z_o ≈ 2r_e2."],
          ["Because both transistors have the same β", false, "Set β_1 and β_2 differently: they still match."],
          ["It's a rounding effect", false, "It's exact, for any β values."],
        ]},
        `<p>The same trick works for the Darlington amplifier with R<sub>E</sub> bypassed: Z<sub>i</sub>′ = β<sub>1</sub>(r<sub>e1</sub> + β<sub>2</sub>r<sub>e2</sub>) = 2β<sub>D</sub>r<sub>e2</sub>, so A<sub>v</sub> = −β<sub>D</sub>R<sub>C</sub>/Z<sub>i</sub>′ = −R<sub>C</sub>/2r<sub>e2</sub>.</p>`,
        `<p class="aside">Book slip: in the Darlington amplifier example, the A<sub>v</sub> line multiplies by 12 000, but β<sub>D</sub> = 12 100. The printed result (−241) is the one for 12 100.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Lab defaults: β<sub>1</sub> = 80, β<sub>2</sub> = 120, R<sub>B</sub> = 2.2 MΩ, R<sub>E</sub> = 470 Ω, V<sub>CC</sub> = 15 V.</p>`,
        { t: "num", q: "I_E2, in mA?", a: 19.45, unit: "mA", tol: 0.01, hint: "I_B1 = (15 − 1.4)/(R_B + β_DR_E), then × β_D.", why: "I_B1 = 13.6/6.712 MΩ = 2.026 µA; × 9600 = 19.45 mA." },
        { t: "num", q: "Z_i, in MΩ?", a: 1.479, unit: "MΩ", tol: 0.01, hint: "R_B ∥ β_DR_E.", why: "2.2 MΩ ∥ 4.512 MΩ = 1.48 MΩ. Compare a single transistor follower: a few hundred kΩ at best." },
        { t: "num", q: "Z_o?", a: 2.673, unit: "Ω", tol: 0.02, hint: "2r_e2.", why: "r_e2 = 26/19.45 = 1.337 Ω, so Z_o ≈ 2.67 Ω." },
      ]},
      { k: "learn", title: "The feedback pair", b: [
        `<p>A <b>pnp</b> Q1 drives an <b>npn</b> Q2; together they act like one pnp with β ≈ β<sub>1</sub>β<sub>2</sub>. The output is taken at the collector across R<sub>C</sub>, yet the behaviour is like a follower:</p>`,
        `<div class="eq">Z<sub>i</sub>′ ≅ β<sub>1</sub>β<sub>2</sub>R<sub>C</sub>    Z<sub>i</sub> = R<sub>B</sub> ∥ Z<sub>i</sub>′    A<sub>v</sub> ≅ 1    Z<sub>o</sub> ≅ r<sub>e1</sub>/β<sub>2</sub>    A<sub>i</sub> = −β<sub>1</sub>β<sub>2</sub>R<sub>B</sub>/(R<sub>B</sub> + β<sub>1</sub>β<sub>2</sub>R<sub>C</sub>)</div>`,
        `<p class="aside">DC: I<sub>B1</sub> = (V<sub>CC</sub> − V<sub>EB1</sub>)/(R<sub>B</sub> + β<sub>1</sub>β<sub>2</sub>R<sub>C</sub>). Chapter 12 pairs a Darlington with a feedback pair to make complementary output stages.</p>`,
        { t: "num", q: "β_1 = 120, β_2 = 150, R_C = 100 Ω, R_B = 1.5 MΩ. Z_i, in MΩ?", a: 0.8182, unit: "MΩ", tol: 0.01, hint: "Z_i′ = β_1β_2R_C, then in parallel with R_B.", why: "Z_i′ = 1.8 MΩ; 1.5 ∥ 1.8 = 0.818 MΩ, from a 100 Ω collector resistor." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a Darlington follower buy you over a single-transistor follower?", model: "A much higher current gain, β_1β_2, so the input impedance (about β_DR_E in parallel with R_B) is far higher and the source is loaded much less. The output impedance is still very low, about twice r_e of the output transistor, and the voltage gain is still just under 1." },
      ]},
    ],
  };

  /* =============== PART 12 =============== */
  function hybFig(o = {}) {
    let s = S.wire([40, 40], [80, 40]) + S.res(80, 40, 160, 40, o.hi || "h_i") + S.wire([160, 40], [190, 40]) + S.vsrc(190, 105, "", {}) + S.t(214, 110, o.hr || "h_r·V_o", { a: "start", cls: "s" }) + S.wire([190, 40], [190, 87]) + S.wire([190, 123], [190, 170], [40, 170]);
    s += S.dot(40, 40) + S.dot(40, 170) + S.t(30, 110, "V_i", { a: "end", cls: "a" }) + S.arrow(46, 28, 76, 28, "I_i", { ly: 22 });
    s += S.isrc(330, 105, o.hf || "h_f·I_i", { down: true, side: "left" }) + S.wire([330, 87], [330, 40], [460, 40]) + S.wire([330, 123], [330, 170], [460, 170]);
    s += S.res(400, 40, 400, 170, "1/h_o", { side: "right" }) + S.dot(400, 40) + S.dot(400, 170) + S.dot(460, 40) + S.dot(460, 170) + S.t(470, 110, "V_o", { a: "start", cls: "a" }) + S.arrow(454, 28, 424, 28, "I_o", { ly: 22 });
    if (o.approx) s = s.replace(S.vsrc(190, 105, "", {}), `<g opacity="0.25">${S.vsrc(190, 105, "", {})}</g>`).replace(S.res(400, 40, 400, 170, "1/h_o", { side: "right" }), `<g opacity="0.25">${S.res(400, 40, 400, 170, "1/h_o", { side: "right" })}</g>`);
    return S.svg(520, 200, s, { max: 520, label: "Hybrid equivalent circuit: hi and hr·Vo at the input, hf·Ii and 1/ho at the output" });
  }
  const p12 = {
    id: "p12", title: "The hybrid (h) model", mins: 25,
    blurb: "The datasheet's model: four h-parameters measured with the output shorted or the input open.",
    takeaway: "Two-port equations: V_i = h_11I_i + h_12V_o and I_o = h_21I_i + h_22V_o. h_11 = h_i = V_i/I_i with V_o = 0 (short-circuit input impedance, Ω). h_12 = h_r = V_i/V_o with I_i = 0 (open-circuit reverse voltage ratio, no units). h_21 = h_f = I_o/I_i with V_o = 0 (short-circuit forward current ratio, no units). h_22 = h_o = I_o/V_o with I_i = 0 (open-circuit output admittance, S). A second letter names the configuration: h_ie, h_fb, and so on. Circuit: h_i in series with a source h_rV_o at the input; h_fI_i in parallel with 1/h_o at the output. Approximate model drops h_r and 1/h_o. Links to the r_e model: h_ie = βr_e, h_fe = β_ac, h_ib = r_e, h_fb = −α ≈ −1, h_oe = 1/r_o. Datasheet values are at the maker's operating point; h_fe varies least, h_ie must be recalculated at your current.",
    steps: [
      { k: "learn", title: "Why another model?", b: [
        `<div class="two"><div class="tile"><h3>r<sub>e</sub> model</h3><p>+ Built from <b>your</b> operating point.<br>− No output resistance or feedback term unless you look them up.</p></div><div class="tile"><h3>Hybrid model</h3><p>+ Every parameter on the datasheet.<br>− Measured at the <b>maker's</b> operating point (for example I<sub>C</sub> = 1 mA, V<sub>CE</sub> = 10 V for the 2N4400).</p></div></div>`,
        `<p>Datasheets list a range for each h-parameter, so you can compare transistors at a glance. Know both models and how to translate between them.</p>`,
      ]},
      { k: "learn", title: "Four numbers, two equations", b: [
        `<div class="eq">V<sub>i</sub> = h<sub>11</sub>I<sub>i</sub> + h<sub>12</sub>V<sub>o</sub>    I<sub>o</sub> = h<sub>21</sub>I<sub>i</sub> + h<sub>22</sub>V<sub>o</sub></div>`,
        `<p>To isolate one parameter, kill the other term: <b>short the output</b> (V<sub>o</sub> = 0) or <b>open the input</b> (I<sub>i</sub> = 0).</p>`,
        `<div class="two"><div class="tile"><h3>h<sub>11</sub> = h<sub>i</sub></h3><p>V<sub>i</sub>/I<sub>i</sub>, output shorted. Ohms. Input impedance.</p></div><div class="tile"><h3>h<sub>12</sub> = h<sub>r</sub></h3><p>V<sub>i</sub>/V<sub>o</sub>, input open. No units. Reverse voltage ratio.</p></div><div class="tile"><h3>h<sub>21</sub> = h<sub>f</sub></h3><p>I<sub>o</sub>/I<sub>i</sub>, output shorted. No units. Forward current ratio.</p></div><div class="tile"><h3>h<sub>22</sub> = h<sub>o</sub></h3><p>I<sub>o</sub>/V<sub>o</sub>, input open. Siemens. Output admittance.</p></div></div>`,
        `<p class="aside">"Hybrid" because the units are mixed (Ω, S, none), and because the circuit mixes a Thévenin input with a Norton output. Subscript digits: first = what's measured, second = what causes it (1 = input, 2 = output).</p>`,
      ]},
      { k: "check", title: "Sort the conditions", b: [
        { t: "sort", q: "Which terminal condition defines each parameter?", bins: ["Output shorted (V_o = 0)", "Input open (I_i = 0)"], items: [
          ["h_i, the input impedance", 0, "Shorting the output kills the h_rV_o term in the first equation."],
          ["h_r, the reverse voltage ratio", 1, "Opening the input kills the h_iI_i term."],
          ["h_f, the forward current ratio", 0, "Shorting the output kills the h_oV_o term in the second equation."],
          ["h_o, the output admittance", 1, "Opening the input kills the h_fI_i term."],
        ]},
      ]},
      { k: "learn", title: "The circuit that fits the equations", b: [
        fig(hybFig()),
        `<p>Equation 1 sums voltages: a resistor h<sub>i</sub> in series with a controlled voltage source h<sub>r</sub>V<sub>o</sub>. Equation 2 sums currents: a controlled current source h<sub>f</sub>I<sub>i</sub> in parallel with a conductance h<sub>o</sub> (a resistor 1/h<sub>o</sub>).</p>`,
        `<p>Add a second letter for the configuration: <b>e</b>, <b>b</b> or <b>c</b>. Common emitter: h<sub>ie</sub>, h<sub>re</sub>, h<sub>fe</sub>, h<sub>oe</sub>, with I<sub>i</sub> = I<sub>b</sub>, I<sub>o</sub> = I<sub>c</sub>. Same circuit shape for all three configurations, and for npn or pnp.</p>`,
      ]},
      { k: "learn", title: "Drop the small stuff", b: [
        `<p>h<sub>r</sub> is tiny (around 10<sup>−4</sup>), so h<sub>r</sub>V<sub>o</sub> ≈ 0: a short. 1/h<sub>o</sub> is usually large next to the load: an open. What's left looks just like the r<sub>e</sub> model:</p>`,
        fig(hybFig({ approx: true })),
        `<div class="eq">h<sub>ie</sub> = βr<sub>e</sub>    h<sub>fe</sub> = β<sub>ac</sub>    h<sub>oe</sub> = 1/r<sub>o</sub>    h<sub>ib</sub> = r<sub>e</sub>    h<sub>fb</sub> = −α ≅ −1</div>`,
        `<p class="aside">h<sub>fb</sub> is negative because the hybrid circuit's current source points down, opposite to the real common-base collector current.</p>`,
      ]},
      { k: "check", title: "Translate", b: [
        `<p>I<sub>E</sub> = 2 mA, h<sub>fe</sub> = 160, h<sub>oe</sub> = 25 µS, h<sub>ob</sub> = 0.4 µS.</p>`,
        { t: "num", q: "h_ie?", a: 2080, unit: "Ω", tol: 0.01, hint: "βr_e, with r_e = 26 mV/I_E.", why: "r_e = 13 Ω, h_ie = 160 × 13 = 2.08 kΩ." },
        { t: "num", q: "Common-emitter r_o, in kΩ?", a: 40, unit: "kΩ", hint: "1/h_oe.", why: "1/25 µS = 40 kΩ." },
        { t: "num", q: "Common-base r_o, in MΩ?", a: 2.5, unit: "MΩ", hint: "1/h_ob.", why: "1/0.4 µS = 2.5 MΩ: far bigger than the CE one, as Part 2 said." },
      ]},
      { k: "learn", title: "Same analysis, new names", b: [
        `<p>With the approximate hybrid model, every result from Parts 3–6 carries over: write h<sub>ie</sub> for βr<sub>e</sub>, h<sub>fe</sub> for β, 1/h<sub>oe</sub> for r<sub>o</sub>.</p>`,
        `<div class="eq">Fixed bias: Z<sub>i</sub> = R<sub>B</sub> ∥ h<sub>ie</sub>   Z<sub>o</sub> = R<sub>C</sub> ∥ 1/h<sub>oe</sub>   A<sub>v</sub> = −h<sub>fe</sub>(R<sub>C</sub> ∥ 1/h<sub>oe</sub>)/h<sub>ie</sub>   A<sub>i</sub> ≅ h<sub>fe</sub></div>`,
        `<div class="eq">Common base: Z<sub>i</sub> = R<sub>E</sub> ∥ h<sub>ib</sub>   Z<sub>o</sub> = R<sub>C</sub>   A<sub>v</sub> = −h<sub>fb</sub>R<sub>C</sub>/h<sub>ib</sub>   A<sub>i</sub> = h<sub>fb</sub> ≅ −1</div>`,
        `<p class="aside">Divider bias: R<sub>B</sub> → R<sub>1</sub> ∥ R<sub>2</sub> and A<sub>i</sub> = h<sub>fe</sub>R′/(R′ + h<sub>ie</sub>). Unbypassed: Z<sub>b</sub> ≅ h<sub>fe</sub>R<sub>E</sub>, A<sub>v</sub> ≅ −R<sub>C</sub>/R<sub>E</sub>. Follower: Z<sub>o</sub> ≅ R<sub>E</sub> ∥ h<sub>ie</sub>/h<sub>fe</sub>.</p>`,
        `<p>Fixed bias: R<sub>B</sub> = 470 kΩ, R<sub>C</sub> = 3.9 kΩ, h<sub>ie</sub> = 1.5 kΩ, h<sub>fe</sub> = 140, h<sub>oe</sub> = 25 µS.</p>`,
        { t: "num", q: "A_v?", a: -331.7, tol: 0.01, hint: "R_C ∥ 1/h_oe = 3.9k ∥ 40k first.", why: "3.554 kΩ × 140/1.5 kΩ = 332, negative." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the main practical difference between using h_ie from a datasheet and computing βr_e yourself?", model: "The datasheet h_ie was measured at the manufacturer's operating point, which may not match yours. βr_e uses r_e = 26 mV/I_E from your own DC analysis, so it reflects your actual current. Since h_ie changes a lot with collector current, it should be recalculated at your operating point." },
      ]},
    ],
  };

  /* =============== PART 13 =============== */
  function fullHyb(h, RL, Rs) {
    const Ai = h.hf / (1 + h.ho * RL), Av = (-h.hf * RL) / (h.hi + (h.hi * h.ho - h.hf * h.hr) * RL);
    const Zi = h.hi - (h.hf * h.hr * RL) / (1 + h.ho * RL), Zo = 1 / (h.ho - (h.hf * h.hr) / (h.hi + Rs));
    return { Ai, Av, Zi, Zo };
  }
  const p13 = {
    id: "p13", title: "The complete hybrid model", mins: 20,
    blurb: "Keep h_r and h_o and see exactly how much they change the answers.",
    takeaway: "With the full model, a load R_L and source R_s: A_i = h_f/(1 + h_oR_L); A_v = −h_fR_L/[h_i + (h_ih_o − h_fh_r)R_L]; Z_i = h_i − h_fh_rR_L/(1 + h_oR_L); Z_o = 1/[h_o − h_fh_r/(h_i + R_s)]. Each falls back to the approximate result when the extra term is small (h_oR_L ≪ 1 and so on). The same four equations serve CE, CB and CC: just use that configuration's h-parameters. Approximate CE → CB conversions: h_ib ≈ h_ie/(1 + h_fe), h_fb ≈ −h_fe/(1 + h_fe), h_ob ≈ h_oe/(1 + h_fe), h_rb ≈ h_ieh_oe/(1 + h_fe) − h_re.",
    steps: [
      { k: "learn", title: "Four results", b: [
        `<p>Put the full hybrid circuit between a source (R<sub>s</sub>) and a load (R<sub>L</sub>). The book derives each result with KVL and KCL; find A<sub>i</sub> first, because the others reuse it.</p>`,
        `<div class="eq">A<sub>i</sub> = h<sub>f</sub>/(1 + h<sub>o</sub>R<sub>L</sub>)    A<sub>v</sub> = −h<sub>f</sub>R<sub>L</sub>/[h<sub>i</sub> + (h<sub>i</sub>h<sub>o</sub> − h<sub>f</sub>h<sub>r</sub>)R<sub>L</sub>]</div>`,
        `<div class="eq">Z<sub>i</sub> = h<sub>i</sub> − h<sub>f</sub>h<sub>r</sub>R<sub>L</sub>/(1 + h<sub>o</sub>R<sub>L</sub>)    Z<sub>o</sub> = 1/[h<sub>o</sub> − h<sub>f</sub>h<sub>r</sub>/(h<sub>i</sub> + R<sub>s</sub>)]</div>`,
        `<p class="aside">Z<sub>o</sub> here is at the transistor's own output terminals. Put R<sub>C</sub> in parallel afterwards if the amplifier's Z<sub>o</sub> should include it.</p>`,
      ]},
      { k: "play", title: "How much do h_r and h_o matter?", b: [
        (host, id) => {
          const ro = el(`<div></div>`), f = el(`<div class="fig"></div>`);
          const h = { hi: 1500, hr: 2.5e-4, hf: 140, ho: 25e-6 };
          let RL = 3900;
          function draw() {
            const F = fullHyb(h, RL, 1000);
            f.innerHTML = plot({ x: [2, 5], y: [0, 160], xt: [2, 3, 4, 5], xtf: (v) => si(Math.pow(10, v), "Ω", 2), yt: [0, 40, 80, 120, 160], xl: "R_L (log scale)", yl: "current gain",
              series: [{ pts: [[2, h.hf], [5, h.hf]], cls: "s5" }, { f: (x) => fullHyb(h, Math.pow(10, x), 1000).Ai, cls: "s1" }], marks: [{ x: Math.log10(RL), y: F.Ai }], texts: [{ x: 4.3, y: 146, s: "approx: h_fe", a: "middle" }], label: "Current gain against load: full model falls below hfe as RL grows" });
            ro.innerHTML = readout([["A<sub>i</sub> full / approx", fmt(F.Ai, 4) + " / " + h.hf], ["A<sub>v</sub> full / approx", fmt(F.Av, 4) + " / " + fmt((-h.hf * RL) / h.hi, 4)], ["Z<sub>i</sub> full / approx", ohm(F.Zi) + " / " + ohm(h.hi)], ["Z<sub>o</sub>′ full (R<sub>s</sub> = 1 kΩ) / 1/h<sub>oe</sub>", ohm(F.Zo) + " / " + ohm(1 / h.ho)]]);
          }
          host.append(f, slider({ id: id + "-rl", label: "Load R<sub>L</sub>", min: 100, max: 100e3, log: true, value: RL, show: (v) => ohm(v) }, (v) => { RL = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">h<sub>ie</sub> = 1.5 kΩ, h<sub>re</sub> = 2.5 × 10<sup>−4</sup>, h<sub>fe</sub> = 140, h<sub>oe</sub> = 25 µS. When h<sub>oe</sub>R<sub>L</sub> is small (say under 0.1) the approximate model is fine.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Same transistor, R<sub>L</sub> = 3.9 kΩ, R<sub>s</sub> = 1 kΩ.</p>`,
        { t: "num", q: "A_i (full model)?", a: 127.6, tol: 0.01, hint: "h_oeR_L = 25 µS × 3.9 kΩ = 0.0975.", why: "140/1.0975 = 127.6, about 9% below h_fe." },
        { t: "num", q: "Z_i (full model)?", a: 1376, unit: "Ω", tol: 0.01, hint: "h_fe·h_re·R_L = 136.5; divide by 1.0975 and subtract from h_ie.", why: "1500 − 124.4 = 1376 Ω." },
        { t: "num", q: "Z_o′ at the transistor terminals, in kΩ?", a: 90.91, unit: "kΩ", tol: 0.01, hint: "h_fe·h_re/(h_ie + R_s) = 0.035/2500 = 14 µS.", why: "1/(25 − 14) µS = 90.9 kΩ: higher than 1/h_oe = 40 kΩ. Ignoring it is safe." },
      ]},
      { k: "learn", title: "Other configurations", b: [
        `<p>The equations don't care which configuration you're in: plug in h<sub>ib</sub>, h<sub>fb</sub>… for common base. If the datasheet only gives CE values (it usually does), convert:</p>`,
        `<div class="eq">h<sub>ib</sub> ≅ h<sub>ie</sub>/(1 + h<sub>fe</sub>)    h<sub>fb</sub> ≅ −h<sub>fe</sub>/(1 + h<sub>fe</sub>)    h<sub>ob</sub> ≅ h<sub>oe</sub>/(1 + h<sub>fe</sub>)    h<sub>rb</sub> ≅ h<sub>ie</sub>h<sub>oe</sub>/(1 + h<sub>fe</sub>) − h<sub>re</sub></div>`,
        { t: "num", q: "h_ie = 1.5 kΩ, h_fe = 140. h_ib?", a: 10.64, unit: "Ω", tol: 0.01, hint: "1500/141.", why: "10.6 Ω, close to r_e = h_ie/β = 10.7 Ω, as you'd expect." },
        `<p class="aside">Book slip: in Example 5.23 one line has h<sub>fb</sub> as "−1.991". It's −0.991, as the line before it says.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "When is it safe to use the approximate hybrid model?", model: "When the terms involving h_r and h_o are small: h_oR_L much less than 1 so the current gain stays near h_f, and (h_ih_o − h_fh_r)R_L much smaller than h_i so the voltage gain stays near −h_fR_L/h_i. With typical transistors and kΩ loads the errors are a few percent." },
      ]},
    ],
  };

  /* =============== PART 14 =============== */
  /* Smooth curve through points (Catmull-Rom). */
  function cr(pts) {
    return (x) => {
      let i = 1;
      while (i < pts.length - 1 && x > pts[i][0]) i++;
      const p0 = pts[Math.max(0, i - 2)], p1 = pts[i - 1], p2 = pts[i], p3 = pts[Math.min(pts.length - 1, i + 1)];
      const d = p2[0] - p1[0], t = Math.max(0, Math.min(1, (x - p1[0]) / d)), t2 = t * t, t3 = t2 * t;
      const m1 = ((p2[1] - p0[1]) / (p2[0] - p0[0])) * d, m2 = ((p3[1] - p1[1]) / (p3[0] - p1[0])) * d;
      return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2;
    };
  }
  /* Sketches of the book's normalized parameter variations. Log-scale curves are given as log10 values. */
  const VAR = {
    ic: { x: [-1, 1.7], xt: [-1, 0, 1], xtf: (v) => fmt(Math.pow(10, v), 2) + " mA", xl: "I_C (log scale)", y: [-1.5, 1.7], yt: [-1, 0, 1], ytf: (v) => "×" + fmt(Math.pow(10, v), 2),
      c: { hfe: [[-1, -0.3], [0, 0], [0.78, 0.18], [1.7, -0.05]], hie: [[-1, 1], [0, 0], [1, -0.6], [1.7, -1]], hoe: [[-1, -0.85], [0, 0], [1, 0.85], [1.7, 1.6]], hre: [[-1, 0.6], [0, 0], [1, 0.15], [1.7, 0.75]] } },
    vce: { x: [0, 1.3], xt: [0, Math.log10(5), 1, 1.3], xtf: (v) => fmt(Math.pow(10, v), 2) + " V", xl: "V_CE (log scale)", y: [-0.5, 0.7], yt: [-0.3, 0, 0.3, 0.6], ytf: (v) => fmt(100 * Math.pow(10, v), 2) + "%",
      c: { hfe: [[0, -0.04], [0.7, 0], [1.3, 0.04]], hie: [[0, -0.03], [0.7, 0], [1.3, 0.03]], hoe: [[0, 0.45], [0.7, 0], [1.3, -0.15]], hre: [[0, 0.6], [0.7, 0], [1.3, -0.25]] } },
    t: { x: [-50, 150], xt: [-50, 0, 25, 50, 100, 150], xtf: (v) => v + "°C", xl: "junction temperature", y: [-0.3, 0.5], yt: [-0.3, 0, 0.3], ytf: (v) => "×" + fmt(Math.pow(10, v), 2),
      c: { hfe: [[-50, -0.15], [25, 0], [150, 0.17]], hie: [[-50, -0.2], [25, 0], [150, 0.4]], hoe: [[-50, -0.03], [25, 0], [150, 0.06]], hre: [[-50, -0.08], [25, 0], [150, 0.12]] } },
  };
  const p14 = {
    id: "p14", title: "Hybrid π, and how the parameters drift", mins: 20,
    blurb: "The high-frequency model, then which parameter changes most with current, voltage and heat.",
    takeaway: "Hybrid π (Giacoletto) model: r_b (base contact, bulk and spreading, a few to tens of Ω), r_π = βr_e, r_u (≥ βr_o, MΩ, collector-to-base feedback), r_o (5–40 kΩ, from h_oe, V_A or the curves), C_π (few to tens of pF) and C_u (a few pF, magnified by the Miller effect), and a source g_mV_π = βI_b with g_m = 1/r_e. h_re ≈ r_π/(r_π + r_u). At low and mid frequencies the capacitors are open, r_b is negligible and r_u is huge: it reduces to the r_e model. Parameter drift: h_fe (β) varies least with collector current; h_oe and h_ie vary most (r_e = 26 mV/I_E). With V_CE, h_fe and h_ie stay steady while h_oe and h_re move. All h-parameters rise with temperature. Collector current has by far the biggest effect, so keep I_C steady.",
    steps: [
      { k: "learn", title: "The hybrid π model", b: [
        `<p>The third model, used for high frequencies (Chapter 9). Between base and emitter: r<sub>π</sub> = βr<sub>e</sub>, plus a small series r<sub>b</sub>. Between collector and emitter: r<sub>o</sub>. Linking collector and base: a huge r<sub>u</sub> (the "union"). And two tiny stray capacitors, C<sub>π</sub> and C<sub>u</sub>.</p>`,
        `<div class="eq">g<sub>m</sub> = 1/r<sub>e</sub>    r<sub>π</sub> = βr<sub>e</sub>    r<sub>o</sub> = 1/h<sub>oe</sub>    h<sub>re</sub> ≅ r<sub>π</sub>/(r<sub>π</sub> + r<sub>u</sub>)</div>`,
        `<p>The controlled source can be written either way: g<sub>m</sub>V<sub>π</sub> = (1/r<sub>e</sub>)(I<sub>b</sub>βr<sub>e</sub>) = βI<sub>b</sub>. A voltage-controlled or a current-controlled current source: same thing.</p>`,
        { t: "num", q: "I_E = 2.6 mA. What's g_m, in mS?", a: 100, unit: "mS", hint: "r_e first, then g_m = 1/r_e.", why: "r_e = 10 Ω, so g_m = 100 mS." },
      ]},
      { k: "predict", title: "When do the extras matter?", b: [
        { t: "mcq", q: "At audio frequencies, which hybrid π parts can you drop?", opts: [
          ["C_π and C_u (huge reactance), r_b (small, in series) and r_u (huge, in parallel)", true, "What's left is r_π and βI_b with r_o: the r_e model again."],
          ["r_π and r_o", false, "Those are the core of the model at every frequency."],
          ["Nothing: all of them matter", false, "Those picofarad capacitors have reactances in the MΩ at kHz frequencies."],
        ]},
      ]},
      { k: "play", title: "Which parameter drifts most?", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), note = el(`<p class="aside"></p>`);
          const notes = {
            ic: "Normalized to 1 at I_C = 1 mA. h_fe stays within about ×0.5 to ×1.5. h_ie falls as I_C rises (it's βr_e, and r_e = 26 mV/I_E). h_oe climbs to about 40 times, so r_o falls to about 1/40.",
            vce: "Normalized at V_CE = 5 V, in percent. h_fe and h_ie barely move. h_oe and h_re change noticeably.",
            t: "Normalized at 25 °C. Everything rises with temperature; h_ie the most, h_oe the least.",
          };
          function draw(k) {
            const key = ["ic", "vce", "t"][k], V = VAR[key];
            const series = [["hfe", "s1"], ["hie", "s2"], ["hoe", "s3"], ["hre", "s5"]].map(([n, cls]) => ({ f: cr(V.c[n]), cls }));
            const lastX = V.x[1] - (V.x[1] - V.x[0]) * 0.02;
            const texts = [["hfe", "h_fe"], ["hie", "h_ie"], ["hoe", "h_oe"], ["hre", "h_re"]].map(([n, s]) => ({ x: lastX, y: cr(V.c[n])(lastX) + (V.y[1] - V.y[0]) * 0.03, s, a: "end" }));
            f.innerHTML = plot({ x: V.x, y: V.y, xt: V.xt, xtf: V.xtf, yt: V.yt, ytf: V.ytf, xl: V.xl, series, texts, padL: 64, label: "Sketch of normalized transistor parameter variation" });
            note.textContent = notes[key];
          }
          host.append(f, toggle(["Collector current", "Collector voltage", "Temperature"], draw, 0), note);
          draw(0);
        },
        `<p class="aside">Shapes sketched from the book's datasheet figures, to show the trends, not exact values.</p>`,
      ]},
      { k: "check", title: "Read the trends", b: [
        { t: "mcq", q: "A design must keep h_ie (βr_e) steady. What should you hold steady first?", opts: [
          ["The collector current", true, "Collector current has by far the biggest effect. V_CE barely moves h_ie."],
          ["The collector–emitter voltage", false, "h_ie is nearly flat against V_CE."],
          ["β", false, "β is the steadiest parameter of all; it's I_C that drives h_ie."],
        ]},
        { t: "mcq", q: "A stage is moved from I_C = 1 mA to 50 mA. Why might its gain drop even with the same R_C?", opts: [
          ["h_oe rises about 40 times, so r_o falls to about 1/40 and loads the output", true, "r_o sits in parallel with R_C. A much smaller r_o pulls R_C ∥ r_o down."],
          ["β falls to zero", false, "h_fe changes the least."],
          ["r_e rises", false, "r_e falls as current rises."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is β the parameter you can most safely treat as constant?", model: "Because of all the transistor's parameters, h_fe (β) changes the least with collector current, staying within about half to one and a half times its value over a wide range. Parameters like h_ie and h_oe change many times over, because they depend directly on the current." },
      ]},
    ],
  };

  /* =============== PART 15 =============== */
  const FAULTS = [
    { n: "Working", b: 1, e: 0, c: 1, l: 1, msg: "Small signal at the base, nothing at the emitter (C_E holds it at ac ground), a big inverted signal at the collector and the load." },
    { n: "C_E open", b: 1, e: 0.95, c: 0.013, l: 0.013, msg: "The emitter now follows the base, and the output is tiny: the gain has fallen from −R_C/r_e to about −R_C/R_E. DC readings look normal, because a capacitor is open for DC anyway." },
    { n: "C_1 open", b: 0, e: 0, c: 0, l: 0, msg: "The signal is there at the source, but never reaches the base. Everything after it is flat." },
    { n: "C_2 open", b: 1, e: 0, c: 1, l: 0, msg: "Big signal at the collector, nothing at the load: the coupling capacitor isn't passing it on." },
  ];
  const p15 = {
    id: "p15", title: "Troubleshooting", mins: 20,
    blurb: "Check DC first, then follow the signal from the source toward the load.",
    takeaway: "If a system misbehaves, first remove the ac signal and check DC: V_BE ≈ 0.7 V? (0.3 V: the transistor isn't on.) V_C = V_CC: no collector current. V_CE far from mid-range: wrong resistor values. A divider's V_B equal to its unloaded value (for example exactly half with equal resistors): the base isn't connected, because a working transistor loads the divider (βR_E in parallel with R_2). Then use the oscilloscope (channels on AC, ground lead on ground) from the source toward the load. The first point where the waveform looks wrong locates the fault. An ac signal at a bypassed emitter, plus low gain, means C_E is open: DC checks can't find that.",
    steps: [
      { k: "learn", title: "DC first", b: [
        ch(4, "04-dc-biasing-bjts.html", "p13", "Part 13", "The DC checks are the same as in Chapter 4."),
        `<div class="key">A circuit that's correct for DC usually behaves for ac too. So: disconnect the signal and check the DC levels before anything else.</div>`,
        { t: "sort", q: "What does each DC reading suggest?", bins: ["Transistor not on", "No collector current", "Resistor value wrong", "Base not connected"], items: [
          ["V_BE = 0.3 V in an amplifier", 0, "Too low to conduct: something stops the base reaching its operating level (unless it's meant to be a switch that's off)."],
          ["V_C reads the full V_CC", 1, "No drop across R_C, so no current through it. R_C itself is connected, so look elsewhere."],
          ["V_CE = 1 V with V_CC = 18 V, all parts connected", 2, "Something conducts, but too much. Expect V_CE nearer mid-range."],
          ["Divider with R_1 = R_2 = 47 kΩ on 16 V: V_B reads exactly 8.00 V", 3, "A working base loads R_2 with about βR_E, pulling V_B below half. Exactly half means the divider is unloaded."],
        ]},
      ]},
      { k: "play", title: "Probe the signal", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), note = el(`<p></p>`);
          function draw(k) {
            const F = FAULTS[k], pts = [["source", 1, "mV"], ["base", F.b, "mV"], ["emitter", F.e, "mV"], ["collector", F.c, "V"], ["load", F.l, "V"]];
            let s = "";
            pts.forEach(([n, a, u], i) => {
              const x0 = 10 + i * 112, w = 100, inv = i >= 3 ? -1 : 1;
              s += `<rect x="${x0}" y="20" width="${w}" height="90" rx="6" style="fill:var(--paper);stroke:var(--line)"/>` + `<line x1="${x0 + 4}" y1="65" x2="${x0 + w - 4}" y2="65" style="stroke:var(--line)"/>`;
              let d = "";
              for (let j = 0; j <= 40; j++) { const t = j / 40, y = 65 - inv * a * 34 * Math.sin(4 * Math.PI * t); d += (j ? " L" : "M") + (x0 + 4 + t * (w - 8)).toFixed(1) + " " + y.toFixed(1); }
              s += `<path d="${d}" style="fill:none;stroke:var(--${i >= 3 ? "accent" : "cool"});stroke-width:2.5"/>` + S.t(x0 + w / 2, 128, n, { cls: "s" }) + S.t(x0 + w / 2, 14, "scale: " + u, { cls: "s m" });
            });
            f.innerHTML = S.svg(575, 140, s, { max: 575, label: "Oscilloscope traces at five points along the amplifier" });
            note.textContent = F.msg;
          }
          host.append(f, toggle(FAULTS.map((x) => x.n), draw, 0), note);
          draw(0);
        },
        `<p class="aside">A voltage-divider CE amplifier with R<sub>E</sub> bypassed. Collector and load traces use a volts scale, the others millivolts, just as you'd set a real scope.</p>`,
      ]},
      { k: "check", title: "Diagnose", b: [
        { t: "mcq", q: "DC levels are all correct. On the scope, the emitter of a bypassed CE stage shows almost the same signal as the base, and the output is small. Most likely fault?", opts: [
          ["The bypass capacitor C_E is open or disconnected", true, "Unbypassed R_E gives the emitter a signal and drops the gain to about −R_C/R_E. DC can't reveal it because C_E is open for DC anyway."],
          ["The transistor is dead", false, "Then the DC levels wouldn't be correct."],
          ["C_2 is open", false, "That would leave the collector signal large and only the load flat."],
        ]},
        { t: "mcq", q: "Where should you start following the ac signal?", opts: [
          ["At the applied signal, then step toward the load", true, "The first point where the trace looks wrong tells you the circuit is fine up to there."],
          ["At the load, then step back toward the source", false, "That works too, but the book's method starts at the source; a missing output tells you little on its own."],
          ["At the power supply", false, "The supply should show no ac signal at all."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't a DC check find an open bypass capacitor?", model: "Because a capacitor is an open circuit for DC whether it's working or not. The DC voltages and currents are identical either way. The fault only shows in the ac behaviour: a signal appears at the emitter and the gain drops sharply." },
      ]},
    ],
  };

  /* =============== PART 16 =============== */
  const p16 = {
    id: "p16", title: "In practice", mins: 25,
    blurb: "A mixer that keeps two sources balanced, a microphone preamp, a noise generator and a light that follows music.",
    takeaway: "Audio mixer: series resistors (R_4, R_5) in each channel make sources with very different internal resistances look alike, so they mix in balance; bigger resistors balance better but weaken the signal at the base. Preamp for a dynamic microphone (20–100 Ω internal): Z_i of 1–2 kΩ is enough to pick up nearly all of the signal; a collector dc feedback stage gives stability and gain. Coupling capacitors: check X_C = 1/(2πfC) at the lowest frequency. Noise generator: a reverse-biased base–emitter junction in avalanche makes white noise; a frequency-dependent feedback network shapes it into pink (1/f) noise. Sound-modulated light: a rectifier and capacitor make the DC supply from 12 V ac; the signal tips a just-off transistor on, which fires an SCR; the bulb's brightness depends on where in the ac cycle it fires.",
    steps: [
      { k: "play", title: "Audio mixer: why the series resistors?", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const Zi = 1400, Av = 250, R1s = 600, R2s = 15e3;
          let R = 47e3;
          function draw(k) {
            if (k != null) R = [0, 22e3, 47e3, 100e3][k];
            const a = R + R1s, b = R + R2s, w1 = par(Zi, b) / (a + par(Zi, b)), w2 = par(Zi, a) / (b + par(Zi, a));
            const max = Math.max(w1, w2, 0.01);
            const bar = (v, y, cls, lab) => `<rect x="150" y="${y}" width="${Math.max(1, (v / max) * 300)}" height="22" style="fill:var(--${cls})"/>` + S.t(140, y + 16, lab, { a: "end", cls: "s" }) + S.t(156 + Math.max(1, (v / max) * 300), y + 16, "×" + fmt(v * Av, 3), { a: "start", cls: "s" });
            f.innerHTML = S.svg(560, 90, bar(w1, 10, "cool", "microphone") + bar(w2, 50, "accent", "guitar"), { max: 560, label: "How strongly each source reaches the output" });
            ro.innerHTML = readout([["Series resistor per channel", R ? ohm(R) : "none"], ["Mic → output gain", fmt(w1 * Av, 3)], ["Guitar → output gain", fmt(w2 * Av, 3)], ["Balance (mic ÷ guitar)", fmt(w1 / w2, 3)]]);
          }
          host.append(f, toggle(["None", "22 kΩ", "47 kΩ", "100 kΩ"], draw, 2), ro);
          draw();
        },
        `<p>A microphone (600 Ω inside) and a guitar pickup (15 kΩ inside) feed one amplifier stage: Z<sub>i</sub> = 1.4 kΩ, gain 250. Superposition gives each source's share at the base.</p>`,
        `<p class="aside">With no series resistors, the low-resistance mic swamps the guitar: the guitar's 15 kΩ forms a divider with the mic's 600 Ω in parallel with Z<sub>i</sub>. Large series resistors make both channels look alike, at the price of a weaker signal. Give and take.</p>`,
      ]},
      { k: "check", title: "Mixer thinking", b: [
        { t: "mcq", q: "Why not just use 1 MΩ series resistors for perfect balance?", opts: [
          ["Each 1 MΩ forms a divider with the 1.4 kΩ input, so almost no signal reaches the base", true, "Balance improves, but the level falls toward nothing. The resistor value is a trade between balance and level."],
          ["1 MΩ resistors are too noisy", false, "Noise isn't the book's point here; signal level is."],
          ["They would change the DC bias", false, "The coupling capacitors keep the sources out of the DC bias."],
        ]},
        { t: "num", q: "Is the coupling capacitor a short? A 47 µF capacitor at the lowest audio frequency of interest, 100 Hz: X_C?", a: 33.86, unit: "Ω", tol: 0.02, hint: "X_C = 1/(2πfC).", why: "1/(2π × 100 × 47 µF) = 33.9 Ω: small next to kΩ impedances, and smaller still at higher frequencies." },
      ]},
      { k: "learn", title: "Microphone preamp", b: [
        `<p>A <b>dynamic microphone</b> is a coil on a diaphragm moving in a magnet's field (Faraday's law). Its internal resistance is just the coil's: about 20–100 Ω. So the preamp's Z<sub>i</sub> needn't be high.</p>`,
        `<p>The book's preamp uses collector dc feedback (Part 7): steady bias, Z<sub>i</sub> = R<sub>F1</sub> ∥ βr<sub>e</sub>, A<sub>v</sub> = −(R<sub>F2</sub> ∥ R<sub>C</sub>)/r<sub>e</sub>. The gain drops when the next stage's input is put in parallel with its output.</p>`,
        { t: "num", q: "Your preamp has Z_i = 1.5 kΩ. What percentage of a 50 Ω microphone's signal reaches the base?", a: 96.77, unit: "%", tol: 0.005, hint: "Z_i/(Z_i + R_mic) × 100.", why: "1500/1550 = 96.8%." },
        { t: "num", q: "Swap in a 1 kΩ microphone. Now what percentage?", a: 60, unit: "%", hint: "Same divider.", why: "1500/2500 = 60%. A higher-impedance mic needs a preamp with Z_i of 10 kΩ or more." },
      ]},
      { k: "learn", title: "Noise on purpose", b: [
        `<div class="two"><div class="tile"><h3>White (thermal, Johnson)</h3><p>Random electron motion. Flat across all frequencies.</p></div><div class="tile"><h3>Shot</h3><p>Carriers crossing a junction in uneven bunches. Sounds like rain.</p></div><div class="tile"><h3>Pink (flicker, 1/f)</h3><p>Uneven transit times. Strongest at low frequencies, below about 1 kHz.</p></div></div>`,
        `<p>To test speakers, filters and microphones you want noise on purpose. The book's generator reverse-biases a transistor's base–emitter junction into avalanche (collector left open): an unstable region full of random current. A second transistor amplifies it.</p>`,
        `<p>For pink noise, a capacitor-and-resistor network sits in the collector-feedback path of the next stage. At low frequency the capacitors are open and R<sub>F</sub> is 1 MΩ. As frequency rises they switch in one by one, R<sub>F</sub> falls, and Z<sub>i</sub> collapses (the Miller effect from Part 7). Against a 39 kΩ series resistor, the signal reaching the stage falls with frequency.</p>`,
        { t: "mcq", q: "At high frequency that stage's gain actually doubles, yet its output fades. Why?", opts: [
          ["Its input impedance drops to a few ohms, so the 39 kΩ series resistor leaves almost no signal at its input", true, "A 66-fold drop in Z_i overwhelms a doubled gain."],
          ["The transistor stops working at high frequency", false, "The book's explanation is about Z_i and the divider."],
          ["The capacitors block the signal", false, "At high frequency they pass it; that's what lowers R_F."],
        ]},
      ]},
      { k: "learn", title: "A light that follows the music", b: [
        `<ol><li>12 V ac is rectified by D<sub>1</sub> and smoothed by C<sub>2</sub>: about 17 V peak, roughly 16 V DC to bias the transistor. No separate DC supply.</li><li>The potentiometer sets V<sub>BE</sub> just below turn-on (about 0.5 V): transistor off, bulb off.</li><li>The audio signal adds to that bias and turns the transistor on in step with the music. Its collector voltage, through D<sub>2</sub>, drives the gate of an SCR (Chapter 17), which switches the 12 V ac bulb.</li><li>Brightness depends on where the ac supply is in its cycle when the SCR fires: near the peak, bright; near zero, dim.</li></ol>`,
        `<p class="aside">D<sub>2</sub> needs its own 0.7 V before the SCR sees anything, which stops small noise from triggering the light. C<sub>3</sub> can slow the response. Bias it closer to "on" and the light reacts to quieter parts of the music too.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the mixer need series resistors in each input channel?", model: "Because the sources have very different internal resistances. Without the resistors, the low-resistance source dominates the input node and the high-resistance one is mostly lost in the divider. Adding a large equal resistor in each channel makes both sources look similar, so they mix in balance, though the signal reaching the transistor gets smaller as the resistors grow." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edc5", eyebrow: "Boylestad · Chapter 5", title: "BJT AC Analysis",
    intro: `<p>Sixteen parts: how a biased BJT amplifies a small signal. The r<sub>e</sub> model, the input impedance, output impedance and gain of every standard configuration, then loads and sources, two-port systems, cascades, Darlingtons, the hybrid and hybrid π models, troubleshooting and real circuits.</p><p>6.002 Chapter 8 gave you the small-signal idea with the MOSFET, and a simple BJT model without r<sub>e</sub>. This chapter is the full BJT version.</p><p class="aside">The "Computer Analysis" section isn't covered. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's problems in the book. They test whether the ideas stuck, so don't expect them to look like the examples here.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16],
    summary: `
      <h3>Setting up</h3>
      <p>DC first (V<sub>BE</sub> = 0.7 V), then the ac equivalent: supplies → ground, capacitors → shorts, remove what's shorted, redraw. I<sub>i</sub> and I<sub>o</sub> are defined flowing in.</p>
      <div class="eq">r<sub>e</sub> = 26 mV/I<sub>E</sub>    base sees (β + 1)r<sub>e</sub> ≅ βr<sub>e</sub>    r<sub>o</sub> = (V<sub>A</sub> + V<sub>CEQ</sub>)/I<sub>CQ</sub> ≅ V<sub>A</sub>/I<sub>CQ</sub></div>
      <h3>Configurations (r<sub>o</sub> ignored unless noted)</h3>
      <div class="eq">CE fixed: Z<sub>i</sub> = R<sub>B</sub> ∥ βr<sub>e</sub>, Z<sub>o</sub> = R<sub>C</sub> ∥ r<sub>o</sub>, A<sub>v</sub> = −(R<sub>C</sub> ∥ r<sub>o</sub>)/r<sub>e</sub>    Divider: R<sub>B</sub> → R<sub>1</sub> ∥ R<sub>2</sub></div>
      <div class="eq">Unbypassed R<sub>E</sub>: Z<sub>b</sub> = βr<sub>e</sub> + (β + 1)R<sub>E</sub> ≅ βR<sub>E</sub>, Z<sub>o</sub> = R<sub>C</sub>, A<sub>v</sub> = −βR<sub>C</sub>/Z<sub>b</sub> ≅ −R<sub>C</sub>/R<sub>E</sub></div>
      <div class="eq">Follower: Z<sub>i</sub> = R<sub>B</sub> ∥ Z<sub>b</sub>, Z<sub>o</sub> = R<sub>E</sub> ∥ r<sub>e</sub> ≅ r<sub>e</sub>, A<sub>v</sub> = R<sub>E</sub>/(R<sub>E</sub> + r<sub>e</sub>) ≅ 1    CB: Z<sub>i</sub> = R<sub>E</sub> ∥ r<sub>e</sub>, Z<sub>o</sub> = R<sub>C</sub>, A<sub>v</sub> ≅ R<sub>C</sub>/r<sub>e</sub>, A<sub>i</sub> ≅ −1</div>
      <div class="eq">Collector feedback: Z<sub>i</sub> ≅ r<sub>e</sub>/(1/β + R<sub>C</sub>/R<sub>F</sub>), Z<sub>o</sub> ≅ R<sub>C</sub> ∥ R<sub>F</sub>, A<sub>v</sub> ≅ −R<sub>C</sub>/r<sub>e</sub>    Collector dc feedback: Z<sub>i</sub> = R<sub>F1</sub> ∥ βr<sub>e</sub>, Z<sub>o</sub> = R<sub>C</sub> ∥ R<sub>F2</sub>, A<sub>v</sub> = −(R<sub>F2</sub> ∥ R<sub>C</sub>)/r<sub>e</sub></div>
      <h3>Loads, sources, systems</h3>
      <div class="eq">A<sub>vL</sub> = [R<sub>L</sub>/(R<sub>L</sub> + R<sub>o</sub>)]A<sub>vNL</sub>    A<sub>vs</sub> = [R<sub>i</sub>/(R<sub>i</sub> + R<sub>s</sub>)]A<sub>vL</sub>    A<sub>iL</sub> = −A<sub>vL</sub>Z<sub>i</sub>/R<sub>L</sub>    |A<sub>vNL</sub>| &gt; |A<sub>vL</sub>| &gt; |A<sub>vs</sub>|</div>
      <div class="eq">Cascade: A<sub>vT</sub> = A<sub>v1</sub>A<sub>v2</sub>… (loaded gains)    A<sub>iT</sub> = −A<sub>vT</sub>Z<sub>i1</sub>/R<sub>L</sub>    Cascode: A<sub>v1</sub> ≅ −1, A<sub>v2</sub> ≅ R<sub>C</sub>/r<sub>e</sub></div>
      <div class="eq">Darlington: β<sub>D</sub> = β<sub>1</sub>β<sub>2</sub>, Z<sub>i</sub> = R<sub>B</sub> ∥ β<sub>D</sub>R<sub>E</sub>, A<sub>i</sub> ≅ β<sub>D</sub>R<sub>B</sub>/(R<sub>B</sub> + β<sub>D</sub>R<sub>E</sub>), Z<sub>o</sub> ≅ r<sub>e1</sub>/β<sub>2</sub> + r<sub>e2</sub>    Feedback pair: Z<sub>i</sub>′ ≅ β<sub>1</sub>β<sub>2</sub>R<sub>C</sub>, Z<sub>o</sub> ≅ r<sub>e1</sub>/β<sub>2</sub>, A<sub>v</sub> ≅ 1</div>
      <h3>Hybrid models</h3>
      <div class="eq">V<sub>i</sub> = h<sub>i</sub>I<sub>i</sub> + h<sub>r</sub>V<sub>o</sub>    I<sub>o</sub> = h<sub>f</sub>I<sub>i</sub> + h<sub>o</sub>V<sub>o</sub>    h<sub>ie</sub> = βr<sub>e</sub>, h<sub>fe</sub> = β, h<sub>ib</sub> = r<sub>e</sub>, h<sub>fb</sub> = −α, h<sub>oe</sub> = 1/r<sub>o</sub></div>
      <div class="eq">Full: A<sub>i</sub> = h<sub>f</sub>/(1 + h<sub>o</sub>R<sub>L</sub>), A<sub>v</sub> = −h<sub>f</sub>R<sub>L</sub>/[h<sub>i</sub> + (h<sub>i</sub>h<sub>o</sub> − h<sub>f</sub>h<sub>r</sub>)R<sub>L</sub>], Z<sub>i</sub> = h<sub>i</sub> − h<sub>f</sub>h<sub>r</sub>R<sub>L</sub>/(1 + h<sub>o</sub>R<sub>L</sub>), Z<sub>o</sub> = 1/[h<sub>o</sub> − h<sub>f</sub>h<sub>r</sub>/(h<sub>i</sub> + R<sub>s</sub>)]</div>
      <div class="eq">Hybrid π: g<sub>m</sub> = 1/r<sub>e</sub>, r<sub>π</sub> = βr<sub>e</sub>, g<sub>m</sub>V<sub>π</sub> = βI<sub>b</sub>    β varies least with I<sub>C</sub>; h<sub>ie</sub> and h<sub>oe</sub> most.</div>`,
  };
  Course.start(window.CHAPTER);
})();
