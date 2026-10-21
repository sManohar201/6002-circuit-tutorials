/* C tracing helpers for Patt & Patel Chapters 11–20.
   CT.trace(host, { code, frames }) steps through hand-written execution frames:
   frame = { l: line (1-based) or [lines], v: [[name, value], ...], m: [[addr, value, label, group], ...], out: "console text so far", note: "html" }.
   Rows in m that share a group are shaded together (e.g. one function's stack frame). */
(function () {
  const { el } = Course;
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const SHADE = ["var(--accent-soft)", "var(--cool-soft)", "var(--good-soft)", "var(--bad-soft)", "var(--card)"];
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);

  /* C source with optional highlighted lines and line numbers */
  function code(src, o = {}) {
    const hl = [].concat(o.hl || []);
    const lines = src.replace(/^\n/, "").replace(/\n\s*$/, "").split("\n");
    const w = String(lines.length).length;
    return `<pre class="code" style="font-variant-ligatures:none">${lines.map((ln, i) => {
      const k = ln.indexOf("//"), body = esc(k >= 0 ? ln.slice(0, k) : ln) + (k >= 0 ? `<span class="cm">${esc(ln.slice(k))}</span>` : "");
      const num = o.nums === false ? "" : `<span class="cm" style="font-style:normal">${String(i + 1).padStart(w)} </span>`;
      return hl.includes(i + 1) ? `<span class="hl">${num}${body}</span>` : num + body;
    }).join("\n")}</pre>`;
  }

  function memTable(m) {
    const groups = [...new Set(m.map((r) => r[3]).filter((g) => g))];
    return `<div class="tbl"><table style="font-family:var(--mono);font-size:13px"><thead><tr><th>Address</th><th>Contents</th><th>What it is</th></tr></thead><tbody>${m.map(([a, v, lab, g]) => `<tr style="${g ? `background:${SHADE[groups.indexOf(g) % SHADE.length]}` : ""}"><td>${esc(a)}</td><td>${esc(v)}</td><td style="font-family:var(--sans,inherit)">${lab || ""}</td></tr>`).join("")}</tbody></table></div>` +
      (groups.length ? `<p class="aside">${groups.map((g, i) => `<span style="background:${SHADE[i % SHADE.length]};padding:0 6px;border-radius:4px">${g}</span>`).join(" ")}</p>` : "");
  }

  function trace(host, o) {
    let i = 0;
    const left = el(`<div class="tile" style="min-width:0"></div>`), right = el(`<div class="tile" style="min-width:0"></div>`);
    const wrap = el(`<div class="two" style="grid-template-columns:repeat(auto-fit,minmax(min(380px,100%),1fr))"></div>`), row = el(`<div class="row"></div>`), count = el(`<span class="aside"></span>`);
    const bBack = btn("◀ Back"), bNext = btn("Step ▶", "primary"), bReset = btn("Reset");
    const draw = () => {
      const f = o.frames[i];
      left.innerHTML = `<h3>${o.title || "Code"}</h3>` + code(o.code, { hl: f.l });
      let r = "";
      if (f.v) r += `<div class="tbl"><table style="font-family:var(--mono);font-size:14px"><thead><tr><th>Variable</th><th>Value</th></tr></thead><tbody>${f.v.map(([n, v]) => `<tr><td>${esc(n)}</td><td>${esc(v)}</td></tr>`).join("")}</tbody></table></div>`;
      if (f.m) r += memTable(f.m);
      if (f.out != null || o.console) r += `<p class="aside" style="margin:8px 0 2px">Output</p><pre class="code" style="min-height:2.4em">${esc(f.out || "")}</pre>`;
      if (f.note) r += `<p>${f.note}</p>`;
      right.innerHTML = `<h3>${o.stateTitle || "State"}</h3>` + r;
      count.textContent = `step ${i + 1} of ${o.frames.length}`;
      bBack.disabled = i === 0; bNext.disabled = i === o.frames.length - 1;
    };
    bBack.addEventListener("click", () => { if (i > 0) i--; draw(); });
    bNext.addEventListener("click", () => { if (i < o.frames.length - 1) i++; draw(); });
    bReset.addEventListener("click", () => { i = 0; draw(); });
    row.append(bBack, bNext, bReset, count); wrap.append(left, right);
    host.append(row, wrap); draw();
  }

  window.CT = { code, trace, memTable, esc };
})();
