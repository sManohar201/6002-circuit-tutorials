(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;
  const tbl = (head, rows) => `<div class="tbl"><table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`;
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return (s + 0.5) / 4294967296; }; }
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  const kB = 1.380649e-23, q = 1.602e-19;
  const rms = (xs) => Math.sqrt(xs.reduce((a, x) => a + x * x, 0) / xs.length);
  const sup = (v) => String(v).replace("-", "⁻").replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);
  const noiseSeq = (seed, n) => { const r = rng(seed); return Array.from({ length: n }, () => gauss(r)); };

  const p1 = {
    id: "p1", title: "Noise: a signal you can only describe statistically", mins: 20,
    blurb: "You can't predict a noise voltage, but you can know its rms. And independent noises add in power, not in volts.",
    takeaway: "Noise is a random signal with (usually) zero mean; its size is its rms value = its σ (Module 34). Noise power ∝ v_rms². Independent (uncorrelated) noise sources add in power: v_total = √(v₁² + v₂² + …), so the biggest source dominates. SNR = signal power/noise power = (V_sig,rms/V_n,rms)², usually in dB: 20 log of the rms ratio. Noise is Gaussian in amplitude (it's a sum of countless electron motions): peaks beyond 3σ happen 0.3% of the time, so peak-to-peak is often quoted as about 6× rms.",
    steps: [
      { k: "play", title: "Add two noises", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 3, b = 4;
          const n1 = noiseSeq(1, 300), n2 = noiseSeq(2, 300);
          function draw() {
            const x1 = n1.map((v) => a * v), x2 = n2.map((v) => b * v), s = x1.map((v, i) => v + x2[i]);
            f.innerHTML = plot({ x: [0, 300], y: [-45, 45], xt: [0, 100, 200, 300], yt: [-30, 0, 30], ytf: (v) => (v ? (v > 0 ? "noise 2" : "noise 1") : "sum"), xl: "time (samples)", h: 260, padL: 70, series: [{ pts: x1.map((v, i) => [i, v - 30]), cls: "s5" }, { pts: x2.map((v, i) => [i, v + 30]), cls: "s5" }, { pts: s.map((v, i) => [i, v]), cls: "s1" }], label: "Two independent noise waveforms (grey, offset up and down) and their sum (orange)" });
            ro.innerHTML = readout([["Noise 1 rms (measured)", fmt(rms(x1), 3) + " µV"], ["Noise 2 rms (measured)", fmt(rms(x2), 3) + " µV"], ["Sum rms (measured)", fmt(rms(s), 3) + " µV"], ["√(a² + b²)", fmt(Math.hypot(a, b), 3) + " µV"], ["a + b (wrong)", fmt(a + b, 3) + " µV"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "Noise 1 rms a", min: 0, max: 8, step: 0.5, value: a, show: (v) => v + " µV" }, (v) => { a = v; draw(); }).el,
            slider({ id: id + "-b", label: "Noise 2 rms b", min: 0, max: 8, step: 0.5, value: b, show: (v) => v + " µV" }, (v) => { b = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The grey traces are drawn shifted up and down so you can see them; the orange is their sum at the centre. 3 µV and 4 µV make 5 µV, not 7: the two partly cancel at random. Set one to 8 and the other to 2: the total is 8.2. Small sources hardly matter.</p>`,
      ]},
      { k: "learn", title: "Why power, not volts", b: [
        `<p>(v₁ + v₂)² = v₁² + v₂² + 2v₁v₂. For independent noises the cross term averages to zero (Module 34: Var(X + Y) = Var X + Var Y).</p>`,
        `<div class="eq">v_total = √(v₁² + v₂² + …)</div>`,
        `<div class="key"><b>Design consequence.</b> Find the biggest noise source and fix that. Halving a source that's 30% of the largest one barely changes the total.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Noise sources of 10, 5 and 2 µV rms, independent. Total (µV rms)?", a: 11.36, tol: 0.01, why: "√(100 + 25 + 4) = √129 = 11.4 µV." },
        { t: "num", q: "A 1 mV rms signal with 10 µV rms noise. SNR (dB)?", a: 40, why: "20 log(1000/10) = 40 dB." },
        { t: "num", q: "Noise is 5 µV rms. Rough peak-to-peak you'd see on a scope (µV)?", a: 30, tol: 0.1, why: "About 6 × rms ≈ 30 µV (±3σ)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do independent noise sources add as the square root of the sum of squares?", model: "Because their power, the mean square, adds. When you square the sum of two independent noises, the cross term averages to zero, since they're as likely to push the same way as opposite ways. So the mean squares add, and the rms total is the square root of that sum." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Noise spectral density", mins: 25,
    blurb: "Noise is spread over frequency. Its density, in V²/Hz or V/√Hz, tells you how much you collect in any bandwidth.",
    takeaway: "Power spectral density S(f), in V²/Hz, says how much noise power lives per hertz. Data sheets give its square root, in nV/√Hz. Total noise in a band = √(∫S df). White noise (flat S) over bandwidth B: v_rms = √(S·B) = (density) × √B. Double the bandwidth → √2 more noise. That's why every precision system limits its bandwidth to just what the signal needs.",
    steps: [
      { k: "learn", title: "Power per hertz", b: [
        `<p>Noise has energy at every frequency. Like Module 31's spectral density, what makes sense is <b>noise power per hertz</b>:</p>`,
        `<div class="eq">S(f) in V²/Hz    √S in V/√Hz    v_rms = √(∫ S df)</div>`,
        `<p>“4 nV/√Hz” means: in each 1 Hz slice there's 4 nV rms; over 1 MHz of flat (white) noise, 4 nV × √(10⁶) = 4 µV rms.</p>`,
        `<p class="aside">Why √Hz? Because powers add over frequency, rms grows only as the square root of the bandwidth.</p>`,
      ]},
      { k: "play", title: "Open the bandwidth", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), sp = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let B = 0.1;
          const w = noiseSeq(9, 1200);
          function draw() {
            const a = Math.exp(-2 * Math.PI * B), y = []; let s = 0;
            w.forEach((v) => { s = a * s + Math.sqrt(1 - a * a) * v; y.push(s); });
            /* unit white noise has rms 1 over 0…f_s/2; a first-order filter keeps a noise bandwidth of about (π/2)B of that 0.5 f_s */
            const scale = Math.sqrt(Math.min(1, Math.PI * B)) / (rms(y) || 1), ys = y.map((v) => v * scale);
            f.innerHTML = plot({ x: [0, 400], y: [-3, 3], xt: [0, 100, 200, 300, 400], yt: [-2, 0, 2], xl: "time (samples)", h: 170, series: [{ pts: ys.slice(0, 400).map((v, i) => [i, v]), cls: "s1" }], label: "Band-limited noise in time" });
            sp.innerHTML = plot({ x: [0, 0.5], y: [0, 1.2], xt: [0, 0.1, 0.2, 0.3, 0.4, 0.5], yt: [0, 0.5, 1], xl: "frequency (× sample rate)", yl: "S(f) (relative)", h: 160, areas: [{ f: (x) => 1 / (1 + (x / B) ** 2), cls: "ar1", n: 400 }], series: [{ f: () => 1, cls: "s5" }, { f: (x) => 1 / (1 + (x / B) ** 2), cls: "s1", n: 400 }], label: "White input density (grey dashed) and the filtered density (orange area)" });
            ro.innerHTML = readout([["Filter corner", fmt(B, 3) + " × f_s"], ["Noise rms (relative)", fmt(rms(ys), 3)], ["∝ √(bandwidth)", "doubling B → ×1.41"]]);
          }
          host.append(f, sp, slider({ id: id + "-b", label: "Filter bandwidth", min: 0.005, max: 0.4, log: true, value: B, show: (v) => fmt(v, 3) + " f_s" }, (v) => { B = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The orange area under the density is the noise power. Narrow the bandwidth: the waveform slows down and shrinks, and its rms falls as √B. Same white source throughout; only the window you look through changes.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "An op amp has 10 nV/√Hz (white). Noise over 100 kHz (µV rms)?", a: 3.16, tol: 0.01, why: "10 nV × √(10⁵) = 10 × 316 nV = 3.16 µV." },
        { t: "num", q: "Same op amp, bandwidth cut to 1 kHz. Noise (µV rms)?", a: 0.316, tol: 0.01, why: "100× less bandwidth → 10× less noise: 316 nV." },
        { t: "mcq", q: "Density is 4 nV/√Hz. How much noise power is in each hertz?", opts: [["16 (nV)²: the square of the density", true, "S = (4 nV)²/Hz = 1.6×10⁻¹⁷ V²/Hz."], ["4 nV", false, "That's the rms per √Hz; power is its square."], ["2 nV", false, "No square root of the density is involved."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a noise spec use units of volts per root hertz?", model: "Noise power is spread over frequency, and powers in different frequency slices add. So the total power grows in proportion to the bandwidth, and the rms voltage grows with the square root of the bandwidth. Quoting volts per root hertz lets you multiply by the square root of your bandwidth to get the rms noise." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Where chip noise comes from", mins: 30,
    blurb: "Thermal noise from every resistor and channel, shot noise from every junction current, and 1/f noise from defects. Formulas you'll use daily.",
    takeaway: "Thermal (Johnson) noise of a resistor: S = 4kTR V²/Hz (4.07 nV/√Hz for 1 kΩ at 300 K; scales as √R). Shot noise of a current crossing a barrier: S = 2qI A²/Hz (17.9 pA/√Hz at 1 mA). MOSFET channel noise: drain current noise 4kTγg_m with γ ≈ 2/3 (long channel), i.e. an input-referred voltage 4kTγ/g_m: more g_m (more current) → less noise. Flicker (1/f) noise: S ∝ 1/f, dominating below the corner frequency f_c, worst in small MOSFETs (∝ 1/(WL)). Integrated 1/f noise grows only as ln(f₂/f₁): each decade adds the same amount.",
    steps: [
      { k: "learn", title: "The formulas", b: [
        tbl(["Source", "Density", "Value to remember"], [["Resistor (thermal)", "4kTR  (V²/Hz)", "1 kΩ → 4.07 nV/√Hz at 300 K"], ["Junction current (shot)", "2qI  (A²/Hz)", "1 mA → 17.9 pA/√Hz"], ["MOSFET channel", "4kTγg_m (A²/Hz) → 4kTγ/g_m at the input", "g_m = 1 mS → 3.3 nV/√Hz"], ["Flicker", "K/f", "corner f_c: 1 kHz–1 MHz in CMOS"]]),
        `<p class="aside">4kT = 1.66×10⁻²⁰ J at 300 K. A handy anchor: √(4kT·R) ≈ 4 nV/√Hz × √(R/1 kΩ). 100 kΩ → 40 nV/√Hz.</p>`,
      ]},
      { k: "why", title: "Why each one exists", b: [
        `<ul><li><b>Thermal:</b> electrons in any conductor jiggle with thermal energy. More resistance (or temperature) → bigger random voltage. Present even with no current.</li><li><b>Shot:</b> current is made of discrete charges crossing a barrier at random moments. More current → more randomness (but less, relatively: the noise grows as √I).</li><li><b>Flicker:</b> carriers get trapped and released by defects at the silicon–oxide interface, with a huge spread of time constants. The sum of many slow random switches gives a 1/f spectrum.</li></ul>`,
      ]},
      { k: "play", title: "White floor plus 1/f", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let ew = 5, lfc = 4, lf1 = 1, lf2 = 6;
          function draw() {
            const fc = 10 ** lfc, f1 = 10 ** lf1, f2 = 10 ** lf2, Sw = (ew * 1e-9) ** 2;
            const dens = (lf) => ew * Math.sqrt(1 + fc / 10 ** lf);
            const white = Sw * (f2 - f1), flick = Sw * fc * Math.log(f2 / f1), tot = Math.sqrt(white + flick);
            f.innerHTML = plot({ x: [0, 7], y: [0, 3], xt: [0, 1, 2, 3, 4, 5, 6, 7], xtf: (v) => "10" + sup(v), yt: [0, 1, 2, 3], ytf: (v) => "10" + sup(v), xl: "f (Hz)", yl: "nV/√Hz", h: 230, areas: [{ f: (lf) => Math.log10(dens(lf)), from: lf1, to: lf2, cls: "ar1", n: 300 }], series: [{ f: (lf) => Math.log10(dens(lf)), cls: "s1", n: 300 }, { f: () => Math.log10(ew), cls: "s5" }], marks: [{ x: lfc, y: Math.log10(ew * Math.SQRT2), cls: "mkb", label: "corner", dy: -12 }], label: "Noise density on log axes: 1/f region then a white floor; integration band shaded" });
            ro.innerHTML = readout([["Total noise in band", si(tot, "V", 3) + " rms"], ["From the white part", si(Math.sqrt(white), "V", 3)], ["From 1/f", si(Math.sqrt(flick), "V", 3)]]);
          }
          host.append(f, slider({ id: id + "-w", label: "White floor", min: 1, max: 50, log: true, value: ew, show: (v) => fmt(v, 3) + " nV/√Hz" }, (v) => { ew = v; draw(); }).el,
            slider({ id: id + "-c", label: "1/f corner (log₁₀ Hz)", min: 1, max: 6, step: 0.1, value: lfc, show: (v) => si(10 ** v, "Hz", 2) }, (v) => { lfc = v; draw(); }).el,
            slider({ id: id + "-1", label: "Band from (log₁₀ Hz)", min: 0, max: 5, step: 0.1, value: lf1, show: (v) => si(10 ** v, "Hz", 2) }, (v) => { lf1 = Math.min(v, lf2 - 0.1); draw(); }).el,
            slider({ id: id + "-2", label: "Band to (log₁₀ Hz)", min: 1, max: 7, step: 0.1, value: lf2, show: (v) => si(10 ** v, "Hz", 2) }, (v) => { lf2 = Math.max(v, lf1 + 0.1); draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Below the corner the density rises 10 dB per decade (1/f in power). For a wideband signal (to 1 MHz) the white floor dominates the total. Shrink the band to 1–100 Hz (a sensor, a bandgap reference) and 1/f is almost everything: that's why precision DC circuits use chopping or auto-zeroing (Module 31's mixer moves the signal above the corner).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Thermal noise density of a 10 kΩ resistor at 300 K (nV/√Hz)?", a: 12.9, tol: 0.02, why: "4.07 × √10 = 12.9 nV/√Hz." },
        { t: "num", q: "…and its rms noise over a 20 kHz audio band (µV)?", a: 1.82, tol: 0.02, why: "12.9 nV × √20 000 = 12.9 × 141 nV = 1.82 µV." },
        { t: "num", q: "A MOSFET with g_m = 4 mS, γ = 2/3. Input-referred thermal noise density (nV/√Hz)?", a: 1.66, tol: 0.02, why: "√(4kT × 0.667/0.004) = √(2.76×10⁻¹⁸) = 1.66 nV/√Hz. Quadrupling g_m halves it, at 4× the current (or more)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do precision low-frequency circuits worry about 1/f noise more than wideband circuits do?", model: "1/f noise is concentrated at low frequencies: below the corner it rises as frequency falls. A wideband circuit integrates mostly the flat white floor, which dominates its total. A circuit that only cares about DC to a few hertz sits entirely in the 1/f region, so flicker noise sets its accuracy, which is why such circuits use chopping or auto-zeroing." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Filtering noise: noise bandwidth and kT/C", mins: 30,
    blurb: "A filter shapes noise by |H|². For an RC, the resistor's value cancels out completely: the noise is set by C alone.",
    takeaway: "Output noise density = |H(f)|²·S_in(f). For white noise through a first-order low-pass, the total is S·(π/2)·f_c: the equivalent noise bandwidth is π/2 times the −3 dB bandwidth. Resistor R plus capacitor C: S = 4kTR, f_c = 1/(2πRC), so v² = 4kTR·(π/2)/(2πRC) = kT/C. R cancels! Any capacitor sampled through any resistor or switch holds noise √(kT/C): 64 µV for 1 pF, 20 µV for 10 pF at 300 K. Every sampled-data circuit (ADC, switched-capacitor filter) sizes its capacitors from this: one more bit of resolution costs 4× the capacitance.",
    steps: [
      { k: "learn", title: "Shaping noise with a filter", b: [
        `<div class="eq">S_out(f) = |H(f)|²·S_in(f)</div>`,
        `<p>Squared, because S is a power density. For white input, the total output noise is S times the area under |H|²: that area, divided by the passband gain², is the <b>equivalent noise bandwidth</b> (ENBW).</p>`,
        tbl(["Filter", "ENBW"], [["Ideal brick wall at f_c", "f_c"], ["First-order (RC)", "(π/2)·f_c ≈ 1.57 f_c"], ["Second-order Butterworth", "≈ 1.11 f_c"]]),
      ]},
      { k: "math", title: "kT/C: the resistor disappears", b: [
        steps([["Resistor noise density", "S = 4kTR"], ["RC low-pass corner", "f_c = 1/(2πRC)"], ["Total = S × ENBW", "4kTR × (π/2) × 1/(2πRC)"], ["Simplify", "kT/C"]]),
        `<div class="eq">v_n,rms = √(kT/C)</div>`,
        `<p><b>Why R cancels:</b> a bigger R makes more noise per hertz but also a narrower bandwidth, exactly compensating. Physically, it's equipartition: the capacitor stores on average ½kT of thermal energy, and ½Cv² = ½kT.</p>`,
      ]},
      { k: "play", title: "Try to beat kT/C", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let lR = 3, lC = -12;
          function draw() {
            const R = 10 ** lR, C = 10 ** lC, T = 300, S = 4 * kB * T * R, fc = 1 / (2 * Math.PI * R * C);
            const lfc = Math.log10(fc), dens = (lf) => Math.log10(Math.sqrt(S / (1 + (10 ** lf / fc) ** 2)) * 1e9);
            f.innerHTML = plot({ x: [2, 12], y: [-2, 3], xt: [2, 4, 6, 8, 10, 12], xtf: (v) => "10" + sup(v), yt: [-2, -1, 0, 1, 2, 3], ytf: (v) => "10" + sup(v), xl: "f (Hz)", yl: "nV/√Hz", h: 220, areas: [{ f: dens, base: -2, cls: "ar1", n: 300 }], series: [{ f: dens, cls: "s1", n: 300 }], marks: [{ x: lfc, y: dens(lfc), cls: "mkb", r: 5 }], label: "Noise density on the capacitor for the chosen R and C" });
            ro.innerHTML = readout([["Density 4kTR", fmt(Math.sqrt(S) * 1e9, 3) + " nV/√Hz"], ["Corner f_c", si(fc, "Hz", 3)], ["Total noise", si(Math.sqrt(S * (Math.PI / 2) * fc), "V", 3) + " rms"], ["√(kT/C)", si(Math.sqrt((kB * T) / C), "V", 3) + " rms"]]);
          }
          host.append(f, slider({ id: id + "-r", label: "R", min: 1, max: 7, step: 0.1, value: lR, show: (v) => si(10 ** v, "Ω", 3) }, (v) => { lR = v; draw(); }).el,
            slider({ id: id + "-c", label: "C", min: -14, max: -10, step: 0.1, value: lC, show: (v) => si(10 ** v, "F", 3) }, (v) => { lC = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Slide R across six decades: the density rises, the corner falls, and the total doesn't move. Only C changes it. That's the single most important noise fact in mixed-signal design.</p>`,
      ]},
      { k: "math", title: "Sizing an ADC's sampling capacitor", b: [
        `<p>12-bit ADC, 1 V full scale: quantization noise LSB/√12 = 70.5 µV (Module 32). Keep kT/C no bigger:</p>`,
        { t: "reveal", label: "Solve for C", html: `<div class="eq">C = kT/v² = 4.14×10⁻²¹/(70.5 µV)² ≈ 0.83 pF</div><p>For 14 bits the LSB is 4× smaller, so C must be 16× larger: about 13 pF. Bigger C means more drive current and power to charge it in time. Every extra bit of a sampled-data converter costs about 4× in capacitance and power.</p>` },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "√(kT/C) for C = 100 fF at 300 K (µV)?", a: 203, tol: 0.02, why: "√(4.14×10⁻²¹/10⁻¹³) = 203 µV." },
        { t: "num", q: "First-order filter with f_3dB = 10 kHz. Noise bandwidth (kHz)?", a: 15.7, tol: 0.01, why: "(π/2) × 10 kHz = 15.7 kHz." },
        { t: "mcq", q: "You double the switch resistance in a sample-and-hold. The sampled kT/C noise…", opts: [["Stays the same", true, "R cancels: twice the density, half the bandwidth."], ["Rises by √2", false, "That ignores the narrower bandwidth."], ["Halves", false, "Only C sets it."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain why the noise on a capacitor charged through a resistor doesn't depend on the resistor's value.", model: "A larger resistor has a larger thermal noise density, four k T R, but together with the capacitor it also forms a lower-bandwidth filter, with corner one over two pi R C. The total noise is density times noise bandwidth, and the R in each cancels, leaving k T over C. Physically, the capacitor holds an average thermal energy of half k T whatever charged it." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "Input-referred noise and the first stage", mins: 25,
    blurb: "Refer every noise source to the input by dividing by the gain in front of it. The first stage dominates, so it must be quiet and have gain.",
    takeaway: "To compare noise sources, refer them all to the input: divide each by the gain between the input and that point, then add in power. In a chain, stage 2's noise is divided by stage 1's gain, stage 3's by G₁G₂, and so on, so v_in,total² = v₁² + v₂²/G₁² + v₃²/(G₁G₂)² + … (the same idea as Friis's formula for noise factor). Hence: the first stage sets the noise, and it should have enough gain to swamp everything after it. SNR = signal power/total noise power; for RF the noise figure NF = 10 log(SNR_in/SNR_out) measures how much a block degrades SNR.",
    steps: [
      { k: "learn", title: "Referring noise to the input", b: [
        `<p>A noise v<sub>2</sub> appearing after a gain G₁ looks, from the input, like a source of v<sub>2</sub>/G₁ (it produces the same output). So everything can be compared at one place:</p>`,
        `<div class="eq">v_in,total² = v₁² + (v₂/G₁)² + (v₃/G₁G₂)² + …</div>`,
      ]},
      { k: "play", title: "A two-stage chain", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let G1 = 10, v1 = 2, v2 = 10;
          function draw() {
            const t1 = v1 * v1, t2 = (v2 / G1) ** 2, tot = Math.sqrt(t1 + t2);
            const pts = [[0.6, 0], [0.6, t1], [1.4, t1], [1.4, 0], [1.6, 0], [1.6, t2], [2.4, t2], [2.4, 0]];
            f.innerHTML = plot({ x: [0.3, 2.7], y: [0, Math.max(t1, t2) * 1.2 + 0.1], xt: [1, 2], xtf: (v) => (v === 1 ? "stage 1" : "stage 2 ÷ G₁"), yt: [], xl: "contribution to input noise power", h: 170, series: [{ pts, cls: "s2" }], label: "Bars: noise power contributed by each stage, referred to the input" });
            ro.innerHTML = readout([["Stage 1 (at input)", fmt(v1, 3) + " nV/√Hz"], ["Stage 2 referred: v₂/G₁", fmt(v2 / G1, 3) + " nV/√Hz"], ["Total input-referred", fmt(tot, 3) + " nV/√Hz"], ["Penalty from stage 2", "+" + fmt(100 * (tot / v1 - 1), 3) + "%"]]);
          }
          host.append(f, slider({ id: id + "-g", label: "Stage 1 gain G₁", min: 1, max: 100, log: true, value: G1, show: (v) => fmt(v, 3) }, (v) => { G1 = v; draw(); }).el,
            slider({ id: id + "-1", label: "Stage 1 noise", min: 0.5, max: 10, step: 0.1, value: v1, show: (v) => fmt(v, 3) + " nV/√Hz" }, (v) => { v1 = v; draw(); }).el,
            slider({ id: id + "-2", label: "Stage 2 noise", min: 1, max: 50, step: 0.5, value: v2, show: (v) => fmt(v, 3) + " nV/√Hz" }, (v) => { v2 = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">With G₁ = 10, a noisy 10 nV/√Hz second stage only adds 1 nV/√Hz at the input, which in power is a 12% penalty on a 2 nV/√Hz first stage. Drop G₁ to 2 and stage 2 dominates. The rule: put a low-noise stage with real gain first.</p>`,
      ]},
      { k: "learn", title: "SNR and noise figure", b: [
        `<div class="eq">SNR = P_signal / P_noise   (dB: 10 log of the ratio)</div>`,
        `<p>In radio work, a block's <b>noise factor</b> F = SNR<sub>in</sub>/SNR<sub>out</sub> ≥ 1, and the noise figure NF = 10 log F. A perfect noiseless block has NF = 0 dB. Cascade (Friis): F = F₁ + (F₂ − 1)/G₁ + (F₃ − 1)/(G₁G₂) + …: the same first-stage-dominates idea.</p>`,
        `<div class="key"><b>Where to spend.</b> In a receiver, the low-noise amplifier (LNA) gets the noise budget; in a sensor interface, the input pair gets big g<sub>m</sub> (current) and big area (for 1/f, Part 3). Later stages can be cheap.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Stage 1: 3 nV/√Hz, gain 5. Stage 2: 20 nV/√Hz. Total input-referred (nV/√Hz)?", a: 5, tol: 0.01, why: "√(9 + (20/5)²) = √(9 + 16) = 5 nV/√Hz." },
        { t: "num", q: "Friis: F₁ = 2 (3 dB), G₁ = 10, F₂ = 11 (10.4 dB). Total F?", a: 3, why: "2 + (11 − 1)/10 = 3 (4.8 dB)." },
        { t: "mcq", q: "To lower a two-stage amplifier's input noise, which change is usually most effective?", opts: [["Lower the first stage's noise and raise its gain", true, "Stage 1 adds directly; stage 2 is divided by G₁."], ["Lower the second stage's noise", false, "Only helps if G₁ is small."], ["Add a third stage", false, "That adds noise (a little) and doesn't remove any."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the first stage of an amplifier chain matter most for noise?", model: "Noise added by later stages is amplified less than the signal, because the signal has already been boosted by the first stage's gain. Referred to the input, each later stage's noise is divided by all the gain in front of it. So the first stage's own noise adds directly, and if it has enough gain, everything after it hardly matters." },
      ]},
    ],
  };

  const p6 = {
    id: "p6", title: "Master it", mins: 30,
    blurb: "Densities, sources, kT/C and noise budgets.",
    takeaway: "You can add noise sources, use spectral densities, compute thermal, shot, channel and flicker noise, apply noise bandwidth and kT/C, size capacitors, and refer noise to the input.",
    steps: [
      { k: "check", title: "Problem 1: a sensor front end", b: [
        `<p>A sensor's 50 kΩ source resistance feeds an amplifier with 5 nV/√Hz input noise. Bandwidth 10 kHz (white, brick-wall), 300 K.</p>`,
        { t: "num", q: "Total input-referred noise (µV rms)?", a: 2.92, tol: 0.03, hint: "50 kΩ gives 4.07 × √50 nV/√Hz. Add in power, then × √(10⁴).", why: "Resistor 28.8 nV/√Hz; total √(28.8² + 5²) = 29.2 nV/√Hz; × 100 = 2.92 µV. (The resistor dominates: a quieter amplifier wouldn't help.)" },
      ]},
      { k: "check", title: "Problem 2: shot noise", b: [
        { t: "num", q: "A photodiode carries 10 µA. Shot noise current over 1 MHz (nA rms)?", a: 1.79, tol: 0.02, why: "√(2qI·B) = √(2 × 1.6×10⁻¹⁹ × 10⁻⁵ × 10⁶) = 1.79 nA." },
      ]},
      { k: "check", title: "Problem 3: sampling capacitor", b: [
        { t: "num", q: "A 10-bit ADC with 2 V full scale. C so that kT/C equals the quantization noise (fF)?", a: 13, tol: 0.05, hint: "LSB = 2/1024; quantization noise = LSB/√12.", why: "LSB = 1.95 mV; /√12 = 564 µV; C = 4.14×10⁻²¹/(564 µV)² = 1.3×10⁻¹⁴ F = 13 fF. Practical designs use several times more, so kT/C stays well below quantization noise." },
      ]},
      { k: "check", title: "Problem 4: 1/f integration", b: [
        { t: "num", q: "Pure 1/f noise, 100 nV/√Hz at 1 Hz. rms from 0.1 Hz to 10 Hz (nV)?", a: 215, tol: 0.02, hint: "S = (100 nV)²·(1 Hz/f). ∫ from 0.1 to 10 of 1/f df = ln 100.", why: "√(10⁴ nV² × ln 100) = 100 × √4.605 = 215 nV rms." },
      ]},
      { k: "check", title: "Problem 5: design choice", b: [
        { t: "mcq", q: "A MOSFET input stage's thermal noise is too high. Which change helps most directly?", opts: [["Increase g_m (more bias current, or a wider device)", true, "Input-referred density 4kTγ/g_m falls as g_m rises."], ["Use a longer channel at the same current", false, "That usually lowers g_m: worse thermal noise (it helps 1/f, though)."], ["Add a capacitor at the output", false, "That narrows bandwidth for everything, but doesn't change the input density."]] },
      ]},
      { k: "say", title: "Problem 6: explain it", b: [
        { t: "say", q: "A designer wants a 16-bit switched-capacitor ADC to use tiny 50 fF capacitors to save area. Explain the problem using kT/C.", model: "Sampling onto a capacitor freezes thermal noise of root k T over C, independent of the switch resistance. For 50 femtofarads that's about 290 microvolts rms, far bigger than a 16-bit converter's quantization noise of a few microvolts on a volt-scale full range. To keep kT/C below the quantization noise the capacitors must be on the order of tens of picofarads, and each extra bit needs about four times more capacitance." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m36", eyebrow: "Math Toolkit · Module 36", title: "Random Signals and Noise",
    intro: `<p>Six parts: noise as a random signal, spectral density, the physical noise sources, filtering and kT/C, input-referred noise and SNR, and mastery problems.</p><p>Why a chip designer needs this: noise sets the floor under every analog and mixed-signal chip, and it's paid for in power and area.</p><p class="aside">Before this: Modules 31 (spectra) and 34–35 (probability). Pairs with Boylestad Chapters 9–10.</p>`,
    after: `<p>Next: Module 37 starts the feedback track: how loops trade gain for accuracy, linearity and bandwidth.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <p><b>Adding:</b> independent noises add in power: v = √(Σvᵢ²). SNR(dB) = 20 log(V_sig/V_n). Peak-to-peak ≈ 6 × rms.</p>
      <p><b>Density:</b> S (V²/Hz); √S (V/√Hz). v_rms = √∫S df; white over B: density × √B.</p>
      <p><b>Sources:</b> thermal 4kTR (1 kΩ → 4.07 nV/√Hz); shot 2qI (1 mA → 17.9 pA/√Hz); MOSFET 4kTγg_m, input 4kTγ/g_m; flicker K/f, corner f_c, integrated ∝ ln(f₂/f₁).</p>
      <div class="eq">S_out = |H|²S_in   ENBW(1st order) = (π/2)f_c   v² = kT/C</div>
      <p>kT/C: 1 pF → 64 µV; 100 fF → 203 µV. +1 bit → 4× C.</p>
      <p><b>Input-referred:</b> v² = v₁² + (v₂/G₁)² + …; first stage dominates. Friis F = F₁ + (F₂ − 1)/G₁ + …; NF = 10 log F.</p>`,
  };
  Course.start(window.CHAPTER);
})();
