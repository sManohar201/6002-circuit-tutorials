(function () {
  const { plot, slider, toggle, readout, fmt, el } = Course;
  const PI = Math.PI, rad = (d) => (d * PI) / 180;
  const piTicks = [0, PI / 2, PI, (3 * PI) / 2, 2 * PI], piTf = (v) => ["0", "π/2", "π", "3π/2", "2π"][Math.round(v / (PI / 2))] || fmt(v);

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "cos, sin and tan from a circle", mins: 20,
    blurb: "One spinning point defines all three, and their symmetries.",
    takeaway: "On the unit circle, the point at angle θ has x = cos θ and y = sin θ; tan θ = sin θ/cos θ. 2π rad = 360°. Symmetries: cos(−θ) = cos θ, sin(−θ) = −sin θ. Shifts: cos(θ − π/2) = sin θ, shifting by π flips the sign, shifting by 2π changes nothing.",
    steps: [
      { k: "learn", title: "The definition", b: [
        `<p>Put a point on a circle of radius 1. Measure its angle θ from the x axis, counter-clockwise.</p>`,
        `<div class="key">x = cos θ     y = sin θ     tan θ = sin θ / cos θ</div>`,
        `<p>Angles in circuits are in <b>radians</b>: 2π rad = 360° = one full cycle. So rad = deg × 2π/360.</p>`,
        `<p class="aside">θ needn't be fixed: in circuits it's usually ωt, growing with time.</p>`,
      ]},
      { k: "play", title: "Turn the angle", b: [
        (host, id) => {
          const wrap = el(`<div class="two"></div>`), a = el(`<div class="fig"></div>`), b = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let d = 40;
          function draw() {
            const th = rad(d), c = Math.cos(th), s = Math.sin(th), circ = [];
            for (let k = 0; k <= 120; k++) circ.push([Math.cos((k * PI) / 60), Math.sin((k * PI) / 60)]);
            a.innerHTML = plot({ w: 300, h: 286, x: [-1.3, 1.3], y: [-1.3, 1.3], xt: [-1, 0, 1], yt: [-1, 0, 1], xl: "x", yl: "y", series: [{ pts: circ, cls: "s5" }, { pts: [[0, 0], [c, s]], cls: "s1" }, { pts: [[c, 0], [c, s]], cls: "s3" }, { pts: [[0, 0], [c, 0]], cls: "s2" }], marks: [{ x: c, y: s, r: 5 }], label: "Point on the unit circle" });
            const th2 = ((th % (2 * PI)) + 2 * PI) % (2 * PI);
            b.innerHTML = plot({ w: 300, h: 286, x: [0, 2 * PI], y: [-2, 2], xt: piTicks, xtf: piTf, yt: [-2, -1, 0, 1, 2], xl: "θ (rad)", series: [{ f: Math.cos, cls: "s2" }, { f: Math.sin, cls: "s3" }, ...[[0, PI / 2], [PI / 2, (3 * PI) / 2], [(3 * PI) / 2, 2 * PI]].map(([u, v]) => ({ f: Math.tan, cls: "s5", from: u + 0.01, to: v - 0.01, n: 300 }))], marks: [{ x: th2, y: Math.cos(th2), cls: "mk2" }, { x: th2, y: Math.sin(th2), r: 5 }], label: "cos, sin and tan versus angle" });
            ro.innerHTML = readout([["θ", fmt(d) + "° = " + fmt(th, 3) + " rad"], ["cos θ (blue)", fmt(c, 3)], ["sin θ (green)", fmt(s, 3)], ["tan θ (dashed)", Math.abs(c) < 1e-9 ? "∞" : fmt(s / c, 3)]]);
          }
          wrap.append(a, b);
          host.append(wrap, slider({ id: id + "-d", label: "θ", min: -360, max: 360, step: 5, value: d, show: (x) => fmt(x) + "°" }, (x) => { d = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Try θ and −θ: the x stays, the y flips. Try θ and θ + 180°: both flip. tan blows up where cos = 0.</p>`,
      ]},
      { k: "learn", title: "Symmetries and shifts", b: [
        `<div class="tbl"><table><tbody>
          <tr><td>negative angle</td><td class="mono">cos(−θ) = cos θ   sin(−θ) = −sin θ   tan(−θ) = −tan θ</td></tr>
          <tr><td>quarter turn</td><td class="mono">cos(θ − π/2) = sin θ   sin(θ + π/2) = cos θ</td></tr>
          <tr><td>half turn</td><td class="mono">cos(θ ± π) = −cos θ   sin(θ ± π) = −sin θ   tan(θ ± π) = tan θ</td></tr>
          <tr><td>full turn</td><td class="mono">all three unchanged</td></tr></tbody></table></div>`,
        `<p>Don't memorize: picture the point on the circle and see where it moves.</p>`,
      ]},
      { k: "check", title: "Picture it", b: [
        { t: "mcq", q: "sin(ωt + π/2) is the same as…", opts: [["cos ωt", true, "Shifting a sine a quarter cycle earlier gives a cosine."], ["−cos ωt", false, "That's sin(ωt − π/2)."], ["−sin ωt", false, "That's a half-cycle shift."]] },
        { t: "num", q: "Convert 1.2 rad to degrees.", a: 68.75, tol: 0.003, unit: "°", why: "1.2 × 360/2π ≈ 68.75°." },
        { t: "num", q: "cos(θ + π) when cos θ = 0.3?", a: -0.3, why: "A half turn flips the point through the origin: −0.3." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is cos(−θ) = cos θ but sin(−θ) = −sin θ?", model: "A negative angle is the mirror image of the point below the x axis. Mirroring in the x axis keeps the x coordinate, which is cosine, and flips the y coordinate, which is sine." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Identities you'll actually use", mins: 25,
    blurb: "Sums, products, squares, and combining two sinusoids into one.",
    takeaway: "cos(θ₁ ± θ₂) = cos θ₁cos θ₂ ∓ sin θ₁sin θ₂; sin(θ₁ ± θ₂) = sin θ₁cos θ₂ ± cos θ₁sin θ₂. Products become sums: cos θ₁cos θ₂ = ½[cos(θ₁−θ₂) + cos(θ₁+θ₂)]. Squares: cos²θ = ½(1 + cos 2θ), so its average is ½. A₁cos θ + A₂sin θ = √(A₁²+A₂²)·cos(θ − tan⁻¹(A₂/A₁)): one sinusoid.",
    steps: [
      { k: "learn", title: "Sum and difference", b: [
        `<div class="eq">cos(θ₁ ± θ₂) = cos θ₁ cos θ₂ ∓ sin θ₁ sin θ₂</div>`,
        `<div class="eq">sin(θ₁ ± θ₂) = sin θ₁ cos θ₂ ± cos θ₁ sin θ₂</div>`,
        `<div class="eq">tan(θ₁ ± θ₂) = (tan θ₁ ± tan θ₂) / (1 ∓ tan θ₁ tan θ₂)</div>`,
        `<p class="aside">Watch the ∓ in the cosine one: the sign flips.</p>`,
      ]},
      { k: "learn", title: "Products, double angles, squares", b: [
        `<div class="eq">cos θ₁ cos θ₂ = ½[cos(θ₁−θ₂) + cos(θ₁+θ₂)]</div>`,
        `<div class="eq">sin θ₁ cos θ₂ = ½[sin(θ₁−θ₂) + sin(θ₁+θ₂)]      sin θ₁ sin θ₂ = ½[cos(θ₁−θ₂) − cos(θ₁+θ₂)]</div>`,
        `<div class="eq">cos 2θ = cos²θ − sin²θ      sin 2θ = 2 sin θ cos θ</div>`,
        `<div class="key">cos²θ = ½(1 + cos 2θ)     sin²θ = ½(1 − cos 2θ)     cos²θ + sin²θ = 1</div>`,
        `<p class="aside">Half angles: cos(θ/2) = ±√((1 + cos θ)/2), sin(θ/2) = ±√((1 − cos θ)/2), sign by quadrant.</p>`,
      ]},
      { k: "play", title: "A product is two frequencies", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let f2 = 1;
          function draw() {
            const w1 = 2 * PI * 5, w2 = 2 * PI * 5 * f2, prod = (t) => Math.cos(w1 * t) * Math.cos(w2 * t);
            f.innerHTML = plot({ x: [0, 1], y: [-1.3, 1.3], xt: [0, 0.25, 0.5, 0.75, 1], yt: [-1, -0.5, 0, 0.5, 1], xl: "t (s)", series: [{ f: () => (f2 === 1 ? 0.5 : 0), cls: "s5" }, { f: prod, cls: "s1", n: 800 }], label: "Product of two cosines" });
            ro.innerHTML = readout([["cos(2π·5t) × cos(2π·" + fmt(5 * f2, 3) + "t)", ""], ["= ½cos at difference", fmt(Math.abs(5 - 5 * f2), 3) + " Hz"], ["+ ½cos at sum", fmt(5 + 5 * f2, 3) + " Hz"], ["average", f2 === 1 ? "½ (the difference term is a constant ½)" : "0"]]);
          }
          host.append(f, slider({ id: id + "-f", label: "second frequency ÷ first", min: 0.5, max: 2, step: 0.05, value: f2, show: (x) => fmt(x) }, (x) => { f2 = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">At ratio 1 the product is cos² = ½ + ½cos 2θ: it sits above zero with average ½. That's why power v·i in a resistor averages to half the peak (Chapter 13's RMS).</p>`,
      ]},
      { k: "math", title: "Two sinusoids make one", b: [
        `<div class="key">A₁ cos θ + A₂ sin θ = √(A₁² + A₂²) · cos(θ − tan⁻¹(A₂/A₁))</div>`,
        `<p>Why: expand the right side with the cos(θ₁ − θ₂) identity and match terms. (A₁ < 0? Pick the angle in the right quadrant, as in Appendix C.)</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let A1 = 3, A2 = 4;
          function draw() {
            const M = Math.hypot(A1, A2), ph = Math.atan2(A2, A1);
            f.innerHTML = plot({ x: [0, 2 * PI], y: [-6, 6], xt: piTicks, xtf: piTf, yt: [-5, 0, 5], xl: "θ (rad)", series: [{ f: (x) => A1 * Math.cos(x), cls: "s2" }, { f: (x) => A2 * Math.sin(x), cls: "s3" }, { f: (x) => M * Math.cos(x - ph), cls: "s1" }], label: "Sum of a cosine and a sine" });
            ro.innerHTML = readout([["amplitude √(A₁² + A₂²)", fmt(M, 3)], ["phase", fmt((ph * 180) / PI, 3) + "°"]]);
          }
          host.append(f, slider({ id: id + "-1", label: "A₁ (cos part, blue)", min: -5, max: 5, step: 0.5, value: A1, show: (x) => fmt(x) }, (x) => { A1 = x; draw(); }).el,
            slider({ id: id + "-2", label: "A₂ (sin part, green)", min: -5, max: 5, step: 0.5, value: A2, show: (x) => fmt(x) }, (x) => { A2 = x; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "5 cos ωt + 12 sin ωt = M cos(ωt − φ). M = ?", a: 13, why: "√(25 + 144) = 13." },
        { t: "num", q: "Same sum: φ in degrees?", a: 67.38, tol: 0.003, unit: "°", why: "tan⁻¹(12/5) ≈ 67.38°." },
        { t: "num", q: "Average of sin²(ωt) over a cycle?", a: 0.5, why: "sin² = ½ − ½cos 2ωt; the cosine averages to 0." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the average of cos² equal to ½?", model: "cos²θ = ½ + ½cos 2θ. The cos 2θ part goes up and down equally, so it averages to zero over a cycle, leaving ½." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Taylor series and Euler", mins: 15,
    blurb: "Polynomials that become cos and sin, and where e^(jθ) comes from.",
    takeaway: "cos θ = 1 − θ²/2! + θ⁴/4! − …, sin θ = θ − θ³/3! + θ⁵/5! − …, eˣ = 1 + x + x²/2! + …. Put x = jθ into eˣ and split real from imaginary: e^(jθ) = cos θ + j sin θ (Euler). So cos θ = (e^(jθ) + e^(−jθ))/2, sin θ = (e^(jθ) − e^(−jθ))/2j. For small θ, sin θ ≈ θ and cos θ ≈ 1 − θ²/2.",
    steps: [
      { k: "learn", title: "The series", b: [
        `<div class="eq">cos θ = 1 − θ²/2! + θ⁴/4! − θ⁶/6! + …</div>`,
        `<div class="eq">sin θ = θ − θ³/3! + θ⁵/5! − θ⁷/7! + …</div>`,
        `<div class="eq">tan θ = θ + θ³/3 + 2θ⁵/15 + …</div>`,
        `<p>Keep enough terms and the polynomial matches the function. Keep just the first one or two for small angles.</p>`,
      ]},
      { k: "play", title: "Add terms", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let n = 2;
          const fact = (k) => (k <= 1 ? 1 : k * fact(k - 1));
          const partial = (x) => { let s = 0; for (let k = 0; k < n; k++) s += ((k % 2 ? -1 : 1) * Math.pow(x, 2 * k)) / fact(2 * k); return s; };
          function draw() {
            f.innerHTML = plot({ x: [-2 * PI, 2 * PI], y: [-2, 2], xt: [-2 * PI, -PI, 0, PI, 2 * PI], xtf: (v) => ["−2π", "−π", "0", "π", "2π"][Math.round(v / PI) + 2], yt: [-2, -1, 0, 1, 2], xl: "θ (rad)", series: [{ f: Math.cos, cls: "s5" }, { f: partial, cls: "s1", n: 600 }], label: "Partial sums of the cosine series" });
            ro.innerHTML = readout([["terms kept", String(n)], ["error at θ = π", fmt(partial(PI) + 1, 3)]]);
          }
          host.append(f, slider({ id: id + "-n", label: "number of terms", min: 1, max: 8, step: 1, value: n, show: (x) => String(x) }, (x) => { n = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Dashed: cos θ. Each extra term hugs the curve further from 0.</p>`,
      ]},
      { k: "math", title: "Where e^(jθ) = cos θ + j sin θ comes from", b: [
        `<div class="eq">e<sup>x</sup> = 1 + x + x²/2! + x³/3! + x⁴/4! + …</div>`,
        `<p>Put x = jθ. Powers of j cycle: j, −1, −j, 1, …</p>`,
        { t: "reveal", label: "Split real and imaginary terms", html: `<div class="eq">e<sup>jθ</sup> = (1 − θ²/2! + θ⁴/4! − …) + j(θ − θ³/3! + θ⁵/5! − …) = cos θ + j sin θ</div><p>Add and subtract e<sup>jθ</sup> and e<sup>−jθ</sup>:</p><div class="key">cos θ = (e<sup>jθ</sup> + e<sup>−jθ</sup>)/2      sin θ = (e<sup>jθ</sup> − e<sup>−jθ</sup>)/2j</div>` },
      ]},
      { k: "check", title: "Small angles", b: [
        { t: "num", q: "Estimate sin(0.1 rad) with one term.", a: 0.1, why: "sin θ ≈ θ = 0.1. (True: 0.09983.)" },
        { t: "num", q: "Estimate cos(0.2 rad) with two terms.", a: 0.98, why: "1 − 0.04/2 = 0.98. (True: 0.98007.)" },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the series for eˣ produce cos and sin when x = jθ?", model: "Substituting jθ makes the powers of j cycle through j, −1, −j, 1. The even powers are real with alternating signs, which is exactly the cosine series. The odd powers all carry a j with alternating signs, which is j times the sine series." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "appB", eyebrow: "Appendix B", title: "Trigonometric Functions and Identities",
    intro: `<p>Three short parts: the unit circle, the identities that come up in circuits, and the series behind Euler's relation. Use it as a refresher and a lookup sheet (see the summary).</p><p class="aside">Chapter 12, Part 2 gave the quick version. Arrow keys ← → move between steps.</p>`,
    after: `<p>Appendices have no problems of their own. Keep the summary handy while you work through Chapters 12–14.</p>`,
    parts: [p1, p2, p3],
    summary: `
      <h3>Definitions</h3><p>Unit circle: x = cos θ, y = sin θ, tan θ = sin θ/cos θ. 2π rad = 360°.</p>
      <h3>Symmetry and shifts</h3><p>cos(−θ) = cos θ, sin(−θ) = −sin θ, tan(−θ) = −tan θ. cos(θ − π/2) = sin θ, sin(θ + π/2) = cos θ. Shift π: cos, sin flip sign, tan unchanged. Shift 2π: no change.</p>
      <h3>Sums</h3><div class="eq">cos(θ₁ ± θ₂) = cos θ₁cos θ₂ ∓ sin θ₁sin θ₂     sin(θ₁ ± θ₂) = sin θ₁cos θ₂ ± cos θ₁sin θ₂</div>
      <h3>Products</h3><p>cos θ₁cos θ₂ = ½[cos(θ₁−θ₂) + cos(θ₁+θ₂)]; sin θ₁cos θ₂ = ½[sin(θ₁−θ₂) + sin(θ₁+θ₂)]; sin θ₁sin θ₂ = ½[cos(θ₁−θ₂) − cos(θ₁+θ₂)].</p>
      <h3>Double, half, squares</h3><p>cos 2θ = cos²θ − sin²θ, sin 2θ = 2 sin θ cos θ. cos²θ = ½(1 + cos 2θ), sin²θ = ½(1 − cos 2θ), cos² + sin² = 1. cos(θ/2) = ±√((1+cos θ)/2), sin(θ/2) = ±√((1−cos θ)/2).</p>
      <h3>Combining</h3><div class="eq">A₁cos θ + A₂sin θ = √(A₁²+A₂²) cos(θ − tan⁻¹(A₂/A₁))</div>
      <h3>Series and Euler</h3><p>cos θ = 1 − θ²/2! + θ⁴/4! − …; sin θ = θ − θ³/3! + …; e^(jθ) = cos θ + j sin θ; cos θ = (e^(jθ)+e^(−jθ))/2; sin θ = (e^(jθ)−e^(−jθ))/2j.</p>`,
  };
  Course.start(window.CHAPTER);
})();
