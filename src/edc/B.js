(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const ch = (n, file, part, where, html) => `<p class="aside">${html} <a href="${file}#${part}">Boylestad Chapter ${n}, ${where} →</a></p>`;
  const SQ3 = Math.sqrt(3), DEG = 180 / Math.PI;

  const p1 = {
    id: "p1", title: "Ripple of a rectified wave", mins: 20,
    blurb: "Where 0.385V_m and 0.308V_m come from.",
    takeaway: "Ripple r = V_r(rms)/V_dc. The ac part is v − V_dc, and its rms works out to V_r(rms) = √(V²(rms) − V²_dc), where V(rms) is the rms of the whole waveform. Half-wave: V(rms) = V_m/2, V_dc = V_m/π, so V_r(rms) = V_m√(¼ − 1/π²) = 0.385V_m. Full-wave: V(rms) = V_m/√2, V_dc = 2V_m/π, so V_r(rms) = V_m√(½ − 4/π²) = 0.308V_m.",
    steps: [
      { k: "learn", title: "The rms of the ac part", b: [
        `<div class="eq">V<sub>r</sub>(rms) = √(V²(rms) − V<sub>dc</sub>²)</div>`,
        `<p>Square the ac part (v − V<sub>dc</sub>)² = v² − 2vV<sub>dc</sub> + V<sub>dc</sub>², average it: V²(rms) − 2V<sub>dc</sub>² + V<sub>dc</sub>². The middle and last terms combine to −V<sub>dc</sub>².</p>`,
        `<div class="two"><div class="tile"><h3>Half-wave</h3><div class="eq">V<sub>m</sub>√(¼ − 1/π²) = 0.385V<sub>m</sub></div></div><div class="tile"><h3>Full-wave</h3><div class="eq">V<sub>m</sub>√(½ − 4/π²) = 0.308V<sub>m</sub></div></div></div>`,
        ch(15, "15-power-supplies.html", "p1", "Part 1", "Where these are used."),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Full-wave: √(½ − 4/π²)?", a: 0.3078, tol: 0.005, hint: "4/π² = 0.4053.", why: "0.308." },
        { t: "num", q: "Ripple r of a full-wave rectified signal in %?", a: 48.3, unit: "%", tol: 0.01, hint: "0.308/0.637.", why: "48%." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does full-wave rectification have less ripple than half-wave?", model: "Full-wave doubles the dc level, because both halves of the sine contribute, while the total rms rises only by root two. The ac part left over, root of rms squared minus dc squared, is therefore smaller compared with the dc." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "The capacitor filter's triangle", mins: 20,
    blurb: "Model the ripple as a triangle and the 2.4 I_dc/C rule drops out.",
    takeaway: "Triangular ripple of peak-to-peak V_r(p-p): V_dc = V_m − V_r(p-p)/2; V_r(rms) = V_r(p-p)/(2√3). Discharge for time T₂ at about I_dc: V_r(p-p) = I_dcT₂/C. From the triangle's geometry T₂ = (V_dc/V_m)(T/2), so V_r(p-p) = I_dcV_dc/(2fCV_m) and V_r(rms) = I_dcV_dc/(4√3fCV_m). With V_dc ≈ V_m and f = 60 Hz: V_r(rms) ≈ I_dc/(4√3 × 60 × C) = 2.4I_dc/C (mA, µF).",
    steps: [
      { k: "learn", title: "Triangle model", b: [
        fig(plot({ x: [0, 2], y: [0, 1.1], xt: [0, 1, 2], xtf: (v) => (v === 1 ? "T/2" : v === 2 ? "T" : "0"), yt: [0.8, 1], ytf: (v) => (v === 1 ? "V_m" : "V_min"), xl: "t", h: 200, series: [{ pts: [[0, 1], [0.8, 0.8], [1, 1], [1.8, 0.8], [2, 1]], cls: "s1" }], texts: [{ x: 0.25, y: 0.75, s: "T_2: discharge" }], label: "Triangular ripple approximation" })),
        `<div class="eq">V<sub>r</sub>(p-p) = I<sub>dc</sub>T<sub>2</sub>/C    V<sub>r</sub>(rms) = V<sub>r</sub>(p-p)/(2√3)    V<sub>dc</sub> = V<sub>m</sub> − V<sub>r</sub>(p-p)/2</div>`,
        `<div class="eq">V<sub>r</sub>(rms) = I<sub>dc</sub>V<sub>dc</sub>/(4√3 fCV<sub>m</sub>) ≈ 2.4I<sub>dc</sub>/C (mA, µF, V<sub>dc</sub> ≈ V<sub>m</sub>)</div>`,
        `<p class="aside">So the lowest point is V<sub>m</sub> − V<sub>r</sub>(p-p) = V<sub>m</sub> − 2√3V<sub>r</sub>(rms): the check used in the Chapter 15 regulator lab.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "1/(4√3 × 60), in units that make I_dc in mA and C in µF give volts?", a: 2.406, tol: 0.005, hint: "× 1000 for mA/µF.", why: "2.41: the '2.4'." },
        { t: "num", q: "Triangle ripple of 3 V peak-to-peak. V_r(rms)?", a: 0.866, unit: "V", tol: 0.01, hint: "÷ 2√3.", why: "0.866 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Where does the '2.4' in V_r(rms) = 2.4 I_dc/C come from?", model: "From treating the ripple as a triangle. The capacitor discharges at the load current for about half a line period, giving the peak-to-peak ripple; a triangle's rms is its peak-to-peak over two root three. Putting in 60 hertz and milliamp and microfarad units gives about 2.4." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Ripple, dc level and diode current", mins: 20,
    blurb: "One ripple figure fixes V_dc/V_m, the conduction angle and the peak diode current.",
    takeaway: "V_m/V_dc = 1 + √3r (half- or full-wave capacitor filter); 5% ripple gives V_dc = 0.92V_m; V_dc stays within 10% of V_m for r ≤ 6.5% (the light-load border). V_r(rms)/V_m = r/(1 + √3r) ≈ r at light load. Conduction starts at θ₁ = sin⁻¹[(1 − √3r)/(1 + √3r)] and stops at θ₂ = π − tan⁻¹[0.907/(r(1 + √3r))]; conduction angle θ_c = θ₂ − θ₁. I_peak/I_dc = 180°/θ_c (full-wave), 360°/θ_c (half-wave): low ripple means short conduction and big current spikes.",
    steps: [
      { k: "play", title: "Pick a ripple", b: [
        (host, id) => {
          const ro = el(`<div></div>`), f = el(`<div class="fig"></div>`);
          let r = 0.05;
          function draw() {
            const t1 = Math.asin((1 - SQ3 * r) / (1 + SQ3 * r)) * DEG, t2 = 180 - Math.atan(0.907 / (r * (1 + SQ3 * r))) * DEG, tc = t2 - t1;
            f.innerHTML = plot({ x: [0, 25], y: [0.6, 1], xt: [0, 5, 6.5, 10, 15, 20, 25], xtf: (v) => fmt(v, 2), yt: [0.6, 0.7, 0.8, 0.9, 1], xl: "%r", yl: "V_dc/V_m", h: 200, series: [{ f: (x) => 1 / (1 + SQ3 * x / 100), cls: "s1" }], marks: [{ x: r * 100, y: 1 / (1 + SQ3 * r) }], label: "V_dc over V_m against percent ripple" });
            ro.innerHTML = readout([["V<sub>dc</sub>/V<sub>m</sub> = 1/(1 + √3r)", fmt(1 / (1 + SQ3 * r), 4)], ["V<sub>r</sub>(rms)/V<sub>m</sub> = r/(1 + √3r)", fmt(r / (1 + SQ3 * r), 4)], ["θ<sub>1</sub> / θ<sub>2</sub>", fmt(t1, 4) + "° / " + fmt(t2, 4) + "°"], ["Conduction angle θ<sub>c</sub>", fmt(tc, 4) + "°"], ["I<sub>peak</sub>/I<sub>dc</sub> full-wave / half-wave", fmt(180 / tc, 3) + " / " + fmt(360 / tc, 3)]]);
          }
          host.append(f, slider({ id: id + "-r", label: "Ripple r", min: 0.005, max: 0.25, step: 0.0025, value: r, show: (v) => fmt(v * 100, 3) + "%" }, (v) => { r = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The table beside the book's Fig. B.5 lists somewhat smaller conduction angles than these formulas give (34.5° vs 36.2° at 5%); the trend is the same.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "r = 5%. V_dc/V_m?", a: 0.9203, tol: 0.005, hint: "1/(1 + √3 × 0.05).", why: "0.920." },
        { t: "num", q: "r = 5%, full-wave: I_peak/I_dc from the formulas?", a: 4.969, tol: 0.01, hint: "θ_c = 93.43° − 57.20°.", why: "180/36.2 = 4.97." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does lower ripple mean larger peak diode current?", model: "Lower ripple means the capacitor voltage barely drops between peaks, so the rectified voltage only exceeds it for a short time near each peak. The diodes conduct over a smaller angle but must still deliver the same average current, so the current during that short burst is larger." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edcB", eyebrow: "Boylestad · Appendix B", title: "Ripple Factor and Voltage Calculations",
    intro: `<p>Three short parts: deriving the rectifier ripple figures, the capacitor-filter triangle model, and how ripple sets V<sub>dc</sub>, the conduction angle and peak diode current.</p><p>The math behind Chapter 15.</p>`,
    after: `<p>There are no problems for the appendices. Use this with the Chapter 15 problems.</p>`,
    parts: [p1, p2, p3],
    summary: `
      <div class="eq">V<sub>r</sub>(rms) = √(V²(rms) − V<sub>dc</sub>²)    half-wave 0.385V<sub>m</sub>    full-wave 0.308V<sub>m</sub></div>
      <div class="eq">V<sub>r</sub>(p-p) = I<sub>dc</sub>T<sub>2</sub>/C    V<sub>r</sub>(rms) = V<sub>r</sub>(p-p)/(2√3) = I<sub>dc</sub>V<sub>dc</sub>/(4√3fCV<sub>m</sub>)    V<sub>m</sub>/V<sub>dc</sub> = 1 + √3r    V<sub>r</sub>(rms)/V<sub>m</sub> = r/(1 + √3r)</div>
      <div class="eq">θ<sub>1</sub> = sin⁻¹[(1 − √3r)/(1 + √3r)]    θ<sub>2</sub> = π − tan⁻¹[0.907/(r(1 + √3r))]    I<sub>p</sub>/I<sub>dc</sub> = 180°/θ<sub>c</sub> (FW), 360°/θ<sub>c</sub> (HW)</div>`,
  };
  Course.start(window.CHAPTER);
})();
