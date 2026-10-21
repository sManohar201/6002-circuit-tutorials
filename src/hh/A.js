(function () {
  const { S, plot, slider, toggle, readout, fmt, si, el } = Course;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const seenHH = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const seenV = (html, href, where) => `<div class="key"><b>Seen in CMOS VLSI Design:</b> ${html} <a href="../vlsi/${href}">${where} →</a></div>`;
  const seen6 = (html, href, where) => `<div class="key"><b>Seen in 6.002:</b> ${html} <a href="../chapters/${href}">${where} →</a></div>`;
  const fig = (s) => `<div class="fig">${s}</div>`;
  const money = (x) => "$" + Math.round(x).toLocaleString("en-US");

  /* ---------- 14-pin DIP pinouts (Figure A.1) ---------- */
  const QUAD = ["1A", "1B", "1Y", "2A", "2B", "2Y", "GND", "3Y", "3A", "3B", "4Y", "4A", "4B", "VDD"];
  const CHIPS = [
    { name: "7400 NAND", pins: QUAD },
    { name: "7402 NOR", pins: ["1Y", "1A", "1B", "2Y", "2A", "2B", "GND", "3A", "3B", "3Y", "4A", "4B", "4Y", "VDD"] },
    { name: "7404 NOT", pins: ["1A", "1Y", "2A", "2Y", "3A", "3Y", "GND", "4Y", "4A", "5Y", "5A", "6Y", "6A", "VDD"] },
    { name: "7408 AND", pins: QUAD },
    { name: "7432 OR", pins: QUAD },
  ];
  const GCOL = ["var(--accent-soft)", "var(--cool-soft)", "var(--good-soft)", "var(--bad-soft)", "var(--accent-soft)", "var(--cool-soft)"];
  function dip(c) {
    const W = 360, H = 270, bx = 130, bw = 100, top = 20, pitch = 32;
    let s = `<rect class="box" x="${bx}" y="${top}" width="${bw}" height="${7 * pitch + 10}" rx="6"/><path class="w" d="M${bx + bw / 2 - 12},${top} a12,12 0 0 0 24,0"/>` + S.t(bx + bw / 2, top + 7 * pitch / 2 + 10, c.name.split(" ")[0]) + S.t(bx + bw / 2, top + 7 * pitch / 2 + 30, c.name.split(" ")[1], { cls: "lab" });
    c.pins.forEach((p, i) => {
      const left = i < 7, row = left ? i : 13 - i, y = top + 20 + row * pitch;
      const x0 = left ? bx - 24 : bx + bw, g = /^\d/.test(p) ? +p[0] - 1 : -1;
      const fill = p === "VDD" ? "var(--bad-soft)" : p === "GND" ? "var(--line)" : GCOL[g];
      s += `<rect x="${x0}" y="${y - 9}" width="24" height="18" rx="3" style="fill:${fill};stroke:var(--ink);stroke-width:1"/>` + S.t(x0 + 12, y + 5, String(i + 1), { cls: "lab" });
      s += S.t(left ? x0 - 8 : x0 + 32, y + 5, p, { a: left ? "end" : "start" });
    });
    return S.svg(W, H, s, { max: 380, label: `${c.name} pinout, 14-pin DIP, top view` });
  }
  function pinout(host) {
    const out = el(`<div></div>`);
    const draw = (i) => { out.innerHTML = fig(dip(CHIPS[i])) + `<p class="aside">Top view. Pin 1 is next to the notch; numbering runs down the left side and back up the right. Same colour = same gate.</p>`; };
    host.append(toggle(CHIPS.map((c) => c.name), draw, 0), out); draw(0);
  }

  /* ---------- 7474 flop with active-low preset and clear ---------- */
  function flop7474(host) {
    let pre = 1, clr = 1, d = 0, q = 0;
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`);
    const mk = (lab, get, set) => { const b = btn(""); const show = () => { b.textContent = `${lab} = ${get()}`; }; b.addEventListener("click", () => { set(1 - get()); show(); draw(); }); show(); return b; };
    const clk = btn("Clock edge ↑", "primary");
    const draw = () => {
      if (!pre && !clr) { out.innerHTML = readout([["Q", "1"], ["Q̄", "1"], ["State", "both asserted: Q and Q̄ are both HIGH, which is not a legal flop state. Never do this."]]); return; }
      if (!pre) q = 1; else if (!clr) q = 0;
      out.innerHTML = readout([["Q", q], ["Q̄", 1 - q], ["State", !pre ? "PRE̅ = 0: forced to 1 right now, no clock needed" : !clr ? "CLR̅ = 0: forced to 0 right now, no clock needed" : "PRE̅ = CLR̅ = 1: normal flop, Q changes only on a rising clock edge"]]);
    };
    clk.addEventListener("click", () => { if (pre && clr) q = d; draw(); });
    row.append(mk("PRE̅", () => pre, (v) => (pre = v)), mk("CLR̅", () => clr, (v) => (clr = v)), mk("D", () => d, (v) => (d = v)), clk);
    host.append(row, out); draw();
  }

  /* ---------- 74138 3:8 decoder ---------- */
  function dec138(host) {
    const v = { G1: 1, G2A: 0, G2B: 0, A2: 0, A1: 0, A0: 0 };
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`);
    Object.keys(v).forEach((k) => { const b = btn(""); const show = () => { b.textContent = `${k} = ${v[k]}`; }; b.addEventListener("click", () => { v[k] ^= 1; show(); draw(); }); show(); row.append(b); });
    const draw = () => {
      const en = v.G1 && !v.G2A && !v.G2B, a = v.A2 * 4 + v.A1 * 2 + v.A0;
      const ys = Array.from({ length: 8 }, (_, i) => (en && i === a ? 0 : 1));
      out.innerHTML = `<div class="tbl"><table style="text-align:center;font-family:var(--mono)"><thead><tr>${ys.map((_, i) => `<th>Y${7 - i}̅</th>`).join("")}</tr></thead><tbody><tr>${ys.slice().reverse().map((y) => `<td style="${y ? "" : "background:var(--accent-soft);font-weight:700"}">${y}</td>`).join("")}</tr></tbody></table></div>` +
        `<p>${en ? `Enabled. Address ${a} pulls output Y${a}̅ <b>LOW</b>; the other seven stay HIGH.` : "Disabled: every output is HIGH (inactive). It needs G1 = 1 <i>and</i> G2A = G2B = 0."}</p>`;
    };
    host.append(row, out); draw();
  }

  /* ---------- FPGA timing (Table A.1) ---------- */
  function fpgaTiming(host) {
    let f = 100e6;
    const T = { pcq: 199, setup: 76, le: 381, wire: 246 };
    const out = el(`<div></div>`);
    const draw = () => {
      const Tc = 1e12 / f, budget = Tc - T.pcq - T.setup, n = Math.floor(budget / (T.le + T.wire));
      const W = 460, H = 70, sc = (W - 20) / Tc;
      let s = `<rect x="10" y="20" width="${T.pcq * sc}" height="24" style="fill:var(--cool-soft);stroke:var(--ink)"/>`;
      let x = 10 + T.pcq * sc;
      for (let i = 0; i < Math.max(0, n); i++) { s += `<rect x="${x}" y="20" width="${T.le * sc}" height="24" style="fill:var(--accent-soft);stroke:var(--ink)"/><rect x="${x + T.le * sc}" y="20" width="${T.wire * sc}" height="24" style="fill:var(--good-soft);stroke:var(--ink)"/>`; x += (T.le + T.wire) * sc; }
      s += `<rect x="${10 + (Tc - T.setup) * sc}" y="20" width="${T.setup * sc}" height="24" style="fill:var(--bad-soft);stroke:var(--ink)"/>` + S.t(10, 14, "one clock cycle, T_c = " + fmt(Tc / 1000, 3) + " ns", { a: "start", cls: "lab" });
      out.innerHTML = fig(S.svg(W, H, s, { max: 460, label: "Clock cycle filled with LE and wire delays" })) +
        `<p class="aside">Blue t<sub>pcq</sub> · orange LE · green wire · red t<sub>setup</sub></p>` +
        readout([["Cycle time T<sub>c</sub>", fmt(Tc / 1000, 3) + " ns"], ["Left for logic: T<sub>c</sub> − t<sub>pcq</sub> − t<sub>setup</sub>", fmt(budget / 1000, 3) + " ns"], ["LE + wire per level", "381 + 246 = 627 ps"], ["Most LEs in a row", n >= 1 ? n : "0: too fast even for one LE"]]);
    };
    host.append(slider({ id: "hAf", label: "Target clock", min: 50e6, max: 2e9, log: true, value: f, show: (x) => si(x, "Hz", 3) }, (x) => { f = x; draw(); }).el, out); draw();
  }

  /* ---------- data sheet: part number builder ---------- */
  function partNo(host) {
    const pick = { pre: 1, fam: 2, fn: 1, pkg: 0 };
    const PRE = [["SN54", "military temperature range, −55 to 125 °C, costs more"], ["SN74", "commercial 0–70 °C or industrial −40–85 °C"]];
    const FAM = [["", "original TTL (obsolete)"], ["LS", "Low-power Schottky TTL"], ["HC", "High-speed CMOS"], ["HCT", "High-speed CMOS with TTL-compatible inputs"], ["AHC", "Advanced high-speed CMOS"]];
    const FN = [["00", "four 2-input NAND gates"], ["04", "six inverters (hex inverter)"], ["08", "four 2-input AND gates"], ["74", "two D flip-flops"], ["138", "3:8 decoder"]];
    const PKG = [["N", "plastic DIP: fits a breadboard"], ["D", "SOIC: small surface mount"], ["PW", "TSSOP: even smaller surface mount"]];
    const out = el(`<div></div>`);
    const draw = () => {
      const p = PRE[pick.pre], f = FAM[pick.fam], n = FN[pick.fn], k = PKG[pick.pkg];
      out.innerHTML = `<p class="mono" style="font-size:22px;text-align:center"><span style="background:var(--cool-soft)">${p[0]}</span><span style="background:var(--accent-soft)">${f[0]}</span><span style="background:var(--good-soft)">${n[0]}</span><span style="background:var(--bad-soft)">${k[0]}</span></p>` +
        readout([["Maker + temperature", p[1]], ["Logic family", f[1] + " (speed, power, levels)"], ["Function", n[1]], ["Package", k[1]]]);
    };
    const row = (lab, arr, key) => { const d = el(`<div><p class="aside" style="margin:0">${lab}</p></div>`); d.append(toggle(arr.map((a) => a[0] || "(none)"), (i) => { pick[key] = i; draw(); }, pick[key])); return d; };
    host.append(row("Prefix", PRE, "pre"), row("Family", FAM, "fam"), row("Function", FN, "fn"), row("Package suffix", PKG, "pkg"), out); draw();
  }

  /* ---------- junction temperature, EQ A.3 ---------- */
  function thermal(host) {
    let TA = 25, P = 0.5, th = 80;
    const PK = [["N (DIP)", 80], ["D (SOIC)", 86], ["NS (SOP)", 76], ["PW (TSSOP)", 131]];
    const out = el(`<div></div>`);
    const draw = () => {
      const TJ = TA + P * th;
      out.innerHTML = readout([["T<sub>J</sub> = T<sub>A</sub> + P·θ<sub>JA</sub>", `${fmt(TA, 3)} + ${fmt(P, 3)} × ${th} = <b>${fmt(TJ, 3)} °C</b>`], ["Rise above ambient", fmt(P * th, 3) + " °C"], ["Verdict", TJ > 150 ? "above the 150 °C storage maximum: the chip cooks" : TJ > 125 ? "hotter than even military parts are rated for" : TJ > 85 ? "too hot for a commercial/industrial 74xx part" : "fine"]]);
    };
    host.append(toggle(PK.map((p) => p[0]), (i) => { th = PK[i][1]; draw(); }, 0),
      slider({ id: "hAta", label: "Ambient T_A", min: 0, max: 85, step: 1, value: TA, show: (x) => x + " °C" }, (x) => { TA = x; draw(); }).el,
      slider({ id: "hAp", label: "Power the chip dissipates", min: 0.001, max: 2, log: true, value: P, show: (x) => si(x, "W", 2) }, (x) => { P = x; draw(); }).el, out); draw();
  }

  /* ---------- 74HC04 power ---------- */
  function hcPower(host) {
    let n = 6, CL = 25e-12, f = 10e6, V = 5;
    const Cpd = 20e-12, Icc = 20e-6;
    const out = el(`<div></div>`);
    const draw = () => {
      const Pd = 0.5 * n * (Cpd + CL) * V * V * f, Ps = Icc * V;
      out.innerHTML = readout([["Dynamic ½·N·(C<sub>pd</sub> + C<sub>L</sub>)·V<sup>2</sup>·f", si(Pd, "W", 3)], ["Static I<sub>CC</sub>·V (worst case)", si(Ps, "W", 2)], ["Total", si(Pd + Ps, "W", 3)], ["Static share", (100 * Ps / (Pd + Ps)).toFixed(2) + "%"]]);
    };
    host.append(slider({ id: "hAn", label: "Inverters switching N", min: 1, max: 6, step: 1, value: n, show: (x) => String(x) }, (x) => { n = x; draw(); }).el,
      slider({ id: "hAcl", label: "External load per inverter C_L", min: 0, max: 50e-12, step: 1e-12, value: CL, show: (x) => si(x, "F", 2) }, (x) => { CL = x; draw(); }).el,
      slider({ id: "hAfr", label: "Switching frequency f", min: 1e5, max: 5e7, log: true, value: f, show: (x) => si(x, "Hz", 2) }, (x) => { f = x; draw(); }).el,
      slider({ id: "hAv", label: "Supply V_CC", min: 2, max: 6, step: 0.1, value: V, show: (x) => x.toFixed(1) + " V" }, (x) => { V = x; draw(); }).el, out); draw();
  }

  /* ---------- logic family compatibility (Tables A.2, A.3) ---------- */
  const FAMS = [
    { n: "TTL", vih: 2, vil: 0.8, voh: 2.4, vol: 0.4, vdd: 5 },
    { n: "LS", vih: 2, vil: 0.8, voh: 2.7, vol: 0.5, vdd: 5 },
    { n: "HC", vih: 3.15, vil: 1.35, voh: 3.84, vol: 0.33, vdd: 5 },
    { n: "AHC", vih: 3.15, vil: 1.35, voh: 3.8, vol: 0.44, vdd: 5 },
    { n: "HCT", vih: 2, vil: 0.8, voh: 3.84, vol: 0.33, vdd: 5 },
    { n: "AHCT", vih: 2, vil: 0.8, voh: 3.8, vol: 0.44, vdd: 5 },
    { n: "LVC 3.3 V", vih: 2, vil: 0.8, voh: 2.2, vol: 0.55, vdd: 3.3 },
  ];
  function familyMatch(host) {
    let di = 0, ri = 2;
    const out = el(`<div></div>`);
    const draw = () => {
      const d = FAMS[di], r = FAMS[ri], nmh = d.voh - r.vih, nml = r.vil - d.vol;
      const W = 420, H = 250, top = 20, bot = 220, Y = (v) => bot - (v / 5) * (bot - top);
      const band = (x, y1, y2, fill, lab) => `<rect x="${x}" y="${Y(y2)}" width="90" height="${Math.max(0, Y(y1) - Y(y2))}" style="fill:${fill};stroke:var(--ink);stroke-width:1"/>` + (lab ? S.t(x + 45, (Y(y1) + Y(y2)) / 2 + 5, lab, { cls: "lab" }) : "");
      let s = band(70, d.voh, d.vdd, "var(--good-soft)", "HIGH out") + band(70, 0, d.vol, "var(--cool-soft)", "LOW") +
        band(290, r.vih, 5, "var(--good-soft)", "reads HIGH") + band(290, 0, r.vil, "var(--cool-soft)", "reads LOW") + band(290, r.vil, r.vih, "var(--bad-soft)", "forbidden");
      [[d.voh, 160, "V_OH " + d.voh], [d.vol, 160, "V_OL " + d.vol]].forEach(([v, x, t]) => { s += `<line class="grid" x1="${x}" y1="${Y(v)}" x2="${x + 120}" y2="${Y(v)}"/>` + S.t(x + 4, Y(v) - 4, t, { a: "start", cls: "lab" }); });
      [[r.vih, "V_IH " + r.vih], [r.vil, "V_IL " + r.vil]].forEach(([v, t]) => { s += S.t(386, Y(v) + 4, t, { a: "start", cls: "lab" }); });
      s += S.t(115, 14, "driver: " + d.n) + S.t(335, 14, "receiver: " + r.n) + `<line class="w" x1="40" y1="${bot}" x2="400" y2="${bot}"/>` + S.t(30, bot + 4, "0", { a: "end", cls: "lab" }) + S.t(30, Y(5) + 4, "5 V", { a: "end", cls: "lab" });
      out.innerHTML = fig(S.svg(W + 40, H, s, { max: 460, label: "Driver output levels against receiver input levels" })) +
        readout([["NM<sub>H</sub> = V<sub>OH</sub> − V<sub>IH</sub>", fmt(nmh, 3) + " V"], ["NM<sub>L</sub> = V<sub>IL</sub> − V<sub>OL</sub>", fmt(nml, 3) + " V"], ["Verdict", nmh >= 0 && nml >= 0 ? "compatible" : `<span style="color:var(--bad)">not compatible: a ${nmh < 0 ? "HIGH" : "LOW"} may land in the forbidden zone</span>`]]);
    };
    const lab = (t) => el(`<p class="aside" style="margin:0">${t}</p>`);
    host.append(lab("Driver"), toggle(FAMS.map((f) => f.n), (i) => { di = i; draw(); }, di), lab("Receiver"), toggle(FAMS.slice(0, 6).map((f) => f.n), (i) => { ri = i; draw(); }, ri), out); draw();
  }

  /* ---------- lumped wire or transmission line? (A.8.5) ---------- */
  function whenTL(host) {
    let len = 20, tr = 2;
    const out = el(`<div></div>`);
    const draw = () => {
      const td = len / 15, crit = 0.2 * tr * 15;
      out.innerHTML = readout([["Wire delay t<sub>d</sub> = l / (15 cm/ns)", fmt(td, 3) + " ns"], ["20% of the edge", fmt(0.2 * tr, 3) + " ns"], ["Critical length for this edge", fmt(crit, 3) + " cm"], ["Model the wire as", td > 0.2 * tr ? `<span style="color:var(--bad)">a transmission line: reflections matter</span>` : "an ideal equipotential wire"]]);
    };
    host.append(slider({ id: "hAl", label: "Trace length", min: 1, max: 100, log: true, value: len, show: (x) => fmt(x, 2) + " cm" }, (x) => { len = x; draw(); }).el,
      slider({ id: "hAtr", label: "Rise/fall time", min: 0.1, max: 20, log: true, value: tr, show: (x) => fmt(x, 2) + " ns" }, (x) => { tr = x; draw(); }).el, out); draw();
  }

  /* ---------- reflections and bounces (Figures A.16–A.32) ---------- */
  const Z0 = 50, OPEN = 1000;
  const kr = (Z) => (Z >= OPEN ? 1 : (Z - Z0) / (Z + Z0));
  function waves(ZS, ZL, K = 14) {
    const a = [Z0 / (Z0 + ZS)], kL = kr(ZL), kS = kr(ZS);
    for (let k = 1; k < K; k++) a.push(a[k - 1] * (k % 2 ? kL : kS));
    return { a, kL, kS };
  }
  const vAt = (w, x, t) => w.a.reduce((s, ak, k) => s + (t >= k + (k % 2 ? 1 - x : x) - 1e-9 ? ak : 0), 0);
  const frac = (v) => { // show amplitudes as small fractions when they are exact, else decimals
    for (const d of [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 16, 20, 25, 50, 100, 125, 250]) { const n = v * d; if (Math.abs(n - Math.round(n)) < 1e-9 && Math.abs(n) < 1000) return d === 1 ? String(Math.round(n)) : `${Math.round(n)}/${d}`; }
    return v.toFixed(3);
  };
  function bounceSVG(w) {
    const W = 420, H = 260, xA = 90, xC = 330, top = 24, dy = 34;
    let legs = 0; while (legs < 6 && Math.abs(w.a[legs]) >= 1e-6) legs++;
    const bot = top + (legs + 0.5) * dy;
    let s = `<line class="w" x1="${xA}" y1="${top}" x2="${xA}" y2="${bot}"/><line class="w" x1="${xC}" y1="${top}" x2="${xC}" y2="${bot}"/>` + S.t(xA, 16, "A (source)") + S.t(xC, 16, "C (load)");
    for (let k = 0; k < 6; k++) {
      const x1 = k % 2 ? xC : xA, x2 = k % 2 ? xA : xC, y1 = top + k * dy, y2 = y1 + dy;
      if (Math.abs(w.a[k]) < 1e-6) break;
      s += `<line class="w" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:var(--accent);stroke-width:2"/>` + S.t((x1 + x2) / 2 + (k % 2 ? -14 : 14), (y1 + y2) / 2 + 2, frac(w.a[k]) + " V", { cls: "lab", a: k % 2 ? "end" : "start" });
      s += S.t(k % 2 ? xA - 8 : xC + 8, y2 + 4, (k ? k + 1 : "") + "t_d", { a: k % 2 ? "end" : "start", cls: "lab" });
    }
    s += S.t(xA - 8, top + 4, "0", { a: "end", cls: "lab" });
    return S.svg(W, bot + 16, s, { max: 420, label: "Bounce diagram: distance across, time down" });
  }
  function bounce(host, id, presetIdx = 0, presets = null) {
    const PRE = presets || [["Matched both ends", 50, 50], ["Open load", 50, OPEN], ["Short", 50, 0], ["75 Ω load", 50, 75], ["450 Ω source, open load", 450, OPEN], ["Strong driver, open load", 0, OPEN]];
    let ZS = PRE[presetIdx][1], ZL = PRE[presetIdx][2];
    const out = el(`<div></div>`);
    const draw = () => {
      const w = waves(ZS, ZL), final = ZL >= OPEN ? 1 : ZL / (ZL + ZS || 1e-12);
      const pts = (x) => { const p = []; let prev = null; for (let t = 0; t <= 8.0001; t += 0.01) { const v = vAt(w, x, t); if (prev !== null && v !== prev) p.push([t, prev]); p.push([t, v]); prev = v; } return p; };
      const A = pts(0), B = pts(1 / 3), C = pts(1), all = [...A, ...B, ...C].map((p) => p[1]);
      const lo = Math.min(0, Math.floor(Math.min(...all) * 2) / 2), hi = Math.max(1, Math.ceil(Math.max(...all) * 2) / 2);
      const yt = []; for (let v = lo; v <= hi + 1e-9; v += 0.5) yt.push(v);
      out.innerHTML = fig(plot({ x: [0, 8], y: [lo, hi + 0.1], xt: [0, 1, 2, 3, 4, 5, 6, 7, 8], yt, xl: "time (units of t_d)", yl: "V (V_S = 1 V)", h: 250, series: [{ f: () => final, cls: "s4" }, { pts: A, cls: "s1" }, { pts: B, cls: "s2" }, { pts: C, cls: "s3" }], label: "Voltages at A, B and C" })) +
        `<p class="aside"><span style="color:var(--accent)">■</span> A (start) · <span style="color:var(--cool)">■</span> B (one third along) · <span style="color:var(--good)">■</span> C (end) · dashed: DC steady state</p>` +
        fig(bounceSVG(w)) +
        readout([["Incident wave V<sub>S</sub>·Z<sub>0</sub>/(Z<sub>0</sub> + Z<sub>S</sub>)", frac(w.a[0]) + " V"], ["k<sub>r</sub> at the load", frac(w.kL)], ["k<sub>r</sub> at the source", frac(w.kS)], ["Steady state V<sub>S</sub>·Z<sub>L</sub>/(Z<sub>S</sub> + Z<sub>L</sub>)", fmt(final, 3) + " V"]]);
    };
    const sS = slider({ id: id + "zs", label: "Source impedance Z_S", min: 0, max: 500, step: 1, value: ZS, show: (x) => Math.round(x) + " Ω" }, (x) => { ZS = x; draw(); });
    const sL = slider({ id: id + "zl", label: "Load impedance Z_L (Z_0 = 50 Ω)", min: 0, max: OPEN, step: 1, value: ZL, show: (x) => (x >= OPEN ? "open (∞)" : Math.round(x) + " Ω") }, (x) => { ZL = x; draw(); });
    host.append(toggle(PRE.map((p) => p[0]), (i) => { sS.set(PRE[i][1]); sL.set(PRE[i][2]); }, presetIdx), sS.el, sL.el, out); draw();
  }
  const termWidget = (host, id) => bounce(host, id, 0, [["Parallel termination", 0, 50], ["Series termination", 50, OPEN], ["No termination", 0, OPEN]]);

  /* ---------- ASIC vs FPGA (A.9) ---------- */
  const ticks = (m) => { const st = [1, 2, 2.5, 5].map((k) => k * 10 ** Math.floor(Math.log10(m / 4))).concat([10 ** Math.ceil(Math.log10(m / 4))]).find((d) => m / d <= 5); const t = []; for (let v = 0; v <= m + 1e-9; v += st) t.push(+v.toPrecision(6)); return t; };
  function breakeven(host) {
    let vol = 1000, life = 24, nre = 600000, ua = 4, uf = 17;
    const kit = 1500, pcb = 1.5;
    const out = el(`<div></div>`);
    const draw = () => {
      const N = vol * life, ca = nre + N * (ua + pcb), cf = kit + N * (uf + pcb);
      const be = uf > ua ? (nre - kit) / (uf - ua) : Infinity, xmax = Math.max(N, isFinite(be) ? be : 0) * 1.3;
      const sc = 1e3, ymax = Math.max(nre + xmax * (ua + pcb), kit + xmax * (uf + pcb));
      out.innerHTML = fig(plot({ x: [0, xmax / sc], y: [0, ymax / sc], xt: ticks(xmax / sc), yt: ticks(ymax / sc), xl: "units sold (thousands)", yl: "total cost ($k)", h: 240,
        series: [{ f: (x) => (nre + x * sc * (ua + pcb)) / sc, cls: "s1" }, { f: (x) => (kit + x * sc * (uf + pcb)) / sc, cls: "s2" }],
        marks: [{ x: N / sc, y: Math.min(ca, cf) / sc, label: "your plan", cls: "mk" }].concat(isFinite(be) && be <= xmax ? [{ x: be / sc, y: (kit + be * (uf + pcb)) / sc, label: "break-even", dx: -10, a: "end" }] : []), label: "Total cost: ASIC (orange) and FPGA (blue)" })) +
        readout([["Units over the product life", N.toLocaleString("en-US")], ["ASIC total / per unit", money(ca) + " / $" + (ca / N).toFixed(2)], ["FPGA total / per unit", money(cf) + " / $" + (cf / N).toFixed(2)], ["Break-even volume", isFinite(be) ? Math.ceil(be).toLocaleString("en-US") + " units" : "never: the ASIC chip isn't cheaper"], ["Cheaper choice", ca < cf ? "ASIC" : "FPGA"]]);
    };
    host.append(slider({ id: "hAvol", label: "Sales per month", min: 100, max: 20000, log: true, value: vol, show: (x) => Math.round(x).toLocaleString("en-US") }, (x) => { vol = Math.round(x); draw(); }).el,
      slider({ id: "hAlife", label: "Product life", min: 6, max: 72, step: 1, value: life, show: (x) => x + " months" }, (x) => { life = x; draw(); }).el,
      slider({ id: "hAnre", label: "ASIC mask set (NRE)", min: 1e5, max: 3e6, log: true, value: nre, show: money }, (x) => { nre = Math.round(x / 1000) * 1000; draw(); }).el,
      slider({ id: "hAua", label: "ASIC chip, each", min: 1, max: 20, step: 0.5, value: ua, show: (x) => "$" + x.toFixed(2) }, (x) => { ua = x; draw(); }).el,
      slider({ id: "hAuf", label: "FPGA chip, each", min: 2, max: 60, step: 0.5, value: uf, show: (x) => "$" + x.toFixed(2) }, (x) => { uf = x; draw(); }).el,
      el(`<p class="aside">Fixed: FPGA development kit $1,500, PCB $1.50 per board for either choice.</p>`), out); draw();
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Three ways to build a digital system, and 74xx chips", mins: 20,
    blurb: "Wire up chips of gates, configure programmable logic, or design a custom chip. Then meet the classic 74xx gate chips and their pinouts.",
    takeaway: "Three strategies, trading cost, speed, power and design time: (1) connect chips of individual gates or bigger blocks (ALUs, memories); (2) programmable logic: generic arrays configured to a function; (3) a custom integrated circuit. 74xx-series logic (1970s–80s, 10–25¢ per chip, now mostly obsolete but handy for class projects) comes in 14-pin dual inline packages (DIPs): 7404 = six NOT gates, 7408 = four AND gates, 7474 = two flip-flops. Small-scale integration (SSI) = a few transistors per gate chip. Pin 1 is at the upper left (notch or dot at the top), numbering runs counterclockwise; V_DD = 5 V on pin 14, GND on pin 7. The number of gates is set by the pin count (7421: two 4-input ANDs, with NC = not connected pins). The 7474 has D, CLK, Q, complementary Q̄ and active-low asynchronous set (preset, PRE) and reset (clear, CLR): sets when PRE = 0, resets when CLR = 0, normal when PRE = CLR = 1.",
    steps: [
      { k: "learn", title: "Three strategies", b: [
        `<div class="two"><div class="tile"><h3>Chips of gates</h3><p>Wire together chips that each hold a few gates, or bigger blocks like ALUs and memories.</p></div><div class="tile"><h3>Programmable logic</h3><p>Generic arrays of circuitry that you <i>configure</i> to do your function.</p></div><div class="tile"><h3>Custom chip</h3><p>Design an integrated circuit with exactly the logic you need.</p></div></div>`,
        `<p>They trade cost, speed, power and design time against each other. This appendix walks through all three, then the physical side: data sheets, logic families, packages, the wires between chips, and money.</p>`,
      ]},
      { k: "learn", title: "74xx logic", b: [
        `<p>In the 1970s and 80s, systems were built from cheap chips holding a handful of gates: the <b>74xx series</b>, 10–25¢ each. They're mostly obsolete now but still great for lab projects.</p>`,
        `<p>Most come in a <b>14-pin dual inline package (DIP)</b>. A chip with a few gates is called <b>small-scale integration (SSI)</b>.</p>`,
      ]},
      { k: "play", title: "Read a pinout", b: [
        `<p>Before you click: there are 14 pins, two go to power, and a 2-input gate needs 3 pins. How many 2-input gates fit? How many inverters?</p>`,
        pinout,
        `<p>Rules that hold on every chip here: pin 1 at the top left by the notch, numbers run <b>counterclockwise</b>, <b>V<sub>DD</sub> = 5 V on pin 14</b>, <b>GND on pin 7</b>. Pins that go nowhere are marked NC (not connected).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 7411 holds 3-input AND gates in a 14-pin DIP. At most how many gates fit?", a: 3, tol: 0, why: "12 signal pins ÷ 4 pins per gate (3 in, 1 out) = 3. The 7411 has three." },
        { t: "mcq", q: "On the 7400, pins 1 and 2 are inputs of one NAND. Where does its output come out?", opts: [["Pin 3", true, "1A, 1B, 1Y on pins 1, 2, 3."], ["Pin 14", false, "Pin 14 is V_DD."], ["Pin 13", false, "That's an input of gate 4."]] },
      ]},
      { k: "play", title: "The 7474's extra pins", b: [
        `<p>The 7474 flop has D, CLK, Q, and also Q̄, plus asynchronous <b>preset</b> (PRE̅) and <b>clear</b> (CLR̅). The bar means <b>active low</b>: they act when they're 0.</p>`,
        `<p>Predict: with PRE̅ = 1, CLR̅ = 0 and D = 1, what does Q do on a clock edge?</p>`,
        flop7474,
        seenHH("Flip-flops with asynchronous reset.", "../hh/03-sequential-logic.html", "Chapter 3"),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does it mean that the 7474's CLR input is active low and asynchronous?", model: "Active low means the input does its job when it is 0, not 1; holding CLR at 1 lets the flop work normally. Asynchronous means it acts immediately, without waiting for a clock edge: as soon as CLR goes to 0, Q is forced to 0." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "MSI chips: decoders, muxes, counters and more", mins: 15,
    blurb: "Medium-scale chips pack a whole building block: muxes, a 3:8 decoder, counters, tristate buffers, registers, a 7-segment decoder, a comparator, an ALU.",
    takeaway: "Medium-scale integration (MSI) chips hold more complex functions in larger packages (often 16 or 20 pins); power is still at the upper right and ground at the lower left. Figure A.2: 74153 dual 4:1 mux and 74157 quad 2:1 mux (active-low enable Gb forces Y = 0); 74138 3:8 decoder (enables G1 active high, G2A and G2B active low; outputs Y7:0 active low: the selected output goes 0); 74161/163 4-bit counter (CLRb async reset on the 161, sync on the 163; LOADb loads Q from D; counts when ENP & ENT; RCO = (Q == 1111) & ENT for chaining); 74244 8-bit tristate buffer (ENb high → outputs z); 74377 8-bit enableable register. Figure A.3: 7447 7-segment display decoder (low = ON; LTb lamp test, RBIb/RBOb ripple blanking), 7485 4-bit comparator (chainable relation in/out), 74181 4-bit ALU (function select F3:0, mode M: logic or arithmetic; carry lookahead outputs). Read the manufacturer's data sheet for full behaviour. SystemVerilog names can't start with digits, but the figure's names match the data sheet.",
    steps: [
      { k: "learn", title: "Medium-scale integration", b: [
        `<p><b>MSI</b> chips hold whole building blocks from Chapter 5: muxes, decoders, counters, registers, comparators, even a 4-bit ALU (the 74181). They use bigger packages (16, 20, 24 pins), with power still at the top right and ground at the bottom left.</p>`,
        `<div class="tbl"><table><thead><tr><th>Chip</th><th>Function</th></tr></thead><tbody>
          <tr><td>74153 / 74157</td><td>two 4:1 / four 2:1 muxes</td></tr>
          <tr><td>74138</td><td>3:8 decoder</td></tr>
          <tr><td>74161 / 74163</td><td>4-bit counter (async / sync clear)</td></tr>
          <tr><td>74244</td><td>8-bit tristate buffer</td></tr>
          <tr><td>74377</td><td>8-bit register with enable</td></tr>
          <tr><td>7447</td><td>7-segment display decoder</td></tr>
          <tr><td>7485</td><td>4-bit comparator</td></tr>
          <tr><td>74181</td><td>4-bit ALU</td></tr></tbody></table></div>`,
        seenHH("These blocks as SystemVerilog modules.", "../hh/05-building-blocks.html", "Chapter 5"),
      ]},
      { k: "play", title: "The 74138's enables", b: [
        `<p>The 74138 has three enables: G1 is active high, G2A and G2B are active low, and so are all eight outputs. That's a lot of bars. Predict what the outputs look like when the chip is <i>disabled</i>.</p>`,
        dec138,
        `<p>Three enables let you build a bigger decoder from several 74138s without extra gates: the high address bits drive the enables.</p>`,
      ]},
      { k: "learn", title: "Counters that chain", b: [
        `<p>The 74161/163 counts when both ENP and ENT are 1. Its <b>ripple carry out</b> RCO = (Q = 1111) AND ENT. Wire RCO of one counter into ENT of the next and the second counts once every 16 clocks.</p>`,
        `<p>The only difference between the two: the 74161 clears <b>asynchronously</b>, the 74163 <b>synchronously</b> (on the clock edge).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Two 74163s are chained with RCO → ENT. How many different counts can they go through before repeating?", a: 256, tol: 0, why: "Two 4-bit counters chained make an 8-bit counter: 2⁸ = 256." },
        { t: "mcq", q: "The 74244's enable is high. What do its outputs do?", opts: [["Float (z), so another chip can drive the bus", true, "Active-low enable: 1 means off, and a tristate that's off floats."], ["All go to 0", false, "That's what the muxes do when disabled."], ["Copy the inputs", false, "Only when the enable is 0."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you read the bar or b suffix on a chip signal name like G2A̅ or LOADb, and why do you have to care?", model: "It means the signal is active low: it does its job when it is 0. You have to tie it or drive it the right way. For example, if you leave an active-low enable at 1, the chip stays disabled, and an active-low output that goes to 0 is the one that is selected." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Programmable logic: PROMs, PLAs, PLDs", mins: 15,
    blurb: "Configure the logic instead of wiring it: lookup tables in PROMs, sum-of-products in PLAs, and PLAs with registers in PLDs like the 22V10.",
    takeaway: "Programmable logic = arrays of circuitry configured to a function. Configuration by blowing on-chip fuses is one-time programmable (OTP); storing it in reprogrammable memory lets a lab chip be reused. PROMs as lookup tables: a 2^N-word × M-bit PROM does any combinational function of N inputs and M outputs; design changes = new contents, not new wiring; too expensive as inputs grow. The 2764 8-KB (64-Kb) EPROM: 13 address lines (8K words), 8 data lines; chip enable and output enable must both be asserted; normally PGM = 1 and V_PP unused; programmed with PGM = 0, 13 V on V_PP. Flash is the cheapest PROM (~$1/GB in 2012), prices falling 30–40% per year. PLAs: AND and OR planes for sum-of-products; two columns per input, one per output, one row per minterm (implicant); more efficient than a PROM for many functions but still grows large. PLDs add registers: the 22V10 has 12 dedicated inputs and 10 outputs (direct or registered, fed back), so it implements FSMs with up to 12 inputs, 10 outputs, 10 state bits; ~$2; mostly obsoleted by FPGAs.",
    steps: [
      { k: "learn", title: "Fuses or memory", b: [
        `<p>Programmable logic is configured either by <b>blowing fuses</b> (one-time programmable, <b>OTP</b>: a blown fuse can't come back) or by storing the configuration in <b>reprogrammable memory</b>, which is far nicer in a lab.</p>`,
      ]},
      { k: "learn", title: "PROMs as lookup tables", b: [
        `<p>A PROM with 2<sup>N</sup> words of M bits computes <i>any</i> function of N inputs and M outputs: the inputs are the address, the stored word is the answer. A design change means new contents, not new wires.</p>`,
        `<p>The classic <b>2764 EPROM</b>: 8K words × 8 bits = 64 Kb. 13 address lines (2<sup>13</sup> = 8192), 8 data lines, and chip enable <i>and</i> output enable must both be asserted to read.</p>`,
        `<p>The catch: every extra input <b>doubles</b> the table.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "You want a PROM lookup table for a function with 12 inputs and 4 outputs. How many bits must it store?", a: 16384, tol: 0, why: "2¹² words × 4 bits = 4096 × 4 = 16,384 bits." },
      ]},
      { k: "learn", title: "PLAs and PLDs", b: [
        `<p>A <b>PLA</b> has an AND plane and an OR plane, so it stores only the product terms you need, not every row of the truth table: one row per product term, two columns per input (true and complement), one column per output.</p>`,
        `<p>A <b>PLD</b> adds registers. The classic <b>22V10</b> has 12 inputs and 10 outputs that can be registered and fed back, so it is a whole small FSM on one chip: up to 12 inputs, 10 outputs, 10 state bits.</p>`,
        seenHH("PLAs and FPGAs as logic arrays.", "../hh/05-building-blocks.html", "Chapter 5"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which programmable part fits best?", bins: ["PROM", "PLA", "PLD (22V10)"], items: [
          ["A full 8-input, 8-output lookup table where every input pattern needs its own answer", 0, "Every row needed: a lookup table is exactly that."],
          ["A 16-input function that needs only 6 product terms", 1, "A PROM would need 65,536 words; the PLA stores just the 6 terms."],
          ["A traffic-light FSM with 3 state bits", 2, "Needs registers fed back into the logic."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is a PLA often smaller than a PROM for the same function?", model: "A PROM stores the output for every possible input combination, so its size doubles with each extra input. A PLA stores only the product terms in the function's sum-of-products form. When a function has many inputs but few product terms, the PLA needs far fewer rows." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "FPGAs: design flow and timing", mins: 20,
    blurb: "Lookup tables and programmable wires that scale to huge designs, the steps from HDL to a configured chip, and how many logic elements fit in a clock cycle.",
    takeaway: "FPGAs: arrays of configurable logic elements (LEs, also CLBs) with small lookup tables and flip-flops, joined by programmable wires; scale to thousands of LUTs; Xilinx and Altera lead. Flexible but an order of magnitude less efficient in speed and area than hard-wired logic, so they add special blocks (memories, multipliers, whole processors). Design flow (Figure A.5): design entry (HDL, sometimes schematics) → logic verification (simulate, debug) → synthesis (HDL → Boolean functions; read the schematics and warnings: sloppy code makes large or asynchronous circuits) → mapping onto LEs → place and route (wire delay grows with length; too big → re-engineer) → timing analysis (constraints vs actual delays; too slow → redesign or pipeline) → configure the FPGA (config file; often stored in SRAM reloaded at power-up from a computer or a nonvolatile ROM). Example A.1 (Cyclone IV GX, Table A.1: t_pcq 199 ps, t_setup 76, t_hold 0, t_pd per LE 381, t_wire 246, t_skew 0): at 100 MHz, t_pd ≤ 10 − (0.199 + 0.076) = 9.725 ns; per LE + wire 627 ps → at most 15 LEs; fastest FSM with one LE: T_c = 381 + 199 + 76 = 656 ps → 1.5 GHz. Cyclone IV with 14,400 LEs ≈ $25 (2012); medium FPGAs several dollars in volume, biggest ones hundreds to thousands; cost falling ~30%/year.",
    steps: [
      { k: "learn", title: "What's inside", b: [
        `<p>An FPGA is a sea of <b>logic elements (LEs)</b>, each a small lookup table plus a flip-flop, joined by <b>programmable wires</b>. That can make any logic, but about <b>10×</b> slower and bigger than hard-wired gates.</p>`,
        `<p>So FPGAs also carry hard blocks for common jobs: memories, multipliers, even whole processors.</p>`,
      ]},
      { k: "check", title: "Put the flow in order", b: [
        `<p>Before you reveal it: list the steps from an idea to a working FPGA. Where would you discover the design is too slow? Too big?</p>`,
        { t: "reveal", label: "Show the flow", html: `<ol><li><b>Design entry</b>: write HDL.</li><li><b>Logic verification</b>: simulate against expected outputs; debug.</li><li><b>Synthesis</b>: HDL → gates. Read the schematic and warnings: sloppy code can make huge or asynchronous circuits.</li><li><b>Mapping</b>: functions onto LEs.</li><li><b>Place and route</b>: which LE does what, and the wires. <i>Too big → re-engineer.</i></li><li><b>Timing analysis</b>: actual delays vs your target clock. <i>Too slow → redesign or pipeline.</i></li><li><b>Configure</b>: download the bit file (often into SRAM, so it reloads at every power-up from a PC or a ROM).</li></ol>` },
      ]},
      { k: "play", title: "How much logic fits in a cycle?", b: [
        `<p>Table A.1 timing: t<sub>pcq</sub> = 199 ps, t<sub>setup</sub> = 76 ps, each LE 381 ps, and each wire between LEs 246 ps. The next-state logic gets whatever is left of the cycle.</p>`,
        `<p>Predict: if you double the clock frequency, does the number of LEs you can chain roughly halve, or drop by more than half?</p>`,
        fpgaTiming,
        `<p>It drops by more than half, because the flop overhead (275 ps) doesn't shrink. At the top end, a single LE gives T<sub>c</sub> = 381 + 199 + 76 = 656 ps: about 1.5 GHz, the fastest any FSM can run on this part.</p>`,
        seenHH("t_pcq, setup time and the cycle-time equation.", "../hh/03-sequential-logic.html", "Chapter 3"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Same FPGA, target 250 MHz. How many LE + wire levels fit in the next-state logic?", a: 5, tol: 0, why: "T_c = 4 ns; 4 − 0.275 = 3.725 ns; 3.725 / 0.627 = 5.9 → 5 whole levels." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why should you look at the schematic and warnings that synthesis produces instead of just checking that simulation passed?", model: "Simulation only shows the HDL behaves correctly. Synthesis decides what hardware you actually get, and sloppy code can turn into a much larger circuit than you meant, or into asynchronous logic such as unintended latches. Those problems show up in the synthesized schematic and the warnings, not in a passing simulation." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "ASICs", mins: 10,
    blurb: "Hard-wired chips: faster and cheaper per unit than an FPGA, but with expensive masks, weeks of fabrication, and no second chances.",
    takeaway: "Application-specific integrated circuits (ASICs) are built for one purpose (graphics accelerators, network interface chips, cell phone chips). The designer places transistors into gates and wires them; hard-wired, an ASIC is typically several times faster than an FPGA and an order of magnitude smaller (cheaper) for the same function. But masks cost hundreds of thousands of dollars, fabrication, packaging and test take 6–12 weeks, and a bug means new masks and another wait, so ASICs suit high-volume products with well-defined functions. ASIC flow (Figure A.6): like the FPGA flow, but synthesis produces a netlist of gates that is placed and routed, then masks are generated, the ASIC fabricated, tested (a speck of dust can ruin a chip; yield = fraction that work, typically 50–90% depending on chip size and process maturity), and packaged. Logic verification matters even more, because fixing errors after masks is expensive.",
    steps: [
      { k: "learn", title: "Hard-wired", b: [
        `<div class="two"><div class="tile"><h3>FPGA</h3><p>Configure in seconds, fix bugs by reloading. About 10× the area and several times slower.</p></div><div class="tile"><h3>ASIC</h3><p>Several times faster, ~10× smaller for the same function. Masks cost hundreds of thousands of dollars; 6–12 weeks to fabricate, package and test.</p></div></div>`,
        `<p>A bug found after fabrication means new masks and another batch. So ASICs suit products made in <b>large quantities</b> whose function is <b>well defined</b> in advance.</p>`,
      ]},
      { k: "learn", title: "The ASIC flow adds a factory", b: [
        `<p>Same front end as the FPGA flow (entry, verification, synthesis to a gate <b>netlist</b>, place and route, timing). Then: <b>generate masks → fabricate → test → package</b>.</p>`,
        `<p><b>Testing</b> is needed because a single speck of dust can ruin a chip. The fraction that work is the <b>yield</b>: typically 50–90%, lower for big chips and new processes.</p>`,
        seenV("Yield models, design methods and design economics.", "14-methodology.html", "Chapter 14"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "In which step is a mistake the most expensive to fix on an ASIC, compared with an FPGA?", opts: [["Logic verification: a missed bug costs new masks and weeks", true, "On an FPGA you'd just reload; on an ASIC you refabricate."], ["Design entry", false, "Typos at entry are cheap if verification catches them."], ["Timing analysis", false, "That happens before masks, so fixes are still cheap."]] },
        { t: "num", q: "A wafer gives 400 chip sites and the yield is 70%. How many working chips?", a: 280, tol: 0, why: "400 × 0.70 = 280." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "When is an ASIC the right choice over an FPGA?", model: "When the product will sell in large volume and its function is settled. The large one-time mask cost and the risk of refabrication are then spread over many units, and each ASIC is faster, smaller and cheaper than an FPGA doing the same job. For small volumes or designs that may change, the FPGA wins." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Reading a data sheet", mins: 25,
    blurb: "Dissect the TI 74HC04: part numbers, function table, absolute maximums, operating conditions, electrical and switching characteristics, and heat.",
    takeaway: "Misreading data sheets is a leading cause of errors; if you can't find one, don't use the part. SN74HC04: SN = Texas Instruments (MC Motorola, DM National), HC = logic family (high-speed CMOS: speed, power, not function; 7404, 74HC04, 74LS04 all hold six inverters), 04 = function (HEX INVERTERS = six). 74xx: commercial 0–70 °C or industrial −40–85 °C; 54xx: military −55–125 °C, pricier. Package suffix: N = plastic DIP (PDIP), D = SOIC, NS = SOP, PW = TSSOP. Absolute maximum ratings: beyond them the chip may be destroyed (V_CC ≤ 7 V, output current ≤ 25 mA). Thermal impedance θ_JA: T_J = T_A + P_chip·θ_JA (EQ A.3); 7404 DIP (80 °C/W) at 50 °C dissipating 20 mW → 51.6 °C. Recommended operating conditions are stricter: V_CC 2–6 V; HC input levels depend on V_DD (use the 4.5 V column at 5 V to allow 10% droop). Electrical characteristics (inputs constant): at V_CC = 4.5 V and |I_O| ≤ 20 µA, V_OH ≥ 4.4 V, V_OL ≤ 0.1 V; more current → worse levels; input current < 1000 nA (typ 0.1 nA); quiescent I_CC < 20 µA; input capacitance < 10 pF. Switching characteristics (C_L = 50 pF): t_pd measured 50%→50% of V_CC, ≤ 24 ns at 4.5 V (typically much less); transition (rise/fall) time 10%→90%. 10 pF per input → at most five chips at full speed, fewer with wire capacitance. Power: static 20 µA × 5 V = 0.1 mW; C_pd = 20 pF per inverter; six inverters at 10 MHz driving 25 pF: ½·6·(20 + 25 pF)·5²·10 MHz = 33.75 mW, total 33.85 mW.",
    steps: [
      { k: "learn", title: "Rule zero", b: [
        `<p>Misunderstanding how a chip works is one of the leading causes of broken digital systems. Read the data sheet, and if you can't find one, <b>don't use the part</b>.</p>`,
      ]},
      { k: "play", title: "Decode a part number", b: [
        `<p>The book dissects TI's <b>SN74HC04</b>. Every piece of the name means something. Build a few and read what changes.</p>`,
        partNo,
        `<p>The family sets <b>speed, power and logic levels</b>, never the function: a 7404, 74LS04 and 74HC04 all contain six inverters. Order the package you actually want: an N fits your breadboard, a PW doesn't.</p>`,
      ]},
      { k: "learn", title: "Two kinds of limits", b: [
        `<div class="two"><div class="tile"><h3>Absolute maximum ratings</h3><p>Cross these and the chip may be <b>destroyed</b>. 74HC04: V<sub>CC</sub> ≤ 7 V, output current ≤ 25 mA.</p></div><div class="tile"><h3>Recommended operating conditions</h3><p>Stay inside these and the chip <b>meets its specs</b>. Stricter: V<sub>CC</sub> 2–6 V. At 5 V nominal, use the 4.5 V column to allow a 10% supply droop.</p></div></div>`,
        `<p>Between the two, the chip probably survives but nothing is promised.</p>`,
      ]},
      { k: "play", title: "How hot does it get?", b: [
        `<p>The package's <b>thermal impedance</b> θ<sub>JA</sub> (°C per watt) converts power into temperature rise at the chip's junction: T<sub>J</sub> = T<sub>A</sub> + P·θ<sub>JA</sub>.</p>`,
        `<p>Predict: same chip, same power, but a tiny PW package instead of the DIP. Hotter or cooler, and why?</p>`,
        thermal,
        `<p>Hotter: a smaller package has less area to spread the heat, so θ<sub>JA</sub> is higher. For a 74xx chip using milliwatts this barely matters; for a modern processor dissipating tens of watts it decides the whole design.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A chip in the D package (86 °C/W) dissipates 0.25 W in a 40 °C box. Junction temperature in °C?", a: 61.5, tol: 0.01, why: "40 + 0.25 × 86 = 40 + 21.5 = 61.5 °C." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between absolute maximum ratings and recommended operating conditions?", model: "Absolute maximum ratings are damage limits: exceed them and the chip may be permanently destroyed. Recommended operating conditions are the narrower range in which the manufacturer guarantees the chip meets its specifications. You design to the recommended conditions and treat the absolute maximums as lines you must never cross." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Data sheet numbers: levels, delay, loading, power", mins: 20,
    blurb: "What the electrical and switching tables promise, how many inputs one output can drive at full speed, and where a 74HC04's power goes.",
    takeaway: "Electrical characteristics: performance with inputs held constant within the recommended conditions. 74HC04 at V_CC = 5 V (drooping to 4.5 V) with output current ≤ 20 µA: worst case V_OH = 4.4 V, V_OL = 0.1 V; at 4 mA the levels degrade (V_OH 3.84 V, V_OL 0.33 V over the industrial range) because the transistors struggle to supply the current. Input current < 1 µA (typ 0.1 nA), quiescent I_CC < 20 µA, input capacitance < 10 pF. Switching characteristics with C_L = 50 pF: t_pd from input crossing 0.5 V_CC to output crossing 0.5 V_CC, ≤ 24 ns at 4.5 V; transition time 0.1 V_CC → 0.9 V_CC. Each input is up to 10 pF, so one output drives at most five inputs at the rated speed, and wire capacitance reduces that. Power: static I_CC·V_CC = 20 µA × 5 V = 0.1 mW (at 85 °C); dynamic from EQ 1.4 with the internal power-dissipation capacitance C_pd (20 pF per inverter) added to the load: ½·N·(C_pd + C_L)·V²·f; six inverters at 10 MHz into 25 pF → 33.75 mW; total 33.85 mW.",
    steps: [
      { k: "learn", title: "Guaranteed levels", b: [
        `<p>The <b>electrical characteristics</b> give the worst-case output levels for a given output current. For the 74HC04 at 4.5 V:</p>`,
        `<div class="tbl"><table><thead><tr><th>Output current</th><th>V<sub>OH</sub> at least</th><th>V<sub>OL</sub> at most</th></tr></thead><tbody><tr><td>20 µA</td><td>4.4 V</td><td>0.1 V</td></tr><tr><td>4 mA</td><td>3.84 V</td><td>0.33 V</td></tr></tbody></table></div>`,
        `<p>Pull more current and the levels sag, because the output transistors have resistance. Inputs take under 1 µA, and the idle chip under 20 µA.</p>`,
        seenHH("V_OH, V_OL and noise margins.", "01-zero-to-one.html", "Chapter 1"),
      ]},
      { k: "learn", title: "How delay is measured", b: [
        `<p><b>t<sub>pd</sub></b>: from the input crossing 50% of V<sub>CC</sub> to the output crossing 50%. <b>Transition time</b> (rise/fall): the output going from 10% to 90%.</p>`,
        `<p>The 74HC04 promises t<sub>pd</sub> ≤ 24 ns at 4.5 V, but only when driving <b>at most 50 pF</b>. Each input it drives can be up to 10 pF.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "The wires on your board add 20 pF to an output. How many 10 pF inputs can it still drive within the 50 pF rating?", a: 3, tol: 0, why: "50 − 20 = 30 pF left; 30 / 10 = 3 inputs." },
      ]},
      { k: "play", title: "Where the power goes", b: [
        `<p>Static power is I<sub>CC</sub>·V<sub>CC</sub>. Dynamic power is ½CV<sup>2</sup>f per switching output, where C includes the chip's own <b>power dissipation capacitance</b> C<sub>pd</sub> (20 pF per inverter) plus the load.</p>`,
        `<p>Predict: which knob matters most, and which part (static or dynamic) dominates at 10 MHz?</p>`,
        hcPower,
        `<p>V is squared, so the supply is the strongest knob. And for CMOS, static power is a rounding error whenever the chip is switching.</p>`,
        seen6("Dynamic power ½CV²f and why CMOS has almost no static power.", "11-energy-power-digital.html", "Chapter 11"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Two of the six inverters switch at 4 MHz, each driving 30 pF, at 5 V. Dynamic power in mW (use C_pd = 20 pF)?", a: 5, tol: 0.01, why: "½ × 2 × (20 + 30) pF × (5 V)² × 4 MHz = 50 pF × 25 V² × 4 MHz = 5 mW." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't one 74HC04 output drive twenty other chips at its rated speed?", model: "The propagation delay is only guaranteed for a load of up to 50 pF. Each input it drives can add up to 10 pF, and the wires add more. Twenty inputs could be 200 pF, so the output would charge the load much more slowly than the data sheet promises." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Logic families", mins: 25,
    blurb: "TTL, Schottky and CMOS 74xx families, why a TTL output can fail to drive a CMOS input, the TTL-compatible fix, and the low-voltage families that replaced 5 V.",
    takeaway: "Logic families = technologies for 74xx chips with different speed, power and levels (Table A.2). Original 7404 = bipolar Transistor-Transistor Logic (TTL); letters after 74 name the family (74LS04, 74HC04, 74AHCT04). Schottky (S, faster, more power), Low-Power Schottky (LS, less power), Advanced (AS, ALS), Fast (F). These bipolar families supply more current LOW than HIGH (asymmetric) and use TTL levels: V_IH = 2 V, V_IL = 0.8 V, V_OH > 2.4 V, V_OL < 0.5 V. CMOS: HC (high-speed CMOS) and AHC draw almost no static power, deliver equal HIGH and LOW current, and use CMOS levels: V_IH = 3.15 V, V_IL = 1.35 V, V_OH > 3.8 V, V_OL < 0.44 V, incompatible with TTL (a 2.4 V TTL HIGH may not read as HIGH). HCT and AHCT accept TTL input levels and give CMOS outputs (slightly slower). CMOS is sensitive to electrostatic discharge (ESD): ground yourself first. Newer families are often cheaper; LS is robust and popular for hobby work. Typical t_pd: TTL 22 ns, S 9, LS 12, AS 7.5, ALS 10, F 6, HC 21, AHC 7.5, HCT 30, AHCT 7.7. The 5 V standard collapsed in the mid-1990s (small transistors can't take it; lower V saves power): 3.3, 2.5, 1.8, 1.2 V and below. Low-voltage families (Table A.3) are CMOS: LVC and ALVC at 3.3/2.5/1.8 V (LVC tolerates 5.5 V inputs, so it can take 5 V CMOS or TTL), AUC at 2.5/1.8/1.2 V, very fast; ALVC and AUC tolerate 3.6 V inputs. Speed degrades at lower V. FPGAs have separate core and I/O supplies; the core fell from 5 to 1.2 V; I/Os are configurable to many voltages.",
    steps: [
      { k: "learn", title: "Same chip, different technology", b: [
        `<p>The letters after the 74 name the <b>logic family</b>. The original 7404 used bipolar <b>Transistor-Transistor Logic (TTL)</b>; then came Schottky (S), Low-Power Schottky (LS), Advanced (AS, ALS) and Fast (F); then CMOS (HC, AHC) and TTL-compatible CMOS (HCT, AHCT).</p>`,
        `<div class="tbl"><table><thead><tr><th></th><th>TTL levels (TTL, LS, …)</th><th>CMOS levels (HC, AHC)</th></tr></thead><tbody><tr><td>V<sub>IH</sub></td><td>2 V</td><td>3.15 V</td></tr><tr><td>V<sub>IL</sub></td><td>0.8 V</td><td>1.35 V</td></tr><tr><td>V<sub>OH</sub> ≥</td><td>2.4 V</td><td>3.8 V</td></tr><tr><td>V<sub>OL</sub> ≤</td><td>0.5 V</td><td>0.44 V</td></tr><tr><td>Static power</td><td>milliwatts</td><td>almost none</td></tr><tr><td>Output current</td><td>more LOW than HIGH</td><td>equal</td></tr></tbody></table></div>`,
      ]},
      { k: "play", title: "Can this drive that?", b: [
        `<p>Before you click: an LS output drives an HC input. Compare the LS V<sub>OH</sub> with the HC V<sub>IH</sub> in the table above. Which margin fails?</p>`,
        familyMatch,
        `<p>TTL HIGHs can sit at 2.4 V, below the 3.15 V a CMOS input insists on. The fix is <b>HCT/AHCT</b>: CMOS chips with TTL-style input thresholds and CMOS outputs, slightly slower.</p>`,
        seen6("The static discipline: output levels must land inside input levels.", "05-digital-abstraction.html", "Chapter 5"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Compatible or not? (driver → receiver, all at 5 V)", bins: ["Works", "Fails"], items: [
          ["HC → LS", 0, "CMOS outputs (3.84 V, 0.33 V) easily satisfy TTL inputs (2 V, 0.8 V)."],
          ["LS → HC", 1, "NM_H = 2.7 − 3.15 < 0."],
          ["LS → HCT", 0, "HCT has TTL input levels: NM_H = 2.7 − 2 = 0.7 V."],
          ["TTL → AHC", 1, "2.4 V is below AHC's 3.15 V V_IH."],
        ]},
      ]},
      { k: "learn", title: "Below 5 volts", b: [
        `<p>In the mid-1990s transistors got too small to survive 5 V, and lower voltage saves power anyway. Now 3.3, 2.5, 1.8, 1.2 V and lower are common, all CMOS:</p>`,
        `<ul><li><b>LVC</b> and <b>ALVC</b> at 3.3, 2.5 or 1.8 V. LVC <b>tolerates 5.5 V inputs</b>, so it can listen to old 5 V parts.</li><li><b>AUC</b> at 2.5, 1.8 or 1.2 V, very fast. ALVC and AUC tolerate 3.6 V inputs.</li></ul>`,
        `<p>Speed drops as V<sub>DD</sub> drops. FPGAs split the supply: a low <b>core</b> voltage (down from 5 V to 1.2 V) and configurable <b>I/O</b> voltages to match the rest of the board.</p>`,
        `<p>And CMOS can be killed by <b>electrostatic discharge</b>: touch a large metal object before handling it.</p>`,
      ]},
      { k: "check", title: "Spot the mistake", b: [
        { t: "mcq", q: "“My new 3.3 V LVC chip drives the old 5 V HC chip fine. Its outputs are CMOS, and CMOS talks to CMOS.” What's wrong?", opts: [["LVC's HIGH is only about 2.2 V, below HC's 3.15 V V_IH", true, "CMOS-to-CMOS isn't enough; the supply voltages differ. (Try LVC 3.3 V → HC above.)"], ["Nothing: CMOS levels always match", false, "Levels scale with V_DD."], ["The LVC input would be damaged", false, "Here the LVC is driving, not receiving; LVC inputs do tolerate 5.5 V."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do HCT chips exist?", model: "TTL outputs only guarantee a HIGH of about 2.4 V, but ordinary CMOS inputs like HC need at least 3.15 V to read HIGH, so TTL can't reliably drive HC. HCT chips are CMOS with input thresholds moved to TTL levels (2 V and 0.8 V) while keeping CMOS output levels, so they can sit between TTL and CMOS parts." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Packages, breadboards and PCBs", mins: 20,
    blurb: "Through-hole and surface-mount packages, wiring a majority gate on a breadboard pin by pin, and what's inside a printed circuit board.",
    takeaway: "Packages (plastic or ceramic) connect the tiny I/O pads to larger pins, protect the chip, and spread its heat. Through-hole: dual inline packages (DIPs, two rows, 0.1-inch pitch), pin grid arrays (PGAs, pins under the package). Surface mount (SMT), soldered to the board surface; pins are called leads: thin small outline package (TSOP, two rows, ~0.02-inch), plastic leaded chip carrier (PLCC, J-leads on four sides, 0.05-inch, solder or socket), quad flat pack (QFP, many close legs on four sides), ball grid array (BGA, hundreds of solder balls underneath, melted onto matching pads). Breadboards: rows of five connected holes, one pin per row, plus long power/ground columns; Figure A.12 labels each gate with its chip (08, 32) and pin numbers: inputs on 7408 pins 1, 2, 5; output on 7432 pin 6; power pin 14, ground pin 7 on each chip; check off connections as you make them; breadboards are for prototypes only. Printed circuit boards (PCBs): alternating copper and insulating epoxy (FR4); copper etched into traces; plated holes called vias join layers; designed with CAD; factory setup a few hundred dollars plus a few dollars per board. Signal layers outside, power and ground planes inside: low-resistance stable power and uniform, predictable trace capacitance and inductance. Apple II+ board: 6502 CPU, six 16-Kb ROMs (12 KB), 24 16-Kb DRAMs (48 KB), 74xx decoding logic. QFPs and BGAs need PCBs; BGA balls can't be probed. Decide on packaging early.",
    steps: [
      { k: "learn", title: "What a package does", b: [
        `<p>It connects the chip's tiny pads to pins you can solder, protects the die, and spreads its heat.</p>`,
        `<div class="two"><div class="tile"><h3>Through-hole</h3><p><b>DIP</b>: two rows, 0.1″ apart, fits a breadboard.<br><b>PGA</b>: a grid of pins underneath.</p></div><div class="tile"><h3>Surface mount (SMT)</h3><p><b>TSOP</b>: two rows, ~0.02″.<br><b>PLCC</b>: J-shaped leads on four sides.<br><b>QFP</b>: many fine legs on four sides.<br><b>BGA</b>: hundreds of solder balls underneath.</p></div></div>`,
        seenV("Package parasitics and how chips connect to them.", "13-special-purpose.html", "Chapter 13"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which is it?", bins: ["Through-hole", "Surface mount"], items: [
          ["DIP", 0, "Pins go through holes, or into a breadboard."],
          ["BGA", 1, "Balls soldered to pads on the surface."],
          ["PGA", 0, "A grid of pins through the board or a socket."],
          ["QFP", 1, "Legs soldered onto the surface on all four sides."],
        ]},
      ]},
      { k: "learn", title: "Breadboarding a majority gate", b: [
        `<p>Y = AB + BC + AC, built from a 7408 (AND) and a 7432 (OR). The trick is to <b>label every gate with its chip and pin numbers</b> on the schematic, then tick off each wire as you place it.</p>`,
        fig(S.svg(480, 220, [
          S.box(10, 22, 170, 170, "", {}), S.t(95, 16, "7408 (AND)"), S.box(220, 22, 250, 170, "", {}), S.t(345, 16, "7432 (OR)"),
          ...[["1A ← A", 1], ["1B ← B", 2], ["1Y", 3], ["2A ← B", 4], ["2B ← C", 5], ["2Y", 6], ["3Y", 8], ["3A ← A", 9], ["3B ← C", 10]].map(([l, p], i) => S.t(24, 44 + i * 17, `${p}: ${l}`, { a: "start", cls: "lab" })),
          ...[["1A ← 7408 pin 3", 1], ["1B ← 7408 pin 6", 2], ["1Y", 3], ["2A ← 7432 pin 3", 4], ["2B ← 7408 pin 8", 5], ["2Y → Y", 6]].map(([l, p], i) => S.t(234, 44 + i * 17, `${p}: ${l}`, { a: "start", cls: "lab" })),
          S.t(240, 212, "both chips: pin 14 = V_DD, pin 7 = GND", { cls: "lab" }),
        ].join(""), { max: 480, label: "Pin assignment for a majority gate from a 7408 and a 7432" })),
        `<p>A breadboard connects the <b>five holes in each row</b>; each chip pin sits in its own row, and long columns down the sides carry power and ground. Wires fall out and go in the wrong hole, so breadboards are for prototypes only, and they get unreliable above a few MHz.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "In the wiring above, the 7432 pin 6 output reads wrong. Which is the most useful first check?", opts: [["Power and ground on pins 14 and 7 of both chips", true, "An unpowered chip gives nonsense everywhere; it's the most common breadboard mistake."], ["Replace the 7432", false, "Chips rarely die; wiring is the usual culprit."], ["Swap A and B", false, "The majority function is symmetric; that can't fix it."]] },
      ]},
      { k: "learn", title: "Printed circuit boards", b: [
        `<p>A PCB is layers of copper and insulating <b>FR4</b> epoxy. Copper is etched into <b>traces</b>; plated holes called <b>vias</b> join layers. Signal layers sit outside; solid <b>power and ground planes</b> sit inside, giving stable power and traces with predictable capacitance and inductance.</p>`,
        `<p>Most modern chips come in QFPs or BGAs, which need a PCB, and BGA balls are hidden, so you can't probe them. Decide on packaging <b>early</b>.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do PCBs have whole layers of copper for power and ground?", model: "Solid planes have very low resistance, so every chip gets a stable supply. They also give each signal trace a nearby return path at a fixed distance, which makes the traces' capacitance and inductance uniform and predictable, so they behave as well-defined transmission lines." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "When a wire becomes a transmission line", mins: 20,
    blurb: "Signals travel at a finite speed. On long wires or with fast edges, that delay and the line's characteristic impedance start to matter.",
    takeaway: "Wires aren't really equipotential: signals propagate as electromagnetic waves at the speed of light in the medium, v = 1/√(με) = 1/√(LC). Fine to ignore for short wires or slow signals; for long wires or fast edges, model them as transmission lines, where a wave travels along and may reflect at the end. c = 3 × 10⁸ m/s in free space; FR4 has 4× the permittivity of air, so PCB signals go about half that: 1.5 × 10⁸ m/s = 15 cm/ns. Delay t_d = l/v (EQ A.4). Characteristic impedance Z0 = V/I of a traveling wave, not the wire's resistance (a good line has negligible resistance): Z0 = √(L/C) (EQ A.5), typically 50–75 Ω. Symbol: like a coaxial cable. Matched termination Z_L = Z0 (Figure A.16): the incident wave V_S, I = V_S/Z0 reaches A at once, B (l/3) at t_d/3, C at t_d, and is completely absorbed; steady state: an ordinary wire at V_S. With a matched source Z_S = Z0 as well (Example A.2), the incident wave is V_S·Z0/(Z0 + Z_S) = V_S/2 and the line sits at V_S/2 from t_d. Use transmission-line models when t_d exceeds ~20% of the rise/fall time (A.8.5): TTL edges 10 ns → longer than 30 cm; modern 2 ns edges → longer than ~6 cm (2.5 in). Don't use crisper edges than needed. Breadboards lack a ground plane: nonuniform fields, odd reflections and crosstalk; unreliable above a few MHz. PCBs have consistent Z0 and v and are reflection-free when terminated. Derivation (A.8.7): a semi-infinite line's impedance can't change when a length dx (series jωL dx, shunt jωC dx) is added: Z0 = jωL dx + Z0 ∥ 1/(jωC dx); as dx → 0, Z0 = √(L/C). Lossy lines add R per length.",
    steps: [
      { k: "learn", title: "Wires aren't instant", b: [
        `<p>A signal is an electromagnetic wave moving at the speed of light <i>in the board's material</i>: v = 1/√(LC), with L and C per unit length. FR4 has 4× the permittivity of air, so on a PCB:</p>`,
        `<p class="eq">v ≈ 1.5 × 10<sup>8</sup> m/s = <b>15 cm/ns</b>, &nbsp; t<sub>d</sub> = l / v</p>`,
        `<p>The wave's voltage-to-current ratio is the <b>characteristic impedance</b> Z<sub>0</sub> = √(L/C), typically 50–75 Ω. It is <i>not</i> the wire's resistance, which is nearly zero.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A trace has L = 300 nH/m and C = 120 pF/m. Z_0 in Ω?", a: 50, tol: 0.01, why: "√(300e-9 / 120e-12) = √2500 = 50 Ω." },
        { t: "num", q: "A signal crosses a 45 cm PCB trace. Delay in ns?", a: 3, tol: 0.01, why: "45 cm ÷ 15 cm/ns = 3 ns." },
      ]},
      { k: "play", title: "Does it matter here?", b: [
        `<p>The rule of thumb: treat the wire as a transmission line when t<sub>d</sub> is more than about <b>20%</b> of the rise/fall time. Predict first: a 20 cm trace with 10 ns TTL edges. Then the same trace with 1 ns edges.</p>`,
        whenTL,
        `<p>It's the <b>edge</b>, not the clock frequency, that decides. Edges crisper than you need only make trouble. And breadboards have no ground plane, so their wires are messy, unpredictable lines: don't trust them above a few MHz.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Your chips have 1 ns edges. Beyond what trace length (cm) must you treat traces as transmission lines?", a: 3, tol: 0.01, why: "0.2 × 1 ns × 15 cm/ns = 3 cm." },
      ]},
      { k: "learn", title: "The matched line", b: [
        `<p>Close a switch from V<sub>S</sub> onto a 50 Ω line ending in a 50 Ω load. A step of V<sub>S</sub> appears at the start at once, at a third of the way along after t<sub>d</sub>/3, and at the end after t<sub>d</sub>. There it is <b>completely absorbed</b>: the load wants V/I = 50 Ω, and that's exactly what the wave carries.</p>`,
        `<p>Add a 50 Ω source resistance and the source and line form a <b>voltage divider</b>: the line looks like Z<sub>0</sub> at first (the far end can't influence it yet), so the wave is V<sub>S</sub>·Z<sub>0</sub>/(Z<sub>0</sub> + Z<sub>S</sub>) = V<sub>S</sub>/2.</p>`,
        seenV("Transmission lines in high-speed links.", "13-special-purpose.html", "Chapter 13"),
      ]},
      { k: "why", title: "Why Z₀ = √(L/C)", b: [
        `<p>Imagine a line that goes on forever. Its input impedance is Z<sub>0</sub>. Add one more tiny slice dx in front: a series inductor jωL·dx, then a capacitor jωC·dx across the rest of the line. It's still an infinite line, so the impedance must still be Z<sub>0</sub>:</p>`,
        `<p class="eq">Z<sub>0</sub> = jωL·dx + Z<sub>0</sub> ∥ 1/(jωC·dx)</p>`,
        `<p>Rearrange and let dx → 0: the frequency cancels and Z<sub>0</sub><sup>2</sup> = L/C. The impedance of a lossless line is a pure resistance.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is the characteristic impedance of a transmission line, and why isn't it the wire's resistance?", model: "It is the ratio of voltage to current in a wave traveling along the line, set by the line's inductance and capacitance per length: Z0 = √(L/C). A good line has almost no resistance. The driver sees Z0 because, while the wave travels, it is charging the line's capacitance through its inductance, and it can't yet see what is at the far end." },
      ]},
    ],
  };

  /* =============== PART 11 =============== */
  const p11 = {
    id: "p11", title: "Reflections and bounce diagrams", mins: 30,
    blurb: "Open, shorted and mismatched ends send part of the wave back; reflections can bounce off both ends. Play with any source and load.",
    takeaway: "Open termination (Figure A.22, Z_S = 50 Ω): the V_S/2 wave reaches C at t_d and reflects entirely (no current can flow), so V_C = V_S/2 + V_S/2 = V_S at t_d; the reflection reaches B at 5t_d/3 and A at 2t_d, where the matched source absorbs it: steady state V_S everywhere, I = 0, from 2t_d. Short (Figure A.24): the wave reflects inverted (−V_S/2), keeping V_C = 0; steady state 0 at 2t_d. Mismatched termination: reflection coefficient k_r = V_r/V_i = (Z_T − Z0)/(Z_T + Z0) (EQ A.7): open k_r = 1, short −1, matched 0. Figure A.26 (Z_L = 75 Ω): k_r = 1/5, reflected V_S/10, V_C = 3V_S/5 at t_d; absorbed at A at 2t_d; steady state = voltage divider V_S·Z_L/(Z_L + Z_S) = 3V_S/5. Reflections at both ends (Figure A.29: Z_S = 450 Ω, open load): k_rL = 1, k_rS = 4/5; launched wave V_S/10; bounce diagram (distance across, time down): V_S/10, V_S/10, 2V_S/25, 2V_S/25, 8V_S/125, …; V_C(1.1t_d) = V_S/5, V_C(3.1t_d) = 9V_S/25; approaches V_S as t → ∞. Derivation (A.8.8): V_L = V_i + V_r, I_L = I_i − I_r, V_i/I_i = V_r/I_r = Z0, V_L = Z_L·I_L → (V_i + V_r)/Z_L = (V_i − V_r)/Z0 → k_r = (Z_L − Z0)/(Z_L + Z0).",
    steps: [
      { k: "learn", title: "What the end of the line demands", b: [
        `<p>When the wave reaches the end, the load insists on its own V/I. If that's not Z<sub>0</sub>, the only way to satisfy it is to send part of the wave <b>back</b>. The reflection coefficient:</p>`,
        `<p class="eq">k<sub>r</sub> = V<sub>r</sub>/V<sub>i</sub> = (Z<sub>T</sub> − Z<sub>0</sub>) / (Z<sub>T</sub> + Z<sub>0</sub>)</p>`,
        `<p>The voltage anywhere on the line is the sum of every wave that has passed that point so far.</p>`,
      ]},
      { k: "check", title: "Predict the special cases", b: [
        { t: "mcq", q: "An open end (no current can flow). k_r?", opts: [["+1: the whole wave comes back the same way up", true, "Incident and reflected currents cancel, so the end's current stays 0, and the voltage doubles."], ["0", false, "That's a matched load."], ["−1", false, "That's a short."]] },
        { t: "mcq", q: "A short to ground. k_r?", opts: [["−1: it comes back inverted", true, "Incident + reflected voltage = 0 at the short."], ["+1", false, "That would double the voltage at a point that must stay at 0."], ["0", false, "A short can't absorb the wave."]] },
      ]},
      { k: "play", title: "Bounce lab", b: [
        `<p>The plot shows the voltages at the start (A), a third of the way along (B) and the end (C), in units of t<sub>d</sub>, for V<sub>S</sub> = 1 V and Z<sub>0</sub> = 50 Ω. The bounce diagram underneath tracks each wave: distance across, time going down.</p>`,
        `<p>Start with <b>Open load</b>. Before you click it, predict the voltage at C just after t<sub>d</sub>, and when the whole line settles.</p>`,
        bounce,
        `<p>Things to try: the <b>75 Ω load</b> (a small 1/5 reflection, settles at the voltage-divider value 3/5), the <b>450 Ω source</b> (reflections off both ends, creeping up toward 1 V), and the <b>strong driver</b> with an open end: with nothing to absorb the wave, it rings forever on a lossless line.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Z_0 = 50 Ω line, load 150 Ω. k_r?", a: 0.5, tol: 0.01, why: "(150 − 50)/(150 + 50) = 0.5." },
        { t: "num", q: "V_S = 1 V, Z_S = 150 Ω, Z_0 = 50 Ω, open load. Voltage at the end just after 3t_d (V)?", a: 0.75, tol: 0.01, why: "Launched: 50/200 = 0.25 V. At t_d the end doubles it: 0.5 V. The source reflects with k_r = 100/200 = 0.5, sending 0.125 V; at 3t_d it arrives and doubles again: 0.5 + 0.25 = 0.75 V. (Set Z_S = 150 Ω, open load in the lab to see it.)" },
      ]},
      { k: "why", title: "Where k_r comes from", b: [
        `<p>At the load: the voltages add, V<sub>L</sub> = V<sub>i</sub> + V<sub>r</sub>; the reflected current flows backward, I<sub>L</sub> = I<sub>i</sub> − I<sub>r</sub>. Each wave has V/I = Z<sub>0</sub>, and the load has V<sub>L</sub> = Z<sub>L</sub>·I<sub>L</sub>:</p>`,
        `<p class="eq">(V<sub>i</sub> + V<sub>r</sub>)/Z<sub>L</sub> = (V<sub>i</sub> − V<sub>r</sub>)/Z<sub>0</sub> &nbsp;⇒&nbsp; V<sub>r</sub>/V<sub>i</sub> = (Z<sub>L</sub> − Z<sub>0</sub>)/(Z<sub>L</sub> + Z<sub>0</sub>)</p>`,
        seenV("The same Γ at chip I/O.", "13-special-purpose.html", "Chapter 13"),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does every mismatched line eventually settle at the same voltage it would have with an ordinary wire?", model: "Each reflection is only a fraction of the wave before it (unless both ends reflect fully), so the bounces get smaller and die out. Once they're gone, no current is changing along the line, the inductance and capacitance stop mattering, and the line is just a wire. The final voltage is then the simple voltage divider of the source and load resistances." },
      ]},
    ],
  };

  /* =============== PART 12 =============== */
  const p12 = {
    id: "p12", title: "Terminating lines properly", mins: 20,
    blurb: "Parallel and series termination both deliver a clean edge to the receiver, but differ in power and in what the middle of the line sees.",
    takeaway: "Two common schemes (Figure A.32). Parallel termination: a low-impedance driver (Z_S ≈ 0) and a load resistor Z_L = Z0 from the receiver input to ground; the driver launches a full V_DD wave that is absorbed at the end: no reflections, every point sees a clean step; but the resistor dissipates power continuously whenever the line is HIGH. Series termination: a resistor in series with the driver raises Z_S to Z0, and the receiver is high impedance (Z_L ≈ ∞); the driver launches V_DD/2, which doubles to V_DD on reflecting at the open end and is absorbed back at the source; no DC power; but points in the middle sit at V_DD/2 (an illegal level) until the reflection returns, so series termination is best for point-to-point links with one driver and one receiver, and parallel termination for buses with several receivers. Both give the receiver a 0 → V_DD step at t = t_d. Putting it together (A.8.9): a gate driving a long wire = source V_S with source impedance Z_S (the gate can't supply infinite current; add a series resistor to match), a line (t_d, Z0) and a load Z_L (CMOS inputs ≈ ∞; add a parallel resistor to match). The incident wave is V_S·Z0/(Z0 + Z_S) (EQ A.18), the end reflects k_r = (Z_L − Z0)/(Z_L + Z0) (EQ A.19), and the reflections die away toward the equipotential value. Lines matter when rise/fall times are less than ~5t_d; with 2 ns edges, PCB traces beyond ~6 cm.",
    steps: [
      { k: "learn", title: "A gate driving a long wire", b: [
        `<p>Model the driver as V<sub>S</sub> behind a source impedance Z<sub>S</sub> (it can't supply infinite current), the wire as a line (t<sub>d</sub>, Z<sub>0</sub>), and the receiver as Z<sub>L</sub>. A CMOS input draws almost no current, so Z<sub>L</sub> ≈ ∞: an open end.</p>`,
        `<p>To stop the bouncing, the designer can add <b>one resistor</b> so that one end matches Z<sub>0</sub>. Which end?</p>`,
      ]},
      { k: "play", title: "Two ways to match", b: [
        `<p>Predict for each scheme: what does the receiver (C) see, and what does the middle of the line (B) see?</p>`,
        termWidget,
        `<div class="two"><div class="tile"><h3>Parallel</h3><p>Strong driver, Z<sub>0</sub> to ground at the receiver. Full step travels once and is absorbed. Clean everywhere, but the resistor <b>burns power whenever the line is HIGH</b>.</p></div><div class="tile"><h3>Series</h3><p>Z<sub>0</sub> in series with the driver, open receiver. Half step out, doubled at the end, absorbed on return. <b>No DC power</b>, but the middle sits at V<sub>DD</sub>/2 for a while.</p></div></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A parallel-terminated 50 Ω line at 3.3 V. Power in the termination resistor while the line is HIGH, in mW?", a: 217.8, tol: 0.01, why: "3.3² / 50 = 0.2178 W ≈ 218 mW, for every HIGH line. That's why it hurts on wide buses." },
      ]},
      { k: "check", title: "Spot the mistake", b: [
        { t: "mcq", q: "“To save power, I series-terminated my memory bus. The driver is at one end and four receivers tap the line along its length.” What goes wrong?", opts: [["Receivers in the middle see V_DD/2, an illegal level, until the reflection returns", true, "Series termination only gives a clean step at the open end. With several receivers along the line, use parallel termination."], ["Nothing: the last receiver gets a clean edge, so they all do", false, "Only the far end gets the clean step."], ["Series termination wastes power", false, "It's the parallel one that dissipates DC power."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "When would you choose series termination, and when parallel?", model: "Series termination suits a point-to-point link with one driver and one receiver at the far end: the receiver gets a clean step and no DC power is wasted. Parallel termination suits a bus with several receivers along the line, because every point sees a clean full step at once; the price is the power the termination resistor dissipates whenever the line is HIGH." },
      ]},
    ],
  };

  /* =============== PART 13 =============== */
  const p13 = {
    id: "p13", title: "Economics: NRE vs recurring cost", mins: 20,
    blurb: "Design and mask costs are paid once; parts and boards are paid per unit. Find where an ASIC finally beats an FPGA.",
    takeaway: "Cost = nonrecurring engineering (NRE: designing the system, design-team salaries, computers and software, producing the first working unit; a fully loaded US designer cost ~$200,000/year in 2012) + recurring costs (per unit: components, manufacturing, marketing, technical support, shipping). The price must also cover overhead (rent, taxes, staff not on the design) and still leave profit. Example A.3: FPGA kit $1500 + $17/FPGA; ASIC masks $600,000 + $4/chip; PCB $1.50 either way; 1000/month for 2 years = 24,000 units; FPGA $1500 + 24,000 × $18.50 = $445,500 ($18.56/unit, price $37.13 at 100% margin); ASIC $600,000 + 24,000 × $5.50 = $732,000 ($30.50, price $61). Example A.4: break-even 600,000 + 5.5N = 1500 + 18.5N → N = 46,039 units (1919 per month over 2 years). Example A.5: at 1000/month, 47 months (almost 4 years), by when the product is likely obsolete. Buy chips from distributors (Digikey; Jameco and All Electronics for hobbyists) unless ordering tens of thousands.",
    steps: [
      { k: "learn", title: "Two kinds of cost", b: [
        `<div class="two"><div class="tile"><h3>NRE (nonrecurring)</h3><p>Paid once: designers (~$200,000/year each, fully loaded, in 2012), tools, masks, the first working unit.</p></div><div class="tile"><h3>Recurring</h3><p>Paid per unit: chips, boards, manufacturing, marketing, support, shipping.</p></div></div>`,
        `<p>The price must also cover overhead (rent, taxes, the CEO and the janitor) and still leave a profit.</p>`,
        seenV("Design economics in more depth.", "14-methodology.html", "Chapter 14"),
      ]},
      { k: "play", title: "ASIC or FPGA?", b: [
        `<p>The book's Ben Bitdiddle: FPGA = $1,500 kit + $17 per chip; ASIC = $600,000 masks + $4 per chip; $1.50 board either way; 1000 units/month for 2 years.</p>`,
        `<p>Predict: is the ASIC's $13 saving per unit worth $600,000 up front at 24,000 units?</p>`,
        breakeven,
        `<p>Not even close: about $18.56 per unit for the FPGA vs $30.50 for the ASIC. The lines cross at ~46,000 units, which at 1000 a month is almost four years, by when the product is probably obsolete. Notice the $1.50 board doesn't move the break-even at all: costs paid the same either way cancel.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Masks $400,000 and $3 per ASIC; FPGA kit $2,000 and $11 per FPGA; $2 board either way. Break-even volume (units)?", a: 49750, tol: 0.001, why: "400,000 + 5N = 2,000 + 13N → 8N = 398,000 → N = 49,750." },
        { t: "mcq", q: "Which change pulls the break-even volume <i>down</i> the most?", opts: [["FPGA price rises from $11 to $21", true, "The per-unit gap grows from $8 to $18: N ≈ 398,000/18 ≈ 22,000."], ["The board price doubles", false, "Same for both: it cancels."], ["Sales per month double", false, "That changes how fast you reach break-even, not where it is."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do low-volume products almost always use FPGAs even though each FPGA costs more than an ASIC chip?", model: "An ASIC's large one-time mask and design cost has to be spread over every unit sold. At low volume each unit carries a big share of it, so the total per-unit cost ends up higher than the FPGA's, even though the ASIC chip itself is cheaper. The ASIC only wins once the volume is high enough that the per-unit savings add up to more than the extra NRE." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "hhA", eyebrow: "Harris & Harris · Appendix A", title: "Digital System Implementation",
    intro: `<p>Thirteen parts on turning a design into real hardware: 74xx chips, programmable logic, FPGAs and ASICs, how to read a data sheet, logic families and their voltage levels, packages and boards, the transmission lines between chips, and the money.</p><p>You'll read pinouts, drive a 74138, fit logic into an FPGA's clock cycle, check whether one logic family can drive another, bounce waves down a transmission line, and find where an ASIC beats an FPGA. Arrow keys ← → move between steps.</p>`,
    after: `<p>This appendix has no exercises in the book. The best practice is hands-on: download the data sheet of a real chip (try the 74HC138 or 74LVC244) and find its absolute maximums, its V<sub>IH</sub>/V<sub>OH</sub> at your supply, its t<sub>pd</sub> and the load that delay assumes.</p><p>Questions? Ask Claude, and you'll get a guiding question first.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13],
    summary: `
      <h3>Building blocks</h3>
      <p>74xx SSI (14-pin DIP, V<sub>DD</sub> pin 14, GND pin 7) and MSI chips; active-low pins. PROM = lookup table (2<sup>N</sup> × M); PLA = AND/OR planes; PLD (22V10) adds registers. FPGA: LUT + flop LEs, flow entry → verify → synthesize → map → place & route → timing → configure; T<sub>c</sub> ≥ t<sub>pcq</sub> + N(t<sub>LE</sub> + t<sub>wire</sub>) + t<sub>setup</sub>. ASIC: faster, smaller, masks + fab + test (yield 50–90%).</p>
      <h3>Data sheets and families</h3>
      <p>SN74HC04N = maker/temp, family, function, package. Absolute max vs recommended. T<sub>J</sub> = T<sub>A</sub> + Pθ<sub>JA</sub>. t<sub>pd</sub> 50%→50%, rise 10%→90%, at a rated C<sub>L</sub>. P = ½N(C<sub>pd</sub> + C<sub>L</sub>)V<sup>2</sup>f + I<sub>CC</sub>V. TTL levels 2/0.8/2.4/0.5 V; CMOS 3.15/1.35/3.8/0.44 V; HCT bridges them. Low-voltage LVC, ALVC, AUC.</p>
      <h3>Packaging</h3>
      <p>Through-hole DIP, PGA; SMT TSOP, PLCC, QFP, BGA. Breadboards: rows of 5. PCBs: FR4, traces, vias, power/ground planes.</p>
      <h3>Transmission lines</h3>
      <p>v ≈ 15 cm/ns on PCB, t<sub>d</sub> = l/v, Z<sub>0</sub> = √(L/C). Needed when t<sub>d</sub> &gt; 20% of the edge. Incident V<sub>S</sub>Z<sub>0</sub>/(Z<sub>0</sub> + Z<sub>S</sub>); k<sub>r</sub> = (Z<sub>T</sub> − Z<sub>0</sub>)/(Z<sub>T</sub> + Z<sub>0</sub>): open +1, short −1, matched 0. Parallel termination (power, buses) vs series (no DC power, point-to-point).</p>
      <h3>Economics</h3>
      <p>Total = NRE + N × recurring. Break-even N = ΔNRE / Δ(unit cost).</p>`,
  };
  Course.start(window.CHAPTER);
})();
