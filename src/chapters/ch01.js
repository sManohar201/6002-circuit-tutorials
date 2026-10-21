(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;

  /* ---------- shared drawings ---------- */
  function loopFig(right, o = {}) {
    // source on the left, something on the right, one loop
    const src = o.src || S.vsrc(70, 95, o.vlabel || "V");
    return S.svg(320, 190,
      S.wire([70, 77], [70, 30], [250, 30], [250, o.rTop || 30]) + right +
      S.wire([250, o.rBot || 160], [250, 160], [70, 160], [70, 113]) + src + (o.extra || ""), { max: 320, label: o.label });
  }
  const bulbFig = (glow) => loopFig(S.wire([250, 30], [250, 77]) + S.bulb(250, 95, glow) + S.wire([250, 113], [250, 160]), { vlabel: "1.5 V", label: "A battery connected to a lightbulb" });
  const resFig = (lab) => loopFig(S.res(250, 30, 250, 160, lab || "R"), { vlabel: "V", label: "A voltage source connected to a resistor" });

  function sineWave(cx0, cx1, y, amp, lamPx) {
    const pts = [];
    for (let x = cx0; x <= cx1; x += 2) pts.push([x, y - amp * Math.sin((2 * Math.PI * (x - cx0)) / lamPx)]);
    return `<polyline class="w hl" points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}"/>`;
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "The big idea: ignore things on purpose", mins: 20,
    blurb: "Why engineers turn a lightbulb into a single letter, R.",
    takeaway: "Lumping means describing a messy physical thing only by what happens at its terminals (V and I), and choosing not to ask about its insides.",
    steps: [
      { k: "learn", title: "How much current flows through this bulb?", b: [
        `<div class="fig">${bulbFig(0.6)}</div>`,
        `<p>The honest physics answer uses <b>Maxwell's equations</b>. You'd need the filament's exact shape, the battery's chemistry, the electric field at every point in space…</p>`,
        `<p>That's a nightmare. Engineers found a way out: <b>only ask simple questions</b>. If all you want is the current, most of those details stop mattering.</p>`,
      ]},
      { k: "predict", title: "What actually matters for the current?", b: [
        { t: "sort", q: "Sort each detail about the bulb. Does it matter for finding the current, or can we ignore it?", bins: ["Matters", "Ignore"], items: [
          ["How the bulb's V relates to its I (its resistance R = V/I)", 0, "This is the only thing that links the bulb to the current."],
          ["The color of the glass", 1, "Color has nothing to do with how charge flows through the filament."],
          ["The exact curly shape of the filament", 1, "Shape matters only through its effect on R. Once we know R, shape adds nothing."],
          ["How the wires are bent or knotted", 1, "Ideal wires carry current the same way whatever their shape."],
          ["The bulb's price", 1, "Useful when shopping, useless for current."],
        ]},
      ]},
      { k: "learn", title: "The black box", b: [
        `<div class="fig">${S.svg(320, 150,
          S.wire([30, 80], [110, 80]) + S.wire([210, 80], [290, 80]) + S.box(110, 45, 100, 70, "anything") +
          S.dot(40, 80) + S.dot(280, 80) + S.t(40, 60, "+", { cls: "big" }) + S.t(280, 60, "−", { cls: "big" }) + S.t(160, 30, "v (across)", { cls: "c" }) +
          S.arrow(55, 100, 95, 100, "") + S.t(75, 128, "i (through)", { cls: "c" }),
          { label: "A lumped element drawn as a box with two terminals" })}</div>`,
        `<p>A <b>lumped element</b> is a box with terminals. We only care about two numbers at those terminals:</p>`,
        `<ul><li><b>v</b>: the voltage <i>across</i> the two terminals</li><li><b>i</b>: the current <i>through</i> the box (in one terminal, out the other)</li></ul>`,
        `<div class="key">What happens <b>at the terminals</b> matters more than <b>how it happens inside</b>.</div>`,
        `<p>For the bulb, we define its resistance as <span class="mono">R = V / I</span>. Now the bulb is just "R". Same idea as physics treating a whole car as a single <b>point mass</b> in <span class="mono">F = ma</span>.</p>`,
      ]},
      { k: "play", title: "Twist the wires. Does anything change?", b: [
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let V = 1.5, R = 10, twist = 0;
          function wig(a) {
            const pts = [];
            for (let t = 0; t <= 1.0001; t += 0.01) pts.push([70 + 180 * t - a * 0.55 * Math.sin(2 * Math.PI * 5 * t), 30 - (a * (1 - Math.cos(2 * Math.PI * 5 * t))) / 2]);
            return pts;
          }
          function draw() {
            const I = V / R, top = wig(twist);
            const path = [[70, 77], ...top, [250, 30], [250, 160], [70, 160], [70, 113]];
            fig.innerHTML = S.svg(320, 200,
              `<g transform="translate(0,10)">` + S.wire([70, 77], [70, 30]) + `<polyline class="w" points="${top.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}"/>` +
              S.res(250, 30, 250, 160, "R") + S.wire([250, 160], [70, 160], [70, 113]) + S.vsrc(70, 95, "V") + S.flow(path, I, 0.12) + `</g>`, { max: 320 });
            ro.innerHTML = readout([["Current I = V / R", si(I, "A")], ["Wire shape", twist < 2 ? "straight" : twist < 14 ? "wavy" : "loopy"]]);
          }
          host.append(fig, ro);
          const box = el(`<div class="sliders"></div>`);
          box.append(
            slider({ id: id + "-tw", label: "Twist the top wire", min: 0, max: 30, step: 1, value: 0, show: (v) => (v < 2 ? "none" : v < 14 ? "some" : "a lot") }, (v) => { twist = v; draw(); }).el,
            slider({ id: id + "-v", label: "Battery voltage V", min: 0.5, max: 9, step: 0.5, value: 1.5, show: (v) => fmt(v) + " V" }, (v) => { V = v; draw(); }).el,
            slider({ id: id + "-r", label: "Resistance R", min: 2, max: 50, step: 1, value: 10, show: (v) => v + " Ω" }, (v) => { R = v; draw(); }).el);
          host.append(box);
          draw();
        },
        `<p class="aside">The moving dots show current. Faster dots mean more current.</p>`,
        { t: "mcq", q: "Twisting the wire changed nothing. Why is that allowed in our model?", opts: [
          ["The wires are ideal (zero resistance), and with a steady battery their shape doesn't affect the current", true, "In the lumped circuit abstraction, ideal wires just connect terminals. For a steady source, their length, shape and knots don't appear in any equation. The next step asks: what about when the current is changing?"],
          ["Current moves too fast to notice the bends", false, "Speed isn't the reason. The battery is steady, so nothing about the current is changing, and the bends have nothing to act on."],
          ["The battery secretly adjusts its voltage", false, "We assumed an ideal battery: a fixed V no matter what."],
        ]},
      ]},
      { k: "whatif", title: "What if you just flipped the switch?", b: [
        `<p>Loops in a wire do make a magnetic field. A coil of wire is exactly how you build an <b>inductor</b> (Chapter 9).</p>`,
        `<div class="key">A coil only pushes back while the current is <b>changing</b>. Once the current is steady, it acts like plain wire.</div>`,
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const V = 1.5, R = 10, I = (V / R) * 1000; // mA
          const Lof = (n) => 0.05 + 0.3 * n * n; // µH: more loops, more inductance
          let n = 6;
          function draw() {
            const L = Lof(n), tau = L / R; // µs
            const i = (t, ta) => I * (1 - Math.exp(-t / ta));
            fig.innerHTML = plot({ x: [0, 12], y: [0, 170], xt: [0, 3, 6, 9, 12], yt: [0, 50, 100, 150], xl: "time after switch-on (µs)", yl: "current (mA)",
              series: [{ f: (t) => i(t, Lof(0) / R), cls: "s5" }, { f: (t) => i(t, tau), cls: "s1" }],
              texts: [{ x: 11.8, y: 160, s: "V / R", a: "end" }],
              label: "Current after the switch closes: straight wire (dashed) vs. a wire with loops" });
            ro.innerHTML = readout([["Loops in the wire", n === 0 ? "none (straight)" : n], ["Current 1 µs after switch-on", fmt(i(1, tau), 3) + " mA"], ["Settles at V / R", fmt(I) + " mA, about " + fmt(5 * tau, 2) + " µs later"]]);
          }
          host.append(fig, slider({ id: id + "-n", label: "Loops in the wire", min: 0, max: 10, step: 1, value: n, show: (v) => String(v) }, (v) => { n = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">1.5 V battery, 10 Ω. Same final current every time. Only the <i>start</i> changes.</p>`,
        { t: "mcq", q: "Right at the instant the switch closes, how much current flows through the loopy wire?", opts: [
          ["Zero. It starts at 0 and rises", true, "At that instant the coil pushes back with the whole battery voltage, so i = (V − V_coil)/R = 0. As the current builds, the push-back shrinks, until i = V/R."],
          ["V/R straight away", false, "That's where it ends up, not where it starts. Look at the left edge of the solid curve."],
          ["More than V/R, then it settles down", false, "The coil opposes the change, so it holds the current back. It never pushes it past V/R."],
        ]},
        `<div class="key">The lumped model doesn't pretend the coil isn't there. When the magnetic effect matters, you pull it out and draw it as its own element: an <b>inductor L</b> in series with an ideal wire. The wire stays ideal.</div>`,
        `<p class="aside">Twisting a wire together with its own return wire does the opposite: equal and opposite currents, so their magnetic fields mostly cancel. That's why cables use twisted pairs.</p>`,
      ]},
      { k: "learn", title: "Abstractions stack up like a ladder", b: [
        `<p>Each rung lets you forget the rung below it. Tap a rung to see what it lets you ignore.</p>`,
        (host) => {
          const rungs = [
            ["Nature", "Raw reality: atoms, fields, everything at once."],
            ["Laws of physics (Maxwell's equations)", "Ignore individual experiments. Use a few equations instead."],
            ["Lumped circuit abstraction ← this course", "Ignore fields inside parts. Use V, I, R and simple algebra."],
            ["Digital abstraction", "Ignore exact voltages. Only ask: is it a 0 or a 1? (Chapter 5)"],
            ["Logic gates", "Ignore transistors. Think in AND, OR, NOT."],
            ["Memory, state machines, microprocessor", "Ignore gates. Think in stored values and instructions."],
            ["Programming languages", "Ignore the hardware. Write code. Build a video game."],
          ];
          const list = el(`<div class="choices"></div>`), det = el(`<div class="feedback" aria-live="polite">Tap a rung.</div>`);
          rungs.slice().reverse().forEach(([name, txt]) => {
            const b = el(`<button type="button" class="btn choice">${name}</button>`);
            b.addEventListener("click", () => { list.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); det.innerHTML = `<b>${name}:</b> ${txt}`; });
            list.appendChild(b);
          });
          host.append(list, det);
        },
        `<div class="key">This book lives on the <b>lumped circuit</b> rung. Everything later in the book stands on it.</div>`,
      ]},
      { k: "whatif", title: "Every model has an edge", b: [
        `<p>Our resistor model of the bulb tells us the current for a given voltage. It even tells us the power used.</p>`,
        { t: "mcq", q: "What can the resistor model NOT tell you?", opts: [
          ["The current when the battery is 3 V instead of 1.5 V", false, "It can: I = V / R. Just plug in."],
          ["How many hours the bulb will last before it burns out", true, "Lifetime depends on things we chose to ignore (filament wear, heat). A model is only good inside the questions it was built for."],
          ["How much power the bulb uses", false, "It can: power = V × I. You'll see this in Part 3."],
        ]},
        `<p class="aside">One more catch: a real bulb's V/I ratio isn't constant. The filament heats up and its resistance changes. We'll still use a fixed R because it answers our questions well enough.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In one or two sentences: what does it mean to 'lump' a lightbulb into a resistor, and what do we give up?", model: "We stop caring about what happens inside the bulb and describe it only by how the voltage across it relates to the current through it (R = V/I). We give up the ability to answer questions about its insides, like its temperature, color, or lifetime." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "The rules that make lumping legal", mins: 25,
    blurb: "The lumped matter discipline, and where it breaks.",
    takeaway: "Lumping only works if (1) no changing magnetic field outside parts, (2) no charge piling up inside parts, and (3) signals change slowly compared to how long waves take to cross the circuit.",
    steps: [
      { k: "learn", title: "Lumping is a deal, with three conditions", b: [
        `<p>A <b>discipline</b> is a rule you choose to follow. The <b>lumped matter discipline</b> (LMD) lists three promises. Keep them, and you get to use simple algebra instead of Maxwell's equations.</p>`,
        `<div class="two">
          <div class="tile"><h3>1 · No changing magnetism outside</h3><p>So the voltage between two terminals has <b>one</b> value.</p></div>
          <div class="tile"><h3>2 · No charge piling up inside</h3><p>So current in = current out, and the current has <b>one</b> value.</p></div>
          <div class="tile"><h3>3 · Slow compared to waves</h3><p>So the whole circuit "feels" a change at the same instant.</p></div>
        </div>`,
        `<p class="aside">The book writes rules 1 and 2 as ∂Φ<sub>B</sub>/∂t = 0 outside elements and ∂q/∂t = 0 inside them. The ∂/∂t just means "rate of change over time".</p>`,
      ]},
      { k: "play", title: "Rule 1: voltage must not depend on the path", b: [
        `<p>Voltage = the work needed to push 1 coulomb of charge from one terminal to the other. We can walk that charge along different paths outside the element.</p>`,
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict ok"></span>`);
          let on = false;
          function draw() {
            fig.innerHTML = S.svg(340, 220,
              S.wire([40, 110], [120, 110]) + S.wire([220, 110], [300, 110]) + S.box(120, 85, 100, 50, "element") + S.dot(40, 110) + S.dot(300, 110) +
              S.t(40, 140, "a") + S.t(300, 140, "b") +
              `<path class="cur" d="M40 100 C 90 10, 250 10, 300 100" style="stroke-dasharray:6 5"/>` + S.t(170, 30, "path A", { cls: "c" }) +
              `<path class="cur" d="M40 120 C 90 210, 250 210, 300 120" style="stroke-dasharray:6 5"/>` + S.t(170, 205, "path B", { cls: "c" }) +
              (on ? `<circle cx="170" cy="58" r="16" style="fill:var(--bad-soft);stroke:var(--bad);stroke-width:2"/><text x="170" y="63" text-anchor="middle" class="b big">⊗</text>` + S.t(205, 63, "changing B", { a: "start", cls: "b s" }) : ""),
              { max: 340, label: "Two paths between terminals a and b" });
            const vA = 5, vB = on ? 3.6 : 5;
            ro.innerHTML = readout([["Voltage measured along A", vA.toFixed(1) + " V"], ["Voltage measured along B", vB.toFixed(1) + " V"]]);
            vd.className = "verdict " + (on ? "no" : "ok");
            vd.textContent = on ? "Two different answers. Which one is 'the' voltage? There isn't one." : "Same answer on every path. The voltage is well defined.";
          }
          host.append(fig, toggle(["No changing magnetism", "Changing magnetism outside"], (k) => { on = k === 1; draw(); }), ro, vd);
          draw();
        },
        `<p>So we draw element boundaries so that no changing magnetic field sits outside them. Then "the voltage across the element" has a single value.</p>`,
      ]},
      { k: "play", title: "Rule 2: no charge piling up inside", b: [
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let pile = 0;
          function draw() {
            const iin = 3, iout = 3 - pile, lvl = Math.max(0, Math.min(1, 0.5 + pile / 4));
            fig.innerHTML = S.svg(340, 160,
              S.wire([20, 80], [120, 80]) + S.wire([220, 80], [320, 80]) + S.box(120, 40, 100, 80, "") +
              `<rect x="124" y="${44 + 72 * (1 - lvl)}" width="92" height="${72 * lvl}" rx="4" style="fill:var(--cool);opacity:${pile === 0 ? 0.12 : 0.35}"/>` +
              S.t(170, 85, "charge q") + S.arrow(30, 60, 100, 60, "in: " + fmt(iin) + " A", { ly: 48 }) + S.arrow(240, 60, 310, 60, "out: " + fmt(iout) + " A", { ly: 48 }) +
              S.flow([[20, 80], [120, 80]], iin, 0.4) + S.flow([[220, 80], [320, 80]], iout, 0.4),
              { max: 340, label: "Current entering and leaving an element" });
            ro.innerHTML = readout([["Charge piling up (dq/dt)", fmt(pile) + " C/s"], ["Current in", fmt(iin) + " A"], ["Current out", fmt(iout) + " A"]]);
            vd.className = "verdict " + (pile === 0 ? "ok" : "no");
            vd.textContent = pile === 0 ? "In = out. One current value: 3 A." : pile > 0 ? "More in than out: charge builds up inside, like a capacitor charging. Which is 'the' current? No single answer." : "More out than in: stored charge drains away, like a capacitor discharging. Again, no single current.";
          }
          host.append(fig, slider({ id: id + "-q", label: "Rate of charge piling up inside", min: -2, max: 2, step: 0.5, value: 0, show: (v) => fmt(v) + " C/s" }, (v) => { pile = v; draw(); }).el, ro, vd);
          draw();
        },
        `<div class="key">Think of a bathtub. If water in = water out, the level never changes. Lumped elements must be like that bathtub for <b>charge</b>.</div>`,
        `<p class="aside">Slider positive: the tub is filling. Slider negative: the tub is draining. Both break the rule.</p>`,
      ]},
      { k: "predict", title: "Where you draw the box decides", b: [
        `<p>So is a capacitor "illegal"? Is a battery? Try drawing the box in different places.</p>`,
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let mode = 0;
          function draw() {
            const I = 2, out = mode === 0 ? 0 : I;
            let inner = S.wire([20, 100], [140, 100]) + S.wire([200, 100], [320, 100]) + S.flow([[20, 100], [140, 100]], I, 0.4) + S.flow([[200, 100], [320, 100]], I, 0.4);
            inner += S.arrow(30, 70, 100, 70, "in: " + I + " A", { ly: 58 });
            if (mode < 2) {
              inner = (mode === 0 ? `<rect class="zone" x="140" y="66" width="32" height="64" rx="6"/>` : `<rect class="zone" x="128" y="62" width="84" height="72" rx="8"/>`) + inner;
              inner += S.cap(140, 100, 200, 100, "") + S.t(160, 152, "+q", { a: "end", cls: "a" }) + S.t(180, 152, "−q", { a: "start", cls: "c" });
              inner += mode === 0 ? S.t(186, 52, "0 A crosses the gap", { a: "start", cls: "b s" }) : S.arrow(240, 70, 310, 70, "out: " + out + " A", { ly: 58 });
            } else {
              inner += S.box(140, 72, 60, 56, "") + S.t(150, 102, "−", { a: "start", cls: "big" }) + S.t(190, 102, "+", { a: "end", cls: "big" }) +
                S.arrow(156, 116, 184, 116, "") + S.t(170, 150, "chemistry pushes − → +", { cls: "s" }) + S.arrow(240, 70, 310, 70, "out: " + out + " A", { ly: 58 });
            }
            fig.innerHTML = S.svg(340, 160, inner, { max: 340, label: "A box drawn around part of a circuit, with current in and out" });
            const net = mode === 0 ? "+2 C more every second" : "0, and it stays 0";
            ro.innerHTML = readout([["Current into the box", I + " A"], ["Current out of the box", out + " A"], ["Net charge inside the box", net]]);
            vd.className = "verdict " + (mode === 0 ? "no" : "ok");
            vd.textContent = ["Breaks Rule 2. Charge piles up on the one plate inside the box.", "Follows Rule 2. The + plate gains exactly what the − plate loses, so the net charge stays 0.", "Follows Rule 2. Every coulomb that leaves the + end is replaced by one arriving at the − end."][mode];
          }
          host.append(fig, toggle(["Box around one plate", "Box around the whole capacitor", "A battery"], (k) => { mode = k; draw(); }), ro, vd);
          draw();
        },
        `<div class="key">You <b>choose</b> where element boundaries go. Draw them so the rules hold. That's why it's called a <i>discipline</i>.</div>`,
        { t: "mcq", q: "A battery holds no extra charge. So when a battery goes “dead”, what has run out?", opts: [
          ["Its chemical energy: its ability to push charge around", true, "Right. A battery stores energy, not charge. “Charging” a battery really means pushing energy back into its chemistry."],
          ["Its stored charge", false, "It never had any extra. Current in = current out at every instant, so its net charge stays 0 its whole life."],
          ["Its electrons", false, "The electrons are all still there. Electrons are what get pushed, not what gets used up."],
        ]},
      ]},
      { k: "play", title: "Rule 3: news takes time to travel", b: [
        `<p>When a source changes, the change doesn't arrive everywhere at once. It travels down the wires at about light speed: <b>30 cm every nanosecond</b>.</p>`,
        `<p>Lumping assumes the whole circuit <b>agrees</b> at every instant: one voltage per node. Press play and watch the three dots: source end, middle, far end.</p>`,
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          const cases = [["Lab circuit: 10 cm at 1 kHz", 0.1, 1e3], ["Circuit board: 15 cm at 1 GHz", 0.15, 1e9], ["Circuit board: 30 cm at 1 GHz", 0.3, 1e9]];
          let ci = 0, ph = 0.1, playing = !Course.reduce && !!window.requestAnimationFrame, last = 0;
          function draw() {
            const [, len, f] = cases[ci], delay = len / 3e8, cyc = 1 / f, r = delay / cyc;
            const v = (x) => Math.sin(2 * Math.PI * (ph - x * r));
            fig.innerHTML = plot({ x: [-0.04, 1.08], y: [-1.3, 1.3], xt: [0, 0.5, 1], xtf: (x) => (x === 0 ? "source end" : x === 1 ? "far end" : "middle"), yt: [-1, 0, 1], yl: "voltage (V)",
              series: [{ f: v, cls: "s1", from: 0, to: 1 }], marks: [{ x: 0, y: v(0) }, { x: 0.5, y: v(0.5) }, { x: 1, y: v(1) }],
              label: "Voltage along the wire at one instant" });
            ro.innerHTML = readout([["Time for a change to reach the far end", si(delay, "s")], ["Time for one cycle of the source", si(cyc, "s")], ["Source end voltage", fmt(v(0), 2) + " V"], ["Middle voltage", fmt(v(0.5), 2) + " V"], ["Far end voltage", fmt(v(1), 2) + " V"]]);
            vd.className = "verdict " + (r < 0.01 ? "ok" : "no");
            vd.textContent = r < 0.01 ? "The change crosses millions of times faster than the source moves. Both ends always agree: lumping works." : (Math.abs(r - 1) < 0.01 ? "The far end is a whole cycle late, so the two ends happen to match. But look at the middle: it's the opposite. Still no single node voltage." : "The far end hears the news " + (Math.abs(r - 0.5) < 0.01 ? "half" : fmt(r, 2)) + " a cycle late. While one end is up, the other is down: no single node voltage.");
          }
          function loop(t) {
            if (!playing || !host.isConnected) { last = 0; return; }
            if (last) { ph = (ph + (t - last) / 3000) % 1; draw(); }
            last = t;
            requestAnimationFrame(loop);
          }
          const playBtn = el(`<button type="button" class="btn small"></button>`);
          const setBtn = () => (playBtn.textContent = playing ? "❚❚ Pause" : "▶ Play");
          playBtn.addEventListener("click", () => { playing = !playing && !!window.requestAnimationFrame; setBtn(); if (playing) requestAnimationFrame(loop); });
          const pre = el(`<div class="row"></div>`);
          cases.forEach(([lab], k) => {
            const b = el(`<button type="button" class="btn small" aria-pressed="${k === 0}">${lab}</button>`);
            b.addEventListener("click", () => { ci = k; pre.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw(); });
            pre.appendChild(b);
          });
          setBtn();
          const ctl = el(`<div class="row"></div>`);
          ctl.append(playBtn);
          host.append(pre, fig, ctl, vd, ro);
          draw();
          if (playing) requestAnimationFrame(loop);
        },
        `<p class="aside">Like a message passed down a long line of people. If you change the message faster than it reaches the end, the far end is still repeating an old version.</p>`,
      ]},
      { k: "predict", title: "Rule 3: is 60 Hz slow enough?", b: [
        `<p>A power grid's voltage wiggles only 60 times per second. That sounds very slow.</p>`,
        { t: "mcq", q: "Can we treat a 5000 km long power grid as a lumped circuit?", opts: [
          ["Yes. 60 Hz is a very slow signal", false, "Slow compared to what? The real test compares the circuit's size to the wavelength. Try the next step."],
          ["No. The grid is about as long as one wavelength at 60 Hz", true, "At 60 Hz the wavelength is c / f = 300,000 km/s ÷ 60 = 5000 km. The grid is one whole wave long, so different parts see different voltages at the same moment."],
          ["It depends on the voltage of the grid", false, "Voltage level doesn't matter here. Size versus wavelength does."],
        ]},
      ]},
      { k: "play", title: "Size versus wavelength", b: [
        `<p>A signal at frequency f travels as a wave with wavelength <span class="mono">λ = c / f</span>, where c ≈ 3 × 10⁸ m/s (light speed). Lumping needs the circuit to be <b>much smaller than λ</b>.</p>`,
        `<p>λ is just how far a change travels during one cycle. So "circuit much smaller than λ" says the same thing as the last step: "crossing time much shorter than one cycle". Same test, measured in distance instead of time.</p>`,
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let f = 1e3, d = 0.1;
          const fS = slider({ id: id + "-f", label: "Signal frequency f", min: 1, max: 1e10, log: true, value: 1e3, show: (v) => si(v, "Hz") }, (v) => { f = v; draw(); });
          const dS = slider({ id: id + "-d", label: "Circuit size", min: 1e-3, max: 1e7, log: true, value: 0.1, show: (v) => si(v, "m") }, (v) => { d = v; draw(); });
          function draw() {
            const lam = 3e8 / f, r = d / lam;
            const lamPx = Math.max(10, (200 * lam) / d);
            fig.innerHTML = S.svg(500, 130,
              `<rect x="150" y="20" width="200" height="90" rx="8" class="zone"/>` + S.t(250, 124, "your circuit", { cls: "a s" }) + sineWave(20, 480, 65, 30, lamPx),
              { max: 500, label: "A wave compared with the circuit size" });
            ro.innerHTML = readout([["Wavelength λ = c / f", si(lam, "m")], ["Size ÷ wavelength", fmt(r, 2)]]);
            vd.className = "verdict " + (r < 0.1 ? "ok" : r < 1 ? "mid" : "no");
            vd.textContent = r < 0.1 ? "Lumped is fine. The wave looks flat across the circuit." : r < 1 ? "Getting risky. Part of a wave fits inside." : "Lumped breaks. Whole waves fit inside the circuit.";
          }
          const pre = el(`<div class="row"></div>`);
          [["Lab circuit: 10 cm at 1 kHz", 1e3, 0.1], ["Power grid: 5000 km at 60 Hz", 60, 5e6], ["Motherboard: 30 cm at 1 GHz", 1e9, 0.3], ["Phone chip: 1 cm at 3 GHz", 3e9, 0.01]].forEach(([lab, ff, dd]) => {
            const b = el(`<button type="button" class="btn small">${lab}</button>`);
            b.addEventListener("click", () => { fS.set(ff); dS.set(dd); });
            pre.appendChild(b);
          });
          host.append(fig, vd, ro, el(`<div class="sliders"></div>`), pre);
          host.querySelector(".sliders").append(fS.el, dS.el);
          draw();
        },
        `<p class="aside">Handy facts from the book: at 1 kHz, 1 MHz and 1 GHz, circuits must be much smaller than 300 km, 300 m and 300 mm.</p>`,
      ]},
      { k: "play", title: "Why chip designers worry about this", b: [
        `<p>Waves travel about <b>30 cm per nanosecond</b> in vacuum, and about <b>15 cm/ns</b> through a chip's insulator. So crossing a 1 cm chip takes about 1/15 ns.</p>`,
        `<p>Each bar is one clock cycle. The orange part is how much of that cycle a signal spends just crossing the chip.</p>`,
        (host) => {
          const chips = [["MIPS, 1984", "1 cm, 20 MHz", 50, 1 / 15], ["Pentium II, 1998", "1 cm, 400 MHz", 2.5, 1 / 15], ["Alpha, 2001", "2.5 cm, 2 GHz", 0.5, 1 / 6], ["Pentium IV, 2004", "1 cm, 3.4 GHz", 0.29, 1 / 15]];
          const rows = chips.map(([n, spec, cyc, del]) => {
            const pct = (100 * del) / cyc;
            return `<div style="display:grid;gap:4px"><div class="row" style="justify-content:space-between"><b>${n}</b><span class="aside">${spec} · cycle ${fmt(cyc)} ns · ${fmt(pct, 2)}% spent crossing</span></div>
              <div style="height:16px;border-radius:8px;background:var(--line);overflow:hidden"><div style="height:100%;width:${Math.max(1, pct)}%;background:var(--accent)"></div></div></div>`;
          }).join("");
          host.append(el(`<div style="display:grid;gap:14px">${rows}</div>`));
        },
        { t: "mcq", q: "Modern chips run far faster still. How do they get away with it?", opts: [
          ["They keep most signals traveling only short distances each clock cycle", true, "Right. Designs (using tricks like pipelining) keep most signals local. The few wires that cross the whole chip get special wave-based (transmission-line) design."],
          ["Electricity travels faster in newer chips", false, "Wave speed is set by physics and materials. It hasn't sped up."],
          ["They ignore the problem and accept errors", false, "A chip that made random errors would be useless."],
        ]},
      ]},
      { k: "learn", title: "The same rules, for whole circuits", b: [
        `<p>A <b>circuit</b> is lumped elements joined by ideal wires. A <b>node</b> is any point where two or more element terminals connect.</p>`,
        `<ol><li>No changing magnetic flux linked with any part of the circuit.</li><li>No charge changing at any node.</li><li>Signals slow compared to wave travel across the <b>whole circuit</b>.</li></ol>`,
        `<div class="key">Rule 3 is <b>stricter</b> for circuits: a circuit is much bigger than one element, so waves take longer to cross it.</div>`,
        `<p><b>The payoff:</b> keep these rules and Maxwell's equations shrink to two simple laws, <b>KVL</b> and <b>KCL</b>. That's Chapter 2.</p>`,
        `<p class="aside">One more limit. Even when waves are no problem, at high frequency (say 100 MHz) wires and resistors pick up hidden "capacitor" and "inductor" effects. Chapter 9 adds those as new lumped elements. Chapters 1–8 assume frequencies low enough to ignore them.</p>`,
      ]},
      { k: "whatif", title: "Change one thing", b: [
        { t: "mcq", q: "You double a chip's clock frequency but keep its size the same. What happens to the lumped approximation?", opts: [
          ["It gets worse", true, "The clock cycle halves, but the time to cross the chip stays the same. Crossing now eats twice as large a share of each cycle."],
          ["It gets better", false, "Faster signals make the wave delay matter more, not less."],
          ["Nothing changes, because size didn't change", false, "Size is only half the story. The comparison is size versus wavelength, and wavelength shrinks as frequency rises."],
        ]},
        { t: "mcq", q: "Now keep the frequency and shrink the chip to half its size. Better or worse?", opts: [
          ["Better", true, "A smaller circuit is a smaller fraction of a wavelength, so it behaves more like a lumped circuit."],
          ["Worse", false, "Think about the size ÷ wavelength ratio. Which part got smaller?"],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain why a 30 cm motherboard running at 1 GHz can't be treated as a lumped circuit. Use the word 'wavelength'.", model: "At 1 GHz the wavelength is about 30 cm, the same as the board. Different parts of the board see different parts of the wave at the same moment, so there is no single voltage or current to talk about. Lumping needs the circuit to be much smaller than a wavelength." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Batteries, power and energy", mins: 25,
    blurb: "Watts, joules, amp-hours, and stacking cells.",
    takeaway: "Power is a rate (p = V × I, in watts). Energy is the total (w = p × T, in joules). A battery label in amp-hours times its voltage gives watt-hours.",
    steps: [
      { k: "math", title: "Number shortcuts: k, m, µ", b: [
        `<p>Circuits use very big and very small numbers. Prefixes save writing zeros.</p>`,
        `<div class="tbl"><table><thead><tr><th>Prefix</th><th>Symbol</th><th>Means</th><th>Example</th></tr></thead><tbody>
          <tr><td>giga</td><td class="mono">G</td><td>× 1,000,000,000</td><td>3 GHz clock</td></tr>
          <tr><td>mega</td><td class="mono">M</td><td>× 1,000,000</td><td>1 MΩ resistor</td></tr>
          <tr><td>kilo</td><td class="mono">k</td><td>× 1,000</td><td>4.7 kΩ = 4700 Ω</td></tr>
          <tr><td>milli</td><td class="mono">m</td><td>÷ 1,000</td><td>150 mA = 0.15 A</td></tr>
          <tr><td>micro</td><td class="mono">µ</td><td>÷ 1,000,000</td><td>1 µs = 0.000001 s</td></tr>
          <tr><td>nano</td><td class="mono">n</td><td>÷ 1,000,000,000</td><td>0.5 ns clock cycle</td></tr>
        </tbody></table></div>`,
        `<div class="key">Moving to a <b>bigger</b> prefix makes the number <b>smaller</b> (4700 Ω → 4.7 kΩ). The amount itself never changes.</div>`,
        { t: "num", q: "Write 0.025 A in milliamps.", a: 25, unit: "mA", hint: "1 A = 1000 mA, so multiply by 1000.", why: "0.025 × 1000 = 25 mA." },
        { t: "num", q: "Write 2,200,000 Ω in megaohms.", a: 2.2, unit: "MΩ", hint: "1 MΩ = 1,000,000 Ω, so divide by a million.", why: "2.2 MΩ." },
      ]},
      { k: "learn", title: "What a battery gives you", b: [
        `<p>A battery turns chemical energy into electrical energy. Three numbers describe it:</p>`,
        `<ul><li><b>Voltage</b>: set by its chemistry. A flashlight cell's carbon rod sits about 1.5 V above its zinc case.</li><li><b>Total stored energy</b>: how much work it can do before it's empty.</li><li><b>Internal resistance</b>: we'll pretend it's zero until Part 6.</li></ul>`,
        `<div class="fig">${S.svg(300, 120, S.wire([20, 60], [120, 60]) + `<line class="w" x1="125" y1="35" x2="125" y2="85"/><line class="w" x1="140" y1="48" x2="140" y2="72" style="stroke-width:5"/>` + S.wire([145, 60], [280, 60]) + S.t(118, 30, "+", { cls: "big" }) + S.t(150, 30, "−", { cls: "big" }) + S.t(132, 108, "1.5 V"), { max: 300, label: "Battery symbol" })}</div>`,
        `<p class="aside">The battery symbol: long line is +, short thick line is −.</p>`,
      ]},
      { k: "play", title: "Power is a rate. Energy is the total.", b: [
        `<div class="eq">p = V × I   ·   w = p × T</div>`,
        `<ul><li><b>Power p</b> in watts (W). 1 W = 1 V × 1 A.</li><li><b>Energy w</b> in joules (J). 1 J = 1 W for 1 second.</li><li>1 watt-hour (Wh) = 1 W for 1 hour = <b>3600 J</b>.</li></ul>`,
        (host, id) => {
          const ro = el(`<div></div>`), bar = el(`<div style="height:22px;border-radius:11px;background:var(--line);overflow:hidden"><div style="height:100%;width:0;background:var(--accent)"></div></div>`);
          let V = 12, I = 2, T = 60;
          function draw() {
            const p = V * I, w = p * T;
            ro.innerHTML = readout([["Power p = V × I", fmt(p) + " W"], ["Energy w = p × T", si(w, "J")], ["Same energy in Wh", fmt(w / 3600) + " Wh"]]);
            bar.firstElementChild.style.width = Math.min(100, (100 * w) / (24 * 5 * 600)) + "%";
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(
            slider({ id: id + "-v", label: "Voltage V", min: 1, max: 24, step: 1, value: 12, show: (v) => v + " V" }, (v) => { V = v; draw(); }).el,
            slider({ id: id + "-i", label: "Current I", min: 0.1, max: 5, step: 0.1, value: 2, show: (v) => fmt(v) + " A" }, (v) => { I = v; draw(); }).el,
            slider({ id: id + "-t", label: "Time T", min: 1, max: 600, step: 1, value: 60, show: (v) => v + " s" }, (v) => { T = v; draw(); }).el);
          host.append(box, ro, el(`<span class="aside">Energy delivered so far:</span>`), bar);
          draw();
        },
        `<div class="key">Car analogy: <b>power is like speed</b>, <b>energy is like distance</b>. Distance = speed × time. Energy = power × time.</div>`,
      ]},
      { k: "play", title: "Reading a battery label: amp-hours", b: [
        `<p>A car battery says <b>12 V, 50 A·h</b>. "50 amp-hours" means current × hours = 50. So 1 A for 50 hours, or 100 A for half an hour.</p>`,
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let I = 5;
          function draw() {
            const h = 50 / I;
            fig.innerHTML = plot({ x: [0, 100], y: [0, 60], xt: [0, 20, 40, 60, 80, 100], yt: [0, 10, 20, 30, 40, 50, 60], xl: "current (A)", yl: "hours it lasts", series: [{ f: (x) => 50 / x, from: 0.8, cls: "s1" }], marks: [{ x: I, y: Math.min(60, h), label: fmt(h) + " h" }], label: "Hours versus current for a 50 amp-hour battery" });
            ro.innerHTML = readout([["Current drawn", fmt(I) + " A"], ["Lasts 50 A·h ÷ I", fmt(h) + " h"], ["Total energy", "12 V × 50 A·h = 600 Wh"]]);
          }
          host.append(fig, slider({ id: id + "-i", label: "Current drawn", min: 1, max: 100, step: 1, value: 5, show: (v) => v + " A" }, (v) => { I = v; draw(); }).el, ro);
          draw();
        },
        `<p>Energy stays the same however fast you drain it: 600 Wh = 600 × 3600 = <b>2.16 million joules</b>.</p>`,
      ]},
      { k: "play", title: "Stack cells: series vs parallel", b: [
        `<p>Each cell here is 1.5 V and 2 A·h. <b>Series</b> = cells end to end (+ to −). <b>Parallel</b> = side by side, all + together.</p>`,
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let s = 2, p = 1;
          function draw() {
            let cells = "";
            const cw = 46, ch = 26;
            for (let r = 0; r < p; r++) for (let c = 0; c < s; c++) {
              const x = 20 + c * (cw + 8), y = 16 + r * (ch + 12);
              cells += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="5" style="fill:var(--accent-soft);stroke:var(--accent-ink);stroke-width:1.5"/><text x="${x + cw / 2}" y="${y + 17}" text-anchor="middle" class="s">1.5V</text>`;
            }
            const W = 40 + s * (cw + 8), H = 32 + p * (ch + 12);
            fig.innerHTML = S.svg(Math.max(200, W), H, cells, { max: Math.max(200, W), label: s + " cells in series, " + p + " strings in parallel" });
            const V = 1.5 * s, Ah = 2 * p;
            ro.innerHTML = readout([["Voltage", fmt(V) + " V"], ["Capacity", fmt(Ah) + " A·h"], ["Energy V × A·h", fmt(V * Ah) + " Wh"], ["Cells used", String(s * p)]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(
            slider({ id: id + "-s", label: "Cells in series (each row)", min: 1, max: 6, step: 1, value: 2, show: (v) => String(v) }, (v) => { s = v; draw(); }).el,
            slider({ id: id + "-p", label: "Rows in parallel", min: 1, max: 4, step: 1, value: 1, show: (v) => String(v) }, (v) => { p = v; draw(); }).el);
          host.append(fig, box, ro);
          draw();
        },
        { t: "mcq", q: "Look at the energy number while you try different layouts. What decides the total energy?", opts: [
          ["Only how many cells you use", true, "Series raises voltage, parallel raises amp-hours, but energy = V × A·h = 3 Wh per cell, whatever the layout."],
          ["Series layouts always store more", false, "Series gives more voltage, but not more energy per cell. Compare 4 in series with 2 × 2."],
          ["Parallel layouts always store more", false, "Parallel gives more amp-hours, but the voltage stays low. Energy per cell is the same."],
        ]},
      ]},
      { k: "why", title: "Why cells must match", b: [
        { t: "mcq", q: "You connect a 2 V lead-acid cell in parallel with a 1.5 V flashlight cell. What happens?", opts: [
          ["They settle at about 1.75 V and share the work", false, "Parallel means both cells are forced to the same voltage. Two ideal sources that disagree can't both be satisfied, so the real cells fight."],
          ["A huge current rushes from the 2 V cell into the 1.5 V cell and destroys it", true, "Right. The voltage difference drives a large current through the weaker cell. Cells in parallel must have nearly the same voltage."],
          ["Nothing. The 1.5 V cell just isn't used", false, "Wires join both + terminals, so there's no way to 'not use' a cell. Current will flow."],
        ]},
        `<p>The matching rule for <b>series</b> cells is different: they should have about the same <b>capacity</b> (A·h), or the weakest one runs flat first.</p>`,
      ]},
      { k: "check", title: "Your phone battery", b: [
        `<p>A phone battery is labeled <b>3.8 V, 4000 mAh</b>.</p>`,
        { t: "num", q: "How many watt-hours does it store?", a: 15.2, unit: "Wh", hint: "Turn mAh into A·h first (÷ 1000), then multiply by the voltage.", why: "4000 mAh = 4 A·h. 3.8 V × 4 A·h = 15.2 Wh." },
        { t: "num", q: "How many joules is that?", a: 54720, unit: "J", hint: "1 Wh = 3600 J.", why: "15.2 × 3600 = 54,720 J." },
        { t: "num", q: "If the phone uses 2 W on average, how many hours does a full charge last?", a: 7.6, unit: "h", hint: "Energy = power × time, so time = energy ÷ power. Same balance-scale trick as V = I × R.", why: "15.2 Wh ÷ 2 W = 7.6 hours." },
      ]},
      { k: "bug", title: "Find the mistake", b: [
        `<div class="feedback">A student writes: “A 9 V battery rated 500 mAh stores 9 × 500 = <b>4500 J</b>.”</div>`,
        { t: "mcq", q: "What went wrong?", opts: [
          ["They should have divided 9 by 500", false, "Energy really is voltage × charge capacity. The multiplication is right. Look at the units."],
          ["The units: V × mAh gives milliwatt-hours, not joules", true, "9 V × 500 mAh = 4500 mWh = 4.5 Wh. In joules that's 4.5 × 3600 = 16,200 J. Always carry units through the arithmetic."],
          ["Nothing. It's correct", false, "Check the units. Is volt × milliamp-hour really a joule?"],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between power and energy? Give an example with real numbers.", model: "Power is how fast energy is used or delivered, in watts. Energy is the total amount, in joules. For example, a 10 W lamp running for 60 seconds uses 10 × 60 = 600 J. A 20 W lamp would use the same 600 J in only 30 seconds." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Resistors from the inside", mins: 25,
    blurb: "Ohm's law, shape and size, chip resistors, open and short circuits.",
    takeaway: "R = ρl/a: longer means more resistance, thicker means less. A resistor is any element whose v and i are linked instantly, with no memory of the past.",
    steps: [
      { k: "play", title: "Ohm's law is a straight line", b: [
        `<div class="eq">v = i × R</div>`,
        `<p>Double the voltage, double the current. On a graph of current against voltage that's a straight line through zero. Its slope is <span class="mono">1/R</span>.</p>`,
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let R = 4, v = 6;
          function draw() {
            fig.innerHTML = plot({ x: [-12, 12], y: [-4, 4], xt: [-12, -8, -4, 0, 4, 8, 12], yt: [-4, -2, 0, 2, 4], xl: "v (V)", yl: "i (A)", series: [{ f: (x) => x / R, cls: "s1" }], marks: [{ x: v, y: v / R, label: fmt(v / R) + " A" }], label: "Ohm's law line" });
            ro.innerHTML = readout([["Slope = 1/R", fmt(1 / R) + " A per V"], ["At this voltage, i = v/R", fmt(v / R) + " A"]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(
            slider({ id: id + "-r", label: "Resistance R", min: 1, max: 20, step: 1, value: 4, show: (x) => x + " Ω" }, (x) => { R = x; draw(); }).el,
            slider({ id: id + "-v", label: "Voltage v", min: -12, max: 12, step: 1, value: 6, show: (x) => fmt(x) + " V" }, (x) => { v = x; draw(); }).el);
          host.append(fig, box, ro);
          draw();
        },
        { t: "mcq", q: "You make R bigger. What happens to the line?", opts: [
          ["It gets flatter", true, "Slope = 1/R. Bigger R, smaller slope: the same voltage pushes less current."],
          ["It gets steeper", false, "Move the R slider and watch. More resistance lets less current through."],
          ["It shifts up", false, "The line always passes through (0, 0): zero voltage, zero current."],
        ]},
        `<p class="aside">Real resistors follow this only over a limited range. Push them too hard and they heat up and change.</p>`,
      ]},
      { k: "predict", title: "Thin wire, thick wire", b: [
        { t: "mcq", q: "Two wires: same material, same length. Wire B is twice as wide (radius 2r) as wire A (radius r). How does B's resistance compare?", opts: [
          ["Half of A's", false, "Close, but resistance depends on cross-section area, and area grows with radius squared."],
          ["A quarter of A's", true, "Area = π r². Doubling the radius makes the area 4 times bigger, so the resistance is 4 times smaller."],
          ["The same", false, "A wider path lets current through more easily."],
          ["Twice A's", false, "Wider makes it easier for current, not harder."],
        ]},
      ]},
      { k: "play", title: "The shape of resistance", b: [
        `<div class="eq">R = ρ · l / a</div>`,
        `<ul><li><b>ρ</b> (rho) = resistivity, a property of the material, in Ω·m</li><li><b>l</b> = length</li><li><b>a</b> = cross-section area (π r² for a round wire)</li></ul>`,
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let l = 4, r = 2;
          function draw() {
            const L = 40 + l * 40, H = r * 14;
            fig.innerHTML = S.svg(420, 120,
              `<rect x="20" y="${60 - H / 2}" width="${L}" height="${H}" rx="${Math.min(8, H / 2)}" style="fill:var(--accent-soft);stroke:var(--accent-ink);stroke-width:2"/>` +
              `<ellipse cx="${20 + L}" cy="60" rx="${H / 5}" ry="${H / 2}" style="fill:var(--accent);opacity:.5"/>` +
              S.t(20 + L / 2, 112, "length " + l, { cls: "m" }), { max: 420, label: "A wire of adjustable length and radius" });
            const R = l / (r * r);
            ro.innerHTML = readout([["Length l", fmt(l)], ["Radius r", fmt(r)], ["R compared to l=1, r=1", "× " + fmt(R)]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(
            slider({ id: id + "-l", label: "Length", min: 1, max: 8, step: 1, value: 4, show: (v) => String(v) }, (v) => { l = v; draw(); }).el,
            slider({ id: id + "-r", label: "Radius", min: 1, max: 4, step: 0.5, value: 2, show: (v) => String(v) }, (v) => { r = v; draw(); }).el);
          host.append(fig, box, ro);
          draw();
        },
        `<div class="key">Hallway picture: a <b>longer</b> hallway is harder to push a crowd through. A <b>wider</b> one is easier.</div>`,
        `<p class="aside">For a box-shaped resistor (length l, width w, height h) with terminals on the w × h faces, the same rule reads R = ρ l / (w h).</p>`,
      ]},
      { k: "play", title: "Chip resistors: count the squares", b: [
        `<p>On a chip, resistors are flat layers of the same thickness. Then only <b>length ÷ width</b> matters:</p>`,
        `<div class="eq">R = (L / W) × R<sub>□</sub></div>`,
        `<p><b>R<sub>□</sub></b> ("R-square") is the resistance of <b>one square</b> of that material. Here R<sub>□</sub> = 2 kΩ.</p>`,
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let L = 6, W = 2;
          function draw() {
            const u = Math.min(30, 380 / L);
            let g = `<rect x="20" y="20" width="${L * u}" height="${W * u}" style="fill:var(--cool-soft);stroke:var(--cool);stroke-width:2"/>`;
            for (let k = W; k < L; k += W) g += `<line x1="${20 + k * u}" y1="20" x2="${20 + k * u}" y2="${20 + W * u}" style="stroke:var(--cool);stroke-dasharray:4 4"/>`;
            g += `<rect x="4" y="${20 + (W * u) / 2 - 6}" width="16" height="12" class="nd"/><rect x="${20 + L * u}" y="${20 + (W * u) / 2 - 6}" width="16" height="12" class="nd"/>`;
            fig.innerHTML = S.svg(420, 40 + W * u, g, { max: 420, label: "A flat resistor divided into squares" });
            ro.innerHTML = readout([["Squares in a row L/W", fmt(L / W)], ["R = (L/W) × 2 kΩ", si((L / W) * 2000, "Ω")]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(
            slider({ id: id + "-l", label: "Length L (µm)", min: 1, max: 12, step: 1, value: 6, show: (v) => v + " µm" }, (v) => { L = v; draw(); }).el,
            slider({ id: id + "-w", label: "Width W (µm)", min: 1, max: 6, step: 1, value: 2, show: (v) => v + " µm" }, (v) => { W = v; draw(); }).el);
          host.append(fig, box, ro);
          draw();
        },
        { t: "mcq", q: "Set L = W = 2, then L = W = 6. Both are one square, so both are 2 kΩ. Why doesn't the bigger square have more resistance?", opts: [
          ["It's longer (more R) but also wider (less R) by the same factor, so they cancel", true, "Exactly. L/W stays 1. Only the shape counts, not the size."],
          ["Bigger pieces of material always have the same resistance", false, "Not true in general: a long thin strip of the same area has much more resistance."],
          ["The thickness changes to compensate", false, "All pieces here have the same thickness. That's what makes R□ useful."],
        ]},
      ]},
      { k: "whatif", title: "Shrinking a whole chip", b: [
        `<p>Chip factories regularly "shrink" a design: every dimension gets scaled down by the same factor.</p>`,
        { t: "mcq", q: "Every length and width shrinks by 20%. What happens to the ratio between two resistors, R1 / R2?", opts: [
          ["It stays exactly the same", true, "Each resistor's L/W is unchanged, so every ratio is unchanged. Circuits designed around ratios (like the voltage divider in Chapter 2) keep working after a shrink."],
          ["Both shrink, so the ratio shrinks", false, "Both resistances scale the same way (if at all), and ratios cancel common factors."],
          ["It grows by 20%", false, "Nothing about one resistor changes relative to the other."],
        ]},
        `<p class="aside">Even if the thickness and resistivity change too, both resistors change by the same factor, so the ratio still holds.</p>`,
      ]},
      { k: "play", title: "Two extremes: short and open", b: [
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), lab = el(`<span class="verdict mid"></span>`);
          let t = 0.5;
          function draw() {
            const R = t <= 0.001 ? 0 : t >= 0.999 ? Infinity : Math.pow(10, -2 + 6 * t);
            const ser = R === 0 ? [{ pts: [[0, -5], [0, 5]], cls: "s1" }] : R === Infinity ? [{ pts: [[-10, 0], [10, 0]], cls: "s1" }] : [{ f: (x) => x / R, cls: "s1" }];
            fig.innerHTML = plot({ x: [-10, 10], y: [-5, 5], xt: [-10, -5, 0, 5, 10], yt: [-5, 0, 5], xl: "v (V)", yl: "i (A)", series: ser, label: "Line for the chosen resistance" });
            lab.textContent = R === 0 ? "R = 0: a short circuit (ideal wire). v = 0 whatever the current." : R === Infinity ? "R = ∞: an open circuit. i = 0 whatever the voltage." : "R = " + si(R, "Ω");
            lab.className = "verdict " + (R === 0 || R === Infinity ? "ok" : "mid");
          }
          host.append(fig, lab, slider({ id: id + "-t", label: "Resistance, from 0 to ∞", min: 0, max: 1, step: 0.01, value: 0.5, show: (v) => (v <= 0.001 ? "0" : v >= 0.999 ? "∞" : si(Math.pow(10, -2 + 6 * v), "Ω")) }, (v) => { t = v; draw(); }).el);
          draw();
        },
        `<div class="two"><div class="tile"><h3>Short circuit</h3><p>R → 0. No voltage across it, any current through it. Same as an ideal wire.</p></div><div class="tile"><h3>Open circuit</h3><p>R → ∞. No current through it, any voltage across it. Like a cut wire.</p></div></div>`,
        { t: "mcq", q: "How much power does a short circuit or an open circuit use up?", opts: [
          ["Zero, in both cases", true, "Power = v × i. A short has v = 0, an open has i = 0. Either way the product is 0."],
          ["Infinite power for the short", false, "A short has zero voltage across it, so v × i = 0 for the short itself, whatever the current."],
          ["It depends on the battery", false, "For the element itself, one of v or i is always zero."],
        ]},
      ]},
      { k: "predict", title: "What counts as a resistor?", b: [
        `<p>The book's broad definition: a <b>resistor</b> is any two-terminal element whose current and voltage are linked by an equation <b>at the same instant</b>. It can be linear or not, and it can change with time.</p>`,
        { t: "sort", q: "Which of these elements are resistors in that broad sense?", bins: ["Resistor", "Not a resistor"], items: [
          ["v = 5 i", 0, "Linear and constant: an ordinary resistor."],
          ["v = 2 i³", 0, "Nonlinear, but v depends only on i right now. Still a resistor."],
          ["v = i × R(t), where R changes as the part warms up", 0, "A time-varying resistor. At each instant v and i are still linked directly."],
          ["v depends on how fast i is changing", 1, "This one needs the recent past of i, so it has memory. That's an inductor (Chapter 9)."],
          ["v depends on all the current that has flowed so far", 1, "Memory again. That's a capacitor (Chapter 9)."],
        ]},
        `<div class="key">Resistor = <b>no memory</b>. Its v and i depend only on each other, right now.</div>`,
        `<p class="aside">From here on, "resistor" with no other word means linear and time-invariant: v = iR with a fixed R.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "A chip designer is told R□ = 2 kΩ. What does that tell them, and why don't they need to know how big the squares are?", model: "Any square piece of that layer, of any size, has 2 kΩ between opposite edges. A resistor's value is just (number of squares in a row) × 2 kΩ, i.e. (L/W) × R□. Size cancels because a bigger square is longer (more R) but also wider (less R) by the same amount." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  function labelFlipper(host, id) {
    // Physical truth: 6 V source (+ on top) drives 2 A clockwise through a 3 Ω resistor.
    const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<div class="feedback"></div>`);
    let who = 0, plusTop = [true, true], arrowDown = [false, true];
    function draw() {
      const lab = (x, k) => {
        const pt = plusTop[k], ad = arrowDown[k], sd = k ? 1 : -1, ax = x + sd * 56;
        return S.t(x + sd * 26, 76, pt ? "+" : "−", { cls: "big a" }) + S.t(x + sd * 26, 134, pt ? "−" : "+", { cls: "big a" }) + S.t(x + sd * 40, 106, "v", { cls: "a" }) +
          (ad ? S.arrow(ax, 72, ax, 128, "") : S.arrow(ax, 128, ax, 72, "")) + S.t(x + sd * 68, 104, "i", { cls: "c", a: k ? "start" : "end" });
      };
      fig.innerHTML = S.svg(360, 200,
        S.wire([110, 82], [110, 30], [250, 30], [250, 50]) + S.res(250, 50, 250, 150, "") + S.wire([250, 150], [250, 170], [110, 170], [110, 118]) +
        S.vsrc(110, 100, "", { cls: who === 0 ? "hl" : "" }) + S.t(110, 196, "6 V source", { cls: "s m" }) + S.t(250, 196, "3 Ω resistor", { cls: "s m" }) +
        lab(who === 0 ? 110 : 250, who) + S.flow([[110, 82], [110, 30], [250, 30], [250, 170], [110, 170], [110, 118]], 2, 0.5),
        { max: 360, label: "A 6 volt source driving a 3 ohm resistor, with your labels" });
      const k = who, physTopPlus = true;
      const v = (plusTop[k] === physTopPlus ? 1 : -1) * 6;
      const physDown = k === 1; // current flows down through the resistor, up through the source
      const i = (arrowDown[k] === physDown ? 1 : -1) * 2;
      const assoc = plusTop[k] === arrowDown[k];
      const p = v * i;
      ro.innerHTML = readout([["Your v", fmt(v) + " V"], ["Your i", fmt(i) + " A"], ["v × i", fmt(p) + " W"], ["Arrow enters +?", assoc ? "yes (associated)" : "no"]]);
      const truth = k === 0 ? "The source really <b>supplies 12 W</b>." : "The resistor really <b>absorbs 12 W</b>.";
      if (assoc) { vd.className = "feedback ok"; vd.innerHTML = `Associated labels, so p = v·i = ${fmt(p)} W is power <b>into</b> the element. ${p > 0 ? "Positive: it absorbs." : "Negative: it supplies."} ${truth}`; }
      else { vd.className = "feedback no"; vd.innerHTML = `Your arrow leaves the + terminal, so these labels break the convention. Now v·i = ${fmt(p)} W means power <b>out</b>, not in. Reading it as "power in" would get the answer backwards. ${truth}`; }
    }
    host.append(toggle(["Label the source", "Label the resistor"], (k) => { who = k; draw(); }), fig);
    const row = el(`<div class="row"></div>`);
    const b1 = el(`<button type="button" class="btn small">Flip + and −</button>`), b2 = el(`<button type="button" class="btn small">Flip the current arrow</button>`);
    b1.addEventListener("click", () => { plusTop[who] = !plusTop[who]; draw(); });
    b2.addEventListener("click", () => { arrowDown[who] = !arrowDown[who]; draw(); });
    row.append(b1, b2);
    host.append(row, ro, vd);
    draw();
  }
  const p5 = {
    id: "p5", title: "Signs that tell the truth", mins: 25,
    blurb: "The associated variables convention, and who gives or takes power.",
    takeaway: "Draw the current arrow into the + terminal. Then p = v × i is the power going into the element: positive means it absorbs energy, negative means it supplies energy.",
    steps: [
      { k: "learn", title: "Labels are your choice. Physics isn't.", b: [
        `<p>Before you know which way current really flows, you must draw a + and − for v and an arrow for i. You pick them. If you guess "wrong", the number just comes out negative.</p>`,
        `<div class="fig">${S.svg(300, 170, S.wire([150, 10], [150, 45]) + S.box(110, 45, 80, 80, "element") + S.wire([150, 125], [150, 160]) + S.t(95, 62, "+", { cls: "big a" }) + S.t(95, 122, "−", { cls: "big a" }) + S.t(80, 92, "v", { cls: "a", a: "end" }) + S.arrow(175, 12, 175, 40, "") + S.t(186, 30, "i", { cls: "c", a: "start" }), { max: 300, label: "Associated variables: current arrow enters the plus terminal" })}</div>`,
        `<div class="key"><b>Associated variables convention:</b> draw the current arrow so it flows <b>into the terminal you marked +</b>.</div>`,
        `<p>Follow that, and one formula always works:</p>`,
        `<div class="eq">p = v × i  = power <span class="a">into</span> the element</div>`,
        `<ul><li><b>p &gt; 0</b>: the element <b>absorbs</b> energy (heats up, charges, stores)</li><li><b>p &lt; 0</b>: the element <b>supplies</b> energy</li></ul>`,
      ]},
      { k: "learn", title: "A label is not a property", b: [
        `<p>A battery's "3 V" is printed on it. That's an <b>element property</b>. Your <span class="mono">v</span> is a <b>terminal variable</b>, a label you drew.</p>`,
        `<div class="two">
          <div class="tile">${S.svg(160, 130, S.wire([80, 5], [80, 47]) + S.vsrc(80, 65, "3 V", { side: "right" }) + S.wire([80, 83], [80, 125]) + S.t(40, 50, "+", { cls: "big a" }) + S.t(40, 92, "−", { cls: "big a" }) + S.t(30, 72, "v", { cls: "a" }), { max: 160 })}<p class="mono" style="text-align:center">v = +3 V</p></div>
          <div class="tile">${S.svg(160, 130, S.wire([80, 5], [80, 47]) + S.vsrc(80, 65, "3 V", { side: "right" }) + S.wire([80, 83], [80, 125]) + S.t(40, 50, "−", { cls: "big a" }) + S.t(40, 92, "+", { cls: "big a" }) + S.t(30, 72, "v", { cls: "a" }), { max: 160 })}<p class="mono" style="text-align:center">v = −3 V</p></div>
        </div>`,
        `<p>Same battery, both legal. Book habit: element values go <b>inside or next to</b> the symbol, terminal labels go <b>by the terminals</b>.</p>`,
      ]},
      { k: "play", title: "Flip the labels. Watch the truth stay put.", b: [
        `<p>Here 2 A really flows clockwise. Flip the labels on each element and watch the numbers.</p>`,
        labelFlipper,
        { t: "mcq", q: "Using associated labels on both elements, add up the power into the source and the power into the resistor. What do you get?", opts: [
          ["0 W", true, "−12 W + 12 W = 0. Everything the source supplies, the resistor absorbs. Energy is conserved. Chapter 2 uses this as a check."],
          ["24 W", false, "Check the signs: one of them is negative under the associated convention."],
          ["12 W", false, "That's one element. Add the other one, with its sign."],
        ]},
      ]},
      { k: "predict", title: "Read the sign", b: [
        { t: "mcq", q: "With associated labels, an element has v = 4 V and i = −3 A. What is it doing?", opts: [
          ["Absorbing 12 W", false, "p = v × i = 4 × (−3) = −12 W. Negative power in means…"],
          ["Supplying 12 W", true, "p = −12 W into the element means it delivers 12 W to the rest of the circuit. It acts like a source."],
          ["Can't tell without knowing what the element is", false, "The convention lets you tell from v and i alone. That's the point of it."],
        ]},
      ]},
      { k: "math", title: "Two more power formulas for resistors", b: [
        `<p>For a resistor, v = iR. Swap that into p = v × i (the balance-scale substitution trick):</p>`,
        `<div class="eq">p = (iR) × i = i²R</div>`,
        `<p>Or swap i = v/R instead:</p>`,
        `<div class="eq">p = v × (v/R) = v²/R</div>`,
        { t: "mcq", q: "Look at i²R and v²/R. What do they tell you about a resistor's power?", opts: [
          ["It's never negative, so a resistor never supplies energy", true, "Squares are never negative (and R is positive). A resistor only ever turns electrical energy into heat."],
          ["It's negative when current flows backwards", false, "i² is positive even when i is negative. The direction doesn't matter."],
          ["It can be either sign", false, "Try a negative i in i²R."],
        ]},
      ]},
      { k: "play", title: "Energy is the area under power", b: [
        `<p>If power is constant, energy = p × T: a rectangle's area. If power changes, energy is still the <b>area under the p(t) curve</b>. The book writes this as an integral:</p>`,
        `<div class="eq">w = ∫ v·i dt</div>`,
        `<p class="aside">You don't need calculus rules yet. Just read ∫ … dt as "the area under the curve".</p>`,
        (host, id) => {
          const shapes = [["Steady 2 W", (t) => 2], ["Ramp up 0→4 W", (t) => 0.4 * t], ["Burst: 5 W, then 1 W", (t) => (t < 3 ? 5 : 1)]];
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let k = 0, T = 10;
          function draw() {
            const f = shapes[k][1];
            let w = 0; const n = 400; for (let j = 0; j < n; j++) w += f(((j + 0.5) * T) / n) * (T / n);
            fig.innerHTML = plot({ x: [0, 10], y: [0, 6], xt: [0, 2, 4, 6, 8, 10], yt: [0, 2, 4, 6], xl: "t (s)", yl: "p (W)", areas: [{ f, from: 0, to: T, cls: "ar1", n: 400 }], series: [{ f, cls: "s1", n: 400 }], label: "Power over time with the area shaded" });
            ro.innerHTML = readout([["Time so far", fmt(T) + " s"], ["Energy = shaded area", fmt(w) + " J"]]);
          }
          host.append(toggle(shapes.map((s) => s[0]), (j) => { k = j; draw(); }), fig, slider({ id: id + "-t", label: "Shade up to time", min: 0.5, max: 10, step: 0.5, value: 10, show: (v) => v + " s" }, (v) => { T = v; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "check", title: "Will this resistor overheat?", b: [
        `<p>Resistors have a <b>power rating</b>: the most they can safely turn into heat.</p>`,
        { t: "num", q: "A 100 Ω resistor rated 0.25 W has 6 V across it. How much power does it absorb?", a: 0.36, unit: "W", hint: "You know v and R, not i. Which formula uses only v and R?", why: "p = v²/R = 36 / 100 = 0.36 W." },
        { t: "mcq", q: "Is that safe?", opts: [
          ["No. 0.36 W is more than its 0.25 W rating", true, "It will overheat, its resistance will drift, and it may burn. You'd need a 0.5 W part or a different design."],
          ["Yes. 0.36 is less than 1", false, "Compare with the rating, 0.25 W, not with 1."],
        ]},
      ]},
      { k: "bug", title: "Find the mistake", b: [
        `<div class="fig">${S.svg(300, 160, S.wire([150, 10], [150, 62]) + S.vsrc(150, 80, "6 V", { side: "right" }) + S.wire([150, 98], [150, 150]) + S.t(105, 66, "+", { cls: "big a" }) + S.t(105, 106, "−", { cls: "big a" }) + S.t(95, 86, "v", { cls: "a", a: "end" }) + S.arrow(70, 60, 70, 20, "") + S.t(60, 44, "i", { cls: "c", a: "end" }), { max: 300, label: "A battery with the current arrow leaving the plus terminal" })}</div>`,
        `<div class="feedback">A student measures v = 6 V and i = 2 A with the labels shown. They write: “p = v × i = +12 W. Positive, so the battery is <b>absorbing</b> 12 W.”</div>`,
        { t: "mcq", q: "What's the mistake?", opts: [
          ["The arrow leaves the + terminal, so the labels aren't associated. Here v × i is power OUT", true, "Right. With these labels, +12 W means the battery supplies 12 W. Fix: flip the arrow (then i = −2 A and p = −12 W into the battery, same conclusion)."],
          ["They should have used p = i²R", false, "That's only for resistors. A battery isn't a resistor."],
          ["Batteries always absorb power", false, "Batteries can absorb (while charging) or supply. Here it's supplying."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the book insist on the associated variables convention? What could go wrong without it?", model: "With the arrow always entering the + terminal, p = v × i always means power into the element, so its sign tells you directly whether the element absorbs or supplies energy. Without a fixed rule, the same product could mean power in or power out depending on how you drew the labels, and you could get the direction of energy flow backwards." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Ideal elements and real-world models", mins: 25,
    blurb: "Sources, wires, resistors, and how to model a real battery.",
    takeaway: "Each ideal element is a line on the v–i graph. Real parts are modeled by combining ideal ones, like a battery = ideal voltage source + small series resistor.",
    steps: [
      { k: "learn", title: "Five jobs a circuit can do", b: [
        `<p>Whether a circuit handles energy (a heater) or information (a phone), it needs ways to show five processes:</p>`,
        `<div class="tbl"><table><thead><tr><th>Job</th><th>Ideal element</th><th>When</th></tr></thead><tbody>
          <tr><td>Source of energy or information</td><td>Voltage source, current source</td><td>Now</td></tr>
          <tr><td>Flow</td><td>Ideal wire</td><td>Now</td></tr>
          <tr><td>Loss</td><td>Resistor</td><td>Now</td></tr>
          <tr><td>Control</td><td>Dependent sources, MOSFET</td><td>Ch 2, 6</td></tr>
          <tr><td>Storage</td><td>Capacitor, inductor</td><td>Ch 9</td></tr></tbody></table></div>`,
      ]},
      { k: "play", title: "Each element is a line on the v–i graph", b: [
        `<p>The <b>element law</b> is the relationship between v and i. Pick an element to see its line.</p>`,
        (host) => {
          const els = [
            ["Resistor", "v = iR", "A slanted line through zero. Slope 1/R.", [{ f: (x) => x / 4, cls: "s1" }], S.res(60, 10, 60, 110, "R")],
            ["Ideal wire", "v = 0", "Any current, never any voltage. A vertical line at v = 0.", [{ pts: [[0, -5], [0, 5]], cls: "s1" }], S.wire([60, 10], [60, 110])],
            ["Open circuit", "i = 0", "Any voltage, never any current. A horizontal line at i = 0.", [{ pts: [[-10, 0], [10, 0]], cls: "s1" }], S.wire([60, 10], [60, 45]) + S.wire([60, 75], [60, 110]) + S.dot(60, 45) + S.dot(60, 75)],
            ["Voltage source", "v = V", "Holds V whatever current flows. A vertical line at v = V (here 5 V).", [{ pts: [[5, -5], [5, 5]], cls: "s1" }], S.wire([60, 10], [60, 42]) + S.vsrc(60, 60, "V") + S.wire([60, 78], [60, 110])],
            ["Current source", "i = I", "Pushes I whatever voltage it takes. A horizontal line at i = I (here 2 A).", [{ pts: [[-10, 2], [10, 2]], cls: "s1" }], S.wire([60, 10], [60, 42]) + S.isrc(60, 60, "I") + S.wire([60, 78], [60, 110])],
          ];
          const sym = el(`<div></div>`), fig = el(`<div class="fig"></div>`), txt = el(`<div class="feedback"></div>`);
          function pick(k) {
            const [n, law, desc, ser, s] = els[k];
            sym.innerHTML = `<div class="two"><div class="tile" style="justify-items:center">${S.svg(120, 120, s, { max: 120, label: n + " symbol" })}<span class="mono">${law}</span></div><div class="tile"><h3>${n}</h3><p>${desc}</p></div></div>`;
            fig.innerHTML = plot({ x: [-10, 10], y: [-5, 5], xt: [-10, -5, 0, 5, 10], yt: [-4, -2, 0, 2, 4], xl: "v (V)", yl: "i (A)", series: ser, label: n + " v–i line" });
          }
          host.append(toggle(els.map((e) => e[0]), pick), sym, fig);
          pick(0);
        },
        `<p class="aside">Notice how the wire and the open circuit are just a resistor at R = 0 and R = ∞.</p>`,
      ]},
      { k: "learn", title: "The current source, by analogy", b: [
        `<p>A current source feels odd because you can't buy one at a shop the way you buy a battery. Two air pumps show the difference:</p>`,
        `<div class="two"><div class="tile"><h3>Tire pump ≈ voltage source</h3><p>It pushes to a set <b>pressure</b>. The harder the tire pushes back, the harder you work.</p></div><div class="tile"><h3>Vacuum cleaner ≈ current source</h3><p>Built around moving a set <b>flow</b> of air. Block the nozzle and its motor speeds up and draws less power.</p></div></div>`,
        `<p>An ideal current source keeps its current fixed at I, whatever voltage that takes. Real versions exist: constant-current supplies for arc lamps, and (later in this book) MOSFETs and op-amps.</p>`,
      ]},
      { k: "whatif", title: "Ask an ideal source the impossible", b: [
        { t: "mcq", q: "You connect an ideal wire straight across an ideal 5 V voltage source. What current flows?", fig: `<div class="fig">${S.svg(220, 140, S.wire([60, 52], [60, 20], [160, 20], [160, 120], [60, 120], [60, 88]) + S.vsrc(60, 70, "5 V"), { max: 220 })}</div>`, opts: [
          ["Infinite current", true, "The source insists v = 5 V, the wire insists v = 0, and i = v/R with R = 0 blows up. Ideal models break when we ask them for something impossible. A real battery would overheat."],
          ["0 A", false, "The wire has zero resistance, so it lets current through more easily than anything."],
          ["5 A", false, "That would need a 1 Ω resistor. The wire is 0 Ω."],
        ]},
        { t: "mcq", q: "Now an ideal 2 A current source with nothing connected (open terminals). What voltage appears?", opts: [
          ["Infinite voltage", true, "The source insists on pushing 2 A, but an open circuit allows 0 A. In theory the voltage rises without limit. It's the mirror image of the shorted voltage source."],
          ["0 V", false, "The source will raise the voltage as high as it takes to push its current."],
        ]},
      ]},
      { k: "learn", title: "Independent vs dependent sources", b: [
        `<div class="two">
          <div class="tile" style="justify-items:center">${S.svg(120, 90, S.vsrc(60, 45, ""), { max: 120 })}<h3>Independent (circle)</h3><p>Sets its value no matter what the circuit does. These are the circuit's <b>inputs</b>: power supplies, signal generators, microphones.</p></div>
          <div class="tile" style="justify-items:center">${S.svg(120, 90, S.dep(60, 45, "", { kind: "v" }), { max: 120 })}<h3>Dependent (diamond)</h3><p>Its value is <b>controlled by</b> a voltage or current somewhere else in the circuit. Chapter 2 covers these.</p></div>
        </div>`,
        `<p>One more name you'll see: <b>conductance</b> <span class="mono">G = 1/R</span>, measured in siemens (S). Then Ohm's law reads <span class="mono">i = G v</span>.</p>`,
      ]},
      { k: "play", title: "Model a real battery", b: [
        `<p>A new "6 V" battery reads 6.2 V with nothing attached, and drops to about 6.1 V when it lights a bulb. Model: <b>ideal source + small resistor in series</b>.</p>`,
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), pl = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const V = 6.2;
          let Ri = 0.3, RL = 10;
          function draw() {
            const i = V / (Ri + RL), vt = V - i * Ri;
            fig.innerHTML = S.svg(360, 190,
              `<rect x="30" y="20" width="130" height="150" rx="10" class="zone"/>` + S.t(95, 186, "inside the battery", { cls: "a s" }) +
              S.wire([70, 77], [70, 40], [110, 40]) + S.res(110, 40, 200, 40, "R = " + fmt(Ri) + " Ω", { tcls: "a", side: "below" }) + S.wire([200, 40], [280, 40], [280, 55]) + S.res(280, 55, 280, 145, "load", { side: "right" }) +
              S.wire([280, 145], [280, 160], [70, 160], [70, 113]) + S.vsrc(70, 95, "6.2 V", { side: "right" }) + S.dot(200, 40) + S.dot(200, 160) + S.t(214, 100, "vₜ", { cls: "c" }) +
              S.flow([[70, 77], [70, 40], [280, 40], [280, 160], [70, 160], [70, 113]], i, 0.6), { max: 360, label: "Battery model with a load" });
            const isc = V / Ri, lo = -Math.min(25, isc * 1.1);
            pl.innerHTML = plot({ x: [0, 7], y: [lo, 2], xt: [0, 2, 4, 6], yt: [0, Math.round(lo / 2), Math.ceil(lo)], xl: "vₜ (V)", yl: "i into + (A)", series: [{ f: (x) => (x - V) / Ri, cls: "s1" }], marks: [{ x: vt, y: -i, label: "now", dx: 10, dy: 16 }, { x: V, y: 0, cls: "mk2", label: "open-circuit V", dy: -10, a: "end", dx: -6 }], label: "Battery line on the v–i graph" });
            ro.innerHTML = readout([["Current out", si(i, "A")], ["Terminal voltage vₜ", fmt(vt, 3) + " V"], ["Lost inside: i × R", fmt(i * Ri, 2) + " V"], ["Short-circuit current V/R", si(isc, "A")]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(
            slider({ id: id + "-ri", label: "Internal resistance", min: 0.05, max: 2, step: 0.05, value: 0.3, show: (v) => fmt(v) + " Ω" }, (v) => { Ri = v; draw(); }).el,
            slider({ id: id + "-rl", label: "Load resistance", min: 0.2, max: 100, log: true, value: 10, show: (v) => si(v, "Ω") }, (v) => { RL = v; draw(); }).el);
          host.append(fig, box, ro, pl);
          draw();
        },
        `<p>The line has just two key numbers: where it crosses i = 0 (the <b>open-circuit voltage</b>) and where it crosses v = 0 (the <b>short-circuit current</b>). Chapter 3 builds a whole theorem on this.</p>`,
        `<p class="aside">Sign check: the graph uses associated labels (i into +), so a discharging battery shows negative i and the line reads vₜ = V + iR. Same physics as vₜ = V − (current out) × R.</p>`,
      ]},
      { k: "why", title: "Should we fix the model?", b: [
        `<p>Our battery model never runs down. Our wire model (ideal wire + tiny resistor) never melts, even at 1000 A.</p>`,
        { t: "mcq", q: "What's the book's attitude to these flaws?", opts: [
          ["Keep models simple. Aim for insight, and add detail only when a question needs it", true, "Computers can always run very accurate models. Hand analysis with circuits is for understanding, so simple models win."],
          ["Always use the most accurate model you can", false, "More detail costs effort and hides the main idea. The book chooses simplicity on purpose."],
          ["Models with flaws should be thrown away", false, "Every model has flaws. The skill is knowing where it stops being true."],
        ]},
        `<p class="aside">Same idea for a microphone: an ideal voltage source plus a series resistance. Connect an amplifier and a 1 mV signal might sag to 0.5 mV.</p>`,
      ]},
      { k: "play", title: "Where the resistor model stops being true", b: [
        `<p>A resistor rated p<sub>max</sub> must stay where v × i ≤ p<sub>max</sub>. On the graph that limit is a pair of curves (hyperbolas). The straight-line model is only good between them.</p>`,
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let P = 0.1, R = 100;
          function draw() {
            const vmax = Math.sqrt(P * R);
            fig.innerHTML = plot({ x: [-10, 10], y: [-100, 100], xt: [-10, -5, 0, 5, 10], yt: [-100, -50, 0, 50, 100], xl: "v (V)", yl: "i (mA)",
              series: [{ f: (x) => (1000 * P) / x, from: 0.05, to: 10, cls: "s5" }, { f: (x) => (1000 * P) / x, from: -10, to: -0.05, cls: "s5" }, { f: (x) => (1000 * x) / R, from: -10, to: -vmax, cls: "s4" }, { f: (x) => (1000 * x) / R, from: vmax, to: 10, cls: "s4" }, { f: (x) => (1000 * x) / R, from: -vmax, to: vmax, cls: "s3" }],
              label: "Resistor line inside the power limit curves" });
            ro.innerHTML = readout([["Safe up to |v| = √(p·R)", fmt(vmax) + " V"], ["Max current", si(vmax / R, "A")]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(
            slider({ id: id + "-p", label: "Power rating", min: 0.05, max: 1, step: 0.05, value: 0.1, show: (v) => fmt(v) + " W" }, (v) => { P = v; draw(); }).el,
            slider({ id: id + "-r", label: "Resistance", min: 50, max: 500, step: 10, value: 100, show: (v) => v + " Ω" }, (v) => { R = v; draw(); }).el);
          host.append(fig, box, ro);
          draw();
        },
        `<p class="aside">Green: model is good. Red dashed: the resistor overheats and its value changes. At very high frequency the measured line also turns into an ellipse (capacitor and inductor effects, Chapter 9+).</p>`,
      ]},
      { k: "learn", title: "Same math, other worlds", b: [
        `<p>Many systems have a "through" quantity and an "across" quantity, just like current and voltage. So circuit models describe them too.</p>`,
        `<div class="tbl"><table><thead><tr><th>System</th><th>Through (like current)</th><th>Across (like voltage)</th></tr></thead><tbody>
          <tr><td>Electrical</td><td>Current</td><td>Voltage</td></tr><tr><td>Mechanical</td><td>Force</td><td>Motion (velocity)</td></tr>
          <tr><td>Fluid</td><td>Flow</td><td>Pressure</td></tr><tr><td>Thermal</td><td>Heat flux</td><td>Temperature</td></tr><tr><td>Economic</td><td>Consumption</td><td>Wealth</td></tr></tbody></table></div>`,
        { t: "mcq", q: "In a circuit model of water pipes, what would a resistor stand for?", opts: [
          ["Friction in a narrow pipe, which turns pressure into lost energy", true, "Resistors model loss. Friction in a pipe needs pressure to push flow through it, like a resistor needs voltage to push current."],
          ["A water tank", false, "A tank stores water. That's storage, more like a capacitor (Chapter 9)."],
          ["A pump", false, "A pump creates pressure. That's a source."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe a real battery using only ideal elements. Name one thing your model gets wrong.", model: "An ideal voltage source in series with a small resistor. The source gives the open-circuit voltage, and the resistor explains why the terminal voltage drops when current flows. The model never runs down, though: a real battery's voltage slowly falls as it drains." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  function mulberry(seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const p7 = {
    id: "p7", title: "Signals: how circuits carry information", mins: 25,
    blurb: "Sine waves, RMS, and why digital fights noise.",
    takeaway: "A signal is information carried by a voltage or current. RMS is the DC value that heats a resistor the same way. Digital signals ignore small noise but give up precision.",
    steps: [
      { k: "learn", title: "Energy circuits and information circuits", b: [
        `<p>Circuits either move <b>energy</b> (a bulb, a power supply) or <b>information</b> (a radio, a computer). Either way, the thing that matters rides on a voltage or current: a <b>signal</b>.</p>`,
        { t: "sort", q: "Native or non-native? Native = the electrical quantity is the thing itself. Non-native = the voltage stands for something else.", bins: ["Native", "Non-native"], items: [
          ["The current through a lightbulb, when you care about light and power", 0, "The circuit's own current is what you care about."],
          ["A microphone's voltage that copies sound pressure", 1, "The voltage stands for air pressure. It's a stand-in."],
          ["A voltage that means TRUE (1) or FALSE (0)", 0, "The book calls 0/1 a native representation for logic."],
          ["A sequence of 0s and 1s that encodes the number 200", 1, "The bits stand for a number. That's an encoding."],
        ]},
      ]},
      { k: "play", title: "Build a sine wave", b: [
        `<div class="eq">v = A sin(ωt + φ)</div>`,
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let A = 6, f = 500, ph = 0;
          function draw() {
            const w = 2 * Math.PI * f, phr = (ph * Math.PI) / 180;
            fig.innerHTML = plot({ x: [0, 4], y: [-11, 11], xt: [0, 1, 2, 3, 4], yt: [-10, -5, 0, 5, 10], xl: "t (ms)", yl: "v (V)", series: [{ f: (t) => A * Math.sin(w * t * 1e-3 + phr), cls: "s1", n: 600 }], label: "A sine wave" });
            ro.innerHTML = readout([["Amplitude A", fmt(A) + " V"], ["Peak-to-peak 2A", fmt(2 * A) + " V"], ["Period T = 1/f", si(1 / f, "s")], ["ω = 2πf", fmt(w, 4) + " rad/s"], ["Phase φ", ph + "° = " + fmt(phr, 3) + " rad"]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(
            slider({ id: id + "-a", label: "Amplitude A", min: 1, max: 10, step: 0.5, value: 6, show: (v) => fmt(v) + " V" }, (v) => { A = v; draw(); }).el,
            slider({ id: id + "-f", label: "Frequency f", min: 250, max: 2000, step: 50, value: 500, show: (v) => v + " Hz" }, (v) => { f = v; draw(); }).el,
            slider({ id: id + "-p", label: "Phase φ", min: -180, max: 180, step: 15, value: 0, show: (v) => v + "°" }, (v) => { ph = v; draw(); }).el);
          host.append(fig, box, ro);
          draw();
        },
        `<p class="aside"><b>Math boost:</b> angles come in degrees or radians. A full circle is 360° = 2π rad, so 180° = π rad and 45° = π/4 rad. ω counts radians per second, so ω = 2π × f.</p>`,
      ]},
      { k: "play", title: "Square waves, offset, and carrying information", b: [
        (host, id) => {
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let off = 5;
          function draw() {
            const sq = (t) => off + (t % 1 < 0.5 ? 5 : -5);
            fig.innerHTML = plot({ x: [0, 2], y: [-11, 11], xt: [0, 0.5, 1, 1.5, 2], yt: [-10, -5, 0, 5, 10], xl: "t (µs)", yl: "v (V)", series: [{ f: sq, cls: "s1", n: 800 }, { f: () => off, cls: "s5" }], label: "Square wave with an offset" });
            ro.innerHTML = readout([["Peak-to-peak", "10 V"], ["Average (DC offset)", fmt(off) + " V"], ["Swings between", fmt(off - 5) + " and " + fmt(off + 5) + " V"]]);
          }
          host.append(fig, slider({ id: id + "-o", label: "DC offset", min: -5, max: 5, step: 1, value: 5, show: (v) => fmt(v) + " V" }, (v) => { off = v; draw(); }).el, ro);
          draw();
        },
        `<p>Information can ride in different features of a wave:</p>`,
        `<div class="two"><div class="tile"><h3>In the amplitude</h3>${plot({ w: 300, h: 150, x: [0, 10], y: [-1.2, 1.2], series: [{ f: (t) => (0.55 + 0.4 * Math.sin(t * 0.6)) * Math.sin(t * 9), cls: "s2", n: 600 }], label: "Amplitude carries information" })}</div>
          <div class="tile"><h3>In the frequency</h3>${plot({ w: 300, h: 150, x: [0, 10], y: [-1.2, 1.2], series: [{ f: (t) => Math.sin(t * 6 + 5 * Math.sin(t * 0.5)), cls: "s3", n: 600 }], label: "Frequency carries information" })}</div></div>`,
      ]},
      { k: "predict", title: "Which heater gets hotter?", b: [
        { t: "mcq", q: "Heater X runs on 10 V DC. Heater Y (identical) runs on a sine wave with a 10 V peak. Which gets hotter?", opts: [
          ["X, the DC one", true, "The sine only touches 10 V for an instant and spends much of its time near 0 V. On average it delivers half the power."],
          ["Y, the sine wave one", false, "The sine never goes above 10 V, and is usually below it."],
          ["Same, since both reach 10 V", false, "Heating depends on the average power, not the peak."],
        ]},
      ]},
      { k: "play", title: "RMS: the fair DC comparison", b: [
        `<p>Power into a resistor is v²/R. So compare the <b>average of v²</b>. The <b>RMS</b> (root-mean-square) value is the DC voltage that gives the same average power:</p>`,
        `<div class="eq">v<sub>rms</sub> = √(average of v²)  ·  for a sine: A/√2</div>`,
        (host, id) => {
          const f1 = el(`<div class="fig"></div>`), f2 = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let A = 10;
          function draw() {
            const r = A / Math.SQRT2;
            f1.innerHTML = plot({ h: 200, x: [0, 2], y: [-11, 11], xt: [0, 1, 2], yt: [-10, 0, 10], xl: "t", yl: "v (V)", series: [{ f: (t) => A * Math.sin(2 * Math.PI * t), cls: "s2" }, { f: () => r, cls: "s5" }], label: "Sine voltage and its RMS level" });
            f2.innerHTML = plot({ h: 200, x: [0, 2], y: [0, 110], xt: [0, 1, 2], yt: [0, 50, 100], xl: "t", yl: "v² (V²)", areas: [{ f: (t) => Math.pow(A * Math.sin(2 * Math.PI * t), 2), cls: "ar2" }], series: [{ f: (t) => Math.pow(A * Math.sin(2 * Math.PI * t), 2), cls: "s2" }, { f: () => (A * A) / 2, cls: "s1" }], label: "v squared with its average" });
            ro.innerHTML = readout([["Peak A", fmt(A) + " V"], ["Average of v²", fmt((A * A) / 2) + " V²"], ["v_rms = A/√2", fmt(r) + " V"]]);
          }
          host.append(f1, el(`<p class="aside">Below: v². The orange line is its average. The hills above the line exactly fill the dips below it.</p>`), f2, slider({ id: id + "-a", label: "Peak A", min: 1, max: 10, step: 0.5, value: 10, show: (v) => fmt(v) + " V" }, (v) => { A = v; draw(); }).el, ro);
          draw();
        },
        `<div class="key">Average power into R from a sine = <b>v<sub>rms</sub>² / R</b>, exactly like a DC voltage of value v<sub>rms</sub>.</div>`,
      ]},
      { k: "check", title: "Wall sockets are rated in RMS", b: [
        `<p>Wall voltage is quoted as RMS. In the US that's 120 V rms, so the actual peak is 120 × √2 ≈ 170 V.</p>`,
        { t: "num", q: "In India and Europe, sockets are 230 V rms. What's the peak voltage?", a: 325, unit: "V", tol: 0.01, hint: "Peak = rms × √2 (√2 ≈ 1.414).", why: "230 × 1.414 ≈ 325 V." },
        { t: "num", q: "A 50 Ω heater runs on that 230 V rms supply. What's its average power?", a: 1058, unit: "W", tol: 0.01, hint: "Use v_rms² / R.", why: "230² / 50 = 52,900 / 50 = 1058 W." },
      ]},
      { k: "play", title: "Digital: noise you can ignore", b: [
        `<p>Split voltage into two levels: below 2.5 V means <b>0</b>, above means <b>1</b>. Send 0 as 1.25 V and 1 as 3.75 V. Then turn up the noise.</p>`,
        (host, id) => {
          const bits = [1, 0, 1, 1, 0, 0, 1, 0];
          const toward = [-0.97, 0.62, -0.4, -0.88, 0.75, 0.3, -0.55, 0.93];
          const rnd = mulberry(7), spb = 40, noiseArr = [];
          for (let k = 0; k < bits.length * spb; k++) noiseArr.push(rnd() * 2 - 1);
          bits.forEach((b, k) => (noiseArr[k * spb + spb / 2] = toward[k]));
          const fig = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let N = 0.3;
          function draw() {
            const pts = noiseArr.map((n, k) => [k / spb, (bits[Math.floor(k / spb)] ? 3.75 : 1.25) + N * n]);
            const marks = [], got = [];
            bits.forEach((b, k) => {
              const v = (b ? 3.75 : 1.25) + N * toward[k], r = v > 2.5 ? 1 : 0;
              got.push(r);
              marks.push({ x: k + 0.5, y: v, cls: r === b ? "mk2" : "mkb" });
            });
            fig.innerHTML = plot({ x: [0, 8], y: [-1.5, 6.5], xt: [0, 1, 2, 3, 4, 5, 6, 7, 8], yt: [0, 1.25, 2.5, 3.75, 5], ytf: (v) => fmt(v), xl: "bit slot", yl: "v (V)", series: [{ pts, cls: "s1" }, { f: () => 2.5, cls: "s4" }], marks, label: "Noisy digital signal and threshold" });
            const errs = got.filter((g, k) => g !== bits[k]).length;
            ro.innerHTML = readout([["Sent", bits.join("")], ["Read", got.map((g, k) => (g === bits[k] ? g : `<span style="color:var(--bad)">${g}</span>`)).join("")], ["Bit errors", String(errs)], ["Noise amplitude", "± " + fmt(N) + " V"]]);
          }
          host.append(fig, slider({ id: id + "-n", label: "Noise amplitude", min: 0, max: 2.5, step: 0.05, value: 0.3, show: (v) => "± " + fmt(v) + " V" }, (v) => { N = v; draw(); }).el, ro);
          draw();
        },
        { t: "mcq", q: "Up to about what noise level are the bits always read correctly?", opts: [
          ["± 1.25 V", true, "Each level sits 1.25 V away from the 2.5 V threshold. Noise smaller than that can't push a level across, so it's ignored completely."],
          ["± 2.5 V", false, "Watch the slider: errors start well before that. The margin is the distance from a level to the threshold."],
          ["Any noise causes errors", false, "Try small noise values. The bits come through perfectly."],
        ]},
        `<p class="aside">The cost: precision. Two levels can't tell 3.6 V from 3.9 V. Chapter 5 gets precision back by using many bits (8 bits give 256 levels).</p>`,
      ]},
      { k: "why", title: "Why only two levels?", b: [
        { t: "mcq", q: "Digital systems could use 4 or 10 voltage levels on a wire. Why do almost all of them use 2?", opts: [
          ["Systems with more than two levels are much harder to build reliably", true, "That's the book's reason. Squeezing in more levels also shrinks the gap between levels, so less noise can be ignored."],
          ["Two levels give more precision", false, "Fewer levels give less precision per wire. Precision comes from using many wires (bits)."],
          ["Physics only allows two voltages", false, "Any voltage is possible. Two levels is a choice."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Give one advantage and one cost of two-level digital signals compared to analog signals.", model: "Advantage: noise smaller than the margin (here ±1.25 V) is completely ignored, so the information arrives unchanged. Cost: precision. A two-level signal can't represent small changes in value. You need many bits to get precision back." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ch1", eyebrow: "Chapter 1", title: "The Circuit Abstraction",
    intro: `<p>Seven short parts. Each one is a few screens: you play with something, guess, then see the idea. You don't need the PDF for this.</p><p class="aside">Arrow keys ← → move between steps.</p>`,
    after: `<p>Open the Chapter 1 PDF and go straight to the <b>exercises and problems</b> at the end. They test whether the ideas really stuck, so don't expect them to look like the examples here.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7],
    summary: `
      <h3>The lumped circuit abstraction</h3>
      <p>Describe each part only by v across and i through its terminals. Elements connect with ideal wires.</p>
      <h3>Lumped matter discipline</h3>
      <ol><li>∂Φ<sub>B</sub>/∂t = 0 outside elements → voltage is path-independent.</li><li>∂q/∂t = 0 inside elements (and at nodes) → current in = current out.</li><li>Signal timescales ≫ wave travel time → circuit size ≪ wavelength λ = c/f.</li></ol>
      <h3>Power and energy</h3>
      <div class="eq">p = v i  ·  w = ∫ v i dt  (= pT if constant)</div>
      <p>1 W = 1 V·A · 1 J = 1 W·s · 1 Wh = 3600 J · battery energy = V × A·h</p>
      <h3>Associated variables</h3>
      <p>Current arrow enters the + terminal. Then p = vi is power <b>into</b> the element: + absorbs, − supplies.</p>
      <h3>Resistors</h3>
      <div class="eq">v = iR · p = i²R = v²/R · G = 1/R</div>
      <p>R = ρ l / a (wire) · R = ρ l /(w h) (box) · R = (L/W) R<sub>□</sub> (flat, same thickness). Short: R → 0, v = 0. Open: R → ∞, i = 0. A "resistor" links v and i instantly (no memory).</p>
      <h3>Ideal element laws</h3>
      <div class="tbl"><table><tbody><tr><td>Resistor</td><td class="mono">v = iR</td></tr><tr><td>Ideal wire (short)</td><td class="mono">v = 0</td></tr><tr><td>Open circuit</td><td class="mono">i = 0</td></tr><tr><td>Voltage source</td><td class="mono">v = V</td></tr><tr><td>Current source</td><td class="mono">i = I</td></tr></tbody></table></div>
      <h3>Modeling</h3>
      <p>Battery ≈ ideal source V + series R. vₜ = V + iR with i into + (associated). Line set by open-circuit voltage and short-circuit current.</p>
      <h3>Signals</h3>
      <div class="eq">v = A sin(ωt + φ) · ω = 2πf · T = 1/f</div>
      <p>v<sub>rms</sub> = √(avg of v²); sine: A/√2. Average power = v<sub>rms</sub>²/R. Digital: values split by a threshold; noise below the margin is ignored, precision is lost.</p>
      <h3>Units and prefixes</h3>
      <div class="tbl"><table><tbody><tr><td>Time</td><td>s</td><td>Frequency</td><td>Hz</td></tr><tr><td>Current</td><td>A</td><td>Voltage</td><td>V</td></tr><tr><td>Power</td><td>W</td><td>Energy</td><td>J</td></tr><tr><td>Resistance</td><td>Ω</td><td>Conductance</td><td>S</td></tr></tbody></table></div>
      <p class="mono">P 10¹⁵ · T 10¹² · G 10⁹ · M 10⁶ · k 10³ · m 10⁻³ · µ 10⁻⁶ · n 10⁻⁹ · p 10⁻¹² · f 10⁻¹⁵</p>`,
  };
  Course.start(window.CHAPTER);
})();
