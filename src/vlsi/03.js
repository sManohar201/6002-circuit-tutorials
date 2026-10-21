(function () {
  const { S, slider, toggle, readout, fmt, el } = Course;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const c = (t) => `<code>${t}</code>`;
  const seenB = (html, href, where) => `<div class="key"><b>Seen in Boylestad:</b> ${html} <a href="../edc/${href}">${where} →</a></div>`;
  const seenV = (html, href, where) => `<div class="key"><b>Seen in Chapter 1:</b> ${html} <a href="${href}">${where} →</a></div>`;

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Why designers care, and where wafers come from", mins: 15,
    blurb: "Fabs cost billions. Knowing the process explains the design rules and helps debug failures.",
    takeaway: "Why care how transistors are made: understanding the process explains the design rules, leads to better layouts, and helps debug hard chip failures and improve yield. A 300 mm, 45 nm fab cost about $3 billion plus ~$2.4 billion of R&D, so only a few companies build them; others are fabless and buy wafer space from foundries (e.g. TSMC). Dopants: group III acceptors (boron) make p-type; group V donors (arsenic, phosphorus) make n-type; where they meet is a junction. Processing splits into front-end-of-line (FEOL: transistors) and back-end-of-line (BEOL: wires). Wafers (75–300 mm across, < 1 mm thick) are sliced from boules of single-crystal silicon pulled from molten silicon (~1425 °C) on a rotating seed crystal: the Czochralski method; pull and rotation rates set the diameter; dopants added to the melt set the wafer's type.",
    steps: [
      { k: "learn", title: "Why a designer should care", b: [
        `<p>“Why do I care how transistors are made?” Because:</p>`,
        `<ul><li>Every design rule has a physical reason. Know the reason, and you'll make better layouts.</li><li>Some of the hardest chip failures, and most yield problems, only make sense once you know the process.</li></ul>`,
        `<p>And it's big money: a 300 mm fab at 45 nm cost about <b>$3 billion</b>, plus $2.4 billion of research. So most chip companies are <b>fabless</b> and buy space on a <b>foundry</b>'s line (TSMC, for example).</p>`,
      ]},
      { k: "learn", title: "Two halves", b: [
        `<div class="two"><div class="tile"><h3>Front end of line (FEOL)</h3><p>Build the <b>transistors</b>: wells, isolation, gate, source and drain.</p></div><div class="tile"><h3>Back end of line (BEOL)</h3><p>Build the <b>wires</b>: contacts, vias and up to a dozen metal layers.</p></div></div>`,
        `<p>Doping recap: boron (group III) <b>accepts</b> electrons, leaving holes: p-type. Arsenic and phosphorus (group V) <b>donate</b> electrons: n-type.</p>`,
        seenB("Doping and junctions from scratch.", "01-diodes.html#p2", "Chapter 1, Part 2"),
      ]},
      { k: "learn", title: "Growing a wafer", b: [
        `<p>Melt very pure silicon (~1425 °C) with a little dopant. Dip in a <b>seed crystal</b>, then slowly pull it up while rotating it. The silicon freezes onto the seed in the same crystal orientation: a cylindrical <b>boule</b> of single-crystal silicon. That's the <b>Czochralski</b> method.</p>`,
        `<p>The pull and rotation rates set the diameter. Slice the boule into wafers up to 300 mm (12″, a dinner plate) across and under 1 mm thick.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Adding boron to the silicon melt gives wafers that are…", opts: [["p-type: boron is an acceptor", true, "Group III, three valence electrons."], ["n-type", false, "That's group V: arsenic or phosphorus."], ["Intrinsic", false, "Any intentional dopant makes it extrinsic."]] },
        { t: "mcq", q: "A company designs chips but owns no fab. It is…", opts: [["Fabless; it buys wafers from a foundry", true, "Most chip companies work this way."], ["A foundry", false, "A foundry is the one with the fab."], ["An IDM", false, "Integrated device manufacturers own their fabs."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Give two reasons a circuit designer benefits from understanding the manufacturing process.", model: "First, design rules stop looking arbitrary: knowing why a spacing or overlap exists helps you lay out better and know when a rule is critical. Second, when a chip fails in strange ways or yields poorly, the cause is often a process effect, so you need to know the process to debug it." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const LAMBDAS = [[436, "436 nm mercury g-line (1980s)"], [365, "365 nm mercury i-line"], [248, "248 nm KrF laser (250–180 nm nodes)"], [193, "193 nm ArF laser (critical layers since ~90 nm)"], [13.5, "13.5 nm EUV"]];
  const p2 = {
    id: "p2", title: "Photolithography", mins: 30,
    blurb: "Carving pictures in stone with light. How we print lines far narrower than the light's wavelength.",
    takeaway: "Photolithography patterns every layer. A photomask (reticle) is quartz with chrome where light should be blocked; UV light through the clear parts exposes photoresist on the wafer. Negative resist: exposed parts stay (become insoluble); positive resist: exposed parts dissolve; positive resists have better resolution but are less sensitive. Thinner resists for smaller features are less robust. A stepper moves the reticle (~2 cm) across the wafer; projection printing with lenses (often 4–5× reduction); older contact and proximity printing. Resolution: minimum pitch 2b = k₁λ/NA; numerical aperture NA = n·sin θ (n = 1 air, 1.33 water: immersion lithography, NA up to 1.35); k₁ ~0.8 easy, 0.5 very hard. Depth of focus DOF = k₂λ/NA² (k₂ 0.5–1): high-NA, short-λ systems need very flat wafers. Light sources: mercury 436/365 nm, KrF 248 nm (250–180 nm), ArF 193 nm (down to 45 nm and below); 193 nm, NA 1.35, k₁ 0.5 gives a 72 nm pitch. 157 nm was abandoned; 13.5 nm EUV was future work when the book was written. Resolution enhancement techniques (RET): optical proximity correction (OPC, predistorting mask shapes, needed from 180 nm), phase-shift masks, off-axis illumination, double patterning. Steppers and masks are increasingly expensive.",
    steps: [
      { k: "learn", title: "Light through a stencil", b: [
        `<ol><li>Coat the wafer with light-sensitive <b>photoresist</b>.</li><li>Shine UV light through a <b>photomask</b> (quartz with a chrome pattern).</li><li>Develop: dissolve the soluble resist.</li><li>Etch or implant wherever the resist is gone.</li></ol>`,
        `<div class="two"><div class="tile"><h3>Negative resist</h3><p>Exposed resist hardens and <b>stays</b>.</p></div><div class="tile"><h3>Positive resist</h3><p>Exposed resist becomes soluble and <b>washes away</b>. Better resolution, less sensitive.</p></div></div>`,
        `<p>The mask, called a <b>reticle</b>, is only a few cm across. A <b>stepper</b> moves it across the wafer, projecting the pattern through lenses, often shrunk 4–5×.</p>`,
        seenV("The basic patterning loop.", "01-introduction.html#p7", "Chapter 1, Part 7"),
      ]},
      { k: "learn", title: "The resolution formula", b: [
        `<div class="eq">minimum pitch 2b = k<sub>1</sub>λ / NA     NA = n sin θ</div>`,
        `<ul><li><b>λ</b>: the light's wavelength. Shorter is sharper.</li><li><b>NA</b>: numerical aperture, how wide a cone of light the lens gathers. n is the refractive index between lens and wafer: 1 for air, 1.33 for water (<b>immersion lithography</b>).</li><li><b>k<sub>1</sub></b>: everything else (resist, coatings, tricks). 0.8 is easy; 0.5 is very hard.</li></ul>`,
        `<div class="eq">depth of focus DOF = k<sub>2</sub>λ / NA<sup>2</sup>     (k<sub>2</sub> ≈ 0.5–1)</div>`,
        `<p class="aside">The catch: bigger NA sharpens the image but shrinks the depth of focus fast, so the wafer surface must be extremely flat. That's why polishing (CMP) matters so much.</p>`,
      ]},
      { k: "play", title: "How small can you print?", b: [
        (host, id) => {
          const ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let lam = 193, NA = 1.35, k1 = 0.5;
          function draw() {
            const p = (k1 * lam) / NA, dof = (0.75 * lam) / (NA * NA);
            ro.innerHTML = readout([["Minimum pitch 2b = k₁λ/NA", fmt(p, 3) + " nm"], ["Half-pitch (narrowest line)", fmt(p / 2, 3) + " nm"], ["Depth of focus (k₂ = 0.75)", fmt(dof, 3) + " nm"], ["Line width ÷ wavelength", fmt(p / 2 / lam, 2)]]);
            vd.className = "verdict " + (NA > 1 ? "mid" : "ok");
            vd.textContent = NA > 1 ? "NA > 1 needs immersion: water between lens and wafer." : k1 < 0.6 ? "Low k₁: needs heavy resolution enhancement." : "Dry lithography, comfortable k₁.";
          }
          host.append(toggle(LAMBDAS.map((l) => l[0] + " nm"), (i) => { lam = LAMBDAS[i][0]; draw(); }, 3),
            slider({ id: id + "-na", label: "Numerical aperture NA", min: 0.2, max: 1.35, step: 0.01, value: NA, show: (x) => fmt(x, 3) }, (x) => { NA = x; draw(); }).el,
            slider({ id: id + "-k", label: "Process factor k₁", min: 0.3, max: 0.9, step: 0.01, value: k1, show: (x) => fmt(x, 2) }, (x) => { k1 = x; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">Defaults: 193 nm light, NA 1.35, k<sub>1</sub> = 0.5 gives a 72 nm pitch: lines about 36 nm wide, a fifth of the wavelength. Lenses in the 1970s had NA = 0.2. When the book was written, 13.5 nm extreme-UV (EUV) was still too weak and expensive for production; it has since entered high-volume manufacturing for the most advanced nodes.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 248 nm stepper with NA = 0.8 and k₁ = 0.6. What is the minimum pitch?", a: 186, tol: 0.01, unit: "nm", why: "0.6 × 248 / 0.8 = 186 nm." },
        { t: "num", q: "Same light (248 nm), NA = 0.6, k₂ = 0.8. What is the depth of focus?", a: 551, tol: 0.01, unit: "nm", hint: "DOF = k₂λ/NA².", why: "0.8 × 248 / 0.36 = 551 nm." },
        { t: "mcq", q: "Water between the lens and wafer (immersion) helps because…", opts: [["Its refractive index (1.33) raises NA = n sin θ above 1", true, "Same lens angle, more NA, finer pitch."], ["It cools the wafer", false, "It's about optics."], ["It shortens the laser's wavelength source", false, "The source is unchanged; the medium raises NA."]] },
      ]},
      { k: "learn", title: "Cheating the wavelength", b: [
        `<p>Features smaller than the wavelength come out distorted: corners round off, line ends shrink. <b>Resolution enhancement techniques</b> fix it:</p>`,
        `<ul><li><b>Optical proximity correction (OPC):</b> predistort the mask shapes (add serifs to corners) so the printed shape comes out right. Needed from 180 nm.</li><li><b>Phase-shift masks:</b> vary the mask's thickness so light from neighbouring lines cancels where it shouldn't print.</li><li><b>Off-axis illumination</b> for dense repeated patterns.</li><li><b>Double patterning:</b> two aligned exposures with different masks for one layer.</li></ul>`,
        `<p class="aside">Each generation's stepper and masks cost more, so chips must sell in huge volumes to pay for them.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Name three ways to print a smaller pitch, using the resolution formula.", model: "The pitch is k₁ times the wavelength divided by the numerical aperture. So: use shorter-wavelength light (248 to 193 nm, then EUV); raise the numerical aperture with bigger optics or immersion in water; or lower k₁ with better resists and resolution enhancement like OPC, phase-shift masks and double patterning." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Wells, doping and oxide", mins: 20,
    blurb: "n-well, twin-well, triple-well. Three ways to put dopants in. Growing SiO₂.",
    takeaway: "Well options: n-well (pMOS in n-wells, all nMOS share the p-substrate as body, so digital noise in the substrate can reach analog or memory), p-well (historical), twin-well (each type optimized), triple-well (a deep n-well isolates p-wells: good for mixed-signal and DRAM; one extra mask). Ways to dope: epitaxy (grow a single-crystal film, fewer defects, helps latchup), deposition plus thermal diffusion (deep junctions; CVD: heated gases react near the wafer and deposit a film), ion implantation (the standard: fire dopant ions into the silicon; random, so dopant fluctuations vary V_t; above ~800 °C dopants diffuse, so later steps stay cool, apart from an anneal). Wells first: deep n-well by MeV implantation (a retrograde well, peak concentration below the surface; needs thick resist so well features are coarse). Threshold implants after the wells set V_t; multiple implant masks give multiple V_t options. Well-edge proximity effect: transistors within ~1 µm of a well edge get extra dopants scattered off the resist, shifting V_t. Silicon's processable oxide is why silicon dominates. Wet oxidation (water vapour, 900–1000 °C, fast, thick field oxide), dry oxidation (pure O₂, ~1200 °C, better quality, thin gate oxides), atomic layer deposition (ALD: one atomic layer at a time). Grown oxide consumes silicon and grows both up and down (SiO₂ has about twice silicon's volume).",
    steps: [
      { k: "learn", title: "Which wells?", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>n-well</b></td><td>pMOS in n-wells; all nMOS share the p-substrate as their body. Digital noise in the substrate can reach sensitive analog or memory circuits.</td></tr>
          <tr><td><b>Twin-well</b></td><td>A separate p-well too, so each transistor type can be tuned. One mask: the p-well is “wherever the n-well isn't”.</td></tr>
          <tr><td><b>Triple-well</b></td><td>A <b>deep n-well</b> under a p-well isolates those nMOS from the substrate: quiet analog blocks, DRAM. One extra mask.</td></tr></tbody></table></div>`,
        `<p class="aside">Historically p-well came first. Silicon-on-insulator (Part 7) is another option.</p>`,
      ]},
      { k: "learn", title: "Three ways to add dopants", b: [
        `<ul><li><b>Epitaxy:</b> grow a fresh single-crystal layer on the wafer. Fewer defects; helps prevent latchup. Microprocessor teams like “epi” wafers.</li><li><b>Deposition + diffusion:</b> put dopant on the surface, then heat to drive it in. Makes deep junctions. Chemical vapour deposition (CVD: hot gases react and coat the wafer) also lays down films later on.</li><li><b>Ion implantation</b> (today's standard): fire dopant ions into the silicon. Energy sets the depth.</li></ul>`,
        `<p>Above ~800 °C dopants diffuse from high to low concentration, so once they're placed, later steps stay as cool as possible (apart from a deliberate <b>anneal</b> to smooth them out).</p>`,
        `<p class="aside">Implantation is random. In a tiny channel with only a few hundred dopant atoms, the count varies from transistor to transistor, and so does V<sub>t</sub>. Chapter 7 returns to this.</p>`,
      ]},
      { k: "learn", title: "Wells, threshold implants, and an edge effect", b: [
        `<p>A deep n-well is implanted at MeV energies: 2–3 MeV reaches 2.5–3.5 µm deep. The peak doping is below the surface (a <b>retrograde</b> well), which helps against latchup. Blocking such energetic ions takes very thick resist, so well shapes are coarse.</p>`,
        `<p>Then <b>threshold implants</b> adjust the doping near the surface to set V<sub>t</sub>. Several implant masks give several V<sub>t</sub> options on one chip.</p>`,
        `<p><b>Well-edge proximity:</b> ions scatter off the edge of the resist into the well, so transistors within about 1 µm of a well edge get a different V<sub>t</sub>.</p>`,
      ]},
      { k: "learn", title: "Silicon's secret weapon: its oxide", b: [
        `<p>Silicon won partly because SiO<sub>2</sub> is easy to grow and etch.</p>`,
        `<div class="tbl"><table><tbody>
          <tr><td><b>Wet</b></td><td>water vapour, 900–1000 °C, fast</td><td>thick field oxide</td></tr>
          <tr><td><b>Dry</b></td><td>pure O<sub>2</sub>, ~1200 °C, better quality</td><td>thin gate oxide</td></tr>
          <tr><td><b>ALD</b></td><td>atomic layer deposition, one layer at a time</td><td>ultra-thin films</td></tr></tbody></table></div>`,
        `<p>Grown oxide <b>consumes</b> silicon. SiO<sub>2</sub> takes about twice silicon's volume, so the oxide ends up projecting above <i>and</i> below the original surface.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A mixed-signal chip has a sensitive radio receiver beside a noisy CPU. Which process option helps most?", opts: [["Triple-well: a deep n-well isolates the receiver's nMOS from the shared substrate", true, "That's what it was introduced for."], ["n-well only", false, "All nMOS then share the substrate, which carries the CPU's noise."], ["A thicker gate oxide", false, "That doesn't isolate bodies."]] },
        { t: "mcq", q: "Why must processing after the implants stay relatively cool?", opts: [["Above ~800 °C dopants diffuse and the carefully placed profiles blur", true, "Only deliberate anneals are allowed."], ["The photoresist would melt", false, "Resist is stripped before hot steps; it's the dopants that move."], ["The wafer would bend", false, "Not the main reason."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What problem does a triple-well process solve that an n-well process doesn't?", model: "In an n-well process every nMOS sits directly in the shared p-substrate, so noise injected by digital circuits travels through the substrate to analog or memory circuits. A triple-well process puts some p-wells inside a deep n-well, isolating those nMOS bodies from the substrate and from each other." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  function xsec(k) {
    const T = 130;
    const box = (x1, y1, x2, y2, fill, op = 1, lab = "", cls = "s") => `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" style="fill:${fill};opacity:${op};stroke:var(--ink);stroke-width:1"/>` + (lab ? S.t((x1 + x2) / 2, (y1 + y2) / 2 + 4, lab, { cls }) : "");
    let s = box(10, T, 410, 228, "var(--card)") + S.t(400, 222, "p-well", { a: "end", cls: "s m" });
    if (k >= 7) s += box(10, 48, 410, T, "var(--muted)", 0.15) + S.t(404, 112, "dielectric", { a: "end", cls: "s m" });
    if (k >= 1) s += box(10, T - 4, 50, 180, "var(--muted)", 0.55, "STI", "s") + box(370, T - 4, 410, 180, "var(--muted)", 0.55, "STI", "s");
    if (k === 2) s += box(50, T - 3, 370, T, "var(--line)", 1) + S.t(210, T - 8, "thin gate oxide everywhere", { cls: "s m" });
    if (k >= 3) s += box(185, T - 3, 235, T, "var(--line)", 1) + box(185, 92, 235, T - 3, "var(--bad)", 0.75, "poly");
    if (k >= 4) s += box(135, T, 185, T + 9, "var(--cool)", 0.4) + box(235, T, 285, T + 9, "var(--cool)", 0.4);
    if (k === 4) s += S.t(210, T + 26, "shallow, light LDD implant: self-aligned to the gate", { cls: "s c" });
    if (k >= 5) s += box(173, 96, 185, T, "var(--good)", 0.6) + box(235, 96, 247, T, "var(--good)", 0.6) + box(50, T, 173, T + 26, "var(--cool)", 0.6, "n+") + box(247, T, 370, T + 26, "var(--cool)", 0.6, "n+");
    if (k === 5) s += S.t(120, 86, "SiN spacers mask the deep implant", { cls: "s c" });
    if (k >= 6) s += box(50, T - 4, 173, T, "var(--ink)", 0.7) + box(247, T - 4, 370, T, "var(--ink)", 0.7) + box(185, 88, 235, 92, "var(--ink)", 0.7);
    if (k === 6) s += S.t(210, 78, "silicide on gate, source and drain", { cls: "s c" });
    if (k >= 8) s += box(100, 48, 116, T - 4, "var(--muted)", 0.9) + box(304, 48, 320, T - 4, "var(--muted)", 0.9) + box(80, 28, 136, 48, "var(--accent)", 0.8, "metal1") + box(284, 28, 340, 48, "var(--accent)", 0.8, "metal1") + S.t(210, 40, "tungsten plugs", { cls: "s m" });
    if (k >= 5) s += S.t(112, 172, "source", { cls: "s" }) + S.t(308, 172, "drain", { cls: "s" });
    return S.svg(420, 232, s, { max: 440, label: "nMOS transistor cross-section during fabrication" });
  }
  const XSTEPS = [
    ["p-well", "Wells and threshold implants are done."],
    ["Shallow trench isolation", "Etch trenches around each active area, line them with oxide, fill with CVD oxide, then polish flat (CMP). The trenches keep neighbouring transistors apart and stop wires creating stray channels."],
    ["Gate oxide", "Grow the thin gate dielectric (with nitrogen added to raise its k) across the active area."],
    ["Polysilicon gate", "Deposit polysilicon, pattern it (gates and poly wires), and etch away the exposed gate oxide."],
    ["Lightly doped drain (LDD)", "A shallow, light n implant. The gate blocks it: source and drain land exactly on either side (self-aligned). Light doping lowers the field at the drain (fewer hot electrons, smaller short-channel effects)."],
    ["Spacers and deep source/drain", "Silicon nitride spacers on the gate's sides mask a deeper, heavier implant: low resistance, while the LDD tips stay near the channel."],
    ["Silicide", "React a refractory metal (nickel, cobalt, titanium…) with the exposed silicon to cut the resistance of the gate, source and drain."],
    ["Dielectric and CMP", "Cover everything with dielectric and polish it flat for the wiring."],
    ["Contacts and metal1", "Etch contact holes, fill with tungsten plugs, then build metal1 on top."],
  ];
  const p4 = {
    id: "p4", title: "Building the transistor", mins: 30,
    blurb: "Trench isolation, gate stack, self-aligned source and drain, LDD, spacers, silicide.",
    takeaway: "Isolation: transistors mustn't interact and wires mustn't form parasitic channels. Old processes used thick field oxide grown by LOCOS (the parasitic field transistor has V_t > V_DD), whose bird's beak wasted space. Since ~0.35 µm, shallow trench isolation (STI): etch trenches around active areas (pad oxide and nitride masks), grow a liner oxide, fill with CVD oxide, polish with CMP (chemical mechanical polishing). STI packs transistors as tightly as lithography allows and reduces sidewall capacitance and junction leakage; deeper trenches raise breakdown voltage. Gate stack: a few SiO₂ atomic layers (3–4 Å each) plus oxynitride (nitrogen raises k, lowering effective oxide thickness); 65 nm thin oxide EOT 10.5–15 Å; thick oxides for I/O. Self-aligned polysilicon gate: grow gate oxide, deposit and pattern poly, etch exposed oxide, implant source/drain; the gate masks the channel. (Metal gates used to need large overlap and capacitance.) Lightly doped drain (LDD, 10¹⁸–10²⁰ cm⁻³): reduces drain field (hot electrons, short-channel effects) but adds resistance, so SiN spacers mask a deeper heavier implant. Silicide (refractory metal reacted with silicon) lowers gate and source/drain resistance; when self-aligned on both, it's called salicide. Then dielectric and CMP. Halo doping near channel ends reduces DIBL, short-channel effects and punchthrough, but raises GIDL and BTBT leakage.",
    steps: [
      { k: "play", title: "Build one nMOS", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let k = 0;
          const draw = () => { f.innerHTML = xsec(k); ro.innerHTML = readout([[`Step ${k + 1} of ${XSTEPS.length}: ${XSTEPS[k][0]}`, XSTEPS[k][1]]]); };
          const nx = btn("Next step →", "primary"), bk = btn("← Back");
          nx.addEventListener("click", () => { k = Math.min(XSTEPS.length - 1, k + 1); draw(); });
          bk.addEventListener("click", () => { k = Math.max(0, k - 1); draw(); });
          const row = el(`<div class="row"></div>`); row.append(bk, nx);
          host.append(f, row, ro);
          draw();
        },
        `<p class="aside">Not to scale. This is a modern flow; Chapter 1 showed the simplified version.</p>`,
      ]},
      { k: "learn", title: "Isolation: LOCOS then STI", b: [
        `<p>Any wire over silicon is a capacitor that could invert the surface: a stray transistor. The fix is a thick insulator everywhere except the transistors.</p>`,
        `<div class="two"><div class="tile"><h3>LOCOS (old)</h3><p>Grow thick “field” oxide. It tapers into a <b>bird's beak</b> whose width grows with the oxide thickness, wasting space.</p></div><div class="tile"><h3>STI (since ~0.35 µm)</h3><p>Etch narrow <b>trenches</b> and fill them with oxide. Width doesn't depend on depth, so transistors pack as tightly as lithography allows. Less sidewall capacitance and leakage too.</p></div></div>`,
        `<p><b>CMP</b> (chemical mechanical polishing): a rotating wafer against a polishing pad with an abrasive, chemically active slurry. It flattens every layer, which the shallow depth of focus demands.</p>`,
      ]},
      { k: "learn", title: "Self-alignment, LDD and spacers", b: [
        `<p><b>Self-aligned gate:</b> pattern the gate <i>first</i>, then implant. The gate blocks the dopants, so source and drain end exactly at its edges, without perfect mask alignment. Early metal-gate processes did it the other way round and needed a big overlap, which added capacitance.</p>`,
        `<p><b>LDD:</b> a light, shallow implant near the channel lowers the electric field at the drain. Fewer hot electrons damage the oxide, and short-channel effects shrink. But light doping is resistive, so <b>spacers</b> then mask a deeper, heavier implant further out.</p>`,
        `<p><b>Halo</b> implants add doping near the channel ends: less DIBL and punchthrough, but more junction leakage (BTBT and GIDL from Chapter 2).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Put the steps in order (1 = first).", bins: ["1", "2", "3", "4", "5"], items: [
          ["Etch and fill trenches (STI)", 0, "Isolation comes before anything is built."],
          ["Grow gate oxide", 1, "On the flat active area."],
          ["Pattern polysilicon gates", 2, "The gate must exist before the source/drain implant."],
          ["Light LDD implant", 3, "Self-aligned to the gate."],
          ["Spacers, then deep source/drain implant", 4, "Spacers mask the deep implant."],
        ]},
        { t: "mcq", q: "Why does the polysilicon gate go down before the source/drain implant?", opts: [["So the gate itself masks the channel: source and drain form exactly at its edges", true, "Self-alignment. A metal gate couldn't survive the hot source/drain steps."], ["Because poly needs to be doped by that implant", false, "It is doped then too, but that's not the reason."], ["Because implants damage oxide", false, "The order is about alignment."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do processes use both a lightly doped drain and a deeper heavy implant?", model: "The light, shallow implant next to the channel reduces the electric field at the drain, protecting against hot-electron damage and short-channel effects. But lightly doped silicon is resistive, so spacers on the gate sides mask a second, deeper and heavier implant further from the channel, giving low resistance where the current spreads out." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Wires: contacts, metal layers, copper", mins: 25,
    blurb: "From tungsten plugs to a dozen copper layers in low-k dielectric, then glass on top.",
    takeaway: "Contacts are etched through the dielectric to source, drain and gate; tungsten (W) plugs fill them (aluminium doesn't fill small holes). Aluminium was deposited by evaporation or sputtering (plasma knocks metal atoms off a target) and etched (wet, or plasma for sharp profiles); piranha solution cleans wafers. Upper metal layers are often thicker and wider, the top one for power. Local interconnect (tungsten, below metal1) connects poly and diffusion on a fine pitch: dense SRAM cells. The book's IBM 90 nm example: 11 levels (local interconnect, five 1× copper layers, three 2×, two 4×, aluminium on top for pads); lower layers alternate preferred directions. Copper has lower resistance than Al but diffuses into silicon (kills transistors), is hard to etch, oxidizes, and is a pollutant, so it uses the dual damascene process: etch trenches and vias into dielectric, line with a Ta/TaN barrier (conductive, ~10 nm), copper seed layer, electroplate, polish with CMP. Low-k dielectrics reduce wire capacitance (so delay, noise and power): SiO₂ k 3.9–4.2; FSG 3.6 (130 nm); carbon-doped oxide 2.8–3 (90/65 nm); porous polymers lower; air gaps k = 1. Passivation (overglass) protects the chip, with openings for pads; bumping attaches solder bumps. Metrology: optical microscopes for large features, SEM (scanning electron microscope), EDX, TEM for tiny ones.",
    steps: [
      { k: "learn", title: "Contacts and plugs", b: [
        `<p>Holes are etched through the dielectric down to source, drain and gate. <b>Tungsten plugs</b> fill them, because aluminium doesn't fill tiny holes well.</p>`,
        `<p>Polysilicon crossing diffusion makes a transistor, so connecting a diffusion output to a poly input normally needs a short metal1 hop. Some processes add a tungsten <b>local interconnect</b> layer under metal1 for exactly this, on a finer pitch: denser SRAM cells.</p>`,
      ]},
      { k: "learn", title: "Why copper needs a new process", b: [
        `<p>Copper conducts better than aluminium. But copper atoms <b>diffuse into silicon and destroy transistors</b>, copper is hard to etch, and it oxidizes readily. The answer, the <b>damascene</b> process (after Damascus's inlaid swords), never etches copper at all:</p>`,
        `<ol><li>Lay down dielectric layers for the vias and the lines.</li><li>Etch the trenches and via holes <i>into the dielectric</i>.</li><li>Line them with a thin conductive <b>barrier</b> (tantalum, ~10 nm) to keep copper in.</li><li>Add a copper seed layer, then electroplate copper to fill everything.</li><li>Polish (CMP) the excess away, leaving copper inlaid in the trenches.</li></ol>`,
      ]},
      { k: "learn", title: "Low-k dielectrics", b: [
        `<p>Wire capacitance sets delay, noise and power, and it's proportional to the dielectric constant k between the wires.</p>`,
        `<div class="tbl"><table><tbody>
          <tr><td>SiO<sub>2</sub></td><td>3.9–4.2</td></tr><tr><td>Fluorinated glass (FSG), 130 nm</td><td>3.6</td></tr><tr><td>Carbon-doped oxide, 90–65 nm</td><td>2.8–3</td></tr><tr><td>Porous polymer</td><td>2.6, lower with more pores</td></tr><tr><td>Air gap</td><td>1</td></tr></tbody></table></div>`,
        `<p class="aside">The hard part: low-k materials are weak and must survive the heat of processing and the forces of polishing.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Wires in SiO₂ (k = 3.9) are moved to a k = 2.7 dielectric, same geometry. What fraction of the original capacitance remains?", a: 0.692, tol: 0.01, why: "C ∝ k: 2.7 / 3.9 = 0.69, about 31% less." },
        { t: "mcq", q: "Why does the damascene process etch the dielectric rather than the copper?", opts: [["Copper is very hard to etch, so trenches are made in the dielectric and filled with copper", true, "Then CMP removes the excess."], ["To save copper", false, "It's about etchability."], ["Dielectrics conduct better", false, "Dielectrics insulate."]] },
      ]},
      { k: "learn", title: "The metal stack, glass, and measuring", b: [
        `<p>The book's IBM 90 nm microprocessor: <b>11 levels</b>. Local interconnect, then five thin copper layers, three twice as thick and wide, two four times, and aluminium on top for the pads. Upper layers alternate direction (horizontal, vertical).</p>`,
        `<p>Last, <b>passivation</b> (overglass) seals the chip, with openings over the pads. Solder <b>bumps</b> may be added there.</p>`,
        `<p><b>Metrology</b>, measuring what was built: optical microscopes for big features, electron microscopes (SEM, TEM) once features are smaller than visible light's wavelength.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do upper metal layers tend to be thicker and wider than lower ones?", model: "Lower layers make short, dense local connections, so they need a fine pitch. Upper layers carry long wires, power and clocks across the chip, where resistance matters more than density, so they're made thicker and wider to lower resistance, at the cost of fewer tracks." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Layout design rules", mins: 25,
    blurb: "Widths, spacings and overlaps. Each one has a physical reason.",
    takeaway: "Design rules prescribe the masks: minimum widths, spacings and overlaps. They trade performance (aggressive rules) against yield (conservative rules); they're a tolerance for high probability of success, not a hard boundary. Well rules: n-well is deeper than source/drain, so needs clearance from n+ diffusion outside it; STI may allow zero inside clearance; well sheet resistance is several kΩ/□, so plenty of taps. Twin-well: the p-well is usually NOT n-well. Transistor masks: active (diffusion, OD, RX), n-select, p-select, poly; a gate is poly AND active; selects mark n or p; n-diffusion in a p-well is an nMOS, n-diffusion in an n-well a well tap, and so on. Poly must cross active completely (gate extension) or diffusion shorts source to drain; active must extend beyond poly for source and drain; poly-to-active spacing where no transistor is wanted. Contacts: metal to n/p diffusion, poly, well/substrate taps (on heavily doped regions); use more than one contact when possible; contacts are a fixed size. Metal: spacing may grow with width (fat-metal rules), maximum widths (wide wires built from parallel strips), thicker layers need wider rules. Vias: stacked vias allowed in planarized processes; uniform size, arrays for big connections. Other rules: minimum area, minimum notch, extensions. Scribe line, alignment marks, critical-dimension and vernier structures, test structures. MOSIS scalable λ rules (SCMOS, SUBM, DEEP); the 0.5 µm SUBM process uses λ = 0.3 µm, poly drawn 0.6 µm and biased by 0.1 µm (SPICE parameter XL). Plan metal at 8λ pitch. Industry uses micron rules; the book's 65 nm table is close to λ = 0.035 µm.",
    steps: [
      { k: "learn", title: "What rules are for", b: [
        `<p>Design rules are <b>width</b>, <b>spacing</b> and <b>overlap</b> limits on each mask. They aren't a line between working and broken: they're a tolerance that makes success <b>very likely</b>. A rule-breaking layout may work; a clean one may still fail, rarely.</p>`,
        `<p>Aggressive rules give smaller, faster circuits; conservative rules give better yield.</p>`,
        seenV("λ rules and simple layouts.", "01-introduction.html#p8", "Chapter 1, Part 8"),
      ]},
      { k: "learn", title: "Transistor rules", b: [
        `<p>A transistor needs four masks: <b>active</b>, <b>n-select</b>, <b>p-select</b> and <b>poly</b>. The gate is wherever poly <b>AND</b> active overlap.</p>`,
        `<ul><li><b>Gate extension:</b> poly must cross active completely and stick out. Otherwise a strip of diffusion runs round the gate's end and shorts source to drain.</li><li><b>Active extension:</b> active must stick out past the gate, or there's no source or drain.</li><li><b>Poly-to-active spacing:</b> where no transistor is wanted, keep them apart.</li></ul>`,
        `<div class="tbl"><table><thead><tr><th></th><th>in p-well/substrate</th><th>in n-well</th></tr></thead><tbody><tr><td>n-diffusion</td><td>nMOS</td><td>well tap</td></tr><tr><td>p-diffusion</td><td>substrate tap</td><td>pMOS</td></tr></tbody></table></div>`,
      ]},
      { k: "learn", title: "Contacts, metal, vias", b: [
        `<ul><li><b>Contacts</b> land on heavily doped silicon (that's why taps need n+ or p+). Use <b>two or more</b> per connection when you can: if one is malformed, the connection survives.</li><li><b>Metal:</b> wide wires may need extra spacing (“fat-metal” rules) and can't exceed a maximum width; build wide buses from parallel strips.</li><li><b>Vias</b> are a fixed size; big connections use arrays. Planarized processes allow stacked vias.</li><li><b>Others:</b> minimum area (tiny resist islands peel off), minimum notches (they confuse OPC).</li></ul>`,
        `<p class="aside">Around the chip: the <b>scribe line</b> where the saw cuts, plus alignment marks, verniers to measure misalignment, and test structures (contact chains, test transistors, ring oscillators).</p>`,
      ]},
      { k: "learn", title: "Lambda vs micron rules", b: [
        `<p><b>λ rules</b> (MOSIS SCMOS, SUBM, DEEP) scale with one number. For class projects in the 0.5 µm process, λ = 0.3 µm; poly is drawn 0.6 µm wide and shrunk 0.1 µm before mask-making, so in SPICE the drawn L gets an <code>XL</code> correction of −0.1 µm.</p>`,
        `<p>Processes never shrink uniformly, so industry uses <b>micron rules</b>: hundreds of pages per process. The book's 65 nm table is close to λ = 0.035 µm. For planning, assume a metal pitch of <b>8λ</b>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "What does each structure make?", bins: ["nMOS", "pMOS", "Well tap", "Substrate tap"], items: [
          ["p-diffusion inside an n-well, crossed by poly", 1, "p-type source/drain in an n body."],
          ["n-diffusion in the p-substrate, crossed by poly", 0, "The basic nMOS."],
          ["n-diffusion inside an n-well, with a contact", 2, "n+ makes an ohmic contact to the n-well."],
          ["p-diffusion in the p-substrate, with a contact", 3, "p+ ties the substrate to GND."],
        ]},
        { t: "mcq", q: "Poly stops just short of the far edge of the active area. What happens?", opts: [["A strip of diffusion connects source to drain: the transistor is always on (shorted)", true, "That's why the gate-extension rule exists."], ["The transistor is slightly narrower", false, "It no longer switches at all."], ["Nothing: poly only needs to cover most of the channel", false, "Any gap shorts it."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do industrial designs use micron rules instead of scalable λ rules?", model: "Real processes don't shrink uniformly from one generation to the next, so a single scale factor either wastes area by being too conservative, especially for metal, or breaks some rule. Micron rules state each limit exactly for the process, which gives denser layouts; the effort is worth it for standard cells and memories reused many times." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Better transistors", mins: 25,
    blurb: "Multiple thresholds, SOI, high-k metal gates, strained silicon, and the fins that came next.",
    takeaway: "Multiple V_t: low-V_t for speed on critical paths, high-V_t elsewhere for low leakage; set by extra implant masks or slightly longer channels (short-channel effect). Multiple oxide thicknesses: thin for logic, thick for I/O (e.g. 3.3 V I/O with 0.35 µm length and 7 nm oxide). Silicon on insulator (SOI): transistors on an insulator (buried oxide, or sapphire); no source/drain-to-body junction capacitance (faster), steeper subthreshold slope (lower n, less leakage); drawback: floating-body V_t variations. High-k: SiO₂ (k = 3.9) below ~10.5–12 Å (four atomic layers) leaks too much; oxynitride (k ≈ 4.1–4.2) from 130 nm; hafnium oxide (k ≈ 20) from Intel's 45 nm (2007) lets the dielectric be physically thicker for the same capacitance. Poly gates suffer poly depletion and are incompatible with high-k, so metal gates returned (different work-function metals for nMOS/pMOS), formed by a replacement-gate (gate-last) flow. Strained silicon raises mobility: tensile SiN cap for nMOS (+40% in Intel's 65 nm), compressive SiGe source/drain for pMOS (+100%); STI stress makes layout affect mobility. Also plastic (organic) transistors (µ ~0.15 cm²/V·s) and high-voltage transistors. Beyond: finfets / trigates wrap the gate around three sides of a vertical fin for better control of leakage; width comes from fin height, so wide devices use parallel fins. Since the book: finfets became mainstream (Intel 22 nm, 2011) and gate-all-around nanosheets followed at the most advanced nodes. III-V materials, carbon nanotubes are research.",
    steps: [
      { k: "learn", title: "Menus of transistors", b: [
        `<p>Modern processes offer several flavours on one chip:</p>`,
        `<ul><li><b>Several thresholds:</b> low-V<sub>t</sub> (fast, leaky) on critical paths, high-V<sub>t</sub> (slower, ~10× less leakage) everywhere else. Made with extra implant masks, or by drawing the channel slightly longer (the short-channel effect raises V<sub>t</sub>).</li><li><b>Several oxides:</b> thin for logic, thick for I/O circuits that see higher voltages.</li></ul>`,
      ]},
      { k: "learn", title: "Silicon on insulator", b: [
        `<p>Build the transistors in a thin silicon film on top of an insulator (a <b>buried oxide</b>, or sapphire).</p>`,
        `<div class="two"><div class="tile"><h3>Gains</h3><p>No source/drain-to-body junction capacitance: faster. Steeper subthreshold slope (smaller n): less leakage.</p></div><div class="tile"><h3>Cost</h3><p>The body floats, so V<sub>t</sub> drifts with the circuit's history.</p></div></div>`,
      ]},
      { k: "learn", title: "High-k and metal gates", b: [
        `<p>Gate capacitance is ε/t. SiO<sub>2</sub> (k = 3.9) hit a wall at about 10.5–12 Å, four atomic layers: any thinner and it leaks (Chapter 2's tunnelling). So raise <b>k</b> instead, and the dielectric can be physically thicker for the same capacitance.</p>`,
        `<ul><li>130 nm: nitrogen added (oxynitride), k ≈ 4.1–4.2.</li><li>2007, Intel 45 nm: <b>hafnium oxide</b>, k ≈ 20.</li></ul>`,
        `<p>Polysilicon gates don't work well with high-k, so <b>metal gates</b> came back (MOS is accurate again!). Problem: metal melts in the hot source/drain steps. Intel's trick: build the transistor with a dummy poly gate, then polish down, etch the poly out, and fill the trench with metal: a <b>replacement gate</b>.</p>`,
      ]},
      { k: "learn", title: "Strained silicon", b: [
        `<p>Stretch or squeeze the crystal and carriers move faster.</p>`,
        `<div class="two"><div class="tile"><h3>nMOS: tension</h3><p>A stressed silicon nitride cap over the gate. +40% electron mobility (Intel 65 nm).</p></div><div class="tile"><h3>pMOS: compression</h3><p>Etch the source/drain and refill with silicon-germanium (bigger atoms). +100% hole mobility.</p></div></div>`,
        `<p class="aside">The trench isolation stresses the channel too, so the shape of the diffusion in your layout changes the transistor's speed.</p>`,
      ]},
      { k: "learn", title: "Fins", b: [
        `<p>A planar gate controls the channel only from above, so the drain can leak underneath. A <b>finfet</b> (Intel: “trigate”) stands the channel up as a thin vertical fin and wraps the gate around three sides: much better control, much less leakage.</p>`,
        `<p>Width is set by the fin's height, so a wider transistor means <b>more fins in parallel</b>: widths come in whole numbers.</p>`,
        `<p class="aside">The book called finfets “promising”. Since then they became the standard (Intel 22 nm in 2011, then everyone), and the most advanced nodes have moved on to gate-all-around nanosheets: the gate surrounds stacked horizontal ribbons on all four sides.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why did processes switch to high-k gate dielectrics?", opts: [["To keep high gate capacitance while making the dielectric physically thick enough to stop tunnelling leakage", true, "C = kε₀/t: raise k, raise t, keep C."], ["To lower gate capacitance", false, "High gate capacitance is wanted: it attracts channel charge."], ["Because SiO₂ couldn't be patterned any more", false, "It's about leakage through very thin layers."]] },
        { t: "mcq", q: "A finfet process needs a transistor 2.6× as wide as one fin. You get…", opts: [["3 fins (or 2): width comes in whole fins", true, "Widths are quantized."], ["A fin 2.6× taller", false, "Fin height is fixed by the process."], ["2.6 fins", false, "Fins come whole."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does wrapping the gate around a fin reduce leakage?", model: "Leakage flows where the gate has weak control over the channel, for example deep below the surface where the drain's field reaches the source. With the gate on three sides of a thin fin, every part of the channel is close to the gate, so the gate can turn it off firmly, giving a steeper subthreshold slope and less DIBL." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Other circuit elements", mins: 20,
    blurb: "Capacitors, resistors, inductors, bipolar transistors, flash, fuses, 3D stacking.",
    takeaway: "Capacitors: MOS gate capacitors (high C per area but nonlinear), diffusion capacitors (one side grounded only), metal plate capacitors (low C per area); PIP (poly-insulator-poly, ~1 fF/µm²) needs a second poly; most common today: fringe capacitors of interdigitated metal fingers, stacked over several layers. Analog needs 1–10 pF. Resistors: high-resistivity layers (poly, diffusion, n-well); unsilicided poly with a silicide-block mask, ~300–1000 Ω/□; nichrome for precision. Meander layouts of unit resistors with dummy fingers at the ends for matching. Inductors: spiral of thick top metal with an underpass; parasitics R_s, C_p, C_s, R_p; Q 5–10 typical; bond wires ~1 nH/mm; Q improved by thicker metal, patterned ground shield, or removing substrate. Transmission lines: microstrip (over a ground plane) and coplanar waveguide. Bipolar: BiCMOS; the parasitic vertical pnp in an n-well (bandgap references; with a parasitic npn it causes latchup). Embedded DRAM (~5× denser than SRAM; trench capacitors). Non-volatile memory: mask ROM, one-time fuses, flash (floating gate under a control gate; ~20 V on the control gate tunnels electrons on (program), 20 V on the well tunnels them off (erase)). Fuses: laser-blown, or electronic eFUSEs (cobalt migration raises resistance ~10×; serial numbers, calibration, repair); antifuses (FPGAs). MEMS (accelerometers, micromirrors), integrated photonics (infrared waveguides, modulators, detectors; light from off-chip), 3D ICs (thinned wafers, through-silicon vias ~10⁴/mm²).",
    steps: [
      { k: "learn", title: "Passives on a logic process", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>Capacitors</b></td><td>MOS gate (dense but nonlinear); metal plates (weak). Most common today: <b>fringe capacitors</b>, interleaved metal fingers stacked over several layers. Analog needs 1–10 pF.</td></tr>
          <tr><td><b>Resistors</b></td><td>Poly with the silicide blocked: ~300–1000 Ω per square. Laid out as a <b>meander</b> of identical units, with <b>dummy</b> fingers at the ends so every real unit sees the same surroundings.</td></tr>
          <tr><td><b>Inductors</b></td><td>A spiral of thick top metal. Q of only 5–10, because of metal resistance and currents induced in the substrate. Bond wires: ~1 nH/mm.</td></tr></tbody></table></div>`,
        seenB("Sheet resistance and resistor matching use the same ideas.", "01-diodes.html#p6", "Chapter 1, Part 6"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Unsilicided poly is 400 Ω/□. A resistor strip is 0.5 µm wide and 30 µm long. What's its resistance?", a: 24, tol: 0.01, unit: "kΩ", hint: "Count squares: length ÷ width.", why: "60 squares × 400 Ω = 24 kΩ." },
        { t: "mcq", q: "Why add dummy fingers at the ends of a resistor array?", opts: [["So every real resistor has identical neighbours, and etch and implant effects match", true, "Edge units would otherwise come out different."], ["To raise the total resistance", false, "Dummies aren't connected."], ["For electrostatic protection", false, "They're for matching."]] },
      ]},
      { k: "learn", title: "Memory and programmable bits", b: [
        `<ul><li><b>Flash:</b> a <b>floating gate</b> sits between the channel and the control gate. Put ~20 V on the control gate and electrons tunnel onto the floating gate (program); put 20 V on the well and they tunnel off (erase). Trapped charge shifts V<sub>t</sub>, and stays when power's off.</li><li><b>eFUSE:</b> a narrow silicided poly line. Push 10–15 mA through it and the cobalt migrates away, raising the resistance ~10×. Used for serial numbers, sensor calibration, and switching in spare circuits.</li><li><b>Antifuse:</b> the opposite: starts open, programmed to a short (used in some FPGAs).</li><li><b>Embedded DRAM:</b> one transistor and one capacitor per bit, ~5× denser than SRAM.</li></ul>`,
      ]},
      { k: "learn", title: "Everything else", b: [
        `<ul><li><b>Bipolar transistors:</b> BiCMOS adds them. Even a plain n-well process has a <b>parasitic vertical pnp</b> (p+ emitter, n-well base, substrate collector), used in bandgap references, and, with a parasitic npn, the cause of latchup.</li><li><b>MEMS:</b> tiny machines: airbag accelerometers, projector micromirrors.</li><li><b>Photonics:</b> silicon is transparent to infrared, so waveguides, modulators and detectors can share the chip; the laser stays off-chip.</li><li><b>3D ICs:</b> thin wafers to ~20 µm, stack them, and join them with <b>through-silicon vias</b>. First use: stacked memory.</li></ul>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a flash cell store a bit with the power off?", model: "It has an extra, fully insulated floating gate under the normal control gate. A high voltage makes electrons tunnel through the thin oxide onto the floating gate, where they stay trapped because it's surrounded by insulator. The trapped charge shifts the transistor's threshold, so reading it later shows whether it was programmed. A high voltage the other way pulls them off to erase it." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  /* Toy layout on a 24 × 14 grid. Each layer is a list of [x1, y1, x2, y2) rectangles. */
  const GW = 24, GH = 14, CELL = 16;
  const rect = (x1, y1, x2, y2) => (x, y) => x >= x1 && x < x2 && y >= y1 && y < y2;
  const anyOf = (...rs) => (x, y) => rs.some((r) => r(x, y));
  const BASE = {
    nwell: anyOf(rect(0, 0, 24, 6)),
    active: anyOf(rect(3, 2, 13, 5), rect(17, 2, 20, 5), rect(3, 8, 13, 11), rect(17, 8, 20, 11)),
    "p-select": anyOf(rect(2, 1, 14, 6), rect(16, 7, 21, 12)),
    "n-select": anyOf(rect(2, 7, 14, 12), rect(16, 1, 21, 6)),
  };
  const RULES = [
    ["substrate", "NOT all nwell", (L, x, y) => !L.nwell(x, y)],
    ["nwell-active", "AND nwell active", (L, x, y) => L.nwell(x, y) && L.active(x, y)],
    ["pwell-active", "NOT active nwell", (L, x, y) => L.active(x, y) && !L.nwell(x, y)],
    ["pdiff", "AND nwell-active p-select", (L, x, y) => L.nwell(x, y) && L.active(x, y) && L["p-select"](x, y)],
    ["vddn", "AND nwell-active n-select", (L, x, y) => L.nwell(x, y) && L.active(x, y) && L["n-select"](x, y)],
    ["ndiff", "AND pwell-active n-select", (L, x, y) => !L.nwell(x, y) && L.active(x, y) && L["n-select"](x, y)],
    ["gndp", "AND pwell-active p-select", (L, x, y) => !L.nwell(x, y) && L.active(x, y) && L["p-select"](x, y)],
    ["ngates", "AND poly ndiff", (L, x, y) => L.poly(x, y) && !L.nwell(x, y) && L.active(x, y) && L["n-select"](x, y)],
    ["pgates", "AND poly pdiff", (L, x, y) => L.poly(x, y) && L.nwell(x, y) && L.active(x, y) && L["p-select"](x, y)],
  ];
  /* Count connected pieces of a cell predicate (4-neighbour flood fill). */
  function pieces(f) {
    const seen = new Set(); let n = 0;
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      if (!f(x, y) || seen.has(x + "," + y)) continue;
      n++; const st = [[x, y]]; seen.add(x + "," + y);
      while (st.length) { const [a, b] = st.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const u = a + dx, v = b + dy, k = u + "," + v; if (u >= 0 && v >= 0 && u < GW && v < GH && f(u, v) && !seen.has(k)) { seen.add(k); st.push([u, v]); } }); }
    }
    return n;
  }
  function layoutSvg(L, hi) {
    let s = "";
    const fillCells = (f, style) => { for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (f(x, y)) s += `<rect x="${x * CELL}" y="${y * CELL}" width="${CELL}" height="${CELL}" style="${style}"/>`; };
    fillCells(L.nwell, "fill:var(--cool-soft);opacity:.5");
    fillCells(L.active, "fill:var(--good);opacity:.35");
    fillCells(L.poly, "fill:var(--bad);opacity:.45");
    if (hi) fillCells(hi, "fill:var(--accent);opacity:.9;stroke:var(--ink);stroke-width:.5");
    s += S.t(GW * CELL - 4, 12, "n-well", { a: "end", cls: "s m" }) + S.t(GW * CELL - 4, GH * CELL - 4, "p-substrate", { a: "end", cls: "s m" });
    return S.svg(GW * CELL, GH * CELL, s, { max: 420, label: "Toy layout with a derived DRC layer highlighted" });
  }
  const p9 = {
    id: "p9", title: "DRC and extraction: geometry as logic", mins: 30,
    blurb: "AND, OR, NOT on whole mask layers find every transistor, then check widths and spacings.",
    takeaway: "The mask database is the interface between designer and fab. Two checks: design rule checking (DRC) that geometry obeys the rules, and circuit extraction that the masks produce the intended connected circuit (compared against the schematic: layout-versus-schematic). Both use run sets of geometric operations on layers: AND (intersection), OR (union), NOT a b (a minus b), WIDTH layer < d and SPACE layer < d (flag geometry that's too narrow or too close). The book's example derives sublayers: substrate = NOT all nwell; nwell-active = AND nwell active; pwell-active = NOT active nwell; pdiff = AND nwell-active p-select; vddn (well tap) = AND nwell-active n-select; ndiff = AND pwell-active n-select; gndp (substrate tap) = AND pwell-active p-select; ngates = AND poly ndiff; pgates = AND poly pdiff. Then DRC checks like WIDTH metal < 0.13 → errors. Extraction: CONNECT layers that touch electrically (contacts to diffusions and metal, taps to wells, poly contacts to poly and metal), and MOS statements define transistors by drain, gate, source and body layers (e.g. MOS nmos ndiff ngates ndiff substrate). The output netlist is only as good as the run set; parasitic capacitance and resistance must be coded explicitly.",
    steps: [
      { k: "learn", title: "Masks are sets", b: [
        `<p>A CAD tool sees each mask layer as a <b>set of shapes</b>. Combine them with set operations:</p>`,
        `<div class="tbl"><table><tbody>
          <tr><td>${c("AND a b -> c")}</td><td>c = where a and b overlap</td></tr>
          <tr><td>${c("OR a b -> c")}</td><td>c = a or b</td></tr>
          <tr><td>${c("NOT a b -> c")}</td><td>c = a minus b</td></tr>
          <tr><td>${c("WIDTH a < d -> err")}</td><td>flag anything narrower than d</td></tr>
          <tr><td>${c("SPACE a < d -> err")}</td><td>flag anything closer than d</td></tr></tbody></table></div>`,
        `<p>Two tools use them: <b>DRC</b> (are the rules obeyed?) and <b>extraction</b> (what circuit did I actually draw?).</p>`,
      ]},
      { k: "play", title: "Run the rule set", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let r = 7, shortPoly = 0;
          function draw() {
            const L = Object.assign({}, BASE, { poly: anyOf(rect(7, 1, 9, shortPoly ? 10 : 13)) });
            const hi = (x, y) => RULES[r][2](L, x, y);
            f.innerHTML = layoutSvg(L, hi);
            const nd = (x, y) => RULES[5][2](L, x, y) && !RULES[7][2](L, x, y);
            const np = pieces(nd);
            ro.innerHTML = readout([["Rule", `${RULES[r][1]} → ${RULES[r][0]}`], ["Pieces of ndiff after removing ngates", String(np)]]);
            vd.className = "verdict " + (np >= 2 ? "ok" : "no");
            vd.textContent = np >= 2 ? "The gate splits ndiff into source and drain: a real transistor." : "ndiff is still one piece: source and drain are shorted round the end of the gate!";
          }
          const sel = el(`<select aria-label="Rule to run"></select>`);
          RULES.forEach(([name, op], i) => { const o = document.createElement("option"); o.value = i; o.textContent = `${op} → ${name}`; sel.append(o); });
          sel.value = r; sel.addEventListener("change", () => { r = +sel.value; draw(); });
          host.append(sel, f, toggle(["Poly drawn correctly", "Poly too short"], (i) => { shortPoly = i; draw(); }), vd, ro);
          draw();
        },
        `<p class="aside">Green: active. Red: poly. Blue: n-well. Orange: the rule's output. Selects aren't drawn; they cover the top-left (p) and bottom-left (n) transistors, and the reverse for the taps on the right. Try every rule, then shorten the poly and run ${c("ngates")} again.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Which rule finds the well taps (vddn)?", opts: [["AND nwell-active n-select", true, "n+ diffusion inside the n-well."], ["AND nwell-active p-select", false, "That's pdiff: pMOS source/drain."], ["AND pwell-active p-select", false, "That's the substrate tap."]] },
        { t: "mcq", q: "Why is ngates = AND poly ndiff and not AND poly active?", opts: [["Poly over p-diffusion makes pMOS gates; we want only nMOS here", true, "pgates uses pdiff."], ["Poly never touches active", false, "Gates are exactly where it does."], ["They're the same", false, "active includes both diffusion types."]] },
      ]},
      { k: "learn", title: "Extraction", b: [
        `<p>Tell the tool which layers touch electrically, and what a transistor looks like:</p>`,
        `<pre class="code">CONNECT active-contact ndiff
CONNECT active-contact metal
CONNECT vddn nwell
CONNECT poly-contact poly
MOS nmos ndiff ngates ndiff substrate
MOS pmos pdiff pgates pdiff nwell</pre>`,
        `<p>Out comes a netlist (e.g. SPICE), which is compared against the schematic: <b>layout versus schematic</b> (LVS).</p>`,
        `<p class="aside">The output is only as good as the run set: parasitic capacitance and resistance appear only if someone coded every layer interaction.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a tool find every nMOS gate in a layout using only layer operations?", model: "First it derives ndiff: active area outside the n-well (NOT active nwell) that's also covered by n-select. Then it intersects poly with ndiff: wherever poly crosses n-diffusion is an nMOS gate. The remaining ndiff on either side of each gate is its source and drain." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "Design for manufacturability, and pitfalls", mins: 25,
    blurb: "Antennas that zap gates, density fill, one-direction poly, slots, yield habits.",
    takeaway: "Design for manufacturability (DFM). Antenna effect: during plasma etch a metal wire connected only to a gate collects charge that can damage the thin oxide (leakage, V_t shift, shorter life); source/drain diodes bleed charge away. Antenna rules limit metal area / gate area (100:1 to 5000:1, higher for thicker oxide). Fixes: jumper up to a higher metal near the gate, add a reverse-biased antenna diode, or widen the gate. Matched analog/memory transistors: connect gates to diffusion with short metal1. Layer density rules (e.g. metal 30–70% in every 100 × 100 µm) because etch and CMP depend on density (CMP dishing); sparse analog areas need fill (floating: less total C, more coupling; grounded: needs routing). RET rules: single-orientation poly, no small jogs or notches; restrictive design rules (Intel 45 nm: one poly pitch and direction) control variation and enable double patterning without hurting density. Wide metal (> 10–40 µm) needs slots (stress, electromigration). Yield guidelines: space wires out, wider wires, at least two vias, bigger landing pads, wider-than-minimum transistors, no 45° or curved shapes, dummy cells at array edges; “if it looks nice, it will work better.” Pitfalls: jumping to a bleeding-edge process too early; lambda rules in production; ignoring metal fill parasitics; omitting your own test structures; waiving design rules; cute logos that inspection tools mistake for dust. Mask sets for 65 nm exceed $1M and roughly double per node. History: hand-drawn layout on Mylar, rubylith cutting; Intel's first product, a 64-bit RAM, shipped as 63-bit.",
    steps: [
      { k: "learn", title: "The antenna effect", b: [
        `<p>Plasma etching charges up metal. A long metal1 wire whose only connection is a <b>transistor gate</b> collects that charge, and can zap the thin gate oxide: more leakage, a shifted V<sub>t</sub>, a shorter life.</p>`,
        `<p>Source/drain diodes would bleed the charge away, but if the wire reaches a diffusion only through a higher metal layer, that path doesn't exist yet when metal1 is etched.</p>`,
        `<p><b>Antenna rules</b> cap the ratio of metal area to gate area: 100:1 to 5000:1 depending on the oxide.</p>`,
      ]},
      { k: "play", title: "Fix an antenna violation", b: [
        (host, id) => {
          const ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let len = 300, fix = 0;
          const wid = 0.1, gate = 0.2 * 0.05, LIMIT = 400;
          function draw() {
            const exposed = fix === 1 ? Math.min(len, 5) : len, g = fix === 3 ? gate * 4 : gate;
            const ratio = (exposed * wid) / g;
            const ok = fix === 2 || ratio <= LIMIT;
            ro.innerHTML = readout([["metal1 area on the gate during its etch", fmt(exposed * wid, 3) + " µm²"], ["Gate area", fmt(g, 3) + " µm²"], ["Antenna ratio (limit 400:1)", fix === 2 ? "discharged by the diode" : fmt(ratio, 3) + " : 1"]]);
            vd.className = "verdict " + (ok ? "ok" : "no"); vd.textContent = ok ? "Passes the antenna check." : "Violation: the gate oxide could be damaged during the metal1 etch.";
          }
          host.append(slider({ id: id + "-l", label: "metal1 wire length (0.1 µm wide)", min: 5, max: 2000, log: true, value: len, show: (x) => fmt(x, 3) + " µm" }, (x) => { len = x; draw(); }).el,
            toggle(["No fix", "metal2 jumper near the gate", "Antenna diode", "Gate 4× wider"], (i) => { fix = i; draw(); }), vd, ro);
          draw();
        },
        `<p class="aside">Gate: 0.2 µm × 0.05 µm. The jumper leaves only a ~5 µm stub of metal1 on the gate; the rest connects later through metal2, when the diffusion path exists. The diode is reverse-biased in normal operation, so it only costs area and a little capacitance.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A gate is 0.4 µm × 0.05 µm. The limit is 500:1. What's the longest 0.1 µm-wide metal1 wire it can have alone?", a: 100, tol: 0.01, unit: "µm", hint: "Gate area 0.02 µm² × 500 = allowed metal area.", why: "10 µm² of metal ÷ 0.1 µm width = 100 µm." },
      ]},
      { k: "learn", title: "Density, fill, slots", b: [
        `<ul><li><b>Density rules:</b> etching and polishing depend on how much material is around. E.g. metal must cover 30–70% of every 100 × 100 µm window, or CMP may “dish” copper. Sparse analog areas get <b>fill</b> shapes added; floating fill means less total capacitance but more coupling; grounded fill needs ground routed to it.</li><li><b>Lithography-friendly rules:</b> poly in one direction only, no tiny jogs or notches. Intel's 45 nm went further with <b>restrictive design rules</b>: one poly pitch, one direction. Standard-cell density didn't suffer and yield was excellent.</li><li><b>Slots</b> in very wide metal (above ~10–40 µm): stress relief and electromigration.</li></ul>`,
      ]},
      { k: "learn", title: "Yield habits", b: [
        `<ul><li>Space wires out where there's room: fewer shorts, less capacitance.</li><li>Wider-than-minimum wires: fewer opens, less resistance.</li><li><b>Two vias</b> for every connection.</li><li>Generous landing pads around contacts and vias.</li><li>Wider-than-minimum transistors: less variation.</li><li>No 45° angles or circles.</li><li>Dummy cells at the edges of arrays.</li></ul>`,
        `<p class="aside">The book's rule of thumb: <b>if it looks nice, it will work better.</b></p>`,
      ]},
      { k: "check", title: "Pitfalls", b: [
        { t: "sort", q: "Good practice or pitfall?", bins: ["Good practice", "Pitfall"], items: [
          ["Waiving a spacing rule because both wires are the same net anyway", 1, "The thin resist strip between them can break off and damage something else; and tracking waivers doesn't scale."],
          ["Adding your own ring oscillators and test transistors to a class chip", 0, "Lets you calibrate silicon against simulation."],
          ["Using λ rules for a commercial nanometer design", 1, "Too conservative, especially for metal."],
          ["Re-simulating an analog block after automatic metal fill", 0, "Fill adds parasitic capacitance."],
          ["Hiding your initials in an empty corner of the die", 1, "Inspection tools may think it's dust and reject every die."],
          ["Moving to a brand-new process the month it opens", 1, "Rules and models often change in the first months, unless you truly need it."],
        ]},
      ]},
      { k: "why", title: "Before CAD", b: [
        `<p>In the early 1970s, layout was drawn with coloured pencils on huge sheets of Mylar and checked by eye. Two engineers each checked all 20,000 transistors of the 8086 by hand; both found 19 of the same 20 errors. Masks were cut by hand from <b>rubylith</b> with scalpels. Intel's first product, a 64-bit RAM, shipped as a <b>63-bit</b> RAM because of one peeling error.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe two ways to fix an antenna violation and why each works.", model: "One: break the long metal1 wire near the gate and hop up to metal2 and back. During the metal1 etch only a short stub is attached to the gate, so it collects little charge; the rest connects later, when diffusion paths exist to bleed charge. Two: add a small reverse-biased diode on the wire, which conducts during the hot plasma etch and drains the charge, but is off in normal operation." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "vlsi3", eyebrow: "CMOS VLSI · Chapter 3", title: "CMOS Processing Technology",
    intro: `<p>Ten parts: why designers care, photolithography, wells and oxide, building a transistor, wires, design rules, better transistors, other circuit elements, DRC and extraction, and manufacturability.</p><p>Chapter 1, Part 7 gave the short version; this is the real one. Few equations here: it's about knowing why each rule exists. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. Several use the MOSIS SUBM rules on the book's inside back cover: have them open, and sketch on grid paper.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10],
    summary: `
      <h3>Lithography</h3>
      <p>Pitch 2b = k<sub>1</sub>λ/NA, NA = n sin θ; DOF = k<sub>2</sub>λ/NA<sup>2</sup>. 193 nm immersion (NA 1.35); OPC, phase-shift masks, double patterning; EUV later.</p>
      <h3>Front end</h3>
      <p>Wells (n, twin, triple) → STI + CMP → gate stack → self-aligned poly gate → LDD → spacers + deep S/D → silicide → dielectric + CMP. Implantation is standard; keep cool after (except anneals).</p>
      <h3>Back end</h3>
      <p>Tungsten contacts; copper dual damascene (barrier, seed, electroplate, CMP); low-k dielectrics; thicker upper metals; passivation.</p>
      <h3>Rules</h3>
      <p>Width, spacing, overlap. Gate = poly AND active; gate extension; taps on n+/p+; two vias; λ vs micron rules; plan metal at 8λ.</p>
      <h3>Enhancements</h3>
      <p>Multi-V<sub>t</sub>, multi-oxide, SOI, high-k metal gate, strain, finfets. Fringe caps, poly resistors with dummies, spiral inductors, flash, eFUSEs, 3D.</p>
      <h3>CAD and DFM</h3>
      <p>DRC and extraction with AND/OR/NOT/WIDTH/SPACE; LVS. Antenna rules (jumper, diode, wider gate), density fill, single-direction poly, slots, yield habits.</p>`,
  };
  Course.start(window.CHAPTER);
})();
