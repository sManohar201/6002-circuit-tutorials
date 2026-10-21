(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const seenV = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;

  /* =============== PART 1 =============== */
  const STACK = [["M1", 144, 160], ["M2", 144, 160], ["M3", 144, 160], ["M4", 216, 240], ["M5", 252, 280], ["M6", 324, 360], ["M7", 504, 560], ["M8", 720, 810]];
  function stackSvg() {
    let s = "", y = 230;
    STACK.forEach(([n, t, p]) => {
      const h = t / 30, w = (p / 2) / 12;
      y -= Math.max(h, 8) + 8;
      for (let i = 0; i < Math.floor(300 / (p / 12)); i++) s += `<rect x="${80 + i * (p / 12)}" y="${y}" width="${w}" height="${h}" style="fill:var(--accent);opacity:.75"/>`;
      s += S.t(70, y + h / 2 + 4, n, { a: "end", cls: "s" }) + S.t(390, y + h / 2 + 4, `${p} nm`, { a: "start", cls: "s m" });
    });
    s += `<rect x="80" y="232" width="300" height="10" style="fill:var(--cool-soft)"/>` + S.t(230, 256, "transistors", { cls: "s m" });
    return S.svg(450, 262, s, { max: 460, label: "Intel 45 nm metal stack, pitch grows upward" });
  }
  const p1 = {
    id: "p1", title: "Why wires matter now", mins: 15,
    blurb: "Transistors got faster; wires got thinner and slower. Wire geometry and a real metal stack.",
    takeaway: "Interconnect once behaved as an ideal equipotential node with lumped capacitance. Now transistors are fast and wires narrow, so wire RC delay often exceeds gate delay; tight spacing makes much of the capacitance to neighbours (crosstalk); wires use a large part of switching energy; inductance matters for fast, wide wires. Geometry: width w, length l, thickness t, spacing s, dielectric height h; pitch = w + s; aspect ratio t/w (~1.8–2 in nanometer processes). Aluminium gave way to copper around 180–130 nm, then low-k dielectrics; 65 nm processes have 8–10 metal layers, adding about one layer every generation or two. Metal1 pitch roughly matches a contacted transistor; upper layers are thicker and wider for long distances; the top layer carries power and clock (Intel 45 nm: M1–M3 160 nm pitch, up to M8 810 nm, plus a 7 µm-thick M9 for power to gated domains).",
    steps: [
      { k: "learn", title: "The problem", b: [
        `<p>Long ago, wires were wide and thick: just a node with some capacitance. Now:</p>`,
        `<ul><li>Narrow wires have high <b>resistance</b>: wire RC delay often beats gate delay.</li><li>Wires packed side by side have most of their capacitance to <b>neighbours</b>: switching one disturbs the other (<b>crosstalk</b>).</li><li>Wires use a large share of switching <b>energy</b>.</li><li>Fast wide wires start to show <b>inductance</b>.</li></ul>`,
        `<p>Circuit design is now as much about engineering the wires as the transistors under them.</p>`,
      ]},
      { k: "learn", title: "A real metal stack", b: [
        (host) => host.append(el(`<div class="fig">${stackSvg()}</div>`)),
        `<p>Intel's 45 nm process (to scale in pitch, not in length). Width w, spacing s, thickness t; <b>pitch</b> = w + s; <b>aspect ratio</b> = t/w, about 1.8 here. Lower layers: thin and dense, for wiring inside cells. Upper layers: thick and wide, for long low-resistance runs. An extra 7 µm-thick M9 distributes power.</p>`,
        seenV("Copper, low-k and how the stack is built.", "03-processing.html#p5", "Chapter 3, Part 5"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why are upper metal layers thicker and on a wider pitch?", opts: [["They carry long wires and power, where low resistance matters more than density", true, "Lower layers trade resistance for density."], ["They're cheaper to make", false, "It's about resistance."], ["They're closer to the package so need to be strong", false, "Strength isn't the reason."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why have wires become a bigger problem as transistors shrank?", model: "Shrinking makes transistors faster, but it makes wires narrower and thinner, so their resistance per length rises, while their capacitance per length stays about the same. Long wires don't get shorter because chips don't get smaller. So wire RC delay grows relative to gate delay, and tightly packed wires also couple to their neighbours more." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Resistance", mins: 20,
    blurb: "Sheet resistance and counting squares. Barriers and dishing make copper worse.",
    takeaway: "R = ρl/(tw) = R_□·(l/w), with sheet resistance R_□ = ρ/t in Ω/square; a square is any l = w region, so shapes with the same l/w have equal resistance. Bulk resistivities (µΩ·cm): Ag 1.6, Cu 1.7, Au 2.2, Al 2.8, W 5.3, Mo 5.3, Ti 43; thin films are higher (Cu 2.2–2.6, Al 3.6–4.0) from surface and grain-boundary scattering. Copper needs a barrier (thickness t_barrier) and polishing dishes the top (t_dish): R = ρl/((t − t_dish − t_barrier)(w − 2t_barrier)); a 10 nm barrier matters at tens of nm width. Silicided poly and diffusion < 10 Ω/□, unsilicided up to hundreds; wells higher. Contacts and vias 2–20 Ω each: use several; a full square array where current turns.",
    steps: [
      { k: "learn", title: "Count the squares", b: [
        `<div class="eq">R = ρ l / (t w) = R<sub>□</sub> · (l / w)     R<sub>□</sub> = ρ / t</div>`,
        `<p>Thickness and resistivity are fixed by the process, so they're bundled into the <b>sheet resistance</b> R<sub>□</sub> (ohms per square). You choose l and w: a wire 1000 times longer than wide is <b>1000 squares</b>, whatever its actual size.</p>`,
        `<div class="tbl"><table><tbody><tr><td>Silver</td><td>1.6 µΩ·cm</td></tr><tr><td>Copper</td><td>1.7 (thin films 2.2–2.6)</td></tr><tr><td>Aluminium</td><td>2.8 (films 3.6–4.0)</td></tr><tr><td>Tungsten</td><td>5.3</td></tr></tbody></table></div>`,
      ]},
      { k: "play", title: "A copper wire", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let t = 300, w = 150, l = 2, bar = 10;
          function draw() {
            const rho = 2.2e-8, ideal = (rho * l * 1e-3) / (t * 1e-9 * w * 1e-9), real = (rho * l * 1e-3) / ((t - 10 - bar) * 1e-9 * Math.max(1, w - 2 * bar) * 1e-9);
            ro.innerHTML = readout([["Sheet resistance ρ/t", fmt((rho / (t * 1e-9)), 3) + " Ω/□"], ["Squares l/w", fmt((l * 1e6) / w, 3)], ["Resistance, ideal", si(ideal, "Ω")], ["With barrier and 10 nm dishing", si(real, "Ω") + ` (+${fmt((real / ideal - 1) * 100, 3)}%)`]]);
          }
          host.append(slider({ id: id + "-t", label: "Thickness t", min: 100, max: 800, step: 10, value: t, show: (x) => x + " nm" }, (x) => { t = x; draw(); }).el,
            slider({ id: id + "-w", label: "Width w", min: 40, max: 800, step: 5, value: w, show: (x) => x + " nm" }, (x) => { w = x; draw(); }).el,
            slider({ id: id + "-l", label: "Length l", min: 0.1, max: 10, step: 0.1, value: l, show: (x) => fmt(x, 2) + " mm" }, (x) => { l = x; draw(); }).el,
            slider({ id: id + "-b", label: "Barrier thickness", min: 0, max: 15, step: 1, value: bar, show: (x) => x + " nm" }, (x) => { bar = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Copper (thin film, 2.2 µΩ·cm) must be wrapped in a resistive barrier, and polishing “dishes” the top. Make the wire 50 nm wide and watch the barrier's share grow.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Copper at 2.2 µΩ·cm, 0.3 µm thick, 0.15 µm wide, 2 mm long (ignore the barrier). Resistance?", a: 978, tol: 0.01, unit: "Ω", hint: "R□ = 2.2×10⁻⁸/0.3×10⁻⁶ = 0.073 Ω/□; squares = 2000/0.15.", why: "0.0733 × 13,333 ≈ 978 Ω." },
        { t: "mcq", q: "A 1 µm × 1 µm square and a 10 µm × 10 µm square of the same layer: resistance end to end?", opts: [["Equal: one square each", true, "Only l/w matters."], ["The big one is 10× higher", false, "Longer but also wider."], ["The small one is 10× higher", false, "Same ratio."]] },
      ]},
      { k: "learn", title: "Other conductors", b: [
        `<ul><li>Silicided poly and diffusion: under 10 Ω/□. Unsilicided: up to several hundred. Wells: higher still (used for big resistors).</li><li>Contacts and vias: 2–20 Ω each. Use several; where current turns a corner, use a square array.</li></ul>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do designers work in 'squares' instead of computing ρl/(tw) each time?", model: "Resistivity and thickness are fixed by the process for a given layer, so they combine into one number, the sheet resistance. The only thing the designer controls is the shape, and the resistance depends only on the ratio of length to width, the number of squares. Multiply squares by sheet resistance and you're done." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Capacitance", mins: 25,
    blurb: "Plates above and below, neighbours beside, fringe at the edges. About 0.2 fF per µm.",
    takeaway: "An isolated wire over the substrate has parallel-plate capacitance ε_ox·wl/h plus fringing capacitance from its edges (formulas such as Yuan–Trick or the empirical Meijs–Fokkema, C = ε l[w/h + 0.77 + 1.06(w/h)^0.25 + 1.06(t/h)^0.5], good to 6%). Neighbours on the same layer and the layers above and below matter more. Upper bound (for propagation delay and power): neighbours at minimum spacing and solid planes above and below: C_total = C_top + C_bot + 2C_adj ≈ ε₀l(2k_vert w/h + 2k_horiz t/s) + C_fringe. Lower bound (contamination delay before layout): no other conductors. Field solvers produce tables of C_adj and C_gnd. Doubling width gives less than double capacitance (intercept > 0). Tight-pitch wires ≈ 0.2 fF/µm. Dense wiring or fill above and below ≈ planes. Lumped models: L (poor), π (3 segments within 3%), T; use 3–5-segment π models in simulation.",
    steps: [
      { k: "learn", title: "Where the field lines go", b: [
        `<p>A wire's electric field ends on whatever conductors are nearest: the layers above and below (<b>C<sub>top</sub></b>, <b>C<sub>bot</sub></b>), and its two neighbours (<b>C<sub>adj</sub></b> each). Plus some <b>fringe</b> at the corners.</p>`,
        `<div class="eq">C<sub>total</sub> ≈ ε<sub>0</sub> l (2k<sub>vert</sub> w/h + 2k<sub>horiz</sub> t/s) + C<sub>fringe</sub></div>`,
        `<p>Assume neighbours at minimum spacing and solid planes above and below: an <b>upper bound</b>, for propagation delay and power. Assume nothing nearby: a <b>lower bound</b>, for contamination delay.</p>`,
      ]},
      { k: "play", title: "Wider or further apart?", b: [
        (host, id) => {
          const ro = el(`<div></div>`), f = el(`<div class="fig"></div>`);
          let w = 100, s = 100;
          const t = 180, h = 150, kv = 3.0, kh = 2.7, e0 = 8.85e-3; // aF/nm·... → result in fF/µm via scaling below
          function draw() {
            const vert = 2 * kv * (w / h), horiz = 2 * kh * (t / s), cf = 0.04 / (e0 * 1);
            const C = (x) => 8.85e-3 * x * 1; // ε0 in fF/µm
            const Cv = C(vert), Ch = C(horiz), Ct = Cv + Ch + 0.04;
            f.innerHTML = S.svg(420, 150, (() => {
              let g = `<rect x="20" y="10" width="380" height="16" style="fill:var(--line)"/><rect x="20" y="124" width="380" height="16" style="fill:var(--line)"/>` + S.t(30, 22, "plane above", { a: "start", cls: "s m" }) + S.t(30, 136, "plane below", { a: "start", cls: "s m" });
              const ww = w / 4, ss = s / 4, hh = t / 4;
              [-1, 0, 1].forEach((k) => { const x = 210 - ww / 2 + k * (ww + ss); g += `<rect x="${x}" y="${75 - hh / 2}" width="${ww}" height="${hh}" style="fill:var(--accent);opacity:${k ? 0.45 : 0.9}"/>`; });
              return g;
            })(), { max: 420, label: "Wire cross-section between planes" });
            ro.innerHTML = readout([["To planes above and below", fmt(Cv, 3) + " fF/µm"], ["To the two neighbours", fmt(Ch, 3) + " fF/µm"], ["Total (with fringe)", fmt(Ct, 3) + " fF/µm"], ["Coupling share", fmt((Ch / Ct) * 100, 3) + "%"]]);
          }
          host.append(f, slider({ id: id + "-w", label: "Width w", min: 60, max: 400, step: 5, value: w, show: (x) => x + " nm" }, (x) => { w = x; draw(); }).el,
            slider({ id: id + "-s", label: "Spacing s", min: 60, max: 400, step: 5, value: s, show: (x) => x + " nm" }, (x) => { s = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">A made-up middle layer: t = 180 nm, h = 150 nm, k<sub>vert</sub> = 3.0, k<sub>horiz</sub> = 2.7, fringe 0.04 fF/µm. At tight pitch most of the capacitance is to the neighbours. Double the width: capacitance rises, but less than double. Widen the spacing: coupling drops fast.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 3 mm wire at 0.2 fF/µm: total capacitance?", a: 600, tol: 0.01, unit: "fF", why: "3000 µm × 0.2 fF/µm = 600 fF = 0.6 pF." },
        { t: "mcq", q: "For estimating contamination (minimum) delay before layout, which capacitance should you assume?", opts: [["The lower bound: no neighbours, no planes", true, "Min delay needs the least capacitance."], ["The upper bound", false, "That's for propagation delay and power."], ["Zero", false, "There's always capacitance to the substrate."]] },
      ]},
      { k: "learn", title: "Distributed wires as lumps", b: [
        `<p>A wire's R and C are spread along its length. Approximate it with segments:</p>`,
        `<div class="tbl"><table><tbody><tr><td><b>L-model</b></td><td>R then C: needs many segments. Poor.</td></tr><tr><td><b>π-model</b></td><td>C/2, R, C/2: three segments are within 3%. The standard.</td></tr><tr><td><b>T-model</b></td><td>R/2, C, R/2: as good, but an extra node.</td></tr></tbody></table></div>`,
        `<p>Simulate long wires as 3–5 π segments.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why doesn't doubling a wire's width double its capacitance?", model: "Only the plate capacitance to the layers above and below grows with width. The capacitance to the neighbours depends on thickness and spacing, and the fringe at the edges is fixed, so they don't change. The total therefore grows by less than a factor of two." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Wire delay", mins: 25,
    blurb: "RC/2 for a distributed wire. Delay grows with length squared.",
    takeaway: "Wires add delay by loading gates with capacitance and through their own distributed RC. The Elmore delay of a single-segment L-model is RC; with more segments it falls toward RC/2; a π or T model gives RC/2 for any number of segments, so a single π segment is good for hand work. Driver R_d, wire R_w, C_w, load C_L: t_pd = R_d(C_w + C_L) + R_w(C_w/2 + C_L). Wire delay ∝ l² because R and C both grow with l. Book example: R = 800 Ω/mm, C = 0.2 pF/mm gives 80 ps/mm² ≈ 5.3 FO4/mm²; crossing a 10 mm die ≈ 530 FO4, dozens of cycles. Don't route in diffusion; use poly only within cells. Elmore on RC trees lumps side branches at the branch point (conservative). Effective resistance aside: a distributed line's 50% delay is 0.38R′C (vs 0.69R′C lumped); with true wire resistance, RC/2 is a good flight-time estimate, especially with slow inputs. Moment matching (AWE) beats Elmore in tools.",
    steps: [
      { k: "learn", title: "RC/2", b: [
        `<p>Model the wire as a π: C<sub>w</sub>/2, then R<sub>w</sub>, then C<sub>w</sub>/2. With a driver R<sub>d</sub> and load C<sub>L</sub>, Elmore gives</p>`,
        `<div class="eq">t<sub>pd</sub> = R<sub>d</sub>(C<sub>w</sub> + C<sub>L</sub>) + R<sub>w</sub>(C<sub>w</sub>/2 + C<sub>L</sub>)</div>`,
        `<p>The wire's own term is <b>R<sub>w</sub>C<sub>w</sub>/2</b>: its capacitance is spread out, so on average it charges through half the resistance. Both R<sub>w</sub> and C<sub>w</sub> grow with length, so this term grows with <b>l<sup>2</sup></b>.</p>`,
        seenV("Elmore delay.", "04-delay.html#p4", "Chapter 4, Part 4"),
      ]},
      { k: "play", title: "Drive a long wire", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let Rd = 2, L = 1.5;
          const r = 0.5, c = 0.2;
          function draw() {
            const t = (l) => (Rd * 1e3 * (c * l * 1e-12 + 1e-15) + r * l * 1e3 * ((c * l * 1e-12) / 2 + 1e-15)) * 1e12;
            f.innerHTML = plot({ x: [0, 5], y: [0, 4000], xt: [0, 1, 2, 3, 4, 5], yt: [0, 1000, 2000, 3000, 4000], xl: "wire length (mm)", yl: "delay (ps)", series: [{ f: t, cls: "s1" }, { f: (l) => Rd * 1e3 * c * l * 1e-12 * 1e12, cls: "s5" }], marks: [{ x: L, y: t(L), label: `${fmt(t(L), 3)} ps` }], label: "Delay of a wire against its length" });
            const w = r * L * 1e3 * ((c * L * 1e-12) / 2) * 1e12;
            ro.innerHTML = readout([["Total delay", fmt(t(L), 3) + " ps"], ["Wire's own RC/2", fmt(w, 3) + " ps"], ["Driver charging the wire", fmt(Rd * 1e3 * c * L * 1e-12 * 1e12, 3) + " ps"]]);
          }
          host.append(f, slider({ id: id + "-d", label: "Driver resistance", min: 0.2, max: 10, step: 0.1, value: Rd, show: (x) => fmt(x, 2) + " kΩ" }, (x) => { Rd = x; draw(); }).el,
            slider({ id: id + "-l", label: "Wire length", min: 0.1, max: 5, step: 0.05, value: L, show: (x) => fmt(x, 3) + " mm" }, (x) => { L = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Wire: 0.5 Ω/µm, 0.2 fF/µm; load 1 fF. Dashed: the driver's part (linear in length). The orange curve bends up: the wire's own RC/2 is quadratic. A strong driver can't fix that part.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Driver 2 kΩ; wire 1.5 mm at 0.5 Ω/µm and 0.2 fF/µm; load 1 fF. Elmore delay?", a: 715, tol: 0.01, unit: "ps", hint: "C_w = 300 fF, R_w = 750 Ω.", why: "2k × 301f + 750 × 151f = 602 + 113 = 715 ps." },
        { t: "num", q: "A wire's RC/2 flight time is 50 ps for 1 mm. For 3 mm?", a: 450, tol: 0.01, unit: "ps", why: "Quadratic: 9 × 50 = 450 ps." },
      ]},
      { k: "learn", title: "Trees and the ln 2 aside", b: [
        `<p>For a wire that branches to several receivers, use Elmore on the RC tree: side branches are lumped at the branch point (a little pessimistic).</p>`,
        `<p>Fine print: a lumped RC reaches 50% at 0.69 RC but a distributed line at 0.38 RC, about half. So with the true wire resistance, <b>RC/2</b> is a good flight-time estimate (better still with slow inputs). Tools use moment matching (AWE) for more accuracy.</p>`,
        `<p class="aside">Never route signals in diffusion (high R and C). Use poly only inside cells.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a wire's delay grow with the square of its length?", model: "A longer wire has proportionally more resistance and proportionally more capacitance, and its delay is set by their product. Double the length and you have twice the resistance charging twice the capacitance, so four times the delay." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Inductance, skin effect, temperature", mins: 20,
    blurb: "Currents flow in loops. When does inductance matter? Rarely, except for wide clock and power wires.",
    takeaway: "Current flows in loops (returning through power/ground, an AC ground thanks to bypass capacitance); the loop's magnetic field gives inductance, V = L dI/dt. LC sets the signal speed: t = l√(LC), v = 1/√(LC) = c/√k ≈ half the speed of light in SiO₂ when the return path is close. On-chip inductance 0.15–1.5 pH/µm; L ≈ (µ₀l/2π)ln(8h/w + w/4h) over a plane. Extraction is a whole-loop 3D problem: designers use regular power grids and design rules instead; gaps in the grid enlarge loops. Inductance matters only when t_r/(2√(LC)) < l < (2/R)√(L/C): fast edges and low resistance, i.e. wide clock lines and power networks; it delays the start, sharpens edges, and causes overshoot. Split wide clocks into interdigitated strips with power and ground. Mutual inductive crosstalk in buses: keep the signal:return ratio ~4 (negligible) to 8 (small). Skin effect: high-frequency current crowds into a depth δ = √(2ρ/(ωµ)); edge frequency ω ≈ 2π/(8.65 t_rf); for Cu and 20 ps edges δ ≈ 1 µm, larger than half most wires' thickness, so rarely a factor. Temperature: Cu and Al resistance +0.4%/°C (100 °C → +40%); at 77 K copper is ~10× better; capacitance doesn't change.",
    steps: [
      { k: "learn", title: "Currents flow in loops", b: [
        `<p>A signal's current goes out along the wire and comes back through the power/ground network. The loop's magnetic field resists changes in current: <b>V = L dI/dt</b>.</p>`,
        `<div class="eq">t<sub>flight</sub> = l √(LC)     v = 1/√(LC) = c/√k</div>`,
        `<p>In SiO<sub>2</sub> (k = 3.9) that's about half the speed of light, if the return path is close. A far return path means a bigger loop, more L, slower signals.</p>`,
      ]},
      { k: "learn", title: "When does it matter?", b: [
        `<div class="eq">t<sub>r</sub> / (2√(LC))  &lt;  l  &lt;  (2/R)√(L/C)</div>`,
        `<p>Left: the wire must be long enough that the flight time exceeds the rise time. Right: short enough that RC doesn't dominate. For ordinary narrow signal wires that window only exists for absurdly fast edges. It's real for <b>wide clock lines</b> and <b>power grids</b>: inductance delays the start, sharpens the edge, and overshoots.</p>`,
        `<ul><li>Split a wide clock wire into strips interleaved with V<sub>DD</sub> and GND returns.</li><li>Buses: put a power or ground wire every N signals. Signal:return N = 4 makes inductive effects negligible; 8, small.</li><li>Never leave gaps in the power grid: return current detours, the loop grows, and you only find out after fabrication.</li></ul>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "L = 0.4 pH/µm and C = 0.18 fF/µm. Signal velocity in mm per ns?", a: 118, tol: 0.02, unit: "mm/ns", hint: "1/√(0.4×10⁻¹² × 0.18×10⁻¹⁵) µm/s.", why: "√(7.2×10⁻²⁹) = 8.49×10⁻¹⁵ s/µm → 1.18×10¹⁴ µm/s = 118 mm/ns." },
      ]},
      { k: "learn", title: "Skin effect and temperature", b: [
        `<p>At high frequency, current crowds into a surface layer of depth <b>δ = √(2ρ/(ωµ))</b>. The relevant frequency comes from the edge: ω ≈ 2π/(8.65 t<sub>rf</sub>).</p>`,
        `<p>Copper with 10 ps edges: ω ≈ 7.3×10<sup>10</sup> rad/s, δ ≈ 0.7 µm. Most wires are thinner than 2δ, so the skin effect rarely matters on chip.</p>`,
        `<p><b>Temperature:</b> copper and aluminium resistance rise about <b>0.4% per °C</b>: 40% more at 100 °C hotter. Capacitance doesn't change. At liquid-nitrogen temperature, copper is 10× better.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do most on-chip signal wires not need inductance modelling?", model: "Their resistance is high, so RC delay dominates long before the speed-of-light flight time becomes important, and the edges aren't fast enough for inductance to matter in the short lengths where it otherwise would. Only low-resistance wires like wide clock lines and power networks fall in the window where inductance affects delay and noise." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Energy and crosstalk", mins: 25,
    blurb: "Wires burn energy. Neighbours change your delay and inject noise.",
    takeaway: "Wire energy is set by capacitance: ~0.2 pF/mm × V_DD² ≈ 0.2 pJ per bit per mm at 1 V (= 0.2 mW/Gbps); a fully used metal layer on a big die at GHz rates can burn tens of watts unless activity is low. Crosstalk delay: charge into C_adj depends on ΔV between the wires: neighbour constant → C_eff = C_gnd + C_adj (Miller coupling factor 1); same direction → C_gnd (MCF 0); opposite → C_gnd + 2C_adj (MCF 2); conservative timing uses MCF 2 for propagation and 0 for contamination (or 1.5 statistically); smarter tools track switching windows and directions. Crosstalk noise: floating victim ΔV = ΔV_aggr·C_adj/(C_gnd,v + C_adj); driven victim ΔV = ΔV_aggr·(C_adj/(C_gnd,v + C_adj))·1/(1 + k), k = τ_aggr/τ_victim = R_a(C_gnd,a + C_adj)/(R_v(C_gnd,v + C_adj)); conservative; worst for weakly driven victims (k < 1). Two switching neighbours double it. Layers above/below average out except for e.g. a short wire over a fully switching bus.",
    steps: [
      { k: "learn", title: "Energy per bit per mm", b: [
        `<p>Sending one bit (a rise and a fall) costs CV<sub>DD</sub><sup>2</sup>. With 0.2 pF/mm at 1 V: <b>0.2 pJ per bit per mm</b>, or 0.2 mW per Gbps per mm.</p>`,
        `<p>Scale it up: a 20 mm die, a metal layer half full of wires at 250 nm pitch, α = 0.1, 3 GHz: 48 W from <i>one</i> layer. Activity on long wires must be kept very low.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 5 mm bus wire at 0.2 pF/mm, V_DD = 0.9 V. Energy per bit (one rise + fall)?", a: 0.81, tol: 0.01, unit: "pJ", why: "1 pF × 0.81 V² = 0.81 pJ." },
      ]},
      { k: "play", title: "Crosstalk: delay and noise", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let cg = 60, ca = 100, mode = 0, k = 1;
          function draw() {
            const R = 1.5, mcf = [1, 0, 2][mode], ceff = cg + mcf * ca;
            const fl = ca / (cg + ca), dr = fl / (1 + k);
            ro.innerHTML = readout([["Effective capacitance (MCF " + mcf + ")", fmt(ceff, 3) + " fF"], ["Delay with a 1.5 kΩ driver", fmt(R * ceff, 3) + " ps"], ["Noise on a quiet floating victim", fmt(fl * 100, 3) + "% of V_DD"], ["Noise on a driven victim (k = " + fmt(k, 2) + ")", fmt(dr * 100, 3) + "% of V_DD"]]);
          }
          host.append(toggle(["Neighbour quiet", "Same direction", "Opposite direction"], (i) => { mode = i; draw(); }),
            slider({ id: id + "-g", label: "C to ground", min: 10, max: 200, step: 5, value: cg, show: (x) => x + " fF" }, (x) => { cg = x; draw(); }).el,
            slider({ id: id + "-a", label: "C to the neighbour", min: 0, max: 200, step: 5, value: ca, show: (x) => x + " fF" }, (x) => { ca = x; draw(); }).el,
            slider({ id: id + "-k", label: "k = τ_aggressor / τ_victim (bigger = stronger victim driver)", min: 0.2, max: 5, step: 0.1, value: k, show: (x) => fmt(x, 2) }, (x) => { k = x; draw(); }).el, ro);
          draw();
        },
        `<div class="eq">ΔV<sub>victim</sub> = ΔV<sub>aggr</sub> · C<sub>adj</sub>/(C<sub>gnd,v</sub> + C<sub>adj</sub>) · 1/(1 + k)</div>`,
        `<p class="aside">Opposite switching doubles the charge through C<sub>adj</sub> (like the Miller effect); same-direction switching makes it vanish. A floating victim keeps its noise forever; a driven one recovers, faster if its driver is stronger.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "C_gnd = 60 fF, C_adj = 100 fF, driver 1.5 kΩ. Worst-case (propagation) delay?", a: 390, tol: 0.01, unit: "ps", hint: "Opposite switching: C_gnd + 2C_adj.", why: "1.5 kΩ × 260 fF = 390 ps (vs 90 ps best case)." },
        { t: "num", q: "Same wires: noise on a floating quiet victim, as a fraction of the aggressor's swing?", a: 0.625, tol: 0.01, why: "100/(60 + 100) = 0.625. Floating nodes are dangerous!" },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a neighbour switching the opposite way double the coupling capacitance's effect on delay?", model: "The charge on the coupling capacitor depends on the voltage difference between the two wires. If the neighbour stays put, the difference changes by V_DD. If it swings the opposite way, the difference changes by 2V_DD, so twice the charge must flow, which looks like twice the capacitance. If it swings the same way, the difference doesn't change and no charge is needed." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Repeaters", mins: 30,
    blurb: "Chop a long wire into segments with inverters: quadratic delay becomes linear.",
    takeaway: "Splitting a wire into N segments with repeaters (inverters) makes each segment's RC ∝ (l/N)², total ∝ l²/N; with N ∝ l the delay is linear in l. Too few repeaters: wire RC dominates; too many: repeater delay dominates. With unit inverter R, C, p_inv, wire R_w, C_w per length, repeaters W× unit: best spacing l/N = √(2RC(1 + p_inv)/(R_wC_w)) ≈ 0.77√(FO4/(R_wC_w)) (p_inv ≈ 0.5); delay per length ≈ 1.67√(FO4·R_wC_w); size W = √(RC_w/(R_wC)); energy ≈ 1.87C_wV_DD² per length (repeaters add 87%). The optimum is flat: at minimum EDP segments are 1.7× longer, drivers 0.6× size, delay +14%, repeater energy only +30% (book: 0.8 mm, 0.26 pJ/mm, 47 ps/mm vs 0.45 mm, 0.4 pJ/mm, 41 ps/mm). Non-inverting buffer repeaters (second inverter k = 2.25× the first): spacing ≈ 1.22√(FO4/R_wC_w), delay ≈ 1.81√(FO4 R_wC_w) (~8% slower), 2.2C_wV² energy, two-thirds as many sites. Repeaters make wires unidirectional: favour point-to-point links over tristate buses.",
    steps: [
      { k: "learn", title: "Quadratic to linear", b: [
        `<p>Split a wire of length l into N segments, each driven by a <b>repeater</b> (an inverter). Each segment's RC delay ∝ (l/N)<sup>2</sup>; N of them: l<sup>2</sup>/N. Choose N ∝ l, and the total grows only <b>linearly</b> with l.</p>`,
        `<p>Too few repeaters and wire RC dominates; too many and the repeaters' own delays dominate.</p>`,
      ]},
      { k: "play", title: "How many repeaters?", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let len = 5, Wsz = 120;
          const R = 10e3, C = 0.1e-15, p = 0.5, rw = 0.4, cw = 0.18e-15; // per µm
          function draw() {
            const l = len * 1000;
            const D = (N) => { const seg = l / N; return N * (R / Wsz * (cw * seg + C * Wsz * (1 + p)) + rw * seg * (cw * seg / 2 + C * Wsz)) * 1e12; };
            const pts = []; let best = 1; for (let n = 1; n <= 30; n++) { pts.push([n, D(n)]); if (D(n) < D(best)) best = n; }
            const ymax = Math.ceil(D(1) / 500) * 500;
            f.innerHTML = plot({ x: [1, 30], y: [0, Math.min(ymax, 3000)], xt: [1, 5, 10, 15, 20, 25, 30], yt: [0, 500, 1000, 1500, 2000, 2500, 3000].filter((v) => v <= Math.min(ymax, 3000)), xl: "number of segments N", yl: "total delay (ps)", series: [{ pts, cls: "s1" }], marks: [{ x: best, y: D(best), label: `best N = ${best}`, dy: -14, a: best > 20 ? "end" : "start", dx: best > 20 ? -10 : 10 }], label: "Repeated wire delay against number of segments" });
            const ideal = 0.77 * Math.sqrt((5 * R * C) / (rw * cw)) / 1000;
            ro.innerHTML = readout([["Unrepeated (N = 1)", fmt(D(1), 3) + " ps"], ["Best", `${fmt(D(best), 3)} ps with ${best} segments of ${fmt(len / best, 3)} mm`], ["Formula spacing 0.77√(FO4/R_wC_w)", fmt(ideal, 3) + " mm"], ["Delay per mm at best", fmt(D(best) / len, 3) + " ps/mm"]]);
          }
          host.append(f, slider({ id: id + "-l", label: "Wire length", min: 0.5, max: 10, step: 0.1, value: len, show: (x) => fmt(x, 3) + " mm" }, (x) => { len = x; draw(); }).el,
            slider({ id: id + "-w", label: "Repeater size (× unit inverter)", min: 10, max: 300, step: 5, value: Wsz, show: (x) => x + "×" }, (x) => { Wsz = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Wire 400 Ω/mm and 0.18 pF/mm; unit inverter R = 10 kΩ, C = 0.1 fF, p<sub>inv</sub> = 0.5 (FO4 = 5RC = 5 ps). Notice how flat the curve is near the best N, and how little the repeater size matters within a factor of 2.</p>`,
      ]},
      { k: "learn", title: "The repeater formulas", b: [
        `<div class="eq">spacing l/N ≈ 0.77 √(FO4 / R<sub>w</sub>C<sub>w</sub>)     delay/length ≈ 1.67 √(FO4 · R<sub>w</sub>C<sub>w</sub>)</div>`,
        `<div class="eq">size W = √(R C<sub>w</sub> / (R<sub>w</sub> C))     energy/length ≈ 1.87 C<sub>w</sub>V<sub>DD</sub><sup>2</sup></div>`,
        `<p>Minimum-delay repeaters add 87% to the wire's energy. Because the optimum is flat, the <b>minimum energy-delay point</b> uses segments 1.7× longer and repeaters 0.6× the size: 14% slower, but repeaters add only 30% energy.</p>`,
        `<p class="aside">Non-inverting repeaters (inverter pairs, second 2.25× the first) avoid polarity bookkeeping: ~8% slower, a bit more energy, but only two-thirds as many places to put them. Any repeater makes a wire one-way, which favours point-to-point links over shared tristate buses.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "FO4 = 12 ps, R_w = 400 Ω/mm, C_w = 0.18 pF/mm. Delay per mm of an optimally repeated wire?", a: 49.1, tol: 0.02, unit: "ps/mm", hint: "1.67 √(FO4 · R_w · C_w), with R_wC_w in ps/mm².", why: "R_wC_w = 72 ps/mm²; √(12 × 72) = 29.4; × 1.67 = 49 ps/mm." },
        { t: "num", q: "Same wire: best repeater spacing?", a: 0.314, tol: 0.03, unit: "mm", why: "0.77 × √(12/72) = 0.77 × 0.408 = 0.31 mm." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do repeaters make wire delay linear in length?", model: "An unrepeated wire's delay is its resistance times its capacitance, both proportional to length, so quadratic. Splitting it into equal short segments with a repeater driving each makes every segment's delay small and fixed, set by the segment length. A longer wire just needs more segments, so total delay grows in proportion to length." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Engineering the wires", mins: 25,
    blurb: "Width, spacing, layers, shields, cancellation, low-swing signalling, regenerators.",
    takeaway: "Plan the floorplan early, identify long wires. Width, spacing and layer: minimum pitch by default (density, bandwidth); wire-capacitance-dominated → increase spacing (also less energy and noise); gate-capacitance/wire-resistance dominated → widen (more plate C and energy, slightly less coupling share); thin lower layers for dense routing, thicker middle and upper for speed and power; keep spare tracks for late changes. Power grid on several layers, mostly upper two, reaching down to M1/M2. Crosstalk control: more spacing; shields (power/ground on one or both sides, above/below for clocks and analog); interleave buses that switch at different times (avoids delay impact, still check noise); cancellation: staggered repeaters (each victim segment sees half rising, half falling aggressor), charge compensation (inverter + MOS capacitor injects opposite charge), twisted differential pairs (memories). Low-swing signalling: P = αfC·V_swing·V_drive vs αfCV_DD², faster (only part swing) and up to 10× lower power; needs low V_drive supply, twisted equalized differential pairs, timed drivers, clocked sense amplifiers (pMOS inputs near GND); a longer clock period increases swing and power. Regenerators (boosters) in parallel with the wire detect a transition with skewed gates and help it: up to 20% better delay or energy, bidirectional, but less noise margin.",
    steps: [
      { k: "learn", title: "Width, spacing, layer", b: [
        `<ul><li><b>Default:</b> minimum pitch: most wires per mm.</li><li><b>Load is mostly wire capacitance?</b> Increase <b>spacing</b>: less delay, less energy, less crosstalk.</li><li><b>Wire resistance matters?</b> Increase <b>width</b>: less R, a bit more C and energy.</li><li><b>Long and important?</b> Move to a thicker, higher layer.</li></ul>`,
        `<p class="aside">Wiring tracks are precious and planned in the floorplan. Keep some spare for late changes.</p>`,
      ]},
      { k: "learn", title: "Controlling crosstalk", b: [
        `<ul><li><b>Space</b> sensitive wires further apart (cheap fix for small problems).</li><li><b>Shield</b>: run V<sub>DD</sub> or GND beside the wire, on one or both sides (clocks, analog). Even above and below.</li><li><b>Interleave</b> two buses that switch on different clock edges: your neighbours are always quiet when you switch.</li><li><b>Cancel</b>: stagger repeaters so each victim segment sees half rising and half falling aggressor; or twist differential pairs (memory bitlines) so both halves see the same coupling.</li></ul>`,
      ]},
      { k: "play", title: "Low-swing signalling", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let vs = 0.1, vd = 0.3;
          function draw() { const full = 0.2 * 2e9 * 1e-12 * 1 * 1, low = 0.2 * 2e9 * 1e-12 * vs * Math.max(vs, vd); ro.innerHTML = readout([["Full swing at V_DD = 1 V", fmt(full * 1e3, 3) + " mW"], ["Low swing: αfC·V_swing·V_drive", fmt(low * 1e3, 3) + " mW"], ["Saving", fmt(full / low, 3) + "×"]]); }
          host.append(slider({ id: id + "-s", label: "Swing at the far end V_swing", min: 0.05, max: 1, step: 0.01, value: vs, show: (x) => fmt(x, 2) + " V" }, (x) => { vs = x; draw(); }).el,
            slider({ id: id + "-d", label: "Driver supply V_drive", min: 0.1, max: 1, step: 0.01, value: vd, show: (x) => fmt(x, 2) + " V" }, (x) => { vd = x; draw(); }).el, ro);
          draw();
        },
        `<div class="eq">P = α f C V<sub>swing</sub> V<sub>drive</sub></div>`,
        `<p class="aside">A 1 pF wire, α = 0.2, 2 GHz. The charge moved is CV<sub>swing</sub>, drawn from a supply at V<sub>drive</sub>. The cost: a separate low supply, twisted and equalized differential wires, carefully timed drivers, and a clocked sense amplifier at the receiver.</p>`,
      ]},
      { k: "learn", title: "Regenerators", b: [
        `<p>Repeaters sit <i>in series</i>, so wires become one-way. <b>Regenerators</b> sit <i>beside</i> the wire: skewed gates sense a transition beginning and briefly help push it. Up to 20% better delay or energy, and bidirectional, at the cost of noise margin.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A clock wire is getting jitter from data wires switching beside it. Best fix?", opts: [["Shield it with power/ground wires on both sides", true, "Clocks are routinely shielded."], ["Make it narrower", false, "That raises resistance and doesn't remove coupling."], ["Add more repeaters", false, "Doesn't stop the coupling."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does interleaving two buses that switch on different clock edges help?", model: "Each wire's neighbours belong to the other bus, which is guaranteed to be stable when this bus switches. So no neighbour ever switches at the same time, which removes the delay variation from crosstalk, although the coupling noise when the other bus switches still needs checking." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  function solveWire(cin, cw, cl) { let x = 20, y = 60; for (let i = 0; i < 300; i++) { x = Math.sqrt(cin * (y + cw)); y = Math.sqrt(cl * x); } return { x, y, d: x / cin + (y + cw) / x + cl / y }; }
  const p9 = {
    id: "p9", title: "Logical effort with wires, and pitfalls", mins: 20,
    blurb: "Short, long and medium wires. Equal effort no longer holds after a fixed load.",
    takeaway: "Wire capacitance makes branching effort (C_gate + C_wire)/C_gate depend on gate size, so equal stage effort is no longer optimal. Short wires (C_wire ≪ C_gate): ignore, or add average wire capacitance to parasitic delay; best stage effort slightly above 4, fewer stages, larger gates (at energy cost). Long wires (C_wire ≫ C_gate): split the path: the first part drives the wire (end with an inverter: low g, high h, energy-efficient), the receiver size is practical; if the RC flight time exceeds a few gate delays, add repeaters. Medium wires (C_wire ≈ C_gate): write the delay as a function of sizes and differentiate, or use a convex optimizer; at the optimum the delay caused by a stage's capacitance equals the delay caused by its resistance: C_i(R_{i−1} + R_w,i−1) = R_i(C_{i+1} + C_w,i+1). Stages before the wire share equal effort; the stage after a big wire can be large with small effort. Pitfalls: synthesizing a large chip without a floorplan (long wires appear in new paths every iteration; plan floorplan and wire budgets early; timing-driven placement); leaving gaps in the power grid (larger current loops, unmodelled inductance, delay and noise found only in silicon).",
    steps: [
      { k: "learn", title: "Three kinds of wire", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>Short</b> (C<sub>wire</sub> ≪ C<sub>gate</sub>)</td><td>Ignore it, or count it as extra parasitic delay. Best stage effort a little above 4.</td></tr>
          <tr><td><b>Long</b> (C<sub>wire</sub> ≫ C<sub>gate</sub>)</td><td>Split the path at the wire. Drive the wire with an inverter. Add repeaters if its flight time exceeds a few gate delays.</td></tr>
          <tr><td><b>Medium</b> (C<sub>wire</sub> ≈ C<sub>gate</sub>)</td><td>The hard case: branching effort depends on the gate sizes. Write delay as a function of sizes and minimize.</td></tr></tbody></table></div>`,
      ]},
      { k: "play", title: "Size around a medium wire", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let cw = 40;
          const cin = 8, cl = 200;
          function draw() { const r = solveWire(cin, cw, cl); ro.innerHTML = readout([["Best x (drives the wire)", fmt(r.x, 3)], ["Best y (after the wire)", fmt(r.y, 3)], ["Stage efforts", `${fmt(r.x / cin, 3)}, ${fmt((r.y + cw) / r.x, 3)}, ${fmt(cl / r.y, 3)}`], ["Effort delay", fmt(r.d, 3) + " τ (plus parasitics)"]]); }
          host.append(slider({ id: id + "-w", label: "Wire capacitance between x and y", min: 0, max: 300, step: 5, value: cw, show: (x) => x + " units" }, (x) => { cw = x; draw(); }).el, ro);
          draw();
        },
        `<p>Three inverters: input 8 → x → <b>wire</b> → y → load 200 (units of capacitance).</p>`,
        `<div class="eq">d = x/8 + (y + C<sub>w</sub>)/x + 200/y</div>`,
        `<p class="aside">Setting ∂d/∂x = ∂d/∂y = 0 gives x<sup>2</sup> = 8(y + C<sub>w</sub>) and y<sup>2</sup> = 200x. The two stages before the wire still share equal effort; the stage after it bears less. With C<sub>w</sub> = 0 all three are equal again.</p>`,
      ]},
      { k: "learn", title: "The general rule", b: [
        `<p>At the optimum, the delay a stage <b>causes</b> by its input capacitance (charged through the previous stage and wire) equals the delay it <b>removes</b> by its own resistance:</p>`,
        `<div class="eq">C<sub>i</sub>(R<sub>i−1</sub> + R<sub>w,i−1</sub>) = R<sub>i</sub>(C<sub>i+1</sub> + C<sub>w,i+1</sub>)</div>`,
      ]},
      { k: "check", title: "Pitfalls", b: [
        { t: "mcq", q: "A team synthesizes a big chip with no floorplan. After layout, some paths with long wires fail timing; they resynthesize, and new long wires show up elsewhere. The real fix?", opts: [["Make a floorplan early and budget wire flight time between blocks into the microarchitecture", true, "Timing-driven placement helps too."], ["Upsize every gate", false, "Wire RC doesn't care."], ["Run more synthesis iterations", false, "That's the non-converging loop."]] },
        { t: "mcq", q: "Why are gaps in the power grid dangerous for signals?", opts: [["Return current must detour, enlarging the current loop: more inductance, delay and noise that tools didn't model", true, "Found only after fabrication."], ["The gaps add capacitance", false, "It's about inductance."], ["They violate DRC", false, "They're legal, just bad."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can the gate after a long wire have a small stage effort at the optimum?", model: "The gate driving the wire already sees the wire's large fixed capacitance, so making the next gate bigger adds only a little to that driver's load and delay, while it greatly speeds up the drive of the final load. So it pays to make it large, which leaves it with a small stage effort." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "vlsi6", eyebrow: "CMOS VLSI · Chapter 6", title: "Interconnect",
    intro: `<p>Nine parts: why wires matter, resistance, capacitance, wire delay, inductance and the skin effect, energy and crosstalk, repeaters, wire engineering, and logical effort with wires.</p><p>You'll use Chapter 4's Elmore delay and logical effort, and 6.002's RC circuits. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. Several need the Intel 45 nm table or the 180 nm capacitance chart from the chapter: read numbers off them carefully and keep units straight (Ω/□, fF/µm, ps/mm²).</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9],
    summary: `
      <h3>R, C, L</h3>
      <p>R = R<sub>□</sub>(l/w), R<sub>□</sub> = ρ/t; barrier and dishing raise it. C ≈ ε<sub>0</sub>l(2k<sub>v</sub>w/h + 2k<sub>h</sub>t/s) + fringe ≈ 0.2 fF/µm. v = 1/√(LC) = c/√k. Skin depth √(2ρ/ωµ). R +0.4%/°C.</p>
      <h3>Delay and energy</h3>
      <p>π model; wire RC/2; t<sub>pd</sub> = R<sub>d</sub>(C<sub>w</sub> + C<sub>L</sub>) + R<sub>w</sub>(C<sub>w</sub>/2 + C<sub>L</sub>); ∝ l<sup>2</sup>. Energy ≈ 0.2 pJ/bit/mm.</p>
      <h3>Crosstalk</h3>
      <p>MCF 0/1/2. Noise = C<sub>adj</sub>/(C<sub>gnd</sub> + C<sub>adj</sub>) · 1/(1 + k). Fixes: spacing, shields, interleaving, staggered repeaters, twisting.</p>
      <h3>Repeaters</h3>
      <div class="eq">l/N ≈ 0.77√(FO4/R<sub>w</sub>C<sub>w</sub>)   t/l ≈ 1.67√(FO4·R<sub>w</sub>C<sub>w</sub>)   E/l ≈ 1.87C<sub>w</sub>V<sup>2</sup></div>
      <h3>Other</h3>
      <p>Low-swing P = αfCV<sub>swing</sub>V<sub>drive</sub>; regenerators; logical effort with wires: C<sub>i</sub>(R<sub>i−1</sub> + R<sub>w</sub>) = R<sub>i</sub>(C<sub>i+1</sub> + C<sub>w</sub>). Floorplan early; no gaps in the power grid.</p>`,
  };
  Course.start(window.CHAPTER);
})();
