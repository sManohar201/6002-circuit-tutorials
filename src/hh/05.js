(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const { sv, bits, uval, sval, truthTable, wave, bitButtons, bitRow } = Digital;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const c = (t) => `<code>${t}</code>`;
  const seenPP = (html, href, where) => `<div class="key"><b>Seen in Patt & Patel:</b> ${html} <a href="../pp/${href}">${where} →</a></div>`;
  const vlsi = (html) => `<p class="aside">${html} CMOS VLSI Chapter 11 builds these at the transistor level.</p>`;

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Adders: half, full, ripple", mins: 20,
    blurb: "From a 1-bit adder to an N-bit carry-propagate adder, and why ripple-carry is slow.",
    takeaway: "Half adder: inputs A, B; outputs S = A ⊕ B and Cout = AB (an XOR and an AND); it has no carry in. Full adder: adds Cin too: S = A ⊕ B ⊕ Cin, Cout = AB + ACin + BCin. A carry-propagate adder (CPA) adds two N-bit numbers and a carry in, giving N-bit S and Cout (drawn like a full adder but with busses). Three common CPAs: ripple-carry, carry-lookahead, prefix. Ripple-carry: chain N full adders, each Cout into the next Cin (modularity and regularity), but the carry ripples through every bit: t_ripple = N·t_FA. In SystemVerilog, assign {cout, s} = a + b + cin; and the synthesis tool picks the cheapest adder design that meets the speed requirement.",
    steps: [
      { k: "learn", title: "Half and full adders", b: [
        `<div class="two"><div class="tile"><h3>Half adder</h3><p>Two inputs A, B.</p><div class="eq">S = A ⊕ B   C<sub>out</sub> = AB</div><p>No carry in, so it can't be chained.</p></div><div class="tile"><h3>Full adder</h3><p>Adds a carry in too.</p><div class="eq">S = A ⊕ B ⊕ C<sub>in</sub></div><div class="eq">C<sub>out</sub> = AB + AC<sub>in</sub> + BC<sub>in</sub></div></div></div>`,
        seenPP("The one-bit adder and chaining four of them.", "03-digital-logic-structures.html#p5", "Chapter 3, Part 5"),
      ]},
      { k: "learn", title: "Ripple-carry", b: [
        `<p>A <b>carry-propagate adder</b> (CPA) adds two N-bit numbers. The simplest: chain N full adders. Each C<sub>out</sub> feeds the next C<sub>in</sub>.</p>`,
        `<div class="key">The carry must <b>ripple</b> through every bit: S<sub>31</sub> waits for C<sub>30</sub>, which waits for C<sub>29</sub>… all the way back to C<sub>in</sub>. So t<sub>ripple</sub> = N · t<sub>FA</sub>.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A full adder has a delay of 240 ps. How long does a 64-bit ripple-carry adder take?", a: 15360, tol: 0.01, unit: "ps", why: "64 × 240 ps = 15.36 ns. Far too slow for a GHz processor. Parts 2 and 3 fix that." },
      ]},
      { k: "learn", title: "In SystemVerilog", b: [
        sv(`
module adder #(parameter N = 8)
              (input  logic [N-1:0] a, b,
               input  logic         cin,
               output logic [N-1:0] s,
               output logic         cout);
  assign {cout, s} = a + b + cin;
endmodule`),
        `<p>Just ${c("+")}. The synthesis tool chooses among many adder designs, picking the smallest that's fast enough. ${c("{cout, s}")} is N+1 bits, so the carry out lands in ${c("cout")}.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a ripple-carry adder get slower as N grows?", model: "Each bit's sum depends on the carry from the bit below, which depends on the bit below that, and so on back to the carry in. In the worst case a carry has to pass through every full adder in turn, so the delay is N times one full adder's delay." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Faster adders: lookahead and prefix", mins: 30,
    blurb: "Generate and propagate signals let carries skip ahead. A prefix tree makes delay grow like log N.",
    takeaway: "Column i generates a carry if it produces one regardless of carry in: G_i = A_iB_i. It propagates a carry if a carry in produces a carry out: P_i = A_i + B_i. So C_i = G_i + P_iC_(i−1). For a block of columns: G_3:0 = G_3 + P_3(G_2 + P_2(G_1 + P_1G_0)), P_3:0 = P_3P_2P_1P_0, and C_i = G_i:j + P_i:jC_j. Carry-lookahead adder (CLA): split N bits into k-bit blocks; each block computes its G and P in parallel, then the carry hops block to block through one AND-OR: t_CLA = t_pg + t_pg_block + (N/k − 1)t_AND_OR + k·t_FA. Faster than ripple for N > 16, but still linear in N. Prefix adder: compute G and P for pairs, then blocks of 4, 8, 16… with log₂N levels of black cells (G_i:j = G_i:k + P_i:kG_(k−1):j, P_i:j = P_i:kP_(k−1):j), treating Cin as column −1 (G_−1 = Cin, P_−1 = 0); then S_i = (A_i ⊕ B_i) ⊕ G_(i−1):−1. Delay t_PA = t_pg + log₂N·t_pg_prefix + t_XOR. Faster adders cost more hardware and power; modern PCs use prefix adders on critical paths.",
    steps: [
      { k: "learn", title: "Generate and propagate", b: [
        `<div class="two"><div class="tile"><h3>Generate G<sub>i</sub> = A<sub>i</sub>B<sub>i</sub></h3><p>Both bits are 1: a carry comes out <b>no matter what</b> comes in.</p></div><div class="tile"><h3>Propagate P<sub>i</sub> = A<sub>i</sub> + B<sub>i</sub></h3><p>At least one bit is 1: a carry in <b>passes through</b>.</p></div></div>`,
        `<div class="eq">C<sub>i</sub> = G<sub>i</sub> + P<sub>i</sub>C<sub>i−1</sub></div>`,
        `<p>The same idea works for a whole <b>block</b> of columns: the block generates if its top column generates, or propagates a carry generated lower down; it propagates only if every column propagates.</p>`,
        `<div class="eq">G<sub>3:0</sub> = G<sub>3</sub> + P<sub>3</sub>(G<sub>2</sub> + P<sub>2</sub>(G<sub>1</sub> + P<sub>1</sub>G<sub>0</sub>))    P<sub>3:0</sub> = P<sub>3</sub>P<sub>2</sub>P<sub>1</sub>P<sub>0</sub></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A 4-bit block has A = 0110 and B = 1001. What are P₃:₀ and G₃:₀?", opts: [["P = 1, G = 0: every column propagates, none generates", true, "Each column has exactly one 1. A carry in would ripple all the way through; with no carry in, nothing comes out."], ["P = 0, G = 1", false, "No column has both bits 1, so nothing is generated."], ["P = 1, G = 1", false, "G needs some column with both bits 1."]] },
      ]},
      { k: "learn", title: "Carry-lookahead adder", b: [
        `<p>Split a 32-bit adder into eight 4-bit blocks. Every block computes its G and P <b>at the same time</b>. Then the carry hops from block to block through a single AND-OR gate per block, instead of rippling through 4 full adders.</p>`,
        `<div class="eq">t<sub>CLA</sub> = t<sub>pg</sub> + t<sub>pg_block</sub> + (N/k − 1) t<sub>AND_OR</sub> + k · t<sub>FA</sub></div>`,
        `<p class="aside">The last term is the ripple inside the final block. Still linear in N, but with a much smaller slope.</p>`,
      ]},
      { k: "learn", title: "Prefix adder", b: [
        `<p>Go further: compute G and P for pairs of columns, then blocks of 4, 8, 16… doubling each level. After log<sub>2</sub>N levels of <b>black cells</b>, every column knows its carry in.</p>`,
        `<div class="eq">G<sub>i:j</sub> = G<sub>i:k</sub> + P<sub>i:k</sub>G<sub>k−1:j</sub>    P<sub>i:j</sub> = P<sub>i:k</sub>P<sub>k−1:j</sub></div>`,
        `<p>Then S<sub>i</sub> = (A<sub>i</sub> ⊕ B<sub>i</sub>) ⊕ G<sub>i−1:−1</sub>, where column −1 holds C<sub>in</sub>.</p>`,
        `<div class="eq">t<sub>PA</sub> = t<sub>pg</sub> + log<sub>2</sub>N · t<sub>pg_prefix</sub> + t<sub>XOR</sub></div>`,
      ]},
      { k: "play", title: "Race the three adders", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let N = 32, g = 80;
          const rip = (n) => n * 3 * g, cla = (n) => g + 6 * g + (n / 4 - 1) * 2 * g + 4 * 3 * g, pre = (n) => g + Math.log2(n) * 2 * g + g;
          function draw() {
            const ym = 64 * 3 * g / 1000;
            f.innerHTML = plot({ x: [4, 64], y: [0, ym], xt: [8, 16, 32, 64], yt: [0, 0.25, 0.5, 0.75, 1].map((q) => +(q * ym).toPrecision(2)), xl: "bits N", yl: "delay (ns)",
              series: [{ f: (n) => rip(n) / 1000, cls: "s4" }, { f: (n) => cla(n) / 1000, cls: "s2" }, { f: (n) => pre(n) / 1000, cls: "s1" }],
              marks: [{ x: N, y: rip(N) / 1000, cls: "mkb" }, { x: N, y: cla(N) / 1000, cls: "mk2" }, { x: N, y: pre(N) / 1000 }],
              texts: [{ x: 40, y: rip(40) / 1000 + 0.6, s: "ripple" }, { x: 46, y: cla(46) / 1000 + 0.8, s: "lookahead (k = 4)" }, { x: 50, y: pre(50) / 1000 + 0.8, s: "prefix" }], label: "Adder delay against width for three designs" });
            ro.innerHTML = readout([["Ripple N·t_FA", si(rip(N) * 1e-12, "s")], ["Lookahead, 4-bit blocks", si(cla(N) * 1e-12, "s")], ["Prefix", si(pre(N) * 1e-12, "s")]]);
          }
          host.append(f, slider({ id: id + "-n", label: "Width N", min: 4, max: 64, step: 4, value: N, show: (x) => x + " bits" }, (x) => { N = x; draw(); }).el,
            slider({ id: id + "-g", label: "Two-input gate delay", min: 20, max: 150, step: 5, value: g, show: (x) => x + " ps" }, (x) => { g = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Assumes a full adder = 3 gate delays, t<sub>pg_block</sub> = 6, t<sub>AND_OR</sub> = 2, a prefix cell = 2. Prefix delay grows like log N; the others grow linearly.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Gates are 80 ps (so a full adder is 240 ps). A 32-bit CLA with 4-bit blocks has t_pg = 80, t_pg_block = 480, t_AND_OR = 160 ps. What is its delay?", a: 2640, tol: 0.01, unit: "ps", hint: "80 + 480 + (32/4 − 1)×160 + 4×240.", why: "80 + 480 + 1120 + 960 = 2640 ps, versus 32 × 240 = 7680 ps for ripple." },
        { t: "num", q: "Same gates, 32-bit prefix adder with 160 ps prefix cells and an 80 ps XOR. Delay?", a: 960, tol: 0.01, unit: "ps", hint: "80 + log₂32 × 160 + 80.", why: "80 + 5×160 + 80 = 960 ps: about 8× faster than ripple." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a prefix adder get logarithmic delay?", model: "It computes generate and propagate signals for ever larger blocks in a tree: pairs of columns, then blocks of four, eight, sixteen and so on, each level combining two smaller blocks with a black cell. After log₂N levels every column knows whether a carry reaches it, so all the sums can be computed at once. The number of levels, not the number of bits, sets the delay." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const ALUF = ["A AND B", "A OR B", "A + B", "not used", "A AND B̅", "A OR B̅", "A − B", "SLT"];
  const p3 = {
    id: "p3", title: "Subtractors, comparators, the ALU", mins: 25,
    blurb: "Subtract with an adder, compare by subtracting, and combine it all into an ALU.",
    takeaway: "Subtraction: A − B = A + B̅ + 1: invert B and set the adder's carry in to 1. Equality comparator: XNOR each pair of bits, then AND them all. Magnitude comparator: compute A − B and look at the sign bit (1 means A < B). SystemVerilog has ==, !=, <, <=, >, >=. ALU: one block doing several operations, chosen by control F₂:₀: 000 AND, 001 OR, 010 add, 100 A AND B̅, 101 A OR B̅, 110 subtract, 111 SLT (set if less than: Y = 1 if A < B). Inside: F₂ inverts B (and is the adder's carry in, so 110 gives A + B̅ + 1 = A − B); F₁:₀ drives a 4:1 mux choosing AND, OR, sum, or the zero-extended sign bit of the sum (for SLT). ALUs may also output flags like overflow and zero. (The ALU's HDL is an exercise.)",
    steps: [
      { k: "learn", title: "Subtract with an adder", b: [
        `<p>A − B = A + (−B), and −B = B̅ + 1. So invert B and feed a 1 into the adder's carry in:</p>`,
        `<div class="eq">A − B = A + B̅ + 1</div>`,
        `<p>One adder, a row of inverters, and C<sub>in</sub> = 1. No separate subtractor.</p>`,
      ]},
      { k: "learn", title: "Comparators", b: [
        `<div class="two"><div class="tile"><h3>Equality</h3><p>XNOR each pair of bits (1 if equal), then AND all the results.</p></div><div class="tile"><h3>Magnitude</h3><p>Compute A − B. If the sign bit is 1, A &lt; B.</p></div></div>`,
        `<p class="aside">The sign-bit trick only works if A − B doesn't overflow. For full-range signed numbers you'd also need the overflow flag.</p>`,
      ]},
      { k: "play", title: "An 8-bit ALU", b: [
        (host, id) => {
          const ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let F = 2, A = 25, B = 32;
          function draw() {
            const a = A & 255, b = B & 255, BB = F & 4 ? ~b & 255 : b, sum = (a + BB + (F & 4 ? 1 : 0)) & 255;
            const Y = [(a & BB), (a | BB), sum, sum >> 7][F & 3] & 255;
            const used = F === 3;
            ro.innerHTML = readout([["F₂:₀", bits(F, 3) + "  (" + ALUF[F] + ")"], ["BB (B or B̅)", bits(BB, 8)], ["Adder (carry in = F₂)", bits(sum, 8)], ["Y", used ? "—" : `${bits(Y, 8)} = ${Y} (signed ${sval(bits(Y, 8))})`], ["Zero flag", used ? "—" : String(Y === 0 ? 1 : 0)]]);
            vd.className = "verdict " + (used ? "no" : "ok");
            vd.textContent = used ? "F = 011 is not used." : F === 7 ? `SLT: A − B = ${sval(bits(sum, 8))}; its sign bit is ${sum >> 7}, so Y = ${sum >> 7}${sum >> 7 ? " (A < B)" : " (A ≥ B)"}.` : `Y = ${ALUF[F]}.`;
          }
          host.append(toggle(ALUF.map((x, i) => bits(i, 3)), (i) => { F = i; draw(); }, F),
            slider({ id: id + "-a", label: "A (signed)", min: -128, max: 127, step: 1, value: A, show: (x) => String(x) }, (x) => { A = x; draw(); }).el,
            slider({ id: id + "-b", label: "B (signed)", min: -128, max: 127, step: 1, value: B, show: (x) => String(x) }, (x) => { B = x; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">F<sub>2</sub> does double duty: it inverts B and is the adder's carry in. F<sub>1:0</sub> picks the output: AND, OR, sum, or the sum's sign bit (zero-extended) for SLT.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "For SLT with A = 25, B = 32: what does the adder compute, and what is Y?", opts: [["A − B = −7 (negative), so Y = 1", true, "F = 111: F₂ = 1 makes the adder subtract; the sign bit of −7 is 1."], ["A + B = 57, so Y = 0", false, "F₂ = 1 inverts B and sets carry in: subtraction."], ["Y = 32", false, "SLT outputs only 0 or 1."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the ALU use one adder for both addition and subtraction?", model: "A control bit (F₂) both selects B or its bitwise inverse to feed the adder and acts as the adder's carry in. With F₂ = 0 the adder computes A + B. With F₂ = 1 it computes A + B̅ + 1, which is A − B in two's complement." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const shiftOps = {
    "LSL (<<)": (b, n) => (b.slice(n) + "0".repeat(n)),
    "LSR (>>)": (b, n) => ("0".repeat(n) + b.slice(0, b.length - n)),
    "ASR (>>>)": (b, n) => (b[0].repeat(n) + b.slice(0, b.length - n)),
    "ROR": (b, n) => (b.slice(b.length - n) + b.slice(0, b.length - n)),
    "ROL": (b, n) => (b.slice(n) + b.slice(0, n)),
  };
  const p4 = {
    id: "p4", title: "Shifters and rotators", mins: 20,
    blurb: "Move bits left or right: multiply and divide by powers of 2.",
    takeaway: "Logical shifter: shift left (LSL, <<) or right (LSR, >>), filling with 0s (11001 LSR 2 = 00110). Arithmetic shifter: like logical, but a right shift (ASR, >>>) fills with copies of the old msb (11001 ASR 2 = 11110); ASL = LSL. Rotator: bits shifted off one end come back at the other (11001 ROR 2 = 01110). An N-bit shifter is N N:1 muxes, controlled by the log₂N-bit shift amount shamt. Shifting left by N multiplies by 2^N (000011 << 4 = 110000: 3 × 16 = 48). Arithmetic right shift by N divides a signed number by 2^N (11100 >>> 2 = 11111: −4/4 = −1). (Rotator designs are an exercise.)",
    steps: [
      { k: "learn", title: "Three kinds", b: [
        `<div class="tbl"><table><thead><tr><th>Kind</th><th>Left</th><th>Right</th></tr></thead><tbody>
          <tr><td>Logical</td><td>LSL: fill with 0s</td><td>LSR: fill with 0s</td></tr>
          <tr><td>Arithmetic</td><td>ASL = LSL</td><td>ASR: fill with copies of the old msb</td></tr>
          <tr><td>Rotate</td><td>ROL: bits wrap around</td><td>ROR: bits wrap around</td></tr></tbody></table></div>`,
        `<p class="aside">In HDL: ${c("&lt;&lt;")} shift left, ${c("&gt;&gt;")} logical right, ${c("&gt;&gt;&gt;")} arithmetic right.</p>`,
      ]},
      { k: "play", title: "Shifter lab", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let b = "11001010", op = "LSL (<<)", n = 2;
          function draw() {
            const y = shiftOps[op](b, n);
            f.innerHTML = S.svg(420, 140, S.t(30, 52, "A", { a: "start" }) + bitRow(b, { y: 30, w: 34, sign: true }) + S.t(30, 112, "Y", { a: "start" }) + bitRow(y, { y: 90, w: 34, sign: true }), { label: "Shifter input and output" });
            ro.innerHTML = readout([["Unsigned", `${uval(b)} → ${uval(y)}`], ["Signed", `${sval(b)} → ${sval(y)}`]]);
          }
          const B = bitButtons(b, (x) => { b = x; draw(); }, { label: "A" });
          host.append(B.el, toggle(Object.keys(shiftOps), (i) => { op = Object.keys(shiftOps)[i]; draw(); }, 0), slider({ id: id + "-n", label: "Shift amount shamt", min: 0, max: 7, step: 1, value: n, show: (x) => String(x) }, (x) => { n = x; draw(); }).el, f, ro);
          draw();
        },
        `<p class="aside">Try LSL by 1 and 2 on a small number: ×2, ×4. Then make A negative and compare LSR with ASR by 1: only ASR keeps the sign and halves the number.</p>`,
      ]},
      { k: "learn", title: "Built from muxes", b: [
        `<p>Each output bit Y<sub>i</sub> is a mux choosing among the input bits, selected by the shift amount. A 4-bit shifter: four 4:1 muxes with a 2-bit ${c("shamt")}. N bits: N N:1 muxes.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "What is 8-bit 11110000 >>> 2 (arithmetic), and what does it mean in decimal?", opts: [["11111100: −16 / 4 = −4", true, "Copies of the sign bit fill in. 11110000 = −16."], ["00111100: 60", false, "That's a logical right shift."], ["11000000: −64", false, "That's a left shift."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does an arithmetic right shift copy the msb instead of filling with 0?", model: "So that it divides signed two's complement numbers correctly. The msb is the sign bit; copying it keeps a negative number negative (sign extension), so shifting right by N divides by 2^N. Filling with 0s would turn a negative number into a large positive one." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Multiplication and division", mins: 25,
    blurb: "Partial products and an array of adders; division by repeated trial subtraction.",
    takeaway: "Binary multiplication works like decimal: each multiplier bit times the multiplicand gives a partial product (either the multiplicand or all 0s, so it's just AND gates); shift and add them. An N×N multiplier gives a 2N-bit product. A 4×4 array multiplier: 16 AND gates for the partial products and N − 1 rows of adders to sum them. In HDL: assign y = a * b; (signed if declared signed). Division (unsigned, N bits): R = 0; for i = N−1 down to 0: R = {R << 1, A_i}; D = R − B; if D < 0 then Q_i = 0 (keep R) else Q_i = 1, R = D. Result: A/B = Q + R/B. An array divider's delay grows like N², because each row's carry must ripple to find the sign before choosing R or D. Division is slow and expensive; use it sparingly.",
    steps: [
      { k: "learn", title: "Partial products", b: [
        `<p>Multiply 0101 (5) by 0111 (7), just like long multiplication: each bit of the multiplier selects either the multiplicand or 0000, shifted.</p>`,
        `<div class="eq mono">    0101<br>  × 0111<br>    0101<br>   0101<br>  0101<br>+0000<br>=0100011  (35)</div>`,
        `<p>Each partial-product bit is A<sub>i</sub> AND B<sub>j</sub>: just AND gates. Then N − 1 rows of adders sum them. An N × N multiplier gives a <b>2N-bit</b> product.</p>`,
      ]},
      { k: "play", title: "Multiply step by step", b: [
        (host, id) => {
          const out = el(`<div class="tbl"></div>`), ro = el(`<div></div>`);
          let a = "1011", b = "0110";
          function draw() {
            const A = uval(a), rows = [];
            let tot = 0;
            for (let j = 0; j < 4; j++) { const bj = +b[3 - j], pp = bj ? A << j : 0; tot += pp; rows.push(`<tr><td>B${j} = ${bj}</td><td class="mono">${bits(pp, 8)}</td><td>${bj ? `${a} shifted ${j}` : "all 0s"}</td></tr>`); }
            out.innerHTML = `<table><thead><tr><th>multiplier bit</th><th>partial product</th><th></th></tr></thead><tbody>${rows.join("")}<tr><td><b>sum</b></td><td class="mono"><b>${bits(tot, 8)}</b></td><td>= ${tot}</td></tr></tbody></table>`;
            ro.innerHTML = readout([["A × B", `${A} × ${uval(b)} = ${A * uval(b)}`]]);
          }
          const Ab = bitButtons(a, (x) => { a = x; draw(); }, { label: "A" }), Bb = bitButtons(b, (x) => { b = x; draw(); }, { label: "B" });
          host.append(el(`<p class="aside">Multiplicand A[3:0]:</p>`), Ab.el, el(`<p class="aside">Multiplier B[3:0]:</p>`), Bb.el, out, ro);
          draw();
        },
      ]},
      { k: "learn", title: "Division", b: [
        `<p>Long division in binary: bring down one bit of A at a time into a partial remainder R, and try subtracting B.</p>`,
        `<pre class="code">R = 0
for i = N-1 down to 0
  R = {R &lt;&lt; 1, A[i]}     bring down the next bit
  D = R - B             does B fit?
  if D &lt; 0:  Q[i] = 0   (keep R)
  else:      Q[i] = 1,  R = D</pre>`,
        `<p>At the end, A / B = Q with remainder R. An array divider does this in hardware, and its delay grows like N<sup>2</sup>. Division is slow and expensive: avoid it where you can.</p>`,
      ]},
      { k: "play", title: "Divide step by step", b: [
        (host, id) => {
          const out = el(`<div class="tbl"></div>`);
          let A = 13, B = 3;
          function draw() {
            let R = 0, Q = "", rows = "";
            for (let i = 3; i >= 0; i--) { R = (R << 1) | ((A >> i) & 1); const D = R - B; if (D < 0) { Q += "0"; rows += `<tr><td>${i}</td><td>${R}</td><td>${D}</td><td>0</td><td>keep ${R}</td></tr>`; } else { Q += "1"; rows += `<tr><td>${i}</td><td>${R}</td><td>${D}</td><td>1</td><td>R = ${D}</td></tr>`; R = D; } }
            out.innerHTML = `<table><thead><tr><th>bit i</th><th>R after bring-down</th><th>D = R − B</th><th>Q<sub>i</sub></th><th></th></tr></thead><tbody>${rows}</tbody></table><p class="aside">Q = ${Q} = ${uval(Q)}, remainder ${R}. Check: ${uval(Q)} × ${B} + ${R} = ${uval(Q) * B + R}.</p>`;
          }
          host.append(slider({ id: id + "-a", label: "Dividend A (4 bits)", min: 0, max: 15, step: 1, value: A, show: (x) => `${x} = ${bits(x, 4)}` }, (x) => { A = x; draw(); }).el,
            slider({ id: id + "-b", label: "Divisor B", min: 1, max: 15, step: 1, value: B, show: (x) => String(x) }, (x) => { B = x; draw(); }).el, out);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 16 × 16 unsigned multiplier: how many bits in its product?", a: 32, tol: 0, why: "2N bits. The largest product (2¹⁶ − 1)² just fits in 32 bits." },
        { t: "num", q: "How many AND gates form the partial products of an 8 × 8 array multiplier?", a: 64, tol: 0, why: "One per pair (A_i, B_j): 8 × 8." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why are multiplier partial products just AND gates?", model: "Each partial product is one bit of the multiplier times the whole multiplicand. Multiplying by a single binary digit gives either the multiplicand (digit 1) or zero (digit 0), and 1-bit multiplication is exactly AND. So each partial-product bit is A_i AND B_j." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Fixed point and floating point", mins: 25,
    blurb: "An implied binary point, or a sign, a biased exponent and a fraction. And how floats are added.",
    takeaway: "Fixed point: an implied binary point between integer and fraction bits, known only by agreement (01101100 with 4.4 format = 0110.1100 = 6.75). Signed fixed point uses two's complement (−2.375 = 1101.1010) so ordinary addition works (0.75 + −0.625 = 0.125); common in banking and DSP where precision matters more than range. Floating point (IEEE 754, 1985): sign, biased exponent, fraction with an implicit leading 1. Single precision: 1 + 8 + 23 bits, bias 127, range ±1.18×10⁻³⁸ to ±3.40×10³⁸, about 7 decimal digits. Double: 1 + 11 + 52 bits, range ±2.2×10⁻³⁰⁸ to ±1.8×10³⁰⁸, about 15 digits. Special cases: exponent all 0s with fraction 0 is ±0; exponent all 1s with fraction 0 is ±∞; exponent all 1s with nonzero fraction is NaN (√−1, log of a negative). Rounding modes: down, up, toward zero, to nearest (default; ties go to the even, 0-lsb, neighbour); overflow rounds to ∞, underflow to 0. Addition (same sign): extract fields; prepend the leading 1; compare exponents; shift the smaller mantissa right; add; normalize (shift and adjust exponent); round; reassemble. Floating-point units are separate hardware (the Pentium FDIV bug was a badly loaded lookup table). Some calculators use BCD (4 bits per decimal digit) to show numbers like 1.7 exactly.",
    steps: [
      { k: "learn", title: "Fixed point", b: [
        `<p>Put an <b>implied</b> binary point in a fixed place. With 4 integer and 4 fraction bits (“4.4”):</p>`,
        `<div class="eq">0110.1100 = 4 + 2 + ½ + ¼ = 6.75</div>`,
        `<p>The bits don't store the point; everyone just agrees where it is. Negative values use two's complement, so ordinary adders work: invert and add 1 in the lowest (2<sup>−4</sup>) column.</p>`,
        `<p class="aside">Banking and signal processing like fixed point: exact precision over a known range.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "What is −1.25 in 4.4 two's complement fixed point? (+1.25 = 0001.0100)", opts: [["1110.1100", true, "Invert: 1110.1011. Add 1 in the 2⁻⁴ column: 1110.1100."], ["1001.0100", false, "That's sign/magnitude."], ["1110.1011", false, "That's only the inversion; add 1 at the last fraction bit."]] },
      ]},
      { k: "learn", title: "Floating point recap", b: [
        `<p>IEEE 754 single precision: <b>1</b> sign bit, <b>8</b> exponent bits (bias 127), <b>23</b> fraction bits with an implicit leading 1. Double: 1, 11, 52.</p>`,
        `<div class="tbl"><table><thead><tr><th></th><th>Single</th><th>Double</th></tr></thead><tbody><tr><td>Range (normal)</td><td>±1.18×10<sup>−38</sup> … ±3.40×10<sup>38</sup></td><td>±2.2×10<sup>−308</sup> … ±1.8×10<sup>308</sup></td></tr><tr><td>Precision</td><td>~7 decimal digits</td><td>~15 decimal digits</td></tr></tbody></table></div>`,
        `<p class="aside">Exponent all 0s and fraction 0: ±0. All 1s, fraction 0: ±∞. All 1s, fraction ≠ 0: NaN (not a number), e.g. √−1.</p>`,
        seenPP("Encoding and decoding 32-bit floats bit by bit.", "02-bits-data-types.html#p9", "Chapter 2, Part 9"),
      ]},
      { k: "play", title: "Add two floats, step by step", b: [
        (host, id) => {
          const steps = [
            ["Numbers", "6.5 = 1.101 × 2²     2.5 = 1.01 × 2¹"],
            ["1–2. Extract fields, prepend the leading 1", "mantissas 1.101 and 1.010; biased exponents 129 and 128"],
            ["3. Compare exponents", "129 − 128 = 1: the smaller number shifts right by 1"],
            ["4. Shift the smaller mantissa", "1.010 × 2¹ → 0.101 × 2²"],
            ["5. Add mantissas", "1.101 + 0.101 = 10.010"],
            ["6. Normalize", "10.010 × 2² → 1.0010 × 2³ (shift right, exponent + 1 → 130)"],
            ["7. Round", "the result fits exactly: nothing to round"],
            ["8. Reassemble", "0 10000010 00100000000000000000000 = 9.0 ✓"],
          ];
          const ro = el(`<div></div>`);
          let k = 0;
          const draw = () => { ro.innerHTML = readout([[steps[k][0], steps[k][1]]]); };
          const nx = btn("Next step →", "primary"), bk = btn("← Back");
          nx.addEventListener("click", () => { k = Math.min(steps.length - 1, k + 1); draw(); });
          bk.addEventListener("click", () => { k = Math.max(0, k - 1); draw(); });
          const row = el(`<div class="row"></div>`); row.append(bk, nx);
          host.append(ro, row);
          draw();
        },
        `<p class="aside">Because this is much more work than integer addition, floating point usually has its own hardware: the FPU. Intel's FDIV bug lived in one, from a lookup table loaded wrongly.</p>`,
      ]},
      { k: "learn", title: "Rounding", b: [
        `<p>Results that don't fit the precision round to a neighbour: down, up, toward zero, or <b>to nearest</b> (the default; ties go to the neighbour whose last fraction bit is 0). Too big rounds to ∞ (overflow); too tiny rounds to 0 (underflow).</p>`,
        `<p class="aside">Floats can't hold 1.7 exactly. Calculators and money software often use <b>BCD</b> (4 bits per decimal digit) instead, at a cost in speed.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must the smaller number's mantissa be shifted before two floats are added?", model: "Mantissas can only be added when their binary points line up, which means the numbers must have the same exponent. So the number with the smaller exponent has its mantissa shifted right by the difference in exponents, then the two mantissas are added, and the result is normalized again." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Counters, shift registers, scan chains", mins: 20,
    blurb: "Sequential building blocks: count, shift in, shift out, and test chips through a back door.",
    takeaway: "An N-bit binary counter (clock, reset, output Q) is an adder plus a resettable register: q <= q + 1 each rising edge, reset to 0; it steps through all 2^N values. A shift register (clock, serial input Sin, serial output Sout, parallel outputs Q) shifts in one bit per clock: N flip-flops in series; a serial-to-parallel converter. Adding a parallel input D and a Load control (a mux per flop) makes it a parallel-to-serial converter too: if (load) q <= d; else q <= {q[N−2:0], sin}; sout = q[N−1]. (Shift registers are clocked; shifters are combinational.) Scan chains: testing sequential circuits is hard because you must first drive them into the right state (testing a 32-bit counter's msb from 0 to 1 needs 2³¹ clocks). Scannable flip-flops (a mux in front of D, chosen by Test) chain every flop into one big shift register: in test mode, shift a state in, run one normal cycle, shift the result out (32 + 1 + 32 = 65 cycles for that counter).",
    steps: [
      { k: "learn", title: "Counter", b: [
        sv(`
module counter #(parameter N = 8)
                (input  logic         clk, reset,
                 output logic [N-1:0] q);
  always_ff @(posedge clk, posedge reset)
    if (reset) q <= 0;
    else       q <= q + 1;
endmodule`),
        `<p>An adder and a resettable register: each clock edge, add 1. It counts 0, 1, 2 … 2<sup>N</sup> − 1, then wraps to 0.</p>`,
      ]},
      { k: "play", title: "Shift register with parallel load", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let q = "00000000", sin = 1, load = 0, d = "10110011";
          function draw() { f.innerHTML = S.svg(420, 90, S.t(14, 56, "Sin=" + sin, { a: "start", cls: "s" }) + bitRow(q, { y: 34, w: 36 }) + S.t(406, 56, "Sout", { a: "end", cls: "s" }), { label: "Shift register contents" }); ro.innerHTML = readout([["Q[7:0]", q], ["Sout = Q[7]", q[0]]]); }
          const clk = btn("Clock edge ↑", "primary");
          clk.addEventListener("click", () => { q = load ? d : q.slice(1) + sin; draw(); });
          const D = bitButtons(d, (x) => { d = x; }, { label: "Parallel input D" });
          host.append(toggle(["Sin = 0", "Sin = 1"], (v) => { sin = v; draw(); }, 1), toggle(["Load = 0 (shift)", "Load = 1 (load D)"], (v) => { load = v; }, 0), el(`<p class="aside">Parallel input D[7:0]:</p>`), D.el, clk, f, ro);
          draw();
        },
        `<p class="aside">Shift mode: each clock moves everything one place toward Sout and brings in Sin (here bits move left, toward Q[7]). After 8 clocks, the last 8 serial bits are available in parallel. Load mode: grab D in one clock, then shift it out serially.</p>`,
      ]},
      { k: "learn", title: "Scan chains", b: [
        `<p>To test that a 32-bit counter's top bit flips from 0 to 1, you'd reset it and clock it 2<sup>31</sup> times. Over two billion cycles for one test.</p>`,
        `<p><b>Scannable flip-flops</b> add a mux in front of D. In test mode, all the flops in the chip form one long shift register: the <b>scan chain</b>. Shift in 0111…1, run one normal cycle, shift out the answer: <b>65 cycles</b>.</p>`,
        `<p class="aside">CMOS VLSI Chapter 15 covers design for test in depth.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "What's the difference between a shift register and a shifter?", opts: [["A shift register is sequential (moves one place per clock); a shifter is combinational (shifts by any amount instantly)", true, "Easy to mix up: the book warns about exactly this."], ["They're the same thing", false, "One has flip-flops and a clock, the other doesn't."], ["A shifter stores data", false, "A shifter has no storage."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a scan chain make a chip easier to test?", model: "It links all the flip-flops into one long shift register in test mode. Testers can shift any state they want straight into the chip, run it for one normal cycle, and shift the resulting state out to check it, instead of needing an enormous number of clock cycles to steer the circuit into each state." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Memory arrays", mins: 30,
    blurb: "Bit cells, wordlines and bitlines. DRAM, SRAM, ROM, Flash, and register files.",
    takeaway: "A memory array has 2^N rows (words) of M bits for N address bits: depth × width (1024 × 32 = 32 Kb). Each bit cell connects to a wordline (selects the row) and a bitline (carries the data). Read: let the bitline float, assert the wordline, the cell drives the bitline. Write: drive the bitline hard, then assert the wordline to overpower the cell. A decoder turns the address into one wordline. Ports: each gives read and/or write access to one address; multiported memories serve several at once. RAM is volatile; ROM is nonvolatile (names are historical: both are random access, most ROMs can be written). DRAM (Dennard, IBM, 1966): one transistor + one capacitor per bit; the charge leaks and reads are destructive, so it must be refreshed every few milliseconds and rewritten after reads; slow. SRAM: cross-coupled inverters + two access transistors (6 transistors), static, faster. Flip-flops: ~20 transistors, fastest. SDRAM pipelines accesses with a clock; DDR uses both clock edges. Register file: a small multiported SRAM, e.g. 32 × 32 bits with two read ports and one write port. ROM: a bit is the presence (0) or absence (1) of a transistor; dot notation; PROM (fuses), EPROM (floating gate, UV erase), EEPROM and Flash (electrical erase; Flash erases blocks; Masuoka at Toshiba). A 2^N × M memory can implement any N-input, M-output function: a lookup table (LUT).",
    steps: [
      { k: "learn", title: "Depth × width", b: [
        `<p>N address bits pick one of 2<sup>N</sup> rows. Each row is a <b>word</b> of M bits. Size = <b>depth × width</b>.</p>`,
        `<p>Each <b>bit cell</b> sits where a <b>wordline</b> (row select) crosses a <b>bitline</b> (data). A decoder turns the address into exactly one active wordline.</p>`,
        `<div class="two"><div class="tile"><h3>Read</h3><p>Let the bitline float, raise the wordline: the cell drives the bitline to its value.</p></div><div class="tile"><h3>Write</h3><p>Drive the bitline hard, then raise the wordline: the bitline overpowers the cell.</p></div></div>`,
        seenPP("A 2²-by-3-bit memory built from gates and latches.", "03-digital-logic-structures.html#p8", "Chapter 3, Part 8"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A memory has 12 address bits and a 16-bit word. How many bits does it hold?", a: 65536, tol: 0, unit: "bits", why: "2¹² × 16 = 4096 × 16 = 65,536 bits = 64 Kb." },
      ]},
      { k: "learn", title: "Three kinds of volatile memory", b: [
        `<div class="tbl"><table><thead><tr><th>Type</th><th>Transistors per bit</th><th>How it stores</th><th>Speed</th></tr></thead><tbody>
          <tr><td>Flip-flop</td><td>~20</td><td>two latches</td><td>fast</td></tr>
          <tr><td>SRAM</td><td>6</td><td>cross-coupled inverters + 2 access transistors</td><td>medium</td></tr>
          <tr><td>DRAM</td><td>1 (+ capacitor)</td><td>charge on a capacitor</td><td>slow</td></tr></tbody></table></div>`,
        `<p><b>DRAM</b>'s charge leaks away, and reading it destroys it: it must be <b>refreshed</b> every few milliseconds and rewritten after every read. <b>SRAM</b> holds its value actively (static) and resists noise.</p>`,
        `<p class="aside">SDRAM pipelines accesses with a clock. DDR transfers on both clock edges, doubling throughput.</p>`,
      ]},
      { k: "learn", title: "Register files", b: [
        `<p>A processor's registers are usually a small <b>multiported SRAM</b>: e.g. 32 registers × 32 bits, two read ports and one write port. Two registers can be read and one written in the same cycle. 5-bit addresses pick among 2<sup>5</sup> = 32 registers.</p>`,
      ]},
      { k: "play", title: "A ROM is a lookup table", b: [
        (host, id) => {
          const grid = el(`<div style="display:grid;grid-template-columns:auto repeat(3, 56px);gap:6px;align-items:center"></div>`), ro = el(`<div></div>`);
          let rom = [[0, 1, 1], [1, 1, 0], [1, 0, 0], [0, 1, 0]];
          const names = { "0110": "XOR", "1001": "XNOR", "0001": "AND", "0111": "OR", "1110": "NAND", "1000": "NOR" };
          function draw() {
            grid.innerHTML = `<span></span><b>Data2</b><b>Data1</b><b>Data0</b>`;
            [3, 2, 1, 0].forEach((r) => { grid.appendChild(el(`<span class="mono">addr ${bits(r, 2)}</span>`)); rom[r].forEach((v, j) => { const b = btn(v ? "●" : "·", "small"); b.setAttribute("aria-pressed", String(!!v)); b.addEventListener("click", () => { rom[r][j] = 1 - rom[r][j]; draw(); }); grid.appendChild(b); }); });
            ro.innerHTML = readout([0, 1, 2].map((j) => { const col = [0, 1, 2, 3].map((r) => rom[r][j]).join(""); return [`Data${j} as a function of the address bits`, names[col] || "column " + col]; }));
          }
          host.append(grid, ro);
          draw();
        },
        `<p class="aside">Dot notation: a dot means the stored bit is 1. Each column is a truth table read top to bottom by address. Any 2<sup>N</sup>-word × M-bit memory can compute any M functions of N inputs.</p>`,
      ]},
      { k: "learn", title: "ROM family", b: [
        `<p>In a ROM, a bit is the presence or absence of a transistor, so it survives power-off (<b>nonvolatile</b>).</p>`,
        `<ul><li><b>PROM</b>: fuses blown once by high voltage.</li><li><b>EPROM</b>: charge tunnels onto a floating gate; erase with UV light.</li><li><b>EEPROM</b>: erase electrically, bit by bit.</li><li><b>Flash</b>: erase electrically in blocks; cheap and everywhere (invented by Masuoka at Toshiba, on nights and weekends).</li></ul>`,
        `<p class="aside">RAM vs ROM really means volatile vs nonvolatile. Both are random access, and most “read only” memories can be written.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does DRAM need refreshing but SRAM doesn't?", model: "A DRAM cell stores a bit as charge on a tiny capacitor, which slowly leaks away, and reading it drains it too, so the value must be read and rewritten regularly and after each read. An SRAM cell stores its bit in a pair of cross-coupled inverters that actively hold the value as long as power is on." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Logic arrays: PLAs and FPGAs", mins: 25,
    blurb: "Regular arrays of programmable logic. An FPGA is lookup tables, flip-flops and routing.",
    takeaway: "Logic arrays are regular, mass-produced, and configured by software, often reconfigurably. PLA: an AND array (forms implicants from inputs in true and complementary form) feeding an OR array (forms outputs): M × N × P bits for M inputs, N implicants, P outputs; combinational, two-level only. A ROM is a special PLA whose AND plane is a full decoder (all 2^M minterms); a PLA is smaller when the functions need few implicants. FPGAs (Altera, Xilinx) are arrays of logic elements (LEs, also CLBs) surrounded by I/O elements, joined by programmable routing; modern ones add multipliers, RAM, fast I/O, even processors. An Altera Cyclone IV LE has one 4-input LUT and one flip-flop plus muxes: any function of up to 4 inputs, combinational or registered (Xilinx 7-series uses 6-input LUTs). Bigger functions chain several LEs; an FSM needs at least one LE per state bit. Configuration (LUT contents and mux selects) is stored in SRAM and loaded at power-up. Timing: the max number of LEs on a path = (T_c − t_pcq − t_setup)/(t_LE + t_wire). ROMs and PLAs are often built with pseudo-nMOS or dynamic circuits to save area.",
    steps: [
      { k: "learn", title: "PLA vs ROM", b: [
        `<p>A <b>PLA</b> is an AND array (making implicants) feeding an OR array (making outputs): sum-of-products in a regular grid. M inputs, N implicants, P outputs: an M × N × P PLA.</p>`,
        `<p>A ROM is a PLA whose AND plane is a full decoder, making every minterm. If your functions need only a few implicants, a PLA is smaller.</p>`,
        seenPP("Programming a PLA row by row.", "03-digital-logic-structures.html#p6", "Chapter 3, Part 6"),
      ]},
      { k: "learn", title: "The FPGA", b: [
        `<p>A <b>field programmable gate array</b> is a sea of <b>logic elements</b> (LEs), surrounded by I/O elements, joined by programmable routing. Program it with HDL; reprogram it any time.</p>`,
        `<div class="key">One Cyclone IV LE = a <b>4-input lookup table</b> (any function of 4 inputs) + a <b>flip-flop</b> + muxes choosing whether the output is combinational or registered.</div>`,
        `<p class="aside">The configuration lives in SRAM, loaded from a computer or a Flash chip at power-up. FPGAs ship in cars, medical gear and routers, because designs can be fixed after shipping.</p>`,
      ]},
      { k: "play", title: "Program a 4-input LUT", b: [
        (host, id) => {
          const ro = el(`<div></div>`), tt = el(`<div></div>`);
          const presets = { "AND4": (r) => r[0] & r[1] & r[2] & r[3], "Parity (XOR4)": (r) => r[0] ^ r[1] ^ r[2] ^ r[3], "Majority of A,B,C": (r) => (r[0] + r[1] + r[2] >= 2 ? 1 : 0), "Y = A B̅ + C D": (r) => (r[0] & (1 - r[1])) | (r[2] & r[3]) };
          let k = "Parity (XOR4)";
          function draw() { const f = presets[k], cfg = Digital.combos(4).map(f).join(""); ro.innerHTML = readout([["LUT contents (16 configuration bits, rows 0000…1111)", cfg]]); tt.innerHTML = truthTable(["A", "B", "C", "D"], ["Y"], f); }
          host.append(toggle(Object.keys(presets), (i) => { k = Object.keys(presets)[i]; draw(); }, 1), ro, tt);
          draw();
        },
        `<p class="aside">The LUT doesn't build gates: it just stores the output column of the truth table, 16 bits, and the inputs select one. That's why one LE handles <i>any</i> 4-input function equally well.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Y = JKLMPQR (7-input AND). How many 4-input LEs, at minimum?", opts: [["2: one computes X = JKLM, the second X·P·Q·R", true, "A chain: 4 inputs, then X plus 3 more."], ["1", false, "One LUT has only 4 inputs."], ["7", false, "Each LUT can absorb up to 4 inputs."]] },
        { t: "num", q: "An FSM must run at 250 MHz. Flops: t_pcq = 200 ps, t_setup = 80 ps. Each LE plus wiring costs 650 ps. What's the most LEs a path between flops can pass through?", a: 5, tol: 0, hint: "t_pd ≤ 4 ns − 0.28 ns. Divide by 0.65 ns and round down.", why: "3.72 / 0.65 = 5.7, so 5 LEs." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How can an FPGA implement any digital design without custom manufacturing?", model: "It's a large array of logic elements, each with a small lookup table that can hold any truth table of a few inputs and a flip-flop to register the result, plus programmable routing between them. Synthesis software decides what each lookup table holds, how the multiplexers are set and how signals are routed, and that configuration is loaded into the chip's SRAM." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "hh5", eyebrow: "Harris & Harris · Chapter 5", title: "Digital Building Blocks",
    intro: `<p>Nine parts: adders (ripple, lookahead, prefix), subtractors, comparators and the ALU, shifters, multiplication and division, fixed and floating point, counters and shift registers, memory arrays, and PLAs and FPGAs.</p><p>These are the blocks Chapter 7 assembles into a processor. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book, then the interview questions. Several ask you to write HDL: simulate it if you can.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9],
    summary: `
      <h3>Adders</h3>
      <div class="eq">G<sub>i</sub> = A<sub>i</sub>B<sub>i</sub>   P<sub>i</sub> = A<sub>i</sub> + B<sub>i</sub>   C<sub>i</sub> = G<sub>i</sub> + P<sub>i</sub>C<sub>i−1</sub></div>
      <p>Ripple: N·t<sub>FA</sub>. Lookahead: t<sub>pg</sub> + t<sub>pg_block</sub> + (N/k − 1)t<sub>AND_OR</sub> + k·t<sub>FA</sub>. Prefix: t<sub>pg</sub> + log<sub>2</sub>N·t<sub>pg_prefix</sub> + t<sub>XOR</sub>.</p>
      <h3>Other arithmetic</h3>
      <p>A − B = A + B̅ + 1. Equality: XNOR + AND. A &lt; B: sign of A − B. ALU F<sub>2:0</sub>: AND, OR, +, −, SLT. Shifts: LSL/LSR/ASR/rotate; ×2<sup>N</sup> and ÷2<sup>N</sup>. Multiplier: AND partial products + adders, 2N-bit result. Divider: trial subtraction, N<sup>2</sup> delay.</p>
      <h3>Numbers</h3>
      <p>Fixed point: implied binary point, two's complement. IEEE float: single 1/8/23 (bias 127), double 1/11/52; ±0, ±∞, NaN; round to nearest even. Float add: align, add, normalize, round.</p>
      <h3>Sequential blocks and memory</h3>
      <p>Counter: register + adder. Shift register: serial ↔ parallel; scan chains for test. Memory: 2<sup>N</sup> × M, wordlines and bitlines. DRAM 1T1C (refresh), SRAM 6T, flip-flop ~20T. ROM/PROM/EPROM/EEPROM/Flash. Memory as a lookup table.</p>
      <h3>Logic arrays</h3>
      <p>PLA: AND plane + OR plane. FPGA: LEs (4-input LUT + flop), I/O, routing; configured in SRAM.</p>`,
  };
  Course.start(window.CHAPTER);
})();
