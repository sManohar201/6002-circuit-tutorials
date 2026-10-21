(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const seenV = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const mathLink = (html, href, where) => `<p class="aside">${html} <a href="../math/${href}">${where} →</a></p>`;
  const fig = (s) => `<div class="fig">${s}</div>`;

  /* ---------- widgets ---------- */
  function capZ(host) {
    let C = 1e-6, L = 0.25e-9, R = 0.03;
    const out = el(`<div></div>`);
    const draw = () => {
      const Z = (lf) => { const w = 2 * Math.PI * 10 ** lf; const x = w * L - 1 / (w * C); return Math.log10(Math.sqrt(R * R + x * x)); };
      const fr = 1 / (2 * Math.PI * Math.sqrt(L * C));
      out.innerHTML = fig(plot({ x: [4, 10], y: [-3, 2], xt: [4, 5, 6, 7, 8, 9, 10], xtf: (v) => "10^" + v, yt: [-3, -2, -1, 0, 1, 2], ytf: (v) => "10^" + v, xl: "f (Hz)", yl: "|Z| (Ω)", h: 240, series: [{ f: Z, cls: "s1" }], marks: [{ x: Math.log10(fr), y: Math.log10(R), label: "self-resonance " + si(fr, "Hz", 2) }], label: "Impedance of a real bypass capacitor" })) +
        readout([["Below resonance", "behaves like C: |Z| = 1/(2πfC)"], ["At resonance", "|Z| = ESR = " + R + " Ω"], ["Above resonance", "behaves like an inductor: |Z| = 2πfL"]]);
    };
    host.append(slider({ id: "v13c", label: "C", min: 1e-9, max: 1e-4, log: true, value: C, show: (x) => si(x, "F", 2) }, (x) => { C = x; draw(); }).el,
      slider({ id: "v13l", label: "ESL", min: 1e-11, max: 1e-8, log: true, value: L, show: (x) => si(x, "H", 2) }, (x) => { L = x; draw(); }).el,
      slider({ id: "v13r", label: "ESR", min: 0.001, max: 0.3, log: true, value: R, show: (x) => fmt(x, 2) + " Ω" }, (x) => { R = x; draw(); }).el, out); draw();
  }
  function pllStep(host) {
    let zeta = 0.7;
    const out = el(`<div></div>`);
    const y = (t) => { // closed-loop phase step response of a type-2 PLL with ω_n = 1
      const z = zeta;
      if (Math.abs(z - 1) < 1e-6) return 1 - Math.exp(-t) * (1 - t);
      if (z < 1) { const wd = Math.sqrt(1 - z * z); return 1 - Math.exp(-z * t) * (Math.cos(wd * t) - (z / wd) * Math.sin(wd * t)); }
      const wp = Math.sqrt(z * z - 1); return 1 - Math.exp(-z * t) * (Math.cosh(wp * t) - (z / wp) * Math.sinh(wp * t));
    };
    const draw = () => {
      let peak = 0; for (let t = 0; t < 20; t += 0.01) peak = Math.max(peak, y(t));
      out.innerHTML = fig(plot({ x: [0, 15], y: [0, 1.6], xt: [0, 5, 10, 15], yt: [0, 0.5, 1, 1.5], xl: "ω_n t", yl: "Δφ_out / Δφ_in", h: 230, series: [{ f: () => 1, cls: "s4" }, { f: y, cls: "s1" }], label: "PLL response to a step in input phase" })) +
        readout([["Damping ζ", zeta.toFixed(2)], ["Peak", (100 * (peak - 1)).toFixed(0) + "% overshoot"], ["Verdict", zeta < 0.5 ? "rings: more jitter" : zeta <= 1.05 ? "the usual target range (0.7–1)" : "sluggish"]]);
    };
    host.append(slider({ id: "v13z", label: "Damping factor ζ", min: 0.2, max: 2, step: 0.05, value: zeta, show: (x) => x.toFixed(2) }, (x) => { zeta = x; draw(); }).el, out); draw();
  }
  function reflectWidget(host) {
    let ZL = 100;
    const out = el(`<div></div>`);
    const draw = () => {
      const Z0 = 50, g = isFinite(ZL) ? (ZL - Z0) / (ZL + Z0) : 1;
      out.innerHTML = readout([["Load Z<sub>L</sub>", isFinite(ZL) ? Math.round(ZL) + " Ω" : "open"], ["Reflection coefficient Γ = (Z<sub>L</sub> − Z<sub>0</sub>)/(Z<sub>L</sub> + Z<sub>0</sub>)", g.toFixed(2)], ["A 1 V incident wave reflects as", (g >= 0 ? "+" : "") + g.toFixed(2) + " V"], ["Meaning", Math.abs(g) < 0.02 ? "matched: no reflection" : g > 0 ? "same polarity: overshoot" : "inverted: undershoot"]]);
    };
    host.append(slider({ id: "v13zl", label: "Z_L (Z_0 = 50 Ω)", min: 0, max: 1000, step: 1, value: ZL, show: (x) => (x >= 1000 ? "open (∞)" : Math.round(x) + " Ω") }, (x) => { ZL = x >= 1000 ? Infinity : x; draw(); }).el, out); draw();
  }
  function deemph(host) {
    let a = 0, tau = 1.5;
    const out = el(`<div></div>`);
    const draw = () => {
      const tx = (t) => (t >= 1 && t < 2 ? 1 : t >= 2 && t < 3 ? -a : 0) * 1;
      const pts = []; let v = 0; const dt = 0.01;
      for (let t = 0; t <= 10; t += dt) { pts.push([t, v]); v += ((tx(t) - v) / tau) * dt; }
      const pk = Math.max(...pts.map((p) => p[1])), tailAt = pts.find((p) => p[0] >= 3.5)[1];
      out.innerHTML = fig(plot({ x: [0, 10], y: [-0.5, 1.1], xt: [0, 2, 4, 6, 8, 10], yt: [-0.5, 0, 0.5, 1], xl: "time (bit intervals)", yl: "V", h: 230, series: [{ f: tx, cls: "s3", n: 1000 }, { pts, cls: "s1" }], label: "One pulse through a lossy channel" })) +
        readout([["Received peak", pk.toFixed(2)], ["Leftover 1.5 bits later (ISI)", tailAt.toFixed(2)]]);
    };
    host.append(slider({ id: "v13t", label: "Channel loss (time constant)", min: 0.3, max: 3, step: 0.1, value: tau, show: (x) => x.toFixed(1) + " UI" }, (x) => { tau = x; draw(); }).el,
      slider({ id: "v13a", label: "De-emphasis α", min: 0, max: 0.8, step: 0.05, value: a, show: (x) => x.toFixed(2) }, (x) => { a = x; draw(); }).el, out); draw();
  }
  function vonNeumann(host) {
    let p = 0.8;
    const out = el(`<div></div>`);
    const draw = () => {
      let seed = 12345; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
      const raw = Array.from({ length: 4000 }, () => (rnd() < p ? 1 : 0)), outb = [];
      for (let i = 0; i + 1 < raw.length; i += 2) if (raw[i] !== raw[i + 1]) outb.push(raw[i] === 0 ? 1 : 0);
      const ones = (a) => a.filter((x) => x).length / a.length;
      out.innerHTML = readout([["Raw bits that are 1", (100 * ones(raw)).toFixed(1) + "%"], ["Output bits kept", outb.length + " of " + raw.length + " (" + (100 * outb.length / raw.length).toFixed(0) + "%)"], ["Output bits that are 1", (100 * ones(outb)).toFixed(1) + "%"]]) + `<p class="mono" style="word-break:break-all">raw: ${raw.slice(0, 40).join("")}…<br>out: ${outb.slice(0, 40).join("")}…</p>`;
    };
    host.append(slider({ id: "v13p", label: "Bias of the noise source P(1)", min: 0.5, max: 0.95, step: 0.01, value: p, show: (x) => (100 * x).toFixed(0) + "%" }, (x) => { p = x; draw(); }).el, out); draw();
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Packages and how the chip connects to them", mins: 20,
    blurb: "From DIPs to flip-chip LGAs: connections, parasitics, and why half the pins carry power.",
    takeaway: "Special-purpose subsystems (packaging, power, clocks, PLLs, I/O, random circuits) are usually built by specialists or bought, but a digital designer must understand their impact. Ideal package: connects signals and power with little delay or distortion, removes heat, protects against mechanical and thermal-expansion stress, cheap to make and test; short, low-R, low-L wires. Options (Table 13.1): DIP (through-hole, 100 mil), PGA (through-hole array, low θ), SOIC, TSOP (DRAMs), PLCC (J-leads, socketable), QFP (fine-pitch SMT on four sides), BGA (solder-ball array, high density, low parasitics, special assembly), LGA (gold pads to a socket), CSP (≤ 1.2× die; flip-chip; mobile). Pitches in mils (25.4 µm); plastic is cheaper but removes less heat. Through-hole pins add inductance and limit density; SMT avoids this. Wire bonding: 25 µm gold wires to a peripheral pad frame at 100–200 µm pitch → a few hundred I/Os on 1 cm²; pad-limited chips. Lead frame, heat spreader; advanced packages are like PCBs with planes and controlled-impedance lines. Flip-chip / C4 (IBM 1960s): area array of solder bumps on top metal (wafer bumping), chip flipped and reflowed; no bond-wire inductance; ≤ 150 µm pitch → thousands of connections (Xeon: 13,164 bumps, mostly power/ground for 120 A); harder to probe for debug. Core i7 LGA: 1366 pads, bypass caps under the die. Package model: signal L, mutual L and C (crosstalk), V_DD/GND L and R, package bypass capacitors with their own parasitics.",
    steps: [
      { k: "learn", title: "What a package must do", b: [
        `<ul><li>Carry signals and power with little delay or distortion</li><li>Remove heat</li><li>Protect the die from damage and thermal-expansion stress</li><li>Be cheap to make and test</li></ul>`,
        `<p>Most of this means: <b>short, low-resistance, low-inductance</b> connections.</p>`,
      ]},
      { k: "learn", title: "A tour of packages", b: [
        `<div class="tbl"><table><tbody><tr><td>DIP, PGA</td><td>through-hole pins (100 mil); easy to socket; pins add inductance</td></tr><tr><td>SOIC, TSOP, QFP, PLCC</td><td>surface-mount leads on two or four sides</td></tr><tr><td><b>BGA</b></td><td>an array of solder balls underneath: many I/Os, low parasitics</td></tr><tr><td>LGA</td><td>like BGA but gold pads into a socket (desktop CPUs)</td></tr><tr><td>CSP</td><td>barely bigger than the die; phones</td></tr></tbody></table></div>`,
      ]},
      { k: "learn", title: "Wire bonds versus flip-chip", b: [
        `<div class="two"><div class="tile"><h3>Wire bonding</h3><p>Gold wires from a ring of pads round the edge. Pads 100–200 µm apart: a few hundred I/Os on a 1 cm² chip. Big I/O counts make a chip <b>pad-limited</b>. Each wire ≈ 1 nH/mm.</p></div><div class="tile"><h3>Flip-chip (C4)</h3><p>Solder bumps all over the top surface, chip flipped onto the package. ≤150 µm pitch: thousands of connections (a Xeon has 13,164 bumps, mostly power and ground for 120 A). ~100 pH each. But you can no longer probe the top metal.</p></div></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 1 cm × 1 cm die with peripheral pads at 150 µm pitch. Roughly how many pads fit around the edge?", a: 267, tol: 0.03, why: "Perimeter 40 mm / 0.15 mm ≈ 267. An area array at the same pitch would allow (10/0.15)² ≈ 4400." },
      ]},
      { k: "learn", title: "The package is part of the circuit", b: [
        `<p>Every signal lead has inductance and couples to its neighbours (crosstalk). Power and ground leads add R and L in series with the supply. Package bypass capacitors help, but carry their own parasitics. Neglecting the package is one of the chapter's pitfalls.</p>`,
        seenV("Inductance and crosstalk.", "06-interconnect.html", "Chapter 6"),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why have high-performance chips moved from wire bonding to flip-chip packaging?", model: "Wire bonding can only place pads around the chip's edge, limiting I/O count and making the long bond wires add significant inductance. Flip-chip puts solder bumps across the whole surface, giving thousands of short, low-inductance connections. Many of them can deliver power and ground right where the current is needed, which cuts supply noise and IR drop." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Heat and temperature sensors", mins: 20,
    blurb: "A thermal Ohm's law, why forced air is running out, and measuring temperature with two bipolar transistors.",
    takeaway: "A 60 W bulb spreads heat over ~120 cm²; a 150 W CPU over 1.6 cm²: 180× the power density. Heat flows junction → substrate → package → heat sink → air (convection). Thermal Ohm's law: ΔT = θ_ja·P (EQ 13.1), θ_ja = θ_jp + θ_pa (EQ 13.2); θ_pa usually dominates in cheap packages. Still air ≈ 0.001 W/(cm²·°C) → 10 cm² package ≈ 100 °C/W (~1 W max); forced air 0.01–0.03 W/(cm²·°C). 72-pin ceramic PGA θ_pa: 34 °C/W still air, 18 at 400 ft/min, 10 with a good heat sink; liquid cooling down to 0.3 °C/W; microchannels promising. Example 13.1: θ_ja = 0.9 + 0.1 + 4.0 = 5 °C/W, ΔT = 100 − 55 = 45 °C → 9 W. Practical low-cost limit grew from ~8 W (1985) to ~130 W (2008); forced air is near its limit. Temperature sensors at hot spots drive DVFS or throttling. Bipolar: I_c = I_s e^(qV_BE/kT); V_BE depends on I_s (temperature-dependent), but ΔV_BE between identical transistors at currents mI and I is (kT/q) ln m: proportional to absolute temperature (PTAT). Built from the parasitic vertical pnp (p+ diffusion / n-well / p-substrate); diodes suffer recombination errors. Example 13.2: m = 10 → (k/q) ln 10 = 198 µV/K. Nonlinearity → calibrate at a known temperature (1 s calibration ≈ 0.5 °C accuracy; two-point too slow); I ≈ 1 µA.",
    steps: [
      { k: "learn", title: "Thermal Ohm's law", b: [
        `<p>Heat flow is like current, temperature difference like voltage:</p>`,
        `<p class="eq">ΔT = θ<sub>ja</sub> · P &nbsp;&nbsp; θ<sub>ja</sub> = θ<sub>jp</sub> + θ<sub>pa</sub></p>`,
        `<p>θ in °C/W. Junction-to-package θ<sub>jp</sub> is small; package-to-air θ<sub>pa</sub> usually dominates. A heat sink and fan attack θ<sub>pa</sub>.</p>`,
      ]},
      { k: "learn", title: "Example 13.1", b: [
        `<p>A BGA with a passive heat sink in a box with a fan: θ<sub>jp</sub> = 0.9, adhesive 0.1, heat sink 4.0 °C/W. Ambient up to 55 °C; junction limit 100 °C.</p>`,
        `<p class="eq">P<sub>max</sub> = (100 − 55) / (0.9 + 0.1 + 4.0) = 45 / 5 = 9 W</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Still air removes about 0.001 W/(cm²·°C). What is θ_pa (°C/W) for a package with 25 cm² of surface?", a: 40, tol: 0.01, why: "1 / (0.001 × 25) = 40 °C/W: about 1–2 W before it gets too hot." },
      ]},
      { k: "learn", title: "Cooling is running out", b: [
        `<p>A 150 W processor on 1.6 cm² has 180× the power density of a light bulb. Practical cheap cooling grew from ~8 W (1985) to ~130 W (2008), and forced air is near its limit. That cap on power shapes everything from Chapter 5 onward.</p>`,
        seenV("Why power limits performance.", "05-power.html", "Chapter 5"),
      ]},
      { k: "learn", title: "A thermometer from two transistors", b: [
        `<p>A bipolar transistor's V<sub>BE</sub> depends on temperature in a messy way. But run two identical ones at currents mI and I, and the messy part cancels:</p>`,
        `<p class="eq">ΔV<sub>BE</sub> = (kT/q) ln m</p>`,
        `<p>Exactly proportional to absolute temperature (PTAT). Every CMOS process has a parasitic vertical pnp to use. Chips put these sensors at hot spots to throttle or lower V<sub>DD</sub> before overheating.</p>`,
        mathLink("Exponentials and logarithms:", "08-exp-log.html", "Math 8"),
      ]},
      { k: "check", title: "Example 13.2", b: [
        { t: "num", q: "Current ratio m = 10. Temperature coefficient of ΔV_BE in µV/K? (k/q = 86.17 µV/K)", a: 198, tol: 0.01, why: "86.17 µV/K × ln 10 = 86.17 × 2.303 ≈ 198 µV/K." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why measure the difference of two V_BE values instead of one V_BE?", model: "A single V_BE depends on the saturation current I_s, which varies strongly and unpredictably with temperature and processing. Two matched transistors have the same I_s, so in the difference of their V_BE values it cancels, leaving (kT/q) times the log of their current ratio. That's a clean voltage proportional to absolute temperature." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Power distribution: IR, L di/dt, bypass capacitance", mins: 25,
    blurb: "Keep V_DD within ±10% while the current jumps by tens of amps. The worked examples show why grids and decoupling capacitors are essential.",
    takeaway: "Power distribution: on-chip wires, package, board, bypass capacitors. Goals: stable voltage, average and peak current, signal return paths, no electromigration or self-heating, little area, easy layout; noise target typically ±10%. Power varies over many time scales (operations, clock edges, clock gating). Noise sources: IR drop and L di/dt. On-chip: cell power buses (e.g., 8λ metal1) connected by abutment; small designs strap rows; large ones use a grid on all metal layers with top metal carrying most current, many vias; interdigitate with signals for return paths; mirror alternate rows. Pad-ring supplies give worst IR drop at the chip center; C4 bumps deliver current where needed. IR: on-chip resistance dominates; well-bypassed grids need only carry the average current. Example 13.3: 64 repeaters on a 320 µm × 1 µm metal2 bus (0.05 Ω/□ → 16 Ω), each drawing C·ΔV/Δt = 0.4 pF × 1.8 V / 200 ps = 3.6 mA → 64IR/2 = 1.85 V (impossible: in reality ~30% droop and doubled delay); give each repeater its own grid wire. L di/dt: bond wire ~1 nH/mm, C4 ~100 pH; packages devote ≥ 50% of pins to power; transients from I/O switching and idle↔active changes. Example 13.4: 20 A → 60 A in 1 ns through 20 pH → 0.8 V; some chips ramp power over many cycles. Bypass (decoupling) capacitance supplies current locally: Example 13.5: 40 A for 1 ns with 0.2 V droop → C = IΔt/ΔV = 200 nF. Symbiotic bypass: about half of all quiescent gate capacitance; Example 13.6: 1 fF/µm, 9% gate coverage → 0.045/f nF/mm² ≈ 0.7 nF/mm² at 65 nm. High-power chips add explicit decaps (Niagara2: 700 nF), nMOS with gate to V_DD; thick oxide to cut gate leakage (Rock: −20% density).",
    steps: [
      { k: "learn", title: "Two kinds of supply noise", b: [
        `<p>The target: V<sub>DD</sub> within about <b>±10%</b> everywhere, always.</p>`,
        `<div class="two"><div class="tile"><h3>IR drop</h3><p>Current through the resistance of the on-chip grid (and pins, package, board). Worst where wires are longest.</p></div><div class="tile"><h3>L di/dt</h3><p>A changing current through the inductance of bumps, bond wires and package. Worst when activity jumps.</p></div></div>`,
        seenV("Supply noise as a variation source.", "07-robustness.html", "Chapter 7"),
      ]},
      { k: "learn", title: "Example 13.3: a starved row of repeaters", b: [
        `<p>64 repeaters share one metal2 power bus, 320 µm × 1 µm at 0.05 Ω/□: R = 16 Ω. Each repeater drives 0.4 pF with a 200 ps edge:</p>`,
        `<p class="eq">I = C·ΔV/Δt = 0.4 pF × 1.8 V / 200 ps = 3.6 mA</p>`,
        `<p>Distributed along the wire, the droop is about 64·I·R/2 = <b>1.85 V</b>: more than V<sub>DD</sub>! In reality the repeaters starve, droop ~30%, and run twice as slow. The fix: a <b>grid</b>, so each repeater gets its own supply wire.</p>`,
      ]},
      { k: "check", title: "Example 13.4", b: [
        { t: "num", q: "A 1 GHz chip jumps from 20 A to 60 A in one cycle. Supply inductance 20 pH, no on-chip bypass. L·di/dt noise in volts?", a: 0.8, tol: 0.01, why: "di/dt = 40 A / 1 ns = 4×10¹⁰ A/s; × 20 pH = 0.8 V. Hopeless at a 1 V supply." },
      ]},
      { k: "learn", title: "Bypass capacitors", b: [
        `<p>Capacitance between V<sub>DD</sub> and GND, spread across the chip, supplies sudden current locally, before any inductance has to respond:</p>`,
        `<p class="eq">C = I·Δt / ΔV</p>`,
        `<p>Example 13.5: 40 A for 1 ns with at most 0.2 V droop needs <b>200 nF</b>.</p>`,
      ]},
      { k: "learn", title: "Free capacitance", b: [
        `<p>Every quiescent gate is a capacitor between a node held at V<sub>DD</sub> and one at GND. About <b>half</b> of all gate capacitance works as <b>symbiotic bypass</b> at any moment.</p>`,
        `<p>Example 13.6: gate capacitance 1 fF/µm, gates cover 9% of the area → 0.045/f nF/mm², ≈ 0.7 nF/mm² at f = 65 nm.</p>`,
        `<p>High-power chips add explicit decaps (Niagara2: 700 nF): nMOS transistors with gate on V<sub>DD</sub>, source and drain on GND. Thick oxide reduces their leakage at some loss of density.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 1 cm² die at 65 nm with 0.7 nF/mm² of symbiotic bypass. Total, in nF?", a: 70, tol: 0.01, why: "100 mm² × 0.7 nF/mm² = 70 nF. Compare Example 13.5's 200 nF for a 40 A spike: high-power chips need explicit decaps." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a well-bypassed power grid only need low enough resistance for the average current?", model: "Sudden current spikes, for example at clock edges, are supplied by nearby bypass capacitance, which then recharges slowly between spikes. So the grid's resistance only has to deliver the average current without excessive IR drop, not the peak current." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Supply impedance, droops, and odd jobs", mins: 25,
    blurb: "A target impedance, capacitors that turn into inductors, three droops, and then supply filters, charge pumps, substrate noise and energy scavenging.",
    takeaway: "Lumped model (Figure 13.10): regulator, bulk cap, board planes, ceramic caps, package and pins, package caps, bumps, on-chip caps, current source; external caps have ESR and ESL (bigger caps → more ESL); each stage toward the regulator ~10× more C and ~10× more L (e.g., 1 µF on die, 10s of µF package, 100s of µF board, 1 mF regulator; ~1 pH die–package, 10 pH package–board, 100 pH board–regulator; fractions of mΩ). Target impedance Z = rV_DD²/P (EQ 13.10): 1.0 V, 100 W, 10% → 1 mΩ; falls quadratically with V_DD and with power; drove flip-chip packages, more metal and on-chip decap. Without bypass, Z = R + jωL is too high above ~1 MHz. Capacitor with ESR/ESL: Z = 1/(jωC) + R + jωL (EQ 13.11), minimum R at f = 1/(2π√LC) (EQ 13.12): 1 µF, 0.25 nH, 0.03 Ω → 10 MHz. Use many capacitor sizes; bulk/ceramic 1–10 MHz, package 10–200 MHz, above a few hundred MHz only on-chip decap works; Pentium 4 impedance peak near 100 MHz from the package. Step response: first droop (on-chip caps drain until bump current rises; ringing from bump L), second droop (package caps), third droop (board caps) before the regulator catches up; minimize with enough low-ESL caps at each stage. Pentium 4 experiment: removing decap raised first droop by 8% V_DD but slowed frequency only 1% (noise modulates the clock in a way that tracks the path). Distributed mesh models: SPICE netlists, days of simulation, maps of droop (Itanium 2 IEU). Supply filtering: RC filter with one wire/bump + big capacitor for PLLs, clock buffers, analog (Pentium 4 clock buffers: pMOS resistor, 2.5 ns RC, 70 mV IR drop, noise 10% → 2%). Charge pumps (Dickson): nodes pumped by alternating nonoverlapping clocks through capacitors and diode-connected nMOS; V_out ≈ N[(C·V_DD/(C + C_s)) − V_t − I_out/(f(C + C_s))] (EQ 13.13); negative pumps with pMOS (bodies to GND); for Flash 20 V or negative body bias. Substrate noise: coupling through junctions and impact ionization modulates V_t via body effect; hurts mixed-signal; plenty of substrate/well contacts, guard rings, separation, quiet analog supplies, triple-well or SOI. Energy scavenging: solar, thermoelectric, piezoelectric, RF (RFID): tens–hundreds of µW/cm²; thin-film microbatteries ~100 µW·h/cm².",
    steps: [
      { k: "learn", title: "A target impedance", b: [
        `<p>If the chip draws P watts and supply noise must stay below r·V<sub>DD</sub>, the supply network's impedance must be below</p>`,
        `<p class="eq">Z = r·V<sub>DD</sub>² / P</p>`,
        `<p>1.0 V, 100 W, 10% → <b>1 mΩ</b>, at every frequency the chip's current contains. Lower voltage and higher power both shrink it quadratically/linearly.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 0.8 V, 50 W chip allowing 5% noise. Target supply impedance in mΩ?", a: 0.64, tol: 0.01, why: "0.05 × 0.8² / 50 = 0.032 / 50 = 0.64 mΩ." },
      ]},
      { k: "play", title: "Real capacitors aren't capacitors", b: [
        `<p>Every capacitor has series resistance (ESR) and inductance (ESL). Above its self-resonant frequency it behaves like an inductor. Predict: bigger C moves the dip which way?</p>`,
        capZ,
        `<p>So a supply uses many sizes, each covering a frequency band: bulk and ceramic caps 1–10 MHz, package caps 10–200 MHz, and above a few hundred MHz only <b>on-chip</b> capacitance helps, because the bumps' inductance blocks everything else.</p>`,
      ]},
      { k: "learn", title: "Three droops", b: [
        `<p>Step the chip's current up. The on-chip caps drain first: the <b>first droop</b>, deep and fast. Current through the bumps rises (with some ringing) while the package caps drain: the <b>second droop</b>. Then the board caps: the <b>third droop</b>, until the regulator catches up.</p>`,
        `<p class="aside">A surprise from the book: Pentium 4 wafers built without decap had an 8% deeper first droop but ran only 1% slower, because the noise stretched the clock period along with the logic delay.</p>`,
      ]},
      { k: "learn", title: "Odd jobs on the power network", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>Supply filter</b></td><td>an RC low-pass for PLLs, clock buffers, analog. Pentium 4 clock buffers: 2.5 ns time constant, 70 mV IR drop, noise cut from 10% to 2%.</td></tr>
          <tr><td><b>Charge pump</b></td><td>capacitors pumped by two clock phases ratchet a node above V<sub>DD</sub> (Flash's 20 V) or below GND (body bias).</td></tr>
          <tr><td><b>Substrate noise</b></td><td>digital switching couples into the shared substrate and shifts V<sub>t</sub> through the body effect. Contacts, guard rings, separation, triple wells, SOI.</td></tr>
          <tr><td><b>Energy scavenging</b></td><td>solar, thermal, vibration, RF: tens to hundreds of µW/cm², enough for subthreshold circuits.</td></tr></tbody></table></div>`,
        seenV("Subthreshold circuits.", "09-combinational.html", "Chapter 9"),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must a chip's power network use several sizes of bypass capacitor, at different distances from the die?", model: "Each real capacitor has series inductance, so it only has low impedance near and below its self-resonant frequency; above that it acts like an inductor. Large capacitors have more inductance and resonate at lower frequencies, and capacitors farther from the die have more board and package inductance between them and the load. So big capacitors near the regulator handle low frequencies, smaller ones on the board and in the package handle mid frequencies, and only on-chip capacitance can supply the highest-frequency current." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Clocks: skew, its sources, and clock generation", mins: 20,
    blurb: "What clock skew really means, where it comes from, and why chips use a PLL or DLL as a zero-delay buffer.",
    takeaway: "Clocks must reach latches, flops, memories and dynamic gates at nearly the same time; the challenge is skew vs power, metal and design effort. Logical clocks (ideal, HDL) vs physical clocks (actual, skewed). Distribute a single global clock; local clock gaters (buffers, enable ANDs, inverters, pulse generators) make the physical clocks over short wires. Skew = difference between nominal and actual interarrival times (Figure 13.18: clk1 arrives 25 ps before clk2 → 25 ps skew; with 30 ps intentional delay, skew is 5 ps; prefer “intentional delay” over “intentional skew”). Skew between different edges and across cycles (Figure 13.19); hold checks use the same edge, setup checks the next cycle's edge; networks add more skew cycle-to-cycle. Skew budget: larger than any actual skew on any working chip, but no larger. Clock domains (e.g., within 500 µm) get local vs global budgets. Sources: systematic (nominal mismatch, predictable by simulation, tunable), random (manufacturing; could be calibrated once), drift (slow environmental, e.g., temperature; needs periodic recalibration), jitter (high-frequency, mainly supply noise; can't be compensated). Clock system: external clock → pads → generation (PLL/DLL) → global distribution → gaters → elements. Pad, buffer and gater delay (0.5–1 ns on a large chip) varies with PVT and noise, desynchronizing internal and external clocks; PLLs and DLLs regulate the delay to an integer number of periods: zero-delay buffers. Phase detector → loop filter → oscillator (PLL: adjusts frequency, hence phase) or delay line (DLL: adjusts delay). PLL can multiply frequency (divider N in feedback, M in input: f_out = (N/M)f_in); its loop filter is more complex. Bandwidth (fast response to supply noise vs slow to reject input jitter) and stability; PLLs need more care.",
    steps: [
      { k: "learn", title: "Logical and physical clocks", b: [
        `<p>The designer writes one ideal <b>logical</b> clock (or φ1/φ2). The chip delivers thousands of slightly different <b>physical</b> clocks. One global clock is distributed; <b>local clock gaters</b> near the flops make the actual clocks (buffers, enables, complements, pulses).</p>`,
        `<p><b>Skew</b> = actual minus nominal interarrival time. If clk2 is deliberately delayed 30 ps and arrives 25 ps late, the skew is 5 ps; the 30 ps is <i>intentional delay</i>, not skew.</p>`,
      ]},
      { k: "learn", title: "Four sources of skew", b: [
        `<div class="tbl"><table><tbody><tr><td><b>Systematic</b></td><td>present even at nominal conditions (unequal wires and loads). Simulate and tune it out.</td></tr><tr><td><b>Random</b></td><td>manufacturing variation in wires and transistors. Could be measured and calibrated once.</td></tr><tr><td><b>Drift</b></td><td>slow changes, e.g. the chip warming up. Recalibrate periodically.</td></tr><tr><td><b>Jitter</b></td><td>fast changes, mostly supply noise. Too fast to compensate: the worst kind.</td></tr></tbody></table></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which kind of skew is it?", bins: ["Systematic", "Random", "Drift", "Jitter"], items: [
          ["One branch of the clock tree is 3.1 mm, the other 3.0 mm", 0, "Predictable from the layout."],
          ["Two nominally identical gaters differ because of channel-length variation", 1, "Unpredictable but fixed for a given chip."],
          ["Skew changes over the first minute as the chip heats up", 2, "Slow environmental change."],
          ["Supply noise shifts one gater's delay for a few cycles", 3, "Too fast to correct."],
        ]},
      ]},
      { k: "learn", title: "Zero-delay buffers", b: [
        `<p>The external clock passes through a pad, buffers and gaters: 0.5–1 ns that varies with PVT and noise. A <b>PLL</b> or <b>DLL</b> compares the distributed clock with the input and adjusts until the delay is exactly a whole number of cycles. Then the internal clock is indistinguishable from the external one: a <b>zero-delay buffer</b>.</p>`,
        `<div class="two"><div class="tile"><h3>PLL</h3><p>Adjusts an oscillator's <i>frequency</i> (and so its phase). Can multiply frequency: f<sub>out</sub> = (N/M)·f<sub>in</sub>. Harder to keep stable.</p></div><div class="tile"><h3>DLL</h3><p>Adjusts a delay line. Simpler and more stable, but can't change frequency.</p></div></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 100 MHz crystal, a PLL with input divider M = 4 and feedback divider N = 30. Output frequency in MHz?", a: 750, tol: 0.001, why: "(N/M)·f_in = (30/4) × 100 = 750 MHz." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't jitter be removed by adaptive deskewing, while systematic and random skew can?", model: "Systematic and random skew are fixed for a given chip, and drift changes slowly, so they can be measured and cancelled with adjustable delay elements, once or periodically. Jitter comes from fast changes such as power supply noise, varying from cycle to cycle, faster than any calibration loop can respond. It has to be budgeted or reduced at its source, for example by filtering the supply." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Clock distribution, gaters and skew budgets", mins: 25,
    blurb: "Grids, H-trees, spines and hybrids; gaters whose phases stay matched in every corner; and how much skew to budget.",
    takeaway: "Clock wire RC across a 15 mm die ≈ 1 ns, so routing must equalize flight time; random skew, drift and jitter scale with distribution delay, so keep it short. Network styles (Restle98): grids (mesh of horizontal and vertical wires driven from the middle or edges), H-trees (recursive H from the center, equal wire lengths), spines (rows of buffers driving length-matched serpentines), ad hoc (tools balance nominal delays; ASICs at hundreds of MHz), and hybrids (H-tree driving many points of a grid). Itanium 2: modified H-tree with differential primary driver and repeaters, custom-routed to second-level clock buffers (SLCBs) with adjustable delay, few stages, filtered supply. Pentium II/III two spines, Pentium 4 three spines feeding 47 gated domains with adjustable delay buffers. IBM Power4/PowerPC/S/390: primary H-tree to 16–64 sector buffers, tunable trees driving the global grid at up to 1024 points. Layout: uniform and fast; 10% variation on an 800 ps tree = 80 ps jitter, on 1600 ps = 160 ps; thick top metal, shielded with V_DD/GND, model as transmission lines (field solver), split wide wires interdigitated with returns. Gaters: < 1 mm output wires; short gater delay limits skew; crisp edges (fanout ≤ 4); matching a 2-inverter clk path to a 3-inverter clkb path: equal second-stage effort (h2 = hb) keeps them matched in all corners; minimum delay with h_a = h_c = h* = 1 + √(1 + p_inv) (EQ 13.16) → h1 = h*² ≈ 5.8, h2 = hb = F/5.8, ha = hc ≈ 2.4 for p_inv = 1; or inverter + TG vs two inverters. Skew budgets: ignore (conservative hold, slow flops), worst-case everywhere (design to T_c − skew, e.g., 3.5 ns for 4 ns), or multiple local/global budgets below ~25 FO4 cycles (needs a good timing analyzer). Separate setup (include cycle-to-cycle jitter) and hold budgets. Worst-case sum too pessimistic; sources aren't Gaussian (RSS inappropriate); Monte Carlo; hold budget so 95–99% of chips pass; include data-path variation. In practice ~10% of cycle; published measurements (avg 3.2%) are optimistic. Adaptive deskewing: digitally adjustable delay lines (thermometer-coded), phase comparators (Pentium II loop; Pentium 4 via scan: 46 comparators, skew ~64 ps → ±8 ps; Itanium 2 blows fuses at test); extra delay adds jitter unless supplies are filtered.",
    steps: [
      { k: "learn", title: "Why distribution is hard", b: [
        `<p>Across a 15 mm die, clock wire RC delay is around 1 ns. Random skew, drift and jitter all scale with that delay, so the network must be both <b>balanced</b> and <b>fast</b>. A 10% delay variation costs 80 ps on an 800 ps tree, 160 ps on a 1600 ps one.</p>`,
      ]},
      { k: "learn", title: "Network styles", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>Grid</b></td><td>a mesh of horizontal and vertical wires, driven from the middle or the edges, passing near every clocked element</td></tr>
          <tr><td><b>H-tree</b></td><td>recursive H shapes from the center: every leaf has the same wire length (Itanium 2 used a modified, custom-routed one)</td></tr>
          <tr><td><b>Spines</b></td><td>rows of buffers driving length-matched serpentine wires to small groups (Pentium 4: three spines, 47 individually gated domains)</td></tr>
          <tr><td><b>Ad hoc</b></td><td>routed with some attempt to balance delays; ASICs at a few hundred MHz</td></tr>
          <tr><td><b>Hybrid</b></td><td>an H-tree driving many points of a grid (IBM Power4, PowerPC, S/390: up to 1024 points)</td></tr></tbody></table></div>`,
        `<p class="aside">Weighing these against each other is one of the chapter's exercises, so think it through yourself: for each style, ask where the systematic skew comes from, what happens to random variation, and how much metal it uses.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Supply noise changes clock-buffer delays by 8%. How much jitter (ps) does that cause on a distribution network with 1.2 ns of delay?", a: 96, tol: 0.01, why: "8% × 1200 ps = 96 ps. Halve the network delay and you halve the jitter: that's why clock networks must be fast." },
      ]},
      { k: "learn", title: "Clock gaters that stay matched", b: [
        `<p>clk comes from two inverters, clkb from three. Even if their delays match in the TT corner, they drift apart in FS and SF corners, <i>unless</i> the second inverter in each chain has the same effort (h<sub>2</sub> = h<sub>b</sub>). Choosing the rest for least delay gives</p>`,
        `<p class="eq">h* = 1 + √(1 + p<sub>inv</sub>) ≈ 2.4 &nbsp; h<sub>1</sub> = h*² ≈ 5.8</p>`,
        `<p>for p<sub>inv</sub> = 1, with h<sub>a</sub> = h<sub>c</sub> ≈ 2.4 in the three-inverter path. Then tune in a simulator.</p>`,
        seenV("Equal stage effort gives least delay.", "04-delay.html", "Chapter 4"),
      ]},
      { k: "learn", title: "How much skew to budget?", b: [
        `<ul><li><b>Ignore it</b> and use slow, hold-safe flops; the chip just runs a bit slower than simulated.</li><li><b>Worst case everywhere:</b> e.g. design a 4 ns ASIC for 3.5 ns.</li><li><b>Local and global budgets</b>, needed below about 25 FO4 per cycle.</li></ul>`,
        `<p>Adding up every source's worst case is far too pessimistic; the sources aren't Gaussian either, so root-sum-square is wrong too. Use Monte Carlo, and be conservative for hold. In practice teams end up near <b>10% of the cycle</b>. Published “measured” skews (~3%) are optimistic.</p>`,
      ]},
      { k: "learn", title: "Adaptive deskewing", b: [
        `<p>Put a digitally adjustable delay line (thermometer-coded selects) at each domain, compare phases, and tune. Pentium 4: 46 phase comparators read through scan; skew cut from about 64 ps to ±8 ps. Itanium 2 blows fuses at test. Catch: the extra buffers add jitter unless their supplies are filtered.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why should a clock distribution network be as fast as possible, not just balanced?", model: "Random variation, drift and jitter change each buffer and wire delay by some fraction. The resulting skew is that fraction times the total delay through the network, so a network with half the delay has half the random skew and jitter, even if both are perfectly balanced nominally." }
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Phase-locked loops", mins: 25,
    blurb: "Think in phase, not voltage. Oscillator, divider, phase detector and loop filter make a second-order feedback system.",
    takeaway: "Model a PLL near lock as a linear continuous-time system in phase: clk = 1 when φ mod 2π < π; φ(t) = 2π∫f dt (a ramp for constant f; jitter bends it). Multiply-by-N: φ_out = Nφ + Δφ_out. Assumptions: small deviations near lock (lock acquisition is nonlinear), bandwidth < 1/10 of input frequency (discrete phase detection approximated as continuous). VCO (or ICO, DCO): Δf_out = K_vco·ΔV_ctrl (EQ 13.22), and since phase integrates frequency, Δφ_out(s)/ΔV_ctrl(s) = 2πK_vco/s (EQ 13.23): phase changes only by integration: jitter accumulation, more stability risk than DLLs. Ring-oscillator VCO with regulated supply (9 stages; K_vco ≈ 12 GHz/V near 3 GHz at TT; curve nonlinear and shifts with corners: tuning range and K_vco variation are the challenges); alternatives vary load capacitance or drive (current-starved) with voltage, current or digital control (smaller range); LC and crystal oscillators have lower noise, rings are easy and wide-range. Divider: modulo-N counter, Δf_fb = Δf_out/N, Δφ_fb = Δφ_out/N (EQ 13.24); must work above nominal frequency (startup). Phase detectors: XOR (duty cycle ∝ phase difference; K_pd = V_DD/π (EQ 13.25); locks at π/2 + 2πn; sensitive to input duty cycle); phase-frequency detector (two flops + AND reset producing UP/DN pulses; with a charge pump K_pd = I_cp/2π (EQ 13.26); insensitive to duty cycle; sign kept over ±2π so it also detects frequency: preferred for clock PLLs, but bad for DLLs and not for CDR). Loop filter: proportional + integral, V_ctrl/I_pd = K_I/s + K_P (EQ 13.27); charge pump into series R and C (plus small C2 for ripple, C ≥ 10× C2): R + 1/sC (EQ 13.28). Closed loop (EQ 13.29–13.32): H(s) = N(2ζω_n s + ω_n²)/(s² + 2ζω_n s + ω_n²), ω_n = √(I_cp K_vco/(NC)), ζ = ω_n RC/2. ω_n sets bandwidth: high to track on-chip noise on V_ctrl, low to reject input jitter; ≥ 10× below input frequency. ζ < 1/√2 rings; choose 0.7–1. Validate in SPICE across corners (steps, impulses, sinusoids; AC analysis in the phase domain). Advanced: self-biased PLLs scale I_cp and R with frequency and process; all-digital PLLs (DCO + digital filter).",
    steps: [
      { k: "learn", title: "Think in phase", b: [
        `<p>A clock's <b>phase</b> φ(t) is the integral of its frequency: a straight ramp for a perfect clock, wobbling when there's jitter. A PLL is analysed by how small changes in input phase show up in output phase, near lock, using Laplace transforms (s = differentiate, 1/s = integrate).</p>`,
        mathLink("s-domain thinking and second-order systems:", "37-feedback.html", "Math 37"),
      ]},
      { k: "learn", title: "The four blocks", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>VCO</b></td><td>frequency = f<sub>0</sub> + K<sub>vco</sub>·ΔV<sub>ctrl</sub>; phase is its integral: 2πK<sub>vco</sub>/s. E.g. a regulated-supply ring oscillator, K<sub>vco</sub> ≈ 12 GHz/V near 3 GHz.</td></tr>
          <tr><td><b>Divider</b></td><td>÷N counter in the feedback path; must work even if the VCO starts too fast.</td></tr>
          <tr><td><b>Phase detector</b></td><td>XOR (output duty cycle ∝ phase error) or phase-frequency detector (UP/DN pulses into a charge pump: K<sub>pd</sub> = I<sub>cp</sub>/2π).</td></tr>
          <tr><td><b>Loop filter</b></td><td>R in series with C: proportional + integral control. The C integrates any steady error to zero; the R reacts immediately.</td></tr></tbody></table></div>`,
      ]},
      { k: "check", title: "Predict", b: [
        { t: "mcq", q: "The phase detector sees an error and the loop changes V_ctrl at once. Does the output phase jump immediately?", opts: [["No: the VCO changes frequency, and phase only changes as that integrates over time", true, "Errors can even keep growing briefly: jitter accumulation, and why PLLs are harder to stabilize than DLLs."], ["Yes, instantly", false, "That's a delay line (DLL), not an oscillator."], ["Only if N = 1", false, "N doesn't change the integration."]] },
      ]},
      { k: "learn", title: "Why a PFD?", b: [
        `<p>An XOR detector's output repeats every π and depends on the clocks' duty cycles. A <b>phase-frequency detector</b> keeps its sign over a full ±2π and responds to edges only: if the VCO is at the wrong frequency, it keeps pushing the right way. Preferred for clock PLLs.</p>`,
      ]},
      { k: "learn", title: "Loop dynamics", b: [
        `<p class="eq">H(s) = N · (2ζω<sub>n</sub>s + ω<sub>n</sub>²) / (s² + 2ζω<sub>n</sub>s + ω<sub>n</sub>²)</p>`,
        `<p class="eq">ω<sub>n</sub> = √(I<sub>cp</sub>K<sub>vco</sub> / (N·C)) &nbsp;&nbsp; ζ = ω<sub>n</sub>RC / 2</p>`,
        `<p><b>ω<sub>n</sub></b> is the bandwidth: high to correct on-chip noise quickly, low to filter a jittery input. Keep it ≥10× below the input frequency. <b>ζ</b> is the damping: below 1/√2 it rings; aim for 0.7–1.</p>`,
      ]},
      { k: "play", title: "Damping", b: [
        `<p>The output phase after a sudden step in input phase. Predict the overshoot at ζ = 0.7, then slide.</p>`,
        pllStep,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "You double the loop-filter resistor R. What happens?", opts: [["ζ doubles (more damping); ω_n is unchanged", true, "ω_n depends on I_cp, K_vco, N and C; ζ = ω_n RC/2 scales with R."], ["ω_n doubles", false, "R doesn't appear in ω_n."], ["The loop becomes unstable", false, "More damping, not less."]] },
        { t: "num", q: "I_cp = 100 µA, K_vco = 1 GHz/V, N = 10, C = 100 pF. ω_n in units of 10⁶ rad/s? (Use ω_n² = I_cp·K_vco·2π/(N·C) with K_vco in Hz/V, so the units come out in rad/s.)", a: 25.07, tol: 0.03, why: "100 µA × 1×10⁹ × 2π / (10 × 100 pF) = 6.28×10¹⁴ → ω_n ≈ 2.5×10⁷ rad/s (≈ 4 MHz): well below a typical input clock." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What do the resistor and the capacitor each do in a charge-pump PLL's loop filter?", model: "The capacitor integrates the charge-pump current, so any persistent phase error keeps moving the control voltage until the error is zero; it sets the VCO to the right frequency. The resistor adds a voltage proportional to the instantaneous error, giving an immediate proportional correction that damps the loop. Without it, the loop of two integrators would oscillate." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "DLLs and how loops fail", mins: 15,
    blurb: "A delay line instead of an oscillator: first order, simpler, and with its own ways to lock wrong.",
    takeaway: "DLL: variable delay line (+ buffers) adjusted until the output is delayed by exactly one period. Linear model in time (T, not φ); first-order, avoiding many PLL stability risks. Taps give multiple phases (8 stages tapped every other: 1/4, 1/2, 3/4 cycle). VCDL: ΔT_out = K_vcdl·ΔV_ctrl (EQ 13.33), acts almost instantly: no jitter accumulation; e.g., current-starved inverter chain; wide tuning range needed across corners but risks false lock. PFD + charge pump: I_pd/T_err = I_cp/T_c (EQ 13.34). Loop filter: single capacitor (integral only, EQ 13.35). Closed loop H(s) = 1/(sτ + 1) (EQ 13.36), τ = CT_c/(I_cp K_vcdl) (EQ 13.37) ≥ 10T_c. A DLL passes input jitter straight through; use a PLL to filter a noisy input. Pitfalls (convergence far from lock; no systematic validation, so don't repeat known bugs): PLL divider slower than the VCO at startup misses edges, looks too slow, PLL speeds up further: deadlock; fix by resetting V_ctrl to start slow. DLL may lock to any multiple of T_c (more jitter) or chase a lock point outside its delay range: deadlock; PFDs in DLLs, if not initialized, can force such a point. Pitfall list: goofing your PLL/DLL: specialist teams or licensed IP.",
    steps: [
      { k: "learn", title: "A delay-locked loop", b: [
        `<p>Replace the oscillator with a <b>variable delay line</b> and adjust it until the output is exactly one cycle behind the input. Changing the delay shifts the clock <i>immediately</i> (no integration), so a DLL is a <b>first-order</b> loop: simpler and more stable than a PLL.</p>`,
        `<p class="eq">H(s) = 1 / (sτ + 1), &nbsp; τ = C·T<sub>c</sub> / (I<sub>cp</sub>K<sub>vcdl</sub>) ≥ 10 T<sub>c</sub></p>`,
        `<p>Tap the line part-way to get extra phases: from 8 stages, every second tap gives ¼, ½, ¾ and 1 cycle.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "The input clock is very jittery. PLL or DLL to clean it up?", opts: [["PLL: a low-bandwidth PLL follows the average input phase and filters the jitter", true, "A DLL just delays the input, jitter and all."], ["DLL", false, "It passes input jitter straight to the output."], ["Either", false, "Only the PLL makes a new clock."]] },
      ]},
      { k: "learn", title: "How loops lock wrong", b: [
        `<p>Linear analysis only describes behaviour <i>near</i> lock. Starting far away, loops can get stuck:</p>`,
        `<ul><li><b>PLL divider too slow:</b> the VCO starts faster than the divider can count, so the divider misses edges and its output looks <i>slow</i>. The loop speeds the VCO up even more: deadlock. Fix: start with a low V<sub>ctrl</sub>.</li><li><b>DLL wrong multiple:</b> a DLL is happy with 2 or 3 cycles of delay (more jitter), or may chase a lock point outside its delay range forever. A PFD with uninitialized state can drive it there.</li></ul>`,
        `<p class="key">The book's advice: PLLs are notoriously hard. Successful companies have a specialist team or license proven designs.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is a DLL easier to stabilize than a PLL?", model: "A DLL's delay line changes the output timing almost immediately when its control changes, so the loop has only one integrator, the loop filter capacitor, and is first-order. A PLL's oscillator changes frequency, and phase is the integral of frequency, adding a second integrator. Two integrators can oscillate unless the loop is carefully damped." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "I/O pads, ESD, and mixed voltages", mins: 25,
    blurb: "Power pads, drivers, receivers with hysteresis, protection from a zap off your fingertip, and talking to chips at other voltages.",
    takeaway: "Good I/O: drives large off-chip capacitance, compatible voltage levels, enough bandwidth, slew-rate control, ESD and overvoltage protection, few pins. Vendors supply characterized pad libraries. A pad = ~100 µm square of top metal (bond wire or solder ball); “pad” may mean the whole cell with ESD and driver/receiver. V_DD/GND pads: ~half of high-performance pins; ground bounce from simultaneously switching outputs; interdigitate power pins with buses; separate dirty I/O supplies (also needed for different I/O voltages). Output pads: drive 2–50 pF with specified edges; very wide folded transistors; buffer chain fanout 6–8 acceptable; final stage may have higher fanout. Latchup risk from transients beyond the rails (bond-wire ringing, unterminated lines): separate nMOS and pMOS, double guard rings (p+ to GND inside, n-well n+ to V_DD outside), dummy collectors; longer and unsilicided gates on output transistors to resist overvoltage. Input pads: buffer/level converter, ESD protection, optional pull-up/down, Schmitt trigger (hysteresis filters slow/noisy inputs). Bidirectional pad: separately controlled nMOS and pMOS (NAND/NOR predrivers; merged 6-transistor version) instead of a 4-transistor totem-pole tristate (half-width output devices). Analog pads: direct connection plus ESD. ESD: oxide breakdown 40–100 V for thick old oxides, ≤ 5 V now; punchthrough; outside-rail voltages raise latchup risk; billions of dollars lost yearly. Protection: controlled discharge path; nonbreakdown devices (diodes, MOSFETs, BJTs) preferred over breakdown devices (SCRs, thick-field-oxide transistors, spark gaps). Input circuit: primary diode clamps (V_DD + 0.7, −0.7 V; ~1 Ω, 10–20 A), current-limiting resistor (100 Ω–3 kΩ, unsilicided p+ in n-well; adds RC delay), secondary clamps; double guard rings. Tests: human body model (100 pF through 1500 Ω), charged device model (chip charged during handling, discharging through a small resistance and inductance); ±15 kV for user-exposed parts (serial ports), 2–4 kV for enclosed parts. Analog/RF pads minimize protection area. MOSIS 1.6 µm bidirectional pad: ~200 µm cell, 100 × 75 µm pad, n+ and p+ diffusion resistors (3.5 squares, 53 and 75 Ω/□ → ~109 Ω parallel), thick-oxide field transistors, double guard rings, folded transistors. Mixed voltage: punchthrough limits V_ds; I/O transistors with longer channels and thicker oxides, or stacked. Table 13.2 standards: TTL (V_IL 0.8, V_IH 2.0), CMOS 5 V, LVTTL, LVCMOS33/25/18/15/12 (0.35/0.65 V_DD at low voltage). Level converters: CVSL output driver with high-voltage transistors; input receiver as a high-voltage inverter; cascoded driver (3.3 V output in 2.5 V process: no device sees more than 2.5 V; apply bias supplies in sequence).",
    steps: [
      { k: "learn", title: "Power pads and ground bounce", b: [
        `<p>Fast chips spend about <b>half</b> their pins on V<sub>DD</sub> and GND. When a 64-bit bus switches together, the outputs dump a big current spike through the package inductance: <b>ground bounce</b>. Interleave power pins with the bus, and give the I/O its own “dirty” supply, separate from the core.</p>`,
      ]},
      { k: "learn", title: "Output and input pads", b: [
        `<p><b>Output:</b> huge folded transistors driving 2–50 pF, behind a buffer chain (fanout 6–8 is nearly as fast as 4 and much smaller). Transients beyond the rails can trigger latchup, so outputs get <b>double guard rings</b> and dummy collectors.</p>`,
        `<p><b>Input:</b> ESD protection, a buffer or level converter, maybe a pull-up/down, and sometimes a <b>Schmitt trigger</b>, whose switching point depends on its current state (hysteresis), so slow or noisy inputs don't chatter.</p>`,
        `<p><b>Bidirectional:</b> drive the output nMOS and pMOS separately (through a NOR and a NAND): only two huge transistors, each half the width a stacked tristate would need.</p>`,
        seenV("Latchup and guard rings.", "07-robustness.html", "Chapter 7"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A slowly rising, noisy input crosses an ordinary inverter's threshold several times. What does a Schmitt trigger do differently?", opts: [["Once it switches high, its threshold drops (and vice versa), so small wiggles don't switch it back", true, "That's hysteresis."], ["It switches faster", false, "Speed isn't the point."], ["It filters with an RC", false, "It uses feedback, not an RC."]] },
      ]},
      { k: "learn", title: "Electrostatic discharge", b: [
        `<p>Walk across a carpet and you can carry thousands of volts. Modern gate oxides break down at about <b>5 V</b>. ESD also causes punchthrough, and voltages outside the rails raise the risk of latchup. It costs the industry billions a year.</p>`,
        `<p>Protection gives the charge a safe path: <b>primary diode clamps</b> to V<sub>DD</sub> and GND (on above V<sub>DD</sub> + 0.7 V or below −0.7 V; ~1 Ω, 10–20 A), a <b>series resistor</b> (100 Ω–3 kΩ), then smaller <b>secondary clamps</b> right at the gates.</p>`,
        `<div class="two"><div class="tile"><h3>Human body model</h3><p>100 pF charged high, discharged through 1500 Ω: a person touching a pin.</p></div><div class="tile"><h3>Charged device model</h3><p>The chip itself charged, then touching ground: faster and harder to protect against.</p></div></div>`,
        `<p>Targets: ±15 kV for parts users touch (serial ports), 2–4 kV for parts inside a box.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "An ESD event drives 15 A through a 1 Ω primary diode. Roughly how many volts appear across the diode's resistance?", a: 15, tol: 0.01, why: "15 A × 1 Ω = 15 V: far above a 5 V oxide limit. That's why the series resistor and secondary clamps are needed." },
      ]},
      { k: "learn", title: "Mixed-voltage I/O", b: [
        `<p>The core runs at ~1 V, but neighbours may speak LVCMOS33 (3.3 V). Thin core transistors would punch through, so I/O uses <b>thick-oxide, long-channel</b> transistors or <b>stacked (cascoded)</b> ones, arranged so no single device ever sees more than it can take.</p>`,
        `<div class="tbl"><table><thead><tr><th>Standard</th><th>V<sub>IL</sub></th><th>V<sub>IH</sub></th></tr></thead><tbody><tr><td>TTL / LVTTL</td><td>0.8 V</td><td>2.0 V</td></tr><tr><td>LVCMOS ≤ 1.8 V</td><td>0.35 V<sub>DD</sub></td><td>0.65 V<sub>DD</sub></td></tr></tbody></table></div>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does an input ESD protection network protect the thin gate oxide?", model: "Large primary diodes to V_DD and ground turn on as soon as the pad goes more than a diode drop outside the rails and dump the ESD current into the robust supply networks. Because that current is so large, the pad voltage can still be high, so a series resistor limits the current reaching the inner node, and smaller secondary diodes clamp that node close to the rails, keeping the voltage across the gate oxide below breakdown." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "High-speed links: wires become transmission lines", mins: 25,
    blurb: "Reflections, termination, dispersion and crosstalk; then drivers, differential signaling, equalization, and how fast it can go.",
    takeaway: "More bandwidth per pin instead of more pins. Challenges: generating/detecting fast pulses, lossy finite-latency channels, telling successive bits apart. A conductor is a transmission line when its delay is comparable to the rise/fall time. Example 13.7: FR4 ε_r ≈ 4.35, v = c/√4.35 = 14.4 cm/ns; 10 cm → 700 ps; edges ≤ ¼ period → above ~350 MHz treat as a line. The driver sees the characteristic impedance Z0 (~50 Ω), not the far-end load. PCBs devote half their layers to planes; microstrip (outer layer) Z0 = 60/√(0.475ε_r + 0.67) · ln(4h/(0.67(0.8w + t))) (EQ 13.39); stripline Z0 = (60/√ε_r) ln(4h/(0.67π(0.8w + t))) (EQ 13.40). Example 13.8: h = 8.7 mil, t = 1.4 mil (1 oz Cu) → w ≈ 15 mil for 50 Ω. Reflection coefficient Γ = (Z_L − Z0)/(Z_L + Z0) (EQ 13.41); reflections waste energy and cause inter-symbol interference (ISI); terminate (match) at one or both ends (both: half the swing for the same current). With termination, several bits are in flight at once (10 Gb/s on 10 cm: 7 bits); without, wait for reflections (two round trips → 350 Mb/s). Point-to-point links beat multidrop buses (junctions reflect). Dispersion: frequency-dependent loss (skin effect, dielectric loss) widens and shrinks pulses → ISI; crosstalk: can't be undone without knowing aggressors; shield, differential signaling, codes; return path: ground bounce between TX and RX grounds; shared returns → simultaneous switching noise (SSN); differential signaling gives each signal its own return. Transmitters: CMOS inverter output impedance varies; current-mode (open-drain in saturation + far-end parallel termination; GTL V_T = 1.2 V, low 0.4 V, 0.8 V reference), voltage-mode (linear transistors + series resistor; digitally controlled impedance with binary-weighted legs), double terminated (half swing); push-pull vs pull-only (push-pull uses half the current). Differential: differential pairs steering a constant current; LVDS 3.5 mA into 100 Ω → 350 mV, up to 3.125 Gb/s, low power; CML beyond 10 Gb/s with more power; LVPECL. AC coupling with series capacitors (DC balance: 8b/10b, ≤ 5 equal bits in a row; 64b/66b in 10 GbE); programmable swing (segmented drivers); slew-rate control (sequentially enabled segments); equalization: de-emphasis transmitter = main driver minus a scaled, one-bit-delayed copy: high-pass to flatten the channel. Max rate set by the clock: shortest clock period ≈ 8 buffer delays; Example 13.9: 8 × 15 ps = 120 ps → 8.3 Gb/s; faster via time interleaving (N drivers on multiphase clocks; usually 2-way) or multilevel signaling (more bits per symbol, needs voltage precision; interleaving preferred for benign channels). Receivers: flip-flop (SA-F/F for differential), staggered for interleaving, small ADC for multilevel. Bit error rate targets 10⁻¹⁰–10⁻¹² (vs ~10⁻⁶ wireless).",
    steps: [
      { k: "learn", title: "When is a wire a transmission line?", b: [
        `<p>When its propagation delay is comparable to the signal's edges. On a PCB (FR4, ε<sub>r</sub> ≈ 4.35) signals travel c/√4.35 ≈ <b>14.4 cm/ns</b>.</p>`,
        `<p>Example 13.7: a 10 cm trace takes 700 ps. Edges should be ≤ ¼ of the period, so above about 350 MHz the trace is a transmission line: the driver sees only its <b>characteristic impedance</b> Z<sub>0</sub> (~50 Ω), not whatever is at the far end.</p>`,
        seenV("Transmission lines on chip.", "06-interconnect.html", "Chapter 6"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 30 cm backplane trace in FR4. One-way delay in ns?", a: 2.08, tol: 0.02, why: "30 / 14.4 ≈ 2.08 ns." },
      ]},
      { k: "play", title: "Reflections", b: [
        `<p>When the wave reaches a load that isn't Z<sub>0</sub>, part of it bounces back. Predict Γ for an open end and a short, then slide.</p>`,
        reflectWidget,
        `<p>Reflections waste energy and pile onto later bits (<b>inter-symbol interference</b>). <b>Terminate</b> the line with a matched resistor. Then many bits can be in flight at once: at 10 Gb/s, a 10 cm trace holds seven.</p>`,
      ]},
      { k: "learn", title: "Other enemies", b: [
        `<ul><li><b>Dispersion:</b> loss grows with frequency, so a sharp pulse arrives smaller and smeared into the next bit.</li><li><b>Crosstalk:</b> neighbouring channels couple in; shield or go differential.</li><li><b>Return path:</b> the current must come back. A shared, inductive ground makes TX and RX grounds differ: ground bounce and simultaneous switching noise.</li></ul>`,
      ]},
      { k: "learn", title: "Drivers", b: [
        `<p>A plain inverter's output impedance swings wildly as it switches, so it can't be matched to Z<sub>0</sub>. Options: a <b>current-mode</b> driver into a far-end termination, a <b>voltage-mode</b> driver with a series resistor (or digitally selected legs to hit the right impedance), or both ends terminated (half the swing).</p>`,
        `<p><b>Differential</b> signaling sends the difference of two wires: noise that hits both cancels, and each signal brings its own return. LVDS: 3.5 mA into 100 Ω = <b>350 mV</b> swing, low power, to ~3 Gb/s. CML goes past 10 Gb/s with more power.</p>`,
      ]},
      { k: "play", title: "Equalization by de-emphasis", b: [
        `<p>A lossy channel acts like a low-pass filter. A <b>de-emphasis</b> transmitter subtracts a scaled copy of the previous bit, so repeated bits are sent smaller than transitions: a high-pass that cancels the channel's low-pass. Watch the leftover energy in the next bit.</p>`,
        deemph,
      ]},
      { k: "learn", title: "How fast can it go?", b: [
        `<p>Usually the <b>clock</b> limits it: the shortest clock a chip can propagate is about 8 buffer delays (rise and fall each ~¼ period). Example 13.9: 8 × 15 ps = 120 ps → <b>8.3 Gb/s</b> at one bit per cycle. Go faster by <b>time interleaving</b> (several drivers on staggered clock phases) or <b>multilevel</b> signaling (2 bits per symbol, needing more voltage precision).</p>`,
        `<p>Target bit error rates: 10<sup>−10</sup> to 10<sup>−12</sup>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "LVDS with 3.5 mA but the termination is 75 Ω instead of 100 Ω. Swing in mV?", a: 262.5, tol: 0.01, why: "3.5 mA × 75 Ω = 262.5 mV." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does terminating a transmission line let you send data faster?", model: "With a matched termination the arriving wave is fully absorbed, so nothing reflects back down the line. Successive bits can then follow each other down the line without waiting for earlier reflections to die out, and many bits can be in flight at once. The bit rate is limited by how sharply bits can be generated and received, not by the line's round-trip delay." },
      ]},
    ],
  };

  /* =============== PART 11 =============== */
  const p11 = {
    id: "p11", title: "Recovering the clock, randomness, and myths about skew", mins: 25,
    blurb: "Sampling in the middle of the eye: source-synchronous, mesochronous and plesiochronous receivers. Then true random numbers, chip fingerprints, and six ways to fool people about skew.",
    takeaway: "Handshaking is limited by channel delay; high-speed links instead send bits at constant time intervals (synchronous transmission), so bit timing must be precise. NRZ eye diagram: sample at the widest opening; nonuniform intervals close the eye horizontally. TX clock from a PLL/DLL; I/O cares about absolute jitter, logic about cycle-to-cycle jitter (PLL jitter accumulation: low cycle-to-cycle, high absolute). Source-synchronous: transmitter sends a clock with the data (shared by parallel channels; DDR memory); SDR samples on rising edges (data at half channel capacity); DDR on both edges (clock and data same transition rate; needs 50% duty cycle); a PLL/DLL zero-delay buffer realigns the buffered clock; a 4-phase VCO can shift by 90° to center an edge-aligned clock. Mesochronous: same frequency, unknown phase; phase-adjust loop with a data-clock phase detector: Hogge (linear: UP width varies with error, DN fixed at half a bit; zero net at 90°; pulses too narrow at high rates; skew differs from data samplers) vs Alexander bang-bang (data and edge samples with the same circuits; only the sign of the error; fixed-step corrections: step size trades lock time vs dithering jitter); oversampling with digital filtering. Plesiochronous: local reference within e.g. 200 ppm (crystals); RS-232; recover frequency and phase; needs transition density (coding); frequency acquisition aid (lock to the local reference with a PFD first, then track data). Random circuits: TRNG from amplified thermal noise driving a VCO, sampled into a shift register (Niagara2 XORs three); von Neumann debiasing on pairs (01 → 1, 10 → 0, 00/11 discarded) if bits are uncorrelated; NIST FIPS 140-2 tests. Chip ID: fuse serial numbers (cost, can be copied) vs physical fingerprints from mismatch: binary, repeatable, long enough to identify, low power, no calibration; cross-coupled-inverter cell reset then released (SRAM-like array, 8 × 16 = 128 bits); accept IDs within Hamming distance d; privacy concerns. Pitfalls: neglecting package parasitics; inadequate power grids (top two layers orthogonal, many narrow wires interdigitated, no slots); goofing the PLL/DLL; six ways to fool about skew: skew without process-variation data, claiming “zero skew”, reporting only systematic skew, ignoring jitter, measuring two points briefly in a quiet environment, not reporting the design skew budget.",
    steps: [
      { k: "learn", title: "Sampling in the eye", b: [
        `<p>Bits are sent at fixed intervals with no handshake, so the receiver must know exactly when each bit is. Overlay every bit period on one plot: the <b>eye diagram</b>. Sample where the eye is widest open. Jitter closes it from the sides.</p>`,
      ]},
      { k: "learn", title: "Three situations", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>Source-synchronous</b></td><td>The transmitter sends a clock alongside the data (DDR memory). DDR samples on both edges, so clock and data toggle at the same rate. A PLL/DLL rebuffers the clock without adding skew, or shifts it 90° to centre it in the eye.</td></tr>
          <tr><td><b>Mesochronous</b></td><td>Same frequency, unknown phase. A loop adjusts the sampling phase using a data phase detector: <b>Hogge</b> (linear, measures how far off) or <b>Alexander / bang-bang</b> (only early or late, but uses the same circuit as the data sampler, so no skew between them).</td></tr>
          <tr><td><b>Plesiochronous</b></td><td>A local clock within ~200 ppm. The receiver must fix frequency too: lock to the local reference first, then track the data; code the data so it has enough transitions.</td></tr></tbody></table></div>`,
        seenV("Degrees of synchrony.", "10-sequential.html", "Chapter 10"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A bang-bang phase detector only says “early” or “late”. What's the catch for the loop?", opts: [["It can only take fixed steps: big steps lock fast but dither (jitter), small steps lock slowly", true, "Choosing the step size is the tricky part."], ["It can't detect any error", false, "It detects the sign."], ["It needs a different sampler from the data path", false, "The opposite: it reuses the same samplers, a key advantage."]] },
      ]},
      { k: "learn", title: "True random numbers", b: [
        `<p>An LFSR (Chapter 11) is predictable. A <b>true</b> random number generator amplifies physical noise (thermal noise across a resistor), drives a VCO with it, and samples. If the bits are biased but uncorrelated, <b>von Neumann's trick</b> fixes the bias: take bits in pairs; 01 → 1, 10 → 0, discard 00 and 11.</p>`,
      ]},
      { k: "play", title: "Debiasing", b: [
        `<p>Before sliding: why must the output be unbiased even when P(1) = 80%?</p>`,
        vonNeumann,
      ]},
      { k: "learn", title: "Chip fingerprints", b: [
        `<p>Reset a pair of cross-coupled inverters to 0/0 and release: mismatch decides which way it falls. An array of 128 such cells gives each chip its own ID, without programming. Noise may flip a few bits each read, so IDs within a small Hamming distance count as the same chip. (The book notes the privacy risks of IDs readable by software.)</p>`,
      ]},
      { k: "check", title: "Six ways to fool people about clock skew", b: [
        { t: "sort", q: "Which are honest reporting practices, and which are on the book's list of ways to fool people?", bins: ["Honest", "Fooling"], items: [
          ["“Our network has zero skew” (meaning zero systematic skew)", 1, "Random skew, drift and jitter remain."],
          ["Reporting skew measured at two points for a few cycles on a quiet chip", 1, "Worst case hides elsewhere and under heavy supply noise."],
          ["Reporting the skew budget used in design along with measurements", 0, "That's what the book asks for."],
          ["Ignoring jitter in the budget", 1, "Unrealistic, especially with deskew buffers on noisy supplies."],
          ["Basing random skew on measured on-chip variation data", 0, "Otherwise it's guesswork."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does von Neumann's algorithm remove bias, and what must be true of the input?", model: "It looks at non-overlapping pairs of bits, outputs 1 for 01, 0 for 10, and discards 00 and 11. If successive bits are independent with the same probability p of being 1, the pairs 01 and 10 each occur with probability p(1−p), so the two outputs are equally likely regardless of p. It only works if the bits are uncorrelated, and it throws away many bits." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "vlsi13", eyebrow: "CMOS VLSI · Chapter 13", title: "Special-Purpose Subsystems",
    intro: `<p>Eleven parts on the parts of a chip usually built by specialists: packages and cooling, power distribution, clock distribution, PLLs and DLLs, I/O pads and ESD, high-speed links and clock recovery, and random-number and ID circuits.</p><p>You won't design these alone soon, but every one of them sets limits on the logic you do design. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises. Some of them ask you to weigh design choices, so use each part's “say it back” habit: write your answer in full sentences, naming the mechanism, before checking anything.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11],
    summary: `
      <h3>Package and heat</h3>
      <p>BGA/LGA, flip-chip C4 (thousands of low-L bumps). ΔT = θ<sub>ja</sub>P. ΔV<sub>BE</sub> = (kT/q) ln m for temperature sensing.</p>
      <h3>Power</h3>
      <p>±10% noise: IR (grids, bumps) and L di/dt; C = IΔt/ΔV; symbiotic bypass ≈ half the gate C. Z<sub>target</sub> = rV<sub>DD</sub>²/P; capacitors resonate at 1/(2π√LC); first/second/third droops. Supply filters, charge pumps, substrate noise.</p>
      <h3>Clocks</h3>
      <p>Skew: systematic, random, drift, jitter. PLL/DLL zero-delay buffers; f<sub>out</sub> = (N/M)f<sub>in</sub>. Grids, H-trees, spines, hybrids; fast, uniform, shielded. Gater matching h* = 1 + √(1 + p<sub>inv</sub>). Budgets ~10% of cycle; adaptive deskew.</p>
      <h3>PLLs and DLLs</h3>
      <p>VCO phase = 2πK<sub>vco</sub>/s; PFD + charge pump; R + 1/sC filter; ω<sub>n</sub> = √(I<sub>cp</sub>K<sub>vco</sub>/NC), ζ = ω<sub>n</sub>RC/2 (0.7–1). DLL: first-order, τ ≥ 10T<sub>c</sub>, passes jitter. Deadlock pitfalls.</p>
      <h3>I/O and links</h3>
      <p>Power pins ~half; guard rings; Schmitt triggers; ESD diodes + resistor (HBM, CDM). Γ = (Z<sub>L</sub> − Z<sub>0</sub>)/(Z<sub>L</sub> + Z<sub>0</sub>); terminate; differential (LVDS 350 mV); de-emphasis; 8 FO4 clock limit; interleaving. Eye diagrams; source-synchronous, mesochronous (Hogge, Alexander), plesiochronous. TRNG + von Neumann; chip IDs.</p>`,
  };
  Course.start(window.CHAPTER);
})();
