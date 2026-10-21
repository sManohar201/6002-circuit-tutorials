(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const seenB = (html, href, where) => `<div class="key"><b>Seen in Boylestad:</b> ${html} <a href="../edc/${href}">${where} →</a></div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const mathLink = (html, href, where) => `<p class="aside">${html} <a href="../math/${href}">${where} →</a></p>`;
  const sup = (v) => "10" + String(v).replace("-", "⁻").split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d] || d).join("");

  /* Label heights for stacked curves: at least `gap` apart, working up from the lowest. */
  function labelYs(vals, top, gap = 36) {
    const order = vals.map((v, i) => i).sort((a, b) => vals[a] - vals[b]), out = [];
    let prev = -Infinity;
    order.forEach((i) => { prev = Math.min(top, Math.max(vals[i] + 10, prev + gap)); out[i] = prev; });
    return out;
  }

  /* Long-channel (Shockley) model with optional channel-length modulation λ. Volts, amps. */
  function ids(Vgs, Vds, beta, Vt, lam = 0) {
    const VGT = Vgs - Vt;
    if (VGT <= 0 || Vds <= 0) return 0;
    if (Vds < VGT) return beta * (VGT - Vds / 2) * Vds * (1 + lam * Vds);
    return (beta / 2) * VGT * VGT * (1 + lam * Vds);
  }
  const EPS0 = 8.85e-14, KOX = 3.9;
  const coxOf = (toxA) => (KOX * EPS0) / (toxA * 1e-8); // F/cm² from tox in ångström

  /* Inverter operating point: VDD = 1, |Vt| = 0.3, βn = 1, βp = r. Solves Idn = |Idp| for Vout by bisection. */
  function vout(Vin, r, VDD = 1, Vtn = 0.3, Vtp = 0.3, lam = 0.08) {
    let lo = 0, hi = VDD;
    for (let i = 0; i < 50; i++) {
      const m = (lo + hi) / 2, f = ids(Vin, m, 1, Vtn, lam) - ids(VDD - Vin, VDD - m, r, Vtp, lam);
      if (f > 0) hi = m; else lo = m;
    }
    return (lo + hi) / 2;
  }
  function noiseMargins(r) {
    const N = 400, xs = [], ys = [];
    for (let i = 0; i <= N; i++) { xs.push(i / N); ys.push(vout(i / N, r)); }
    let a = null, b = null;
    for (let i = 1; i < N; i++) { const sl = (ys[i + 1] - ys[i - 1]) / (xs[i + 1] - xs[i - 1]); if (sl <= -1 && a === null) a = i; if (sl <= -1) b = i; }
    if (a === null) return null;
    let vinv = 0.5; for (let i = 0; i < N; i++) if (ys[i] >= xs[i] && ys[i + 1] < xs[i + 1]) vinv = xs[i];
    return { VIL: xs[a], VOH: ys[a], VIH: xs[b], VOL: ys[b], vinv };
  }

  /* =============== PART 1 =============== */
  function mosCap(Vg, Vt) {
    let s = `<rect x="80" y="30" width="260" height="30" style="fill:var(--bad);opacity:.6;stroke:var(--ink)"/>` + S.t(74, 50, "gate", { a: "end", cls: "s" });
    s += `<rect x="80" y="60" width="260" height="8" style="fill:var(--line);stroke:var(--ink)"/>` + S.t(346, 63, "oxide", { a: "start", cls: "s m" });
    s += `<rect x="40" y="68" width="340" height="150" style="fill:var(--card);stroke:var(--ink)"/>` + S.t(360, 210, "p-type body", { a: "end", cls: "s m" });
    s += S.t(210, 22, `V_g = ${fmt(Vg, 2)} V`, { cls: "s a" });
    const gq = Vg >= 0 ? "+" : "−";
    for (let i = 0; i < Math.min(9, Math.round(Math.abs(Vg) * 9)); i++) s += S.t(98 + i * 28, 44, gq, { cls: "s" });
    if (Vg < 0) { for (let i = 0; i < Math.round(-Vg * 9); i++) s += `<circle cx="${100 + i * 28}" cy="78" r="6" style="fill:var(--accent);opacity:.8"/>` + S.t(100 + i * 28, 82, "+", { cls: "s" }); }
    else {
      const dep = Math.min(70, 25 + 45 * Math.sqrt(Math.min(Vg, Vt) / Vt));
      s += `<rect x="80" y="68" width="260" height="${dep}" style="fill:var(--cool-soft);opacity:.8"/>` + S.t(210, 68 + dep - 6, "depletion region (no free carriers)", { cls: "s m" });
      if (Vg > Vt) { const n = Math.min(10, Math.round((Vg - Vt) * 14) + 2); for (let i = 0; i < n; i++) s += `<circle cx="${92 + i * 26}" cy="75" r="5" style="fill:var(--cool)"/>` + S.t(92 + i * 26, 79, "−", { cls: "s" }); s += S.t(210, 100, "inversion layer of electrons", { cls: "s c" }); }
    }
    return S.svg(420, 230, s, { max: 420, label: "MOS capacitor in accumulation, depletion or inversion" });
  }
  const p1 = {
    id: "p1", title: "The MOS structure and three regions", mins: 20,
    blurb: "Accumulation, depletion, inversion. Then cutoff, linear and saturation for the transistor.",
    takeaway: "MOS transistors are majority-carrier devices: a gate voltage controls the current in a channel between source and drain (electrons in nMOS, holes in pMOS). The MOS structure (gate, thin SiO₂ gate oxide, doped body): with a p-type body, a negative gate voltage attracts holes (accumulation); a small positive voltage repels them, leaving a depletion region; above the threshold V_t, free electrons gather under the gate as an inversion layer. V_t depends on body doping and oxide thickness t_ox. nMOS: V_gs < V_t: cutoff (OFF; small leakage still matters). V_gs > V_t: a channel forms. Small V_ds: linear (resistive, triode) region, I_ds rises with V_ds and V_gs. When V_gd < V_t the channel pinches off near the drain: saturation, I_ds set by V_gs and nearly independent of V_ds (a current source); electrons still cross the depletion region near the drain. pMOS works the opposite way (n-body tied high, holes); thresholds are V_tn and V_tp. By convention carriers flow from source to drain: the nMOS source is the more negative terminal; in static CMOS, the source is the terminal nearer the supply rail.",
    steps: [
      { k: "play", title: "Charge the gate", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), vd = el(`<span class="verdict"></span>`);
          let Vg = 0.6;
          const Vt = 0.3;
          function draw() { f.innerHTML = mosCap(Vg, Vt); vd.className = "verdict " + (Vg < 0 ? "mid" : Vg < Vt ? "mid" : "ok"); vd.textContent = Vg < 0 ? "Accumulation: holes pile up under the gate." : Vg < Vt ? "Depletion: holes pushed away, no free carriers yet." : "Inversion: above V_t, electrons form a conducting layer."; }
          host.append(f, slider({ id: id + "-g", label: "Gate voltage (V_t = 0.3 V)", min: -1, max: 1, step: 0.02, value: Vg, show: (x) => fmt(x, 2) + " V" }, (x) => { Vg = x; draw(); }).el, vd);
          draw();
        },
        `<p>Gate on top, a very thin oxide insulator, then the p-type body (grounded). Almost no current crosses the oxide. The gate voltage decides what's at the surface below it.</p>`,
        `<p class="aside">V<sub>t</sub> depends on the body's doping and the oxide thickness t<sub>ox</sub>. Usually positive, but it can be engineered to be negative.</p>`,
      ]},
      { k: "learn", title: "Three regions of the transistor", b: [
        `<div class="tbl"><table><thead><tr><th>Region</th><th>Condition</th><th>Behaviour</th></tr></thead><tbody>
          <tr><td>Cutoff</td><td>V<sub>gs</sub> &lt; V<sub>t</sub></td><td>OFF: I<sub>ds</sub> ≈ 0 (leakage aside)</td></tr>
          <tr><td>Linear</td><td>V<sub>gs</sub> &gt; V<sub>t</sub>, small V<sub>ds</sub></td><td>a resistor: I<sub>ds</sub> grows with V<sub>ds</sub></td></tr>
          <tr><td>Saturation</td><td>V<sub>gd</sub> &lt; V<sub>t</sub> (V<sub>ds</sub> large)</td><td>channel pinched off at the drain: a current source</td></tr></tbody></table></div>`,
        `<p>In saturation, electrons still reach the drain: they're injected into the depletion region near it and swept across. The current is now set by V<sub>gs</sub> alone.</p>`,
        seenB("Pinch-off and the square law for enhancement MOSFETs.", "06-fets.html#p8", "Chapter 6, Part 8"),
      ]},
      { k: "learn", title: "Source, drain and pMOS", b: [
        `<p>Physically, source and drain are identical. By convention, carriers flow from <b>source</b> to <b>drain</b>: for nMOS (electrons) the source is the <b>more negative</b> terminal; for pMOS (holes) the <b>more positive</b>. In a static CMOS gate, the source is the end nearer the supply rail.</p>`,
        `<p>pMOS: n-type body tied to V<sub>DD</sub>, ON when the gate is a threshold below the source. We write V<sub>tn</sub> and V<sub>tp</sub> (V<sub>tp</sub> is negative) and usually just drop the signs for pMOS.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "An nMOS with V_t = 0.3 V. Which region?", bins: ["Cutoff", "Linear", "Saturation"], items: [
          ["V_gs = 0.2, V_ds = 1.0", 0, "Below threshold."],
          ["V_gs = 1.0, V_ds = 0.1", 1, "V_gd = 0.9 > V_t: channel all the way across."],
          ["V_gs = 1.0, V_ds = 1.0", 2, "V_gd = 0 < V_t: pinched off at the drain."],
          ["V_gs = 0.6, V_ds = 0.2", 1, "V_gd = 0.4 > 0.3."],
          ["V_gs = 0.6, V_ds = 0.5", 2, "V_gd = 0.1 < 0.3."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What happens at the drain end of the channel when an nMOS enters saturation?", model: "When the drain voltage rises so far that the gate-to-drain voltage drops below the threshold, the channel is no longer inverted near the drain: it pinches off. Electrons still flow, crossing the depletion region near the drain, but the current stops depending on the drain voltage and is set by the gate voltage, like a current source." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "The long-channel (Shockley) model", mins: 30,
    blurb: "Charge in the channel divided by the time to cross it. Out comes the square law.",
    takeaway: "Long-channel model (also ideal, first-order, Shockley): assumes low lateral fields. Channel charge Q = C_g(V_gc − V_t), with the average gate-to-channel voltage V_gc = V_gs − V_ds/2. Gate capacitance C_g = C_ox·W·L, with C_ox = ε_ox/t_ox (ε_ox = 3.9 ε₀, ε₀ = 8.85×10⁻¹⁴ F/cm). Carriers drift at v = µE, with E = V_ds/L; crossing time L/v. So I_ds = Q/(L/v) = β(V_GT − V_ds/2)V_ds in the linear region, with β = µC_ox·W/L, V_GT = V_gs − V_t (and k′ = µC_ox). It saturates at V_dsat = V_GT, where I_ds = (β/2)V_GT²: square-law behaviour. I_on = (β/2)(V_DD − V_t)² (V_gs = V_ds = V_DD); I_off = 0 in this model. Low-field electron mobility ~500–700 cm²/V·s, but at real fields it's much lower (80 cm²/V·s in the book's 65 nm example). pMOS: signs reversed, hole mobility about 2–3× lower (the book uses 2), so less current and slower for the same size. With high-k dielectrics, t_ox is the equivalent oxide thickness.",
    steps: [
      { k: "learn", title: "Charge ÷ time", b: [
        `<p>Current = charge in the channel ÷ time to cross it.</p>`,
        `<ol><li><b>Charge:</b> the gate is a capacitor. Q = C<sub>g</sub>(V<sub>gc</sub> − V<sub>t</sub>), where V<sub>gc</sub> = V<sub>gs</sub> − V<sub>ds</sub>/2 is the average gate-to-channel voltage, and C<sub>g</sub> = C<sub>ox</sub>WL with C<sub>ox</sub> = ε<sub>ox</sub>/t<sub>ox</sub>.</li><li><b>Speed:</b> v = µE, with E = V<sub>ds</sub>/L. Crossing time = L/v.</li></ol>`,
        `<div class="eq">I<sub>ds</sub> = µC<sub>ox</sub>(W/L)(V<sub>GT</sub> − V<sub>ds</sub>/2)V<sub>ds</sub> = β(V<sub>GT</sub> − V<sub>ds</sub>/2)V<sub>ds</sub></div>`,
        `<p class="aside">V<sub>GT</sub> = V<sub>gs</sub> − V<sub>t</sub>. β = µC<sub>ox</sub>W/L. Some books call µC<sub>ox</sub> “k′”; check the definition before using quoted data.</p>`,
      ]},
      { k: "learn", title: "Saturation and the square law", b: [
        `<p>The linear-region formula peaks at V<sub>ds</sub> = V<sub>GT</sub>, where the channel pinches off. Beyond that the current stays at its peak:</p>`,
        `<div class="eq">I<sub>ds</sub> = (β/2) V<sub>GT</sub><sup>2</sup>     (V<sub>ds</sub> &gt; V<sub>dsat</sub> = V<sub>GT</sub>)</div>`,
        `<p>Two figures of merit: <b>I<sub>on</sub></b> (V<sub>gs</sub> = V<sub>ds</sub> = V<sub>DD</sub>) = (β/2)(V<sub>DD</sub> − V<sub>t</sub>)<sup>2</sup>, and <b>I<sub>off</sub></b> (V<sub>gs</sub> = 0), which this model says is 0. Part 7 corrects that.</p>`,
        seen("The same square law as the SCS model, with K = β.", "07-mosfet-amplifier.html#p3", "Chapter 7, Part 3"),
      ]},
      { k: "play", title: "I-V curves", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let WL = 2, tox = 10.5, mu = 80, Vt = 0.3, pm = 0;
          function draw() {
            const cox = coxOf(tox), beta = (pm ? mu / 2 : mu) * cox * WL;
            const vgs = [0.4, 0.6, 0.8, 1.0];
            f.innerHTML = plot({ x: [0, 1], y: [0, 300], xt: [0, 0.2, 0.4, 0.6, 0.8, 1], yt: [0, 100, 200, 300], xl: "V_ds (V)", yl: "I_ds (µA)",
              series: vgs.map((g, i) => ({ f: (v) => ids(g, v, beta, Vt) * 1e6, cls: i === 3 ? "s1" : "s2" })).concat([{ f: (v) => (v <= 1 - Vt ? (beta / 2) * v * v * 1e6 : NaN), cls: "s5" }]),
              texts: labelYs(vgs.map((g) => ids(g, 1, beta, Vt) * 1e6), 290).map((y, i) => ({ x: 0.82, y, s: "V_gs=" + vgs[i] })), label: "Long-channel nMOS I-V characteristics" });
            ro.innerHTML = readout([["C_ox = ε_ox/t_ox", fmt(cox * 1e15 / 1e8, 3) + " fF/µm²"], ["β = µC_ox·W/L", fmt(beta * 1e6, 3) + " µA/V²"], ["I_on (V_DD = 1 V)", fmt(ids(1, 1, beta, Vt) * 1e6, 3) + " µA"]]);
          }
          host.append(toggle(["nMOS", "pMOS (µ halved, signs dropped)"], (i) => { pm = i; draw(); }), f,
            slider({ id: id + "-w", label: "W/L", min: 1, max: 8, step: 0.5, value: WL, show: (x) => fmt(x, 2) }, (x) => { WL = x; draw(); }).el,
            slider({ id: id + "-t", label: "Oxide thickness t_ox", min: 8, max: 40, step: 0.5, value: tox, show: (x) => fmt(x, 3) + " Å" }, (x) => { tox = x; draw(); }).el,
            slider({ id: id + "-m", label: "Mobility µ (electrons)", min: 40, max: 300, step: 5, value: mu, show: (x) => x + " cm²/V·s" }, (x) => { mu = x; draw(); }).el,
            slider({ id: id + "-v", label: "Threshold V_t", min: 0.1, max: 0.6, step: 0.01, value: Vt, show: (x) => fmt(x, 2) + " V" }, (x) => { Vt = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">The book's 65 nm example: W/L = 2 (100/50 nm), t<sub>ox</sub> = 10.5 Å, µ = 80 cm²/V·s, V<sub>t</sub> = 0.3 V. The dashed curve is the edge of saturation, V<sub>ds</sub> = V<sub>GT</sub>. Thinner oxide or wider transistors give more current.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "µC_ox = 263 µA/V² and W/L = 3. What is β?", a: 789, tol: 0.01, unit: "µA/V²", why: "β = µC_ox·W/L = 263 × 3." },
        { t: "num", q: "With β = 789 µA/V², V_t = 0.3 V, what is the saturation current at V_gs = 0.8 V?", a: 98.6, tol: 0.02, unit: "µA", hint: "(β/2)(0.5)².", why: "394.5 × 0.25 = 98.6 µA." },
        { t: "mcq", q: "A pMOS has the same W/L as an nMOS, with hole mobility half the electron mobility. Compared with the nMOS, its saturation current is…", opts: [["About half: β is proportional to µ", true, "That's why pMOS are drawn about twice as wide."], ["The same", false, "β depends on mobility."], ["A quarter", false, "Current is linear in β, not squared."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Where does each factor in β = µC_oxW/L come from?", model: "C_ox·W·L is the gate capacitance, which sets how much channel charge a given gate overdrive attracts. µ sets how fast that charge moves for a given field, and the field is V_ds/L. Dividing the charge by the crossing time L/(µV_ds/L) leaves µC_ox·W/L: more width means more charge, more length means both more charge and a much longer, slower trip." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Capacitances", mins: 25,
    blurb: "The gate is a capacitor on purpose; source and drain junctions are capacitors by accident.",
    takeaway: "Simple models (for delay and power): gate capacitance C_g = C_ox·W·L, usually treated as terminating at the source (C_gs). With minimum L, C_g = C_permicron·W where C_permicron = C_ox·L = (ε_ox/t_ox)·L, roughly constant across nodes when L and t_ox scale together: about 2 fF/µm in old processes, ~1 fF/µm at 90 and 65 nm. Source and drain diffusions form reverse-biased p–n junctions with the body: parasitic diffusion capacitances C_sb and C_db, depending on area, perimeter, doping and voltage; contacted diffusion is comparable to gate capacitance (~1–2 fF/µm of width); shared or merged (uncontacted) diffusion is smaller. Keep diffusion small on switching nodes; hand estimates use C_g = C_sb = C_db ≈ 1 fF/µm. Detailed gate model: intrinsic C₀ = WLC_ox splits as C_gb (cutoff, falling as depletion forms), C_gs = C_gd = C₀/2 (linear), C_gs = (2/3)C₀ and C_gd = 0 (saturation), plus overlap capacitances C_gsol = C_gdol ≈ 0.2–0.4 fF/µm. The effective gate capacitance depends on what the source and drain are doing. Junction capacitance: C_sb = AS·C_jbs + PS·C_jbssw, with C_j = CJ(1 + V_sb/ψ₀)^(−MJ), MJ ≈ 0.33–0.5, built-in potential ψ₀ = v_T ln(N_A N_D/n_i²), v_T = kT/q ≈ 26 mV, n_i = 1.45×10¹⁰ cm⁻³ at 300 K. Digital designers average it over the switching range.",
    steps: [
      { k: "learn", title: "Gate capacitance", b: [
        `<div class="eq">C<sub>g</sub> = C<sub>ox</sub>WL = C<sub>permicron</sub> · W     C<sub>permicron</sub> = (ε<sub>ox</sub>/t<sub>ox</sub>) · L</div>`,
        `<p>Logic uses minimum L, so gate capacitance is just proportional to width. When a new process shrinks both L and t<sub>ox</sub>, C<sub>permicron</sub> stays roughly the same: about 2 fF/µm in old processes, about <b>1 fF/µm</b> at 90 and 65 nm.</p>`,
        `<p class="aside">High gate capacitance is the point: it's what attracts the channel charge and gives a high current.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Gate oxide 12 Å, channel length 45 nm. What is C_permicron? (ε_ox = 3.9 × 8.85×10⁻¹⁴ F/cm)", a: 1.294, tol: 0.02, unit: "fF/µm", hint: "C_ox = 3.45×10⁻¹³ / 1.2×10⁻⁷ F/cm² = 2.88 µF/cm² = 28.8 fF/µm². Multiply by L = 0.045 µm.", why: "28.8 fF/µm² × 0.045 µm ≈ 1.29 fF/µm." },
      ]},
      { k: "learn", title: "Diffusion capacitance", b: [
        `<p>Source and drain are p–n junctions with the body, reverse-biased. Their depletion regions act like insulators between conductors: <b>parasitic</b> capacitances C<sub>sb</sub> and C<sub>db</sub>.</p>`,
        `<p>They depend on the diffusion's <b>area</b> and <b>perimeter</b>, doping and voltage. For hand work: contacted diffusion ≈ gate capacitance, so take <b>C<sub>g</sub> ≈ C<sub>sb</sub> ≈ C<sub>db</sub> ≈ 1 fF/µm</b>. Diffusion shared between two series transistors, or merged without a contact, is a bit smaller.</p>`,
        `<p class="aside">Diffusion has high capacitance and high resistance, so keep it small on any node that switches.</p>`,
      ]},
      { k: "learn", title: "Where the gate charge goes", b: [
        `<div class="tbl"><table><thead><tr><th></th><th>Cutoff</th><th>Linear</th><th>Saturation</th></tr></thead><tbody>
          <tr><td>C<sub>gb</sub></td><td>≤ C<sub>0</sub></td><td>0</td><td>0</td></tr>
          <tr><td>C<sub>gs</sub></td><td>0</td><td>C<sub>0</sub>/2</td><td>2C<sub>0</sub>/3</td></tr>
          <tr><td>C<sub>gd</sub></td><td>0</td><td>C<sub>0</sub>/2</td><td>0</td></tr></tbody></table></div>`,
        `<p>C<sub>0</sub> = WLC<sub>ox</sub>. When OFF, the gate couples to the body; when ON, to the channel, which connects to source and drain; pinched off, all to the source. Add <b>overlap</b> capacitance where the gate overlaps source and drain, about 0.2–0.4 fF/µm each.</p>`,
      ]},
      { k: "play", title: "Junction capacitance vs voltage", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let MJ = 0.33, psi = 0.7;
          function draw() {
            const c = (v) => Math.pow(1 + v / psi, -MJ);
            f.innerHTML = plot({ x: [0, 1.2], y: [0, 1.05], xt: [0, 0.4, 0.8, 1.2], yt: [0, 0.25, 0.5, 0.75, 1], xl: "reverse bias V (V)", yl: "C_j / CJ", series: [{ f: c, cls: "s1" }], label: "Junction capacitance falls with reverse bias" });
            ro.innerHTML = readout([["At 0 V", "1.00 × CJ"], ["At 1.0 V", fmt(c(1), 3) + " × CJ"], ["Average over 0–1 V (rough)", fmt((1 + c(1)) / 2, 3) + " × CJ"]]);
          }
          host.append(f, slider({ id: id + "-m", label: "Grading coefficient MJ", min: 0.2, max: 0.6, step: 0.01, value: MJ, show: (x) => fmt(x, 2) }, (x) => { MJ = x; draw(); }).el,
            slider({ id: id + "-p", label: "Built-in potential ψ₀", min: 0.5, max: 1.0, step: 0.01, value: psi, show: (x) => fmt(x, 2) + " V" }, (x) => { psi = x; draw(); }).el, ro);
          draw();
        },
        `<div class="eq">C<sub>j</sub> = CJ (1 + V<sub>sb</sub>/ψ<sub>0</sub>)<sup>−MJ</sup>    ψ<sub>0</sub> = v<sub>T</sub> ln(N<sub>A</sub>N<sub>D</sub>/n<sub>i</sub><sup>2</sup>)</div>`,
        `<p class="aside">More reverse bias widens the depletion region, so less capacitance. For digital delay estimates, just use the value averaged across the switching range.</p>`,
        mathLink("The depletion region and built-in potential:", "39-fields.html", "Math 39"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A junction has MJ = 0.5 and ψ₀ = 0.8 V. By what factor is its capacitance reduced at 1.2 V reverse bias, compared with 0 V?", a: 0.632, tol: 0.01, hint: "(1 + 1.2/0.8)^(−0.5).", why: "(2.5)^(−0.5) = 0.632." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do circuit designers average junction capacitance instead of using the exact voltage-dependent formula?", model: "Because the capacitance changes continuously as the node switches between 0 and V_DD, and for estimating delay and power what matters is the total charge moved over the transition. An average value over that range captures it well enough for hand calculations, and SPICE handles the detail." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Velocity saturation and mobility degradation", mins: 30,
    blurb: "Real transistors give less current than the square law, and it grows almost linearly with V_gs.",
    takeaway: "At high fields the long-channel model overestimates current. Mobility degradation: a high vertical field (V_gs/t_ox) pulls carriers against the oxide where they scatter more; model µ_eff(V_gs): for the book's 65 nm example about 96 cm²/V·s (nMOS) and 36 (pMOS) fully ON. Velocity saturation: at high lateral field (V_ds/L) carriers hit a maximum velocity v_sat ≈ 10⁷ cm/s (electrons) and 8×10⁶ (holes); v = µ_effE/(1 + E/E_c) below E_c, with E_c = 2v_sat/µ_eff; critical voltage V_c = E_cL (about 1.04 V for that nMOS, 2.2 V for pMOS: nMOS are badly velocity saturated, pMOS less). Saturation voltage V_dsat = V_GT·V_c/(V_GT + V_c) (like parallel resistors: less than both). I_dsat = WC_ox·v_sat·V_GT²/(V_GT + V_c): square law when V_GT ≪ V_c (long channel), and I_dsat ≈ WC_ox·v_sat·V_GT, linear in V_gs and independent of L, when fully velocity saturated. α-power law: I_dsat = P_c(β/2)V_GT^α with α between 1 and 2 (fit 1.3 in the 65 nm example); V_dsat = P_v·V_GT^(α/2). Simplest hand model for strongly ON devices: I_on ≈ k(V_gs − V_t*), a straight line with x-intercept V_t*. Raising V_DD therefore buys little speed, one reason V_DD keeps dropping.",
    steps: [
      { k: "learn", title: "Two speed limits", b: [
        `<p>The book's analogy: you've been up all night in the VLSI lab and run across a courtyard for coffee.</p>`,
        `<div class="two"><div class="tile"><h3>Mobility degradation</h3><p>A strong wind (the <b>vertical</b> field, V<sub>gs</sub>/t<sub>ox</sub>) pins you against a wall, and you keep bumping it: carriers scatter off the oxide. Effective mobility drops.</p></div><div class="tile"><h3>Velocity saturation</h3><p>The faster you run, the more often you collide with crowds (the silicon lattice). Past some fatigue (the <b>lateral</b> field V<sub>ds</sub>/L), you hit a top speed: v<sub>sat</sub> ≈ 10<sup>7</sup> cm/s.</p></div></div>`,
        `<p class="aside">“Saturation” alone means the operating region; “velocity saturation” means this speed limit. Different things.</p>`,
      ]},
      { k: "learn", title: "The critical voltage", b: [
        `<p>Velocity rises with field until about the <b>critical field</b> E<sub>c</sub> = 2v<sub>sat</sub>/µ<sub>eff</sub>, then levels off. Across a channel of length L that's a <b>critical voltage</b> V<sub>c</sub> = E<sub>c</sub>L.</p>`,
        `<div class="eq">I<sub>dsat</sub> = WC<sub>ox</sub>v<sub>sat</sub> · V<sub>GT</sub><sup>2</sup> / (V<sub>GT</sub> + V<sub>c</sub>)</div>`,
        `<ul><li>V<sub>GT</sub> ≪ V<sub>c</sub> (long channel): back to the square law.</li><li>V<sub>GT</sub> ≫ V<sub>c</sub> (short channel): I<sub>dsat</sub> ≈ WC<sub>ox</sub>v<sub>sat</sub>V<sub>GT</sub>. <b>Linear</b> in V<sub>gs</sub>, and independent of L!</li></ul>`,
      ]},
      { k: "play", title: "Square law vs reality", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let L = 50, mu = 96;
          const cox = coxOf(10.5), vsat = 1e7, W = 1e-4;
          function draw() {
            const Vc = (2 * vsat / mu) * L * 1e-7, beta = mu * cox * (1 / (L * 1e-3));
            const sq = (g) => (beta / 2) * g * g * 1e3, vs = (g) => (W * cox * vsat * g * g) / (g + Vc) * 1e3;
            const ymax = Math.max(0.5, Math.ceil(sq(0.7) * 2) / 2);
            f.innerHTML = plot({ x: [0, 0.7], y: [0, ymax], xt: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7], yt: [0, ymax / 4, ymax / 2, (3 * ymax) / 4, ymax].map((v) => +v.toPrecision(2)), xl: "V_GT (V)", yl: "I_dsat (mA per µm of width)",
              series: [{ f: sq, cls: "s5" }, { f: vs, cls: "s1" }], texts: [{ x: 0.42, y: Math.min(ymax * 0.95, sq(0.5)), s: "square law" }, { x: 0.48, y: vs(0.48) * 0.82, s: "velocity-saturated" }], label: "Saturation current against overdrive" });
            ro.innerHTML = readout([["Critical voltage V_c = 2v_sat·L/µ", fmt(Vc, 3) + " V"], ["V_dsat at V_GT = 0.7", fmt((0.7 * Vc) / (0.7 + Vc), 3) + " V (square law says 0.7)"], ["Current lost to velocity saturation at V_GT = 0.7", fmt((1 - vs(0.7) / sq(0.7)) * 100, 3) + "%"]]);
          }
          host.append(f, slider({ id: id + "-l", label: "Channel length L", min: 20, max: 1000, log: true, value: L, show: (x) => fmt(x, 3) + " nm" }, (x) => { L = x; draw(); }).el,
            slider({ id: id + "-m", label: "Effective mobility µ_eff", min: 30, max: 300, step: 2, value: mu, show: (x) => x + " cm²/V·s" }, (x) => { mu = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">t<sub>ox</sub> = 10.5 Å, v<sub>sat</sub> = 10<sup>7</sup> cm/s. Stretch L to 1 µm: the curves agree (long channel). Shrink it to 20 nm: the real current is a fraction of the square law and grows almost linearly.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "µ_eff = 120 cm²/V·s, v_sat = 10⁷ cm/s, L = 40 nm. What is V_c?", a: 0.667, tol: 0.02, unit: "V", hint: "E_c = 2×10⁷/120 V/cm; multiply by 4×10⁻⁶ cm.", why: "E_c = 1.67×10⁵ V/cm × 4×10⁻⁶ cm = 0.67 V." },
        { t: "mcq", q: "Why are pMOS transistors less velocity saturated than nMOS at the same V_DD?", opts: [["Lower hole mobility means a higher critical field E_c = 2v_sat/µ, so V_c is larger", true, "In the book's example V_c is 1.04 V for nMOS and 2.2 V for pMOS."], ["Holes have a higher v_sat", false, "v_sat for holes is a bit lower."], ["pMOS have longer channels", false, "Same L; it's the mobility."]] },
      ]},
      { k: "learn", title: "Simple models for hand work", b: [
        `<p><b>α-power law:</b> I<sub>dsat</sub> ∝ V<sub>GT</sub><sup>α</sup>, with α = 2 for long channels down toward 1 when fully velocity saturated (about 1.3 at 65 nm).</p>`,
        `<p>Even simpler, for strongly ON transistors: <b>I<sub>on</sub> ≈ k(V<sub>gs</sub> − V<sub>t</sub>*)</b>, a straight line.</p>`,
        `<div class="key">Consequence: raising V<sub>DD</sub> buys much less speed than the square law promises, but costs V<sub>DD</sub><sup>2</sup> in power. That's one reason supply voltages keep falling.</div>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a velocity-saturated transistor's current grow roughly linearly with V_gs instead of quadratically?", model: "In the square law, more gate voltage gives both more channel charge and, through a larger V_dsat, more field and so faster carriers. When the carriers are already at their maximum velocity, extra field doesn't speed them up; only the extra charge, which is proportional to V_gs − V_t, adds current. So current becomes roughly linear in the overdrive." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Threshold effects and channel-length modulation", mins: 25,
    blurb: "V_t isn't constant: body effect, DIBL, short-channel effect. And saturation isn't flat.",
    takeaway: "Channel-length modulation: the drain depletion region widens with V_ds, shortening the effective channel (L_eff = L − L_d), so saturation current rises with V_ds: I_ds = (β/2)V_GT²(1 + V_ds/V_A), V_A the Early voltage (proportional to L). Important for analog gain; minor for digital. Body effect: a source-to-body voltage V_sb raises the threshold: V_t = V_t0 + γ(√(φ_s + V_sb) − √φ_s), with surface potential φ_s = 2v_T ln(N_A/n_i) and body effect coefficient γ = (t_ox/ε_ox)√(2qε_si N_A) (0.4–1 V^½ typical; 0.16 in the book's 65 nm example, where V_sb = 0.6 V raises V_t by 0.04 V). Linearized: V_t ≈ V_t0 + k_γV_sb. It worsens pass transistors and can be used deliberately (body bias) to trade speed for leakage. Drain-induced barrier lowering (DIBL): V_t = V_t0 − ηV_ds, η ~ 0.1; mostly matters because it raises subthreshold leakage at high V_ds. Short-channel effect: V_t rises with channel length (rolls off for small L); some processes show a reverse short-channel effect; a narrow-channel effect also exists.",
    steps: [
      { k: "learn", title: "Channel-length modulation", b: [
        `<p>In saturation the drain's depletion region grows with V<sub>ds</sub>, eating into the channel: L<sub>eff</sub> = L − L<sub>d</sub>. A shorter channel carries more current, so the “flat” saturation curves tilt upward:</p>`,
        `<div class="eq">I<sub>ds</sub> = (β/2)V<sub>GT</sub><sup>2</sup>(1 + V<sub>ds</sub>/V<sub>A</sub>)</div>`,
        `<p>V<sub>A</sub>, the <b>Early voltage</b>, is proportional to L, so shorter channels tilt more. Crucial for analog amplifier gain; usually unimportant for digital logic.</p>`,
      ]},
      { k: "learn", title: "The body effect", b: [
        `<p>The body is a hidden fourth terminal. Raise the source above the body (V<sub>sb</sub> &gt; 0) and more charge is needed to invert the channel, so V<sub>t</sub> goes <b>up</b>:</p>`,
        `<div class="eq">V<sub>t</sub> = V<sub>t0</sub> + γ(√(φ<sub>s</sub> + V<sub>sb</sub>) − √φ<sub>s</sub>)</div>`,
        `<p class="aside">φ<sub>s</sub> = 2v<sub>T</sub> ln(N<sub>A</sub>/n<sub>i</sub>) (the surface potential); γ, the body-effect coefficient, is typically 0.4–1 V<sup>½</sup>. Both rise with body doping.</p>`,
      ]},
      { k: "play", title: "Threshold vs source voltage", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let g = 0.4, phi = 0.9;
          const Vt0 = 0.3;
          function draw() {
            const vt = (v) => Vt0 + g * (Math.sqrt(phi + v) - Math.sqrt(phi));
            f.innerHTML = plot({ x: [0, 1.2], y: [0.2, 0.8], xt: [0, 0.4, 0.8, 1.2], yt: [0.2, 0.4, 0.6, 0.8], xl: "V_sb (V)", yl: "V_t (V)", series: [{ f: vt, cls: "s1" }, { f: () => Vt0, cls: "s5" }], label: "Threshold voltage against source-body voltage" });
            ro.innerHTML = readout([["V_t at V_sb = 0", fmt(Vt0, 3) + " V"], ["V_t at V_sb = 0.6 V", fmt(vt(0.6), 3) + " V"], ["V_t at V_sb = 1.0 V", fmt(vt(1), 3) + " V"]]);
          }
          host.append(f, slider({ id: id + "-g", label: "Body effect coefficient γ", min: 0.1, max: 1, step: 0.01, value: g, show: (x) => fmt(x, 2) + " V^½" }, (x) => { g = x; draw(); }).el,
            slider({ id: id + "-p", label: "Surface potential φ_s", min: 0.6, max: 1.1, step: 0.01, value: phi, show: (x) => fmt(x, 2) + " V" }, (x) => { phi = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Where does V<sub>sb</sub> &gt; 0 happen? The upper transistor in a series stack (its source isn't at ground), and an nMOS pass transistor passing a 1. Both get weaker.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "V_t0 = 0.3 V, γ = 0.4 V^½, φ_s = 0.9 V. What is V_t with V_sb = 1.0 V?", a: 0.472, tol: 0.01, unit: "V", hint: "0.3 + 0.4(√1.9 − √0.9).", why: "√1.9 = 1.378, √0.9 = 0.949; 0.4 × 0.430 = 0.172; V_t = 0.472 V." },
      ]},
      { k: "learn", title: "DIBL and the short-channel effect", b: [
        `<div class="two"><div class="tile"><h3>DIBL</h3><p>The drain's field helps pull the barrier down: V<sub>t</sub> = V<sub>t0</sub> − ηV<sub>ds</sub>, η ~ 0.1 (100 mV/V). Its real cost: much more leakage at high V<sub>ds</sub> (Part 6).</p></div><div class="tile"><h3>Short-channel effect</h3><p>V<sub>t</sub> falls as L shrinks (“V<sub>t</sub> rolloff”), because source and drain depletion regions take over the channel. Some processes show the reverse.</p></div></div>`,
        `<p class="aside">A slightly longer-than-minimum channel gives a higher V<sub>t</sub> without an extra mask: a trick for low-leakage transistors.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the body effect weaken the upper nMOS in a series stack?", model: "Its source isn't at ground: it sits at the voltage of the node between the two transistors, above the grounded body. That positive source-to-body voltage raises its threshold, so for the same gate voltage it has less overdrive and delivers less current." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Leakage", mins: 30,
    blurb: "OFF transistors aren't off: subthreshold current, gate tunnelling, junction leakage.",
    takeaway: "Leakage paths: subthreshold (source to drain), gate leakage (tunnelling through the oxide), junction leakage (source/drain to body). Insignificant above 180 nm; at 90–65 nm subthreshold leakage is 1–10s of nA per transistor; at 45 nm gate leakage rivals it unless high-k dielectrics are used. Subthreshold (weak inversion): below V_t current falls exponentially, not abruptly: I_ds = I_ds0·e^((V_gs − V_t0 + ηV_ds − k_γV_sb)/(n v_T))·(1 − e^(−V_ds/v_T)), I_ds0 = β v_T² e^1.8, n ≈ 1.3–1.7. Subthreshold slope S = n v_T ln 10: the gate voltage drop per 10× less current, ~100 mV/decade typical (90 mV at n = 1.5, 78 for SOI with n = 1.3). Leakage = 0 at V_ds = 0 and full once V_ds exceeds a few v_T; DIBL raises it ~10× at V_ds = V_DD. Example: for I_off 1000× below I at threshold, V_t ≥ n v_T ln 1000 ≈ 270 mV (n = 1.5). Leakage grows exponentially as V_t drops or temperature rises; it wastes idle power and discharges dynamic nodes and DRAM. Gate leakage: direct tunnelling below ~15–20 Å (each SiO₂ atomic layer ≈ 3 Å), up ~2.7× per ångström thinner; limits t_ox to ≥ ~10.5 Å (< 100 A/cm²); nMOS tunnel ~10× more than pMOS; high-k dielectrics fix it. Junction leakage: reverse-biased diode current (I_S ~ 0.1–0.01 fA/µm², negligible), plus band-to-band tunnelling (BTBT) in heavily (halo) doped junctions and gate-induced drain leakage (GIDL) when the gate is driven far below the drain.",
    steps: [
      { k: "learn", title: "Three leaks", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>Subthreshold</b></td><td>source → drain through an OFF channel: carriers thermally hop the barrier.</td></tr>
          <tr><td><b>Gate</b></td><td>gate → channel: electrons tunnel through an oxide only a few atoms thick.</td></tr>
          <tr><td><b>Junction</b></td><td>source/drain → body through the reverse-biased diodes.</td></tr></tbody></table></div>`,
        `<p>Above 180 nm, leakage barely mattered. At 90–65 nm a single OFF transistor leaks 1–10s of nA, times a billion transistors. At 45 nm, gate leakage caught up unless high-k dielectrics were used.</p>`,
      ]},
      { k: "play", title: "Current on a log scale", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let n = 1.5, Vt = 0.3, eta = 0.1, vds = 1;
          const vT = 0.026, I0 = 6e-6;
          function draw() {
            const I = (vg) => { const x = (vg - Vt + eta * vds) / (2 * n * vT); return I0 * Math.pow(Math.log1p(Math.exp(x)), 2) * (1 - Math.exp(-vds / vT)); };
            const S = n * vT * Math.log(10);
            f.innerHTML = plot({ x: [-0.2, 1], y: [-11, -2.5], xt: [-0.2, 0, 0.2, 0.4, 0.6, 0.8, 1], yt: [-11, -10, -9, -8, -7, -6, -5, -4, -3], ytf: sup, xl: "V_gs (V)", yl: "I_ds (A per µm)", padL: 60,
              series: [{ f: (v) => Math.log10(I(v)), cls: "s1" }], marks: [{ x: 0, y: Math.log10(I(0)), label: "I_off", dx: 10, dy: -10 }], label: "Drain current on a log scale showing subthreshold slope" });
            ro.innerHTML = readout([["Subthreshold slope S = n·v_T·ln10", fmt(S * 1000, 3) + " mV/decade"], ["I_off (V_gs = 0)", si(I(0), "A") + "/µm"], ["I_on (V_gs = 1)", si(I(1), "A") + "/µm"], ["I_on / I_off", fmt(I(1) / I(0), 3)]]);
          }
          host.append(f,
            slider({ id: id + "-v", label: "Threshold V_t", min: 0.1, max: 0.5, step: 0.01, value: Vt, show: (x) => fmt(x, 2) + " V" }, (x) => { Vt = x; draw(); }).el,
            slider({ id: id + "-n", label: "Subthreshold factor n", min: 1.0, max: 1.8, step: 0.01, value: n, show: (x) => fmt(x, 3) }, (x) => { n = x; draw(); }).el,
            toggle(["V_ds = 0.1 V", "V_ds = 1.0 V"], (i) => { vds = [0.1, 1][i]; draw(); }, 1), ro);
          draw();
        },
        `<p class="aside">Below V<sub>t</sub> the current is a straight line on a log scale: exponential. Lower V<sub>t</sub> by 0.1 V and watch I<sub>off</sub> jump by about a decade. Switch V<sub>ds</sub> to 0.1 V: DIBL shrinks, and so does the leakage. (A smooth illustrative curve, not a SPICE model.)</p>`,
        mathLink("Exponentials and logarithms:", "08-exp-log.html", "Math 8"),
      ]},
      { k: "learn", title: "Subthreshold slope", b: [
        `<div class="eq">S = n v<sub>T</sub> ln 10     I<sub>ds</sub> ∝ 10<sup>(V<sub>gs</sub> − V<sub>t</sub>)/S</sup></div>`,
        `<p>S is how far V<sub>gs</sub> must drop to cut leakage <b>tenfold</b>. With v<sub>T</sub> = 26 mV and n = 1.5: S ≈ 90 mV/decade. Even a perfect device (n = 1) can't beat ~60 mV/decade at room temperature.</p>`,
        `<p>So V<sub>t</sub> can't drop much more without leakage exploding: a hard wall on lowering V<sub>DD</sub>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "n = 1.4 at room temperature. What minimum V_t makes the OFF current (V_gs = 0) 1000× smaller than the current at V_gs = V_t?", a: 0.2514, tol: 0.02, unit: "V", hint: "V_t = n·v_T·ln(1000), v_T = 26 mV.", why: "1.4 × 0.026 × 6.91 = 0.251 V: 84 mV/decade × 3 decades." },
      ]},
      { k: "learn", title: "Gate and junction leakage", b: [
        `<p><b>Gate tunnelling</b> grows about 2.7× for every ångström of oxide removed. Oxides below 15–20 Å leak; that stalled oxide scaling around 10.5 Å (a few atomic layers, each ~3 Å). The fix: <b>high-k</b> gate dielectrics, thicker for the same C<sub>ox</sub>.</p>`,
        `<p><b>Junction leakage</b> through reverse-biased diodes is tiny, but heavily doped (halo) junctions add <b>band-to-band tunnelling</b>, and driving the gate well below the drain causes <b>gate-induced drain leakage</b> (GIDL).</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't designers keep lowering V_t to make transistors faster?", model: "Below threshold, current falls by only a factor of ten for every 60–100 mV of gate voltage (the subthreshold slope). Lowering V_t moves the whole curve left, so the current at V_gs = 0, the leakage, rises exponentially. With billions of transistors, that leakage becomes a large share of total power." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Temperature, geometry, and what it all means", mins: 20,
    blurb: "Hot chips are slow and leaky. Drawn sizes aren't real sizes. The designer's summary.",
    takeaway: "Mobility falls with temperature, µ(T) = µ(T_r)(T/T_r)^(−k_µ), k_µ ≈ 1.5; v_sat drops ~20% from 300 to 400 K. |V_t| falls about 1–2 mV/K. At high V_gs, current decreases with temperature (mobility wins); at low V_gs it increases (threshold wins): leakage rises exponentially with temperature, so worst-case performance is usually at high temperature (but at low V_DD, ~0.7–1.1 V, I_dsat can rise with T). Cooling helps (lower V_t possible, less velocity saturation, smaller junction capacitance). Lab tools: freeze spray and heat gun. Geometry: L_eff = L_drawn + X_L − 2L_D and W_eff = W_drawn + X_W − 2W_D (lateral diffusion, etch bias), so a transistor drawn twice as long may be more than twice as long effectively; currents don't scale exactly as 1/L; orientation and nearby poly matter below 0.25 µm. To match currents, use identical transistors in parallel, same orientation, interdigitated, with dummy poly. Designer's summary: pass transistors suffer a threshold drop; leakage matters (multiple-V_t processes); V_DD falls because velocity saturation makes high V_DD pointless; series transistors deliver more than half the current of one (less velocity saturated); match devices carefully.",
    steps: [
      { k: "learn", title: "Temperature", b: [
        `<div class="two"><div class="tile"><h3>Mobility ↓</h3><p>µ ∝ T<sup>−1.5</sup> roughly. Strongly-ON current <b>falls</b> as the chip heats.</p></div><div class="tile"><h3>|V<sub>t</sub>| ↓</h3><p>About 1–2 mV per kelvin. OFF current <b>rises</b> exponentially as the chip heats.</p></div></div>`,
        `<p>So <b>hot chips are slow and leaky</b>: worst-case timing is usually checked at high temperature. (At very low V<sub>DD</sub>, the threshold effect can win and hot chips get faster.)</p>`,
        `<p class="aside">Cooling helps everything: lower V<sub>t</sub> becomes possible, mobility rises, junction capacitance falls. Lab trick: freeze spray and a heat gun, carefully.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Mobility at 300 K is 100 cm²/V·s and k_µ = 1.5. What is it at 375 K?", a: 71.6, tol: 0.02, unit: "cm²/V·s", hint: "100 × (375/300)^(−1.5).", why: "1.25^(−1.5) = 0.716." },
      ]},
      { k: "learn", title: "Drawn is not real", b: [
        `<div class="eq">L<sub>eff</sub> = L<sub>drawn</sub> + X<sub>L</sub> − 2L<sub>D</sub>     W<sub>eff</sub> = W<sub>drawn</sub> + X<sub>W</sub> − 2W<sub>D</sub></div>`,
        `<p>Source and drain diffuse sideways under the gate (L<sub>D</sub>), and the fab may etch poly narrower on purpose (X<sub>L</sub>). So a transistor drawn twice as long can be <i>more</i> than twice as long electrically, and V<sub>t</sub> changes with size too.</p>`,
        `<div class="key">To get precise current ratios (sense amps, ADCs): use <b>identical</b> transistors, several in parallel, same orientation, interleaved, with dummy poly nearby. Don't ratio lengths.</div>`,
      ]},
      { k: "learn", title: "The designer's summary", b: [
        `<ul><li><b>Threshold drops:</b> nMOS pull up only to V<sub>DD</sub> − V<sub>tn</sub>, made worse by the body effect. Use transmission gates.</li><li><b>Leakage:</b> idle CMOS isn't free any more. Processes offer low-V<sub>t</sub> (fast) and high-V<sub>t</sub> (low-leakage) devices.</li><li><b>V<sub>DD</sub>:</b> velocity saturation means high V<sub>DD</sub> buys little speed; it falls every generation.</li><li><b>Series transistors:</b> each sees a smaller field and is less velocity saturated, so two in series give <b>more than half</b> the current of one. NAND gates do better than first-order estimates.</li><li><b>Matching:</b> same size, same orientation, interdigitated.</li></ul>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do two nMOS in series deliver more than half the current of one in a nanometer process?", model: "Each transistor in the stack has only part of the total voltage across it, so the lateral field in each channel is lower and the carriers are less velocity saturated. They move relatively faster than in a single transistor with the whole voltage across it, so the stack loses less than the factor of two that the simple model predicts." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "The inverter's DC transfer curve", mins: 30,
    blurb: "Find V_out where the nMOS and pMOS currents match. Five regions, and a pulse of current.",
    takeaway: "DC transfer characteristic: V_out vs V_in with slow inputs. For the inverter, V_gsn = V_in, V_dsn = V_out, V_gsp = V_in − V_DD, V_dsp = V_out − V_DD. The operating point is where I_dsn = |I_dsp|: graphically, overlay the nMOS curves and the pMOS curves plotted against V_out and find the crossing for each V_in. Five regions (with β_p = β_n and V_tp = −V_tn): A, V_in < V_tn: nMOS off, V_out = V_DD. B: nMOS saturated, pMOS linear, V_out > V_DD/2. C, V_in = V_DD/2: both saturated, slope −∞ for ideal transistors (finite with channel-length modulation): high gain. D: pMOS saturated, nMOS linear, V_out < V_DD/2. E, V_in > V_DD − |V_tp|: pMOS off, V_out = 0. Supply current flows only while both are on: a pulse around the switching point, ideally zero within a threshold of either rail (good for low power). The crossover V_inv = V_in = V_out is the input threshold, only weakly temperature-sensitive.",
    steps: [
      { k: "learn", title: "Set the currents equal", b: [
        `<p>In a CMOS inverter the same current flows through both transistors (nothing else draws it). So for each V<sub>in</sub>, V<sub>out</sub> must settle where</p>`,
        `<div class="eq">I<sub>dsn</sub>(V<sub>gs</sub> = V<sub>in</sub>, V<sub>ds</sub> = V<sub>out</sub>) = |I<sub>dsp</sub>|(V<sub>sg</sub> = V<sub>DD</sub> − V<sub>in</sub>, V<sub>sd</sub> = V<sub>DD</sub> − V<sub>out</sub>)</div>`,
        `<p>Plot both currents against V<sub>out</sub>: the nMOS curve rises from the left, the pMOS curve from the right. They cross at the operating point.</p>`,
      ]},
      { k: "play", title: "Find the operating point", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), g = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let Vin = 0.42;
          function draw() {
            const vo = vout(Vin, 1), In = (v) => ids(Vin, v, 1, 0.3, 0.08) * 1000, Ip = (v) => ids(1 - Vin, 1 - v, 1, 0.3, 0.08) * 1000;
            const ym = Math.max(20, Math.ceil((Math.max(In(1), Ip(0)) * 1.25) / 20) * 20);
            f.innerHTML = plot({ x: [0, 1], y: [0, ym], xt: [0, 0.2, 0.4, 0.6, 0.8, 1], yt: [0, ym / 4, ym / 2, (3 * ym) / 4, ym], xl: "V_out (V)", yl: "current (arb.)", series: [{ f: In, cls: "s2" }, { f: Ip, cls: "s1" }], marks: [{ x: vo, y: In(vo), label: "operating point", a: vo > 0.6 ? "end" : "start", dx: vo > 0.6 ? -10 : 10, dy: -14 }], label: "nMOS and pMOS currents against output voltage" });
            const tr = []; for (let i = 0; i <= 100; i++) tr.push([i / 100, vout(i / 100, 1)]);
            g.innerHTML = plot({ x: [0, 1], y: [0, 1.05], xt: [0, 0.3, 0.5, 0.7, 1], yt: [0, 0.5, 1], xl: "V_in (V)", yl: "V_out (V)", series: [{ pts: tr, cls: "s1" }, { pts: [[0, 0], [1, 1]], cls: "s5" }], marks: [{ x: Vin, y: vo }], label: "Inverter DC transfer characteristic" });
            const reg = Vin < 0.3 ? "A: nMOS off, V_out = V_DD" : Vin > 0.7 ? "E: pMOS off, V_out = 0" : Math.abs(Vin - 0.5) < 0.02 ? "C: both saturated: steepest, highest gain" : Vin < 0.5 ? "B: nMOS saturated, pMOS linear" : "D: pMOS saturated, nMOS linear";
            ro.innerHTML = readout([["V_out", fmt(vo, 3) + " V"], ["Region", reg], ["Supply current", fmt(In(vo), 3) + " (arb.)"]]);
          }
          host.append(slider({ id: id + "-i", label: "Input V_in", min: 0, max: 1, step: 0.01, value: Vin, show: (x) => fmt(x, 2) + " V" }, (x) => { Vin = x; draw(); }).el, f, g, ro);
          draw();
        },
        `<p class="aside">V<sub>DD</sub> = 1 V, V<sub>tn</sub> = |V<sub>tp</sub>| = 0.3 V, β<sub>p</sub> = β<sub>n</sub>, with a little channel-length modulation so region C has a finite slope. Top graph: nMOS current in blue, pMOS in orange (the scale changes with V<sub>in</sub>). Watch the supply current: zero near the rails, a pulse in the middle.</p>`,
      ]},
      { k: "learn", title: "Five regions", b: [
        `<div class="tbl"><table><thead><tr><th>Region</th><th>V<sub>in</sub></th><th>nMOS</th><th>pMOS</th><th>V<sub>out</sub></th></tr></thead><tbody>
          <tr><td>A</td><td>&lt; V<sub>tn</sub></td><td>cutoff</td><td>linear</td><td>V<sub>DD</sub></td></tr>
          <tr><td>B</td><td>V<sub>tn</sub> … V<sub>DD</sub>/2</td><td>saturated</td><td>linear</td><td>&gt; V<sub>DD</sub>/2</td></tr>
          <tr><td>C</td><td>= V<sub>DD</sub>/2</td><td>saturated</td><td>saturated</td><td>drops sharply</td></tr>
          <tr><td>D</td><td>V<sub>DD</sub>/2 … V<sub>DD</sub> − |V<sub>tp</sub>|</td><td>linear</td><td>saturated</td><td>&lt; V<sub>DD</sub>/2</td></tr>
          <tr><td>E</td><td>&gt; V<sub>DD</sub> − |V<sub>tp</sub>|</td><td>linear</td><td>cutoff</td><td>0</td></tr></tbody></table></div>`,
        `<p class="aside">The book derives the curve graphically; the exercises ask for the analytical version, so it's left for you.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why does an idle CMOS inverter draw (ideally) no current?", opts: [["With the input within a threshold of a rail, one transistor is cut off, so there's no path from V_DD to GND", true, "Current flows only while the input passes through the middle."], ["The output capacitor blocks it", false, "It's the OFF transistor that blocks it."], ["Both transistors are saturated", false, "That only happens at the switching point, where current is largest."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you find the inverter's output voltage for a given input using the I-V curves?", model: "Plot the nMOS drain current as a function of the output voltage for the given input, and the pMOS current on the same axes, as a function of the same output voltage. The same current must flow through both transistors, so the output settles where the two curves cross." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Skewed inverters and noise margins", mins: 25,
    blurb: "Change the β ratio and the switching threshold moves. Logic levels sit at the unity-gain points.",
    takeaway: "Beta ratio r = β_p/β_n. With r = 1 (pMOS ~2–3× wider for equal β), V_inv = V_DD/2: maximum noise margins and equal rise/fall drive. r > 1: HI-skewed (stronger pMOS, higher V_inv); r < 1: LO-skewed (lower V_inv); the transition stays sharp. Gates are skewed by changing widths (keeping minimum L). Long-channel model: V_inv = (V_DD + V_tp + V_tn·√(1/r)) / (1 + √(1/r)); fully velocity saturated: the same form with r = W_p v_sat-p/(W_n v_sat-n), and velocity-saturated inverters are more sensitive to skew. Other gates collapse into an equivalent inverter: series transistors act like one longer transistor; parallel ON transistors like one wider one. Noise margins: NM_L = V_IL − V_OL, NM_H = V_OH − V_IH, with logic levels at the unity-gain points (slope −1), a conservative worst case; an unskewed gate has equal margins; noise margins grow with |V_t|; they're best quoted as fractions of V_DD. Output degraded at the worst legal input: noise feedthrough. Static vs dynamic noise margins (brief pulses can be larger).",
    steps: [
      { k: "learn", title: "The beta ratio", b: [
        `<p>r = β<sub>p</sub>/β<sub>n</sub>. To make them equal (r = 1), the pMOS is drawn 2–3× wider than the nMOS (lower hole mobility). Then V<sub>inv</sub> = V<sub>DD</sub>/2: equal noise margins and equal pull-up and pull-down strength.</p>`,
        `<div class="two"><div class="tile"><h3>HI-skew (r &gt; 1)</h3><p>Stronger pMOS. The input must rise higher before the output falls: V<sub>inv</sub> moves up.</p></div><div class="tile"><h3>LO-skew (r &lt; 1)</h3><p>Weaker pMOS. V<sub>inv</sub> moves down.</p></div></div>`,
        `<div class="eq">V<sub>inv</sub> = (V<sub>DD</sub> + V<sub>tp</sub> + V<sub>tn</sub>√(1/r)) / (1 + √(1/r))</div>`,
      ]},
      { k: "play", title: "Skew the inverter", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let lr = 0;
          function draw() {
            const r = Math.pow(10, lr), tr = []; for (let i = 0; i <= 100; i++) tr.push([i / 100, vout(i / 100, r)]);
            const nm = noiseMargins(r), formula = (1 - 0.3 + 0.3 * Math.sqrt(1 / r)) / (1 + Math.sqrt(1 / r));
            const marks = nm ? [{ x: nm.VIL, y: nm.VOH, label: "slope −1", dy: 20, a: "end", dx: -8 }, { x: nm.VIH, y: nm.VOL, label: "slope −1" }] : [];
            f.innerHTML = plot({ x: [0, 1], y: [0, 1.05], xt: [0, 0.25, 0.5, 0.75, 1], yt: [0, 0.25, 0.5, 0.75, 1], xl: "V_in (V)", yl: "V_out (V)", series: [{ pts: tr, cls: "s1" }, { pts: [[0, 0], [1, 1]], cls: "s5" }], marks, label: "Skewed inverter transfer curve" });
            ro.innerHTML = readout([["β_p/β_n = r", fmt(r, 3)], ["V_inv (long-channel formula)", fmt(formula, 3) + " V"]].concat(nm ? [["V_IL / V_OH", `${fmt(nm.VIL, 3)} / ${fmt(nm.VOH, 3)} V`], ["V_IH / V_OL", `${fmt(nm.VIH, 3)} / ${fmt(nm.VOL, 3)} V`], ["NM_L = V_IL − V_OL", fmt(nm.VIL - nm.VOL, 3) + " V"], ["NM_H = V_OH − V_IH", fmt(nm.VOH - nm.VIH, 3) + " V"]] : []));
          }
          host.append(f, slider({ id: id + "-r", label: "Beta ratio r (log scale)", min: -1, max: 1, step: 0.02, value: lr, show: (x) => fmt(Math.pow(10, x), 3) }, (x) => { lr = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">At r = 1 the two noise margins are equal. Skew it and one margin grows while the other shrinks. Sometimes that's the point: a gate that sees more noise when LOW can be skewed to protect NM<sub>L</sub>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "V_DD = 1.0 V, V_tn = 0.3, V_tp = −0.3, r = 4 (long-channel). What is V_inv?", a: 0.567, tol: 0.01, unit: "V", hint: "√(1/r) = 0.5: (1 − 0.3 + 0.3×0.5)/(1 + 0.5).", why: "0.85 / 1.5 = 0.567 V: HI-skewed, above V_DD/2." },
      ]},
      { k: "learn", title: "Gates as equivalent inverters", b: [
        `<p>To find any static gate's switching point, collapse it into an inverter: series ON transistors act like one <b>longer</b> transistor; parallel ON transistors like one <b>wider</b> one. A NAND2 whose inputs switch together has a pull-down twice as long (half β<sub>n</sub>) and a pull-up twice as wide (double β<sub>p</sub>): it's effectively HI-skewed.</p>`,
        `<p class="aside">Noise margins are best quoted as a fraction of V<sub>DD</sub>: 0.4 V is comfortable at 1.8 V but marginal at 5 V. Short noise pulses can be bigger than the static margins allow: dynamic noise margins.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why are the logic levels V_IL and V_IH chosen at the unity-gain points?", model: "At those points the transfer curve's slope is −1. Below V_IL (or above V_IH) the gain is less than one, so input noise is attenuated at the output; between them the gain is greater than one and noise is amplified. Using the unity-gain points gives a conservative worst-case static noise margin." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  function passDrop(VDD, Vt0, g, phi) { let v = VDD - Vt0; for (let i = 0; i < 60; i++) v = VDD - (Vt0 + g * (Math.sqrt(phi + v) - Math.sqrt(phi))); return v; }
  const p10 = {
    id: "p10", title: "Pass transistors, pitfalls and fallacies", mins: 20,
    blurb: "Exactly how bad is a degraded 1? And six traps for the confident designer.",
    takeaway: "An nMOS with gate and drain at V_DD pulls its source up only until V_gs = V_tn: V_out = V_DD − V_tn (the threshold drop); the body effect raises V_tn as the source rises, making it worse (the book's 65 nm example: 0.65 V from a 1 V supply). A pMOS pulls down only to |V_tp|. Several pass transistors in series lose no more than one threshold; but a degraded output driving another pass transistor's gate loses another (V_DD − 2V_tn). In modern processes V_t is about V_DD/3, so a threshold drop can give an invalid level: use transmission gates (one of the two transistors is always ON). Pitfalls: blindly trusting models (use them for trends; subthreshold accuracy needs vendor confirmation); excessively complicated models for hand calculations (calibrated RC models do as well); assuming twice the drawn length gives half the current (effective length and V_t make it less); assuming two series transistors give exactly half the current (they give more); ignoring leakage; using nMOS pass transistors (a scan latch working at 250 nm/2.5 V failed at 180 nm/1.8 V until V_DD was raised to 2 V).",
    steps: [
      { k: "learn", title: "The threshold drop", b: [
        `<p>An nMOS passing a 1: gate at V<sub>DD</sub>, drain at V<sub>DD</sub>, source rising. Once V<sub>gs</sub> falls to V<sub>tn</sub>, it turns itself off:</p>`,
        `<div class="eq">V<sub>out</sub> = V<sub>DD</sub> − V<sub>tn</sub></div>`,
        `<p>And as the source rises, V<sub>sb</sub> grows, the body effect raises V<sub>tn</sub>, and the output stops even lower. A pMOS passing a 0 stops at |V<sub>tp</sub>|.</p>`,
      ]},
      { k: "play", title: "How low does it go?", b: [
        (host, id) => {
          const ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let VDD = 1.0, Vt0 = 0.3, g = 0.16;
          function draw() { const v = passDrop(VDD, Vt0, g, 0.93); ro.innerHTML = readout([["Without body effect", fmt(VDD - Vt0, 3) + " V"], ["With body effect", fmt(v, 3) + " V"], ["As a fraction of V_DD", fmt((v / VDD) * 100, 3) + "%"]]); vd.className = "verdict " + (v / VDD < 0.7 ? "no" : "mid"); vd.textContent = v / VDD < 0.7 ? "Likely below the next gate's V_IH: use a transmission gate." : "Degraded, but maybe usable."; }
          host.append(slider({ id: id + "-d", label: "Supply V_DD", min: 0.6, max: 2.5, step: 0.05, value: VDD, show: (x) => fmt(x, 3) + " V" }, (x) => { VDD = x; draw(); }).el,
            slider({ id: id + "-t", label: "V_t0", min: 0.2, max: 0.6, step: 0.01, value: Vt0, show: (x) => fmt(x, 2) + " V" }, (x) => { Vt0 = x; draw(); }).el,
            slider({ id: id + "-g", label: "Body effect γ", min: 0, max: 0.6, step: 0.01, value: g, show: (x) => fmt(x, 2) + " V^½" }, (x) => { g = x; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">Defaults are the book's 65 nm example: 0.65 V out of 1 V. In old 5 V processes a threshold was a small fraction of V<sub>DD</sub>; now it's about a third.</p>`,
      ]},
      { k: "learn", title: "Chains of pass transistors", b: [
        `<p>Several nMOS in <b>series</b> passing a 1: the output still only loses <b>one</b> threshold (each can rise to within V<sub>t</sub> of its gate). But if a degraded output drives the <b>gate</b> of another pass transistor, that one loses another: V<sub>DD</sub> − 2V<sub>tn</sub>.</p>`,
        `<p>The fix is the <b>transmission gate</b>: for any output voltage, at least one of its two transistors is ON.</p>`,
      ]},
      { k: "check", title: "Pitfalls and fallacies", b: [
        { t: "sort", q: "True or false?", bins: ["True", "False (a fallacy)"], items: [
          ["A transistor with twice the drawn length gives exactly half the current", 1, "Effective length is shorter than drawn and V_t rises with length: you get less than half."],
          ["Two nMOS in series deliver exactly half the current of one", 1, "They deliver more: each is less velocity saturated."],
          ["Simple models are useful for trends, not exact values", 0, "Wider means more capacitance and less resistance: that insight is what they're for."],
          ["Leakage can be a large share of a phone chip's power", 0, "Phones are idle most of the time."],
          ["nMOS pass transistors that work in one process will work in the next", 1, "The book's scan-latch story: fine at 2.5 V, broken at 1.8 V."],
        ]},
      ]},
      { k: "why", title: "The scan-latch story", b: [
        `<p>One author worked on a scan latch with an nMOS pass transistor. At 250 nm and 2.5 V it worked. Ported to 180 nm at 1.8 V, the scan chain died: the degraded 1 fell below the next stage's V<sub>IH</sub>. It worked in the lab only after raising V<sub>DD</sub> to 2 V. The real fix: a transmission gate.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does an nMOS pass transistor pull its output only to V_DD − V_t, and why is that worse in new processes?", model: "As the output (the transistor's source) rises, the gate-to-source voltage falls; when it reaches the threshold the transistor turns off, leaving the output a threshold below V_DD, and the body effect raises that threshold further. In new processes V_DD has dropped much more than V_t, so a threshold is now about a third of the supply, enough to leave the output an invalid logic level." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "vlsi2", eyebrow: "CMOS VLSI · Chapter 2", title: "MOS Transistor Theory",
    intro: `<p>Ten parts: the MOS structure and operating regions, the long-channel I-V model, capacitances, velocity saturation, threshold effects, leakage, temperature and geometry, the inverter's transfer curve, skew and noise margins, and pass transistors with the chapter's pitfalls.</p><p>This is the “MOSFET for chip designers” bridge from Boylestad Chapter 6. Math you'll use: exponentials (Math 8) and the junction physics in Math 39. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. Many are calculations with real process numbers: use a calculator or a short script, and plot curves where asked.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10],
    summary: `
      <h3>Long-channel model</h3>
      <div class="eq">I<sub>ds</sub> = 0 (V<sub>gs</sub> &lt; V<sub>t</sub>);  β(V<sub>GT</sub> − V<sub>ds</sub>/2)V<sub>ds</sub> (V<sub>ds</sub> &lt; V<sub>GT</sub>);  (β/2)V<sub>GT</sub><sup>2</sup> (saturation)</div>
      <p>β = µC<sub>ox</sub>W/L, C<sub>ox</sub> = ε<sub>ox</sub>/t<sub>ox</sub>, V<sub>GT</sub> = V<sub>gs</sub> − V<sub>t</sub>. pMOS: signs reversed, µ<sub>p</sub> ≈ µ<sub>n</sub>/2.</p>
      <h3>Capacitance</h3>
      <p>C<sub>g</sub> = C<sub>ox</sub>WL ≈ 1 fF/µm; C<sub>sb</sub> ≈ C<sub>db</sub> ≈ C<sub>g</sub>. Cutoff: C<sub>gb</sub>; linear: C<sub>gs</sub> = C<sub>gd</sub> = C<sub>0</sub>/2; saturation: C<sub>gs</sub> = 2C<sub>0</sub>/3. C<sub>j</sub> = CJ(1 + V/ψ<sub>0</sub>)<sup>−MJ</sup>.</p>
      <h3>Nonideal effects</h3>
      <p>Velocity saturation: V<sub>c</sub> = 2v<sub>sat</sub>L/µ, I<sub>dsat</sub> = WC<sub>ox</sub>v<sub>sat</sub>V<sub>GT</sub><sup>2</sup>/(V<sub>GT</sub> + V<sub>c</sub>) → linear in V<sub>GT</sub>; α-power law. Channel-length modulation (1 + V<sub>ds</sub>/V<sub>A</sub>). Body effect V<sub>t</sub> = V<sub>t0</sub> + γ(√(φ<sub>s</sub> + V<sub>sb</sub>) − √φ<sub>s</sub>). DIBL V<sub>t</sub> = V<sub>t0</sub> − ηV<sub>ds</sub>.</p>
      <h3>Leakage and temperature</h3>
      <p>Subthreshold: I ∝ 10<sup>(V<sub>gs</sub>−V<sub>t</sub>)/S</sup>, S = n v<sub>T</sub> ln 10 ≈ 90 mV/decade. Gate tunnelling (high-k), junction leakage, BTBT, GIDL. Hot: mobility ↓ (slower), V<sub>t</sub> ↓ (leakier).</p>
      <h3>Inverter DC</h3>
      <p>I<sub>dsn</sub> = |I<sub>dsp</sub>|; regions A–E; current pulse at switching. V<sub>inv</sub> = (V<sub>DD</sub> + V<sub>tp</sub> + V<sub>tn</sub>√(1/r))/(1 + √(1/r)), r = β<sub>p</sub>/β<sub>n</sub>. Noise margins at slope −1. nMOS pass transistors drop to V<sub>DD</sub> − V<sub>tn</sub> (worse with body effect): use transmission gates.</p>`,
  };
  Course.start(window.CHAPTER);
})();
