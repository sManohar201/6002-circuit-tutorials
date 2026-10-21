(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const ch = (n, file, part, where, html) => `<p class="aside">${html} <a href="${file}#${part}">Boylestad Chapter ${n}, ${where} →</a></p>`;
  const par = (...r) => 1 / r.reduce((a, x) => a + 1 / x, 0);
  const ohm = (r) => si(r, "Ω");
  const hz = (f) => si(f, "Hz", 3);
  const L10 = Math.log10, TAU = 2 * Math.PI;
  const db = (x) => 20 * L10(x);
  /* First-order factors. lo: high-pass corner fc; hi: low-pass corner fc. Magnitudes. */
  const lo = (fc) => (f) => 1 / Math.sqrt(1 + Math.pow(fc / f, 2));
  const hi = (fc) => (f) => 1 / Math.sqrt(1 + Math.pow(f / fc, 2));
  /* A dB plot against log frequency. x is log10(f). */
  function bode(o) {
    return plot({ x: o.x || [0, 8], y: o.y || [-40, 5], xt: o.xt || [0, 1, 2, 3, 4, 5, 6, 7, 8], xtf: (v) => si(Math.pow(10, v), "", 2).trim() + (o.unitTicks === false ? "" : ""), yt: o.yt || [-40, -30, -20, -10, -3, 0], xl: "f (Hz, log scale)", yl: o.yl || "gain (dB)", series: o.series, marks: o.marks || [], texts: o.texts || [], areas: o.areas || [], label: o.label || "Gain in dB against frequency on a log scale" });
  }
  const curve = (g, cls, from, to) => ({ f: (x) => db(g(Math.pow(10, x))), cls: cls || "s1", from, to, n: 400 });

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Math boost: logarithms", mins: 25,
    blurb: "The tool behind every frequency plot. What a log is, its rules, and how to read a log axis.",
    takeaway: "If a = bˣ then x = log_b a: the log is the power. Common log (base 10, 'log' key) and natural log (base e ≈ 2.718, 'ln' key): ln a = 2.3 log a. log 1 = 0; log(a/b) = log a − log b; log(1/b) = −log b (so numbers below 1 have negative logs); log(ab) = log a + log b. Antilog: 10ˣ or eˣ. A log scale gives each power of ten the same width: 2 sits about 30% along a decade, 3 about 48%, 5 about 70%. Reading between ticks: value = 10ˣ × 10^(d₁/d₂), where d₁ is the distance from the decade's start and d₂ the decade's width.",
    steps: [
      { k: "learn", title: "A log is a power", b: [
        `<div class="eq">a = bˣ    ⟺    x = log<sub>b</sub> a</div>`,
        `<p>"What power of 10 gives 10 000?" Four: log<sub>10</sub> 10 000 = 4. Base 10 is the <b>common</b> log (the <b>log</b> key). Base e ≈ 2.718 is the <b>natural</b> log (the <b>ln</b> key).</p>`,
        `<div class="eq">ln a = 2.3 log<sub>10</sub> a</div>`,
        `<div class="two"><div class="tile"><h3>log 1 = 0</h3><p>10⁰ = 1.</p></div><div class="tile"><h3>log(ab) = log a + log b</h3><p>Multiplying becomes adding.</p></div><div class="tile"><h3>log(a/b) = log a − log b</h3><p>Dividing becomes subtracting.</p></div><div class="tile"><h3>log(1/b) = −log b</h3><p>Numbers below 1 have negative logs.</p></div></div>`,
      ]},
      { k: "check", title: "Calculator practice", b: [
        { t: "num", q: "log₁₀ 500?", a: 2.699, tol: 0.002, hint: "Use the log key. Expect between 2 and 3.", why: "2.699: 500 is between 10² and 10³." },
        { t: "num", q: "ln 500?", a: 6.215, tol: 0.002, hint: "The ln key.", why: "6.215 = 2.3 × 2.699, near enough." },
        { t: "num", q: "log₁₀ 0.02?", a: -1.699, tol: 0.002, hint: "Negative, because 0.02 < 1.", why: "−1.699 = log 2 − 2." },
        { t: "num", q: "Antilog: 2.3 = log₁₀ a. What's a?", a: 199.5, tol: 0.003, hint: "a = 10^2.3 (the 10ˣ key).", why: "199.5." },
      ]},
      { k: "play", title: "Reading a log axis", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let pos = 0.6;
          function draw() {
            const x0 = 40, w = 160;
            let s = `<line class="w" x1="${x0}" y1="60" x2="${x0 + 3 * w}" y2="60"/>`;
            for (let d = 0; d < 3; d++) {
              for (let k = 1; k <= 10; k++) { const x = x0 + d * w + L10(k) * w, big = k === 1 || k === 10; s += `<line class="w" x1="${x}" y1="${big ? 44 : 52}" x2="${x}" y2="60" style="stroke-width:${big ? 2.5 : 1.5}"/>`; if (k === 1 || k === 2 || k === 5) s += S.t(x, 80, si(k * Math.pow(10, d + 1), "", 1).trim(), { cls: "s m" }); }
            }
            s += S.t(x0 + 3 * w, 80, "10k", { cls: "s m" });
            const xp = x0 + w + pos * w, val = 100 * Math.pow(10, pos);
            s += `<circle class="mk" cx="${xp}" cy="60" r="7"/>` + `<line x1="${x0 + w}" y1="28" x2="${xp}" y2="28" style="stroke:var(--accent);stroke-width:2"/>` + S.t((x0 + w + xp) / 2, 22, "d₁", { cls: "a s" }) + `<line x1="${x0 + w}" y1="100" x2="${x0 + 2 * w}" y2="100" style="stroke:var(--cool);stroke-width:2"/>` + S.t(x0 + 1.5 * w, 116, "d₂ (one decade)", { cls: "c s" });
            f.innerHTML = S.svg(560, 125, s, { max: 560, label: "A log axis from 10 to 10 000 with a point between 100 and 1000" });
            ro.innerHTML = readout([["d₁/d₂", fmt(pos, 3)], ["Value = 10² × 10^(d₁/d₂)", fmt(val, 4)]]);
          }
          host.append(f, slider({ id: id + "-p", label: "Where the point sits in the 100–1000 decade (d₁/d₂)", min: 0, max: 1, step: 0.01, value: pos, show: (v) => fmt(v, 2) }, (v) => { pos = v; draw(); }).el, ro);
          draw();
        },
        `<p>On a log axis each power of ten gets the same width. Inside a decade the ticks bunch up: 2 is about 30% of the way (log 2 ≈ 0.3), 3 about 48%, 5 about 70%.</p>`,
        `<div class="eq">value = 10ˣ × 10^(d₁/d₂)</div>`,
        { t: "num", q: "A point sits 60% of the way across the 100-to-1000 decade. Its value?", a: 398.1, tol: 0.005, hint: "10² × 10^0.6.", why: "100 × 3.981 = 398." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do engineers plot frequency on a log scale?", model: "Because the frequencies of interest span many powers of ten, from a few hertz to megahertz. A log scale gives each decade the same width, so the whole range fits on one graph and the low end isn't squashed into nothing." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Decibels", mins: 25,
    blurb: "A log ratio of powers. 10 log for power, 20 log for voltage, and cascades just add.",
    takeaway: "Bel: log₁₀(P₂/P₁); decibel: G_dB = 10 log₁₀(P₂/P₁). Always a comparison with a reference. dBm: reference 1 mW in 600 Ω (that's 0.775 V rms). For voltages across the same resistance, P ∝ V², so G_dB = 20 log₁₀(V₂/V₁) (often used even when resistances differ, then strictly 'voltage gain in dB'). Landmarks: ×2 = 6 dB, ×0.707 = −3 dB, ×10 = 20 dB, ×1000 = 60 dB; 50 dB or more is a high voltage gain. Cascades: dB gains add. Back from dB: A_v = 10^(dB/20).",
    steps: [
      { k: "learn", title: "From bels to decibels", b: [
        `<p>Loudness follows ratios, not differences: 4 W → 16 W sounds like one step, 4 W → 64 W like two. So power levels are compared with a log:</p>`,
        `<div class="eq">G<sub>dB</sub> = 10 log<sub>10</sub>(P<sub>2</sub>/P<sub>1</sub>)    (10 dB = 1 bel, after Alexander Graham Bell)</div>`,
        `<div class="key">A decibel is always a <b>comparison</b> with a reference. "dBm" means the reference is 1 mW, in 600 Ω (an audio line's impedance).</div>`,
      ]},
      { k: "learn", title: "Voltage in dB: why 20?", b: [
        `<p>Same resistance at both points: P = V²/R. Put that in:</p>`,
        `<div class="eq">10 log(V<sub>2</sub>²/V<sub>1</sub>²) = 20 log(V<sub>2</sub>/V<sub>1</sub>)</div>`,
        `<p>The square comes out of the log as a factor of 2. Back from dB: A<sub>v</sub> = 10^(dB/20).</p>`,
      ]},
      { k: "play", title: "Gain ↔ dB", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let g = 2;
          function draw() { ro.innerHTML = readout([["Ratio", fmt(g, 4)], ["As a voltage ratio: 20 log", fmt(db(g), 4) + " dB"], ["As a power ratio: 10 log", fmt(10 * L10(g), 4) + " dB"]]); }
          host.append(slider({ id: id + "-g", label: "Ratio (output/input)", min: 0.01, max: 100000, log: true, value: g, show: (v) => fmt(v, 3) }, (v) => { g = v; draw(); }).el, ro);
          draw();
        },
        `<div class="tbl"><table><tr><th>Voltage gain</th><th>dB</th></tr><tr><td>0.5</td><td>−6</td></tr><tr><td>0.707</td><td>−3</td></tr><tr><td>1</td><td>0</td></tr><tr><td>2</td><td>6</td></tr><tr><td>10</td><td>20</td></tr><tr><td>100</td><td>40</td></tr><tr><td>1000</td><td>60</td></tr><tr><td>10 000</td><td>80</td></tr></table></div>`,
        `<p class="aside">Going from 1000 to 10 000 adds only 20 dB. Voltage gains of 50 dB or more are high.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Power ratio 50. In dB?", a: 16.99, unit: "dB", tol: 0.005, hint: "10 log 50.", why: "17.0 dB." },
        { t: "num", q: "Voltage ratio 50. In dB?", a: 33.98, unit: "dB", tol: 0.005, hint: "20 log 50.", why: "34.0 dB: double the power figure." },
        { t: "num", q: "Three stages of 20 dB, 26 dB and 14 dB. Overall voltage gain (as a ratio)?", a: 1000, tol: 0.01, hint: "dB gains add: 60 dB. Then 10^(60/20).", why: "1000. In dB, cascades add instead of multiply." },
        { t: "num", q: "2 V rms across 600 Ω. Level in dBm?", a: 8.235, unit: "dBm", tol: 0.01, hint: "0 dBm is 0.775 V across 600 Ω. 20 log(2/0.775).", why: "8.24 dBm." },
      ]},
      { k: "check", title: "A real amplifier", b: [
        `<p>An amplifier delivers 50 W into an 8 Ω speaker. Its power gain is 30 dB and its voltage gain 46 dB.</p>`,
        { t: "num", q: "Input power needed for full output, in mW?", a: 50, unit: "mW", hint: "30 dB is a power ratio of 10³.", why: "50 W/1000 = 50 mW." },
        { t: "num", q: "Input voltage, in V?", a: 0.1002, unit: "V", tol: 0.01, hint: "V_o = √(PR) = 20 V. 46 dB is a voltage ratio of 10^2.3.", why: "20/199.5 = 0.100 V." },
      ]},
      { k: "learn", title: "Ears and meters", b: [
        `<p>The ear responds logarithmically. Sound pressure level: dB<sub>s</sub> = 20 log(P/0.0002 µbar), where 0.0002 µbar is the threshold of hearing. Conversation ≈ 60 dB, a chain saw ≈ 100 dB, pain ≈ 120 dB.</p>`,
        `<ul><li>Loudness roughly <b>doubles every 10 dB</b>, which is <b>10×</b> the power. Doubling the loudness of a 1 W source takes a 10 W source.</li><li>About 3 dB (twice the power) is just noticeable at normal levels.</li><li>Hearing damage usually can't be undone: keep music players under about 60% volume and an hour a day.</li></ul>`,
        `<p class="aside">Meters with a dB scale use 1 mW in 600 Ω, i.e. 0.775 V rms = 0 dB. The reading is only exact across 600 Ω. Don't read 5 dB as 5 mW: it's 10^0.5 = 3.16 mW.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is a voltage ratio converted with 20 log but a power ratio with 10 log?", model: "Because power goes as voltage squared. Ten log of a squared voltage ratio is twenty log of the voltage ratio itself, since the square comes out of the logarithm as a factor of two. Both give the same decibel figure for the same change, as long as the resistances are equal." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Where the gain goes: low, mid, high", mins: 20,
    blurb: "Big capacitors limit the low end, tiny parasitic ones the high end. In between, the midband.",
    takeaway: "Coupling and bypass capacitors (µF) have large reactance at low frequencies: they set the low cutoff and act as shorts at high frequencies. Parasitic and wiring capacitances (pF) are open circuits at low frequencies and become shorts at high ones: they set the high cutoff (with the transistor's own gain fall-off). Midband: ignore all capacitors. Cutoff (corner, break, band, half-power) frequencies f_L and f_H are where the gain is 0.707 of midband: output power is half. Bandwidth BW = f_H − f_L. RC-coupled amplifiers lose gain at both ends; transformer-coupled ones too (magnetizing inductance at low f, winding capacitance at high f); direct-coupled amplifiers are flat down to DC. Normalizing (dividing by A_vmid) gives a plot with 1 (0 dB) in midband and 0.707 (−3 dB) at the cutoffs. Phase: 180° only in midband; at low f the output leads more, at high f less.",
    steps: [
      { k: "play", title: "Big C and little C", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let lf = 3;
          function draw() {
            const f = Math.pow(10, lf);
            ro.innerHTML = readout([["Frequency", hz(f)], ["X<sub>C</sub> of a 1 µF coupling capacitor", ohm(1 / (TAU * f * 1e-6))], ["X<sub>C</sub> of a 5 pF parasitic capacitance", ohm(1 / (TAU * f * 5e-12))]]);
          }
          host.append(slider({ id: id + "-f", label: "Frequency (log)", min: 1, max: 8, step: 0.05, value: lf, show: (v) => hz(Math.pow(10, v)) }, (v) => { lf = v; draw(); }).el, ro);
          draw();
        },
        `<p>Compare with circuit resistances of a few kΩ. At 10 Hz the 1 µF capacitor is 16 kΩ: definitely not a short. By 100 kHz it's 1.6 Ω: a short. The 5 pF capacitance is the opposite: 3 GΩ at 10 Hz (open), but only 318 Ω at 100 MHz.</p>`,
        `<div class="key"><b>Large</b> capacitors shape the <b>low</b>-frequency response; <b>small</b> ones shape the <b>high</b>-frequency response. In between, the <b>midband</b>, you ignore both: that's every analysis so far.</div>`,
      ]},
      { k: "learn", title: "Cutoff and bandwidth", b: [
        fig(bode({ series: [curve((f) => lo(150)(f) * hi(800e3)(f))], marks: [{ x: L10(150), y: -3 }, { x: L10(800e3), y: -3 }], texts: [{ x: L10(150) + 0.15, y: -5.5, s: "f_L" }, { x: L10(800e3) - 0.15, y: -5.5, s: "f_H", a: "end" }, { x: 3.4, y: 2, s: "midband" }], label: "Normalized gain of an RC-coupled amplifier with its two cutoff frequencies" })),
        `<p>Where the gain has fallen to <b>0.707</b> of midband, output power is <b>half</b>: (0.707)² = 0.5. Those are the <b>cutoff</b> (corner, break, band or half-power) frequencies.</p>`,
        `<div class="eq">BW = f<sub>H</sub> − f<sub>L</sub>    at f<sub>L</sub>, f<sub>H</sub>: A<sub>v</sub>/A<sub>vmid</sub> = 0.707 = −3 dB</div>`,
        `<p class="aside">Plotting A<sub>v</sub>/A<sub>vmid</sub> (normalizing) makes the plot independent of the actual gain: midband is 1 (0 dB) whether A<sub>vmid</sub> is 50 or 200.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Midband gain 150. What gain marks the cutoff frequencies?", a: 106.1, tol: 0.01, hint: "0.707 × 150.", why: "106: that's −3 dB." },
        { t: "num", q: "f_L = 180 Hz, f_H = 27 kHz. Bandwidth?", a: 26820, unit: "Hz", tol: 0.005, hint: "f_H − f_L.", why: "26.8 kHz, essentially f_H." },
        { t: "sort", q: "What limits each amplifier at each end?", bins: ["Low-frequency fall-off", "High-frequency fall-off", "Nothing: flat to DC"], items: [
          ["Coupling and bypass capacitors (RC-coupled)", 0, "Their reactance grows as frequency falls."],
          ["Transformer's magnetizing inductance", 0, "X_L = 2πfL shorts the input at low frequency; at DC no changing flux, no output."],
          ["Stray capacitance between windings", 1, "It shorts the signal at high frequency."],
          ["Parasitic transistor capacitance and β fall-off", 1, "Tiny capacitances matter only at high frequency."],
          ["Direct-coupled amplifier's low end", 2, "No coupling capacitors, so the gain holds down to DC."],
        ]},
      ]},
      { k: "learn", title: "Phase changes too", b: [
        `<p>"A CE amplifier shifts phase by 180°" is only true in the <b>midband</b>. At low frequencies the coupling networks add a lead (the output leads by more); at high frequencies the phase shift falls below 180°.</p>`,
        seen("Frequency response: magnitude and phase on log scales.", "13-sinusoidal-steady-state.html#p5", "Chapter 13, Part 5"),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do the cutoff frequencies sit at 0.707 of the midband gain?", model: "Because at 0.707 of the midband voltage, the output power is half the midband power, since power goes with voltage squared and 0.707 squared is 0.5. In decibels that's 3 dB down, so they're also called the half-power or −3 dB frequencies." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "One RC: f_L and the Bode plot", mins: 25,
    blurb: "Every low-frequency corner is an RC divider. Find f_L, draw two straight lines, done.",
    takeaway: "Series C, shunt R (high-pass): A_v = 1/(1 − j f_L/f), |A_v| = 1/√(1 + (f_L/f)²), phase (V_o leads V_i) = tan⁻¹(f_L/f). f_L = 1/(2πRC), where X_C = R and |A_v| = 0.707 (−3 dB). Well below f_L: A_v(dB) ≈ −20 log(f_L/f): −6 dB per octave (×2 in frequency), −20 dB per decade (×10). Bode plot: a 0 dB asymptote above f_L, a 20 dB/decade slope below it, meeting at f_L; the real curve is 3 dB below the corner. Phase: 45° at f_L, toward 90° well below, toward 0° well above. A_v = 10^(dB/20).",
    steps: [
      { k: "learn", title: "The RC divider", b: [
        seen("First-order responses sketched with straight-line asymptotes.", "13-sinusoidal-steady-state.html#p6", "Chapter 13, Part 6"),
        `<p>A capacitor in series with the signal, a resistor to ground: at high frequency C is a short, V<sub>o</sub> = V<sub>i</sub>. At 0 Hz it's open, V<sub>o</sub> = 0. In between, a voltage divider:</p>`,
        `<div class="eq">|A<sub>v</sub>| = 1/√(1 + (f<sub>L</sub>/f)²)    f<sub>L</sub> = 1/(2πRC)    phase = tan⁻¹(f<sub>L</sub>/f)</div>`,
        `<p>At f = f<sub>L</sub>, X<sub>C</sub> = R exactly, and |A<sub>v</sub>| = 1/√2 = 0.707: −3 dB.</p>`,
      ]},
      { k: "play", title: "Bode lab", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let R = 2200, C = 0.47e-6, ph = false, lt = 2;
          function draw() {
            const fL = 1 / (TAU * R * C), x = L10(fL), ft = Math.pow(10, lt);
            if (!ph) f.innerHTML = bode({ x: [0, 5], xt: [0, 1, 2, 3, 4, 5], y: [-40, 5], series: [curve(lo(fL)), { pts: [[x, 0], [5, 0]], cls: "s5" }, { pts: [[x - 2, -40], [x, 0]], cls: "s5" }], marks: [{ x: x, y: -3 }, { x: lt, y: db(lo(fL)(ft)), cls: "mk2" }], texts: [{ x: x + 0.1, y: -6, s: "f_L" }], label: "Bode plot of an RC high-pass: asymptotes and the real curve" });
            else f.innerHTML = plot({ x: [0, 5], y: [0, 90], xt: [0, 1, 2, 3, 4, 5], xtf: (v) => si(Math.pow(10, v), "", 2).trim(), yt: [0, 45, 90], xl: "f (Hz, log scale)", yl: "phase lead (°)", series: [{ f: (xx) => (Math.atan(fL / Math.pow(10, xx)) * 180) / Math.PI, cls: "s1" }], marks: [{ x, y: 45 }, { x: lt, y: (Math.atan(fL / ft) * 180) / Math.PI, cls: "mk2" }], label: "Phase of the RC high-pass" });
            ro.innerHTML = readout([["f<sub>L</sub> = 1/(2πRC)", hz(fL)], ["At the blue dot, f", hz(ft)], ["|A<sub>v</sub>| there", fmt(lo(fL)(ft), 3) + " = " + fmt(db(lo(fL)(ft)), 3) + " dB"], ["Phase lead there", fmt((Math.atan(fL / ft) * 180) / Math.PI, 3) + "°"]]);
          }
          host.append(f, toggle(["Magnitude", "Phase"], (k) => { ph = k === 1; draw(); }, 0),
            slider({ id: id + "-r", label: "R", min: 100, max: 100e3, log: true, value: R, show: (v) => ohm(v) }, (v) => { R = v; draw(); }).el,
            slider({ id: id + "-c", label: "C", min: 0.01e-6, max: 100e-6, log: true, value: C, show: (v) => si(v, "F") }, (v) => { C = v; draw(); }).el,
            slider({ id: id + "-t", label: "Test frequency (blue dot)", min: 0, max: 5, step: 0.02, value: lt, show: (v) => hz(Math.pow(10, v)) }, (v) => { lt = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Dashed: the two straight-line asymptotes (the Bode plot). Orange: the real response. They meet at f<sub>L</sub>, where the real curve is 3 dB below.</p>`,
      ]},
      { k: "learn", title: "6 dB per octave", b: [
        `<p>Well below f<sub>L</sub>, 1 + (f<sub>L</sub>/f)² ≈ (f<sub>L</sub>/f)², so A<sub>v</sub>(dB) ≈ −20 log(f<sub>L</sub>/f):</p>`,
        `<div class="two"><div class="tile"><h3>f = f<sub>L</sub>/2</h3><p>−6 dB. One <b>octave</b> = ×2 in frequency = 6 dB.</p></div><div class="tile"><h3>f = f<sub>L</sub>/10</h3><p>−20 dB. One <b>decade</b> = ×10 in frequency = 20 dB.</p></div></div>`,
        `<p class="aside">Hendrik Bode (Bell Labs, 1940s) introduced these straight-line plots.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>R = 2.2 kΩ, C = 0.47 µF.</p>`,
        { t: "num", q: "f_L?", a: 153.9, unit: "Hz", tol: 0.01, hint: "1/(2πRC).", why: "1/(2π × 2200 × 0.47 µF) = 154 Hz." },
        { t: "num", q: "Exact gain in dB at f = f_L/5?", a: -14.15, unit: "dB", tol: 0.01, hint: "−10 log(1 + 5²).", why: "−14.15 dB. The asymptote gives −20 log 5 = −13.98: within 0.2 dB." },
        { t: "num", q: "Phase lead at f = f_L/5, in degrees?", a: 78.69, unit: "°", tol: 0.01, hint: "tan⁻¹(5).", why: "78.7°, heading for 90°." },
        { t: "num", q: "A reading of −9 dB. Voltage ratio?", a: 0.3548, tol: 0.01, hint: "10^(−9/20).", why: "0.355." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you sketch the low-frequency response of one RC network quickly?", model: "Find f_L = 1/(2πRC). Draw a flat 0 dB line above f_L and a line falling at 20 dB per decade (6 dB per octave) below it, meeting at f_L. The real curve follows these asymptotes away from the corner and passes 3 dB below the corner at f_L." },
      ]},
    ],
  };

  /* ---------- Chapter 9 amplifier helpers ---------- */
  function bjtSym(x, y) {
    const L = Math.hypot(22, 19), ux = 22 / L, uy = 19 / L;
    let s = `<line class="w" x1="${x - 30}" y1="${y}" x2="${x}" y2="${y}"/><line class="w" x1="${x}" y1="${y - 20}" x2="${x}" y2="${y + 20}" style="stroke-width:3.5"/>`;
    s += `<polyline class="w" points="${x},${y - 9} ${x + 22},${y - 28} ${x + 22},${y - 50}"/><polyline class="w" points="${x},${y + 9} ${x + 22},${y + 28} ${x + 22},${y + 50}"/>`;
    const tx = x + 22 * 0.85, ty = y + 9 + 19 * 0.85, bx = tx - 9 * ux, by = ty - 9 * uy;
    return s + `<polygon class="nd" points="${tx},${ty} ${bx - 5 * uy},${by + 5 * ux} ${bx + 5 * uy},${by - 5 * ux}"/>`;
  }
  function jfetSym(x, y) {
    let s = `<line class="w" x1="${x - 30}" y1="${y}" x2="${x}" y2="${y}"/><line class="w" x1="${x}" y1="${y - 24}" x2="${x}" y2="${y + 24}" style="stroke-width:3.5"/>`;
    s += `<polyline class="w" points="${x},${y - 16} ${x + 22},${y - 16} ${x + 22},${y - 40}"/><polyline class="w" points="${x},${y + 16} ${x + 22},${y + 16} ${x + 22},${y + 40}"/>`;
    return s + `<polygon class="nd" points="${x - 2},${y} ${x - 12},${y - 5} ${x - 12},${y + 5}"/>`;
  }
  /* The loaded voltage-divider amplifier with its three low-frequency capacitors.
     o.fet: JFET version. o.hl: which capacitor's loop to highlight (0 input, 1 output, 2 bypass). o.hf: draw the parasitic capacitances instead. */
  function ampFig(o = {}) {
    const f = !!o.fet, h = o.hl, H = (k) => (h === k ? "hl" : "");
    const L = f ? { s: "R_sig", cin: "C_G", r1: null, r2: "R_G", rc: "R_D", cc: "C_C", re: "R_S", ce: "C_S", top: "V_DD" } : { s: "R_s", cin: "C_s", r1: "R_1", r2: "R_2", rc: "R_C", cc: "C_C", re: "R_E", ce: "C_E", top: "V_CC" };
    let s = S.supply(250, 40, L.top) + S.wire([190, 40], [312, 40]);
    if (L.r1) s += S.res(190, 40, 190, 170, L.r1, { side: "left", cls: H(0) });
    else s = S.supply(250, 40, L.top) + S.wire([250, 40], [312, 40]);
    s += S.res(190, 170, 190, 300, L.r2, { side: "left", cls: H(0) }) + S.gnd(190, 300) + S.dot(190, 170);
    s += S.vsrc(30, 240, f ? "V_s" : "V_s") + S.wire([30, 258], [30, 300]) + S.gnd(30, 300) + S.wire([30, 222], [30, 170]);
    s += S.res(30, 170, 105, 170, L.s, { cls: H(0), side: "below" }) + S.cap(105, 170, 185, 170, L.cin, { cls: H(0), tcls: h === 0 ? "a" : "" }) + S.wire([185, 170], [190, 170]);
    s += S.wire([190, 170], [260, 170]) + (f ? jfetSym(290, 170) + S.wire([312, 130], [312, 100]) + S.wire([312, 210], [312, 235]) : bjtSym(290, 170) + S.wire([312, 120], [312, 100]) + S.wire([312, 220], [312, 235]));
    s += S.res(312, 40, 312, 100, L.rc, { side: "left", cls: H(1) }) + S.dot(312, 100);
    s += S.cap(312, 100, 392, 100, L.cc, { cls: H(1), tcls: h === 1 ? "a" : "" }) + S.wire([392, 100], [440, 100], [440, 120]) + S.res(440, 120, 440, 300, "R_L", { side: "right", cls: H(1) }) + S.gnd(440, 300) + S.dot(440, 100) + S.t(448, 92, "V_o", { a: "start", cls: "a" });
    s += S.dot(312, 235) + S.wire([312, 235], [380, 235]) + S.res(312, 235, 312, 300, L.re, { side: "left", cls: H(2) }) + S.cap(380, 235, 380, 300, L.ce, { side: "right", cls: H(2), tcls: h === 2 ? "a" : "" }) + S.wire([312, 300], [380, 300]) + S.gnd(346, 300);
    s += S.t(112, 196, "V_i", { a: "start", cls: "c s" });
    return S.svg(520, 335, `<g transform="translate(20,0)">${s}</g>`, { max: 520, label: o.label || (f ? "JFET amplifier with C_G, C_C and C_S" : "Loaded BJT voltage-divider amplifier with C_s, C_C and C_E") });
  }
  /* Find where a normalized gain g(f) crosses 0.707, searching log10 f between a and b. rising: true for the low end. */
  function cross(g, a, b, rising) {
    for (let i = 0; i < 60; i++) { const m = (a + b) / 2, v = g(Math.pow(10, m)); if ((v < Math.SQRT1_2) === rising) a = m; else b = m; }
    return Math.pow(10, (a + b) / 2);
  }
  /* Everything for a loaded voltage-divider BJT amplifier (my example values as defaults). */
  function bjtAmp(p) {
    const VB = (p.R2 * p.VCC) / (p.R1 + p.R2), IE = (VB - 0.7) / p.RE, re = 0.026 / IE, bre = p.b * re;
    const Ri = par(p.R1, p.R2, bre), Av = -par(p.RC, p.RL) / re, Avs = (Av * Ri) / (Ri + p.Rs);
    const fLs = 1 / (TAU * (p.Rs + Ri) * p.Cs), fLC = 1 / (TAU * (p.RC + p.RL) * p.CC);
    const Rsp = p.Rs > 0 ? par(p.Rs, p.R1, p.R2) : par(p.R1, p.R2), Re = par(p.RE, Rsp / p.b + re), fLE = 1 / (TAU * Re * p.CE);
    const RThi = p.Rs > 0 ? par(p.Rs, p.R1, p.R2, bre) : 0, Ci = p.CWi + p.Cbe + (1 - Av) * p.Cbc, fHi = RThi > 0 ? 1 / (TAU * RThi * Ci) : Infinity;
    const RTho = par(p.RC, p.RL), Co = p.CWo + p.Cce + (1 - 1 / Av) * p.Cbc, fHo = 1 / (TAU * RTho * Co);
    const fb = 1 / (TAU * p.b * re * (p.Cbe + p.Cbc));
    return { VB, IE, re, bre, Ri, Av, Avs, fLs, fLC, Re, fLE, RThi, Ci, fHi, RTho, Co, fHo, fb, fT: p.b * fb };
  }
  const MY = { VCC: 15, R1: 47e3, R2: 10e3, RE: 1.5e3, RC: 3.3e3, RL: 4.7e3, b: 120, Cs: 4.7e-6, CC: 2.2e-6, CE: 47e-6, Rs: 600, Cbe: 30e-12, Cbc: 3e-12, Cce: 1e-12, CWi: 5e-12, CWo: 6e-12 };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "BJT low end: C_s, C_C and C_E", mins: 30,
    blurb: "Three capacitors, three RC loops, three corners. The highest one sets f_L.",
    takeaway: "Treat each capacitor alone, with the other two as shorts. Input C_s: f_Ls = 1/[2π(R_s + R_i)C_s], R_i = R₁ ∥ R₂ ∥ βr_e. Output C_C: f_LC = 1/[2π(R_o + R_L)C_C], R_o = R_C ∥ r_o. Bypass C_E: f_LE = 1/(2πR_eC_E), R_e = R_E ∥ (R′_s/β + r_e), R′_s = R_s ∥ R₁ ∥ R₂ (R′_s = R₁ ∥ R₂ with no R_s). R_e is tiny, so C_E usually sets the highest corner even though it's the biggest capacitor. Midband (all shorts): A_v = −(R_C ∥ R_L)/r_e. The highest of the three corners is the last met before midband and essentially sets f_L when they're well apart. Corners close together raise f_L and steepen the slope (12, then 18 dB/octave).",
    steps: [
      { k: "learn", title: "Three loops", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), cap = el(`<p></p>`);
          const txt = [
            `<b>C<sub>s</sub></b> sits between the source and the base. Its loop: R<sub>s</sub> in series, then R<sub>i</sub> = R<sub>1</sub> ∥ R<sub>2</sub> ∥ βr<sub>e</sub> looking into the amplifier.`,
            `<b>C<sub>C</sub></b> sits between collector and load. Its loop: R<sub>o</sub> = R<sub>C</sub> ∥ r<sub>o</sub> (a Thévenin resistance) in series with R<sub>L</sub>.`,
            `<b>C<sub>E</sub></b> sits across R<sub>E</sub>. Its loop: whatever resistance it "sees" from the emitter. Looking up into the emitter you see a small resistance, so R<sub>e</sub> is small.`];
          const draw = (k) => { f.innerHTML = ampFig({ hl: k }); cap.innerHTML = txt[k]; };
          host.append(f, toggle(["C_s loop", "C_C loop", "C_E loop"], draw, 0), cap);
          draw(0);
        },
        `<div class="key">One capacitor at a time: treat the other two as <b>shorts</b> (they're doing their job), find the resistance the capacitor sees, and use f = 1/(2πRC).</div>`,
      ]},
      { k: "learn", title: "The three formulas", b: [
        `<div class="eq">f<sub>Ls</sub> = 1/[2π(R<sub>s</sub> + R<sub>i</sub>)C<sub>s</sub>]    R<sub>i</sub> = R<sub>1</sub> ∥ R<sub>2</sub> ∥ βr<sub>e</sub></div>`,
        `<div class="eq">f<sub>LC</sub> = 1/[2π(R<sub>o</sub> + R<sub>L</sub>)C<sub>C</sub>]    R<sub>o</sub> = R<sub>C</sub> ∥ r<sub>o</sub></div>`,
        `<div class="eq">f<sub>LE</sub> = 1/(2πR<sub>e</sub>C<sub>E</sub>)    R<sub>e</sub> = R<sub>E</sub> ∥ (R′<sub>s</sub>/β + r<sub>e</sub>)    R′<sub>s</sub> = R<sub>s</sub> ∥ R<sub>1</sub> ∥ R<sub>2</sub></div>`,
        ch(5, "05-bjt-ac-analysis.html", "p5", "Part 5", "R′<sub>s</sub>/β + r<sub>e</sub> is the emitter-follower output impedance: the base side seen from the emitter, divided by β."),
        `<p class="aside">With no R<sub>s</sub>, drop it: R<sub>i</sub> alone for C<sub>s</sub>, and R′<sub>s</sub> = R<sub>1</sub> ∥ R<sub>2</sub> for C<sub>E</sub>.</p>`,
      ]},
      { k: "predict", title: "Guess first", b: [
        { t: "mcq", q: "C_s = 4.7 µF, C_C = 2.2 µF, C_E = 47 µF. Which one probably sets the low cutoff?", opts: [
          ["C_E, even though it's the biggest", true, "Right. R_e is only tens of ohms, so R_eC_E is the smallest time constant and f_LE the highest corner."],
          ["C_C, because it's the smallest", false, "Small C pushes the corner up, but the resistance matters just as much. C_C sees kilohms."],
          ["C_s, because it's at the input", false, "Position doesn't decide it: the RC product does."],
        ]},
      ]},
      { k: "check", title: "My amplifier: midband first", b: [
        `<p>V<sub>CC</sub> = 15 V, R<sub>1</sub> = 47 kΩ, R<sub>2</sub> = 10 kΩ, R<sub>E</sub> = 1.5 kΩ, R<sub>C</sub> = 3.3 kΩ, R<sub>L</sub> = 4.7 kΩ, β = 120, r<sub>o</sub> = ∞, R<sub>s</sub> = 600 Ω. βR<sub>E</sub> = 180 kΩ ≥ 10R<sub>2</sub>, so the approximate method works.</p>`,
        { t: "num", q: "r_e?", a: 20.19, unit: "Ω", tol: 0.01, hint: "V_B = 2.63 V, I_E = (V_B − 0.7)/R_E.", why: "I_E = 1.288 mA, r_e = 26 mV/1.288 mA = 20.2 Ω." },
        { t: "num", q: "R_i = R₁ ∥ R₂ ∥ βr_e?", a: 1873, unit: "Ω", tol: 0.01, hint: "βr_e = 2.42 kΩ.", why: "47k ∥ 10k ∥ 2.42k = 1.87 kΩ." },
        { t: "num", q: "Midband A_v = V_o/V_i?", a: -96.02, tol: 0.01, hint: "−(R_C ∥ R_L)/r_e.", why: "−1939/20.19 = −96.0." },
      ]},
      { k: "check", title: "Now the three corners", b: [
        `<p>C<sub>s</sub> = 4.7 µF, C<sub>C</sub> = 2.2 µF, C<sub>E</sub> = 47 µF, R<sub>s</sub> = 600 Ω.</p>`,
        { t: "num", q: "f_Ls?", a: 13.7, unit: "Hz", tol: 0.01, hint: "R_s + R_i = 2.47 kΩ.", why: "1/(2π × 2473 × 4.7 µF) = 13.7 Hz." },
        { t: "num", q: "f_LC?", a: 9.043, unit: "Hz", tol: 0.01, hint: "R_o = R_C here.", why: "1/(2π × 8 kΩ × 2.2 µF) = 9.04 Hz." },
        { t: "num", q: "R_e, the resistance C_E sees?", a: 24.45, unit: "Ω", tol: 0.01, hint: "R′_s = 600 ∥ 47k ∥ 10k = 559 Ω. Then R_E ∥ (559/120 + 20.19).", why: "4.66 + 20.19 = 24.85 Ω, in parallel with 1.5 kΩ: 24.4 Ω." },
        { t: "num", q: "f_LE?", a: 138.5, unit: "Hz", tol: 0.01, hint: "1/(2πR_eC_E).", why: "138.5 Hz: ten times the others. C_E sets f_L ≈ 139 Hz." },
      ]},
      { k: "play", title: "Move the capacitors", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const p = Object.assign({}, MY);
          function draw() {
            const a = bjtAmp(p), g = (ff) => lo(a.fLs)(ff) * lo(a.fLC)(ff) * lo(a.fLE)(ff), fL = cross(g, -1, 5, true);
            f.innerHTML = bode({ x: [0, 4], xt: [0, 1, 2, 3, 4], y: [-50, 5], yt: [-50, -40, -30, -20, -10, -3, 0], yl: "A_v/A_vmid (dB)",
              series: [curve(lo(a.fLs), "s2"), curve(lo(a.fLC), "s3"), curve(lo(a.fLE), "s4"), curve(g, "s1")],
              marks: [{ x: L10(fL), y: -3 }], texts: [{ x: 0.1, y: -46, s: "blue C_s · green C_C · red C_E · orange all three" }], label: "Low-frequency response of each capacitor alone and all together" });
            ro.innerHTML = readout([["f<sub>Ls</sub>", hz(a.fLs)], ["f<sub>LC</sub>", hz(a.fLC)], ["f<sub>LE</sub>", hz(a.fLE)], ["Overall f<sub>L</sub> (all three)", hz(fL)]]);
          }
          host.append(f,
            slider({ id: id + "-s", label: "C_s", min: 0.1e-6, max: 100e-6, log: true, value: p.Cs, show: (v) => si(v, "F") }, (v) => { p.Cs = v; draw(); }).el,
            slider({ id: id + "-c", label: "C_C", min: 0.1e-6, max: 100e-6, log: true, value: p.CC, show: (v) => si(v, "F") }, (v) => { p.CC = v; draw(); }).el,
            slider({ id: id + "-e", label: "C_E", min: 1e-6, max: 1000e-6, log: true, value: p.CE, show: (v) => si(v, "F") }, (v) => { p.CE = v; draw(); }).el, ro);
          draw();
        },
        `<p>Try it: make C<sub>E</sub> 470 µF. Now the three corners bunch together, and the orange curve's −3 dB point sits <b>above</b> every single corner. Close corners add up.</p>`,
        `<p class="aside">The book treats C<sub>E</sub> as a simple first-order corner too. The real C<sub>E</sub> response levels off at the unbypassed gain far below f<sub>LE</sub>, but near the corner the model works.</p>`,
      ]},
      { k: "why", title: "Why the highest corner wins", b: [
        { t: "mcq", q: "Coming down from midband, why does the highest low corner matter most?", opts: [
          ["It's the first one you meet, so its drop starts while the others are still flat", true, "Yes. By the time you reach the lower corners, the gain is already well down."],
          ["Because the corners multiply to give the highest one", false, "The gains multiply, but that doesn't single out the highest corner by itself."],
          ["Because it has the biggest capacitor", false, "In my example it's the biggest capacitor, but that's because its resistance is tiny."],
        ]},
        `<p>Below each corner the asymptote falls 6 dB/octave. Below two corners the slopes add: 12 dB/octave. Below all three: 18 dB/octave.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you find the low cutoff frequency of a BJT amplifier with three capacitors?", model: "Take one capacitor at a time with the other two treated as shorts. Find the resistance it sees: R_s plus R_i for the input capacitor, R_o plus R_L for the output one, and the small emitter resistance R_e for the bypass one. Each gives f equals one over two pi R C. If they're well apart, the highest of the three is the low cutoff. If they're close, the real cutoff is somewhat higher." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "R_s's effect, and the FET low end", mins: 25,
    blurb: "A source resistance costs gain but moves two corners. Then the same method for a JFET.",
    takeaway: "Adding R_s: f_Ls falls (more resistance in its loop), f_LC is unchanged, f_LE rises (R′_s = R_s ∥ R₁ ∥ R₂ is smaller, so R_e is smaller). Midband gain from the source: A_vs = [R_i/(R_i + R_s)]A_v. FET: C_G sees R_sig + R_i with R_i = R_G (huge), so a tiny C_G still gives a low f_LG = 1/[2π(R_sig + R_i)C_G]. C_C: f_LC = 1/[2π(R_o + R_L)C_C], R_o = R_D ∥ r_d. C_S: f_LS = 1/(2πR_eqC_S), R_eq = R_S ∥ 1/g_m when r_d = ∞ (in general R_S/[1 + R_S(1 + g_mr_d)/(r_d + R_D ∥ R_L)]). C_S usually sets the FET's f_L.",
    steps: [
      { k: "play", title: "Take R_s away", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let Rs = 600;
          function draw() {
            const a = bjtAmp(Object.assign({}, MY, { Rs }));
            ro.innerHTML = readout([["f<sub>Ls</sub>", hz(a.fLs)], ["f<sub>LC</sub>", hz(a.fLC)], ["R<sub>e</sub>", ohm(a.Re)], ["f<sub>LE</sub>", hz(a.fLE)], ["A<sub>vs</sub> = V<sub>o</sub>/V<sub>s</sub>", fmt(a.Avs, 4)]]);
          }
          host.append(slider({ id: id + "-r", label: "R_s", min: 0, max: 5000, step: 50, value: Rs, show: (v) => ohm(v) }, (v) => { Rs = v; draw(); }).el, ro);
          draw();
        },
        `<p>Same amplifier as Part 5. Slide R<sub>s</sub> from 0 up.</p>`,
        `<div class="two"><div class="tile"><h3>f<sub>Ls</sub> falls</h3><p>R<sub>s</sub> adds to the series resistance in C<sub>s</sub>'s loop.</p></div><div class="tile"><h3>f<sub>LE</sub> rises</h3><p>R′<sub>s</sub> = R<sub>s</sub> ∥ R<sub>1</sub> ∥ R<sub>2</sub> shrinks, so R<sub>e</sub> shrinks.</p></div></div>`,
        `<div class="eq">A<sub>vs</sub> = [R<sub>i</sub>/(R<sub>i</sub> + R<sub>s</sub>)] A<sub>v</sub></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "My amplifier with R_s = 0: f_LE?", a: 40.35, unit: "Hz", tol: 0.01, hint: "R′_s = R₁ ∥ R₂ = 8.25 kΩ. R_e = R_E ∥ (8246/120 + 20.19).", why: "R_e = 83.9 Ω, f_LE = 40.3 Hz. With 600 Ω of R_s it was 138.5 Hz." },
        { t: "num", q: "With R_s = 600 Ω, A_vs?", a: -72.72, tol: 0.01, hint: "R_i = 1873 Ω.", why: "−96.0 × 1873/2473 = −72.7: a quarter of the gain lost in R_s." },
        { t: "mcq", q: "Does adding R_s widen the bandwidth here?", opts: [
          ["No: f_L went up from 40 Hz to 139 Hz", true, "Right. C_E dominates, and R_s pushed f_LE up. A lower f_Ls doesn't help when it isn't the dominant corner."],
          ["Yes: f_Ls went down", false, "f_Ls did fall, but it isn't the dominant corner."],
        ]},
      ]},
      { k: "learn", title: "The FET version", b: [
        fig(ampFig({ fet: true })),
        `<div class="eq">f<sub>LG</sub> = 1/[2π(R<sub>sig</sub> + R<sub>i</sub>)C<sub>G</sub>]    R<sub>i</sub> = R<sub>G</sub></div>`,
        `<div class="eq">f<sub>LC</sub> = 1/[2π(R<sub>o</sub> + R<sub>L</sub>)C<sub>C</sub>]    R<sub>o</sub> = R<sub>D</sub> ∥ r<sub>d</sub></div>`,
        `<div class="eq">f<sub>LS</sub> = 1/(2πR<sub>eq</sub>C<sub>S</sub>)    R<sub>eq</sub> = R<sub>S</sub> ∥ 1/g<sub>m</sub>    (r<sub>d</sub> = ∞)</div>`,
        `<p class="aside">R<sub>G</sub> is megohms, so C<sub>G</sub> can be nanofarads and f<sub>LG</sub> still stays low. Example 9.13 quotes "Eqs. (9.36), (9.38), (9.40)" for these; the FET equations are (9.42), (9.44), (9.46).</p>`,
        ch(8, "08-fet-amplifiers.html", "p6", "Part 6", "1/g<sub>m</sub> is what you see looking into the source."),
      ]},
      { k: "check", title: "A JFET amplifier", b: [
        `<p>R<sub>sig</sub> = 10 kΩ, R<sub>G</sub> = 2.2 MΩ, C<sub>G</sub> = 22 nF, R<sub>D</sub> = 3.3 kΩ, R<sub>L</sub> = 10 kΩ, C<sub>C</sub> = 1 µF, R<sub>S</sub> = 1.2 kΩ, C<sub>S</sub> = 22 µF, g<sub>m</sub> = 2.5 mS, r<sub>d</sub> = ∞.</p>`,
        { t: "num", q: "f_LG?", a: 3.273, unit: "Hz", tol: 0.01, hint: "R_sig + R_G = 2.21 MΩ.", why: "3.27 Hz, with only 22 nF." },
        { t: "num", q: "f_LC?", a: 11.97, unit: "Hz", tol: 0.01, hint: "R_D + R_L = 13.3 kΩ.", why: "12.0 Hz." },
        { t: "num", q: "R_eq?", a: 300, unit: "Ω", tol: 0.01, hint: "1/g_m = 400 Ω, in parallel with 1.2 kΩ.", why: "300 Ω." },
        { t: "num", q: "f_LS?", a: 24.11, unit: "Hz", tol: 0.01, hint: "1/(2πR_eqC_S).", why: "24.1 Hz: the highest, so f_L ≈ 24 Hz." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a FET amplifier get away with a much smaller input coupling capacitor than a BJT amplifier?", model: "Because the resistance the input capacitor sees includes R_G, which is in the megohms, instead of R_1 parallel R_2 parallel beta r_e, which is a few kilohms. The corner frequency is one over two pi R C, so a resistance a thousand times bigger lets the capacitor be a thousand times smaller for the same corner." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  function millerFig(eq) {
    let s = S.wire([40, 130], [170, 130]) + S.box(170, 100, 120, 60, "A_v") + S.wire([290, 130], [420, 130]) + S.dot(40, 130) + S.t(40, 118, "V_i", { cls: "c" }) + S.dot(420, 130) + S.t(420, 118, "V_o", { cls: "a" });
    if (!eq) s += S.dot(110, 130) + S.dot(350, 130) + S.wire([110, 130], [110, 50], [190, 50]) + S.cap(190, 50, 270, 50, "C_f", { tcls: "a" }) + S.wire([270, 50], [350, 50], [350, 130]) + S.t(230, 192, "C_f bridges input and output", { cls: "s m" });
    else s += S.dot(110, 130) + S.dot(350, 130) + S.cap(110, 130, 110, 200, "C_Mi", { side: "left", tcls: "a" }) + S.gnd(110, 200) + S.cap(350, 130, 350, 200, "C_Mo", { side: "right", tcls: "a" }) + S.gnd(350, 200) + S.t(230, 60, "same currents, capacitors to ground", { cls: "s m" });
    return S.svg(460, 230, s, { max: 460, label: eq ? "Miller equivalent: C_Mi at the input and C_Mo at the output, both to ground" : "Inverting amplifier with a feedback capacitor C_f from input to output" });
  }
  const p7 = {
    id: "p7", title: "The Miller effect", mins: 25,
    blurb: "A tiny capacitor from input to output of an inverting amplifier looks huge from the input.",
    takeaway: "For an inverting amplifier with C_f between input and output: the current through C_f is (V_i − V_o)/X_Cf = (1 − A_v)V_i/X_Cf, as if a capacitor C_Mi = (1 − A_v)C_f sat from input to ground. At the output: C_Mo = (1 − 1/A_v)C_f ≈ C_f when |A_v| ≫ 1. Use the midband A_v (largest, so worst case). Only inverting amplifiers: for A_v > 1 positive the formula gives negative capacitance, and for followers and common base it's not a concern.",
    steps: [
      { k: "learn", title: "Follow the current", b: [
        (host) => { const f = el(`<div class="fig"></div>`); const d = (k) => { f.innerHTML = millerFig(k === 1); }; host.append(f, toggle(["Real circuit", "Miller equivalent"], d, 0)); d(0); },
        `<p>V<sub>o</sub> = A<sub>v</sub>V<sub>i</sub>, with A<sub>v</sub> negative. The voltage across C<sub>f</sub> is V<sub>i</sub> − V<sub>o</sub> = (1 − A<sub>v</sub>)V<sub>i</sub>. With A<sub>v</sub> = −100, that's <b>101</b> V<sub>i</sub>: the capacitor sees 101 times the input voltage, so it draws 101 times the current.</p>`,
        `<div class="eq">C<sub>Mi</sub> = (1 − A<sub>v</sub>)C<sub>f</sub>    C<sub>Mo</sub> = (1 − 1/A<sub>v</sub>)C<sub>f</sub> ≈ C<sub>f</sub></div>`,
      ]},
      { k: "play", title: "Gain slider", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let A = -100; const Cf = 3e-12;
          function draw() {
            const Mi = (1 - A) * Cf, Mo = (1 - 1 / A) * Cf, W = 420, sc = (c) => Math.max(1, Math.min(W, (c / (201 * Cf)) * W));
            const bar = (y, c, lab, cls) => `<rect x="20" y="${y}" width="${sc(Math.abs(c))}" height="22" rx="4" style="fill:var(${cls})"/>` + S.t(24, y - 6, lab + " = " + si(c, "F", 3), { a: "start", cls: "s" });
            f.innerHTML = S.svg(460, 150, bar(26, Cf, "C_f", "--muted") + bar(76, Mi, "C_Mi", "--accent") + bar(126, Mo, "C_Mo", "--cool"), { max: 460, label: "Bars comparing C_f with the Miller capacitances" });
            ro.innerHTML = readout([["A<sub>v</sub>", fmt(A, 3)], ["C<sub>Mi</sub> = (1 − A<sub>v</sub>)C<sub>f</sub>", si(Mi, "F", 3)], ["C<sub>Mo</sub> = (1 − 1/A<sub>v</sub>)C<sub>f</sub>", si(Mo, "F", 3)]]);
          }
          host.append(f, slider({ id: id + "-a", label: "Midband gain A_v (C_f = 3 pF)", min: -200, max: -1, step: 1, value: A, show: (v) => fmt(v, 3) }, (v) => { A = v; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "C_f = 3 pF, A_v = −120. C_Mi?", a: 363, unit: "pF", tol: 0.01, hint: "(1 − A_v)C_f.", why: "121 × 3 pF = 363 pF." },
        { t: "num", q: "Same amplifier: C_Mo?", a: 3.025, unit: "pF", tol: 0.01, hint: "(1 + 1/120) × 3 pF.", why: "3.025 pF, essentially C_f." },
        { t: "mcq", q: "Which A_v should go into the formula, given the gain itself falls at high frequency?", opts: [
          ["The midband value", true, "It's the largest, so it gives the largest C_Mi: the worst case."],
          ["The gain at f_H", false, "That would be circular: f_H depends on C_Mi."],
        ]},
      ]},
      { k: "whatif", title: "What if it doesn't invert?", b: [
        { t: "mcq", q: "An emitter follower has A_v = +0.98. C_Mi?", opts: [
          ["(1 − 0.98)C_f = 0.02C_f: tiny", true, "Input and output move together, so almost no voltage across C_f. Followers and common base don't suffer the Miller effect."],
          ["1.98C_f", false, "The sign: 1 − (+0.98), not 1 + 0.98."],
          ["99C_f", false, "That's an inverting gain of −98."],
        ]},
        `<p class="aside">For a positive gain above 1 the formula would give a negative capacitance: it only applies to inverting amplifiers.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain the Miller effect without a formula.", model: "In an inverting amplifier the output swings the opposite way to the input and many times bigger. A capacitor between them has the input change plus the big output change across it, so it draws far more current than its size suggests. From the input it looks like a capacitor about gain-plus-one times larger, connected to ground." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "BJT high end: C_i, C_o and f_β", mins: 30,
    blurb: "Shorts for the big capacitors, Thévenin for the small ones. Plus β itself falls with frequency.",
    takeaway: "High-frequency RC (series R, shunt C) gives A_v = 1/(1 + jf/f_H): −6 dB/octave above f_H. Big capacitors are shorts. Input: f_Hi = 1/(2πR_ThiC_i), R_Thi = R_s ∥ R₁ ∥ R₂ ∥ βr_e, C_i = C_Wi + C_be + (1 − A_v)C_bc. Output: f_Ho = 1/(2πR_ThoC_o), R_Tho = R_C ∥ R_L ∥ r_o, C_o = C_Wo + C_ce + (1 − 1/A_v)C_bc ≈ C_Wo + C_ce + C_bc. β falls too: h_fe = h_femid/(1 + jf/f_β), f_β = 1/[2πβ_midr_e(C_be + C_bc)], so f_β depends on the bias (r_e). f_T = h_femid·f_β, the frequency where β = 1. Common base is far better: f_β = f_α(1 − α). The lowest of f_Hi, f_Ho (and f_β) sets f_H.",
    steps: [
      { k: "learn", title: "The other RC", b: [
        `<p>Now the R is in series and the C goes to ground. As f rises, X<sub>C</sub> falls and the capacitor shorts the signal:</p>`,
        `<div class="eq">A<sub>v</sub> = 1/(1 + j f/f<sub>H</sub>)    −6 dB/octave above f<sub>H</sub></div>`,
        fig(bode({ x: [3, 9], xt: [3, 4, 5, 6, 7, 8, 9], series: [curve(hi(1e6))], marks: [{ x: 6, y: -3 }], texts: [{ x: 6.1, y: -1, s: "f_H" }], label: "A high-frequency first-order roll-off" })),
      ]},
      { k: "learn", title: "Where the little capacitors are", b: [
        `<p>Between transistor terminals: C<sub>be</sub> (largest), C<sub>bc</sub>, C<sub>ce</sub> (smallest, often not on the data sheet). Wiring: C<sub>Wi</sub> at the input, C<sub>Wo</sub> at the output. C<sub>s</sub>, C<sub>C</sub>, C<sub>E</sub> are shorts now.</p>`,
        `<p>C<sub>bc</sub> bridges input (base) and output (collector) of an inverting stage: <b>Miller</b>. Then each side is one R and one C:</p>`,
        `<div class="eq">f<sub>Hi</sub> = 1/(2πR<sub>Thi</sub>C<sub>i</sub>)    R<sub>Thi</sub> = R<sub>s</sub> ∥ R<sub>1</sub> ∥ R<sub>2</sub> ∥ βr<sub>e</sub>    C<sub>i</sub> = C<sub>Wi</sub> + C<sub>be</sub> + (1 − A<sub>v</sub>)C<sub>bc</sub></div>`,
        `<div class="eq">f<sub>Ho</sub> = 1/(2πR<sub>Tho</sub>C<sub>o</sub>)    R<sub>Tho</sub> = R<sub>C</sub> ∥ R<sub>L</sub> ∥ r<sub>o</sub>    C<sub>o</sub> = C<sub>Wo</sub> + C<sub>ce</sub> + C<sub>Mo</sub></div>`,
        seen("Thévenin: everything except the capacitor becomes one source and one resistor.", "03-network-theorems.html#p8", "Chapter 3, Part 8"),
      ]},
      { k: "check", title: "My amplifier at the high end", b: [
        `<p>Part 5's amplifier (A<sub>v</sub> = −96.0, βr<sub>e</sub> = 2.42 kΩ, R<sub>s</sub> = 600 Ω), plus C<sub>be</sub> = 30 pF, C<sub>bc</sub> = 3 pF, C<sub>ce</sub> = 1 pF, C<sub>Wi</sub> = 5 pF, C<sub>Wo</sub> = 6 pF.</p>`,
        { t: "num", q: "C_i?", a: 326.1, unit: "pF", tol: 0.01, hint: "5 + 30 + 97.0 × 3 pF.", why: "326 pF. The Miller part (291 pF) is nearly all of it." },
        { t: "num", q: "R_Thi?", a: 454.4, unit: "Ω", tol: 0.01, hint: "600 ∥ 47k ∥ 10k ∥ 2.42k.", why: "454 Ω." },
        { t: "num", q: "f_Hi?", a: 1.074, unit: "MHz", tol: 0.01, hint: "1/(2πR_ThiC_i).", why: "1.07 MHz." },
        { t: "num", q: "f_Ho? (C_o = 10.03 pF)", a: 8.184, unit: "MHz", tol: 0.01, hint: "R_Tho = 3.3k ∥ 4.7k = 1.94 kΩ.", why: "8.18 MHz. The input side wins: f_H ≈ 1.07 MHz." },
      ]},
      { k: "learn", title: "β falls too", b: [
        `<div class="eq">h<sub>fe</sub> = h<sub>femid</sub>/(1 + j f/f<sub>β</sub>)    f<sub>β</sub> = 1/[2πβ<sub>mid</sub>r<sub>e</sub>(C<sub>be</sub> + C<sub>bc</sub>)]</div>`,
        `<p>r<sub>e</sub> comes from the bias, so <b>f<sub>β</sub> depends on the bias design</b>. Where β has fallen all the way to 1 is f<sub>T</sub>:</p>`,
        `<div class="eq">f<sub>T</sub> = h<sub>femid</sub> f<sub>β</sub> ≅ 1/[2πr<sub>e</sub>(C<sub>be</sub> + C<sub>bc</sub>)]    common base: f<sub>β</sub> = f<sub>α</sub>(1 − α)</div>`,
        `<p class="aside">α barely changes over the same range: common base has much better high-frequency behaviour, and no Miller effect. That's why high-frequency transistors often quote common-base figures. (Example 9.14(b) says "Eq. (9.63)" but uses (9.62).)</p>`,
        ch(5, "05-bjt-ac-analysis.html", "p14", "Part 14", "The hybrid-π model those capacitances belong to."),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "My amplifier (β = 120, r_e = 20.19 Ω): f_β?", a: 1.991, unit: "MHz", tol: 0.01, hint: "C_be + C_bc = 33 pF.", why: "1/(2π × 120 × 20.19 × 33 pF) = 1.99 MHz: above f_Hi, so it doesn't set f_H here." },
        { t: "num", q: "f_T?", a: 238.9, unit: "MHz", tol: 0.01, hint: "β × f_β.", why: "239 MHz." },
      ]},
      { k: "play", title: "The whole picture", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const p = Object.assign({}, MY);
          function draw() {
            const a = bjtAmp(p), g = (ff) => lo(a.fLs)(ff) * lo(a.fLC)(ff) * lo(a.fLE)(ff) * hi(a.fHi)(ff) * hi(a.fHo)(ff);
            const fL = cross(g, -1, 4, true), fH = cross(g, 4, 9, false);
            f.innerHTML = bode({ x: [0, 9], xt: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], y: [-40, 5], series: [curve(g)], marks: [{ x: L10(fL), y: -3 }, { x: L10(fH), y: -3 }], texts: [{ x: L10(fL) + 0.15, y: -6, s: "f_L" }, { x: L10(fH) - 0.15, y: -6, s: "f_H", a: "end" }], label: "Full frequency response of the BJT amplifier" });
            ro.innerHTML = readout([["A<sub>v</sub> (midband)", fmt(a.Av, 3)], ["C<sub>i</sub>", si(a.Ci, "F", 3)], ["f<sub>Hi</sub>", hz(a.fHi)], ["f<sub>Ho</sub>", hz(a.fHo)], ["f<sub>L</sub> / f<sub>H</sub>", hz(fL) + " / " + hz(fH)], ["Bandwidth", hz(fH - fL)]]);
          }
          host.append(f,
            slider({ id: id + "-r", label: "R_s", min: 50, max: 10e3, log: true, value: p.Rs, show: (v) => ohm(v) }, (v) => { p.Rs = v; draw(); }).el,
            slider({ id: id + "-b", label: "C_bc (Miller)", min: 0.5e-12, max: 10e-12, log: true, value: p.Cbc, show: (v) => si(v, "F", 2) }, (v) => { p.Cbc = v; draw(); }).el, ro);
          draw();
        },
        `<p>A bigger source resistance pulls f<sub>Hi</sub> down: R<sub>Thi</sub> grows. A bigger C<sub>bc</sub> hurts more than it looks, because the gain multiplies it.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the input side usually the one that sets f_H in a common-emitter amplifier?", model: "Because the base-collector capacitance is multiplied by one minus the gain, the Miller effect, and adds to the input. That makes the input capacitance hundreds of picofarads, while the output side only gets about the original C_bc. Even with a smaller Thévenin resistance, the input RC ends up larger, so its corner is lower." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Gain–bandwidth product, and the FET high end", mins: 25,
    blurb: "Trade gain for bandwidth at a fixed product. Then the FET's version of C_i and C_o.",
    takeaway: "GBP = A_vmid·BW, and for a single high-frequency corner it stays constant when you change the gain. f_T = A_vmid·f_H is the unity-gain frequency: BW at any gain ≈ f_T/A_vmid. For a transistor alone, f_T = h_femid·f_β. FET high end: f_Hi = 1/(2πR_ThiC_i), R_Thi = R_sig ∥ R_G, C_i = C_Wi + C_gs + (1 − A_v)C_gd; f_Ho = 1/(2πR_ThoC_o), R_Tho = R_D ∥ R_L ∥ r_d, C_o = C_Wo + C_ds + (1 − 1/A_v)C_gd. C_gs, C_gd: 1–10 pF; C_ds: 0.1–1 pF. The input usually sets f_H.",
    steps: [
      { k: "play", title: "Trade gain for bandwidth", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let A = 100; const fT = 100e6;
          function draw() {
            const fH = fT / A;
            f.innerHTML = plot({ x: [3, 9], y: [-10, 65], xt: [3, 4, 5, 6, 7, 8, 9], xtf: (v) => si(Math.pow(10, v), "", 2).trim(), yt: [0, 20, 40, 60], xl: "f (Hz, log scale)", yl: "A_v (dB)",
              series: [{ f: (x) => db(A * hi(fH)(Math.pow(10, x))), cls: "s1", n: 400 }, { pts: [[6, 40], [8, 0]], cls: "s5" }],
              marks: [{ x: L10(fH), y: db(A) - 3 }, { x: 8, y: 0, cls: "mk2" }], texts: [{ x: 8.05, y: 4, s: "f_T" }, { x: L10(fH) + 0.1, y: db(A) + 3, s: "f_H" }], label: "Gain against frequency for a fixed gain-bandwidth product" });
            ro.innerHTML = readout([["A<sub>vmid</sub>", fmt(A, 3) + " (" + fmt(db(A), 3) + " dB)"], ["f<sub>H</sub> = f<sub>T</sub>/A<sub>vmid</sub>", hz(fH)], ["GBP", hz(A * fH)]]);
          }
          host.append(f, slider({ id: id + "-a", label: "Midband gain (f_T = 100 MHz)", min: 1, max: 1000, log: true, value: A, show: (v) => fmt(v, 3) }, (v) => { A = v; draw(); }).el, ro);
          draw();
        },
        `<div class="eq">GBP = A<sub>vmid</sub> × BW    f<sub>T</sub> = A<sub>vmid</sub> f<sub>H</sub>    (BW ≈ f<sub>H</sub> when f<sub>L</sub> ≪ f<sub>H</sub>)</div>`,
        `<p>Every gain lands on the same dashed −20 dB/decade line. Lower gain, wider band; the product is fixed. f<sub>T</sub> is where the gain reaches 1 (0 dB).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "An amplifier has f_T = 150 MHz. Bandwidth at a gain of 50?", a: 3, unit: "MHz", tol: 0.01, hint: "f_T/A_vmid.", why: "3 MHz." },
        { t: "num", q: "Same amplifier, you need 6 MHz of bandwidth. Highest gain?", a: 25, tol: 0.01, hint: "A = f_T/BW.", why: "25." },
      ]},
      { k: "learn", title: "The FET at high frequency", b: [
        `<p>Same steps as the BJT: big capacitors shorted, C<sub>gd</sub> bridges gate and drain (Miller), then two Thévenin circuits.</p>`,
        `<div class="eq">f<sub>Hi</sub> = 1/(2πR<sub>Thi</sub>C<sub>i</sub>)    R<sub>Thi</sub> = R<sub>sig</sub> ∥ R<sub>G</sub>    C<sub>i</sub> = C<sub>Wi</sub> + C<sub>gs</sub> + (1 − A<sub>v</sub>)C<sub>gd</sub></div>`,
        `<div class="eq">f<sub>Ho</sub> = 1/(2πR<sub>Tho</sub>C<sub>o</sub>)    R<sub>Tho</sub> = R<sub>D</sub> ∥ R<sub>L</sub> ∥ r<sub>d</sub>    C<sub>o</sub> = C<sub>Wo</sub> + C<sub>ds</sub> + (1 − 1/A<sub>v</sub>)C<sub>gd</sub></div>`,
        `<p class="aside">C<sub>gs</sub> and C<sub>gd</sub> are 1–10 pF; C<sub>ds</sub> is smaller, 0.1–1 pF.</p>`,
      ]},
      { k: "check", title: "Part 6's JFET amplifier", b: [
        `<p>R<sub>sig</sub> = 10 kΩ, R<sub>G</sub> = 2.2 MΩ, R<sub>D</sub> = 3.3 kΩ, R<sub>L</sub> = 10 kΩ, g<sub>m</sub> = 2.5 mS, r<sub>d</sub> = ∞. C<sub>gs</sub> = 5 pF, C<sub>gd</sub> = 2 pF, C<sub>ds</sub> = 0.6 pF, C<sub>Wi</sub> = 4 pF, C<sub>Wo</sub> = 5 pF.</p>`,
        { t: "num", q: "Midband A_v?", a: -6.203, tol: 0.01, hint: "−g_m(R_D ∥ R_L).", why: "−2.5 mS × 2.48 kΩ = −6.20." },
        { t: "num", q: "f_Hi?", a: 683.1, unit: "kHz", tol: 0.01, hint: "C_i = 4 + 5 + 7.20 × 2 = 23.4 pF; R_Thi = 9.95 kΩ.", why: "683 kHz." },
        { t: "num", q: "f_Ho?", a: 8.097, unit: "MHz", tol: 0.01, hint: "C_o = 5 + 0.6 + 1.161 × 2 = 7.92 pF; R_Tho = 2.48 kΩ.", why: "8.10 MHz. The input sets f_H ≈ 683 kHz." },
      ]},
      { k: "why", title: "Why the input again?", b: [
        { t: "mcq", q: "The FET's gain is only about 6, so its Miller capacitance is small. Why is f_Hi still the lower corner?", opts: [
          ["R_Thi includes R_sig, kilohms, against a much smaller output capacitance", true, "Right. R_Thi ≈ R_sig (R_G is huge) and C_i still has C_gs + C_Wi + C_Mi, while C_o is small."],
          ["Because the output never has a corner", false, "It does: f_Ho = 8.1 MHz here."],
          ["Because C_ds is the largest capacitance", false, "C_ds is the smallest."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a fixed gain–bandwidth product let you do in a design?", model: "It lets you predict the bandwidth at any gain by dividing the unity-gain frequency f_T by the gain. If you need more bandwidth, you accept less gain, and the other way round; the product stays roughly the same for a given device and design." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const shrink = (n) => Math.sqrt(Math.pow(2, 1 / n) - 1);
  const p10 = {
    id: "p10", title: "Several stages", mins: 20,
    blurb: "Identical stages in cascade: steeper slopes and a narrower band.",
    takeaway: "Each extra stage adds its corners: the high cutoff is set by the stage with the lowest f_H and the low cutoff by the one with the highest f_L, and stage 1's output capacitance now includes stage 2's input (wiring, C_be and Miller). For n identical stages, at the single-stage corner the gain is 3n dB down, slopes are 6n dB/octave, and f′_H = √(2^(1/n) − 1)·f_H, f′_L = f_L/√(2^(1/n) − 1). Factor: 0.64 (n=2), 0.51 (3), 0.43 (4), 0.39 (5). If f_β ≈ f_H, double n. But a fixed gain split across more stages (each with lower gain and wider band, fixed GBP) can increase the bandwidth.",
    steps: [
      { k: "play", title: "Add stages", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let n = 2; const fL = 100, fH = 1e6;
          function draw() {
            const k = shrink(n), g = (ff) => Math.pow(lo(fL)(ff) * hi(fH)(ff), n);
            f.innerHTML = bode({ x: [0, 8], y: [-40, 5], series: [curve((ff) => lo(fL)(ff) * hi(fH)(ff), "s5"), curve(g)], marks: [{ x: L10(fL / k), y: -3 }, { x: L10(fH * k), y: -3 }, { x: L10(fH), y: -3 * n, cls: "mk2" }], texts: [{ x: 3.3, y: 2, s: "dashed: one stage" }], label: "Normalized response of n identical stages" });
            ro.innerHTML = readout([["√(2^(1/n) − 1)", fmt(k, 3)], ["f′<sub>L</sub> = f<sub>L</sub>/factor", hz(fL / k)], ["f′<sub>H</sub> = factor × f<sub>H</sub>", hz(fH * k)], ["Gain at the old f<sub>H</sub>", "−" + 3 * n + " dB"], ["Slope beyond", 6 * n + " dB/octave"]]);
          }
          host.append(f, slider({ id: id + "-n", label: "Identical stages n (each f_L = 100 Hz, f_H = 1 MHz)", min: 1, max: 5, step: 1, value: n, show: (v) => String(v) }, (v) => { n = v; draw(); }).el, ro);
          draw();
        },
        `<div class="eq">f′<sub>H</sub> = √(2<sup>1/n</sup> − 1) f<sub>H</sub>    f′<sub>L</sub> = f<sub>L</sub>/√(2<sup>1/n</sup> − 1)</div>`,
        `<p>Where does it come from? n identical factors multiply: |A/A<sub>mid</sub>| = 1/[1 + (f/f<sub>H</sub>)²]<sup>n/2</sup>. Set that to 1/√2 and solve: [1 + (f/f<sub>H</sub>)²]<sup>n</sup> = 2.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Three identical stages, each f_H = 2 MHz. Overall f′_H?", a: 1.02, unit: "MHz", tol: 0.01, hint: "Factor 0.51 for n = 3.", why: "2 MHz × 0.510 = 1.02 MHz: half." },
        { t: "num", q: "Same stages, each f_L = 50 Hz. Overall f′_L?", a: 98.07, unit: "Hz", tol: 0.01, hint: "Divide by 0.510.", why: "98 Hz: almost double." },
      ]},
      { k: "whatif", title: "What if the total gain is fixed?", b: [
        `<p>You need a gain of 400. One stage with GBP = 40 MHz gives 400 at 100 kHz bandwidth.</p>`,
        { t: "num", q: "Two stages of gain 20 (20 × 20 = 400), each with the same 40 MHz GBP. Each stage's f_H?", a: 2, unit: "MHz", tol: 0.01, hint: "40 MHz/20.", why: "2 MHz per stage." },
        { t: "num", q: "Overall f′_H of the pair?", a: 1.287, unit: "MHz", tol: 0.01, hint: "× 0.644.", why: "1.29 MHz: thirteen times one stage's 100 kHz. More stages, wider band, when each does less." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does cascading identical stages shrink the bandwidth?", model: "At each stage's own cutoff, every stage is 3 dB down, so the total is 3 dB times the number of stages. The overall gain therefore reaches 3 dB down sooner: the upper cutoff moves lower and the lower cutoff moves higher, by the factor root of two to the one over n minus one." },
      ]},
    ],
  };

  /* =============== PART 11 =============== */
  /* Square wave (±1, frequency 1) through a first-order high-pass (fL) then low-pass (fH), both relative to fs. Returns samples of the last two periods. */
  function sqResponse(rL, rH) {
    const N = 4000, dt = 1 / N, a = 1 / (TAU * rL), b = 1 / (TAU * rH), A = a / (a + dt), B = dt / (b + dt), out = [];
    let xp = 1, y = 0, z = 0;
    for (let i = 0; i < 8 * N; i++) {
      const x = (i % N) < N / 2 ? 1 : -1;
      y = A * (y + x - xp); xp = x; z = z + B * (y - z);
      if (i >= 6 * N && i % 8 === 0) out.push([(i - 6 * N) * dt, z]);
    }
    return out;
  }
  const p11 = {
    id: "p11", title: "Square-wave testing", mins: 30,
    blurb: "Feed a square wave and read the bandwidth off the output shape.",
    takeaway: "A square wave is a sum of odd harmonics: v = (4V_m/π)[sin 2πf_st + (1/3) sin 2π3f_st + (1/5) sin 2π5f_st + …]. Up to the 9th harmonic (11% of the fundamental) are the main contributors, so a clean output means the amplifier passes about 9f_s: to test a 20 kHz amplifier use f_s ≥ 20 kHz/9 ≈ 2.2 kHz. Tilt (sloping top) = poor low-frequency response; rounded edges = poor high-frequency response. Rise time t_r from 10% to 90%: BW ≅ f_Hi = 0.35/t_r. Tilt P = (V − V′)/V; f_Lo = (P/π)f_s.",
    steps: [
      { k: "play", title: "Build a square wave", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let N = 3;
          function draw() {
            const sum = (t) => { let v = 0; for (let k = 1; k <= 2 * N - 1; k += 2) v += Math.sin(TAU * k * t) / k; return (4 / Math.PI) * v; };
            f.innerHTML = plot({ x: [0, 2], y: [-1.5, 1.5], xt: [0, 0.5, 1, 1.5, 2], yt: [-1, 0, 1], xl: "time (periods)", h: 220, series: [{ pts: [[0, 1], [0.5, 1], [0.5, -1], [1, -1], [1, 1], [1.5, 1], [1.5, -1], [2, -1]], cls: "s5" }, { f: sum, cls: "s1", n: 800 }], label: "Sum of odd harmonics approaching a square wave" });
          }
          host.append(f, slider({ id: id + "-n", label: "Odd harmonics included", min: 1, max: 15, step: 1, value: N, show: (v) => "up to the " + (2 * v - 1) + (2 * v - 1 === 1 ? "st (fundamental)" : (2 * v - 1) % 10 === 3 && 2 * v - 1 !== 13 ? "rd" : "th") }, (v) => { N = v; draw(); }).el);
          draw();
        },
        `<div class="eq">v = (4V<sub>m</sub>/π)[sin 2πf<sub>s</sub>t + ⅓ sin 2π(3f<sub>s</sub>)t + ⅕ sin 2π(5f<sub>s</sub>)t + …]</div>`,
        `<p>Only <b>odd</b> harmonics, each 1/n as big. Through the 9th (1/9 = 11%) they do most of the work. A clean square wave out means the amplifier passes everything up to about 9f<sub>s</sub>.</p>`,
        seen("Square waves and RC circuits in the time domain.", "10-first-order-transients.html#p6", "Chapter 10, Part 6"),
      ]},
      { k: "play", title: "Through an amplifier", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let fL = 20, fH = 30e3; const fs = 1000;
          function draw() {
            const pts = sqResponse(fL / fs, fH / fs);
            f.innerHTML = plot({ x: [0, 2], y: [-1.6, 1.6], xt: [0, 0.5, 1, 1.5, 2], yt: [-1, 0, 1], xl: "time (periods of a 1 kHz square wave)", h: 230, series: [{ pts: [[0, 1], [0.5, 1], [0.5, -1], [1, -1], [1, 1], [1.5, 1], [1.5, -1], [2, -1]], cls: "s5" }, { pts, cls: "s1" }], label: "Square wave in (dashed) and amplifier output" });
            const P = 1 - Math.exp(-TAU * fL * 0.5 / fs), tr = (0.35 / fH);
            ro.innerHTML = readout([["Tilt P (from f<sub>L</sub>)", fmt(P * 100, 3) + "%"], ["Rise time t<sub>r</sub> ≈ 0.35/f<sub>H</sub>", si(tr, "s", 3)], ["Diagnosis", (P > 0.1 ? "tilt: low end too weak. " : "") + (tr > 0.05 / fs ? "rounded edges: high end too weak." : "") || "a clean copy"]]);
          }
          host.append(f,
            slider({ id: id + "-l", label: "Amplifier f_L", min: 1, max: 1000, log: true, value: fL, show: (v) => hz(v) }, (v) => { fL = v; draw(); }).el,
            slider({ id: id + "-h", label: "Amplifier f_H", min: 1e3, max: 1e6, log: true, value: fH, show: (v) => hz(v) }, (v) => { fH = v; draw(); }).el, ro);
          draw();
        },
        `<div class="two"><div class="tile"><h3>Sloping top (tilt)</h3><p>The flat part is the lowest frequencies. A weak low end lets it sag: check f<sub>L</sub>.</p></div><div class="tile"><h3>Rounded edges</h3><p>The sharp edges are the highest frequencies. A weak high end slows them: check f<sub>H</sub>.</p></div></div>`,
      ]},
      { k: "learn", title: "Measuring off the screen", b: [
        `<div class="eq">BW ≅ f<sub>Hi</sub> = 0.35/t<sub>r</sub>    (t<sub>r</sub>: 10% to 90% of the step)</div>`,
        `<div class="eq">P = (V − V′)/V    f<sub>Lo</sub> = (P/π) f<sub>s</sub></div>`,
        `<p>V is the height at the start of the half-cycle, V′ at the end.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Output rise time (10–90%) is 8 µs. Bandwidth?", a: 43.75, unit: "kHz", tol: 0.01, hint: "0.35/t_r.", why: "43.75 kHz." },
        { t: "num", q: "A 2 kHz square wave comes out at 100 mV at the start of each half-cycle and 85 mV at the end. Tilt P (decimal)?", a: 0.15, tol: 0.01, hint: "(V − V′)/V.", why: "0.15, or 15%." },
        { t: "num", q: "Then f_Lo?", a: 95.49, unit: "Hz", tol: 0.01, hint: "(P/π)f_s.", why: "0.15/π × 2 kHz = 95.5 Hz." },
        { t: "num", q: "To test an amplifier meant to pass 30 kHz, lowest square-wave frequency?", a: 3333, unit: "Hz", tol: 0.01, hint: "The 9th harmonic should land at 30 kHz.", why: "30 kHz/9 = 3.33 kHz." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is a square wave a good quick test of an amplifier's frequency response?", model: "Because a square wave contains a fundamental plus a whole series of odd harmonics. One test signal checks many frequencies at once. A sagging top shows the low frequencies aren't passed well; rounded or slow edges show the high frequencies aren't. Measuring the tilt and the rise time gives the low and high cutoff frequencies." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edc9", eyebrow: "Boylestad · Chapter 9", title: "BJT and JFET Frequency Response",
    intro: `<p>Eleven parts: logs and decibels, what limits the gain at each end, one-RC Bode plots, then the low and high cutoff frequencies of BJT and JFET amplifiers, the Miller effect, gain–bandwidth, multistage effects and square-wave testing.</p><p>It builds on 6.002 Chapter 13 (frequency response) and on Chapters 5 and 8 here. Every amplifier so far lived in the "midband"; now you find where that band ends.</p><p class="aside">The "Computer Analysis" section isn't covered. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's problems in the book. They test whether the ideas stuck, so don't expect them to look like the examples here.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11],
    summary: `
      <h3>Logs and decibels</h3>
      <div class="eq">a = bˣ ⟺ x = log<sub>b</sub> a    ln a = 2.3 log a    log ab = log a + log b    log(a/b) = log a − log b</div>
      <div class="eq">G<sub>dB</sub> = 10 log(P<sub>2</sub>/P<sub>1</sub>) = 20 log(V<sub>2</sub>/V<sub>1</sub>)    cascades: dB gains add    0 dBm = 1 mW in 600 Ω</div>
      <h3>One RC</h3>
      <div class="eq">Low end: A<sub>v</sub> = 1/(1 − j f<sub>L</sub>/f)    High end: A<sub>v</sub> = 1/(1 + j f/f<sub>H</sub>)    f = 1/(2πRC)    −3 dB = 0.707, 6 dB/octave = 20 dB/decade</div>
      <h3>BJT low end</h3>
      <div class="eq">f<sub>Ls</sub> = 1/[2π(R<sub>s</sub> + R<sub>i</sub>)C<sub>s</sub>], R<sub>i</sub> = R<sub>1</sub> ∥ R<sub>2</sub> ∥ βr<sub>e</sub>    f<sub>LC</sub> = 1/[2π(R<sub>o</sub> + R<sub>L</sub>)C<sub>C</sub>], R<sub>o</sub> = R<sub>C</sub> ∥ r<sub>o</sub></div>
      <div class="eq">f<sub>LE</sub> = 1/(2πR<sub>e</sub>C<sub>E</sub>), R<sub>e</sub> = R<sub>E</sub> ∥ (R′<sub>s</sub>/β + r<sub>e</sub>), R′<sub>s</sub> = R<sub>s</sub> ∥ R<sub>1</sub> ∥ R<sub>2</sub>    A<sub>vs</sub> = [R<sub>i</sub>/(R<sub>i</sub> + R<sub>s</sub>)]A<sub>v</sub></div>
      <h3>FET low end</h3>
      <div class="eq">f<sub>LG</sub> = 1/[2π(R<sub>sig</sub> + R<sub>G</sub>)C<sub>G</sub>]    f<sub>LC</sub> = 1/[2π(R<sub>D</sub> ∥ r<sub>d</sub> + R<sub>L</sub>)C<sub>C</sub>]    f<sub>LS</sub> = 1/(2πR<sub>eq</sub>C<sub>S</sub>), R<sub>eq</sub> = R<sub>S</sub> ∥ 1/g<sub>m</sub></div>
      <h3>Miller</h3>
      <div class="eq">C<sub>Mi</sub> = (1 − A<sub>v</sub>)C<sub>f</sub>    C<sub>Mo</sub> = (1 − 1/A<sub>v</sub>)C<sub>f</sub> ≈ C<sub>f</sub>    inverting amplifiers only</div>
      <h3>High end</h3>
      <div class="eq">BJT: R<sub>Thi</sub> = R<sub>s</sub> ∥ R<sub>1</sub> ∥ R<sub>2</sub> ∥ βr<sub>e</sub>, C<sub>i</sub> = C<sub>Wi</sub> + C<sub>be</sub> + C<sub>Mi</sub>; R<sub>Tho</sub> = R<sub>C</sub> ∥ R<sub>L</sub> ∥ r<sub>o</sub>, C<sub>o</sub> = C<sub>Wo</sub> + C<sub>ce</sub> + C<sub>Mo</sub>    f = 1/(2πR<sub>Th</sub>C)</div>
      <div class="eq">FET: R<sub>Thi</sub> = R<sub>sig</sub> ∥ R<sub>G</sub>, C<sub>i</sub> = C<sub>Wi</sub> + C<sub>gs</sub> + (1 − A<sub>v</sub>)C<sub>gd</sub>; R<sub>Tho</sub> = R<sub>D</sub> ∥ R<sub>L</sub> ∥ r<sub>d</sub>, C<sub>o</sub> = C<sub>Wo</sub> + C<sub>ds</sub> + C<sub>Mo</sub></div>
      <div class="eq">f<sub>β</sub> = 1/[2πβ<sub>mid</sub>r<sub>e</sub>(C<sub>be</sub> + C<sub>bc</sub>)]    f<sub>T</sub> = h<sub>femid</sub>f<sub>β</sub>    f<sub>β</sub> = f<sub>α</sub>(1 − α)    GBP = A<sub>vmid</sub>BW, f<sub>T</sub> = A<sub>vmid</sub>f<sub>H</sub></div>
      <h3>Stages and testing</h3>
      <div class="eq">f′<sub>H</sub> = √(2<sup>1/n</sup> − 1) f<sub>H</sub>    f′<sub>L</sub> = f<sub>L</sub>/√(2<sup>1/n</sup> − 1)    BW ≅ 0.35/t<sub>r</sub>    P = (V − V′)/V, f<sub>Lo</sub> = (P/π)f<sub>s</sub></div>`,
  };
  Course.start(window.CHAPTER);
})();
