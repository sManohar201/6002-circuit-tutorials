(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const ohm = (r) => si(r, "Ω", 3);
  const E24 = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1];
  const CAPS = [1.0, 1.5, 2.2, 3.3, 4.7, 6.8];
  const nearest = (x, series) => {
    const dec = Math.pow(10, Math.floor(Math.log10(x))), m = x / dec;
    let best = series[0], bd = Infinity;
    series.concat([10]).forEach((s) => { const d = Math.abs(Math.log(m / s)); if (d < bd) { bd = d; best = s; } });
    return best * dec;
  };

  const p1 = {
    id: "p1", title: "Greek letters you'll meet", mins: 10,
    blurb: "The symbols both books use, and what each usually stands for.",
    takeaway: "α alpha (CB current gain), β beta (CE current gain), γ gamma, Δ/δ delta (a small change), ε epsilon (permittivity), η eta (UJT stand-off ratio, efficiency), θ theta (angle, thermal resistance), λ lambda (wavelength, light), μ mu (micro, 10⁻⁶; amplification factor), π pi, ρ rho (resistivity), σ sigma (conductivity), τ tau (time constant), φ phi (phase angle, flux), ω omega (angular frequency, rad/s), Ω capital omega (ohm).",
    steps: [
      { k: "learn", title: "The ones that matter here", b: [
        `<div class="tbl"><table><tr><th>Letter</th><th>Name</th><th>Usually means</th></tr><tr><td>α</td><td>alpha</td><td>common-base current gain I<sub>C</sub>/I<sub>E</sub></td></tr><tr><td>β</td><td>beta</td><td>common-emitter current gain I<sub>C</sub>/I<sub>B</sub>; feedback fraction</td></tr><tr><td>Δ, δ</td><td>delta</td><td>a small change</td></tr><tr><td>ε</td><td>epsilon</td><td>permittivity</td></tr><tr><td>η</td><td>eta</td><td>UJT stand-off ratio; efficiency</td></tr><tr><td>θ</td><td>theta</td><td>angle; thermal resistance</td></tr><tr><td>λ</td><td>lambda</td><td>wavelength; light-induced (I<sub>λ</sub>)</td></tr><tr><td>μ</td><td>mu</td><td>micro (10⁻⁶)</td></tr><tr><td>ρ</td><td>rho</td><td>resistivity</td></tr><tr><td>τ</td><td>tau</td><td>time constant</td></tr><tr><td>φ</td><td>phi</td><td>phase angle; flux</td></tr><tr><td>ω</td><td>omega</td><td>angular frequency, 2πf</td></tr><tr><td>Ω</td><td>Omega</td><td>ohm</td></tr></table></div>`,
        { t: "mcq", q: "In V_P = ηV_BB + V_D, η is…", opts: [["The UJT's intrinsic stand-off ratio", true, "R_B1/R_BB."], ["Efficiency", false, "Same letter, different chapter."], ["A small change", false, "That's Δ."]] },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Standard component values", mins: 10,
    blurb: "Resistors and capacitors come in fixed steps. Round a calculated value to one you can buy.",
    takeaway: "Commercial resistors follow the E24 series in each decade: 1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1 (from 0.1 Ω to 22 MΩ in the book's table). Typical capacitors: 10, 15, 22, 33, 47, 68 in each decade (pF up to 68 000 pF, then µF). After a design calculation, pick the nearest standard value (or the next one that keeps the design safe) and recheck.",
    steps: [
      { k: "play", title: "Nearest standard value", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let R = 4500, C = 9.9e-9;
          function draw() { const rn = nearest(R, E24), cn = nearest(C, CAPS); ro.innerHTML = readout([["Calculated R", ohm(R)], ["Nearest E24 resistor", ohm(rn) + " (" + fmt((100 * (rn - R)) / R, 3) + "%)"], ["Calculated C", si(C, "F", 3)], ["Nearest typical capacitor", si(cn, "F", 2) + " (" + fmt((100 * (cn - C)) / C, 3) + "%)"]]); }
          host.append(slider({ id: id + "-r", label: "Calculated resistance", min: 1, max: 10e6, log: true, value: R, show: ohm }, (v) => { R = v; draw(); }).el,
            slider({ id: id + "-c", label: "Calculated capacitance", min: 1e-11, max: 1e-3, log: true, value: C, show: (v) => si(v, "F", 3) }, (v) => { C = v; draw(); }).el, ro);
          draw();
        },
        `<div class="tbl"><table><tr><th>E24 steps in every decade</th></tr><tr><td>${E24.map((x) => fmt(x, 2)).join(" · ")}</td></tr></table></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A design calls for 706 Ω. Nearest standard resistor?", opts: [["680 Ω", true, "Next ones are 620 and 750; 680 is closest (−3.7%)."], ["700 Ω", false, "Not an E24 value."], ["750 Ω", false, "+6.2%: further away."]] },
        { t: "mcq", q: "A phase-shift oscillator needs 9.9 nF. Typical capacitor?", opts: [["10 nF", true, "10 000 pF = 10 nF."], ["9.1 nF", false, "That's a resistor-series number."], ["12 nF", false, "Not in the typical capacitor list."]] },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edcC", eyebrow: "Boylestad · Appendix C", title: "Charts and Tables",
    intro: `<p>Two quick parts: the Greek letters used through both books, and the standard resistor and capacitor values you round a design to.</p>`,
    after: `<p>There are no problems for the appendices.</p>`,
    parts: [p1, p2],
    summary: `<p>E24 resistors per decade: ${E24.map((x) => fmt(x, 2)).join(", ")}. Typical capacitors per decade: 10, 15, 22, 33, 47, 68.</p>`,
  };
  Course.start(window.CHAPTER);
})();
