(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const KQ = 8.617e-5; /* Boltzmann constant / electron charge, V per kelvin */

  /* source → diode → load. o.cap adds a capacitor across R. */
  function rectFig(o = {}) {
    let s = S.vsrc(60, 110, "v_i", { side: "left" }) + S.wire([60, 92], [60, 40], [110, 40]) + S.diode(110, 40, 190, 40, o.dl || "", {}) + S.wire([190, 40], [260, 40]);
    s += S.res(260, 40, 260, 180, "R", { side: "left" }) + S.wire([60, 128], [60, 180], [260, 180]) + S.dot(260, 40) + S.dot(260, 180);
    let xo = 260;
    if (o.cap) { s += S.wire([260, 40], [330, 40]) + S.cap(330, 40, 330, 180, "C", { side: "left" }) + S.wire([260, 180], [330, 180]); xo = 330; }
    s += S.t(xo + 30, 64, "+", { cls: "big" }) + S.t(xo + 30, 172, "−", { cls: "big" }) + S.t(xo + 26, 116, o.out || "v_r", { a: "start", cls: "a" });
    if (o.vd) s += S.t(150, 18, "+ v_D −", { cls: "s m" });
    return S.svg(xo + 70, 200, s, { max: xo + 70, label: o.cap ? "Peak detector: source, diode, then a resistor and capacitor in parallel" : "Half-wave rectifier: source, diode and resistor in a loop" });
  }
  function clampFig() {
    let s = S.vsrc(60, 110, "v_i", { side: "left" }) + S.wire([60, 92], [60, 40], [90, 40]) + S.cap(90, 40, 170, 40, "C") + S.t(130, 76, "+ v_C −", { cls: "s m" }) + S.wire([170, 40], [290, 40]);
    s += S.dot(200, 40) + S.dot(270, 40) + S.diode(200, 180, 200, 40, "", {}) + S.res(270, 40, 270, 180, "R", { side: "left" }) + S.wire([60, 128], [60, 180], [270, 180]) + S.dot(200, 180) + S.dot(270, 180);
    s += S.t(304, 64, "+", { cls: "big" }) + S.t(304, 172, "−", { cls: "big" }) + S.t(300, 116, "v_o", { a: "start", cls: "a" });
    return S.svg(350, 200, s, { max: 350, label: "Clamp: series capacitor, then a diode (anode at ground) and a resistor across the output" });
  }
  function biasFig(fwd) {
    let s = S.wire([60, 40], [120, 40]) + S.diode(120, 40, 200, 40, "", {}) + S.wire([200, 40], [260, 40]) + S.res(260, 40, 260, 140, "R", { side: "right" }) + S.wire([260, 140], [60, 140], [60, 108]) + S.wire([60, 72], [60, 40]);
    s += S.vsrc(60, 90, "", { flip: !fwd }) + S.t(116, 24, "p", { cls: "s a" }) + S.t(206, 24, "n", { cls: "s a" });
    s += fwd ? S.arrow(215, 58, 245, 58, "") + S.t(160, 176, "forward: big current", { cls: "s a" }) : S.t(160, 176, "reverse: almost none", { cls: "s m" });
    return S.svg(320, 190, s, { max: 320, label: fwd ? "Forward bias: battery makes the p side positive" : "Reverse bias: battery makes the n side positive" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Inside a diode", mins: 15,
    blurb: "n-type, p-type and the junction that makes current one-way.",
    takeaway: "Pure silicon barely conducts. Add a trace of phosphorus (Group V) for n-type: mobile electrons. Add aluminium or boron (Group III) for p-type: mobile holes. Put p against n and you get a diode: big current when p is positive (forward bias), almost none when n is positive (reverse bias). Symbol: the arrow is the p side.",
    steps: [
      { k: "learn", title: "Silicon, plain and doped", b: [
        `<p>In pure silicon every outer electron is locked into a bond with a neighbour. Almost none are free to move, so it's a <b>poor conductor</b>.</p>`,
        `<ul><li><b>n-type</b>: add a part per million of a Group V element (phosphorus). Each brings one spare electron: <b>mobile negative charge</b>.</li><li><b>p-type</b>: add a Group III element (aluminium). Each leaves a missing electron, a <b>hole</b>, that behaves like a <b>mobile positive charge</b>.</li></ul>`,
        `<p>Both are electrically neutral, and both conduct well. You met them inside the MOSFET.</p>`,
      ]},
      { k: "check", title: "Sort them", b: [
        { t: "sort", q: "n-type or p-type?", bins: ["n-type", "p-type"], items: [
          ["Silicon with a trace of phosphorus", 0, "Group V brings a spare electron."],
          ["Mobile charges are holes", 1, "A hole is a missing electron, acting like a + charge."],
          ["Silicon with a trace of aluminium", 1, "Group III: one electron short of a full bond."],
          ["Mobile charges are electrons", 0, "n for negative carriers."],
        ]},
      ]},
      { k: "learn", title: "Put p next to n", b: [
        fig(biasFig(true)),
        fig(biasFig(false)),
        `<p>The symbol's <b>arrow is the p side</b> (anode); the bar is the n side (cathode). Current flows easily in the arrow's direction.</p>`,
        `<p class="aside">You've already built one by accident: in an n-channel MOSFET, the n-type drain against the p-type body is a diode.</p>`,
      ]},
      { k: "check", title: "Which way?", b: [
        { t: "mcq", q: "A battery's + terminal is on the diode's bar side, through a resistor. What flows?", opts: [["Almost nothing: that's reverse bias", true, "The bar is the n side. Making n positive reverse-biases the junction."], ["A large current", false, "That needs the p (arrow) side positive."], ["The same current as the other way round", false, "The whole point of a diode is that asymmetry."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What makes a diode conduct one way and not the other?", model: "It's a junction of p-type silicon (mobile holes) and n-type silicon (mobile electrons). Making the p side positive relative to the n side, forward bias, lets a large current flow. Making the n side positive, reverse bias, lets almost none through." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "The exponential law", mins: 20,
    blurb: "One formula, and why it seems to 'turn on' at 0.6 V.",
    takeaway: "i_D = I_s(e^(v_D/V_TH) − 1), with V_TH = kT/q ≈ 25 mV at room temperature and I_s ≈ 10⁻¹² A for silicon. Every 58 mV of extra v_D multiplies the current by about 10. On a milliamp scale this looks like a sharp threshold near 0.6–0.7 V (0.2 V for germanium), but that knee comes from the exponential, not from any physical switch.",
    steps: [
      { k: "learn", title: "The diode equation", b: [
        `<div class="key">i<sub>D</sub> = I<sub>s</sub> ( e<sup>v<sub>D</sub>/V<sub>TH</sub></sup> − 1 )</div>`,
        `<ul><li><b>V<sub>TH</sub> = kT/q</b>, the thermal voltage: ≈ 0.025 V at room temperature. (k = Boltzmann's constant, q = electron charge, T in kelvins.)</li><li><b>I<sub>s</sub></b>, the saturation current: ≈ 10⁻¹² A for silicon.</li></ul>`,
        `<p>Reverse bias (v<sub>D</sub> negative): the exponential → 0, so i<sub>D</sub> → −I<sub>s</sub>, a picoamp. Effectively zero.</p>`,
      ]},
      { k: "play", title: "Where is the knee?", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const Is = 1e-12, V = 0.025;
          const views = [
            { x: [-0.1, 0.06], xt: [-0.1, -0.05, 0, 0.05], y: [-2, 10], yt: [0, 5, 10], k: 1e12, u: "pA" },
            { x: [0, 0.5], xt: [0, 0.1, 0.2, 0.3, 0.4, 0.5], y: [0, 10], yt: [0, 5, 10], k: 1e6, u: "µA" },
            { x: [0, 0.8], xt: [0, 0.2, 0.4, 0.6, 0.8], y: [0, 10], yt: [0, 5, 10], k: 1e3, u: "mA" },
          ];
          function draw(j) {
            const v = views[j], knee = V * Math.log((0.1 * v.y[1]) / v.k / Is + 1);
            f.innerHTML = plot({ x: v.x, y: v.y, xt: v.xt, yt: v.yt, xl: "v_D (V)", yl: "i_D (" + v.u + ")", series: [{ f: (x) => v.k * Is * (Math.exp(x / V) - 1), cls: "s1", n: 500 }], label: "Diode current versus voltage, " + v.u + " scale" });
            ro.innerHTML = readout([["current scale", v.u], ["curve 'takes off' near", fmt(knee, 2) + " V"]]);
          }
          host.append(f, toggle(["pA scale", "µA scale", "mA scale"], draw, 2), ro);
          draw(2);
        },
        `<p class="aside">The same equation, three zoom levels. Predict before each click: where will the "threshold" appear?</p>`,
      ]},
      { k: "why", title: "So is there a threshold or not?", b: [
        { t: "mcq", q: "On the mA scale the diode seems to switch on at 0.6 V. On the pA scale it 'switches on' near 0 V. What's going on?", opts: [["An exponential always looks flat-then-steep; where the bend appears depends only on the scale you plot", true, "There's no physical switch. But at the milliamp currents circuits use, the bend reliably sits at 0.6–0.7 V for silicon, and that's useful (it's why digital gates have thresholds)."], ["The diode physically turns on at 0.6 V", false, "The pA plot shows current flowing well below 0.6 V."], ["The pA plot is a different diode", false, "Same I_s, same V_TH."]] },
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "How much must v_D rise to multiply i_D by 10 (forward bias, V_TH = 25 mV)?", a: 57.6, tol: 0.02, unit: "mV", hint: "Ignore the −1: i ∝ e^(v/V_TH). Solve e^(Δv/V_TH) = 10.", why: "Δv = 0.025 × ln 10 ≈ 57.6 mV. 'About 60 mV per decade' is a handy rule." },
        { t: "num", q: "I_s = 10⁻¹² A, v_D = 0.65 V. i_D in mA?", a: 195.7, tol: 0.03, unit: "mA", why: "e²⁶ ≈ 1.96×10¹¹, times 10⁻¹² ≈ 0.196 A. Note how fast it grows: at 0.60 V it's only about 26 mA." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain why a silicon diode seems to have a 0.6 V threshold even though its equation has none.", model: "The current is exponential in voltage, growing ten times for every 60 mV or so. Below about 0.5 V the current is micro- or nano-amps, which looks like zero on a milliamp scale. Around 0.6–0.7 V it reaches milliamps and then shoots up. So at practical currents it looks like a sharp knee, but it's just the exponential seen on a linear scale." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "A diode thermometer", mins: 15,
    blurb: "Use kT/q to measure a chip's temperature.",
    takeaway: "For forward bias, v_D ≈ (kT/q) ln(i_D/I_s). Force two currents with a fixed ratio through the same diode and subtract: v_D1 − v_D2 = (kT/q) ln(i_D1/i_D2). I_s cancels, and the difference is proportional to absolute temperature.",
    steps: [
      { k: "learn", title: "Why a chip needs to know", b: [
        `<p>A processor runs faster with a faster clock, but gets hotter (Chapter 11). It's pushed until it reaches a safe limit, around 110 °C. How does it know its own temperature?</p>`,
        `<p>A diode on the chip. kT/q has <b>T</b> in it.</p>`,
      ]},
      { k: "math", title: "Two currents, one diode", b: [
        `<p>Well into forward bias, drop the −1 and solve for v<sub>D</sub>:</p>`,
        `<div class="eq">v<sub>D</sub> ≈ (kT/q) ln( i<sub>D</sub>/I<sub>s</sub> )</div>`,
        `<p>I<sub>s</sub> varies from diode to diode and with temperature, so one reading isn't trustworthy. Force i<sub>D1</sub>, then i<sub>D2</sub>, and subtract:</p>`,
        { t: "reveal", label: "Subtract", html: `<div class="key">v<sub>D1</sub> − v<sub>D2</sub> = (kT/q) ln( i<sub>D1</sub>/i<sub>D2</sub> )</div><p>I<sub>s</sub> is gone. With a fixed current ratio, the difference is proportional to <b>absolute</b> temperature.</p>` },
      ]},
      { k: "play", title: "Read the temperature", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let Tc = 27, ratio = 20;
          function draw() {
            const T = Tc + 273.15, dv = (T) => KQ * T * Math.log(ratio) * 1e3;
            f.innerHTML = plot({ x: [0, 450], y: [0, 120], xt: [0, 100, 200, 300, 400], yt: [0, 30, 60, 90, 120], xl: "T (kelvin)", yl: "v_D1 − v_D2 (mV)", series: [{ f: dv, cls: "s1" }], marks: [{ x: T, y: dv(T) }], label: "Voltage difference versus absolute temperature" });
            ro.innerHTML = readout([["T", fmt(Tc, 3) + " °C = " + fmt(T, 4) + " K"], ["kT/q", fmt(KQ * T * 1e3, 4) + " mV"], ["v_D1 − v_D2", fmt(dv(T), 4) + " mV"]]);
          }
          host.append(f, slider({ id: id + "-t", label: "Chip temperature", min: -20, max: 130, step: 1, value: Tc, show: (x) => fmt(x) + " °C" }, (x) => { Tc = x; draw(); }).el,
            slider({ id: id + "-r", label: "Current ratio i_D1/i_D2", min: 2, max: 50, step: 1, value: ratio, show: (x) => fmt(x) }, (x) => { ratio = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">A straight line through 0 K: that's "proportional to absolute temperature". The ratio only changes the slope.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>Currents 200 µA and 10 µA (ratio 20). k/q = 8.617×10⁻⁵ V/K.</p>`,
        { t: "num", q: "At T = 300 K, v_D1 − v_D2 = ?", a: 77.4, tol: 0.01, unit: "mV", why: "8.617×10⁻⁵ × 300 × ln 20 = 0.02585 × 2.996 ≈ 77.4 mV." },
        { t: "num", q: "The chip reads 90 mV. Temperature in °C?", a: 75.5, tol: 0.02, unit: "°C", why: "T = 0.090 / (8.617×10⁻⁵ × 2.996) ≈ 348.6 K ≈ 75.5 °C." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the sensor use two currents instead of one?", model: "A single diode voltage depends on I_s, which changes from part to part and with temperature, so you can't trust it. The difference between the voltages at two currents with a fixed ratio is kT/q times the log of the ratio. I_s cancels, leaving something proportional to absolute temperature." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "The method of assumed states", mins: 25,
    blurb: "Guess ON or OFF, solve a linear circuit, then check the guess.",
    takeaway: "Ideal diode: ON ⇒ v = 0 (short), valid only while i > 0; OFF ⇒ i = 0 (open), valid only while v < 0. Method: (1) draw a subcircuit per state (2ⁿ for n diodes); (2) solve each linear subcircuit; (3) keep only the parts where each state's condition holds, and stitch them together. Better models: add a 0.6 V source, then a series R_d.",
    steps: [
      { k: "learn", title: "Two states, two simple circuits", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>ON</b></td><td>a short: v<sub>D</sub> = 0</td><td>valid only if i<sub>D</sub> > 0</td></tr>
          <tr><td><b>OFF</b></td><td>an open: i<sub>D</sub> = 0</td><td>valid only if v<sub>D</sub> < 0</td></tr></tbody></table></div>`,
        `<p>Each state turns the diode into a short or an open, so each subcircuit is <b>linear</b>, and everything you know works on it.</p>`,
        fig(rectFig({ vd: true })),
      ]},
      { k: "play", title: "Assume, solve, check", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), note = el(`<p class="aside"></p>`);
          const vi = (t) => 3 * Math.sin(2 * Math.PI * t);
          function draw(j) {
            const on = (t) => (t % 1) < 0.5, series = [{ f: vi, cls: "s5" }];
            const seg = (f, a) => [{ f, cls: "s1", from: a, to: a + 0.5 }, { f, cls: "s1", from: a + 1, to: a + 1.5 }];
            if (j === 0) series.push({ f: () => 0, cls: "s2" }, ...seg(() => 0, 0.5));
            if (j === 1) series.push({ f: vi, cls: "s2" }, ...seg(vi, 0));
            if (j === 2) series.push({ f: (t) => (on(t) ? vi(t) : 0), cls: "s1" });
            f.innerHTML = plot({ x: [0, 2], y: [-3.5, 3.5], xt: [0, 0.5, 1, 1.5, 2], yt: [-3, 0, 3], xl: "t (cycles)", yl: "v_r (V)", series, label: "Rectifier output by assumed states" });
            note.textContent = ["Assume OFF: no current, so v_r = 0 (blue). Valid only while v_D = v_i < 0: the orange part.", "Assume ON: a short, so v_r = v_i (blue). Valid only while i_D = v_i/R > 0: the orange part.", "Stitch the valid pieces: the half-wave rectified output."][j];
          }
          host.append(f, toggle(["Assume OFF", "Assume ON", "Combine"], draw, 0), note);
          draw(0);
        },
        `<p class="aside">Dashed: the input v<sub>i</sub> = 3 sin ωt.</p>`,
      ]},
      { k: "learn", title: "The recipe", b: [
        `<ol><li>Draw a subcircuit for each diode state. One diode: 2. n diodes: <b>2ⁿ</b>.</li><li>Solve each linear subcircuit for the output.</li><li>Find where each answer is valid (ON needs i > 0, OFF needs v < 0). Stitch the valid parts together.</li></ol>`,
        `<p class="aside">It takes some insight to rule out impossible combinations quickly, especially with several diodes.</p>`,
      ]},
      { k: "play", title: "Better diode models", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const R = 100, Rd = 25, Vp = 2;
          const models = [(v) => Math.max(v, 0), (v) => Math.max(v - 0.6, 0), (v) => (Math.max(v - 0.6, 0) * R) / (R + Rd)];
          function draw(j) {
            f.innerHTML = plot({ x: [0, 2], y: [-2.3, 2.3], xt: [0, 0.5, 1, 1.5, 2], yt: [-2, -1, 0, 1, 2], xl: "t (cycles)", yl: "v_r (V)", series: [{ f: (t) => Vp * Math.sin(2 * Math.PI * t), cls: "s5" }, { f: (t) => models[j](Vp * Math.sin(2 * Math.PI * t)), cls: "s1" }], label: "Rectifier output with different diode models" });
            ro.innerHTML = readout([["model", ["ideal diode", "ideal + 0.6 V", "ideal + 0.6 V + R_d"][j]], ["peak v_r", fmt(models[j](Vp), 3) + " V"], ["ON when", j ? "v_i > 0.6 V" : "v_i > 0"]]);
          }
          host.append(f, toggle(["Ideal", "+ 0.6 V", "+ 0.6 V + R_d"], draw, 0), ro);
          draw(0);
        },
        `<p class="aside">v<sub>i</sub> = 2 sin ωt, R = 100 Ω, R<sub>d</sub> = 25 Ω (exaggerated so you can see it). Chapter 4's piecewise-linear models. ON now means "ideal diode inside the model is ON", so v<sub>r</sub> = (v<sub>i</sub> − 0.6)·R/(R + R<sub>d</sub>).</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "Rectifier, v_i peak 5 V, diode = ideal + 0.6 V + R_d with R_d = 10 Ω, R = 90 Ω. Peak v_r?", a: 3.96, tol: 0.01, unit: "V", why: "(5 − 0.6) × 90/100 = 3.96 V." },
        { t: "mcq", q: "A circuit has 3 diodes. How many subcircuits could you draw?", opts: [["8", true, "2³: each diode ON or OFF. Usually most can be ruled out quickly."], ["3", false, "Each diode has 2 states, independently."], ["6", false, "It's 2 × 2 × 2, not 2 × 3."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In the method of assumed states, how do you know which subcircuit's answer to believe at a given moment?", model: "Each state has a condition. For an assumed ON diode, the current you calculate through it must be positive. For an assumed OFF diode, the voltage you calculate across it must be negative. At each moment you keep the subcircuit whose assumptions are consistent with its own answer." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "The peak detector", mins: 25,
    blurb: "Add a capacitor to the rectifier and get nearly steady DC.",
    takeaway: "Diode ON: v_C = v_i (only while the capacitor is charging). Diode OFF: v_C decays as e^(−t/RC), until v_i climbs back above v_C. With RC ≫ period T: peak-to-peak ripple ≈ V_p·T/RC and average ≈ V_p(1 − T/2RC). These over-estimate the ripple slightly, so designs based on them are safe.",
    steps: [
      { k: "learn", title: "One diode, one RC", b: [
        fig(rectFig({ cap: true, out: "v_C" })),
        `<p>A diode makes a piecewise-linear circuit, and with one C each piece is a Chapter 10 RC circuit.</p>`,
        `<ul><li><b>ON</b> (short): v<sub>C</sub> = v<sub>i</sub>. Needs i<sub>D</sub> = v<sub>C</sub>/R + C dv<sub>C</sub>/dt > 0.</li><li><b>OFF</b> (open): the source is disconnected. v<sub>C</sub> = K e<sup>−t/RC</sup>. Needs v<sub>i</sub> < v<sub>C</sub>.</li></ul>`,
      ]},
      { k: "predict", title: "Predict first", b: [
        { t: "mcq", q: "Just after the input sine passes its peak and starts down, which state is the diode in?", opts: [["OFF: following the falling sine would need the capacitor to discharge through the diode, i.e. negative i_D", true, "Once v_i falls faster than the RC decay, i_D would go negative, so the diode turns OFF and the capacitor coasts down on its own."], ["ON for the whole half cycle", false, "Check the ON condition i_D > 0 as v_C falls with v_i."], ["OFF until the input reaches zero", false, "It turns OFF just after the peak, not at zero."]] },
      ]},
      { k: "play", title: "Watch the ripple", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const Vp = 10;
          let k = 4;
          function draw() {
            const N = 3000, Tn = 4, dt = Tn / N, pts = [];
            let vc = 0, lo = Infinity, sum = 0, cnt = 0;
            for (let n = 0; n <= N; n++) {
              const t = n * dt, vi = Vp * Math.sin(2 * Math.PI * t);
              vc = Math.max(vi, vc * Math.exp(-dt / k));
              pts.push([t, vc]);
              if (t > 2) { lo = Math.min(lo, vc); sum += vc; cnt++; }
            }
            f.innerHTML = plot({ x: [0, 4], y: [-10.5, 13], xt: [0, 1, 2, 3, 4], yt: [-10, -5, 0, 5, 10], xl: "t (periods)", yl: "v (V)", series: [{ f: (t) => Vp * Math.sin(2 * Math.PI * t), cls: "s5", n: 600 }, { pts, cls: "s1" }], label: "Peak detector input and capacitor voltage" });
            ro.innerHTML = readout([["RC / period", fmt(k, 3)], ["ripple (simulated)", fmt(Vp - lo, 3) + " V"], ["estimate V_p·T/RC", fmt(Vp / k, 3) + " V"], ["average v_C", fmt(sum / cnt, 3) + " V"], ["estimate V_p(1 − T/2RC)", fmt(Vp * (1 - 1 / (2 * k)), 3) + " V"]]);
          }
          host.append(f, slider({ id: id + "-k", label: "RC (in periods of the input)", min: 0.2, max: 30, log: true, value: k, show: (x) => fmt(x, 3) + " T" }, (x) => { k = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Input 10 sin ωt (dashed). Small RC: the output just follows the positive half-waves. Large RC: nearly flat DC. Compare the estimates with the simulation as RC grows.</p>`,
      ]},
      { k: "math", title: "The ripple estimate", b: [
        `<p>With RC ≫ T, the diode switches OFF just after each peak, so v<sub>C</sub> starts each OFF stretch at about V<sub>p</sub>, and the decay is almost a straight line:</p>`,
        `<div class="eq">v<sub>C</sub> ≈ V<sub>p</sub> (1 − t/RC)</div>`,
        `<p><b>Shortcut:</b> pretend the decay lasts a whole period T before the jump back to V<sub>p</sub>. (Really it's a bit shorter, so this over-estimates the ripple: a safe design.)</p>`,
        { t: "reveal", label: "Result", html: `<div class="key">ripple (peak-to-peak) ≈ V<sub>p</sub> T/RC     average ≈ V<sub>p</sub>(1 − T/2RC)</div><p>RC = 10T gives 10% ripple and an average of 0.95 V<sub>p</sub>.</p>` },
        `<p class="aside">Solving exactly for the turn-on moment means a transcendental equation (sin vs a line). Design constraints like RC ≫ T usually make that unnecessary.</p>`,
      ]},
      { k: "check", title: "Design a supply", b: [
        `<p>50 Hz mains through a transformer, V<sub>p</sub> = 15 V. Load R = 500 Ω, C = 1000 µF.</p>`,
        { t: "num", q: "RC = ? (seconds)", a: 0.5, unit: "s", why: "500 × 10⁻³ = 0.5 s, which is 25 periods of 20 ms." },
        { t: "num", q: "Peak-to-peak ripple estimate?", a: 0.6, unit: "V", why: "15 × 0.02/0.5 = 0.6 V." },
        { t: "num", q: "Average DC output estimate?", a: 14.7, unit: "V", why: "15 × (1 − 0.01/0.5) = 15 × 0.98 = 14.7 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a bigger capacitor give smoother DC?", model: "Between peaks the diode is OFF and only the capacitor feeds the load, so v_C droops at a rate set by RC. A bigger C means a longer time constant, so it droops less during each period before the next peak tops it back up. Ripple ≈ V_p·T/RC." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "The clamp (DC restorer)", mins: 20,
    blurb: "A capacitor and a diode that shift a waveform up so it never goes negative.",
    takeaway: "Clamp: series C, then a diode and R across the output. ON whenever v_i < v_C: the capacitor snaps to v_i and v_o = 0. OFF otherwise: plain RC, v_o = (V_final − V_init)e^(−t/RC). With RC ≫ the period, the output keeps the input's shape but its most negative point is clamped to 0 V.",
    steps: [
      { k: "learn", title: "The circuit", b: [
        fig(clampFig()),
        `<p>KVL: v<sub>o</sub> = v<sub>i</sub> − v<sub>C</sub>. The diode points <b>up</b> from ground, so it turns ON if v<sub>o</sub> tries to go negative.</p>`,
        `<ul><li><b>ON</b>: v<sub>o</sub> = 0, so v<sub>C</sub> = v<sub>i</sub>. Holds while v<sub>i</sub> < v<sub>C</sub>.</li><li><b>OFF</b>: a series RC circuit (Chapter 10). Holds while v<sub>C</sub> < v<sub>i</sub>.</li></ul>`,
        `<p class="aside">The ideal ON circuit puts C straight across the source, so v<sub>C</sub> can jump instantly. Any real source or diode resistance turns that jump into a very fast transition.</p>`,
      ]},
      { k: "predict", title: "Predict first", b: [
        { t: "mcq", q: "Input: ±10 V square wave, C uncharged, first half +10 V. Just after the first drop to −10 V, what is v_o?", opts: [["0 V: v_i < v_C, so the diode turns ON and the capacitor snaps to −10 V", true, "The capacitor had charged positive; −10 V is below it, so we're in the ON state."], ["−20 V", false, "That would need the diode to stay OFF with v_o negative, which its condition forbids."], ["+10 V", false, "Check KVL: v_o = v_i − v_C."]] },
      ]},
      { k: "play", title: "Clamp a square wave", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let k = 0.6;
          function draw() {
            const N = 4000, Tn = 4, dt = Tn / N, vo = [], vcp = [];
            let vc = 0;
            for (let n = 0; n <= N; n++) {
              const t = n * dt, vi = (t % 1) < 0.5 ? 10 : -10;
              if (vi < vc) vc = vi;
              vo.push([t, vi - vc]); vcp.push([t, vc]);
              vc += (dt * (vi - vc)) / k;
            }
            f.innerHTML = plot({ x: [0, 4], y: [-11, 21], xt: [0, 1, 2, 3, 4], yt: [-10, 0, 10, 20], xl: "t (periods)", yl: "v (V)", series: [{ f: (t) => ((t % 1) < 0.5 ? 10 : -10), cls: "s5", n: 800 }, { pts: vcp, cls: "s2" }, { pts: vo, cls: "s1" }], label: "Clamp input, capacitor voltage and output" });
            ro.innerHTML = readout([["RC / period", fmt(k, 3)], ["dashed / blue / orange", "v_i / v_C / v_o"], ["lowest v_o", fmt(Math.min(...vo.map((p) => p[1])), 3) + " V"]]);
          }
          host.append(f, slider({ id: id + "-k", label: "RC (in periods)", min: 0.05, max: 20, log: true, value: k, show: (x) => fmt(x, 3) + " T" }, (x) => { k = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">After the first cycle, each rise starts v<sub>o</sub> at 20 V (capacitor at −10, source at +10), which then decays as 20e<sup>−t/RC</sup>. Make RC long and the output becomes a 0-to-20 V square wave: same shape, shifted up.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>Same clamp, ±10 V square wave, steady state, during a +10 V half cycle.</p>`,
        { t: "num", q: "RC = 2 ms, half-period 1 ms. v_o at the end of the half-cycle?", a: 12.13, tol: 0.01, unit: "V", why: "20 e^(−1/2) ≈ 12.1 V. (V_final − V_init = 10 − (−10) = 20 V.)" },
        { t: "mcq", q: "In a TV, this circuit is a 'DC restorer' with RC ≫ the period. What does it do to a video signal?", opts: [["Keeps the shape, and shifts it so its most negative point sits at 0 V", true, "The capacitor charges to the input's lowest value and stays there."], ["Removes all the DC, centring the signal on 0 V", false, "That's a plain coupling capacitor (Chapter 13). The diode is what pins the bottom."], ["Rectifies it", false, "It shifts, it doesn't chop."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe what the diode does in the clamp, in terms of the two states.", model: "Whenever the input drops below the capacitor voltage, the output would go negative, so the diode turns ON, holding the output at 0 and charging the capacitor down to the input. Otherwise the diode is OFF and it's just an RC circuit, with the capacitor holding nearly constant if RC is long. Net effect: the waveform is shifted up so its lowest point is at 0 V." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ch16", eyebrow: "Chapter 16", title: "Diodes",
    intro: `<p>Six parts, and the last chapter. The diode from Chapter 4, up close: how p and n silicon make a one-way valve, the exponential law, a diode thermometer, a systematic method for diode circuits, and two RC classics, the peak detector and the clamp.</p><p class="aside">Uses Chapter 4's nonlinear methods and Chapter 10's RC transients. Arrow keys ← → move between steps. Need a refresher? <a href="15-op-amp.html">Chapter 15</a>.</p>`,
    after: `<p>Open the Chapter 16 PDF and go to the <b>exercises and problems</b> at the end. For every diode, write its ON condition and its OFF condition before you solve anything, and check each answer against them.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <h3>The device</h3>
      <p>p-type (holes) against n-type (electrons). Forward bias (p positive): big current. Reverse: ≈ none. Arrow = p side.</p>
      <div class="eq">i<sub>D</sub> = I<sub>s</sub>(e<sup>v<sub>D</sub>/V<sub>TH</sub></sup> − 1)     V<sub>TH</sub> = kT/q ≈ 25 mV     I<sub>s</sub> ≈ 10⁻¹² A</div>
      <p>~60 mV per decade of current. Apparent knee 0.6–0.7 V (Si), 0.2 V (Ge): a scale effect.</p>
      <h3>Thermometer</h3>
      <div class="eq">v<sub>D1</sub> − v<sub>D2</sub> = (kT/q) ln(i<sub>D1</sub>/i<sub>D2</sub>)</div>
      <h3>Models</h3>
      <p>Ideal: ON v = 0 (i > 0), OFF i = 0 (v < 0). Plus 0.6 V source. Plus series R<sub>d</sub>.</p>
      <h3>Method of assumed states</h3>
      <p>Subcircuit per state (2ⁿ for n diodes) → solve each linear circuit → keep the parts where each state's condition holds → stitch.</p>
      <h3>With one C</h3>
      <p>Peak detector: ON v<sub>C</sub> = v<sub>i</sub>; OFF v<sub>C</sub> = Ke<sup>−t/RC</sup>. RC ≫ T: ripple ≈ V<sub>p</sub>T/RC, average ≈ V<sub>p</sub>(1 − T/2RC).</p>
      <p>Clamp: ON when v<sub>i</sub> < v<sub>C</sub> (v<sub>o</sub> = 0); OFF: RC, v<sub>o</sub> = (V<sub>final</sub> − V<sub>init</sub>)e<sup>−t/RC</sup>. Long RC: shape kept, bottom pinned at 0 V.</p>`,
  };
  Course.start(window.CHAPTER);
})();
