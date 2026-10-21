(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;

  /* ---------- device models ---------- */
  const IS = 1e-12, VT = 0.025;
  const idio = (v) => IS * (Math.exp(v / VT) - 1);
  // Solve v + R·i(v) = E for a diode in series with R (bisection; the left side always increases with v).
  function solveDiode(E, R) {
    let lo = Math.min(E, 0) - 0.1, hi = Math.max(E, 0) + 0.1;
    for (let k = 0; k < 90; k++) { const m = (lo + hi) / 2; if (m + R * idio(m) - E > 0) hi = m; else lo = m; }
    return (lo + hi) / 2;
  }

  /* ---------- drawings ---------- */
  // E, R in series with a device on the right (diode or generic box)
  function seriesFig(o = {}) {
    const L = Object.assign({ E: "E", R: "R", dev: "diode", v: "v_D" }, o);
    let s = S.wire([50, 92], [50, 30], [80, 30]) + S.res(80, 30, 210, 30, L.R) + S.wire([210, 30], [260, 30]) + S.wire([50, 128], [50, 190], [260, 190]) + S.vsrc(50, 110, L.E, { side: "right" });
    if (L.dev === "diode") s += S.diode(260, 30, 260, 190, "");
    else if (L.dev === "short") s += S.wc("hl", [260, 30], [260, 190]) + S.t(248, 115, "ON = short", { a: "end", cls: "a" });
    else if (L.dev === "open") s += S.wire([260, 30], [260, 85]) + S.wire([260, 135], [260, 190]) + S.t(248, 115, "OFF = open", { a: "end", cls: "a" });
    else s += S.wire([260, 30], [260, 88]) + S.wire([260, 132], [260, 190]) + S.box(238, 88, 44, 44, "NL");
    s += S.t(286, 66, "+", { cls: "big" }) + S.t(286, 166, "−", { cls: "big" }) + S.t(294, 118, L.v, { a: "start", cls: "big a" }) + S.arrow(234, 46, 234, 76, "i_D", { lx: 222, ly: 66, a: "end" });
    return S.svg(380, 210, s, { max: 380, label: o.label || "A source, a resistor and a nonlinear device in one loop" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Meet the nonlinear elements", mins: 20,
    blurb: "Diodes and square-law devices: v–i curves that bend.",
    takeaway: "A nonlinear resistor still has one fixed v–i curve, but the curve isn't a straight line. The diode's current grows exponentially: about ×10 for every 58 mV more.",
    steps: [
      { k: "learn", title: "A resistor whose graph bends", b: [
        `<p>Chapter 1 called it a <b>nonlinear resistor</b>: an element with a fixed v–i relation that isn't a straight line through the origin.</p>`,
        `<div class="two">
          <div class="tile"><h3>Diode</h3><p class="mono">i<sub>D</sub> = I<sub>s</sub>(e<sup>v<sub>D</sub>/V<sub>TH</sub></sup> − 1)</p><p class="aside">Silicon: I<sub>s</sub> ≈ 10⁻¹² A, V<sub>TH</sub> ≈ 0.025 V</p></div>
          <div class="tile"><h3>Square-law device</h3><p class="mono">i = K(v − V<sub>T</sub>)²/2 for v ≥ V<sub>T</sub>, else 0</p><p class="aside">A preview of the MOSFET (Chapter 7).</p></div></div>`,
        fig(S.svg(300, 120, S.wire([30, 60], [120, 60]) + S.diode(120, 60, 180, 60, "") + S.wire([180, 60], [270, 60]) + S.arrow(70, 40, 105, 40, "i_D", { ly: 32 }) + S.t(40, 92, "+", { cls: "big" }) + S.t(260, 92, "−", { cls: "big" }) + S.t(150, 100, "v_D", { cls: "a" }), { max: 300, label: "Diode symbol with its current and voltage labels" })),
        `<p class="aside">The triangle points the way current flows easily.</p>`,
      ]},
      { k: "play", title: "Drive a diode", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let v = 0.5;
          function draw() {
            const i = idio(v);
            f.innerHTML = plot({ x: [-0.2, 0.8], y: [0, 30], xt: [-0.2, 0, 0.2, 0.4, 0.6, 0.8], yt: [0, 10, 20, 30], xl: "v_D (V)", yl: "i_D (mA)",
              series: [{ f: (x) => idio(x) * 1000, cls: "s1", n: 400 }], marks: [{ x: v, y: Math.min(30, i * 1000), label: si(i, "A") }], label: "Diode v–i curve" });
            ro.innerHTML = readout([["v_D", fmt(v) + " V"], ["i_D", si(i, "A")]]);
          }
          host.append(f, slider({ id: id + "-v", label: "Diode voltage v_D", min: -0.2, max: 0.75, step: 0.005, value: v, show: (x) => fmt(x) + " V" }, (x) => { v = x; draw(); }).el, ro);
          draw();
        },
        `<p>Below about 0.5 V almost nothing flows. Past about 0.6 V the current explodes. Backward (negative v<sub>D</sub>) only about −10⁻¹² A flows.</p>`,
      ]},
      { k: "predict", title: "The 58 mV rule", b: [
        `<p>Raise v<sub>D</sub> by Δv and the current multiplies by e<sup>Δv/0.025</sup>.</p>`,
        { t: "mcq", q: "About how much extra voltage multiplies the diode current by 10?", opts: [
          ["About 58 mV", true, "e^(Δv/0.025) = 10 gives Δv = 0.025 × ln 10 ≈ 0.058 V. Every 58 mV more means 10× the current. That's why a diode's voltage barely moves once it conducts."],
          ["About 0.6 V", false, "0.6 V is roughly where a diode turns on. The ×10 step is much smaller."],
          ["About 5 mV", false, "5 mV only multiplies by e^0.2 ≈ 1.2."],
        ]},
        { t: "num", q: "A diode carries 0.5 mA at 0.50 V. Roughly what does it carry at 0.558 V?", a: 5, tol: 0.1, unit: "mA", hint: "0.558 − 0.50 is one '58 mV step'.", why: "One step of ×10: about 5 mA." },
      ]},
      { k: "check", title: "Square-law device", b: [
        `<p>Square-law device with K = 2 mA/V² and V<sub>T</sub> = 1 V: i = K(v − 1)²/2 for v ≥ 1 V.</p>`,
        { t: "num", q: "Current at v = 3 V?", a: 4, unit: "mA", hint: "(3 − 1)² = 4. Then × K/2 = × 1 mA/V².", why: "2 × 4/2 = 4 mA." },
        { t: "num", q: "Current at v = 0.5 V?", a: 0, unit: "mA", hint: "Check which branch of the rule applies.", why: "v < V_T, so i = 0." },
        { t: "num", q: "It carries 9 mA. What is v?", a: 4, unit: "V", hint: "9 = (v − 1)². Take the square root, and pick the root that fits v ≥ 1.", why: "v − 1 = 3, so v = 4 V. (v − 1 = −3 would give v = −2, where the device carries nothing.)" },
      ]},
      { k: "check", title: "Devices in parallel", b: [
        fig(S.svg(320, 170, S.wire([50, 67], [50, 20], [260, 20]) + S.wire([50, 103], [50, 150], [260, 150]) + S.vsrc(50, 85, "3 V", { side: "right" }) + S.wire([160, 20], [160, 63]) + S.wire([160, 107], [160, 150]) + S.box(140, 63, 40, 44, "NL") + S.wire([260, 20], [260, 63]) + S.wire([260, 107], [260, 150]) + S.box(240, 63, 40, 44, "NL") + S.dot(160, 20) + S.dot(160, 150), { max: 320, label: "Two identical nonlinear devices in parallel across 3 V" })),
        { t: "num", q: "Two of those square-law devices sit in parallel across 3 V. Total current from the source?", a: 8, unit: "mA", hint: "Parallel → same voltage on each. Each one carries what you found at 3 V.", why: "4 + 4 = 8 mA. Series and parallel rules still hold. They're KCL and KVL, which don't care about linearity." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What makes a diode 'nonlinear', and what would you see if you doubled its voltage from 0.35 V to 0.7 V?", model: "Its current isn't proportional to its voltage. It grows exponentially. Doubling the voltage from 0.35 V to 0.7 V wouldn't double the current. It would multiply it by e^14, over a million times." },
      ]},
    ],
  };

  /* =============== PART 2 (math) =============== */
  const p2 = {
    id: "p2", title: "Math boost: exponentials, logs, quadratics", mins: 20,
    blurb: "The three tools this chapter's equations need.",
    takeaway: "ln undoes e^x, which is how you get a diode's voltage from its current. The quadratic formula solves square-law circuits; keep only the root the device's rule allows.",
    steps: [
      { k: "math", title: "e and ln", b: [
        `<p><b>e ≈ 2.718.</b> e<sup>x</sup> grows by the same <b>factor</b> for every equal step in x.</p>`,
        `<div class="tbl"><table><tbody>
          <tr><td>Multiply ↔ add</td><td class="mono">e<sup>a+b</sup> = e<sup>a</sup> · e<sup>b</sup></td></tr>
          <tr><td>ln undoes e</td><td class="mono">ln(e<sup>x</sup>) = x,  e<sup>ln y</sup> = y</td></tr>
          <tr><td>ln of a product</td><td class="mono">ln(a·b) = ln a + ln b</td></tr>
          <tr><td>handy values</td><td class="mono">ln 10 ≈ 2.303,  e⁴ ≈ 54.6</td></tr></tbody></table></div>`,
        { t: "num", q: "e^(0.1/0.025) = ?", a: 54.6, tol: 0.02, hint: "0.1/0.025 = 4.", why: "e⁴ ≈ 54.6. So 100 mV more across a diode means about 55× more current." },
      ]},
      { k: "math", title: "Turn current into voltage", b: [
        `<p>Forward-biased, the "−1" is tiny, so i ≈ I<sub>s</sub>e<sup>v/V<sub>TH</sub></sup>. Solve for v:</p>`,
        { t: "reveal", label: "Show the steps", html: `<div class="tbl"><table><tbody>
          <tr><td>divide by I<sub>s</sub></td><td class="mono">i/I<sub>s</sub> = e<sup>v/V<sub>TH</sub></sup></td></tr>
          <tr><td>take ln of both sides</td><td class="mono">ln(i/I<sub>s</sub>) = v/V<sub>TH</sub></td></tr>
          <tr><td>× V<sub>TH</sub></td><td class="mono">v = V<sub>TH</sub> · ln(i/I<sub>s</sub>)</td></tr></tbody></table></div>` },
        { t: "num", q: "I_s = 10⁻¹² A, V_TH = 0.025 V. What voltage gives i = 1 mA?", a: 0.518, tol: 0.02, unit: "V", hint: "i/I_s = 10⁻³/10⁻¹² = 10⁹. ln(10⁹) = 9 × ln 10.", hint2: "9 × 2.303 ≈ 20.7. Then × 0.025.", why: "0.025 × 20.7 ≈ 0.52 V." },
      ]},
      { k: "math", title: "The quadratic formula", b: [
        `<div class="eq">a·x² + b·x + c = 0  ⟹  x = (−b ± √(b² − 4ac)) / 2a</div>`,
        `<p>The ± gives two roots. In circuits, usually <b>only one makes physical sense</b>.</p>`,
        `<p>Example: x² + x − 6 = 0 → a = 1, b = 1, c = −6.</p>`,
        { t: "reveal", label: "Work it", html: `<p class="mono">√(1 + 24) = 5 → x = (−1 ± 5)/2 → x = 2 or x = −3</p><p>Check: 2² + 2 − 6 = 0 ✓. Factoring gives the same: (x − 2)(x + 3) = 0.</p>` },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Solve x² + 2x − 8 = 0. Give the positive root.", a: 2, hint: "a = 1, b = 2, c = −8. √(4 + 32) = 6.", why: "(−2 + 6)/2 = 2. The other root is −4." },
        { t: "num", q: "Solve 2x² + x − 3 = 0. Give the positive root.", a: 1, hint: "a = 2, b = 1, c = −3. √(1 + 24) = 5. Don't forget 2a = 4.", why: "(−1 + 5)/4 = 1. The other root is −1.5." },
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<p>A student solves x² − 4x + 3 = 0 and writes x = (−4 ± √(16 − 12))/2 = −1 or −3.</p>`,
        { t: "mcq", q: "What went wrong?", opts: [
          ["b is −4, so −b is +4. The roots are (4 ± 2)/2 = 3 or 1", true, "Watch the sign of b. Check: 3² − 12 + 3 = 0 ✓ and 1 − 4 + 3 = 0 ✓."],
          ["The square root should be √(16 + 12)", false, "b² − 4ac = 16 − 4·1·3 = 4. The minus is right."],
          ["Quadratics only have one root", false, "They have two (sometimes equal, sometimes not real)."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do you need ln to find a diode's voltage from its current?", model: "The current depends on e raised to the voltage. To get the voltage out of the exponent you need the inverse of e^x, which is ln. Taking ln of both sides brings the voltage down where you can solve for it." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Method 1: solve it exactly", mins: 20,
    blurb: "The node method still works. Superposition doesn't.",
    takeaway: "KVL, KCL and the node method don't need linearity, so write them as usual and substitute the device law. Superposition and Thévenin need linearity, but you can still Thévenin the linear part facing one nonlinear device.",
    steps: [
      { k: "learn", title: "What survives without linearity?", b: [
        `<p>KVL and KCL come straight from Maxwell's equations and the lumped matter discipline. They never assumed linearity. So the <b>node method</b> works on any circuit.</p>`,
        { t: "sort", q: "Which tools still work on a circuit with a nonlinear element?", bins: ["Still works", "Needs linearity"], items: [
          ["KVL and KCL", 0, "Pure physics. No linearity assumed."],
          ["The node method", 0, "It's just KCL with element laws substituted. Use the nonlinear law for the device."],
          ["Superposition over the whole circuit", 1, "Superposition depends on every response being a sum of one-source terms. A nonlinear element breaks that."],
          ["Thévenin of the linear part facing one nonlinear device", 0, "That part is linear, so you can reduce it to v_TH and R_TH, then attach the device."],
          ["A Thévenin equivalent that includes the nonlinear device", 1, "Thévenin needs a linear network. With the device inside, it isn't."],
        ]},
      ]},
      { k: "learn", title: "Square-law device + resistor", b: [
        fig(seriesFig({ E: "E", R: "R", dev: "box" })),
        `<p>Device law: i<sub>D</sub> = K·v<sub>D</sub>² for v<sub>D</sub> > 0, and 0 otherwise. KCL at the top of the device:</p>`,
        `<div class="eq">(v<sub>D</sub> − E)/R + K·v<sub>D</sub>² = 0  ⟹  RK·v<sub>D</sub>² + v<sub>D</sub> − E = 0</div>`,
        `<p>A quadratic in v<sub>D</sub>: Part 2's formula solves it.</p>`,
      ]},
      { k: "check", title: "Put numbers in", b: [
        fig(seriesFig({ E: "6 V", R: "1 kΩ", dev: "box" })),
        `<p>R = 1 kΩ, K = 1 mA/V², so RK = 1 V⁻¹. The equation becomes v<sub>D</sub>² + v<sub>D</sub> − 6 = 0.</p>`,
        { t: "num", q: "v_D = ?", a: 2, unit: "V", hint: "You solved this exact quadratic in Part 2.", why: "Roots are 2 and −3." },
        { t: "num", q: "i_D = ?", a: 4, unit: "mA", hint: "K·v_D².", why: "1 mA/V² × 4 V² = 4 mA. Check KVL: R drops 4 V, plus 2 V = 6 V ✓" },
      ]},
      { k: "why", title: "Why throw away −3 V?", b: [
        { t: "mcq", q: "The quadratic also allows v_D = −3 V. Why is it rejected?", opts: [
          ["The rule i = K·v² only holds for v > 0. At −3 V the real device carries 0, so that root doesn't satisfy the real device law", true, "The math solved a parabola that extends to negative v. The device doesn't follow that half. Always check roots against the device's actual rule."],
          ["Negative voltages are impossible", false, "Negative voltages are fine. This device just doesn't conduct there."],
          ["The quadratic formula is wrong for negative roots", false, "The formula is fine. It doesn't know which part of the parabola is real for the device."],
        ]},
        { t: "num", q: "Now E = −5 V. What is v_D?", a: -5, unit: "V", hint: "With negative E, the device carries 0 A. So the resistor drops nothing.", why: "i = 0 → no drop on R → v_D = E = −5 V." },
      ]},
      { k: "learn", title: "One nonlinear device, lots of linear stuff", b: [
        `<p>If the rest of the circuit is linear, reduce it to its <b>Thévenin equivalent</b> as seen by the device. Then you're back to this simple loop: v<sub>TH</sub>, R<sub>TH</sub>, device.</p>`,
        `<p class="aside">Caution: currents inside the Thévenin part are lost. To find one, work back through the original linear circuit once you know the device's v and i.</p>`,
      ]},
      { k: "check", title: "Series diodes", b: [
        `<p>Three identical diodes in series carry 1 mA (I<sub>s</sub> = 10⁻¹² A, V<sub>TH</sub> = 0.025 V).</p>`,
        { t: "num", q: "Total voltage across all three?", a: 1.554, tol: 0.03, unit: "V", hint: "Same current through each, so each has the same voltage. You found one diode at 1 mA in Part 2.", why: "3 × 0.518 ≈ 1.55 V. Symmetry saved you writing three exponential equations." },
      ]},
      { k: "why", title: "Where exact solving fails", b: [
        fig(seriesFig({ E: "E", R: "R", dev: "diode" })),
        `<div class="eq">(v<sub>D</sub> − E)/R + I<sub>s</sub>(e<sup>v<sub>D</sub>/V<sub>TH</sub></sup> − 1) = 0</div>`,
        { t: "mcq", q: "Why can't you solve this one for v_D with algebra?", opts: [
          ["v_D appears both plain and inside an exponent, and no algebra step can isolate it (a 'transcendental' equation)", true, "A computer can do trial and error. But that gives a number, not insight. The next part shows a picture method that gives both."],
          ["Because diodes don't obey KCL", false, "They do. The equation above is KCL."],
          ["You'd need the quadratic formula", false, "It isn't a quadratic. The exponent makes it different."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you analyze a circuit with exactly one nonlinear device and many linear parts?", model: "Find the Thévenin equivalent of all the linear circuitry as seen from the device's two terminals. That leaves one source, one resistor and the device. Solve that loop with the device's own law, then go back into the original circuit for any other values." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Method 2: the load line", mins: 25,
    blurb: "Draw the device curve and the circuit's straight line. They cross at the answer.",
    takeaway: "The rest of the circuit gives a straight line, i = (E − v)/R. The device gives a curve. The crossing point is the operating point, and the picture shows at a glance how it moves.",
    steps: [
      { k: "learn", title: "Two curves, one crossing", b: [
        fig(seriesFig({ E: "E", R: "R", dev: "diode" })),
        `<p>The loop gives two facts about (v<sub>D</sub>, i<sub>D</sub>):</p>`,
        `<div class="two"><div class="tile"><h3>Circuit (linear)</h3><p class="mono">i<sub>D</sub> = (E − v<sub>D</sub>)/R</p><p>A straight line: hits v = E when i = 0, and i = E/R when v = 0. Called the <b>load line</b>.</p></div><div class="tile"><h3>Device</h3><p class="mono">i<sub>D</sub> = I<sub>s</sub>(e<sup>v/V<sub>TH</sub></sup> − 1)</p><p>The diode's curve.</p></div></div>`,
        `<p>Both must hold, so the answer is where they <b>cross</b>.</p>`,
      ]},
      { k: "play", title: "Slide the load line", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let E = 2, R = 200;
          function draw() {
            const v = solveDiode(E, R), i = idio(v);
            f.innerHTML = plot({ x: [0, 6], y: [0, 30], xt: [0, 1, 2, 3, 4, 5, 6], yt: [0, 10, 20, 30], xl: "v_D (V)", yl: "i_D (mA)",
              series: [{ f: (x) => idio(x) * 1000, cls: "s1", n: 500 }, { f: (x) => ((E - x) / R) * 1000, cls: "s2", to: E }],
              marks: [{ x: v, y: i * 1000, label: `(${fmt(v)} V, ${fmt(i * 1000)} mA)` }], label: "Diode curve and load line" });
            ro.innerHTML = readout([["v_D", fmt(v) + " V"], ["i_D", fmt(i * 1000) + " mA"], ["v_R", fmt(E - v) + " V"]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(slider({ id: id + "-e", label: "Source E", min: 0.5, max: 6, step: 0.1, value: E, show: (x) => fmt(x) + " V" }, (x) => { E = x; draw(); }).el,
            slider({ id: id + "-r", label: "Resistor R", min: 100, max: 1000, step: 10, value: R, show: (x) => fmt(x) + " Ω" }, (x) => { R = x; draw(); }).el);
          host.append(f, box, ro);
          draw();
        },
        `<p class="aside">Blue = load line, orange = diode. Changing E slides the line sideways. Changing R tilts it (slope −1/R).</p>`,
      ]},
      { k: "predict", title: "Triple the source", b: [
        { t: "mcq", q: "Start at E = 2 V, R = 200 Ω (v_D ≈ 0.57 V). Raise E to 6 V. What happens to v_D?", opts: [
          ["It rises only a few tens of millivolts. The current roughly quadruples, but the steep curve barely moves sideways", true, "Try it on the slider: about 0.57 V → 0.60 V. This is the kind of insight graphs give and formulas hide. A conducting diode's voltage hardly changes."],
          ["It triples to about 1.7 V", false, "That would be a linear element. The diode's steep curve pins the voltage."],
          ["It stays exactly the same", false, "It does rise, just very little."],
        ]},
      ]},
      { k: "check", title: "Read the graph", b: [
        `<p>Set E = 3 V and R = 500 Ω on the slider above (go back one step if needed), or reason from the curve.</p>`,
        { t: "num", q: "Roughly what current flows? (within 10%)", a: 4.9, tol: 0.1, unit: "mA", hint: "The diode takes about 0.55–0.6 V, so the resistor gets the rest.", why: "About (3 − 0.56)/500 ≈ 4.9 mA. The graph method gives good estimates fast." },
        { t: "num", q: "Then the voltage across the resistor is about?", a: 2.44, tol: 0.06, unit: "V", why: "i × R ≈ 2.4 V. E minus the diode's ~0.56 V." },
      ]},
      { k: "learn", title: "AC in: the half-wave rectifier", b: [
        fig(S.svg(380, 200, S.wire([50, 82], [50, 30], [80, 30]) + S.diode(80, 30, 180, 30, "") + S.wire([180, 30], [260, 30]) + S.res(260, 30, 260, 170, "R", { side: "right" }) + S.wire([50, 118], [50, 170], [260, 170]) + S.vsrc(50, 100, "v_I", { side: "right" }) + S.t(300, 60, "+", { cls: "big" }) + S.t(300, 160, "−", { cls: "big" }) + S.t(310, 110, "v_O", { a: "start", cls: "big a" }), { max: 380, label: "Half-wave rectifier: source, diode, and a resistor across which v_O is taken" })),
        `<p>Now let v<sub>I</sub> = E<sub>o</sub>cos(ωt) and take the output across the resistor: v<sub>O</sub> = v<sub>I</sub> − v<sub>D</sub>. Each instant is a new load line.</p>`,
      ]},
      { k: "play", title: "Watch it rectify", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let Eo = 5;
          function draw() {
            const R = 1000, vo = (t) => { const vi = Eo * Math.cos(2 * Math.PI * t); return vi - solveDiode(vi, R); };
            let sum = 0; const N = 400; for (let k = 0; k < N; k++) sum += vo(k / N);
            f.innerHTML = plot({ x: [0, 2], y: [-10, 10], xt: [0, 0.5, 1, 1.5, 2], yt: [-10, -5, 0, 5, 10], xl: "time (periods)", yl: "volts",
              series: [{ f: (t) => Eo * Math.cos(2 * Math.PI * t), cls: "s5" }, { f: vo, cls: "s1", n: 400 }], label: "Input and rectified output" });
            ro.innerHTML = readout([["peak in", fmt(Eo) + " V"], ["average of v_I", "0 V"], ["average of v_O", fmt(sum / N) + " V"], ["ratio", fmt(sum / N / Eo, 2) + " × E_o"]]);
          }
          host.append(f, slider({ id: id + "-e", label: "Input peak E_o", min: 1, max: 10, step: 0.5, value: Eo, show: (x) => fmt(x) + " V" }, (x) => { Eo = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Grey = input, orange = output. Negative half: diode off, v<sub>O</sub> ≈ 0. Positive half: v<sub>O</sub> ≈ v<sub>I</sub> − 0.6 V.</p>`,
      ]},
      { k: "why", title: "Something from nothing?", b: [
        { t: "mcq", q: "The input averages to 0 V, but the output averages to about 0.3·E_o. A linear circuit could never do that. Why?", opts: [
          ["A linear circuit only scales and adds inputs, so a zero-average input gives a zero-average output. The diode treats the two halves differently", true, "Creating DC (a new 'frequency', 0 Hz) out of AC needs a nonlinearity. That's how every power adapter turns AC into DC."],
          ["The resistor stores energy", false, "Resistors don't store energy."],
          ["The diode is a hidden battery", false, "It supplies nothing. It just blocks one half of the wave."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is a load line, and why is it straight?", model: "It's the set of (v, i) pairs the rest of the circuit allows at the device's terminals. The rest of the circuit is a linear source plus a resistor, so that relation is a straight line from (E, 0) to (0, E/R). The device's curve crosses it at the operating point." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Method 3: piecewise linear", mins: 25,
    blurb: "Replace the curve by straight segments. Guess the segment, solve, check.",
    takeaway: "Piecewise linear: model the curve with straight segments. Assume a segment, solve the now-linear circuit, then check the answer really lies on that segment. If not, try the other.",
    steps: [
      { k: "learn", title: "The ideal diode", b: [
        `<p>The crudest model that keeps the diode's main idea, two straight segments meeting at the origin:</p>`,
        `<div class="two"><div class="tile"><h3>ON = short circuit</h3><p class="mono">v<sub>D</sub> = 0 for any i<sub>D</sub> > 0</p></div><div class="tile"><h3>OFF = open circuit</h3><p class="mono">i<sub>D</sub> = 0 for any v<sub>D</sub> < 0</p></div></div>`,
        `<p>Inside each segment the diode is a linear element (wire or gap), so every tool from Chapter 3 works again.</p>`,
      ]},
      { k: "play", title: "Guess, solve, check", b: [
        `<p>The circuit: E, R = 1 kΩ, ideal diode. Pick an assumption and see if it survives the check.</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let E = 5, on = 0;
          function draw() {
            f.innerHTML = seriesFig({ E: fmt(E) + " V", R: "1 kΩ", dev: on === 0 ? "short" : "open" });
            let html;
            if (on === 0) { const i = E / 1; html = readout([["assume", "ON (short)"], ["v_D", "0 V"], ["i_D = E/R", fmt(i) + " mA"]]) + `<span class="verdict ${i > 0 ? "ok" : "no"}">${i > 0 ? "Consistent: ON needs i_D > 0, and it is." : "Contradiction: ON needs i_D > 0, but i_D ≤ 0. Wrong guess."}</span>`; }
            else { html = readout([["assume", "OFF (open)"], ["i_D", "0 mA"], ["v_D = E", fmt(E) + " V"]]) + `<span class="verdict ${E < 0 ? "ok" : "no"}">${E < 0 ? "Consistent: OFF needs v_D < 0, and it is." : "Contradiction: OFF needs v_D < 0, but v_D ≥ 0. Wrong guess."}</span>`; }
            ro.innerHTML = html;
          }
          host.append(toggle(["Assume ON", "Assume OFF"], (k) => { on = k; draw(); }), f, slider({ id: id + "-e", label: "Source E", min: -6, max: 6, step: 0.5, value: E, show: (x) => fmt(x) + " V" }, (x) => { E = x; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "check", title: "How good is the ideal model?", b: [
        `<p>E = 5 V, R = 1 kΩ. The ideal diode says i<sub>D</sub> = 5 mA.</p>`,
        { t: "mcq", q: "The real exponential diode gives about 4.45 mA. Where does the 11% difference come from?", opts: [
          ["The real diode drops about 0.55 V when on, which the ideal model sets to 0", true, "(5 − 0.55)/1k ≈ 4.45 mA. Better piecewise models add a 0.6 V source in the ON segment. The book's web section covers those."],
          ["The real diode leaks backward", false, "Leakage is about 10⁻¹² A here: negligible."],
          ["The resistor heats up", false, "R stays 1 kΩ in this model."],
        ]},
      ]},
      { k: "learn", title: "A device with two slopes", b: [
        `<p>A hypothetical device behaves like <b>R₁ = 200 Ω</b> when its current is positive and like <b>R₂ = 5 kΩ</b> when it's negative. A current source I drives it directly.</p>`,
        { t: "num", q: "I = +2 mA. v = ?", a: 0.4, unit: "V", hint: "Positive current → the R₁ segment.", why: "2 mA × 200 Ω = 0.4 V." },
        { t: "num", q: "I = −2 mA. v = ?", a: -10, unit: "V", hint: "Negative current → the R₂ segment.", why: "−2 mA × 5 kΩ = −10 V." },
      ]},
      { k: "play", title: "Feed it a cosine", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`);
          const I = (t) => 2 * Math.cos(2 * Math.PI * t), v = (t) => (I(t) >= 0 ? I(t) * 0.2 : I(t) * 5);
          f.innerHTML = plot({ x: [0, 2], y: [-11, 2], xt: [0, 0.5, 1, 1.5, 2], yt: [-10, -5, 0], xl: "time (periods)", yl: "v (V)", series: [{ f: v, cls: "s1", n: 400 }], label: "Output of the two-slope device for a cosine current" });
          host.append(f);
        },
        `<p>Input: a symmetrical 2 mA cosine. Output: tiny 0.4 V bumps up, big 10 V dips down. Each half of the wave is solved with a different linear circuit, then the pieces are joined.</p>`,
      ]},
      { k: "why", title: "Superposition is back, inside a segment", b: [
        { t: "mcq", q: "A circuit has two sources and one two-slope device. When may you use superposition?", opts: [
          ["Once you know (or have assumed) which segment the device is in, the circuit is linear, so superposition works. Then check that the result really is in that segment", true, "Superposition is valid within one linear segment. Your final answer must confirm the segment you assumed."],
          ["Never. The circuit has a nonlinear device", false, "In a single segment the device is just a resistor."],
          ["Always, with no checks", false, "If the answer lands in the other segment, the assumption was wrong and so is the answer."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe the 'guess, solve, check' loop for an ideal diode.", model: "Assume the diode is ON (a wire) or OFF (a gap). Solve the resulting linear circuit. Then check: ON requires the current through it to be positive, OFF requires the voltage across it to be negative. If the check fails, switch the assumption and solve again." },
      ]},
    ],
  };

  /* =============== PART 6 (math) =============== */
  const p6 = {
    id: "p6", title: "Math boost: the slope of a curve", mins: 20,
    blurb: "Derivatives as 'rise over run for a tiny step'.",
    takeaway: "Zoom in far enough on any smooth curve and it looks straight. The slope of that straight piece is the derivative df/dv. Near the point, f(V + Δv) ≈ f(V) + (df/dv)·Δv.",
    steps: [
      { k: "math", title: "Slope of a straight line", b: [
        `<p>For a line, slope = rise/run = Δi/Δv. A resistor's v–i line has slope 1/R everywhere.</p>`,
        `<p>A curve's slope changes from point to point. The slope <b>at one point</b> is the slope of the line that just touches the curve there: the <b>tangent</b>.</p>`,
        `<div class="key">The <b>derivative</b> df/dv at v = V is the slope of the tangent at V. Work it out as rise/run over a very tiny run.</div>`,
      ]},
      { k: "math", title: "Try it with numbers", b: [
        `<p>f(v) = v². At v = 3: take a tiny run of 0.01.</p>`,
        { t: "num", q: "(3.01² − 3²)/0.01 = ?", a: 6.01, tol: 0.005, hint: "3.01² = 9.0601.", why: "0.0601/0.01 = 6.01. As the run shrinks this heads to exactly 6 = 2 × 3." },
        `<div class="tbl"><table><thead><tr><th>f(v)</th><th>df/dv</th></tr></thead><tbody>
          <tr><td class="mono">a·v (a straight line)</td><td class="mono">a</td></tr>
          <tr><td class="mono">K·v²</td><td class="mono">2K·v</td></tr>
          <tr><td class="mono">I<sub>s</sub>e<sup>v/V<sub>TH</sub></sup></td><td class="mono">I<sub>s</sub>e<sup>v/V<sub>TH</sub></sup>/V<sub>TH</sub></td></tr>
          <tr><td class="mono">a constant</td><td class="mono">0</td></tr></tbody></table></div>`,
      ]},
      { k: "play", title: "Zoom in on a curve", b: [
        `<p>Curve: i = K·v² with K = 1 mA/V². Pick an operating point V and a step Δv. Compare the real curve with the tangent's prediction.</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let V = 2, d = 0.5;
          function draw() {
            const fn = (v) => v * v, sl = 2 * V, real = fn(V + d), tan = fn(V) + sl * d;
            f.innerHTML = plot({ x: [0, 4], y: [0, 16], xt: [0, 1, 2, 3, 4], yt: [0, 4, 8, 12, 16], xl: "v (V)", yl: "i (mA)",
              series: [{ f: fn, cls: "s1" }, { f: (v) => fn(V) + sl * (v - V), cls: "s2" }],
              marks: [{ x: V, y: fn(V), label: "operating point" }, { x: V + d, y: real, cls: "mk2", r: 5 }, { x: V + d, y: tan, cls: "mkb", r: 5 }], label: "Curve and its tangent line" });
            ro.innerHTML = readout([["slope 2K·V", fmt(sl) + " mA/V"], ["real i(V+Δv)", fmt(real) + " mA"], ["tangent guess", fmt(tan) + " mA"], ["error", fmt(Math.abs(real - tan) / real * 100, 2) + " %"]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(slider({ id: id + "-v", label: "Operating point V", min: 0.5, max: 3.5, step: 0.1, value: V, show: (x) => fmt(x) + " V" }, (x) => { V = x; draw(); }).el,
            slider({ id: id + "-d", label: "Step Δv", min: 0, max: 1, step: 0.02, value: d, show: (x) => fmt(x) + " V" }, (x) => { d = x; draw(); }).el);
          host.append(f, box, ro);
          draw();
        },
        `<p class="aside">Shrink Δv and the error collapses. For small steps the tangent line <b>is</b> the curve.</p>`,
      ]},
      { k: "learn", title: "The Taylor idea", b: [
        `<div class="eq">f(V + Δv) ≈ f(V) + (df/dv at V) · Δv</div>`,
        `<p>"Where I am, plus slope × how far I step." The book's full Taylor series adds more terms (with Δv², Δv³…), which matter less and less as Δv shrinks.</p>`,
        { t: "num", q: "f(v) = K·v² with K = 1 mA/V². Estimate f(2.1 V) using the tangent at 2 V.", a: 4.4, tol: 0.01, unit: "mA", hint: "f(2) = 4 mA, slope = 2K·2 = 4 mA/V, Δv = 0.1 V.", why: "4 + 4 × 0.1 = 4.4 mA. The real value is 4.41 mA: very close." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In plain words, what is a derivative?", model: "It's how steep a curve is at one point: how much the output changes per unit change of input, for a very tiny change. Graphically, it's the slope of the straight line that just touches the curve at that point." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Method 4: small-signal (incremental) analysis", mins: 25,
    blurb: "A big DC value plus a tiny wiggle. For the wiggle, the device is just a resistor.",
    takeaway: "Split every signal into DC plus a small change. Solve the DC with any nonlinear method. For the small changes, replace the device by its incremental resistance r_d = 1/(df/dv at the operating point), turn DC sources off, and use linear tools.",
    steps: [
      { k: "learn", title: "Big DC + small wiggle", b: [
        `<p>Lots of real signals look like this: a fixed DC voltage plus a small varying part. A microphone signal riding on a bias voltage, for example.</p>`,
        `<div class="tbl"><table><tbody>
          <tr><td>total</td><td class="mono">v<sub>D</sub></td><td>small letter, capital subscript</td></tr>
          <tr><td>DC operating point</td><td class="mono">V<sub>D</sub></td><td>all capitals</td></tr>
          <tr><td>small change</td><td class="mono">v<sub>d</sub></td><td>all small</td></tr></tbody></table></div>`,
        `<div class="eq">v<sub>D</sub> = V<sub>D</sub> + v<sub>d</sub>  ·  i<sub>D</sub> = I<sub>D</sub> + i<sub>d</sub></div>`,
      ]},
      { k: "learn", title: "The wiggles see a resistor", b: [
        `<p>From Part 6: i<sub>D</sub> = f(V<sub>D</sub> + v<sub>d</sub>) ≈ f(V<sub>D</sub>) + (df/dv)·v<sub>d</sub>. The first term is I<sub>D</sub>. So the small parts obey</p>`,
        `<div class="eq">i<sub>d</sub> = v<sub>d</sub> / r<sub>d</sub>,  with  r<sub>d</sub> = 1 / (df/dv at V<sub>D</sub>)</div>`,
        `<p>That's Ohm's law! For small changes, the nonlinear device acts like a <b>linear resistor r<sub>d</sub></b>, whose value depends on the operating point.</p>`,
      ]},
      { k: "check", title: "Incremental resistance", b: [
        { t: "num", q: "Square-law device i = K·v², K = 1 mA/V², operating at V_D = 2 V. r_d = ?", a: 250, unit: "Ω", hint: "df/dv = 2K·V_D = 4 mA/V. r_d is its reciprocal.", why: "1/(4 mA/V) = 250 Ω." },
        { t: "num", q: "Diode: df/dv ≈ I_D/V_TH, so r_d = V_TH/I_D. At I_D = 1 mA, r_d = ?", a: 25, unit: "Ω", hint: "0.025 V / 0.001 A.", why: "25 Ω. Remember this one: a diode at 1 mA looks like 25 Ω to small signals." },
        { t: "num", q: "Same diode, biased at 5 mA instead. r_d = ?", a: 5, unit: "Ω", why: "0.025/0.005 = 5 Ω. More bias current → steeper curve → smaller r_d." },
      ]},
      { k: "learn", title: "The two-circuit procedure", b: [
        `<div class="tbl"><table><tbody>
          <tr><td class="mono">1</td><td><b>DC circuit:</b> set the small-signal sources to zero. Find V<sub>D</sub>, I<sub>D</sub> with any nonlinear method (exact, graph, piecewise).</td></tr>
          <tr><td class="mono">2</td><td><b>Incremental circuit:</b> set the DC sources to zero (V → short, I → open). Replace the device by r<sub>d</sub> from step 1. Keep the other resistors. Solve with linear tools.</td></tr>
          <tr><td class="mono">3</td><td>If you need totals: add them, v<sub>D</sub> = V<sub>D</sub> + v<sub>d</sub>.</td></tr></tbody></table></div>`,
        fig(S.svg(460, 190, S.wire([40, 52], [40, 30], [120, 30]) + S.res(120, 30, 210, 30, "R") + S.wire([210, 30], [220, 30]) + S.wire([40, 148], [40, 170], [220, 170]) + S.vsrc(40, 70, "V", { side: "right" }) + S.vsrc(40, 130, "v_i", { side: "right" }) + S.wire([40, 88], [40, 112]) + S.wire([220, 30], [220, 78]) + S.wire([220, 122], [220, 170]) + S.box(198, 78, 44, 44, "NL") +
          S.t(250, 105, "→", { cls: "big", a: "start" }) + S.wire([290, 52], [290, 30], [330, 30]) + S.res(330, 30, 410, 30, "R") + S.wire([410, 30], [420, 30]) + S.wire([290, 88], [290, 170], [420, 170]) + S.vsrc(290, 70, "v_i", { side: "right" }) + S.res(420, 30, 420, 170, "r_d", { side: "left" }), { max: 460, label: "Full circuit with DC and small sources, and the incremental circuit with only the small source and r_d" })),
        `<p class="aside">Right: the incremental circuit. The DC source became a wire. The device became r<sub>d</sub>.</p>`,
      ]},
      { k: "check", title: "A diode with a wiggle", b: [
        `<p>A diode sits directly across V = 0.7 V plus a 1 mV wiggle. At 0.7 V: I<sub>D</sub> = 10⁻¹²·e<sup>28</sup> ≈ 1.45 A (a big diode!).</p>`,
        { t: "num", q: "r_d = V_TH/I_D = ?", a: 0.0172, tol: 0.03, unit: "Ω", hint: "0.025/1.45.", why: "≈ 0.017 Ω." },
        { t: "num", q: "So the current wiggle i_d for a 1 mV wiggle = ?", a: 0.058, tol: 0.03, unit: "A", hint: "i_d = v_d / r_d.", why: "0.001/0.0172 ≈ 0.058 A: a 58 mA wiggle on top of 1.45 A DC." },
      ]},
      { k: "why", title: "How small is small?", b: [
        `<p>The book compares the next Taylor term to the one we kept. For a diode, their ratio is v<sub>d</sub>/(2V<sub>TH</sub>).</p>`,
        { t: "num", q: "To keep the error below 10%, v_d must stay under?", a: 5, unit: "mV", hint: "v_d/(2 × 25 mV) ≤ 0.1.", why: "v_d ≤ 5 mV. Bigger wiggles and the straight-line model starts to lie." },
        { t: "mcq", q: "The book stresses that the two-circuit split is NOT superposition. Why?", opts: [
          ["The device is still nonlinear. The split comes from the Taylor approximation (dropping small terms), not from linearity", true, "Superposition is exact for linear circuits. Incremental analysis is an approximation that only holds for small signals."],
          ["Because there are only two sources", false, "The number of sources isn't the issue."],
          ["It is superposition, just renamed", false, "Superposition would be exact. This is only accurate for small v_d."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a nonlinear device look like a linear resistor to small signals?", model: "Zoomed in near its operating point, the device's curve is almost a straight line: the tangent. Small changes move along that tangent, so the change in current is proportional to the change in voltage. The constant is the slope, and its reciprocal is the incremental resistance r_d." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Putting it together: a simple regulator", mins: 20,
    blurb: "Use small-signal analysis to see how much ripple gets through.",
    takeaway: "The DC operating point sets r_d. The ripple then sees a plain voltage divider, R over r_d, so a steeper device (smaller r_d) passes less ripple.",
    steps: [
      { k: "learn", title: "The problem", b: [
        fig(seriesFig({ E: "v_I", R: "1 kΩ", dev: "box", v: "v_O" })),
        `<p>A "DC" supply isn't perfectly steady: 12 V DC plus 100 mV of unwanted wiggle (<b>ripple</b>). A resistor and a square-law device (i = K·v², K = 1 mA/V²) try to clean it up. The output is across the device.</p>`,
      ]},
      { k: "check", title: "Step 1: the DC operating point", b: [
        `<p>Ripple off. RK = 1 V⁻¹, so V<sub>O</sub>² + V<sub>O</sub> − 12 = 0.</p>`,
        { t: "num", q: "V_O = ?", a: 3, unit: "V", hint: "Quadratic formula, positive root. √(1 + 48) = 7.", why: "(−1 + 7)/2 = 3 V." },
        { t: "num", q: "I_D = ?", a: 9, unit: "mA", hint: "K·V_O².", why: "9 mA. Check: the 1 kΩ drops 9 V, plus 3 V = 12 V ✓" },
      ]},
      { k: "check", title: "Step 2: the incremental circuit", b: [
        { t: "num", q: "r_d = 1/(2K·V_O) = ?", a: 166.7, tol: 0.01, unit: "Ω", hint: "2 × 1 mA/V × 3 V = 6 mA/V.", why: "1/(6 mS) ≈ 167 Ω." },
        { t: "num", q: "The ripple sees a divider: 1 kΩ on top, r_d below. Output ripple v_o = ?", a: 14.3, tol: 0.02, unit: "mV", hint: "100 mV × r_d/(1000 + r_d).", why: "100 × 166.7/1166.7 ≈ 14.3 mV." },
      ]},
      { k: "play", title: "Did it help?", b: [
        `<p>What matters is the <b>fractional</b> ripple: ripple ÷ DC level.</p>`,
        (host, id) => {
          const ro = el(`<div></div>`);
          let VI = 12, vi = 100;
          function draw() {
            const VO = (-1 + Math.sqrt(1 + 4 * VI)) / 2, rd = 1000 / (2 * VO), vo = (vi * rd) / (1000 + rd), fin = vi / 1000 / VI, fout = vo / 1000 / VO;
            ro.innerHTML = readout([["V_O", fmt(VO) + " V"], ["r_d", fmt(rd) + " Ω"], ["ripple out", fmt(vo) + " mV"], ["fraction in", fmt(fin * 100, 2) + " %"], ["fraction out", fmt(fout * 100, 2) + " %"], ["improvement", fmt(fin / fout, 3) + " ×"]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(slider({ id: id + "-vi", label: "DC input V_I", min: 4, max: 30, step: 1, value: VI, show: (x) => fmt(x) + " V" }, (x) => { VI = x; draw(); }).el,
            slider({ id: id + "-r", label: "Input ripple", min: 10, max: 300, step: 10, value: vi, show: (x) => fmt(x) + " mV" }, (x) => { vi = x; draw(); }).el);
          host.append(box, ro);
          draw();
        },
        { t: "mcq", q: "Change the ripple size. What happens to the improvement factor, and why?", opts: [
          ["It stays the same. The incremental circuit is linear, so the output ripple is just a fixed fraction of the input ripple", true, "Only the DC operating point (set by V_I) changes r_d and the improvement. The ripple size scales everything equally, as long as it stays small."],
          ["Bigger ripple gets cleaned up better", false, "In the small-signal model, ripple out is simply proportional to ripple in."],
          ["It drops to 1×", false, "The ratio is fixed by the divider, R against r_d."],
        ]},
      ]},
      { k: "whatif", title: "Make a better regulator", b: [
        { t: "mcq", q: "The improvement here is under 2×. Which change would help most?", opts: [
          ["Use a device with a much steeper curve at the operating point (smaller r_d), like a diode", true, "Smaller r_d makes the divider r_d/(R + r_d) tiny. A diode at 9 mA has r_d ≈ 2.8 Ω instead of 167 Ω. That's why real regulators use steep devices."],
          ["Use a smaller R", false, "Smaller R passes more ripple: the divider gets worse."],
          ["Add more ripple", false, "The ripple is the problem, not the fix."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Walk through the two steps you used on the regulator, in your own words.", model: "First, with the ripple ignored, I solved the nonlinear DC circuit (a quadratic) to get the operating point V_O and I_D. Second, I used that point to compute r_d, turned the DC source into a wire, and solved the linear divider R and r_d to see how much ripple reaches the output." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ch4", eyebrow: "Chapter 4", title: "Analysis of Nonlinear Circuits",
    intro: `<p>Eight parts. Real devices like diodes don't follow Ohm's law. You'll learn four ways to analyze them: <b>exact</b>, <b>graphical</b>, <b>piecewise linear</b>, and <b>small-signal</b>.</p><p>Parts 2 and 6 are math boosts (exponentials, logs, quadratics, slopes). Do them, even if they feel slow.</p><p class="aside">Arrow keys ← → move between steps. Need a refresher? <a href="03-network-theorems.html">Chapter 3</a>.</p>`,
    after: `<p>Open the Chapter 4 PDF and go to the <b>exercises and problems</b> at the end. For each one, first decide which of the four methods suits it, and say why to yourself before you start.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8],
    summary: `
      <h3>Nonlinear devices</h3>
      <div class="eq">diode: i = I_s(e^(v/V_TH) − 1) · square law: i = K(v − V_T)²/2 (v ≥ V_T)</div>
      <p>I<sub>s</sub> ≈ 10⁻¹² A, V<sub>TH</sub> ≈ 25 mV. Diode current ×10 per ~58 mV. v = V<sub>TH</sub>·ln(i/I<sub>s</sub>).</p>
      <h3>Math</h3>
      <p>ln undoes e<sup>x</sup>. Quadratic: x = (−b ± √(b² − 4ac))/2a. Keep only the root the device law allows. Derivative = slope of the tangent: d(Kv²)/dv = 2Kv, d(e<sup>v/a</sup>)/dv = e<sup>v/a</sup>/a.</p>
      <h3>What still works</h3>
      <p>KVL, KCL, node method: yes. Superposition, Thévenin of the whole circuit: no. Thévenin of the linear part facing <b>one</b> nonlinear device: yes.</p>
      <h3>1. Analytical</h3><p>Write node equations with the device law. Solve exactly if you can (quadratics yes, diode + R no).</p>
      <h3>2. Graphical</h3><p>Load line i = (E − v)/R crosses the device curve at the operating point. Insight: a conducting diode's voltage barely changes. Half-wave rectifier makes DC (≈ 0.3·E<sub>o</sub> average) from AC.</p>
      <h3>3. Piecewise linear</h3><p>Ideal diode: ON = short (i > 0), OFF = open (v < 0). Assume a segment → solve the linear circuit → check. Linear tools (superposition) work within a segment.</p>
      <h3>4. Incremental (small signal)</h3>
      <div class="eq">v_D = V_D + v_d · r_d = 1/(df/dv at V_D) · diode: r_d = V_TH/I_D</div>
      <ol><li>DC circuit (small sources off) → V<sub>D</sub>, I<sub>D</sub>.</li><li>Incremental circuit: DC sources off, device → r<sub>d</sub>, solve linearly.</li></ol>
      <p>Valid for small signals only (diode: v<sub>d</sub> ≲ 5 mV for 10%). Based on Taylor, not superposition.</p>`,
  };
  Course.start(window.CHAPTER);
})();
