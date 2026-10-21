(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;

  /* ---------- the amplifier used all chapter: V_S = 12 V, R_L = 4 kΩ, K = 2 mA/V², V_T = 1 V ---------- */
  const VS = 12, RL = 4, K = 2, VT = 1; // kΩ and mA, so V = kΩ·mA
  // SU model current in mA
  function iSU(vgs, vds, k = K) {
    if (vgs < VT) return 0;
    const ov = vgs - VT;
    return vds < ov ? k * (ov * vds - (vds * vds) / 2) : (k / 2) * ov * ov;
  }
  // Output of the common-source amplifier for input v (solves v_O = V_S − R_L·i(v, v_O))
  function vout(v) {
    let lo = 0, hi = VS;
    for (let n = 0; n < 60; n++) { const m = (lo + hi) / 2; if (m + RL * iSU(v, m) - VS > 0) hi = m; else lo = m; }
    return (lo + hi) / 2;
  }
  const xmax = VT + (-1 + Math.sqrt(1 + 2 * VS * RL * K)) / (RL * K); // top of the saturation range
  function region(v, vo) { return v < VT ? "cutoff" : vo >= v - VT ? "saturation" : "triode"; }

  function ampFig(o = {}) {
    let s = S.supply(200, 40, "V_S = 12 V") + S.res(200, 40, 200, 110, "R_L = 4 kΩ", { side: "right" }) + S.wire([200, 110], [300, 110]) + S.dot(200, 110) + S.t(306, 115, o.out || "v_O", { a: "start", cls: "a" }) + S.gnd(140, 220) + S.nmos(186, 150, { label: o.dev || "" , tcls: "s m" });
    s += S.wire([80, 150], [156, 150]) + S.wire([80, 150], [80, 162]) + S.vsrc(80, 180, o.in || "v_IN", { side: "left" }) + S.wire([80, 198], [80, 220], [200, 220], [200, 190]);
    return S.svg(400, 235, s, { max: 400, label: "Common-source MOSFET amplifier: R_L from V_S to the drain, source grounded, input at the gate" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "What an amplifier does", mins: 20,
    blurb: "Power gain, and why a dependent source can provide it.",
    takeaway: "An amplifier must give power gain: its output's v × i exceeds the input's, with the extra drawn from a power supply. A dependent source models it: a little power at the control port steers a lot at the output.",
    steps: [
      { k: "learn", title: "Three ports", b: [
        fig(S.svg(420, 150, S.box(150, 40, 120, 70, "Amp") + S.wire([60, 60], [150, 60]) + S.wire([60, 90], [150, 90]) + S.wire([270, 60], [360, 60]) + S.wire([270, 90], [360, 90]) + S.wire([190, 40], [190, 14]) + S.wire([230, 40], [230, 14]) + S.t(40, 80, "in", { a: "end" }) + S.t(380, 80, "out", { a: "start" }) + S.t(210, 10, "power supply", { cls: "s m" }), { max: 420, label: "Amplifier box with input, output and power ports" })),
        `<p>An amplifier has an input port, an output port and a power port. To count as an amplifier it must give <b>power gain</b>: more v × i comes out than goes in. The supply pays for it.</p>`,
        `<p class="aside">A transformer (later) can raise voltage but gives no power gain, so it isn't an amplifier.</p>`,
      ]},
      { k: "why", title: "What are they for?", b: [
        { t: "sort", q: "Sort each use.", bins: ["Amplification helps", "Not an amplifier job"], items: [
          ["Boost a weak signal before it travels down a noisy cable", 0, "Make the signal big compared with the noise it will meet."],
          ["Let a sensor with a high Thévenin resistance drive a heavy load (a buffer)", 0, "A buffer may even have voltage gain below 1, but it gives current and power gain, so the sensor isn't dragged down."],
          ["Drive a loudspeaker from a phone's tiny signal", 0, "Classic power amplification."],
          ["Turn a 12 V supply into more energy than it provides", 1, "Impossible. Amplifiers redirect supply power; they never create energy."],
        ]},
      ]},
      { k: "learn", title: "A dependent source amplifies", b: [
        fig(S.svg(480, 190, S.wire([50, 82], [50, 30], [140, 30]) + S.res(140, 30, 140, 160, "R_I", { side: "right" }) + S.wire([50, 118], [50, 160], [140, 160]) + S.vsrc(50, 100, "v_I", { side: "right" }) + S.dot(140, 30) +
          S.wire([330, 78], [330, 30], [430, 30]) + S.wire([330, 122], [330, 160], [430, 160]) + S.dep(330, 100, "i_O = −g_m·v_I", { side: "left" }) + S.res(430, 30, 430, 160, "R_L", { side: "right" }) + S.t(430, 18, "v_O", { cls: "a" }) + S.wire([140, 160], [330, 160]), { max: 480, label: "Input source across R_I; a VCCS controlled by v_I drives R_L" })),
        `<div class="tbl"><table><tbody>
          <tr><td>voltage gain</td><td class="mono">v<sub>O</sub>/v<sub>I</sub> = −g<sub>m</sub>R<sub>L</sub></td></tr>
          <tr><td>current gain</td><td class="mono">i<sub>O</sub>/i<sub>I</sub> = −g<sub>m</sub>R<sub>I</sub></td></tr>
          <tr><td>power gain</td><td class="mono">P<sub>O</sub>/P<sub>I</sub> = g<sub>m</sub>²R<sub>L</sub>R<sub>I</sub></td></tr></tbody></table></div>`,
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>g<sub>m</sub> = 2 mS, R<sub>L</sub> = 5 kΩ, R<sub>I</sub> = 10 kΩ.</p>`,
        { t: "num", q: "Voltage gain v_O/v_I?", a: -10, why: "−2 mS × 5 kΩ = −10. The minus sign means the output is upside down (inverted)." },
        { t: "num", q: "Power gain?", a: 200, hint: "g_m²·R_L·R_I.", why: "(0.002)² × 5000 × 10000 = 200." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Where does an amplifier's extra output power come from?", model: "From its power supply. The input signal only controls how much of the supply's power gets steered to the output, so a small input power can control a much larger output power." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "The real MOSFET curves", mins: 20,
    blurb: "Triode, saturation, cutoff.",
    takeaway: "For each v_GS > V_T, i_DS rises with v_DS (triode, resistor-like) until v_DS = v_GS − V_T, then flattens (saturation, current-source-like). Below V_T it's off (cutoff).",
    steps: [
      { k: "learn", title: "Where the SR model breaks", b: [
        `<p>Hold v<sub>GS</sub> fixed above V<sub>T</sub> and raise v<sub>DS</sub> from 0. At first i<sub>DS</sub> grows in a straight line (slope 1/R<sub>ON</sub>): the SR model. But as v<sub>DS</sub> nears v<sub>GS</sub> − V<sub>T</sub> the curve bends and goes <b>flat</b>. The current <b>saturates</b>.</p>`,
        `<p>A flat v–i line is a <b>current source</b>. Its height depends on v<sub>GS</sub>: a <b>voltage-controlled current source</b>.</p>`,
      ]},
      { k: "play", title: "Explore the family of curves", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let vgs = 2.5, vds = 3;
          function draw() {
            const fam = [1.5, 2, 2.5, 3, 3.5].map((g) => ({ f: (x) => iSU(g, x), cls: Math.abs(g - vgs) < 0.01 ? "s1" : "s5" }));
            fam.push({ f: (x) => (K / 2) * x * x, cls: "s4", to: 2.5 });
            const i = iSU(vgs, vds), r = vgs < VT ? "cutoff" : vds < vgs - VT ? "triode" : "saturation";
            f.innerHTML = plot({ x: [0, 6], y: [0, 7], xt: [0, 1, 2, 3, 4, 5, 6], yt: [0, 2, 4, 6], xl: "v_DS (V)", yl: "i_DS (mA)", series: fam, marks: [{ x: vds, y: i, label: r }], label: "MOSFET i_DS versus v_DS curves" });
            ro.innerHTML = readout([["v_GS − V_T", fmt(vgs - VT) + " V"], ["i_DS", fmt(i) + " mA"], ["region", r]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(slider({ id: id + "-g", label: "v_GS", min: 0.5, max: 3.5, step: 0.5, value: vgs, show: (x) => fmt(x) + " V" }, (x) => { vgs = x; draw(); }).el,
            slider({ id: id + "-d", label: "v_DS", min: 0, max: 6, step: 0.1, value: vds, show: (x) => fmt(x) + " V" }, (x) => { vds = x; draw(); }).el);
          host.append(f, box, ro);
          draw();
        },
        `<p class="aside">Red dashed curve = the boundary v<sub>DS</sub> = v<sub>GS</sub> − V<sub>T</sub>. Left of it: triode. Right of it: saturation. K = 2 mA/V², V<sub>T</sub> = 1 V.</p>`,
      ]},
      { k: "check", title: "Name the region", b: [
        { t: "sort", q: "V_T = 1 V. Which region?", bins: ["Cutoff", "Triode", "Saturation"], items: [
          ["v_GS = 0.8 V, v_DS = 5 V", 0, "v_GS < V_T: off."],
          ["v_GS = 3 V, v_DS = 0.5 V", 1, "v_DS = 0.5 < v_GS − V_T = 2."],
          ["v_GS = 3 V, v_DS = 4 V", 2, "v_DS = 4 ≥ 2."],
          ["v_GS = 2 V, v_DS = 1 V", 2, "v_DS = 1 = v_GS − V_T: right on the boundary, which counts as saturation (≥)."],
        ]},
      ]},
      { k: "learn", title: "Which model where?", b: [
        `<div class="tbl"><table><tbody>
          <tr><td>Digital gates</td><td>gate high, drain low → <b>triode</b> → SR (or S) model</td></tr>
          <tr><td>Amplifiers</td><td>keep the MOSFET in <b>saturation</b> → SCS model (next part)</td></tr></tbody></table></div>`,
        `<p class="aside">The SR and SCS models disagree right at the boundary. Fine, as long as you pick one model per analysis.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does 'saturation' mean for a MOSFET (it's not the BJT meaning)?", model: "Its drain current has stopped growing with drain-to-source voltage: the curve is flat. Then the MOSFET acts like a current source whose value is set by the gate-to-source voltage. That happens when v_DS is at least v_GS − V_T." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "The SCS model", mins: 20,
    blurb: "A switch plus a square-law current source.",
    takeaway: "SCS model (saturation only): i_DS = (K/2)(v_GS − V_T)² for v_GS ≥ V_T and v_DS ≥ v_GS − V_T; i_G = 0. K = K_n·W/L.",
    steps: [
      { k: "learn", title: "Switch–current source", b: [
        `<div class="eq">i<sub>DS</sub> = (K/2)(v<sub>GS</sub> − V<sub>T</sub>)²   (v<sub>GS</sub> ≥ V<sub>T</sub>, v<sub>DS</sub> ≥ v<sub>GS</sub> − V<sub>T</sub>)</div>`,
        `<p>Below V<sub>T</sub>: open. Gate current: always 0. K (in A/V²) grows with W/L: wider MOSFETs carry more current.</p>`,
        `<p>This is Chapter 4's square-law device, now with a control voltage.</p>`,
      ]},
      { k: "check", title: "Compute currents", b: [
        `<p>K = 2 mA/V², V<sub>T</sub> = 1 V.</p>`,
        { t: "num", q: "v_GS = 2.5 V, v_DS = 5 V (saturation). i_DS = ?", a: 2.25, unit: "mA", hint: "(K/2)(1.5)² = 1 × 2.25.", why: "2.25 mA. Notice v_DS didn't enter the formula." },
        { t: "num", q: "Keep v_GS = 2.5 V. Smallest v_DS that keeps it in saturation?", a: 1.5, unit: "V", why: "v_DS ≥ v_GS − V_T = 1.5 V." },
        { t: "num", q: "Keep v_DS = 4 V. Largest v_GS that keeps it in saturation?", a: 5, unit: "V", hint: "v_DS ≥ v_GS − V_T → v_GS ≤ v_DS + V_T.", why: "5 V. Above that it slips into triode." },
      ]},
      { k: "why", title: "Two MOSFETs, one current", b: [
        fig(S.svg(300, 260, S.supply(150, 40, "10 V") + S.wire([150, 40], [150, 60]) + S.nmos(136, 100, { label: "M1" }) + S.nmos(136, 180, { label: "M2" }) + S.dot(150, 140) + S.wire([150, 140], [240, 140]) + S.t(246, 145, "v_O", { a: "start", cls: "a" }) + S.gnd(150, 220) +
          S.wire([106, 100], [60, 100]) + S.t(54, 104, "6 V", { a: "end" }) + S.wire([106, 180], [60, 180]) + S.t(54, 184, "2 V", { a: "end" }), { max: 300, label: "Two identical MOSFETs stacked; gates at 6 V and 2 V" })),
        `<p>Two identical MOSFETs in series, both in saturation. M1's gate is at 6 V, M2's at 2 V (source grounded).</p>`,
        { t: "num", q: "v_O = ?", a: 4, unit: "V", hint: "Same current through both. In saturation the current depends only on v_GS, so their v_GS must be equal. M2's v_GS = 2 V. M1's v_GS = 6 − v_O.", why: "6 − v_O = 2 → v_O = 4 V. Check saturation: M2 has v_DS = 4 ≥ 1 ✓, M1 has v_DS = 6 ≥ 1 ✓." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why doesn't v_DS appear in the SCS current formula?", model: "In saturation the MOSFET's curves are flat, so the drain current doesn't depend on the drain-to-source voltage at all. Only the gate-to-source voltage sets it, which is exactly what a voltage-controlled current source does." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "The MOSFET amplifier", mins: 25,
    blurb: "The inverter circuit again, used in its steep middle.",
    takeaway: "Same circuit as the inverter. In saturation, v_O = V_S − (K/2)(v_IN − V_T)²·R_L. The slope (gain) is bigger than 1 in a middle range, and it changes with v_IN: the amplifier is nonlinear.",
    steps: [
      { k: "learn", title: "Same circuit, different job", b: [
        fig(ampFig()),
        `<p>It's the inverter! But now we use the region where the MOSFET is in <b>saturation</b>. With the SCS model and KCL at the drain:</p>`,
        `<div class="eq">v<sub>O</sub> = V<sub>S</sub> − R<sub>L</sub>·(K/2)(v<sub>IN</sub> − V<sub>T</sub>)²</div>`,
        `<p>With V<sub>S</sub> = 12 V, R<sub>L</sub> = 4 kΩ, K = 2 mA/V², V<sub>T</sub> = 1 V: <span class="mono">v<sub>O</sub> = 12 − 4(v<sub>IN</sub> − 1)²</span>.</p>`,
      ]},
      { k: "check", title: "Fill in a few points", b: [
        { t: "num", q: "v_IN = 2 V. v_O = ?", a: 8, unit: "V", why: "12 − 4·1 = 8 V." },
        { t: "num", q: "v_IN = 2.5 V. v_O = ?", a: 3, unit: "V", why: "12 − 4·2.25 = 3 V." },
        { t: "mcq", q: "From 2 V to 2.5 V the input rose 0.5 V and the output fell 5 V. What's the average gain there?", opts: [["−10", true, "−5/0.5. The output moves 10× more than the input, in the opposite direction."], ["+10", false, "The output went down while the input went up."], ["−2.5", false, "Check: Δv_O = −5, Δv_IN = 0.5."]] },
      ]},
      { k: "play", title: "Walk along the transfer curve", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let v = 1.8;
          function draw() {
            const vo = vout(v), g = (vout(v + 0.001) - vout(v - 0.001)) / 0.002;
            f.innerHTML = plot({ x: [0, 4], y: [0, 12.5], xt: [0, 1, 2, 3, 4], yt: [0, 3, 6, 9, 12], xl: "v_IN (V)", yl: "v_O (V)",
              series: [{ f: vout, cls: "s1", n: 400 }, { f: (x) => x - VT, cls: "s4", from: VT }], marks: [{ x: v, y: vo, label: region(v, vo) }], label: "Amplifier transfer curve" });
            ro.innerHTML = readout([["v_O", fmt(vo) + " V"], ["local gain dv_O/dv_IN", fmt(g, 3)], ["region", region(v, vo)]]);
          }
          host.append(f, slider({ id: id + "-v", label: "v_IN", min: 0, max: 4, step: 0.02, value: v, show: (x) => fmt(x) + " V" }, (x) => { v = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Red dashed: the line v<sub>O</sub> = v<sub>IN</sub> − V<sub>T</sub>. Below it the MOSFET is in triode and the SCS formula no longer applies.</p>`,
      ]},
      { k: "why", title: "Nonlinear gain", b: [
        { t: "mcq", q: "The local gain is about −4 near v_IN = 1.5 V but about −12 near 2.5 V. What does that do to a big sine wave at the input?", opts: [["Distorts it: one half of the wave gets amplified more than the other", true, "A nonlinear transfer curve changes the waveform's shape. Chapter 8 fixes this by keeping the input signal small."], ["Nothing, gain is gain", false, "Gain that changes with the input level reshapes the signal."], ["Removes it", false, "It's still amplified, just unevenly."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can the same circuit be an inverter or an amplifier?", model: "Its transfer curve has a flat high part, a steep falling middle and a flat low part. A logic inverter only uses the flat ends to give clean highs and lows. An amplifier biases the input into the steep middle, where small input changes make large output changes." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Biasing: the DC offset", mins: 20,
    blurb: "Lift the signal into the steep region, or it gets clipped.",
    takeaway: "Add a DC bias to the input so the whole signal stays in saturation. The bias sets the operating point (V_IN, V_O, I_D). With no bias, a signal centered at 0 V spends most of its time in cutoff and gets clipped.",
    steps: [
      { k: "play", title: "Find a good bias", b: [
        (host, id) => {
          const fi = el(`<div class="fig"></div>`), fo = el(`<div></div>`), ro = el(`<div></div>`);
          let VB = 0, A = 0.3;
          function draw() {
            const vin = (t) => VB + A * Math.sin(2 * Math.PI * t);
            let cut = 0, tri = 0;
            for (let k = 0; k < 200; k++) { const v = vin(k / 200), r = region(v, vout(v)); if (r === "cutoff") cut++; if (r === "triode") tri++; }
            fi.innerHTML = plot({ x: [0, 2], y: [-1, 4], xt: [0, 1, 2], yt: [-1, 0, 1, 2, 3, 4], xl: "t", yl: "v_IN (V)", h: 170, series: [{ f: vin, cls: "s2" }, { f: () => VT, cls: "s5" }], label: "Input" });
            fo.innerHTML = `<div class="fig">${plot({ x: [0, 2], y: [0, 12.5], xt: [0, 1, 2], yt: [0, 4, 8, 12], xl: "t", yl: "v_O (V)", h: 170, series: [{ f: (t) => vout(vin(t)), cls: "s1", n: 400 }], label: "Output" })}</div>`;
            ro.innerHTML = `<span class="verdict ${cut || tri ? "no" : "ok"}">${cut ? "Clipping: part of the wave is in cutoff (output stuck at 12 V)" : tri ? "Clipping: part of the wave drives it into triode" : "Whole wave stays in saturation"}</span>`;
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(slider({ id: id + "-b", label: "DC bias V_B", min: 0, max: 3, step: 0.05, value: VB, show: (x) => fmt(x) + " V" }, (x) => { VB = x; draw(); }).el,
            slider({ id: id + "-a", label: "Signal amplitude", min: 0.05, max: 1, step: 0.05, value: A, show: (x) => fmt(x) + " V" }, (x) => { A = x; draw(); }).el);
          host.append(fi, fo, box, ro);
          draw();
        },
        `<p class="aside">Start with bias 0 V: the output barely moves. Raise the bias until the output is a big, clean (upside-down) wave.</p>`,
      ]},
      { k: "learn", title: "Words for this", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>DC bias</b> (offset)</td><td>the constant voltage added to the input signal</td></tr>
          <tr><td><b>operating point</b> (bias point)</td><td>the DC values V<sub>IN</sub>, V<sub>O</sub>, I<sub>D</sub> with only the bias applied</td></tr>
          <tr><td><b>clipping</b></td><td>the output can't follow the input past some level, so the wave gets flattened</td></tr></tbody></table></div>`,
        `<p>Capital letters = DC values. The useful signal rides on top.</p>`,
      ]},
      { k: "check", title: "Pick an operating point", b: [
        { t: "num", q: "Bias V_IN = 1.5 V. Output operating voltage V_O = ?", a: 11, unit: "V", hint: "12 − 4(0.5)².", why: "11 V." },
        { t: "num", q: "And the drain current I_D?", a: 0.25, unit: "mA", hint: "(K/2)(0.5)² with K/2 = 1 mA/V².", why: "0.25 mA. Check: R_L drops 4 kΩ × 0.25 mA = 1 V, so V_O = 11 V ✓." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must an amplifier's input include a DC bias?", model: "The MOSFET only amplifies while it's in saturation, which needs the gate voltage above V_T. A signal centered on 0 V would spend most of its time below V_T, in cutoff, and get clipped. Adding a DC offset lifts the whole signal into the steep region." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "The saturation discipline and the load line", mins: 20,
    blurb: "A usage rule for amplifiers, and the graphical view.",
    takeaway: "Saturation discipline: always operate the MOSFET in saturation, so the SCS model applies and the amplifier gives gain. Graphically, the operating point is where the load line i = (V_S − v_DS)/R_L crosses the curve for the present v_GS.",
    steps: [
      { k: "learn", title: "A discipline for amplifiers", b: [
        `<div class="two"><div class="tile"><h3>Gates</h3><p>Static discipline: valid inputs → valid outputs.</p></div><div class="tile"><h3>Amplifiers</h3><p><b>Saturation discipline</b>: keep every MOSFET in saturation, for every input you'll apply.</p></div></div>`,
        `<p>Like a software function's comment that says "only call me with x ≥ 0": it limits how users may use the amplifier, and in return it promises good behavior (gain, a simple model).</p>`,
      ]},
      { k: "play", title: "The load line", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let v = 2;
          function draw() {
            const vo = vout(v), i = (VS - vo) / RL;
            const fam = [1.5, 2, 2.5, 3].map((g) => ({ f: (x) => (x >= g - VT ? (K / 2) * (g - VT) ** 2 : NaN), cls: Math.abs(g - v) < 0.01 ? "s1" : "s5" }));
            fam.push({ f: (x) => (VS - x) / RL, cls: "s2" }, { f: (x) => (K / 2) * x * x, cls: "s4", to: 2.5 });
            f.innerHTML = plot({ x: [0, 12], y: [0, 3.2], xt: [0, 3, 6, 9, 12], yt: [0, 1, 2, 3], xl: "v_DS (V)", yl: "i_DS (mA)", series: fam, marks: [{ x: vo, y: i, label: region(v, vo) }], label: "Load line on the MOSFET saturation curves" });
            ro.innerHTML = readout([["v_GS = v_IN", fmt(v) + " V"], ["v_O = v_DS", fmt(vo) + " V"], ["i_D", fmt(i) + " mA"]]);
          }
          host.append(f, slider({ id: id + "-v", label: "v_IN", min: 1, max: 3, step: 0.05, value: v, show: (x) => fmt(x) + " V" }, (x) => { v = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Blue: load line from (12 V, 0) to (0, 3 mA). Grey/orange: SCS curves (flat). Red dashed: saturation boundary. The operating point slides along the load line as v<sub>IN</sub> changes.</p>`,
      ]},
      { k: "why", title: "Why graphs?", b: [
        { t: "mcq", q: "The formula already gives v_O. When is the graphical method better?", opts: [["When you have a real device's measured curves (a datasheet) rather than a neat formula", true, "Real parts come with graphs. Draw the load line on them and read off the answer."], ["Never", false, "Graphs are often more accurate for real devices and give quick insight."], ["Only for resistors", false, "It shines precisely for nonlinear devices."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What two constraints meet at the operating point on a load-line graph?", model: "The resistor and supply force a straight-line relation between the MOSFET's current and its drain voltage: the load line. The MOSFET's own curve for the present gate voltage is the other. Both must hold, so the operating point is where they cross." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Valid ranges and the best operating point", mins: 25,
    blurb: "How far can the input swing before clipping?",
    takeaway: "Valid input range: from V_T (cutoff edge) up to where v_O = v_IN − V_T (triode edge), found with a quadratic. Bias in the middle of that range for the biggest symmetric input swing. The output swing comes out lopsided because the amplifier is nonlinear.",
    steps: [
      { k: "learn", title: "The bottom of the range", b: [
        `<p>Below v<sub>IN</sub> = V<sub>T</sub> the MOSFET is off. At V<sub>T</sub> exactly, i<sub>D</sub> = 0 and v<sub>O</sub> = V<sub>S</sub>, which is certainly ≥ v<sub>IN</sub> − V<sub>T</sub>: saturated.</p>`,
        `<div class="key">Lowest valid input = V<sub>T</sub> = 1 V, with v<sub>O</sub> = 12 V.</div>`,
      ]},
      { k: "math", title: "The top of the range", b: [
        `<p>It leaves saturation when v<sub>O</sub> = v<sub>IN</sub> − V<sub>T</sub>. Call x = v<sub>IN</sub> − V<sub>T</sub> and substitute into the transfer equation:</p>`,
        `<div class="eq">x = 12 − 4x²  →  4x² + x − 12 = 0</div>`,
        { t: "num", q: "Solve for the positive x (quadratic formula).", a: 1.611, tol: 0.01, unit: "V", hint: "x = (−1 + √(1 + 192))/8.", why: "√193 ≈ 13.89, so x ≈ 1.61 V." },
        { t: "num", q: "So the highest valid v_IN = ?", a: 2.611, tol: 0.01, unit: "V", why: "1 + 1.61 ≈ 2.61 V, with v_O ≈ 1.61 V there." },
        `<p class="aside">General result: v<sub>IN,max</sub> = V<sub>T</sub> + (−1 + √(1 + 2V<sub>S</sub>R<sub>L</sub>K))/(R<sub>L</sub>K).</p>`,
      ]},
      { k: "check", title: "Bias in the middle", b: [
        { t: "num", q: "Input bias for the largest symmetric input swing?", a: 1.806, tol: 0.01, unit: "V", hint: "Midpoint of 1 V and 2.61 V.", why: "≈ 1.81 V. The input can then swing about ±0.8 V." },
        { t: "num", q: "Output operating point V_O at that bias?", a: 9.4, tol: 0.02, unit: "V", hint: "12 − 4(0.806)².", why: "≈ 9.4 V." },
        { t: "mcq", q: "The output can swing from 9.4 V up to 12 V, but down to about 1.6 V. Why so lopsided?", opts: [["The transfer curve is a parabola: steeper at higher v_IN, so equal input steps make bigger output steps on one side", true, "Nonlinear gain makes equal input swings into unequal output swings. (A linear amplifier would give symmetric output swings.)"], ["The bias was chosen wrong", false, "It's the best choice for symmetric input swing. The asymmetry is built into the curve."], ["R_L is too big", false, "Any R_L gives a parabola."]] },
      ]},
      { k: "learn", title: "Large-signal analysis, the recipe", b: [
        `<ol><li>Find v<sub>O</sub> as a function of v<sub>IN</sub> assuming saturation.</li><li>Find where saturation ends at each side (cutoff and triode). That gives the valid input and output ranges.</li><li>Choose the operating point inside them (often the middle).</li></ol>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What limits the input swing on each side of the operating point?", model: "Going down, the input must stay above V_T or the MOSFET cuts off and the output sticks at V_S. Going up, the output falls, and once it drops below v_IN − V_T the MOSFET enters the triode region, where the amplifier stops working as designed." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Other amplifiers: source follower and BJT", mins: 25,
    blurb: "Output at the source, and a transistor controlled by current.",
    takeaway: "Source follower: output at the source, v_OUT tracks v_IN minus a gate–source drop (voltage gain under 1, useful as a buffer). BJT in its active region: v_BE ≈ 0.6 V and i_C = β·i_B, so the common-emitter amplifier is linear.",
    steps: [
      { k: "learn", title: "The source follower", b: [
        fig(S.svg(360, 230, S.supply(180, 40, "V_S = 10 V") + S.wire([180, 40], [180, 60]) + S.nmos(166, 100) + S.dot(180, 140) + S.wire([180, 140], [270, 140]) + S.t(276, 145, "v_OUT", { a: "start", cls: "a" }) + S.res(180, 140, 180, 200, "R = 2 kΩ", { side: "left" }) + S.gnd(180, 200) +
          S.wire([136, 100], [70, 100], [70, 132]) + S.vsrc(70, 150, "v_IN", { side: "left" }) + S.wire([70, 168], [70, 200], [180, 200]), { max: 360, label: "Source follower: drain to supply, resistor from source to ground, output at the source" })),
        `<p>Drain tied to the supply, resistor from source to ground, output at the source. Now v<sub>GS</sub> = v<sub>IN</sub> − v<sub>OUT</sub>. K = 2 mA/V², V<sub>T</sub> = 1 V.</p>`,
        `<div class="eq">v<sub>OUT</sub>/R = (K/2)(v<sub>IN</sub> − V<sub>T</sub> − v<sub>OUT</sub>)²</div>`,
      ]},
      { k: "check", title: "Solve it", b: [
        `<p>With v<sub>IN</sub> = 3 V (work in V, mA, kΩ): v/2 = (2 − v)², i.e. 2v² − 9v + 8 = 0.</p>`,
        { t: "num", q: "Which root is v_OUT?", a: 1.219, tol: 0.02, unit: "V", hint: "Roots: (9 ± √17)/4 ≈ 3.28 or 1.22. Saturation needs v_GS = 3 − v_OUT ≥ 1.", why: "1.22 V. The other root would make v_GS < V_T, which contradicts the SCS model being used." },
        { t: "mcq", q: "Why is it called a 'follower'?", opts: [["Raise v_IN and v_OUT rises too, staying roughly a gate–source drop below it", true, "Voltage gain just under 1, but it can deliver much more current than the input source: a buffer (Chapter 8 shows more)."], ["It follows the supply voltage", false, "It tracks the input."], ["Its output is inverted", false, "That's the common-source amp. The follower doesn't invert."]] },
      ]},
      { k: "learn", title: "Meet the BJT", b: [
        `<p>The <b>bipolar junction transistor</b> has base (B), collector (C), emitter (E). Its control is a <b>current</b> i<sub>B</sub>, not a voltage.</p>`,
        `<div class="tbl"><table><tbody>
          <tr><td>cutoff</td><td>i<sub>B</sub> = 0 → i<sub>C</sub> = 0</td></tr>
          <tr><td><b>active</b></td><td>i<sub>B</sub> > 0, v<sub>CE</sub> > 0.2 V: v<sub>BE</sub> ≈ 0.6 V, <b>i<sub>C</sub> = β·i<sub>B</sub></b> (β ≈ 100)</td></tr>
          <tr><td>saturation (BJT!)</td><td>v<sub>CE</sub> pinned at ≈ 0.2 V. Avoided in amplifiers.</td></tr></tbody></table></div>`,
        `<p class="aside">Confusing but standard: BJT "saturation" is the region we avoid, while MOSFET "saturation" is the one we want.</p>`,
      ]},
      { k: "check", title: "A BJT amplifier", b: [
        `<p>Common emitter: v<sub>IN</sub> drives the base through R<sub>I</sub> = 50 kΩ, R<sub>L</sub> = 5 kΩ from V<sub>S</sub> = 12 V to the collector, β = 100.</p>`,
        `<div class="eq">v<sub>O</sub> = V<sub>S</sub> − β·R<sub>L</sub>·(v<sub>IN</sub> − 0.6)/R<sub>I</sub></div>`,
        { t: "num", q: "Voltage gain dv_O/dv_IN?", a: -10, hint: "−β·R_L/R_I.", why: "−100 × 5/50 = −10, the same at every input level: a linear amplifier." },
        { t: "num", q: "v_IN = 1.0 V. v_O = ?", a: 8, unit: "V", why: "12 − 10 × 0.4 = 8 V." },
        { t: "num", q: "Highest v_IN before the BJT leaves its active region (v_O = 0.2 V)?", a: 1.78, tol: 0.01, unit: "V", hint: "0.2 = 12 − 10(v_IN − 0.6).", why: "v_IN − 0.6 = 1.18, so v_IN = 1.78 V. Valid range 0.6 V to 1.78 V; bias at the middle gives symmetric output swings, because the active-region BJT is linear." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Compare how a MOSFET and a BJT are controlled in their amplifying regions.", model: "A MOSFET in saturation is a current source set by its gate-to-source voltage, with a square-law relation and zero gate current. A BJT in its active region is a current source set by its base current, with a linear relation i_C = β·i_B, and its base-emitter voltage stays near 0.6 V." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Choosing a MOSFET model", mins: 15,
    blurb: "S, SR, SCS, SU: what each is for.",
    takeaway: "S: logic function only. SR: digital levels, power, delay. SCS: analog circuits under the saturation discipline. SU: both regions, accurately. With SU: guess each device's region, solve, then check the guess.",
    steps: [
      { k: "learn", title: "The SU model", b: [
        `<div class="tbl"><table><tbody>
          <tr><td>cutoff</td><td class="mono">v<sub>GS</sub> < V<sub>T</sub>: i = 0</td></tr>
          <tr><td>triode</td><td class="mono">K[(v<sub>GS</sub> − V<sub>T</sub>)v<sub>DS</sub> − v<sub>DS</sub>²/2]</td></tr>
          <tr><td>saturation</td><td class="mono">(K/2)(v<sub>GS</sub> − V<sub>T</sub>)²</td></tr></tbody></table></div>`,
        `<p>The triode formula is a nonlinear resistor that meets the saturation value smoothly at the boundary. It's what the curve widget in Part 2 used.</p>`,
        { t: "num", q: "K = 2 mA/V², V_T = 1 V, v_GS = 3 V, v_DS = 1 V (triode). i_DS = ?", a: 3, unit: "mA", hint: "2 × (2·1 − 1/2).", why: "2 × 1.5 = 3 mA. At the boundary v_DS = 2 V it gives 2 × (4 − 2) = 4 mA, exactly the saturation value." },
      ]},
      { k: "check", title: "Pick the model", b: [
        { t: "sort", q: "Which model fits each job?", bins: ["S", "SR", "SCS"], items: [
          ["Figure out which logic function a transistor circuit computes", 0, "Only on/off matters."],
          ["Check whether a gate's low output meets V_OL", 1, "Needs the R_ON divider."],
          ["Find an amplifier's gain and valid input range", 2, "Amplifiers run in saturation."],
          ["Estimate a gate's static power", 1, "Power = V_S²/(R_L + R_ON)."],
        ]},
      ]},
      { k: "learn", title: "Guess, solve, check (again)", b: [
        `<ol><li>Guess each MOSFET's region.</li><li>Write node equations using the matching formulas.</li><li>Solve, then check that each MOSFET's voltages really put it in the region you guessed. If not, re-guess.</li></ol>`,
        `<p class="aside">Same loop as Chapter 4's ideal diodes.</p>`,
      ]},
      { k: "learn", title: "Preview: the differential pair", b: [
        `<p>Two matched MOSFETs share one current source I<sub>S</sub> at their sources. The book shows that how I<sub>S</sub> splits between them depends only on the <b>difference</b> v<sub>IN1</sub> − v<sub>IN2</sub>: equal inputs give I<sub>S</sub>/2 each; a big enough difference steers it all to one side.</p>`,
        { t: "mcq", q: "Why would a circuit that responds only to the difference of two inputs be useful?", opts: [["Noise that hits both inputs equally cancels out", true, "That's the heart of the op amp (Chapter 15)."], ["It uses no power", false, "It still draws I_S."], ["It has no gain", false, "It has plenty of gain for the difference."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do we keep several MOSFET models instead of always using the most accurate one?", model: "Simpler models make analysis much easier and give insight, and they're accurate enough for many jobs. I use the simplest model that captures what matters for the question: on/off logic, digital levels, or amplifier behavior. I only reach for the full SU model when accuracy across regions really matters." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ch7", eyebrow: "Chapter 7", title: "The MOSFET Amplifier",
    intro: `<p>Nine parts. The MOSFET's other personality: not a switch, but a <b>voltage-controlled current source</b>. You'll build an amplifier, bias it, find its valid ranges, and meet the source follower and the BJT.</p><p class="aside">Arrow keys ← → move between steps. Need a refresher? <a href="06-mosfet-switch.html">Chapter 6</a>.</p>`,
    after: `<p>Open the Chapter 7 PDF and go to the <b>exercises and problems</b> at the end. In each MOSFET problem, state which region you assume, and check it at the end.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9],
    summary: `
      <h3>Amplifiers</h3>
      <p>Must give power gain; the supply provides it. Dependent-source model: v<sub>O</sub>/v<sub>I</sub> = −g<sub>m</sub>R<sub>L</sub>, i<sub>O</sub>/i<sub>I</sub> = −g<sub>m</sub>R<sub>I</sub>, P<sub>O</sub>/P<sub>I</sub> = g<sub>m</sub>²R<sub>L</sub>R<sub>I</sub>.</p>
      <h3>MOSFET regions</h3>
      <p>Cutoff: v<sub>GS</sub> < V<sub>T</sub>. Triode: v<sub>DS</sub> < v<sub>GS</sub> − V<sub>T</sub>. Saturation: v<sub>DS</sub> ≥ v<sub>GS</sub> − V<sub>T</sub> (boundary i = (K/2)v<sub>DS</sub>²).</p>
      <div class="eq">SCS: i_DS = (K/2)(v_GS − V_T)² · K = K_n·W/L · i_G = 0</div>
      <div class="eq">SU triode: i_DS = K[(v_GS − V_T)v_DS − v_DS²/2]</div>
      <h3>Common-source amplifier</h3>
      <div class="eq">v_O = V_S − (K/2)(v_IN − V_T)²·R_L</div>
      <p>Nonlinear gain. Saturation discipline: keep the MOSFET saturated. Load line: i<sub>DS</sub> = (V<sub>S</sub> − v<sub>DS</sub>)/R<sub>L</sub>.</p>
      <h3>Large-signal analysis</h3>
      <p>Valid input: V<sub>T</sub> ≤ v<sub>IN</sub> ≤ V<sub>T</sub> + (−1 + √(1 + 2V<sub>S</sub>R<sub>L</sub>K))/(R<sub>L</sub>K). Output: V<sub>S</sub> down to that x. Bias at the midpoint for maximum input swing; output swing is asymmetric. Operating point (V<sub>IN</sub>, V<sub>O</sub>, I<sub>D</sub>). No bias → clipping.</p>
      <h3>Source follower</h3>
      <p>v<sub>OUT</sub>/R = (K/2)(v<sub>IN</sub> − V<sub>T</sub> − v<sub>OUT</sub>)². Pick the root with v<sub>IN</sub> − v<sub>OUT</sub> ≥ V<sub>T</sub>. Valid: V<sub>T</sub> ≤ v<sub>IN</sub> ≤ V<sub>S</sub> + V<sub>T</sub>.</p>
      <h3>BJT</h3>
      <p>Active: i<sub>B</sub> > 0, v<sub>CE</sub> > 0.2 V, v<sub>BE</sub> ≈ 0.6 V, i<sub>C</sub> = βi<sub>B</sub>, i<sub>E</sub> = (β + 1)i<sub>B</sub>. Common emitter: v<sub>O</sub> = V<sub>S</sub> − βR<sub>L</sub>(v<sub>IN</sub> − 0.6)/R<sub>I</sub> (linear).</p>
      <h3>Model choice</h3>
      <p>S: logic. SR: digital levels, power. SCS: amplifiers. SU: both regions. Guess the region → solve → verify.</p>`,
  };
  Course.start(window.CHAPTER);
})();
