(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;
  const tbl = (head, rows) => `<div class="tbl"><table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`;
  const sup = (v) => String(v).replace("-", "⁻").replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);
  const deg = (r) => (r * 180) / Math.PI;

  /* Loop gain T(jω) = T0 / Π(1 + jω/p) for real poles p (rad/s). Returns [|T|, phase in degrees]. */
  const loopT = (T0, poles, w) => [T0 / poles.reduce((a, p) => a * Math.hypot(1, w / p), 1), -poles.reduce((a, p) => a + deg(Math.atan(w / p)), 0)];
  /* Crossover (|T| = 1) by bisection on log ω; null if |T(0)| < 1. */
  function crossover(T0, poles) {
    if (T0 <= 1) return null;
    let lo = -6, hi = 12;
    for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (loopT(T0, poles, 10 ** m)[0] > 1) lo = m; else hi = m; }
    return 10 ** ((lo + hi) / 2);
  }
  /* Polynomial (coefficients, highest power first) from real poles: Π(1 + s/p), plus T0 on the constant term. */
  function closedPoly(T0, poles) {
    let c = [1];
    poles.forEach((p) => { const n = new Array(c.length + 1).fill(0); c.forEach((v, i) => { n[i] += v / p; n[i + 1] += v; }); c = n; });
    c[c.length - 1] += T0;
    return c;
  }
  /* Roots of a real polynomial by Durand–Kerner. */
  function roots(c) {
    const n = c.length - 1, a = c.map((v) => v / c[0]);
    let z = Array.from({ length: n }, (_, k) => [Math.cos((2 * Math.PI * k) / n + 0.4) * 1.5, Math.sin((2 * Math.PI * k) / n + 0.4) * 1.5]);
    const mul = (p, q) => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]], sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
    const div = (p, q) => { const d = q[0] * q[0] + q[1] * q[1] || 1e-30; return [(p[0] * q[0] + p[1] * q[1]) / d, (p[1] * q[0] - p[0] * q[1]) / d]; };
    const ev = (x) => a.reduce((acc, co) => { const m = mul(acc, x); return [m[0] + co, m[1]]; }, [0, 0]);
    for (let it = 0; it < 300; it++) z = z.map((zi, i) => { let den = [1, 0]; z.forEach((zj, j) => { if (j !== i) den = mul(den, sub(zi, zj)); }); return sub(zi, div(ev(zi), den)); });
    return z;
  }
  /* Step response of T0/D(s) (normalised to its final value) via RK4 on the controllable canonical form. */
  function stepResp(c, tEnd, N = 1500) {
    const n = c.length - 1, a = c.map((v) => v / c[0]), b0 = a[n];
    const f = (x) => { const d = x.slice(1); d.push(1 - a.slice(1).reduce((s, ak, k) => s + ak * x[n - 1 - k], 0)); return d; };
    let x = new Array(n).fill(0); const h = tEnd / N, out = [[0, 0]];
    for (let i = 1; i <= N; i++) {
      const k1 = f(x), k2 = f(x.map((v, j) => v + (h / 2) * k1[j])), k3 = f(x.map((v, j) => v + (h / 2) * k2[j])), k4 = f(x.map((v, j) => v + h * k3[j]));
      x = x.map((v, j) => v + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
      out.push([i * h, Math.max(-5, Math.min(5, b0 * x[0]))]);
    }
    return out;
  }

  const p1 = {
    id: "p1", title: "When negative feedback turns positive", mins: 25,
    blurb: "Every pole in the loop delays the signal. Delay enough and the correction arrives upside down: the loop rings, then oscillates.",
    takeaway: "Closed-loop poles are the roots of 1 + T(s) = 0. Danger: a frequency where |T| = 1 and ∠T = −180°. There T = −1, so 1 + T = 0: the loop sustains a signal on its own (an oscillator). Each pole in the loop adds up to −90° of phase lag; two poles can approach −180° but never reach it; three or more can pass it. Three identical poles: the phase reaches −180° at ω = √3·p, where |T| = T₀/8, so the loop oscillates once T₀ ≥ 8. More loop gain makes it worse.",
    steps: [
      { k: "why", title: "Delay flips the sign", b: [
        `<p>Negative feedback works by subtracting a copy of the output. But a real loop delays that copy. At a high enough frequency the delay is half a period: the subtracted copy is upside down, so subtracting it <b>adds</b>. If the loop still has a gain of 1 or more at that frequency, the signal regenerates itself every trip round: oscillation.</p>`,
        `<div class="eq">1 + T(jω) = 0  ⟺  |T| = 1 and ∠T = −180°</div>`,
      ]},
      { k: "play", title: "Three poles in the loop", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let T0 = 4;
          const poles = [1, 1, 1];
          function draw() {
            const c = closedPoly(T0, poles), sr = stepResp(c, 25);
            const rs = roots(c), worst = Math.max(...rs.map((r) => r[0]));
            f.innerHTML = plot({ x: [0, 25], y: [-0.5, 2.2], xt: [0, 5, 10, 15, 20, 25], yt: [0, 0.5, 1, 1.5, 2], xl: "time (units of 1/p)", yl: "step response (÷ final value)", h: 230, series: [{ f: () => 1, cls: "s5" }, { pts: sr, cls: "s1" }], label: "Closed-loop step response" });
            ro.innerHTML = readout([["Loop gain at DC, T₀", fmt(T0, 3)], ["Most-right closed-loop pole, real part", fmt(worst, 3) + " × p"], ["Verdict", worst < -1e-3 ? (T0 > 4 ? "stable, but ringing" : "stable") : worst > 1e-3 ? "UNSTABLE: oscillation grows" : "on the edge: steady oscillation"]]);
          }
          host.append(f, slider({ id: id + "-t", label: "DC loop gain T₀ (three equal poles)", min: 0.5, max: 12, step: 0.1, value: T0 }, (v) => { T0 = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Low T₀: a clean, slow step. Raise T₀: faster, then overshoot and ringing. At T₀ = 8 it rings forever; above 8 it grows. More gain, which feedback normally loves, is exactly what kills a loop with too much phase lag.</p>`,
      ]},
      { k: "math", title: "Where 8 comes from", b: [
        steps([["Each pole's phase at ω: −arctan(ω/p)", ""], ["Three equal poles reach −180° when each gives −60°", "ω = p·tan 60° = √3·p"], ["|T| there = T₀/|1 + j√3|³", "= T₀/2³ = T₀/8"], ["Oscillation when |T| = 1 there", "T₀ = 8"]]),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A loop has only one pole. Can it oscillate, however high T₀?", opts: [["No: one pole gives at most −90°, never −180°", true, "A single-pole loop is unconditionally stable."], ["Yes, at very high T₀", false, "Gain alone can't create the −180° needed."], ["Only if T₀ = 1", false, "Phase never reaches −180°."]] },
        { t: "num", q: "Three identical poles at 1 MHz. At what frequency would the loop oscillate (MHz)?", a: 1.732, tol: 0.01, why: "√3 × 1 MHz = 1.73 MHz (with T₀ = 8)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How can negative feedback cause oscillation?", model: "Each pole in the loop delays the fed-back signal. At some frequency the total phase lag reaches 180 degrees, so the subtracted signal is inverted and subtracting it actually adds. If the loop gain there is still one or more, a signal at that frequency keeps reinforcing itself on every trip round the loop, so the circuit oscillates." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Phase margin and gain margin", mins: 25,
    blurb: "Two numbers read off the loop's Bode plot say how far it is from oscillating.",
    takeaway: "Crossover frequency ω_c: where |T| = 1 (0 dB). Phase margin PM = 180° + ∠T(ω_c): how much more phase lag the loop could take before oscillating. Gain margin GM = 1/|T| at the frequency where ∠T = −180°, usually in dB: how much more gain it could take. Rules of thumb: PM ≥ 45° minimum, ≥ 60° for a well-behaved step response; GM ≥ 10 dB. For a loop with one low-frequency pole and one higher pole p₂: PM ≈ 90° − arctan(ω_c/p₂): PM = 45° when p₂ = ω_c, 60° when p₂ = 1.73ω_c.",
    steps: [
      { k: "learn", title: "Reading the margins", b: [
        `<div class="two"><div class="tile"><h3>Phase margin</h3><p>Go to where |T| crosses 0 dB. Read the phase. PM = 180° + that phase.</p></div><div class="tile"><h3>Gain margin</h3><p>Go to where the phase is −180°. Read |T| in dB. GM = −(that value).</p></div></div>`,
        `<p class="aside">Always the <b>loop gain</b> T = Aβ, not the open-loop gain A or the closed-loop gain. A follower (β = 1) is the hardest case: T = A.</p>`,
      ]},
      { k: "play", title: "Measure them", b: [
        (host, id) => {
          const mf = el(`<div class="fig"></div>`), pf = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let lT = 4, lp2 = 6, lp3 = 8;
          const p1 = 100;
          function draw() {
            const T0 = 10 ** lT, poles = [p1, 10 ** lp2, 10 ** lp3], wc = crossover(T0, poles);
            const pm = wc ? 180 + loopT(T0, poles, wc)[1] : 180;
            let w180 = null; { let lo = 0, hi = 12; if (loopT(T0, poles, 1e12)[1] < -180) { for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (loopT(T0, poles, 10 ** m)[1] > -180) lo = m; else hi = m; } w180 = 10 ** ((lo + hi) / 2); } }
            const gm = w180 ? -20 * Math.log10(loopT(T0, poles, w180)[0]) : Infinity;
            mf.innerHTML = plot({ x: [0, 11], y: [-80, 100], xt: [0, 2, 4, 6, 8, 10], xtf: (v) => "10" + sup(v), yt: [-80, -40, 0, 40, 80], ytf: (v) => v + " dB", xl: "ω (rad/s)", yl: "|T|", h: 190, series: [{ f: (x) => 20 * Math.log10(loopT(T0, poles, 10 ** x)[0]), cls: "s1", n: 400 }, { f: () => 0, cls: "s5" }], marks: wc ? [{ x: Math.log10(wc), y: 0, cls: "mkb" }] : [], label: "Loop gain magnitude in dB" });
            pf.innerHTML = plot({ x: [0, 11], y: [-270, 0], xt: [0, 2, 4, 6, 8, 10], xtf: (v) => "10" + sup(v), yt: [-270, -180, -90, 0], ytf: (v) => v + "°", xl: "ω (rad/s)", yl: "∠T", h: 170, series: [{ f: (x) => loopT(T0, poles, 10 ** x)[1], cls: "s2", n: 400 }, { f: () => -180, cls: "s4" }], marks: wc ? [{ x: Math.log10(wc), y: loopT(T0, poles, wc)[1], cls: "mkb" }] : [], label: "Loop gain phase" });
            ro.innerHTML = readout([["Crossover ω_c", wc ? si(wc, "rad/s", 3) : "none"], ["Phase margin", fmt(pm, 3) + "°"], ["Gain margin", isFinite(gm) ? fmt(gm, 3) + " dB" : "∞ (phase never hits −180°)"], ["Verdict", pm < 0 ? "UNSTABLE" : pm < 45 ? "stable but poorly damped" : pm < 60 ? "acceptable" : "comfortable"]]);
          }
          host.append(mf, pf, slider({ id: id + "-t", label: "DC loop gain (dB)", min: 0, max: 5, step: 0.05, value: lT, show: (v) => fmt(20 * v, 3) + " dB" }, (v) => { lT = v; draw(); }).el,
            slider({ id: id + "-2", label: "Second pole p₂ (log₁₀ rad/s)", min: 3, max: 9, step: 0.05, value: lp2, show: (v) => si(10 ** v, "rad/s", 3) }, (v) => { lp2 = v; draw(); }).el,
            slider({ id: id + "-3", label: "Third pole p₃ (log₁₀ rad/s)", min: 5, max: 10, step: 0.05, value: lp3, show: (v) => si(10 ** v, "rad/s", 3) }, (v) => { lp3 = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">First pole fixed at 100 rad/s. The red dot marks crossover on both plots. Move p₂ down towards crossover and watch PM fall. Raise the DC gain: crossover moves right, into more phase lag. That's the designer's tension: more loop gain is good for accuracy and bad for stability.</p>`,
      ]},
      { k: "math", title: "The two-pole shortcut", b: [
        `<p>With p₁ ≪ ω<sub>c</sub>, the first pole contributes about −90° at crossover:</p>`,
        `<div class="eq">PM ≈ 90° − arctan(ω_c/p₂)</div>`,
        tbl(["p₂ / ω_c", "PM"], [["0.5", "27°"], ["1", "45°"], ["1.73", "60°"], ["3", "72°"], ["∞", "90°"]]),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "At crossover, ∠T = −125°. Phase margin (°)?", a: 55, why: "180 − 125 = 55°." },
        { t: "num", q: "Two-pole loop, ω_c = 10 Mrad/s, p₂ = 20 Mrad/s. PM (°)?", a: 63.4, tol: 0.01, why: "90 − arctan(0.5) = 90 − 26.6 = 63.4°." },
        { t: "num", q: "Where ∠T = −180°, |T| = −14 dB. Gain margin (dB)?", a: 14, why: "GM = 14 dB: the gain could rise 5× before oscillation." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does phase margin measure, physically?", model: "It's how much extra phase lag the loop could tolerate at the frequency where its gain is exactly one before the fed-back signal would arrive fully inverted and the loop would oscillate. Bigger margin means the correction arrives well before it turns into reinforcement." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Margin you can see: overshoot and peaking", mins: 20,
    blurb: "Low phase margin isn't just a number: it's ringing on every edge and a peak in the frequency response.",
    takeaway: "For a two-pole loop, phase margin sets the closed-loop damping: roughly ζ ≈ PM/100 for PM below about 70°. Step overshoot: PM 30° → about 42%, 45° → about 23%, 60° → about 9%, 70° → about 1.5%, 76° → essentially none. The closed-loop frequency response peaks by roughly 1/(2 sin(PM/2)) near crossover: PM 45° → +2.3 dB, 30° → +5.7 dB. Settling time grows as PM falls, because the ringing has to die away. Most designs target 60°: fast, with modest overshoot.",
    steps: [
      { k: "play", title: "PM ↔ step response", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let r = 1.73;
          function draw() {
            /* unity-feedback loop T = wc0/(s(1 + s/p2)) with crossover near 1: choose p2 = r (normalised) */
            /* loop T = K/(s(1 + s/p2)) with K chosen so |T| = 1 at ω = 1 (crossover fixed) */
            const p2 = r, K = Math.hypot(1, 1 / p2);
            const c = [1 / p2, 1, K], sr = stepResp(c, 14);
            const pm = 90 - deg(Math.atan(1 / p2)), os = Math.max(0, Math.max(...sr.map((p) => p[1])) - 1);
            f.innerHTML = plot({ x: [0, 14], y: [0, 1.6], xt: [0, 2, 4, 6, 8, 10, 12, 14], yt: [0, 0.5, 1, 1.5], xl: "time (units of 1/ω_c)", h: 220, series: [{ f: () => 1, cls: "s5" }, { pts: sr, cls: "s1" }], label: "Closed-loop step response for the chosen phase margin" });
            ro.innerHTML = readout([["Second pole / crossover", fmt(r, 3)], ["Phase margin", fmt(pm, 3) + "°"], ["Overshoot", fmt(100 * os, 3) + "%"], ["Peaking estimate 1/(2 sin(PM/2))", fmt(20 * Math.log10(Math.max(1, 1 / (2 * Math.sin((pm * Math.PI) / 360)))), 3) + " dB"]]);
          }
          host.append(f, slider({ id: id + "-r", label: "Second pole relative to crossover", min: 0.3, max: 5, step: 0.01, value: r }, (v) => { r = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">A two-pole loop (an integrator plus one more pole), with crossover fixed. At p₂ = 1.73ω<sub>c</sub> (PM 60°): about 9% overshoot. Slide down to p₂ = ω<sub>c</sub> (45°): over 20%. At 0.3 the step rings for many cycles. Above about 4 there's essentially no overshoot, but the response is no faster.</p>`,
      ]},
      { k: "learn", title: "The table to remember", b: [
        tbl(["PM", "Overshoot (step)", "Peaking", "Feel"], [["30°", "≈ 42%", "+5.7 dB", "nervous: avoid"], ["45°", "≈ 23%", "+2.3 dB", "minimum acceptable"], ["60°", "≈ 9%", "≈ 0 dB", "typical target"], ["76°", "≈ 0%", "none", "sluggish but clean"]]),
        `<div class="key"><b>Measure it in the lab.</b> Can't break the loop on a finished chip? Apply a small step and look at the overshoot, or sweep the closed-loop response and look at the peak: both tell you the phase margin.</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "An LDO's output rings with about 25% overshoot after a load step. Its phase margin is roughly…", opts: [["About 45°", true, "≈ 23% overshoot ↔ 45°."], ["About 75°", false, "That would barely overshoot."], ["Negative", false, "Then it would oscillate, not ring and settle."]] },
        { t: "mcq", q: "Why not design for 90° phase margin?", opts: [["It wastes speed: the second pole must be far above crossover, which costs power, or crossover must come down", true, "Margin is bought with bandwidth or current."], ["90° is unstable", false, "90° is perfectly stable."], ["Overshoot becomes large", false, "Overshoot falls with more margin."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What do you see in the time domain when phase margin is low?", model: "A step input overshoots its final value and rings for a while before settling, because the closed-loop poles are lightly damped. The lower the phase margin, the bigger the overshoot and the longer the ringing; in frequency that's a peak in the closed-loop response near crossover." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Root locus: watching the poles move", mins: 25,
    blurb: "As loop gain rises, the closed-loop poles travel across the s-plane. Their path shows exactly when ringing starts and when stability is lost.",
    takeaway: "The closed-loop poles are the roots of D(s) + T₀·N(s) = 0. At T₀ = 0 they sit on the open-loop poles; as T₀ grows they move along paths (the root locus). Two real poles: they move together, meet, then split vertically into a complex pair: more gain, less damping, but never unstable. Three poles: two branches curve away and cross the jω axis at some gain (T₀ = 8 for three equal poles), where the loop starts to oscillate. Compensation reshapes the paths so the poles stay well inside the left half plane at the gain you need.",
    steps: [
      { k: "learn", title: "The idea", b: [
        `<p>For T(s) = T₀/D(s), the closed-loop poles solve</p>`,
        `<div class="eq">1 + T(s) = 0  ⟺  D(s) + T₀ = 0</div>`,
        `<p>Sweep T₀ from 0 upwards and plot the roots each time. Where they wander tells you how the loop's behaviour changes with gain (Module 26: pole position = response shape).</p>`,
      ]},
      { k: "play", title: "Watch them move", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let n = 3, T0 = 4;
          function draw() {
            const poles = n === 2 ? [1, 3] : [1, 2, 3];
            const X = (x) => 230 + 50 * x, Y = (y) => 150 - 50 * y;
            let s = `<line x1="10" y1="150" x2="330" y2="150" style="stroke:var(--muted)"/><line x1="230" y1="10" x2="230" y2="290" style="stroke:var(--muted)"/><rect x="230" y="10" width="100" height="280" style="fill:var(--bad);opacity:.08"/>`;
            s += S.t(326, 144, "σ", { a: "end", cls: "lab" }) + S.t(236, 22, "jω", { a: "start", cls: "lab" }) + S.t(280, 280, "unstable", { cls: "lab" });
            for (let k = 0; k <= 160; k++) { const g = 0.001 * 1.085 ** k; roots(closedPoly(g, poles)).forEach(([x, y]) => { if (x > -4.6 && x < 2 && Math.abs(y) < 2.8) s += `<circle cx="${X(x).toFixed(1)}" cy="${Y(y).toFixed(1)}" r="1.4" style="fill:var(--cool);opacity:.5"/>`; }); }
            poles.forEach((p) => { s += `<text x="${X(-p)}" y="${Y(0) + 6}" text-anchor="middle" class="big" style="fill:var(--muted)">×</text>`; });
            const rs = roots(closedPoly(T0, poles));
            rs.forEach(([x, y]) => { if (x > -4.6 && x < 2 && Math.abs(y) < 2.8) s += `<circle cx="${X(x)}" cy="${Y(y)}" r="6" style="fill:var(--accent)"/>`; });
            f.innerHTML = S.svg(340, 300, s, { label: "Root locus: grey crosses are open-loop poles, blue dots the path as gain rises, orange dots the closed-loop poles now", max: 340 });
            const worst = Math.max(...rs.map((r) => r[0]));
            ro.innerHTML = readout([["Loop gain T₀", fmt(T0, 3)], ["Closed-loop poles", rs.map(([x, y]) => (Math.abs(y) < 1e-3 ? fmt(x, 3) : `${fmt(x, 3)} ${y < 0 ? "−" : "+"} j${fmt(Math.abs(y), 3)}`)).join(", ")], ["Verdict", worst < -1e-3 ? "stable" : worst > 1e-3 ? "UNSTABLE" : "on the axis: oscillator"]]);
          }
          host.append(toggle(["Two poles (−1, −3)", "Three poles (−1, −2, −3)"], (i) => { n = i ? 3 : 2; draw(); }, 1), f,
            slider({ id: id + "-t", label: "Loop gain T₀", min: 0, max: 30, step: 0.25, value: T0 }, (v) => { T0 = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Two poles: they slide together, meet at −2, then climb straight up: more ringing, never unstable. Three poles: the pair bends right and enters the red region at T₀ = 10 for poles at −1, −2, −3. The faint blue trail is the whole locus; the orange dots are “now”.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A loop's root locus shows the dominant pole pair moving towards the jω axis as T₀ rises. What happens to the step response?", opts: [["More overshoot and longer ringing, then instability if they cross", true, "Closer to the axis = less damping."], ["It gets slower but cleaner", false, "Moving right towards the axis means less damping."], ["Nothing", false, "Pole position sets the response shape."]] },
        { t: "num", q: "Poles at −1, −2, −3 rad/s, with T(s) = T₀/[(1 + s)(1 + s/2)(1 + s/3)]. At what T₀ does the pair reach the jω axis? (Use the widget, or solve (s + 1)(s + 2)(s + 3) + 6T₀ = 0 at s = jω.)", a: 10, tol: 0.03, hint: "Expand: s³ + 6s² + 11s + 6(1 + T₀). Put s = jω; set the real and imaginary parts to zero.", why: "Imaginary part: −ω³ + 11ω = 0 → ω = √11. Real part: −6ω² + 6(1 + T₀) = 0 → 1 + T₀ = 11 → T₀ = 10." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a root locus show?", model: "It shows the paths the closed-loop poles take across the s-plane as the loop gain is increased from zero. They start at the open-loop poles. Seeing where they head, and the gain at which they cross into the right half-plane, tells you how the response's speed and ringing change and when the loop becomes unstable." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "Compensation: making a loop behave", mins: 30,
    blurb: "Dominant-pole compensation, Miller pole-splitting, the troublesome right-half-plane zero, and why capacitive loads are dangerous.",
    takeaway: "Dominant-pole compensation: add a low-frequency pole so |T| falls through 0 dB before the other poles bite (PM ≈ 90° − arctan(ω_c/p₂)). In a two-stage op amp, a Miller capacitor C_c across the second stage does this efficiently: GBW ≈ g_m1/C_c, the output pole moves up to p₂ ≈ g_m2/C_L (pole splitting), and a right-half-plane zero appears at z ≈ g_m2/C_c, which adds lag like a pole (fixed with a series nulling resistor). PM ≈ 90° − arctan(GBW/p₂) − arctan(GBW/z). For 60°, p₂ ≈ 2–3·GBW. A larger load capacitance lowers p₂ and eats margin: that's why op amps and regulators specify a maximum C_L.",
    steps: [
      { k: "learn", title: "Dominant pole", b: [
        `<p>Make one pole so low that the loop gain has crossed 0 dB, falling at 20 dB/decade with −90° phase, before any other pole matters.</p>`,
        `<div class="eq">PM ≈ 90° − arctan(ω_c/p₂)</div>`,
        `<p>The cost: bandwidth. Crossover (≈ GBW for a follower) must stay below the second pole, so the second pole sets how fast the amplifier can be.</p>`,
      ]},
      { k: "learn", title: "Miller compensation in a two-stage op amp", b: [
        fig(S.svg(500, 170, S.box(40, 60, 90, 50, "g_m1") + S.wire([130, 85], [220, 85]) + S.dot(190, 85) + S.box(220, 60, 90, 50, "−g_m2") + S.wire([310, 85], [420, 85]) + S.dot(380, 85) + S.t(430, 90, "out", { a: "start", cls: "lab" }) + S.wire([190, 85], [190, 30], [255, 30]) + S.cap(255, 30, 315, 30, "C_c", {}) + S.wire([315, 30], [380, 30], [380, 85]) + S.cap(380, 85, 380, 150, "C_L", { side: "right" }) + S.gnd(380, 150) + S.t(190, 105, "node 1", { cls: "lab" }), { label: "Two-stage op amp: first stage g_m1, second inverting stage g_m2, Miller capacitor C_c from node 1 to the output, load capacitor C_L" })),
        tbl(["Quantity", "Approximate value", "Meaning"], [["GBW (unity-gain ω)", "g_m1/C_c", "C_c sets the speed"], ["Output pole p₂", "g_m2/C_L", "pushed up by pole-splitting"], ["RHP zero z", "g_m2/C_c", "adds lag; fix with a nulling resistor"], ["Phase margin", "90° − atan(GBW/p₂) − atan(GBW/z)", ""]]),
        `<p class="aside">Why “Miller”: C<sub>c</sub> across a stage of gain −A₂ looks like (1 + A₂)C<sub>c</sub> from node 1, a huge capacitance from a small physical one, so the dominant pole is low without a big capacitor.</p>`,
      ]},
      { k: "play", title: "Compensate an op amp", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let Cc = 2, CL = 5, Rz = 0;
          const gm1 = 1e-3, gm2 = 5e-3;
          function draw() {
            const gbw = gm1 / (Cc * 1e-12), p2 = gm2 / (CL * 1e-12);
            const zInv = 1 / gm2 - Rz; /* zero at 1/(C_c(1/g_m2 − R_z)): RHP if positive */
            const z = zInv !== 0 ? 1 / (Cc * 1e-12 * zInv) : Infinity;
            const zPh = !isFinite(z) ? 0 : z > 0 ? deg(Math.atan(gbw / z)) : -deg(Math.atan(gbw / -z));
            const pm = 90 - deg(Math.atan(gbw / p2)) - zPh;
            const lw = (x) => 10 ** x, mag = (x) => 20 * Math.log10((1e4 * Math.hypot(1, lw(x) / (isFinite(z) ? Math.abs(z) : 1e30))) / (Math.hypot(1, lw(x) / (gbw / 1e4)) * Math.hypot(1, lw(x) / p2)));
            f.innerHTML = plot({ x: [3, 11], y: [-40, 90], xt: [4, 6, 8, 10], xtf: (v) => "10" + sup(v), yt: [-40, 0, 40, 80], ytf: (v) => v + " dB", xl: "ω (rad/s)", yl: "|A| (follower: T = A)", h: 200, series: [{ f: mag, cls: "s1", n: 400 }, { f: () => 0, cls: "s5" }], marks: [{ x: Math.log10(gbw), y: 0, cls: "mkb" }], label: "Open-loop gain magnitude of the compensated op amp" });
            ro.innerHTML = readout([["GBW = g_m1/C_c", si(gbw / (2 * Math.PI), "Hz", 3)], ["Output pole g_m2/C_L", si(p2 / (2 * Math.PI), "Hz", 3)], ["Zero", !isFinite(z) ? "cancelled (R_z = 1/g_m2)" : `${si(Math.abs(z) / (2 * Math.PI), "Hz", 3)} (${z > 0 ? "right-half-plane: adds lag" : "left-half-plane: adds lead"})`], ["Phase margin (as a follower)", fmt(pm, 3) + "°"]]);
          }
          host.append(f, slider({ id: id + "-c", label: "Miller capacitor C_c", min: 0.2, max: 10, step: 0.1, value: Cc, show: (v) => v + " pF" }, (v) => { Cc = v; draw(); }).el,
            slider({ id: id + "-l", label: "Load capacitor C_L", min: 1, max: 50, step: 0.5, value: CL, show: (v) => v + " pF" }, (v) => { CL = v; draw(); }).el,
            slider({ id: id + "-z", label: "Nulling resistor R_z", min: 0, max: 600, step: 10, value: Rz, show: (v) => v + " Ω" }, (v) => { Rz = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">g<sub>m1</sub> = 1 mS, g<sub>m2</sub> = 5 mS, DC gain 80 dB. Start: C<sub>c</sub> = 2 pF, C<sub>L</sub> = 5 pF gives about 52°. Raise C<sub>L</sub> to 20 pF: the output pole drops and PM collapses. Raise C<sub>c</sub> to win it back, at the cost of GBW. Then set R<sub>z</sub> = 200 Ω (= 1/g<sub>m2</sub>): the right-half-plane zero vanishes and PM jumps. Go past 200 Ω and the zero moves into the left half-plane, where it helps.</p>`,
      ]},
      { k: "why", title: "Why a right-half-plane zero is nasty", b: [
        `<p>A left-half-plane zero adds phase <i>lead</i> (helps). A right-half-plane zero has the same magnitude effect (gain stops falling) but adds phase <i>lag</i>, like a pole. Physically, through C<sub>c</sub> the input reaches the output directly, with the wrong sign, before the second stage has responded. The nulling resistor slows that path down until it no longer matters.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "g_m1 = 2 mS, C_c = 4 pF. GBW (MHz)?", a: 79.6, tol: 0.01, why: "g_m1/C_c = 5×10⁸ rad/s = 79.6 MHz." },
        { t: "num", q: "For 60° PM (ignoring the zero), how high must the output pole be relative to GBW?", a: 1.73, tol: 0.01, why: "90 − arctan(GBW/p₂) = 60 → p₂ = GBW/tan 30° = 1.73·GBW." },
        { t: "mcq", q: "A buffer is stable with 10 pF load but oscillates with 1 nF. Why?", opts: [["The output pole g_m2/C_L dropped 100× towards crossover, destroying phase margin", true, "Capacitive loads pull the output pole down. Fixes: more C_c, an isolation resistor, or a design for large C_L."], ["1 nF is too big to charge", false, "That's slew rate, not oscillation."], ["The DC gain changed", false, "C_L doesn't change DC gain."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does Miller compensation stabilise a two-stage op amp?", model: "A capacitor across the second stage looks, from the first stage's output, like a capacitance multiplied by the second stage's gain. That makes a low-frequency dominant pole with a small capacitor, so the loop gain crosses 0 dB at about gm1 over Cc. At the same time it pushes the output pole up, so it sits well above crossover and the phase margin is healthy. A nulling resistor removes the right-half-plane zero it creates." },
      ]},
    ],
  };

  const p6 = {
    id: "p6", title: "Master it", mins: 30,
    blurb: "Margins, poles, compensation and lab symptoms.",
    takeaway: "You can find crossover, phase and gain margin, predict ringing from margin, read a root locus, and compensate a two-stage amplifier while respecting load limits.",
    steps: [
      { k: "check", title: "Problem 1", b: [
        { t: "num", q: "T(s) = 10⁴/((1 + s/10³)(1 + s/10⁷)). Crossover ω_c (rad/s)?", a: 7.86e6, tol: 0.05, hint: "Above 10³ rad/s, |T| ≈ 10⁷/ω ÷ √(1 + (ω/10⁷)²). Let x = ω/10⁷ and solve x²(1 + x²) = 1.", why: "x² = (√5 − 1)/2 = 0.618, x = 0.786: ω_c ≈ 7.9×10⁶ rad/s. PM = 90° − arctan(0.786) ≈ 52°." },
      ]},
      { k: "check", title: "Problem 2", b: [
        { t: "num", q: "Same poles: what DC loop gain T₀ gives PM = 60°?", a: 6670, tol: 0.03, hint: "PM = 60° needs arctan(ω_c/10⁷) = 30°, so ω_c = 5.77×10⁶. Then set |T(ω_c)| = 1.", why: "|T| ≈ T₀·(10³/ω_c)/√(1 + 1/3) = 1 → T₀ = 5774 × 1.155 ≈ 6670. Lowering the loop gain from 10⁴ bought 8° of margin." },
      ]},
      { k: "check", title: "Problem 3", b: [
        { t: "mcq", q: "A loop has PM = 35°. Which will you see?", opts: [["Roughly 35–40% overshoot on steps and a several-dB peak in the closed-loop response", true, "Low margin → lightly damped poles."], ["A sustained oscillation", false, "That needs PM ≤ 0°."], ["A perfectly clean step", false, "That needs ~70° or more."]] },
      ]},
      { k: "check", title: "Problem 4", b: [
        { t: "num", q: "Two-stage op amp: g_m1 = 0.5 mS, g_m2 = 4 mS, C_L = 10 pF. Smallest C_c (pF) for p₂ ≥ 2.2·GBW (≈ 65° ignoring the zero)?", a: 2.75, tol: 0.02, hint: "GBW = g_m1/C_c ≤ (g_m2/C_L)/2.2.", why: "g_m2/C_L = 4×10⁸; ÷ 2.2 = 1.82×10⁸ ≥ 0.5 mS/C_c → C_c ≥ 2.75 pF." },
      ]},
      { k: "check", title: "Problem 5", b: [
        { t: "mcq", q: "Which change does NOT improve phase margin of a Miller-compensated op amp used as a follower?", opts: [["Increasing g_m1 (more first-stage current)", true, "That raises GBW = g_m1/C_c, moving crossover towards p₂: less margin (but faster)."], ["Increasing g_m2", false, "That raises p₂ and the zero: more margin."], ["Adding a nulling resistor R_z ≈ 1/g_m2", false, "That removes the RHP zero's lag."]] },
      ]},
      { k: "say", title: "Problem 6: explain it", b: [
        { t: "say", q: "A colleague's LDO regulator oscillates only when the customer adds a large ceramic capacitor at the output. Explain why, and two possible fixes.", model: "The output capacitor sets the output pole, roughly the output conductance over the load capacitance. A much larger capacitor drags that pole down towards the loop's crossover frequency, adding phase lag there and eroding the phase margin until the loop oscillates. Fixes include making the output pole the dominant pole by design, adding a zero with a small series resistance or compensation network, or lowering the loop's crossover frequency so the output pole stays well above it." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m38", eyebrow: "Math Toolkit · Module 38", title: "Stability and Compensation",
    intro: `<p>Six parts: how negative feedback turns positive, phase and gain margin, overshoot and peaking, root locus, compensation (dominant pole, Miller, the RHP zero, capacitive loads), and mastery problems.</p><p>Why a chip designer needs this: every op amp, regulator, PLL and bias loop on a chip must be stable over process, temperature and load. Compensation is a daily design task.</p><p class="aside">Before this: Modules 16 (Bode), 23 (poles) and 37 (feedback). Pairs with Boylestad Chapters 10 and 14.</p>`,
    after: `<p>Next: Module 39 goes inside the transistor: fields, charge and diffusion, the math of semiconductor physics.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <p><b>Instability:</b> 1 + T(s) = 0 ⟺ |T| = 1 at ∠T = −180°. Each pole ≤ −90°. 1 pole: always stable; 2: never unstable (but can ring); 3 equal: oscillates at T₀ = 8, ω = √3p.</p>
      <p><b>PM</b> = 180° + ∠T(ω_c). <b>GM</b> = −|T|dB at ∠T = −180°. Targets PM ≥ 45–60°, GM ≥ 10 dB. Two-pole: PM ≈ 90° − arctan(ω_c/p₂); 45° at p₂ = ω_c, 60° at 1.73ω_c.</p>
      <p><b>PM ↔ response:</b> 45° → ≈ 23% overshoot, +2.3 dB peak; 60° → ≈ 9%; 76° → ≈ 0.</p>
      <p><b>Root locus:</b> roots of D(s) + T₀ as T₀ rises; start at open-loop poles; crossing jω axis = oscillation.</p>
      <p><b>Miller two-stage:</b> GBW = g_m1/C_c; p₂ ≈ g_m2/C_L; RHP zero g_m2/C_c (null with R_z = 1/g_m2). PM ≈ 90° − atan(GBW/p₂) − atan(GBW/z). Large C_L lowers p₂ → instability.</p>`,
  };
  Course.start(window.CHAPTER);
})();
