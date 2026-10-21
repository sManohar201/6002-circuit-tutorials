(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;
  const tbl = (head, rows) => `<div class="tbl"><table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`;
  const TAU = 2 * Math.PI;

  /* Waves with period 1 and peak 1. Each: [name, f(t), coefficient list (n, cos coeff a, sin coeff b)] */
  const frac = (t) => t - Math.floor(t);
  const WAVES = {
    square: { name: "Square", f: (t) => (frac(t) < 0.5 ? 1 : -1), b: (n) => (n % 2 ? 4 / (Math.PI * n) : 0), a: () => 0 },
    triangle: { name: "Triangle", f: (t) => { const u = frac(t); return u < 0.5 ? 1 - 4 * u : -3 + 4 * u; }, a: (n) => (n % 2 ? 8 / (Math.PI * Math.PI * n * n) : 0), b: () => 0 },
    saw: { name: "Sawtooth", f: (t) => { const u = frac(t + 0.5) - 0.5; return 2 * u; }, b: (n) => ((n % 2 ? 1 : -1) * 2) / (Math.PI * n), a: () => 0 },
  };
  const partial = (W, N) => (t) => { let s = 0; for (let n = 1; n <= N; n++) s += W.a(n) * Math.cos(TAU * n * t) + W.b(n) * Math.sin(TAU * n * t); return s; };
  /* Bar chart of harmonic amplitudes as a plot series. */
  function bars(amps, o = {}) {
    const pts = [];
    amps.forEach((a, i) => { const n = i + 1, w = 0.3; pts.push([n - w, 0], [n - w, a], [n + w, a], [n + w, 0]); });
    return plot({ x: [0.3, amps.length + 0.7], y: [0, o.ymax || 1.4], xt: amps.map((_, i) => i + 1).filter((n) => amps.length <= 12 || n % 2), xtf: (v) => v + "f₀", yt: o.yt || [0, 0.5, 1], xl: "frequency", yl: o.yl || "", h: o.h || 170, series: [{ pts, cls: o.cls || "s2" }], label: o.label || "Spectrum: amplitude of each harmonic" });
  }

  const p1 = {
    id: "p1", title: "Building waves out of sines", mins: 20,
    blurb: "A square wave is a sum of sine waves. Add them one at a time and watch it form.",
    takeaway: "Any periodic signal with period T can be built from a DC level plus sines and cosines at f₀ = 1/T and its whole-number multiples 2f₀, 3f₀, … (the harmonics). A ±1 square wave = (4/π)[sin ωt + (1/3)sin 3ωt + (1/5)sin 5ωt + …]: odd harmonics only, falling as 1/n. Sharp edges need high harmonics; smooth waves (the triangle, falling as 1/n²) need few. Near a jump, any finite sum overshoots by about 9% (the Gibbs effect).",
    steps: [
      { k: "play", title: "Build a square wave", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), sp = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let key = "square", N = 1;
          function draw() {
            const W = WAVES[key], P = partial(W, N);
            const comps = [];
            for (let n = 1; n <= Math.min(N, 5); n++) if (W.a(n) || W.b(n)) comps.push({ f: (t) => W.a(n) * Math.cos(TAU * n * t) + W.b(n) * Math.sin(TAU * n * t), cls: "s5", n: 300 });
            f.innerHTML = plot({ x: [0, 2], y: [-1.5, 1.5], xt: [0, 0.5, 1, 1.5, 2], xtf: (v) => v + "T", yt: [-1, 0, 1], xl: "time", h: 220, series: [{ f: W.f, cls: "s2", n: 800 }].concat(comps, [{ f: P, cls: "s1", n: 800 }]), label: "Target wave (blue), individual harmonics (grey dashed), and their running sum (orange)" });
            const amps = []; for (let n = 1; n <= 15; n++) amps.push(n <= N ? Math.hypot(W.a(n), W.b(n)) : 0);
            sp.innerHTML = bars(amps, { ymax: 1.4, label: "Amplitudes of the harmonics included so far" });
            ro.innerHTML = readout([["Harmonics included", "1 to " + N], ["Biggest overshoot of the sum", fmt(Math.max(...Array.from({ length: 400 }, (_, i) => P(i / 800))), 3)]]);
          }
          host.append(toggle(Object.values(WAVES).map((w) => w.name), (i) => { key = Object.keys(WAVES)[i]; draw(); }, 0), f, sp,
            slider({ id: id + "-n", label: "Add harmonics up to N", min: 1, max: 15, step: 1, value: N }, (v) => { N = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Square: N = 1 is a plain sine (amplitude 4/π ≈ 1.27, bigger than the square!). Each odd harmonic squares the shoulders a bit more. The overshoot near each jump never drops below about 1.09 however many you add: the Gibbs effect. Try the triangle: three terms already look perfect.</p>`,
      ]},
      { k: "learn", title: "The recipe", b: [
        `<div class="eq">f(t) = a₀ + Σ [aₙcos(nω₀t) + bₙsin(nω₀t)]</div>`,
        `<ul><li>ω₀ = 2π/T: the <b>fundamental</b> (1st harmonic)</li><li>n ω₀: the <b>n-th harmonic</b>; only whole-number multiples, because only they repeat every T</li><li>a₀: the average (DC) value</li></ul>`,
        tbl(["Wave (peak 1)", "Series", "Harmonics fall as"], [["Square ±1", "(4/π)Σ sin(nω₀t)/n, n odd", "1/n"], ["Triangle ±1", "(8/π²)Σ cos(nω₀t)/n², n odd", "1/n²"], ["Sawtooth ±1", "(2/π)Σ (−1)ⁿ⁺¹ sin(nω₀t)/n", "1/n (all n)"]]),
      ]},
      { k: "why", title: "Edges cost harmonics", b: [
        `<p>A jump (square, sawtooth) needs harmonics falling only as 1/n: lots of high-frequency content. A kink (triangle) needs 1/n². A smooth wave needs almost none.</p>`,
        `<div class="key"><b>Chip meaning.</b> A fast clock edge carries strong harmonics far above the clock frequency. A 1 GHz clock with 30 ps edges has real energy at 5, 7, 9 GHz and beyond: it couples into neighbouring wires and sensitive analog blocks. Slowing edges (where timing allows) is a standard way to cut that interference.</div>`,
      ]},
      { k: "predict", title: "Predict first", b: [
        { t: "mcq", q: "A 1 MHz square wave goes through a perfect filter that passes only 0–2 MHz. What comes out?", opts: [["A pure 1 MHz sine of amplitude (4/π) × the square's peak", true, "Only the fundamental is under 2 MHz: the 3rd harmonic is at 3 MHz."], ["A slightly rounded square wave", false, "That needs at least the 3rd and 5th harmonics."], ["Nothing", false, "The fundamental gets through."]] },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A ±2 V square wave. Amplitude of its 3rd harmonic (V)?", a: 0.8488, tol: 0.01, why: "(4 × 2/π)/3 = 2.546/3 = 0.849 V." },
        { t: "num", q: "Triangle wave ±1: amplitude of its 3rd harmonic?", a: 0.09006, tol: 0.02, why: "8/(π² × 9) = 0.090. Compare the square's 0.424: smooth waves have weak harmonics." },
        { t: "mcq", q: "Period T = 10 µs. Which frequency can NOT appear in its Fourier series?", opts: [["150 kHz", true, "Harmonics are multiples of 100 kHz: 100, 200, 300 kHz… 150 kHz doesn't repeat every 10 µs."], ["300 kHz", false, "3 × 100 kHz."], ["0 Hz (DC)", false, "The average a₀ is the 0th harmonic."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a square wave need high harmonics but a triangle wave doesn't?", model: "A square wave jumps instantly, and only very fast-wiggling sines can build a sharp edge, so its harmonics only fall off as one over n. A triangle wave has no jumps, just corners, so its harmonics fall as one over n squared and a few low ones already describe it well." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Two views: time and frequency", mins: 20,
    blurb: "The same signal as a waveform or as a list of harmonic amplitudes. Engineers switch between them constantly.",
    takeaway: "A periodic signal is fully described by its spectrum: the amplitude (and phase) of each harmonic. Time view: what an oscilloscope shows. Frequency view: what a spectrum analyser shows. Amplitude Aₙ = √(aₙ² + bₙ²), phase from atan2. A pulse train of height A and duty cycle D: DC = AD, harmonic amplitudes (2A/nπ)|sin(nπD)|. At D = 50% every even harmonic vanishes; at D = 25% every 4th vanishes.",
    steps: [
      { k: "learn", title: "Amplitude and phase", b: [
        `<p>A cosine plus a sine at the same frequency is one sinusoid with a phase shift (Module 10):</p>`,
        `<div class="eq">aₙcos θ + bₙsin θ = Aₙcos(θ − φₙ),  Aₙ = √(aₙ² + bₙ²)</div>`,
        `<p>The <b>spectrum</b> is the list of A₀, A₁, A₂, … drawn as bars. Most of the time the amplitudes are what matter; phase matters for the waveform's shape.</p>`,
      ]},
      { k: "play", title: "Pulse train: duty cycle in both views", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), sp = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let D = 0.5;
          function draw() {
            f.innerHTML = plot({ x: [0, 3], y: [-0.2, 1.2], xt: [0, 1, 2, 3], xtf: (v) => v + "T", yt: [0, 1], xl: "time", h: 160, series: [{ f: (t) => (frac(t) < D ? 1 : 0), cls: "s1", n: 900 }], label: "Pulse train in time" });
            const amps = []; for (let n = 1; n <= 16; n++) amps.push((2 / (n * Math.PI)) * Math.abs(Math.sin(n * Math.PI * D)));
            sp.innerHTML = bars(amps, { ymax: 0.7, yt: [0, 0.3, 0.6], label: "Harmonic amplitudes of the pulse train" });
            ro.innerHTML = readout([["DC (average)", fmt(D, 3)], ["Fundamental", fmt(amps[0], 3)], ["First missing harmonic", (() => { for (let n = 2; n <= 20; n++) if (Math.abs(Math.sin(n * Math.PI * D)) < 1e-9) return n + (n === 2 ? "nd" : n === 3 ? "rd" : "th") + " (and its multiples)"; return "none up to the 20th"; })()]]);
          }
          host.append(f, sp, slider({ id: id + "-d", label: "Duty cycle D", min: 0.05, max: 0.95, step: 0.05, value: D, show: (v) => fmt(100 * v, 3) + "%" }, (v) => { D = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">At 50% the even harmonics vanish (the half-wave symmetry of Part 4). Narrow pulses spread their energy over many harmonics with a slowly falling envelope: a hint of Module 31's “short in time = wide in frequency”.</p>`,
      ]},
      { k: "why", title: "Why the frequency view wins for circuits", b: [
        `<p>A linear circuit treats each sinusoid separately: it scales it by |H(jnω₀)| and shifts its phase (6.002 Chapter 13). So to push any periodic wave through a filter:</p>`,
        steps([["Split the input into harmonics", "Fourier series"], ["Multiply each by H(jnω₀)", "phasors, one per harmonic"], ["Add them back up", "superposition"]]),
        `<p>Part 5 does exactly this to a square wave going through an RC filter.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 0–5 V clock with 50% duty. DC level (V)?", a: 2.5, why: "A·D = 5 × 0.5." },
        { t: "num", q: "…and its fundamental's amplitude (V)?", a: 3.183, tol: 0.01, why: "(2 × 5/π)·sin(π/2) = 3.18 V." },
        { t: "mcq", q: "A pulse train with 20% duty cycle has no energy at which harmonic?", opts: [["The 5th (and 10th, 15th, …)", true, "sin(nπ × 0.2) = 0 when n is a multiple of 5."], ["The 2nd", false, "sin(0.4π) ≠ 0."], ["The 20th only", false, "Every multiple of 5."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is it useful to look at a periodic signal as a spectrum?", model: "Because a linear circuit handles each sine wave on its own, multiplying it by the circuit's response at that frequency. If you know the signal's harmonics and the circuit's frequency response, you can work out the output harmonic by harmonic and add them back up." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Finding the coefficients: the averaging trick", mins: 30,
    blurb: "Multiply by the harmonic you want and average. Every other harmonic averages to zero. That's how spectrum analysers and lock-in amplifiers work.",
    takeaway: "Over one period, the average of sin(mω₀t)·sin(nω₀t) is 0 unless m = n (then ½); the same holds for cosines, and sin × cos always averages to 0. The harmonics are orthogonal: their “dot product” is zero (Module 24). So to find bₙ, multiply the signal by sin(nω₀t) and average: bₙ = 2·avg[f(t) sin(nω₀t)]; aₙ = 2·avg[f(t) cos(nω₀t)]; a₀ = avg[f]. Equivalently bₙ = (2/T)∫₀ᵀ f(t) sin(nω₀t) dt. Multiply-then-average is what a mixer plus low-pass filter does in hardware.",
    steps: [
      { k: "why", title: "Sines that share nothing", b: [
        `<p>Multiply two different harmonics and average over a period. Sometimes the product is positive, sometimes negative, and it cancels exactly:</p>`,
        `<div class="eq">avg[sin(mω₀t)·sin(nω₀t)] = 0 (m ≠ n),  ½ (m = n)</div>`,
        `<p>That's the dot-product idea from Module 24: “multiply matching entries and add” becomes “multiply the two waves point by point and average”. Zero means they share nothing: they're <b>orthogonal</b>.</p>`,
      ]},
      { k: "play", title: "Fish out one harmonic", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let key = "square", k = 1;
          function draw() {
            const W = WAVES[key], prod = (t) => W.f(t) * Math.sin(TAU * k * t);
            let avg = 0; const M = 4000; for (let i = 0; i < M; i++) avg += prod((i + 0.5) / M); avg /= M;
            f.innerHTML = plot({ x: [0, 1], y: [-1.5, 1.5], xt: [0, 0.25, 0.5, 0.75, 1], xtf: (v) => v + "T", yt: [-1, 0, 1], xl: "time", h: 230, areas: [{ f: (t) => Math.max(0, prod(t)), cls: "ar3", n: 600 }, { f: (t) => Math.min(0, prod(t)), cls: "ar2", n: 600 }], series: [{ f: W.f, cls: "s5", n: 600 }, { f: (t) => Math.sin(TAU * k * t), cls: "s2", n: 600 }, { f: prod, cls: "s1", n: 600 }], label: "Signal (grey), test sine (blue) and their product (orange) with positive and negative areas shaded" });
            ro.innerHTML = readout([["Average of the product", fmt(avg, 4)], ["2 × average = bₖ", fmt(2 * avg, 4)], ["Formula", fmt(W.b(k), 4)]]);
          }
          host.append(toggle(Object.values(WAVES).map((w) => w.name), (i) => { key = Object.keys(WAVES)[i]; draw(); }, 0), f,
            slider({ id: id + "-k", label: "Test sine: harmonic k", min: 1, max: 8, step: 1, value: k }, (v) => { k = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Green area counts positive, blue negative. For the square wave with k = 2, 4, 6 they cancel exactly: no even harmonics. For k = 1 the product is almost always positive and the average is large. The triangle is all cosines, so every sine test gives zero.</p>`,
      ]},
      { k: "learn", title: "The formulas", b: [
        `<div class="eq">a₀ = (1/T)∫f dt    aₙ = (2/T)∫f·cos(nω₀t) dt    bₙ = (2/T)∫f·sin(nω₀t) dt</div>`,
        `<p class="aside">The 2 undoes the ½ from avg[sin²] = ½. Integrals over one full period; any starting point works.</p>`,
      ]},
      { k: "math", title: "Derive the square wave's coefficients", b: [
        `<p>±1 square wave: +1 for the first half period, −1 for the second.</p>`,
        steps([["bₙ = (2/T)[∫₀^(T/2) sin(nω₀t)dt − ∫_(T/2)^T sin(nω₀t)dt]", ""], ["Each integral of sin is −cos/(nω₀)", "first half: (1 − cos nπ)/(nω₀)"], ["Second half gives the same with opposite sign", "total: 2(1 − cos nπ)/(nω₀)"], ["× 2/T, with ω₀T = 2π", "bₙ = 2(1 − cos nπ)/(nπ)"], ["cos nπ = −1 for odd n, +1 for even", "bₙ = 4/(nπ) odd,  0 even"]]),
      ]},
      { k: "why", title: "Hardware does this", b: [
        `<p>A <b>mixer</b> multiplies two signals; a <b>low-pass filter</b> averages. Mixer + LPF = “multiply by a test sine and average” = measure one Fourier coefficient. That's a lock-in amplifier, the heart of a radio receiver, and the way a chip's built-in self-test measures a single tone buried in noise.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Average over one period of sin(3ω₀t)·sin(5ω₀t)?", a: 0, why: "Different harmonics are orthogonal." },
        { t: "num", q: "Average of sin²(4ω₀t) over a period?", a: 0.5, why: "Always ½ for a full-amplitude sine squared (mean of (1 − cos)/2)." },
        { t: "num", q: "A signal's DC value: it is 3 V for the first quarter of each period and 0 V otherwise. a₀ (V)?", a: 0.75, why: "Average = 3 × ¼ = 0.75 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you extract the 5th harmonic's sine coefficient from a measured periodic signal?", model: "Multiply the signal by a sine at five times the fundamental and average over one period, then double it. Every other harmonic multiplied by that sine averages to zero because they're orthogonal, so only the 5th harmonic's sine part survives." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Symmetry shortcuts and the complex form", mins: 25,
    blurb: "Spot symmetry and half the coefficients vanish before you integrate. Then the compact complex-exponential version.",
    takeaway: "Even f(−t) = f(t): cosines only (bₙ = 0). Odd f(−t) = −f(t): sines only. Half-wave symmetry f(t + T/2) = −f(t): odd harmonics only. Zero average: a₀ = 0. Complex form: f(t) = Σ cₙe^(jnω₀t) over all integers n, with cₙ = (1/T)∫f(t)e^(−jnω₀t)dt. For real signals c₋ₙ = cₙ*, and |cₙ| = Aₙ/2 (each real sinusoid is split between +n and −n). This is the form the Fourier transform grows from.",
    steps: [
      { k: "learn", title: "Symmetry rules", b: [
        tbl(["If the wave is…", "Test", "Then"], [["Even", "f(−t) = f(t) (mirror about t = 0)", "only cosines (and DC)"], ["Odd", "f(−t) = −f(t)", "only sines, no DC"], ["Half-wave symmetric", "f(t + T/2) = −f(t)", "only odd harmonics"], ["Zero average", "equal area above and below", "a₀ = 0"]]),
        `<p class="aside">The square wave as drawn is odd and half-wave symmetric: odd sines only. The triangle is even and half-wave symmetric: odd cosines only.</p>`,
      ]},
      { k: "why", title: "Why half-wave symmetry kills even harmonics", b: [
        `<p>An even harmonic repeats every half period: shifting by T/2 leaves it unchanged. A half-wave symmetric wave flips sign under that shift. Correlating something that flips with something that doesn't gives two equal halves of opposite sign: zero.</p>`,
        `<div class="key"><b>Circuit version.</b> A perfectly balanced (differential, symmetric) circuit driven by a sine produces an output with half-wave symmetry, so no even harmonics: the same fact as Module 29's odd tanh curve. Even-harmonic distortion in a measured differential circuit points straight at an imbalance.</div>`,
      ]},
      { k: "learn", title: "The complex form", b: [
        `<p>Euler: cos θ = (e<sup>jθ</sup> + e<sup>−jθ</sup>)/2. So each real harmonic is a pair of spinning phasors, one at +nω₀ and one at −nω₀, each of half the size.</p>`,
        `<div class="eq">f(t) = Σ cₙ e<sup>jnω₀t</sup>,  cₙ = (1/T)∫ f(t) e<sup>−jnω₀t</sup> dt</div>`,
        `<ul><li>One formula instead of three (a₀, aₙ, bₙ)</li><li>|cₙ| = Aₙ/2 for n ≠ 0; c₀ = a₀</li><li>“Negative frequencies” are bookkeeping: the partner that keeps the sum real</li></ul>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which coefficients can be non-zero?", bins: ["Cosines only", "Sines only", "Odd harmonics only"], items: [["f(t) = |sin ω₀t| (full-wave rectified), measured with t = 0 at a zero", 0, "It's even about t = 0 (and has DC). Its own period is T/2, so in terms of the sine's ω₀ only even harmonics appear."], ["A sawtooth that's odd about t = 0", 1, "Odd function: sines."], ["A 25% pulse train centred on t = 0 (high from −T/8 to T/8)", 0, "Even about t = 0: cosines (plus DC). Not half-wave symmetric, so even harmonics appear too."], ["Output of a balanced differential amplifier driven by a sine, with arbitrary time origin", 2, "Half-wave symmetry: odd harmonics only."]] },
        { t: "num", q: "A real 2 V-amplitude cosine at 3ω₀. What is |c₃|?", a: 1, why: "Half the amplitude: 1 at +3ω₀ and 1 at −3ω₀." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does half-wave symmetry tell you about a signal's spectrum, and why?", model: "It has only odd harmonics. Even harmonics look the same after half a period, while a half-wave symmetric signal flips sign after half a period, so when you average their product over a period the two halves cancel." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "Power, THD and filtering a square wave", mins: 30,
    blurb: "Where a wave's power lives, how ‘un-sine-like’ it is, and what an RC filter does to each harmonic.",
    takeaway: "Parseval: mean square = a₀² + Σ Aₙ²/2. Power splits cleanly among harmonics (they're orthogonal). Square wave: 81% of its power is in the fundamental (8/π²). THD = √(A₂² + A₃² + …)/A₁: square 48%, triangle 12%. A linear filter multiplies each harmonic by |H(jnω₀)| and shifts its phase; add them back for the output. An RC low-pass with f_c far below f₀ turns a square wave into a near-triangle: each harmonic is divided by about n·f₀/f_c on top of its 1/n.",
    steps: [
      { k: "learn", title: "Parseval: power adds up harmonic by harmonic", b: [
        `<div class="eq">avg[f²] = a₀² + Σ Aₙ²/2</div>`,
        `<p>Cross terms between different harmonics average to zero (orthogonality again), so each harmonic contributes its own power: a sinusoid of amplitude Aₙ has mean square Aₙ²/2.</p>`,
        { t: "reveal", label: "Check it on the ±1 square wave", html: `<p>avg[f²] = 1 (it's always ±1). Harmonic sum: ½(4/π)²(1 + 1/9 + 1/25 + …) = (8/π²)(π²/8) = 1 ✓. And the fundamental alone carries 8/π² = 81% of the power.</p>` },
      ]},
      { k: "learn", title: "THD: one number for distortion", b: [
        `<div class="eq">THD = √(A₂² + A₃² + A₄² + …) / A₁</div>`,
        tbl(["Wave", "THD"], [["Pure sine", "0%"], ["Triangle", "12.1%"], ["Square", "48.3%"], ["Good audio amplifier", "&lt; 0.01%"], ["Good 16-bit ADC", "about 0.001% (−100 dB)"]]),
        `<p class="aside">Often quoted in dB: 20 log₁₀(THD). 1% = −40 dB; 0.01% = −80 dB.</p>`,
      ]},
      { k: "play", title: "Square wave through an RC low-pass", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), sp = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let r = 1;
          function draw() {
            /* f_c = r × f0. Output = Σ (4/nπ)|H| sin(nω0t + φ) */
            const N = 99, H = (n) => { const x = n / r; return [1 / Math.sqrt(1 + x * x), -Math.atan(x)]; };
            const out = (t) => { let s = 0; for (let n = 1; n <= N; n += 2) { const [m, p] = H(n); s += (4 / (n * Math.PI)) * m * Math.sin(TAU * n * t + p); } return s; };
            f.innerHTML = plot({ x: [0, 2], y: [-1.4, 1.4], xt: [0, 0.5, 1, 1.5, 2], xtf: (v) => v + "T", yt: [-1, 0, 1], xl: "time", h: 200, series: [{ f: WAVES.square.f, cls: "s5", n: 800 }, { f: out, cls: "s1", n: 800 }], label: "Square wave input (grey) and the RC filter output (orange)" });
            const amps = [], ins = []; for (let n = 1; n <= 11; n++) { ins.push(n % 2 ? 4 / (n * Math.PI) : 0); amps.push(n % 2 ? (4 / (n * Math.PI)) * H(n)[0] : 0); }
            sp.innerHTML = bars(amps, { ymax: 1.4, label: "Output harmonic amplitudes" });
            const thd = (a) => Math.sqrt(a.slice(1).reduce((s, x) => s + x * x, 0)) / a[0];
            ro.innerHTML = readout([["f_c / f₀", fmt(r, 3)], ["Fundamental kept", fmt(H(1)[0], 3)], ["3rd harmonic kept", fmt(H(3)[0], 3)], ["THD in → out (first 11 harmonics)", `${fmt(100 * thd(ins), 3)}% → ${fmt(100 * thd(amps), 3)}%`]]);
          }
          host.append(f, sp, slider({ id: id + "-r", label: "Filter corner f_c relative to f₀", min: 0.1, max: 30, log: true, value: r, show: (v) => fmt(v, 3) + " × f₀" }, (v) => { r = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">High f<sub>c</sub>: harmonics pass and the square stays square (rounded corners). f<sub>c</sub> near f₀: the familiar RC charge–discharge shape. f<sub>c</sub> ≪ f₀: every harmonic gets an extra 1/n, so the output's harmonics fall as 1/n²: it's a small triangle (the capacitor integrates the square).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A signal has A₁ = 1 V, A₂ = 0.03 V, A₃ = 0.04 V. THD in %?", a: 5, unit: "%", why: "√(0.0009 + 0.0016)/1 = 0.05 = 5%." },
        { t: "num", q: "rms of a wave with a₀ = 1 V and a single harmonic of amplitude 2 V (V)?", a: 1.732, tol: 0.01, why: "√(1² + 2²/2) = √3 = 1.73 V." },
        { t: "num", q: "1 MHz ±1 V square wave into an RC low-pass with f_c = 1 MHz. Output 3rd-harmonic amplitude (V)?", a: 0.1342, tol: 0.02, why: "Input 4/(3π) = 0.424 V; |H| at 3 MHz = 1/√(1 + 9) = 0.316; 0.424 × 0.316 = 0.134 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How would you predict the output of a filter driven by a square wave, without solving a differential equation?", model: "Break the square wave into its harmonics, the odd sines with amplitudes four over n pi. Multiply each harmonic by the filter's gain at that frequency and shift it by the filter's phase there. Then add the filtered harmonics back together to get the output waveform." },
      ]},
    ],
  };

  const p6 = {
    id: "p6", title: "Master it", mins: 30,
    blurb: "Coefficients, symmetry, power and filtering.",
    takeaway: "You can build, analyse and filter periodic signals in the frequency domain, read symmetry, and quantify distortion with Parseval and THD.",
    steps: [
      { k: "check", title: "Problem 1: rectifier", b: [
        `<p>Half-wave rectified sine, peak V<sub>p</sub>: DC level V<sub>p</sub>/π (Boylestad Chapter 2).</p>`,
        { t: "num", q: "Check with a₀ = (1/T)∫f dt: for V_p = 10 V, a₀ (V)?", a: 3.183, tol: 0.01, hint: "∫ over the positive half of 10 sin = 20/ω₀; divide by T = 2π/ω₀.", why: "20/(2π) = 3.18 V = V_p/π ✓." },
      ]},
      { k: "check", title: "Problem 2: power", b: [
        { t: "num", q: "What fraction of a ±1 square wave's power lies in harmonics 1 and 3 together (%)?", a: 90.1, tol: 0.01, hint: "Each odd harmonic carries (8/π²)/n² of the power.", why: "(8/π²)(1 + 1/9) = 0.8106 × 1.111 = 0.901 → 90.1%." },
      ]},
      { k: "check", title: "Problem 3: clock harmonics", b: [
        { t: "num", q: "A 0–1.8 V, 50% duty, 500 MHz clock. Amplitude of its 1.5 GHz component (mV)?", a: 382, tol: 0.02, hint: "1.5 GHz is the 3rd harmonic. Amplitude (2A/nπ)|sin(nπD)|.", why: "(2 × 1.8/(3π)) × 1 = 0.382 V." },
      ]},
      { k: "check", title: "Problem 4: symmetry diagnosis", b: [
        { t: "mcq", q: "A fully differential amplifier's output spectrum shows a 2nd harmonic at −45 dBc. Most likely cause?", opts: [["An imbalance between the two halves (mismatch or an asymmetric load)", true, "A perfectly symmetric circuit has half-wave symmetric output: no even harmonics."], ["The input level is too low", false, "Lower level reduces distortion; it doesn't create even harmonics."], ["Normal: differential circuits make even harmonics", false, "They cancel them, when balanced."]] },
      ]},
      { k: "check", title: "Problem 5: filter design", b: [
        { t: "mcq", q: "You want a 10 kHz square wave's 3rd harmonic at least 40 dB below its fundamental, using one first-order RC low-pass. Which corner frequency f_c does it?", opts: [["None: a first-order filter can't do it", true, "The input ratio is already 1/3. Far below the corner, the filter divides the fundamental by 10k/f_c and the 3rd harmonic by 30k/f_c: only 3× more. So the best you can reach is 1/9, about −19 dB, whatever f_c. You need a steeper (higher-order) filter."], ["f_c = 333 Hz", false, "Work out both harmonics' attenuation there: their ratio is still about 1/9 (−19 dB)."], ["f_c = 10 kHz", false, "At the corner the 3rd harmonic is only √10/√2 ≈ 2.2× further down: about −17 dB in total."]] },
      ]},
      { k: "say", title: "Problem 6: explain it", b: [
        { t: "say", q: "Explain why Fourier coefficients can be found one at a time, using the idea of orthogonality.", model: "Sines and cosines at different harmonic frequencies are orthogonal: the average of their product over a period is zero. So if you multiply the whole signal by one particular harmonic and average, every other harmonic's contribution vanishes and only the matching one is left. That gives that coefficient directly, without solving for the others." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m30", eyebrow: "Math Toolkit · Module 30", title: "Fourier Series",
    intro: `<p>Six parts: building waves from sines, the time and frequency views, finding coefficients by averaging, symmetry and the complex form, power, THD and filtering, and mastery problems.</p><p>Why a chip designer needs this: clocks, distortion, interference and every spectrum measurement are about harmonics.</p><p class="aside">Before this: Modules 10 (sinusoids), 12 (complex numbers), 14 (integrals) and 24 Part 1 (the dot product). Pairs with 6.002 Chapter 13 and Boylestad Chapters 2, 12 and 15.</p>`,
    after: `<p>Next: Module 31 lets the period stretch to infinity, turning the series into the Fourier transform of any signal.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <div class="eq">f(t) = a₀ + Σ [aₙcos nω₀t + bₙsin nω₀t]</div>
      <p>a₀ = avg f; aₙ = 2·avg[f cos nω₀t]; bₙ = 2·avg[f sin nω₀t]. Harmonics are orthogonal (average of products = 0).</p>
      <p>Square ±1: (4/π)Σ_odd sin(nω₀t)/n. Triangle ±1: (8/π²)Σ_odd cos(nω₀t)/n². Sawtooth: (2/π)Σ(−1)ⁿ⁺¹sin(nω₀t)/n. Pulse (A, duty D): DC AD, Aₙ = (2A/nπ)|sin nπD|. Gibbs: ~9% overshoot at jumps.</p>
      <p>Even → cosines; odd → sines; half-wave symmetric → odd harmonics only (balanced differential circuits).</p>
      <p>Complex: f = Σcₙe^(jnω₀t), cₙ = (1/T)∫f e^(−jnω₀t)dt, |cₙ| = Aₙ/2.</p>
      <p><b>Parseval:</b> avg f² = a₀² + ΣAₙ²/2. Square: 81% in fundamental. <b>THD</b> = √(ΣAₙ², n≥2)/A₁: square 48%, triangle 12%.</p>
      <p><b>Filtering:</b> multiply each harmonic by H(jnω₀), add back.</p>`,
  };
  Course.start(window.CHAPTER);
})();
