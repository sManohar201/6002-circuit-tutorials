(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;

  /* log-axis helpers (x or y given in decades) */
  const sup = (n) => String(n).replace(/-/g, "⁻").replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);
  const p10 = (v) => "10" + sup(v);
  const ints = (a, b) => { const r = []; for (let k = Math.ceil(a); k <= Math.floor(b); k++) r.push(k); return r; };
  function loglog(o) {
    return plot({
      w: o.w || 520, h: o.h || 260, x: o.x, y: o.y, xt: ints(o.x[0], o.x[1]), yt: ints(o.y[0], o.y[1]), xtf: p10, ytf: p10, xl: o.xl, yl: o.yl,
      series: o.series.map((se) => ({ f: (lx) => Math.log10(se.f(Math.pow(10, lx))), cls: se.cls, n: se.n || 400 })),
      marks: (o.marks || []).map((m) => Object.assign({}, m, { x: Math.log10(m.x), y: Math.log10(m.y) })), label: o.label,
    });
  }
  const clip = (v, m = 12) => Math.max(-m, Math.min(m, v));

  /* op amp triangle: left edge x, centre y. Inputs at (x, y−20) and (x, y+20), output at (x+72, y). Inverting input on top unless flip. */
  const oa = (x, y, o = {}) => `<polygon class="el" points="${x},${y - 42} ${x},${y + 42} ${x + 72},${y}"/>` +
    S.t(x + 13, y - 14, o.flip ? "+" : "−", { cls: "big" }) + S.t(x + 13, y + 27, o.flip ? "−" : "+", { cls: "big" });

  function portsFig() {
    let s = oa(140, 100) + S.wire([176, 79], [176, 45]) + S.t(176, 36, "+V_S") + S.wire([176, 121], [176, 155]) + S.t(176, 174, "−V_S");
    s += S.wire([90, 80], [140, 80]) + S.wire([90, 120], [140, 120]) + S.dot(90, 80) + S.dot(90, 120) + S.t(80, 85, "v₋", { a: "end" }) + S.t(80, 125, "v₊", { a: "end" });
    s += S.wire([212, 100], [262, 100]) + S.dot(262, 100) + S.t(270, 105, "v_o", { a: "start" });
    s += S.t(40, 104, "input", { cls: "s m", a: "middle" }) + S.t(300, 130, "output", { cls: "s m" }) + S.t(250, 40, "power", { cls: "s m" });
    return S.svg(340, 185, s, { label: "Op amp symbol with its input, output and two power supply ports" });
  }
  function modelFig() {
    let s = S.wire([40, 60], [90, 60]) + S.wire([40, 140], [90, 140]) + S.dot(40, 60) + S.dot(40, 140) + S.t(32, 65, "v₊", { a: "end" }) + S.t(32, 145, "v₋", { a: "end" });
    s += S.t(96, 65, "i₊ = 0", { a: "start", cls: "s a" }) + S.t(96, 145, "i₋ = 0", { a: "start", cls: "s a" });
    s += S.dep(250, 100, "A(v₊ − v₋)", { kind: "v", side: "left" }) + S.wire([250, 78], [250, 40], [320, 40]) + S.dot(320, 40) + S.t(326, 45, "v_o", { a: "start" }) + S.wire([250, 122], [250, 150]) + S.gnd(250, 150);
    return S.svg(370, 190, s, { label: "Op amp model: two input terminals that draw no current, and a voltage-controlled voltage source at the output" });
  }
  function nonInvFig(o = {}) {
    let s = oa(160, 100, { flip: true });
    s += S.wire([70, 122], [70, 80], [160, 80]) + S.vsrc(70, 140, "v_i", { side: "left" }) + S.wire([70, 158], [70, 240], [140, 240]) + S.gnd(105, 240);
    s += S.wire([232, 100], [330, 100]) + S.dot(280, 100) + S.dot(330, 100) + S.t(338, 105, "v_o", { a: "start" });
    s += S.wire([280, 100], [280, 180]) + S.res(280, 180, 140, 180, o.R1 || "R₁", { cls: o.hl ? "hl" : "", tcls: o.hl ? "a" : "" }) + S.dot(140, 180) + S.wire([140, 180], [140, 120], [160, 120]);
    s += S.res(140, 180, 140, 240, o.R2 || "R₂", { side: "left", cls: o.hl ? "hl" : "", tcls: o.hl ? "a" : "" });
    s += S.t(128, 74, "v₊", { a: "end", cls: "s m" }) + S.t(132, 112, "v₋", { a: "end", cls: "s m" });
    if (o.hl) s += S.t(210, 222, "feedback", { cls: "s a" });
    return S.svg(380, 275, s, { max: 380, label: "Non-inverting amplifier: input to the plus terminal, divider from output back to the minus terminal" });
  }
  /* inverting topology; input element and feedback element can be R or C */
  function invFig(o = {}) {
    const el1 = o.inC ? S.cap(70, 90, 140, 90, o.inL || "C") : S.res(70, 90, 140, 90, o.inL || "R_a");
    const el2 = o.fbC ? S.cap(155, 35, 300, 35, o.fbL || "C") : S.res(155, 35, 300, 35, o.fbL || "R_b");
    let s = oa(180, 110) + S.vsrc(50, 150, "v_i", { side: "left" }) + S.wire([50, 132], [50, 90], [70, 90]) + el1 + S.wire([140, 90], [180, 90]) + S.dot(155, 90);
    s += S.wire([155, 90], [155, 35]) + el2 + S.wire([300, 35], [300, 110]) + S.wire([252, 110], [340, 110]) + S.dot(300, 110) + S.dot(340, 110);
    s += S.wire([180, 130], [160, 130], [160, 170]) + S.gnd(160, 170) + S.wire([50, 168], [50, 176]) + S.gnd(50, 176);
    s += S.t(150, 112, o.vm || "v₋", { a: "end", cls: o.vm ? "s a" : "s m" }) + S.t(346, 115, o.vo || "v_o", { a: "start", cls: o.vo ? "a" : "" });
    if (o.ia) s += S.arrow(84, 56, 126, 56, "", {}) + S.t(78, 60, o.ia, { a: "end", cls: "s c" });
    if (o.ib) s += S.arrow(314, 48, 314, 92, "", {}) + S.t(322, 76, o.ib, { a: "start", cls: "s c" });
    return S.svg(470, 210, s, { max: 470, label: o.label || "Inverting amplifier: input through one element to the minus terminal, feedback element from output to minus, plus grounded" });
  }
  function followerFig() {
    let s = oa(160, 100, { flip: true }) + S.vsrc(70, 140, "v_i", { side: "left" }) + S.wire([70, 122], [70, 80], [160, 80]);
    s += S.wire([232, 100], [320, 100]) + S.dot(270, 100) + S.wire([270, 100], [270, 165], [140, 165], [140, 120], [160, 120]);
    s += S.res(320, 100, 320, 225, "R_L") + S.wire([70, 158], [70, 225], [320, 225]) + S.gnd(195, 225) + S.t(328, 92, "v_o", { a: "start" });
    return S.svg(380, 260, s, { max: 380, label: "Voltage follower: output wired straight back to the minus input, driving a load resistor" });
  }
  function adderFig() {
    let s = oa(200, 120) + S.dot(40, 60) + S.dot(40, 100) + S.t(32, 65, "v₁", { a: "end" }) + S.t(32, 105, "v₂", { a: "end" });
    s += S.res(40, 60, 130, 60, "R₁") + S.wire([130, 60], [160, 60], [160, 100]) + S.res(40, 100, 130, 100, "R₂", { side: "below" }) + S.wire([130, 100], [200, 100]) + S.dot(160, 100) + S.dot(178, 100);
    s += S.wire([178, 100], [178, 25]) + S.res(178, 25, 320, 25, "R₃") + S.wire([320, 25], [320, 120]) + S.wire([272, 120], [350, 120]) + S.dot(320, 120) + S.t(356, 125, "v_o", { a: "start" });
    s += S.wire([200, 140], [182, 140], [182, 175]) + S.gnd(182, 175);
    return S.svg(400, 210, `<g transform="translate(0,12)">${s}</g>`, { max: 400, label: "Adder: two inputs through their own resistors into the minus terminal, one feedback resistor" });
  }
  function subFig() {
    let s = oa(220, 120) + S.dot(40, 100) + S.dot(40, 140) + S.t(32, 105, "v₁", { a: "end" }) + S.t(32, 145, "v₂", { a: "end" });
    s += S.res(40, 100, 140, 100, "R₁") + S.wire([140, 100], [220, 100]) + S.dot(170, 100) + S.wire([170, 100], [170, 35]) + S.res(170, 35, 330, 35, "R₂") + S.wire([330, 35], [330, 120]);
    s += S.wire([292, 120], [360, 120]) + S.dot(330, 120) + S.t(366, 125, "v_o", { a: "start" });
    s += S.res(40, 140, 140, 140, "R₃", { side: "below" }) + S.wire([140, 140], [220, 140]) + S.dot(185, 140) + S.res(185, 140, 185, 220, "R₄", { side: "right" }) + S.gnd(185, 220);
    return S.svg(410, 255, `<g transform="translate(0,6)">${s}</g>`, { max: 410, label: "Subtracter: v1 into the minus side like an inverting amp, v2 through a divider R3, R4 into the plus side" });
  }
  function curSrcFig() {
    let s = oa(160, 100, { flip: true }) + S.vsrc(70, 140, "v_i", { side: "left" }) + S.wire([70, 122], [70, 80], [160, 80]);
    s += S.wire([232, 100], [300, 100]) + S.res(300, 100, 300, 180, "R_L", { side: "left" }) + S.arrow(330, 118, 330, 162, "") + S.t(340, 146, "i_L", { a: "start", cls: "s c" });
    s += S.dot(300, 180) + S.wire([300, 180], [140, 180], [140, 120], [160, 120]) + S.dot(220, 180) + S.res(220, 180, 220, 250, "R_s", { side: "right" });
    s += S.wire([70, 158], [70, 250], [220, 250]) + S.gnd(145, 250) + S.t(150, 140, "v₋", { a: "end", cls: "s m" });
    return S.svg(380, 285, s, { max: 380, label: "Op amp current source: the load sits inside the feedback loop, and Rs senses the load current" });
  }
  function filterFig() {
    let s = oa(260, 140) + S.vsrc(40, 175, "v_i", { side: "right" }) + S.wire([40, 157], [40, 120], [60, 120]) + S.res(60, 120, 130, 120, "R₁") + S.wire([130, 120], [150, 120]);
    s += S.dot(150, 120) + S.cap(150, 120, 225, 120, "C₁", { side: "below" }) + S.wire([225, 120], [260, 120]) + S.dot(240, 120);
    s += S.wire([150, 120], [150, 35]) + S.cap(150, 35, 380, 35, "C₂") + S.wire([380, 35], [380, 140]);
    s += S.wire([240, 120], [240, 80]) + S.res(240, 80, 380, 80, "R₂") + S.dot(380, 80) + S.wire([332, 140], [410, 140]) + S.dot(380, 140) + S.t(414, 145, "v_o", { a: "start" });
    s += S.wire([260, 160], [245, 160], [245, 195]) + S.gnd(245, 195) + S.wire([40, 193], [40, 200]) + S.gnd(40, 200) + S.t(140, 108, "v₁", { a: "end", cls: "s m" });
    return S.svg(450, 240, `<g transform="translate(0,12)">${s}</g>`, { max: 450, label: "RC active filter: R1 into node v1; C1 from v1 to the minus input; C2 from v1 to the output; R2 from minus input to output" });
  }
  function compFig() {
    let s = oa(170, 110) + S.vsrc(60, 130, "v_i", { side: "left" }) + S.wire([60, 112], [60, 90], [170, 90]);
    s += S.wire([242, 110], [330, 110]) + S.dot(290, 110) + S.dot(330, 110) + S.t(336, 115, "v_O", { a: "start" }) + S.wire([290, 110], [290, 170]);
    s += S.res(290, 170, 150, 170, "R₂", { cls: "hl", tcls: "a" }) + S.dot(150, 170) + S.wire([150, 170], [150, 130], [170, 130]) + S.res(150, 170, 150, 230, "R₁", { side: "left" });
    s += S.wire([60, 148], [60, 230], [150, 230]) + S.gnd(105, 230) + S.t(142, 152, "v₊", { a: "end", cls: "s m" });
    return S.svg(380, 265, s, { max: 380, label: "Positive feedback: input to the minus terminal, divider from output back to the plus terminal" });
  }
  function oscFig() {
    let s = oa(190, 120) + S.wire([150, 100], [190, 100]) + S.dot(150, 100) + S.wire([150, 100], [150, 40]) + S.res(150, 40, 300, 40, "R₃") + S.wire([300, 40], [300, 120]);
    s += S.wire([262, 120], [370, 120]) + S.dot(300, 120) + S.dot(330, 120) + S.dot(370, 120) + S.t(376, 125, "v_O", { a: "start" });
    s += S.wire([150, 100], [90, 100]) + S.cap(90, 100, 90, 250, "C", { side: "left" }) + S.t(66, 204, "v_C", { a: "end", cls: "s m" });
    s += S.wire([190, 140], [170, 140], [170, 190]) + S.dot(170, 190) + S.wire([330, 120], [330, 190]) + S.res(330, 190, 170, 190, "R₂") + S.res(170, 190, 170, 250, "R₁", { side: "right" });
    s += S.wire([90, 250], [170, 250]) + S.gnd(130, 250);
    return S.svg(420, 285, s, { max: 420, label: "RC oscillator: R3 and C from output to minus input and ground; R2 and R1 divider from output to plus input" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Meet the op amp", mins: 20,
    blurb: "A huge-gain amplifier with two inputs, and the simple model we'll use.",
    takeaway: "An op amp amplifies the difference v₊ − v₋ by a huge, unreliable gain A (10⁵ or more), and saturates near its supply voltages. Model: v_o = A(v₊ − v₋), i₊ = i₋ = 0, output resistance 0. Tiny input power controls large output power.",
    steps: [
      { k: "learn", title: "What it is", b: [
        fig(portsFig()),
        `<p>An <b>operational amplifier</b> ("op amp") is a whole multi-transistor amplifier on one chip, packaged as one symbol. Inside: Chapter 7's differential pair, more gain stages and an output buffer. You won't design one; you'll <b>use</b> one.</p>`,
        `<ul><li><b>Input port</b>: two terminals, v₊ and v₋. Only their <b>difference</b> matters.</li><li><b>Output port</b>: v<sub>o</sub>, measured from ground.</li><li><b>Power ports</b>: +V<sub>S</sub> and −V<sub>S</sub> (say ±12 V). Usually not drawn, but always there.</li></ul>`,
      ]},
      { k: "play", title: "The measured curve", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let A = 2e5;
          function draw() {
            f.innerHTML = plot({ x: [-100, 100], y: [-14, 14], xt: [-100, -50, 0, 50, 100], yt: [-12, -6, 0, 6, 12], xl: "v₊ − v₋ (µV)", yl: "v_o (V)", series: [{ f: (x) => clip(A * x * 1e-6), cls: "s1", n: 800 }], label: "Op amp output versus input difference" });
            ro.innerHTML = readout([["gain A", fmt(A, 3)], ["linear only for |v₊ − v₋| <", fmt(12e6 / A, 3) + " µV"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "Open-loop gain A", min: 2e4, max: 1e6, log: true, value: A, show: (x) => fmt(x, 3) }, (x) => { A = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Note the x axis is in <b>micro</b>volts. Two chips of the same type can have very different A, and A drifts with temperature. Slide it: the steep middle part changes a lot, the ±12 V flat parts don't.</p>`,
      ]},
      { k: "check", title: "How small is small?", b: [
        { t: "num", q: "A = 400,000, supplies ±12 V. Largest |v₊ − v₋| before the output saturates?", a: 30, unit: "µV", why: "12 V / 400,000 = 30 µV. Any bigger and the output is pinned at a rail." },
      ]},
      { k: "learn", title: "The model", b: [
        fig(modelFig()),
        `<div class="eq">v<sub>o</sub> = A (v₊ − v₋)     i₊ = i₋ = 0     output resistance = 0</div>`,
        `<p>A <b>voltage-controlled voltage source</b> (Chapter 7's diamond). The input wires go nowhere: they draw <b>no current</b>, so input resistance is infinite.</p>`,
        `<p class="aside">This model ignores saturation. We'll stay in the steep middle part until Part 8.</p>`,
      ]},
      { k: "why", title: "Why not KCL on the whole chip?", b: [
        `<p>KCL on the op amp says: i₊ + i₋ + (two supply currents) + i<sub>o</sub> = 0. Since i₊, i₋ ≈ 0, the output current comes from the supplies.</p>`,
        { t: "mcq", q: "That's true. Why doesn't it help you find v_o?", opts: [["A voltage source can supply any current, so knowing the current tells you nothing about the voltage", true, "Supply currents matter for power dissipation, not for finding voltages. That's why we leave the supplies out of the model."], ["Because the supply currents are zero", false, "They're not zero; they carry the output current."], ["Because KCL doesn't apply inside chips", false, "KCL always applies under the lumped abstraction."]] },
      ]},
      { k: "check", title: "Control is cheap", b: [
        `<p>An input source at 1 V supplies 100 nA into the op amp. The output delivers 10 mA at 10 V to a load.</p>`,
        { t: "num", q: "Output power ÷ input power = ?", a: 1e6, tol: 0.02, why: "Output 0.1 W, input 10⁻⁷ W: a power gain of a million. The extra power comes from the supplies." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe the op amp model in your own words. What does it ignore?", model: "The output is a voltage source equal to A times the difference between the plus and minus inputs, where A is huge. The inputs draw no current and the output has no resistance. It ignores saturation at the supply rails, temperature drift and the fact that A varies from chip to chip." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Non-inverting amp: negative feedback", mins: 25,
    blurb: "Trade most of the gain for a gain you can trust.",
    takeaway: "Feed a fraction β = R₂/(R₁+R₂) of the output back to v₋. Then G = v_o/v_i = A/(1 + Aβ). When the loop gain Aβ ≫ 1, G ≈ 1/β = (R₁+R₂)/R₂: set by resistors, not by the unreliable A. That's negative feedback.",
    steps: [
      { k: "learn", title: "Add two resistors", b: [
        fig(nonInvFig({ hl: true })),
        `<p>The input goes to <b>v₊</b>. A divider takes a fraction of the output and brings it <b>back</b> to v₋. The op amp compares the input with that fed-back copy of the output.</p>`,
        `<p>This is <b>negative feedback</b>: some output is brought back and compared with the input.</p>`,
      ]},
      { k: "math", title: "Three equations", b: [
        `<p>Replace the op amp by its model and write one equation per node:</p>`,
        `<div class="eq">v₊ = v<sub>i</sub>      v₋ = β v<sub>o</sub>, β = R₂/(R₁+R₂)      v<sub>o</sub> = A(v₊ − v₋)</div>`,
        `<p class="aside">v₋ is a plain divider because i₋ = 0: no current leaks off the middle node.</p>`,
        { t: "reveal", label: "Solve it", html: `<div class="eq">v<sub>o</sub> = A(v<sub>i</sub> − βv<sub>o</sub>)  →  v<sub>o</sub>(1 + Aβ) = A v<sub>i</sub>  →  G = v<sub>o</sub>/v<sub>i</sub> = A / (1 + Aβ)</div>` },
      ]},
      { k: "play", title: "Gain versus A", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let k = 9;
          function draw() {
            const b = 1 / (1 + k), G = (A) => A / (1 + A * b), A0 = 2e5;
            f.innerHTML = loglog({ x: [0, 7], y: [0, 4], xl: "op amp gain A", yl: "G = v_o/v_i", series: [{ f: () => 1 + k, cls: "s5" }, { f: G, cls: "s1" }], marks: [{ x: A0, y: G(A0) }], label: "Closed-loop gain versus op amp gain" });
            ro.innerHTML = readout([["R₁/R₂", fmt(k, 3)], ["ideal 1 + R₁/R₂", fmt(1 + k, 4)], ["actual G at A = 2×10⁵", fmt(G(A0), 5)], ["loop gain Aβ", fmt(A0 * b, 3)], ["shortfall", fmt((100 * (1 + k - G(A0))) / (1 + k), 2) + " %"]]);
          }
          host.append(f, slider({ id: id + "-k", label: "R₁ / R₂", min: 1, max: 1e5, log: true, value: k, show: (x) => fmt(x, 3) }, (x) => { k = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Dashed: the resistor-only gain 1 + R₁/R₂. The curve follows A at first, then flattens onto the dashed line once Aβ is big. The dot is a typical A. Push R₁/R₂ very high and watch the dot fall off the line.</p>`,
      ]},
      { k: "learn", title: "The big result", b: [
        `<div class="key">If Aβ ≫ 1:  G ≈ 1/β = (R₁ + R₂)/R₂</div>`,
        `<p><b>A has disappeared.</b> Resistors are stable and cheap; A is not. So the circuit gain is now reliable.</p>`,
        `<p>The price: you threw away most of the gain (from 10⁵ down to, say, 10).</p>`,
        `<p><b>Loop gain</b> = Aβ: what a signal gets multiplied by going once around the loop (×A through the op amp, ×β back through the divider).</p>`,
      ]},
      { k: "whatif", title: "What if you get greedy?", b: [
        { t: "mcq", q: "A = 2×10⁵. You want G = 10⁶ and pick R₁/R₂ ≈ 10⁶. What do you actually get?", opts: [["Less than A: about 1.7×10⁵. The loop gain is only 0.2, so the formula 1/β doesn't apply", true, "Aβ = 2×10⁵ × 10⁻⁶ = 0.2, not ≫ 1. G = A/(1.2). You can never get more than A, and the gain is unreliable again."], ["10⁶, as designed", false, "Feedback can only reduce gain. G = A/(1 + Aβ) < A."], ["Zero", false, "Plug in: 2×10⁵/(1 + 0.2)."]] },
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>Non-inverting amp: R₁ = 39 kΩ, R₂ = 1 kΩ.</p>`,
        { t: "num", q: "Ideal gain G?", a: 40, why: "(39 + 1)/1 = 40." },
        { t: "num", q: "v_i = 0.1 V. v_o?", a: 4, unit: "V", why: "40 × 0.1 = 4 V, well inside ±12 V." },
        { t: "num", q: "With A = 10⁵ exactly, what is G?", a: 39.984, tol: 0.0005, hint: "β = 1/40.", why: "10⁵/(1 + 10⁵/40) = 10⁵/2501 ≈ 39.984: only 0.04% short." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the non-inverting amplifier's gain reliable even though A isn't?", model: "The output is fed back through a divider and compared with the input. Because A is huge, the op amp only needs a tiny input difference, so the fed-back voltage almost equals the input: βv_o ≈ v_i. So the gain is about 1/β, set by the resistor ratio. A only matters through the small correction 1/(1 + loop gain)." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "The inverting amplifier", mins: 20,
    blurb: "Ground v₊, feed back to v₋, and get −R_b/R_a.",
    takeaway: "Inverting amp: v₊ = 0, input through R_a, feedback through R_b. Exact: v_o = −[A·R_b/(R_a+R_b)]v_i / [1 + A·R_a/(R_a+R_b)]. For large loop gain, v_o ≈ −(R_b/R_a)v_i. The v₋ node sits within microvolts of ground. Never zero a dependent source in superposition.",
    steps: [
      { k: "learn", title: "The circuit", b: [
        fig(invFig()),
        `<p>v₊ is grounded. The input goes through R<sub>a</sub> to v₋, and R<sub>b</sub> feeds the output back to v₋. Feedback still goes to the <b>minus</b> input, so it's still negative feedback.</p>`,
      ]},
      { k: "math", title: "Same three-equation method", b: [
        `<div class="eq">v₊ = 0      (v<sub>i</sub> − v₋)/R<sub>a</sub> + (v<sub>o</sub> − v₋)/R<sub>b</sub> = 0      v<sub>o</sub> = A(v₊ − v₋)</div>`,
        { t: "reveal", label: "Result", html: `<div class="eq">v<sub>o</sub> = − [A R<sub>b</sub>/(R<sub>a</sub>+R<sub>b</sub>)] v<sub>i</sub> / [1 + A R<sub>a</sub>/(R<sub>a</sub>+R<sub>b</sub>)]</div><p>Loop gain here is A·R<sub>a</sub>/(R<sub>a</sub>+R<sub>b</sub>). When it's ≫ 1:</p><div class="key">v<sub>o</sub> ≈ −(R<sub>b</sub>/R<sub>a</sub>) v<sub>i</sub></div>` },
        `<p>Inverted (the minus sign), and set only by a resistor ratio. Learn this one and the non-inverting one by heart, like the voltage divider.</p>`,
      ]},
      { k: "play", title: "Watch v₋", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const Ra = 2000, Rb = 20000;
          let vi = 0.5, A = 1e5;
          function draw() {
            const vm = (vi * Rb / (Ra + Rb)) / (1 + A * Ra / (Ra + Rb)), vo = -A * vm;
            const vmTxt = Math.abs(vm) < 1e-3 ? fmt(vm * 1e6, 3) + " µV" : fmt(vm * 1e3, 3) + " mV";
            f.innerHTML = invFig({ vm: "v₋ = " + vmTxt, vo: "v_o = " + fmt(vo, 4) + " V", ia: "i_a", ib: "i_b" });
            ro.innerHTML = readout([["i_a through R_a (2 kΩ)", fmt((vi - vm) / Ra * 1e3, 4) + " mA"], ["i_b through R_b (20 kΩ)", fmt((vm - vo) / Rb * 1e3, 4) + " mA"], ["ideal −(R_b/R_a)v_i", fmt(-10 * vi, 4) + " V"]]);
          }
          host.append(f, toggle(["A = 100", "A = 10⁵"], (k) => { A = k ? 1e5 : 100; draw(); }, 1), slider({ id: id + "-v", label: "v_i", min: -1, max: 1, step: 0.01, value: vi, show: (x) => fmt(x) + " V" }, (x) => { vi = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">With A = 10⁵, v₋ stays microvolts from ground whatever v<sub>i</sub> is, and the current in R<sub>a</sub> all flows on through R<sub>b</sub>. Switch to a weak A = 100: v₋ wanders and the gain falls short of −10.</p>`,
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<p>A student finds v₋ by superposition: "First turn off v<sub>i</sub>. Then turn off the source A(v₊ − v₋) and add the two answers."</p>`,
        { t: "mcq", q: "What's wrong?", opts: [["A dependent source's value is set by another voltage in the circuit; you can't switch it off independently", true, "Only independent sources get zeroed in superposition. Leave dependent sources in every sub-circuit."], ["Nothing: superposition works for any linear circuit", false, "It does, but only for independent sources."], ["You should turn off v₊ instead", false, "v₊ is a node voltage, not a source."]] },
      ]},
      { k: "learn", title: "One-input amplifiers work too", b: [
        `<p>Swap the op amp for a <b>single-input</b> inverting amplifier with gain −A (no v₊, input draws no current), in the same R₁–R₂ loop. Node method at the middle node, plus v<sub>OUT</sub> = −A v<sub>MID</sub>:</p>`,
        `<div class="eq">v<sub>OUT</sub>/v<sub>IN</sub> = −A(R₂/R₁) / (A + 1 + R₂/R₁)  →  −R₂/R₁ as A → ∞</div>`,
        `<p class="aside">Same answer as the op amp version. The trick is the feedback loop, not the second input.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "Inverting amp, R_a = 5 kΩ, R_b = 15 kΩ, v_i = 0.4 V. v_o?", a: -1.2, unit: "V", why: "−(15/5) × 0.4 = −1.2 V." },
        { t: "num", q: "Single-input version: R₁ = 2 kΩ, R₂ = 50 kΩ, A = 10⁴. |v_OUT/v_IN| = ?", a: 24.935, tol: 0.001, why: "10⁴ × 25 / (10⁴ + 26) ≈ 24.94. Close to the ideal 25, slightly short because A isn't infinite." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does v₋ sit almost exactly at 0 V in the inverting amp?", model: "v₊ is grounded, and the output is A times (0 − v₋). For a sensible output of a few volts with A of 10⁵, v₋ only needs to be tens of microvolts. If v₋ drifted up, the output would swing hugely negative and pull it back down through R_b. The feedback holds v₋ at virtually ground." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Sensitivity and the follower", mins: 20,
    blurb: "How much does A still matter? And why a gain of 1 is useful.",
    takeaway: "dG/G = (dA/A) / (1 + loop gain): feedback shrinks gain errors by the same factor it shrinks the gain. The voltage follower (output tied to v₋) has G ≈ 1, draws almost no input current and can drive heavy loads: it buffers one circuit from another.",
    steps: [
      { k: "math", title: "How sensitive is G to A?", b: [
        `<p>Differentiate G = A/(1 + Aβ) with respect to A, then divide by G:</p>`,
        `<div class="key">dG/G = [1 / (1 + Aβ)] · dA/A</div>`,
        `<p>A 10% change in A becomes a 10%/(1 + loop gain) change in G. The feedback cut the gain by (1 + loop gain), and it cuts the sensitivity by the <b>same</b> factor.</p>`,
        `<p class="aside">Same idea runs a home thermostat, cruise control and anti-lock brakes: measure the output, compare, correct.</p>`,
      ]},
      { k: "play", title: "Let A drift", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const b = 0.1;
          let A = 1e4;
          function draw() {
            const G = (a) => a / (1 + a * b), drop = 100 * (1 - G(0.7 * A) / G(A));
            f.innerHTML = plot({ x: [1, 6], y: [0, 32], xt: [1, 2, 3, 4, 5, 6], yt: [0, 10, 20, 30], xtf: p10, xl: "A before the drift", yl: "% drop in G", series: [{ f: () => 30, cls: "s5" }, { f: (lx) => 100 * (1 - G(0.7 * Math.pow(10, lx)) / G(Math.pow(10, lx))), cls: "s1" }], marks: [{ x: Math.log10(A), y: drop }], label: "Percent drop in closed-loop gain when A falls 30 percent" });
            ro.innerHTML = readout([["G before", fmt(G(A), 5)], ["G after A falls 30%", fmt(G(0.7 * A), 5)], ["G fell by", fmt(drop, 3) + " %"], ["1 + loop gain", fmt(1 + A * b, 3)]]);
          }
          host.append(f, slider({ id: id + "-a", label: "Op amp gain A", min: 10, max: 1e6, log: true, value: A, show: (x) => fmt(x, 3) }, (x) => { A = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">β = 0.1 (target gain 10). A drops by 30% (a hot day). Dashed: what a 30% drop would do without feedback.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "A = 10⁵, β = 0.01. A falls by 20%. Roughly what % does G change?", a: 0.02, tol: 0.05, unit: "%", why: "Loop gain 1000, so 20%/1001 ≈ 0.02%." },
      ]},
      { k: "learn", title: "The voltage follower", b: [
        fig(followerFig()),
        `<p>The non-inverting amp with R₁ = 0 and R₂ = ∞: the whole output goes back (β = 1).</p>`,
        `<div class="key">v<sub>o</sub> ≈ v<sub>i</sub></div>`,
        `<p>A gain of one. So why not just use a wire?</p>`,
      ]},
      { k: "play", title: "Wire vs follower", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const Vs = 2, Rs = 50e3, Imax = 0.01;
          let RL = 10e3;
          const wire = (r) => (Vs * r) / (r + Rs), fol = (r) => Math.min(Vs, Imax * r);
          function draw() {
            f.innerHTML = plot({ x: [2, 7], y: [0, 2.2], xt: [2, 3, 4, 5, 6, 7], yt: [0, 0.5, 1, 1.5, 2], xtf: p10, xl: "R_L (Ω)", yl: "voltage at load (V)", series: [{ f: (lx) => wire(Math.pow(10, lx)), cls: "s2" }, { f: (lx) => fol(Math.pow(10, lx)), cls: "s1" }], marks: [{ x: Math.log10(RL), y: wire(RL), cls: "mk2" }, { x: Math.log10(RL), y: fol(RL) }], label: "Load voltage with a plain wire and with a follower" });
            ro.innerHTML = readout([["wire: v at load", fmt(wire(RL), 3) + " V"], ["follower: v at load", fmt(fol(RL), 3) + " V"], ["current from sensor, wire", si(Vs / (RL + Rs), "A")], ["current from sensor, follower", "≈ 0"]]);
          }
          host.append(f, slider({ id: id + "-r", label: "Load R_L", min: 100, max: 1e7, log: true, value: RL, show: (x) => si(x, "Ω") }, (x) => { RL = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">A sensor: 2 V behind 50 kΩ of internal resistance. Blue: wired straight to the load. Orange: through a follower that can supply up to 10 mA. Below 200 Ω even the follower runs out of current.</p>`,
      ]},
      { k: "check", title: "What buffering means", b: [
        { t: "mcq", q: "Which is the real job of the follower?", opts: [["Isolation: the load can change wildly without changing the input current or the output voltage", true, "The source sees an almost open circuit; the load sees an almost ideal voltage source. Power gain comes from the supplies."], ["Voltage gain", false, "Its voltage gain is 1."], ["Lowering the output voltage to protect the load", false, "v_o ≈ v_i."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain why a follower is better than a wire for connecting a weak sensor to a heavy load.", model: "With a wire, the load current flows through the sensor's internal resistance and drops voltage, so the load sees much less than the sensor voltage. The follower draws almost no current from the sensor, so there's no drop, and it supplies the load current from its own power supplies while holding the output equal to the input." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "The shortcut: v₊ ≈ v₋", mins: 25,
    blurb: "Assume the input difference is zero from the start, and every circuit gets easy.",
    takeaway: "With negative feedback and no saturation, use three constraints from the start: i₊ ≈ 0, i₋ ≈ 0 and v₊ ≈ v₋ (the virtual short). Then KCL at v₋ gives the answer in a line or two. Adder: v_o = −(R₃/R₁ v₁ + R₃/R₂ v₂). Subtracter (R₃ = R₁, R₄ = R₂): v_o = (R₂/R₁)(v₂ − v₁).",
    steps: [
      { k: "learn", title: "Why the difference is tiny", b: [
        `<p>|v<sub>o</sub>| can't exceed ~12 V. A ≥ 10⁵. So in the linear region:</p>`,
        `<div class="eq">|v₊ − v₋| = |v<sub>o</sub>|/A ≤ 120 µV</div>`,
        `<p>Microvolts, next to inputs and outputs of volts. So treat it as zero from the start:</p>`,
        `<div class="key">i₊ ≈ 0     i₋ ≈ 0     v₊ ≈ v₋</div>`,
        `<p>Not exactly zero (the output needs <i>something</i> to amplify), just tiny. Called the <b>virtual short</b> (or "virtual ground" when v₊ is grounded).</p>`,
      ]},
      { k: "learn", title: "Redo both amps in two lines", b: [
        `<p><b>Inverting:</b> v₊ = 0 so v₋ ≈ 0. KCL at v₋: v<sub>i</sub>/R<sub>a</sub> + v<sub>o</sub>/R<sub>b</sub> ≈ 0 → v<sub>o</sub> ≈ −(R<sub>b</sub>/R<sub>a</sub>)v<sub>i</sub>.</p>`,
        `<p><b>Non-inverting:</b> v₋ ≈ v₊ = v<sub>i</sub>, and v₋ = v<sub>o</sub>R₂/(R₁+R₂) → v<sub>o</sub> ≈ (R₁+R₂)/R₂ · v<sub>i</sub>.</p>`,
        `<p class="aside">Same answers as Parts 2–3, with no A anywhere.</p>`,
      ]},
      { k: "check", title: "When is it allowed?", b: [
        { t: "sort", q: "Can you use v₊ ≈ v₋ here?", bins: ["Use it", "Don't"], items: [
          ["Inverting amp, output at −3 V", 0, "Negative feedback, linear region."],
          ["Non-inverting amp whose output is stuck at +12 V", 1, "Saturated: the output can't move to hold v₊ ≈ v₋, so the difference can be volts."],
          ["Output fed back only to the v₊ input", 1, "Positive feedback. Nothing pulls the difference to zero (Part 9)."],
          ["Voltage follower driving 1 kΩ at 2 V", 0, "Negative feedback, within limits."],
          ["Op amp with no feedback at all, comparing two voltages", 1, "No feedback means nothing forces the inputs together; the output just slams to a rail."],
        ]},
      ]},
      { k: "play", title: "Adder", b: [
        fig(adderFig()),
        (host, id) => {
          const ro = el(`<div></div>`);
          const R1 = 10e3, R2 = 20e3, R3 = 20e3;
          let v1 = 1, v2 = 1;
          function draw() {
            const i1 = v1 / R1, i2 = v2 / R2, ideal = -R3 * (i1 + i2), sat = Math.abs(ideal) > 12;
            ro.innerHTML = readout([["i₁ = v₁/R₁", fmt(i1 * 1e3, 3) + " mA"], ["i₂ = v₂/R₂", fmt(i2 * 1e3, 3) + " mA"], ["i₃ = i₁ + i₂", fmt((i1 + i2) * 1e3, 3) + " mA"], ["v_o", sat ? (ideal > 0 ? "+12 V (saturated!)" : "−12 V (saturated!)") : fmt(ideal, 3) + " V"]]);
          }
          host.append(slider({ id: id + "-1", label: "v₁", min: -5, max: 5, step: 0.1, value: v1, show: (x) => fmt(x) + " V" }, (x) => { v1 = x; draw(); }).el, slider({ id: id + "-2", label: "v₂", min: -5, max: 5, step: 0.1, value: v2, show: (x) => fmt(x) + " V" }, (x) => { v2 = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">R₁ = 10 kΩ, R₂ = 20 kΩ, R₃ = 20 kΩ. v₋ ≈ 0, so each input pushes its own current v/R into the node, independently; both currents leave through R₃. No current from v₂ flows back through R₁. Push both inputs to 5 V and see where the shortcut stops being true.</p>`,
      ]},
      { k: "check", title: "Adder formula", b: [
        { t: "mcq", q: "With v₋ ≈ 0, KCL at v₋ gives v₁/R₁ + v₂/R₂ + v_o/R₃ ≈ 0. So v_o = ?", opts: [["−(R₃/R₁ · v₁ + R₃/R₂ · v₂)", true, "A weighted sum, inverted. Equal resistors give −(v₁ + v₂)."], ["(R₁ + R₂)/R₃ · (v₁ + v₂)", false, "Solve the KCL line for v_o."], ["−R₃(v₁ + v₂)/(R₁ + R₂)", false, "Each input has its own weight R₃/R."]] },
      ]},
      { k: "math", title: "Subtracter by superposition", b: [
        fig(subFig()),
        `<p>Superposition on the two <b>independent</b> inputs (the op amp model stays in both):</p>`,
        `<ul><li><b>v₂ = 0:</b> no current in R₃, R₄, so v₊ = 0: an inverting amp. v<sub>oa</sub> = −(R₂/R₁)v₁.</li><li><b>v₁ = 0:</b> divider gives v₊ = v₂R₄/(R₃+R₄); then a non-inverting amp. v<sub>ob</sub> = (R₁+R₂)/R₁ · R₄/(R₃+R₄) · v₂.</li></ul>`,
        { t: "reveal", label: "Pick R₃ = R₁, R₄ = R₂", html: `<p>The v₂ weight becomes (R₁+R₂)/R₁ · R₂/(R₁+R₂) = R₂/R₁. So</p><div class="key">v<sub>o</sub> = (R₂/R₁)(v₂ − v₁)</div>` },
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "Subtracter, R₁ = R₃ = 10 kΩ, R₂ = R₄ = 40 kΩ, v₂ = 1.25 V, v₁ = 1.00 V. v_o?", a: 1, unit: "V", why: "4 × (1.25 − 1.00) = 1 V. The 1 V both inputs share is ignored: only the difference is amplified." },
        { t: "num", q: "Adder above (R₁ = 10k, R₂ = R₃ = 20k), v₁ = 0.5 V, v₂ = −3 V. v_o?", a: 2, unit: "V", why: "−(2 × 0.5 + 1 × (−3)) = −(1 − 3) = +2 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "State the three op amp constraints you can use with negative feedback, and why the voltage one is reasonable.", model: "No current into either input, and v₊ approximately equal to v₋. The voltage constraint holds because the output is limited to about ±12 V and A is 10⁵ or more, so the input difference is at most around a hundred microvolts. Feedback adjusts the output to keep it that small. It fails if the op amp saturates or the feedback is positive." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Input and output resistance", mins: 25,
    blurb: "Feedback changes what a circuit looks like from outside.",
    takeaway: "Feedback that samples the output voltage divides the op amp's output resistance by (1 + loop gain): a near-ideal voltage source. Inverting input resistance ≈ R_s (v₋ is a virtual ground). Non-inverting input resistance ≈ r_i × loop gain: huge. Feeding back the load current makes a current source: R_o ≈ (1+A)R_s. Rule: common node → low R; series loop → high R.",
    steps: [
      { k: "learn", title: "A slightly better model", b: [
        `<p>The ideal model has zero output resistance and infinite input resistance, so it can't show what feedback does to them. Add:</p>`,
        `<ul><li>r<sub>t</sub>: output resistance in series with the dependent source (~1 kΩ for a real op amp alone).</li><li>r<sub>i</sub>: resistance between v₊ and v₋ (very large).</li></ul>`,
        `<p>Then find Thévenin resistances the usual way: zero the <b>independent</b> sources, apply a test source, find v<sub>t</sub>/i<sub>t</sub>. <b>Don't zero the dependent source.</b></p>`,
      ]},
      { k: "learn", title: "Output resistance", b: [
        `<p>Inverting amp (input resistor R<sub>s</sub>, feedback R<sub>f</sub>), with the node method and r<sub>i</sub> → ∞:</p>`,
        `<div class="eq">R<sub>o</sub> ≈ r<sub>t</sub> / [1 + A R<sub>s</sub>/(R<sub>s</sub>+R<sub>f</sub>)]</div>`,
        `<p>The bracket is 1 + loop gain again. Physically: load the output and it starts to sag; the sag is fed back, amplified by A, and cancelled.</p>`,
        `<div class="key">Feedback sampling output voltage: R<sub>o</sub> = r<sub>t</sub> / (1 + loop gain)</div>`,
        `<p class="aside">The non-inverting amp gives the same form, with loop gain AR₂/(R₁+R₂).</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "r_t = 500 Ω, A = 10⁵, R_s = 10 kΩ, R_f = 40 kΩ. Output resistance?", a: 0.025, tol: 0.02, unit: "Ω", why: "Loop gain = 10⁵ × 10/50 = 2×10⁴. 500/20001 ≈ 0.025 Ω." },
      ]},
      { k: "learn", title: "Input resistance", b: [
        `<p><b>Inverting:</b> looking into v₋, a test voltage v<sub>t</sub> makes the output swing to −Av<sub>t</sub>, so a big current flows through R<sub>f</sub>. Big current for tiny voltage = tiny resistance, about (R<sub>f</sub> + r<sub>t</sub>)/A. The whole input therefore looks like</p>`,
        `<div class="eq">R<sub>in</sub> ≈ R<sub>s</sub> + (R<sub>f</sub>+r<sub>t</sub>)/A ≈ R<sub>s</sub></div>`,
        `<p><b>Non-inverting:</b> the output drags v₋ along to almost equal v<sub>t</sub>, so almost no voltage is across r<sub>i</sub> and almost no current flows.</p>`,
        `<div class="eq">R<sub>in</sub> ≈ r<sub>i</sub> · AR₂/(R₁ + r<sub>t</sub> + R₂)   (r<sub>i</sub> × loop gain: enormous)</div>`,
      ]},
      { k: "check", title: "Pick the topology", b: [
        { t: "mcq", q: "You need gain 5 from a sensor with 1 MΩ internal resistance. Which connection?", opts: [["Non-inverting: its input resistance is enormous, so the sensor isn't loaded", true, "The inverting amp's input resistance is just R_s; with a 1 MΩ source that would form a divider and wreck the gain."], ["Inverting with R_s = 1 kΩ", false, "The 1 MΩ source into 1 kΩ: you'd lose 99.9% of the signal."], ["Either, they behave the same", false, "Their input resistances differ by many orders of magnitude."]] },
      ]},
      { k: "play", title: "An op amp current source", b: [
        fig(curSrcFig()),
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const vi = 1, Rs = 1000;
          let RL = 2000;
          const iCs = (r) => Math.min(vi / Rs, 12 / (r + Rs)) * 1e3, iNi = (r) => Math.min(2 / r, 0.01) * 1e3;
          function draw() {
            f.innerHTML = plot({ x: [1, 5], y: [0, 4], xt: [1, 2, 3, 4, 5], yt: [0, 1, 2, 3, 4], xtf: p10, xl: "R_L (Ω)", yl: "i_L (mA)", series: [{ f: (lx) => iNi(Math.pow(10, lx)), cls: "s2" }, { f: (lx) => iCs(Math.pow(10, lx)), cls: "s1" }], marks: [{ x: Math.log10(RL), y: iCs(RL) }], label: "Load current versus load resistance" });
            const vo = (iCs(RL) / 1e3) * (RL + Rs);
            ro.innerHTML = readout([["i_L (current-source connection)", fmt(iCs(RL), 3) + " mA"], ["op amp output v_o", vo >= 11.99 ? "12 V (saturated!)" : fmt(vo, 3) + " V"]]);
          }
          host.append(f, slider({ id: id + "-r", label: "Load R_L", min: 10, max: 1e5, log: true, value: RL, show: (x) => si(x, "Ω") }, (x) => { RL = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">v<sub>i</sub> = 1 V, R<sub>s</sub> = 1 kΩ. Orange: the load is <b>inside</b> the loop; v₋ ≈ v<sub>i</sub> forces i<sub>L</sub> = v<sub>i</sub>/R<sub>s</sub> = 1 mA whatever R<sub>L</sub> is. Blue (for contrast): a gain-2 non-inverting amp driving the same load: fixed voltage, so the current changes. Where does orange stop being flat, and why?</p>`,
      ]},
      { k: "learn", title: "The general rule", b: [
        `<p>Current-source connection with a test source in place of R<sub>L</sub>: R<sub>o</sub> = (1 + A)R<sub>s</sub> + r<sub>o</sub>. Megohms or more.</p>`,
        `<div class="tbl"><table><tbody>
          <tr><td>op amp, load and feedback share a <b>node</b> (feedback senses voltage)</td><td>output R very <b>low</b>: a voltage source</td></tr>
          <tr><td>op amp, load and feedback in a <b>series loop</b> (feedback senses current)</td><td>output R very <b>high</b>: a current source</td></tr></tbody></table></div>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the inverting amplifier have such a low resistance looking into v₋, and what does that make the whole input look like?", model: "Any tiny voltage at v₋ gets multiplied by −A at the output, so a large current flows through the feedback resistor, and it must come from the input. A big current for a tiny voltage is a tiny resistance, about R_f/A. So v₋ is a virtual ground and the whole input just looks like R_s to ground." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Op amps with capacitors", mins: 25,
    blurb: "Integrators, differentiators, and a resonator with no inductor.",
    takeaway: "Integrator (R in, C feedback): v_o = −(1/RC)∫v_i dt, accurate because its real time constant is (1+A)RC. Differentiator (C in, R feedback): v_o = −RC dv_i/dt. RC active filter: second-order like an RLC, with ω₀ = √(g₁g₂/C₁C₂) and bandwidth g₂(C₁+C₂)/C₁C₂, and no inductor.",
    steps: [
      { k: "learn", title: "The integrator", b: [
        fig(invFig({ fbC: true, inL: "R", fbL: "C" })),
        `<p>The inverting amp with C in the feedback path. v₋ ≈ 0, so the input current v<sub>i</sub>/R all flows into the capacitor:</p>`,
        `<div class="eq">v<sub>i</sub>/R + C dv<sub>o</sub>/dt ≈ 0   →   v<sub>o</sub> ≈ −(1/RC) ∫ v<sub>i</sub> dt</div>`,
        `<p class="aside">Chapter 10's plain RC only integrated short pulses. Here v₋ never moves, so the capacitor current always equals v<sub>i</sub>/R.</p>`,
      ]},
      { k: "learn", title: "The differentiator", b: [
        fig(invFig({ inC: true, inL: "C", fbL: "R" })),
        `<p>Swap R and C. The capacitor current is C dv<sub>i</sub>/dt (v₋ ≈ 0), and it all goes through R:</p>`,
        `<div class="eq">v<sub>o</sub> = −RC dv<sub>i</sub>/dt</div>`,
      ]},
      { k: "play", title: "Integrate or differentiate", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const P = 2e-3, w = (2 * Math.PI) / P, k = 8, T = 4e-3, N = 1600;
          let mode = 0, wave = 0, RC = 0.5e-3;
          const sq = (t) => Math.tanh(k * Math.sin(w * t)), dsq = (t) => { const c = Math.cosh(k * Math.sin(w * t)); return (k * w * Math.cos(w * t)) / (c * c); };
          const tri = (t) => { const u = ((t / P) % 1 + 1) % 1; return 1 - 4 * Math.abs(u - 0.5) + 0; }, dtri = (t) => { const u = ((t / P) % 1 + 1) % 1; return u < 0.5 ? 4 / P : -4 / P; };
          function draw() {
            const vi = wave ? (t) => -tri(t) : sq, dvi = wave ? (t) => -dtri(t) : dsq, dt = T / N;
            const pin = [], pout = [];
            let acc = 0;
            for (let n = 0; n <= N; n++) {
              const t = n * dt;
              pin.push([t * 1e3, vi(t)]);
              pout.push([t * 1e3, clip(mode ? -RC * dvi(t) : -acc / RC)]);
              acc += vi(t + dt / 2) * dt;
            }
            f.innerHTML = plot({ x: [0, 4], y: [-13, 13], xt: [0, 1, 2, 3, 4], yt: [-12, -6, 0, 6, 12], xl: "t (ms)", yl: "v (V)", series: [{ pts: pin, cls: "s2" }, { pts: pout, cls: "s1" }], label: "Input and output waveforms" });
            ro.innerHTML = readout([["RC", fmt(RC * 1e3, 3) + " ms"], ["blue", "input v_i"], ["orange", "output v_o (clipped at ±12 V)"]]);
          }
          host.append(f, toggle(["Integrator", "Differentiator"], (j) => { mode = j; draw(); }, 0), toggle(["Square in", "Triangle in"], (j) => { wave = j; draw(); }, 0),
            slider({ id: id + "-rc", label: "RC", min: 0.05e-3, max: 2e-3, log: true, value: RC, show: (x) => fmt(x * 1e3, 3) + " ms" }, (x) => { RC = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">±1 V inputs, period 2 ms. Predict the output shape <b>before</b> you flip each toggle. The differentiator turns each fast edge into a spike: handy for detecting transitions.</p>`,
      ]},
      { k: "math", title: "Why the integrator is so good", b: [
        `<p>Don't assume v₋ ≈ 0; use v<sub>o</sub> = −Av₋ in KCL at v₋:</p>`,
        `<div class="eq">(1 + A)RC dv₋/dt + v₋ = v<sub>i</sub></div>`,
        `<p>A first-order circuit with time constant <b>(1 + A)RC</b>. The op amp multiplies the capacitor's effect by its gain (the <b>Miller effect</b>).</p>`,
        `<p>A step of size V really gives v<sub>o</sub> = −AV(1 − e<sup>−t/(1+A)RC</sup>): an exponential heading for −AV over days. Its first few seconds are a near-perfect ramp.</p>`,
        { t: "num", q: "RC = 0.5 s, A = 2×10⁵. Effective time constant in hours?", a: 27.8, tol: 0.02, unit: "h", why: "(1 + 2×10⁵) × 0.5 s ≈ 10⁵ s ≈ 27.8 hours. Anything lasting a minute is a 'short pulse' to it." },
      ]},
      { k: "learn", title: "A resonator without an inductor", b: [
        fig(filterFig()),
        `<p>KCL at v₁ and at v₋ (≈ 0), with impedances 1/sC₁ and 1/sC₂ (g = 1/R):</p>`,
        `<div class="eq">V<sub>o</sub>/V<sub>i</sub> = −s(g₁/C₂) / [ s² + s·g₂(C₁+C₂)/(C₁C₂) + g₁g₂/(C₁C₂) ]</div>`,
        `<p>Chapter 14's band-pass form (plus a minus sign):</p>`,
        `<div class="eq">ω₀ = √(g₁g₂/(C₁C₂))     bandwidth = g₂(C₁+C₂)/(C₁C₂)</div>`,
        `<p><b>Why bother?</b> Inductors are hard to build on a chip and poor at low frequencies. An op amp with R's and C's acts like an RLC, and adds power gain.</p>`,
      ]},
      { k: "play", title: "Tune the active filter", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const C = 10e-9;
          let R1 = 1e3, R2 = 100e3;
          function draw() {
            const g1 = 1 / R1, g2 = 1 / R2, w0 = Math.sqrt((g1 * g2) / (C * C)), bw = (g2 * 2 * C) / (C * C);
            const H = (w) => (w * g1 / C) / Math.hypot(w0 * w0 - w * w, w * bw);
            f.innerHTML = loglog({ x: [2, 6], y: [-3, 3], xl: "ω (rad/s)", yl: "|V_o/V_i|", series: [{ f: H, cls: "s1" }], marks: [{ x: w0, y: H(w0) }], label: "Active filter magnitude response" });
            ro.innerHTML = readout([["ω₀", fmt(w0, 3) + " rad/s"], ["bandwidth", fmt(bw, 3) + " rad/s"], ["Q = ω₀/bandwidth", fmt(w0 / bw, 3)], ["peak gain", fmt(H(w0), 3)]]);
          }
          host.append(f, slider({ id: id + "-1", label: "R₁", min: 200, max: 20e3, log: true, value: R1, show: (x) => si(x, "Ω") }, (x) => { R1 = x; draw(); }).el, slider({ id: id + "-2", label: "R₂", min: 2e3, max: 2e6, log: true, value: R2, show: (x) => si(x, "Ω") }, (x) => { R2 = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">C₁ = C₂ = 10 nF. Which resistor mainly sets the bandwidth? Which moves the peak without changing its width?</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>Active filter: C₁ = C₂ = 10 nF, R₁ = 1 kΩ, R₂ = 100 kΩ.</p>`,
        { t: "num", q: "ω₀ = ?", a: 1e4, unit: "rad/s", why: "√(g₁g₂)/C = √(10⁻³ × 10⁻⁵)/10⁻⁸ = 10⁻⁴/10⁻⁸ = 10⁴ rad/s." },
        { t: "num", q: "Q = ω₀ / bandwidth = ?", a: 5, why: "Bandwidth = g₂ × 2C/C² = 2g₂/C = 2×10⁻⁵/10⁻⁸ = 2000 rad/s. Q = 10⁴/2000 = 5." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does putting a capacitor in the op amp's feedback path give a good integrator?", model: "The feedback holds v₋ at virtual ground, so the input resistor's current is exactly v_i/R no matter what the output is doing. That current has nowhere to go but the capacitor, so the capacitor voltage, which is minus the output, is the integral of v_i divided by RC. Looked at exactly, the effective time constant is (1+A)RC, so it stays linear for a very long time." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  function simInt(V, T1, RC, T, N) {
    const dt = T / N, out = [];
    let vC = 0, mode = 0;
    for (let n = 0; n <= N; n++) {
      const t = n * dt, vi = t < T1 ? V : -V;
      let vo, vm;
      if (mode === 0) { vo = -vC; vm = 0; if (vo < -12) mode = -1; else if (vo > 12) mode = 1; }
      if (mode !== 0) { vo = 12 * mode; vm = vo + vC; }
      out.push([t, vi, vm, vo]);
      vC += (dt * (vi - vm)) / RC;
      if ((mode === -1 && -12 + vC <= 0) || (mode === 1 && 12 + vC >= 0)) mode = 0;
    }
    return out;
  }
  const p8 = {
    id: "p8", title: "Saturation", mins: 20,
    blurb: "When the output hits a rail, the rules change.",
    takeaway: "If the output would have to exceed the supplies, it saturates: model the output as a fixed ±12 V source. Then v₊ ≈ v₋ no longer holds and the dependent-source model is gone. A saturated integrator becomes a plain series RC; it stops integrating, and recovers only after v₋ returns to 0, which adds a delay.",
    steps: [
      { k: "learn", title: "Two new models", b: [
        `<p>The output can't go beyond the supplies. When the linear answer would need more than +12 V, the output gets stuck near +12 V (and likewise −12 V).</p>`,
        `<ul><li><b>Positive saturation</b>: output ≈ a +12 V battery to ground.</li><li><b>Negative saturation</b>: output ≈ a −12 V battery.</li></ul>`,
        `<p>In saturation, <b>v₊ ≈ v₋ is false</b>. The inputs can differ by volts, and the output doesn't care.</p>`,
      ]},
      { k: "check", title: "Will it saturate?", b: [
        { t: "num", q: "Non-inverting amp, gain 6, supplies ±12 V. Largest input magnitude before clipping?", a: 2, unit: "V", why: "12/6 = 2 V. Put in 3 V and the output sits at +12 V, not 18 V." },
      ]},
      { k: "play", title: "Integrator hits the rail", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const RC = 10e-3, T = 0.24;
          let V = 2, T1 = 0.08;
          function draw() {
            const sim = simInt(V, T1, RC, T, 4800).filter((p, k) => k % 4 === 0);
            const satIn = sim.find((p) => p[3] <= -11.999), rec = sim.find((p) => p[0] > T1 && p[3] > -11.999);
            f.innerHTML = plot({ x: [0, 240], y: [-13, 13], xt: [0, 60, 120, 180, 240], yt: [-12, -6, 0, 6, 12], xl: "t (ms)", yl: "v (V)", series: [{ pts: sim.map((p) => [p[0] * 1e3, p[1]]), cls: "s5" }, { pts: sim.map((p) => [p[0] * 1e3, p[2]]), cls: "s2" }, { pts: sim.map((p) => [p[0] * 1e3, p[3]]), cls: "s1" }], label: "Integrator output, minus-input voltage and input with saturation" });
            ro.innerHTML = readout([["hits −12 V at", satIn ? fmt(satIn[0] * 1e3, 3) + " ms" : "never"], ["input flips at", fmt(T1 * 1e3, 3) + " ms"], ["leaves the rail at", satIn && rec ? fmt(rec[0] * 1e3, 3) + " ms" : "—"], ["dashed / blue / orange", "v_i / v₋ / v_o"]]);
          }
          host.append(f, slider({ id: id + "-v", label: "Input step V", min: 0.5, max: 4, step: 0.1, value: V, show: (x) => fmt(x) + " V" }, (x) => { V = x; draw(); }).el,
            slider({ id: id + "-t", label: "Input flips to −V at", min: 0.02, max: 0.14, step: 0.002, value: T1, show: (x) => fmt(x * 1e3, 3) + " ms" }, (x) => { T1 = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">R = 10 kΩ, C = 1 µF (RC = 10 ms). Watch v₋ (blue): zero while the circuit integrates, climbing once the output is stuck. After the input flips, the output stays stuck until v₋ falls back to 0.</p>`,
      ]},
      { k: "why", title: "What happens while it's stuck", b: [
        `<p>With the output a −12 V battery, the circuit is just v<sub>i</sub>, R, C and a battery in series: a Chapter 10 RC circuit.</p>`,
        `<div class="eq">v₋ = V(1 − e<sup>−t/RC</sup>)   (t from the moment of saturating)</div>`,
        `<p class="aside">A fixed battery in series doesn't change the transient shape; just add it back at the end.</p>`,
        `<p>After the input flips to −V, v₋ = −V + (stuff)·e<sup>−t/RC</sup>. The op amp stays saturated until v₋ decays back through 0. Only then does integration resume.</p>`,
        { t: "mcq", q: "So saturation costs the integrator…", opts: [["Truncated integration, plus a recovery delay after the input reverses", true, "Both effects show on the plot: the flat stretch, and the gap before the ramp starts back up."], ["Nothing, as long as the input reverses eventually", false, "Look at the gap between the flip and the ramp restarting."], ["Permanent damage", false, "Saturation is normal behaviour, just not linear."]] },
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "Integrator RC = 10 ms, starts at 0, input steps to +2 V. When does v_o hit −12 V?", a: 60, unit: "ms", why: "Slope = −2/RC = −0.2 V/ms. 12/0.2 = 60 ms. Compare the plot." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't you use v₊ ≈ v₋ when the op amp is saturated?", model: "That constraint comes from the output adjusting itself to keep the input difference tiny. In saturation the output is pinned at a supply rail and can't adjust any more, so nothing forces v₊ and v₋ together. You model the output as a fixed battery and analyse the rest of the circuit normally." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Positive feedback", mins: 25,
    blurb: "Feed back to v₊ and get memory, snapping and oscillation.",
    takeaway: "Feedback to v₊ is positive: it enhances the nonlinearity instead of suppressing it. The output snaps between ±V_S with hysteresis; thresholds ±V_S·R₁/(R₁+R₂). Add an RC to the v₋ side and it oscillates: a square wave with period T = 2R₃C·ln(1 + 2R₁/R₂).",
    steps: [
      { k: "learn", title: "Feedback to the wrong input", b: [
        fig(compFig()),
        `<p>Now the divider feeds the output back to <b>v₊</b>. If the output rises a bit, v₊ rises, the difference grows, and the output rises more: <b>regeneration</b>. It runs until the output slams into a rail.</p>`,
        `<p>With the output at +12 V, v₊ = +12·R₁/(R₁+R₂). To flip it, v<sub>i</sub> (on v₋) must climb past that.</p>`,
      ]},
      { k: "play", title: "Sweep the input slowly", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let vi = -8, vo = 12, k = 1;
          function draw() {
            const th = (12 * 1) / (1 + k);
            if (vo > 0 && vi > th) vo = -12; else if (vo < 0 && vi < -th) vo = 12;
            const loop = [[-14, 12], [th, 12], [th, -12], [14, -12]], loop2 = [[14, -12], [-th, -12], [-th, 12], [-14, 12]];
            f.innerHTML = plot({ x: [-14, 14], y: [-14, 17], xt: [-12, -6, 0, 6, 12], yt: [-12, -6, 0, 6, 12], xl: "v_i (V)", yl: "v_O (V)", series: [{ pts: loop, cls: "s5" }, { pts: loop2, cls: "s5" }], marks: [{ x: vi, y: vo }], label: "Hysteresis loop of the positive feedback circuit" });
            ro.innerHTML = readout([["thresholds", "±" + fmt(th, 3) + " V"], ["v_O", (vo > 0 ? "+" : "−") + "12 V"], ["v₊ = v_O·R₁/(R₁+R₂)", fmt(vo / (1 + k), 3) + " V"]]);
          }
          host.append(f, slider({ id: id + "-v", label: "v_i", min: -13, max: 13, step: 0.1, value: vi, show: (x) => fmt(x) + " V" }, (x) => { vi = x; draw(); }).el,
            slider({ id: id + "-k", label: "R₂ / R₁", min: 0.2, max: 10, log: true, value: k, show: (x) => fmt(x, 3) }, (x) => { k = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Drag v<sub>i</sub> up past the threshold, then back down. The output doesn't flip back at the same place: the circuit <b>remembers</b>. With R₂ = R₁ the thresholds are ±6 V. The R₂/R₁ slider sets the width.</p>`,
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<p>A student analyses this circuit with v₊ ≈ v₋: "v₊ = v<sub>O</sub>/2 and v₋ = v<sub>i</sub>, so v<sub>O</sub> = 2v<sub>i</sub>. It's an amplifier with gain 2."</p>`,
        { t: "mcq", q: "What's wrong?", opts: [["v₊ ≈ v₋ needs negative feedback. Here any small difference grows until the output saturates, so the output is ±12 V, not 2v_i", true, "The 'gain 2' solution is an unstable balance point, like a pencil on its tip. Always check where the feedback goes before using the shortcut."], ["The gain should be 1/2", false, "The problem isn't the arithmetic."], ["The sign: it should be −2", false, "The problem is using the constraint at all."]] },
      ]},
      { k: "learn", title: "Uses", b: [
        `<p><b>Comparator</b> with hysteresis: turns a slow, noisy analog signal into a clean two-level (digital) signal. Noise smaller than the hysteresis width can't make it chatter.</p>`,
        `<p>Add a capacitor and it becomes an <b>oscillator</b>.</p>`,
      ]},
      { k: "learn", title: "The RC oscillator", b: [
        fig(oscFig()),
        `<ol><li>Output at +V<sub>S</sub>, so v₊ = +βV<sub>S</sub>, β = R₁/(R₁+R₂). C charges toward +V<sub>S</sub> through R₃.</li><li>v<sub>C</sub> (= v₋) crosses +βV<sub>S</sub>: the difference goes negative and the output snaps to −V<sub>S</sub>. v₊ jumps to −βV<sub>S</sub>.</li><li>C now discharges toward −V<sub>S</sub> until it crosses −βV<sub>S</sub>: snap back. Repeat.</li></ol>`,
      ]},
      { k: "play", title: "Watch it oscillate", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const Vs = 12;
          let r = 1, tau = 1e-3;
          function draw() {
            const b = r / (1 + r), T = 10e-3, N = 6000, dt = T / N, vc = [], vo = [];
            let c = 0, o = Vs;
            for (let n = 0; n <= N; n++) {
              const t = n * dt * 1e3;
              vc.push([t, c]); vo.push([t, o]);
              c += (dt * (o - c)) / tau;
              if (o > 0 && c > b * Vs) o = -Vs; else if (o < 0 && c < -b * Vs) o = Vs;
            }
            const per = 2 * tau * Math.log(1 + 2 * r);
            f.innerHTML = plot({ x: [0, 10], y: [-13, 16], xt: [0, 2, 4, 6, 8, 10], yt: [-12, -6, 0, 6, 12], xl: "t (ms)", yl: "v (V)", series: [{ f: () => b * Vs, cls: "s5" }, { f: () => -b * Vs, cls: "s5" }, { pts: vo.filter((p, k) => k % 3 === 0), cls: "s1" }, { pts: vc.filter((p, k) => k % 3 === 0), cls: "s2" }], label: "Oscillator output and capacitor voltage" });
            ro.innerHTML = readout([["β = R₁/(R₁+R₂)", fmt(b, 3)], ["period 2R₃C·ln(1 + 2R₁/R₂)", fmt(per * 1e3, 3) + " ms"], ["frequency", fmt(1 / per, 3) + " Hz"]]);
          }
          host.append(f, slider({ id: id + "-r", label: "R₁ / R₂", min: 0.05, max: 5, log: true, value: r, show: (x) => fmt(x, 3) }, (x) => { r = x; draw(); }).el,
            slider({ id: id + "-c", label: "R₃C", min: 0.2e-3, max: 3e-3, log: true, value: tau, show: (x) => fmt(x * 1e3, 3) + " ms" }, (x) => { tau = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Orange: v<sub>O</sub> (square wave). Blue: v<sub>C</sub>. Dashed: the two thresholds ±βV<sub>S</sub>. The very first half-cycle is longer: why?</p>`,
      ]},
      { k: "math", title: "The period", b: [
        `<p>Half-cycle with output at −V<sub>S</sub>: v<sub>C</sub> starts at +βV<sub>S</sub> and heads for −V<sub>S</sub> (Chapter 10, final + (initial − final)e<sup>−t/τ</sup>):</p>`,
        `<div class="eq">v<sub>C</sub> = −V<sub>S</sub> + (β + 1)V<sub>S</sub> e<sup>−t/R₃C</sup></div>`,
        { t: "reveal", label: "Set v_C = −βV_S and solve", html: `<div class="eq">e<sup>−T<sub>low</sub>/R₃C</sup> = (1 − β)/(1 + β)  →  T<sub>low</sub> = R₃C ln[(1+β)/(1−β)] = R₃C ln(1 + 2R₁/R₂)</div><p>The high half is identical, so</p><div class="key">T = 2R₃C ln(1 + 2R₁/R₂)</div>` },
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "R₁ = R₂, R₃ = 10 kΩ, C = 0.1 µF. Period?", a: 2.197, tol: 0.01, unit: "ms", why: "2 × 1 ms × ln 3 ≈ 2.20 ms, about 455 Hz." },
        { t: "mcq", q: "You want twice the frequency without touching R₁, R₂. Change…", opts: [["Halve R₃ or halve C", true, "The period is proportional to R₃C."], ["Double the supply voltage", false, "V_S cancels out of the period: thresholds and targets scale together."], ["Swap the op amp inputs", false, "That makes it negative feedback: no oscillation."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Compare negative and positive feedback in one or two sentences each.", model: "Negative feedback (output back to v₋) opposes changes: it holds v₊ ≈ v₋, makes the circuit linear, stable and insensitive to A. Positive feedback (output back to v₊) reinforces changes: the output snaps to a rail, giving hysteresis, comparators and, with an RC, oscillators." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ch15", eyebrow: "Chapter 15", title: "The Operational Amplifier Abstraction",
    intro: `<p>Nine parts. A whole amplifier becomes one triangle: a dependent source with enormous gain. You'll see how negative feedback trades gain for reliability, learn the v₊ ≈ v₋ shortcut, build adders, current sources, integrators and an inductor-free resonator, then break the rules with saturation and positive feedback.</p><p class="aside">Uses dependent sources (Chapter 7), Thévenin (Chapter 3), RC transients (Chapter 10) and resonance (Chapter 14). Arrow keys ← → move between steps. Need a refresher? <a href="14-resonance.html">Chapter 14</a>.</p>`,
    after: `<p>Open the Chapter 15 PDF and go to the <b>exercises and problems</b> at the end. Before writing any equation, ask: is the feedback negative? Could the output be saturated? Only then decide whether v₊ ≈ v₋ is allowed.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9],
    summary: `
      <h3>The device</h3>
      <p>Two inputs (v₊, v₋), one output, two supplies (±V<sub>S</sub>). Model: v<sub>o</sub> = A(v₊ − v₋), A ≥ 10⁵ and unreliable; i₊ = i₋ = 0; output R = 0. Saturates near ±V<sub>S</sub>.</p>
      <h3>Negative feedback</h3>
      <div class="eq">G = A/(1 + Aβ) ≈ 1/β     dG/G = (dA/A)/(1 + loop gain)</div>
      <p>Non-inverting: (R₁+R₂)/R₂. Inverting: −R<sub>b</sub>/R<sub>a</sub>. Follower: 1 (a buffer).</p>
      <h3>Shortcut (negative feedback, not saturated)</h3>
      <div class="eq">i₊ ≈ i₋ ≈ 0     v₊ ≈ v₋</div>
      <p>Adder: −(R₃/R₁ v₁ + R₃/R₂ v₂). Subtracter (R₃ = R₁, R₄ = R₂): (R₂/R₁)(v₂ − v₁). Don't zero dependent sources in superposition.</p>
      <h3>Resistances</h3>
      <p>Voltage-sensing feedback: R<sub>o</sub> = r<sub>t</sub>/(1 + loop gain). Inverting R<sub>in</sub> ≈ R<sub>s</sub>; non-inverting R<sub>in</sub> ≈ r<sub>i</sub> × loop gain. Current source: i<sub>L</sub> = v<sub>i</sub>/R<sub>s</sub>, R<sub>o</sub> ≈ (1+A)R<sub>s</sub>.</p>
      <h3>With capacitors</h3>
      <p>Integrator −(1/RC)∫v<sub>i</sub>dt (true time constant (1+A)RC). Differentiator −RC dv<sub>i</sub>/dt. Active filter: ω₀ = √(g₁g₂/C₁C₂), bandwidth g₂(C₁+C₂)/C₁C₂.</p>
      <h3>Saturation and positive feedback</h3>
      <p>Saturated output = ±V<sub>S</sub> battery; v₊ ≈ v₋ false; integrators truncate and recover late. Positive feedback: hysteresis with thresholds ±V<sub>S</sub>R₁/(R₁+R₂); RC oscillator T = 2R₃C ln(1 + 2R₁/R₂).</p>`,
  };
  Course.start(window.CHAPTER);
})();
