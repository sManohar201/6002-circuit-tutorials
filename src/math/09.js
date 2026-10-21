(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const dB = (r) => 20 * Math.log10(r);

  const p1 = {
    id: "p1", title: "dB is a log of a ratio", mins: 15,
    blurb: "10 log for power, 20 log for voltage. A few anchor values cover most problems.",
    takeaway: "Power ratio: G_dB = 10 log₁₀(P₂/P₁). Voltage (or current) ratio: G_dB = 20 log₁₀(V₂/V₁): 20 because power goes as V². Anchors for voltage: ×2 → +6 dB, ×10 → +20 dB, ×100 → +40 dB, ×0.707 → −3 dB, ×0.5 → −6 dB, ×0.1 → −20 dB. Back from dB: ratio = 10^(dB/20). Ratios below 1 give negative dB.",
    steps: [
      { k: "learn", title: "Two formulas", b: [
        `<div class="two"><div class="tile"><h3>Power</h3><div class="eq">10 log₁₀(P<sub>2</sub>/P<sub>1</sub>)</div></div><div class="tile"><h3>Voltage or current</h3><div class="eq">20 log₁₀(V<sub>2</sub>/V<sub>1</sub>)</div></div></div>`,
        `<p>Why 20? Power is V²/R, and log(V²) = 2 log V. Doubling the voltage quadruples the power, and both give the same +6 dB.</p>`,
      ]},
      { k: "play", title: "Ratio to dB", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let r = 2;
          function draw() {
            f.innerHTML = plot({ x: [-2, 3], y: [-40, 60], xt: [-2, -1, 0, 1, 2, 3], xtf: (v) => "×" + fmt(Math.pow(10, v)), yt: [-40, -20, 0, 20, 40, 60], xl: "voltage ratio", yl: "dB", h: 230, series: [{ f: (x) => 20 * x, cls: "s1" }], marks: [{ x: Math.log10(r), y: dB(r) }], label: "Decibels against voltage ratio on a log axis" });
            ro.innerHTML = readout([["Voltage ratio", "×" + fmt(r, 4)], ["20 log₁₀", fmt(dB(r), 4) + " dB"], ["Same ratio as power: 10 log₁₀", fmt(10 * Math.log10(r), 4) + " dB"]]);
          }
          host.append(f, slider({ id: id + "-r", label: "Ratio", min: 0.01, max: 1000, log: true, value: r, show: (v) => "×" + fmt(v, 3) }, (v) => { r = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Try ×0.707: −3 dB, the half-power point that defines a cutoff frequency.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A_v = 250. In dB?", a: 47.96, unit: "dB", tol: 0.005, hint: "20 log 250 = 20(log 2.5 + 2).", why: "≈ 48 dB." },
        { t: "num", q: "A filter passes 0.2 of the input voltage. Gain in dB?", a: -13.98, unit: "dB", tol: 0.01, why: "20 log 0.2 = −14 dB." },
        { t: "num", q: "A gain of 34 dB is what voltage ratio?", a: 50.1, tol: 0.01, hint: "10^(34/20).", why: "≈ 50." },
        { t: "mcq", q: "Output power halves. Change in dB?", opts: [["−3 dB", true, "10 log 0.5 = −3.01."], ["−6 dB", false, "That's voltage halving."], ["−50 dB", false, "Decibels are logs, not percentages."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is it 20 log for voltage ratios but 10 log for power ratios?", model: "Decibels are defined for power, as ten times the log of the power ratio. Power goes as voltage squared, and the log of a square is twice the log, so the same change written as a voltage ratio needs twenty times the log." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Cascades add in dB", mins: 15,
    blurb: "Multiply gains, or just add their decibels. Plus dBm, which compares with 1 mW.",
    takeaway: "Stages in cascade multiply: A_T = A₁A₂A₃. Because log(ab) = log a + log b, their dB values simply add: 20 dB + 14 dB − 3 dB = 31 dB. dBm compares a power with 1 mW: dBm = 10 log₁₀(P/1 mW). 0 dBm = 1 mW, 30 dBm = 1 W. (Boylestad's tables also use dBm across 600 Ω.)",
    steps: [
      { k: "play", title: "Three stages", b: [
        (host, id) => {
          const ro = el(`<div></div>`), f = el(`<div class="fig"></div>`);
          const g = [20, 14, -3];
          function draw() {
            const tot = g[0] + g[1] + g[2];
            let s = "", x = 20;
            g.forEach((v, i) => { s += S.box(x, 20, 120, 50, "×" + fmt(Math.pow(10, v / 20), 3)) + S.t(x + 60, 92, fmt(v, 3) + " dB"); if (i < 2) s += `<line class="w" x1="${x + 120}" y1="45" x2="${x + 165}" y2="45"/>`; x += 165; });
            f.innerHTML = S.svg(520, 105, s, { label: "Three amplifier stages in cascade" });
            ro.innerHTML = readout([["Multiply the ratios", "×" + fmt(Math.pow(10, tot / 20), 4)], ["Add the dB", fmt(tot, 4) + " dB"]]);
          }
          host.append(f, ...g.map((v, i) => slider({ id: id + i, label: "Stage " + (i + 1), min: -20, max: 40, step: 1, value: v, show: (x) => x + " dB" }, (x) => { g[i] = x; draw(); }).el), ro);
          draw();
        },
      ]},
      { k: "learn", title: "dBm: against 1 mW", b: [
        `<div class="eq">dBm = 10 log₁₀(P / 1 mW)</div>`,
        `<div class="tbl"><table><tr><th>P</th><th>1 µW</th><th>1 mW</th><th>10 mW</th><th>100 mW</th><th>1 W</th></tr><tr><td>dBm</td><td>−30</td><td>0</td><td>10</td><td>20</td><td>30</td></tr></table></div>`,
        `<p class="aside">An absolute power level, not a gain. A 20 dB amplifier turns −10 dBm into +10 dBm.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Stages of 26 dB, 18 dB and −6 dB. Total voltage ratio?", a: 79.4, tol: 0.01, hint: "Add: 38 dB. Then 10^(38/20).", why: "38 dB ≈ ×79.4." },
        { t: "num", q: "0.5 W in dBm?", a: 26.99, unit: "dBm", tol: 0.005, why: "10 log 500 = 27 dBm." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can you add decibels for stages in cascade?", model: "The total gain is the product of the stage gains, and the log of a product is the sum of the logs. Decibels are logs, so the total in dB is just the sum of each stage's dB." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Decades, octaves and log axes", mins: 15,
    blurb: "A log axis spaces ×10 steps equally. Slopes are quoted per decade or per octave.",
    takeaway: "A decade is ×10 in frequency; an octave is ×2. Number of decades between f₁ and f₂ = log₁₀(f₂/f₁); octaves = log₂(f₂/f₁) = 3.32·log₁₀(f₂/f₁). A slope of −20 dB/decade is −6 dB/octave. On a log axis, 2 sits about 30% of the way across a decade, 5 about 70%.",
    steps: [
      { k: "play", title: "Walk a log axis", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let fq = 2000;
          function draw() {
            const X = (v) => 30 + ((Math.log10(v) - 1) / 4) * 460;
            let s = `<line class="w" x1="30" y1="50" x2="490" y2="50"/>`;
            for (let d = 1; d <= 5; d++) for (let m = 1; m < 10; m++) { const v = m * Math.pow(10, d); if (v > 1e5) break; s += `<line class="w" x1="${X(v)}" y1="${m === 1 ? 38 : 44}" x2="${X(v)}" y2="${m === 1 ? 62 : 56}"/>`; if (m === 1) s += S.t(X(v), 80, si(v, "Hz", 1)); }
            s += `<circle class="nd" cx="${X(fq)}" cy="50" r="8"/>`;
            f.innerHTML = S.svg(520, 95, s, { label: "Logarithmic frequency axis from 10 Hz to 100 kHz" });
            ro.innerHTML = readout([["f", si(fq, "Hz", 3)], ["Decades above 100 Hz", fmt(Math.log10(fq / 100), 3)], ["Octaves above 100 Hz", fmt(Math.log2(fq / 100), 3)]]);
          }
          host.append(f, slider({ id: id + "-f", label: "Frequency", min: 10, max: 1e5, log: true, value: fq, show: (v) => si(v, "Hz", 3) }, (v) => { fq = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The gaps between 1, 2, 3 … 9 shrink, and every decade looks the same. That's what lets one graph show 10 Hz and 100 kHz together.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "From 50 Hz to 5 kHz is how many decades?", a: 2, tol: 0, why: "5000/50 = 100 = 10²." },
        { t: "num", q: "From 1 kHz to 8 kHz is how many octaves?", a: 3, tol: 0, why: "8 = 2³." },
        { t: "num", q: "Gain falls at −20 dB/decade. How much does it fall from 3 kHz to 24 kHz? (dB)", a: -18, unit: "dB", tol: 0.02, hint: "That's 3 octaves; −20 dB/decade = −6 dB/octave.", why: "−18 dB (exactly −18.06)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between a decade and an octave, and how do −20 dB/decade and −6 dB/octave relate?", model: "A decade is a factor of ten in frequency and an octave a factor of two. A ten-times step in voltage ratio is 20 dB and a two-times step is about 6 dB, so a slope that falls 20 dB per decade falls about 6 dB per octave." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m9", eyebrow: "Math Toolkit · Module 9", title: "Decibels and Log Scales",
    intro: `<p>Three parts: what a decibel is, adding dB through a chain of stages, and reading log frequency axes. You need these for every frequency-response graph in both books. <a href="08-exp-log.html">Module 8</a> covers logs themselves.</p>`,
    after: `<p>Learn the anchors (6 dB per ×2, 20 dB per ×10, −3 dB at ×0.707) and most dB questions become mental arithmetic.</p>`,
    parts: [p1, p2, p3],
    summary: `
      <div class="eq">10 log₁₀(P<sub>2</sub>/P<sub>1</sub>)     20 log₁₀(V<sub>2</sub>/V<sub>1</sub>)     ratio = 10<sup>dB/20</sup></div>
      <p>×2 → 6 dB · ×10 → 20 dB · ×0.707 → −3 dB · ×0.5 → −6 dB. Cascades: dB add. dBm = 10 log(P/1 mW).</p>
      <p>Decade ×10, octave ×2. Decades = log₁₀(f₂/f₁); octaves = 3.32 log₁₀(f₂/f₁). −20 dB/decade = −6 dB/octave.</p>`,
  };
  Course.start(window.CHAPTER);
})();
