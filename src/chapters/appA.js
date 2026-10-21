(function () {
  const { S, plot, slider, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;

  function pathsFig(flux) {
    let s = `<ellipse cx="200" cy="100" rx="82" ry="38" class="zone" style="${flux ? "fill:var(--accent);opacity:.18" : "fill:none"}"/>`;
    s += `<path class="w" d="M70 100 C 110 10, 290 10, 330 100" style="fill:none"/><path class="w" d="M70 100 C 110 190, 290 190, 330 100" style="fill:none;stroke:var(--cool)"/>`;
    s += S.dot(70, 100) + S.dot(330, 100) + S.t(56, 105, "x", { a: "end" }) + S.t(344, 105, "y", { a: "start" }) + S.t(200, 30, "path 1") + S.t(200, 186, "path 2", { cls: "c" });
    s += S.t(200, 106, flux ? "∂Φ_B/∂t ≠ 0" : "no changing flux", { cls: flux ? "a" : "s m" });
    return S.svg(400, 200, s, { max: 400, label: "Two paths from x to y passing either side of a region of magnetic flux" });
  }
  function filFig() {
    let s = `<rect x="110" y="60" width="180" height="50" rx="6" class="box"/>` + S.wire([40, 85], [110, 85]) + S.wire([290, 85], [360, 85]) + S.dot(40, 85) + S.dot(360, 85);
    s += S.t(40, 70, "x") + S.t(360, 70, "y") + S.t(200, 90, "ρ (resistivity)", { cls: "s m" }) + S.arrow(110, 135, 290, 135, "") + S.arrow(290, 135, 110, 135, "") + S.t(200, 155, "length l") + S.t(310, 52, "area a", { a: "start", cls: "s" });
    s += S.arrow(60, 104, 95, 104, "") + S.t(78, 122, "i", { cls: "c" });
    return S.svg(400, 170, s, { max: 400, label: "A cylindrical filament of length l, cross-section a and resistivity rho between terminals x and y" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "When does 'voltage' make sense?", mins: 20,
    blurb: "Faraday's law, and the first rule of the lumped world.",
    takeaway: "Voltage V_yx = −∫ E·dl from x to y. Faraday: ∮E·dl = −∂Φ_B/∂t. If magnetic flux through a loop is changing, the integral depends on the path and 'the voltage between x and y' has no single value. Constraint 1: choose element boundaries so ∂Φ_B/∂t = 0 outside every element (put any flux inside an inductor).",
    steps: [
      { k: "learn", title: "Why bother?", b: [
        `<p>Chapter 1 promised: if we follow three rules (the <b>lumped matter discipline</b>), Maxwell's equations collapse into simple algebra: KVL, KCL and element laws. This appendix shows <b>why</b>.</p>`,
        `<p>A <b>lumped element</b> is one where a single terminal voltage V(t) and a single terminal current I(t) make sense. When do they?</p>`,
      ]},
      { k: "learn", title: "Voltage is a path integral", b: [
        `<div class="eq">V<sub>yx</sub> = − ∫<sub>x→y</sub> E · dl</div>`,
        `<p>The energy per unit charge to push a charge from x to y against the electric field. But this is an integral along a <b>path</b>. Do two different paths give the same answer?</p>`,
        `<p>Go out along path 1 and back along path 2: a closed loop. Faraday's law of induction:</p>`,
        `<div class="key">∮ E · dl = − ∂Φ<sub>B</sub>/∂t</div>`,
        `<p>(Φ<sub>B</sub>: magnetic flux through the loop.)</p>`,
      ]},
      { k: "play", title: "Two paths", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let dphi = 0;
          function draw() {
            f.innerHTML = pathsFig(dphi !== 0);
            const v1 = 1.5, v2 = v1 - dphi;
            ro.innerHTML = readout([["∂Φ_B/∂t through the loop", fmt(dphi, 3) + " V"], ["V_yx via path 1", fmt(v1, 3) + " V"], ["V_yx via path 2", fmt(v2, 3) + " V"], ["a unique voltage?", dphi === 0 ? "yes" : "no: it depends on the path"]]);
          }
          host.append(f, slider({ id: id + "-d", label: "rate of change of flux ∂Φ_B/∂t", min: -1, max: 1, step: 0.05, value: dphi, show: (x) => fmt(x) + " V" }, (x) => { dphi = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">A made-up 1.5 V along path 1. The two answers differ by exactly ∂Φ<sub>B</sub>/∂t. A voltmeter's leads form a loop too: with changing flux, moving the leads changes the reading.</p>`,
      ]},
      { k: "learn", title: "Constraint 1", b: [
        `<div class="key">Choose element boundaries so that ∂Φ<sub>B</sub>/∂t = 0, for all time, through any closed path outside the element.</div>`,
        `<p>Then ∮E·dl = 0 outside elements, paths agree, and each element has one terminal voltage.</p>`,
        `<p>What if a part really does make significant changing flux? Draw the boundary around it and call it an <b>inductor</b>: the flux lives inside.</p>`,
      ]},
      { k: "check", title: "Check", b: [
        { t: "mcq", q: "A transformer sits next to your circuit, its changing field threading one of your wire loops. What breaks?", opts: [["Constraint 1: the voltage between two nodes now depends on how the loop is drawn", true, "This is exactly how mains hum gets picked up. Fix: keep loops small, or model the coupling explicitly."], ["Nothing: KVL always holds", false, "KVL is derived from ∮E·dl = 0, which needs the flux not to be changing."], ["Only KCL", false, "KCL is about charge, not flux."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do we need constant magnetic flux outside elements before we can talk about 'the voltage' between two points?", model: "Voltage is the integral of the electric field along a path. Faraday's law says the integral around a closed loop equals minus the rate of change of magnetic flux through it. If that's not zero, two different paths between the same points give different answers, so there's no single voltage." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "When does 'current through' make sense?", mins: 15,
    blurb: "Charge conservation, and the second rule.",
    takeaway: "Continuity: ∯J·dS = −∂q/∂t (current out of a closed surface = rate charge inside falls). If charge inside an element changes, current in ≠ current out. Constraint 2: choose element boundaries so the total charge inside never changes (∂q/∂t = 0); stored charge goes into a capacitor, as +q and −q.",
    steps: [
      { k: "learn", title: "Current through a surface", b: [
        `<div class="eq">I = ∫<sub>S</sub> J · dS</div>`,
        `<p>J is current density (A/m²). Wrap a closed surface around the whole element. Charge conservation (the continuity equation, built into Maxwell's equations):</p>`,
        `<div class="key">∯ J · dS = − ∂q/∂t</div>`,
        `<p>Net current out of the surface = rate at which the charge inside goes down.</p>`,
      ]},
      { k: "play", title: "In vs out", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let dq = 0;
          const iin = 2;
          function draw() {
            ro.innerHTML = readout([["current in at x", fmt(iin, 3) + " mA"], ["charge piling up inside, ∂q/∂t", fmt(dq, 3) + " mA"], ["current out at y", fmt(iin - dq, 3) + " mA"], ["one current 'through' it?", dq === 0 ? "yes" : "no"]]);
          }
          host.append(slider({ id: id + "-q", label: "rate charge builds up inside", min: -1, max: 1, step: 0.1, value: dq, show: (x) => fmt(x) + " mA" }, (x) => { dq = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">With no charge build-up the two ends carry the same current, so "the current through the element" means one thing.</p>`,
      ]},
      { k: "learn", title: "Constraint 2", b: [
        `<div class="key">Choose element boundaries so the total charge inside the element does not change: ∂q/∂t = 0 for all time.</div>`,
        `<p>Does a part store charge? Collect equal and opposite charges +q and −q inside one boundary: a <b>capacitor</b>. Its <b>total</b> charge is zero, so the current in one terminal equals the current out of the other.</p>`,
      ]},
      { k: "check", title: "Check", b: [
        { t: "mcq", q: "Is a capacitor allowed under constraint 2? It stores charge!", opts: [["Yes: it holds +q on one plate and −q on the other, so the total inside its boundary stays zero", true, "Exactly why the capacitor is drawn as one element with both plates inside."], ["No, capacitors break the lumped abstraction", false, "They're designed to satisfy it."], ["Only at DC", false, "Total charge is zero at all times."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't an element hold a changing net charge if we want a single current through it?", model: "By conservation of charge, the current flowing out of a closed surface equals the rate the charge inside decreases. If the net charge inside is changing, the currents at the two terminals differ, so there isn't one current through the element." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Small compared with a wavelength", mins: 15,
    blurb: "The third rule: signals must be slow compared with light crossing the circuit.",
    takeaway: "Constraint 3: signal timescales ≫ electromagnetic propagation delay across the element (or the whole circuit). Equivalently, size ≪ wavelength λ = c/f. Then current in and out can be treated as simultaneous, like a point mass. For whole circuits this is stricter, because circuits are bigger than elements.",
    steps: [
      { k: "learn", title: "Signals take time to cross", b: [
        `<p>Push a current pulse into terminal x. Electromagnetic waves travel at about c = 3×10⁸ m/s, so terminal y doesn't feel it instantly. For a moment, current in ≠ current out.</p>`,
        `<div class="key">Constraint 3: signal timescales ≫ the propagation delay across the element</div>`,
        `<p>Same thing in space: <b>size ≪ wavelength</b>, λ = c/f.</p>`,
      ]},
      { k: "play", title: "Is it lumped?", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let lf = 6, size = 0.1;
          function draw() {
            const f = Math.pow(10, lf), lam = 3e8 / f, ratio = size / lam;
            ro.innerHTML = readout([["frequency", si(f, "Hz")], ["wavelength λ = c/f", si(lam, "m")], ["size / λ", ratio < 1e-3 ? fmt(ratio, 2) : fmt(ratio, 3)], ["lumped?", ratio < 0.01 ? "yes, comfortably" : ratio < 0.1 ? "borderline" : "no: wave effects matter"]]);
          }
          host.append(slider({ id: id + "-f", label: "signal frequency", min: 1, max: 11, step: 0.1, value: lf, show: (x) => si(Math.pow(10, x), "Hz") }, (x) => { lf = x; draw(); }).el,
            slider({ id: id + "-s", label: "circuit size", min: 0.001, max: 100, log: true, value: size, show: (x) => si(x, "m") }, (x) => { size = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Try a 10 cm board at 50 Hz, at 1 MHz, at 3 GHz. Then a 100 km power line at 50 Hz.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "Wavelength at 2 GHz?", a: 15, unit: "cm", why: "3×10⁸ / 2×10⁹ = 0.15 m. A 3 cm chip is a fifth of that: not small. High-speed chip designers must treat wires as transmission lines." },
        { t: "mcq", q: "Why is the third constraint stricter for a whole circuit than for one resistor?", opts: [["A circuit is physically much larger than any single element, so the delay across it is longer", true, "The first two constraints carry over automatically from the elements and ideal wires; the size one doesn't."], ["Circuits run at higher frequencies", false, "Same signals pass through both."], ["It isn't stricter", false, "Size is what matters, and circuits are bigger."]] },
      ]},
      { k: "learn", title: "The discipline for whole circuits", b: [
        `<ol><li>Rate of change of magnetic flux linked with any part of the circuit = 0.</li><li>Rate of change of charge at any node = 0.</li><li>Signal timescales ≫ propagation delay across the circuit (circuit ≪ wavelength).</li></ol>`,
        `<p class="aside">Real circuits do make small fields everywhere (Chapter 9). Usually negligible; when not, add a capacitor or inductor to the model.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "State the third constraint two ways.", model: "The signals must change slowly compared with the time it takes electromagnetic waves to cross the element or circuit. Equivalently, the circuit must be much smaller than the wavelength of the highest frequency involved." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "KVL, KCL and R = ρl/a from Maxwell", mins: 20,
    blurb: "The payoff: the circuit laws drop out.",
    takeaway: "Under the discipline, ∮E·dl = 0 around any loop; split into element voltages: KVL. ∯J·dS = 0 around any node; split into wire currents: KCL (charge conservation). Microscopic Ohm's law E = ρJ with uniform fields in a cylinder gives R = v/i = El/(Ja) = ρl/a; a block with terminals on its w×h faces gives ρl/(wh).",
    steps: [
      { k: "math", title: "KVL", b: [
        `<p>With constraint 1, Faraday becomes ∮E·dl = 0. Take a loop through elements a→b→c→a. Ideal wires contribute 0; each element contributes its voltage:</p>`,
        `<div class="eq">∫<sub>a</sub><sup>b</sup> E·dl + ∫<sub>b</sub><sup>c</sup> E·dl + ∫<sub>c</sub><sup>a</sup> E·dl = v₁ + v₂ + v₃ = 0</div>`,
        `<div class="key">KVL: the voltages around any closed path sum to zero</div>`,
      ]},
      { k: "math", title: "KCL", b: [
        `<p>With constraint 2, continuity becomes ∯J·dS = 0. Wrap a surface around a node. Current only crosses where wires poke through:</p>`,
        `<div class="eq">∯ J·dS = −i<sub>a</sub> − i<sub>b</sub> − i<sub>c</sub> = 0</div>`,
        `<div class="key">KCL: the currents into any node sum to zero (charge conservation)</div>`,
      ]},
      { k: "math", title: "Resistance from geometry", b: [
        fig(filFig()),
        `<p>Inside the material, the microscopic Ohm's law: <b>E = ρJ</b> (ρ = resistivity). Then</p>`,
        `<div class="eq">R = v/i = ∫E·dl / ∫J·dS</div>`,
        { t: "reveal", label: "For a uniform cylinder", html: `<p>E and J are uniform: ∫E·dl = El and ∫J·dS = Ja.</p><div class="eq">R = El/(Ja) = ρ l/a</div><p>A rectangular block of length l with terminals on its w × h faces: R = ρl/(wh).</p>` },
        `<p class="aside">The constraints are what let us write one v and one i in the first place.</p>`,
      ]},
      { k: "play", title: "Size a wire", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          const mats = [["copper", 1.7e-8], ["aluminium", 2.8e-8], ["nichrome (heater wire)", 1.1e-6]];
          let m = 0, L = 10, A = 1;
          function draw() {
            const R = (mats[m][1] * L) / (A * 1e-6);
            ro.innerHTML = readout([["material", mats[m][0]], ["ρ", fmt(mats[m][1], 2) + " Ω·m"], ["R = ρl/a", si(R, "Ω")]]);
          }
          host.append(Course.toggle(mats.map((x) => x[0]), (k) => { m = k; draw(); }, 0),
            slider({ id: id + "-l", label: "length l", min: 0.1, max: 100, log: true, value: L, show: (x) => fmt(x, 3) + " m" }, (x) => { L = x; draw(); }).el,
            slider({ id: id + "-a", label: "cross-section a", min: 0.05, max: 10, log: true, value: A, show: (x) => fmt(x, 3) + " mm²" }, (x) => { A = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Double the length: R doubles. Double the area: R halves.</p>`,
      ]},
      { k: "check", title: "Numbers", b: [
        { t: "num", q: "Copper (ρ = 1.7×10⁻⁸ Ω·m), 20 m long, 0.5 mm² cross-section. R?", a: 0.68, unit: "Ω", why: "1.7×10⁻⁸ × 20 / 0.5×10⁻⁶ = 0.68 Ω." },
        { t: "num", q: "A block, ρ = 0.02 Ω·m, length 4 mm, terminal faces 1 mm × 2 mm. R?", a: 40, unit: "Ω", why: "0.02 × 0.004 / (0.001 × 0.002) = 40 Ω." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Which Maxwell-level fact becomes KCL, and which constraint makes it work?", model: "Conservation of charge: the current out of any closed surface equals the rate the charge inside falls. The second constraint says the charge at a node never changes, so the net current into the node is zero, which is KCL." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "appA", eyebrow: "Appendix A", title: "Maxwell's Equations and the Lumped Matter Discipline",
    intro: `<p>Four short parts. Why "the voltage across" and "the current through" an element mean anything at all, and how KVL, KCL and R = ρl/a fall out of Maxwell's equations once three rules hold.</p><p class="aside">Background for <a href="01-circuit-abstraction.html">Chapter 1</a>. Arrow keys ← → move between steps.</p>`,
    after: `<p>Appendices have no problems of their own. Revisit Chapter 1's lumped matter discipline: it should now feel earned rather than assumed.</p>`,
    parts: [p1, p2, p3, p4],
    summary: `
      <h3>Why rules are needed</h3>
      <p>V<sub>yx</sub> = −∫E·dl (path integral). Faraday: ∮E·dl = −∂Φ<sub>B</sub>/∂t. Continuity: ∯J·dS = −∂q/∂t.</p>
      <h3>Lumped matter discipline</h3>
      <ol><li>∂Φ<sub>B</sub>/∂t = 0 outside elements (flux lives in inductors).</li><li>∂q/∂t = 0 inside each element and at each node (stored ±q lives in capacitors).</li><li>Signal timescales ≫ propagation delay; size ≪ λ = c/f.</li></ol>
      <h3>Consequences</h3>
      <p>∮E·dl = 0 → KVL. ∯J·dS = 0 → KCL. E = ρJ → R = ρl/a (cylinder), ρl/(wh) (block).</p>`,
  };
  Course.start(window.CHAPTER);
})();
