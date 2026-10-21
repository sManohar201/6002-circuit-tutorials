(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;

  /* Series RLC simulator (RK4). Loop: v_in − R·i − L·di/dt − v_C = 0, C·dv_C/dt = i. Returns samples [t, vC, i]. */
  function simRLC(R, L, C, vin, v0, i0, T, N = 800) {
    const dt = T / N, out = [];
    let v = v0, i = i0;
    const f = (t, v, i) => [i / C, (vin(t) - R * i - v) / L];
    for (let k = 0; k <= N; k++) {
      const t = k * dt;
      out.push([t, v, i]);
      const a = f(t, v, i), b = f(t + dt / 2, v + (dt / 2) * a[0], i + (dt / 2) * a[1]), c = f(t + dt / 2, v + (dt / 2) * b[0], i + (dt / 2) * b[1]), d = f(t + dt, v + dt * c[0], i + dt * c[1]);
      v += (dt / 6) * (a[0] + 2 * b[0] + 2 * c[0] + d[0]);
      i += (dt / 6) * (a[1] + 2 * b[1] + 2 * c[1] + d[1]);
    }
    return out;
  }
  function seriesRLC(o = {}) {
    let s = S.wire([60, 82], [60, 30], [80, 30]) + S.res(80, 30, 170, 30, o.R || "R") + S.ind(170, 30, 270, 30, o.L || "L") + S.wire([270, 30], [300, 30]) + S.cap(300, 30, 300, 170, o.C || "C", { side: "left" }) + S.wire([60, 118], [60, 170], [300, 170]);
    s += o.src === false ? S.wire([60, 82], [60, 118]) : S.vsrc(60, 100, o.V || "v_IN", { side: "right" });
    s += S.t(330, 60, "+", { cls: "big" }) + S.t(330, 160, "−", { cls: "big" }) + S.t(336, 110, "v_C", { a: "start", cls: "a" }) + S.arrow(190, 52, 240, 52, "i_L", { ly: 72 });
    return S.svg(390, 195, s, { max: 390, label: o.src === false ? "Undriven series RLC loop" : "Series RLC circuit driven by v_IN" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Two storage elements: ringing", mins: 15,
    blurb: "Add wire inductance to the inverter link and the edges ring.",
    takeaway: "With one capacitor and one inductor (two independent states), circuits can oscillate. That's ringing, and it can delay when a digital signal becomes valid.",
    steps: [
      { k: "learn", title: "What a long wire does", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`);
          const sim = simRLC(300, 80e-9, 0.2e-12, (t) => (t > 0 ? 5 : 0), 0, 0, 2e-9, 600);
          f.innerHTML = plot({ x: [0, 2], y: [0, 7.5], xt: [0, 0.5, 1, 1.5, 2], yt: [0, 1, 4, 5], xl: "t (ns)", yl: "v_IN2 (V)", series: [{ f: () => 5, cls: "s5" }, { pts: sim.map(([t, v]) => [t * 1e9, v]), cls: "s1" }], label: "Ringing at the second inverter's input" });
          host.append(f);
        },
        `<p>Chapter 10: a gate's output charges the next gate's C<sub>GS</sub> smoothly. Add the long wire's <b>inductance</b> and the received edge <b>overshoots and rings</b>. The signal isn't valid until the ringing stays out of the forbidden zone.</p>`,
      ]},
      { k: "learn", title: "Second order", b: [
        `<p>One capacitor + one inductor = two independent states (v<sub>C</sub> and i<sub>L</sub>) → a <b>second-order</b> differential equation. Same tools as before (node method, homogeneous + particular), one more derivative.</p>`,
        `<p class="aside">Second-order systems are everywhere: pendulums, car suspensions, radio tuners, chip wiring.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't a circuit with one capacitor and resistors ever ring?", model: "With a single storage element there's only one state and the response is a single decaying exponential: it can approach its final value but never overshoot and swing back. Ringing needs two kinds of storage trading energy back and forth, like a capacitor and an inductor." },
      ]},
    ],
  };

  /* =============== PART 2 (math) =============== */
  const p2 = {
    id: "p2", title: "Math boost: trig and complex numbers", mins: 25,
    blurb: "Appendices B and C, in the bits this chapter needs.",
    takeaway: "j = √−1. A complex number a + jb is a point (or arrow) in a plane. Euler: e^(jθ) = cos θ + j sin θ, so e^((−α+jω)t) = e^(−αt)(cos ωt + j sin ωt): a decaying spin. a·cos x − b·sin x = √(a²+b²)·cos(x + tan⁻¹(b/a)).",
    steps: [
      { k: "math", title: "Sine and cosine as a spinning point", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let th = 0.6;
          function draw() {
            const cx = 120, cy = 110, r = 80, x = cx + r * Math.cos(th), y = cy - r * Math.sin(th);
            let s = `<circle cx="${cx}" cy="${cy}" r="${r}" class="w dim"/>` + `<line x1="20" y1="${cy}" x2="220" y2="${cy}" class="w dim"/><line x1="${cx}" y1="15" x2="${cx}" y2="205" class="w dim"/>` +
              `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="w hl"/>` + `<line x1="${x}" y1="${cy}" x2="${x}" y2="${y}" style="stroke:var(--cool);stroke-width:3"/>` + `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${cy}" style="stroke:var(--good);stroke-width:3"/>` + `<circle cx="${x}" cy="${y}" r="6" class="nd"/>` +
              S.t(x + 8, (y + cy) / 2, "sin", { a: "start", cls: "c s" }) + S.t((x + cx) / 2, cy + 18, "cos", { cls: "g s" });
            const px = (t) => 250 + t * 22, py = (v) => cy - v * r;
            let sp = "", cp = ""; for (let k = 0; k <= 80; k++) { const t = (k / 80) * 2 * Math.PI; sp += `${px(t)},${py(Math.sin(t))} `; cp += `${px(t)},${py(Math.cos(t))} `; }
            s += `<polyline points="${sp}" style="fill:none;stroke:var(--cool);stroke-width:2"/><polyline points="${cp}" style="fill:none;stroke:var(--good);stroke-width:2;stroke-dasharray:4 3"/><line x1="${px(th)}" y1="20" x2="${px(th)}" y2="200" class="w dim"/>`;
            f.innerHTML = S.svg(400, 220, s, { max: 400, label: "Unit circle with cosine and sine, and their graphs" });
          }
          host.append(f, slider({ id: id + "-th", label: "Angle θ", min: 0, max: 6.28, step: 0.02, value: th, show: (x) => fmt(x) + " rad (" + fmt((x * 180) / Math.PI) + "°)" }, (x) => { th = x; draw(); }).el);
          draw();
        },
        `<p>A point going round a circle: its x-coordinate is cos θ, its y-coordinate is sin θ. One full turn = 2π rad. At a rate ω rad/s, θ = ωt, and one turn takes T = 2π/ω (frequency f = ω/2π).</p>`,
        { t: "num", q: "ω = 10⁵ rad/s. Frequency f = ?", a: 15.92, tol: 0.02, unit: "kHz", why: "10⁵/(2π) ≈ 15.9 kHz." },
      ]},
      { k: "math", title: "Complex numbers", b: [
        `<p>Define <b>j</b> with j² = −1 (engineers use j because i means current). A complex number z = a + jb has a <b>real part</b> a and an <b>imaginary part</b> b. Draw it as a point (a, b).</p>`,
        `<div class="tbl"><table><tbody>
          <tr><td>magnitude</td><td class="mono">|z| = √(a² + b²)</td></tr>
          <tr><td>angle</td><td class="mono">∠z = tan⁻¹(b/a)</td></tr>
          <tr><td>add</td><td class="mono">(a + jb) + (c + jd) = (a + c) + j(b + d)</td></tr>
          <tr><td>multiply</td><td class="mono">(a + jb)(c + jd) = (ac − bd) + j(ad + bc)</td></tr></tbody></table></div>`,
        { t: "num", q: "|3 + j4| = ?", a: 5, why: "√(9 + 16) = 5." },
        { t: "num", q: "(1 + j)(1 − j) = ? (It's real.)", a: 2, hint: "1 − j + j − j² = 1 − (−1).", why: "2." },
      ]},
      { k: "math", title: "Euler's relation", b: [
        `<div class="key">e<sup>jθ</sup> = cos θ + j sin θ</div>`,
        `<p>So e<sup>jωt</sup> is a point spinning round the unit circle. And</p>`,
        `<div class="eq">e<sup>(−α + jω)t</sup> = e<sup>−αt</sup> · (cos ωt + j sin ωt)</div>`,
        `<p>A complex exponent = <b>decay</b> (real part −α) times <b>spin</b> (imaginary part ω). That's exactly what a ringing circuit does. Adding the pair with ±jω cancels the imaginary parts, leaving real cosines and sines.</p>`,
        { t: "mcq", q: "What does e^((−2 + j5)t) describe?", opts: [["An oscillation at 5 rad/s whose size shrinks like e^(−2t)", true, "Real part = decay rate, imaginary part = oscillation rate."], ["Growth at 2 and oscillation at 5", false, "−2 means decay."], ["Oscillation at 2 rad/s", false, "The imaginary part (5) sets the oscillation."]] },
      ]},
      { k: "math", title: "Combining a cosine and a sine", b: [
        `<div class="eq">a·cos x − b·sin x = √(a² + b²) · cos(x + tan⁻¹(b/a))</div>`,
        `<p>Any mix of cos and sin at the same frequency is one cosine with a bigger amplitude and a shifted phase. This is how the book turns the circuit's answers into "amplitude × cos(ωt + phase)".</p>`,
        { t: "num", q: "Amplitude of 3 cos ωt − 4 sin ωt?", a: 5, why: "√(9 + 16) = 5. Phase shift tan⁻¹(4/3) ≈ 53°." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In your own words, what does Euler's relation let us do?", model: "It connects exponentials with sines and cosines: e^(jθ) is just a point on the unit circle. So when a circuit's characteristic equation has complex roots, the exponential solutions are really decaying sinusoids, and we can rewrite them with ordinary sines and cosines." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "The lossless LC circuit", mins: 20,
    blurb: "Energy sloshes between C and L forever.",
    takeaway: "Undriven LC: d²v/dt² + v/LC = 0, so v and i oscillate at ω₀ = 1/√(LC), a quarter cycle apart. Total energy ½Cv² + ½Li² stays constant. Peak v/peak i = √(L/C), the characteristic impedance.",
    steps: [
      { k: "learn", title: "The equation", b: [
        fig(S.svg(260, 170, S.wire([60, 30], [200, 30]) + S.wire([60, 150], [200, 150]) + S.cap(60, 30, 60, 150, "C", { side: "left" }) + S.ind(200, 30, 200, 150, "L") + S.arrow(186, 60, 186, 100, "i_L", { lx: 176, ly: 85, a: "end" }) + S.t(80, 22, "v", { cls: "a" }), { max: 260, label: "Capacitor and inductor in a loop" })),
        `<p>KCL at the top: C·dv/dt + (1/L)∫v dt = 0. Differentiate:</p>`,
        `<div class="eq">d²v/dt² + v/LC = 0   ⟹   s² + 1/LC = 0   ⟹   s = ±jω₀,  ω₀ = 1/√(LC)</div>`,
        `<p>Imaginary roots = pure oscillation: v(t) = K₁cos ω₀t + K₂sin ω₀t. Two constants, set by the two initial states v<sub>C</sub>(0) and i<sub>L</sub>(0).</p>`,
      ]},
      { k: "play", title: "Watch the energy slosh", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), g = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let v0 = 6, i0 = 0;
          const L = 400e-6, C = 1e-6, w = 1 / Math.sqrt(L * C), Z = Math.sqrt(L / C);
          function draw() {
            const v = (t) => v0 * Math.cos(w * t) - Z * i0 * Math.sin(w * t), i = (t) => (v0 / Z) * Math.sin(w * t) + i0 * Math.cos(w * t);
            const T = (2 * Math.PI) / w, tm = (t) => t * 1e6;
            f.innerHTML = plot({ x: [0, 2.5 * T * 1e6], y: [-8, 8], xt: [0, 100, 200, 300], yt: [-8, 0, 8], xl: "t (µs)", yl: "v_C (V), 20·i_L (A)", h: 190, series: [{ f: (t) => v(t * 1e-6), cls: "s1" }, { f: (t) => 20 * i(t * 1e-6), cls: "s2" }], label: "Capacitor voltage and inductor current" });
            g.innerHTML = plot({ x: [0, 2.5 * T * 1e6], y: [0, 40], xt: [0, 100, 200, 300], yt: [0, 20, 40], xl: "t (µs)", yl: "energy (µJ)", h: 170, series: [{ f: (t) => 0.5 * C * v(t * 1e-6) ** 2 * 1e6, cls: "s1" }, { f: (t) => 0.5 * L * i(t * 1e-6) ** 2 * 1e6, cls: "s2" }, { f: (t) => (0.5 * C * v0 * v0 + 0.5 * L * i0 * i0) * 1e6, cls: "s5" }], label: "Energy in C, in L, and total" });
            ro.innerHTML = readout([["ω₀", fmt(w) + " rad/s"], ["f₀", fmt(w / (2 * Math.PI) / 1000) + " kHz"], ["√(L/C)", fmt(Z) + " Ω"], ["peak v_C", fmt(Math.hypot(v0, Z * i0)) + " V"]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(slider({ id: id + "-v", label: "v_C(0)", min: -6, max: 6, step: 1, value: v0, show: (x) => fmt(x) + " V" }, (x) => { v0 = x; draw(); }).el,
            slider({ id: id + "-i", label: "i_L(0)", min: -0.3, max: 0.3, step: 0.05, value: i0, show: (x) => fmt(x) + " A" }, (x) => { i0 = x; draw(); }).el);
          host.append(f, g, box, ro);
          draw();
        },
        `<p class="aside">L = 400 µH, C = 1 µF. Orange: capacitor. Blue: inductor (current ×20 to share the scale). Grey dashed: total energy, perfectly flat. Each state peaks when the other is zero.</p>`,
      ]},
      { k: "check", title: "Use energy", b: [
        `<p>Same L = 400 µH, C = 1 µF. At some instant v<sub>C</sub> = 6 V and i<sub>L</sub> = 0.2 A.</p>`,
        { t: "num", q: "Total stored energy?", a: 26, unit: "µJ", hint: "½·1µ·36 + ½·400µ·0.04.", why: "18 + 8 = 26 µJ." },
        { t: "num", q: "Peak capacitor voltage?", a: 7.21, tol: 0.02, unit: "V", hint: "All 26 µJ in C: ½Cv² = 26 µJ.", why: "√52 ≈ 7.21 V." },
        { t: "num", q: "Peak inductor current?", a: 0.3606, tol: 0.02, unit: "A", why: "√(2·26µ/400µ) ≈ 0.36 A. Check: 7.21/0.36 ≈ 20 Ω = √(L/C) ✓" },
      ]},
      { k: "why", title: "A spring and a mass", b: [
        { t: "mcq", q: "A mass M on a spring K obeys M·d²x/dt² + K·x = 0. Its oscillation frequency?", opts: [["√(K/M)", true, "Same equation with M ↔ C and 1/K ↔ L. Kinetic and spring energy slosh like magnetic and electric energy."], ["√(KM)", false, "Compare with ω₀ = 1/√(LC) using L ↔ 1/K, C ↔ M."], ["K/M", false, "There's a square root."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe one cycle of an LC oscillation in terms of energy.", model: "Start with the capacitor charged and no current: all energy is electric. The capacitor drives current through the inductor, so energy moves into the magnetic field until the capacitor voltage is zero and the current peaks. The current keeps flowing and charges the capacitor the other way, and so on, back and forth, with the total energy staying constant." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Add a resistor: damping", mins: 25,
    blurb: "α, ω₀, ω_d and Q describe every second-order response.",
    takeaway: "Series RLC: s² + 2αs + ω₀² = 0 with α = R/2L, ω₀ = 1/√(LC). α < ω₀: under-damped, rings at ω_d = √(ω₀² − α²) inside an e^(−αt) envelope. α = ω₀: critical. α > ω₀: over-damped, no ringing. Q = ω₀/2α ≈ number of cycles it rings.",
    steps: [
      { k: "learn", title: "The characteristic equation", b: [
        fig(seriesRLC({ src: false })),
        `<div class="eq">d²v/dt² + (R/L)dv/dt + v/LC = 0  ⟹  s² + 2αs + ω₀² = 0</div>`,
        `<div class="eq">α = R/2L   ω₀ = 1/√(LC)   s = −α ± √(α² − ω₀²)</div>`,
        `<p>The resistor adds the middle term. It burns energy, so the response decays.</p>`,
      ]},
      { k: "play", title: "Turn the damping knob", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), sp = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let R = 10;
          const L = 10e-3, C = 1e-6, w0 = 1 / Math.sqrt(L * C);
          function draw() {
            const a = R / (2 * L), Q = w0 / (2 * a), sim = simRLC(R, L, C, () => 0, 1, 0, 8e-3, 900);
            const kind = Math.abs(a - w0) / w0 < 0.02 ? "critically damped" : a < w0 ? "under-damped" : "over-damped";
            f.innerHTML = plot({ x: [0, 8], y: [-1.05, 1.05], xt: [0, 2, 4, 6, 8], yt: [-1, 0, 1], xl: "t (ms)", yl: "v_C (V)", series: [{ pts: sim.map(([t, v]) => [t * 1e3, v]), cls: "s1" }].concat(a < w0 ? [{ f: (t) => Math.exp(-a * t * 1e-3), cls: "s5" }, { f: (t) => -Math.exp(-a * t * 1e-3), cls: "s5" }] : []), label: "Capacitor voltage decay" });
            const roots = a < w0 ? [[-a, Math.sqrt(w0 * w0 - a * a)], [-a, -Math.sqrt(w0 * w0 - a * a)]] : [[-a + Math.sqrt(a * a - w0 * w0), 0], [-a - Math.sqrt(a * a - w0 * w0), 0]];
            const X = (x) => 220 + (x / 30000) * 200, Y = (y) => 100 - (y / 15000) * 90;
            let s = `<line x1="10" y1="100" x2="240" y2="100" class="w dim"/><line x1="220" y1="5" x2="220" y2="195" class="w dim"/><circle cx="220" cy="100" r="${(w0 / 15000) * 90}" class="w dim" style="stroke-dasharray:3 3"/>` + S.t(236, 15, "Im", { cls: "s m", a: "start" }) + S.t(14, 92, "Re", { cls: "s m", a: "start" });
            roots.forEach(([x, y]) => { const px = Math.max(8, X(x)); s += `<text x="${px}" y="${Y(y) + 6}" text-anchor="middle" class="big a">×</text>`; });
            sp.innerHTML = S.svg(260, 200, s, { max: 260, label: "Roots s1 and s2 in the complex plane" });
            ro.innerHTML = readout([["α = R/2L", fmt(a) + " /s"], ["ω₀", fmt(w0) + " rad/s"], ["Q = ω₀/2α", fmt(Q)], ["case", kind]]) + (a < w0 ? readout([["ω_d", fmt(Math.sqrt(w0 * w0 - a * a)) + " rad/s"]]) : "");
          }
          host.append(f, el(`<div class="two"></div>`), slider({ id: id + "-r", label: "R", min: 2, max: 600, log: true, value: R, show: (x) => fmt(x, 3) + " Ω" }, (x) => { R = x; draw(); }).el, ro);
          host.querySelector(".two").append(sp, el(`<p class="aside">The roots (×) of the characteristic equation. Under-damped: a complex pair on a circle of radius ω₀ (dashed), at real part −α. Raise R: they slide left, meet on the real axis (critical), then split along it (over-damped).</p>`));
          draw();
        },
        `<p class="aside">L = 10 mH, C = 1 µF, so ω₀ = 10⁴ rad/s. Start: v<sub>C</sub>(0) = 1 V, i<sub>L</sub>(0) = 0. Dashed: the e<sup>−αt</sup> envelope.</p>`,
      ]},
      { k: "learn", title: "The under-damped answer", b: [
        `<div class="eq">v<sub>C</sub>(t) ∝ e<sup>−αt</sup> cos(ω<sub>d</sub>t + φ)   ω<sub>d</sub> = √(ω₀² − α²)</div>`,
        `<div class="tbl"><table><tbody>
          <tr><td>α</td><td>damping factor: how fast the envelope shrinks</td></tr>
          <tr><td>ω₀</td><td>undamped natural (resonance) frequency</td></tr>
          <tr><td>ω<sub>d</sub></td><td>damped frequency: how fast it actually rings (a bit below ω₀)</td></tr>
          <tr><td>Q = ω₀/2α</td><td>quality factor. Series RLC: Q = (1/R)√(L/C). Rings for about Q cycles (down to ~4%)</td></tr></tbody></table></div>`,
      ]},
      { k: "check", title: "Classify a circuit", b: [
        `<p>Series RLC: R = 40 Ω, L = 10 mH, C = 10 nF.</p>`,
        { t: "num", q: "α = ?", a: 2000, unit: "1/s", why: "40/(2 × 0.01) = 2000." },
        { t: "num", q: "ω₀ = ?", a: 100000, unit: "rad/s", why: "1/√(10⁻¹⁰) = 10⁵." },
        { t: "num", q: "Q = ?", a: 25, why: "10⁵/(2·2000) = 25: under-damped, rings for about 25 cycles." },
        { t: "num", q: "What R makes it critically damped?", a: 2000, unit: "Ω", hint: "α = ω₀ → R = 2Lω₀ = 2√(L/C).", why: "2 × √(10⁶) = 2 kΩ." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does Q tell you about a ringing circuit, in practical terms?", model: "It's roughly how many oscillations you'll see before the ringing dies away. A high-Q circuit loses little energy per cycle and rings for a long time; a low-Q circuit is heavily damped and settles quickly, and below Q = ½ it doesn't ring at all." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Over-damping, critical damping, energy", mins: 20,
    blurb: "No ringing, the fastest no-ringing case, and where the energy goes.",
    takeaway: "Over-damped: two real decaying exponentials (for large R their time constants approach L/R and RC). Critically damped: e^(−αt) and te^(−αt). Stored energy decays as e^(−2αt); Q ≈ 2π × (energy stored)/(energy lost per cycle).",
    steps: [
      { k: "learn", title: "Over-damped", b: [
        `<p>α > ω₀: both roots real and negative: v = A₁e<sup>s₁t</sup> + A₂e<sup>s₂t</sup>. No oscillation. A big R blocks the C–L energy exchange; they each just discharge through R.</p>`,
        { t: "mcq", q: "For very large R, the two time constants approach…", opts: [["L/R (fast) and RC (slow)", true, "As if the inductor and capacitor were separate first-order circuits."], ["√(LC) and √(LC)", false, "That's the undamped time scale."], ["Both RC", false, "One belongs to the inductor."]] },
      ]},
      { k: "learn", title: "Critically damped", b: [
        `<p>α = ω₀: a repeated root s = −α. The solutions are e<sup>−αt</sup> and <b>t·e<sup>−αt</sup></b>. It returns to rest as fast as possible without overshooting, which is what you want in a car's suspension or a meter needle.</p>`,
      ]},
      { k: "learn", title: "Energy decay and Q", b: [
        `<div class="eq">w<sub>total</sub>(t) ≈ w(0)·e<sup>−2αt</sup>   (high Q)</div>`,
        `<p>In Q cycles the energy drops to about e<sup>−2π</sup> ≈ 0.2%. Another view of Q:</p>`,
        `<div class="key">Q ≈ 2π × (energy stored) / (energy dissipated per cycle)</div>`,
        { t: "num", q: "A circuit stores 10 µJ and loses 0.2 µJ per cycle. Q ≈ ?", a: 314, tol: 0.02, why: "2π × 10/0.2 ≈ 314." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a large series resistance stop an RLC circuit from ringing?", model: "Ringing needs energy to pass back and forth between capacitor and inductor. A large series R drops most of the voltage and burns energy faster than it can be exchanged, so each element simply drains through the resistor without swinging back." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Driven RLC: step and impulse", mins: 20,
    blurb: "A step overshoots (up to almost twice) before settling.",
    takeaway: "Step V into an under-damped series RLC: v_C = V[1 − (ω₀/ω_d)e^(−αt)cos(ω_dt − tan⁻¹(α/ω_d))]. At first the inductor is an open (all of V across L), finally C is open (v_C = V). High Q → overshoot near 2V. An impulse just sets initial conditions, then the circuit rings freely.",
    steps: [
      { k: "play", title: "Step response", b: [
        fig(seriesRLC({ V: "step 1 V" })),
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let R = 20;
          const L = 10e-3, C = 1e-6, w0 = 1e4;
          function draw() {
            const sim = simRLC(R, L, C, () => 1, 0, 0, 6e-3, 900), peak = Math.max(...sim.map((p) => p[1])), a = R / (2 * L);
            f.innerHTML = plot({ x: [0, 6], y: [0, 2.1], xt: [0, 2, 4, 6], yt: [0, 1, 2], xl: "t (ms)", yl: "v_C (V)", series: [{ f: () => 1, cls: "s5" }, { pts: sim.map(([t, v]) => [t * 1e3, v]), cls: "s1" }], label: "Step response of the series RLC" });
            ro.innerHTML = readout([["Q", fmt(w0 / (2 * a))], ["peak v_C", fmt(peak) + " V"], ["overshoot", fmt(Math.max(0, peak - 1) * 100, 2) + " %"]]);
          }
          host.append(f, slider({ id: id + "-r", label: "R", min: 1, max: 600, log: true, value: R, show: (x) => fmt(x, 3) + " Ω" }, (x) => { R = x; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "check", title: "Endpoints and starting moves", b: [
        { t: "mcq", q: "Right after the step (uncharged circuit), where is the 1 V?", opts: [["All across the inductor: i_L can't jump (open), v_C can't jump (0 V), and v_R = R·0 = 0", true, "So di/dt = V/L: the current starts ramping."], ["Across the capacitor", false, "v_C is continuous and starts at 0."], ["Across R", false, "No current yet, so no voltage on R."]] },
        { t: "mcq", q: "Long after?", opts: [["v_C = 1 V, i = 0 (capacitor open at DC)", true, "Same final-value rules as Chapter 10."], ["v_C = 0", false, "The capacitor ends up holding the source voltage."], ["It rings forever", false, "Only if R = 0."]] },
        { t: "num", q: "With R = 0 (pure LC), what's the peak of v_C for a 1 V step?", a: 2, unit: "V", why: "v_C = V(1 − cos ω₀t) peaks at 2V. It swings evenly around its final value." },
      ]},
      { k: "learn", title: "Impulse response", b: [
        `<p>An impulse of voltage-area Λ (volt·seconds) at t = 0: the inductor acts as an open, so all of it lands on L, making i<sub>L</sub>(0⁺) = Λ/L. v<sub>C</sub> stays 0. After that, no input: the circuit rings freely (the ZIR with those initial conditions).</p>`,
        `<p class="aside">Same as Chapter 10: an impulse just sets up the initial state. Also, the impulse response is the derivative of the step response.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can the capacitor voltage overshoot the source voltage in a step response?", model: "When v_C reaches the source voltage, the inductor is still carrying current, and that current can't stop instantly. It keeps charging the capacitor past the source voltage until the inductor's energy is used up. Then it swings back, and the resistor gradually damps the swings." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Ringing gates, and sketching by intuition", mins: 25,
    blurb: "Delay is when the ringing stops crossing the threshold.",
    takeaway: "Model the driving gate by its Thévenin equivalent (different R_TH for rising and falling), with the wire L and the receiver's C_GS: a series RLC. The output is valid only after all ringing stays past V_OH or V_OL. To sketch any second-order response: initial value, final value, initial direction, ring frequency ω_d, about Q cycles, envelope from energy.",
    steps: [
      { k: "learn", title: "The inverter link", b: [
        fig(seriesRLC({ R: "R_TH", L: "L_wire", C: "C_GS", V: "v_TH" })),
        `<p>Falling output: the driving MOSFET is on, so R<sub>TH</sub> = R<sub>L</sub> ∥ R<sub>ON</sub> (small) → <b>high Q</b>, lots of ringing. Rising output: R<sub>TH</sub> = R<sub>L</sub> (big) → more damping.</p>`,
        `<p>Superposition helps: split v<sub>TH</sub> into its constant low level plus a step, since the circuit is linear.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>R<sub>L</sub> = 1.2 kΩ, R<sub>ON</sub> = 120 Ω, L<sub>wire</sub> = 80 nH, C<sub>GS</sub> = 0.2 pF.</p>`,
        { t: "num", q: "ω₀ = 1/√(LC) = ?", a: 7.91, tol: 0.02, unit: "×10⁹ rad/s", why: "1/√(1.6×10⁻²⁰) ≈ 7.9 × 10⁹ rad/s." },
        { t: "num", q: "Falling: R_TH = 1.2k ∥ 120 ≈ 109 Ω. Q = ω₀L/R_TH ≈ ?", a: 5.8, tol: 0.05, hint: "Series Q = (1/R)√(L/C). √(L/C) = √(4×10⁵) ≈ 632 Ω.", why: "632/109 ≈ 5.8: rings about 6 times." },
        { t: "num", q: "Rising: R_TH = 1.2 kΩ. Q ≈ ?", a: 0.53, tol: 0.05, why: "632/1200 ≈ 0.53: barely under-damped, a small overshoot." },
        { t: "mcq", q: "With ringing, when is a falling output 'valid'?", opts: [["Only once every later swing stays below V_OL", true, "The first dip below V_OL doesn't count if the next swing comes back above it. That's why ringing lengthens propagation delay."], ["The first time it crosses V_OL", false, "It may bounce back out."], ["When it reaches its final value exactly", false, "It only needs to stay inside the valid band."]] },
      ]},
      { k: "learn", title: "Sketching without solving", b: [
        `<div class="tbl"><table><tbody>
          <tr><td class="mono">1</td><td>initial value (continuity of v<sub>C</sub>, i<sub>L</sub>)</td></tr>
          <tr><td class="mono">2</td><td>final value (C open, L short)</td></tr>
          <tr><td class="mono">3</td><td>initial direction (which way does i<sub>L</sub>(0) push v<sub>C</sub>?)</td></tr>
          <tr><td class="mono">4</td><td>ring frequency ω<sub>d</sub> ≈ ω₀</td></tr>
          <tr><td class="mono">5</td><td>rings for about Q cycles</td></tr>
          <tr><td class="mono">6</td><td>envelope height from energy (when there's no drive)</td></tr></tbody></table></div>`,
      ]},
      { k: "check", title: "Sketch this one", b: [
        `<p>Undriven series RLC: L = 2 mH, C = 2 µF, R = 4 Ω. At t = 0, v<sub>C</sub> = 1 V and i<sub>L</sub> = 20 mA (flowing so as to discharge C).</p>`,
        { t: "num", q: "Ring frequency f ≈ ?", a: 2.52, tol: 0.03, unit: "kHz", hint: "ω₀ = 1/√(4×10⁻⁹) ≈ 15 811 rad/s.", why: "≈ 2.5 kHz (period ≈ 0.4 ms)." },
        { t: "num", q: "Q ≈ ?", a: 7.9, tol: 0.03, hint: "(1/R)√(L/C) = (1/4)√1000.", why: "≈ 7.9: rings about 8 cycles." },
        { t: "num", q: "Envelope height V_CM (all energy in C at t = 0)?", a: 1.18, tol: 0.03, unit: "V", hint: "½·2µ·1² + ½·2m·(0.02)² = ½·2µ·V_CM².", why: "1 µJ + 0.4 µJ = 1.4 µJ → V_CM = √1.4 ≈ 1.18 V. Starts at 1 V heading down, rings inside ±1.18 V, decays to 0." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the same wire ring more when a gate output falls than when it rises (for a resistor-pullup gate)?", model: "Falling, the driver's on-MOSFET makes its Thévenin resistance small, so there's little damping and a high Q. Rising, the current comes through the large pull-up resistor, which damps the RLC circuit much more, giving a low Q." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Two-capacitor circuits, state variables, charge pumps", mins: 25,
    blurb: "RC-only circuits can't ring. A neat way to write state equations. Pumping energy.",
    takeaway: "Circuits with only R and C (or only R and L) have real, negative roots: no oscillation. State-variable method: replace each C by a voltage source v_C and each L by a current source i_L, solve the resistive circuit for i_C and v_L, then dv_C/dt = i_C/C, di_L/dt = v_L/L. A switched L–C charge pump moves energy V²T²/2L per cycle into C.",
    steps: [
      { k: "learn", title: "Two capacitors", b: [
        fig(S.svg(420, 170, S.wire([60, 30], [180, 30]) + S.wire([240, 30], [360, 30]) + S.res(180, 30, 240, 30, "R₃") + S.cap(60, 30, 60, 150, "C₁", { side: "left" }) + S.res(120, 30, 120, 150, "R₁", { side: "right" }) + S.res(300, 30, 300, 150, "R₂", { side: "left" }) + S.cap(360, 30, 360, 150, "C₂") + S.wire([60, 150], [360, 150]) + S.dot(120, 30) + S.dot(300, 30) + S.t(60, 20, "v₁", { cls: "a" }) + S.t(360, 20, "v₂", { cls: "a" }), { max: 420, label: "Two capacitors with resistors" })),
        `<p>Node analysis gives a second-order equation again, s² + 2αs + ω₀² = 0. But here α² − ω₀² is <b>always positive</b>: the roots are real. RC-only (or RL-only) circuits never oscillate; an N-th order one can cross zero at most N − 1 times.</p>`,
        { t: "mcq", q: "R₁ = R₂ = 1 MΩ, R₃ = 0.5 MΩ, C₁ = C₂ = 1 µF give s² + 6s + 5 = 0. The roots?", opts: [["−1 and −5 (per second)", true, "(s + 1)(s + 5) = 0. Two decaying exponentials, e^(−t) and e^(−5t)."], ["−3 ± j2", false, "Check: 36 − 20 > 0, so real roots."], ["+1 and +5", false, "Passive circuits decay: negative roots."]] },
      ]},
      { k: "learn", title: "The state-variable method", b: [
        `<ol><li>Replace each capacitor by a voltage source v<sub>C</sub> and each inductor by a current source i<sub>L</sub>.</li><li>Solve the now purely resistive circuit for each i<sub>C</sub> and v<sub>L</sub>.</li><li>Write dv<sub>C</sub>/dt = i<sub>C</sub>/C and di<sub>L</sub>/dt = v<sub>L</sub>/L.</li></ol>`,
        `<p>You get coupled first-order equations, ideal for a computer (Euler's method from Chapter 10, one equation per state). No new physics, just a different bookkeeping.</p>`,
        { t: "mcq", q: "Parallel RLC with a current source i_IN: replacing C by v_C and L by i_L gives i_C = i_IN − i_L − v_C/R and v_L = v_C. So dv_C/dt = ?", opts: [["(i_IN − i_L − v_C/R)/C", true, "And di_L/dt = v_C/L. Two first-order state equations."], ["v_C/L", false, "That's di_L/dt."], ["i_IN/C", false, "The resistor and inductor take some current too."]] },
      ]},
      { k: "play", title: "A charge pump", b: [
        fig(S.svg(420, 180, S.wire([60, 72], [60, 30], [100, 30]) + `<line class="w" x1="100" y1="30" x2="130" y2="16"/>` + S.wire([140, 30], [200, 30]) + S.ind(200, 30, 200, 150, "L", { side: "left" }) + S.wire([200, 30], [250, 30]) + `<line class="w" x1="250" y1="30" x2="280" y2="16"/>` + S.wire([290, 30], [340, 30]) + S.cap(340, 30, 340, 150, "C") + S.wire([60, 108], [60, 150], [340, 150]) + S.vsrc(60, 90, "V", { side: "right" }) + S.t(118, 50, "S₁", { cls: "s m" }) + S.t(268, 50, "S₂", { cls: "s m" }), { max: 420, label: "Charge pump: source, switch S1, inductor, switch S2, capacitor" })),
        `<p>Each cycle: S₁ closes for time T (the inductor current ramps to VT/L, storing V²T²/2L). Then S₁ opens and S₂ closes: the inductor's current rings into C until it hits zero, dumping all that energy into C. Repeat.</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let V = 1.5, T = 10;
          function draw() {
            const L = 100e-6, C = 10e-6, k = V * (T * 1e-6) / Math.sqrt(L * C), pts = []; for (let n = 0; n <= 100; n++) pts.push([n, k * Math.sqrt(n)]);
            f.innerHTML = plot({ x: [0, 100], y: [0, 10], xt: [0, 25, 50, 75, 100], yt: [0, 2, 4, 6, 8, 10], xl: "cycle n", yl: "v_C (V)", series: [{ pts, cls: "s1" }, { f: () => V, cls: "s5" }], label: "Capacitor voltage after n pump cycles" });
            ro.innerHTML = readout([["energy per cycle", fmt((V * V * (T * 1e-6) ** 2) / (2 * L) * 1e6) + " µJ"], ["v_C after 16 cycles", fmt(k * 4) + " V"], ["after 100", fmt(k * 10) + " V"]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(slider({ id: id + "-v", label: "Source V", min: 0.5, max: 3, step: 0.5, value: V, show: (x) => fmt(x) + " V" }, (x) => { V = x; draw(); }).el,
            slider({ id: id + "-t", label: "Ramp time T", min: 2, max: 20, step: 1, value: T, show: (x) => fmt(x) + " µs" }, (x) => { T = x; draw(); }).el);
          host.append(f, box, ro);
          draw();
        },
        `<div class="eq">v<sub>C</sub>[n] = V·T·√(n/LC)</div>`,
        `<p class="aside">L = 100 µH, C = 10 µF. The output climbs above the 1.5 V source (dashed): a DC–DC converter, like the circuit that makes 3 V from one AA battery. With a load resistor across C, it settles where the energy pumped in equals the energy drawn out.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the charge pump get a capacitor voltage higher than the source?", model: "It moves energy, not voltage. Each cycle the source pumps a fixed amount of energy into the inductor's magnetic field, and then the inductor current, which can't stop instantly, dumps that energy into the capacitor. Since energy keeps accumulating, the capacitor voltage keeps climbing past the source voltage." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ch12", eyebrow: "Chapter 12", title: "Transients in Second-Order Circuits",
    intro: `<p>Eight parts. Two storage elements, and circuits that <b>ring</b>. You'll meet LC oscillation, damping (α, ω₀, Q), step and impulse responses, ringing in gate wiring, and quick sketching.</p><p>Part 2 is a math boost on trig and complex numbers (the book's Appendices B and C, the parts you need).</p><p class="aside">Arrow keys ← → move between steps. Need a refresher? <a href="11-energy-power-digital.html">Chapter 11</a>.</p>`,
    after: `<p>Open the Chapter 12 PDF and go to the <b>exercises and problems</b> at the end. For each RLC problem, compute α and ω₀ first and say which damping case you're in.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8],
    summary: `
      <h3>Math</h3>
      <p>j² = −1. |a + jb| = √(a² + b²). e<sup>jθ</sup> = cos θ + j sin θ. e<sup>(−α+jω)t</sup> = decaying oscillation. a cos x − b sin x = √(a²+b²) cos(x + tan⁻¹(b/a)). ω = 2πf.</p>
      <h3>Undriven LC</h3>
      <div class="eq">d²v/dt² + v/LC = 0 · ω₀ = 1/√(LC) · v_peak/i_peak = √(L/C)</div>
      <p>v<sub>C</sub>, i<sub>L</sub> a quarter cycle apart; energy ½Cv² + ½Li² constant, sloshing at 2ω₀.</p>
      <h3>Damping (series RLC)</h3>
      <div class="eq">s² + 2αs + ω₀² = 0 · α = R/2L (parallel: 1/2RC) · s = −α ± √(α² − ω₀²)</div>
      <p>α < ω₀ under-damped: e<sup>−αt</sup>cos(ω<sub>d</sub>t + φ), ω<sub>d</sub> = √(ω₀² − α²). α = ω₀ critical: e<sup>−αt</sup>, te<sup>−αt</sup>. α > ω₀ over-damped: two real exponentials (→ L/R and RC for large R).</p>
      <div class="eq">Q = ω₀/2α (series: (1/R)√(L/C)) · ≈ cycles of ringing · ≈ 2π·stored/lost per cycle</div>
      <p>Energy decays as e<sup>−2αt</sup>: ~0.2% after Q cycles.</p>
      <h3>Driven series RLC</h3>
      <p>Step V: at 0⁺ all of V is across L; finally v<sub>C</sub> = V. Overshoot up to ~2V for high Q. Impulse sets i<sub>L</sub>(0⁺) = Λ/L, then free ringing.</p>
      <h3>Gates and sketching</h3>
      <p>Driver → Thévenin (R<sub>TH</sub> small when falling, large when rising). Valid only after ringing stays beyond V<sub>OL</sub>/V<sub>OH</sub>. Sketch: initial, final, initial direction, ω<sub>d</sub>, ~Q cycles, envelope from energy.</p>
      <h3>Other</h3>
      <p>RC-only / RL-only circuits: real negative roots, no oscillation. State-variable method: C → v<sub>C</sub> source, L → i<sub>L</sub> source, solve for i<sub>C</sub>, v<sub>L</sub>. Charge pump: V²T²/2L per cycle, v<sub>C</sub>[n] = VT√(n/LC).</p>`,
  };
  Course.start(window.CHAPTER);
})();
