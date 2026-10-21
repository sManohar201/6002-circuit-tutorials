(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const nb = (s) => `<span class="ov">${s}</span>`;
  const ob = (s) => `<tspan text-decoration="overline">${s}</tspan>`;

  // Deterministic pseudo-random numbers so pictures don't jump around.
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  /* ---------- static-discipline ladder: sender column and receiver column ---------- */
  function ladderFig(VOL, VIL, VIH, VOH, extra = "") {
    const Y = (v) => 200 - v * 36, band = (x, a, b, fill, lab) => `<rect x="${x}" y="${Y(b)}" width="80" height="${Math.max(0, Y(a) - Y(b))}" style="fill:${fill};stroke:var(--line)"/>` + (lab && Y(a) - Y(b) > 16 ? S.t(x + 40, (Y(a) + Y(b)) / 2 + 5, lab, { cls: "s" }) : "");
    let s = S.t(110, 14, "sender (out)", { cls: "s m" }) + S.t(290, 14, "receiver (in)", { cls: "s m" });
    s += band(70, VOH, 5, "var(--good-soft)", "send 1") + band(70, VOL, VOH, "var(--line)", "never") + band(70, 0, VOL, "var(--good-soft)", "send 0");
    s += band(250, VIH, 5, "var(--good-soft)", "read 1") + band(250, VIL, VIH, "var(--bad-soft)", "forbidden") + band(250, 0, VIL, "var(--good-soft)", "read 0");
    [[VOL, "V_OL", 70], [VOH, "V_OH", 70]].forEach(([v, l, x]) => { s += S.t(x - 6, Y(v) + 4, l + " " + fmt(v), { a: "end", cls: "s" }); });
    [[VIL, "V_IL", 330], [VIH, "V_IH", 330]].forEach(([v, l, x]) => { s += S.t(x + 6, Y(v) + 4, l + " " + fmt(v), { a: "start", cls: "s" }); });
    // noise-margin brackets
    const br = (a, b, lab) => `<line x1="200" y1="${Y(a)}" x2="200" y2="${Y(b)}" class="cur"/><line x1="160" y1="${Y(a)}" x2="240" y2="${Y(a)}" class="w dim"/><line x1="160" y1="${Y(b)}" x2="240" y2="${Y(b)}" class="w dim"/>` + S.t(206, (Y(a) + Y(b)) / 2 + 4, lab, { a: "start", cls: "s c" });
    if (VIL > VOL) s += br(VOL, VIL, "NM₀");
    if (VOH > VIH) s += br(VIH, VOH, "NM₁");
    return S.svg(420, 212, s + extra, { max: 420, label: "Sender output ranges and receiver input ranges side by side" });
  }

  /* ---------- gate playground: Y = A·B + not C ---------- */
  function gateFig(A, B, C) {
    const w = (on, ...pts) => S.wc(on ? "hl" : "", ...pts);
    const ab = A && B, nc = !C, y = ab || nc;
    let s = w(A, [40, 40], [90, 40], [90, 50], [110, 50]) + w(B, [40, 80], [90, 80], [90, 70], [110, 70]) + w(C, [40, 160], [110, 160]) +
      S.gate("and", 110, 60) + S.gate("not", 110, 160) +
      w(ab, [155, 60], [200, 60], [200, 100], [234, 100]) + w(nc, [160, 160], [200, 160], [200, 120], [234, 120]) +
      S.gate("or", 230, 110) + w(y, [285, 110], [330, 110]);
    s += S.t(30, 45, "A=" + (A ? 1 : 0), { a: "end", cls: A ? "a" : "" }) + S.t(30, 85, "B=" + (B ? 1 : 0), { a: "end", cls: B ? "a" : "" }) + S.t(30, 165, "C=" + (C ? 1 : 0), { a: "end", cls: C ? "a" : "" }) +
      S.t(338, 115, "Y = " + (y ? 1 : 0), { a: "start", cls: "big " + (y ? "a" : "") }) + S.t(178, 52, ab ? "1" : "0", { cls: "s m" }) + S.t(178, 152, nc ? "1" : "0", { cls: "s m" });
    return S.svg(420, 200, s, { max: 420, label: "AND of A and B, NOT of C, both into an OR gate giving Y" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Why go digital?", mins: 20,
    blurb: "Lump many voltages into two values, and noise stops mattering.",
    takeaway: "Digital = value discretization: every voltage in a range means the same symbol. You give up precision, and in return small noise changes nothing.",
    steps: [
      { k: "learn", title: "Lumping values", b: [
        `<p>Chapter 1 lumped <b>space</b> (elements are points). The digital abstraction lumps <b>values</b>:</p>`,
        `<div class="two"><div class="tile"><h3>Analog</h3><p>Every voltage is a different value. 2.40 V and 2.41 V mean different things.</p></div><div class="tile"><h3>Digital (two levels)</h3><p>Anything 0–2.5 V means <b>"0"</b>. Anything 2.5–5 V means <b>"1"</b>. Send 1.25 V for a 0 and 3.75 V for a 1.</p></div></div>`,
      ]},
      { k: "play", title: "Send through noise", b: [
        `<p>Same wire, same noise. Top: an analog value, 2.4 V. Bottom: the bits 0 1 0 1 1 0 sent as 1.25 V / 3.75 V. Turn up the noise.</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const bits = [0, 1, 0, 1, 1, 0];
          let amp = 0.6;
          function draw() {
            const r = rng(7), N = 300, noise = [];
            for (let k = 0; k <= N; k++) noise.push((r() * 2 - 1) * amp);
            const nz = (t) => noise[Math.min(N, Math.round((t / 6) * N))];
            const sig = (t) => (bits[Math.min(5, Math.floor(t))] ? 3.75 : 1.25) + nz(t);
            let errs = 0; const got = bits.map((b, k) => { let lo = 0, hi = 0; for (let j = 1; j < 10; j++) { const v = sig(k + j / 10); if (v > 2.5) hi++; else lo++; } const g = hi > lo ? 1 : 0; if (g !== b) errs++; return (hi && lo) ? "?" : g; });
            const amax = Math.max(...noise.slice(0, 50).map(Math.abs));
            f.innerHTML = plot({ x: [0, 6], y: [0, 5.5], xt: [0, 1, 2, 3, 4, 5, 6], yt: [0, 1.25, 2.5, 3.75, 5], xl: "bit slot", yl: "volts", series: [{ f: () => 2.5, cls: "s4" }, { f: sig, cls: "s1", n: N }], label: "Digital bits with noise and the 2.5 V threshold" });
            ro.innerHTML = readout([["analog: sent", "2.4 V"], ["analog: received", "2.4 ± " + fmt(amp, 2) + " V"], ["bits sent", bits.join(" ")], ["bits read", got.join(" ")]]) +
              `<span class="verdict ${got.every((g, k) => g === bits[k]) ? "ok" : "no"}">${got.every((g, k) => g === bits[k]) ? "Every bit read correctly, even though the voltages are wrong" : "Noise pushed some samples across 2.5 V: errors"}</span>`;
          }
          host.append(f, slider({ id: id + "-n", label: "Noise (peak)", min: 0, max: 2, step: 0.05, value: amp, show: (x) => fmt(x, 2) + " V" }, (x) => { amp = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The analog value is wrong as soon as there's any noise at all. The bits survive until the noise reaches 1.25 V.</p>`,
      ]},
      { k: "check", title: "How much noise is OK?", b: [
        { t: "num", q: "With levels 1.25 V (for 0) and 3.75 V (for 1) and a 2.5 V threshold, how big can noise get (in either direction) before a bit can be misread?", a: 1.25, unit: "V", hint: "How far is each level from the threshold?", why: "2.5 − 1.25 = 1.25 V. Any noise smaller than that is completely harmless." },
      ]},
      { k: "why", title: "What's the price?", b: [
        { t: "mcq", q: "Digital throws away information. Which?", opts: [
          ["Precision: a wire now carries one of 2 values instead of any value", true, "To send numbers bigger than 0 or 1 you need several bits (several wires, or several time slots). Part 7 does exactly that."],
          ["Speed: digital signals are always slower", false, "Not part of the abstraction. Speed comes later (Chapter 10)."],
          ["Energy: digital uses no energy", false, "Digital circuits use plenty of energy (Chapter 11)."],
        ]},
      ]},
      { k: "check", title: "Which are valid binary codes?", b: [
        `<p>The symbols "true/false" can be carried by almost any physical quantity, as long as everyone agrees on the mapping.</p>`,
        { t: "sort", q: "Which of these could serve as a two-level (binary) representation?", bins: ["Works", "Doesn't"], items: [
          ["true = 0 V, false = 5 V", 0, "Unusual, but fine. The mapping is just an agreement."],
          ["true = 2 µA, false = 0 µA", 0, "Current works as well as voltage."],
          ["true = 0–1 V, false = 4–5 V", 0, "Ranges are what the digital abstraction is about."],
          ["true = 2.5 V exactly, false = anything else", 1, "No noise immunity: any tiny noise turns a true into a false."],
        ]},
        `<p class="aside">This book's convention: 1 = TRUE = HIGH, 0 = FALSE = LOW.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is a digital signal more robust to noise than an analog one?", model: "In analog, every voltage means something different, so any noise changes the message. In digital, a whole range of voltages means the same symbol. Noise that moves the voltage around inside its range changes nothing; only noise big enough to cross into the other range causes an error." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Thresholds and the forbidden region", mins: 15,
    blurb: "Why we need a no-man's-land between 0 and 1.",
    takeaway: "A forbidden region between V_L and V_H removes the ambiguity at a single threshold. But if senders may output right at V_L or V_H, there's still zero room for noise.",
    steps: [
      { k: "predict", title: "Exactly 2.5 V?", b: [
        { t: "mcq", q: "With the single 2.5 V threshold, a receiver sees exactly 2.5 V. What does it mean?", opts: [
          ["Nobody can say. A single threshold leaves an ambiguous point", true, "Real circuits near a threshold behave unpredictably. The fix: a forbidden region that no valid signal is allowed to occupy."],
          ["It's a 1", false, "Neither interpretation is safe. Two receivers could disagree."],
          ["It's a 0", false, "Neither interpretation is safe."],
        ]},
      ]},
      { k: "learn", title: "A forbidden region", b: [
        `<div class="tbl"><table><tbody>
          <tr><td>Logic 0</td><td class="mono">0 V ≤ v ≤ V<sub>L</sub> (e.g. 2 V)</td></tr>
          <tr><td>forbidden</td><td class="mono">V<sub>L</sub> < v < V<sub>H</sub></td></tr>
          <tr><td>Logic 1</td><td class="mono">V<sub>H</sub> (e.g. 3 V) ≤ v ≤ 5 V</td></tr></tbody></table></div>`,
        `<p>A receiver may do <b>anything</b> with a forbidden voltage. A sender must <b>never</b> output one. (We also assume receivers cope with values a bit beyond 0 V or 5 V.)</p>`,
      ]},
      { k: "bug", title: "Still a problem", b: [
        `<p>V<sub>L</sub> = 2 V, V<sub>H</sub> = 3 V. A sender sends a 0 by outputting exactly 2.0 V, which is allowed.</p>`,
        { t: "mcq", q: "What happens if the wire picks up +0.05 V of noise?", opts: [
          ["The signal lands in the forbidden region. This scheme has zero noise margin", true, "The sender used the whole range the receiver accepts, leaving no spare room. The fix (next part): make senders stricter than receivers."],
          ["Nothing: it's still a valid 0", false, "2.05 V > V_L = 2 V, so it's forbidden."],
          ["It becomes a 1", false, "It's below 3 V, so it's in no-man's-land, not a 1."],
        ]},
      ]},
      { k: "learn", title: "Common ground", b: [
        `<p>Every voltage here is measured from a <b>ground</b> shared by sender and receiver. Forget to connect the grounds of two subsystems and "5 V" means nothing to the receiver. The book's warning: currents flow in loops, and ground is the return path.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What job does the forbidden region do, and what doesn't it fix?", model: "It removes ambiguity: there's no single voltage that could be read either way, because valid signals stay clear of the middle band. But if senders may output right at the edge of a valid range, any noise at all pushes them into the forbidden band, so there's still no noise margin." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "The static discipline and noise margins", mins: 25,
    blurb: "Four thresholds that let any two chips talk safely.",
    takeaway: "Senders promise strict outputs (below V_OL or above V_OH); receivers accept looser inputs (below V_IL or above V_IH). The gaps are the noise margins: NM₀ = V_IL − V_OL and NM₁ = V_OH − V_IH.",
    steps: [
      { k: "learn", title: "Strict senders, tolerant receivers", b: [
        fig(ladderFig(0.5, 2, 3, 4.5)),
        `<div class="tbl"><table><tbody>
          <tr><td class="mono">V<sub>OL</sub></td><td>highest voltage a device may <b>output</b> for a 0</td></tr>
          <tr><td class="mono">V<sub>OH</sub></td><td>lowest voltage a device may <b>output</b> for a 1</td></tr>
          <tr><td class="mono">V<sub>IL</sub></td><td>highest <b>input</b> voltage a device must read as 0</td></tr>
          <tr><td class="mono">V<sub>IH</sub></td><td>lowest <b>input</b> voltage a device must read as 1</td></tr></tbody></table></div>`,
      ]},
      { k: "learn", title: "Noise margins", b: [
        `<div class="eq">NM₀ = V<sub>IL</sub> − V<sub>OL</sub>   NM₁ = V<sub>OH</sub> − V<sub>IH</sub></div>`,
        `<p>NM₀ is how much positive noise a worst-case 0 can take before it stops being read as 0. NM₁ is the same for a 1, with negative noise. When they're equal, the margins are <b>symmetric</b>.</p>`,
        { t: "num", q: "From the picture: V_OL = 0.5 V, V_IL = 2 V. NM₀ = ?", a: 1.5, unit: "V", why: "2 − 0.5 = 1.5 V." },
      ]},
      { k: "play", title: "Design a discipline", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const v = { VOL: 0.5, VIL: 2, VIH: 3, VOH: 4.5 };
          function draw() {
            f.innerHTML = ladderFig(v.VOL, v.VIL, v.VIH, v.VOH);
            const nm0 = v.VIL - v.VOL, nm1 = v.VOH - v.VIH, bad = nm0 <= 0 || nm1 <= 0 || v.VIL > v.VIH;
            ro.innerHTML = readout([["NM₀", fmt(nm0, 2) + " V"], ["NM₁", fmt(nm1, 2) + " V"], ["usable margin", fmt(Math.min(nm0, nm1), 2) + " V"]]) +
              `<span class="verdict ${bad ? "no" : Math.abs(nm0 - nm1) < 0.01 ? "ok" : "mid"}">${bad ? "Broken: a margin is zero or negative, or the input thresholds overlap" : Math.abs(nm0 - nm1) < 0.01 ? "Symmetric margins" : "Works, but lopsided: the smaller margin limits you"}</span>`;
          }
          const box = el(`<div class="sliders"></div>`);
          [["VOL", "V_OL (max 0 out)", 0, 2.5], ["VIL", "V_IL (max 0 in)", 0.5, 2.5], ["VIH", "V_IH (min 1 in)", 2.5, 4.5], ["VOH", "V_OH (min 1 out)", 2.5, 5]].forEach(([k, lab, a, b]) =>
            box.appendChild(slider({ id: id + "-" + k, label: lab, min: a, max: b, step: 0.1, value: v[k], show: (x) => fmt(x) + " V" }, (x) => { v[k] = x; draw(); }).el));
          host.append(f, box, ro);
          draw();
        },
      ]},
      { k: "why", title: "Which way to push?", b: [
        { t: "mcq", q: "To make NM₀ bigger, which changes help?", opts: [
          ["Lower V_OL (stricter senders) or raise V_IL (more tolerant receivers)", true, "NM₀ = V_IL − V_OL. Chapter 6 shows the real device limits on how far you can push these."],
          ["Raise V_OL", false, "That shrinks NM₀: senders get sloppier."],
          ["Raise V_IH", false, "That affects the 1 side, and actually shrinks NM₁."],
        ]},
      ]},
      { k: "learn", title: "The static discipline", b: [
        `<div class="key">A device obeys the <b>static discipline</b> if, given valid inputs (below V<sub>IL</sub> or above V<sub>IH</sub>), it produces valid outputs (below V<sub>OL</sub> or above V<sub>OH</sub>).</div>`,
        `<p>"Static" because it only talks about steady values, not timing. This shared contract lets chips from different makers and technologies work together.</p>`,
      ]},
      { k: "check", title: "Can this chip join the system?", b: [
        `<p>Your system uses: V<sub>OL</sub> = 0.8 V, V<sub>IL</sub> = 1.5 V, V<sub>IH</sub> = 3.0 V, V<sub>OH</sub> = 4.0 V.</p>`,
        { t: "sort", q: "For each candidate part, decide if it meets your static discipline.", bins: ["Compliant", "Not compliant"], items: [
          ["Outputs 0.3 V / 4.4 V. Reads ≤ 1.8 V as 0 and ≥ 2.8 V as 1.", 0, "Outputs are inside both ranges. It reads everything your system can legally send (≤ 1.5 V and ≥ 3.0 V) correctly. What it does at 1.8–2.8 V doesn't matter: that band is forbidden anyway."],
          ["Outputs 0.9 V / 4.4 V. Reads ≤ 1.8 V as 0 and ≥ 2.8 V as 1.", 1, "0.9 V > V_OL = 0.8 V. Its 0 is too high."],
          ["Outputs 0.3 V / 4.4 V. Reads ≤ 1.2 V as 0 and ≥ 2.8 V as 1.", 1, "Your system may legally send 1.2–1.5 V as a 0. This part won't guarantee reading that as 0."],
          ["Outputs 0.5 V / 4.8 V. Reads ≤ 1.5 V as 0 and ≥ 3.0 V as 1.", 0, "Exactly meets the input thresholds and has comfortable outputs."],
        ]},
      ]},
      { k: "check", title: "Margins of your system", b: [
        { t: "num", q: "NM₀ for that system?", a: 0.7, unit: "V", hint: "V_IL − V_OL.", why: "1.5 − 0.8 = 0.7 V." },
        { t: "num", q: "NM₁?", a: 1, unit: "V", hint: "V_OH − V_IH.", why: "4.0 − 3.0 = 1.0 V. Not symmetric. The system is only as safe as its 0.7 V margin." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must V_OL be lower than V_IL?", model: "So that a worst-case 0 from a sender still has room to pick up noise before it reaches the receiver's limit. The gap V_IL − V_OL is that room, the noise margin for 0. If V_OL equalled V_IL there'd be no margin; if it were higher, a legal output might not even be read correctly." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Boolean logic and truth tables", mins: 20,
    blurb: "AND, OR, NOT, and a table that lists every case.",
    takeaway: "AND (·) is 1 only if all inputs are 1. OR (+) is 1 if any input is 1. NOT (bar) flips. A truth table lists the output for every input combination, so it fully defines a function.",
    steps: [
      { k: "learn", title: "Three operations", b: [
        `<div class="tbl"><table><thead><tr><th>operation</th><th>written</th><th>is 1 when…</th></tr></thead><tbody>
          <tr><td>AND</td><td class="mono">Z = X·Y = XY</td><td>X and Y are both 1</td></tr>
          <tr><td>OR</td><td class="mono">Z = X + Y</td><td>at least one is 1</td></tr>
          <tr><td>NOT</td><td class="mono">Z = ${nb("X")}</td><td>X is 0</td></tr></tbody></table></div>`,
        `<p class="aside">Careful: + here means OR, not addition. 1 + 1 = 1 in logic.</p>`,
      ]},
      { k: "play", title: "Fill the truth tables", b: [
        (host) => {
          const ro = el(`<div></div>`);
          const fns = [["X·Y", (x, y) => x & y], ["X + Y", (x, y) => x | y], [`X·${nb("Y")}`, (x, y) => x & (1 - y)], [`${nb("X")} + Y`, (x, y) => (1 - x) | y]];
          let k = 0;
          function draw() {
            const [lab, f] = fns[k];
            ro.innerHTML = `<div class="tbl"><table><thead><tr><th>X</th><th>Y</th><th>${lab}</th></tr></thead><tbody>${[[0, 0], [0, 1], [1, 0], [1, 1]].map(([x, y]) => `<tr><td class="mono">${x}</td><td class="mono">${y}</td><td class="mono"><b>${f(x, y)}</b></td></tr>`).join("")}</tbody></table></div>`;
          }
          host.append(toggle(fns.map((x) => x[0]), (i) => { k = i; draw(); }), ro);
          draw();
        },
        `<p class="aside">With n inputs, a truth table has 2ⁿ rows. Two inputs → 4 rows. Four inputs → 16.</p>`,
      ]},
      { k: "check", title: "From words to logic", b: [
        `<p>A garage alarm sounds (A = 1) when the door is open (D = 1) <b>and</b> it's night (N = 1), <b>or</b> whenever the motion sensor fires (M = 1).</p>`,
        { t: "mcq", q: "Which expression?", opts: [
          ["A = D·N + M", true, "AND the first two conditions, then OR with M."],
          ["A = D + N·M", false, "That sounds the alarm whenever the door is open, day or night."],
          ["A = D·N·M", false, "That needs all three at once."],
        ]},
        { t: "num", q: "Door open, daytime, no motion: A = ?", a: 0, hint: "D = 1, N = 0, M = 0.", why: "1·0 + 0 = 0." },
      ]},
      { k: "check", title: "A NOT in the mix", b: [
        `<p>A porch light L turns on when the motion signal M is high and it is <b>not</b> daytime (D = 1 in daytime).</p>`,
        { t: "mcq", q: "Which expression?", opts: [
          [`L = M·${nb("D")}`, true, "M AND (NOT D)."],
          ["L = M·D", false, "That lights it only in daytime."],
          [`L = ${nb("M·D")}`, false, "That's NOT(M AND D): on almost all the time."],
        ]},
      ]},
      { k: "check", title: "Count the rows", b: [
        { t: "num", q: "How many rows does a truth table for a 5-input function have?", a: 32, hint: "2ⁿ.", why: "2⁵ = 32 rows." },
        { t: "num", q: "In the table for A·B + C + D (4 inputs), how many rows have output 1 when C = 1?", a: 8, hint: "If C = 1, OR makes the output 1 regardless of A, B, D. How many combinations of A, B, D are there?", why: "2³ = 8 rows." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a truth table completely describe a logic function?", model: "A logic function's output depends only on its inputs, and each input is just 0 or 1. So there are finitely many input combinations, and listing the output for every one of them leaves nothing unspecified." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Combinational gates", mins: 20,
    blurb: "Logic as circuit symbols you can wire together.",
    takeaway: "A combinational gate is an abstraction: its outputs depend only on its present inputs, and it obeys the static discipline. Wire gates together to build any truth table.",
    steps: [
      { k: "learn", title: "The gate zoo", b: [
        fig(S.svg(460, 190, [["and", "AND", 30, 40], ["or", "OR", 180, 40], ["not", "NOT", 330, 40], ["nand", "NAND", 30, 140], ["nor", "NOR", 180, 140], ["buf", "BUFFER", 330, 140]].map(([k, n, x, y]) => S.wire([x - 15, k === "not" || k === "buf" ? y : y - 10], [x + 4, k === "not" || k === "buf" ? y : y - 10]) + (k === "not" || k === "buf" ? "" : S.wire([x - 15, y + 10], [x + 4, y + 10])) + S.gate(k, x, y) + S.wire([S.gateOut(k, x), y], [S.gateOut(k, x) + 15, y]) + S.t(x + 25, y + 38, n, { cls: "s" })).join(""), { max: 460, label: "Symbols for AND, OR, NOT, NAND, NOR and buffer gates" })),
        `<p>The bubble means NOT. NAND = NOT(AND). NOR = NOT(OR). A buffer copies its input (useful for restoring a weak signal, Chapter 6).</p>`,
      ]},
      { k: "learn", title: "What makes something a 'gate'", b: [
        `<div class="key">A <b>combinational gate</b>: (1) its outputs are a function of its present inputs alone, and (2) it obeys the static discipline.</div>`,
        `<p>Underneath, it's built from switches, resistors and sources (Chapter 6). The abstraction lets you ignore all of that and think in 1s and 0s.</p>`,
      ]},
      { k: "play", title: "Wire a little circuit", b: [
        `<p>Y = A·B + ${nb("C")}. Tap the inputs. Orange wires carry a 1.</p>`,
        (host) => {
          const f = el(`<div class="fig"></div>`);
          const st = [1, 0, 1];
          function draw() { f.innerHTML = gateFig(st[0], st[1], st[2]); }
          const row = el(`<div class="row bits"></div>`);
          ["A", "B", "C"].forEach((n, k) => {
            const b = el(`<button type="button" class="btn small" aria-pressed="${!!st[k]}">${n}</button>`);
            b.addEventListener("click", () => { st[k] ^= 1; b.setAttribute("aria-pressed", String(!!st[k])); draw(); });
            row.appendChild(b);
          });
          host.append(row, f);
          draw();
        },
        { t: "num", q: "For how many of the 8 input combinations is Y = 1? (Try them, or reason it out.)", a: 5, hint: "Y = 1 whenever C = 0 (4 cases), plus when A = B = 1 with C = 1.", why: "4 (C = 0) + 1 (A = B = 1, C = 1) = 5." },
      ]},
      { k: "check", title: "Read a gate circuit", b: [
        fig(S.svg(420, 150, S.wire([30, 40], [104, 40]) + S.wire([30, 60], [104, 60]) + S.gate("nor", 100, 50) + S.wire([165, 50], [200, 50], [200, 80], [224, 80]) + S.wire([30, 110], [200, 110], [200, 100], [224, 100]) + S.gate("and", 220, 90) + S.wire([265, 90], [300, 90]) +
          S.t(24, 45, "A", { a: "end" }) + S.t(24, 65, "B", { a: "end" }) + S.t(24, 115, "C", { a: "end" }) + S.t(306, 95, "Z", { a: "start", cls: "big" }), { max: 420, label: "A NOR B feeding an AND gate with C" })),
        { t: "mcq", q: "What is Z?", opts: [
          [`Z = ${nb("A + B")}·C`, true, "NOR gives NOT(A + B). That's ANDed with C."],
          ["Z = (A + B)·C", false, "Look at the bubble on the first gate."],
          [`Z = ${nb("A")} + ${nb("B")} + C`, false, "The second gate is an AND."],
        ]},
        { t: "num", q: "A = 0, B = 0, C = 1. Z = ?", a: 1, why: "NOR(0,0) = 1, and 1·1 = 1." },
      ]},
      { k: "why", title: "Noisy in, clean out", b: [
        { t: "mcq", q: "The book shows noisy input waveforms going into a gate, and a clean output coming out. Why is the output clean?", opts: [
          ["As long as the noisy inputs stay valid (below V_IL or above V_IH), the static discipline forces the gate to output a valid, firm level", true, "Each gate re-creates proper levels, so noise doesn't pile up from stage to stage. That's a big reason digital systems scale."],
          ["Gates filter out high frequencies", false, "The abstraction says nothing about filtering. It's about valid levels."],
          ["The noise cancels between the two inputs", false, "Noise on different inputs is unrelated."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What two promises does the combinational gate abstraction make?", model: "Its output depends only on its current inputs, so it can be described by a truth table, and it obeys the static discipline: valid inputs produce valid outputs." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Sum of products and simplification", mins: 25,
    blurb: "Turn any truth table into an expression, then shrink it.",
    takeaway: "Any truth table → sum of products: one AND term per row with output 1, all ORed. Then simplify with the rules (A·Ā = 0, A + ĀB = A + B, De Morgan) to use fewer gates.",
    steps: [
      { k: "learn", title: "Truth table → expression", b: [
        `<p>For each row with output 1, write an AND term containing every input: plain if it's 1 in that row, barred if it's 0. Then OR the terms.</p>`,
        `<div class="tbl"><table><thead><tr><th>A</th><th>B</th><th>Y</th><th>term</th></tr></thead><tbody>
          <tr><td>0</td><td>0</td><td>0</td><td></td></tr><tr><td>0</td><td>1</td><td><b>1</b></td><td class="mono">${nb("A")}B</td></tr>
          <tr><td>1</td><td>0</td><td><b>1</b></td><td class="mono">A${nb("B")}</td></tr><tr><td>1</td><td>1</td><td>0</td><td></td></tr></tbody></table></div>`,
        `<div class="eq">Y = ${nb("A")}B + A${nb("B")}</div>`,
        `<p>This is the <b>sum-of-products</b> form: ANDs (products) ORed together (sum). Every truth table has one.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<div class="tbl"><table><thead><tr><th>A</th><th>B</th><th>Y</th></tr></thead><tbody><tr><td>0</td><td>0</td><td>1</td></tr><tr><td>0</td><td>1</td><td>0</td></tr><tr><td>1</td><td>0</td><td>0</td></tr><tr><td>1</td><td>1</td><td>1</td></tr></tbody></table></div>`,
        { t: "mcq", q: "Sum of products for this table?", opts: [
          [`Y = ${nb("A")}${nb("B")} + AB`, true, "Row 00 gives ĀB̄, row 11 gives AB. Y is 1 when A equals B."],
          ["Y = A + B", false, "That's 1 for rows 01 and 10, where this table has 0."],
          [`Y = ${nb("A")}B + A${nb("B")}`, false, "Those are the rows where Y = 0."],
        ]},
      ]},
      { k: "learn", title: "The rules", b: [
        `<div class="tbl"><table><tbody>
          <tr><td class="mono">A·${nb("A")} = 0</td><td class="mono">A + ${nb("A")} = 1</td></tr>
          <tr><td class="mono">A·A = A</td><td class="mono">A + A = A</td></tr>
          <tr><td class="mono">A·0 = 0, A·1 = A</td><td class="mono">A + 0 = A, A + 1 = 1</td></tr>
          <tr><td class="mono">A + ${nb("A")}B = A + B</td><td class="mono">A(B + C) = AB + AC</td></tr>
          <tr><td colspan="2">Order and grouping don't matter: AB = BA, A + B = B + A.</td></tr></tbody></table></div>`,
        `<p>Not sure a rule is true? Check it with a truth table. That always works.</p>`,
      ]},
      { k: "check", title: "Simplify", b: [
        { t: "mcq", q: `Simplify A·${nb("A")} + B.`, opts: [["B", true, "A·Ā = 0, and 0 + B = B. One wire, no gates!"], ["A + B", false, "A·Ā is never 1."], ["1", false, "Only when B = 1."]] },
        { t: "mcq", q: `Simplify ABC + AB${nb("C")}.`, opts: [["AB", true, "Factor: AB(C + C̄) = AB·1 = AB."], ["ABC", false, "The second term covers C = 0 too."], ["A + B", false, "Both terms need A and B."]] },
        { t: "mcq", q: `Simplify ${nb("A")}${nb("B")} + ${nb("A")}B + AB.`, opts: [[`${nb("A")} + B`, true, "ĀB̄ + ĀB = Ā(B̄ + B) = Ā. Then Ā + AB = Ā + B (rule A + ĀB = A + B, with roles swapped)."], ["1", false, "Row A = 1, B = 0 gives 0."], ["B", false, "Row 00 gives 1."]] },
      ]},
      { k: "learn", title: "De Morgan's laws", b: [
        `<div class="eq">${nb("A·B")} = ${nb("A")} + ${nb("B")}   ${nb("A + B")} = ${nb("A")}·${nb("B")}</div>`,
        `<p>"Break the bar, flip the operator." So a NAND is the same as an OR with inverted inputs, and a NOR is an AND with inverted inputs.</p>`,
        `<div class="tbl"><table><thead><tr><th>A</th><th>B</th><th>${nb("A·B")}</th><th>${nb("A")} + ${nb("B")}</th></tr></thead><tbody>
          <tr><td>0</td><td>0</td><td>1</td><td>1</td></tr><tr><td>0</td><td>1</td><td>1</td><td>1</td></tr><tr><td>1</td><td>0</td><td>1</td><td>1</td></tr><tr><td>1</td><td>1</td><td>0</td><td>0</td></tr></tbody></table></div>`,
      ]},
      { k: "check", title: "Build with one gate type", b: [
        `<p>Some technologies make one gate type cheaply. With only 2-input NOR gates:</p>`,
        { t: "mcq", q: "How do you make NOT A from a NOR?", opts: [["Feed A into both inputs: NOT(A + A) = Ā", true, "A + A = A, so the NOR outputs Ā."], ["Feed A and 1", false, "NOT(A + 1) = NOT 1 = 0 always."], ["You can't", false, "Tie the inputs together."]] },
        { t: "num", q: "How many NOR gates make an OR gate A + B?", a: 2, hint: "NOR then invert. Inverting costs one NOR.", why: "NOR(A,B) gives NOT(A + B). A second NOR, with both inputs tied, inverts it back: A + B." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why bother simplifying a logic expression?", model: "A simpler expression with the same truth table needs fewer gates. That means less area, less power and fewer delays, but exactly the same behavior." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Numbers in binary, and an adder", mins: 25,
    blurb: "Many bits make a number. Gates can add them.",
    takeaway: "Bit k is worth 2ᵏ. Binary adds column by column with carries, like decimal. A one-bit full adder (A, B, carry in → sum, carry out) chained n times adds n-bit numbers: a ripple-carry adder.",
    steps: [
      { k: "learn", title: "Place values", b: [
        `<p>Decimal 352 = 3·10² + 5·10¹ + 2·10⁰. Binary works the same with 2 instead of 10:</p>`,
        `<div class="eq">1011₂ = 1·8 + 0·4 + 1·2 + 1·1 = 11</div>`,
        `<p>Each bit travels on its own wire (0 V = 0, 5 V = 1).</p>`,
      ]},
      { k: "play", title: "Flip the bits", b: [
        (host) => {
          const ro = el(`<div></div>`), row = el(`<div class="row bits"></div>`);
          const b = [0, 0, 0, 1, 0, 1, 1, 0];
          let signed = 0;
          function draw() {
            const mag = b.slice(signed ? 1 : 0).reduce((t, x) => t * 2 + x, 0), val = signed && b[0] ? -mag : mag;
            ro.innerHTML = readout([["bits", b.join("")], [signed ? "sign-bit value" : "unsigned value", String(val)], ["wire voltages", b.map((x) => (x ? "5" : "0")).join(" ")]]);
          }
          b.forEach((_, k) => {
            const btn = el(`<button type="button" class="btn small" aria-pressed="${!!b[k]}">${b[k]}</button>`);
            btn.addEventListener("click", () => { b[k] ^= 1; btn.textContent = b[k]; btn.setAttribute("aria-pressed", String(!!b[k])); draw(); });
            row.appendChild(btn);
          });
          host.append(toggle(["Unsigned", "Leftmost bit = sign"], (k) => { signed = k; draw(); }), row, ro);
          draw();
        },
        `<p class="aside">Leftmost button = highest bit. In "sign" mode the leftmost bit means negative, and the other 7 give the size.</p>`,
      ]},
      { k: "check", title: "Convert", b: [
        { t: "num", q: "1101₂ = ? (decimal)", a: 13, hint: "8 + 4 + 0 + 1.", why: "13." },
        { t: "num", q: "Largest number 6 unsigned bits can hold?", a: 63, hint: "All ones: 32 + 16 + 8 + 4 + 2 + 1.", why: "2⁶ − 1 = 63." },
        { t: "num", q: "Using the leftmost bit as a sign bit, what is 10000110?", a: -6, hint: "Sign 1 = negative. The remaining 0000110 = ?", why: "−6." },
      ]},
      { k: "learn", title: "Binary addition", b: [
        `<p>Just like decimal: add a column, write the sum digit, carry to the next column. In binary, 1 + 1 = 10₂ (write 0, carry 1).</p>`,
        `<div class="eq">  0110 (6)<br>+ 0111 (7)<br>= 1101 (13)</div>`,
        { t: "num", q: "0101 + 0011 = ? (give the decimal value)", a: 8, why: "5 + 3 = 8 = 1000₂. Every column carried." },
      ]},
      { k: "learn", title: "The full adder", b: [
        `<p>One column needs three inputs (A<sub>i</sub>, B<sub>i</sub>, carry in C<sub>i</sub>) and two outputs (sum S<sub>i</sub>, carry out C<sub>i+1</sub>).</p>`,
        `<div class="tbl"><table><thead><tr><th>A</th><th>B</th><th>C<sub>in</sub></th><th>C<sub>out</sub></th><th>S</th></tr></thead><tbody>
          ${[[0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1], [1, 0, 0], [1, 0, 1], [1, 1, 0], [1, 1, 1]].map(([a, b, c]) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td><td><b>${a + b + c >= 2 ? 1 : 0}</b></td><td><b>${(a + b + c) % 2}</b></td></tr>`).join("")}</tbody></table></div>`,
        `<p class="aside">S is 1 when an odd number of inputs are 1. C<sub>out</sub> is 1 when at least two are. Sum of products turns each column into gates.</p>`,
      ]},
      { k: "play", title: "A 4-bit ripple-carry adder", b: [
        `<p>Four full adders in a chain. Each carry out feeds the next column's carry in (the first carry in is 0).</p>`,
        (host) => {
          const ro = el(`<div></div>`);
          const A = [0, 1, 1, 0], B = [0, 1, 1, 1];
          function draw() {
            const c = [0]; const s = [];
            for (let k = 3; k >= 0; k--) { const t = A[k] + B[k] + c[0]; s.unshift(t % 2); c.unshift(t >= 2 ? 1 : 0); }
            const val = (x) => x.reduce((t, v) => t * 2 + v, 0);
            ro.innerHTML = `<div class="tbl"><table><tbody>
              <tr><td>carries</td>${c.slice(0, 4).map((x) => `<td class="mono" style="color:var(--cool)">${x}</td>`).join("")}<td></td></tr>
              <tr><td>A = ${val(A)}</td><td></td>${A.map((x) => `<td class="mono">${x}</td>`).join("")}</tr>
              <tr><td>B = ${val(B)}</td><td></td>${B.map((x) => `<td class="mono">${x}</td>`).join("")}</tr>
              <tr><td><b>S = ${val([c[0], ...s])}</b></td><td class="mono"><b>${c[0]}</b></td>${s.map((x) => `<td class="mono"><b>${x}</b></td>`).join("")}</tr></tbody></table></div>`;
          }
          const mk = (arr, name) => { const r = el(`<div class="row bits"><span class="mono" style="min-width:24px">${name}</span></div>`); arr.forEach((_, k) => { const b = el(`<button type="button" class="btn small" aria-pressed="${!!arr[k]}">${arr[k]}</button>`); b.addEventListener("click", () => { arr[k] ^= 1; b.textContent = arr[k]; b.setAttribute("aria-pressed", String(!!arr[k])); draw(); }); r.appendChild(b); }); return r; };
          host.append(mk(A, "A"), mk(B, "B"), ro);
          draw();
        },
        { t: "mcq", q: "Why is it called 'ripple' carry?", opts: [["The top column can't settle until the carry has passed through every column below it, one after another", true, "Divide-and-conquer made it easy to build, but the carry's trip through every stage costs time. Speed of logic returns in Chapter 10."], ["The output wiggles", false, "The name is about the carry travelling through the chain."], ["It uses ripple current", false, "It's about the carry signal."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you build an 8-bit adder from one-bit full adders?", model: "Line up eight full adders, one per bit column. Feed bit k of each number into adder k, connect each adder's carry out to the next higher adder's carry in, and set the lowest carry in to 0. The sum bits come out of each adder, and the last carry out is the extra top bit." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ch5", eyebrow: "Chapter 5", title: "The Digital Abstraction",
    intro: `<p>Seven parts. A big shift: from voltages to 1s and 0s. Why digital beats noise, the <b>static discipline</b> that makes chips compatible, then <b>logic</b>, <b>gates</b>, and building an <b>adder</b>.</p><p class="aside">Arrow keys ← → move between steps. Need a refresher? <a href="04-nonlinear-circuits.html">Chapter 4</a>.</p>`,
    after: `<p>Open the Chapter 5 PDF and go to the <b>exercises and problems</b> at the end. When you check a logic answer, a quick truth table is your friend.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7],
    summary: `
      <h3>Digital abstraction</h3>
      <p>Value discretization: ranges of voltage map to symbols 0 and 1. Noise smaller than the margin is ignored. Price: precision, so use many bits.</p>
      <h3>Static discipline</h3>
      <div class="tbl"><table><tbody>
        <tr><td class="mono">V_OL</td><td>highest output for a 0</td></tr><tr><td class="mono">V_OH</td><td>lowest output for a 1</td></tr>
        <tr><td class="mono">V_IL</td><td>highest input read as 0</td></tr><tr><td class="mono">V_IH</td><td>lowest input read as 1</td></tr></tbody></table></div>
      <div class="eq">NM₀ = V_IL − V_OL · NM₁ = V_OH − V_IH</div>
      <p>Valid inputs → valid outputs. Between V<sub>IL</sub> and V<sub>IH</sub>: forbidden. Senders strict, receivers tolerant. Shared ground required.</p>
      <h3>Boolean logic</h3>
      <p>AND (·), OR (+), NOT (bar). NAND, NOR, buffer. Truth table has 2ⁿ rows.</p>
      <h3>Gates</h3><p>Combinational gate: output depends only on present inputs, obeys the static discipline.</p>
      <h3>Sum of products and simplification</h3>
      <p>One AND term per output-1 row, ORed. Rules: A·Ā = 0, A + Ā = 1, A·1 = A, A + 1 = 1, A + ĀB = A + B, A(B + C) = AB + AC.</p>
      <div class="eq">De Morgan: NOT(A·B) = Ā + B̄ · NOT(A + B) = Ā·B̄</div>
      <p>NOT from NOR: tie the inputs. Any function can be built from NORs (or NANDs) alone.</p>
      <h3>Binary numbers</h3>
      <div class="eq">Aₙ…A₁A₀ = Σ Aᵢ·2ⁱ</div>
      <p>Sign bit option: leftmost bit 1 = negative. Full adder: S = 1 for an odd number of 1s, C<sub>out</sub> = 1 for two or more. Chain n full adders → n-bit ripple-carry adder.</p>`,
  };
  Course.start(window.CHAPTER);
})();
