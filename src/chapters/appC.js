(function () {
  const { plot, slider, toggle, readout, fmt, el } = Course;
  const deg = (r) => (r * 180) / Math.PI, rad = (d) => (d * Math.PI) / 180;
  const cs = (a, b) => `${fmt(a, 3)} ${b < 0 ? "−" : "+"} j${fmt(Math.abs(b), 3)}`;
  const ang = (a, b) => deg(Math.atan2(b, a));

  /* square complex plane, range ±R. vecs: [{z:[a,b], from:[a,b], cls, label}] */
  function plane(R, vecs, o = {}) {
    const t = R <= 3 ? 1 : R <= 6 ? 2 : 5, ticks = [];
    for (let k = -Math.floor(R / t) * t; k <= R + 1e-9; k += t) ticks.push(k);
    const series = [], marks = [], texts = [];
    (o.circle ? [o.circle] : []).forEach((r) => { const pts = []; for (let k = 0; k <= 120; k++) pts.push([r * Math.cos((k * Math.PI) / 60), r * Math.sin((k * Math.PI) / 60)]); series.push({ pts, cls: "s5" }); });
    (o.lines || []).forEach((l) => series.push({ pts: l.pts, cls: l.cls || "s5" }));
    vecs.forEach((v) => {
      const f = v.from || [0, 0], tip = [f[0] + v.z[0], f[1] + v.z[1]];
      series.push({ pts: [f, tip], cls: v.cls || "s1" });
      marks.push({ x: tip[0], y: tip[1], r: 5, cls: v.mk || "mk" });
      if (v.label) texts.push({ x: tip[0] + R * 0.04, y: tip[1] + R * 0.05, s: v.label });
    });
    return plot({ w: 340, h: 326, x: [-R, R], y: [-R, R], xt: ticks, yt: ticks, xl: "Re", yl: "Im", series, marks, texts, label: o.label || "Complex plane" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "A complex number is a point", mins: 20,
    blurb: "Real part, imaginary part, magnitude and angle.",
    takeaway: "z = a + jb with j² = −1. Re(z) = a, Im(z) = b: the point's x and y on the complex plane. Magnitude |z| = √(a² + b²) is its distance from 0; angle ∠z is measured from the positive real axis. Use the quadrant: tan⁻¹(b/a) alone gets points with a < 0 wrong by 180°.",
    steps: [
      { k: "learn", title: "Two parts", b: [
        `<div class="key">z = a + jb      j² = −1</div>`,
        `<ul><li><b>a = Re(z)</b>, the real part.</li><li><b>b = Im(z)</b>, the imaginary part (a real number too: it's the size of the j part).</li></ul>`,
        `<p>Engineers write <b>j</b>, not i, because i is already current.</p>`,
        `<p>Think of z as a <b>point</b> (or an arrow from 0) on a plane: a across, b up.</p>`,
      ]},
      { k: "play", title: "Move the point", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 3, b = 2;
          function draw() {
            f.innerHTML = plane(5, [{ z: [a, b], label: "z" }], { lines: [{ pts: [[a, 0], [a, b]] }, { pts: [[0, b], [a, b]] }] });
            ro.innerHTML = readout([["z", cs(a, b)], ["|z| = √(a² + b²)", fmt(Math.hypot(a, b), 3)], ["∠z", fmt(ang(a, b), 3) + "°"], ["tan⁻¹(b/a) on a calculator", a === 0 ? "undefined" : fmt(deg(Math.atan(b / a)), 3) + "°"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "a = Re(z)", min: -4, max: 4, step: 0.5, value: a, show: (x) => fmt(x) }, (x) => { a = x; draw(); }).el,
            slider({ id: id + "-b", label: "b = Im(z)", min: -4, max: 4, step: 0.5, value: b, show: (x) => fmt(x) }, (x) => { b = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Drag a below zero. Compare the true angle with what a calculator's tan⁻¹(b/a) gives. When do they disagree?</p>`,
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<p>A student finds the angle of z = −3 + j3: "tan⁻¹(3/−3) = tan⁻¹(−1) = −45°."</p>`,
        { t: "mcq", q: "What's wrong?", opts: [["The point is up and to the left (second quadrant), so the angle is 135°, not −45°", true, "tan⁻¹ can't tell (−3, 3) from (3, −3): both have b/a = −1. Sketch the point first, then pick the angle in the right quadrant."], ["Nothing", false, "Plot it: −45° points down-right; z is up-left."], ["It should be +45°", false, "+45° is up-right, where a is positive."]] },
      ]},
      { k: "check", title: "Numbers", b: [
        `<p>z = −4 − j3.</p>`,
        { t: "num", q: "|z| = ?", a: 5, why: "√(16 + 9) = 5." },
        { t: "num", q: "∠z in degrees (between −180° and 180°)?", a: -143.13, tol: 0.003, unit: "°", hint: "Third quadrant: both parts negative.", why: "tan⁻¹(3/4) ≈ 36.87°. Down-left of the origin: −180° + 36.87° = −143.13° (same as 216.87°)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you find the angle of a complex number safely?", model: "Sketch the point first to see which quadrant it's in. tan⁻¹ of the imaginary over the real part gives a reference angle, but it can't tell opposite quadrants apart, so if the real part is negative you add or subtract 180°." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Polar form", mins: 20,
    blurb: "Write the same point as a length and an angle.",
    takeaway: "Polar ⇄ Cartesian: a = r cos θ, b = r sin θ; r = √(a² + b²), θ = angle in the right quadrant. With Euler's relation e^(jθ) = cos θ + j sin θ, z = a + jb = r e^(jθ) = |z| e^(j∠z). Rectangular suits adding; polar suits multiplying.",
    steps: [
      { k: "learn", title: "Same point, other coordinates", b: [
        `<div class="eq">a = r cos θ      b = r sin θ</div>`,
        `<p>So z = r cos θ + j r sin θ = r (cos θ + j sin θ). Euler's relation (Appendix B) folds the bracket into one exponential:</p>`,
        `<div class="key">z = r e<sup>jθ</sup> = |z| e<sup>j∠z</sup></div>`,
        `<p>Two ways to write <b>the same number</b>. Pick whichever makes the next step easy.</p>`,
      ]},
      { k: "play", title: "Set r and θ", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let r = 3, th = 60;
          function draw() {
            const a = r * Math.cos(rad(th)), b = r * Math.sin(rad(th));
            f.innerHTML = plane(5, [{ z: [a, b], label: "z" }], { circle: r, lines: [{ pts: [[a, 0], [a, b]] }] });
            ro.innerHTML = readout([["polar", `${fmt(r, 3)} e^(j${fmt(th, 3)}°)`], ["a = r cos θ", fmt(a, 3)], ["b = r sin θ", fmt(b, 3)], ["Cartesian", cs(a, b)]]);
          }
          host.append(f, slider({ id: id + "-r", label: "r = |z|", min: 0.5, max: 4.5, step: 0.1, value: r, show: (x) => fmt(x) }, (x) => { r = x; draw(); }).el,
            slider({ id: id + "-t", label: "θ = ∠z", min: -180, max: 180, step: 5, value: th, show: (x) => fmt(x) + "°" }, (x) => { th = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Dashed circle: every number with the same magnitude. Changing θ slides z around it.</p>`,
      ]},
      { k: "check", title: "Convert", b: [
        { t: "num", q: "z = 2 e^(j150°). Re(z) = ?", a: -1.732, tol: 0.002, why: "2 cos 150° = 2 × (−0.866) = −1.732." },
        { t: "num", q: "Same z. Im(z) = ?", a: 1, why: "2 sin 150° = 2 × 0.5 = 1. So z = −1.732 + j1." },
        { t: "num", q: "z = 1 + j√3. |z| = ?", a: 2, why: "√(1 + 3) = 2, and the angle is 60°: z = 2e^(j60°)." },
      ]},
      { k: "check", title: "Useful special cases", b: [
        { t: "sort", q: "Match each number to its polar form.", bins: ["e^(j90°)", "e^(j180°)", "e^(−j90°)"], items: [
          ["j", 0, "Straight up, length 1."],
          ["−1", 1, "Straight left: half a turn."],
          ["−j", 2, "Straight down. Also 1/j, since j × (−j) = 1."],
          ["1/j", 2, "Multiply top and bottom by −j: 1/j = −j."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What do r and θ mean in z = re^(jθ), and how do you get back to a + jb?", model: "r is the distance of the point from the origin and θ is its angle from the positive real axis. To get back, the real part is r cos θ and the imaginary part is r sin θ." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Arithmetic: add in boxes, multiply in circles", mins: 25,
    blurb: "Which form makes each operation easy.",
    takeaway: "Add/subtract in rectangular form: real parts together, imaginary parts together (like vectors). Multiply/divide in polar form: magnitudes multiply/divide, angles add/subtract. In rectangular form multiplication works too: expand and replace j² by −1.",
    steps: [
      { k: "learn", title: "The rules", b: [
        `<div class="eq">(a₁ + jb₁) ± (a₂ + jb₂) = (a₁ ± a₂) + j(b₁ ± b₂)</div>`,
        `<div class="eq">r₁e<sup>jθ₁</sup> · r₂e<sup>jθ₂</sup> = r₁r₂ e<sup>j(θ₁+θ₂)</sup>      r₁e<sup>jθ₁</sup> / r₂e<sup>jθ₂</sup> = (r₁/r₂) e<sup>j(θ₁−θ₂)</sup></div>`,
        `<p>Rectangular multiplication also works, just more algebra:</p>`,
        `<div class="eq">(a₁ + jb₁)(a₂ + jb₂) = (a₁a₂ − b₁b₂) + j(a₁b₂ + a₂b₁)</div>`,
      ]},
      { k: "play", title: "See each operation", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let op = 0, r2 = 1.5, t2 = 60;
          const z1 = [2, 1];
          function draw() {
            const z2 = [r2 * Math.cos(rad(t2)), r2 * Math.sin(rad(t2))];
            const r1 = Math.hypot(...z1), t1 = ang(...z1);
            let w;
            if (op === 0) w = [z1[0] + z2[0], z1[1] + z2[1]];
            else if (op === 1) w = [z1[0] - z2[0], z1[1] - z2[1]];
            else if (op === 2) w = [r1 * r2 * Math.cos(rad(t1 + t2)), r1 * r2 * Math.sin(rad(t1 + t2))];
            else w = [(r1 / r2) * Math.cos(rad(t1 - t2)), (r1 / r2) * Math.sin(rad(t1 - t2))];
            const vecs = [{ z: z1, cls: "s2", mk: "mk2", label: "z₁" }, { z: z2, cls: "s2", mk: "mk2", label: "z₂" }];
            if (op === 0) vecs.push({ z: z2, from: z1, cls: "s5", mk: "mk2" });
            if (op === 1) vecs.push({ z: [-z2[0], -z2[1]], from: z1, cls: "s5", mk: "mk2" });
            vecs.push({ z: w, label: ["z₁+z₂", "z₁−z₂", "z₁z₂", "z₁/z₂"][op] });
            f.innerHTML = plane(6, vecs);
            ro.innerHTML = readout([["z₁", `${cs(...z1)} = ${fmt(r1, 3)}∠${fmt(t1, 3)}°`], ["z₂", `${cs(...z2)} = ${fmt(r2, 3)}∠${fmt(t2, 3)}°`], ["result", `${cs(...w)} = ${fmt(Math.hypot(...w), 3)}∠${fmt(ang(...w), 3)}°`]]);
          }
          host.append(f, toggle(["z₁ + z₂", "z₁ − z₂", "z₁ × z₂", "z₁ ÷ z₂"], (k) => { op = k; draw(); }, 0),
            slider({ id: id + "-r", label: "|z₂|", min: 0.5, max: 3, step: 0.1, value: r2, show: (x) => fmt(x) }, (x) => { r2 = x; draw(); }).el,
            slider({ id: id + "-t", label: "∠z₂", min: -180, max: 180, step: 5, value: t2, show: (x) => fmt(x) + "°" }, (x) => { t2 = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">z₁ = 2 + j1 is fixed. Adding: put z₂'s arrow on the end of z₁ (dashed). Multiplying: the result's angle is ∠z₁ + ∠z₂ and its length is |z₁||z₂|. Try |z₂| = 1 with × and watch z₁ just rotate.</p>`,
      ]},
      { k: "check", title: "Pick the form", b: [
        { t: "mcq", q: "Impedances in series: Z = 30 + j40 Ω plus Z = 10 − j10 Ω. Easiest way?", opts: [["Rectangular: (30 + 10) + j(40 − 10) = 40 + j30 Ω", true, "Adding is just component by component."], ["Convert both to polar and add magnitudes", false, "Magnitudes don't add unless the angles match. 50 + 14.1 ≠ |40 + j30| = 50."], ["Multiply them", false, "Series impedances add."]] },
        { t: "num", q: "(2 e^(j30°)) × (3 e^(j45°)): magnitude?", a: 6, why: "Magnitudes multiply: 2 × 3 = 6. Angle: 30° + 45° = 75°." },
        { t: "num", q: "(10 e^(j20°)) / (4 e^(−j40°)): angle in degrees?", a: 60, unit: "°", why: "20° − (−40°) = 60°. Magnitude 2.5." },
        { t: "num", q: "(1 + j2)(3 − j): real part?", a: 5, hint: "Expand all four terms; j × (−j) = −j² = +1.", why: "3 − j + j6 − j² × 2 = 3 + 2 + j5 = 5 + j5." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is multiplying easy in polar form?", model: "Because e^(jθ₁)·e^(jθ₂) = e^(j(θ₁+θ₂)), exponents add. So you just multiply the lengths and add the angles. In rectangular form you have to expand four terms and use j² = −1." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "The conjugate and division", mins: 20,
    blurb: "Flip the sign of j, and clear j out of a denominator.",
    takeaway: "Conjugate z* = a − jb = r e^(−jθ): mirror in the real axis. zz* = |z|². Re(z) = (z + z*)/2, Im(z) = (z − z*)/2j. To divide in rectangular form, multiply top and bottom by the bottom's conjugate: the denominator becomes the real number |z₂|².",
    steps: [
      { k: "learn", title: "The mirror image", b: [
        `<div class="key">z* = a − jb = r e<sup>−jθ</sup></div>`,
        `<p>Replace every j with −j. On the plane: the reflection in the real axis. Same length, opposite angle.</p>`,
        `<div class="eq">z z* = (a + jb)(a − jb) = a² + b² = |z|²</div>`,
        `<div class="eq">Re(z) = (z + z*)/2      Im(z) = (z − z*)/2j</div>`,
      ]},
      { k: "play", title: "z and z*", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 2, b = 1.5;
          function draw() {
            f.innerHTML = plane(5, [{ z: [a, b], label: "z" }, { z: [a, -b], cls: "s2", mk: "mk2", label: "z*" }, { z: [2 * a, 0], cls: "s5", mk: "mk2", label: "z + z*" }]);
            ro.innerHTML = readout([["z", cs(a, b)], ["z*", cs(a, -b)], ["z + z* (always real)", fmt(2 * a, 3)], ["z z* = |z|²", fmt(a * a + b * b, 3)]]);
          }
          host.append(f, slider({ id: id + "-a", label: "a", min: -2, max: 2, step: 0.25, value: a, show: (x) => fmt(x) }, (x) => { a = x; draw(); }).el,
            slider({ id: id + "-b", label: "b", min: -3, max: 3, step: 0.25, value: b, show: (x) => fmt(x) }, (x) => { b = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The imaginary parts always cancel in z + z*. And z × z*: the angles θ and −θ add to 0, so the product lands on the real axis.</p>`,
      ]},
      { k: "math", title: "Dividing in rectangular form", b: [
        `<p>Multiply top and bottom by the conjugate of the bottom:</p>`,
        `<div class="eq">(a₁ + jb₁)/(a₂ + jb₂) · (a₂ − jb₂)/(a₂ − jb₂) = [(a₁a₂ + b₁b₂) + j(b₁a₂ − a₁b₂)] / (a₂² + b₂²)</div>`,
        `<p>The bottom is now real, so you can split into real and imaginary parts.</p>`,
        { t: "reveal", label: "Example: (4 + j2)/(1 + j)", html: `<div class="eq">(4 + j2)(1 − j) / (1 + 1) = (4 − j4 + j2 − j²2)/2 = (6 − j2)/2 = 3 − j1</div><p>Check in polar: |4 + j2|/|1 + j| = 4.47/1.414 = 3.16 = |3 − j|. ✓</p>` },
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "(5 + j5)/(2 − j): real part?", a: 1, hint: "Multiply top and bottom by 2 + j. The bottom becomes 4 + 1 = 5.", why: "(5 + j5)(2 + j) = 10 + j5 + j10 + j²5 = 5 + j15. Divide by 5: 1 + j3." },
        { t: "num", q: "Same division: imaginary part?", a: 3, why: "1 + j3." },
        { t: "mcq", q: "Why does 1/z = z*/|z|²?", opts: [["Because z × z* = |z|², so z × (z*/|z|²) = 1", true, "That's the identity used to clear any denominator."], ["Because z* = 1/z for every z", false, "Only when |z| = 1."], ["It doesn't", false, "Multiply it out and check."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why multiply by the conjugate when dividing complex numbers?", model: "A number times its own conjugate is its magnitude squared, a real number. Multiplying top and bottom by the bottom's conjugate makes the denominator real, so the answer separates cleanly into a real part and an imaginary part." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Rotation and e^(jωt)", mins: 20,
    blurb: "Multiplying by e^(jθ) turns a number; e^(jωt) spins.",
    takeaway: "|e^(jθ)| = 1, ∠e^(jθ) = θ, Re = cos θ, Im = sin θ. Multiplying by e^(jθ) rotates by θ without stretching (×j rotates 90°). e^(jωt) is a unit arrow spinning at ω rad/s (ω/2π cycles per second); its shadow on the real axis is cos ωt. That's why a factor jω in an impedance means a 90° phase lead.",
    steps: [
      { k: "learn", title: "Multiplying by e^(jθ)", b: [
        `<div class="eq">|e<sup>jθ</sup>| = 1     ∠e<sup>jθ</sup> = θ     Re(e<sup>jθ</sup>) = cos θ     Im(e<sup>jθ</sup>) = sin θ</div>`,
        `<div class="eq">r₁e<sup>jθ₁</sup> · e<sup>jθ₂</sup> = r₁ e<sup>j(θ₁+θ₂)</sup></div>`,
        `<p>Length unchanged, angle increased by θ₂: a pure <b>rotation</b>. Since j = e<sup>j90°</sup>, <b>multiplying by j rotates 90° counter-clockwise</b>.</p>`,
      ]},
      { k: "check", title: "Rotate in your head", b: [
        { t: "mcq", q: "z = 3 + j1. What is jz?", opts: [["−1 + j3: rotated a quarter turn", true, "j(3 + j) = j3 + j² = −1 + j3. Same length √10, angle up by 90°."], ["3j + 1", false, "Multiply out: j × j = −1."], ["3 − j1", false, "That's the conjugate (a mirror, not a rotation)."]] },
      ]},
      { k: "play", title: "The spinning arrow", b: [
        (host, id) => {
          const wrap = el(`<div class="two"></div>`), a = el(`<div class="fig"></div>`), b = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let t = 0.15;
          function draw() {
            const th = 2 * Math.PI * t, c = Math.cos(th), s = Math.sin(th);
            a.innerHTML = plane(1.5, [{ z: [c, s], label: "e^(jωt)" }, { z: [c, 0], cls: "s2", mk: "mk2" }], { circle: 1, lines: [{ pts: [[c, 0], [c, s]] }] });
            b.innerHTML = plot({ w: 300, h: 326, x: [0, 1], y: [-1.5, 1.5], xt: [0, 0.25, 0.5, 0.75, 1], yt: [-1, 0, 1], xl: "t (cycles)", yl: "Re = cos ωt", series: [{ f: (x) => Math.cos(2 * Math.PI * x), cls: "s2" }], marks: [{ x: t, y: c, cls: "mk2" }], label: "Real part of the spinning arrow over one cycle" });
            ro.innerHTML = readout([["ωt", fmt(deg(th), 3) + "°"], ["Re = cos ωt", fmt(c, 3)], ["Im = sin ωt", fmt(s, 3)]]);
          }
          wrap.append(a, b);
          host.append(wrap, slider({ id: id + "-t", label: "time t (fraction of a cycle)", min: 0, max: 1, step: 0.01, value: t, show: (x) => fmt(x) }, (x) => { t = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Left: e<sup>jωt</sup> goes round the unit circle once per cycle. Right: its real part (blue shadow) traced over time is a cosine.</p>`,
      ]},
      { k: "learn", title: "Why circuits care", b: [
        `<p>In Chapter 13 every voltage is Re(V e<sup>jωt</sup>). An inductor's V = jωL·I: multiply by ωL (stretch) and by j (rotate +90°). So the voltage arrow is a quarter turn <b>ahead</b> of the current arrow: it leads by 90°.</p>`,
        `<p>A capacitor's V = I/(jωC) = −j I/(ωC): rotate −90°, so it lags.</p>`,
        { t: "num", q: "ω = 2000 rad/s. How many cycles per second?", a: 318.3, tol: 0.002, unit: "Hz", why: "ω/2π = 2000/6.283 ≈ 318.3 Hz." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does multiplying a phasor by j do, and where does that show up in circuits?", model: "j has length 1 and angle 90°, so multiplying by it rotates the phasor a quarter turn counter-clockwise without changing its size. That's why an inductor's voltage, jωL times the current, leads the current by 90°, and a capacitor's, divided by j, lags by 90°." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "appC", eyebrow: "Appendix C", title: "Complex Numbers",
    intro: `<p>Five short parts. The toolkit behind impedances and phasors in Chapters 12–15: points on a plane, polar form, arithmetic, the conjugate, and spinning arrows.</p><p class="aside">Chapter 12, Part 2 gave you the quick version. This is the fuller one, with practice. Arrow keys ← → move between steps.</p>`,
    after: `<p>Appendices have no problems of their own. Go back to <a href="13-sinusoidal-steady-state.html">Chapter 13</a> or whichever chapter sent you here, and use these tools there.</p>`,
    parts: [p1, p2, p3, p4, p5],
    summary: `
      <h3>Forms</h3>
      <div class="eq">z = a + jb = r e<sup>jθ</sup>     j² = −1</div>
      <p>r = |z| = √(a² + b²), θ = ∠z (sketch first: check the quadrant). a = r cos θ, b = r sin θ.</p>
      <h3>Arithmetic</h3>
      <p>Add/subtract: rectangular, part by part. Multiply/divide: polar, magnitudes ×/÷, angles +/−. Rectangular product: (a₁a₂ − b₁b₂) + j(a₁b₂ + a₂b₁).</p>
      <h3>Conjugate</h3>
      <div class="eq">z* = a − jb = re<sup>−jθ</sup>     zz* = |z|²     1/z = z*/|z|²</div>
      <p>Re(z) = (z + z*)/2, Im(z) = (z − z*)/2j. Divide by multiplying top and bottom by the bottom's conjugate.</p>
      <h3>e<sup>jθ</sup></h3>
      <p>|e<sup>jθ</sup>| = 1, ∠ = θ, Re = cos θ, Im = sin θ. ×e<sup>jθ</sup> rotates by θ; ×j rotates 90°. e<sup>jωt</sup> spins at ω rad/s = ω/2π Hz.</p>`,
  };
  Course.start(window.CHAPTER);
})();
