(function () {
  const { S, plot, slider, toggle, readout, fmt, el } = Course;
  const { wave } = Digital;
  const seenV = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const fig = (s) => `<div class="fig">${s}</div>`;
  const ps = (x) => Math.round(x) + " ps";

  /* ---------- widgets ---------- */
  function latchVsFlop(host) {
    const CLK = [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1];
    let D = [0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1];
    const out = el(`<div></div>`);
    const draw = () => {
      const L = [], F = []; let l = 0, f = 0;
      for (let t = 0; t < 16; t++) { if (CLK[t]) l = D[t]; if (t > 0 && CLK[t] && !CLK[t - 1]) f = D[t - 1]; L.push(l); F.push(f); }
      const asWave = (v) => v;
      out.innerHTML = fig(wave([{ name: "clk", v: CLK }, { name: "D", v: D }, { name: "Q latch", v: asWave(L), cls: "hl" }, { name: "Q flop", v: asWave(F), cls: "hl" }], { dx: 26, x0: 80 }));
    };
    const row = el(`<div class="row"></div>`);
    D.forEach((_, i) => { const b = el(`<button type="button" class="btn small">${i}</button>`); b.addEventListener("click", () => { D[i] = 1 - D[i]; draw(); }); row.append(b); });
    host.append(el(`<p class="aside">Click a slot number to flip D in that slot. Both outputs start at 0.</p>`), row, out); draw();
  }
  function tcCalc(host, id) {
    const tpd = 1000;
    let mode = 0, skew = 0;
    const out = el(`<div></div>`);
    const draw = () => {
      let tc, over, note;
      if (mode === 0) { over = 90 + 62 + skew; tc = tpd + over; note = "t<sub>pcq</sub> + t<sub>setup</sub> + t<sub>skew</sub> = 90 + 62 + " + skew; }
      else if (mode === 1) { over = Math.max(92, 82 + 40 - 150 + skew); tc = tpd + over; note = "max(t<sub>pdq</sub>, t<sub>pcq</sub> + t<sub>setup</sub> − t<sub>pw</sub> + t<sub>skew</sub>) = max(92, " + (82 + 40 - 150 + skew) + ")"; }
      else { over = 2 * 82; tc = tpd + over; note = "2t<sub>pdq</sub> = 2 × 82 (skew is hidden while the latches are transparent)"; }
      const W = 520, sc = (W - 20) / 1400;
      const bar = S.svg(W, 60, `<rect x="10" y="12" width="${tpd * sc}" height="30" rx="4" style="fill:var(--accent);opacity:.35"/><rect x="${10 + tpd * sc}" y="12" width="${over * sc}" height="30" rx="4" style="fill:var(--bad);opacity:.55"/>` + S.t(10 + (tpd * sc) / 2, 32, "logic 1000 ps", { cls: "s" }) + S.t(14 + (tpd + over) * sc, 32, "overhead " + over, { a: "start", cls: "s" }), { label: "Cycle time budget" });
      out.innerHTML = fig(bar) + readout([["Sequencing overhead", note + " = <b>" + ps(over) + "</b>"], ["Minimum cycle time T<sub>c</sub>", "<b>" + ps(tc) + "</b> (" + (1000 / tc).toFixed(2) + " GHz)"]]);
    };
    host.append(toggle(["Flip-flops", "Pulsed latches (t_pw 150)", "Two-phase latches"], (i) => { mode = i; draw(); }, 0), slider({ id: id + "-sk", label: "Clock skew", min: 0, max: 150, step: 5, value: 0, show: (x) => Math.round(x) + " ps" }, (x) => { skew = Math.round(x); draw(); }).el, out); draw();
  }
  function holdCheck(host) {
    let mode = 0, skew = 0, tcd = 45;
    const out = el(`<div></div>`);
    const draw = () => {
      const need = mode === 0 ? -10 - 75 + skew : 5 - 52 + 150 + skew;
      const ok = tcd >= need;
      out.innerHTML = readout([["Required t<sub>cd</sub> ≥", mode === 0 ? "t<sub>hold</sub> − t<sub>ccq</sub> + t<sub>skew</sub> = −10 − 75 + " + skew + " = <b>" + need + " ps</b>" : "t<sub>hold</sub> − t<sub>ccq</sub> + t<sub>pw</sub> + t<sub>skew</sub> = 5 − 52 + 150 + " + skew + " = <b>" + need + " ps</b>"], ["Path's t<sub>cd</sub>", tcd + " ps"], ["Result", ok ? "safe" : "<b>HOLD VIOLATION</b>: add " + (need - tcd) + " ps of delay"]]);
    };
    host.append(toggle(["Flip-flops", "Pulsed latches"], (i) => { mode = i; draw(); }, 0), slider({ id: "v10tcd", label: "Logic contamination delay t_cd", min: 0, max: 200, step: 5, value: tcd, show: (x) => Math.round(x) + " ps" }, (x) => { tcd = Math.round(x); draw(); }).el, slider({ id: "v10hs", label: "Clock skew", min: 0, max: 150, step: 5, value: 0, show: (x) => Math.round(x) + " ps" }, (x) => { skew = Math.round(x); draw(); }).el, out); draw();
  }
  function borrowWidget(host) {
    const a = 82 + 590, b = 82 + 410;
    const out = el(`<div></div>`);
    const draw = (Tc) => {
      const half = Tc / 2, borrow = Math.max(0, a - half), maxB = half - 40, ok = a + b <= Tc && borrow <= maxB;
      const W = 520, sc = (W - 20) / 2200;
      let s = `<rect x="10" y="10" width="${half * sc}" height="18" style="fill:var(--line);opacity:.6"/><rect x="${10 + half * sc}" y="10" width="${half * sc}" height="18" style="fill:var(--line);opacity:.3"/>` + S.t(10 + (half * sc) / 2, 24, "φ1 half", { cls: "s" }) + S.t(10 + 1.5 * half * sc, 24, "φ2 half", { cls: "s" });
      s += `<rect x="10" y="36" width="${a * sc}" height="22" rx="3" style="fill:var(--accent);opacity:.45"/><rect x="${10 + a * sc}" y="36" width="${b * sc}" height="22" rx="3" style="fill:var(--cool);opacity:.45"/>` + S.t(10 + (a * sc) / 2, 52, "latch + adder 672", { cls: "s" }) + S.t(10 + (a + b / 2) * sc, 52, "latch + rest 492", { cls: "s" });
      s += `<line x1="${10 + Tc * sc}" y1="4" x2="${10 + Tc * sc}" y2="64" style="stroke:var(--accent);stroke-width:2;stroke-dasharray:4 3"/>`;
      out.innerHTML = fig(S.svg(W, 70, s, { label: "Time borrowing across the half-cycle" })) + readout([["Nominal half-cycle T<sub>c</sub>/2", ps(half)], ["Borrowed from φ2", ps(borrow)], ["Max borrow T<sub>c</sub>/2 − t<sub>setup</sub>", ps(maxB)], ["Whole loop fits?", ok ? "yes" : "no: " + ps(a + b) + " > " + ps(Tc)]]);
    };
    host.append(slider({ id: "v10tc", label: "Cycle time T_c", min: 1000, max: 2200, step: 2, value: 1164, show: (x) => Math.round(x) + " ps" }, (x) => draw(Math.round(x))).el, out); draw(1164);
  }
  function metaWidget(host) {
    const ts = 54, T0 = 21;
    const out = el(`<div></div>`);
    const draw = (lg) => {
      const dt = Math.pow(10, lg), tdq = 290 - ts * Math.log(dt / 0.1);
      out.innerHTML = fig(plot({ x: [1, 6], y: [0, 500], xt: [1, 2, 3, 4, 5, 6], xtf: (v) => "10^" + (v - 4), yt: [0, 100, 200, 300, 400, 500], xl: "t_DC − t_m (ps, log scale)", yl: "t_DQ (ps)", h: 240, series: [{ f: (x) => Math.max(120, 290 - ts * Math.log(Math.pow(10, x - 4) / 0.1)), cls: "s1" }], marks: [{ x: lg + 4, y: Math.max(120, tdq), label: Math.round(Math.max(120, tdq)) + " ps", dy: -12 }], label: "Latch delay versus how close the data came to the critical time" })) +
        `<p>Every 10× closer to the critical instant adds τ<sub>s</sub>·ln 10 = ${Math.round(ts * Math.log(10))} ps of delay. Exactly at t<sub>m</sub>, the delay would be infinite; noise always tips it eventually.</p>`;
    };
    host.append(slider({ id: "v10m", label: "How close (log₁₀ ps)", min: -3, max: 2, step: 0.05, value: -1, show: (x) => fmt(Math.pow(10, x), 2) + " ps" }, draw).el, out); draw(-1);
  }
  function mtbfWidget(host) {
    const ts = 20e-12, T0 = 15e-12, N = 5e7;
    const out = el(`<div></div>`);
    const human = (s) => (s < 1 ? fmt(s * 1e3, 3) + " ms" : s < 3600 ? fmt(s, 3) + " s" : s < 172800 ? fmt(s / 3600, 3) + " hours" : s < 86400 * 300 ? fmt(s / 86400, 3) + " days" : s < 1e19 ? fmt(s / 3.15e7, 3) + " years" : "longer than the age of the universe");
    const draw = (tc) => {
      const m = (tc * 1e-12 * Math.exp((tc * 1e-12) / ts)) / (N * T0);
      out.innerHTML = fig(plot({ x: [300, 1000], y: [-10, 20], xt: [300, 400, 500, 600, 700, 800, 900, 1000], yt: [-10, -5, 0, 5, 10, 15, 20], ytf: (v) => "10^" + v, xl: "T_c (ps)", yl: "MTBF (s, log)", h: 240, series: [{ f: (x) => Math.log10((x * 1e-12 * Math.exp((x * 1e-12) / ts)) / (N * T0)), cls: "s1" }, { f: () => 7.5, cls: "s4" }], marks: [{ x: tc, y: Math.log10(m), label: human(m), dy: -12, a: tc > 800 ? "end" : "start" }], texts: [{ x: 310, y: 8.3, s: "1 year" }], label: "Synchronizer MTBF versus cycle time" })) +
        readout([["MTBF = T<sub>c</sub>e<sup>T<sub>c</sub>/τ<sub>s</sub></sup> / (N·T<sub>0</sub>)", human(m)]]);
    };
    host.append(slider({ id: "v10mt", label: "Clock period T_c", min: 300, max: 1000, step: 5, value: 625, show: (x) => Math.round(x) + " ps" }, (x) => draw(Math.round(x))).el, out); draw(625);
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Sequencing: tokens, latches and flops", mins: 20,
    blurb: "Latches and flip-flops aren't really for memory: they keep one token from catching the next. Three ways to do it.",
    takeaway: "Sequential circuits have state (FSMs, pipelines). Latches and flip-flops are sequencing elements: they hold tokens and keep the next token from catching up with the previous one; the delay they add to critical tokens is sequencing overhead. Static gates have no clock input; dynamic gates do. Sequencing elements themselves may be static (feedback) or dynamic (charge on a capacitor). The sequencing choice is tied to the design flow: cell libraries, timing analyzers, test generation. Latch: transparent while clk is high, opaque while low. Flip-flop: copies D to Q on the rising edge. Three methods: flip-flops (one per cycle boundary; early tokens wait), two-phase transparent latches φ1/φ2 (half-cycles; at least one latch is opaque at any time, like a canal lock; optional nonoverlap), pulsed latches (one latch per cycle with a brief pulse t_pw shorter than the logic delay). An ideal method: no overhead, back-to-back elements OK, flexible balancing, skew-tolerant, zero area and power. Notation (Table 10.1): t_pd, t_cd (logic propagation/contamination), t_pcq, t_ccq (clock-to-Q), t_pdq, t_cdq (latch D-to-Q), t_setup, t_hold. A flop samples D in a window around the rising edge; a latch must set up and hold around the falling edge, and while transparent Q follows D after t_pdq.",
    steps: [
      { k: "learn", title: "What sequencing elements are for", b: [
        `<p>Think of data moving through logic as <b>tokens</b>. Without something to hold them apart, a fast token could catch up with a slow one and garble both.</p>`,
        `<p>Latches and flip-flops are <b>sequencing elements</b>: they hold early tokens back. The delay they add is <b>sequencing overhead</b>, which comes straight out of the time left for logic.</p>`,
        seenV("Latches, flip-flops and their timing.", "../hh/03-sequential-logic.html", "Harris & Harris Ch 3"),
      ]},
      { k: "play", title: "Latch versus flop", b: [
        `<p>The latch passes D while clk is high and holds it while clk is low. The flop only copies D at each rising edge. Before you flip bits: where will they differ?</p>`,
        latchVsFlop,
      ]},
      { k: "learn", title: "Three methods", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>Flip-flops</b></td><td>One per cycle boundary. A token that arrives early waits for the edge.</td></tr>
          <tr><td><b>Two-phase latches</b></td><td>A flop split into its two latches, φ1 and φ2, with logic in between. At any moment one of them is opaque, like the two gates of a canal lock.</td></tr>
          <tr><td><b>Pulsed latches</b></td><td>One latch per cycle, opened by a brief pulse t<sub>pw</sub>. If the pulse is shorter than the logic delay, a token advances only one stage per pulse.</td></tr></tbody></table></div>`,
      ]},
      { k: "learn", title: "The notation", b: [
        `<div class="tbl"><table><tbody><tr><td>t<sub>pd</sub>, t<sub>cd</sub></td><td>logic propagation (slowest) and contamination (fastest) delay</td></tr><tr><td>t<sub>pcq</sub>, t<sub>ccq</sub></td><td>clock-to-Q, slowest and fastest</td></tr><tr><td>t<sub>pdq</sub>, t<sub>cdq</sub></td><td>latch D-to-Q while transparent</td></tr><tr><td>t<sub>setup</sub>, t<sub>hold</sub></td><td>D must be stable this long before / after the sampling edge</td></tr></tbody></table></div>`,
        `<p>A flop samples at the <b>rising</b> edge. A latch samples at the <b>falling</b> edge, when it becomes opaque.</p>`,
      ]},
      { k: "check", title: "Quick check", b: [
        { t: "mcq", q: "Why can't t_cd be ignored the way designers ignore most fast paths?", opts: [["A fast path can let new data reach the next element before it has finished sampling the old data", true, "That's a hold (min-delay) failure, coming up in Part 3."], ["Fast paths waste power", false, "That's not why it matters for timing."], ["t_cd sets the clock frequency", false, "t_pd does."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a sequencing element do, and what is sequencing overhead?", model: "It holds back tokens that arrive early so that each token stays in its own cycle, and it prevents the next token from catching up with or corrupting the current one. Sequencing overhead is the delay the element itself adds to the critical path, such as clock-to-Q delay and setup time, which reduces the time left for useful logic in each cycle." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Max-delay: how fast can the clock go?", mins: 20,
    blurb: "Setup-time failures are fixed by slowing the clock. Each sequencing method has its own overhead. Worked on the Itanium 2 ALU bypass path.",
    takeaway: "Setup (max-delay) failure: logic too slow, receiver samples the wrong value; fix by faster logic or a longer cycle. Flip-flops: T_c ≥ t_pcq + t_pd + t_setup (EQ 10.1); t_pd ≤ T_c − (t_setup + t_pcq). Two-phase latches: T_c ≥ t_pdq1 + t_pd1 + t_pdq2 + t_pd2 (EQ 10.3), overhead 2t_pdq; nonoverlap doesn't hurt because logic keeps computing while both clocks are low. Pulsed latches: T_c ≥ max(t_pdq + t_pd, t_pcq + t_pd + t_setup − t_pw) (EQ 10.5); overhead is one latch delay if the pulse hides the setup time. Example 10.1 (Itanium 2 ALU self-bypass, static hypothetical): adder 590 + result mux 60 + middle bypass 80 + late bypass 70 + two 2-mm wires 100 each = t_pd 1000 ps; flops t_setup 62, t_hold −10, t_pcq 90, t_ccq 75 → T_c ≥ 1152 ps. Example 10.2: pulsed latch t_pw 150, t_setup 40, t_hold 5, t_pcq 82, t_ccq 52, t_pdq 92 → T_c ≥ 1092 ps.",
    steps: [
      { k: "learn", title: "Flip-flop to flip-flop", b: [
        `<p>The data leaves F1 at t<sub>pcq</sub> after the edge, crosses the logic in t<sub>pd</sub>, and must arrive t<sub>setup</sub> before the next edge:</p>`,
        `<p class="eq">T<sub>c</sub> ≥ t<sub>pcq</sub> + t<sub>pd</sub> + t<sub>setup</sub></p>`,
        `<p>Miss it and you have a <b>setup (max-delay) failure</b>. The cure: slow the clock, or speed up the logic.</p>`,
      ]},
      { k: "learn", title: "Latches and pulsed latches", b: [
        `<p class="eq">Two-phase latches: T<sub>c</sub> ≥ t<sub>pd</sub> + 2t<sub>pdq</sub></p>`,
        `<p>Data flows through transparent latches, so their setup times aren't in the path, only their D-to-Q delays. Nonoverlap doesn't cost anything: the logic keeps working while both clocks are low.</p>`,
        `<p class="eq">Pulsed latches: T<sub>c</sub> ≥ max(t<sub>pdq</sub> + t<sub>pd</sub>, t<sub>pcq</sub> + t<sub>pd</sub> + t<sub>setup</sub> − t<sub>pw</sub>)</p>`,
        `<p>If the pulse is wider than the setup time, only one latch delay is overhead.</p>`,
      ]},
      { k: "learn", title: "The ALU self-bypass path", b: [
        `<p>Example 10.1: an Itanium 2 ALU result is muxed and bypassed back to the ALU inputs for the next instruction. Critical path:</p>`,
        `<div class="tbl"><table><tbody><tr><td>Adder</td><td>590 ps</td></tr><tr><td>Result mux</td><td>60</td></tr><tr><td>Middle bypass mux</td><td>80</td></tr><tr><td>Late bypass mux</td><td>70</td></tr><tr><td>Two 2-mm wires</td><td>2 × 100</td></tr><tr><td><b>t<sub>pd</sub></b></td><td><b>1000 ps</b></td></tr></tbody></table></div>`,
      ]},
      { k: "play", title: "Choose a method", b: [
        `<p>Flops: t<sub>pcq</sub> = 90, t<sub>setup</sub> = 62. Pulsed latches: t<sub>pdq</sub> = 92, t<sub>pcq</sub> = 82, t<sub>setup</sub> = 40, t<sub>pw</sub> = 150. Two-phase latches: t<sub>pdq</sub> = 82. Ignore the skew slider until Part 5.</p>`,
        tcCalc,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A pulsed latch has t_pdq = 70 ps, t_pcq = 60 ps, t_setup = 50 ps and a 30 ps pulse. Logic t_pd = 800 ps. Minimum T_c in ps?", a: 880, tol: 0.005, why: "max(70 + 800, 60 + 800 + 50 − 30) = max(870, 880) = 880 ps. The pulse is narrower than the setup time, so the second term wins." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the sequencing overhead of two-phase latches 2t_pdq rather than t_pcq + t_setup?", model: "In a latch-based system data normally arrives while the latch is transparent, so it simply flows through with a D-to-Q delay. It doesn't wait for a clock edge, and the setup time only matters if data arrives near the falling edge. A cycle contains two latches, so the overhead is two D-to-Q delays." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Min-delay: races and hold times", mins: 20,
    blurb: "If data races through two elements on one edge, the chip is broken at any clock speed. Pulsed latches are the most exposed.",
    takeaway: "Race / hold-time / min-delay failure: with large hold time and small contamination delay, data passes two elements on one edge and corrupts state. Can't be fixed by slowing the clock, only by redesign, so be conservative. Flip-flops: t_cd ≥ t_hold − t_ccq (EQ 10.7). If t_ccq > t_hold, back-to-back flops are safe; otherwise add buffers or use slow flops (scan chains are back-to-back flops). Two-phase latches: t_cd1, t_cd2 ≥ t_hold − t_ccq − t_nonoverlap (EQ 10.8) in each half-cycle; large nonoverlap removes hold failures, but nonoverlapping clocks are hard at speed, so commercial latch designs use clk and its complement (nonoverlap 0). Paradox: latches need the constraint in each half-cycle, flops only once, yet a flop is two latches; resolved because the flop has an internal race that must be designed carefully. Pulsed latches: t_cd ≥ t_hold − t_ccq + t_pw (EQ 10.9): the pulse width adds to the hold time. Example 10.3: imm path to late bypass mux t_cd = 45 ps with flops (t_hold −10, t_ccq 75): fine. Example 10.4: pulsed latches (t_pw 150, t_hold 5, t_ccq 52): badly violated; add ≥ 58 ps of buffering or use a flip-flop for imm (or a flop with t_ccq > 110 ps).",
    steps: [
      { k: "learn", title: "The race", b: [
        `<p>On a clock edge, F1 launches new data. F2 is sampling its old data on the same edge. If the new data arrives at F2 before F2's hold time is over, F2 captures the wrong (new) value: a <b>hold-time failure</b>.</p>`,
        `<p class="eq">t<sub>cd</sub> ≥ t<sub>hold</sub> − t<sub>ccq</sub></p>`,
        `<p class="key"><b>Slowing the clock does not help.</b> Both events happen on the same edge. A hold failure in silicon means a new mask set.</p>`,
      ]},
      { k: "check", title: "Predict", b: [
        { t: "mcq", q: "A flop has t_ccq = 60 ps and t_hold = 20 ps. Can two of them sit back-to-back with no logic between (a shift register)?", opts: [["Yes: t_cd = 0 ≥ 20 − 60 = −40", true, "When t_ccq exceeds t_hold, back-to-back is safe."], ["No: there's no logic to delay the data", false, "The flop's own clock-to-Q delay protects it."], ["Only at low frequency", false, "Hold has nothing to do with frequency."]] },
      ]},
      { k: "learn", title: "Latches and pulsed latches", b: [
        `<p class="eq">Two-phase latches: t<sub>cd1</sub>, t<sub>cd2</sub> ≥ t<sub>hold</sub> − t<sub>ccq</sub> − t<sub>nonoverlap</sub></p>`,
        `<p>In <b>each</b> half-cycle. A big nonoverlap gap makes hold failures impossible: that's why class projects use two nonoverlapping clocks. Fast commercial chips use clk and its complement instead (nonoverlap = 0).</p>`,
        `<p class="eq">Pulsed latches: t<sub>cd</sub> ≥ t<sub>hold</sub> − t<sub>ccq</sub> + t<sub>pw</sub></p>`,
        `<p>The latch stays open for the whole pulse, so the pulse width adds straight to the hold time.</p>`,
      ]},
      { k: "play", title: "Check the imm path", b: [
        `<p>The fastest input to the late bypass mux is the immediate operand from another register: t<sub>cd</sub> = 45 ps.</p>`,
        holdCheck,
      ]},
      { k: "check", title: "The paradox", b: [
        { t: "mcq", q: "Latch systems need the hold constraint in each half-cycle, but a flop (two latches) needs it only once per cycle. How?", opts: [["The flop contains its own internal race between its two latches, which its designer handled carefully", true, "The burden moves inside the cell."], ["Flops don't have hold times", false, "They do."], ["Latches are faster", false, "That doesn't resolve it."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why are pulsed latches especially prone to hold-time failures, and how can you fix one?", model: "A pulsed latch stays transparent for the whole pulse, so new data launched at the start of the pulse must not reach the next latch until after the pulse ends; the pulse width adds to the hold time. Fixes: add delay, such as buffers, on the short path, or use a flip-flop for the element launching the short path, possibly a slow flop with a long contamination delay." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Time borrowing", mins: 20,
    blurb: "Transparent latches let a slow half-cycle borrow from the next. But a loop still has to fit in its cycle.",
    takeaway: "Flip-flops impose a hard edge: late data fails, early data waits and the rest of the cycle is wasted. Transparent latches let data depart on φ1 rising and set up only before the receiving latch closes, so one half-cycle (or stage) can borrow time from the next; borrowing can accumulate, but loops must balance. Most critical paths are self-bypass loops. Maximum borrow (two-phase): t_borrow ≤ T_c/2 − (t_setup + t_nonoverlap) (EQ 10.10). Example 10.5 (mid-cycle φ2 latch after the adder; latches t_setup 40, t_hold 5, t_pcq 82, t_ccq 52, t_pdq 82): T_c = 82 + 590 + 82 + 410 = 1164 ps; first half 82 + 590 = 672 vs nominal 582 → borrows 90 ps; at T_c = 2000 ps no borrowing. Pulsed latches can borrow t_borrow ≤ t_pw − t_setup (EQ 10.11). Example 10.6: in a feedback loop, borrowing doesn't add time: late outputs start the next cycle late. Benefits: intentional borrowing (balance logic during circuit design, not microarchitecture) and opportunistic borrowing (averages out variation and model error). Some managers forbid intentional borrowing until near tapeout, or run full-chip timing early, because if everyone assumes they can borrow, every path ends up too long.",
    steps: [
      { k: "learn", title: "Hard edges and soft edges", b: [
        `<p>A flop is a <b>hard edge</b>: data that arrives early waits (time wasted); data that arrives late fails.</p>`,
        `<p>A transparent latch is a <b>soft edge</b>: data can arrive any time the latch is open and flow straight through. A half-cycle that needs more time can <b>borrow</b> it from the next.</p>`,
        `<p class="eq">t<sub>borrow</sub> ≤ T<sub>c</sub>/2 − (t<sub>setup</sub> + t<sub>nonoverlap</sub>)</p>`,
      ]},
      { k: "play", title: "Example 10.5", b: [
        `<p>The bypass path with a φ2 latch after the adder. First half: latch + adder = 672 ps. Second half: latch + the rest (410 ps) = 492 ps. Predict the borrow at T<sub>c</sub> = 1164 ps, then move T<sub>c</sub>.</p>`,
        borrowWidget,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Same path at T_c = 1300 ps. How much time (ps) does the first half borrow?", a: 22, tol: 0.01, why: "Nominal half-cycle 650 ps; the first half needs 672 ps, so it borrows 22 ps." },
      ]},
      { k: "check", title: "Loops", b: [
        { t: "mcq", q: "Example 10.6: with pulsed latches, how much extra time can the ALU self-bypass loop borrow from the next cycle?", opts: [["None", true, "If the result arrives late, the next ALU operation starts late, and so on. A loop must fit in its cycle; borrowing only balances work inside it."], ["t_pw − t_setup", false, "That's the maximum for a pipeline path, not a loop."], ["Half a cycle", false, "That's two-phase latches between half-cycles."]] },
      ]},
      { k: "why", title: "A management lesson", b: [
        `<p>Borrowing helps two ways: <b>intentional</b> (balance logic without changing the microarchitecture) and <b>opportunistic</b> (slow stages on real silicon steal from fast ones). But if every designer assumes they can borrow from their neighbor, every path grows, and the problem appears only at full-chip timing, too late. Some managers forbid intentional borrowing until near tapeout.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can time borrowing balance a pipeline but not make a feedback loop faster?", model: "Borrowing lets one stage finish late by using time from the next stage, which is fine if the next stage has slack. In a loop, the late result is needed by the same logic in the next cycle, so the next cycle also starts late, and the lateness accumulates. The total loop delay must still fit in one cycle; borrowing only redistributes time inside it." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Clock skew and the scorecard", mins: 20,
    blurb: "Skew costs flops on both max- and min-delay. Latches hide it on max-delay. One table compares all three methods.",
    takeaway: "Skew: uncertainty in clock arrival. Flip-flops, worst max-delay case = launch late, capture early: t_pd ≤ T_c − (t_pcq + t_setup + t_skew) (EQ 10.12); worst min-delay = launch early, capture late: t_cd ≥ t_hold − t_ccq + t_skew (EQ 10.13). Transparent latches are skew-tolerant for max-delay: t_pd ≤ T_c − 2t_pdq (EQ 10.14), but skew adds to hold, t_cd ≥ t_hold − t_ccq − t_nonoverlap + t_skew (EQ 10.15), and reduces borrowing, t_borrow ≤ T_c/2 − (t_setup + t_nonoverlap + t_skew) (EQ 10.16). Pulsed latches tolerate skew up to about the pulse width: overhead max(t_pdq, t_pcq + t_setup − t_pw + t_skew) (EQ 10.17), t_cd ≥ t_hold + t_pw − t_ccq + t_skew (10.18), t_borrow ≤ t_pw − (t_setup + t_skew) (10.19). Example 10.7: 50 ps skew raises the flop-based ALU path to 1202 ps; max skew before hold failure = t_cd − t_hold + t_ccq = 45 + 10 + 75 = 130 ps. Different skew can be budgeted for min and max checks; nearby elements see less skew; place-and-route tools insert clock buffers to reduce it. Table 10.4 summarizes overhead, minimum logic delay and borrowing. Flops: simplest, most overhead, best CAD support. Latches: most skew-tolerant and most borrowing, more design effort (rare today). Pulsed latches: least overhead, worst hold problems.",
    steps: [
      { k: "learn", title: "Skew hurts flops twice", b: [
        `<div class="two"><div class="tile"><h3>Max-delay</h3><p>Worst case: launching flop clocked late, capturing flop early. <b>Subtract t<sub>skew</sub></b> from the cycle.</p></div><div class="tile"><h3>Min-delay</h3><p>Worst case: launch early, capture late. <b>Add t<sub>skew</sub></b> to the hold time.</p></div></div>`,
      ]},
      { k: "play", title: "Add skew", b: [
        `<p>Go back to the calculator and drag the skew. Watch which methods pay.</p>`,
        tcCalc,
        `<p class="aside">Latches hide skew on max-delay because data arrives while they are already open. Pulsed latches hide it until it eats through the pulse width.</p>`,
      ]},
      { k: "check", title: "Example 10.7", b: [
        { t: "num", q: "Flop-based ALU path (t_hold = −10, t_ccq = 75, imm path t_cd = 45 ps). How much skew (ps) before hold failures appear?", a: 130, tol: 0.01, why: "t_skew ≤ t_cd − t_hold + t_ccq = 45 + 10 + 75 = 130 ps, at any clock frequency." },
      ]},
      { k: "learn", title: "The scorecard (Table 10.4)", b: [
        `<div class="tbl"><table><thead><tr><th></th><th>Overhead</th><th>Min t<sub>cd</sub></th><th>Borrowing</th></tr></thead><tbody>
          <tr><td>Flip-flops</td><td>t<sub>pcq</sub> + t<sub>setup</sub> + t<sub>skew</sub></td><td>t<sub>hold</sub> − t<sub>ccq</sub> + t<sub>skew</sub></td><td>0</td></tr>
          <tr><td>2-phase latches</td><td>2t<sub>pdq</sub></td><td>t<sub>hold</sub> − t<sub>ccq</sub> − t<sub>no</sub> + t<sub>skew</sub> (each half)</td><td>T<sub>c</sub>/2 − (t<sub>setup</sub> + t<sub>no</sub> + t<sub>skew</sub>)</td></tr>
          <tr><td>Pulsed latches</td><td>max(t<sub>pdq</sub>, t<sub>pcq</sub> + t<sub>setup</sub> − t<sub>pw</sub> + t<sub>skew</sub>)</td><td>t<sub>hold</sub> − t<sub>ccq</sub> + t<sub>pw</sub> + t<sub>skew</sub></td><td>t<sub>pw</sub> − (t<sub>setup</sub> + t<sub>skew</sub>)</td></tr></tbody></table></div>`,
      ]},
      { k: "check", title: "Pick one", b: [
        { t: "sort", q: "Which method fits best?", bins: ["Flip-flops", "Two-phase latches", "Pulsed latches"], items: [
          ["An ASIC built with standard synthesis and timing tools, not at the speed limit", 0, "Simple, well understood, best CAD support."],
          ["A class project with no clock-skew analysis, using two off-chip nonoverlapping clocks", 1, "Big nonoverlap guarantees no hold failures."],
          ["A high-end CPU squeezing every picosecond, willing to manage hold times", 2, "Lowest overhead (Itanium 2, Pentium 4, Athlon)."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why are transparent-latch systems called skew-tolerant, and where does skew still hurt them?", model: "On long paths the data arrives at each latch while it is already transparent, after even the latest skewed clock edge, so it flows through and the skew doesn't add to the cycle time. But skew still adds to the hold-time requirement in each half-cycle and reduces how much time can be borrowed." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Latch and flip-flop circuits", mins: 25,
    blurb: "From a one-transistor latch to the robust standard-cell latch, one fix at a time. Then flip-flops and their internal race.",
    takeaway: "Figure 10.17: (a) single nMOS pass transistor: compact, fast, but no rail-to-rail output (V_DD − V_t), dynamic (floats, leaks), diffusion input (noise, hard to time), exposed state node. (b) transmission gate: rail-to-rail; needs φ̄ (input or local inverter). (c) adds output inverter: state node X isolated (inverting latch). (d) input inverter + TG: buffered input, unbuffered output; inverter + TG ≈ tristate with slightly lower logical effort. (c) and (d) are fast dynamic latches; leakage means practical latches must be staticized: (e) feedback tristate holds X while opaque; (f) adds input inverter; both reintroduce output noise back-driving X. (g) robust latch: static, rail-to-rail, state isolated from output noise, input drives gates: Artisan standard cell; recommended except for the most critical designs. (h) inverting datapath latch (Intel), faster and smaller, input noise controlled. (i) jamb latch: weak feedback inverter replaces tristate, less clock load, must be overpowered in all corners. (j) register-file/FPGA jamb latch with RD onto shared Dout. (k) Itanium 2 latch: clocked pulldown, weak pMOS pullup; driver must overcome feedback. C²MOS (clocked tristate) is slightly smaller (fewer contacts) but slightly slower; swapping data and clock terminals is electrically inferior (charge sharing). Swap φ and φ̄ for active-low latches. Flip-flops (Figure 10.19): dynamic inverting flop from two dynamic latches; static noninverting flop with feedback (PowerPC 603; most standard cell libraries: simple, robust, compact, energy-efficient). Flops take one clock and generate φ̄ locally; slow edges make both latches transparent (hold time grows), so libraries buffer the clock, but clock load has activity 1 and dominates flop power. Internal race: the clock inverter delay can leave both clocks low, turning on both TG pMOS, so data sneaks through on the falling edge; C²MOS/NORA flops avoid this (data passes nMOS of one latch and pMOS of the other) but still fail with very slow edges; practice: control the clock inverter delay. Two-phase nonoverlapping-clock flop (Figure 10.21): robust for class projects, but nonoverlap adds to setup time and overhead.",
    steps: [
      { k: "learn", title: "Start with one transistor", b: [
        `<p>An nMOS pass transistor clocked by φ is a latch. Four problems:</p>`,
        `<ul><li>Output only reaches V<sub>DD</sub> − V<sub>t</sub>.</li><li>When opaque, the output <b>floats</b> and leaks away (dynamic).</li><li>D drives a <b>diffusion</b> input: noise-prone, hard to time.</li><li>The state node is the output: noise on Q corrupts the state.</li></ul>`,
        seenV("Threshold drops, leakage and diffusion-input noise.", "09-combinational.html", "Chapter 9"),
      ]},
      { k: "learn", title: "Fix them one at a time", b: [
        `<div class="tbl"><table><tbody>
          <tr><td>(b)</td><td>Transmission gate</td><td>full rail-to-rail swing (needs φ̄)</td></tr>
          <tr><td>(c)</td><td>+ output inverter</td><td>state node isolated from output noise</td></tr>
          <tr><td>(d)</td><td>input inverter + TG</td><td>input drives a gate, not diffusion</td></tr>
          <tr><td>(e)</td><td>+ feedback tristate</td><td><b>static</b>: holds X when opaque</td></tr>
          <tr><td>(g)</td><td>input inverter, TG, feedback, output inverter</td><td><b>all four problems fixed</b>: the standard-cell latch</td></tr></tbody></table></div>`,
        `<p>(e) and (f) are static but let output noise back-drive X through the feedback. (g) fixes that with a separate output inverter.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which problem does each change fix?", bins: ["Rail-to-rail", "Leakage (static)", "Input noise", "Output noise"], items: [
          ["Replace the nMOS with a transmission gate", 0, "pMOS passes the 1 fully."],
          ["Add a clocked feedback tristate", 1, "It holds the state node while the latch is opaque."],
          ["Put an inverter before the transmission gate", 2, "The input now drives transistor gates."],
          ["Drive Q from its own inverter, separate from the feedback loop", 3, "Noise on Q can't reach the state node."],
        ]},
      ]},
      { k: "learn", title: "Variants used in real chips", b: [
        `<ul><li><b>(h)</b> Inverting datapath latch (Intel): faster and smaller when input noise is controlled.</li><li><b>(i) Jamb latch:</b> a weak feedback inverter instead of a tristate: less clock load, but it must lose the fight in every corner.</li><li><b>(k)</b> Itanium 2: clocked pull-down, weak pMOS pull-up; the driver must overpower the feedback.</li><li><b>C²MOS:</b> a clocked tristate. Slightly smaller, slightly slower. Don't swap its data and clock transistors: charge sharing.</li></ul>`,
      ]},
      { k: "learn", title: "Flip-flops and their internal race", b: [
        `<p>Two latches back to back on φ and φ̄ (Figure 10.19). The static version is in most standard-cell libraries: simple, robust, compact, energy-efficient.</p>`,
        `<p>The danger: φ̄ comes from a local inverter, so it's late. When φ falls, both clocks are briefly <b>low</b>, both transmission-gate pMOS are on, and data can sneak straight through both latches.</p>`,
        `<p>C²MOS flops pass data through the nMOS of one latch and the pMOS of the other, so that overlap is harmless (only very slow edges hurt). In practice designers simply control the inverter delay.</p>`,
      ]},
      { k: "check", title: "Predict", b: [
        { t: "mcq", q: "The global clock arrives with a very slow edge. What happens inside an ordinary flop?", opts: [["Both latches are partly on at once, so the hold time grows (risk of a race)", true, "That's why libraries buffer the clock inside the cell or in a local buffer."], ["It just switches later", false, "Both clock and its complement sit at intermediate voltages together."], ["Nothing: flops are edge-triggered", false, "The edge is made of two level-sensitive latches."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What makes the latch of Figure 10.17(g) robust?", model: "It is static, because a feedback tristate holds the state node while the latch is opaque, so leakage can't erase it. All nodes swing rail to rail because it uses transmission gates. The input drives transistor gates through an inverter rather than diffusion, and the output comes from a separate inverter, so noise on the output can't flow back into the state node." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Pulsed, resettable, enabled and special flops", mins: 25,
    blurb: "Pulse generators, reset and enable, logic folded into latches, and a tour of fast, differential, dual-edge and radiation-hard designs.",
    takeaway: "Pulsed latch = ordinary latch + clock chopper (one-shot): one latch (fast), time borrowing, possibly less energy (share the generator), but long hold time. Naffziger pulsed latch (Itanium 2): latch 10.17(k), pulse ~1/6 cycle (125 ps at 1.2 GHz), enable must set up and hold around the rising edge; quad-core Itanium selects 1- or 3-inverter pulse chains by software. Short pulses are risky: simulate across corners and RC loads. Partovi pulsed latch (AMD K6, Athlon) builds the pulse generator in (was called edge-triggered latch). Reset: synchronous (AND D with reset, setup/hold around the clock) vs asynchronous (gate data and feedback, acts immediately; tristate NAND = NAND + clocked TG); set uses NOR. Enable: input mux (adds area and delay) or clock gating (no D delay, shareable AND, saves power, but adds skew; en must be stable while clk high). Logic in latches: Alpha 21164 latches = clocked TG between static gates; mux-latch: TGs with select-gated clocks (no extra D-to-Q delay; high select setup time). Klass SDFF: dynamic NAND front end (master) + static slave; rising inputs may arrive slightly after the edge, falling must set up before; slightly faster than Partovi but no skew tolerance or borrowing, high energy; UltraSparc III and Cell built logic into it. Differential sense-amplifier flop (Alpha 21264; StrongArm adds a weak nMOS to staticize): accepts small differential inputs (bitlines, low-swing buses), small clock load, larger and more energy; slave SR latch is slow. AMD K6 self-resetting dual-rail flop. Dual-edge-triggered: half frequency, double activity: flop energy unchanged, clock network energy halved; duty-cycle skew and CAD changes make net savings small; not widely used; Zhao implicitly pulsed DET has a severe ratio constraint. Radiation hardening: big storage node, TMR voting, DICE latch (quad-core Itanium: two orders of magnitude fewer soft errors, no delay penalty, +34% area, +25% power; still vulnerable to two-node strikes).",
    steps: [
      { k: "learn", title: "Pulsed latches", b: [
        `<p>Take an ordinary latch and clock it with a short pulse from a <b>clock chopper</b>: φ AND a delayed, inverted φ. One latch instead of two: faster, some borrowing, less clock energy. Cost: a long hold time.</p>`,
        `<p>Itanium 2's pulses were about 1/6 of the cycle (125 ps at 1.2 GHz). The quad-core Itanium could pick a wider pulse by software to fix problems found after fabrication.</p>`,
      ]},
      { k: "check", title: "Predict", b: [
        { t: "mcq", q: "The pulse width is made programmable. Making it wider gives…", opts: [["more robustness and borrowing, but a longer hold time", true, "Exactly the trade-off the book describes."], ["a shorter hold time", false, "The latch stays open longer."], ["less skew tolerance", false, "More, actually."]] },
      ]},
      { k: "learn", title: "Reset and enable", b: [
        `<div class="two"><div class="tile"><h3>Synchronous reset</h3><p>AND D with reset. Waits for the clock; needs setup and hold.</p></div><div class="tile"><h3>Asynchronous reset</h3><p>Gates both data and feedback (tristate NAND). Acts at once.</p></div></div>`,
        `<div class="two"><div class="tile"><h3>Enable by mux</h3><p>Feed back the old state. Costs area and D-to-Q delay.</p></div><div class="tile"><h3>Enable by clock gating</h3><p>AND the clock with en. No data delay, saves power, but adds clock skew; en must be stable while clk is high.</p></div></div>`,
      ]},
      { k: "learn", title: "Fold logic into the latch", b: [
        `<p>Replace the latch's inverters with useful gates (Alpha 21164), or build a <b>mux-latch</b> from two transmission gates whose clocks are gated by the selects: a mux with no extra D-to-Q delay.</p>`,
      ]},
      { k: "learn", title: "A tour of special flops", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>Klass SDFF</b></td><td>Dynamic NAND master + static slave. Fast; no skew tolerance; high energy.</td></tr>
          <tr><td><b>Sense-amp flop</b></td><td>Responds to small differential inputs (bitlines, low-swing buses). Alpha 21264.</td></tr>
          <tr><td><b>Dual-edge</b></td><td>Half the clock rate, twice the activity: the flop's energy is unchanged; only the clock network saves. Duty-cycle skew eats the gain. Rarely used.</td></tr>
          <tr><td><b>Radiation-hardened (DICE)</b></td><td>Four interlocked state nodes: one upset gets corrected. 100× fewer soft errors, +34% area, +25% power.</td></tr></tbody></table></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why doesn't a dual-edge flop save much energy overall?", opts: [["Each flop still toggles as often per data bit, and most clock energy is in the registers, not the distribution network", true, "Plus duty-cycle variation adds skew that costs delay."], ["It needs twice as many transistors", false, "Overhead exists, but that's not the main reason."], ["It can't run at half frequency", false, "That's the point of it."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Compare enabling a flip-flop with an input multiplexer versus clock gating.", model: "The multiplexer feeds the old output back to D when disabled. It's simple and safe for timing but adds area and delay on the data path, and the clock keeps toggling. Clock gating ANDs the clock with the enable so a disabled flop gets no clock: no data-path delay, the gate can be shared, and it saves a lot of power. But it delays the clock, adding skew, and the enable must be stable while the clock is high to avoid glitches." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Methodology and characterizing elements", mins: 25,
    blurb: "Static, scannable, one clock per region. How setup, hold and clock-to-Q are really defined, and how to trade them.",
    takeaway: "Modern designs need static sequencing elements (clock gating, slow test, burn-in leakage); Alpha 21164 (0.35 µm) was among the last dynamic-latch designs, with a 1/10-speed minimum frequency. Scan (Section 15.6.2) chains elements into a shift register for test and debug; most methodologies require it (Alpha 21264 lacked full scan and was hard to debug). Distribute one high-speed clock per region; generate complements, pulses and delayed clocks locally; buffer locally to sharpen edges. Clock power is 1/3–1/2 of chip power; gate clocks to idle units. State nodes need enough capacitance for low soft-error rates. Choice: flops (simple, ASIC flows); pulsed latches (faster, some borrowing, long hold; model as a fast flop with a lousy hold time; Itanium 2 clocked deracers on short paths); transparent latches (nearly half a cycle of borrowing; place latches nominally at the start of each half-cycle; signals classed φ1/φ2). Characterizing (Figure 10.35, FO4 units): t_CQ rises as data arrives close to the edge; t_DQ = t_DC + t_CQ has a minimum where dt_CQ/dt_DC = −1; define t_setup there (1.03 FO4) and t_pcq = t_CQ there (2.31); t_ccq = minimum t_CQ (2.17); hold = minimum clock-to-D-change time with t_CQ ≤ t_pcq; hold times are typically negative; quote the worse of 0/1. Aperture: t_ar = t_setup1 + t_hold0, t_af = t_setup0 + t_hold1; changing in the aperture risks metastability; minimum pulse widths. Latch (Figure 10.37, t_pw 4 FO4): setup measured to the falling edge, chosen ~5% above minimum t_DQ (t_pdq 1.66, t_ccq 1.36); hold = −t_DCf with negligible glitch. Pulsed latch as virtual flop: t_setup,virtual = t_setup − t_pw = −2.4 FO4, t_pcq,virtual = t_pdq + (t_pw − t_setup) = 4.06, sum unchanged; t_hold,virtual = t_hold + t_pw = 2.6. Measure contamination delay in the fastest environment, setup/hold/propagation in the slowest. Trade-offs (Figure 10.38): delay on D or Q eases min-delay at the cost of overhead (libraries use intentionally slow flops); delay on the clock shifts the edge (more logic before, less after: intentional clock skew, not true skew).",
    steps: [
      { k: "learn", title: "Ground rules", b: [
        `<ul><li><b>Static</b> elements: dynamic ones lose state when clocks stop, during slow test, or under burn-in leakage.</li><li><b>Scannable</b>: elements chain into a shift register for test and debug. The Alpha 21264 skipped full scan and paid in debug time.</li><li><b>One clock per region</b>; make φ̄, pulses and delayed clocks locally; buffer locally for sharp edges.</li><li>Clocks burn <b>1/3 to 1/2</b> of chip power: gate them for idle units.</li></ul>`,
      ]},
      { k: "learn", title: "What does “setup time” really mean?", b: [
        `<p>Move the data closer to the clock edge (smaller t<sub>DC</sub>): at first t<sub>CQ</sub> doesn't change; then it starts to rise, and eventually the flop fails.</p>`,
        `<p>The useful number is the total D-to-Q time, t<sub>DQ</sub> = t<sub>DC</sub> + t<sub>CQ</sub>. It has a <b>minimum</b> where t<sub>CQ</sub>'s slope is −1. Define t<sub>setup</sub> as t<sub>DC</sub> at that minimum and t<sub>pcq</sub> as t<sub>CQ</sub> there: the overhead t<sub>setup</sub> + t<sub>pcq</sub> is then as small as possible.</p>`,
        `<p>Book's flop (FO4 units): t<sub>setup</sub> = 1.03, t<sub>pcq</sub> = 2.31, t<sub>ccq</sub> = 2.17. Hold times are typically <b>negative</b>.</p>`,
      ]},
      { k: "check", title: "Spot the fallacy", b: [
        { t: "mcq", q: "A paper reports only its new flop's clock-to-Q delay, which is tiny. What should you ask?", opts: [["What is the setup time? The real cost is t_setup + t_pcq (minimum D-to-Q)", true, "A flop can trade setup for clock-to-Q; only the sum matters."], ["Was it measured at room temperature?", false, "Fair, but not the main issue."], ["Nothing: smaller clock-to-Q is always better", false, "Not if the setup time grew."]] },
      ]},
      { k: "learn", title: "Aperture and pulsed latches as flops", b: [
        `<p>The <b>aperture</b> is the window in which D must not change: t<sub>ar</sub> = t<sub>setup1</sub> + t<sub>hold0</sub>. Change inside it and the output can go metastable (Part 10).</p>`,
        `<p>Timing tools like flops, so treat a pulsed latch as a <b>virtual flop</b> on the rising edge: virtual setup = t<sub>setup</sub> − t<sub>pw</sub> (negative), virtual clock-to-Q = t<sub>pdq</sub> + (t<sub>pw</sub> − t<sub>setup</sub>), virtual hold = t<sub>hold</sub> + t<sub>pw</sub>. The overhead sum doesn't change.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A pulsed latch: t_pw = 5 FO4, t_setup = 1.2 FO4 (to the falling edge), t_hold = −1.0 FO4. Virtual hold time relative to the rising edge, in FO4?", a: 4, tol: 0.01, why: "t_hold + t_pw = −1.0 + 5 = 4 FO4: positive and long, as you'd expect for a pulsed latch." },
      ]},
      { k: "learn", title: "Trading the three numbers", b: [
        `<div class="tbl"><table><thead><tr><th>Add delay t<sub>buf</sub> on…</th><th>Effect</th></tr></thead><tbody><tr><td>D</td><td>setup + t<sub>buf</sub>, hold − t<sub>buf</sub>: safer min-delay, more overhead</td></tr><tr><td>Q</td><td>clock-to-Q + t<sub>buf</sub>: safer min-delay, more overhead</td></tr><tr><td>clk</td><td>setup − t<sub>buf</sub>, clock-to-Q + t<sub>buf</sub>, hold + t<sub>buf</sub>: overhead unchanged; shifts time from the next cycle to the previous one</td></tr></tbody></table></div>`,
        `<p>Many standard-cell libraries use deliberately slow flops so designers don't hit hold violations.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How should setup time and clock-to-Q delay be defined so they are useful for timing?", model: "Sweep how early the data arrives before the clock and measure the clock-to-Q delay. The total D-to-Q delay, arrival-to-clock time plus clock-to-Q, has a minimum. Define the setup time as the arrival time at that minimum and the clock-to-Q delay as the value there, so their sum, the sequencing overhead, is minimized. Defining them separately can make one look good while the sum gets worse." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Retention, level conversion, and living on the razor's edge", mins: 20,
    blurb: "Keeping state through power-down, crossing voltage domains in the flop, and flops that detect their own timing errors.",
    takeaway: "State retention registers (power gating, Section 5.3.2): balloon circuit (Figure 10.39) with low-leakage (high-V_t / thick-oxide I/O) cross-coupled inverters on a separate supply; sequence: stop clock with slave opaque, pulse SAMPLE to copy into the balloon, assert HOLD, power down; on power-up pulse SAMPLE to restore, deassert HOLD, restart clock. Level-converter flops absorb the low-to-high level converter into the cycle boundary; low-swing inputs should drive only nMOS or pass transistors (they can't fully turn off pMOS on V_DDH); e.g., slave latches + differential converter, latch with weak cross-coupled restorers, Zhao implicitly pulsed converter; commercial designs still mostly use standard flops + differential converters. Design margin: variation forces derating performance or power by 30% or more from TT/nominal. Adaptive approaches for DVFS: precharacterized voltage–frequency tables (simple, most conservative; relax with temperature/droop/current sensing); canary circuits (replica critical path) track corners but not random/within-die mismatch. Double-sampling: Razor flop = main flop on φp rising + checking latch sampling later; XOR flags late data → ERR → replay at lower frequency or higher voltage; run with almost no margin; pulse width trades detection window vs hold time (< 3 FO4 preferred); Razor flop can go metastable. DSTB (double sampling with time borrowing) moves metastability to the error path: pulsed latch captures late data, flop flags it. Razor II: pulsed latch + short pulse generator + transition detector (dynamic XOR reset after errors); short pulse sets borrowing, long pulse sets hold, difference = detection window. These also catch soft errors and glitches if the detection window exceeds the glitch.",
    steps: [
      { k: "learn", title: "Keeping state through power-down", b: [
        `<p>Power gating a unit saves leakage, but its registers lose their contents. A <b>balloon</b> is a tiny, low-leakage latch on its own always-on supply:</p>`,
        `<ol><li>Stop the clock with the slave latch opaque.</li><li>Pulse SAMPLE: copy the state into the balloon.</li><li>Assert HOLD; cut power to the unit.</li><li>Power back up, pulse SAMPLE to restore, release HOLD, restart the clock.</li></ol>`,
        seenV("Power gating.", "05-power.html", "Chapter 5"),
      ]},
      { k: "check", title: "Order it", b: [
        { t: "mcq", q: "Why must the clock stop with the slave latch opaque before SAMPLE is pulsed?", opts: [["So the state being copied isn't changing", true, "An opaque slave holds a stable value."], ["To save power", false, "Not the reason."], ["SAMPLE needs the clock running", false, "It's a separate control."]] },
      ]},
      { k: "learn", title: "Level-converter flops", b: [
        `<p>Crossing from a low-voltage domain to a high one needs a level converter. If the crossing is at a cycle boundary, build it into the flop. Rule: low-swing signals may drive only <b>nMOS</b> or pass transistors; they can't turn off a pMOS whose source is at V<sub>DDH</sub>.</p>`,
      ]},
      { k: "learn", title: "Margins and how to shrink them", b: [
        `<p>Covering every corner costs <b>30% or more</b> of performance or power compared with typical silicon. Ways to recover some:</p>`,
        `<ul><li>A table of safe voltage–frequency pairs (simple, conservative).</li><li>A <b>canary</b> path that mimics the critical path (tracks corners, not random mismatch).</li><li><b>Let the circuits report their own errors.</b></li></ul>`,
      ]},
      { k: "learn", title: "Razor", b: [
        `<p>Beside each critical flop, a latch samples the same D a little later. If they disagree, the data was late: the flop missed it but the latch caught it. Raise ERR, replay the operation at a lower frequency or higher voltage, and keep running right at the edge of failure.</p>`,
        `<p>Wider checking windows catch later data but lengthen the hold time (< 3 FO4 preferred). DSTB and Razor II move the metastability risk off the data path. Bonus: they also catch soft errors.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why does Razor need a replay mechanism?", opts: [["When the main flop is wrong, the wrong value has already gone into the next stage, so the operation must be redone", true, "Detection without recovery would only tell you the chip failed."], ["To measure the clock frequency", false, "That's not what replay is for."], ["Because the latch is slower than the flop", false, "It samples later on purpose."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a Razor flip-flop let a chip run with almost no timing margin?", model: "Each critical flop is paired with a latch that samples the same input slightly later. Normally both agree. If the data arrives just too late for the flop but in time for the latch, an XOR flags an error, and the system replays the operation from a known good state, then lowers the frequency or raises the voltage a little. So the voltage and frequency can be tuned until errors are rare, instead of guarding against the worst case." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "Metastability", mins: 20,
    blurb: "Sample a changing signal at exactly the wrong moment and a latch can balance between 0 and 1, for an unbounded time.",
    takeaway: "Synchronizer: accepts an input that changes at arbitrary times, produces an output aligned to its clock; it can go metastable. A latch is bistable: stable states A = B = 0 and A = B = V_DD, and a metastable point A = B = V_m (ball balanced on a hill). Data changing at the critical time t_m within the aperture leaves the output near V_m for a while. Small-signal model: the cross-coupled pair is an amplifier with gain G, output R, load C: G·a/R − a/R = C·da/dt (EQ 10.22) → a(t) = a(0)e^(t/τ_s), τ_s = RC/(G − 1) (EQ 10.23), essentially 1/gain-bandwidth product. Time to reach a valid level ΔV: t_DQ = τ_s[ln ΔV − ln a(0)] (EQ 10.24); a(0) ∝ t_DC − t_m; delay unbounded as a(0) → 0, but noise prevents exactly 0. Probability P(t_DQ > t′) = (T_0/T_c)e^(−t′/τ_s) for t′ > h (EQ 10.25): T_0/T_c = chance the input changes in the aperture; exponential = chance it hasn't resolved. Example 10.8 (Figure 10.43, rising input): points (0.1 ps, 290 ps) and (0.01 ps, 415 ps) → τ_s = 54 ps, T_0 = 21 ps, h ≈ 175 ps; conservative design also checks falling inputs and slow conditions. A good synchronizer latch has a high gain-bandwidth feedback loop; conventional latches put clock and data transistors in series; the fast synchronizer flop (Figure 10.45) reduces each latch's feedback to a cross-coupled inverter pair, resets to 0 and only sets to 1, with small buffers so the loop is lightly loaded.",
    steps: [
      { k: "learn", title: "A ball on a hill", b: [
        `<p>A latch's two inverters in a loop have two stable states (A = B = 0 or V<sub>DD</sub>) and one <b>metastable</b> state in between, A = B = V<sub>m</sub>: self-consistent, but any nudge sends it rolling one way or the other.</p>`,
        `<p>If D changes at just the wrong instant as the latch closes, the loop starts near V<sub>m</sub>, and the output hangs there before resolving.</p>`,
      ]},
      { k: "learn", title: "How fast does it roll off?", b: [
        `<p>Near V<sub>m</sub> the loop is an amplifier. A small offset a grows exponentially:</p>`,
        `<p class="eq">a(t) = a(0) e<sup>t/τ<sub>s</sub></sup>, &nbsp; τ<sub>s</sub> = RC / (G − 1)</p>`,
        `<p class="eq">t<sub>DQ</sub> = τ<sub>s</sub> [ln ΔV − ln a(0)]</p>`,
        `<p>The closer to the critical instant (smaller a(0)), the longer the delay, with <b>no upper bound</b>.</p>`,
        `<p class="aside">This is the same first-order differential equation as an RC circuit, but with positive feedback: growth instead of decay.</p>`,
      ]},
      { k: "play", title: "Delay versus closeness", b: [
        `<p>Using the book's fitted latch (τ<sub>s</sub> = 54 ps). Each decade closer adds the same delay. Predict how much before sliding.</p>`,
        metaWidget,
      ]},
      { k: "learn", title: "The probability", b: [
        `<p class="eq">P(t<sub>DQ</sub> &gt; t′) = (T<sub>0</sub> / T<sub>c</sub>) · e<sup>−t′/τ<sub>s</sub></sup></p>`,
        `<p>T<sub>0</sub>/T<sub>c</sub>: the chance a random input change lands in the danger window. The exponential: the chance it still hasn't resolved after waiting t′.</p>`,
        `<p>Example 10.8 fits two points of the measured curve, (0.1 ps, 290 ps) and (0.01 ps, 415 ps): 10× closer added 125 ps, so τ<sub>s</sub> = 125/ln 10 = <b>54 ps</b>, then T<sub>0</sub> = <b>21 ps</b>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A latch has τ_s = 30 ps. By what factor does the probability of still being unresolved drop if you wait 69 ps longer?", a: 10, tol: 0.03, why: "e^(69/30) = e^2.3 ≈ 10." },
      ]},
      { k: "learn", title: "Designing for fast resolution", b: [
        `<p>τ<sub>s</sub> is roughly 1/(gain-bandwidth) of the loop: keep the feedback loop strong and <b>lightly loaded</b>. A synchronizer flop (Figure 10.45) strips each latch down to a bare cross-coupled inverter pair, with small output buffers, and only ever pulls one way (reset to 0, set if D = 1).</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't a latch's metastable delay be bounded, and why does waiting help so much?", model: "If the input changes at exactly the critical instant, the latch starts arbitrarily close to its metastable point, and the time to resolve grows like the log of one over that tiny offset, so there is no maximum. But resolution is driven by positive feedback, so the probability of still being unresolved falls exponentially with time: each extra τ_s of waiting cuts it by a factor of e." },
      ]},
    ],
  };

  /* =============== PART 11 =============== */
  const p11 = {
    id: "p11", title: "Synchronizers, clock domains, wave pipelining", mins: 25,
    blurb: "Two flops in a row, MTBF that grows exponentially, handshakes between clock domains, the classic mistakes, and a pipeline with no latches.",
    takeaway: "Simple synchronizer: two flops; F1 may go metastable, F2 samples a cycle later; latency one cycle; fails if X hasn't resolved by a setup time before the next edge. P(failure per second) = N(T_0/T_c)e^(−(T_c − t_setup)/τ_s) (EQ 10.27); MTBF = T_c e^((T_c − t_setup)/τ_s)/(N T_0) (EQ 10.28). Example 10.9 (0.25 µm, τ_s = 20 ps, T_0 = 15 ps, N = 50 MHz, setup negligible): MTBF ≥ 1 year (π × 10⁷ s) → T_c ≥ 625 ps (1.6 GHz); Example 10.10: 1000 years → 760 ps (135 ps more for 1000×). Medical: wait several cycles for MTBF beyond the universe's age (~10¹⁹ s). Asynchronous clock domains: data + Req + Ack handshake; four-phase (level-sensitive: Req up, Ack up, Req down, Ack down) vs two-phase (edge: toggle Req, toggle Ack: fewer transitions, edge circuitry). Synchronize Req into B and Ack into A; a just-missed Req is caught next cycle. Figure 10.49: pulse-to-level (XOR + flop) and level-to-pulse converters; synchronizer latency limits throughput. Mistakes: dynamic latches without feedback; heavily loaded loops (10.17(f) bad, (g) better); one signal into two synchronizers (they can disagree); synchronizing a multibit word with several changing bits (0000 → 1111 may read 0101): synchronize only Req/Ack, or use Gray codes. AMD 9513/9519, Z-80 SIO, Intel 8048, AMD 29000 reportedly had metastability bugs. Arbiters decide which request came first; SR latch + four-transistor metastability filter keeps both Acks low until n1/n2 differ by V_t: never outputs metastable levels but the decision time is unbounded, so synchronize Acks. Degrees of synchrony (Table 10.3): synchronous (same f, phase), mesochronous (same f, constant phase: delay to avoid the aperture), plesiochronous (nearly same f, slowly drifting: adjustable delay, dropped/duplicated data), periodic (different f: predict), asynchronous (full synchronizer). Wave pipelining: multiple tokens in the logic at once, like light pulses in fiber; N < t_pd/(t_pd − t_cd) (EQ 10.30); variability makes even N = 2 hard. Pitfalls: incompletely reporting flop delay, failing to check hold times early, choosing a methodology late, failing to synchronize (UART READY into an FSM jumped to illegal states: register it first), faulty synchronizers.",
    steps: [
      { k: "learn", title: "The two-flop synchronizer", b: [
        `<p>F1 samples the asynchronous input and may go metastable. F2 samples F1's output a whole cycle later, by which time it has almost certainly resolved. Latency: one extra cycle.</p>`,
        `<p class="eq">MTBF = T<sub>c</sub> · e<sup>(T<sub>c</sub> − t<sub>setup</sub>)/τ<sub>s</sub></sup> / (N · T<sub>0</sub>)</p>`,
        `<p>N = how many times per second the input changes.</p>`,
      ]},
      { k: "play", title: "Example 10.9", b: [
        `<p>τ<sub>s</sub> = 20 ps, T<sub>0</sub> = 15 ps, input toggling at 50 MHz, setup negligible. What clock period gives one year between failures? Then try for 1000 years.</p>`,
        mtbfWidget,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Going from a 1-year to a 1000-year MTBF needed only 135 ps more waiting. Why so little?", opts: [["MTBF grows exponentially with the waiting time: ln 1000 × τ_s ≈ 6.9 × 20 ps ≈ 138 ps", true, "The T_c factor in front changes a little too, hence 135 rather than 138."], ["Because the clock got faster", false, "It got slower."], ["Because N changed", false, "N stayed at 50 MHz."]] },
      ]},
      { k: "learn", title: "Between clock domains", b: [
        `<p>System A sends a word to System B on an unrelated clock. A puts the data on the bus and raises <b>Req</b>; B samples it and answers <b>Ack</b>. Only Req and Ack cross through synchronizers; the data is guaranteed stable by the handshake.</p>`,
        `<div class="two"><div class="tile"><h3>Four-phase</h3><p>Req ↑, Ack ↑, Req ↓, Ack ↓. Level-sensitive, simple.</p></div><div class="tile"><h3>Two-phase</h3><p>Each toggle of Req means “new data”; each toggle of Ack means “got it”. Fewer transitions, edge-detecting circuits.</p></div></div>`,
      ]},
      { k: "check", title: "Spot the bug", b: [
        { t: "sort", q: "Good synchronizer design, or a bug?", bins: ["OK", "Bug"], items: [
          ["A 4-bit counter value synchronized bit by bit while it counts", 1, "Several bits change at once: 0111 → 1000 might read as 1111. Use Gray code or a handshake."],
          ["One asynchronous input fed to two separate synchronizers whose outputs must agree", 1, "They can resolve differently."],
          ["Req synchronized with two back-to-back static flops", 0, "The standard approach."],
          ["A dynamic latch with no feedback used as the first stage", 1, "No positive feedback, so nothing resolves metastability."],
          ["A UART's READY wired straight into an FSM's next-state logic", 1, "Different bits see it at different times: illegal states. Register it first."],
        ]},
      ]},
      { k: "learn", title: "Arbiters and degrees of synchrony", b: [
        `<p>An <b>arbiter</b> decides which of two requests came first (like a game-show buzzer). An SR latch plus a <b>metastability filter</b> keeps both Acks low until the decision is clear: it never outputs a bad level, but it may take arbitrarily long, so synchronize its Acks.</p>`,
        `<div class="tbl"><table><tbody><tr><td>Synchronous</td><td>same frequency and phase: sample directly</td></tr><tr><td>Mesochronous</td><td>same frequency, fixed phase offset: add a fixed delay</td></tr><tr><td>Plesiochronous</td><td>nearly equal frequency, drifting phase: adjust delay, handle dropped/duplicated data</td></tr><tr><td>Periodic</td><td>different frequency: predict when data changes</td></tr><tr><td>Asynchronous</td><td>anything goes: full synchronizer</td></tr></tbody></table></div>`,
      ]},
      { k: "learn", title: "Wave pipelining", b: [
        `<p>An optical fiber carries many pulses at once with no latches inside. Logic could too, if every path had nearly the same delay:</p>`,
        `<p class="eq">N &lt; t<sub>pd</sub> / (t<sub>pd</sub> − t<sub>cd</sub>)</p>`,
        `<p>Real delays vary with voltage, temperature, process and path, so even N = 2 is hard.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A logic block has t_pd = 1000 ps and t_cd = 600 ps. Using EQ 10.30, what is the bound on the number of simultaneous waves?", a: 2.5, tol: 0.01, why: "1000 / (1000 − 600) = 2.5, so at most 2 waves." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is it a mistake to synchronize a multi-bit counter value directly, and what are two fixes?", model: "When several bits change at the same time, each bit's synchronizer may resolve independently, some to the old value and some to the new one, giving a word that is neither, such as 0101 between 0000 and 1111. One fix is to synchronize only a request/acknowledge handshake, holding the data stable while it is sampled. Another is to count in Gray code, where only one bit changes per step, so the result is always either the old or the new value." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "vlsi10", eyebrow: "CMOS VLSI · Chapter 10", title: "Sequential Circuit Design",
    intro: `<p>Eleven parts: what sequencing elements are for, max- and min-delay constraints, time borrowing and clock skew, latch and flip-flop circuits, special-purpose elements, how to characterize them, adaptive elements, and finally metastability and synchronizers.</p><p>The book's running example is the Itanium 2 ALU self-bypass path: keep its 1000 ps of logic in mind. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises; most use the book's Table 10.5 timing parameters. For each one, first draw the two clock edges involved and mark which element launches and which captures. Then decide whether it's a max-delay or a min-delay question.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11],
    summary: `
      <h3>Constraints</h3>
      <p>Flops: T<sub>c</sub> ≥ t<sub>pcq</sub> + t<sub>pd</sub> + t<sub>setup</sub> + t<sub>skew</sub>; t<sub>cd</sub> ≥ t<sub>hold</sub> − t<sub>ccq</sub> + t<sub>skew</sub>. Latches: overhead 2t<sub>pdq</sub>, skew-tolerant, borrow ≤ T<sub>c</sub>/2 − t<sub>setup</sub>. Pulsed latches: lowest overhead, hold + t<sub>pw</sub>. Hold failures can't be fixed by slowing the clock. Loops can't borrow.</p>
      <h3>Circuits</h3>
      <p>Robust latch: input inverter, TG, feedback tristate, output inverter. Flop = two latches; beware the internal race and slow edges. Pulse generators, reset (sync/async), enable (mux or clock gating), SDFF, sense-amp flop, DICE.</p>
      <h3>Methodology</h3>
      <p>Static and scannable; one clock per region; setup and t<sub>pcq</sub> defined at minimum D-to-Q; virtual flop model for pulsed latches; slow flops ease hold. Balloon retention, level-converter flops, Razor.</p>
      <h3>Synchronizers</h3>
      <p>τ<sub>s</sub> = RC/(G − 1); P = (T<sub>0</sub>/T<sub>c</sub>)e<sup>−t/τ<sub>s</sub></sup>; MTBF = T<sub>c</sub>e<sup>(T<sub>c</sub> − t<sub>setup</sub>)/τ<sub>s</sub></sup>/(NT<sub>0</sub>). Two-flop synchronizer, handshakes, Gray codes, arbiters, degrees of synchrony. Wave pipelining: N &lt; t<sub>pd</sub>/(t<sub>pd</sub> − t<sub>cd</sub>).</p>`,
  };
  Course.start(window.CHAPTER);
})();
