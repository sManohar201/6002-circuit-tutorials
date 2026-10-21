(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const DEG = 180 / Math.PI;

  const p1 = {
    id: "p1", title: "Radians, frequency and ω", mins: 15,
    blurb: "One trip round the circle is 2π radians. ω counts radians per second.",
    takeaway: "2π rad = 360°, so 1 rad ≈ 57.3° and π rad = 180°. A sine wave is a point going round a circle: one cycle = 2π rad. Frequency f in cycles/s (Hz); period T = 1/f; angular frequency ω = 2πf in rad/s. 60 Hz → ω = 377 rad/s. Calculators must be in the right mode: radians for ωt.",
    steps: [
      { k: "play", title: "Round the circle", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let th = 1;
          function draw() {
            const cx = 90, cy = 100, R = 70, px = cx + R * Math.cos(th), py = cy - R * Math.sin(th);
            const X = (a) => 200 + (a / (2 * Math.PI)) * 300;
            let s = `<circle class="el" cx="${cx}" cy="${cy}" r="${R}" style="fill:none"/><line class="w" x1="${cx}" y1="${cy}" x2="${px}" y2="${py}"/><circle class="nd" cx="${px}" cy="${py}" r="6"/>`;
            s += `<line class="axis" x1="200" y1="${cy}" x2="505" y2="${cy}" style="stroke:var(--muted)"/>`;
            let pts = []; for (let i = 0; i <= 120; i++) { const a = (2 * Math.PI * i) / 120; pts.push(`${X(a).toFixed(1)},${(cy - R * Math.sin(a)).toFixed(1)}`); }
            s += `<polyline class="w" points="${pts.join(" ")}" style="stroke:var(--accent)"/><line class="w" x1="${px}" y1="${py}" x2="${X(th)}" y2="${py}" style="stroke-dasharray:4 4"/><circle class="nd" cx="${X(th)}" cy="${py}" r="6"/>`;
            s += S.t(X(Math.PI), cy + 18, "π") + S.t(X(2 * Math.PI), cy + 18, "2π");
            f.innerHTML = S.svg(520, 200, s, { label: "A point on a circle and the sine wave it traces" });
            ro.innerHTML = readout([["Angle", fmt(th, 3) + " rad = " + fmt(th * DEG, 4) + "°"], ["sin(angle)", fmt(Math.sin(th), 3)]]);
          }
          host.append(f, slider({ id: id + "-t", label: "Angle", min: 0, max: 2 * Math.PI, step: 0.01, value: th, show: (v) => fmt(v, 3) + " rad" }, (v) => { th = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The height of the point is the sine. One lap is one cycle of the wave.</p>`,
      ]},
      { k: "learn", title: "f, T and ω", b: [
        `<div class="two"><div class="tile"><h3>f</h3><p>cycles per second (Hz)</p></div><div class="tile"><h3>T = 1/f</h3><p>seconds per cycle</p></div><div class="tile"><h3>ω = 2πf</h3><p>radians per second</p></div></div>`,
        `<div class="eq">v(t) = V<sub>m</sub> sin(ωt)   with ωt in radians</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "ω for 50 Hz mains? (rad/s)", a: 314.16, unit: "rad/s", tol: 0.005, why: "2π × 50 = 314 rad/s." },
        { t: "num", q: "Period of a 2.5 kHz signal? (µs)", a: 400, unit: "µs", why: "1/2500 s = 400 µs." },
        { t: "num", q: "π/4 rad in degrees?", a: 45, unit: "°", tol: 0.001, why: "180/4 = 45°." },
        { t: "mcq", q: "ω = 6283 rad/s. f?", opts: [["1 kHz", true, "6283/2π = 1000."], ["6283 Hz", false, "That forgets the 2π."], ["39 kHz", false, "That multiplies by 2π instead of dividing."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between f and ω?", model: "Both measure how fast the wave repeats. f counts full cycles per second in hertz; omega counts radians per second, and since one cycle is two pi radians, omega is two pi times f." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Peak, peak-to-peak, rms and average", mins: 20,
    blurb: "Four ways to give a sine's size, and which one each meter or formula means.",
    takeaway: "v = V_m sin(ωt + φ). Peak V_m; peak-to-peak 2V_m; rms V_m/√2 = 0.707V_m (sine only: the dc value giving the same power); full-cycle average 0. Rectified averages: half-wave V_m/π = 0.318V_m, full-wave 2V_m/π = 0.637V_m. Mains '120 V' and '230 V' are rms: peaks 170 V and 325 V.",
    steps: [
      { k: "play", title: "Shape the wave", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let Vm = 10, fr = 1000, ph = 0;
          function draw() {
            const T = 1 / fr;
            f.innerHTML = plot({ x: [0, 2], y: [-22, 22], xt: [0, 0.5, 1, 1.5, 2], yt: [-20, -10, 0, 10, 20], xl: "t (ms)", yl: "v", h: 230, series: [{ f: (x) => Vm * Math.sin(2 * Math.PI * fr * x * 1e-3 + ph / DEG), cls: "s1" }, { f: () => Vm / Math.SQRT2, cls: "s5" }], label: "Sine wave with its rms level dashed" });
            ro.innerHTML = readout([["Peak V_m", fmt(Vm) + " V"], ["Peak-to-peak", fmt(2 * Vm) + " V"], ["rms V_m/√2 (dashed)", fmt(Vm / Math.SQRT2, 4) + " V"], ["Period", si(T, "s", 3)], ["Phase φ", ph + "°"]]);
          }
          host.append(f, slider({ id: id + "-v", label: "V_m", min: 1, max: 20, step: 0.5, value: Vm, show: (v) => v + " V" }, (v) => { Vm = v; draw(); }).el,
            slider({ id: id + "-f", label: "f", min: 500, max: 3000, step: 50, value: fr, show: (v) => si(v, "Hz", 3) }, (v) => { fr = v; draw(); }).el,
            slider({ id: id + "-p", label: "Phase φ", min: -180, max: 180, step: 5, value: ph, show: (v) => v + "°" }, (v) => { ph = v; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "learn", title: "Averages of rectified waves", b: [
        fig(plot({ x: [0, 2], y: [0, 1.1], xt: [0, 1, 2], xtf: (v) => (v ? v + "T" : "0"), yt: [0.318, 0.637, 1], ytf: (v) => (v === 1 ? "V_m" : fmt(v) + "V_m"), h: 190, padL: 84, series: [{ f: (x) => Math.abs(Math.sin(2 * Math.PI * x)), cls: "s2" }, { f: (x) => Math.max(0, Math.sin(2 * Math.PI * x)), cls: "s1" }, { f: () => 2 / Math.PI, cls: "s5" }, { f: () => 1 / Math.PI, cls: "s4" }], label: "Half-wave and full-wave rectified sine with their averages" })),
        `<div class="two"><div class="tile"><h3>Half-wave</h3><div class="eq">V<sub>dc</sub> = V<sub>m</sub>/π = 0.318V<sub>m</sub></div></div><div class="tile"><h3>Full-wave</h3><div class="eq">V<sub>dc</sub> = 2V<sub>m</sub>/π = 0.637V<sub>m</sub></div></div></div>`,
        `<p class="aside"><a href="14-integrals.html">Module 14</a> shows where these come from (area under one hump).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A transformer gives 24 V rms. Peak?", a: 33.94, unit: "V", tol: 0.005, why: "24 × √2 = 33.9 V." },
        { t: "num", q: "A full-wave rectifier, peak 15 V (ideal diodes). Average output?", a: 9.55, unit: "V", tol: 0.01, why: "0.637 × 15 = 9.55 V." },
        { t: "mcq", q: "A scope shows 8 V peak-to-peak. rms?", opts: [["2.83 V", true, "V_m = 4 V; 4/√2 = 2.83 V."], ["5.66 V", false, "That uses 8 V as the peak."], ["8 V", false, "rms is always below the peak for a sine."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does an rms value mean physically?", model: "It's the steady dc voltage that would put the same average power into a resistor. For a sine wave it's the peak divided by root two." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Phase and right triangles", mins: 20,
    blurb: "A phase angle is a time shift. Triangles turn R and X into a size and an angle.",
    takeaway: "Phase φ in sin(ωt + φ) shifts the wave earlier by Δt = φ/ω (φ in radians), i.e. a fraction φ/360° of a period. Right triangle with sides a (adjacent) and b (opposite): hypotenuse √(a² + b²), angle tan⁻¹(b/a). For a resistance R and reactance X: |Z| = √(R² + X²), θ = tan⁻¹(X/R). 3-4-5: |Z| = 5, θ = 53.1°.",
    steps: [
      { k: "learn", title: "Phase is a time shift", b: [
        fig(plot({ x: [0, 1.5], y: [-1.2, 1.2], xt: [0, 0.5, 1, 1.5], xtf: (v) => (v ? v + "T" : "0"), yt: [-1, 0, 1], h: 180, series: [{ f: (x) => Math.sin(2 * Math.PI * x), cls: "s2" }, { f: (x) => Math.sin(2 * Math.PI * x + Math.PI / 4), cls: "s1" }], texts: [{ x: 0.02, y: 1.05, s: "+45° leads by T/8" }], label: "Two sines, one leading by 45 degrees" })),
        `<div class="eq">Δt = (φ/360°) × T</div>`,
        `<p class="aside">"Leads" means its peak comes earlier. A capacitor's current leads its voltage by 90°.</p>`,
      ]},
      { k: "play", title: "R, X and the triangle", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let R = 3, X = 4;
          function draw() {
            const k = 34, x0 = 40, y0 = 200, Z = Math.hypot(R, X), th = Math.atan2(X, R) * DEG;
            let s = `<polygon points="${x0},${y0} ${x0 + R * k},${y0} ${x0 + R * k},${y0 - X * k}" style="fill:var(--accent-soft);stroke:var(--accent);stroke-width:3"/>`;
            s += S.t(x0 + (R * k) / 2, y0 + 18, "R = " + fmt(R) + " kΩ") + S.t(x0 + R * k + 8, y0 - (X * k) / 2, "X = " + fmt(X) + " kΩ", { a: "start" }) + S.t(x0 + (R * k) / 2 - 14, y0 - (X * k) / 2 - 8, "|Z|", { a: "end", cls: "lab" }) + S.t(x0 + 34, y0 - 8, "θ", { a: "start", cls: "lab" });
            f.innerHTML = S.svg(520, 225, s, { label: "Impedance triangle" });
            ro.innerHTML = readout([["|Z| = √(R² + X²)", fmt(Z, 4) + " kΩ"], ["θ = tan⁻¹(X/R)", fmt(th, 4) + "°"]]);
          }
          host.append(f, slider({ id: id + "-r", label: "R", min: 0.5, max: 8, step: 0.5, value: R, show: (v) => v + " kΩ" }, (v) => { R = v; draw(); }).el,
            slider({ id: id + "-x", label: "X", min: 0.5, max: 5, step: 0.5, value: X, show: (v) => v + " kΩ" }, (v) => { X = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Equal R and X give 45° and |Z| = 1.414R. That's the condition at a cutoff frequency.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "R = 1.2 kΩ, X = 0.5 kΩ. |Z| in kΩ?", a: 1.3, unit: "kΩ", why: "√(1.44 + 0.25) = 1.3 kΩ." },
        { t: "num", q: "Its angle θ?", a: 22.62, unit: "°", tol: 0.01, why: "tan⁻¹(0.5/1.2) = 22.6°." },
        { t: "num", q: "At 1 kHz, a 30° phase shift is what time shift? (µs)", a: 83.3, unit: "µs", tol: 0.01, why: "30/360 × 1 ms = 83.3 µs." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you turn a phase angle into a time delay?", model: "The phase angle as a fraction of 360 degrees is the same fraction of one period. So the time shift is the angle over 360 times the period, or the angle in radians divided by omega." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m10", eyebrow: "Math Toolkit · Module 10", title: "Sinusoids",
    intro: `<p>Three parts: radians and ω, the sizes of a sine wave, and phase with right triangles. Then 6.002's <a href="../chapters/appB-trig.html">Appendix B</a> (identities) and <a href="../chapters/appC-complex-numbers.html">Appendix C</a> (complex numbers) take you the rest of the way to phasors.</p>`,
    after: `<p>Next in the toolkit: Module 11 (trig identities) and Module 12 (complex numbers), both 6.002 appendices.</p>`,
    parts: [p1, p2, p3],
    summary: `
      <p>2π rad = 360°, 1 rad = 57.3°. T = 1/f, ω = 2πf. v = V<sub>m</sub> sin(ωt + φ), ωt in radians.</p>
      <p>Peak V<sub>m</sub> · peak-to-peak 2V<sub>m</sub> · rms V<sub>m</sub>/√2 · half-wave avg 0.318V<sub>m</sub> · full-wave avg 0.637V<sub>m</sub>.</p>
      <div class="eq">Δt = (φ/360°)T     |Z| = √(R² + X²)     θ = tan⁻¹(X/R)</div>`,
  };
  Course.start(window.CHAPTER);
})();
