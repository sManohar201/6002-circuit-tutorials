(function () {
  const { S, plot, slider, toggle, el } = Course;
  const { sim } = MIPS;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const seenPP = (html, href, where) => `<div class="key"><b>Seen in Patt & Patel:</b> ${html} <a href="../pp/${href}">${where} →</a></div>`;
  const seenHH = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const pre = (t) => `<pre class="code">${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`;
  const bars = (items, unit, max) => `<div class="tbl"><table><tbody>${items.map(([lab, v, hot]) => `<tr><td style="white-space:nowrap">${lab}</td><td style="width:100%"><div style="height:18px;width:${(100 * v) / max}%;background:${hot ? "var(--accent)" : "var(--accent-soft)"};border-radius:4px"></div></td><td class="mono" style="white-space:nowrap">${v} ${unit}</td></tr>`).join("")}</tbody></table></div>`;

  /* ---------- single-cycle datapath figure (Figure 7.14, simplified) ---------- */
  const WIRES = {
    pc_im: [[100, 175], [120, 175]], pc_add: [[104, 175], [104, 56], [127, 56]], four: [[118, 68], [127, 68]],
    add4_pc: [[153, 62], [160, 62], [160, 28], [12, 28], [12, 150], [18, 150]], add4_badd: [[160, 62], [459, 62]],
    m1_m0: [[30, 160], [42, 160]], pcnext: [[54, 175], [70, 175]],
    j_in: [[230, 263], [140, 263]], j_out: [[60, 263], [38, 263], [38, 190], [42, 190]],
    instr: [[200, 175], [230, 175], [230, 140]], bus: [[230, 175], [230, 300]],
    rs: [[230, 140], [290, 140]], rt: [[230, 170], [290, 170]], rt_dst: [[250, 170], [250, 222], [262, 222]], rd_dst: [[230, 242], [262, 242]],
    regdst_a3: [[274, 232], [290, 232]], imm: [[230, 300], [294, 300]],
    se_alusrc: [[366, 300], [404, 300], [404, 230], [410, 230]], se_badd: [[392, 300], [392, 102], [418, 102]], sh_badd: [[444, 102], [452, 102], [452, 76], [459, 76]],
    badd_pc: [[485, 69], [500, 69], [500, 14], [6, 14], [6, 170], [18, 170]],
    rd1_alu: [[380, 150], [440, 150]], rd2_alusrc: [[380, 200], [410, 200]], rd2_wd: [[396, 200], [396, 280], [512, 280], [512, 226], [520, 226]],
    alusrc_alu: [[422, 215], [440, 215]], alu_dm: [[490, 185], [520, 185]], alu_m2r: [[502, 185], [502, 296], [628, 296], [628, 205], [640, 205]],
    dm_m2r: [[600, 175], [640, 175]], result_wd3: [[652, 190], [672, 190], [672, 345], [280, 345], [280, 250], [290, 250]],
    zero: [[490, 160], [506, 160], [506, 120], [540, 120]], pcsrc: [[558, 120], [574, 120]],
  };
  const FETCH = ["pc_im", "pc_add", "four", "add4_pc", "m1_m0", "pcnext", "instr", "bus"];
  const INSTRS = {
    lw: { on: [...FETCH, "rs", "rd1_alu", "imm", "se_alusrc", "alusrc_alu", "alu_dm", "dm_m2r", "result_wd3", "rt_dst", "regdst_a3"], sig: [1, 0, 1, 0, 0, 1, "00", 0], alu: "010 (add)", note: "Base register + sign-extended offset → address; data memory → rt." },
    sw: { on: [...FETCH, "rs", "rt", "rd1_alu", "imm", "se_alusrc", "alusrc_alu", "alu_dm", "rd2_wd"], sig: [0, "X", 1, 0, 1, "X", "00", 0], alu: "010 (add)", note: "Same address calculation as lw; rt is read and written to data memory." },
    "R-type": { on: [...FETCH, "rs", "rt", "rd1_alu", "rd2_alusrc", "alusrc_alu", "alu_m2r", "result_wd3", "rd_dst", "regdst_a3"], sig: [1, 1, 0, 0, 0, 0, "10", 0], alu: "from funct", note: "Two registers into the ALU; the result goes to rd." },
    beq: { on: [...FETCH, "rs", "rt", "rd1_alu", "rd2_alusrc", "alusrc_alu", "zero", "pcsrc", "imm", "se_badd", "sh_badd", "add4_badd", "badd_pc"], sig: [0, "X", 0, 1, 0, "X", "01", 0], alu: "110 (subtract)", note: "Subtract to compare; Zero AND Branch picks PCBranch = PC + 4 + SignImm × 4." },
    addi: { on: [...FETCH, "rs", "rd1_alu", "imm", "se_alusrc", "alusrc_alu", "alu_m2r", "result_wd3", "rt_dst", "regdst_a3"], sig: [1, 0, 1, 0, 0, 0, "00", 0], alu: "010 (add)", note: "No new hardware: just a new row in the main decoder." },
    j: { on: ["pc_im", "instr", "bus", "j_in", "j_out", "pcnext"], sig: [0, "X", "X", "X", 0, "X", "XX", 1], alu: "don't care", note: "PC ← {PC+4[31:28], addr, 00}. Nothing else is written." },
  };
  const SIGN = ["RegWrite", "RegDst", "ALUSrc", "Branch", "MemWrite", "MemtoReg", "ALUOp", "Jump"];
  function dpSVG(on) {
    const hot = new Set(on);
    let g = "";
    Object.entries(WIRES).forEach(([k, pts]) => { g += `<polyline class="w${hot.has(k) ? " hl" : ""}" style="${hot.has(k) ? "" : "opacity:.35"}" points="${pts.map((p) => p.join(",")).join(" ")}"/>`; });
    const box = (x, y, w, h, lines, cls = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" style="fill:var(--card);stroke:var(--ink);stroke-width:2"/>` + lines.map((t, i) => S.t(x + w / 2, y + h / 2 + 5 + (i - (lines.length - 1) / 2) * 15, t, { cls: "s" + cls })).join("");
    const mux = (x, y, h, lab, ly) => `<rect x="${x}" y="${y}" width="12" height="${h}" rx="6" style="fill:var(--card);stroke:var(--ink);stroke-width:2"/>` + S.t(x + 6, ly, lab, { cls: "s" });
    g += box(70, 150, 30, 50, ["PC"]) + box(120, 130, 80, 90, ["Instr", "Memory"]) + box(290, 120, 90, 140, ["Register", "File"]) + box(520, 140, 80, 100, ["Data", "Memory"]) + box(60, 250, 80, 26, ["PCJump"]) + box(418, 92, 26, 20, ["<<2"]);
    g += `<ellipse cx="330" cy="300" rx="36" ry="13" style="fill:var(--card);stroke:var(--ink);stroke-width:2"/>` + S.t(330, 304, "Sign Ext", { cls: "s" });
    g += `<circle cx="140" cy="62" r="13" style="fill:var(--card);stroke:var(--ink);stroke-width:2"/>` + S.t(140, 67, "+") + S.t(114, 72, "4", { cls: "s" });
    g += `<circle cx="472" cy="69" r="13" style="fill:var(--card);stroke:var(--ink);stroke-width:2"/>` + S.t(472, 74, "+");
    g += `<polygon points="440,128 490,152 490,218 440,242 440,196 450,185 440,174" style="fill:var(--card);stroke:var(--ink);stroke-width:2"/>` + S.t(468, 190, "ALU", { cls: "s" });
    g += `<path d="M540 110 h9 a10 10 0 0 1 0 20 h-9 z" style="fill:var(--card);stroke:var(--ink);stroke-width:2"/>` + S.t(549, 104, "Branch", { cls: "s" }) + S.t(590, 124, "PCSrc", { a: "start", cls: "s" });
    g += mux(18, 140, 40, "PCSrc", 196) + mux(42, 150, 50, "Jump", 214) + mux(262, 212, 40, "RegDst", 266) + mux(410, 190, 50, "ALUSrc", 254) + mux(640, 165, 50, "MemtoReg", 159);
    [["25:21", 258, 136], ["20:16", 258, 166], ["15:11", 242, 237], ["15:0", 258, 296], ["25:0", 190, 259], ["PCPlus4", 300, 57], ["SignImm", 400, 318], ["Result", 470, 340], ["Zero", 526, 135], ["PCBranch", 540, 10]].forEach(([t, x, y]) => { g += S.t(x, y, t, { cls: "s m" }); });
    return S.svg(700, 360, g, { max: 700, label: "Single-cycle MIPS datapath with the active paths highlighted" });
  }
  function singleCycle(host) {
    const out = el(`<div></div>`);
    const names = Object.keys(INSTRS);
    const draw = (i) => {
      const I = INSTRS[names[i]];
      out.innerHTML = `<div class="fig">${dpSVG(I.on)}</div><p>${I.note}</p><div class="tbl"><table style="text-align:center"><thead><tr>${SIGN.map((s) => `<th>${s}</th>`).join("")}<th>ALUControl</th></tr></thead><tbody><tr>${I.sig.map((v) => `<td class="mono">${v}</td>`).join("")}<td class="mono">${I.alu}</td></tr></tbody></table></div>`;
    };
    host.append(toggle(names, draw, 0), out); draw(0);
  }

  /* ---------- multicycle FSM (Figure 7.42) ---------- */
  const ST = {
    S0: ["Fetch", 70, 30, "IorD = 0, ALUSrcA = 0, ALUSrcB = 01, ALUOp = 00, PCSrc = 00, IRWrite, PCWrite", "IR ← Mem[PC]; PC ← PC + 4 (the ALU is free, so it increments the PC)"],
    S1: ["Decode", 230, 30, "ALUSrcA = 0, ALUSrcB = 11, ALUOp = 00", "A ← rs, B ← rt; ALUOut ← PC + SignImm×4 (a branch target, in case)"],
    S2: ["MemAdr", 70, 120, "ALUSrcA = 1, ALUSrcB = 10, ALUOp = 00", "ALUOut ← A + SignImm"],
    S3: ["MemRead", 30, 210, "IorD = 1", "Data ← Mem[ALUOut]"],
    S4: ["MemWB", 30, 300, "RegDst = 0, MemtoReg = 1, RegWrite", "rt ← Data"],
    S5: ["MemWrite", 120, 210, "IorD = 1, MemWrite", "Mem[ALUOut] ← B"],
    S6: ["Execute", 220, 120, "ALUSrcA = 1, ALUSrcB = 00, ALUOp = 10", "ALUOut ← A op B"],
    S7: ["ALU WB", 220, 210, "RegDst = 1, MemtoReg = 0, RegWrite", "rd ← ALUOut"],
    S8: ["Branch", 340, 120, "ALUSrcA = 1, ALUSrcB = 00, ALUOp = 01, PCSrc = 01, Branch", "if A − B = 0: PC ← ALUOut"],
    S9: ["ADDI Ex", 450, 120, "ALUSrcA = 1, ALUSrcB = 10, ALUOp = 00", "ALUOut ← A + SignImm"],
    S10: ["ADDI WB", 450, 210, "RegDst = 0, MemtoReg = 0, RegWrite", "rt ← ALUOut"],
    S11: ["Jump", 400, 30, "PCSrc = 10, PCWrite", "PC ← PCJump"],
  };
  const SEQ = { lw: ["S0", "S1", "S2", "S3", "S4"], sw: ["S0", "S1", "S2", "S5"], "R-type": ["S0", "S1", "S6", "S7"], beq: ["S0", "S1", "S8"], addi: ["S0", "S1", "S9", "S10"], j: ["S0", "S1", "S11"] };
  const EDGES = [["S0", "S1"], ["S1", "S2"], ["S1", "S6"], ["S1", "S8"], ["S1", "S9"], ["S1", "S11"], ["S2", "S3"], ["S2", "S5"], ["S3", "S4"], ["S6", "S7"], ["S9", "S10"]];
  function fsm(host) {
    let ins = "lw", k = 0;
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`), bS = btn("Next cycle →", "primary"), bR = btn("Restart");
    const draw = () => {
      const seq = SEQ[ins], cur = seq[k], visited = new Set(seq.slice(0, k + 1));
      let g = "";
      EDGES.forEach(([a, b]) => { const A = ST[a], B = ST[b], on = visited.has(a) && visited.has(b); g += `<line x1="${A[1] + 40}" y1="${A[2] + 16}" x2="${B[1] + 40}" y2="${B[2] + 16}" style="stroke:${on ? "var(--accent)" : "var(--line)"};stroke-width:${on ? 3 : 1.5}"/>`; });
      g += `<path d="M ${ST.S4[1]} ${ST.S4[2] + 16} C -10 ${ST.S4[2]}, -10 40, ${ST.S0[1]} ${ST.S0[2] + 16}" style="fill:none;stroke:var(--line);stroke-dasharray:4 4"/>`;
      Object.entries(ST).forEach(([id, [nm, x, y]]) => { const on = id === cur, was = visited.has(id); g += `<rect x="${x}" y="${y}" width="80" height="32" rx="16" style="fill:${on ? "var(--accent)" : was ? "var(--accent-soft)" : "var(--card)"};stroke:var(--ink)"/>` + S.t(x + 40, y + 14, id, { cls: "s" }) + S.t(x + 40, y + 27, nm, { cls: "s" }); });
      const s = ST[cur];
      out.innerHTML = `<div class="fig">${S.svg(540, 345, g, { max: 540, label: "Multicycle control FSM with the current state highlighted" })}</div><p><b>Cycle ${k + 1} of ${seq.length}: ${cur} (${s[0]})</b>: ${s[4]}.</p><p class="mono" style="font-size:14px;overflow-wrap:anywhere">${s[3]}</p><p class="aside">Every state returns to S0 after its last step. Only signals that matter are listed; unlisted enables are 0.</p>`;
      bS.disabled = k >= seq.length - 1;
    };
    bS.addEventListener("click", () => { k++; draw(); }); bR.addEventListener("click", () => { k = 0; draw(); });
    row.append(bS, bR);
    host.append(toggle(Object.keys(SEQ), (i) => { ins = Object.keys(SEQ)[i]; k = 0; draw(); }, 0), row, out); draw();
  }

  /* ---------- pipeline diagrams (Figures 7.44–7.55) ---------- */
  const STG = ["IM", "RF", "ALU", "DM", "WB"];
  const P = (label, start, opts = {}) => ({ label, cells: (opts.cells || STG.map((s, i) => [start + i, s])), flush: opts.flush, bad: opts.bad || [] });
  function pipeSVG(rows, o = {}) {
    const C = o.cycles || 10, LW = 190, CW = 46, RH = 34, T = 26;
    const W = LW + C * CW + 8, H = T + rows.length * RH + 6;
    let g = "";
    if (o.col) g += `<rect x="${LW + (o.col - 1) * CW}" y="4" width="${CW}" height="${H - 8}" style="fill:var(--accent-soft)"/>`;
    for (let c = 1; c <= C; c++) g += S.t(LW + (c - 0.5) * CW, 18, c, { cls: "s m" });
    rows.forEach((r, i) => {
      const y = T + i * RH;
      g += S.t(6, y + 21, r.label, { a: "start", cls: "s" });
      r.cells.forEach(([c, s]) => {
        const x = LW + (c - 1) * CW, dead = r.flush && s !== "IM" ? true : r.flush, stall = s === "stall", bub = s === "bub";
        g += `<rect x="${x + 3}" y="${y + 4}" width="${CW - 6}" height="${RH - 8}" rx="5" style="fill:${s === "ALU" && !dead ? "var(--accent-soft)" : "var(--card)"};stroke:var(--ink);${stall || bub ? "stroke-dasharray:4 3;" : ""}opacity:${dead || bub ? 0.45 : 1}"/>` + S.t(x + CW / 2, y + 22, stall ? "stall" : bub ? "—" : s, { cls: "s" });
        if (r.bad.includes(c)) g += `<circle cx="${x + CW - 6}" cy="${y + 7}" r="6" style="fill:var(--bad)"/>`;
      });
      if (r.flush) { const xs = r.cells.map(([c]) => c); g += `<line x1="${LW + (Math.min(...xs) - 1) * CW + 2}" y1="${y + RH / 2}" x2="${LW + Math.max(...xs) * CW - 2}" y2="${y + RH / 2}" style="stroke:var(--bad);stroke-width:2.5"/>`; }
    });
    (o.arrows || []).forEach(([r1, c1, r2, c2]) => { const x1 = LW + (c1 - 0.5) * CW, y1 = T + r1 * RH + RH - 6, x2 = LW + (c2 - 0.5) * CW, y2 = T + r2 * RH + 6; g += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:var(--good);stroke-width:3"/><circle cx="${x2}" cy="${y2}" r="4" style="fill:var(--good)"/>`; });
    return `<div class="fig" style="overflow-x:auto">${S.svg(W, H, g, { max: W, label: o.label || "Pipeline diagram" })}</div>`;
  }
  const BASIC = [P("lw $s2, 40($0)", 1), P("add $s3, $t1, $t2", 2), P("sub $s4, $s1, $s5", 3), P("and $s5, $t5, $t6", 4), P("sw $s6, 20($s1)", 5), P("or $s7, $t3, $t4", 6)];
  function basicPipe(host) {
    const out = el(`<div></div>`);
    const draw = (c) => {
      c = Math.round(c);
      const busy = BASIC.map((r) => { const cell = r.cells.find(([cc]) => cc === c); return cell ? `<li><b>${cell[1]}</b>: ${r.label}</li>` : ""; }).join("");
      out.innerHTML = pipeSVG(BASIC, { col: c, label: "Six instructions in the five-stage pipeline" }) + `<p>Cycle ${c}:</p><ul>${busy || "<li>pipeline empty</li>"}</ul>`;
    };
    host.append(slider({ id: "hh7cyc", label: "Clock cycle", min: 1, max: 10, step: 1, value: 6, show: (v) => Math.round(v) }, draw).el, out); draw(6);
  }
  const HZ = {
    "No forwarding (wrong!)": { rows: [P("add $s0, $s2, $s3", 1), P("and $t0, $s0, $s1", 2, { bad: [3] }), P("or $t1, $s4, $s0", 3, { bad: [4] }), P("sub $t2, $s0, $s5", 4)], text: "add writes $s0 in the first half of cycle 5. and reads it in cycle 3 and or in cycle 4 (red dots): both get the old value. sub reads it in the second half of cycle 5: correct." },
    Forwarding: { rows: [P("add $s0, $s2, $s3", 1), P("and $t0, $s0, $s1", 2), P("or $t1, $s4, $s0", 3), P("sub $t2, $s0, $s5", 4)], arrows: [[0, 4, 1, 4], [0, 5, 2, 5]], text: "Cycle 4: the sum is forwarded from add's Memory stage to and's Execute stage. Cycle 5: from add's Writeback stage to or's Execute stage. No time lost." },
    "lw: stall + forward": { rows: [P("lw $s0, 40($0)", 1), P("and $t0, $s0, $s1", 2, { cells: [[2, "IM"], [3, "RF"], [4, "stall"], [5, "ALU"], [6, "DM"], [7, "WB"]] }), P("(bubble)", 4, { cells: [[4, "bub"], [5, "bub"], [6, "bub"]] }), P("or $t1, $s4, $s0", 3, { cells: [[3, "IM"], [4, "stall"], [5, "RF"], [6, "ALU"], [7, "DM"], [8, "WB"]] }), P("sub $t2, $s0, $s5", 5, { cells: [[5, "IM"], [6, "RF"], [7, "ALU"], [8, "DM"], [9, "WB"]] })], arrows: [[0, 5, 1, 5]], text: "lw's data arrives at the end of its Memory stage (cycle 4), too late for and's Execute in cycle 4. and stalls one cycle in Decode (or waits in Fetch); a bubble moves down the pipe; then the value is forwarded from Writeback in cycle 5." },
    "beq: decide in Memory": { rows: [P("20 beq $t1, $t2, 40", 1), P("24 and $t0, $s0, $s1", 2, { flush: true, cells: [[2, "IM"], [3, "RF"], [4, "ALU"]] }), P("28 or $t1, $s4, $s0", 3, { flush: true, cells: [[3, "IM"], [4, "RF"]] }), P("2C sub $t2, $s0, $s5", 4, { flush: true, cells: [[4, "IM"]] }), P("64 slt $t3, $s2, $s3", 5)], text: "Predict not taken. The branch is decided in cycle 4 (Memory stage), so three wrongly fetched instructions are flushed: a misprediction penalty of 3." },
    "beq: decide in Decode": { rows: [P("20 beq $t1, $t2, 40", 1, { cells: [[1, "IM"], [2, "RF"], [3, "ALU"], [4, "DM"], [5, "WB"]] }), P("24 and $t0, $s0, $s1", 2, { flush: true, cells: [[2, "IM"]] }), P("64 slt $t3, $s2, $s3", 3)], text: "An equality comparator in Decode decides in cycle 2. Only one instruction is flushed: penalty 1. (The price: new hazards for the comparator's operands, and a slower Decode stage.)" },
  };
  function hazards(host, keys) {
    const out = el(`<div></div>`);
    const draw = (i) => { const h = HZ[keys[i]]; out.innerHTML = pipeSVG(h.rows, { arrows: h.arrows, label: keys[i] }) + `<p>${h.text}</p>`; };
    host.append(toggle(keys, draw, 0), out); draw(0);
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Microarchitecture and performance", mins: 15,
    blurb: "One architecture, many ways to build it. Judge them by execution time = instructions × CPI × clock period.",
    takeaway: "Microarchitecture is the specific arrangement of registers, ALUs, FSMs, memories and other blocks that implements an architecture; many microarchitectures can run the same programs with different performance, cost and complexity. (Designs from Patterson & Hennessy.) Subset handled: R-type add, sub, and, or, slt; lw, sw; beq; then addi and j. Design = datapath (words of data: memories, registers, ALU, muxes) + control (from the instruction, produces mux selects, register enables, memory write). Start from the state elements (Figure 7.1): PC (32-bit register; MIPS resets to 0xBFC00000, here 0), instruction memory (one read port, read combinationally), 32×32 register file (two read ports A1/A2→RD1/RD2, one write port A3/WD3/WE3 written on the rising edge), data memory (read/write port, WE). State changes only at clock edges, so the processor is a synchronous sequential circuit, a giant FSM. Three designs: single-cycle (one long cycle, no nonarchitectural state, cycle set by the slowest instruction), multicycle (several shorter cycles, reuses the ALU and one memory, adds nonarchitectural registers), pipelined (single-cycle cut into five stages, several instructions at once, adds pipeline registers and hazard logic). Performance: the only gimmick-free measure is execution time of your program (or benchmarks). Execution time = #instructions × CPI × Tc (Equation 7.1). CPI = cycles per instruction (1/IPC); this chapter assumes an ideal memory. Tc is set by the critical path; logic and circuit design and manufacturing also affect it.",
    steps: [
      { k: "learn", title: "Architecture vs microarchitecture", b: [
        `<div class="two"><div class="tile"><h3>Architecture</h3><p>What the programmer sees: registers, instructions, memory. MIPS: the PC and 32 registers.</p></div><div class="tile"><h3>Microarchitecture</h3><p>How the hardware does it: ALUs, muxes, memories, FSMs. Many choices, same programs.</p></div></div>`,
        `<p>Every design splits into a <b>datapath</b> (the parts that move and compute 32-bit words) and <b>control</b> (decides, from the instruction, what the datapath does this cycle).</p>`,
        seenPP("The LC-3's datapath and the instruction cycle.", "04-von-neumann.html", "Patt & Patel Chapter 4"),
      ]},
      { k: "learn", title: "Start with the state", b: [
        `<div class="tbl"><table><tbody>
          <tr><td>PC</td><td>32-bit register: address of the current instruction</td></tr>
          <tr><td>Instruction memory</td><td>address in, 32-bit instruction out (read combinationally)</td></tr>
          <tr><td>Register file</td><td>two read ports (A1→RD1, A2→RD2), one write port (A3, WD3, WE3) written on the clock edge</td></tr>
          <tr><td>Data memory</td><td>one read/write port; writes on the clock edge when WE = 1</td></tr></tbody></table></div>`,
        `<p>Reads are combinational, writes happen only at the clock edge. So the whole processor is one big synchronous FSM.</p>`,
      ]},
      { k: "learn", title: "Three designs, one yardstick", b: [
        `<p class="eq">Execution time = (# instructions) × CPI × T<sub>c</sub></p>`,
        `<div class="tbl"><table><thead><tr><th>Design</th><th>Idea</th><th>Trade-off</th></tr></thead><tbody>
          <tr><td>Single-cycle</td><td>one instruction per (long) cycle</td><td>simple; cycle set by the slowest instruction</td></tr>
          <tr><td>Multicycle</td><td>several short steps per instruction</td><td>reuses hardware; pays register overhead every step</td></tr>
          <tr><td>Pipelined</td><td>five instructions in flight at once</td><td>fast; needs hazard handling</td></tr></tbody></table></div>`,
        `<p>Benchmarks (collections of typical programs) stand in when you can't time your own program. Clock frequency alone can mislead: 1990s Athlons beat higher-clocked Pentiums.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A program runs 2 billion instructions at a CPI of 1.5 on a 2 GHz clock. Execution time in seconds?", a: 1.5, tol: 0.01, why: "2×10⁹ × 1.5 × 0.5 ns = 1.5 s." },
        { t: "mcq", q: "Two processors implement the same architecture. What must be identical?", opts: [["The programs they can run and the architectural state (PC, registers)", true, "That's the contract."], ["Their CPI", false, "CPI is a microarchitecture result."], ["Their clock period", false, "Different designs, different critical paths."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What three things set a program's execution time, and which of them does the microarchitecture change?", model: "The number of instructions, the average cycles per instruction (CPI), and the clock period Tc. For a fixed program and architecture the instruction count is fixed, so the microarchitecture changes CPI and Tc, usually trading one against the other." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "The single-cycle datapath", mins: 25,
    blurb: "Connect the state elements with just enough logic for lw, then add a mux each time another instruction needs something different.",
    takeaway: "Single-cycle datapath, built for lw first: PC → instruction memory (fetch Instr); rs = Instr25:21 → A1 → RD1 (base); Instr15:0 sign-extended → SignImm (SignImm31:16 = Instr15); ALU (ALUControl 010 = add) computes SrcA + SrcB = address; data memory reads ReadData; written to register rt = Instr20:16 via A3/WD3 with RegWrite = 1 at the clock edge; PC + 4 by a separate adder. sw: also read rt via A2 → RD2 → data memory WD; MemWrite = 1, RegWrite = 0 (ReadData is read but ignored). R-type (add, sub, and, or, slt): ALUSrc mux picks SrcB = RD2 (0) or SignImm (1); MemtoReg mux picks Result = ALUResult (0) or ReadData (1); RegDst mux picks WriteReg = rt (0) or rd = Instr15:11 (1). beq: ALU subtracts (ALUControl 110), Zero flag says equal; PCBranch = PCPlus4 + (SignImm << 2); PCSrc = Branch AND Zero selects PCBranch over PCPlus4. Adding a multiplexer to choose among inputs is the recurring trick. j (Example 7.3): PCJump = {PCPlus4[31:28], Instr25:0, 00}, a new Jump mux.",
    steps: [
      { k: "learn", title: "Build it for lw", b: [
        `<ol><li>Fetch: PC → instruction memory → Instr.</li><li>Read the base register: rs (Instr[25:21]) → A1 → RD1.</li><li>Sign-extend the offset: Instr[15:0] → SignImm.</li><li>ALU adds them (ALUControl = 010): the address.</li><li>Data memory reads ReadData.</li><li>Write it into rt (Instr[20:16]) at the clock edge, RegWrite = 1.</li><li>Meanwhile a separate adder makes PC + 4.</li></ol>`,
        seenHH("The ALU and its control codes.", "05-building-blocks.html", "Chapter 5"),
      ]},
      { k: "learn", title: "Then add muxes", b: [
        `<div class="tbl"><table><thead><tr><th>Mux</th><th>0</th><th>1</th><th>Needed for</th></tr></thead><tbody>
          <tr><td>ALUSrc</td><td>RD2</td><td>SignImm</td><td>R-type vs lw/sw</td></tr>
          <tr><td>MemtoReg</td><td>ALUResult</td><td>ReadData</td><td>R-type vs lw</td></tr>
          <tr><td>RegDst</td><td>rt [20:16]</td><td>rd [15:11]</td><td>lw vs R-type</td></tr>
          <tr><td>PCSrc</td><td>PC + 4</td><td>PCBranch</td><td>beq (PCSrc = Branch · Zero)</td></tr>
          <tr><td>Jump</td><td>(PCSrc mux)</td><td>PCJump</td><td>j</td></tr></tbody></table></div>`,
        `<p><b>beq</b>: the ALU subtracts; Zero = 1 means equal. Target = PC + 4 + SignImm × 4 (shift left 2 is just wiring).</p>`,
      ]},
      { k: "play", title: "Light up each instruction", b: [
        singleCycle,
        `<p class="aside">Bold paths carry data that matters for this instruction. Data still flows through the faint ones; it just doesn't affect the result.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "For sw, why is RegDst a don't-care (X)?", opts: [["RegWrite = 0, so the register file ignores the write address", true, "Nothing is written, so it doesn't matter which register would have been."], ["sw has no rt field", false, "sw uses rt as the data to store."], ["RegDst only matters for beq", false, "It matters whenever a register is written."]] },
        { t: "num", q: "beq at address 0x40 with immediate −3. Branch target (decimal)?", a: 56, tol: 0.01, why: "PC + 4 + (−3 × 4) = 0x44 − 12 = 0x38 = 56." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Trace a lw through the single-cycle datapath.", model: "The PC addresses the instruction memory. The rs field selects the base register on read port 1, and the 16-bit immediate is sign-extended. The ALUSrc mux sends SignImm to the ALU, which adds it to the base to form the address. The data memory reads that word, the MemtoReg mux selects it as Result, and on the clock edge it's written into the register named by the rt field (RegDst = 0, RegWrite = 1) while the PC is loaded with PC + 4." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Single-cycle control", mins: 20,
    blurb: "A main decoder reads the opcode; an ALU decoder reads ALUOp and funct. Two truth tables run the whole processor.",
    takeaway: "Control is combinational, from opcode Instr31:26 and funct Instr5:0, split into a main decoder (most signals + 2-bit ALUOp) and an ALU decoder. ALUOp (Table 7.1): 00 add, 01 subtract, 10 look at funct, 11 n/a. ALU decoder (Table 7.2): ALUOp 00 → 010 add; X1 → 110 subtract; 1X with funct 100000 add → 010, 100010 sub → 110, 100100 and → 000, 100101 or → 001, 101010 slt → 111 (the first two funct bits are always 10, so they can be ignored). Main decoder (Tables 7.3–7.5) columns RegWrite RegDst ALUSrc Branch MemWrite MemtoReg ALUOp Jump: R-type 000000: 1 1 0 0 0 0 10 0; lw 100011: 1 0 1 0 0 1 00 0; sw 101011: 0 X 1 0 1 X 00 0; beq 000100: 0 X 0 1 0 X 01 0; addi 001000: 1 0 1 0 0 0 00 0; j 000010: 0 X X X 0 X XX 1. Example 7.1 (or): ALUSrc 0, ALUOp 10 → ALUControl 001, MemtoReg 0, RegWrite 1, MemWrite 0, RegDst 1, Branch 0 → PCSrc 0. addi needs only a decoder row; j needs datapath hardware too.",
    steps: [
      { k: "learn", title: "Two decoders", b: [
        `<div class="two"><div class="tile"><h3>Main decoder</h3><p>opcode → RegWrite, RegDst, ALUSrc, Branch, MemWrite, MemtoReg, Jump, and a 2-bit <b>ALUOp</b>.</p></div><div class="tile"><h3>ALU decoder</h3><p>ALUOp + funct → 3-bit ALUControl.<br>00 add · 01 subtract · 10 look at funct.</p></div></div>`,
        `<div class="tbl"><table><thead><tr><th>funct</th><th>ALUControl</th></tr></thead><tbody><tr><td>100000 add</td><td>010</td></tr><tr><td>100010 sub</td><td>110</td></tr><tr><td>100100 and</td><td>000</td></tr><tr><td>100101 or</td><td>001</td></tr><tr><td>101010 slt</td><td>111</td></tr></tbody></table></div>`,
      ]},
      { k: "learn", title: "The main decoder table", b: [
        `<div class="tbl"><table style="text-align:center;font-family:var(--mono);font-size:14px"><thead><tr><th>Instr</th><th>Opcode</th><th>RegWrite</th><th>RegDst</th><th>ALUSrc</th><th>Branch</th><th>MemWrite</th><th>MemtoReg</th><th>ALUOp</th><th>Jump</th></tr></thead><tbody>
          <tr><td>R-type</td><td>000000</td><td>1</td><td>1</td><td>0</td><td>0</td><td>0</td><td>0</td><td>10</td><td>0</td></tr>
          <tr><td>lw</td><td>100011</td><td>1</td><td>0</td><td>1</td><td>0</td><td>0</td><td>1</td><td>00</td><td>0</td></tr>
          <tr><td>sw</td><td>101011</td><td>0</td><td>X</td><td>1</td><td>0</td><td>1</td><td>X</td><td>00</td><td>0</td></tr>
          <tr><td>beq</td><td>000100</td><td>0</td><td>X</td><td>0</td><td>1</td><td>0</td><td>X</td><td>01</td><td>0</td></tr>
          <tr><td>addi</td><td>001000</td><td>1</td><td>0</td><td>1</td><td>0</td><td>0</td><td>0</td><td>00</td><td>0</td></tr>
          <tr><td>j</td><td>000010</td><td>0</td><td>X</td><td>X</td><td>X</td><td>0</td><td>X</td><td>XX</td><td>1</td></tr></tbody></table></div>`,
        `<p>Don't-cares appear exactly where nothing is written: the write address and data can't matter if RegWrite = 0.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "and $t0, $s1, $s2 is executing. What is ALUControl?", opts: [["000", true, "R-type → ALUOp 10 → funct 100100 (and) → 000."], ["010", false, "That's add."], ["001", false, "That's or (Example 7.1)."]] },
        { t: "mcq", q: "Why does addi need only a new decoder row, while j needs new datapath hardware?", opts: [["addi uses existing paths (register + immediate through the ALU); nothing computes j's target yet", true, "Example 7.2 vs 7.3."], ["addi has no opcode", false, "It's 001000."], ["j writes a register", false, "j writes only the PC."]] },
        { t: "sort", q: "Which value does each signal take for lw?", bins: ["0", "1"], items: [["ALUSrc", 1, "SrcB is the offset."], ["RegDst", 0, "Destination is rt."], ["MemWrite", 0, "lw only reads."], ["MemtoReg", 1, "Result comes from memory."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is the control unit split into a main decoder and an ALU decoder?", model: "Most control signals depend only on the opcode, but R-type instructions share one opcode and differ only in the funct field, which picks the ALU operation. The main decoder handles the opcode and emits a 2-bit ALUOp meaning add, subtract or look at funct; the small ALU decoder combines ALUOp with funct to produce ALUControl. That keeps each piece of logic simple." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Single-cycle performance", mins: 15,
    blurb: "CPI is exactly 1, but every cycle must fit lw's long path: memory, register file, ALU, memory again.",
    takeaway: "Each instruction takes one cycle: CPI = 1. Critical path is lw (Figure 7.15): PC clk-to-Q, instruction memory, register file read (in parallel with sign-extend + mux), ALU, data memory read, MemtoReg mux, register file setup: Tc = tpcq + tmem + max(tRFread, tsext + tmux) + tALU + tmem + tmux + tRFsetup (7.2), ≈ tpcq + 2tmem + tRFread + tALU + tmux + tRFsetup (7.3). Table 7.6 (65 nm): tpcq 30, tsetup 20, tmux 25, tALU 200, tmem 250, tRFread 150, tRFsetup 20 ps. Example 7.4: Tc1 = 30 + 2(250) + 150 + 200 + 25 + 20 = 925 ps; 100 billion instructions → 92.5 s. Shorter instructions (R-type skips data memory) can't finish early because the clock period is fixed by the slowest instruction.",
    steps: [
      { k: "learn", title: "lw's critical path", b: [
        bars([["PC clk-to-Q", 30], ["Instruction memory", 250], ["Register file read", 150], ["ALU", 200], ["Data memory", 250], ["MemtoReg mux", 25], ["Register file setup", 20]], "ps", 250),
        `<p class="eq">T<sub>c1</sub> = 30 + 2(250) + 150 + 200 + 25 + 20 = 925 ps</p>`,
        `<p>Sign extension and the ALUSrc mux run in parallel with the register read, which is slower, so they don't add.</p>`,
      ]},
      { k: "learn", title: "Example 7.4", b: [
        `<p>100 billion instructions × 1 cycle × 925 ps = <b>92.5 s</b>.</p>`,
        `<p>An add needs no data memory, so its path is about 250 ps shorter. It doesn't help: in synchronous design the clock period is fixed, so every instruction gets lw's 925 ps.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why is lw, not R-type, the critical path?", opts: [["It's the only instruction that reads both memories and the register file and writes a register", true, "Two memory accesses in series."], ["It uses the ALU twice", false, "Once, for the address."], ["sw is slower than lw", false, "sw writes memory and doesn't need the write-back mux and register setup."]] },
        { t: "num", q: "Using Table 7.6, how many ps of the 925 are memory reads?", a: 500, tol: 0.01, why: "Two 250 ps memory reads." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a single-cycle processor waste time on most instructions?", model: "The clock period must be long enough for the slowest instruction, lw, which reads the instruction memory, the register file and the data memory in series. Every other instruction finishes its work earlier in the cycle but still has to wait for the clock edge, so the time saved on faster instructions is lost." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "The multicycle datapath", mins: 20,
    blurb: "Break each instruction into short steps. One memory, one ALU, reused on different steps, with registers to hold results in between.",
    takeaway: "Single-cycle weaknesses: clock long enough for lw; three adders (ALU + two for the PC); separate instruction and data memories. Multicycle: each step does one memory access, register file access or ALU operation; simpler instructions use fewer steps; one ALU reused; one combined instruction/data memory. Nonarchitectural registers hold results between steps: IR (Instruction Register, enabled by IRWrite), A and B (register file outputs), ALUOut, Data (memory read). SignImm needs no register (it's a combinational function of IR). Muxes: IorD chooses the memory address from PC (fetch) or ALUOut (data); ALUSrcA chooses PC or A; ALUSrcB (4 inputs) chooses B, constant 4, SignImm, SignImm << 2; MemtoReg (ALUOut or Data); RegDst (rt or rd); PCSrc chooses ALUResult (PC + 4 computed this step) or ALUOut (branch target computed earlier) or PCJump. PCWrite enables the PC; PCEn = PCWrite OR (Branch AND Zero). MemWrite writes memory from B.",
    steps: [
      { k: "learn", title: "Three weaknesses to fix", b: [
        `<ol><li>Every instruction pays for lw's long path.</li><li>Three adders (the ALU + two for the PC). Fast adders are expensive.</li><li>Separate instruction and data memories: unrealistic.</li></ol>`,
        `<p>Fix: do <b>one big thing per step</b> (a memory access, a register-file access, or an ALU operation). Reuse the ALU and a single memory across steps.</p>`,
      ]},
      { k: "learn", title: "Registers between steps", b: [
        `<div class="tbl"><table><thead><tr><th>Nonarchitectural register</th><th>Holds</th></tr></thead><tbody>
          <tr><td>IR (IRWrite)</td><td>the fetched instruction</td></tr>
          <tr><td>A, B</td><td>the two register-file outputs</td></tr>
          <tr><td>ALUOut</td><td>the ALU result</td></tr>
          <tr><td>Data</td><td>the word read from memory</td></tr></tbody></table></div>`,
        `<p>New muxes: <b>IorD</b> (memory address = PC or ALUOut), <b>ALUSrcA</b> (PC or A), <b>ALUSrcB</b> (B, 4, SignImm, SignImm×4), <b>PCSrc</b> (ALUResult, ALUOut, PCJump).</p>`,
        `<p class="eq">PCEn = PCWrite + Branch · Zero</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why does the multicycle datapath need the IorD mux?", opts: [["The one memory is addressed by the PC to fetch, and by ALUOut to load or store data", true, "Same memory, different steps."], ["To pick between two memories", false, "There's only one."], ["To choose rt or rd", false, "That's RegDst."]] },
        { t: "mcq", q: "Why is there no register for SignImm?", opts: [["It's a combinational function of IR, which doesn't change during the instruction", true, "It stays valid as long as IR does."], ["It's never used", false, "Address and branch calculations use it."], ["It's stored in B", false, "B holds the rt register."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the multicycle processor get away with one ALU and one memory?", model: "It spreads each instruction over several clock cycles and uses the ALU or memory for a different purpose on different cycles: the memory fetches the instruction on the first step and reads or writes data on a later step, chosen by the IorD mux; the ALU increments the PC on one step and computes an address or result on another, chosen by the ALUSrcA and ALUSrcB muxes. Registers like IR, A, B, ALUOut and Data hold intermediate results between steps." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Multicycle control: an FSM", mins: 25,
    blurb: "Now the controller must produce different signals on different steps: it becomes a finite state machine.",
    takeaway: "The main controller is an FSM (the ALU decoder is unchanged). Select signals: MemtoReg, RegDst, IorD, PCSrc, ALUSrcB, ALUSrcA; enables: IRWrite, MemWrite, PCWrite, Branch, RegWrite (listed only when asserted). S0 Fetch: IorD = 0, ALUSrcA = 0, ALUSrcB = 01, ALUOp = 00, PCSrc = 0, IRWrite, PCWrite (fetch and PC + 4 at once). S1 Decode: read rs, rt into A, B; the idle ALU computes the branch target PC + SignImm×4 into ALUOut (ALUSrcA = 0, ALUSrcB = 11, ALUOp = 00), harmless if not a branch. S2 MemAdr (lw/sw): ALUSrcA = 1, ALUSrcB = 10, ALUOp = 00. S3 MemRead: IorD = 1. S4 MemWriteback: RegDst = 0, MemtoReg = 1, RegWrite. S5 MemWrite: IorD = 1, MemWrite. S6 Execute (R-type): ALUSrcA = 1, ALUSrcB = 00, ALUOp = 10. S7 ALU Writeback: RegDst = 1, MemtoReg = 0, RegWrite. S8 Branch: ALUSrcA = 1, ALUSrcB = 00, ALUOp = 01, PCSrc = 1, Branch. addi (Example 7.5): S9 (like S2) then S10 writes rt (RegDst = 0, MemtoReg = 0, RegWrite). j (Example 7.6): datapath adds PCJump to the PCSrc mux (now 2 bits); S11: PCSrc = 10, PCWrite. All paths return to S0.",
    steps: [
      { k: "learn", title: "The first two steps are shared", b: [
        `<p><b>S0 Fetch</b>: read the instruction into IR <i>and</i> use the idle ALU to compute PC + 4.</p>`,
        `<p><b>S1 Decode</b>: read rs and rt into A and B. The ALU is idle again, so it computes the branch target PC + SignImm×4, just in case. If the instruction isn't a branch, nothing is lost.</p>`,
        `<p>After S1, the opcode chooses the path.</p>`,
      ]},
      { k: "play", title: "Step through the FSM", b: [
        fsm,
        `<p class="aside">Pick an instruction and press Next cycle. Count the states: that's how many clock cycles it takes.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "In S8 (Branch), PCSrc = 1 selects ALUOut. Why not ALUResult?", opts: [["In S8 the ALU is busy subtracting A − B; the target was computed in S1 and saved in ALUOut", true, "That's exactly why PCSrc needs both inputs (footnote 2)."], ["ALUResult is always PC + 4", false, "ALUResult is whatever the ALU computes this cycle."], ["ALUOut is faster", false, "It's about timing of steps, not speed."]] },
        { t: "num", q: "How many cycles does sw take on the multicycle processor?", a: 4, tol: 0.01, why: "S0, S1, S2, S5." },
        { t: "mcq", q: "The book notes S2 and S9 are identical. Why?", opts: [["Both compute A + SignImm (ALUSrcA = 1, ALUSrcB = 10, ALUOp = 00)", true, "Address calculation and addi's sum are the same addition."], ["Both write the register file", false, "Neither writes; S4 and S10 do."], ["Both read memory", false, "Neither does."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Walk a beq through the multicycle FSM.", model: "S0 fetches the instruction into IR while the ALU computes PC + 4 and writes it to the PC. S1 reads the two registers into A and B and, since the ALU is free, computes the branch target PC + SignImm×4 into ALUOut. S8 subtracts A − B; Branch is asserted and PCSrc selects ALUOut, so if Zero is 1 the PC is loaded with the target. Then the FSM returns to S0. Three cycles." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Multicycle performance", mins: 15,
    blurb: "Shorter cycles, but 3 to 5 of them per instruction, and register overhead paid on every one. It ends up slower.",
    takeaway: "Cycles: beq and j 3; sw, addi and R-type 4; lw 5. CPI depends on the mix. Example 7.7 (SPECINT2000: 25% loads, 10% stores, 11% branches, 2% jumps, 52% R-type): CPI = (0.11 + 0.02)(3) + (0.52 + 0.10)(4) + (0.25)(5) = 4.12, better than 5 if all took the worst case. Cycle time (register file faster than memory, memory write faster than read): Tc = tpcq + tmux + max(tALU + tmux, tmem) + tsetup (7.4). Example 7.8: Tc2 = 30 + 25 + 250 + 20 = 325 ps; 100 billion instructions × 4.12 × 325 ps = 133.9 s vs 92.5 s single-cycle. Why slower: lw's five steps aren't equal length, and the 50 ps sequencing overhead (clk-to-Q + setup) is paid every step. It's hard to exploit that some computations are faster unless the differences are large. Cheaper though: two fewer adders and one memory, but five nonarchitectural registers and more muxes.",
    steps: [
      { k: "learn", title: "Cycles per instruction", b: [
        `<div class="tbl"><table><thead><tr><th>Instruction</th><th>States</th><th>Cycles</th></tr></thead><tbody>
          <tr><td>beq, j</td><td>S0 S1 S8 / S11</td><td>3</td></tr>
          <tr><td>R-type, sw, addi</td><td>S0 S1 + 2</td><td>4</td></tr>
          <tr><td>lw</td><td>S0 S1 S2 S3 S4</td><td>5</td></tr></tbody></table></div>`,
        `<p>Example 7.7 (SPECINT2000 mix): CPI = 0.13 × 3 + 0.62 × 4 + 0.25 × 5 = <b>4.12</b>.</p>`,
      ]},
      { k: "learn", title: "Example 7.8: the surprise", b: [
        `<p class="eq">T<sub>c2</sub> = 30 + 25 + 250 + 20 = 325 ps</p>`,
        bars([["Single-cycle: 1 × 925 ps", 92.5], ["Multicycle: 4.12 × 325 ps", 133.9, true]], "s", 140),
        `<p>lw was cut into 5 steps, but the cycle didn't shrink 5×: the steps aren't equal, and the 50 ps of register overhead (clk-to-Q + setup) is now paid on <i>every</i> step.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A program is 50% R-type, 30% lw and 20% beq. Multicycle CPI?", a: 4.1, tol: 0.01, why: "0.5 × 4 + 0.3 × 5 + 0.2 × 3 = 2 + 1.5 + 0.6 = 4.1." },
        { t: "mcq", q: "What does the multicycle design buy you, if not speed here?", opts: [["Less hardware: one memory, one adder (the ALU)", true, "Though it adds five registers and some muxes."], ["A CPI of 1", false, "Its CPI is about 4."], ["No control FSM", false, "It needs one."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why didn't splitting lw into five steps make the processor five times faster per cycle?", model: "The steps aren't equally long, so the cycle is set by the slowest one, a memory access, not one fifth of the total. And every step pays the register sequencing overhead, clock-to-Q plus setup, which the single-cycle design paid only once per instruction. With a CPI around 4, the multicycle processor ends up slower overall." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Pipelining the datapath", mins: 25,
    blurb: "Cut the single-cycle datapath into five stages with registers between them. Five instructions in flight; one finishes every cycle.",
    takeaway: "Pipelining divides the single-cycle processor into five stages, each containing one slow step: Fetch (instruction memory), Decode (register file read + control), Execute (ALU), Memory (data memory), Writeback (register file write). Latency is ideally unchanged, throughput ideally ×5. Figure 7.43 (ignoring mux and register delays): single-cycle latency 250 + 150 + 200 + 250 + 100 = 950 ps, 1.05 billion instructions/s; pipelined stage = 250 ps (the slowest stage, memory), latency 5 × 250 = 1250 ps, throughput 4 billion/s. Abstract diagram (Figure 7.44): IM, RF, ALU, DM, RF; the register file is written in the first half of a cycle and read in the second, so a value can be written and read back in one cycle (written on the falling edge). Pipelined datapath: four pipeline registers; signals get suffixes F, D, E, M, W. All signals of an instruction must advance together: Figure 7.45(b)'s bug used WriteRegE with ResultW, so lw's result would go to the wrong register; fix: pipeline WriteReg to the Writeback stage (Figure 7.46). Control signals are generated in Decode by the same control unit and pipelined along (RegWrite must reach Writeback).",
    steps: [
      { k: "learn", title: "Five stages", b: [
        `<div class="tbl"><table><tbody><tr><td><b>F</b>etch</td><td>read instruction memory</td></tr><tr><td><b>D</b>ecode</td><td>read the register file, generate control</td></tr><tr><td><b>E</b>xecute</td><td>ALU</td></tr><tr><td><b>M</b>emory</td><td>read or write data memory</td></tr><tr><td><b>W</b>riteback</td><td>write the register file</td></tr></tbody></table></div>`,
        `<div class="two"><div class="tile"><h3>Single-cycle</h3><p>latency 950 ps<br>1 instruction / 950 ps</p></div><div class="tile"><h3>Pipelined</h3><p>latency 5 × 250 = 1250 ps<br>1 instruction / 250 ps</p></div></div>`,
        seenHH("Pipelining as temporal parallelism; throughput vs latency.", "03-sequential-logic.html", "Chapter 3"),
      ]},
      { k: "play", title: "Watch the pipeline (Figure 7.44)", b: [
        basicPipe,
        `<p class="aside">Read across a row to follow one instruction; read down a column to see what every stage does in one cycle. The register file is written in the first half of a cycle and read in the second.</p>`,
      ]},
      { k: "learn", title: "Keep each instruction's signals together", b: [
        `<p>Four pipeline registers split the datapath; signals carry a stage suffix: PCF, InstrD, SrcAE, ALUOutM, ResultW…</p>`,
        `<p>The book's first attempt (Figure 7.45b) has a bug: the register file's write <b>data</b> comes from Writeback (ResultW) but the write <b>address</b> from Execute (WriteRegE). lw's result would land in another instruction's register. Fix: carry WriteReg along to Writeback. Control signals are pipelined the same way.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "In Figure 7.44, which cycle is the or instruction (the 6th) in its Execute (ALU) stage?", a: 8, tol: 0.01, why: "Fetched in cycle 6, decoded in 7, executed in 8." },
        { t: "mcq", q: "Why is the pipelined latency (1250 ps) longer than single-cycle (950 ps)?", opts: [["Every stage takes as long as the slowest stage (250 ps), even the shorter ones", true, "Decode (150) and Writeback (100) are padded to 250."], ["Instructions wait for each other", false, "Not in the ideal case."], ["Pipeline registers are slower than memory", false, "This diagram ignores register delays."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Pipelining doesn't make an instruction finish sooner. Why is it still faster?", model: "Latency stays about the same or gets slightly worse, but a new instruction starts every cycle and one finishes every cycle, and the cycle is about a fifth as long. Processors run billions of instructions, so throughput matters much more than the latency of any single one." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const p9 = {
    id: "p9", title: "Data hazards: forwarding and stalls", mins: 25,
    blurb: "An instruction needs a result that's still in the pipe. Forward it if it exists; stall if it doesn't yet.",
    takeaway: "A hazard: an instruction depends on a result not yet completed. RAW (read after write) hazard (Figure 7.48): add writes $s0 in cycle 5 (first half); and reads it in cycle 3, or in cycle 4: wrong values; sub reads in the second half of cycle 5: correct. So hazards occur when either of the two following instructions reads the written register. Data hazards vs control hazards. Forwarding (bypassing, Figure 7.49): the result exists after Execute, so send it from the Memory or Writeback stage to the Execute stage through muxes in front of the ALU; the hazard unit compares rsE/rtE with WriteRegM/WriteRegW and checks RegWriteM/RegWriteW. ForwardAE = 10 if rsE ≠ 0, rsE = WriteRegM and RegWriteM; else 01 if rsE ≠ 0, rsE = WriteRegW and RegWriteW; else 00 (Memory has priority, being more recent; $0 never forwarded). ForwardBE same with rt. Stalls: lw has a two-cycle latency (data at the end of Memory), so a dependent next instruction can't be fed by forwarding (Figure 7.51). Stall it in Decode one cycle (Figure 7.52): the instruction behind waits in Fetch; Execute gets a bubble (control signals zeroed, behaves like nop). Stalling = disable the pipeline register; stall all earlier stages; clear the register after the stalled stage. lwstall = ((rsD == rtE) OR (rtD == rtE)) AND MemtoRegE; StallF = StallD = FlushE = lwstall (enable inputs on the F and D registers, CLR on E).",
    steps: [
      { k: "learn", title: "Read after write", b: [
        `<p>The register file is written in <b>Writeback</b> but read in <b>Decode</b>, three stages earlier. If either of the next two instructions reads the register being written, it gets the stale value: a <b>RAW hazard</b>.</p>`,
        `<p>But the value already exists right after the ALU computes it. So instead of waiting, <b>forward</b> it.</p>`,
      ]},
      { k: "play", title: "See the hazards", b: [
        (host) => hazards(host, ["No forwarding (wrong!)", "Forwarding", "lw: stall + forward"]),
        `<p class="aside">Green lines are forwarding paths. Dashed boxes are a stall and the bubble it creates.</p>`,
      ]},
      { k: "learn", title: "The hazard unit's logic", b: [
        pre(`if      ((rsE != 0) AND (rsE == WriteRegM) AND RegWriteM) ForwardAE = 10
else if ((rsE != 0) AND (rsE == WriteRegW) AND RegWriteW) ForwardAE = 01
else                                                       ForwardAE = 00

lwstall = ((rsD == rtE) OR (rtD == rtE)) AND MemtoRegE
StallF = StallD = FlushE = lwstall`),
        `<p>Memory stage wins over Writeback: it holds the more recent result. $0 is never forwarded: it's always 0.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "sub $t0, $s1, $s2 is immediately followed by add $t1, $t0, $t3. How is the hazard handled?", opts: [["Forward from the Memory stage: ForwardAE = 10", true, "sub's result is in ALUOutM when add is in Execute."], ["Stall one cycle", false, "Only lw results arrive too late to forward."], ["No hazard", false, "add reads $t0 before sub writes it back."]] },
        { t: "mcq", q: "rsE = $t0, and both the Memory and Writeback stages are writing $t0. ForwardAE?", opts: [["10 (from Memory)", true, "The Memory stage holds the more recent instruction."], ["01 (from Writeback)", false, "Writeback's value is older."], ["00", false, "There's a match, so forward."]] },
        { t: "mcq", q: "An instruction reads a register written by an add three instructions earlier. What's needed?", opts: [["Nothing: the write happens in the first half of the cycle, the read in the second", true, "Same cycle, write then read."], ["Forwarding from Writeback", false, "By then the register file already has it."], ["A stall", false, "No delay needed."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't forwarding alone handle a lw followed by an instruction that uses its result?", model: "lw doesn't have the data until the end of its Memory stage, but the next instruction needs it at the start of its Execute stage, which is the same cycle. Forwarding can only move a value that already exists, so the dependent instruction has to stall in Decode for one cycle; then the value can be forwarded from lw's Writeback stage." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "Control hazards and pipelined performance", mins: 25,
    blurb: "Branches decide late, so predict not-taken and flush if wrong. Then add it all up: CPI 1.15, 550 ps, 63.3 s.",
    takeaway: "beq is a control hazard: the next fetch happens before the decision. Stalling until the decision (made in Memory) costs 3 cycles per branch. Predict not taken; if taken, flush the wrongly fetched instructions (Figure 7.54: branch at 0x20 to 0x64; and, or, sub flushed; penalty 3). Decide earlier: an equality comparator (faster than subtract + zero detect) and the branch adder move into Decode; PCSrcD clears the Decode register (Figure 7.55, penalty 1). New RAW hazard on the comparator's operands: forward from Memory (ForwardAD = (rsD ≠ 0) AND (rsD == WriteRegM) AND RegWriteM, ForwardBD with rt); stall if the source comes from an ALU instruction in Execute or a lw in Memory: branchstall = BranchD AND RegWriteE AND (WriteRegE == rsD OR WriteRegE == rtD) OR BranchD AND MemtoRegM AND (WriteRegM == rsD OR WriteRegM == rtD); StallF = StallD = FlushE = lwstall OR branchstall. addi and j: decoder as before plus a jump mux; j flushes the Fetch instruction (Exercise 7.35). Performance: ideal CPI 1. Example 7.9: loads 25% (40% followed by a use → CPI 1.4), branches 11% (¼ mispredicted → 1.25), jumps 2% (CPI 2): CPI = 0.25(1.4) + 0.1(1) + 0.11(1.25) + 0.02(2) + 0.52(1) = 1.15. Equation 7.5 stage times (comparator 40, AND 15, RF write 100, memory write 220 ps): Fetch 30 + 250 + 20 = 300; Decode 2(150 + 25 + 40 + 15 + 25 + 20) = 550; Execute 30 + 25 + 25 + 200 + 20 = 300; Memory 30 + 220 + 20 = 270; Writeback 2(30 + 25 + 100) = 310 → Tc3 = 550 ps (Decode and Writeback do half-cycle work, so ×2). Example 7.10: 100 billion × 1.15 × 550 ps = 63.3 s vs 92.5 and 133.9. Far from 5×: hazards raise CPI a little and sequencing overhead is paid every stage. Decode is the slow stage; resolving branches in Execute might be better overall.",
    steps: [
      { k: "learn", title: "Predict, then flush if wrong", b: [
        `<p>When beq is fetched, the processor doesn't yet know what comes next. Stalling every branch until it's decided would be expensive.</p>`,
        `<p>Instead, <b>predict not taken</b>: keep fetching in order. If the branch is taken after all, <b>flush</b> the wrongly fetched instructions. Those wasted cycles are the <b>branch misprediction penalty</b>.</p>`,
      ]},
      { k: "play", title: "Decide late vs decide early", b: [
        (host) => hazards(host, ["beq: decide in Memory", "beq: decide in Decode"]),
      ]},
      { k: "learn", title: "The cost of deciding early", b: [
        `<p>Comparing in Decode means the branch's operands may not be written yet: a new RAW hazard. Forward from Memory when possible; stall when the value comes from an ALU instruction still in Execute or a lw in Memory.</p>`,
        pre(`ForwardAD = (rsD != 0) AND (rsD == WriteRegM) AND RegWriteM
branchstall = BranchD AND RegWriteE AND (WriteRegE == rsD OR WriteRegE == rtD)
           OR BranchD AND MemtoRegM AND (WriteRegM == rsD OR WriteRegM == rtD)
StallF = StallD = FlushE = lwstall OR branchstall`),
      ]},
      { k: "learn", title: "Example 7.9: CPI", b: [
        `<div class="tbl"><table><thead><tr><th>Type</th><th>Share</th><th>CPI</th></tr></thead><tbody>
          <tr><td>loads (40% need a stall)</td><td>25%</td><td>0.6(1) + 0.4(2) = 1.4</td></tr>
          <tr><td>stores</td><td>10%</td><td>1</td></tr>
          <tr><td>branches (¼ mispredicted)</td><td>11%</td><td>0.75(1) + 0.25(2) = 1.25</td></tr>
          <tr><td>jumps (always flush)</td><td>2%</td><td>2</td></tr>
          <tr><td>R-type</td><td>52%</td><td>1</td></tr></tbody></table></div>
          <p class="eq">CPI = 1.15</p>`,
      ]},
      { k: "learn", title: "Example 7.10: the slowest stage sets T<sub>c</sub>", b: [
        bars([["Fetch", 300], ["Decode (×2: half-cycle read + compare)", 550, true], ["Execute", 300], ["Memory", 270], ["Writeback (×2)", 310]], "ps", 550),
        bars([["Single-cycle", 92.5], ["Multicycle", 133.9], ["Pipelined: 1.15 × 550 ps", 63.3, true]], "s", 140),
        `<p>Faster, but nowhere near 5×: a little CPI from hazards, and a lot from paying register overhead in every stage.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A program: 30% loads, half followed by a dependent instruction; 10% branches, 20% mispredicted; the rest 1 cycle. Pipelined CPI (branch decided in Decode)?", a: 1.17, tol: 0.005, why: "0.3 × 1.5 + 0.1 × 1.2 + 0.6 × 1 = 0.45 + 0.12 + 0.6 = 1.17." },
        { t: "mcq", q: "Why does moving the branch decision to Decode cut the penalty from 3 to 1?", opts: [["Only the one instruction already fetched behind the branch must be flushed", true, "The decision comes at the end of cycle 2 instead of 4."], ["Decode is faster than Memory", false, "It's about when, not how fast."], ["The prediction becomes always correct", false, "Prediction is unchanged; the cost of being wrong shrinks."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Give two reasons the five-stage pipeline is far from five times faster than the single-cycle processor.", model: "First, hazards: load-use stalls and branch mispredictions waste cycles, raising the CPI from 1 to about 1.15. Second, and bigger, the clock period is set by the slowest stage, here Decode at 550 ps, and every stage pays the pipeline register's clock-to-Q and setup overhead, so the cycle is much longer than a fifth of the single-cycle 925 ps." },
      ]},
    ],
  };

  /* =============== PART 11 =============== */
  const MIPSTEST = `main:   addi $2, $0, 5      # initialize $2 = 5
        addi $3, $0, 12     # initialize $3 = 12
        addi $7, $3, -9     # initialize $7 = 3
        or   $4, $7, $2     # $4 = (3 OR 5) = 7
        and  $5, $3, $4     # $5 = (12 AND 7) = 4
        add  $5, $5, $4     # $5 = 4 + 7 = 11
        beq  $5, $7, end    # shouldn't be taken
        slt  $4, $3, $4     # $4 = 12 < 7 = 0
        beq  $4, $0, around # should be taken
        addi $5, $0, 0      # shouldn't happen
around: slt  $4, $7, $2     # $4 = 3 < 5 = 1
        add  $7, $4, $5     # $7 = 1 + 11 = 12
        sub  $7, $7, $2     # $7 = 12 - 5 = 7
        sw   $7, 68($3)     # [80] = 7
        lw   $2, 80($0)     # $2 = [80] = 7
        j    end            # should be taken
        addi $2, $0, 1      # shouldn't happen
end:    sw   $2, 84($0)     # write mem[84] = 7`;
  const p11 = {
    id: "p11", title: "HDL, testing, and exceptions", mins: 20,
    blurb: "The whole single-cycle processor fits in a few pages of HDL, tested by a program that writes 7 to address 84. Then: what happens on an exception.",
    takeaway: "HDL (Section 7.6): the single-cycle processor (with addi and j) as mips = controller (maindec + aludec) + datapath, built from generic blocks: regfile (3-ported, read combinationally, write on the clock edge, register 0 hardwired to 0), adder, sl2, signext, flopr (resettable register), mux2. Instruction and data memories are separate modules (imem, dmem with 64 words) connected by buses. Testbench (Figure 7.60, ad hoc testing): a program using add, sub, and, or, slt, addi, lw, sw, beq, j that writes 7 to address 84 only if everything works; machine code in memfile.dat loaded with $readmemh; the testbench checks memwrite at address 84 with data 7 (\"Simulation succeeded\"); any other write except to 80 fails. Exceptions (Section 7.7, multicycle): undefined instruction (Cause 0x28) and arithmetic overflow (Cause 0x30): copy PC to EPC, write Cause, jump to the handler at 0x80000180. EPC and Cause are Coprocessor 0 registers 14 and 13, read with mfc0. Datapath: EPC and Cause registers with EPCWrite and CauseWrite, IntCause mux (0x30/0x28), PCSrc mux input for 0x80000180, ALU Overflow output, MemtoReg mux input from Coprocessor 0. Controller: S12 Undefined (PCSrc = 11, PCWrite, IntCause = 1, CauseWrite, EPCWrite), S13 Overflow (from S7 on overflow; IntCause = 0), S14 MFC0 (RegDst = 0, MemtoReg = 10, RegWrite). On an exception the instruction is discarded and the register file isn't written.",
    steps: [
      { k: "learn", title: "The processor in HDL", b: [
        `<p>Section 7.6 writes the single-cycle processor (with addi and j) in a few pages: <code>mips</code> = <code>controller</code> (main decoder + ALU decoder) + <code>datapath</code>, built from small generic blocks: <code>regfile</code>, <code>adder</code>, <code>sl2</code>, <code>signext</code>, <code>flopr</code>, <code>mux2</code>.</p>`,
        `<p>How do you know it works? Run a program whose answer is only right if every instruction works.</p>`,
        seenHH("SystemVerilog modules, always_ff, testbenches.", "04-hdl.html", "Chapter 4"),
      ]},
      { k: "play", title: "Run the self-test (Figure 7.60)", b: [
        (host) => sim(host, { src: MIPSTEST, text: 0, hex: true, watch: [["mem[80]", 80], ["mem[84]", 84]], listHeight: 300 }),
        `<p class="aside">Run it. If mem[84] ends up 7, every instruction behaved. The machine code matches the book's memfile.dat word for word.</p>`,
      ]},
      { k: "learn", title: "Exceptions in the multicycle processor", b: [
        `<div class="tbl"><table><thead><tr><th>Event</th><th>Cause</th></tr></thead><tbody><tr><td>Undefined instruction</td><td>0x28</td></tr><tr><td>Arithmetic overflow (add, sub)</td><td>0x30</td></tr></tbody></table></div>`,
        `<ol><li>EPC ← PC, Cause ← code.</li><li>PC ← 0x80000180, the exception handler (part of the OS).</li><li>The handler reads Cause and EPC with <code>mfc0</code> (Coprocessor 0 registers 13 and 14).</li></ol>`,
        `<p>Hardware: EPC and Cause registers (EPCWrite, CauseWrite), an IntCause mux, a new PCSrc input (0x80000180), the ALU's Overflow flag, and a MemtoReg input for mfc0. FSM: S12 Undefined, S13 Overflow, S14 MFC0. The faulting instruction is discarded: no register is written.</p>`,
        seenHH("Exceptions, EPC, Cause and Coprocessor 0.", "06-architecture.html", "Chapter 6"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "An add overflows. Which is true afterwards?", opts: [["Cause = 0x30, EPC = the add's address, PC = 0x80000180, rd unchanged", true, "S13: the result is discarded."], ["rd holds the wrapped sum", false, "The register file isn't written."], ["Cause = 0x28", false, "That's an undefined instruction."]] },
        { t: "mcq", q: "Why is ad hoc testing (one program, one answer) weaker than it looks?", opts: [["A bug might not affect this particular program, so it can pass anyway", true, "It only shows these instructions worked in this order."], ["The program is too long", false, "It's 18 instructions."], ["HDL can't be tested", false, "That's what the testbench does."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does the multicycle processor do, step by step, when it decodes an undefined instruction?", model: "The FSM goes to state S12. It saves the PC in EPC, selects the code 0x28 with IntCause and writes it to the Cause register, and loads the PC with the exception handler address 0x80000180 through the PCSrc mux. The undefined instruction does nothing else, and the handler can read Cause and EPC with mfc0 to decide what to do." },
      ]},
    ],
  };

  /* =============== PART 12 =============== */
  function deepPipe(host) {
    const out = el(`<div></div>`);
    const tc = (n) => 875 / n + 50, cpi = (n) => 1.15 + 0.1 * (n - 5), it = (n) => tc(n) * cpi(n);
    const draw = (n) => {
      n = Math.round(n);
      out.innerHTML = `<div class="fig">${plot({ x: [5, 15], y: [0, 300], xt: [5, 7, 9, 11, 13, 15], yt: [0, 100, 200, 300], xl: "pipeline stages N", yl: "ps", series: [{ f: tc, cls: "s2" }, { f: it, cls: "s1" }], marks: [{ x: n, y: it(n), label: `${it(n).toFixed(0)} ps`, dy: -12 }], label: "Cycle time and instruction time versus pipeline depth" })}</div><p>N = ${n}: T<sub>c</sub> = 875/${n} + 50 = ${tc(n).toFixed(0)} ps; CPI = ${cpi(n).toFixed(2)}; time per instruction = <b>${it(n).toFixed(0)} ps</b>.</p><p class="aside">Lower curve: T<sub>c</sub>. Upper curve: T<sub>c</sub> × CPI.</p>`;
    };
    host.append(slider({ id: "hh7n", label: "Pipeline stages", min: 5, max: 15, step: 1, value: 5, show: (v) => Math.round(v) }, draw).el, out); draw(5);
  }
  function predictor(host) {
    let bits = 2, st1 = 0, st2 = 0, runs = 0, log = [];
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`), bRun = btn("Run the loop once (10 iterations)", "primary"), bReset = btn("Reset");
    const N2 = ["strongly not taken", "weakly not taken", "weakly taken", "strongly taken"];
    const draw = () => {
      out.innerHTML = `<p>Predictor state: <b>${bits === 1 ? (st1 ? "predict taken" : "predict not taken") : N2[st2]}</b></p><div class="tbl" style="max-height:220px;overflow:auto"><table><thead><tr><th>Run</th><th>beq outcomes (N = not taken, T = taken)</th><th>Mispredictions</th></tr></thead><tbody>${log.map((l) => `<tr><td>${l[0]}</td><td class="mono">${l[1]}</td><td>${l[2]}</td></tr>`).join("")}</tbody></table></div>`;
    };
    bRun.addEventListener("click", () => {
      runs++; let s = "", miss = 0;
      for (let i = 1; i <= 10; i++) {
        const taken = i === 10, pred = bits === 1 ? st1 === 1 : st2 >= 2, ok = pred === taken;
        if (!ok) miss++;
        s += ok ? (taken ? "T" : "N") : `<span style="color:var(--bad);font-weight:700">${taken ? "T" : "N"}</span>`;
        if (bits === 1) st1 = taken ? 1 : 0; else st2 = taken ? Math.min(3, st2 + 1) : Math.max(0, st2 - 1);
      }
      log.push([runs, s, miss]); draw();
    });
    bReset.addEventListener("click", () => { st1 = 0; st2 = 0; runs = 0; log = []; draw(); });
    row.append(bRun, bReset);
    host.append(toggle(["2-bit predictor", "1-bit predictor"], (i) => { bits = i ? 1 : 2; st1 = 0; st2 = 0; runs = 0; log = []; draw(); }, 0), row, out); draw();
  }
  const p12 = {
    id: "p12", title: "Faster clocks: deep pipelines and branch prediction", mins: 20,
    blurb: "More stages shorten the cycle but add overhead and hazards. Better guesses about branches win back the CPI.",
    takeaway: "CMOS scaling (30% smaller each 2–3 years, twice the transistors) makes gates faster, but power now limits everything. Deep pipelines: 10–20 stages are common; limited by hazards (more stalls, larger CPI), sequencing overhead (clk-to-Q, setup, skew: diminishing returns) and cost. Example 7.11: 875 ps of logic, 50 ps overhead per stage, CPI = 1.15 + 0.1(N − 5): Tc = 875/N + 50; instruction time minimum 227 ps at N = 11, only slightly better than 245 ps at N = 6. Clock-frequency marketing pushed the Pentium 4 to 20–31 stages; with power now critical, depths are shrinking. Branch prediction: deeper pipelines resolve branches later, raising the misprediction penalty. Static: predict backward branches taken (loops). Dynamic: a branch target buffer holds recent branches' destinations and history. A 1-bit predictor (repeat last outcome) mispredicts the first and last branch of a loop; a 2-bit predictor (strongly/weakly taken/not taken, Figure 7.66) mispredicts only the last. Good predictors exceed 90% accuracy. The predictor works in Fetch; the BTB also lets jumps avoid flushes.",
    steps: [
      { k: "learn", title: "Why not 100 stages?", b: [
        `<ul><li><b>Sequencing overhead</b>: every stage pays clk-to-Q + setup (+ skew). It doesn't shrink as the logic per stage does.</li><li><b>Hazards</b>: more stages, more dependencies in flight, more stalls and bigger branch penalties.</li><li><b>Cost and power</b>: more registers and hazard logic.</li></ul>`,
      ]},
      { k: "play", title: "Example 7.11", b: [
        deepPipe,
        `<p class="aside">875 ps of logic, 50 ps overhead per stage, CPI rising 0.1 per extra stage. Find the best N, and notice how flat the curve is near it.</p>`,
      ]},
      { k: "learn", title: "Predicting branches", b: [
        `<p><b>Static</b>: backward branches (loops) are usually taken, so predict them taken.</p>`,
        `<p><b>Dynamic</b>: a <b>branch target buffer</b> remembers recent branches, their targets and whether they were taken.</p>`,
        `<p>The book's loop: <code>beq $s0, $t0, done</code> runs 10 times and is taken only the last time.</p>`,
      ]},
      { k: "play", title: "1-bit vs 2-bit", b: [
        predictor,
        `<p class="aside">Run the loop several times with each predictor. Red outcomes were mispredicted.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "From the plot: the best number of stages for Example 7.11?", a: 11, tol: 0.01, why: "Minimum instruction time ≈ 227 ps at N = 11." },
        { t: "mcq", q: "Why does the 1-bit predictor miss twice per loop run (after the first)?", opts: [["It mispredicts the exit (taken) and then the first test of the next run (it remembers 'taken')", true, "The 2-bit predictor tolerates one surprise."], ["It predicts randomly", false, "It repeats the last outcome."], ["It can't predict backward branches", false, "This beq is a forward branch out of the loop."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a 2-bit branch predictor avoid the 1-bit predictor's extra misprediction on loops?", model: "It needs two surprises in a row to change its prediction. While the loop repeats it sits in strongly not taken. The single taken branch at the loop exit is mispredicted but only moves it to weakly not taken, so when the loop runs again it still predicts not taken and is right. It mispredicts only the last branch of each run." },
      ]},
    ],
  };

  /* =============== PART 13 =============== */
  function simdWidget(host) {
    const inA = el(`<input type="text" value="10FF8040" aria-label="word a" style="font-family:var(--mono);padding:6px;border-radius:8px;border:1px solid var(--line);background:var(--paper);color:var(--ink);width:8em">`);
    const inB = el(`<input type="text" value="20017F50" aria-label="word b" style="font-family:var(--mono);padding:6px;border-radius:8px;border:1px solid var(--line);background:var(--paper);color:var(--ink);width:8em">`);
    const out = el(`<div></div>`);
    const draw = () => {
      const a = parseInt(inA.value, 16) >>> 0, b = parseInt(inB.value, 16) >>> 0;
      if (isNaN(a) || isNaN(b)) { out.innerHTML = ""; return; }
      const by = (w) => [3, 2, 1, 0].map((k) => (w >>> (8 * k)) & 255), h2 = (v) => v.toString(16).toUpperCase().padStart(2, "0");
      const A = by(a), B = by(b), P = A.map((x, i) => (x + B[i]) & 255), Wd = by((a + b) >>> 0);
      out.innerHTML = `<div class="tbl"><table style="text-align:center;font-family:var(--mono)"><thead><tr><th></th><th>byte 3</th><th>byte 2</th><th>byte 1</th><th>byte 0</th></tr></thead><tbody>
        <tr><td>a</td>${A.map((x) => `<td>${h2(x)}</td>`).join("")}</tr><tr><td>b</td>${B.map((x) => `<td>${h2(x)}</td>`).join("")}</tr>
        <tr><td>padd8</td>${P.map((x) => `<td><b>${h2(x)}</b></td>`).join("")}</tr>
        <tr><td>32-bit add</td>${Wd.map((x, i) => `<td style="${x !== P[i] ? "color:var(--bad);font-weight:700" : ""}">${h2(x)}</td>`).join("")}</tr></tbody></table></div><p class="aside">Red bytes differ: a carry leaked from the lane to its right. Packed arithmetic cuts those carries.</p>`;
    };
    inA.addEventListener("input", draw); inB.addEventListener("input", draw);
    const r = el(`<div class="row"></div>`); r.append(el(`<span>a =</span>`), inA, el(`<span>b =</span>`), inB);
    host.append(r, out); draw();
  }
  const p13 = {
    id: "p13", title: "Wider: superscalar, out-of-order, SIMD, threads, cores", mins: 25,
    blurb: "Do several things at once: more datapaths, smarter issue order, packed data, extra thread state, more cores. Then a tour of real x86 chips.",
    takeaway: "Superscalar: multiple copies of datapath hardware (Figure 7.67: two-way, fetching two instructions, six-ported register file, two ALUs, two-ported data memory); ideal CPI 0.5 / IPC 2 (Figure 7.68); dependencies limit it (Figure 7.69: lw/add/sub/and/or/sw, IPC 1.17). Commercial: 3-, 4-, 6-way; rarely fully utilized; big forwarding networks cost power. Scalar vs vector vs superscalar. Out-of-order: look ahead and issue independent instructions early as long as dependencies are honored (Figure 7.70: lw, or; sw; add, sub; and → IPC 1.5). RAW (true dependence), WAR (antidependence: sub must not write $t0 before add reads it; can't occur in the simple pipeline), WAW (output dependence; squash the earlier write). WAR and WAW are artifacts of register reuse. A scoreboard tracks waiting instructions; ILP is the number of instructions that can execute simultaneously; practical ILP is 2–3. Register renaming adds nonarchitectural registers ($r0–$r19) to remove WAR hazards (Figure 7.71: rename sub's and and's $t0 to $r0 → IPC 2). SIMD (packed arithmetic): e.g., four 8-bit adds in one 32-bit word (padd8), carries cut between lanes; graphics pixels; 64-bit words hold 8×8, 4×16 or 2×32; 4 single-precision floats in 128 bits. Multithreading: process, threads, TLP, context switching; a multithreaded processor has several copies of architectural state (PCs, register files) so another thread can run when one stalls on memory or lacks ILP; improves throughput, not single-thread speed; cheap. Homogeneous multiprocessors (SMP): identical cores sharing memory; shift around 2005 to multiple cores; hard to speed up one thread. Heterogeneous: different cores/specialized hardware (IBM Cell: 1 PPE + 8 SPEs with their own ISA; CPU + GPU; DSP in phones). Clusters: each processor has its own memory. x86 (Table 7.7): 4004 (1971, 2300 transistors, 10 µm, 750 kHz); 80386 (1985, multicycle, microcode PLA); 80486 (pipelined, on-chip FPU, 8 KB cache); Pentium (superscalar, separate caches, branch predictor); P6 Pentium Pro/II/III (out-of-order, micro-ops, 11-stage pipeline); Pentium 4 (20–31 stages, trace cache, multithreading, >100 W); Pentium M (efficient P6); Core Duo (dual core); Core i7 (multi-core, shared L3).",
    steps: [
      { k: "learn", title: "Superscalar", b: [
        `<p>Duplicate the datapath: fetch two instructions per cycle, a six-ported register file (4 reads, 2 writes), two ALUs, a two-ported data memory. Ideal: <b>IPC = 2</b> (CPI 0.5).</p>`,
        `<p>Dependencies get in the way. On the book's six-instruction program (below), an in-order two-way machine reaches only IPC ≈ 1.17.</p>`,
        pre(`lw  $t0, 40($s0)
add $t1, $t0, $s1
sub $t0, $s2, $s3
and $t2, $s4, $t0
or  $t3, $s5, $s6
sw  $s7, 80($t3)`),
      ]},
      { k: "learn", title: "Out of order, and renaming", b: [
        `<div class="tbl"><table><thead><tr><th>Cycle</th><th>Out-of-order (Fig 7.70)</th><th>+ register renaming (Fig 7.71)</th></tr></thead><tbody>
          <tr><td>1</td><td>lw, or</td><td>lw, sub ($t0 → $r0)</td></tr>
          <tr><td>2</td><td>sw</td><td>and, or</td></tr>
          <tr><td>3</td><td>add, sub</td><td>add, sw</td></tr>
          <tr><td>4</td><td>and</td><td></td></tr>
          <tr><td>IPC</td><td>6/4 = 1.5</td><td>6/3 = 2</td></tr></tbody></table></div>`,
        `<div class="tbl"><table><tbody><tr><td><b>RAW</b></td><td>true dependence: must read after the write</td></tr><tr><td><b>WAR</b></td><td>antidependence: sub must not write $t0 before add reads it</td></tr><tr><td><b>WAW</b></td><td>output dependence: two writes must land in order</td></tr></tbody></table></div>`,
        `<p>WAR and WAW only exist because a register name was reused. Renaming to spare registers removes them.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Classify the dependence on $t0.", bins: ["RAW", "WAR", "WAW"], items: [
          ["lw $t0,… then add $t1,$t0,…", 0, "Reads the value lw writes."],
          ["add $t1,$t0,… then sub $t0,…", 1, "sub must not overwrite $t0 before add reads it."],
          ["add $t0,… then sub $t0,…", 2, "Both write $t0; the final value must be sub's."],
        ]},
        { t: "mcq", q: "Which hazards can register renaming remove?", opts: [["WAR and WAW", true, "They come from reusing names, not from data flow."], ["RAW", false, "A true dependence can't be renamed away."], ["All three", false, "RAW is inherent in the computation."]] },
      ]},
      { k: "play", title: "SIMD: packed arithmetic", b: [
        simdWidget,
        `<p class="aside">padd8 adds four 8-bit lanes in parallel. Try bytes that overflow, like FF + 01.</p>`,
      ]},
      { k: "learn", title: "Threads and cores", b: [
        `<p><b>Multithreading</b>: keep several threads' architectural state (PC + registers) in the processor. When one thread stalls on memory or runs out of parallel work, another issues. Throughput goes up; a single thread isn't faster. Cheap: only the PC and register file are duplicated.</p>`,
        `<p><b>Multiprocessors</b>: around 2005 designers switched to several <b>cores</b> per chip. Homogeneous (identical cores, shared memory) or heterogeneous (specialized cores: the Cell's SPEs, CPU + GPU, a phone's DSP). Clusters give each processor its own memory.</p>`,
      ]},
      { k: "learn", title: "Real x86 history", b: [
        `<div class="tbl"><table><thead><tr><th>Chip</th><th>Year</th><th>Microarchitecture idea</th></tr></thead><tbody>
          <tr><td>4004</td><td>1971</td><td>first single-chip CPU: 4-bit, 2300 transistors, 750 kHz</td></tr>
          <tr><td>80386</td><td>1985</td><td>multicycle, microcode PLA</td></tr>
          <tr><td>80486</td><td>1989</td><td>pipelined, on-chip FPU, 8 KB cache</td></tr>
          <tr><td>Pentium</td><td>1993</td><td>superscalar, branch predictor</td></tr>
          <tr><td>Pentium Pro/II/III</td><td>1995–99</td><td>out of order (P6), micro-ops, 11 stages</td></tr>
          <tr><td>Pentium 4</td><td>2001</td><td>20–31 stages, trace cache, &gt; 100 W</td></tr>
          <tr><td>Core Duo / i-series</td><td>2005 / 2009</td><td>multiple cores, shared caches</td></tr></tbody></table></div>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why did processor designers move from deeper and wider single cores to multiple cores around 2005?", model: "Deeper pipelines gave diminishing returns because of sequencing overhead and hazards, and wider out-of-order cores were limited by the low instruction-level parallelism of real programs, usually 2 to 3. Both burned a lot of power. Using the extra transistors for more cores raises total throughput more efficiently, though it shifts the work to software, which must be split into threads." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "hh7", eyebrow: "Harris & Harris · Chapter 7", title: "Microarchitecture",
    intro: `<p>Thirteen parts: performance, then the single-cycle, multicycle and pipelined MIPS processors (datapath, control, performance), hazards, HDL testing and exceptions, and the advanced techniques inside real chips.</p><p>You'll light up datapath paths for each instruction, step the multicycle FSM, read pipeline diagrams, and race branch predictors. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. For datapath questions, print or sketch Figure 7.11 / 7.27 / 7.58 and mark it up with a coloured pen; for pipeline questions, draw the diagram cycle by cycle.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13],
    summary: `
      <h3>Performance</h3>
      <p>Time = instructions × CPI × T<sub>c</sub>. Single-cycle: CPI 1, 925 ps, 92.5 s. Multicycle: CPI 4.12, 325 ps, 133.9 s. Pipelined: CPI 1.15, 550 ps, 63.3 s.</p>
      <h3>Single-cycle</h3>
      <p>Muxes ALUSrc, MemtoReg, RegDst, PCSrc (= Branch · Zero), Jump. Main decoder + ALU decoder (ALUOp 00 add, 01 sub, 10 funct).</p>
      <h3>Multicycle</h3>
      <p>One memory, one ALU; IR, A, B, ALUOut, Data. FSM S0 Fetch, S1 Decode, then 1–3 more states: beq/j 3, R/sw/addi 4, lw 5.</p>
      <h3>Pipelined</h3>
      <p>F D E M W. RAW hazards: forward from M/W; lw → one stall. Branches: predict not taken, decide in Decode, flush 1. Exceptions: EPC, Cause, 0x80000180.</p>
      <h3>Advanced</h3>
      <p>Deep pipelines, 2-bit branch prediction, superscalar, out-of-order, renaming, SIMD, multithreading, multicore.</p>`,
  };
  Course.start(window.CHAPTER);
})();
