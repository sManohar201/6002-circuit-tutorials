/* Shared drawing and logic helpers for the digital books (Patt & Patel, Harris & Harris, CMOS VLSI).
   Loaded after engine.js on those books' chapter pages: window.Digital. */
window.Digital = (function () {
  const { S, el } = Course;

  /* ---------- bit patterns ---------- */
  const bits = (v, k) => { const m = 2 ** k; return (((v % m) + m) % m).toString(2).padStart(k, "0"); };
  const uval = (b) => parseInt(b, 2);
  const sval = (b) => (b[0] === "1" ? uval(b) - 2 ** b.length : uval(b));
  const flip = (b) => b.replace(/[01]/g, (c) => (c === "0" ? "1" : "0"));
  const hex = (b) => b.padStart(Math.ceil(b.length / 4) * 4, "0").match(/.{4}/g).map((g) => uval(g).toString(16).toUpperCase()).join("");

  /* Row of bit boxes (SVG string). o.top: labels above; o.hot: highlighted indices from the left; o.sign: tint the leftmost box;
     o.w box size; o.W svg width to centre in; o.y top edge; o.x0 left edge (overrides centring). */
  function bitRow(b, o = {}) {
    const k = b.length, w = o.w || Math.min(40, 400 / k), x0 = o.x0 != null ? o.x0 : (o.W || 420) / 2 - (k * w) / 2, y = o.y || 34;
    let s = "";
    b.split("").forEach((c, i) => {
      const hot = o.hot && o.hot.includes(i), sg = o.sign && i === 0;
      s += `<rect x="${x0 + i * w}" y="${y}" width="${w}" height="${w}" style="fill:${hot ? "var(--accent-soft)" : sg ? "var(--cool-soft)" : "var(--card)"};stroke:var(--ink)"/>`;
      s += S.t(x0 + i * w + w / 2, y + w * 0.68, c, { cls: (w > 30 ? "big " : w < 20 ? "s " : "") + "m" });
      if (o.top) s += S.t(x0 + i * w + w / 2, y - 8, o.top[i], { cls: "s" });
    });
    return s;
  }
  /* Clickable bit buttons: { el, get(), set(str) }. onChange(str) after each click. */
  function bitButtons(init, onChange, o = {}) {
    const row = el(`<div class="row" role="group" aria-label="${o.label || "bits"}" style="gap:4px"></div>`);
    let b = init.split("");
    const btns = b.map((c, i) => {
      const btn = el(`<button type="button" class="btn small mono" style="min-width:34px;padding:6px 0">${c}</button>`);
      btn.setAttribute("aria-pressed", String(c === "1"));
      btn.addEventListener("click", () => { b[i] = b[i] === "1" ? "0" : "1"; btn.textContent = b[i]; btn.setAttribute("aria-pressed", String(b[i] === "1")); onChange(b.join("")); });
      row.appendChild(btn);
      return btn;
    });
    return { el: row, get: () => b.join(""), set(str) { b = str.split(""); btns.forEach((x, i) => { x.textContent = b[i]; x.setAttribute("aria-pressed", String(b[i] === "1")); }); onChange(str); } };
  }

  /* ---------- truth tables ---------- */
  /* Every input combination of n variables in counting order, as arrays of 0/1. */
  const combos = (n) => Array.from({ length: 2 ** n }, (_, r) => bits(r, n).split("").map(Number));
  /* HTML truth table. ins: input names; outs: output names; f(row) -> array of outputs (or one value). o.hot: highlighted row. */
  function truthTable(ins, outs, f, o = {}) {
    const rows = combos(ins.length).map((r, i) => {
      const y = [].concat(f(r));
      return `<tr${o.hot === i ? ' style="background:var(--accent-soft)"' : ""}>${r.map((v) => `<td class="mono">${v}</td>`).join("")}${y.map((v) => `<td class="mono"><b>${v}</b></td>`).join("")}</tr>`;
    }).join("");
    return `<div class="tbl"><table><thead><tr>${ins.map((n) => `<th>${n}</th>`).join("")}${outs.map((n) => `<th>${n}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  /* ---------- gate symbols ---------- */
  /* Gate symbol with input leads. kind: and|or|nand|nor|xor|xnor|not|buf. Left edge of the body at x, centre y, n inputs.
     Returns { s, ins: [[x,y]...], out: [x,y] }. o.cls styles the body; o.label writes inside. */
  function gate(kind, x, y, n = 2, o = {}) {
    const c = o.cls ? " " + o.cls : "", one = kind === "not" || kind === "buf", base = kind.replace(/^x?n(?=and|or)/, "").replace("xnor", "xor");
    let s = "";
    if (kind === "xor" || kind === "xnor") {
      s += S.gate("or", x + 8, y, { cls: o.cls });
      s += `<path class="w${c}" d="M${x} ${y - 20} Q${x + 12} ${y} ${x} ${y + 20}" style="fill:none"/>`;
      if (kind === "xnor") s += `<circle class="el${c}" cx="${x + 68}" cy="${y}" r="5"/>`;
    } else s += S.gate(kind, x, y, { cls: o.cls });
    const tipX = kind === "xor" ? x + 63 : kind === "xnor" ? x + 73 : S.gateOut(kind, x);
    const ins = [];
    const m = one ? 1 : n, sp = m === 1 ? 0 : Math.min(20, 34 / (m - 1));
    for (let i = 0; i < m; i++) {
      const yy = y + (i - (m - 1) / 2) * sp, xi = x - 22;
      const bodyX = base === "or" || kind === "xor" || kind === "xnor" ? x + 4 + (kind.includes("xor") ? 4 : 0) : x;
      s += `<line class="w${c}" x1="${xi}" y1="${yy}" x2="${bodyX}" y2="${yy}"/>`;
      ins.push([xi, yy]);
    }
    if (o.label) s += S.t(x + 22, y + 5, o.label, { cls: "s m" });
    return { s, ins, out: [tipX, y] };
  }

  /* ---------- timing diagrams ---------- */
  /* sigs: [{ name, v: [0/1 or string per slot] , cls }]. o.dx slot width, o.x0 left edge for waves, o.h row height, o.marks: [{t, label}] vertical lines at slot t.
     Strings draw as a bus (hexagon-ish lanes with the value written). Returns an SVG string. */
  function wave(sigs, o = {}) {
    const dx = o.dx || 34, x0 = o.x0 || 70, h = o.h || 40, n = Math.max(...sigs.map((g) => g.v.length)), W = o.W || x0 + n * dx + 16, H = sigs.length * h + 22;
    let s = "";
    for (let t = 0; t <= n; t++) s += `<line x1="${x0 + t * dx}" y1="8" x2="${x0 + t * dx}" y2="${H - 14}" style="stroke:var(--line);stroke-width:1"/>`;
    sigs.forEach((g, r) => {
      const yb = 14 + r * h + h - 12, yt = 14 + r * h + 4, ym = (yb + yt) / 2;
      s += S.t(x0 - 10, ym + 5, g.name, { a: "end", cls: "s" });
      const cls = g.cls || "";
      if (g.v.some((v) => typeof v === "string")) {
        g.v.forEach((v, t) => {
          const a = x0 + t * dx, b = a + dx, prev = t > 0 ? g.v[t - 1] : null, ch = t === 0 || v !== prev, e = 5;
          if (v === "x" || v === "X") s += `<rect x="${a}" y="${yt}" width="${dx}" height="${yb - yt}" style="fill:var(--line);opacity:.5"/>`;
          s += `<line class="w ${cls}" x1="${a + (ch ? e : 0)}" y1="${yt}" x2="${b}" y2="${yt}" style="stroke-width:2"/><line class="w ${cls}" x1="${a + (ch ? e : 0)}" y1="${yb}" x2="${b}" y2="${yb}" style="stroke-width:2"/>`;
          if (ch) s += `<polyline class="w ${cls}" points="${a},${ym} ${a + e},${yt}" style="stroke-width:2"/><polyline class="w ${cls}" points="${a},${ym} ${a + e},${yb}" style="stroke-width:2"/>`;
          if (ch && v !== "x" && v !== "X") { let k = t + 1; while (k < g.v.length && g.v[k] === v) k++; s += S.t((a + x0 + k * dx) / 2 + 2, ym + 5, String(v), { cls: "s" }); }
        });
      } else {
        let pts = [];
        g.v.forEach((v, t) => { const y = v ? yt : yb; pts.push([x0 + t * dx, y], [x0 + (t + 1) * dx, y]); });
        s += `<polyline class="w ${cls}" points="${pts.map((p) => p.join(",")).join(" ")}" style="stroke-width:2.2"/>`;
      }
    });
    (o.marks || []).forEach((m) => { const x = x0 + m.t * dx; s += `<line x1="${x}" y1="6" x2="${x}" y2="${H - 10}" style="stroke:var(--accent);stroke-width:2;stroke-dasharray:5 4"/>` + (m.label ? S.t(x + 4, H - 2, m.label, { a: "start", cls: "s a" }) : ""); });
    return S.svg(W, H, s, { max: W, label: o.label || "Timing diagram" });
  }

  /* ---------- CMOS gate schematics ---------- */
  /* Each takes input values (0/1) and returns an SVG string with ON transistors and the conducting path highlighted.
     Transistor helper: S.nmos(x, y, { p }) has gate at (x−30, y), top terminal (x+14, y−40), bottom (x+14, y+40). */
  const on = (isP, v) => (isP ? v === 0 : v === 1);
  const T = (x, y, p, v, lab) => S.nmos(x, y, { p, cls: on(p, v) ? "hl" : "dim" }) + S.t(x - 36, y + 5, lab, { a: "end", cls: "s" });
  const rail = (x1, x2, y, lab) => `<line class="w" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" style="stroke-width:3"/>` + S.t(x2 + 6, y + 5, lab, { a: "start", cls: "s" });
  const outLine = (x, y, x2, val) => `<line class="w" x1="${x}" y1="${y}" x2="${x2}" y2="${y}"/>` + S.dot(x, y) + S.t(x2 + 6, y + 5, `Y = ${val}`, { a: "start", cls: "big" });
  function inverter(a) {
    let s = rail(160, 240, 24, "V_DD") + S.wire([200, 40], [200, 24]) + T(186, 80, true, a, "A") + S.wire([200, 120], [200, 140]) + T(186, 180, false, a, "A") + S.gnd(200, 220);
    s += outLine(200, 130, 280, 1 - a);
    return S.svg(380, 250, s, { max: 380, label: "CMOS inverter with the ON transistor highlighted" });
  }
  function nand2(a, b) {
    let s = rail(150, 300, 24, "V_DD") + S.wire([180, 40], [180, 24]) + S.wire([280, 40], [280, 24]);
    s += T(166, 80, true, a, "A") + T(266, 80, true, b, "B");
    s += S.wire([180, 120], [180, 140], [280, 140], [280, 120]) + S.wire([230, 140], [230, 150]);
    s += T(216, 190, false, a, "A") + S.wire([230, 230], [230, 240]) + T(216, 280, false, b, "B") + S.gnd(230, 320);
    s += outLine(280, 140, 330, a & b ? 0 : 1);
    return S.svg(420, 350, s, { max: 420, label: "CMOS two-input NAND gate with ON transistors highlighted" });
  }
  function nor2(a, b) {
    let s = rail(190, 270, 20, "V_DD") + S.wire([230, 30], [230, 20]);
    s += T(216, 70, true, a, "A") + S.wire([230, 110], [230, 120]) + T(216, 160, true, b, "B") + S.wire([230, 200], [230, 210]);
    s += S.wire([180, 220], [180, 210], [280, 210], [280, 220]);
    s += T(166, 260, false, a, "A") + T(266, 260, false, b, "B");
    s += S.wire([180, 300], [180, 310], [280, 310], [280, 300]) + S.gnd(230, 310);
    s += outLine(280, 210, 330, a | b ? 0 : 1);
    return S.svg(420, 340, s, { max: 420, label: "CMOS two-input NOR gate with ON transistors highlighted" });
  }

  /* ---------- state diagrams ---------- */
  /* nodes: [{ id, x, y, label, sub }]; edges: [{ from, to, label, bend (px, + bends left of travel), ang (self-loop direction in degrees, default −90 = up) }].
     o.cur: highlighted node id; o.r node radius; o.W, o.H svg size. Returns an SVG string. */
  function fsm(nodes, edges, o = {}) {
    const R = o.r || 26, N = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const unit = (x, y) => { const L = Math.hypot(x, y) || 1; return [x / L, y / L]; };
    const head = (x, y, ux, uy, hot) => `<polygon points="${x},${y} ${x - 10 * ux + 5 * uy},${y - 10 * uy - 5 * ux} ${x - 10 * ux - 5 * uy},${y - 10 * uy + 5 * ux}" style="fill:${hot ? "var(--accent)" : "var(--ink)"}"/>`;
    let s = "";
    edges.forEach((e) => {
      const a = N[e.from], b = N[e.to], hot = o.hotEdge && o.hotEdge === e, st = hot ? "stroke:var(--accent);stroke-width:3" : "stroke:var(--ink);stroke-width:1.8";
      if (a === b) {
        const g = ((e.ang != null ? e.ang : -90) * Math.PI) / 180, d1 = g - 0.45, d2 = g + 0.45;
        const p1 = [a.x + R * Math.cos(d1), a.y + R * Math.sin(d1)], p2 = [a.x + R * Math.cos(d2), a.y + R * Math.sin(d2)];
        const c1 = [a.x + 2.6 * R * Math.cos(d1 - 0.25), a.y + 2.6 * R * Math.sin(d1 - 0.25)], c2 = [a.x + 2.6 * R * Math.cos(d2 + 0.25), a.y + 2.6 * R * Math.sin(d2 + 0.25)];
        const [ux, uy] = unit(p2[0] - c2[0], p2[1] - c2[1]);
        s += `<path d="M${p1} C${c1} ${c2} ${p2}" style="fill:none;${st}"/>` + head(p2[0], p2[1], ux, uy, hot);
        if (e.label) s += S.t(a.x + 2.45 * R * Math.cos(g), a.y + 2.45 * R * Math.sin(g) + 4 + (Math.sin(g) < -0.5 ? -4 : 6), e.label, { cls: "s" });
      } else {
        const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, bend = e.bend || 0;
        const c = [(a.x + b.x) / 2 + nx * bend, (a.y + b.y) / 2 + ny * bend];
        const [sx, sy] = unit(c[0] - a.x, c[1] - a.y), [ex, ey] = unit(c[0] - b.x, c[1] - b.y);
        const p1 = [a.x + R * sx, a.y + R * sy], p2 = [b.x + R * ex, b.y + R * ey];
        const [ux, uy] = unit(p2[0] - c[0], p2[1] - c[1]);
        s += `<path d="M${p1} Q${c} ${p2}" style="fill:none;${st}"/>` + head(p2[0], p2[1], ux, uy, hot);
        if (e.label) { const mx = 0.25 * p1[0] + 0.5 * c[0] + 0.25 * p2[0], my = 0.25 * p1[1] + 0.5 * c[1] + 0.25 * p2[1], off = e.lo != null ? e.lo : 12, sg = bend >= 0 ? 1 : -1; s += S.t(mx + nx * off * sg, my + ny * off * sg + 4, e.label, { cls: "s" }); }
      }
    });
    nodes.forEach((n) => {
      const hot = o.cur === n.id;
      s += `<circle cx="${n.x}" cy="${n.y}" r="${R}" style="fill:${hot ? "var(--accent-soft)" : "var(--card)"};stroke:${hot ? "var(--accent)" : "var(--ink)"};stroke-width:${hot ? 3 : 2}"/>`;
      s += S.t(n.x, n.y + (n.sub ? 0 : 5), n.label, { cls: hot ? "b" : "" });
      if (n.sub) s += S.t(n.x, n.y + 15, n.sub, { cls: "s m" });
    });
    return S.svg(o.W || 420, o.H || 260, s, { max: o.W || 420, label: o.label || "State diagram" });
  }

  /* ---------- logic minimization (Quine–McCluskey + smallest cover) ---------- */
  /* n variables; ones, dcs: arrays of minterm numbers. Returns implicant patterns like "1-0" (one char per variable, msb first),
     the smallest set that covers every 1, ties broken by fewest literals. */
  function minimize(n, ones, dcs = []) {
    if (!ones.length) return [];
    if (ones.length + dcs.length === 2 ** n) return ["-".repeat(n)];
    let cur = [...new Set([...ones, ...dcs])].map((m) => bits(m, n));
    const primes = new Set();
    while (cur.length) {
      const used = new Set(), next = new Set();
      for (let i = 0; i < cur.length; i++) for (let j = i + 1; j < cur.length; j++) {
        const a = cur[i], b = cur[j];
        let d = -1, ok = true;
        for (let k = 0; k < n && ok; k++) if (a[k] !== b[k]) { if (a[k] === "-" || b[k] === "-" || d >= 0) ok = false; else d = k; }
        if (ok && d >= 0) { next.add(a.slice(0, d) + "-" + a.slice(d + 1)); used.add(a); used.add(b); }
      }
      cur.forEach((t) => { if (!used.has(t)) primes.add(t); });
      cur = [...next];
    }
    const covers = (p, m) => { const b = bits(m, n); for (let k = 0; k < n; k++) if (p[k] !== "-" && p[k] !== b[k]) return false; return true; };
    const P = [...primes].filter((p) => ones.some((m) => covers(p, m)));
    const lits = (p) => p.replace(/-/g, "").length;
    let best = null;
    for (let mask = 1; mask < 1 << P.length; mask++) {
      const pick = P.filter((_, i) => mask & (1 << i));
      if (best && pick.length > best.length) continue;
      if (!ones.every((m) => pick.some((p) => covers(p, m)))) continue;
      if (!best || pick.length < best.length || pick.reduce((s, p) => s + lits(p), 0) < best.reduce((s, p) => s + lits(p), 0)) best = pick;
    }
    return best || P;
  }
  /* Implicant pattern → text with combining overlines: "1-0" with names ABC → "AC̅". */
  const implText = (p, names) => p.split("").map((c, i) => (c === "-" ? "" : names[i] + (c === "0" ? "̅" : ""))).join("") || "1";
  const implCovers = (p, m) => { const b = bits(m, p.length); for (let k = 0; k < p.length; k++) if (p[k] !== "-" && p[k] !== b[k]) return false; return true; };

  /* ---------- code listings ---------- */
  const SVKW = /\b(module|endmodule|input|output|logic|tri|assign|always_ff|always_comb|always_latch|always|posedge|negedge|if|else|case|casez|endcase|default|begin|end|typedef|enum|parameter|genvar|generate|endgenerate|for|initial|signed|assert|integer)\b/g;
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  /* SystemVerilog listing with keywords, numbers and // comments coloured. o.hl: line numbers (1-based) to highlight. */
  function sv(code, o = {}) {
    const lines = code.replace(/^\n/, "").split("\n").map((ln, i) => {
      const k = ln.indexOf("//"), body = k >= 0 ? ln.slice(0, k) : ln, cm = k >= 0 ? ln.slice(k) : "";
      let h = esc(body).replace(SVKW, '<span class="kw">$1</span>').replace(/(\d+'[bodh][0-9a-fA-FxzXZ_?]+|'[01])/g, '<span class="nm">$1</span>');
      h += cm ? `<span class="cm">${esc(cm)}</span>` : "";
      return o.hl && o.hl.includes(i + 1) ? `<span class="hl">${h}</span>` : h;
    });
    return `<pre class="code">${lines.join("\n")}</pre>`;
  }
  /* Plain listing (assembly, C): escaped; comments (from o.comment, default ";") muted. */
  function listing(code, o = {}) {
    const c = o.comment || ";";
    const lines = code.replace(/^\n/, "").split("\n").map((ln, i) => {
      const k = ln.indexOf(c), h = esc(k >= 0 ? ln.slice(0, k) : ln) + (k >= 0 ? `<span class="cm">${esc(ln.slice(k))}</span>` : "");
      return o.hl && o.hl.includes(i + 1) ? `<span class="hl">${h}</span>` : h;
    });
    return `<pre class="code">${lines.join("\n")}</pre>`;
  }

  /* ---------- series–parallel switch networks (static CMOS) ----------
     tree: "A" (one transistor driven by input A) | { s: [...] } (series) | { p: [...] } (parallel).
     v: { A: 0/1, ... }. isP: pMOS (ON when its input is 0). */
  const spOn = (t, v, isP) => (typeof t === "string" ? (isP ? !v[t] : !!v[t]) : t.s ? t.s.every((c) => spOn(c, v, isP)) : t.p.some((c) => spOn(c, v, isP)));
  const spDual = (t) => (typeof t === "string" ? t : t.s ? { p: t.s.map(spDual) } : { s: t.p.map(spDual) });
  const spCount = (t) => (typeof t === "string" ? 1 : (t.s || t.p).reduce((n, c) => n + spCount(c), 0));
  function spSize(t) {
    if (typeof t === "string") return { w: 50, h: 46 };
    const cs = (t.s || t.p).map(spSize);
    return t.s ? { w: Math.max(...cs.map((c) => c.w)), h: cs.reduce((a, c) => a + c.h, 0) } : { w: cs.reduce((a, c) => a + c.w, 0), h: Math.max(...cs.map((c) => c.h)) };
  }
  const ln = (x1, y1, x2, y2, cls) => `<line class="w${cls ? " " + cls : ""}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  /* Draw the network with its top terminal at (cx, y). */
  function spDraw(t, cx, y, v, isP) {
    const sz = spSize(t);
    if (typeof t === "string") {
      const on = isP ? !v[t] : !!v[t], cls = on ? "hl" : "dim";
      let s = ln(cx, y, cx, y + 8, cls) + `<rect x="${cx - 17}" y="${y + 8}" width="34" height="30" rx="5" style="fill:${on ? "var(--accent-soft)" : "var(--card)"};stroke:${on ? "var(--accent)" : "var(--line)"};stroke-width:2"/>` + ln(cx, y + 38, cx, y + 46, cls);
      s += S.t(cx + (isP ? 4 : 0), y + 28, t, { cls: on ? "b" : "m" });
      if (isP) s += `<circle cx="${cx - 9}" cy="${y + 23}" r="4" style="fill:var(--card);stroke:${on ? "var(--accent)" : "var(--line)"};stroke-width:1.5"/>`;
      return s;
    }
    if (t.s) { let yy = y, s = ""; t.s.forEach((c) => { s += spDraw(c, cx, yy, v, isP); yy += spSize(c).h; }); return s; }
    let s = "", x = cx - sz.w / 2;
    const xs = [];
    t.p.forEach((c) => { const cs = spSize(c), ccx = x + cs.w / 2; xs.push(ccx); s += spDraw(c, ccx, y, v, isP); if (cs.h < sz.h) s += ln(ccx, y + cs.h, ccx, y + sz.h); x += cs.w; });
    return s + ln(xs[0], y, xs[xs.length - 1], y) + ln(xs[0], y + sz.h, xs[xs.length - 1], y + sz.h);
  }
  /* A static CMOS gate: pull-up (pMOS, default = dual of pd) from V_DD to Y, pull-down (nMOS) from Y to GND.
     Returns { svg, y } where y is 1, 0, "Z" (both off) or "X" (both on). */
  function cmosGate(pd, v, o = {}) {
    const pu = o.pu || spDual(pd), su = spSize(pu), sd = spSize(pd), W = Math.max(300, Math.max(su.w, sd.w) + 200), cx = W / 2 - 20;
    const upOn = spOn(pu, v, true), dnOn = spOn(pd, v, false), y = upOn && !dnOn ? 1 : dnOn && !upOn ? 0 : upOn ? "X" : "Z";
    const top = 34, yo = top + su.h + 14, bot = yo + 14 + sd.h;
    let s = `<line class="w" x1="${cx - 60}" y1="20" x2="${cx + 60}" y2="20" style="stroke-width:3"/>` + S.t(cx + 66, 25, "V_DD", { a: "start", cls: "s" }) + ln(cx, 20, cx, top);
    s += spDraw(pu, cx, top, v, true) + ln(cx, top + su.h, cx, yo) + ln(cx, yo, cx, yo + 14) + spDraw(pd, cx, yo + 14, v, false) + ln(cx, bot, cx, bot + 6) + S.gnd(cx, bot + 6);
    s += S.dot(cx, yo) + ln(cx, yo, cx + Math.max(su.w, sd.w) / 2 + 40, yo) + S.t(cx + Math.max(su.w, sd.w) / 2 + 46, yo + 6, "Y = " + y, { a: "start", cls: "big" + (y === "X" || y === "Z" ? " b" : "") });
    s += S.t(16, top + su.h / 2, "pull-up", { a: "start", cls: "s c" }) + S.t(16, top + su.h / 2 + 15, "(pMOS)", { a: "start", cls: "s m" }) + S.t(16, yo + 14 + sd.h / 2, "pull-down", { a: "start", cls: "s c" }) + S.t(16, yo + 14 + sd.h / 2 + 15, "(nMOS)", { a: "start", cls: "s m" });
    return { svg: S.svg(W, bot + 30, s, { max: W, label: "Static CMOS gate with ON transistors highlighted" }), y };
  }

  return { spOn, spDual, spCount, cmosGate, sv, listing, bits, uval, sval, flip, hex, bitRow, bitButtons, combos, truthTable, gate, wave, inverter, nand2, nor2, fsm, minimize, implText, implCovers };
})();
