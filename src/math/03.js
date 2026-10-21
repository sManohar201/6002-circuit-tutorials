(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const ohm = (r) => si(r, "Ω", 3);
  const par = (a, b) => (a * b) / (a + b);
  /* A horizontal bar split into two coloured pieces, with labels. */
  const bar = (fa, la, lb, title) => S.svg(520, 96, `<rect x="20" y="30" width="${480 * fa}" height="34" style="fill:var(--accent);opacity:.75"/><rect x="${20 + 480 * fa}" y="30" width="${480 * (1 - fa)}" height="34" style="fill:var(--cool);opacity:.55"/><rect x="20" y="30" width="480" height="34" class="box" style="fill:none"/>` + S.t(20, 20, la, { a: "start", cls: "lab" }) + S.t(500, 20, lb, { a: "end", cls: "lab" }) + S.t(260, 88, title), { label: title });

  const p1 = {
    id: "p1", title: "Reciprocals and parallel resistors", mins: 15,
    blurb: "Product over sum, and three shortcuts to sanity-check it.",
    takeaway: "Parallel: 1/R = 1/R₁ + 1/R₂ + …; for two, R = R₁R₂/(R₁ + R₂) (product over sum). Checks: the result is smaller than the smallest; two equal resistors give half; n equal give R/n; with a 10:1 ratio the result is about 9% below the smaller one, and at 100:1 about 1% below.",
    steps: [
      { k: "learn", title: "Product over sum", b: [
        `<p>Conductances (1/R) add in parallel, because the currents add. Then flip back:</p>`,
        `<div class="eq">R<sub>1</sub> ∥ R<sub>2</sub> = 1/(1/R<sub>1</sub> + 1/R<sub>2</sub>) = R<sub>1</sub>R<sub>2</sub>/(R<sub>1</sub> + R<sub>2</sub>)</div>`,
        `<p class="aside">The product-over-sum form only works for <b>two</b> at a time. For three, either add three reciprocals or combine two first and then the third.</p>`,
      ]},
      { k: "play", title: "Two in parallel", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 6e3, b = 3e3;
          function draw() {
            const r = par(a, b), mx = Math.max(a, b);
            const row = (y, v, lab, cls) => `<rect x="120" y="${y}" width="${Math.max(2, (380 * v) / mx)}" height="22" style="fill:var(--${cls});opacity:.7"/>` + S.t(110, y + 16, lab, { a: "end" }) + S.t(126 + Math.max(2, (380 * v) / mx), y + 16, ohm(v), { a: "start", cls: "lab" });
            f.innerHTML = S.svg(560, 120, row(10, a, "R_1", "cool") + row(44, b, "R_2", "cool") + row(78, r, "R_1 ∥ R_2", "accent"), { label: "Bar lengths of R1, R2 and their parallel combination" });
            ro.innerHTML = readout([["R₁R₂/(R₁ + R₂)", ohm(r)], ["Below the smaller one by", fmt((100 * (Math.min(a, b) - r)) / Math.min(a, b), 3) + "%"], ["Ratio larger : smaller", fmt(mx / Math.min(a, b), 3) + " : 1"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "R₁", min: 100, max: 1e6, log: true, value: a, show: ohm }, (v) => { a = v; draw(); }).el,
            slider({ id: id + "-b", label: "R₂", min: 100, max: 1e6, log: true, value: b, show: ohm }, (v) => { b = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Try making them equal, then make one 10× and 100× the other. Watch how the result approaches the smaller resistor.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "12 kΩ ∥ 4 kΩ = ?", a: 3, unit: "kΩ", hint: "48/16.", why: "3 kΩ, below the smaller (4 kΩ) as it must be." },
        { t: "num", q: "Three 15 kΩ resistors in parallel = ?", a: 5, unit: "kΩ", hint: "n equal: R/n.", why: "5 kΩ." },
        { t: "mcq", q: "Without a calculator: 2.2 kΩ ∥ 220 kΩ is about…", opts: [["2.18 kΩ (1% below 2.2 kΩ)", true, "100:1 ratio: about 1% below the smaller."], ["111 kΩ", false, "That's the average. Parallel is always below the smaller one."], ["1.1 kΩ", false, "Halving is for equal resistors."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must a parallel combination be smaller than the smallest resistor?", model: "Adding a resistor in parallel gives the current an extra path, so the total current for a given voltage goes up. More current at the same voltage means less resistance than the smallest path alone." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Ratios and dividers", mins: 20,
    blurb: "A divider hands out the voltage in proportion to resistance, and current in the opposite proportion.",
    takeaway: "A ratio is a part over a whole. Voltage divider: V₂ = V × R₂/(R₁ + R₂): the bigger resistor gets the bigger share. Current divider (two branches): I₁ = I × R₂/(R₁ + R₂): the opposite resistor on top, so the smaller resistor gets more current. Gain is also a ratio: A_v = V_out/V_in.",
    steps: [
      { k: "learn", title: "Share in proportion", b: [
        `<p>In series, the same current flows through both resistors, so each one's voltage is in proportion to its resistance.</p>`,
        `<div class="eq">V<sub>2</sub> = V × R<sub>2</sub> / (R<sub>1</sub> + R<sub>2</sub>)</div>`,
        `<p class="aside">R<sub>2</sub>/(R<sub>1</sub> + R<sub>2</sub>) is a fraction between 0 and 1: the share of the whole that R<sub>2</sub> gets.</p>`,
      ]},
      { k: "play", title: "Slide the split", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let V = 12, r1 = 8.2e3, r2 = 2.2e3;
          function draw() {
            const fr = r2 / (r1 + r2);
            f.innerHTML = bar(1 - fr, "V on R_1: " + fmt(V * (1 - fr), 3) + " V", "V on R_2: " + fmt(V * fr, 3) + " V", "Voltage share of a series pair");
            const I = 1e-3, i1 = (I * r2) / (r1 + r2);
            ro.innerHTML = readout([["R₂/(R₁ + R₂)", fmt(fr, 3)], ["V₂ = V × share", fmt(V * fr, 3) + " V"], ["If instead 1 mA splits between them in parallel: I₁ = I·R₂/(R₁+R₂)", si(i1, "A", 3)], ["… and I₂ = I·R₁/(R₁+R₂)", si(I - i1, "A", 3)]]);
          }
          host.append(f, slider({ id: id + "-a", label: "R₁", min: 100, max: 100e3, log: true, value: r1, show: ohm }, (v) => { r1 = v; draw(); }).el,
            slider({ id: id + "-b", label: "R₂", min: 100, max: 100e3, log: true, value: r2, show: ohm }, (v) => { r2 = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">In series the big resistor takes the big voltage. In parallel the small resistor takes the big current. That's why the current formula has the other resistor on top.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "18 V across 10 kΩ (top) and 5 kΩ (bottom). V on the bottom?", a: 6, unit: "V", hint: "Share = 5/15.", why: "18 × 1/3 = 6 V." },
        { t: "num", q: "6 mA splits between 2 kΩ and 4 kΩ in parallel. Current in the 2 kΩ?", a: 4, unit: "mA", hint: "Other resistor on top: 6 × 4/(2 + 4).", why: "4 mA: the smaller resistor takes two thirds." },
        { t: "num", q: "An amplifier takes 25 mV in and gives 3.5 V out. Gain A_v = V_out/V_in?", a: 140, hint: "Same units first: 3500 mV/25 mV.", why: "140." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In a two-branch current divider, why does the formula for I₁ have R₂ on top?", model: "In parallel both branches have the same voltage, so current is inversely proportional to resistance. The branch with less resistance takes more current, so the share for branch one depends on how big the other branch's resistance is." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Percent: error, change, regulation, efficiency", mins: 20,
    blurb: "Every percent is a part over a whole × 100. The trick is knowing which number is the whole.",
    takeaway: "Percent = (part/whole) × 100. Change: (new − old)/old. Error: (approx − exact)/exact. Load regulation: (V_NL − V_FL)/V_FL. Efficiency: P_out/P_in. Tolerance ±t%: from R(1 − t/100) to R(1 + t/100). Always ask: percent of what?",
    steps: [
      { k: "learn", title: "Percent of what?", b: [
        `<div class="tbl"><table><tr><th>Quantity</th><th>Formula (× 100%)</th><th>"Whole"</th></tr>
          <tr><td>Change</td><td>(new − old)/old</td><td>the old value</td></tr>
          <tr><td>Error</td><td>(approx − exact)/exact</td><td>the exact value</td></tr>
          <tr><td>Voltage regulation</td><td>(V<sub>NL</sub> − V<sub>FL</sub>)/V<sub>FL</sub></td><td>full-load voltage</td></tr>
          <tr><td>Efficiency η</td><td>P<sub>out</sub>/P<sub>in</sub></td><td>input power</td></tr>
          <tr><td>Ripple r</td><td>V<sub>r</sub>(rms)/V<sub>dc</sub></td><td>the dc level</td></tr></table></div>`,
      ]},
      { k: "play", title: "Tolerance bands", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let t = 5, r1 = 10e3, r2 = 4.7e3;
          function draw() {
            const k = t / 100, lo = (r2 * (1 - k)) / (r1 * (1 + k) + r2 * (1 - k)), hi = (r2 * (1 + k)) / (r1 * (1 - k) + r2 * (1 + k)), nom = r2 / (r1 + r2), V = 15;
            f.innerHTML = plot({ x: [0.25, 0.4], y: [0, 1], xt: [0.25, 0.3, 0.35, 0.4], yt: [], xl: "share", h: 120, areas: [{ f: () => 1, from: lo, to: hi, cls: "ar1" }], series: [{ pts: [[nom, 0], [nom, 1]], cls: "s1" }], label: "Range of the divider ratio" });
            ro.innerHTML = readout([["R₁ range", ohm(r1 * (1 - k)) + " to " + ohm(r1 * (1 + k))], ["R₂ range", ohm(r2 * (1 - k)) + " to " + ohm(r2 * (1 + k))], ["Divider output from 15 V, nominal", fmt(V * nom, 4) + " V"], ["Worst cases", fmt(V * lo, 4) + " V to " + fmt(V * hi, 4) + " V"], ["Spread vs nominal", "−" + fmt((100 * (nom - lo)) / nom, 3) + "% / +" + fmt((100 * (hi - nom)) / nom, 3) + "%"]]);
          }
          host.append(f, slider({ id: id + "-t", label: "Tolerance ±", min: 0, max: 20, step: 1, value: t, show: (v) => v + "%" }, (v) => { t = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The worst case puts one resistor high and the other low. Here two 5% resistors make about a 7% spread in the output.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A supply gives 12.6 V with no load and 12.0 V at full load. Regulation?", a: 5, unit: "%", hint: "Divide by the full-load value.", why: "0.6/12 = 5%." },
        { t: "num", q: "An amplifier draws 20 W from the supply and delivers 15.6 W to the speaker. Efficiency?", a: 78, unit: "%", why: "15.6/20 = 78%." },
        { t: "num", q: "Exact I_C = 2.06 mA; an approximate method gave 2.12 mA. Percent error?", a: 2.91, unit: "%", tol: 0.03, hint: "(approx − exact)/exact.", why: "0.06/2.06 = 2.9%." },
        { t: "num", q: "Largest value of a 4.7 kΩ ±10% resistor? (kΩ)", a: 5.17, unit: "kΩ", why: "4.7 × 1.1 = 5.17 kΩ." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Two people compute the percent change from 10 V to 8 V and get 20% and 25%. Who is right, and what went wrong?", model: "The change is 2 volts; as a percent of the old value of 10 volts that's a 20 percent drop. The 25 percent person divided by the new value instead. Percent change is always measured against the starting value." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m3", eyebrow: "Math Toolkit · Module 3", title: "Fractions, Ratios and Percent",
    intro: `<p>Three parts: parallel resistors, divider ratios, and percents. Dividers and parallel combinations show up in nearly every circuit, and the percent quantities (regulation, efficiency, ripple, error) fill the later Boylestad chapters.</p>`,
    after: `<p>Before trusting any parallel combination, check it's below the smaller resistor. Before any percent, say out loud what the "whole" is.</p>`,
    parts: [p1, p2, p3],
    summary: `
      <div class="eq">R<sub>1</sub> ∥ R<sub>2</sub> = R<sub>1</sub>R<sub>2</sub>/(R<sub>1</sub> + R<sub>2</sub>)     n equal: R/n</div>
      <p>10:1 → about 9% below the smaller; 100:1 → about 1% below.</p>
      <div class="eq">V<sub>2</sub> = V·R<sub>2</sub>/(R<sub>1</sub> + R<sub>2</sub>)     I<sub>1</sub> = I·R<sub>2</sub>/(R<sub>1</sub> + R<sub>2</sub>)</div>
      <p>Percent = part/whole × 100. Change: (new − old)/old · error: (approx − exact)/exact · regulation: (V<sub>NL</sub> − V<sub>FL</sub>)/V<sub>FL</sub> · efficiency: P<sub>out</sub>/P<sub>in</sub> · ripple: V<sub>r</sub>(rms)/V<sub>dc</sub>. Tolerance ±t%: R(1 ± t/100).</p>`,
  };
  Course.start(window.CHAPTER);
})();
