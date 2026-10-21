(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  /* A short "you've already learned this" card that links back into the 6.002 book. */
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const KQ = 8.617e-5; /* k/q in volts per kelvin */

  /* Material data from Section 1.2–1.6 (room temperature). */
  const MAT = {
    Ge: { Eg: 0.67, ni: 2.5e13, mu: 3900, VK: 0.3, Is: "≈ 1 µA", bv: "under 100 V (max ≈ 400 V)", use: "Limited: some high-speed parts, and light/heat sensors." },
    Si: { Eg: 1.1, ni: 1.5e10, mu: 1500, VK: 0.7, Is: "≈ 10 pA", bv: "50 V to 1 kV (power parts up to 20 kV)", use: "Almost everything: cheap, plentiful, low leakage, decades of design know-how." },
    GaAs: { Eg: 1.43, ni: 1.7e6, mu: 8500, VK: 1.2, Is: "≈ 1 pA", bv: "≈ 10% above Si", use: "High speed and light: LEDs, solar cells, photodetectors, fast ICs." },
  };
  const niAt = (m, T) => m.ni * Math.pow(T / 300, 1.5) * Math.exp((-m.Eg / (2 * KQ)) * (1 / T - 1 / 300));

  /* A small silicon lattice. `center` replaces the middle atom; o.extra / o.hole mark the dopant's effect. */
  function lattice(center, o = {}) {
    const xs = [70, 170, 270], ys = [45, 125, 205];
    let s = "";
    xs.forEach((x, i) => ys.forEach((y, j) => {
      if (i < 2) s += `<line class="w" x1="${x + 22}" y1="${y}" x2="${x + 78}" y2="${y}" style="stroke-width:1.5"/><circle cx="${x + 44}" cy="${y - 5}" r="3.5" class="nd"/><circle cx="${x + 56}" cy="${y + 5}" r="3.5" class="nd"/>`;
      if (j < 2) s += `<line class="w" x1="${x}" y1="${y + 22}" x2="${x}" y2="${y + 58}" style="stroke-width:1.5"/><circle cx="${x - 5}" cy="${y + 34}" r="3.5" class="nd"/><circle cx="${x + 5}" cy="${y + 46}" r="3.5" class="nd"/>`;
    }));
    if (o.hole) s = s.replace(`<circle cx="214" cy="120" r="3.5" class="nd"/>`, `<circle cx="214" cy="120" r="6" style="fill:none;stroke:var(--bad);stroke-width:2.5"/>`);
    xs.forEach((x, i) => ys.forEach((y, j) => {
      const c = i === 1 && j === 1 ? center : "Si";
      s += `<circle cx="${x}" cy="${y}" r="20" class="el${c !== "Si" ? " hl" : ""}"/>` + S.t(x, y + 5, c, { cls: c !== "Si" ? "a" : "" });
    }));
    if (o.extra) s += `<circle cx="198" cy="98" r="6" style="fill:var(--cool)"/>` + S.t(206, 86, "spare electron", { a: "start", cls: "c s" });
    if (o.hole) s += S.t(226, 112, "hole", { a: "start", cls: "b s" });
    return S.svg(340, 250, s, { max: 340, label: "A small grid of silicon atoms joined by shared electron pairs" });
  }

  /* Shockley's equation and its inverse. */
  const shock = (V, Is, n, VT) => Is * (Math.exp(V / (n * VT)) - 1);
  const vOf = (I, Is, n, VT, rB = 0) => n * VT * Math.log(I / Is + 1) + I * rB;

  /* Zener symbol: a diode whose bar has bent ends. */
  function zener(x1, y, x2, label) {
    const m = (x1 + x2) / 2;
    return S.diode(x1, y, x2, y, label || "") + `<polyline class="w" points="${m + 3},${y - 15} ${m + 9},${y - 10}"/><polyline class="w" points="${m + 9},${y + 10} ${m + 15},${y + 15}"/>`;
  }

  /* Approximate colour of light at a wavelength, for the LED widget. */
  function waveRGB(nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = (440 - nm) / 60; b = 1; }
    else if (nm >= 440 && nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm >= 490 && nm < 510) { g = 1; b = (510 - nm) / 20; }
    else if (nm >= 510 && nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm >= 580 && nm < 645) { r = 1; g = (645 - nm) / 65; }
    else if (nm >= 645 && nm <= 750) { r = 1; }
    else return null;
    return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Semiconductors and energy bands", mins: 20,
    blurb: "Why silicon, germanium and gallium arsenide, and why heat helps them conduct.",
    takeaway: "Semiconductors conduct between a conductor and an insulator. Their atoms share valence electrons in covalent bonds. Heat or light can break a bond and free an electron, which takes at least the energy gap E_g (Ge 0.67 eV, Si 1.1 eV, GaAs 1.43 eV). Smaller gap, more free carriers, more temperature-sensitive. So semiconductors conduct better when hot: a negative temperature coefficient.",
    steps: [
      { k: "learn", title: "Between a conductor and an insulator", b: [
        `<p>A <b>semiconductor</b> conducts better than an insulator but worse than a conductor. Every chip and transistor starts as a very pure crystal of one.</p>`,
        `<div class="two">
          <div class="tile"><h3>Germanium (Ge)</h3><p>Used first (1940s–50s). Easy to purify, but too sensitive to temperature.</p></div>
          <div class="tile"><h3>Silicon (Si)</h3><p>Took over from 1954. Less temperature-sensitive and one of the most common elements on Earth.</p></div>
          <div class="tile"><h3>Gallium arsenide (GaAs)</h3><p>A <b>compound</b> of two elements. Up to five times faster than Si, but harder and costlier to make.</p></div>
        </div>`,
        `<p class="aside">Ge and Si are <b>single-crystal</b> semiconductors: one element repeating. GaAs, GaN and GaAsP are <b>compound</b> semiconductors.</p>`,
      ]},
      { k: "learn", title: "Atoms that share", b: [
        fig(lattice("Si")),
        `<p>Si and Ge have <b>4 valence electrons</b> (the outer ones, easiest to remove). Each atom shares one with each of its 4 neighbours. Every line above is a shared pair: a <b>covalent bond</b>.</p>`,
        `<p>In GaAs, gallium brings 3 and arsenic brings 5, so each pair of atoms still shares 8.</p>`,
        `<div class="key">Heat or light can kick an electron out of its bond. Now it's <b>free</b> to move, and it carries current. Pure (<b>intrinsic</b>) silicon at room temperature has about 1.5 × 10¹⁰ free electrons in each cm³.</div>`,
        `<p class="aside">That sounds like a lot, but it's only about one free electron for every 10¹² atoms.</p>`,
      ]},
      { k: "learn", title: "Energy bands", b: [
        `<p>A bound electron sits in the <b>valence band</b>. A free one is in the <b>conduction band</b>. Between them is a gap no electron can sit in: the <b>energy gap E<sub>g</sub></b>.</p>`,
        `<p>To break free, an electron must gain at least E<sub>g</sub>. It's measured in <b>electron volts</b>: the energy one electron gains crossing 1 V.</p>`,
        `<div class="eq">1 eV = (1.6 × 10⁻¹⁹ C)(1 V) = 1.6 × 10⁻¹⁹ J</div>`,
        `<div class="two"><div class="tile"><h3>Insulator</h3><p>E<sub>g</sub> &gt; 5 eV. Almost nothing gets across.</p></div><div class="tile"><h3>Semiconductor</h3><p>Ge 0.67 · Si 1.1 · GaAs 1.43 eV.</p></div><div class="tile"><h3>Conductor</h3><p>The bands overlap. Free electrons everywhere.</p></div></div>`,
      ]},
      { k: "predict", title: "Guess first", b: [
        { t: "mcq", q: "You warm Ge, Si and GaAs by the same amount. Which one gains the most free electrons?", opts: [
          ["Germanium", true, "Smallest gap, so the most electrons can make the jump. That's exactly why Ge lost to Si: its behaviour drifts with temperature."],
          ["Silicon", false, "Si's gap (1.1 eV) is bigger than Ge's (0.67 eV), so fewer electrons make it across. Try it in the next step."],
          ["Gallium arsenide", false, "GaAs has the biggest gap of the three. It's the hardest to jump."],
        ]},
      ]},
      { k: "play", title: "Heat it up", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          const kinds = ["Ge", "Si", "GaAs", "Insulator", "Conductor"];
          let k = 1, Tc = 25;
          function draw() {
            const kind = kinds[k], T = Tc + 273;
            const gapEV = kind === "Insulator" ? 5.5 : kind === "Conductor" ? 0 : MAT[kind].Eg;
            const gap = kind === "Conductor" ? -16 : Math.min(110, 18 + gapEV * 34);
            const vTop = 175, cBot = vTop - gap, cTop = cBot - 38;
            let n;
            if (kind === "Conductor") n = 26;
            else if (kind === "Insulator") n = 0;
            else n = Math.max(0, Math.min(24, Math.round((Math.log10(niAt(MAT[kind], T)) - 5) * 2.2)));
            let s = `<rect x="30" y="${vTop}" width="280" height="36" rx="6" style="fill:var(--cool-soft);stroke:var(--cool)"/>` + S.t(320, vTop + 23, "valence", { a: "start", cls: "s c" });
            s += `<rect x="30" y="${cTop}" width="280" height="38" rx="6" style="fill:var(--accent-soft);stroke:var(--accent);${kind === "Conductor" ? "opacity:.85" : ""}"/>` + S.t(320, cTop + 24, "conduction", { a: "start", cls: "s a" });
            for (let i = 0; i < n; i++) {
              const x = 42 + ((i * 97) % 256), y = cTop + 10 + ((i * 37) % 20);
              s += `<circle cx="${x}" cy="${y}" r="4.5" style="fill:var(--cool)"/>`;
              if (kind !== "Conductor") s += `<circle cx="${x}" cy="${vTop + 12 + ((i * 29) % 14)}" r="4.5" style="fill:none;stroke:var(--bad);stroke-width:2"/>`;
            }
            if (kind !== "Conductor") s += S.arrow(20, vTop, 20, cBot + 2, "") + S.arrow(20, cBot, 20, vTop - 2, "") + S.t(8, (vTop + cBot) / 2 + 4, `${gapEV} eV`, { a: "end", cls: "s" });
            else s += S.t(170, vTop - 4, "bands overlap", { cls: "s m" });
            f.innerHTML = S.svg(450, 225, `<g transform="translate(46,0)">${s}</g>`, { max: 450, label: "Energy band diagram with free electrons in the conduction band and holes in the valence band" });
            const pairs = [["Energy gap E<sub>g</sub>", kind === "Conductor" ? "none (overlap)" : gapEV + " eV"]];
            if (MAT[kind]) {
              const now = niAt(MAT[kind], T), room = niAt(MAT[kind], 298);
              pairs.push(["Free electrons per cm³", now.toExponential(1).replace("e+", " × 10^")], ["Compared with 25 °C", "× " + fmt(now / room, 3)]);
            } else pairs.push(["Free electrons", kind === "Conductor" ? "huge, and roughly fixed" : "almost none"]);
            ro.innerHTML = readout(pairs);
            vd.className = "verdict " + (kind === "Conductor" ? "mid" : "ok");
            vd.textContent = kind === "Conductor" ? "Heat doesn't add carriers here. It makes atoms vibrate, so resistance goes UP: a positive temperature coefficient." : kind === "Insulator" ? "The gap is too wide. Even hot, almost nothing crosses." : "Hotter, more electrons jump the gap, so resistance goes DOWN: a negative temperature coefficient.";
          }
          host.append(f, toggle(kinds, (i) => { k = i; draw(); }, 1),
            slider({ id: id + "-t", label: "Temperature", min: -50, max: 150, step: 5, value: 25, show: (v) => v + " °C" }, (v) => { Tc = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">Blue dots: free electrons. Red rings: the gaps they left behind. Dot counts are on a log scale. The real numbers are in the readout.</p>`,
      ]},
      { k: "check", title: "Quick check", b: [
        { t: "mcq", q: "A copper wire and a silicon bar both warm up from 20 °C to 60 °C. What happens to their resistances?", opts: [
          ["Copper's goes up, silicon's goes down", true, "Copper already has all the free electrons it'll get; heat just makes them bump into vibrating atoms more. Silicon gains free electrons as bonds break."],
          ["Both go up", false, "True for copper. But in silicon, heat frees more carriers, and that wins."],
          ["Both go down", false, "Copper doesn't gain carriers when heated. Its resistance rises."],
        ]},
        { t: "num", q: "Energy needed to lift one electron across silicon's 1.1 eV gap, in units of 10⁻¹⁹ J?", a: 1.76, unit: "× 10⁻¹⁹ J", hint: "Multiply the gap in eV by 1.6 × 10⁻¹⁹ J per eV.", why: "1.1 × 1.6 = 1.76, so 1.76 × 10⁻¹⁹ J." },
      ]},
      { k: "learn", title: "Speed: how mobile the carriers are", b: [
        `<p><b>Mobility μ<sub>n</sub></b> says how easily free electrons move through the material. Higher mobility, faster devices.</p>`,
        `<div class="readout"><div><span>Silicon</span><b>1500 cm²/V·s</b></div><div><span>Germanium</span><b>3900 cm²/V·s</b></div><div><span>Gallium arsenide</span><b>8500 cm²/V·s</b></div></div>`,
        `<p>So why is silicon still everywhere? It's cheap, there's lots of it, it leaks very little current, it copes with heat, and engineers have spent decades learning to design with it.</p>`,
        `<p class="aside">Doping (next part) uses a different, much bigger effect: adding about 1 impurity atom per million can turn a poor conductor into a good one. That's why purity of 1 part in 10 billion matters.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a semiconductor's resistance fall as it warms up, while a metal's rises?", model: "In a semiconductor, heat gives valence electrons enough energy to jump the energy gap and become free, so the number of carriers grows and resistance falls. A metal already has plenty of free electrons; heat just makes its atoms vibrate more, so carriers scatter more and resistance rises." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Doping: n-type and p-type", mins: 20,
    blurb: "One impurity atom in ten million changes everything.",
    takeaway: "Doping adds a tiny trace of impurity. Donors (5 valence electrons: P, As, Sb) give n-type material, full of free electrons. Acceptors (3 valence electrons: B, Ga, In) give p-type material, full of holes. Both stay electrically neutral. The plentiful carrier is the majority carrier, the rare one the minority carrier. Holes move opposite to electrons, in the direction of conventional current.",
    steps: [
      { k: "learn", title: "A trace of impurity", b: [
        seen("Doping silicon into n-type and p-type, and joining them into a diode.", "16-diodes.html#p1", "Chapter 16, Part 1"),
        `<p>This book goes further: what each impurity does to the crystal, what a hole really is, and which carriers outnumber which.</p>`,
        `<p>Doped material is called <b>extrinsic</b>. Pure material is <b>intrinsic</b>.</p>`,
      ]},
      { k: "play", title: "Swap one atom", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const opts = [["Pure silicon", "Si", {}], ["Add phosphorus (5 valence electrons)", "P", { extra: 1 }], ["Add boron (3 valence electrons)", "B", { hole: 1 }]];
          function draw(i) {
            const [, c, o] = opts[i];
            f.innerHTML = lattice(c, o);
            ro.innerHTML = readout(i === 0 ? [["Free electrons", "very few"], ["Holes", "very few"], ["Type", "intrinsic"]]
              : i === 1 ? [["Free electrons", "lots (one per donor)"], ["Holes", "very few"], ["Type", "n-type: P is a donor"]]
              : [["Free electrons", "very few"], ["Holes", "lots (one per acceptor)"], ["Type", "p-type: B is an acceptor"]]);
          }
          host.append(f, toggle(opts.map((x) => x[0]), draw, 0), ro);
          draw(0);
        },
        `<p><b>Phosphorus</b> fits into 4 bonds and has one electron left over. It's barely held, so it wanders off. Phosphorus <b>donates</b> it: a <b>donor</b>.</p>`,
        `<p><b>Boron</b> only has 3, so one bond is missing an electron. That gap is a <b>hole</b>. It readily <b>accepts</b> an electron: an <b>acceptor</b>.</p>`,
        `<p class="aside">Other donors: arsenic, antimony (Group V). Other acceptors: gallium, indium (Group III).</p>`,
      ]},
      { k: "predict", title: "Charged or not?", b: [
        { t: "mcq", q: "n-type silicon is full of extra free electrons. Is the material negatively charged?", opts: [
          ["No. It's neutral", true, "Each phosphorus atom brought one extra electron AND one extra proton in its nucleus. When the electron wanders off, the atom left behind is a + ion. Overall, the charges still balance."],
          ["Yes, slightly negative", false, "Count protons too. Each donor atom has one more proton than silicon, which balances its extra electron."],
          ["Yes, very negative", false, "The extra electrons are balanced exactly by extra protons in the donor nuclei."],
        ]},
      ]},
      { k: "play", title: "How a hole moves", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`);
          let h = 5;
          function draw() {
            let s = "";
            for (let i = 0; i < 6; i++) {
              const x = 40 + i * 54;
              s += `<circle cx="${x}" cy="70" r="18" class="el"/>` + S.t(x, 75, i === 5 ? "B" : "Si", { cls: i === 5 ? "a" : "" });
              if (i < 5) s += i + 1 === h ? `<circle cx="${x + 27}" cy="70" r="6" style="fill:none;stroke:var(--bad);stroke-width:2.5"/>` : `<circle cx="${x + 27}" cy="70" r="5" class="nd"/>`;
            }
            s += S.arrow(250, 125, 310, 125, "electrons move →", { ly: 148 }) + `<line x1="130" y1="125" x2="70" y2="125" style="stroke:var(--bad);stroke-width:2.2"/><polygon points="60,125 70,120 70,130" style="fill:var(--bad)"/>` + S.t(100, 148, "← hole moves", { cls: "b" });
            f.innerHTML = S.svg(360, 160, s, { max: 360, label: "A row of atoms with one empty bond position, the hole" });
          }
          const b = el(`<button type="button" class="btn">Next jump: an electron fills the hole</button>`);
          const r = el(`<button type="button" class="btn ghost">Reset</button>`);
          b.addEventListener("click", () => { if (h > 1) h--; draw(); });
          r.addEventListener("click", () => { h = 5; draw(); });
          const row = el(`<div class="row"></div>`); row.append(b, r);
          host.append(f, row);
          draw();
        },
        `<p>A neighbour's electron hops into the hole. That leaves a new hole where it came from. Repeat: the electrons step right, one at a time, and the <b>hole travels left</b>.</p>`,
        `<div class="key">A hole acts like a <b>positive</b> carrier moving opposite to the electrons. This book uses <b>conventional current</b>, which points the way holes flow.</div>`,
      ]},
      { k: "check", title: "Majority and minority", b: [
        { t: "sort", q: "Every doped material still has a few of the 'wrong' carrier, made by heat. Sort each one.", bins: ["Majority carrier", "Minority carrier"], items: [
          ["Electrons in n-type", 0, "Donors supplied them, so they hugely outnumber the holes."],
          ["Holes in n-type", 1, "Only the few made by heat. Their number barely changes when you dope."],
          ["Holes in p-type", 0, "Acceptors made lots of them."],
          ["Electrons in p-type", 1, "Only the few freed by heat."],
        ]},
        { t: "num", q: "Pure silicon has about 1 free electron per 10¹² atoms. You dope it with 1 phosphorus atom per 10⁸ atoms. How many times more free electrons does it have now?", a: 10000, unit: "×", hint: "Each donor gives one electron. Compare 1 per 10⁸ with 1 per 10¹².", why: "10¹² / 10⁸ = 10⁴: ten thousand times more carriers from a trace you could never see." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is a hole, and why does it count as a positive carrier?", model: "A hole is a missing electron in a covalent bond, for example next to a boron atom. When a neighbouring electron jumps in to fill it, the hole moves to where that electron came from. So the hole travels opposite to the electrons, exactly like a positive charge would, and its direction matches conventional current." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "The p–n junction and bias", mins: 20,
    blurb: "Join p to n and you get a one-way gate. Watch the depletion region breathe.",
    takeaway: "Joining p and n makes a depletion region with no free carriers, only fixed ions. No bias: no net current. Reverse bias (+ on n): the depletion region widens, majority flow stops, only the tiny minority-carrier current I_s flows, and it doesn't grow with more voltage. Forward bias (+ on p): the region narrows and majority carriers flood across, so current rises exponentially.",
    steps: [
      { k: "learn", title: "The depletion region", b: [
        `<p>Put p-type next to n-type. Near the boundary, free electrons from the n side fill holes on the p side. Both carriers vanish.</p>`,
        `<p>What's left there? Only the dopant atoms, now charged: <b>− ions</b> on the p side and <b>+ ions</b> on the n side. No free carriers. That strip is the <b>depletion region</b>.</p>`,
        `<p><b>Bias</b> means applying an outside voltage across the two leads. The book defines V<sub>D</sub> as positive when the <b>p side</b> (the anode) is at the higher voltage.</p>`,
      ]},
      { k: "predict", title: "Guess first", b: [
        { t: "mcq", q: "You connect the + terminal of a battery to the n side. What happens to the depletion region?", opts: [
          ["It gets wider", true, "The + terminal pulls electrons away from the junction on the n side (and the − terminal pulls holes away on the p side). More ions are uncovered, so the region widens."],
          ["It gets narrower", false, "That's what + on the p side does. Try it in the next step."],
          ["It stays the same", false, "The battery pulls carriers away from the junction, which uncovers more ions."],
        ]},
      ]},
      { k: "play", title: "Bias the junction", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          const Is = 10e-12, VT = 0.026;
          let V = 0;
          function draw() {
            const w = Math.max(5, Math.min(78, 28 * Math.sqrt(Math.max(0.02, (0.72 - V) / 0.72))));
            const J = 180;
            let s = `<rect x="20" y="40" width="160" height="90" style="fill:var(--accent-soft)"/><rect x="180" y="40" width="160" height="90" style="fill:var(--cool-soft)"/>`;
            s += `<rect x="${J - w}" y="40" width="${2 * w}" height="90" style="fill:var(--card);stroke:var(--muted);stroke-dasharray:4 3"/>`;
            for (let i = 0; i < 24; i++) {
              const x = 28 + (i % 6) * 26 + ((i * 7) % 9), y = 52 + Math.floor(i / 6) * 22;
              if (x < J - w - 4) s += `<circle cx="${x}" cy="${y}" r="5" style="fill:none;stroke:var(--accent);stroke-width:2"/>`;
              else if (x < J - 4) s += S.t(x, y + 5, "−", { cls: "big m" });
              const x2 = 2 * J - x;
              if (x2 > J + w + 4) s += `<circle cx="${x2}" cy="${y}" r="5" style="fill:var(--cool)"/>`;
              else if (x2 > J + 4) s += S.t(x2, y + 5, "+", { cls: "big m" });
            }
            s += S.t(100, 32, "p", { cls: "big a" }) + S.t(260, 32, "n", { cls: "big c" }) + S.t(J, 150, "depletion region", { cls: "s m" });
            const pol = V > 0.001 ? ["+", "−"] : V < -0.001 ? ["−", "+"] : ["", ""];
            s += `<line class="w" x1="20" y1="85" x2="6" y2="85"/><line class="w" x1="340" y1="85" x2="354" y2="85"/>` + S.t(8, 72, pol[0], { cls: "big" }) + S.t(352, 72, pol[1], { cls: "big" });
            f.innerHTML = S.svg(360, 160, s, { max: 360, label: "A p–n junction: holes on the left, electrons on the right, ions in the depletion region" });
            const I = shock(V, Is, 1, VT);
            ro.innerHTML = readout([["V<sub>D</sub>", fmt(V, 3) + " V"], ["Diode current I<sub>D</sub>", si(I, "A")], ["Depletion width", fmt((2 * w) / 56, 2) + "× its no-bias width"]]);
            vd.className = "verdict " + (V > 0.4 ? "ok" : V < -0.001 ? "no" : "mid");
            vd.textContent = V > 0.4 ? "Forward bias: barrier thin, majority carriers flood across." : V > 0.001 ? "Forward bias, but still below the knee: only a trickle so far." : V < -0.001 ? "Reverse bias: barrier wide. Only the tiny reverse saturation current I_s leaks back." : "No bias: the small flows in each direction cancel. Net current 0.";
          }
          host.append(f, slider({ id: id + "-v", label: "Bias voltage V<sub>D</sub> (+ means + on p)", min: -10, max: 0.75, step: 0.05, value: 0, show: (v) => fmt(v, 3) + " V" }, (v) => { V = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">Orange rings: holes. Blue dots: free electrons. − and +: fixed ions in the depletion region. The current uses I<sub>s</sub> = 10 pA.</p>`,
      ]},
      { k: "learn", title: "What carries the current", b: [
        `<div class="two">
          <div class="tile"><h3>Reverse bias</h3><p>Majority carriers can't climb the wide barrier. But the few <b>minority</b> carriers are pulled straight across. That small, steady flow is the <b>reverse saturation current I<sub>s</sub></b>: usually nA or less.</p></div>
          <div class="tile"><h3>Forward bias</h3><p>The barrier shrinks, and huge numbers of <b>majority</b> carriers push across. The current grows exponentially. For silicon, V<sub>D</sub> stays below about 1 V.</p></div>
        </div>`,
        `<div class="key">Forward bias: <b>+ on p, − on n</b>. Then the current flows in the direction of the arrow in the diode symbol.</div>`,
      ]},
      { k: "check", title: "Think it through", b: [
        { t: "mcq", q: "You double the reverse voltage. The reverse current…", opts: [
          ["stays about the same", true, "I_s is set by how many minority carriers heat produces, not by how hard you pull. Pulling harder can't make more of them. That's why it's called 'saturation' current."],
          ["doubles", false, "That would be a resistor. Here the supply of minority carriers is the limit, not the voltage."],
          ["drops to zero", false, "A wider barrier stops the majority flow, but minority carriers still get swept across."],
        ]},
        { t: "mcq", q: "With no battery at all, carriers still cross the junction both ways. Why is the current zero?", opts: [
          ["The flows in each direction exactly cancel", true, "A few energetic majority carriers cross one way, minority carriers get swept the other. With no bias they balance, so the net current is 0."],
          ["Nothing crosses at all", false, "Some carriers always cross. It's the net flow that's zero."],
          ["The depletion region is a perfect insulator", false, "It has no free carriers of its own, but carriers can still be swept through it."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain why reverse bias gives only a tiny current that doesn't grow with voltage.", model: "Reverse bias widens the depletion region, so majority carriers can't get across. Only minority carriers, which are made by heat and are very few, get swept through. Since their number is fixed by temperature, not voltage, the current saturates at the small value I_s." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Shockley's equation", mins: 20,
    blurb: "The diode law again, with two new knobs and a real diode next to it.",
    takeaway: "I_D = I_s(e^(V_D/nV_T) − 1). The ideality factor n is between 1 and 2 (this book uses 1). V_T = kT/q is the thermal voltage, about 26 mV at 27 °C. Real diodes sit to the right of the equation, because body and contact resistance add I·r_B volts, and their reverse current is larger than I_s because of leakage.",
    steps: [
      { k: "learn", title: "The same law, in this book's letters", b: [
        seen("The exponential diode law and its sharp-looking knee.", "16-diodes.html#p2", "Chapter 16, Part 2"),
        `<div class="eq">I<sub>D</sub> = I<sub>s</sub> (e<sup>V<sub>D</sub>/nV<sub>T</sub></sup> − 1)</div>`,
        `<ul><li><b>n</b>: the <b>ideality factor</b>, between 1 and 2 depending on the diode and its current. This book uses n = 1 unless it says otherwise.</li><li><b>V<sub>T</sub> = kT/q</b>: the <b>thermal voltage</b>.</li></ul>`,
        `<div class="key">⚠ Notation trap: this V<sub>T</sub> is the <b>thermal</b> voltage. In 6.002 it's called V<sub>TH</sub>, and 6.002's V<sub>T</sub> is the MOSFET <i>threshold</i>.</div>`,
      ]},
      { k: "math", title: "Working out V_T", b: [
        `<div class="eq">V<sub>T</sub> = kT<sub>K</sub>/q,   T<sub>K</sub> = T(°C) + 273,   k = 1.38 × 10⁻²³ J/K,   q = 1.6 × 10⁻¹⁹ C</div>`,
        `<p>Body temperature, 37 °C: T<sub>K</sub> = 310 K.</p>`,
        `<div class="eq">V<sub>T</sub> = (1.38 × 10⁻²³)(310) / (1.6 × 10⁻¹⁹) = 26.7 mV</div>`,
        { t: "num", q: "Your turn: V_T inside a hot box at 60 °C, in mV?", a: 28.7, unit: "mV", hint: "First T_K = 60 + 273. Then multiply by k and divide by q.", why: "333 K × 1.38 × 10⁻²³ / 1.6 × 10⁻¹⁹ = 28.7 mV. Hotter means bigger V_T." },
      ]},
      { k: "play", title: "Turn the knobs", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let Is = 1e-14, n = 1, rB = 0;
          const VT = 0.026;
          function draw() {
            const ideal = { f: (V) => 1000 * shock(V, Is, n, VT), cls: "s5" };
            const pts = [];
            for (let i = 0; i <= 120; i++) { const I = (i / 120) * 0.025; pts.push([vOf(I, Is, n, VT, rB), 1000 * I]); }
            f.innerHTML = plot({ x: [0, 1.2], y: [0, 22], xt: [0, 0.3, 0.6, 0.9, 1.2], yt: [0, 5, 10, 15, 20], xl: "V_D (V)", yl: "I_D (mA)",
              series: [ideal, { pts, cls: "s1" }], label: "Diode current versus voltage: the equation (dashed) and a diode with body resistance (solid)" });
            ro.innerHTML = readout([["V<sub>D</sub> at 10 mA, equation", fmt(vOf(0.01, Is, n, VT), 3) + " V"], ["V<sub>D</sub> at 10 mA, with r<sub>B</sub>", fmt(vOf(0.01, Is, n, VT, rB), 3) + " V"], ["Extra volts from r<sub>B</sub>", fmt(0.01 * rB * 1000, 3) + " mV"]]);
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(
            slider({ id: id + "-is", label: "Saturation current I<sub>s</sub>", min: 1e-16, max: 1e-10, log: true, value: 1e-14, show: (v) => si(v, "A") }, (v) => { Is = v; draw(); }).el,
            slider({ id: id + "-n", label: "Ideality factor n", min: 1, max: 2, step: 0.1, value: 1, show: (v) => fmt(v) }, (v) => { n = v; draw(); }).el,
            slider({ id: id + "-rb", label: "Body + contact resistance r<sub>B</sub>", min: 0, max: 20, step: 1, value: 0, show: (v) => v + " Ω" }, (v) => { rB = v; draw(); }).el);
          host.append(f, box, ro);
          draw();
        },
        `<p class="aside">Dashed: the equation. Solid: a "real" diode with r<sub>B</sub>. Bigger n or smaller I<sub>s</sub> moves the knee right.</p>`,
      ]},
      { k: "why", title: "Why real diodes differ", b: [
        `<p><b>Shift to the right:</b> the silicon itself and the metal contacts have a little resistance r<sub>B</sub>. At current I it adds I·r<sub>B</sub> volts.</p>`,
        `<p><b>Bigger reverse current:</b> a real diode's reverse current is larger than I<sub>s</sub> in the equation. Reasons:</p>`,
        `<ul><li>surface leakage</li><li>carriers created inside the depletion region</li><li>more doping</li><li>bigger junction area (double the area, roughly double the current)</li><li>temperature (next part)</li></ul>`,
        `<p class="aside">The book separates the two names: <b>reverse saturation current</b> is the physics in the equation, <b>reverse current</b> is what you actually measure.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "n = 1, V_T = 26 mV. You raise V_D by 52 mV. The current is multiplied by about…", a: 7.39, unit: "×", tol: 0.03, hint: "52 mV is 2 × V_T. What is e²?", why: "e^(52/26) = e² ≈ 7.4. Every extra 26 mV multiplies the current by e ≈ 2.7." },
        { t: "mcq", q: "For a large negative V_D, what does the equation give for I_D?", opts: [
          ["−I_s", true, "e to a large negative power is almost 0, so I_D = I_s(0 − 1) = −I_s: a tiny current flowing backward."],
          ["0 exactly", false, "Close, but the −1 term remains: I_D = −I_s."],
          ["A large negative current", false, "Not until breakdown, which this equation doesn't include."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What do n and V_T each do to the diode curve?", model: "Both sit in the exponent's denominator, nV_T, which sets how many volts it takes to multiply the current by e. A bigger n (towards 2) or a higher temperature (bigger V_T = kT/q) makes the curve rise more gently, so you need more voltage for the same current." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Breakdown, materials and temperature", mins: 20,
    blurb: "Push it backward too hard, compare Ge, Si and GaAs, and heat things up.",
    takeaway: "Too much reverse voltage causes breakdown (avalanche, or Zener at low voltages under about 5 V). Stay below the PIV/PRV rating. Knee voltages: Ge 0.3 V, Si 0.7 V, GaAs 1.2 V. For a silicon diode, each 1 °C rise shifts the forward curve left by 2.5 mV, and each 10 °C rise doubles the reverse current.",
    steps: [
      { k: "learn", title: "Breakdown", b: [
        `<p>Push the reverse voltage far enough and the current suddenly shoots up. That voltage is the <b>breakdown potential V<sub>BV</sub></b>.</p>`,
        `<div class="two">
          <div class="tile"><h3>Avalanche</h3><p>Fast minority carriers smash into atoms and knock more electrons free. Those knock out more. A chain reaction.</p></div>
          <div class="tile"><h3>Zener</h3><p>Heavy doping makes the junction field so strong it rips electrons out of bonds directly. Matters when V<sub>BV</sub> is low, about 5 V or less.</p></div>
        </div>`,
        `<div class="key">The <b>PIV</b> (peak inverse voltage) or <b>PRV</b> rating is the most reverse voltage a diode can take before breakdown. Need more? Put diodes in <b>series</b>. Need more current? Put them in <b>parallel</b>.</div>`,
      ]},
      { k: "play", title: "Ge vs Si vs GaAs", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const names = ["Ge", "Si", "GaAs"];
          const curve = (VK) => (V) => 4 * Math.exp((V - VK) / 0.06);
          function draw(i) {
            const m = MAT[names[i]];
            f.innerHTML = plot({ x: [0, 1.5], y: [0, 30], xt: [0, 0.3, 0.7, 1.2, 1.5], yt: [0, 10, 20, 30], xl: "V_D (V)", yl: "I_D (mA)",
              series: names.map((nm, k) => ({ f: curve(MAT[nm].VK), cls: k === i ? "s1" : "s5" })),
              texts: names.map((nm) => ({ x: MAT[nm].VK + 0.13, y: 26, s: nm, a: "middle" })),
              label: "Forward curves of germanium, silicon and gallium arsenide diodes" });
            ro.innerHTML = readout([["Knee voltage V<sub>K</sub>", m.VK + " V"], ["Typical reverse current", m.Is], ["Breakdown voltage", m.bv], ["Electron mobility", m.mu + " cm²/V·s"]]) + `<p class="aside">${m.use}</p>`;
          }
          host.append(f, toggle(names, draw, 1), ro);
          draw(1);
        },
        `<p>Same shape, different place. The <b>knee voltage V<sub>K</sub></b> is the middle of the bend where current takes off.</p>`,
      ]},
      { k: "predict", title: "Guess first", b: [
        { t: "mcq", q: "A silicon diode carries a steady 10 mA. It warms from 25 °C to 85 °C. Its forward voltage…", opts: [
          ["drops", true, "Heat frees more carriers, so less voltage is needed for the same current. About 2.5 mV less per °C: 60 × 2.5 mV = 150 mV less."],
          ["rises", false, "More carriers means it conducts more easily. The curve slides left, not right."],
          ["doesn't change", false, "It changes quite a lot: about 2.5 mV per °C."],
        ]},
      ]},
      { k: "play", title: "Turn up the heat", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let T = 25;
          const base = (V) => 4 * Math.exp((V - 0.7) / 0.06);
          function draw() {
            const sh = -0.0025 * (T - 25);
            f.innerHTML = plot({ x: [0, 1], y: [0, 30], xt: [0, 0.25, 0.5, 0.75, 1], yt: [0, 10, 20, 30], xl: "V_D (V)", yl: "I_D (mA)",
              series: [{ f: base, cls: "s5" }, { f: (V) => base(V - sh), cls: "s1" }], marks: [{ x: 0.7 + sh + 0.06 * Math.log(10 / 4), y: 10, label: "10 mA", dx: 10 }],
              label: "Silicon diode forward curve at room temperature (dashed) and at the chosen temperature (solid)" });
            ro.innerHTML = readout([["V<sub>D</sub> at 10 mA", fmt(0.7 + sh + 0.06 * Math.log(10 / 4), 3) + " V"], ["Shift from 25 °C", fmt(sh * 1000, 3) + " mV"], ["Reverse current (10 nA at 25 °C)", si(10e-9 * Math.pow(2, (T - 25) / 10), "A")]]);
          }
          host.append(f, slider({ id: id + "-t", label: "Temperature", min: -75, max: 175, step: 5, value: 25, show: (v) => v + " °C" }, (v) => { T = v; draw(); }).el, ro);
          draw();
        },
        `<div class="key">Silicon rules of thumb: forward curve moves <b>left 2.5 mV per °C</b>. Reverse current <b>doubles every 10 °C</b>.</div>`,
        `<p class="aside">Breakdown voltage changes with temperature too: usually up, but down for diodes that break down below about 5 V.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "A silicon diode leaks 2 nA at 25 °C. What does it leak at 65 °C, in nA?", a: 32, unit: "nA", hint: "How many 10 °C steps from 25 to 65? Double once per step.", why: "4 steps of 10 °C: 2 × 2⁴ = 32 nA." },
        { t: "num", q: "It drops 0.68 V at 5 mA when at 25 °C. What does it drop at 5 mA and 105 °C?", a: 0.48, unit: "V", hint: "80 °C hotter, at 2.5 mV per °C, and the voltage goes down.", why: "80 × 2.5 mV = 200 mV less: 0.68 − 0.20 = 0.48 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why did silicon beat germanium, even though germanium is faster?", model: "Germanium's small energy gap makes it very temperature-sensitive and gives it a large reverse current (about 1 µA vs about 10 pA for silicon), and it has lower breakdown voltages. Silicon is less sensitive to heat, leaks far less, handles higher reverse voltages, and is cheap and plentiful." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const Is6 = 2e-14, VT6 = 0.026; /* a silicon diode: 10 mA at about 0.7 V */
  const p6 = {
    id: "p6", title: "Three kinds of resistance", mins: 25,
    blurb: "DC, AC and average AC resistance: which one depends on the signal.",
    takeaway: "DC resistance R_D = V_D/I_D: the slope of a line from the origin to the Q-point. AC (dynamic) resistance r_d = ΔV_d/ΔI_d: the slope of the tangent at the Q-point, ≈ 26 mV/I_D (double it near the knee). Average AC resistance r_av = ΔV/ΔI between the two ends of a large swing. All three drop as current rises, and R_D is much bigger than r_d.",
    steps: [
      { k: "learn", title: "Which resistance?", b: [
        `<p>A diode's curve isn't a straight line, so "its resistance" depends on what you ask.</p>`,
        `<div class="two">
          <div class="tile"><h3>DC (static) R<sub>D</sub></h3><p>Steady voltage. Just divide: R<sub>D</sub> = V<sub>D</sub>/I<sub>D</sub> at the operating point.</p></div>
          <div class="tile"><h3>AC (dynamic) r<sub>d</sub></h3><p>A small wiggle around the operating point. Use the slope there: r<sub>d</sub> = ΔV<sub>d</sub>/ΔI<sub>d</sub>.</p></div>
          <div class="tile"><h3>Average AC r<sub>av</sub></h3><p>A big swing. Use the straight line between its two ends.</p></div>
        </div>`,
        `<p>The steady operating point is the <b>Q-point</b> (Q for "quiescent": still).</p>`,
        seen("The incremental resistance r_d of a nonlinear device at an operating point.", "04-nonlinear-circuits.html#p7", "Chapter 4, Part 7"),
      ]},
      { k: "predict", title: "Guess first", b: [
        { t: "mcq", q: "At a Q-point of 10 mA, which is bigger: the DC resistance R_D or the AC resistance r_d?", opts: [
          ["R_D, by a lot", true, "R_D = 0.7 V / 10 mA = 70 Ω includes the whole 0.7 V offset. r_d only counts how V changes when I changes, and the curve is steep there: about 2.6 Ω."],
          ["r_d, by a lot", false, "The curve is nearly vertical at 10 mA, so small voltage changes give big current changes. That's a small r_d."],
          ["They're equal", false, "They're only equal for a straight line through the origin, like a resistor."],
        ]},
      ]},
      { k: "play", title: "Slide the Q-point", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let IQ = 10;
          const curve = [];
          for (let i = 0; i <= 160; i++) { const I = (i / 160) * 32; curve.push([vOf(I / 1000, Is6, 1, VT6), I]); }
          function draw() {
            const VQ = vOf(IQ / 1000, Is6, 1, VT6);
            const m = IQ / VT6; /* mA per V */
            const v0 = VQ - IQ / m, v1 = Math.min(1, VQ + (32 - IQ) / m);
            f.innerHTML = plot({ x: [0, 1], y: [0, 32], xt: [0, 0.2, 0.4, 0.6, 0.8, 1], yt: [0, 10, 20, 30], xl: "V_D (V)", yl: "I_D (mA)",
              series: [{ pts: curve, cls: "s1" }, { pts: [[0, 0], [VQ, IQ]], cls: "s4" }, { pts: [[v0, 0], [v1, IQ + (v1 - VQ) * m]], cls: "s3" }],
              marks: [{ x: VQ, y: IQ, label: "Q", dx: -16 }],
              label: "Diode curve with the DC line from the origin (red dashed) and the tangent at the Q-point (green)" });
            ro.innerHTML = readout([["Q-point", fmt(VQ, 3) + " V, " + fmt(IQ) + " mA"], ["DC: R<sub>D</sub> = V<sub>D</sub>/I<sub>D</sub>", fmt(VQ / (IQ / 1000), 3) + " Ω"], ["AC: r<sub>d</sub> = 26 mV/I<sub>D</sub>", fmt(26 / IQ, 3) + " Ω"], ["R<sub>D</sub> ÷ r<sub>d</sub>", fmt(VQ / (IQ / 1000) / (26 / IQ), 3) + "×"]]);
          }
          host.append(f, slider({ id: id + "-q", label: "Q-point current I<sub>D</sub>", min: 0.5, max: 30, step: 0.5, value: 10, show: (v) => fmt(v) + " mA" }, (v) => { IQ = v; draw(); }).el, ro);
          draw();
        },
        `<p><span style="color:var(--bad)">Red dashed</span>: from the origin to Q. Its slope is 1/R<sub>D</sub>. <span style="color:var(--good)">Green</span>: the tangent at Q. Its slope is 1/r<sub>d</sub>. Steeper line, smaller resistance.</p>`,
        `<div class="key">Both resistances <b>fall as the current rises</b>. And at any useful Q-point, R<sub>D</sub> ≫ r<sub>d</sub>.</div>`,
      ]},
      { k: "math", title: "Where 26 mV / I_D comes from", b: [
        `<p>r<sub>d</sub> is the slope of the tangent, flipped. The slope of a curve at a point is its derivative.</p>`,
        `<div class="eq">dI<sub>D</sub>/dV<sub>D</sub> = (I<sub>D</sub> + I<sub>s</sub>)/(nV<sub>T</sub>) ≈ I<sub>D</sub>/(nV<sub>T</sub>)    →    r<sub>d</sub> = nV<sub>T</sub>/I<sub>D</sub></div>`,
        `<p>With n = 1 and V<sub>T</sub> = 26 mV: <b>r<sub>d</sub> = 26 mV / I<sub>D</sub></b>. No graph needed: just the Q-point current.</p>`,
        `<ul><li>Down near the knee, n ≈ 2 for silicon: <b>double it</b>.</li><li>Below the knee, the formula doesn't apply.</li><li>Body and contact resistance add on: r<sub>d</sub> = 26 mV/I<sub>D</sub> + r<sub>B</sub>, with r<sub>B</sub> from about 0.1 Ω to 2 Ω. This book usually ignores r<sub>B</sub>.</li></ul>`,
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "AC resistance at a Q-point of 13 mA (steep part of the curve)?", a: 2, unit: "Ω", hint: "26 mV divided by the current.", why: "26 mV / 13 mA = 2 Ω." },
        { t: "num", q: "A diode reads 0.72 V at 18 mA. Its DC resistance?", a: 40, unit: "Ω", why: "0.72 V / 18 mA = 40 Ω. Compare: its r_d is only 26/18 ≈ 1.4 Ω." },
        { t: "num", q: "A large signal swings the diode between (0.66 V, 3 mA) and (0.74 V, 19 mA). Average AC resistance?", a: 5, unit: "Ω", hint: "ΔV divided by ΔI, between the two ends.", why: "0.08 V / 16 mA = 5 Ω." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "When would you use r_d instead of R_D?", model: "Use R_D = V_D/I_D for steady DC conditions: it's just the ratio at the operating point. Use r_d (the tangent slope, about 26 mV/I_D) when a small AC signal wiggles around that operating point, because then only the change in voltage per change in current matters, and that's set by the local slope of the curve." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Diode models", mins: 25,
    blurb: "Three ways to replace a diode with simple parts, and when each is good enough.",
    takeaway: "Piecewise-linear model: ideal diode + V_K battery + r_av. Simplified model: ideal diode + V_K (0.7 V for Si). Ideal model: just a one-way switch. Use the simplest one whose assumptions hold: drop r_av when the rest of the circuit's resistance is much bigger, and drop V_K when the supply voltage is much bigger. V_K isn't a real source: a loose diode reads 0 V.",
    steps: [
      { k: "learn", title: "A one-way switch", b: [
        `<p>The ideal diode is a switch that only lets current through in one direction:</p>`,
        `<div class="two"><div class="tile"><h3>Forward</h3><p>Closed switch: 0 Ω. Any current, 0 V across it.</p></div><div class="tile"><h3>Reverse</h3><p>Open switch: ∞ Ω. Any voltage, 0 A through it.</p></div></div>`,
        `<p>A real silicon diode is close, except it doesn't turn on until about 0.7 V.</p>`,
      ]},
      { k: "learn", title: "Three models", b: [
        fig(S.svg(360, 230,
          S.t(10, 30, "Piecewise-linear", { a: "start", cls: "a" }) + S.wire([20, 60], [50, 60]) + S.diode(50, 60, 110, 60, "") + S.wire([110, 60], [140, 60]) + `<line class="w" x1="140" y1="48" x2="140" y2="72" style="stroke-width:3"/><line class="w" x1="148" y1="53" x2="148" y2="67" style="stroke-width:3"/>` + S.t(144, 92, "V<tspan class=s>K</tspan>") + S.wire([148, 60], [180, 60]) + S.res(180, 60, 250, 60, "r<tspan class=s>av</tspan>") + S.wire([250, 60], [280, 60]) +
          S.t(10, 120, "Simplified", { a: "start", cls: "a" }) + S.wire([20, 150], [50, 150]) + S.diode(50, 150, 110, 150, "") + S.wire([110, 150], [140, 150]) + `<line class="w" x1="140" y1="138" x2="140" y2="162" style="stroke-width:3"/><line class="w" x1="148" y1="143" x2="148" y2="157" style="stroke-width:3"/>` + S.t(144, 182, "0.7 V") + S.wire([148, 150], [280, 150]) +
          S.t(10, 205, "Ideal", { a: "start", cls: "a" }) + S.wire([90, 200], [130, 200]) + S.diode(130, 200, 190, 200, "") + S.wire([190, 200], [280, 200]),
          { max: 360, label: "Piecewise-linear model: ideal diode, battery V_K, resistor r_av. Simplified: ideal diode and 0.7 V. Ideal: ideal diode alone." })),
        `<div class="key">Pick the simplest model that still tells the truth for <b>your</b> circuit.</div>`,
        seen("Piecewise-linear models and better diode models for the method of assumed states.", "16-diodes.html#p4", "Chapter 16, Part 4"),
      ]},
      { k: "play", title: "Which model is good enough?", b: [
        `<p>A source E, a resistor R and a silicon diode in series. Compare each model with the real diode.</p>`,
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          let E = 5, R = 1000;
          const rB = 4, VK = 0.7, rav = 5;
          f.innerHTML = S.svg(300, 150, S.vsrc(50, 80, "E", { side: "left" }) + S.wire([50, 62], [50, 30], [110, 30]) + S.diode(110, 30, 170, 30, "") + S.wire([170, 30], [240, 30]) + S.res(240, 30, 240, 130, "R", { side: "right" }) + S.wire([240, 130], [50, 130], [50, 98]), { max: 300, label: "Source E, diode and resistor R in series" });
          function exact() {
            let lo = 0, hi = E / R;
            for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; (m * R + vOf(m, Is6, 1, VT6, rB) > E ? (hi = m) : (lo = m)); }
            return (lo + hi) / 2;
          }
          function draw() {
            const Ix = exact(), Id = E / R, Isim = Math.max(0, (E - 0.7) / R), Ipl = Math.max(0, (E - VK) / (R + rav));
            const err = (I) => (Ix > 0 ? fmt((100 * Math.abs(I - Ix)) / Ix, 2) + "% off" : "—");
            ro.innerHTML = readout([["Real diode", si(Ix, "A")], ["Ideal model", si(Id, "A") + " · " + err(Id)], ["Simplified (0.7 V)", si(Isim, "A") + " · " + err(Isim)], ["Piecewise-linear", si(Ipl, "A") + " · " + err(Ipl)]]);
            const e = (I) => Math.abs(I - Ix) / Ix, eI = e(Id), eS = e(Isim), eP = e(Ipl);
            vd.className = "verdict " + (eI < 0.1 ? "ok" : eS < 0.1 ? "ok" : eP < 0.1 ? "mid" : "no");
            vd.textContent = eI < 0.1 ? "E is much bigger than 0.7 V: even the ideal model is within 10%."
              : eS < 0.1 ? "The 0.7 V matters, but r_av doesn't: the simplified model is within 10%."
              : eP < 0.1 ? "R is small, so the diode's own resistance matters: only the piecewise-linear model is within 10%."
              : "The current is so small the diode sits in its knee. Every straight-line model struggles here.";
          }
          const box = el(`<div class="sliders"></div>`);
          box.append(
            slider({ id: id + "-e", label: "Source E", min: 1, max: 50, step: 0.5, value: 5, show: (v) => fmt(v) + " V" }, (v) => { E = v; draw(); }).el,
            slider({ id: id + "-r", label: "Resistor R", min: 5, max: 10000, log: true, value: 1000, show: (v) => si(v, "Ω") }, (v) => { R = v; draw(); }).el);
          host.append(f, box, vd, ro);
          draw();
        },
        `<p class="aside">This diode's piecewise-linear fit: V<sub>K</sub> = 0.7 V and r<sub>av</sub> = 5 Ω. "Within 10%" is the test used here.</p>`,
      ]},
      { k: "check", title: "Choose a model", b: [
        { t: "mcq", q: "E = 1.5 V, R = 1 kΩ. Which model is the simplest you can trust?", opts: [
          ["Simplified (0.7 V)", true, "0.7 V is about half of 1.5 V, so you can't ignore it. But r_av (a few Ω) is tiny next to 1 kΩ."],
          ["Ideal", false, "It would say 1.5 mA. The real current is about 0.86 mA."],
          ["Piecewise-linear", false, "It works, but it's more effort than needed: r_av ≪ 1 kΩ."],
        ]},
        { t: "mcq", q: "E = 4 V, R = 8 Ω, and the diode's r_av is about 5 Ω. Which model?", opts: [
          ["Piecewise-linear", true, "R isn't much bigger than r_av, so the diode's slope resistance changes the answer a lot."],
          ["Simplified", false, "That ignores r_av, which is comparable to R here."],
          ["Ideal", false, "Both 0.7 V and r_av matter here."],
        ]},
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<p>A student puts a voltmeter across a loose diode on the bench. It reads 0 V. They say: "The model has a 0.7 V battery inside, so this diode is broken."</p>`,
        { t: "mcq", q: "What's wrong with the reasoning?", opts: [
          ["V_K isn't a real source. It only marks how far forward you must push before current flows", true, "Right. The battery in the model just shifts the curve right by 0.7 V. A diode with nothing connected has 0 V across it."],
          ["Nothing. The diode is broken", false, "A good diode reads 0 V on its own. The 0.7 V only shows up when forward current flows."],
          ["The meter needs to be reversed", false, "Either way round, an unpowered diode has 0 V across it."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "When can you drop r_av, and when can you drop V_K as well?", model: "Drop r_av (use the simplified 0.7 V model) when the rest of the circuit's resistance in series with the diode is much bigger than r_av. Drop V_K too (use the ideal diode) when the source voltage is much bigger than 0.7 V, as in many power-supply circuits." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Speed limits and datasheets", mins: 25,
    blurb: "Hidden capacitance, the time it takes to switch off, and the numbers that come on a datasheet.",
    takeaway: "Reverse bias: transition capacitance C_T, which shrinks as the depletion region widens. Forward bias: diffusion capacitance C_D, which grows with current. Switching off takes the reverse recovery time t_rr = t_s + t_t. Datasheets give V_F, I_F(max), I_R, PIV, power (P = V_D·I_D ≈ 0.7·I_D) and its derating, capacitance, t_rr and temperature range. Log scales squeeze huge ranges onto one graph.",
    steps: [
      { k: "learn", title: "Every device has a speed limit", b: [
        `<p>At high frequencies, tiny stray capacitances start to matter. A capacitor's reactance is X<sub>C</sub> = 1/(2πfC). At high f, X<sub>C</sub> gets small and becomes a shortcut <b>around</b> the diode, so it stops acting like a one-way gate.</p>`,
        `<div class="two"><div class="tile"><h3>Transition capacitance C<sub>T</sub></h3><p>Reverse bias. The depletion region is an insulator between two layers of charge: a capacitor. Wider region, smaller C (like C = εA/d).</p></div><div class="tile"><h3>Diffusion capacitance C<sub>D</sub></h3><p>Forward bias. Charge piling up just outside the depletion region. More current, more C<sub>D</sub>.</p></div></div>`,
        `<div class="eq">C<sub>T</sub> = C(0) / (1 + V<sub>R</sub>/V<sub>K</sub>)<sup>n</sup>,   n = ½ or ⅓</div>`,
      ]},
      { k: "play", title: "Capacitance vs bias", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let V = -5;
          const C0 = 5;
          const CT = (v) => (v < 0 ? C0 / Math.sqrt(1 - v / 0.7) : C0 / Math.sqrt(Math.max(0.15, 1 - v / 0.7)));
          const CD = (v) => (v > 0 ? 0.002 * Math.exp(v / 0.05) : 0);
          function draw() {
            f.innerHTML = plot({ x: [-25, 1], y: [0, 16], xt: [-25, -20, -15, -10, -5, 0], yt: [0, 5, 10, 15], xl: "bias (V)", yl: "C (pF)",
              series: [{ f: CT, cls: "s2", to: 0.55 }, { f: (v) => CT(v) + CD(v), cls: "s1", from: 0, to: 0.55 }], marks: [{ x: V, y: CT(V) + CD(V) }],
              label: "Diode capacitance versus bias: C_T in reverse, C_T plus C_D in forward" });
            ro.innerHTML = readout([["Bias", fmt(V, 3) + " V"], ["C<sub>T</sub>", fmt(CT(V), 3) + " pF"], ["C<sub>D</sub>", fmt(CD(V), 3) + " pF"], ["Bigger one", CD(V) > CT(V) ? "diffusion (forward)" : "transition"]]);
          }
          host.append(f, slider({ id: id + "-v", label: "Bias", min: -25, max: 0.5, step: 0.05, value: -5, show: (v) => fmt(v, 3) + " V" }, (v) => { V = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">C(0) = 5 pF here. The forward side is stretched: the real action happens in the last few tenths of a volt.</p>`,
        `<p>The voltage-controlled C<sub>T</sub> is useful on purpose: the <b>varactor</b> diode (Chapter 16) is built around it.</p>`,
      ]},
      { k: "learn", title: "Switching off takes time", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let ts = 4;
          const tt = 2;
          function draw() {
            const pts = [[0, 10], [5, 10], [5, -10], [5 + ts, -10]];
            for (let i = 1; i <= 20; i++) { const t = (i / 20) * 4 * tt; pts.push([5 + ts + t, -10 * Math.exp(-t / (tt / 2.3))]); }
            pts.push([30, 0]);
            f.innerHTML = plot({ x: [0, 30], y: [-12, 12], xt: [0, 5, 10, 15, 20, 25, 30], yt: [-10, 0, 10], xl: "time (ns)", yl: "i_D (mA)",
              series: [{ pts: [[0, 10], [5, 10], [5, 0], [30, 0]], cls: "s5" }, { pts, cls: "s1" }], texts: [{ x: 5 + ts / 2, y: -7.5, s: "t<tspan class=s>s</tspan>", a: "middle" }, { x: 5 + ts + tt, y: -3, s: "t<tspan class=s>t</tspan>", a: "start" }],
              label: "Diode current when the voltage reverses at 5 ns: ideal (dashed) and real (solid)" });
            ro.innerHTML = readout([["Storage time t<sub>s</sub>", ts + " ns"], ["Transition time t<sub>t</sub>", tt + " ns"], ["Reverse recovery t<sub>rr</sub> = t<sub>s</sub> + t<sub>t</sub>", ts + tt + " ns"]]);
          }
          host.append(f, slider({ id: id + "-ts", label: "Storage time t<sub>s</sub>", min: 1, max: 10, step: 1, value: 4, show: (v) => v + " ns" }, (v) => { ts = v; draw(); }).el, ro);
          draw();
        },
        `<p>Forward current leaves lots of minority carriers stranded on the wrong side. When you reverse the voltage, they flow <b>back</b> first: the diode briefly conducts backwards (the <b>storage time t<sub>s</sub></b>). Then the current dies away (the <b>transition time t<sub>t</sub></b>).</p>`,
        { t: "mcq", q: "A diode has t_rr = 6 ns. You switch it on and off at 100 MHz (5 ns per half-cycle). What happens?", opts: [
          ["It never properly turns off: it conducts backward for the whole off half", true, "The off time (5 ns) is shorter than t_rr (6 ns). You'd need a faster diode, or a lower frequency."],
          ["Nothing. 6 ns is tiny", false, "Tiny compared to what? Compare it with how long each half-cycle lasts."],
          ["It turns off faster to keep up", false, "t_rr is set by the stranded carriers. It doesn't adapt."],
        ]},
      ]},
      { k: "learn", title: "What a datasheet tells you", b: [
        `<div class="two">
          <div class="tile"><h3>V<sub>F</sub></h3><p>forward voltage, at a stated current and temperature</p></div>
          <div class="tile"><h3>I<sub>F</sub> max</h3><p>most forward current</p></div>
          <div class="tile"><h3>I<sub>R</sub></h3><p>reverse current, at a stated voltage and temperature</p></div>
          <div class="tile"><h3>PIV / PRV / V<sub>(BR)</sub></h3><p>reverse voltage rating</p></div>
          <div class="tile"><h3>P<sub>D</sub> max</h3><p>power limit, at a stated temperature</p></div>
          <div class="tile"><h3>C, t<sub>rr</sub>, temp. range</h3><p>speed and environment</p></div>
        </div>`,
        `<div class="eq">P<sub>D</sub> = V<sub>D</sub> I<sub>D</sub>   ≈ (0.7 V) I<sub>D</sub> for silicon</div>`,
        `<p><b>Derating:</b> the power limit drops as it gets hotter. A datasheet might say "derate 4 mW/°C above 25 °C".</p>`,
        { t: "num", q: "A diode is rated 400 mW at 25 °C and derates by 4 mW/°C. What's its limit at 75 °C?", a: 200, unit: "mW", hint: "50 °C above 25 °C, at 4 mW per °C.", why: "400 − 50 × 4 = 200 mW: half the room-temperature rating." },
        { t: "num", q: "At that 200 mW limit, what's the most forward current at about 0.7 V?", a: 286, unit: "mA", tol: 0.03, hint: "I = P / V.", why: "200 mW / 0.7 V ≈ 286 mA." },
      ]},
      { k: "play", title: "Why datasheets use log scales", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`);
          function draw(log) {
            const pts = [];
            for (let i = 0; i <= 120; i++) { const V = 0.3 + (i / 120) * 0.65; pts.push([V, shock(V, Is6, 1, VT6)]); }
            f.innerHTML = log
              ? plot({ x: [0.3, 0.95], y: [-9, -0.5], xt: [0.3, 0.5, 0.7, 0.9], yt: [-9, -7, -5, -3, -1], ytf: (v) => si(Math.pow(10, v), "A"), xl: "V_D (V)", yl: "I_D (log scale)", series: [{ pts: pts.map(([v, i]) => [v, Math.log10(i)]), cls: "s1" }], label: "Diode current on a log scale: a straight line" })
              : plot({ x: [0.3, 0.95], y: [0, 0.3], xt: [0.3, 0.5, 0.7, 0.9], yt: [0, 0.1, 0.2, 0.3], ytf: (v) => si(v, "A"), xl: "V_D (V)", yl: "I_D (linear scale)", series: [{ pts, cls: "s1" }], label: "Diode current on a linear scale: flat, then a wall" });
          }
          host.append(f, toggle(["Linear scale", "Log scale"], (k) => draw(k === 1), 0));
          draw(false);
        },
        `<p>On a linear scale everything below 10 mA is squashed flat. On a <b>log</b> scale, each grid step is ×10, so nA and 100 mA fit on one graph, and the exponential becomes a straight line.</p>`,
        `<p class="aside">One log axis is a <b>semi-log</b> plot. Both axes log is <b>log-log</b>. Read between gridlines carefully: halfway is about ×3, not ×5.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't a diode switch arbitrarily fast?", model: "While it conducts forward, minority carriers build up on each side of the junction. When the voltage reverses they must flow back out before the diode can block, so it briefly conducts backward (storage time) and then the current decays (transition time). Together that's the reverse recovery time t_rr. Its capacitances also give a shortcut path at high frequency." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Which end is which, and is it working?", mins: 15,
    blurb: "Anode, cathode, and testing a diode with a meter.",
    takeaway: "The anode is the p side (+ for forward bias). The cathode is the n side, marked by a band. A good diode reads about 0.6–0.7 V forward and OL reverse on a meter's diode check, low resistance forward and high reverse on an ohmmeter. OL both ways means open; near zero both ways means shorted.",
    steps: [
      { k: "learn", title: "Anode and cathode", b: [
        fig(S.svg(340, 110, `<rect x="110" y="38" width="120" height="34" rx="8" class="el"/><rect x="200" y="38" width="12" height="34" style="fill:var(--ink)"/>` + S.wire([40, 55], [110, 55]) + S.wire([230, 55], [300, 55]) + S.t(40, 30, "anode (p, +)", { a: "start", cls: "a" }) + S.t(300, 30, "cathode (n, −)", { a: "end", cls: "c" }) + S.t(240, 98, "band = cathode", { a: "start", cls: "s m" }) + S.diode(100, 98, 150, 98, "") + S.t(20, 102, "symbol:", { a: "start", cls: "s m" }),
          { max: 340, label: "A diode body with a band at the cathode end" })),
        `<p>The names come from vacuum tubes. Forward bias means the <b>anode</b> is at the higher voltage. The band, dot or flat edge on a real diode marks the <b>cathode</b>.</p>`,
      ]},
      { k: "play", title: "Test the mystery diodes", b: [
        (host) => {
          const ro = el(`<div></div>`), lcd = el(`<div class="fig"></div>`);
          let d = 0, rev = false, mode = 0;
          const READ = [
            [["0.67 V", "OL"], ["≈ 600 Ω", "OL (very high)"]],
            [["OL", "OL"], ["OL (very high)", "OL (very high)"]],
            [["0.00 V", "0.00 V"], ["0.3 Ω", "0.3 Ω"]],
          ];
          function draw() {
            const r = READ[d][mode][rev ? 1 : 0];
            lcd.innerHTML = S.svg(300, 120, `<rect x="70" y="10" width="160" height="60" rx="8" style="fill:#10161d"/><text x="150" y="52" text-anchor="middle" style="fill:#5cf29b;font-size:26px;font-family:var(--mono)">${r}</text>` +
              S.wire([40, 100], [120, 100]) + S.diode(120, 100, 180, 100, "") + S.wire([180, 100], [260, 100]) + S.t(40, 92, rev ? "black" : "red", { a: "start", cls: rev ? "" : "b" }) + S.t(260, 92, rev ? "red" : "black", { a: "end", cls: rev ? "b" : "" }),
              { max: 300, label: "Meter display and diode with test leads" });
            ro.innerHTML = readout([["Diode", "Mystery " + "ABC"[d]], ["Leads", rev ? "red on cathode (reverse)" : "red on anode (forward)"], ["Meter mode", mode ? "ohmmeter" : "diode check"]]);
          }
          host.append(lcd, toggle(["Diode A", "Diode B", "Diode C"], (k) => { d = k; draw(); }, 0), toggle(["Red lead on anode", "Red lead on cathode"], (k) => { rev = k === 1; draw(); }, 0), toggle(["Diode-check mode", "Ohmmeter mode"], (k) => { mode = k; draw(); }, 0), ro);
          draw();
        },
        `<p>In diode-check mode, the meter pushes about 2 mA through and shows the voltage. The red lead is +.</p>`,
      ]},
      { k: "check", title: "Your diagnosis", b: [
        { t: "sort", q: "Test all three, both ways round. Then sort them.", bins: ["Good", "Open", "Shorted"], items: [
          ["Diode A", 0, "About 0.67 V one way, OL the other: a healthy one-way gate."],
          ["Diode B", 1, "OL both ways: nothing gets through. It's open inside."],
          ["Diode C", 2, "Near zero both ways: it conducts in both directions. It's shorted."],
        ]},
        { t: "mcq", q: "On an ohmmeter, a good diode reads 600 Ω on one range and 400 Ω on another. Why?", opts: [
          ["Each range pushes a different current, and R_D = V_D/I_D depends on the current", true, "Exactly Part 6: the DC resistance falls as the current rises. Different ranges, different test currents, different readings."],
          ["The diode is faulty", false, "Varying with range is normal for a diode. A resistor wouldn't do it."],
          ["Ohmmeters are inaccurate", false, "The meter is fine. The diode's resistance really is different at different currents."],
        ]},
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "Zener diodes", mins: 25,
    blurb: "A diode built to break down, on purpose, at a chosen voltage.",
    takeaway: "A Zener diode works in the breakdown region: reverse current flows (against the symbol's arrow) at a nearly fixed V_Z, set by doping (1.8 V to 200 V). Model: a V_Z battery plus a small r_Z; open circuit below V_Z; 0.7 V forward. Datasheet: nominal V_Z ± tolerance, test current I_ZT, max current I_ZM, knee current I_ZK (stay above it), temperature coefficient: ΔV_Z = (TC/100%)·V_Z·(T₁ − T₀).",
    steps: [
      { k: "learn", title: "Breakdown, used on purpose", b: [
        `<p>Part 5's breakdown wrecked an ordinary diode's behaviour. A <b>Zener diode</b> is made to live there. Past V<sub>Z</sub>, the reverse current can change a lot while the voltage barely moves.</p>`,
        fig(S.svg(340, 120, zener(30, 50, 110, "") + S.t(70, 20, "Zener", { cls: "a" }) + S.arrow(105, 80, 40, 80, "") + S.t(72, 106, "I_Z flows ←", { cls: "s c" }) +
          S.diode(200, 50, 280, 50, "") + S.t(240, 20, "ordinary diode", { cls: "a" }) + S.arrow(210, 80, 275, 80, "") + S.t(242, 106, "I_D flows →", { cls: "s c" }),
          { max: 340, label: "Zener symbol with current flowing against the arrow, next to a normal diode with current along the arrow" })),
        `<div class="key">A Zener conducts <b>against</b> its arrow. The + of V<sub>Z</sub> is on the cathode side, the same as if it were a resistor carrying that current.</div>`,
        `<p>More doping, lower V<sub>Z</sub>. You can buy them from 1.8 V to 200 V and from ¼ W to 50 W, almost always silicon.</p>`,
      ]},
      { k: "play", title: "Walk along a Zener's curve", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`), vd = el(`<span class="verdict"></span>`);
          const VZ = 6.8, rZ = 5;
          const I = (V) => (V > 0 ? 1000 * shock(V, Is6, 1, VT6) : V > -VZ ? 0 : (1000 * (V + VZ)) / rZ);
          let V = -3;
          function draw() {
            f.innerHTML = plot({ x: [-9, 1], y: [-40, 20], xt: [-8, -6.8, -4, -2, 0], xtf: (v) => (v === -6.8 ? "−V_Z" : fmt(v)), yt: [-40, -20, 0, 20], xl: "V (V)", yl: "I (mA)",
              series: [{ f: I, cls: "s1", to: 0.8 }], marks: [{ x: V, y: Math.max(-40, Math.min(20, I(V))) }],
              label: "Zener diode current versus voltage, with the breakdown region at minus 6.8 V" });
            const region = V > 0.55 ? 0 : V > -VZ ? 1 : 2;
            ro.innerHTML = readout([["Voltage", fmt(V, 3) + " V"], ["Current", fmt(I(V), 3) + " mA"], ["Model here", ["0.7 V battery (normal forward diode)", "open circuit (huge resistance)", "V_Z = 6.8 V battery + r_Z = 5 Ω"][region]]]);
            vd.className = "verdict " + ["ok", "mid", "ok"][region];
            vd.textContent = ["Forward region: just an ordinary diode.", "Between: almost no current.", "Zener region: current grows fast, voltage stays near 6.8 V."][region];
          }
          host.append(f, slider({ id: id + "-v", label: "Voltage across the Zener (anode minus cathode)", min: -8.95, max: 0.75, step: 0.05, value: -3, show: (v) => fmt(v, 3) + " V" }, (v) => { V = v; draw(); }).el, vd, ro);
          draw();
        },
        `<p class="aside">This one is a 6.8 V Zener with r<sub>Z</sub> = 5 Ω. The slope in the Zener region is 1/r<sub>Z</sub>: a tiny r<sub>Z</sub> means a nearly vertical line.</p>`,
      ]},
      { k: "learn", title: "Reading a Zener datasheet", b: [
        `<div class="two">
          <div class="tile"><h3>V<sub>Z</sub> nominal ± %</h3><p>Typical Zener voltage and its tolerance (±5%, ±10%, ±20%).</p></div>
          <div class="tile"><h3>I<sub>ZT</sub>, Z<sub>ZT</sub></h3><p>Test current, and the dynamic resistance r<sub>Z</sub> there. T = test.</p></div>
          <div class="tile"><h3>I<sub>ZK</sub>, Z<sub>ZK</sub></h3><p>Knee current. Below it, r<sub>Z</sub> gets large. K = knee.</p></div>
          <div class="tile"><h3>I<sub>ZM</sub></h3><p>Most continuous current.</p></div>
          <div class="tile"><h3>TC</h3><p>Temperature coefficient, in %/°C.</p></div>
        </div>`,
        `<p>On this kind of datasheet, I<sub>ZT</sub> is set at a quarter of full power, so <b>P<sub>Z max</sub> = 4 I<sub>ZT</sub> V<sub>Z</sub></b>.</p>`,
        { t: "num", q: "A 6.2 V ±5% Zener. What's the highest V_Z you might get?", a: 6.51, unit: "V", why: "5% of 6.2 is 0.31, so anywhere from 5.89 V to 6.51 V." },
        { t: "num", q: "A 5.1 V Zener has I_ZT = 49 mA. Its power rating?", a: 1, unit: "W", tol: 0.03, why: "4 × 49 mA × 5.1 V ≈ 1.0 W." },
      ]},
      { k: "math", title: "Temperature drift", b: [
        `<div class="eq">ΔV<sub>Z</sub> = (TC / 100%) · V<sub>Z</sub> · (T<sub>1</sub> − T<sub>0</sub>)</div>`,
        `<p>T<sub>0</sub> is usually 25 °C. Example: a 12 V Zener with TC = +0.05 %/°C, heated to 75 °C:</p>`,
        { t: "num", q: "How much does V_Z change?", a: 0.3, unit: "V", hint: "(0.05/100) × 12 V × (75 − 25).", why: "0.0005 × 12 × 50 = 0.3 V, so V_Z becomes 12.3 V." },
        { t: "mcq", q: "A 3.3 V Zener warms up. Its V_Z most likely…", opts: [
          ["drops", true, "Below about 5 V the Zener mechanism dominates, and the temperature coefficient is usually negative."],
          ["rises", false, "That's typical above about 5 V (avalanche). Low-voltage Zeners usually go the other way."],
          ["can't change", false, "Every Zener drifts a little with temperature. The TC says how much."],
        ]},
      ]},
      { k: "why", title: "Stay out of the knee", b: [
        `<p>r<sub>Z</sub> isn't constant. Near the knee it can be hundreds of ohms. A few mA further in, it drops to a few ohms.</p>`,
        { t: "mcq", q: "You want the steadiest possible voltage from a Zener. Where should you keep its current?", opts: [
          ["Well above I_ZK, but below I_ZM", true, "Above the knee r_Z is small, so V_Z barely moves. Below I_ZM so it doesn't overheat."],
          ["Just above zero, to save power", false, "That's in the knee, where r_Z is large and the voltage wobbles with current."],
          ["At I_ZM, as high as possible", false, "That's the absolute limit: it runs hot and drifts. Somewhere comfortably in between is best."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe the three regions of a Zener diode and the model you'd use in each.", model: "Forward biased, it's an ordinary diode: about 0.7 V. Reverse biased below V_Z, almost no current flows: an open circuit. Reverse biased at V_Z, it conducts against its arrow and holds the voltage nearly constant: a V_Z battery with a small series resistance r_Z, which you can often ignore." },
      ]},
    ],
  };

  /* =============== PART 11 =============== */
  const p11 = {
    id: "p11", title: "Light-emitting diodes", mins: 25,
    blurb: "When electrons fall back across the gap, the energy can come out as light.",
    takeaway: "In a forward-biased junction, electrons recombining with holes release energy. In Si and Ge it's mostly heat; in GaAs it's infrared light; compounds like GaAsP, GaP and GaN give visible colours. The gap sets the colour: λ = hc/E_g (≈ 1240 nm/E_g in eV). The eye is most sensitive to green (≈ 550 nm). Typical LEDs: about 2 V at 20 mA (blue ≈ 5 V, white ≈ 4 V), and only 3–5 V of reverse breakdown.",
    steps: [
      { k: "learn", title: "Recombination makes light", b: [
        `<p>Forward bias pushes electrons and holes together at the junction. When a free electron drops back into a hole, it gives up energy.</p>`,
        `<div class="two"><div class="tile"><h3>Si, Ge</h3><p>Almost all heat. Useless as lights.</p></div><div class="tile"><h3>GaAs</h3><p>Infrared light: invisible, but great for remote controls and sensors.</p></div><div class="tile"><h3>GaAsP, GaP, GaN…</h3><p>Visible colours.</p></div></div>`,
        `<p>The energy released is about the gap E<sub>g</sub>. A bigger gap means a more energetic photon: a shorter wavelength.</p>`,
        `<div class="eq">E<sub>g</sub> = hc/λ    so    λ = hc/E<sub>g</sub>     (h = 6.626 × 10⁻³⁴ J·s,  c = 3 × 10⁸ m/s)</div>`,
        `<p class="aside">Handy shortcut: λ in nm ≈ 1240 / E<sub>g</sub> in eV.</p>`,
      ]},
      { k: "play", title: "Choose a gap, see the colour", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let Eg = 1.9;
          function draw() {
            const nm = (6.626e-34 * 3e8) / (Eg * 1.6e-19) * 1e9;
            const c = waveRGB(nm);
            const zone = nm > 750 ? "infrared (invisible)" : nm < 400 ? "ultraviolet (invisible)" : "visible";
            const marks = [["Si", 1.1], ["GaAs", 1.43], ["GaAsP", 1.9], ["GaN", 3.2]];
            let s = "";
            for (let x = 0; x <= 300; x += 2) { const e = 1 + (x / 300) * 2.4, w = (6.626e-34 * 3e8) / (e * 1.6e-19) * 1e9, cc = waveRGB(w); s += `<rect x="${20 + x}" y="20" width="2" height="26" style="fill:${cc || "var(--line)"}"/>`; }
            marks.forEach(([nmx, e]) => { const x = 20 + ((e - 1) / 2.4) * 300; s += `<line x1="${x}" y1="16" x2="${x}" y2="52" style="stroke:var(--ink);stroke-width:1.5"/>` + S.t(x, 66, nmx, { cls: "s" }); });
            const px = 20 + ((Eg - 1) / 2.4) * 300;
            s += `<polygon points="${px - 7},8 ${px + 7},8 ${px},18" style="fill:var(--accent)"/>`;
            s += `<circle cx="170" cy="112" r="28" style="fill:${c || "var(--card)"};stroke:var(--ink);stroke-width:2"/>` + (c ? "" : S.t(170, 117, "invisible", { cls: "s m" }));
            f.innerHTML = S.svg(340, 150, s, { max: 340, label: "Band-gap scale coloured by the light each gap would emit, with a lamp showing the chosen colour" });
            ro.innerHTML = readout([["Energy gap", fmt(Eg, 3) + " eV"], ["Wavelength λ", fmt(nm, 3) + " nm"], ["Light", zone]]);
          }
          host.append(f, slider({ id: id + "-g", label: "Energy gap E<sub>g</sub>", min: 1, max: 3.4, step: 0.02, value: 1.9, show: (v) => fmt(v, 3) + " eV" }, (v) => { Eg = v; draw(); }).el, ro);
          draw();
        },
        `<p>Silicon (1.1 eV) would give about 1130 nm: deep infrared. GaAs (1.43 eV): about 870 nm, still infrared. GaAsP (1.9 eV): about 650 nm, red.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "A material has E_g = 2.0 eV. What wavelength does it emit, in nm?", a: 621, unit: "nm", tol: 0.02, hint: "λ = hc / E_g. Convert 2.0 eV to joules first (× 1.6 × 10⁻¹⁹).", why: "(6.626 × 10⁻³⁴ × 3 × 10⁸) / (3.2 × 10⁻¹⁹ J) ≈ 621 nm: orange-red." },
        { t: "num", q: "Light at 500 THz. Its wavelength, in nm?", a: 600, unit: "nm", hint: "λ = c / f, with c = 3 × 10⁸ m/s.", why: "3 × 10⁸ / 5 × 10¹⁴ = 6 × 10⁻⁷ m = 600 nm." },
        { t: "mcq", q: "Visible light runs from about 400 to 750 THz. Infrared is 100 to 400 THz. Which has the longer wavelength?", opts: [
          ["Infrared", true, "Lower frequency, longer wavelength: λ = c/f."],
          ["Visible", false, "Higher frequency means shorter wavelength."],
        ]},
      ]},
      { k: "learn", title: "Using LEDs in practice", b: [
        `<div class="two">
          <div class="tile"><h3>Forward voltage</h3><p>Red, orange, yellow, green: about <b>2 V at 20 mA</b>. Blue: about <b>5 V</b>. White: about <b>4 V</b>.</p></div>
          <div class="tile"><h3>Reverse breakdown</h3><p>Only <b>3–5 V</b>, far below an ordinary diode. Easy to destroy by connecting it backwards.</p></div>
          <div class="tile"><h3>Brightness</h3><p>Rises with current, then levels off (saturates). Pushing harder mostly makes heat.</p></div>
          <div class="tile"><h3>Your eye</h3><p>Most sensitive to <b>green</b> (≈ 550 nm). A red or blue LED must work harder to look as bright.</p></div>
        </div>`,
        `<p class="aside">White LEDs are usually a blue GaN LED under a yellow phosphor. Blue plus yellow looks white.</p>`,
        `<p class="aside">On graphs, <b>normalized</b> means plotted relative to one reference value, which is set to 1.</p>`,
      ]},
      { k: "play", title: "A seven-segment display", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const SEG = { a: [[40, 20], [100, 20]], b: [[104, 24], [104, 76]], c: [[104, 84], [104, 136]], d: [[40, 140], [100, 140]], e: [[36, 84], [36, 136]], f: [[36, 24], [36, 76]], g: [[40, 80], [100, 80]] };
          const DIG = ["abcdef", "bc", "abged", "abgcd", "fgbc", "afgcd", "afgedc", "abc", "abcdefg", "abcdfg"];
          function draw(dg) {
            const on = DIG[dg];
            let s = `<rect x="14" y="4" width="112" height="152" rx="10" style="fill:#14181d"/>`;
            Object.entries(SEG).forEach(([k, [p, q]]) => { s += `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" style="stroke:${on.includes(k) ? "#ff3b2f" : "#3a2626"};stroke-width:9;stroke-linecap:round"/>`; });
            Object.entries(SEG).forEach(([k, [p, q]]) => { s += `<text x="${(p[0] + q[0]) / 2 + (p[0] === q[0] ? (p[0] > 70 ? 14 : -14) : 0)}" y="${(p[1] + q[1]) / 2 + (p[0] === q[0] ? 4 : -8)}" text-anchor="middle" class="s" style="fill:#bbb">${k}</text>`; });
            f.innerHTML = S.svg(140, 162, s, { max: 160, label: "Seven-segment display showing the digit " + dg });
            const list = on.split("").sort();
            ro.innerHTML = readout([["Anodes at +5 V", list.join(", ")], ["LEDs lit", list.length], ["Total current at 10 mA each", list.length * 10 + " mA"]]);
          }
          host.append(f, toggle(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], draw, 5), ro);
          draw(5);
        },
        `<p>Seven LEDs, a to g. In a <b>common-cathode</b> display all the cathodes are tied to 0 V. Put +5 V on a segment's anode and it lights.</p>`,
        { t: "mcq", q: "Which digit draws the most current from the supply?", opts: [
          ["8", true, "All seven segments on: 7 × 10 mA = 70 mA. A digit's current depends on how many segments it lights."],
          ["1", false, "Only two segments: the least current of all."],
          ["They all draw the same", false, "Each lit segment is its own LED with its own current."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a GaAsP diode glow red while a silicon diode just gets warm?", model: "When electrons recombine with holes at a forward-biased junction, they release energy roughly equal to the energy gap. In silicon that energy comes out mostly as heat, and its 1.1 eV gap would only give infrared anyway. GaAsP has a wider gap, about 1.9 eV, and releases the energy as light with λ = hc/E_g ≈ 650 nm, which is red." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edc1", eyebrow: "Boylestad · Chapter 1", title: "Semiconductor Diodes",
    intro: `<p>Eleven short parts: from atoms and energy bands, to the p–n junction, diode models and datasheets, to Zener diodes and LEDs.</p><p>6.002 already gave you doping, the diode law and piecewise-linear models. Those parts open with a short recap that links back. The time goes on what's new.</p><p class="aside">The "Computer Analysis" section (PSpice/Multisim) isn't covered. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's problems in the book. They test whether the ideas stuck, so don't expect them to look like the examples here.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11],
    summary: `
      <h3>Materials</h3>
      <div class="readout"><div><span>Gap E<sub>g</sub></span><b>Ge 0.67 · Si 1.1 · GaAs 1.43 eV</b></div><div><span>Knee V<sub>K</sub></span><b>Ge 0.3 · Si 0.7 · GaAs 1.2 V</b></div><div><span>Mobility μ<sub>n</sub></span><b>Si 1500 · Ge 3900 · GaAs 8500 cm²/V·s</b></div></div>
      <p>Semiconductors: negative temperature coefficient. n-type: donors (5 valence e⁻), electrons are majority. p-type: acceptors (3 valence e⁻), holes are majority. 1 eV = 1.6 × 10⁻¹⁹ J.</p>
      <h3>Diode law</h3>
      <div class="eq">I<sub>D</sub> = I<sub>s</sub>(e<sup>V<sub>D</sub>/nV<sub>T</sub></sup> − 1)    V<sub>T</sub> = kT<sub>K</sub>/q ≈ 26 mV    T<sub>K</sub> = T<sub>C</sub> + 273</div>
      <p>Forward bias: + on p (anode). Reverse: only I<sub>s</sub> flows, until breakdown (PIV/PRV). Silicon: −2.5 mV/°C forward; reverse current ×2 per 10 °C.</p>
      <h3>Resistances</h3>
      <div class="eq">R<sub>D</sub> = V<sub>D</sub>/I<sub>D</sub>     r<sub>d</sub> = ΔV<sub>d</sub>/ΔI<sub>d</sub> ≈ 26 mV/I<sub>D</sub> (×2 near knee) + r<sub>B</sub>     r<sub>av</sub> = ΔV<sub>d</sub>/ΔI<sub>d</sub> point to point</div>
      <h3>Models</h3>
      <p>Piecewise-linear: ideal diode + V<sub>K</sub> + r<sub>av</sub>. Simplified: ideal + 0.7 V (R<sub>network</sub> ≫ r<sub>av</sub>). Ideal: switch (also E ≫ V<sub>K</sub>).</p>
      <h3>Real-world</h3>
      <div class="eq">C<sub>T</sub> = C(0)/(1 + V<sub>R</sub>/V<sub>K</sub>)<sup>n</sup>    t<sub>rr</sub> = t<sub>s</sub> + t<sub>t</sub>    P<sub>D</sub> = V<sub>D</sub>I<sub>D</sub> ≈ 0.7 I<sub>D</sub></div>
      <h3>Zener</h3>
      <div class="eq">P<sub>Z max</sub> = 4 I<sub>ZT</sub> V<sub>Z</sub>    ΔV<sub>Z</sub> = (TC/100%) V<sub>Z</sub> (T<sub>1</sub> − T<sub>0</sub>)</div>
      <p>Conducts against its arrow at V<sub>Z</sub>. Keep I<sub>ZK</sub> &lt; I<sub>Z</sub> &lt; I<sub>ZM</sub>.</p>
      <h3>LED</h3>
      <div class="eq">λ = c/f     E<sub>g</sub> = hc/λ   (λ in nm ≈ 1240/E<sub>g</sub> in eV)</div>
      <p>≈ 2 V at 20 mA (blue ≈ 5 V, white ≈ 4 V). Reverse breakdown only 3–5 V.</p>`,
  };
  Course.start(window.CHAPTER);
})();
