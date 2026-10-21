(function () {
  const { S, plot, slider, toggle, readout, fmt, el } = Course;
  const { bitButtons } = Digital;
  const seenV = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const fig = (s) => `<div class="fig">${s}</div>`;
  const mono = (s) => `<span class="mono">${s}</span>`;
  function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
  const phi = (z) => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  const tail = (z) => (z < 3 ? 0.5 * (1 - erf(z / Math.SQRT2)) : (phi(z) / z) * (1 - 1 / (z * z) + 3 / z ** 4 - 15 / z ** 6));
  const zFor = (p) => { let lo = 0, hi = 12; for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (tail(m) > p) lo = m; else hi = m; } return (lo + hi) / 2; };

  /* ---------- widgets ---------- */
  // butterfly diagram with a toy inverter model; returns the largest square in each lobe
  const inv = (vm, s, lo) => (v) => lo + (1 - lo) / (1 + Math.exp((v - vm) / s));
  function lobe(f1, f2) {
    let best = { s: 0, a: 0, b: 0 };
    for (let b = 0; b <= 1; b += 0.002) { const a = f2(b); let lo = 0, hi = 1; for (let k = 0; k < 36; k++) { const m = (lo + hi) / 2; if (b + m <= f1(a + m) && b >= a + m) lo = m; else hi = m; } if (lo > best.s) best = { s: lo, a, b }; }
    return best;
  }
  function butterfly(host) {
    let mode = 0, beta = 2;
    const out = el(`<div></div>`);
    const draw = () => {
      const f = mode === 0 ? inv(0.5, 0.04, 0) : inv(0.45, 0.04, 0.6 / (1 + beta));
      const L = lobe(f, f), R = lobe(f, f); // symmetric cell: both lobes equal
      const sq = (q) => [[q.a, q.b], [q.a + q.s, q.b], [q.a + q.s, q.b + q.s], [q.a, q.b + q.s], [q.a, q.b]];
      const sq2 = sq({ s: R.s, a: R.b, b: R.a }); // mirror into the other lobe
      const curveII = []; for (let y = 0; y <= 1.0001; y += 0.005) curveII.push([f(y), y]);
      out.innerHTML = fig(plot({ x: [0, 1], y: [0, 1], xt: [0, 0.2, 0.4, 0.6, 0.8, 1], yt: [0, 0.2, 0.4, 0.6, 0.8, 1], xl: "V1", yl: "V2", w: 340, h: 340, series: [{ f, cls: "s1" }, { pts: curveII, cls: "s2" }, { pts: sq(L), cls: "s3" }, { pts: sq2, cls: "s3" }, { f: (x) => x, cls: "s4" }], label: "Butterfly diagram of the cross-coupled inverters" })) +
        readout([["Static noise margin (side of the largest square)", fmt(L.s, 2) + " × V_DD"], ["Mode", mode === 0 ? "hold: access transistors off" : "read: bitlines at V_DD pull the low node up"]]);
    };
    const bs = slider({ id: "v12b", label: "Beta (cell) ratio D/A", min: 1, max: 4, step: 0.1, value: beta, show: (x) => x.toFixed(1) }, (x) => { beta = x; draw(); });
    host.append(toggle(["Hold", "Read"], (i) => { mode = i; draw(); }, 0), bs.el, out); draw();
  }
  function yieldWidget(host) {
    let lgN = Math.log2(64 * 2 ** 20), Y = 0.9, sigma = 15;
    const out = el(`<div></div>`);
    const draw = () => {
      const N = 2 ** lgN, Xc = -Math.expm1(Math.log(Y) / N), z = zFor(Xc);
      out.innerHTML = readout([["Cells N", fmt(N, 3) + " (" + (N / 2 ** 20).toFixed(N < 2 ** 20 ? 3 : 0) + " Mb)"], ["Allowed failure probability per cell X<sub>c</sub> = 1 − Y<sup>1/N</sup>", fmt(Xc, 2)], ["Standard deviations needed", z.toFixed(2) + " σ"], ["Mean read margin needed", "<b>" + (z * sigma).toFixed(0) + " mV</b>"]]);
    };
    host.append(slider({ id: "v12n", label: "Array size", min: 10, max: 30, step: 1, value: lgN, show: (x) => "2^" + Math.round(x) + " bits" }, (x) => { lgN = Math.round(x); draw(); }).el,
      slider({ id: "v12y", label: "Parametric yield Y", min: 0.5, max: 0.999, step: 0.001, value: Y, show: (x) => (100 * x).toFixed(1) + "%" }, (x) => { Y = x; draw(); }).el,
      slider({ id: "v12s", label: "σ of read margin", min: 5, max: 40, step: 1, value: sigma, show: (x) => Math.round(x) + " mV" }, (x) => { sigma = Math.round(x); draw(); }).el, out); draw();
  }
  function sramDelay(host) {
    let n = 5, m = 5;
    const out = el(`<div></div>`);
    const draw = () => {
      const D = 2 * (m + n) + 4 * (Math.log((n + 2) / 3) / Math.log(4)) + n + 2 ** (n + 1) / 3;
      const bl = 2 ** (n + 1) / 3;
      out.innerHTML = readout([["Words × bits", 2 ** n + " × " + 2 ** m], ["Effort delay 4log₄F", (2 * (m + n) + 4 * Math.log((n + 2) / 3) / Math.log(4)).toFixed(1) + " τ"], ["Decoder parasitic n", n + " τ"], ["Bitline parasitic 2<sup>n+1</sup>/3", bl.toFixed(1) + " τ"], ["Total D (EQ 12.5)", "<b>" + D.toFixed(1) + " τ = " + (D / 5).toFixed(1) + " FO4</b>"]]);
    };
    host.append(slider({ id: "v12wn", label: "n (2ⁿ words)", min: 3, max: 9, step: 1, value: n, show: (x) => Math.round(x) }, (x) => { n = Math.round(x); draw(); }).el, slider({ id: "v12wm", label: "m (2ᵐ bits per word)", min: 3, max: 8, step: 1, value: m, show: (x) => Math.round(x) }, (x) => { m = Math.round(x); draw(); }).el, out); draw();
  }
  function dramWidget(host) {
    let cc = 30, cb = 300, vdd = 1.2;
    const out = el(`<div></div>`);
    const draw = () => { const dv = (vdd / 2) * cc / (cc + cb); out.innerHTML = readout([["ΔV = (V<sub>DD</sub>/2)·C<sub>cell</sub>/(C<sub>cell</sub> + C<sub>bit</sub>)", "<b>" + (1000 * dv).toFixed(0) + " mV</b>"], ["Compared with a 50 mV sense-amp offset budget", dv * 1000 > 100 ? "comfortable" : dv * 1000 > 50 ? "tight" : "too small"]]); };
    host.append(slider({ id: "v12cc", label: "C_cell", min: 5, max: 60, step: 1, value: cc, show: (x) => Math.round(x) + " fF" }, (x) => { cc = Math.round(x); draw(); }).el, slider({ id: "v12cb", label: "C_bit", min: 50, max: 800, step: 10, value: cb, show: (x) => Math.round(x) + " fF" }, (x) => { cb = Math.round(x); draw(); }).el, slider({ id: "v12vd", label: "V_DD", min: 0.8, max: 2.5, step: 0.1, value: vdd, show: (x) => x.toFixed(1) + " V" }, (x) => { vdd = x; draw(); }).el, out); draw();
  }
  function tcamWidget(host) {
    const words = ["10X1", "1001", "0XX0", "1X11"];
    let key = "1011";
    const out = el(`<div></div>`);
    const draw = () => {
      const match = words.map((w) => w.split("").every((c, i) => c === "X" || c === key[i]));
      out.innerHTML = `<div class="tbl"><table><thead><tr><th>row</th><th>stored</th><th>matchline</th></tr></thead><tbody>${words.map((w, i) => `<tr><td>${i}</td><td class="mono">${w}</td><td>${match[i] ? "<b>stays high: match</b>" : "pulled low"}</td></tr>`).join("")}</tbody></table></div>` + readout([["miss", match.some((x) => x) ? "0" : "1 (no row matched)"]]);
    };
    host.append(el(`<p>Search key:</p>`), bitButtons(key, (v) => { key = v; draw(); }).el, out); draw();
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Kinds of memory and how arrays are organized", mins: 15,
    blurb: "Random, serial or content-addressed; volatile or not; static or dynamic. Then rows, columns and folding.",
    takeaway: "Memory arrays often hold most of a chip's transistors. Categories (Figure 12.1): random access (latency independent of address), serial access (no address: shift registers SIPO/PISO, queues FIFO/LIFO), content-addressable (which address holds this key?). RAM = volatile (SRAM, DRAM); ROM = nonvolatile (mask ROM, PROM, EPROM, EEPROM, Flash) even though many ROMs can be written. Static cells use feedback; dynamic cells store charge through an access transistor and must be refreshed. SRAM faster and easier; DRAM denser. Mask ROM hardwired; PROM blows fuses once; EPROM floating gate erased by UV; EEPROM erased electrically in µs; Flash erases whole blocks, cheaper per bit, now dominant. Ports may be read, write or read/write. An array holds 2ⁿ words of 2ᵐ bits; a row decoder asserts one wordline; cells drive conditioned bitlines; column circuitry senses. Tall, skinny arrays are slow and hard to floorplan, so fold: 2ᵏ words per row → 2^(n−k) rows × 2^(m+k) columns, with a column decoder/mux selecting 2ᵐ bits. Large memories are built from many subarrays to keep wordlines and bitlines short.",
    steps: [
      { k: "learn", title: "A family tree", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>Random access</b></td><td>give an address, same latency for any address</td><td>SRAM, DRAM, ROMs</td></tr>
          <tr><td><b>Serial access</b></td><td>no address: data comes in order</td><td>shift registers, FIFOs, stacks</td></tr>
          <tr><td><b>Content-addressable</b></td><td>give data, get back <i>where</i> it is</td><td>CAMs (TLBs, routers)</td></tr></tbody></table></div>`,
        `<p>“RAM” really means <b>volatile</b> (loses data without power); “ROM” means <b>nonvolatile</b>, even though Flash can be rewritten.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Static or dynamic storage?", bins: ["Static (feedback)", "Dynamic (charge, needs refresh)"], items: [
          ["6T SRAM cell", 0, "Cross-coupled inverters."],
          ["1T DRAM cell", 1, "Charge on a capacitor leaks through the access transistor."],
          ["A latch with a feedback tristate", 0, "Chapter 10's robust latch."],
        ]},
      ]},
      { k: "learn", title: "Rows, columns, folding", b: [
        `<p>2ⁿ words of 2ᵐ bits. The row decoder raises one <b>wordline</b>; every cell on it drives its <b>bitline</b>; column circuitry senses the result.</p>`,
        `<p>Thousands of words of 8–64 bits would make a tall, thin, slow array. So <b>fold</b> it: put 2ᵏ words in each row. Now there are 2<sup>n−k</sup> rows of 2<sup>m+k</sup> columns, and a <b>column mux</b> picks out the word you asked for. (Book's example: 16 words × 4 bits folded 2-way into 8 rows × 8 columns.)</p>`,
        `<p>Big memories go further: many small <b>subarrays</b>, so no wordline or bitline gets too long.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why are memory arrays folded so each row holds several words?", model: "A memory with many short words would otherwise be a tall, thin array with very long bitlines and very short wordlines. Long bitlines are slow and power-hungry, and the shape is hard to fit in a floorplan. Putting several words in each row makes the array closer to square, balancing wordline and bitline lengths, and a column multiplexer then selects the requested word from the row." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "The 6T SRAM cell", mins: 20,
    blurb: "Two weak inverters and two doors. Strong enough to survive a read, weak enough to be overwritten.",
    takeaway: "SRAM: denser than flip-flops, standard CMOS process, faster and easier than DRAM; used for caches, register files, tables, buffers. 6T cell: weak cross-coupled inverters (P1/D1, P2/D2) plus access transistors A1, A2 on the wordline; an order of magnitude smaller than a flip-flop at the cost of complex periphery. Write: drive bit and <code>bit_b</code> to the value and complement, raise word, new data overpowers the inverters. Read: precharge both bitlines high, float, raise word; one bitline is pulled down. Phases: precharge in φ2, read/write in φ1 (qualified wordline <code>word_q1</code>). Read stability: with Q = 0, A1 pulls Q up while D1 holds it down; D1 must be stronger than A1 so Q stays below the switching threshold of P2/D2. Writability: bit can't force Q high through A1 (read stability), so the cell is written by pulling <code>Q_b</code> low through A2 against P2; A2 must be stronger than P2. Hence pulldown strongest, access intermediate, pullup weakest (e.g., 8/2, 4/2, 3/3 λ). The bitline pair is a distributed dual-rail footless dynamic mux; sense with HI-skew inverters (raising their threshold trades noise margin for delay). Write drivers (series pull-down, or tristate drivers that also pull the other bitline high) must have low enough resistance with the bitline and access transistor to beat the pMOS. Cells are usually supplied by the foundry.",
    steps: [
      { k: "learn", title: "Six transistors", b: [
        `<p>Two cross-coupled inverters hold Q and <code>Q_b</code>. Two <b>access transistors</b> connect them to the bitlines <b>bit</b> and <b>bit_b</b> when the <b>wordline</b> rises.</p>`,
        `<p>An order of magnitude smaller than a flip-flop. The price: the cell can't drive anything strongly, so the reading and writing circuits around it must do the work.</p>`,
        seenV("The static latch and ratioed feedback.", "10-sequential.html", "Chapter 10"),
      ]},
      { k: "learn", title: "Reading without flipping", b: [
        `<p>Precharge both bitlines high, let them float, raise the wordline. Say Q = 0: current flows from bit through A1 and D1 to ground, so bit falls.</p>`,
        `<p>But that same current pushes Q <i>up</i>. If Q rises past the other inverter's switching point, the cell flips: a destructive read. So <b>D1 must be stronger than A1</b>: <b>read stability</b>.</p>`,
      ]},
      { k: "learn", title: "Writing", b: [
        `<p>To write a 1 into a cell holding 0: read stability means bit can't force Q up through A1. Instead the write driver pulls <b>bit_b</b> low, and A2 drags <b>Q_b</b> down against P2. So <b>A2 must be stronger than P2</b>: <b>writability</b>. Once <code>Q_b</code> falls, the inverters flip the rest.</p>`,
      ]},
      { k: "check", title: "Rank the strengths", b: [
        { t: "mcq", q: "Which ordering satisfies both read stability and writability?", opts: [["pull-down (D) > access (A) > pull-up (P)", true, "e.g. 8/2, 4/2 and 3/3 λ."], ["access > pull-down > pull-up", false, "Then reads would flip the cell."], ["pull-up > access > pull-down", false, "Then writes would fail and reads would flip."]] },
      ]},
      { k: "learn", title: "The column", b: [
        `<p>Hundreds of cells share a bitline pair: effectively a huge dual-rail dynamic multiplexer. The selected cell must discharge the whole bitline capacitance through two small series transistors. HI-skew sense inverters detect the falling bitline sooner (at some cost in noise margin).</p>`,
        seenV("Dynamic gates, dual-rail outputs and keepers.", "09-combinational.html", "Chapter 9"),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain read stability and writability in a 6T SRAM cell.", model: "During a read, the access transistor connects the node storing 0 to a precharged bitline, which pulls that node up. The pull-down transistor must be stronger than the access transistor so the node stays below the other inverter's switching threshold and the cell isn't flipped. During a write, the cell is flipped by pulling the node storing 1 down through its access transistor against its pull-up pMOS, so the access transistor must be stronger than the pull-up." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Noise margins, variation and V_min", mins: 25,
    blurb: "The butterfly diagram, read and write margins, and why a 64 Mb array needs six sigma.",
    takeaway: "Margins come from static noise margin (SNM): how much noise V_n on the inverter inputs before a stable state is lost (hold, read) or a second one is created (write). Hold margin: butterfly diagram of V2 vs V1 (curve I) and V1 vs V2 (curve II): two stable states and a metastable one; SNM = side of the largest square between the curves (0.32 V in the book's example); identical inverters give equal high and low margins (unlike unity-gain margins). Increases with V_DD and V_t. Read margin (bitlines held at V_DD) is smaller (0.10 V example); depends on beta (cell) ratio = pull-down/access width; improves with larger beta, V_DD, V_t, or lower wordline voltage. Write margin (one bitline at 0): smallest square with the single remaining crossing (0.21 V example); improves with stronger access, weaker pull-up, higher wordline voltage: conflicts with read margin. Random dopant fluctuation spreads margins; any negative cell fails. Example 12.1: 64 Mb, σ = 15 mV, 90% yield: X_c = 1 − 0.9^(1/2²⁶) = 1.6 × 10⁻⁹ → nearly 6σ → ≥ 90 mV mean read margin (caveats: independence, non-Gaussian tails, noise, arbitrary 90%, chip-level yield, defects). Tails empirically normal: fit with few Monte Carlo runs, or importance sampling. V_min ≈ 0.7–1.0 V for 6T. Dynamic noise margins are larger than static ones.",
    steps: [
      { k: "learn", title: "The butterfly", b: [
        `<p>Plot one inverter's transfer curve, and the other's mirrored. The two curves cross three times: two stable states and one metastable point between them. The <b>static noise margin</b> is the side of the largest square that fits inside each “wing”: how much noise can be added before one stable state disappears.</p>`,
        seenV("Noise margins and metastability.", "07-robustness.html", "Chapter 7"),
      ]},
      { k: "play", title: "Hold versus read", b: [
        `<p>A toy inverter model, normalized to V<sub>DD</sub> = 1. In read mode the bitlines pull the low node up, shrinking the wings. Predict: does a larger beta ratio help?</p>`,
        butterfly,
        `<p class="aside">Book's 65-nm-style example: hold 0.32 V, read 0.10 V, write margin 0.21 V. The write margin is measured differently: one bitline is held at 0 and the margin is how much noise it takes to keep a second stable state alive.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which margin does each change improve?", bins: ["Read margin", "Write margin"], items: [
          ["Wider pull-down transistors (higher beta ratio)", 0, "The low node rises less during a read."],
          ["Weaker pull-up pMOS", 1, "Easier for the access transistor to overpower."],
          ["Lower wordline voltage", 0, "A weaker access transistor disturbs the cell less (but writes get harder)."],
          ["Higher wordline voltage", 1, "A stronger access transistor (but reads get riskier)."],
        ]},
      ]},
      { k: "learn", title: "Billions of chances to fail", b: [
        `<p>Every cell's margin is a little different (random dopant fluctuations). One cell with a negative margin breaks the array. For a whole-array yield Y with N cells, each cell may fail with probability only</p>`,
        `<p class="eq">X<sub>c</sub> = 1 − Y<sup>1/N</sup></p>`,
        mathLinkHTML(),
      ]},
      { k: "play", title: "Example 12.1", b: [
        `<p>64 Mb, σ = 15 mV, 90% yield. Predict the mean read margin needed, then explore.</p>`,
        yieldWidget,
        `<p class="aside">The book's caveats: cells may not fail independently, real tails may not be Gaussian, noise needs margin too, and a memory inside a bigger chip needs even higher yield.</p>`,
      ]},
      { k: "learn", title: "V_min", b: [
        `<p>Margins shrink with supply voltage, so a 6T SRAM has a minimum operating voltage <b>V<sub>min</sub></b>, typically 0.7–1.0 V. That blocks voltage scaling for the rest of the chip (Part 6 has the fixes).</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do read and write margins conflict, and what makes them harder in large arrays?", model: "Read margin wants the access transistor weak relative to the pull-down so a read doesn't disturb the cell, while write margin wants the access transistor strong relative to the pull-up so a write can flip it. Strengthening one tends to weaken the other. In large arrays, random variation spreads each cell's margins, and with millions of cells the worst one, many standard deviations out, must still work." },
      ]},
    ],
  };
  function mathLinkHTML() { return `<p class="aside">The normal distribution, tails and yield: <a href="../math/35-normal-yield.html">Math 35 →</a></p>`; }

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Cell layouts, other cells, and decoders", mins: 25,
    blurb: "From the classic cell to the thin cell, 8T and 12T alternatives, then the row decoder: predecoding, hierarchical wordlines and dynamic decoders.",
    takeaway: "Traditional 6T layout (to 90 nm): mirrored cells share V_DD/GND and bitline contacts (halving bitline diffusion C); wordline in metal1 and poly, strapped; 26 × 45 λ in MOSIS rules. Lithographically friendly thin cell (since 90 nm): straight vertical diffusion, horizontal poly, long and skinny (less bitline C, longer wordlines), 2 horizontal metal1 and 6 vertical metal2 tracks; notch for beta > 1 rounds with lithography; rectangular-diffusion (beta = 1) cells trade nominal read margin for less variability. Cell size scales well (Figure 12.17). 8T dual-port cell: separate read port (rwl, rbl) so reads don't disturb state: read margin = hold margin; lower V_min; Intel 45 nm Core uses 8T in cores. 12T static cell (latch + tristate, single bitline, 46 × 75 λ): no ratio constraints, low voltage, small register files, class projects. Row circuitry: decoder = AND gates on true/complement address bits: static NAND + inverter (up to 5–6 inputs), pseudo-nMOS NOR (ratio, power); wordline must be clock-qualified (static-to-domino interface); share the clocked nMOS among one-hot AND gates; fine-grained sleep transistor for driver leakage. Decoders must be pitch-matched to rows (e.g., 5 tracks = 40 λ, 4 tracks mirrored). Predecoding: decoders need many stages (high B and H), lowest logical effort from NAND2/NAND3 + inverter trees; factor out shared NANDs: blocks of p bits → 1-of-2ᵖ-hot lines; doesn't change path effort but saves area; buffer before the wordline saves power. Hierarchical (divided) wordlines: global wordlines on wide metal, local wordlines drive small groups: less RC, only those bitlines switch. Dynamic decoders: lower logical effort; conventional domino precharges all gates (power); self-resetting domino precharges only the fired wordline; race-based NOR decoders faster but higher power and need setup. Example 12.2 (8:256, H = 10): B = 128, F = 1280, 6 stages of AND2 (NAND2 + inverter): static G = (4/3)³ = 64/27, P = 9, D = 31.8τ = 6.4 FO4; footed domino with HI-skew inverters G = (5/6)³ = 125/216 (book prints 125/256, F = 625), P = 6.5, D ≈ 4.8–4.9 FO4: domino decoders ~33% faster. Sum-addressed decoders check A + B = K per wordline (no carry), factoring common terms.",
    steps: [
      { k: "learn", title: "Cell layout", b: [
        `<p>Cells are mirrored so neighbours share supply lines and one bitline contact (half the bitline diffusion capacitance). Since 90 nm, the <b>thin cell</b>: diffusion runs only vertically and poly only horizontally (lithography-friendly), long and skinny so bitlines are short.</p>`,
        `<p>Foundries tune these cells carefully; designers rarely draw their own.</p>`,
      ]},
      { k: "learn", title: "Other cells", b: [
        `<div class="tbl"><table><tbody><tr><td><b>8T dual-port</b></td><td>separate read port: reading never disturbs the state, so read margin = hold margin; works at lower V<sub>DD</sub> (Intel 45 nm cores). ~30% bigger.</td></tr><tr><td><b>12T static</b></td><td>a latch plus a tristate: no ratios at all; works wherever logic works; small register files and class projects. ~3× a 6T cell.</td></tr></tbody></table></div>`,
      ]},
      { k: "learn", title: "Decoders", b: [
        `<p>Each wordline is an AND of address bits (true or complemented). The decoder must fit the <b>pitch</b> of the rows it drives, and the wordline must be <b>qualified by the clock</b> so it rises only at the right time.</p>`,
        `<p><b>Predecoding:</b> many final AND gates share the same sub-ANDs. Decode each pair of address bits once into four one-hot lines, and build each wordline from those. Same path effort, much less area.</p>`,
        `<p><b>Hierarchical wordlines:</b> a long global wordline in wide metal drives short local wordlines, each serving a few cells. Less RC delay, and only those cells' bitlines switch.</p>`,
      ]},
      { k: "learn", title: "Example 12.2: static or domino?", b: [
        `<p>8:256 decoder, H = 10. Each address line (true or complement) feeds half the 256 gates: B = 128. F ≈ GBH ≈ 1280 → about 5 stages; use 6 (three levels of AND2).</p>`,
        `<div class="tbl"><table><tbody><tr><td>Static (NAND2 + inverter) ×3</td><td>G = (4/3)³ = 64/27, P = 9</td><td><b>31.8τ = 6.4 FO4</b></td></tr><tr><td>Footed domino + HI-skew ×3</td><td>G = (1 × 5/6)³, P = 6.5</td><td><b>4.8 FO4</b></td></tr></tbody></table></div>`,
        `<p class="aside">Book slip: (5/6)³ is 125/216, not the printed 125/256 (which gave F = 625). With 125/216, F ≈ 741 and D ≈ 24.5τ ≈ 4.9 FO4: the conclusion doesn't change.</p>`,
        `<p>Domino decoders are about a third faster, but a plain domino decoder precharges all 256 gates every cycle. Self-resetting domino precharges only the one that fired.</p>`,
        seenV("Logical effort, branching effort and the best number of stages.", "04-delay.html", "Chapter 4"),
      ]},
      { k: "check", title: "Check the book's arithmetic", b: [
        { t: "num", q: "Static design: N = 6, F = (64/27) × 1280 ≈ 3034, P = 9. Compute D = N·F^(1/N) + P (in τ).", a: 31.8, tol: 0.01, why: "3034^(1/6) ≈ 3.80; 6 × 3.80 + 9 ≈ 31.8τ ≈ 6.4 FO4 (FO4 ≈ 5τ)." },
      ]},
      { k: "learn", title: "Sum-addressed decoders", b: [
        `<p>Load/store addresses are often base + offset. Instead of adding, then decoding, each wordline checks “does A + B equal my row number?”, which needs no carry propagation.</p>`,
        seenV("The A + B = K comparator.", "11-datapath.html", "Chapter 11"),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does predecoding change in a decoder, and what doesn't it change?", model: "Predecoding decodes small groups of address bits once into one-hot lines that many final gates share, instead of repeating the same partial ANDs in every wordline's gate. That removes redundant gates and saves a lot of area and some power. It doesn't change the path's logical, branching or electrical effort, so it doesn't by itself make the decoder faster." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Column circuitry: bitlines, sense amps, muxes", mins: 25,
    blurb: "Bitlines are slow. Sense them hierarchically at full swing, or catch a tiny swing with a sense amplifier fired at just the right time.",
    takeaway: "Column circuitry: bitline conditioning, write drivers, sensing, column muxes. Bitlines are dynamic and leak (strong keepers, burn-in); their parasitic delay dominates read time. Example 12.3: 256 words × 136 bits, mirrored pairs share a contact → 128C diffusion + comparable wire → 256C, discharged through 2R → 512RC = 34.1 FO4: too slow. Conditioning: pMOS precharge pair; pseudo-nMOS weak pullups if no clock (contention, ratio, bad at low V). Large-signal (single-ended) sensing: full swing; inverter fine up to 16–32 words; hierarchical bitlines: local bitlines (unfooted domino muxes; slow beyond ~32 words) combined by HI-skew NANDs onto a dynamic global bitline in upper metal; leakage worst when the read cell holds 0 and all others 1; latch the result before precharge (Power6, Itanium register file). Small-signal (differential) sensing: swing 100–300 mV, then turn off the wordline (saves power) and fire a sense amplifier: analog differential pair (no clock, DC power, hard at low V) or clocked regenerative cross-coupled amp with isolation transistors (power only when firing), or the sense-amp flip-flop. Equalizer transistor speeds precharge; twisted bitlines make neighbour coupling common-mode. Offset voltage from V_t mismatch and NBTI; budget ~50 mV; not scaling with V_DD. Sense enable timing: inverter chains need > 30% margin across corners; replica column with 1/r the cells discharges r× faster, so saen fires at ≈ V_DD/r swing and tracks PVT; keep it tunable. Trend toward large-signal sensing in nanometer processes. Column multiplexing (2ᵏ:1) runs in parallel with row decoding; nMOS pass muxes for large-signal (precharged output), pMOS or TGs for small-signal; lets one sense amp serve several narrow columns. Partial writes drive only the selected columns; unselected cells must survive (read stability).",
    steps: [
      { k: "learn", title: "Why bitlines are slow (Example 12.3)", b: [
        `<p>256 cells on a bitline. Pairs share a contact: 128C of diffusion, plus about as much wire: <b>256C</b>. The cell discharges it through two series unit transistors: <b>2R</b>.</p>`,
        `<p class="eq">t ≈ 2R × 256C = 512RC ≈ 34 FO4</p>`,
        `<p>Far too slow. Two cures: <b>divide</b> the bitline (large-signal sensing), or <b>don't wait</b> for a full swing (small-signal sensing).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Same assumptions, but only 64 words on the bitline. Delay in FO4 (FO4 = 15RC)?", a: 8.53, tol: 0.02, why: "32C diffusion + 32C wire = 64C; × 2R = 128RC; 128/15 ≈ 8.5 FO4." },
      ]},
      { k: "learn", title: "Large-signal: hierarchical bitlines", b: [
        `<p>Short <b>local bitlines</b> of 16–32 cells swing fully and are read by a HI-skew NAND, which pulls down a <b>global bitline</b> running in upper metal over the array. Simple and robust; the trend in nanometer processes.</p>`,
        `<p>Leakage check: the worst case is reading a 0 while every other cell on the line holds 1 and leaks.</p>`,
      ]},
      { k: "learn", title: "Small-signal: sense amplifiers", b: [
        `<p>Let the bitlines separate by only 100–300 mV, turn off the wordline (saves energy), and fire a <b>clocked sense amplifier</b>: a cross-coupled pair whose positive feedback blows the small difference up to full logic levels. Isolation transistors cut off the heavy bitlines while it regenerates.</p>`,
        `<ul><li><b>Offset:</b> mismatch means the amp needs some minimum difference, about 50 mV budget, and it isn't shrinking with V<sub>DD</sub>.</li><li><b>Noise:</b> equalize bitlines before reading; <b>twist</b> them so a neighbour couples equally onto both.</li></ul>`,
        seenV("Metastability: a sense amp is a deliberately unbalanced latch.", "10-sequential.html", "Chapter 10"),
      ]},
      { k: "learn", title: "When to fire?", b: [
        `<p>Too early: not enough signal. Too late: wasted time. An inverter chain doesn't track the bitline across corners (30%+ margin). Better: a <b>replica column</b> with 1/r as many cells. It discharges r times faster, so when it trips, the real bitlines have swung about V<sub>DD</sub>/r, in every corner. Keep the delay tunable just in case.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "V_DD = 1.0 V. You want about 150 mV of bitline swing when the sense amp fires. What replica ratio r?", a: 6.67, tol: 0.03, why: "Swing ≈ V_DD / r → r ≈ 1.0 / 0.15 ≈ 6.7 (so about 7)." },
      ]},
      { k: "learn", title: "Column multiplexing", b: [
        `<p>Select 2ᵐ of the row's 2<sup>m+k</sup> bits with a 2ᵏ:1 mux, decoded in parallel with the rows. Bonus: one sense amp can serve several narrow columns. For writes, drive only the selected columns' bitlines (a <b>partial write</b>); the other cells on the wordline see a read and must stay stable.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a replica bitline time the sense amplifier?", model: "A dummy column with a fraction 1/r of the normal number of cells is activated along with the real access. Because its bitline has about 1/r of the capacitance, it discharges r times faster through the same kind of cell. When it falls, the real bitlines have developed about V_DD/r of swing, so that event fires the sense amplifier. Since the replica uses the same devices and wires, its timing tracks process, voltage and temperature." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Register files, big SRAMs, low power, and models", mins: 25,
    blurb: "Ports cost wires. Big memories are many small ones. Low voltage needs help. And quick formulas for area, delay and power.",
    takeaway: "Register files: fast multiported SRAMs (Core 2 has 54 per core). Split-wordline 6T dual-port cell: two single-ended reads or one write per cycle (UltraSPARC, Power6). Each single-ended read port: read wordline + read bitline + 2 transistors; each write port: wordline + true/complement bitlines + 2 access transistors (or single-ended write with an inverter in the cell). Wires dominate: area ≈ (tracks + 3)² per dimension; Itanium 2 integer file: 12 read + 10 write ports; reduce by time-multiplexing (double pumping) or banking: 16R4W single-ended cell 23 × 23 tracks (184 × 184 λ = 33,856 λ²) vs two banks of 8R4W 15 × 15 tracks (14,400 λ² each, 28,800 total), smaller and faster. Large SRAMs: read path = clock-to-address, address drivers, decode, bitline sense, setup; subarrays of 128–256 words × 128–256 bits; 16 KB subarray = four 4 KB banks (256 × 128) sharing decoders and column circuits with 4:1 column muxes; datalines with repeaters; gate clocks of idle subarrays; UltraSparc Gemini 512 KB L2 (60% array, 40% overall efficiency); typical efficiency 70–75%; banking allows parallel accesses unless a bank conflict. Low power: Xeon 16 MB L3: 6T cells are 77% of 1.3 B transistors, ~half the area; only 0.8% active per access; L3 ~14 W of 110 W, half leakage. V_min ~0.7 V at 90 nm, rising; Intel 65 nm high-performance cell 0.7/0.6 V vs high-density cell (44% denser) 1.1/1.0 V; quad-core Itanium keeps caches on a fixed 1.1 V supply with level converters. Read assists: pulsed wordline/bitline, lower wordline, raise cell V_DD; write assists: negative bitline, raise wordline, float cell GND or V_DD, lower cell V_DD. Or 8T cells (30% bigger; Intel 45 nm cores). Leakage control: reduce V_ds (let V_DD droop or GND rise to the retention voltage: cuts subthreshold, gate and BTBT leakage; needs ECC), negative wordline (beware GIDL), floating bitlines, body bias. Example 12.4: S = 100 mV/dec, DIBL η = 0.15: halving leakage needs ΔV = (S/η)·log₁₀2 = 200 mV. Partial power gating with an adjustable sleep transistor (closed loop or fuse-calibrated); wake-up costs time (~2 cycles) and energy. Subthreshold: 6T fails; 12T works (3× size); 8T unwritable near threshold; 10T cell with stacked read port (10× less leakage, hundreds of cells per bitline) and virtual V_DD floated during writes. Models: A = N·A_bit/E (A_bit ≈ 600 λ² industrial, 1200 λ² MOSIS; p-port register file ≈ 64(p + 3)² λ²; E ≈ 0.7). Delay (EQ 12.5): decoder g = (n + 2)/3, p = n; cell g = 2, bitline p = 2ⁿ⁺¹/3; G = 2(n + 2)/3, B = N, H = 1/2; D = 2(m + n) + 4log₄[(n + 2)/3] + n + 2ⁿ⁺¹/3; 32 × 32: 48.8τ = 9.8 FO4. Large SRAM gate delay ≈ 1.2 log₂N − 4 FO4 (domino ~15% less); wire delay lower bound ≈ 1.75 FO4 at 4 Mb, doubling per 4× size. CACTI: D ≈ 1.5√C + 13 FO4 (C in KB; 16 KB → 19 FO4). Power: dynamic ∝ cells per active bank (+ datalines ∝ √capacity); leakage ∝ total cells; both linear in ports.",
    steps: [
      { k: "learn", title: "Ports cost wires", b: [
        `<p>Each extra read port needs a read wordline, a read bitline and two transistors; each write port a wordline, two bitlines and two transistors. With many ports the cell is a mesh of wires: area ≈ (tracks + 3)² in each dimension.</p>`,
        `<p>The Itanium 2's integer register file needed 12 read and 10 write ports. Two tricks: <b>double-pumping</b> (read in one half-cycle, write in the other) and <b>banking</b> (copies that each serve half the read ports; every write updates all copies).</p>`,
      ]},
      { k: "check", title: "Banking pays", b: [
        { t: "num", q: "A 16-read, 4-write single-ended cell is 23 × 23 tracks; split into two banks of 8R4W, each cell is 15 × 15 tracks. Total area ratio (two banks ÷ one bank)?", a: 0.85, tol: 0.02, why: "2 × 225 / 529 = 0.85: two copies are smaller than one, and faster too (shorter lines)." },
      ]},
      { k: "learn", title: "Big SRAMs are many small ones", b: [
        `<p>Typical subarrays: 128–256 words × 128–256 bits. A 16 KB subarray = four 256 × 128 banks sharing decoders and column circuits. Datalines carry results out; idle subarrays have their clocks gated. Array efficiency (fraction of area that is cells) is typically 70–75%.</p>`,
      ]},
      { k: "learn", title: "Low voltage needs help", b: [
        `<p>A dual-core Xeon's 16 MB L3 cache: 77% of 1.3 billion transistors, ~14 W of 110 W, half of it leakage, even though only 0.8% of the cache is active per access.</p>`,
        `<div class="two"><div class="tile"><h3>Read assists</h3><p>Pulse the wordline briefly; lower the wordline voltage; raise the cell's V<sub>DD</sub> during reads.</p></div><div class="tile"><h3>Write assists</h3><p>Negative bitline; raise the wordline; float or lower the cell supply during writes.</p></div></div>`,
        `<p>Or sidestep the 6T trade-off with 8T cells (Intel's 45 nm cores), or keep the cache on its own higher supply.</p>`,
      ]},
      { k: "check", title: "Example 12.4", b: [
        { t: "num", q: "S = 100 mV/decade, DIBL coefficient η = 0.15. How far (mV) must the cell supply droop to cut subthreshold leakage by 10×?", a: 667, tol: 0.01, why: "ΔV = (S/η)·log₁₀10 = (100/0.15) × 1 ≈ 667 mV. (The book's case, 2×, needs 200 mV.)" },
      ]},
      { k: "learn", title: "Sleeping arrays", b: [
        `<p>Most subarrays are idle. Let their V<sub>DD</sub> droop to the minimum <b>retention voltage</b> (partial power gating); wake them a couple of cycles before use. Lower voltage means more soft errors, so add ECC. Subthreshold memories need special cells (e.g., a 10T cell with a stacked read port and a floating supply during writes).</p>`,
        seenV("Power gating and DIBL.", "05-power.html", "Chapter 5"),
      ]},
      { k: "play", title: "A delay model (EQ 12.5)", b: [
        `<p>A small SRAM with no sense amps: an n-input AND decoder (g = (n + 2)/3) drives a wordline of 2ᵐ cells (g = 2), which discharge a bitline of 2ⁿ cells (parasitic 2<sup>n+1</sup>/3). Predict the 32 × 32 delay, then see which term blows up for tall arrays.</p>`,
        sramDelay,
        `<p class="aside">Rules of thumb: area A = N·A<sub>bit</sub>/E (A<sub>bit</sub> ≈ 600 λ² industrial, E ≈ 0.7); CACTI cache access ≈ 1.5√C + 13 FO4 (C in KB).</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do many-ported register files get so large, and how does banking help?", model: "Each port adds its own wordline and bitlines through every cell, so the cell's size is set by the number of wire tracks, and area grows roughly with the square of the number of ports. Banking keeps several copies, each with only some of the read ports but all the write ports. Each copy's cell has far fewer tracks, so even with duplication the total area is smaller, and the shorter lines are faster." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "DRAM", mins: 25,
    blurb: "One transistor and a capacitor. The read is a whisper, destroys the data, and must be amplified and written back.",
    takeaway: "DRAM stores charge on a capacitor; cell much smaller than SRAM but needs refresh; specialized processes give 10–20× SRAM density, higher latency. 1T cell: access transistor + C_cell; bitline precharged to V_DD/2; wordline rises and the cell shares charge: ΔV = (V_DD/2)·C_cell/(C_cell + C_bit) (EQ 12.8); destructive read, so rewrite after every read; boosted wordline V_DDP = V_DD + V_t to write a full 1. C_cell ≈ 30 fF via 3-D structures (trench capacitors with ONO dielectric, stacked). Subarrays ≈ 256 words × 512 bits; efficiency 50–60%; C_bit ≈ 10× C_cell so ΔV is tiny; sense amp compares with an idle bitline at V_DD/2. Open bitlines (until 64 kb): reference bitline in another subarray, dense but differential noise. Folded bitlines: reference is the adjacent bitline, noise common-mode, more area (clever layout only 33% larger, diagonal poly, shared contacts). Twisted bitlines fix neighbour coupling. Column circuitry on both sides of the array at 4× pitch. Sense amp: cross-coupled inverters with supplies V_n (pulled low first) and V_p (raised after); drives bitlines to the rails, rewriting the cell. Equalize to V_DD/2 by charge sharing (low power). CSEL connects a column to I/O lines; ISO selects which subarray shares the nMOS amp; pMOS restore compensates isolation threshold drop. Embedded DRAM: logic in DRAM processes uninspiring; some logic processes offer eDRAM (IBM 65 nm 0.127 µm² trench cell, 4× denser than SRAM, slower). 3T/4T gain cells store on a gate; superseded by Dennard's 1T cell (IBM, 1968).",
    steps: [
      { k: "learn", title: "One transistor, one capacitor", b: [
        `<p>The bit is charge on a capacitor C<sub>cell</sub>. To read: precharge the bitline to V<sub>DD</sub>/2, raise the wordline, and the cell shares its charge with the much bigger bitline:</p>`,
        `<p class="eq">ΔV = (V<sub>DD</sub>/2) · C<sub>cell</sub> / (C<sub>cell</sub> + C<sub>bit</sub>)</p>`,
        `<p>The read <b>destroys</b> the stored value, so it must be written back. Charge also leaks away, so every row must be <b>refreshed</b> periodically.</p>`,
        seenV("Charge sharing.", "09-combinational.html", "Chapter 9"),
      ]},
      { k: "play", title: "How big a signal?", b: [
        `<p>Typical: C<sub>cell</sub> ≈ 30 fF, and the bitline about ten times that. Predict ΔV first.</p>`,
        dramWidget,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "V_DD = 1.5 V, C_cell = 25 fF, C_bit = 225 fF. ΔV in mV?", a: 75, tol: 0.01, why: "0.75 V × 25/250 = 75 mV." },
      ]},
      { k: "learn", title: "Building 30 fF in a tiny cell", b: [
        `<p>Go into the third dimension: a <b>trench capacitor</b> etched deep into the substrate, lined with oxide-nitride-oxide and filled with polysilicon. DRAM processes are specialized for this.</p>`,
      ]},
      { k: "learn", title: "Bitline architectures", b: [
        `<div class="tbl"><table><tbody><tr><td><b>Open</b></td><td>The sense amp compares a bitline in one subarray with one in another. Dense, but noise hitting one subarray looks like signal.</td></tr><tr><td><b>Folded</b></td><td>The reference is the neighbouring bitline in the same array: noise hits both equally (common mode) and is rejected. Costs area.</td></tr><tr><td><b>Twisted</b></td><td>Folded pairs swap places along the array so a switching neighbour couples equally onto both.</td></tr></tbody></table></div>`,
      ]},
      { k: "learn", title: "The DRAM sense amp", b: [
        `<p>Cross-coupled inverters whose supply rails V<sub>n</sub> and V<sub>p</sub> start at V<sub>DD</sub>/2 and 0 (all off). Pull V<sub>n</sub> low: the nMOS pair pulls the lower bitline to 0. Then raise V<sub>p</sub>: the pMOS pair pulls the higher one to V<sub>DD</sub>. Driving the bitline to the rail <b>rewrites the cell</b> automatically.</p>`,
        `<p>Precharge is free-ish: short the two bitlines (one at V<sub>DD</sub>, one at 0) and they share charge to V<sub>DD</sub>/2.</p>`,
      ]},
      { k: "learn", title: "DRAM on a logic chip?", b: [
        `<p>Embedded DRAM needs special capacitor steps; some foundries offer it (IBM 65 nm: 4× denser than SRAM, slower). Gain cells (3T/4T) store charge on a transistor gate in plain CMOS; they were the first DRAMs before Dennard invented the 1T cell at IBM in 1968.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is a DRAM read destructive, and how is the data restored?", model: "Reading connects the small cell capacitor to the much larger bitline, so the cell's charge is shared and its voltage moves almost to the bitline's precharge level. The stored value is lost. The sense amplifier then amplifies the small difference and drives the bitline to a full rail. Because the access transistor is still on, that full-rail level is written back into the cell." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "ROM and Flash", mins: 25,
    blurb: "A transistor or no transistor: that's a bit. NOR and NAND ROMs, floating gates, and how Flash is erased, programmed and read.",
    takeaway: "ROM: one transistor per bit, nonvolatile. Usually a single-ended NOR array, dynamic or (small) pseudo-nMOS (no timing, DC power; put pullups after the column mux to save power). Wordline must be low during precharge in dynamic NORs. Example 4 × 6 ROM (word0 010101, word1 011001, word2 100101, word3 101010); dot diagram: dots = 1s = nMOS pull-downs (outputs inverted). Programming by presence/absence of transistor or contact, or a threshold implant; metal programming once popular; EEPROM/Flash reduced demand. Layout: poly wordlines, metal1 bitlines and shared grounds; 12 × 8 λ cell (11 × 7 with diffusion ground); strap poly with metal2; row decoder squeezed onto the wordline pitch. PROM: fuses, one-time programmable. EPROM/EEPROM/Flash: floating gate between control gate and channel; high voltage → Fowler-Nordheim tunneling puts electrons on the floating gate → V_t raised (always OFF). EPROM erased by UV; EEPROM bit-erasable (bigger cell); Flash erased in blocks (most economical). NAND ROM: series transistors, active-low wordlines, unselected rows ON; no transistor (jumper) → bitline pulls down; 7 × 8 λ, or 6 × 5 λ with depletion implant; delay quadratic in series count, so limit to 8–16 per bank. Flash: Masuoka (Toshiba) 1984, NAND architecture 1987 (30% smaller); 256 KB parts in 1988; commodity, cost-driven. NAND Flash: strings of 16 cells + string-select and ground-select transistors; pages (written) and blocks (erased), e.g., 8 KB blocks of sixteen 512 B pages; negative V_t = 1, positive = 0. Erase: control gates 0 V, substrate 20 V, all cells → negative V_t (~1 ms); other blocks' wordlines raised to inhibit; charge pump. Program a page: bitlines 0 V (write 0) or 8 V (keep 1), selected wordline 20 V, others 10 V, ssl on, gsl off. Read: precharge bitlines, ssl/gsl 3.3 V, selected wordline 0 V, others 4.5 V: bitline discharges if the cell has negative V_t (1). Multilevel cells store several bits by programming several thresholds. Retention ~10 years; endurance ~100,000 cycles (multilevel as low as 5,000). Embedded Flash uses NOR (fast random word access). Example: 64 Gb, 43 nm, 16-level (4 bits/cell), two 32 Gb planes, 8 KB pages, 64-cell strings → 256 pages = 2 MB per block, 5.6 MB/s programming.",
    steps: [
      { k: "learn", title: "A NOR ROM", b: [
        `<p>Each bitline is a wide pseudo-nMOS (or dynamic) NOR gate. Where a “1” is stored, an nMOS on the selected wordline pulls the bitline down (an inverter restores the polarity). Where it's “0”, there's simply no transistor.</p>`,
        `<div class="tbl"><table><thead><tr><th></th><th>bit5 … bit0</th></tr></thead><tbody><tr><td>word0</td><td class="mono">010101</td></tr><tr><td>word1</td><td class="mono">011001</td></tr><tr><td>word2</td><td class="mono">100101</td></tr><tr><td>word3</td><td class="mono">101010</td></tr></tbody></table></div>`,
        `<p>A <b>dot diagram</b> draws a dot for each transistor: one dot per stored 1.</p>`,
        seenV("Pseudo-nMOS NOR gates.", "09-combinational.html", "Chapter 9"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "How many pull-down transistors does that 4-word × 6-bit ROM contain?", a: 12, tol: 0.001, why: "One transistor per stored 1: 010101 (3) + 011001 (3) + 100101 (3) + 101010 (3) = 12.", hint: "Count the 1s in each word." },
      ]},
      { k: "learn", title: "A NAND ROM", b: [
        `<p>Put the cells in <b>series</b> instead. Wordlines are active-low: every unselected row is ON. If the selected position has a transistor, it turns OFF and the bitline stays high; if it has a jumper, the bitline discharges. Tiny cells (as small as 6 × 5 λ), but delay grows with the square of the series count, so strings stay short (8–16).</p>`,
      ]},
      { k: "learn", title: "Floating gates", b: [
        `<p>Add a second, unconnected polysilicon gate under the control gate. A high voltage makes electrons <b>tunnel</b> through the thin oxide onto it (Fowler-Nordheim). The trapped negative charge raises V<sub>t</sub>: the transistor is now effectively off. That's a stored bit that survives without power.</p>`,
        `<div class="tbl"><table><tbody><tr><td>PROM</td><td>blow fuses; one time only</td></tr><tr><td>EPROM</td><td>floating gate; erase with UV light</td></tr><tr><td>EEPROM</td><td>erase individual bits electrically (bigger cells)</td></tr><tr><td><b>Flash</b></td><td>erase whole blocks electrically: cheapest per bit</td></tr></tbody></table></div>`,
      ]},
      { k: "learn", title: "NAND Flash in action", b: [
        `<p>Strings of 16 cells in series between a string-select and a ground-select transistor. Write by <b>page</b>, erase by <b>block</b>. Erased = negative V<sub>t</sub> = 1.</p>`,
        `<div class="tbl"><table><thead><tr><th></th><th>Selected wordline</th><th>Other wordlines</th><th>Bitline / substrate</th></tr></thead><tbody><tr><td><b>Erase</b> (block, ~1 ms)</td><td colspan="2">0 V</td><td>substrate 20 V</td></tr><tr><td><b>Program</b> (page)</td><td>20 V</td><td>10 V</td><td>0 V writes 0, 8 V keeps 1</td></tr><tr><td><b>Read</b> (page)</td><td>0 V</td><td>4.5 V (all on)</td><td>precharged; discharges if the cell is 1</td></tr></tbody></table></div>`,
        `<p>Programming can only make 0s; to get a 1 back, erase the whole block.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "During a read, why are the unselected wordlines in the string driven to 4.5 V?", opts: [["To turn those cells fully on whatever they store, so only the selected cell decides whether the string conducts", true, "4.5 V is above even a programmed (positive) V_t."], ["To program them", false, "Programming needs 20 V."], ["To erase them", false, "Erase uses the substrate at 20 V."]] },
      ]},
      { k: "learn", title: "Reliability and density", b: [
        `<p><b>Multilevel</b> cells program one of several thresholds: 16 levels = 4 bits per transistor. <b>Retention</b> ≈ 10 years; <b>endurance</b> ≈ 100,000 erase/program cycles (multilevel as few as 5,000), because the high voltages wear out the oxide. Embedded Flash in microcontrollers uses NOR for fast random reads.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a Flash cell store a bit, and why is it erased in blocks?", model: "Electrons tunnel through a thin oxide onto a floating gate that isn't connected to anything, which raises the transistor's threshold. Programmed cells stay off at the read voltage while erased cells conduct, and the charge stays for years without power. Erasing pulls the electrons back off with a high voltage across the oxide; sharing that high-voltage circuitry across a whole block, rather than each bit, keeps the cells tiny and the cost per bit low." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Serial memories and CAMs", mins: 20,
    blurb: "Shift registers, FIFOs and stacks need no address. A CAM goes the other way: give it data, it tells you where.",
    takeaway: "Shift registers store and delay data (signal processing): flops (watch hold times, no logic between) or, when large, a dual-port RAM as a circular buffer with read/write counters (read at first entry, write at last on reset) or 1-of-N-hot pointers driving wordlines directly. Tapped delay line: 32-, 16-, 8-, 4-, 2-, 1-stage blocks with bypass muxes (64 stages). SIPO and PISO for serial links. Queues read and write at different (possibly asynchronous) rates; FULL/EMPTY (and ALMOST-) flags; pointers as counters or one-hot registers. FIFO: circular buffer; reset both pointers to the first entry (EMPTY); write advances; FULL when about to catch the read pointer; EMPTY when read catches write. LIFO (stack): one pointer, incremented on write, decremented on read. CAM: an SRAM that also matches a key against every word, asserting matchlines. TLB: virtual address as key; matchline drives the wordline of a RAM holding the physical address; NOR of matchlines = miss. 10T CAM cell = 6T + match transistors; key on bitlines (or separate searchlines to save power); any mismatching bit pulls the precharged (or pseudo-nMOS) matchline low; don't-care key bit: both bitlines low; ~2× SRAM area. Matchlines fall monotonically while RAM wordlines must rise: strobed AND gates, timed by an inverter chain or replica, with margin. TCAM stores 0, 1 or X using two bits (A=1,B=0 matches 0; A=0,B=1 matches 1; A=B=0 matches both); network routers. CAMs are power-hungry (heavily loaded matchlines, activity ≈ 1).",
    steps: [
      { k: "learn", title: "Shift registers", b: [
        `<p>A chain of flops delays data by N cycles. Big ones are cheaper as a <b>dual-port RAM used as a circular buffer</b>: a write pointer and a read pointer chase each other round the array. One-hot pointer registers can drive the wordlines directly, with no decoder.</p>`,
        `<p>A <b>tapped delay line</b> gets any delay 0–63 from blocks of 32, 16, 8, 4, 2 and 1 stages, each bypassable by a mux: the delay amount in binary.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A tapped delay line must delay by 37 stages. Which blocks are switched in?", opts: [["32, 4 and 1", true, "37 = 100101 in binary."], ["32 and 5", false, "There's no 5-stage block."], ["16, 16, 4, 1", false, "Each block can be used once."]] },
      ]},
      { k: "learn", title: "FIFOs and stacks", b: [
        `<p>A <b>FIFO</b> buffers data between two clock domains: write pointer and read pointer move round a circular buffer. Read catches write: EMPTY. Write about to catch read: FULL.</p>`,
        `<p>A <b>LIFO</b> (stack, e.g. for subroutine returns) needs just one pointer: up on push, down on pop.</p>`,
        seenV("Stacks in the LC-3.", "../pp/08-data-structures.html", "Patt & Patel Ch 8"),
      ]},
      { k: "learn", title: "Content-addressable memory", b: [
        `<p>A CAM cell is an SRAM cell plus a few transistors that compare the stored bit with the key on the bitlines. All cells in a word share a precharged <b>matchline</b>; any mismatching bit pulls it low. Only fully matching words stay high.</p>`,
        `<p>Use: a <b>TLB</b>. The virtual address is the key; the matching row's matchline becomes the wordline of a RAM holding the physical address. No match anywhere: <b>miss</b>.</p>`,
        seenV("Virtual memory and TLBs.", "../hh/08-memory-systems.html", "Harris & Harris Ch 8"),
      ]},
      { k: "play", title: "A ternary CAM", b: [
        `<p>A TCAM can store X (don't care), useful in network routers. Before changing the key: which rows match 1011?</p>`,
        tcamWidget,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why can't the CAM's matchlines drive the RAM wordlines directly?", opts: [["Matchlines start high and fall; RAM wordlines must only rise. A strobe ANDs them in after the matchlines settle", true, "Monotonicity again, like domino."], ["Matchlines are too weak", false, "They're buffered anyway."], ["Several can stay high", false, "In a TLB at most one should match."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a CAM find which word matches a key?", model: "The key is broadcast to every word at once on the bitlines or searchlines. Each cell compares its stored bit with the key bit, and if they differ it pulls down that word's precharged matchline. Every word's comparison happens in parallel, so after one evaluation only the matchlines of words equal to the key remain high." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "PLAs and robust memory design", mins: 25,
    blurb: "Two-level logic as an array, then the tricks that make huge memories yield: spare rows, ECC, interleaving, hardened cells.",
    takeaway: "PLA: regular sum-of-products logic: AND plane (minterms/products of literals) + OR plane; with registers, FSMs. Popular before multilevel synthesis matured; now usually synthesized (Cell processor still used 27 dynamic PLAs per core). NOR–NOR form (invert inputs and outputs) because NOR uses only parallel transistors. Dot diagrams; spare rows/columns for late changes. A ROM is a PLA whose AND plane generates all 2ⁿ minterms (the decoder). Example 12.5 full adder: s = abc + ab̄c̄ + ābc̄ + āb̄c (four 3-literal minterms), cout = ab + bc + ac. Pseudo-nMOS PLA: simple, small, but static power, slow pull-up, poor synthesis fit; minterms on a 1.5-track pitch; pullups can be enabled. Dynamic PLA: faster, but AND plane drives OR plane (nonmonotonic): delayed OR clock via replica, capture outputs before AND precharges; high power (activity ≈ 1); self-timed version with two dummy AND rows (precharge pulse width, evaluation completion) and three inverters of margin. NAND–NOR (domino AND) PLAs are monotonic but slow for many series transistors. Robust memory: redundancy since 64 Kb DRAMs: spare rows/columns, spare subarrays, or sell with less capacity; laser fuses or BIST + electronic fuses (even at every reset). Row redundancy: stored bad addresses disable the decoder and enable a spare row; column redundancy shifts sense outputs past bad columns. Example 12.6 (64 Mb, σ = 15 mV, 90% yield, 2048 subarrays of 32 kb): repair 2 cells per subarray → X_c = 2.1 × 10⁻⁶ → 4.6σ = 69 mV; replace 2 subarrays → 5.6σ = 84 mV (vs 6σ = 90 mV with no repair). Dummy rows/columns at array edges (lithography); Itanium 2 18-way 9 MB L3 with six spare 48 KB subarrays and fuse-disabled ways (≥ 12 good ways → 6 MB part); Flash marks bad blocks, wear-levels. ECC (8 check bits per 64) corrects soft errors and helps yield. Radiation hardening: 12T DICE SRAM (≈ 2× area). Multi-cell upsets: interleave words with column muxing (4:1 → a 4-bit strike hits one bit of each word; 2:1 often enough in thin cells). History: Intel 1103 1 kb DRAM (1970); IBM 370 replaced core; Intel left DRAM in 1986; capacity +60%/yr, cost/bit −27%/yr; density 4× per 3 years for three decades, now ~2×; Table 12.1 innovations from 3T/4T cells and nMOS to folded and twisted bitlines, half-V_DD precharge, redundancy, BIST, 3-D capacitors, DDR interfaces.",
    steps: [
      { k: "learn", title: "Programmable logic arrays", b: [
        `<p>Any function is a sum of products. A PLA computes all needed <b>products</b> in an AND plane and ORs them in an OR plane. Built as NOR–NOR (inverted inputs and outputs) because NORs have only parallel transistors.</p>`,
        `<p>Example 12.5, the full adder:</p>`,
        `<p class="eq">s = abc + ab̄c̄ + ābc̄ + āb̄c &nbsp;&nbsp; c<sub>out</sub> = ab + bc + ac</p>`,
        `<p>Seven product terms, two outputs. A <b>ROM</b> is the special case where the AND plane makes <i>every</i> minterm (it's the address decoder).</p>`,
        seenV("Sum-of-products and minimization.", "../hh/02-combinational-logic.html", "Harris & Harris Ch 2"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A ROM implementing a 6-input, 3-output function. How many words (rows) does it need?", a: 64, tol: 0.001, why: "All 2⁶ = 64 minterms, whether used or not. A PLA only builds the products it needs." },
      ]},
      { k: "learn", title: "Pseudo-nMOS or dynamic PLAs", b: [
        `<p>Pseudo-nMOS: simple and dense, but static power. Dynamic: faster, but the AND plane's falling outputs drive the OR plane's dynamic gates, breaking monotonicity. The OR plane must wait for a delayed clock (from a replica dummy row) until the AND plane has settled, and its outputs must be caught before the AND plane precharges.</p>`,
        `<p>Today synthesis usually wins; the Cell processor still used 27 dynamic PLAs per core where static logic was too slow.</p>`,
      ]},
      { k: "learn", title: "Redundancy", b: [
        `<p>One defect kills a logic chip; a memory can carry <b>spares</b>. Bad row addresses are stored (fuses, or a built-in self-test at every reset); a match disables the normal decoder and fires a spare row. Bad columns are skipped by shifting the sense-amp outputs over by one or two.</p>`,
        `<p>Example 12.6 (the 64 Mb array again): with no repair, 90 mV (6σ) of read margin. Repair 2 cells per subarray: <b>69 mV</b> (4.6σ). Replace 2 whole subarrays: <b>84 mV</b> (5.6σ). A few spares buy a lot of margin.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why add a dummy row and column around the edge of an array that are never used?", opts: [["Lithography and etch problems are worst at the edges of repetitive patterns, so the real cells all see a uniform neighbourhood", true, "The Sun Niagara used dummies on its register files."], ["To store ECC bits", false, "ECC uses real check bits."], ["For power distribution", false, "Not their purpose."]] },
      ]},
      { k: "learn", title: "Soft errors", b: [
        `<p><b>ECC</b> (8 check bits per 64) fixes single upsets and helps yield. But one particle can flip several <i>adjacent</i> cells. Interleave words with column multiplexing: with 4:1 muxing, every fourth bit of a row belongs to the same word, so a 4-cell strike flips one bit in each of four words: all correctable. For space and high-reliability use, a 12T DICE cell (about 2× area) corrects single-node upsets by itself.</p>`,
        seenV("Hamming codes and SEC-DED.", "11-datapath.html", "Chapter 11"),
      ]},
      { k: "why", title: "Fifty years of DRAM", b: [
        `<p>1970: Intel's 1103 (1 kb) and IBM replacing core memory. Since then: capacity +60% a year, cost per bit −27% a year, thanks to the 1T cell, folded and twisted bitlines, 3-D capacitors, redundancy and self-test, half-V<sub>DD</sub> precharge and faster interfaces (DDR). Price wars were fierce enough that Intel left the DRAM business in 1986.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does column multiplexing help protect a memory against multi-bit soft errors?", model: "With column multiplexing, physically adjacent cells in a row belong to different words: with 4:1 muxing, every fourth bit is from the same word. A particle strike that upsets several neighbouring cells therefore flips at most one bit in each word, and single-error-correcting ECC on each word can fix all of them." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "vlsi12", eyebrow: "CMOS VLSI · Chapter 12", title: "Array Subsystems",
    intro: `<p>Ten parts: memory types and organization, the 6T SRAM cell and its margins, decoders, column circuits and sense amplifiers, register files and low-power SRAM, DRAM, ROM and Flash, serial memories and CAMs, and finally PLAs and the tricks that make huge arrays yield.</p><p>Arrays are mostly about <b>ratios</b> (strong enough, weak enough) and <b>long wires</b> (bitlines and wordlines). Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises. For delay questions, reuse the logical-effort approach of Example 12.2 and EQ 12.5: write down G, B, H and P first. For the ROM and PLA questions, draw dot diagrams.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10],
    summary: `
      <h3>SRAM</h3>
      <p>6T: pull-down > access > pull-up (read stability, writability). Margins from butterfly squares; X<sub>c</sub> = 1 − Y<sup>1/N</sup> → ~6σ for 64 Mb. 8T and 12T cells. Decoders: predecoding, hierarchical wordlines, domino ~33% faster. Bitlines: 512RC for 256 words; hierarchical large-signal sensing or sense amps with replica timing; column muxes. Banking, assists, sleep at retention voltage. D = 2(m + n) + 4log₄[(n + 2)/3] + n + 2<sup>n+1</sup>/3.</p>
      <h3>DRAM</h3>
      <p>1T1C; ΔV = (V<sub>DD</sub>/2)C<sub>cell</sub>/(C<sub>cell</sub> + C<sub>bit</sub>); destructive read and refresh; open/folded/twisted bitlines; cross-coupled sense amp rewrites the cell.</p>
      <h3>ROM, Flash, others</h3>
      <p>NOR ROM (dots = transistors), NAND ROM (series). Floating gates; NAND Flash erase/program/read voltages; retention and endurance. Circular-buffer shift registers, FIFO/LIFO. CAM matchlines, TCAM, TLB. PLA = AND plane + OR plane.</p>
      <h3>Robustness</h3>
      <p>Spare rows/columns/subarrays, dummy edges, ECC, interleaving, DICE cells.</p>`,
  };
  Course.start(window.CHAPTER);
})();
