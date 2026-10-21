(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  /* A short "you've already learned this" card that links back into the 6.002 book. */
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const off = (s) => `<g opacity="0.3">${s}</g>`;

  /* BJT symbol. Base lead from (x−30,y); collector ends at (x+22,y−50); emitter at (x+22,y+50). npn arrow points out, pnp points in. */
  function bjt(x, y, o = {}) {
    const c = o.cls ? " " + o.cls : "", L = Math.hypot(22, 19), ux = 22 / L, uy = 19 / L;
    let s = `<line class="w${c}" x1="${x - 30}" y1="${y}" x2="${x}" y2="${y}"/><line class="w${c}" x1="${x}" y1="${y - 20}" x2="${x}" y2="${y + 20}" style="stroke-width:3.5"/>`;
    s += `<polyline class="w${c}" points="${x},${y - 9} ${x + 22},${y - 28} ${x + 22},${y - 50}"/><polyline class="w${c}" points="${x},${y + 9} ${x + 22},${y + 28} ${x + 22},${y + 50}"/>`;
    const d = o.pnp ? -1 : 1, t = o.pnp ? 0.3 : 0.85, tx = x + 22 * t, ty = y + 9 + 19 * t, bx = tx - d * 9 * ux, by = ty - d * 9 * uy;
    s += `<polygon class="nd" points="${tx},${ty} ${bx - 5 * uy},${by + 5 * ux} ${bx + 5 * uy},${by - 5 * ux}"/>`;
    if (o.labels) s += S.t(x - 34, y - 8, "B", { a: "end", cls: "s m" }) + S.t(x + 30, y - 44, "C", { a: "start", cls: "s m" }) + S.t(x + 30, y + 52, "E", { a: "start", cls: "s m" });
    return s;
  }

  /* Common-base output curves: I_C (mA) against V_CB for an emitter current I_E (mA). α = 0.99. */
  const ALPHA = 0.99;
  const iCB = (IE, V) => (V <= -0.7 ? 0 : ALPHA * IE * (1 - Math.exp(-(V + 0.7) / 0.1)));
  /* Common-emitter output curves: I_C (mA) against V_CE for a base current I_B (µA). β ≈ 100, slight upward slope, I_CEO = 0.12 mA. */
  const BETA = 100, VA = 120, ICEO0 = 0.12;
  const iCE = (IB, V) => (V <= 0 ? 0 : ((BETA * IB) / 1000 * (1 + V / VA) + ICEO0) * (1 - Math.exp(-V / 0.12)));

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Three layers", mins: 15,
    blurb: "What a bipolar junction transistor is made of, and why its middle layer is so thin.",
    takeaway: "A BJT is three layers: npn or pnp. The emitter is heavily doped; the base is very thin (about 1/150 of the total width) and lightly doped; the collector is lightly doped and wide. Terminals: emitter E, base B, collector C. 'Bipolar' means both electrons and holes carry the current. Every amplifier has at least three terminals: one controls the flow between the other two.",
    steps: [
      { k: "learn", title: "From tubes to transistors", b: [
        `<p>Before 1947, amplifiers used <b>vacuum tubes</b>. Then Shockley, Bardeen and Brattain at Bell Labs showed the first <b>transistor</b> amplifying.</p>`,
        `<div class="two"><div class="tile"><h3>Smaller, lighter, tougher</h3><p>No glass, no vacuum.</p></div><div class="tile"><h3>No heater</h3><p>No warm-up time, no heater power wasted.</p></div><div class="tile"><h3>More efficient</h3><p>Lower voltages, less power lost in the device.</p></div></div>`,
        `<div class="key">Every amplifier (voltage, current or power) has at least <b>three terminals</b>: one of them controls what flows between the other two.</div>`,
      ]},
      { k: "play", title: "The sandwich", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`);
          function draw(k) {
            const pnp = k === 1, out = pnp ? "p" : "n", mid = pnp ? "n" : "p";
            const col = (t) => (t === "n" ? "var(--cool-soft)" : "var(--accent-soft)"), ink = (t) => (t === "n" ? "c" : "a");
            let s = `<rect x="30" y="40" width="150" height="90" style="fill:${col(out)};stroke:var(--ink)"/><rect x="180" y="40" width="14" height="90" style="fill:${col(mid)};stroke:var(--ink)"/><rect x="194" y="40" width="150" height="90" style="fill:${col(out)};stroke:var(--ink)"/>`;
            for (let i = 0; i < 30; i++) s += `<circle cx="${40 + (i % 10) * 14}" cy="${52 + Math.floor(i / 10) * 30}" r="3.5" style="fill:var(--ink);opacity:.75"/>`;
            for (let i = 0; i < 6; i++) s += `<circle cx="${210 + (i % 3) * 48}" cy="${60 + Math.floor(i / 3) * 45}" r="3.5" style="fill:var(--ink);opacity:.75"/>`;
            s += `<circle cx="187" cy="85" r="3" style="fill:var(--ink);opacity:.75"/>`;
            s += S.t(105, 150, out + " · emitter (E)", { cls: ink(out) }) + S.t(187, 30, mid + " · base (B)", { cls: ink(mid) }) + S.t(270, 150, out + " · collector (C)", { cls: ink(out) });
            s += S.t(105, 170, "heavily doped", { cls: "s m" }) + S.t(187, 14, "very thin, lightly doped", { cls: "s m" }) + S.t(270, 170, "lightly doped", { cls: "s m" });
            f.innerHTML = S.svg(380, 185, s, { max: 380, label: `${pnp ? "pnp" : "npn"} transistor: emitter, thin base, collector` });
          }
          host.append(f, toggle(["npn", "pnp"], draw, 0));
          draw(0);
        },
        `<p>Dots show doping density. The base is drawn far too wide: in the first transistors the total width was <b>150 times</b> the base's. The base's doping is typically a tenth of the outer layers', or less.</p>`,
        `<p class="aside">BJT = <b>bipolar</b> junction transistor: both electrons and holes take part. A device using only one kind of carrier is <b>unipolar</b> (like the Schottky diode in Chapter 16).</p>`,
      ]},
      { k: "predict", title: "Why so thin?", b: [
        { t: "mcq", q: "Why would you make the base thin and lightly doped?", opts: [
          ["So that carriers entering it from the emitter rarely stop there, and most carry on to the collector", true, "A thin, high-resistance base gives carriers little chance to leave through the base lead. That keeps the base current tiny. The next part shows it happening."],
          ["To save silicon", false, "The size difference is about how the device works, not cost."],
          ["So the base current is as large as possible", false, "The opposite: a tiny base current controlling a large collector current is the whole point."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe the three layers of an npn transistor.", model: "An npn transistor has an n-type emitter that is heavily doped, a very thin and lightly doped p-type base in the middle, and a lightly doped n-type collector on the other side. Each layer has its own terminal: E, B and C." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "How it works", mins: 20,
    blurb: "One junction forward, one reverse. Most carriers shoot straight through the base.",
    takeaway: "In normal operation the base–emitter junction is forward-biased and the collector–base junction is reverse-biased. The emitter injects lots of carriers into the thin base; very few leave through the base lead (I_B in µA); most are swept across the reverse-biased junction into the collector (I_C in mA). KCL: I_E = I_C + I_B. The collector current also includes a tiny leakage, I_CO (= I_CBO), which grows fast with temperature.",
    steps: [
      { k: "learn", title: "Two diodes, back to back?", b: [
        `<p>A pnp transistor has two p–n junctions: emitter–base and collector–base. On its own, each acts like a diode.</p>`,
        `<div class="two"><div class="tile"><h3>Forward-bias E–B only</h3><p>Like a forward diode: a big flow of majority carriers from p into n.</p></div><div class="tile"><h3>Reverse-bias C–B only</h3><p>Like a reverse diode: only a tiny minority-carrier current.</p></div></div>`,
        `<p>So what happens when you do both at once?</p>`,
      ]},
      { k: "play", title: "Bias the junctions", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let eb = true, cb = true;
          function draw() {
            const IE = eb ? 5e-3 : cb ? 0 : 0, ICO = 10e-9;
            let IC, IB, IEv;
            if (eb && cb) { IEv = IE; IC = ALPHA * IE + ICO; IB = IEv - IC; }
            else if (eb) { IEv = IE; IC = 0; IB = IE; }
            else if (cb) { IEv = 0; IC = ICO; IB = -ICO; }
            else { IEv = 0; IC = 0; IB = 0; }
            const wEB = eb ? 4 : 10, wCB = cb ? 22 : 10;
            let s = `<rect x="30" y="40" width="150" height="80" style="fill:var(--accent-soft);stroke:var(--ink)"/><rect x="180" y="40" width="40" height="80" style="fill:var(--cool-soft);stroke:var(--ink)"/><rect x="220" y="40" width="150" height="80" style="fill:var(--accent-soft);stroke:var(--ink)"/>`;
            s += `<rect x="${180 - wEB / 2}" y="40" width="${wEB}" height="80" style="fill:var(--card);opacity:.85"/><rect x="${220 - wCB / 2}" y="40" width="${wCB}" height="80" style="fill:var(--card);opacity:.85"/>`;
            s += S.t(105, 32, "p · E", { cls: "a" }) + S.t(200, 32, "n · B", { cls: "c" }) + S.t(295, 32, "p · C", { cls: "a" });
            if (eb && cb) s += `<line x1="60" y1="80" x2="340" y2="80" style="stroke:var(--accent);stroke-width:9;opacity:.8"/><polygon points="356,80 338,68 338,92" style="fill:var(--accent)"/><line x1="200" y1="88" x2="200" y2="150" style="stroke:var(--accent);stroke-width:1.5"/>`;
            else if (eb) s += `<polyline points="60,80 200,80 200,150" style="stroke:var(--accent);stroke-width:9;fill:none;opacity:.8"/><polygon points="200,164 188,146 212,146" style="fill:var(--accent)"/>`;
            else if (cb) s += `<line x1="250" y1="62" x2="190" y2="62" style="stroke:var(--cool);stroke-width:1.5"/><polygon points="184,62 194,57 194,67" style="fill:var(--cool)"/>`;
            s += S.t(30, 172, "I_E = " + si(IEv, "A"), { a: "start", cls: "s" }) + S.t(200, 172, "I_B = " + si(Math.abs(IB), "A"), { cls: "s" }) + S.t(370, 172, "I_C = " + si(IC, "A"), { a: "end", cls: "s" });
            f.innerHTML = S.svg(400, 185, s, { max: 400, label: "pnp transistor with the flow of carriers for the chosen biasing" });
            ro.innerHTML = readout([["E–B junction", eb ? "forward (narrow depletion)" : "unbiased"], ["C–B junction", cb ? "reverse (wide depletion)" : "unbiased"], ["I<sub>E</sub> = I<sub>C</sub> + I<sub>B</sub>", `${si(IEv, "A")} = ${si(IC, "A")} + ${si(IB, "A")}`]]);
            vd.className = "verdict " + (eb && cb ? "ok" : "mid");
            vd.textContent = eb && cb ? "Both biased: almost every carrier crosses the thin base into the collector. The base current is tiny." : eb ? "Only E–B forward: an ordinary diode. All the current leaves through the base." : cb ? "Only C–B reverse: an ordinary reverse diode. Just a tiny leakage current flows." : "No bias, no current.";
          }
          host.append(f, toggle(["E–B forward", "E–B unbiased"], (k) => { eb = k === 0; draw(); }, 0), toggle(["C–B reverse", "C–B unbiased"], (k) => { cb = k === 0; draw(); }, 0), vd, ro);
          draw();
        },
        `<p class="aside">White bands are the depletion regions. Arrow thickness shows roughly how much current flows.</p>`,
      ]},
      { k: "learn", title: "Why they cross over", b: [
        `<p>Holes injected into the n-type base are <b>minority carriers</b> there. A reverse-biased junction happily sweeps minority carriers across. That's why the collector junction lets them through even though it's reverse-biased.</p>`,
        `<p>The base is thin and has few free carriers, so only a few holes take the long, high-resistance route out through the base lead.</p>`,
        `<div class="key">One junction forward-biased, the other reverse-biased. Treat the whole transistor as one node: <b>I<sub>E</sub> = I<sub>C</sub> + I<sub>B</sub></b>.</div>`,
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "An emitter carries 8 mA and the base 40 µA. What's the collector current?", a: 7.96, unit: "mA", tol: 0.005, hint: "I_C = I_E − I_B. Watch the units: 40 µA = 0.04 mA.", why: "8 − 0.04 = 7.96 mA. The emitter current is always the largest, the base current the smallest." },
      ]},
      { k: "learn", title: "A little leakage", b: [
        `<div class="eq">I<sub>C</sub> = I<sub>C majority</sub> + I<sub>CO minority</sub></div>`,
        `<p><b>I<sub>CO</sub></b> is the leakage current: what flows into the collector even with the emitter open. Like a diode's I<sub>s</sub>, it's tiny (µA or nA) but grows fast with temperature.</p>`,
        `<p class="aside">Modern transistors leak so little that you can usually ignore it, except in high-power parts or when it's hot.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the base current so much smaller than the collector current?", model: "The forward-biased emitter junction injects lots of carriers into the base. The base is very thin and lightly doped, so few of them recombine there or leave through the base lead. Once in the base they're minority carriers, and the reverse-biased collector junction sweeps them straight into the collector. So most of the emitter current becomes collector current and only a little becomes base current." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Common-base: the curves", mins: 25,
    blurb: "Input curves look like a diode. Output curves are flat lines set by the emitter current.",
    takeaway: "In common-base, the base is shared by input and output. The symbol's arrow shows the direction of emitter current (conventional). A three-terminal device needs two sets of curves. Input: I_E against V_BE, like a diode; for DC analysis use V_BE = 0.7 V. Output: I_C against V_CB for each I_E. Active (E–B forward, C–B reverse): I_C ≈ I_E, almost independent of V_CB. Cutoff (both reverse): I_C ≈ 0 when I_E = 0. Saturation (both forward): left of V_CB = 0, I_C drops fast.",
    steps: [
      { k: "learn", title: "The symbol and its arrow", b: [
        fig(S.svg(380, 150, bjt(90, 75, { labels: 1 }) + S.t(100, 145, "npn", { cls: "a" }) + bjt(270, 75, { labels: 1, pnp: 1 }) + S.t(280, 145, "pnp", { cls: "a" }), { max: 380, label: "npn and pnp transistor symbols" })),
        `<div class="key">The arrow on the emitter shows which way <b>emitter current</b> (conventional) flows. The other currents follow from it: I<sub>E</sub> = I<sub>C</sub> + I<sub>B</sub>.</div>`,
        `<p class="aside">Memory trick: n<b>p</b>n = "<b>N</b>ot <b>P</b>ointing i<b>N</b>". p<b>n</b>p = "<b>P</b>ointing i<b>N</b>".</p>`,
        `<p><b>Common-base</b>: the base is shared by the input (emitter side) and output (collector side), and is usually at or near ground.</p>`,
      ]},
      { k: "learn", title: "The input curve", b: [
        `<p>A three-terminal device needs <b>two</b> sets of curves: one for the input, one for the output.</p>`,
        `<p>The input curve, I<sub>E</sub> against V<sub>BE</sub>, looks just like a diode's. V<sub>CB</sub> barely shifts it. So, as with diodes, the book flattens it to a simple model:</p>`,
        `<div class="eq">Transistor on (active):   V<sub>BE</sub> = 0.7 V, whatever the current</div>`,
        `<div class="key"><b>Notation trap:</b> 6.002 used V<sub>BE</sub> ≈ 0.6 V and V<sub>CE(sat)</sub> ≈ 0.2 V. Boylestad uses <b>0.7 V</b> and <b>0.3 V</b>. Use the book's values in its problems.</div>`,
      ]},
      { k: "play", title: "The output curves", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let IE = 3, V = 5;
          function draw() {
            const series = [1, 2, 3, 4, 5, 6, 7].map((k) => ({ f: (v) => iCB(k, v), cls: k === IE ? "s1" : "s5", n: 300 }));
            series.unshift({ pts: [[-1, 0], [10, 0]], cls: IE === 0 ? "s1" : "s5" });
            const IC = IE ? iCB(IE, V) : 0;
            f.innerHTML = plot({ x: [-1, 10], y: [0, 8], xt: [-1, 0, 2, 4, 6, 8, 10], yt: [0, 2, 4, 6, 8], xl: "V_CB (V)", yl: "I_C (mA)", series, areas: [{ f: () => 8, from: -1, to: 0, cls: "ar2" }], marks: [{ x: V, y: IC }], label: "Common-base output curves, one per emitter current" });
            const region = IE === 0 ? 2 : V < 0 ? 1 : 0;
            ro.innerHTML = readout([["I<sub>E</sub>", IE + " mA"], ["V<sub>CB</sub>", fmt(V, 3) + " V"], ["I<sub>C</sub>", fmt(IC, 3) + " mA"]]);
            vd.className = "verdict " + ["ok", "no", "mid"][region];
            vd.textContent = ["Active: E–B forward, C–B reverse. I_C ≈ I_E, and V_CB hardly matters.", "Saturation: both junctions forward. I_C falls off fast.", "Cutoff: both junctions reverse. Only leakage flows."][region];
          }
          host.append(f, slider({ id: id + "-ie", label: "Emitter current I<sub>E</sub>", min: 0, max: 7, step: 1, value: 3, show: (v) => v + " mA" }, (v) => { IE = v; draw(); }).el,
            slider({ id: id + "-v", label: "Collector–base voltage V<sub>CB</sub>", min: -1, max: 10, step: 0.05, value: 5, show: (v) => fmt(v, 3) + " V" }, (v) => { V = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">The shaded strip left of 0 V is the saturation region (drawn wider than real life, as the book does). The bottom line, I<sub>E</sub> = 0, is cutoff.</p>`,
      ]},
      { k: "check", title: "The three regions", b: [
        { t: "sort", q: "Match each region to its junction biasing.", bins: ["Active", "Cutoff", "Saturation"], items: [
          ["E–B forward, C–B reverse", 0, "The normal amplifying region."],
          ["Both junctions reverse", 1, "Nothing is injected, so only leakage flows."],
          ["Both junctions forward", 2, "The collector junction no longer sweeps carriers across properly."],
        ]},
        { t: "mcq", q: "I_E = 4 mA. V_CB goes from 2 V to 9 V. What happens to I_C?", opts: [
          ["Almost nothing: it stays about 4 mA", true, "In the active region the curves are nearly flat. I_C ≈ I_E whatever V_CB is."],
          ["It rises in proportion", false, "That's a resistor. These curves are flat."],
          ["It drops to zero", false, "That only happens with V_CB below about −0.7 V, deep in saturation."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a flat output curve in the active region tell you?", model: "That the collector current is set by the emitter current, not by the collector voltage. Changing V_CB over a wide range hardly changes I_C, which stays about equal to I_E. The transistor acts like a current source controlled by its input." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Alpha, leakage and biasing", mins: 20,
    blurb: "How much of the emitter current reaches the collector, and which way round the supplies go.",
    takeaway: "α_dc = I_C/I_E, typically 0.90 to 0.998. Including leakage: I_C = α·I_E + I_CBO. α_ac = ΔI_C/ΔI_E at constant V_CB; usually about the same as α_dc. To bias: the arrow fixes I_E's direction, I_C ≈ I_E flows the same way, and you add supplies that push those currents. Too much reverse voltage on the collector junction causes avalanche breakdown: the limit is BV_CBO (V_(BR)CBO), the 'O' meaning the emitter is open.",
    steps: [
      { k: "learn", title: "Alpha", b: [
        `<div class="eq">α<sub>dc</sub> = I<sub>C</sub> / I<sub>E</sub></div>`,
        `<p>The curves suggest α = 1, but real transistors have α from about <b>0.90 to 0.998</b>, mostly near the top.</p>`,
        `<p>α only counts the majority carriers, so the full collector current is:</p>`,
        `<div class="eq">I<sub>C</sub> = α I<sub>E</sub> + I<sub>CBO</sub></div>`,
        `<p class="aside">I<sub>CBO</sub> = collector-to-base current with the emitter <b>open</b>: the same leakage as I<sub>CO</sub>.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "I_E = 5 mA and I_C = 4.9 mA. What's α_dc?", a: 0.98, tol: 0.002, hint: "α = I_C/I_E.", why: "4.9/5 = 0.98." },
        { t: "num", q: "α = 0.99, I_E = 3 mA, I_CBO = 2 µA. What's I_C, in mA?", a: 2.972, unit: "mA", tol: 0.002, hint: "0.99 × 3 mA, plus 0.002 mA.", why: "2.97 + 0.002 = 2.972 mA. The leakage is a rounding error here." },
      ]},
      { k: "learn", title: "AC alpha", b: [
        `<div class="eq">α<sub>ac</sub> = ΔI<sub>C</sub> / ΔI<sub>E</sub>   with V<sub>CB</sub> held constant</div>`,
        `<p>A small change in collector current divided by the small change in emitter current that caused it. Its formal name: the common-base, short-circuit, amplification factor.</p>`,
        `<p class="aside">α<sub>ac</sub> and α<sub>dc</sub> are usually so close that either can stand in for the other.</p>`,
      ]},
      { k: "learn", title: "Which way do the supplies go?", b: [
        `<ol><li>The arrow gives the direction of I<sub>E</sub>.</li><li>Treat I<sub>B</sub> as about 0 for now, so I<sub>C</sub> ≈ I<sub>E</sub> flows straight through.</li><li>Add each supply with the polarity that pushes its current that way.</li></ol>`,
        `<p>For a pnp in common-base: current flows <b>into</b> the emitter, so V<sub>EE</sub>'s + side faces the emitter. It flows <b>out of</b> the collector, so V<sub>CC</sub>'s − side faces the collector. For npn, flip both.</p>`,
        { t: "mcq", q: "An npn transistor in common-base. Which way does the emitter current flow?", opts: [
          ["Out of the emitter, the way the arrow points", true, "npn: Not Pointing iN. Current leaves through the emitter, so the emitter supply must pull it out: − side toward the emitter."],
          ["Into the emitter", false, "That's the pnp. The npn's arrow points out."],
        ]},
      ]},
      { k: "learn", title: "Breakdown", b: [
        `<p>Raise V<sub>CB</sub> far enough and the reverse-biased collector junction avalanches, just like a diode. The curves shoot upward.</p>`,
        `<div class="eq">Largest V<sub>CB</sub>: BV<sub>CBO</sub>, also written V<sub>(BR)CBO</sub></div>`,
        `<p class="aside">The "O" means the emitter is <b>open</b>. This limit applies to common-base. You'll see the common-emitter limit is quite a bit lower.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does α = 0.99 mean, physically?", model: "99% of the carriers injected by the emitter make it across the base into the collector; only 1% leave through the base lead. So the collector current is 0.99 times the emitter current, and the base current is the remaining 1%." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Common-emitter: the curves", mins: 25,
    blurb: "The most common way to use a BJT: a tiny base current controls the collector current.",
    takeaway: "Common-emitter: the emitter is shared by input and output. Input curves: I_B (µA) against V_BE, use V_BE = 0.7 V. Output curves: I_C (mA) against V_CE for each I_B. Active region: right of V_CE(sat) and above the I_B = 0 curve, where the curves are straight and evenly spaced. With I_B = 0, I_C isn't zero: I_CEO = I_CBO/(1 − α), so cutoff for amplifiers means I_C = I_CEO. As a switch, the transistor sits in cutoff or saturation.",
    steps: [
      { k: "learn", title: "Common-emitter", b: [
        seen("The BJT in its active region: v_BE ≈ 0.6 V and i_C = β·i_B.", "07-mosfet-amplifier.html#p8", "Chapter 7, Part 8"),
        `<p>Now the <b>emitter</b> is shared by the input (base) and output (collector). This is the most used configuration.</p>`,
        `<p>Same transistor, same rules: I<sub>E</sub> = I<sub>C</sub> + I<sub>B</sub> and I<sub>C</sub> = αI<sub>E</sub>. The input curve (I<sub>B</sub> against V<sub>BE</sub>) is diode-like again, with I<sub>B</sub> in <b>µA</b>. Model it as V<sub>BE</sub> = 0.7 V.</p>`,
      ]},
      { k: "play", title: "The output curves", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let IB = 30, V = 8;
          function draw() {
            const series = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((k) => ({ f: (v) => iCE(k, v), from: 0.001, cls: k === IB ? "s1" : "s5", n: 300 }));
            const IC = iCE(IB, V);
            f.innerHTML = plot({ x: [0, 20], y: [0, 11], xt: [0, 5, 10, 15, 20], yt: [0, 2, 4, 6, 8, 10], xl: "V_CE (V)", yl: "I_C (mA)", series, areas: [{ f: () => 11, from: 0, to: 0.3, cls: "ar2" }], marks: [{ x: V, y: IC }], label: "Common-emitter output curves, one per base current" });
            const region = V < 0.3 ? 1 : IB === 0 ? 2 : 0;
            ro.innerHTML = readout([["I<sub>B</sub>", IB + " µA"], ["V<sub>CE</sub>", fmt(V, 3) + " V"], ["I<sub>C</sub>", fmt(IC, 3) + " mA"]]);
            vd.className = "verdict " + ["ok", "no", "mid"][region];
            vd.textContent = ["Active: B–E forward, C–B reverse. Each 10 µA of base current adds about 1 mA of collector current.", "Saturation: left of V_CE(sat) ≈ 0.3 V. The curves crowd together.", "Cutoff (I_B = 0): but I_C isn't quite zero. That's I_CEO."][region];
          }
          host.append(f, slider({ id: id + "-ib", label: "Base current I<sub>B</sub>", min: 0, max: 90, step: 10, value: 30, show: (v) => v + " µA" }, (v) => { IB = v; draw(); }).el,
            slider({ id: id + "-v", label: "Collector–emitter voltage V<sub>CE</sub>", min: 0, max: 20, step: 0.05, value: 8, show: (v) => fmt(v, 3) + " V" }, (v) => { V = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p>Notice: µA in, mA out. And the curves tilt up a little: V<sub>CE</sub> has a bit more effect on I<sub>C</sub> than V<sub>CB</sub> had in common-base.</p>`,
      ]},
      { k: "learn", title: "Why I_B = 0 isn't quite off", b: [
        `<p>Start from I<sub>C</sub> = αI<sub>E</sub> + I<sub>CBO</sub> and put in I<sub>E</sub> = I<sub>C</sub> + I<sub>B</sub>. Collect the I<sub>C</sub> terms:</p>`,
        `<div class="eq">I<sub>C</sub> = α I<sub>B</sub>/(1 − α) + I<sub>CBO</sub>/(1 − α)</div>`,
        `<p>Set I<sub>B</sub> = 0 and the leakage is still there, but <b>multiplied</b> by 1/(1 − α):</p>`,
        `<div class="eq">I<sub>CEO</sub> = I<sub>CBO</sub> / (1 − α)    (base open)</div>`,
        { t: "num", q: "α = 0.995 and I_CBO = 0.5 µA. What's I_CEO, in µA?", a: 100, unit: "µA", hint: "1 − 0.995 = 0.005. Divide.", why: "0.5/0.005 = 100 µA. A half-microamp leak became a tenth of a milliamp." },
      ]},
      { k: "learn", title: "Where cutoff really is", b: [
        `<div class="key">For amplifiers, common-emitter cutoff is defined as <b>I<sub>C</sub> = I<sub>CEO</sub></b>. Stay above the I<sub>B</sub> = 0 curve if you want an undistorted output.</div>`,
        `<p>As a <b>switch</b> (in logic circuits), the transistor lives in two places: cutoff (off) and saturation (on).</p>`,
        `<div class="two"><div class="tile"><h3>Silicon</h3><p>I<sub>CEO</sub> is tiny, so I<sub>B</sub> = 0 counts as off.</p></div><div class="tile"><h3>Germanium</h3><p>Leakier. Reverse-bias the base–emitter junction a few tenths of a volt to get down to I<sub>C</sub> = I<sub>CBO</sub>.</p></div></div>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Where is the active region on a common-emitter output graph, and why does it matter?", model: "It's to the right of V_CE(sat), about 0.3 V, and above the I_B = 0 curve, where the curves are straight and evenly spaced. There, equal steps in base current give equal steps in collector current, so an amplifier working there doesn't distort the signal." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Beta", mins: 25,
    blurb: "How many times bigger the collector current is than the base current.",
    takeaway: "β_dc = I_C/I_B at the operating point (on datasheets: h_FE), typically 50 to 400. β_ac = ΔI_C/ΔI_B at constant V_CE (datasheets: h_fe). They're usually close and used interchangeably. Relations: α = β/(β + 1), β = α/(1 − α), I_CEO = (β + 1)I_CBO ≈ βI_CBO, I_C = βI_B, I_E = (β + 1)I_B.",
    steps: [
      { k: "learn", title: "DC beta", b: [
        `<div class="eq">β<sub>dc</sub> = I<sub>C</sub> / I<sub>B</sub>    (at the operating point)</div>`,
        `<p>Typical range: about <b>50 to 400</b>. With β = 200, the collector current is 200 times the base current.</p>`,
        `<p class="aside">Datasheets call it <b>h<sub>FE</sub></b>: h from the hybrid model (Chapter 5), F for forward current gain, E for common-emitter. Capital letters mean DC.</p>`,
      ]},
      { k: "learn", title: "AC beta", b: [
        `<div class="eq">β<sub>ac</sub> = ΔI<sub>C</sub> / ΔI<sub>B</sub>    with V<sub>CE</sub> held constant</div>`,
        `<p>On the curves: draw a vertical line through the Q-point (that keeps V<sub>CE</sub> constant). Pick the I<sub>B</sub> curves just above and below. Read the two I<sub>C</sub> values. Divide the change in I<sub>C</sub> by the change in I<sub>B</sub>.</p>`,
        `<p class="aside">Datasheets call it <b>h<sub>fe</sub></b>: lower-case letters mean AC.</p>`,
      ]},
      { k: "play", title: "Measure both betas", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let IB = 30, V = 8;
          function draw() {
            const lo = IB - 10, hi = IB + 10, I1 = iCE(lo, V), I2 = iCE(hi, V), IQ = iCE(IB, V);
            const series = [0, 10, 20, 30, 40, 50, 60, 70, 80].map((k) => ({ f: (v) => iCE(k, v), from: 0.001, cls: k === lo || k === hi ? "s2" : k === IB ? "s1" : "s5", n: 300 }));
            series.push({ pts: [[V, 0], [V, 11]], cls: "s4" });
            f.innerHTML = plot({ x: [0, 20], y: [0, 11], xt: [0, 5, 10, 15, 20], yt: [0, 2, 4, 6, 8, 10], xl: "V_CE (V)", yl: "I_C (mA)", series, marks: [{ x: V, y: IQ, label: "Q" }, { x: V, y: I1, cls: "mk2" }, { x: V, y: I2, cls: "mk2" }], label: "Reading beta off the output curves along a vertical line through the Q-point" });
            ro.innerHTML = readout([["Q-point", `I<sub>B</sub> = ${IB} µA, I<sub>C</sub> = ${fmt(IQ, 3)} mA`], ["β<sub>ac</sub> = ΔI<sub>C</sub>/ΔI<sub>B</sub>", `(${fmt(I2, 3)} − ${fmt(I1, 3)}) mA / 20 µA = ${fmt(((I2 - I1) / 20) * 1000, 3)}`], ["β<sub>dc</sub> = I<sub>C</sub>/I<sub>B</sub>", `${fmt(IQ, 3)} mA / ${IB} µA = ${fmt((IQ / IB) * 1000, 3)}`]]);
          }
          host.append(f, slider({ id: id + "-ib", label: "Q-point base current", min: 10, max: 70, step: 10, value: 30, show: (v) => v + " µA" }, (v) => { IB = v; draw(); }).el,
            slider({ id: id + "-v", label: "Q-point V<sub>CE</sub>", min: 1, max: 20, step: 0.5, value: 8, show: (v) => fmt(v, 3) + " V" }, (v) => { V = v; draw(); }).el, ro);
          draw();
        },
        `<p>The two betas are close but not equal. The gap comes from I<sub>CEO</sub>: it adds to I<sub>C</sub> (raising β<sub>dc</sub>) without changing the spacing between curves. The smaller I<sub>CEO</sub>, the closer they get.</p>`,
        `<p class="aside">If the curves were perfectly flat, evenly spaced, and I<sub>CEO</sub> = 0, β<sub>ac</sub> = β<sub>dc</sub> everywhere. Real curves never quite are. From here on, the book just writes β and uses one value for both.</p>`,
      ]},
      { k: "math", title: "Alpha and beta are linked", b: [
        `<p>Put I<sub>B</sub> = I<sub>C</sub>/β and I<sub>E</sub> = I<sub>C</sub>/α into I<sub>E</sub> = I<sub>C</sub> + I<sub>B</sub>, then divide by I<sub>C</sub>:</p>`,
        `<div class="eq">1/α = 1 + 1/β    ⇒    α = β/(β + 1)    β = α/(1 − α)</div>`,
        `<div class="eq">I<sub>C</sub> = βI<sub>B</sub>    I<sub>E</sub> = (β + 1)I<sub>B</sub>    I<sub>CEO</sub> = (β + 1)I<sub>CBO</sub> ≈ βI<sub>CBO</sub></div>`,
        { t: "num", q: "β = 150. What's α? (4 decimal places)", a: 0.9934, tol: 0.0002, hint: "150/151.", why: "150/151 ≈ 0.9934." },
        { t: "num", q: "α = 0.98. What's β?", a: 49, tol: 0.01, hint: "0.98/(1 − 0.98).", why: "0.98/0.02 = 49. Small changes in α near 1 make big changes in β." },
        { t: "num", q: "β = 150 and I_B = 20 µA. What's I_E, in mA?", a: 3.02, unit: "mA", tol: 0.003, hint: "(β + 1) × I_B.", why: "151 × 20 µA = 3.02 mA. I_C is 3 mA; the base adds 0.02 mA." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between β_dc and β_ac?", model: "β_dc is the ratio of the DC collector current to the DC base current at the operating point. β_ac is the ratio of a small change in collector current to the small change in base current that caused it, with V_CE held constant: the spacing between the curves. They're usually close, so the book uses one β for both." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Biasing, breakdown and common-collector", mins: 20,
    blurb: "Which way round to connect the supplies, how much voltage it can take, and the third configuration.",
    takeaway: "To bias a common-emitter stage: the arrow gives I_E; I_C and I_B both flow the other way (I_E = I_C + I_B); add supplies that push them. pnp: reverse everything. BV_CEO (V_(BR)CEO) is lower than BV_CBO, often about half, because avalanche currents get multiplied by β. Near breakdown the curves can show negative resistance. Common-collector: input at the base, output at the emitter. High input impedance, low output impedance: used for impedance matching. Design it with the common-emitter curves.",
    steps: [
      { k: "learn", title: "Biasing a common-emitter stage", b: [
        fig(S.svg(300, 200, bjt(150, 100, { labels: 1 }) + S.arrow(172, 160, 172, 190, "I_E", { lx: 186, ly: 180, a: "start" }) + S.arrow(172, 20, 172, 48, "I_C", { lx: 186, ly: 36, a: "start" }) + S.arrow(70, 100, 110, 100, "I_B", { ly: 88 }), { max: 300, label: "npn transistor with I_B and I_C flowing in and I_E flowing out" })),
        `<ol><li>The arrow says I<sub>E</sub> leaves the npn's emitter.</li><li>KCL: I<sub>E</sub> = I<sub>C</sub> + I<sub>B</sub>, so both I<sub>C</sub> and I<sub>B</sub> flow <b>in</b>.</li><li>Add a supply V<sub>BB</sub> that pushes I<sub>B</sub> into the base, and V<sub>CC</sub> that pushes I<sub>C</sub> into the collector: both with + toward the transistor.</li></ol>`,
        `<p class="aside">For a pnp, every current and every polarity flips.</p>`,
      ]},
      { k: "check", title: "Flip it", b: [
        { t: "mcq", q: "A pnp transistor in common-emitter. Which way does the base current flow?", opts: [
          ["Out of the base", true, "pnp: the arrow points in, so I_E flows into the emitter. KCL: I_C and I_B both flow out."],
          ["Into the base", false, "That's the npn. For pnp, flip every current."],
        ]},
      ]},
      { k: "learn", title: "Breakdown in common-emitter", b: [
        `<p>At high V<sub>CE</sub> the curves shoot up. In some places they even bend back: more current with <b>less</b> voltage. That's a <b>negative-resistance</b> region, the opposite of a resistor. Some devices later in the book rely on this.</p>`,
        `<div class="eq">Largest V<sub>CE</sub>: BV<sub>CEO</sub> (V<sub>(BR)CEO</sub>), often about half of BV<sub>CBO</sub></div>`,
        `<p>Why lower? Avalanche frees carriers, which add to the base current. The transistor multiplies that by β, which frees even more carriers. It feeds itself.</p>`,
        `<p class="aside">The other cause is punch-through, from the Early effect (Chapter 5). Avalanche dominates.</p>`,
      ]},
      { k: "learn", title: "Common-collector", b: [
        seen("The follower: output taken where it tracks the input, gain just under 1, useful as a buffer.", "08-small-signal-model.html#p6", "Chapter 8, Part 6"),
        `<p>Input at the base, output at the <b>emitter</b>, with the load from emitter to ground. The collector is the shared terminal.</p>`,
        `<div class="two"><div class="tile"><h3>High input impedance</h3><p>Barely loads whatever drives it.</p></div><div class="tile"><h3>Low output impedance</h3><p>Can drive a heavy load.</p></div></div>`,
        `<p>That's the opposite of common-base and common-emitter, so it's used for <b>impedance matching</b>.</p>`,
        `<p class="aside">No new curves needed: use the common-emitter set. Output current I<sub>E</sub> ≈ I<sub>C</sub> (α ≈ 1), and the voltage axis just changes sign.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is BV_CEO lower than BV_CBO?", model: "In common-emitter, avalanche at the collector junction creates extra carriers that act like extra base current. The transistor amplifies that by β, which creates more collector current, which causes more avalanche. Because of this feedback, breakdown sets in at a lower collector voltage than in common-base, often about half." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const LIM = { ICmax: 100, VCEmax: 40, PCmax: 500, VCEsat: 0.3 };
  const p8 = {
    id: "p8", title: "Limits of operation", mins: 20,
    blurb: "Too much current, too much voltage, too much heat: the safe box on the curves.",
    takeaway: "Stay inside: I_CEO ≤ I_C ≤ I_C(max), V_CE(sat) ≤ V_CE ≤ V_CE(max), and V_CE·I_C ≤ P_C(max). The power limit is a curve (a hyperbola): sketch it from three points, at I_C(max), at V_CE(max), and at half I_C(max). Common-base uses P_C(max) = V_CB·I_C.",
    steps: [
      { k: "learn", title: "Four walls and a curve", b: [
        `<div class="two"><div class="tile"><h3>I<sub>C max</sub></h3><p>Most continuous collector current.</p></div><div class="tile"><h3>BV<sub>CEO</sub></h3><p>Most collector–emitter voltage.</p></div><div class="tile"><h3>V<sub>CE sat</sub></h3><p>About 0.3 V. Below it: saturation, nonlinear.</p></div><div class="tile"><h3>I<sub>CEO</sub></h3><p>Below it: cutoff.</p></div></div>`,
        `<div class="eq">P<sub>C max</sub> = V<sub>CE</sub> I<sub>C</sub></div>`,
        `<p>Every point on the power-limit curve has the same product V<sub>CE</sub>·I<sub>C</sub>. More current means less voltage allowed.</p>`,
      ]},
      { k: "math", title: "Sketch the power curve", b: [
        `<p>Take a transistor with I<sub>C max</sub> = 100 mA, BV<sub>CEO</sub> = 40 V and P<sub>C max</sub> = 500 mW. Three points give a good sketch.</p>`,
        { t: "num", q: "At I_C = I_C(max) = 100 mA, what V_CE is on the curve?", a: 5, unit: "V", hint: "V_CE = P/I_C.", why: "500 mW/100 mA = 5 V." },
        { t: "num", q: "At V_CE = 40 V, what I_C?", a: 12.5, unit: "mA", hint: "I_C = P/V_CE.", why: "500 mW/40 V = 12.5 mA." },
        { t: "num", q: "At half of I_C(max), 50 mA?", a: 10, unit: "V", why: "500 mW/50 mA = 10 V. Join the three points with a smooth curve." },
      ]},
      { k: "play", title: "Stay in the box", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let I = 30, V = 12;
          function draw() {
            const edge = (v) => Math.min(LIM.ICmax, LIM.PCmax / v);
            f.innerHTML = plot({ x: [0, 45], y: [0, 115], xt: [0, 5, 10, 20, 30, 40], yt: [0, 12.5, 50, 100], ytf: (v) => fmt(v), xl: "V_CE (V)", yl: "I_C (mA)",
              areas: [{ f: edge, from: LIM.VCEsat, to: LIM.VCEmax, cls: "ar3", n: 300 }],
              series: [{ f: (v) => LIM.PCmax / v, from: 4.4, to: 45, cls: "s4" }, { pts: [[0, 100], [45, 100]], cls: "s5" }, { pts: [[40, 0], [40, 115]], cls: "s5" }, { pts: [[0.3, 0], [0.3, 115]], cls: "s5" }],
              marks: [{ x: V, y: I }], texts: [{ x: 24, y: 30, s: "P = 500 mW" }], label: "Safe operating area: under the current limit, left of the voltage limit, under the power curve" });
            const P = V * I, bad = [];
            if (I > LIM.ICmax) bad.push("I_C over 100 mA");
            if (V > LIM.VCEmax) bad.push("V_CE over 40 V");
            if (P > LIM.PCmax) bad.push("power over 500 mW");
            if (V < LIM.VCEsat) bad.push("in saturation");
            ro.innerHTML = readout([["Q-point", `${fmt(V, 3)} V, ${fmt(I, 3)} mA`], ["Power V<sub>CE</sub>I<sub>C</sub>", fmt(P, 3) + " mW"]]);
            vd.className = "verdict " + (bad.length ? "no" : "ok");
            vd.textContent = bad.length ? "Outside: " + bad.join(", ") + "." : "Inside the safe region.";
          }
          host.append(f, slider({ id: id + "-i", label: "I<sub>C</sub>", min: 0, max: 110, step: 1, value: 30, show: (v) => v + " mA" }, (v) => { I = v; draw(); }).el,
            slider({ id: id + "-v", label: "V<sub>CE</sub>", min: 0, max: 45, step: 0.1, value: 12, show: (v) => fmt(v, 3) + " V" }, (v) => { V = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">Green: the safe region for an undistorted signal. Try 30 mA at 20 V: well inside both walls, but over the power curve.</p>`,
      ]},
      { k: "learn", title: "No curves? Use the numbers", b: [
        `<p>Datasheets often skip the curves. Then just check all three:</p>`,
        `<div class="eq">I<sub>CEO</sub> ≤ I<sub>C</sub> ≤ I<sub>C max</sub>    V<sub>CE sat</sub> ≤ V<sub>CE</sub> ≤ V<sub>CE max</sub>    V<sub>CE</sub>I<sub>C</sub> ≤ P<sub>C max</sub></div>`,
        `<p class="aside">If only I<sub>CBO</sub> is given, estimate I<sub>CEO</sub> ≈ βI<sub>CBO</sub>. In common-base, the power limit uses V<sub>CB</sub>: P<sub>C max</sub> = V<sub>CB</sub>I<sub>C</sub>.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the power limit a curve while the current and voltage limits are straight lines?", model: "The current and voltage limits each cap one quantity on its own, so they're horizontal and vertical lines. The power limit caps the product V_CE × I_C. Keeping a product constant means that as one goes up the other must come down in proportion, which traces a hyperbola." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const hfeNorm = (lg) => { const x = lg - Math.log10(8); return Math.exp(-Math.LN2 * Math.pow(x / (x < 0 ? 1.727 : 0.796), 2)); };
  const p9 = {
    id: "p9", title: "Reading a datasheet", mins: 25,
    blurb: "Maximum ratings, off and on characteristics, and why β depends on the current.",
    takeaway: "Datasheets list maximum ratings (V_CEO, V_CBO, V_EBO, I_C, P_D and its derating), thermal data, and electrical characteristics split into off (breakdowns, I_CBO), on (h_FE, V_CE(sat), V_BE(sat)) and small-signal (h_fe, f_T, capacitances, noise). h_FE varies with collector current and temperature: a normalized graph gives it as a fraction of its peak value. Capacitances only matter at high frequencies.",
    steps: [
      { k: "learn", title: "What's on it", b: [
        `<p>The book walks through the datasheet for a general-purpose npn, the <b>2N4123</b>. A typical layout:</p>`,
        `<div class="two"><div class="tile"><h3>Maximum ratings</h3><p>V<sub>CEO</sub> 30 V, V<sub>CBO</sub> 40 V, V<sub>EBO</sub> 5 V, I<sub>C</sub> 200 mA, P<sub>D</sub> 625 mW at 25 °C (derate 5 mW/°C above).</p></div><div class="tile"><h3>Off</h3><p>Breakdown voltages, I<sub>CBO</sub> 50 nA max.</p></div><div class="tile"><h3>On</h3><p>h<sub>FE</sub> 50 to 150 (at 2 mA, 1 V), at least 25 at 50 mA. V<sub>CE(sat)</sub> 0.3 V.</p></div><div class="tile"><h3>Small-signal</h3><p>h<sub>fe</sub>, gain-bandwidth f<sub>T</sub>, capacitances, noise figure.</p></div></div>`,
        `<p class="aside">"Off" and "on" are DC limits. "Small-signal" is for AC: you'll use those in Chapter 5.</p>`,
      ]},
      { k: "check", title: "Use the sheet", b: [
        { t: "num", q: "P_D is 625 mW at 25 °C, derated 5 mW/°C. What's the limit at 75 °C?", a: 375, unit: "mW", hint: "50 °C above 25 °C.", why: "625 − 50 × 5 = 375 mW." },
        { t: "num", q: "Estimate I_CEO for a part with h_FE up to 200 and I_CBO = 20 nA. Answer in µA.", a: 4, unit: "µA", hint: "I_CEO ≈ βI_CBO. Use the largest β for the worst case.", why: "200 × 20 nA = 4 µA. Small enough to call it zero for most uses." },
        `<p class="aside">The book's limit list for the 2N4123 says V<sub>CE</sub>I<sub>C</sub> ≤ 650 mW. Its own rating table says 625 mW, so 650 looks like a typo.</p>`,
      ]},
      { k: "play", title: "β depends on the current", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const top = 160;
          let lg = Math.log10(2);
          function draw() {
            const n = hfeNorm(lg), I = Math.pow(10, lg);
            f.innerHTML = plot({ x: [-1, Math.log10(200)], y: [0, 1.15], xt: [-1, 0, 1, 2], xtf: (v) => si(Math.pow(10, v) / 1000, "A", 2), yt: [0, 0.5, 1], xl: "I_C (log scale)", yl: "h_FE (normalized)", series: [{ f: hfeNorm, cls: "s1" }], marks: [{ x: lg, y: n }], label: "Normalized DC current gain against collector current at 25 degrees" });
            ro.innerHTML = readout([["I<sub>C</sub>", si(I / 1000, "A")], ["Normalized h<sub>FE</sub>", fmt(n, 2)], ["Actual h<sub>FE</sub> (peak 160)", fmt(n * top, 3)]]);
          }
          host.append(f, slider({ id: id + "-i", label: "Collector current", min: -1, max: Math.log10(200), step: 0.01, value: lg, show: (v) => si(Math.pow(10, v) / 1000, "A") }, (v) => { lg = v; draw(); }).el, ro);
          draw();
        },
        `<p><b>Normalized</b> means divided by its peak value, so the peak is 1. Here it peaks around 8 mA and halves at about 0.15 mA and 50 mA. If your transistor's peak h<sub>FE</sub> is 160, multiply the graph by 160.</p>`,
        `<p class="aside">The datasheet also shows hotter transistors with higher h<sub>FE</sub> and colder ones lower. And note the log axis: Chapter 9 covers log scales properly.</p>`,
      ]},
      { k: "learn", title: "The rest of the sheet", b: [
        `<div class="two"><div class="tile"><h3>Capacitances</h3><p>C<sub>ibo</sub> and C<sub>obo</sub> (input and output, common-base). A few pF: treat as open circuits except at high frequency.</p></div><div class="tile"><h3>Switching times</h3><p>How fast it turns on and off. Section 4.15.</p></div><div class="tile"><h3>Noise figure</h3><p>Extra disturbance the transistor adds to the signal, in dB. Worse at low frequency and with high source resistance.</p></div><div class="tile"><h3>h-parameters</h3><p>h<sub>fe</sub>, h<sub>ie</sub> and friends, plotted against I<sub>C</sub>. Chapter 5.</p></div></div>`,
        `<p class="aside">Most datasheets don't include full collector curves. The numbers above are expected to be enough.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "A datasheet says h_FE is 50 to 150. Why such a wide range?", model: "Transistors of the same type vary a lot from one to the next, and β also depends on the collector current and temperature. The datasheet gives a range at stated test conditions so you design circuits that work for any transistor in that range, not just a typical one." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const MYST = {
    T1: { "B>E": "0.68 V", "B>C": "0.64 V" },
    T2: { "E>B": "0.67 V", "C>B": "0.63 V" },
    T3: { "B>E": "0.00 V", "E>B": "0.00 V", "B>C": "0.64 V", "E>C": "0.64 V" },
  };
  const p10 = {
    id: "p10", title: "Testing, packages and Moore's law", mins: 20,
    blurb: "Check a transistor with a meter, find its leads, and see how fast transistor counts grow.",
    takeaway: "Diode-check each junction: base to emitter and base to collector should read about 0.7 V one way and OL the other; collector to emitter OL both ways. Red (+) on the base reading low means npn; black on the base reading low means pnp. On an ohmmeter: forward junction 100 Ω to a few kΩ, reverse over 100 kΩ. Low or high both ways means faulty. A curve tracer shows the collector curves directly. Moore's law: the transistor count on a chip doubles about every 2 years.",
    steps: [
      { k: "play", title: "Test the mystery transistors", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const T = ["T1", "T2", "T3"], L = ["B", "C", "E"];
          let t = 0, red = 0, blk = 2;
          function draw() {
            const r = L[red], b = L[blk], same = red === blk;
            const read = same ? "— —" : MYST[T[t]][r + ">" + b] || "OL";
            let s = `<rect x="80" y="10" width="160" height="56" rx="8" style="fill:#10161d"/><text x="160" y="48" text-anchor="middle" style="fill:#5cf29b;font-size:26px;font-family:var(--mono)">${read}</text>`;
            s += `<rect x="128" y="86" width="64" height="40" rx="20" class="el"/>` + ["E", "B", "C"].map((n, i) => `<line class="w" x1="${140 + i * 20}" y1="126" x2="${140 + i * 20}" y2="160"/>` + S.t(140 + i * 20, 178, n, { cls: n === r ? "b" : n === b ? "" : "m" })).join("");
            s += S.t(160, 198, same ? "pick two different leads" : `red on ${r}, black on ${b}`, { cls: "s" });
            f.innerHTML = S.svg(320, 210, s, { max: 320, label: "Meter in diode-check mode connected to two leads of a transistor" });
            ro.innerHTML = readout([["Transistor", T[t]], ["Red (+) lead", r], ["Black (−) lead", b]]);
          }
          host.append(f, toggle(T, (k) => { t = k; draw(); }, 0), toggle(["Red on B", "Red on C", "Red on E"], (k) => { red = k; draw(); }, 0), toggle(["Black on B", "Black on C", "Black on E"], (k) => { blk = k; draw(); }, 2), ro);
          draw();
        },
        `<p>Diode-check mode: the meter pushes a small current from red (+) to black (−) and shows the voltage. A forward-biased junction reads about 0.7 V; a reverse-biased one reads OL.</p>`,
      ]},
      { k: "check", title: "Your diagnosis", b: [
        { t: "sort", q: "Try every lead pair on each transistor. Then sort them.", bins: ["Good npn", "Good pnp", "Faulty"], items: [
          ["T1", 0, "Red on B reads about 0.7 V to both E and C: both junctions point out of the base. That's npn (p-type base)."],
          ["T2", 1, "Black on B reads about 0.7 V from both E and C: the junctions point into the base. That's pnp (n-type base)."],
          ["T3", 2, "B–E reads 0.00 V both ways: that junction is shorted."],
        ]},
        { t: "mcq", q: "With an ohmmeter instead, what should a good npn's base–collector junction read with the + lead on the collector?", opts: [
          ["High: over 100 kΩ", true, "+ on the collector reverse-biases that junction."],
          ["Low: a few hundred ohms", false, "That's the forward direction: + on the base."],
          ["Zero", false, "Zero means a short: a faulty transistor."],
        ]},
      ]},
      { k: "learn", title: "Curve tracers and packages", b: [
        `<p>A <b>curve tracer</b> draws the collector curves on a screen. It also shows a "β per division" factor: multiply it by how many divisions apart the I<sub>B</sub> curves are near your Q-point.</p>`,
        { t: "num", q: "The tracer says 150 per division. Near your Q-point the I_B curves are 0.8 divisions apart. What's β_ac?", a: 120, tol: 0.01, why: "0.8 × 150 = 120." },
        `<p>Packages: small plastic or metal "top hat" cans for low power, heavy metal cases for high power. Leads are marked by a dot, tab, flat side or printed letters. Several transistors can share one chip package, like a 14-pin DIP with four inside.</p>`,
      ]},
      { k: "learn", title: "Moore's law", b: [
        `<div class="key">Gordon Moore predicted in 1965 that the number of transistors on a chip would <b>double about every 2 years</b>. It held remarkably well.</div>`,
        { t: "num", q: "An early chip had about 2,300 transistors. Doubling every 2 years for 40 years gives about how many, in billions?", a: 2.41, unit: "billion", tol: 0.03, hint: "40 years = 20 doublings. 2²⁰ ≈ 1,048,576.", why: "2,300 × 1,048,576 ≈ 2.4 billion. That's the size of the biggest chips the book mentions." },
        `<p class="aside">Silicon still leads, but III–V compound semiconductors like InGaAs are pushing speed further.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How can a meter tell you whether a transistor is npn or pnp?", model: "Use diode-check mode on the base–emitter junction. If it reads about 0.7 V with the red (+) lead on the base and black on the emitter, the base is p-type, so it's npn. If it reads 0.7 V only with the black lead on the base, it's pnp. Both junctions should conduct one way and read OL the other way; anything else means it's faulty." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edc3", eyebrow: "Boylestad · Chapter 3", title: "Bipolar Junction Transistors",
    intro: `<p>Ten short parts: how a BJT is built and why it amplifies, its three configurations and their curves, α and β, the limits you must stay inside, datasheets, and testing.</p><p>6.002 treated the BJT briefly as i<sub>C</sub> = βi<sub>B</sub>. This book goes inside the device and reads its real curves.</p><p class="aside">The "Computer Analysis" section isn't covered. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's problems in the book. They test whether the ideas stuck, so don't expect them to look like the examples here.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10],
    summary: `
      <h3>Structure and operation</h3>
      <p>Three layers (npn or pnp). Emitter heavily doped; base thin and lightly doped. Active: B–E forward, C–B reverse. Cutoff: both reverse. Saturation: both forward. Arrow = direction of emitter current (npn: not pointing in).</p>
      <div class="eq">I<sub>E</sub> = I<sub>C</sub> + I<sub>B</sub>    I<sub>C</sub> = I<sub>C majority</sub> + I<sub>CO</sub>    V<sub>BE</sub> ≈ 0.7 V (on)</div>
      <h3>Alpha and beta</h3>
      <div class="eq">α<sub>dc</sub> = I<sub>C</sub>/I<sub>E</sub>    α<sub>ac</sub> = ΔI<sub>C</sub>/ΔI<sub>E</sub> (V<sub>CB</sub> const)    I<sub>C</sub> = αI<sub>E</sub> + I<sub>CBO</sub></div>
      <div class="eq">β<sub>dc</sub> = I<sub>C</sub>/I<sub>B</sub> (h<sub>FE</sub>)    β<sub>ac</sub> = ΔI<sub>C</sub>/ΔI<sub>B</sub> (V<sub>CE</sub> const) (h<sub>fe</sub>)</div>
      <div class="eq">α = β/(β + 1)    β = α/(1 − α)    I<sub>C</sub> = βI<sub>B</sub>    I<sub>E</sub> = (β + 1)I<sub>B</sub></div>
      <div class="eq">I<sub>CEO</sub> = I<sub>CBO</sub>/(1 − α) = (β + 1)I<sub>CBO</sub> ≈ βI<sub>CBO</sub></div>
      <h3>Configurations</h3>
      <p>Common-base: input I<sub>E</sub>–V<sub>BE</sub>, output I<sub>C</sub>–V<sub>CB</sub>, I<sub>C</sub> ≈ I<sub>E</sub>, limit BV<sub>CBO</sub>. Common-emitter: input I<sub>B</sub>–V<sub>BE</sub>, output I<sub>C</sub>–V<sub>CE</sub>, cutoff at I<sub>C</sub> = I<sub>CEO</sub>, limit BV<sub>CEO</sub> (lower). Common-collector: high input, low output impedance; uses CE curves.</p>
      <h3>Limits</h3>
      <div class="eq">I<sub>CEO</sub> ≤ I<sub>C</sub> ≤ I<sub>C max</sub>    V<sub>CE sat</sub> ≤ V<sub>CE</sub> ≤ V<sub>CE max</sub>    V<sub>CE</sub>I<sub>C</sub> ≤ P<sub>C max</sub></div>
      <h3>Testing</h3>
      <p>Diode check: each junction ≈ 0.7 V one way, OL the other; C–E OL both ways. Red on base reads low ⇒ npn. Ohmmeter: forward 100 Ω to a few kΩ, reverse &gt; 100 kΩ.</p>`,
  };
  Course.start(window.CHAPTER);
})();
