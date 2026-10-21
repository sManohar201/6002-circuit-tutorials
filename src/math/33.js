(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;
  const tbl = (head, rows) => `<div class="tbl"><table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`;
  const TAU = 2 * Math.PI;
  /* Stem plot points: vertical line to each sample plus a dot. */
  const stems = (ys, x0 = 0) => { const pts = []; ys.forEach((y, n) => pts.push([n + x0, 0], [n + x0, y], [n + x0, 0])); return pts; };
  /* z-plane picture: unit circle, poles (×), zeros (o), optional point on the circle. */
  function zplane(poles, zeros, o = {}) {
    const W = 300, C = 150, R = 110, P = ([x, y]) => [C + R * x, C - R * y];
    let s = `<line x1="10" y1="${C}" x2="${W - 10}" y2="${C}" style="stroke:var(--muted)"/><line x1="${C}" y1="10" x2="${C}" y2="${W - 10}" style="stroke:var(--muted)"/><circle cx="${C}" cy="${C}" r="${R}" style="fill:none;stroke:var(--cool);stroke-width:2"/>`;
    s += S.t(W - 14, C - 6, "Re", { a: "end", cls: "lab" }) + S.t(C + 6, 22, "Im", { a: "start", cls: "lab" }) + S.t(C + R + 4, C + 16, "1", { a: "start", cls: "lab" });
    if (o.at) { const q = P(o.at); poles.concat(zeros).forEach((p) => { const a = P(p); s += `<line x1="${a[0]}" y1="${a[1]}" x2="${q[0]}" y2="${q[1]}" style="stroke:var(--muted);stroke-width:1;stroke-dasharray:4 4"/>`; }); s += `<circle cx="${q[0]}" cy="${q[1]}" r="6" style="fill:var(--good)"/>`; }
    zeros.forEach((z) => { const a = P(z); s += `<circle cx="${a[0]}" cy="${a[1]}" r="7" style="fill:none;stroke:var(--good);stroke-width:3"/>`; });
    poles.forEach((p) => { const a = P(p); s += `<text x="${a[0]}" y="${a[1] + 7}" text-anchor="middle" class="big" style="fill:var(--bad)">×</text>`; });
    return S.svg(W, W, s, { label: o.label || "z-plane: unit circle, poles as crosses, zeros as circles", max: 300 });
  }

  const p1 = {
    id: "p1", title: "Difference equations: systems that step", mins: 20,
    blurb: "Inside a chip, many signals only exist at clock ticks. Their rules are difference equations: the next value from the last few.",
    takeaway: "A discrete-time system computes y[n] from current and past inputs and past outputs. Examples: accumulator y[n] = y[n−1] + x[n] (a digital integrator); first-order smoother y[n] = a·y[n−1] + (1 − a)·x[n], an ‘RC’ whose step response approaches 1 as 1 − aⁿ⁺¹, with a time constant of about 1/(1 − a) samples when a is close to 1; moving average y[n] = (x[n] + … + x[n − N + 1])/N. Outputs that feed back (IIR) can ring or blow up; ones using only inputs (FIR) always settle.",
    steps: [
      { k: "learn", title: "Three systems in one line each", b: [
        tbl(["System", "Rule", "Analog cousin"], [["Accumulator", "y[n] = y[n−1] + x[n]", "integrator"], ["First-order smoother", "y[n] = a·y[n−1] + (1 − a)·x[n]", "RC low-pass"], ["Moving average (N)", "y[n] = (x[n] + … + x[n−N+1])/N", "averaging over a window"]]),
        `<p class="aside">n counts samples (clock ticks). y[n − 1] is “the previous output”: a register on a chip, or a capacitor holding last cycle's charge.</p>`,
      ]},
      { k: "play", title: "The digital RC", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 0.8;
          function draw() {
            const ys = []; let y = 0; for (let n = 0; n < 30; n++) { y = a * y + (1 - a) * 1; ys.push(y); }
            const tc = a > 0 ? -1 / Math.log(a) : 0;
            f.innerHTML = plot({ x: [-1, 30], y: [-0.5, 1.5], xt: [0, 10, 20, 30], yt: [0, 0.5, 1], xl: "sample n", h: 220, series: [{ pts: stems(ys), cls: "s2" }], marks: ys.map((v, n) => ({ x: n, y: v, r: 3.5 })), label: "Step response of the first-order smoother" });
            ro.innerHTML = readout([["a", fmt(a, 3)], ["Time constant −1/ln a", a > 0 && a < 1 ? fmt(tc, 3) + " samples" : "—"], ["Rough rule 1/(1 − a)", a < 1 ? fmt(1 / (1 - a), 3) + " samples" : "—"], ["Behaviour", a < 0 ? "alternates sign each step: ringing at f_s/2" : a < 1 ? "smooth approach" : "never settles"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "Feedback coefficient a", min: -0.9, max: 1.05, step: 0.01, value: a }, (v) => { a = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">a near 1: slow and smooth (heavy averaging). a = 0: output equals input, no memory. Negative a: the output zig-zags, a ringing at half the sample rate that no single analog RC can do. a &gt; 1: it runs away.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "y[n] = 0.5y[n−1] + 0.5x[n], starting at 0, x = 1 from n = 0. y[2]?", a: 0.875, why: "y[0] = 0.5, y[1] = 0.75, y[2] = 0.875 (= 1 − 0.5³)." },
        { t: "num", q: "Roughly how many samples is the time constant of y[n] = 0.99y[n−1] + 0.01x[n]?", a: 100, tol: 0.02, why: "1/(1 − 0.99) = 100 (exactly −1/ln 0.99 = 99.5)." },
        { t: "mcq", q: "Which system always settles, whatever its coefficients?", opts: [["y[n] = 0.3x[n] + 2x[n−1] − 5x[n−2] (inputs only)", true, "No feedback: the output depends on three inputs, so an impulse dies after three samples. FIR filters are always stable."], ["y[n] = 1.1y[n−1] + x[n]", false, "Feedback with |a| > 1 grows."], ["y[n] = y[n−1] + x[n]", false, "An accumulator holds a step forever: it never settles back."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between an FIR and an IIR system?", model: "An FIR system's output depends only on the current and a fixed number of past inputs, so an impulse response stops after that many samples and it's always stable. An IIR system also feeds back past outputs, so an impulse can echo forever, decaying, ringing or growing depending on the feedback coefficients." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "z⁻¹: the delay, and the z-transform", mins: 25,
    blurb: "Give ‘delay by one sample’ a symbol, z⁻¹, and difference equations become algebra, just as s did for derivatives.",
    takeaway: "X(z) = Σ x[n]z^(−n). Delaying by one sample multiplies by z⁻¹. So y[n] = a·y[n−1] + b·x[n] becomes Y = a z⁻¹Y + bX, giving H(z) = Y/X = b/(1 − a z⁻¹) = bz/(z − a): a pole at z = a. Pairs: δ[n] ↔ 1; u[n] ↔ 1/(1 − z⁻¹); aⁿu[n] ↔ 1/(1 − a z⁻¹) (a geometric series). FIR filters have only zeros (plus poles at the origin); IIR filters have poles elsewhere.",
    steps: [
      { k: "learn", title: "The transform", b: [
        `<div class="eq">X(z) = x[0] + x[1]z⁻¹ + x[2]z⁻² + …</div>`,
        `<p>Think of z⁻¹ as a tag meaning “one sample later”. The sequence becomes a polynomial (or series) in z⁻¹. Shift the whole sequence one sample later and every power goes up by one: <b>delay = ×z⁻¹</b>.</p>`,
        tbl(["Sequence", "X(z)"], [["δ[n] (1 at n = 0)", "1"], ["δ[n − k] (1 at n = k)", "z^(−k)"], ["u[n] (all 1s)", "1/(1 − z⁻¹)"], ["aⁿ for n ≥ 0", "1/(1 − a z⁻¹)"]]),
        `<p class="aside">The last two are Module 29's geometric series: 1 + az⁻¹ + a²z⁻² + … = 1/(1 − az⁻¹).</p>`,
      ]},
      { k: "math", title: "Difference equation → H(z)", b: [
        steps([["y[n] = a·y[n−1] + b·x[n]", ""], ["Transform: delay → z⁻¹", "Y = a z⁻¹ Y + b X"], ["Collect Y", "Y(1 − a z⁻¹) = bX"], ["Transfer function", "H(z) = b/(1 − a z⁻¹) = bz/(z − a)"]]),
        `<p>A <b>pole at z = a</b>. The impulse response is b·aⁿ: it decays if |a| &lt; 1. Same story as Laplace, where 1/(s + α) gave e<sup>−αt</sup>.</p>`,
      ]},
      { k: "learn", title: "Block diagrams", b: [
        fig(S.svg(520, 150, S.t(30, 80, "x[n]", { cls: "lab" }) + S.wire([55, 75], [100, 75]) + `<circle cx="120" cy="75" r="18" style="fill:none;stroke:var(--ink);stroke-width:2.5"/>` + S.t(120, 81, "+", { cls: "big" }) + S.wire([138, 75], [300, 75]) + S.t(330, 80, "y[n]", { a: "start", cls: "lab" }) + S.dot(250, 75) + S.wire([250, 75], [250, 125], [220, 125]) + S.box(160, 105, 60, 40, "z⁻¹") + S.wire([160, 125], [120, 125], [120, 93]) + S.t(105, 113, "×a", { a: "end", cls: "lab" }) + S.arrow(120, 105, 120, 95), { label: "Block diagram: x plus a times the delayed output gives y" })),
        `<p>Three building blocks: adders, multipliers, and z⁻¹ (a register clocked once per sample). Every digital filter, and every switched-capacitor filter, is drawn this way.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "H(z) for y[n] = x[n] + x[n−1]?", opts: [["1 + z⁻¹", true, "FIR: a zero at z = −1 (it cancels f_s/2)."], ["1/(1 − z⁻¹)", false, "That's the accumulator."], ["z⁻¹", false, "That's a pure delay."]] },
        { t: "num", q: "H(z) = 2/(1 − 0.5z⁻¹). Impulse response at n = 3?", a: 0.25, why: "h[n] = 2(0.5)ⁿ: 2 × 0.125 = 0.25." },
        { t: "num", q: "Where is the pole of y[n] = −0.7y[n−1] + x[n]?", a: -0.7, why: "H = 1/(1 + 0.7z⁻¹): pole at z = −0.7. A negative real pole means alternating signs: ringing at f_s/2." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does z⁻¹ make difference equations easy?", model: "Because delaying a sequence by one sample just multiplies its z-transform by z to the minus one. So every delayed term in the difference equation becomes the same unknown times a power of z inverse, and the whole equation turns into algebra: collect terms and divide to get the transfer function." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Poles and the unit circle", mins: 25,
    blurb: "In the z-plane, stability means: every pole inside the unit circle. The pole's radius sets decay per sample; its angle sets oscillation per sample.",
    takeaway: "Sampling maps s to z = e^(sT). The left half s-plane (stable) maps inside the unit circle; the jω axis maps onto the circle; s = 0 maps to z = 1. A pole at z = r·e^(±jθ) gives an impulse response rⁿ·cos(θn + …): it shrinks by r each sample and turns θ radians per sample, i.e. oscillates at f = θ/(2π)·f_s. Stable ⟺ every |pole| < 1 (Module 26's step-by-step rule). Equivalent analog decay rate: σ = ln r / T.",
    steps: [
      { k: "learn", title: "The map from s to z", b: [
        `<div class="eq">z = e<sup>sT</sup> = e<sup>σT</sup>·e<sup>jωT</sup></div>`,
        tbl(["s-plane", "z-plane"], [["σ &lt; 0 (left half, decaying)", "|z| &lt; 1 (inside the circle)"], ["σ = 0 (the jω axis)", "|z| = 1 (the unit circle)"], ["s = 0 (DC)", "z = 1"], ["ω = π/T (f = f_s/2)", "z = −1"]]),
        `<p class="aside">The frequency axis wraps round the circle once every f<sub>s</sub>: that's aliasing (Module 32) appearing in the geometry.</p>`,
      ]},
      { k: "play", title: "Move a pole pair", b: [
        (host, id) => {
          const zf = el(`<div class="fig"></div>`), tf = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let r = 0.9, th = 30;
          function draw() {
            const t = (th * Math.PI) / 180, p = [r * Math.cos(t), r * Math.sin(t)];
            zf.innerHTML = zplane([p, [p[0], -p[1]]], []);
            const h = []; for (let n = 0; n < 40; n++) h.push(r ** n * Math.cos(t * n));
            tf.innerHTML = plot({ x: [-1, 40], y: [-2, 2], xt: [0, 10, 20, 30, 40], yt: [-2, -1, 0, 1, 2], xl: "sample n", h: 180, series: [{ pts: stems(h), cls: "s2" }], marks: h.map((v, n) => ({ x: n, y: Math.max(-2, Math.min(2, v)), r: 3 })), label: "Impulse response for that pole pair" });
            ro.innerHTML = readout([["|pole| = r", fmt(r, 3)], ["Oscillation", `${th}° per sample = ${fmt(th / 360, 3)} f_s`], ["Verdict", r < 0.995 ? "inside the circle: stable" : r > 1.005 ? "outside: unstable" : "on the circle: oscillator"]]);
          }
          host.append(zf, tf, slider({ id: id + "-r", label: "Radius r", min: 0.5, max: 1.05, step: 0.01, value: r }, (v) => { r = v; draw(); }).el,
            slider({ id: id + "-t", label: "Angle θ", min: 0, max: 180, step: 1, value: th, show: (v) => v + "°" }, (v) => { th = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Radius 0.9: each sample keeps 90% of the last swing. Angle 30°: 12 samples per oscillation (f<sub>s</sub>/12). Push r past 1 and it grows. Angle 180° puts the poles at −r: alternating signs, the fastest wiggle possible.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "An analog pole at s = −1000 s⁻¹, sampled with T = 1 ms. Where is the z-plane pole?", a: 0.3679, tol: 0.01, why: "e^(−1000 × 0.001) = e^(−1) = 0.368." },
        { t: "num", q: "A pole pair at r = 0.95, θ = 45°, f_s = 8 kHz. Ringing frequency (kHz)?", a: 1, unit: "kHz", why: "45°/360° = 1/8 of f_s = 1 kHz." },
        { t: "mcq", q: "H(z) = 1/(1 − 1.2z⁻¹ + 0.5z⁻²). Stable?", opts: [["Yes: poles at 0.6 ± j0.37, radius √0.5 ≈ 0.71", true, "z² − 1.2z + 0.5 = 0. The product of the poles = 0.5 = r², so r = 0.707 < 1."], ["No: 1.2 > 1", false, "Coefficients aren't pole radii; solve for the poles."], ["Can't tell without simulation", false, "Pole radius decides it."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What do a z-plane pole's radius and angle tell you?", model: "The radius is how much the response shrinks each sample: below one it decays, above one it grows, so stability means every pole is inside the unit circle. The angle is how far it turns each sample, which sets the oscillation frequency as that fraction of a full turn times the sample rate." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Frequency response: walk the unit circle", mins: 25,
    blurb: "Put z = e^(j2πf/f_s): a point walking round the unit circle. Distances to zeros and poles give the gain, as in the s-plane.",
    takeaway: "Frequency response: H(e^(j2πf/f_s)), i.e. evaluate H on the unit circle. f = 0 at z = 1, f = f_s/2 at z = −1; the response repeats every f_s. |H| = K·Π(distances to zeros)/Π(distances to poles). Zeros on the circle make perfect notches; poles near the circle make peaks. N-point moving average: zeros at e^(j2πk/N), k = 1…N−1, so it notches f_s/N, 2f_s/N, …: a cheap way to kill a known interferer (e.g. 50 Hz) exactly.",
    steps: [
      { k: "learn", title: "Same geometry as Module 23", b: [
        `<p>In the s-plane, the frequency response lived on the jω axis. In the z-plane it lives on the <b>unit circle</b>: z = e<sup>jωT</sup>. Going once round the circle = sweeping 0 to f<sub>s</sub>.</p>`,
        `<div class="eq">|H| = K × Π(zero distances) / Π(pole distances)</div>`,
      ]},
      { k: "play", title: "Three filters", b: [
        (host, id) => {
          const zf = el(`<div class="fig"></div>`), mf = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let kind = 0, fr = 0.1, N = 4, a = 0.8;
          function filt() {
            if (kind === 0) { const z = []; for (let k = 1; k < N; k++) z.push([Math.cos((TAU * k) / N), Math.sin((TAU * k) / N)]); return { poles: [], zeros: z, H: (f) => { if (Math.abs(f) < 1e-9) return 1; return Math.abs(Math.sin(Math.PI * f * N) / (N * Math.sin(Math.PI * f))); } }; }
            if (kind === 1) return { poles: [[a, 0]], zeros: [], H: (f) => (1 - a) / Math.hypot(Math.cos(TAU * f) - a, Math.sin(TAU * f)) };
            const r = 0.95, t = TAU * 0.15, p1 = [r * Math.cos(t), r * Math.sin(t)], p2 = [p1[0], -p1[1]];
            const d = (p, f) => Math.hypot(Math.cos(TAU * f) - p[0], Math.sin(TAU * f) - p[1]), g = d(p1, 0.15) * d(p2, 0.15) / (2 * Math.abs(Math.sin(TAU * 0.15)));
            return { poles: [p1, p2], zeros: [[1, 0], [-1, 0]], H: (f) => (g * d([1, 0], f) * d([-1, 0], f)) / (d(p1, f) * d(p2, f)) };
          }
          function draw() {
            const F = filt();
            zf.innerHTML = zplane(F.poles, F.zeros, { at: [Math.cos(TAU * fr), Math.sin(TAU * fr)] });
            mf.innerHTML = plot({ x: [0, 0.5], y: [0, 1.2], xt: [0, 0.1, 0.2, 0.3, 0.4, 0.5], yt: [0, 0.5, 1], xl: "f / f_s", yl: "|H|", h: 200, series: [{ f: F.H, cls: "s1", n: 500 }], marks: [{ x: fr, y: Math.min(1.2, F.H(fr)) }], label: "Magnitude response from 0 to half the sample rate" });
            ro.innerHTML = readout([["f / f_s", fmt(fr, 3)], ["|H|", fmt(F.H(fr), 3)]]);
          }
          const ctl = el(`<div></div>`);
          function controls() {
            ctl.replaceChildren(kind === 0 ? slider({ id: id + "-n", label: "Moving-average length N", min: 2, max: 10, step: 1, value: N }, (v) => { N = v; draw(); }).el : kind === 1 ? slider({ id: id + "-a", label: "Pole position a", min: 0, max: 0.98, step: 0.01, value: a }, (v) => { a = v; draw(); }).el : el(`<p class="aside">Resonator: poles at 0.95·e^(±j0.3π), zeros at ±1.</p>`));
          }
          host.append(toggle(["Moving average (FIR)", "First-order low-pass (IIR)", "Resonator (band-pass)"], (i) => { kind = i; controls(); draw(); }, 0), zf, mf,
            slider({ id: id + "-f", label: "Frequency (the green point)", min: 0, max: 0.5, step: 0.005, value: fr, show: (v) => fmt(v, 3) + " f_s" }, (v) => { fr = v; draw(); }).el, ctl, ro);
          controls(); draw();
        },
        `<p class="aside">Moving average: zeros sit on the circle, so as the green point passes one the gain drops to exactly zero. Low-pass: one pole near z = 1 boosts low frequencies. Resonator: poles close to the circle make a sharp peak at 0.15f<sub>s</sub>; the zeros at ±1 kill DC and f<sub>s</sub>/2.</p>`,
      ]},
      { k: "why", title: "A design trick: notch a known frequency", b: [
        `<p>An N-sample moving average puts zeros at f<sub>s</sub>/N and its multiples. Want to remove 50 Hz mains hum from a sensor sampled at 1 kHz? Average N = 20 samples: zeros at 50, 100, 150 Hz…, exactly.</p>`,
        `<div class="key"><b>Chip use.</b> Integrating ADCs and sinc decimation filters in sigma-delta converters use exactly this: averaging over a whole number of interferer periods.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "4-point moving average at f_s = 1 kHz. Lowest frequency it nulls completely (Hz)?", a: 250, unit: "Hz", why: "f_s/N = 250 Hz (and 500 Hz)." },
        { t: "num", q: "First-order low-pass H = (1 − a)/(1 − az⁻¹) with a = 0.8. Gain at f_s/2 (z = −1)?", a: 0.1111, tol: 0.01, why: "(1 − 0.8)/(1 + 0.8) = 0.2/1.8 = 0.111." },
        { t: "mcq", q: "Why does a discrete-time filter's response repeat every f_s?", opts: [["Because z = e^(j2πf/f_s) goes once round the unit circle as f goes from 0 to f_s", true, "f and f + f_s land on the same point: aliasing again."], ["Because of the anti-alias filter", false, "It's a property of sampled systems themselves."], ["It doesn't", false, "It always does."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How can you see a digital filter's frequency response from its pole-zero plot?", model: "Walk a point around the unit circle from z equals one, which is DC, to z equals minus one, half the sample rate. At each point the gain is the product of distances to the zeros divided by the product of distances to the poles. Passing a zero on the circle gives a null; passing close to a pole gives a peak." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "Discrete time on a chip: switched capacitors and ΣΔ", mins: 30,
    blurb: "Capacitors and switches make resistors, integrators and whole filters set by capacitor ratios. Feedback around a 1-bit quantizer makes a high-resolution ADC.",
    takeaway: "A capacitor C switched between two nodes at rate f_s moves charge C·ΔV per cycle: on average a resistor R = 1/(f_s·C). A switched-capacitor integrator obeys v_out[n] = v_out[n−1] − (C₁/C₂)·v_in[n−1], so H(z) = −(C₁/C₂)z⁻¹/(1 − z⁻¹): an accumulator whose gain is a capacitor ratio (accurate to ~0.1%) and whose time constant scales with the clock. A first-order sigma-delta modulator (integrator + 1-bit quantizer + feedback) gives Y = X + (1 − z⁻¹)E: the signal passes, the quantization error is pushed to high frequencies (|1 − z⁻¹| = 2 sin(πf/f_s)), and a digital filter then removes it.",
    steps: [
      { k: "learn", title: "A resistor made of a capacitor", b: [
        fig(S.svg(460, 130, S.t(30, 55, "V₁", { cls: "lab" }) + S.wire([50, 50], [120, 50]) + `<line class="w" x1="120" y1="50" x2="160" y2="50"/><line class="w" x1="190" y1="50" x2="240" y2="50"/><line class="w" x1="160" y1="50" x2="186" y2="38"/>` + S.cap(240, 50, 240, 115, "C", {}) + S.dot(240, 50) + `<line class="w" x1="240" y1="50" x2="290" y2="50"/><line class="w" x1="320" y1="50" x2="380" y2="50"/><line class="w" x1="290" y1="50" x2="316" y2="38"/>` + S.t(400, 55, "V₂", { a: "start", cls: "lab" }) + S.t(175, 28, "φ₁", { cls: "lab" }) + S.t(305, 28, "φ₂", { cls: "lab" }) + S.gnd(240, 115), { label: "Switched capacitor: switch phi1 connects C to V1, switch phi2 connects it to V2, alternately" })),
        `<p>Phase 1: C charges to V₁. Phase 2: it connects to V₂ and settles there. Each cycle moves charge q = C(V₁ − V₂) from left to right. Do it f<sub>s</sub> times a second:</p>`,
        `<div class="eq">I = f_s·C·(V₁ − V₂)   ⟹   R_eq = 1/(f_s·C)</div>`,
        `<p class="aside">1 pF at 1 MHz behaves like 1 MΩ, in a sliver of silicon area where a real 1 MΩ resistor would be enormous.</p>`,
      ]},
      { k: "why", title: "The ratio trick, in hardware", b: [
        `<p>A switched-capacitor integrator (op amp with C₂ in feedback, C₁ switched at the input) has</p>`,
        `<div class="eq">H(z) = −(C₁/C₂)·z⁻¹/(1 − z⁻¹)</div>`,
        `<p>Its gain depends on C₁/C₂, a ratio of matched capacitors (good to ~0.1%), and its time constant on the clock (crystal-accurate). Module 27 showed an on-chip RC drifts ±30%. Switched-capacitor filters solved that, and they're why accurate analog filters could move onto chips.</p>`,
      ]},
      { k: "play", title: "A first-order sigma-delta modulator", b: [
        (host, id) => {
          const bf = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let x = 0.3;
          function draw() {
            let u = 0, yprev = 0; const ys = [], avg = []; let sum = 0;
            for (let n = 0; n < 64; n++) { u = u + x - yprev; const y = u >= 0 ? 1 : -1; ys.push(y); sum += y; avg.push(sum / (n + 1)); yprev = y; }
            bf.innerHTML = plot({ x: [-1, 64], y: [-1.3, 1.3], xt: [0, 16, 32, 48, 64], yt: [-1, 0, 1], xl: "sample n", h: 210, series: [{ pts: stems(ys), cls: "s5" }, { pts: avg.map((v, n) => [n, v]), cls: "s1" }, { f: () => x, cls: "s4" }], marks: ys.map((v, n) => ({ x: n, y: v, r: 2.5, cls: "mk2" })), label: "Output bits (plus or minus 1), their running average (orange) and the input level (red dashed)" });
            const ones = ys.filter((v) => v > 0).length;
            ro.innerHTML = readout([["Input", fmt(x, 3)], ["Fraction of +1s in 64 bits", `${ones}/64 → average ${fmt((2 * ones) / 64 - 1, 3)}`], ["Error after 64 samples", fmt(avg[63] - x, 3)]]);
          }
          host.append(bf, slider({ id: id + "-x", label: "DC input level", min: -0.9, max: 0.9, step: 0.01, value: x }, (v) => { x = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">A 1-bit quantizer can only say +1 or −1. The integrator keeps track of the error so far and the feedback corrects it, so the <i>density</i> of +1s tracks the input. Average more samples and the estimate sharpens: oversampling plus feedback turns 1 bit into many.</p>`,
      ]},
      { k: "math", title: "Why the noise moves", b: [
        steps([["Integrator: U = (X − z⁻¹Y)/(1 − z⁻¹)", ""], ["Quantizer: Y = U + E (E = rounding error)", ""], ["Substitute and solve for Y", "Y = X + (1 − z⁻¹)E"], ["Noise transfer |1 − z⁻¹| on the unit circle", "2|sin(πf/f_s)|: ≈ 0 near DC, 2 at f_s/2"]]),
        `<div class="key"><b>Noise shaping.</b> The error isn't removed; it's pushed up to high frequencies, where a digital low-pass filter then throws it away. Audio and sensor ADCs with 16–24 bits use this idea with higher-order loops.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 0.5 pF capacitor switched at 2 MHz. Equivalent resistance (MΩ)?", a: 1, unit: "MΩ", why: "1/(2×10⁶ × 0.5×10⁻¹²) = 10⁶ Ω." },
        { t: "num", q: "First-order ΣΔ noise transfer at f = f_s/64: |NTF| = 2 sin(π/64). In dB?", a: -20.2, tol: 0.02, why: "2 × 0.0491 = 0.098 → −20.2 dB: the noise in the band is about 10× smaller than without shaping." },
        { t: "mcq", q: "Why are switched-capacitor filter corners accurate on a chip?", opts: [["They depend on capacitor ratios and the clock frequency, both accurate", true, "Absolute R and C drift ±20–30%; ratios and crystals don't."], ["Because capacitors are more accurate than resistors in absolute value", false, "Absolute on-chip capacitance also varies by ±10–20%."], ["Because the op amp is ideal", false, "The op amp needs enough gain and speed, but the corner comes from ratios."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a switched capacitor act like a resistor?", model: "Each clock cycle it charges to one node's voltage and then dumps that charge into the other node, moving C times the voltage difference per cycle. Doing that f_s times a second is an average current of f_s C times the voltage difference, just like a resistor of value one over f_s C." },
      ]},
    ],
  };

  const p6 = {
    id: "p6", title: "Master it", mins: 30,
    blurb: "Difference equations, z-plane, filters and switched-capacitor circuits.",
    takeaway: "You can turn difference equations into H(z), place and read poles and zeros, judge stability, sketch frequency responses, and analyse switched-capacitor and sigma-delta building blocks.",
    steps: [
      { k: "check", title: "Problem 1", b: [
        { t: "num", q: "A digital smoother must mimic an analog RC with τ = 1 ms, sampled at 10 kHz. Choose a = e^(−T/τ). Value of a?", a: 0.9048, tol: 0.005, why: "e^(−0.1/1) = 0.905. (Pole mapping z = e^(sT) with s = −1/τ.)" },
      ]},
      { k: "check", title: "Problem 2", b: [
        { t: "num", q: "H(z) = (1 + z⁻¹)/2. Gain at f = f_s/4 (z = j)?", a: 0.7071, tol: 0.01, hint: "|1 + z⁻¹| with z⁻¹ = −j.", why: "|1 − j|/2 = √2/2 = 0.707: a 2-point average is −3 dB at f_s/4." },
      ]},
      { k: "check", title: "Problem 3", b: [
        { t: "mcq", q: "Poles at z = 0.5 and z = −1.1. Stable?", opts: [["No: |−1.1| > 1", true, "One pole outside the circle is enough: a growing alternating response."], ["Yes: their average is inside", false, "Each pole must be inside."], ["Yes: one is inside", false, "All of them must be."]] },
      ]},
      { k: "check", title: "Problem 4", b: [
        { t: "num", q: "A switched-capacitor integrator with C₁ = 0.2 pF, C₂ = 4 pF. Output change per cycle for a 1 V input (magnitude, V)?", a: 0.05, why: "C₁/C₂ × 1 V = 0.05 V per clock cycle." },
      ]},
      { k: "check", title: "Problem 5", b: [
        { t: "num", q: "A sensor sampled at 600 Hz picks up 60 Hz hum. Moving-average length that notches 60 Hz and all its harmonics below f_s/2?", a: 10, tol: 0, why: "Zeros at f_s/N = 60 Hz → N = 10; multiples 120, 180, … also nulled." },
      ]},
      { k: "say", title: "Problem 6: explain it", b: [
        { t: "say", q: "Explain how a first-order sigma-delta modulator can produce a high-resolution result from a 1-bit quantizer.", model: "It samples much faster than needed, and an integrator in a feedback loop accumulates the difference between the input and the 1-bit output, so the output toggles in a pattern whose average follows the input. In frequency terms the quantization error is multiplied by one minus z inverse, which is small at low frequencies and large near half the sample rate. A digital low-pass filter then removes the high-frequency noise and averages many bits into one accurate, multi-bit result." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m33", eyebrow: "Math Toolkit · Module 33", title: "Discrete-Time Systems and the z-Transform",
    intro: `<p>Six parts: difference equations, z⁻¹ and the z-transform, poles and the unit circle, frequency response on the circle, switched capacitors and sigma-delta, and mastery problems.</p><p>Why a chip designer needs this: digital filters, switched-capacitor circuits, ADCs, PLLs and calibration loops all live in sampled time.</p><p class="aside">Before this: Modules 23 (s-domain), 26 Part 3 (step-by-step stability) and 32 (sampling).</p>`,
    after: `<p>Next: Module 34 starts the probability track. Every chip is a random sample from its process, and noise is a random signal.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <p><b>Difference equations:</b> accumulator y[n] = y[n−1] + x[n]; smoother y = a y[n−1] + (1 − a)x, τ ≈ 1/(1 − a) samples; moving average. FIR (inputs only) always stable; IIR can ring or grow.</p>
      <div class="eq">X(z) = Σ x[n]z⁻ⁿ   delay ↔ z⁻¹   aⁿu[n] ↔ 1/(1 − az⁻¹)</div>
      <p>y = a y[n−1] + b x → H = b/(1 − az⁻¹): pole at a.</p>
      <p><b>z = e^(sT):</b> left half-plane ↔ inside unit circle; jω axis ↔ circle; DC ↔ z = 1; f_s/2 ↔ z = −1. Pole r e^(±jθ): decay r per sample, oscillation θ/2π × f_s. Stable ⟺ all |p| &lt; 1.</p>
      <p><b>Frequency response</b> on the unit circle; repeats every f_s. |H| = K·Π zero distances/Π pole distances. N-point average: zeros at k f_s/N.</p>
      <p><b>Switched C:</b> R = 1/(f_sC). SC integrator −(C₁/C₂)z⁻¹/(1 − z⁻¹): ratio-accurate. <b>ΣΔ (1st order):</b> Y = X + (1 − z⁻¹)E; |NTF| = 2 sin(πf/f_s).</p>`,
  };
  Course.start(window.CHAPTER);
})();
