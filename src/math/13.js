(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const ohm = (r) => si(r, "Ω", 3);
  const Is = 1e-14, VT = 0.026;

  const p1 = {
    id: "p1", title: "Slope at a point", mins: 15,
    blurb: "Zoom into any smooth curve and it looks straight. The slope of that straight bit is the derivative.",
    takeaway: "The derivative dy/dx at a point is the slope of the tangent line there: how fast y changes per unit of x, right at that x. Estimate it from two close points: Δy/Δx. Units are y-units per x-unit: dv/dt in V/s, di/dv in A/V (a conductance). Where a curve is flat, the derivative is 0; where it falls, negative.",
    steps: [
      { k: "play", title: "Shrink the step", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let x0 = 1.5, h = 1;
          const g = (x) => x * x;
          function draw() {
            const m = (g(x0 + h) - g(x0)) / h;
            f.innerHTML = plot({ x: [0, 4], y: [0, 10], xt: [0, 1, 2, 3, 4], yt: [0, 2, 4, 6, 8, 10], xl: "x", yl: "y = x²", h: 260, series: [{ f: g, cls: "s1" }, { f: (x) => g(x0) + m * (x - x0), cls: "s4" }, { f: (x) => g(x0) + 2 * x0 * (x - x0), cls: "s3" }], marks: [{ x: x0, y: g(x0) }, { x: x0 + h, y: g(x0 + h), cls: "mk2" }], label: "Curve y = x squared, a chord (dashed) and the tangent (green)" });
            ro.innerHTML = readout([["Chord slope Δy/Δx", fmt(m, 4)], ["Tangent slope (exact, 2x)", fmt(2 * x0, 4)], ["Gap", fmt(m - 2 * x0, 3)]]);
          }
          host.append(f, slider({ id: id + "-x", label: "Point x", min: 0.5, max: 3, step: 0.1, value: x0 }, (v) => { x0 = v; draw(); }).el,
            slider({ id: id + "-h", label: "Step Δx", min: 0.01, max: 1.5, step: 0.01, value: h }, (v) => { h = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">As Δx shrinks, the dashed chord swings onto the green tangent. The tangent's slope is the derivative: for y = x² it's 2x.</p>`,
      ]},
      { k: "learn", title: "What it means in a circuit", b: [
        `<div class="tbl"><table><tr><th>Derivative</th><th>Means</th><th>Units</th></tr><tr><td>dv/dt</td><td>how fast a voltage changes</td><td>V/s</td></tr><tr><td>di/dv</td><td>extra current per extra volt: a conductance</td><td>A/V = S</td></tr><tr><td>dv/di</td><td>a resistance at that point</td><td>Ω</td></tr><tr><td>dI<sub>D</sub>/dV<sub>GS</sub></td><td>transconductance g<sub>m</sub></td><td>A/V</td></tr></table></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A voltage goes from 2.0 V to 2.6 V in 3 µs. Average dv/dt in V/µs?", a: 0.2, unit: "V/µs", why: "0.6/3 = 0.2 V/µs." },
        { t: "mcq", q: "At the peak of a sine wave, dv/dt is…", opts: [["0", true, "The curve is flat for an instant at the top."], ["Its largest value", false, "That's at the zero crossings."], ["V_m", false, "The value is V_m; the slope is 0."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In your own words, what is a derivative?", model: "It's the slope of a curve at one point: how much the output changes per unit change of the input, right there. You can picture it as the slope of the straight line that just touches the curve at that point." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "The rules circuits use", mins: 20,
    blurb: "Powers, exponentials, sines and the chain rule. That's nearly all of it.",
    takeaway: "d/dx(xⁿ) = n·xⁿ⁻¹; d/dx(e^(ax)) = a·e^(ax); d/dt sin(ωt) = ω cos(ωt); d/dt cos(ωt) = −ω sin(ωt); constants come out front; sums go term by term. Chain rule: d/dx f(g(x)) = f′(g)·g′(x), e.g. d/dV (V − V_T)² = 2(V − V_T). In circuits: i = C dv/dt, v = L di/dt. A sine's steepest slope is ωV_m (the slew rate an op amp needs).",
    steps: [
      { k: "learn", title: "The table", b: [
        `<div class="tbl"><table><tr><th>f</th><th>df/dx</th></tr><tr><td>c (constant)</td><td>0</td></tr><tr><td>x<sup>n</sup></td><td>n x<sup>n−1</sup></td></tr><tr><td>e<sup>ax</sup></td><td>a e<sup>ax</sup></td></tr><tr><td>ln x</td><td>1/x</td></tr><tr><td>sin ωt</td><td>ω cos ωt</td></tr><tr><td>cos ωt</td><td>−ω sin ωt</td></tr><tr><td>(x − a)<sup>2</sup></td><td>2(x − a)   (chain rule)</td></tr></table></div>`,
        `<p class="aside">Constants multiply through: d/dt(5 sin ωt) = 5ω cos ωt.</p>`,
      ]},
      { k: "play", title: "Current in a capacitor", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let fr = 1000;
          const C = 1e-6, Vm = 5;
          function draw() {
            const w = 2 * Math.PI * fr, Ip = C * w * Vm * 1000;
            f.innerHTML = plot({ x: [0, 2], y: [-6, 6], xt: [0, 1, 2], xtf: (v) => (v ? v + " ms" : "0"), yt: [-5, 0, 5], xl: "t", h: 220, series: [{ f: (x) => Vm * Math.sin(w * x * 1e-3), cls: "s2" }, { f: (x) => (Ip / 20) * Math.cos(w * x * 1e-3), cls: "s1" }], label: "Capacitor voltage (blue) and its current (orange), a quarter cycle ahead" });
            ro.innerHTML = readout([["v = 5 sin(ωt) V on 1 µF", "ω = " + fmt(w, 4) + " rad/s"], ["i = C dv/dt = CωV_m cos(ωt)", "peak " + fmt(Ip, 3) + " mA"]]);
          }
          host.append(f, slider({ id: id + "-f", label: "f", min: 250, max: 3000, step: 50, value: fr, show: (v) => si(v, "Hz", 3) }, (v) => { fr = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The orange current is drawn at 20 mA per grid volt. It peaks where the voltage is steepest (crossing zero), and grows with frequency. That's a capacitor's reactance 1/(ωC) appearing from a derivative.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 2 µF capacitor's voltage ramps at 5 V per ms. Current? (mA)", a: 10, unit: "mA", hint: "i = C dv/dt = 2 × 10⁻⁶ × 5000 V/s.", why: "10 mA." },
        { t: "num", q: "An op amp must output 10 V peak at 20 kHz. Minimum slew rate in V/µs?", a: 1.257, unit: "V/µs", tol: 0.01, hint: "Max slope = ωV_m.", why: "2π × 20 000 × 10 = 1.26 × 10⁶ V/s = 1.26 V/µs." },
        { t: "mcq", q: "d/dV of 0.5(V − 2)²?", opts: [["V − 2", true, "Chain rule: 0.5 × 2(V − 2) × 1."], ["0.5(V − 2)", false, "The power rule brings a 2 down."], ["(V − 2)²", false, "Derivatives lower the power by one."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a capacitor's current lead its voltage by a quarter cycle?", model: "The current is C times the derivative of the voltage, and the derivative of a sine is a cosine, which is the same wave shifted a quarter cycle earlier. So the current peaks where the voltage is changing fastest, at its zero crossings." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "The tangent line is the small-signal model", mins: 20,
    blurb: "Near the operating point, a curve is its tangent line. Its slope is r_d or g_m.",
    takeaway: "f(x₀ + Δx) ≈ f(x₀) + f′(x₀)·Δx: for small Δx the curve is its tangent. Diode: dI/dV = I_D/V_T, so r_d = V_T/I_D (26 mV/I_D: 13 Ω at 2 mA). Square law I_D = k(V_GS − V_T)²: g_m = dI_D/dV_GS = 2k(V_GS − V_T) = 2√(k·I_D). 'Holding the others fixed' (a partial derivative, ∂) is the same idea when a formula has several inputs, as in Boylestad's stability factors.",
    steps: [
      { k: "learn", title: "Linearise", b: [
        `<div class="eq">f(x<sub>0</sub> + Δx) ≈ f(x<sub>0</sub>) + f′(x<sub>0</sub>) Δx</div>`,
        `<p>Big part (the dc operating point) plus slope × small change (the signal). That's the whole idea of a small-signal model.</p>`,
      ]},
      { k: "play", title: "Tangent on a diode", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let Iq = 2, dv = 0.01;
          function draw() {
            const Vq = VT * Math.log((Iq * 1e-3) / Is), gd = Iq / VT; // mA per V
            const real = 1000 * Is * Math.exp((Vq + dv) / VT), lin = Iq + gd * dv;
            f.innerHTML = plot({ x: [0.6, 0.76], y: [0, 8], xt: [0.6, 0.64, 0.68, 0.72, 0.76], yt: [0, 2, 4, 6, 8], xl: "V_D (V)", yl: "I_D (mA)", h: 250, series: [{ f: (v) => 1000 * Is * Math.exp(v / VT), cls: "s2" }, { f: (v) => Iq + gd * (v - Vq), cls: "s1" }], marks: [{ x: Vq, y: Iq }, { x: Vq + dv, y: real, cls: "mk2" }], label: "Diode curve with its tangent at the operating point" });
            ro.innerHTML = readout([["Operating point", fmt(Vq, 4) + " V, " + fmt(Iq, 3) + " mA"], ["r_d = V_T/I_D", ohm(VT / (Iq * 1e-3))], ["Real I after +" + fmt(1000 * dv, 3) + " mV", fmt(real, 4) + " mA"], ["Tangent predicts", fmt(lin, 4) + " mA (" + fmt((100 * (lin - real)) / real, 2) + "%)"]]);
          }
          host.append(f, slider({ id: id + "-i", label: "I_D at the operating point", min: 0.5, max: 5, step: 0.1, value: Iq, show: (v) => fmt(v) + " mA" }, (v) => { Iq = v; draw(); }).el,
            slider({ id: id + "-d", label: "Signal ΔV", min: -0.03, max: 0.03, step: 0.001, value: dv, show: (v) => fmt(1000 * v, 3) + " mV" }, (v) => { dv = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">A few millivolts: the tangent is almost exact. Past about 10 mV the curve bends away. That's why "small signal" means small compared with V<sub>T</sub>.</p>`,
      ]},
      { k: "learn", title: "g_m from the square law", b: [
        `<div class="eq">I<sub>D</sub> = k(V<sub>GS</sub> − V<sub>T</sub>)²   →   g<sub>m</sub> = dI<sub>D</sub>/dV<sub>GS</sub> = 2k(V<sub>GS</sub> − V<sub>T</sub>)</div>`,
        `<p class="aside">6.002 writes the law with K/2 in place of k, so its g<sub>m</sub> = K(V<sub>GS</sub> − V<sub>T</sub>). Same derivative, different letter.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "r_d of a diode at I_D = 0.5 mA (V_T = 26 mV)?", a: 52, unit: "Ω", why: "26 mV/0.5 mA = 52 Ω." },
        { t: "num", q: "k = 0.4 mA/V², V_T = 1.5 V, biased at V_GS = 4 V. g_m in mA/V?", a: 2, unit: "mA/V", why: "2 × 0.4 × 2.5 = 2 mA/V." },
        { t: "mcq", q: "Why can the small-signal model use straight lines for curved devices?", opts: [["Over a small enough range any smooth curve is close to its tangent", true, "The error grows with the square of the signal size."], ["Because the devices are actually linear", false, "They aren't: that's why we bias them."], ["Because the books say so", false, "It's the tangent-line approximation."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Where does a diode's small-signal resistance r_d come from?", model: "It's the inverse of the slope of the diode's current curve at the operating point. The diode's current is an exponential, so its slope is the current divided by V_T, and r_d is V_T over the dc current." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Product and quotient rules, and finding a maximum", mins: 20,
    blurb: "Derivatives of products and fractions. Setting a derivative to zero finds the peak, like maximum power transfer.",
    takeaway: "Product: (uv)′ = u′v + uv′. Quotient: (u/v)′ = (u′v − uv′)/v². Example: d/dt(t·e^(−at)) = e^(−at)(1 − at), zero at t = 1/a, so the peak is there. A smooth curve's maximum or minimum has slope 0. Maximum power transfer: P = V²R_L/(R_T + R_L)², and dP/dR_L = 0 gives R_L = R_T.",
    steps: [
      { k: "learn", title: "Two rules", b: [
        `<div class="two"><div class="tile"><h3>Product</h3><div class="eq">(uv)′ = u′v + uv′</div><p class="aside">Change one factor at a time, then add.</p></div><div class="tile"><h3>Quotient</h3><div class="eq">(u/v)′ = (u′v − uv′)/v²</div><p class="aside">"Bottom times d(top), minus top times d(bottom), over bottom squared."</p></div></div>`,
        `<p>An example you'll meet in Laplace (Module 20): u = t, v = e<sup>−at</sup>.</p>`,
        `<div class="eq">d/dt (t e<sup>−at</sup>) = 1·e<sup>−at</sup> + t·(−a e<sup>−at</sup>) = e<sup>−at</sup>(1 − at)</div>`,
      ]},
      { k: "play", title: "Slope zero at the peak", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let RL = 400;
          const V = 10, RT = 1000;
          function draw() {
            const P = (r) => (1000 * V * V * r) / (RT + r) ** 2, dP = (r) => (1000 * V * V * (RT - r)) / (RT + r) ** 3;
            const slope = dP(RL);
            f.innerHTML = plot({ x: [0, 4000], y: [0, 30], xt: [0, 1000, 2000, 3000, 4000], xtf: (v) => fmt(v / 1000) + "k", yt: [0, 10, 20, 30], xl: "R_L (Ω)", yl: "P (mW)", h: 240, series: [{ f: P, cls: "s1" }, { f: (r) => P(RL) + slope * (r - RL), from: Math.max(0, RL - 700), to: RL + 700, cls: "s3" }], marks: [{ x: RL, y: P(RL) }], label: "Load power against load resistance, with the tangent at the chosen point" });
            ro.innerHTML = readout([["P = V²R_L/(R_T + R_L)²", fmt(P(RL), 4) + " mW"], ["dP/dR_L (green slope)", fmt(1000 * slope, 3) + " µW/Ω"], ["Peak at R_L = R_T", fmt(RT) + " Ω → " + fmt(P(RT), 4) + " mW"]]);
          }
          host.append(f, slider({ id: id + "-r", label: "R_L", min: 50, max: 4000, step: 10, value: RL, show: (v) => fmt(v) + " Ω" }, (v) => { RL = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">10 V source, R<sub>T</sub> = 1 kΩ. Slide until the green tangent is flat: that's the maximum, at R<sub>L</sub> = R<sub>T</sub>.</p>`,
      ]},
      { k: "math", title: "Why R_L = R_T", b: [
        { t: "reveal", label: "Quotient rule on P = V²R_L/(R_T + R_L)²", html: `<div class="eq">dP/dR<sub>L</sub> = V²[(R<sub>T</sub> + R<sub>L</sub>)² − R<sub>L</sub>·2(R<sub>T</sub> + R<sub>L</sub>)]/(R<sub>T</sub> + R<sub>L</sub>)⁴ = V²(R<sub>T</sub> − R<sub>L</sub>)/(R<sub>T</sub> + R<sub>L</sub>)³</div>` },
        { t: "reveal", label: "Set it to zero", html: `<div class="eq">R<sub>T</sub> − R<sub>L</sub> = 0  →  R<sub>L</sub> = R<sub>T</sub>,   P<sub>max</sub> = V²/(4R<sub>T</sub>)</div>` },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "d/dt (t² e^(−t)) = ?", opts: [["e^(−t)(2t − t²)", true, "u′v + uv′ = 2t·e^(−t) + t²·(−e^(−t))."], ["2t·e^(−t)", false, "That differentiates only one factor."], ["−2t·e^(−t)", false, "Multiplying the two derivatives isn't the rule: it adds two terms."]] },
        { t: "num", q: "Where does t·e^(−2t) peak? (t = ?)", a: 0.5, hint: "Derivative e^(−2t)(1 − 2t) = 0.", why: "t = 1/a = 0.5." },
        { t: "num", q: "A 12 V source with R_T = 8 Ω. Most power a load can take? (W)", a: 4.5, unit: "W", why: "V²/(4R_T) = 144/32 = 4.5 W, with R_L = 8 Ω." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do derivatives find the best value of a component?", model: "Write the quantity you care about, like load power, as a function of the component. At the best value the curve is at its peak, where its slope is zero, so take the derivative, set it to zero and solve." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "Partial derivatives and sensitivity", mins: 20,
    blurb: "When a formula has several inputs, change one and hold the rest. That's how stability factors work.",
    takeaway: "∂f/∂x means: differentiate with respect to x, treating every other letter as a constant. For small changes in several inputs: Δf ≈ (∂f/∂x)Δx + (∂f/∂y)Δy + … Fixed bias I_C = β(V_CC − V_BE)/R_B: ∂I_C/∂β = (V_CC − V_BE)/R_B, ∂I_C/∂V_BE = −β/R_B. Boylestad's stability factors S(β), S(V_BE), S(I_CO) are these same ratios, ΔI_C/Δ(input).",
    steps: [
      { k: "learn", title: "Hold the others still", b: [
        `<div class="eq">I<sub>C</sub> = β(V<sub>CC</sub> − V<sub>BE</sub>)/R<sub>B</sub></div>`,
        `<div class="two"><div class="tile"><h3>∂I<sub>C</sub>/∂β</h3><p>Treat V<sub>CC</sub>, V<sub>BE</sub>, R<sub>B</sub> as fixed numbers: (V<sub>CC</sub> − V<sub>BE</sub>)/R<sub>B</sub>.</p></div><div class="tile"><h3>∂I<sub>C</sub>/∂V<sub>BE</sub></h3><p>Only V<sub>BE</sub> moves: −β/R<sub>B</sub>.</p></div></div>`,
        `<div class="eq">ΔI<sub>C</sub> ≈ (∂I<sub>C</sub>/∂β)Δβ + (∂I<sub>C</sub>/∂V<sub>BE</sub>)ΔV<sub>BE</sub></div>`,
      ]},
      { k: "play", title: "Warm the transistor", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let db = 50, dv = -0.1;
          const b0 = 100, v0 = 0.7, VCC = 12, RB = 240;
          function draw() {
            const I = (b, v) => (b * (VCC - v)) / RB, I0 = I(b0, v0);
            const est = I0 + ((VCC - v0) / RB) * db + (-b0 / RB) * dv, ex = I(b0 + db, v0 + dv);
            ro.innerHTML = readout([["I_C at β = 100, V_BE = 0.7 V", fmt(I0, 4) + " mA"], ["∂I_C/∂β × Δβ", fmt(((VCC - v0) / RB) * db, 4) + " mA"], ["∂I_C/∂V_BE × ΔV_BE", fmt((-b0 / RB) * dv, 4) + " mA"], ["Estimate / exact", fmt(est, 4) + " / " + fmt(ex, 4) + " mA"]]);
          }
          host.append(slider({ id: id + "-b", label: "Δβ", min: -50, max: 100, step: 5, value: db }, (v) => { db = v; draw(); }).el, slider({ id: id + "-v", label: "ΔV_BE", min: -0.2, max: 0.1, step: 0.01, value: dv, show: (v) => fmt(1000 * v, 3) + " mV" }, (v) => { dv = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Fixed bias, V<sub>CC</sub> = 12 V, R<sub>B</sub> = 240 kΩ. Heat raises β and lowers V<sub>BE</sub>; both push I<sub>C</sub> up. The two partial derivatives tell you how much each matters. (The estimate leaves out a small cross term, −Δβ·ΔV<sub>BE</sub>/R<sub>B</sub>.)</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "f = xy². ∂f/∂y = ?", opts: [["2xy", true, "x is a constant here; y² → 2y."], ["y²", false, "That's ∂f/∂x."], ["2y", false, "Keep the constant factor x."]] },
        { t: "num", q: "I_C = β(V_CC − V_BE)/R_B with V_CC = 12 V, V_BE = 0.7 V, R_B = 240 kΩ. ∂I_C/∂β in µA (per unit of β)?", a: 47.08, unit: "µA", tol: 0.01, why: "11.3 V/240 kΩ = 47.1 µA: each extra 1 of β adds 47 µA." },
        { t: "num", q: "So β rising from 100 to 150 raises I_C by about? (mA)", a: 2.354, unit: "mA", tol: 0.01, why: "50 × 47.1 µA = 2.35 mA, a 50% rise. That's why fixed bias is called unstable." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a partial derivative like ∂I_C/∂β tell a circuit designer?", model: "How much the collector current changes for each unit change in beta, with everything else held fixed. Multiplying it by the expected spread in beta gives the expected change in current, so a small partial derivative means the design doesn't care much about beta." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m13", eyebrow: "Math Toolkit · Module 13", title: "Derivatives",
    intro: `<p>Five parts: slope at a point, the basic rules, the tangent line behind every small-signal model, the product and quotient rules (with finding a maximum), and partial derivatives. No limits or proofs, just what you need for capacitors, inductors, r<sub>d</sub>, r<sub>e</sub> and g<sub>m</sub>.</p>`,
    after: `<p>When a book writes "the slope at the Q point", that's a derivative. Picture the tangent line.</p>`,
    parts: [p1, p2, p3, p4, p5],
    summary: `
      <p>dy/dx = slope of the tangent ≈ Δy/Δx for a small step. Units: y-units per x-unit.</p>
      <div class="eq">xⁿ → nxⁿ⁻¹    e<sup>ax</sup> → ae<sup>ax</sup>    ln x → 1/x    sin ωt → ω cos ωt    cos ωt → −ω sin ωt</div>
      <p>Chain rule: (x − a)² → 2(x − a). Capacitor i = C dv/dt; inductor v = L di/dt. Slew rate needed: ωV<sub>m</sub>.</p>
      <div class="eq">f(x<sub>0</sub> + Δx) ≈ f(x<sub>0</sub>) + f′(x<sub>0</sub>)Δx     r<sub>d</sub> = V<sub>T</sub>/I<sub>D</sub>     g<sub>m</sub> = 2k(V<sub>GS</sub> − V<sub>T</sub>)</div>
      <div class="eq">(uv)′ = u′v + uv′     (u/v)′ = (u′v − uv′)/v²</div>
      <p>Max or min: set the derivative to 0. Max power: R<sub>L</sub> = R<sub>T</sub>, P = V²/4R<sub>T</sub>. Partial ∂f/∂x: others held constant; Δf ≈ Σ(∂f/∂x)Δx.</p>`,
  };
  Course.start(window.CHAPTER);
})();
