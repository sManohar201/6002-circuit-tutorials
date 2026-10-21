(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  /* Numerical ∫₀^T g(t) dt by the midpoint rule. */
  const integ = (g, T, n = 4000) => { let s = 0; const h = T / n; for (let i = 0; i < n; i++) s += g((i + 0.5) * h); return s * h; };
  const arrowR = (x1, y, x2, lab) => `<line class="w" x1="${x1}" y1="${y}" x2="${x2 - 8}" y2="${y}"/><polygon class="nd" points="${x2},${y} ${x2 - 10},${y - 6} ${x2 - 10},${y + 6}"/>` + S.t((x1 + x2) / 2, y - 8, lab);

  const p1 = {
    id: "p1", title: "Why transform?", mins: 20,
    blurb: "Swap a hard problem for an easy one, solve it, swap back. And meet s, the complex frequency.",
    takeaway: "The Laplace transform turns a linear differential equation in t into an algebra problem in s. Solve the algebra, then transform back. It's like logs: multiplication is hard, so take logs, add, then take the antilog. The variable s = σ + jω is a complex frequency: e^(st) = e^(σt)·e^(jωt), a sinusoid at ω inside an envelope e^(σt) (σ < 0 decays, σ = 0 steady, σ > 0 grows). One s covers exponentials, sinusoids and damped sinusoids together.",
    steps: [
      { k: "learn", title: "The detour", b: [
        fig(S.svg(560, 200, S.box(10, 20, 170, 56, "") + S.t(95, 44, "Differential eq.") + S.t(95, 62, "in t (hard)") + arrowR(180, 48, 370, "Laplace ℒ") + S.box(370, 20, 180, 56, "") + S.t(460, 44, "Algebra in s") + S.t(460, 62, "(easy)") +
          `<line class="w" x1="460" y1="76" x2="460" y2="112"/><polygon class="nd" points="460,122 454,112 466,112"/>` + S.t(450, 104, "solve for X(s)", { a: "end" }) +
          S.box(370, 124, 180, 56, "") + S.t(460, 156, "X(s)") + `<line class="w" x1="370" y1="152" x2="190" y2="152"/><polygon class="nd" points="180,152 190,146 190,158"/>` + S.t(275, 144, "inverse ℒ⁻¹") + S.box(10, 124, 170, 56, "") + S.t(95, 148, "Answer x(t)") + S.t(95, 166, "with ICs built in"), { label: "Roadmap: transform, solve the algebra, transform back" })),
        `<p>Derivatives become multiplication by s, and initial conditions drop into the algebra automatically. One method for transients, steady state and frequency response.</p>`,
      ]},
      { k: "play", title: "What e^(st) looks like", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let sig = -0.3, w = 3;
          function draw() {
            f.innerHTML = plot({ x: [0, 8], y: [-3, 3], xt: [0, 2, 4, 6, 8], yt: [-2, 0, 2], xl: "t", h: 220, series: [{ f: (t) => Math.exp(sig * t), cls: "s5" }, { f: (t) => -Math.exp(sig * t), cls: "s5" }, { f: (t) => Math.exp(sig * t) * Math.cos(w * t), cls: "s1" }], label: "Real part of e to the s t: a sinusoid inside an exponential envelope" });
            ro.innerHTML = readout([["s = σ + jω", `${fmt(sig, 3)} ${w < 0 ? "−" : "+"} j${fmt(Math.abs(w), 3)}`], ["Re e^(st) = e^(σt)cos ωt", sig < 0 ? "decays" : sig > 0 ? "grows" : "steady"], ["ω = 0", w === 0 ? "pure exponential (no oscillation)" : "oscillates at ω = " + fmt(w, 3) + " rad/s"]]);
          }
          host.append(f, slider({ id: id + "-s", label: "σ (real part)", min: -1, max: 0.3, step: 0.05, value: sig }, (v) => { sig = v; draw(); }).el, slider({ id: id + "-w", label: "ω (imaginary part)", min: 0, max: 6, step: 0.25, value: w }, (v) => { w = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">σ sets the envelope (dashed), ω sets the wiggle. Every natural response you met in Module 15 is one of these shapes.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "What does e^(st) do for each s?", bins: ["Decays, no wiggle", "Steady sinusoid", "Decaying sinusoid", "Grows"], items: [["s = −2", 0, "σ = −2, ω = 0."], ["s = j5", 1, "σ = 0."], ["s = −1 + j3", 2, "σ < 0 and ω ≠ 0."], ["s = 0.5", 3, "σ > 0."], ["s = −0.2 − j8", 2, "Same as −0.2 + j8 for the real part."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is it useful that s is a complex number σ + jω?", model: "Because e to the s t then covers every shape a linear circuit produces: the real part sigma sets growth or decay, the imaginary part omega sets oscillation. One variable handles exponentials, sinusoids and damped sinusoids at once." },
      ]},
    ],
  };

  const FS = [
    ["f(t) = 1", (t) => 1, (s) => 1 / s, "1/s"],
    ["e^(−2t)", (t) => Math.exp(-2 * t), (s) => 1 / (s + 2), "1/(s + 2)"],
    ["t", (t) => t, (s) => 1 / (s * s), "1/s²"],
    ["cos 3t", (t) => Math.cos(3 * t), (s) => s / (s * s + 9), "s/(s² + 9)"],
  ];
  const p2 = {
    id: "p2", title: "The defining integral", mins: 25,
    blurb: "Multiply f(t) by a decaying e^(−st) and take the total area. That area, as a function of s, is F(s).",
    takeaway: "F(s) = ℒ{f(t)} = ∫₀^∞ f(t)e^(−st) dt. For each s, e^(−st) weighs f(t) down over time and the integral adds up what's left. ℒ{1} = 1/s; ℒ{e^(−at)} = 1/(s + a) (both need s large enough for the area to be finite: s > 0, s > −a). Lower-case f(t) in time, upper-case F(s) for its transform.",
    steps: [
      { k: "learn", title: "The definition", b: [
        `<div class="eq">F(s) = ∫<sub>0</sub><sup>∞</sup> f(t) e<sup>−st</sup> dt</div>`,
        `<p>Read it as: weight f(t) by e<sup>−st</sup>, add up the area from 0 to ∞. Bigger s = faster fading weight = smaller area. Only t ≥ 0 counts.</p>`,
      ]},
      { k: "play", title: "See the area", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let k = 1, s = 1;
          function draw() {
            const [nm, g, F, Fs] = FS[k], prod = (t) => g(t) * Math.exp(-s * t);
            f.innerHTML = plot({ x: [0, 6], y: [-1, 2], xt: [0, 1, 2, 3, 4, 5, 6], yt: [-1, 0, 1, 2], xl: "t", h: 230, areas: [{ f: prod, from: 0, to: 6, cls: "ar1" }], series: [{ f: g, cls: "s2" }, { f: (t) => Math.exp(-s * t), cls: "s5" }, { f: prod, cls: "s1" }], label: "f(t) in blue, the weight e^(−st) dashed, and their product with its area shaded" });
            ro.innerHTML = readout([["f(t)", nm], ["Area of f(t)e^(−st), numerically", fmt(integ(prod, 60), 4)], ["Formula F(s) = " + Fs, fmt(F(s), 4)]]);
          }
          host.append(toggle(FS.map((x) => x[0]), (i) => { k = i; draw(); }, 1), f, slider({ id: id + "-s", label: "s (real, for the picture)", min: 0.3, max: 5, step: 0.1, value: s }, (v) => { s = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Each s gives one number. Sweep s and those numbers trace out F(s). Real s is enough to see the idea; the formulas hold for complex s too.</p>`,
      ]},
      { k: "math", title: "Two transforms by hand", b: [
        { t: "reveal", label: "ℒ{1}", html: `<div class="eq">∫<sub>0</sub><sup>∞</sup> e<sup>−st</sup> dt = [−e<sup>−st</sup>/s]<sub>0</sub><sup>∞</sup> = 0 − (−1/s) = 1/s</div>` },
        { t: "reveal", label: "ℒ{e^(−at)}", html: `<div class="eq">∫<sub>0</sub><sup>∞</sup> e<sup>−at</sup>e<sup>−st</sup> dt = ∫<sub>0</sub><sup>∞</sup> e<sup>−(s+a)t</sup> dt = 1/(s + a)</div><p class="aside">Exponent rule (Module 2, Part 4), then the improper integral (Module 14, Part 5).</p>` },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "ℒ{e^(−5t)} = ?", opts: [["1/(s + 5)", true, "a = 5."], ["1/(s − 5)", false, "That's ℒ{e^(+5t)}."], ["5/s", false, "That's ℒ{5}."]] },
        { t: "num", q: "ℒ{e^(−2t)} evaluated at s = 3?", a: 0.2, why: "1/(3 + 2) = 0.2. That's the area under e^(−5t)." },
        { t: "mcq", q: "ℒ{7} = ?", opts: [["7/s", true, "Constants come out of the integral: 7 × 1/s."], ["7", false, "That's ℒ{7δ(t)}."], ["1/(s + 7)", false, "That's ℒ{e^(−7t)}."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In words, what does the Laplace transform do to a function f(t)?", model: "For each value of s, it multiplies f of t by the fading weight e to the minus s t and adds up the total area from zero to infinity. The result, as a function of s, is the transform F of s." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Building the table", mins: 25,
    blurb: "Six transforms cover nearly every circuit problem. Euler's formula hands you sine and cosine for free.",
    takeaway: "ℒ{δ(t)} = 1; ℒ{u(t)} = 1/s; ℒ{t} = 1/s²; ℒ{tⁿ} = n!/sⁿ⁺¹; ℒ{e^(−at)} = 1/(s + a); ℒ{cos ωt} = s/(s² + ω²); ℒ{sin ωt} = ω/(s² + ω²). Sine and cosine come from e^(jωt) = cos ωt + j sin ωt with ℒ{e^(jωt)} = 1/(s − jω) = (s + jω)/(s² + ω²): real part → cos, imaginary part → sin. Linearity: ℒ{af + bg} = aF + bG.",
    steps: [
      { k: "learn", title: "Steps and impulses", b: [
        fig(plot({ x: [-1, 4], y: [0, 1.5], xt: [0, 1, 2, 3], yt: [0, 1], h: 150, series: [{ pts: [[-1, 0], [0, 0], [0, 1], [4, 1]], cls: "s1" }], texts: [{ x: 1, y: 1.2, s: "u(t): switch on at t = 0" }], label: "Unit step" })),
        `<p>u(t) is 0 before t = 0 and 1 after: a switch closing. δ(t) is a pulse so short and tall that its area is exactly 1: a sudden kick. Its transform is 1.</p>`,
      ]},
      { k: "math", title: "Sine and cosine from Euler", b: [
        `<p>e<sup>jωt</sup> is e<sup>−at</sup> with a = −jω, so ℒ{e<sup>jωt</sup>} = 1/(s − jω). Make the bottom real (6.002 Appendix C, conjugate):</p>`,
        { t: "reveal", label: "Multiply top and bottom by (s + jω)", html: `<div class="eq">1/(s − jω) = (s + jω)/(s² + ω²) = s/(s² + ω²) + j·ω/(s² + ω²)</div>` },
        { t: "reveal", label: "Match with cos ωt + j sin ωt", html: `<div class="eq">ℒ{cos ωt} = s/(s² + ω²)     ℒ{sin ωt} = ω/(s² + ω²)</div>` },
      ]},
      { k: "learn", title: "The table", b: [
        `<div class="tbl"><table><tr><th>f(t), t ≥ 0</th><th>F(s)</th></tr>
          <tr><td>δ(t)</td><td>1</td></tr><tr><td>u(t) or 1</td><td>1/s</td></tr><tr><td>t</td><td>1/s²</td></tr><tr><td>tⁿ</td><td>n!/sⁿ⁺¹</td></tr>
          <tr><td>e<sup>−at</sup></td><td>1/(s + a)</td></tr><tr><td>cos ωt</td><td>s/(s² + ω²)</td></tr><tr><td>sin ωt</td><td>ω/(s² + ω²)</td></tr></table></div>`,
        `<p class="aside">Linearity: constants and sums pass straight through. ℒ{3 − 2e<sup>−4t</sup>} = 3/s − 2/(s + 4).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "ℒ{4 cos 5t} = ?", opts: [["4s/(s² + 25)", true, "Cosine row with ω = 5, times 4."], ["4·5/(s² + 25)", false, "That's 4 sin 5t."], ["4/(s² + 5)", false, "ω is squared in the bottom."]] },
        { t: "mcq", q: "ℒ{t³} = ?", opts: [["6/s⁴", true, "3! = 6, s^(3+1)."], ["3/s⁴", false, "n!, not n."], ["1/s³", false, "Power goes to n + 1."]] },
        { t: "mcq", q: "ℒ{10 − 10e^(−t/τ)} (an RC charging curve) = ?", opts: [["10/s − 10/(s + 1/τ)", true, "a = 1/τ."], ["10/s − 10/(s + τ)", false, "e^(−t/τ) has a = 1/τ."], ["10/(s(s + τ))", false, "Close in spirit, but check a."]] },
        { t: "num", q: "ℒ{sin 2t} at s = 0 (real)?", a: 0.5, why: "2/(0 + 4) = 0.5." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you get the transforms of cos ωt and sin ωt without integrating them directly?", model: "Use Euler: e to the j omega t is cos plus j sin. Its transform follows from the exponential rule, one over s minus j omega. Rationalising gives s over s squared plus omega squared plus j omega over the same thing; the real part is the cosine's transform and the imaginary part the sine's." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Poles tell the story", mins: 20,
    blurb: "Where F(s) blows up (its poles) tells you what f(t) does, before you transform anything back.",
    takeaway: "A pole is an s where F(s) → ∞ (a root of its denominator). Pole at s = −a → e^(−at). At 0 → a constant (step). At ±jω → a steady sinusoid. At −α ± jω → e^(−αt)·sinusoid. Left half-plane (real part < 0) → dies away; right half → grows; on the jω axis → neither. Further left = faster decay; further from the real axis = faster oscillation.",
    steps: [
      { k: "learn", title: "Poles from the table", b: [
        `<div class="tbl"><table><tr><th>F(s)</th><th>Poles</th><th>f(t)</th></tr>
          <tr><td>1/s</td><td>0</td><td>constant</td></tr><tr><td>1/(s + 3)</td><td>−3</td><td>e<sup>−3t</sup></td></tr><tr><td>ω/(s² + ω²)</td><td>±jω</td><td>sin ωt</td></tr><tr><td>ω/((s + α)² + ω²)</td><td>−α ± jω</td><td>e<sup>−αt</sup>sin ωt</td></tr></table></div>`,
      ]},
      { k: "play", title: "Move the poles", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), g = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let sig = -0.5, w = 2;
          function draw() {
            const marks = w === 0 ? [{ x: sig, y: 0, cls: "mkb", r: 7 }] : [{ x: sig, y: w, cls: "mkb", r: 7 }, { x: sig, y: -w, cls: "mkb", r: 7 }];
            g.innerHTML = plot({ x: [-3, 1], y: [-4, 4], xt: [-3, -2, -1, 0, 1], yt: [-4, -2, 0, 2, 4], xl: "σ", yl: "jω", h: 220, w: 300, areas: [{ f: () => 4, from: 0, to: 1, base: -4, cls: "ar2" }], marks, label: "s-plane with the pole positions; the shaded right half means growth" });
            f.innerHTML = plot({ x: [0, 8], y: [-3, 3], xt: [0, 2, 4, 6, 8], yt: [-2, 0, 2], xl: "t", h: 200, series: [{ f: (t) => Math.exp(sig * t) * Math.cos(w * t), cls: "s1" }], label: "Time function for those poles" });
            ro.innerHTML = readout([["Poles", w === 0 ? fmt(sig, 3) : `${fmt(sig, 3)} ± j${fmt(w, 3)}`], ["Behaviour", (sig < 0 ? "dies away" : sig > 0 ? "grows (unstable)" : "neither grows nor decays") + (w ? ", oscillating" : "")]]);
          }
          host.append(g, f, slider({ id: id + "-s", label: "Real part σ", min: -3, max: 0.5, step: 0.1, value: sig }, (v) => { sig = v; draw(); }).el, slider({ id: id + "-w", label: "Imaginary part ω", min: 0, max: 4, step: 0.25, value: w }, (v) => { w = v; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "F(s) = 1/(s² + 4s + 13). Without inverting, f(t)…", opts: [["Is a decaying sinusoid at 3 rad/s (poles −2 ± j3)", true, "Completing the square: (s + 2)² + 9."], ["Grows", false, "Real part −2 < 0."], ["Is a pure exponential", false, "The poles are complex."]] },
        { t: "mcq", q: "A circuit's transform has a pole at s = +0.5. Its response…", opts: [["Grows like e^(0.5t): unstable", true, "Right half-plane."], ["Decays", false, "Positive real part means growth."], ["Oscillates steadily", false, "That needs poles on the jω axis."]] },
        { t: "mcq", q: "Poles at −1 ± j10 vs −1 ± j2: the first one…", opts: [["Oscillates 5× faster, same decay rate", true, "Same real part, larger imaginary part."], ["Decays 5× faster", false, "Decay depends on the real part, which is equal."], ["Is unstable", false, "Both are in the left half."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What can you tell about f(t) just from the poles of F(s)?", model: "The real part of each pole sets growth or decay, negative means it dies away, positive means it grows. The imaginary part sets oscillation frequency, zero means no oscillation. So the pole map shows the shape of the response before doing any inverse transform." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m19", eyebrow: "Math Toolkit · Module 19", title: "Laplace: the Idea and the Table",
    intro: `<p>Four parts: why transform at all, the defining integral, building the table of transforms, and reading pole positions. Before this, do <a href="14-integrals.html">Module 14</a> (especially Part 5) and <a href="../chapters/appC-complex-numbers.html">complex numbers</a>.</p><p class="aside">Neither book teaches Laplace transforms. 6.002 Chapter 13 mentions in a footnote that s = σ + jω gives the full response, and Boylestad Chapter 10 uses s for jω. This track explains what's behind both.</p>`,
    after: `<p>Learn the seven table rows by heart. Everything else in the track is built from them.</p>`,
    parts: [p1, p2, p3, p4],
    summary: `
      <div class="eq">F(s) = ∫<sub>0</sub><sup>∞</sup> f(t)e<sup>−st</sup> dt     s = σ + jω</div>
      <div class="tbl"><table><tr><th>f(t)</th><th>F(s)</th></tr><tr><td>δ(t)</td><td>1</td></tr><tr><td>u(t)</td><td>1/s</td></tr><tr><td>t</td><td>1/s²</td></tr><tr><td>tⁿ</td><td>n!/sⁿ⁺¹</td></tr><tr><td>e<sup>−at</sup></td><td>1/(s + a)</td></tr><tr><td>cos ωt</td><td>s/(s² + ω²)</td></tr><tr><td>sin ωt</td><td>ω/(s² + ω²)</td></tr></table></div>
      <p>Linearity: ℒ{af + bg} = aF + bG. Poles: real part &lt; 0 decays, &gt; 0 grows, = 0 steady; imaginary part = oscillation frequency.</p>`,
  };
  Course.start(window.CHAPTER);
})();
