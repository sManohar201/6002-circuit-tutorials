(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const { bits, truthTable, gate, wave, combos, minimize, implText, implCovers } = Digital;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seenPP = (html, href, where) => `<div class="key"><b>Seen in Patt & Patel:</b> ${html} <a href="../pp/${href}">${where} →</a></div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const bar = (s) => s + "̅";
  const minName = (r, names) => r.map((v, i) => (v ? names[i] : bar(names[i]))).join("");
  const maxName = (r, names) => "(" + r.map((v, i) => (v ? bar(names[i]) : names[i])).join(" + ") + ")";

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Circuits as black boxes", mins: 15,
    blurb: "Inputs, outputs, a function and a timing spec. And the rules that guarantee a circuit is combinational.",
    takeaway: "A digital circuit is a black box with discrete-valued inputs and outputs, a functional specification (outputs in terms of inputs) and a timing specification (delay from inputs changing to outputs responding). Inside: elements (themselves circuits) and nodes (wires): input, output or internal. Combinational circuits are memoryless: outputs depend only on current inputs. Sequential circuits have memory: outputs depend on the input sequence. A function usually has many implementations; choose by area, speed, power and design time. A slash with a number on a wire marks a bus of that many signals. Rules of combinational composition (sufficient, not necessary): every element is combinational; every node is either a circuit input or connects to exactly one element output; no cyclic paths. They apply abstraction, modularity, hierarchy and discipline.",
    steps: [
      { k: "learn", title: "The black box", b: [
        fig(S.svg(420, 110, S.box(150, 25, 120, 60, "") + S.t(210, 50, "functional spec", { cls: "s" }) + S.t(210, 70, "timing spec", { cls: "s" }) + S.arrow(60, 55, 148, 55) + S.t(60, 45, "inputs", { a: "start", cls: "s" }) + S.arrow(272, 55, 360, 55) + S.t(360, 45, "outputs", { a: "end", cls: "s" }), { label: "Circuit as a black box" })),
        `<p>A digital circuit has discrete-valued <b>inputs</b> and <b>outputs</b>, a <b>functional specification</b> (what the outputs are) and a <b>timing specification</b> (how long they take to respond).</p>`,
        `<p>Inside: <b>elements</b> (smaller circuits) joined by <b>nodes</b> (wires). A node is an input, an output, or internal.</p>`,
      ]},
      { k: "learn", title: "Combinational vs sequential", b: [
        `<div class="two"><div class="tile"><h3>Combinational</h3><p>Outputs depend only on the <b>current</b> inputs. Memoryless. This chapter.</p></div><div class="tile"><h3>Sequential</h3><p>Outputs depend on the input <b>sequence</b>. Has memory. Chapter 3.</p></div></div>`,
        `<p class="aside">A slash across a wire with a number, like ─/3─, means a <b>bus</b> of 3 signals.</p>`,
        seenPP("Combinational vs sequential logic structures.", "03-digital-logic-structures.html#p4", "Chapter 3, Parts 4 and 9"),
      ]},
      { k: "learn", title: "Rules of combinational composition", b: [
        `<p>A circuit is guaranteed combinational if:</p>`,
        `<ol><li>every element is itself combinational,</li><li>every node is either a circuit input or connects to <b>exactly one</b> element output,</li><li>there are <b>no cyclic paths</b>: no path visits a node twice.</li></ol>`,
        `<p class="aside">The rules are sufficient, not necessary: some circuits that break them are still combinational, but proving it is harder. So designers stick to the rules (discipline again).</p>`,
      ]},
      { k: "check", title: "Combinational or not?", b: [
        { t: "sort", q: "Does each circuit obey the rules of combinational composition?", bins: ["Obeys the rules", "Breaks a rule"], items: [
          ["Two inverters in series", 0, "Each element is combinational, each node has one driver, no loop."],
          ["An XOR whose output is wired back to one of its own inputs", 1, "A cyclic path."],
          ["Two inverter outputs wired together onto one node", 1, "That node connects to two element outputs."],
          ["The output of one combinational block feeding the input of another", 0, "Composition of combinational blocks is combinational."],
          ["Two blocks, each feeding the other", 1, "A cyclic path through the two elements. It may or may not behave combinationally."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do designers follow the rules of combinational composition even though they're stricter than necessary?", model: "Because a circuit built by those rules is guaranteed to be combinational, without any hard analysis. Circuits that break the rules, like ones with loops, might still be combinational, but proving it is difficult. It's a discipline: give up a little freedom to make design simple and safe." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Boolean equations from truth tables", mins: 25,
    blurb: "Literals, implicants, minterms, maxterms. Sum-of-products and product-of-sums, straight from the table.",
    takeaway: "Complement of A: A̅. A literal is a variable or its complement (true or complementary form). A product (AND of literals) is also called an implicant; a minterm is a product using every input. A sum is an OR of literals; a maxterm is a sum using every input. Precedence: NOT, then AND, then OR (Y = A + BC is A OR (B AND C)). Each truth-table row has a minterm that is TRUE for that row only; minterms are numbered m0, m1… in row order. Sum-of-products (SOP) canonical form: OR the minterms of the rows where Y = 1: Y = Σ(1, 3). Product-of-sums (POS) canonical form: AND the maxterms (each FALSE for its own row) of the rows where Y = 0: Y = Π(0, 2). SOP is shorter when few outputs are 1; POS when few are 0. Neither form is necessarily simplest.",
    steps: [
      { k: "learn", title: "Words to know", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>Literal</b></td><td>A variable or its complement: A, A̅, B, B̅</td></tr>
          <tr><td><b>Implicant</b> (product)</td><td>AND of literals: AB̅, A̅BC, B</td></tr>
          <tr><td><b>Minterm</b></td><td>A product using <i>every</i> input: A̅BC (but not AB, for 3 inputs)</td></tr>
          <tr><td><b>Maxterm</b></td><td>A sum (OR) using every input: A + B̅ + C</td></tr></tbody></table></div>`,
        `<p><b>Precedence:</b> NOT, then AND, then OR. So Y = A + BC means A OR (B AND C).</p>`,
      ]},
      { k: "learn", title: "Sum of products", b: [
        `<p>Each row of a truth table has a <b>minterm</b> that is TRUE for that row only. Row ABC = 010 has minterm A̅BC̅.</p>`,
        `<div class="key"><b>Sum-of-products (SOP):</b> OR together the minterms of every row where Y = 1. Works for any truth table.</div>`,
        `<p>Written compactly with sigma notation: Y = Σ(1, 3) means minterms m1 and m3.</p>`,
      ]},
      { k: "play", title: "Truth table → equations", b: [
        (host, id) => {
          const N = ["A", "B", "C"], tbl = el(`<div class="tbl"></div>`), ro = el(`<div></div>`);
          let y = [1, 0, 0, 0, 1, 1, 0, 0];
          function draw() {
            tbl.innerHTML = `<table><thead><tr><th>#</th><th>A</th><th>B</th><th>C</th><th>Y (click)</th><th>minterm</th></tr></thead><tbody>${combos(3).map((r, i) => `<tr${y[i] ? ' style="background:var(--accent-soft)"' : ""}><td>m${i}</td>${r.map((v) => `<td class="mono">${v}</td>`).join("")}<td><button type="button" class="btn small mono" data-r="${i}">${y[i]}</button></td><td>${minName(r, N)}</td></tr>`).join("")}</tbody></table>`;
            tbl.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { const r = +b.dataset.r; y[r] = 1 - y[r]; draw(); }));
            const ones = y.map((v, i) => (v ? i : -1)).filter((i) => i >= 0), zeros = y.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
            const sop = ones.map((i) => minName(combos(3)[i], N)).join(" + ") || "0", pos = zeros.map((i) => maxName(combos(3)[i], N)).join("") || "1";
            ro.innerHTML = readout([["SOP: Σ(" + ones.join(", ") + ")", sop], ["POS: Π(" + zeros.join(", ") + ")", pos]]);
          }
          host.append(tbl, ro);
          draw();
        },
        `<p class="aside">Click Y to change the function. Make Y = 1 on just one row, then on all but one: which form is shorter each time?</p>`,
      ]},
      { k: "learn", title: "Product of sums", b: [
        `<p>Each row also has a <b>maxterm</b> that is FALSE for that row only. Row AB = 00 has maxterm (A + B): it's 0 only when A = B = 0.</p>`,
        `<div class="key"><b>Product-of-sums (POS):</b> AND together the maxterms of every row where Y = 0. Pi notation: Y = Π(0, 2).</div>`,
        `<p>Use SOP when few rows are 1; POS when few rows are 0.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A pump P should run only when the tank is low (L = 1) and the water is not frozen (F = 0). Which is the SOP form?", opts: [["P = LF̅", true, "One row has P = 1: L = 1, F = 0. Its minterm is LF̅."], ["P = L + F̅", false, "That would run the pump whenever F = 0, even with a full tank."], ["P = L̅F", false, "That's the row L = 0, F = 1."]] },
        { t: "mcq", q: "A 3-input function is 0 on rows 3 and 6 only. Its POS form is…", opts: [["(A + B̅ + C̅)(A̅ + B̅ + C)", true, "Row 3 is 011: its maxterm is A + B̅ + C̅. Row 6 is 110: A̅ + B̅ + C."], ["A̅BC + ABC̅", false, "That's the SOP of the complement (where Y is 0), not Y itself."], ["(A̅ + B + C)(A + B + C̅)", false, "Each literal is complemented when its variable is 1 in that row, not 0."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you write the sum-of-products form of any truth table?", model: "For every row where the output is 1, write its minterm: an AND of all the inputs, each complemented if it's 0 in that row. Then OR all those minterms together." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const T1 = [
    ["T1 Identity", "B · 1 = B", "B + 0 = B", "An AND with one input stuck at 1 is just a wire."],
    ["T2 Null element", "B · 0 = 0", "B + 1 = 1", "An AND with a 0 input is a wire tied LOW."],
    ["T3 Idempotency", "B · B = B", "B + B = B", "ANDing a signal with itself does nothing."],
    ["T4 Involution", "B̿ = B", "", "Two inverters in a row are a wire."],
    ["T5 Complements", "B · B̅ = 0", "B + B̅ = 1", "One of B and B̅ is always 0, and one is always 1."],
  ];
  const p3 = {
    id: "p3", title: "Boolean algebra: one variable", mins: 15,
    blurb: "Axioms, duality, and five theorems that each turn a gate into a wire.",
    takeaway: "Boolean algebra simplifies equations like ordinary algebra, but simpler because variables are only 0 or 1. Axioms (unprovable definitions) define the binary field, NOT, AND and OR. Duality: swap 0 ↔ 1 and AND ↔ OR and every axiom and theorem stays true (the dual is marked with a prime). One-variable theorems: T1 identity B·1 = B, B + 0 = B; T2 null element B·0 = 0, B + 1 = 1; T3 idempotency B·B = B, B + B = B; T4 involution (B̅)̅ = B; T5 complements B·B̅ = 0, B + B̅ = 1. In hardware each lets you replace a gate with a wire (or a constant), saving cost, power and delay.",
    steps: [
      { k: "learn", title: "Axioms and duality", b: [
        `<p>Boolean algebra starts from a few <b>axioms</b>: B is 0 if it isn't 1 (and vice versa); NOT 0 = 1; 0·0 = 0, 1·1 = 1, 0·1 = 0 (AND); and their duals for OR.</p>`,
        `<div class="key"><b>Duality:</b> swap 0 ↔ 1 and AND ↔ OR in any true statement, and it stays true. So every theorem comes in a pair: T1 and its dual T1′.</div>`,
      ]},
      { k: "play", title: "Five theorems", b: [
        (host, id) => {
          const ro = el(`<div></div>`), note = el(`<p class="aside"></p>`);
          function draw(i) { const [n, a, d, hw] = T1[i]; ro.innerHTML = readout([["Theorem", n], ["Statement", a], ["Dual", d || "(its own dual)"]]); note.textContent = "In hardware: " + hw; }
          host.append(toggle(T1.map((t) => t[0].split(" ")[0]), draw, 0), ro, note);
          draw(0);
        },
        `<p class="aside">You can check any of these by trying B = 0 and B = 1. That's called <b>perfect induction</b>.</p>`,
      ]},
      { k: "why", title: "Why care?", b: [
        `<p>Every theorem here lets you <b>delete a gate</b>. Gates cost area, power and delay. A wire costs (almost) nothing.</p>`,
        `<p class="aside">The null element theorem in advertising: “YOU WILL GET A MILLION DOLLARS or we'll send you a toothbrush.” (B + 1 = 1: the statement is true whatever B is.)</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Simplify each expression.", bins: ["= X", "= 0", "= 1"], items: [
          ["X · X", 0, "T3 idempotency."], ["X + 1", 2, "T2′ null element."], ["X · X̅", 1, "T5 complements."],
          ["(X̅)̅", 0, "T4 involution."], ["X + X̅", 2, "T5′."], ["X · 1", 0, "T1 identity."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is the principle of duality?", model: "If you take any true statement of Boolean algebra and swap every 0 with 1 and every AND with OR, the result is also true. So every axiom and theorem comes with a dual partner." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const THM = [
    ["T8′ Distributivity (dual)", "(B + C)(B + D)", "B + CD", (b, c, d) => (b | c) & (b | d), (b, c, d) => b | (c & d)],
    ["T9 Covering", "B(B + C)", "B", (b, c) => b & (b | c), (b) => b],
    ["T10 Combining", "BC + BC̅", "B", (b, c) => (b & c) | (b & (1 - c)), (b) => b],
    ["T11 Consensus", "BC + B̅D + CD", "BC + B̅D", (b, c, d) => (b & c) | ((1 - b) & d) | (c & d), (b, c, d) => (b & c) | ((1 - b) & d)],
    ["T12 De Morgan", "(BC)̅", "B̅ + C̅", (b, c) => 1 - (b & c), (b, c) => (1 - b) | (1 - c)],
  ];
  const p4 = {
    id: "p4", title: "Boolean algebra: several variables", mins: 25,
    blurb: "Commutativity to De Morgan, and proving any of them with a truth table.",
    takeaway: "T6 commutativity and T7 associativity work as in ordinary algebra. T8 distributivity: B·C + B·D = B(C + D); its dual T8′ (B + C)(B + D) = B + CD has no ordinary-algebra counterpart (addition doesn't distribute over multiplication). T9 covering: B(B + C) = B, B + BC = B. T10 combining: BC + BC̅ = B, (B + C)(B + C̅) = B. T11 consensus: BC + B̅D + CD = BC + B̅D (the CD term is redundant). T12 De Morgan: the complement of a product is the sum of the complements, (B₀B₁B₂…)̅ = B̅₀ + B̅₁ + …, and the complement of a sum is the product of the complements. So a NAND equals an OR with inverted inputs, and a NOR equals an AND with inverted inputs. Bubble pushing: pushing a bubble through a gate (either way) flips its body between AND and OR; a bubble pushed back from the output appears on every input, and bubbles on every input pushed forward make one output bubble. Perfect induction proves any theorem: check every input combination with a truth table.",
    steps: [
      { k: "learn", title: "Like ordinary algebra, mostly", b: [
        `<p><b>T6 commutativity</b> (BC = CB) and <b>T7 associativity</b> ((BC)D = B(CD)) work as usual. <b>T8 distributivity</b> too: BC + BD = B(C + D).</p>`,
        `<div class="key">The surprise is T8's dual: <b>(B + C)(B + D) = B + CD</b>. OR distributes over AND. In ordinary algebra, (b + c)(b + d) ≠ b + cd.</div>`,
      ]},
      { k: "play", title: "Prove it by perfect induction", b: [
        (host, id) => {
          const tbl = el(`<div></div>`), vd = el(`<span class="verdict ok"></span>`);
          function draw(i) {
            const [n, l, r, fl, fr] = THM[i], three = fl.length === 3 || fr.length === 3;
            tbl.innerHTML = truthTable(three ? ["B", "C", "D"] : ["B", "C"], [l, r], (row) => [fl(...row), fr(...row)]);
            vd.textContent = `${n}: the two columns match in every row, so ${l} = ${r}.`;
          }
          host.append(toggle(THM.map((t) => t[0].split(" ")[0]), draw, 0), tbl, vd);
          draw(0);
        },
        `<p class="aside">With finitely many variables, a theorem is proved by checking <b>every</b> combination. A truth table does exactly that.</p>`,
      ]},
      { k: "learn", title: "Covering, combining, consensus", b: [
        `<div class="tbl"><table><tbody>
          <tr><td>T9 Covering</td><td>B(B + C) = B</td><td>B + BC = B</td></tr>
          <tr><td>T10 Combining</td><td>BC + BC̅ = B</td><td>(B + C)(B + C̅) = B</td></tr>
          <tr><td>T11 Consensus</td><td colspan="2">BC + B̅D + CD = BC + B̅D</td></tr></tbody></table></div>`,
        `<p>All three let you <b>drop redundant variables or terms</b>. Combining (T10) is the workhorse of simplification: two terms that differ only in one variable merge into one.</p>`,
      ]},
      { k: "learn", title: "De Morgan and bubble pushing", b: [
        `<div class="eq">(AB)̅ = A̅ + B̅      (A + B)̅ = A̅B̅</div>`,
        fig(S.svg(420, 100, gate("nand", 40, 40).s + S.t(140, 45, "=", { cls: "big" }) + gate("or", 200, 40).s + `<circle class="el" cx="${200 - 4}" cy="30" r="4"/><circle class="el" cx="${200 - 4}" cy="50" r="4"/>` + S.t(60, 90, "NAND", { cls: "s" }) + S.t(230, 90, "OR with inverted inputs", { cls: "s" }), { label: "De Morgan equivalent gates" })),
        `<ul><li>Pushing a bubble through a gate flips its body: AND ↔ OR.</li><li>A bubble pushed back from the output lands on <b>every</b> input.</li><li>Bubbles on every input pushed forward become one output bubble.</li></ul>`,
        seenPP("De Morgan's law on bit patterns.", "02-bits-data-types.html#p7", "Chapter 2, Part 7"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A NOR gate is equivalent to…", opts: [["an AND gate with bubbles on both inputs", true, "(A + B)̅ = A̅B̅."], ["an OR gate with bubbles on both inputs", false, "That's a NAND."], ["an AND gate with a bubble on its output", false, "That's a NAND."]] },
        { t: "mcq", q: "Simplify XY + XY̅ + X̅Y.", opts: [["X + Y", true, "XY + XY̅ = X (combining). Then X + X̅Y: duplicate XY (idempotency) and combine XY + X̅Y = Y. So X + Y."], ["X", false, "The X̅Y term is still TRUE when X = 0, Y = 1."], ["XY", false, "XY̅ and X̅Y are also TRUE rows."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "State De Morgan's theorem in words.", model: "The complement of a product equals the sum (OR) of the complements, and the complement of a sum equals the product (AND) of the complements. In gates: a NAND is an OR with inverted inputs, and a NOR is an AND with inverted inputs." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Simplifying and drawing", mins: 25,
    blurb: "Combine terms with PA + PA̅ = P, find prime implicants, and draw clean schematics.",
    takeaway: "The basic simplification move: PA + PA̅ = P, where P is any implicant. A sum-of-products is minimized if it uses the fewest implicants (then fewest literals). A prime implicant can't be combined with any other implicant to form one with fewer literals; a minimal equation uses only prime implicants. Sometimes you must duplicate a term (idempotency) so it can combine twice: A̅B̅C̅ + AB̅C̅ + AB̅C = B̅C̅ + AB̅. Simpler equations mean fewer, smaller gates: cheaper and often faster. Schematic rules: inputs left/top, outputs right/bottom, gates flow left to right, straight wires, T junctions connect, a dot at a crossing connects, a crossing without a dot doesn't. Any SOP can be drawn systematically as inverters, a row of ANDs and an OR (a PLA). In CMOS, NANDs and NORs are cheaper than ANDs and ORs. Multiple-output example: a priority circuit grants the highest-priority request; Y₃ = A₃, Y₂ = A̅₃A₂, Y₁ = A̅₃A̅₂A₁, Y₀ = A̅₃A̅₂A̅₁A₀. An X in a truth-table input column means “don't care”: that input doesn't matter for that row.",
    steps: [
      { k: "learn", title: "The one move", b: [
        `<div class="eq">PA + PA̅ = P</div>`,
        `<p>Two terms that are the same except for one variable (true in one, complemented in the other) merge, and that variable disappears. That's T10 combining.</p>`,
        `<p>A sum-of-products is <b>minimized</b> when it has the fewest implicants (then the fewest literals). A <b>prime implicant</b> can't be merged any further. A minimal equation uses only prime implicants.</p>`,
      ]},
      { k: "play", title: "Minimize step by step", b: [
        (host, id) => {
          const steps = [
            ["A̅BC̅ + A̅BC + ABC", "Start: three minterms (rows 2, 3, 7)."],
            ["A̅BC̅ + A̅BC + A̅BC + ABC", "T3 idempotency: duplicate A̅BC, because it can pair with both neighbours."],
            ["A̅B(C̅ + C) + BC(A̅ + A)", "T8 distributivity: factor each pair."],
            ["A̅B(1) + BC(1)", "T5 complements."],
            ["A̅B + BC", "T1 identity. Two prime implicants: done."],
          ];
          const ro = el(`<div></div>`);
          let k = 0;
          const draw = () => { ro.innerHTML = readout([["Step " + k, steps[k][0]], ["Why", steps[k][1]]]); };
          const nx = btn("Next step →", "primary"), bk = btn("← Back");
          nx.addEventListener("click", () => { k = Math.min(steps.length - 1, k + 1); draw(); });
          bk.addEventListener("click", () => { k = Math.max(0, k - 1); draw(); });
          const row = el(`<div class="row"></div>`); row.append(bk, nx);
          host.append(ro, row);
          draw();
        },
        `<p class="aside">Without the duplication you could only merge one pair and you'd be stuck with three literals more. Duplicating a term to share it is counter-intuitive but legal.</p>`,
      ]},
      { k: "learn", title: "Drawing schematics", b: [
        `<ul><li>Inputs on the left (or top), outputs on the right (or bottom).</li><li>Gates flow left to right. Straight wires beat jagged ones.</li><li>Wires connect at a <b>T junction</b>, or where a <b>dot</b> is drawn. A crossing <b>without</b> a dot does not connect.</li></ul>`,
        `<p>Any SOP draws systematically: input columns, inverters for complements, a row of ANDs (one per term), an OR per output. That regular layout is a PLA.</p>`,
        `<p class="aside">In CMOS, NANDs and NORs are cheaper than ANDs and ORs (Chapter 1, Part 9). Part 6 shows how to use them.</p>`,
      ]},
      { k: "learn", title: "Design by inspection: a priority circuit", b: [
        `<p>Four users request a room: A<sub>3</sub> (highest priority) to A<sub>0</sub>. Grant it to the highest-priority requester only. Read the equations straight from the words:</p>`,
        `<div class="eq">Y<sub>3</sub> = A<sub>3</sub>    Y<sub>2</sub> = A̅<sub>3</sub>A<sub>2</sub>    Y<sub>1</sub> = A̅<sub>3</sub>A̅<sub>2</sub>A<sub>1</sub>    Y<sub>0</sub> = A̅<sub>3</sub>A̅<sub>2</sub>A̅<sub>1</sub>A<sub>0</sub></div>`,
        `<p>The truth table shrinks from 16 rows to 5 with <b>don't cares</b>: once A<sub>3</sub> = 1, the other inputs are X (they don't matter).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Minimize F = A̅B̅ + A̅B + AB.", opts: [["A̅ + B", true, "A̅B̅ + A̅B = A̅. Duplicate A̅B: A̅B + AB = B. So A̅ + B."], ["A̅ + AB", false, "Correct but not minimal: A̅ + AB simplifies further to A̅ + B."], ["B", false, "F = 1 when A = 0, B = 0, but B = 0 there."]] },
        { t: "mcq", q: "In a priority circuit with 3 requests (A₂ highest), what's Y₀?", opts: [["A̅₂A̅₁A₀", true, "Y₀ only when no higher request is present."], ["A₀", false, "That would grant A₀ even when A₂ also asks."], ["A₂A₁A₀", false, "Grant means the others are NOT asking."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is a prime implicant, and why does a minimal equation contain only prime implicants?", model: "A prime implicant is an implicant that can't be combined with any other to make one with fewer literals. If a minimal equation contained a non-prime implicant, you could merge it into a bigger one with fewer literals, which would make the equation smaller, so it wasn't minimal." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Multilevel logic and bubble pushing", mins: 20,
    blurb: "More than two levels can save hardware. Bubble pushing makes NAND/NOR circuits readable.",
    takeaway: "Sum-of-products is two-level logic: a level of ANDs into a level of ORs. Multilevel circuits can use far less hardware. An N-input XOR can't be simplified in SOP form (a 3-input XOR needs four 3-input ANDs; an 8-input XOR would need 128 eight-input ANDs and a 128-input OR), but A ⊕ B ⊕ C = (A ⊕ B) ⊕ C, so a tree of 2-input XORs works (seven for 8 inputs). “Best” depends on what you value: gates, speed, design time, cost, power; CAD tools search the options. Bubble pushing to read NAND/NOR circuits: start at the output, push any output bubble back to the inputs so you read Y, not Y̅; working backward, draw each gate so bubbles cancel (an input bubble ↔ an output bubble on the gate feeding it). Converting an AND/OR circuit to CMOS-friendly NANDs and NORs: add bubble pairs on wires (they cancel) so gates become NAND/NOR; a NAND-NAND structure equals AND-OR.",
    steps: [
      { k: "learn", title: "Two levels can be huge", b: [
        `<p>A 3-input XOR is TRUE when an odd number of inputs are 1. Its SOP form has four minterms and <b>can't be simplified</b>: no two of them differ in just one variable.</p>`,
        `<p>But A ⊕ B ⊕ C = (A ⊕ B) ⊕ C. Two 2-input XORs do it.</p>`,
      ]},
      { k: "check", title: "Count the gates", b: [
        { t: "num", q: "An 8-input XOR in two-level SOP needs one 8-input AND per minterm where the output is 1. How many AND gates is that?", a: 128, tol: 0, hint: "Half of the 2⁸ rows have an odd number of 1s.", why: "256 / 2 = 128 AND gates, plus a 128-input OR." },
        { t: "num", q: "How many 2-input XOR gates does a tree for an 8-input XOR need?", a: 7, tol: 0, hint: "Each 2-input gate reduces the number of signals by one.", why: "8 signals → 1 signal: 7 gates (4 + 2 + 1)." },
      ]},
      { k: "learn", title: "Bubble pushing", b: [
        `<p>CMOS likes NANDs and NORs, but circuits full of them are hard to read. <b>Bubble pushing</b> redraws them so bubbles cancel:</p>`,
        `<ol><li>Start at the output. Push any output bubble back to the inputs, so you read Y rather than Y̅.</li><li>Work backward. If a gate has an input bubble, draw the gate feeding it with an output bubble (they cancel). If not, draw the feeding gate without one.</li><li>When only input bubbles remain, read the function as ANDs and ORs of true or complemented inputs.</li></ol>`,
      ]},
      { k: "learn", title: "NAND-NAND = AND-OR", b: [
        fig(S.svg(420, 150, gate("nand", 60, 45).s + gate("nand", 60, 115).s + gate("nand", 240, 80).s + S.wire([115, 45], [190, 45], [190, 70], [218, 70]) + S.wire([115, 115], [190, 115], [190, 90], [218, 90]) + S.t(30, 40, "A", { a: "end", cls: "s" }) + S.t(30, 56, "B", { a: "end", cls: "s" }) + S.t(30, 110, "C", { a: "end", cls: "s" }) + S.t(30, 126, "D", { a: "end", cls: "s" }) + S.t(310, 85, "Y = AB + CD", { a: "start" }), { label: "Two-level NAND-NAND circuit" })),
        `<p>Push the last NAND's output bubble back: it becomes an OR with bubbles on its inputs. Those cancel the bubbles on the first NANDs' outputs, leaving ANDs. So <b>NAND-NAND is AND-OR</b>: Y = AB + CD.</p>`,
        `<p class="aside">Converting an AND-OR circuit to CMOS: add a pair of bubbles on each internal wire (they cancel). Each AND gets an output bubble (NAND), each OR gets input bubbles (NAND too, by De Morgan).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "NOR(A, B) feeds one input of a second NOR gate whose other input is C. Pushing bubbles, Y is…", opts: [["Y = (A + B)C̅", true, "Push the output bubble of the last NOR back: AND with inverted inputs. One cancels the first NOR's bubble (leaving A + B); C gets a bubble. Y = (A + B)C̅."], ["A + B + C", false, "That ignores two inversions."], ["(A + B)̅ C", false, "The bubbles on the first NOR's output and the last gate's input cancel."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can multilevel logic be better than two-level logic?", model: "Some functions, like a many-input XOR, have no small two-level (sum-of-products) form; they need huge numbers of large AND gates. Building them in several levels, like a tree of 2-input XORs, uses far fewer and smaller gates. Multilevel also lets you use cheaper NAND and NOR gates in CMOS." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "X and Z: illegal and floating", mins: 15,
    blurb: "Contention, floating wires, and the tristate buffer that makes shared busses possible.",
    takeaway: "Real circuits have more than 0 and 1. X: an unknown or illegal value, typically contention, a node driven to 0 and 1 at once. Its voltage is somewhere between, often in the forbidden zone, and the fighting gates can draw large power and overheat. Simulators also use X for uninitialized values. (In truth tables, X means “don't care”: don't mix the two up.) Z: floating (high impedance), driven neither HIGH nor LOW; it might read as 0, 1 or in between, depending on history. A floating input is a classic bug: a circuit may work only while a finger touches the chip. Tristate buffer: input A, enable E, output Y. Enabled: Y = A; disabled: Y = Z. An active-low enable (bubble on the input, written E̅ or Eb) enables on 0. Tristate busses let several chips share wires, as long as only one enables its driver at a time; modern systems prefer faster point-to-point links.",
    steps: [
      { k: "learn", title: "X: contention", b: [
        `<p>If one gate drives a node HIGH and another drives it LOW, that's <b>contention</b>. The value is <b>X</b>: unknown. The voltage lands somewhere in between, often in the forbidden zone, and the fight can draw a lot of power.</p>`,
        `<div class="key">Careful: in a truth table, X means “<b>don't care</b>”. In a circuit or simulator, X means “<b>unknown or illegal</b>”.</div>`,
      ]},
      { k: "learn", title: "Z: floating", b: [
        `<p>A node driven neither HIGH nor LOW is <b>floating</b>, or <b>high impedance</b>: <b>Z</b>. It is <i>not</i> the same as 0. It might be 0, 1 or in between.</p>`,
        `<p>Classic bug: an unconnected input. The circuit behaves randomly, and touching the chip can change it. (The authors have seen circuits that worked only while a student pressed a finger on a chip.)</p>`,
      ]},
      { k: "play", title: "A tristate bus", b: [
        (host, id) => {
          const ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          const names = ["Processor", "Video", "Ethernet"];
          let en = [1, 0, 0], val = [1, 0, 1];
          function draw() {
            const on = en.map((e, i) => (e ? val[i] : null)).filter((v) => v !== null);
            const bus = on.length === 0 ? "Z" : on.every((v) => v === on[0]) ? String(on[0]) : "X";
            ro.innerHTML = readout(names.map((n, i) => [n, en[i] ? `driving ${val[i]}` : "output Z (disabled)"]).concat([["Shared bus", bus]]));
            vd.className = "verdict " + (bus === "X" ? "no" : bus === "Z" ? "mid" : "ok");
            vd.textContent = bus === "X" ? "Contention: two enabled drivers disagree. X, and wasted power." : bus === "Z" ? "Nobody is driving: the bus floats (Z)." : on.length > 1 ? "Two drivers enabled but agreeing. It works by luck; the rule is one at a time." : "Exactly one driver enabled: everyone reads " + bus + ".";
          }
          names.forEach((n, i) => host.append(el(`<p class="aside">${n}:</p>`), toggle(["disabled", "enabled"], (v) => { en[i] = v; draw(); }, en[i]), toggle(["drives 0", "drives 1"], (v) => { val[i] = v; draw(); }, val[i])));
          host.append(vd, ro);
          draw();
        },
        `<p class="aside">A <b>tristate buffer</b> outputs its input when enabled and Z when disabled. Each chip talks to the shared bus through one.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A tristate buffer has an active-low enable E̅. A = 1. What is Y when E̅ = 0? When E̅ = 1?", opts: [["1, then Z", true, "Active low: enabled when E̅ is 0."], ["Z, then 1", false, "That's an active-high enable."], ["0, then 1", false, "A disabled tristate output floats; it doesn't drive 0."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between X and Z on a circuit node?", model: "X means the value is unknown or illegal, usually because two drivers are fighting (contention); it's an error. Z means nothing is driving the node at all, so it floats; that's fine as long as some driver takes over before anyone needs the value." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const GRAY = [0, 1, 3, 2];
  function kmapFig(n, val, hot) {
    const cols = GRAY, rows = n === 3 ? [0, 1] : GRAY, cw = 64, ch = 42, x0 = 110, y0 = 60;
    let s = S.t(x0 - 10, y0 - 22, "AB →", { a: "end", cls: "s" }) + S.t(x0 - 40, y0 - 4, n === 3 ? "C ↓" : "CD ↓", { a: "end", cls: "s" });
    cols.forEach((c, j) => { s += S.t(x0 + j * cw + cw / 2, y0 - 10, bits(c, 2), { cls: "s m" }); });
    rows.forEach((r, i) => {
      s += S.t(x0 - 10, y0 + i * ch + ch / 2 + 5, bits(r, n - 2), { a: "end", cls: "s m" });
      cols.forEach((c, j) => {
        const m = n === 3 ? c * 2 + r : c * 4 + r, v = val[m], h = hot && hot.includes(m);
        s += `<rect class="hit" data-m="${m}" x="${x0 + j * cw}" y="${y0 + i * ch}" width="${cw}" height="${ch}" style="fill:${h ? "var(--accent-soft)" : "var(--card)"};stroke:var(--ink);stroke-width:1;cursor:pointer"/>`;
        s += S.t(x0 + j * cw + cw / 2, y0 + i * ch + ch / 2 + 6, v === 2 ? "X" : String(v), { cls: v === 1 ? "big" : v === 2 ? "big c" : "big m" });
        s += S.t(x0 + j * cw + 8, y0 + i * ch + 12, String(m), { a: "start", cls: "s m" });
      });
    });
    return S.svg(400, y0 + rows.length * ch + 16, s, { max: 400, label: "Karnaugh map" });
  }
  const p8 = {
    id: "p8", title: "Karnaugh maps", mins: 30,
    blurb: "Lay the truth table out so neighbours differ in one variable. Then circle.",
    takeaway: "A Karnaugh map (K-map, Maurice Karnaugh, Bell Labs, 1953) arranges a truth table as a grid where adjacent squares differ in exactly one variable, so combinable terms (PA + PA̅ = P) sit next to each other. Rows and columns are labelled in Gray code order (00, 01, 11, 10), not binary order. The map wraps around: the left and right edges (and top and bottom) are adjacent. Rules: circle all the 1s using the fewest circles; every square in a circle must be 1 (or X); each circle spans a power of 2 (1, 2 or 4) squares in each direction; make each circle as large as possible (prime implicants); circles may wrap around edges; a 1 may be circled more than once. Read each circle's implicant by keeping only the variables that are constant inside it. Don't cares (X) in outputs can be circled when they help and left out when they don't. Minimal solutions aren't always unique. In practice logic synthesizers do this, but the insight (and interviews!) make K-maps worth knowing.",
    steps: [
      { k: "learn", title: "Neighbours differ by one", b: [
        `<p>Simplifying is all about finding pairs like PA + PA̅. A <b>K-map</b> lays out the truth table so those pairs are <b>next to each other</b>.</p>`,
        `<p>The column labels go 00, 01, <b>11</b>, 10: a <b>Gray code</b>. Each step changes one bit. And the map <b>wraps around</b>: the far left and far right columns are neighbours too (roll it into a tube, then a donut).</p>`,
      ]},
      { k: "learn", title: "The circling rules", b: [
        `<ol><li>Circle all the 1s with the <b>fewest</b> circles.</li><li>Every square inside a circle is a 1 (or an X).</li><li>Each circle is 1, 2 or 4 squares in each direction (a power of 2).</li><li>Make each circle as <b>large</b> as possible.</li><li>Circles may wrap around the edges.</li><li>A 1 may be in several circles if that means fewer circles.</li></ol>`,
        `<p>Read each circle: keep only the variables that don't change inside it.</p>`,
      ]},
      { k: "play", title: "K-map lab", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), list = el(`<div class="row"></div>`), ro = el(`<div></div>`);
          let n = 3, val = [1, 0, 0, 0, 1, 1, 1, 0], sel = -1, sol = [];
          function solve() { const ones = [], dcs = []; val.forEach((v, m) => { if (v === 1) ones.push(m); if (v === 2) dcs.push(m); }); sol = minimize(n, ones, dcs); }
          function draw() {
            const names = n === 3 ? "ABC" : "ABCD";
            const hot = sel >= 0 && sol[sel] ? [...Array(2 ** n).keys()].filter((m) => implCovers(sol[sel], m)) : null;
            f.innerHTML = kmapFig(n, val, hot);
            f.querySelectorAll("[data-m]").forEach((r) => r.addEventListener("click", () => { const m = +r.dataset.m; val[m] = (val[m] + 1) % 3; sel = -1; solve(); draw(); }));
            list.innerHTML = "";
            sol.forEach((p, i) => { const b = btn(implText(p, names), "small"); b.setAttribute("aria-pressed", String(i === sel)); b.addEventListener("click", () => { sel = sel === i ? -1 : i; draw(); }); list.appendChild(b); });
            ro.innerHTML = readout([["Minimal SOP", sol.length ? sol.map((p) => implText(p, names)).join(" + ") : "0"], ["Circles", String(sol.length)]]);
          }
          const presets = [["3 inputs", 3, [1, 0, 0, 0, 1, 1, 1, 0]], ["4 inputs", 4, [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0]], ["4 + don't cares", 4, [1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2]]];
          host.append(toggle(presets.map((p) => p[0]), (k) => { n = presets[k][1]; val = presets[k][2].slice(); sel = -1; solve(); draw(); }), f, el(`<p class="aside">Circles in the minimal solution (click one to highlight it):</p>`), list, ro);
          solve(); draw();
        },
        `<p class="aside">Click a square to cycle it 0 → 1 → X. The small number is the minterm. The 4-input presets are the top segment of a seven-segment display (digits 0–9), with and without don't cares for the unused codes 10–15.</p>`,
      ]},
      { k: "learn", title: "Don't cares", b: [
        `<p>Some input combinations never happen (a BCD digit is never 10–15). Their outputs are <b>don't cares</b>, X.</p>`,
        `<p>Circle an X if it lets you draw a bigger or fewer circle; ignore it otherwise. In the lab, compare the two 4-input presets: the don't cares shrink the answer a lot.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "On a 3-input K-map (columns AB in Gray order, rows C), the 1s are in columns 00 and 10, both rows. The minimal SOP is…", opts: [["B̅", true, "Columns 00 and 10 wrap around: a 2×2 circle where B = 0 throughout."], ["A̅B̅ + AB̅", false, "Correct but not minimal: the two pairs wrap into one circle."], ["C̅", false, "C changes inside the group."]] },
        { t: "mcq", q: "Why are K-map columns ordered 00, 01, 11, 10 instead of 00, 01, 10, 11?", opts: [["So neighbouring columns differ in one variable, putting combinable terms next to each other", true, "That's the Gray code."], ["It's alphabetical", false, "No: it's chosen so adjacent squares differ by one bit."], ["To save space", false, "The size is the same either way."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you read the implicant for a circle on a K-map?", model: "Look at each variable across all the squares in the circle. If a variable is 1 throughout, include it in true form; if it's 0 throughout, include it complemented; if it changes inside the circle, leave it out. AND the kept literals together." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Muxes and decoders as logic", mins: 20,
    blurb: "A mux is a programmable lookup table. A decoder hands you every minterm.",
    takeaway: "2:1 mux: data D0, D1, select S; Y = D0 if S = 0, D1 if S = 1; Y = D0S̅ + D1S. It can be built from SOP logic or from two tristate buffers (exactly one enabled). An N:1 mux needs log₂N select lines; 4:1 can be two-level logic, tristates, or two levels of 2:1 muxes. Mux logic: a 2^N-input mux implements any N-input function as a lookup table: tie each data input to the output value of its row (reprogram by changing the data inputs). Halve it: a 2^(N−1)-input mux suffices if you also allow the last variable (or its complement) as a data input. Decoder: N inputs, 2^N one-hot outputs; each output is one minterm (built from 2^N N-input ANDs). Decoder + OR gate builds any function: OR the outputs for the rows where the function is 1 (the idea behind ROMs).",
    steps: [
      { k: "learn", title: "Recap", b: [
        `<p>A <b>2:1 mux</b>: Y = D0 when S = 0, D1 when S = 1. As an equation, Y = D0S̅ + D1S. An N:1 mux needs log<sub>2</sub>N select lines.</p>`,
        `<p>A <b>decoder</b> has N inputs and 2<sup>N</sup> outputs, exactly one HIGH (“one-hot”). Each output is one <b>minterm</b>.</p>`,
        seenPP("Decoders and muxes built from gates.", "03-digital-logic-structures.html#p4", "Chapter 3, Part 4"),
      ]},
      { k: "play", title: "A mux as a lookup table", b: [
        (host, id) => {
          const tt = el(`<div></div>`), ro = el(`<div></div>`);
          let d = [0, 1, 1, 0];
          function draw() { tt.innerHTML = truthTable(["A", "B"], ["Y"], ([a, b]) => d[a * 2 + b]); const nm = { "0001": "AND", "0111": "OR", "0110": "XOR", "1001": "XNOR", "1110": "NAND", "1000": "NOR" }[d.join("")]; ro.innerHTML = readout([["Data inputs D0–D3", d.join(" ")], ["This mux now computes", nm || "some other function of A and B"]]); }
          const bb = Digital.bitButtons("0110", (b) => { d = b.split("").map(Number); draw(); }, { label: "Data inputs" });
          host.append(el(`<p class="aside">A and B drive the select lines. Set the four data inputs D0–D3:</p>`), bb.el, ro, tt);
          draw();
        },
        `<p class="aside">The data inputs are just the output column of the truth table. Rewire them, and the same mux computes a different function. Try making AND, then NAND.</p>`,
      ]},
      { k: "learn", title: "Half the mux", b: [
        `<p>Trick: use the last variable itself as a data input. For AND: when A = 0, Y = 0; when A = 1, Y = B. So a <b>2:1</b> mux with D0 = 0, D1 = B, select A, is an AND gate.</p>`,
        `<div class="key">Any N-input function fits in a 2<sup>N−1</sup>-input mux, using 0, 1, the last variable and its complement as data inputs.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "With a 2:1 mux selected by A, which data inputs make Y = A ⊕ B?", opts: [["D0 = B, D1 = B̅", true, "When A = 0, A ⊕ B = B; when A = 1, it's B̅."], ["D0 = 0, D1 = 1", false, "That's just Y = A."], ["D0 = B̅, D1 = B", false, "That's XNOR."]] },
        { t: "num", q: "A function of 3 inputs is 1 on 5 rows. Built from a 3:8 decoder, how many inputs does the OR gate need?", a: 5, tol: 0, why: "One per row where the function is 1: OR the 5 minterm outputs." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How can a 4:1 multiplexer implement any 2-input logic function?", model: "Connect the two inputs to the select lines and tie each of the four data inputs to 0 or 1, matching the function's output in the corresponding row of the truth table. The mux then just looks up the right row. Changing the data inputs reprograms it to a different function." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  /* Unit-delay simulation of Y = A̅B̅ + BC (A = 0, C = 1) with B falling at t = 3; optional consensus term A̅C. */
  function glitchSim(fix) {
    const T = 12, B = [], nb = [], n1 = [], n2 = [], n3 = [], Y = [];
    for (let t = 0; t < T; t++) B[t] = t < 3 ? 1 : 0;
    for (let t = 0; t < T; t++) {
      nb[t] = t ? 1 - B[t - 1] : 0;
      n1[t] = t ? nb[t - 1] : 0;        // A̅·B̅ with A = 0: just B̅, one AND delay
      n2[t] = t ? B[t - 1] : 1;         // B·C with C = 1
      n3[t] = 1;                         // A̅·C, constant 1
      Y[t] = t ? (n1[t - 1] | n2[t - 1] | (fix ? n3[t - 1] : 0)) : 1;
    }
    n1[0] = 0; n1[1] = 0;
    return { B, n1, n2, Y };
  }
  const p10 = {
    id: "p10", title: "Timing: delays and glitches", mins: 25,
    blurb: "Propagation vs contamination delay, the critical path, and outputs that wobble.",
    takeaway: "Outputs take time to respond. Delay is measured from the input's 50% point to the output's 50% point; LOW→HIGH is a rising edge, HIGH→LOW a falling edge. Propagation delay t_pd: the maximum time from an input change until the outputs reach their final values. Contamination delay t_cd: the minimum time from an input change until any output starts to change. Causes: charging capacitance and the speed of light; t_pd and t_cd differ because of rise vs fall, different inputs, temperature. t_pd of a circuit = sum of t_pd along the critical (longest, slowest) path; t_cd = sum of t_cd along the short (fastest) path. Mux designs differ: two-level and tristate 4:1 muxes are control-critical (worst path from S), a tree of 2:1 muxes is data-critical (worst path from D): pick based on which inputs arrive late. Glitches (hazards): one input change causing several output changes, e.g. when a change crosses between two prime implicants on a K-map and one turns off before the other turns on. Adding the consensus term covers the boundary and removes that glitch, at extra cost; glitches from simultaneous input changes can't be fixed that way. Just wait t_pd before using an output.",
    steps: [
      { k: "learn", title: "Two delays", b: [
        fig(wave([{ name: "A", v: [0, 0, 1, 1, 1, 1, 1, 1, 1] }, { name: "Y", v: [0, 0, 0, "x", "x", 1, 1, 1, 1] }], { dx: 40, marks: [{ t: 2 }, { t: 3, label: "t_cd" }, { t: 5, label: "t_pd" }] })),
        `<div class="two"><div class="tile"><h3>Contamination delay t<sub>cd</sub></h3><p>The <b>minimum</b> time until an output <i>starts</i> to change.</p></div><div class="tile"><h3>Propagation delay t<sub>pd</sub></h3><p>The <b>maximum</b> time until the outputs have <i>settled</i>.</p></div></div>`,
        `<p class="aside">The first dashed line is when A changes. Between t<sub>cd</sub> and t<sub>pd</sub> after it, Y is changing and unknown (shaded). Delays are picoseconds to nanoseconds, caused by charging capacitance and the speed of light.</p>`,
      ]},
      { k: "learn", title: "Critical path and short path", b: [
        `<div class="key">t<sub>pd</sub> of a circuit = sum of the gate t<sub>pd</sub>'s along the <b>critical path</b> (the slowest). t<sub>cd</sub> = sum of the gate t<sub>cd</sub>'s along the <b>short path</b> (the fastest).</div>`,
        `<p>Example: from A through an AND, an AND and an OR is the longest path; from D through just the OR is the shortest. So t<sub>pd</sub> = 2t<sub>pd,AND</sub> + t<sub>pd,OR</sub> and t<sub>cd</sub> = t<sub>cd,OR</sub>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Every gate has t_pd = 40 ps. The longest path from any input to Y passes through 4 gates. What is t_pd of the circuit?", a: 160, tol: 0, unit: "ps", why: "4 × 40 = 160 ps." },
        { t: "num", q: "Same circuit; every gate has t_cd = 25 ps, and the shortest path passes through 2 gates. What is t_cd?", a: 50, tol: 0, unit: "ps", why: "2 × 25 = 50 ps." },
      ]},
      { k: "learn", title: "Control-critical or data-critical?", b: [
        `<p>Three ways to build a 4:1 mux have different worst paths. Two-level logic and the tristate version are <b>control-critical</b>: the slow path starts at the select S. A tree of 2:1 muxes is <b>data-critical</b>: the slow path starts at a data input D.</p>`,
        `<p>If the data arrives early and the select arrives late, choose the design with the fastest S-to-Y path, and vice versa. The best circuit depends on when its inputs arrive.</p>`,
      ]},
      { k: "play", title: "Watch a glitch", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), vd = el(`<span class="verdict"></span>`);
          let fix = 0;
          function draw() {
            const g = glitchSim(fix);
            f.innerHTML = wave([{ name: "B", v: g.B }, { name: "n1 = A̅B̅", v: g.n1 }, { name: "n2 = BC", v: g.n2 }, { name: "Y", v: g.Y, cls: "hl" }], { dx: 26, x0: 100 });
            vd.className = "verdict " + (fix ? "ok" : "no");
            vd.textContent = fix ? "With the consensus term A̅C (always 1 here), Y stays 1 throughout." : "Y should stay 1, but it dips to 0 for one gate delay: a glitch.";
          }
          host.append(toggle(["Y = A̅B̅ + BC", "Add consensus term A̅C"], (k) => { fix = k; draw(); }), f, vd);
          draw();
        },
        `<p class="aside">A = 0, C = 1, and B falls from 1 to 0. n2 (the short path) falls one gate delay later; n1 has to wait for the inverter too, so it rises one delay after that. For one delay both OR inputs are 0.</p>`,
      ]},
      { k: "why", title: "Should you fix glitches?", b: [
        `<p>On a K-map, the glitch happens when one input change moves across the boundary between two circles. A redundant circle covering that boundary (the consensus term) removes it, at the cost of an extra gate.</p>`,
        `<p>But glitches from <b>several inputs changing at once</b> can't be fixed by adding gates, and real circuits are full of those. So the real lesson: <b>wait t<sub>pd</sub></b> before using an output, and don't be surprised by glitches on a simulator or scope.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you find the propagation delay and contamination delay of a combinational circuit?", model: "Find the critical path, the path from any input to any output that goes through the slowest chain of gates, and add up their propagation delays: that's t_pd. Find the short path, the fastest path from any input to any output, and add up its contamination delays: that's t_cd." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "hh2", eyebrow: "Harris & Harris · Chapter 2", title: "Combinational Logic Design",
    intro: `<p>Ten parts: circuits as black boxes, Boolean equations from truth tables, Boolean algebra (one variable, then several), simplifying and drawing schematics, multilevel logic and bubble pushing, X and Z, Karnaugh maps, muxes and decoders as logic, and timing.</p><p>The Math Toolkit's Binary and Boolean module is a gentler start if the algebra feels new. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book, then the interview questions. They test whether the ideas stuck, so don't expect them to look like the questions here.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10],
    summary: `
      <h3>Combinational circuits</h3>
      <p>Outputs depend only on current inputs. Composition rules: combinational elements, one driver per node, no cycles.</p>
      <h3>Equations</h3>
      <p>Literal, implicant (product), minterm (all inputs), maxterm. SOP: OR of minterms where Y = 1, Σ(…). POS: AND of maxterms where Y = 0, Π(…). Precedence: NOT, AND, OR.</p>
      <h3>Theorems</h3>
      <div class="eq">B·1 = B   B·0 = 0   B·B = B   B̿ = B   B·B̅ = 0   and duals</div>
      <div class="eq">(B + C)(B + D) = B + CD   B(B + C) = B   BC + BC̅ = B   BC + B̅D + CD = BC + B̅D</div>
      <div class="eq">De Morgan: (AB)̅ = A̅ + B̅    (A + B)̅ = A̅B̅</div>
      <p>Minimize with PA + PA̅ = P; use prime implicants. Bubble pushing: pushing a bubble through a gate swaps AND ↔ OR. NAND-NAND = AND-OR.</p>
      <h3>X, Z, K-maps</h3>
      <p>X = contention/unknown (or don't care in a truth table); Z = floating. Tristate: enabled → Y = A, disabled → Z. K-maps: Gray-code order, wrap around, power-of-2 circles, as large and as few as possible; don't cares help.</p>
      <h3>Building blocks and timing</h3>
      <p>A 2<sup>N</sup>:1 mux is any N-input function (2<sup>N−1</sup>:1 with a variable as data). Decoder outputs are minterms. t<sub>pd</sub> = sum along the critical path; t<sub>cd</sub> = sum along the short path. Glitches: cross-implicant changes; consensus term fixes one kind.</p>`,
  };
  Course.start(window.CHAPTER);
})();
