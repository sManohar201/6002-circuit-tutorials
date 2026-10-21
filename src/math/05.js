(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const ohm = (r) => si(r, "Ω", 3);

  const p1 = {
    id: "p1", title: "Slope and intercept", mins: 15,
    blurb: "y = mx + b: m is how steep, b is where it crosses the y-axis.",
    takeaway: "A straight line is y = mx + b. Slope m = rise/run = Δy/Δx, using any two points on it; b = the value of y where x = 0. On an i–v graph a resistor is a line through the origin with slope 1/R: steeper means smaller R. A source with a series resistor (a Thévenin pair) is a line with slope −1/R_T crossing the v-axis at V_T.",
    steps: [
      { k: "learn", title: "Two numbers make a line", b: [
        `<div class="eq">y = m·x + b</div>`,
        `<div class="two"><div class="tile"><h3>m: slope</h3><p>How much y goes up for each 1 that x goes right. m = Δy/Δx between any two points.</p></div><div class="tile"><h3>b: intercept</h3><p>Where the line crosses the y-axis (the value of y when x = 0).</p></div></div>`,
      ]},
      { k: "play", title: "A resistor on an i–v graph", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let R = 2e3, Vt = 0;
          function draw() {
            const m = 1 / R;
            f.innerHTML = plot({ x: [-2, 10], y: [-2, 10], xt: [0, 2, 4, 6, 8, 10], yt: [0, 2, 4, 6, 8, 10], xl: "v (V)", yl: "i (mA)", h: 280, series: [{ f: (v) => (1000 * (v - Vt)) / R, cls: "s1" }], marks: [{ x: Vt, y: 0 }], label: "Current against voltage for a resistor with an optional source in series" });
            ro.innerHTML = readout([["Line", `i = (v − ${fmt(Vt)} V)/${ohm(R)}`], ["Slope", fmt(1000 * m, 3) + " mA per V = 1/R"], ["Crosses the v-axis at", fmt(Vt) + " V"]]);
          }
          host.append(f, slider({ id: id + "-r", label: "R", min: 500, max: 20e3, log: true, value: R, show: ohm }, (v) => { R = v; draw(); }).el,
            slider({ id: id + "-v", label: "Source in series", min: 0, max: 8, step: 0.5, value: Vt, show: (v) => v + " V" }, (v) => { Vt = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Changing R changes the slope. Adding a source slides the whole line sideways without changing its slope.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A line passes through (2 V, 1 mA) and (8 V, 4 mA). Slope in mA/V?", a: 0.5, hint: "(4 − 1)/(8 − 2).", why: "0.5 mA/V." },
        { t: "num", q: "So the resistance is?", a: 2, unit: "kΩ", hint: "R = 1/slope; 1/(0.5 mA/V).", why: "2 kΩ. And since the line passes through (0, 0), there's no source." },
        { t: "mcq", q: "Which i–v line belongs to the smaller resistor?", opts: [["The steeper one", true, "Slope = 1/R: more current per volt."], ["The flatter one", false, "Flat means little current per volt: a large R."], ["The one with the bigger intercept", false, "The intercept comes from a source, not from R."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "On an i–v graph, what do the slope and the v-axis crossing of a straight line tell you?", model: "The slope is one over the resistance, so a steeper line is a smaller resistance. The place where the line crosses the voltage axis, where current is zero, is the source voltage in series with that resistance." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "A line from its two intercepts", mins: 15,
    blurb: "The fastest way to draw a load line: set one variable to zero, then the other.",
    takeaway: "For a linear equation like V_CE + I_C·R = V_CC, find the two intercepts: I_C = 0 gives V_CE = V_CC (on the voltage axis); V_CE = 0 gives I_C = V_CC/R (on the current axis). Join them. Slope = −1/R. Changing V_CC slides the line parallel to itself; changing R swings it about the V_CC point.",
    steps: [
      { k: "learn", title: "Zero one, then the other", b: [
        `<p>KVL around a collector loop: V<sub>CC</sub> = I<sub>C</sub>R<sub>C</sub> + V<sub>CE</sub>. That's a straight line in the (V<sub>CE</sub>, I<sub>C</sub>) plane.</p>`,
        `<div class="two"><div class="tile"><h3>Set I<sub>C</sub> = 0</h3><div class="eq">V<sub>CE</sub> = V<sub>CC</sub></div></div><div class="tile"><h3>Set V<sub>CE</sub> = 0</h3><div class="eq">I<sub>C</sub> = V<sub>CC</sub>/R<sub>C</sub></div></div></div>`,
        `<p class="aside">Two points are all a straight line needs.</p>`,
      ]},
      { k: "play", title: "Move the load line", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let V = 15, R = 3e3;
          function draw() {
            const Isat = (1000 * V) / R;
            f.innerHTML = plot({ x: [0, 20], y: [0, 12], xt: [0, 5, 10, 15, 20], yt: [0, 4, 8, 12], xl: "V_CE (V)", yl: "I_C (mA)", h: 260, series: [{ pts: [[0, Isat], [V, 0]], cls: "s1" }], marks: [{ x: V, y: 0, label: fmt(V) + " V", dy: -12 }, { x: 0, y: Isat, label: fmt(Isat, 3) + " mA", dx: 10, dy: 4 }], label: "Load line between the two intercepts" });
            ro.innerHTML = readout([["Voltage-axis intercept", fmt(V) + " V"], ["Current-axis intercept V_CC/R", fmt(Isat, 3) + " mA"], ["Slope", "−1/R = " + fmt(-1000 / R, 3) + " mA/V"]]);
          }
          host.append(f, slider({ id: id + "-v", label: "V_CC", min: 5, max: 20, step: 0.5, value: V, show: (v) => v + " V" }, (v) => { V = v; draw(); }).el,
            slider({ id: id + "-r", label: "R", min: 1e3, max: 10e3, log: true, value: R, show: ohm }, (v) => { R = v; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "V_CC = 18 V, R_C = 2.2 kΩ, R_E = 0.8 kΩ in the same loop. Current-axis intercept?", a: 6, unit: "mA", hint: "Both resistors are in the loop: V_CC/(R_C + R_E).", why: "18/3 = 6 mA." },
        { t: "mcq", q: "You double R and keep V_CC. The load line…", opts: [["Keeps its V_CC end and gets half as steep", true, "The current intercept halves."], ["Slides parallel", false, "That's what changing V_CC does."], ["Doesn't change", false, "Its slope is −1/R."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe the quickest way to draw a load line.", model: "Write the loop equation, then set the current to zero to get the voltage-axis point, which is the supply voltage, and set the voltage to zero to get the current-axis point, which is supply over resistance. Join the two points with a straight line." },
      ]},
    ],
  };

  const Is = 1e-14, VT = 0.026;
  const diodeQ = (Vs, R) => { let lo = 0, hi = Math.min(Vs, 0.9); for (let k = 0; k < 60; k++) { const v = (lo + hi) / 2; if (Is * (Math.exp(v / VT) - 1) > (Vs - v) / R) hi = v; else lo = v; } return lo; };

  const p3 = {
    id: "p3", title: "Where two curves cross", mins: 20,
    blurb: "The answer to two equations is the point on both graphs. Also: models made of straight pieces.",
    takeaway: "Two equations in the same two unknowns: each is a curve; the solution is where they cross. A diode circuit's operating point is where the diode's curve meets the load line. A piecewise-linear model replaces a curve with straight pieces (for a diode: off below 0.7 V, a vertical line at 0.7 V when on), so you can solve with plain algebra: I = (V_S − 0.7)/R. Always check the piece you assumed.",
    steps: [
      { k: "learn", title: "On both graphs at once", b: [
        `<p>A diode in series with R across V<sub>S</sub> obeys two rules at once:</p>`,
        `<div class="two"><div class="tile"><h3>The diode</h3><p>I = I<sub>S</sub>(e<sup>V/V<sub>T</sub></sup> − 1): a curve</p></div><div class="tile"><h3>The rest (KVL)</h3><p>I = (V<sub>S</sub> − V)/R: the load line</p></div></div>`,
        `<p>Only one point is on both: the operating point (Q point).</p>`,
      ]},
      { k: "play", title: "Find the crossing", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let Vs = 5, R = 1e3;
          function draw() {
            const vq = diodeQ(Vs, R), iq = (1000 * (Vs - vq)) / R, ymax = Math.max(6, Math.ceil(((1000 * Vs) / R) * 1.15));
            f.innerHTML = plot({ x: [0, 1], y: [0, ymax], xt: [0, 0.2, 0.4, 0.6, 0.8, 1], yt: [0, ymax / 2, ymax], xl: "V_D (V)", yl: "I (mA)", h: 260, series: [{ f: (v) => 1000 * Is * (Math.exp(v / VT) - 1), cls: "s2" }, { f: (v) => (1000 * (Vs - v)) / R, cls: "s1" }], marks: [{ x: vq, y: iq, label: "Q", dx: -24 }], label: "Diode curve and load line crossing at the Q point" });
            ro.innerHTML = readout([["Q point (exact)", fmt(vq, 3) + " V, " + fmt(iq, 3) + " mA"], ["Piecewise model: (V_S − 0.7)/R", fmt((1000 * (Vs - 0.7)) / R, 3) + " mA"]]);
          }
          host.append(f, slider({ id: id + "-v", label: "V_S", min: 1, max: 10, step: 0.1, value: Vs, show: (v) => fmt(v) + " V" }, (v) => { Vs = v; draw(); }).el,
            slider({ id: id + "-r", label: "R", min: 500, max: 10e3, log: true, value: R, show: ohm }, (v) => { R = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The diode curve is nearly vertical once it turns on, so the crossing barely moves in voltage. That's why the 0.7 V straight-line model works well.</p>`,
      ]},
      { k: "learn", title: "Straight pieces", b: [
        fig(plot({ x: [-1, 1.2], y: [-1, 6], xt: [-1, 0, 0.7, 1.2], yt: [0, 3, 6], xl: "V_D", yl: "I_D", h: 200, series: [{ pts: [[-1, 0], [0.7, 0], [0.7, 6]], cls: "s1" }], texts: [{ x: -0.9, y: 1, s: "off: I = 0" }, { x: 0.76, y: 4, s: "on: V = 0.7" }], label: "Piecewise-linear diode model" })),
        `<p>Assume a piece (on or off), solve with plain algebra, then check the answer lands on that piece. "On" needs I &gt; 0; "off" needs V &lt; 0.7 V. If the check fails, try the other piece.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "9 V, a 2.2 kΩ resistor and a silicon diode (0.7 V model) in series. Current?", a: 3.77, unit: "mA", hint: "(9 − 0.7)/2.2.", why: "3.77 mA. It's positive, so the 'on' assumption holds." },
        { t: "mcq", q: "Same circuit with V_S = 0.4 V. Assume 'on': I = (0.4 − 0.7)/2.2 = −0.14 mA. Now what?", opts: [["Negative current breaks the 'on' assumption: the diode is off, I = 0", true, "A check failed, so switch pieces."], ["Accept −0.14 mA", false, "The 'on' piece only allows I > 0."], ["Use 0.3 V instead", false, "The model's for silicon; the problem is the wrong piece."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the operating point where the device curve meets the load line?", model: "The device's own curve lists every voltage and current it can have, and the load line lists every pair the rest of the circuit allows. The actual operating point must satisfy both, so it's the one point that lies on both graphs." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m5", eyebrow: "Math Toolkit · Module 5", title: "Lines, Graphs and Load Lines",
    intro: `<p>Three parts: slope and intercept, drawing a line from its intercepts, and finding where two curves cross. These are the graphical methods behind load lines, Q points and piecewise-linear models.</p>`,
    after: `<p>Any time a book draws a load line over device curves, this is the math: two intercepts, then the crossing.</p>`,
    parts: [p1, p2, p3],
    summary: `
      <div class="eq">y = mx + b     m = Δy/Δx</div>
      <p>Resistor on i–v axes: slope 1/R through the origin. With a series source V<sub>T</sub>: crosses the v-axis at V<sub>T</sub>.</p>
      <p>Load line V<sub>CC</sub> = I·R + V: intercepts (V<sub>CC</sub>, 0) and (0, V<sub>CC</sub>/R); slope −1/R. V<sub>CC</sub> slides it; R swings it.</p>
      <p>Solution of two equations = crossing of the two graphs. Piecewise-linear: assume a piece, solve, check (on: I &gt; 0; off: V &lt; 0.7 V).</p>`,
  };
  Course.start(window.CHAPTER);
})();
