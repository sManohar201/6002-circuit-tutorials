(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;

  // Source driving one element: kind "IC" | "VC" | "VL" | "IL"
  function srcFig(kind, o = {}) {
    const isI = kind[0] === "I", isC = kind[1] === "C";
    let s = S.wire([70, isI ? 82 : 82], [70, 30], [220, 30]) + S.wire([70, 118], [70, 170], [220, 170]);
    s += isI ? S.isrc(70, 100, o.src || "I(t)") : S.vsrc(70, 100, o.src || "V(t)");
    s += isC ? S.cap(220, 30, 220, 170, o.el || "C", {}) : S.ind(220, 30, 220, 170, o.el || "L", {});
    s += S.t(300, 60, "+", { cls: "big" }) + S.t(300, 160, "−", { cls: "big" }) + S.t(306, 110, "v", { a: "start", cls: "a" }) + S.arrow(130, 44, 170, 44, "i", { ly: 64 });
    return S.svg(340, 195, s, { max: 340, label: (isI ? "Current" : "Voltage") + " source driving " + (isC ? "a capacitor" : "an inductor") });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "When time starts to matter", mins: 15,
    blurb: "Real circuits respond late. Charge and flux are why.",
    takeaway: "Wires really store charge (electric field) and link flux (magnetic field). We model these with lumped capacitors and inductors, so the lumped abstraction survives and time enters the picture.",
    steps: [
      { k: "learn", title: "Inverters aren't instant", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`);
          const sq = (t) => (Math.floor(t) % 2 === 0 ? 5 : 0);
          const real = (t) => { const k = Math.floor(t), tt = t - k, start = k % 2 === 0 ? 5 : 0, end = 5 - start; return end + (start - end) * Math.exp(-tt / 0.15); };
          f.innerHTML = plot({ x: [0, 4], y: [-0.3, 5.5], xt: [0, 1, 2, 3, 4], yt: [0, 5], xl: "time", yl: "v_O (V)", series: [{ f: (t) => 5 - sq(t), cls: "s5", n: 800 }, { f: real, cls: "s1", n: 800 }], label: "Ideal and real inverter outputs" });
          host.append(f);
        },
        `<p>Grey dashed: what our models so far predict for an inverter's output. Orange: what you actually measure. The edges are rounded and late.</p>`,
        `<p>Until now every circuit answered <b>instantly</b>. This chapter adds the two elements that make circuits take time: <b>capacitors</b> and <b>inductors</b>.</p>`,
      ]},
      { k: "learn", title: "Where it comes from", b: [
        `<div class="two"><div class="tile"><h3>Charge → capacitor</h3><p>A wire at some voltage relative to its surroundings holds charge q, with an electric field between it and its image.</p></div><div class="tile"><h3>Flux → inductor</h3><p>Current flowing around a wiring loop creates a magnetic field. The loop links that flux.</p></div></div>`,
        `<p>The lumped matter discipline said wires store no charge and link no flux. To keep the abstraction, we add <b>lumped</b> C and L elements that hold the charge and flux <b>inside</b> themselves. The wires stay ideal.</p>`,
      ]},
      { k: "why", title: "Only a nuisance?", b: [
        { t: "mcq", q: "Are capacitors and inductors just unwanted parasitics?", opts: [["No. They're also used on purpose: memories, filters, samplers, power converters", true, "Parasitic capacitance slows a chip down, but every DRAM bit is a deliberately built capacitor."], ["Yes, engineers always try to remove them", false, "Many circuits are built around them."], ["Only inductors are useful", false, "Both are widely used."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do we keep the lumped abstraction when real wires store charge and link flux?", model: "We make a modeling compromise: keep the wires ideal, and add explicit lumped capacitors and inductors that contain the charge and the flux. Each new element holds equal and opposite charge or keeps its flux inside, so it satisfies the lumped matter discipline." },
      ]},
    ],
  };

  /* =============== PART 2 (math) =============== */
  const p2 = {
    id: "p2", title: "Math boost: rates and accumulation", mins: 20,
    blurb: "d/dt means 'how fast'. ∫ dt means 'how much has piled up'.",
    takeaway: "A derivative d/dt is a rate (slope in time). An integral ∫ dt is the accumulated total (area under the curve). They undo each other: current is the rate of charge, charge is the accumulated current.",
    steps: [
      { k: "math", title: "The water tank", b: [
        `<div class="two"><div class="tile"><h3>Flow rate</h3><p>Liters per second into a tank. That's like <b>current</b> (coulombs per second).</p></div><div class="tile"><h3>Water level</h3><p>Total liters so far. That's like <b>charge</b>.</p></div></div>`,
        `<div class="eq">i = dq/dt   ⟺   q(t) = q(t₁) + ∫<sub>t₁</sub><sup>t</sup> i dt</div>`,
        `<p>"Rate" ↔ "running total". Knowing the level at t₁, you only need the flow <b>after</b> t₁ to know the level later.</p>`,
      ]},
      { k: "play", title: "Fill the tank", b: [
        (host, id) => {
          const f1 = el(`<div class="fig"></div>`), f2 = el(`<div class="fig"></div>`);
          let shape = 0, amp = 2;
          const shapes = [
            (t) => (t >= 1 ? amp : 0),
            (t) => (t >= 1 && t < 3 ? amp : 0),
            (t) => (t >= 1 && t < 3 ? amp : t >= 3 && t < 4 ? -amp : 0),
            (t) => Math.max(0, amp * (t - 1) / 3),
          ];
          function draw() {
            const i = shapes[shape];
            const q = (t) => { let s = 0, n = 400; for (let k = 0; k < n; k++) s += i((t * (k + 0.5)) / n) * (t / n); return s; };
            f1.innerHTML = plot({ x: [0, 5], y: [-3, 3], xt: [0, 1, 2, 3, 4, 5], yt: [-2, 0, 2], xl: "t (s)", yl: "i (mA)", h: 170, areas: [{ f: i, cls: "ar2", n: 400 }], series: [{ f: i, cls: "s2", n: 800 }], label: "Current" });
            f2.innerHTML = plot({ x: [0, 5], y: [-1, 13], xt: [0, 1, 2, 3, 4, 5], yt: [0, 4, 8, 12], xl: "t (s)", yl: "q (mC)", h: 170, series: [{ f: q, cls: "s1", n: 120 }], label: "Accumulated charge" });
          }
          host.append(toggle(["Switch on", "Pulse", "Pulse, then reverse", "Ramp"], (k) => { shape = k; draw(); }), f1, f2, slider({ id: id + "-a", label: "Current size", min: 0.5, max: 3, step: 0.5, value: amp, show: (x) => fmt(x) + " mA" }, (x) => { amp = x; draw(); }).el);
          draw();
        },
        `<p class="aside">Bottom graph = shaded area of the top graph so far. Notice it never jumps, even when the current jumps.</p>`,
      ]},
      { k: "check", title: "Read the areas", b: [
        { t: "num", q: "2 mA flows for 2 s, then stops. Charge delivered?", a: 4, unit: "mC", hint: "Area = height × width.", why: "2 mA × 2 s = 4 mC." },
        { t: "num", q: "Then −2 mA flows for 1 s. Total charge now?", a: 2, unit: "mC", why: "4 − 2 = 2 mC. Negative current removes charge." },
        { t: "mcq", q: "Charge q(t) goes as 3t² (mC, t in s). What's the current at t = 2 s?", opts: [["12 mA", true, "i = dq/dt = 6t = 12 mA. Slope rules from Chapter 4: d(t²)/dt = 2t."], ["12 mC", false, "Charge per second is current, in mA."], ["6 mA", false, "6t at t = 2 is 12."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't a running total jump suddenly if the rate stays finite?", model: "A total only changes by the rate times the time that passes. In zero time, with a finite rate, the change is zero. To jump instantly you'd need an infinite rate." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "The capacitor", mins: 25,
    blurb: "q = C·v, so i = C·dv/dt. Its voltage remembers.",
    takeaway: "Capacitor: q = Cv and i = C·dv/dt. Its voltage is the accumulated current divided by C, so it holds its value when the current stops (memory, state). It stores energy ½Cv², and returns it.",
    steps: [
      { k: "learn", title: "Two plates", b: [
        fig(S.svg(360, 170, `<rect x="120" y="40" width="120" height="10" style="fill:var(--accent)"/><rect x="120" y="110" width="120" height="10" style="fill:var(--cool)"/>` + S.wire([180, 40], [180, 10]) + S.wire([180, 120], [180, 160]) + S.t(250, 50, "+q", { a: "start", cls: "a" }) + S.t(250, 120, "−q", { a: "start", cls: "c" }) + [140, 165, 195, 220].map((x) => S.arrow(x, 56, x, 104, "")).join("") + S.t(110, 85, "gap l", { a: "end", cls: "s m" }) + S.t(180, 30, "area A", { cls: "s m", a: "start" }), { max: 360, label: "Parallel-plate capacitor with charges and field" })),
        `<div class="eq">C = εA/l   q = C·v</div>`,
        `<p>Current in at the top delivers +q; an equal current out at the bottom removes charge, leaving −q. No <b>net</b> charge inside: lumped-matter-friendly. Unit: farad (F) = C/V.</p>`,
      ]},
      { k: "learn", title: "The element law", b: [
        `<div class="key">i = C·dv/dt</div>`,
        `<p>Not algebraic like a resistor: current depends on how <b>fast</b> the voltage changes. Constant voltage → zero current (a capacitor blocks steady DC).</p>`,
        fig(S.svg(160, 120, S.cap(80, 10, 80, 110, "C") + S.t(108, 30, "+", { cls: "big" }) + S.t(108, 104, "−", { cls: "big" }), { max: 160, label: "Capacitor symbol" })),
      ]},
      { k: "play", title: "Charge it, then let go", b: [
        fig(srcFig("IC", { src: "I", el: "1 µF" })),
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let I = 2, T = 2, leak = 0;
          function draw() {
            const C = 1, slope = I / C;
            const v = (t) => (t < 0 ? 0 : t < T ? slope * t : leak ? slope * T * Math.exp(-(t - T) / 3) : slope * T);
            f.innerHTML = plot({ x: [0, 8], y: [0, 13], xt: [0, 2, 4, 6, 8], yt: [0, 4, 8, 12], xl: "t (ms)", yl: "v (V)", series: [{ f: v, cls: "s1", n: 400 }], label: "Capacitor voltage" });
            ro.innerHTML = readout([["slope I/C", fmt(slope) + " V/ms"], ["final v", fmt(slope * T) + " V"], ["charge", fmt(I * T) + " µC"], ["energy ½Cv²", fmt(0.5 * (slope * T) ** 2) + " µJ"]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(slider({ id: id + "-i", label: "Current I", min: 0.5, max: 3, step: 0.5, value: I, show: (x) => fmt(x) + " mA" }, (x) => { I = x; draw(); }).el,
            slider({ id: id + "-t", label: "On for", min: 0.5, max: 4, step: 0.5, value: T, show: (x) => fmt(x) + " ms" }, (x) => { T = x; draw(); }).el);
          host.append(toggle(["Ideal capacitor", "Leaky capacitor"], (k) => { leak = k; draw(); }), f, box, ro);
          draw();
        },
        `<p class="aside">When the current stops, the voltage <b>stays</b>. The capacitor remembers. A leaky one slowly forgets (model the leak as a resistor in parallel).</p>`,
      ]},
      { k: "learn", title: "Memory and state", b: [
        `<div class="eq">v(t) = v(t₁) + (1/C)∫<sub>t₁</sub><sup>t</sup> i dt</div>`,
        `<p>v(t₁) sums up the entire past. That's why the capacitor's voltage (or charge) is called its <b>state</b>. Every bit in a DRAM chip is a tiny capacitor holding a voltage.</p>`,
        `<div class="eq">stored energy w<sub>E</sub> = ½Cv² = q²/2C</div>`,
        `<p>Unlike a resistor, it doesn't burn the energy. It stores it and can give it back.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>Plates 0.5 m², gap 2 µm, dielectric with ε = 3ε₀ (ε₀ ≈ 8.854 × 10⁻¹² F/m).</p>`,
        { t: "num", q: "C = ?", a: 6.64, tol: 0.02, unit: "µF", hint: "3 × 8.854e-12 × 0.5 / 2e-6.", why: "≈ 6.64 µF." },
        { t: "num", q: "Charged to 50 V. Stored energy = ?", a: 8.3, tol: 0.02, unit: "mJ", hint: "½ × 6.64 µF × 2500.", why: "≈ 8.3 mJ." },
        { t: "num", q: "A 10 µF capacitor's voltage rises at 2 V/ms. Current?", a: 20, unit: "mA", hint: "C·dv/dt = 10e-6 × 2000 V/s.", why: "20 mA." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a capacitor have 'memory' but a resistor doesn't?", model: "A resistor's voltage depends only on its current right now. A capacitor's voltage depends on all the charge that has ever flowed into it, the accumulated current. When the current stops, that accumulated charge stays, so the voltage stays." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "The inductor", mins: 20,
    blurb: "λ = L·i, so v = L·di/dt. The dual of the capacitor.",
    takeaway: "Inductor: flux linkage λ = Li and v = L·di/dt. Its current is the accumulated voltage divided by L (memory, state). Energy ½Li². It's the capacitor's dual: swap v↔i and C↔L.",
    steps: [
      { k: "learn", title: "A coil", b: [
        fig(S.svg(200, 120, S.ind(20, 60, 180, 60, "L", {}), { max: 200, label: "Inductor symbol" })),
        `<div class="eq">L = μN²A/l   λ = L·i   v = L·di/dt</div>`,
        `<p>N turns around a core of cross-section A and length l. Unit: henry (H) = Wb/A. The flux stays inside the core, so it's lumped-friendly.</p>`,
      ]},
      { k: "learn", title: "Mirror images", b: [
        `<div class="tbl"><table><thead><tr><th></th><th>Capacitor</th><th>Inductor</th></tr></thead><tbody>
          <tr><td>stores</td><td>charge q = Cv</td><td>flux linkage λ = Li</td></tr>
          <tr><td>law</td><td class="mono">i = C dv/dt</td><td class="mono">v = L di/dt</td></tr>
          <tr><td>state</td><td>v (can't jump)</td><td>i (can't jump)</td></tr>
          <tr><td>energy</td><td class="mono">½Cv²</td><td class="mono">½Li²</td></tr>
          <tr><td>DC steady state</td><td>open circuit (i = 0)</td><td>short circuit (v = 0)</td></tr></tbody></table></div>`,
        `<p>Swap v ↔ i and C ↔ L and one turns into the other: they're <b>duals</b>.</p>`,
      ]},
      { k: "play", title: "Step the voltage", b: [
        fig(srcFig("VL", { src: "V", el: "L" })),
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let V = 2, L = 20;
          function draw() {
            const i = (t) => (t < 1 ? 0 : (V / L) * (t - 1) * 1000); // t in ms → mA
            f.innerHTML = plot({ x: [0, 6], y: [0, 600], xt: [0, 1, 2, 3, 4, 5, 6], yt: [0, 200, 400, 600], xl: "t (ms)", yl: "i (mA)", series: [{ f: i, cls: "s1" }], label: "Inductor current after a voltage step at t = 1 ms" });
            ro.innerHTML = readout([["di/dt = V/L", fmt(V / L) + " A/s"], ["after 5 ms", fmt(i(6)) + " mA"]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(slider({ id: id + "-v", label: "Step V", min: 0.5, max: 3, step: 0.5, value: V, show: (x) => fmt(x) + " V" }, (x) => { V = x; draw(); }).el,
            slider({ id: id + "-l", label: "L", min: 10, max: 100, step: 10, value: L, show: (x) => fmt(x) + " mH" }, (x) => { L = x; draw(); }).el);
          host.append(f, box, ro);
          draw();
        },
        `<p class="aside">Constant voltage → current ramps steadily (the dual of current-charging a capacitor).</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>200 turns on an air core (μ₀ = 4π × 10⁻⁷ H/m), A = 2 cm², l = 10 cm.</p>`,
        { t: "num", q: "L = ?", a: 100.5, tol: 0.02, unit: "µH", hint: "μ₀N²A/l = 4π×10⁻⁷ × 40000 × 2×10⁻⁴ / 0.1.", why: "≈ 100 µH." },
        { t: "num", q: "A relay coil (L = 20 mH) must reach 5 mA in 50 µs. Constant voltage needed?", a: 2, unit: "V", hint: "di/dt = 5 mA/50 µs = 100 A/s. v = L·di/dt.", why: "0.02 × 100 = 2 V." },
      ]},
      { k: "why", title: "Poor memory", b: [
        { t: "mcq", q: "Charge a good capacitor and it holds its voltage for hours. Set up a current in a real coil and short it: the current dies in a fraction of a second. Why?", opts: [["Real coils have significant wire resistance, which quickly burns the stored magnetic energy", true, "Model it as a resistor in series with an ideal inductor. Capacitor leakage can be made tiny; coil resistance usually can't."], ["Inductors don't store energy", false, "They store ½Li²."], ["Current can't flow in a shorted coil", false, "It does flow, and that's what dissipates the energy in the coil's resistance."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does 'v = L·di/dt' predict if you try to change an inductor's current instantly?", model: "An instant change means an infinite rate di/dt, so it would need an infinite voltage. In practice the current changes smoothly, and trying to break it suddenly produces a big voltage spike." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Series and parallel", mins: 15,
    blurb: "Capacitors combine like conductances; inductors like resistors.",
    takeaway: "Capacitors: parallel add, series combine like resistors in parallel. Inductors: series add, parallel combine like resistors in parallel.",
    steps: [
      { k: "learn", title: "The rules", b: [
        `<div class="tbl"><table><thead><tr><th></th><th>series</th><th>parallel</th></tr></thead><tbody>
          <tr><td>capacitors</td><td class="mono">1/C = 1/C₁ + 1/C₂</td><td class="mono">C = C₁ + C₂</td></tr>
          <tr><td>inductors</td><td class="mono">L = L₁ + L₂</td><td class="mono">1/L = 1/L₁ + 1/L₂</td></tr></tbody></table></div>`,
        { t: "mcq", q: "Why do parallel capacitors add?", opts: [["Parallel plates side by side = one capacitor with a bigger area, and C grows with A", true, "Series capacitors are like a wider gap, which lowers C."], ["Because they're like resistors", false, "Capacitors are the opposite of resistors here."], ["They don't, they subtract", false, "They add."]] },
      ]},
      { k: "check", title: "Combine", b: [
        { t: "num", q: "Two 2 µF capacitors in series?", a: 1, unit: "µF", why: "2·2/(2 + 2) = 1 µF." },
        { t: "num", q: "Three 2 µF in parallel?", a: 6, unit: "µF", why: "2 + 2 + 2 = 6 µF." },
        { t: "num", q: "(2 µF ∥ 2 µF) in series with 2 µF?", a: 1.333, tol: 0.02, unit: "µF", hint: "4 µF in series with 2 µF.", why: "4·2/6 ≈ 1.33 µF." },
        { t: "num", q: "A 3 mH and a 6 mH inductor in parallel?", a: 2, unit: "mH", why: "3·6/9 = 2 mH." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you remember which way the capacitor rules go?", model: "Think of C = εA/l. Parallel capacitors add plate area, so their capacitances add. Series capacitors are like stretching the gap, so the total drops, combining like resistors in parallel. Inductors are the reverse: series coils add like resistors in series." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Real-world C and L: MOSFETs, wires, transformers", mins: 20,
    blurb: "The gate is a capacitor. Wires have C and L. Transformers trade volts for amps.",
    takeaway: "A MOSFET's gate forms C_GS = C_OX·W·L; charging it takes time, which is why inverters lag. Wires have capacitance and inductance per length. An ideal transformer: v₁/N₁ = v₂/N₂ and N₁i₁ = −N₂i₂, with power in = power out.",
    steps: [
      { k: "learn", title: "The gate is a capacitor", b: [
        `<p>To turn on a MOSFET, charge flows onto the gate and an equal opposite charge gathers in the channel, with the thin oxide between: a parallel-plate capacitor.</p>`,
        `<div class="eq">C<sub>GS</sub> = C<sub>OX</sub>·W·L   (C<sub>OX</sub> = ε<sub>OX</sub>/d)</div>`,
        `<p>The <b>SRC model</b> = SR model + C<sub>GS</sub> from gate to source. Now the gate draws current while its voltage is changing: i<sub>G</sub> = C<sub>GS</sub>·dv<sub>GS</sub>/dt.</p>`,
      ]},
      { k: "check", title: "Gate numbers", b: [
        { t: "num", q: "C_OX = 5 fF/µm², W = 4 µm, L = 1 µm. C_GS = ?", a: 20, unit: "fF", why: "5 × 4 = 20 fF." },
        { t: "num", q: "A gate with C_GS = 100 fF must go from 0 to 3 V in 5 ns with constant current. Current?", a: 60, unit: "µA", hint: "Charge = CV = 300 fC, delivered in 5 ns.", why: "300 fC / 5 ns = 60 µA. That's why gates take time to switch: the previous stage can only supply limited current." },
      ]},
      { k: "learn", title: "Wires", b: [
        `<p>A chip wire of width W at height G over the substrate has, per unit length, C̃ ≈ εW/G and L̃ ≈ μG/W. Notice C̃·L̃ = με: make one smaller and the other grows.</p>`,
        `<p>A wiring loop of radius R (wire radius A) has L ≈ μR(ln(8R/A) − 2): a few nH for a small loop.</p>`,
      ]},
      { k: "learn", title: "The ideal transformer", b: [
        `<p>Two coils on one core, N₁ and N₂ turns, sharing the same flux:</p>`,
        `<div class="eq">v₁/N₁ = v₂/N₂   N₁i₁ = −N₂i₂   ⇒  v₁i₁ = −v₂i₂</div>`,
        `<p>Power in one port comes straight out the other. It changes voltage, but gives no power gain (so it isn't an amplifier, as Chapter 7 said).</p>`,
        { t: "num", q: "Mains: 230 V rms (peak ≈ 325 V). Turns ratio N₁/N₂ for a 12 V peak secondary?", a: 27, tol: 0.03, hint: "325/12.", why: "≈ 27." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does adding C_GS explain the delay in a chain of inverters?", model: "To switch the next inverter, its gate voltage must rise past V_T. With C_GS there, that means delivering charge through finite currents, which takes time. So each stage's input changes gradually, and the output switches late." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Steps, impulses and charge sharing", mins: 25,
    blurb: "Sources driving C and L, and what can and can't jump.",
    takeaway: "A capacitor's voltage and an inductor's current are continuous unless driven by an impulse (infinite current or voltage for zero time). Connecting charged capacitors conserves charge but loses energy.",
    steps: [
      { k: "learn", title: "Four simple circuits", b: [
        `<div class="two"><div>${srcFig("IC")}</div><div>${srcFig("VC")}</div></div>`,
        `<div class="tbl"><table><tbody>
          <tr><td>current source → C</td><td class="mono">v = (1/C)∫I dt</td><td>integrator</td></tr>
          <tr><td>voltage source → C</td><td class="mono">i = C dV/dt</td><td>differentiator</td></tr>
          <tr><td>voltage source → L</td><td class="mono">i = (1/L)∫V dt</td><td>integrator</td></tr>
          <tr><td>current source → L</td><td class="mono">v = L dI/dt</td><td>differentiator</td></tr></tbody></table></div>`,
      ]},
      { k: "learn", title: "Stepping a voltage onto a capacitor", b: [
        `<p>A voltage source jumps from 0 to V across a capacitor. i = C dV/dt, but the slope of a jump is infinite. Think of the jump as a fast ramp over time T:</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let T = 1;
          function draw() {
            f.innerHTML = plot({ x: [-0.5, 3], y: [0, 5.2], xt: [0, 1, 2, 3], yt: [0, 1, 2, 4], xl: "t", yl: "i = CV/T", series: [{ f: (t) => (t >= 0 && t < T ? 1 / T : 0), cls: "s1", n: 800 }], areas: [{ f: (t) => (t >= 0 && t < T ? 1 / T : 0), cls: "ar1", n: 800 }], label: "Current pulse during a voltage ramp" });
          }
          host.append(f, slider({ id: id + "-t", label: "Ramp time T", min: 0.2, max: 2, step: 0.1, value: T, show: (x) => fmt(x) }, (x) => { T = x; draw(); }).el);
          draw();
        },
        `<p>Shrink T: the pulse gets taller and narrower, but its <b>area</b> (the charge CV) stays fixed. In the limit it's an <b>impulse</b> CV·δ(t): infinite height, zero width, area CV.</p>`,
      ]},
      { k: "why", title: "What can't jump", b: [
        { t: "mcq", q: "Without infinite currents, which of these must be continuous in time?", opts: [["A capacitor's voltage and an inductor's current", true, "They're the states. Changing them instantly needs an impulse: infinite current for C, infinite voltage for L."], ["A capacitor's current and an inductor's voltage", false, "Those can jump freely, like the current when a source switches on."], ["Every voltage and current in the circuit", false, "Only the states are protected."]] },
        `<p class="aside">Impulses are a modeling tool: when a real pulse is so short its shape doesn't matter, replace it by an impulse with the same area.</p>`,
      ]},
      { k: "play", title: "Connect two charged capacitors", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let C1 = 2, V1 = 9, C2 = 1, V2 = 0;
          function draw() {
            const Q = C1 * V1 + C2 * V2, V = Q / (C1 + C2), E0 = 0.5 * C1 * V1 * V1 + 0.5 * C2 * V2 * V2, E1 = 0.5 * (C1 + C2) * V * V;
            ro.innerHTML = readout([["total charge (kept)", fmt(Q) + " µC"], ["final voltage", fmt(V) + " V"], ["energy before", fmt(E0) + " µJ"], ["energy after", fmt(E1) + " µJ"], ["energy lost", fmt(E0 - E1) + " µJ"]]);
          }
          const box = el(`<div class="sliders"></div>`);
          [["C1", "C₁", 0.5, 5, 0.5, "µF", (x) => (C1 = x)], ["V1", "V₁", 0, 12, 1, "V", (x) => (V1 = x)], ["C2", "C₂", 0.5, 5, 0.5, "µF", (x) => (C2 = x)], ["V2", "V₂", 0, 12, 1, "V", (x) => (V2 = x)]].forEach(([k, lab, a, b, st, u, set]) =>
            box.appendChild(slider({ id: id + k, label: lab, min: a, max: b, step: st, value: { C1, V1, C2, V2 }[k], show: (x) => fmt(x) + " " + u }, (x) => { set(x); draw(); }).el));
          host.append(el(fig(S.svg(320, 150, S.wire([60, 50], [60, 30], [130, 30]) + `<line class="w" x1="130" y1="30" x2="165" y2="15"/>` + S.wire([175, 30], [260, 30], [260, 50]) + S.cap(60, 50, 60, 130, "C₁", { side: "left" }) + S.cap(260, 50, 260, 130, "C₂") + S.wire([60, 130], [60, 140], [260, 140], [260, 130]) + S.t(152, 50, "switch", { cls: "s m" }), { max: 320, label: "Two capacitors joined by a switch" }))), box, ro);
          draw();
        },
        { t: "num", q: "C₁ = 2 µF at 9 V, C₂ = 1 µF at 0 V. Close the switch. Final voltage?", a: 6, unit: "V", hint: "Charge is conserved: 18 µC shared over 3 µF.", why: "6 V." },
        { t: "num", q: "Fraction of the energy lost?", a: 0.333, tol: 0.03, hint: "Before: ½·2·81 = 81 µJ. After: ½·3·36 = 54 µJ.", why: "27/81 = 1/3. It's lost in wire resistance, sparks, radiation. Only if the voltages start equal is nothing lost." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Two capacitors at different voltages are connected. What's conserved and what isn't?", model: "Charge is conserved, because KCL means whatever leaves one capacitor arrives at the other. Energy isn't: they end at a common voltage with less stored energy than before, and the difference is dissipated, in wire resistance, a spark or radiation, unless they started at the same voltage." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ch9", eyebrow: "Chapter 9", title: "Energy Storage Elements",
    intro: `<p>Seven parts. Time enters the picture. You'll meet the <b>capacitor</b> and <b>inductor</b>, their element laws, memory and energy, real-world examples, and what happens with steps, impulses and charge sharing.</p><p>Part 2 is a math boost on rates and accumulation (derivatives and integrals, no heavy symbols).</p><p class="aside">Arrow keys ← → move between steps. Need a refresher? <a href="08-small-signal-model.html">Chapter 8</a>.</p>`,
    after: `<p>Open the Chapter 9 PDF and go to the <b>exercises and problems</b> at the end. Keep an eye on units (F, H, C, Wb, J) and on what must stay continuous.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7],
    summary: `
      <h3>Why</h3><p>Real wires store charge and link flux. Model them with lumped C and L; keep wires ideal.</p>
      <h3>Rates and totals</h3><div class="eq">i = dq/dt · q(t) = q(t₁) + ∫ i dt</div>
      <h3>Capacitor</h3>
      <div class="eq">C = εA/l · q = Cv · i = C dv/dt · w_E = ½Cv² = q²/2C</div>
      <p>v(t) = v(t₁) + (1/C)∫i dt. State: v (or q). DC steady state: open. Leakage → parallel R.</p>
      <h3>Inductor</h3>
      <div class="eq">L = μN²A/l · λ = Li · v = L di/dt · w_M = ½Li² = λ²/2L</div>
      <p>i(t) = i(t₁) + (1/L)∫v dt. State: i (or λ). DC steady state: short. Coil resistance → series R. Dual of C (v↔i, C↔L).</p>
      <h3>Combinations</h3>
      <p>C: parallel add, series 1/C = Σ1/Cₖ. L: series add, parallel 1/L = Σ1/Lₖ.</p>
      <h3>Real examples</h3>
      <p>C<sub>GS</sub> = C<sub>OX</sub>WL (SRC model), i<sub>G</sub> = C<sub>GS</sub>dv<sub>GS</sub>/dt. Wire: C̃L̃ = με. Ideal transformer: v₁/N₁ = v₂/N₂, N₁i₁ = −N₂i₂, no energy stored.</p>
      <h3>Steps and impulses</h3>
      <p>I→C and V→L integrate; V→C and I→L differentiate. Step into a differentiator → impulse (area CV or LI). v<sub>C</sub> and i<sub>L</sub> are continuous without impulses.</p>
      <h3>Charge sharing</h3>
      <div class="eq">V = (Q₁ + Q₂)/(C₁ + C₂) · energy lost = ½·C₁C₂/(C₁ + C₂)·(V₁ − V₂)²</div>`,
  };
  Course.start(window.CHAPTER);
})();
