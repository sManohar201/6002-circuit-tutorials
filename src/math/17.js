(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const tt = (cols, rows) => `<div class="tbl"><table><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((v) => `<td>${v}</td>`).join("")}</tr>`).join("")}</table></div>`;

  const p1 = {
    id: "p1", title: "Counting in binary", mins: 15,
    blurb: "Each bit is a place worth double the one to its right. n bits give 2ⁿ levels.",
    takeaway: "Binary place values from the right: 1, 2, 4, 8, 16, … (powers of 2). 1011₂ = 8 + 0 + 2 + 1 = 11. n bits count 0 to 2ⁿ − 1: 2ⁿ levels (8 bits: 256). A DAC's step (resolution) is V_ref/2ⁿ, and its output is (code/2ⁿ)·V_ref. 2¹⁰ = 1024 ≈ 1000.",
    steps: [
      { k: "play", title: "Flip the bits", b: [
        (host, id) => {
          const bits = [0, 1, 0, 1, 1, 0, 0, 1], ro = el(`<div></div>`), row = el(`<div class="row" role="group" aria-label="Bits, most significant first"></div>`);
          const Vref = 10;
          function draw() {
            const n = bits.reduce((a, b) => 2 * a + b, 0);
            ro.innerHTML = readout([["Binary", bits.join("")], ["Decimal", bits.map((b, i) => (b ? Math.pow(2, 7 - i) : 0)).filter(Boolean).join(" + ") + " = " + n], ["8-bit DAC, V_ref = 10 V: (code/256) × V_ref", fmt((n / 256) * Vref, 4) + " V"], ["Step size V_ref/2⁸", si(Vref / 256, "V", 3)]]);
          }
          bits.forEach((b, i) => {
            const btn = el(`<button type="button" class="btn small" aria-pressed="${!!b}"><span class="mono">${b}</span><br><span class="aside">${Math.pow(2, 7 - i)}</span></button>`);
            btn.addEventListener("click", () => { bits[i] ^= 1; btn.setAttribute("aria-pressed", String(!!bits[i])); btn.querySelector(".mono").textContent = bits[i]; draw(); });
            row.appendChild(btn);
          });
          host.append(row, ro);
          draw();
        },
        `<p class="aside">The number under each bit is its place value. Turn on only the leftmost bit to get exactly half of V<sub>ref</sub>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "11010₂ in decimal?", a: 26, tol: 0, why: "16 + 8 + 2 = 26." },
        { t: "num", q: "How many levels does a 12-bit ADC have?", a: 4096, tol: 0, why: "2¹² = 4096." },
        { t: "num", q: "A 10-bit converter with a 5 V reference. Step size in mV?", a: 4.883, unit: "mV", tol: 0.01, why: "5/1024 = 4.88 mV." },
        { t: "mcq", q: "Decimal 13 in 4-bit binary?", opts: [["1101", true, "8 + 4 + 1."], ["1011", false, "That's 11."], ["0111", false, "That's 7."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does adding one bit to a converter halve its step size?", model: "Each extra bit doubles the number of levels, two to the n, across the same reference voltage. Twice as many levels in the same range means each step is half as big." },
      ]},
    ],
  };

  const GATES = [["AND", (a, b) => a & b], ["OR", (a, b) => a | b], ["NAND", (a, b) => 1 - (a & b)], ["NOR", (a, b) => 1 - (a | b)], ["XOR", (a, b) => a ^ b]];
  const p2 = {
    id: "p2", title: "AND, OR, NOT and truth tables", mins: 15,
    blurb: "Logic is arithmetic on 0 and 1. A truth table lists every input combination.",
    takeaway: "AND (A·B): 1 only if both are 1. OR (A + B): 1 if either is 1. NOT (Ā): flips. NAND and NOR are AND and OR followed by NOT. XOR: 1 if they differ. A truth table with n inputs has 2ⁿ rows. Order of operations: NOT, then AND, then OR (like −, ×, +).",
    steps: [
      { k: "play", title: "Try the inputs", b: [
        (host, id) => {
          let A = 1, B = 0;
          const ro = el(`<div></div>`);
          const draw = () => { ro.innerHTML = readout(GATES.map(([n, g]) => [n, String(g(A, B))]).concat([["NOT A", String(1 - A)]])); };
          host.append(toggle(["A = 0", "A = 1"], (i) => { A = i; draw(); }, 1), toggle(["B = 0", "B = 1"], (i) => { B = i; draw(); }, 0), ro);
          draw();
        },
      ]},
      { k: "learn", title: "The full tables", b: [
        tt(["A", "B", "A·B", "A + B", "A ⊕ B"], [[0, 0, 0, 0, 0], [0, 1, 0, 1, 1], [1, 0, 0, 1, 1], [1, 1, 1, 1, 0]]),
        `<p class="aside">AND behaves like multiplication. OR is like addition, except 1 + 1 = 1.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Y = A·B + C with A = 1, B = 0, C = 1. Y = ?", opts: [["1", true, "A·B = 0; 0 + 1 = 1."], ["0", false, "AND first, then OR: C makes it 1."]] },
        { t: "num", q: "How many rows in the truth table for 3 inputs?", a: 8, tol: 0, why: "2³ = 8." },
        { t: "mcq", q: "A NAND gate's output is 0 when…", opts: [["Both inputs are 1", true, "AND gives 1, NOT flips it to 0."], ["Either input is 0", false, "Then AND is 0 and NAND is 1."], ["The inputs differ", false, "That's when XOR is 1."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How is AND like multiplication, and where does OR differ from addition?", model: "With only 0 and 1, AND gives 1 only when both are 1, exactly like multiplying. OR is like adding, except that 1 OR 1 is still 1, not 2, because the answer can only be 0 or 1." },
      ]},
    ],
  };

  const PAIRS = [
    ["NOT(A·B) vs NOT A + NOT B", (a, b) => 1 - (a & b), (a, b) => (1 - a) | (1 - b)],
    ["NOT(A + B) vs NOT A · NOT B", (a, b) => 1 - (a | b), (a, b) => (1 - a) & (1 - b)],
    ["NOT(A·B) vs NOT A · NOT B", (a, b) => 1 - (a & b), (a, b) => (1 - a) & (1 - b)],
    ["A + A·B vs A", (a, b) => a | (a & b), (a) => a],
    ["A·B + A·NOT B vs A", (a, b) => (a & b) | (a & (1 - b)), (a) => a],
  ];
  const p3 = {
    id: "p3", title: "Boolean algebra and De Morgan", mins: 20,
    blurb: "A few rules simplify logic. Prove any of them with a truth table.",
    takeaway: "A·1 = A, A·0 = 0, A + 0 = A, A + 1 = 1, A·A = A, A + A = A, A·Ā = 0, A + Ā = 1, A + A·B = A, A·B + A·B̄ = A. De Morgan: NOT(A·B) = Ā + B̄ (NAND = OR of inverted inputs); NOT(A + B) = Ā·B̄ (NOR = AND of inverted inputs). Two expressions are equal exactly when their truth tables match on every row.",
    steps: [
      { k: "learn", title: "The rules", b: [
        `<div class="two"><div class="tile"><h3>With constants</h3><p>A·1 = A · A·0 = 0<br>A + 0 = A · A + 1 = 1</p></div><div class="tile"><h3>With itself</h3><p>A·A = A · A + A = A<br>A·Ā = 0 · A + Ā = 1</p></div><div class="tile"><h3>De Morgan</h3><p>NOT(A·B) = Ā + B̄<br>NOT(A + B) = Ā·B̄</p></div></div>`,
        `<p class="aside">De Morgan in words: break the bar, change the sign (· ↔ +).</p>`,
      ]},
      { k: "play", title: "Test a claim", b: [
        (host, id) => {
          const out = el(`<div></div>`);
          const show = (i) => {
            const [, f, g] = PAIRS[i], rows = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => [a, b, f(a, b), g(a, b), f(a, b) === g(a, b) ? "✓" : "✗"]);
            const eq = rows.every((r) => r[4] === "✓");
            out.innerHTML = tt(["A", "B", "left", "right", "same?"], rows) + `<p><b>${eq ? "Equal on every row: it's a rule." : "Differs on some row: not a rule."}</b></p>`;
          };
          host.append(toggle(PAIRS.map((p) => p[0]), show, 0), out);
          show(0);
        },
        `<p class="aside">One of these is a common slip. Find it.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Simplify A·B + A·B̄.", opts: [["A", true, "A·(B + B̄) = A·1 = A."], ["B", false, "B appears both ways and cancels out."], ["0", false, "Try A = 1: the result is 1."]] },
        { t: "mcq", q: "Which equals NOT(A + B)?", opts: [["Ā·B̄", true, "De Morgan: break the bar, change + to ·."], ["Ā + B̄", false, "That's NOT(A·B)."], ["A·B", false, "Try A = B = 0: NOT(0) = 1, but A·B = 0."]] },
        { t: "mcq", q: "Why can NAND gates alone build any logic?", opts: [["NAND with both inputs tied is NOT, and NOT(NAND) is AND; De Morgan gives OR", true, "With NOT, AND and OR you can build anything."], ["They can't", false, "NAND is 'universal': see the first answer."], ["Because NAND is faster", false, "Speed isn't why it's universal."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "State De Morgan's two laws in words.", model: "NOT of an AND equals the OR of the inverted inputs, and NOT of an OR equals the AND of the inverted inputs. You break the bar over the whole thing and swap AND with OR." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m17", eyebrow: "Math Toolkit · Module 17", title: "Binary and Boolean Algebra",
    intro: `<p>Three parts: binary numbers, logic gates and truth tables, and simplifying with Boolean rules. 6.002's digital chapters use the logic; Boylestad's DAC and ADC sections use the binary counting.</p>`,
    after: `<p>If two logic expressions look different, write their truth tables. Matching tables means they're equal.</p>`,
    parts: [p1, p2, p3],
    summary: `
      <p>Place values 1, 2, 4, 8, … · n bits: 2ⁿ levels · DAC step V<sub>ref</sub>/2ⁿ, output (code/2ⁿ)V<sub>ref</sub> · 2¹⁰ = 1024.</p>
      <p>AND 1 only if both 1 · OR 1 if either · NOT flips · NAND/NOR = inverted AND/OR · XOR 1 if different. n inputs: 2ⁿ rows. Order: NOT, AND, OR.</p>
      <p>A·1 = A · A + 1 = 1 · A·Ā = 0 · A + Ā = 1 · A + AB = A · AB + AB̄ = A.</p>
      <div class="eq">NOT(A·B) = Ā + B̄     NOT(A + B) = Ā·B̄</div>`,
  };
  Course.start(window.CHAPTER);
})();
