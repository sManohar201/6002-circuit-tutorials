(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;
  const tbl = (head, rows) => `<div class="tbl"><table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`;
  const pct = (x, d = 3) => fmt(100 * x, d) + "%";
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return (s + 0.5) / 4294967296; }; }
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  /* Histogram as a plot series (outline), normalised to a density so it can sit on a PDF. */
  function hist(xs, lo, hi, bins) {
    const w = (hi - lo) / bins, c = new Array(bins).fill(0);
    xs.forEach((x) => { const b = Math.floor((x - lo) / w); if (b >= 0 && b < bins) c[b]++; });
    const pts = [];
    c.forEach((n, i) => { const d = n / (xs.length * w), x0 = lo + i * w; pts.push([x0, 0], [x0, d], [x0 + w, d], [x0 + w, 0]); });
    return pts;
  }

  const p1 = {
    id: "p1", title: "Probability: and, or, not", mins: 20,
    blurb: "Three rules handle almost everything. Applied to a chip, they explain why big chips have low yield.",
    takeaway: "Probability is a number from 0 (never) to 1 (always). Not: P(not A) = 1 − P(A). And, for independent events: multiply, P(A and B) = P(A)·P(B). Or: P(A or B) = P(A) + P(B) − P(A and B). A chip works only if every one of N independent parts works: yield = pᴺ. With random defects of density D per cm², a die of area A works with probability e^(−AD) (the Poisson yield model), so doubling the area squares the yield.",
    steps: [
      { k: "learn", title: "Three rules", b: [
        tbl(["Rule", "Formula", "Example"], [["Not", "P(not A) = 1 − P(A)", "P(via fails) = 10⁻⁴ → P(works) = 0.9999"], ["And (independent)", "P(A)·P(B)", "two vias both work: 0.9999²"], ["Or", "P(A) + P(B) − P(A and B)", "at least one of two fails: 2×10⁻⁴ − 10⁻⁸"]]),
        `<p class="aside">“Independent” means one doesn't affect the other. That's an assumption to check, not a given: defects often cluster.</p>`,
      ]},
      { k: "play", title: "Why big chips are hard to make", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let lp = 4, N = 1e4;
          function draw() {
            const q = 10 ** -lp, Y = (n) => Math.exp(n * Math.log1p(-q));
            f.innerHTML = plot({ x: [0, 6], y: [0, 1.05], xt: [0, 1, 2, 3, 4, 5, 6], xtf: (v) => "10" + "⁰¹²³⁴⁵⁶"[v], yt: [0, 0.25, 0.5, 0.75, 1], xl: "number of parts N (log)", yl: "chip yield", h: 220, series: [{ f: (x) => Y(10 ** x), cls: "s1" }], marks: [{ x: Math.log10(N), y: Y(N) }], label: "Yield against number of parts" });
            ro.innerHTML = readout([["Failure chance per part", fmt(q, 3)], ["Parts N", fmt(N, 3)], ["Yield (1 − q)ᴺ", pct(Y(N))], ["Shortcut e^(−Nq)", pct(Math.exp(-N * q))]]);
          }
          host.append(f, slider({ id: id + "-q", label: "Each part fails with probability 10^−x, x =", min: 2, max: 9, step: 0.1, value: lp, show: (v) => fmt(v, 3) }, (v) => { lp = v; draw(); }).el,
            slider({ id: id + "-n", label: "Number of parts N", min: 1, max: 1e6, log: true, value: N, show: (v) => fmt(v, 3) }, (v) => { N = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">With a one-in-ten-thousand failure rate, 10 000 parts give only 37% yield. A modern chip has billions of transistors and vias, so each must fail less than about once in 10¹⁰. When Nq is small, (1 − q)ᴺ ≈ e<sup>−Nq</sup> (Module 29).</p>`,
      ]},
      { k: "learn", title: "Defect density and die area", b: [
        `<p>Fabs describe random defects by a density D (defects per cm²). A die of area A collects on average A·D defects. The chance it gets <b>none</b> is:</p>`,
        `<div class="eq">Y = e<sup>−A·D</sup></div>`,
        `<p>D = 0.1 cm⁻², A = 1 cm²: Y = 90%. Double the area: 82%. That's why huge chips are expensive, and why “chiplets” split a design across several smaller dies.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A chip has 1000 vias, each failing with probability 10⁻⁴. Yield (%)?", a: 90.5, tol: 0.01, why: "0.9999¹⁰⁰⁰ ≈ e^(−0.1) = 90.5%." },
        { t: "num", q: "D = 0.2 defects/cm², die area 2.5 cm². Yield (%)?", a: 60.7, tol: 0.01, why: "e^(−0.5) = 60.7%." },
        { t: "num", q: "Two independent blocks: 95% and 98% chance of working. Chance at least one fails (%)?", a: 6.9, tol: 0.01, why: "1 − 0.95 × 0.98 = 1 − 0.931 = 6.9%." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does chip yield fall so quickly as chips get bigger?", model: "A chip works only if every part works, so for independent parts the yield is the product of all their probabilities, the per-part probability to the power N. Even tiny failure rates compound: the yield goes like e to the minus N times the failure rate, or e to the minus area times defect density." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Conditional probability and Bayes: testing chips", mins: 25,
    blurb: "A test that catches 99% of bad chips sounds great. How sure are you that a chip that fails really is bad? Count 10 000 chips and see.",
    takeaway: "P(A | B) = probability of A given that B happened = P(A and B)/P(B). Bayes' rule flips it: P(bad | fail) = P(fail | bad)·P(bad)/P(fail). Easiest by counting a concrete population. With 5% bad chips, 99% detection and a 2% false-fail rate: of chips that fail, only 72% are really bad; of chips that pass, about 540 per million are bad (test escapes, DPPM). Rare conditions plus imperfect tests always give surprising answers; count before trusting intuition.",
    steps: [
      { k: "learn", title: "Given that…", b: [
        `<div class="eq">P(A | B) = P(A and B) / P(B)</div>`,
        `<p>Read “|” as “given”. You shrink your world to the cases where B happened, then ask what fraction of those also have A.</p>`,
        `<p class="aside">P(fail | bad) and P(bad | fail) are different questions. Mixing them up is the most common probability mistake in engineering and in medicine.</p>`,
      ]},
      { k: "play", title: "Count 10 000 chips", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let prev = 0.05, sens = 0.99, fa = 0.02;
          function draw() {
            const N = 10000, bad = N * prev, good = N - bad, tp = bad * sens, fn = bad - tp, fp = good * fa, tn = good - fp;
            /* 100 x 100 dots, coloured by category */
            const cols = 100, sz = 3.2;
            let s = "", k = 0;
            const cat = [[tp, "var(--bad)"], [fn, "var(--accent)"], [fp, "var(--cool)"], [tn, "var(--line)"]];
            cat.forEach(([n, c]) => { for (let i = 0; i < Math.round(n); i++, k++) s += `<rect x="${(k % cols) * sz}" y="${Math.floor(k / cols) * sz}" width="${sz - 0.6}" height="${sz - 0.6}" style="fill:${c}"/>`; });
            f.innerHTML = S.svg(cols * sz, cols * sz, s, { label: "10 000 chips: red = bad and caught, orange = bad but passed, blue = good but failed, grey = good and passed", max: 320 });
            ro.innerHTML = readout([["Bad and caught (red)", fmt(tp, 4)], ["Bad but passed: escapes (orange)", fmt(fn, 3)], ["Good but failed: yield loss (blue)", fmt(fp, 4)], ["P(really bad | failed)", pct(tp / (tp + fp))], ["Escapes per million shipped (DPPM)", fmt((1e6 * fn) / (fn + tn), 3)]]);
          }
          host.append(f, slider({ id: id + "-p", label: "Fraction of chips that are bad", min: 0.001, max: 0.3, log: true, value: prev, show: (v) => pct(v) }, (v) => { prev = v; draw(); }).el,
            slider({ id: id + "-s", label: "Test catches this fraction of bad chips", min: 0.8, max: 0.9999, step: 0.0001, value: sens, show: (v) => pct(v, 4) }, (v) => { sens = v; draw(); }).el,
            slider({ id: id + "-f", label: "Test wrongly fails this fraction of good chips", min: 0, max: 0.1, step: 0.001, value: fa, show: (v) => pct(v) }, (v) => { fa = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Only the coloured squares failed or escaped. Among the failed ones (red + blue), red is the fraction really bad. Make bad chips rare (0.5%) and watch: most failures become false alarms, because good chips vastly outnumber bad ones.</p>`,
      ]},
      { k: "math", title: "The same with Bayes' rule", b: [
        steps([["P(bad) = 0.05, P(fail | bad) = 0.99, P(fail | good) = 0.02", ""], ["P(fail) = 0.05 × 0.99 + 0.95 × 0.02", "= 0.0495 + 0.019 = 0.0685"], ["P(bad | fail) = P(fail | bad)P(bad)/P(fail)", "= 0.0495/0.0685 = 72%"]]),
        `<div class="eq">P(A | B) = P(B | A)·P(A) / P(B)</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "1% of chips are bad. The test catches 95% of them and falsely fails 1% of good ones. P(bad | fail) in %?", a: 49, tol: 0.02, why: "0.0095/(0.0095 + 0.0099) = 49%: a coin toss, despite a ‘95% test’." },
        { t: "num", q: "Same test: escapes per million chips shipped (DPPM)?", a: 510, tol: 0.03, hint: "Bad chips that pass: 1% × 5%. Chips shipped: everything that passes.", why: "0.0005/(0.0005 + 0.9801) ≈ 5.1×10⁻⁴ = 510 DPPM. Car makers demand under ~1 DPPM: hence many test stages." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can a chip that fails a 99%-accurate test still have a good chance of being fine?", model: "Because good chips usually vastly outnumber bad ones. Even a small false-fail rate applied to the huge number of good chips can produce as many failures as the test correctly catches among the few bad chips. So among all failing chips, a sizeable fraction can be good ones." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Random variables and distributions", mins: 25,
    blurb: "A random variable is a number whose value you don't know in advance: a chip's offset voltage, the number of defects. Its distribution says how likely each value is.",
    takeaway: "Discrete random variables (defect count, dice) have probabilities for each value that add to 1. Continuous ones (offset voltage, delay) have a probability density f(x): probability = area under f between two values, total area 1, and f itself can exceed 1. The cumulative distribution F(x) = P(X ≤ x) rises from 0 to 1. A histogram of many samples approaches the density. Common shapes: uniform (rounding error), Gaussian (sums of many small effects), exponential (time to failure, waiting times).",
    steps: [
      { k: "learn", title: "Density: probability per unit", b: [
        `<p>For a continuous quantity, any exact value has probability 0 (what's the chance an offset is exactly 1.000000… mV?). Instead ask for a range: P(a &lt; X &lt; b) = <b>area under the density</b> between a and b.</p>`,
        `<div class="eq">P(a < X < b) = ∫ₐᵇ f(x) dx     ∫ f(x) dx = 1</div>`,
        `<p class="aside">Same idea as Module 31's spectral density: “per hertz” there, “per volt” here.</p>`,
      ]},
      { k: "play", title: "From histogram to density", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let kind = 0, N = 200;
          const D = [
            ["Uniform (−1 to 1)", (r) => 2 * r() - 1, (x) => (Math.abs(x) <= 1 ? 0.5 : 0), [-3, 3], 0.8],
            ["Gaussian (σ = 1)", (r) => gauss(r), (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI), [-4, 4], 0.6],
            ["Exponential (mean 1)", (r) => -Math.log(r()), (x) => (x >= 0 ? Math.exp(-x) : 0), [-0.5, 5], 1.2],
          ];
          function draw() {
            const [, gen, pdf, xr, ym] = D[kind], r = rng(11), xs = [];
            for (let i = 0; i < N; i++) xs.push(gen(r));
            f.innerHTML = plot({ x: xr, y: [0, ym], xt: [xr[0], 0, xr[1]].map((v) => Math.round(v)), yt: [0, ym / 2, ym].map((v) => +v.toFixed(2)), xl: "x", yl: "density", h: 220, series: [{ pts: hist(xs, xr[0], xr[1], 30), cls: "s2" }, { f: pdf, cls: "s1", n: 500 }], label: "Histogram of samples (blue) and the true density (orange)" });
            const m = xs.reduce((a, b) => a + b, 0) / N;
            ro.innerHTML = readout([["Samples", N], ["Sample mean", fmt(m, 3)]]);
          }
          host.append(toggle(D.map((d) => d[0]), (i) => { kind = i; draw(); }, 0), f, slider({ id: id + "-n", label: "Number of samples", min: 20, max: 20000, log: true, value: N, show: (v) => fmt(Math.round(v), 3) }, (v) => { N = Math.round(v); draw(); }).el, ro);
          draw();
        },
        `<p class="aside">With 20 samples the histogram is ragged and misleading. By a few thousand it hugs the orange density. Every Monte Carlo simulation of a chip is this picture: enough samples to see the shape.</p>`,
      ]},
      { k: "learn", title: "Where each shape comes from", b: [
        tbl(["Distribution", "Arises from", "Chip example"], [["Uniform", "rounding, a random phase", "quantization error (Module 32)"], ["Gaussian (normal)", "the sum of many small independent effects", "offset, V_T mismatch, thermal noise (Module 35)"], ["Exponential", "time until a random event", "time between particle hits, time to failure"], ["Poisson (discrete)", "counts of rare independent events", "defects per die (Part 1)"]]),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "X is uniform between 0 and 4. P(1 < X < 2)?", a: 0.25, why: "Density 1/4 over a width of 1: area 0.25." },
        { t: "mcq", q: "A density has value 3 at some point. Is that a problem?", opts: [["No: density can exceed 1 as long as the total area is 1", true, "Uniform on 0 to 0.2 has density 5."], ["Yes: probabilities can't exceed 1", false, "The density isn't a probability; areas are."], ["Only for Gaussians", false, "Any narrow distribution has a tall density."]] },
        { t: "num", q: "Exponential with mean 1 µs (time between events). P(wait > 2 µs)?", a: 0.1353, tol: 0.01, why: "P(X > t) = e^(−t/mean) = e^(−2) = 0.135." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is a probability density, and how do you get a probability from it?", model: "It's probability per unit of the variable, like per volt. The chance of the variable landing in a range is the area under the density over that range, and the total area is one." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Mean, variance and standard deviation", mins: 25,
    blurb: "Two numbers summarise most distributions: where the centre is, and how wide the spread is.",
    takeaway: "Mean (expected value) E[X] = Σ x·P(x) or ∫x f(x)dx: the balance point. Variance Var(X) = E[(X − μ)²]: the average squared distance from the mean. Standard deviation σ = √Var, in the same units as X. Shortcut: Var(X) = E[X²] − μ². Scaling: E[aX + b] = aμ + b; Var(aX + b) = a²Var(X), so σ scales by |a| and shifting changes nothing. Uniform on ±a: σ = a/√3 (quantization: LSB/√12). The rms of a zero-mean signal is its σ.",
    steps: [
      { k: "learn", title: "Mean: the balance point", b: [
        `<div class="eq">μ = E[X] = Σ x·P(x)   or   ∫ x·f(x) dx</div>`,
        `<p>Put the distribution on a see-saw: the mean is where it balances. For a fair die: (1 + 2 + … + 6)/6 = 3.5, a value the die never shows.</p>`,
      ]},
      { k: "learn", title: "Variance and σ: the spread", b: [
        `<div class="eq">Var(X) = E[(X − μ)²]   σ = √Var(X)</div>`,
        `<p>Why squared? Distances above and below the mean would cancel if you just averaged them. Squaring makes them all count, and makes the maths (Part 5) beautifully simple. σ brings the answer back to the original units.</p>`,
        `<div class="key"><b>Engineering link.</b> For a zero-mean signal, σ is its rms value. Noise “of 10 µV rms” has σ = 10 µV. Variance is then the noise <i>power</i> (per ohm): that's why noise powers add (Module 36).</div>`,
      ]},
      { k: "play", title: "Scale and shift", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 1, b = 0;
          const r0 = rng(5), base = Array.from({ length: 4000 }, () => 2 * r0() - 1);
          function draw() {
            const xs = base.map((x) => a * x + b), m = xs.reduce((p, q) => p + q, 0) / xs.length, v = xs.reduce((p, q) => p + (q - m) ** 2, 0) / xs.length;
            f.innerHTML = plot({ x: [-5, 5], y: [0, 1.2], xt: [-4, -2, 0, 2, 4], yt: [0, 0.5, 1], xl: "x", h: 200, series: [{ pts: hist(xs, -5, 5, 50), cls: "s2" }, { pts: [[m, 0], [m, 1.2]], cls: "s4" }, { pts: [[m - Math.sqrt(v), 0.05], [m + Math.sqrt(v), 0.05]], cls: "s3" }], label: "Histogram of aX + b with the mean (red dashed) and a bar one sigma either side (green)" });
            ro.innerHTML = readout([["Mean (predicted aμ + b = b)", fmt(m, 3)], ["σ (predicted |a|/√3)", `${fmt(Math.sqrt(v), 3)} (${fmt(Math.abs(a) / Math.sqrt(3), 3)})`]]);
          }
          host.append(f, slider({ id: id + "-a", label: "Scale a", min: -3, max: 3, step: 0.1, value: a }, (v) => { a = v; draw(); }).el, slider({ id: id + "-b", label: "Shift b", min: -2, max: 2, step: 0.1, value: b }, (v) => { b = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">X is uniform on ±1 (σ = 1/√3 = 0.577). Shifting moves the mean and leaves σ alone. Scaling stretches σ by |a|. A gain stage does exactly this to an offset: multiplies its mean and its σ by the gain.</p>`,
      ]},
      { k: "math", title: "Two worked results", b: [
        { t: "reveal", label: "Uniform on −a…a: σ = a/√3", html: `<p>Density 1/(2a). E[X²] = ∫x²/(2a) dx from −a to a = a²/3. Mean 0, so Var = a²/3, σ = a/√3. With a = LSB/2: σ = LSB/(2√3) = LSB/√12, the quantization noise of Module 32.</p>` },
        { t: "reveal", label: "Fair die: σ ≈ 1.71", html: `<p>E[X²] = (1 + 4 + 9 + 16 + 25 + 36)/6 = 91/6. Var = 91/6 − 3.5² = 35/12 ≈ 2.92. σ ≈ 1.71.</p>` },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "An offset has mean 0.5 mV and σ = 2 mV. After a gain of 10, its σ (mV)?", a: 20, why: "σ scales by |gain|. The mean becomes 5 mV." },
        { t: "num", q: "Values 1, 3, 5 with equal probability. Variance?", a: 2.667, tol: 0.01, why: "Mean 3; squared deviations 4, 0, 4; average 8/3 = 2.67." },
        { t: "num", q: "A noise voltage has σ = 30 µV and zero mean. Its rms (µV)?", a: 30, why: "For zero mean, rms = σ." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the variance defined with squares rather than plain distances from the mean?", model: "Plain signed distances average to zero, so they can't measure spread. Squaring makes every deviation count positively, and it gives variance the convenient property that variances of independent quantities simply add. Taking the square root, sigma, returns to the original units." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "Sums, averages and correlation", mins: 30,
    blurb: "Means always add. Variances add when the parts are independent. Averaging shrinks σ by √N. Correlation is the difference between cancelling and adding.",
    takeaway: "E[X + Y] = E[X] + E[Y], always. Var(X ± Y) = Var X + Var Y ± 2ρσ_Xσ_Y, where ρ (−1…1) is the correlation coefficient. Independent (ρ = 0): variances add, σ_total = √(σ_X² + σ_Y²): the RSS rule of Module 27. Averaging N independent samples divides σ by √N. Differential circuits take X − Y: whatever the two sides share (ρ near 1, e.g. temperature, supply, process) cancels, leaving only the uncorrelated part: the mathematics behind matching and common-mode rejection.",
    steps: [
      { k: "learn", title: "Variances add (when independent)", b: [
        `<div class="eq">Var(X + Y) = Var(X) + Var(Y)   (independent)</div>`,
        `<p>Not the σs: the <b>squares</b> of the σs. Two independent 3 mV and 4 mV errors make a 5 mV total, not 7.</p>`,
        `<p class="aside">Var(X − Y) is the same: subtracting an independent random amount spreads things just as much as adding it.</p>`,
      ]},
      { k: "math", title: "Averaging: the √N law", b: [
        steps([["Mean of N independent samples, each σ", "X̄ = (X₁ + … + X_N)/N"], ["Var of the sum", "Nσ²"], ["Divide by N (scales Var by 1/N²)", "Var(X̄) = σ²/N"], ["So", "σ_X̄ = σ/√N"]]),
        `<p>Average 100 readings and the noise drops 10×. To halve it again: 400 readings. Diminishing returns, but very real: it's why a chip's ADC averages, and why big transistors match better (Module 35).</p>`,
      ]},
      { k: "play", title: "Correlation: add or cancel", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let rho = 0.8;
          const r0 = rng(21), U = Array.from({ length: 600 }, () => [gauss(r0), gauss(r0)]);
          function draw() {
            const pts = U.map(([a, b]) => [a, rho * a + Math.sqrt(1 - rho * rho) * b]);
            const sd = (arr) => { const m = arr.reduce((p, q) => p + q, 0) / arr.length; return Math.sqrt(arr.reduce((p, q) => p + (q - m) ** 2, 0) / arr.length); };
            const X = 160, Y = 160, k = 40;
            let s = `<line x1="0" y1="${Y}" x2="320" y2="${Y}" style="stroke:var(--muted)"/><line x1="${X}" y1="0" x2="${X}" y2="320" style="stroke:var(--muted)"/>`;
            pts.forEach(([a, b]) => { s += `<circle cx="${(X + k * a).toFixed(1)}" cy="${(Y - k * b).toFixed(1)}" r="2.2" style="fill:var(--cool);opacity:.6"/>`; });
            s += S.t(312, Y - 6, "X", { a: "end", cls: "lab" }) + S.t(X + 6, 14, "Y", { a: "start", cls: "lab" });
            f.innerHTML = S.svg(320, 320, s, { label: "Scatter plot of 600 pairs X, Y with the chosen correlation", max: 320 });
            ro.innerHTML = readout([["ρ", fmt(rho, 3)], ["σ of X + Y (theory √(2 + 2ρ))", `${fmt(sd(pts.map(([a, b]) => a + b)), 3)} (${fmt(Math.sqrt(2 + 2 * rho), 3)})`], ["σ of X − Y (theory √(2 − 2ρ))", `${fmt(sd(pts.map(([a, b]) => a - b)), 3)} (${fmt(Math.sqrt(Math.max(0, 2 - 2 * rho)), 3)})`]]);
          }
          host.append(f, slider({ id: id + "-r", label: "Correlation ρ", min: -1, max: 1, step: 0.05, value: rho }, (v) => { rho = Math.max(-0.999, Math.min(0.999, v)); draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Each dot is one chip: X and Y could be the threshold voltages of two transistors. Shared causes (same wafer, same temperature) make them correlated: the cloud tilts. The difference X − Y, which is what a differential pair's offset depends on, shrinks as ρ → 1. Independent (ρ = 0): √2 times one σ, either way.</p>`,
      ]},
      { k: "why", title: "Why differential circuits win", b: [
        `<div class="eq">Var(X − Y) = σ_X² + σ_Y² − 2ρσ_Xσ_Y</div>`,
        `<p>Two transistors drawn side by side share almost everything: process corner, temperature, supply. Their thresholds might each vary ±50 mV chip to chip (ρ ≈ 0.99), but their <i>difference</i> varies by only a few mV. A differential pair responds to the difference. Single-ended circuits feel the full ±50 mV.</p>`,
        `<div class="key"><b>Design rule.</b> Make what matters depend on a difference of things that share their randomness. Matching, common-centroid layout and differential signalling are all ways of pushing ρ towards 1.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Average of 16 independent readings, each σ = 8 µV. σ of the average (µV)?", a: 2, why: "8/√16 = 2 µV." },
        { t: "num", q: "X and Y each have σ = 10 mV with ρ = 0.98. σ of X − Y (mV)?", a: 2, tol: 0.02, why: "√(100 + 100 − 2 × 0.98 × 100) = √4 = 2 mV." },
        { t: "num", q: "Independent errors σ = 5 and 12. σ of their sum?", a: 13, why: "√(25 + 144) = 13." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain, with correlation, why two well-matched transistors have a much smaller offset than either one's threshold variation.", model: "The two thresholds vary a lot from chip to chip, but mostly together, because they share the same process, wafer position and temperature, so they're strongly correlated. The offset depends on their difference, whose variance is the sum of the two variances minus twice the correlation term. With correlation near one, most of the variation cancels and only the small independent part remains." },
      ]},
    ],
  };

  const p6 = {
    id: "p6", title: "Master it", mins: 30,
    blurb: "Yield, testing, distributions and combining random quantities.",
    takeaway: "You can compute yields, reason about test results with Bayes, use densities, find means and variances, and combine independent and correlated random quantities.",
    steps: [
      { k: "check", title: "Problem 1: redundancy", b: [
        `<p>An SRAM block works with probability 0.9. A designer adds a spare: the chip works if at least one of two (independent) blocks works.</p>`,
        { t: "num", q: "New probability the function works (%)?", a: 99, why: "1 − 0.1² = 0.99. Redundancy is how big memories reach usable yield." },
      ]},
      { k: "check", title: "Problem 2: area trade", b: [
        { t: "num", q: "D = 0.5 /cm². A 1 cm² die has yield e^(−0.5). If you split the design into four 0.25 cm² chiplets tested separately, the yield of each chiplet (%)?", a: 88.2, tol: 0.01, why: "e^(−0.125) = 88.2%, versus 60.7% for the single big die. Only good chiplets get assembled." },
      ]},
      { k: "check", title: "Problem 3: Bayes", b: [
        { t: "num", q: "0.2% of chips have a latent defect. A burn-in test catches 90% of them and falsely fails 0.5% of good chips. P(defect | fail) in %?", a: 26.5, tol: 0.03, why: "0.0018/(0.0018 + 0.00499) = 26.5%." },
      ]},
      { k: "check", title: "Problem 4: combining", b: [
        { t: "num", q: "An ADC's input-referred error: thermal noise σ = 60 µV, quantization LSB = 244 µV (uniform), independent. Total σ (µV)?", a: 92.5, tol: 0.02, hint: "Quantization σ = LSB/√12.", why: "LSB/√12 = 70.4 µV; √(60² + 70.4²) = 92.5 µV." },
      ]},
      { k: "check", title: "Problem 5: averaging", b: [
        { t: "num", q: "A sensor reading has σ = 1 mV. How many independent readings must you average to get σ ≤ 0.1 mV?", a: 100, tol: 0, why: "σ/√N ≤ 0.1σ → N ≥ 100." },
      ]},
      { k: "say", title: "Problem 6: explain it", b: [
        { t: "say", q: "A colleague adds the σ of five independent error sources directly to get a total. Explain what's wrong and what to do.", model: "For independent random errors, variances add, not standard deviations, because errors partly cancel. Adding the sigmas gives the worst case, which is too pessimistic. Square each sigma, add the squares and take the square root. Only fully correlated errors add their sigmas directly." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m34", eyebrow: "Math Toolkit · Module 34", title: "Probability and Random Variables",
    intro: `<p>Six parts: the three rules (and chip yield), conditional probability and Bayes (chip testing), distributions and densities, mean and variance, sums, averages and correlation, and mastery problems.</p><p>Why a chip designer needs this: yield, test, matching and noise are all probability. No two chips are alike; specs are met statistically.</p><p class="aside">Before this: Modules 8 (exp/log) and 14 (integrals). Builds on Module 27's worst case vs RSS.</p>`,
    after: `<p>Next: Module 35 meets the bell curve, explains why it's everywhere, and uses it to predict mismatch and yield.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <p><b>Rules:</b> P(not A) = 1 − P(A); independent AND → multiply; OR → P(A) + P(B) − P(A and B). Yield pᴺ ≈ e^(−Nq); Poisson Y = e^(−AD).</p>
      <p><b>Conditional:</b> P(A|B) = P(A and B)/P(B). <b>Bayes:</b> P(A|B) = P(B|A)P(A)/P(B). Count a concrete population. Test escapes → DPPM.</p>
      <p><b>Density:</b> P(a &lt; X &lt; b) = ∫f; total 1. Uniform (rounding), Gaussian (sums), exponential (waiting: P(X &gt; t) = e^(−t/mean)), Poisson (counts).</p>
      <div class="eq">μ = E[X]   Var = E[(X − μ)²] = E[X²] − μ²   σ = √Var</div>
      <p>E[aX + b] = aμ + b; Var(aX + b) = a²Var. Uniform ±a: σ = a/√3. Zero-mean: rms = σ.</p>
      <p><b>Sums:</b> means add; Var(X ± Y) = σ_X² + σ_Y² ± 2ρσ_Xσ_Y. Independent → RSS. Average of N: σ/√N. Correlated parts cancel in differences.</p>`,
  };
  Course.start(window.CHAPTER);
})();
