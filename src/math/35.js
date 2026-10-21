(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;
  const tbl = (head, rows) => `<div class="tbl"><table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`;
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return (s + 0.5) / 4294967296; }; }
  const gauss = (r) => Math.sqrt(-2 * Math.log(r())) * Math.cos(2 * Math.PI * r());
  /* erfc with small relative error, good far into the tails. */
  function erfc(x) {
    const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
    const a = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? a : 2 - a;
  }
  const Q = (z) => 0.5 * erfc(z / Math.SQRT2); /* P(Z > z) */
  const phi = (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  const ppm = (p) => (p >= 0.01 ? fmt(100 * p, 3) + "%" : p >= 1e-6 ? fmt(p * 1e6, 3) + " ppm" : fmt(p * 1e9, 3) + " ppb");
  function hist(xs, lo, hi, bins) {
    const w = (hi - lo) / bins, c = new Array(bins).fill(0);
    xs.forEach((x) => { const b = Math.floor((x - lo) / w); if (b >= 0 && b < bins) c[b]++; });
    const pts = [];
    c.forEach((n, i) => { const d = n / (xs.length * w), x0 = lo + i * w; pts.push([x0, 0], [x0, d], [x0 + w, d], [x0 + w, 0]); });
    return pts;
  }

  const p1 = {
    id: "p1", title: "Why the bell curve is everywhere", mins: 20,
    blurb: "Add up many small independent random effects, whatever their shape, and the total is bell-shaped. That's the central limit theorem.",
    takeaway: "Central limit theorem: the sum (or average) of many independent random contributions tends to a normal (Gaussian) distribution, almost regardless of what each contribution looks like. Means add and variances add (Module 34), so the sum of N terms with σ each has σ√N. Density: f(x) = e^(−(x − μ)²/2σ²)/(σ√2π). Transistor mismatch (thousands of dopant atoms), thermal noise (countless electrons) and timing jitter are sums of many tiny effects, which is why they're Gaussian.",
    steps: [
      { k: "play", title: "Add up uniform random numbers", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let N = 1;
          function draw() {
            const r = rng(3), xs = [], M = 6000;
            for (let i = 0; i < M; i++) { let s = 0; for (let k = 0; k < N; k++) s += 2 * r() - 1; xs.push(s); }
            const sd = Math.sqrt(N / 3), lo = -Math.max(3, 4 * sd), hi = -lo;
            f.innerHTML = plot({ x: [lo, hi], y: [0, 0.45 / sd + 0.05], xt: [lo, 0, hi].map((v) => Math.round(v)), yt: [], xl: "sum of N uniform(−1, 1) numbers", h: 220, series: [{ pts: hist(xs, lo, hi, 40), cls: "s2" }, { f: (x) => phi(x / sd) / sd, cls: "s1", n: 400 }], label: "Histogram of the sum (blue) and the normal curve with the same sigma (orange)" });
            ro.innerHTML = readout([["N", N], ["σ of the sum = √(N/3)", fmt(sd, 3)]]);
          }
          host.append(f, slider({ id: id + "-n", label: "How many numbers to add, N", min: 1, max: 12, step: 1, value: N }, (v) => { N = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">N = 1: flat. N = 2: a triangle. N = 3 is already close to the bell, and by 6 you can't tell them apart. Nothing about “uniform” was special: start from any shape with finite variance and the same thing happens.</p>`,
      ]},
      { k: "learn", title: "The normal density", b: [
        `<div class="eq">f(x) = e<sup>−(x−μ)²/2σ²</sup> / (σ√(2π))</div>`,
        `<ul><li>Centred on μ, symmetric</li><li>Width set by σ: inflection points at μ ± σ</li><li>Tails fall off extremely fast (like e<sup>−x²</sup>), which is why “6σ” events are so rare</li></ul>`,
      ]},
      { k: "why", title: "Why chips are Gaussian", b: [
        `<p>A small transistor's threshold depends on how many dopant atoms happen to sit under its gate: maybe a few hundred, each placed at random. The count's fluctuation is a sum of many independent yes/no events: Gaussian. Same for thermal noise (the sum of many electrons' random motions) and for delay variation along a long path (the sum of many gate delays).</p>`,
        `<div class="key"><b>When it fails.</b> If one effect dominates (a single defect), or effects multiply rather than add (some leakage currents are log-normal), the tails stop being Gaussian. Always look at the histogram before trusting σ-based yield numbers far into the tail.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A path has 25 gates, each with independent delay variation σ = 2 ps. σ of the path delay (ps)?", a: 10, why: "σ√N = 2 × 5 = 10 ps (not 50: independent variations partly cancel)." },
        { t: "mcq", q: "Which is least likely to be Gaussian?", opts: [["The number of killer defects on a die (usually 0, 1 or 2)", true, "A count of rare events is Poisson: discrete and lopsided."], ["The offset of a differential pair", false, "Many random dopants: Gaussian."], ["Thermal noise voltage", false, "Classic Gaussian."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In your own words, what does the central limit theorem say and why does it matter for chips?", model: "When you add up many small, independent random effects, the total follows a bell-shaped normal distribution, whatever the individual effects look like. Most chip variations, like threshold mismatch, noise and path delay, are sums of many tiny independent causes, so they're close to normal, and we can predict yield from just a mean and a sigma." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Reading the bell: σ, z and tails", mins: 25,
    blurb: "How many chips fall outside ±kσ? Memorise a short table and convert any spec into a failure rate.",
    takeaway: "z = (x − μ)/σ measures distance from the mean in σ units. P(|Z| < 1) = 68.3%, < 2: 95.4%, < 3: 99.73%. Outside: 1σ 31.7%, 2σ 4.6%, 3σ 2700 ppm, 4σ 63 ppm, 5σ 0.57 ppm, 6σ 2 ppb. One-sided tail: Q(z) = P(Z > z), half of the two-sided value. Yield for a symmetric spec ±L: 1 − 2Q(L/σ). Each extra σ of margin cuts failures by a large and growing factor.",
    steps: [
      { k: "learn", title: "z-scores", b: [
        `<div class="eq">z = (x − μ)/σ</div>`,
        `<p>Every normal distribution becomes the same standard one (mean 0, σ 1) when you measure in σ units. So one table serves every problem.</p>`,
        tbl(["k", "Inside ±kσ", "Outside ±kσ"], [["1", "68.3%", "31.7%"], ["2", "95.4%", "4.6%"], ["3", "99.73%", "0.27% = 2700 ppm"], ["4", "99.9937%", "63 ppm"], ["5", "—", "0.57 ppm"], ["6", "—", "2 ppb"]]),
      ]},
      { k: "play", title: "Spec limits on the bell", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let L = 2, mu = 0;
          function draw() {
            const fail = Q(L - mu) + Q(L + mu);
            f.innerHTML = plot({ x: [-6, 6], y: [0, 0.45], xt: [-6, -4, -2, 0, 2, 4, 6], xtf: (v) => v + "σ", yt: [], xl: "value", h: 220, areas: [{ f: (x) => phi(x - mu), from: -L, to: L, cls: "ar3", n: 400 }, { f: (x) => phi(x - mu), from: L, to: 6, cls: "ar2", n: 200 }, { f: (x) => phi(x - mu), from: -6, to: -L, cls: "ar2", n: 200 }], series: [{ f: (x) => phi(x - mu), cls: "s1", n: 500 }, { pts: [[-L, 0], [-L, 0.45]], cls: "s4" }, { pts: [[L, 0], [L, 0.45]], cls: "s4" }], label: "Normal curve with spec limits (red dashed); passing area green, failing tails blue" });
            ro.innerHTML = readout([["Spec ±", fmt(L, 3) + "σ"], ["Mean offset", fmt(mu, 3) + "σ"], ["Yield", fmt(100 * (1 - fail), 6) + "%"], ["Failures", ppm(fail)]]);
          }
          host.append(f, slider({ id: id + "-l", label: "Spec limit ±L (in σ)", min: 0.5, max: 6, step: 0.1, value: L }, (v) => { L = v; draw(); }).el,
            slider({ id: id + "-m", label: "Mean shifted off-centre by", min: 0, max: 2, step: 0.1, value: mu, show: (v) => fmt(v, 3) + "σ" }, (v) => { mu = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Each step from 3σ to 4σ to 5σ cuts the failures by 40×, then 100×: the tail shrinks faster than exponentially. Now shift the mean by 1σ: at ±4σ limits the failures jump from 63 ppm to about 1350 ppm. A biased design wastes its margin.</p>`,
      ]},
      { k: "math", title: "Using it", b: [
        `<p>An op amp's offset has μ = 0 and σ = 3 mV. The spec is |V<sub>os</sub>| &lt; 7.5 mV.</p>`,
        { t: "reveal", label: "Yield", html: `<p>L/σ = 2.5. P(|Z| &gt; 2.5) = 2Q(2.5) = 2 × 0.0062 = 1.24%. Yield = 98.76%: 12 400 failures per million. Probably not acceptable. To reach 4σ (63 ppm) you'd need σ ≤ 1.9 mV: Part 3 shows that costs transistor area.</p>` },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "μ = 1.20 V, σ = 0.02 V. z-score of 1.25 V?", a: 2.5, why: "(1.25 − 1.20)/0.02 = 2.5." },
        { t: "num", q: "Fraction of a normal population above μ + 2σ (one side, %)?", a: 2.28, tol: 0.02, why: "Half of 4.55%: 2.28%." },
        { t: "mcq", q: "A spec sits at ±3σ. You redesign and halve σ. Failures go from 2700 ppm to about…", opts: [["0.002 ppm (2 ppb): limits are now at ±6σ", true, "Halving σ doubles the distance in σ units."], ["1350 ppm", false, "Tails aren't linear: 6σ is astronomically rarer than 3σ."], ["63 ppm", false, "That's ±4σ."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a small reduction in σ give a huge drop in failure rate?", model: "Failures are the area in the tails beyond the spec limit, and the normal curve's tails fall off like e to the minus z squared. Shrinking sigma moves the limit further out in sigma units, and because the tail shrinks faster than exponentially, each extra sigma of margin cuts the failures by a larger factor." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Mismatch: Pelgrom's law", mins: 30,
    blurb: "Two identical transistors are never identical. Their difference shrinks as 1/√area, because each one averages more atoms.",
    takeaway: "Pelgrom's law: σ(ΔV_T) = A_VT/√(W·L) for two matched devices, with A_VT ≈ 2–5 mV·µm in modern processes. Quadrupling the gate area halves the mismatch, the √N averaging law of Module 34: a bigger gate averages more dopant atoms. Current mismatch in a mirror (strong inversion): σ(ΔI/I) ≈ 2σ(ΔV_T)/V_ov (plus a small β term), so a larger overdrive helps current matching. Offset of a differential pair ≈ σ(ΔV_T) (plus load and β terms). Precision costs area, and area costs capacitance and speed.",
    steps: [
      { k: "why", title: "Where mismatch comes from", b: [
        `<p>A transistor's threshold depends on the dopant atoms under its gate. In a small device there might be a few hundred, placed at random. Count fluctuations go like √N (Module 34). A device with 4× the area has 4× the atoms and 2× the absolute fluctuation, but its threshold depends on the <i>fraction</i>, which fluctuates 2× <b>less</b>.</p>`,
        `<div class="eq">σ(ΔV_T) = A_VT / √(W·L)</div>`,
        `<p class="aside">A<sub>VT</sub> is the process's “matching coefficient”, in mV·µm. It's measured by the fab and given in the design kit.</p>`,
      ]},
      { k: "play", title: "Size for matching", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let WL = 1, A = 4, spec = 5;
          function draw() {
            const sd = A / Math.sqrt(WL), r = rng(17), xs = Array.from({ length: 3000 }, () => sd * gauss(r));
            const lim = Math.max(20, 4 * sd);
            f.innerHTML = plot({ x: [-lim, lim], y: [0, 0.42 / sd], xt: [-lim, -lim / 2, 0, lim / 2, lim].map((v) => Math.round(v)), yt: [], xl: "ΔV_T (mV)", h: 210, series: [{ pts: hist(xs, -lim, lim, 50), cls: "s2" }, { f: (x) => phi(x / sd) / sd, cls: "s1", n: 400 }, { pts: [[-spec, 0], [-spec, 0.42 / sd]], cls: "s4" }, { pts: [[spec, 0], [spec, 0.42 / sd]], cls: "s4" }], label: "Histogram of threshold mismatch for 3000 simulated pairs, with spec limits" });
            const fail = 2 * Q(spec / sd);
            ro.innerHTML = readout([["σ(ΔV_T) = A_VT/√(WL)", fmt(sd, 3) + " mV"], ["Spec / σ", fmt(spec / sd, 3)], ["Pairs outside spec", ppm(fail)], ["Area for a 4σ design", fmt((A * 4 / spec) ** 2, 3) + " µm²"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "Gate area W·L", min: 0.1, max: 100, log: true, value: WL, show: (v) => fmt(v, 3) + " µm²" }, (v) => { WL = v; draw(); }).el,
            slider({ id: id + "-k", label: "Process A_VT", min: 1, max: 8, step: 0.5, value: A, show: (v) => fmt(v, 3) + " mV·µm" }, (v) => { A = v; draw(); }).el,
            slider({ id: id + "-s", label: "Offset spec ±", min: 1, max: 20, step: 0.5, value: spec, show: (v) => fmt(v, 3) + " mV" }, (v) => { spec = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">At 1 µm² the pairs spread ±4 mV (1σ) and a 5 mV spec fails about 21% of them. Make the gate 10 µm²: σ = 1.3 mV, failures drop below 0.02%. The last line tells you the area for 4σ: precision analog is paid for in silicon.</p>`,
      ]},
      { k: "math", title: "Current mirrors", b: [
        `<p>I = (k/2)V<sub>ov</sub>²: a threshold error ΔV<sub>T</sub> changes the current by ΔI/I = −2ΔV<sub>T</sub>/V<sub>ov</sub> (Module 27's sensitivity).</p>`,
        `<div class="eq">σ(ΔI/I) ≈ 2·σ(ΔV_T)/V_ov</div>`,
        `<p>σ(ΔV<sub>T</sub>) = 2 mV and V<sub>ov</sub> = 0.2 V: σ(ΔI/I) = 2%. With V<sub>ov</sub> = 0.4 V: 1%. Matching currents favours large overdrive; matching voltages (differential pairs) favours large area. Real design juggles both.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A_VT = 4 mV·µm, W = 4 µm, L = 1 µm. σ(ΔV_T) (mV)?", a: 2, why: "4/√4 = 2 mV." },
        { t: "num", q: "To get 0.5 mV with the same A_VT, what W·L (µm²)?", a: 64, why: "(4/0.5)² = 64 µm²: 16× the area for 4× better matching." },
        { t: "num", q: "Mirror with σ(ΔV_T) = 3 mV and V_ov = 0.15 V. σ(ΔI/I) in %?", a: 4, unit: "%", why: "2 × 3/150 = 4%." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do bigger transistors match better, and what's the price?", model: "A transistor's threshold reflects the average of many randomly placed dopant atoms under its gate. A bigger gate averages more atoms, so the random fluctuation shrinks as one over the square root of the area. The price is area itself, and the extra capacitance that comes with it, which slows the circuit and costs power." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Yield, Cpk and margin", mins: 25,
    blurb: "One number tells a factory how comfortably a parameter fits its spec: Cpk. Many specs multiply into the final yield.",
    takeaway: "Cpk = min(USL − μ, μ − LSL)/(3σ): the distance from the mean to the nearer spec limit, in units of 3σ. Cpk = 1 → nearest limit at 3σ (≤ 1350 ppm on that side); 1.33 → 4σ (≈ 32 ppm); 1.67 → 5σ; 2 → 6σ. Centring the mean is as valuable as shrinking σ. A chip must pass every spec: if they're independent, total yield = product of each spec's yield, so ten specs at 99% give only 90%.",
    steps: [
      { k: "learn", title: "Cpk", b: [
        `<div class="eq">Cpk = min(USL − μ, μ − LSL) / 3σ</div>`,
        tbl(["Cpk", "Nearest limit at", "Fails beyond it"], [["0.67", "2σ", "2.3%"], ["1.0", "3σ", "1350 ppm"], ["1.33", "4σ", "32 ppm"], ["1.67", "5σ", "0.3 ppm"], ["2.0", "6σ", "1 ppb"]]),
        `<p class="aside">Automotive and medical chips typically require Cpk ≥ 1.67 on every critical parameter.</p>`,
      ]},
      { k: "play", title: "Centre it or tighten it?", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let mu = 2, sd = 3;
          const LSL = -12, USL = 12;
          function draw() {
            const cpk = Math.min(USL - mu, mu - LSL) / (3 * sd), fail = Q((USL - mu) / sd) + Q((mu - LSL) / sd);
            f.innerHTML = plot({ x: [-20, 20], y: [0, 0.42 / sd], xt: [-20, -12, 0, 12, 20], yt: [], xl: "parameter (mV)", h: 200, areas: [{ f: (x) => phi((x - mu) / sd) / sd, from: LSL, to: USL, cls: "ar3", n: 400 }], series: [{ f: (x) => phi((x - mu) / sd) / sd, cls: "s1", n: 500 }, { pts: [[LSL, 0], [LSL, 0.42 / sd]], cls: "s4" }, { pts: [[USL, 0], [USL, 0.42 / sd]], cls: "s4" }], label: "Distribution against fixed spec limits at minus and plus 12" });
            ro.innerHTML = readout([["Cpk", fmt(cpk, 3)], ["Failures", ppm(fail)]]);
          }
          host.append(f, slider({ id: id + "-m", label: "Mean μ", min: -6, max: 6, step: 0.25, value: mu, show: (v) => fmt(v, 3) + " mV" }, (v) => { mu = v; draw(); }).el,
            slider({ id: id + "-s", label: "σ", min: 1, max: 6, step: 0.1, value: sd, show: (v) => fmt(v, 3) + " mV" }, (v) => { sd = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Start: μ = 2 mV, σ = 3 mV, limits ±12 mV: Cpk = 1.11. Centring the mean (μ = 0) lifts it to 1.33 for free. Shrinking σ costs area or power. Systematic offsets (layout asymmetry, gradients) shift μ; good layout removes them.</p>`,
      ]},
      { k: "math", title: "Many specs at once", b: [
        `<p>A chip has 10 independent specs, each passed by 99% of parts:</p>`,
        `<div class="eq">Y = 0.99¹⁰ = 90.4%</div>`,
        `<p>With 100 specs at 99%: 37%. That's why each individual spec needs Cpk well above 1: a product of many “pretty good” yields is poor.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Spec 0.95–1.05 V, μ = 1.01 V, σ = 0.01 V. Cpk?", a: 1.333, tol: 0.01, why: "min(0.04, 0.06)/0.03 = 1.33." },
        { t: "num", q: "20 independent specs, each 99.9% yield. Overall yield (%)?", a: 98.02, tol: 0.005, why: "0.999²⁰ = 0.980." },
        { t: "mcq", q: "Which change raises Cpk more for μ = 3, σ = 2, limits ±9?", opts: [["Centring μ at 0 (Cpk 1.0 → 1.5)", true, "Now the nearest limit is 9 away, not 6."], ["Cutting σ to 1.8 (Cpk 1.0 → 1.11)", false, "Helps, but less."], ["They're equal", false, "Work out both."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does Cpk measure, and why can centring a distribution matter as much as narrowing it?", model: "Cpk is the distance from the mean to the nearest spec limit, measured in units of three sigma. Failures come mostly from the nearer tail, so if the mean is off-centre, one tail is much closer to its limit. Moving the mean back to the middle pushes that limit further out in sigma units, which can improve the failure rate as much as reducing sigma." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "Monte Carlo, corners, and how much to trust them", mins: 30,
    blurb: "Simulate hundreds of random chips, or a handful of worst-case corners. Know what each tells you, and how uncertain your estimate is.",
    takeaway: "Process corners (TT, FF, SS, FS, SF; plus voltage and temperature) push global parameters to deterministic extremes: good for speed and power limits. Monte Carlo draws random global and local (mismatch) variations for each run: good for offset, matching and yield. From N runs, the mean is known to ±σ/√N and σ itself to about ±σ/√(2N): 100 runs pin σ to about ±7%. You can't see a 6σ failure (2 per billion) by brute force; estimate σ from moderate N and extrapolate, or use importance sampling. Always ask how many samples a result is based on.",
    steps: [
      { k: "learn", title: "Corners vs Monte Carlo", b: [
        tbl(["Method", "What varies", "Answers"], [["Corners (e.g. SS, 0.9 V, 125 °C)", "global process, supply, temperature, pushed to extremes", "worst-case speed, power, function"], ["Monte Carlo", "random global + local mismatch, sampled", "spreads, σ, yield, offset"]]),
        `<p class="aside">FS means fast NMOS, slow PMOS: skewed corners catch circuits that depend on N and P strengths balancing (logic thresholds, SRAM).</p>`,
      ]},
      { k: "play", title: "How sure is your σ?", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let N = 50, seed = 1;
          function run(sd) { const r = rng(sd * 7919), xs = Array.from({ length: N }, () => 2 * gauss(r)); const m = xs.reduce((a, b) => a + b, 0) / N; return [m, Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (N - 1))]; }
          function draw() {
            const runs = Array.from({ length: 40 }, (_, k) => run(seed * 100 + k));
            const pts = runs.map(([, s], k) => ({ x: k + 1, y: s, r: 4, cls: k === 0 ? "mk" : "mk2" }));
            const band = 2 / Math.sqrt(2 * N);
            f.innerHTML = plot({ x: [0, 41], y: [1, 3], xt: [1, 10, 20, 30, 40], yt: [1, 1.5, 2, 2.5, 3], xl: "repeat of the whole Monte Carlo study", yl: "σ estimate", h: 210, areas: [{ f: () => 2 + band, base: 2 - band, cls: "ar3" }], series: [{ f: () => 2, cls: "s5" }], marks: pts, label: "Sigma estimates from 40 repeated Monte Carlo studies, true sigma 2, with the plus or minus one standard-error band" });
            ro.innerHTML = readout([["Runs per study N", N], ["True σ", "2.00"], ["Expected scatter of the estimate ≈ σ/√(2N)", "±" + fmt(band, 3) + " (" + fmt((100 * band) / 2, 3) + "%)"], ["This study's estimate", fmt(runs[0][1], 3)]]);
          }
          const again = el(`<button type="button" class="btn">New random seeds</button>`);
          again.addEventListener("click", () => { seed++; draw(); });
          const row = el(`<div class="row"></div>`); row.appendChild(again);
          host.append(f, slider({ id: id + "-n", label: "Runs per Monte Carlo study", min: 10, max: 2000, log: true, value: N, show: (v) => Math.round(v) }, (v) => { N = Math.round(v); draw(); }).el, row, ro);
          draw();
        },
        `<p class="aside">Each dot is a complete Monte Carlo study of N runs, all simulating the same circuit (true σ = 2). With 10 runs the estimates scatter ±20% or more: you could report σ = 1.6 or 2.5 by luck. With 1000 they agree to about ±2%.</p>`,
      ]},
      { k: "why", title: "The rare-failure problem", b: [
        `<p>An SRAM with 10⁹ cells needs each cell to fail less than about once in 10¹⁰: beyond 6σ. Seeing even one failure by brute force takes ~10¹⁰ simulations: impossible.</p>`,
        `<ul><li>Estimate μ and σ from a few hundred runs, then compute the tail from the normal curve, if you trust the Gaussian shape out there.</li><li>Or use importance sampling: deliberately sample the dangerous region more often and re-weight the results.</li></ul>`,
        `<div class="key"><b>Report the sample size.</b> “Monte Carlo shows no failures” from 200 runs only says the failure rate is probably below about 1.5% (the 95% “rule of three”: 3/N).</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Monte Carlo with 200 runs. Roughly what relative uncertainty (1σ, %) on the σ estimate?", a: 5, tol: 0.03, why: "1/√(2N) = 1/√400 = 5%." },
        { t: "num", q: "500 Monte Carlo runs, zero failures. Upper bound (95%) on the failure rate, by the rule of three (%)?", a: 0.6, unit: "%", why: "3/500 = 0.6%. Zero observed ≠ zero rate." },
        { t: "mcq", q: "You need worst-case clock speed across process, voltage and temperature. Best tool?", opts: [["Corner simulations (e.g. SS, low V, hot)", true, "Global extremes set worst-case speed."], ["Monte Carlo of local mismatch only", false, "Mismatch matters for offsets; speed limits come from global corners (plus some local spread)."], ["A single typical simulation", false, "Typical tells you nothing about the worst case."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't you verify a one-in-a-billion failure rate just by running more Monte Carlo simulations?", model: "To see failures that happen once in a billion trials you'd need billions of runs, far too many to simulate. Instead you estimate the mean and sigma from a manageable number of runs and calculate the tail probability from the distribution, checking that the shape really is Gaussian, or you use importance sampling to concentrate runs in the failure region." },
      ]},
    ],
  };

  const p6 = {
    id: "p6", title: "Master it", mins: 30,
    blurb: "From σ to yield to transistor size.",
    takeaway: "You can explain why variation is Gaussian, convert specs into failure rates, size transistors for matching, use Cpk, combine yields, and judge the reliability of Monte Carlo results.",
    steps: [
      { k: "check", title: "Problem 1", b: [
        { t: "num", q: "A comparator's offset has σ = 1.5 mV, mean 0. Spec ±6 mV. Failures (ppm)?", a: 63, tol: 0.05, why: "±4σ → 63 ppm." },
      ]},
      { k: "check", title: "Problem 2", b: [
        { t: "num", q: "A_VT = 3.5 mV·µm. Gate area (µm²) needed for σ(ΔV_T) = 0.7 mV?", a: 25, why: "(3.5/0.7)² = 25 µm²." },
      ]},
      { k: "check", title: "Problem 3", b: [
        `<p>A differential pair's offset combines independent sources: V<sub>T</sub> mismatch σ = 2 mV and load-mirror mismatch referred to the input σ = 1.5 mV.</p>`,
        { t: "num", q: "Total offset σ (mV)?", a: 2.5, why: "√(4 + 2.25) = 2.5 mV." },
      ]},
      { k: "check", title: "Problem 4", b: [
        { t: "num", q: "Spec ±10 mV, σ = 2.5 mV, systematic mean offset 2.5 mV. Cpk?", a: 1, tol: 0.01, why: "min(7.5, 12.5)/7.5 = 1.0." },
      ]},
      { k: "check", title: "Problem 5", b: [
        { t: "num", q: "A 64-channel chip needs every channel's offset within spec. Each channel passes with 99.99%. Chip yield on this spec (%)?", a: 99.36, tol: 0.001, why: "0.9999⁶⁴ = 0.9936." },
      ]},
      { k: "say", title: "Problem 6: explain it", b: [
        { t: "say", q: "A colleague runs 30 Monte Carlo simulations, sees the worst offset at 6 mV, and declares the 10 mV spec safe. Critique this.", model: "Thirty runs are far too few to see rare tails: the largest of 30 samples is typically only about two sigma from the mean, and the sigma estimate itself is uncertain by about thirteen percent. The right approach is to estimate the mean and sigma, then compute how many sigma the spec is from the mean and the corresponding failure rate, using more runs to tighten the estimate and checking the Gaussian assumption." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m35", eyebrow: "Math Toolkit · Module 35", title: "The Normal Distribution, Mismatch and Yield",
    intro: `<p>Six parts: why the bell curve appears, reading σ and tails, Pelgrom's mismatch law, Cpk and combined yield, Monte Carlo and corners, and mastery problems.</p><p>Why a chip designer needs this: precision analog design is mismatch management, and every product decision depends on yield.</p><p class="aside">Before this: Module 34 (probability). Pairs with Boylestad Chapter 10 (offsets) and Module 27 (sensitivity).</p>`,
    after: `<p>Next: Module 36 treats noise, randomness that changes in time, and finds its spectrum.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <p><b>CLT:</b> sums of many independent effects → normal. σ of N-term sum = σ√N. f(x) = e^(−(x−μ)²/2σ²)/(σ√2π).</p>
      <p><b>z = (x − μ)/σ.</b> Inside ±1/2/3σ: 68.3/95.4/99.73%. Outside: 3σ 2700 ppm, 4σ 63 ppm, 5σ 0.57 ppm, 6σ 2 ppb. One side = half. Yield = 1 − 2Q(L/σ).</p>
      <div class="eq">σ(ΔV_T) = A_VT/√(WL)   σ(ΔI/I) ≈ 2σ(ΔV_T)/V_ov</div>
      <p>4× area → ½ mismatch. A_VT ≈ 2–5 mV·µm.</p>
      <p><b>Cpk</b> = min(USL − μ, μ − LSL)/3σ: 1 → 3σ, 1.33 → 4σ, 1.67 → 5σ. Centre the mean. Independent specs: yields multiply.</p>
      <p><b>Corners</b> for global extremes; <b>Monte Carlo</b> for spreads. Mean ±σ/√N; σ ±σ/√(2N). Zero failures in N runs → rate &lt; 3/N (95%). Rare tails: extrapolate or importance-sample.</p>`,
  };
  Course.start(window.CHAPTER);
})();
