(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const steps = (rows) => `<div class="tbl"><table><tr><th>Step</th><th>Result</th></tr>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="mono">${b}</td></tr>`).join("")}</table></div>`;
  const tbl = (head, rows) => `<div class="tbl"><table><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</table></div>`;
  const sup = (v) => String(v).replace("-", "⁻").replace(/\d/g, (d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);
  const q = 1.602e-19, e0 = 8.854e-12, eSi = 11.7 * e0, eOx = 3.9 * e0, VT = 0.02585, ni = 1e16; /* SI units; n_i in m⁻³ */
  /* Cumulative trapezoid integral of samples ys on grid spacing h. */
  const cumint = (ys, h) => { const out = [0]; for (let i = 1; i < ys.length; i++) out.push(out[i - 1] + 0.5 * h * (ys[i] + ys[i - 1])); return out; };

  const p1 = {
    id: "p1", title: "Potential, field and slope", mins: 20,
    blurb: "The electric field is just the downhill slope of the potential. Positive charges roll down it; electrons roll up it.",
    takeaway: "E = −dV/dx (in 3-D, E = −∇V, the gradient of Module 27 with a minus sign). Field points from high potential to low, and its size is how steeply V changes: volts per metre. A positive charge feels force qE, downhill in V; an electron feels −qE, so it moves towards higher V. An electron's energy is −qV, so the band diagrams of device physics are potential plots turned upside down. Thin layers mean huge fields: 1 V across a 2 nm gate oxide is 5×10⁸ V/m (5 MV/cm), close to breakdown.",
    steps: [
      { k: "learn", title: "Field = minus the slope", b: [
        `<div class="eq">E = −dV/dx</div>`,
        `<p>Picture V as the height of a landscape. E is how steep it is, pointing downhill. A flat region (constant V, like the inside of a metal) has no field. A steady slope (a parallel-plate capacitor) has a uniform field.</p>`,
        `<p class="aside">This is the same derivative as Module 13; only the names are new.</p>`,
      ]},
      { k: "play", title: "Landscapes and their slopes", b: [
        (host, id) => {
          const vf = el(`<div class="fig"></div>`), ef = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let k = 0, flip = false;
          const P = [
            ["Capacitor (uniform field)", (x) => (x < 0.3 ? 1 : x > 0.7 ? 0 : 1 - (x - 0.3) / 0.4)],
            ["pn junction (S-curve)", (x) => 0.5 * (1 + Math.tanh((x - 0.5) / 0.08))],
            ["Charged sheet in the middle", (x) => 1 - 2 * Math.abs(x - 0.5)],
          ];
          function draw() {
            const V = P[k][1], E = (x) => -(V(x + 1e-4) - V(x - 1e-4)) / 2e-4, sgn = flip ? -1 : 1;
            vf.innerHTML = plot({ x: [0, 1], y: flip ? [-1.2, 0.2] : [-0.2, 1.2], xt: [0, 0.5, 1], yt: flip ? [-1, 0] : [0, 1], xl: "position x", yl: flip ? "electron energy −qV" : "potential V", h: 170, series: [{ f: (x) => sgn * V(x), cls: "s1", n: 400 }], label: "Potential (or electron energy) against position" });
            ef.innerHTML = plot({ x: [0, 1], y: [-4, 4], xt: [0, 0.5, 1], yt: [-4, 0, 4], xl: "position x", yl: "field E = −dV/dx", h: 160, series: [{ f: E, cls: "s2", n: 400 }], label: "Electric field against position" });
            ro.innerHTML = readout([["Shape", P[k][0]], ["Where is E biggest?", "where V is steepest"]]);
          }
          host.append(toggle(P.map((p) => p[0]), (i) => { k = i; draw(); }, 0), vf, ef, toggle(["Show potential V", "Show electron energy −qV (band picture)"], (i) => { flip = i === 1; draw(); }, 0), ro);
          draw();
        },
        `<p class="aside">The field (blue) is the negative slope of the orange curve. Flip to the electron-energy view: the landscape turns upside down. Electrons roll “downhill” in that picture, which is uphill in V. That flip is the whole trick of reading band diagrams.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "1.2 V across a 3 nm gate oxide, uniform. Field (MV/cm)?", a: 4, unit: "MV/cm", why: "1.2/(3×10⁻⁷ cm) = 4×10⁶ V/cm. Oxides break down around 10 MV/cm, which is why gate voltages shrink with oxide thickness." },
        { t: "mcq", q: "V rises from left to right. Which way does an electron drift?", opts: [["Right, towards higher V", true, "Force on an electron is −qE, opposite to E; E points left (downhill), so the electron goes right."], ["Left", false, "That's a positive charge's direction."], ["It doesn't move", false, "Any slope means a field and a force."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How are electric potential and electric field related?", model: "The field is minus the slope of the potential: it points from high potential to low, and it's strongest where the potential changes fastest. Positive charges are pushed down the potential slope and electrons up it." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Charge makes field: Gauss and Poisson", mins: 25,
    blurb: "Field lines start on positive charge and end on negative. In one dimension: integrate charge to get field, integrate field to get potential.",
    takeaway: "Gauss's law: the field flux out of a closed surface = enclosed charge/ε. In 1-D: dE/dx = ρ/ε (field changes only where there's charge). With E = −dV/dx this becomes Poisson's equation: d²V/dx² = −ρ/ε. So: charge ρ(x) →(integrate, ÷ε)→ field E(x) →(integrate, × −1)→ potential V(x). A sheet of charge makes a step in E; a uniform slab makes a ramp in E and a parabola in V. Parallel plates: E = σ/ε, C = εA/d. Gate oxide: C_ox = ε_ox/t_ox ≈ 17 fF/µm² at 2 nm.",
    steps: [
      { k: "learn", title: "Sources of field", b: [
        `<p>Field lines start on positive charges and end on negative ones. Count how many leave a box: that's the charge inside (÷ε). In 1-D the box is a thin slice, and the count is how much E changes across it:</p>`,
        `<div class="eq">dE/dx = ρ/ε     d²V/dx² = −ρ/ε</div>`,
        `<p class="aside">ε is the permittivity: ε₀ = 8.85 pF/m in vacuum, 3.9ε₀ in SiO₂, 11.7ε₀ in silicon. Bigger ε: the material weakens the field a given charge makes.</p>`,
      ]},
      { k: "play", title: "The Poisson machine", b: [
        (host) => {
          const rf = el(`<div class="fig"></div>`), ef = el(`<div class="fig"></div>`), vf = el(`<div class="fig"></div>`);
          let k = 0;
          const CH = [
            ["Two opposite slabs (a junction)", (x) => (x > 0.3 && x < 0.5 ? -1 : x >= 0.5 && x < 0.7 ? 1 : 0)],
            ["Two thin sheets (a capacitor)", (x) => (Math.abs(x - 0.3) < 0.01 ? 25 : Math.abs(x - 0.7) < 0.01 ? -25 : 0)],
            ["One uniform slab", (x) => (x > 0.35 && x < 0.65 ? 1 : 0)],
          ];
          function draw() {
            const N = 800, h = 1 / N, xs = Array.from({ length: N + 1 }, (_, i) => i * h), rho = xs.map(CH[k][1]);
            const E = cumint(rho, h), m = k === 2 ? E[N] / 2 : 0, Ec = E.map((v) => v - m), V = cumint(Ec.map((v) => -v), h);
            const pts = (ys) => xs.map((x, i) => [x, ys[i]]), mx = (ys) => Math.max(0.05, ...ys.map(Math.abs)) * 1.2;
            rf.innerHTML = plot({ x: [0, 1], y: [-mx(rho), mx(rho)], xt: [0, 0.5, 1], yt: [0], xl: "x", yl: "charge ρ", h: 120, series: [{ pts: pts(rho), cls: "s4" }], label: "Charge density" });
            ef.innerHTML = plot({ x: [0, 1], y: [-mx(Ec), mx(Ec)], xt: [0, 0.5, 1], yt: [0], xl: "x", yl: "field E = ∫ρ/ε", h: 120, series: [{ pts: pts(Ec), cls: "s2" }], label: "Field from integrating charge" });
            const vm = Math.max(...V), vn = Math.min(...V);
            vf.innerHTML = plot({ x: [0, 1], y: [vn - 0.1 * (vm - vn + 1e-6), vm + 0.1 * (vm - vn + 1e-6)], xt: [0, 0.5, 1], yt: [], xl: "x", yl: "potential V = −∫E", h: 120, series: [{ pts: pts(V), cls: "s1" }], label: "Potential from integrating field" });
          }
          host.append(toggle(CH.map((c) => c[0]), (i) => { k = i; draw(); }, 0), rf, ef, vf);
          draw();
        },
        `<p class="aside">Red: charge. Blue: its running integral, the field. Orange: minus the integral of that, the potential. Sheets make steps in E and kinks in V; slabs make ramps in E and curves (parabolas) in V. Part 3 builds a real pn junction exactly this way.</p>`,
      ]},
      { k: "math", title: "Capacitors from Gauss", b: [
        steps([["Plate charge per area σ, all field between the plates", "E = σ/ε"], ["Voltage across gap d", "V = E·d = σd/ε"], ["Capacitance per area", "C/A = σ/V = ε/d"]]),
        `<div class="eq">C_ox = ε_ox/t_ox</div>`,
        `<p>t<sub>ox</sub> = 2 nm: C<sub>ox</sub> = 3.9 × 8.85×10⁻¹²/2×10⁻⁹ = 0.0173 F/m² = 17.3 fF/µm². This is the C<sub>ox</sub> in every MOSFET current equation (k = μC<sub>ox</sub>W/L).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "C_ox for a 4 nm SiO₂ gate oxide (fF/µm²)?", a: 8.63, tol: 0.02, why: "Half the 2 nm value: 17.3/2 = 8.6 fF/µm²." },
        { t: "mcq", q: "In a region with no charge (ρ = 0), the field is…", opts: [["Constant (it can be non-zero)", true, "dE/dx = 0: flat, not necessarily zero. Between capacitor plates it's constant and large."], ["Always zero", false, "Only its change is zero."], ["Growing linearly", false, "That needs a uniform charge density."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe how you'd get the potential across a region from its charge distribution.", model: "Integrate the charge density divided by the permittivity across the region to get the electric field, since the field only changes where there's charge. Then integrate the field, with a minus sign, to get the potential. That's Poisson's equation done in two steps." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "The pn junction, built by integration", mins: 30,
    blurb: "Charge → field → potential, applied to the depletion region. Out come its width, its peak field and its capacitance.",
    takeaway: "Depletion approximation: charge −qN_A over width x_p on the p side, +qN_D over x_n on the n side. Neutrality: N_A·x_p = N_D·x_n (the lighter-doped side holds most of the width). Integrating once gives a triangular field, peak E_max = qN_Dx_n/ε. Integrating again gives the voltage: V_bi + V_R = ½·E_max·W. Solving: W = √[2ε(V_bi + V_R)/q · (1/N_A + 1/N_D)], with V_bi = V_T ln(N_AN_D/n_i²) ≈ 0.7–0.9 V. Junction capacitance C_j = ε/W ∝ 1/√(V_bi + V_R): a reverse-biased junction is a voltage-controlled capacitor (varactor, Boylestad Ch 16).",
    steps: [
      { k: "learn", title: "The setup", b: [
        `<p>Where p and n regions meet, electrons and holes diffuse across and annihilate, leaving fixed ionised dopants behind: negative acceptors on the p side, positive donors on the n side. That region, empty of mobile carriers, is the <b>depletion region</b>. Treat its charge as two rectangles:</p>`,
        `<div class="eq">ρ = −qN_A (−x_p &lt; x &lt; 0),   +qN_D (0 &lt; x &lt; x_n)</div>`,
        `<p class="aside">Total charge must balance: N<sub>A</sub>x<sub>p</sub> = N<sub>D</sub>x<sub>n</sub>.</p>`,
      ]},
      { k: "play", title: "Build a junction", b: [
        (host, id) => {
          const rf = el(`<div class="fig"></div>`), ef = el(`<div class="fig"></div>`), vf = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let la = 17, ld = 16, VR = 0;
          function draw() {
            const NA = 10 ** la * 1e6, ND = 10 ** ld * 1e6, Vbi = VT * Math.log((NA * ND) / (ni * ni));
            const W = Math.sqrt(((2 * eSi * (Vbi + VR)) / q) * (1 / NA + 1 / ND)), xn = (W * NA) / (NA + ND), xp = (W * ND) / (NA + ND), Em = (q * ND * xn) / eSi;
            const um = 1e6, L = Math.max(xp, xn) * um * 1.4;
            const rho = (x) => (x > -xp * um && x < 0 ? -NA : x >= 0 && x < xn * um ? ND : 0) / Math.max(NA, ND);
            const E = (x) => { const xx = x / um; return xx > -xp && xx <= 0 ? -(q * NA * (xx + xp)) / eSi : xx > 0 && xx < xn ? -(q * ND * (xn - xx)) / eSi : 0; };
            const Vx = (x) => { const xx = x / um; if (xx <= -xp) return 0; if (xx <= 0) return (q * NA * (xx + xp) ** 2) / (2 * eSi); if (xx < xn) return Vbi + VR - (q * ND * (xn - xx) ** 2) / (2 * eSi); return Vbi + VR; };
            rf.innerHTML = plot({ x: [-L, L], y: [-1.3, 1.3], xt: [-L, 0, L].map((v) => +v.toFixed(2)), yt: [-1, 0, 1], xl: "x (µm)", yl: "ρ (relative)", h: 120, series: [{ f: rho, cls: "s4", n: 600 }], label: "Charge in the depletion region" });
            ef.innerHTML = plot({ x: [-L, L], y: [-1.15 * Em / 1e5, 0.15 * Em / 1e5], xt: [-L, 0, L].map((v) => +v.toFixed(2)), yt: [0, -Math.round(Em / 1e5)], xl: "x (µm)", yl: "E (kV/cm)", h: 130, series: [{ f: (x) => E(x) / 1e5, cls: "s2", n: 600 }], label: "Triangular field" });
            vf.innerHTML = plot({ x: [-L, L], y: [-0.1, (Vbi + VR) * 1.15], xt: [-L, 0, L].map((v) => +v.toFixed(2)), yt: [0, +(Vbi + VR).toFixed(2)], xl: "x (µm)", yl: "V (V)", h: 130, series: [{ f: Vx, cls: "s1", n: 600 }], label: "Potential across the junction" });
            ro.innerHTML = readout([["V_bi = V_T ln(N_AN_D/n_i²)", fmt(Vbi, 3) + " V"], ["Width W (x_p + x_n)", `${fmt(W * um, 3)} µm (${fmt(xp * um, 3)} + ${fmt(xn * um, 3)})`], ["Peak field", fmt(Em / 1e5, 3) + " kV/cm"], ["C_j = ε/W", fmt((eSi / W) * 1e3, 3) + " fF/µm²"]]);
          }
          host.append(rf, ef, vf, slider({ id: id + "-a", label: "N_A on the p side (cm⁻³)", min: 15, max: 19, step: 0.1, value: la, show: (v) => "10" + sup(v.toFixed(1).replace(".0", "")) }, (v) => { la = v; draw(); }).el,
            slider({ id: id + "-d", label: "N_D on the n side (cm⁻³)", min: 15, max: 19, step: 0.1, value: ld, show: (v) => "10" + sup(v.toFixed(1).replace(".0", "")) }, (v) => { ld = v; draw(); }).el,
            slider({ id: id + "-r", label: "Reverse bias V_R", min: 0, max: 10, step: 0.1, value: VR, show: (v) => fmt(v, 3) + " V" }, (v) => { VR = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">p side 10¹⁷, n side 10¹⁶ cm⁻³: the depletion region sits mostly (10×) on the lighter n side, about 0.33 µm wide, with a 47 kV/cm peak field. Add 5 V reverse bias: W grows to 0.9 µm and C<sub>j</sub> drops to about a third. Dope both sides heavily and W shrinks below 0.1 µm, the field soars, and the junction breaks down at low voltage (a Zener).</p>`,
      ]},
      { k: "math", title: "The width formula, derived", b: [
        steps([["Integrate ρ/ε: field is a triangle", "E_max = qN_Dx_n/ε = qN_Ax_p/ε"], ["Integrate E: voltage = area of the triangle", "V_bi + V_R = ½E_max·W"], ["Use x_n = W·N_A/(N_A + N_D)", "V = qN_AN_DW²/(2ε(N_A + N_D))"], ["Solve for W", "W = √[2ε(V_bi + V_R)/q · (1/N_A + 1/N_D)]"]]),
        `<p class="aside">The 1/N terms add like resistors in series: the lighter doping dominates. One-sided junction (N<sub>A</sub> ≫ N<sub>D</sub>): W ≈ √[2ε(V)/(qN_D)].</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A one-sided junction has W = 0.3 µm at 0.8 V total. Width at 7.2 V total (µm)?", a: 0.9, tol: 0.01, why: "W ∝ √V: √(7.2/0.8) = 3 → 0.9 µm." },
        { t: "num", q: "…and its capacitance relative to before?", a: 0.3333, tol: 0.01, why: "C = ε/W: a third." },
        { t: "mcq", q: "N_A = 10¹⁸ cm⁻³, N_D = 10¹⁵ cm⁻³. Where is most of the depletion width?", opts: [["On the n side (lightly doped), about 99.9%", true, "N_Ax_p = N_Dx_n: the light side must extend 1000× further to hold the same charge."], ["On the p side", false, "The heavily doped side needs only a thin layer."], ["Equally on both", false, "Only for equal doping."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a reverse-biased pn junction act as a voltage-controlled capacitor?", model: "The depletion region holds equal and opposite fixed charge on its two sides, like the plates of a capacitor separated by the depletion width. More reverse voltage uncovers more dopant charge and widens the region, roughly as the square root of the voltage, so the capacitance, permittivity over width, falls as the voltage rises." },
      ]},
    ],
  };

  const p4 = {
    id: "p4", title: "Current density, drift and sheet resistance", mins: 25,
    blurb: "Current per area, carriers pushed by a field, and why chip resistors are measured in squares.",
    takeaway: "Current density J = I/A (A/m²). Drift: carriers of density n and mobility μ in field E give J = qnμE, so conductivity σ = qnμ and resistivity ρ = 1/(qnμ) (n-type Si at 10¹⁶ cm⁻³: ≈ 0.46 Ω·cm). For a thin layer of thickness t: sheet resistance R_□ = ρ/t, and R = R_□ × L/W: count the squares. Continuity: in any slice, the change in carrier count per time = what flows in − what flows out + generation − recombination; in 1-D, ∂n/∂t = (1/q)∂J_n/∂x + G − R. That's just KCL for carriers.",
    steps: [
      { k: "learn", title: "Drift", b: [
        `<div class="eq">J = q·n·μ·E   σ = qnμ   ρ = 1/σ</div>`,
        `<p>A field pushes carriers at an average drift velocity v = μE (μ: mobility, m²/V·s). Current density = charge per carrier × carriers per volume × velocity. Electron mobility in silicon ≈ 1350 cm²/V·s, holes ≈ 480: why NMOS is faster than PMOS of the same size.</p>`,
      ]},
      { k: "play", title: "Counting squares", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let L = 10, W = 2, k = 1;
          const LAY = [["n-well (≈ 1 kΩ/□)", 1000], ["unsilicided poly (≈ 200 Ω/□)", 200], ["metal 1 (≈ 0.08 Ω/□)", 0.08]];
          function draw() {
            const sq = L / W, Rs = LAY[k][1], c = Math.min(26, 300 / Math.max(L, W * 3));
            let s = `<rect x="10" y="20" width="${L * c}" height="${W * c}" style="fill:var(--accent);opacity:.25;stroke:var(--accent);stroke-width:2"/>`;
            for (let i = 1; i < sq; i++) s += `<line x1="${10 + i * W * c}" y1="20" x2="${10 + i * W * c}" y2="${20 + W * c}" style="stroke:var(--accent);stroke-dasharray:3 3"/>`;
            s += S.t(10 + (L * c) / 2, 14, `L = ${L} µm`, { cls: "lab" }) + S.t(16 + L * c, 24 + (W * c) / 2, `W = ${W} µm`, { a: "start", cls: "lab" });
            f.innerHTML = S.svg(Math.max(320, L * c + 110), W * c + 40, s, { label: "A resistor drawn as a strip, divided into W-by-W squares", max: 520 });
            ro.innerHTML = readout([["Squares L/W", fmt(sq, 3)], ["R_□", Rs + " Ω/□"], ["R = R_□·L/W", si(Rs * sq, "Ω", 3)]]);
          }
          host.append(toggle(LAY.map((l) => l[0]), (i) => { k = i; draw(); }, 1), f, slider({ id: id + "-l", label: "Length L", min: 1, max: 40, step: 1, value: L, show: (v) => v + " µm" }, (v) => { L = v; draw(); }).el,
            slider({ id: id + "-w", label: "Width W", min: 0.5, max: 10, step: 0.5, value: W, show: (v) => v + " µm" }, (v) => { W = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">A square of any size has the same resistance R<sub>□</sub>: twice as long, but also twice as wide. So layout engineers count squares. A 10 kΩ poly resistor at 200 Ω/□ is 50 squares; a long metal bus of 1000 squares is still only 80 Ω, but at amps of current that's a real IR drop.</p>`,
      ]},
      { k: "learn", title: "Continuity: KCL for carriers", b: [
        `<div class="eq">∂n/∂t = (1/q)·∂J_n/∂x + G − R</div>`,
        `<p>Carriers in a thin slice change because current carries them in or out, because heat or light generates new pairs (G), or because pairs recombine (R). In steady state, ∂n/∂t = 0. Part 5 uses this with diffusion.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A poly resistor at 200 Ω/□, 1 µm wide, 25 µm long. R (kΩ)?", a: 5, unit: "kΩ", why: "25 squares × 200 = 5 kΩ." },
        { t: "num", q: "n-type Si, n = 10¹⁷ cm⁻³, μ = 800 cm²/V·s. Resistivity (Ω·cm)?", a: 0.078, tol: 0.02, why: "1/(1.6×10⁻¹⁹ × 10¹⁷ × 800) = 0.078 Ω·cm." },
        { t: "mcq", q: "Electron mobility is about 2.8× hole mobility in silicon. To make a PMOS as strong as an NMOS, a designer usually…", opts: [["Makes the PMOS about 2–3× wider", true, "Current ∝ μW/L: compensate the lower mobility with width."], ["Makes it longer", false, "Longer reduces current."], ["Uses a thicker oxide", false, "That lowers C_ox and current."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the resistance of a thin film quoted in ohms per square?", model: "For a layer of fixed thickness, resistance is resistivity over thickness, times length over width. Any square has length equal to width, so every square has the same resistance whatever its size. Quoting ohms per square lets you get any resistor's value by counting how many squares long it is." },
      ]},
    ],
  };

  const p5 = {
    id: "p5", title: "Diffusion: from random walks to diode currents", mins: 30,
    blurb: "Carriers wander randomly. Where there are more of them, more wander away: a current that flows down the gradient. It's what makes diodes and BJTs work.",
    takeaway: "Fick's law: diffusion current flows from high to low concentration, J_n = qD_n·dn/dx (electrons; holes have a minus sign). Combined with continuity: ∂n/∂t = D·∂²n/∂x² − (n − n₀)/τ. A pulse of carriers spreads as a Gaussian with σ = √(2Dt): the random-walk √N law again. With recombination (lifetime τ), injected carriers decay as e^(−x/L), L = √(Dτ), the diffusion length. Einstein: D/μ = kT/q, so D_n ≈ 35 cm²/s in Si. A forward-biased diode injects e^(V/V_T) more minority carriers at its edge; the slope of the profile sets the current, giving I ∝ e^(V/V_T). In a BJT's thin base (W ≪ L) the profile is a straight line and I_C = qAD·n(0)/W.",
    steps: [
      { k: "why", title: "No force, yet a current", b: [
        `<p>Each carrier jitters randomly. If one side of a plane has more carriers than the other, more cross from the crowded side than come back: a net flow from high to low concentration, with no field at all.</p>`,
        `<div class="eq">J_n = q·D_n·dn/dx</div>`,
        `<p class="aside">D is the diffusion coefficient (cm²/s). Einstein's relation ties it to mobility: D = μ·kT/q = μ·V<sub>T</sub>. Electrons in Si: 1350 × 0.0259 ≈ 35 cm²/s.</p>`,
      ]},
      { k: "play", title: "Spreading and decaying", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let mode = 0, t = 1, Lr = 1, Wb = 0.3;
          function draw() {
            if (mode === 0) {
              const D = 1, sd = Math.sqrt(2 * D * t);
              f.innerHTML = plot({ x: [-6, 6], y: [0, 1.3], xt: [-6, -3, 0, 3, 6], yt: [0, 0.5, 1], xl: "position x", yl: "concentration", h: 220, series: [{ f: (x) => (Math.exp(-(x * x) / (4 * D * 0.05)) / Math.sqrt(4 * Math.PI * D * 0.05)) * 2, cls: "s5", n: 600 }, { f: (x) => Math.exp(-(x * x) / (4 * D * t)) / Math.sqrt(4 * Math.PI * D * t) * 2, cls: "s1", n: 600 }], marks: [{ x: sd, y: 0.05, cls: "mkb" }, { x: -sd, y: 0.05, cls: "mkb" }], label: "A pulse of carriers spreading out by diffusion" });
              ro.innerHTML = readout([["Time t (D = 1)", fmt(t, 3)], ["Spread σ = √(2Dt)", fmt(sd, 3)], ["4× the time →", "2× the spread"]]);
            } else {
              const prof = (x) => (Lr > 50 * Wb ? Math.max(0, 1 - x / Wb) : Math.sinh((Wb - x) / Lr) / Math.sinh(Wb / Lr));
              f.innerHTML = plot({ x: [0, 3], y: [0, 1.1], xt: [0, 1, 2, 3], yt: [0, 0.5, 1], xl: "distance from the junction (in units of L₀)", yl: "excess carriers", h: 220, series: [{ f: (x) => Math.exp(-x / Lr), cls: "s1", n: 400 }, { f: (x) => (x <= Wb ? prof(x) : NaN), to: Wb, cls: "s2", n: 300 }], label: "Injected minority carriers: long region decays exponentially (orange); thin base with a collecting contact is nearly a straight line (blue)" });
              ro.innerHTML = readout([["Diffusion length L = √(Dτ)", fmt(Lr, 3)], ["Long region: n ∝ e^(−x/L), current ∝ n(0)/L", "diode"], ["Thin base W = " + fmt(Wb, 3) + ": slope ≈ n(0)/W", "BJT: current ∝ n(0)/W, much larger"]]);
            }
          }
          const ctl = el(`<div></div>`);
          function controls() {
            ctl.replaceChildren(...(mode === 0 ? [slider({ id: id + "-t", label: "Time", min: 0.05, max: 4, step: 0.05, value: t }, (v) => { t = v; draw(); }).el] : [slider({ id: id + "-L", label: "Diffusion length L (recombination)", min: 0.2, max: 3, step: 0.05, value: Lr }, (v) => { Lr = v; draw(); }).el, slider({ id: id + "-w", label: "Base width W (for the blue curve)", min: 0.1, max: 1, step: 0.05, value: Wb }, (v) => { Wb = v; draw(); }).el]));
          }
          host.append(toggle(["A pulse spreading", "Steady injection: diode vs BJT base"], (i) => { mode = i; controls(); draw(); }, 0), f, ctl, ro);
          controls(); draw();
        },
        `<p class="aside">Left mode: a narrow pulse (grey) spreads into a widening, flattening bell; its width grows as √t, not t, the signature of a random walk. Right mode: carriers injected at a junction diffuse away and recombine, decaying over the diffusion length (orange). In a BJT the base is much thinner than L and the collector sweeps carriers out at x = W, so the profile is nearly straight (blue) and steep: a big diffusion current, which is the collector current.</p>`,
      ]},
      { k: "math", title: "Why a diode's current is exponential", b: [
        steps([["Forward bias V lowers the junction barrier", "minority carriers at the edge: n(0) = n₀·e^(V/V_T)"], ["Excess carriers diffuse away", "n − n₀ ∝ (e^(V/V_T) − 1)·e^(−x/L)"], ["Current = qD × slope at the edge", "J = (qDn₀/L)(e^(V/V_T) − 1)"], ["That's the diode equation", "I = I_S(e^(V/V_T) − 1)"]]),
        `<p class="aside">So I<sub>S</sub> = qA·D·n₀/L (plus the matching hole term). Boylestad Chapter 1's diode equation, now derived from diffusion.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Electrons with μ = 1350 cm²/V·s at 300 K (V_T = 25.9 mV). D (cm²/s)?", a: 35, tol: 0.02, why: "1350 × 0.0259 = 35 cm²/s." },
        { t: "num", q: "D = 35 cm²/s, lifetime τ = 1 µs. Diffusion length (µm)?", a: 59, tol: 0.02, why: "√(35 × 10⁻⁶) cm = 5.9×10⁻³ cm = 59 µm." },
        { t: "num", q: "How far do carriers spread (σ = √(2Dt)) in 1 ns with D = 35 cm²/s (µm)?", a: 2.65, tol: 0.02, why: "√(70×10⁻⁹) cm = 2.65×10⁻⁴ cm = 2.65 µm." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain diffusion current without using any equations.", model: "Carriers move around randomly. Where there are more of them, more wander out than wander in, so on average carriers flow from crowded regions to sparse ones. That net flow is a current even with no electric field, and it's bigger where the concentration changes more steeply." },
      ]},
    ],
  };

  const p6 = {
    id: "p6", title: "Master it", mins: 30,
    blurb: "Fields, junctions, resistors and diffusion.",
    takeaway: "You can move between potential and field, use Gauss and Poisson to get fields from charge, derive and use the depletion-width formula, compute resistance from sheet values, and reason about drift and diffusion currents.",
    steps: [
      { k: "check", title: "Problem 1", b: [
        { t: "num", q: "A MOSFET with C_ox = 17 fF/µm², W = 2 µm, L = 0.1 µm. Gate oxide capacitance (fF)?", a: 3.4, tol: 0.01, why: "17 × 0.2 µm² = 3.4 fF." },
      ]},
      { k: "check", title: "Problem 2", b: [
        { t: "num", q: "Symmetric junction, N_A = N_D = 10¹⁷ cm⁻³, V_bi ≈ 0.83 V. Using W = √[2ε V(1/N_A + 1/N_D)/q] with ε_Si = 1.04×10⁻¹² F/cm, W at zero bias (µm)?", a: 0.147, tol: 0.03, hint: "Work in cm: 2 × 1.04×10⁻¹² × 0.83 × (2×10⁻¹⁷)/1.6×10⁻¹⁹.", why: "= 2.16×10⁻¹⁰ cm², W = 1.47×10⁻⁵ cm = 0.147 µm." },
      ]},
      { k: "check", title: "Problem 3", b: [
        { t: "num", q: "Peak field in that junction (kV/cm)? (V_bi = ½E_max·W.)", a: 113, tol: 0.03, why: "2 × 0.83/1.47×10⁻⁵ cm = 1.13×10⁵ V/cm = 113 kV/cm." },
      ]},
      { k: "check", title: "Problem 4", b: [
        { t: "num", q: "A metal power line 40 µm wide and 2 mm long at 0.05 Ω/□ carries 50 mA. IR drop (mV)?", a: 125, tol: 0.01, why: "2 mm/40 µm = 50 squares × 0.05 Ω = 2.5 Ω; × 50 mA = 125 mV. A 2 µm-wide line would be 1000 squares and drop 2.5 V: why power grids use wide, parallel straps." },
      ]},
      { k: "check", title: "Problem 5", b: [
        { t: "mcq", q: "A BJT's base is 0.1 µm thick, an older design's 1 µm, with the same emitter injection. Collector current is about…", opts: [["10× larger for the thin base", true, "I_C ∝ n(0)/W_B: the slope of the straight-line profile."], ["10× smaller", false, "A thinner base gives a steeper gradient."], ["The same", false, "Diffusion current depends on the gradient."]] },
      ]},
      { k: "say", title: "Problem 6: explain it", b: [
        { t: "say", q: "Trace how a forward-biased diode's current comes from the math in this module.", model: "In equilibrium, the depletion region's charge creates a field and a built-in potential that holds carriers back, found by integrating Poisson's equation. Forward bias lowers that barrier, so the minority carrier concentration at the edge of each side rises by a factor of e to the V over V_T. Those extra carriers diffuse away, recombining over a diffusion length, and the diffusion current is q D times the concentration gradient at the edge, which is proportional to e to the V over V_T minus one: the diode equation." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "m39", eyebrow: "Math Toolkit · Module 39", title: "Fields, Flux and Diffusion",
    intro: `<p>Six parts: potential and field, Gauss and Poisson, the pn junction built by integration, current density and sheet resistance, diffusion (and where the diode equation comes from), and mastery problems.</p><p>Why a chip designer needs this: it's the math under every device model. Threshold voltage, junction capacitance, breakdown, resistor layout and diode currents all come from these few equations.</p><p class="aside">Before this: Modules 13–15 (calculus) and 27 Part 5 (gradients). Pairs with Boylestad Chapters 1 and 16, 6.002 Chapter 16 and Appendix A.</p>`,
    after: `<p>That completes the math. Next in the chip-design track come the devices themselves (semiconductor physics and the real MOSFET), then digital and analog IC design.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <p><b>Field:</b> E = −dV/dx (E = −∇V). Electron energy = −qV (band diagrams are V upside down).</p>
      <div class="eq">dE/dx = ρ/ε   d²V/dx² = −ρ/ε</div>
      <p>Charge → ∫/ε → field → −∫ → potential. Plates: E = σ/ε, C/A = ε/d; C_ox = ε_ox/t_ox (2 nm → 17.3 fF/µm²). ε₀ = 8.85 pF/m; SiO₂ 3.9ε₀; Si 11.7ε₀.</p>
      <p><b>Junction:</b> N_Ax_p = N_Dx_n; E_max = qN_Dx_n/ε; V_bi + V_R = ½E_maxW; W = √[2ε(V_bi + V_R)(1/N_A + 1/N_D)/q]; V_bi = V_T ln(N_AN_D/n_i²); C_j = ε/W ∝ (V_bi + V_R)^(−½).</p>
      <p><b>Drift:</b> J = qnμE; ρ = 1/(qnμ). Sheet: R = R_□·L/W. Continuity: ∂n/∂t = (1/q)∂J/∂x + G − R.</p>
      <p><b>Diffusion:</b> J_n = qD dn/dx; D = μV_T (≈ 35 cm²/s, e⁻ in Si); spread √(2Dt); L = √(Dτ). Diode: n(0) ∝ e^(V/V_T) → I = I_S(e^(V/V_T) − 1). Thin base: I_C ∝ n(0)/W_B.</p>`,
  };
  Course.start(window.CHAPTER);
})();
