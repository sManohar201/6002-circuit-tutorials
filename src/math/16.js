(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const DEG = 180 / Math.PI;
  const L10 = Math.log10;
  const xtLog = (a, b) => { const t = []; for (let k = a; k <= b; k++) t.push(k); return t; };
  const hz = (v) => ["1", "10", "100", "1k", "10k", "100k", "1M", "10M"][v];

  const p1 = {
    id: "p1", title: "H(jω): output over input", mins: 20,
    blurb: "A transfer function is a complex ratio. Its size is the gain, its angle is the phase shift.",
    takeaway: "H(jω) = V_out/V_in as phasors. RC low-pass: H = 1/(1 + jωRC) = 1/(1 + jf/f_c) with f_c = 1/(2πRC). |H| = 1/√(1 + (f/f_c)²); ∠H = −tan⁻¹(f/f_c). At f = f_c: |H| = 0.707 (−3 dB) and −45°. Ten times above f_c: |H| ≈ 0.1 (−20 dB), angle ≈ −84°. Size and angle come from the complex-number rules: divide magnitudes, subtract angles.",
    steps: [
      { k: "learn", title: "A divider with an impedance", b: [
        `<p>An RC low-pass is a voltage divider with Z<sub>C</sub> = 1/(jωC) at the bottom:</p>`,
        `<div class="eq">H = Z<sub>C</sub>/(R + Z<sub>C</sub>) = 1/(1 + jωRC) = 1/(1 + jf/f<sub>c</sub>)</div>`,
        `<div class="two"><div class="tile"><h3>Size</h3><div class="eq">|H| = 1/√(1 + (f/f<sub>c</sub>)²)</div></div><div class="tile"><h3>Angle</h3><div class="eq">∠H = −tan⁻¹(f/f<sub>c</sub>)</div></div></div>`,
        `<p class="aside">The bottom is a right triangle with sides 1 and f/f<sub>c</sub> (<a href="10-sinusoids.html">Module 10</a>, Part 3). Complex numbers: <a href="../chapters/appC-complex-numbers.html">6.002 Appendix C</a>.</p>`,
      ]},
      { k: "play", title: "Sweep the frequency", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let r = 1;
          function draw() {
            const m = 1 / Math.sqrt(1 + r * r), ph = -Math.atan(r) * DEG;
            f.innerHTML = plot({ x: [-2, 2], y: [-45, 5], xt: [-2, -1, 0, 1, 2], xtf: (v) => (v ? "×" + fmt(Math.pow(10, v)) : "f_c"), yt: [-40, -30, -20, -10, 0], xl: "f", yl: "|H| dB", h: 230, series: [{ f: (x) => -10 * L10(1 + Math.pow(10, 2 * x)), cls: "s1" }], marks: [{ x: L10(r), y: 20 * L10(m) }], label: "Low-pass magnitude in dB against frequency" });
            ro.innerHTML = readout([["f/f_c", fmt(r, 3)], ["|H|", fmt(m, 3) + " = " + fmt(20 * L10(m), 3) + " dB"], ["∠H", fmt(ph, 3) + "°"]]);
          }
          host.append(f, slider({ id: id + "-r", label: "f / f_c", min: 0.01, max: 100, log: true, value: r, show: (v) => fmt(v, 3) }, (v) => { r = v; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "R = 10 kΩ, C = 10 nF. f_c? (Hz)", a: 1591.5, unit: "Hz", tol: 0.01, why: "1/(2π × 10⁻⁴) = 1.59 kHz." },
        { t: "num", q: "At f = 3f_c, |H| in dB?", a: -10, unit: "dB", tol: 0.01, hint: "−10 log(1 + 9).", why: "−10 dB." },
        { t: "num", q: "And the phase there? (degrees)", a: -71.57, unit: "°", tol: 0.01, why: "−tan⁻¹ 3 = −71.6°." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What happens at the cutoff frequency of an RC low-pass, and why?", model: "At cutoff the capacitor's reactance equals R, so the two parts of 1 plus j f over f c are equal. The magnitude becomes one over root two, which is minus 3 dB or half power, and the phase is minus 45 degrees." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Straight-line asymptotes", mins: 20,
    blurb: "Draw the Bode plot with a ruler: flat, a corner, then −20 dB per decade.",
    takeaway: "Low-pass asymptotes: 0 dB below f_c, a −20 dB/decade line above it; the true curve is 3 dB below the corner and within 1 dB one octave away. Phase: 0° below 0.1f_c, −90° above 10f_c, a straight line through −45° at f_c in between. High-pass H = (jf/f_c)/(1 + jf/f_c) is the mirror image: +20 dB/decade below f_c, flat above, phase from +90° down to 0°.",
    steps: [
      { k: "play", title: "Exact vs ruler", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), g = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let hp = 0, fc = 2;
          function draw() {
            const mag = (x) => { const r = Math.pow(10, x - fc); return hp ? 20 * L10(r) - 10 * L10(1 + r * r) : -10 * L10(1 + r * r); };
            const asy = (x) => (hp ? Math.min(0, 20 * (x - fc)) : Math.min(0, -20 * (x - fc)));
            const ph = (x) => (hp ? 90 : 0) - Math.atan(Math.pow(10, x - fc)) * DEG;
            const pha = (x) => (hp ? 90 : 0) - (x < fc - 1 ? 0 : x > fc + 1 ? 90 : 45 * (x - fc + 1));
            f.innerHTML = plot({ x: [0, 5], y: [-50, 5], xt: xtLog(0, 5), xtf: hz, yt: [-40, -20, 0], xl: "f (Hz)", yl: "dB", h: 210, series: [{ f: asy, cls: "s4" }, { f: mag, cls: "s1" }], label: "Magnitude: exact (solid) and asymptotes (dashed)" });
            g.innerHTML = plot({ x: [0, 5], y: [-100, 100], xt: xtLog(0, 5), xtf: hz, yt: [-90, -45, 0, 45, 90], xl: "f (Hz)", yl: "phase °", h: 180, series: [{ f: pha, cls: "s4" }, { f: ph, cls: "s2" }], label: "Phase: exact (solid) and straight-line approximation (dashed)" });
            ro.innerHTML = readout([["f_c", si(Math.pow(10, fc), "Hz", 3)], ["Error at the corner", "3 dB"]]);
          }
          host.append(toggle(["Low-pass", "High-pass"], (i) => { hp = i; draw(); }), f, g, slider({ id: id + "-c", label: "f_c", min: 1, max: 4, step: 0.05, value: fc, show: (v) => si(Math.pow(10, v), "Hz", 3) }, (v) => { fc = v; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "High-pass, f_c = 100 Hz. Asymptotic gain at 10 Hz? (dB)", a: -20, unit: "dB", tol: 0.001, why: "One decade below the corner: −20 dB (exact −20.04)." },
        { t: "num", q: "Same filter: asymptotic gain at 1 Hz?", a: -40, unit: "dB", tol: 0.001, why: "Two decades below: −40 dB." },
        { t: "mcq", q: "Low-pass, f_c = 5 kHz. Straight-line phase at 500 Hz?", opts: [["0°", true, "A decade below the corner, the phase line hasn't started (exact −5.7°)."], ["−45°", false, "That's at f_c."], ["−90°", false, "That's a decade above."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you sketch a single-pole low-pass Bode magnitude plot without calculating?", model: "Draw a flat line at the passband gain up to the corner frequency, then a line falling 20 dB per decade from the corner. The real curve rounds the corner, sitting 3 dB below it right at f c." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Several corners: add in dB", mins: 20,
    blurb: "Multiply transfer functions, so add their Bode plots. A whole amplifier from three pieces.",
    takeaway: "When H = H₁·H₂·H₃, the dB magnitudes add and the phases add. An amplifier's response = midband gain (flat, A_mid dB) + a high-pass at f_L + a low-pass at f_H. Bandwidth ≈ f_H − f_L (≈ f_H when f_L ≪ f_H). Two corners at the same frequency: −6 dB there and −40 dB/decade beyond.",
    steps: [
      { k: "play", title: "Build an amplifier", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let A = 40, fl = 2, fh = 4.7;
          function draw() {
            const mag = (x) => { const a = Math.pow(10, fl - x), b = Math.pow(10, x - fh); return A - 10 * L10(1 + a * a) - 10 * L10(1 + b * b); };
            const asy = (x) => A - Math.max(0, 20 * (fl - x)) - Math.max(0, 20 * (x - fh));
            f.innerHTML = plot({ x: [0, 7], y: [-10, 60], xt: xtLog(0, 7), xtf: hz, yt: [0, 20, 40, 60], xl: "f (Hz)", yl: "dB", h: 240, series: [{ f: asy, cls: "s4" }, { f: mag, cls: "s1" }, { f: () => A - 3, cls: "s5" }], label: "Amplifier magnitude: midband, low cutoff and high cutoff" });
            const FL = Math.pow(10, fl), FH = Math.pow(10, fh);
            ro.innerHTML = readout([["f_L / f_H", si(FL, "Hz", 3) + " / " + si(FH, "Hz", 3)], ["Bandwidth f_H − f_L", si(FH - FL, "Hz", 3)], ["Gain at f_H (exact)", fmt(mag(fh), 3) + " dB"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "Midband gain", min: 0, max: 60, step: 1, value: A, show: (v) => v + " dB" }, (v) => { A = v; draw(); }).el,
            slider({ id: id + "-l", label: "f_L", min: 0.5, max: 3.5, step: 0.05, value: fl, show: (v) => si(Math.pow(10, v), "Hz", 3) }, (v) => { fl = v; draw(); }).el,
            slider({ id: id + "-h", label: "f_H", min: 3.5, max: 6.5, step: 0.05, value: fh, show: (v) => si(Math.pow(10, v), "Hz", 3) }, (v) => { fh = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The dotted line is 3 dB below midband. Where the curve crosses it are the cutoff frequencies.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A_mid = 46 dB, f_L = 80 Hz, f_H = 120 kHz. Bandwidth? (kHz)", a: 119.92, unit: "kHz", tol: 0.002, why: "120 000 − 80 = 119 920 Hz ≈ 120 kHz." },
        { t: "num", q: "Same amplifier: gain one decade above f_H, using asymptotes? (dB)", a: 26, unit: "dB", tol: 0.001, why: "46 − 20 = 26 dB." },
        { t: "mcq", q: "Two identical stages in cascade, each with f_H = 100 kHz. At 100 kHz the total is…", opts: [["6 dB below midband", true, "Each stage is −3 dB there, and dB add."], ["3 dB below", false, "Two stages, two lots of 3 dB."], ["Unchanged", false, "Both stages are at their corners."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can you build an amplifier's Bode plot by adding simple pieces?", model: "The overall transfer function is the product of the midband gain and each cutoff's factor. Taking the log turns that product into a sum, so in decibels each piece's curve just adds, and the phases add too." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m16", eyebrow: "Math Toolkit · Module 16", title: "Transfer Functions and Bode Plots",
    intro: `<p>Three parts: what H(jω) means, drawing Bode plots with straight lines, and adding pieces for a whole amplifier. Needs <a href="09-decibels.html">Module 9</a> (dB, log axes) and complex numbers (<a href="../chapters/appC-complex-numbers.html">6.002 Appendix C</a>).</p>`,
    after: `<p>For any frequency-response question: find each corner, draw the asymptotes, then fix up the 3 dB at each corner if you need exact values.</p>`,
    parts: [p1, p2, p3],
    summary: `
      <div class="eq">H = 1/(1 + jf/f<sub>c</sub>)     f<sub>c</sub> = 1/(2πRC)     |H| = 1/√(1 + (f/f<sub>c</sub>)²)     ∠H = −tan⁻¹(f/f<sub>c</sub>)</div>
      <p>At f<sub>c</sub>: −3 dB, −45°. Asymptotes: flat then −20 dB/decade; phase 0° → −90° from 0.1f<sub>c</sub> to 10f<sub>c</sub>. High-pass: mirror image.</p>
      <p>Products → add dB and phases. Amplifier: A<sub>mid</sub> + high-pass at f<sub>L</sub> + low-pass at f<sub>H</sub>; BW = f<sub>H</sub> − f<sub>L</sub>. Two equal corners: −6 dB, −40 dB/decade.</p>`,
  };
  Course.start(window.CHAPTER);
})();
