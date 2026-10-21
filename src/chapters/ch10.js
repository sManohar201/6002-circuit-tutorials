(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;

  // Series RC driven by a voltage source; output across C
  function rcFig(o = {}) {
    const s = S.wire([60, 82], [60, 30], [90, 30]) + S.res(90, 30, 210, 30, o.R || "R") + S.wire([210, 30], [260, 30]) + S.cap(260, 30, 260, 170, o.C || "C") + S.wire([60, 118], [60, 170], [260, 170]) + S.vsrc(60, 100, o.V || "v_I", { side: "right" }) +
      S.t(300, 60, "+", { cls: "big" }) + S.t(300, 160, "−", { cls: "big" }) + S.t(306, 110, o.out || "v_C", { a: "start", cls: "a" });
    return S.svg(360, 195, s, { max: 360, label: "Series RC circuit: source, resistor, capacitor" });
  }
  function rlFig(o = {}) {
    const s = S.wire([60, 82], [60, 30], [90, 30]) + S.res(90, 30, 210, 30, o.R || "R") + S.wire([210, 30], [260, 30]) + S.ind(260, 30, 260, 170, o.L || "L") + S.wire([60, 118], [60, 170], [260, 170]) + S.vsrc(60, 100, o.V || "v_S", { side: "right" }) + S.arrow(240, 60, 240, 90, "i_L", { lx: 228, ly: 80, a: "end" }) +
      S.t(300, 60, "+", { cls: "big" }) + S.t(300, 160, "−", { cls: "big" }) + S.t(306, 110, "v_L", { a: "start", cls: "a" });
    return S.svg(360, 195, s, { max: 360, label: "Series RL circuit" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "One storage element = one differential equation", mins: 20,
    blurb: "Write KCL as usual. You get dv/dt + v/RC = input.",
    takeaway: "With one capacitor or inductor, KVL/KCL give a first-order differential equation. Solve it as homogeneous (natural) + particular (forced) solution, then fix the constant with the initial condition.",
    steps: [
      { k: "learn", title: "The equation", b: [
        fig(S.svg(360, 180, S.wire([60, 72], [60, 30], [300, 30]) + S.wire([60, 108], [60, 150], [300, 150]) + S.isrc(60, 90, "i(t)") + S.res(180, 30, 180, 150, "R", { side: "right" }) + S.cap(300, 30, 300, 150, "C") + S.dot(180, 30) + S.dot(180, 150) + S.t(320, 22, "v_C", { cls: "a", a: "start" }), { max: 360, label: "Current source driving R and C in parallel" })),
        `<p>KCL at the top node: current from the source = current into R + current into C.</p>`,
        `<div class="eq">i(t) = v<sub>C</sub>/R + C·dv<sub>C</sub>/dt   ⟹   dv<sub>C</sub>/dt + v<sub>C</sub>/RC = i(t)/C</div>`,
        `<p>Same methods as Chapter 3. The only new thing: the answer is a <b>function of time</b>, and the equation contains its derivative.</p>`,
        `<p class="aside">Any linear circuit with one capacitor reduces to this via Thévenin/Norton.</p>`,
      ]},
      { k: "math", title: "Homogeneous + particular", b: [
        `<div class="tbl"><table><tbody>
          <tr><td class="mono">1</td><td><b>Homogeneous:</b> set the input to 0, guess v = Ae<sup>st</sup>. Plug in: s + 1/RC = 0, so s = −1/RC (the <b>characteristic equation</b> and its root, the <b>natural frequency</b>).</td></tr>
          <tr><td class="mono">2</td><td><b>Particular:</b> any one solution with the input on. For a constant input, guess a constant K.</td></tr>
          <tr><td class="mono">3</td><td><b>Total</b> = homogeneous + particular. Use the initial condition to find A.</td></tr></tbody></table></div>`,
        `<div class="key">Natural response e<sup>−t/RC</sup> depends only on the circuit. Forced response depends on the input. <b>RC is the time constant τ</b> (units: Ω·F = seconds).</div>`,
      ]},
      { k: "check", title: "Work the step", b: [
        `<p>i(t) = I₀ for t > 0, and v<sub>C</sub> = 0 before.</p>`,
        { t: "mcq", q: "Particular solution K?", opts: [["K = I₀R", true, "With dK/dt = 0: K/RC = I₀/C → K = I₀R. All the current ends up flowing through R."], ["K = I₀/C", false, "Check units: I₀/C is volts per second, not volts."], ["K = 0", false, "That only works with no input."]] },
        { t: "mcq", q: "Total: v = Ae^(−t/RC) + I₀R, and v(0) = 0 (the capacitor voltage can't jump). So A = ?", opts: [["−I₀R", true, "v = I₀R(1 − e^(−t/RC))."], ["I₀R", false, "Then v(0) = 2I₀R."], ["0", false, "Then v(0) = I₀R, a jump."]] },
      ]},
      { k: "why", title: "Why the capacitor voltage can't jump", b: [
        { t: "mcq", q: "Why may we set v_C(0⁺) = v_C(0⁻) here?", opts: [["A jump needs an infinite current (Chapter 9), and the source and resistor can only supply finite current", true, "This continuity condition is what connects 'before' to 'after'."], ["Because the source is a current source", false, "Voltage-source circuits obey it too, as long as nothing forces an impulse."], ["Capacitor voltages are always zero at t = 0", false, "They start at whatever they held before."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What do the natural and forced parts of the response each describe?", model: "The natural part, Ae^(−t/RC), is how the circuit relaxes on its own; its shape depends only on R and C. The forced part is where the input is pushing the circuit to settle. The constant A blends them so the solution starts from the right initial value." },
      ]},
    ],
  };

  /* =============== PART 2 (math) =============== */
  const p2 = {
    id: "p2", title: "Math boost: decaying exponentials", mins: 15,
    blurb: "e^(−t/τ): 37% left after τ, about gone after 5τ.",
    takeaway: "x = Ae^(−t/τ): drops to 37% at t = τ, under 1% at 5τ, and its starting slope would hit zero at exactly t = τ. Time to reach a level: t = τ·ln(start gap / end gap).",
    steps: [
      { k: "play", title: "Feel the curve", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let tau = 1, t = 1;
          function draw() {
            f.innerHTML = plot({ x: [0, 6], y: [0, 1.05], xt: [0, 1, 2, 3, 4, 5, 6], yt: [0, 0.37, 1], xl: "t", yl: "x/A", series: [{ f: (x) => Math.exp(-x / tau), cls: "s1" }, { f: (x) => 1 - x / tau, cls: "s5", to: tau }], marks: [{ x: t, y: Math.exp(-t / tau), label: fmt(Math.exp(-t / tau) * 100, 2) + "%" }], label: "Decaying exponential and its initial tangent" });
            ro.innerHTML = readout([["t/τ", fmt(t / tau)], ["remaining", fmt(Math.exp(-t / tau) * 100, 2) + " %"]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(slider({ id: id + "-tau", label: "Time constant τ", min: 0.5, max: 2, step: 0.1, value: tau }, (x) => { tau = x; draw(); }).el,
            slider({ id: id + "-t", label: "Time t", min: 0, max: 6, step: 0.1, value: t }, (x) => { t = x; draw(); }).el);
          host.append(f, box, ro);
          draw();
        },
        `<p class="aside">Dashed: the starting slope. It always reaches zero at t = τ, a handy sketching trick.</p>`,
      ]},
      { k: "check", title: "Landmarks", b: [
        { t: "num", q: "What percent remains after 1 time constant?", a: 36.8, tol: 0.02, unit: "%", why: "1/e ≈ 0.368." },
        { t: "num", q: "After 3 time constants?", a: 5, tol: 0.03, unit: "%", why: "e⁻³ ≈ 0.0498 ≈ 5%." },
        `<p class="aside">Rule of thumb: after 5τ (e⁻⁵ ≈ 0.7%) call the transient finished.</p>`,
      ]},
      { k: "math", title: "How long until...?", b: [
        `<p>A voltage moves from a start value toward a final value: gap(t) = gap(0)·e<sup>−t/τ</sup>. Solve for t:</p>`,
        `<div class="eq">t = τ · ln( gap at start / gap at the end )</div>`,
        { t: "num", q: "τ = 2 ms. A capacitor charges from 0 V toward 10 V. When does it reach 8 V?", a: 3.22, tol: 0.02, unit: "ms", hint: "Gap at start: 10 V. Gap at 8 V: 2 V. ln(5) ≈ 1.609.", why: "2 × ln 5 ≈ 3.22 ms." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does the time constant tell you, in plain words?", model: "It's the natural time scale of the circuit: after one time constant the remaining gap to the final value has shrunk to about a third, and after about five time constants the change is essentially over. A bigger τ means a slower circuit." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "RC step responses", mins: 20,
    blurb: "Charge, discharge, and starting from any voltage.",
    takeaway: "Series RC with a step V and initial capacitor voltage V₀: v_C = V + (V₀ − V)e^(−t/RC). The current jumps to (V − V₀)/R and decays with the same τ. Total response = zero-input response + zero-state response.",
    steps: [
      { k: "play", title: "Step a series RC", b: [
        fig(rcFig({ V: "step V" })),
        (host, id) => {
          const f = el(`<div class="fig"></div>`), g = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let R = 2, C = 1, V = 5, V0 = 0;
          function draw() {
            const tau = R * C, v = (t) => (t < 0 ? V0 : V + (V0 - V) * Math.exp(-t / tau)), i = (t) => (t < 0 ? 0 : ((V - V0) / R) * Math.exp(-t / tau));
            f.innerHTML = plot({ x: [-1, 10], y: [-5.5, 10.5], xt: [0, 2, 4, 6, 8, 10], yt: [-5, 0, 5, 10], xl: "t (ms)", yl: "v_C (V)", h: 200, series: [{ f: v, cls: "s1", n: 400 }], marks: [{ x: tau, y: v(tau), label: "t = τ" }], label: "Capacitor voltage" });
            g.innerHTML = plot({ x: [-1, 10], y: [-8, 8], xt: [0, 2, 4, 6, 8, 10], yt: [-5, 0, 5], xl: "t (ms)", yl: "i_C (mA)", h: 170, series: [{ f: i, cls: "s2", n: 400 }], label: "Capacitor current" });
            ro.innerHTML = readout([["τ = RC", fmt(tau) + " ms"], ["i_C(0⁺)", fmt((V - V0) / R) + " mA"], ["at 5τ", fmt(v(5 * tau)) + " V"]]);
          }
          const box = el(`<div class="sliders"></div>`);
          [["R", "R", 0.5, 4, 0.5, "kΩ", (x) => (R = x)], ["C", "C", 0.5, 2, 0.25, "µF", (x) => (C = x)], ["V", "step V", -5, 10, 1, "V", (x) => (V = x)], ["V0", "initial V₀", -5, 10, 1, "V", (x) => (V0 = x)]].forEach(([k, lab, a, b, st, u, set]) =>
            box.appendChild(slider({ id: id + k, label: lab, min: a, max: b, step: st, value: { R, C, V, V0 }[k], show: (x) => fmt(x) + " " + u }, (x) => { set(x); draw(); }).el));
          host.append(f, g, box, ro);
          draw();
        },
        `<p class="aside">The voltage is continuous. The current jumps at t = 0: at that instant the capacitor acts like a voltage source V₀ (or a short if V₀ = 0).</p>`,
      ]},
      { k: "check", title: "Discharge", b: [
        `<p>A 4 µF capacitor at 10 V is connected across 5 kΩ at t = 0.</p>`,
        { t: "num", q: "τ = ?", a: 20, unit: "ms", why: "5 kΩ × 4 µF = 20 ms." },
        { t: "num", q: "Voltage at t = 20 ms?", a: 3.68, tol: 0.02, unit: "V", why: "10 × e⁻¹ ≈ 3.68 V." },
        { t: "num", q: "When does it reach 1 V?", a: 46.05, tol: 0.02, unit: "ms", hint: "t = τ ln(10/1).", why: "20 × 2.303 ≈ 46 ms." },
      ]},
      { k: "learn", title: "Two pieces that add", b: [
        `<div class="eq">v<sub>C</sub> = V₀e<sup>−t/RC</sup> + V(1 − e<sup>−t/RC</sup>)</div>`,
        `<div class="two"><div class="tile"><h3>Zero-input response (ZIR)</h3><p>Initial state V₀, input off. Pure decay.</p></div><div class="tile"><h3>Zero-state response (ZSR)</h3><p>Start at 0 V, input on. Pure charge-up.</p></div></div>`,
        `<p>Total = ZIR + ZSR. Solve the zero-state problem once and you can add any initial condition later.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Right after a step is applied to an uncharged series RC, what does the capacitor look like and what current flows?", model: "Its voltage can't jump, so it's still 0 V: it acts like a short circuit at that instant. The whole step voltage appears across R, so the current jumps to V/R and then decays as the capacitor charges." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "The shortcut: initial, final, time constant", mins: 25,
    blurb: "Sketch any first-order step response without solving anything.",
    takeaway: "x(t) = final + (initial − final)·e^(−t/τ). Initial: the state (v_C or i_L) is continuous. Final: C → open, L → short at DC. τ = R_TH·C or L/R_TH, with R_TH seen by the storage element.",
    steps: [
      { k: "learn", title: "Three numbers", b: [
        `<div class="key">x(t) = <b>final</b> + (<b>initial</b> − <b>final</b>)·e<sup>−t/τ</sup></div>`,
        `<div class="tbl"><table><thead><tr><th></th><th>Capacitor</th><th>Inductor</th></tr></thead><tbody>
          <tr><td>at the switching instant</td><td>v<sub>C</sub> unchanged: acts like a voltage source (a short if 0 V)</td><td>i<sub>L</sub> unchanged: acts like a current source (an open if 0 A)</td></tr>
          <tr><td>long after (DC)</td><td>open circuit</td><td>short circuit</td></tr>
          <tr><td>time constant</td><td class="mono">R<sub>TH</sub>·C</td><td class="mono">L/R<sub>TH</sub></td></tr></tbody></table></div>`,
        `<p class="aside">R<sub>TH</sub>: the Thévenin resistance the C or L sees, with sources off.</p>`,
      ]},
      { k: "check", title: "Try it", b: [
        fig(S.svg(420, 190, S.wire([60, 82], [60, 30], [90, 30]) + S.res(90, 30, 190, 30, "6 kΩ") + S.wire([190, 30], [330, 30]) + S.res(240, 30, 240, 170, "3 kΩ", { side: "right" }) + S.cap(330, 30, 330, 170, "1 µF") + S.wire([60, 118], [60, 170], [330, 170]) + S.vsrc(60, 100, "9 V step", { side: "right" }) + S.dot(240, 30) + S.dot(240, 170) + S.t(350, 22, "v_C", { a: "start", cls: "a" }), { max: 420, label: "9 V step through 6 kΩ into 3 kΩ in parallel with 1 µF" })),
        `<p>The capacitor starts at 0 V; the 9 V source steps on at t = 0.</p>`,
        { t: "num", q: "Final v_C?", a: 3, unit: "V", hint: "Capacitor = open: plain 6k/3k divider.", why: "9 × 3/9 = 3 V." },
        { t: "num", q: "τ?", a: 2, unit: "ms", hint: "R_TH seen by C: 6 kΩ ∥ 3 kΩ (source shorted).", why: "2 kΩ × 1 µF = 2 ms." },
        { t: "num", q: "Current through the 6 kΩ right at t = 0⁺?", a: 1.5, unit: "mA", hint: "C acts like a short at 0⁺, so it shorts out the 3k too.", why: "9 V/6 kΩ = 1.5 mA. Later it settles to 9/9k = 1 mA." },
      ]},
      { k: "check", title: "A capacitor current", b: [
        { t: "mcq", q: "In that circuit, the capacitor current at 0⁺ and at the end?", opts: [["1.5 mA at 0⁺, decaying to 0 with τ = 2 ms", true, "Initially all of the 6k's current goes into the 'short' capacitor; finally none does."], ["0 at 0⁺, rising to 1.5 mA", false, "Upside down: a capacitor carries no current at DC."], ["1 mA constant", false, "Capacitor currents only flow while v_C changes."]] },
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<p>A student says: "At t = 0⁺ the capacitor is a short, so the capacitor voltage drops to 0 V even though it was charged to 4 V."</p>`,
        { t: "mcq", q: "What's wrong?", opts: [["A capacitor acts like a short only if it was uncharged. A charged one acts like a 4 V source at that instant: its voltage can't jump", true, "'Short at t = 0' is shorthand for 'holds its voltage, which happened to be 0'."], ["Capacitors are opens at t = 0", false, "That's at DC, long after."], ["Nothing", false, "Its voltage can't jump from 4 V to 0."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe the three-number method for a first-order step response.", model: "Find the starting value using continuity of the capacitor voltage or inductor current; find the final value by treating capacitors as opens and inductors as shorts at DC; find the time constant from the Thévenin resistance the element sees. Then connect start to finish with an exponential with that time constant." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "RL circuits", mins: 20,
    blurb: "τ = L/R. The current is the smooth one.",
    takeaway: "Series RL with a step V: i_L = (V/R)(1 − e^(−tR/L)), v_L = Ve^(−tR/L). The inductor current can't jump, so suddenly opening a switch in series with an inductor creates a huge voltage spike.",
    steps: [
      { k: "learn", title: "The dual story", b: [
        fig(rlFig()),
        `<div class="eq">L·di<sub>L</sub>/dt + R·i<sub>L</sub> = v<sub>S</sub>   →   s = −R/L,  τ = L/R</div>`,
        `<p>At the step: i<sub>L</sub> stays 0 (inductor acts like an <b>open</b>), so v<sub>L</sub> jumps to V. Finally the inductor is a <b>short</b>: i<sub>L</sub> = V/R, v<sub>L</sub> = 0.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>V = 12 V, R = 60 Ω, L = 30 mH.</p>`,
        { t: "num", q: "τ = ?", a: 0.5, unit: "ms", why: "0.03/60 = 0.5 ms." },
        { t: "num", q: "Final current?", a: 0.2, unit: "A", why: "12/60 = 0.2 A." },
        { t: "num", q: "i_L at t = 1 ms?", a: 0.173, tol: 0.02, unit: "A", hint: "0.2(1 − e⁻²).", why: "0.2 × 0.865 ≈ 0.173 A." },
      ]},
      { k: "why", title: "The inductor kick", b: [
        { t: "mcq", q: "A switch in series with a coil carrying 0.2 A is suddenly opened. An open switch is a huge resistance. What happens?", opts: [["The current can't stop instantly, so it forces itself through that huge resistance, making a huge voltage spike that can arc and damage the switch", true, "v = L·di/dt with di/dt enormous. That's why relay coils get a diode across them."], ["The current stops instantly with no drama", false, "That would need infinite voltage, and the circuit gets as close to that as it can."], ["The inductor's voltage drops to 0", false, "It shoots up, not down."]] },
      ]},
      { k: "learn", title: "Preview: sine drive", b: [
        `<p>Drive series RL with V sin(ωt). After the transient dies, the current is a sine at the same frequency, but:</p>`,
        `<div class="tbl"><table><tbody><tr><td>low frequency (ωL ≪ R)</td><td>i ≈ (V/R) sin ωt: inductor ≈ short</td></tr><tr><td>high frequency (ωL ≫ R)</td><td>i ≈ −(V/ωL) cos ωt: small, and 90° behind</td></tr></tbody></table></div>`,
        `<p>Doing this with differential equations is a lot of algebra. Chapter 13 shows a much faster way (impedances).</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Right after a voltage step, why does an uncharged inductor look like an open circuit?", model: "Its current can't change instantly, so it's still zero just after the step, the same as an open circuit. All the step voltage appears across it, and that voltage is what starts the current ramping up." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Square waves, pulses and impulses", mins: 20,
    blurb: "Compare τ with the input's timing. Short pulses: only area matters.",
    takeaway: "τ ≪ period: output follows the square wave with rounded corners. τ ≫ period: output is a small triangle wave, roughly the integral of the input. A pulse much shorter than τ acts like an impulse: response ≈ (area/RC)·e^(−t/RC).",
    steps: [
      { k: "play", title: "Square wave into RC", b: [
        fig(rcFig()),
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let ratio = 0.1;
          function draw() {
            const T = 1, tau = ratio * T, dt = 0.002, N = 3 / dt; let v = 0; const pts = [], inp = [];
            for (let k = 0; k <= N; k++) { const t = k * dt, vi = Math.floor(t / (T / 2)) % 2 === 0 ? 1 : -1; pts.push([t, v]); inp.push([t, vi]); v += ((vi - v) / tau) * dt; }
            f.innerHTML = plot({ x: [0, 3], y: [-1.2, 1.2], xt: [0, 1, 2, 3], yt: [-1, 0, 1], xl: "t / period", yl: "volts", series: [{ pts: inp, cls: "s5" }, { pts, cls: "s1" }], label: "Square wave input and capacitor voltage" });
          }
          host.append(f, slider({ id: id + "-r", label: "τ / period", min: 0.02, max: 3, log: true, value: ratio, show: (x) => fmt(x, 2) }, (x) => { ratio = x; draw(); }).el);
          draw();
        },
        `<p class="aside">Small τ: rounded square. Medium τ: shark fins. Large τ: a small triangle wave, the integral of the square wave (an integrator, improved in Chapter 15 with an op amp).</p>`,
      ]},
      { k: "learn", title: "Short pulses", b: [
        `<p>A pulse of height V<sub>p</sub> and width t<sub>p</sub> into an RC. If t<sub>p</sub> ≪ RC, the capacitor barely charges, so the current is about V<sub>p</sub>/R the whole time and</p>`,
        `<div class="eq">v<sub>C</sub>(t<sub>p</sub>) ≈ V<sub>p</sub>t<sub>p</sub>/RC = (pulse area)/RC</div>`,
        `<p>The response depends on the pulse's <b>area</b>, not its height or shape. In the limit it's the <b>impulse response</b>: input A·δ(t) → v<sub>C</sub> = (A/RC)e<sup>−t/RC</sup>.</p>`,
        { t: "num", q: "RC = 1 ms. A 10 V, 10 µs pulse. Peak v_C ≈ ?", a: 0.1, unit: "V", hint: "Area = 10 V × 10 µs = 100 µV·s.", why: "100 µV·s / 1 ms = 0.1 V." },
        { t: "mcq", q: "Same area but 20 V for 5 µs?", opts: [["Same ≈ 0.1 V peak", true, "Only the area matters when the pulse is much shorter than τ."], ["Twice as big", false, "Twice the height but half the width."], ["Half as big", false, "Same area, same response."]] },
      ]},
      { k: "learn", title: "Linearity tricks", b: [
        `<p>For zero-state responses: the response to the <b>integral</b> of an input is the integral of the response. Same for derivatives.</p>`,
        `<p>Example: a ramp is the integral of a step, so the RC ramp response is the integral of the step response: v<sub>C</sub> = S(t − RC) + S·RC·e<sup>−t/RC</sup>. After the transient, the output is the input ramp delayed by τ.</p>`,
        { t: "num", q: "Input ramps at 2 V/ms into an RC with τ = 0.5 ms. Long after, how far behind (in volts) is v_C?", a: 1, unit: "V", hint: "Delayed by τ: slope × τ.", why: "2 V/ms × 0.5 ms = 1 V behind." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a very short pulse's shape stop mattering to an RC circuit?", model: "During a pulse much shorter than RC the capacitor voltage hardly changes, so the current just follows the input divided by R. The charge delivered, and therefore the capacitor voltage at the end, is the integral of the input: its area. Two pulses with the same area leave the same voltage behind." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Propagation delay", mins: 25,
    blurb: "Why gates are slow, and how to compute it.",
    takeaway: "A gate output must charge the next gate's C_GS through R_L (rising) or discharge it through R_L ∥ R_ON (falling). t_pd = time to cross V_OH or V_OL. The gate abstraction gains a timing promise: outputs valid within t_pd. Long wires add R and C that grow with length (RC ∝ length²).",
    steps: [
      { k: "learn", title: "Definitions", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>t<sub>pd,1→0</sub></b></td><td>input falls 1→0 instantly; time until the output reaches a valid level</td></tr>
          <tr><td><b>t<sub>pd,0→1</sub></b></td><td>input rises 0→1; time until the output is valid</td></tr>
          <tr><td><b>t<sub>pd</sub></b></td><td>the larger of the two (over all input–output pairs)</td></tr>
          <tr><td>rise/fall time</td><td>an output's own time from its lowest value to V<sub>OH</sub> (or highest to V<sub>OL</sub>)</td></tr></tbody></table></div>`,
        `<div class="key">Revised gate abstraction: outputs are valid no later than <b>t<sub>pd</sub></b> after an input change, and then depend only on the inputs and obey the static discipline.</div>`,
        { t: "num", q: "Inverters have t_pd = 1 ns, OR gates 2 ns. A path goes inverter → OR → inverter. Rough delay?", a: 4, unit: "ns", why: "Delays along a path add: 1 + 2 + 1." },
      ]},
      { k: "learn", title: "The model", b: [
        `<p>Inverter A drives inverter B. Use the SRC model: B's input is a capacitor C<sub>GS</sub>.</p>`,
        `<div class="two"><div class="tile"><h3>A's output rising (A's input falls)</h3><p>A's MOSFET turns off. C<sub>GS</sub> charges from V<sub>S</sub>·R<sub>ON</sub>/(R<sub>ON</sub>+R<sub>L</sub>) toward V<sub>S</sub> through R<sub>L</sub>.</p></div><div class="tile"><h3>A's output falling</h3><p>A's MOSFET turns on. C<sub>GS</sub> discharges toward V<sub>S</sub>·R<sub>ON</sub>/(R<sub>ON</sub>+R<sub>L</sub>) through R<sub>L</sub> ∥ R<sub>ON</sub> (Thévenin).</p></div></div>`,
      ]},
      { k: "play", title: "Delay calculator", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let RL = 20, RON = 4, C = 50;
          const VS = 5, VOH = 4, VOL = 1;
          function draw() {
            const Vlo = (VS * RON) / (RON + RL), tauR = RL * C * 1e-3, RTH = (RL * RON) / (RL + RON), tauF = RTH * C * 1e-3; // ns
            const tr = tauR * Math.log((VS - Vlo) / (VS - VOH)), tf = Vlo < VOL ? tauF * Math.log((VS - Vlo) / (VOL - Vlo)) : Infinity;
            const up = (t) => VS + (Vlo - VS) * Math.exp(-t / tauR), dn = (t) => Vlo + (VS - Vlo) * Math.exp(-t / tauF);
            f.innerHTML = plot({ x: [0, 6], y: [0, 5.2], xt: [0, 1, 2, 3, 4, 5, 6], yt: [0, 1, 4, 5], xl: "t (ns)", yl: "v_OUT (V)", series: [{ f: up, cls: "s1" }, { f: dn, cls: "s2" }, { f: () => VOH, cls: "s4" }, { f: () => VOL, cls: "s4" }], label: "Rising and falling gate outputs with V_OH and V_OL" });
            ro.innerHTML = readout([["low level", fmt(Vlo) + " V"], ["rising: τ = R_L·C", fmt(tauR) + " ns"], ["t_pd,1→0 (to V_OH)", fmt(tr) + " ns"], ["falling: τ = (R_L∥R_ON)·C", fmt(tauF) + " ns"], ["t_pd,0→1 (to V_OL)", isFinite(tf) ? fmt(tf) + " ns" : "never (low level > V_OL)"], ["t_pd", isFinite(tf) ? fmt(Math.max(tr, tf)) + " ns" : "—"]]);
          }
          const box = el(`<div class="sliders"></div>`);
          [["RL", "R_L", 5, 40, 1, "kΩ", (x) => (RL = x)], ["RON", "R_ON", 0.5, 8, 0.5, "kΩ", (x) => (RON = x)], ["C", "C_GS (+ wire)", 10, 300, 10, "fF", (x) => (C = x)]].forEach(([k, lab, a, b, st, u, set]) =>
            box.appendChild(slider({ id: id + k, label: lab, min: a, max: b, step: st, value: { RL, RON, C }[k], show: (x) => fmt(x) + " " + u }, (x) => { set(x); draw(); }).el));
          host.append(f, box, ro);
          draw();
        },
        `<p class="aside">V<sub>S</sub> = 5 V, V<sub>OH</sub> = 4 V, V<sub>OL</sub> = 1 V. Orange: output rising. Blue: output falling.</p>`,
      ]},
      { k: "check", title: "Work it by hand", b: [
        `<p>V<sub>S</sub> = 5 V, R<sub>L</sub> = 20 kΩ, R<sub>ON</sub> = 4 kΩ, C<sub>GS</sub> = 50 fF, V<sub>OH</sub> = 4 V, V<sub>OL</sub> = 1 V.</p>`,
        { t: "num", q: "Rising: start at 5·4/24 ≈ 0.833 V, τ = R_L·C = 1 ns. Time to reach 4 V?", a: 1.427, tol: 0.02, unit: "ns", hint: "t = τ ln((5 − 0.833)/(5 − 4)).", why: "ln(4.167) ≈ 1.43 ns." },
        { t: "num", q: "Falling: from 5 V toward 0.833 V, τ = (20k∥4k)·50 fF ≈ 0.167 ns. Time to reach 1 V?", a: 0.536, tol: 0.03, unit: "ns", hint: "t = τ ln((5 − 0.833)/(1 − 0.833)) = τ ln 25.", why: "0.167 × 3.22 ≈ 0.54 ns. So t_pd ≈ 1.43 ns, set by the slower pull-up through R_L." },
        `<p class="aside">Ballpark: t<sub>pd</sub> ≈ (resistance it charges through) × C.</p>`,
      ]},
      { k: "learn", title: "Long wires", b: [
        `<p>A wire of length L, width W: R<sub>wire</sub> = (L/W)R□ and C<sub>wire</sub> = L·W·C₀. So</p>`,
        `<div class="eq">R<sub>wire</sub>C<sub>wire</sub> = L²·R□·C₀</div>`,
        { t: "num", q: "R□ = 1 Ω, C₀ = 1 fF/µm², W = 1 µm, L = 2000 µm. R_wire·C_wire = ?", a: 4, unit: "ns", hint: "R = 2 kΩ, C = 2 pF.", why: "4 ns, way more than the gate itself. Double the length and it becomes 16 ns." },
        { t: "mcq", q: "Why does a gate's t_pd depend on what it's connected to?", opts: [["Its delay is set by the capacitance it must charge: the next gates' C_GS plus any wire", true, "Catalogs quote t_pd for a typical load (often 4 minimum inverters, the 'fan-out of 4' delay)."], ["It doesn't", false, "Bigger load capacitance, bigger delay."], ["Only the gate's own size matters", false, "The load counts too."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must the static discipline be revised once we include capacitance?", model: "With capacitance, an output takes time to move between valid levels and passes through the forbidden region on the way. So the discipline now promises valid outputs within a finite time, the propagation delay, after the inputs become valid, instead of instantly." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "State, and solving with a computer", mins: 20,
    blurb: "dx/dt = f(x, input): step forward a little at a time.",
    takeaway: "A state variable (v_C or i_L) sums up all the past. First-order circuits give dx/dt = f(x, input). Euler's method steps it forward: x(t + Δt) ≈ x(t) + f·Δt. That works even for nonlinear circuits.",
    steps: [
      { k: "learn", title: "State equation form", b: [
        `<div class="eq">dv<sub>C</sub>/dt = −v<sub>C</sub>/RC + v<sub>I</sub>/RC</div>`,
        `<p>"The rate of change of the state = a function of the present state and the present input." Know the state now and the input from now on, and the whole future follows.</p>`,
      ]},
      { k: "play", title: "Euler's method", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let dt = 0.5;
          function draw() {
            const tau = 1, V = 1, pts = []; let v = 0, t = 0;
            while (t <= 5 + 1e-9) { pts.push([t, v]); v += ((V - v) / tau) * dt; t += dt; }
            const err = Math.max(...pts.map(([t, v]) => Math.abs(v - (1 - Math.exp(-t)))));
            f.innerHTML = plot({ x: [0, 5], y: [0, 1.4], xt: [0, 1, 2, 3, 4, 5], yt: [0, 0.5, 1], xl: "t / τ", yl: "v_C / V", series: [{ f: (t) => 1 - Math.exp(-t), cls: "s5" }, { pts, cls: "s1" }], marks: pts.slice(0, 40).map(([x, y]) => ({ x, y, r: 3 })), label: "Euler steps versus the exact curve" });
            ro.innerHTML = readout([["step Δt", fmt(dt) + " τ"], ["steps", String(pts.length - 1)], ["worst error", fmt(err * 100, 2) + " %"]]);
          }
          host.append(f, slider({ id: id + "-dt", label: "Step size Δt", min: 0.05, max: 1.5, step: 0.05, value: dt, show: (x) => fmt(x) + " τ" }, (x) => { dt = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Each step: compute the slope from the present state, walk along it for Δt. Smaller steps, better accuracy, more work. Try Δt above 1τ and watch it overshoot.</p>`,
      ]},
      { k: "check", title: "One Euler step by hand", b: [
        { t: "num", q: "RC = 1 ms, v_I = 10 V, v_C = 2 V now. Euler with Δt = 0.1 ms: v_C next = ?", a: 2.8, unit: "V", hint: "Slope = (10 − 2)/1 ms = 8 V/ms.", why: "2 + 8 × 0.1 = 2.8 V. (Exact: 10 − 8e^(−0.1) ≈ 2.76 V.)" },
      ]},
      { k: "why", title: "Why bother?", b: [
        { t: "mcq", q: "When is the step-by-step method really needed?", opts: [["When the circuit is nonlinear or has many storage elements, so there's no neat closed-form answer", true, "Circuit simulators like SPICE do exactly this (with smarter step rules)."], ["Never: formulas always exist", false, "Most real circuits don't have closed-form answers."], ["Only for resistive circuits", false, "Resistive circuits have no derivatives to step."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What makes a variable a 'state variable'?", model: "Its present value contains all the information about the past that the future needs. Given the state at one moment and the inputs from then on, I can work out everything that happens later without knowing the history." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Clocks and digital memory", mins: 25,
    blurb: "Time discretization, clock fanout, and a 1-bit memory from a capacitor.",
    takeaway: "A clock lumps time into valid and transitioning periods. A clock driver's rise and fall times limit how much capacitance it can drive. A switch + capacitor + buffer stores a bit (a dynamic latch) until leakage pulls a stored 1 below V_IH.",
    steps: [
      { k: "learn", title: "Why clocks", b: [
        `<p>Signals spend time in the forbidden zone while switching. How does a receiver know when to look? A shared <b>clock</b>: senders may change outputs only while the clock is low; receivers look only while it is high.</p>`,
        `<div class="key">The clock discipline is <b>time discretization</b>: lumping time into "valid" and "don't look" intervals, just as Chapter 5 lumped voltage values.</div>`,
      ]},
      { k: "check", title: "How much can one clock driver drive?", b: [
        `<p>A clock inverter charges all the gates it drives (they add in parallel: C<sub>eq</sub> = ΣC<sub>GS</sub>) through R = 2 kΩ. V<sub>S</sub> = 5 V, V<sub>OL</sub> = 1 V, V<sub>OH</sub> = 4 V.</p>`,
        `<div class="eq">t<sub>r</sub> = R·C<sub>eq</sub>·ln((5 − 1)/(5 − 4)) = 1.386·R·C<sub>eq</sub></div>`,
        { t: "num", q: "For a symmetric 250 MHz clock, t_r must be under half of the 4 ns period. Max C_eq?", a: 0.72, tol: 0.02, unit: "pF", hint: "1.386 × 2 kΩ × C < 2 ns.", why: "C < 2 ns / 2.77 kΩ ≈ 0.72 pF." },
        { t: "num", q: "Each gate input is 80 fF. Max fanout?", a: 9, hint: "720 fF / 80 fF, rounded down.", why: "9. Real chips use a tree of buffers so no driver sees too many gates." },
      ]},
      { k: "learn", title: "A one-bit memory", b: [
        fig(S.svg(440, 170, S.wire([30, 60], [120, 60]) + `<g transform="rotate(-90 160 60)">${S.sw(160, 20, 100, false)}</g>` + S.wire([200, 60], [260, 60]) + S.dot(240, 60) + S.cap(240, 60, 240, 150, "C_M", { side: "left" }) + S.gnd(240, 150) + S.wire([260, 60], [284, 60]) + S.gate("buf", 280, 60) + S.wire([320, 60], [380, 60]) +
          S.t(24, 64, "d_IN", { a: "end" }) + S.t(160, 30, "store", { cls: "s m" }) + S.t(388, 64, "d_OUT", { a: "start" }), { max: 440, label: "Switch, storage capacitor and buffer forming a one-bit memory" })),
        `<p>Store = 1: the switch closes and C<sub>M</sub> copies d<sub>IN</sub>. Store = 0: the switch opens and C<sub>M</sub> <b>holds</b> the value. The buffer restores levels (the static discipline) and protects C<sub>M</sub> from being drained by whatever reads it. Its own gate capacitance can even serve as C<sub>M</sub>.</p>`,
      ]},
      { k: "check", title: "How long does it remember?", b: [
        `<p>Leakage acts like R<sub>P</sub> across C<sub>M</sub>. A stored 1 (5 V) decays; it stays valid until it falls to V<sub>IH</sub> = 3.5 V.</p>`,
        { t: "num", q: "C_M = 2 pF, R_P = 500 MΩ. Hold time?", a: 0.357, tol: 0.03, unit: "ms", hint: "t = R_P·C_M·ln(5/3.5). R_P·C_M = 1 ms.", why: "1 ms × ln(1.43) ≈ 0.36 ms. That's why DRAM must be refreshed regularly." },
        { t: "mcq", q: "Does a stored 0 also expire?", opts: [["No: leakage drains toward 0 V, so a 0 stays a 0", true, "Only stored 1s fade. A static latch adds a weak 'trickle' switch to top up stored 1s forever."], ["Yes, it rises to 1 eventually", false, "Leakage to ground pulls toward 0 V."], ["Yes, it becomes forbidden", false, "It stays near 0 V."]] },
      ]},
      { k: "learn", title: "Memory in use", b: [
        `<p>Chapter 5's porch light switched off the moment motion stopped. Put a memory element in: motion M drives <b>store</b>, and NOT-daytime drives d<sub>IN</sub>. Now a nighttime motion event stores a 1 and the light <b>stays on</b>. A reset input (wired to daytime) clears it in the morning.</p>`,
        `<p>Memory also saves hardware: add a long list of numbers with one adder plus one memory holding the running total. The running total is a <b>digital state variable</b>.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the simple switch-and-capacitor memory need a buffer?", model: "Without it, the stored voltage isn't restored to clean logic levels, so it wouldn't meet the static discipline, and anything reading it could drain the capacitor's charge. The buffer restores proper levels and its high input resistance protects the stored charge." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ch10", eyebrow: "Chapter 10", title: "First-Order Transients",
    intro: `<p>Nine parts. Circuits with one capacitor or inductor: setting up and solving the equation, the <b>initial–final–time constant</b> shortcut, RL circuits, pulses, then the payoff: <b>gate delay</b>, clocks and <b>digital memory</b>.</p><p>Part 2 is a short math boost on exponentials in time.</p><p class="aside">Arrow keys ← → move between steps. Need a refresher? <a href="09-energy-storage.html">Chapter 9</a>.</p>`,
    after: `<p>Open the Chapter 10 PDF and go to the <b>exercises and problems</b> at the end. For step problems, try the initial/final/τ shortcut first, then check it against the differential equation.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9],
    summary: `
      <h3>Setting up</h3><p>KCL/KVL + element laws → first-order ODE, e.g. dv<sub>C</sub>/dt + v<sub>C</sub>/RC = i/C. Solve: homogeneous Ae<sup>st</sup> (s = −1/RC or −R/L) + particular (constant for a step), then the initial condition.</p>
      <h3>Exponentials</h3><p>e<sup>−1</sup> ≈ 37%, e<sup>−3</sup> ≈ 5%, e<sup>−5</sup> < 1%. Initial tangent hits zero at τ. Time to a level: t = τ ln(start gap/end gap).</p>
      <h3>Universal step formula</h3>
      <div class="eq">x(t) = final + (initial − final)·e^(−t/τ) · τ = R_TH·C or L/R_TH</div>
      <p>v<sub>C</sub>, i<sub>L</sub> continuous. At the switching instant: C = voltage source (short if uncharged), L = current source (open if no current). DC: C open, L short.</p>
      <p>Series RC step: v<sub>C</sub> = V + (V₀ − V)e<sup>−t/RC</sup>, i<sub>C</sub>(0⁺) = (V − V₀)/R. Series RL step: i<sub>L</sub> = (V/R)(1 − e<sup>−tR/L</sup>). Opening an inductor's circuit → voltage spike.</p>
      <h3>ZIR + ZSR</h3><p>Total = zero-input (initial state, no input) + zero-state (input, zero initial state). ZSR of an integrated input = integral of the ZSR. Ramp into RC → ramp delayed by τ.</p>
      <h3>Waveforms</h3><p>Square wave: τ ≪ T rounded copy; τ ≫ T ≈ integral (triangle). Pulse with t<sub>p</sub> ≪ RC → v ≈ (area/RC)e<sup>−t/RC</sup> (impulse response).</p>
      <h3>Propagation delay</h3>
      <p>t<sub>pd</sub> = max(t<sub>pd,1→0</sub>, t<sub>pd,0→1</sub>), time until the output is valid. Rising: charge C through R<sub>L</sub> from V<sub>S</sub>R<sub>ON</sub>/(R<sub>ON</sub>+R<sub>L</sub>). Falling: discharge through R<sub>L</sub>∥R<sub>ON</sub>. Path delays add. Wire: RC = L²R□C₀.</p>
      <h3>State and computation</h3><p>dx/dt = f(x, input). Euler: x(t+Δt) ≈ x(t) + f·Δt.</p>
      <h3>Clocks and memory</h3><p>Clock = time discretization. Fanout limited by t<sub>r</sub> = R·C<sub>eq</sub>·ln((V<sub>S</sub>−V<sub>OL</sub>)/(V<sub>S</sub>−V<sub>OH</sub>)). Dynamic latch: switch + C<sub>M</sub> + buffer; a 1 holds for R<sub>P</sub>C<sub>M</sub>ln(V<sub>S</sub>/V<sub>IH</sub>). Static latch: trickle switch.</p>`,
  };
  Course.start(window.CHAPTER);
})();
