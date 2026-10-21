(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;
  const tbl = (head, rows) => `<div class="tbl"><table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`;
  const sinc = (u) => (Math.abs(u) < 1e-9 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u));

  const p1 = {
    id: "p1", title: "From series to transform", mins: 25,
    blurb: "Stretch the period of a pulse train towards infinity. The harmonic lines crowd together into a smooth curve: the Fourier transform.",
    takeaway: "A periodic signal has lines at multiples of f₀ = 1/T. Keep the pulse the same but make T longer: the lines get closer (spacing 1/T) and smaller, but T·cₙ traces the same smooth envelope. In the limit T → ∞ (a single pulse) the spectrum is continuous: X(f) = ∫x(t)e^(−j2πft)dt, and x(t) = ∫X(f)e^(j2πft)df. X(f) is a density: amplitude per hertz. Every signal, periodic or not, has a spectrum.",
    steps: [
      { k: "play", title: "Stretch the period", b: [
        (host, id) => {
          const tf = el(`<div class="fig"></div>`), sp = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let T = 2;
          const w = 1;
          function draw() {
            tf.innerHTML = plot({ x: [-6, 6], y: [-0.2, 1.3], xt: [-6, -3, 0, 3, 6], yt: [0, 1], xl: "t (pulse width = 1)", h: 150, series: [{ f: (t) => { const u = ((t % T) + T) % T; return u < w / 2 || u > T - w / 2 ? 1 : 0; }, cls: "s1", n: 1200 }], label: "Pulse train in time" });
            const pts = [], marks = [];
            for (let n = -Math.floor(4 * T); n <= Math.floor(4 * T); n++) { const f = n / T, v = w * sinc(f * w); pts.push([f - 0.004, 0], [f, v], [f + 0.004, 0]); if (Math.abs(n) <= 40) marks.push({ x: f, y: v, r: 3, cls: "mk2" }); }
            sp.innerHTML = plot({ x: [-4, 4], y: [-0.3, 1.1], xt: [-4, -2, -1, 0, 1, 2, 4], yt: [0, 0.5, 1], xl: "frequency (× 1/width)", yl: "T·cₙ", h: 200, series: [{ f: (f) => w * sinc(f * w), cls: "s5", n: 600 }, { pts, cls: "s2" }], marks, label: "Line spectrum scaled by T (blue) and the smooth envelope (grey dashed)" });
            ro.innerHTML = readout([["Period T", fmt(T, 3) + " × width"], ["Line spacing 1/T", fmt(1 / T, 3)], ["Lines between the first two nulls", Math.round(2 * T) - 1]]);
          }
          host.append(tf, sp, slider({ id: id + "-t", label: "Period T", min: 1.25, max: 12, step: 0.25, value: T }, (v) => { T = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The pulse never changes; only the gap between pulses grows. The lines (multiplied by T, so they stay visible) always sit on the same grey envelope, just packed more densely. Let T → ∞ and they fill it in completely.</p>`,
      ]},
      { k: "learn", title: "The definition", b: [
        `<div class="eq">X(f) = ∫ x(t) e<sup>−j2πft</sup> dt     x(t) = ∫ X(f) e<sup>j2πft</sup> df</div>`,
        `<p>Same move as Module 30: multiply by a test sinusoid e<sup>−j2πft</sup> and add up (integrate) to see how much of frequency f is in the signal. Only now f can be any frequency, not just multiples of f₀.</p>`,
        `<ul><li>Units: if x is in volts, X(f) is in V/Hz (volts per hertz): a <b>density</b>.</li><li>Integrals run over all time, −∞ to ∞.</li><li>Some books use ω: X(ω) = ∫x e<sup>−jωt</sup>dt with a 1/2π in the inverse. Same idea.</li></ul>`,
      ]},
      { k: "why", title: "Why a density?", b: [
        `<p>A single pulse has finite energy spread over a continuum of frequencies. At any one exact frequency there's “zero” of it, the same way a 1 m rod has zero mass at one exact point. What makes sense is mass per metre, or here volts per hertz. Integrate X(f) over a band to get something finite.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A pulse train with period 1 µs has lines every 1 MHz. Double the period. Now the lines are…", opts: [["Every 500 kHz, under the same envelope shape", true, "Spacing 1/T. The pulse shape sets the envelope."], ["Every 2 MHz", false, "Longer period → closer lines."], ["Unchanged", false, "Line spacing is 1/T."]] },
        { t: "mcq", q: "Which signal has a continuous spectrum (not lines)?", opts: [["A single 1 ns pulse", true, "Not periodic: its energy is spread continuously."], ["A 100 MHz clock", false, "Periodic: lines at 100, 200, 300 MHz…"], ["A pure 1 kHz sine", false, "A single line at 1 kHz (and −1 kHz)."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the Fourier transform grow out of the Fourier series?", model: "If you make the period of a periodic signal longer and longer while keeping the pulse the same, the harmonic lines get closer together. In the limit of an infinitely long period, a single pulse, they merge into a continuous curve, the Fourier transform, which gives the amount of signal per hertz at every frequency." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Short in time, wide in frequency", mins: 25,
    blurb: "A rectangular pulse transforms into a sinc. Squeeze the pulse and its spectrum spreads. Rise time and bandwidth are the same trade-off.",
    takeaway: "A pulse of height A and width τ has X(f) = Aτ·sinc(fτ), with sinc(u) = sin(πu)/(πu): the main lobe reaches its first nulls at f = ±1/τ. Halve the width and the spectrum doubles in width: duration × bandwidth ≈ constant. Engineering rule: 10–90% rise time t_r ≈ 0.35/f_3dB for a first-order system (an oscilloscope, a gate, a wire). A 10 Gb/s data stream (bits 100 ps long) needs bandwidth of several GHz.",
    steps: [
      { k: "math", title: "The pulse's transform", b: [
        `<p>Pulse: height A from −τ/2 to τ/2. Since it's even, only the cosine part survives:</p>`,
        steps([["X(f) = ∫ A e^(−j2πft) dt over −τ/2..τ/2", ""], ["= A[e^(−jπfτ) − e^(jπfτ)]/(−j2πf)", ""], ["= A·sin(πfτ)/(πf)", "using e^(jθ) − e^(−jθ) = 2j sin θ"], ["= Aτ·sinc(fτ)", "sinc(u) = sin(πu)/(πu)"]]),
        `<p class="aside">X(0) = Aτ: the area of the pulse. True in general: X(0) = ∫x dt.</p>`,
      ]},
      { k: "play", title: "Squeeze the pulse", b: [
        (host, id) => {
          const tf = el(`<div class="fig"></div>`), sp = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let tau = 1;
          function draw() {
            tf.innerHTML = plot({ x: [-2, 2], y: [-0.2, 1.3], xt: [-2, -1, 0, 1, 2], yt: [0, 1], xl: "t (ns)", h: 140, series: [{ f: (t) => (Math.abs(t) < tau / 2 ? 1 : 0), cls: "s1", n: 800 }], label: "Pulse in time" });
            sp.innerHTML = plot({ x: [-5, 5], y: [-0.3, 2.1], xt: [-5, -2.5, 0, 2.5, 5], yt: [0, 1, 2], xl: "f (GHz)", yl: "X(f) (V/GHz)", h: 200, series: [{ f: (f) => tau * sinc(f * tau), cls: "s2", n: 800 }], marks: [{ x: 1 / tau, y: 0, cls: "mkb", r: 5 }, { x: -1 / tau, y: 0, cls: "mkb", r: 5 }], label: "Its spectrum: a sinc with first nulls marked" });
            ro.innerHTML = readout([["Width τ", fmt(tau, 3) + " ns"], ["First null 1/τ", fmt(1 / tau, 3) + " GHz"], ["Width × first null", "1 (always)"]]);
          }
          host.append(tf, sp, slider({ id: id + "-t", label: "Pulse width τ", min: 0.25, max: 2, step: 0.05, value: tau, show: (v) => fmt(v, 3) + " ns" }, (v) => { tau = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Narrow pulse → low, wide spectrum. Wide pulse → tall, narrow spectrum. The product of width and spectral width never changes. This is the same uncertainty trade-off that shows up in quantum mechanics.</p>`,
      ]},
      { k: "learn", title: "The rule you'll use weekly", b: [
        `<div class="eq">t_r ≈ 0.35 / f_3dB</div>`,
        `<p>For a first-order system: 10–90% rise time t<sub>r</sub> = 2.2RC and f<sub>3dB</sub> = 1/(2πRC), so t<sub>r</sub>·f<sub>3dB</sub> = 2.2/2π ≈ 0.35.</p>`,
        tbl(["System", "Bandwidth", "Rise time"], [["Oscilloscope", "100 MHz", "3.5 ns"], ["Oscilloscope", "1 GHz", "350 ps"], ["On-chip gate output", "≈ 10 GHz", "≈ 35 ps"]]),
        `<div class="key"><b>Measuring edges.</b> Rise times add roughly as √(t₁² + t₂²). To measure a 1 ns edge to within 5%, the scope's own rise time should be about 3× faster (≈ 0.3 ns, so about 1 GHz of bandwidth).</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 200 ps pulse. Frequency of its first spectral null (GHz)?", a: 5, unit: "GHz", why: "1/τ = 1/(200 ps) = 5 GHz." },
        { t: "num", q: "An amplifier has f_3dB = 50 MHz (first-order). Its 10–90% rise time (ns)?", a: 7, unit: "ns", why: "0.35/50 MHz = 7 ns." },
        { t: "num", q: "A pulse 2 V high and 5 ns wide. X(0) in V·ns?", a: 10, why: "The area: 2 × 5 = 10 V·ns." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do fast edges need high bandwidth?", model: "A short or sharp feature in time is built from a wide range of frequencies: halving a pulse's width doubles the width of its spectrum. A system that cuts off high frequencies can't reproduce those components, so it smooths the edge. For a first-order system the rise time is about 0.35 divided by the bandwidth." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Pairs and properties", mins: 25,
    blurb: "A handful of transform pairs, plus rules for shifting, scaling and modulating. Mixing two signals moves a spectrum: that's every radio.",
    takeaway: "Pairs: δ(t) ↔ 1 (an impulse contains every frequency equally); 1 ↔ δ(f); cos 2πf₀t ↔ ½[δ(f − f₀) + δ(f + f₀)]; e^(−at)u(t) ↔ 1/(a + j2πf); rect ↔ sinc; Gaussian ↔ Gaussian. Properties: linear; delay t₀ multiplies by e^(−j2πft₀) (same magnitude, phase falling linearly with f); compressing time by k stretches frequency by k; differentiating multiplies by j2πf; multiplying by cos 2πf_ct shifts the spectrum to ±f_c, each copy half height (modulation, the mixer).",
    steps: [
      { k: "learn", title: "Pairs worth knowing", b: [
        tbl(["x(t)", "X(f)", "Read it as"], [["δ(t) (impulse)", "1", "all frequencies, equally"], ["1 (constant, DC)", "δ(f)", "only f = 0"], ["cos 2πf₀t", "½δ(f − f₀) + ½δ(f + f₀)", "two lines"], ["rect, width τ", "τ sinc(fτ)", "Part 2"], ["e^(−at) for t ≥ 0", "1/(a + j2πf)", "the RC response: a first-order low-pass"], ["Gaussian e^(−πt²)", "e^(−πf²)", "its own transform"]]),
        `<p class="aside">The e<sup>−at</sup> row is the Laplace pair 1/(s + a) with s = j2πf. For stable signals the Fourier transform is the Laplace transform on the jω axis (Part 5).</p>`,
      ]},
      { k: "learn", title: "Properties", b: [
        tbl(["In time", "In frequency"], [["a·x + b·y", "a·X + b·Y"], ["x(t − t₀) (delay)", "X(f)·e^(−j2πft₀): phase −2πft₀"], ["x(kt) (speed up by k)", "(1/|k|)X(f/k): spectrum k times wider"], ["dx/dt", "j2πf·X(f)"], ["x(t)·cos 2πf_ct", "½X(f − f_c) + ½X(f + f_c)"]]),
        `<div class="key"><b>Delay = linear phase.</b> A pure delay doesn't change any magnitude; it adds phase −360°·f·t₀, a straight line in f. Filters with linear phase delay every frequency equally, so pulses keep their shape. That's why “group delay flatness” is a spec for data links.</div>`,
      ]},
      { k: "play", title: "The mixer: multiply by a carrier", b: [
        (host, id) => {
          const tf = el(`<div class="fig"></div>`), sp = el(`<div class="fig"></div>`);
          let fc = 6;
          const base = (f) => Math.max(0, 1 - Math.abs(f) / 1.5);
          function draw() {
            const msg = (t) => 0.6 * Math.cos(2 * Math.PI * 0.5 * t) + 0.4 * Math.cos(2 * Math.PI * 1.1 * t);
            tf.innerHTML = plot({ x: [0, 4], y: [-1.2, 1.2], xt: [0, 1, 2, 3, 4], yt: [-1, 0, 1], xl: "t", h: 160, series: [{ f: msg, cls: "s5", n: 800 }, { f: (t) => msg(t) * Math.cos(2 * Math.PI * fc * t), cls: "s1", n: 1600 }], label: "Message (grey dashed) and message times carrier (orange)" });
            sp.innerHTML = plot({ x: [-12, 12], y: [0, 1.1], xt: [-12, -6, 0, 6, 12], yt: [0, 0.5, 1], xl: "f", h: 180, areas: [{ f: base, cls: "ar2", from: -1.5, to: 1.5 }, { f: (f) => 0.5 * base(f - fc) + 0.5 * base(f + fc), cls: "ar1", n: 800 }], series: [{ f: (f) => 0.5 * base(f - fc) + 0.5 * base(f + fc), cls: "s1", n: 800 }], label: "Message spectrum around 0 (blue) and the mixed spectrum around plus and minus the carrier (orange)" });
          }
          host.append(tf, sp, slider({ id: id + "-f", label: "Carrier f_c", min: 2, max: 10, step: 0.5, value: fc }, (v) => { fc = v; draw(); }).el);
          draw();
        },
        `<p class="aside">Blue: the message's spectrum around 0. Orange: after multiplying by the carrier, two half-height copies centred on ±f<sub>c</sub>. Multiply again by the same carrier and a copy lands back at 0 (plus one at 2f<sub>c</sub> to filter away): that's demodulation. Every radio chip, and every chopper amplifier, is built on this property.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 1 ns delay at 100 MHz adds how much phase (degrees, give a negative number)?", a: -36, unit: "°", why: "−360° × 100 MHz × 1 ns = −36°." },
        { t: "mcq", q: "A 10 kHz-wide audio signal is multiplied by a 1 MHz carrier. Its spectrum now occupies…", opts: [["990 kHz to 1010 kHz (and the mirror at −1 MHz)", true, "Shifted to ±f_c, keeping its width on both sides."], ["0 to 1 MHz", false, "Multiplying shifts the spectrum; it doesn't stretch it."], ["Only 1 MHz", false, "The message's spread comes along."]] },
        { t: "mcq", q: "A chip clock edge is sped up 2×. Its spectrum…", opts: [["Extends to about twice the frequency, at half the density", true, "Compress time by k → stretch frequency by k (and scale by 1/k)."], ["Stays the same", false, "Faster features mean higher frequencies."], ["Halves in width", false, "Opposite way round."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does multiplying a signal by a cosine do to its spectrum, and where is that used?", model: "It makes two copies of the signal's spectrum, each half as tall, centred at plus and minus the cosine's frequency. That's modulation: radios use it to move a signal up to a carrier frequency and back down, and chopper amplifiers use it to move a small DC signal away from low-frequency noise." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Convolution: what filters do in time", mins: 30,
    blurb: "Every slice of the input launches its own copy of the impulse response. Add them up. In frequency that's just a multiplication.",
    takeaway: "A linear time-invariant system is fully described by its impulse response h(t). Any input is a string of tiny impulses x(τ)dτ; each launches a scaled, delayed copy of h. Adding them: y(t) = ∫x(τ)h(t − τ)dτ = (x * h)(t), the convolution. Picture: flip h, slide it to t, multiply by x, take the area. In frequency, convolution becomes multiplication: Y(f) = H(f)·X(f). That's why filters are designed and described in frequency: one multiplication instead of an integral.",
    steps: [
      { k: "learn", title: "The idea, in one picture", b: [
        `<p>Chop the input into thin slices. Each slice is a tiny impulse of strength x(τ)dτ at time τ. The system answers each one with h, scaled and delayed: x(τ)·h(t − τ)dτ. Linearity lets you add the answers:</p>`,
        `<div class="eq">y(t) = ∫ x(τ) h(t − τ) dτ</div>`,
        `<p class="aside">Read h(t − τ) as “how much of what happened at time τ is still being felt at time t”. For an RC, recent inputs count most and old ones fade exponentially: memory.</p>`,
      ]},
      { k: "play", title: "Flip, slide, multiply, add", b: [
        (host, id) => {
          const a = el(`<div class="fig"></div>`), b = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let t = 0.6, tau = 0.4;
          const x = (s) => (s >= 0 && s < 1 ? 1 : 0), h = (s) => (s >= 0 ? Math.exp(-s / tau) / tau : 0);
          const y = (tt) => (tt < 0 ? 0 : tt < 1 ? 1 - Math.exp(-tt / tau) : (1 - Math.exp(-1 / tau)) * Math.exp(-(tt - 1) / tau));
          function draw() {
            a.innerHTML = plot({ x: [-1, 4], y: [0, 2.7], xt: [-1, 0, 1, 2, 3, 4], yt: [0, 1, 2], xl: "τ", h: 190, areas: [{ f: (s) => x(s) * h(t - s), cls: "ar1", n: 800 }], series: [{ f: x, cls: "s2", n: 800 }, { f: (s) => h(t - s), cls: "s4", n: 800 }], label: "Input x (blue), flipped and shifted impulse response (red dashed), overlap product shaded" });
            b.innerHTML = plot({ x: [-1, 4], y: [0, 1.1], xt: [-1, 0, 1, 2, 3, 4], yt: [0, 0.5, 1], xl: "t", yl: "y(t)", h: 170, series: [{ f: y, cls: "s5", n: 600 }, { f: y, cls: "s1", to: t, n: 600 }], marks: [{ x: t, y: y(t) }], label: "Output built up to the current time" });
            ro.innerHTML = readout([["t", fmt(t, 3)], ["Shaded area = y(t)", fmt(y(t), 3)]]);
          }
          host.append(a, b, slider({ id: id + "-t", label: "Slide to time t", min: -0.5, max: 3.5, step: 0.02, value: t }, (v) => { t = v; draw(); }).el,
            slider({ id: id + "-k", label: "RC time constant", min: 0.1, max: 1.5, step: 0.05, value: tau }, (v) => { tau = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Input: a 1-unit pulse (blue). The red curve is h flipped and parked at t; it looks backwards in time from t. The shaded overlap's area is y(t). Slide t and watch the output (orange) build: the RC charging and discharging curve, now explained as overlapping memories.</p>`,
      ]},
      { k: "learn", title: "In frequency: just multiply", b: [
        `<div class="eq">y = x * h   ⟺   Y(f) = X(f)·H(f)</div>`,
        `<p>The integral becomes a product. To filter: transform the input, multiply by the filter's frequency response, transform back (Module 30's square-wave-through-RC was this, line by line).</p>`,
        `<div class="key"><b>Why engineers live in the frequency domain.</b> Cascade three filters: in time, three convolutions; in frequency, H₁·H₂·H₃, which in dB is just adding three curves (Module 16). Same reason Laplace (Module 23) uses Y(s) = H(s)X(s).</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "The input to a system is an impulse δ(t). Its output is…", opts: [["h(t) itself", true, "That's the definition of the impulse response: X(f) = 1, so Y = H."], ["A step", false, "That's the response to a step, not an impulse."], ["Zero", false, "The impulse contains every frequency."]] },
        { t: "mcq", q: "A filter with H(f) = 0 above 1 MHz gets x(t) = cos(2π·0.5 MHz·t) + cos(2π·3 MHz·t). Output?", opts: [["Only the 0.5 MHz cosine (scaled by H there)", true, "Y = H·X: the 3 MHz line is multiplied by 0."], ["Both, smaller", false, "H is zero at 3 MHz."], ["A 3.5 MHz tone", false, "A linear filter never creates new frequencies."]] },
        { t: "mcq", q: "Can a linear time-invariant filter ever create a frequency that wasn't in its input?", opts: [["No: Y(f) = H(f)X(f) is zero wherever X(f) is zero", true, "New frequencies (harmonics, mixing products) are the fingerprint of nonlinearity or time-variation, like a mixer."], ["Yes, at resonance", false, "Resonance amplifies frequencies already present."], ["Yes, harmonics", false, "Harmonics come from nonlinear devices (Module 29)."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain convolution in your own words.", model: "Think of the input as a series of tiny impulses. Each one makes the system produce a copy of its impulse response, scaled by how big that input slice was and delayed to when it happened. The output at any moment is the sum of all those overlapping, fading responses. In the frequency domain that whole sum is just the input spectrum multiplied by the frequency response." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "Bandwidth in practice: energy, Laplace and eyes", mins: 25,
    blurb: "Where a signal's energy lives, how Fourier relates to Laplace, and what too little bandwidth does to a chip's data link.",
    takeaway: "Parseval: energy ∫|x(t)|²dt = ∫|X(f)|²df; |X(f)|² is the energy spectral density. Bandwidth has several definitions (−3 dB, first null, 99% energy); always say which. Fourier is Laplace on the jω axis: X(f) = X(s) at s = j2πf, valid for stable, finite-energy signals; Laplace adds e^(−σt) to handle growth and initial conditions. A data link of bit rate R through a first-order channel with corner f_c: each bit settles a fraction 1 − e^(−2πf_c/R). Too little bandwidth makes each bit leak into the next (inter-symbol interference) and the eye closes; with f_c ≈ R/2 the eye is about 90% open.",
    steps: [
      { k: "learn", title: "Energy in both domains", b: [
        `<div class="eq">∫ |x(t)|² dt = ∫ |X(f)|² df</div>`,
        `<p>|X(f)|² tells you where the energy is. For a pulse, about 90% of the energy sits inside the main sinc lobe, |f| &lt; 1/τ.</p>`,
        tbl(["Bandwidth definition", "Used for"], [["−3 dB point", "amplifiers, filters"], ["First null", "pulses, quick estimates"], ["99% energy", "regulations, spectrum masks"], ["Noise bandwidth", "noise calculations (Module 36)"]]),
      ]},
      { k: "why", title: "Fourier and Laplace: one family", b: [
        `<p>Laplace: X(s) = ∫x(t)e<sup>−st</sup>dt with s = σ + jω. Fourier: the same integral with σ = 0.</p>`,
        `<ul><li>Fourier needs the integral to converge on its own, so it handles signals that settle or have finite energy.</li><li>Laplace's extra e<sup>−σt</sup> tames growing signals and builds in initial conditions (Modules 19–22).</li><li>For a stable circuit, H(j2πf) from Laplace <b>is</b> the frequency response you'd measure.</li></ul>`,
      ]},
      { k: "play", title: "A chip data link: watch the eye close", b: [
        (host, id) => {
          const wf = el(`<div class="fig"></div>`), eye = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const bits = [0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1];
          let r = 0.5;
          function wave() {
            const k = Math.exp(-2 * Math.PI * r), pts = [], M = 40; let v = 0;
            bits.forEach((b, i) => { for (let m = 0; m <= M; m++) { const u = m / M; pts.push([i + u, b + (v - b) * Math.exp(-2 * Math.PI * r * u)]); } v = b + (v - b) * k; });
            return pts;
          }
          function draw() {
            const pts = wave();
            wf.innerHTML = plot({ x: [0, 16], y: [-0.2, 1.2], xt: [0, 4, 8, 12, 16], yt: [0, 0.5, 1], xl: "time (bits)", h: 160, series: [{ pts: bits.slice(0, 16).flatMap((b, i) => [[i, b], [i + 1, b]]), cls: "s5" }, { pts: pts.filter((p) => p[0] <= 16), cls: "s1" }], label: "Transmitted bits (grey dashed) and received waveform (orange)" });
            const segs = [];
            for (let i = 2; i < bits.length - 2; i++) segs.push({ pts: pts.filter((p) => p[0] >= i - 0.5 && p[0] <= i + 1.5).map((p) => [p[0] - i, p[1]]), cls: "s2" });
            eye.innerHTML = plot({ x: [-0.5, 1.5], y: [-0.2, 1.2], xt: [0, 0.5, 1], yt: [0, 0.5, 1], xl: "time within a bit (bit periods)", h: 180, series: segs, label: "Eye diagram: every bit's waveform overlaid" });
            const open = 1 - 2 * Math.exp(-2 * Math.PI * r);
            ro.innerHTML = readout([["Channel corner / bit rate", fmt(r, 3)], ["Each bit settles", fmt(100 * (1 - Math.exp(-2 * Math.PI * r)), 3) + "%"], ["Worst-case eye opening", open > 0 ? fmt(100 * open, 3) + "%" : "closed: bits can't be told apart"]]);
          }
          host.append(wf, eye, slider({ id: id + "-r", label: "Channel bandwidth f_c, as a fraction of the bit rate", min: 0.08, max: 1.2, step: 0.01, value: r, show: (v) => fmt(v, 3) + " × R" }, (v) => { r = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The eye diagram overlays every bit. A wide-open eye means 0s and 1s are easy to tell apart at the sampling instant. Lower the bandwidth: each bit has no time to settle, so its value depends on the bits before it (inter-symbol interference) and the eye squeezes shut, around f<sub>c</sub> ≈ 0.11R for this channel.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 10 Gb/s link through a first-order channel with f_c = 5 GHz. Fraction of each step settled in one bit (%)?", a: 95.7, tol: 0.01, why: "1 − e^(−2π × 0.5) = 1 − e^(−π) = 0.957." },
        { t: "num", q: "Worst-case eye opening for that link (%)?", a: 91.4, tol: 0.01, why: "1 − 2e^(−π) = 1 − 0.086 = 0.914." },
        { t: "mcq", q: "When can you get a signal's Fourier transform from its Laplace transform by putting s = j2πf?", opts: [["When the signal is stable (decays), so the jω axis is inside the region where the Laplace integral converges", true, "For e^(−at): fine. For a growing e^(at): no Fourier transform exists."], ["Always", false, "A growing exponential has a Laplace transform but no Fourier transform."], ["Never", false, "For stable signals it's exactly that."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is inter-symbol interference and how is it related to bandwidth?", model: "When a channel's bandwidth is too low, each bit's waveform hasn't finished changing before the next bit starts, so what you receive during one bit depends partly on the previous bits. That smearing is inter-symbol interference. It narrows the eye diagram, and when the eye closes, zeros and ones can no longer be told apart." },
      ]},
    ],
  };

  const p6 = {
    id: "p6", title: "Master it", mins: 30,
    blurb: "Transforms, trade-offs, convolution and links.",
    takeaway: "You can move between time and frequency, use the main pairs and properties, reason about rise time and bandwidth, explain convolution and filtering, and size bandwidth for a data link.",
    steps: [
      { k: "check", title: "Problem 1", b: [
        { t: "num", q: "A probe + scope system has a 1 ns rise time. You measure a 2 ns edge on screen. Estimate the real edge's rise time (ns).", a: 1.732, tol: 0.02, hint: "Rise times add roughly in quadrature.", why: "√(2² − 1²) = √3 = 1.73 ns." },
      ]},
      { k: "check", title: "Problem 2", b: [
        { t: "mcq", q: "x(t) has a spectrum that is zero above 20 MHz. y(t) = x(t)². y's spectrum is zero above…", opts: [["40 MHz", true, "Squaring multiplies x by itself, which convolves X with itself: widths add."], ["20 MHz", false, "Squaring is nonlinear: it creates new frequencies."], ["400 MHz", false, "Widths add under convolution; they don't multiply."]] },
      ]},
      { k: "check", title: "Problem 3", b: [
        { t: "num", q: "A Gaussian pulse's spectrum is also Gaussian. If the pulse's width is halved, by what factor does the spectral width change?", a: 2, why: "Time–frequency scaling: compress by 2 → spread by 2." },
      ]},
      { k: "check", title: "Problem 4", b: [
        { t: "num", q: "A chip's output driver acts like an RC with f_c = 2 GHz. Highest bit rate (Gb/s) for which each bit still settles to 99%?", a: 2.73, tol: 0.03, hint: "1 − e^(−2πf_c/R) = 0.99 → 2πf_c/R = ln 100.", why: "R = 2π × 2 GHz/4.605 = 2.73 Gb/s." },
      ]},
      { k: "check", title: "Problem 5", b: [
        { t: "mcq", q: "An amplifier's phase response is −0.36°/MHz × f (a straight line) up to 100 MHz. What does it do to a pulse whose spectrum is inside that range?", opts: [["Delays it by 1 ns without changing its shape", true, "Phase −360°·f·t₀ with t₀ = 1 ns is −0.36°/MHz: a pure delay."], ["Smears it", false, "Linear phase delays every frequency equally."], ["Inverts it", false, "That would be a 180° shift at every frequency."]] },
      ]},
      { k: "say", title: "Problem 6: explain it", b: [
        { t: "say", q: "A colleague says a 5 GHz-bandwidth channel is enough for 10 Gb/s data. Use time–frequency reasoning to judge the claim.", model: "Each bit lasts 100 picoseconds. With a first-order channel at 5 GHz, f_c over the bit rate is one half, so each bit settles about 96 percent and the worst-case eye is about 91 percent open: workable. Below roughly a quarter of the bit rate the eye would start to close badly, so 5 GHz is reasonable, with some margin for the receiver." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m31", eyebrow: "Math Toolkit · Module 31", title: "The Fourier Transform and Spectra",
    intro: `<p>Six parts: from series to transform, the time–bandwidth trade-off, key pairs and properties (including the mixer), convolution and filtering, bandwidth in practice (with a data-link eye diagram), and mastery problems.</p><p>Why a chip designer needs this: rise times, bandwidth, radio mixers and data links are all one idea seen from two sides.</p><p class="aside">Before this: Module 30 (Fourier series). Pairs with Modules 16 and 23 and with 6.002 Chapters 13–14.</p>`,
    after: `<p>Next: Module 32 samples a signal, the moment it enters a chip's digital world, and asks what's lost.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <div class="eq">X(f) = ∫x(t)e^(−j2πft)dt   x(t) = ∫X(f)e^(j2πft)df</div>
      <p>Density (V/Hz). Series lines (spacing 1/T) merge as T → ∞. X(0) = ∫x dt.</p>
      <p>rect (A, τ) ↔ Aτ sinc(fτ), nulls at k/τ. Duration × bandwidth ≈ const. t_r ≈ 0.35/f_3dB; rise times add in quadrature.</p>
      <p>Pairs: δ ↔ 1; 1 ↔ δ(f); cos 2πf₀t ↔ ½δ(f ∓ f₀); e^(−at)u ↔ 1/(a + j2πf); Gaussian ↔ Gaussian.</p>
      <p>Delay ↔ ×e^(−j2πft₀) (linear phase). x(kt) ↔ X(f/k)/|k|. d/dt ↔ ×j2πf. x·cos 2πf_ct ↔ ½X(f ∓ f_c) (mixer).</p>
      <p><b>Convolution:</b> y = ∫x(τ)h(t − τ)dτ ⟺ Y = HX. LTI systems never create new frequencies.</p>
      <p><b>Parseval:</b> ∫|x|²dt = ∫|X|²df. Fourier = Laplace at s = j2πf (stable signals). Data link, 1st-order channel: settle 1 − e^(−2πf_c/R); eye ≈ 1 − 2e^(−2πf_c/R).</p>`,
  };
  Course.start(window.CHAPTER);
})();
