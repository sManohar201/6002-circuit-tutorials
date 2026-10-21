(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const ohm = (r) => si(r, "Ω", 3);

  /* A worked rearrangement: each step shows the operation done to both sides. */
  const steps = (rows) => `<div class="tbl"><table><tr><th>Do to both sides</th><th>Equation now</th></tr>${rows.map(([op, eq]) => `<tr><td>${op}</td><td class="mono">${eq}</td></tr>`).join("")}</table></div>`;

  const p1 = {
    id: "p1", title: "The balance rule", mins: 15,
    blurb: "Whatever you do to one side, do to the other. Undo the operations in reverse order.",
    takeaway: "An equation is a balance: any operation done to both sides keeps it true. To get a letter alone, list what was done to it (in order), then undo those steps in reverse: subtraction undoes addition, division undoes multiplication. Example: I_B = (V_CC − V_BE)/R_B → R_B = (V_CC − V_BE)/I_B.",
    steps: [
      { k: "learn", title: "A balance", b: [
        fig(S.svg(520, 150, `<line class="w" x1="260" y1="40" x2="260" y2="130"/><line class="w" x1="90" y1="50" x2="430" y2="50"/><polygon class="nd" points="245,140 275,140 260,118"/>` + S.box(40, 60, 120, 44, "V") + S.box(360, 60, 120, 44, "I × R") + S.t(260, 30, "="), { label: "A balance with V on the left and I times R on the right" })),
        `<p>V = IR says the two sides weigh the same. Divide <b>both</b> sides by R and it still balances:</p>`,
        `<div class="eq">V/R = I</div>`,
        `<p class="aside">That's all rearranging is: picking operations that peel the other letters away from the one you want.</p>`,
      ]},
      { k: "learn", title: "Undo in reverse order", b: [
        `<p>Base current in a fixed-bias circuit: start from R<sub>B</sub> and see what was done to it.</p>`,
        `<div class="eq">I<sub>B</sub> = (V<sub>CC</sub> − V<sub>BE</sub>) / R<sub>B</sub></div>`,
        `<p>R<sub>B</sub> is in the denominator. Undo the division first, then the rest:</p>`,
        steps([["start", "I_B = (V_CC − V_BE)/R_B"], ["× R_B", "I_B·R_B = V_CC − V_BE"], ["÷ I_B", "R_B = (V_CC − V_BE)/I_B"]]),
      ]},
      { k: "play", title: "Pick the letter", b: [
        (host, id) => {
          const out = el(`<div></div>`);
          const SETS = [
            ["V_CC (supply)", [["start", "I_B = (V_CC − V_BE)/R_B"], ["× R_B", "I_B·R_B = V_CC − V_BE"], ["+ V_BE", "V_CC = I_B·R_B + V_BE"]]],
            ["V_BE", [["start", "I_B = (V_CC − V_BE)/R_B"], ["× R_B", "I_B·R_B = V_CC − V_BE"], ["+ V_BE, − I_B·R_B", "V_BE = V_CC − I_B·R_B"]]],
            ["R_B", [["start", "I_B = (V_CC − V_BE)/R_B"], ["× R_B", "I_B·R_B = V_CC − V_BE"], ["÷ I_B", "R_B = (V_CC − V_BE)/I_B"]]],
          ];
          const show = (i) => { out.innerHTML = steps(SETS[i][1]); };
          host.append(el(`<p class="aside" style="margin:0">Solve I<sub>B</sub> = (V<sub>CC</sub> − V<sub>BE</sub>)/R<sub>B</sub> for…</p>`), toggle(SETS.map((x) => x[0]), show, 2), out);
          show(2);
        },
        `<p class="aside">The first move is the same every time: get R<sub>B</sub> out of the denominator. Clearing fractions first usually makes the rest easy.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "V_CC = 12 V, V_BE = 0.7 V and you want I_B = 40 µA. R_B = ? (kΩ)", a: 282.5, unit: "kΩ", hint: "R_B = (V_CC − V_BE)/I_B. V ÷ mA = kΩ, so write 40 µA as 0.04 mA.", why: "11.3/0.04 = 282.5 kΩ." },
        { t: "mcq", q: "P = V·I. Which gives I?", opts: [["I = P/V", true, "Divide both sides by V."], ["I = P·V", false, "That multiplies one side only."], ["I = V/P", false, "Upside down: check with numbers, 12 W at 6 V must be 2 A."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you decide the order of steps when getting a letter alone?", model: "List what was done to the letter, in the order it was done, then undo those operations in reverse order, doing each one to both sides. Usually the first move is to clear any fraction the letter sits in." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Squares, roots and reciprocals", mins: 20,
    blurb: "Undo a square with a root, a root with a square, a reciprocal by flipping both sides.",
    takeaway: "Square ↔ square root; 1/x ↔ flip both sides. Resonance f = 1/(2π√(LC)) → C = 1/((2πf)²L). Square law I_D = k(V_GS − V_T)² → V_GS = V_T ± √(I_D/k): a root has two signs, and the physics picks one. Flipping works only on a whole side: 1/R = 1/a + 1/b gives R = 1/(1/a + 1/b), not a + b.",
    steps: [
      { k: "learn", title: "Inverse pairs", b: [
        `<div class="tbl"><table><tr><th>Done to the letter</th><th>Undo with</th></tr><tr><td>+ a</td><td>− a</td></tr><tr><td>× a</td><td>÷ a</td></tr><tr><td>squared</td><td>square root (±)</td></tr><tr><td>square root</td><td>square both sides</td></tr><tr><td>1/x (reciprocal)</td><td>flip both whole sides</td></tr></table></div>`,
      ]},
      { k: "learn", title: "A resonance formula", b: [
        `<p>An LC circuit resonates at f = 1/(2π√(LC)). Which C gives a chosen f?</p>`,
        steps([["start", "f = 1/(2π√(LC))"], ["flip both sides", "1/f = 2π√(LC)"], ["÷ 2π", "1/(2πf) = √(LC)"], ["square", "1/(2πf)² = LC"], ["÷ L", "C = 1/((2πf)²·L)"]]),
      ]},
      { k: "play", title: "Check it with numbers", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let f = 10e3, L = 1e-3;
          function draw() { const C = 1 / (Math.pow(2 * Math.PI * f, 2) * L), back = 1 / (2 * Math.PI * Math.sqrt(L * C)); ro.innerHTML = readout([["C = 1/((2πf)²L)", si(C, "F", 3)], ["Put C back into f = 1/(2π√(LC))", si(back, "Hz", 4)]]); }
          host.append(slider({ id: id + "-f", label: "Target f", min: 100, max: 1e6, log: true, value: f, show: (v) => si(v, "Hz", 3) }, (v) => { f = v; draw(); }).el,
            slider({ id: id + "-l", label: "L", min: 1e-6, max: 1, log: true, value: L, show: (v) => si(v, "H", 3) }, (v) => { L = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Substituting your answer back into the original formula is the surest check. It should give back exactly what you started with.</p>`,
      ]},
      { k: "learn", title: "A root has two signs", b: [
        `<p>MOSFET square law: I<sub>D</sub> = k(V<sub>GS</sub> − V<sub>T</sub>)². Solve for V<sub>GS</sub>:</p>`,
        steps([["start", "I_D = k(V_GS − V_T)²"], ["÷ k", "I_D/k = (V_GS − V_T)²"], ["square root", "±√(I_D/k) = V_GS − V_T"], ["+ V_T", "V_GS = V_T ± √(I_D/k)"]]),
        `<p>The law only holds for V<sub>GS</sub> above V<sub>T</sub>, so take <b>+</b>. Module 7 covers choosing roots.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "I_D = k(V_GS − V_T)² with k = 0.5 mA/V², V_T = 2 V and I_D = 2 mA. V_GS = ?", a: 4, unit: "V", hint: "√(I_D/k) = √4.", why: "V_GS = 2 + 2 = 4 V." },
        { t: "num", q: "X_C = 1/(2πfC). For C = 0.1 µF, at what f is X_C = 1 kΩ? (Hz)", a: 1591.5, unit: "Hz", hint: "f = 1/(2πX_C·C).", why: "1/(2π × 1000 × 10⁻⁷) = 1592 Hz." },
        { t: "mcq", q: "1/R = 1/(2 kΩ) + 1/(3 kΩ). R = ?", opts: [["1.2 kΩ", true, "1/R = 0.5 + 0.333 = 0.833 per kΩ, so R = 1/0.833 = 1.2 kΩ."], ["5 kΩ", false, "Flipping each term separately isn't allowed: flip the whole side."], ["0.833 kΩ", false, "That's 1/R. One more flip."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't you flip 1/R = 1/a + 1/b term by term into R = a + b?", model: "Flipping is an operation on a whole side of the equation. The reciprocal of a sum isn't the sum of the reciprocals; you have to add the right side into one number first and then flip that." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Substitute, then solve", mins: 20,
    blurb: "Join two formulas by replacing a letter, and avoid the three classic slips.",
    takeaway: "To combine formulas, solve one for the shared letter and substitute it into the other: P = VI with I = V/R gives P = V²/R. Bias example: I_B = (V_CC − V_BE)/(R_B + (β+1)R_E) → R_E = [(V_CC − V_BE)/I_B − R_B]/(β + 1). Classic slips: 1/(a+b) ≠ 1/a + 1/b, √(a+b) ≠ √a + √b, (a+b)² ≠ a² + b².",
    steps: [
      { k: "learn", title: "Substitution", b: [
        `<p>Two facts about a resistor: P = VI and I = V/R. Replace I in the first with what the second says it equals:</p>`,
        `<div class="eq">P = V × (V/R) = V²/R</div>`,
        `<p>Same trick with V = IR: P = (IR) × I = I²R. Three power formulas, one idea.</p>`,
      ]},
      { k: "learn", title: "A bias design", b: [
        `<p>Emitter-stabilised bias: I<sub>B</sub> = (V<sub>CC</sub> − V<sub>BE</sub>)/(R<sub>B</sub> + (β+1)R<sub>E</sub>). Which R<sub>E</sub> gives a chosen I<sub>B</sub>?</p>`,
        steps([["start", "I_B = (V_CC − V_BE)/(R_B + (β+1)R_E)"], ["× bottom, ÷ I_B", "R_B + (β+1)R_E = (V_CC − V_BE)/I_B"], ["− R_B", "(β+1)R_E = (V_CC − V_BE)/I_B − R_B"], ["÷ (β+1)", "R_E = [(V_CC − V_BE)/I_B − R_B]/(β+1)"]]),
      ]},
      { k: "check", title: "Use it", b: [
        { t: "num", q: "V_CC = 15 V, V_BE = 0.7 V, β = 99, R_B = 330 kΩ, target I_B = 30 µA. R_E = ? (kΩ)", a: 1.467, unit: "kΩ", tol: 0.02, hint: "(V_CC − V_BE)/I_B = 14.3/0.03 kΩ. Subtract 330, divide by 100.", why: "476.7 − 330 = 146.7 kΩ; ÷ 100 = 1.47 kΩ." },
      ]},
      { k: "bug", title: "The three slips", b: [
        { t: "sort", q: "True for all positive numbers, or a slip?", bins: ["Always true", "Slip"], items: [["1/(a + b) = 1/a + 1/b", 1, "Try a = b = 1: 1/2 vs 2."], ["√(a + b) = √a + √b", 1, "√(9 + 16) = 5, but 3 + 4 = 7."], ["(a + b)² = a² + b²", 1, "Missing the 2ab: (1 + 1)² = 4, not 2."], ["√(ab) = √a·√b", 0, "Roots split over products (not sums)."], ["(ab)² = a²b²", 0, "Squares split over products too."], ["a/b + c/b = (a + c)/b", 0, "Same denominator: add the tops."]] },
        `<p class="aside">The test: put in easy numbers like 1, 4 or 9. A slip shows up straight away.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How can you check a rearranged formula without redoing the algebra?", model: "Pick easy numbers, compute a value with the original formula, then put the numbers into the rearranged one and see if it gives back the value you started with. Units also have to come out right." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Powers and exponent rules", mins: 20,
    blurb: "Seven rules for powers. Laplace transforms lean on them constantly, especially with e.",
    takeaway: "aᵐ·aⁿ = aᵐ⁺ⁿ; aᵐ/aⁿ = aᵐ⁻ⁿ; (aᵐ)ⁿ = aᵐⁿ; a⁰ = 1; a⁻ⁿ = 1/aⁿ; a^(1/2) = √a; (ab)ⁿ = aⁿbⁿ. They hold for e too: e^(−2t)·e^(−st) = e^(−(s+2)t), and 1/e^(−x) = e^x. There is NO rule for (a + b)ⁿ or aⁿ + bⁿ: those don't simplify.",
    steps: [
      { k: "learn", title: "Count the factors", b: [
        `<p>a³ means a·a·a. Every rule comes from counting how many a's are multiplied:</p>`,
        `<div class="eq">a³·a² = (a·a·a)(a·a) = a⁵</div>`,
        `<div class="tbl"><table><tr><th>Rule</th><th>Example</th></tr>
          <tr><td>aᵐ·aⁿ = aᵐ⁺ⁿ</td><td>s²·s³ = s⁵</td></tr>
          <tr><td>aᵐ/aⁿ = aᵐ⁻ⁿ</td><td>s⁵/s² = s³</td></tr>
          <tr><td>(aᵐ)ⁿ = aᵐⁿ</td><td>(e<sup>2t</sup>)³ = e<sup>6t</sup></td></tr>
          <tr><td>a⁰ = 1</td><td>e⁰ = 1</td></tr>
          <tr><td>a⁻ⁿ = 1/aⁿ</td><td>s⁻² = 1/s²</td></tr>
          <tr><td>a^(1/2) = √a</td><td>(LC)^(−1/2) = 1/√(LC)</td></tr>
          <tr><td>(ab)ⁿ = aⁿbⁿ</td><td>(2πf)² = 4π²f²</td></tr></table></div>`,
      ]},
      { k: "play", title: "Try the rules with numbers", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let m = 3, n = 2;
          function draw() { ro.innerHTML = readout([["2ᵐ × 2ⁿ", `${fmt(2 ** m, 4)} × ${fmt(2 ** n, 4)} = ${fmt(2 ** m * 2 ** n, 4)}`], ["2^(m+n)", fmt(2 ** (m + n), 4)], ["2ᵐ ÷ 2ⁿ = 2^(m−n)", fmt(2 ** (m - n), 4)], ["(2ᵐ)ⁿ = 2^(mn)", fmt(2 ** (m * n), 4)], ["2ᵐ + 2ⁿ (no rule)", fmt(2 ** m + 2 ** n, 4) + " ≠ 2^(m+n)"]]); }
          host.append(slider({ id: id + "-m", label: "m", min: -3, max: 5, step: 1, value: m }, (v) => { m = v; draw(); }).el, slider({ id: id + "-n", label: "n", min: -3, max: 5, step: 1, value: n }, (v) => { n = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Make n negative: dividing by 2ⁿ and multiplying by 2⁻ⁿ give the same thing.</p>`,
      ]},
      { k: "learn", title: "The same rules with e", b: [
        `<p>e is just a number (2.718…), so every rule applies. This one line is the heart of many Laplace transforms:</p>`,
        `<div class="eq">e<sup>−at</sup>·e<sup>−st</sup> = e<sup>−at − st</sup> = e<sup>−(s+a)t</sup></div>`,
        `<p class="aside">Factor out t from the exponent: −at − st = −(s + a)t.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "e^(3t)·e^(−st) = ?", opts: [["e^(−(s−3)t)", true, "3t − st = −(s − 3)t."], ["e^(−3st)", false, "Exponents add when you multiply; they don't multiply."], ["e^(3t) − e^(st)", false, "Products of powers never turn into differences."]] },
        { t: "mcq", q: "s³/s⁵ = ?", opts: [["1/s²", true, "s^(3−5) = s⁻² = 1/s²."], ["s²", false, "Upside down: the bigger power is on the bottom."], ["s^(3/5)", false, "Divide → subtract exponents."]] },
        { t: "num", q: "(1/√(LC)) written as (LC)^k. k = ?", a: -0.5, tol: 0, why: "Root → ½, reciprocal → negative: (LC)^(−1/2)." },
        { t: "mcq", q: "1/e^(−4) = ?", opts: [["e⁴ ≈ 54.6", true, "a⁻ⁿ = 1/aⁿ works both ways: 1/e⁻⁴ = e⁴."], ["−e⁴", false, "The minus is in the exponent, not in front."], ["e^(−1/4)", false, "That's a root, not a reciprocal."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is aᵐ·aⁿ = aᵐ⁺ⁿ, but aᵐ + aⁿ doesn't simplify?", model: "Multiplying just joins the two strings of a's into one longer string, so the counts add. Adding two powers isn't a string of multiplications at all, so there's nothing to combine." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m2", eyebrow: "Math Toolkit · Module 2", title: "Rearranging Formulas",
    intro: `<p>Four parts: the balance rule, undoing squares, roots and reciprocals, joining two formulas, and the exponent rules. Most "design" questions in both books are this: you know the result you want and solve for a component value.</p>`,
    after: `<p>Whenever a book problem asks "what value of R gives…", that's this module.</p>`,
    parts: [p1, p2, p3, p4],
    summary: `
      <p>Do the same thing to both sides. Undo operations in reverse order; clear fractions first.</p>
      <div class="tbl"><table><tr><th>Done</th><th>Undo</th></tr><tr><td>+ a / × a</td><td>− a / ÷ a</td></tr><tr><td>x²</td><td>±√</td></tr><tr><td>√x</td><td>square</td></tr><tr><td>1/x</td><td>flip both whole sides</td></tr></table></div>
      <div class="eq">f = 1/(2π√(LC)) → C = 1/((2πf)²L)      I_D = k(V_GS − V_T)² → V_GS = V_T + √(I_D/k)</div>
      <p>Substitute: P = VI, I = V/R → P = V²/R = I²R. Slips: 1/(a+b) ≠ 1/a + 1/b; √(a+b) ≠ √a + √b; (a+b)² = a² + 2ab + b². Check by putting numbers back in.</p>
      <p>Powers: aᵐaⁿ = aᵐ⁺ⁿ · aᵐ/aⁿ = aᵐ⁻ⁿ · (aᵐ)ⁿ = aᵐⁿ · a⁰ = 1 · a⁻ⁿ = 1/aⁿ · a^(1/2) = √a · (ab)ⁿ = aⁿbⁿ. With e: e<sup>−at</sup>e<sup>−st</sup> = e<sup>−(s+a)t</sup>.</p>`,
  };
  Course.start(window.CHAPTER);
})();
