(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const seenV = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const mathLink = (html, href, where) => `<p class="aside">${html} <a href="../math/${href}">${where} →</a></p>`;
  function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
  const tail = (z) => 0.5 * (1 - erf(z / Math.SQRT2));
  const gauss = () => { const u = Math.random() || 1e-9, v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Process, voltage, temperature", mins: 20,
    blurb: "Three sources of variation, two ways to describe them, and why memory cells need 6σ.",
    takeaway: "Chips must work for ~10¹⁸ cycles despite tiny-transistor variation, temperature extremes, oxide breakdown, electromigration and cosmic rays; static CMOS is well suited (big noise margins, insensitive to parameters, recovers from noise). Variation sources: Process, Voltage, Temperature (PVT). Uniform distributions are given by a half-range a (e.g. V_DD = 1.0 V ± 10%): all parts must work across it. Normal distributions by standard deviation σ: rejecting parts beyond ±3σ loses 0.26%, ±2σ 4.56%, ±1σ 31.7% (one-sided limits halve these). Circuits replicated millions of times (memory cells) must tolerate 5–7σ. Supply: regulator tolerance, IR drop and di/dt noise: typically ±10% at each gate, varying in space and time; delay ∝ ~1/V_DD, so ~±10% delay. Temperature: junction = ambient + package rise; ambient ranges commercial 0–70 °C, industrial −40–85 °C, military −55–125 °C; commercial parts verified to 125 °C junction; varies gradually across the die (hot spots > 100 °C in an Itanium 2 core, caches < 70 °C) and over milliseconds.",
    steps: [
      { k: "learn", title: "Three sources", b: [
        `<p>A chip must run a billion billion cycles without error. Three things vary, summed up as <b>PVT</b>:</p>`,
        `<ul><li><b>Process:</b> every transistor comes out slightly different.</li><li><b>Voltage:</b> the supply sags and bounces: usually specified ±10% at each gate.</li><li><b>Temperature:</b> from a cold start to a hot spot well over 100 °C.</li></ul>`,
        `<div class="tbl"><table><thead><tr><th>Grade</th><th>Ambient</th></tr></thead><tbody><tr><td>Commercial</td><td>0 to 70 °C</td></tr><tr><td>Industrial</td><td>−40 to 85 °C</td></tr><tr><td>Military</td><td>−55 to 125 °C</td></tr></tbody></table></div>`,
        `<p class="aside">The transistors themselves (junction temperature) run hotter than the air around the package; commercial parts are checked up to 125 °C junction.</p>`,
      ]},
      { k: "learn", title: "Uniform or normal", b: [
        `<div class="two"><div class="tile"><h3>Uniform</h3><p>Anywhere in ±a, e.g. V<sub>DD</sub> = 1.0 V ± 10%. Every part must work over the whole range.</p></div><div class="tile"><h3>Normal</h3><p>Bell curve with standard deviation σ. Process parameters look like this. You choose how many σ to cover.</p></div></div>`,
        mathLink("The normal distribution and yield:", "35-normal-yield.html", "Math 35"),
      ]},
      { k: "play", title: "How many sigma?", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let k = 3, lgN = 3;
          function draw() {
            const pdf = (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI), N = Math.pow(10, lgN), p2 = 2 * tail(k);
            f.innerHTML = plot({ x: [-6, 6], y: [0, 0.42], xt: [-6, -4, -2, 0, 2, 4, 6], yt: [0, 0.2, 0.4], xl: "deviation (σ)", yl: "probability density", series: [{ f: pdf, cls: "s1" }, { pts: [[k, 0], [k, 0.4]], cls: "s4" }, { pts: [[-k, 0], [-k, 0.4]], cls: "s4" }], label: "Normal distribution with acceptance limits" });
            ro.innerHTML = readout([["Fraction outside ±" + fmt(k, 2) + "σ", fmt(p2 * 100, 3) + "%"], ["Copies on the chip", fmt(N, 3)], ["Chance that ALL copies are inside", fmt(Math.pow(1 - p2, N) * 100, 3) + "%"]]);
          }
          host.append(f, slider({ id: id + "-k", label: "Acceptance limit", min: 1, max: 7, step: 0.05, value: k, show: (x) => "±" + fmt(x, 3) + "σ" }, (x) => { k = x; draw(); }).el,
            slider({ id: id + "-n", label: "Number of identical copies (log₁₀)", min: 3, max: 9, step: 0.1, value: lgN, show: (x) => fmt(Math.pow(10, x), 2) }, (x) => { lgN = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">One part at ±3σ: 0.26% fail. A million memory cells at ±3σ: essentially no chip works. That's why replicated circuits are designed for 5–7σ.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A parameter is normal. You reject parts outside ±2σ. What percentage is rejected?", a: 4.55, tol: 0.02, unit: "%", why: "2 × 2.28% = 4.55%." },
        { t: "mcq", q: "Only 'too slow' matters (one direction). Rejecting beyond +3σ loses…", opts: [["0.135%: half of the two-sided 0.27%", true, "One tail only."], ["0.27%", false, "That's both tails."], ["3%", false, "Much less."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must a memory cell tolerate far more sigma of variation than a single logic gate?", model: "A memory has millions of identical cells and the chip fails if any one of them fails. Even a tiny per-cell failure probability, multiplied across millions of cells, gives a high chance that at least one fails. So each cell must work out to 5, 6 or 7 standard deviations to keep the chip's yield acceptable." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Process variation and design corners", mins: 25,
    blurb: "Lot, wafer, die, within-die. FF, SS, FS, SF. Derating a datasheet.",
    takeaway: "Process variation: film thickness, lateral dimensions, doping. For devices L and V_t matter most (lithography, etch, dopant counts, oxide charge, wearout); for wires width, spacing, thickness, contact resistance. Levels: lot-to-lot, wafer-to-wafer, die-to-die (D2D, inter-die; e.g. ring oscillator speed varying 20% radially across a wafer), within-die (WID, intra-die; some spatially correlated: 'process tilt'). Nearby transistors match better than distant ones and same-die better than different dice. D2D is handled with margins (2–3σ) and rejects; WID is harder (billions of transistors). Design corners combine process (nMOS, pMOS, wire: fast/typical/slow) with environment (V_DD, temperature: F = high V, low T): five letters, e.g. TTTSS, SSSSS for conservative timing, FFFFF for races/hold and dynamic power, FFFFS for leakage and noise, SF/FS for ratioed circuits. Parts may be binned by speed. Example derating: SS +27% delay, 71%/V and 0.13%/°C, multiplying to 1.62× in SSSS. FO4 ≈ 0.36 ps/nm × L_eff (TTTT), 0.50 (TTSS), 0.60 (SSSS); L_eff ≈ 0.5–0.7 L_drawn. Burn-in corner (125–140 °C, 1.3–1.7× V_DD): must still function. Multiple V_t and oxides multiply the corners.",
    steps: [
      { k: "learn", title: "Four levels of process variation", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>Lot-to-lot</b></td><td>a batch processed after the furnace was cleaned</td></tr>
          <tr><td><b>Wafer-to-wafer</b></td><td>one wafer implanted slightly longer</td></tr>
          <tr><td><b>Die-to-die</b></td><td>edge dice etch differently from centre dice: one whole chip is fast or slow</td></tr>
          <tr><td><b>Within-die</b></td><td>neighbouring transistors differ (random dopants, local patterns)</td></tr></tbody></table></div>`,
        `<p>Die-to-die variation makes whole chips faster or slower: handle it with margin and by rejecting the few outliers. Within-die variation is harder: with a billion transistors, some will be far from typical.</p>`,
        `<p class="aside">Matching rule: neighbours match better than distant transistors; same die better than different dice.</p>`,
      ]},
      { k: "learn", title: "Design corners", b: [
        `<p>Letters for nMOS, pMOS, wire, V<sub>DD</sub>, temperature: <b>F</b>ast, <b>T</b>ypical, <b>S</b>low. (Fast environment = high V<sub>DD</sub>, low temperature.)</p>`,
        `<div class="tbl"><table><tbody>
          <tr><td>TTTSS / SSSSS</td><td>timing specs (binned / conservative)</td></tr>
          <tr><td>FFFFF</td><td>races, hold times, dynamic power</td></tr>
          <tr><td>FFFFS</td><td>leakage and noise (fast edges, low V<sub>t</sub>, hot)</td></tr>
          <tr><td>SF?FF, FS?FF</td><td>ratioed circuits, memory read/write: one transistor type racing the other</td></tr></tbody></table></div>`,
        `<p class="aside">Plus a <b>burn-in</b> corner: 125–140 °C and 1.3–1.7× V<sub>DD</sub>, where it needn't be fast but must still work.</p>`,
      ]},
      { k: "play", title: "Derate a datasheet", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let pr = 25, vc = 80, tc = 0.15;
          function draw() { const a = 1 + pr / 100, b = 1 + (vc / 100) * 0.1, c = 1 + (tc / 100) * 100; ro.innerHTML = readout([["Slow process", fmt(a, 3) + "×"], ["10% low supply", fmt(b, 3) + "×"], ["100 °C hotter", fmt(c, 3) + "×"], ["Worst corner (multiply)", fmt(a * b * c, 3) + "× typical"]]); }
          host.append(slider({ id: id + "-p", label: "SS process penalty", min: 10, max: 40, step: 1, value: pr, show: (x) => "+" + x + "%" }, (x) => { pr = x; draw(); }).el,
            slider({ id: id + "-v", label: "Voltage derating", min: 40, max: 120, step: 1, value: vc, show: (x) => x + "% per volt" }, (x) => { vc = x; draw(); }).el,
            slider({ id: id + "-t", label: "Temperature derating", min: 0.05, max: 0.3, step: 0.01, value: tc, show: (x) => fmt(x, 2) + "% per °C" }, (x) => { tc = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Datasheets quote the typical corner at 25 °C. The penalties multiply. The book's library: 27%, 71%/V, 0.13%/°C gives 1.62× in the slow corner. Always ask which corner a number is for.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "SS process +25%, 80%/V derating at 10% low supply on 1 V, 0.15%/°C over 100 °C. Worst-case delay factor?", a: 1.5525, tol: 0.01, why: "1.25 × 1.08 × 1.15 = 1.55." },
        { t: "mcq", q: "Which corner do you use to check hold-time races?", opts: [["Fast everything (FFFFF): data arrives as early as possible", true, "Races fail when things are too fast."], ["SSSSS", false, "That's for setup / max delay."], ["TTTTT", false, "Races must work in every corner."]] },
      ]},
      { k: "learn", title: "Quick FO4 estimates", b: [
        `<div class="eq">FO4 ≈ L<sub>eff</sub> × 0.36 ps/nm (TTTT), 0.50 (TTSS), 0.60 (SSSS)</div>`,
        `<p>L<sub>eff</sub> is usually 0.5–0.7 of drawn length. A 180 nm process with L<sub>eff</sub> = 100–140 nm: FO4 ≈ 50–70 ps in the TTSS corner where design usually happens.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why aren't all four combinations of fast and slow nMOS and pMOS equally likely?", model: "Some parameters, like oxide thickness, are shared by both transistor types, so they move together. You can't get a slow nMOS with thick oxide and a fast pMOS with thin oxide on the same die at the same time. The corners form a skewed box rather than a square, and the FS and SF corners are less extreme than FF and SS." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Reliability and oxide wearout", mins: 20,
    blurb: "FIT and MTBF, the bathtub curve, accelerated testing, hot carriers, NBTI, TDDB.",
    takeaway: "Failure: deviation from spec; caused by faults (bugs, defects, wearout, disturbances, abuse); some faults are masked. MTBF = (devices × hours)/failures. FIT = failures per 10⁹ device-hours: 1000 FIT = one failure per 10⁶ h (114 years) per chip, but systems multiply it (100 chips × 1000 FIT × 10 systems = 10⁶ FIT: one failure per 1000 h). Target < 100 FIT. Bathtub curve: infant mortality, useful life, wearout; burn-in (high V, T) ages parts past infant mortality. Wearout is exponential in V and T, so accelerated life tests extrapolate to 10 years (IBM 32 nm oxides: > 10 years at 10% above 0.9 V). Oxide wearout shifts V_t and raises gate leakage; processes specify a maximum voltage. Hot carriers: energetic electrons trapped in the oxide (nMOS slower, pMOS faster); worst for large V_ds while on (inverters, NORs with fast inputs and heavy loads); limit input rise time and stage effort; dangerous to matched circuits. NBTI: traps form at the Si-SiO₂ interface under strong negative gate bias (pMOS with gate 0, source V_DD) at high temperature; ΔV_t = k·e^(E_ox/E₀)·t^0.25; the dominant nanometer wearout; burn-in locks in most of it; simulate with end-of-life shifts. TDDB: stress-induced leakage current grows until breakdown; exponential in temperature and thickness; keep E_ox = V_DD/t_ox below ~0.7 V/nm for 10 years at 125 °C; overshoot on supplies and I/O makes it worse.",
    steps: [
      { k: "learn", title: "Speaking reliability", b: [
        `<ul><li><b>MTBF</b>: mean time between failures = device-hours ÷ failures.</li><li><b>FIT</b>: failures per 10<sup>9</sup> device-hours. 1000 FIT = one failure per million hours per chip: 114 years. Sounds great…</li><li>…until you build a system of 100 chips and sell many: <b>FITs add</b>. Target under 100 FIT per chip.</li></ul>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A customer installs 20 systems, each with 50 chips rated at 200 FIT. Expected hours between failures across their fleet?", a: 5000, tol: 0.01, unit: "hours", hint: "Total FIT = 200 × 50 × 20.", why: "200,000 FIT = 2×10⁵ failures per 10⁹ h → one per 5000 h (about 7 months)." },
      ]},
      { k: "learn", title: "The bathtub", b: [
        `<div class="two"><div class="tile"><h3>Infant mortality</h3><p>Weak parts fail early. <b>Burn-in</b> (hot, high voltage) ages them before shipping.</p></div><div class="tile"><h3>Wearout</h3><p>After the useful life, failures rise again. Wearout speeds up exponentially with voltage and temperature, so <b>accelerated tests</b> extrapolate 10 years from weeks.</p></div></div>`,
      ]},
      { k: "learn", title: "How gate oxides wear out", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>Hot carriers</b></td><td>Energetic electrons get stuck in the oxide: nMOS get slower. Worst with large V<sub>ds</sub> while on: fast inputs, heavy loads. Limit rise times and stage effort.</td></tr>
          <tr><td><b>NBTI</b></td><td>pMOS with gate at 0 and source at V<sub>DD</sub>, hot: interface traps build up, |V<sub>t</sub>| rises as t<sup>0.25</sup>. The biggest wearout effect in nanometer processes.</td></tr>
          <tr><td><b>TDDB</b></td><td>Leakage through the oxide slowly grows until it breaks down and shorts. Keep E<sub>ox</sub> = V<sub>DD</sub>/t<sub>ox</sub> below ~0.7 V/nm for 10 years at 125 °C.</td></tr></tbody></table></div>`,
        seenV("Gate oxide thickness and tunnelling.", "02-mos-transistor.html#p6", "Chapter 2, Part 6"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "NBTI shift grows as t^0.25. If a pMOS shifts 20 mV in its first year, roughly how much by 10 years?", a: 35.6, tol: 0.02, unit: "mV", why: "20 × 10^0.25 = 20 × 1.78 = 35.6 mV. Most of the shift happens early." },
        { t: "num", q: "An oxide is 1.2 nm thick. Highest V_DD that keeps E_ox under 0.7 V/nm?", a: 0.84, tol: 0.01, unit: "V", why: "0.7 × 1.2 = 0.84 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How can a company promise a 10-year life without testing for 10 years?", model: "Wearout mechanisms speed up exponentially with voltage and temperature. So they stress parts at much higher voltage and temperature, measure how long they take to fail, and fit the exponential relationship. Extrapolating back to normal operating conditions predicts the lifetime, which must exceed 10 years with margin." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Wires wear out too", mins: 20,
    blurb: "Electromigration in DC lines, self-heating in AC lines.",
    takeaway: "High current density J = I/(wt) damages wires. Unidirectional (DC) currents: electromigration, an 'electron wind' that moves metal atoms and forms voids (worst in aluminium, eased with Al-Cu/Al-Si alloys; copper much better). Black's equation: MTTF ∝ J_dc^(−n)·e^(E_a/kT), n ≈ 2. Conservative limits: aluminium 1–2 mA/µm² at 110 °C; copper ~10 mA/µm²; contacts may be tighter. Since I_dc = αCV_DDf, a DC-limited wire can switch at most C = I_dc,max/(αV_DDf). Bidirectional currents: self-heating (oxide insulates, wire heats, resistance and EM get worse; peaks may melt it); set by RMS current: I_rms ≈ 1.26·C·V_DD·√(αf/t_r) for triangular switching pulses (t_r is the 20–80% rise time); conservative J_rms < 15 mA/µm² for Al; so C < I_rms,max/(1.26 V_DD √(αf/t_r)). EM limits power and ground lines and the lines from supplies to transistors; RMS limits signal lines; fix by widening wires or shrinking transistors.",
    steps: [
      { k: "learn", title: "Electromigration", b: [
        `<p>A strong one-way current blows metal atoms downstream like a wind, leaving voids that eventually open the wire. Black's equation:</p>`,
        `<div class="eq">MTTF ∝ J<sub>dc</sub><sup>−2</sup> · e<sup>E<sub>a</sub>/kT</sup></div>`,
        `<p>Double the current density: a quarter of the life. Rough limits: aluminium 1–2 mA/µm², copper ~10 mA/µm². It hits <b>power and ground</b> wires, and the short wires from the rails to transistors.</p>`,
      ]},
      { k: "learn", title: "Self-heating", b: [
        `<p>Signal wires carry current both ways, so electromigration is mild. But current heats the wire, and the surrounding dielectric is a thermal insulator. Hot wires are more resistive and electromigrate faster. This depends on the <b>RMS</b> current:</p>`,
        `<div class="eq">I<sub>rms</sub> ≈ 1.26 C V<sub>DD</sub> √(αf / t<sub>r</sub>)</div>`,
        `<p class="aside">From modelling each switching edge as a triangular current pulse. Faster edges and higher frequency both raise it.</p>`,
      ]},
      { k: "play", title: "How much can one wire drive?", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let C = 500, f = 2, tr = 25, a = 1;
          function draw() { const Irms = 1.26 * C * 1e-15 * 1 * Math.sqrt((a * f * 1e9) / (tr * 1e-12)), Idc = a * C * 1e-15 * 1 * f * 1e9; ro.innerHTML = readout([["Average (DC-like) current αCVf", si(Idc, "A")], ["RMS current", si(Irms, "A")], ["Width needed at J_rms 10 mA/µm² (1 µm thick)", fmt((Irms * 1e3) / 10, 3) + " µm"]]); }
          host.append(slider({ id: id + "-c", label: "Wire + load capacitance", min: 50, max: 3000, step: 10, value: C, show: (x) => x + " fF" }, (x) => { C = x; draw(); }).el,
            slider({ id: id + "-f", label: "Frequency", min: 0.2, max: 5, step: 0.1, value: f, show: (x) => fmt(x, 2) + " GHz" }, (x) => { f = x; draw(); }).el,
            slider({ id: id + "-t", label: "Rise time t_r", min: 5, max: 100, step: 1, value: tr, show: (x) => x + " ps" }, (x) => { tr = x; draw(); }).el,
            toggle(["Clock (α = 1)", "Data (α = 0.1)"], (i) => { a = [1, 0.1][i]; draw(); }), ro);
          draw();
        },
        `<p class="aside">V<sub>DD</sub> = 1 V. Clocks are the worst case: they switch every cycle with sharp edges.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A clock (α = 1) at 2 GHz, 1 V, 25 ps rise time drives 500 fF. RMS current?", a: 5.63, tol: 0.02, unit: "mA", why: "1.26 × 500 fF × 1 V × √(2×10⁹/25×10⁻¹²) = 1.26 × 5×10⁻¹³ × 8.94×10⁹ = 5.6 mA." },
        { t: "num", q: "A power strap is limited to 1 mA DC. With α = 0.1, V_DD = 1 V, f = 2 GHz, how much switched capacitance can it feed?", a: 5, tol: 0.01, unit: "pF", hint: "C = I/(αVf).", why: "10⁻³/(0.1 × 1 × 2×10⁹) = 5 pF." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is electromigration mainly a problem for power wires while self-heating limits signal wires?", model: "Electromigration needs a steady one-way flow of electrons to keep pushing atoms the same direction, which is what power and ground wires carry. Signal wires carry current back and forth, so the push largely cancels, but every pulse still heats the wire, so their limit is set by the RMS current and the resulting temperature rise." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Soft errors, overvoltage, latchup", mins: 25,
    blurb: "Cosmic rays flip bits. Too many volts break oxides. Parasitic thyristors short the supplies.",
    takeaway: "Soft errors: random, non-recurring upsets from radiation: originally alpha particles from trace uranium/thorium in packages (DRAMs in the 1970s; now purified), today mostly high-energy neutrons from cosmic rays shattering silicon nuclei into ions that leave electron-hole trails; carriers are collected at junctions (up to hundreds of fC) causing a single-event transient; if charge exceeds Q_crit (∝ node C × V, plus feedback) it's a single-event upset. Shrinking C and V reduce Q_crit; collected charge shrinks too, but net error rates rise. SRAM: 100–2000 FIT/Mb at sea level, ~100× more at flight altitude; ~1% of hits upset multiple nodes (substrate current turns on parasitic bipolars: use plenty of taps). Memories use error-correcting codes; registers increasingly need hardening; logic glitches are masked logically (path not sensitized), temporally (not sampled) or electrically (filtered) but less so at 65 nm and below. Overvoltage: supply transients and ESD; oxide breakdown V_bd ≈ a·t_ox + b/T + V₀ (a = 1.5 V/nm, b = 533 V·K): ~3 V hot at 65 nm; punchthrough between source and drain; processes specify V_max, and I/O uses thick-oxide, long-channel transistors. Latchup: the substrate/well/diffusions form a parasitic pnp + npn thyristor (SCR) with substrate and well resistances; a substrate current turns on the npn, which pulls the well down, turning on the pnp, which feeds the substrate: positive feedback shorts V_DD to GND until power is removed or wires melt. Prevent by small R_sub, R_well: taps close to every transistor (every 5–10), taps tied directly in metal, nMOS clustered near GND and pMOS near V_DD, epitaxial wafers, guard rings around I/O transistors (double rings for the paranoid). SOI and V_DD below ~1.4–2 V are immune.",
    steps: [
      { k: "learn", title: "Soft errors", b: [
        `<p>A cosmic-ray neutron smashes a silicon nucleus; the fragments leave a trail of electrons and holes. A nearby junction collects them: a brief current spike. If the charge exceeds the node's <b>Q<sub>crit</sub></b> (about C × V), the bit flips: a <b>single-event upset</b>. Nothing is damaged; rewrite it and it's fine.</p>`,
        `<ul><li>SRAM at sea level: 100–2000 FIT per megabit; ~100× more on an aeroplane.</li><li>Smaller nodes store less charge, so error rates keep rising.</li><li>Memories fix it with error-correcting codes; registers need hardening.</li><li>Logic glitches are often masked: the path isn't sensitized, the register isn't sampling, or the gate filters a too-short pulse.</li></ul>`,
        `<p class="aside">History: in the 1970s Intel traced mysterious DRAM bit flips to alpha particles from traces of uranium in the package.</p>`,
      ]},
      { k: "learn", title: "Overvoltage", b: [
        `<div class="eq">V<sub>bd</sub> ≈ a t<sub>ox</sub> + b/T + V<sub>0</sub>     (a ≈ 1.5 V/nm, b ≈ 533 V·K)</div>`,
        `<p>Thin oxides break down at just a few volts, and any overvoltage accelerates wearout. So each process has a V<sub>max</sub>, and I/O pads use separate thick-oxide, long-channel transistors. Electrostatic discharge is the classic killer (Chapter 13).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Oxide 1.2 nm, temperature 400 K, V₀ ≈ 0. Breakdown voltage estimate?", a: 3.13, tol: 0.02, unit: "V", why: "1.5 × 1.2 + 533/400 = 1.8 + 1.33 = 3.1 V." },
      ]},
      { k: "learn", title: "Latchup", b: [
        `<p>Inside every CMOS inverter hides a <b>thyristor</b>: the n+ source, p-substrate and n-well form an npn; the p+ source, n-well and substrate form a pnp. With the substrate and well resistances they're cross-coupled:</p>`,
        `<ol><li>Some current raises the substrate voltage → the npn turns on.</li><li>Its current through the well resistance pulls the well down → the pnp turns on.</li><li>The pnp feeds more current into the substrate → back to 1. Positive feedback: V<sub>DD</sub> shorted to GND until the power is cut or the metal melts.</li></ol>`,
        `<p><b>Prevention</b> is all about small R<sub>sub</sub> and R<sub>well</sub>: substrate and well taps close to every transistor, tied straight to the rails in metal; cluster nMOS by GND and pMOS by V<sub>DD</sub>; <b>guard rings</b> around I/O transistors, whose pins can ring outside the rails.</p>`,
        `<p class="aside">SOI has no parasitic bipolars, and below about 1.4–2 V the loop can't sustain itself, so latchup is now a minor concern, except at I/O.</p>`,
        seenV("Taps in the inverter cross-section.", "01-introduction.html#p7", "Chapter 1, Part 7"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why does placing substrate taps close to every nMOS help prevent latchup?", opts: [["It lowers the substrate resistance, so stray current can't raise the substrate enough to turn on the parasitic npn", true, "Breaks the feedback loop at its first step."], ["It makes the nMOS faster", false, "It's about the parasitic bipolar."], ["Taps absorb cosmic rays", false, "Taps help with multi-node upsets a bit, but that's not latchup."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between a soft error and a hard failure?", model: "A soft error is a transient upset, typically radiation flipping a stored bit; the hardware isn't damaged, and rewriting the value fixes it. A hard failure, like oxide breakdown, electromigration voids or latchup burnout, permanently damages the circuit." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const SCALE = [
    ["Length L, width W, t_ox", ["1/S", "1/S", "L only: 1/S"], null],
    ["Supply V_DD, threshold V_t", ["1/S", "1", "1"], null],
    ["Gate delay τ = RC", ["1/S", "1/S²", "1/S²"], [-1, -2, -2]],
    ["Clock frequency f", ["S", "S²", "S²"], [1, 2, 2]],
    ["Energy per gate CV²", ["1/S³", "1/S", "1/S"], [-3, -1, -1]],
    ["Power per gate", ["1/S²", "S", "S"], [-2, 1, 1]],
    ["Area per gate", ["1/S²", "1/S²", "1/S"], [-2, -2, -1]],
    ["Power density", ["1", "S³", "S²"], [0, 3, 2]],
  ];
  const p6 = {
    id: "p6", title: "Scaling", mins: 25,
    blurb: "Dennard's rules: shrink everything, voltage too. What happens to delay, energy, power and wires.",
    takeaway: "Feature size has shrunk ~30% every 2–3 years: faster, lower power, cheaper per transistor. Dennard (constant-field) scaling divides all dimensions, voltages by S and multiplies doping by S: delay 1/S, frequency S, energy per gate 1/S³, power per gate 1/S², area 1/S², power density constant, current density S. Constant-voltage scaling (5 V era, down to ~1 µm) gave quadratic delay improvement but higher fields (velocity saturation, breakdown, power), so Dennard scaling ruled from 0.5 µm. Lateral scaling (gate shrink, ~5% on mature processes). Generations use S = √2 (30% shrink: half the area per transistor; ~40% faster, half the power per gate). Voltage scaling slowed after 90 nm because of leakage. FO4 ≈ 0.5 ps/nm of L_eff. Unit transistor resistance ≈ 16.6 kΩ independent of feature size (C per µm constant, R·µm shrinks). Wires: scaled equally in w and t (aspect ratio ~2), R per length ∝ S², C per length constant (~0.2 fF/µm, ~1/5 of gate C per length); local wires shrink and keep up with gates; semiglobal repeated wires improve, but slower than gates; global wires don't shrink (dies grow slightly) and get slower: crossing the die takes multiple cycles; the reachable radius per cycle shrinks; more metal layers (TSMC: 3 at 500 nm to 10 at 65 nm); partition into 50–100 k-gate blocks. ITRS roadmap. Impacts: cost per transistor (100,000 per cent by 2008), power (power density soared with deep pipelining; ~150 W cap; leakage forced V_t ~300 mV, V_DD/V_t from ~5 toward 3; slowing V_DD scaling raises fields), variability, productivity (synthesis, IP reuse, big teams), physical limits (repeatedly predicted, repeatedly passed).",
    steps: [
      { k: "learn", title: "Dennard scaling", b: [
        `<p>Shrink every dimension <b>and</b> the voltages by the same factor S, and raise doping by S. Fields stay constant, so the transistor behaves the same, just smaller and faster.</p>`,
        `<p>A process generation is S = √2 (a “30% shrink”): each transistor takes half the area.</p>`,
      ]},
      { k: "play", title: "Three ways to scale", b: [
        (host, id) => {
          const tb = el(`<div class="tbl"></div>`), ro = el(`<div></div>`);
          let m = 0, Sv = Math.SQRT2;
          function draw() {
            tb.innerHTML = `<table><thead><tr><th>Quantity</th><th>Factor</th></tr></thead><tbody>${SCALE.map(([q, fs]) => `<tr><td>${q}</td><td><b>${fs[m]}</b></td></tr>`).join("")}</tbody></table>`;
            ro.innerHTML = readout(SCALE.slice(2).map(([q, , ex]) => [q, fmt(Math.pow(Sv, ex[m]), 3) + "×"]));
          }
          host.append(toggle(["Dennard (constant field)", "Constant voltage", "Lateral (gate shrink)"], (i) => { m = i; draw(); }), tb,
            slider({ id: id + "-s", label: "Scale factor S", min: 1, max: 2, step: 0.01, value: Sv, show: (x) => fmt(x, 3) }, (x) => { Sv = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Constant-voltage scaling (the 5 V era, down to about 1 µm) gave quadratic speed-ups, but power density exploded and fields grew until velocity saturation and breakdown stopped it. Dennard scaling has been the rule since 0.5 µm, though voltage scaling slowed after 90 nm because of leakage.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Dennard scaling with S = √2. By what factor does switching energy per gate change?", a: 0.354, tol: 0.01, why: "1/S³ = 1/2.83 = 0.354." },
        { t: "mcq", q: "Under ideal Dennard scaling, the chip's power density…", opts: [["Stays constant: power per gate ÷ area per gate = (1/S²)/(1/S²)", true, "More gates per mm², each using less."], ["Halves", false, "Area shrinks as fast as power."], ["Doubles", false, "That's what happened when voltage didn't scale."]] },
      ]},
      { k: "learn", title: "Wires don't scale as nicely", b: [
        `<p>Wires shrink in width <i>and</i> thickness: resistance per length goes up as S<sup>2</sup>, capacitance per length stays put (still ~0.2 fF/µm).</p>`,
        `<div class="tbl"><table><tbody><tr><td><b>Local</b> wires (inside a unit)</td><td>get shorter too: keep pace with gates</td></tr><tr><td><b>Semiglobal</b> (across a block)</td><td>repeated: improve, but slower than gates</td></tr><tr><td><b>Global</b> (across the die)</td><td>don't get shorter: get slower. Crossing the chip takes several cycles.</td></tr></tbody></table></div>`,
        `<p>Responses: more metal layers (TSMC: 3 at 500 nm, 10 at 65 nm), thick upper layers, repeaters, blocks of 50–100 thousand gates, and microarchitectures that budget cycles for long wires.</p>`,
        seenV("Repeated wires.", "06-interconnect.html#p7", "Chapter 6, Part 7"),
      ]},
      { k: "learn", title: "What scaling did next", b: [
        `<ul><li><b>Cost:</b> by 2008, 100,000 transistors for a cent.</li><li><b>Power:</b> deep pipelining pushed power density past the ~150 W cooling limit; leakage held V<sub>t</sub> near 300 mV, so V<sub>DD</sub> stopped falling much.</li><li><b>Variability:</b> grows as devices shrink.</li><li><b>Productivity:</b> transistor counts outgrew designers: synthesis, IP reuse, huge teams.</li><li><b>Limits:</b> a 32 nm transistor's channel is under 100 atoms long. The end of scaling has been predicted “a decade away” for decades.</li></ul>`,
        `<p class="aside">Since the book (2010): Dennard scaling effectively ended around 2005; finfets, then gate-all-around transistors, and 3D stacking kept density rising, and node names (“5 nm”, “3 nm”) became labels rather than any physical length.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why did the industry abandon constant-voltage scaling?", model: "Keeping the voltage fixed while shrinking the transistors raised the electric fields, so carriers became velocity saturated and shrinking stopped buying more current, the oxides and junctions risked breakdown, and the power density grew rapidly. Scaling the voltage along with the dimensions keeps the fields and the power density constant." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const MAXT = [[1, 0, 1], [2, 0.56, 0.82], [10, 1.54, 0.59], [100, 2.5, 0.43], [1000, 3.24, 0.35], [10000, 3.85, 0.3]];
  const p7 = {
    id: "p7", title: "Statistics of variation", mins: 30,
    blurb: "Sums add in quadrature. The worst of many paths is far from typical. Leakage is log-normal.",
    takeaway: "PDF f(x): probability density; CDF F(x) = P(X < x), its integral; mean E[X]; standard deviation σ; variance σ². Focus on zero-mean variations X = mean + X_v. Uniform on ±a: σ² = a²/3. Standard normal: F(x) = ½(1 + erf(x/√2)); tail beyond 1σ 0.159, 2σ 0.0228, 3σ 1.35×10⁻³, 4σ 3.17×10⁻⁵, 5σ 2.87×10⁻⁷, 6σ 9.87×10⁻¹⁰. Sums of independent variables: means add, variances add (σ² = Σσ_i²; root-sum-square); central limit theorem lets you replace uniform with normal of equal variance. Maximum of N independent standard normals: E[M] = 0.56 (2), 1.54 (10), 2.50 (100), 3.24 (1000), 3.85 (10⁴), 4.40 (10⁵); σ(M) shrinks (0.82 → 0.28): many near-critical paths form a 'wall' well above nominal. Book example: 100 paths of 400 ± 20 ps → 450 ± 9 ps. e^Y of a normal Y is log-normal: mean e^(µ + σ²/2), a long tail (leakage is like this). Monte Carlo simulation: random samples of every variable, simulate, collect statistics, when no closed form exists.",
    steps: [
      { k: "learn", title: "Adding variations", b: [
        `<p>A path's delay is a sum of gate delays. If each varies independently:</p>`,
        `<div class="eq">mean = Σ means     σ<sup>2</sup> = Σ σ<sub>i</sub><sup>2</sup>   (root-sum-square)</div>`,
        `<p>So independent variations partly cancel: 16 gates each ±4% give a path only ±1%. Fully correlated variations (all gates fast together) don't cancel.</p>`,
        `<p class="aside">A uniform variation on ±a has σ = a/√3; with many terms you can treat it as normal with that σ (central limit theorem).</p>`,
        mathLink("Random variables and their sums:", "34-probability.html", "Math 34"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Two independent delay contributions have σ = 6 ps and 8 ps. Combined σ?", a: 10, tol: 0.01, unit: "ps", why: "√(36 + 64) = 10 ps." },
      ]},
      { k: "play", title: "The worst of many paths (Monte Carlo)", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let lgN = 2, maxes = [];
          const nom = 400, sg = 20, runs = 400;
          function run() {
            const N = Math.round(Math.pow(10, lgN)); maxes = [];
            for (let r = 0; r < runs; r++) { let m = -1e9; for (let i = 0; i < N; i++) { const d = nom + sg * gauss(); if (d > m) m = d; } maxes.push(m); }
            draw();
          }
          function draw() {
            const bins = new Array(30).fill(0); maxes.forEach((m) => { const b = Math.floor((m - 340) / 7); if (b >= 0 && b < 30) bins[b]++; });
            const pts = []; bins.forEach((c, i) => { pts.push([340 + i * 7, 0], [340 + i * 7, c / runs], [340 + (i + 1) * 7, c / runs], [340 + (i + 1) * 7, 0]); });
            const mean = maxes.reduce((a, b) => a + b, 0) / runs, sd = Math.sqrt(maxes.reduce((a, b) => a + (b - mean) ** 2, 0) / runs);
            const one = (x) => (Math.exp(-((x - nom) ** 2) / (2 * sg * sg)) / (sg * Math.sqrt(2 * Math.PI))) * 7;
            f.innerHTML = plot({ x: [340, 550], y: [0, 0.4], xt: [350, 400, 450, 500, 550], yt: [0, 0.2, 0.4], xl: "longest path delay (ps)", yl: "fraction of chips", series: [{ f: one, cls: "s5" }, { pts, cls: "s1" }], label: "Monte Carlo distribution of the longest path" });
            const N = Math.round(Math.pow(10, lgN)), row = MAXT.reduce((b, r) => (Math.abs(Math.log10(r[0]) - lgN) < Math.abs(Math.log10(b[0]) - lgN) ? r : b));
            ro.innerHTML = readout([["Paths per chip", String(N)], ["Monte Carlo mean of the worst", fmt(mean, 3) + " ps"], ["Its spread σ", fmt(sd, 3) + " ps"], [`Table (N = ${row[0]})`, `${fmt(nom + row[1] * sg, 3)} ± ${fmt(row[2] * sg, 2)} ps`]]);
          }
          const go = btn("Run 400 chips again", "primary"); go.addEventListener("click", run);
          host.append(f, slider({ id: id + "-n", label: "Near-critical paths per chip", min: 0, max: 3.5, step: 0.5, value: lgN, show: (x) => String(Math.round(Math.pow(10, x))) }, (x) => { lgN = x; run(); }).el, go, ro);
          run();
        },
        `<p class="aside">Each path: 400 ps nominal, σ = 20 ps (dashed: one path's distribution). Each “chip” is as slow as its slowest path. With more near-critical paths the worst case moves right and gets <i>narrower</i>: a wall 2–3σ above nominal.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A chip has 1000 near-critical paths, each 300 ps nominal, σ = 15 ps. Expected critical path delay? (Use E[M] = 3.24.)", a: 348.6, tol: 0.01, unit: "ps", why: "300 + 3.24 × 15 = 348.6 ps, with σ only 0.35 × 15 = 5.3 ps." },
      ]},
      { k: "learn", title: "Leakage is log-normal", b: [
        `<p>Leakage ∝ e<sup>−V<sub>t</sub>/(nv<sub>T</sub>)</sup>, and V<sub>t</sub> is roughly normal, so leakage is <b>log-normal</b>: a long tail of very leaky devices. Its mean is e<sup>µ + σ²/2</sup>, higher than the leakage of a typical device.</p>`,
        `<p>When no formula exists, use <b>Monte Carlo</b>: draw random values for every parameter, simulate, repeat thousands of times, and look at the distribution, just like the widget above.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does having many nearly critical paths make a chip slower than its nominal path delay?", model: "The chip's speed is set by its slowest path. Each path varies randomly, so with many of them it becomes very likely that at least one lands far out in the slow tail. The expected maximum grows roughly with the log of the number of paths, so the effective critical path ends up two or three standard deviations above nominal." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Where variation comes from, and what it costs", mins: 30,
    blurb: "Pelgrom's law, channel length, random dopants. ON vs OFF current. Yield.",
    takeaway: "Variation kinds: systematic (modelable: e.g. etch vs pattern density), random (true randomness or too costly to model), drift (aging, temperature: slow), jitter (supply noise, crosstalk: fast, hardest). Static ones can be calibrated out once; drift needs tracking. Functional yield (gross defects) vs parametric yield (too slow, too leaky, too little margin). Pelgrom: σ of random WID variation ∝ 1/√(WL). Channel length: across-chip linewidth variation (ACLV: lithography and pattern-dependent etch: nested vs isolated lines, orientation, topography) and line-edge roughness (∝ 1/√W; ~4 nm at 35 nm); draw gates one way, keep densities uniform, dummy rows at array edges; ITRS target σ/µ = 4%. Threshold: random dopant fluctuation σ_Vt = A_Vt/√(LW) (~10 mV at 90 nm, 30 mV at 50 nm, 40 mV at 25 nm for minimum devices; high-k metal gates better: A_Vt ≈ 1–2.5 mV·µm); V_t also tracks L via short-channel effect. Oxide thickness: tiny effect. Layout: well-edge proximity (up to 10%), STI stress. Sensitivities: ΔI_on/I_on ≈ ΔL/L·(−1) − αΔV_t/(V_DD − V_t); ΔI_off/I_off ≈ −ΔL/L − ΔV_t/(nv_T): 10 mV of V_t changes I_on ~1.8% but I_off ~23%. Path delay: correlated parts don't average, independent parts divide variance by the number of transistors. Combine D2D and WID by RSS; book example → 1.28T clock for 97.7% yield. Energy: dynamic barely affected; leakage up exponentially (systematic 3σ shift: e^(3σ/nv_T); random: mean factor e^(½(σ/nv_T)²)). Variation pushes best EDP to higher V_DD and V_t. Functionality: ratioed circuits, SRAM, keepers, subthreshold, sense amps, matched delays; bigger transistors help. Yield: Y_s = Y_c^N; defects: Y = e^(−DA) (Poisson). Matched delays need ~30% margin across corners; prefer replicas or clock-based timing.",
    steps: [
      { k: "learn", title: "Pelgrom's law", b: [
        `<p>Random within-die variation averages out over area:</p>`,
        `<div class="eq">σ ∝ 1/√(W L)     e.g. σ<sub>Vt</sub> = A<sub>Vt</sub>/√(WL)</div>`,
        `<ul><li><b>Channel length:</b> lithography and etch (depends on nearby patterns and orientation), plus line-edge roughness. Draw all gates in one direction; keep pattern density uniform; add dummy rows around arrays.</li><li><b>Threshold:</b> random dopant fluctuation: a tiny channel has only tens of dopant atoms. Minimum devices: ~10 mV σ at 90 nm, ~30 mV at 50 nm.</li><li><b>Layout:</b> well-edge proximity, stress from trench isolation.</li></ul>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A_Vt = 2 mV·µm. A transistor is 0.2 µm × 0.05 µm. σ_Vt?", a: 20, tol: 0.01, unit: "mV", hint: "√(WL) = √0.01 µm².", why: "2 / 0.1 = 20 mV. Quadruple the area to halve it." },
      ]},
      { k: "play", title: "ON current shrugs, OFF current jumps", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let dvt = 20, dl = 0;
          function draw() { const a = 1.3, on = (1 - dl / 100) * Math.pow((1 - 0.3 - dvt / 1000) / 0.7, a), off = (1 - dl / 100) * Math.exp(-dvt / 1000 / (1.6 * 0.026)); ro.innerHTML = readout([["ON current", fmt((on - 1) * 100, 3) + "%"], ["OFF current", fmt((off - 1) * 100, 3) + "%"], ["OFF ÷ nominal", fmt(off, 3) + "×"]]); }
          host.append(slider({ id: id + "-v", label: "Threshold shift ΔV_t", min: -60, max: 60, step: 1, value: dvt, show: (x) => x + " mV" }, (x) => { dvt = x; draw(); }).el,
            slider({ id: id + "-l", label: "Channel length change ΔL", min: -10, max: 10, step: 0.5, value: dl, show: (x) => x + "%" }, (x) => { dl = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">V<sub>DD</sub> = 1 V, V<sub>t</sub> = 0.3 V, α = 1.3, n = 1.6 (S ≈ 96 mV/decade). Small V<sub>t</sub> shifts barely touch speed but swing leakage hugely, and since leakage is exponential, a −σ device adds more than a +σ device saves.</p>`,
      ]},
      { k: "learn", title: "From transistors to chips", b: [
        `<ul><li><b>Path delay:</b> correlated variation (whole-region length shift) passes straight through; independent variation (dopants) averages over the transistors in the path. Fewer gates per pipeline stage = less averaging.</li><li><b>Leakage:</b> a systematic V<sub>t</sub> shift multiplies all leakage; random shifts raise the average because of the exponential's tail.</li><li><b>Function:</b> ratioed circuits, SRAM cells, keepers, sense amplifiers and matched delays can fail outright. Bigger transistors help.</li></ul>`,
        `<div class="eq">Y<sub>system</sub> = Y<sub>component</sub><sup>N</sup>     Y = e<sup>−DA</sup> (random defects, density D, area A)</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Defect density 0.5 per cm². Yield of a 1 cm² die?", a: 60.7, tol: 0.01, unit: "%", why: "e^(−0.5) = 0.607. Double the area: 36.8%." },
        { t: "num", q: "A memory has 512 sense amplifiers; the whole memory must reach 99% yield. Each amplifier's offset is normal with σ = 10 mV. How many mV of offset must the design tolerate (two-sided)?", a: 42.7, tol: 0.03, unit: "mV", hint: "Each needs 0.99^(1/512) ≈ 0.99998; find the σ multiple whose two tails total 2×10⁻⁵.", why: "About 4.27σ → 43 mV." },
      ]},
      { k: "learn", title: "Matched delays are risky", b: [
        `<p>Some circuits rely on one path being slower than another (e.g. a delayed clock that must arrive after the data). An inverter chain doesn't track a wire or a complex gate across corners: differences of up to ~30% appear. So matched delays need ~30% nominal margin, ideally adjustable after manufacture. Better: use a <b>replica</b> of the real circuit, or time things from the clock (failures can then be fixed by slowing the clock).</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does random threshold variation affect a long path's delay much less than a single gate's?", model: "Each transistor's threshold varies independently, so in a path of many gates some are fast and some slow, and they partly cancel. The path's variance is the sum of the individual variances, so its standard deviation grows only with the square root of the number of transistors while the delay grows linearly. Correlated variations like a regional length shift don't cancel." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Designing for variation, pitfalls, history", mins: 20,
    blurb: "Measure and adapt. Spare parts. Triple redundancy. And the 4004 to Core i7.",
    takeaway: "Margins for variation cost performance and power, so chips adapt. Adaptive control: measure conditions and adjust supply, body bias, frequency or activity: adaptive body bias corrects die-to-die V_t (leakage spread, speed); adaptive voltage scaling trades frequency and energy (needs ~20 mV resolution); per-block control; turbo modes when only some cores are busy; thermal sensors throttle (dual-core Itanium microcontroller every 20 ms). Fault tolerance: spare rows/columns in memories, spare cores (sell an 8-core part as 6-core); with up to r repairs, Y_s = Σ_{i≤r} C(N, i)Y_c^(N−i)(1 − Y_c)^i (or the Poisson form e^(−DA)Σ(DA)^i/i!); book: 16 cores at 90%: 18.5% → 78.9% with two spares. Error-correcting codes for memories and links. Logic: master-checker lockstep with checkpoints and rollback (IBM S/390 G5); triple-modular redundancy with voting: system failure P_s = 3P_m² − 2P_m³ (masks one failure without slowing). Pitfalls: quoting performance without corner/temperature ('colder than an ice cube'; FFFFF is the 'published paper' corner, ~2× a manufacturable part); too little matched-delay margin (a mask respin costs ~$1M); not planning for scaling (Pentium Pro's BiCMOS and wire-limited paths needed rework; Pentium 4 over-engineered wire paths). History: Intel 4004 (1971, 2300 transistors, hand-cut rubylith, diagonal wires) → 286, 386, 486 (cache, FPU), Pentium, P6 (micro-ops, out of order), Pentium 4 (deep pipeline, ~14 FO4, power downfall), Pentium M/Core (back to efficiency), multicore Core i7, Atom (simple in-order, low power).",
    steps: [
      { k: "learn", title: "Adapt instead of margining", b: [
        `<p>Margining for the worst case wastes speed and power on every typical chip. Instead, measure and adjust:</p>`,
        `<ul><li><b>Adaptive body bias:</b> shift V<sub>t</sub> to pull slow chips faster and leaky chips tighter.</li><li><b>Adaptive voltage:</b> give each chip (or block) just enough V<sub>DD</sub> for its speed, in ~20 mV steps.</li><li><b>Turbo:</b> run one core faster while the others sleep.</li><li><b>Thermal throttling:</b> sensors slow things down before hot spots overheat.</li></ul>`,
        seenV("DVS and body bias.", "05-power.html#p5", "Chapter 5, Part 5"),
      ]},
      { k: "learn", title: "Spares and redundancy", b: [
        `<p><b>Spares:</b> memories have spare rows and columns; an 8-core die with a dead core can be sold as a 6-core part. If up to r failures can be repaired among N components each with yield Y<sub>c</sub>, add the probabilities of 0, 1, …, r failures (binomial).</p>`,
        `<p><b>Error-correcting codes</b> for memories and links. For logic: <b>master-checker</b> (two copies in lockstep; on disagreement, roll back to a checkpoint) or <b>triple-modular redundancy</b> (three copies vote):</p>`,
        `<div class="eq">P<sub>TMR fails</sub> = 3P<sub>m</sub><sup>2</sup> − 2P<sub>m</sub><sup>3</sup></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "An 8-core die; each core works with probability 0.85. Yield if all 8 must work?", a: 27.2, tol: 0.02, unit: "%", why: "0.85⁸ = 0.272." },
        { t: "num", q: "Same die, but it can still be sold as a 7-core part if one core fails. Sellable yield?", a: 65.7, tol: 0.02, unit: "%", hint: "Add P(exactly one bad) = 8 × 0.85⁷ × 0.15.", why: "0.272 + 0.385 = 0.657." },
        { t: "num", q: "A module fails with probability 2% over a mission. A TMR system's failure probability?", a: 0.1184, tol: 0.02, unit: "%", why: "3(0.02)² − 2(0.02)³ = 0.0012 − 0.000016 = 0.118%." },
      ]},
      { k: "check", title: "Pitfalls", b: [
        { t: "sort", q: "Sound or pitfall?", bins: ["Sound", "Pitfall"], items: [
          ["Quoting a circuit's speed measured on a chilled chip without saying so", 1, "One famous processor demo was 'colder than an ice cube'."],
          ["Reporting delays in FO4 at a stated corner", 0, "Comparable across processes."],
          ["Giving a matched delay chain 5% margin over the path it tracks", 1, "Corners alone can shift it ~30%."],
          ["Over-designing wire-heavy paths knowing wires won't speed up in future shrinks", 0, "What the Pentium 4 team did."],
          ["Making a matched-delay margin adjustable with fuses after manufacture", 0, "Avoids extreme conservatism."],
        ]},
      ]},
      { k: "why", title: "Four decades of Intel processors", b: [
        `<p>The <b>4004</b> (1971): 2300 transistors, one metal layer, hand-cut rubylith masks with diagonal wires. The <b>286</b> and <b>386</b>: regular datapaths, PLAs, then synthesized control logic. The <b>486</b> brought the cache and floating-point unit on chip; the <b>Pentium</b> went superscalar; the <b>P6</b> translated x86 into micro-ops executed out of order, with caches eating more and more of the die. The <b>Pentium 4</b> chased clock rate with 20–30 pipeline stages and ~14 FO4 per cycle, and its power killed it in laptops. From the <b>Pentium M</b> on, efficiency returned: clocks levelled at 2–3 GHz and performance came from more cores. The <b>Atom</b> went back to a simple in-order Pentium-like pipeline for all-day netbooks.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does triple-modular redundancy keep working when one module fails?", model: "Three identical modules compute the same result and a voter outputs the majority. If one module fails, the other two still agree, so the output stays correct with no delay or rollback. The system only fails if two or more modules fail, which is much less likely when each module is reliable." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "vlsi7", eyebrow: "CMOS VLSI · Chapter 7", title: "Robustness",
    intro: `<p>Nine parts: PVT variation, process corners, reliability and oxide wearout, wire wearout, soft errors and latchup, scaling, statistics of variation, its sources and costs, and variation-tolerant design.</p><p>You'll use normal distributions (Math 34–35), Chapter 2's leakage model and Chapter 5's DVS. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. Several are probability problems: write down which variations are correlated and which are independent before you add anything.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9],
    summary: `
      <h3>Variation</h3>
      <p>PVT. Normal tails: 1σ 15.9%, 2σ 2.28%, 3σ 0.135% per side. Lot/wafer/die/within-die. Corners nMOS-pMOS-wire-V-T; derating factors multiply.</p>
      <h3>Reliability</h3>
      <p>FIT = failures per 10⁹ h; they add. Bathtub; burn-in; accelerated tests. Hot carriers, NBTI (t<sup>0.25</sup>), TDDB (E<sub>ox</sub> &lt; 0.7 V/nm). Electromigration MTTF ∝ J<sup>−2</sup>e<sup>E<sub>a</sub>/kT</sup>; self-heating I<sub>rms</sub> ≈ 1.26CV√(αf/t<sub>r</sub>). Soft errors (Q<sub>crit</sub>, ECC); overvoltage; latchup (taps, guard rings).</p>
      <h3>Scaling</h3>
      <p>Dennard: delay 1/S, energy 1/S³, power/gate 1/S², density constant. Wires: R/length ×S², C/length constant; global wires slow down.</p>
      <h3>Statistics</h3>
      <p>Variances add. Max of N normals: 2.5σ (100), 3.24σ (1000). Pelgrom σ ∝ 1/√(WL). ΔV<sub>t</sub> hurts leakage far more than speed. Y = Y<sub>c</sub><sup>N</sup>, Y = e<sup>−DA</sup>.</p>
      <h3>Tolerance</h3>
      <p>Adaptive body bias and voltage, thermal throttling, spares (binomial), ECC, master-checker, TMR 3P<sup>2</sup> − 2P<sup>3</sup>. ~30% margin for matched delays.</p>`,
  };
  Course.start(window.CHAPTER);
})();
