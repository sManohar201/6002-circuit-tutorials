(function () {
  const { S, plot, slider, toggle, readout, fmt, el } = Course;
  const { truthTable, bits, bitButtons, uval } = Digital;
  const seenV = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const fig = (s) => `<div class="fig">${s}</div>`;
  const mono = (s) => `<span class="mono">${s}</span>`;

  /* ---------- widgets ---------- */
  function faTable(host) {
    host.append(el(fig(truthTable(["A", "B", "C"], ["G", "P", "K", "Cout", "S"], ([a, b, c]) => [a & b, a ^ b, (1 - a) & (1 - b), (a & b) | (a & c) | (b & c), a ^ b ^ c]))));
  }
  // 8-bit adder: bitwise G and P, carries, and the longest propagate run
  function pgAdder(host) {
    let A = "01101101", B = "00011011", cin = 0;
    const out = el(`<div></div>`);
    const draw = () => {
      const a = A.split("").reverse().map(Number), b = B.split("").reverse().map(Number);
      const G = a.map((x, i) => x & b[i]), P = a.map((x, i) => x ^ b[i]);
      const C = [cin]; for (let i = 0; i < 8; i++) C.push(G[i] | (P[i] & C[i]));
      const Sm = P.map((p, i) => p ^ C[i]);
      let run = 0, best = 0, start = -1, bs = -1; for (let i = 0; i < 8; i++) { if (P[i]) { if (!run) start = i; run++; if (run > best) { best = run; bs = start; } } else run = 0; }
      const row = (lab, v, hi) => `<tr><td>${lab}</td>${v.slice().reverse().map((x, k) => { const i = 7 - k; return `<td style="text-align:center${hi && hi(i) ? ";background:var(--accent-soft)" : ""}">${x}</td>`; }).join("")}</tr>`;
      out.innerHTML = `<div class="tbl"><table><thead><tr><th>bit</th>${[8, 7, 6, 5, 4, 3, 2, 1].map((n) => `<th>${n}</th>`).join("")}</tr></thead><tbody>${row("A", a)}${row("B", b)}${row("G = AB", G)}${row("P = A⊕B", P, (i) => i >= bs && i < bs + best)}${row("carry in", C.slice(0, 8))}${row("S = P⊕C", Sm)}</tbody></table></div>` +
        readout([["A + B + C<sub>in</sub>", uval(A) + " + " + uval(B) + " + " + cin + " = " + (uval(A) + uval(B) + cin)], ["Result bits", "C<sub>out</sub> = " + C[8] + ", S = " + Sm.slice().reverse().join("") + " = " + (Sm.reduce((s, x, i) => s + x * 2 ** i, 0) + 256 * C[8])], ["Longest propagate run (highlighted)", best + " bits: a carry may ripple through all of them"]]);
    };
    host.append(el(`<p>A:</p>`), bitButtons(A, (v) => { A = v; draw(); }).el, el(`<p>B:</p>`), bitButtons(B, (v) => { B = v; draw(); }).el, toggle(["C_in = 0", "C_in = 1"], (i) => { cin = i; draw(); }, 0), out); draw();
  }

  /* ---------- prefix networks ---------- */
  function prefixNet(kind, N) {
    // columns 0..N-1, column 0 = carry-in. Each column holds a group [hi, lo]. Returns levels of cells {i, j, gray}
    const lo = Array.from({ length: N }, (_, i) => i), levels = [];
    const cell = (i, j) => { const c = { i, j, gray: lo[j] === 0 }; return c; };
    const apply = (cells) => { cells.forEach((c) => (c.nlo = lo[c.j])); cells.forEach((c) => (lo[c.i] = c.nlo)); levels.push(cells); };
    if (kind === "ripple") for (let i = 1; i < N; i++) apply([cell(i, i - 1)]);
    else if (kind === "ks") for (let d = 1; d < N; d *= 2) { const cs = []; for (let i = N - 1; i >= d; i--) if (lo[i] !== 0) cs.push(cell(i, i - d)); apply(cs); }
    else if (kind === "sk") for (let d = 1; d < N; d *= 2) { const cs = []; for (let i = 0; i < N; i++) if (Math.floor(i / d) % 2 === 1) cs.push(cell(i, Math.floor(i / (2 * d)) * 2 * d + d - 1)); apply(cs); }
    else if (kind === "bk") {
      for (let d = 1; d < N; d *= 2) { const cs = []; for (let i = 0; i < N; i++) if ((i + 1) % (2 * d) === 0) cs.push(cell(i, i - d)); if (cs.length) apply(cs); }
      for (let d = N / 4; d >= 1; d /= 2) { const cs = []; for (let i = 0; i < N; i++) if ((i + 1) % (2 * d) === d && i - d >= 0 && lo[i] !== 0) cs.push(cell(i, i - d)); if (cs.length) apply(cs); }
    }
    return levels;
  }
  function netSVG(levels, N) {
    const dx = 30, dy = 34, W = N * dx + 30, H = levels.length * dy + 84, X = (i) => W - 20 - i * dx;
    let s = "";
    for (let i = 0; i < N; i++) s += `<line x1="${X(i)}" y1="22" x2="${X(i)}" y2="${H - 26}" style="stroke:var(--line);stroke-width:1.5"/>` + S.t(X(i), 15, String(i), { cls: "s m" }) + S.t(X(i), i % 2 ? H - 22 : H - 8, i + ":0", { cls: "s m" });
    levels.forEach((cs, r) => {
      const y = 40 + r * dy;
      cs.forEach((c) => { s += `<line x1="${X(c.j)}" y1="${y - dy + 12}" x2="${X(c.i)}" y2="${y}" style="stroke:var(--accent);stroke-width:1.5"/>`; });
      cs.forEach((c) => { s += `<rect x="${X(c.i) - 7}" y="${y - 7}" width="14" height="14" rx="2" style="fill:${c.gray ? "var(--muted)" : "var(--ink)"};stroke:var(--ink);stroke-width:1"/>`; });
    });
    return S.svg(W, H, s, { label: "Prefix network: black cells compute G and P, gray cells compute G only" });
  }
  function netStats(levels) {
    let cells = 0, fan = 0;
    levels.forEach((cs) => { cells += cs.length; const cnt = {}; cs.forEach((c) => (cnt[c.j] = (cnt[c.j] || 0) + 1)); fan = Math.max(fan, ...Object.values(cnt)); });
    return { levels: levels.length, cells, fan };
  }
  function treeWidget(host) {
    const kinds = [["ripple", "Carry-ripple"], ["bk", "Brent-Kung"], ["sk", "Sklansky"], ["ks", "Kogge-Stone"]];
    let k = 1;
    const out = el(`<div></div>`);
    const draw = () => {
      const lv = prefixNet(kinds[k][0], 16), st = netStats(lv);
      out.innerHTML = fig(netSVG(lv, 16)) + readout([["Logic levels (cells in series)", st.levels], ["Cells", st.cells], ["Max fanout from one node (other columns)", st.fan]]);
    };
    host.append(toggle(kinds.map((x) => x[1]), (i) => { k = i; draw(); }, k), out); draw();
  }
  function csaDemo(host) {
    const rows = [["X", "0001"], ["Y", "0111"], ["Z", "1101"]];
    const x = 1, y = 7, z = 13, s = x ^ y ^ z, c = (x & y) | (x & z) | (y & z);
    host.append(el(`<div class="tbl"><table><tbody>${rows.map(([n, v]) => `<tr><td>${n}</td><td class="mono">&nbsp;${v}</td><td>${uval(v)}</td></tr>`).join("")}<tr><td><b>S</b> (column sums)</td><td class="mono">&nbsp;${bits(s, 4)}</td><td>${s}</td></tr><tr><td><b>C</b> (column carries, shift left)</td><td class="mono">${bits(c, 4)}_</td><td>${c} × 2 = ${2 * c}</td></tr><tr><td>S + 2C (one CPA)</td><td></td><td><b>${s + 2 * c}</b> = 1 + 7 + 13 ✓</td></tr></tbody></table></div>`));
  }
  function lfsrWidget(host) {
    const TAPS = { 3: [2, 3], 4: [3, 4], 5: [3, 5], 6: [5, 6], 7: [6, 7], 8: [1, 6, 7, 8] };
    let n = 3, q = [], hist = [];
    const out = el(`<div></div>`);
    const reset = () => { q = new Array(n).fill(1); hist = [q.join("")]; };
    const step = () => { const fb = TAPS[n].reduce((a, t) => a ^ q[t - 1], 0); q = [fb, ...q.slice(0, n - 1)]; hist.push(q.join("")); };
    const draw = () => {
      const period = (() => { let r = new Array(n).fill(1), k = 0; do { const fb = TAPS[n].reduce((a, t) => a ^ r[t - 1], 0); r = [fb, ...r.slice(0, n - 1)]; k++; } while (!r.every((x) => x === 1) && k < 600); return k; })();
      out.innerHTML = readout([["Polynomial", "1 + " + TAPS[n].map((t) => "x" + (t === 1 ? "" : "<sup>" + t + "</sup>")).join(" + ")], ["State Q0…Q" + (n - 1) + " now", mono(q.join(" "))], ["Cycles so far", hist.length - 1], ["Period (all 1s back again)", period + " = 2<sup>" + n + "</sup> − 1 = " + (2 ** n - 1)]]) +
        `<p class="mono" style="word-break:break-all">Y = Q${n - 1}: ${hist.map((h) => h[n - 1]).join("")}</p>`;
    };
    const stepBtn = el(`<button type="button" class="btn">Clock once</button>`), runBtn = el(`<button type="button" class="btn">Clock 10×</button>`);
    stepBtn.addEventListener("click", () => { step(); draw(); }); runBtn.addEventListener("click", () => { for (let i = 0; i < 10; i++) step(); draw(); });
    const row = el(`<div class="row"></div>`); row.append(stepBtn, runBtn);
    host.append(slider({ id: "v11n", label: "Length N", min: 3, max: 8, step: 1, value: 3, show: (x) => Math.round(x) + " bits" }, (x) => { n = Math.round(x); reset(); draw(); }).el, row, out); reset(); draw();
  }
  function hammingWidget(host) {
    // book's layout D3 D2 D1 D0 C2 C1 C0 = positions 7 6 5 3 4 2 1
    let D = "1001", flip = -1;
    const out = el(`<div></div>`);
    const draw = () => {
      const d = D.split("").map(Number); // d[0] = D3
      const [D3, D2, D1, D0] = d;
      const C0 = D3 ^ D1 ^ D0, C1 = D3 ^ D2 ^ D0, C2 = D3 ^ D2 ^ D1;
      const sent = [D3, D2, D1, D0, C2, C1, C0], pos = [7, 6, 5, 3, 4, 2, 1];
      const recv = sent.slice(); if (flip >= 0) recv[flip] ^= 1;
      const [r3, r2, r1, r0, rc2, rc1, rc0] = recv;
      const s0 = rc0 ^ r3 ^ r1 ^ r0, s1 = rc1 ^ r3 ^ r2 ^ r0, s2 = rc2 ^ r3 ^ r2 ^ r1, syn = 4 * s2 + 2 * s1 + s0;
      const fixed = recv.slice(); if (syn) fixed[pos.indexOf(syn)] ^= 1;
      out.innerHTML = readout([["Check bits C2 C1 C0", mono(`${C2}${C1}${C0}`)], ["Sent D3 D2 D1 D0 C2 C1 C0", mono(sent.join(""))], ["Received", mono(recv.join(""))], ["Syndrome", mono(`${s2}${s1}${s0}`) + (syn ? " → bit position " + syn + " is wrong" : " → no error")], ["Corrected data", mono(fixed.slice(0, 4).join(""))]]);
    };
    const flips = el(`<div class="row"></div>`);
    ["none", "D3", "D2", "D1", "D0", "C2", "C1", "C0"].forEach((lab, i) => { const b = el(`<button type="button" class="btn small">${lab}</button>`); b.addEventListener("click", () => { flip = i - 1; draw(); }); flips.append(b); });
    host.append(el(`<p>Data D3…D0:</p>`), bitButtons(D, (v) => { D = v; draw(); }).el, el(`<p>Flip one bit in transit:</p>`), flips, out); draw();
  }
  function grayWidget(host) {
    host.append(el(`<div class="tbl"><table><thead><tr><th>n</th><th>binary</th><th>Gray</th><th>bits changed from n−1</th></tr></thead><tbody>${[0, 1, 2, 3, 4, 5, 6, 7].map((n) => { const g = n ^ (n >> 1), gp = (n - 1) ^ ((n - 1) >> 1), b = n ^ (n - 1); const cnt = (x) => x.toString(2).split("").filter((c) => c === "1").length; return `<tr><td>${n}</td><td class="mono">${bits(n, 3)}</td><td class="mono">${bits(g, 3)}</td><td>${n ? "binary " + cnt(b) + ", Gray " + cnt(g ^ gp) : ""}</td></tr>`; }).join("")}</tbody></table></div>`));
  }
  function funnelWidget(host) {
    let A = "10110010", k = 3, type = 0;
    const out = el(`<div></div>`);
    const types = ["Logical right", "Arithmetic right", "Rotate right", "Logical left", "Rotate left"];
    const draw = () => {
      const a = A.split("").map(Number), N = 8; // a[0] = A7
      const Ab = (i) => a[N - 1 - i]; // A_i
      const Z = new Array(2 * N - 1).fill(0); // Z[idx] idx 0..14
      const setZ = (hi, lo, f) => { for (let z = lo; z <= hi; z++) Z[z] = f(z); };
      let off;
      if (type <= 2) { // right: Z[N-1:0] = A, upper = 0 / sign / A[N-2:0]
        setZ(N - 1, 0, (z) => Ab(z));
        setZ(2 * N - 2, N, (z) => (type === 0 ? 0 : type === 1 ? Ab(N - 1) : Ab(z - N)));
        off = k;
      } else { // left: Z[2N-2:N-1] = A[N-1:0], Z[N-2:0] = 0 or A[N-1:1]
        setZ(2 * N - 2, N - 1, (z) => Ab(z - (N - 1)));
        setZ(N - 2, 0, (z) => (type === 3 ? 0 : Ab(z + 1)));
        off = N - 1 - k; // offset = complement of k (k̄) with the 1-bit preshift built into Z
      }
      const Y = []; for (let i = N - 1; i >= 0; i--) Y.push(Z[i + off]);
      const zs = Z.slice().reverse().map((b, idx) => { const z = 2 * N - 2 - idx, sel = z >= off && z < off + N; return `<span style="padding:0 2px;${sel ? "background:var(--accent-soft);font-weight:700" : "opacity:.6"}">${b}</span>`; }).join("");
      out.innerHTML = `<p class="mono">Z (15 bits): ${zs}</p>` + readout([["Offset into Z", off + (type > 2 ? " (= k̄, the complement of k)" : " (= k)")], ["Y", mono(Y.join(""))]]);
    };
    host.append(el(`<p>A:</p>`), bitButtons(A, (v) => { A = v; draw(); }).el, toggle(types, (i) => { type = i; draw(); }, 0), slider({ id: "v11k", label: "Shift amount k", min: 0, max: 7, step: 1, value: k, show: (x) => Math.round(x) }, (x) => { k = Math.round(x); draw(); }).el, out); draw();
  }
  function boothWidget(host) {
    let X = 39, Y = 25;
    const out = el(`<div></div>`);
    const PP = { "000": [0, "0"], "001": [1, "Y"], "010": [1, "Y"], "011": [2, "2Y"], "100": [-2, "−2Y"], "101": [-1, "−Y"], "110": [-1, "−Y"], "111": [0, "−0"] };
    const draw = () => {
      const xb = (i) => (i < 0 ? 0 : (X >> i) & 1);
      let rows = "", sum = 0;
      for (let g = 0; g < 4; g++) {
        const key = `${xb(2 * g + 1)}${xb(2 * g)}${xb(2 * g - 1)}`, [m, lab] = PP[key], w = 4 ** g;
        sum += m * Y * w;
        rows += `<tr><td>PP${g}</td><td class="mono">x${2 * g + 1} x${2 * g} x${2 * g - 1} = ${key}</td><td>${lab}</td><td>× 4<sup>${g}</sup> = ${m * Y * w}</td></tr>`;
      }
      out.innerHTML = `<div class="tbl"><table><thead><tr><th></th><th>bits</th><th>multiple</th><th>weighted value</th></tr></thead><tbody>${rows}</tbody></table></div>` + readout([["Sum of 4 partial products", sum], ["X × Y", X * Y + (sum === X * Y ? " ✓" : "")]]);
    };
    host.append(slider({ id: "v11x", label: "Multiplier X (6-bit unsigned)", min: 0, max: 63, step: 1, value: X, show: (x) => Math.round(x) + " = " + bits(Math.round(x), 6) }, (x) => { X = Math.round(x); draw(); }).el, slider({ id: "v11y", label: "Multiplicand Y", min: 0, max: 63, step: 1, value: Y, show: (x) => String(Math.round(x)) }, (x) => { Y = Math.round(x); draw(); }).el, out); draw();
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Datapaths and the full adder", mins: 20,
    blurb: "Data flows one way, control the other. Then the cell everything else is built on: generate, propagate, kill, and the mirror adder.",
    takeaway: "Chip functions: datapath operators, memory, control, special-purpose cells, I/O, power, clocks, analog/RF. Datapaths use hierarchy, regularity, modularity and locality: N identical bit slices, related operators adjacent, data flowing one direction and control orthogonal. Half adder: S = A ⊕ B, Cout = AB. Full adder: S = A ⊕ B ⊕ C = P ⊕ C; Cout = AB + AC + BC = MAJ(A, B, C). Generate G = AB (carry out regardless of C), kill K = Ā·B̄ (no carry regardless), propagate P = A ⊕ B (carry out iff carry in). Gate-level 32-transistor adder (6 inverters, 10 majority, 16 XOR3). Mirror adder: S = ABC + (A + B + C)·NOT(Cout), 28 transistors; pMOS network identical to nMOS (works because addition is self-dual/symmetric); S is slower than Cout, fine for ripple. Ripple optimizations (Figure 11.4c): carry-in on inner inputs; minimum-size sum transistors on the carry (low branching); size series transistors by logical effort and simulation, asymmetric to favor C→Cout; large transistors so wiring is small; drop output inverters and alternate polarity (24 transistors). Layouts: standard-cell row vs dense datapath with metal2 buses overhead. Transmission-gate full adder (24 T, muxes and an ‘invertible inverter’ XOR). CPL vs poorly optimized 40-T static: 2× faster, 30% less power; vs careful mirror adder: slightly faster, similar power, much larger. Dual-rail domino full adders for fast multipliers. Delay: static 2–3 FO4, domino ≈ 1.5 FO4.",
    steps: [
      { k: "learn", title: "Datapaths", b: [
        `<p>A datapath processes N-bit words with N identical <b>bit slices</b> side by side. Data flows in one direction; control signals run across it at right angles. Related operators sit next to each other so wires stay short.</p>`,
        seenV("Hierarchy, regularity, modularity and locality.", "01-introduction.html", "Chapter 1"),
      ]},
      { k: "learn", title: "Generate, propagate, kill", b: [
        `<p>For one column, ask: what happens to a carry coming in?</p>`,
        `<div class="tbl"><table><tbody><tr><td><b>Generate</b> G = AB</td><td>carry out no matter what</td></tr><tr><td><b>Kill</b> K = Ā·B̄</td><td>no carry out no matter what</td></tr><tr><td><b>Propagate</b> P = A ⊕ B</td><td>carry out exactly when a carry comes in</td></tr></tbody></table></div>`,
        `<p class="eq">S = P ⊕ C &nbsp;&nbsp; C<sub>out</sub> = MAJ(A, B, C) = G + P·C</p>`,
        faTable,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A = 1, B = 1. Does the column's carry-out depend on the carry-in?", opts: [["No: it generates", true, "G = 1 means a carry out regardless."], ["Yes: it propagates", false, "P = A ⊕ B = 0 here."], ["No: it kills", false, "Kill needs both inputs 0."]] },
      ]},
      { k: "learn", title: "The mirror adder", b: [
        `<p>Reuse C<sub>out</sub> to build S:</p>`,
        `<p class="eq">S = ABC + (A + B + C) · NOT(C<sub>out</sub>)</p>`,
        `<p>28 transistors instead of 32. The pMOS network is the <i>same shape</i> as the nMOS one (not its complement), because addition is <b>self-dual</b>: invert all inputs and the outputs invert. Fewer series transistors, more regular layout.</p>`,
        `<p>S comes out later than C<sub>out</sub>. In a ripple adder that's fine: the critical path is carry → carry → carry.</p>`,
      ]},
      { k: "learn", title: "Tuning it for the carry", b: [
        `<ul><li>Feed the carry-in to the <b>inner</b> transistors (internal nodes already discharged).</li><li>Make every sum transistor on the carry signal minimum size: less branching effort.</li><li>Make the gate asymmetric to favor C → C<sub>out</sub>.</li><li>Drop the output inverters and let alternate bits work on inverted data: 24 transistors.</li></ul>`,
        seenV("Input ordering and asymmetric gates.", "09-combinational.html", "Chapter 9"),
      ]},
      { k: "check", title: "Spot the trick", b: [
        { t: "mcq", q: "How can a ripple adder skip the output inverters?", opts: [["Every other stage takes complemented inputs: an inverting adder fed inverted inputs produces true outputs", true, "Self-duality again. The inversions of A, B and S stay off the carry path."], ["By using a faster inverter", false, "That still adds a stage."], ["The carry doesn't need a polarity", false, "It does; the trick is alternating it."]] },
      ]},
      { k: "learn", title: "Other full adders", b: [
        `<p>Transmission-gate adder (24 T); CPL (compared with a careful mirror adder: slightly faster, similar power, much larger); dual-rail domino (fast multipliers). Static adders take 2–3 FO4; domino about 1.5.</p>`,
        `<p class="aside">Beware comparisons with a sloppy 40-transistor static adder: the fallacy from Chapter 9.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What do generate, propagate and kill mean for one bit of an adder?", model: "They describe what that column does with an incoming carry. It generates when both inputs are 1, giving a carry out whatever comes in. It kills when both are 0, giving no carry out whatever comes in. It propagates when exactly one input is 1, so the carry out equals the carry in. The sum bit is the propagate signal XOR the carry in." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Carry-propagate addition and group PG", mins: 25,
    blurb: "A ripple adder is slow because one carry can affect every bit. Group generate and propagate turn addition into a prefix problem.",
    takeaway: "Carry-propagate adders (CPA) compute S_N…1 and Cout from A, B, Cin; the carry into each bit can affect all later bits (1111 + 0000 + Cin). Bits are numbered from 1; column 0 holds the carry. Carry-ripple: N full adders in a chain; delay set by the carry chain. Group signals for bits i…j (i ≥ k > j): G_i:j = G_i:k + P_i:k·G_(k−1):j; P_i:j = P_i:k·P_(k−1):j (EQ 11.4); base G_i:i = A_iB_i, P_i:i = A_i ⊕ B_i; G_0:0 = Cin, P_0:0 = 0. The carry into bit i is C_(i−1) = G_(i−1):0, so S_i = P_i ⊕ G_(i−1):0 (EQ 11.7). Addition = (1) bitwise PG, (2) group PG (a prefix computation; the combining operator is associative), (3) sums. Many adders use K_i = A_i + B_i in place of P_i in the group logic (OR is faster than XOR), keeping the XOR for the sum. Valency-2 combines two groups; valency-4 (EQ 11.8) combines four; best stage effort ~4, so fewer, bigger gates aren't automatically faster. PG ripple: C_i = G_i + P_i·C_(i−1), an AND-OR chain (or alternating AOI/OAI); t_ripple = t_pg + (N − 1)t_AO + t_xor (EQ 11.12). Diagrams: black cell = G and P (AND-OR + AND), gray cell = G only (last cell in each column), white = buffer; vertical position = time. Cout = G_N + P_N·G_(N−1):0 in parallel with the sum XORs.",
    steps: [
      { k: "learn", title: "Why ripple is slow", b: [
        `<p>1111 + 0000: every column propagates. Whether the sum is 1111 or 1 0000 depends on C<sub>in</sub>, and that news has to travel through every bit.</p>`,
        `<p class="eq">t<sub>ripple</sub> = t<sub>pg</sub> + (N − 1) t<sub>AO</sub> + t<sub>xor</sub></p>`,
      ]},
      { k: "play", title: "Watch the carries", b: [
        `<p>Set two numbers. Find the longest run of propagate bits: that's how far a carry might have to ripple.</p>`,
        pgAdder,
      ]},
      { k: "learn", title: "Groups", b: [
        `<p>Extend G and P to a <b>group</b> of bits i…j. The group generates if its upper part generates, or the upper part propagates a carry generated by the lower part. It propagates if both parts propagate:</p>`,
        `<p class="eq">G<sub>i:j</sub> = G<sub>i:k</sub> + P<sub>i:k</sub> · G<sub>k−1:j</sub> &nbsp;&nbsp; P<sub>i:j</sub> = P<sub>i:k</sub> · P<sub>k−1:j</sub></p>`,
        `<p>Treat C<sub>in</sub> as bit 0 (G<sub>0:0</sub> = C<sub>in</sub>, P<sub>0:0</sub> = 0). Then the carry into bit i is just <b>G<sub>i−1:0</sub></b>, and S<sub>i</sub> = P<sub>i</sub> ⊕ G<sub>i−1:0</sub>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Bits 4:3 have G = 0, P = 1. Bits 2:1 have G = 1. What is G for 4:1?", opts: [["1", true, "G_4:1 = G_4:3 + P_4:3·G_2:1 = 0 + 1·1 = 1: the lower half's carry propagates out."], ["0", false, "The upper half propagates the lower half's carry."], ["It depends on C_in", false, "Group generate doesn't depend on a carry-in by definition."]] },
      ]},
      { k: "learn", title: "Three steps", b: [
        `<ol><li><b>Bitwise PG:</b> G<sub>i</sub> = A<sub>i</sub>B<sub>i</sub>, P<sub>i</sub> = A<sub>i</sub> ⊕ B<sub>i</sub>.</li><li><b>Group PG:</b> combine into G<sub>i:0</sub> for every i. This is the hard part, and where adders differ.</li><li><b>Sum:</b> S<sub>i</sub> = P<sub>i</sub> ⊕ G<sub>i−1:0</sub>.</li></ol>`,
        `<p>Step 2 is a <b>prefix computation</b>: the combining operator is associative, so the groups can be combined in any tree shape. The rest of this chapter is about tree shapes.</p>`,
        `<p>In diagrams: <b>black cell</b> = computes G and P; <b>gray cell</b> = G only (the last one in each column); vertical position = time.</p>`,
      ]},
      { k: "check", title: "Valency", b: [
        { t: "mcq", q: "A valency-4 cell combines four groups in one gate. Is a tree of valency-4 cells always faster than valency-2?", opts: [["No: fewer stages, but each is a bigger gate; best stage effort is about 4, so it must be computed or simulated", true, "Logical effort again. (In domino, higher valency often wins because logical efforts are small.)"], ["Yes: fewer stages is always faster", false, "Remember Example 9.2."], ["No: valency-4 cells can't compute P", false, "They can (EQ 11.8)."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does treating addition as a prefix computation help build faster adders?", model: "The carry into each bit is a group generate signal G from that bit down to bit 0, and group signals can be combined from smaller groups with the same associative operator. Because the operator is associative, the groups can be combined in a tree instead of one after another, so the carries can be computed in about log N levels of logic instead of N." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Carry-skip and carry-lookahead", mins: 20,
    blurb: "If a whole block propagates, let the carry skip over it. Lookahead also computes whether a block generates.",
    takeaway: "Carry-skip (carry-bypass; Babbage): k groups of n bits, each with a group-propagate AND; a skip mux selects the group carry-in if P_group, else the ripple carry-out. Critical path: generate in bit 1, ripple to the end of the first group, skip across middle groups, ripple through the last group: t_skip = t_pg + 2(n − 1)t_AO + (k − 1)t_mux + t_xor (EQ 11.13). Variable group sizes (short at the ends, long in the middle, e.g., [2, 3, 4, 4, 3] for 16 bits) save two levels. Cost: ripple + k muxes + k n-input ANDs; multilevel skip possible; prefix adders now preferred for long words. Trap: replacing the skip mux with an AND-OR creates a sneaky long path in static logic: 111…111 + 000…000 with Cin falling must ripple through every block's carry-out (OK in domino, where carries are precharged low). Manchester chain can do skip (valency-5 over 4 bits). Carry-lookahead (CLA, Weinberger58) computes group generate as well as propagate so the first group needn't ripple: t_cla = t_pg + t_pg(n) + [(n − 1) + (k − 1)]t_AO + t_xor (EQ 11.14); no better than variable skip and needs the n-bit generate gate, so seldom the best choice, but the basis for faster adders; improved CLA computes the in-group carries in parallel (higher-valency cells).",
    steps: [
      { k: "learn", title: "Skip the block", b: [
        `<p>Split 16 bits into four 4-bit ripple blocks. If <i>every</i> bit of a block propagates (P<sub>4:1</sub> = 1), its carry-out simply equals its carry-in, so a mux can pass the carry straight across.</p>`,
        `<p>Worst case: a carry generated in bit 1 ripples to the end of the first block, skips the middle blocks, then ripples through the last block:</p>`,
        `<p class="eq">t<sub>skip</sub> = t<sub>pg</sub> + 2(n − 1) t<sub>AO</sub> + (k − 1) t<sub>mux</sub> + t<sub>xor</sub></p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 32-bit carry-skip adder uses 8 groups of 4 bits. In units where t_pg = t_AO = t_mux = t_xor = 1, what is t_skip?", a: 15, tol: 0.001, why: "1 + 2·3 + 7 + 1 = 15. (A 32-bit ripple would be 1 + 31 + 1 = 33.)" },
      ]},
      { k: "learn", title: "Variable group sizes", b: [
        `<p>The middle blocks finish rippling early (their inputs are ready at time 0). Only the first and last ripples are on the critical path, so make those blocks <b>short</b> and the middle ones <b>long</b>: [2, 3, 4, 4, 3] instead of [4, 4, 4, 4] saves two logic levels in 16 bits.</p>`,
      ]},
      { k: "why", title: "A sneaky path", b: [
        `<p>Why not replace each skip mux with a cheaper AND-OR (carry-out = ripple-out OR (P·carry-in))? Add 111…111 + 000…000 with C<sub>in</sub> = 1: every block's ripple carry-out becomes 1. Now let C<sub>in</sub> <b>fall</b>. The OR keeps each block's carry high until the falling carry ripples through the block below: the delay is N bits after all.</p>`,
        `<p>Domino skip adders get away with it because every carry is precharged low each cycle.</p>`,
      ]},
      { k: "learn", title: "Carry-lookahead", b: [
        `<p>Skip still waits for the first block to ripple. Lookahead also computes each block's group <b>generate</b> G<sub>4:1</sub>, so the carry into block 2 is known after one big gate.</p>`,
        `<p class="eq">t<sub>cla</sub> = t<sub>pg</sub> + t<sub>pg(n)</sub> + [(n − 1) + (k − 1)] t<sub>AO</sub> + t<sub>xor</sub></p>`,
        `<p>Plain CLA is no better than variable-length skip and needs the big n-input generate gate, so it's seldom chosen as is. But it's the stepping stone to tree adders.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a carry-skip adder work, and what limits it?", model: "If every bit in a block propagates, the block's carry-out equals its carry-in, so a multiplexer can bypass the block's ripple chain. The worst case is a carry generated at the bottom that ripples out of the first block, skips the middle blocks one mux each, and ripples through the last block. The two end ripples and the number of skips limit it, so variable block sizes help, but the delay still grows roughly linearly with width." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Carry-select, carry-increment, conditional sum", mins: 20,
    blurb: "Compute both answers in advance, then pick one when the carry shows up.",
    takeaway: "Carry-select (Bedrij62): each n-bit group has two adders, one assuming carry-in 0 and one assuming 1; the real carry selects with a mux: t_select = t_pg + [n + (k − 2)]t_AO + t_mux (EQ 11.15). Carry-increment (Tyagi93, Zimmermann96) factors out the duplicated PG and XOR logic and replaces the mux with a gray cell: a short ripple of black cells inside each group, then gray cells combine with the previous group's carry; about twice the cells of ripple, same delay as select (mux ≈ XOR), smaller: t_increment = t_pg + [(n − 1) + (k − 1)]t_AO + t_xor (EQ 11.16); with Manchester or higher-valency group gates t_pg + t_pg(n) + (k − 1)t_AO + t_xor (EQ 11.17). Variable-length groups: t ≈ t_pg + √(2N)·t_AO + t_xor (EQ 11.18); large fanouts may need buffers inserted off the critical lookahead path. Recursive application (e.g., 64-bit select from 16-bit selects) taken to the limit gives the conditional-sum adder (Sklansky60): blocks of 1, 2, 4, …, N/2 bits, each computing sum and carry for both carry-ins and selecting with muxes; ~2N full adders and 2N log₂N muxes; factoring out XORs and using AND-OR instead of muxes leads to the Sklansky tree.",
    steps: [
      { k: "learn", title: "Carry-select", b: [
        `<p>Each block gets <b>two</b> adders: one assumes carry-in 0, the other carry-in 1. Both start at time 0. When the real carry arrives, a mux picks the right sum. The carry only has to pass one mux per block.</p>`,
        `<p class="eq">t<sub>select</sub> = t<sub>pg</sub> + [n + (k − 2)] t<sub>AO</sub> + t<sub>mux</sub></p>`,
      ]},
      { k: "check", title: "Predict", b: [
        { t: "mcq", q: "What's wasteful about carry-select?", opts: [["Both adders in a block duplicate the bitwise PG and sum XOR logic", true, "Carry-increment factors that out."], ["The mux is slow", false, "It's about as fast as an XOR."], ["Nothing", false, "It roughly doubles the hardware."]] },
      ]},
      { k: "learn", title: "Carry-increment", b: [
        `<p>Share the PG logic. Inside each block, ripple black cells to get the block-relative group signals. When the previous block's carry arrives, one row of <b>gray cells</b> finishes every carry in the block: G<sub>i:0</sub> = G<sub>i:j</sub> + P<sub>i:j</sub>·G<sub>j−1:0</sub>.</p>`,
        `<p>Same delay as carry-select, smaller area. With growing block sizes (the upper blocks have more time) the delay grows only like √(2N).</p>`,
      ]},
      { k: "learn", title: "Conditional sum", b: [
        `<p>Apply carry-select recursively: blocks of 1 bit compute sum and carry for both carry-ins; pairs select their upper half using the lower half's carry; then blocks of 4, 8, … until one 16-bit result is selected. About 2N full adders and 2N log₂N muxes.</p>`,
        `<p>Factor out the XORs and use AND-OR instead of muxes, and you've invented the <b>Sklansky tree</b> (next part).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Conditional sum on 16 bits: how many levels of selection (block widths 2, 4, 8, 16)?", a: 4, tol: 0.001, why: "log₂16 = 4 levels. That logarithmic depth is the whole point." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How is a carry-increment adder related to a carry-select adder?", model: "Both split the adder into blocks and avoid waiting for the carry before working on a block. Carry-select duplicates each block, computing sums for carry-in 0 and 1 and selecting with a mux. Carry-increment shares the bitwise PG and sum logic and computes group propagate and generate within the block, then a row of gray cells combines them with the incoming carry. That gives about the same delay with less hardware." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Tree adders", mins: 25,
    blurb: "Look ahead across the lookaheads: log N levels. Brent-Kung, Sklansky and Kogge-Stone each give up one thing.",
    takeaway: "For N > ~16, lookahead/skip/select delay is dominated by passing the carry through the lookahead stages; multilevel lookahead gives delay ∝ log N: tree (logarithmic, multilevel-lookahead, parallel-prefix) adders. Brent-Kung: prefixes for 2-, 4-, 8-bit groups then fan back down; 2log₂N − 1 stages; fanout 2. Sklansky (divide and conquer): log₂N stages; fanouts double each level ([8, 4, 2, 1] other columns for 16 bits): size or buffer the high-fanout gates (Exercise 11.7: [8, 1, 1, 1]); analogous to conditional sum. Kogge-Stone: log₂N stages and fanout 2, but many long wires and more cells (power); widely used in high-performance 32/64-bit adders. t_tree ≈ t_pg + ⌈log₂N⌉t_AO + t_xor (EQ 11.19). Ideal: log₂N levels, fanout ≤ 2, one wiring track per row; Brent-Kung has too many levels, Sklansky too much fanout, Kogge-Stone too many wires. Han-Carlson (between Kogge-Stone and Brent-Kung): Kogge-Stone on odd bits, one more stage into even bits. Knowles (between Kogge-Stone and Sklansky): e.g., [2, 1, 1, 1] halves the final-track wires, doubling their load. Ladner-Fischer (between Sklansky and Brent-Kung): Sklansky on odd bits plus one more stage (some authors use the name for Sklansky). Brent-Kung-like networks have at most one cell per pair of columns: low gate count, half-width layout, shorter horizontal wires (helps 64-bit+). Taxonomy (Harris03): L = log₂N; (l, f, t) with logic levels L + l, fanout 2^f + 1, wiring tracks 2^t; trees lie on l + f + t = L − 1; 16-bit Brent-Kung (3, 0, 0), Sklansky (0, 3, 0), Kogge-Stone (0, 0, 3).",
    steps: [
      { k: "learn", title: "Three corners", b: [
        `<p>An ideal 16-bit tree would have 4 levels, fanout ≤ 2, and one wire per row. Each classic tree gets two out of three:</p>`,
        `<div class="tbl"><table><thead><tr><th></th><th>Levels</th><th>Fanout</th><th>Wires</th></tr></thead><tbody><tr><td>Brent-Kung</td><td>2log₂N − 1 ✗</td><td>2 ✓</td><td>few ✓</td></tr><tr><td>Sklansky</td><td>log₂N ✓</td><td>doubles each level ✗</td><td>few ✓</td></tr><tr><td>Kogge-Stone</td><td>log₂N ✓</td><td>2 ✓</td><td>many, long ✗</td></tr></tbody></table></div>`,
      ]},
      { k: "play", title: "Draw the networks", b: [
        `<p>16-bit group PG networks (column 0 = carry-in). Black = G and P; gray = final G only. Lines show where each cell's second input comes from. Count the levels, then check the readout.</p>`,
        treeWidget,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "How many logic levels does a 64-bit Brent-Kung tree need?", a: 11, tol: 0.001, why: "2 log₂64 − 1 = 11 (Kogge-Stone or Sklansky: 6)." },
        { t: "mcq", q: "In the Sklansky network, why does fanout matter even though the levels are minimal?", opts: [["A node driving 8 cells sees 8× the load, so its gate is slow unless upsized or buffered", true, "Logical effort: delay depends on electrical effort, not just level count."], ["Fanout adds levels", false, "Not directly."], ["It doesn't", false, "It does: see the pitfall “equating logic levels and delay”."]] },
      ]},
      { k: "learn", title: "Filling the space between", b: [
        `<ul><li><b>Han-Carlson</b>: Kogge-Stone on the odd bits, then one more level into the even bits. Half the wires, one extra level.</li><li><b>Knowles</b> [2,1,1,1]: between Kogge-Stone and Sklansky. Fewer wires, more load on each.</li><li><b>Ladner-Fischer</b>: Sklansky on the odd bits plus one level. Less fanout.</li></ul>`,
        `<p>The (l, f, t) taxonomy: L + l levels, fanout 2<sup>f</sup> + 1, 2<sup>t</sup> wiring tracks, with l + f + t = L − 1. The three classic trees are the corners; the others lie along the edges.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A 16-bit tree has (l, f, t) = (1, 0, 2). How many logic levels?", opts: [["5", true, "L + l = 4 + 1 = 5. (That's Han-Carlson.)"], ["4", false, "l adds levels beyond log₂N."], ["7", false, "That's Brent-Kung, (3, 0, 0)."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Compare Brent-Kung, Sklansky and Kogge-Stone adders.", model: "All three compute every carry with a tree of prefix cells. Brent-Kung combines groups up a binary tree and back down: few cells, fanout of two and few wires, but nearly twice the minimum number of levels. Sklansky reaches log₂N levels with few cells, but some nodes fan out to half the columns, so they're heavily loaded. Kogge-Stone gets log₂N levels and fanout two, but needs many cells and many long wires, costing area and power." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Valency, sparse trees, Ling, and which adder to use", mins: 25,
    blurb: "Fewer, bigger cells; carries only into groups; one fewer series transistor. Then the verdict, and subtraction.",
    takeaway: "Higher-valency trees combine more groups per cell (27-bit valency-3 Brent-Kung, Sklansky, Kogge-Stone, Han-Carlson): fewer stages but bigger ones; poor trade in static CMOS (stage efforts ≫ 4), good in domino. Valency-v taxonomy: L = log_v N, L + l levels, fanout (v − 1)v^f + 1, (v − 1)v^t tracks. Sparse trees compute carries only into s-bit groups and precompute both sums per group with carry-select: spanning-tree adder (Lynch92, AMD 29050 56-bit, valency-4, 8-bit select); Intel 32-bit valency-2 Sklansky sparse tree (s = 4); valency-3 Kogge-Stone sparse (s = 3) cuts tree gates 3×. Sparse trees divide Kogge-Stone wires by s, Sklansky fanout by s, remove the last log_v s Brent-Kung levels; cost: fanout s to the select mux plus area/power for precomputed sums. Ling adders: pseudogenerate H_i:j = G_i + G_(i−1):j (simpler than G_i + P_iG_(i−1):j), recovered by G_i:j = K_i·H_i:j (EQ 11.20) using K = A + B and G·K = G; pseudopropagate I_i:j = K_(i−1):(j−1); same black/gray cells; sum S_i = H_(i−1):0 ? (P_i ⊕ K_(i−1)) : P_i (EQ 11.22) as a mux. Removes one series nMOS (valency 2: AOI → NOR2); helps domino (no series pMOS) more than static; first-level H computed directly from A, B (H_4:1 with four series transistors instead of five). Summary (Table 11.3): ripple when it meets timing (least energy); carry-increment/skip for 8–16 bits; trees for 32–64 bits; careful optimization matters more than tree choice. Fastest: domino or compound domino; Kogge-Stone often lowest delay but wire energy; Sklansky or Han-Carlson more energy-efficient; valency-4 dynamic + inverters slightly faster; sparse trees save energy in domino; Ling sometimes. UltraSparc III dual-rail domino Kogge-Stone; Itanium 2/PA-RISC dual-rail domino sparse-tree Ling; 65 nm Pentium 4 compound-domino radix-2 Sklansky sparse tree. Good 64-bit domino: 7–9 FO4, 4–12 Mλ². Static: 1/3–1/10 the energy, ~13 FO4 (CELL FPU valency-2 static Kogge-Stone). Patil07 (90 nm 32-bit): Sklansky most energy efficient; static best when slow, domino faster, dual-rail domino Ling only for the very fastest. Zlatanovici09 (64-bit): Kogge-Stone best, valency-4 + sparseness 2. Synthesis (DesignWare) picks ripple → select → lookahead → prefix as timing tightens (0.18 µm: 7.0 and 8.5 FO4 prelayout for 32/64 bits). Subtraction: A − B = A + B̄ + 1 (invert B, carry-in 1); adder/subtracter XORs B with sub.",
    steps: [
      { k: "learn", title: "Sparse trees", b: [
        `<p>Building carries into <i>every</i> bit is expensive. A <b>sparse tree</b> computes carries only into every s-th bit. Meanwhile, small carry-select adders precompute each s-bit group's sum for both carry-ins; the tree's carry picks one.</p>`,
        `<p>Kogge-Stone wires ÷ s, Sklansky fanout ÷ s, Brent-Kung loses its last levels. Cost: each carry drives s muxes, plus the precomputation.</p>`,
      ]},
      { k: "learn", title: "Ling's trick", b: [
        `<p>Define a <b>pseudogenerate</b> H<sub>i:j</sub> = G<sub>i</sub> + G<sub>i−1:j</sub>: simpler than G<sub>i:j</sub> = G<sub>i</sub> + P<sub>i</sub>G<sub>i−1:j</sub>. Because G·K = G (with K = A + B), the real generate comes back as G<sub>i:j</sub> = K<sub>i</sub>·H<sub>i:j</sub>, and the final sum can be a mux chosen by H.</p>`,
        `<p>Each first-level gate loses a series nMOS (in valency 2, an AOI becomes a NOR2). It matters most in domino.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why are higher-valency trees a better fit for domino than for static CMOS?", opts: [["Domino gates have much lower logical effort, so bigger gates still give reasonable stage effort, and fewer stages wins", true, "In static CMOS, valency-4 stages have efforts far above 4."], ["Domino can't do valency 2", false, "It can."], ["Static gates can't have 4 inputs", false, "They can, just slowly."]] },
      ]},
      { k: "learn", title: "So which adder?", b: [
        `<div class="tbl"><table><tbody><tr><td>Meets timing with ripple?</td><td><b>Ripple</b>: least energy, simplest</td></tr><tr><td>8–16 bits, needs more speed</td><td>Carry-increment or carry-skip (or hybrids)</td></tr><tr><td>32–64 bits</td><td><b>Tree</b> adders</td></tr><tr><td>Fastest, power no object</td><td>Domino trees (7–9 FO4 for 64 bits)</td></tr><tr><td>Power-limited</td><td>Static trees (~13 FO4, 1/3–1/10 the energy)</td></tr></tbody></table></div>`,
        `<p>The experts disagree on the best tree (one 32-bit study favours Sklansky for energy; a 64-bit study favours Kogge-Stone). The book's point: <b>careful optimization of a design matters more than which tree you pick.</b> Synthesis tools choose an adder from a library to meet your timing.</p>`,
      ]},
      { k: "learn", title: "Subtraction", b: [
        `<p class="eq">A − B = A + B̄ + 1</p>`,
        `<p>Invert B and set the carry-in to 1. An adder/subtracter puts an XOR (with the <i>sub</i> signal) on each B input.</p>`,
        seenV("Two's complement.", "../hh/01-zero-to-one.html", "Harris & Harris Ch 1"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "4-bit subtracter: A = 0110 (6), B = 0011 (3). What 4-bit value is B̄?", a: 12, tol: 0.001, why: "B̄ = 1100 = 12. Then 6 + 12 + 1 = 19 = 1 0011: drop the carry-out to get 0011 = 3 ✓." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a sparse-tree adder trade, and why is it popular?", model: "It computes carries only into groups of s bits, not into every bit, so the prefix tree has fewer cells, wires or fanout. Within each group, small adders precompute the sums for both possible carry-ins, and the group carry selects one with a mux. You pay a fanout of s on each carry and the area and power of the precomputed sums. The tree is the most power-hungry part, so this saves energy for little speed loss, especially in domino." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Many inputs, flags, detectors, comparators", mins: 25,
    blurb: "Carry-save addition, adding 1 at the last moment, all-zeros detection, and comparing numbers without finishing the addition.",
    takeaway: "Multiple-input addition: k − 1 cascaded CPAs are slow and big. A row of N full adders adds three words into two (S and C, X + Y + Z = S + 2C): carry-save redundant format, [3:2] carry-save adder (CSA); critical path one XOR3 (two XOR2s), much faster than a CPA; k words need k − 2 CSAs and one CPA (von Neumann, Burks46). Example (Figure 11.42): 0001 + 0111 + 1101 → S = 1011, C = 0101_ → plus 0010 → 00011, 01010_ → 10111 (23). A constant input simplifies a CSA column: 0 → half adder; 1 → S = A XNOR B, C = A + B. Flagged prefix adders (Burgess02) compute A + B + inc with a late inc: flags G′_(i−1):1 = G_(i−1):1 + P_(i−1):1·inc, S_i = P_i ⊕ G′; one extra row of gray cells (former bottom row becomes black). Uses: A + B mod 2ⁿ − 1 (inc = G_n:1 + P_n:1), absolute difference |A − B| (compute A + B̄; inv = NOT G_n:1, inc = G_n:1; S_i = (P_i ⊕ inv) ⊕ G′), sign-magnitude addition (result sign = sign(A) ⊕ G_n:1). One/zero detectors: trees of alternating NAND/NOR (log N stages); minimum logical effort with NAND + inverter trees: G = (4/3)^(log₂N) = N^0.415 (EQ 11.24); D ≈ log₄F·t_FO4 = (log₄H + 0.415 log₄N)t_FO4 (EQ 11.25); asymmetric trees favor late bits (e.g., from a ripple adder); pseudo-nMOS or dynamic wired-OR for up to ~16 bits, else chunk. Magnitude comparator: B − A = B + Ā + 1; unsigned: carry-out C (A ≤ B) and zero Z; signed: N (MSB), overflow V, corrected sign S = N ⊕ V (S = 1 → A > B) (Table 11.4). Equality: XNORs + ones detector. A + B = K (Cortadella92, sum-addressed memory): knowing A, B, K you know each required carry-in, c_(i−1) = A_i ⊕ B_i ⊕ K_i, and each produced carry-out c_i = (A_i ⊕ B_i)·NOT K_i + A_iB_i; check that adjacent bits agree (XNOR) and AND all: no carry propagation, faster than adding.",
    steps: [
      { k: "learn", title: "Carry-save addition", b: [
        `<p>A row of full adders, with no carry chain, adds <b>three</b> words into <b>two</b>: a sum word S and a carry word C (worth double):</p>`,
        `<p class="eq">X + Y + Z = S + 2C</p>`,
        csaDemo,
        `<p>Each column is independent, so a CSA takes one full-adder delay whatever the width. k numbers: k − 2 CSAs, then one carry-propagate adder at the end.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "How many rows of [3:2] CSAs are needed (in a simple chain) to add 10 numbers before the final CPA?", a: 8, tol: 0.001, why: "k − 2 = 8. (A tree arrangement reduces the depth, as you'll see in multipliers.)" },
      ]},
      { k: "learn", title: "Flagged prefix adders", b: [
        `<p>Sometimes you need A + B or A + B + 1, decided by a <b>late</b> signal <i>inc</i>. Instead of two adders, add one row of gray cells that turns each carry into a <b>flag</b>:</p>`,
        `<p class="eq">G′<sub>i−1:1</sub> = G<sub>i−1:1</sub> + P<sub>i−1:1</sub> · inc &nbsp;&nbsp; S<sub>i</sub> = P<sub>i</sub> ⊕ G′<sub>i−1:1</sub></p>`,
        `<p>If inc is 1, every low-order run of propagating bits gets a carry: exactly what adding 1 does. Uses: A + B mod 2ⁿ − 1, |A − B| (video compression), sign-magnitude addition.</p>`,
      ]},
      { k: "learn", title: "All-ones and all-zeros detectors", b: [
        `<p>A wide AND (or NOR) built as a tree: log N stages. With NAND2 + inverter trees, G = (4/3)<sup>log₂N</sup> = <b>N<sup>0.415</sup></b>.</p>`,
        `<p class="eq">D ≈ (log₄H + 0.415 log₄N) t<sub>FO4</sub></p>`,
        `<p>If bits arrive at different times (e.g., from a ripple adder), make the tree lopsided so the latest bit passes through one gate.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Using EQ 11.25, estimate the delay (in FO4) of a 256-bit zero detector driving H = 16.", a: 3.66, tol: 0.02, why: "log₄16 = 2; 0.415 × log₄256 = 0.415 × 4 = 1.66; total ≈ 3.66 FO4." },
      ]},
      { k: "learn", title: "Comparators", b: [
        `<p><b>Magnitude:</b> compute B − A = B + Ā + 1. Unsigned: carry-out C = 1 means A ≤ B; zero detect Z gives equality. Signed: use the corrected sign S = N ⊕ V (overflow flips the sign): S = 1 means A > B.</p>`,
        `<p><b>Equality:</b> XNOR each bit pair, then an all-ones detector. No adder needed.</p>`,
        `<p><b>Is A + B = K?</b> Faster than adding! If you know A<sub>i</sub>, B<sub>i</sub> and K<sub>i</sub>, you know what carry-in bit i <i>needs</i> (A<sub>i</sub> ⊕ B<sub>i</sub> ⊕ K<sub>i</sub>) and what carry-out it <i>produces</i>. Check each neighbouring pair agrees: no carry chain at all.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is carry-save addition so much faster than carry-propagate addition?", model: "A carry-save adder doesn't pass carries along the word. Each column's full adder adds three bits and outputs a sum bit and a carry bit, and the carry is kept as a separate word with double weight instead of being propagated. Every column works in parallel, so the delay is one full adder regardless of width. Only the final step of combining the sum and carry words needs a carry-propagate adder." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Counters, LFSRs and the Boolean unit", mins: 20,
    blurb: "Counting fast by splitting the counter, counting with no logic at all, and pseudo-random sequences from a shift register and an XOR.",
    takeaway: "Counter features: resettable (essential for test), loadable, enabled, reversible (up/down), terminal count TC. Divide-by-M: reset at M (equality comparator) or reload at overflow. Asynchronous ripple counter: toggle registers clocked by the previous bit's falling output; slow, no reset: historical only. Synchronous up/down counter: register + full adder per bit (ripple-carry limited); up-only uses half adders (incrementer); load mux, clock enable, TC. Fast counters: split into a small prescalar (e.g., 4 bits) whose TC enables a big segment (28 bits), which then has 2⁴ − 1 cycles to ripple; arbitrary length at the speed of a 1–2 bit counter; up/down needs a shadow register holding the previous value, loaded on a direction change (swap). Ring counter: M-bit shift register with one 1 circulating; TC every M cycles; no logic between flops: very fast prescalars, costly for large M. Johnson (Möbius) counter: inverted feedback; 2M states (3 bits: 000, 100, 110, 111, 011, 001). LFSR: shift register fed by an XOR of taps; nonzero reset; maximal length 2ᴺ − 1 (all but 000…0); taps given by a characteristic polynomial (3-bit 1 + x² + x³, Y = 1110010); pseudo-random bit sequences for BIST, BER testing, spread spectrum (GPS, CDMA); cycle time = flop + a few XORs. Table 11.8 polynomials (e.g., 4: 1 + x³ + x⁴; 8: 1 + x + x⁶ + x⁷ + x⁸; 32: 1 + x¹⁰ + x³⁰ + x³¹ + x³²). Example 11.1: 8-bit LFSR, taps after bits 1, 6, 7, 8, period 255. Boolean unit: a 4:1 mux with A, B as selects and P0–P3 as data (the truth table): AND 0001, OR 0111, XOR 0110, NAND 1110, NOR 1000.",
    steps: [
      { k: "learn", title: "Counters", b: [
        `<p>A synchronous counter is a register plus an incrementer (half adders). Its speed is limited by the carry ripple. Features: reset, load, enable, up/down, terminal count (TC).</p>`,
        `<p><b>Fast trick:</b> a small 4-bit <b>prescalar</b> counts every cycle; its TC enables a 28-bit counter that only needs to change once every 16 cycles, so it has 15 spare cycles to ripple. The whole counter runs at the speed of the little one.</p>`,
        `<p class="aside">The asynchronous ripple counter (each flop clocked by the one before) is shown only for history: slow, untestable, asynchronous.</p>`,
      ]},
      { k: "learn", title: "Ring and Johnson", b: [
        `<div class="two"><div class="tile"><h3>Ring</h3><p>One 1 circulates through M flops. TC every M cycles. No logic at all between flops: as fast as flops get.</p></div><div class="tile"><h3>Johnson</h3><p>Feed back the <i>inverted</i> output: 000 → 100 → 110 → 111 → 011 → 001 → 000. 2M states from M flops.</p></div></div>`,
      ]},
      { k: "play", title: "Linear-feedback shift registers", b: [
        `<p>Shift right each clock; the new Q0 is the XOR of the tap bits. Start at all ones (all zeros would stick forever). Predict: how many clocks until 111 comes back for N = 3?</p>`,
        lfsrWidget,
        `<p>A <b>maximal-length</b> LFSR visits all 2ᴺ − 1 nonzero states. Its output is a pseudo-random bit sequence, useful for self-test, bit-error-rate testing and spread-spectrum radios (GPS, CDMA).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 31-bit maximal LFSR (1 + x²⁸ + x³¹) clocked at 1 GHz. How many seconds before its sequence repeats (to 2 significant figures)?", a: 2.1, tol: 0.03, why: "2³¹ − 1 ≈ 2.15 × 10⁹ cycles at 1 ns each ≈ 2.1 s." },
      ]},
      { k: "learn", title: "A Boolean unit from one mux", b: [
        `<p>Use A and B as the <b>select</b> inputs of a 4:1 mux and put the desired truth table on the data inputs P0…P3. AND = 0001, OR = 0111, XOR = 0110, NAND = 1110, NOR = 1000. Any 2-input function, one cell.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Which pattern P0 P1 P2 P3 makes the Boolean unit compute XNOR(A, B)?", opts: [["1001", true, "XNOR is 1 when A = B: rows 00 and 11."], ["0110", false, "That's XOR."], ["1110", false, "That's NAND."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can a prescaled counter run as fast as a tiny counter?", model: "The least significant few bits form a small, fast counter that changes every cycle. The large upper part only increments when the prescaler reaches its terminal count, once every 2^k cycles, so its slow carry ripple has many cycles to finish. The clock rate is limited only by the small prescaler." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Parity, error-correcting codes, Gray codes, XORs", mins: 25,
    blurb: "Extra check bits let a memory find and fix a flipped bit. Gray codes change one bit at a time. And how to build the XOR they all depend on.",
    takeaway: "Soft errors in memories and noisy links: add check bits. Parity: even parity bit = XOR of the N data bits (detects any single-bit error). Hamming distance = number of differing bits; a code's minimum distance between valid words: 2 detects single errors (parity), 3 corrects single errors, 4 corrects single and detects double (SEC-DED). Distance-3 Hamming code with c check bits: length up to 2ᶜ − 1, N = 2ᶜ − c − 1 data bits; check bits at power-of-2 positions, each giving even parity over positions sharing that bit; 7-bit code with 4 data bits, 3 check bits: C0 = D3 ⊕ D1 ⊕ D0, C1 = D3 ⊕ D2 ⊕ D0, C2 = D3 ⊕ D2 ⊕ D1 (EQ 11.29). The pattern of failing checks (syndrome) is the position of the wrong bit. Example 11.2: data 1001 → check 100 → 1001100; received 1101100 → syndrome 110 = position 6 → corrected 1001. SEC-DED: add an overall parity bit (single error: parity fails, syndrome corrects; double: syndrome nonzero but parity passes). 64-bit SEC-DED: 8 check bits; Hamming needs 296 XORs and a 72-input parity; Hsiao code 216 XORs, max 27 inputs. Longer codes: Reed-Solomon, BCH, Turbo. Gray codes: consecutive values differ in one bit (shaft encoders); binary-reflected: flip the rightmost bit that gives a new string; saves FSM transitions; safe to synchronize. G_(N−1) = B_(N−1), G_i = B_(i+1) ⊕ B_i; B_i = B_(i+1) ⊕ G_i (EQ 11.30). XOR circuits (Figure 11.59): gate-level forms, complementary CMOS, contact-optimized standard cell, transmission-gate, 6-T ‘invertible inverter’ (compact, nonrestoring), 4-T pass gate (no rail-to-rail). 3–4 input XORs can be more compact; CPL poor at low voltage; dynamic XOR breaks monotonicity: push it to the end in static CMOS or use dual-rail domino.",
    steps: [
      { k: "learn", title: "Distance", b: [
        `<p>The <b>Hamming distance</b> between two words is how many bits differ. A single-bit error moves a word distance 1.</p>`,
        `<div class="tbl"><table><tbody><tr><td>Minimum distance 2 (parity)</td><td>detects a single error</td></tr><tr><td>Distance 3</td><td>corrects a single error: only one valid word is within distance 1</td></tr><tr><td>Distance 4 (SEC-DED)</td><td>corrects single, detects double</td></tr></tbody></table></div>`,
      ]},
      { k: "learn", title: "A Hamming code", b: [
        `<p>Number bit positions 1–7. Positions 1, 2, 4 (powers of two) hold check bits; each one makes the parity even over all positions that share its bit. With the book's layout D3 D2 D1 D0 C2 C1 C0:</p>`,
        `<p class="eq">C0 = D3 ⊕ D1 ⊕ D0 &nbsp; C1 = D3 ⊕ D2 ⊕ D0 &nbsp; C2 = D3 ⊕ D2 ⊕ D1</p>`,
        `<p>At the receiver, recompute the checks. The checks that fail, read as a binary number, are the <b>syndrome</b>: the position of the wrong bit.</p>`,
      ]},
      { k: "play", title: "Example 11.2", b: [
        `<p>Send 1001. Flip D2 in transit (the book's case), then try others, including a check bit.</p>`,
        hammingWidget,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Two bits flip in the same 7-bit word. What does this distance-3 decoder do?", opts: [["It “corrects” the wrong bit and silently returns bad data", true, "That's why SEC-DED adds an overall parity bit: a nonzero syndrome with good parity signals a double error."], ["It detects the double error", false, "Not without the extra parity bit."], ["It corrects both", false, "Distance 3 can only correct one."]] },
      ]},
      { k: "learn", title: "Real memories", b: [
        `<p>A 64-bit word with SEC-DED needs 8 check bits. A plain Hamming encoder takes 296 XORs; Hsiao's cleverer code needs 216 with at most 27 inputs per parity tree.</p>`,
      ]},
      { k: "learn", title: "Gray codes", b: [
        `<p>Consecutive values differ in exactly <b>one</b> bit. Useful for shaft encoders, low-power state machines, and counters that cross clock domains (Chapter 10).</p>`,
        `<p class="eq">G<sub>N−1</sub> = B<sub>N−1</sub>, &nbsp; G<sub>i</sub> = B<sub>i+1</sub> ⊕ B<sub>i</sub></p>`,
        grayWidget,
        seenV("Why Gray-coded counters are safe to synchronize.", "10-sequential.html", "Chapter 10"),
      ]},
      { k: "learn", title: "Building the XOR", b: [
        `<p>Every code above is XORs. Options: complementary CMOS (a contact-optimized version is the usual standard cell), transmission gates, the compact 6-transistor “invertible inverter” (nonrestoring), and a 4-transistor pass-gate version that doesn't swing rail to rail. Dynamic XORs need dual-rail domino, because XOR needs both polarities.</p>`,
        seenV("Threshold drops and pass-transistor logic.", "09-combinational.html", "Chapter 9"),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a Hamming code locate a single flipped bit?", model: "Each check bit gives even parity over a different set of bit positions, chosen by the binary digits of each position number. When one bit flips, exactly the checks covering that position fail. Reading the failed checks as a binary number, the syndrome, gives the position of the bad bit, which the decoder then flips back." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "Shifters", mins: 25,
    blurb: "Rotate, logical and arithmetic shifts; array versus logarithmic; funnel versus barrel.",
    takeaway: "Constant shifts are just wires (×/÷ by powers of 2). Variable shifter: N-bit A, amount k, type, direction. Rotate (1011 ROR 1 = 1101, ROL 1 = 0111); logical (LSR 1 = 0101, LSL 1 = 0110); arithmetic (right shift fills with the sign: ASR 1 = 1101; ASL = LSL). Array shifter: N N-input muxes with 1-of-N-hot decoded selects; muxes over 4–8 inputs have too much parasitic capacitance, so logarithmic shifters use log_v N levels of v-input muxes (radix 2: shift by N/2, N/4, …, 1), no decoder; transmission-gate muxes suit them (inverter drives the wire); 4:1 or 8:1 muxes halve or third the levels. Left rotate by k = right rotate by N − k = k̄ + 1 (mod N): preshift right by 1, rotate right by k̄. Funnel shifter: build a (2N − 1)-bit Z from A and kill values (Table 11.11; left shifts include the 1-bit preshift and use offset k̄), then select an N-bit window at the offset; kill values inserted at the beginning. 4-bit array funnel uses nMOS pass transistors (threshold drop: precharge outputs as in Alpha 21164, or full TGs); 32-bit logarithmic funnel: source generator → 4:1 coarse (0/8/16/24) → 8:1 fine (0–7); source generator and mux decode on the critical path; fold the source generator to fit the datapath. Barrel shifter: right rotate with wrap-around wires; left via preshift; logical/arithmetic shifts need a masking unit (thermometer-code mask, reversed for left shifts; kill value at the end). 32-bit barrel: 5:1 (prerotate + 0–3) then 8:1 (0–28 by 4). Funnel and barrel are comparable in energy and delay; logarithmic with 4:1 muxes is most efficient; shifts only → funnel simpler; rotates only → barrel simpler. Other functions (shuffles, bit reversal, extract/deposit) from muxes.",
    steps: [
      { k: "learn", title: "Three kinds of shift", b: [
        `<div class="tbl"><table><tbody><tr><td>Rotate</td><td>1011 ROR 1 = 1101</td><td>bits wrap around</td></tr><tr><td>Logical</td><td>1011 LSR 1 = 0101</td><td>fill with 0</td></tr><tr><td>Arithmetic</td><td>1011 ASR 1 = 1101</td><td>right shifts copy the sign bit (divide by 2 for two's complement)</td></tr></tbody></table></div>`,
        `<p>Shifting by a <i>constant</i> is just wiring. Shifting by a variable k needs muxes.</p>`,
      ]},
      { k: "learn", title: "Array or logarithmic", b: [
        `<p><b>Array:</b> each output bit is an N-input mux, with k decoded to one-hot. Fine for small shifters; big muxes have too much parasitic capacitance.</p>`,
        `<p><b>Logarithmic:</b> stages that shift by N/2, N/4, …, 1, each controlled by one bit of k. No decoder. Using 4:1 muxes halves the number of stages, and Logical Effort says that's the sweet spot.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "How many stages of 2:1 muxes does a logarithmic 64-bit shifter need?", a: 6, tol: 0.001, why: "log₂64 = 6 (shift by 32, 16, 8, 4, 2, 1). With 4:1 muxes: 3 stages." },
      ]},
      { k: "learn", title: "Left = right, cheaply", b: [
        `<p>Rotating left by k equals rotating right by N − k. Computing N − k needs a subtracter… unless you notice N − k ≡ k̄ + 1 (mod N): <b>preshift right by 1, then rotate right by k̄</b> (k with its bits inverted).</p>`,
      ]},
      { k: "play", title: "A funnel shifter", b: [
        `<p>Build a 15-bit word Z from A and kill values, then pick an 8-bit window starting at the offset. The highlighted bits become Y. Predict Y before choosing each type.</p>`,
        funnelWidget,
      ]},
      { k: "learn", title: "Barrel shifter", b: [
        `<p>A barrel shifter only rotates (with long wrap-around wires). For shifts, a <b>masking unit</b> replaces the bits that wrapped around: a thermometer mask with ones in the top k positions (reversed for left shifts), filled with 0 or the sign.</p>`,
        `<p>Funnel: kill values go in at the <i>start</i>. Barrel: at the <i>end</i>. Similar energy and delay overall; shifts-only favours funnel, rotates-only favours barrel.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a funnel shifter handle all the different shift types with one selection network?", model: "A source generator first builds a word about twice as wide as the input, placing A and the right fill values, zeros, sign bits or copies of A for rotation, around it according to the shift type and direction. Then one shifting network simply selects an N-bit window at an offset of k, or the complement of k for left shifts. Every type becomes the same window selection." },
      ]},
    ],
  };

  /* =============== PART 11 =============== */
  const p11 = {
    id: "p11", title: "Multiplication I: arrays, signed numbers, Booth", mins: 25,
    blurb: "Partial products, an array of carry-save adders, the Baugh-Wooley trick for negative numbers, and Booth encoding to halve the rows.",
    takeaway: "Multiplication = AND-generated partial products, shifted and summed: P = Σ_i Σ_j y_j·x_i·2^(i+j) (EQ 11.31); example 25 × 39 = 975 (Figure 11.71). Dot diagrams. Three steps: partial-product generation, reduction, final CPA. N − 1 CPAs is too slow; use CSAs (1.5–2 FO4 each, width-independent) vs CPAs (4–15+ FO4). Unsigned array multiplier (Figure 11.74): each cell = AND + full adder; rows add one partial product into the carry-save running sum; low N bits come straight out, high bits need an M-bit CPA; critical path N − 2 CSAs + CPA; pipelinable; squash the parallelogram into a rectangle. Compact CSAs matter (short wires); mirror adder common (sum slower than carry: connect sum to the faster carry input); the first row can add three partial products; use a fast CPA at the bottom. Two's complement: the MSB has negative weight (EQ 11.32), so two partial-product groups must be subtracted; Baugh-Wooley adds their two's complements (invert, plus 1s); modified Baugh-Wooley precomputes the constant ones: NAND gates in some cells and two 1s added, nearly the same array as unsigned (XORs allow one array for both). Radix-2^r: N/r partial products; radix-4 needs 0, Y, 2Y, 3Y (3Y is a hard multiple needing a CPA). Modified Booth (MacSorley61): look at a pair plus the previous MSB; use negative multiples: 3Y = 4Y − Y, 4Y = Y in the next row. Table 11.12: 000 0, 001 Y, 010 Y, 011 2Y, 100 −2Y, 101 −Y, 110 −Y, 111 −0; selects SINGLE, DOUBLE, NEG. Unsigned radix-4: ⌈(N + 1)/2⌉ partial products of M + 1 bits, sign-extended. Example 11.3: 25 × 39 with PP0 = −Y, PP1 = 2Y, PP2 = −2Y, PP3 = Y → 975. Booth encoder + selector (A22OI picks 0, Y, 2Y; NEG inverts; the +1 goes in the next row's LSB). Sign extension simplified by replacing s…s with constant 1s and s̄ (Figure 11.82). Critical path: Booth decode, select-line drivers, selector, ~N/2 CSAs, CPA. 54 × 54 radix-4 Booth multipliers are 20–50% smaller and up to 20% faster; M × N/2 selectors, so optimize them for size. Signed Booth: sign-extend with e_i = PP_iM; PP8 omitted. Radix-8 Booth needs only 3Y (Table 11.13).",
    steps: [
      { k: "learn", title: "Grade-school multiplication", b: [
        `<p>Multiply by each bit of X (that's just AND), shift, and add up the rows:</p>`,
        `<pre class="code">    011001   25
  × 100111   39
    ------
    011001
   011001
  011001
 000000
000000
011001
-----------
001111001111  975</pre>`,
        `<p>Three steps: <b>generate</b> partial products, <b>reduce</b> them to two numbers with carry-save adders, then one <b>carry-propagate</b> add.</p>`,
      ]},
      { k: "learn", title: "The array multiplier", b: [
        `<p>Each cell: an AND gate (the partial-product bit) and a full adder. Each row adds one partial product into a carry-save running total. The low bits fall out of the side; the high bits need one CPA at the bottom.</p>`,
        `<p>Critical path: about N − 2 CSAs plus the CPA. Regular, easy to lay out, easy to pipeline.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 16 × 16 array multiplier: roughly how many CSA rows are on the critical path before the final CPA?", a: 14, tol: 0.001, why: "N − 2 = 14 rows of CSAs." },
      ]},
      { k: "learn", title: "Negative numbers (Baugh-Wooley)", b: [
        `<p>In two's complement the top bit has <i>negative</i> weight, so some partial-product bits must be subtracted. Subtract by adding the two's complement: invert those bits and add constant 1s. Pre-add all the constants and the signed array is almost identical to the unsigned one (a few NANDs instead of ANDs, two extra 1s).</p>`,
      ]},
      { k: "learn", title: "Booth encoding", b: [
        `<p>Radix 4 looks at two bits of X at a time: half the rows. But a pair 11 needs 3Y, a slow “hard multiple”. Booth's trick: 3Y = 4Y − Y, and 4Y is just +Y in the next row (worth 4× as much). So each row is one of <b>0, ±Y, ±2Y</b>: all easy (shift and/or invert).</p>`,
        `<div class="tbl"><table><thead><tr><th>x<sub>2i+1</sub> x<sub>2i</sub> x<sub>2i−1</sub></th><th>PP</th></tr></thead><tbody><tr><td>000 / 111</td><td>0</td></tr><tr><td>001, 010</td><td>+Y</td></tr><tr><td>011</td><td>+2Y</td></tr><tr><td>100</td><td>−2Y</td></tr><tr><td>101, 110</td><td>−Y</td></tr></tbody></table></div>`,
      ]},
      { k: "play", title: "Example 11.3 and beyond", b: [
        `<p>The book's case is X = 39, Y = 25. Before looking, work out PP0 from x1 x0 x−1 = 1 1 0.</p>`,
        boothWidget,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why does a radix-4 Booth multiplier for unsigned 16-bit numbers need 9 partial products, not 8?", opts: [["The last group can be negative, so one more row (0 or Y) is needed to cancel it: ⌈(N + 1)/2⌉", true, "With x16 = x17 = 0, PP8 is either 0 or Y."], ["Because of the sign bit of Y", false, "Y is unsigned here."], ["It needs 8; the book rounds up", false, "It really needs 9."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does Booth encoding avoid the hard multiple 3Y in a radix-4 multiplier?", model: "Instead of multiplying by 3, it uses 3Y = 4Y − Y: it subtracts Y in the current row and adds one Y in the next row, which carries four times the weight. Looking at each pair of multiplier bits together with the top bit of the previous pair, every partial product becomes 0, ±Y or ±2Y, which need only shifting and inverting, never a slow addition." },
      ]},
    ],
  };

  /* =============== PART 12 =============== */
  const p12 = {
    id: "p12", title: "Multiplication II, prefix computations, pitfalls", mins: 25,
    blurb: "Summing columns in parallel: Wallace and [4:2] trees. Then priority encoders and other prefix problems, and the chapter's fallacies.",
    takeaway: "A CSA is a (3,2) counter: counts ones in a column, carry to the next column (horizontal path). Array column: N − 2 CSAs in series (16 × 16 Booth: 9 partial products, 7 CSA levels). Wallace tree: sum in parallel, ⌈log_(3/2)(N/2)⌉ levels, but long irregular wires. [4:2] compressor = two CSAs with an intermediate carry t_i to the next column (really a (5,3) counter); ⌈log₂(N/2)⌉ levels; regular binary tree; slow output of the first CSA into the fast input of the second → 3 XOR2 levels instead of 4; mux-based and shared-XNOR versions; 48-transistor transmission-gate [4:2] (Goto97). CSA timing: X fast input, Y, Z slow; C fast output, S slow. Three-dimensional method (TDM): per-column vertical compressor slices arranged by arrival time; one XOR level fewer than [4:2] trees but irregular. Table 11.15 XOR levels (Wallace/[4:2]/TDM): 8 PP 8/6/5; 9 PP 8/8/6; 16 PP 12/9/8; 32 PP 16/12/11; 64 PP 20/15/14. Hybrids (odd/even arrays, arrays of arrays, balanced delay, overturned staircase, ULLRF) none clearly better than [4:2]. Final CPA can exploit nonuniform arrival (middle columns latest): fewer cells and less energy. Fused multiply-add P = X·Y + Z adds Z as one more partial product (one more CSA). Summary: radix-4 Booth for ≥16 bits, trees or hybrids, static CMOS trend; wiring capacitance is paramount. Parallel-prefix computations: priority encoder (Y_i = A_i·NOT(A_(i−1))…NOT(A_1)) with X_i:j = none of A_i…A_j asserted: X_i:i = NOT A_i, X_i:j = X_i:k·X_(k−1):j, Y_i = A_i·X_(i−1):1; any adder network (ripple, lookahead, increment, Sklansky) works. Incrementer: find the least significant 0, invert up to it; decrementer, two's complement similar. Binary-to-thermometer decoder: decoder + OR prefix (X_i:j = X_i:k + X_(k−1):j). First-two-ones finder with prefixes X and W (exactly one). Pitfalls: equating logic levels with delay (Srinivas92 vs Dobson95); circuits with threshold drops (many 10-transistor full adders); reinventing adders and priority encoders. Summary: choose the simplest approach that meets targets; synthesis libraries suffice for many systems; domino prefix trees for the fastest adders; compact multiplier cells with short wires.",
    steps: [
      { k: "learn", title: "A CSA is a ones counter", b: [
        `<p>Three bits in, a 2-bit count out (carry = twos, sum = ones). The carry goes to the next column. An array sums a column one CSA at a time: slow.</p>`,
        `<p><b>Wallace tree:</b> combine every group of three rows at once. N rows shrink by about 2/3 per level: ⌈log<sub>3/2</sub>(N/2)⌉ levels. Fast, but its wires are long and irregular.</p>`,
      ]},
      { k: "learn", title: "[4:2] compressors", b: [
        `<p>Two CSAs make a [4:2] compressor: four numbers in, two out (passing an internal carry sideways). A binary tree of them needs ⌈log₂(N/2)⌉ levels, with regular wiring.</p>`,
        `<p>Wire the first CSA's slow output (sum) into the second CSA's fast input: 3 XOR delays instead of 4.</p>`,
        `<div class="tbl"><table><thead><tr><th>Partial products</th><th>Wallace</th><th>[4:2] tree</th><th>3-D method</th></tr></thead><tbody><tr><td>8</td><td>8</td><td>6</td><td>5</td></tr><tr><td>16</td><td>12</td><td>9</td><td>8</td></tr><tr><td>32</td><td>16</td><td>12</td><td>11</td></tr><tr><td>64</td><td>20</td><td>15</td><td>14</td></tr></tbody></table></div>`,
        `<p class="aside">XOR levels on the critical path (Table 11.15). The 3-D method arranges each column's adders by signal arrival time.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A Booth-encoded 32 × 32 multiplier has 17 partial products. How many levels of [4:2] compressors, ⌈log₂(N/2)⌉?", a: 4, tol: 0.001, why: "17/2 = 8.5, log₂ 8.5 ≈ 3.09, rounded up: 4 levels." },
      ]},
      { k: "learn", title: "The end of the multiplier", b: [
        `<p>The middle columns of the partial-product parallelogram arrive last at the final CPA, so the CPA can use fewer, cheaper cells at the edges. A <b>fused multiply-add</b> (X·Y + Z) just adds Z as one more partial product: one more CSA.</p>`,
        `<p>In multipliers, <b>wiring capacitance is paramount</b>: compact cells with short wires are fast, small and low-power.</p>`,
      ]},
      { k: "learn", title: "Other prefix problems", b: [
        `<p><b>Priority encoder</b> (grant the lowest-numbered request): Y<sub>i</sub> = A<sub>i</sub> AND none of A<sub>i−1</sub>…A<sub>1</sub>. Define X<sub>i:j</sub> = “none of A<sub>i</sub>…A<sub>j</sub>”, combined by AND. It's the same prefix problem as carries, so every adder tree works.</p>`,
        `<p>Also: incrementers (find the lowest 0, flip everything up to it), decrementers, two's complement negation, binary-to-thermometer decoders (OR prefix), and “find the first two ones”.</p>`,
      ]},
      { k: "check", title: "Spot the fallacy", b: [
        { t: "sort", q: "Which of the chapter's fallacies is each?", bins: ["Levels ≠ delay", "Threshold drops", "Reinvention"], items: [
          ["A paper claims a new adder is 21.7% faster, counting only logic levels", 0, "Delay depends on effort, fanout and wires; three-digit precision without simulation is a red flag."],
          ["A 10-transistor full adder whose outputs reach only V_DD − V_t", 1, "Poor noise margin and static current in the next stage."],
          ["A “novel” priority encoder that is a Sklansky prefix tree", 2, "Prefix networks were explored long ago for adders."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do large multipliers usually use [4:2] trees instead of Wallace trees?", model: "Both sum the partial products in parallel with logarithmic depth, far fewer levels than an array. A Wallace tree's groups of three lead to long, irregular wires, and wire capacitance dominates multiplier delay and power. A [4:2] compressor tree is a regular binary tree with simple wiring, and with good cell design it has even fewer XOR levels than a Wallace tree." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "vlsi11", eyebrow: "CMOS VLSI · Chapter 11", title: "Datapath Subsystems",
    intro: `<p>Twelve parts. Six on addition, from the full adder through ripple, skip, lookahead, select and tree adders to sparse trees and Ling adders. Then multi-operand addition and comparators, counters and LFSRs, error-correcting and Gray codes, shifters, and two parts on multipliers.</p><p>The thread: almost every fast datapath is a <b>prefix computation</b> or a <b>carry-save</b> trick. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises. Many ask you to sketch a network or design a block: use the black/gray-cell diagrams from Parts 2–6, and count levels, fanout and wires before drawing.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12],
    summary: `
      <h3>Addition</h3>
      <p>G = AB, P = A ⊕ B, K = Ā·B̄; S = P ⊕ C; mirror adder 28 T. G<sub>i:j</sub> = G<sub>i:k</sub> + P<sub>i:k</sub>G<sub>k−1:j</sub>, P<sub>i:j</sub> = P<sub>i:k</sub>P<sub>k−1:j</sub>; carry into bit i = G<sub>i−1:0</sub>. Ripple (N), skip/select/increment (~√N with variable groups), trees (log N): Brent-Kung, Sklansky, Kogge-Stone, (l, f, t) taxonomy. Sparse trees, Ling. Ripple if it meets timing; trees for 32–64 bits.</p>
      <h3>Related blocks</h3>
      <p>CSA: X + Y + Z = S + 2C. Flagged prefix adders. Zero detect G = N<sup>0.415</sup>. Comparators; A + B = K without carries. Prescaled counters, ring/Johnson, LFSR (2ᴺ − 1). Boolean unit = 4:1 mux.</p>
      <h3>Codes and shifters</h3>
      <p>Parity; Hamming distance 3 (syndrome = bad position), SEC-DED. Gray G<sub>i</sub> = B<sub>i+1</sub> ⊕ B<sub>i</sub>. Rotate/logical/arithmetic; logarithmic with 4:1 muxes; funnel (kill first) vs barrel (mask last); left rotate = preshift + k̄.</p>
      <h3>Multipliers</h3>
      <p>Generate, reduce, CPA. Arrays (N − 2 CSAs), Baugh-Wooley signed, radix-4 Booth (0, ±Y, ±2Y). Wallace, [4:2] trees, 3-D method. FMA. Wiring dominates.</p>`,
  };
  Course.start(window.CHAPTER);
})();
