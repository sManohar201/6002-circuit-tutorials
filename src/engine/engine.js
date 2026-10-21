/* Course engine: chapter map -> parts -> one-card steps. Content files call Course.start(CHAPTER). */
window.Course = (function () {
  const reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const el = (html) => { const t = document.createElement("template"); t.innerHTML = String(html).trim(); return t.content.firstElementChild; };

  /* ---------- number formatting ---------- */
  function fmt(n, d = 3) {
    if (n === Infinity) return "∞";
    if (n === -Infinity) return "−∞";
    if (!isFinite(n)) return "—";
    const a = Math.abs(n);
    let s = a !== 0 && (a < 1e-3 || a >= 1e6) ? n.toExponential(2) : String(+n.toPrecision(d));
    return s.replace("-", "−");
  }
  function si(n, unit, d = 3) {
    if (!isFinite(n)) return (n < 0 ? "−∞ " : "∞ ") + unit;
    if (n === 0) return "0 " + unit;
    const P = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"]];
    const a = Math.abs(n);
    for (const [v, p] of P) if (a >= v * 0.99995) return fmt(n / v, d) + " " + p + unit;
    return fmt(n / 1e-12, d) + " p" + unit;
  }

  /* ---------- schematic drawing helpers (SVG strings) ---------- */
  const S = {
    svg(w, h, inner, o = {}) {
      return `<svg class="sch" viewBox="0 0 ${w} ${h}" style="max-width:${o.max || w}px" role="img" aria-label="${o.label || "Circuit diagram"}">${inner}</svg>`;
    },
    wire(...pts) { return `<polyline class="w${pts.cls ? " " + pts.cls : ""}" points="${pts.map((p) => p.join(",")).join(" ")}"/>`; },
    wc(cls, ...pts) { return `<polyline class="w ${cls}" points="${pts.map((p) => p.join(",")).join(" ")}"/>`; },
    res(x1, y1, x2, y2, label, o = {}) {
      const horiz = y1 === y2, L = horiz ? x2 - x1 : y2 - y1, s = Math.sign(L) || 1, AL = Math.abs(L);
      const body = Math.min(40, AL - 8), a = (AL - body) / 2;
      const P = (t, off) => (horiz ? [x1 + s * t, y1 + off] : [x1 + off, y1 + s * t]);
      const pts = [P(0, 0), P(a, 0)];
      for (let k = 0; k < 6; k++) pts.push(P(a + (body * (k + 0.5)) / 6, (k % 2 ? -1 : 1) * 7));
      pts.push(P(a + body, 0), P(AL, 0));
      let out = `<path class="w${o.cls ? " " + o.cls : ""}" d="M${pts.map((p) => p.join(" ")).join(" L")}"/>`;
      if (label) {
        const m = P(AL / 2, 0);
        let lx, ly, an;
        if (horiz) { lx = m[0]; ly = o.side === "below" ? m[1] + 26 : m[1] - 14; an = "middle"; }
        else { lx = o.side === "left" ? m[0] - 14 : m[0] + 14; ly = m[1] + 5; an = o.side === "left" ? "end" : "start"; }
        out += `<text x="${lx}" y="${ly}" text-anchor="${an}" class="${o.tcls || ""}">${label}</text>`;
      }
      return out;
    },
    vsrc(cx, cy, label, o = {}) {
      const top = o.flip ? "−" : "+", bot = o.flip ? "+" : "−";
      let out = `<circle class="el${o.cls ? " " + o.cls : ""}" cx="${cx}" cy="${cy}" r="18"/>`;
      out += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" class="s">${top}</text><text x="${cx}" y="${cy + 13}" text-anchor="middle" class="s">${bot}</text>`;
      if (label) out += `<text x="${o.side === "right" ? cx + 26 : cx - 26}" y="${cy + 5}" text-anchor="${o.side === "right" ? "start" : "end"}" class="${o.tcls || ""}">${label}</text>`;
      return out;
    },
    isrc(cx, cy, label, o = {}) {
      const d = o.down ? 1 : -1;
      let out = `<circle class="el${o.cls ? " " + o.cls : ""}" cx="${cx}" cy="${cy}" r="18"/>`;
      out += `<line class="w" x1="${cx}" y1="${cy - d * 10}" x2="${cx}" y2="${cy + d * 6}"/><polygon class="nd" points="${cx - 5},${cy + d * 4} ${cx + 5},${cy + d * 4} ${cx},${cy + d * 11}"/>`;
      if (label) out += `<text x="${o.side === "right" ? cx + 26 : cx - 26}" y="${cy + 5}" text-anchor="${o.side === "right" ? "start" : "end"}" class="${o.tcls || ""}">${label}</text>`;
      return out;
    },
    dep(cx, cy, label, o = {}) {
      let out = `<polygon class="el${o.cls ? " " + o.cls : ""}" points="${cx},${cy - 22} ${cx + 17},${cy} ${cx},${cy + 22} ${cx - 17},${cy}"/>`;
      if (o.kind === "v") out += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" class="s">+</text><text x="${cx}" y="${cy + 13}" text-anchor="middle" class="s">−</text>`;
      else {
        const d = o.down ? 1 : -1;
        out += `<line class="w" x1="${cx}" y1="${cy - d * 10}" x2="${cx}" y2="${cy + d * 6}"/><polygon class="nd" points="${cx - 5},${cy + d * 4} ${cx + 5},${cy + d * 4} ${cx},${cy + d * 11}"/>`;
      }
      if (label) out += `<text x="${o.side === "left" ? cx - 26 : cx + 26}" y="${cy + 5}" text-anchor="${o.side === "left" ? "end" : "start"}" class="${o.tcls || ""}">${label}</text>`;
      return out;
    },
    // Capacitor between two points on a horizontal or vertical line: two plates in the middle.
    cap(x1, y1, x2, y2, label, o = {}) {
      const horiz = y1 === y2, m = horiz ? (x1 + x2) / 2 : (y1 + y2) / 2, s = Math.sign(horiz ? x2 - x1 : y2 - y1) || 1, g = 5, c = o.cls ? " " + o.cls : "";
      let out = horiz
        ? `<line class="w${c}" x1="${x1}" y1="${y1}" x2="${m - s * g}" y2="${y1}"/><line class="w${c}" x1="${m + s * g}" y1="${y1}" x2="${x2}" y2="${y1}"/><line class="w${c}" x1="${m - g}" y1="${y1 - 16}" x2="${m - g}" y2="${y1 + 16}" style="stroke-width:3.5"/><line class="w${c}" x1="${m + g}" y1="${y1 - 16}" x2="${m + g}" y2="${y1 + 16}" style="stroke-width:3.5"/>`
        : `<line class="w${c}" x1="${x1}" y1="${y1}" x2="${x1}" y2="${m - s * g}"/><line class="w${c}" x1="${x1}" y1="${m + s * g}" x2="${x1}" y2="${y2}"/><line class="w${c}" x1="${x1 - 16}" y1="${m - g}" x2="${x1 + 16}" y2="${m - g}" style="stroke-width:3.5"/><line class="w${c}" x1="${x1 - 16}" y1="${m + g}" x2="${x1 + 16}" y2="${m + g}" style="stroke-width:3.5"/>`;
      if (label) out += horiz ? `<text x="${m}" y="${o.side === "below" ? y1 + 34 : y1 - 22}" text-anchor="middle" class="${o.tcls || ""}">${label}</text>` : `<text x="${o.side === "left" ? x1 - 24 : x1 + 24}" y="${m + 5}" text-anchor="${o.side === "left" ? "end" : "start"}" class="${o.tcls || ""}">${label}</text>`;
      return out;
    },
    // Inductor: four humps between two points on a horizontal or vertical line.
    ind(x1, y1, x2, y2, label, o = {}) {
      const horiz = y1 === y2, L = horiz ? x2 - x1 : y2 - y1, s = Math.sign(L) || 1, AL = Math.abs(L), body = Math.min(48, AL - 8), a = (AL - body) / 2, r = body / 8, c = o.cls ? " " + o.cls : "";
      let d;
      if (horiz) { d = `M${x1} ${y1} H${x1 + s * a}`; for (let k = 0; k < 4; k++) d += ` a${r} ${r} 0 0 ${s > 0 ? 1 : 0} ${s * 2 * r} 0`; d += ` H${x2}`; }
      else { d = `M${x1} ${y1} V${y1 + s * a}`; for (let k = 0; k < 4; k++) d += ` a${r} ${r} 0 0 ${s > 0 ? 1 : 0} 0 ${s * 2 * r}`; d += ` V${y2}`; }
      let out = `<path class="w${c}" d="${d}"/>`;
      const mx = horiz ? (x1 + x2) / 2 : x1, my = horiz ? y1 : (y1 + y2) / 2;
      if (label) out += horiz ? `<text x="${mx}" y="${o.side === "below" ? my + 30 : my - 16}" text-anchor="middle" class="${o.tcls || ""}">${label}</text>` : `<text x="${o.side === "left" ? mx - 18 : mx + 18}" y="${my + 5}" text-anchor="${o.side === "left" ? "end" : "start"}" class="${o.tcls || ""}">${label}</text>`;
      return out;
    },
    // Diode from (x1,y1) [anode] to (x2,y2) [cathode]; horizontal or vertical. The triangle points along the forward current.
    diode(x1, y1, x2, y2, label, o = {}) {
      const horiz = y1 === y2, s = Math.sign(horiz ? x2 - x1 : y2 - y1) || 1, m = horiz ? (x1 + x2) / 2 : (y1 + y2) / 2, c = o.cls ? " " + o.cls : "";
      let out;
      if (horiz) out = `<line class="w${c}" x1="${x1}" y1="${y1}" x2="${m - s * 9}" y2="${y1}"/><line class="w${c}" x1="${m + s * 9}" y1="${y1}" x2="${x2}" y2="${y1}"/><polygon class="el${c}" points="${m - s * 9},${y1 - 10} ${m - s * 9},${y1 + 10} ${m + s * 9},${y1}"/><line class="w${c}" x1="${m + s * 9}" y1="${y1 - 11}" x2="${m + s * 9}" y2="${y1 + 11}"/>`;
      else out = `<line class="w${c}" x1="${x1}" y1="${y1}" x2="${x1}" y2="${m - s * 9}"/><line class="w${c}" x1="${x1}" y1="${m + s * 9}" x2="${x1}" y2="${y2}"/><polygon class="el${c}" points="${x1 - 10},${m - s * 9} ${x1 + 10},${m - s * 9} ${x1},${m + s * 9}"/><line class="w${c}" x1="${x1 - 11}" y1="${m + s * 9}" x2="${x1 + 11}" y2="${m + s * 9}"/>`;
      if (label) {
        if (horiz) out += `<text x="${m}" y="${o.side === "below" ? y1 + 30 : y1 - 16}" text-anchor="middle">${label}</text>`;
        else out += `<text x="${o.side === "left" ? x1 - 18 : x1 + 18}" y="${m + 5}" text-anchor="${o.side === "left" ? "end" : "start"}">${label}</text>`;
      }
      return out;
    },
    // Logic gate with its left edge at x and vertical center y. kind: and|or|not|buf|nand|nor. Output tip at S.gateOut(kind, x).
    gate(kind, x, y, o = {}) {
      const c = o.cls ? " " + o.cls : "";
      let body;
      if (kind === "and" || kind === "nand") body = `<path class="el${c}" d="M${x} ${y - 20} H${x + 25} A20 20 0 0 1 ${x + 25} ${y + 20} H${x} Z"/>`;
      else if (kind === "or" || kind === "nor") body = `<path class="el${c}" d="M${x} ${y - 20} Q${x + 38} ${y - 20} ${x + 55} ${y} Q${x + 38} ${y + 20} ${x} ${y + 20} Q${x + 12} ${y} ${x} ${y - 20} Z"/>`;
      else body = `<path class="el${c}" d="M${x} ${y - 18} L${x + 40} ${y} L${x} ${y + 18} Z"/>`;
      const tip = { and: 45, nand: 45, or: 55, nor: 55, not: 40, buf: 40 }[kind];
      if (kind === "nand" || kind === "nor" || kind === "not") body += `<circle class="el${c}" cx="${x + tip + 5}" cy="${y}" r="5"/>`;
      if (o.label) body += `<text x="${x + 20}" y="${y + 5}" text-anchor="middle" class="s m">${o.label}</text>`;
      return body;
    },
    // n-channel MOSFET. Terminals: G (x-30, y), D (x+14, y-40), S (x+14, y+40). o.p = true draws a p-channel (bubble on the gate).
    nmos(x, y, o = {}) {
      const c = o.cls ? " " + o.cls : "";
      let s = `<line class="w${c}" x1="${x - 30}" y1="${y}" x2="${x - (o.p ? 20 : 10)}" y2="${y}"/>` + (o.p ? `<circle class="el${c}" cx="${x - 15}" cy="${y}" r="5"/>` : "") +
        `<line class="w${c}" x1="${x - 10}" y1="${y - 18}" x2="${x - 10}" y2="${y + 18}"/><line class="w${c}" x1="${x - 3}" y1="${y - 22}" x2="${x - 3}" y2="${y + 22}" style="stroke-width:3.5"/>` +
        `<polyline class="w${c}" points="${x - 3},${y - 14} ${x + 14},${y - 14} ${x + 14},${y - 40}"/><polyline class="w${c}" points="${x - 3},${y + 14} ${x + 14},${y + 14} ${x + 14},${y + 40}"/>`;
      if (o.labels) s += `<text x="${x + 22}" y="${y - 26}" class="s m">D</text><text x="${x + 22}" y="${y + 34}" class="s m">S</text><text x="${x - 28}" y="${y - 8}" class="s m">G</text>`;
      if (o.label) s += `<text x="${x + 22}" y="${y + 5}" class="${o.tcls || ""}">${o.label}</text>`;
      return s;
    },
    // Vertical switch from (x,y1) down to (x,y2). closed = true draws the blade shut.
    sw(x, y1, y2, closed, o = {}) {
      const c = o.cls ? " " + o.cls : "", a = y1 + 14, b = y2 - 14;
      let s = `<line class="w${c}" x1="${x}" y1="${y1}" x2="${x}" y2="${a}"/><line class="w${c}" x1="${x}" y1="${b}" x2="${x}" y2="${y2}"/>`;
      s += closed ? `<line class="w${c}" x1="${x}" y1="${b}" x2="${x}" y2="${a}"/>` : `<line class="w${c}" x1="${x}" y1="${b}" x2="${x + 18}" y2="${a + 4}"/>`;
      s += `<circle class="el" cx="${x}" cy="${a}" r="3.5"/><circle class="el" cx="${x}" cy="${b}" r="3.5"/>`;
      if (o.label) s += `<text x="${x + (o.side === "left" ? -14 : 26)}" y="${(a + b) / 2 + 5}" text-anchor="${o.side === "left" ? "end" : "start"}" class="${o.tcls || ""}">${o.label}</text>`;
      return s;
    },
    gateOut(kind, x) { return x + { and: 45, nand: 55, or: 55, nor: 65, not: 50, buf: 40 }[kind]; },
    dot(x, y) { return `<circle class="nd" cx="${x}" cy="${y}" r="4"/>`; },
    t(x, y, s, o = {}) { return `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" class="${o.cls || ""}">${s}</text>`; },
    pm(x, y, top = "+", gap = 34) { return `<text x="${x}" y="${y}" text-anchor="middle" class="big">${top}</text><text x="${x}" y="${y + gap}" text-anchor="middle" class="big">${top === "+" ? "−" : "+"}</text>`; },
    arrow(x1, y1, x2, y2, label, o = {}) {
      const ang = Math.atan2(y2 - y1, x2 - x1), h = 9, w = 5;
      const bx = x2 - h * Math.cos(ang), by = y2 - h * Math.sin(ang);
      const p1 = [bx + w * Math.sin(ang), by - w * Math.cos(ang)], p2 = [bx - w * Math.sin(ang), by + w * Math.cos(ang)];
      let out = `<line class="cur" x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}"/><polygon class="curh" points="${x2},${y2} ${p1.join(",")} ${p2.join(",")}"/>`;
      if (label) out += `<text x="${o.lx != null ? o.lx : (x1 + x2) / 2}" y="${o.ly != null ? o.ly : (y1 + y2) / 2 - 8}" text-anchor="${o.a || "middle"}" class="c">${label}</text>`;
      return out;
    },
    flow(pts, amps, k = 1, width) {
      if (reduce || !amps || !isFinite(amps)) return "";
      const dur = Math.max(0.18, Math.min(4, k / Math.abs(amps)));
      return `<polyline class="flow" style="--dur:${dur.toFixed(2)}s${amps < 0 ? ";animation-direction:reverse" : ""}${width ? ";stroke-width:" + width.toFixed(1) : ""}" points="${pts.map((p) => p.join(",")).join(" ")}"/>`;
    },
    gnd(x, y) { return `<line class="w" x1="${x}" y1="${y}" x2="${x}" y2="${y + 10}"/><line class="w" x1="${x - 14}" y1="${y + 10}" x2="${x + 14}" y2="${y + 10}"/><line class="w" x1="${x - 9}" y1="${y + 16}" x2="${x + 9}" y2="${y + 16}"/><line class="w" x1="${x - 4}" y1="${y + 22}" x2="${x + 4}" y2="${y + 22}"/>`; },
    supply(x, y, label) { return `<line class="w" x1="${x}" y1="${y}" x2="${x}" y2="${y - 22}"/><polygon class="nd" points="${x - 7},${y - 18} ${x + 7},${y - 18} ${x},${y - 30}"/><text x="${x + 12}" y="${y - 20}" text-anchor="start">${label}</text>`; },
    box(x, y, w, h, label, o = {}) { return `<rect class="box${o.cls ? " " + o.cls : ""}" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>${label ? `<text x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle">${label}</text>` : ""}`; },
    bulb(cx, cy, glow = 0) {
      return `<circle cx="${cx}" cy="${cy}" r="22" style="fill:var(--accent);opacity:${Math.min(0.85, glow).toFixed(2)}"/><circle class="el" cx="${cx}" cy="${cy}" r="18" style="fill:none"/><path class="w" d="M${cx - 8} ${cy + 18} L${cx - 8} ${cy} Q${cx - 4} ${cy - 10} ${cx} ${cy} Q${cx + 4} ${cy - 10} ${cx + 8} ${cy} L${cx + 8} ${cy + 18}"/>`;
    },
  };

  /* ---------- simple x-y plot (SVG string) ---------- */
  let clipN = 0;
  function plot(o) {
    const W = o.w || 520, H = o.h || 290, L = o.padL || 54, R = 14, T = 14, B = 40;
    const [x0, x1] = o.x, [y0, y1] = o.y;
    const X = (x) => L + ((x - x0) / (x1 - x0)) * (W - L - R);
    const Y = (y) => T + ((y1 - y) / (y1 - y0)) * (H - T - B);
    let s = "";
    (o.xt || []).forEach((v) => { s += `<line class="grid" x1="${X(v)}" y1="${T}" x2="${X(v)}" y2="${H - B}"/><text x="${X(v)}" y="${H - B + 16}" text-anchor="middle">${o.xtf ? o.xtf(v) : fmt(v)}</text>`; });
    (o.yt || []).forEach((v) => { s += `<line class="grid" x1="${L}" y1="${Y(v)}" x2="${W - R}" y2="${Y(v)}"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${o.ytf ? o.ytf(v) : fmt(v)}</text>`; });
    const ay = y0 <= 0 && y1 >= 0 ? Y(0) : H - B, ax = x0 <= 0 && x1 >= 0 ? X(0) : L;
    s += `<line class="axis" x1="${L}" y1="${ay}" x2="${W - R}" y2="${ay}"/><line class="axis" x1="${ax}" y1="${T}" x2="${ax}" y2="${H - B}"/>`;
    if (o.xl) s += `<text class="lab" x="${W - R}" y="${H - 6}" text-anchor="end">${o.xl}</text>`;
    if (o.yl) s += `<text class="lab" x="${L + 6}" y="${T + 12}" text-anchor="start">${o.yl}</text>`;
    const cid = "clip" + ++clipN;
    s += `<clipPath id="${cid}"><rect x="${L}" y="${T}" width="${W - L - R}" height="${H - T - B}"/></clipPath><g clip-path="url(#${cid})">`;
    const sample = (f, a, b, n) => { const pts = []; for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; const y = f(x); if (isFinite(y)) pts.push([X(x), Y(Math.max(y0 - (y1 - y0), Math.min(y1 + (y1 - y0), y)))]); } return pts; };
    (o.areas || []).forEach((ar) => {
      const a = ar.from != null ? ar.from : x0, b = ar.to != null ? ar.to : x1;
      const pts = sample(ar.f, a, b, ar.n || 240), base = ar.base != null ? ar.base : 0;
      s += `<polygon class="${ar.cls || "ar1"}" points="${X(a)},${Y(base)} ${pts.map((p) => p.join(",")).join(" ")} ${X(b)},${Y(base)}"/>`;
    });
    (o.series || []).forEach((se) => {
      const pts = se.pts ? se.pts.map(([x, y]) => [X(x), Y(y)]) : sample(se.f, se.from != null ? se.from : x0, se.to != null ? se.to : x1, se.n || 300);
      if (pts.length) s += `<polyline class="${se.cls || "s1"}" points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}"/>`;
    });
    s += "</g>";
    (o.marks || []).forEach((m) => {
      if (m.x < x0 || m.x > x1 || m.y < y0 || m.y > y1) return;
      s += `<circle class="${m.cls || "mk"}" cx="${X(m.x)}" cy="${Y(m.y)}" r="${m.r || 6}"/>`;
      if (m.label) s += `<text class="lab" x="${X(m.x) + (m.dx || 10)}" y="${Y(m.y) + (m.dy || -10)}" text-anchor="${m.a || "start"}">${m.label}</text>`;
    });
    (o.texts || []).forEach((tx) => { s += `<text class="lab" x="${X(tx.x)}" y="${Y(tx.y)}" text-anchor="${tx.a || "start"}">${tx.s}</text>`; });
    return `<svg class="plot" viewBox="0 0 ${W} ${H}" style="max-width:${W}px" role="img" aria-label="${o.label || "Graph"}">${s}</svg>`;
  }

  /* ---------- UI helpers for widgets ---------- */
  function slider(o, onChange) {
    const wrap = el(`<div class="sl"><label for="${o.id}"><span>${o.label}</span><output></output></label><input type="range" id="${o.id}"></div>`);
    const inp = wrap.querySelector("input"), out = wrap.querySelector("output");
    if (o.log) { inp.min = 0; inp.max = 1000; inp.step = 1; }
    else { inp.min = o.min; inp.max = o.max; inp.step = o.step || (o.max - o.min) / 100; }
    const toT = (v) => (1000 * Math.log(v / o.min)) / Math.log(o.max / o.min);
    const get = () => (o.log ? o.min * Math.pow(o.max / o.min, inp.value / 1000) : +inp.value);
    const show = () => { out.textContent = o.show ? o.show(get()) : fmt(get()); };
    inp.value = o.log ? toT(o.value) : o.value;
    show();
    inp.addEventListener("input", () => { show(); onChange && onChange(get()); });
    return { el: wrap, get, set(v) { inp.value = o.log ? toT(v) : v; show(); onChange && onChange(get()); } };
  }
  function toggle(labels, onPick, start = 0) {
    const r = el(`<div class="row" role="group"></div>`);
    labels.forEach((lab, i) => {
      const b = el(`<button type="button" class="btn small" aria-pressed="${i === start}">${lab}</button>`);
      b.addEventListener("click", () => { r.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); onPick(i); });
      r.appendChild(b);
    });
    return r;
  }
  const readout = (pairs) => `<div class="readout">${pairs.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join("")}</div>`;

  /* ---------- blocks ---------- */
  function mcq(b) {
    const n = el(`<div class="q">${b.q ? `<p class="qq">${b.q}</p>` : ""}${b.fig || ""}<div class="choices"></div><div class="feedback" aria-live="polite" hidden></div></div>`);
    const ch = n.querySelector(".choices"), fb = n.querySelector(".feedback");
    b.opts.forEach(([txt, ok, why]) => {
      const btn = el(`<button type="button" class="btn choice">${txt}</button>`);
      btn.addEventListener("click", () => {
        fb.hidden = false;
        fb.className = "feedback " + (ok ? "ok" : "no");
        fb.innerHTML = (ok ? "<b>Yes.</b> " : "<b>Not this one.</b> ") + (why || "");
        btn.classList.add(ok ? "right" : "wrong");
        if (ok) ch.querySelectorAll("button").forEach((x) => (x.disabled = x !== btn));
      });
      ch.appendChild(btn);
    });
    return n;
  }
  function num(b, id) {
    const n = el(`<div class="q"><p class="qq">${b.q}</p>${b.fig || ""}<form class="num" novalidate><input id="${id}" inputmode="decimal" autocomplete="off" aria-label="Your answer"><span class="mono">${b.unit || ""}</span><button class="btn primary" type="submit">Check</button></form><div class="feedback" aria-live="polite" hidden></div></div>`);
    const fb = n.querySelector(".feedback"), inp = n.querySelector("input");
    let tries = 0;
    n.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = parseFloat(String(inp.value).replace(",", ".").replace("−", "-"));
      fb.hidden = false;
      if (isNaN(v)) { fb.className = "feedback"; fb.textContent = "Type a number first."; return; }
      const tol = b.tol != null ? b.tol : 0.02;
      const ok = b.a === 0 ? Math.abs(v) < 1e-9 : Math.abs(v - b.a) <= Math.abs(b.a) * tol;
      tries++;
      if (ok) { fb.className = "feedback ok"; fb.innerHTML = "<b>Yes.</b> " + (b.why || ""); }
      else { fb.className = "feedback no"; fb.innerHTML = "<b>Not yet.</b> " + (tries >= 2 && b.hint2 ? b.hint2 : b.hint || "Check your units and signs."); }
    });
    return n;
  }
  /* Say-it-back answers live in the chapter's progress state; start() points this at it. */
  let says = { get: (k) => store.get(k, ""), set: (k, v) => store.set(k, v) };
  function say(b, id, key) {
    const n = el(`<div class="q"><p class="qq">${b.q}</p><textarea id="${id}" placeholder="Type your answer in your own words. Rough is fine."></textarea><div class="row"><button type="button" class="btn primary">Compare with mine</button></div><div class="model" hidden><span class="lbl">One good answer</span><div>${b.model}</div><p class="aside">Did yours get the same core idea? Wording doesn't matter. If you're unsure, paste yours into the chat and ask for feedback.</p></div></div>`);
    const ta = n.querySelector("textarea");
    ta.value = says.get(key);
    ta.addEventListener("input", () => says.set(key, ta.value));
    n.querySelector("button").addEventListener("click", () => { n.querySelector(".model").hidden = false; });
    return n;
  }
  function sort(b) {
    const n = el(`<div class="q">${b.q ? `<p class="qq">${b.q}</p>` : ""}<div class="sort"></div><div class="row"><button type="button" class="btn primary sort-check">Check my sorting</button></div><div class="feedback" aria-live="polite" hidden></div></div>`);
    const box = n.querySelector(".sort"), picks = [];
    b.items.forEach(([label], i) => {
      const it = el(`<div class="sort-item"><span>${label}</span></div>`);
      it.appendChild(toggle(b.bins, (k) => (picks[i] = k), -1));
      it.appendChild(el(`<div class="why" hidden></div>`));
      box.appendChild(it);
    });
    n.querySelector(".sort-check").addEventListener("click", () => {
      let right = 0;
      b.items.forEach(([, bin, why], i) => {
        const it = box.children[i], ok = picks[i] === bin;
        if (ok) right++;
        it.classList.toggle("right", ok); it.classList.toggle("wrong", !ok);
        const w = it.querySelector(".why"); w.hidden = false;
        w.innerHTML = (picks[i] == null ? "<b>Not sorted yet.</b> " : "") + (ok ? "" : `<b>Belongs in “${b.bins[bin]}”.</b> `) + (why || "");
      });
      const fb = n.querySelector(".feedback"); fb.hidden = false;
      fb.className = "feedback " + (right === b.items.length ? "ok" : "no");
      fb.innerHTML = `<b>${right} of ${b.items.length}</b> sorted correctly. ${right === b.items.length ? "" : "Read the notes on the red ones."}`;
    });
    return n;
  }
  function reveal(b) {
    const n = el(`<div class="q"><div class="row"><button type="button" class="btn">${b.label || "Show me"}</button></div><div hidden>${b.html}</div></div>`);
    n.querySelector("button").addEventListener("click", (e) => { n.lastElementChild.hidden = false; e.currentTarget.disabled = true; });
    return n;
  }
  function renderBlock(b, id, key) {
    if (typeof b === "string") return el(`<div>${b}</div>`);
    if (typeof b === "function") { const h = el(`<div class="widget" style="display:grid;gap:12px;min-width:0"></div>`); b(h, id); return h; }
    if (b.t === "mcq") return mcq(b);
    if (b.t === "num") return num(b, id);
    if (b.t === "say") return say(b, id, key);
    if (b.t === "sort") return sort(b);
    if (b.t === "reveal") return reveal(b);
    return el(`<div>${b.html || ""}</div>`);
  }

  /* ---------- subscripts: "v_TH" in any text renders as v<sub>TH</sub> (tspan inside SVG).
     A subscript stops before a letter that starts the next subscripted name, so "g_mR_D" reads g<sub>m</sub>R<sub>D</sub>. ---------- */
  const SUBRE = /([A-Za-zΔβμαθωφτγ′])_([A-Za-z0-9]+?)(?=[A-Za-zΔβμαθωφτγ′]_|[^A-Za-z0-9]|$)/g, SVGNS = "http://www.w3.org/2000/svg";
  function subify(root) {
    if (!root || !document.createTreeWalker) return;
    const w = document.createTreeWalker(root, 4 /* text */), hits = [];
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const p = n.parentNode;
      if (n.nodeValue.indexOf("_") < 0 || !p || /^(script|style|textarea|sub|tspan|title|code|pre)$/i.test(p.nodeName) || (p.closest && p.closest("pre, code"))) continue;
      SUBRE.lastIndex = 0;
      if (SUBRE.test(n.nodeValue)) hits.push(n);
    }
    hits.forEach((n) => {
      const svg = n.parentNode.namespaceURI === SVGNS, s = n.nodeValue, frag = document.createDocumentFragment();
      let last = 0, m;
      SUBRE.lastIndex = 0;
      while ((m = SUBRE.exec(s))) {
        frag.appendChild(document.createTextNode(s.slice(last, m.index) + m[1]));
        const sub = svg ? document.createElementNS(SVGNS, "tspan") : document.createElement("sub");
        if (svg) { sub.setAttribute("baseline-shift", "sub"); sub.setAttribute("font-size", "75%"); }
        sub.textContent = m[2];
        frag.appendChild(sub);
        last = m.index + m[0].length;
      }
      frag.appendChild(document.createTextNode(s.slice(last)));
      n.parentNode.replaceChild(frag, n);
    });
  }
  function watchSubs(root) {
    subify(root);
    if (!window.MutationObserver) return;
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((a) => subify(a.nodeType === 3 ? a.parentNode : a)))).observe(root, { childList: true, subtree: true });
  }

  /* ---------- app ---------- */
  const KIND = { learn: "Learn", play: "Play", predict: "Predict first", why: "Why?", whatif: "What if…", bug: "Spot the mistake", check: "Quick check", say: "Say it back", math: "Math boost" };

  function start(C) {
    const KEY = "course-" + C.id, P = window.Progress;
    const state = P ? P.load(C.id) : store.get(KEY, { done: {}, last: null, say: {} });
    state.say = state.say || {};
    const save = (delay) => (P ? P.save(C.id, state, delay) : store.set(KEY, state));
    says = {
      get: (k) => (k in state.say ? state.say[k] : store.get(k, "")), // older builds kept answers under their own keys
      set: (k, v) => { state.say[k] = v; save(1500); },
    };
    const root = document.getElementById("app");
    watchSubs(root);
    let view = { part: null, step: 0 };

    /* Book navigation: chapter pages sit in the book's folder, its contents page one level up. */
    const B = window.BOOK;
    const bookLink = () => (B ? `<a class="book-link" href="../${B.home}">← Contents</a> · ` : "");
    /* Where this chapter lives in the real book, so the problems are easy to find afterwards. */
    const U = (B && B.unit) || "Chapter", u = U.toLowerCase();
    /* Cross-book links: a math module lists the chapters that use it; a chapter lists the math modules it needs. */
    const BOOKS = Object.values(window.BOOKS || {});
    function chapterRef(id) {
      for (const K of BOOKS) {
        if (K.key === "math" || !K.find) continue;
        const c = K.find(id);
        if (c && c.file) return `<a href="../${K.dir}/${c.file}" title="${c.title}">${K.short} ${typeof c.n === "number" ? "Ch" : "App"} ${c.n}</a>`;
      }
      return "";
    }
    function mathLinks() {
      const M = window.BOOKS && window.BOOKS.math;
      if (!M || !M.all || (B && B.key === "math")) return "";
      const href = (m) => (m.file.startsWith("../") ? m.file : "../math/" + m.file);
      const list = (key) => M.all().filter((m) => m.file && (m[key] || []).includes(C.id)).map((m) => `<a href="${href(m)}">${m.title}</a>`).join(" · ");
      const need = list("needs"), also = list("also");
      return (need ? `<p class="aside where-book">Math you'll use: ${need}</p>` : "") + (also ? `<p class="aside where-book">Going further (optional): ${also}</p>` : "");
    }
    function whereInBook() {
      const me = B && B.find(C.id);
      if (me && B.noPdf) {
        const used = (me.needs || []).map(chapterRef).filter(Boolean), pairs = (me.also || []).map(chapterRef).filter(Boolean);
        return (used.length ? `<p class="aside where-book">Used in: ${used.join(" · ")}</p>` : "") + (pairs.length ? `<p class="aside where-book">Not in the books, but pairs with: ${pairs.join(" · ")}</p>` : "");
      }
      if (!me || !me.pdf) return mathLinks();
      return `<p class="aside where-book">${B.short}, ${typeof me.n === "number" ? "Chapter" : "Appendix"} ${me.n} · ${B.pagesLabel(me)}${B.pdfFile ? "" : ` · PDF file ending “-${me.pdf}.pdf”`}${me.probs ? ` · problems from ${B.probsLabel(me)}` : ""}</p>` + mathLinks();
    }
    function problemsNote() {
      const me = B && B.find(C.id);
      if (!me || !me.probs) return "";
      return `<div class="key"><b>Your book problems:</b> open <span class="mono">${B.pdfName(me)}</span> and go to ${B.probsLabel(me)}.</div>`;
    }
    const isAppPage = () => { const m = B && B.find(C.id); return !!m && typeof m.n !== "number"; };
    function nextChapter() {
      if (!B) return "";
      const me = B.find(C.id), isApp = !!me && typeof me.n !== "number";
      const list = isApp ? B.all().filter((c) => typeof c.n !== "number" && c.file) : B.chapters(), i = list.findIndex((c) => c.id === C.id), nx = list[i + 1];
      const ans = B.answers && !isApp ? `<p class="aside">The book has short answers to some problems (${B.answers.label}, pages ${B.answers.pdf.replace("-", "–")}). Look only after you've committed to your own answer.</p>` : "";
      if (!nx) return ans + `<p><a href="../${B.home}">← Back to the contents</a></p>`;
      return ans + (nx.file
        ? `<p>Then: <a href="${nx.file}">${isApp ? "Appendix" : U} ${nx.n} · ${nx.title} →</a></p>`
        : `<p>Next up: ${U} ${nx.n} · ${nx.title}. Its tutorial isn't built yet. Ask Claude for it when you're ready.</p>`);
    }

    function hub() {
      view = { part: null, step: 0 };
      const firstOpen = C.parts.findIndex((p) => !state.done[p.id]);
      const node = el(`<div class="wrap">
        <header class="top"><div class="eyebrow">${bookLink()}${C.eyebrow}</div><h1>${C.title}</h1>${whereInBook()}</header>
        <section class="card"><span class="tag">How this ${isAppPage() ? "appendix" : u} works</span>${C.intro}</section>
        <ol class="parts" aria-label="Parts of this ${u}"></ol>
        <section class="after"><h3 style="font-family:var(--display);margin:0">After the last part</h3>${problemsNote()}${C.after}${nextChapter()}</section>
        <p class="aside save-note"></p>
      </div>`);
      if (P) P.onStatus((s) => { const n = node.querySelector(".save-note"); if (n) n.textContent = s === "cloud" ? "Progress saves to your Claude account, so it follows you to any browser." : "Progress saves in this browser only."; });
      const list = node.querySelector(".parts");
      C.parts.forEach((p, i) => {
        const done = !!state.done[p.id];
        const cls = done ? "done" : i === firstOpen ? "next" : "";
        const b = el(`<li><button type="button" class="part-btn ${cls}"><span class="part-n">${done ? "✓" : i + 1}</span><span><span class="part-t">${p.title}</span><span class="part-d">${p.blurb}</span></span><span class="part-m">${p.mins} min</span></button></li>`);
        b.querySelector("button").addEventListener("click", () => openPart(i, state.last && state.last.part === i ? state.last.step : 0));
        list.appendChild(b);
      });
      const sum = el(`<li><button type="button" class="part-btn"><span class="part-n">Σ</span><span><span class="part-t">${U} summary</span><span class="part-d">Every key idea and formula on one page. Keep it open while you do the problems.</span></span><span class="part-m">ref</span></button></li>`);
      sum.querySelector("button").addEventListener("click", summary);
      list.appendChild(sum);
      if (state.last && state.last.part != null && C.parts[state.last.part]) {
        const p = C.parts[state.last.part];
        const cont = el(`<div class="row"><button type="button" class="btn primary">Continue: Part ${state.last.part + 1}, step ${state.last.step + 1}</button><span class="aside">${p.title}</span></div>`);
        cont.querySelector("button").addEventListener("click", () => openPart(state.last.part, state.last.step));
        node.querySelector(".card").after(cont);
      }
      root.replaceChildren(node);
      window.scrollTo(0, 0);
    }

    function summary() {
      view = { part: null, step: 0 };
      const node = el(`<div class="wrap"><header class="top"><div class="eyebrow"><button type="button">← ${C.eyebrow}</button></div><h1>${U} summary</h1></header><section class="card">${C.summary}</section><nav class="bottom"><button type="button" class="btn ghost">← ${U} map</button><span></span></nav></div>`);
      node.querySelectorAll(".eyebrow button, nav .btn").forEach((b) => b.addEventListener("click", hub));
      root.replaceChildren(node);
      window.scrollTo(0, 0);
    }

    function openPart(pi, si0 = 0) {
      const P = C.parts[pi];
      const node = el(`<div class="wrap">
        <header class="top"><div class="eyebrow"><button type="button">← ${C.eyebrow}</button> · Part ${pi + 1} of ${C.parts.length}</div><h1>${P.title}</h1>
        <div class="rail" aria-label="Steps"></div><div class="where"></div></header>
        <main></main>
        <nav class="bottom"><button type="button" class="btn ghost" data-back>← Back</button><button type="button" class="btn primary" data-next>Next →</button></nav></div>`);
      node.querySelector(".eyebrow button").addEventListener("click", hub);
      root.replaceChildren(node);
      const rail = node.querySelector(".rail"), where = node.querySelector(".where"), main = node.querySelector("main");
      const back = node.querySelector("[data-back]"), next = node.querySelector("[data-next]");
      const N = P.steps.length;

      function show(i) {
        i = Math.max(0, Math.min(N, i));
        view = { part: pi, step: i };
        if (i === N) return finish();
        state.last = { part: pi, step: i }; save();
        const st = P.steps[i];
        const card = el(`<section class="card"><span class="tag k-${st.k}">${KIND[st.k] || st.k}</span>${st.title ? `<h2>${st.title}</h2>` : ""}</section>`);
        (st.b || []).forEach((b, j) => card.appendChild(renderBlock(b, `${C.id}-${P.id}-s${i}-b${j}`, `${KEY}-say-${P.id}-${i}-${j}`)));
        main.replaceChildren(card);
        rail.innerHTML = P.steps.map((s, k) => `<button type="button" class="${k < i ? "done" : k === i ? "now" : ""}" aria-label="Step ${k + 1}" ${k === i ? 'aria-current="step"' : ""} data-i="${k}"></button>`).join("");
        rail.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
        where.innerHTML = `Step <b>${i + 1}</b> of ${N} · ${KIND[st.k] || st.k}`;
        back.disabled = i === 0;
        next.hidden = false;
        next.textContent = i === N - 1 ? "Finish part ✓" : "Next →";
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }
      function finish() {
        state.done[P.id] = true;
        state.last = pi + 1 < C.parts.length ? { part: pi + 1, step: 0 } : null;
        save();
        const hasNext = pi + 1 < C.parts.length;
        const card = el(`<section class="card"><span class="tag k-check">Part ${pi + 1} complete</span><h2>Your takeaway</h2><div class="key">${P.takeaway}</div>
          <p class="aside">Good moment for a short break. Stand up, drink some water, then come back.</p>
          <div class="row">${hasNext ? `<button type="button" class="btn primary" data-np>Part ${pi + 2}: ${C.parts[pi + 1].title} →</button>` : `<button type="button" class="btn primary" data-sum>Open the ${u} summary</button>`}<button type="button" class="btn ghost" data-hub>Chapter map</button></div></section>`);
        main.replaceChildren(card);
        rail.querySelectorAll("button").forEach((b) => (b.className = "done"));
        where.innerHTML = `<b>Done</b> · ${N} steps`;
        back.disabled = false;
        next.hidden = true;
        card.querySelector("[data-hub]").addEventListener("click", hub);
        if (hasNext) card.querySelector("[data-np]").addEventListener("click", () => openPart(pi + 1, 0));
        else card.querySelector("[data-sum]").addEventListener("click", summary);
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }
      back.addEventListener("click", () => show(view.step - 1));
      next.addEventListener("click", () => show(view.step + 1));
      show(si0);
    }

    document.addEventListener("keydown", (e) => {
      if (view.part == null) return;
      if (e.target.closest && e.target.closest("input, textarea, select")) return;
      const nb = document.querySelector("[data-next]"), bb = document.querySelector("[data-back]");
      if (e.key === "ArrowRight" && nb && !nb.hidden) nb.click();
      if (e.key === "ArrowLeft" && bb && !bb.disabled) bb.click();
    });

    const m = /^#p(\d+)$/.exec(location.hash || "");
    /* #resume (from the library's Resume card): the saved step, else the first unfinished part, else the map. */
    const L = state.last, todo = C.parts.findIndex((p) => !state.done[p.id]);
    if (m && C.parts[+m[1] - 1]) openPart(+m[1] - 1, 0);
    else if (location.hash === "#resume" && L && C.parts[L.part]) openPart(L.part, L.step);
    else if (location.hash === "#resume" && todo >= 0) openPart(todo, 0);
    else hub();
    if (P) P.sync(C.id, state, () => { if (view.part == null) hub(); });
  }

  return { start, S, plot, slider, toggle, readout, fmt, si, el, reduce, store };
})();
