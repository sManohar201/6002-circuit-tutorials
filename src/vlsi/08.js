(function () {
  const { S, plot, slider, toggle, el } = Course;
  const seenV = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const pre = (t) => `<pre class="code">${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`;

  /* ---------- widgets ---------- */
  function rcWidget(host) {
    let R = 2, C = 100;
    const out = el(`<div></div>`);
    const vin = (t) => (t < 100 ? 0 : t < 150 ? (t - 100) / 50 : 1);
    const draw = () => {
      const tau = R * C; // kΩ × fF = ps
      const pts = []; let v = 0; const dt = 0.5;
      for (let t = 0; t <= 1000; t += dt) { if (t % 5 === 0) pts.push([t, v]); v += ((vin(t) - v) / tau) * dt; }
      out.innerHTML = `<div class="fig">${plot({ x: [0, 1000], y: [0, 1.1], xt: [0, 200, 400, 600, 800, 1000], yt: [0, 0.5, 1], xl: "t (ps)", yl: "V", h: 220, series: [{ f: vin, cls: "s3" }, { pts, cls: "s1" }], label: "RC response to a PWL input" })}</div><p>τ = RC = ${R} kΩ × ${C} fF = <b>${tau} ps</b>. The output (solid) chases the input (dashed) with that time constant.</p>`;
    };
    host.append(slider({ id: "v8R", label: "R1", min: 0.5, max: 5, step: 0.5, value: R, show: (x) => x + " kΩ" }, (x) => { R = x; draw(); }).el, slider({ id: "v8C", label: "C1", min: 20, max: 200, step: 10, value: C, show: (x) => Math.round(x) + " fF" }, (x) => { C = Math.round(x); draw(); }).el, out); draw();
  }
  function pulseWidget(host) {
    let tr = 100, pw = 300, per = 800;
    const out = el(`<div></div>`);
    const draw = () => {
      const td = 0, f = (t) => { const tt = (t - td) % per; return tt < tr ? tt / tr : tt < tr + pw ? 1 : tt < tr + pw + tr ? 1 - (tt - tr - pw) / tr : 0; };
      const high = tr / 2 + pw + tr / 2;
      out.innerHTML = `<p class="mono">Vck clk gnd PULSE 0 1 0ps ${tr}ps ${tr}ps ${pw}ps ${per}ps</p><div class="fig">${plot({ x: [0, 1600], y: [-0.1, 1.2], xt: [0, 400, 800, 1200, 1600], yt: [0, 1], xl: "t (ps)", h: 180, series: [{ f, cls: "s1", n: 800 }], label: "Pulse source waveform" })}</div><p>Time above 50%: ${high} ps of ${per} ps = <b>${((100 * high) / per).toFixed(0)}% duty cycle</b>.</p>`;
    };
    host.append(slider({ id: "v8tr", label: "tr = tf", min: 0, max: 200, step: 10, value: tr, show: (x) => Math.round(x) + " ps" }, (x) => { tr = Math.round(x); draw(); }).el, slider({ id: "v8pw", label: "pw", min: 100, max: 700, step: 10, value: pw, show: (x) => Math.round(x) + " ps" }, (x) => { pw = Math.round(x); draw(); }).el, out); draw();
  }
  function pnWidget(host) {
    const k = 2.87, out = el(`<div></div>`);
    const tf = (r) => (1 + r) / 3.87 * 17.9 / 1, tr = (r) => (k * (1 + r)) / r / 3.87 * 17.9; // normalized so both = 17.9 ps at r = 2.87
    const avg = (r) => (tf(r) + tr(r)) / 2;
    const draw = (r) => {
      out.innerHTML = `<div class="fig">${plot({ x: [1, 4], y: [10, 30], xt: [1, 1.5, 2, 2.5, 3, 3.5, 4], yt: [10, 15, 20, 25, 30], xl: "P/N ratio", yl: "ps", h: 230, series: [{ f: tr, cls: "s2" }, { f: tf, cls: "s3" }, { f: avg, cls: "s1" }], marks: [{ x: r, y: avg(r), label: `avg ${avg(r).toFixed(1)}`, dy: -12 }], label: "Rise, fall and average delay versus P/N ratio" })}</div><p>P/N = ${r.toFixed(2)}: rising ${tr(r).toFixed(1)} ps, falling ${tf(r).toFixed(1)} ps, average <b>${avg(r).toFixed(1)} ps</b>.</p><p class="aside">A simple RC sketch (pMOS ≈ 2.87× the resistance of nMOS, load ∝ total width), scaled to the book's 17.9 ps at equal delay. HSPICE's real answers: equal delay at 2.87:1; least average delay at 1.79:1 (this sketch: √2.87 ≈ 1.69); anything from 1.5 to 2.2 within 0.2 ps of best.</p>`;
    };
    host.append(slider({ id: "v8pn", label: "P/N ratio", min: 1, max: 4, step: 0.05, value: 2, show: (x) => x.toFixed(2) + ":1" }, draw).el, out); draw(2);
  }
  function level1(host) {
    const KP = 155e-6, VTO = 0.4, LAMBDA = 0.2, W = 100e-9, L = 50e-9;
    const ids = (vgs, vds) => { const vov = vgs - VTO; if (vov <= 0) return 0; const b = KP * (W / L); return vds < vov ? b * (vov - vds / 2) * vds * (1 + LAMBDA * vds) : (b / 2) * vov * vov * (1 + LAMBDA * vds); };
    const out = el(`<div></div>`);
    const series = [0.4, 0.6, 0.8, 1.0].map((g, i) => ({ f: (v) => ids(g, v) * 1e6, cls: "s" + (i + 1) }));
    out.innerHTML = `<div class="fig">${plot({ x: [0, 1], y: [0, 80], xt: [0, 0.2, 0.4, 0.6, 0.8, 1], yt: [0, 20, 40, 60, 80], xl: "V_ds (V)", yl: "µA", h: 240, series, texts: [{ x: 0.62, y: 72, s: "V_gs = 1.0" }, { x: 0.82, y: 35, s: "0.8" }, { x: 0.82, y: 11, s: "0.6" }], label: "Level 1 I-V curves" })}</div><p>Level 1 with the book's sample parameters (KP = 155 µA/V², VTO = 0.4 V, LAMBDA = 0.2/V), W/L = 100/50 nm. Square-law in V<sub>gs</sub> − V<sub>t</sub>: compare the real 65 nm curves, which are nearly <i>linear</i> in V<sub>gs</sub> (velocity saturation).</p>`;
    host.append(out);
  }
  function vtExtract(host) {
    // a smooth illustrative Ids–Vgs (Vds = 0.1 V): subthreshold exponential blended into a linear region with mobility roll-off
    const n = 1.5, phit = 0.0259, Vt0 = 0.38, k = 400e-6;
    const ids = (v) => { const x = (v - Vt0) / (n * phit); const soft = n * phit * Math.log(1 + Math.exp(x)); return (k * soft * 0.1) / (1 + 1.2 * soft); };
    let best = 0, vgm = 0; for (let v = 0.2; v <= 1; v += 0.001) { const g = (ids(v + 0.001) - ids(v)) / 0.001; if (g > best) { best = g; vgm = v; } }
    const vtLin = vgm - ids(vgm) / best - 0.05; // extrapolate to Ids = 0, minus Vds/2
    let mode = 0;
    const out = el(`<div></div>`);
    const draw = (icrit) => {
      let vtcc = 0; for (let v = 0; v <= 1; v += 0.0005) if (ids(v) >= icrit * 1e-6) { vtcc = v; break; }
      out.innerHTML = mode === 0
        ? `<div class="fig">${plot({ x: [0, 1], y: [0, 20], xt: [0, 0.2, 0.4, 0.6, 0.8, 1], yt: [0, 10, 20], xl: "V_gs (V)", yl: "µA", h: 230, series: [{ f: (v) => ids(v) * 1e6, cls: "s1" }, { f: (v) => (best * (v - vgm) + ids(vgm)) * 1e6, cls: "s3" }], marks: [{ x: vtLin + 0.05, y: 0, label: "extrapolate", dy: -10 }], label: "Linear extrapolation" })}</div><p>Linear extrapolation: tangent at the point of maximum slope (g<sub>m</sub>) hits zero current at ${(vtLin + 0.05).toFixed(3)} V; subtract V<sub>ds</sub>/2 → <b>V<sub>t</sub> ≈ ${vtLin.toFixed(3)} V</b>.</p>`
        : `<div class="fig">${plot({ x: [0, 1], y: [-4, 2], xt: [0, 0.2, 0.4, 0.6, 0.8, 1], yt: [-4, -2, 0, 2], ytf: (y) => "10^" + y, xl: "V_gs (V)", yl: "µA (log)", h: 230, series: [{ f: (v) => Math.log10(Math.max(1e-12, ids(v) * 1e6)), cls: "s1" }, { f: () => Math.log10(icrit), cls: "s3" }], label: "Constant current" })}</div><p>Constant current: V<sub>t</sub> is where I<sub>ds</sub> = I<sub>crit</sub> = ${icrit} µA → <b>V<sub>t</sub> = ${vtcc.toFixed(3)} V</b>. Change I<sub>crit</sub> and the “threshold” moves.</p>`;
    };
    let ic = 0.4;
    const s = slider({ id: "v8ic", label: "I<sub>crit</sub>", min: 0.1, max: 2, step: 0.1, value: ic, show: (x) => x.toFixed(1) + " µA" }, (x) => { ic = x; draw(ic); });
    host.append(toggle(["Linear extrapolation", "Constant current (log scale)"], (i) => { mode = i; draw(ic); }, 0), s.el, out); draw(ic);
  }
  function leFit(host) {
    const out = el(`<div></div>`);
    const draw = (h) => {
      const di = 3.3 * h + 3.8, dn = 3.9 * h + 8.9;
      out.innerHTML = `<div class="fig">${plot({ x: [0, 10], y: [0, 50], xt: [0, 2, 4, 6, 8, 10], yt: [0, 10, 20, 30, 40, 50], xl: "fanout h", yl: "d (ps)", h: 230, series: [{ f: (x) => 3.3 * x + 3.8, cls: "s2" }, { f: (x) => 3.9 * x + 8.9, cls: "s1" }], marks: [{ x: h, y: dn, label: `NAND2 ${dn.toFixed(1)}`, dy: -10 }, { x: h, y: di, label: `inv ${di.toFixed(1)}`, dy: 16 }], label: "Delay versus fanout fits" })}</div><p>Inverter: d = 3.3h + 3.8 ps → τ = 3.3 ps, p<sub>inv</sub> = 3.8/3.3 = 1.15. NAND2: d = 3.9h + 8.9 ps → g = 3.9/3.3 = <b>1.18</b>, p = 8.9/3.3 = <b>2.70</b>.</p>`;
    };
    host.append(slider({ id: "v8h", label: "Fanout h", min: 1, max: 10, step: 1, value: 4, show: (x) => Math.round(x) }, (x) => draw(Math.round(x))).el, out); draw(4);
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Why simulate, and how not to be fooled", mins: 10,
    blurb: "Simulators predict what silicon will do, at many levels. They're only as good as the model and stimulus you feed them.",
    takeaway: "Fabrication is expensive and slow, so designs are simulated first, at many levels: process simulators (e.g., SUPREME: recipe → device characteristics), circuit simulators (SPICE, Spectre: device models + netlist → voltages and currents → performance and power), logic simulators (VCS, ModelSim: HDL correctness), architecture simulators (instructions and registers → throughput, memory patterns). Detail trades against size. VLSI designers mostly use circuit and logic simulation. Hand analysis vs simulation: modern transistors are too nonlinear for exact hand analysis and too many circuits for closed forms, but simulation is garbage-in, garbage-out: easy to give an inaccurate model or miss the worst-case stimulus. Predict the result first; trust it only when expectation and simulation agree: “simulation guided through insight gained from analysis” [Glasser85].",
    steps: [
      { k: "learn", title: "Levels of simulation", b: [
        `<div class="tbl"><table><tbody><tr><td>Process</td><td>recipe → device characteristics</td></tr><tr><td><b>Circuit (SPICE)</b></td><td>models + netlist → voltages, currents, delay, power</td></tr><tr><td>Logic</td><td>HDL → correct 1s and 0s</td></tr><tr><td>Architecture</td><td>instructions → throughput, memory behaviour</td></tr></tbody></table></div>`,
      ]},
      { k: "learn", title: "Garbage in, garbage out", b: [
        `<p>SPICE solves exactly the circuit you describe, with exactly the inputs you give. A wrong model or a missed worst case still produces beautiful waveforms with many digits.</p>`,
        `<p>Rule: <b>predict, then simulate</b>. Believe the result only when it matches your expectation (or you've found why it doesn't).</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do circuit designers need both hand analysis and simulation?", model: "Simulation is needed because real transistors are nonlinear and circuits are too large for exact hand analysis. But a simulator only reflects the model and stimulus it's given, which are easy to get wrong. Hand analysis gives the designer an expected answer and an understanding of what matters, so a simulation can be checked against it; confidence comes only when the two agree." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "A first SPICE deck", mins: 20,
    blurb: "A netlist of elements and nodes, sources, an analysis command, and the units trap: mega is x, not m.",
    takeaway: "SPICE (Berkeley, 1970s; HSPICE widely used commercially; PSPICE, LTSpice free) solves the nonlinear differential equations of transistors, R, C and sources; digital designers mostly use DC and transient analysis. Input file = SPICE deck (each line a card): netlist of components and nodes, options, analyses, models; output = list file. First line must be a comment (title); * starts comments; control statements start with a dot; the last line is .end. RC example (Figures 8.1–8.2): R1 = 2 kΩ, C1 = 100 fF, τ = 200 ps ≫ 50 ps input edge, so an exponential with 200 ps time constant: Vin in gnd pwl 0ps 0 100ps 0 150ps 1.0 1ns 1.0; R1 in out 2k; C1 out gnd 100f; .tran 20ps 1ns; .plot v(in) v(out); .option post writes waveforms for a viewer. Element letters (Table 8.1): R, C, L, K, V, I, M (MOSFET), D, Q, W (lossy transmission line), X (subcircuit), E, G, H, F (controlled sources). Units (Table 8.2): a 10⁻¹⁸, f 10⁻¹⁵, p 10⁻¹², n 10⁻⁹, u 10⁻⁶, m 10⁻³, k 10³, x 10⁶ (mega!), g 10⁹; letters after the scale (F, s) are ignored. gnd is the 0 V node. SPICE is case-insensitive. Sources: DC (Vdd vdd gnd 2.5), PWL, PULSE v1 v2 td tr tf pw per (e.g., Vck clk gnd PULSE 0 1 0ps 100ps 100ps 300ps 800ps: 1 V, 800 ps, 100 ps edges, 50% duty).",
    steps: [
      { k: "learn", title: "The RC deck (Figure 8.2)", b: [
        pre(`* rc.sp
.option post
Vin in gnd pwl 0ps 0 100ps 0 150ps 1.0 1ns 1.0
R1  in out 2k
C1  out gnd 100f
.tran 20ps 1ns
.plot v(in) v(out)
.end`),
        `<p>Name letter = element type (R, C, V, M, X…). Then nodes, then value. <code>gnd</code> is 0 V. The first line is always a comment; the last is <code>.end</code>.</p>`,
      ]},
      { k: "play", title: "Predict, then look", b: [
        rcWidget,
        `<p class="aside">Before moving a slider, predict: if you double C, what happens to the output's rise? Then check.</p>`,
      ]},
      { k: "check", title: "Units", b: [
        { t: "mcq", q: "You want a 2 MΩ resistor. Which card is right?", opts: [["R1 a b 2x", true, "In SPICE, x = mega (10⁶)."], ["R1 a b 2M", false, "M (or m) means milli: 2 mΩ!"], ["R1 a b 2meg", false, "HSPICE also accepts meg, but the book's table uses x; 2M would be milli."]] },
        { t: "num", q: "C1 out gnd 50f and R1 in out 4k. Time constant in ps?", a: 200, tol: 0.01, why: "4 kΩ × 50 fF = 200 ps." },
      ]},
      { k: "play", title: "Pulse sources", b: [
        `<p class="mono">PULSE v1 v2 td tr tf pw per</p>`,
        pulseWidget,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 1 GHz clock (period 1000 ps) with 50 ps rise and fall times and a 50% duty cycle. What pw (ps)?", a: 450, tol: 0.01, why: "High time measured at 50%: tr/2 + pw + tf/2 = 500 → pw = 500 − 50 = 450 ps." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What are the parts of a SPICE deck?", model: "A title comment on the first line; options such as .option post; the netlist, one element per line, starting with a letter for its type, then its nodes and value; sources for the inputs and supplies; analysis commands such as .dc or .tran and output commands such as .plot or .measure; device models, often brought in with .include; and .end on the last line." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Transistors, inverters, subcircuits, measurements", mins: 25,
    blurb: "DC sweeps for I-V curves, a transient step for an inverter, and the FO4 deck: subcircuits, parameters, scaling and .measure.",
    takeaway: "MOSFET card: Mname drain gate source body model W= L= (plus AS, AD, PS, PD). DC analysis (Figure 8.6): .dc Vds 0 1.0 0.05 SWEEP Vgs 0 1.0 0.2 gives a family of Ids–Vds curves; .include loads models; .temp 70. The 65 nm process has λ = 25 nm and a 50 nm minimum drawn length. Inverter transient (Figures 8.7–8.8): .param SUPPLY=1.0, .option scale=25n (dimensions in λ), unloaded unit inverter tpdf 3.1 ps, tpdr 3.6 ps (overshoot from bootstrapping, no load). Contacted diffusion: AS = AD = 5W λ², PS = PD = (2W + 10) λ; + continues a line. FO4 (Figures 8.9–8.10): X1–X2 shape the input slope, X3 is under test, X4 its load (4×), X5 the load on the load (keeps the Miller-multiplied Cgd realistic). .global vdd gnd; .subckt inv a y N=4 P=8 with expressions in single quotes; M='H**2' multiplies currents (preferred over scaling widths, because a 4× wide device isn't exactly 4 units). .measure tpdr TRIG v(c) VAL='SUPPLY/2' FALL=1 TARG v(d) VAL='SUPPLY/2' RISE=1; tpd = (tpdr + tpdf)/2 = 17 ps (tpdr 18, tpdf 16); 20–80% tr = 20 ps, tf = 17 ps.",
    steps: [
      { k: "learn", title: "A transistor card and a DC sweep", b: [
        pre(`M1 d g gnd gnd NMOS W=100n L=50n
.dc Vds 0 1.0 0.05 SWEEP Vgs 0 1.0 0.2`),
        `<p>Order: drain, gate, source, body, model. The nested sweep draws one I<sub>ds</sub>–V<sub>ds</sub> curve per V<sub>gs</sub>.</p>`,
        seenV("I-V curves, velocity saturation and channel-length modulation.", "02-mos-transistor.html", "Chapter 2"),
      ]},
      { k: "learn", title: "Scale and diffusion geometry", b: [
        `<p><code>.option scale=25n</code> means W=4 L=2 is 4λ by 2λ (100 nm × 50 nm). Without it, SPICE reads 4 × 2 <i>meters</i>.</p>`,
        `<p>Each contacted source/drain is about 5λ long: <b>AS = AD = 5W</b> λ², <b>PS = PD = 2W + 10</b> λ. Leave these out and SPICE assumes zero diffusion capacitance: delays come out too fast.</p>`,
      ]},
      { k: "learn", title: "The FO4 deck (Figure 8.10)", b: [
        pre(`.subckt inv a y N=4 P=8
M1 y a gnd gnd NMOS W='N' L=2 AS='N*5' PS='2*N+10' AD='N*5' PD='2*N+10'
M2 y a vdd vdd PMOS W='P' L=2 AS='P*5' PS='2*P+10' AD='P*5' PD='2*P+10'
.ends
X1 a b inv              * shape input
X2 b c inv M='H'        * reshape input
X3 c d inv M='H**2'     * device under test
X4 d e inv M='H**3'     * load
X5 e f inv M='H**4'     * load on load
.measure tpdr TRIG v(c) VAL='SUPPLY/2' FALL=1
+             TARG v(d) VAL='SUPPLY/2' RISE=1`),
        `<p>Results: t<sub>pdr</sub> = 18 ps, t<sub>pdf</sub> = 16 ps, average <b>17 ps</b>; 20–80% rise 20 ps, fall 17 ps.</p>`,
        seenV("FO4 delay as a process yardstick; logical effort.", "04-delay.html", "Chapter 4"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why do X1 and X2 exist in the FO4 deck?", opts: [["To give X3 a realistic input slope; a step input would make it look faster", true, "Gate delay depends strongly on input edge rate."], ["To load X3", false, "X4 does that."], ["To divide the frequency", false, "They're inverters, not dividers."]] },
        { t: "num", q: "A transistor with W = 12 λ in contacted diffusion: AS in λ²?", a: 60, tol: 0.01, why: "5W = 60 λ² (and PS = 2W + 10 = 34 λ)." },
        { t: "mcq", q: "Why is M='H**2' preferred over N=64 P=128 for X3?", opts: [["A 16× wider transistor isn't exactly 16 unit transistors in capacitance and current", true, "M copies the unit device in parallel."], ["SPICE can't handle W = 64", false, "It can."], ["M runs faster", false, "Not the reason."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe the five inverters in the FO4 deck and why each is there.", model: "X1 and X2 shape the input waveform so the device under test sees a realistic edge rate rather than a step. X3 is the inverter being measured. X4, four times larger, is its fanout-of-4 load. X5, four times larger again, loads X4 so that node e switches at a realistic speed, which keeps the Miller effect on X4's gate-to-drain capacitance, and so X3's load, realistic." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Optimization and other commands", mins: 15,
    blurb: "Let HSPICE tune a parameter toward a goal. Then look at how flat the optimum is before trusting it.",
    takeaway: "HSPICE optimization (Figure 8.11): .param P1=optrange(8,4,16) (guess 8, search 4–16); .model optmod opt itropt=30; .tran … SWEEP OPTIMIZE=optrange RESULTS=diff MODEL=optmod with .measure diff param='tpdr-tpdf' goal=0. Result: equal rise and fall delay at P/N = 2.87:1 (17.9 ps) because pMOS mobility is less than half nMOS; seldom used (big, power-hungry pMOS). With RESULTS=tpd, least average delay at 1.79:1 (rising 18.8, falling 15.2, average 17.0 ps), but anything from 1.5:1 to 2.2:1 is within 17.2 ps: don't slavishly stick to the optimum; consider sensitivity. The practical choice trades smaller pMOS (area, power) against more equal edges and avoiding hot-electron problems from slow rising edges. Other commands: .option accurate (tighter tolerances), .option autostop (stop when all measurements are done), .temp 0 70 125 (repeat at several temperatures), .op (DC operating point).",
    steps: [
      { k: "learn", title: "The optimizer", b: [
        pre(`.param P1=optrange(8,4,16)           * guess 8, search 4..16
.model optmod opt itropt=30
.tran 0.1ps 280ps SWEEP OPTIMIZE=optrange RESULTS=diff MODEL=optmod
.measure diff param='tpdr-tpdf' goal=0`),
        `<p>HSPICE adjusts P1 until the goal is met. Equal rise and fall: <b>2.87:1</b>. Least average delay: <b>1.79:1</b>.</p>`,
      ]},
      { k: "play", title: "How flat is the optimum?", b: [
        pnWidget,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why isn't 2.87:1 (equal delays) the usual choice?", opts: [["It needs big, power-hungry pMOS for little or no average-delay gain", true, "Average delay is actually best near 1.8:1."], ["It makes the inverter slower to fall", false, "Falling gets slower, but the main issue is cost."], ["SPICE can't simulate it", false, "It just did."]] },
        { t: "mcq", q: "Which command repeats a simulation at 0, 70 and 125 °C?", opts: [[".temp 0 70 125", true, "One run per temperature."], [".op 0 70 125", false, ".op prints the DC operating point."], [".alter", false, ".alter repeats with changes you list, like a new library."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What lesson does the P/N-ratio optimization teach about trusting an optimizer?", model: "The optimizer reported 1.79:1 as the best ratio for average delay, but further simulation showed anything between about 1.5:1 and 2.2:1 is within a fraction of a picosecond. Because the optimum is flat, other concerns such as area, power and edge rates should decide. Always check the sensitivity around an optimum rather than adopting the exact number." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Device models and corners", mins: 20,
    blurb: "Level 1 is the textbook square law; BSIM has 100+ parameters and fits real devices. Diffusion and corners must be specified, or the answers lie.",
    takeaway: "Level 1 (Shichman–Hodges): Shockley model with channel-length modulation and body effect: Ids = KP(Weff/Leff)(Vgs − Vt − Vds/2)Vds(1 + LAMBDA·Vds) in linear, (KP/2)(Weff/Leff)(Vgs − Vt)²(1 + LAMBDA·Vds) in saturation; Vt = VTO + GAMMA(√(PHI + Vsb) − √PHI); gate capacitance from TOX. Good for teaching, too simple for modern devices (sample: TOX 40 Å, KP 155 µA/V², LAMBDA 0.2, VTO 0.4, PHI 0.93, GAMMA 0.6, CJ, PB, MJ, CJSW, PHP, MJSW). Levels 2 and 3 add velocity saturation, mobility degradation, subthreshold conduction and DIBL but still fit modern devices poorly. BSIM (Berkeley Short-channel IGFET Model; versions 1, 2, 3v3, 4 = levels 13, 39, 49, 54): physics-based with 100+ fitted parameters; continuous I-V across regions, Vt dependence on L and W, DIBL, velocity saturation, multiple capacitance models, diffusion models, gate leakage (BSIM4); binned by LMIN/LMAX/WMIN/WMAX. Diffusion capacitance: ACM selects how area/perimeter are given; ACM = 0 requires AS, AD, PS, PD or they default to 0 (grossly underestimating parasitic delay). Table 8.3 per diffusion: isolated contacted 5W, 2W + 10; shared contacted 3W, W + 6; merged uncontacted 1.5W, W + 3. Csb = AS·CJ(1 + Vsb/PB)^−MJ + PS·CJSW(1 + Vsb/PHP)^−MJSW; BSIM3 ACM = 10 separates the gate-side sidewall (CJSWG). Design corners with .lib and .alter: TT (70 °C, nominal VDD), SS (125 °C, 0.9 VDD), FF (0 °C, 1.1 VDD), FS and SF (skewed nMOS/pMOS).",
    steps: [
      { k: "learn", title: "From Level 1 to BSIM", b: [
        `<div class="tbl"><table><tbody><tr><td>Level 1</td><td>square law + λ + body effect; easy to relate to hand analysis</td></tr><tr><td>Level 2, 3</td><td>adds velocity saturation, mobility degradation, subthreshold, DIBL; still poor fits today</td></tr><tr><td>BSIM 3, 4 (levels 49, 54)</td><td>100+ parameters, smooth across regions, binned by size, gate leakage (BSIM4); the industry standard</td></tr></tbody></table></div>`,
      ]},
      { k: "play", title: "Level 1 curves", b: [
        level1,
      ]},
      { k: "learn", title: "Diffusion capacitance must be given", b: [
        `<div class="tbl"><table><thead><tr><th>Diffusion (Fig 2.8)</th><th>Area (λ²)</th><th>Perimeter (λ)</th></tr></thead><tbody><tr><td>Isolated contacted</td><td>5W</td><td>2W + 10</td></tr><tr><td>Shared contacted</td><td>3W</td><td>W + 6</td></tr><tr><td>Merged uncontacted</td><td>1.5W</td><td>W + 3</td></tr></tbody></table></div>`,
        `<p class="eq">C<sub>sb</sub> = AS·CJ(1 + V<sub>sb</sub>/PB)<sup>−MJ</sup> + PS·CJSW(1 + V<sub>sb</sub>/PHP)<sup>−MJSW</sup></p>`,
        `<p>With ACM = 0, omitted AS/AD/PS/PD default to <b>zero</b>: the parasitic delay vanishes and the circuit looks far too fast.</p>`,
      ]},
      { k: "learn", title: "Design corners", b: [
        `<div class="tbl"><table><thead><tr><th>Corner</th><th>nMOS / pMOS</th><th>V<sub>DD</sub></th><th>T</th></tr></thead><tbody><tr><td>TT</td><td>typical</td><td>nominal</td><td>70 °C</td></tr><tr><td>SS</td><td>slow / slow</td><td>0.9×</td><td>125 °C</td></tr><tr><td>FF</td><td>fast / fast</td><td>1.1×</td><td>0 °C</td></tr><tr><td>FS, SF</td><td>skewed</td><td>nominal</td><td>70 °C</td></tr></tbody></table></div>`,
        `<p><code>.lib 'opconditions.lib' TT</code> then <code>.alter</code> + <code>.lib … FF</code>, <code>.alter</code> + <code>.lib … SS</code>: three runs from one deck.</p>`,
        seenV("Process, voltage and temperature corners.", "07-robustness.html", "Chapter 7"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Which corner usually gives the longest delay?", opts: [["SS: slow devices, 0.9 V<sub>DD</sub>, 125 °C", true, "Everything conspires to slow it down."], ["FF", false, "That's the fastest (and leakiest)."], ["FS", false, "Skewed corners matter for ratioed circuits, not worst delay."]] },
        { t: "num", q: "Two series nMOS (W = 8 λ) share a contacted diffusion. AD of the bottom transistor in λ²?", a: 24, tol: 0.01, why: "Shared contacted: 3W = 24 λ² (Figure 8.13)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must you check that your simulation includes diffusion area and perimeter?", model: "Diffusion capacitance contributes much of a gate's parasitic delay, around 20% of an FO4 inverter's delay and more for high-fanin gates. With the common ACM = 0 setting, if AS, AD, PS and PD aren't given they default to zero, so the simulation silently leaves that capacitance out and predicts a circuit faster than the real one." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Characterizing a process", mins: 25,
    blurb: "Simulate small test circuits to pull out the numbers you design with: I-V behaviour, Vt, effective C and R, and how they've scaled.",
    takeaway: "65 nm nMOS (1 µm, 70 °C, VDD 1.0 V, Figure 8.16): saturation current nearly linear in Vgs (severe velocity saturation, α near 1); notable channel-length modulation; at 2× length the current drops by less than 2×. Idsat = 750 µA/µm (Vgs = Vds = VDD), Ioff = 27 nA/µm (Vgs = 0, Vds = VDD), subthreshold slope 105 mV/decade, DIBL ≈ 110 mV, ON/OFF 4–5 decades; body effect 125 mV/V. pMOS (Figure 8.17): Idsat 370 µA/µm, Ioff 22 nA, 112 mV/dec, DIBL 130 mV, less velocity-saturated. 180 nm nMOS: Idsat 570 µA/µm, Ioff 90 pA, 90 mV/dec, DIBL 40 mV, 6–7 decades. Threshold voltage is ill-defined: constant-current method (Vgs at Icrit, typically 0.1 µA·W/L) depends on Icrit; linear extrapolation (max-gm tangent at low Vds) is unambiguous but only for the linear region; Zhou's hybrid uses the linear-extrapolation Icrit at other Vds. Vt varies with L, W, temperature, corner and definition. Effective gate capacitance for delay (Figures 8.22–8.23): tune a linear capacitor until its delay matches a real FO4 load; for power: Ceff = ∫iin dt / VDD (Miller-doubled Cgd, so slightly higher). Parasitic capacitance: same trick with W, AD, PD chosen per Table 8.4 (e.g., Cgol: Cdelay 23 fF on W = 1600 λ → 0.57 fF/µm). Effective resistance (Figure 8.26): fanout-of-h delays tpdr = (Rp/2)(3hC + 3Cd), tpdf = Rn(3hC + 3Cd); h = 4 minus h = 3: Δtpdr = (3/2)RpC, Δtpdf = 3RnC. Series transistors have lower effective resistance each (less velocity saturation). Table 8.5 trends: Cg (delay) ≈ 2 fF/µm for generations, dropping below 180 nm (65 nm: 0.80); FO4 delay ≈ 1/3–1/2 of effective channel length (ps per nm); diffusion 1–2 fF/µm; unit nMOS ≈ 8 kΩ throughout; Rp 2–3× Rn; Vt falling slower than VDD (VDD/Vt shrinking: pass transistors suffer); Idsat/µm slightly rising; Ioff rising exponentially; gate leakage significant below 90 nm. Table 8.6 (65 nm corners): FO4 12.2 ps (FF) to 24.4 ps (SS); ~0.12%/°C; ~1% per % VDD.",
    steps: [
      { k: "learn", title: "65 nm nMOS at a glance", b: [
        `<div class="tbl"><table><tbody><tr><td>I<sub>dsat</sub></td><td>750 µA/µm</td></tr><tr><td>I<sub>off</sub></td><td>27 nA/µm</td></tr><tr><td>Subthreshold slope</td><td>105 mV/decade</td></tr><tr><td>DIBL</td><td>≈ 110 mV over the V<sub>ds</sub> range</td></tr><tr><td>ON/OFF</td><td>4–5 decades (180 nm: 6–7)</td></tr></tbody></table></div>`,
        `<p>pMOS: 370 µA/µm, less velocity-saturated. Saturation current grows almost <i>linearly</i> with V<sub>gs</sub>: severe velocity saturation.</p>`,
      ]},
      { k: "play", title: "What is “the” threshold?", b: [
        vtExtract,
        `<p class="aside">An illustrative curve, not the book's data. The point: the number depends on the method. Always ask how a V<sub>t</sub> was measured.</p>`,
      ]},
      { k: "learn", title: "Effective C and R", b: [
        `<p><b>C for delay</b>: replace a real FO4 load with a linear capacitor and let the optimizer tune it until the delays match. <b>C for power</b>: integrate the input current, C<sub>eff</sub> = ∫i dt / V<sub>DD</sub> (a bit larger: Miller-doubled C<sub>gd</sub>).</p>`,
        `<p><b>R</b>: for a fanout-of-h inverter, t<sub>pdf</sub> = R<sub>n</sub>(3hC + 3C<sub>d</sub>). Subtract the h = 3 delay from the h = 4 delay and the parasitic term cancels: Δt<sub>pdf</sub> = 3R<sub>n</sub>C, Δt<sub>pdr</sub> = (3/2)R<sub>p</sub>C.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Unit gate capacitance C = 0.5 fF, and the falling delay grows 3 ps from h = 3 to h = 4. Rn in kΩ?", a: 2, tol: 0.01, why: "3RnC = 3 ps → Rn = 1 ps / 0.5 fF = 2 kΩ." },
        { t: "num", q: "Integrating the input current gives 12 fC for a 1.0 V step. Effective capacitance for power (fF)?", a: 12, tol: 0.01, why: "C = Q / V = 12 fF." },
        { t: "mcq", q: "Why does a pair of series nMOS transistors each have less effective resistance than a single one?", opts: [["Each sees only part of V<sub>ds</sub>, so it's less velocity-saturated", true, "Less field per device, closer to its low-field mobility."], ["They're wider", false, "Same width."], ["Their threshold is lower", false, "Body effect raises the top one's threshold."]] },
      ]},
      { k: "learn", title: "Trends across generations (Table 8.5)", b: [
        `<ul><li>Gate C for delay ≈ 2 fF/µm for many generations, then lower (65 nm ≈ 0.8).</li><li>FO4 delay ≈ ⅓–½ of the effective channel length (ps per nm).</li><li>Unit nMOS resistance ≈ 8 kΩ throughout; R<sub>p</sub> is 2–3× R<sub>n</sub>.</li><li>V<sub>t</sub> falls slower than V<sub>DD</sub>, so pass-transistor threshold drops hurt more.</li><li>I<sub>off</sub> rises exponentially; gate leakage matters below 90 nm.</li></ul>`,
        `<p>Corners (65 nm, Table 8.6): FO4 from 12.2 ps (FF) to 24.4 ps (SS); about 0.12%/°C and 1% per 1% of V<sub>DD</sub>.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the book extract a transistor's effective resistance from simulation, and why use a difference of two delays?", model: "It simulates fanout-of-h inverter chains at two fanouts, say h = 3 and h = 4, with realistic input slopes. The delay of each is the resistance times the load, which includes the fanout capacitance and the inverter's own diffusion capacitance. Subtracting the two delays cancels the unknown parasitic term, leaving three times the resistance times the known gate capacitance for the falling edge, so the resistance follows directly." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Characterizing circuits", mins: 20,
    blurb: "Simulate paths with realistic edges and loads; sweep DC to get transfer curves; fit delay vs fanout lines to get logical effort; measure power, mismatch and spread.",
    takeaway: "Most static paths are timed by static timing analysis; SPICE is reserved for sensitive circuits (clock generation and distribution, memory arrays, novel circuits). Design first with simple models (Shockley, RC, logical effort), then simulate, expecting bugs; check corners. Model realistic inputs, loads and wires; add complexity gradually. DC transfer (Figures 8.28–8.29): .dc Va 0 1.0 0.01; the static inverter is nearly symmetric about VDD/2; the dynamic inverter (keeper) has a lower switching threshold and drops abruptly; set its initial state with .ic V(y2)='SUPPLY'. Logical effort: fit delay vs fanout (SWEEP H 1 8 1) with two stages of load (Figure 8.30): inverter d = 3.3h + 3.8 ps → τ = 3.3 ps, pinv = 1.15; NAND2 d = 3.9h + 8.9 → g = 1.18, p = 2.70. The linear model fits well when slopes are consistent. Table 8.7: the outer input (A, nearest the rail) has higher parasitic delay but slightly lower logical effort; rising and falling differ a lot. Table 8.8: logical efforts of series-transistor gates are lower than the Chapter 4 estimates (one series device is already fully on; NAND's series nMOS are less velocity-saturated): 65 nm (outer input, average): NAND2 1.26, NAND3 1.51, NOR2 1.50; the velocity-saturated model of Example 4.12 predicts 1.20, 1.39, 1.50. Power: .measure charge INTEGRAL I(vdd) FROM=0ns TO=10ns; energy = charge × SUPPLY; or .measure pwr AVG P(vdd); a separate supply measures one gate (then vdd can't be .global); input power flows through Cgs. Mismatch: corners keep transistors matched, so model mismatch explicitly (ΔVt source, ΔL) for sense amps etc.; different environments with separate sources or runs. Monte Carlo: .tran … SWEEP MONTE=30: FO4 mean 17.1 ps, σ = 0.56 ps; models specify die-to-die and within-die variation.",
    steps: [
      { k: "learn", title: "Simulating paths well", b: [
        `<ul><li>Start from simple models to know what to expect.</li><li>Use realistic input edges, output loads and wires.</li><li>Add detail step by step, checking each step still makes sense.</li><li>Run the corners.</li></ul>`,
        `<p>Most timing comes from static timing analysis; SPICE is for the sensitive parts: clocks, memories, new circuit styles.</p>`,
      ]},
      { k: "play", title: "Logical effort from simulation (Figure 8.30)", b: [
        leFit,
        `<p class="aside">Divide every delay by τ = 3.3 ps to get normalized units: slope = logical effort, intercept = parasitic delay.</p>`,
        seenV("Logical effort and parasitic delay from the RC model.", "04-delay.html", "Chapter 4"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A gate's simulated delay is d = 4.6h + 7.2 ps in the same process (τ = 3.3 ps). Its logical effort? (2 decimals)", a: 1.39, tol: 0.01, why: "4.6 / 3.3 = 1.39 (and p = 7.2/3.3 = 2.18)." },
        { t: "mcq", q: "Why are simulated NAND logical efforts lower than the Chapter 4 estimate of 4/3?", opts: [["One series transistor is already fully on, and series nMOS are less velocity-saturated", true, "Both make the stack faster than 2 unit resistances."], ["SPICE ignores series resistance", false, "It doesn't."], ["NANDs are smaller", false, "Sized for equal drive."]] },
      ]},
      { k: "learn", title: "Power, mismatch, Monte Carlo", b: [
        pre(`.measure charge INTEGRAL I(vdd) FROM=0ns TO=10ns
.measure energy param='charge*SUPPLY'
.tran 1ps 1000ps SWEEP MONTE=30`),
        `<p><b>Mismatch</b>: corners shift all transistors together, so matched pairs stay matched. For sense amplifiers, add a ΔV<sub>t</sub> source and a ΔL to one device on purpose.</p>`,
        `<p><b>Monte Carlo</b> on the FO4: mean 17.1 ps, σ = 0.56 ps over 30 runs.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you extract a gate's logical effort and parasitic delay with SPICE?", model: "Drive the gate with realistic input edges and load it with two stages of copies of itself, then sweep the fanout h and measure the delay at each value. The delay falls on a straight line against h. Dividing the slope by the inverter's slope τ gives the logical effort, and dividing the intercept by τ gives the parasitic delay." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Interconnect and pitfalls", mins: 15,
    blurb: "Model wires as lumped C, π segments, or lossy transmission lines. Then the classic ways simulations lie.",
    takeaway: "Interconnect parasitics can dominate delay. Extract from layout, or estimate from the floorplan (some companies estimate even in-cell wires). Short wires: lumped capacitor; longer: multi-segment π model; four segments (R/4 each; C/8, C/4, C/4, C/4, C/8) is quite accurate and can include coupling. Coupled lines: series R and L, C to ground, mutual C and L (Figure 8.33); usually treat supplies as ideal and budget their noise separately. HSPICE W element (lossy multiconductor transmission line) with a 2-D field solver (Figures 8.34–8.35): two 2 µm × 0.7 µm copper wires 2 µm apart between grounds, low-k (ε = 3.55), 6 mm long: R = 12.4 Ω/mm, L11 = 0.67 nH/mm, L12 = 0.37 nH/mm, C11 = 0.0117 pF/mm, C12 = 0.0137 pF/mm; velocity 1/√(L11(C11 + C12)) ≈ 2.4 × 10¹¹ mm/s (close to light: air outside), flight time 6 mm → 25 ps; ringing with half-period of two flight times because the wires are far from returns (high L), low R and driven by fast edges; victim couples down, more at the far end. Pitfalls: omitting diffusion and wire parasitics (diffusion ≈ 20% of FO4 delay, > 50% for high-fanin low-fanout gates); wrong input waveforms (steps make gates look fast); wrong output loads (an unloaded inverter is about 1/5 of FO4 delay); unfair transistor sizes when comparing designs; the wrong critical path; hidden CAD scale factors; blindly trusting SPICE (predict simple cases first; version-control models and netlist scripts); using SPICE in place of thinking; deck errors: missing first-line comment or final newline, no .option post, missing diffusion, no initial conditions for dynamic/sequential circuits, no .option scale (W=4 L=2 → meters; a 3 × 0.5 µm drain is PD = 7u AD = 1.5p).",
    steps: [
      { k: "learn", title: "Modelling wires", b: [
        `<div class="tbl"><table><tbody><tr><td>Short wire (R<sub>wire</sub> ≪ R<sub>gate</sub>)</td><td>lumped capacitor</td></tr><tr><td>Longer wire</td><td>4-segment π: R/4 ×4; C/8, C/4, C/4, C/4, C/8</td></tr><tr><td>Fast edges, high inductance, coupling</td><td>W element (lossy multiconductor line) + field solver</td></tr></tbody></table></div>`,
        seenV("Wire R, C, coupling and the π model.", "06-interconnect.html", "Chapter 6"),
      ]},
      { k: "learn", title: "The field-solver example", b: [
        `<p>Two 6 mm copper lines: R = 12.4 Ω/mm, L<sub>11</sub> = 0.67 nH/mm, C<sub>11</sub> = 0.0117 pF/mm, C<sub>12</sub> = 0.0137 pF/mm.</p>`,
        `<p class="eq">v = 1 / √(L<sub>11</sub>(C<sub>11</sub> + C<sub>12</sub>)) ≈ 2.4 × 10<sup>11</sup> mm/s → 6 mm in 25 ps</p>`,
        `<p>The far end rings with a half-period of two flight times: the wires are far from their returns (high L), have low R, and see an edge much faster than the flight time.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Using the book's velocity (2.4 × 10¹¹ mm/s), what's the flight time down a 12 mm wire, in ps?", a: 50, tol: 0.5, why: "12 / 2.4×10¹¹ s = 50 ps." },
      ]},
      { k: "check", title: "Spot the pitfall", b: [
        { t: "sort", q: "What went wrong in each simulation?", bins: ["Bad stimulus", "Bad load", "Missing parasitics", "Units/scale"], items: [
          ["A paper reports a new gate's delay driven by an ideal voltage step", 0, "Steps make gates look faster than realistic edges."],
          ["Marketing quotes the delay of an unloaded inverter", 1, "About one fifth of an FO4 delay."],
          ["The netlist omits AS, AD, PS, PD", 2, "Diffusion capacitance silently becomes zero."],
          ["W=4 L=2 with no .option scale", 3, "SPICE reads 4 m by 2 m."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Name three ways a SPICE simulation can give a confidently wrong answer.", model: "Leaving out parasitics, such as diffusion area and perimeter or wire capacitance, makes circuits look faster than they are. Driving the input with an ideal step instead of a realistic edge, or leaving the output unloaded, also understates the delay. And unit or scale mistakes, such as omitting .option scale so widths are read in meters, can produce results, or errors, that have nothing to do with the real circuit." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "vlsi8", eyebrow: "CMOS VLSI · Chapter 8", title: "Circuit Simulation",
    intro: `<p>Eight parts: why and how to simulate, SPICE decks by example, measurements and optimization, device models and corners, characterizing a process, characterizing circuits, and interconnect plus the classic pitfalls.</p><p>No SPICE needed here: the widgets reproduce the book's examples with simple models. To do the exercises, install a SPICE (LTSpice or ngspice is free) and the book's model files. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in a real simulator. Before each run, write down the answer you expect (from Chapters 2–4), then compare. Most exercises use the TSMC 180 nm models from the book's website.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8],
    summary: `
      <h3>SPICE</h3>
      <p>Deck: title comment, netlist (R C V M X…), sources (DC, PWL, PULSE), .dc/.tran, .measure, .end. Units: f p n u m k x(mega) g. .option scale, AS/AD = 5W, PS/PD = 2W + 10.</p>
      <h3>Models</h3>
      <p>Level 1 (square law) → BSIM (100+ parameters). Specify diffusion geometry. Corners TT/SS/FF/FS/SF via .lib and .alter.</p>
      <h3>Characterization</h3>
      <p>65 nm: Idsat 750 µA/µm, Ioff 27 nA/µm, 105 mV/dec. Vt depends on definition. C<sub>eff</sub> by matching delays; R from Δ delay (3R<sub>n</sub>C). FO4 17 ps; τ = 3.3 ps; NAND2 g = 1.18, p = 2.70.</p>
      <h3>Practice</h3>
      <p>Realistic inputs and loads, parasitics, corners, Monte Carlo, π/W wire models. Predict before you simulate.</p>`,
  };
  Course.start(window.CHAPTER);
})();
