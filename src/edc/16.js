(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const ch = (n, file, part, where, html) => `<p class="aside">${html} <a href="${file}#${part}">Boylestad Chapter ${n}, ${where} →</a></p>`;
  const ohm = (r) => si(r, "Ω");
  const TAU = 2 * Math.PI, L10 = Math.log10;
  const V = (v) => si(v, "V", 4), A = (i) => si(i, "A", 4), W = (p) => si(p, "W", 4);

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Schottky (hot-carrier) diodes", mins: 20,
    blurb: "A metal–semiconductor junction: lower turn-on, faster switching, more leakage.",
    takeaway: "Metal (molybdenum, platinum, chrome, tungsten) on n-type silicon. Conduction is entirely by majority carriers; electrons entering the metal are 'hot carriers'. Compared with a p–n junction: lower barrier both ways, so more current at a given forward voltage (V_T ≈ 0.2 V for medium and high ranges, near 0 for some low-level units) but also larger reverse current (worse above 100 °C) and lower PIV (≈ 50 V for a 50 A unit vs 150 V). No stored minority carriers, so very short reverse recovery: useful to about 20 GHz and in 20 kHz+ switching supplies. Lower forward drop means less dissipation (P = V_FI). Max current about 100 A. Approximate model: ideal diode in parallel with junction capacitance C_J.",
    steps: [
      { k: "play", title: "Schottky vs silicon", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          function draw() {
            f.innerHTML = plot({ x: [0, 1], y: [0, 50], xt: [0, 0.2, 0.4, 0.6, 0.8, 1], yt: [0, 25, 50], xl: "V_D (V)", yl: "I_D (mA)", h: 230, series: [{ f: (v) => 1e3 * 1e-8 * (Math.exp(v / 0.0275) - 1), cls: "s1" }, { f: (v) => 1e3 * 1e-14 * (Math.exp(v / 0.026) - 1), cls: "s2" }], texts: [{ x: 0.12, y: 42, s: "Schottky" }, { x: 0.75, y: 42, s: "silicon p–n" }], label: "Forward characteristics of a Schottky diode and a silicon p-n diode" });
          }
          host.append(f); draw();
        },
        `<p>The Schottky curve turns on about 0.3–0.4 V earlier. Same idea in reverse: its leakage current is larger.</p>`,
        ch(1, "01-semiconductor-diodes.html", "p4", "Part 4", "The Shockley equation still describes the forward curve, with a different n and I<sub>s</sub>."),
      ]},
      { k: "learn", title: "Why it's fast", b: [
        `<p>A p–n diode stores <b>minority carriers</b> when it conducts; they have to be cleared before it can block (reverse recovery time t<sub>rr</sub>). A Schottky diode runs on majority carriers only: nothing to clear. Recovery in the order of 10 ns instead of 30–50 ns.</p>`,
        `<div class="two"><div class="tile"><h3>Better</h3><p>Lower forward drop, faster switching, lower noise.</p></div><div class="tile"><h3>Worse</h3><p>Higher leakage (rises fast with temperature), lower PIV.</p></div></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 40 A switching supply rectifier: Schottky drops 0.55 V, a p–n diode 1.05 V. Power saved by the Schottky?", a: 20, unit: "W", tol: 0.01, hint: "P = V_FI for each.", why: "42 W − 22 W = 20 W less heat." },
        { t: "mcq", q: "Which would make you avoid a Schottky diode?", opts: [["A 400 V peak reverse voltage", true, "Schottky PIVs are low: tens of volts, up to about 100 V."], ["A 100 kHz switching frequency", false, "That's where it shines."], ["A 1 A load", false, "Easily handled."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do Schottky diodes switch faster than ordinary p–n diodes?", model: "Because conduction in a Schottky diode is by majority carriers only. A p-n diode stores minority carriers while it conducts and must sweep them out before it can block, which takes the reverse recovery time. With no stored minority carriers, the Schottky diode turns off almost immediately." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Varactor (varicap) diodes", mins: 25,
    blurb: "A reverse-biased junction is a capacitor whose size you set with a voltage.",
    takeaway: "Reverse bias widens the depletion region W_d, so the transition capacitance C_T = εA/W_d falls. C_T(V_R) = C(0)/(1 + |V_R/V_T|)ⁿ, with n = ½ for alloy junctions and ⅓ for diffused junctions (V_T the knee voltage). Usual V_R range up to about 20 V; C_T from about 2 to 100 pF. Model: C_T with a large leakage resistance R_R (≥ 1 MΩ, so silicon) and small series R_S and lead inductance L_S (matters at GHz). Tuning ratio, e.g. C(2 V)/C(10 V). Temperature coefficient TC_C = ΔC/[C₀(T₁ − T₀)] × 100 %/°C. Q = 1/(2πfR_SC_T), rising with V_R. Hyperabrupt varactors give a more linear frequency–voltage relation in a VCO. Uses: tuning networks (f_p = 1/(2π√(LC))), FM modulators, AFC, adjustable filters, parametric amplifiers.",
    steps: [
      { k: "learn", title: "Width sets capacitance", b: [
        `<div class="eq">C<sub>T</sub> = εA/W<sub>d</sub>    C<sub>T</sub>(V<sub>R</sub>) = C(0)/(1 + |V<sub>R</sub>/V<sub>T</sub>|)<sup>n</sup>    n = ½ (alloy), ⅓ (diffused)</div>`,
        `<p>More reverse voltage → wider depletion region (plates further apart) → less capacitance. Steep at first, then flatter.</p>`,
        ch(1, "01-semiconductor-diodes.html", "p8", "Part 8", "Transition capacitance, first met with the diode's speed limits."),
      ]},
      { k: "play", title: "Tune a radio", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let VR = 4, n = 0.5; const C0 = 80e-12, VT = 0.7, L = 2e-6;
          function draw() {
            const Ct = (v) => C0 / Math.pow(1 + v / VT, n), c = Ct(VR);
            f.innerHTML = plot({ x: [0, 20], y: [0, 85], xt: [0, 5, 10, 15, 20], yt: [0, 20, 40, 60, 80], xl: "V_R (V)", yl: "C_T (pF)", h: 220, series: [{ f: (v) => Ct(v) * 1e12, cls: "s1" }], marks: [{ x: VR, y: c * 1e12 }], label: "Varactor capacitance falling with reverse voltage" });
            ro.innerHTML = readout([["C<sub>T</sub>", si(c, "F", 4)], ["Tank with L = 2 µH: f = 1/(2π√(LC))", si(1 / (TAU * Math.sqrt(L * c)), "Hz", 4)], ["Tuning ratio C(2 V)/C(10 V)", fmt(Ct(2) / Ct(10), 3)]]);
          }
          host.append(f, toggle(["Alloy (n = ½)", "Diffused (n = ⅓)"], (k) => { n = k ? 1 / 3 : 0.5; draw(); }, 0),
            slider({ id: id + "-v", label: "Reverse bias V_R (C(0) = 80 pF, V_T = 0.7 V)", min: 0, max: 20, step: 0.1, value: VR, show: (v) => fmt(v, 3) + " V" }, (v) => { VR = v; draw(); }).el, ro);
          draw();
        },
        `<p>One knob (a dc voltage) retunes an LC tank: that's how electronic tuners and VCOs work. A coupling capacitor keeps the tank's inductor from shorting the bias.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Alloy varactor: C(0) = 80 pF, V_T = 0.7 V, V_R = 4 V. C_T?", a: 30.87, unit: "pF", tol: 0.01, hint: "80/(1 + 4/0.7)^½.", why: "80/2.59 = 30.9 pF." },
        { t: "num", q: "With L = 2 µH, resonant frequency?", a: 20.25, unit: "MHz", tol: 0.01, hint: "1/(2π√(LC)).", why: "20.3 MHz." },
        { t: "num", q: "C₀ = 29 pF at 25 °C, TC_C = 0.02 %/°C. Change in C at 75 °C?", a: 0.29, unit: "pF", tol: 0.01, hint: "ΔC = TC_C × C₀ × ΔT.", why: "0.0002 × 29 pF × 50 = 0.29 pF." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a varactor's capacitance fall as the reverse voltage rises?", model: "The reverse voltage widens the depletion region, which acts like the dielectric between two plates. Capacitance is permittivity times area over the separation, so a wider depletion region means less capacitance." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Solar cells", mins: 30,
    blurb: "Light makes current. The voltage hardly changes; the current follows the light. Find the maximum power point.",
    takeaway: "Sunlight at sea level ≈ 100 mW/cm² (1 kW/m²). Photons absorbed near the junction create electron–hole pairs; minority carriers cross the junction, a current opposite to normal forward current. Short-circuit current I_SC rises almost linearly with illumination; open-circuit voltage V_OC rises quickly to 0.5–0.6 V and then barely changes. Series cells for voltage, parallel strings for current. P = VI is largest at the knee of the I–V curve. Efficiency η = P_max/[(area in cm²)(100 mW/cm²)] × 100%. Materials: single-crystal Si 14–17% (lab 25%), polycrystalline 9–14%, thin-film amorphous Si 6–9%, GaAs 20–30%; CdTe, CIS; research cells above 40%.",
    steps: [
      { k: "play", title: "I–V and power", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let sun = 1; const Is = 1e-10, vt = 0.0275;
          function draw() {
            const Isc = 0.2 * sun, I = (v) => Math.max(0, Isc - Is * (Math.exp(v / vt) - 1)), Voc = vt * Math.log(Isc / Is + 1);
            let best = [0, 0]; for (let v = 0; v <= Voc; v += 0.001) { const p = v * I(v); if (p > best[1]) best = [v, p]; }
            f.innerHTML = plot({ x: [0, 0.7], y: [0, 0.25], xt: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7], yt: [0, 0.1, 0.2], xl: "V (V)", yl: "I (A) · P (W)", h: 240, series: [{ f: I, cls: "s1", n: 500 }, { f: (v) => v * I(v), cls: "s2", n: 500 }], marks: [{ x: best[0], y: I(best[0]) }, { x: best[0], y: best[1], cls: "mk2" }], texts: [{ x: 0.69, y: 0.15, s: "orange: current · blue: power", a: "end" }], label: "Solar cell current and power against voltage" });
            ro.innerHTML = readout([["I<sub>SC</sub>", A(Isc)], ["V<sub>OC</sub>", V(Voc)], ["Maximum power", W(best[1]) + " at " + V(best[0])]]);
          }
          host.append(f, slider({ id: id + "-s", label: "Light intensity (relative)", min: 0.05, max: 1.2, step: 0.01, value: sun, show: (v) => fmt(v, 2) + "×" }, (v) => { sun = v; draw(); }).el, ro);
          draw();
        },
        `<p>Halve the light: I<sub>SC</sub> halves, V<sub>OC</sub> drops only a little. The best operating point is at the knee, where V × I is largest.</p>`,
      ]},
      { k: "learn", title: "Building a panel", b: [
        `<div class="two"><div class="tile"><h3>Series</h3><p>Voltages add, current stays one cell's.</p></div><div class="tile"><h3>Parallel</h3><p>Currents add, voltage stays one cell's.</p></div></div>`,
        `<div class="eq">η = P<sub>max</sub>/[(area, cm²)(100 mW/cm²)] × 100%</div>`,
        `<div class="tbl"><table><tr><th>Material</th><th>Typical efficiency</th></tr><tr><td>Single-crystal Si</td><td>14–17% (lab ~25%)</td></tr><tr><td>Polycrystalline Si</td><td>9–14%</td></tr><tr><td>Amorphous Si (thin film)</td><td>6–9%</td></tr><tr><td>GaAs</td><td>20–30%</td></tr></table></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Cells give 0.5 V and 100 mA each. How many in series for 9 V?", a: 18, tol: 0.001, hint: "9/0.5.", why: "18." },
        { t: "num", q: "How many such strings in parallel for 300 mA?", a: 3, tol: 0.001, hint: "300/100.", why: "3 strings: 54 cells." },
        { t: "num", q: "A 2 cm × 2 cm cell delivers 60 mW maximum in full sun. Efficiency?", a: 15, unit: "%", tol: 0.01, hint: "Input = 4 cm² × 100 mW/cm².", why: "60/400 = 15%." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a solar cell's current follow the light but its voltage hardly change?", model: "Each absorbed photon makes one electron-hole pair, so the generated current is proportional to the number of photons, the light intensity. The open-circuit voltage is set by the junction: like a forward-biased diode, it only rises logarithmically with current, so it quickly settles around half a volt." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Light, photons and wavelength", mins: 20,
    blurb: "Shorter wavelength, more energy per photon. Silicon responds up to about 1100 nm.",
    takeaway: "Photon energy W = hf = hv/λ (h = 6.624 × 10⁻³⁴ J·s, v = 3 × 10⁸ m/s; 1 Å = 10⁻¹⁰ m, 1 nm = 10⁻⁹ m). Longer wavelength → less energy. One photon frees at most one electron–hole pair; extra energy just heats the cell. Silicon's response peaks around 850 nm and ends near 1100–1200 nm, where photon energy equals the 1.1 eV band gap: longer wavelengths can't free electrons. Current depends on the material's absorption, the wavelength and the intensity. Light intensity is measured in lm/ft² (footcandles) or W/m².",
    steps: [
      { k: "learn", title: "Energy per photon", b: [
        `<div class="eq">W = hf = hv/λ    h = 6.624 × 10⁻³⁴ J·s, v = 3 × 10⁸ m/s</div>`,
        `<p>Blue light (short λ) carries more energy per photon than red. Infrared beyond about 1100 nm can't free an electron in silicon at all.</p>`,
        ch(1, "01-semiconductor-diodes.html", "p1", "Chapter 1", "Band gaps and electron volts."),
      ]},
      { k: "play", title: "Pick a wavelength", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let lam = 650;
          function draw() { const Wj = (6.624e-34 * 3e8) / (lam * 1e-9), ev = Wj / 1.6e-19; ro.innerHTML = readout([["λ", lam + " nm"], ["W = hv/λ", si(Wj, "J", 4)], ["In electron volts", fmt(ev, 4) + " eV"], ["Frees an electron in silicon (1.1 eV)?", ev >= 1.1 ? "yes" + (ev > 1.1 ? ": the extra " + fmt(ev - 1.1, 3) + " eV becomes heat" : "") : "no: too little energy"]]); }
          host.append(slider({ id: id + "-l", label: "Wavelength", min: 300, max: 1400, step: 5, value: lam, show: (v) => v + " nm" }, (v) => { lam = v; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Energy of a 650 nm photon, in eV?", a: 1.911, unit: "eV", tol: 0.01, hint: "hv/λ, then divide by 1.6 × 10⁻¹⁹.", why: "3.06 × 10⁻¹⁹ J = 1.91 eV." },
        { t: "num", q: "Longest wavelength that can free an electron across a 1.1 eV gap?", a: 1129, unit: "nm", tol: 0.01, hint: "λ = hv/W.", why: "About 1130 nm." },
      ]},
      { k: "learn", title: "A warning about the units table", b: [
        `<p class="aside">The book gives 1 lm = 1.496 × 10⁻¹⁰ W and 1 fc = 1.609 × 10⁻⁹ W/m². Those aren't the physical values: 1 lumen is about 1/683 W ≈ 1.46 mW (at 555 nm), and 1 fc = 10.76 lm/m² ≈ 15.8 mW/m². If a problem uses the book's conversion, follow the problem, but don't carry those numbers into real designs.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why doesn't very long-wavelength light produce any current in a silicon solar cell?", model: "Each photon's energy is Planck's constant times the speed of light over the wavelength. Beyond about 1100 nanometres the photon has less energy than silicon's 1.1 electron-volt band gap, so it can't free an electron, and no current results." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Photodiodes and photoconductive cells", mins: 25,
    blurb: "A reverse-biased junction whose leakage follows the light. A resistor whose resistance follows the light.",
    takeaway: "Photodiode: operated in reverse bias. Light adds minority carriers, so the reverse current I_λ rises almost linearly with illumination; the dark current flows with no light (current returns to zero only at a forward bias of V_T). Rise/fall times in nanoseconds: high-speed counting and switching. Germanium covers more of the infrared than silicon but has more dark current. The current is small, so it's amplified for control. Uses: beam-break alarms and counters. Photoconductive cell (photoresistor): no junction, a CdS or CdSe film whose resistance falls with light (a straight line on log–log axes, e.g. 100 kΩ down to 100 Ω). Peak response CdS ≈ 510 nm, CdSe ≈ 615 nm; response time CdS ≈ 100 ms, CdSe ≈ 10 ms. Lamp-and-cell regulator: V_o = R_λV_i/(R_λ + R₁).",
    steps: [
      { k: "learn", title: "Photodiode", b: [
        `<p>Reverse bias leaves only a tiny leakage current (thermal minority carriers). Light makes more minority carriers, so the reverse current grows in proportion to the light.</p>`,
        fig(plot({ x: [0, 5000], y: [0, 500], xt: [0, 1000, 2000, 3000, 4000, 5000], yt: [0, 100, 200, 300, 400, 500], xl: "illumination (fc)", yl: "I (µA)", h: 210, series: [{ f: (x) => 2 + 0.09 * x, cls: "s1" }], texts: [{ x: 200, y: 30, s: "dark current" }], label: "Photodiode reverse current rising linearly with light" })),
        `<p>Break the light beam and the current drops to the dark current: an alarm sounds, or a counter adds one.</p>`,
      ]},
      { k: "play", title: "Photoconductive cell", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let lf = 1; const R1 = 3e3, Vi = 15;
          function draw() {
            const fc = Math.pow(10, lf), R = 1e5 / Math.pow(fc / 0.1, 0.75);
            f.innerHTML = plot({ x: [0, 4], y: [2, 5], xt: [0, 1, 2, 3, 4], xtf: (v) => si(Math.pow(10, v - 1), "", 2).trim(), yt: [2, 3, 4, 5], ytf: (v) => si(Math.pow(10, v), "Ω", 1), xl: "illumination (fc, log)", yl: "R (log)", h: 220, series: [{ f: (x) => L10(1e5 / Math.pow(Math.pow(10, x - 1) / 0.1, 0.75)), cls: "s1" }], marks: [{ x: lf + 1, y: L10(R) }], label: "Photoconductive cell resistance falling with light on log-log axes" });
            ro.innerHTML = readout([["Illumination", fmt(fc, 3) + " fc"], ["R<sub>λ</sub>", ohm(R)], ["In a divider with R<sub>1</sub> = 3 kΩ from 15 V: V<sub>o</sub> = R<sub>λ</sub>V<sub>i</sub>/(R<sub>λ</sub> + R<sub>1</sub>)", V((R * Vi) / (R + R1))]]);
          }
          host.append(f, slider({ id: id + "-f", label: "Illumination", min: -1, max: 3, step: 0.02, value: lf, show: (v) => fmt(Math.pow(10, v), 3) + " fc" }, (v) => { lf = v; draw(); }).el, ro);
          draw();
        },
        `<p>A straight line on log–log axes: resistance falls by a big factor for each decade of light. Slow, though: tens to hundreds of milliseconds.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Lamp-and-cell regulator: R_λ = 2 kΩ, R₁ = 3 kΩ, V_i = 15 V. V_o?", a: 6, unit: "V", tol: 0.01, hint: "R_λV_i/(R_λ + R₁).", why: "6 V. If V_i sags, the lamp dims, R_λ rises and holds V_o up." },
        { t: "mcq", q: "You need to count parts passing at 10 000 per second. Photodiode or CdS cell?", opts: [["Photodiode", true, "Nanosecond response; CdS takes ~100 ms."], ["CdS cell", false, "Far too slow."], ["Either", false, "Speeds differ by a factor of millions."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is a photodiode operated with reverse bias?", model: "In reverse bias the normal current is only the tiny leakage from thermally generated minority carriers. Light creates more minority carriers, so the reverse current becomes proportional to the light, with little background to swamp it. Forward bias would add a large current unrelated to the light." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "IR emitters and LCDs", mins: 20,
    blurb: "A GaAs diode that emits infrared, and a display that only steers light someone else makes.",
    takeaway: "IR-emitting diode (GaAs): forward bias makes electrons and holes recombine and emit photons; radiant flux almost proportional to forward current; collimated versions give narrow beams. Uses: card readers, shaft encoders, data links, intrusion alarms. LCD: microwatts (LEDs: milliwatts) but needs a light source, 0–60 °C, slower (100–300 ms vs under 100 ns for LEDs), can degrade chemically. Nematic liquid crystal: rod-like molecules. Dynamic scattering: a 6–20 V field disturbs the molecules and scatters light (frosted look where segments overlap). Field-effect (twisted nematic): the molecules twist the light's polarization 90° between crossed alignment surfaces; with polarizers, no voltage blocks (transmissive) or passes (reflective) the light; 2–8 V aligns the molecules and removes the twist. Transmissive, reflective and transflective modes.",
    steps: [
      { k: "learn", title: "IR emitters", b: [
        `<p>Forward-biased GaAs: electrons and holes recombine in a special region and emit infrared photons. Output power rises almost linearly with forward current.</p>`,
        ch(1, "01-semiconductor-diodes.html", "p11", "Part 11", "The LED: the same process at visible wavelengths."),
      ]},
      { k: "play", title: "Twisted nematic", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), cap = el(`<p></p>`);
          const d = (on) => {
            let s = S.box(20, 30, 20, 120, "") + S.t(30, 170, "polarizer |", { cls: "s m" }) + S.box(300, 30, 20, 120, "") + S.t(310, 170, "polarizer |", { cls: "s m" });
            for (let i = 0; i < 6; i++) { const x = 80 + i * 38, ang = on ? 90 : (i / 5) * 90; s += `<line class="w" x1="${x - 10 * Math.cos((ang * Math.PI) / 180)}" y1="${90 - 22 * Math.sin((ang * Math.PI) / 180)}" x2="${x + 10 * Math.cos((ang * Math.PI) / 180)}" y2="${90 + 22 * Math.sin((ang * Math.PI) / 180)}" style="stroke-width:5;stroke:var(--cool)"/>`; }
            s += S.t(360, 95, on ? "light passes" : "blocked: dark", { a: "start", cls: on ? "a" : "s m" }) + S.t(170, 22, on ? "voltage on: rods line up with the field" : "no voltage: rods twist 90° across the cell", { cls: "s" });
            f.innerHTML = S.svg(500, 185, `<g transform="translate(25,0)">${s}</g>`, { max: 500, label: "Twisted nematic cell between two parallel polarizers" });
            cap.innerHTML = on ? "The field (2–8 V) aligns the molecules end-on: no twist, so the vertically polarized light passes the second vertical polarizer. A bright segment." : "The molecules twist the light's polarization by 90°. It arrives horizontal at a vertical polarizer and is blocked: dark. (This is the transmissive arrangement; reflective units invert the pattern.)";
          };
          host.append(f, toggle(["No voltage", "Voltage applied"], (k) => d(k === 1), 0), cap);
          d(false);
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "LCD or LED?", bins: ["LCD", "LED"], items: [
          ["Microwatts of power", 0, "LCDs only steer light."],
          ["Makes its own light", 1, "LEDs emit."],
          ["Switches in under 100 ns", 1, "LCDs take 100–300 ms."],
          ["Needs a backlight or reflector in the dark", 0, "No light of its own."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do watches use field-effect LCDs?", model: "Because they draw only microwatts, far less than LEDs or dynamic-scattering LCDs, so a small battery lasts years. A watch doesn't need fast switching, so the LCD's slow response doesn't matter, and room light can be reflected to make it visible." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Thermistors", mins: 20,
    blurb: "A resistor that's also a thermometer. Usually its resistance falls as it heats.",
    takeaway: "Thermistor: a temperature-sensitive resistor (not a junction device) of germanium, silicon or metal oxides (cobalt, nickel, strontium, manganese); the material sets a positive or negative temperature coefficient. Typical NTC: about 5000 Ω at 20 °C and 100 Ω at 100 °C (50:1 over 80 °C), 3–5% per °C. Heating can be external (surroundings) or internal (its own current): at very low current it behaves like a plain resistor; as current rises, self-heating brings in the negative coefficient. Uses: temperature measurement, inrush-current limiters (high resistance cold, low once warm), control. Temperature indicator: thermistor in series with a meter and a calibration resistor; hotter → lower R → more current.",
    steps: [
      { k: "play", title: "Heat it", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let T = 40; const B = Math.log(50) / (1 / 293.15 - 1 / 373.15), R = (t) => 5000 * Math.exp(B * (1 / (t + 273.15) - 1 / 293.15));
          function draw() {
            f.innerHTML = plot({ x: [0, 120], y: [1, 4.5], xt: [0, 20, 40, 60, 80, 100, 120], yt: [2, 3, 4], ytf: (v) => si(Math.pow(10, v), "Ω", 1), xl: "temperature (°C)", yl: "R (log)", h: 220, series: [{ f: (t) => L10(R(t)), cls: "s1" }], marks: [{ x: T, y: L10(R(T)) }], label: "NTC thermistor resistance falling with temperature" });
            ro.innerHTML = readout([["R", ohm(R(T))], ["Meter current: 9 V across R + 1 kΩ", A(9 / (R(T) + 1000))]]);
          }
          host.append(f, slider({ id: id + "-t", label: "Temperature", min: 0, max: 120, step: 1, value: T, show: (v) => v + " °C" }, (v) => { T = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">A curve through the book's two points (5 kΩ at 20 °C, 100 Ω at 100 °C). The meter becomes a thermometer once calibrated.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "From 5000 Ω at 20 °C to 100 Ω at 100 °C: by what factor did R change?", a: 50, tol: 0.01, hint: "Ratio.", why: "50:1 over 80 °C." },
        { t: "num", q: "Temperature indicator: 9 V, 1 kΩ calibration resistor, thermistor at 5 kΩ. Meter current?", a: 1.5, unit: "mA", tol: 0.01, hint: "9/(5000 + 1000).", why: "1.5 mA. Warmer: more current." },
        { t: "mcq", q: "Why does an inrush-limiting thermistor barely waste power in normal running?", opts: [["Its own current heats it and its resistance drops", true, "Cold it limits the surge; hot it's nearly a short."], ["It switches off after start-up", false, "It stays in circuit."], ["Its resistance rises when warm", false, "That would be PTC, the wrong way here."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How can a thermistor's temperature be changed internally?", model: "By the current through it. Power I squared R heats its body. At very small currents the heating is negligible and it acts like a fixed resistor, but larger currents raise its temperature, and with a negative coefficient its resistance falls." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  /* Illustrative tunnel-diode curve (mA): tunnelling hump plus ordinary diode current. */
  const tdI = (v) => 10 * (v / 0.1) * Math.exp(1 - v / 0.1) + 1e-4 * (Math.exp(v / 0.05) - 1);
  const p8 = {
    id: "p8", title: "Tunnel diodes and negative resistance", mins: 30,
    blurb: "Doped so heavily that carriers tunnel through. A region where more voltage gives less current.",
    takeaway: "Tunnel diode (Esaki, 1958): doping 100 to thousands of times normal; depletion region ~10⁻⁶ cm, so carriers tunnel through at low forward bias, giving a current peak I_P at V_P (≤ about 600 mV), then a negative-resistance region down to a valley I_V at V_V, then normal diode rise. Very fast (ns, ps). Ge and GaAs; I_P/I_V about 10:1 (Ge) and 20:1 (GaAs). I_P from microamps to hundreds of amps. A 1.5 V ohmmeter can damage one. Model in the negative region: L_S, R_S, C and −R. Load line: up to three intersections; a and b (positive slope) are stable, c (negative-resistance region) is unstable and the circuit settles at a or b. A load line crossing only the negative region gives an oscillator: relaxation (pulse) with an inductor, or sinusoidal when the negative resistance cancels a tank's losses.",
    steps: [
      { k: "play", title: "Load line on a tunnel diode", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let E = 0.6, R = 60;
          function draw() {
            const ll = (v) => (1000 * (E - v)) / R, pts = [];
            let prev = tdI(0) - ll(0);
            for (let v = 0.001; v <= E; v += 0.0005) { const d = tdI(v) - ll(v); if (Math.sign(d) !== Math.sign(prev)) pts.push(v); prev = d; }
            const marks = pts.map((v) => { const slope = tdI(v + 0.001) - tdI(v - 0.001); return { x: v, y: tdI(v), cls: slope < 0 ? "mkb" : "mk" }; });
            f.innerHTML = plot({ x: [0, 0.7], y: [0, 15], xt: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7], yt: [0, 5, 10, 15], xl: "V_T (V)", yl: "I_T (mA)", h: 250, series: [{ f: tdI, cls: "s1", n: 600 }, { f: ll, cls: "s5" }], marks, label: "Tunnel diode characteristic with a load line and its intersections" });
            ro.innerHTML = readout([["Intersections", pts.length ? pts.map((v) => fmt(v, 3) + " V").join(", ") : "none"], ["Stable (positive slope)", String(marks.filter((m) => m.cls === "mk").length)], ["Unstable (negative-resistance region)", String(marks.filter((m) => m.cls === "mkb").length)]]);
          }
          host.append(f, slider({ id: id + "-e", label: "Supply E", min: 0.1, max: 0.7, step: 0.005, value: E, show: (v) => fmt(v, 3) + " V" }, (v) => { E = v; draw(); }).el,
            slider({ id: id + "-r", label: "Series R", min: 5, max: 200, step: 1, value: R, show: ohm }, (v) => { R = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">An illustrative curve (peak 10 mA at 0.1 V). Orange dots: stable points. Blue: the unstable one in the negative-resistance region, where any nudge runs away to a or b.</p>`,
      ]},
      { k: "learn", title: "Why it oscillates", b: [
        `<p>Pick E and R so the load line crosses <b>only</b> the negative-resistance region. There's no stable point to settle at. With an inductor in the loop, the current climbs to the peak, the voltage jumps across, the inductor's current falls to the valley, it jumps back, and so on: a pulse oscillator from a dc supply.</p>`,
        `<p>Put a tunnel diode in series with an LC tank and its negative resistance cancels the tank's losses: the decaying ring becomes a steady sine.</p>`,
        ch(14, "14-feedback-oscillators.html", "p6", "Part 6", "Same goal as Barkhausen's βA = 1: make up the losses exactly."),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A load line crosses a tunnel diode's curve at three points. Where does the circuit end up?", opts: [["At one of the two positive-slope points", true, "The middle one is unstable."], ["At the middle point", false, "Any disturbance pushes it away."], ["It always oscillates", false, "Only if there's no stable point."]] },
        { t: "mcq", q: "Why can a 1.5 V ohmmeter damage a tunnel diode?", opts: [["Its peak voltage is under about 0.6 V and its current can be large", true, "1.5 V forward drives it hard."], ["Tunnel diodes can't conduct", false, "They conduct easily."], ["Ohmmeters use ac", false, "They use a dc battery."]] },
        { t: "num", q: "A Ge tunnel diode has I_P = 5 mA and I_P/I_V = 10. Valley current?", a: 0.5, unit: "mA", tol: 0.01, hint: "I_P/10.", why: "0.5 mA." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is negative resistance and how can it make an oscillator?", model: "It's a region where increasing the voltage across the device decreases its current, so the slope of its curve is negative. A positive resistance always takes energy out of a circuit; a negative one supplies it. If its negative resistance cancels the losses of a tank circuit, or if the load line leaves no stable operating point, the circuit keeps oscillating from just a dc supply." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edc16", eyebrow: "Boylestad · Chapter 16", title: "Other Two-Terminal Devices",
    intro: `<p>Eight parts: Schottky and varactor diodes, solar cells and the physics of light, photodiodes and photoconductive cells, IR emitters and LCDs, thermistors, and tunnel diodes.</p><p>Each is a two-terminal device with one special trick. It builds on Boylestad Chapter 1.</p><p class="aside">Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's problems in the book. They test whether the ideas stuck, so don't expect them to look like the examples here.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8],
    summary: `
      <h3>Diodes</h3>
      <p>Schottky: metal–semiconductor, majority carriers, V<sub>T</sub> ≈ 0.2 V, fast, leaky, low PIV.</p>
      <div class="eq">Varactor: C<sub>T</sub> = εA/W<sub>d</sub>, C<sub>T</sub>(V<sub>R</sub>) = C(0)/(1 + |V<sub>R</sub>/V<sub>T</sub>|)<sup>n</sup>, n = ½ alloy, ⅓ diffused    TC<sub>C</sub> = ΔC/[C<sub>0</sub>(T<sub>1</sub> − T<sub>0</sub>)] × 100%    Q = 1/(2πfR<sub>S</sub>C<sub>T</sub>)</div>
      <h3>Light</h3>
      <div class="eq">W = hf = hv/λ    η = P<sub>max</sub>/[(area cm²)(100 mW/cm²)]    solar: I<sub>SC</sub> ∝ light, V<sub>OC</sub> ≈ 0.5–0.6 V</div>
      <p>Photodiode: reverse-biased, I<sub>λ</sub> ∝ light, ns response. Photoconductive cell: R falls with light (log–log line), slow. IR LED: flux ∝ I<sub>F</sub>. LCD: µW, needs light, slow.</p>
      <div class="eq">Lamp–cell regulator: V<sub>o</sub> = R<sub>λ</sub>V<sub>i</sub>/(R<sub>λ</sub> + R<sub>1</sub>)</div>
      <h3>Thermistor and tunnel diode</h3>
      <p>NTC thermistor: 3–5% per °C, self-heating. Tunnel diode: negative-resistance region between I<sub>P</sub> (V<sub>P</sub>) and I<sub>V</sub> (V<sub>V</sub>); I<sub>P</sub>/I<sub>V</sub> ≈ 10 (Ge), 20 (GaAs); stable points on positive slopes; oscillators.</p>`,
  };
  Course.start(window.CHAPTER);
})();
