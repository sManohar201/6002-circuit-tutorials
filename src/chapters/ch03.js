(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;

  /* ---------- shared drawings ---------- */
  // Part 1: source a-b-g loop with three nodes
  function loopFig(extra = "") {
    const s = S.wire([50, 92], [50, 30], [80, 30]) + S.res(80, 30, 220, 30, "drops 3 V") + S.wire([220, 30], [250, 30]) +
      S.res(250, 30, 250, 190, "drops 6 V", { side: "left" }) + S.wire([250, 190], [50, 190], [50, 128]) + S.vsrc(50, 110, "9 V") +
      S.dot(50, 30) + S.dot(250, 30) + S.dot(150, 190) + S.t(38, 22, "a", { cls: "big" }) + S.t(262, 22, "b", { cls: "big" }) + S.t(150, 214, "g", { cls: "big" });
    return S.svg(420, 225, s + extra, { max: 420, label: "A 9 V source and two resistors, nodes a, b and g" });
  }
  // One unknown node e: V - R1 - e, R2 to ground, current source I into e
  function oneNodeFig(o = {}) {
    const L = Object.assign({ V: "V", R1: "R1", R2: "R2", I: "I", e: "e" }, o);
    let s = "";
    if (o.vOff) s += S.wc("hl", [50, 30], [50, 190]) + S.t(62, 115, "short", { a: "start", cls: "a" });
    else s += S.wire([50, 92], [50, 30]) + S.wire([50, 128], [50, 190]) + S.vsrc(50, 110, L.V, { side: "right" });
    s += S.wire([50, 30], [80, 30]) + S.res(80, 30, 200, 30, L.R1) + S.wire([200, 30], [320, 30]) + S.res(230, 30, 230, 190, L.R2, { side: "right" });
    if (o.iOff) s += S.wire([320, 30], [320, 80]) + S.wire([320, 140], [320, 190]) + S.t(334, 115, "open", { a: "start", cls: "a" });
    else s += S.wire([320, 30], [320, 92]) + S.wire([320, 128], [320, 190]) + S.isrc(320, 110, L.I, { side: "right" });
    s += S.wire([50, 190], [320, 190]) + S.gnd(140, 190) + S.dot(230, 30) + S.dot(230, 190) + S.t(230, 18, L.e, { cls: "big" });
    return S.svg(420, 225, s + (o.extra || ""), { max: 420, label: o.label || "A source, two resistors and a current source around one node" });
  }
  // Two unknown nodes e1, e2
  function twoNodeFig(o = {}) {
    const L = Object.assign({ V: "12 V", R1: "2 Ω", R2: "2 Ω", R3: "1 Ω", R4: "2 Ω", I: "2 A", e1: "e₁", e2: "e₂" }, o);
    const h = o.hl || [];
    const c = (k) => ({ cls: h.includes(k) ? "hl" : "" });
    let s = S.wire([40, 92], [40, 30], [60, 30]) + S.res(60, 30, 170, 30, L.R1, c("R1")) + S.res(170, 30, 170, 190, L.R2, Object.assign({ side: "right" }, c("R2"))) +
      S.res(170, 30, 300, 30, L.R3, c("R3")) + S.res(300, 30, 300, 190, L.R4, Object.assign({ side: "right" }, c("R4"))) +
      S.wire([300, 30], [400, 30], [400, 92]) + S.wire([400, 128], [400, 190]) + S.isrc(400, 110, L.I, { side: "right" }) +
      S.wire([40, 128], [40, 190], [400, 190]) + S.vsrc(40, 110, L.V, { side: "right" }) + S.gnd(100, 190) +
      S.dot(170, 30) + S.dot(300, 30) + S.dot(170, 190) + S.dot(300, 190) + S.t(170, 14, L.e1, { cls: "big" }) + S.t(300, 14, L.e2, { cls: "big" });
    return S.svg(470, 225, s, { max: 470, label: "Two unknown node voltages e1 and e2" });
  }
  // Supernode: floating 2 V source between node A (e) and node B (e + 2)
  function superFig(o = {}) {
    let s = (o.zone ? `<polygon class="zone" points="88,10 322,10 322,54 152,54 152,140 88,140"/>` : "") +
      S.wire([120, 30], [120, 57]) + S.wire([120, 93], [120, 120]) + S.vsrc(120, 75, "2 V") +
      S.wire([120, 30], [300, 30]) + S.res(300, 30, 300, 200, "2 Ω", { side: "right" }) + S.res(120, 120, 120, 200, "2 Ω", { side: "right" }) +
      S.wire([40, 142], [40, 120], [120, 120]) + S.wire([40, 178], [40, 200]) + S.isrc(40, 160, "3 A", { side: "right" }) +
      S.wire([40, 200], [300, 200]) + S.gnd(210, 200) + S.dot(120, 120) + S.dot(120, 30) + S.dot(120, 200) +
      S.t(140, 112, "e", { cls: "big", a: "start" }) + S.t(210, 24, "e + 2 V", { cls: "big" });
    if (o.zone) s += S.t(318, 48, "super node", { cls: "s a", a: "end" });
    return S.svg(420, 232, s, { max: 420, label: "A floating voltage source between two nodes" });
  }
  // Node e0 with neighbors at known voltages
  const starFig = S.svg(400, 230,
    S.res(60, 110, 200, 110, "1 kΩ") + S.res(200, 20, 200, 110, "3 kΩ") + S.res(200, 110, 340, 110, "5 kΩ", { side: "below" }) +
    S.wire([200, 110], [200, 150]) + S.isrc(200, 168, "I", { down: true, side: "right" }) + S.wire([200, 186], [200, 214]) +
    S.dot(200, 110) + S.t(52, 115, "8 V", { a: "end", cls: "big" }) + S.t(214, 18, "2 V", { a: "start", cls: "big" }) + S.t(348, 115, "0 V", { a: "start", cls: "big" }) +
    S.t(214, 100, "5 V", { a: "start", cls: "big a" }) + S.t(214, 226, "…", { a: "start" }),
    { max: 400, label: "A node at 5 V joined to three nodes of known voltage and a current source" });
  // Dependent current source circuit (VCCS output stage)
  const vccsFig = S.svg(480, 225,
    S.wire([50, 92], [50, 30], [80, 30]) + S.res(80, 30, 230, 30, "R_P = 1 kΩ") + S.res(230, 30, 230, 190, "R_L = 1 kΩ", { side: "left" }) +
    S.wire([230, 30], [330, 30], [330, 88]) + S.wire([330, 132], [330, 190]) + S.dep(330, 110, "i_O = −G_m·v_I") +
    S.wire([50, 128], [50, 190], [330, 190]) + S.vsrc(50, 110, "1 V", { side: "right" }) + S.gnd(140, 190) + S.dot(230, 30) + S.dot(230, 190) + S.t(230, 16, "v_O", { cls: "big" }) + S.t(50, 16, "v_I", { cls: "big" }),
    { max: 480, label: "Input source, resistors and a voltage-controlled current source" });
  // Adder feeding a dependent source (superposition with a dependent source)
  function adderDepFig(o = {}) {
    let s = "";
    const src = (x, lab, off) => off ? S.wc("hl", [x, 30], [x, 190]) + S.t(x + 10, 115, "short", { a: "start", cls: "a" }) : S.wire([x, 92], [x, 30]) + S.wire([x, 128], [x, 190]) + S.vsrc(x, 110, lab, { side: "right" });
    s += src(40, "V₁ = 2 V", o.off1) + src(200, "", o.off2) + (o.off2 ? "" : S.t(226, 150, "V₂ = 4 V", { a: "start" }));
    s += S.res(40, 30, 120, 30, "1 kΩ") + S.res(120, 30, 200, 30, "1 kΩ") + S.wire([40, 190], [200, 190]) + S.dot(120, 30) + S.t(120, 58, "v", { cls: "big a" });
    s += S.wire([200, 190], [320, 190]) + S.wire([320, 88], [320, 30], [440, 30]) + S.wire([320, 132], [320, 190], [440, 190]) + S.dep(320, 110, "g·v") +
      S.res(440, 30, 440, 190, "2 kΩ", { side: "right" }) + S.dot(440, 30) + S.t(440, 16, "v_O", { cls: "big" }) + S.gnd(120, 190) + S.t(350, 60, "g = 5 mS", { a: "start", cls: "s m" });
    return S.svg(500, 225, s, { max: 500, label: "Two sources average into v, which controls a current source driving a 2 kΩ load" });
  }
  // Thévenin / Norton equivalents with terminals
  function thevFig(v, r, extra = "") {
    return S.svg(300, 200, S.wire([60, 82], [60, 30], [90, 30]) + S.res(90, 30, 200, 30, r) + S.wire([200, 30], [240, 30]) + S.wire([60, 118], [60, 170], [240, 170]) + S.vsrc(60, 100, v) +
      `<circle cx="240" cy="30" r="5" class="el"/><circle cx="240" cy="170" r="5" class="el"/>` + S.t(240, 16, "+", { cls: "big" }) + S.t(240, 194, "−", { cls: "big" }) + extra, { max: 300, label: "Thévenin equivalent: a voltage source in series with a resistor" });
  }
  function nortonFig(i, r, extra = "") {
    return S.svg(300, 200, S.wire([60, 82], [60, 30], [240, 30]) + S.wire([60, 118], [60, 170], [240, 170]) + S.isrc(60, 100, i) + S.res(160, 30, 160, 170, r, { side: "right" }) + S.dot(160, 30) + S.dot(160, 170) +
      `<circle cx="240" cy="30" r="5" class="el"/><circle cx="240" cy="170" r="5" class="el"/>` + S.t(240, 16, "+", { cls: "big" }) + S.t(240, 194, "−", { cls: "big" }) + extra, { max: 300, label: "Norton equivalent: a current source in parallel with a resistor" });
  }
  // The mystery box used in Parts 8 and 9: 12 V, 4 Ω series, 12 Ω shunt
  function boxFig(RL, open) {
    let s = `<rect class="box" x="8" y="20" width="188" height="170" rx="10"/>`;
    if (open) s += S.wire([46, 92], [46, 60], [66, 60]) + S.res(66, 60, 156, 60, "4 Ω") + S.wire([156, 60], [196, 60]) + S.res(170, 60, 170, 160, "12 Ω", { side: "left" }) + S.wire([46, 128], [46, 160], [196, 160]) + S.vsrc(46, 110, "") + S.t(70, 115, "12 V", { a: "start", cls: "s" }) + S.dot(170, 60) + S.dot(170, 160);
    else s += S.t(102, 118, "?", { cls: "big" }) + S.t(102, 142, "mystery box", { cls: "s m" });
    s += S.wire([196, 60], [320, 60]) + S.wire([196, 160], [320, 160]) + `<circle cx="216" cy="60" r="5" class="el"/><circle cx="216" cy="160" r="5" class="el"/>`;
    s += RL == null ? S.t(326, 115, "nothing attached", { a: "start", cls: "s m" }) : S.res(320, 60, 320, 160, "R_L = " + RL, { side: "right" });
    s += S.t(234, 100, "+", { cls: "big" }) + S.t(234, 140, "−", { cls: "big" }) + S.t(246, 120, "v", { cls: "big a", a: "start" }) + S.arrow(256, 48, 296, 48, "i", { ly: 40 });
    return S.svg(450, 205, s, { max: 450, label: open ? "Inside the box: 12 V source, 4 Ω in series, 12 Ω across the terminals" : "A sealed box with two terminals and a load resistor" });
  }
  // Bridge: two dividers, meter between their midpoints
  function bridgeFig(o = {}) {
    const s = S.wire([60, 92], [60, 30], [300, 30]) + S.wire([60, 128], [60, 190], [300, 190]) + S.vsrc(60, 110, "10 V") +
      S.res(140, 30, 140, 110, o.R1 || "R₁", { side: "right" }) + S.res(140, 110, 140, 190, "R₃ = ?", { side: "right" }) +
      S.res(300, 30, 300, 110, "R₂ = 1 kΩ", { side: "right" }) + S.res(300, 110, 300, 190, "R₄ = 2 kΩ", { side: "right" }) +
      S.wire([140, 110], [194, 110]) + S.wire([246, 110], [300, 110]) + `<circle class="el${o.hl ? " hl" : ""}" cx="220" cy="110" r="26"/>` + S.t(220, 116, o.meter || "V", { cls: "big" }) +
      S.dot(140, 30) + S.dot(140, 190) + S.dot(140, 110) + S.dot(300, 110) + S.t(152, 100, "a", { cls: "big", a: "start" }) + S.t(288, 100, "b", { cls: "big", a: "end" });
    return S.svg(420, 220, s, { max: 420, label: "Bridge: two voltage dividers with a voltmeter between their midpoints" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Node voltages", mins: 15,
    blurb: "Pick one node as 0 V. Every other node gets one number.",
    takeaway: "A node voltage is that node's height above ground. Every branch voltage is just the difference of two node voltages: v_ab = e_a − e_b.",
    steps: [
      { k: "learn", title: "Why a new method?", b: [
        `<p>Chapter 2's basic method gives every branch a v and an i. For B branches that's <b>2B unknowns</b>. A modest circuit with 8 branches already means 16 equations.</p>`,
        `<p>This chapter's tools cut that down a lot. The first idea: describe the circuit by its <b>nodes</b>, not its branches.</p>`,
        `<div class="key">Pick one node as the <b>reference</b> (called <b>ground</b>, 0 V). A node's <b>node voltage</b> e is its potential measured from ground.</div>`,
      ]},
      { k: "play", title: "Move the ground", b: [
        `<p>Same circuit, three choices of ground. Watch which numbers change and which stay put.</p>`,
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const pot = { a: 9, b: 6, g: 0 }, NP = { a: [50, 30], b: [250, 30], g: [150, 190] };
          let gi = 2;
          const names = ["a", "b", "g"];
          function draw() {
            const G = names[gi], e = (n) => pot[n] - pot[G];
            let x = "";
            names.forEach((n) => {
              const [px, py] = NP[n], lx = n === "a" ? px + 14 : n === "b" ? px - 14 : px + 22, ly = n === "g" ? py - 10 : py + 24;
              x += `<circle cx="${px}" cy="${py}" r="${n === G ? 10 : 6}" style="fill:${n === G ? "var(--good)" : "var(--accent)"}"/>` + S.t(lx, ly, "e = " + fmt(e(n)) + " V", { a: n === "b" ? "end" : "start", cls: n === G ? "g" : "a" });
            });
            const Y = (v) => 200 - (v + 9) * 9.5;
            x += `<line x1="350" y1="${Y(-9)}" x2="350" y2="${Y(9)}" class="w dim"/>`;
            names.forEach((n) => { x += `<circle cx="350" cy="${Y(e(n))}" r="5" class="nd"/>` + S.t(362, Y(e(n)) + 5, n + ": " + fmt(e(n)), { a: "start", cls: "s" }); });
            x += S.t(350, Y(0) + 4, "0 V ―", { a: "end", cls: "s g" }) + S.t(360, 12, "height", { cls: "s m" });
            f.innerHTML = loopFig(x);
            ro.innerHTML = readout([["e_a − e_b", fmt(e("a") - e("b")) + " V"], ["e_b − e_g", fmt(e("b") - e("g")) + " V"], ["ground", "node " + G]]) +
              `<p class="aside">The node voltages all shift together. The <b>differences</b> (the branch voltages) never change. Elements only respond to branch voltages, so any node can be ground.</p>`;
          }
          host.append(toggle(["Ground at a", "Ground at b", "Ground at g"], (i) => { gi = i; draw(); }, 2), f, ro);
          draw();
        },
      ]},
      { k: "learn", title: "Branch voltage from node voltages", b: [
        `<div class="eq">v<sub>ab</sub> = e<sub>a</sub> − e<sub>b</sub></div>`,
        `<p>Put the <b>+</b> end's node voltage first. If e<sub>a</sub> is higher than e<sub>b</sub>, v<sub>ab</sub> comes out positive.</p>`,
        `<p>Current in a resistor flows from the higher node voltage to the lower one, so (Ohm's law):</p>`,
        `<div class="eq">i (a → b) = (e<sub>a</sub> − e<sub>b</sub>) / R</div>`,
      ]},
      { k: "check", title: "Read the voltages", b: [
        `<p>Ground at g, so e<sub>a</sub> = 9 V and e<sub>b</sub> = 6 V.</p>`,
        { t: "num", q: "What is v<sub>ba</sub> (the + mark on b, the − mark on a)?", a: -3, unit: "V", hint: "v_ba = e_b − e_a. The first letter's node goes first.", why: "6 − 9 = −3 V. Same element, opposite labeling, opposite sign." },
        { t: "num", q: "With ground moved to b, what is the node voltage of g?", a: -6, unit: "V", hint: "g sits 6 V below b.", why: "e_g = 0 − 6 = −6 V. A node below ground has a negative node voltage. Nothing strange about it." },
      ]},
      { k: "learn", title: "KCL written in node voltages", b: [
        fig(starFig),
        `<p>The middle node sits at 5 V. Each resistor's current <b>into</b> the middle node is (neighbor − middle)/R:</p>`,
        `<div class="tbl"><table><tbody>
          <tr><td>from 8 V via 1 kΩ</td><td class="mono">(8 − 5)/1k = +3 mA</td></tr>
          <tr><td>from 2 V via 3 kΩ</td><td class="mono">(2 − 5)/3k = −1 mA</td></tr>
          <tr><td>from 0 V via 5 kΩ</td><td class="mono">(0 − 5)/5k = −1 mA</td></tr></tbody></table></div>`,
        `<p>This is the key move of the whole chapter: <b>KCL with no branch-current variables</b>, only node voltages and resistor values.</p>`,
      ]},
      { k: "check", title: "Finish the node", b: [
        { t: "num", q: "The current source I is drawn leaving the node (downward). What must I be?", fig: fig(starFig), a: 1, unit: "mA", hint: "Add the three resistor currents into the node. Whatever net amount comes in has to leave through I.", why: "3 − 1 − 1 = 1 mA comes in through the resistors, so I = 1 mA leaves. KCL balanced." },
      ]},
      { k: "why", title: "The person on the power line", b: [
        { t: "mcq", q: "A bird (or a careless person) hangs from a single high-voltage line at 10 000 V and touches nothing else. Why isn't it hurt?", opts: [
          ["Both of its contact points are on the same node, so there's no voltage difference across its body and no current", true, "Only differences between nodes push current. Touch the ground or a second wire at another potential and a deadly current flows."],
          ["Its body has infinite resistance", false, "Bodies conduct. The point is that no voltage exists across it."],
          ["The line's node voltage is measured from somewhere else, so it doesn't count", false, "The node voltage is real, but it's a difference from ground. The body isn't touching ground."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why are you free to choose any node as ground?", model: "Elements only care about the voltage across them, which is a difference between two node voltages. Shifting every node voltage by the same amount changes no difference. So the choice of ground changes the labels but not a single branch voltage or current." },
      ]},
    ],
  };

  /* =============== PART 2 (math, Appendix D) =============== */
  const p2 = {
    id: "p2", title: "Math boost: solving linear equations", mins: 25,
    blurb: "One unknown, then two. Clearing fractions, elimination, Cramer's rule.",
    takeaway: "Each linear equation is a balance: do the same thing to both sides. Two unknowns need two equations; their solution is where the two lines cross.",
    steps: [
      { k: "math", title: "One unknown with fractions", b: [
        `<p>The node method always ends in equations like this one (you'll meet it in Part 3):</p>`,
        `<div class="eq">(e − 9)/3 + e/6 = 1</div>`,
        `<p><b>Trick:</b> multiply <b>every term on both sides</b> by a number that clears all the denominators. Here 6 works (3 and 6 both divide it).</p>`,
        { t: "reveal", label: "Show the steps", html: `<div class="tbl"><table><tbody>
          <tr><td>× 6 everywhere</td><td class="mono">2(e − 9) + e = 6</td></tr>
          <tr><td>open brackets</td><td class="mono">2e − 18 + e = 6</td></tr>
          <tr><td>collect e terms</td><td class="mono">3e − 18 = 6</td></tr>
          <tr><td>+18 both sides</td><td class="mono">3e = 24</td></tr>
          <tr><td>÷ 3 both sides</td><td class="mono">e = 8</td></tr></tbody></table></div>` },
        `<p class="aside">Always check: (8 − 9)/3 + 8/6 = −1/3 + 4/3 = 1 ✓</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Solve (e − 4)/2 + e/2 = 3", a: 5, hint: "Multiply every term by 2 first.", hint2: "e − 4 + e = 6. Now collect the e terms.", why: "e − 4 + e = 6, so 2e = 10 and e = 5. Check: 1/2 + 5/2 = 3 ✓" },
        { t: "num", q: "Solve (x − 10)/4 + x/12 = 0", a: 7.5, hint: "12 clears both denominators.", hint2: "3(x − 10) + x = 0.", why: "3x − 30 + x = 0, so 4x = 30 and x = 7.5." },
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<p>A student solves (e − 6)/2 + e/4 = 3 like this:</p>`,
        `<div class="tbl"><table><tbody><tr><td>× 4</td><td class="mono">2(e − 6) + e = 3</td></tr><tr><td></td><td class="mono">3e − 12 = 3 → e = 5</td></tr></tbody></table></div>`,
        { t: "mcq", q: "What went wrong?", opts: [
          ["The right side wasn't multiplied by 4 too", true, "Every term on both sides gets multiplied. It should be 2(e − 6) + e = 12, so 3e = 24 and e = 8. Check: 1 + 2 = 3 ✓"],
          ["2(e − 6) should be 2e − 6", false, "2 multiplies both pieces: 2e − 12. That part was right."],
          ["You can't multiply an equation by 4", false, "You can, as long as you do it to every term on both sides."],
        ]},
      ]},
      { k: "play", title: "Two equations = two lines", b: [
        `<p>Two unknowns need two equations. Each equation, drawn as a graph, is a straight line. The answer is the <b>one point on both lines</b>.</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let c1 = 12, c2 = 4;
          function draw() {
            const x = (3 * c1 + 2 * c2) / 8, y = (2 * c1 + 4 * c2) / 8;
            f.innerHTML = plot({ x: [0, 12], y: [0, 12], xt: [0, 2, 4, 6, 8, 10, 12], yt: [0, 4, 8, 12], xl: "e₁", yl: "e₂",
              series: [{ f: (t) => (4 * t - c1) / 2, cls: "s1" }, { f: (t) => (c2 + 2 * t) / 3, cls: "s2" }],
              marks: [{ x, y, label: `(${fmt(x)}, ${fmt(y)})` }], label: "Two lines crossing at the solution" });
            ro.innerHTML = `<div class="eq"><span class="a">4e₁ − 2e₂ = ${fmt(c1)}</span><br><span style="color:var(--cool)">−2e₁ + 3e₂ = ${fmt(c2)}</span></div>`;
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(slider({ id: id + "-c1", label: "Right side of equation 1", min: 0, max: 20, step: 1, value: c1 }, (v) => { c1 = v; draw(); }).el,
            slider({ id: id + "-c2", label: "Right side of equation 2", min: 0, max: 12, step: 1, value: c2 }, (v) => { c2 = v; draw(); }).el);
          host.append(f, box, ro);
          draw();
        },
        `<p class="aside">In circuits the right-hand sides are the <b>sources</b>. Change a source and the lines slide, so the crossing point (the node voltages) moves.</p>`,
      ]},
      { k: "math", title: "Elimination", b: [
        `<p>Goal: add the equations so one unknown cancels.</p>`,
        `<div class="eq">4e₁ − 2e₂ = 12<br>−2e₁ + 3e₂ = 4</div>`,
        { t: "reveal", label: "Show the steps", html: `<div class="tbl"><table><tbody>
          <tr><td>× 2 the second equation</td><td class="mono">−4e₁ + 6e₂ = 8</td></tr>
          <tr><td>add it to the first</td><td class="mono">4e₂ = 20 → e₂ = 5</td></tr>
          <tr><td>put e₂ back in eq. 1</td><td class="mono">4e₁ − 10 = 12 → e₁ = 5.5</td></tr></tbody></table></div>` },
      ]},
      { k: "check", title: "Your turn", b: [
        `<div class="eq">x + y = 10<br>x − y = 2</div>`,
        { t: "num", q: "What is x?", a: 6, hint: "Add the two equations. y cancels.", why: "2x = 12, so x = 6." },
        { t: "num", q: "And y?", a: 4, hint: "Put x back into either equation.", why: "6 + y = 10, so y = 4. Check the other: 6 − 4 = 2 ✓" },
      ]},
      { k: "math", title: "Cramer's rule: a formula for 2 × 2", b: [
        `<div class="eq">a·x + b·y = p<br>c·x + d·y = q</div>`,
        `<div class="key">D = a·d − b·c  ·  x = (p·d − b·q)/D  ·  y = (a·q − p·c)/D</div>`,
        `<p>D is the <b>determinant</b>. The book uses this in Section 3.3 (that's Appendix D, at the end of the appendix C PDF; see also the <a href="appD-linear-equations.html">Appendix D page</a>).</p>`,
        { t: "num", q: "For 4e₁ − 2e₂ = 12 and −2e₁ + 3e₂ = 4, what is D?", a: 8, hint: "a = 4, b = −2, c = −2, d = 3. D = ad − bc.", hint2: "4·3 − (−2)(−2) = 12 − 4.", why: "D = 12 − 4 = 8. Then e₁ = (12·3 − (−2)·4)/8 = 44/8 = 5.5 ✓" },
      ]},
      { k: "why", title: "When does it fail?", b: [
        { t: "mcq", q: "If D = 0, Cramer's rule divides by zero. What does that mean for the two lines?", opts: [
          ["They're parallel (or the same line), so there's no single crossing point", true, "Parallel lines never meet: no solution. The same line twice: endless solutions. Either way there's no unique answer."],
          ["The answer is x = 0, y = 0", false, "Dividing by zero doesn't give zero. It means the formula has no answer."],
          ["You made an arithmetic slip, always", false, "Not always. Some equation pairs really are like that."],
        ]},
        `<p class="aside">Good news from the book: for networks of ordinary positive resistors the node equations always have D ≠ 0. Otherwise finite sources could produce infinite voltages, which would break energy conservation.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do two unknowns need two equations, in picture terms?", model: "One equation in two unknowns is a whole line of possible answers. A second equation is another line. Only the point where the two lines cross satisfies both, so that crossing is the solution." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "The node method", mins: 25,
    blurb: "Five steps that turn any circuit into a few KCL equations.",
    takeaway: "Node method: ground, label node voltages, write KCL at each unknown node using (difference)/R, solve, then back out any current you want.",
    steps: [
      { k: "learn", title: "The five steps", b: [
        `<div class="tbl"><table><tbody>
          <tr><td class="mono">1</td><td>Pick a <b>ground</b> node (0 V).</td></tr>
          <tr><td class="mono">2</td><td>Label every other node. A node joined to ground through a voltage source gets that source's value. The rest are unknowns e₁, e₂, …</td></tr>
          <tr><td class="mono">3</td><td>Write <b>KCL</b> at each unknown node, writing each current straight away as (node-voltage difference)/R.</td></tr>
          <tr><td class="mono">4</td><td><b>Solve</b> the equations (Part 2's math).</td></tr>
          <tr><td class="mono">5</td><td><b>Back out</b> any branch voltage or current you need.</td></tr></tbody></table></div>`,
        `<p>One equation per unknown node, instead of two per branch.</p>`,
      ]},
      { k: "predict", title: "Choosing ground", b: [
        fig(oneNodeFig({ V: "9 V", R1: "3 kΩ", R2: "6 kΩ", I: "1 mA" })),
        { t: "mcq", q: "Why is the bottom wire a good choice of ground here?", opts: [
          ["It touches the most elements and one end of the voltage source, so the top-left node is known right away (9 V)", true, "The book's advice: pick the node with the most elements, especially voltage sources. Then only one unknown is left: e."],
          ["Ground must always be drawn at the bottom", false, "Any node can be ground. The bottom is just a convenient choice here."],
          ["Because the current source points away from it", false, "Current source direction doesn't decide ground."],
        ]},
      ]},
      { k: "play", title: "Balance the node", b: [
        `<p>Guess e. The page works out the current <b>leaving</b> node e through each branch. KCL says they must add to zero. Find the e that balances.</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let e = 3;
          function draw() {
            const i1 = (e - 9) / 3, i2 = e / 6, i3 = -1, sum = i1 + i2 + i3;
            f.innerHTML = oneNodeFig({ V: "9 V", R1: "3 kΩ", R2: "6 kΩ", I: "1 mA", e: "e = " + fmt(e) + " V" });
            const ok = Math.abs(sum) < 1e-9;
            ro.innerHTML = `<div class="tbl"><table><tbody>
              <tr><td>out through R1</td><td class="mono">(e − 9)/3k = ${fmt(i1)} mA</td></tr>
              <tr><td>out through R2</td><td class="mono">e/6k = ${fmt(i2)} mA</td></tr>
              <tr><td>out through the source</td><td class="mono">−1 mA (it pushes 1 mA in)</td></tr>
              <tr><td><b>total leaving</b></td><td class="mono"><b>${fmt(sum)} mA</b></td></tr></tbody></table></div>
              <span class="verdict ${ok ? "ok" : "no"}">${ok ? "Balanced. KCL holds, so this e is the answer." : sum > 0 ? "More leaves than arrives: e is too high." : "More arrives than leaves: e is too low."}</span>`;
          }
          host.append(f, slider({ id: id + "-e", label: "Your guess for e", min: 0, max: 12, step: 0.5, value: e, show: (v) => fmt(v) + " V" }, (v) => { e = v; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "math", title: "Now do it with algebra", b: [
        `<p>Step 3 for node e (all currents leaving):</p>`,
        `<div class="eq">(e − 9)/3k + e/6k − 1 mA = 0</div>`,
        { t: "num", q: "Solve for e. (Hint: work in kΩ and mA, then multiply by 6.)", a: 8, unit: "V", hint: "Move the 1 mA to the right: (e − 9)/3 + e/6 = 1. You solved exactly this in Part 2.", why: "e = 8 V, matching the slider." },
        `<p class="aside">Dimension check: every term is a current (V/kΩ = mA). If one term isn't, there's an error.</p>`,
      ]},
      { k: "check", title: "Step 5: back out currents", b: [
        { t: "num", q: "Current through R1, flowing from the 9 V node toward e?", a: 0.3333, tol: 0.03, unit: "mA", hint: "(higher − lower)/R = (9 − 8)/3k.", why: "1/3 mA ≈ 0.333 mA flows from the source into node e." },
        { t: "num", q: "Current down through R2?", a: 1.3333, tol: 0.03, unit: "mA", hint: "e/R2.", why: "8/6 ≈ 1.33 mA. Check KCL: 0.333 in + 1 in = 1.333 out ✓" },
      ]},
      { k: "why", title: "Where did KVL go?", b: [
        { t: "mcq", q: "The node method never writes KVL. Why is that allowed?", opts: [
          ["Node voltages satisfy KVL automatically: around any loop the differences (e_a − e_b) + (e_b − e_c) + (e_c − e_a) cancel to zero", true, "Labeling each node with one value makes every loop sum zero by construction. So KVL is built in for free."],
          ["KVL doesn't apply to node voltages", false, "It applies. It's just guaranteed by the way node voltages are defined."],
          ["The method is approximate", false, "It's exact. It uses exactly the same physics as Chapter 2."],
        ]},
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        fig(oneNodeFig({ V: "9 V", R1: "3 kΩ", R2: "6 kΩ", I: "1 mA" })),
        `<p>A student writes KCL at e as:</p><div class="eq">(9 − e)/3k + e/6k − 1 mA = 0</div>`,
        { t: "mcq", q: "What's wrong?", opts: [
          ["The first term is the current INTO the node, while the second is the current OUT. The directions are mixed", true, "Pick one convention (all leaving, or all entering) and stick to it. Mixed directions give e = 12 V here, which is wrong (it should be 8 V)."],
          ["Nothing. (9 − e) and (e − 9) are the same", false, "They have opposite signs: one is the current in, the other the current out."],
          ["The current source term should be +1 mA", false, "With 'all leaving' it's −1 mA, which the student got right. The R1 term is the problem."],
        ]},
      ]},
      { k: "learn", title: "Conductance form, and linearity", b: [
        `<p>Rewrite with G = 1/R. The general answer for this circuit (book Eq. 3.8):</p>`,
        `<div class="eq">e = I/(G₁ + G₂) + V·G₁/(G₁ + G₂)</div>`,
        `<p>Look at the shape: <b>one term per source</b>, added. No source is ever multiplied by another source. That's what makes a network <b>linear</b>:</p>`,
        `<div class="key">Linear: the response to a·x₁ + b·x₂ equals a·(response to x₁) + b·(response to x₂).</div>`,
        `<p>You'll exploit this in Part 6 (superposition).</p>`,
      ]},
      { k: "check", title: "Node method on a divider", b: [
        `<p>Even a simple divider works: 12 V source, 2 kΩ on top, 4 kΩ on the bottom, output v<sub>O</sub> at the middle.</p>`,
        { t: "num", q: "Write KCL at v_O and solve. v_O = ?", a: 8, unit: "V", hint: "(v_O − 12)/2k + v_O/4k = 0. Multiply by 4.", why: "2v_O − 24 + v_O = 0, so v_O = 8 V. Same as the divider formula 12·4/6." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In one or two sentences: what does Step 3 of the node method combine into one move?", model: "It writes KCL at a node, but instead of naming branch currents it immediately writes each one as a node-voltage difference divided by a resistance. So KCL, KVL and Ohm's law all go in at once, and you get one equation per unknown node." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Two unknown nodes, and the matrix pattern", mins: 25,
    blurb: "Two KCL equations, solved together. Then reading them off by eye.",
    takeaway: "With linear resistors the node equations have a pattern: each node's own total conductance on the diagonal, minus the shared conductance off it, and the table is mirror-symmetric.",
    steps: [
      { k: "learn", title: "A circuit with two unknowns", b: [
        fig(twoNodeFig()),
        `<p>Ground is the bottom wire. The top-left node is known: 12 V. Unknowns: e₁ and e₂. So: two KCL equations.</p>`,
        `<p>KCL at e₁ (currents leaving):</p><div class="eq">(e₁ − 12)/2 + e₁/2 + (e₁ − e₂)/1 = 0</div>`,
      ]},
      { k: "predict", title: "Write node 2 yourself", b: [
        fig(twoNodeFig({ hl: ["R3", "R4"] })),
        { t: "mcq", q: "Which is KCL at e₂ (currents leaving)?", opts: [
          ["(e₂ − e₁)/1 + e₂/2 − 2 = 0", true, "Leaving through R3, leaving through R4, and the 2 A source pushes current in, so it counts as −2."],
          ["(e₁ − e₂)/1 + e₂/2 − 2 = 0", false, "The first term is the current entering through R3. With 'all leaving' it should be (e₂ − e₁)/1."],
          ["(e₂ − e₁)/1 + e₂/2 + 2 = 0", false, "The source arrow points up into node e₂, so it brings 2 A in. Leaving, that's −2."],
        ]},
      ]},
      { k: "math", title: "Tidy and solve", b: [
        `<p>Multiply each equation by 2 and collect terms:</p>`,
        `<div class="eq">4e₁ − 2e₂ = 12<br>−2e₁ + 3e₂ = 4</div>`,
        `<p>These are the two lines from Part 2!</p>`,
        { t: "num", q: "e₁ = ?", a: 5.5, unit: "V", hint: "Elimination: double the second equation and add.", why: "e₁ = 5.5 V." },
        { t: "num", q: "e₂ = ?", a: 5, unit: "V", why: "e₂ = 5 V." },
      ]},
      { k: "check", title: "Back out a current", b: [
        { t: "num", q: "Current through R3 (1 Ω), from e₁ toward e₂?", a: 0.5, unit: "A", hint: "(e₁ − e₂)/R3.", why: "(5.5 − 5)/1 = 0.5 A." },
        { t: "mcq", q: "Check KCL at e₂. Does it balance?", opts: [
          ["Yes: 0.5 A in from R3 + 2 A from the source = 2.5 A out through R4 (5 V/2 Ω)", true, "Always worth 20 seconds. If it doesn't balance, something upstream is wrong."],
          ["No, there's 0.5 A missing", false, "Add both incoming currents: 0.5 + 2 = 2.5 A, and R4 carries 5/2 = 2.5 A."],
        ]},
      ]},
      { k: "play", title: "The pattern hiding in the equations", b: [
        `<p>Write the equations with conductances (G = 1/R): G₁ = 0.5, G₂ = 0.5, G₃ = 1, G₄ = 0.5 S. Tap a row.</p>`,
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const rows = [
            { hl: ["R1", "R2", "R3"], txt: `Row for e₁: <b>(G₁ + G₂ + G₃)</b>·e₁ − <b>G₃</b>·e₂ = G₁·12 → <span class="mono">2e₁ − 1e₂ = 6</span>`, note: "The coefficient of e₁ is the sum of every conductance touching node 1 (its <b>self</b> conductance). The coefficient of e₂ is minus the conductance joining 1 and 2 (the <b>mutual</b> conductance)." },
            { hl: ["R3", "R4"], txt: `Row for e₂: −<b>G₃</b>·e₁ + <b>(G₃ + G₄)</b>·e₂ = I → <span class="mono">−1e₁ + 1.5e₂ = 2</span>`, note: "Same pattern. And the mutual term, −G₃, is the same in both rows: one resistor joins the two nodes, seen from either side." },
          ];
          function draw(k) {
            f.innerHTML = twoNodeFig({ hl: rows[k].hl });
            ro.innerHTML = `<p>${rows[k].txt}</p><p class="aside">${rows[k].note}</p><div class="eq">[ 2  −1 ] [e₁]   [6]<br>[−1  1.5] [e₂] = [2]</div>`;
          }
          host.append(toggle(["Node 1 row", "Node 2 row"], draw, 0), f, ro);
          draw(0);
        },
        `<p class="aside">This conductance table (matrix) is exactly what circuit simulators like SPICE build and solve.</p>`,
      ]},
      { k: "check", title: "Read the matrix by eye", b: [
        `<p>Same circuit, but R3 is now 2 Ω (G₃ = 0.5 S). Don't write KCL. Just read the pattern.</p>`,
        { t: "num", q: "Top-left entry (self conductance of node 1)?", a: 1.5, unit: "S", hint: "Add the conductances of every resistor touching node 1: R1, R2, R3.", why: "0.5 + 0.5 + 0.5 = 1.5 S." },
        { t: "num", q: "Off-diagonal entry (row 1, column 2)?", a: -0.5, unit: "S", hint: "Minus the conductance joining node 1 and node 2.", why: "−G₃ = −0.5 S. Row 2, column 1 is the same." },
        { t: "num", q: "Bottom-right entry?", a: 1, unit: "S", hint: "Conductances touching node 2: R3 and R4.", why: "0.5 + 0.5 = 1 S." },
      ]},
      { k: "why", title: "Why mirror-symmetric?", b: [
        { t: "mcq", q: "For resistor networks, the entry in row 1/column 2 always equals row 2/column 1. Why?", opts: [
          ["Both come from the same resistors joining nodes 1 and 2, and a resistor works the same in both directions", true, "A resistor's law doesn't care which end you call first. Dependent sources can break this symmetry, but plain resistors never do."],
          ["It's a coincidence of this circuit", false, "It's always true for linear resistors, as long as you write KCL at each labeled node."],
          ["Because the sources are equal", false, "Sources only appear on the right-hand side."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe how to write a node's equation 'by inspection' for a resistor network.", model: "Its own voltage gets multiplied by the total conductance touching that node. Each neighboring unknown node's voltage gets multiplied by minus the conductance joining them. On the other side go the source terms: known voltages times their conductances, plus any current-source current flowing in." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Floating sources and dependent sources", mins: 25,
    blurb: "Super nodes, and how to handle a source that depends on the circuit.",
    takeaway: "A floating voltage source ties two node voltages together, so draw a super node around both and write one KCL. A dependent source: treat it as known, solve, then force it to agree with its own rule.",
    steps: [
      { k: "learn", title: "A source the method can't digest", b: [
        `<p>Step 3 writes every current as (difference)/R. A voltage source has no such rule: its current can be anything. Usually that's fine, because a source tied to ground just sets a node voltage.</p>`,
        `<div class="key">A <b>floating</b> voltage source has neither terminal connected to ground, directly or through other voltage sources.</div>`,
        `<p>For a floating source you can't write its current in terms of node voltages. You need a small trick.</p>`,
      ]},
      { k: "check", title: "Floating or not?", b: [
        { t: "sort", q: "Sort each voltage source.", bins: ["Floating", "Not floating"], items: [
          ["A 5 V source with its − end on the ground wire", 1, "Directly tied to ground. Its + node is simply known: 5 V."],
          ["A 3 V source stacked on top of a grounded 5 V source", 1, "Tied to ground through another voltage source. Its top node is known: 8 V."],
          ["A 2 V source between two nodes that only have resistors to ground", 0, "Neither end reaches ground through sources. Floating."],
          ["Two sources in series between two resistor nodes, neither touching ground", 0, "A floating string. Handle it exactly like one floating source."],
        ]},
      ]},
      { k: "learn", title: "The super node", b: [
        fig(superFig({ zone: true })),
        `<ol><li>The source fixes the difference: if the bottom node is e, the top is <b>e + 2 V</b>. That's one unknown, not two.</li>
          <li>Draw a surface (the <b>super node</b>) around both nodes and the source.</li>
          <li>Write <b>one</b> KCL for everything crossing that surface. The source's mystery current stays inside and never appears.</li></ol>`,
      ]},
      { k: "check", title: "Solve the super node", b: [
        fig(superFig({ zone: true })),
        `<div class="eq">e/2 + (e + 2)/2 − 3 = 0</div>`,
        { t: "num", q: "e = ?", a: 2, unit: "V", hint: "Multiply by 2: e + e + 2 − 6 = 0.", why: "2e = 4, e = 2 V. The top node is 4 V." },
        { t: "num", q: "How much current flows up through the floating source (from e to e + 2 V)?", a: 2, unit: "A", hint: "Use KCL at the bottom node alone: 3 A arrives, some leaves down through its 2 Ω, the rest must go into the source.", why: "3 A in, e/2 = 1 A down the resistor, so 2 A goes up through the source. It then leaves through the right 2 Ω (4/2 = 2 A) ✓" },
      ]},
      { k: "learn", title: "Dependent sources: the method that always works", b: [
        `<ol><li>Pretend the dependent source is an ordinary <b>independent</b> source with some value, say I.</li>
          <li>Do the node method. Find the controlling variable in terms of I.</li>
          <li>Now enforce the source's rule. That gives one equation in I. Solve it.</li></ol>`,
        `<p>Example: a dependent source obeys I = 4i. The node method gives i = I/8 + 1 A.</p>`,
        { t: "num", q: "What is the actual I?", a: 8, unit: "A", hint: "Substitute: I = 4(I/8 + 1). Solve for I.", hint2: "I = I/2 + 4.", why: "I − I/2 = 4, so I = 8 A. Then i = 2 A. Check: 4 × 2 = 8 ✓" },
      ]},
      { k: "learn", title: "Shortcut: control written in node voltages", b: [
        fig(vccsFig),
        `<p>If the source's rule can be written with node voltages, just substitute it straight into KCL. Here i<sub>O</sub> = −G<sub>m</sub>v<sub>I</sub> (a VCCS), with G<sub>m</sub> = 3 mS. KCL at v<sub>O</sub> (currents in = currents out):</p>`,
        `<div class="eq">(v<sub>I</sub> − v<sub>O</sub>)/R<sub>P</sub> + (−G<sub>m</sub>v<sub>I</sub>) = v<sub>O</sub>/R<sub>L</sub></div>`,
        { t: "num", q: "With v_I = 1 V, R_P = R_L = 1 kΩ, G_m = 3 mS: v_O = ?", a: -1, unit: "V", hint: "Work in mA and kΩ: (1 − v_O) − 3 = v_O.", why: "−2 = 2v_O, so v_O = −1 V." },
      ]},
      { k: "why", title: "A negative output from a positive input?", b: [
        { t: "mcq", q: "Only a +1 V source drives this circuit, yet v_O = −1 V. How?", opts: [
          ["The dependent source pulls 3 mA out of the output node, more than R_P can supply, so the node is dragged below ground", true, "A dependent source is still a source. It can push or pull current, which is how amplifiers (later chapters) produce outputs the input alone couldn't."],
          ["It's an arithmetic error. Outputs can't have the opposite sign", false, "Check KCL at v_O = −1 V: 2 mA in through R_P, 3 mA pulled out by the source, 1 mA in from R_L (current flows up from ground). In = out ✓"],
          ["Resistors can supply energy", false, "Resistors only absorb. The dependent source supplies it."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the super node trick work?", model: "KCL holds for any closed surface, not just a single node. Drawing the surface around both ends of the floating source keeps the source's unknown current inside, so the one KCL equation for the surface only involves currents I can write from node voltages. The source itself supplies the second fact: the two node voltages differ by its value." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Superposition", mins: 20,
    blurb: "Solve for one source at a time, then add.",
    takeaway: "In a linear circuit, every voltage and current is the sum of what each independent source would cause on its own. To silence a voltage source, short it. To silence a current source, open it.",
    steps: [
      { k: "learn", title: "One term per source", b: [
        fig(oneNodeFig()),
        `<p>From Part 3, this circuit's node voltage is</p>`,
        `<div class="eq"><span class="a">V·R₂/(R₁+R₂)</span> + <span style="color:var(--cool)">I·R₁R₂/(R₁+R₂)</span></div>`,
        `<p>The first term only involves V. The second only involves I. So: <b>find each source's effect alone, then add</b>. That's superposition.</p>`,
      ]},
      { k: "learn", title: "How to switch a source off", b: [
        `<div class="two">
          <div class="tile"><h3>Voltage source = 0</h3><p>Zero volts whatever current flows. That's a <b>short circuit</b> (a wire).</p></div>
          <div class="tile"><h3>Current source = 0</h3><p>Zero amps whatever the voltage. That's an <b>open circuit</b> (a gap).</p></div></div>`,
        { t: "mcq", q: "Why does 'turn off a current source' mean 'remove it, leave a gap', and not 'replace it with a wire'?", opts: [
          ["A wire would let current flow through it. A source set to 0 A must carry no current at all, which is what a gap does", true, "Match the v–i rule: 0 A for any voltage is the open-circuit line."],
          ["Wires are reserved for voltage sources", false, "It's not a convention. It follows from what '0 A for any voltage' means."],
          ["It doesn't matter which you use", false, "It matters a lot: shorting a current source changes the circuit completely."],
        ]},
      ]},
      { k: "play", title: "One source at a time", b: [
        `<p>R₁ = 3 Ω, R₂ = 6 Ω. Switch the sources on and off, and change their values. Watch the two pieces of e add up.</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let V = 6, I = 1, vOn = true, iOn = true;
          function draw() {
            const eV = vOn ? (V * 6) / 9 : 0, eI = iOn ? I * 2 : 0, e = eV + eI;
            f.innerHTML = oneNodeFig({ V: fmt(V) + " V", R1: "3 Ω", R2: "6 Ω", I: fmt(I) + " A", e: "e = " + fmt(e) + " V", vOff: !vOn, iOff: !iOn });
            const W = 300, sc = W / 16;
            ro.innerHTML = `<svg class="sch" viewBox="0 0 340 50" style="max-width:340px" role="img" aria-label="Bar: the two contributions to e">
                <rect x="10" y="10" width="${(eV * sc).toFixed(1)}" height="24" style="fill:var(--accent)"/><rect x="${(10 + eV * sc).toFixed(1)}" y="10" width="${(eI * sc).toFixed(1)}" height="24" style="fill:var(--cool)"/>
                <line x1="10" y1="6" x2="10" y2="40" class="w dim"/><text x="${(14 + e * sc).toFixed(1)}" y="27" class="s">${fmt(e)} V</text></svg>` +
              readout([["from V alone", fmt(eV) + " V"], ["from I alone", fmt(eI) + " V"], ["e (sum)", fmt(e) + " V"]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(slider({ id: id + "-v", label: "V", min: 0, max: 12, step: 1, value: V, show: (x) => fmt(x) + " V" }, (x) => { V = x; draw(); }).el,
            slider({ id: id + "-i", label: "I", min: 0, max: 3, step: 0.5, value: I, show: (x) => fmt(x) + " A" }, (x) => { I = x; draw(); }).el);
          const tg = el(`<div class="row"></div>`);
          tg.append(toggle(["V on", "V off"], (k) => { vOn = k === 0; draw(); }), toggle(["I on", "I off"], (k) => { iOn = k === 0; draw(); }));
          host.append(f, tg, box, ro);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        fig(oneNodeFig({ V: "12 V", R1: "3 Ω", R2: "6 Ω", I: "0.5 A" })),
        { t: "num", q: "With I switched off (open), what is e?", a: 8, unit: "V", hint: "A plain voltage divider: 12 × 6/(3 + 6).", why: "12 × 6/9 = 8 V." },
        { t: "num", q: "With V switched off (shorted), what is e?", a: 1, unit: "V", hint: "With V shorted, R1 and R2 are in parallel across the current source. 3 ∥ 6 = 2 Ω.", why: "0.5 A × 2 Ω = 1 V." },
        { t: "num", q: "So the real e = ?", a: 9, unit: "V", why: "8 + 1 = 9 V. Check with KCL: (9 − 12)/3 + 9/6 − 0.5 = −1 + 1.5 − 0.5 = 0 ✓" },
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        { t: "mcq", q: "To find the effect of V alone, a student replaces the current source with a wire. What goes wrong?", fig: fig(oneNodeFig({ V: "12 V", R1: "3 Ω", R2: "6 Ω", I: "wire?!" })), opts: [
          ["The wire shorts node e to ground, so they'd get e = 0 for the V part instead of 8 V", true, "An off current source is an open circuit. A wire there forces e = 0 and changes the whole circuit."],
          ["Nothing. Wire or gap, the current source contributes zero", false, "The source's own contribution is zero either way, but a wire changes what V does. The gap leaves the rest of the circuit untouched."],
          ["They should have removed the voltage source instead", false, "To see V's effect, V stays. The other source gets switched off, and correctly that means a gap."],
        ]},
      ]},
      { k: "whatif", title: "Does power add up too?", b: [
        `<p>Back to V = 6 V, I = 1 A: e = 4 V from V alone, 2 V from I alone, 6 V together. R₂ = 6 Ω.</p>`,
        { t: "num", q: "Power in R₂ with both sources on?", a: 6, unit: "W", hint: "p = e²/R₂.", why: "36/6 = 6 W." },
        { t: "mcq", q: "Power with V alone is 16/6 ≈ 2.67 W. With I alone, 4/6 ≈ 0.67 W. Their sum is 3.33 W, not 6 W. Why?", opts: [
          ["Power goes as voltage squared, which isn't linear. Superposition only works for voltages and currents", true, "(4 + 2)² ≠ 4² + 2². Add the voltages first, then compute the power."],
          ["Superposition is only approximate", false, "It's exact for voltages and currents in linear circuits. Power just isn't one of them."],
          ["Some power is lost in the sources", false, "Both numbers are for R₂ alone. The issue is the square."],
        ]},
      ]},
      { k: "learn", title: "The method", b: [
        `<div class="tbl"><table><tbody>
          <tr><td class="mono">1</td><td>For each independent source, draw a subcircuit with all <b>other</b> independent sources off (V → short, I → open).</td></tr>
          <tr><td class="mono">2</td><td>Find the response in each subcircuit. These are usually easy: dividers, series and parallel.</td></tr>
          <tr><td class="mono">3</td><td><b>Add</b> the responses.</td></tr></tbody></table></div>`,
        `<p class="aside">Linear circuits only. Chapter 4's nonlinear elements break it.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does superposition work at all?", model: "In a linear circuit every node voltage comes out as a sum of terms, each term being one source times some combination of resistances. No source multiplies another. So each source's term can be found with the others set to zero, and the total is the sum of those terms." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Superposition with dependent sources, and adders", mins: 20,
    blurb: "Leave dependent sources in. Average signals. No new frequencies.",
    takeaway: "Only independent sources get switched off. Dependent sources stay in every subcircuit, because they're part of how the circuit responds, not inputs.",
    steps: [
      { k: "learn", title: "The rule", b: [
        `<div class="key">When using superposition, switch off only <b>independent</b> sources. Leave every <b>dependent</b> source in place.</div>`,
        `<p>A dependent source isn't an input. It's part of the circuit's machinery, like a resistor whose behavior depends on another variable. If its control drops to zero in a subcircuit, it switches itself off.</p>`,
      ]},
      { k: "learn", title: "The circuit", b: [
        fig(adderDepFig()),
        `<p>On the left, V₁ and V₂ meet at node v through two equal 1 kΩ resistors. On the right, a dependent current source pushes g·v (g = 5 mS) up into a 2 kΩ load. So v<sub>O</sub> = g·v·2 kΩ.</p>`,
      ]},
      { k: "check", title: "One source at a time", b: [
        fig(adderDepFig({ off2: true })),
        { t: "num", q: "V₁ alone (V₂ shorted): v = ?", a: 1, unit: "V", hint: "A divider: 2 V across two equal 1 kΩ resistors.", why: "1 V." },
        { t: "num", q: "Then v_O1 = g·v·2 kΩ = ?", a: 10, unit: "V", hint: "5 mS × 1 V = 5 mA, times 2 kΩ.", why: "5 mA × 2 kΩ = 10 V." },
        { t: "num", q: "Now V₂ alone (V₁ shorted). v_O2 = ?", a: 20, unit: "V", hint: "v = 2 V this time.", why: "v = 2 V, so 10 mA × 2 kΩ = 20 V. Total v_O = 30 V." },
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        { t: "mcq", q: "A student also switches off the dependent source in each subcircuit. What do they get?", opts: [
          ["v_O = 0 in every subcircuit, so v_O = 0 total, which is wrong", true, "The dependent source is the only thing driving the output. Remove it and the output vanishes. It has to stay."],
          ["The same 30 V", false, "Without the dependent source nothing feeds R_L."],
          ["Twice the right answer", false, "They'd get zero, because nothing drives the load."],
        ]},
      ]},
      { k: "learn", title: "The resistive adder", b: [
        `<p>Connect N sources to one node, each through the <b>same</b> resistor R, with nothing else on that node. Superposition gives each source the same weight:</p>`,
        `<div class="eq">v = (V₁ + V₂ + … + V<sub>N</sub>)/N</div>`,
        `<p>It's an averager. The book's example: mixing several microphones before one amplifier.</p>`,
        { t: "num", q: "Four inputs: 1 V, 2 V, 3 V and 6 V, each through 10 kΩ. Output = ?", a: 3, unit: "V", hint: "Average of the four.", why: "12/4 = 3 V." },
      ]},
      { k: "play", title: "Adding signals", b: [
        `<p>Two sine-wave inputs at different frequencies go into a two-input adder. The output is their average, at every instant.</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let f1 = 1, f2 = 4;
          function draw() {
            const a = (t) => Math.sin(2 * Math.PI * f1 * t), b = (t) => 0.6 * Math.sin(2 * Math.PI * f2 * t);
            f.innerHTML = plot({ x: [0, 2], y: [-1.2, 1.2], xt: [0, 0.5, 1, 1.5, 2], yt: [-1, 0, 1], xl: "time (s)", yl: "volts",
              series: [{ f: a, cls: "s5" }, { f: b, cls: "s2" }, { f: (t) => (a(t) + b(t)) / 2, cls: "s1", n: 600 }], label: "Two inputs and their average" });
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(slider({ id: id + "-f1", label: "Input 1 frequency (grey)", min: 0.5, max: 5, step: 0.5, value: f1, show: (x) => fmt(x) + " Hz" }, (x) => { f1 = x; draw(); }).el,
            slider({ id: id + "-f2", label: "Input 2 frequency (blue)", min: 0.5, max: 8, step: 0.5, value: f2, show: (x) => fmt(x) + " Hz" }, (x) => { f2 = x; draw(); }).el);
          host.append(f, box, el(`<p class="aside">Orange = output. It wiggles at f₁ and f₂ and nothing else.</p>`));
          draw();
        },
      ]},
      { k: "why", title: "No new frequencies", b: [
        { t: "mcq", q: "The book says a linear circuit's output contains only the frequencies present at its inputs. Why?", opts: [
          ["Each output term is just an input times a constant. Scaling a sine wave keeps its frequency, and adding sines doesn't create new ones", true, "New frequencies need nonlinearity (like squaring a signal). Remember this when you meet nonlinear circuits in Chapter 4."],
          ["Resistors filter out other frequencies", false, "Resistors don't filter. They just scale."],
          ["It's only true for DC", false, "It's true for any input: DC, sine, square wave or speech."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must dependent sources stay in when you use superposition?", model: "Superposition switches off the inputs one at a time. Dependent sources aren't inputs. Their value is set by the circuit itself, so they're part of how the circuit responds to each input. Removing them changes the circuit and gives wrong answers." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Thévenin: any linear box = a source + a resistor", mins: 25,
    blurb: "Two numbers describe everything a linear network does at its terminals.",
    takeaway: "Seen from two terminals, any linear network acts like one voltage source v_TH in series with one resistor R_TH. v_TH = open-circuit voltage. R_TH = resistance looking in with the independent sources switched off.",
    steps: [
      { k: "learn", title: "How many numbers describe a battery?", b: [
        `<p>A battery, a wall outlet, a phone charger: draw current and the terminal voltage sags. To predict that, do you need 100 measurements? 10?</p>`,
        `<div class="key">If the network is linear, <b>two</b> numbers are enough. Its v–i graph at the terminals is a straight line, and two numbers fix a line.</div>`,
      ]},
      { k: "play", title: "Probe the mystery box", b: [
        `<p>Attach different loads. Record a few (i, v) points. What shape do they make?</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`), g = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let RL = 6, open = false;
          const pts = [];
          function draw() {
            const v = (9 * RL) / (3 + RL), i = 9 / (3 + RL);
            f.innerHTML = boxFig(fmt(RL) + " Ω", open);
            const series = pts.length >= 2 ? [{ f: (x) => 9 - 3 * x, cls: "s5" }] : [];
            g.innerHTML = plot({ x: [0, 3.2], y: [0, 10], xt: [0, 1, 2, 3], yt: [0, 3, 6, 9], xl: "i (A)", yl: "v (V)", series,
              marks: pts.map((p) => ({ x: p[0], y: p[1], cls: "mk2", r: 5 })).concat([{ x: i, y: v, r: 7 }]), label: "Recorded terminal points" });
            ro.innerHTML = readout([["v", fmt(v) + " V"], ["i", fmt(i) + " A"], ["points", String(pts.length)]]) +
              (pts.length >= 2 ? `<p class="aside">The points fall on one straight line. Where does it hit the v axis (i = 0)? Where does it hit the i axis (v = 0)?</p>` : "");
          }
          const rec = el(`<button type="button" class="btn primary">Record this point</button>`);
          rec.addEventListener("click", () => { pts.push([9 / (3 + RL), (9 * RL) / (3 + RL)]); draw(); });
          const lid = el(`<button type="button" class="btn ghost">Peek inside the box</button>`);
          lid.addEventListener("click", () => { open = !open; lid.textContent = open ? "Close the box" : "Peek inside the box"; draw(); });
          const row = el(`<div class="row"></div>`); row.append(rec, lid);
          host.append(f, slider({ id: id + "-rl", label: "Load R_L", min: 0.5, max: 60, log: true, value: RL, show: (x) => fmt(x, 2) + " Ω" }, (x) => { RL = x; draw(); }).el, row, g, ro);
          draw();
        },
      ]},
      { k: "learn", title: "Why it's always a line", b: [
        `<p>Push a test current i<sub>test</sub> into the terminals and use superposition:</p>`,
        `<div class="two"><div class="tile"><h3>Internal sources off</h3><p>Only the test current acts. The box is just resistors: v = i<sub>test</sub>·R<sub>t</sub>.</p></div><div class="tile"><h3>Test current off</h3><p>Terminals open. You see the open-circuit voltage: v = v<sub>oc</sub>.</p></div></div>`,
        `<div class="eq">v = v<sub>oc</sub> + i<sub>test</sub>·R<sub>t</sub></div>`,
        `<p>That's exactly the v–i law of a voltage source v<sub>oc</sub> in series with R<sub>t</sub>. So the box can be replaced by:</p>`,
        fig(thevFig("v_TH", "R_TH")),
      ]},
      { k: "learn", title: "The recipe", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>v<sub>TH</sub></b></td><td>Open-circuit voltage at the terminals (nothing attached).</td></tr>
          <tr><td><b>R<sub>TH</sub></b></td><td>Switch off the internal <b>independent</b> sources (V → short, I → open), then find the resistance looking in from the terminals. Dependent sources stay.</td></tr></tbody></table></div>`,
        `<p class="aside">Sign note: the widget drew i coming <b>out</b> of the box into the load, so the line reads v = v<sub>TH</sub> − i·R<sub>TH</sub>. With the book's associated labels (i drawn <b>into</b> the box) the same line is v = v<sub>TH</sub> + i·R<sub>TH</sub>.</p>`,
      ]},
      { k: "check", title: "Find the box's Thévenin values", b: [
        fig(boxFig(null, true)),
        { t: "num", q: "v_TH = ?", a: 9, unit: "V", hint: "Nothing attached, so the 4 Ω and 12 Ω form a plain divider.", why: "12 × 12/16 = 9 V. Same as where your line hit the v axis." },
        { t: "num", q: "R_TH = ?", a: 3, unit: "Ω", hint: "Short the 12 V source. Looking in, 4 Ω and 12 Ω are now in parallel.", why: "4 ∥ 12 = 48/16 = 3 Ω." },
      ]},
      { k: "check", title: "Now use it", b: [
        fig(thevFig("9 V", "3 Ω")),
        { t: "num", q: "Attach a 6 Ω load. Current = ?", a: 1, unit: "A", hint: "One loop: 9 V across 3 + 6 Ω.", why: "9/9 = 1 A. No need to touch the original circuit." },
        { t: "num", q: "Swap in a 1.5 Ω load. Current = ?", a: 2, unit: "A", why: "9/4.5 = 2 A. This is the payoff: each new load takes one line of work." },
      ]},
      { k: "check", title: "A box with a current source", b: [
        fig(S.svg(360, 200, S.wire([60, 82], [60, 30], [200, 30]) + S.wire([60, 118], [60, 170], [300, 170]) + S.isrc(60, 100, "3 A") + S.res(150, 30, 150, 170, "4 Ω", { side: "right" }) + S.res(200, 30, 300, 30, "2 Ω") + S.dot(150, 30) + S.dot(150, 170) +
          `<circle cx="300" cy="30" r="5" class="el"/><circle cx="300" cy="170" r="5" class="el"/>` + S.t(318, 36, "+", { cls: "big" }) + S.t(318, 176, "−", { cls: "big" }), { max: 360, label: "3 A source, 4 Ω across it, 2 Ω in series to the terminals" })),
        { t: "num", q: "v_TH = ?", a: 12, unit: "V", hint: "Terminals open: no current in the 2 Ω, so all 3 A goes through the 4 Ω.", why: "3 × 4 = 12 V, and the 2 Ω drops nothing." },
        { t: "num", q: "R_TH = ?", a: 6, unit: "Ω", hint: "Open the current source. What's left in series?", why: "4 + 2 = 6 Ω." },
      ]},
      { k: "whatif", title: "Measuring a car battery", b: [
        `<p>Shorting a big battery to measure its current is dangerous. Use two safe measurements instead:</p>`,
        `<p>Open circuit: <b>12.6 V</b>. With a 2 Ω load attached: <b>12.0 V</b>.</p>`,
        { t: "num", q: "What is the battery's R_TH?", a: 0.1, unit: "Ω", hint: "With the load: i = 12.0/2 = 6 A. The missing 0.6 V is dropped inside the battery.", hint2: "R_TH = 0.6 V / 6 A.", why: "0.1 Ω. That's why a short would draw 12.6/0.1 = 126 A!" },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can R_TH be found by switching off the internal sources?", model: "By superposition the terminal voltage is the part caused by the internal sources plus the part caused by the external current. The second part is the external current times the resistance of the box with its sources off. That resistance is R_TH." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Norton, choosing a route, and the bridge", mins: 25,
    blurb: "The current-source twin, the easiest two measurements, and measuring an unknown R.",
    takeaway: "Norton = current source i_N in parallel with R_N, where R_N = R_TH and v_TH = i_N·R_TH. Find whichever two of v_oc, i_sc and R_t are easiest.",
    steps: [
      { k: "learn", title: "The Norton twin", b: [
        `<div class="two"><div>${thevFig("v_TH", "R_TH")}</div><div>${nortonFig("i_N", "R_N")}</div></div>`,
        `<div class="tbl"><table><tbody>
          <tr><td><b>i<sub>N</sub></b></td><td>Short the terminals and find the current through the short (the short-circuit current).</td></tr>
          <tr><td><b>R<sub>N</sub></b></td><td>Same as R<sub>TH</sub>: sources off, look in.</td></tr></tbody></table></div>`,
        `<div class="key">v<sub>TH</sub> = i<sub>N</sub> · R<sub>TH</sub>  (so R<sub>t</sub> = v<sub>oc</sub>/i<sub>sc</sub>)</div>`,
      ]},
      { k: "check", title: "Convert", b: [
        { t: "num", q: "The mystery box (v_TH = 9 V, R_TH = 3 Ω). Its Norton current i_N = ?", a: 3, unit: "A", hint: "i_N = v_TH / R_TH.", why: "3 A. Directly: shorting the terminals shorts the 12 Ω, so 12 V/4 Ω = 3 A ✓" },
        { t: "num", q: "A Norton source has i_N = 2 A and R_N = 5 Ω. Its v_TH = ?", a: 10, unit: "V", why: "2 × 5 = 10 V." },
      ]},
      { k: "play", title: "Same outside, different inside", b: [
        `<p>Both models of the box (9 V + 3 Ω, or 3 A ∥ 3 Ω) drive the same load. Compare what happens at the terminals and <b>inside</b>.</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let RL = 6, m = 0;
          function draw() {
            const open = RL >= 999, v = open ? 9 : (9 * RL) / (3 + RL), i = open ? 0 : 9 / (3 + RL);
            const load = open ? S.t(268, 105, "open", { a: "start", cls: "s m" }) : S.res(280, 30, 280, 170, "", {}) + S.wire([240, 30], [280, 30]) + S.wire([240, 170], [280, 170]);
            f.innerHTML = m === 0 ? thevFig("9 V", "3 Ω", load) : nortonFig("3 A", "3 Ω", load);
            const inside = m === 0 ? i * i * 3 : (v * v) / 3;
            ro.innerHTML = readout([["terminal v", fmt(v) + " V"], ["terminal i", fmt(i) + " A"], ["power burned inside", fmt(inside) + " W"]]);
          }
          host.append(toggle(["Thévenin model", "Norton model"], (k) => { m = k; draw(); }), f,
            slider({ id: id + "-rl", label: "Load (far right = open)", min: 0.5, max: 1000, log: true, value: RL, show: (x) => (x >= 999 ? "open" : fmt(x, 2) + " Ω") }, (x) => { RL = x; draw(); }).el, ro);
          draw();
        },
        { t: "mcq", q: "With the load open, the Thévenin model burns 0 W inside and the Norton model burns 27 W. Which tells the truth about the real box?", opts: [
          ["Neither, necessarily. Equivalents only promise the same v and i at the terminals. What happens inside is lost", true, "The book's closing comment: inside voltages and currents lose their identity. With nothing attached, the real box burns 9 W in its resistors (0.75 A through 4 Ω and 12 Ω), matching neither model."],
          ["The Thévenin one, because it's simpler", false, "Simplicity has nothing to do with it. Neither model knows about the inside."],
          ["The Norton one", false, "Same issue. Neither model is meant to describe the inside."],
        ]},
      ]},
      { k: "learn", title: "Pick the easiest two", b: [
        `<p>Any two of <b>v<sub>oc</sub></b>, <b>i<sub>sc</sub></b>, <b>R<sub>t</sub></b> give the third. Choose the two that the circuit makes easy.</p>`,
        fig(S.svg(400, 200, S.wire([50, 82], [50, 30], [80, 30]) + S.res(80, 30, 180, 30, "R₁ 5 Ω") + S.wire([180, 30], [340, 30]) + S.res(200, 30, 200, 170, "R₂ 20 Ω", { side: "left" }) + S.wire([280, 30], [280, 82]) + S.wire([280, 118], [280, 170]) + S.isrc(280, 100, "1 A", { side: "right" }) +
          S.wire([50, 118], [50, 170], [340, 170]) + S.vsrc(50, 100, "10 V", { side: "right" }) + S.dot(200, 30) + S.dot(280, 30) + S.dot(200, 170) + S.dot(280, 170) + `<circle cx="340" cy="30" r="5" class="el"/><circle cx="340" cy="170" r="5" class="el"/>`, { max: 400, label: "10 V through 5 Ω, 20 Ω across, plus a 1 A source into the output" })),
        { t: "num", q: "Short the terminals. i_sc = ? (Hint: the short kills the voltage across R₂.)", a: 3, unit: "A", hint: "R₂ has 0 V across it, so it carries nothing. The short gets V/R₁ plus the 1 A.", why: "10/5 + 1 = 3 A." },
        { t: "num", q: "R_t (sources off) = ?", a: 4, unit: "Ω", hint: "Short V, open I: R₁ ∥ R₂.", why: "5 ∥ 20 = 100/25 = 4 Ω." },
        { t: "num", q: "So v_oc = ?", a: 12, unit: "V", why: "i_sc × R_t = 3 × 4 = 12 V, with no messy divider-plus-source calculation." },
      ]},
      { k: "play", title: "Balance the bridge", b: [
        `<p>The bridge measures an unknown resistor R₃. Adjust the calibrated R₁ until the voltmeter between a and b reads zero.</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let R1 = 1;
          function draw() {
            const R3 = 4.7, va = (10 * R3) / (R1 + R3), vb = (10 * 2) / 3, voc = va - vb, ok = Math.abs(voc) < 0.01;
            f.innerHTML = bridgeFig({ R1: "R₁ = " + fmt(R1) + " kΩ", meter: fmt(voc, 2), hl: ok });
            ro.innerHTML = readout([["v_a", fmt(va) + " V"], ["v_b", fmt(vb) + " V"], ["meter (v_a − v_b)", fmt(voc, 2) + " V"]]) +
              `<span class="verdict ${ok ? "ok" : Math.abs(voc) < 0.3 ? "mid" : "no"}">${ok ? "Balanced: the meter reads zero. Note this R₁." : "Not balanced yet"}</span>`;
          }
          host.append(f, slider({ id: id + "-r1", label: "R₁ (calibrated)", min: 0.5, max: 6, step: 0.05, value: R1, show: (x) => fmt(x) + " kΩ" }, (x) => { R1 = x; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "check", title: "Read off the unknown", b: [
        `<p>Meter zero means v<sub>oc</sub> = 0, so the two dividers give equal fractions:</p>`,
        `<div class="eq">R₃/(R₁ + R₃) = R₄/(R₂ + R₄)  ⟺  R₃/R₁ = R₄/R₂</div>`,
        { t: "num", q: "You found balance at R₁ = 2.35 kΩ. R₂ = 1 kΩ, R₄ = 2 kΩ. R₃ = ?", a: 4.7, unit: "kΩ", hint: "R₃ = R₁ · R₄/R₂.", why: "2.35 × 2/1 = 4.7 kΩ." },
        { t: "mcq", q: "Why does the meter's own resistance not matter at balance?", opts: [
          ["At balance v_oc = 0, so the Thévenin source facing the meter is 0 V and no current flows through it, whatever its resistance", true, "Thévenin thinking: the meter faces v_oc in series with R_t. If v_oc = 0, the meter gets nothing."],
          ["Meters always have infinite resistance", false, "Real meters don't. At balance it simply doesn't matter."],
          ["Because R₂ and R₄ cancel it", false, "Balance comes from v_oc = 0, not from cancellation."],
        ]},
      ]},
      { k: "whatif", title: "Two Thévenins facing each other", b: [
        `<p>Replace the left part of a circuit by its Thévenin equivalent (3 V, 1 Ω) and the right part by its own (−1 V, 2 Ω). A 1 Ω resistor joins them.</p>`,
        fig(S.svg(460, 170, S.wire([50, 72], [50, 30], [70, 30]) + S.res(70, 30, 150, 30, "1 Ω") + S.res(150, 30, 290, 30, "1 Ω (middle)") + S.res(290, 30, 370, 30, "2 Ω") + S.wire([370, 30], [390, 30], [390, 72]) +
          S.wire([50, 108], [50, 140], [390, 140], [390, 108]) + S.vsrc(50, 90, "3 V") + S.vsrc(390, 90, "−1 V", { side: "right" }) + S.arrow(195, 54, 245, 54, "i", { ly: 72 }), { max: 460, label: "Two Thévenin equivalents joined by a 1 ohm resistor" })),
        { t: "num", q: "Current i through the middle resistor?", a: 1, unit: "A", hint: "One loop: net voltage (3 − (−1)) across total resistance (1 + 1 + 2).", why: "4 V / 4 Ω = 1 A. One whole circuit, solved by two Thévenins and one line." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "When would you reach for Thévenin or Norton instead of the node method?", model: "When I only care about one part of the circuit, like the current in one load, especially if that load will change. I replace everything else with a two-number equivalent once, and each new load is then a one-line calculation. The node method gives everything at once, but makes me redo the work for every change." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ch3", eyebrow: "Chapter 3", title: "Network Theorems",
    intro: `<p>Nine parts. Chapter 2's basic method works but drowns you in equations. Here you learn the shortcuts every engineer uses: the <b>node method</b>, <b>superposition</b>, and <b>Thévenin/Norton</b> equivalents.</p><p>Part 2 is the equation-solving math from the book's Appendix D (also its own <a href="appD-linear-equations.html">page</a>). Don't skip it if algebra feels rusty.</p><p class="aside">Arrow keys ← → move between steps. Need a refresher? <a href="02-resistive-networks.html">Chapter 2</a>.</p>`,
    after: `<p>Open the Chapter 3 PDF and go to the <b>exercises and problems</b> at the end. Many can be solved several ways. Before you start each one, decide which method fits best and why.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9],
    summary: `
      <h3>Node voltages</h3>
      <p>Pick a ground (0 V). A node voltage e is measured from ground. Branch voltage v<sub>ab</sub> = e<sub>a</sub> − e<sub>b</sub>. Resistor current a → b = (e<sub>a</sub> − e<sub>b</sub>)/R.</p>
      <h3>Solving linear equations (App. D)</h3>
      <p>Multiply every term by a common denominator. Two unknowns: elimination, or Cramer's rule:</p>
      <div class="eq">ax + by = p, cx + dy = q · D = ad − bc · x = (pd − bq)/D · y = (aq − pc)/D</div>
      <h3>Node method</h3>
      <ol><li>Choose ground (most elements, voltage sources).</li><li>Label nodes. Grounded-source nodes are known.</li><li>KCL at each unknown node, currents written as (difference)/R.</li><li>Solve.</li><li>Back out branch voltages and currents.</li></ol>
      <p>Conductance matrix: diagonal = total G at the node, off-diagonal = −(G between the nodes). Symmetric for resistor networks.</p>
      <p><b>Floating voltage source:</b> label one end e, the other e ± V; one KCL around the super node. <b>Dependent source:</b> treat as known, solve, enforce its law, or substitute its law directly if it's written in node voltages.</p>
      <p><b>Loop method</b> (book's web section): loop currents + KVL only.</p>
      <h3>Linearity and superposition</h3>
      <div class="eq">f(a·x₁ + b·x₂) = a·f(x₁) + b·f(x₂)</div>
      <p>Response = sum of responses to each independent source alone. Off: V → short, I → open. Dependent sources stay in. Works for v and i, <b>not</b> power. Equal-R adder → average. Linear circuits create no new frequencies.</p>
      <h3>Thévenin and Norton</h3>
      <div class="eq">v_TH = v_oc · R_TH = R_N = R_t (sources off) · i_N = i_sc · v_TH = i_N·R_TH</div>
      <p>Valid at the terminals only. Inside currents and voltages are lost. Measure safely: open-circuit voltage, then voltage with a known load.</p>
      <h3>Bridge</h3>
      <p>Balance (zero meter reading) when R₃/R₁ = R₄/R₂.</p>`,
  };
  Course.start(window.CHAPTER);
})();
