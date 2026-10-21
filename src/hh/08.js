(function () {
  const { S, plot, slider, toggle, el } = Course;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const seenPP = (html, href, where) => `<div class="key"><b>Seen in Patt & Patel:</b> ${html} <a href="../pp/${href}">${where} →</a></div>`;
  const seenHH = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const pre = (t) => `<pre class="code">${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`;
  const hx = (v, n = 8) => "0x" + (v >>> 0).toString(16).toUpperCase().padStart(n, "0");
  const bn = (v, n) => (v >>> 0).toString(2).padStart(n, "0").slice(-n);
  const field = "font-family:var(--mono);padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--paper);color:var(--ink)";

  /* ---------- the book's three 8-word caches ---------- */
  const CACHES = [
    { name: "Direct mapped, b = 1 (Fig 8.7)", N: 1, b: 1 },
    { name: "2-way set associative, b = 1 (Fig 8.9)", N: 2, b: 1 },
    { name: "Direct mapped, b = 4 (Fig 8.12)", N: 1, b: 4 },
  ];
  const lg = (x) => Math.round(Math.log2(x));
  function fieldsOf(c, a) {
    const S = 8 / (c.N * c.b), sb = lg(S), ob = lg(c.b), word = a >>> 2;
    return { S, sb, ob, tb: 32 - 2 - ob - sb, set: (word >>> ob) & (S - 1), off: word & (c.b - 1), tag: (word >>> ob) >>> sb };
  }
  function fieldWidget(host) {
    const inp = el(`<input type="text" value="0x8000009C" aria-label="address" style="${field};width:9em">`), out = el(`<div></div>`);
    let ci = 2;
    const draw = () => {
      const a = parseInt(inp.value.replace(/^0x/i, ""), 16);
      if (isNaN(a)) { out.innerHTML = ""; return; }
      const c = CACHES[ci], f = fieldsOf(c, a >>> 0), bits = bn(a, 32);
      const segs = [["Tag", f.tb, "var(--accent-soft)"], ["Set", f.sb, "var(--cool-soft)"], ["Block offset", f.ob, "var(--good-soft)"], ["Byte offset", 2, "var(--card)"]].filter((s) => s[1] > 0);
      let p = 0;
      out.innerHTML = `<div class="tbl"><table style="text-align:center;font-family:var(--mono);font-size:13px"><tbody><tr>${segs.map(([n, w, col]) => { const s = bits.slice(p, p + w); p += w; return `<td style="background:${col};overflow-wrap:anywhere">${w > 12 ? s.slice(0, 4) + "…" + s.slice(-4) : s}</td>`; }).join("")}</tr><tr>${segs.map(([n, w]) => `<td>${n} (${w})</td>`).join("")}</tr></tbody></table></div><p>${hx(a)} → <b>set ${f.set}</b>${c.b > 1 ? `, word ${f.off} of the block` : ""}, tag ${hx(f.tag, 1)}. This cache has ${f.S} set${f.S > 1 ? "s" : ""} of ${c.N} way${c.N > 1 ? "s" : ""}.</p>`;
    };
    inp.addEventListener("input", draw);
    const lab = el(`<label>Address: </label>`); lab.append(inp);
    host.append(toggle(CACHES.map((c) => c.name.replace(/ \(.*/, "")), (i) => { ci = i; draw(); }, 2), lab, out); draw();
  }
  const STREAMS = [
    { name: "Ex 8.6 loop: 0x4, 0xC, 0x8 (×5)", seq: [].concat(...Array(5).fill([0x4, 0xc, 0x8])), cache: 0 },
    { name: "Ex 8.7 loop: 0x4, 0x24 (×5)", seq: [].concat(...Array(5).fill([0x4, 0x24])), cache: 0 },
    { name: "Ex 8.10: 0x4, 0x24, 0x54", seq: [0x4, 0x24, 0x54], cache: 1 },
  ];
  function cacheSim(host) {
    let si = 0, ci = 0, k = 0, sets, log, hits;
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`), bStep = btn("Next access", "primary"), bRun = btn("Run all"), bReset = btn("Reset");
    const reset = () => { const c = CACHES[ci], S = 8 / (c.N * c.b); sets = Array.from({ length: S }, () => ({ ways: Array.from({ length: c.N }, () => ({ v: 0, tag: 0, blk: 0 })), U: 0 })); k = 0; log = []; hits = 0; };
    const access = () => {
      const st = STREAMS[si], c = CACHES[ci]; if (k >= st.seq.length) return;
      const a = st.seq[k++], f = fieldsOf(c, a), set = sets[f.set];
      let w = set.ways.findIndex((x) => x.v && x.tag === f.tag), hit = w >= 0;
      if (hit) hits++;
      else { w = c.N === 1 ? 0 : set.ways.findIndex((x) => !x.v); if (w < 0) w = set.U; set.ways[w] = { v: 1, tag: f.tag, blk: (a >>> 2) >>> lg(c.b) }; }
      if (c.N === 2) set.U = w === 0 ? 1 : 0;
      log.push([hx(a, 2), f.set, hit]);
    };
    const draw = () => {
      const c = CACHES[ci], st = STREAMS[si];
      const dat = (blk) => Array.from({ length: c.b }, (_, i) => `mem[${hx((blk * c.b + i) * 4, 2)}]`).reverse().join(" ");
      const rows = sets.map((s, i) => `<tr><td>Set ${i}</td>${s.ways.map((w) => `<td class="mono">${w.v}</td><td class="mono">${w.v ? hx(w.tag, 1) : ""}</td><td class="mono" style="font-size:13px">${w.v ? dat(w.blk) : ""}</td>`).join("")}${c.N === 2 ? `<td class="mono">${s.U}</td>` : ""}</tr>`).reverse().join("");
      const head = `<tr><th></th>${Array.from({ length: c.N }, (_, w) => `<th>V${c.N > 1 ? ` (way ${c.N - 1 - w})` : ""}</th><th>Tag</th><th>Data</th>`).join("")}${c.N === 2 ? "<th>U</th>" : ""}</tr>`;
      const misses = log.length - hits;
      out.innerHTML = `<div class="tbl"><table>${head}<tbody>${rows}</tbody></table></div><p class="mono" style="overflow-wrap:anywhere">${log.map(([a, s, h]) => `<span style="color:${h ? "var(--good)" : "var(--bad)"}">${a}${h ? "✓" : "✗"}</span>`).join(" ") || "(no accesses yet)"}</p><p>${log.length} of ${st.seq.length} accesses: ${misses} miss${misses === 1 ? "" : "es"}${log.length ? `, miss rate ${(100 * misses / log.length).toFixed(1)}%` : ""}.</p>`;
      bStep.disabled = bRun.disabled = k >= st.seq.length;
    };
    bStep.addEventListener("click", () => { access(); draw(); }); bRun.addEventListener("click", () => { while (k < STREAMS[si].seq.length) access(); draw(); }); bReset.addEventListener("click", () => { reset(); draw(); });
    const tC = toggle(CACHES.map((c) => c.name.replace(/ \(.*/, "")), (i) => { ci = i; reset(); draw(); }, 0);
    row.append(bStep, bRun, bReset);
    host.append(el(`<p class="aside">Address stream:</p>`), toggle(STREAMS.map((s) => s.name), (i) => { si = i; reset(); draw(); }, 0), el(`<p class="aside">Cache (all 8 words):</p>`), tC, row, out);
    reset(); draw();
  }

  /* ---------- virtual memory (Figures 8.21, 8.23, 8.25) ---------- */
  const PT = { 0x00002: 0x7fff, 0x00005: 0x0001, 0x7fffc: 0x7ffe, 0x7fffd: 0x0000 };
  const TLB = [[0x7fffd, 0x0000], [0x00002, 0x7fff]];
  function translate(host) {
    const inp = el(`<input type="text" value="0x247C" aria-label="virtual address" style="${field};width:9em">`), out = el(`<div></div>`), row = el(`<div class="row"></div>`);
    const draw = () => {
      const va = parseInt(inp.value.replace(/^0x/i, ""), 16);
      if (isNaN(va) || va < 0 || va > 0x7fffffff) { out.innerHTML = `<p class="aside">Enter a 31-bit virtual address (up to 0x7FFFFFFF).</p>`; return; }
      const vpn = va >>> 12, off = va & 0xfff, t = TLB.find(([v]) => v === vpn), ppn = PT[vpn];
      const steps = [`VPN = ${hx(vpn, 5)}, page offset = ${hx(off, 3)} (the offset is never translated)`];
      if (t) steps.push(`<span class="verdict ok">TLB hit</span> VPN ${hx(vpn, 5)} → PPN ${hx(t[1], 4)}: one memory access (the data)`);
      else {
        steps.push(`<span class="verdict mid">TLB miss</span> read the page table in physical memory (an extra access)`);
        steps.push(ppn !== undefined ? `page table entry ${hx(vpn, 5)}: V = 1, PPN = ${hx(ppn, 4)}` : `page table entry ${hx(vpn, 5)}: V = 0 → <span class="verdict no">page fault</span>: the OS loads the page from the hard drive`);
      }
      const p = t ? t[1] : ppn;
      out.innerHTML = `<ol>${steps.map((s) => `<li>${s}</li>`).join("")}</ol>${p !== undefined ? `<p class="eq">physical address = ${hx(p, 4)} ‖ ${hx(off, 3)} = ${hx((p << 12) | off, 7)}</p>` : ""}`;
    };
    inp.addEventListener("input", draw);
    ["0x247C", "0x5FB0", "0x53F8", "0x6123", "0x7FFFC9A0"].forEach((s) => { const b = btn(s); b.addEventListener("click", () => { inp.value = s; draw(); }); row.append(b); });
    const lab = el(`<label>Virtual address: </label>`); lab.append(inp);
    host.append(lab, row, out); draw();
  }

  /* ---------- memory-mapped I/O decoder (Figure 8.28) ---------- */
  function decoder(host) {
    const ADDR = [["0x00001000 (memory)", 0x1000], ["0xFFFFFFF4 (I/O Device 1)", 0xfffffff4], ["0xFFFFFFF8 (I/O Device 2)", 0xfffffff8]];
    let ai = 1, w = 1;
    const out = el(`<div></div>`);
    const draw = () => {
      const a = ADDR[ai][1], dev = a === 0xfffffff4 ? 1 : a === 0xfffffff8 ? 2 : 0;
      const sig = { WEM: w && dev === 0 ? 1 : 0, WE1: w && dev === 1 ? 1 : 0, WE2: w && dev === 2 ? 1 : 0, RDsel: ["00", "01", "10"][dev] };
      out.innerHTML = `<div class="tbl"><table style="text-align:center"><thead><tr><th>WEM</th><th>WE1</th><th>WE2</th><th>RDsel<sub>1:0</sub></th></tr></thead><tbody><tr>${["WEM", "WE1", "WE2", "RDsel"].map((k) => `<td class="mono" style="${sig[k] === 1 || (k === "RDsel" && !w) ? "background:var(--accent-soft)" : ""}">${sig[k]}</td>`).join("")}</tr></tbody></table></div><p>${w ? `sw: the WriteData is written into ${dev ? `the register driving I/O Device ${dev}` : "memory"}.` : `lw: the ReadData mux passes ${dev ? `I/O Device ${dev}'s output` : "memory"} (RDsel = ${sig.RDsel}).`}</p>`;
    };
    host.append(toggle(ADDR.map((x) => x[0]), (i) => { ai = i; draw(); }, 1), toggle(["sw (MemWrite = 1)", "lw (MemWrite = 0)"], (i) => { w = i ? 0 : 1; draw(); }, 0), out); draw();
  }

  /* ---------- GPIO board (Figure 8.35, Example 8.18) ---------- */
  function gpio(host) {
    const sw = [0, 1, 1, 0];
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`);
    const draw = () => {
      const switches = sw.reduce((a, s, i) => a | (s << i), 0), portd = (switches << 8) | switches;
      let g = "";
      for (let i = 0; i < 8; i++) { const on = i < 4 && (switches >> i) & 1; g += `<circle cx="${380 - i * 44}" cy="40" r="14" style="fill:${on ? "var(--accent)" : "var(--card)"};stroke:var(--ink);stroke-width:2"/>` + S.t(380 - i * 44, 76, "RD" + i, { cls: "s" }); }
      out.innerHTML = `<div class="fig">${S.svg(410, 90, g, { max: 410, label: "Eight LEDs on RD7 to RD0" })}</div><p class="mono">TRISD = 0xFF00 (RD[11:8] inputs, RD[7:0] outputs)<br>switches = (PORTD &gt;&gt; 8) &amp; 0xF = ${bn(switches, 4)}<br>PORTD ← ${bn(switches, 4)} → LEDs RD[3:0]</p>`;
      row.querySelectorAll("button").forEach((b, i) => { b.textContent = `RD${11 - i} switch: ${sw[3 - i] ? "closed (1)" : "open (0)"}`; });
    };
    for (let i = 0; i < 4; i++) { const b = btn(""); b.addEventListener("click", () => { sw[3 - i] ^= 1; draw(); }); row.append(b); }
    host.append(row, out); draw();
  }

  /* ---------- UART frame (Figure 8.40) ---------- */
  function uartFrame(host) {
    const inp = el(`<input type="text" value="A" maxlength="1" aria-label="character" style="${field};width:3em">`), out = el(`<div></div>`);
    const draw = () => {
      const ch = (inp.value || " ").charCodeAt(0) & 255;
      const bits = [1, 0].concat(Array.from({ length: 8 }, (_, i) => (ch >> i) & 1), [1, 1]);
      const labels = ["idle", "start"].concat(Array.from({ length: 8 }, (_, i) => "b" + i), ["stop", "idle"]);
      const X = (i) => 14 + i * 40, Y = (b) => (b ? 30 : 70);
      let d = `M ${X(0)} ${Y(bits[0])}`;
      bits.forEach((b, i) => { d += ` L ${X(i)} ${Y(b)} L ${X(i + 1)} ${Y(b)}`; });
      let g = `<path d="${d}" style="fill:none;stroke:var(--accent);stroke-width:3"/>`;
      labels.forEach((l, i) => { g += S.t(X(i) + 20, 98, l, { cls: "s" }) + (i > 0 && i < 11 ? `<line x1="${X(i)}" y1="22" x2="${X(i)}" y2="80" style="stroke:var(--line);stroke-dasharray:3 3"/>` : ""); });
      out.innerHTML = `<div class="fig">${S.svg(500, 108, g, { max: 500, label: "UART frame for one character" })}</div><p>'${String.fromCharCode(ch)}' = 0x${ch.toString(16).toUpperCase().padStart(2, "0")} = ${bn(ch, 8)}. Sent <b>least significant bit first</b> after a 0 start bit; a 1 stop bit; the line idles at 1.</p>`;
    };
    inp.addEventListener("input", draw);
    const lab = el(`<label>Character: </label>`); lab.append(inp);
    host.append(lab, out); draw();
  }

  /* ---------- analog: ADC, PWM, servo ---------- */
  function adc(host) {
    const out = el(`<div></div>`);
    const draw = (v) => { const x = Math.min(1023, Math.floor((1024 * v) / 3.3)); out.innerHTML = `<p class="eq">X = 2<sup>10</sup> · ${v.toFixed(2)} / 3.3 = ${x} = 0x${x.toString(16).toUpperCase().padStart(3, "0")}</p><p class="aside">PIC32: 10-bit ADC, V<sub>ref−</sub> = 0, V<sub>ref+</sub> = 3.3 V. One step (1 lsb) = 3.3 / 1024 ≈ 3.2 mV.</p>`; };
    host.append(slider({ id: "hh8adc", label: "V<sub>in</sub>", min: 0, max: 3.3, step: 0.01, value: 1.0, show: (v) => v.toFixed(2) + " V" }, draw).el, out); draw(1.0);
  }
  function pwm(host) {
    const out = el(`<div></div>`);
    const draw = (d) => {
      d = Math.round(d);
      const pts = []; for (let p = 0; p < 3; p++) { pts.push([p, 0], [p, 3.3], [p + d / 100, 3.3], [p + d / 100, 0]); } pts.push([3, 0]);
      out.innerHTML = `<div class="fig">${plot({ x: [0, 3], y: [0, 4], xt: [0, 1, 2, 3], yt: [0, 1, 2, 3, 3.3], xl: "periods", yl: "V", h: 200, series: [{ pts, cls: "s1" }, { f: () => (3.3 * d) / 100, cls: "s3" }], label: "PWM waveform and its average" })}</div><p class="eq">average = ${d}% × 3.3 V = ${((3.3 * d) / 100).toFixed(3)} V</p><p class="aside">A low-pass RC filter (corner well below the PWM frequency) leaves just the average.</p>`;
    };
    host.append(slider({ id: "hh8pwm", label: "Duty cycle", min: 0, max: 100, step: 1, value: 25, show: (v) => Math.round(v) + "%" }, draw).el, out); draw(25);
  }
  function servo(host) {
    const out = el(`<div></div>`);
    const draw = (pw) => {
      const ang = Math.max(0, Math.min(180, ((pw - 0.5) / 2) * 180)), r = (ang * Math.PI) / 180;
      const g = `<path d="M 40 110 A 100 100 0 0 1 240 110" style="fill:none;stroke:var(--line);stroke-width:2"/><line x1="140" y1="110" x2="${140 - 90 * Math.cos(r)}" y2="${110 - 90 * Math.sin(r)}" style="stroke:var(--accent);stroke-width:6;stroke-linecap:round"/><circle cx="140" cy="110" r="8" style="fill:var(--ink)"/>` + S.t(40, 128, "0°", { cls: "s" }) + S.t(140, 8 + 12, "90°", { cls: "s" }) + S.t(240, 128, "180°", { cls: "s" });
      out.innerHTML = `<div class="fig">${S.svg(280, 135, g, { max: 280, label: "Servo horn angle" })}</div><p>${pw.toFixed(2)} ms pulse every 20 ms (50 Hz) → <b>${ang.toFixed(0)}°</b></p>`;
    };
    host.append(slider({ id: "hh8servo", label: "Pulse width", min: 0.5, max: 2.5, step: 0.05, value: 1.5, show: (v) => v.toFixed(2) + " ms" }, draw).el, out); draw(1.5);
  }
  function hbridge(host) {
    const s = { A: 1, B: 0, C: 0, D: 1 };
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`);
    const draw = () => {
      const k = "ABCD".split("").filter((x) => s[x]).join("");
      const res = { AD: "current flows left → right: spins one way", BC: "current flows right → left: spins the other way", AC: "both motor terminals tied together: active brake", BD: "both motor terminals tied together: active brake", "": "all open: the motor coasts to a stop" }[k] || (/AB|CD/.test(k) ? "⚠ A and B (or C and D) together short the supply to ground: never do this" : "not a standard combination");
      out.innerHTML = `<p>Closed: <b>${k || "none"}</b></p><p>${res}</p>`;
      row.querySelectorAll("button").forEach((b, i) => { const x = "ABCD"[i]; b.textContent = `${x}: ${s[x] ? "closed" : "open"}`; b.classList.toggle("primary", !!s[x]); });
    };
    "ABCD".split("").forEach((x) => { const b = btn(x); b.addEventListener("click", () => { s[x] ^= 1; draw(); }); row.append(b); });
    host.append(el(`<p class="aside">Switches A (top left), B (bottom left), C (top right), D (bottom right); the motor sits between the left and right sides.</p>`), row, out); draw();
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "The memory gap and the hierarchy", mins: 15,
    blurb: "Processors got fast; DRAM didn't. Keep a small fast copy of what you're using now, backed by bigger, slower, cheaper levels.",
    takeaway: "Chapter 7 assumed one-cycle memory; real DRAM is 10–100× slower than the processor. Memory interface (Figure 8.1): Address, MemWrite, WriteData, ReadData. Library metaphor: keep recently used books (temporal locality) and books from the same shelf (spatial locality) in your cubicle. Ideal memory is fast, large and cheap; real memories have two of three. Hierarchy (Figure 8.3–8.4, 2012): cache (SRAM, ~$10,000/GB, ~1 ns, 25+ GB/s, on chip), main memory (DRAM, ~$10/GB, 10–50 ns, 10 GB/s), virtual memory on SSD ($1/GB, 0.1 ms) or HDD ($0.1/GB, ~10 ms). DRAM prices fell ~25%/year and capacity grew as fast, but DRAM speed improved only ~7%/year vs 25–50%/year for processors (Figure 8.2). Hit = found in cache; miss = go to main memory. The hard drive gives the illusion of more memory: virtual memory; main memory = physical memory, acting as a cache for the disk.",
    steps: [
      { k: "learn", title: "The gap", b: [
        `<p>Around 1980 processors and DRAM ran at about the same speed. Since then processors improved 25–50% a year, DRAM about 7%. Today one DRAM access costs tens to hundreds of processor cycles.</p>`,
        `<p>Fix: a <b>hierarchy</b>. Small, fast memory holds what you're using now; big, slow, cheap memory holds everything.</p>`,
      ]},
      { k: "learn", title: "Levels (2012 numbers)", b: [
        `<div class="tbl"><table><thead><tr><th>Level</th><th>Technology</th><th>$/GB</th><th>Access time</th></tr></thead><tbody>
          <tr><td>Cache</td><td>SRAM, on chip</td><td>10,000</td><td>~1 ns</td></tr>
          <tr><td>Main memory</td><td>DRAM</td><td>10</td><td>10–50 ns</td></tr>
          <tr><td>Virtual memory</td><td>SSD</td><td>1</td><td>100 µs</td></tr>
          <tr><td>Virtual memory</td><td>HDD</td><td>0.1</td><td>10 ms</td></tr></tbody></table></div>`,
        `<p>It works because programs show <b>locality</b>. <b>Temporal</b>: what you used recently, you'll likely use again soon. <b>Spatial</b>: what's next to it, you'll likely use soon.</p>`,
        seenHH("SRAM and DRAM cells and arrays.", "05-building-blocks.html", "Chapter 5"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A loop reads a[0], a[1], a[2], … once each. Which locality does that mostly show?", opts: [["Spatial", true, "Each access is right next to the previous one."], ["Temporal", false, "Each element is used only once."], ["Neither", false, "Neighbouring addresses: spatial."]] },
        { t: "mcq", q: "The same loop's counter variable i is read every iteration. Which locality?", opts: [["Temporal", true, "The same location again and again."], ["Spatial", false, "It's one location, not its neighbours."], ["Neither", false, "Reused data: temporal."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can a small cache make a big, slow memory look fast?", model: "Programs exhibit temporal and spatial locality: they tend to reuse data they used recently and data near it. A small fast cache that keeps recently used data, fetched a block at a time, therefore satisfies most accesses. Only the rare misses pay the slow main-memory time, so the average access time stays close to the cache's." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Measuring a memory system", mins: 15,
    blurb: "Miss rate and average memory access time. And Amdahl's warning: speeding up one part only helps as much as that part matters.",
    takeaway: "Miss rate = misses / total accesses = 1 − hit rate (8.1). Example 8.1: 2000 loads/stores, 1250 hits → miss rate 37.5%, hit rate 62.5%. Average memory access time: AMAT = tcache + MRcache(tMM + MRMM tVM) (8.2). Example 8.2: cache 1 cycle, 10% miss; main memory 100 cycles → AMAT = 1 + 0.1(100) = 11 cycles. Example 8.3: to reach 1.5 cycles, 1 + 100m = 1.5 → m = 0.5%. Amdahl's Law: effort on a subsystem is worthwhile only if it affects a large share of total performance; e.g., if 50% of instructions are loads/stores, a 10× faster memory gives only 1/(0.5 + 0.5/10) = 1.82×.",
    steps: [
      { k: "learn", title: "Two measures", b: [
        `<p class="eq">miss rate = misses / accesses = 1 − hit rate</p>`,
        `<p class="eq">AMAT = t<sub>cache</sub> + MR<sub>cache</sub> (t<sub>MM</sub> + MR<sub>MM</sub> t<sub>VM</sub>)</p>`,
        `<p>Every access pays the cache time; only misses pay for the next level, and only misses there pay for the level after.</p>`,
        `<p><b>Example 8.2</b>: 1-cycle cache, 10% misses, 100-cycle memory: AMAT = 1 + 0.1 × 100 = <b>11 cycles</b>. To get 1.5 cycles the miss rate must drop to 0.5% (Example 8.3).</p>`,
      ]},
      { k: "learn", title: "Amdahl's Law", b: [
        `<p>If half the instructions are loads and stores, making memory 10× faster speeds the program up only</p><p class="eq">1 / (0.5 + 0.5 / 10) = 1.82×</p>`,
        `<p>Improve what dominates the total.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A cache hits in 2 cycles; 4% of accesses miss and go to a 150-cycle memory. AMAT in cycles?", a: 8, tol: 0.01, why: "2 + 0.04 × 150 = 8." },
        { t: "num", q: "20% of a program's run time is memory stalls. If memory became infinitely fast, how many times faster would the program be?", a: 1.25, tol: 0.01, why: "1 / 0.8 = 1.25: the other 80% is untouched." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain the AMAT formula in words.", model: "Every memory access spends the cache access time. A fraction of accesses, the cache miss rate, must also go to main memory and spend its access time; of those, a fraction miss in main memory too and spend the virtual memory time. Adding these weighted times gives the average time the processor waits per access." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "How a cache finds data", mins: 20,
    blurb: "Split the address: byte offset, maybe a block offset, a set index, and a tag that says which of many addresses is really there.",
    takeaway: "Cache parameters: capacity C (words), block (line) size b, number of blocks B = C/b, sets S, associativity N. Three questions: what data is held (recent data and its neighbours: blocks), how is it found (mapping), what is replaced. Each address maps to exactly one set. Direct mapped: one block per set, S = B. N-way set associative: N blocks per set, S = B/N. Fully associative: S = 1, B ways (Table 8.2). Book examples: 32-bit byte addresses, 32-bit words, C = 8 words. Direct mapped, b = 1 (Figure 8.5/8.7): byte offset 2 bits (00 for words), set bits log2 S = 3, tag 27 bits; each entry holds V (valid bit), tag and data: an 8-entry × (1 + 27 + 32)-bit SRAM; hit = V AND tag match. Example 8.4: 0x14 → set 5 (also 0x34, 0x54, …). Example 8.5: 1024 sets, b = 1 → 10 set bits, 20 tag bits. 0xFFFFFFE4 → set 1, tag all 1s. Two-way, b = 1 (Figure 8.9): 4 sets, 2 set bits, 28-bit tag; two comparators and an output mux. Fully associative (Figure 8.11): 8 comparators, 8:1 mux; best for small caches. Larger blocks (Figure 8.12: C = 8, b = 4 → 2 sets): log2 b = 2 block-offset bits select the word with a mux; one tag per block; 0x8000009C → set 1, word 3, tag 27 bits. Larger blocks exploit spatial locality but mean fewer blocks (more conflicts) and a larger miss penalty.",
    steps: [
      { k: "learn", title: "Sets and ways", b: [
        `<div class="tbl"><table><thead><tr><th>Organization</th><th>Ways N</th><th>Sets S</th></tr></thead><tbody>
          <tr><td>Direct mapped</td><td>1</td><td>B</td></tr><tr><td>N-way set associative</td><td>1 &lt; N &lt; B</td><td>B / N</td></tr><tr><td>Fully associative</td><td>B</td><td>1</td></tr></tbody></table></div>`,
        `<p>An address picks exactly one <b>set</b>; within the set it may sit in any <b>way</b>. Each entry stores a <b>valid bit</b>, a <b>tag</b>, and the data block.</p>`,
      ]},
      { k: "learn", title: "Splitting the address", b: [
        `<div class="tbl"><table style="text-align:center"><tbody><tr><td style="background:var(--accent-soft)">Tag</td><td style="background:var(--cool-soft)">Set (log<sub>2</sub>S)</td><td style="background:var(--good-soft)">Block offset (log<sub>2</sub>b)</td><td>Byte offset (2)</td></tr></tbody></table></div>`,
        `<p>Hit = valid AND the stored tag equals the address's tag. The book's 8-word direct-mapped cache: 2 byte-offset bits, 3 set bits, 27 tag bits.</p>`,
      ]},
      { k: "play", title: "Split some addresses", b: [
        fieldWidget,
        `<p class="aside">Try the book's examples: 0x14 (Example 8.4), 0xFFFFFFE4 (Figure 8.6), 0x8000009C (Figure 8.13).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "In the 8-word direct-mapped cache (b = 1), which set does address 0x2C map to?", a: 3, tol: 0.01, why: "0x2C = 10 1100: drop byte offset 00 → 1011; set = low 3 bits = 011 = 3." },
        { t: "mcq", q: "Why does the 2-way cache need two comparators?", opts: [["The block could be in either way of the set, so both tags are checked at once", true, "Then a mux picks the hitting way's data."], ["To compare the set bits", false, "The set bits just index the SRAM."], ["Because its tag is 28 bits", false, "Width doesn't change how many comparisons."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a direct-mapped cache decide if an access hits?", model: "It uses the set bits of the address to index one entry of the cache SRAM. It reads that entry's valid bit and tag and compares the tag with the upper bits of the address. If the entry is valid and the tags match, it's a hit and the stored data is returned; otherwise it's a miss and the block is fetched from main memory." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Watch a cache work", mins: 20,
    blurb: "Run the book's loops through the book's three 8-word caches. See temporal locality, conflicts, associativity and big blocks.",
    takeaway: "Example 8.6 (temporal locality): loop of lw 0x4, 0xC, 0x8, five times, 8-word direct-mapped cache: sets 1, 3, 2; first iteration misses, rest hit: 3/15 = 20%; tags 0. Example 8.7 (conflict): 0x4 and 0x24 both map to set 1 and evict each other every time: 100% miss rate. Example 8.8: the same loop on the 2-way cache: both fit in the two ways of set 1: 2/10 = 20%. Example 8.9 (spatial locality): Example 8.6's loop with b = 4: the first access to 0x4 loads 0x0–0xC; all later accesses hit: 1/15 = 6.67%. Example 8.10 (LRU): 2-way, 0x4, 0x24, 0x54 all map to set 1; 0x54 replaces the least recently used way (way 0, holding 0x4); the use bit U then points at way 1.",
    steps: [
      { k: "play", title: "The cache simulator", b: [
        cacheSim,
        `<p class="aside">Start with Ex 8.6 on the direct-mapped cache, then try it with b = 4 (Example 8.9). Then Ex 8.7 on direct mapped vs 2-way (Example 8.8). Green ✓ = hit, red ✗ = miss.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why is Example 8.7's miss rate 100% on the direct-mapped cache?", opts: [["0x4 and 0x24 map to the same set and keep evicting each other", true, "A conflict: only one block per set."], ["The cache is too small for two words", false, "It holds 8 words; the problem is where they map."], ["0x24 isn't word-aligned", false, "It is."]] },
        { t: "mcq", q: "In Example 8.10, after 0x54 is loaded, which address is no longer in the cache?", opts: [["0x4", true, "It was least recently used, in way 0."], ["0x24", false, "It was used more recently than 0x4."], ["Neither", false, "Set 1 has only two ways for three addresses."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why did a block size of 4 words cut Example 8.6's misses from 3 to 1?", model: "The loop uses addresses 0x4, 0x8 and 0xC, which are neighbours. With four-word blocks, the first miss on 0x4 brings in the whole block from 0x0 to 0xC, so the accesses to 0xC and 0x8 already find their data in the cache. That's spatial locality being exploited." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Replacement, miss types, multilevel caches, writes", mins: 20,
    blurb: "Evict the least recently used. Classify misses. Add an L2. Decide when writes reach memory.",
    takeaway: "Replacement: direct mapped has no choice. Associative caches evict the least recently used (LRU) block; in a 2-way cache a use bit U per set points to the LRU way. With more ways, pseudo-LRU: split ways into two groups, U marks the LRU group, replace a random block in it. Multilevel caches (Figure 8.16): small L1 (1–2 cycles), larger slower L2 (SRAM), then main memory. Example 8.11: L1 1 cycle, L2 10, memory 100; L1 miss 5%, L2 miss 20% (of L1 misses): AMAT = 1 + 0.05[10 + 0.2(100)] = 2.5 cycles. The L2 miss rate looks high because it only sees the hard accesses (≈1% if accessed directly). Miss types: compulsory (first access to a block), capacity (cache too small for the working set), conflict (several addresses compete for a set). Bigger capacity reduces capacity and conflict misses but not compulsory; bigger blocks reduce compulsory misses but may add conflicts. Figure 8.17 (SPEC2000): associativity beyond 4–8 ways helps little; Figure 8.18: for small caches, blocks beyond 64 bytes raise the miss rate; large blocks also raise the miss penalty. Write policy: on a store, fetch the block on a miss, then write the word. Write-through: also write main memory every time. Write-back: dirty bit D; write the block to memory only when evicted. Example 8.12: four sw to one 4-word block: 4 memory writes write-through, 1 write-back. Modern caches are write-back. MIPS evolution (Table 8.3): R2000 (1985) no cache … MIPS32 1074K (2010) 32 KB L1, variable L2.",
    steps: [
      { k: "learn", title: "What gets replaced", b: [
        `<p>Direct mapped: no choice. Associative: evict the <b>least recently used</b> (LRU) block. A 2-way cache needs one <b>use bit</b> per set. Wider caches use pseudo-LRU (track the LRU <i>group</i>, pick randomly within it).</p>`,
        `<div class="tbl"><table><thead><tr><th>Miss type</th><th>Cause</th></tr></thead><tbody><tr><td>Compulsory</td><td>first access to a block</td></tr><tr><td>Capacity</td><td>the data in use doesn't fit</td></tr><tr><td>Conflict</td><td>addresses fight over one set</td></tr></tbody></table></div>`,
      ]},
      { k: "check", title: "Classify", b: [
        { t: "sort", q: "Which kind of miss?", bins: ["Compulsory", "Capacity", "Conflict"], items: [
          ["The very first time a program touches an array", 0, "The block has never been loaded."],
          ["Example 8.7: 0x4 and 0x24 in a direct-mapped cache, again and again", 2, "Plenty of room overall; both map to set 1."],
          ["A loop sweeps 1 MB of data through a 32 KB cache, over and over", 1, "The working set simply doesn't fit."],
        ]},
      ]},
      { k: "learn", title: "Two levels: Example 8.11", b: [
        `<p class="eq">AMAT = 1 + 0.05 [10 + 0.2 (100)] = 2.5 cycles</p>`,
        `<p>L2's 20% miss rate looks bad, but it only sees the <i>hard</i> accesses that already missed L1. Given all accesses directly, it would miss about 1%.</p>`,
      ]},
      { k: "learn", title: "Writes", b: [
        `<div class="two"><div class="tile"><h3>Write-through</h3><p>Every store also writes main memory. Simple; lots of memory traffic.</p></div><div class="tile"><h3>Write-back</h3><p>Mark the block <b>dirty</b>; write it to memory only when it's evicted. Usual today.</p></div></div>`,
        `<p><b>Example 8.12</b>: four stores into one 4-word block: write-through makes 4 memory writes, write-back makes 1.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "L1: 2 cycles, 10% miss. L2: 15 cycles, 30% of L1 misses also miss. Memory: 200 cycles. AMAT in cycles?", a: 9.5, tol: 0.01, why: "2 + 0.1 × (15 + 0.3 × 200) = 2 + 0.1 × 75 = 9.5." },
        { t: "mcq", q: "Why doesn't a write-through cache need a dirty bit?", opts: [["Memory is always up to date, so evicting never requires a write", true, "Every store already went to memory."], ["It never evicts", false, "It evicts like any cache."], ["Its blocks are one word", false, "Block size doesn't matter here."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does LRU replacement work in a two-way set associative cache?", model: "Each set has a use bit that records which of its two ways was least recently used. Every hit or fill updates the bit to point at the other way. On a miss in a full set, the block in the way the use bit points to is evicted and replaced, since by temporal locality it's the one less likely to be needed soon." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Virtual memory and address translation", mins: 20,
    blurb: "Programs use virtual addresses. Pages live in DRAM or on disk. A page table translates the page number; the offset passes through.",
    takeaway: "Virtual memory: the hard drive gives the illusion of a large memory (e.g., 2 GB virtual with 128 MB physical). Programs use virtual addresses; physical memory holds the most recently used subset: it's a cache for virtual memory. Terms (Table 8.4): block ↔ page, block size ↔ page size, block offset ↔ page offset, miss ↔ page fault, tag ↔ virtual page number. Pages are typically 4 KB. Physical memory is fully associative (any virtual page in any physical page) to avoid conflict faults, but instead of comparators a page table translates. Address translation: page offset (low 12 bits) is untouched; VPN → PPN. Figure 8.21: 2 GB = 2^31 virtual (31 address bits), 128 MB = 2^27 physical (27 bits), 4 KB pages: 2^19 virtual pages (19-bit VPN) and 2^15 physical pages (15-bit PPN); physical memory holds 1/16 of the virtual pages. VPN 5 → PPN 1: 0x53F8 → 0x13F8. Example 8.13/8.14: 0x247C: VPN 0x2 → PPN 0x7FFF → 0x7FFF47C. The page table (Figure 8.23) has an entry per virtual page with a valid bit and PPN; V = 0 means on disk (page fault: the OS loads it). It's stored in physical memory at the address in a page table register, so each load/store needs two physical accesses: page table + data.",
    steps: [
      { k: "learn", title: "Same idea, new names", b: [
        `<div class="tbl"><table><thead><tr><th>Cache</th><th>Virtual memory</th></tr></thead><tbody><tr><td>block</td><td>page (4 KB)</td></tr><tr><td>block offset</td><td>page offset</td></tr><tr><td>miss</td><td>page fault</td></tr><tr><td>tag</td><td>virtual page number</td></tr></tbody></table></div>`,
        `<p>Physical memory acts as a <b>fully associative</b> cache for the disk: any virtual page can live in any physical page. A page fault costs milliseconds, so avoiding conflicts is worth it.</p>`,
      ]},
      { k: "learn", title: "The book's system (Figure 8.21)", b: [
        `<div class="tbl"><table><tbody><tr><td>Virtual memory</td><td>2 GB = 2<sup>31</sup> bytes</td><td>VPN = 31 − 12 = 19 bits</td></tr><tr><td>Physical memory</td><td>128 MB = 2<sup>27</sup> bytes</td><td>PPN = 27 − 12 = 15 bits</td></tr><tr><td>Page</td><td>4 KB = 2<sup>12</sup> bytes</td><td>12-bit offset, not translated</td></tr></tbody></table></div>`,
        `<p>The <b>page table</b> has one entry per virtual page: a valid bit and a physical page number. It lives in physical memory, found through the page table register.</p>`,
      ]},
      { k: "play", title: "Translate an address", b: [
        translate,
        `<p class="aside">This uses the book's page table and the two-entry TLB from Example 8.15 (next part explains the TLB).</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Virtual address 0x5123 in the book's system. Physical address?", opts: [["0x1123", true, "VPN 5 → PPN 1; offset 0x123 unchanged."], ["0x5123", false, "The page number is translated."], ["Page fault", false, "VPN 5 is valid."]] },
        { t: "mcq", q: "Why is the page offset never translated?", opts: [["Virtual and physical pages are the same size, so a byte's position within its page doesn't change", true, "Only which page it's in changes."], ["The offset is always zero", false, "It's any of 4096 values."], ["The TLB handles it", false, "The TLB translates page numbers."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe how the book's system translates virtual address 0x247C.", model: "The low 12 bits, 0x47C, are the page offset and pass straight through. The upper 19 bits are the virtual page number, 0x2. The page table entry for VPN 2 is valid and holds physical page number 0x7FFF. Concatenating the PPN with the offset gives physical address 0x7FFF47C." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "TLBs, protection, and multilevel page tables", mins: 20,
    blurb: "Cache the translations, give every program its own address space, and don't keep the whole page table in memory.",
    takeaway: "A page table read on every access would double load/store time, but page-table accesses have great temporal locality (big pages, consecutive accesses). The translation lookaside buffer (TLB) caches recent page table entries: fully associative, 16–512 entries, each with V, VPN and PPN; accessed with the VPN in under a cycle; hit rates > 99%; most loads/stores need one memory access instead of two. Example 8.15: two-entry TLB holding VPN 0x2 → 0x7FFF and 0x7FFFD → 0x0000: 0x247C hits → 0x7FFF47C; 0x5FB0 misses → page table. Memory protection: each program has its own virtual address space and page table, so it can only reach physical pages mapped there; control bits allow controlled sharing (e.g., read-only). Replacement: write-back (paging; the disk is swap space) and approximate LRU: dirty bit D (write back only if changed) and use bit U (OS periodically clears; evict a page with U = 0). Multilevel page tables: a flat table for 2 GB/4 KB needs 2^19 entries × 4 B = 2 MB. Two levels (Figure 8.26): VPN = 9-bit page table number (first-level, 512 entries, always resident) + 10-bit page table offset (second-level tables of 1 K entries, can be paged out). With two second-level tables resident: 512 × 4 B + 2 × 1 K × 4 B = 10 KB. Cost: an extra memory access on a TLB miss. Example 8.16: 0x003FEFB0 → table number 0x0, offset 0x3FE, page offset 0xFB0 → first-level entry 0 → second-level table at 0x2375000 → entry 0x3FE: PPN 0x23F1 → 0x23F1FB0.",
    steps: [
      { k: "learn", title: "The TLB", b: [
        `<p>Without help, every load or store needs <b>two</b> physical memory accesses: the page table entry, then the data. But consecutive accesses usually hit the same page.</p>`,
        `<p>The <b>TLB</b> is a small, fully associative cache of recent translations (VPN → PPN), 16–512 entries, under a cycle, &gt; 99% hit rate. Most accesses go back to one memory access.</p>`,
        `<p>Go back to the translate widget: 0x247C hits the TLB; 0x5FB0 misses and walks the page table (Example 8.15).</p>`,
      ]},
      { k: "learn", title: "Protection and replacement", b: [
        `<p><b>Protection</b>: each program has its own page table. It can only reach physical pages mapped there, so it can't touch another program's memory. Control bits allow sharing safely.</p>`,
        `<p><b>Replacement</b>: write-back (paging to swap space) with approximate LRU: a <b>dirty</b> bit (write back only if changed) and a <b>use</b> bit (the OS clears them periodically and evicts a page whose U is still 0).</p>`,
        seenPP("Privilege and protected system space in the LC-3.", "09-io.html", "Patt & Patel Chapter 9"),
      ]},
      { k: "learn", title: "Two-level page tables", b: [
        `<p>A flat table for 2 GB of 4 KB pages: 2<sup>19</sup> entries × 4 B = <b>2 MB</b>, always in memory.</p>`,
        `<div class="tbl"><table style="text-align:center"><tbody><tr><td style="background:var(--accent-soft)">page table number (9)</td><td style="background:var(--cool-soft)">page table offset (10)</td><td>page offset (12)</td></tr></tbody></table></div>`,
        `<p>The 512-entry first-level table stays resident; the 1 K-entry second-level tables can be paged out. With two resident: 512 × 4 + 2 × 1024 × 4 B = <b>10 KB</b>. Cost: one more memory access when the TLB misses.</p>`,
        `<p><b>Example 8.16</b>: 0x003FEFB0 → table 0x0, offset 0x3FE, page offset 0xFB0 → second-level entry 0x3FE holds PPN 0x23F1 → <b>0x23F1FB0</b>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why is the TLB fully associative while the page table is not?", opts: [["It's tiny, so comparing every entry is affordable, and it avoids conflict misses", true, "A page table with 2¹⁹ entries is simply indexed by VPN."], ["The page table has no tags", false, "It's indexed directly; no tags needed."], ["Fully associative caches are slower", false, "That's a reason against, not for."]] },
        { t: "mcq", q: "In the two-level scheme, what are the page table number and offset for virtual address 0x00403123?", opts: [["0x1 and 0x003", true, "VPN = 0x00403 = 0 0000 0001 | 00 0000 0011: top 9 bits = 1, low 10 bits = 3."], ["0x0 and 0x403", false, "The 19-bit VPN 0x00403 must be split 9 | 10."], ["0x4 and 0x003", false, "Count the bits: 0x403 = 100 0000 0011."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does virtual memory keep one program from reading another program's data?", model: "Each program gets its own virtual address space and its own page table, set up by the operating system. A program's loads and stores can only be translated to physical pages that appear in its own page table, so another program's physical pages are simply unreachable unless the OS deliberately maps a shared page, with control bits limiting what's allowed." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Memory-mapped I/O", mins: 15,
    blurb: "Give each device register an address. An address decoder steers stores to the right register and loads from the right source.",
    takeaway: "I/O systems connect the computer to peripherals (keyboards, monitors, toasters' heaters, fuel injectors…). Memory-mapped I/O: part of the address space (e.g., 0xFFFF0000–0xFFFFFFFF, in MIPS's reserved region) is assigned to I/O devices; a store to a device address sends data to it, a load receives data. Hardware (Figure 8.28): an address decoder uses Address and MemWrite to generate write enables (WEM for memory, WE1, WE2 for write-enabled registers driving the devices) and RDsel for a ReadData multiplexer (00 memory, 01 device 1, 10 device 2). Example 8.17: device 1 at 0xFFFFFFF4: addi $t0, $0, 7; sw $t0, 0xFFF4($0) (sign-extended to 0xFFFFFFF4) asserts WE1; lw $t1, 0xFFF4($0) sets RDsel = 01. Device driver: software that talks to a device so other programs needn't know the hardware; device addresses are called I/O registers. x86 instead uses programmed I/O with special instructions (like lwio/swio).",
    steps: [
      { k: "learn", title: "Addresses for devices", b: [
        `<p>Reserve a slice of the address space (say 0xFFFF0000–0xFFFFFFFF) for I/O. A <b>store</b> there sends data to a device; a <b>load</b> reads from one.</p>`,
        pre(`addi $t0, $0, 7
sw   $t0, 0xFFF4($0)   # 0xFFF4 sign-extends to 0xFFFFFFF4: write 7 to device 1
lw   $t1, 0xFFF4($0)   # read device 1`),
        seenPP("The LC-3's KBSR/KBDR/DSR/DDR at xFE00–xFE06.", "09-io.html", "Patt & Patel Chapter 9"),
      ]},
      { k: "play", title: "The address decoder (Figure 8.28)", b: [
        decoder,
        `<p class="aside">The book places Device 1 at 0xFFFFFFF4; Device 2's address here is just an example.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why can sw $t0, 0xFFF4($0) reach address 0xFFFFFFF4?", opts: [["The 16-bit immediate 0xFFF4 is sign-extended to 0xFFFFFFF4 and added to $0", true, "Its top bit is 1, so the upper 16 bits fill with 1s."], ["MIPS ignores the upper address bits", false, "All 32 bits matter."], ["$0 holds 0xFFFF0000", false, "$0 is always 0."]] },
        { t: "mcq", q: "What is a device driver?", opts: [["Software that knows a device's I/O registers so other programs don't have to", true, "Programs call its functions instead."], ["The address decoder", false, "That's hardware."], ["A power transistor", false, "That's a motor driver, later."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does the address decoder do on a lw from a device address?", model: "It sees the address belongs to a particular I/O device and that MemWrite is 0, so it asserts no write enables and sets the RDsel select of the ReadData multiplexer to choose that device's output instead of memory. The device's value travels over ReadData into the destination register." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Microcontrollers and digital I/O", mins: 20,
    blurb: "A MIPS-based PIC32 with flash, RAM and peripherals on one chip. Its pins are GPIO ports controlled by TRIS and PORT registers.",
    takeaway: "Embedded systems control physical devices, usually with a microcontroller (MCU): a processor plus peripherals (GPIO, serial ports, timers, ADCs) on one cheap, low-power chip; 8-bit (8051, PIC16/18, AVR/Arduino) to 32-bit (Renesas, ARM, PIC32). The book uses Microchip's PIC32MX675F512H: a 32-bit MIPS core (M4K), 512 KB flash (program), 64 KB RAM, peripherals on a peripheral bus, USB/Ethernet via a bus matrix. Memory map (Figure 8.30, virtual): RAM at 0xA0000000, program flash at 0xBD000000, special function registers (SFRs) at 0xBF800000–0xBF8FFFFF, boot flash at 0xBFC00000 (reset PC). Minimal system (Figure 8.33): 3.3 V regulator, bypass capacitors, 40 MHz oscillator (or internal 8 MHz ± 2%), reset button pulling active-low MCLR, ICD3 programming jack. Power: ~1–2 mA/MHz; at 80 MHz, 3.3 V × 120 mA ≈ 0.4 W; 47 °C/W package → ~19 °C rise. PBCLK = SYSCLK divided (e.g., 20 MHz). GPIO: ports RA–RG of up to 16 pins; TRISx bit 0 = output, 1 = input (unused pins should stay inputs); PORTx reads inputs/drives outputs; SET and CLR registers write masks (PORTDSET = 0b0101 sets bits 0 and 2; PORTDCLR = 0b1000 clears bit 3: 1110 → 0111). Individual bits: PORTDbits.RD0. TRISD at 0xBF8860C0, PORTD at 0xBF8860D0. Example 8.18: TRISD = 0xFF00; switches = (PORTD >> 8) & 0xF; PORTD = switches. Levels: VIL = 0.15 VDD, VIH = 0.8 VDD; VOL 0.4 V, VOH 2.4 V up to 7 mA.",
    steps: [
      { k: "learn", title: "A computer on one chip", b: [
        `<p>A <b>microcontroller</b> = processor + flash + RAM + peripherals (digital pins, serial ports, timers, ADC) on a chip that costs a few dollars and uses milliwatts. About 150 in a 2010 home, 50 in a car.</p>`,
        `<p>The book's PIC32 has a MIPS core, 512 KB flash, 64 KB RAM. Its peripherals are <b>memory-mapped</b> special function registers (SFRs) at 0xBF800000–0xBF8FFFFF. On reset the PC starts in boot flash at 0xBFC00000.</p>`,
      ]},
      { k: "learn", title: "GPIO: TRIS and PORT", b: [
        `<div class="tbl"><table><tbody><tr><td><b>TRISx</b></td><td>per pin: 0 = output, 1 = input (keep unused pins as inputs)</td></tr><tr><td><b>PORTx</b></td><td>read inputs / drive outputs</td></tr><tr><td><b>PORTxSET / CLR</b></td><td>write a mask to set / clear only those bits</td></tr></tbody></table></div>`,
        `<p>Mnemonic: TRIS = TRIState; a 1 looks like an I (Input), a 0 like an O (Output).</p>`,
      ]},
      { k: "play", title: "Example 8.18: switches to LEDs", b: [
        pre(`TRISD = 0xFF00;                     // RD[11:8] inputs, RD[7:0] outputs
while (1) {
  switches = (PORTD >> 8) & 0xF;    // read RD[11:8]
  PORTD = switches;                 // light RD[3:0]
}`),
        gpio,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "The bottom four bits of PORTD are 1110. After PORTDSET = 0b0101 and PORTDCLR = 0b1000, they are…", opts: [["0111", true, "Set bits 0 and 2, clear bit 3 (the book's example)."], ["0101", false, "SET doesn't clear the other bits."], ["1111", false, "Bit 3 was cleared."]] },
        { t: "mcq", q: "Why leave unused GPIO pins configured as inputs?", opts: [["So they can't accidentally drive a troublesome value onto whatever they're connected to", true, "Inputs are the safe default."], ["Inputs use more power", false, "That's not the reason."], ["Outputs can't be read", false, "They can."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a PIC32 program read four switches on RD[11:8]?", model: "First it configures those pins as inputs by setting bits 11 to 8 of TRISD to 1. Then it reads the PORTD register, which is memory-mapped, shifts the value right by 8 and masks it with 0xF to keep just the four switch bits." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "Serial I/O: SPI and UART", mins: 20,
    blurb: "Few wires, one bit at a time. SPI shares a clock; a UART agrees on a baud rate and frames each byte with start and stop bits.",
    takeaway: "Serial I/O sends one bit at a time (few wires); parallel sends several. Standards: SPI, UART (RS-232), I2C (2-wire: clock + bidirectional data), USB, Ethernet. SPI (synchronous): master drives SCK; data out on SDO (MSB first) while the slave answers on SDI; always both directions. PIC32 SPI1–4 registers SPIxCON (ON bit 15, MSTEN bit 5, CKE bit 8, CKP, SMP, MODE16/32), SPIxSTAT (SPIBUSY), SPIxBRG, SPIxBUF. fSPI = fperipheral/(2(BRG + 1)) (8.3): 20 MHz → 1.25 MHz with BRG = 7. CKE/CKP/SMP set clock-to-data timing (Figure 8.39); mismatches garble data. Baud = symbols/s; bit rate = bits/s; with 2-level signaling they're equal per symbol, but overhead bits reduce the data rate (9600 baud with 2 overhead bits per 8 → 7680 data bits/s). UART (asynchronous): no clock; both sides agree on the rate and each makes its own clock. Line idles at 1; each character: start bit 0, 7–8 data bits (LSB first), optional parity, 1+ stop bits (1); the receiver locks on the falling edge of the start bit. Common: 8 data, no parity, 1 stop (8N1); rates 300 … 9600, 115200 baud; 9600 baud ≈ 960 characters/s. RS-232: 0 = +3 to +15 V, 1 = −3 to −15 V; DTE/DCE, TX/RX, flow control (RTS/CTS). PIC32 U1–U6: UxMODE, UxSTA, UxBRG, UxTXREG, UxRXREG; fUART = fperipheral/(16(BRG + 1)) (8.4); at 20 MHz BRG = 129 → 9615 baud, BRG = 10 → 113,636 (−1.4% from 115,200), close enough because the receiver resynchronizes on every start bit.",
    steps: [
      { k: "learn", title: "SPI: a shared clock", b: [
        `<p>Three wires: the master drives <b>SCK</b>; data goes out on <b>SDO</b> (most significant bit first) while the slave answers on <b>SDI</b>. Every transfer goes both ways.</p>`,
        `<p class="eq">f<sub>SPI</sub> = f<sub>peripheral</sub> / (2 (BRG + 1))</p><p>20 MHz peripheral clock, BRG = 7 → 1.25 MHz.</p>`,
        `<p>Clock polarity and edge bits (CKP, CKE, SMP) must match the slave, or the data comes out garbled.</p>`,
      ]},
      { k: "learn", title: "UART: no clock at all", b: [
        `<p>Both sides agree on a <b>baud rate</b> in advance. The line idles at 1. Each character: a <b>start bit</b> (0), 8 data bits <b>LSB first</b>, maybe a parity bit, then a <b>stop bit</b> (1). The receiver times everything from the start bit's falling edge.</p>`,
        `<p class="eq">f<sub>UART</sub> = f<sub>peripheral</sub> / (16 (BRG + 1))</p>`,
      ]},
      { k: "play", title: "See a frame", b: [
        uartFrame,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "8N1 at 9600 baud: how many milliseconds does one character take? (2 decimals)", a: 1.04, tol: 0.01, why: "10 bits (start + 8 + stop) / 9600 = 1.04 ms, about 960 characters per second." },
        { t: "num", q: "A UART at 19200 baud uses 8N1 framing. Useful data bits per second?", a: 15360, tol: 0.5, why: "8 of every 10 bits are data: 19200 × 0.8 = 15,360." },
        { t: "mcq", q: "Why can a UART tolerate a clock that's 1–2% off?", opts: [["The receiver resynchronizes on every start bit, so error only accumulates over one frame", true, "10 bits × 1.4% stays well inside one bit time."], ["It sends its clock too", false, "That's SPI."], ["Parity corrects it", false, "Parity only detects bit errors."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Compare SPI and a UART.", model: "SPI is synchronous: the master sends a clock on SCK and data moves on SDO and SDI with each clock edge, in both directions at once, and it can run at tens of MHz. A UART is asynchronous: there's no clock wire, so both ends agree on a baud rate, the line idles high, and each character is framed by a start bit and stop bits so the receiver can find it. It's slower but needs only TX and RX." },
      ]},
    ],
  };

  /* =============== PART 11 =============== */
  const p11 = {
    id: "p11", title: "Timers, interrupts, and analog I/O", mins: 25,
    blurb: "Count clock ticks to measure time; let hardware events interrupt you; turn voltages into numbers and back, or fake analog with PWM.",
    takeaway: "Timers: PIC32 has five 16-bit timers (Timer1 type A can use an asynchronous external clock, e.g., a 32 kHz watch crystal; type B timers 2/3 and 4/5 can pair into 32-bit timers). Registers TxCON (ON bit 15, TCKPS prescaler: type A 1, 8, 64, 256; type B 1, 2, 4, 8, 16, 32, 64, 256), TMRx (count), PRx (period): at PR the timer rolls to 0 and sets TxIF in IFS0; poll it or take an interrupt. Interrupts: events set flag bits in IFS registers; if the matching IEC enable bit is set, an interrupt service routine (ISR) runs and must clear the IFS bit. Single-vector mode (one ISR reads CAUSE) or multi-vector (MVEC bit in INTCON); enable with ei. Priorities 0–7 (7 highest) plus subpriorities; higher priority preempts. ADC/DAC: resolution N, range, sampling rate fs, accuracy. X[n] = 2^N (Vin − Vref−)/(Vref+ − Vref−) (8.5): 12-bit, 0–5 V, 2.5 V → 0x800. Vout = X[n]/2^N × Vref (8.6). PIC32: 10-bit successive-approximation ADC, up to 1 Msps, 16 inputs AN0–AN15 (shared with port B), 12 TAD per conversion; registers AD1CON1–3, AD1CHS, AD1PCFG (0 = analog), ADC1BUF0. No built-in DAC: use external DACs (AD558 8-bit parallel, 0–2.56 V; LTC1257 12-bit serial). PWM: periodic pulse; duty cycle = pulse width/period; average ∝ duty (25% of 3.3 V = 0.825 V); low-pass filter it. PIC32 output compare OC1–OC5 with Timer 2/3; PWM mode OCM = 110; OCxRS sets duty, PRx sets period. Example 8.25: 20 MHz/256 = 78.125 kHz PWM, RC 1 kΩ, 0.1 µF → fc ≈ 1.6 kHz.",
    steps: [
      { k: "learn", title: "Timers and interrupts", b: [
        `<p>A timer counts peripheral-clock ticks (optionally divided by a <b>prescaler</b>). When the count reaches the <b>period register</b> PR it wraps to 0 and sets a flag. Poll the flag, or let it <b>interrupt</b>.</p>`,
        `<p>Interrupts: an event sets its <b>IFS</b> flag; if its <b>IEC</b> enable bit is 1, the ISR runs (and must clear the flag). Priorities 0–7; a higher one preempts a lower one.</p>`,
        seenPP("Interrupt enable bits, priorities, and service routines.", "09-io.html", "Patt & Patel Chapter 9"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 16-bit timer counts a 20 MHz clock with a 256:1 prescaler. Longest interval before it wraps, in seconds? (3 decimals)", a: 0.839, tol: 0.002, why: "One tick = 256 / 20 MHz = 12.8 µs; 65,536 ticks × 12.8 µs ≈ 0.839 s." },
      ]},
      { k: "learn", title: "Analog to digital", b: [
        `<p class="eq">X = 2<sup>N</sup> (V<sub>in</sub> − V<sub>ref−</sub>) / (V<sub>ref+</sub> − V<sub>ref−</sub>)</p>`,
        `<p>Book example: 12 bits over 0–5 V; 2.5 V (half scale) → 1000 0000 0000 = 0x800.</p>`,
      ]},
      { k: "play", title: "The PIC32's 10-bit ADC", b: [
        adc,
      ]},
      { k: "learn", title: "Faking analog output: PWM", b: [
        `<p>No DAC? Switch a pin on for part of each period. The <b>duty cycle</b> = pulse width / period, and the <b>average</b> voltage is proportional to it. A low-pass filter smooths away the switching.</p>`,
        `<p>Example 8.25: a 20 MHz timer with a 256-tick period gives 78.125 kHz PWM; an RC filter (1 kΩ, 0.1 µF) has its corner at ≈ 1.6 kHz.</p>`,
      ]},
      { k: "play", title: "PWM average", b: [
        pwm,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 12-bit ADC spans 0–3.3 V. What code does 0.825 V produce?", a: 1024, tol: 1, why: "2¹² × 0.825/3.3 = 4096 × 0.25 = 1024." },
        { t: "mcq", q: "Why must the PWM filter's corner frequency be far below the PWM frequency?", opts: [["To remove the switching ripple and keep only the slowly varying average", true, "78 kHz switching vs a 1.6 kHz corner."], ["To make the output louder", false, "It only filters."], ["Because the timer needs it", false, "The filter is analog, outside the chip."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does PWM produce an analog voltage from a digital pin?", model: "The pin switches between 0 and VDD with a fixed period, staying high for a fraction of each period called the duty cycle. The average of that waveform is the duty cycle times VDD. A low-pass filter with a corner frequency well below the switching frequency removes the fast switching and leaves that average as a steady analog voltage." },
      ]},
    ],
  };

  /* =============== PART 12 =============== */
  const p12 = {
    id: "p12", title: "Other peripherals: displays, radios, motors", mins: 15,
    blurb: "Character LCDs, VGA, Bluetooth, and motors: DC through an H-bridge, servos by pulse width, steppers one coil at a time.",
    takeaway: "Other peripherals (8.6.7): character LCDs (parallel interface, commands and data), VGA monitors (timing of horizontal/vertical sync and pixel colors, generated by hardware such as an FPGA), Bluetooth wireless links (e.g., over a UART), and motors. Motors draw large currents and inject noise; drive them separately from the logic. DC motor: stator magnets, rotor electromagnet, commutator and brushes reverse current to keep spinning; thousands of RPM at low torque, so add a gear train. H-bridge (Figure 8.59): four switches; A and D closed → current one way; B and C → the other way; A and C or B and D → motor terminals shorted: active brake; none → coast. Microcontrollers can't supply motor current directly; an H-bridge chip (e.g., dual H-bridge, Figure 8.60) uses power transistors with logic inputs and enable pins (PWM on the enable controls speed). Servo: DC motor + gears + shaft encoder (potentiometer) + control logic; limited rotation (typically 180°); 3 pins (power ~5 V, ground, control); control is a ~50 Hz PWM signal: 0.5 ms → 0°, 1.5 ms → 90°, 2.5 ms → 180°; no H-bridge needed. Stepper: discrete steps (a few degrees); two phases (coils); bipolar (needs an H-bridge, more powerful) or unipolar; simplified 90° motor: wave drive energizes AB → CD → BA → DC; two-phase-on drive (AB,CD) → (BA,CD) → (BA,DC) → (AB,DC) (more torque, halfway positions); half-step drive combines both.",
    steps: [
      { k: "learn", title: "Displays and radios", b: [
        `<p>Character <b>LCDs</b> take commands and characters over a parallel interface. <b>VGA</b> monitors need precise sync and pixel timing, usually generated by dedicated hardware. <b>Bluetooth</b> modules can look like a UART to the microcontroller.</p>`,
      ]},
      { k: "play", title: "DC motor: the H-bridge", b: [
        hbridge,
        `<p class="aside">A microcontroller pin can't supply motor current; the H-bridge's power transistors do, under logic control. PWM on its enable input controls speed.</p>`,
      ]},
      { k: "play", title: "Servo: position by pulse width", b: [
        servo,
      ]},
      { k: "learn", title: "Stepper motors", b: [
        `<p>A stepper moves in fixed steps as its coils are energized in sequence. The book's simplified two-phase bipolar motor steps 90° at a time.</p>`,
        `<div class="tbl"><table><tbody><tr><td>Wave drive</td><td class="mono">AB → CD → BA → DC</td></tr><tr><td>Two-phase-on</td><td class="mono">(AB,CD) → (BA,CD) → (BA,DC) → (AB,DC)</td></tr></tbody></table></div><p>BA means coil AB with current reversed: “bipolar.” Bipolar steppers need H-bridges.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A 180° servo gets a 2.0 ms pulse. Angle in degrees?", a: 135, tol: 0.5, why: "0.5 ms → 0°, each extra 1 ms adds 90°: (2.0 − 0.5) × 90 = 135°." },
        { t: "mcq", q: "Why doesn't a servo need an H-bridge?", opts: [["Its power comes from its own power pin; the control pin only carries a low-current PWM signal", true, "The servo's internal electronics drive the motor."], ["Servos only spin one way", false, "They move both ways within their range."], ["Servos are AC motors", false, "They contain a DC motor."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does an H-bridge let a microcontroller run a DC motor in both directions?", model: "It has four power switches arranged in an H with the motor across the middle. Closing the top-left and bottom-right switches drives current through the motor one way; closing the other diagonal pair drives it the other way. Closing both top or both bottom switches shorts the motor terminals together and brakes it, and opening all of them lets it coast. The microcontroller only drives the low-current logic inputs." },
      ]},
    ],
  };

  /* =============== PART 13 =============== */
  const p13 = {
    id: "p13", title: "PC I/O and x86 memory systems", mins: 15,
    blurb: "High-speed serial links everywhere: USB, PCI Express, SATA, Ethernet; DDR3 memory; and how x86 caches grew from none to three levels.",
    takeaway: "PC I/O has moved to high-speed serial links (differential pairs, > 10 Gb/s over copper). USB: 1.0 (1996) 12 Mb/s, 4 wires, up to 500 mA; 2.0 (2000) 480 Mb/s; 3.0 (2008) 5 Gb/s; plus battery charging. PCI: 32-bit parallel bus at 33 MHz = 133 MB/s, now mostly replaced. PCI Express: lanes of serial links; PCIe 3.0 8 Gb/s per lane; x16 slot ≈ 16 GB/s for graphics. DDR3 memory: DIMMs with a 64-bit data bus, 1.5 V, data on both clock edges; DDR3-1600 uses a 200 MHz memory clock and 800 MHz I/O clock to move 1600 million 64-bit words/s = 12,800 MB/s (PC3-12800). Networking: Ethernet (IEEE 802.3) 10 Mb/s → 100 Mb/s, 1 Gb/s on Cat 5, 10 Gb/s on fiber, 100 Gb/s emerging; Wi-Fi (IEEE 802.11). SATA (Serial ATA) connects hard disks and SSDs. Interfacing a PC to the real world: data acquisition (DAQ) systems over USB, or USB links to microcontrollers. x86 caches (Table 8.13): 80386 none (wait states); 80486 8 KB unified write-through; Pentium separate 8 KB I/D write-back; Pentium Pro L2 in a multichip module; Pentium II cartridge; Pentium III on-chip L2; Pentium 4 trace cache; Core i7 32 KB/core L1s, 256 KB/core L2, 4–15 MB shared L3; DRAM latency now > 100 cycles, so low miss rates are essential. Nonblocking caches let out-of-order cores keep going on a miss. x86 also offers programmed I/O (in/out instructions) besides memory-mapped I/O.",
    steps: [
      { k: "learn", title: "The buses in a PC", b: [
        `<div class="tbl"><table><thead><tr><th>Link</th><th>Speed</th><th>Used for</th></tr></thead><tbody>
          <tr><td>USB 1.0 / 2.0 / 3.0</td><td>12 Mb/s / 480 Mb/s / 5 Gb/s</td><td>keyboards, drives, cameras</td></tr>
          <tr><td>PCI</td><td>33 MHz × 32 bit = 133 MB/s</td><td>old expansion cards</td></tr>
          <tr><td>PCIe 3.0</td><td>8 Gb/s per lane; x16 ≈ 16 GB/s</td><td>graphics cards</td></tr>
          <tr><td>DDR3-1600</td><td>1600 M transfers × 8 B = 12.8 GB/s</td><td>main memory</td></tr>
          <tr><td>Ethernet / Wi-Fi</td><td>100 Mb/s – 10 Gb/s</td><td>networking</td></tr>
          <tr><td>SATA</td><td>serial</td><td>hard drives, SSDs</td></tr></tbody></table></div>`,
        `<p>The trend: wide, slow parallel buses replaced by a few very fast serial lanes.</p>`,
      ]},
      { k: "learn", title: "x86 caches over time", b: [
        `<div class="tbl"><table><thead><tr><th>Chip</th><th>Caches</th></tr></thead><tbody>
          <tr><td>80386 (1985)</td><td>none: memory wait states</td></tr>
          <tr><td>80486 (1989)</td><td>8 KB unified, write-through</td></tr>
          <tr><td>Pentium (1993)</td><td>separate 8 KB I and D, write-back</td></tr>
          <tr><td>Pentium Pro/II/III</td><td>L2 moves closer: module, cartridge, on chip</td></tr>
          <tr><td>Core i7 (2009)</td><td>32 KB L1s and 256 KB L2 per core, 4–15 MB shared L3</td></tr></tbody></table></div>`,
        `<p>DRAM now takes more than 100 processor cycles, so every generation adds cache.</p>`,
        seenHH("x86 processors' microarchitecture history.", "07-microarchitecture.html", "Chapter 7"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "DDR3-1333 moves 1333 million 64-bit transfers per second. Bandwidth in MB/s?", a: 10664, tol: 2, why: "1333 M × 8 bytes = 10,664 MB/s (sold as PC3-10600)." },
        { t: "mcq", q: "Why did the Pentium split its cache into separate instruction and data caches?", opts: [["So an instruction fetch and a data access in the same cycle don't compete", true, "Avoiding contention."], ["Instructions are bigger than data", false, "Not the reason."], ["To save transistors", false, "Two caches aren't cheaper."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why have PC I/O standards moved from parallel buses to serial links?", model: "Wide parallel buses become hard to run fast because the many wires must stay in step with each other and with a shared clock. A serial link sends one fast differential signal per lane, which can run at many gigabits per second over copper, and bandwidth scales by adding lanes, as in PCI Express x16. Serial cables and connectors are also smaller and cheaper." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "hh8", eyebrow: "Harris & Harris · Chapter 8", title: "Memory and I/O Systems",
    intro: `<p>Thirteen parts: the memory hierarchy and how to measure it, caches (finding, replacing, writing, multiple levels), virtual memory and TLBs, memory-mapped I/O, and the embedded and PC I/O that connects a processor to the world.</p><p>You'll step the book's loops through three caches, translate addresses with the book's page table, and play with GPIO, UART frames, ADCs, PWM and motors. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. For cache questions, draw the sets and ways as a table and update it access by access; for virtual memory, write out the bit fields first.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13],
    summary: `
      <h3>Hierarchy and performance</h3>
      <p>Cache (SRAM) → main memory (DRAM) → disk. Locality: temporal, spatial. AMAT = t<sub>cache</sub> + MR(t<sub>MM</sub> + …). Amdahl's Law.</p>
      <h3>Caches</h3>
      <p>C, b, B = C/b, N ways, S = B/N sets. Address = tag | set | block offset | byte offset. LRU (use bit). Compulsory/capacity/conflict misses. L1/L2. Write-through vs write-back (dirty bit).</p>
      <h3>Virtual memory</h3>
      <p>Pages (4 KB), VPN → PPN via page table; offset untranslated; page faults; TLB (fully associative, &gt;99% hits); protection; two-level page tables.</p>
      <h3>I/O</h3>
      <p>Memory-mapped I/O with an address decoder. PIC32: GPIO (TRIS/PORT), SPI, UART (start, 8 data LSB first, stop), timers, interrupts (IFS/IEC, priorities), 10-bit ADC, PWM, H-bridges, servos, steppers. PC: USB, PCIe, DDR3, Ethernet, SATA.</p>`,
  };
  Course.start(window.CHAPTER);
})();
