(function () {
  const { S, plot, slider, toggle, readout, fmt, el } = Course;
  const { bits, bitButtons, gate } = Digital;
  const seenV = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const fig = (s) => `<div class="fig">${s}</div>`;
  const mono = (s) => `<span class="mono">${s}</span>`;

  /* ---------- widgets ---------- */
  // Stuck-at fault simulation on Y = (A·B) + C, with internal node n1 = A·B
  function faultSim(host) {
    const nodes = ["A", "B", "C", "n1", "Y"];
    const evalC = (a, b, c, f) => {
      const v = { A: a, B: b, C: c };
      const force = (n) => { if (f && f[0] === n) v[n] = f[1]; };
      force("A"); force("B"); force("C");
      v.n1 = v.A & v.B; force("n1");
      v.Y = v.n1 | v.C; force("Y");
      return v.Y;
    };
    const faults = []; nodes.forEach((n) => [0, 1].forEach((s) => faults.push([n, s])));
    const on = new Array(8).fill(false);
    const out = el(`<div></div>`);
    const draw = () => {
      const vecs = on.map((x, i) => (x ? i : -1)).filter((i) => i >= 0);
      const det = faults.map((f) => vecs.some((i) => { const a = (i >> 2) & 1, b = (i >> 1) & 1, c = i & 1; return evalC(a, b, c, null) !== evalC(a, b, c, f); }));
      const n = det.filter((x) => x).length;
      out.innerHTML = `<div class="tbl"><table><thead><tr><th>Fault</th>${faults.map((f) => `<th>${f[0]}/${f[1]}</th>`).join("")}</tr></thead><tbody><tr><td>Detected?</td>${det.map((d) => `<td style="text-align:center">${d ? "✓" : "·"}</td>`).join("")}</tr></tbody></table></div>` +
        readout([["Vectors applied (ABC)", vecs.length ? vecs.map((i) => bits(i, 3)).join(", ") : "none"], ["Fault coverage", n + " / " + faults.length + " = <b>" + Math.round((100 * n) / faults.length) + "%</b>"]]);
    };
    const row = el(`<div class="row"></div>`);
    for (let i = 0; i < 8; i++) { const b = el(`<button type="button" class="btn small" aria-pressed="false">${bits(i, 3)}</button>`); b.addEventListener("click", () => { on[i] = !on[i]; b.setAttribute("aria-pressed", String(on[i])); draw(); }); row.append(b); }
    const g1 = gate("and", 70, 40, 2), g2 = gate("or", 170, 60, 2);
    const svgC = S.svg(300, 110, g1.s + g2.s + `<polyline class="w" points="${g1.out[0]},${g1.out[1]} ${g2.ins[0][0] - 10},${g1.out[1]} ${g2.ins[0][0] - 10},${g2.ins[0][1]} ${g2.ins[0][0]},${g2.ins[0][1]}"/>` + `<line class="w" x1="30" y1="${g1.ins[0][1]}" x2="${g1.ins[0][0]}" y2="${g1.ins[0][1]}"/><line class="w" x1="30" y1="${g1.ins[1][1]}" x2="${g1.ins[1][0]}" y2="${g1.ins[1][1]}"/><line class="w" x1="30" y1="${g2.ins[1][1]}" x2="${g2.ins[1][0]}" y2="${g2.ins[1][1]}"/><line class="w" x1="${g2.out[0]}" y1="${g2.out[1]}" x2="${g2.out[0] + 30}" y2="${g2.out[1]}"/>` + S.t(22, g1.ins[0][1] + 5, "A", { a: "end" }) + S.t(22, g1.ins[1][1] + 5, "B", { a: "end" }) + S.t(22, g2.ins[1][1] + 5, "C", { a: "end" }) + S.t(g1.out[0] + 18, g1.out[1] - 8, "n1", { cls: "s" }) + S.t(g2.out[0] + 36, g2.out[1] + 5, "Y", { a: "start" }), { label: "Y = AB + C" });
    host.append(el(fig(svgC)), el(`<p>Click vectors to apply them:</p>`), row, out); draw();
  }
  // NOR gate with nMOS A stuck open: Z = NOR(A,B) + (¬B · Z_prev)
  function stuckOpen(host) {
    let seq = [[0, 0], [1, 0], [0, 1], [1, 0]];
    const out = el(`<div></div>`);
    const draw = () => {
      let z = 1; const rows = [];
      seq.forEach(([a, b]) => { const good = 1 - (a | b); if (!(a === 1 && b === 0)) z = good; rows.push([a, b, good, z]); });
      out.innerHTML = `<div class="tbl"><table><thead><tr><th>step</th><th>A B</th><th>good NOR</th><th>faulty (nMOS A open)</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td class="mono">${r[0]} ${r[1]}</td><td>${r[2]}</td><td${r[2] !== r[3] ? ' style="background:var(--bad-soft)"' : ""}>${r[3]}${r[0] === 1 && r[1] === 0 ? " (floating: holds)" : ""}</td></tr>`).join("")}</tbody></table></div>`;
    };
    const row = el(`<div class="row"></div>`);
    [[0, 0], [0, 1], [1, 0], [1, 1]].forEach((p) => { const b = el(`<button type="button" class="btn small">apply ${p[0]}${p[1]}</button>`); b.addEventListener("click", () => { seq.push(p); if (seq.length > 8) seq.shift(); draw(); }); row.append(b); });
    const r = el(`<button type="button" class="btn small">reset</button>`); r.addEventListener("click", () => { seq = [[0, 0]]; draw(); }); row.append(r);
    host.append(row, out); draw();
  }
  function scanWidget(host) {
    let chain = [0, 0, 0, 0], sin = "1011", shifts = 0;
    const out = el(`<div></div>`);
    const draw = () => {
      out.innerHTML = fig(S.svg(460, 90, chain.map((b, i) => S.box(60 + i * 90, 20, 60, 44, String(b), { cls: b ? "hl" : "" })).join("") + chain.slice(0, -1).map((_, i) => S.arrow(120 + i * 90, 42, 150 + i * 90, 42)).join("") + S.arrow(20, 42, 60, 42) + S.arrow(390, 42, 430, 42) + S.t(16, 36, "SI", { a: "end", cls: "s" }) + S.t(440, 36, "SO", { a: "start", cls: "s" }), { label: "4-bit scan chain" })) +
        readout([["Shifts so far", shifts], ["Next bit in (from " + mono(sin) + ")", sin[shifts % 4]], ["Last bit out", shifts ? String(lastOut) : "—"]]);
    };
    let lastOut = 0;
    const b1 = el(`<button type="button" class="btn">Shift once (SCAN = 1)</button>`), b2 = el(`<button type="button" class="btn">Capture one functional cycle (SCAN = 0): each flop loads the inverse of its neighbour</button>`);
    b1.addEventListener("click", () => { lastOut = chain[3]; chain = [Number(sin[shifts % 4]), ...chain.slice(0, 3)]; shifts++; draw(); });
    b2.addEventListener("click", () => { chain = chain.map((_, i) => 1 - chain[(i + 3) % 4]); draw(); });
    const row = el(`<div class="row"></div>`); row.append(b1, b2);
    host.append(row, out); draw();
  }
  function shmooWidget(host) {
    const V = [1.0, 1.1, 1.2, 1.3, 1.4, 1.5], P = [1.0, 1.1, 1.2, 1.3, 1.4, 1.5];
    const pats = {
      "Normal": (v, p) => p < 1.0 + (1.5 - v) * 1.0 - 0.05,
      "Wall": (v) => v >= 1.25,
      "Reverse speedpath": (v, p) => p < 1.0 + (v - 1.0) * 1.0 - 0.05,
      "Floor": (v, p) => p >= 1.35,
      "Finger": (v, p) => (Math.abs(v - 1.2) < 0.06 && Math.abs(p - 1.2) < 0.06) || (Math.abs(v - 1.3) < 0.06 && Math.abs(p - 1.3) < 0.06),
    };
    const names = Object.keys(pats);
    let k = 0;
    const out = el(`<div></div>`);
    const draw = () => {
      const f = pats[names[k]];
      const W = 380, H = 260, x0 = 70, y0 = 20, dx = 48, dy = 34;
      let s = "";
      P.forEach((p, j) => { s += S.t(x0 - 10, y0 + j * dy + 22, p.toFixed(1), { a: "end", cls: "s" }); V.forEach((v, i) => { const fail = f(v, p); s += `<rect x="${x0 + i * dx}" y="${y0 + j * dy}" width="${dx - 4}" height="${dy - 4}" rx="3" style="fill:${fail ? "var(--bad)" : "var(--good-soft)"};opacity:${fail ? 0.75 : 1}"/>`; }); });
      V.forEach((v, i) => (s += S.t(x0 + i * dx + 22, y0 + P.length * dy + 14, v.toFixed(1), { cls: "s" })));
      s += S.t(x0 + 3 * dx, H - 4, "V_DD (V) →", { cls: "s" }) + S.t(14, 14, "period (ns) ↓", { a: "start", cls: "s" });
      out.innerHTML = fig(S.svg(W, H, s, { label: "Shmoo plot: red cells fail" }));
    };
    host.append(toggle(names, (i) => { k = i; draw(); }, 0), out); draw();
  }
  function lfsr3(host) {
    let q = [1, 0, 0], hist = [];
    const out = el(`<div></div>`);
    const step = () => { const fb = q[0] ^ q[2]; q = [fb, q[0], q[1]]; }; // 1 + x + x³ style feedback for the demo
    const draw = () => { out.innerHTML = readout([["State Q0 Q1 Q2", mono(q.join(" "))], ["States seen", hist.join(" → ")]]); };
    const b = el(`<button type="button" class="btn">Clock</button>`);
    b.addEventListener("click", () => { step(); hist.push(q.join("")); if (hist.length > 9) hist.shift(); draw(); });
    hist.push(q.join("")); host.append(b, out); draw();
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Three kinds of testing", mins: 15,
    blurb: "Is the design right? Did the first silicon come out as designed? Is this particular chip free of defects? And why catching a fault early is worth so much.",
    takeaway: "“Testing! Testing! Testing!”: for many chips testing takes more effort than design. Three categories: functionality tests / logic verification (before tapeout); silicon debug on first chips back (full speed, in a system, e.g., boot an OS; detective work with little visibility); manufacturing tests on every chip before shipping (every transistor, gate and storage element intact). Often separate test sets for logic bugs and for defects. Defects (dust, imperfections in material or masks) cause faults; manufacturing test decides which dies to ship. Levels: wafer, packaged chip, board, system, field; cost to find a fault roughly $0.01–0.10, $0.10–1, $1–10, $10–100, $100–1000 [Williams86]. Pentium FDIV bug: >4 million shipped in 1994, recall ≈ $450M. Most first-silicon failures are functional: the chip does what the simulator said, but that's not what the system expects (human error). Example 15.1 (MIPS): verification exercises every instruction; manufacturing must show every gate can produce 0 and 1; tests must be complete enough for few defective shipments and short enough to be economical.",
    steps: [
      { k: "learn", title: "Three questions", b: [
        `<div class="tbl"><table><tbody><tr><td><b>Logic verification</b> (before tapeout)</td><td>Does the design do what it should?</td></tr><tr><td><b>Silicon debug</b> (first chips)</td><td>Does the real chip behave like the design, at full speed, in a real system?</td></tr><tr><td><b>Manufacturing test</b> (every chip)</td><td>Is <i>this</i> chip free of defects?</td></tr></tbody></table></div>`,
      ]},
      { k: "learn", title: "Catch it early", b: [
        `<div class="tbl"><table><thead><tr><th>Fault found at</th><th>Cost</th></tr></thead><tbody><tr><td>Wafer</td><td>$0.01–0.10</td></tr><tr><td>Packaged chip</td><td>$0.10–1</td></tr><tr><td>Board</td><td>$1–10</td></tr><tr><td>System</td><td>$10–100</td></tr><tr><td>Field</td><td>$100–1000</td></tr></tbody></table></div>`,
        `<p>The extreme case: Intel's Pentium floating-point divide bug reached over 4 million shipped chips in 1994 and cost about <b>$450 million</b>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "According to the book, why do most first-silicon chips fail?", opts: [["The chip does exactly what the simulator said, but that isn't what the rest of the system expects (human error)", true, "Functional problems, not manufacturing ones."], ["Manufacturing defects", false, "Those are screened by manufacturing test."], ["Simulator bugs", false, "Rarely the culprit."]] },
      ]},
      { k: "learn", title: "Example 15.1: two kinds of test for one processor", b: [
        `<p><b>Verification</b>: run a program that exercises every instruction and shows each behaves as intended. It needn't try every address and data value.</p>`,
        `<p><b>Manufacturing</b>: prove every <i>gate</i> works: ideally drive each one to produce both a 0 and a 1. The test must be thorough enough that few bad chips escape, yet short enough to be affordable.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't the same test set do both logic verification and manufacturing test well?", model: "Verification tests aim to show that the design's intended functions all behave correctly, so they're organized around features and corner cases of the specification. Manufacturing tests assume the design is correct and aim to detect physical defects anywhere, so they must toggle and observe every node while staying short, because tester time costs money. A good functional test can leave many nodes unexercised, and a good defect test may say little about whether the specification was met." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Logic verification", mins: 25,
    blurb: "Golden models, test benches, directed and random vectors, nightly regressions, version control and bug tracking.",
    takeaway: "Prove each representation matches the one above it (Figure 15.1): behavioral spec ↔ RTL (formal verification or test-vector equivalence), RTL ↔ structural (timing, noise), structural ↔ physical (LVS, power, DRC, ERC, parasitic extraction). Golden model (C, SystemC, HDL, or a table) is the reference; compare outputs at checkpoints, ideally cycle by cycle, using a test bench (wrapper providing stimulus and automatic checking). FPGA emulation for near-real-time system tests (e.g., WLAN with real channel effects) and extra observability (bit-error-rate circuits). Simulate as the chip will be used; move up the hierarchy as modules are verified (replace gate-level modules with functional models; check equivalence at each level). Verification effort usually exceeds design effort: “If you don't test it, it won't work! (guaranteed).” Exhaustive testing explodes: N inputs → 2^N vectors; with M state bits 2^(N+M); N = 25, M = 50 → 2^75 ≈ 3.8 × 10²² vectors → over a billion years at 1 µs each. Test vectors: directed (corner cases: 0x00000000, 0xFFFFFFFF, 0x00000001, 0x80000000, 0x55555555, 0xAAAAAAAA, a random value) and random/semirandom (surprisingly good at subtle bugs); effectiveness measured by fault coverage. Test benches compute or load expected outputs; simulators give breakpoints and stepping. Regression testing: suites run nightly to catch breakage; built bottom-up (Example 15.3: NCO pieces → NCO → upconverter → … → whole radio). Version control (CVS, Subversion; Example 15.4 revert a bad ALU edit). Bug tracking (GNATS; location, severity, discoverer, owner; trend of open bugs shows convergence).",
    steps: [
      { k: "learn", title: "Check every level against the one above", b: [
        `<p>Write a <b>golden model</b> (C, SystemC, an HDL, even a table) and make it the reference. Then: spec ↔ RTL by simulation or formal proof; RTL ↔ gates by timing and noise analysis; gates ↔ layout by LVS, DRC and extraction.</p>`,
        `<p>A <b>test bench</b> wraps the design, applies stimulus and checks outputs automatically, cycle by cycle if possible. For big systems, run the RTL on an <b>FPGA emulator</b> at near real speed with real inputs.</p>`,
        seenV("Test benches with expected outputs.", "../hh/04-hdl.html", "Harris & Harris Ch 4"),
      ]},
      { k: "learn", title: "You can't test everything", b: [
        `<p>N inputs need 2<sup>N</sup> vectors. Add M bits of state and it's 2<sup>N+M</sup>: for N = 25, M = 50 that's 2<sup>75</sup> ≈ 3.8 × 10<sup>22</sup>, over a billion years at a microsecond each. Fortunately the number of things that can actually be broken is far smaller than the number of states.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A block with 20 inputs and 12 state bits, tested exhaustively at 100 million vectors per second. How many seconds?", a: 42.9, tol: 0.02, why: "2³² ≈ 4.29 × 10⁹ vectors / 10⁸ per second ≈ 43 s. Add 20 more state bits and it's about 1.4 years; 30 more, 1400 years." },
      ]},
      { k: "learn", title: "Directed and random vectors", b: [
        `<p><b>Directed</b>: chosen by someone who knows where things break. For a 32-bit datapath: all zeros, all ones, 1 in the LSB, 1 in the MSB, 0x5555…, 0xAAAA…, and a random value, in all combinations. Run these on every new piece of RTL.</p>`,
        `<p><b>Random</b>: lots of them. Surprisingly good at finding subtle bugs nobody thought to aim at.</p>`,
      ]},
      { k: "learn", title: "Regressions, versions, bugs", b: [
        `<p><b>Regression testing:</b> every night, rerun the whole suite so a fix in one place can't silently break another. Build it bottom-up (Example 15.3): test the NCO's phase incrementer, adder and ROM, then the NCO, then the upconverter… then the whole radio. Debugging only at the top level is futile.</p>`,
        `<p><b>Version control</b> lets you see who changed what and revert (Example 15.4). <b>Bug tracking</b> records each bug's location, severity and owner; a falling count of open bugs means the design is converging.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "The nightly regression fails in the ALU test. What should the design lead do first?", opts: [["Check the version history for today's ALU changes and revert to the last passing version", true, "Exactly Example 15.4. Then file a bug for the owner to fix properly."], ["Rerun the full-chip test to see if it still boots", false, "Top-level debugging is the slow way."], ["Ignore it until tapeout", false, "Bugs compound."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why build verification bottom-up instead of only testing the whole chip?", model: "Small blocks can be tested thoroughly, sometimes exhaustively, quickly. Once a block is trusted it can be replaced by a fast functional model when testing the level above, so higher-level simulations stay practical. If something fails, the problem is localized to the new level. Testing only at the top runs too slowly to cover much, and when it fails you can't tell where the bug is." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Testers, fixtures and test programs", mins: 15,
    blurb: "A tester costs about 8 cents a second. Probe cards and load boards, test programs and stimulus files, handlers, and the shmoo.",
    takeaway: "Tester applies stimuli and records/compares responses; test fixtures: probe card (wafer/bare die), load board (packaged part), bench PCB, in-system PCB. Production testers (e.g., Teradyne Catalyst): configurable pins (drive current, levels), huge RAM per pin, cycle-by-cycle drive and compare; failing dies inked, parts binned; seconds per part. Shmooing: sweep supply and cycle time (or input timing) to map pass/fail. Tester time is charged; Example 15.2: $5M over 2 years ≈ $0.08/s; trade test cost vs escapes. Lab testers, logic analyzers + pattern generators, FPGA-based homebrew testers. Test program (e.g., Teradyne IMAGE, C-based): set supplies, map signal names to pins, directions and levels, clock, pattern and assertion timing; per chip: apply supplies, apply stimulus, compare, log. Stimulus/pattern files from simulation (VCD); example full-adder vectors with I/O directions and names; clock as two tester cycles or via a timing generator placing the edge within the cycle; per-pin function memory (with tristate/mask bits); formats NRZ, RTZ, SBZ. Handlers: feed chips to the load board, bin results; temperature chucks (rarely used at package test because of cycling time); ~1 s per part, so test 2–4 at once; choose the handler before designing the load board.",
    steps: [
      { k: "learn", title: "The tester", b: [
        `<p>A production tester has hundreds of pins, each backed by deep memory: every cycle it drives inputs and compares outputs against expected values. A <b>probe card</b> touches pads on the wafer; a <b>load board</b> holds packaged chips. Failing dies get an ink dot; packaged parts are sorted into good and bad bins.</p>`,
        `<p>Testers are expensive and billed by time, so <b>shorter tests = cheaper chips</b>.</p>`,
      ]},
      { k: "check", title: "Example 15.2", b: [
        { t: "num", q: "A $5 million tester is useful for two years. Cost per second of tester time, in cents?", a: 7.9, tol: 0.03, why: "$5M / (2 × 365 × 86400 s) ≈ $0.079/s. A 3-second test costs about 24 cents per chip." },
      ]},
      { k: "learn", title: "Test programs and vector files", b: [
        `<p>The test program sets up supplies, maps signal names to tester pins, sets levels and timing; then for each chip: power up, apply vectors, compare, log. Vectors usually come straight from simulation:</p>`,
        `<pre class="code">     III OO     (directions)
     ABC SC     (names: A B C SUM CARRY)
0    000 00
1    001 10
...
7    111 11</pre>`,
        `<p>A <b>handler</b> feeds packaged chips to the load board (~1 s each, so test several at once).</p>`,
      ]},
      { k: "learn", title: "Shmooing", b: [
        `<p>Sweep supply voltage on one axis and clock period on the other, run the tests at every point, and mark pass or fail. The picture, a <b>shmoo plot</b>, shows how the chip's speed depends on voltage (Part 4 shows how to read one).</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do manufacturers care so much about the length of the production test?", model: "Production testers are very expensive and are charged by the second, and every single chip must be tested, so test time multiplies directly into the cost of each part. A test that's twice as long roughly doubles that cost, so test sets are made as short as possible while still catching enough defects to keep escapes to customers low." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Silicon debug", mins: 25,
    blurb: "The first chips are back. Smoke test, peek and poke, one change at a time, probe the die, fix with a focused ion beam, and read the shmoo.",
    takeaway: "Debug board: variable V_DD with current measurement, real-world I/O, variable-frequency clock, PC interface (serial/parallel/PCI); peek/poke software for registers; logic-analyzer headers; ZIF socket. Smoke test: ramp supplies with clocks off (static circuits draw ~0, analog quiescent), then clocks (dynamic current); beware chips appearing to run with power off (clocks feed power through input protection diodes); start at reduced clock speed. Read an ID register at address 0; read reset values; run BIST over boundary scan if available; otherwise bottom-up (a top-level OS boot usually fails first because of the fixture). Debug method: hypothesize and test. Pointers: dated logbook; one change at a time (no shotgun); check everything 2–3 times, have measurements checked; check signals and supplies at the pins (new boards have errors); continuity; never dismiss a cause without proof; freeze spray / heat gun; compare registers with documentation; check I/O timing vs clock; where there's one rat there are many; healthy paranoia. Agans's nine rules: understand the system; make it fail; quit thinking and look; divide and conquer; change one thing at a time; keep an audit trail; check the plug; get a fresh view; if you didn't fix it, it ain't fixed. Typical deviations: too slow (slow clock, raise V_DD), races (heat), dynamic logic problems, crosstalk, wrong functionality. Direct access: probe pads (5–10 µm top metal, overglass cut; buffer them), picoprobes (e.g., 50 fF, 1.25 MΩ, DC–26 GHz, 10 µm window), e-beam probing, laser voltage probing (can disturb dynamic nodes), PICA (photon emission, noninvasive), both through the backside in flip-chip; IR imaging and liquid crystals for hot spots; focused ion beam (FIB) cuts and new wires, cheaper and faster than mask changes (Example 15.6: cut a V_DD–GND short). Analog/novel circuits: SPICE model, assert and prove. Failure types: manufacturing (defects, parametric), functional (logic or physical design errors, fail always; easiest to fix), electrical (correct logic but fails at some voltage, temperature or frequency; may be hard to reproduce). Shmoo patterns (Figure 15.9): normal (faster with higher V), brick wall (random two-state initialization, e.g., no reset), wall (fails above/below a voltage: charge sharing, coupling, races), reverse speedpath (higher voltage → lower frequency: leakage of weakly held nodes), floor (fails at low frequency at any voltage: leakage), finger (specific points: coupling alignment). Intel Atom: 1.25 GHz at 0.75 V, 2.5 GHz at 1.15 V. Temperature shmoos: cold is normally faster; cold failures suggest coupling/charge sharing (faster edges), hot failures leakage or noise (lower V_t), walls races.",
    steps: [
      { k: "learn", title: "Bring-up", b: [
        `<p>Build a board that can vary and measure V<sub>DD</sub>, supply real inputs, generate a variable clock, and talk to a PC.</p>`,
        `<ol><li><b>Smoke test:</b> ramp the supply with clocks off; a static chip should draw almost nothing. Then turn on the clock.</li><li>Run slowly at first, so setup times aren't the first suspect.</li><li><b>Peek and poke</b> registers; read an ID register at address 0.</li><li>Then build confidence bottom-up (or via built-in self-test).</li></ol>`,
        `<p class="aside">Gotcha: a chip can appear to run with its power <i>off</i>, powered through the clock pin's protection diodes.</p>`,
        seenV("ESD protection diodes.", "13-special-purpose.html", "Chapter 13"),
      ]},
      { k: "learn", title: "How to debug", b: [
        `<p>Hypothesize, then test. Agans's rules: <b>understand the system · make it fail · quit thinking and look · divide and conquer · change one thing at a time · keep an audit trail · check the plug · get a fresh view · if you didn't fix it, it ain't fixed.</b></p>`,
        `<p>And: keep a dated logbook, measure at the chip's own pins (new boards have bugs), never dismiss a cause you haven't disproved, and when you find one bug look for its siblings: “where there's one rat, there are many”.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A new chip fails its first test. An engineer changes the clock speed, supply voltage and test program all at once, and it passes. What's wrong with this?", opts: [["It's the “shotgun” approach: you can't tell which change mattered, so you haven't learned the cause", true, "Change one thing at a time."], ["Nothing: it passes", false, "If you didn't fix it, it ain't fixed."], ["They should have changed more things", false, "Fewer, not more."]] },
      ]},
      { k: "learn", title: "Seeing inside", b: [
        `<div class="tbl"><table><tbody><tr><td>Probe pads + picoprobe</td><td>small top-metal squares left open; a ~50 fF probe touches them</td></tr><tr><td>E-beam, laser voltage probing, PICA</td><td>measure switching without contact, even through the back of a flip-chip die</td></tr><tr><td>Infrared imaging</td><td>find hot spots such as a resistive short</td></tr><tr><td><b>Focused ion beam</b></td><td>cut wires and lay new ones on a finished chip: faster and cheaper than new masks</td></tr></tbody></table></div>`,
      ]},
      { k: "learn", title: "Three kinds of failure", b: [
        `<div class="tbl"><table><tbody><tr><td><b>Manufacturing</b></td><td>a defect, or parameters out of spec</td></tr><tr><td><b>Functional</b></td><td>a logic or layout bug: fails under all conditions; usually the easiest to fix</td></tr><tr><td><b>Electrical</b></td><td>logically right, but fails at some voltages, temperatures or frequencies; can be very hard to reproduce</td></tr></tbody></table></div>`,
      ]},
      { k: "play", title: "Reading a shmoo", b: [
        `<p>Rows: clock period (shorter = faster, at the top). Columns: supply voltage. Red: fails. Look at each pattern and think about what physical effect could make it.</p>`,
        shmooWidget,
        `<div class="tbl"><table><tbody><tr><td>Normal</td><td>higher voltage runs faster</td></tr><tr><td>Wall</td><td>fails on one side of a voltage at any speed: charge sharing, coupling, races</td></tr><tr><td>Reverse speedpath</td><td>higher voltage needs a <i>slower</i> clock: a weakly held node leaking</td></tr><tr><td>Floor</td><td>fails at low frequency (long periods) at any voltage: leakage</td></tr><tr><td>Finger</td><td>fails at specific points: coupling between aligned signals</td></tr></tbody></table></div>`,
        `<p class="aside">A “brick wall” (pass or fail at random, run to run) suggests a state that powers up randomly, such as a register with no reset.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A chip works at every voltage when the clock is fast, but fails at slow clocks regardless of voltage. Which pattern, and what's the likely cause?", opts: [["Floor: leakage on a weakly held (dynamic) node over a long cycle", true, "Longer cycles give the leak more time."], ["Wall: a race", false, "A wall depends on voltage."], ["Normal speedpath", false, "Speedpaths fail at fast clocks."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do electrical failures tend to be harder to debug than functional ones?", model: "A functional failure is a logic or layout mistake, so it fails the same way under all conditions and can be reproduced in simulation of the design. An electrical failure comes from analog effects, such as noise, coupling, leakage, races or weak devices, that appear only at certain voltages, temperatures, frequencies or data patterns. It may be rare, hard to trigger, invisible in the logic simulation, and only diagnosable by sweeping conditions with tools like shmoo plots and physical probing." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Defects and fault models", mins: 20,
    blurb: "Real defects become shorts and opens. Model them as stuck-at faults, bridges, stuck-open transistors that add memory, or extra delay.",
    takeaway: "Manufacturing test screens defective parts; typical targets 350–1000 defects per million shipped (DPM). Plan test concurrently with architecture. Defects: layer-to-layer shorts, discontinuous wires (thinning over steps), missing/damaged vias, gate-oxide shorts → nodes shorted to power/ground or to each other, floating inputs, disconnected outputs. Fault models: stuck-at (S-A-0, S-A-1) from board-level days, caused e.g. by gate-oxide shorts (nMOS gate to GND, pMOS gate to V_DD) or metal shorts; most tools use Boolean stuck-at. Short-circuit (bridging) and open-circuit models fit reality better but are harder in logic simulation: S1 in Figure 15.12 acts as A stuck-at-0, S2 changes the gate's function; transistor-level models see hidden nodes (series stack midpoints). CMOS stuck-open can make combinational logic sequential: NOR with one nMOS open: Z = ¬(A + B) + (¬B·Z_prev) (for A = 1, B = 0 the output floats and holds). Missing pMOS: node charged arbitrarily until discharged. Stuck-closed (e.g., pMOS drain shorted to V_DD): detectable by static supply current (IDDQ) for inputs 01 or 10. Delay faults: circuit still works but slower (e.g., one of two parallel nMOS open raises t_pdf, and detection depends on previous state); crosstalk, SOI history effect; increasingly important.",
    steps: [
      { k: "learn", title: "From defects to faults", b: [
        `<p>Dust and imperfections cause shorts between layers, broken wires, bad vias, and gate-oxide shorts. Electrically: nodes stuck to V<sub>DD</sub> or GND, nodes shorted together, floating inputs.</p>`,
        `<p>Commercial parts aim for only <b>350–1000 defective parts per million</b> shipped.</p>`,
      ]},
      { k: "learn", title: "Stuck-at faults", b: [
        `<p>The workhorse model: a node behaves as if permanently <b>stuck at 0</b> (S-A-0) or <b>stuck at 1</b> (S-A-1). Simple enough for logic simulators, and catching all stuck-at faults catches most real defects. To test a node for S-A-0 you must drive it to 1 <i>and</i> make the difference visible at an output.</p>`,
      ]},
      { k: "learn", title: "Bridges and opens", b: [
        `<p>A <b>bridge</b> (short between nodes) may act like a stuck-at fault, or may change the gate's function entirely. Some nodes, like the midpoint of a series stack, don't even exist in the logic model: real accuracy needs transistor-level fault models.</p>`,
      ]},
      { k: "play", title: "An open that adds memory", b: [
        `<p>A NOR gate with one nMOS transistor (on input A) missing. When A = 1 and B = 0, nothing drives the output: it floats and remembers its last value. Apply inputs and see when the faulty gate gives a wrong answer.</p>`,
        stuckOpen,
        `<p class="eq">Z = ¬(A + B) + ¬B·Z<sub>prev</sub></p>`,
        `<p>A single test vector can't catch it: the test needs a <i>sequence</i> (first drive Z high, then apply 10).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Which two-vector sequence exposes that stuck-open nMOS A?", opts: [["00 then 10", true, "00 sets Z = 1; then 10 should give 0, but the faulty gate floats and stays 1."], ["10 then 00", false, "00 drives Z = 1 correctly in both."], ["01 then 01", false, "B's transistor works fine."]] },
      ]},
      { k: "learn", title: "Stuck-closed and delay faults", b: [
        `<p>A transistor shorted <i>on</i> makes a path from V<sub>DD</sub> to GND for some inputs: logic may still look right, but the chip draws <b>static current</b> (Part 8: IDDQ testing).</p>`,
        `<p><b>Delay faults:</b> one of two parallel transistors open still gives correct logic, just slower. Crosstalk and SOI history effects cause delay faults too.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why are stuck-at faults used so widely even though real defects are shorts and opens?", model: "Stuck-at faults fit easily into ordinary logic simulators and test generators, since each fault just forces one node to 0 or 1, and the number of faults is only twice the number of nodes. Many real defects do behave like stuck-at faults, and a test set that detects all of them tends to catch most other defects too. More accurate transistor-level models of bridges and opens are much harder and slower to simulate." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Observability, controllability, fault coverage", mins: 20,
    blurb: "Can you set this node? Can you see it? What fraction of faults do your vectors catch? Try fault simulation yourself.",
    takeaway: "Observability: how easily a node's value can be seen at the outputs (directly or after a few cycles). Controllability: how easily a node can be set to 0 or 1 (e.g., a counter's MSB may need thousands of cycles; global reset helps). Repeatability: same outputs for same inputs (synchronous logic is; arbiters may not be; lock-step modes help). Survivability: keep working after a fault (ECC, redundant rows/columns, spare cores, adaptive techniques; some automatic, some via fuses). Fault coverage: for each node, stick it at 0 then 1, simulate the vectors, compare with the good machine; coverage = fraction of faults detected; world-class quality needs > 98.5%. ATPG tools generate vectors for high coverage (compute-intensive; statistical estimates); scan and BIST improve observability and cut vector count. Historically test engineers reverse-engineered circuits; now designers own testability with ATPG.",
    steps: [
      { k: "learn", title: "Two properties every node needs", b: [
        `<div class="two"><div class="tile"><h3>Controllability</h3><p>Can you set this node to 0 and to 1 from the pins? A counter's top bit may take thousands of cycles to flip. A global reset helps a lot.</p></div><div class="tile"><h3>Observability</h3><p>Can you see this node's value at the pins, directly or after a few cycles? A value buried deep in the logic may never reach an output.</p></div></div>`,
        `<p>Also: <b>repeatability</b> (same inputs, same outputs; an arbiter may not be) and <b>survivability</b> (keep working after a fault: ECC, spare rows, spare cores).</p>`,
      ]},
      { k: "learn", title: "Fault coverage", b: [
        `<p>Take each node in turn, stick it at 0 and simulate your test vectors, then stick it at 1. If any output differs from the good circuit, that fault is <b>detected</b>.</p>`,
        `<p class="eq">coverage = detected faults / total faults</p>`,
        `<p>World-class quality needs more than <b>98.5%</b>.</p>`,
      ]},
      { k: "play", title: "Be the fault simulator", b: [
        `<p>Ten stuck-at faults (five nodes × 0/1). Before clicking anything: what's the smallest set of vectors that detects all ten?</p>`,
        faultSim,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "To detect n1 stuck-at-0 in Y = AB + C, which conditions must the vector meet?", opts: [["A = B = 1 (so n1 should be 1) and C = 0 (so the error reaches Y)", true, "Control the node to the opposite value, and make it observable at the output."], ["A = B = 1 only", false, "If C = 1, Y = 1 either way: the fault is masked."], ["C = 1", false, "That hides n1 completely."]] },
      ]},
      { k: "learn", title: "Automatic test pattern generation", b: [
        `<p>Test engineers once reverse-engineered circuits by hand to write tests (the “Sherlock Holmeses” of the industry). Now <b>ATPG</b> tools generate vectors automatically for high coverage, often on compute farms, and scan and BIST (next parts) make nodes observable and controllable so far fewer vectors are needed.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "To detect a fault on an internal node, why must a test both control and observe it?", model: "First the test must drive the node to the value opposite the fault, for example a 1 to expose a stuck-at-0, otherwise the faulty and good circuits behave identically. Then the other inputs must be set so that the difference propagates through the downstream logic to an output without being masked, otherwise the fault is present but invisible." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Design for testability: scan", mins: 20,
    blurb: "Turn every register into part of one long shift register, so the whole state can be read and written from two pins.",
    takeaway: "DFT keys: controllability and observability; they cut manufacturing test cost and are essential for silicon debug when probing is hard. Approaches: ad hoc, scan, BIST. Ad hoc (small designs without scan/ATPG/BIST): partition large sequential circuits, add test points, add multiplexers (TG muxes cheap), easy state reset (also speeds simulation), bus-based test access (registers loadable from and drivable onto the bus). Complete scan methodology recommended for all digital circuits. Scan design: registers have normal and scan modes; in scan mode they form one long shift register (scan chain); N clocks shift out all N state bits and shift in new ones. Scan register = D flip-flop with a mux (SCAN selects SI from the previous register's Q). Test: assert SCAN, clock in the pattern; deassert SCAN for one functional cycle; reassert and clock out the captured results while shifting in the next pattern. Every combinational input controllable and output observable; ATPG works on the combinational blocks; the chain itself tested by shifting random patterns. Cost: mux area and delay, outweighed by debug and test savings. Parallel scan: split long chains into segments; random-access scan (Figure 15.17) addresses registers like RAM with row/column select, data line and write. Scannable flops: TG mux on D (adds a series TG to setup time) or clock-gated scan input (nearly the original setup time); clock enables must still toggle K in scan mode.",
    steps: [
      { k: "learn", title: "Ad hoc tricks", b: [
        `<p>Partition big sequential circuits, add test points and multiplexers for alternative paths, make every register loadable from and readable onto a bus, and always provide a <b>quick reset</b> (which also speeds simulation). Fine for small designs; the book recommends full scan for every digital circuit.</p>`,
      ]},
      { k: "learn", title: "Scan", b: [
        `<p>Put a 2:1 mux in front of every flip-flop. Normal mode: D comes from the logic. <b>Scan mode</b>: D comes from the previous flop's Q, so all the flops form one long shift register, the <b>scan chain</b>.</p>`,
        `<ol><li>SCAN = 1: clock N times to shift a test pattern into every flop.</li><li>SCAN = 0: clock once; every flop captures the logic's response.</li><li>SCAN = 1: clock N times to shift the results out (and the next pattern in).</li></ol>`,
        `<p>Now every input to the combinational logic is <b>controllable</b> and every output <b>observable</b>, and ATPG only has to solve combinational problems.</p>`,
      ]},
      { k: "play", title: "Shift, capture, shift", b: [
        `<p>A 4-bit chain. Shift the pattern in, capture one functional cycle, then shift the result out. Predict what comes out before you shift.</p>`,
        scanWidget,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A chip has 50,000 flops in one scan chain and needs 2,000 test patterns. Roughly how many shift clocks (in millions) does testing take?", a: 100, tol: 0.02, why: "Each pattern shifts 50,000 bits (unloading the previous result at the same time): 2,000 × 50,000 = 10⁸ clocks. That's why long chains are split into many parallel segments." },
      ]},
      { k: "learn", title: "Making scan faster and cheaper", b: [
        `<p><b>Parallel scan:</b> split one long chain into many short ones loaded in parallel. Taken to the limit, <b>random-access scan</b> addresses registers like RAM cells with row and column selects.</p>`,
        `<p><b>Scannable flops:</b> a transmission-gate mux on D (adds a little setup time), or gating the clock on the scan input to keep almost the original setup time. Careful: clock gating for power must still let the clock toggle in scan mode.</p>`,
        seenV("Flip-flop circuits.", "10-sequential.html", "Chapter 10"),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does scan turn testing a sequential circuit into testing combinational logic?", model: "Without scan, setting the internal state means finding an input sequence that drives the circuit there, and seeing a result means waiting for it to propagate to the outputs, both potentially very long. With scan, every flip-flop can be loaded directly and read directly through the chain. Each test just sets all state bits, runs one clock, and reads all state bits back, which is exactly a test of the combinational logic between the registers." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Built-in self-test, IDDQ, and manufacturability", mins: 25,
    blurb: "Let the chip generate its own pseudo-random tests and compress the answers into a signature. Then current testing and designing for yield.",
    takeaway: "BIST adds test logic area but cuts test time and system cost. Signature analysis / cyclic redundancy checking: pseudo-random sequence generator (PRSG) = LFSR (n flops, XOR feedback, 2ⁿ − 1 states; characteristic polynomial, e.g., 1 + x + x³) drives the logic; a complete feedback shift register (CFSR) adds the all-zeros state with an (n − 1)-input NOR (or use the bottom n bits of an (n + 1)-bit LFSR). Signature analyzer: reset the syndrome, XOR in the outputs each cycle while scrambling (“swizzling”) the state so single-bit errors don't cancel; compare the final syndrome with the good machine's; enough bits make aliasing improbable. BILBO/BIST register (Figure 15.20, 3 bits, mode C[1:0]): reset 10, normal 11, scan 00 (shift register SI→SO with inversions), test 01 (PRSG if D low; signature analyzer if D from logic). Procedure: reset syndrome, put input and output registers in test mode, run, shift out the syndrome. Tools replace registers automatically; WLAN modem (~1M gates): full at-speed test < 1 s, 7.3% core area (free, pad-limited), 99.7% coverage, first silicon tested in < 10 minutes. Memory BIST: muxes on address/data/control, state machine writes checkerboard, reads, then inverse; ROMs read into a signature analyzer. On-chip logic analyzers and oscilloscopes (supply noise, jitter) with trigger, timing generator, sampling, buffer; nodes chosen at design time. ADC testing: parallel test ports or capture RAM; analog and digital loopback with DAC/ADC; “defensive design.” IDDQ: quiescent CMOS draws ~no current; bridging faults draw measurable static current; disable pseudo-nMOS, analog, beware dynamic gates; slow (~1 ms/vector); massive indirect observability; loses effectiveness as subthreshold leakage variation exceeds fault currents. Design for manufacturability: wider wire spacing, larger overlaps at contacts/vias, redundant vias; redundancy (spare rows, banks via fuses); power (electromigration, temperature, parameter drift); process spread (corners, Monte Carlo, centering); yield analysis (Pentium: silicide cracking on long thin poly raised resistance; widen or strap poly).",
    steps: [
      { k: "learn", title: "The chip tests itself", b: [
        `<p>A <b>pseudo-random sequence generator</b> (an LFSR, Chapter 11) feeds the logic thousands of patterns at full speed. A <b>signature analyzer</b> (another LFSR) XORs every output into its state, scrambling as it goes, so the whole response is compressed into one short <b>signature</b>. Compare it with the good chip's signature: match = pass.</p>`,
        seenV("Linear-feedback shift registers.", "11-datapath.html", "Chapter 11"),
      ]},
      { k: "play", title: "A 3-bit PRSG", b: [
        `<p>Feedback from Q0 ⊕ Q2. How many clocks until the starting state 100 returns?</p>`,
        lfsr3,
        `<p>An LFSR never visits 000. A <b>complete</b> feedback shift register adds a NOR gate to include it, when a test needs the all-zeros input.</p>`,
      ]},
      { k: "learn", title: "The BIST (BILBO) register", b: [
        `<div class="tbl"><table><thead><tr><th>C[1:0]</th><th>Mode</th></tr></thead><tbody><tr><td>11</td><td>normal register</td></tr><tr><td>10</td><td>reset to 0</td></tr><tr><td>00</td><td>scan (shift register)</td></tr><tr><td>01</td><td>test: pattern generator (if its D inputs are held low) or signature analyzer (if D comes from the logic)</td></tr></tbody></table></div>`,
        `<p>Reset the output register's signature, run both registers in test mode, then scan the signature out. On a ~1-million-gate WLAN modem: a full at-speed test in under a second, 99.7% coverage, for 7.3% extra core area; first silicon was fully tested within ten minutes.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why does the signature analyzer scramble its state each cycle instead of just XOR-ing outputs into a fixed register?", opts: [["So that an error in one cycle can't be cancelled by an identical error in another cycle", true, "With plain XOR, two errors in the same bit cancel. Scrambling makes such aliasing improbable."], ["To save power", false, "Not the reason."], ["To make it reversible", false, "Not needed."]] },
      ]},
      { k: "learn", title: "Memories and analog", b: [
        `<p><b>Memory BIST:</b> muxes on the address, data and control lines let a small state machine write a checkerboard, read it back, then the inverse. ROMs are read into a signature analyzer.</p>`,
        `<p>On-chip logic analyzers and oscilloscopes capture fast internal signals (supply noise, jitter). ADCs and DACs can be tested by <b>loopback</b>. Thinking ahead about what might go wrong: “defensive design”.</p>`,
      ]},
      { k: "learn", title: "IDDQ testing", b: [
        `<p>An idle static CMOS circuit draws almost no current. A bridging fault fights itself and draws a measurable static current for some inputs. So: apply a vector, wait, measure I<sub>DD</sub>. One current measurement observes every gate at once.</p>`,
        `<p>Catches: it's slow (~1 ms per vector), ratioed and analog circuits must be switched off, and in nanometer processes the normal leakage varies more than a fault adds.</p>`,
      ]},
      { k: "learn", title: "Design for manufacturability", b: [
        `<ul><li>Space wires further apart, enlarge overlaps at contacts, add redundant vias where there's room.</li><li>Add redundancy (spare rows and banks, configured by fuses).</li><li>Keep power down (electromigration, heat).</li><li>Centre the design in the process spread (corners, Monte Carlo).</li><li>Analyse yield: the Pentium's long thin poly lines had cracking silicide; widening or strapping them raised the yield at speed.</li></ul>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a test signature compress, and what is the risk in compressing it?", model: "It compresses the entire sequence of output values from thousands or millions of test cycles into one short word, so only that word must be read out and compared with the good chip's. The risk is aliasing: a faulty circuit could, by chance, produce the same signature as a good one. With enough signature bits and scrambling feedback that probability is very small." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Boundary scan, testing on a budget, and war stories", mins: 25,
    blurb: "JTAG for boards, FPGA-based testers for students, and real bugs that escaped smart engineers.",
    takeaway: "Board-level defects: opens/shorts in traces, bad solder joints; bed-of-nails testers historically; boot-time memory tests. Surface mount and complexity led to boundary scan (JTAG, IEEE 1149.1): all I/O pins of each IC on a serial chain through a Test Access Port (TAP); chips chained across the board; test interconnects by scanning values out of one chip and checking them at the next; also the standard access to internal scan and BIST. University testing: put test circuitry on chip (easier than on the board; can run at speed); boundary scan + BIST with a PC controller (e.g., 80 MHz); otherwise switches and LEDs, custom PCB, logic analyzer with pattern generator, or an FPGA board that drives and checks the chip (Figure 15.23). War stories: (1) a field hang after years: a long wire driven from both ends by logic believed identical; a circuit-understanding tool misjudged them and shadow-mode simulation never exercised the case; contention made X; fixed driver, software patch, weeks proving it only hung; lesson: formal equivalence of RTL and schematics. (2) A product failed after the process matured: later processors had all 8 cache banks enabled (earlier ones only 5 good), and simultaneous access caused IR droop through poor V_DD-plane contacts; misread memo about regulator bypassing; fix by disabling 3 banks in software; better power analysis. (3) Wasted spins: an obsolete “unused” layer merged documentation rectangles into active area (no field oxide, V_DD–GND short); a cache removed to speed verification never restored; check dataset size and inspect masks. (4) High-voltage roof: register-file write bitline coupling with a far-end weak keeper; noise checker waived; extra keeper near the driver. (5) Flying-saucer shmoo: dynamic select line pulled low by a neighbour plus many overlying bitlines at certain voltages; made the line static; noise tools should consider orthogonal neighbours. (6) Low-temperature failure: crosstalk drove a latch's diffusion input below −V_t; shipped with a bolt-on heater; enforce electrical rules with code. (7) Gate array 20% slow: power straps only at the edges; add vertical straps; power integrity analysis. Class chips: even-inverter ring oscillator never simulated; buggy simulator ignored; unverified pad routing (three of four designs wrong; shorted scan out; missing A[4] wire; swapped pads); with a known-good pad frame, top-level DRC and full-chip simulation, 100% success. Summary: scan is indispensable; rigorous testing ranks first among trade-offs.",
    steps: [
      { k: "learn", title: "Boundary scan (JTAG)", b: [
        `<p>Boards used to be tested with a “bed of nails” touching every trace. Surface-mount parts and dense boards made that impossible, so the industry agreed on <b>boundary scan</b> (JTAG, IEEE 1149.1): every I/O pin of every chip gets a scan cell, all chained through a standard <b>Test Access Port</b>. Scan a value out of one chip's output pins and check it arrives at the next chip's inputs: every board connection tested. The same port reaches each chip's internal scan and BIST.</p>`,
      ]},
      { k: "learn", title: "Testing on a student budget", b: [
        `<p>Put test circuitry on the chip, where you can simulate it and it runs at speed. With boundary scan and BIST, a PC-driven JTAG controller can test it. Otherwise, a board with a large <b>FPGA</b> can drive patterns into the chip and check the responses.</p>`,
      ]},
      { k: "why", title: "War stories", b: [
        `<p><b>A hang after years in the field.</b> A long wire was driven from both ends by logic believed to be identical. A tool misjudged them, and the verification never exercised the case where they differed, so the wire saw contention. Thirty engineers, months of work, a software patch. Lesson: formally prove that circuits match the RTL.</p>`,
        `<p><b>Fails only when the process gets better.</b> Late, mature chips had all 8 cache banks working (early ones had 5). Accessing all 8 at once caused an IR droop. Fix: disable 3 banks in software.</p>`,
        `<p><b>Wasted spins.</b> An “unused” documentation layer turned out to be the old number for active area, so a whole-chip rectangle became diffusion. Another chip shipped without its cache, removed to speed up verification and never put back.</p>`,
        `<p><b>Works only when hot.</b> Crosstalk drove a latch's diffusion input below −V<sub>t</sub>. Products shipped with a bolt-on heater until the fix arrived. Lesson: electrical rules are worthless unless code enforces them.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which lesson does each story teach?", bins: ["Formal verification", "Power integrity", "Check the final dataset", "Enforce rules with tools"], items: [
          ["Two drivers of one wire were assumed identical but weren't", 0, "Proving RTL ≡ schematics would have caught it."],
          ["A gate-array ASIC ran 20% slow because supply straps were only at the edges", 1, "IR drop: analyse the power grid."],
          ["A cache was left out of the taped-out database", 2, "Check dataset size, inspect the masks."],
          ["A noisy bus drove a latch's diffusion input", 3, "“No noisy diffusion inputs” must be checked by software."],
        ]},
      ]},
      { k: "learn", title: "Class-chip failures", b: [
        `<p>A ring oscillator with an even number of inverters (“too simple to simulate”). A chip taped out despite failing full-chip simulation. Hand-routed pad connections: three of four designs wrong (a shorted scan output, a missing wire, input and output pads swapped). Once the class used a known-good pad frame, top-level DRC and full-chip simulation: <b>100% success</b>.</p>`,
        `<p class="key">“If you don't test it, it won't work! (guaranteed).”</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does boundary scan let you test that internal scan alone does not?", model: "Internal scan tests the logic inside a chip. Boundary scan puts scan cells on every I/O pin and chains the chips on a board together, so you can drive values out of one chip's output pins and capture them at the next chip's input pins. That tests the board's traces and solder joints, which can't be probed directly on dense surface-mount boards, and it gives one standard port for reaching every chip's internal test features." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "vlsi15", eyebrow: "CMOS VLSI · Chapter 15", title: "Testing, Debugging, and Verification",
    intro: `<p>Nine parts: the three kinds of testing, logic verification, testers and test programs, silicon debug and shmoo plots, fault models, observability and fault coverage, scan, built-in self-test, and boundary scan, ending with real war stories.</p><p>The chapter's message: testing usually takes more effort than design, and it must be planned from the start. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises. Many ask you to explain a concept or choose a test strategy: answer in your own words first, naming what you'd control, what you'd observe, and what it costs, before looking anything up.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9],
    summary: `
      <h3>Kinds of test</h3>
      <p>Logic verification (before tapeout), silicon debug (first chips), manufacturing test (every chip). Faults cost 10× more at each later level.</p>
      <h3>Verification</h3>
      <p>Golden model, test benches, directed + random vectors, bottom-up regressions, version control, bug tracking. Exhaustive tests are impossible (2<sup>N+M</sup>).</p>
      <h3>Debug</h3>
      <p>Smoke test, peek/poke, one change at a time, probes, e-beam/LVP/PICA, FIB. Failures: manufacturing, functional, electrical. Shmoo patterns: wall, reverse speedpath, floor, finger.</p>
      <h3>Manufacturing test</h3>
      <p>Stuck-at, bridging, stuck-open (sequential), delay faults. Controllability and observability; fault coverage > 98.5%; ATPG. Scan chains; BIST (PRSG + signature); MBIST; IDDQ; DFM. Boundary scan (JTAG).</p>`,
  };
  Course.start(window.CHAPTER);
})();
