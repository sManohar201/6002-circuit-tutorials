(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;

  /* complex numbers as [re, im] */
  const Z = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1]],
    mul: (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]],
    div: (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; },
    abs: (a) => Math.hypot(a[0], a[1]),
    deg: (a) => (Math.atan2(a[1], a[0]) * 180) / Math.PI,
  };

  /* log-scale plots: x is log10(ω), y is log10|H| (magnitude) or degrees (phase) */
  const sup = (n) => String(n).replace(/-/g, "⁻").replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);
  const p10 = (v) => "10" + sup(v);
  const ints = (a, b) => { const r = []; for (let k = Math.ceil(a); k <= Math.floor(b); k++) r.push(k); return r; };
  function bmag(o) {
    return plot({
      w: o.w || 520, h: o.h || 260, x: o.x, y: o.y, xt: ints(o.x[0], o.x[1]), yt: o.yt || ints(o.y[0], o.y[1]), xtf: p10, ytf: o.ytf || p10, xl: o.xl || "ω (rad/s)", yl: o.yl || "|H|",
      series: o.series.map((se) => ({ f: (lx) => Math.log10(se.f(Math.pow(10, lx))), cls: se.cls, n: se.n || 300 })),
      marks: (o.marks || []).map((m) => Object.assign({}, m, { x: Math.log10(m.x), y: Math.log10(m.y) })), label: o.label || "Magnitude versus frequency, log scales",
    });
  }
  function bph(o) {
    return plot({
      w: o.w || 520, h: o.h || 220, x: o.x, y: [-100, 100], xt: ints(o.x[0], o.x[1]), yt: [-90, -45, 0, 45, 90], xtf: p10, ytf: (v) => fmt(v) + "°", xl: o.xl || "ω (rad/s)", yl: o.yl || "∠H",
      series: o.series.map((se) => ({ f: (lx) => se.f(Math.pow(10, lx)), cls: se.cls, n: se.n || 300 })),
      marks: (o.marks || []).map((m) => Object.assign({}, m, { x: Math.log10(m.x) })), label: o.label || "Phase versus frequency, log frequency scale",
    });
  }

  /* impedance boxes for impedance-model drawings */
  const zTop = (lab) => (x1, y, x2) => S.wire([x1, y], [x1 + 18, y]) + S.box(x1 + 18, y - 14, x2 - x1 - 36, 28, lab) + S.wire([x2 - 18, y], [x2, y]);
  const zBot = (lab) => (x, y1, y2) => S.wire([x, y1], [x, y1 + 28]) + S.box(x - 32, y1 + 28, 64, y2 - y1 - 56, lab) + S.wire([x, y2 - 28], [x, y2]);
  const rTop = (lab) => (x1, y, x2) => S.res(x1, y, x2, y, lab);
  const lTop = (lab) => (x1, y, x2) => S.ind(x1, y, x2, y, lab);
  const cBot = (lab) => (x, y1, y2) => S.cap(x, y1, x, y2, lab, { side: "left" });
  const rBot = (lab) => (x, y1, y2) => S.res(x, y1, x, y2, lab, { side: "left" });
  function divFig(top, bot, o = {}) {
    const s = S.wire([60, 82], [60, 30], [90, 30]) + top(90, 30, 200) + S.wire([200, 30], [260, 30]) + bot(260, 30, 150) + S.wire([60, 118], [60, 150], [260, 150]) +
      S.vsrc(60, 100, o.V || "V_i", { side: "right" }) + S.wire([260, 30], [320, 30]) + S.wire([260, 150], [320, 150]) + S.dot(320, 30) + S.dot(320, 150) +
      S.t(328, 52, "+", { cls: "big", a: "start" }) + S.t(328, 146, "−", { cls: "big", a: "start" }) + S.t(330, 97, o.out || "V_o", { a: "start", cls: "a" });
    return S.svg(400, 172, s, { max: 400, label: o.label || "A two-element divider driven by a source" });
  }
  function bandFig(imp) {
    const c1 = imp ? zTop("1/sC₁") : (x1, y, x2) => S.cap(x1, y, x2, y, "C₁");
    const r1 = imp ? zBot("R₁") : rBot("R₁");
    const r2 = imp ? zTop("R₂") : rTop("R₂");
    const c2 = imp ? zBot("1/sC₂") : cBot("C₂");
    const s = S.wire([50, 82], [50, 30], [70, 30]) + c1(70, 30, 160) + S.wire([160, 30], [190, 30]) + r1(190, 30, 150) + S.wire([190, 30], [215, 30]) + r2(215, 30, 305) + S.wire([305, 30], [340, 30]) + c2(340, 30, 150) +
      S.wire([50, 118], [50, 150], [340, 150]) + S.vsrc(50, 100, imp ? "V_i" : "v_i", { side: "right" }) + S.dot(190, 30) + S.t(190, 18, imp ? "V_a" : "v_a", { cls: "a" }) + S.dot(340, 30) + S.t(352, 22, imp ? "V_o" : "v_o", { cls: "a", a: "start" });
    return S.svg(410, 170, s, { max: 410, label: imp ? "Impedance model of the two-capacitor circuit" : "Two-capacitor RC circuit" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Why sinusoids? Same frequency out", mins: 20,
    blurb: "Drive a linear circuit with a sine wave and only the size and timing change.",
    takeaway: "In a linear circuit driven by a sinusoid, the output (after the transient dies) is a sinusoid at the same frequency. Only two things can change: the amplitude and the phase. That's the sinusoidal steady state, and it's how we describe what a circuit does to each frequency.",
    steps: [
      { k: "learn", title: "A puzzle from the lab", b: [
        `<p>Build the two-stage MOSFET amplifier from Chapters 7–8. Feed in a small sine wave. At low frequencies the output is a big, clean copy. Turn the frequency up and the gain <b>falls away</b>.</p>`,
        `<p>The culprit is the second stage's gate capacitance C<sub>GS</sub>. To see why, we need a way to find how circuits respond to sinusoids at <b>any frequency</b>, without grinding through a differential equation each time.</p>`,
        `<p class="aside">Sinusoids matter beyond amplifiers. Power from the wall is a sinusoid, radio stations sit at different frequencies, and (Fourier) almost any signal can be built from sinusoids.</p>`,
      ]},
      { k: "predict", title: "Predict first", b: [
        divFig(rTop("R"), cBot("C"), { V: "v_I", out: "v_C", label: "RC circuit driven by v_I" }),
        { t: "mcq", q: "v_I = cos(ωt) drives this RC circuit. After things settle, what does v_C look like?", opts: [["A cosine at the same ω, smaller and shifted later in time", true, "Linear circuits can't create new frequencies. They only scale and delay. Check it on the next card."], ["A cosine at a lower frequency", false, "Nothing in a linear circuit can change the frequency."], ["A square wave", false, "That would need new frequencies (harmonics). A linear RC can't make them."], ["A constant", false, "Only if ω = 0."]] },
      ]},
      { k: "play", title: "Watch it settle", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let w = 1000, mode = 0;
          const RC = 1e-3;
          function draw() {
            const H = 1 / Math.sqrt(1 + (w * RC) ** 2), ph = Math.atan(-w * RC);
            const vc = (tm) => { const t = tm * 1e-3; return H * Math.cos(w * t + ph) - (mode === 0 ? H * Math.cos(ph) * Math.exp(-t / RC) : 0); };
            f.innerHTML = plot({ x: [0, 15], y: [-1.25, 1.25], xt: [0, 5, 10, 15], yt: [-1, 0, 1], xl: "t (ms)", yl: "v (V)", series: [{ f: (tm) => Math.cos(w * tm * 1e-3), cls: "s5", n: 900 }, { f: vc, cls: "s1", n: 900 }], label: "Input cosine (dashed) and capacitor voltage" });
            ro.innerHTML = readout([["ωRC", fmt(w * RC)], ["output amplitude ÷ input", fmt(H)], ["phase shift", fmt((ph * 180) / Math.PI) + "°"]]);
          }
          host.append(f, toggle(["Switch on at t = 0", "Steady state only"], (k) => { mode = k; draw(); }), slider({ id: id + "-w", label: "Drive frequency ω", min: 300, max: 6000, log: true, value: w, show: (x) => fmt(x, 3) + " rad/s" }, (x) => { w = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">RC = 1 ms. Dashed: v<sub>I</sub> = cos ωt (1 V). Solid: v<sub>C</sub>, starting from 0 V. The start-up wiggle is the homogeneous part (it dies like e<sup>−t/RC</sup>, Chapter 10). What's left is the <b>sinusoidal steady state</b>.</p>`,
      ]},
      { k: "learn", title: "The trick: drive with e^(st)", b: [
        `<p>Solving with cos ωt directly means guessing A cos ωt + B sin ωt and grinding through trig. Messy. Instead, pretend the drive is a <b>complex exponential</b>:</p>`,
        `<div class="eq">v<sub>I</sub> = V<sub>i</sub>e<sup>st</sup>   with s = jω</div>`,
        `<p>Guess v<sub>C</sub> = V<sub>c</sub>e<sup>st</sup>. Every d/dt just multiplies by s, so the ODE RC·dv<sub>C</sub>/dt + v<sub>C</sub> = v<sub>I</sub> becomes <b>algebra</b>:</p>`,
        `<div class="eq">sRC·V<sub>c</sub> + V<sub>c</sub> = V<sub>i</sub>   ⟹   V<sub>c</sub> = V<sub>i</sub> / (1 + jωRC)</div>`,
        `<p>Since e<sup>jωt</sup> = cos ωt + j sin ωt (Chapter 12's Euler), the real cosine drive is the <b>real part</b>. The circuit is linear, so the real answer is the real part too:</p>`,
        `<div class="key">v<sub>C</sub>(t) = Re[V<sub>c</sub>e<sup>jωt</sup>] = |V<sub>c</sub>| cos(ωt + ∠V<sub>c</sub>)</div>`,
      ]},
      { k: "check", title: "Read off the answer", b: [
        `<p>Same circuit, RC = 1 ms, V<sub>i</sub> = 1 V. Magnitude 1/√(1 + (ωRC)²), angle tan⁻¹(−ωRC).</p>`,
        { t: "num", q: "ω = 1000 rad/s: amplitude of v_C?", a: 0.707, tol: 0.01, unit: "V", why: "ωRC = 1, so 1/√2 ≈ 0.707 V, lagging by 45°. Matches the slider." },
        { t: "num", q: "ω = 2000 rad/s: amplitude of v_C?", a: 0.447, tol: 0.01, unit: "V", why: "1/√(1 + 4) = 1/√5 ≈ 0.447 V." },
        { t: "num", q: "…and how many degrees does it lag?", a: 63.4, tol: 0.01, unit: "°", hint: "tan⁻¹(2).", why: "tan⁻¹(2) ≈ 63.4°: v_C = 0.447 cos(2000t − 63.4°)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is driving with e^(jωt) easier than driving with cos(ωt)?", model: "Differentiating an exponential just multiplies it by s = jω, so the whole differential equation turns into an algebra equation for one complex number. That number's size is the output amplitude and its angle is the phase shift. Taking the real part at the end gives the real cosine answer, because the circuit is linear." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Impedance: R, sL, 1/sC", mins: 25,
    blurb: "Every element becomes a box with a 'complex resistance'.",
    takeaway: "With complex amplitudes, V = Z·I for every element: Z_R = R, Z_L = jωL, Z_C = 1/(jωC). Draw the impedance model (same wiring, boxes instead of elements) and use every resistive-circuit tool from Chapters 2–3. Low ω: C is open, L is a short. High ω: C is a short, L is open.",
    steps: [
      { k: "learn", title: "Each element's V–I rule", b: [
        `<p>Put i = I e<sup>jωt</sup> through each element and see what voltage V e<sup>jωt</sup> appears:</p>`,
        `<div class="tbl"><table><tbody>
          <tr><td>resistor</td><td class="mono">v = Ri</td><td class="mono">V = R·I</td><td class="mono">Z = R</td></tr>
          <tr><td>inductor</td><td class="mono">v = L di/dt</td><td class="mono">V = jωL·I</td><td class="mono">Z = sL</td></tr>
          <tr><td>capacitor</td><td class="mono">i = C dv/dt</td><td class="mono">V = I/(jωC)</td><td class="mono">Z = 1/sC</td></tr></tbody></table></div>`,
        `<p>The ratio <b>Z = V/I</b> is the <b>impedance</b>. Measured in ohms. It's a "resistance" that depends on frequency and can be complex.</p>`,
      ]},
      { k: "play", title: "Impedances as arrows", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let w = 10000;
          const R = 100, L = 10e-3, C = 1e-6, sc = 90 / 150;
          function draw() {
            const zl = w * L, zc = 1 / (w * C), cx = 120, cy = 115, len = (z) => Math.min(105, z * sc);
            let s = `<line x1="10" y1="${cy}" x2="250" y2="${cy}" class="w dim"/><line x1="${cx}" y1="5" x2="${cx}" y2="225" class="w dim"/>` + S.t(246, cy - 8, "Re", { cls: "s m", a: "end" }) + S.t(cx + 8, 16, "Im (+j)", { cls: "s m", a: "start" });
            s += `<line x1="${cx}" y1="${cy}" x2="${cx + len(R)}" y2="${cy}" style="stroke:var(--good);stroke-width:4"/>` + S.t(cx + len(R) + 4, cy + 18, "Z_R", { cls: "g", a: "start" });
            s += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - len(zl)}" style="stroke:var(--accent);stroke-width:4"/>` + S.t(cx - 8, cy - len(zl) + 12, "Z_L", { cls: "a", a: "end" });
            s += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy + len(zc)}" style="stroke:var(--cool);stroke-width:4"/>` + S.t(cx - 8, cy + len(zc) - 2, "Z_C", { cls: "c", a: "end" });
            f.innerHTML = S.svg(260, 230, s, { max: 300, label: "Impedances of R, L and C drawn as arrows in the complex plane" });
            ro.innerHTML = readout([["Z_R", "100 Ω (angle 0°)"], ["Z_L = jωL", "j" + fmt(zl) + " Ω (+90°)"], ["Z_C = 1/jωC", "−j" + fmt(zc) + " Ω (−90°)"]]);
          }
          host.append(f, slider({ id: id + "-w", label: "Frequency ω", min: 2000, max: 50000, log: true, value: w, show: (x) => fmt(x, 3) + " rad/s" }, (x) => { w = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">R = 100 Ω, L = 10 mH, C = 1 µF. Arrows are clipped when they run off the picture. Note 1/j = −j, so the capacitor points <b>down</b>.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "|Z_L| for L = 10 mH at ω = 10⁴ rad/s?", a: 100, unit: "Ω", why: "ωL = 10⁴ × 0.01 = 100 Ω." },
        { t: "num", q: "|Z_C| for C = 1 µF at ω = 10⁴ rad/s?", a: 100, unit: "Ω", why: "1/(10⁴ × 10⁻⁶) = 100 Ω." },
        { t: "num", q: "Double ω to 2×10⁴. |Z_C| = ?", a: 50, unit: "Ω", why: "A capacitor's impedance halves when the frequency doubles." },
      ]},
      { k: "learn", title: "The impedance model", b: [
        `<ol><li>Replace each source by its complex amplitude (V<sub>i</sub> for V<sub>i</sub> cos ωt).</li><li>Replace R, L, C by boxes R, sL, 1/sC. Keep the same wiring.</li><li>Solve with any Chapter 2–3 tool: series/parallel, dividers, node method, Thévenin, superposition.</li><li>(If you need it) go back to time: v(t) = |V| cos(ωt + ∠V).</li></ol>`,
        fig(divFig(zTop("R"), zBot("1/sC"), { label: "Impedance model of the RC circuit" })),
        `<div class="eq">V<sub>o</sub> = (1/sC) / (R + 1/sC) · V<sub>i</sub> = V<sub>i</sub> / (1 + sRC)</div>`,
        `<p>One line, the same answer as Part 1. Series impedances add; parallel ones combine like resistors: Z₁Z₂/(Z₁ + Z₂).</p>`,
      ]},
      { k: "math", title: "Dividing complex numbers", b: [
        `<p>Answers come out as fractions of complex numbers. You rarely need to simplify them. Use polar form:</p>`,
        `<div class="key">|A/B| = |A| / |B|     ∠(A/B) = ∠A − ∠B</div>`,
        `<p>Example: 1/(1 + j). |1 + j| = √2 and ∠(1 + j) = 45°. So the ratio has size 1/√2 ≈ 0.707 and angle 0° − 45° = −45°.</p>`,
        { t: "num", q: "|j2 / (1 + j)| = ?", a: 1.414, tol: 0.01, why: "2/√2 = √2 ≈ 1.41." },
        { t: "num", q: "∠( j2 / (1 + j) ) = ? (degrees)", a: 45, unit: "°", why: "∠(j2) = 90°, ∠(1 + j) = 45°, so 90 − 45 = 45°." },
      ]},
      { k: "why", title: "The two easy extremes", b: [
        `<p>|Z<sub>C</sub>| = 1/ωC and |Z<sub>L</sub>| = ωL. Push ω to the ends:</p>`,
        { t: "sort", q: "Sort each element at each extreme.", bins: ["Acts like an open", "Acts like a short"], items: [
          ["Capacitor at very low ω (DC)", 0, "1/ωC → ∞. Same as Chapter 10's 'capacitor is open at DC'."],
          ["Capacitor at very high ω", 1, "1/ωC → 0. Fast wiggles pass straight through a capacitor."],
          ["Inductor at very low ω (DC)", 1, "ωL → 0."],
          ["Inductor at very high ω", 0, "ωL → ∞. An inductor fights fast changes in current."],
        ]},
        `<p class="aside">Use these to sanity-check any answer: plug in ω → 0 and ω → ∞, redraw the circuit with opens and shorts, and see if your formula agrees.</p>`,
      ]},
      { k: "check", title: "A series RL", b: [
        divFig(lTop("L"), rBot("R"), { V: "v_I", out: "v_R", label: "Series RL with output across R" }),
        `<p>R = 100 Ω, L = 10 mH, output across R. Divider: H = R/(R + jωL).</p>`,
        { t: "num", q: "At ω = 10⁴ rad/s, |H| = ?", a: 0.707, tol: 0.01, hint: "R + jωL = 100 + j100.", why: "100/|100 + j100| = 100/141 ≈ 0.707, angle −45°." },
        { t: "mcq", q: "At very high ω, v_R does what?", opts: [["→ 0: the inductor becomes an open and blocks the current", true, "So this one passes low frequencies to the resistor."], ["→ v_I", false, "That's the low-frequency limit (inductor = short)."], ["Doubles", false, "A passive divider can't exceed the input here."]] },
      ]},
      { k: "learn", title: "Variable names", b: [
        `<div class="tbl"><table><tbody>
          <tr><td class="mono">v<sub>D</sub></td><td>total variable (lowercase, uppercase subscript)</td></tr>
          <tr><td class="mono">V<sub>D</sub></td><td>DC operating point (all uppercase)</td></tr>
          <tr><td class="mono">v<sub>d</sub></td><td>small-signal part (all lowercase)</td></tr>
          <tr><td class="mono">V<sub>d</sub></td><td><b>new:</b> complex amplitude (uppercase, lowercase subscript)</td></tr></tbody></table></div>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is an impedance model, and why does it save so much work?", model: "It's the same circuit drawn with each element replaced by its impedance: R, sL or 1/sC, and each sinusoidal source replaced by its complex amplitude. Since V = Z·I for every box, the circuit behaves like a resistive one, so dividers, the node method and Thévenin all work directly. No differential equations to solve." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Spinning arrows and bigger circuits", mins: 25,
    blurb: "A complex amplitude is an arrow; the real signal is its shadow.",
    takeaway: "V e^(jωt) is an arrow of length |V| spinning at ω, and the real signal is its shadow on the real axis. H = Vo/Vi rescales and rotates the arrow. The impedance method handles any linear circuit: two capacitors with the node method give a second-order H(s) that passes a middle band.",
    steps: [
      { k: "play", title: "The shadow is the signal", b: [
        (host, id) => {
          const wrap = el(`<div class="two"></div>`), a = el(`<div class="fig"></div>`), b = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let k = 1, th = 40;
          function draw() {
            const H = 1 / Math.sqrt(1 + k * k), ph = (Math.atan(-k) * 180) / Math.PI, cx = 110, cy = 110, r = 85, rad = (d) => (d * Math.PI) / 180;
            const ix = cx + r * Math.cos(rad(th)), iy = cy - r * Math.sin(rad(th)), ox = cx + r * H * Math.cos(rad(th + ph)), oy = cy - r * H * Math.sin(rad(th + ph));
            let s = `<circle cx="${cx}" cy="${cy}" r="${r}" class="w dim"/><line x1="15" y1="${cy}" x2="205" y2="${cy}" class="w dim"/><line x1="${cx}" y1="15" x2="${cx}" y2="205" class="w dim"/>` +
              `<line x1="${cx}" y1="${cy}" x2="${ix}" y2="${iy}" style="stroke:var(--muted);stroke-width:3"/><line x1="${ix}" y1="${iy}" x2="${ix}" y2="${cy}" class="w dim" style="stroke-dasharray:3 3"/>` +
              `<line x1="${cx}" y1="${cy}" x2="${ox}" y2="${oy}" class="w hl"/><line x1="${ox}" y1="${oy}" x2="${ox}" y2="${cy}" class="w dim" style="stroke-dasharray:3 3"/>` +
              `<circle cx="${ix}" cy="${cy}" r="5" style="fill:var(--muted)"/><circle cx="${ox}" cy="${cy}" r="5" class="nd"/>` + S.t(ix + 6, iy - 6, "V_i", { cls: "s m", a: "start" }) + S.t(ox + 6, oy + 14, "V_c", { cls: "s a", a: "start" });
            a.innerHTML = S.svg(220, 220, s, { max: 240, label: "Two arrows spinning in the complex plane, with their shadows on the real axis" });
            b.innerHTML = plot({ w: 300, h: 220, x: [0, 360], y: [-1.15, 1.15], xt: [0, 90, 180, 270, 360], yt: [-1, 0, 1], xl: "ωt (°)", yl: "v", series: [{ f: (d) => Math.cos(rad(d)), cls: "s5" }, { f: (d) => H * Math.cos(rad(d + ph)), cls: "s1" }], marks: [{ x: th, y: Math.cos(rad(th)), cls: "mk", r: 5 }, { x: th, y: H * Math.cos(rad(th + ph)), r: 5 }], label: "Input and output versus ωt" });
            ro.innerHTML = readout([["|V_c| / |V_i|", fmt(H)], ["∠V_c", fmt(ph) + "°"]]);
          }
          wrap.append(a, b);
          const box = el(`<div class="sliders"></div>`);
          box.append(slider({ id: id + "-t", label: "Time (as angle ωt)", min: 0, max: 360, step: 1, value: th, show: (x) => fmt(x) + "°" }, (x) => { th = x; draw(); }).el,
            slider({ id: id + "-k", label: "ωRC", min: 0.1, max: 10, log: true, value: k, show: (x) => fmt(x) }, (x) => { k = x; draw(); }).el);
          host.append(wrap, box, ro);
          draw();
        },
        `<p>Grey: V<sub>i</sub>e<sup>jωt</sup>. Orange: V<sub>c</sub>e<sup>jωt</sup> for the RC circuit. Slide time and both arrows <b>spin together</b>. Their shadows on the real (horizontal) axis are the real voltages on the right. The circuit's job is just to shrink the arrow and rotate it back by a fixed angle.</p>`,
      ]},
      { k: "check", title: "Complex amplitude → time function", b: [
        { t: "mcq", q: "A node's complex amplitude is V = 3e^(−j30°) at ω = 500 rad/s. The real voltage?", opts: [["3 cos(500t − 30°)", true, "|V| is the amplitude, ∠V is the phase."], ["3 cos(500t) − 30", false, "The angle goes inside the cosine."], ["cos(500t − 90°)", false, "Amplitude 3, phase −30°."]] },
        { t: "num", q: "Write V = 2 − j2 in polar form. Magnitude?", a: 2.83, tol: 0.01, why: "√(4 + 4) = 2√2 ≈ 2.83, angle −45°. So v(t) = 2.83 cos(ωt − 45°)." },
      ]},
      { k: "learn", title: "Two capacitors", b: [
        fig(bandFig(false)),
        `<p>Two storage elements: Chapter 12 would need a second-order ODE. With impedances it's two dividers (or two node equations):</p>`,
        fig(bandFig(true)),
        `<div class="eq">H(s) = V<sub>o</sub>/V<sub>i</sub> = R₁C₁s / [R₁R₂C₁C₂s² + (R₁C₁ + R₁C₂ + R₂C₂)s + 1]</div>`,
        { t: "reveal", label: "Show the node equations", html: `<p>KCL at V<sub>a</sub>: (V<sub>i</sub> − V<sub>a</sub>)·sC₁ − V<sub>a</sub>/R₁ − (V<sub>a</sub> − V<sub>o</sub>)/R₂ = 0.</p><p>KCL at V<sub>o</sub>: (V<sub>a</sub> − V<sub>o</sub>)/R₂ − V<sub>o</sub>·sC₂ = 0.</p><p>Eliminate V<sub>a</sub> and you get the same H(s). The node method doesn't care whether the boxes hold R, sL or 1/sC.</p>` },
      ]},
      { k: "predict", title: "Predict first", b: [
        { t: "mcq", q: "Without algebra, use the opens-and-shorts check. What does this circuit do at very low and very high ω?", opts: [["Output → 0 at both ends: C₁ blocks DC, and at high ω C₂ shorts the output", true, "So it can only pass something in the middle. On to the plot."], ["Output → V_i at low ω", false, "At DC C₁ is open, so nothing gets through."], ["Output → V_i at high ω", false, "C₂ becomes a short across the output."]] },
      ]},
      { k: "play", title: "Its frequency response", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), g = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const t = 0.01; let w = 100;
          const H = (w) => Z.div([0, w * t], [1 - w * w * t * t, 3 * w * t]);
          function draw() {
            const h = H(w);
            f.innerHTML = bmag({ x: [0, 4], y: [-3, 0], series: [{ f: (x) => Z.abs(H(x)), cls: "s1" }], marks: [{ x: w, y: Z.abs(h) }] });
            g.innerHTML = bph({ x: [0, 4], series: [{ f: (x) => Z.deg(H(x)), cls: "s1" }], marks: [{ x: w, y: Z.deg(h) }] });
            ro.innerHTML = readout([["|H|", fmt(Z.abs(h))], ["∠H", fmt(Z.deg(h)) + "°"]]);
          }
          host.append(f, g, slider({ id: id + "-w", label: "ω", min: 1, max: 10000, log: true, value: w, show: (x) => fmt(x, 3) + " rad/s" }, (x) => { w = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">R₁ = R₂ = 10 kΩ, C₁ = C₂ = 1 µF, so H = 0.01s / (10⁻⁴s² + 0.03s + 1). Both axes are logarithmic (Part 5 explains why). Low and high frequencies are both cut: a <b>band-pass</b>.</p>`,
      ]},
      { k: "check", title: "Check the peak by hand", b: [
        { t: "num", q: "At ω = 100 rad/s, s = j100. Work out H. |H| = ?", a: 0.333, tol: 0.01, hint: "Numerator: j1. Denominator: 10⁻⁴(j100)² + 0.03(j100) + 1 = −1 + j3 + 1.", why: "j1/j3 = 1/3, angle 0°. The s² term cancels the 1, exactly at ω = 1/√(R₁R₂C₁C₂)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does multiplying a complex amplitude by H do to the spinning arrow, and what does that mean for the real signal?", model: "It scales the arrow's length by |H| and rotates it by ∠H. The arrow keeps spinning at the same ω. So the real signal, which is the arrow's shadow, has the same frequency but is |H| times as big and shifted by ∠H in phase." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Solving the amplifier puzzle", mins: 15,
    blurb: "C_GS turns the load resistor into a load impedance.",
    takeaway: "Small-signal model of a stage driving the next gate: current source g_m·v_i into R_L ∥ C_GS. So V_o = −g_m·Z_L·V_i with Z_L = R_L/(1 + jωR_L·C_GS). Gain is −g_m·R_L at low ω and falls toward 0 above ω = 1/(R_L·C_GS), because the capacitor shorts the output.",
    steps: [
      { k: "learn", title: "The small-signal model, loaded", b: [
        fig(S.svg(400, 180, S.wire([60, 82], [60, 40]) + S.dot(60, 40) + S.t(60, 28, "gate", { cls: "s m" }) + S.vsrc(60, 100, "v_i", { side: "left" }) + S.wire([60, 118], [60, 150]) + S.wire([60, 150], [340, 150]) + S.isrc(150, 95, "g_m·v_i", { down: true }) + S.wire([150, 40], [150, 72]) + S.wire([150, 118], [150, 150]) + S.wire([150, 40], [340, 40]) + S.res(240, 40, 240, 150, "R_L", { side: "left" }) + S.cap(320, 40, 320, 150, "C_GS") + S.dot(240, 40) + S.dot(320, 40) + S.t(320, 28, "v_o", { cls: "a" }) + S.dot(240, 150) + S.dot(320, 150), { max: 400, label: "Small-signal model: a dependent current source into R_L in parallel with C_GS" })),
        `<p>Chapter 8's small-signal model of the first stage, plus the next MOSFET's gate capacitance hanging on the output. (The gate draws no DC current, so that's the only load.)</p>`,
        `<p>Replace R<sub>L</sub> by the parallel combination:</p>`,
        `<div class="eq">Z<sub>L</sub> = R<sub>L</sub> ∥ 1/sC<sub>GS</sub> = R<sub>L</sub> / (1 + sR<sub>L</sub>C<sub>GS</sub>)     V<sub>o</sub> = −g<sub>m</sub>Z<sub>L</sub>V<sub>i</sub></div>`,
      ]},
      { k: "play", title: "Slide the gate capacitance", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const gm = 2e-3, RL = 4000; let Cg = 10e-12;
          function draw() {
            const wb = 1 / (RL * Cg), G = (w) => (gm * RL) / Math.sqrt(1 + (w * RL * Cg) ** 2);
            f.innerHTML = bmag({ x: [5, 10], y: [-1, 1.2], yt: [-1, 0, 1], yl: "|v_o / v_i|", series: [{ f: () => gm * RL, cls: "s5" }, { f: G, cls: "s1" }], marks: [{ x: wb, y: G(wb), label: "break", a: "end", dx: -10, dy: 22 }], label: "Amplifier gain magnitude versus frequency" });
            ro.innerHTML = readout([["low-frequency gain g_m·R_L", fmt(gm * RL)], ["break ω = 1/R_L·C_GS", fmt(wb) + " rad/s"], ["gain at 10⁸ rad/s", fmt(G(1e8))]]);
          }
          host.append(f, slider({ id: id + "-c", label: "C_GS", min: 1e-12, max: 100e-12, log: true, value: Cg, show: (x) => si(x, "F") }, (x) => { Cg = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">g<sub>m</sub> = 2 mA/V, R<sub>L</sub> = 4 kΩ (our Chapter 7 amplifier biased at V<sub>I</sub> = 2 V). Bigger C<sub>GS</sub> → the gain starts falling at a lower frequency.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>g<sub>m</sub> = 2 mA/V, R<sub>L</sub> = 4 kΩ, C<sub>GS</sub> = 10 pF.</p>`,
        { t: "num", q: "Break frequency 1/(R_L·C_GS)?", a: 25, unit: "×10⁶ rad/s", why: "1/(4000 × 10⁻¹¹) = 2.5 × 10⁷ rad/s (about 4 MHz)." },
        { t: "num", q: "Gain magnitude at the break frequency?", a: 5.66, tol: 0.01, hint: "8/√(1 + 1).", why: "8/√2 ≈ 5.66, phase shifted by an extra −45°." },
        { t: "mcq", q: "Physically, why does the gain die at high ω?", opts: [["C_GS's impedance → 0, so it shorts the small-signal output to ground", true, "The MOSFET's signal current all flows into the capacitor instead of building a voltage on R_L."], ["The MOSFET stops conducting", false, "The bias point doesn't change with signal frequency."], ["R_L gets bigger", false, "R_L doesn't depend on frequency."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the amplifier behave normally for slow signals but lose gain for fast ones?", model: "For slow signals the gate capacitance has a huge impedance, so it's effectively an open and the load is just R_L, giving gain g_m·R_L. For fast signals the capacitor's impedance gets small and shunts R_L, so the load impedance and hence the output voltage shrink toward zero." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Frequency response on log scales", mins: 20,
    blurb: "Why engineers plot log |H| against log ω.",
    takeaway: "Frequency response = |H| and ∠H plotted against ω. On log–log axes, |Z_L| = ωL is a straight line of slope +1, |Z_C| = 1/ωC is slope −1, R is flat. Phase: L +90°, C −90°, R 0°. Decade = ×10 in frequency, octave = ×2; dB = 20·log₁₀|H|.",
    steps: [
      { k: "learn", title: "Frequency response", b: [
        `<p>The <b>transfer function</b> (or system function) H(jω) = output amplitude ÷ input amplitude, both complex. Its <b>frequency response</b> is two plots:</p>`,
        `<ul><li><b>magnitude</b> |H| versus ω: the gain at each frequency</li><li><b>phase</b> ∠H versus ω: the shift between output and input</li></ul>`,
        `<p>This is a new view. Chapters 10–12 plotted voltage against <b>time</b>. Now we plot behaviour against <b>frequency</b>: the <b>frequency domain</b>.</p>`,
      ]},
      { k: "math", title: "Logs, quickly", b: [
        `<div class="tbl"><table><tbody>
          <tr><td class="mono">log₁₀ 1000 = 3</td><td>count the zeros</td></tr>
          <tr><td class="mono">log(ab) = log a + log b</td><td>multiply → add</td></tr>
          <tr><td class="mono">log(1/x) = −log x</td><td>divide → subtract</td></tr>
          <tr><td class="mono">log(x²) = 2 log x</td><td>power → multiply</td></tr></tbody></table></div>`,
        `<p>On a <b>log scale</b>, every equal step along the axis <b>multiplies</b> by the same factor (10², 10³, 10⁴…). On a linear scale, each step <b>adds</b> the same amount.</p>`,
        { t: "num", q: "log₁₀(ωL) with ω = 10⁵ and L = 10⁻³ is?", a: 2, hint: "log 10⁵ + log 10⁻³.", why: "5 + (−3) = 2, so |Z_L| = 10² = 100 Ω." },
      ]},
      { k: "play", title: "Linear vs log axes", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`);
          const R = 10, L = 100e-6, C = 1e-6;
          const ser = [{ f: () => R, cls: "s3" }, { f: (w) => w * L, cls: "s1" }, { f: (w) => 1 / (w * C), cls: "s2" }];
          function draw(k) {
            f.innerHTML = k === 0
              ? plot({ x: [0, 1e6], y: [0, 100], xt: [0, 2e5, 4e5, 6e5, 8e5, 1e6], yt: [0, 25, 50, 75, 100], xtf: (v) => fmt(v / 1e5) + (v ? "×10⁵" : ""), xl: "ω (rad/s)", yl: "|Z| (Ω)", series: ser, label: "Impedance magnitudes on linear axes" })
              : bmag({ x: [3, 7], y: [-1, 3], yl: "|Z| (Ω)", series: ser, label: "Impedance magnitudes on log axes" });
          }
          host.append(f, toggle(["Linear axes", "Log–log axes"], draw, 0));
          draw(0);
        },
        `<p class="aside">Green: R = 10 Ω. Orange: |Z<sub>L</sub>| for L = 100 µH. Blue: |Z<sub>C</sub>| for C = 1 µF. On linear axes the capacitor's curve is squashed into the corner. On log–log axes all three become <b>straight lines</b> and you see 4 decades at once.</p>`,
      ]},
      { k: "why", title: "Why straight lines?", b: [
        `<div class="eq">log|Z<sub>L</sub>| = log L + log ω     log|Z<sub>C</sub>| = −log C − log ω</div>`,
        `<p>Plotting log|Z| against log ω: slope <b>+1</b> for the inductor (×10 in ω → ×10 in |Z|), slope <b>−1</b> for the capacitor, flat for R.</p>`,
        { t: "num", q: "At what ω does |Z_L| = 1 Ω for L = 100 µH?", a: 10000, unit: "rad/s", why: "ω = 1/L = 10⁴ rad/s. The value of L just slides the line sideways." },
        { t: "num", q: "On the log–log plot, at what ω do the L and C lines cross (L = 100 µH, C = 1 µF)?", a: 100000, unit: "rad/s", hint: "ωL = 1/ωC → ω = 1/√(LC).", why: "1/√(10⁻¹⁰) = 10⁵ rad/s. That's ω₀ from Chapter 12. Chapter 14 is all about what happens there." },
      ]},
      { k: "learn", title: "Words you'll see", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>decade</b></td><td>a factor of 10 in frequency (1 kHz → 10 kHz)</td></tr>
          <tr><td><b>octave</b></td><td>a factor of 2 (1 kHz → 2 kHz)</td></tr>
          <tr><td><b>decibel</b></td><td class="mono">dB = 20·log₁₀|H|</td></tr></tbody></table></div>`,
        `<p>Slope −1 on log–log = "−20 dB per decade".</p>`,
        { t: "num", q: "|H| = 0.01 is how many dB?", a: -40, unit: "dB", why: "20 × log₁₀(0.01) = 20 × (−2) = −40 dB." },
        { t: "mcq", q: "Phase of each element's impedance?", opts: [["R: 0°, L: +90°, C: −90°, at every frequency", true, "jωL points straight up, 1/jωC = −j/ωC points straight down."], ["All 0° at DC", false, "The angle of jωL is +90° for any ω > 0."], ["L: −90°, C: +90°", false, "Swapped."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why are frequency responses usually drawn on log–log axes?", model: "Circuits care about ratios of frequency, and log scales show many decades at once without squashing the low-frequency end. Also, impedances like ωL and 1/ωC become straight lines with slopes +1 and −1, so responses can be sketched from straight-line pieces." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Sketching first-order responses", mins: 20,
    blurb: "Two straight lines and a corner.",
    takeaway: "One storage element + one (Thévenin) resistor gives H like a/(s + a), s/(s + a), (s + a) or (s + a)/s. Magnitude: draw the low- and high-frequency asymptotes; they meet at the break frequency ω = a, where the true curve is 0.707 (−3 dB, half power). Phase: low and high asymptotes joined by a smooth curve through ±45° at ω = a.",
    steps: [
      { k: "learn", title: "Standard form", b: [
        `<p>Series RL with output across R: H = R/(R + sL). Divide top and bottom by L:</p>`,
        `<div class="eq">H(jω) = (R/L) / (jω + R/L)     form a/(s + a), with a = R/L</div>`,
        `<ul><li><b>ω ≪ a</b>: jω is tiny, H ≈ a/a = 1. Flat line at 1.</li><li><b>ω ≫ a</b>: a is tiny, H ≈ a/jω. Slope −1 line, passing through 1 at ω = a.</li></ul>`,
        `<p>The two asymptotes meet at <b>ω = a</b>: the <b>break</b> (corner) frequency.</p>`,
      ]},
      { k: "play", title: "Asymptotes vs the real curve", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), g = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 1000, kind = 0;
          function draw() {
            const H = (w) => (kind === 0 ? Z.div([a, 0], [a, w]) : Z.div([0, w], [a, w]));
            const asM = (w) => (kind === 0 ? (w < a ? 1 : a / w) : w < a ? w / a : 1);
            const asP = (w) => { const lo = kind === 0 ? 0 : 90, hi = kind === 0 ? -90 : 0; if (w <= a / 10) return lo; if (w >= a * 10) return hi; return lo + ((hi - lo) * (Math.log10(w / a) + 1)) / 2; };
            f.innerHTML = bmag({ x: [1, 6], y: [-3, 0.5], yt: [-3, -2, -1, 0], series: [{ f: asM, cls: "s5" }, { f: (w) => Z.abs(H(w)), cls: "s1" }], marks: [{ x: a, y: Z.abs(H(a)), label: "0.707", dy: 22 }] });
            g.innerHTML = bph({ x: [1, 6], series: [{ f: asP, cls: "s5" }, { f: (w) => Z.deg(H(w)), cls: "s1" }], marks: [{ x: a, y: Z.deg(H(a)), label: (kind === 0 ? "−" : "+") + "45°", dy: kind === 0 ? 20 : -10 }] });
            ro.innerHTML = readout([["form", kind === 0 ? "a/(s + a)  low-pass" : "s/(s + a)  high-pass"], ["break ω = a", fmt(a) + " rad/s"]]);
          }
          host.append(toggle(["a/(s + a)", "s/(s + a)"], (k) => { kind = k; draw(); }), f, g, slider({ id: id + "-a", label: "a", min: 100, max: 1e5, log: true, value: a, show: (x) => fmt(x, 3) + " rad/s" }, (x) => { a = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Dashed: the straight-line sketch. Solid: the true curve. The worst miss is at the corner itself: 0.707 instead of 1. (The phase sketch here ramps over one decade each side of the break, a common rule of thumb.)</p>`,
      ]},
      { k: "learn", title: "At the break frequency", b: [
        `<div class="eq">|a/(ja + a)| = 1/|1 + j| = 1/√2 ≈ 0.707     ∠ = −45°</div>`,
        `<p>Real and imaginary parts of the denominator are equal there. The same point has three more names: <b>−3 dB</b> frequency (20 log 0.707 ≈ −3), <b>half-power</b> point (0.707² = 0.5), and <b>cutoff</b> frequency.</p>`,
      ]},
      { k: "learn", title: "The recipe", b: [
        `<p><b>Magnitude</b>: 1. sketch the low-frequency asymptote. 2. sketch the high-frequency asymptote. They cross at ω = a.</p>`,
        `<p><b>Phase</b>: 1. low-frequency asymptote. 2. high-frequency asymptote. 3. a smooth curve between them through ±45° at ω = a.</p>`,
        `<p class="aside">Works for a/(s + a), s/(s + a), (s + a) and (s + a)/s: any circuit with one storage element and one Thévenin resistor.</p>`,
      ]},
      { k: "check", title: "Sketch an RL low-pass", b: [
        `<p>Series RL, output across R. R = 1 kΩ, L = 50 mH.</p>`,
        { t: "num", q: "Break frequency a = R/L?", a: 20000, unit: "rad/s", why: "1000/0.05 = 2 × 10⁴ rad/s." },
        { t: "num", q: "From the high-frequency asymptote, |H| at ω = 2 × 10⁵ rad/s ≈ ?", a: 0.1, tol: 0.03, hint: "a/ω.", why: "One decade past the corner on a slope of −1: 0.1. (True value 0.0995.)" },
        { t: "num", q: "Phase at ω = 2 × 10⁵ rad/s (true value)?", a: -84.3, tol: 0.01, unit: "°", hint: "−tan⁻¹(ω/a) = −tan⁻¹(10).", why: "−84.3°, almost at the −90° asymptote." },
      ]},
      { k: "check", title: "Sketch an RC high-pass", b: [
        divFig((x1, y, x2) => S.cap(x1, y, x2, y, "C"), rBot("R"), { V: "v_I", out: "v_R", label: "Series RC with output across R" }),
        `<p>Output across R: H = R/(R + 1/sC) = s/(s + 1/RC). R = 10 kΩ, C = 10 nF.</p>`,
        { t: "num", q: "Break frequency 1/RC?", a: 10000, unit: "rad/s", why: "1/(10⁴ × 10⁻⁸) = 10⁴ rad/s." },
        { t: "num", q: "Low-frequency asymptote ω/a: |H| at ω = 10³?", a: 0.1, tol: 0.03, why: "10³/10⁴ = 0.1. Slope +1 below the corner, flat at 1 above it." },
        { t: "num", q: "Phase at the break frequency?", a: 45, unit: "°", why: "+45°: halfway between +90° (low ω) and 0° (high ω)." },
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<p>A student sketches H = s/(s + a) and says: "At low frequency the magnitude is 1 and the phase is 0°, because s is small."</p>`,
        { t: "mcq", q: "What's wrong?", opts: [["When s is small the NUMERATOR is small too: H ≈ s/a, so |H| ≈ ω/a → 0 and the phase is +90°", true, "Always ask which terms survive in the numerator and the denominator separately."], ["Nothing: small s means H ≈ 1", false, "Check the numerator: it's s, not a."], ["The phase should be −90°", false, "s/a has angle +90° (j points up)."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you sketch the magnitude of a/(s + a) in a few seconds?", model: "Below the break frequency a, the jω term is negligible so H is about 1: a flat line. Above a, the a in the denominator is negligible so H is about a/ω: a line of slope −1. They meet at ω = a, and the real curve rounds the corner, passing 0.707 there." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Filters", mins: 25,
    blurb: "Pick out the frequencies you want.",
    takeaway: "Filters pass some frequencies and reject others: low-pass, high-pass, band-pass, band-stop. A simple RC low-pass has cutoff 1/RC. In a series L–R crossover, v_L is high-pass and v_R is low-pass, with break R/L. A coupling capacitor plus bias divider is a high-pass (break 1/(R₁∥R₂)C): it blocks the previous stage's DC while passing the signal, so stages can be biased independently.",
    steps: [
      { k: "learn", title: "Four shapes", b: [
        fig(S.svg(440, 110, [["Low-pass", (x) => 1 / Math.sqrt(1 + x ** 8)], ["High-pass", (x) => 1 / Math.sqrt(1 + x ** -8)], ["Band-pass", (x) => Math.exp(-((Math.log(x)) ** 2) * 4)], ["Band-stop", (x) => 1 - Math.exp(-((Math.log(x)) ** 2) * 4)]].map(([n, fn], k) => {
          const ox = 10 + k * 108; let pts = ""; for (let i = 0; i <= 60; i++) { const x = Math.exp((i / 60) * 4 - 2); pts += `${ox + i * 1.5},${78 - 55 * fn(x)} `; }
          return `<line x1="${ox}" y1="80" x2="${ox + 92}" y2="80" class="w dim"/><line x1="${ox}" y1="15" x2="${ox}" y2="80" class="w dim"/><polyline points="${pts}" style="fill:none;stroke:var(--accent);stroke-width:3"/>` + S.t(ox + 46, 100, n, { cls: "s" });
        }).join(""), { max: 440, label: "Magnitude shapes of low-pass, high-pass, band-pass and band-stop filters" })),
        `<p>Every radio, TV and phone uses filters to pull one station out of all the signals hitting the antenna. Each shape is |H| versus log ω.</p>`,
      ]},
      { k: "play", title: "Filter a hum from a whistle", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), g = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let fc = 1000, kind = 0;
          const fl = 100, fh = 2000, wl = 2 * Math.PI * fl, wh = 2 * Math.PI * fh;
          function draw() {
            const wc = 2 * Math.PI * fc, H = (w) => (kind === 0 ? Z.div([wc, 0], [wc, w]) : Z.div([0, w], [wc, w]));
            const hl = H(wl), hh = H(wh), al = Z.abs(hl), ah = Z.abs(hh), pl = Math.atan2(hl[1], hl[0]), phh = Math.atan2(hh[1], hh[0]);
            const vin = (tm) => Math.sin(wl * tm * 1e-3) + 0.5 * Math.sin(wh * tm * 1e-3), vo = (tm) => al * Math.sin(wl * tm * 1e-3 + pl) + 0.5 * ah * Math.sin(wh * tm * 1e-3 + phh);
            f.innerHTML = plot({ x: [0, 20], y: [-1.6, 1.6], xt: [0, 5, 10, 15, 20], yt: [-1, 0, 1], xl: "t (ms)", yl: "v", series: [{ f: vin, cls: "s5", n: 1400 }, { f: vo, cls: "s1", n: 1400 }], label: "Input (dashed) and filtered output" });
            g.innerHTML = bmag({ h: 200, x: [1, 5], y: [-2, 0.3], yt: [-2, -1, 0], series: [{ f: (w) => Z.abs(H(w)), cls: "s1" }], marks: [{ x: wl, y: al, label: "hum", dy: 20 }, { x: wh, y: ah, label: "whistle", dy: 20 }] });
            ro.innerHTML = readout([["hum (100 Hz) kept", fmt(al * 100, 2) + " %"], ["whistle (2 kHz) kept", fmt(ah * 100, 2) + " %"]]);
          }
          host.append(toggle(["RC low-pass", "RC high-pass"], (k) => { kind = k; draw(); }), f, g, slider({ id: id + "-f", label: "Cutoff f_c = 1/(2πRC)", min: 10, max: 30000, log: true, value: fc, show: (x) => si(x, "Hz") }, (x) => { fc = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Input: a 100 Hz hum (1 V) plus a 2 kHz whistle (0.5 V). Each frequency goes through the filter separately (superposition!) and gets its own |H| and ∠H. Find a cutoff that keeps only the hum, then one that keeps only the whistle.</p>`,
      ]},
      { k: "check", title: "Designing a cutoff", b: [
        { t: "mcq", q: "An RC low-pass has cutoff 1/RC. You double R. The cutoff…", opts: [["halves: bigger RC rejects lower frequencies", true, "The whole curve slides left on the log axis."], ["doubles", false, "Cutoff is 1/RC: bigger RC, lower cutoff."], ["stays the same", false, "It depends on RC."]] },
        { t: "num", q: "You want a 1 kHz cutoff with C = 100 nF. R = ?", a: 1.59, tol: 0.02, unit: "kΩ", hint: "1/RC = 2π × 1000.", why: "R = 1/(2π · 1000 · 10⁻⁷) ≈ 1.59 kΩ." },
      ]},
      { k: "learn", title: "A speaker crossover", b: [
        fig(S.svg(420, 170, S.wire([60, 82], [60, 30], [100, 30]) + S.ind(100, 30, 200, 30, "L") + S.wire([200, 30], [240, 30]) + S.res(240, 30, 340, 30, "R") + S.wire([340, 30], [370, 30], [370, 150], [60, 150], [60, 118]) + S.vsrc(60, 100, "from player", { side: "right" }) + S.t(150, 62, "+ v_L −", { cls: "a" }) + S.t(290, 62, "+ v_R −", { cls: "c" }) + S.t(150, 88, "→ tweeter", { cls: "s m" }) + S.t(290, 88, "→ woofer", { cls: "s m" }), { max: 420, label: "Series inductor and resistor; v_L goes to the tweeter, v_R to the woofer" })),
        `<p>One series L–R across the music signal, two outputs (each feeds its own amplifier):</p>`,
        `<div class="eq">V<sub>l</sub>/V<sub>i</sub> = jωL/(R + jωL)     V<sub>r</sub>/V<sub>i</sub> = R/(R + jωL)</div>`,
        { t: "mcq", q: "Which voltage should feed the tweeter (high notes)?", opts: [["v_L: at high ω the inductor is an open, so it takes nearly all of v_I", true, "And at low ω it's a short, so v_L → 0. A high-pass. v_R is the low-pass for the woofer."], ["v_R", false, "At high ω the inductor blocks the current, so v_R → 0."], ["Either, they're the same", false, "Their frequency responses are opposite."]] },
        { t: "num", q: "You want both to break at 3 kHz with R = 8 Ω. L = ?", a: 0.424, tol: 0.02, unit: "mH", hint: "Break at R/L = 2π × 3000 rad/s.", why: "L = 8/(2π × 3000) ≈ 0.42 mH." },
      ]},
      { k: "learn", title: "Coupling capacitors between stages", b: [
        fig(S.svg(420, 200, S.supply(200, 40, "V_S") + S.res(200, 40, 200, 100, "R₁", { side: "left" }) + S.res(200, 100, 200, 170, "R₂", { side: "left" }) + S.wire([200, 170], [200, 185], [60, 185]) + S.wire([60, 185], [60, 148]) + S.vsrc(60, 130, "v_I", { side: "left" }) + S.wire([60, 112], [60, 100], [100, 100]) + S.cap(100, 100, 160, 100, "C") + S.wire([160, 100], [270, 100]) + S.dot(200, 100) + S.t(280, 105, "to the gate: v_GS", { a: "start", cls: "a" }), { max: 420, label: "Input coupling capacitor C with bias divider R1 and R2" })),
        `<p>Chapter 7's problem: if stage A's output feeds stage B's gate directly, A's DC output level sets B's bias. Usually they clash. Fix: a <b>coupling capacitor</b> C, with the divider R₁–R₂ supplying B's bias.</p>`,
        `<p>Superposition: from V<sub>S</sub> alone (ω = 0, C open) V<sub>gs</sub> = R₂V<sub>S</sub>/(R₁ + R₂). From the input alone:</p>`,
        `<div class="eq">V<sub>gs</sub>/V<sub>i</sub> = jωR<sub>eq</sub>C / (1 + jωR<sub>eq</sub>C)     R<sub>eq</sub> = R₁ ∥ R₂</div>`,
        `<p>A <b>high-pass</b>: the DC part of v<sub>I</sub> gives exactly zero, while signals well above 1/R<sub>eq</sub>C pass unchanged.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>V<sub>S</sub> = 12 V, R₁ = 300 kΩ, R₂ = 100 kΩ, C = 1 µF. The previous stage's output is 5 V DC plus the signal.</p>`,
        { t: "num", q: "DC bias at the gate?", a: 3, unit: "V", why: "12 × 100/400 = 3 V. The previous stage's 5 V DC doesn't change it at all." },
        { t: "num", q: "R_eq = R₁ ∥ R₂ = ?", a: 75, unit: "kΩ", why: "300 × 100/400 = 75 kΩ." },
        { t: "num", q: "Break frequency in Hz, 1/(2πR_eq·C)?", a: 2.12, tol: 0.02, unit: "Hz", why: "1/(0.075 s) ≈ 13.3 rad/s ≈ 2.1 Hz. Audio (20 Hz and up) passes almost untouched." },
        { t: "mcq", q: "Once C acts as a short for the signal, the previous stage's small-signal load is…", opts: [["its own R_L in parallel with R₁ and R₂", true, "The bias divider loads the previous stage, lowering its gain a little. Coupling separates the DC, not the small-signal loading."], ["just R_L", false, "R₁ and R₂ are now connected to its output through C."], ["infinite", false, "The divider resistors draw signal current."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a coupling capacitor let you bias each amplifier stage independently?", model: "A capacitor is an open circuit at DC, so the previous stage's DC output level can't reach the next gate; that gate's DC bias is set only by its own R₁–R₂ divider. For signal frequencies well above 1/(R₁∥R₂)C the capacitor is nearly a short, so the varying signal passes through." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Time view vs frequency view: the scope probe", mins: 25,
    blurb: "A stray capacitance spoils a divider; one small capacitor fixes it.",
    takeaway: "A resistive divider with stray C₂ across R₂ loses gain at high ω. Adding C₁ across R₁ with R₁C₁ = R₂C₂ makes the ratio R₂/(R₁ + R₂) at every frequency. Time view: a step jumps to C₁/(C₁ + C₂) instantly (capacitive divider), then settles to R₂/(R₁ + R₂) with τ = (R₁∥R₂)(C₁ + C₂); compensation makes these equal, so no transient. Frequency view: flat |H|. Same circuit, two complementary pictures.",
    steps: [
      { k: "learn", title: "A divider with a stray capacitor", b: [
        fig(S.svg(400, 180, S.wire([60, 82], [60, 30], [100, 30]) + S.res(100, 30, 200, 30, "R₁") + S.wire([200, 30], [300, 30]) + S.res(240, 30, 240, 150, "R₂", { side: "left" }) + S.cap(300, 30, 300, 150, "C₂") + S.wire([60, 118], [60, 150], [300, 150]) + S.vsrc(60, 100, "v_i", { side: "right" }) + S.dot(240, 30) + S.t(300, 18, "v_o", { cls: "a" }) + S.dot(240, 150) + S.t(150, 72, "C₁ goes here?", { cls: "s m" }) + `<line x1="110" y1="56" x2="190" y2="56" class="w dim" style="stroke-dasharray:4 4"/>`, { max: 400, label: "Resistive divider with a parasitic capacitor across R2" })),
        `<p>A 10:1 oscilloscope probe: R₁ = 9 MΩ, R₂ = 1 MΩ, so v<sub>o</sub> = v<sub>i</sub>/10. But the scope input has about C₂ = 20 pF across R₂.</p>`,
        { t: "mcq", q: "Without C₁, what happens at high frequency?", opts: [["C₂ shorts the output: the ratio falls below 1/10 and the phase lags toward −90°", true, "V_o ≈ V_i/(jωR₁C₂). Fast edges get rounded off."], ["The ratio stays exactly 1/10", false, "Only at low ω."], ["The ratio rises", false, "C₂ shunts R₂, lowering the bottom impedance."]] },
      ]},
      { k: "learn", title: "The fix: C₁ across R₁", b: [
        `<p>Now both halves are R ∥ C. With Z₁ = R₁ ∥ 1/sC₁ and Z₂ = R₂ ∥ 1/sC₂:</p>`,
        `<div class="eq">V<sub>o</sub>/V<sub>i</sub> = R₂(R₁C₁s + 1) / [R₁(R₂C₂s + 1) + R₂(R₁C₁s + 1)]</div>`,
        `<p>Choose <b>R₁C₁ = R₂C₂</b>. Both brackets become the same factor, it cancels, and</p>`,
        `<div class="key">V<sub>o</sub>/V<sub>i</sub> = R₂/(R₁ + R₂) at every frequency</div>`,
        { t: "num", q: "R₁ = 9 MΩ, R₂ = 1 MΩ, C₂ = 20 pF. Compensating C₁?", a: 2.22, tol: 0.02, unit: "pF", why: "C₁ = R₂C₂/R₁ = 20/9 ≈ 2.2 pF. Real probes have a little trimmer screw for exactly this." },
      ]},
      { k: "play", title: "Tune the probe", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), g = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const R1 = 9e6, R2 = 1e6, C2 = 20e-12, Rp = (R1 * R2) / (R1 + R2), dc = R2 / (R1 + R2);
          let C1 = 4e-12, mode = 0;
          function draw() {
            const tau = Rp * (C1 + C2), jump = C1 / (C1 + C2), Tsq = 200e-6, pts = [];
            let vo = 0, vi = 0;
            for (let k = 0; k <= 4; k++) {
              const tA = k * Tsq; if (tA > 800e-6) break;
              const nvi = mode === 0 ? (k === 0 ? 1 : 1) : k % 2 === 0 ? 1 : 0;
              if (nvi !== vi) { pts.push([tA * 1e6, vo]); vo += (nvi - vi) * jump; vi = nvi; }
              const tB = mode === 0 ? 800e-6 : Math.min(800e-6, tA + Tsq);
              for (let n = 0; n <= 60; n++) { const t = tA + ((tB - tA) * n) / 60; pts.push([t * 1e6, dc * vi + (vo - dc * vi) * Math.exp(-(t - tA) / tau)]); }
              vo = dc * vi + (vo - dc * vi) * Math.exp(-(tB - tA) / tau);
              if (mode === 0) break;
            }
            f.innerHTML = plot({ x: [0, 800], y: [-0.02, 0.4], xt: [0, 200, 400, 600, 800], yt: [0, 0.1, 0.2, 0.3], xl: "t (µs)", yl: "v_o (V)", series: [{ f: (t) => (mode === 0 ? dc : Math.floor(t / 200) % 2 === 0 ? dc : 0), cls: "s5" }, { pts, cls: "s1" }], label: "Probe output for a 1 V input" });
            const H = (w) => Z.mul([jump, 0], Z.div([1 / (R1 * C1), w], [1 / tau, w]));
            g.innerHTML = bmag({ h: 200, x: [3, 7], y: [-2, 0], yt: [-2, -1, 0], series: [{ f: () => dc, cls: "s5" }, { f: (w) => Z.abs(H(w)), cls: "s1" }] });
            const st = Math.abs(C1 - (R2 * C2) / R1) / ((R2 * C2) / R1) < 0.04 ? "compensated" : C1 < (R2 * C2) / R1 ? "under-compensated (C₁ too small)" : "over-compensated (C₁ too large)";
            ro.innerHTML = readout([["jump at the edge C₁/(C₁+C₂)", fmt(jump)], ["final R₂/(R₁+R₂)", fmt(dc)], ["τ", fmt(tau * 1e6) + " µs"], ["status", st]]);
          }
          host.append(toggle(["Step input", "Square wave"], (k) => { mode = k; draw(); }), f, g, slider({ id: id + "-c", label: "C₁", min: 0.5e-12, max: 10e-12, log: true, value: C1, show: (x) => si(x, "F") }, (x) => { C1 = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Top: time view (1 V input). Bottom: frequency view, |V<sub>o</sub>/V<sub>i</sub>|. Dashed: the ideal 1/10. Find the C₁ that makes both pictures perfectly flat.</p>`,
      ]},
      { k: "why", title: "Why the output jumps", b: [
        `<p>Two capacitors in series directly across the source: a loop of capacitors and a voltage source. At the step, a huge brief current flows and both capacitors get the <b>same charge</b> q:</p>`,
        `<div class="eq">q = C₁v<sub>C1</sub> = C₂v<sub>o</sub>,  v<sub>C1</sub> + v<sub>o</sub> = V   ⟹   v<sub>o</sub>(0⁺) = C₁V/(C₁ + C₂)</div>`,
        `<p>So at the instant of the edge the circuit is a <b>capacitive</b> divider, and long after it's a <b>resistive</b> divider. Then it settles with τ = (R₁∥R₂)(C₁ + C₂).</p>`,
        `<p class="aside">It's first-order despite two capacitors: their voltages must add up to the source, so only one initial condition is free.</p>`,
        { t: "num", q: "With C₁ = 5 pF, C₂ = 20 pF and a 1 V step, v_o(0⁺) = ?", a: 0.2, unit: "V", why: "5/25 = 0.2 V. It then sags to 0.1 V: an overshoot, the over-compensated case." },
        { t: "num", q: "…and τ = (R₁∥R₂)(C₁ + C₂) = ?", a: 22.5, tol: 0.02, unit: "µs", why: "0.9 MΩ × 25 pF = 22.5 µs." },
      ]},
      { k: "learn", title: "Linking the two views", b: [
        `<p>A square wave is a sum of sine waves: one at its own frequency, one at 3× with 1/3 the size, one at 5× with 1/5, and so on (<b>harmonics</b>). Sharp edges are made of the high harmonics.</p>`,
        `<ul><li>Over-compensated: |H| is too <b>high</b> at high ω → the harmonics come out too big → spikes at the edges.</li><li>Under-compensated: |H| too <b>low</b> at high ω → rounded edges.</li></ul>`,
        `<p>In the lab the time view is quicker: feed a square wave and turn the trimmer until the corners are square. The frequency way: check that a low and a high sine wave give the same amplitude.</p>`,
      ]},
      { k: "whatif", title: "What if…", b: [
        { t: "mcq", q: "The probe's square-wave output shows rounded, slowly rising corners. Which way should C₁ go?", opts: [["Increase C₁: it's under-compensated, high frequencies are too weak", true, "Bigger C₁ → bigger instant jump C₁/(C₁ + C₂) → sharper edges."], ["Decrease C₁", false, "That would round the corners even more."], ["Change R₂", false, "That changes the 10:1 ratio."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain the compensation condition R₁C₁ = R₂C₂ in both the time view and the frequency view.", model: "Frequency view: when the two R∥C halves have the same time constant, their impedances keep the same ratio at every frequency, so the divider ratio is flat. Time view: at a step the capacitors make an instant capacitive divider C₁/(C₁ + C₂), and later the resistors set R₂/(R₁ + R₂). R₁C₁ = R₂C₂ makes those two equal, so there is no transient at all." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Power in an impedance", mins: 20,
    blurb: "Average power, rms, and why L and C burn nothing.",
    takeaway: "Power isn't linear, so work from time functions. For v = |V|cos ωt into Z = R + jX (angle θ): p(t) = DC term + a term at 2ω. Average p = ½|V||I|cos θ = ½Re[V·I*]. cos θ is the power factor. Resistor: p = |V|²/2R = V_rms²/R, with V_rms = |V|/√2. Pure L or C: zero average power (energy goes in and comes back), but average stored energy ¼C|V|² or ¼L|I|².",
    steps: [
      { k: "learn", title: "Careful: power isn't linear", b: [
        `<p>p = v·i is a <b>product</b>, so we can't just take Re[P e<sup>jωt</sup>]. Go back to time functions. With an impedance Z = R + jX at angle θ = tan⁻¹(X/R):</p>`,
        `<div class="eq">v = |V| cos ωt     i = (|V|/|Z|) cos(ωt − θ)</div>`,
        `<div class="eq">p(t) = ½ (|V|²/|Z|) [cos(2ωt − θ) + cos θ]</div>`,
        `<p>A constant part plus a wiggle at <b>twice</b> the drive frequency. The wiggle averages to zero.</p>`,
        `<p class="aside">X is called the <b>reactance</b>.</p>`,
      ]},
      { k: "play", title: "Slide the impedance angle", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let th = 0;
          function draw() {
            const r = (d) => (d * Math.PI) / 180, avg = 5 * Math.cos(r(th));
            f.innerHTML = plot({ x: [0, 720], y: [-11, 11], xt: [0, 180, 360, 540, 720], yt: [-10, -5, 0, 5, 10], xl: "ωt (°)", yl: "", series: [{ f: (d) => 10 * Math.cos(r(d)), cls: "s5" }, { f: (d) => 5 * Math.cos(r(d - th)), cls: "s2" }, { f: (d) => 10 * Math.cos(r(d)) * Math.cos(r(d - th)), cls: "s1" }, { f: () => avg, cls: "s4" }], label: "Voltage, current, instantaneous power and its average" });
            ro.innerHTML = readout([["θ", fmt(th) + "°"], ["power factor cos θ", fmt(Math.cos(r(th)))], ["average power", fmt(avg) + " W"], ["kind", Math.abs(th) < 1 ? "pure resistance" : th > 89 ? "pure inductance" : th < -89 ? "pure capacitance" : th > 0 ? "inductive (R + L)" : "capacitive (R + C)"]]);
          }
          host.append(f, slider({ id: id + "-t", label: "Angle of Z, θ", min: -90, max: 90, step: 1, value: th, show: (x) => fmt(x) + "°" }, (x) => { th = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">|V| = 10 V, |Z| = 10 Ω, so |I| = 1 A. Grey dashed: v. Blue: i (drawn ×5 so you can see it). Orange: p(t) in watts. Red dashed: the average. At ±90° the orange curve spends as long below zero as above: energy goes in, then comes straight back.</p>`,
      ]},
      { k: "learn", title: "Average power", b: [
        `<div class="key">p̄ = ½ |V| |I| cos θ = ½ Re[V·I*]</div>`,
        `<p>I* is the complex conjugate (flip the sign of the imaginary part). cos θ is the <b>power factor</b>. ½VI* is the <b>complex power</b>: its real part is the average ("real") power, its imaginary part the <b>reactive</b> power.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>10 V peak across Z = 30 + j40 Ω.</p>`,
        { t: "num", q: "|I| = ?", a: 0.2, unit: "A", why: "|Z| = 50 Ω, so 10/50 = 0.2 A." },
        { t: "num", q: "Average power?", a: 0.6, unit: "W", hint: "cos θ = R/|Z| = 30/50.", why: "½ × 10 × 0.2 × 0.6 = 0.6 W. Check: ½|I|²R = ½ × 0.04 × 30 = 0.6 W. All of it is burned in the 30 Ω." },
      ]},
      { k: "learn", title: "Resistors and rms", b: [
        `<p>θ = 0: p(t) = (|V|²/2R)(1 + cos 2ωt). Never negative, average |V|²/2R: half of what a DC voltage of the same peak would give.</p>`,
        `<div class="eq">V<sub>rms</sub> = |V|/√2     p̄ = V<sub>rms</sub>²/R   (just like DC)</div>`,
        `<p>In general V<sub>rms</sub> = √(average of v²), whatever the shape. Wall-socket voltages are quoted in rms.</p>`,
        { t: "num", q: "A 230 V rms supply. Peak voltage?", a: 325, tol: 0.01, unit: "V", why: "230 × √2 ≈ 325 V." },
        { t: "num", q: "A 1 kW kettle on 230 V rms. Its resistance?", a: 52.9, tol: 0.01, unit: "Ω", why: "R = V_rms²/p = 52 900/1000 ≈ 52.9 Ω." },
      ]},
      { k: "learn", title: "Pure L or C", b: [
        `<p>θ = ±90°: cos θ = 0, so <b>zero average power</b>. Inductors and capacitors soak up energy for a quarter cycle and hand it back the next.</p>`,
        `<p>Power companies dislike this. They still push that current to and fro along their lines, and the lines' i²R losses are real. (Customers pay in the end: rates include a loss factor.)</p>`,
        `<p>Energy is <b>stored</b> on average though. Capacitor: w = ½Cv² = ½C|V|²cos²ωt, which averages to</p>`,
        `<div class="eq">w̄<sub>C</sub> = ¼ C|V|²     w̄<sub>L</sub> = ¼ L|I|²</div>`,
        { t: "num", q: "A 2 µF capacitor with 10 V peak. Average stored energy?", a: 50, unit: "µJ", why: "¼ × 2µ × 100 = 50 µJ (it swings between 0 and 100 µJ)." },
      ]},
      { k: "check", title: "Series RC: the half-power point", b: [
        `<p>Series R and C driven by |V| cos ωt. Average power p̄ = ½|V|²cos θ/|Z|, all burned in R.</p>`,
        { t: "mcq", q: "At ω = 1/RC (so 1/ωC = R), the average power compared with the capacitor shorted (|V|²/2R) is…", opts: [["half", true, "|Z| = √2·R and cos θ = 1/√2, so p̄ = ½|V|²/(2R). That's why the break frequency is also called the half-power frequency."], ["the same", false, "The capacitor's impedance limits the current."], ["zero", false, "The resistor still burns power. Only the capacitor's average is zero."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "If an ideal capacitor takes zero average power, why does a power company care about capacitive or inductive loads?", model: "The current still flows back and forth every cycle, delivering energy to the reactive element and taking it back. That current heats the transmission lines through their resistance, so the company loses real power in its wires even though the customer's average power is zero." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ch13", eyebrow: "Chapter 13", title: "Sinusoidal Steady State: Impedance and Frequency Response",
    intro: `<p>Nine parts. Drive circuits with sine waves and describe them by what they do to each <b>frequency</b>. You'll meet complex amplitudes, <b>impedance</b>, log-scale frequency-response plots, quick sketches, filters, a scope-probe puzzle seen two ways, and power in AC circuits.</p><p class="aside">Uses Chapter 12's complex numbers and Euler's relation. Arrow keys ← → move between steps. Need a refresher? <a href="12-second-order-transients.html">Chapter 12</a>.</p>`,
    after: `<p>Open the Chapter 13 PDF and go to the <b>exercises and problems</b> at the end. For each circuit, draw the impedance model first, then check your answer at ω → 0 and ω → ∞ with opens and shorts.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9],
    summary: `
      <h3>Sinusoidal steady state</h3>
      <p>Linear circuit + sinusoid in → same-frequency sinusoid out (after the transient). Drive with V<sub>i</sub>e<sup>jωt</sup>: d/dt → s = jω, ODE → algebra. v(t) = Re[Ve<sup>jωt</sup>] = |V| cos(ωt + ∠V).</p>
      <h3>Impedance</h3>
      <div class="eq">Z_R = R · Z_L = sL = jωL · Z_C = 1/sC = 1/jωC</div>
      <p>Impedance model: same wiring, boxes, complex-amplitude sources. Then dividers, node method, Thévenin, superposition as usual. Low ω: C open, L short. High ω: C short, L open. |A/B| = |A|/|B|, ∠(A/B) = ∠A − ∠B.</p>
      <p>Notation: v<sub>D</sub> total, V<sub>D</sub> DC, v<sub>d</sub> small signal, V<sub>d</sub> complex amplitude.</p>
      <h3>Frequency response</h3>
      <p>H(jω) = V<sub>out</sub>/V<sub>in</sub>. Plot log|H| and ∠H against log ω. ωL: slope +1, 1/ωC: slope −1. Decade ×10, octave ×2, dB = 20 log₁₀|H|.</p>
      <h3>First-order sketch</h3>
      <p>a/(s + a), s/(s + a), (s + a), (s + a)/s. Low- and high-frequency asymptotes meet at ω = a; true |H| = 0.707 there (−3 dB, half power); phase ±45° there.</p>
      <h3>Applications</h3>
      <p>Amplifier with C<sub>GS</sub>: gain g<sub>m</sub>R<sub>L</sub>/(1 + jωR<sub>L</sub>C<sub>GS</sub>), falls above 1/R<sub>L</sub>C<sub>GS</sub>. RC low-pass cutoff 1/RC. L–R crossover: v<sub>L</sub> high-pass, v<sub>R</sub> low-pass, break R/L. Coupling C + bias divider: high-pass, break 1/(R₁∥R₂)C, blocks DC between stages.</p>
      <p>Compensated divider: R₁C₁ = R₂C₂ → flat ratio R₂/(R₁ + R₂). Step: instant C₁/(C₁ + C₂), settle with (R₁∥R₂)(C₁ + C₂). Square wave = harmonics 1, ⅓ at 3ω, ⅕ at 5ω…</p>
      <h3>Power</h3>
      <div class="eq">p̄ = ½|V||I| cos θ = ½Re[VI*] · V_rms = |V|/√2 · p̄_R = V_rms²/R</div>
      <p>p(t) has a DC part and a 2ω part. Pure L or C: p̄ = 0; w̄<sub>C</sub> = ¼C|V|², w̄<sub>L</sub> = ¼L|I|².</p>`,
  };
  Course.start(window.CHAPTER);
})();
