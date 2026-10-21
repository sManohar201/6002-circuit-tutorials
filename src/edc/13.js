(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const ch = (n, file, part, where, html) => `<p class="aside">${html} <a href="${file}#${part}">Boylestad Chapter ${n}, ${where} →</a></p>`;
  const ohm = (r) => si(r, "Ω");
  const TAU = 2 * Math.PI;
  const V = (v) => si(v, "V", 4), hz = (f) => si(f, "Hz", 4);
  const oa = (x, y, o = {}) => `<polygon class="el" points="${x},${y - 42} ${x},${y + 42} ${x + 72},${y}"/>` +
    S.t(x + 13, y - 14, o.flip ? "+" : "−", { cls: "big" }) + S.t(x + 13, y + 27, o.flip ? "−" : "+", { cls: "big" });
  /* Small comparator triangle: inputs at y−12 (top) and y+12, output at x+44. top: sign of the top input. */
  const cmp = (x, y, top) => `<polygon class="el" points="${x},${y - 26} ${x},${y + 26} ${x + 44},${y}"/>` + S.t(x + 8, y - 7, top, { cls: "s" }) + S.t(x + 8, y + 17, top === "+" ? "−" : "+", { cls: "s" });

  function cmpFig(refOnMinus) {
    let s = oa(220, 130) + S.supply(90, 40, "+12 V") + S.res(90, 40, 90, 110, "10 kΩ", { side: "left" }) + S.dot(90, 110) + S.res(90, 110, 90, 180, "10 kΩ", { side: "left" }) + S.gnd(90, 180);
    const yRef = refOnMinus ? 110 : 150, ySig = refOnMinus ? 150 : 110;
    s += S.wire([90, 110], [150, 110], [150, yRef], [220, yRef]) + S.t(98, 102, "V_ref = 6 V", { a: "start", cls: "s m" });
    s += S.dot(40, ySig === 150 ? 230 : 20) + S.t(32, ySig === 150 ? 235 : 25, "V_i", { a: "end", cls: "c" }) + S.wire([40, ySig === 150 ? 230 : 20], [190, ySig === 150 ? 230 : 20], [190, ySig], [220, ySig]);
    s += S.wire([292, 130], [340, 130]) + S.dot(340, 130) + S.t(340, 118, "V_o", { cls: "a" }) + S.res(340, 130, 340, 190, "470 Ω", { side: "right" }) + S.diode(340, 190, 340, 235, "LED", { side: "right" }) + S.gnd(340, 235);
    return S.svg(430, 265, s, { max: 430, label: refOnMinus ? "Comparator: reference on the inverting input, LED on when V_i goes above 6 V" : "Comparator: reference on the noninverting input, LED on when V_i goes below 6 V" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "The comparator", mins: 20,
    blurb: "An op-amp with no feedback: a linear input goes in, a digital high/low comes out.",
    takeaway: "A comparator compares a linear input with a reference and gives a digital output: high when the + input is above the − input, low when below. With the open-loop gain (100 000+), a fraction of a millivolt of difference saturates the output. The reference can sit on either input: reference on −, output high when V_i > V_ref; reference on +, output high when V_i < V_ref. A divider usually sets V_ref. An op-amp works (e.g. a 741 driving an LED through a resistor), but comparator ICs switch faster, add noise immunity and drive loads directly.",
    steps: [
      { k: "learn", title: "High gain, no feedback", b: [
        seen("An op-amp without negative feedback saturates.", "15-op-amp.html#p8", "Chapter 15, Part 8"),
        `<p>No feedback resistor: the full open-loop gain acts on V<sub>+</sub> − V<sub>−</sub>. A millivolt either way drives the output to a supply rail. Linear in, digital out.</p>`,
        fig(cmpFig(true)),
        `<div class="eq">V<sub>ref</sub> = [10 kΩ/(10 kΩ + 10 kΩ)](12 V) = 6 V</div>`,
      ]},
      { k: "play", title: "Compare", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`);
          let ref = 2, minus = true;
          function draw() {
            const vin = (t) => 8 * Math.sin(TAU * t), out = (t) => ((vin(t) > ref) === minus ? 10 : -10);
            f.innerHTML = plot({ x: [0, 2], y: [-14, 12], xt: [0, 0.5, 1, 1.5, 2], yt: [-10, 0, 10], xl: "time (cycles)", yl: "volts", h: 240, series: [{ f: vin, cls: "s2" }, { f: () => ref, cls: "s5" }, { f: out, cls: "s1", n: 1200 }], texts: [{ x: 0.05, y: -12.8, s: "blue: V_i · dashed: V_ref · orange: output" }], label: "Comparator output switching as the input crosses the reference" });
          }
          host.append(f, toggle(["V_ref on − input", "V_ref on + input"], (k) => { minus = k === 0; draw(); }, 0),
            slider({ id: id + "-r", label: "V_ref", min: -7, max: 7, step: 0.25, value: ref, show: (v) => fmt(v, 3) + " V" }, (v) => { ref = v; draw(); }).el);
          draw();
        },
        `<p>V<sub>ref</sub> = 0 makes a <b>zero-crossing detector</b>: the output tells you the input's sign.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Reference on the + input, signal on −. The LED (driven by a high output) lights when…", opts: [["V_i goes below V_ref", true, "Then + is above −, so the output goes high."], ["V_i goes above V_ref", false, "That's with the reference on −."], ["V_i equals V_ref exactly", false, "The output switches there, but doesn't stay."]] },
        { t: "num", q: "A divider of 33 kΩ (top, to +15 V) and 10 kΩ (bottom, to ground) sets V_ref. Its value?", a: 3.488, unit: "V", tol: 0.01, hint: "15 × 10/43.", why: "3.49 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a comparator's output only ever sit at high or low?", model: "Because there's no negative feedback, so the full open-loop gain of a hundred thousand or more multiplies the difference between the inputs. Any difference bigger than a fraction of a millivolt drives the output all the way to one of its saturation levels." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Comparator ICs: 311 and 339", mins: 20,
    blurb: "Open-collector outputs, strobes, relays, and a window detector from two comparators.",
    takeaway: "311: runs from ±15 V or a single 5 V; output from a transistor (can drive lamps, relays); balance and strobe inputs. Zero-crossing detector (− grounded): input positive turns the output transistor on, output low; negative, output high. Strobe: a TTL high on the strobe holds the output off (high) whatever the input. Relay output: the coil energizes when the output goes low. 339: quad comparator, one supply for all four; open-collector outputs need a pull-up resistor. Positive differential input: output open (pulled high); negative: output at V⁻. Open-collector outputs can be wire-ORed: any one going low pulls the shared line low. Window detector: two comparators share input and output; the output is high only when V_ref2 < V_i < V_ref1.",
    steps: [
      { k: "learn", title: "Why a comparator IC?", b: [
        `<div class="two"><div class="tile"><h3>Faster switching</h3><p>Built to slam between levels, not to be linear.</p></div><div class="tile"><h3>Noise immunity</h3><p>Doesn't chatter when the input hovers at the reference.</p></div><div class="tile"><h3>Drives loads</h3><p>A transistor output for lamps, relays or logic.</p></div></div>`,
        `<p>The <b>311</b>: works from ±15 V or a single 5 V logic supply. Zero-crossing detector with − grounded: input positive → output transistor on → output <b>low</b>; input negative → output <b>high</b>. A <b>strobe</b> input can freeze the output high (off) whatever the input. With a relay coil as its load, the contacts close when the output goes low.</p>`,
      ]},
      { k: "learn", title: "The 339 and open-collector outputs", b: [
        `<p>Four comparators, one supply. Each output is a bare transistor collector: <b>open</b> (off) or pulled to V<sup>−</sup> (on). A pull-up resistor makes "open" read high.</p>`,
        `<div class="tbl"><table><tr><th>Reference on</th><th>Input &gt; V<sub>ref</sub></th><th>Input &lt; V<sub>ref</sub></th></tr><tr><td>− input</td><td>open (high)</td><td>V<sup>−</sup> (low)</td></tr><tr><td>+ input</td><td>V<sup>−</sup> (low)</td><td>open (high)</td></tr></table></div>`,
        `<p>Tie two open-collector outputs together (<b>wire-OR</b>): either one switching on pulls the line low.</p>`,
      ]},
      { k: "play", title: "Window detector", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let hiR = 6, loR = 2;
          function draw() {
            const vin = (t) => 4 + 4 * Math.sin(TAU * t), out = (t) => (vin(t) < hiR && vin(t) > loR ? 9 : 0);
            f.innerHTML = plot({ x: [0, 2], y: [-1, 10], xt: [0, 1, 2], yt: [0, 2, 4, 6, 8], xl: "time (cycles)", yl: "volts", h: 230, series: [{ f: vin, cls: "s2" }, { f: () => hiR, cls: "s5" }, { f: () => loR, cls: "s5" }, { f: out, cls: "s1", n: 1200 }], label: "Window detector: output high only while the input is between the two references" });
            ro.innerHTML = readout([["Window", fmt(loR, 3) + " V to " + fmt(hiR, 3) + " V"], ["Comparator 1 pulls low when", "V<sub>i</sub> &gt; " + fmt(hiR, 3) + " V"], ["Comparator 2 pulls low when", "V<sub>i</sub> &lt; " + fmt(loR, 3) + " V"]]);
          }
          host.append(f, slider({ id: id + "-h", label: "Upper reference V_ref1", min: 0, max: 9, step: 0.25, value: hiR, show: (v) => fmt(v, 3) + " V" }, (v) => { hiR = v; draw(); }).el,
            slider({ id: id + "-l", label: "Lower reference V_ref2", min: 0, max: 9, step: 0.25, value: loR, show: (v) => fmt(v, 3) + " V" }, (v) => { loR = v; draw(); }).el, ro);
          draw();
        },
        `<p>Two 339 comparators share the input and a wire-ORed output. Either one pulls the line low when the input leaves the window; inside it, both are open and the pull-up holds the output high.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A 311 zero-crossing detector (− input grounded) sees a +0.3 V input. Its output?", opts: [["Low: the output transistor is on", true, "Positive input turns the output transistor on."], ["High", false, "That's for a negative input."], ["0 V exactly", false, "It's a two-level output."]] },
        { t: "mcq", q: "Why must a 339 output have a pull-up resistor to read 'high'?", opts: [["Its output is an open collector: off means disconnected, not high", true, "The resistor supplies the high level."], ["To limit the input current", false, "It's on the output."], ["To set the reference", false, "The reference is on an input."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do two open-collector comparators make a window detector?", model: "Their outputs are tied together with one pull-up resistor. One comparator turns on and pulls the line low when the input goes above the upper reference, the other when it goes below the lower reference. Only when the input is between the two are both off, so the pull-up makes the output high." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Digital-to-analog conversion", mins: 20,
    blurb: "Each bit adds a weighted share of V_ref. Resolution is V_ref/2ⁿ.",
    takeaway: "Ladder network DAC with bits at 0 V or V_ref: V_o = (D₀·2⁰ + D₁·2¹ + D₂·2² + D₃·2³)/2⁴ × V_ref for 4 bits: 16 levels in steps of V_ref/16. Resolution for n stages: V_ref/2ⁿ (10 bits at 10 V: about 10 mV). R-2R ladder IC: a reference current, current switches set by the binary input, output current proportional to the binary value (a resistor turns it into a voltage).",
    steps: [
      { k: "play", title: "Flip the bits", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), row = el(`<div class="row" role="group"></div>`);
          const bits = [0, 1, 1, 0]; const Vref = 16;
          function draw() {
            const code = bits[0] * 8 + bits[1] * 4 + bits[2] * 2 + bits[3], vo = (code / 16) * Vref, pts = [];
            for (let k = 0; k < 16; k++) pts.push([k, (k / 16) * Vref], [k + 1, (k / 16) * Vref]);
            f.innerHTML = plot({ x: [0, 16], y: [0, 16], xt: [0, 4, 8, 12, 15], yt: [0, 4, 8, 12, 15], xl: "binary input (0000 to 1111)", yl: "V_o (V)", h: 230, series: [{ pts, cls: "s5" }], marks: [{ x: code + 0.5, y: vo }], label: "DAC staircase: one output level per binary code" });
            ro.innerHTML = readout([["Input D<sub>3</sub>D<sub>2</sub>D<sub>1</sub>D<sub>0</sub>", bits.join("")], ["Weighted sum", code + " of 16"], ["V<sub>o</sub> = sum/16 × V<sub>ref</sub> (16 V)", V(vo)]]);
          }
          ["D_3 (8)", "D_2 (4)", "D_1 (2)", "D_0 (1)"].forEach((lab, i) => {
            const b = el(`<button type="button" class="btn small" aria-pressed="${!!bits[i]}">${lab}</button>`);
            b.addEventListener("click", () => { bits[i] = 1 - bits[i]; b.setAttribute("aria-pressed", String(!!bits[i])); draw(); });
            row.appendChild(b);
          });
          host.append(f, row, ro);
          draw();
        },
        `<div class="eq">V<sub>o</sub> = [(D<sub>0</sub>·1 + D<sub>1</sub>·2 + D<sub>2</sub>·4 + D<sub>3</sub>·8)/16] V<sub>ref</sub>    resolution = V<sub>ref</sub>/2<sup>n</sup></div>`,
        `<p>Each bit is worth twice the one below it. The DAC adds up the bits that are on, as fractions of V<sub>ref</sub>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "4-bit ladder, V_ref = 8 V, input 1011. V_o?", a: 5.5, unit: "V", tol: 0.01, hint: "1011 = 8 + 2 + 1 = 11.", why: "11/16 × 8 = 5.5 V." },
        { t: "num", q: "8-bit DAC with V_ref = 5 V. Resolution (step size)?", a: 19.53, unit: "mV", tol: 0.01, hint: "V_ref/2⁸.", why: "5/256 = 19.5 mV." },
      ]},
      { k: "learn", title: "The R-2R ladder IC", b: [
        `<p>Only two resistor values, R and 2R, repeated. A reference current feeds the ladder; switches steer each leg's current to the output or to ground according to its bit. The output current is a weighted sum. Send it through a resistor (or an op-amp current-to-voltage stage) for a voltage.</p>`,
        ch(11, "11-op-amp-applications.html", "p3", "Part 3", "The current-controlled voltage source turns that current into a voltage."),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do more bits give a better DAC?", model: "Because the output moves in steps of V_ref divided by two to the n. Each extra bit doubles the number of levels and halves the step size, so the output can follow the wanted value more finely." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Analog-to-digital conversion", mins: 25,
    blurb: "Dual-slope integrates and counts. The counter-ladder method climbs a staircase until it passes the input.",
    takeaway: "Dual-slope ADC: integrate the analog input for a fixed time (ramp up; height ∝ input), then integrate a fixed reference the other way (ramp down at a fixed rate) while counting; the count when the ramp returns to the comparator level is the digital output. Using the same clock and integrator both ways cancels clock drift and integrator errors. Ladder (counter) ADC: a counter drives a DAC ladder, producing a staircase; a comparator stops the count when the staircase rises above the input. Resolution V_ref/2ⁿ; maximum conversion time 2ⁿ clock periods, average about half.",
    steps: [
      { k: "play", title: "Dual slope", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let vin = 0.6;
          function draw() {
            const T1 = 1, peak = vin, T2 = peak / 1;
            f.innerHTML = plot({ x: [0, 2.2], y: [0, 1.1], xt: [0, 1, 2], xtf: (v) => (v === 1 ? "fixed time" : fmt(v)), yt: [0, 0.5, 1], xl: "time", yl: "integrator", h: 220, series: [{ pts: [[0, 0], [T1, peak], [T1 + T2, 0]], cls: "s1" }, { pts: [[0, 0], [T1, 1], [T1 + 1, 0]], cls: "s5" }], marks: [{ x: T1 + T2, y: 0 }], label: "Dual-slope ramps: up for a fixed time, down at a fixed rate" });
            ro.innerHTML = readout([["Input (fraction of full scale)", fmt(vin, 3)], ["Down-ramp time ∝ count", fmt(T2, 3) + " × full count"]]);
          }
          host.append(f, slider({ id: id + "-v", label: "Analog input", min: 0.05, max: 1, step: 0.01, value: vin, show: (v) => fmt(v, 2) }, (v) => { vin = v; draw(); }).el, ro);
          draw();
        },
        `<p>Up for a fixed time: a bigger input climbs higher. Down at a fixed rate: from higher, it takes longer. The counter measures that time: the count is proportional to the input.</p>`,
      ]},
      { k: "play", title: "Counter and ladder", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let vin = 9.3; const Vref = 16, n = 4;
          function draw() {
            const step = Vref / 2 ** n; let k = 0; const pts = [[0, 0]];
            while (k * step <= vin && k < 2 ** n - 1) { k++; pts.push([k, (k - 1) * step], [k, k * step]); }
            pts.push([k + 0.6, k * step]);
            f.innerHTML = plot({ x: [0, 16], y: [0, 16], xt: [0, 4, 8, 12, 16], yt: [0, 4, 8, 12, 16], xl: "clock pulses", yl: "volts", h: 230, series: [{ f: () => vin, cls: "s2" }, { pts, cls: "s1" }], marks: [{ x: k, y: k * step }], label: "Staircase climbing until it passes the analog input" });
            ro.innerHTML = readout([["Count when the comparator stops it", String(k)], ["Step size V<sub>ref</sub>/2<sup>4</sup>", V(step)]]);
          }
          host.append(f, slider({ id: id + "-v", label: "Analog input (4-bit, V_ref = 16 V)", min: 0, max: 14.9, step: 0.1, value: vin, show: (v) => fmt(v, 3) + " V" }, (v) => { vin = v; draw(); }).el, ro);
          draw();
        },
        `<div class="eq">resolution = V<sub>ref</sub>/2<sup>n</sup>    max conversion time = 2<sup>n</sup> × clock period    average ≈ half</div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>A 10-bit counter-ladder ADC, V<sub>ref</sub> = 5 V, clock 500 kHz.</p>`,
        { t: "num", q: "Resolution?", a: 4.883, unit: "mV", tol: 0.01, hint: "5/1024.", why: "4.88 mV." },
        { t: "num", q: "Maximum conversion time?", a: 2.048, unit: "ms", tol: 0.01, hint: "1024 × 2 µs.", why: "2.05 ms." },
        { t: "num", q: "Average conversions per second?", a: 976.6, tol: 0.01, hint: "Average time is half the maximum.", why: "1/1.024 ms = 977 per second (488 at worst)." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the dual-slope method insensitive to the exact clock frequency?", model: "Because the same clock times both phases. The up-ramp lasts a fixed number of clock counts and the down-ramp is counted with the same clock, so if the clock runs fast or slow, both intervals change together and the final count stays the same." },
      ]},
    ],
  };

  /* 555 internals: divider, two comparators, flip-flop, output stage, discharge. */
  function timerFig() {
    let s = S.supply(60, 40, "V_CC (8)") + S.res(60, 40, 60, 112, "R", { side: "left" }) + S.dot(60, 112) + S.res(60, 112, 60, 178, "R", { side: "left" }) + S.dot(60, 178) + S.res(60, 178, 60, 240, "R", { side: "left" }) + S.gnd(60, 240);
    s += cmp(160, 100, "+") + cmp(160, 190, "+");
    s += S.wire([150, 34], [150, 88], [160, 88]) + S.t(150, 26, "threshold (6)", { a: "start", cls: "s" }) + S.wire([60, 112], [160, 112]) + S.t(100, 106, "2V_CC/3", { cls: "s m" });
    s += S.wire([60, 178], [160, 178]) + S.t(100, 172, "V_CC/3", { cls: "s m" }) + S.wire([150, 270], [150, 202], [160, 202]) + S.t(150, 288, "trigger (2)", { cls: "s" });
    s += S.box(260, 90, 80, 120, "") + S.t(300, 155, "F/F", { cls: "s" }) + S.wire([204, 100], [260, 100]) + S.t(266, 104, "R", { a: "start", cls: "s m" }) + S.wire([204, 190], [260, 190]) + S.t(266, 194, "S", { a: "start", cls: "s m" });
    s += S.wire([340, 125], [370, 125]) + S.box(370, 105, 96, 40, "output") + S.wire([466, 125], [500, 125]) + S.dot(500, 125) + S.t(500, 113, "out (3)", { cls: "a s" });
    s += S.wire([340, 180], [370, 180]) + S.box(370, 160, 96, 40, "discharge") + S.wire([466, 180], [500, 180]) + S.dot(500, 180) + S.t(500, 220, "discharge (7)", { a: "end", cls: "s" });
    s += S.t(182, 70, "comp 1", { cls: "s m" }) + S.t(182, 232, "comp 2", { cls: "s m" });
    return S.svg(560, 300, s, { max: 560, label: "Inside the 555: a three-resistor divider, two comparators, a flip-flop, an output stage and a discharge transistor" });
  }
  /* Astable 555: capacitor voltage and output over time (seconds). */
  function astable(RA, RB, C, tEnd) {
    const VCC = 1, dt = tEnd / 3000, vc = [], out = [];
    let v = 0, hi = true;
    for (let i = 0; i <= 3000; i++) {
      const t = i * dt;
      if (hi) { v += ((VCC - v) * dt) / ((RA + RB) * C); if (v >= (2 * VCC) / 3) hi = false; }
      else { v -= (v * dt) / (RB * C); if (v <= VCC / 3) hi = true; }
      vc.push([t, v]); out.push([t, hi ? 1.25 : 0.05]);
    }
    return { vc, out };
  }

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "The 555 timer", mins: 30,
    blurb: "Two comparators and a flip-flop. Wire it as a clock (astable) or a one-shot (monostable).",
    takeaway: "555: three equal resistors set comparator references at 2V_CC/3 and V_CC/3; comparator 1 (threshold, pin 6) resets the flip-flop, comparator 2 (trigger, pin 2) sets it; the flip-flop drives the output (pin 3) and a discharge transistor (pin 7). Astable: C charges through R_A + R_B toward V_CC until 2V_CC/3 (output high), then discharges through R_B to V_CC/3 (output low). T_high ≈ 0.7(R_A + R_B)C, T_low ≈ 0.7R_BC, T = T_high + T_low = 0.693(R_A + 2R_B)C, f ≈ 1.44/[(R_A + 2R_B)C]. Monostable (one-shot): a negative trigger edge sets the output high for T_high = 1.1R_AC while C charges to 2V_CC/3, then the discharge transistor holds C near 0 V until the next trigger.",
    steps: [
      { k: "learn", title: "Inside the 555", b: [
        fig(timerFig()),
        `<p>Capacitor voltage on <b>threshold</b> rises past 2V<sub>CC</sub>/3 → comparator 1 resets the flip-flop: output low, discharge on. Voltage on <b>trigger</b> falls below V<sub>CC</sub>/3 → comparator 2 sets it: output high, discharge off.</p>`,
      ]},
      { k: "play", title: "Astable: a clock", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let RA = 4.7e3, RB = 10e3, C = 0.047e-6;
          function draw() {
            const th = 0.7 * (RA + RB) * C, tl = 0.7 * RB * C, T = th + tl, w = astable(RA, RB, C, 4 * T);
            f.innerHTML = plot({ x: [0, 4 * T], y: [0, 1.4], xt: [0, T, 2 * T, 3 * T, 4 * T], xtf: (v) => si(v, "s", 2), yt: [0, 1 / 3, 2 / 3, 1], ytf: (v) => (v === 0 ? "0" : v < 0.5 ? "V_CC/3" : v < 0.9 ? "2V_CC/3" : "V_CC"), xl: "t", h: 240, series: [{ pts: w.vc, cls: "s2" }, { pts: w.out, cls: "s1" }], texts: [{ x: 0.05 * T, y: 1.33, s: "orange: output (pin 3) · blue: capacitor" }], label: "555 astable: capacitor voltage between one and two thirds of V_CC, and the output square wave" });
            ro.innerHTML = readout([["T<sub>high</sub> = 0.7(R<sub>A</sub> + R<sub>B</sub>)C", si(th, "s", 4)], ["T<sub>low</sub> = 0.7R<sub>B</sub>C", si(tl, "s", 4)], ["f = 1/T", hz(1 / T)], ["Duty cycle T<sub>high</sub>/T", fmt((100 * th) / T, 3) + "%"]]);
          }
          host.append(f,
            slider({ id: id + "-a", label: "R_A", min: 1e3, max: 100e3, log: true, value: RA, show: ohm }, (v) => { RA = v; draw(); }).el,
            slider({ id: id + "-b", label: "R_B", min: 1e3, max: 100e3, log: true, value: RB, show: ohm }, (v) => { RB = v; draw(); }).el,
            slider({ id: id + "-c", label: "C", min: 1e-9, max: 10e-6, log: true, value: C, show: (v) => si(v, "F") }, (v) => { C = v; draw(); }).el, ro);
          draw();
        },
        `<div class="eq">T<sub>high</sub> ≈ 0.7(R<sub>A</sub> + R<sub>B</sub>)C    T<sub>low</sub> ≈ 0.7R<sub>B</sub>C    f ≈ 1.44/[(R<sub>A</sub> + 2R<sub>B</sub>)C]</div>`,
        `<p>Charging goes through both resistors, discharging only through R<sub>B</sub>, so the output is high longer than low: duty cycle above 50%. The first cycle is longer because C starts from 0 V.</p>`,
        seen("RC charging between two thresholds: the same exponential.", "10-first-order-transients.html#p4", "Chapter 10, Part 4"),
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Astable: R<sub>A</sub> = 4.7 kΩ, R<sub>B</sub> = 10 kΩ, C = 0.047 µF.</p>`,
        { t: "num", q: "T_high?", a: 0.4836, unit: "ms", tol: 0.01, hint: "0.7 × 14.7 kΩ × 0.047 µF.", why: "0.484 ms." },
        { t: "num", q: "Frequency?", a: 1231, unit: "Hz", tol: 0.012, hint: "T = T_high + 0.7R_BC.", why: "T = 0.813 ms, f = 1.23 kHz (1.24 kHz with the 1.44 formula)." },
        { t: "num", q: "Monostable: R_A = 22 kΩ, C = 0.22 µF. Output pulse width?", a: 5.324, unit: "ms", tol: 0.01, hint: "1.1R_AC.", why: "5.32 ms." },
      ]},
      { k: "learn", title: "Monostable: a one-shot", b: [
        `<p>Wait at rest with C discharged. A <b>negative-going trigger</b> drops pin 2 below V<sub>CC</sub>/3: output high, discharge off. C charges through R<sub>A</sub>; at 2V<sub>CC</sub>/3 the output drops and the discharge transistor empties C again.</p>`,
        `<div class="eq">T<sub>high</sub> = 1.1R<sub>A</sub>C</div>`,
        `<p class="aside">Why 1.1? Charging from 0 to 2/3 of V<sub>CC</sub> takes ln 3 ≈ 1.1 time constants. Astable's 0.7 is ln 2: charging from 1/3 to 2/3.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe one cycle of a 555 astable.", model: "The capacitor charges through R_A and R_B toward V_CC while the output is high. When it reaches two thirds of V_CC, the upper comparator resets the flip-flop: the output goes low and the discharge transistor turns on. The capacitor then discharges through R_B alone until it falls to one third of V_CC, when the lower comparator sets the flip-flop again and the cycle repeats." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Voltage-controlled oscillator", mins: 20,
    blurb: "A dc voltage sets the frequency. The 566 gives square and triangle waves.",
    takeaway: "A VCO's output frequency (square or triangle wave) is set by an external R and C, then varied by a dc control voltage. 566: current sources charge and discharge C₁ at a rate set by R₁ and V_C; a Schmitt trigger switches them, giving a triangle across C₁ and a square from the Schmitt trigger, both buffered. f_o = (2/R₁C₁)·(V⁺ − V_C)/V⁺, with 2 kΩ ≤ R₁ ≤ 20 kΩ, ¾V⁺ ≤ V_C ≤ V⁺, f_o < 1 MHz, V⁺ between 10 and 24 V. A divider sets V_C; a pot or an ac input on top of the divider varies it (frequency modulation), over about 10:1.",
    steps: [
      { k: "learn", title: "Frequency from a voltage", b: [
        `<div class="eq">f<sub>o</sub> = (2/R<sub>1</sub>C<sub>1</sub>)·(V<sup>+</sup> − V<sub>C</sub>)/V<sup>+</sup></div>`,
        `<p>Limits: 2 kΩ ≤ R<sub>1</sub> ≤ 20 kΩ, ¾V<sup>+</sup> ≤ V<sub>C</sub> ≤ V<sup>+</sup>, f<sub>o</sub> under 1 MHz, V<sup>+</sup> from 10 to 24 V. Raising V<sub>C</sub> toward V<sup>+</sup> <b>lowers</b> the frequency.</p>`,
      ]},
      { k: "play", title: "Turn the control voltage", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let VC = 10; const R1 = 12e3, C1 = 1e-9, Vp = 12;
          function draw() {
            const fo = (2 / (R1 * C1)) * ((Vp - VC) / Vp), Tw = 100e-6;
            const tri = (t) => { const u = (t * fo) % 1; return u < 0.5 ? 4 * u - 1 : 3 - 4 * u; };
            f.innerHTML = plot({ x: [0, Tw], y: [-1.4, 1.4], xt: [0, 25e-6, 50e-6, 75e-6, 100e-6], xtf: (v) => si(v, "s", 2), yt: [0], ytf: () => "0", xl: "t", h: 210, series: [{ f: tri, cls: "s2", n: 1500 }, { f: (t) => (tri(t + 0.25 / fo) > 0 ? 1.2 : -1.2) * 1, cls: "s1", n: 1500 }], label: "VCO triangle and square outputs" });
            ro.innerHTML = readout([["V<sub>C</sub> (allowed 9 V to 12 V)", fmt(VC, 3) + " V"], ["f<sub>o</sub>", hz(fo)]]);
          }
          host.append(f, slider({ id: id + "-v", label: "Control voltage V_C (R_1 = 12 kΩ, C_1 = 1 nF, V⁺ = 12 V)", min: 9, max: 11.8, step: 0.05, value: VC, show: (v) => fmt(v, 3) + " V" }, (v) => { VC = v; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>566 with R<sub>1</sub> = 12 kΩ, C<sub>1</sub> = 1 nF, V<sup>+</sup> = 12 V. V<sub>C</sub> comes from a divider: R<sub>2</sub> = 2 kΩ (to V<sup>+</sup>) and R<sub>3</sub> = 10 kΩ (to ground).</p>`,
        { t: "num", q: "V_C?", a: 10, unit: "V", tol: 0.01, hint: "12 × 10/12.", why: "10 V: inside the 9–12 V window." },
        { t: "num", q: "f_o?", a: 27.78, unit: "kHz", tol: 0.01, hint: "(2/12 µs) × 2/12.", why: "27.8 kHz." },
        { t: "num", q: "V_C pushed down to 9 V. f_o?", a: 41.67, unit: "kHz", tol: 0.01, hint: "(V⁺ − V_C)/V⁺ = 3/12.", why: "41.7 kHz: lower V_C, higher frequency." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does it mean that an ac input on V_C frequency-modulates a VCO?", model: "The ac signal moves the control voltage up and down around its bias point, and the output frequency follows, rising and falling around the centre frequency. The information in the input is carried as changes in frequency." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  function pllFig(div) {
    let s = S.dot(20, 60) + S.t(20, 48, "V_i (f_i)", { cls: "c s" }) + S.wire([20, 60], [50, 60]) + S.box(50, 35, 110, 50, "phase det.") + S.wire([160, 60], [190, 60]) + S.box(190, 35, 110, 50, "low-pass") + S.wire([300, 60], [330, 60]) + S.box(330, 35, 70, 50, "amp") + S.wire([400, 60], [460, 60]) + S.dot(460, 60) + S.t(468, 65, "V_d", { a: "start", cls: "a s" });
    s += S.wire([430, 60], [430, 150], [360, 150]) + S.box(250, 125, 110, 50, "VCO") + S.dot(430, 60);
    s += div ? S.wire([250, 150], [215, 150]) + S.box(145, 130, 70, 40, "÷ N") + S.wire([145, 150], [105, 150], [105, 85]) + S.wire([305, 175], [305, 200]) + S.dot(305, 200) + S.t(315, 205, "N·f_i out", { a: "start", cls: "a s" }) : S.wire([250, 150], [105, 150], [105, 85]) + S.t(160, 168, "V_o (f_o)", { cls: "s m" });
    return S.svg(530, 220, `<g transform="translate(30,0)">${s}</g>`, { max: 530, label: div ? "PLL frequency synthesizer with a divide-by-N in the feedback path" : "Phase-locked loop: phase detector, low-pass filter, amplifier and VCO in a loop" });
  }
  const p7 = {
    id: "p7", title: "Phase-locked loops", mins: 25,
    blurb: "A VCO that steers itself onto the input frequency. FM demodulation, synthesis and FSK decoding.",
    takeaway: "PLL = phase detector + low-pass filter (+ amplifier) + VCO in a loop. The detector's output depends on the phase difference; the filter keeps the low-frequency part (difference frequency) while acquiring lock; its dc output steers the VCO. In lock, VCO frequency = input frequency (a fixed phase difference gives a fixed dc). Capture range: around f_o, the range over which lock can be acquired. Lock range: the somewhat wider range over which lock, once captured, is held. The filtered voltage is linear in input frequency, so a PLL demodulates FM. 565: f_o = 0.3/R₁C₁ (2 kΩ ≤ R₁ ≤ 20 kΩ); lock range f_L = ±8f_o/V; capture range f_C = ±(1/2π)√(2πf_L/R₂C₂) with R₂ = 3.6 kΩ internal. Synthesizer: a ÷N divider in the loop makes the VCO run at N·f_i. FSK decoder: two input frequencies (e.g. 1070 and 1270 Hz) become two dc levels.",
    steps: [
      { k: "learn", title: "The loop", b: [
        (host) => { const f = el(`<div class="fig"></div>`); const d = (k) => { f.innerHTML = pllFig(k === 1); }; host.append(f, toggle(["Basic PLL", "Synthesizer (÷N)"], d, 0)); d(0); },
        `<p>The phase detector compares input and VCO. If the VCO lags, the detector's averaged output nudges the VCO faster; if it leads, slower. In <b>lock</b> the frequencies are equal, held by a steady phase difference and a steady dc voltage.</p>`,
      ]},
      { k: "play", title: "Output voltage vs input frequency", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let fi = 150; const fo = 133.7, half = 89.1;
          function draw() {
            const vo = (x) => (Math.abs(x - fo) <= half ? -(x - fo) / half : NaN);
            f.innerHTML = plot({ x: [0, 260], y: [-1.3, 1.3], xt: [0, fo - half, fo, fo + half, 260], xtf: (v) => fmt(v, 3), yt: [-1, 0, 1], ytf: (v) => (v === 0 ? "mid" : v > 0 ? "+" : "−"), xl: "input frequency (kHz)", yl: "V_d", h: 230, series: [{ f: vo, cls: "s1" }], marks: Math.abs(fi - fo) <= half ? [{ x: fi, y: vo(fi) }] : [], label: "PLL output voltage linear in input frequency inside the lock range" });
            ro.innerHTML = readout([["Input frequency", fmt(fi, 4) + " kHz"], ["State", Math.abs(fi - fo) <= half ? "locked: V_d tracks the frequency" : "out of lock"]]);
          }
          host.append(f, slider({ id: id + "-f", label: "Input frequency", min: 10, max: 250, step: 1, value: fi, show: (v) => v + " kHz" }, (v) => { fi = v; draw(); }).el, ro);
          draw();
        },
        `<p>Inside the lock range, V<sub>d</sub> is a straight line in frequency. Feed in FM and V<sub>d</sub> <b>is</b> the demodulated audio.</p>`,
      ]},
      { k: "learn", title: "The 565 numbers", b: [
        `<div class="eq">f<sub>o</sub> = 0.3/R<sub>1</sub>C<sub>1</sub>    f<sub>L</sub> = ±8f<sub>o</sub>/V    f<sub>C</sub> = ±(1/2π)√(2πf<sub>L</sub>/R<sub>2</sub>C<sub>2</sub>), R<sub>2</sub> = 3.6 kΩ</div>`,
        `<p>The capture range is narrower than the lock range: easier to hold lock than to get it.</p>`,
        `<p class="aside">Careful with V. The book's example plugs in 6 V for a ±6 V supply and gets ±181.8 kHz, but its own Fig. 13.26c marks the range as 45.45 to 227.27 kHz, which is ±90.9 kHz. The 565 data sheet defines V as the <b>total</b> supply (12 V here), which gives the figure's ±90.9 kHz. Follow whichever convention your problem set uses, and say which.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "565 with R₁ = 6.8 kΩ, C₁ = 330 pF. f_o?", a: 133.7, unit: "kHz", tol: 0.01, hint: "0.3/(R₁C₁).", why: "134 kHz." },
        { t: "num", q: "A synthesizer locks to a 10 kHz reference with a ÷8 divider in the loop. VCO output?", a: 80, unit: "kHz", tol: 0.01, hint: "N·f_i.", why: "80 kHz, exactly, as long as it stays locked." },
        { t: "mcq", q: "Which is wider?", opts: [["The lock range", true, "Once locked, the loop can follow over a wider range than it can capture from."], ["The capture range", false, "Other way round."]] },
      ]},
      { k: "learn", title: "FSK decoding", b: [
        `<p>Data sent as two tones, say 1070 Hz (space) and 1270 Hz (mark). The PLL locks to whichever arrives; its dc output shifts between two levels; a comparator turns that into logic. An RC ladder filter strips the sum-frequency ripple first.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a PLL keep its VCO on the input frequency?", model: "The phase detector produces a voltage that depends on the phase difference between the input and the VCO. The low-pass filter smooths it to a dc level that controls the VCO. If the VCO drifts, the phase difference changes, the control voltage changes, and the VCO is pulled back, so its frequency stays equal to the input's." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Interfacing", mins: 15,
    blurb: "Drivers, receivers, RS-232C to TTL, current loops, open-collector and tri-state buses.",
    takeaway: "Interface circuits connect circuits with different levels or impedances. Driver: delivers the voltage/current a load needs (relays, displays, lines); receiver: high input impedance, inverting or noninverting inputs; both may be strobed. RS-232C: mark (logic 1) and space (logic 0) defined differently from TTL (TTL: 5 V mark, 0 V space; RS-232C mark could be −12 V, space +12 V). A diode clamp plus inverter converts RS-232C to TTL. TTY 20 mA current loop to TTL: an opto-isolator's LED carries the loop current, its transistor drives an inverter. Open-collector outputs share a bus (any one on pulls it low; all off leaves it high); tri-state outputs can disconnect.",
    steps: [
      { k: "learn", title: "Speaking each other's language", b: [
        `<div class="tbl"><table><tr><th></th><th>Mark (logic 1)</th><th>Space (logic 0)</th></tr><tr><td>TTL</td><td>+5 V</td><td>0 V</td></tr><tr><td>RS-232C (example)</td><td>−12 V</td><td>+12 V</td></tr><tr><td>TTY current loop</td><td>20 mA</td><td>no current</td></tr></table></div>`,
        `<p><b>RS-232C → TTL</b>: a diode clips the −12 V mark to about 0 V at an inverter's input, so the inverter outputs 5 V (a TTL mark); a +12 V space drives the inverter low (a TTL space).</p>`,
        `<p><b>Current loop → TTL</b>: the 20 mA mark lights an opto-isolator's LED, its transistor turns on, and an inverter turns that into 5 V. No electrical connection between the two sides.</p>`,
      ]},
      { k: "learn", title: "Sharing a wire", b: [
        `<div class="two"><div class="tile"><h3>Open collector</h3><p>Many outputs on one bus with one pull-up. Any transistor on pulls the bus low; all off leaves it high.</p></div><div class="tile"><h3>Tri-state</h3><p>High, low, or disconnected. Only the enabled output drives the bus.</p></div></div>`,
        seen("Pull-up resistors and logic gates.", "11-energy-power-digital.html#p3", "Chapter 11, Part 3"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which interface piece does the job?", bins: ["Driver", "Receiver", "Opto-isolator", "Open-collector bus"], items: [
          ["Supplies enough current to operate a relay or a long line", 0, "That's a driver's job."],
          ["Presents a high input impedance to an incoming signal", 1, "Receivers minimize loading."],
          ["Passes a 20 mA loop signal with no electrical connection", 2, "Light carries it across."],
          ["Lets several devices pull one shared line low", 3, "Wired-OR."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't you connect an RS-232C output straight to a TTL input?", model: "Because the two use different voltages for their logic levels. RS-232C can use minus twelve volts for a mark and plus twelve for a space, while TTL expects five volts and zero. The negative voltage could damage the TTL input and the meanings are inverted, so an interface circuit clamps and inverts the signal." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edc13", eyebrow: "Boylestad · Chapter 13", title: "Linear-Digital ICs",
    intro: `<p>Eight parts: comparators (op-amp and IC), digital-to-analog and analog-to-digital conversion, the 555 timer, the VCO, phase-locked loops and interfacing.</p><p>These chips sit between the analog world and digital logic.</p><p class="aside">The "Computer Analysis" section isn't covered. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's problems in the book. They test whether the ideas stuck, so don't expect them to look like the examples here.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8],
    summary: `
      <h3>Comparators</h3>
      <p>Output high when V<sub>+</sub> &gt; V<sub>−</sub>, low otherwise. Reference on −: high for V<sub>i</sub> &gt; V<sub>ref</sub>. Open-collector outputs (339) need a pull-up and can be wire-ORed: window detector.</p>
      <h3>Converters</h3>
      <div class="eq">DAC V<sub>o</sub> = [(D<sub>0</sub>·2⁰ + D<sub>1</sub>·2¹ + … + D<sub>n−1</sub>·2<sup>n−1</sup>)/2<sup>n</sup>]V<sub>ref</sub>    resolution V<sub>ref</sub>/2<sup>n</sup>    counter ADC max time 2<sup>n</sup>/f<sub>clock</sub></div>
      <h3>555 timer</h3>
      <div class="eq">T<sub>high</sub> ≈ 0.7(R<sub>A</sub> + R<sub>B</sub>)C    T<sub>low</sub> ≈ 0.7R<sub>B</sub>C    f ≈ 1.44/[(R<sub>A</sub> + 2R<sub>B</sub>)C]    one-shot T = 1.1R<sub>A</sub>C</div>
      <h3>VCO and PLL</h3>
      <div class="eq">566: f<sub>o</sub> = (2/R<sub>1</sub>C<sub>1</sub>)(V<sup>+</sup> − V<sub>C</sub>)/V<sup>+</sup>, ¾V<sup>+</sup> ≤ V<sub>C</sub> ≤ V<sup>+</sup>    565: f<sub>o</sub> = 0.3/R<sub>1</sub>C<sub>1</sub>, f<sub>L</sub> = ±8f<sub>o</sub>/V, f<sub>C</sub> = ±(1/2π)√(2πf<sub>L</sub>/R<sub>2</sub>C<sub>2</sub>)</div>
      <h3>Interfacing</h3>
      <p>TTL: 5 V mark, 0 V space. RS-232C: e.g. −12 V mark, +12 V space. Current loop: 20 mA mark. Open-collector and tri-state outputs share buses.</p>`,
  };
  Course.start(window.CHAPTER);
})();
