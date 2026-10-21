(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;
  const tbl = (head, rows) => `<div class="tbl"><table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`;
  const TAU = 2 * Math.PI;
  /* Where a tone at f lands after sampling at fs: folded into 0..fs/2. */
  const alias = (f, fs) => { let r = ((f % fs) + fs) % fs; return r > fs / 2 ? fs - r : r; };
  const sinc = (u) => (Math.abs(u) < 1e-9 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u));

  const p1 = {
    id: "p1", title: "Sampling: dots on a curve", mins: 20,
    blurb: "An ADC keeps only snapshots. If the signal wiggles too fast between them, the dots tell a different, slower story.",
    takeaway: "Sampling at rate f_s keeps values every T_s = 1/f_s. A sine below f_s/2 (the Nyquist frequency) is captured uniquely. Above it, the same dots fit a lower-frequency sine just as well: aliasing. A tone at f appears at |f − k·f_s| for whichever whole number k brings it into 0…f_s/2 (it ‘folds’ about multiples of f_s/2). Once sampled, an alias is indistinguishable from a real tone, so it must be prevented before sampling.",
    steps: [
      { k: "play", title: "Speed up the signal", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let fr = 0.3;
          function draw() {
            const fa = alias(fr, 1), sgn = (((fr % 1) + 1) % 1) > 0.5 ? -1 : 1, marks = [];
            for (let n = 0; n <= 12; n++) marks.push({ x: n, y: Math.sin(TAU * fr * n), r: 5 });
            f.innerHTML = plot({ x: [0, 12], y: [-1.3, 1.3], xt: [0, 2, 4, 6, 8, 10, 12], yt: [-1, 0, 1], xl: "time (sample periods)", h: 230, series: [{ f: (t) => Math.sin(TAU * fr * t), cls: "s2", n: 1500 }, { f: (t) => sgn * Math.sin(TAU * fa * t), cls: "s4", n: 600 }], marks, label: "Real signal (blue), samples (orange dots) and the slowest sine through the same dots (red dashed)" });
            ro.innerHTML = readout([["Signal f / f_s", fmt(fr, 3)], ["Slowest sine through the dots", fmt(fa, 3) + " × f_s"], ["Verdict", fr <= 0.5 ? "captured correctly" : "ALIASED: the dots lie"]]);
          }
          host.append(f, slider({ id: id + "-f", label: "Signal frequency, as a fraction of the sample rate", min: 0.02, max: 1.5, step: 0.01, value: fr }, (v) => { fr = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Below 0.5, the red dashed curve sits right on top of the blue one. Push past 0.5: blue wiggles faster, but the dots trace the slower red sine. At exactly 1.0 every sample lands on the same phase and you'd see a constant: a perfectly “frozen” wheel.</p>`,
      ]},
      { k: "learn", title: "The Nyquist rule", b: [
        `<div class="eq">f < f_s/2   (equivalently  f_s > 2f)</div>`,
        `<p>f<sub>s</sub>/2 is the <b>Nyquist frequency</b>. Any content above it folds back into 0…f<sub>s</sub>/2.</p>`,
        `<div class="eq">f_alias = |f − k·f_s|  (k chosen so the result lies in 0…f_s/2)</div>`,
        `<p class="aside">Film shows the same effect: a wagon wheel spinning just under the frame rate seems to turn slowly backwards.</p>`,
      ]},
      { k: "predict", title: "Predict first", b: [
        { t: "mcq", q: "An ADC samples at 1 MS/s. A 700 kHz tone goes in. What frequency appears in the samples?", opts: [["300 kHz", true, "|700 − 1000| = 300 kHz, below 500 kHz."], ["700 kHz", false, "700 kHz is above the 500 kHz Nyquist frequency: it can't be represented."], ["1.7 MHz", false, "Aliases always land between 0 and f_s/2."]] },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "f_s = 1 MHz. Where does a 1.2 MHz tone appear (kHz)?", a: 200, unit: "kHz", why: "|1200 − 1000| = 200 kHz." },
        { t: "num", q: "f_s = 48 kHz. Where does a 30 kHz tone appear (kHz)?", a: 18, unit: "kHz", why: "|30 − 48| = 18 kHz." },
        { t: "num", q: "Minimum sample rate to capture a 20 kHz audio band (kHz)?", a: 40, unit: "kHz", why: "2 × 20 kHz. Real systems use 44.1 or 48 kHz to leave room for the anti-alias filter." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is aliasing, in plain words?", model: "When a signal changes faster than half the sampling rate, the samples are too far apart to follow it, and the same set of dots fits a slower sine wave. The sampled data then shows a false, lower frequency, and there's no way to tell afterwards that it wasn't really there." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "The spectrum view: copies every f_s", mins: 25,
    blurb: "Sampling repeats the spectrum at every multiple of f_s. Where copies overlap, information is destroyed.",
    takeaway: "Sampling multiplies the signal by a train of impulses every T_s. An impulse train's spectrum is another impulse train every f_s, and multiplication becomes convolution, so the signal's spectrum is copied around 0, ±f_s, ±2f_s, … If the signal's bandwidth B < f_s/2, the copies don't touch and the original can be recovered. If not, copies overlap (aliasing). Fix: an anti-alias low-pass filter before the sampler. Wideband noise aliases too: everything up to the filter's edge folds into 0…f_s/2.",
    steps: [
      { k: "learn", title: "Why copies appear", b: [
        steps([["Sampling = x(t) × (impulse every T_s)", "a product in time"], ["Impulse train ↔ impulse train every f_s", "Fourier pair"], ["Product in time ↔ convolution in frequency", "Module 31"], ["Convolving with impulses = copying", "X(f) repeated at every k·f_s"]]),
      ]},
      { k: "play", title: "Fold it", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let B = 0.35, filt = false;
          function draw() {
            const shape = (u) => Math.max(0, 1 - Math.abs(u) / B) * (filt ? (Math.abs(u) < 0.45 ? 1 : 0) : 1);
            const areas = [];
            for (let k = -2; k <= 2; k++) areas.push({ f: (u) => shape(u - k), cls: k ? "ar2" : "ar1", n: 600 });
            const total = (u) => { let s = 0; for (let k = -3; k <= 3; k++) s += shape(u - k); return s; };
            f.innerHTML = plot({ x: [-1.6, 1.6], y: [0, 1.6], xt: [-1.5, -1, -0.5, 0, 0.5, 1, 1.5], yt: [0, 1], xl: "frequency (× f_s)", h: 220, areas, series: [{ f: total, cls: "s1", n: 900 }, { pts: [[-0.5, 0], [-0.5, 1.6]], cls: "s4" }, { pts: [[0.5, 0], [0.5, 1.6]], cls: "s4" }], label: "Original spectrum (orange area) and its copies at multiples of the sample rate (blue), with their sum" });
            const overlap = !filt && B > 0.5;
            ro.innerHTML = readout([["Signal bandwidth B", fmt(B, 3) + " f_s"], ["Copies overlap?", overlap ? "YES: aliasing, information lost" : "no: recoverable"]]);
          }
          host.append(f, slider({ id: id + "-b", label: "Signal bandwidth", min: 0.1, max: 0.9, step: 0.01, value: B, show: (v) => fmt(v, 3) + " × f_s" }, (v) => { B = v; draw(); }).el,
            toggle(["No anti-alias filter", "Anti-alias filter at 0.45 f_s"], (i) => { filt = i === 1; draw(); }, 0), ro);
          draw();
        },
        `<p class="aside">Orange: the real spectrum. Blue: copies at ±f<sub>s</sub>, ±2f<sub>s</sub>. The orange line is what the samples “see”. Widen the band past 0.5f<sub>s</sub> and neighbouring copies overlap: the tails fold onto the signal. Switch on the filter: everything above 0.45f<sub>s</sub> is removed before sampling, so no overlap whatever the input.</p>`,
      ]},
      { k: "why", title: "The anti-alias filter must come first", b: [
        `<p>After sampling, an alias sits at a legitimate frequency, mixed in with the real signal. No digital filter can separate them. So every ADC needs an analog low-pass <b>before</b> the sampler.</p>`,
        `<div class="key"><b>Noise folds too.</b> A sampler's input carries noise across a wide band, set by the sampling switch and capacitor (Module 36's kT/C). All of it folds into 0…f<sub>s</sub>/2. That's why kT/C noise is set by the capacitor, not by the sample rate.</div>`,
        `<p class="aside">Oversampling helps: sample at 4–64× the signal bandwidth and the anti-alias filter can be gentle, because the first copy is far away. Sigma-delta ADCs take this to the extreme.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Signal band 0–10 MHz, f_s = 25 MS/s. Where does the first copy start, and is there room for a filter?", opts: [["The copy spans 15–35 MHz: a 10 → 15 MHz gap for the filter to roll off", true, "Copy at f_s − B = 15 MHz. The filter must pass 10 MHz and kill 15 MHz."], ["At 10 MHz, no room", false, "The copy is centred on 25 MHz."], ["No copies exist below 25 MHz", false, "The lower edge of the copy is at 25 − 10 = 15 MHz."]] },
        { t: "num", q: "A sensor's useful band is 0–5 kHz, but interference at 60 kHz is present. With f_s = 64 kS/s, where would it alias (kHz)?", a: 4, unit: "kHz", why: "|60 − 64| = 4 kHz: right inside your band. Filter it out before the ADC." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must anti-alias filtering be done before sampling, not after?", model: "Sampling copies the spectrum at every multiple of the sample rate, so anything above half the sample rate lands on top of frequencies inside the band. After that, the alias and the real signal occupy the same frequencies in the samples and can't be separated, so the unwanted content has to be removed with an analog filter before the sampler." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Getting back out: the DAC and the hold", mins: 20,
    blurb: "A DAC holds each value until the next. That staircase has its own spectrum: a sinc droop and images.",
    takeaway: "Ideal reconstruction interpolates with sinc pulses (equivalently: a perfect low-pass at f_s/2). A real DAC holds each sample for T_s (a zero-order hold). The hold multiplies the spectrum by |sinc(f/f_s)|, a droop that reaches 2/π (−3.9 dB) at f_s/2, and leaves images at f_s ± f, 2f_s ± f, … that a reconstruction filter must remove. A sample-and-hold at an ADC input shows the same staircase.",
    steps: [
      { k: "play", title: "The staircase", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let fr = 0.1;
          function draw() {
            const st = (t) => Math.sin(TAU * fr * Math.floor(t));
            const d = sinc(fr);
            f.innerHTML = plot({ x: [0, 20], y: [-1.3, 1.3], xt: [0, 5, 10, 15, 20], yt: [-1, 0, 1], xl: "time (sample periods)", h: 220, series: [{ f: (t) => Math.sin(TAU * fr * t), cls: "s5", n: 800 }, { f: st, cls: "s1", n: 2000 }, { f: (t) => d * Math.sin(TAU * fr * (t - 0.5)), cls: "s3", n: 800 }], label: "Original sine (grey dashed), DAC staircase (orange), and the staircase's fundamental (green)" });
            ro.innerHTML = readout([["f / f_s", fmt(fr, 3)], ["Hold droop |sinc(f/f_s)|", `${fmt(d, 4)} (${fmt(20 * Math.log10(d), 3)} dB)`], ["Hold delay", "½ sample"], ["First image at", fmt(1 - fr, 3) + " f_s"]]);
          }
          host.append(f, slider({ id: id + "-f", label: "Signal frequency / f_s", min: 0.02, max: 0.5, step: 0.01, value: fr }, (v) => { fr = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The green curve is what's left after a reconstruction filter strips the steps: slightly smaller than the original (the droop) and delayed by half a sample. Near f<sub>s</sub>/2 the droop is nearly 4 dB; designers pre-compensate it digitally or with the filter.</p>`,
      ]},
      { k: "learn", title: "Why sinc", b: [
        `<p>The hold is a convolution with a rectangle T<sub>s</sub> wide. In frequency that multiplies by the rectangle's transform: T<sub>s</sub>·sinc(f·T<sub>s</sub>) (Module 31). Its magnitude:</p>`,
        `<div class="eq">|H_ZOH(f)| = |sinc(f/f_s)|</div>`,
        tbl(["f / f_s", "Droop"], [["0.1", "−0.14 dB"], ["0.25", "−0.91 dB"], ["0.5", "−3.92 dB"], ["1", "−∞ (a null: the hold cancels the first image's centre)"]]),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A DAC at 100 MS/s outputs a 25 MHz tone. Droop from the hold (dB, negative)?", a: -0.91, tol: 0.03, why: "sinc(0.25) = 0.900 → −0.91 dB." },
        { t: "num", q: "Same DAC, 10 MHz tone. Frequency of the first image (MHz)?", a: 90, unit: "MHz", why: "f_s − f = 90 MHz (and 110 MHz)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What two side effects does a DAC's hold create, and how are they handled?", model: "Holding each value for a whole sample period gives a staircase whose spectrum is multiplied by a sinc, so high frequencies droop by up to about 4 dB at half the sample rate, and copies of the signal, images, appear around multiples of the sample rate. A reconstruction filter removes the images, and the droop is corrected with digital pre-emphasis or in the filter." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Quantization: rounding to levels", mins: 30,
    blurb: "An N-bit converter rounds every sample to one of 2ᴺ levels. The rounding error behaves like noise, and its size gives the famous 6.02N + 1.76 dB.",
    takeaway: "N bits, full-scale range FS: LSB = FS/2ᴺ. Rounding error lies in ±LSB/2; for a busy signal it's spread evenly, so its rms is LSB/√12. A full-scale sine has rms FS/(2√2). SNR = 20 log[(FS/2√2)/(LSB/√12)] = 6.02N + 1.76 dB. Every extra bit buys 6 dB (half the noise). Measured performance is quoted as ENOB = (SINAD − 1.76)/6.02. A 12-bit ADC is ideally 74 dB; real ones often reach ENOB ≈ 10.5–11.5.",
    steps: [
      { k: "play", title: "Fewer bits, coarser steps", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), e = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let N = 3;
          function draw() {
            const L = 2 ** N, lsb = 2 / L, q = (x) => Math.min(1 - lsb / 2, Math.max(-1 + lsb / 2, (Math.floor(x / lsb) + 0.5) * lsb));
            const sig = (t) => 0.999 * Math.sin(TAU * t);
            f.innerHTML = plot({ x: [0, 1], y: [-1.2, 1.2], xt: [0, 0.5, 1], yt: [-1, 0, 1], xl: "time (one period)", h: 190, series: [{ f: sig, cls: "s5", n: 600 }, { f: (t) => q(sig(t)), cls: "s1", n: 3000 }], label: "Full-scale sine (grey) and its quantized version (orange)" });
            e.innerHTML = plot({ x: [0, 1], y: [-1, 1], xt: [0, 0.5, 1], yt: [-1, -0.5, 0, 0.5, 1], xl: "time", yl: "error (LSB)", h: 150, series: [{ f: (t) => (sig(t) - q(sig(t))) / lsb, cls: "s4", n: 3000 }], label: "Quantization error in LSB" });
            let ps = 0, pe = 0; const M = 20000; for (let i = 0; i < M; i++) { const x = sig((i + 0.37) / M); ps += x * x; pe += (x - q(x)) ** 2; }
            ro.innerHTML = readout([["Levels 2ᴺ", L], ["LSB (FS = 2)", fmt(lsb, 4)], ["Measured SNR", fmt(10 * Math.log10(ps / pe), 4) + " dB"], ["6.02N + 1.76", fmt(6.02 * N + 1.76, 4) + " dB"]]);
          }
          host.append(f, e, slider({ id: id + "-n", label: "Bits N", min: 1, max: 12, step: 1, value: N }, (v) => { N = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The error (red) saws back and forth within ±½ LSB. With more bits it looks more and more like random noise, and the measured SNR lands on the formula within a fraction of a dB.</p>`,
      ]},
      { k: "math", title: "Derive 6.02N + 1.76", b: [
        steps([["Error uniform on ±Δ/2 (Δ = LSB)", "mean square = Δ²/12 (average of x² over the interval)"], ["Full-scale sine: amplitude FS/2", "rms = FS/(2√2)"], ["Δ = FS/2ᴺ", ""], ["SNR = rms_sig/rms_err = (FS/2√2)/(FS/(2ᴺ√12))", "= 2ᴺ·√(12/8) = 2ᴺ·√1.5"], ["In dB: 20 log(2ᴺ) + 20 log √1.5", "6.02N + 1.76 dB"]]),
      ]},
      { k: "learn", title: "Real converters: ENOB", b: [
        `<div class="eq">ENOB = (SINAD − 1.76)/6.02</div>`,
        `<p>SINAD counts noise <i>and</i> distortion. A 14-bit ADC measuring 74 dB SINAD has ENOB = 12: two bits lost to thermal noise, jitter and nonlinearity.</p>`,
        `<div class="key"><b>Rules of thumb.</b> 1 bit = 6 dB. Input at half scale (−6 dB) loses one bit of SNR. Oversampling by M and filtering back to the signal band keeps only 1/M of the quantization noise: +10 log M dB, so ½ bit per doubling of the sample rate (4× buys 1 bit). Sigma-delta modulators shape the noise out of the band and do far better.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Ideal SNR of a 12-bit converter (dB)?", a: 74, tol: 0.01, why: "6.02 × 12 + 1.76 = 74.0 dB." },
        { t: "num", q: "10-bit ADC with a 1 V full scale. rms quantization noise (mV)?", a: 0.282, tol: 0.02, why: "LSB = 0.977 mV; /√12 = 0.282 mV." },
        { t: "num", q: "An ADC measures SINAD = 68 dB. ENOB?", a: 11, tol: 0.01, why: "(68 − 1.76)/6.02 = 11.0 bits." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Where does the 6.02 dB per bit come from?", model: "Each extra bit doubles the number of levels, so the step size halves, and the rounding error, which is spread evenly within plus or minus half a step, halves too. Halving an error voltage is a factor of two, which is 20 log 2, about 6.02 dB." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "The DFT: spectra from samples", mins: 30,
    blurb: "Take N samples, get N frequency bins. How to read an FFT plot, and the traps: leakage, windows and coherent sampling.",
    takeaway: "The Discrete Fourier Transform turns N samples into N bins spaced f_s/N apart: X[k] = Σ x[n]e^(−j2πkn/N); bin k ↔ k·f_s/N. The FFT is a fast way to compute it (N log N work). A tone exactly on a bin (a whole number of cycles in the record) shows as one clean line. Off-bin tones leak into many bins; a window (e.g. Hann) tapers the record's ends and confines the leakage. ADC testing uses coherent sampling (whole, odd, prime cycle counts). Noise spreads over N/2 bins, so each bin's noise floor sits 10 log(N/2) dB below the total: the FFT processing gain.",
    steps: [
      { k: "learn", title: "Bins", b: [
        `<div class="eq">X[k] = Σₙ x[n]·e<sup>−j2πkn/N</sup>    bin spacing = f_s/N</div>`,
        `<p>Same multiply-and-add as Module 30, done on N samples for N test frequencies. Bins 0…N/2 cover 0…f<sub>s</sub>/2 (the rest mirror them).</p>`,
        `<p class="aside">Resolution = f<sub>s</sub>/N = 1/(record length). To tell 1 kHz from 1.01 kHz, you need at least a 100 ms record, whatever f<sub>s</sub> is.</p>`,
      ]},
      { k: "play", title: "Leakage and windows", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let k0 = 8, win = 0;
          const N = 64;
          function draw() {
            const x = [];
            for (let n = 0; n < N; n++) { const w = win ? 0.5 - 0.5 * Math.cos((TAU * n) / N) : 1; x.push(w * Math.cos((TAU * k0 * n) / N)); }
            const mags = [];
            for (let k = 0; k <= N / 2; k++) { let re = 0, im = 0; x.forEach((v, n) => { re += v * Math.cos((TAU * k * n) / N); im -= v * Math.sin((TAU * k * n) / N); }); mags.push(Math.hypot(re, im)); }
            const mx = Math.max(...mags), db = mags.map((m) => Math.max(-100, 20 * Math.log10(m / mx + 1e-15)));
            const pts = []; db.forEach((d, k) => pts.push([k, -100], [k, d], [k, -100]));
            f.innerHTML = plot({ x: [0, 32], y: [-100, 5], xt: [0, 8, 16, 24, 32], yt: [-100, -80, -60, -40, -20, 0], ytf: (v) => v + " dB", xl: "bin k", h: 230, series: [{ pts, cls: "s2" }], marks: db.map((d, k) => ({ x: k, y: d, r: 3, cls: "mk" })), label: "Magnitude of each DFT bin in dB" });
            const leak = db.filter((d, k) => Math.abs(k - k0) > 3).reduce((a, d) => Math.max(a, d), -100);
            ro.innerHTML = readout([["Tone at", fmt(k0, 3) + " bins (" + (Math.abs(k0 - Math.round(k0)) < 1e-6 ? "on a bin" : "between bins") + ")"], ["Window", win ? "Hann" : "none (rectangular)"], ["Worst leakage > 3 bins away", fmt(leak, 3) + " dB"]]);
          }
          host.append(f, slider({ id: id + "-k", label: "Tone frequency, in bins", min: 4, max: 12, step: 0.1, value: k0 }, (v) => { k0 = v; draw(); }).el, toggle(["No window", "Hann window"], (i) => { win = i; draw(); }, 0), ro);
          draw();
        },
        `<p class="aside">At exactly 8.0 the tone is one clean line (the rest is at the numerical floor). At 8.5, with no window, energy smears across the whole plot, only 30–40 dB down: leakage would hide any small spur. The Hann window widens the main peak a little but pushes the far leakage down by tens of dB.</p>`,
      ]},
      { k: "why", title: "Why leakage happens", b: [
        `<p>The DFT silently assumes the N samples repeat forever. If the record holds a whole number of cycles, the repeat is seamless. If not, there's a jump at the joint, and a jump has harmonics everywhere (Module 30). The window fades both ends to zero so the joint has no jump.</p>`,
        `<div class="key"><b>ADC test practice:</b> choose the input frequency so the record contains a whole, odd (often prime) number of cycles: <b>coherent sampling</b>. Then no window is needed and every spur is real.</div>`,
      ]},
      { k: "learn", title: "Reading the noise floor", b: [
        `<p>Quantization noise (power fixed by Part 4) spreads evenly over N/2 bins. So each bin holds only 2/N of it:</p>`,
        `<div class="eq">floor per bin = −(SNR + 10·log₁₀(N/2)) dBFS</div>`,
        `<p>A 12-bit ADC (74 dB) with a 4096-point FFT shows its floor near −74 − 33 = −107 dBFS. Don't read the floor as the SNR: add up the bins.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "f_s = 100 MS/s, N = 4096. Bin width (kHz)?", a: 24.4, tol: 0.01, why: "100 MHz/4096 = 24.4 kHz." },
        { t: "num", q: "FFT processing gain for N = 4096 (dB)?", a: 33.1, tol: 0.01, why: "10 log(2048) = 33.1 dB." },
        { t: "mcq", q: "For coherent sampling with f_s = 1 MS/s and N = 1024, which input frequency is a good choice?", opts: [["31 × (1 MHz/1024) ≈ 30.27 kHz", true, "31 cycles exactly, and 31 is odd and prime."], ["30 kHz", false, "30 kHz × 1.024 ms = 30.72 cycles: not whole, so it leaks."], ["32 × 976.6 Hz", false, "Whole, but 32 shares factors with 1024, so the samples repeat and exercise only a few codes."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is spectral leakage, and how do engineers avoid it?", model: "The DFT treats the record as one period of a repeating signal. If the record doesn't hold a whole number of cycles, the repeated version has a jump at each joint, and that jump spreads energy into many bins. Engineers avoid it either by choosing the input frequency so the record holds a whole number of cycles, coherent sampling, or by applying a window that fades the ends of the record to zero." },
      ]},
    ],
  };

  const p6 = {
    id: "p6", title: "Master it", mins: 30,
    blurb: "Aliases, filters, holds, bits and bins.",
    takeaway: "You can predict aliases, size anti-alias and reconstruction filtering, account for hold droop, compute quantization noise and ENOB, and read and set up an FFT measurement.",
    steps: [
      { k: "check", title: "Problem 1: undersampling on purpose", b: [
        { t: "num", q: "A radio receiver samples a 70 MHz IF signal at 50 MS/s on purpose. Where does it land (MHz)?", a: 20, unit: "MHz", hint: "Subtract multiples of f_s until it's in 0–25 MHz.", why: "70 − 50 = 20 MHz. Deliberate aliasing (‘bandpass sampling’) replaces a mixer, as long as the band is filtered to one Nyquist zone first." },
      ]},
      { k: "check", title: "Problem 2", b: [
        { t: "num", q: "How many bits does an ideal ADC need for SNR ≥ 90 dB?", a: 15, tol: 0, hint: "Solve 6.02N + 1.76 ≥ 90.", why: "N ≥ 14.66 → 15 bits." },
      ]},
      { k: "check", title: "Problem 3", b: [
        { t: "num", q: "An ADC is driven at −6 dBFS instead of full scale. Its ideal 12-bit SNR becomes (dB)?", a: 68, tol: 0.01, why: "Noise is unchanged; signal is 6 dB lower: 74 − 6 = 68 dB." },
      ]},
      { k: "check", title: "Problem 4", b: [
        { t: "num", q: "A DAC at 200 MS/s must output up to 80 MHz. Worst-case hold droop at 80 MHz (dB)?", a: -2.42, tol: 0.03, hint: "sinc(0.4) = sin(0.4π)/(0.4π).", why: "0.951/1.257 = 0.757 → −2.42 dB." },
      ]},
      { k: "check", title: "Problem 5", b: [
        { t: "num", q: "f_s = 100 kS/s, input 30 kHz. Where does the input's 3rd harmonic show up in the FFT (kHz)?", a: 10, unit: "kHz", hint: "The 3rd harmonic is at 90 kHz, above the 50 kHz Nyquist frequency.", why: "|90 − 100| = 10 kHz. In fact every harmonic of 30 kHz folds onto a multiple of 10 kHz (2nd → 40, 4th → 20, 5th → 50), so a spur at, say, 13 kHz can't be a harmonic: look for an outside tone or clock coupling." },
      ]},
      { k: "say", title: "Problem 6: explain it", b: [
        { t: "say", q: "Describe the full chain from an analog signal to digital samples and back, naming what each block protects against.", model: "An analog anti-alias filter removes content above half the sample rate so nothing folds into the band. The sample-and-hold freezes the signal so the quantizer sees a steady value. The quantizer rounds to 2 to the N levels, adding noise of about LSB over root 12, which sets an SNR of 6.02N plus 1.76 dB. On the way back, the DAC holds each value, creating sinc droop and images, and a reconstruction filter removes the images and smooths the steps." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m32", eyebrow: "Math Toolkit · Module 32", title: "Sampling, Aliasing and Quantization",
    intro: `<p>Six parts: sampling and aliasing, the spectrum view (copies and anti-alias filters), the DAC's hold, quantization noise and 6.02N + 1.76, the DFT and FFT measurements, and mastery problems.</p><p>Why a chip designer needs this: every mixed-signal chip has a boundary where analog becomes digital. These are the laws at that border.</p><p class="aside">Before this: Modules 30–31 (Fourier). Pairs with Boylestad Chapter 13 (ADCs and DACs).</p>`,
    after: `<p>Next: Module 33 works entirely with samples, using difference equations and the z-transform, the discrete-time version of Laplace.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <p><b>Nyquist:</b> f &lt; f_s/2. Alias at |f − k f_s| in 0…f_s/2. Sampling copies the spectrum every f_s. Anti-alias filter before the sampler; noise folds too.</p>
      <p><b>Hold:</b> |sinc(f/f_s)| droop (−3.92 dB at f_s/2), ½-sample delay, images at k f_s ± f.</p>
      <div class="eq">LSB = FS/2ᴺ   e_rms = LSB/√12   SNR = 6.02N + 1.76 dB</div>
      <p>ENOB = (SINAD − 1.76)/6.02. −6 dBFS input loses 6 dB. 1 bit = 6 dB.</p>
      <p><b>DFT:</b> X[k] = Σx[n]e^(−j2πkn/N); bins f_s/N; resolution = 1/record length. Off-bin tones leak → window (Hann) or coherent sampling (whole, odd/prime cycles). Floor per bin = −(SNR + 10 log(N/2)) dBFS.</p>`,
  };
  Course.start(window.CHAPTER);
})();
