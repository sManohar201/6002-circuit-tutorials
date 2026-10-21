(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const ch = (n, file, part, where, html) => `<p class="aside">${html} <a href="${file}#${part}">Boylestad Chapter ${n}, ${where} →</a></p>`;
  const ohm = (r) => si(r, "Ω");
  const TAU = 2 * Math.PI, PI = Math.PI;
  const W = (p) => si(p, "W", 4), A = (i) => si(i, "A", 4), V = (v) => si(v, "V", 4);
  const pct = (x) => fmt(100 * x, 4) + "%";
  const tri = (x) => { const u = x - Math.floor(x); return 4 * Math.abs(u - 0.5) - 1; };
  function bjt(x, y, o = {}) {
    const L = Math.hypot(22, 19), ux = 22 / L, uy = 19 / L;
    let s = `<line class="w" x1="${x - 30}" y1="${y}" x2="${x}" y2="${y}"/><line class="w" x1="${x}" y1="${y - 20}" x2="${x}" y2="${y + 20}" style="stroke-width:3.5"/>`;
    s += `<polyline class="w" points="${x},${y - 9} ${x + 22},${y - 28} ${x + 22},${y - 50}"/><polyline class="w" points="${x},${y + 9} ${x + 22},${y + 28} ${x + 22},${y + 50}"/>`;
    const d = o.pnp ? -1 : 1, t = o.pnp ? 0.3 : 0.85, tx = x + 22 * t, ty = y + 9 + 19 * t, bx = tx - d * 9 * ux, by = ty - d * 9 * uy;
    return s + `<polygon class="nd" points="${tx},${ty} ${bx - 5 * uy},${by + 5 * ux} ${bx + 5 * uy},${by - 5 * ux}"/>`;
  }

  /* =============== PART 1 =============== */
  const classWave = [
    ["A", (t) => 0.5 + 0.45 * Math.sin(TAU * t), "Biased mid-way: current flows for the full 360°."],
    ["AB", (t) => Math.max(0, 0.15 + 0.8 * Math.sin(TAU * t)), "Biased a little on: current for more than 180°, less than 360°. Needs push–pull."],
    ["B", (t) => Math.max(0, 0.9 * Math.sin(TAU * t)), "Biased at zero: current for 180° only. Needs push–pull for a full cycle."],
    ["C", (t) => Math.max(0, 0.95 * Math.sin(TAU * t) - 0.45), "Biased below zero: current for less than 180°. Only with a tuned circuit."],
    ["D", (t) => (0.9 * Math.sin(TAU * t) > tri(6 * t) ? 0.9 : -0.9), "Pulses: the devices are fully on or fully off."],
  ];
  const p1 = {
    id: "p1", title: "Power amplifiers and their classes", mins: 20,
    blurb: "Big signals, real watts. What A, AB, B, C and D mean, and how efficient each is.",
    takeaway: "Small-signal amplifiers care about gain and linearity; large-signal (power) amplifiers care about efficiency, maximum power handled and matching to the load (a few to tens of watts). Classes by how much of the cycle the output device conducts: A 360° (Q-point mid-way), AB between 180° and 360°, B 180° (biased at 0, so needs push–pull: two halves), C less than 180° (tuned circuits only), D pulse/digital operation. Efficiency η = P_o(ac)/P_i(dc): class A at most 25% (series-fed) or 50% (transformer-coupled), class B at most 78.5%, AB in between, D typically over 90%.",
    steps: [
      { k: "play", title: "How much of the cycle?", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), cap = el(`<p></p>`);
          const d = (k) => {
            const c = classWave[k];
            f.innerHTML = plot({ x: [0, 2], y: [-1.1, 1.1], xt: [0, 0.5, 1, 1.5, 2], yt: [0], ytf: () => "0", xl: "time (cycles of input)", h: 210, series: [{ f: (t) => 0.9 * Math.sin(TAU * t), cls: "s5" }, { f: c[1], cls: "s1", n: 1200 }], texts: [{ x: 0.05, y: -0.95, s: "dashed: input · orange: collector current" }], label: "Output current waveform for amplifier class " + c[0] });
            cap.textContent = "Class " + c[0] + ": " + c[2];
          };
          host.append(f, toggle(classWave.map((c) => "Class " + c[0]), d, 0), cap);
          d(0);
        },
      ]},
      { k: "learn", title: "Efficiency", b: [
        `<div class="eq">η = P<sub>o</sub>(ac)/P<sub>i</sub>(dc) × 100%</div>`,
        `<div class="tbl"><table><tr><th>Class</th><th>Conducts for</th><th>Maximum efficiency</th></tr><tr><td>A</td><td>360°</td><td>25% (series-fed), 50% (transformer)</td></tr><tr><td>AB</td><td>180°–360°</td><td>between A and B</td></tr><tr><td>B</td><td>180°</td><td>78.5%</td></tr><tr><td>C</td><td>&lt; 180°</td><td>(tuned circuits, not quoted)</td></tr><tr><td>D</td><td>pulses</td><td>over 90%</td></tr></table></div>`,
        `<p>Class A burns bias power even with no signal. Class B draws nothing at rest. Class D switches fully on or off, so its transistors waste little.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which class?", bins: ["A", "B", "C", "D"], items: [
          ["One transistor conducts the whole cycle", 0, "Class A."],
          ["Two transistors each conduct one half-cycle", 1, "Class B push–pull."],
          ["Conducts for under half a cycle; a tank circuit fills in the rest", 2, "Class C."],
          ["The input is turned into pulses first", 3, "Class D."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is class A inefficient even though its output is clean?", model: "Because it's biased with a large standing current, half its maximum, so it draws a lot of power from the supply even with no signal. Only part of that ever reaches the load as signal power; the rest heats the transistor. At most a quarter (or half with a transformer) of the supply power can become output power." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  function seriesFig() {
    let s = S.supply(220, 40, "V_CC") + S.wire([140, 40], [262, 40]) + S.res(140, 40, 140, 150, "R_B", { side: "left" }) + S.res(262, 40, 262, 100, "R_C", { side: "right" }) + S.wire([262, 100], [262, 120]);
    s += bjt(240, 170) + S.wire([140, 150], [140, 170], [210, 170]) + S.dot(140, 170) + S.wire([262, 220], [262, 240]) + S.gnd(262, 240);
    s += S.cap(60, 170, 140, 170, "C_i") + S.dot(60, 170) + S.t(52, 175, "v_i", { a: "end", cls: "c" }) + S.dot(262, 100) + S.wire([262, 100], [310, 100]) + S.t(316, 105, "load = R_C", { a: "start", cls: "s m" });
    return S.svg(420, 275, s, { max: 420, label: "Series-fed class A amplifier: fixed bias with the load as the collector resistor" });
  }
  const p2 = {
    id: "p2", title: "Series-fed class A", mins: 30,
    blurb: "The fixed-bias circuit with the load as R_C. Load line, power in, power out, and why 25% is the ceiling.",
    takeaway: "DC: I_B = (V_CC − 0.7 V)/R_B, I_C = βI_B, V_CE = V_CC − I_CR_C. Power transistors: β usually under 100. Best Q-point: mid load line (I_CQ = V_CC/2R_C, V_CEQ = V_CC/2) for the biggest swing. Input power P_i(dc) = V_CCI_CQ, with or without signal (the average current stays I_CQ). Output P_o(ac) = V_CE(rms)I_C(rms) = I²_C(rms)R_C = V²_C(rms)/R_C (with peaks: V_pI_p/2; with peak-to-peak: V_ppI_pp/8). Maximum: V_pp = V_CC, I_pp = V_CC/R_C, so P_o = V²_CC/8R_C, P_i = V²_CC/2R_C, η_max = 25%. Real circuits do much worse.",
    steps: [
      { k: "learn", title: "The circuit", b: [
        fig(seriesFig()),
        `<div class="eq">I<sub>B</sub> = (V<sub>CC</sub> − 0.7 V)/R<sub>B</sub>    I<sub>C</sub> = βI<sub>B</sub>    V<sub>CE</sub> = V<sub>CC</sub> − I<sub>C</sub>R<sub>C</sub></div>`,
        ch(4, "04-dc-biasing-bjts.html", "p2", "Part 2", "Fixed bias, same equations. Now with amps instead of milliamps."),
      ]},
      { k: "play", title: "Swing on the load line", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let ib = 0.008; const VCC = 24, RC = 16, b = 40, IBQ = (24 - 0.7) / 1200, ICQ = b * IBQ, VCEQ = VCC - ICQ * RC;
          function draw() {
            const ip = Math.min(b * ib, ICQ, VCC / RC - ICQ), vp = ip * RC, Po = (ip * ip * RC) / 2, Pi = VCC * ICQ;
            f.innerHTML = plot({ x: [0, 26], y: [0, 1.6], xt: [0, 6, 12, 18, 24], yt: [0, 0.5, 1, 1.5], xl: "V_CE (V)", yl: "I_C (A)", series: [{ pts: [[0, VCC / RC], [VCC, 0]], cls: "s5" }, { pts: [[VCEQ - vp, ICQ + ip], [VCEQ + vp, ICQ - ip]], cls: "s1" }], marks: [{ x: VCEQ, y: ICQ, label: "Q" }], label: "DC load line with the Q-point and the signal swing" });
            ro.innerHTML = readout([["Q-point", fmt(VCEQ, 4) + " V, " + A(ICQ)], ["I<sub>C</sub> peak swing", A(ip)], ["P<sub>o</sub>(ac) = I<sub>p</sub>²R<sub>C</sub>/2", W(Po)], ["P<sub>i</sub>(dc) = V<sub>CC</sub>I<sub>CQ</sub>", W(Pi)], ["η", pct(Po / Pi)]]);
          }
          host.append(f, slider({ id: id + "-b", label: "Peak base-current swing", min: 0, max: 0.02, step: 0.0005, value: ib, show: (v) => si(v, "A", 3) }, (v) => { ib = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">V<sub>CC</sub> = 24 V, R<sub>B</sub> = 1.2 kΩ, R<sub>C</sub> = 16 Ω, β = 40. The swing stops when it hits 0 A or the saturation end. Even at full swing, η stays far below 25%, because this Q-point isn't exactly mid-way.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Same amplifier: V<sub>CC</sub> = 24 V, R<sub>B</sub> = 1.2 kΩ, R<sub>C</sub> = 16 Ω, β = 40; the input gives 8 mA peak of base current.</p>`,
        { t: "num", q: "I_CQ?", a: 0.7767, unit: "A", tol: 0.01, hint: "I_B = 23.3 V/1.2 kΩ.", why: "19.4 mA × 40 = 0.777 A." },
        { t: "num", q: "P_o(ac)?", a: 0.8192, unit: "W", tol: 0.01, hint: "I_C peak = 40 × 8 mA = 0.32 A. P = I_p²R_C/2.", why: "0.32² × 16/2 = 0.819 W." },
        { t: "num", q: "Efficiency in %?", a: 4.395, unit: "%", tol: 0.01, hint: "P_i = 24 V × 0.777 A = 18.6 W.", why: "4.4%: most of the 18.6 W heats the transistor and R_C." },
      ]},
      { k: "learn", title: "Why 25% at best", b: [
        `<p>Best case: Q mid-way, swing all the way: V<sub>pp</sub> = V<sub>CC</sub>, I<sub>pp</sub> = V<sub>CC</sub>/R<sub>C</sub>.</p>`,
        `<div class="eq">P<sub>o</sub> max = V<sub>pp</sub>I<sub>pp</sub>/8 = V<sub>CC</sub>²/8R<sub>C</sub>    P<sub>i</sub> = V<sub>CC</sub>·V<sub>CC</sub>/2R<sub>C</sub> = V<sub>CC</sub>²/2R<sub>C</sub>    η max = 25%</div>`,
        { t: "mcq", q: "With no input signal at all, where does the 18.6 W go?", opts: [["All of it is dissipated as heat in the transistor and R_C", true, "Class A draws I_CQ all the time."], ["Nowhere: no signal, no power", false, "The bias current still flows."], ["Into the load as ac power", false, "No signal, no ac power."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a class A series-fed amplifier draw the same supply power whether or not there's a signal?", model: "Because the signal swings the collector current equally above and below the quiescent current, so the average current drawn from the supply stays at I_CQ. Supply power is V_CC times that average, so it doesn't change with signal." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  function xfmrFig() {
    let s = S.ind(140, 50, 140, 150, "") + S.ind(200, 50, 200, 150, "") + `<line class="w" x1="164" y1="45" x2="164" y2="155" style="stroke-width:2.5"/><line class="w" x1="176" y1="45" x2="176" y2="155" style="stroke-width:2.5"/>`;
    s += S.wire([140, 50], [80, 50]) + S.wire([140, 150], [80, 150]) + S.wire([200, 50], [270, 50], [270, 70]) + S.res(270, 70, 270, 130, "R_L", { side: "right" }) + S.wire([270, 130], [270, 150], [200, 150]);
    s += S.t(140, 30, "N_1", { cls: "s" }) + S.t(200, 30, "N_2", { cls: "s" }) + S.t(72, 105, "primary", { a: "end", cls: "s m" }) + S.t(70, 125, "← R′_L = a²R_L", { a: "end", cls: "c s" });
    return S.svg(420, 180, `<g transform="translate(60,0)">${s}</g>`, { max: 420, label: "Transformer with load R_L on the secondary; looking into the primary you see a squared R_L" });
  }
  const p3 = {
    id: "p3", title: "Transformers: stepping V, I and R", mins: 20,
    blurb: "Turns ratio for voltage, its inverse for current, and its square for resistance.",
    takeaway: "Ideal transformer (no losses): V₂/V₁ = N₂/N₁; I₂/I₁ = N₁/N₂. With turns ratio a = N₁/N₂, a load R_L on the secondary looks like R′_L = a²R_L from the primary. A step-down transformer (more primary turns) makes a small speaker look like a large resistance: impedance matching. Required ratio: a = √(R′_L/R_L).",
    steps: [
      { k: "learn", title: "Three rules", b: [
        fig(xfmrFig()),
        `<div class="eq">V<sub>2</sub>/V<sub>1</sub> = N<sub>2</sub>/N<sub>1</sub>    I<sub>2</sub>/I<sub>1</sub> = N<sub>1</sub>/N<sub>2</sub>    R′<sub>L</sub> = a²R<sub>L</sub>, a = N<sub>1</sub>/N<sub>2</sub></div>`,
        `<p>Why squared? R′<sub>L</sub> = V<sub>1</sub>/I<sub>1</sub>. Stepping down divides V by a <b>and</b> multiplies I by a, so their ratio changes by a².</p>`,
        seen("Transformers as coupled inductors.", "09-energy-storage.html#p6", "Chapter 9, Part 6"),
      ]},
      { k: "play", title: "Turns-ratio lab", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let a = 12, RL = 8;
          function draw() { ro.innerHTML = readout([["a = N<sub>1</sub>/N<sub>2</sub>", fmt(a, 3) + " : 1"], ["R′<sub>L</sub> = a²R<sub>L</sub>", ohm(a * a * RL)], ["10 V on the primary gives", V(10 / a) + " on the secondary"], ["100 mA in the primary gives", A(0.1 * a) + " in the secondary"]]); }
          host.append(slider({ id: id + "-a", label: "Turns ratio a", min: 1, max: 40, step: 0.5, value: a, show: (v) => fmt(v, 3) }, (v) => { a = v; draw(); }).el,
            slider({ id: id + "-r", label: "Load R_L", min: 2, max: 32, step: 1, value: RL, show: ohm }, (v) => { RL = v; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 12:1 transformer with an 8 Ω speaker. Resistance seen at the primary?", a: 1152, unit: "Ω", tol: 0.01, hint: "a²R_L.", why: "144 × 8 = 1152 Ω." },
        { t: "num", q: "What turns ratio makes a 4 Ω load look like 2.5 kΩ?", a: 25, tol: 0.01, hint: "a² = 2500/4.", why: "√625 = 25, so 25:1." },
        `<p class="aside">Example 12.2 cites "Eq. (12.22)" for a²R<sub>L</sub>; it's Eq. (12.12).</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a step-down transformer make a speaker look like a bigger resistance?", model: "On the primary side the voltage is a times bigger and the current a times smaller than on the secondary. Resistance is voltage over current, so it's a squared times bigger seen from the primary. That lets a low-resistance speaker present the higher resistance the transistor needs." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Transformer-coupled class A", mins: 30,
    blurb: "A vertical dc load line, a sloped ac load line, and a 50% ceiling.",
    takeaway: "The primary's dc resistance is tiny, so the dc load line is vertical at V_CEQ = V_CC. The ac load line passes through Q with slope −1/R′_L (R′_L = a²R_L); the collector can swing above V_CC (check the transistor's ratings). P_o(ac) = (V_CEmax − V_CEmin)(I_Cmax − I_Cmin)/8 (ideal transformer: the same power reaches R_L; V_L = (N₂/N₁)V₁, I_L = (N₁/N₂)I_C). P_i(dc) = V_CCI_CQ. Transistor dissipation P_Q = P_i − P_o: largest with no signal. η = 50[(V_CEmax − V_CEmin)/(V_CEmax + V_CEmin)]² %, which reaches 50% for a full swing from 0 to 2V_CC.",
    steps: [
      { k: "learn", title: "Two load lines", b: [
        fig(plot({ x: [0, 34], y: [0, 0.55], xt: [0, 8, 16, 24, 32], yt: [0, 0.25, 0.5], xl: "V_CE (V)", yl: "I_C (A)", series: [{ pts: [[16, 0], [16, 0.55]], cls: "s5" }, { pts: [[0, 0.5], [32, 0]], cls: "s1" }], marks: [{ x: 16, y: 0.25, label: "Q" }], texts: [{ x: 16.5, y: 0.5, s: "dc load line" }, { x: 23, y: 0.17, s: "ac: slope −1/R′_L" }], label: "Vertical dc load line and sloped ac load line through Q" })),
        `<p>DC sees only the winding: almost 0 Ω, so V<sub>CE</sub> stays at V<sub>CC</sub> for any current. AC sees R′<sub>L</sub>. The ac line reaches 2V<sub>CC</sub>: the collector really can swing to twice the supply, thanks to the transformer's inductance.</p>`,
      ]},
      { k: "learn", title: "Power and efficiency", b: [
        `<div class="eq">P<sub>o</sub>(ac) = (V<sub>CEmax</sub> − V<sub>CEmin</sub>)(I<sub>Cmax</sub> − I<sub>Cmin</sub>)/8    P<sub>i</sub>(dc) = V<sub>CC</sub>I<sub>CQ</sub>    P<sub>Q</sub> = P<sub>i</sub> − P<sub>o</sub></div>`,
        `<div class="eq">η = 50[(V<sub>CEmax</sub> − V<sub>CEmin</sub>)/(V<sub>CEmax</sub> + V<sub>CEmin</sub>)]² %</div>`,
        `<p>The transistor runs <b>hottest with no signal</b>: then all of P<sub>i</sub> becomes heat.</p>`,
      ]},
      { k: "play", title: "Swing and efficiency", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let vp = 12; const VCC = 16, RL = 64, ICQ = VCC / RL;
          function draw() {
            const mx = VCC + vp, mn = VCC - vp, ip = vp / RL, Po = (2 * vp * 2 * ip) / 8, Pi = VCC * ICQ;
            f.innerHTML = plot({ x: [0, 34], y: [0, 0.55], xt: [0, 8, 16, 24, 32], yt: [0, 0.25, 0.5], xl: "V_CE (V)", yl: "I_C (A)", series: [{ pts: [[0, 0.5], [32, 0]], cls: "s5" }, { pts: [[mn, ICQ + ip], [mx, ICQ - ip]], cls: "s1" }], marks: [{ x: 16, y: ICQ, label: "Q" }], label: "Signal swing along the ac load line" });
            ro.innerHTML = readout([["V<sub>CEmax</sub> / V<sub>CEmin</sub>", fmt(mx, 3) + " V / " + fmt(mn, 3) + " V"], ["P<sub>o</sub>(ac)", W(Po)], ["P<sub>i</sub>(dc)", W(Pi)], ["P<sub>Q</sub> (transistor heat)", W(Pi - Po)], ["η = 50[(max − min)/(max + min)]²", pct(Po / Pi)]]);
          }
          host.append(f, slider({ id: id + "-v", label: "Peak collector swing", min: 0, max: 16, step: 0.25, value: vp, show: (v) => fmt(v, 3) + " V" }, (v) => { vp = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">V<sub>CC</sub> = 16 V, R′<sub>L</sub> = 64 Ω (a 4:1 transformer and a 4 Ω speaker), I<sub>CQ</sub> = 250 mA. Push the swing to 16 V for 50%.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Same amplifier with V<sub>CE</sub> swinging from 4 V to 28 V.</p>`,
        { t: "num", q: "I_Cmax − I_Cmin?", a: 0.375, unit: "A", tol: 0.01, hint: "ΔV/R′_L.", why: "24 V/64 Ω = 0.375 A." },
        { t: "num", q: "P_o(ac)?", a: 1.125, unit: "W", tol: 0.01, hint: "(ΔV)(ΔI)/8.", why: "24 × 0.375/8 = 1.125 W." },
        { t: "num", q: "Efficiency in %?", a: 28.13, unit: "%", tol: 0.01, hint: "P_i = 16 V × 0.25 A.", why: "1.125/4 = 28.1%, matching 50(24/32)²." },
        { t: "num", q: "V_CC = 12 V, swing 8 V peak. Efficiency?", a: 22.22, unit: "%", tol: 0.01, hint: "V_CEmax = 20, V_CEmin = 4.", why: "50(16/24)² = 22.2%." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can the transformer-coupled class A amplifier reach 50% when the series-fed one only reaches 25%?", model: "Because there's no dc resistor in the collector wasting power. The bias current flows through the transformer winding, which has almost no resistance, and the collector can swing up to twice V_CC. So the same supply power can deliver twice as much ac power to the load." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Class B: push–pull power", mins: 30,
    blurb: "Two halves, no standing current. Input power, output power, transistor heat, and the 78.5% limit.",
    takeaway: "Class B: each device is biased just off and conducts one half-cycle; push–pull combines them. Supply current (one supply: full-wave shape; two supplies: half-wave each) averages I_dc = (2/π)I(p). P_i(dc) = V_CC(2/π)I(p). P_o(ac) = V²_L(rms)/R_L = V²_L(p-p)/8R_L = V²_L(p)/2R_L. η = (π/4)(V_L(p)/V_CC) × 100% = 78.54% × V_L(p)/V_CC; maximum 78.54% at V_L(p) = V_CC. Max P_o = V²_CC/2R_L; max P_i = 2V²_CC/πR_L. Transistors: P_2Q = P_i − P_o, P_Q = P_2Q/2 each; the most heat is not at full output but at V_L(p) = 0.636V_CC: max P_2Q = 2V²_CC/π²R_L.",
    steps: [
      { k: "learn", title: "Push and pull", b: [
        fig(S.svg(460, 150, S.dot(20, 75) + S.t(20, 63, "v_i", { cls: "c" }) + S.wire([20, 75], [70, 75]) + S.box(70, 35, 120, 80, "") + S.t(130, 70, "push–pull", { cls: "s" }) + S.t(130, 90, "circuit", { cls: "s" }) + S.wire([190, 55], [240, 55]) + S.wire([190, 95], [240, 95]) + S.t(245, 50, "top half: + half-cycles", { a: "start", cls: "a s" }) + S.t(245, 112, "bottom half: − half-cycles", { a: "start", cls: "c s" }) + S.t(330, 140, "load gets the full cycle", { cls: "s m" }), { max: 460, label: "Push-pull: each half handles one half-cycle" })),
        `<p>No signal, no current: that's where the efficiency comes from. The supply current is a train of half-sines whose average is (2/π) of the peak.</p>`,
        `<div class="eq">I<sub>dc</sub> = (2/π)I(p)    P<sub>i</sub>(dc) = V<sub>CC</sub>(2/π)I(p)    P<sub>o</sub>(ac) = V<sub>L</sub>(p)²/2R<sub>L</sub></div>`,
        `<div class="eq">η = (π/4)(V<sub>L</sub>(p)/V<sub>CC</sub>) × 100%    maximum 78.54% at V<sub>L</sub>(p) = V<sub>CC</sub></div>`,
      ]},
      { k: "play", title: "Where the power goes", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let v = 15; const VCC = 20, RL = 8;
          const Pi = (x) => (VCC * 2 * x) / (PI * RL), Po = (x) => (x * x) / (2 * RL);
          function draw() {
            f.innerHTML = plot({ x: [0, 20], y: [0, 35], xt: [0, 5, 10, 12.73, 15, 20], xtf: (x) => fmt(x, 3), yt: [0, 10, 20, 30], xl: "V_L(p) (V)", yl: "power (W)", series: [{ f: Pi, cls: "s2" }, { f: Po, cls: "s1" }, { f: (x) => Pi(x) - Po(x), cls: "s4" }], marks: [{ x: v, y: Po(v) }, { x: v, y: Pi(v), cls: "mk2" }, { x: (2 * VCC) / PI, y: Pi((2 * VCC) / PI) - Po((2 * VCC) / PI), cls: "mkb" }], texts: [{ x: 19.8, y: 1.5, s: "blue P_i · orange P_o · red P_2Q", a: "end" }], label: "Input, output and transistor power against peak output voltage" });
            ro.innerHTML = readout([["I<sub>dc</sub> = (2/π)V<sub>L</sub>(p)/R<sub>L</sub>", A((2 * v) / (PI * RL))], ["P<sub>i</sub>(dc)", W(Pi(v))], ["P<sub>o</sub>(ac)", W(Po(v))], ["P<sub>2Q</sub> (both transistors)", W(Pi(v) - Po(v))], ["η", v > 0 ? pct(Po(v) / Pi(v)) : "—"]]);
          }
          host.append(f, slider({ id: id + "-v", label: "Peak load voltage V_L(p) (V_CC = 20 V, R_L = 8 Ω)", min: 0, max: 20, step: 0.25, value: v, show: (x) => fmt(x, 3) + " V" }, (x) => { v = x; draw(); }).el, ro);
          draw();
        },
        `<p>Watch the red curve: transistor heat peaks in the <b>middle</b>, at V<sub>L</sub>(p) = (2/π)V<sub>CC</sub> = 0.636V<sub>CC</sub>, not at full output.</p>`,
        `<div class="eq">max P<sub>o</sub> = V<sub>CC</sub>²/2R<sub>L</sub>    max P<sub>i</sub> = 2V<sub>CC</sub>²/πR<sub>L</sub>    max P<sub>2Q</sub> = 2V<sub>CC</sub>²/π²R<sub>L</sub>    P<sub>Q</sub> = P<sub>2Q</sub>/2</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Class B, V<sub>CC</sub> = 20 V, R<sub>L</sub> = 8 Ω, V<sub>L</sub>(p) = 15 V.</p>`,
        { t: "num", q: "I_dc from the supply?", a: 1.194, unit: "A", tol: 0.01, hint: "I(p) = 1.875 A; times 2/π.", why: "1.19 A." },
        { t: "num", q: "Efficiency in %?", a: 58.9, unit: "%", tol: 0.01, hint: "P_o = 14.06 W, P_i = 23.87 W. Or 78.54 × 15/20.", why: "58.9%." },
        { t: "num", q: "Maximum dissipation of each transistor (any signal level)?", a: 5.066, unit: "W", tol: 0.01, hint: "2V²_CC/(π²R_L), then halve.", why: "10.13 W for the pair, 5.07 W each, at V_L(p) = 12.7 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why don't class B output transistors run hottest at full output?", model: "At full output most of the supply power goes into the load, so the efficiency is near 78%. At small outputs little power is drawn at all. In between, around 0.64 of V_CC peak, the supply power is substantial but a large share of it isn't reaching the load, so that's where the transistors dissipate the most." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  function compFig() {
    let s = S.dot(50, 170) + S.t(42, 175, "v_i", { a: "end", cls: "c" }) + S.wire([50, 170], [150, 170]) + S.dot(150, 170) + S.wire([150, 110], [150, 230]) + S.wire([150, 110], [170, 110]) + S.wire([150, 230], [170, 230]);
    s += bjt(200, 110) + `<g transform="translate(0,460) scale(1,-1)">${bjt(200, 230, { pnp: true })}</g>`;
    s += S.wire([222, 60], [222, 40]) + S.t(232, 44, "+V_CC", { a: "start", cls: "s" }) + S.wire([222, 280], [222, 300]) + S.t(232, 304, "−V_CC", { a: "start", cls: "s" });
    s += S.wire([222, 160], [222, 180]) + S.dot(222, 170) + S.wire([222, 170], [380, 170], [380, 190]) + S.res(380, 190, 380, 260, "R_L", { side: "right" }) + S.gnd(380, 260) + S.t(390, 160, "v_o", { a: "start", cls: "a" });
    s += S.t(250, 105, "npn: + half", { a: "start", cls: "a s" }) + S.t(250, 240, "pnp: − half", { a: "start", cls: "c s" });
    return S.svg(460, 320, s, { max: 460, label: "Complementary-symmetry push-pull: npn on top, pnp below, emitters driving the load" });
  }
  const p6 = {
    id: "p6", title: "Class B circuits and crossover distortion", mins: 25,
    blurb: "Phase splitters, transformer push–pull, complementary pairs, and the dead zone around zero.",
    takeaway: "Push–pull needs opposite-polarity drive: a centre-tapped transformer, a BJT phase splitter (collector and emitter outputs, gain ≈ 1 each), or op-amps (one inverting, one noninverting, gain 1). Transformer push–pull: input transformer splits phase, output transformer combines the halves in the load. Complementary symmetry: npn and pnp with bases tied; each conducts on its half-cycle; needs two supplies; suffers crossover distortion near zero (each needs ≈ 0.7 V before it conducts). Class AB bias (both slightly on) removes it. Practical versions: complementary Darlingtons (emitter-follower drive, low output resistance); quasi-complementary (pnp–npn feedback pair and npn Darlington so both power transistors are matched npn) is the most popular, with a bias resistor adjusted to minimize crossover distortion.",
    steps: [
      { k: "learn", title: "Getting two opposite drives", b: [
        `<div class="two"><div class="tile"><h3>Centre-tapped transformer</h3><p>Exactly opposite halves if the tap is centred.</p></div><div class="tile"><h3>BJT phase splitter</h3><p>Emitter output in phase, collector output inverted. Make both gains ≈ 1.</p></div><div class="tile"><h3>Op-amps</h3><p>One inverting and one noninverting stage, gain 1 each. The most common today.</p></div></div>`,
        `<p>A <b>transformer push–pull</b> stage uses a centre-tapped input transformer to drive Q<sub>1</sub> and Q<sub>2</sub> on opposite half-cycles, and a centre-tapped output transformer to add their halves in the load. Effective, but transformers are big.</p>`,
      ]},
      { k: "learn", title: "Complementary symmetry", b: [
        fig(compFig()),
        `<p>One input drives both bases. Positive half: the npn conducts and pushes current into R<sub>L</sub>. Negative half: the pnp pulls it the other way. Both are emitter followers, so the low output resistance suits a speaker.</p>`,
        ch(5, "05-bjt-ac-analysis.html", "p11", "Part 11", "Darlington and feedback pairs, used to boost the current."),
      ]},
      { k: "play", title: "Crossover distortion", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let amp = 3, ab = false;
          function draw() {
            const out = (t) => { const v = amp * Math.sin(TAU * t); return ab ? v : v > 0.7 ? v - 0.7 : v < -0.7 ? v + 0.7 : 0; };
            f.innerHTML = plot({ x: [0, 2], y: [-6, 6], xt: [0, 0.5, 1, 1.5, 2], yt: [-5, -0.7, 0, 0.7, 5], xl: "time (cycles)", yl: "volts", h: 230, series: [{ f: (t) => amp * Math.sin(TAU * t), cls: "s5" }, { f: out, cls: "s1", n: 800 }], texts: [{ x: 0.05, y: -5.4, s: "dashed: input · orange: output" }], label: "Push-pull output with or without crossover distortion" });
          }
          host.append(f, toggle(["Class B (no bias)", "Class AB (slight bias)"], (k) => { ab = k === 1; draw(); }, 0),
            slider({ id: id + "-a", label: "Input amplitude", min: 0.5, max: 5, step: 0.1, value: amp, show: (v) => fmt(v, 2) + " V" }, (v) => { amp = v; draw(); }).el);
          draw();
        },
        `<p>Between −0.7 V and +0.7 V neither transistor conducts, so the output sits flat near every zero crossing. It's worst, relatively, for small signals. Biasing both transistors slightly on (class AB) closes the gap.</p>`,
      ]},
      { k: "learn", title: "Quasi-complementary", b: [
        `<p>Big pnp power transistors are hard to match with npn ones. The <b>quasi-complementary</b> amplifier uses small complementary drivers (Q<sub>1</sub> npn, Q<sub>2</sub> pnp) ahead of two matched npn power transistors: Q<sub>1</sub>–Q<sub>3</sub> form a Darlington, Q<sub>2</sub>–Q<sub>4</sub> a feedback pair. A bias resistor is trimmed to minimize crossover distortion. It's the most popular power-amplifier form.</p>`,
        { t: "mcq", q: "Why make both output transistors npn?", opts: [["High-power npn devices are easier to get and to match", true, "The pnp job moves to a small driver transistor."], ["npn transistors don't need bias", false, "They do."], ["So only one supply is needed", false, "That's a separate question."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What causes crossover distortion, and how is it fixed?", model: "In a class B complementary pair, each transistor needs about 0.7 volts of base-emitter voltage before it conducts. Near the zero crossing neither one is on, so the output stays flat while the input passes through that band. Biasing both transistors slightly on, class AB, removes the dead zone." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Distortion", mins: 25,
    blurb: "Describe a distorted wave by its harmonics. Percent per harmonic, THD, and second-harmonic distortion from a scope.",
    takeaway: "Amplitude (nonlinear) distortion comes from a nonlinear device; frequency distortion from different gains at different frequencies. Fourier: a periodic distorted signal = fundamental + harmonics at integer multiples (2nd, 3rd...; the fundamental isn't a harmonic). %D_n = |A_n|/|A₁| × 100%. THD = √(D₂² + D₃² + D₄² + …) × 100%. Class B/AB distortion is mostly even harmonics, the 2nd largest. From a waveform: D₂ = |½(I_Cmax + I_Cmin) − I_CQ|/(I_Cmax − I_Cmin) × 100% (or with V_CE values). Power with distortion: P = (1 + THD²)P₁, P₁ = I₁²R_C (rms).",
    steps: [
      { k: "play", title: "Add harmonics", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let d2 = 0.1, d3 = 0.04;
          function draw() {
            const y = (t) => Math.sin(TAU * t) + d2 * Math.cos(2 * TAU * t) + d3 * Math.sin(3 * TAU * t);
            f.innerHTML = plot({ x: [0, 2], y: [-1.6, 1.6], xt: [0, 0.5, 1, 1.5, 2], yt: [-1, 0, 1], xl: "time (cycles)", h: 220, series: [{ f: (t) => Math.sin(TAU * t), cls: "s5" }, { f: y, cls: "s1", n: 600 }], label: "Fundamental plus second and third harmonics" });
            ro.innerHTML = readout([["D<sub>2</sub>", pct(d2)], ["D<sub>3</sub>", pct(d3)], ["THD = √(D<sub>2</sub>² + D<sub>3</sub>²)", pct(Math.hypot(d2, d3))], ["Power factor 1 + THD²", fmt(1 + d2 * d2 + d3 * d3, 5)]]);
          }
          host.append(f, slider({ id: id + "-2", label: "2nd harmonic A₂/A₁", min: 0, max: 0.4, step: 0.01, value: d2, show: (v) => fmt(v, 2) }, (v) => { d2 = v; draw(); }).el,
            slider({ id: id + "-3", label: "3rd harmonic A₃/A₁", min: 0, max: 0.4, step: 0.01, value: d3, show: (v) => fmt(v, 2) }, (v) => { d3 = v; draw(); }).el, ro);
          draw();
        },
        `<div class="eq">%D<sub>n</sub> = |A<sub>n</sub>|/|A<sub>1</sub>| × 100%    %THD = √(D<sub>2</sub>² + D<sub>3</sub>² + D<sub>4</sub>² + …) × 100%</div>`,
        `<p>The 2nd harmonic makes the two halves unequal (one fatter, one thinner). That's the typical class B/AB fault. A spectrum analyzer shows each harmonic as a separate line.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Fundamental 4 V, 2nd harmonic 0.3 V, 3rd 0.12 V, 4th 0.06 V.</p>`,
        { t: "num", q: "D₂ in %?", a: 7.5, unit: "%", tol: 0.01, hint: "0.3/4.", why: "7.5%." },
        { t: "num", q: "THD in %?", a: 8.216, unit: "%", tol: 0.01, hint: "√(0.075² + 0.03² + 0.015²).", why: "8.22%: the 2nd harmonic dominates." },
      ]},
      { k: "learn", title: "D₂ from a scope", b: [
        `<p>Measure the maximum, minimum and quiescent values. If the wave were undistorted, Q would sit exactly mid-way:</p>`,
        `<div class="eq">D<sub>2</sub> = |½(V<sub>CEmax</sub> + V<sub>CEmin</sub>) − V<sub>CEQ</sub>|/(V<sub>CEmax</sub> − V<sub>CEmin</sub>) × 100%</div>`,
        { t: "num", q: "V_CEmin = 2 V, V_CEmax = 20 V, V_CEQ = 10.5 V. D₂ in %?", a: 2.778, unit: "%", tol: 0.01, hint: "Midpoint 11 V; off by 0.5 V; divide by 18 V.", why: "2.78%." },
      ]},
      { k: "learn", title: "Power with distortion", b: [
        `<div class="eq">P<sub>1</sub> = I<sub>1</sub>²R<sub>C</sub>    P = (I<sub>1</sub>² + I<sub>2</sub>² + …)R<sub>C</sub> = (1 + THD²)P<sub>1</sub></div>`,
        { t: "num", q: "I₁ = 3 A rms into 4 Ω, THD = 8.216%. Total power?", a: 36.24, unit: "W", tol: 0.005, hint: "P₁ = 36 W; times 1 + 0.08216².", why: "36.24 W: almost all in the fundamental." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a THD figure tell you about an amplifier?", model: "It compares the combined size of all the harmonics the amplifier added to the size of the fundamental. Each harmonic's ratio is squared, they're added, and the square root is taken. A smaller THD means the output is closer to a pure scaled copy of the input sine." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  function thermFig() {
    let s = S.isrc(50, 110, "P_D", { side: "left" }) + S.wire([50, 92], [50, 50], [90, 50]) + S.wire([50, 128], [50, 170], [430, 170]);
    s += S.res(90, 50, 190, 50, "θ_JC") + S.res(190, 50, 290, 50, "θ_CS") + S.res(290, 50, 390, 50, "θ_SA") + S.wire([390, 50], [430, 50]) + S.vsrc(430, 110, "T_A", { side: "right" }) + S.wire([430, 92], [430, 50]) + S.wire([430, 128], [430, 170]);
    s += [[90, "T_J"], [190, "T_C"], [290, "T_S"]].map(([x, t]) => S.dot(x, 50) + S.t(x, 84, t, { cls: "a s" })).join("");
    return S.svg(500, 195, s, { max: 500, label: "Thermal-electrical analogy: power is current, temperature is voltage, thermal resistances in series" });
  }
  const p8 = {
    id: "p8", title: "Heat sinks and derating", mins: 25,
    blurb: "Power heats the junction. Thermal resistance is Ohm's law for heat.",
    takeaway: "Maximum junction temperature: silicon 150–200 °C, germanium 100–110 °C. P_D ≈ V_CEI_C. Above a rated case temperature, derate linearly: P_D(T₁) = P_D(T₀) − (T₁ − T₀)(derating factor, W/°C). Without a heat sink a power transistor handles only a few watts (e.g. 100 W at 100 °C case becomes 4 W in free air at 25 °C). Thermal analogy: power = current, temperature = voltage, θ = resistance (°C/W): θ_JA = θ_JC + θ_CS + θ_SA, T_J = P_Dθ_JA + T_A, so P_Dmax = (T_Jmax − T_A)/θ_JA. Typical θ_JC ≈ 0.5 °C/W; free air θ_JA ≈ 40 °C/W.",
    steps: [
      { k: "learn", title: "Derating", b: [
        fig(plot({ x: [0, 200], y: [0, 70], xt: [0, 25, 50, 100, 150, 175, 200], yt: [0, 30, 60], xl: "case temperature (°C)", yl: "P_D max (W)", h: 220, series: [{ pts: [[0, 60], [25, 60], [175, 0]], cls: "s1" }], marks: [{ x: 100, y: 30 }], label: "Power derating curve: flat to 25 °C, then falling linearly to zero" })),
        `<div class="eq">P<sub>D</sub>(T<sub>1</sub>) = P<sub>D</sub>(T<sub>0</sub>) − (T<sub>1</sub> − T<sub>0</sub>) × derating factor</div>`,
        { t: "num", q: "A 60 W transistor (at 25 °C), derated by 0.4 W/°C. Allowed dissipation at a 100 °C case?", a: 30, unit: "W", tol: 0.01, hint: "60 − 75 × 0.4.", why: "30 W." },
      ]},
      { k: "learn", title: "Ohm's law for heat", b: [
        fig(thermFig()),
        `<div class="eq">θ<sub>JA</sub> = θ<sub>JC</sub> + θ<sub>CS</sub> + θ<sub>SA</sub>    T<sub>J</sub> = P<sub>D</sub>θ<sub>JA</sub> + T<sub>A</sub></div>`,
        `<p>θ<sub>JC</sub>: junction to case (the transistor). θ<sub>CS</sub>: the insulating washer. θ<sub>SA</sub>: the heat sink to the air. The junction temperature "floats" on the ambient temperature.</p>`,
      ]},
      { k: "play", title: "Choose a heat sink", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let sa = 1.8, PD = 30, TA = 35; const jc = 0.6, cs = 0.5;
          function draw() {
            const ja = jc + cs + sa, TJ = PD * ja + TA;
            ro.innerHTML = readout([["θ<sub>JA</sub>", fmt(ja, 3) + " °C/W"], ["T<sub>J</sub> = P<sub>D</sub>θ<sub>JA</sub> + T<sub>A</sub>", fmt(TJ, 4) + " °C" + (TJ > 175 ? " — too hot!" : "")], ["Case T<sub>C</sub> = T<sub>J</sub> − P<sub>D</sub>θ<sub>JC</sub>", fmt(TJ - PD * jc, 4) + " °C"], ["P<sub>D</sub> max for T<sub>J</sub> = 175 °C", W((175 - TA) / ja)]]);
          }
          host.append(slider({ id: id + "-s", label: "Heat sink θ_SA (40 ≈ no heat sink)", min: 0.5, max: 40, step: 0.1, value: sa, show: (v) => fmt(v, 3) + " °C/W" }, (v) => { sa = v; draw(); }).el,
            slider({ id: id + "-p", label: "Power dissipated P_D", min: 0, max: 80, step: 1, value: PD, show: (v) => v + " W" }, (v) => { PD = v; draw(); }).el,
            slider({ id: id + "-t", label: "Ambient T_A", min: 0, max: 60, step: 1, value: TA, show: (v) => v + " °C" }, (v) => { TA = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">θ<sub>JC</sub> = 0.6 °C/W, θ<sub>CS</sub> = 0.5 °C/W, T<sub>Jmax</sub> = 175 °C.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "θ_JC = 0.6, θ_CS = 0.5, θ_SA = 1.8 °C/W, T_Jmax = 175 °C, T_A = 35 °C. Maximum P_D?", a: 48.28, unit: "W", tol: 0.01, hint: "(T_Jmax − T_A)/θ_JA.", why: "140/2.9 = 48.3 W." },
        { t: "num", q: "No heat sink, θ_JA = 40 °C/W, dissipating 1.5 W. Junction temperature rise above ambient?", a: 60, unit: "°C", tol: 0.01, hint: "P_Dθ_JA.", why: "60 °C for only 1.5 W." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain how a heat sink raises a transistor's usable power, using the thermal analogy.", model: "Think of power as a current flowing through thermal resistances from the junction to the air, with temperature as voltage. The junction temperature is the ambient temperature plus power times the total thermal resistance. A heat sink replaces the large case-to-air resistance with a small one, so for the same maximum junction temperature, much more power can flow." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Class C and class D", mins: 20,
    blurb: "A tuned circuit rebuilds the wave in class C. Class D chops the signal into pulses and filters them back.",
    takeaway: "Class C: biased to conduct for less than 180°; a tuned LC tank in the output rings out a full sine at its resonant frequency. Fixed-frequency use (communications), not audio power. Class D: compare the input with a sawtooth/triangle (chopping) waveform in a comparator to get pulses whose width follows the signal; amplify the pulses with switches (power MOSFETs: fully on or off, little loss); a low-pass filter recovers the signal. Efficiency over 90%.",
    steps: [
      { k: "learn", title: "Class C", b: [
        `<p>The transistor gives a short kick of current each cycle (under 180°). A parallel LC <b>tank</b> keeps oscillating between kicks, so the output is a full sine at the tank's resonant frequency. Only useful at one frequency: radio transmitters, for example.</p>`,
        seen("LC resonance: energy sloshing between L and C.", "14-resonance.html#p1", "Chapter 14"),
      ]},
      { k: "play", title: "Class D: chop it", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let r = 10;
          function draw() {
            const sig = (t) => 0.8 * Math.sin(TAU * t), pulse = (t) => (sig(t) > tri(r * t) ? 1 : -1);
            let avg = []; const N = 400; for (let i = 0; i <= N; i++) { const t = i / N; let s = 0; const M = 60; for (let k = 0; k < M; k++) s += pulse(t - (k / M) / r); avg.push([t, s / M]); }
            f.innerHTML = plot({ x: [0, 1], y: [-1.3, 1.3], xt: [0, 0.5, 1], yt: [-1, 0, 1], xl: "time (signal cycles)", h: 240, series: [{ f: (t) => tri(r * t), cls: "s5", n: 1200 }, { f: pulse, cls: "s2", n: 1600 }, { pts: avg, cls: "s1" }, { f: sig, cls: "s3" }], texts: [{ x: 0.02, y: -1.2, s: "blue: pulses · orange: filtered · green: input" }], label: "Class D: input compared with a triangle to make pulses, then filtered" });
          }
          host.append(f, slider({ id: id + "-r", label: "Chopping frequency (× signal frequency)", min: 4, max: 30, step: 1, value: r, show: (v) => v + "×" }, (v) => { r = v; draw(); }).el);
          draw();
        },
        `<p>Where the input is above the triangle, the comparator's output is high. The pulse <b>width</b> follows the signal. A low-pass filter averages the pulses back into the signal. Faster chopping, smoother result.</p>`,
        fig(S.svg(520, 100, S.dot(16, 50) + S.wire([16, 50], [40, 50]) + S.box(40, 25, 110, 50, "comparator") + S.wire([150, 50], [180, 50]) + S.box(180, 25, 140, 50, "switching amp") + S.wire([320, 50], [350, 50]) + S.box(350, 25, 110, 50, "low-pass") + S.wire([460, 50], [500, 50]) + S.dot(500, 50), { max: 520, label: "Class D block diagram: comparator, switching amplifier, low-pass filter" })),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why is class D so efficient?", opts: [["Its output transistors are either fully on (tiny voltage) or off (no current), so they dissipate little", true, "Power in a transistor is V × I; one of them is always near zero."], ["It runs at a lower supply voltage", false, "Not the reason."], ["It only amplifies half the cycle", false, "That's class B."]] },
        { t: "mcq", q: "Which class would you choose for a fixed-frequency radio transmitter stage?", opts: [["Class C", true, "A tuned tank restores the full sine at that one frequency."], ["Class A", false, "Works, but wastes power."], ["Class D", false, "Possible, but the book places class C here."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a class D amplifier reproduce a smooth signal from on-off pulses?", model: "It compares the signal with a fast triangle or sawtooth wave, which gives pulses whose width follows the signal's level. The pulses are amplified by transistors that switch fully on and off, then a low-pass filter averages them, removing the switching frequency and leaving the amplified signal." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edc12", eyebrow: "Boylestad · Chapter 12", title: "Power Amplifiers",
    intro: `<p>Nine parts: amplifier classes and efficiency, series-fed and transformer-coupled class A, transformers, class B power calculations, push–pull circuits and crossover distortion, harmonic distortion, heat sinks, and classes C and D.</p><p>Now the signals are volts and amps, and the question is where the watts go.</p><p class="aside">The "Computer Analysis" section isn't covered. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's problems in the book. They test whether the ideas stuck, so don't expect them to look like the examples here.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9],
    summary: `
      <h3>Class A</h3>
      <div class="eq">P<sub>i</sub>(dc) = V<sub>CC</sub>I<sub>CQ</sub>    P<sub>o</sub>(ac) = V<sub>rms</sub>I<sub>rms</sub> = V<sub>p</sub>I<sub>p</sub>/2 = V<sub>pp</sub>I<sub>pp</sub>/8    η = P<sub>o</sub>/P<sub>i</sub>    max 25% series-fed</div>
      <div class="eq">Transformer: V<sub>2</sub>/V<sub>1</sub> = N<sub>2</sub>/N<sub>1</sub>, I<sub>2</sub>/I<sub>1</sub> = N<sub>1</sub>/N<sub>2</sub>, R′<sub>L</sub> = a²R<sub>L</sub>    η = 50[(V<sub>max</sub> − V<sub>min</sub>)/(V<sub>max</sub> + V<sub>min</sub>)]² %    P<sub>Q</sub> = P<sub>i</sub> − P<sub>o</sub></div>
      <h3>Class B</h3>
      <div class="eq">I<sub>dc</sub> = (2/π)I(p)    P<sub>i</sub> = V<sub>CC</sub>(2/π)I(p)    P<sub>o</sub> = V<sub>L</sub>(p)²/2R<sub>L</sub>    η = 78.54% × V<sub>L</sub>(p)/V<sub>CC</sub></div>
      <div class="eq">max P<sub>o</sub> = V<sub>CC</sub>²/2R<sub>L</sub>    max P<sub>i</sub> = 2V<sub>CC</sub>²/πR<sub>L</sub>    max P<sub>2Q</sub> = 2V<sub>CC</sub>²/π²R<sub>L</sub> at V<sub>L</sub>(p) = 0.636V<sub>CC</sub>    P<sub>Q</sub> = P<sub>2Q</sub>/2</div>
      <h3>Distortion</h3>
      <div class="eq">D<sub>n</sub> = |A<sub>n</sub>|/|A<sub>1</sub>|    THD = √(D<sub>2</sub>² + D<sub>3</sub>² + …)    D<sub>2</sub> = |½(V<sub>max</sub> + V<sub>min</sub>) − V<sub>Q</sub>|/(V<sub>max</sub> − V<sub>min</sub>)    P = (1 + THD²)P<sub>1</sub></div>
      <h3>Heat</h3>
      <div class="eq">P<sub>D</sub>(T<sub>1</sub>) = P<sub>D</sub>(T<sub>0</sub>) − (T<sub>1</sub> − T<sub>0</sub>)(derating)    θ<sub>JA</sub> = θ<sub>JC</sub> + θ<sub>CS</sub> + θ<sub>SA</sub>    T<sub>J</sub> = P<sub>D</sub>θ<sub>JA</sub> + T<sub>A</sub></div>`,
  };
  Course.start(window.CHAPTER);
})();
