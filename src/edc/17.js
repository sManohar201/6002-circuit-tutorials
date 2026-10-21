(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const seen = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const ch = (n, file, part, where, html) => `<p class="aside">${html} <a href="${file}#${part}">Boylestad Chapter ${n}, ${where} →</a></p>`;
  const ohm = (r) => si(r, "Ω");
  const TAU = 2 * Math.PI, PI = Math.PI;
  const V = (v) => si(v, "V", 4), A = (i) => si(i, "A", 4), hz = (f) => si(f, "Hz", 4);

  /* pnpn layers as a stack with terminals. */
  function layersFig(gates) {
    const lay = ["p", "n", "p", "n"];
    let s = "";
    lay.forEach((l, i) => { s += `<rect x="120" y="${30 + i * 40}" width="90" height="40" style="fill:${l === "p" ? "var(--accent-soft)" : "var(--cool-soft)"};stroke:var(--line)"/>` + S.t(165, 56 + i * 40, l, { cls: "big" }); });
    s += S.wire([165, 30], [165, 10]) + S.t(175, 16, "anode (A)", { a: "start", cls: "s" }) + S.wire([165, 190], [165, 210]) + S.t(175, 210, "cathode (K)", { a: "start", cls: "s" });
    if (gates >= 1) s += S.wire([210, 130], [260, 130]) + S.t(266, 135, "gate (G) on the lower p", { a: "start", cls: "a s" });
    if (gates >= 2) s += S.wire([120, 90], [70, 90]) + S.t(64, 95, "anode gate", { a: "end", cls: "c s" });
    return S.svg(470, 220, `<g transform="translate(30,0)">${s}</g>`, { max: 470, label: "Four-layer pnpn structure with its terminals" });
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "The SCR: a latching switch", mins: 25,
    blurb: "Four layers, a gate pulse to turn on, and no way to turn off except starving its current.",
    takeaway: "SCR (silicon-controlled rectifier, Bell Labs 1956): pnpn with a gate on the inner p layer; the family of controlled pnpn devices are thyristors. Ratings up to 2000 A, 1800 V; up to about 50 kHz. Forward bias alone isn't enough: a gate pulse I_GT turns it on. Two-transistor model: an npn (Q₂) and a pnp (Q₁) each feeding the other's base: once the gate turns Q₂ on, I_C2 drives Q₁, whose I_C1 drives Q₂ harder: regeneration latches it on (dynamic resistance 0.01–0.1 Ω; reverse ≥ 100 kΩ). Turn-on 0.1–1 µs (10–25 µs for 100–400 A parts). Removing the gate doesn't turn it off. Turn-off: anode current interruption (series switch opened, or shunt switch closed) or forced commutation (briefly force current backwards, e.g. a transistor switching a battery across it). Turn-off 5–30 µs. It can also fire from high temperature or by exceeding the breakover voltage.",
    steps: [
      { k: "learn", title: "Four layers, three terminals", b: [
        fig(layersFig(1)),
        `<p>Split the middle layers and you get two transistors: a pnp (Q<sub>1</sub>, top three layers) and an npn (Q<sub>2</sub>, bottom three). Each one's collector feeds the other's base.</p>`,
        ch(3, "03-bjts.html", "p1", "Chapter 3", "npn and pnp transistors."),
      ]},
      { k: "play", title: "Latch it", b: [
        (host) => {
          const box = el(`<div></div>`), ro = el(`<div></div>`), row = el(`<div class="row"></div>`);
          let on = false, closed = true, log = "Off: both transistors cut off, only leakage I_CO flows.";
          const draw = () => { ro.innerHTML = readout([["Anode switch", closed ? "closed" : "open"], ["SCR state", on ? "ON (latched)" : "OFF"], ["Load current", on && closed ? "flows" : "≈ 0"]]); box.textContent = log; };
          const btn = (lab, fn) => { const b = el(`<button type="button" class="btn small">${lab}</button>`); b.addEventListener("click", () => { fn(); draw(); }); row.appendChild(b); };
          btn("Gate pulse", () => { if (closed) { on = true; log = "Gate pulse: Q2 turns on, its collector current turns Q1 on, Q1 feeds Q2's base: regeneration. Latched on."; } else log = "No anode current path, so nothing can latch."; });
          btn("Remove gate", () => { log = on ? "Gate removed: still on. The two transistors keep each other on." : "Nothing changes: it was off."; });
          btn("Open anode switch", () => { closed = false; if (on) log = "Anode current interrupted: it drops below the holding current and the SCR turns off."; on = false; });
          btn("Close anode switch", () => { closed = true; log = "Anode voltage back, but no gate pulse: stays off."; });
          host.append(row, ro, box);
          draw();
        },
        `<p>Like a light switch you can flick on with a tap but can only flick off by cutting the power. Forced commutation does it electronically: briefly push current the wrong way.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "An SCR is conducting. You remove the gate signal. What happens?", opts: [["It keeps conducting", true, "Regeneration holds it on."], ["It turns off immediately", false, "Only a few special SCRs (and GTOs) can be turned off from the gate."], ["It turns off after its turn-off time", false, "Not without its current dropping."]] },
        { t: "sort", q: "Turns an SCR off or not?", bins: ["Turns it off", "Doesn't"], items: [["Opening a switch in series with the anode", 0, "Series interruption."], ["Closing a switch across the SCR", 0, "Shunt interruption diverts its current."], ["Forcing a brief reverse current through it", 0, "Forced commutation."], ["Removing the gate current", 1, "It's latched."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain with the two-transistor model why an SCR latches on.", model: "The pnpn structure acts like a pnp and an npn transistor, each one's collector driving the other's base. A gate pulse turns the npn on; its collector current turns the pnp on; the pnp's collector current feeds the npn's base, driving it harder. The loop sustains itself, so the SCR stays on even after the gate pulse ends." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "SCR characteristics and ratings", mins: 20,
    blurb: "More gate current, lower breakover voltage. Holding current, blocking regions, gate limits.",
    takeaway: "Forward breakover voltage V_(BR)F*: above it the SCR enters conduction (the * names the gate condition: O open, S shorted, R resistor, V bias to K). With I_G = 0 the full breakover is needed; larger I_G lowers it until the curve approaches a plain diode's. Holding current I_H: below it the SCR returns to forward blocking (I_H falls as I_G rises). Forward and reverse blocking regions: open circuit. Reverse breakdown: like a diode's avalanche region. Gate ratings: P_GFM, I_GFM, V_GFM; a shaded 'preferred firing area' fires every unit of a series; minimum trigger current depends on temperature (e.g. 100 mA at −65 °C, 20 mA at +150 °C); about 3 V of gate voltage fires all units. Also t_on, t_off, T_J, T_C.",
    steps: [
      { k: "play", title: "Gate current moves breakover", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let ig = 0;
          function draw() {
            const Vbo = 400 * Math.pow(1 - ig, 2) + 2, IH = 20 - 12 * ig;
            const curve = (v) => (v < Vbo ? 0.2 + v * 0.002 : NaN);
            f.innerHTML = plot({ x: [0, 450], y: [0, 100], xt: [0, 100, 200, 300, 400], yt: [0, 50, 100], xl: "V_F (V)", yl: "I_A (mA)", h: 230, series: [{ f: curve, cls: "s1" }, { pts: [[Vbo, 0.2 + Vbo * 0.002], [3, IH]], cls: "s5" }, { pts: [[0.7, 0], [3, IH], [8, 100]], cls: "s1" }, { pts: [[0, IH], [450, IH]], cls: "s4" }], marks: [{ x: Vbo, y: 0.2 + Vbo * 0.002, label: "breakover", a: "end", dx: -10 }], texts: [{ x: 300, y: IH + 4, s: "I_H" }], label: "SCR forward characteristic: blocking until breakover, then conduction" });
            ro.innerHTML = readout([["Gate current (relative)", fmt(ig, 2)], ["Breakover voltage", fmt(Vbo, 3) + " V"]]);
          }
          host.append(f, slider({ id: id + "-g", label: "Gate current I_G (relative)", min: 0, max: 1, step: 0.01, value: ig, show: (v) => fmt(v, 2) }, (v) => { ig = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">An illustrative SCR. The dashed path is the snap from blocking to conduction. Turn the gate current up and it fires at a lower voltage: that's how the gate controls it.</p>`,
      ]},
      { k: "learn", title: "Words on the sheet", b: [
        `<div class="two"><div class="tile"><h3>V<sub>(BR)F</sub>*</h3><p>Forward breakover. * = O (gate open), S (shorted to K), R (resistor), V (bias).</p></div><div class="tile"><h3>I<sub>H</sub></h3><p>Holding current: below it, back to blocking.</p></div><div class="tile"><h3>Blocking regions</h3><p>Forward and reverse: the SCR is an open circuit.</p></div><div class="tile"><h3>Gate limits</h3><p>P<sub>GFM</sub>, I<sub>GFM</sub>, V<sub>GFM</sub>. Colder needs more gate current.</p></div></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "V_(BR)FS on a sheet means the breakover voltage measured with…", opts: [["The gate shorted to the cathode", true, "S = short."], ["The gate open", false, "That's O."], ["A gate resistor", false, "That's R."]] },
        { t: "mcq", q: "Why design for the gate current needed at −65 °C, not at 25 °C?", opts: [["It's the largest: a cold SCR needs the most gate current", true, "100 mA at −65 °C versus 20 mA at +150 °C for that series."], ["Because gate voltage rises with temperature", false, "Not the reason."], ["It isn't necessary", false, "It is, if the circuit must work cold."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is the holding current of an SCR?", model: "The minimum anode current that keeps the SCR latched on. If the current falls below it, the regenerative loop can't sustain itself and the SCR returns to its forward-blocking, off state." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const halfPow = (a) => (PI - a + Math.sin(2 * a) / 2) / PI;
  const p3 = {
    id: "p3", title: "SCR applications", mins: 25,
    blurb: "A static switch, phase control of power, a battery charger, a heater controller and emergency lighting.",
    takeaway: "Half-wave static switch: closing the gate switch fires the SCR each positive half-cycle (R₁ limits gate current, D₁ blocks reverse gate current); the load gets half-wave power; closing it part-way into the cycle gives less than 180°. Variable-resistance phase control: R₁ in the gate path sets how far up the positive half-cycle the gate current reaches the trigger level: firing from 0° to 90°, conduction from 180° down to 90° (beyond 90° the input is already falling). Battery charger: SCR₁ charges through a full-wave supply; when the battery voltage is high enough a Zener (11 V) fires SCR₂, which pulls SCR₁'s gate voltage too low: charging stops (C₁ prevents false triggering). Temperature controller: a mercury thermostat (< 1 mA) shorts the gate capacitor so the SCR stops firing the 100 W heater. Emergency lighting: when mains fails, a capacitor discharges, the gate goes positive, and the SCR connects the 6 V battery to the lamp.",
    steps: [
      { k: "play", title: "Phase control", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 45;
          function draw() {
            const ar = (a * PI) / 180, load = (t) => { const th = (TAU * t) % TAU; return th >= ar && th <= PI ? Math.sin(th) : 0; };
            f.innerHTML = plot({ x: [0, 2], y: [-1.2, 1.2], xt: [0, 0.5, 1, 1.5, 2], yt: [-1, 0, 1], xl: "time (cycles)", h: 210, series: [{ f: (t) => Math.sin(TAU * t), cls: "s5" }, { f: load, cls: "s1", n: 1500 }], label: "Load voltage with the SCR fired at an adjustable angle" });
            ro.innerHTML = readout([["Firing angle", a + "°"], ["Conduction angle", 180 - a + "°"], ["Power vs. firing at 0°", fmt(100 * halfPow(ar), 3) + "%"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "Firing angle (simple R control reaches 90°)", min: 0, max: 90, step: 1, value: a, show: (v) => v + "°" }, (v) => { a = v; draw(); }).el, ro);
          draw();
        },
        `<p>Larger R<sub>1</sub> → the gate current reaches trigger level later in the half-cycle → less conduction → less power. Past 90° the input is falling, so this simple circuit can't delay firing any further.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Resistive load, half-wave, fired at 60°. Power as a % of firing at 0°?", a: 80.45, unit: "%", tol: 0.01, hint: "[(π − α) + ½ sin 2α]/π with α = π/3.", why: "80.4%: cutting the first 60° removes only the low part of the sine." },
        { t: "num", q: "Fired at 90°?", a: 50, unit: "%", tol: 0.01, hint: "Half the half-cycle, symmetric.", why: "50%." },
      ]},
      { k: "learn", title: "Three more circuits", b: [
        `<div class="two"><div class="tile"><h3>Battery charger</h3><p>SCR<sub>1</sub> charges. When the battery is full, an 11 V Zener fires SCR<sub>2</sub>, which drops SCR<sub>1</sub>'s gate voltage: charging stops. C<sub>1</sub> stops transients firing SCR<sub>2</sub>.</p></div><div class="tile"><h3>Heater control</h3><p>A mercury thermostat can only carry &lt; 1 mA. It shorts the gate capacitor when hot, so the SCR stops firing the 100 W heater: the SCR switches what the thermostat can't.</p></div><div class="tile"><h3>Emergency light</h3><p>Mains on: the SCR is reverse-biased and the battery trickle-charges. Mains off: a capacitor discharges, the gate goes positive, the SCR connects the battery to the lamp.</p></div></div>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does phase control vary the power to a load?", model: "The SCR blocks each half-cycle until its gate fires it, then conducts for the rest of that half-cycle. Firing later cuts off more of the waveform, so the load gets less of each cycle and less average power. The firing point is set by how quickly the gate circuit reaches the trigger current." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "SCS, GTO and LASCR", mins: 20,
    blurb: "Variations on the SCR: a second gate, gate turn-off, and light triggering.",
    takeaway: "SCS (silicon-controlled switch): all four layers brought out; anode gate as well as cathode gate. At the anode gate a negative pulse turns it on, a positive pulse off (the reverse at the cathode gate). Turn-off 1–10 µs (SCR 5–30 µs); more sensitive, more predictable; but low power (100–300 mA, 100–500 mW). Uses: counters, registers, timing, voltage sensors, alarm circuits (a resistor at the gate guards against the rate effect, false triggering by fast transients through stray capacitance). GTO (gate turn-off switch): one gate that turns it on and off; needs more gate current (e.g. 20 mA vs 30 µA for a comparable SCR); turn-off ≈ 1 µs, like its turn-on; up to about 3 A, 20 W; sawtooth generator. LASCR (light-activated SCR): light on a silicon layer triggers it (a gate lead too); hotter needs less light; about 3 A, 0.1 W gate; AND/OR optical logic, isolated latching relay; most sensitive with the gate open (a gate resistor reduces sensitivity).",
    steps: [
      { k: "learn", title: "Three cousins", b: [
        fig(layersFig(2)),
        `<div class="two"><div class="tile"><h3>SCS</h3><p>Anode gate too. Anode gate: − pulse on, + pulse off. Faster turn-off (1–10 µs) but low power.</p></div><div class="tile"><h3>GTO</h3><p>Turn on <b>and off</b> from the one gate. Needs much more gate current. Turn-off ≈ 1 µs.</p></div><div class="tile"><h3>LASCR</h3><p>Fired by light. Isolation between control and load. Hotter = more sensitive.</p></div></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which device?", bins: ["SCS", "GTO", "LASCR"], items: [
          ["Has an anode gate as well as a cathode gate", 0, "All four layers accessible."],
          ["Turned off by a pulse on its only gate", 1, "Gate turn-off."],
          ["Two in series make an optical AND gate", 2, "Both must be lit."],
          ["Replaces a relay with no contact bounce", 2, "Isolated latching relay."],
        ]},
        { t: "mcq", q: "What's the price of the GTO's gate turn-off ability?", opts: [["A much larger gate current to trigger it", true, "About 20 mA against tens of microamps for an SCR."], ["Slower switching", false, "It's faster to turn off."], ["It can't block reverse voltage", false, "Not the point here."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a positive pulse on an SCS's anode gate turn it off?", model: "The anode gate connects to the base of the pnp transistor in the two-transistor model. A positive pulse reverse-biases that transistor's base-emitter junction, turning it off, which breaks the regenerative loop, so the whole device turns off." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Shockley diode, diac and triac", mins: 25,
    blurb: "No gate: fire at breakover. Both directions: the diac. Both directions with a gate: the triac.",
    takeaway: "Shockley diode: pnpn with two terminals; behaves like an SCR with I_G = 0: off until the breakover voltage, then on. Use: a trigger switch for an SCR (a capacitor charges until the Shockley diode breaks over and fires the SCR). Diac: two terminals (anode 1, anode 2), layers arranged so it breaks over in either direction; V_BR1 = V_BR2 ± 0.1V_BR2 (e.g. 28–42 V); I_BR ≈ 0.2 mA. Triac: a diac with a gate that controls turn-on in either direction, with a holding current each way. Diac + triac phase control: an RC network charges each half-cycle until the diac fires and triggers the triac; both polarities work, so it controls full-wave ac power (units above 10 kW). Proximity (touch) switch: body capacitance shifts the phase of a PUT's gate voltage so it fires and triggers an SCR.",
    steps: [
      { k: "learn", title: "Breakover devices", b: [
        `<div class="two"><div class="tile"><h3>Shockley diode</h3><p>An SCR with no gate. Off until V<sub>BR</sub>, then on.</p></div><div class="tile"><h3>Diac</h3><p>Breaks over in <b>either</b> direction. No cathode: anode 1 and anode 2.</p><div class="eq">V<sub>BR1</sub> = V<sub>BR2</sub> ± 0.1V<sub>BR2</sub></div></div><div class="tile"><h3>Triac</h3><p>A diac with a gate: triggered in either direction. Holding current each way.</p></div></div>`,
        `<p class="aside">The proximity-detector discussion says the PUT is "described in Section 17.12"; it's Section 17.15.</p>`,
      ]},
      { k: "play", title: "Full-wave power control", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let a = 60;
          function draw() {
            const ar = (a * PI) / 180, load = (t) => { const th = (TAU * t) % PI; return th >= ar ? Math.sin(TAU * t) : 0; };
            f.innerHTML = plot({ x: [0, 2], y: [-1.2, 1.2], xt: [0, 0.5, 1, 1.5, 2], yt: [-1, 0, 1], xl: "time (cycles)", h: 210, series: [{ f: (t) => Math.sin(TAU * t), cls: "s5" }, { f: load, cls: "s1", n: 1500 }], label: "Triac load voltage: both half-cycles trimmed at the firing angle" });
            ro.innerHTML = readout([["Firing angle (each half-cycle)", a + "°"], ["Power vs. full sine", fmt(100 * halfPow(ar), 3) + "%"]]);
          }
          host.append(f, slider({ id: id + "-a", label: "Firing angle (set by R in the diac's RC network)", min: 0, max: 170, step: 1, value: a, show: (v) => v + "°" }, (v) => { a = v; draw(); }).el, ro);
          draw();
        },
        `<p>The capacitor's voltage lags the line, so the diac fires later in each half-cycle as R grows, on positive and negative halves alike. This is a lamp dimmer.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A diac has V_BR2 = 32 V. Lowest V_BR1 the spec allows?", a: 28.8, unit: "V", tol: 0.01, hint: "V_BR2 − 0.1V_BR2.", why: "28.8 V (and up to 35.2 V)." },
        { t: "mcq", q: "Why use a triac rather than an SCR to dim a lamp on ac?", opts: [["It conducts on both half-cycles", true, "An SCR would only handle the positive halves."], ["It doesn't need a gate", false, "It does: the diac triggers it."], ["It turns off from its gate", false, "Like an SCR, it turns off when the current falls."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do a diac and a triac work together in a dimmer?", model: "An RC network charges from the ac line each half-cycle. When the capacitor voltage reaches the diac's breakover voltage, the diac fires and dumps a pulse into the triac's gate, turning the triac on for the rest of that half-cycle. Both devices work in either direction, so this happens on both halves. Changing R changes how late the firing happens and so how much power reaches the lamp." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  function ujtFig() {
    let s = `<rect x="200" y="40" width="40" height="160" rx="6" style="fill:var(--cool-soft);stroke:var(--line)"/>` + S.t(220, 125, "n", { cls: "big" });
    s += S.wire([220, 40], [220, 15]) + S.t(230, 20, "B2", { a: "start", cls: "s" }) + S.wire([220, 200], [220, 225]) + S.t(230, 225, "B1", { a: "start", cls: "s" });
    s += `<rect x="240" y="70" width="18" height="24" style="fill:var(--accent-soft);stroke:var(--line)"/>` + S.t(249, 87, "p", { cls: "s" }) + S.wire([258, 82], [320, 82]) + S.t(326, 87, "E (aluminium rod)", { a: "start", cls: "s" });
    s += S.t(190, 82, "R_B2", { a: "end", cls: "c s" }) + S.t(190, 160, "R_B1", { a: "end", cls: "c s" }) + `<line class="w" x1="196" y1="96" x2="210" y2="96" style="stroke-dasharray:3 3"/>`;
    return S.svg(460, 235, s, { max: 460, label: "Unijunction transistor: an n-type bar with two base contacts and one p-type emitter near base 2" });
  }
  const p6 = {
    id: "p6", title: "The unijunction transistor (UJT)", mins: 25,
    blurb: "One junction on a resistive bar. Fire when the emitter beats a fraction of V_BB.",
    takeaway: "UJT: a lightly doped (resistive) n-type silicon bar with base contacts B1 and B2 at the ends and an aluminium (p) emitter rod nearer B2: one p–n junction. Model: R_B2 above the junction, a diode to the emitter, and R_B1 below (variable: it falls from ~5 kΩ to ~50 Ω as I_E rises from 0 to 50 mA). Interbase resistance R_BB = (R_B1 + R_B2) at I_E = 0, typically 4–10 kΩ. Intrinsic stand-off ratio η = R_B1/R_BB, so V_RB1 = ηV_BB. Fires when V_E reaches V_P = ηV_BB + V_D (V_D ≈ 0.35–0.7 V). Characteristic: cutoff (only I_EO, µA) up to the peak point (V_P, I_P); then a stable negative-resistance region (injected holes raise the bar's conductivity) down to the valley point (V_V, I_V); then saturation like a diode. V_P rises with V_BB.",
    steps: [
      { k: "learn", title: "A bar with a tap", b: [
        fig(ujtFig()),
        `<div class="eq">R<sub>BB</sub> = R<sub>B1</sub> + R<sub>B2</sub> (I<sub>E</sub> = 0)    η = R<sub>B1</sub>/R<sub>BB</sub>    V<sub>P</sub> = ηV<sub>BB</sub> + V<sub>D</sub></div>`,
        `<p>With no emitter current the bar is a voltage divider: the junction sees ηV<sub>BB</sub> on its n side. Raise the emitter a diode drop above that and it fires.</p>`,
        `<p class="aside">Chapter 14's unijunction oscillator prints V<sub>P</sub> = ηV<sub>BB</sub> − V<sub>D</sub>; it's + V<sub>D</sub>, as in Eq. (17.5) here.</p>`,
      ]},
      { k: "play", title: "The emitter characteristic", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let VBB = 15; const eta = 0.65, VD = 0.7;
          function draw() {
            const VP = eta * VBB + VD, VV = 1.5, IV = 8, curve = (i) => (i < 0.02 ? VP * (i / 0.02) * 0.98 + 0.02 * VP : i < IV ? VP - (VP - VV) * Math.pow((i - 0.02) / (IV - 0.02), 0.5) : VV + 0.08 * (i - IV));
            f.innerHTML = plot({ x: [0, 20], y: [0, 16], xt: [0, 5, 8, 10, 15, 20], yt: [0, VV, 5, 10, 15], ytf: (v) => fmt(v, 3), xl: "I_E (mA)", yl: "V_E (V)", h: 230, series: [{ f: curve, cls: "s1", n: 600 }], marks: [{ x: 0.02, y: VP, label: "peak" }, { x: IV, y: VV, cls: "mk2", label: "valley" }], label: "UJT emitter characteristic with peak and valley points" });
            ro.innerHTML = readout([["V<sub>P</sub> = ηV<sub>BB</sub> + V<sub>D</sub> (η = 0.65)", V(VP)], ["Region between peak and valley", "negative resistance"]]);
          }
          host.append(f, slider({ id: id + "-v", label: "V_BB", min: 5, max: 20, step: 0.5, value: VBB, show: (v) => v + " V" }, (v) => { VBB = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">Illustrative curve. Past the peak, more emitter current means lower emitter voltage: the injected holes make R<sub>B1</sub> collapse.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>R<sub>BB</sub> = 8 kΩ, η = 0.65, V<sub>BB</sub> = 15 V, V<sub>D</sub> = 0.7 V.</p>`,
        { t: "num", q: "R_B1?", a: 5.2, unit: "kΩ", tol: 0.01, hint: "ηR_BB.", why: "5.2 kΩ (R_B2 = 2.8 kΩ)." },
        { t: "num", q: "V_P?", a: 10.45, unit: "V", tol: 0.01, hint: "ηV_BB + V_D.", why: "9.75 + 0.7 = 10.45 V." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a UJT show negative resistance after it fires?", model: "Once the emitter junction conducts, it injects holes into the n-type bar between the emitter and base 1. Those holes increase the number of carriers there, so R_B1 drops sharply. As emitter current rises, R_B1 falls faster than the current grows, so the emitter voltage goes down: negative resistance." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "UJT relaxation oscillator and SCR trigger", mins: 30,
    blurb: "Charge a capacitor through R₁ until the UJT fires; dump it through R_B1 and R₂. Pulses for an SCR's gate.",
    takeaway: "R₁ must put the load line in the negative-resistance region: (V − V_V)/I_V < R₁ < (V − V_P)/I_P (lower bound so it turns off, upper so it can fire). R₂ small enough that V_R2 = R₂V/(R₂ + R_BB) (while I_E = 0) doesn't fire the SCR. Charging from V_V toward V with τ = R₁C: v_C = V_V + (V − V_V)(1 − e^(−t/R₁C)); fires at V_P after t₁ = R₁C ln[(V − V_V)/(V − V_P)]. Discharge through R_B1 + R₂: v_C ≈ V_Pe^(−t/(R_B1+R₂)C), back to V_V after t₂ = (R_B1 + R₂)C ln(V_P/V_V). T = t₁ + t₂, f = 1/T. Peak pulse on R₂ ≈ R₂(V_P − 0.7)/(R₂ + R_B1). Usually t₁ ≫ t₂ and V ≫ V_V, giving f ≈ 1/[R₁C ln(1/(1 − η))].",
    steps: [
      { k: "play", title: "Oscillator lab", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let R1 = 68e3, C = 0.047e-6; const Vs = 15, VV = 1.2, IV = 8e-3, IP = 5e-6, RBB = 8e3, eta = 0.65, R2 = 150, RB1d = 80;
          function draw() {
            const VP = 0.7 + ((eta * RBB + R2) * Vs) / (RBB + R2), t1 = R1 * C * Math.log((Vs - VV) / (Vs - VP)), t2 = (RB1d + R2) * C * Math.log(VP / VV), T = t1 + t2;
            const lo = (Vs - VV) / IV, hi = (Vs - VP) / IP, ok = R1 > lo && R1 < hi;
            const vc = (t) => { const u = t % T; return u < t1 ? VV + (Vs - VV) * (1 - Math.exp(-u / (R1 * C))) : VP * Math.exp(-(u - t1) / ((RB1d + R2) * C)); };
            f.innerHTML = plot({ x: [0, 3 * T], y: [0, 16], xt: [0, T, 2 * T, 3 * T], xtf: (v) => si(v, "s", 2), yt: [0, VV, VP, Vs], ytf: (v) => fmt(v, 3), xl: "t", yl: "v_C (V)", h: 230, series: [{ f: ok ? vc : () => VV + (Vs - VV) * 0.999, cls: "s1", n: 2000 }], label: "UJT relaxation oscillator capacitor voltage" });
            ro.innerHTML = readout([["V<sub>P</sub>", V(VP)], ["Allowed R<sub>1</sub>", ohm(lo) + " to " + ohm(hi) + (ok ? " ✓" : " ✗ won't oscillate")], ["t<sub>1</sub> (charge)", si(t1, "s", 4)], ["t<sub>2</sub> (discharge)", si(t2, "s", 3)], ["f = 1/(t<sub>1</sub> + t<sub>2</sub>)", hz(1 / T)]]);
          }
          host.append(f, slider({ id: id + "-r", label: "R_1", min: 500, max: 2e6, log: true, value: R1, show: ohm }, (v) => { R1 = v; draw(); }).el,
            slider({ id: id + "-c", label: "C", min: 1e-9, max: 1e-6, log: true, value: C, show: (v) => si(v, "F") }, (v) => { C = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">V = 15 V, R<sub>BB</sub> = 8 kΩ, η = 0.65, R<sub>2</sub> = 150 Ω, V<sub>V</sub> = 1.2 V, I<sub>V</sub> = 8 mA, I<sub>P</sub> = 5 µA, R<sub>B1</sub> = 80 Ω while discharging. V<sub>P</sub> here includes R<sub>2</sub> in the divider, as the book's example does.</p>`,
      ]},
      { k: "learn", title: "The equations", b: [
        `<div class="eq">(V − V<sub>V</sub>)/I<sub>V</sub> &lt; R<sub>1</sub> &lt; (V − V<sub>P</sub>)/I<sub>P</sub></div>`,
        `<div class="eq">t<sub>1</sub> = R<sub>1</sub>C ln[(V − V<sub>V</sub>)/(V − V<sub>P</sub>)]    t<sub>2</sub> = (R<sub>B1</sub> + R<sub>2</sub>)C ln(V<sub>P</sub>/V<sub>V</sub>)    f ≈ 1/[R<sub>1</sub>C ln(1/(1 − η))]</div>`,
        `<div class="eq">V<sub>R2</sub> (charging) = R<sub>2</sub>V/(R<sub>2</sub> + R<sub>BB</sub>)    V<sub>R2</sub> (peak) ≈ R<sub>2</sub>(V<sub>P</sub> − 0.7)/(R<sub>2</sub> + R<sub>B1</sub>)</div>`,
        seen("RC charging toward a final value: v = final + (initial − final)e^(−t/RC).", "10-first-order-transients.html#p4", "Chapter 10, Part 4"),
        ch(14, "14-feedback-oscillators.html", "p10", "Part 10", "The same oscillator from the oscillator chapter."),
      ]},
      { k: "check", title: "Your turn", b: [
        `<p>Same values: R<sub>1</sub> = 68 kΩ, C = 0.047 µF, V<sub>P</sub> = 10.55 V.</p>`,
        { t: "num", q: "t₁?", a: 3.615, unit: "ms", tol: 0.01, hint: "R₁C ln[(15 − 1.2)/(15 − 10.55)].", why: "3.196 ms × 1.131 = 3.61 ms." },
        { t: "num", q: "Frequency (with t₂ = 23.5 µs)?", a: 274.9, unit: "Hz", tol: 0.01, hint: "1/(t₁ + t₂).", why: "275 Hz. The η shortcut says 298 Hz (it ignores V_V and V_D)." },
        { t: "num", q: "Peak pulse across R₂ when it fires?", a: 6.422, unit: "V", tol: 0.01, hint: "R₂(V_P − 0.7)/(R₂ + R_B1), R_B1 = 80 Ω.", why: "6.42 V: plenty to fire an SCR, while the 0.28 V during charging won't." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must R_1 be neither too large nor too small in a UJT oscillator?", model: "If R_1 is too large, it can't supply the peak-point current when the capacitor reaches V_P, so the UJT never fires. If it's too small, it supplies more than the valley current after firing, so the UJT stays on instead of turning off and letting the capacitor recharge. Between those limits the load line crosses only the negative-resistance region, and the circuit oscillates." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Phototransistors and opto-isolators", mins: 20,
    blurb: "Light as the base current. An LED and a detector in one package, with no wire between.",
    takeaway: "Phototransistor: a light-sensitive collector–base junction; the photo-induced current I_λ acts as base current, so I_C ≈ h_feI_λ; collector curves look like a BJT's with light intensity in place of base current. Uses: logic, lighting control, level indication, relays, counters; LED–phototransistor pairs make a high-isolation AND gate. Opto-isolator: an IR LED and a photodetector (photodiode, phototransistor, photo-Darlington or photo-SCR) in one package, matched in wavelength, with a transparent insulator between: no electrical connection. Typical (6-pin): LED 1.3 V at 60 mA, detector I_CEO a few nA, dc current transfer ratio 0.2–0.35, isolation 2500 V, 100 GΩ and 0.5 pF input to output, delays a few µs; switching gets faster with more current; output fairly flat with temperature above 25 °C.",
    steps: [
      { k: "learn", title: "Light in place of base current", b: [
        `<div class="eq">I<sub>C</sub> ≈ h<sub>fe</sub>I<sub>λ</sub></div>`,
        fig(plot({ x: [0, 20], y: [0, 10], xt: [0, 5, 10, 15, 20], yt: [0, 5, 10], xl: "V_CE (V)", yl: "I_C (mA)", h: 210, series: [1, 2, 3, 4].map((k) => ({ f: (v) => 2.2 * k * (1 - Math.exp(-v / 0.6)) * (1 + 0.01 * v), cls: k === 4 ? "s1" : "s5" })), texts: [{ x: 14, y: 9.4, s: "brighter" }, { x: 14, y: 2.6, s: "dimmer" }], label: "Phototransistor collector curves for increasing light" })),
        ch(3, "03-bjts.html", "p5", "Part 5", "The same family of curves, with I<sub>B</sub> as the parameter."),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A phototransistor with h_fe = 150 gets I_λ = 20 µA from the light. I_C?", a: 3, unit: "mA", tol: 0.01, hint: "h_feI_λ.", why: "3 mA." },
        { t: "num", q: "Opto-isolator with a current transfer ratio of 0.35, LED driven at 16 mA. Output current?", a: 5.6, unit: "mA", tol: 0.01, hint: "CTR × I_F.", why: "5.6 mA." },
        { t: "mcq", q: "What makes an opto-isolator useful between a microcontroller and a mains circuit?", opts: [["2500 V of isolation and 100 GΩ: no electrical path", true, "Only light crosses the gap."], ["It amplifies the signal a lot", false, "Its transfer ratio is below 1."], ["It's faster than a wire", false, "Delays are microseconds."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the opto-isolator's output current smaller than its input current, and why doesn't that matter?", model: "Only a fraction of the LED's light reaches the detector, and the detector converts it with limited efficiency, so the current transfer ratio is typically 0.2 to 0.35. That's fine because the point is isolation: the output just needs to be big enough to switch the next stage, and the input and output circuits share no electrical connection." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "The programmable UJT (PUT)", mins: 25,
    blurb: "A pnpn device that acts like a UJT, but you choose η with two external resistors.",
    takeaway: "PUT: four-layer pnpn with the gate on the n layer next to the anode; its symbol is like an SCR's. External R_B1, R_B2 set the gate voltage: V_G = [R_B1/(R_B1 + R_B2)]V_BB = ηV_BB, so η, R_BB and V_P are programmable. It fires when the anode is a diode drop above the gate: V_P = ηV_BB + V_D = V_G + 0.7 V (Si). Off state below V_P; unstable negative-resistance region; on state (I ≥ I_V, V ≈ V_V). Removing V_G won't turn it off: the anode current must fall below holding. Thévenin at the gate: R_S = R_B1R_B2/(R_B1 + R_B2) (affects I_V). PUTs have lower peak and valley currents and minimum voltages than UJTs. Relaxation oscillator: R_max = (V_BB − V_P)/I_P, R_min = (V_BB − V_V)/I_V, R_min < R < R_max; T ≈ RC ln[V_BB/(V_BB − V_P)] ≈ RC ln(1 + R_B1/R_B2).",
    steps: [
      { k: "learn", title: "Programming the peak voltage", b: [
        `<div class="eq">V<sub>G</sub> = ηV<sub>BB</sub>, η = R<sub>B1</sub>/(R<sub>B1</sub> + R<sub>B2</sub>)    V<sub>P</sub> = V<sub>G</sub> + 0.7 V    R<sub>S</sub> = R<sub>B1</sub> ∥ R<sub>B2</sub></div>`,
        `<p>In a UJT, η is fixed inside the bar. In a PUT, R<sub>B1</sub> and R<sub>B2</sub> are your own resistors, so you pick η. The PUT fires when its anode climbs 0.7 V above its gate.</p>`,
        `<p class="aside">Example 17.2 writes η = R<sub>B2</sub>/(R<sub>B1</sub> + R<sub>B2</sub>) but then solves with R<sub>B1</sub> on top (correctly).</p>`,
      ]},
      { k: "play", title: "PUT oscillator", b: [
        (host, id) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let R = 47e3, C = 0.22e-6; const VBB = 15, RB1 = 12e3, RB2 = 6e3, IP = 50e-6, VV = 1, IV = 4e-3;
          function draw() {
            const VG = (RB1 / (RB1 + RB2)) * VBB, VP = VG + 0.7, Rmax = (VBB - VP) / IP, Rmin = (VBB - VV) / IV, ok = R > Rmin && R < Rmax, T = R * C * Math.log(VBB / (VBB - VP));
            const va = (t) => { const u = t % T; return VV * 0 + VBB * (1 - Math.exp(-u / (R * C))); };
            f.innerHTML = plot({ x: [0, 3 * T], y: [0, 16], xt: [0, T, 2 * T, 3 * T], xtf: (v) => si(v, "s", 2), yt: [0, VP, VBB], ytf: (v) => fmt(v, 3), xl: "t", yl: "v_A (V)", h: 220, series: [{ f: ok ? va : (t) => VBB * (1 - Math.exp(-t / (R * C))), cls: "s1", n: 1500 }, { f: () => VP, cls: "s5" }], label: "PUT anode voltage ramping to V_P and dropping" });
            ro.innerHTML = readout([["V<sub>G</sub> = ηV<sub>BB</sub>", V(VG)], ["V<sub>P</sub>", V(VP)], ["R<sub>min</sub> to R<sub>max</sub>", ohm(Rmin) + " to " + ohm(Rmax) + (ok ? " ✓" : " ✗ no oscillation")], ["T ≈ RC ln[V<sub>BB</sub>/(V<sub>BB</sub> − V<sub>P</sub>)]", si(T, "s", 4)], ["f", hz(1 / T)]]);
          }
          host.append(f, slider({ id: id + "-r", label: "R (charging)", min: 1e3, max: 200e3, log: true, value: R, show: ohm }, (v) => { R = v; draw(); }).el,
            slider({ id: id + "-c", label: "C", min: 1e-9, max: 10e-6, log: true, value: C, show: (v) => si(v, "F") }, (v) => { C = v; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">V<sub>BB</sub> = 15 V, R<sub>B1</sub> = 12 kΩ, R<sub>B2</sub> = 6 kΩ, I<sub>P</sub> = 50 µA, V<sub>V</sub> = 1 V, I<sub>V</sub> = 4 mA. Push R past R<sub>max</sub> and it can't supply I<sub>P</sub>: no firing.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Same PUT: V_P?", a: 10.7, unit: "V", tol: 0.01, hint: "V_G = (12/18)(15 V).", why: "10 + 0.7 = 10.7 V." },
        { t: "num", q: "R_max?", a: 86, unit: "kΩ", tol: 0.01, hint: "(V_BB − V_P)/I_P.", why: "4.3 V/50 µA = 86 kΩ." },
        { t: "num", q: "With R = 47 kΩ and C = 0.22 µF, frequency?", a: 77.4, unit: "Hz", tol: 0.01, hint: "T = RC ln(15/4.3).", why: "T = 12.9 ms, f = 77.4 Hz." },
        { t: "num", q: "Design: you want η = 0.75 with R_B2 = 4 kΩ. R_B1?", a: 12, unit: "kΩ", tol: 0.01, hint: "R_B1/(R_B1 + 4k) = 0.75.", why: "12 kΩ." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does 'programmable' mean in programmable unijunction transistor?", model: "That the firing voltage is set by the user. Two external resistors form a divider that sets the gate voltage, eta times V_BB, and the PUT fires when the anode rises a diode drop above that. In an ordinary UJT, eta is fixed by the device's construction." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "edc17", eyebrow: "Boylestad · Chapter 17", title: "pnpn and Other Devices",
    intro: `<p>Nine parts: the SCR (how it latches, its ratings, its applications), the SCS, GTO and LASCR, the Shockley diode, diac and triac, the unijunction transistor and its oscillator, phototransistors and opto-isolators, and the programmable UJT.</p><p>The last chapter: devices that switch large power or make timing pulses.</p><p class="aside">Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's problems in the book. They test whether the ideas stuck, so don't expect them to look like the examples here.</p><p>Stuck? Tell Claude which problem and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9],
    summary: `
      <h3>Thyristors</h3>
      <p>SCR: gate pulse turns on, latches; off only by interrupting or reversing the anode current. More gate current → lower breakover. I<sub>H</sub>: holding current. SCS: anode gate (− on, + off). GTO: gate turns it on and off. LASCR: light-triggered. Shockley diode: no gate. Diac: breaks over both ways, V<sub>BR1</sub> = V<sub>BR2</sub> ± 0.1V<sub>BR2</sub>. Triac: diac with a gate.</p>
      <div class="eq">Half-wave phase control (resistive load): P(α)/P(0) = [(π − α) + ½ sin 2α]/π</div>
      <h3>UJT</h3>
      <div class="eq">R<sub>BB</sub> = R<sub>B1</sub> + R<sub>B2</sub>    η = R<sub>B1</sub>/R<sub>BB</sub>    V<sub>P</sub> = ηV<sub>BB</sub> + V<sub>D</sub>    (V − V<sub>V</sub>)/I<sub>V</sub> &lt; R<sub>1</sub> &lt; (V − V<sub>P</sub>)/I<sub>P</sub></div>
      <div class="eq">t<sub>1</sub> = R<sub>1</sub>C ln[(V − V<sub>V</sub>)/(V − V<sub>P</sub>)]    t<sub>2</sub> = (R<sub>B1</sub> + R<sub>2</sub>)C ln(V<sub>P</sub>/V<sub>V</sub>)    f ≈ 1/[R<sub>1</sub>C ln(1/(1 − η))]</div>
      <h3>Light</h3>
      <div class="eq">Phototransistor I<sub>C</sub> ≈ h<sub>fe</sub>I<sub>λ</sub>    opto-isolator I<sub>out</sub> = CTR × I<sub>F</sub></div>
      <h3>PUT</h3>
      <div class="eq">V<sub>G</sub> = ηV<sub>BB</sub>    V<sub>P</sub> = V<sub>G</sub> + 0.7 V    R<sub>max</sub> = (V<sub>BB</sub> − V<sub>P</sub>)/I<sub>P</sub>    R<sub>min</sub> = (V<sub>BB</sub> − V<sub>V</sub>)/I<sub>V</sub>    T ≈ RC ln[V<sub>BB</sub>/(V<sub>BB</sub> − V<sub>P</sub>)]</div>`,
  };
  Course.start(window.CHAPTER);
})();
