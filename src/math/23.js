(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;

  const p1 = {
    id: "p1", title: "Elements in the s-domain", mins: 20,
    blurb: "Each element becomes an impedance in s. Stored energy becomes a small source in series.",
    takeaway: "Resistor: V = R·I. Inductor: V = sL·I − L·i(0): impedance sL in series with a source of strength L·i(0). Capacitor: V = I/(sC) + v(0)/s: impedance 1/(sC) in series with a step source v(0)/s. With zero initial energy, only the impedances remain: Z_R = R, Z_L = sL, Z_C = 1/(sC). Put s = jω and these become the phasor impedances jωL and 1/(jωC) of 6.002 Chapter 13.",
    steps: [
      { k: "learn", title: "The three elements", b: [
        `<div class="tbl"><table><tr><th>Element</th><th>Time law</th><th>s-domain</th><th>Impedance</th></tr>
          <tr><td>R</td><td>v = Ri</td><td>V = RI</td><td>R</td></tr>
          <tr><td>L</td><td>v = L di/dt</td><td>V = sLI − Li(0)</td><td>sL</td></tr>
          <tr><td>C</td><td>i = C dv/dt</td><td>V = I/(sC) + v(0)/s</td><td>1/(sC)</td></tr></table></div>`,
        `<p class="aside">The L and C rows come straight from the derivative rule, sF − f(0) (Module 20, Part 1).</p>`,
      ]},
      { k: "learn", title: "Initial energy as a source", b: [
        fig(S.svg(520, 150, S.cap(60, 30, 60, 120, "", {}) + S.t(90, 80, "C, v(0)", { a: "start" }) + S.t(200, 80, "→", { cls: "big" }) +
          S.res(320, 20, 320, 75, "1/(sC)", {}) + S.vsrc(320, 105, "v(0)/s", {}) + `<line class="w" x1="320" y1="127" x2="320" y2="140"/>`, { label: "A charged capacitor becomes an impedance 1/(sC) in series with a source v(0)/s" })),
        `<p>A capacitor charged to v(0) acts like an uncharged one in series with a battery of v(0) switched on at t = 0. That's what v(0)/s means.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Impedance of a 10 mH inductor in the s-domain?", opts: [["0.01s Ω", true, "sL."], ["1/(0.01s) Ω", false, "That's a capacitor's form."], ["j0.01 Ω", false, "That's ω = 1 rad/s substituted already."]] },
        { t: "mcq", q: "Put s = jω into 1/(sC). You get…", opts: [["1/(jωC): the phasor impedance of a capacitor", true, "The s-domain contains the phasor domain."], ["jωC", false, "Upside down."], ["Nothing useful", false, "It's exactly 6.002 Chapter 13's impedance."]] },
        { t: "mcq", q: "An inductor carries i(0) = 2 A, L = 0.5 H. Its s-domain voltage is sL·I − ?", opts: [["1 (from L·i(0) = 0.5 × 2)", true, "A source of strength Li(0) in series."], ["2/s", false, "That form belongs to a capacitor's v(0)/s."], ["0", false, "Only if i(0) = 0."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the s-domain handle a capacitor that starts charged?", model: "It becomes an uncharged capacitor with impedance one over s C, in series with a step voltage source of the initial voltage, written v of zero over s. Then the circuit can be analysed with zero initial conditions plus that extra source." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Analyse it like a resistor circuit", mins: 25,
    blurb: "Dividers, series and parallel, node equations: all the resistive tools work with s-impedances.",
    takeaway: "Replace each element by its s-impedance (plus initial-condition sources), each source by its transform, then use the resistive methods of 6.002 Chapters 2–3. RC low-pass with a step: V_out = (V_S/s)·(1/(sC))/(R + 1/(sC)) = V_S/[s(sRC + 1)]. Series RLC with a step V: I(s) = V/[L(s² + (R/L)s + 1/(LC))]; with V = 10 V, R = 2 Ω, L = 1 H, C = 0.2 F: I = 10/((s + 1)² + 4) → i = 5e^(−t) sin 2t A.",
    steps: [
      { k: "learn", title: "Same tools, new impedances", b: [
        `<ul><li>Series: Z<sub>total</sub> = Z₁ + Z₂ · Parallel: Z₁Z₂/(Z₁ + Z₂)</li><li>Divider: V<sub>out</sub> = V<sub>in</sub>·Z₂/(Z₁ + Z₂)</li><li>Node equations, Thévenin: unchanged, just with s in them</li></ul>`,
        steps([["RC low-pass, step V_S/s, v(0) = 0", "V_out = (V_S/s)·[1/(sC)]/[R + 1/(sC)]"], ["× sC top and bottom", "V_out = V_S/[s(sRC + 1)]"], ["Invert", "v_out = V_S(1 − e^(−t/RC))"]]),
      ]},
      { k: "math", title: "Series RLC current", b: [
        `<p>10 V step into R = 2 Ω, L = 1 H, C = 0.2 F in series, all initially at rest.</p>`,
        { t: "reveal", label: "Total impedance", html: `<div class="eq">Z = 2 + s + 1/(0.2s) = (s² + 2s + 5)/s</div>` },
        { t: "reveal", label: "Current", html: `<div class="eq">I = (10/s)/Z = 10/(s² + 2s + 5) = 5·2/((s + 1)² + 2²)</div>` },
        { t: "reveal", label: "Invert", html: `<div class="eq">i(t) = 5e<sup>−t</sup> sin 2t  A</div><p class="aside">Check: i(0) = 0 ✓ (an inductor's current can't jump); i(∞) = 0 ✓ (the capacitor blocks dc).</p>` },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "R = 1 kΩ in series with C = 1 µF, step of 5 V. Current I(s) = ?", opts: [["5/(1000(s + 1000)) A, so i = 5e^(−1000t) mA", true, "(5/s)/(R + 1/(sC)) = 5C/(sRC + 1)."], ["5/(s(s + 1000))", false, "That's a voltage-like form with an extra 1/s."], ["5/(1000s)", false, "That ignores the capacitor."]] },
        { t: "num", q: "In the RLC example, i(t) = 5e^(−t) sin 2t. Current at t = 0.5 s? (A)", a: 2.552, unit: "A", tol: 0.01, why: "5 × 0.6065 × sin 1 = 5 × 0.6065 × 0.8415 = 2.55 A." },
        { t: "mcq", q: "Impedance of R ∥ C in the s-domain?", opts: [["R/(sRC + 1)", true, "R·(1/sC)/(R + 1/sC), then × sC top and bottom."], ["R + 1/(sC)", false, "That's series."], ["sRC/(R + 1)", false, "Check the algebra with s → 0: R ∥ (open) should be R."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can you analyse an RLC circuit with the same methods as a resistor circuit once it's in the s-domain?", model: "In the s-domain every element obeys a simple proportional law, V equals Z of s times I, just like Ohm's law. So series, parallel, divider and node methods all work unchanged; the impedances just contain s." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Transfer functions, poles and zeros", mins: 25,
    blurb: "H(s) = output/input. Its poles and zeros, drawn on the s-plane, predict the whole frequency response.",
    takeaway: "With zero initial conditions, H(s) = Output(s)/Input(s). Zeros: roots of the top. Poles: roots of the bottom (the natural frequencies). Frequency response = H(jω). Geometry: |H(jω)| = K × (product of distances from the zeros to the point jω) ÷ (product of distances from the poles to jω). As jω passes close to a pole, |H| peaks; at a zero, it dips. Series RLC band-pass V_R/V_in = (R/L)s/(s² + (R/L)s + 1/LC): a zero at 0, a pair of poles, a peak at ω₀.",
    steps: [
      { k: "learn", title: "H(s), poles and zeros", b: [
        `<div class="eq">H(s) = V<sub>out</sub>(s)/V<sub>in</sub>(s)</div>`,
        `<div class="two"><div class="tile"><h3>RC low-pass</h3><div class="eq">1/(1 + sRC)</div><p>one pole at −1/RC, no zeros</p></div><div class="tile"><h3>RLC band-pass (output across R)</h3><div class="eq">(R/L)s / (s² + (R/L)s + 1/LC)</div><p>zero at 0, two poles</p></div></div>`,
        `<p class="aside">s = jω turns H(s) into the H(jω) of <a href="16-bode.html">Module 16</a>.</p>`,
      ]},
      { k: "play", title: "Distances make the frequency response", b: [
        (host, id) => {
          const pf = el(`<div class="fig"></div>`), mf = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 0.3, w0 = 2, w = 1.5;
          function draw() {
            const wd = Math.sqrt(Math.max(w0 * w0 - a * a, 0)), K = 2 * a;
            const mag = (x) => (K * Math.abs(x)) / (Math.hypot(a, x - wd) * Math.hypot(a, x + wd));
            /* s-plane with vectors to jω */
            const X = (x) => 200 + x * 50, Y = (y) => 150 - y * 40;
            let s = `<line class="axis" x1="20" y1="150" x2="300" y2="150" style="stroke:var(--muted)"/><line class="axis" x1="200" y1="10" x2="200" y2="290" style="stroke:var(--muted)"/>` + S.t(296, 166, "σ", { a: "end" }) + S.t(210, 20, "jω", { a: "start" });
            s += `<line class="w" x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(w)}" style="stroke:var(--good)"/>`;
            [[-a, wd], [-a, -wd]].forEach(([x, y]) => { s += `<line class="w" x1="${X(x)}" y1="${Y(y)}" x2="${X(0)}" y2="${Y(w)}" style="stroke:var(--bad);stroke-dasharray:5 4"/>` + `<text x="${X(x) - 6}" y="${Y(y) + 5}" text-anchor="middle" class="big" style="fill:var(--bad)">×</text>`; });
            s += `<circle cx="${X(0)}" cy="${Y(0)}" r="6" style="fill:none;stroke:var(--good);stroke-width:3"/><circle class="nd" cx="${X(0)}" cy="${Y(w)}" r="6"/>` + S.t(X(0) + 10, Y(w) - 6, "s = jω", { a: "start", cls: "lab" });
            pf.innerHTML = S.svg(320, 300, s, { label: "s-plane: poles (×), zero (o) and the vectors to the point jω" });
            mf.innerHTML = plot({ x: [0, 5], y: [0, 1.2], xt: [0, 1, 2, 3, 4, 5], yt: [0, 0.5, 0.707, 1], xl: "ω (rad/s)", yl: "|H(jω)|", h: 220, series: [{ f: mag, cls: "s1", n: 500 }], marks: [{ x: w, y: mag(w) }], label: "Band-pass magnitude against frequency" });
            ro.innerHTML = readout([["Poles", `−${fmt(a, 3)} ± j${fmt(wd, 3)}`], ["Zero", "0"], ["|H| = K·(zero distance)/(pole distances)", fmt(mag(w), 3)], ["Q = ω₀/(2α)", fmt(w0 / (2 * a), 3)]]);
          }
          host.append(pf, mf, slider({ id: id + "-w", label: "Frequency ω (the point moving up the axis)", min: 0, max: 5, step: 0.05, value: w, show: (v) => fmt(v, 3) + " rad/s" }, (v) => { w = v; draw(); }).el,
            slider({ id: id + "-a", label: "Damping α = R/2L", min: 0.05, max: 1.5, step: 0.05, value: a }, (v) => { a = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">ω₀ = 2 rad/s. As the green point slides past the upper pole, the red pole distance becomes tiny and |H| peaks. Less damping puts the poles nearer the axis, giving a sharper peak (higher Q: 6.002 Chapter 14).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "RC low-pass with R = 10 kΩ, C = 0.1 µF. Pole location? (s⁻¹)", a: -1000, tol: 0.001, why: "−1/RC = −1/(10⁻³) = −1000 s⁻¹ (f_c = 159 Hz)." },
        { t: "mcq", q: "H(s) = (s + 10)/((s + 1)(s + 100)). Zeros and poles?", opts: [["Zero at −10; poles at −1 and −100", true, "Top roots are zeros, bottom roots poles."], ["Zero at 10; poles at 1 and 100", false, "Signs: s + 10 = 0 at s = −10."], ["Poles at −10; zeros at −1, −100", false, "Swapped."]] },
        { t: "mcq", q: "Why does |H(jω)| of a lightly damped RLC peak sharply near ω₀?", opts: [["The poles sit close to the jω axis, so one pole distance gets very small there", true, "Small denominator → big |H|."], ["Because there's a zero at ω₀", false, "Zeros make dips, not peaks."], ["Because ω₀ is a pole", false, "The poles are at −α ± jω_d, slightly left of the axis."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do the poles and zeros on the s-plane predict a circuit's frequency response?", model: "The magnitude at frequency omega is the product of distances from the zeros to the point j omega divided by the product of distances from the poles to it. Near a pole close to the axis the response peaks; near a zero it dips. So the pole-zero map shows the shape of the Bode plot." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Impulse response, stability and oscillators", mins: 25,
    blurb: "h(t) = ℒ⁻¹{H(s)}. Poles in the left half: stable. On the jω axis: an oscillator. And the integrator.",
    takeaway: "Impulse response h(t) = ℒ⁻¹{H(s)}; step response = ℒ⁻¹{H(s)/s}; any input: Y(s) = H(s)X(s) (in time this is convolution, y = h * x). Stable ⟺ every pole has a negative real part. Poles exactly on the jω axis give a sustained sinusoid: that's an oscillator, where Boylestad Chapter 14's condition βA = 1 puts the poles. Ideal op-amp integrator H(s) = −1/(sRC): a pole at 0, so a step input gives a ramp (Boylestad Chapters 10–11).",
    steps: [
      { k: "learn", title: "One function, every input", b: [
        `<div class="eq">Y(s) = H(s)·X(s)</div>`,
        `<div class="tbl"><table><tr><th>Input x(t)</th><th>X(s)</th><th>Output</th></tr><tr><td>impulse δ(t)</td><td>1</td><td>h(t) = ℒ⁻¹{H}</td></tr><tr><td>step u(t)</td><td>1/s</td><td>ℒ⁻¹{H/s}</td></tr><tr><td>anything</td><td>X(s)</td><td>ℒ⁻¹{HX}</td></tr></table></div>`,
        `<p class="aside">Multiplying in s corresponds to convolution in time, y(t) = ∫₀ᵗ h(τ)x(t − τ)dτ. You rarely need the integral: multiply, then invert.</p>`,
      ]},
      { k: "play", title: "Push the poles across", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), g = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let sig = -0.3;
          const w = 2;
          function draw() {
            g.innerHTML = plot({ x: [-1.5, 1], y: [-3, 3], xt: [-1, 0, 1], yt: [-2, 0, 2], xl: "σ", yl: "jω", h: 180, w: 280, areas: [{ f: () => 3, from: 0, to: 1, base: -3, cls: "ar2" }], marks: [{ x: sig, y: w, cls: "mkb", r: 7 }, { x: sig, y: -w, cls: "mkb", r: 7 }], label: "Pole pair position" });
            f.innerHTML = plot({ x: [0, 12], y: [-4, 4], xt: [0, 4, 8, 12], yt: [-4, -2, 0, 2, 4], xl: "t", h: 200, series: [{ f: (t) => Math.exp(sig * t) * Math.sin(w * t), cls: "s1", n: 500 }], label: "Impulse response for that pole pair" });
            ro.innerHTML = readout([["h(t) = e^(σt) sin 2t", "σ = " + fmt(sig, 3)], ["Verdict", sig < -1e-9 ? "stable: dies away" : sig > 1e-9 ? "unstable: grows" : "on the axis: sustained oscillation (an oscillator)"]]);
          }
          host.append(g, f, slider({ id: id + "-s", label: "Real part of the poles", min: -1, max: 0.2, step: 0.05, value: sig }, (v) => { sig = Math.abs(v) < 0.026 ? 0 : v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">An oscillator is designed to sit exactly on the axis. In practice the gain is set slightly into the right half so oscillation starts, and something nonlinear (clipping, a lamp, a diode) holds the amplitude.</p>`,
      ]},
      { k: "learn", title: "The integrator", b: [
        `<div class="eq">H(s) = −1/(sRC)</div>`,
        `<p>A pole at s = 0. Step input V/s: output −V/(s²RC) → −(V/RC)·t, a ramp, which is Boylestad's integrator result. In time: dividing by s means integrating (Module 20, Part 1).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "H(s) = 1/(s² − s + 4). Stable?", opts: [["No: poles at 0.5 ± j1.94 are in the right half", true, "Real part +0.5: growing oscillation."], ["Yes", false, "Complete the square: (s − 0.5)² + 3.75."], ["Only for small inputs", false, "Linear stability doesn't depend on input size."]] },
        { t: "num", q: "Integrator with R = 100 kΩ, C = 1 µF, input step 2 V. Output slope in V/s (magnitude)?", a: 20, unit: "V/s", why: "V/RC = 2/0.1 = 20 V/s (until the op amp saturates)." },
        { t: "mcq", q: "H(s) = 3/(s + 3). Impulse response h(t)?", opts: [["3e^(−3t)", true, "ℒ⁻¹ directly."], ["1 − e^(−3t)", false, "That's the step response, ℒ⁻¹{H/s}."], ["3δ(t)", false, "That would be H = 3."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do the poles of H(s) tell you whether a circuit is stable, or an oscillator?", model: "Each pole contributes a term e to the pole times t. If every pole has a negative real part, all terms die away and the circuit is stable. A pole with positive real part grows, so it's unstable. Poles exactly on the imaginary axis give a sinusoid that neither grows nor decays, which is what an oscillator is designed to do." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m23", eyebrow: "Math Toolkit · Module 23", title: "Circuits in the s-Domain",
    intro: `<p>Four parts: elements as s-impedances, analysing circuits like resistor networks, transfer functions with poles and zeros, then impulse response, stability, oscillators and the integrator. This ties the track back to both books.</p><p class="aside">Where it connects: 6.002 Chapters 10 and 12 (transients), 13 and 14 (impedance, resonance, Q); Boylestad Chapters 9 (cutoffs), 10–11 (integrator, filters) and 14 (oscillators).</p>`,
    after: `<p>For any linear circuit you can now: write H(s), place its poles and zeros, read off the transient shape, stability and frequency response, and invert for an exact time answer.</p>`,
    parts: [p1, p2, p3, p4],
    summary: `
      <p>Z<sub>R</sub> = R · Z<sub>L</sub> = sL (plus source Li(0)) · Z<sub>C</sub> = 1/(sC) (plus source v(0)/s). s = jω gives phasor impedances.</p>
      <p>Use series/parallel, dividers and node equations with s-impedances. Series RLC step: I = V/[L(s² + (R/L)s + 1/LC)].</p>
      <div class="eq">H(s) = Out/In     Y = H·X     h(t) = ℒ⁻¹{H}     step response ℒ⁻¹{H/s}</div>
      <p>|H(jω)| = K·∏(zero distances)/∏(pole distances). Stable ⟺ all poles have Re &lt; 0. Poles on the jω axis → oscillator. Integrator −1/(sRC): pole at 0, step → ramp.</p>`,
  };
  Course.start(window.CHAPTER);
})();
