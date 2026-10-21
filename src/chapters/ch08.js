(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;

  /* Same amplifier as Chapter 7: V_S = 12 V, R_L = 4 kΩ, K = 2 mA/V², V_T = 1 V (units: V, mA, kΩ, mS) */
  const VS = 12, RL = 4, K = 2, VT = 1;
  const big = (v) => (v < VT ? VS : VS - RL * (K / 2) * (v - VT) ** 2); // saturation formula (valid until v_O = v − V_T)
  const VMAX = VT + (-1 + Math.sqrt(1 + 2 * VS * RL * K)) / (RL * K);   // ≈ 2.611 V

  function amp(o = {}) {
    const s = S.supply(200, 40, "V_S") + S.res(200, 40, 200, 110, "R_L", { side: "right" }) + S.wire([200, 110], [300, 110]) + S.dot(200, 110) + S.t(306, 115, o.out || "v_O", { a: "start", cls: "a" }) + S.nmos(186, 150) + S.gnd(200, 190) +
      S.wire([156, 150], [80, 150], [80, 160]) + S.vsrc(80, 178, o.v1 || "v_i", { side: "left" }) + S.wire([80, 196], [80, 204]) + S.vsrc(80, 222, o.v2 || "V_I", { side: "left" }) + S.wire([80, 240], [80, 250], [140, 250]) + S.gnd(140, 250);
    return S.svg(400, 280, s, { max: 400, label: "MOSFET amplifier driven by a DC bias plus a small signal" });
  }
  function ssFig(extra = "") {
    const s = S.wire([70, 82], [70, 40], [150, 40]) + S.wire([70, 118], [70, 170], [300, 170]) + S.vsrc(70, 100, "v_i", { side: "right" }) + S.t(150, 32, "gate", { cls: "s m" }) + S.dot(150, 40) +
      S.wire([230, 78], [230, 40], [300, 40]) + S.wire([230, 122], [230, 170]) + S.dep(230, 100, "g_m·v_i", { side: "left", down: true }) + S.res(300, 40, 300, 170, "R_L", { side: "right" }) + S.dot(300, 40) + S.t(300, 28, "v_o", { cls: "a" }) + S.dot(230, 170) + extra;
    return S.svg(400, 200, s, { max: 400, label: "Small-signal circuit: v_i at the gate, a g_m·v_i current source pulling current down through R_L" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Small wiggles make it linear", mins: 20,
    blurb: "Zoom in on the curved transfer function until it's straight.",
    takeaway: "Keep the signal small and centered on an operating point, and the amplifier's response to it is linear: v_o = A·v_i. That's the small-signal discipline.",
    steps: [
      { k: "learn", title: "The problem with Chapter 7's amplifier", b: [
        `<div class="eq">v<sub>O</sub> = V<sub>S</sub> − (K/2)(v<sub>I</sub> − V<sub>T</sub>)²R<sub>L</sub></div>`,
        `<p>A parabola. Audio amplifiers need v<sub>o</sub> = A·v<sub>i</sub> with one fixed gain A. Is the MOSFET useless for that?</p>`,
        `<p>No. Real signals are usually a DC level plus a small wiggle. Chapter 4's insight: <b>zoom in far enough and any smooth curve looks straight</b>.</p>`,
      ]},
      { k: "play", title: "How small is small?", b: [
        `<p>Bias at V<sub>I</sub> = 1.8 V and add a sine wave. Orange: the real output. Blue dashed: the straight-line (tangent) prediction.</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 0.05;
          function draw() {
            const VI = 1.8, VO = big(VI), A = -RL * K * (VI - VT);
            const real = (t) => big(VI + a * Math.sin(2 * Math.PI * t)), lin = (t) => VO + A * a * Math.sin(2 * Math.PI * t);
            let err = 0; for (let k = 0; k < 100; k++) err = Math.max(err, Math.abs(real(k / 100) - lin(k / 100)));
            const span = Math.max(0.5, Math.abs(A) * a * 1.4 + 0.3);
            f.innerHTML = plot({ x: [0, 2], y: [VO - span, VO + span], xt: [0, 1, 2], yt: [VO - span, VO, VO + span].map((x) => +x.toFixed(2)), xl: "t", yl: "v_O (V)", series: [{ f: real, cls: "s1", n: 400 }, { f: lin, cls: "s5" }], label: "Real output and linear prediction" });
            ro.innerHTML = readout([["input amplitude", fmt(a * 1000) + " mV"], ["output amplitude (linear)", fmt(Math.abs(A) * a) + " V"], ["worst error", fmt(err * 1000) + " mV"], ["error / swing", fmt((err / (Math.abs(A) * a)) * 100, 2) + " %"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "Input sine amplitude", min: 0.01, max: 0.5, step: 0.01, value: a, show: (x) => fmt(x * 1000) + " mV" }, (x) => { a = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">At 10–50 mV the curves sit on top of each other. At a few hundred mV the output's top and bottom halves become unequal: distortion.</p>`,
      ]},
      { k: "learn", title: "Notation (again)", b: [
        `<div class="eq">v<sub>I</sub> = V<sub>I</sub> + v<sub>i</sub></div>`,
        `<p>Total (small letter, CAPITAL subscript) = operating point (ALL CAPS) + small signal (all small).</p>`,
        `<div class="key"><b>Small-signal discipline:</b> keep the signals small perturbations around an operating point, and the circuit's response to them is linear.</div>`,
      ]},
      { k: "why", title: "A trade-off in models", b: [
        { t: "mcq", q: "Chapter 7's large-signal model works over the whole range. The small-signal model only works near one point. Why want the limited one?", opts: [
          ["It's linear, so every linear tool (superposition, Thévenin, dividers) works on it, and it gives insight fast", true, "Accurate-but-complex and simple-but-limited models are both useful. Engineers switch between them."],
          ["It's more accurate", false, "It's less accurate, just much easier, and accurate enough for small signals."],
          ["It works for large signals too", false, "It doesn't: big swings show the curve's bend."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a nonlinear amplifier behave linearly for small signals?", model: "Near the operating point its transfer curve is almost a straight line, the tangent. A small input wiggle moves the operating point only along that nearly straight piece, so the output change is proportional to the input change, with the slope as the gain." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Transconductance and gain", mins: 20,
    blurb: "Taylor-expand the MOSFET current: i_d = g_m·v_gs.",
    takeaway: "For small signals a saturated MOSFET is a linear VCCS: i_d = g_m·v_gs with g_m = K(V_GS − V_T). The common-source gain is A = −g_m·R_L, set by the operating point.",
    steps: [
      { k: "math", title: "Expand the square", b: [
        `<div class="eq">i<sub>D</sub> = (K/2)(V<sub>I</sub> + v<sub>i</sub> − V<sub>T</sub>)²</div>`,
        { t: "reveal", label: "Multiply it out", html: `<div class="eq">= (K/2)(V<sub>I</sub> − V<sub>T</sub>)² + K(V<sub>I</sub> − V<sub>T</sub>)v<sub>i</sub> + (K/2)v<sub>i</sub>²</div><p>First term: the DC current I<sub>D</sub>. Second: proportional to v<sub>i</sub>. Third: tiny if v<sub>i</sub> is small, so drop it.</p>` },
        `<div class="key">i<sub>d</sub> = g<sub>m</sub>·v<sub>gs</sub>   with   <b>g<sub>m</sub> = K(V<sub>GS</sub> − V<sub>T</sub>)</b>  (the transconductance)</div>`,
      ]},
      { k: "check", title: "Compute g_m and the gain", b: [
        `<p>Our amplifier (K = 2 mA/V², V<sub>T</sub> = 1 V, R<sub>L</sub> = 4 kΩ), biased at V<sub>I</sub> = 1.8 V.</p>`,
        { t: "num", q: "g_m = ?", a: 1.6, unit: "mS", hint: "K(V_I − V_T) = 2 mA/V² × 0.8 V.", why: "1.6 mA/V = 1.6 mS." },
        { t: "num", q: "Small-signal gain v_o/v_i = ?", a: -6.4, hint: "v_o = −i_d·R_L = −g_m R_L v_i.", why: "−1.6 mS × 4 kΩ = −6.4." },
        { t: "num", q: "Check it as a slope: v_O = 12 − 4(v_I − 1)². Its derivative at 1.8 V?", a: -6.4, hint: "d/dv of −4(v − 1)² is −8(v − 1).", why: "−8 × 0.8 = −6.4. Same answer: the small-signal gain is just the slope of the transfer curve." },
      ]},
      { k: "learn", title: "Another way to write g_m", b: [
        `<p>Since I<sub>D</sub> = (K/2)(V<sub>GS</sub> − V<sub>T</sub>)², you can write g<sub>m</sub> = √(2K·I<sub>D</sub>).</p>`,
        { t: "num", q: "At V_I = 1.8 V, I_D = 0.64 mA. √(2K·I_D) = ?", a: 1.6, unit: "mS", why: "√(2 × 2 × 0.64) = √2.56 = 1.6 mS ✓. More bias current → more transconductance." },
      ]},
      { k: "learn", title: "It works for any smooth device", b: [
        `<div class="eq">Δy ≈ (dy/dx at the operating point) · Δx</div>`,
        `<p>A temperature sensor gives v<sub>S</sub> = B·t<sub>S</sub>³. Near room temperature T<sub>S</sub>, a small temperature change t<sub>s</sub> gives v<sub>s</sub> = 3B·T<sub>S</sub>²·t<sub>s</sub>: linear, with a slope set by where you operate.</p>`,
        { t: "num", q: "y = x³ around x = 2. Estimate the change in y for Δx = 0.01.", a: 0.12, tol: 0.02, hint: "dy/dx = 3x² = 12.", why: "12 × 0.01 = 0.12. (Exact: 2.01³ − 8 = 0.1206.)" },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is g_m in words, and why does it depend on the bias?", model: "g_m is how much the drain current changes per volt of change in gate voltage, the slope of the MOSFET's current-versus-gate-voltage curve at the operating point. That curve is a parabola, so its slope grows as the bias moves higher; more bias means a bigger g_m." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "The small-signal circuit", mins: 25,
    blurb: "Swap every part for its linearized twin. The wiring stays the same.",
    takeaway: "Find the operating point; replace each element by its small-signal model (DC V source → short, DC I source → open, R → R, saturated MOSFET → g_m·v_gs current source); keep the topology. Solve the linear circuit.",
    steps: [
      { k: "learn", title: "The recipe", b: [
        `<ol><li><b>Operating point:</b> sources at their DC values; solve the (possibly nonlinear) circuit.</li><li><b>Linearize each element</b> around its operating point.</li><li><b>Redraw</b> with the linear twins and small-signal variables. Same wiring.</li></ol>`,
        { t: "mcq", q: "Why does the small-signal circuit keep exactly the same wiring as the original?", opts: [["KVL and KCL are already linear, so linearizing doesn't change them; only the element laws change", true, "The connection laws carry the topology. Only the constitutive laws get replaced by their slopes."], ["By coincidence", false, "It always happens, for a reason."], ["Because DC sources become wires", false, "That's one element's twin, not the reason the topology is kept."]] },
      ]},
      { k: "check", title: "Match the twins", b: [
        { t: "sort", q: "Small-signal model of each element:", bins: ["Short circuit", "Open circuit", "Same as itself", "Dependent current source"], items: [
          ["A DC voltage source (like V_S)", 0, "Its voltage never changes, so its change is 0 V: a wire. V_S gets connected to ground in the small-signal circuit."],
          ["A DC current source", 1, "Its current never changes: 0 A change = open."],
          ["A linear resistor", 2, "A straight-line v–i has the same slope everywhere."],
          ["A MOSFET in saturation", 3, "i_d = g_m·v_gs: a voltage-controlled current source."],
        ]},
        `<p class="aside">General rule: for a two-terminal device i = f(v), the twin is a resistor with conductance df/dv at the operating point.</p>`,
      ]},
      { k: "learn", title: "Our amplifier, small-signal version", b: [
        `<div class="two"><div>${amp()}</div><div>${ssFig()}</div></div>`,
        `<p>V<sub>S</sub> became ground. V<sub>I</sub> vanished. The MOSFET became a current source g<sub>m</sub>v<sub>i</sub> (v<sub>gs</sub> = v<sub>i</sub> here). R<sub>L</sub> stayed.</p>`,
        `<div class="eq">v<sub>o</sub> = −g<sub>m</sub>R<sub>L</sub>·v<sub>i</sub></div>`,
      ]},
      { k: "check", title: "A MOSFET as a resistor", b: [
        fig(S.svg(200, 150, S.nmos(90, 75) + S.wire([60, 75], [60, 25], [104, 25], [104, 35]) + S.dot(104, 25) + S.t(116, 20, "D", { cls: "s m", a: "start" }) + S.t(116, 130, "S", { cls: "s m", a: "start" }), { max: 200, label: "MOSFET with gate tied to drain" })),
        `<p>Tie the gate to the drain: v<sub>GS</sub> = v<sub>DS</sub>, so i = (K/2)(v<sub>DS</sub> − V<sub>T</sub>)², a two-terminal device.</p>`,
        { t: "num", q: "K = 2 mA/V², V_T = 1 V, biased at V_DS = 2 V. Its small-signal resistance 1/(K(V_DS − V_T)) = ?", a: 500, unit: "Ω", hint: "Slope di/dv = K(V_DS − V_T) = 2 mS.", why: "1/(2 mS) = 500 Ω. Chips use these as load 'resistors' because big real resistors take up lots of area." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a DC power supply become a short circuit in the small-signal circuit?", model: "The small-signal circuit only tracks changes. A DC supply's voltage never changes no matter what current it delivers, so its change is always zero. A zero-volt element is a wire." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Choosing the operating point", mins: 20,
    blurb: "Higher bias gives more gain, but less room to swing.",
    takeaway: "Gain |A| = K(V_I − V_T)R_L grows with the bias, but a bias near the top of the valid range leaves little room for positive swings. Also check that one stage's output bias is a valid input bias for the next.",
    steps: [
      { k: "play", title: "Gain versus headroom", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let VI = 1.8;
          function draw() {
            const g = K * (VI - VT) * RL, swing = Math.min(VI - VT, VMAX - VI);
            f.innerHTML = plot({ x: [1, 2.7], y: [0, 14], xt: [1, 1.5, 2, 2.5], yt: [0, 4, 8, 12], xl: "bias V_I (V)", yl: "|gain|", series: [{ f: (x) => K * (x - VT) * RL, cls: "s1", to: VMAX }, { pts: [[VMAX, 0], [VMAX, 14]], cls: "s4" }], marks: [{ x: VI, y: g, label: "|A| = " + fmt(g) }], label: "Gain magnitude versus bias" });
            ro.innerHTML = readout([["|gain|", fmt(g)], ["V_O", fmt(big(VI)) + " V"], ["max input swing (±)", fmt(swing * 1000) + " mV"], ["output swing (±, linear est.)", fmt(g * swing) + " V"]]);
          }
          host.append(f, slider({ id: id + "-v", label: "Input bias V_I", min: 1.05, max: 2.6, step: 0.01, value: VI, show: (x) => fmt(x) + " V" }, (x) => { VI = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Red line: top of the valid input range (2.61 V, from Chapter 7). Past it the MOSFET goes into triode.</p>`,
      ]},
      { k: "check", title: "Design for a gain", b: [
        { t: "num", q: "Which bias gives |gain| = 10?", a: 2.25, unit: "V", hint: "10 = 2 × (V_I − 1) × 4.", why: "V_I − 1 = 1.25, so V_I = 2.25 V." },
        { t: "num", q: "At that bias, the largest symmetric input swing (peak)?", a: 0.361, tol: 0.02, unit: "V", hint: "Distance to the nearer edge: min(V_I − 1, 2.611 − V_I).", why: "2.611 − 2.25 ≈ 0.36 V. High gain, but you're close to the triode edge." },
      ]},
      { k: "check", title: "Two stages in a row", b: [
        `<p>Stage 1's output bias is stage 2's input bias. Stage 1 is biased at V<sub>I</sub> = 2.2 V.</p>`,
        { t: "num", q: "Stage 1's V_O = ?", a: 6.24, tol: 0.01, unit: "V", hint: "12 − 4(1.2)².", why: "6.24 V." },
        { t: "mcq", q: "Can 6.24 V bias an identical second stage?", opts: [["No: the valid input range is 1 V to 2.61 V, so 6.24 V would drive stage 2 deep into triode", true, "Fix: raise stage 1's bias (lower V_O), or change R_L. Multi-stage design means matching operating points."], ["Yes, any DC voltage works as bias", false, "The bias must sit inside the next stage's valid range."], ["Yes, because it's above V_T", false, "Above V_T is only the lower limit."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe the trade-off when picking a bias for the MOSFET amplifier.", model: "Raising the input bias raises g_m and so the gain, but it moves the operating point toward the triode edge, so the input can swing up less before distorting. A middle bias gives more room to swing but less gain." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Input and output resistance; loading", mins: 20,
    blurb: "Seen from outside, a small-signal amplifier is two Thévenin ports.",
    takeaway: "r_in: test voltage at the input, measure current (MOSFET gate: ∞). r_out: input signal off, test voltage at the output (common-source: R_L). A load R_O in parallel with R_L cuts the gain to −g_m(R_L ∥ R_O).",
    steps: [
      { k: "learn", title: "Measuring r_in and r_out", b: [
        `<div class="two"><div class="tile"><h3>Input resistance r<sub>in</sub></h3><p>Apply v<sub>test</sub> at the input, other independent sources off, r<sub>in</sub> = v<sub>test</sub>/i<sub>test</sub>.</p></div><div class="tile"><h3>Output resistance r<sub>out</sub></h3><p>Set v<sub>i</sub> = 0. Apply v<sub>test</sub> at the output, r<sub>out</sub> = v<sub>test</sub>/i<sub>test</sub>.</p></div></div>`,
        { t: "mcq", q: "For the MOSFET common-source amplifier, r_in = ?", opts: [["Infinite: the gate draws no current", true, "i_test = 0 for any v_test."], ["R_L", false, "R_L is at the output."], ["1/g_m", false, "That shows up in the source follower's output (Part 6)."]] },
        { t: "mcq", q: "And r_out?", opts: [["R_L: with v_i = 0, the dependent source carries 0 A, which is an open", true, "Only R_L is left looking in from the output."], ["0", false, "The source is off (open), not a short."], ["Infinite", false, "R_L is still there."]] },
      ]},
      { k: "check", title: "Attach a load", b: [
        fig(ssFig(S.wire([300, 40], [370, 40]) + S.res(370, 40, 370, 170, "R_O", { side: "right" }) + S.wire([300, 170], [370, 170]))),
        `<p>g<sub>m</sub> = 1.6 mS, R<sub>L</sub> = 4 kΩ. The next stage looks like R<sub>O</sub> = 4 kΩ across the output.</p>`,
        { t: "num", q: "Loaded gain v_o/v_i = ?", a: -3.2, hint: "−g_m·(R_L ∥ R_O). 4k ∥ 4k = 2k.", why: "−1.6 × 2 = −3.2. Loading halved the gain." },
      ]},
      { k: "learn", title: "Current and power gain", b: [
        `<p>Current gain = (current into the load)/(input current). Power gain = voltage gain × current gain.</p>`,
        `<p>With the MOSFET's infinite input resistance, the input current is 0, so both come out <b>infinite</b> in this model. Real circuits always have some input resistance, which makes them finite.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does connecting a load lower the voltage gain?", model: "The amplifier's output looks like a current g_m·v_i flowing into whatever resistance is at the output. A load in parallel with R_L lowers that total resistance, so the same current produces a smaller output voltage." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Followers and the BJT, small-signal", mins: 20,
    blurb: "A gain-of-1 buffer with low output resistance, and the BJT's β model.",
    takeaway: "Source follower: gain g_mR_S/(1 + g_mR_S) ≈ 1, r_in = ∞, r_out ≈ 1/g_m (small). BJT in active region: i_c = β·i_b; common emitter gain −βR_L/R_I, independent of bias.",
    steps: [
      { k: "learn", title: "Source follower, small-signal", b: [
        fig(S.svg(400, 190, S.wire([60, 82], [60, 40], [140, 40]) + S.wire([60, 118], [60, 160], [300, 160]) + S.vsrc(60, 100, "v_i", { side: "right" }) + S.dot(140, 40) + S.t(140, 60, "G", { cls: "s m" }) +
          S.wire([210, 122], [210, 160]) + S.wire([210, 78], [210, 40], [350, 40]) + S.dep(210, 100, "g_m·v_gs") + S.res(300, 40, 300, 160, "R_S", { side: "right" }) + S.dot(300, 40) + S.dot(210, 40) + S.t(222, 60, "S", { cls: "s m", a: "start" }) + S.t(356, 45, "v_o", { a: "start", cls: "a" }) + S.t(175, 22, "v_gs = v_i − v_o", { cls: "s c" }), { max: 400, label: "Source follower small-signal circuit: dependent source feeding R_S at the source node" })),
        `<p>v<sub>gs</sub> = v<sub>i</sub> − v<sub>o</sub>, and v<sub>o</sub> = g<sub>m</sub>v<sub>gs</sub>·R<sub>S</sub>. Solve:</p>`,
        `<div class="eq">v<sub>o</sub>/v<sub>i</sub> = g<sub>m</sub>R<sub>S</sub>/(1 + g<sub>m</sub>R<sub>S</sub>)</div>`,
        { t: "num", q: "g_m = 2 mS, R_S = 2 kΩ. Gain?", a: 0.8, why: "4/5 = 0.8. Big g_m·R_S pushes it toward 1." },
      ]},
      { k: "check", title: "Why use a gain-less amplifier?", b: [
        `<p>Its output resistance (no external load): r<sub>out</sub> = R<sub>S</sub>/(1 + g<sub>m</sub>R<sub>S</sub>) ≈ 1/g<sub>m</sub>.</p>`,
        { t: "num", q: "With g_m = 2 mS, R_S = 2 kΩ: r_out = ?", a: 400, unit: "Ω", hint: "2000/(1 + 4).", why: "400 Ω, compared with r_in = ∞." },
        { t: "mcq", q: "A sensor has a 100 kΩ Thévenin resistance and must drive a 1 kΩ load. Why put a follower in between?", opts: [["The follower draws no current from the sensor (r_in = ∞) and drives the load from a low r_out, so the signal isn't divided down", true, "Direct connection would lose about 99% of the signal in the divider. That's buffering."], ["It adds voltage gain", false, "Its voltage gain is below 1."], ["It filters noise", false, "Its job here is impedance buffering."]] },
      ]},
      { k: "learn", title: "The BJT small-signal model", b: [
        `<p>In the active region: the 0.6 V source becomes a short, the ideal diode is ON (short), and i<sub>C</sub> = βi<sub>B</sub> is already linear, so i<sub>c</sub> = βi<sub>b</sub>.</p>`,
        `<div class="eq">common emitter: v<sub>o</sub>/v<sub>in</sub> = −βR<sub>L</sub>/R<sub>I</sub>   r<sub>in</sub> = R<sub>I</sub>   r<sub>out</sub> = R<sub>L</sub></div>`,
        { t: "num", q: "β = 100, R_L = 5 kΩ, R_I = 50 kΩ. Small-signal gain?", a: -10, why: "−100 × 5/50 = −10, matching Chapter 7's large-signal slope. A linear device's gain doesn't depend on bias." },
        { t: "mcq", q: "Add a load R_OUT = R_L at the output. Current gain i_out/i_in = −βR_L/(R_L + R_OUT) = ?", opts: [["−50", true, "βi_b splits equally between two equal resistors: half of 100."], ["−100", false, "Only part of βi_b goes to the load."], ["−10", false, "That's the voltage gain."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What makes the source follower a good buffer?", model: "Its input draws no current, so it doesn't load whatever drives it, and its output resistance is low, about 1/g_m, so it can drive heavy loads without its output voltage sagging. Its voltage gain is close to 1, so it just copies the signal." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "The difference amplifier", mins: 20,
    blurb: "Amplify what differs between two wires, reject what's common.",
    takeaway: "Split inputs into difference v_D = v_A − v_B and common v_C = (v_A + v_B)/2. Output = A_D·v_D + A_C·v_C. A source-coupled pair gives A_D = −g_mR_L and A_C ≈ 0, so noise picked up equally on both wires is rejected.",
    steps: [
      { k: "learn", title: "Difference and common mode", b: [
        `<div class="eq">v<sub>D</sub> = v<sub>A</sub> − v<sub>B</sub>   v<sub>C</sub> = (v<sub>A</sub> + v<sub>B</sub>)/2</div>`,
        `<div class="eq">v<sub>O</sub> = A<sub>D</sub>v<sub>D</sub> + A<sub>C</sub>v<sub>C</sub>   CMRR = A<sub>D</sub>/A<sub>C</sub></div>`,
        `<p>Send the useful signal as a <b>difference</b> on two twisted wires. Noise couples onto both wires almost equally, so it shows up as <b>common mode</b>. Make A<sub>D</sub> big and A<sub>C</sub> tiny.</p>`,
        { t: "num", q: "v_A = 2.05 V, v_B = 1.95 V. v_C = ?", a: 2, unit: "V", why: "(2.05 + 1.95)/2 = 2 V. And v_D = 0.1 V." },
      ]},
      { k: "play", title: "Reject the noise", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let n = 0.5, ac = 0;
          function draw() {
            const sig = (t) => 0.05 * Math.sin(2 * Math.PI * 2 * t), noise = (t) => n * Math.sin(2 * Math.PI * 0.5 * t + 1);
            const vA = (t) => sig(t) / 2 + noise(t), vB = (t) => -sig(t) / 2 + noise(t);
            const AD = -10, out = (t) => AD * (vA(t) - vB(t)) + ac * (vA(t) + vB(t)) / 2;
            f.innerHTML = plot({ x: [0, 2], y: [-1.2, 1.2], xt: [0, 1, 2], yt: [-1, 0, 1], xl: "t", yl: "volts", series: [{ f: vA, cls: "s5" }, { f: vB, cls: "s2" }, { f: out, cls: "s1", n: 400 }], label: "Two noisy inputs and the difference amplifier output" });
            ro.innerHTML = readout([["A_D", "−10"], ["A_C", fmt(ac)], ["CMRR", ac === 0 ? "∞" : fmt(Math.abs(10 / ac))]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(slider({ id: id + "-n", label: "Common noise on both wires", min: 0, max: 1, step: 0.05, value: n, show: (x) => fmt(x) + " V" }, (x) => { n = x; draw(); }).el,
            slider({ id: id + "-c", label: "Common-mode gain A_C (imperfect amp)", min: 0, max: 1, step: 0.05, value: ac, show: (x) => fmt(x) }, (x) => { ac = x; draw(); }).el);
          host.append(f, box, ro);
          draw();
        },
        `<p class="aside">Grey/blue: the two wires, swamped by noise. Orange: output = clean, amplified signal (as long as A<sub>C</sub> = 0).</p>`,
      ]},
      { k: "learn", title: "The source-coupled pair", b: [
        `<p>Two matched MOSFETs share their sources and one bias current source I (with large internal resistance R<sub>i</sub>). Each drain has its own R<sub>L</sub>. At balance each carries I/2.</p>`,
        `<div class="tbl"><table><tbody>
          <tr><td>difference mode</td><td>the shared source node doesn't move (v<sub>s</sub> = 0), so v<sub>o</sub> = v<sub>x</sub> − v<sub>y</sub> = −g<sub>m</sub>R<sub>L</sub>v<sub>d</sub></td></tr>
          <tr><td>common mode</td><td>both drains move by the same tiny amount −R<sub>L</sub>v<sub>c</sub>/(2R<sub>i</sub>), so v<sub>x</sub> − v<sub>y</sub> = 0</td></tr></tbody></table></div>`,
        { t: "mcq", q: "What would make common-mode signals leak into the output?", opts: [["The two halves not being perfectly matched (different g_m or R_L)", true, "Then the common-mode shifts on each side aren't equal and their difference isn't zero. Matching is everything."], ["A very large R_i", false, "Large R_i helps: it shrinks the common-mode shift even on each side."], ["A big difference signal", false, "That's the part we want amplified."]] },
      ]},
      { k: "learn", title: "Toward the op amp", b: [
        `<p>Follow a difference pair with another gain stage that shifts the output level so it sits at 0 V when the inputs are equal, and you have a simple <b>operational amplifier</b>. The book's numerical example reaches a small-signal gain around 71. Chapter 15 makes the op amp a building block of its own.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a difference amplifier get rid of noise picked up on a cable?", model: "The signal travels as the difference between two wires, while noise couples onto both wires almost equally, so it appears as common mode. The amplifier multiplies the difference by a large gain and the common part by nearly zero, so the noise drops out of the output." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ch8", eyebrow: "Chapter 8", title: "The Small-Signal Model",
    intro: `<p>Seven parts. Chapter 7's amplifier was nonlinear. Here you make it linear by keeping signals <b>small</b>: transconductance, the <b>small-signal circuit</b>, operating-point trade-offs, input/output resistance, followers, and the <b>difference amplifier</b>.</p><p class="aside">Arrow keys ← → move between steps. Need a refresher? <a href="07-mosfet-amplifier.html">Chapter 7</a>, and Chapter 4 Part 6 for slopes.</p>`,
    after: `<p>Open the Chapter 8 PDF and go to the <b>exercises and problems</b> at the end. For each, first write down the operating point, then draw the small-signal circuit before calculating anything.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7],
    summary: `
      <h3>Small-signal discipline</h3>
      <p>v<sub>I</sub> = V<sub>I</sub> + v<sub>i</sub>. Small perturbations about an operating point respond linearly: Δy ≈ (dy/dx)|<sub>op</sub>·Δx.</p>
      <h3>MOSFET</h3>
      <div class="eq">i_d = g_m·v_gs · g_m = K(V_GS − V_T) = √(2K·I_D)</div>
      <div class="eq">common source: A = v_o/v_i = −g_m·R_L</div>
      <h3>Small-signal circuit</h3>
      <ol><li>Operating point.</li><li>Linearize each element.</li><li>Redraw with the same topology.</li></ol>
      <p>DC V source → short. DC I source → open. R → R. Saturated MOSFET → VCCS g<sub>m</sub>v<sub>gs</sub>. Two-terminal i = f(v) → resistor 1/f'(V). Diode-connected MOSFET → 1/(K(V<sub>DS</sub> − V<sub>T</sub>)).</p>
      <h3>Operating point</h3>
      <p>|A| = K(V<sub>I</sub> − V<sub>T</sub>)R<sub>L</sub> grows with bias; swing limited by the nearer edge of the valid range. Stage 1's V<sub>O</sub> must be a valid bias for stage 2.</p>
      <h3>Ports</h3>
      <p>r<sub>in</sub> (MOSFET gate) = ∞. r<sub>out</sub> (common source) = R<sub>L</sub>. Loaded gain: −g<sub>m</sub>(R<sub>L</sub> ∥ R<sub>O</sub>). Power gain = voltage gain × current gain.</p>
      <h3>Source follower</h3>
      <div class="eq">A = g_m·R_S/(1 + g_m·R_S) ≈ 1 · r_out ≈ 1/g_m · r_in = ∞</div>
      <h3>BJT</h3><p>i<sub>c</sub> = βi<sub>b</sub>; common emitter A = −βR<sub>L</sub>/R<sub>I</sub>, r<sub>in</sub> = R<sub>I</sub>, r<sub>out</sub> = R<sub>L</sub>.</p>
      <h3>Difference amplifier</h3>
      <div class="eq">v_D = v_A − v_B · v_C = (v_A + v_B)/2 · v_O = A_D·v_D + A_C·v_C · CMRR = A_D/A_C</div>
      <p>Source-coupled pair: A<sub>D</sub> = −g<sub>m</sub>R<sub>L</sub>, A<sub>C</sub> ≈ 0.</p>`,
  };
  Course.start(window.CHAPTER);
})();
