(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;

  /* complex numbers as [re, im] */
  const Z = {
    div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; },
    abs: (a) => Math.hypot(a[0], a[1]),
    deg: (a) => (Math.atan2(a[1], a[0]) * 180) / Math.PI,
  };

  /* log-scale plots (x = log10 ω) */
  const sup = (n) => String(n).replace(/-/g, "⁻").replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);
  const p10 = (v) => "10" + sup(v);
  const ints = (a, b) => { const r = []; for (let k = Math.ceil(a); k <= Math.floor(b); k++) r.push(k); return r; };
  function bmag(o) {
    return plot({
      w: o.w || 520, h: o.h || 260, x: o.x, y: o.y, xt: ints(o.x[0], o.x[1]), yt: o.yt || ints(o.y[0], o.y[1]), xtf: p10, ytf: o.ytf || p10, xl: o.xl || "ω (rad/s)", yl: o.yl || "|H|",
      series: o.series.map((se) => ({ f: (lx) => Math.log10(se.f(Math.pow(10, lx))), cls: se.cls, n: se.n || 400 })),
      marks: (o.marks || []).map((m) => Object.assign({}, m, { x: Math.log10(m.x), y: Math.log10(m.y) })), label: o.label || "Magnitude versus frequency, log scales",
    });
  }
  function bph(o) {
    return plot({
      w: o.w || 520, h: o.h || 220, x: o.x, y: [-105, 125], xt: ints(o.x[0], o.x[1]), yt: [-90, -45, 0, 45, 90], xtf: p10, ytf: (v) => fmt(v) + "°", xl: "ω (rad/s)", yl: o.yl || "∠H",
      series: o.series.map((se) => ({ f: (lx) => se.f(Math.pow(10, lx)), cls: se.cls, n: se.n || 400 })),
      marks: (o.marks || []).map((m) => Object.assign({}, m, { x: Math.log10(m.x) })), label: o.label || "Phase versus frequency",
    });
  }

  /* RK4 simulators. Parallel RLC fed by current i(t): C dv/dt = i − v/R − iL, L diL/dt = v.  Series RLC fed by v(t): returns [t, vC, i]. */
  function simPar(R, L, C, iin, T, N) {
    const dt = T / N, out = [];
    let v = 0, il = 0;
    const f = (t, v, il) => [(iin(t) - v / R - il) / C, v / L];
    for (let k = 0; k <= N; k++) {
      const t = k * dt; out.push([t, v]);
      const a = f(t, v, il), b = f(t + dt / 2, v + (dt / 2) * a[0], il + (dt / 2) * a[1]), c = f(t + dt / 2, v + (dt / 2) * b[0], il + (dt / 2) * b[1]), d = f(t + dt, v + dt * c[0], il + dt * c[1]);
      v += (dt / 6) * (a[0] + 2 * b[0] + 2 * c[0] + d[0]); il += (dt / 6) * (a[1] + 2 * b[1] + 2 * c[1] + d[1]);
    }
    return out;
  }
  function simSer(R, L, C, vin, v0, T, N) {
    const dt = T / N, out = [];
    let v = v0, i = 0;
    const f = (t, v, i) => [i / C, (vin(t) - R * i - v) / L];
    for (let k = 0; k <= N; k++) {
      const t = k * dt; out.push([t, v, i]);
      const a = f(t, v, i), b = f(t + dt / 2, v + (dt / 2) * a[0], i + (dt / 2) * a[1]), c = f(t + dt / 2, v + (dt / 2) * b[0], i + (dt / 2) * b[1]), d = f(t + dt, v + dt * c[0], i + dt * c[1]);
      v += (dt / 6) * (a[0] + 2 * b[0] + 2 * c[0] + d[0]); i += (dt / 6) * (a[1] + 2 * b[1] + 2 * c[1] + d[1]);
    }
    return out;
  }

  function parFig(o = {}) {
    const s = S.wire([60, 30], [320, 30]) + S.wire([60, 160], [320, 160]) + S.wire([60, 30], [60, 72]) + S.wire([60, 118], [60, 160]) + S.isrc(60, 95, o.I || "i(t)", { side: "left" }) +
      S.ind(150, 30, 150, 160, o.L || "L", { side: "left" }) + S.res(230, 30, 230, 160, o.R || "R", { side: "left" }) + S.cap(310, 30, 310, 160, o.C || "C", { side: "left" }) +
      S.dot(150, 30) + S.dot(230, 30) + S.dot(150, 160) + S.dot(230, 160) + S.t(340, 58, "+", { cls: "big" }) + S.t(340, 150, "−", { cls: "big" }) + S.t(344, 102, o.V || "v", { a: "start", cls: "a" });
    return S.svg(460, 185, `<g transform="translate(60,0)">${s}</g>`, { max: 460, label: "Parallel RLC driven by a current source" });
  }
  function serFig(hl) {
    const H = (k) => (hl === k || (hl === "lc" && (k === "l" || k === "c")) ? { tcls: "a", cls: "hl" } : {});
    let s = S.wire([60, 82], [60, 30], [80, 30]) + S.res(80, 30, 160, 30, "R", H("r")) + S.wire([160, 30], [180, 30]) + S.ind(180, 30, 270, 30, "L", H("l")) + S.wire([270, 30], [310, 30]) + S.cap(310, 30, 310, 160, "C", Object.assign({ side: "left" }, H("c"))) + S.wire([60, 118], [60, 160], [310, 160]) + S.vsrc(60, 100, "v_i", { side: "right" });
    s += S.t(120, 64, "+ v_r −", { cls: "s m" }) + S.t(225, 64, "+ v_l −", { cls: "s m" }) + S.t(330, 60, "+", { cls: "big" }) + S.t(330, 152, "−", { cls: "big" }) + S.t(336, 104, "v_c", { a: "start", cls: "s m" });
    return S.svg(400, 180, s, { max: 400, label: "Series RLC driven by a voltage source" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Resonance: a tone burst into an RLC", mins: 20,
    blurb: "Drive a ringing circuit near its natural frequency and watch the beats.",
    takeaway: "An under-damped RLC driven by a sinusoid at ω₁ gives natural response (at ω_d, decaying as e^(−αt)) + forced response (at ω₁, forever). Near ω_d the two beat against each other. Steady state is just the forced part, which is what the impedance method finds directly. Driven right at resonance, the response grows large, limited only by losses.",
    steps: [
      { k: "learn", title: "Why resonance matters", b: [
        `<p>Chapter 12: an L and a C with little loss <b>ring</b> at about ω₀ = 1/√(LC). Now drive one with a sine wave.</p>`,
        `<ul><li><b>Radio tuners and phone channel selectors</b>: pick one frequency out of thousands.</li><li><b>Oscillators and clocks</b>: make a clean sinusoid at one frequency.</li><li><b>Bridges and buildings</b>: a small push at the resonant frequency, repeated, can build a huge sway. Tacoma Narrows (1940) swayed in the wind until it collapsed.</li></ul>`,
        `<p>A resonator driven at its resonance keeps <b>accumulating</b> energy. Only its losses (or breaking) limit the response.</p>`,
      ]},
      { k: "learn", title: "The circuit", b: [
        fig(parFig({ I: "I₀cos ω₁t", V: "v" })),
        `<p>KCL at the top: i = C dv/dt + v/R + i<sub>L</sub>. Differentiate and use v = L di<sub>L</sub>/dt:</p>`,
        `<div class="eq">d²v/dt² + (1/RC) dv/dt + v/LC = (1/C) di/dt</div>`,
        `<div class="eq">ω₀ = 1/√(LC)     α = 1/(2RC)     ω<sub>d</sub> = √(ω₀² − α²)</div>`,
        `<p>We assume <b>under-damped</b> (α < ω₀): the roots −α ± jω<sub>d</sub> are a <b>complex-conjugate pair</b>. That's what "resonant" means.</p>`,
      ]},
      { k: "play", title: "Switch on a tone", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const L = 1e-3, C = 0.1e-6, R = 2000, w0 = 1e5;
          let r = 0.9;
          function draw() {
            const w1 = r * w0, sim = simPar(R, L, C, (t) => 1e-3 * Math.cos(w1 * t), 3e-3, 4000);
            const H = Z.abs(Z.div([1, 0], [1 / R, w1 * C - 1 / (w1 * L)])) * 1e-3;
            f.innerHTML = plot({ x: [0, 3], y: [-4.2, 4.2], xt: [0, 1, 2, 3], yt: [-4, -2, 0, 2, 4], xl: "t (ms)", yl: "v (V)", series: [{ f: () => H, cls: "s5" }, { f: () => -H, cls: "s5" }, { pts: sim.filter((p, k) => k % 2 === 0).map(([t, v]) => [t * 1e3, v]), cls: "s1" }], label: "Capacitor voltage after a cosine current is switched on" });
            ro.innerHTML = readout([["drive ω₁", fmt(w1, 3) + " rad/s"], ["ω₁ / ω₀", fmt(r)], ["steady-state amplitude", fmt(H) + " V"]]);
          }
          host.append(f, slider({ id: id + "-r", label: "Drive frequency ω₁ / ω₀", min: 0.5, max: 1.5, step: 0.01, value: r, show: (x) => fmt(x) }, (x) => { r = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">L = 1 mH, C = 0.1 µF (ω₀ = 10⁵ rad/s), R = 2 kΩ (Q = 20), I₀ = 1 mA, starting from rest. Dashed: the steady-state amplitude. Try 0.9, then 1.0, then 1.3.</p>`,
      ]},
      { k: "why", title: "Why the beats?", b: [
        `<div class="eq">v(t) = K e<sup>−αt</sup> cos(ω<sub>d</sub>t + φ)  +  |V<sub>p</sub>| cos(ω₁t + ∠V<sub>p</sub>)</div>`,
        `<p>Two cosines at <b>nearby but different</b> frequencies drift in and out of step: they add, then cancel, then add. That's a <b>beat</b>. The first term dies away (its rate is α), so the beating fades and only the forced term is left.</p>`,
        { t: "mcq", q: "Drive exactly at ω₁ = ω_d instead. What do you expect?", opts: [["No beats: the response just grows smoothly to its steady amplitude", true, "Both terms have the same frequency, so they can't drift in and out of step. The natural part simply fades as the forced part takes over."], ["Faster beats", false, "Beat rate is the frequency difference, which is now zero."], ["The response stays at zero", false, "Driving at resonance gives the biggest response."]] },
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>Same circuit: L = 1 mH, C = 0.1 µF, R = 2 kΩ.</p>`,
        { t: "num", q: "α = 1/(2RC) = ?", a: 2500, unit: "1/s", why: "1/(2 × 2000 × 10⁻⁷) = 2500 s⁻¹. The natural part shrinks by e every 0.4 ms." },
        { t: "num", q: "Beat period when ω₁ = 0.9ω₀ (ω_d ≈ ω₀)?", a: 0.628, tol: 0.02, unit: "ms", hint: "Beats repeat every 2π/(ω_d − ω₁).", why: "2π/(10⁴) ≈ 0.63 ms. Count them on the plot." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What two parts make up the response of a resonant circuit to a switched-on sine wave, and which one survives?", model: "The natural response rings at the circuit's own damped frequency and decays like e^(−αt). The forced response oscillates at the drive frequency and lasts as long as the drive. Near resonance they beat against each other. Eventually only the forced response is left: that's the sinusoidal steady state." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Parallel RLC: three constraints", mins: 25,
    blurb: "Sketch a resonance from two asymptotes and one point.",
    takeaway: "Parallel RLC: H = V/I = 1/(G + j(ωC − 1/ωL)), G = 1/R. Low ω: H ≈ jωL (looks like the inductor, +90°). High ω: H ≈ 1/jωC (the capacitor, −90°). At ω₀ = 1/√(LC) the L and C terms cancel: H = R, angle 0; the LC pair is an open. Sketch from those three constraints.",
    steps: [
      { k: "learn", title: "The system function", b: [
        fig(parFig({ I: "I", V: "V", L: "sL", C: "1/sC" })),
        `<p>All three share the same voltage, so add <b>admittances</b> (1/Z):</p>`,
        `<div class="eq">H(jω) = V/I = 1 / ( 1/R + jωC + 1/jωL ) = 1 / ( G + j(ωC − 1/ωL) )</div>`,
        `<p class="aside">Standard form: H(s) = (s/C) / (s² + 2αs + ω₀²). Its denominator is Chapter 12's characteristic polynomial, found without writing a differential equation.</p>`,
      ]},
      { k: "predict", title: "Predict first", b: [
        { t: "mcq", q: "At the frequency where ωC = 1/ωL, what does the parallel RLC look like from the source?", opts: [["Just the resistor R: the L and C currents cancel", true, "The j terms cancel, H = 1/G = R. The LC pair together is an open circuit."], ["A short circuit", false, "That's the series LC at resonance. Here they're in parallel."], ["Just the capacitor", false, "The capacitor's effect is cancelled by the inductor's."]] },
      ]},
      { k: "learn", title: "Three constraints", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>low ω</b></td><td>1/ωL is the biggest admittance (smallest impedance wins in parallel)</td><td class="mono">H ≈ jωL, +90°</td></tr>
          <tr><td><b>high ω</b></td><td>ωC is the biggest</td><td class="mono">H ≈ 1/jωC, −90°</td></tr>
          <tr><td><b>ω = ω₀</b></td><td>L and C cancel</td><td class="mono">H = R, 0°</td></tr></tbody></table></div>`,
        `<p>The two asymptotes cross at ω₀ (where ω₀L = 1/ω₀C). Draw them, mark the point R at ω₀, and join up. The phase goes from +90° through 0° to −90°.</p>`,
      ]},
      { k: "play", title: "Constraints vs the real curve", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), g = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const L = 1e-3, C = 0.1e-6, w0 = 1e5;
          let R = 1000;
          function draw() {
            const H = (w) => Z.div([1, 0], [1 / R, w * C - 1 / (w * L)]);
            f.innerHTML = bmag({ x: [3, 7], y: [0, 4], yl: "|V/I| (Ω)", series: [{ f: (w) => w * L, cls: "s5" }, { f: (w) => 1 / (w * C), cls: "s5" }, { f: (w) => Z.abs(H(w)), cls: "s1" }], marks: [{ x: w0, y: R, label: "R", dy: -8 }] });
            g.innerHTML = bph({ x: [3, 7], series: [{ f: (w) => Z.deg(H(w)), cls: "s1" }], marks: [{ x: w0, y: 0 }] });
            ro.innerHTML = readout([["R", si(R, "Ω")], ["peak height / asymptote crossing", fmt(R / (w0 * L))]]);
          }
          host.append(f, g, slider({ id: id + "-r", label: "R", min: 30, max: 30000, log: true, value: R, show: (x) => si(x, "Ω") }, (x) => { R = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">L = 1 mH, C = 0.1 µF, so ω₀ = 10⁵ rad/s and the asymptotes cross at ω₀L = 100 Ω. Dashed: ωL and 1/ωC. The dot: |H| = R at ω₀. Raise R and the peak gets taller and sharper.</p>`,
      ]},
      { k: "check", title: "Use the constraints", b: [
        `<p>Parallel RLC: L = 2 mH, C = 50 nF, R = 4 kΩ.</p>`,
        { t: "num", q: "ω₀ = ?", a: 100000, unit: "rad/s", why: "1/√(10⁻¹⁰) = 10⁵ rad/s." },
        { t: "num", q: "|H| at ω₀?", a: 4000, unit: "Ω", why: "Exactly R = 4 kΩ, phase 0°." },
        { t: "num", q: "Low-frequency asymptote ωL at ω = 10³ rad/s?", a: 2, unit: "Ω", why: "10³ × 2×10⁻³ = 2 Ω, phase +90°." },
        { t: "num", q: "A current 0.5 mA·cos(10⁵t) drives it. Amplitude of v?", a: 2, unit: "V", why: "At ω₀, V = I·R = 0.5 mA × 4 kΩ = 2 V, in phase with the current." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a parallel RLC look like an inductor at low frequencies?", model: "In parallel, the element with the smallest impedance carries most of the current and sets the voltage. At low frequency the inductor's impedance ωL is tiny compared with R and 1/ωC, so it dominates: V ≈ jωL·I, rising with frequency and leading by 90°." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Bandwidth and Q", mins: 25,
    blurb: "How sharp is the peak?",
    takeaway: "The 0.707 (half-power) frequencies sit where the denominator is G(1 ± j). Their gap is the bandwidth: G/C = 1/RC = 2α (parallel). Q = ω₀/bandwidth = ω₀RC = R/ω₀L = ω₀/2α = peak height ÷ asymptote crossing. For Q > 5, ω0.707 ≈ ω₀ ± α. Phase is ±45° there. Q > ½ ⇔ complex roots ⇔ under-damped ⇔ a peak.",
    steps: [
      { k: "learn", title: "The half-power points", b: [
        `<p>|H| peaks at R. It's down to 0.707R where the denominator G + j(ωC − 1/ωL) has equal real and imaginary parts:</p>`,
        `<div class="eq">ωC − 1/ωL = ±G</div>`,
        `<p>Solving the quadratic gives two positive roots, one each side of ω₀:</p>`,
        `<div class="eq">ω<sub>0.707</sub> = ±G/2C + √( (G/2C)² + 1/LC )</div>`,
        `<p>Subtract them: <b>bandwidth = G/C = 1/RC</b>. And 1/RC = 2α: the same α that sets how fast the ringing dies.</p>`,
      ]},
      { k: "play", title: "Slide Q", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const L = 1e-3, C = 0.1e-6, w0 = 1e5;
          let Q = 5;
          function draw() {
            const R = Q * w0 * L, G = 1 / R, H = (w) => Z.abs(Z.div([1, 0], [G, w * C - 1 / (w * L)])) / R;
            const a = G / (2 * C), lo = -a + Math.sqrt(a * a + w0 * w0), hi = a + Math.sqrt(a * a + w0 * w0);
            f.innerHTML = plot({ x: [0, 2e5], y: [0, 1.08], xt: [0, 5e4, 1e5, 1.5e5, 2e5], yt: [0, 0.5, 0.707, 1], xtf: (v) => fmt(v / 1e3) + "k", xl: "ω (rad/s, linear)", yl: "|H| / R", series: [{ f: () => 0.707, cls: "s5" }, { f: H, cls: "s1", n: 600 }], marks: [{ x: lo, y: 0.707, r: 5 }, { x: hi, y: 0.707, r: 5 }], label: "Resonance peak on a linear frequency axis" });
            ro.innerHTML = readout([["R = Q·ω₀L", si(R, "Ω")], ["bandwidth 1/RC", fmt(1 / (R * C), 3) + " rad/s"], ["lower 0.707", fmt(lo, 4)], ["upper 0.707", fmt(hi, 4)], ["ω₀ / bandwidth", fmt(w0 * R * C)]]);
          }
          host.append(f, slider({ id: id + "-q", label: "Q", min: 0.6, max: 50, log: true, value: Q, show: (x) => fmt(x) }, (x) => { Q = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Linear frequency axis, peak scaled to 1 so only the shape changes. At low Q the two dots sit lopsided around ω₀; at high Q they're nearly symmetric.</p>`,
      ]},
      { k: "learn", title: "Q from the frequency side", b: [
        `<div class="key">Q = ω₀ / bandwidth</div>`,
        `<div class="eq">parallel: Q = ω₀RC = R/(ω₀L) = R√(C/L)     Q = ω₀/2α</div>`,
        `<ul><li>Q = (peak height R) ÷ (height where the asymptotes cross, ω₀L). <b>Peakiness.</b></li><li>For Q > 5: ω<sub>0.707</sub> ≈ ω₀ ± α, symmetric (within ½%).</li><li>Phase is +45° at the lower 0.707 point and −45° at the upper one.</li></ul>`,
        `<p>Five constraints now: two asymptotes, the peak, and the two 0.707 points.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>Parallel RLC: L = 1 mH, C = 0.1 µF, R = 1 kΩ.</p>`,
        { t: "num", q: "Q = ω₀RC?", a: 10, why: "10⁵ × 10³ × 10⁻⁷ = 10." },
        { t: "num", q: "Bandwidth?", a: 10000, unit: "rad/s", why: "ω₀/Q = 10⁴ rad/s (= 1/RC)." },
        { t: "num", q: "Approximate upper 0.707 frequency?", a: 105000, tol: 0.005, unit: "rad/s", hint: "ω₀ + α, with α = half the bandwidth.", why: "10⁵ + 5000 = 1.05 × 10⁵ (exact: 1.051 × 10⁵)." },
      ]},
      { k: "why", title: "One idea, four faces", b: [
        `<p>Q > ½ means α < ω₀. That makes the roots complex, so the circuit is under-damped, so it rings when kicked (Chapter 12), and its frequency response has a <b>peak</b>. All the same fact.</p>`,
        { t: "mcq", q: "A parallel RLC has Q = 0.3. Its frequency response…", opts: [["has no resonant peak: the roots are real, it's over-damped", true, "Q < ½ → α > ω₀ → real roots. The curve just rounds over between the asymptotes."], ["has a very sharp peak", false, "Sharp peaks need high Q."], ["is flat", false, "It still rises like ωL and falls like 1/ωC."]] },
      ]},
      { k: "check", title: "Filtering a square wave", b: [
        `<p>A 1 kHz square wave = sines at 1 kHz, 3 kHz (⅓ size), 5 kHz (⅕), 7 kHz… It goes into a high-Q band-pass tuned to <b>5 kHz</b>.</p>`,
        { t: "mcq", q: "What comes out?", opts: [["A nearly pure 5 kHz sine, ⅕ the size of the fundamental", true, "Only the 5th harmonic sits inside the narrow passband. This is how a receiver picks one station."], ["A 1 kHz sine", false, "1 kHz is far outside a narrow 5 kHz band."], ["A cleaner square wave", false, "A narrow filter removes most of the harmonics that make the corners."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is bandwidth, and how does Q relate to it?", model: "Bandwidth is the width of the resonant peak between the two frequencies where the response drops to 0.707 of its peak (the half-power points). Q is the resonant frequency divided by the bandwidth, so a high-Q circuit has a narrow, sharp peak and picks out frequencies very selectively." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Series RLC: the dual", mins: 20,
    blurb: "Current peaks instead of voltage. Small R for high Q.",
    takeaway: "Series RLC: H = I/V_i = (s/L)/(s² + (R/L)s + 1/LC), the same form. At ω₀ the L and C impedances cancel (a short), so I = V_i/R. Bandwidth = R/L = 2α, Q = ω₀L/R = (1/R)√(L/C). High Q needs a LARGE R in parallel but a SMALL R in series. Any second-order circuit: write the quadratic in standard form, read off ω₀ and α.",
    steps: [
      { k: "learn", title: "Same shape, swapped roles", b: [
        fig(serFig()),
        `<div class="eq">I = V<sub>i</sub> / (R + sL + 1/sC)  ⟹  H(s) = I/V<sub>i</sub> = (s/L) / (s² + (R/L)s + 1/LC)</div>`,
        `<div class="tbl"><table><thead><tr><th></th><th>parallel</th><th>series</th></tr></thead><tbody>
          <tr><td>peaks</td><td>voltage</td><td>current</td></tr>
          <tr><td>at ω₀ the LC pair is</td><td>an open</td><td>a short</td></tr>
          <tr><td>α</td><td class="mono">1/2RC</td><td class="mono">R/2L</td></tr>
          <tr><td>bandwidth</td><td class="mono">1/RC</td><td class="mono">R/L</td></tr>
          <tr><td>Q</td><td class="mono">R/ω₀L = R√(C/L)</td><td class="mono">ω₀L/R = (1/R)√(L/C)</td></tr></tbody></table></div>`,
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<p>A student wants a sharper series-resonant filter and says: "Higher Q needs a bigger R, like in the parallel circuit."</p>`,
        { t: "mcq", q: "What's wrong?", opts: [["In series, R is what limits the current at resonance and burns the energy. Less R → higher Q", true, "Parallel: a big R draws little current, so less loss. Series: a small R drops little voltage, so less loss. Confusing, but correct."], ["Nothing", false, "Series Q = ω₀L/R falls as R rises."], ["R doesn't affect Q in series", false, "It's in the formula."]] },
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>Series RLC: L = 10 mH, C = 10 nF, R = 20 Ω, driven by 0.5 V·cos ωt.</p>`,
        { t: "num", q: "ω₀ = ?", a: 100000, unit: "rad/s", why: "1/√(10⁻¹⁰) = 10⁵ rad/s." },
        { t: "num", q: "Q = ω₀L/R?", a: 50, why: "10⁵ × 0.01 / 20 = 50." },
        { t: "num", q: "Bandwidth R/L?", a: 2000, unit: "rad/s", why: "20/0.01 = 2000 rad/s = ω₀/Q." },
        { t: "num", q: "Current amplitude at ω₀?", a: 25, unit: "mA", why: "L and C cancel: I = 0.5/20 = 25 mA." },
      ]},
      { k: "learn", title: "Any second-order circuit", b: [
        fig(S.svg(360, 170, S.wire([60, 82], [60, 30], [200, 30]) + S.wire([60, 118], [60, 150], [200, 150]) + S.vsrc(60, 100, "v_z", { side: "right" }) + S.cap(150, 30, 150, 150, "C", { side: "left" }) + S.res(250, 30, 250, 90, "R") + S.ind(250, 90, 250, 150, "L") + S.wire([200, 30], [250, 30]) + S.wire([200, 150], [250, 150]) + S.dot(200, 30) + S.dot(200, 150), { max: 360, label: "Capacitor in parallel with a series R-L branch" })),
        `<p>A real inductor has wire resistance: R–L in series, with C across it. Its admittance:</p>`,
        `<div class="eq">1/Z = sC + 1/(R + sL)  →  its numerator is ∝ s² + (R/L)s + 1/LC</div>`,
        `<p>Recipe: get the quadratic into the form <b>s² + 2αs + ω₀²</b>, then read off ω₀ and α, and Q = ω₀/2α.</p>`,
        { t: "num", q: "R = 2 Ω, L = 4 mH, C = 25 µF. Q = ?", a: 6.32, tol: 0.02, hint: "ω₀ = 1/√(LC), α = R/2L.", why: "ω₀ = 1/√(10⁻⁷) ≈ 3162 rad/s, α = 2/0.008 = 250 s⁻¹, Q = 3162/500 ≈ 6.3. Complex roots: resonant." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a large resistor give high Q in a parallel RLC, but a small resistor give high Q in a series RLC?", model: "Q is high when little energy is lost per cycle. In parallel, the resistor sees the full voltage, so a large R draws little current and wastes little power. In series, the resistor carries the full current, so a small R drops little voltage and wastes little power." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Four filters from one circuit", mins: 25,
    blurb: "Take the output across R, C, L, or L+C.",
    takeaway: "Series RLC, output across: R → band-pass (2αs/(s² + 2αs + ω₀²), peak 1); C → low-pass (ω₀²/…); L → high-pass (s²/…); L and C together → notch (band-stop, zero at ω₀). Higher Q = more selective. At ω₀ the capacitor (and inductor) voltage is Q times the input!",
    steps: [
      { k: "play", title: "Move the output", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), sch = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const L = 10e-3, C = 10e-9, w0 = 1e5;
          let which = 0, Q = 2;
          const names = ["across R: band-pass", "across C: low-pass", "across L: high-pass", "across L + C: notch"];
          function draw() {
            const R = (w0 * L) / Q, H = (w) => { const zl = [0, w * L], zc = [0, -1 / (w * C)], d = [R, w * L - 1 / (w * C)], n = [[R, 0], zc, zl, [0, w * L - 1 / (w * C)]][which]; return Z.div(n, d); };
            sch.innerHTML = serFig(["r", "c", "l", "lc"][which]);
            f.innerHTML = bmag({ x: [3, 7], y: [-3, 2], yl: "|V_out / V_i|", series: [{ f: () => 1, cls: "s5" }, { f: (w) => Z.abs(H(w)), cls: "s1" }], marks: [{ x: w0, y: Math.max(1e-3, Z.abs(H(w0))) }] });
            ro.innerHTML = readout([["output", names[which]], ["R = ω₀L/Q", si(R, "Ω")], ["|H| at ω₀", fmt(Z.abs(H(w0)))]]);
          }
          host.append(toggle(["R", "C", "L", "L + C"], (k) => { which = k; draw(); }), sch, f, slider({ id: id + "-q", label: "Q", min: 0.5, max: 50, log: true, value: Q, show: (x) => fmt(x) }, (x) => { Q = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">L = 10 mH, C = 10 nF, ω₀ = 10⁵ rad/s. Pick where the output is taken, then change Q (by changing R). Watch the low-pass peak at high Q: it rises far above 1.</p>`,
      ]},
      { k: "why", title: "Guess each shape with opens and shorts", b: [
        { t: "sort", q: "At very LOW frequency (C open, L short), which outputs get most of the input?", bins: ["≈ all of v_i", "≈ 0"], items: [
          ["v_c (across C)", 0, "C is open: no current, no drop on R or L, so all of v_i sits on C. Low-pass."],
          ["v_r (across R)", 1, "No current flows, so v_r = 0."],
          ["v_l (across L)", 1, "L is a short: v_l = 0. High-pass."],
          ["v_l + v_c", 0, "C takes everything. The notch only bites near ω₀."],
        ]},
        `<p class="aside">Do the same at high frequency (C short, L open): v<sub>l</sub> takes it all, so L is high-pass; v<sub>c</sub> → 0.</p>`,
      ]},
      { k: "learn", title: "The four system functions", b: [
        `<div class="tbl"><table><tbody>
          <tr><td>band-pass (R)</td><td class="mono">2αs / (s² + 2αs + ω₀²)</td><td>= 1 at ω₀</td></tr>
          <tr><td>low-pass (C)</td><td class="mono">ω₀² / (s² + 2αs + ω₀²)</td><td>= −jQ at ω₀</td></tr>
          <tr><td>high-pass (L)</td><td class="mono">s² / (s² + 2αs + ω₀²)</td><td>= +jQ at ω₀</td></tr>
          <tr><td>notch (L + C)</td><td class="mono">(s² + ω₀²) / (s² + 2αs + ω₀²)</td><td>= 0 at ω₀</td></tr></tbody></table></div>`,
        `<p>Same denominator for all four: the circuit's own resonance. Only the numerator (where you look) changes.</p>`,
      ]},
      { k: "learn", title: "Q times the input", b: [
        `<p>At ω₀ the current is V<sub>i</sub>/R. The capacitor voltage is that current times 1/ω₀C:</p>`,
        `<div class="key">|V<sub>c</sub>| = |V<sub>l</sub>| = Q·|V<sub>i</sub>| at resonance</div>`,
        { t: "num", q: "A series RLC with Q = 50 is driven at ω₀ by 0.5 V. Capacitor voltage amplitude?", a: 25, unit: "V", why: "50 × 0.5 = 25 V, from a half-volt source. A capacitor rated for 16 V would fail." },
        `<p>That's the bridge story: a small, steady push at the resonant frequency builds a response Q times bigger.</p>`,
      ]},
      { k: "whatif", title: "What if…", b: [
        `<p>A metal detector: the inductor is a big flat coil. Nearby metal changes L a tiny bit, which shifts ω₀. You measure the amplitude across R.</p>`,
        { t: "mcq", q: "To notice the smallest change in L, which drive frequency should you pick?", opts: [["On a steep side of the peak, near a 0.707 frequency", true, "There a small shift of the curve changes |V_r| the most. At the very top the curve is flat, so a small shift barely changes the output."], ["Exactly at ω₀", false, "The peak's top is flat: its slope is zero."], ["Far from ω₀", false, "Out there the curve is flat-ish and the signal is tiny."]] },
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>Series RLC: L = 1 mH, C = 1 µF, output across C. Driven by 1 V.</p>`,
        { t: "num", q: "ω₀ = ?", a: 31623, tol: 0.01, unit: "rad/s", why: "1/√(10⁻⁹) ≈ 31 600 rad/s (about 5 kHz)." },
        { t: "num", q: "What R gives Q = 1?", a: 31.6, tol: 0.02, unit: "Ω", hint: "Q = (1/R)√(L/C).", why: "√(L/C) = √1000 ≈ 31.6 Ω. A low-pass with no big peak." },
        { t: "num", q: "With R = 3.16 Ω instead, |v_c| at ω₀?", a: 10, tol: 0.02, unit: "V", why: "Q = 10, so 10 × 1 V. A poor low-pass: it boosts frequencies near ω₀ tenfold." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How can the capacitor voltage be ten times the source voltage if energy is conserved?", model: "The capacitor and inductor voltages are each Q times the input but opposite in sign, so they cancel around the loop and the source only sees R. Energy isn't created: it builds up over many cycles and sloshes between L and C. The source only has to replace the small amount lost in R each cycle." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Stored energy at resonance", mins: 20,
    blurb: "Energy sloshes between L and C; the source just tops it up.",
    takeaway: "Series RLC at ω₀: V_c = −jQV_i and V_l = +jQV_i cancel. Energy moves between L and C at 2ω₀, but the total stays constant: ½L(V_i/R)². Q = stored energy ÷ average energy lost per radian = ω₀L/R. Three definitions of Q (ω₀/2α, ω₀/bandwidth, energy ratio) agree for second-order circuits.",
    steps: [
      { k: "play", title: "Watch the energy", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const L = 10e-3, C = 10e-9, R = 20, Vi = 0.5, w0 = 1e5;
          let r = 1;
          function draw() {
            const w = r * w0, I = Z.div([Vi, 0], [R, w * L - 1 / (w * C)]), Vc = Z.div(I, [0, w * C]);
            const iL = (t) => Z.abs(I) * Math.cos(w * t + Math.atan2(I[1], I[0])), vC = (t) => Z.abs(Vc) * Math.cos(w * t + Math.atan2(Vc[1], Vc[0]));
            const T = (2 * Math.PI) / w0, X = (x) => x * T;
            const wl = (x) => 0.5 * L * iL(X(x)) ** 2 * 1e6, wc = (x) => 0.5 * C * vC(X(x)) ** 2 * 1e6;
            f.innerHTML = plot({ x: [0, 2], y: [0, 3.6], xt: [0, 0.5, 1, 1.5, 2], yt: [0, 1, 2, 3], xl: "t (cycles of ω₀)", yl: "energy (µJ)", series: [{ f: wl, cls: "s1" }, { f: wc, cls: "s2" }, { f: (x) => wl(x) + wc(x), cls: "s3" }], label: "Inductor energy, capacitor energy and their total" });
            ro.innerHTML = readout([["ω / ω₀", fmt(r)], ["|V_c|", fmt(Z.abs(Vc)) + " V"], ["current", fmt(Z.abs(I) * 1e3) + " mA"]]);
          }
          host.append(f, slider({ id: id + "-r", label: "Drive frequency ω / ω₀", min: 0.97, max: 1.03, step: 0.002, value: r, show: (x) => fmt(x, 4) }, (x) => { r = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The Part 4 circuit: L = 10 mH, C = 10 nF, R = 20 Ω (Q = 50), 0.5 V drive. Orange: ½Li². Blue: ½Cv². Green: the total. At exactly ω₀ the total is flat. Detune by 1% and it wobbles (the source has to push energy in and take it back: reactive power), and everything shrinks.</p>`,
      ]},
      { k: "learn", title: "The algebra", b: [
        `<p>At ω₀, I = V<sub>i</sub>/R (real). Then</p>`,
        `<div class="eq">V<sub>c</sub> = I/(jω₀C) = −jQV<sub>i</sub>     V<sub>l</sub> = jω₀L·I = +jQV<sub>i</sub></div>`,
        `<div class="eq">w<sub>L</sub> = ¼L(V<sub>i</sub>/R)²(1 + cos 2ω₀t)     w<sub>C</sub> = ¼L(V<sub>i</sub>/R)²(1 − cos 2ω₀t)</div>`,
        `<div class="key">w<sub>total</sub> = ½L(V<sub>i</sub>/R)²   constant</div>`,
        `<p>The L–C pair together looks like a short (their voltages cancel), but each one alone can carry a dangerous voltage. Q-meters use exactly this to measure an inductor's Q.</p>`,
      ]},
      { k: "learn", title: "Q from energy", b: [
        `<div class="key">Q = stored energy / (average energy dissipated per radian)</div>`,
        `<p>Power lost in R: V<sub>i</sub>²/2R. Per radian: divide by ω₀. So Q = ½L(V<sub>i</sub>/R)² ÷ (V<sub>i</sub>²/2Rω₀) = ω₀L/R. Same answer.</p>`,
        `<div class="tbl"><table><tbody>
          <tr><td>time view (Ch 12)</td><td class="mono">Q = ω₀/2α</td><td>about how many cycles it rings</td></tr>
          <tr><td>frequency view</td><td class="mono">Q = ω₀/bandwidth</td><td>how sharp the peak is</td></tr>
          <tr><td>energy view</td><td class="mono">Q = stored / lost per radian</td><td>how lossy it is</td></tr></tbody></table></div>`,
        `<p class="aside">All three agree for second-order circuits; they differ slightly for higher-order ones.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>Series RLC: L = 10 mH, R = 20 Ω, driven at ω₀ = 10⁵ rad/s by 0.5 V.</p>`,
        { t: "num", q: "Total stored energy?", a: 3.125, tol: 0.01, unit: "µJ", why: "½ × 0.01 × (0.025)² = 3.125 µJ." },
        { t: "num", q: "Average power burned in R?", a: 6.25, tol: 0.01, unit: "mW", why: "V_i²/2R = 0.25/40 = 6.25 mW." },
        { t: "num", q: "Energy lost per radian, and Q = stored ÷ that?", a: 50, hint: "Lost per radian = 6.25 mW / 10⁵ rad/s = 62.5 nJ.", why: "3.125 µJ / 62.5 nJ = 50 = ω₀L/R." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "At resonance, what is the source actually doing, if the energy just moves between L and C?", model: "The source only supplies the energy the resistor burns each cycle. At resonance the inductor and capacitor trade their stored energy back and forth with nothing needed from outside, so the total stays constant. The source sees just R, in phase, with no reactive power." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Peaky means ringy", mins: 15,
    blurb: "Read the step response from the frequency response, and back.",
    takeaway: "Q links both views: a tall, narrow frequency-response peak (high Q) means the circuit rings for about Q cycles when kicked; no peak (low Q) means the transient dies fast. ω_d, ω₀ and the peak frequency nearly coincide for high Q.",
    steps: [
      { k: "play", title: "Both views at once", b: [
        (host, id) => {
          const wrap = el(`<div class="two"></div>`), a = el(`<div class="fig"></div>`), b = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const L = 10e-3, C = 10e-9, w0 = 1e5;
          let R = 40;
          function draw() {
            const H = (w) => 1 / Math.hypot(1 - w * w * L * C, w * R * C), sim = simSer(R, L, C, () => 0, 1, 2e-3, 2400);
            a.innerHTML = bmag({ w: 300, h: 220, x: [4, 6], y: [-2, 2], yl: "|V_c/V_i|", series: [{ f: H, cls: "s1" }], label: "Frequency response, capacitor output" });
            b.innerHTML = plot({ w: 300, h: 220, x: [0, 2], y: [-1.05, 1.05], xt: [0, 1, 2], yt: [-1, 0, 1], xl: "t (ms)", yl: "v_C (V)", series: [{ pts: sim.filter((p, k) => k % 2 === 0).map(([t, v]) => [t * 1e3, v]), cls: "s1" }], label: "Zero-input response from 1 V on the capacitor" });
            ro.innerHTML = readout([["Q = (1/R)√(L/C)", fmt(1000 / R)], ["peak |V_c/V_i|", fmt(Math.max(...[0.9, 0.95, 0.98, 0.99, 0.995, 1, 1.005].map((k) => H(k * w0))))]]);
          }
          wrap.append(a, b);
          host.append(wrap, slider({ id: id + "-r", label: "R", min: 20, max: 2000, log: true, value: R, show: (x) => fmt(x, 3) + " Ω" }, (x) => { R = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Series RLC, L = 10 mH, C = 10 nF (ω₀ = 10⁵ rad/s, period ≈ 63 µs). Left: frequency response. Right: start with 1 V on C and no input. Count the cycles of ringing and compare with Q.</p>`,
      ]},
      { k: "check", title: "Read one from the other", b: [
        { t: "mcq", q: "A filter's frequency response has a peak 30 times higher than its asymptotes' crossing. Kick it with a short pulse. It will…", opts: [["ring at about ω₀ for roughly 30 cycles", true, "Q ≈ 30 from the peak height, and Q is also roughly the number of cycles of ringing."], ["settle smoothly with no overshoot", false, "That's low Q (< ½)."], ["ring forever", false, "Only if there's no loss at all."]] },
        { t: "mcq", q: "A circuit's step response settles almost immediately with a tiny overshoot. Its frequency response…", opts: [["has little or no peak (low Q)", true, "Fast decay = big α compared with ω₀ = low Q = broad, flat-topped response."], ["has a very sharp peak", false, "Sharp peaks ring for a long time."], ["is a notch", false, "That depends on where the output is, not on the damping."]] },
      ]},
      { k: "learn", title: "Three nearby frequencies", b: [
        `<ul><li><b>ω₀ = 1/√(LC)</b>: undamped resonance; where L and C cancel.</li><li><b>ω<sub>d</sub> = √(ω₀² − α²)</b>: what the circuit rings at when kicked.</li><li><b>peak frequency</b> of a given output (for v<sub>C</sub> it's a bit below ω₀).</li></ul>`,
        `<p>For high Q they're all within a fraction of a percent, and the peak height is very nearly Q × input. For low Q, keep them apart.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a sharply peaked frequency response go with long ringing?", model: "Both come from small damping relative to ω₀, which is high Q. Little energy is lost per cycle, so after a kick the oscillation lasts many cycles; and a steady drive at ω₀ can build up a large response, while frequencies a little off resonance can't, which makes the peak narrow." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ch14", eyebrow: "Chapter 14", title: "Sinusoidal Steady State: Resonance",
    intro: `<p>Seven parts. Chapter 12's ringing circuits, now seen from the frequency side. You'll sketch resonance curves from a few constraints, meet bandwidth and Q, build four different filters from one series RLC, and see why a capacitor can hold Q times the source voltage.</p><p class="aside">Uses Chapter 13's impedances and log plots. Arrow keys ← → move between steps. Need a refresher? <a href="13-sinusoidal-steady-state.html">Chapter 13</a>.</p>`,
    after: `<p>Open the Chapter 14 PDF and go to the <b>exercises and problems</b> at the end. For each circuit, write the denominator as s² + 2αs + ω₀², then name ω₀, α and Q before you draw anything.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7],
    summary: `
      <h3>Resonant systems</h3>
      <p>System function with s² + 2αs + ω₀² in the denominator and complex roots (α < ω₀, Q > ½). Total response to a switched-on sine = decaying natural part at ω<sub>d</sub> + forced part at ω₁ (beats when close).</p>
      <h3>Parallel RLC (output v, input i)</h3>
      <div class="eq">H = 1/(G + j(ωC − 1/ωL)) · ω₀ = 1/√(LC) · α = 1/2RC</div>
      <p>Low ω: jωL (+90°). High ω: 1/jωC (−90°). At ω₀: R (0°), LC pair = open. Bandwidth 1/RC = 2α. Q = ω₀RC = R/ω₀L.</p>
      <h3>Series RLC (output i, input v)</h3>
      <div class="eq">H = (s/L)/(s² + (R/L)s + 1/LC) · α = R/2L · bandwidth R/L · Q = ω₀L/R</div>
      <p>At ω₀: LC pair = short, I = V<sub>i</sub>/R. High Q: small series R, large parallel R.</p>
      <h3>Sketching</h3>
      <p>Low-ω asymptote, high-ω asymptote, value at ω₀; plus 0.707 points ≈ ω₀ ± α (Q > 5) with phase ±45°. Q = peak ÷ asymptote crossing.</p>
      <h3>Four filters (series RLC)</h3>
      <p>Across R: band-pass 2αs/D. Across C: low-pass ω₀²/D. Across L: high-pass s²/D. Across L+C: notch (s² + ω₀²)/D. At ω₀, |V<sub>c</sub>| = |V<sub>l</sub>| = Q|V<sub>i</sub>|.</p>
      <h3>Energy and Q</h3>
      <p>At ω₀: w<sub>total</sub> = ½L(V<sub>i</sub>/R)², constant; energy swaps L ↔ C at 2ω₀.</p>
      <div class="eq">Q = ω₀/2α = ω₀/bandwidth = stored / (lost per radian)</div>
      <p>Peaky response ⇔ long ringing (~Q cycles). For high Q, ω₀ ≈ ω<sub>d</sub> ≈ peak frequency.</p>`,
  };
  Course.start(window.CHAPTER);
})();
