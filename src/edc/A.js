(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const ch = (n, file, part, where, html) => `<p class="aside">${html} <a href="${file}#${part}">Boylestad Chapter ${n}, ${where} →</a></p>`;
  const ohm = (r) => si(r, "Ω");

  /* Simple output curves: i_C (mA) = 0.125 i_B(µA) (1 + v_CE/45). */
  const iC = (ib, v) => 0.125 * ib * (1 + v / 45);

  const p1 = {
    id: "p1", title: "Reading h-parameters off the curves", mins: 25,
    blurb: "Each h-parameter is a small change divided by another, taken at the Q-point with one quantity held still.",
    takeaway: "Common emitter, at the Q-point: h_ie = Δv_BE/Δi_B with V_CE constant (Ω, from the input curves, along the tangent to the V_CE curve); h_re = Δv_BE/Δv_CE with I_B constant (unitless, input curves, horizontal line through Q); h_fe = Δi_C/Δi_B with V_CE constant (unitless, output curves, vertical line through Q); h_oe = Δi_C/Δv_CE with I_B constant (S, output curves, slope of the I_B curve through Q). Keep the changes small and centred on Q. The same definitions give CB and CC parameters with their own input/output quantities.",
    steps: [
      { k: "learn", title: "Four ratios", b: [
        `<div class="eq">h<sub>ie</sub> = Δv<sub>BE</sub>/Δi<sub>B</sub> |<sub>V<sub>CE</sub> const</sub>    h<sub>re</sub> = Δv<sub>BE</sub>/Δv<sub>CE</sub> |<sub>I<sub>B</sub> const</sub>    h<sub>fe</sub> = Δi<sub>C</sub>/Δi<sub>B</sub> |<sub>V<sub>CE</sub> const</sub>    h<sub>oe</sub> = Δi<sub>C</sub>/Δv<sub>CE</sub> |<sub>I<sub>B</sub> const</sub></div>`,
        `<p>h<sub>ie</sub>, h<sub>re</sub> come from the <b>input</b> (base) curves; h<sub>fe</sub>, h<sub>oe</sub> from the <b>output</b> (collector) curves. Each holds one quantity fixed: that tells you which line to draw through Q.</p>`,
        ch(5, "05-bjt-ac-analysis.html", "p12", "Part 12", "The hybrid model these parameters belong to."),
      ]},
      { k: "play", title: "On the output curves", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const VQ = 8.4, IBQ = 15;
          const d = (k) => {
            const fam = [5, 10, 15, 20, 25].map((ib) => ({ f: (v) => iC(ib, v), cls: ib === 15 ? "s1" : "s5" }));
            let extra = [], rows;
            if (k === 0) { extra = [{ pts: [[VQ, iC(10, VQ)], [VQ, iC(20, VQ)]], cls: "s2" }]; const dI = iC(20, VQ) - iC(10, VQ); rows = [["Vertical line at V<sub>CE</sub> = 8.4 V", "I<sub>B</sub> 10 → 20 µA"], ["Δi<sub>C</sub>", fmt(dI, 4) + " mA"], ["h<sub>fe</sub> = Δi<sub>C</sub>/Δi<sub>B</sub>", fmt(dI / 0.01, 4)]]; }
            else { extra = [{ pts: [[6, iC(15, 6)], [11, iC(15, 11)]], cls: "s2" }]; const dI = iC(15, 11) - iC(15, 6); rows = [["Along the I<sub>B</sub> = 15 µA curve", "V<sub>CE</sub> 6 → 11 V"], ["Δi<sub>C</sub>", fmt(dI * 1000, 4) + " µA"], ["h<sub>oe</sub> = Δi<sub>C</sub>/Δv<sub>CE</sub>", si((dI * 1e-3) / 5, "S", 4)]]; }
            f.innerHTML = plot({ x: [0, 20], y: [0, 4.5], xt: [0, 5, 10, 15, 20], yt: [0, 1, 2, 3, 4], xl: "v_CE (V)", yl: "i_C (mA)", h: 240, series: fam.concat(extra), marks: [{ x: VQ, y: iC(IBQ, VQ), label: "Q" }], label: "Collector curves with the construction for an h-parameter" });
            ro.innerHTML = readout(rows);
          };
          host.append(f, toggle(["h_fe: vertical line", "h_oe: along the curve"], d, 0), ro);
          d(0);
        },
        `<p class="aside">Illustrative curves for I<sub>B</sub> = 5 to 25 µA (Q on the 15 µA curve at 8.4 V). The blue segment is the construction.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "At V_CE fixed, i_B goes 10 → 18 µA and i_C goes 1.30 → 2.30 mA. h_fe?", a: 125, tol: 0.01, hint: "Δi_C/Δi_B.", why: "1 mA/8 µA = 125." },
        { t: "num", q: "Along an I_B curve, i_C goes 2.31 → 2.40 mA as v_CE goes 6 → 10 V. h_oe in µS?", a: 22.5, unit: "µS", tol: 0.01, hint: "0.09 mA/4 V.", why: "22.5 µS (1/h_oe = 44 kΩ)." },
        { t: "num", q: "Input curves: at V_CE fixed, Δv_BE = 12 mV for Δi_B = 8 µA. h_ie?", a: 1.5, unit: "kΩ", tol: 0.01, hint: "Δv_BE/Δi_B.", why: "1.5 kΩ." },
        { t: "num", q: "At I_B fixed, v_BE rises 6 mV as v_CE goes 0 → 15 V. h_re?", a: 0.0004, tol: 0.01, hint: "6 mV/15 V.", why: "4 × 10⁻⁴: tiny, which is why it's often dropped." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do you draw a vertical line through the Q-point to find h_fe?", model: "Because h_fe is defined with V_CE held constant, and on the collector curves a constant V_CE is a vertical line. Along it you read how much the collector current changes between two base-current curves, and divide by that change in base current." },
      ]},
    ],
  };

  const p2 = {
    id: "p2", title: "Converting between configurations", mins: 20,
    blurb: "Data sheets give one set; your circuit needs another. Exact and approximate conversions.",
    takeaway: "Approximate conversions (from CE values): common base h_ib ≈ h_ie/(1 + h_fe) ≈ r_e; h_rb ≈ h_ieh_oe/(1 + h_fe) − h_re; h_fb ≈ −h_fe/(1 + h_fe) ≈ −α; h_ob ≈ h_oe/(1 + h_fe). Common collector: h_ic ≈ h_ie (≈ βr_e); h_rc ≈ 1; h_fc ≈ −(1 + h_fe) ≈ −β; h_oc ≈ h_oe. Going from CB to CE: h_ie ≈ h_ib/(1 + h_fb) ≈ βr_e, h_fe ≈ −h_fb/(1 + h_fb) ≈ β, h_oe ≈ h_ob/(1 + h_fb). Exact forms add terms in h_rb and h_obh_ib (the book's Section A.2).",
    steps: [
      { k: "play", title: "Converter", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let hie = 1500, hfe = 125, hoe = 22.5e-6;
          function draw() {
            ro.innerHTML = readout([["h<sub>ib</sub> ≈ h<sub>ie</sub>/(1 + h<sub>fe</sub>)", ohm(hie / (1 + hfe))], ["h<sub>fb</sub> ≈ −h<sub>fe</sub>/(1 + h<sub>fe</sub>)", fmt(-hfe / (1 + hfe), 4)], ["h<sub>ob</sub> ≈ h<sub>oe</sub>/(1 + h<sub>fe</sub>)", si(hoe / (1 + hfe), "S", 4)], ["h<sub>ic</sub> ≈ h<sub>ie</sub>", ohm(hie)], ["h<sub>fc</sub> ≈ −(1 + h<sub>fe</sub>)", fmt(-(1 + hfe), 4)], ["h<sub>oc</sub> ≈ h<sub>oe</sub>, h<sub>rc</sub> ≈ 1", si(hoe, "S", 3)]]);
          }
          host.append(slider({ id: id + "-i", label: "h_ie", min: 200, max: 10e3, log: true, value: hie, show: ohm }, (v) => { hie = v; draw(); }).el,
            slider({ id: id + "-f", label: "h_fe", min: 20, max: 400, step: 1, value: hfe, show: (v) => String(v) }, (v) => { hfe = v; draw(); }).el,
            slider({ id: id + "-o", label: "h_oe", min: 1e-6, max: 100e-6, log: true, value: hoe, show: (v) => si(v, "S", 3) }, (v) => { hoe = v; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>h<sub>ie</sub> = 1.5 kΩ, h<sub>fe</sub> = 125, h<sub>oe</sub> = 22.5 µS.</p>`,
        { t: "num", q: "h_ib?", a: 11.9, unit: "Ω", tol: 0.01, hint: "h_ie/(1 + h_fe).", why: "11.9 Ω: that's r_e." },
        { t: "num", q: "h_fb?", a: -0.9921, tol: 0.002, hint: "−h_fe/(1 + h_fe).", why: "−0.992: minus alpha." },
        { t: "num", q: "h_fc?", a: -126, tol: 0.01, hint: "−(1 + h_fe).", why: "−126." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the common-base input parameter h_ib so much smaller than h_ie?", model: "Looking into the emitter, the base current is a factor of one plus beta smaller than the emitter current, so the same small base-emitter voltage change drives a much larger input current. The input resistance is divided by one plus h_fe, leaving roughly r_e." },
      ]},
    ],
  };

  const p3 = {
    id: "p3", title: "Typical values", mins: 10,
    blurb: "A sense of scale for each configuration.",
    takeaway: "Typical values (Table A.1): CE: h_i 1 kΩ, h_r 2.5 × 10⁻⁴, h_f 50, h_o 25 µA/V (1/h_o 40 kΩ). CC: h_i 1 kΩ, h_r ≈ 1, h_f −50, h_o 25 µA/V (40 kΩ). CB: h_i 20 Ω, h_r 3 × 10⁻⁴, h_f −0.98, h_o 0.5 µA/V (2 MΩ). A minus sign means one quantity falls as the other rises.",
    steps: [
      { k: "learn", title: "Table A.1", b: [
        `<div class="tbl"><table><tr><th></th><th>CE</th><th>CC</th><th>CB</th></tr><tr><td>h<sub>i</sub></td><td>1 kΩ</td><td>1 kΩ</td><td>20 Ω</td></tr><tr><td>h<sub>r</sub></td><td>2.5 × 10⁻⁴</td><td>≈ 1</td><td>3 × 10⁻⁴</td></tr><tr><td>h<sub>f</sub></td><td>50</td><td>−50</td><td>−0.98</td></tr><tr><td>h<sub>o</sub></td><td>25 µA/V</td><td>25 µA/V</td><td>0.5 µA/V</td></tr><tr><td>1/h<sub>o</sub></td><td>40 kΩ</td><td>40 kΩ</td><td>2 MΩ</td></tr></table></div>`,
        { t: "mcq", q: "Which configuration has an h_r close to 1?", opts: [["Common collector", true, "The output (emitter) follows the input almost exactly: strong reverse transfer."], ["Common emitter", false, "2.5 × 10⁻⁴."], ["Common base", false, "3 × 10⁻⁴."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What do the CB values in Table A.1 say about a common-base amplifier?", model: "Its input resistance is tiny, about 20 ohms; its current gain is just under one in magnitude; and its output resistance is very high, about 2 megohms. It's a low-in, high-out stage with current gain below one but potentially large voltage gain." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edcA", eyebrow: "Boylestad · Appendix A", title: "Hybrid Parameters: Graphs and Conversions",
    intro: `<p>Three short parts: reading the four h-parameters off transistor curves, converting between CE, CB and CC parameters, and typical values.</p><p>Reference material for Chapter 5's hybrid model.</p>`,
    after: `<p>There are no problems for the appendices. Use this with the Chapter 5 problems on hybrid parameters.</p>`,
    parts: [p1, p2, p3],
    summary: `
      <div class="eq">h<sub>ie</sub> = Δv<sub>BE</sub>/Δi<sub>B</sub> (V<sub>CE</sub> const)    h<sub>re</sub> = Δv<sub>BE</sub>/Δv<sub>CE</sub> (I<sub>B</sub> const)    h<sub>fe</sub> = Δi<sub>C</sub>/Δi<sub>B</sub> (V<sub>CE</sub> const)    h<sub>oe</sub> = Δi<sub>C</sub>/Δv<sub>CE</sub> (I<sub>B</sub> const)</div>
      <div class="eq">CB: h<sub>ib</sub> ≈ h<sub>ie</sub>/(1 + h<sub>fe</sub>), h<sub>fb</sub> ≈ −h<sub>fe</sub>/(1 + h<sub>fe</sub>), h<sub>ob</sub> ≈ h<sub>oe</sub>/(1 + h<sub>fe</sub>), h<sub>rb</sub> ≈ h<sub>ie</sub>h<sub>oe</sub>/(1 + h<sub>fe</sub>) − h<sub>re</sub></div>
      <div class="eq">CC: h<sub>ic</sub> ≈ h<sub>ie</sub>, h<sub>rc</sub> ≈ 1, h<sub>fc</sub> ≈ −(1 + h<sub>fe</sub>), h<sub>oc</sub> ≈ h<sub>oe</sub></div>`,
  };
  Course.start(window.CHAPTER);
})();
