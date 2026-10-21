(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const PRE = [[-12, "p", "pico", "a small capacitor: 22 pF"], [-9, "n", "nano", "a gate delay: 2 ns"], [-6, "µ", "micro", "a base current: 40 µA"], [-3, "m", "milli", "a collector current: 2 mA"], [0, "", "(none)", "a battery: 9 V"], [3, "k", "kilo", "a resistor: 4.7 kΩ"], [6, "M", "mega", "an input resistance: 1 MΩ"], [9, "G", "giga", "a clock: 3 GHz"]];
  const sup = (n) => String(n).replace("-", "⁻").replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);

  const p1 = {
    id: "p1", title: "Powers of ten", mins: 15,
    blurb: "Write any number as a few digits × 10ⁿ, and multiply by adding exponents.",
    takeaway: "Scientific notation: digits × 10ⁿ. Positive n moves the decimal point right (big numbers), negative n moves it left (small numbers). Multiply → add the exponents; divide → subtract them: (3 × 10³)(2 × 10⁻⁶) = 6 × 10⁻³. 10⁰ = 1.",
    steps: [
      { k: "learn", title: "Count the jumps", b: [
        `<p>Circuits mix huge and tiny numbers: a 1 000 000 Ω resistor carrying 0.000 002 A. Counting zeros is slow and error-prone, so write them as <b>digits × 10ⁿ</b>.</p>`,
        `<div class="two"><div class="tile"><h3>Big</h3><div class="eq">4700 = 4.7 × 10³</div><p class="aside">Decimal point jumped 3 places left, so n = +3.</p></div><div class="tile"><h3>Small</h3><div class="eq">0.000 04 = 4 × 10⁻⁵</div><p class="aside">Decimal point jumped 5 places right, so n = −5.</p></div></div>`,
      ]},
      { k: "play", title: "Slide the exponent", b: [
        (host, id) => {
          const ro = el(`<div></div>`), f = el(`<div class="fig"></div>`);
          let n = 3;
          function draw() {
            const W = 520, X = (k) => 30 + ((k + 12) / 21) * 460;
            let s = `<line class="w" x1="30" y1="60" x2="490" y2="60"/>`;
            for (let k = -12; k <= 9; k++) s += `<line class="w" x1="${X(k)}" y1="${k % 3 ? 54 : 48}" x2="${X(k)}" y2="${k % 3 ? 66 : 72}"/>` + (k % 3 ? "" : S.t(X(k), 92, "10" + sup(k)));
            s += `<circle class="nd" cx="${X(n)}" cy="60" r="9"/>` + S.t(X(n), 36, fmt(Math.pow(10, n), 3), { cls: "lab" });
            f.innerHTML = S.svg(W, 110, s, { label: "Number line of powers of ten" });
            const p = PRE.slice().reverse().find((q) => q[0] <= n);
            ro.innerHTML = readout([["10" + sup(n), n >= 0 ? "1" + "0".repeat(n) : "0." + "0".repeat(-n - 1) + "1"], ["Nearest prefix at or below", `${p[2]} (${p[1] || "none"}) = 10${sup(p[0])}`], ["Example", p[3]]]);
          }
          host.append(f, slider({ id: id + "-n", label: "Exponent n", min: -12, max: 9, step: 1, value: n }, (v) => { n = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Each step right multiplies by 10. Every third step has a prefix name, which is the next part.</p>`,
      ]},
      { k: "learn", title: "Multiply: add the exponents", b: [
        `<div class="eq">(a × 10<sup>m</sup>)(b × 10<sup>n</sup>) = ab × 10<sup>m+n</sup></div>`,
        `<div class="eq">(a × 10<sup>m</sup>) / (b × 10<sup>n</sup>) = (a/b) × 10<sup>m−n</sup></div>`,
        `<p>Example: a 10 kΩ resistor with a 0.1 µF capacitor has time constant τ = RC:</p>`,
        `<div class="eq">(1 × 10⁴)(1 × 10⁻⁷) = 1 × 10⁻³ s = 1 ms</div>`,
        `<p class="aside">Do the digits and the exponents separately. Then tidy up so the digits are between 1 and 10.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "(3 × 10⁴)(5 × 10⁻⁶) = ? (as a plain decimal)", a: 0.15, hint: "Digits: 3 × 5 = 15. Exponents: 4 + (−6) = −2. So 15 × 10⁻².", why: "15 × 10⁻² = 0.15." },
        { t: "num", q: "(8 × 10⁻³)/(2 × 10³) = 4 × 10ⁿ. What is n?", a: -6, tol: 0, hint: "Subtract the exponents: −3 − 3.", why: "n = −6: 4 × 10⁻⁶." },
        { t: "mcq", q: "Which is the same as 0.0022?", opts: [["2.2 × 10⁻³", true, "The point moves 3 places right to make 2.2."], ["2.2 × 10³", false, "That's 2200: a big number."], ["22 × 10⁻²", false, "22 × 0.01 = 0.22. Off by a factor of 100."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you multiply two numbers written in scientific notation, and why does it work?", model: "Multiply the front digits, add the exponents. It works because 10 to the m times 10 to the n is just m tens multiplied by n more tens, which is 10 to the m plus n." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Prefixes, and pairs that cancel", mins: 15,
    blurb: "Each prefix is a factor of 1000. Some prefix pairs cancel and save you the exponent work.",
    takeaway: "p = 10⁻¹², n = 10⁻⁹, µ = 10⁻⁶, m = 10⁻³, k = 10³, M = 10⁶, G = 10⁹. Moving one prefix step is ×1000 or ÷1000: 0.047 µF = 47 nF. Handy cancelling pairs: kΩ × mA = V, MΩ × µA = V, V / kΩ = mA, kΩ × µF = ms, MΩ × µF = s.",
    steps: [
      { k: "learn", title: "The ladder", b: [
        fig(S.svg(520, 120, PRE.map((p, i) => S.box(10 + i * 63, 20, 56, 44, p[1] || "—") + S.t(38 + i * 63, 84, "10" + sup(p[0])) + S.t(38 + i * 63, 104, p[2] === "(none)" ? "unit" : p[2])).join(""), { label: "Prefix ladder from pico to giga" })),
        `<p>One step up the ladder is ×1000. To change prefix, move the decimal point <b>3 places per step</b>. Going to a smaller prefix makes the number bigger.</p>`,
        `<div class="eq">2.2 mA = 2200 µA      47 000 pF = 47 nF</div>`,
      ]},
      { k: "play", title: "Convert", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let v = 0.047, from = 2, to = 1;
          const row = (lab, start, set) => { const w = el(`<div><p class="aside" style="margin:0">${lab}</p></div>`); w.append(toggle(PRE.map((p) => p[1] || "unit"), (i) => { set(i); draw(); }, start)); return w; };
          function draw() {
            const shift = 3 * (PRE[from][0] / 3 - PRE[to][0] / 3), out = v * Math.pow(10, shift);
            ro.innerHTML = readout([["You have", fmt(v, 3) + " " + (PRE[from][1] || "") + "F"], ["Steps on the ladder", `${Math.abs(shift / 3)} (${shift >= 0 ? "×" : "÷"}${fmt(Math.pow(10, Math.abs(shift)))})`], ["Converted", +out.toPrecision(4) + " " + (PRE[to][1] || "") + "F"]]);
          }
          host.append(slider({ id: id + "-v", label: "Value", min: 0.001, max: 1000, log: true, value: v, show: (x) => fmt(x, 3) }, (x) => { v = +x.toPrecision(2); draw(); }).el, row("From", from, (i) => (from = i)), row("To", to, (i) => (to = i)), ro);
          draw();
        },
      ]},
      { k: "learn", title: "Pairs that cancel", b: [
        `<p>kilo × milli = 10³ × 10⁻³ = 1. So when Ohm's law mixes kΩ and mA, the prefixes vanish:</p>`,
        `<div class="tbl"><table><tr><th>You multiply</th><th>You get</th></tr><tr><td>kΩ × mA</td><td>V</td></tr><tr><td>MΩ × µA</td><td>V</td></tr><tr><td>V ÷ kΩ</td><td>mA</td></tr><tr><td>kΩ × µF</td><td>ms</td></tr><tr><td>MΩ × µF</td><td>s</td></tr><tr><td>mA × V</td><td>mW</td></tr></table></div>`,
        `<p class="aside">Most transistor-bias work stays in kΩ, mA and V all the way through. You never need an exponent.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "0.33 µF in nF?", a: 330, unit: "nF", hint: "µ → n is one step down the ladder: ×1000.", why: "330 nF." },
        { t: "num", q: "A 3.3 kΩ resistor carries 1.5 mA. Voltage across it?", a: 4.95, unit: "V", hint: "kΩ × mA = V.", why: "3.3 × 1.5 = 4.95 V." },
        { t: "num", q: "9 V across 18 kΩ. Current?", a: 0.5, unit: "mA", hint: "V ÷ kΩ = mA.", why: "0.5 mA." },
        { t: "mcq", q: "τ = RC with R = 2.2 MΩ and C = 0.5 µF is…", opts: [["1.1 s", true, "MΩ × µF = s."], ["1.1 ms", false, "That would be kΩ × µF."], ["1.1 µs", false, "Mega and micro cancel; nothing is left over."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a current in mA times a resistance in kΩ give volts with no conversion?", model: "Milli is ten to the minus three and kilo is ten to the plus three. Multiplying them gives ten to the zero, which is one, so the prefixes cancel and the answer is in plain volts." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Units check your answer", mins: 15,
    blurb: "Carry the units through a formula. If they come out wrong, the formula is wrong.",
    takeaway: "Treat units like algebra: Ω = V/A, W = V·A, F = C/V, so RC has units of seconds and L/R too. If a result's units don't match what you want (watts for power, seconds for time), the setup is wrong. Estimate with rounded numbers first (9.6 V / 4.7 kΩ ≈ 10/5 = 2 mA) to catch slipped exponents. Give final answers to about 3 significant figures.",
    steps: [
      { k: "learn", title: "Units are algebra", b: [
        `<div class="two"><div class="tile"><h3>Definitions</h3><p>Ω = V/A<br>W = V × A<br>F = C/V (coulombs per volt)<br>A = C/s</p></div><div class="tile"><h3>So</h3><p>R × C = (V/A)(C/V) = C/A = <b>s</b><br>V²/R = V² ÷ (V/A) = V·A = <b>W</b><br>I²R = A² × V/A = <b>W</b></p></div></div>`,
        `<p class="aside">You don't need to memorise these results. Work them out when you need them.</p>`,
      ]},
      { k: "check", title: "What comes out?", b: [
        { t: "sort", q: "Sort each product by the unit it gives.", bins: ["V", "W", "s"], items: [["I × R", 0, "A × V/A = V."], ["V × I", 1, "Power."], ["R × C", 2, "The RC time constant."], ["V² / R", 1, "V × V/(V/A) = V·A."], ["L / R", 2, "Henry = V·s/A, ÷ (V/A) = s."], ["Q / C", 0, "C ÷ (C/V) = V."]] },
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<p>Someone writes the power in a resistor as <b>P = V² × R</b>, and gets 12 V, 1 kΩ → 144 000 W.</p>`,
        { t: "mcq", q: "How do units catch the mistake?", opts: [["V² × Ω = V² × V/A = V³/A, not watts", true, "Watts are V × A. The formula should be V²/R: 144 mW."], ["They don't. The number is just big", false, "144 kW from a 12 V circuit should raise alarms, and the units confirm it."], ["Only by plugging into a simulator", false, "Unit algebra catches it on paper in seconds."]] },
      ]},
      { k: "learn", title: "Estimate first", b: [
        `<p>Before using the calculator, round each number to one digit and work it in your head. Then the calculator's answer has to land near that.</p>`,
        `<div class="eq">9.6 V ÷ 4.7 kΩ ≈ 10 ÷ 5 = 2 mA   (exact 2.04 mA)</div>`,
        `<p class="aside">A slipped exponent gives 0.002 mA or 2000 mA, which the estimate catches at once. The books give answers to about 3 significant figures (2.04 mA), so do the same.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Estimate in your head, then check: 23 V × 1.9 mA ≈ ? mW", a: 43.7, unit: "mW", tol: 0.05, hint: "Round: 20 × 2 = 40.", why: "Exact 43.7 mW: close to the estimate of 40." },
        { t: "mcq", q: "Someone computes the time constant of 5 mH and 2 kΩ as 10 s. What went wrong?", opts: [["They multiplied: τ = L/R = 2.5 µs", true, "L × R has units of H·Ω, not seconds. L/R = 5 × 10⁻³ / 2 × 10³ = 2.5 × 10⁻⁶ s."], ["Nothing", false, "Check the units of L × R."], ["They should have used ms", false, "The formula itself is wrong, not just the prefix."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Give two quick checks you can make on any answer before trusting it.", model: "First, carry the units through and make sure they come out as what you want, like watts for power. Second, round every number to one digit and estimate in your head; the real answer should be close to that estimate, which catches slipped exponents." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m1", eyebrow: "Math Toolkit · Module 1", title: "Numbers, Prefixes and Units",
    intro: `<p>Three short parts: powers of ten, the prefix ladder, and using units to catch mistakes. You'll use these on every page of both books.</p>`,
    after: `<p>Keep the prefix ladder in mind and estimate before you calculate. It saves more marks than anything else in this toolkit.</p>`,
    parts: [p1, p2, p3],
    summary: `
      <div class="eq">(a × 10<sup>m</sup>)(b × 10<sup>n</sup>) = ab × 10<sup>m+n</sup>     (a × 10<sup>m</sup>)/(b × 10<sup>n</sup>) = (a/b) × 10<sup>m−n</sup></div>
      <div class="tbl"><table><tr><th>p</th><th>n</th><th>µ</th><th>m</th><th>k</th><th>M</th><th>G</th></tr><tr><td>10⁻¹²</td><td>10⁻⁹</td><td>10⁻⁶</td><td>10⁻³</td><td>10³</td><td>10⁶</td><td>10⁹</td></tr></table></div>
      <p>Cancelling pairs: kΩ × mA = V · MΩ × µA = V · V/kΩ = mA · kΩ × µF = ms · MΩ × µF = s · mA × V = mW.</p>
      <p>Units: Ω = V/A, W = V·A, F = C/V; RC and L/R are in seconds; V²/R and I²R are in watts. Estimate with one-digit numbers first; answer to 3 significant figures.</p>`,
  };
  Course.start(window.CHAPTER);
})();
