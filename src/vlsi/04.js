(function () {
  const { S, plot, slider, toggle, readout, fmt, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const seenV = (html, href, where) => `<div class="key"><b>Seen in Chapter 2:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const mathLink = (html, href, where) => `<p class="aside">${html} <a href="../math/${href}">${where} →</a></p>`;

  /* =============== PART 1 =============== */
  /* A small timing graph: gates with delays, inputs with arrival times. */
  const TIN = { a: 0, b: 10, c: 0, d: 20, e: 5 };
  function arrivals(d1) {
    const D = { g1: d1, g2: 25, g3: 40, g4: 20 };
    const A = Object.assign({}, TIN);
    A.g1 = Math.max(A.a, A.b) + D.g1; A.g2 = Math.max(A.c, A.d) + D.g2;
    A.g3 = Math.max(A.g1, A.g2) + D.g3; A.g4 = Math.max(A.g2, A.e) + D.g4;
    return { A, D };
  }
  function dagSvg(d1, req) {
    const { A, D } = arrivals(d1);
    const P = { a: [30, 40], b: [30, 80], c: [30, 130], d: [30, 170], e: [30, 220], g1: [150, 60], g2: [150, 150], g3: [290, 105], g4: [290, 200] };
    const E = [["a", "g1"], ["b", "g1"], ["c", "g2"], ["d", "g2"], ["g1", "g3"], ["g2", "g3"], ["g2", "g4"], ["e", "g4"]];
    const crit = new Set();
    const back = (n) => { const ins = E.filter(([, t]) => t === n).map(([f]) => f); if (!ins.length) return; const w = ins.reduce((m, f) => (A[f] > A[m] ? f : m)); crit.add(w + ">" + n); back(w); };
    const out = A.g3 >= A.g4 ? "g3" : "g4"; back(out);
    let s = "";
    E.forEach(([f, t]) => { const [x1, y1] = P[f], [x2, y2] = P[t]; s += `<line x1="${x1 + (f[0] === "g" ? 32 : 10)}" y1="${y1}" x2="${x2 - 32}" y2="${y2}" style="stroke:${crit.has(f + ">" + t) ? "var(--accent)" : "var(--muted)"};stroke-width:${crit.has(f + ">" + t) ? 3 : 1.5}"/>`; });
    ["a", "b", "c", "d", "e"].forEach((n) => { const [x, y] = P[n]; s += S.t(x - 4, y + 4, n, { a: "end", cls: "s" }) + `<circle cx="${x + 4}" cy="${y}" r="4" style="fill:var(--ink)"/>` + S.t(x + 12, y - 8, `a=${A[n]}`, { a: "start", cls: "s m" }); });
    ["g1", "g2", "g3", "g4"].forEach((n) => { const [x, y] = P[n]; s += `<rect x="${x - 32}" y="${y - 16}" width="64" height="32" rx="6" style="fill:var(--card);stroke:var(--ink)"/>` + S.t(x, y - 1, `${n}: ${D[n]}`, { cls: "s" }) + S.t(x, y + 12, `a=${A[n]}`, { cls: "s a" }); });
    [["g3", "out1"], ["g4", "out2"]].forEach(([n, o]) => { const [x, y] = P[n]; const sl = req - A[n]; s += `<line x1="${x + 32}" y1="${y}" x2="${x + 62}" y2="${y}" style="stroke:var(--ink)"/>` + S.t(x + 66, y - 4, o, { a: "start", cls: "s" }) + S.t(x + 66, y + 12, `slack ${sl}`, { a: "start", cls: "s " + (sl < 0 ? "r" : "m") }); });
    return S.svg(420, 240, s, { max: 440, label: "Timing graph with arrival times and slack" });
  }
  const p1 = {
    id: "p1", title: "What delay means", mins: 20,
    blurb: "Propagation vs contamination delay, rise and fall times, arrival times and slack.",
    takeaway: "Definitions: propagation delay t_pd = maximum time from the input crossing 50% to the output crossing 50%; contamination delay t_cd = the minimum; rise time t_r = 20% to 80%, fall time t_f = 80% to 20%; edge rate t_rf = (t_r + t_f)/2. Rising and falling outputs have separate delays (t_pdr, t_pdf). The driver charges or discharges the load (gates and wire). A timing analyzer computes arrival times a_i = max over fan-in (a_j) + t_pd,i; slack = required time − arrival time (negative slack: too slow). Real analyzers track rise/fall separately, per input, and earliest arrivals (from contamination delays) for hold checks. Timing can be optimized at four levels: microarchitecture (most leverage: pipelining, parallelism, memory sizes), logic (adder types, stages, fan-in/fan-out), circuit (transistor sizes, logic styles), layout (floorplan sets wire lengths). Simulation tells how a circuit behaves but not how to improve it; outstanding engineers build intuition with simple models.",
    steps: [
      { k: "learn", title: "Four definitions", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>t<sub>pd</sub></b> propagation delay</td><td>the <b>longest</b> time from input crossing 50% to output crossing 50%</td></tr>
          <tr><td><b>t<sub>cd</sub></b> contamination delay</td><td>the <b>shortest</b> such time</td></tr>
          <tr><td><b>t<sub>r</sub></b> rise time</td><td>20% → 80% of the final value</td></tr>
          <tr><td><b>t<sub>f</sub></b> fall time</td><td>80% → 20%</td></tr></tbody></table></div>`,
        `<p>After the input changes, the output keeps its old value for at least t<sub>cd</sub> and has its new value by t<sub>pd</sub>. Usually “delay” means t<sub>pd</sub>.</p>`,
        `<p class="aside">The gate doing the switching is the <b>driver</b>; the gates and wire it switches are the <b>load</b>.</p>`,
      ]},
      { k: "learn", title: "Arrival time and slack", b: [
        `<div class="eq">a<sub>i</sub> = max over inputs (a<sub>j</sub>) + t<sub>pd,i</sub>     slack = required − arrival</div>`,
        `<p>A <b>timing analyzer</b> does this for every node on the chip. Positive slack: fast enough. Negative: too slow. The chain of gates that sets the latest arrival is the <b>critical path</b>.</p>`,
      ]},
      { k: "play", title: "Find the critical path", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let d1 = 30, req = 100;
          function draw() { f.innerHTML = dagSvg(d1, req); const { A } = arrivals(d1); ro.innerHTML = readout([["Latest output arrival", Math.max(A.g3, A.g4) + " ps"], ["Worst slack", Math.min(req - A.g3, req - A.g4) + " ps"]]); }
          host.append(f, slider({ id: id + "-g", label: "Delay of gate g1", min: 5, max: 60, step: 1, value: d1, show: (x) => x + " ps" }, (x) => { d1 = x; draw(); }).el,
            slider({ id: id + "-r", label: "Required time at outputs", min: 60, max: 130, step: 1, value: req, show: (x) => x + " ps" }, (x) => { req = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Orange: the critical path. Make g1 faster: does the output arrive any earlier? Make it slower: when does the critical path switch to go through g1?</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "In the graph above (g1 = 30 ps), you speed up g1 to 10 ps. By how much does out1's arrival improve?", a: 0, tol: 0.01, unit: "ps", why: "g1 isn't on the critical path: g3 waits for g2 (arrives at 45) either way." },
        { t: "num", q: "With g1 = 30 ps, by how much must g2 speed up before out1's arrival stops improving?", a: 5, tol: 0.01, unit: "ps", hint: "g3 waits for the later of g1 (40) and g2 (45).", why: "At g2 = 20 ps, both arrive at 40. Faster than that, g1 is critical." },
      ]},
      { k: "learn", title: "Where to fix timing", b: [
        `<ol><li><b>Microarchitecture</b>: pipeline stages, parallel units, memory sizes. The most leverage.</li><li><b>Logic</b>: which adder, how many gate stages, fan-in and fan-out.</li><li><b>Circuit</b>: transistor sizes, logic style.</li><li><b>Layout</b>: the floorplan decides wire lengths.</li></ol>`,
        `<p>Synthesis tools handle levels 2–4, but a designer who doesn't understand them struggles to close timing. And simulation only says how fast <i>this</i> circuit is, not what to change. This chapter builds models you can do in your head.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why doesn't speeding up a gate always reduce a path's delay?", model: "A gate's output time is set by its latest-arriving input. If the gate you sped up wasn't feeding the latest input anywhere downstream, it isn't on the critical path, and the outputs still wait for the slower branch. Only speeding up gates on the critical path helps, and only until another path becomes critical." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const COX = (3.9 * 8.85e-14) / 10.5e-8;
  function stepResp(Wum, CfF) {
    const beta = 80 * COX * (Wum / 0.05), C = CfF * 1e-15, g = 0.7;
    const I = (v) => (v > g ? (beta / 2) * g * g : beta * (g - v / 2) * v);
    const pts = []; let V = 1, t = 0, tpd = null; const dt = 2e-15;
    while (t < 60e-12) { if (pts.length === 0 || t - pts[pts.length - 1][0] * 1e-12 >= 0.25e-12) pts.push([t * 1e12, V]); if (tpd === null && V <= 0.5) tpd = t * 1e12; V -= (I(V) / C) * dt; t += dt; }
    const Idsat = (beta / 2) * g * g, Rraw = 0.75 / Idsat;
    return { pts, tpd, Idsat, Rraw, tau: Rraw * C * 1e12 };
  }
  const p2 = {
    id: "p2", title: "The transient response", mins: 25,
    blurb: "I = C dV/dt with the transistor model: accurate-ish, but no insight. Hence simpler models.",
    takeaway: "Delay comes from charging capacitance: I = C dV/dt. For an inverter driving a load, the switching node's capacitance C_out = drain diffusion of both driver transistors + wire + gate capacitance of the next stage (source-body capacitances and the driver's own gate capacitance don't count; capacitors to any fixed supply can be drawn to ground). With a step input the nMOS starts saturated (constant current, V_out falls linearly) and becomes linear once V_out < V_DD − V_t (curving toward 0). Delay grows with C_out and falls with driver current. A ramp input adds phases: nMOS off (V_out = V_DD), both on (fighting), then pMOS off; slow inputs increase delay. Series stacks deliver less current. The differential equations are too nonlinear for closed form and the long-channel model misses velocity saturation, so: SPICE for accuracy, simple RC models for insight. SPICE also shows bootstrapping: the output bumps the wrong way first through gate-drain capacitance.",
    steps: [
      { k: "learn", title: "Which capacitances count?", b: [
        `<p>An inverter X1 drives a wire and inverter X2. The output node B must be charged and discharged. Its capacitance C<sub>out</sub>:</p>`,
        `<ul><li>Drain diffusion of X1's nMOS and pMOS.</li><li>The wire.</li><li>Gate capacitance of X2's two transistors.</li></ul>`,
        `<p>Not counted: X1's own gate capacitance (on node A), X2's diffusion (on X2's output), and source-to-body capacitances (both ends fixed). Any capacitor to a fixed supply can be drawn to ground.</p>`,
        `<div class="eq">C<sub>out</sub> dV<sub>B</sub>/dt = −I<sub>dsn</sub></div>`,
      ]},
      { k: "play", title: "Solve it numerically", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let W = 1, C = 20;
          function draw() {
            const r = stepResp(W, C);
            f.innerHTML = plot({ x: [0, 40], y: [0, 1.05], xt: [0, 10, 20, 30, 40], yt: [0, 0.5, 0.7, 1], xl: "time after input step (ps)", yl: "V_B (V)",
              series: [{ pts: r.pts, cls: "s1" }, { f: (t) => Math.exp(-t / r.tau), cls: "s5" }, { f: () => 0.5, cls: "s4" }], marks: r.tpd < 40 ? [{ x: r.tpd, y: 0.5, label: `t_pd = ${fmt(r.tpd, 3)} ps`, dy: -12 }] : [], label: "Inverter output falling after an input step" });
            ro.innerHTML = readout([["I_dsat of the nMOS", fmt(r.Idsat * 1000, 3) + " mA"], ["t_pd (long-channel model, numerically)", fmt(r.tpd, 3) + " ps"], ["RC model: R = ¾·V_DD/I_dsat", fmt(r.Rraw, 3) + " Ω"], ["RC model t_pd = 0.69·RC", fmt(0.693 * r.tau, 3) + " ps"]]);
          }
          host.append(f, slider({ id: id + "-w", label: "nMOS width W", min: 0.25, max: 4, step: 0.05, value: W, show: (x) => fmt(x, 3) + " µm" }, (x) => { W = x; draw(); }).el,
            slider({ id: id + "-c", label: "Output capacitance C_out", min: 2, max: 60, step: 1, value: C, show: (x) => x + " fF" }, (x) => { C = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">65 nm-style numbers: L = 50 nm, t<sub>ox</sub> = 10.5 Å, µ = 80 cm²/V·s, V<sub>t</sub> = 0.3 V, V<sub>DD</sub> = 1 V. Orange: straight line while saturated (constant current) down to V<sub>DD</sub> − V<sub>t</sub> = 0.7 V, then it curves. Dashed: an RC model's exponential. The 50% crossings nearly agree, even though the shapes don't. Double W or halve C: same delay.</p>`,
        seen("The same I = C dV/dt and the RC exponential.", "10-first-order-transients.html#p1", "Chapter 10"),
      ]},
      { k: "learn", title: "Real inputs ramp", b: [
        `<div class="tbl"><table><thead><tr><th>Phase</th><th>Input</th><th>nMOS</th><th>pMOS</th><th>Output</th></tr></thead><tbody>
          <tr><td>1</td><td>&lt; V<sub>tn</sub></td><td>off</td><td>on</td><td>V<sub>DD</sub></td></tr>
          <tr><td>2</td><td>middle</td><td>on</td><td>on</td><td>falls slowly: they fight</td></tr>
          <tr><td>3</td><td>&gt; V<sub>DD</sub> − |V<sub>tp</sub>|</td><td>on</td><td>off</td><td>falls freely</td></tr></tbody></table></div>`,
        `<p>A slow input means the nMOS isn't fully on yet and the pMOS fights it, so delay goes up. Series transistors each see a smaller V<sub>ds</sub>: less current, more delay.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Which change does NOT speed up the falling output of an inverter?", opts: [["Making the next stage's transistors wider", true, "That adds load capacitance: slower."], ["A wider nMOS in the driver", false, "More current: faster (though more self-loading too)."], ["A shorter wire to the next stage", false, "Less wire capacitance: faster."]] },
        { t: "num", q: "A constant 0.5 mA discharges 15 fF from 1.0 V. How long to reach 0.5 V?", a: 15, tol: 0.01, unit: "ps", hint: "t = CΔV/I.", why: "15 fF × 0.5 V / 0.5 mA = 15 ps." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do designers prefer simple RC models to solving the transistor differential equations?", model: "The equations are nonlinear and need numerical solution, so they give a number but no insight into what to change. With a simple long-channel model they're also inaccurate in modern processes. SPICE is better for accurate numbers. An RC model replaces each transistor with a resistor and capacitors, giving arithmetic you can do by hand that shows how size and load affect delay." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const GATES = {
    INV: { n: [1], p: [2], cin: 3, note: "pMOS twice as wide: holes are ~2× slower." },
    NAND2: { n: [2, 2], p: [2, 2], cin: 4, note: "2 nMOS in series → each 2× wide. pMOS in parallel: worst case only one is on, so each stays 2." },
    NAND3: { n: [3, 3, 3], p: [2, 2, 2], cin: 5, note: "3 nMOS in series → each 3× wide." },
    NOR3: { n: [1, 1, 1], p: [6, 6, 6], cin: 7, note: "3 pMOS in series, each needing 2 × 3 = 6. Big and slow: that's why NANDs win." },
  };
  function gateSizes(name) {
    const G = GATES[name], k = G.n.length;
    let s = "";
    const tr = (x, y, w, pm) => `<rect x="${x - 22}" y="${y - 12}" width="44" height="24" rx="5" style="fill:${pm ? "var(--accent-soft)" : "var(--cool-soft)"};stroke:var(--ink)"/>` + S.t(x, y + 5, w, { cls: "s" });
    const pSeries = name === "NOR3", nSeries = name !== "NOR3" && k > 1;
    s += S.t(20, 18, "pull-up (pMOS)", { a: "start", cls: "s a" }) + S.t(20, 238, "pull-down (nMOS)", { a: "start", cls: "s c" });
    const row = (i, n) => 210 - (n - 1) * 35 + i * 70;
    if (pSeries) G.p.forEach((w, i) => { s += tr(210, 40 + i * 32, w, 1); });
    else G.p.forEach((w, i) => { s += tr(row(i, G.p.length), 60, w, 1); });
    if (nSeries) G.n.forEach((w, i) => { s += tr(210, 150 + i * 32, w, 0); });
    else G.n.forEach((w, i) => { s += tr(row(i, G.n.length), 180, w, 0); });
    s += S.t(400, 130, `input C = ${G.cin}`, { a: "end", cls: "s" }) + S.t(400, 148, `g = ${G.cin}/3`, { a: "end", cls: "s a" });
    s += S.t(20, 130, pSeries ? "series pull-up" : name === "INV" ? "" : "parallel pull-up", { a: "start", cls: "s m" }) + S.t(20, 148, nSeries ? "series pull-down" : name === "INV" ? "" : "parallel pull-down", { a: "start", cls: "s m" });
    return S.svg(420, 246, s, { max: 440, label: "Transistor widths for unit resistance" });
  }
  const p3 = {
    id: "p3", title: "The RC model: transistors as resistors", mins: 30,
    blurb: "Unit transistors, effective resistance, gate and diffusion capacitance. Size gates for equal drive.",
    takeaway: "RC delay model: a transistor is a switch in series with an effective resistance (average V_ds/I_ds over the switching transition) plus capacitances. A unit nMOS (minimum length, minimum contacted width, e.g. 4/2 λ) has resistance R (~10 kΩ); k times wider → R/k. A unit pMOS has 2R–3R (the book uses 2R). Long-channel theory: R ∝ L and series resistances add; fully velocity-saturated transistors would be independent of L; reality is between, so series stacks are a bit faster than predicted. Gate capacitance of a unit transistor C; k-wide → kC; a contacted source or drain also ≈ C per unit width (C ≈ 1 fF/µm; 65 nm unit 0.1 µm → C ≈ 0.1 fF). Equivalent circuits: nMOS width k = R/k with kC on gate, source and drain; pMOS width k = 2R/k. Size gates so the worst-case pull-up and pull-down each equal a unit inverter's R: unit inverter = nMOS 1, pMOS 2 (input capacitance 3C). k series transistors are each k times wider; parallel transistors keep single-transistor width (only one may be on). NAND3: nMOS 3, pMOS 2 (input C = 5); NOR3: nMOS 1, pMOS 6 (input C = 7). Capacitances between two fixed supplies are irrelevant.",
    steps: [
      { k: "learn", title: "A transistor is a resistor (sort of)", b: [
        `<p>Replace each ON transistor with its <b>effective resistance</b>: V<sub>ds</sub>/I<sub>ds</sub> averaged over a switching event.</p>`,
        `<div class="tbl"><table><thead><tr><th></th><th>Unit nMOS</th><th>Unit pMOS</th><th>k× wider</th></tr></thead><tbody>
          <tr><td>Resistance</td><td>R</td><td>2R (2–3R really)</td><td>÷ k</td></tr>
          <tr><td>Gate capacitance</td><td>C</td><td>C</td><td>× k</td></tr>
          <tr><td>Each source/drain</td><td>≈ C</td><td>≈ C</td><td>× k</td></tr></tbody></table></div>`,
        `<p class="aside">“Unit” means minimum length and the smallest width that fits a contact (4λ). R is about 10 kΩ; C ≈ 1 fF/µm of width, so about 0.1 fF for a 0.1 µm unit transistor at 65 nm.</p>`,
        seenV("Effective resistance comes from the I-V curves.", "02-mos-transistor.html#p2", "Chapter 2, Part 2"),
      ]},
      { k: "learn", title: "Size for equal drive", b: [
        `<p>The rule: every gate's worst-case pull-up and pull-down should match a <b>unit inverter</b>'s resistance R.</p>`,
        `<ul><li><b>k in series</b>: resistances add, so each must be <b>k times wider</b>.</li><li><b>In parallel</b>: in the worst case only one is on, so each keeps single-transistor size.</li></ul>`,
      ]},
      { k: "play", title: "Size the gates", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const names = Object.keys(GATES);
          let g = "NAND2";
          const draw = () => { f.innerHTML = gateSizes(g); ro.innerHTML = readout([["Why", GATES[g].note], ["Input capacitance per input", GATES[g].cin + "C, vs 3C for the inverter"]]); };
          host.append(toggle(names, (i) => { g = names[i]; draw(); }, 1), f, ro);
          draw();
        },
        `<p class="aside">Numbers are widths in unit transistors. Each input drives one nMOS and one pMOS, so its capacitance is the sum of their widths. A gate that needs more input capacitance to deliver the same current is harder to drive: that's <b>logical effort</b>, coming in Part 6.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "In a process where unit pMOS have resistance 2R: a 2-input NAND sized for unit resistance. How wide is each pMOS?", a: 2, tol: 0.01, unit: "units", why: "Parallel: worst case one is on, so it alone must give R: 2R/2." },
        { t: "num", q: "An nMOS 4 units wide has what resistance, in units of R?", a: 0.25, tol: 0.01, unit: "R", why: "R/k with k = 4." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why are series transistors made wider but parallel ones not?", model: "Series transistors' resistances add, so to keep the total equal to one unit transistor's resistance each must have a fraction of that resistance, which means making it proportionally wider. Parallel transistors could all be on and help each other, but the worst case is only one on, and that one alone must provide the required resistance, so it keeps the single-transistor size." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  function ladderSim(N) {
    N = Math.max(1, Math.round(N));
    const r = 1 / N, c = 1 / N, dt = 0.0005;
    let v = new Array(N).fill(0), t = 0, t50 = null; const pts = [[0, 0]];
    while (t < 2) {
      const nv = v.slice();
      for (let i = 0; i < N; i++) { const vin = i === 0 ? 1 : v[i - 1], iout = i < N - 1 ? (v[i] - v[i + 1]) / r : 0; nv[i] = v[i] + ((vin - v[i]) / r - iout) / c * dt; }
      v = nv; t += dt;
      if (t50 === null && v[N - 1] >= 0.5) t50 = t;
      if (Math.round(t / dt) % 20 === 0) pts.push([t, v[N - 1]]);
    }
    return { pts, t50, elmore: (r * c * N * (N + 1)) / 2 };
  }
  const p4 = {
    id: "p4", title: "Elmore delay", mins: 30,
    blurb: "One time constant for any RC tree: add up each capacitor times the resistance it shares with the output path.",
    takeaway: "A first-order RC step response V_out = V_DD e^(−t/τ), τ = RC, reaches V_DD/2 at t_pd = RC ln 2. Since R is empirical anyway, absorb the ln 2 into it and write t_pd = RC. A second-order RC (R₁, C₁, R₂, C₂) has two real poles and a messy exact solution, but is well approximated by one time constant τ = R₁C₁ + (R₁ + R₂)C₂ (error < 7% for equal R and C, < 15% worst case), good at the output though poor at intermediate nodes. Elmore delay for any RC tree (no loops, source at the root): t_pd = Σ_i R_is·C_i, where R_is is the resistance on the path from the source to node i that is shared with the path from the source to the output (the leaf of interest). Unit inverter driving m unit inverters: (3 + 3m)RC; a w-times larger driver: (3 + 3m/w)RC = (3 + 3h)RC with fanout (electrical effort) h = C_load/C_in (diffusion not counted). FO4 inverter: 15RC; at 65 nm with R = 10 kΩ and C = 0.1 fF, RC = 1 ps, so ~15 ps. Normalize to τ = 3RC (delay of a parasitic-free fanout-of-1 inverter): d = t_pd/τ; fanout-h inverter d = h + 1; FO4 = 5τ, nearly process-independent.",
    steps: [
      { k: "learn", title: "One RC, then absorb ln 2", b: [
        `<div class="eq">V<sub>out</sub> = V<sub>DD</sub> e<sup>−t/RC</sup>   ⇒   t<sub>pd</sub> = RC ln 2 ≈ 0.69 RC</div>`,
        `<p>R is a fitted number anyway, so fold the 0.69 into it and just write <b>t<sub>pd</sub> = RC</b>. From now on, R means this delay-calibrated resistance.</p>`,
        mathLink("Exponential decay and time constants:", "08-exp-log.html", "Math 8"),
      ]},
      { k: "learn", title: "The Elmore recipe", b: [
        `<div class="eq">t<sub>pd</sub> = Σ<sub>i</sub> R<sub>is</sub> C<sub>i</sub></div>`,
        `<p>For each capacitor C<sub>i</sub>: multiply it by the resistance on the path from the source to it that is <b>shared with the path to the output</b>. Add them up.</p>`,
        `<p>Two-stage ladder (R<sub>1</sub>, C<sub>1</sub>, then R<sub>2</sub>, C<sub>2</sub> at the output): t<sub>pd</sub> = R<sub>1</sub>C<sub>1</sub> + (R<sub>1</sub> + R<sub>2</sub>)C<sub>2</sub>.</p>`,
        `<p class="aside">Elmore is a single time constant. It describes the output well, intermediate nodes badly, and is slightly pessimistic because of resistance that shields some capacitance.</p>`,
      ]},
      { k: "play", title: "Elmore vs the real answer", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let N = 2;
          function draw() {
            const r = ladderSim(N), e = r.elmore * Math.LN2;
            f.innerHTML = plot({ x: [0, 1.5], y: [0, 1.05], xt: [0, 0.5, 1, 1.5], yt: [0, 0.5, 1], xl: "time (units of total R × total C)", yl: "V_out", series: [{ pts: r.pts, cls: "s1" }, { f: (t) => 1 - Math.exp(-t / r.elmore), cls: "s5" }], marks: [{ x: r.t50, y: 0.5, label: "real 50%", dx: 10, dy: 18 }, { x: e, y: 0.5, label: "Elmore", a: "end", dx: -10, cls: "mk" }], label: "RC ladder step response vs Elmore estimate" });
            ro.innerHTML = readout([["Elmore τ = Σ R_is C_i", fmt(r.elmore, 3) + " RC"], ["Elmore 50% estimate (0.69 τ)", fmt(e, 3)], ["Actual 50% time", fmt(r.t50, 3)], ["Error", fmt(((e - r.t50) / r.t50) * 100, 2) + "%"]]);
          }
          host.append(f, slider({ id: id + "-n", label: "Number of RC sections", min: 1, max: 10, step: 1, value: N, show: (x) => String(x) }, (x) => { N = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The same total R and C split into N equal sections. One section: exact. More: still within about 10%. Dashed: the one-time-constant approximation.</p>`,
      ]},
      { k: "learn", title: "An inverter driving m inverters", b: [
        `<p>Unit inverter: R to the output, which has <b>3C</b> of its own drain diffusion (1 + 2) and <b>3mC</b> of load gates:</p>`,
        `<div class="eq">t<sub>pd</sub> = (3 + 3m)RC</div>`,
        `<p>Make the driver w times bigger: resistance R/w, diffusion 3wC. Then t<sub>pd</sub> = (3 + 3m/w)RC = (3 + 3h)RC, where the <b>fanout</b> (electrical effort) h = load capacitance ÷ input capacitance = m/w.</p>`,
        `<p>Define <b>τ = 3RC</b>, the delay of an ideal inverter driving one copy of itself with no parasitics. Then a fanout-h inverter has normalized delay <b>d = h + 1</b>. The <b>FO4</b> (fanout-of-4) inverter: d = 5, i.e. 15RC.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A process has R = 8 kΩ and C = 0.12 fF per unit transistor. What is the FO4 inverter delay?", a: 14.4, tol: 0.01, unit: "ps", hint: "15RC.", why: "RC = 0.96 ps; × 15 = 14.4 ps." },
        { t: "num", q: "A two-stage ladder: R₁ = 1 kΩ, C₁ = 10 fF, R₂ = 2 kΩ, C₂ = 5 fF. Elmore delay (with R already including ln 2)?", a: 25, tol: 0.01, unit: "ps", hint: "R₁C₁ + (R₁ + R₂)C₂.", why: "10 ps + 3 kΩ × 5 fF = 10 + 15 = 25 ps." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In the Elmore sum, why does each capacitor use only the resistance shared with the output's path?", model: "Current to charge a capacitor flows from the source through every resistor on its own path. Only the part of that path that the output also depends on delays the output: the voltage drop it causes there slows the output down. Resistance on a side branch only affects that branch's own node, not the output." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Elmore delay of real gates", mins: 25,
    blurb: "Worked NAND2: falling, rising, internal nodes. Parasitic plus effort. Layout tricks.",
    takeaway: "Worked example (2-input NAND sized for unit resistance: nMOS 2, pMOS 2; input capacitance 4C; output diffusion 6C; the uncontacted internal node 2C), loaded by h identical NAND2s (4hC): falling (both nMOS on): (2C)(R/2) + ((6 + 4h)C)(R/2 + R/2) = (7 + 4h)RC. Worst-case rising (top nMOS stays on, bottom input falls; one pMOS on): output and internal node both charge through R: (8 + 4h)RC. Internal diffusion makes delays slightly unequal even with equal resistance. Contamination delay: best case (internal nodes already discharged; or all parallel pMOS turning on at once) is faster. Every delay = parasitic delay (driving its own diffusion; size-independent to first order, because R falls as C rises) + effort delay (proportional to load / input capacitance and gate complexity). Layout matters: shared and uncontacted diffusion reduce capacitance (estimate conservatively before layout); folding a wide transistor into parallel fingers halves its diffusion capacitance. Parasitic delay of an n-input NAND grows ~n²/2 (internal nodes), so avoid more than about four series transistors.",
    steps: [
      { k: "learn", title: "Set up a NAND2", b: [
        `<p>Sized for unit resistance: nMOS 2 wide (two in series), pMOS 2 wide (parallel). Load: h identical NAND2s, each presenting 4C per input.</p>`,
        `<ul><li><b>Output node Y:</b> top nMOS drain 2C + two pMOS drains 2C + 2C = <b>6C</b>, plus the load 4hC.</li><li><b>Internal node n1</b> (between the nMOS): one shared, uncontacted diffusion: <b>2C</b>.</li><li>Sources tied to V<sub>DD</sub> or GND: irrelevant.</li></ul>`,
      ]},
      { k: "learn", title: "Falling output", b: [
        `<p>Both nMOS on, each R/2. n1 discharges through the bottom R/2; Y through both (R).</p>`,
        `<div class="eq">t<sub>pdf</sub> = (2C)(R/2) + (6 + 4h)C · R = (7 + 4h)RC</div>`,
      ]},
      { k: "learn", title: "Rising output, worst case", b: [
        `<p>Worst case: the top nMOS stays ON and the bottom input falls. One pMOS (resistance R) charges Y, <b>and</b> n1 through the still-on top nMOS. The shared path from V<sub>DD</sub> to both nodes is just the pMOS's R.</p>`,
        `<div class="eq">t<sub>pdr</sub> = (6 + 4h)C · R + (2C) · R = (8 + 4h)RC</div>`,
        `<p class="aside">The top nMOS's R/2 isn't on the shared path. It even shields n1, so the real delay is a bit less. Elmore is conservative.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "The NAND2 above drives h = 3 copies of itself. Falling delay, in units of RC?", a: 19, tol: 0.01, unit: "RC", why: "7 + 4 × 3 = 19." },
        { t: "num", q: "Same gate: in units of τ = 3RC, what is its parasitic part of the falling delay?", a: 2.333, tol: 0.02, unit: "τ", why: "The load-independent part is 7RC = 7/3 τ ≈ 2.3. Table values round this to 2." },
        { t: "mcq", q: "Contamination (fastest) falling delay of the NAND2: what's the best case?", opts: [["The bottom nMOS was already on, so n1 is already at 0, leaving only (6 + 4h)RC", true, "Internal capacitance pre-discharged."], ["Same as the worst case", false, "The internal node's state matters."], ["Half the propagation delay", false, "No simple ratio."]] },
      ]},
      { k: "learn", title: "Parasitic + effort", b: [
        `<p>Every result splits into two parts:</p>`,
        `<div class="two"><div class="tile"><h3>Parasitic delay</h3><p>Charging the gate's <b>own</b> diffusion. Size-independent to first order: wider = less R but more C.</p></div><div class="tile"><h3>Effort delay</h3><p>Proportional to <b>load ÷ input capacitance</b> and to how complex the gate is.</p></div></div>`,
        `<p>Parasitic delay of an n-input NAND grows like <b>n<sup>2</sup></b> because of all the internal nodes. Rarely use more than four transistors in series.</p>`,
      ]},
      { k: "learn", title: "Layout changes the numbers", b: [
        `<ul><li><b>Shared diffusion:</b> two parallel transistors' drains in one region count once.</li><li><b>Uncontacted diffusion</b> between series transistors is smaller.</li><li><b>Folding:</b> build a wide transistor from two half-width fingers sharing a drain: diffusion capacitance halves, and it fits a short cell.</li></ul>`,
        `<p class="aside">Before layout, assume contacted diffusion everywhere except between series transistors. That's conservative.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the NAND2's rising delay include the internal node, even though only the pMOS charges the output?", model: "In the worst case the top nMOS is still on, so the internal node is connected to the output and must be charged up along with it. All of that charge comes through the single pMOS, so its resistance is shared by the output and the internal node, and the internal capacitance adds to the delay." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const LE = { INV: [1, 1], NAND2: [4 / 3, 2], NAND3: [5 / 3, 3], NOR3: [7 / 3, 3], "MUX (tristate)": [2, 4] };
  const p6 = {
    id: "p6", title: "The linear delay model", mins: 30,
    blurb: "d = gh + p. Logical effort, electrical effort, parasitic delay. FO4 as a ruler.",
    takeaway: "Normalized delay (units of τ = 3RC): d = f + p, effort delay f = gh. Logical effort g = input capacitance of the gate ÷ input capacitance of an inverter delivering the same output current (inverter = 1). Electrical effort h = C_out/C_in (load / this gate's input; also measurable as delay-vs-fanout slope relative to an inverter). Parasitic delay p ≈ output diffusion ÷ inverter's (p_inv ≈ 1, the diffusion/gate capacitance ratio). Logical efforts: NAND (n + 2)/3 (4/3, 5/3, 6/3…); NOR (2n + 1)/3 (5/3, 7/3…); tristate/mux 2 (any width, but parasitic grows: build big muxes as trees of 4-input ones); XOR costly and input-dependent. Parasitic delays: inverter 1; n-input NAND or NOR n; tristate/mux 2n. FO4 inverter d = 5 (tpd = 15 ps if τ = 3 ps at 65 nm); FO4 is nearly constant in τ across processes (τ ≈ 0.2 FO4); rule of thumb: FO4 in ps ≈ 1/3 to 1/2 of drawn channel length in nm. Ring oscillator of N inverters: each stage d = 2, period 4Nτ, f = 1/(4Nτ); used as process monitors. Drive x = C_in/g (unit inverter = 1 unit); d = C_out/x + p. Logical effort and parasitic delay can be extracted from cell-library datasheets by fitting delay vs load.",
    steps: [
      { k: "learn", title: "Delay is a straight line", b: [
        `<div class="eq">d = f + p = gh + p</div>`,
        `<div class="tbl"><table><tbody>
          <tr><td><b>h</b> electrical effort</td><td>C<sub>out</sub>/C<sub>in</sub>: how much bigger the load is than the gate</td></tr>
          <tr><td><b>g</b> logical effort</td><td>how much worse the gate is at driving than an inverter with the same input capacitance (inverter = 1)</td></tr>
          <tr><td><b>p</b> parasitic delay</td><td>delay with no load, from its own diffusion (inverter ≈ 1)</td></tr></tbody></table></div>`,
        `<p>From Part 3's sizing: g = (gate's input C) ÷ 3. NAND2: 4/3. NAND3: 5/3. NOR3: 7/3.</p>`,
      ]},
      { k: "play", title: "Delay vs fanout", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const names = Object.keys(LE);
          let gi = 2, h = 4;
          function draw() {
            const [g, p] = LE[names[gi]], [gI, pI] = LE.INV;
            f.innerHTML = plot({ x: [0, 6], y: [0, 16], xt: [0, 1, 2, 3, 4, 5, 6], yt: [0, 4, 8, 12, 16], xl: "electrical effort h", yl: "delay d (τ)",
              series: [{ f: (x) => gI * x + pI, cls: "s5" }, { f: (x) => g * x + p, cls: "s1" }], marks: [{ x: h, y: g * h + p, label: `d = ${fmt(g * h + p, 3)}`, a: "end", dx: -10 }], texts: [{ x: 5.2, y: 6.9, s: "INV", a: "start" }], label: "Normalized delay against electrical effort" });
            ro.innerHTML = readout([["Slope = logical effort g", fmt(g, 3)], ["Intercept = parasitic delay p", fmt(p, 3)], ["Effort delay f = gh", fmt(g * h, 3)]]);
          }
          host.append(toggle(names, (i) => { gi = i; draw(); }, gi), f, slider({ id: id + "-h", label: "Electrical effort h", min: 0, max: 6, step: 0.1, value: h, show: (x) => fmt(x, 2) }, (x) => { h = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The tristate mux has logical effort 2 no matter how many inputs, but its parasitic delay grows with the input count. Big multiplexers are built as trees of 4-input ones.</p>`,
      ]},
      { k: "learn", title: "The tables", b: [
        `<div class="tbl"><table><thead><tr><th>Gate</th><th>g (n inputs)</th><th>p</th></tr></thead><tbody>
          <tr><td>Inverter</td><td>1</td><td>1</td></tr><tr><td>NAND</td><td>(n + 2)/3</td><td>n</td></tr><tr><td>NOR</td><td>(2n + 1)/3</td><td>n</td></tr><tr><td>Tristate / mux</td><td>2</td><td>2n</td></tr></tbody></table></div>`,
        `<p>NANDs beat NORs: their series transistors are fast nMOS. XOR gates are expensive.</p>`,
      ]},
      { k: "learn", title: "FO4: a ruler for delay", b: [
        `<p>A fanout-of-4 inverter: d = 1·4 + 1 = <b>5τ</b>. Most designers know their process's FO4 delay. Measured in FO4s, a circuit's delay barely changes from process to process.</p>`,
        `<p>Rule of thumb: FO4 in picoseconds ≈ <b>⅓ to ½ of the drawn channel length in nm</b>. A 65 nm process: about 16–25 ps.</p>`,
        `<p><b>Ring oscillator</b>: N inverters (N odd) in a loop, each with h = 1 so d = 2. A transition goes round twice per period: T = 2 · N · 2τ, so <b>f = 1/(4Nτ)</b>. Fabs use them to check how fast each chip came out.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 51-stage ring oscillator in a process with τ = 4 ps. Frequency?", a: 1.225, tol: 0.01, unit: "GHz", why: "1/(4 × 51 × 4 ps) = 1/816 ps = 1.23 GHz." },
        { t: "num", q: "A NAND3 drives a load 6 times its input capacitance. Delay in τ?", a: 13, tol: 0.01, why: "(5/3)(6) + 3 = 10 + 3 = 13." },
        { t: "mcq", q: "A marketing sheet quotes “gate delay = 2τ”. What's going on?", opts: [["It's an unloaded ring-oscillator stage; real critical-path gates are more like 5–6τ", true, "Always ask for the FO4 delay."], ["The process is unusually fast", false, "It's a definition trick."], ["It's the FO4 delay", false, "FO4 is 5τ."]] },
      ]},
      { k: "learn", title: "Drive", b: [
        `<p>Cell libraries label gates by <b>drive</b>: inv_1x, inv_8x, nand2_1x (same output current as inv_1x). With a unit inverter's input capacitance as 1:</p>`,
        `<div class="eq">x = C<sub>in</sub>/g     d = C<sub>out</sub>/x + p</div>`,
        `<p class="aside">You can read g and p off a datasheet: fit delay vs load to a line and divide by τ. Real libraries come out close to the theory (slightly better NANDs, slightly worse parasitics from internal wires).</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does it mean that a NOR3 has logical effort 7/3?", model: "To deliver the same output current as an inverter, a NOR3 needs 7 units of input capacitance on each input instead of 3, because its three series pMOS must each be six times wide. So for the same input load it's 7/3 times worse at driving: its delay rises 7/3 times as fast with load." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Where the linear model bends", mins: 20,
    blurb: "Input slopes, simultaneous inputs, velocity saturation, supply voltage, bootstrapping.",
    takeaway: "Limitations of the linear delay model: (1) input slope is the biggest error: slower inputs give more delay (roughly linear in rise time), but well-designed paths with equal stage efforts have consistent slopes; (2) input arrival: simultaneous inputs to a series stack slow it slightly, to a parallel stack speed it up; delays differ by input; (3) velocity saturation: N series transistors ≈ one with N× length; I_dsat ratio = (V_DD − V_t + V_c)/(V_DD − V_t + NV_c), so series stacks need less than N× width and NAND/NOR logical efforts are lower (book 65 nm: NAND3 ≈ 1.40, NOR3 ≈ 2); (4) voltage: τ ∝ C V_DD/(V_DD − V_t)^α (α-power), or ∝ C/(1 − V_t*/V_DD) for velocity saturation (V_DD can drop with V_t at no delay cost); below threshold τ ∝ C V_DD/(I_off 10^(V_DD/S)); (5) gate-source capacitance must be recharged as stack sources move; (6) bootstrapping: gate-drain capacitance is effectively doubled for delay (input and output move opposite ways); in a high-gain amplifier this is the Miller effect.",
    steps: [
      { k: "learn", title: "Slopes and simultaneous inputs", b: [
        `<p><b>Input slope</b> is the biggest error. A slow input leaves the driving transistor half-on and fighting, so delay rises, roughly linearly with input rise time. Good news: paths sized with equal efforts (next part) have similar slopes everywhere.</p>`,
        `<p><b>Simultaneous inputs:</b> two series transistors turning on together are slower than predicted (both half-on); two parallel ones are faster (both help). Delay also depends on which input switches.</p>`,
      ]},
      { k: "learn", title: "Velocity saturation helps stacks", b: [
        `<p>N transistors in series act like one with N times the length. Each sees a smaller field and is less velocity saturated:</p>`,
        `<div class="eq">I<sub>dsat, N in series</sub> / I<sub>dsat, one</sub> = (V<sub>DD</sub> − V<sub>t</sub> + V<sub>c</sub>) / (V<sub>DD</sub> − V<sub>t</sub> + N V<sub>c</sub>)</div>`,
        `<p>Not velocity saturated (V<sub>c</sub> huge): 1/N. Fully saturated (V<sub>c</sub> → 0): 1, no penalty at all. Reality is between, so stacks need less than N× width and NANDs and NORs have lower logical effort than the tables say.</p>`,
        seenV("V_c = E_c·L, the critical voltage.", "02-mos-transistor.html#p4", "Chapter 2, Part 4"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "V_DD = 0.9 V, V_t = 0.3 V, V_c = 0.8 V. Current of 2 nMOS in series relative to one?", a: 0.636, tol: 0.01, hint: "(0.6 + 0.8)/(0.6 + 1.6).", why: "1.4/2.2 = 0.64, not 0.5." },
      ]},
      { k: "play", title: "Delay vs supply voltage", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 1.3, Vt = 0.3;
          function draw() {
            const tau = (v) => (v > Vt + 0.02 ? v / Math.pow(v - Vt, a) : NaN), ref = tau(1.0);
            f.innerHTML = plot({ x: [0.4, 1.4], y: [0, 4], xt: [0.4, 0.6, 0.8, 1, 1.2, 1.4], yt: [0, 1, 2, 3, 4], xl: "V_DD (V)", yl: "delay relative to V_DD = 1 V", series: [{ f: (v) => tau(v) / ref, cls: "s1" }, { f: () => 1, cls: "s5" }], label: "Gate delay against supply voltage" });
            ro.innerHTML = readout([["At 0.8 V", fmt(tau(0.8) / ref, 3) + "×"], ["At 1.2 V", fmt(tau(1.2) / ref, 3) + "×"], ["Energy per switch ∝ V_DD² at 0.8 V", fmt(0.64, 3) + "×"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "α (2 = square law, 1 = fully velocity saturated)", min: 1, max: 2, step: 0.05, value: a, show: (x) => fmt(x, 3) }, (x) => { a = x; draw(); }).el,
            slider({ id: id + "-v", label: "Threshold V_t", min: 0.1, max: 0.45, step: 0.01, value: Vt, show: (x) => fmt(x, 2) + " V" }, (x) => { Vt = x; draw(); }).el, ro);
          draw();
        },
        `<div class="eq">τ ∝ C V<sub>DD</sub> / (V<sub>DD</sub> − V<sub>t</sub>)<sup>α</sup></div>`,
        `<p class="aside">Delay explodes as V<sub>DD</sub> approaches V<sub>t</sub>. Above that, raising V<sub>DD</sub> helps less and less, especially at small α. Below threshold, delay depends on the exponential subthreshold current instead.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "α = 1.3, V_t = 0.3 V. By what factor does delay grow when V_DD drops from 1.0 to 0.8 V?", a: 1.239, tol: 0.01, hint: "(0.8/0.5^1.3) ÷ (1.0/0.7^1.3).", why: "0.8 × (0.7/0.5)^1.3 = 0.8 × 1.549 = 1.24: 24% slower for 36% less switching energy." },
      ]},
      { k: "learn", title: "Two capacitance surprises", b: [
        `<p><b>Gate-source capacitance:</b> in a stack, a transistor's source moves as the node below it discharges, and its C<sub>gs</sub> must be recharged too. Stacks are slower than Elmore with fixed capacitors says.</p>`,
        `<p><b>Bootstrapping:</b> gate-to-drain capacitance couples input and output, which move in <b>opposite</b> directions. The voltage across it changes twice as much, so for delay it counts double. You can even see the output bump the wrong way at first. In an amplifier with gain A, it's multiplied by about A: the <b>Miller effect</b>.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a capacitor from input to output slow a gate more than the same capacitor from input to ground?", model: "When the input rises the output falls, so the voltage across an input-to-output capacitor changes by about twice the swing, and the input driver must supply twice the charge. A capacitor to ground only sees the input's own swing. So the coupling capacitor acts like double the capacitance." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  /* Fixed example path: NAND2 → (branch ×2) NAND3 → INV → C_out. */
  function pathCalc(Cout, upsize) {
    const g = [4 / 3, 5 / 3, 1], p = [2, 3, 1], Cin = 6, B = 2, G = g[0] * g[1] * g[2], H = Cout / Cin, F = G * B * H, fh = Math.cbrt(F);
    const y = (Cout * g[2]) / fh, z = (y * g[1]) / fh, check = (B * z * g[0]) / fh;
    const z2 = upsize ? 2 * z : z;
    const d = [g[0] * (B * z2) / Cin + p[0], g[1] * y / z2 + p[1], (g[2] * Cout) / y + p[2]];
    return { G, H, F, fh, y, z, check, d, D: d[0] + d[1] + d[2], Dopt: 3 * fh + 6 };
  }
  function pathSvg(r) {
    let s = "";
    const box = (x, lab, sz) => `<rect x="${x - 34}" y="62" width="68" height="40" rx="8" style="fill:var(--card);stroke:var(--ink)"/>` + S.t(x, 80, lab, { cls: "s" }) + S.t(x, 96, sz, { cls: "s a" });
    s += S.t(16, 86, "C_in = 6", { a: "start", cls: "s" }) + `<line x1="70" y1="82" x2="96" y2="82" style="stroke:var(--ink)"/>`;
    s += box(130, "NAND2", "6") + `<line x1="164" y1="82" x2="196" y2="82" style="stroke:var(--ink)"/><line x1="180" y1="82" x2="180" y2="136" style="stroke:var(--muted)"/>`;
    s += `<rect x="136" y="136" width="88" height="28" rx="8" style="fill:none;stroke:var(--muted);stroke-dasharray:4 3"/>` + S.t(180, 154, "2nd NAND3", { cls: "s m" });
    s += box(230, "NAND3", fmt(r.z, 3)) + `<line x1="264" y1="82" x2="296" y2="82" style="stroke:var(--ink)"/>` + box(330, "INV", fmt(r.y, 3)) + `<line x1="364" y1="82" x2="390" y2="82" style="stroke:var(--ink)"/>` + S.t(410, 70, "C_out", { a: "end", cls: "s" });
    s += S.t(130, 40, `d = ${fmt(r.d[0], 3)}`, { cls: "s m" }) + S.t(230, 40, `d = ${fmt(r.d[1], 3)}`, { cls: "s m" }) + S.t(330, 40, `d = ${fmt(r.d[2], 3)}`, { cls: "s m" });
    return S.svg(420, 176, s, { max: 440, label: "Three-stage path with input capacitances" });
  }
  const p8 = {
    id: "p8", title: "Logical effort of a path", mins: 35,
    blurb: "F = GBH. Equal effort per stage. Size backwards from the load.",
    takeaway: "For a path: path logical effort G = Πg_i (independent of sizes); path electrical effort H = C_out(path)/C_in(path); branching effort b = (C_onpath + C_offpath)/C_onpath at each fork, B = Πb_i; path effort F = GBH (= Πf_i; F ≠ GH when paths branch). Path delay D = Σd_i = D_F + P with P = Σp_i. Since the product of stage efforts is fixed, their sum is minimized when all are equal: f̂ = F^(1/N), so D = N·F^(1/N) + P: the minimum delay is known without choosing any sizes. Sizes: work backwards with the capacitance transformation C_in,i = C_out,i·g_i/f̂, and check the first stage matches its input spec. Upsizing any gate except the first only slows the path (it loads its predecessor); upsizing the first loads the previous block, which is why block specs include input capacitance (or driver resistance). Book's worked example: NAND2–NAND3–NOR2 with branches, F = 125, f̂ = 5, D = 22τ = 4.4 FO4.",
    steps: [
      { k: "learn", title: "Path versions of everything", b: [
        `<div class="tbl"><table><tbody>
          <tr><td>Path logical effort</td><td>G = Π g<sub>i</sub></td></tr>
          <tr><td>Path electrical effort</td><td>H = C<sub>out(path)</sub> / C<sub>in(path)</sub></td></tr>
          <tr><td>Branching effort</td><td>b = (C<sub>on path</sub> + C<sub>off path</sub>) / C<sub>on path</sub>,  B = Π b<sub>i</sub></td></tr>
          <tr><td>Path effort</td><td><b>F = GBH</b></td></tr>
          <tr><td>Path parasitic delay</td><td>P = Σ p<sub>i</sub></td></tr></tbody></table></div>`,
        `<p class="aside">Why B? If a gate drives two identical gates but only one is on our path, it must drive twice the capacitance our path “sees”. Without B, F = GH undercounts.</p>`,
      ]},
      { k: "learn", title: "The key result", b: [
        `<p>The stage efforts multiply to F no matter how you size the gates. A sum of numbers with a fixed product is smallest when they're all <b>equal</b>:</p>`,
        `<div class="eq">f̂ = F<sup>1/N</sup>     D = N F<sup>1/N</sup> + P</div>`,
        `<p>So you know the <b>best possible delay before choosing any sizes</b>. Then size backwards from the load:</p>`,
        `<div class="eq">C<sub>in,i</sub> = C<sub>out,i</sub> · g<sub>i</sub> / f̂</div>`,
        mathLink("Minimizing with derivatives (the same result falls out of setting ∂D/∂f = 0):", "13-derivatives.html", "Math 13"),
      ]},
      { k: "play", title: "Size a path", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let Cout = 120, up = 0;
          function draw() {
            const r = pathCalc(Cout, up);
            f.innerHTML = pathSvg(r);
            ro.innerHTML = readout([["G = (4/3)(5/3)(1)", fmt(r.G, 3)], ["B (NAND2 drives two NAND3s)", "2"], ["H = C_out / 6", fmt(r.H, 3)], ["F = GBH", fmt(r.F, 3)], ["Best stage effort f̂ = F^(1/3)", fmt(r.fh, 3)], ["Best delay 3f̂ + P (P = 2+3+1)", fmt(r.Dopt, 3) + " τ"], ["Delay with these sizes", fmt(r.D, 3) + " τ"], ["Check: first stage size from the backward pass", fmt(r.check, 3) + " (should be 6)"]]);
            vd.className = "verdict " + (up ? "no" : "ok"); vd.textContent = up ? "Doubling the NAND3 sped it up but loaded the NAND2 more: the path got slower." : "Equal stage efforts: the minimum delay.";
          }
          host.append(f, slider({ id: id + "-c", label: "Load C_out (unit-inverter capacitances × 3)", min: 18, max: 600, log: true, value: Cout, show: (x) => fmt(x, 3) }, (x) => { Cout = x; draw(); }).el,
            toggle(["Sized by logical effort", "Make the NAND3s 2× bigger"], (i) => { up = i; draw(); }), vd, ro);
          draw();
        },
        `<p class="aside">Gate sizes are input capacitances, in the same units as C<sub>in</sub> = 6 and C<sub>out</sub>. With optimal sizes, every stage's delay is f̂ plus its own p.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A path: INV → NAND2 → INV, no branches, C_in = 4, C_out = 96. What is the path effort F?", a: 32, tol: 0.01, hint: "G = 4/3, H = 24.", why: "(4/3) × 24 = 32." },
        { t: "num", q: "Same path: minimum delay in τ? (P = 1 + 2 + 1)", a: 13.524, tol: 0.02, hint: "3 × 32^(1/3) + 4.", why: "32^(1/3) = 3.17; 3 × 3.17 + 4 = 13.5." },
        { t: "mcq", q: "A designer upsizes the last gate on her critical path to make it faster. Likely result?", opts: [["The path gets slower: the bigger gate loads the stage before it", true, "Unless the efforts were unbalanced, upsizing only moves delay upstream."], ["The path gets faster", false, "Only if that stage had more than its share of effort."], ["No change", false, "It changes two stages' delays."]] },
      ]},
      { k: "why", title: "A real-world story", b: [
        `<p>On one large microprocessor, engineers kept upsizing their own gates until their paths met timing. Each week's full-chip timing run then showed their <b>inputs</b> arriving later, because the bigger gates loaded the blocks feeding them. Timing never converged until each block's spec included not just arrival times but the <b>driver resistance</b> of the previous block.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does giving every stage the same effort minimize the path delay?", model: "The stage efforts multiply to a fixed number, the path effort F, whatever sizes you choose. If one stage has a bigger effort than another, you can shrink the difference: the larger term falls faster than the smaller one grows, so the sum drops. The sum is smallest when all the efforts are equal, each the Nth root of F." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "How many stages?", mins: 25,
    blurb: "Fewer stages isn't faster. The best stage effort is about 4, and near it nothing much matters.",
    takeaway: "Counting “gate delays” is misleading: a stage's delay depends on its effort. Adding inverters to the end of a path (only polarity changes) adds parasitic delay but lowers stage effort: D = N·F^(1/N) + Σp_i + (N − n₁)p_inv. Minimizing gives p_inv + ρ(1 − ln ρ) = 0 with best stage effort ρ = F^(1/N̂): ρ = e ≈ 2.718 with no parasitics, ρ ≈ 3.59 for p_inv = 1. Use ρ = 4 as a convenient choice: N̂ = log₄F (within 2% of best for p_inv 0.7–2.5). The optimum is flat: stage efforts 2.4–6 (N within 2/3 to 3/2 of best) stay within 15% of minimum delay. Efforts somewhat above 4 save area and power; above 6–8 cost real speed. A well-designed path takes about log₄F FO4 delays: each 4× of load adds about one FO4; fanning a control signal out to a 64-bit datapath costs ~3 FO4. The book's example: a unit inverter driving 64 loads: 1 stage D = 65, 2: 18, 3: 15, 4: 15.3. Its decoder example (16 words × 32 bits) compares designs by spreadsheet: a 4-stage NAND2–INV–NAND2–INV beats 3-stage INV–NAND4–INV by 12%, at more area and power. Practical limits: about four series transistors per gate and four mux inputs; NANDs and inverters before big branches; buffer non-critical legs of a fork.",
    steps: [
      { k: "learn", title: "Fewer stages ≠ faster", b: [
        `<p>Logic designers often count “gate delays” and try to minimize them. But a stage driving a huge load is slow. Adding an inverter adds its parasitic delay but cuts everyone's effort.</p>`,
        `<p>For a chain of N inverters driving path effort F: D = N F<sup>1/N</sup> + N p<sub>inv</sub>.</p>`,
      ]},
      { k: "play", title: "Delay vs number of stages", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let F = 64, pinv = 1;
          function draw() {
            const D = (n) => n * Math.pow(F, 1 / n) + n * pinv, pts = [];
            let best = 1; for (let n = 1; n <= 8; n++) { pts.push([n, D(n)]); if (D(n) < D(best)) best = n; }
            const ymax = Math.min(80, Math.ceil(Math.max(D(1), D(8)) / 20) * 20);
            f.innerHTML = plot({ x: [1, 8], y: [0, ymax], xt: [1, 2, 3, 4, 5, 6, 7, 8], yt: [0, ymax / 4, ymax / 2, (3 * ymax) / 4, ymax], xl: "number of stages N", yl: "path delay D (τ)", series: [{ pts, cls: "s1" }], marks: [{ x: best, y: D(best), label: `best: N = ${best}`, dy: -14 }], label: "Path delay against number of stages" });
            ro.innerHTML = readout([["log₄ F", fmt(Math.log(F) / Math.log(4), 3)], ["Best N", String(best)], ["Stage effort at best N", fmt(Math.pow(F, 1 / best), 3)], ["Delay at best N", fmt(D(best), 3) + " τ"]]);
          }
          host.append(f, slider({ id: id + "-f", label: "Path effort F", min: 4, max: 256, log: true, value: F, show: (x) => fmt(x, 3) }, (x) => { F = x; draw(); }).el,
            slider({ id: id + "-p", label: "Inverter parasitic delay p_inv", min: 0, max: 2, step: 0.05, value: pinv, show: (x) => fmt(x, 2) }, (x) => { pinv = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">F = 64 (a unit inverter driving 64 loads): one stage takes 65τ, three take 15τ. Set p<sub>inv</sub> = 0: the best stage effort becomes e ≈ 2.7. Notice how flat the bottom of the curve is.</p>`,
      ]},
      { k: "learn", title: "The best stage effort", b: [
        `<p>Calculus on D gives the best stage effort ρ, solving p<sub>inv</sub> + ρ(1 − ln ρ) = 0:</p>`,
        `<ul><li>p<sub>inv</sub> = 0: ρ = e ≈ 2.72 (the classic result).</li><li>p<sub>inv</sub> = 1: ρ ≈ 3.59.</li></ul>`,
        `<div class="key">Use <b>ρ = 4</b>: N̂ = log<sub>4</sub> F. Within 2% of optimal for any realistic p<sub>inv</sub>. Stage efforts from 2.4 to 6 stay within 15% of the best delay. That's why an FO4 inverter is the “typical” gate delay.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A chain of inverters must drive a path effort F = 256 (p_inv = 1). Delay with 4 stages, in τ?", a: 20, tol: 0.01, why: "256^(1/4) = 4; 4 × 4 + 4 = 20." },
        { t: "num", q: "Roughly how many FO4 delays does a well-designed path with F = 1024 take?", a: 5, tol: 0.05, hint: "log₄ F.", why: "log₄ 1024 = 5." },
      ]},
      { k: "learn", title: "Rules of thumb", b: [
        `<ul><li>Path delay ≈ log<sub>4</sub>F FO4s: each 4× load adds one FO4. Fanning a control signal to a 64-bit datapath costs about 3 FO4.</li><li>Efforts a bit above 4 save area and power for little speed; above 6–8 is costly.</li><li>Gates: at most ~4 series transistors, ~4 mux inputs. Beyond that, split into stages.</li><li>Put inverters or NAND2s (low g) before large branches; keep gates after the branch small.</li><li>If one leg of a fork is critical, buffer the other legs so they load it less.</li><li>Don't bother sizing to 3 significant figures: the optimum is flat.</li></ul>`,
        `<p class="aside">The book's decoder example compares eight designs in a spreadsheet in minutes. A 4-stage NAND2–INV–NAND2–INV wins by 12% over a 3-stage design, but the 3-stage one is smaller and lower power. That trade-off is your call.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can adding two inverters to a path make it faster?", model: "Each stage's delay grows with the effort it bears. If a few stages are driving a very large path effort, each has a huge effort and is slow. Adding inverters spreads the same total effort over more stages; their efforts fall as the Nth root, which outweighs the small parasitic delay each added inverter brings, until each stage's effort is around four." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const NL_C = [1, 2, 4, 8], NL_S = [10, 20, 40, 80];
  const nldm = (C, s) => Math.round((8 + 6.5 * C + 0.12 * s + 0.01 * C * s + 0.0006 * s * s) * 10) / 10;
  function interp(C, s) {
    const seg = (arr, v) => { for (let i = 0; i < arr.length - 1; i++) if (v <= arr[i + 1]) return i; return arr.length - 2; };
    const i = seg(NL_C, C), j = seg(NL_S, s), tc = (C - NL_C[i]) / (NL_C[i + 1] - NL_C[i]), ts = (s - NL_S[j]) / (NL_S[j + 1] - NL_S[j]);
    const a = nldm(NL_C[i], NL_S[j]), b = nldm(NL_C[i], NL_S[j + 1]), c = nldm(NL_C[i + 1], NL_S[j]), d = nldm(NL_C[i + 1], NL_S[j + 1]);
    return { v: a * (1 - tc) * (1 - ts) + b * (1 - tc) * ts + c * tc * (1 - ts) + d * tc * ts, i, j };
  }
  const p10 = {
    id: "p10", title: "Sizing by computer, and timing models", mins: 25,
    blurb: "When paths reconverge, let a solver size them. How timing tools model each cell.",
    takeaway: "Iterative sizing: write each gate's delay d_i = p_i + (Σ load)/x_i and arrival times a_i = max(fan-in) + d_i, then minimize the latest arrival with a solver; the problem is convex (posynomial: geometric programming), so the optimum is unique. Lessons: in paths that branch, each fork should contribute equal delay; stage efforts are equal except after fixed loads (wires); upsize gates driving large fixed capacitances. Libraries with drive steps of 2× (1x, 2x, 4x, 8x) lose only ~2% vs continuous sizes. Timing-analysis models (stored in Liberty .lib files with area, power, noise): slope-based linear model (intrinsic + resistance × capacitance + slope × previous delay), largely superseded; nonlinear delay model (NLDM): tables of delay and output slope vs load capacitance and input slope, separate for rise/fall, interpolated; per voltage and temperature corner; can't model complex RC loads or noise well. Current source models (CCS stores output current vs time; ECSM stores output voltage vs time) let the analyzer integrate into arbitrary RC networks. Pitfalls: quoting unloaded gate delays; upsizing to fix a path; using as few stages as possible. History: cycle times fell from ~100 FO4 (early CPUs) to <20 (Alpha, early 1990s), ~10 (Pentium 4, 20–30 pipeline stages, ~100 W); then back to ~19–24 FO4 for power efficiency; ASICs 40–100 FO4 (~25 when critical).",
    steps: [
      { k: "learn", title: "Let a solver do it", b: [
        `<p>Real paths reconverge, branch unevenly, and drive wires mid-path. Back-of-envelope logical effort breaks down. Instead, write every gate's delay in terms of its drive x<sub>i</sub>:</p>`,
        `<div class="eq">d<sub>i</sub> = p<sub>i</sub> + (load on its output) / x<sub>i</sub>     a<sub>i</sub> = max(inputs' a) + d<sub>i</sub></div>`,
        `<p>Minimize the latest output arrival. This problem is <b>convex</b>: one optimum, no wrong answers, and fast special methods (geometric programming).</p>`,
        `<ul><li>Forks should contribute <b>equal</b> delay (otherwise shrink the fast leg).</li><li>Stage efforts are equal, except right after a fixed load like a wire.</li><li>Upsize gates that drive big fixed loads.</li><li>A library with sizes in steps of 2× loses only ~2%.</li></ul>`,
      ]},
      { k: "learn", title: "Timing models in real tools", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>Slope-based linear</b></td><td>intrinsic + resistance × load + slope × previous delay. Mostly retired.</td></tr>
          <tr><td><b>Nonlinear delay model (NLDM)</b></td><td>look up delay and output slope in a table indexed by <b>load</b> and <b>input slope</b>; interpolate between entries. Separate tables for rising and falling, and per voltage/temperature corner.</td></tr>
          <tr><td><b>Current source models</b></td><td>store the output current (CCS) or voltage (ECSM) vs time, so the tool can drive any RC network accurately.</td></tr></tbody></table></div>`,
        `<p class="aside">These live in each library's <code>.lib</code> (Liberty) files, along with area, power and noise data.</p>`,
      ]},
      { k: "play", title: "Interpolate an NLDM table", b: [
        (host, id) => {
          const tb = el(`<div class="tbl"></div>`), ro = el(`<div></div>`);
          let C = 3, s = 30;
          function draw() {
            const r = interp(C, s);
            let h = `<table><thead><tr><th>C<sub>out</sub> \\ input slope</th>${NL_S.map((x) => `<th>${x} ps</th>`).join("")}</tr></thead><tbody>`;
            NL_C.forEach((c, i) => { h += `<tr><td><b>${c} fF</b></td>${NL_S.map((x, j) => { const hot = (i === r.i || i === r.i + 1) && (j === r.j || j === r.j + 1); return `<td${hot ? ' style="background:var(--accent-soft)"' : ""}>${nldm(c, x)}</td>`; }).join("")}</tr>`; });
            tb.innerHTML = h + "</tbody></table>";
            ro.innerHTML = readout([["Interpolated falling delay", fmt(r.v, 3) + " ps"]]);
          }
          host.append(tb, slider({ id: id + "-c", label: "Load capacitance", min: 1, max: 8, step: 0.1, value: C, show: (x) => fmt(x, 2) + " fF" }, (x) => { C = x; draw(); }).el,
            slider({ id: id + "-s", label: "Input slope (rise time)", min: 10, max: 80, step: 1, value: s, show: (x) => x + " ps" }, (x) => { s = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">An invented inverter table (falling delay, ps). The tool finds the four surrounding entries (highlighted) and blends them.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "From the table: load 3 fF, input slope exactly 20 ps. What delay does linear interpolation give?", a: 30.7, tol: 0.01, unit: "ps", hint: "Halfway between the 2 fF and 4 fF entries in the 20 ps column.", why: "(24.0 + 37.4) / 2 = 30.7 ps." },
      ]},
      { k: "check", title: "Pitfalls", b: [
        { t: "sort", q: "Sound reasoning or pitfall?", bins: ["Sound", "Pitfall"], items: [
          ["“Our gate delay is 2τ” (an unloaded ring-oscillator stage)", 1, "Real critical-path gates are 5–6τ. Ask for FO4."],
          ["“Make every transistor bigger and the chip gets faster”", 1, "Bigger gates load their drivers."],
          ["“Fewest stages of logic means fastest”", 1, "Stage count isn't delay; effort is."],
          ["“This path's stage efforts are about 4 each, so it's near optimal”", 0, "That's the logical-effort result."],
          ["“Express cycle time in FO4s to compare designs across processes”", 0, "FO4 is nearly process-independent."],
        ]},
      ]},
      { k: "why", title: "FO4s per clock cycle", b: [
        `<p>Early microprocessors used about <b>100 FO4</b> delays per cycle. DEC's Alpha in the early 1990s showed under 20 was possible, starting a clock-speed race. The Pentium 4 hit about <b>10 FO4</b>, with 20–30 pipeline stages and nearly 100 W. Power then pushed designs back to around <b>19–24 FO4</b>. ASICs typically run 40–100 FO4 per cycle, because they're easier to design that way.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a nonlinear delay model capture that d = gh + p doesn't?", model: "It stores measured delays and output slopes for each cell as a table indexed by both load capacitance and input slope, separately for rising and falling outputs. So it captures the input-slope effect and any nonlinearity in the load dependence, which the straight-line model ignores, by interpolating between table entries." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "vlsi4", eyebrow: "CMOS VLSI · Chapter 4", title: "Delay",
    intro: `<p>Ten parts: delay definitions and timing analysis, the transient response, the RC model, Elmore delay, gate delays, the linear delay model, its limits, logical effort of paths, choosing the number of stages, and computer sizing with timing models.</p><p>This is one of the most useful chapters in the book: logical effort lets you design fast circuits on the back of an envelope. You'll use 6.002's RC transients (Chapter 10) and Chapter 2's transistor model. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. Most are logical-effort problems: draw the path, write G, B and H, then size backwards. Work to 2 significant figures.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10],
    summary: `
      <h3>Definitions</h3>
      <p>t<sub>pd</sub> max 50%→50%; t<sub>cd</sub> min; t<sub>r</sub> 20→80%; arrival a<sub>i</sub> = max(a<sub>j</sub>) + t<sub>pd,i</sub>; slack = required − arrival.</p>
      <h3>RC model</h3>
      <p>Unit nMOS R, pMOS 2R; k-wide → R/k, kC. Series k → k× wide. t<sub>pd</sub> = RC (ln 2 absorbed). Elmore: t<sub>pd</sub> = Σ R<sub>is</sub>C<sub>i</sub>. Inverter fanout h: (3 + 3h)RC.</p>
      <h3>Linear delay model</h3>
      <div class="eq">d = gh + p     τ = 3RC     FO4 = 5τ</div>
      <p>g: INV 1, NAND (n+2)/3, NOR (2n+1)/3, mux 2. p: INV 1, NAND/NOR n, mux 2n. Ring oscillator f = 1/(4Nτ).</p>
      <h3>Paths</h3>
      <div class="eq">F = GBH     f̂ = F<sup>1/N</sup>     D = N F<sup>1/N</sup> + P     C<sub>in,i</sub> = C<sub>out,i</sub> g<sub>i</sub>/f̂</div>
      <p>Best stage effort ≈ 4: N̂ = log<sub>4</sub>F. Efforts 2.4–6 within 15%. Path ≈ log<sub>4</sub>F FO4s.</p>
      <h3>Limits and tools</h3>
      <p>Input slope, simultaneous inputs, velocity saturation (stacks faster), τ ∝ V<sub>DD</sub>/(V<sub>DD</sub> − V<sub>t</sub>)<sup>α</sup>, bootstrapping/Miller. Convex sizing by solver; NLDM tables; current source models.</p>`,
  };
  Course.start(window.CHAPTER);
})();
