(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const ch = (n, file, part, where, html) => `<p class="aside">${html} <a href="${file}#${part}">Boylestad Chapter ${n}, ${where} →</a></p>`;
  const ohm = (r) => si(r, "Ω");
  const kohm = (k) => si(k * 1000, "Ω");

  /* Device laws. Volts, mA. */
  const shock = (IDSS, VP) => (v) => (v / VP >= 1 ? 0 : IDSS * Math.pow(1 - v / VP, 2));
  const enh = (k, VT) => (v) => (v > VT ? k * (v - VT) * (v - VT) : 0);
  /* Q-point where the bias line V_GS = a − b·I_D (b in kΩ) meets the device curve. */
  function qpoint(dev, a, b, hi = 60) {
    let lo = 0;
    for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (dev(a - b * m) > m) lo = m; else hi = m; }
    const ID = (lo + hi) / 2;
    return { ID, VGS: a - b * ID };
  }

  /* Symbols. JFET: gate from (x−30,y); drain (x+22,y−40); source (x+22,y+40). */
  function jfet(x, y, o = {}) {
    let s = `<line class="w" x1="${x - 30}" y1="${y}" x2="${x}" y2="${y}"/><line class="w" x1="${x}" y1="${y - 24}" x2="${x}" y2="${y + 24}" style="stroke-width:3.5"/>`;
    s += `<polyline class="w" points="${x},${y - 16} ${x + 22},${y - 16} ${x + 22},${y - 40}"/><polyline class="w" points="${x},${y + 16} ${x + 22},${y + 16} ${x + 22},${y + 40}"/>`;
    s += o.p ? `<polygon class="nd" points="${x - 22},${y} ${x - 12},${y - 5} ${x - 12},${y + 5}"/>` : `<polygon class="nd" points="${x - 2},${y} ${x - 12},${y - 5} ${x - 12},${y + 5}"/>`;
    return s;
  }
  function mosfet(x, y, o = {}) {
    let s = `<line class="w" x1="${x - 30}" y1="${y}" x2="${x - 10}" y2="${y}"/><line class="w" x1="${x - 10}" y1="${y - 18}" x2="${x - 10}" y2="${y + 18}"/>`;
    s += o.enh ? [[-22, -10], [-6, 6], [10, 22]].map(([a, b]) => `<line class="w" x1="${x - 3}" y1="${y + a}" x2="${x - 3}" y2="${y + b}" style="stroke-width:3.5"/>`).join("") : `<line class="w" x1="${x - 3}" y1="${y - 22}" x2="${x - 3}" y2="${y + 22}" style="stroke-width:3.5"/>`;
    s += `<polyline class="w" points="${x - 3},${y - 16} ${x + 22},${y - 16} ${x + 22},${y - 40}"/><polyline class="w" points="${x - 3},${y + 16} ${x + 22},${y + 16} ${x + 22},${y + 40}"/>`;
    s += `<polyline class="w" points="${x - 3},${y} ${x + 22},${y} ${x + 22},${y + 16}"/><polygon class="nd" points="${x - 1},${y} ${x + 8},${y - 5} ${x + 8},${y + 5}"/>`;
    return s;
  }
  /* Bias circuits. FET at (220,170): gate lead from x=190, drain (242,130), source (242,210). kind: fixed | self | divider | gate0 | feedback. */
  function fetFig(kind, o = {}) {
    const dev = o.dev === "enh" ? mosfet(220, 170, { enh: 1 }) : o.dev === "dep" ? mosfet(220, 170) : jfet(220, 170);
    let s = dev + S.supply(242, 40, o.VDD || "V_DD") + S.res(242, 40, 242, 110, o.RD || "R_D", { side: "right" }) + S.wire([242, 110], [242, 130]);
    if (kind === "feedback") {
      s += S.dot(242, 110) + S.res(242, 110, 150, 110, o.RG || "R_G") + S.wire([150, 110], [150, 170], [190, 170]) + S.wire([242, 210], [242, 240]) + S.gnd(242, 240);
    } else if (kind === "divider") {
      s += S.wire([150, 40], [242, 40]) + S.res(150, 40, 150, 170, o.R1 || "R_1", { side: "left" }) + S.dot(150, 170) + S.wire([150, 170], [190, 170]) + S.res(150, 170, 150, 290, o.R2 || "R_2", { side: "left" }) + S.gnd(150, 290);
      s += S.res(242, 210, 242, 290, o.RS || "R_S", { side: "right" }) + S.gnd(242, 290);
    } else {
      s += S.wire([190, 170], [150, 170]) + S.res(150, 170, 150, 270, o.RG || "R_G", { side: "left" });
      if (kind === "fixed") s += S.wire([150, 270], [150, 280]) + S.vsrc(150, 298, o.VGG || "V_GG", { flip: true }) + S.wire([150, 316], [150, 330], [242, 330]) + S.wire([242, 210], [242, 330]) + S.gnd(242, 330);
      else if (kind === "gate0") s += S.wire([150, 270], [150, 290], [242, 290]) + S.wire([242, 210], [242, 290]) + S.gnd(242, 290);
      else s += S.wire([150, 270], [150, 290], [242, 290]) + S.res(242, 210, 242, 290, o.RS || "R_S", { side: "right" }) + S.gnd(242, 290) + S.dot(242, 290);
    }
    if (o.nodes) s += S.t(256, 124, "V_D", { a: "start", cls: "a s" }) + S.t(256, 226, "V_S", { a: "start", cls: "a s" }) + S.t(178, 160, "V_G", { a: "end", cls: "a s" });
    const H = kind === "fixed" ? 360 : 320;
    return S.svg(360, H, s, { max: 340, label: `${kind} bias circuit for a FET` });
  }

  /* A transfer curve with a bias line and the Q-point. */
  function biasPlot(o) {
    const series = [{ f: o.dev, cls: "s1", from: o.from }];
    if (o.line) series.push({ f: (v) => (o.line.a - v) / o.line.b, cls: "s2" });
    if (o.vline != null) series.push({ pts: [[o.vline, o.y[0]], [o.vline, o.y[1]]], cls: "s2" });
    (o.more || []).forEach((m) => series.push(m));
    const marks = o.q ? [{ x: o.q.VGS, y: o.q.ID, label: "Q", dx: 8, dy: -8 }] : [];
    return plot({ x: o.x, y: o.y, xt: o.xt, yt: o.yt, xl: "V_GS (V)", yl: "I_D (mA)", series, marks, texts: o.texts || [], label: o.label || "Transfer curve and bias line" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Device curve meets circuit line", mins: 25,
    blurb: "Every FET bias problem is two equations in I_D and V_GS. Draw both; the Q-point is where they cross.",
    takeaway: "For every FET: I_G ≈ 0 and I_D = I_S. JFETs and depletion MOSFETs (and MESFETs) follow Shockley; enhancement types follow I_D = k(V_GS − V_T)². Those device equations never change; the circuit supplies a second equation in the same two variables. Solve them together, graphically (the book's choice) or by algebra. Fixed bias: R_G carries no current, so V_GS = −V_GG (a vertical line). Then V_DS = V_DD − I_DR_D, V_S = 0, V_D = V_DS, V_G = V_GS. Single subscripts are voltages to ground; V_DS = V_D − V_S. Fixed bias needs two supplies, so it's rarely used.",
    steps: [
      { k: "learn", title: "Two equations, two unknowns", b: [
        ch(4, "04-dc-biasing-bjts.html", "p1", "Part 1", "BJT bias started from V_BE = 0.7 V and I_C = βI_B."),
        `<p>For a FET, start from:</p>`,
        `<div class="eq">I<sub>G</sub> ≅ 0    I<sub>D</sub> = I<sub>S</sub>    and the device law: I<sub>D</sub> = I<sub>DSS</sub>(1 − V<sub>GS</sub>/V<sub>P</sub>)²  or  k(V<sub>GS</sub> − V<sub>T</sub>)²</div>`,
        `<p>The device law belongs to the transistor and never changes. The circuit gives you a <b>second</b> equation linking the same two variables, I<sub>D</sub> and V<sub>GS</sub>. Where both are true is the operating point.</p>`,
        `<div class="key">Because Shockley's law is curved, the algebra means a quadratic. The book draws both on one graph and reads off the crossing: accurate to about a tenth, and quick.</div>`,
      ]},
      { k: "learn", title: "Fixed bias", b: [
        fig(fetFig("fixed")),
        `<p>No gate current, so no voltage across R<sub>G</sub>: treat it as a short for DC. (It's there for the ac signal in Chapter 8.) The loop gives</p>`,
        `<div class="eq">V<sub>GS</sub> = −V<sub>GG</sub>    V<sub>DS</sub> = V<sub>DD</sub> − I<sub>D</sub>R<sub>D</sub>    V<sub>S</sub> = 0, V<sub>D</sub> = V<sub>DS</sub>, V<sub>G</sub> = V<sub>GS</sub></div>`,
        `<p class="aside">V<sub>GG</sub> is a fixed supply, so V<sub>GS</sub> is fixed: hence "fixed bias". It needs a second supply, which is why it's rarely used.</p>`,
      ]},
      { k: "play", title: "The vertical line", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let VGG = 2;
          const IDSS = 12, VP = -6, VDD = 18, RD = 2.2;
          function draw() {
            const ID = shock(IDSS, VP)(-VGG);
            f.innerHTML = biasPlot({ dev: shock(IDSS, VP), x: [-7, 0], y: [0, 13], xt: [-6, -5, -4, -3, -2, -1, 0], yt: [0, 3, 6, 9, 12], vline: -VGG, q: { VGS: -VGG, ID }, label: "Shockley curve with the fixed-bias vertical line" });
            const VDS = VDD - ID * RD;
            ro.innerHTML = readout([["V<sub>GSQ</sub> = −V<sub>GG</sub>", fmt(-VGG, 3) + " V"], ["I<sub>DQ</sub>", fmt(ID, 4) + " mA"], ["V<sub>DS</sub> = V<sub>DD</sub> − I<sub>D</sub>R<sub>D</sub>", fmt(VDS, 4) + " V" + (VDS < -VGG - VP ? " (ohmic region!)" : "")]]);
          }
          host.append(f, slider({ id: id + "-v", label: "V<sub>GG</sub>", min: 0, max: 6, step: 0.1, value: VGG, show: (v) => fmt(v, 2) + " V" }, (v) => { VGG = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">JFET: I<sub>DSS</sub> = 12 mA, V<sub>P</sub> = −6 V; V<sub>DD</sub> = 18 V, R<sub>D</sub> = 2.2 kΩ. Any point on the blue line has V<sub>GS</sub> = −V<sub>GG</sub>; the device decides where on it.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Same circuit, V<sub>GG</sub> = 2 V.</p>`,
        { t: "num", q: "I_DQ, by Shockley's equation?", a: 5.333, unit: "mA", tol: 0.01, hint: "1 − (−2)/(−6) = 2/3.", why: "12 × (2/3)² = 5.33 mA. The graph would give about 5.3: close enough." },
        { t: "num", q: "V_DS?", a: 6.267, unit: "V", tol: 0.01, hint: "V_DD − I_DR_D.", why: "18 − 5.333 × 2.2 = 6.27 V." },
        { t: "num", q: "V_G (to ground)?", a: -2, unit: "V", hint: "V_S = 0, so V_G = V_GS.", why: "−2 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do FET bias problems need a graph or a quadratic, when BJT ones didn't?", model: "Because the FET's device law is a square law, not a straight line like I_C = βI_B. Combining it with the circuit's straight-line equation gives a quadratic. Graphically, you draw the device curve and the circuit's line on the same I_D–V_GS axes and read off where they cross." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Self-bias", mins: 25,
    blurb: "One supply. The source resistor makes V_GS negative by itself.",
    takeaway: "Self-bias: R_S in the source, gate returned to ground through R_G. V_GS = −I_DR_S: a straight line through the origin. Second point: pick any I_D (for example I_DSS/2) and compute V_GS. The Q-point is where it meets the transfer curve. Then V_DS = V_DD − I_D(R_S + R_D), V_S = I_DR_S, V_G = 0, V_D = V_DD − I_DR_D. Small R_S: the line hugs the I_D axis (Q near I_DSS). Large R_S: the line hugs the V_GS axis (Q near pinch-off). Algebra route: substitute into Shockley, get a quadratic, keep the root with I_D < I_DSS and V_GS between V_P and 0.",
    steps: [
      { k: "learn", title: "The source resistor does it", b: [
        fig(fetFig("self", { nodes: true })),
        `<p>Again I<sub>G</sub> = 0, so V<sub>G</sub> = 0. The drain current flows through R<sub>S</sub>, lifting the source to I<sub>D</sub>R<sub>S</sub> above ground. The gate is at 0, so:</p>`,
        `<div class="eq">V<sub>GS</sub> = −I<sub>D</sub>R<sub>S</sub></div>`,
        `<p>V<sub>GS</sub> now depends on the output current. More current → more negative gate → less current. That's negative feedback, set up by one resistor.</p>`,
      ]},
      { k: "learn", title: "Drawing the line", b: [
        `<ol><li>I<sub>D</sub> = 0 gives V<sub>GS</sub> = 0: the line passes through the <b>origin</b>.</li><li>Pick any other I<sub>D</sub>, say I<sub>DSS</sub>/2, and work out V<sub>GS</sub> = −I<sub>D</sub>R<sub>S</sub>.</li><li>Join them. The Q-point is where the line crosses the transfer curve.</li></ol>`,
        `<div class="eq">V<sub>DS</sub> = V<sub>DD</sub> − I<sub>D</sub>(R<sub>S</sub> + R<sub>D</sub>)    V<sub>S</sub> = I<sub>D</sub>R<sub>S</sub>    V<sub>D</sub> = V<sub>DD</sub> − I<sub>D</sub>R<sub>D</sub></div>`,
      ]},
      { k: "play", title: "Swing R_S", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let RS = 0.68;
          const IDSS = 10, VP = -5, VDD = 20, RD = 2.7;
          function draw() {
            const q = qpoint(shock(IDSS, VP), 0, RS);
            f.innerHTML = biasPlot({ dev: shock(IDSS, VP), x: [-5.5, 0], y: [0, 11], xt: [-5, -4, -3, -2, -1, 0], yt: [0, 2, 4, 6, 8, 10], line: { a: 0, b: RS }, q, label: "Self-bias line through the origin crossing the Shockley curve" });
            ro.innerHTML = readout([["R<sub>S</sub>", kohm(RS)], ["I<sub>DQ</sub>", fmt(q.ID, 4) + " mA"], ["V<sub>GSQ</sub>", fmt(q.VGS, 4) + " V"], ["V<sub>DS</sub>", fmt(VDD - q.ID * (RS + RD), 4) + " V"]]);
          }
          host.append(f, slider({ id: id + "-rs", label: "R<sub>S</sub>", min: 0.05, max: 10, log: true, value: RS, show: (v) => kohm(v) }, (v) => { RS = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">JFET: I<sub>DSS</sub> = 10 mA, V<sub>P</sub> = −5 V; V<sub>DD</sub> = 20 V, R<sub>D</sub> = 2.7 kΩ. Small R<sub>S</sub>: the line stands up near the I<sub>D</sub> axis. Large R<sub>S</sub>: it lies down toward the V<sub>GS</sub> axis.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>R<sub>S</sub> = 680 Ω in the circuit above. The graph gives I<sub>DQ</sub> ≈ 3.2 mA.</p>`,
        { t: "num", q: "V_GSQ?", a: -2.173, unit: "V", tol: 0.02, hint: "−I_DR_S.", why: "−3.196 × 0.68 = −2.17 V." },
        { t: "num", q: "V_DS?", a: 9.198, unit: "V", tol: 0.02, hint: "V_DD − I_D(R_S + R_D).", why: "20 − 3.196 × 3.38 = 9.20 V." },
        { t: "num", q: "V_D?", a: 11.37, unit: "V", tol: 0.02, hint: "V_DD − I_DR_D, or V_DS + V_S.", why: "20 − 3.196 × 2.7 = 11.37 V." },
      ]},
      { k: "math", title: "The algebra route", b: [
        `<p>Put V<sub>GS</sub> = −0.68I<sub>D</sub> into Shockley (I<sub>D</sub> in mA, R<sub>S</sub> in kΩ):</p>`,
        `<div class="eq">I<sub>D</sub> = 10(1 − 0.68I<sub>D</sub>/5)² = 10(1 − 0.136I<sub>D</sub>)²</div>`,
        `<p>Expand the square, (1 − x)² = 1 − 2x + x², and gather everything on one side:</p>`,
        `<div class="eq">0.185I<sub>D</sub>² − 3.72I<sub>D</sub> + 10 = 0</div>`,
        `<p>The quadratic formula gives two roots: <b>3.20 mA</b> and 16.9 mA.</p>`,
        { t: "mcq", q: "Which root is the real operating point?", opts: [
          ["3.20 mA", true, "16.9 mA is more than I_DSS = 10 mA, and would need V_GS = −11.5 V, beyond pinch-off. A square law always gives one root that isn't physical."],
          ["16.9 mA", false, "That's above I_DSS, impossible with a negative V_GS."],
          ["Both", false, "The circuit has only one operating point."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the self-bias line always pass through the origin?", model: "Because V_GS = −I_DR_S. When the drain current is zero, there's no voltage across R_S, so V_GS is zero too. The line starts at (0, 0) and slopes according to R_S." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Voltage-divider bias", mins: 25,
    blurb: "A divider sets the gate voltage. The bias line no longer passes through the origin.",
    takeaway: "With I_G = 0, the divider is unloaded: V_G = R_2V_DD/(R_1 + R_2) exactly, and I_R1 = I_R2 = V_DD/(R_1 + R_2). Loop: V_GS = V_G − I_DR_S. Intercepts: I_D = 0 gives V_GS = V_G (on the positive V_GS axis); V_GS = 0 gives I_D = V_G/R_S. The Q-point is where the line meets the transfer curve left of the axis. Larger R_S: lower I_DQ and more negative V_GSQ. Then V_DS = V_DD − I_D(R_D + R_S), V_D = V_DD − I_DR_D, V_S = I_DR_S. (Unlike the BJT version, no approximation is needed: the gate draws nothing.)",
    steps: [
      { k: "learn", title: "Same circuit, simpler input", b: [
        fig(fetFig("divider", { nodes: true })),
        ch(4, "04-dc-biasing-bjts.html", "p5", "Part 5", "For the BJT, I_B loaded the divider: you needed Thévenin or the βR_E ≥ 10R_2 check."),
        `<p>Here I<sub>G</sub> = 0, so the divider isn't loaded at all:</p>`,
        `<div class="eq">V<sub>G</sub> = R<sub>2</sub>V<sub>DD</sub>/(R<sub>1</sub> + R<sub>2</sub>)    V<sub>GS</sub> = V<sub>G</sub> − I<sub>D</sub>R<sub>S</sub></div>`,
      ]},
      { k: "learn", title: "Two easy points", b: [
        `<div class="two"><div class="tile"><h3>I<sub>D</sub> = 0</h3><p>V<sub>GS</sub> = V<sub>G</sub>: a point on the <b>positive</b> V<sub>GS</sub> axis.</p></div><div class="tile"><h3>V<sub>GS</sub> = 0</h3><p>I<sub>D</sub> = V<sub>G</sub>/R<sub>S</sub>: a point on the I<sub>D</sub> axis.</p></div></div>`,
        `<p>Join them and read the Q-point where the line crosses the curve, left of the I<sub>D</sub> axis.</p>`,
      ]},
      { k: "play", title: "Move the line", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let RS = 1.8, R2 = 330;
          const IDSS = 10, VP = -5, VDD = 18, R1 = 1500, RD = 2.2;
          function draw() {
            const VG = (R2 * VDD) / (R1 + R2), q = qpoint(shock(IDSS, VP), VG, RS);
            f.innerHTML = biasPlot({ dev: shock(IDSS, VP), x: [-5.5, 6], y: [0, 11], xt: [-5, -4, -3, -2, -1, 0, 2, 4, 6], yt: [0, 2, 4, 6, 8, 10], line: { a: VG, b: RS }, q, from: -5.5, more: [], label: "Divider bias line from VG on the axis, crossing the transfer curve" });
            ro.innerHTML = readout([["V<sub>G</sub>", fmt(VG, 4) + " V"], ["I<sub>D</sub> at V<sub>GS</sub> = 0: V<sub>G</sub>/R<sub>S</sub>", fmt(VG / RS, 4) + " mA"], ["I<sub>DQ</sub>", fmt(q.ID, 4) + " mA"], ["V<sub>GSQ</sub>", fmt(q.VGS, 4) + " V"], ["V<sub>DS</sub>", fmt(VDD - q.ID * (RD + RS), 4) + " V"]]);
          }
          host.append(f, slider({ id: id + "-rs", label: "R<sub>S</sub>", min: 0.3, max: 6, step: 0.1, value: RS, show: (v) => kohm(v) }, (v) => { RS = v; draw(); }).el,
            slider({ id: id + "-r2", label: "R<sub>2</sub> (R<sub>1</sub> = 1.5 MΩ)", min: 100, max: 1000, step: 10, value: R2, show: (v) => kohm(v) }, (v) => { R2 = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">V<sub>DD</sub> = 18 V, R<sub>D</sub> = 2.2 kΩ, same JFET. R<sub>2</sub> slides the line's start along the axis; R<sub>S</sub> sets its slope.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>R<sub>1</sub> = 1.5 MΩ, R<sub>2</sub> = 330 kΩ, R<sub>S</sub> = 1.8 kΩ, V<sub>DD</sub> = 18 V. The graph gives I<sub>DQ</sub> ≈ 3.05 mA.</p>`,
        { t: "num", q: "V_G?", a: 3.246, unit: "V", tol: 0.01, hint: "R_2V_DD/(R_1 + R_2).", why: "330k × 18/1830k = 3.25 V." },
        { t: "num", q: "V_GSQ?", a: -2.24, unit: "V", tol: 0.02, hint: "V_G − I_DR_S.", why: "3.246 − 3.048 × 1.8 = −2.24 V." },
        { t: "num", q: "V_S?", a: 5.486, unit: "V", tol: 0.02, hint: "I_DR_S.", why: "3.048 × 1.8 = 5.49 V. The source sits above the gate, which is how V_GS ends up negative." },
        { t: "mcq", q: "You raise R_S. What happens to the Q-point?", opts: [
          ["I_DQ falls and V_GSQ goes more negative", true, "The line's I_D intercept V_G/R_S drops, so it meets the curve lower down and further left."],
          ["I_DQ rises", false, "Try it in the lab."],
          ["Nothing: V_G is fixed by the divider", false, "V_G fixes where the line starts, but R_S sets its slope."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the FET divider easier than the BJT divider?", model: "Because the gate draws no current, the divider isn't loaded, so V_G is exactly R_2V_DD/(R_1 + R_2). For the BJT, the base current loads the divider, so you needed a Thévenin equivalent or a check that βR_E is at least ten times R_2." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Common gate, and V_GS = 0", mins: 20,
    blurb: "Gate grounded, signal into the source. And the simplest bias of all: gate tied to source.",
    takeaway: "Common gate: gate at ground, input at the source, output at the drain. With a negative supply V_SS on R_S: V_GS = V_SS − I_DR_S; intercepts V_GS = V_SS (I_D = 0) and I_D = V_SS/R_S (V_GS = 0). V_DS = V_DD + V_SS − I_D(R_D + R_S), V_D = V_DD − I_DR_D, V_S = −V_SS + I_DR_S. Without V_SS the line is the self-bias line, V_GS = −I_DR_S. Special case V_GSQ = 0 (gate and source both grounded): a vertical line at V_GS = 0, so I_DQ = I_DSS, V_DS = V_DD − I_DSSR_D, V_D = V_DS, V_S = 0.",
    steps: [
      { k: "learn", title: "Common gate", b: [
        `<p>Ground the gate; feed the signal into the source; take the output at the drain. For DC, with a negative supply V<sub>SS</sub> feeding R<sub>S</sub>:</p>`,
        `<div class="eq">V<sub>GS</sub> = V<sub>SS</sub> − I<sub>D</sub>R<sub>S</sub>    V<sub>DS</sub> = V<sub>DD</sub> + V<sub>SS</sub> − I<sub>D</sub>(R<sub>D</sub> + R<sub>S</sub>)</div>`,
        `<p>Same shape as the divider line, with V<sub>SS</sub> playing the part of V<sub>G</sub>. With no V<sub>SS</sub>, set it to 0 and you're back to the self-bias line.</p>`,
        { t: "num", q: "V_SS = 4 V, R_S = 2 kΩ. Where does the bias line cross the I_D axis?", a: 2, unit: "mA", hint: "Set V_GS = 0.", why: "I_D = V_SS/R_S = 2 mA." },
      ]},
      { k: "learn", title: "Gate tied to source", b: [
        fig(fetFig("gate0")),
        `<p>Gate and source both at ground: V<sub>GS</sub> is <b>0</b> no matter what. The "bias line" is the vertical axis.</p>`,
        `<div class="eq">I<sub>DQ</sub> = I<sub>DSS</sub>    V<sub>DS</sub> = V<sub>DD</sub> − I<sub>DSS</sub>R<sub>D</sub>    V<sub>D</sub> = V<sub>DS</sub>    V<sub>S</sub> = 0</div>`,
        `<p class="aside">It's simple enough to confuse people: there's no curve to draw at all.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Gate tied to source. I_DSS = 8 mA, V_DD = 15 V, R_D = 1.2 kΩ. V_DS?", a: 5.4, unit: "V", hint: "I_D = I_DSS.", why: "15 − 8 × 1.2 = 5.4 V." },
        { t: "mcq", q: "A sample of the same JFET part number has I_DSS = 12 mA instead. What's V_DS now?", opts: [
          ["0.6 V: almost in the ohmic region", true, "15 − 12 × 1.2 = 0.6 V. With I_DQ = I_DSS, the bias follows the device's spread exactly. No feedback holds it steady."],
          ["5.4 V, unchanged", false, "I_DQ is I_DSS, so it changes with I_DSS."],
          ["15 V", false, "That would mean no current."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the drawback of biasing a JFET with V_GS = 0?", model: "The drain current is simply I_DSS, which varies a lot from part to part, and nothing in the circuit corrects for that. The operating point moves with whichever transistor you happen to plug in." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Depletion-type MOSFETs", mins: 20,
    blurb: "Same methods as the JFET, but the Q-point is allowed past I_DSS with a positive V_GS.",
    takeaway: "Depletion MOSFETs (and depletion MESFETs) are biased exactly like JFETs: fixed bias, self-bias, divider, all the same equations. The difference: the transfer curve continues into positive V_GS, so a divider line can cross it with V_GSQ > 0 and I_DQ > I_DSS. Extend the curve far enough to reach the bias line, choosing positive V_GS values cautiously (+1 V or so) because the curve rises steeply. Self-bias still forces V_GS ≤ 0, so its Q-point stays below I_DSS.",
    steps: [
      { k: "learn", title: "Nothing new, except the right half", b: [
        `<p>Swap the JFET for a depletion MOSFET and every bias equation stays the same. The only new question: how far into <b>positive</b> V<sub>GS</sub> should you draw the curve?</p>`,
        `<p>Far enough to meet the bias line. Plot an extra point or two at small positive V<sub>GS</sub> (+1 V, say). Be cautious: the curve climbs fast there.</p>`,
        { t: "num", q: "I_DSS = 8 mA, V_P = −3 V. Plot point at V_GS = +1 V?", a: 14.22, unit: "mA", tol: 0.01, hint: "8(1 + 1/3)².", why: "14.2 mA: already well above I_DSS." },
      ]},
      { k: "play", title: "Into the enhancement region", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let RS = 0.47;
          const IDSS = 8, VP = -3, VDD = 15, VG = 15 * 10 / 92, RD = 1;
          function draw() {
            const q = qpoint(shock(IDSS, VP), VG, RS);
            f.innerHTML = biasPlot({ dev: shock(IDSS, VP), x: [-3.2, 2], y: [0, 16], xt: [-3, -2, -1, 0, 1, 2], yt: [0, 4, 8, 12, 16], line: { a: VG, b: RS }, q, more: [{ pts: [[-3.2, IDSS], [2, IDSS]], cls: "s5" }], texts: [{ x: -3.1, y: IDSS + 0.5, s: "I_DSS" }], label: "Depletion MOSFET curve with a divider bias line" });
            ro.innerHTML = readout([["V<sub>G</sub>", fmt(VG, 4) + " V"], ["I<sub>DQ</sub>", fmt(q.ID, 4) + " mA"], ["V<sub>GSQ</sub>", fmt(q.VGS, 4) + " V"], ["V<sub>DS</sub>", fmt(VDD - q.ID * (RS + RD), 4) + " V"]]);
            vd.className = "verdict " + (q.VGS > 0 ? "mid" : "ok");
            vd.textContent = q.VGS > 0 ? "Positive V_GS and I_D above I_DSS: impossible for a JFET, fine for a depletion MOSFET (within its ratings)." : "Q-point in the depletion region, like a JFET.";
          }
          host.append(f, slider({ id: id + "-rs", label: "R<sub>S</sub>", min: 0.08, max: 1.5, step: 0.01, value: RS, show: (v) => kohm(v) }, (v) => { RS = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">I<sub>DSS</sub> = 8 mA, V<sub>P</sub> = −3 V. Divider: R<sub>1</sub> = 82 MΩ, R<sub>2</sub> = 10 MΩ on 15 V, so V<sub>G</sub> = 1.63 V. R<sub>D</sub> = 1 kΩ. Shrink R<sub>S</sub> and watch the Q-point climb past I<sub>DSS</sub>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A depletion MOSFET is self-biased (R_S in the source, gate to ground through R_G). Can its Q-point have I_D > I_DSS?", opts: [
          ["No: V_GS = −I_DR_S is never positive, so I_D stays at or below I_DSS", true, "Only a circuit that can put the gate above the source (like a divider) reaches the enhancement region."],
          ["Yes, with a small enough R_S", false, "Even R_S → 0 only reaches V_GS = 0, I_D = I_DSS."],
          ["Yes, always", false, "Check the sign of V_GS = −I_DR_S."],
        ]},
        { t: "num", q: "Lab circuit with R_S = 100 Ω: the graph gives I_DQ ≈ 11.05 mA. V_GSQ?", a: 0.525, unit: "V", tol: 0.03, hint: "V_G − I_DR_S, with V_G = 1.63 V.", why: "1.63 − 11.05 × 0.1 = +0.53 V: a positive V_GS." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the one difference when you bias a depletion MOSFET instead of a JFET?", model: "The analysis is identical, but the depletion MOSFET's transfer curve continues to positive V_GS, so the Q-point can sit at a positive V_GS with a drain current above I_DSS. You have to extend the curve far enough to meet the bias line and keep an eye on the maximum current rating." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Enhancement MOSFETs: feedback bias", mins: 25,
    blurb: "A new curve shape, a resistor from drain to gate, and V_DS = V_GS.",
    takeaway: "Enhancement MOSFET curve: I_D = 0 for V_GS < V_GS(Th); above it I_D = k(V_GS − V_GS(Th))², with k = I_D(on)/(V_GS(on) − V_GS(Th))² from the datasheet point. Plot: the threshold point, the datasheet point, one point between and one just beyond. Feedback bias: R_G from drain to gate carries no current, so V_G = V_D and V_GS = V_DS. Output loop: V_GS = V_DD − I_DR_D. Intercepts: V_GS = V_DD (I_D = 0) and I_D = V_DD/R_D (V_GS = 0). Q-point at the crossing; V_DSQ = V_GSQ.",
    steps: [
      { k: "learn", title: "Plotting the curve", b: [
        `<p>A datasheet gives V<sub>GS(Th)</sub> and one "on" point (I<sub>D(on)</sub> at V<sub>GS(on)</sub>). Find k, then add a point between and one just beyond:</p>`,
        `<div class="eq">k = I<sub>D(on)</sub>/(V<sub>GS(on)</sub> − V<sub>GS(Th)</sub>)²    I<sub>D</sub> = k(V<sub>GS</sub> − V<sub>GS(Th)</sub>)²</div>`,
        { t: "num", q: "V_GS(Th) = 3 V, I_D(on) = 5 mA at V_GS(on) = 8 V. k, in mA/V²?", a: 0.2, unit: "mA/V²", hint: "5/(8 − 3)².", why: "5/25 = 0.2 mA/V² (0.2 × 10⁻³ A/V²)." },
        { t: "num", q: "A point beyond the datasheet one: I_D at V_GS = 10 V?", a: 9.8, unit: "mA", hint: "0.2 × (10 − 3)².", why: "0.2 × 49 = 9.8 mA." },
        `<p class="aside">Book slip: Example 7.10 calls V<sub>GS</sub> = 10 V "slightly greater than V<sub>GS(Th)</sub>". It means slightly greater than V<sub>GS(on)</sub> (8 V).</p>`,
      ]},
      { k: "learn", title: "Feedback bias", b: [
        fig(fetFig("feedback", { dev: "enh", nodes: true })),
        `<p>No gate current, so no drop across R<sub>G</sub>: the gate sits at the drain voltage.</p>`,
        `<div class="eq">V<sub>GS</sub> = V<sub>DS</sub>    V<sub>GS</sub> = V<sub>DD</sub> − I<sub>D</sub>R<sub>D</sub></div>`,
        `<p>Intercepts: I<sub>D</sub> = 0 → V<sub>GS</sub> = V<sub>DD</sub>; V<sub>GS</sub> = 0 → I<sub>D</sub> = V<sub>DD</sub>/R<sub>D</sub>.</p>`,
      ]},
      { k: "play", title: "Feedback-bias lab", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let RD = 2.2;
          const k = 0.2, VT = 3, VDD = 15;
          function draw() {
            const q = qpoint(enh(k, VT), VDD, RD);
            f.innerHTML = biasPlot({ dev: enh(k, VT), x: [0, 16], y: [0, 12], xt: [0, 3, 6, 9, 12, 15], yt: [0, 3, 6, 9, 12], line: { a: VDD, b: RD }, q, texts: [{ x: 3.1, y: 0.6, s: "V_GS(Th)" }], label: "Enhancement MOSFET curve with the feedback bias line" });
            ro.innerHTML = readout([["V<sub>DD</sub>/R<sub>D</sub>", fmt(VDD / RD, 4) + " mA"], ["I<sub>DQ</sub>", fmt(q.ID, 4) + " mA"], ["V<sub>GSQ</sub> = V<sub>DSQ</sub>", fmt(q.VGS, 4) + " V"]]);
          }
          host.append(f, slider({ id: id + "-rd", label: "R<sub>D</sub>", min: 0.5, max: 10, step: 0.1, value: RD, show: (v) => kohm(v) }, (v) => { RD = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">k = 0.2 mA/V², V<sub>GS(Th)</sub> = 3 V, V<sub>DD</sub> = 15 V.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>R<sub>D</sub> = 2.2 kΩ. The graph gives I<sub>DQ</sub> ≈ 3.54 mA.</p>`,
        { t: "num", q: "V_DSQ?", a: 7.208, unit: "V", tol: 0.02, hint: "V_DS = V_GS = V_DD − I_DR_D.", why: "15 − 3.542 × 2.2 = 7.21 V." },
        { t: "mcq", q: "Is the MOSFET in saturation (V_DS ≥ V_GS − V_GS(Th))?", opts: [
          ["Yes: V_DS = V_GS, which is always more than V_GS − V_GS(Th)", true, "With feedback bias the drain–gate tie guarantees it. The square law is valid."],
          ["No", false, "Compare V_DS = 7.2 V with V_GS − V_T = 4.2 V."],
          ["Can't tell", false, "V_DS = V_GS here, so you can."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is V_DS = V_GS in the feedback-biased enhancement MOSFET?", model: "The resistor R_G connects drain to gate, but the gate draws no current, so there's no voltage across R_G. The gate is at the same voltage as the drain, and since both are measured from the source, V_GS equals V_DS." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Enhancement MOSFETs: divider bias, and the whole table", mins: 20,
    blurb: "The divider again, now with a threshold curve. Then compare every bias line side by side.",
    takeaway: "Divider bias for an enhancement MOSFET: V_G = R_2V_DD/(R_1 + R_2), V_GS = V_G − I_DR_S, V_DS = V_DD − I_D(R_S + R_D). Same intercepts as before; the Q-point is where the line meets the curve to the right of V_GS(Th). Summary of bias lines on the I_D–V_GS plane: fixed bias: vertical at −V_GG; self-bias: through the origin; divider and common gate: from V_G (or V_SS) on the axis; V_GS = 0: the vertical axis; enhancement feedback: from V_DD down to V_DD/R_D. Once the Q-point is found, the rest is just Ohm and Kirchhoff.",
    steps: [
      { k: "learn", title: "The divider, again", b: [
        fig(fetFig("divider", { dev: "enh" })),
        `<div class="eq">V<sub>G</sub> = R<sub>2</sub>V<sub>DD</sub>/(R<sub>1</sub> + R<sub>2</sub>)    V<sub>GS</sub> = V<sub>G</sub> − I<sub>D</sub>R<sub>S</sub>    V<sub>DS</sub> = V<sub>DD</sub> − I<sub>D</sub>(R<sub>S</sub> + R<sub>D</sub>)</div>`,
        `<p>For an enhancement device, V<sub>G</sub> must be well above V<sub>GS(Th)</sub>, or the line crosses the flat part of the curve and nothing conducts.</p>`,
      ]},
      { k: "play", title: "Divider lab", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let RS = 1, VG = 10;
          const k = 0.15, VT = 4, VDD = 30, RD = 2.7;
          function draw() {
            const q = qpoint(enh(k, VT), VG, RS);
            f.innerHTML = biasPlot({ dev: enh(k, VT), x: [0, 16], y: [0, 12], xt: [0, 4, 8, 12, 16], yt: [0, 3, 6, 9, 12], line: { a: VG, b: RS }, q, label: "Enhancement MOSFET curve with a divider bias line" });
            ro.innerHTML = readout([["I<sub>DQ</sub>", fmt(q.ID, 4) + " mA"], ["V<sub>GSQ</sub>", fmt(q.VGS, 4) + " V"], ["V<sub>DS</sub>", fmt(VDD - q.ID * (RS + RD), 4) + " V"]]);
          }
          host.append(f, slider({ id: id + "-vg", label: "V<sub>G</sub> (set by the divider)", min: 2, max: 15, step: 0.1, value: VG, show: (v) => fmt(v, 3) + " V" }, (v) => { VG = v; draw(); }).el,
            slider({ id: id + "-rs", label: "R<sub>S</sub>", min: 0.2, max: 4, step: 0.1, value: RS, show: (v) => kohm(v) }, (v) => { RS = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">k = 0.15 mA/V², V<sub>GS(Th)</sub> = 4 V, V<sub>DD</sub> = 30 V, R<sub>D</sub> = 2.7 kΩ. Drop V<sub>G</sub> below 4 V: no crossing above zero, so I<sub>D</sub> = 0.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>R<sub>1</sub> = 20 MΩ, R<sub>2</sub> = 10 MΩ, V<sub>DD</sub> = 30 V, R<sub>S</sub> = 1 kΩ, R<sub>D</sub> = 2.7 kΩ.</p>`,
        { t: "num", q: "V_G?", a: 10, unit: "V", hint: "R_2V_DD/(R_1 + R_2).", why: "10 × 30/30 = 10 V." },
        { t: "num", q: "The graph gives I_DQ ≈ 2.18 mA. V_GSQ?", a: 7.816, unit: "V", tol: 0.02, hint: "V_G − I_DR_S.", why: "10 − 2.184 × 1 = 7.82 V." },
        { t: "num", q: "V_DS?", a: 21.92, unit: "V", tol: 0.02, hint: "V_DD − I_D(R_S + R_D).", why: "30 − 2.184 × 3.7 = 21.9 V." },
      ]},
      { k: "check", title: "Match the line", b: [
        { t: "sort", q: "Which bias line belongs to which circuit?", bins: ["Vertical line", "Through the origin", "Starts at +V_G or +V_SS on the axis", "Starts at V_DD on the axis"], items: [
          ["JFET fixed bias", 0, "V_GS = −V_GG, whatever I_D is."],
          ["JFET or depletion MOSFET self-bias", 1, "V_GS = −I_DR_S."],
          ["Voltage-divider bias (any FET)", 2, "V_GS = V_G − I_DR_S."],
          ["Common gate with a V_SS supply", 2, "V_GS = V_SS − I_DR_S."],
          ["Gate tied to source", 0, "The line is the V_GS = 0 axis itself."],
          ["Enhancement MOSFET feedback bias", 3, "V_GS = V_DD − I_DR_D."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What has to be true of V_G for a divider-biased enhancement MOSFET to conduct?", model: "V_G has to be above the threshold voltage V_GS(Th). The bias line starts at V_G on the axis and slopes back toward smaller V_GS; if V_G is below threshold, the line only meets the curve where the current is zero." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  function combFig() {
    let s = S.supply(220, 30, "18 V") + S.wire([180, 30], [260, 30]) + S.res(260, 30, 260, 90, "2.2 kΩ", { side: "right" }) + jfet(238, 130);
    s += S.res(180, 30, 180, 220, "68 kΩ", { side: "left" }) + S.dot(180, 220) + S.res(180, 220, 180, 320, "15 kΩ", { side: "left" }) + S.gnd(180, 320);
    s += S.wire([180, 220], [208, 220]) + S.wire([208, 130], [195, 130], [195, 220]) + S.dot(195, 220);
    s += bjtSym(258, 220) + S.res(260, 270, 260, 320, "1.2 kΩ", { side: "right" }) + S.gnd(260, 320);
    s += S.t(272, 100, "V_D", { a: "start", cls: "a s" }) + S.t(272, 176, "V_C", { a: "start", cls: "a s" }) + S.t(166, 214, "V_B", { a: "end", cls: "a s" }) + S.t(290, 236, "β = 150", { a: "start", cls: "s m" }) + S.t(290, 136, "I_DSS = 10 mA, V_P = −4 V", { a: "start", cls: "s m" });
    return S.svg(480, 350, s, { max: 480, label: "A JFET stacked on a voltage-divider-biased BJT, gate tied to the BJT base" });
  }
  /* npn BJT symbol: base from (x−30,y); collector (x+2,y−50); emitter (x+2,y+50). */
  function bjtSym(x, y) {
    const X = x - 20;
    return `<line class="w" x1="${X - 30}" y1="${y}" x2="${X}" y2="${y}"/><line class="w" x1="${X}" y1="${y - 20}" x2="${X}" y2="${y + 20}" style="stroke-width:3.5"/><polyline class="w" points="${X},${y - 9} ${X + 22},${y - 28} ${X + 22},${y - 50}"/><polyline class="w" points="${X},${y + 9} ${X + 22},${y + 28} ${X + 22},${y + 50}"/><polygon class="nd" points="${X + 19},${y + 25} ${X + 9},${y + 23} ${X + 14},${y + 15}"/>`;
  }
  const p8 = {
    id: "p8", title: "BJT and FET together", mins: 25,
    blurb: "Find the device that gives you a number straight away, then work outward.",
    takeaway: "With mixed BJT/FET circuits there's no new method: find an opening. Start with the device whose terminal voltage or current comes out directly (often a divider-biased BJT: V_B, V_E = V_B − 0.7, I_E = V_E/R_E), then use I_C = I_D or a shared node to reach the other device. Shockley's equation can be used backwards: from a known I_D find V_GS = V_P(1 − √(I_D/I_DSS)), then node voltages follow, e.g. V_C = V_B − V_GS when the JFET's gate sits on the BJT base and its source on the collector. If the BJT gives no opening, start from the FET's own bias line instead.",
    steps: [
      { k: "learn", title: "Look for the opening", b: [
        `<p>No new laws here. The skill is choosing where to start: the device whose voltage or current you can get <b>directly</b>.</p>`,
        fig(combFig()),
        `<p>Here the JFET's gate is tied to the BJT's base (no current flows into the gate) and its source feeds the BJT's collector. Which device gives you a number straight away?</p>`,
        { t: "mcq", q: "Where do you start?", opts: [
          ["The BJT: its divider gives V_B directly, then V_E and I_E", true, "βR_E = 180 kΩ ≥ 10R_2 = 150 kΩ, so the approximate divider method works. I_E ≈ I_C = I_D. That's your opening."],
          ["The JFET: draw its bias line", false, "Its source voltage depends on the BJT, so you can't draw a line yet."],
          ["Neither: you need simultaneous equations", false, "The BJT can be solved on its own."],
        ]},
      ]},
      { k: "check", title: "Work it through", b: [
        { t: "num", q: "V_B?", a: 3.253, unit: "V", tol: 0.01, hint: "15k × 18/(68k + 15k).", why: "3.25 V." },
        { t: "num", q: "I_E (= I_C = I_D), in mA?", a: 2.128, unit: "mA", tol: 0.01, hint: "(V_B − 0.7)/R_E.", why: "2.553/1.2k = 2.13 mA." },
        { t: "num", q: "V_D?", a: 13.32, unit: "V", tol: 0.01, hint: "18 − I_DR_D.", why: "18 − 2.128 × 2.2 = 13.32 V." },
        { t: "num", q: "Now Shockley backwards: V_GSQ?", a: -2.155, unit: "V", tol: 0.02, hint: "V_P(1 − √(I_D/I_DSS)) = −4(1 − √0.2128).", why: "√0.2128 = 0.461, so −4 × 0.539 = −2.16 V. On a graph: draw a horizontal line at 2.13 mA and drop down from the curve." },
        { t: "num", q: "V_C (the JFET source)?", a: 5.408, unit: "V", tol: 0.01, hint: "The gate is at V_B, and V_GS = V_G − V_S.", why: "V_C = V_B − V_GS = 3.253 + 2.155 = 5.41 V." },
      ]},
      { k: "learn", title: "When the BJT gives no opening", b: [
        `<p>Swap the roles: a self-biased JFET whose drain feeds the emitter of a BJT. Now the JFET's own bias line (V<sub>GS</sub> = −I<sub>D</sub>R<sub>S</sub>) gives I<sub>D</sub> straight away. Then I<sub>C</sub> ≈ I<sub>D</sub>, I<sub>B</sub> = I<sub>C</sub>/β, and the base voltage follows from the base resistor.</p>`,
        `<div class="key">Whichever device can be solved alone goes first. Its current or voltage is the key into the other.</div>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you find V_GS once you know a JFET's drain current?", model: "Use Shockley's equation backwards: V_GS = V_P(1 − √(I_D/I_DSS)). Graphically, draw a horizontal line at that I_D across to the transfer curve and read V_GS straight down." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Design: work backwards", mins: 20,
    blurb: "Given the operating point you want, find the resistors. Mostly R = V/I.",
    takeaway: "Design runs the analysis backwards. Most resistors come from R = V_R/I_R with both quantities known from the specification. Self-bias: R_D = (V_DD − V_D)/I_DQ; read V_GSQ off the transfer curve at I_DQ, then R_S = −V_GSQ/I_DQ. Divider: from V_G and the desired V_GSQ and I_D, R_S = (V_G − V_GSQ)/I_D. Enhancement feedback: V_DS = V_GS sets V_DD and R_D. Round to the nearest standard values. Good starting points: V_GSQ near V_P/2 or I_DQ near I_DSS/2, away from I_DSS and cutoff; never exceed the datasheet's maximum I_D and V_DS.",
    steps: [
      { k: "learn", title: "Design rules", b: [
        `<div class="eq">R<sub>unknown</sub> = V<sub>R</sub> / I<sub>R</sub></div>`,
        `<ul><li>Keep away from I<sub>DSS</sub> and from cutoff. Start with V<sub>GSQ</sub> ≈ V<sub>P</sub>/2 or I<sub>DQ</sub> ≈ I<sub>DSS</sub>/2.</li><li>Stay under the datasheet's maximum I<sub>D</sub> and V<sub>DS</sub>, with a margin.</li><li>Round to the nearest standard value; the tolerances are usually bigger than the rounding.</li></ul>`,
      ]},
      { k: "check", title: "Design a self-bias stage", b: [
        `<p>JFET: I<sub>DSS</sub> = 12 mA, V<sub>P</sub> = −4 V. V<sub>DD</sub> = 18 V. You want I<sub>DQ</sub> = 3 mA and V<sub>D</sub> = 10 V.</p>`,
        { t: "num", q: "R_D, in kΩ?", a: 2.667, unit: "kΩ", tol: 0.01, hint: "(V_DD − V_D)/I_DQ.", why: "8 V/3 mA = 2.67 kΩ. Nearest standard: 2.7 kΩ." },
        { t: "num", q: "V_GSQ at 3 mA?", a: -2, unit: "V", hint: "3 mA is I_DSS/4. Which V_GS gives I_DSS/4?", why: "V_P/2 = −2 V. (Or use Shockley backwards.)" },
        { t: "num", q: "R_S, in Ω?", a: 666.7, unit: "Ω", tol: 0.01, hint: "−V_GSQ/I_DQ.", why: "2 V/3 mA = 667 Ω. Nearest standard: 680 Ω." },
      ]},
      { k: "check", title: "Design a divider stage", b: [
        `<p>A divider gives V<sub>G</sub> = 4.2 V. You want V<sub>GSQ</sub> = −1.5 V with I<sub>D</sub> = 2.5 mA.</p>`,
        { t: "num", q: "R_S, in kΩ?", a: 2.28, unit: "kΩ", tol: 0.01, hint: "V_GS = V_G − I_DR_S, so R_S = (V_G − V_GS)/I_D.", why: "(4.2 + 1.5)/2.5 = 2.28 kΩ. Nearest standard: 2.2 kΩ." },
      ]},
      { k: "check", title: "Design a feedback stage", b: [
        `<p>Enhancement MOSFET, feedback bias. You want it at its datasheet point I<sub>D(on)</sub> = 6 mA, V<sub>GS(on)</sub> = 8 V, with V<sub>DS</sub> = V<sub>DD</sub>/2.</p>`,
        { t: "num", q: "V_DD?", a: 16, unit: "V", hint: "V_DS = V_GS = 8 V, and that's half of V_DD.", why: "16 V." },
        { t: "num", q: "R_D, in kΩ?", a: 1.333, unit: "kΩ", tol: 0.01, hint: "(V_DD − V_DS)/I_D.", why: "8 V/6 mA = 1.33 kΩ." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why aim for an operating point near V_P/2 rather than near I_DSS?", model: "Near I_DSS or near cutoff, the signal has little room to swing before the device runs out of current or shuts off, and part-to-part variation can push the operating point over the edge. A Q-point in the middle of the curve leaves room on both sides." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "Troubleshooting and p-channel FETs", mins: 20,
    blurb: "What a healthy JFET stage reads on a meter. Then flip every sign for p-channel.",
    takeaway: "Know what to expect before measuring. Self-biased n-channel JFET: V_GS (red lead on gate, black on source) should read negative, a few volts, between 0 and V_P. V_DS is typically 25–75% of V_DD. V_DS = 0: open output circuit or a drain–source short. V_D = V_DD: no current through R_D (check continuity). V_S = V_DD: the device isn't open but isn't on; maybe a bad ground on R_S. A 0 V reading across any resistor except R_G means no current through it. Measure voltages, not currents (inserting an ammeter disturbs the circuit). A curve tracer is the best test of the FET itself. p-channel: reverse every supply and current direction; V_GS positive (either sign for depletion MOSFETs), V_DS negative. Easiest route: analyze as n-channel with magnitudes, then flip the signs.",
    steps: [
      { k: "learn", title: "What healthy looks like", b: [
        ch(4, "04-dc-biasing-bjts.html", "p13", "Part 13", "Same approach as for BJT stages."),
        `<ul><li><b>V<sub>GS</sub></b> (red on gate, black on source): negative, a few volts, between 0 and V<sub>P</sub>.</li><li><b>V<sub>DS</sub></b>: about 25% to 75% of V<sub>DD</sub>.</li><li>Measure <b>voltages</b>. Inserting an ammeter means breaking the circuit; Ohm's law gives the currents.</li></ul>`,
      ]},
      { k: "check", title: "Diagnose", b: [
        { t: "sort", q: "What does each reading suggest in a self-biased n-channel JFET stage?", bins: ["Open output path or D–S short", "No current through R_D", "Device not on; check R_S ground", "Looks healthy"], items: [
          ["V_DS = 0 V", 0, "Either nothing flows in the output loop, or the JFET is shorted drain to source."],
          ["V_D = V_DD", 1, "No drop across R_D. R_D is connected (V_DD reaches the drain), so look for a break elsewhere."],
          ["V_S = V_DD", 2, "The supply reaches the source, so the JFET isn't open, but it isn't conducting normally; maybe the ground connection of R_S has come loose."],
          ["V_GS = −1.8 V, V_DS = 9 V with V_DD = 20 V", 3, "Negative V_GS of a few volts, V_DS at 45% of V_DD."],
        ]},
        `<p class="aside">Any resistor (except R<sub>G</sub>) reading 0 V across it carries no current: there's a break in its path. R<sub>G</sub> always reads 0 V, because I<sub>G</sub> = 0.</p>`,
      ]},
      { k: "learn", title: "p-channel FETs", b: [
        `<p>Mirror every transfer curve and reverse every current and supply. The double-subscript names stay: V<sub>GS</sub>, V<sub>DS</sub>. For p-channel: V<sub>GS</sub> positive (JFET), V<sub>DS</sub> negative.</p>`,
        `<div class="key">Shortcut: pretend it's n-channel, use magnitudes, solve, then reverse every polarity and current direction at the end.</div>`,
        `<p>A p-channel JFET (I<sub>DSS</sub> = 8 mA, V<sub>P</sub> = +4 V) with a divider (82 kΩ top, 18 kΩ bottom) on V<sub>DD</sub> = −18 V, R<sub>S</sub> = 1.5 kΩ, R<sub>D</sub> = 2.2 kΩ.</p>`,
        { t: "num", q: "V_G?", a: -3.24, unit: "V", tol: 0.01, hint: "18k × (−18 V)/100k.", why: "−3.24 V." },
        { t: "num", q: "The graph gives I_DQ ≈ 3.15 mA. V_GSQ?", a: 1.489, unit: "V", tol: 0.02, hint: "For this p-channel circuit, V_GS = V_G + I_DR_S.", why: "−3.24 + 3.153 × 1.5 = +1.49 V. Positive, as a p-channel JFET's should be." },
        { t: "num", q: "V_DS?", a: -6.334, unit: "V", tol: 0.02, hint: "V_DS = −V_DD(magnitude) + I_D(R_D + R_S).", why: "−18 + 3.153 × 3.7 = −6.33 V. Negative: the source is above the drain." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why measure voltages rather than currents when troubleshooting?", model: "To measure a current you have to break the circuit and insert the meter, which disturbs what you're testing. Voltages can be measured from outside, and if you know the resistor values, Ohm's law gives the currents anyway." },
      ]},
    ],
  };

  /* =============== PART 11 =============== */
  const p11 = {
    id: "p11", title: "The universal JFET bias curve", mins: 20,
    blurb: "One normalized curve for every JFET. No more sketching Shockley each time.",
    takeaway: "Normalize: x = V_GS/|V_P|, y = I_D/I_DSS. Every JFET (and depletion MOSFET at negative V_GS) then follows y = (1 + x)² from (−1, 0) to (0, 1). m = |V_P|/(I_DSSR_S), M = m·V_G/|V_P|. Self-bias line: y = −m·x, drawn from the origin through the m-scale reading (the m scale sits at x = −0.2). Divider line: y = M − m·x: start at M on the M scale (x = 0), go across to the m scale, add m, and draw to that point. The Q-point gives y and x; multiply back: I_DQ = y·I_DSS, V_GSQ = x·|V_P|.",
    steps: [
      { k: "learn", title: "Normalize away the details", b: [
        `<p>Divide currents by I<sub>DSS</sub> and gate voltages by |V<sub>P</sub>| (magnitude only). Shockley becomes the same curve for every JFET:</p>`,
        `<div class="eq">I<sub>D</sub>/I<sub>DSS</sub> = (1 + V<sub>GS</sub>/|V<sub>P</sub>|)²    from (−1, 0) to (0, 1)</div>`,
        `<p>The bias lines need two numbers:</p>`,
        `<div class="eq">m = |V<sub>P</sub>| / (I<sub>DSS</sub>R<sub>S</sub>)    M = m · V<sub>G</sub>/|V<sub>P</sub>|</div>`,
        `<div class="two"><div class="tile"><h3>Self-bias</h3><p>Line from the origin through m on the m scale.</p></div><div class="tile"><h3>Divider</h3><p>Start at M (on the right axis), go across to the m scale, add m, draw the line.</p></div></div>`,
      ]},
      { k: "play", title: "The universal curve", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let IDSS = 8, VP = 4, RS = 1, VG = 2;
          function draw() {
            const m = VP / (IDSS * RS), M = (m * VG) / VP, dev = (x) => (x <= -1 ? 0 : Math.pow(1 + x, 2));
            let lo = 0, hi = 1.5;
            for (let i = 0; i < 100; i++) { const y = (lo + hi) / 2, x = (M - y) / m; if (dev(x) > y) lo = y; else hi = y; }
            const y = (lo + hi) / 2, x = (M - y) / m;
            f.innerHTML = plot({ x: [-1, 0.05], y: [0, 1.05], xt: [-1, -0.8, -0.6, -0.4, -0.2, 0], yt: [0, 0.2, 0.4, 0.6, 0.8, 1], xl: "V_GS/|V_P|", yl: "I_D/I_DSS", series: [{ f: dev, cls: "s1" }, { f: (xx) => M - m * xx, cls: "s2" }, { pts: [[-0.2, 0], [-0.2, 1.05]], cls: "s5" }], marks: [{ x, y, label: "Q", dx: 8, dy: -8 }, { x: -0.2, y: Math.min(1.04, M + 0.2 * m), cls: "mk2" }, { x: 0, y: M, cls: "mk2" }], texts: [{ x: -0.19, y: 0.98, s: "m scale" }], label: "Universal JFET bias curve with a bias line" });
            ro.innerHTML = readout([["m", fmt(m, 3)], ["M", fmt(M, 3)], ["I<sub>D</sub>/I<sub>DSS</sub>", fmt(y, 3)], ["V<sub>GS</sub>/|V<sub>P</sub>|", fmt(x, 3)], ["I<sub>DQ</sub>", fmt(y * IDSS, 3) + " mA"], ["V<sub>GSQ</sub>", fmt(x * VP, 3) + " V"]]);
          }
          host.append(f, slider({ id: id + "-rs", label: "R<sub>S</sub>", min: 0.2, max: 5, step: 0.1, value: RS, show: (v) => kohm(v) }, (v) => { RS = v; draw(); }).el,
            slider({ id: id + "-vg", label: "V<sub>G</sub> (0 = self-bias)", min: 0, max: 6, step: 0.1, value: VG, show: (v) => fmt(v, 2) + " V" }, (v) => { VG = v; draw(); }).el,
            slider({ id: id + "-i", label: "I<sub>DSS</sub>", min: 2, max: 16, step: 1, value: IDSS, show: (v) => v + " mA" }, (v) => { IDSS = v; draw(); }).el,
            slider({ id: id + "-vp", label: "|V<sub>P</sub>|", min: 1, max: 8, step: 0.5, value: VP, show: (v) => v + " V" }, (v) => { VP = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The orange curve never changes, whatever JFET you choose. Only the blue line moves. The dashed vertical line at −0.2 is where the book's m scale sits (its reading there is 5 × the height).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>I<sub>DSS</sub> = 8 mA, V<sub>P</sub> = −4 V, R<sub>S</sub> = 1 kΩ, divider V<sub>G</sub> = 2 V.</p>`,
        { t: "num", q: "m?", a: 0.5, hint: "|V_P|/(I_DSSR_S) = 4/(8 × 1).", why: "0.5." },
        { t: "num", q: "M?", a: 0.25, hint: "m × V_G/|V_P|.", why: "0.5 × 2/4 = 0.25." },
        { t: "num", q: "The universal curve gives I_D/I_DSS ≈ 0.424. I_DQ?", a: 3.394, unit: "mA", tol: 0.02, hint: "Multiply back by I_DSS.", why: "0.424 × 8 = 3.39 mA. Check: V_GS = 2 − 3.39 = −1.39 V, and 8(1 − 1.39/4)² = 3.40 mA." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does normalizing the transfer curve buy you?", model: "Every JFET's Shockley curve becomes the same curve once you divide I_D by I_DSS and V_GS by |V_P|. So instead of sketching a new curve for each device, you draw only the bias line (using m and M) on one universal chart, then multiply back to get the actual I_DQ and V_GSQ." },
      ]},
    ],
  };

  /* =============== PART 12 =============== */
  const p12 = {
    id: "p12", title: "In practice", mins: 25,
    blurb: "A JFET as a gain knob, a timer that switches a lamp off by itself, fiber links and a light-beam alarm.",
    takeaway: "Voltage-controlled resistor: for small V_DS (well below V_P), the JFET's drain–source path is a resistor R_DS = R_o/(1 − V_GS/V_P)², from R_o at V_GS = 0 to very large near pinch-off. In a noninverting op-amp the gain 1 + R_f/R_DS can then be set by a DC voltage: useful for automatic level control, oscillator stabilization and thermal compensation. DC control is far less noise-prone than running the signal through a remote potentiometer. JFET timer: pressing a switch zeroes a capacitor (V_GS = 0, I_D = I_DSS, lamp bright); released, the capacitor charges negative through R_1 + R_2 until it reaches pinch-off and the lamp goes out. The JFET's high input resistance doesn't disturb the RC timing. Fiber optics: a JFET switches an LED from TTL levels; a photodiode and JFET receive. MOSFET relay driver: a photoconductive cell in a divider sets V_GS; interrupting the light raises V_G and turns the MOSFET on hard enough to pull in a relay.",
    steps: [
      { k: "play", title: "A gain knob with no knob", b: [
        (host, id) => {
          const ro = el(`<div></div>`), f = el(`<div class="fig"></div>`);
          let VGS = -1.5;
          const Ro = 150, VP = -3, Rf = 4700;
          function draw() {
            const RDS = Ro / Math.pow(1 - VGS / VP, 2), G = 1 + Rf / RDS;
            f.innerHTML = plot({ x: [-2.7, 0], y: [0, 35], xt: [-2.5, -2, -1.5, -1, -0.5, 0], yt: [0, 10, 20, 30], xl: "V_GS (V)", yl: "gain", series: [{ f: (v) => 1 + Rf / (Ro / Math.pow(1 - v / VP, 2)), cls: "s1" }], marks: [{ x: VGS, y: G }], label: "Noninverting amplifier gain set by the JFET's gate voltage" });
            ro.innerHTML = readout([["R<sub>DS</sub> = R<sub>o</sub>/(1 − V<sub>GS</sub>/V<sub>P</sub>)²", ohm(RDS)], ["Gain = 1 + R<sub>f</sub>/R<sub>DS</sub>", fmt(G, 3)]]);
          }
          host.append(f, slider({ id: id + "-gs", label: "Control voltage V<sub>GS</sub>", min: -2.7, max: 0, step: 0.05, value: VGS, show: (v) => fmt(v, 2) + " V" }, (v) => { VGS = v; draw(); }).el, ro);
          draw();
        },
        `<p>Below about 0.5 V of V<sub>DS</sub>, the JFET's drain curves are nearly straight lines through the origin: it's a resistor whose value V<sub>GS</sub> sets. Put it where R<sub>1</sub> goes in a noninverting op-amp amplifier (Chapter 10): gain = 1 + R<sub>f</sub>/R<sub>DS</sub>.</p>`,
        `<p class="aside">Here R<sub>o</sub> = 150 Ω, V<sub>P</sub> = −3 V, R<sub>f</sub> = 4.7 kΩ. A DC voltage now sets the gain: a falling battery, a drifting oscillator or a heating circuit can be corrected automatically.</p>`,
      ]},
      { k: "learn", title: "Why DC control is quieter", b: [
        `<p>Run the audio itself out to a remote volume pot and the long wire picks up interference (lights, motors, radio): a 2 mV signal with 1 mV of noise is a terrible ratio. Large pot resistances also soak up more of that RF noise.</p>`,
        `<p>Run a <b>DC</b> control voltage instead. 1 mV of noise on a 2 V control line just nudges the operating point: almost no effect on R<sub>DS</sub>. And DC levels suit remote and digital control (an IR remote steps through a staircase of DC levels).</p>`,
      ]},
      { k: "learn", title: "A timer that switches itself off", b: [
        `<ol><li>Press the switch: the capacitor on the gate is shorted to 0 V. V<sub>GS</sub> = 0, so I<sub>D</sub> = I<sub>DSS</sub> and the lamp in the drain is bright.</li><li>Release: the capacitor charges toward −9 V through R<sub>1</sub> + R<sub>2</sub>. The lamp dims as V<sub>GS</sub> goes negative.</li><li>When V<sub>GS</sub> reaches V<sub>P</sub>, the JFET cuts off and the lamp goes out.</li></ol>`,
        `<p>The JFET's huge input resistance doesn't load the RC circuit, so the timing is set by R and C alone. A BJT would load it (a few kΩ input) and switch over only 0.7 V.</p>`,
        { t: "num", q: "R_1 + R_2 = 1 MΩ, C = 33 µF, V_P = −4 V, charging toward −9 V. How long until the lamp goes out? (v = −9(1 − e^(−t/τ)))", a: 19.4, unit: "s", tol: 0.02, hint: "τ = RC = 33 s. Solve 4 = 9(1 − e^(−t/33)): e^(−t/33) = 5/9.", why: "t = 33 × ln(9/5) = 33 × 0.588 = 19.4 s." },
        `<p class="aside">Book slip: the discharge time 5τ = 5(1 kΩ)(33 µF) is 0.165 s = 165 ms. The book writes "165 ms = 0.165 ms = 0.000165 s", which is wrong by a factor of 1000.</p>`,
      ]},
      { k: "learn", title: "Light links and a light-beam alarm", b: [
        `<p><b>Fiber optics:</b> TTL data switches a JFET on and off (for example 0 V and −5 V on a JFET with V<sub>P</sub> = −4 V), which switches an LED in its drain. At the far end a photodiode turns the light back into a current, and a second JFET amplifies it. The JFET's isolation and fast switching suit both ends.</p>`,
        `<p><b>MOSFET relay driver:</b> a photoconductive cell (about 200 kΩ dark, under 1 kΩ in bright light) sits in a divider that sets a depletion MOSFET's gate. An IR beam keeps the cell's resistance low, so V<sub>G</sub> is low. Break the beam: the cell's resistance jumps, V<sub>G</sub> rises, the MOSFET conducts hard and pulls in a relay. A diode across the relay coil protects against the coil's kick (Chapter 2).</p>`,
        { t: "num", q: "Divider: 120 kΩ from 6 V to the gate, the cell from gate to ground. Beam on, cell = 8 kΩ. V_G?", a: 0.375, unit: "V", tol: 0.01, hint: "6 × R_cell/(120k + R_cell).", why: "6 × 8/128 = 0.375 V." },
        { t: "num", q: "Beam broken, cell = 150 kΩ. V_G?", a: 3.333, unit: "V", tol: 0.01, hint: "Same divider.", why: "6 × 150/270 = 3.33 V: enough to drive the MOSFET hard." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is a JFET better than a BJT for the RC timer?", model: "The JFET's gate draws essentially no current, so it doesn't load the capacitor: the timing depends only on R and C. A BJT's base would draw current and present only a few kilohms, changing the time constant and how far the capacitor can charge. The JFET also turns off over a few volts of V_GS, while a BJT switches within about 0.7 V, which is harder to control." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edc7", eyebrow: "Boylestad · Chapter 7", title: "FET Biasing",
    intro: `<p>Twelve parts: finding a FET's operating point by crossing its transfer curve with the circuit's bias line. Fixed bias, self-bias, voltage divider, common gate, depletion and enhancement MOSFETs, mixed BJT–FET circuits, design, troubleshooting, p-channel devices, the universal bias curve and real uses.</p><p>It runs parallel to Chapter 4. The big difference: the FET's law is a square, so the book solves graphically.</p><p class="aside">The "Computer Analysis" section isn't covered. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's problems in the book. They test whether the ideas stuck, so don't expect them to look like the examples here.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12],
    summary: `
      <h3>Always</h3>
      <div class="eq">I<sub>G</sub> ≅ 0    I<sub>D</sub> = I<sub>S</sub>    JFET/depletion: I<sub>D</sub> = I<sub>DSS</sub>(1 − V<sub>GS</sub>/V<sub>P</sub>)²    enhancement: I<sub>D</sub> = k(V<sub>GS</sub> − V<sub>GS(Th)</sub>)²</div>
      <p>Draw the device curve and the circuit's bias line on the I<sub>D</sub>–V<sub>GS</sub> plane; the Q-point is the crossing.</p>
      <h3>Bias lines</h3>
      <div class="eq">Fixed: V<sub>GS</sub> = −V<sub>GG</sub>    Self: V<sub>GS</sub> = −I<sub>D</sub>R<sub>S</sub>    Divider: V<sub>G</sub> = R<sub>2</sub>V<sub>DD</sub>/(R<sub>1</sub> + R<sub>2</sub>), V<sub>GS</sub> = V<sub>G</sub> − I<sub>D</sub>R<sub>S</sub></div>
      <div class="eq">Common gate: V<sub>GS</sub> = V<sub>SS</sub> − I<sub>D</sub>R<sub>S</sub>    V<sub>GS</sub> = 0: I<sub>DQ</sub> = I<sub>DSS</sub>    Enhancement feedback: V<sub>GS</sub> = V<sub>DS</sub> = V<sub>DD</sub> − I<sub>D</sub>R<sub>D</sub></div>
      <h3>Then</h3>
      <div class="eq">V<sub>DS</sub> = V<sub>DD</sub> − I<sub>D</sub>(R<sub>D</sub> + R<sub>S</sub>)    V<sub>D</sub> = V<sub>DD</sub> − I<sub>D</sub>R<sub>D</sub>    V<sub>S</sub> = I<sub>D</sub>R<sub>S</sub>    Common gate: V<sub>DS</sub> = V<sub>DD</sub> + V<sub>SS</sub> − I<sub>D</sub>(R<sub>D</sub> + R<sub>S</sub>)</div>
      <div class="eq">k = I<sub>D(on)</sub>/(V<sub>GS(on)</sub> − V<sub>GS(Th)</sub>)²    Shockley backwards: V<sub>GS</sub> = V<sub>P</sub>(1 − √(I<sub>D</sub>/I<sub>DSS</sub>))</div>
      <h3>Universal curve</h3>
      <div class="eq">m = |V<sub>P</sub>|/(I<sub>DSS</sub>R<sub>S</sub>)    M = m·V<sub>G</sub>/|V<sub>P</sub>|    I<sub>DQ</sub> = (I<sub>D</sub>/I<sub>DSS</sub>)·I<sub>DSS</sub>, V<sub>GSQ</sub> = (V<sub>GS</sub>/|V<sub>P</sub>|)·|V<sub>P</sub>|</div>
      <h3>Design and checks</h3>
      <p>R = V<sub>R</sub>/I<sub>R</sub>; start near V<sub>P</sub>/2 or I<sub>DSS</sub>/2. Healthy JFET stage: V<sub>GS</sub> a few volts negative, V<sub>DS</sub> 25–75% of V<sub>DD</sub>. p-channel: solve as n-channel, then reverse all polarities.</p>
      <h3>Applications</h3>
      <div class="eq">Voltage-controlled resistor: R<sub>DS</sub> = R<sub>o</sub>/(1 − V<sub>GS</sub>/V<sub>P</sub>)²    noninverting gain 1 + R<sub>f</sub>/R<sub>DS</sub></div>`,
  };
  Course.start(window.CHAPTER);
})();
