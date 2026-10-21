(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;

  const p1 = {
    id: "p1", title: "Derivatives become × s", mins: 25,
    blurb: "The property that makes Laplace worth it: d/dt turns into multiplication by s, and initial conditions come along.",
    takeaway: "ℒ{f′} = sF(s) − f(0); ℒ{f″} = s²F(s) − s·f(0) − f′(0); ℒ{∫₀ᵗ f dτ} = F(s)/s. Differentiating multiplies by s; integrating divides by s. Initial values appear on their own, so you never solve for constants at the end. Capacitor: i = C dv/dt → I(s) = C[sV(s) − v(0)]. Inductor: v = L di/dt → V(s) = L[sI(s) − i(0)].",
    steps: [
      { k: "learn", title: "The rule", b: [
        `<div class="tbl"><table><tr><th>In time</th><th>In s</th></tr><tr><td>f(t)</td><td>F(s)</td></tr><tr><td>f′(t)</td><td>sF(s) − f(0)</td></tr><tr><td>f″(t)</td><td>s²F(s) − s f(0) − f′(0)</td></tr><tr><td>∫₀ᵗ f dτ</td><td>F(s)/s</td></tr></table></div>`,
        `<p class="aside">f(0) means the value just before t = 0 (written 0⁻): the state the circuit was left in.</p>`,
      ]},
      { k: "math", title: "Where it comes from", b: [
        `<p>Integration by parts (Module 14, Part 5) on ∫₀^∞ f′(t)e<sup>−st</sup>dt with u = e<sup>−st</sup>, dv = f′dt:</p>`,
        { t: "reveal", label: "Apply by parts", html: `<div class="eq">[f(t)e<sup>−st</sup>]<sub>0</sub><sup>∞</sup> + s∫<sub>0</sub><sup>∞</sup> f(t)e<sup>−st</sup> dt = (0 − f(0)) + sF(s)</div>` },
        { t: "reveal", label: "f″: apply it twice", html: `<div class="eq">ℒ{f″} = sℒ{f′} − f′(0) = s[sF − f(0)] − f′(0) = s²F − s f(0) − f′(0)</div>` },
      ]},
      { k: "play", title: "Check it on e^(−at)", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let a = 2, s = 1;
          function draw() {
            ro.innerHTML = readout([["f = e^(−at), f(0) = 1", "F(s) = 1/(s + a) = " + fmt(1 / (s + a), 4)], ["Rule: sF(s) − f(0)", fmt(s / (s + a) - 1, 4)], ["Direct: f′ = −a e^(−at) → −a/(s + a)", fmt(-a / (s + a), 4)]]);
          }
          host.append(slider({ id: id + "-a", label: "a", min: 0.5, max: 5, step: 0.5, value: a }, (v) => { a = v; draw(); }).el, slider({ id: id + "-s", label: "s", min: 0.5, max: 5, step: 0.5, value: s }, (v) => { s = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The two always agree: s/(s + a) − 1 = −a/(s + a).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Transform the equation x′ + 3x = 0 with x(0) = 2.", opts: [["sX − 2 + 3X = 0, so X = 2/(s + 3)", true, "Then x = 2e^(−3t). The initial condition was used inside the algebra."], ["sX + 3X = 0", false, "You dropped the initial condition."], ["X = 2/(s − 3)", false, "Check the sign: (s + 3)X = 2."]] },
        { t: "mcq", q: "A capacitor C starts at v(0) = V₀. In s, its current is…", opts: [["I(s) = CsV(s) − CV₀", true, "C[sV(s) − v(0)]."], ["I(s) = CsV(s)", false, "That assumes v(0) = 0."], ["I(s) = V(s)/(Cs)", false, "Upside down: i = C dv/dt multiplies by Cs."]] },
        { t: "mcq", q: "ℒ{∫₀ᵗ e^(−τ) dτ} = ?", opts: [["1/(s(s + 1))", true, "Divide F = 1/(s + 1) by s."], ["s/(s + 1)", false, "Integrate → divide by s, not multiply."], ["1/(s + 1)²", false, "That's ℒ{t e^(−t)} (Part 3)."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the derivative rule make solving circuit equations easier?", model: "Every derivative turns into s times the transform minus the starting value, so a differential equation becomes ordinary algebra in s, and the initial conditions are already built into it. You solve for X of s directly instead of finding a general solution and fitting constants afterwards." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Shifts: damping and delay", mins: 25,
    blurb: "Multiply by e^(−at) in time → shift s by a. Delay by T in time → multiply by e^(−sT).",
    takeaway: "Frequency shift: ℒ{e^(−at)f(t)} = F(s + a). So ℒ{e^(−at)cos ωt} = (s + a)/((s + a)² + ω²) and ℒ{e^(−at)sin ωt} = ω/((s + a)² + ω²): damped sinusoids. Time shift: ℒ{f(t − T)u(t − T)} = e^(−sT)F(s): a delay of T multiplies by e^(−sT). A pulse of height V from 0 to T: V(1 − e^(−sT))/s.",
    steps: [
      { k: "learn", title: "Damping shifts s", b: [
        `<div class="eq">ℒ{e<sup>−at</sup> f(t)} = F(s + a)</div>`,
        `<p>Why: e<sup>−at</sup>e<sup>−st</sup> = e<sup>−(s+a)t</sup>, so the integral is F evaluated at s + a. Every s in F becomes (s + a).</p>`,
        `<div class="two"><div class="tile"><h3>cos ωt → s/(s² + ω²)</h3><div class="eq">e<sup>−at</sup>cos ωt → (s + a)/((s + a)² + ω²)</div></div><div class="tile"><h3>sin ωt → ω/(s² + ω²)</h3><div class="eq">e<sup>−at</sup>sin ωt → ω/((s + a)² + ω²)</div></div></div>`,
        `<p class="aside">That's why completing the square (Module 18, Part 2) matters: it puts the bottom in (s + a)² + ω² form.</p>`,
      ]},
      { k: "play", title: "Delay a step", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let T = 2, mode = 0;
          function draw() {
            const g = mode ? (t) => (t >= 0 && t < T ? 1 : 0) : (t) => (t >= T ? 1 : 0);
            f.innerHTML = plot({ x: [-1, 6], y: [0, 1.5], xt: [0, 1, 2, 3, 4, 5, 6], yt: [0, 1], xl: "t", h: 170, series: [{ f: g, cls: "s1", n: 700 }], label: mode ? "A pulse from 0 to T" : "A step delayed by T" });
            ro.innerHTML = readout(mode ? [["u(t) − u(t − T)", "(1 − e^(−" + fmt(T) + "s))/s"]] : [["u(t − T)", "e^(−" + fmt(T) + "s)/s"]]);
          }
          host.append(toggle(["Delayed step", "Pulse"], (i) => { mode = i; draw(); }), f, slider({ id: id + "-t", label: "T", min: 0.5, max: 5, step: 0.5, value: T }, (v) => { T = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">A pulse is "switch on at 0" minus "switch on at T". Linearity does the rest.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "ℒ{e^(−2t) sin 3t} = ?", opts: [["3/((s + 2)² + 9)", true, "Sine row with ω = 3, then s → s + 2."], ["3/(s² + 9) · 1/(s + 2)", false, "Multiplying in time is NOT multiplying transforms. Use the shift."], ["(s + 2)/((s + 2)² + 9)", false, "That's the cosine version."]] },
        { t: "mcq", q: "ℒ{e^(−t)·t} = ?", opts: [["1/(s + 1)²", true, "ℒ{t} = 1/s², shifted s → s + 1."], ["1/(s²(s + 1))", false, "That's a product of transforms, not a shift."], ["1/(s² + 1)", false, "Shift replaces s by (s + 1) everywhere."]] },
        { t: "mcq", q: "A 5 V source switched on at t = 3 ms. Its transform (t in ms)?", opts: [["5e^(−3s)/s", true, "Step 5/s, delayed by 3."], ["5/(s + 3)", false, "That's 5e^(−3t), a decay, not a delay."], ["5e^(3s)/s", false, "Delay gives e^(−sT)."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between multiplying f(t) by e^(−at) and delaying f(t) by T, in the s-domain?", model: "Multiplying by e to the minus a t shifts the transform: every s becomes s plus a. Delaying by T multiplies the transform by e to the minus s T. One shifts in s, the other multiplies in s." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Multiplying by t: repeated poles", mins: 20,
    blurb: "A factor of t in time means a derivative in s. That's where squared denominators come from.",
    takeaway: "ℒ{t·f(t)} = −dF/ds. So ℒ{t e^(−at)} = 1/(s + a)² and ℒ{tⁿe^(−at)} = n!/(s + a)ⁿ⁺¹: a repeated pole means t multiplies the exponential (the critically damped shape). ℒ{t sin ωt} = 2ωs/(s² + ω²)²: a double pole on the jω axis, an oscillation whose amplitude grows linearly, as when a lossless resonator is driven at its own frequency.",
    steps: [
      { k: "learn", title: "The rule", b: [
        `<div class="eq">ℒ{t f(t)} = −dF/ds</div>`,
        { t: "reveal", label: "Example: t e^(−at)", html: `<div class="eq">−d/ds [1/(s + a)] = 1/(s + a)²</div><p class="aside">Module 13: d/ds (s + a)⁻¹ = −(s + a)⁻².</p>` },
        `<div class="key">Double pole at −a ⟺ t·e<sup>−at</sup></div>`,
      ]},
      { k: "play", title: "Critically damped shape", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 1;
          function draw() {
            f.innerHTML = plot({ x: [0, 8], y: [0, 1.1], xt: [0, 2, 4, 6, 8], yt: [0, 0.5, 1], xl: "t", h: 200, series: [{ f: (t) => Math.exp(-a * t), cls: "s5" }, { f: (t) => a * t * Math.exp(-a * t) * Math.E, cls: "s1" }], marks: [{ x: 1 / a, y: 1 }], label: "e^(−at) dashed and t·e^(−at) scaled so its peak is 1" });
            ro.innerHTML = readout([["t e^(−at) ↔ 1/(s + a)²", "a = " + fmt(a)], ["Peak at t = 1/a (Module 13, Part 4)", fmt(1 / a, 3)]]);
          }
          host.append(f, slider({ id: id + "-a", label: "a", min: 0.3, max: 3, step: 0.1, value: a }, (v) => { a = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The orange curve (scaled to peak at 1) rises first, then the exponential wins.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Which time function has transform 1/(s + 4)²?", opts: [["t e^(−4t)", true, "Double pole at −4."], ["e^(−8t)", false, "That's 1/(s + 8)."], ["e^(−4t)²", false, "e^(−4t) squared is e^(−8t)."]] },
        { t: "mcq", q: "2/(s + 1)³ comes from…", opts: [["t² e^(−t)", true, "tⁿe^(−at) ↔ n!/(s + a)ⁿ⁺¹ with n = 2: 2!/(s + 1)³."], ["2t e^(−t)", false, "That's 2/(s + 1)²."], ["t³ e^(−t)", false, "That would be 6/(s + 1)⁴."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a repeated pole at s = −a tell you about the time response?", model: "Besides the plain exponential e to the minus a t, there's a term t times e to the minus a t. That's the shape of a critically damped response: it rises before the exponential decay takes over." },
      ]},
    ],
  };

  const FV = [
    ["10/(s(s + 2))", (t) => 5 * (1 - Math.exp(-2 * t)), "0", "5", true, "5(1 − e^(−2t))"],
    ["(s + 3)/((s + 1)(s + 2))", (t) => 2 * Math.exp(-t) - Math.exp(-2 * t), "1", "0", true, "2e^(−t) − e^(−2t)"],
    ["5/(s(s² + 2s + 5))", (t) => 1 - Math.exp(-t) * (Math.cos(2 * t) + 0.5 * Math.sin(2 * t)), "0", "1", true, "1 − e^(−t)(cos 2t + ½ sin 2t)"],
    ["2/(s² + 4)", (t) => Math.sin(2 * t), "0", "lim gives 0, but invalid", false, "sin 2t"],
    ["1/(s − 1)", (t) => Math.exp(t), "1", "lim gives 0, but invalid", false, "e^t"],
  ];
  const p4 = {
    id: "p4", title: "Initial and final value theorems", mins: 20,
    blurb: "Read f(0⁺) and f(∞) straight off F(s). Quick checks, with one trap.",
    takeaway: "Initial value: f(0⁺) = lim(s→∞) sF(s). Final value: f(∞) = lim(s→0) sF(s), valid ONLY if every pole of sF(s) is in the left half-plane. Poles on the jω axis (sustained oscillation) or in the right half (growth) mean there's no final value, even though the formula still gives a number. Use both theorems to check every inverse transform.",
    steps: [
      { k: "learn", title: "The two theorems", b: [
        `<div class="two"><div class="tile"><h3>Initial value</h3><div class="eq">f(0⁺) = lim<sub>s→∞</sub> sF(s)</div></div><div class="tile"><h3>Final value</h3><div class="eq">f(∞) = lim<sub>s→0</sub> sF(s)</div><p class="aside">only if all poles of sF(s) have negative real parts</p></div></div>`,
        `<p>Example: F = 10/(s(s + 2)). sF = 10/(s + 2): at s → ∞ it's 0, at s → 0 it's 5. So f starts at 0 and settles at 5.</p>`,
      ]},
      { k: "play", title: "Try five transforms", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const show = (i) => {
            const [F, g, f0, finf, ok, ft] = FV[i];
            f.innerHTML = plot({ x: [0, 8], y: [-2, 6], xt: [0, 2, 4, 6, 8], yt: [-2, 0, 2, 4, 6], xl: "t", h: 210, series: [{ f: g, cls: "s1" }], label: "Time function for the chosen transform" });
            ro.innerHTML = readout([["F(s)", F], ["f(t)", ft], ["f(0⁺) from sF(s), s → ∞", f0], ["f(∞) from sF(s), s → 0", finf], ["Final value theorem valid?", ok ? "yes: poles of sF(s) in left half" : "no: poles on the jω axis or in the right half"]]);
          };
          host.append(toggle(FV.map((x) => x[0]), show, 0), f, ro);
          show(0);
        },
        `<p class="aside">The last two show the trap: the formula happily returns 0, but sin 2t never settles and e<sup>t</sup> runs away.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "F(s) = (3s + 12)/(s(s + 4)). Final value f(∞)?", a: 3, hint: "sF = (3s + 12)/(s + 4), s → 0.", why: "12/4 = 3. Valid: the only pole of sF is at −4." },
        { t: "num", q: "Same F. Initial value f(0⁺)?", a: 3, hint: "sF as s → ∞: divide top and bottom by s.", why: "3s/s → 3. (Indeed f = 3: the s + 4 cancels!)" },
        { t: "mcq", q: "F(s) = 1/(s(s − 2)). Final value?", opts: [["None: sF has a pole at +2, so f grows", true, "The theorem doesn't apply. f = ½(e^(2t) − 1)."], ["−0.5", false, "That's what the formula gives, but it's invalid here."], ["0", false, "Check the right-half-plane pole."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "When can't you trust the final value theorem?", model: "When s times F of s has any pole on the imaginary axis or in the right half-plane. Then the time function keeps oscillating or keeps growing, so it has no final value, even though plugging s equals zero into the formula still gives a number." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m20", eyebrow: "Math Toolkit · Module 20", title: "Laplace Properties",
    intro: `<p>Four parts: derivatives become ×s, shifts for damping and delay, multiplying by t, and the initial and final value theorems. With these and the table from <a href="19-laplace-intro.html">Module 19</a>, you can transform any circuit equation.</p>`,
    after: `<p>The derivative rule is the one to know cold: sF(s) − f(0).</p>`,
    parts: [p1, p2, p3, p4],
    summary: `
      <div class="tbl"><table><tr><th>Time</th><th>s</th></tr>
        <tr><td>af + bg</td><td>aF + bG</td></tr><tr><td>f′</td><td>sF − f(0)</td></tr><tr><td>f″</td><td>s²F − s f(0) − f′(0)</td></tr><tr><td>∫₀ᵗ f</td><td>F/s</td></tr>
        <tr><td>e<sup>−at</sup>f(t)</td><td>F(s + a)</td></tr><tr><td>f(t − T)u(t − T)</td><td>e<sup>−sT</sup>F(s)</td></tr><tr><td>t f(t)</td><td>−dF/ds</td></tr>
        <tr><td>e<sup>−at</sup>cos ωt</td><td>(s + a)/((s + a)² + ω²)</td></tr><tr><td>e<sup>−at</sup>sin ωt</td><td>ω/((s + a)² + ω²)</td></tr><tr><td>tⁿe<sup>−at</sup></td><td>n!/(s + a)ⁿ⁺¹</td></tr></table></div>
      <p>f(0⁺) = lim<sub>s→∞</sub> sF(s). f(∞) = lim<sub>s→0</sub> sF(s) only if all poles of sF(s) are in the left half-plane.</p>`,
  };
  Course.start(window.CHAPTER);
})();
