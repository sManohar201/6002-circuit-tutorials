(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;

  const p1 = {
    id: "p1", title: "e^x: growth and decay", mins: 15,
    blurb: "Each step of one time constant multiplies by the same factor. The 37%, 14%, 5%, 1% ladder.",
    takeaway: "e ≈ 2.718. e^x multiplies by e for every +1 in x; e^(−x) divides by e. Decay e^(−t/τ): 36.8% left after τ, 13.5% after 2τ, 5.0% after 3τ, 0.7% after 5τ (call it done). Rise 1 − e^(−t/τ): 63.2% after τ, 95% after 3τ. The diode's e^(V/V_T) grows tenfold every 2.3V_T ≈ 60 mV.",
    steps: [
      { k: "learn", title: "Same factor every step", b: [
        `<p>An exponential multiplies by the same amount for each equal step in x. For e<sup>x</sup> that factor is e ≈ 2.718 per step of 1.</p>`,
        `<div class="tbl"><table><tr><th>t/τ</th><th>0</th><th>1</th><th>2</th><th>3</th><th>5</th></tr><tr><td>e<sup>−t/τ</sup> (what's left)</td><td>1</td><td>0.368</td><td>0.135</td><td>0.050</td><td>0.007</td></tr><tr><td>1 − e<sup>−t/τ</sup> (how far)</td><td>0</td><td>0.632</td><td>0.865</td><td>0.950</td><td>0.993</td></tr></table></div>`,
      ]},
      { k: "play", title: "Walk along the curve", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let t = 1, mode = 0;
          function draw() {
            const g = mode ? (x) => 1 - Math.exp(-x) : (x) => Math.exp(-x);
            f.innerHTML = plot({ x: [0, 5], y: [0, 1.05], xt: [0, 1, 2, 3, 4, 5], xtf: (v) => (v ? v + "τ" : "0"), yt: [0, 0.368, 0.632, 1], xl: "t", h: 230, series: [{ f: g, cls: "s1" }], marks: [{ x: t, y: g(t) }], label: mode ? "Rising exponential" : "Decaying exponential" });
            ro.innerHTML = readout([["t/τ", fmt(t, 3)], [mode ? "1 − e^(−t/τ)" : "e^(−t/τ)", fmt(g(t), 4) + " = " + fmt(100 * g(t), 3) + "%"]]);
          }
          host.append(toggle(["Decay e^(−t/τ)", "Rise 1 − e^(−t/τ)"], (i) => { mode = i; draw(); }), f, slider({ id: id + "-t", label: "t/τ", min: 0, max: 5, step: 0.05, value: t }, (v) => { t = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">A capacitor charging through a resistor follows the rise; discharging follows the decay. Same curve, flipped.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A capacitor discharges from 10 V with τ = 2 ms. Voltage at t = 4 ms?", a: 1.353, unit: "V", tol: 0.01, hint: "t/τ = 2.", why: "10 × e⁻² = 1.35 V." },
        { t: "num", q: "Charging toward 12 V from 0. Voltage after 3τ?", a: 11.4, unit: "V", tol: 0.01, why: "12 × 0.950 = 11.4 V." },
        { t: "mcq", q: "Engineers say a transient is 'over' after about…", opts: [["5τ (less than 1% left)", true, "e⁻⁵ = 0.0067."], ["1τ", false, "Still 37% left."], ["Never", false, "Mathematically true, but after 5τ it's below anything you could measure easily."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What fraction of a decaying exponential is left after one time constant, and after two?", model: "After one time constant about 37 percent is left, because e to the minus one is 0.368. After two it's that fraction again, 0.368 times 0.368, about 13.5 percent." },
      ]},
    ],
  };

  const Is = 1e-14;
  const p2 = {
    id: "p2", title: "ln undoes e, and the log rules", mins: 20,
    blurb: "Logs turn multiplication into addition. That's how a diode's current comes back to a voltage.",
    takeaway: "ln is the inverse of e^x: ln(e^x) = x, e^(ln y) = y. Rules: ln(ab) = ln a + ln b; ln(a/b) = ln a − ln b; ln(aⁿ) = n·ln a; ln 1 = 0. log₁₀ x = ln x / 2.303. Diode: I = I_S·e^(V/(nV_T)) → V = nV_T·ln(I/I_S). Ten times the current adds nV_T·ln 10 ≈ 60 mV (n = 1, V_T = 26 mV).",
    steps: [
      { k: "learn", title: "Undo", b: [
        `<div class="eq">y = e<sup>x</sup>   ⟺   x = ln y</div>`,
        `<div class="tbl"><table><tr><th>Rule</th><th>Example</th></tr><tr><td>ln(ab) = ln a + ln b</td><td>ln 20 = ln 2 + ln 10</td></tr><tr><td>ln(a/b) = ln a − ln b</td><td>ln(1/2) = −ln 2 = −0.693</td></tr><tr><td>ln(a<sup>n</sup>) = n ln a</td><td>ln 1000 = 3 ln 10 = 6.91</td></tr><tr><td>log₁₀ x = ln x / ln 10</td><td>ln 10 = 2.303</td></tr></table></div>`,
      ]},
      { k: "learn", title: "Solve the diode for V", b: [
        `<p>Forward-biased, the −1 in Shockley's equation is negligible: I ≈ I<sub>S</sub>e<sup>V/(nV<sub>T</sub>)</sup>.</p>`,
        `<div class="eq">I/I<sub>S</sub> = e<sup>V/(nV<sub>T</sub>)</sup>   →   V = nV<sub>T</sub> ln(I/I<sub>S</sub>)</div>`,
        `<p class="aside">V<sub>T</sub> here is the thermal voltage, about 26 mV at room temperature (6.002 calls it V<sub>TH</sub>).</p>`,
      ]},
      { k: "play", title: "Decades of current", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let lg = -3;
          function draw() {
            const I = Math.pow(10, lg), V = 0.026 * Math.log(I / Is);
            f.innerHTML = plot({ x: [-9, -1], y: [0.2, 0.9], xt: [-9, -7, -5, -3, -1], xtf: (v) => ({ "-9": "1n", "-7": "100n", "-5": "10µ", "-3": "1m", "-1": "100m" })[v], yt: [0.2, 0.4, 0.6, 0.8], xl: "I (A), log scale", yl: "V (V)", h: 230, series: [{ f: (x) => 0.026 * Math.log(Math.pow(10, x) / Is), cls: "s1" }], marks: [{ x: lg, y: V }], label: "Diode voltage against current on a log scale: a straight line" });
            ro.innerHTML = readout([["I", si(I, "A", 3)], ["V = V_T ln(I/I_S)", fmt(V, 4) + " V"], ["Per decade of current", "+" + fmt(1000 * 0.026 * Math.log(10), 3) + " mV"]]);
          }
          host.append(f, slider({ id: id + "-i", label: "log₁₀ I", min: -9, max: -1, step: 0.1, value: lg, show: (v) => si(Math.pow(10, v), "A", 2) }, (v) => { lg = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">I<sub>S</sub> = 10⁻¹⁴ A, n = 1. On a log axis the exponential becomes a straight line: each ×10 in current adds the same 60 mV.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "I_S = 10⁻¹⁴ A, n = 1, V_T = 26 mV. V at I = 2 mA?", a: 0.678, unit: "V", tol: 0.01, hint: "ln(2 × 10¹¹) = ln 2 + 11 ln 10.", why: "0.026 × 26.0 = 0.678 V." },
        { t: "num", q: "ln(e⁴ × e⁻¹) = ?", a: 3, tol: 0, why: "ln(e³) = 3: exponents add when you multiply." },
        { t: "mcq", q: "A diode's current goes from 1 mA to 100 mA. Its voltage rises by about…", opts: [["120 mV", true, "Two decades × 60 mV."], ["6 V", false, "The voltage barely moves: that's the point of the log."], ["60 mV", false, "That's one decade."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a diode's voltage change only about 60 mV when its current goes up ten times?", model: "The current is an exponential of the voltage, so the voltage is a log of the current. Multiplying the current by ten adds a fixed amount to its log, V_T times ln 10, which is about 60 millivolts at room temperature." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Solving for a time", mins: 20,
    blurb: "How long until a capacitor reaches a voltage? Take the log of the exponential.",
    takeaway: "v(t) = V_f + (V_i − V_f)e^(−t/τ) → t = τ·ln[(V_i − V_f)/(v − V_f)]. Charging from 0 toward V_f to a fraction k: t = τ·ln(1/(1 − k)). k = 63.2% → τ; 2/3 → 1.10τ (the 555's 1.1RC); 90% → 2.30τ; 99% → 4.6τ. UJT oscillator: T = RC·ln(1/(1 − η)).",
    steps: [
      { k: "learn", title: "Isolate the exponential, then log", b: [
        `<div class="eq">v = V<sub>f</sub> + (V<sub>i</sub> − V<sub>f</sub>)e<sup>−t/τ</sup></div>`,
        `<div class="tbl"><table><tr><th>Do to both sides</th><th>Equation now</th></tr><tr><td>− V_f, then ÷ (V_i − V_f)</td><td class="mono">(v − V_f)/(V_i − V_f) = e^(−t/τ)</td></tr><tr><td>ln</td><td class="mono">ln[(v − V_f)/(V_i − V_f)] = −t/τ</td></tr><tr><td>× (−τ), flip the fraction</td><td class="mono">t = τ ln[(V_i − V_f)/(v − V_f)]</td></tr></table></div>`,
      ]},
      { k: "play", title: "Time to a threshold", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let k = 2 / 3;
          function draw() {
            const t = Math.log(1 / (1 - k));
            f.innerHTML = plot({ x: [0, 5], y: [0, 1.05], xt: [0, 1, 2, 3, 4, 5], xtf: (v) => (v ? v + "τ" : "0"), yt: [0, k, 1], ytf: (v) => (v === k ? fmt(100 * k, 3) + "%" : fmt(v)), xl: "t", h: 230, series: [{ f: (x) => 1 - Math.exp(-x), cls: "s1" }, { f: () => k, cls: "s5" }], marks: [{ x: t, y: k }], label: "Charging curve and a threshold line" });
            ro.innerHTML = readout([["Threshold k", fmt(100 * k, 3) + "% of the final value"], ["t = τ ln(1/(1 − k))", fmt(t, 4) + " τ"]]);
          }
          host.append(f, slider({ id: id + "-k", label: "Threshold", min: 0.05, max: 0.99, step: 0.005, value: k, show: (v) => fmt(100 * v, 3) + "%" }, (v) => { k = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">As a one-shot, the 555 timer charges from 0 to ⅔ of the supply: set 66.7% here and you get the 1.1 in t = 1.1RC. Running free it charges from ⅓ to ⅔, which gives ln 2 = 0.693, the number in its astable formulas.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "τ = 1 ms, charging from 0. Time to reach 90% of the final value?", a: 2.303, unit: "ms", tol: 0.01, why: "ln 10 = 2.30 ms." },
        { t: "num", q: "A capacitor at 10 V discharges toward 0 with τ = 5 ms. When does it reach 2 V?", a: 8.05, unit: "ms", tol: 0.01, hint: "t = τ ln(10/2).", why: "5 × ln 5 = 8.05 ms." },
        { t: "num", q: "A capacitor charges from 3 V toward 12 V, τ = 0.5 ms. Time to reach 9 V?", a: 0.549, unit: "ms", tol: 0.01, hint: "t = τ ln[(V_i − V_f)/(v − V_f)] = 0.5 ln(−9/−3).", why: "0.5 × ln 3 = 0.549 ms." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe the steps to find how long an RC circuit takes to reach a given voltage.", model: "Write the voltage as final value plus initial minus final times e to the minus t over tau. Get the exponential alone by subtracting the final value and dividing, then take the natural log of both sides and multiply by minus tau to get the time." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m8", eyebrow: "Math Toolkit · Module 8", title: "Exponentials and Logarithms",
    intro: `<p>Three parts: the shape of e<sup>x</sup>, logs and their rules, and solving for a time. Diodes, BJTs, RC and RL transients, timers and oscillators all run on these.</p>`,
    after: `<p>The time-constant ladder (37%, 14%, 5%, under 1% at 5τ) is worth knowing by heart. It answers many transient questions without a calculator.</p>`,
    parts: [p1, p2, p3],
    summary: `
      <p>e ≈ 2.718. Decay e<sup>−t/τ</sup>: 0.368 at τ, 0.135 at 2τ, 0.050 at 3τ, 0.007 at 5τ. Rise 1 − e<sup>−t/τ</sup>: 0.632 at τ, 0.95 at 3τ.</p>
      <p>ln(ab) = ln a + ln b · ln(a/b) = ln a − ln b · ln(a<sup>n</sup>) = n ln a · log₁₀ x = ln x/2.303 · ln 2 = 0.693, ln 10 = 2.303.</p>
      <div class="eq">I = I<sub>S</sub>e<sup>V/nV<sub>T</sub></sup> → V = nV<sub>T</sub>ln(I/I<sub>S</sub>)     ≈ 60 mV per decade (n = 1)</div>
      <div class="eq">t = τ ln[(V<sub>i</sub> − V<sub>f</sub>)/(v − V<sub>f</sub>)]     fraction k from 0: t = τ ln(1/(1 − k))</div>`,
  };
  Course.start(window.CHAPTER);
})();
