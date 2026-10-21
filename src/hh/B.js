(function () {
  const { slider, toggle, readout, el } = Course;
  const seenHH = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const b2 = (v, n) => (v >>> 0).toString(2).padStart(n, "0");
  const hx = (v, n) => (v >>> 0).toString(16).toUpperCase().padStart(n, "0");

  /* ---------- the tables ---------- */
  // [opcode, assembly, description, operation, format]
  const B1 = [
    [0, "R-type", "all R-type instructions", "see Table B.2", "R"],
    [1, "bltz rs, label / bgez rs, label", "branch if < 0 / ≥ 0 (rt = 0 / 1)", "if ([rs] < 0) PC = BTA / if ([rs] ≥ 0) PC = BTA", "I"],
    [2, "j label", "jump", "PC = JTA", "J"],
    [3, "jal label", "jump and link", "$ra = PC + 4, PC = JTA", "J"],
    [4, "beq rs, rt, label", "branch if equal", "if ([rs] == [rt]) PC = BTA", "I"],
    [5, "bne rs, rt, label", "branch if not equal", "if ([rs] != [rt]) PC = BTA", "I"],
    [6, "blez rs, label", "branch if ≤ 0", "if ([rs] ≤ 0) PC = BTA", "I"],
    [7, "bgtz rs, label", "branch if > 0", "if ([rs] > 0) PC = BTA", "I"],
    [8, "addi rt, rs, imm", "add immediate", "[rt] = [rs] + SignImm", "I"],
    [9, "addiu rt, rs, imm", "add immediate unsigned", "[rt] = [rs] + SignImm", "I"],
    [10, "slti rt, rs, imm", "set less than immediate", "[rs] < SignImm ? [rt] = 1 : [rt] = 0", "I"],
    [11, "sltiu rt, rs, imm", "set less than immediate unsigned", "[rs] < SignImm ? [rt] = 1 : [rt] = 0", "I"],
    [12, "andi rt, rs, imm", "and immediate", "[rt] = [rs] & ZeroImm", "I"],
    [13, "ori rt, rs, imm", "or immediate", "[rt] = [rs] | ZeroImm", "I"],
    [14, "xori rt, rs, imm", "xor immediate", "[rt] = [rs] ^ ZeroImm", "I"],
    [15, "lui rt, imm", "load upper immediate", "[rt] = {imm, 16'b0}", "I"],
    [16, "mfc0 rt, rd / mtc0 rt, rd", "move from / to coprocessor 0 (rs = 0 / 4)", "[rt] = [rd] / [rd] = [rt]", "R"],
    [17, "F-type", "fop = 16 / 17: F-type instructions", "see Table B.3", "F"],
    [17, "bc1f label / bc1t label", "fop = 8: branch if fpcond is FALSE / TRUE (rt = 0 / 1)", "if (fpcond == 0) PC = BTA / if (fpcond == 1) PC = BTA", "I"],
    [28, "mul rd, rs, rt", "multiply, 32-bit result (funct = 2)", "[rd] = [rs] × [rt]", "R"],
    [32, "lb rt, imm(rs)", "load byte", "[rt] = SignExt([Address]<sub>7:0</sub>)", "I"],
    [33, "lh rt, imm(rs)", "load halfword", "[rt] = SignExt([Address]<sub>15:0</sub>)", "I"],
    [35, "lw rt, imm(rs)", "load word", "[rt] = [Address]", "I"],
    [36, "lbu rt, imm(rs)", "load byte unsigned", "[rt] = ZeroExt([Address]<sub>7:0</sub>)", "I"],
    [37, "lhu rt, imm(rs)", "load halfword unsigned", "[rt] = ZeroExt([Address]<sub>15:0</sub>)", "I"],
    [40, "sb rt, imm(rs)", "store byte", "[Address]<sub>7:0</sub> = [rt]<sub>7:0</sub>", "I"],
    [41, "sh rt, imm(rs)", "store halfword", "[Address]<sub>15:0</sub> = [rt]<sub>15:0</sub>", "I"],
    [43, "sw rt, imm(rs)", "store word", "[Address] = [rt]", "I"],
    [49, "lwc1 ft, imm(rs)", "load word to FP coprocessor 1", "[ft] = [Address]", "I"],
    [57, "swc1 ft, imm(rs)", "store word to FP coprocessor 1", "[Address] = [ft]", "I"],
  ];
  const B2 = [
    [0, "sll rd, rt, shamt", "shift left logical", "[rd] = [rt] << shamt"],
    [2, "srl rd, rt, shamt", "shift right logical", "[rd] = [rt] >> shamt"],
    [3, "sra rd, rt, shamt", "shift right arithmetic", "[rd] = [rt] >>> shamt"],
    [4, "sllv rd, rt, rs", "shift left logical variable", "[rd] = [rt] << [rs]<sub>4:0</sub>"],
    [6, "srlv rd, rt, rs", "shift right logical variable", "[rd] = [rt] >> [rs]<sub>4:0</sub>"],
    [7, "srav rd, rt, rs", "shift right arithmetic variable", "[rd] = [rt] >>> [rs]<sub>4:0</sub>"],
    [8, "jr rs", "jump register", "PC = [rs]"],
    [9, "jalr rs", "jump and link register", "$ra = PC + 4, PC = [rs]"],
    [12, "syscall", "system call", "system call exception"],
    [13, "break", "break", "break exception"],
    [16, "mfhi rd", "move from hi", "[rd] = [hi]"],
    [17, "mthi rs", "move to hi", "[hi] = [rs]"],
    [18, "mflo rd", "move from lo", "[rd] = [lo]"],
    [19, "mtlo rs", "move to lo", "[lo] = [rs]"],
    [24, "mult rs, rt", "multiply", "{[hi], [lo]} = [rs] × [rt]"],
    [25, "multu rs, rt", "multiply unsigned", "{[hi], [lo]} = [rs] × [rt]"],
    [26, "div rs, rt", "divide", "[lo] = [rs] / [rt], [hi] = [rs] % [rt]"],
    [27, "divu rs, rt", "divide unsigned", "[lo] = [rs] / [rt], [hi] = [rs] % [rt]"],
    [32, "add rd, rs, rt", "add", "[rd] = [rs] + [rt]"],
    [33, "addu rd, rs, rt", "add unsigned", "[rd] = [rs] + [rt]"],
    [34, "sub rd, rs, rt", "subtract", "[rd] = [rs] − [rt]"],
    [35, "subu rd, rs, rt", "subtract unsigned", "[rd] = [rs] − [rt]"],
    [36, "and rd, rs, rt", "and", "[rd] = [rs] & [rt]"],
    [37, "or rd, rs, rt", "or", "[rd] = [rs] | [rt]"],
    [38, "xor rd, rs, rt", "xor", "[rd] = [rs] ^ [rt]"],
    [39, "nor rd, rs, rt", "nor", "[rd] = ~([rs] | [rt])"],
    [42, "slt rd, rs, rt", "set less than", "[rs] < [rt] ? [rd] = 1 : [rd] = 0"],
    [43, "sltu rd, rs, rt", "set less than unsigned", "[rs] < [rt] ? [rd] = 1 : [rd] = 0"],
  ];
  const B3 = [
    [0, "add.s / add.d fd, fs, ft", "FP add", "[fd] = [fs] + [ft]"],
    [1, "sub.s / sub.d fd, fs, ft", "FP subtract", "[fd] = [fs] − [ft]"],
    [2, "mul.s / mul.d fd, fs, ft", "FP multiply", "[fd] = [fs] × [ft]"],
    [3, "div.s / div.d fd, fs, ft", "FP divide", "[fd] = [fs] / [ft]"],
    [5, "abs.s / abs.d fd, fs", "FP absolute value", "[fd] = ([fs] < 0) ? [−fs] : [fs]"],
    [7, "neg.s / neg.d fd, fs", "FP negation", "[fd] = [−fs]"],
    [58, "c.seq.s / c.seq.d fs, ft", "FP equality comparison", "fpcond = ([fs] == [ft])"],
    [60, "c.lt.s / c.lt.d fs, ft", "FP less than comparison", "fpcond = ([fs] < [ft])"],
    [62, "c.le.s / c.le.d fs, ft", "FP less than or equal comparison", "fpcond = ([fs] ≤ [ft])"],
  ];

  /* ---------- helpers ---------- */
  const FAM = {
    0: ["R-type, jumps and branches", "#5aa9e6"], 1: ["ALU with an immediate", "#e8b04b"], 2: ["coprocessors 0 and 1", "#b48ad6"], 3: ["multiply (mul)", "#e07a7a"],
    4: ["loads", "#7cc47c"], 5: ["stores", "#4fb3a9"], 6: ["FP load", "#9fd06a"], 7: ["FP store", "#58c1c1"],
  };
  const FMT = {
    R: [["op", 6], ["rs", 5], ["rt", 5], ["rd", 5], ["shamt", 5], ["funct", 6]],
    I: [["op", 6], ["rs", 5], ["rt", 5], ["imm", 16]],
    J: [["op", 6], ["addr", 26]],
    F: [["op", 6], ["cop", 5], ["ft", 5], ["fs", 5], ["fd", 5], ["funct", 6]],
  };
  // a format strip with the known fields filled in as bits
  function strip(fmt, known) {
    return `<div style="display:flex;gap:2px;font-family:var(--mono);font-size:12px;margin:6px 0">${FMT[fmt].map(([n, w]) => {
      const v = known[n];
      return `<div style="flex:${w} 1 0;min-width:0;text-align:center;border:1px solid var(--line);border-radius:5px;padding:4px 1px;${v != null ? "background:var(--accent);color:var(--paper);font-weight:700" : ""}"><div style="overflow:hidden;text-overflow:ellipsis">${v != null ? b2(v, w) : n}</div><div style="font-size:10px;opacity:.75">${n} · ${w}</div></div>`;
    }).join("")}</div>`;
  }

  /* ---------- widgets ---------- */
  // SignImm vs ZeroImm on a few fixed immediates
  function extend(host) {
    const IMMS = [0x0005, 0xFFFC, 0x7FFF, 0x8000];
    const out = el(`<div></div>`);
    const draw = (i) => {
      const imm = IMMS[i], s = imm & 0x8000 ? (0xFFFF0000 | imm) >>> 0 : imm;
      const sp = (v) => b2(v, 32).replace(/(.{16})(.{16})/, "$1 $2");
      out.innerHTML = `<pre class="code" style="font-variant-ligatures:none;font-size:12.5px">imm     =                  ${b2(imm, 16)}   (x${hx(imm, 4)})
SignImm = ${sp(s)}   (x${hx(s, 8)})
ZeroImm = ${sp(imm)}   (x${hx(imm, 8)})</pre>` +
        `<p>imm[15] = ${imm >> 15}: ${imm & 0x8000 ? "SignImm copies the 1 into all 16 upper bits, so as a signed number it's " + (imm - 65536) + ". ZeroImm fills with 0s: " + imm + "." : "both extensions give the same 32-bit value, " + imm + "."}</p>`;
    };
    host.append(toggle(IMMS.map((v) => "x" + hx(v, 4)), draw), out);
    draw(1);
  }

  // Where a branch lands: BTA = PC + 4 + (SignImm << 2), in instruction slots
  function bta(host) {
    const out = el(`<div></div>`);
    let imm = 2;
    const draw = () => {
      const rows = [];
      for (let k = -3; k <= 5; k++) {
        const isPC = k === 0, isNext = k === 1, isT = k === 1 + imm;
        const lab = isPC ? "the branch (PC)" : isNext ? "PC + 4" : "";
        rows.push(`<div style="display:grid;grid-template-columns:110px 1fr;gap:8px;align-items:center;margin:2px 0"><span class="aside" style="margin:0;text-align:right">${lab}</span><div style="padding:5px 8px;border-radius:5px;border:1px solid var(--line);font-family:var(--mono);font-size:13px;${isT ? "background:var(--accent);color:var(--paper);font-weight:700" : isPC ? "border-color:var(--accent)" : ""}">${isPC ? "beq …" : "instruction"}${isT ? "  ← BTA" : ""}</div></div>`);
      }
      out.innerHTML = rows.join("") + `<p>BTA = (PC + 4) + ${imm} × 4: ${imm === 0 ? "the instruction right after the branch" : Math.abs(imm) + " instruction" + (Math.abs(imm) > 1 ? "s " : " ") + (imm > 0 ? "past" : "before") + " PC + 4"}.</p>`;
    };
    host.append(slider({ id: "btaImm", label: "SignImm (in instructions)", min: -4, max: 4, step: 1, value: imm, show: (v) => Math.round(v) }, (v) => { imm = Math.round(v); draw(); }).el, out);
    draw();
  }

  function opTable(host) {
    const out = el(`<div></div>`), info = el(`<div></div>`);
    const fam = (op) => FAM[op >> 3];
    const pick = (r) => {
      const [op, a, d, o, f] = r;
      const known = { op };
      if (op === 28) known.funct = 2;
      if (op === 17 && f === "I") known.rs = 8;
      info.innerHTML = `<p><b>${a}</b>: ${d}.</p>` + readout([["opcode", `${b2(op, 6)} (${op})`], ["format", f === "F" ? "F-type" : f + "-type"], ["operation", o]]) + strip(f === "F" ? "F" : f, known) + (op === 17 && f === "I" ? `<p class="aside">bc1f/bc1t share opcode 17 with F-type and are told apart by the field after the opcode (fop = 8). It's I-type shaped, with rt = 0 or 1 picking false or true.</p>` : "");
    };
    out.innerHTML = `<div class="tbl"><table style="font-size:13px"><thead><tr><th>Opcode</th><th>Instruction</th></tr></thead><tbody>${B1.map((r, i) => `<tr data-i="${i}" style="cursor:pointer"><td style="font-family:var(--mono);white-space:nowrap"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${fam(r[0])[1]};margin-right:6px"></span>${b2(r[0], 6)} (${r[0]})</td><td style="font-family:var(--mono)">${r[1]}</td></tr>`).join("")}</tbody></table></div>`;
    out.querySelectorAll("tr[data-i]").forEach((tr) => tr.addEventListener("click", () => pick(B1[+tr.dataset.i])));
    host.append(el(`<p class="aside">${Object.values(FAM).map(([n, c]) => `<span style="white-space:nowrap"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${c};margin-right:4px"></span>${n}</span>`).join(" &nbsp; ")}</p>`), out, info);
    pick(B1[22]);
  }

  function functTable(host) {
    const out = el(`<div></div>`), info = el(`<div></div>`);
    let which = 0;
    const draw = () => {
      const T = which ? B3 : B2;
      out.innerHTML = `<div class="tbl"><table style="font-size:13px"><thead><tr><th>Funct</th><th>Instruction</th></tr></thead><tbody>${T.map((r, i) => `<tr data-i="${i}" style="cursor:pointer"><td style="font-family:var(--mono);white-space:nowrap">${b2(r[0], 6)} (${r[0]})</td><td style="font-family:var(--mono)">${r[1]}</td></tr>`).join("")}</tbody></table></div>`;
      out.querySelectorAll("tr[data-i]").forEach((tr) => tr.addEventListener("click", () => pick(T[+tr.dataset.i])));
      pick(T[0]);
    };
    const pick = (r) => {
      const [fn, a, d, o] = r;
      info.innerHTML = `<p><b>${a}</b>: ${d}.</p>` + readout([["funct", `${b2(fn, 6)} (${fn})`], ["operation", o]]) +
        (which ? strip("F", { op: 17, funct: fn }) + `<p class="aside">cop = 16 (10000) for single precision (.s), 17 (10001) for double (.d).</p>` : strip("R", { op: 0, funct: fn }));
    };
    host.append(toggle(["Table B.2: R-type", "Table B.3: F-type"], (i) => { which = i; draw(); }), out, info);
    draw();
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Reading the notation", mins: 15,
    blurb: "What [reg], SignImm, ZeroImm, BTA and JTA mean, and the one footnote that changes every branch in SPIM.",
    takeaway: "Appendix B summarizes the MIPS instructions used in the book: Tables B.1 (by opcode), B.2 (R-type by funct), B.3 (F-type by funct), each with assembly form, description and operation. Notation: [reg] = contents of a register; imm = the 16-bit immediate of an I-type instruction; addr = the 26-bit address of a J-type; SignImm = {{16{imm[15]}}, imm} (32-bit sign-extended); ZeroImm = {16'b0, imm} (zero-extended); Address = [rs] + SignImm; [Address] = contents of that memory location; BTA (branch target address) = PC + 4 + (SignImm << 2); JTA (jump target address) = {(PC + 4)[31:28], addr, 2'b0}; label = text marking an instruction location. Who uses which immediate: addi, addiu, slti, sltiu (it still sign-extends, then compares unsigned) and the load/store offsets use SignImm; andi, ori, xori use ZeroImm; lui puts imm in the upper half. Footnote 1: the SPIM simulator has no branch delay slot and computes BTA = PC + (SignImm << 2), so machine code assembled by SPIM for a real MIPS processor needs each branch immediate decremented by 1.",
    steps: [
      { k: "learn", title: "The symbols", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><code>[reg]</code></td><td>contents of the register</td></tr>
          <tr><td>imm, addr</td><td>the 16-bit immediate (I-type), the 26-bit address (J-type)</td></tr>
          <tr><td>SignImm</td><td><code>{{16{imm[15]}}, imm}</code>: copy bit 15 into the upper 16 bits</td></tr>
          <tr><td>ZeroImm</td><td><code>{16'b0, imm}</code>: fill the upper 16 bits with 0</td></tr>
          <tr><td>Address</td><td><code>[rs] + SignImm</code>, for loads and stores</td></tr>
          <tr><td>BTA</td><td><code>PC + 4 + (SignImm &lt;&lt; 2)</code></td></tr>
          <tr><td>JTA</td><td><code>{(PC + 4)[31:28], addr, 2'b0}</code></td></tr></tbody></table></div>`,
        `<p>The braces are SystemVerilog concatenation, from Chapter 4: <code>{16{x}}</code> means 16 copies of x.</p>`,
        seenHH("The R, I and J formats and their fields.", "06-architecture.html#p4", "Chapter 6"),
      ]},
      { k: "play", title: "Sign- or zero-extend", b: [
        extend,
        `<p>Arithmetic and comparisons (addi, slti) and load/store offsets use <b>SignImm</b>, so negative constants work. Logical immediates (andi, ori, xori) use <b>ZeroImm</b>, so a mask's upper half is all 0s.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which extension does the table give each instruction?", bins: ["SignImm", "ZeroImm"], items: [
          ["addi", 0, "[rt] = [rs] + SignImm."],
          ["ori", 1, "Logical: ZeroImm."],
          ["lw (the offset)", 0, "Address = [rs] + SignImm."],
          ["andi", 1, "Logical: ZeroImm."],
          ["sltiu", 0, "A trap: the comparison is unsigned, but the immediate is still sign-extended."],
        ]},
      ]},
      { k: "play", title: "Where does a branch go?", b: [
        `<p>SignImm counts <b>instructions</b>, not bytes (that's the << 2), and it counts from PC + 4, the instruction after the branch.</p>`,
        bta,
        `<p>A jump instead keeps the top 4 bits of PC + 4 and replaces the rest with addr followed by 00. So j can reach anywhere in the current 256 MB block.</p>`,
      ]},
      { k: "why", title: "The SPIM footnote", b: [
        `<p>Footnote 1: SPIM, the simulator, has no branch delay slot and computes BTA = PC + (SignImm &lt;&lt; 2), not PC + 4 + …</p>`,
        { t: "mcq", q: "You assemble a program with SPIM and run the machine code on a real MIPS processor, which uses the table's BTA. What goes wrong, and what does the book say to do?", opts: [["Every branch lands one instruction too far; decrement each branch immediate by 1", true, "The real processor adds the extra 4 bytes, one instruction, that SPIM's immediate didn't expect."], ["Branches land one instruction short; add 1", false, "The real BTA includes an extra + 4, so it goes further, not shorter."], ["Nothing: both give the same BTA", false, "They differ by exactly PC + 4 vs PC."]] },
        `<p>The lesson beyond MIPS: a simulator is a model, and you must know where the model and the hardware differ.</p>`,
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Table B.1: the opcode map", mins: 15,
    blurb: "Every instruction by opcode, coloured by its top three bits. The patterns make the table easy to remember.",
    takeaway: "Table B.1 sorted by opcode: 0 R-type (Table B.2); 1 bltz/bgez (rt = 0/1); 2 j; 3 jal ($ra = PC + 4); 4 beq; 5 bne; 6 blez; 7 bgtz; 8 addi; 9 addiu; 10 slti; 11 sltiu; 12 andi; 13 ori; 14 xori; 15 lui ({imm, 16'b0}); 16 mfc0/mtc0 (rs = 0/4); 17 F-type (fop = 16/17) and bc1f/bc1t (fop = 8, rt = 0/1); 28 mul (32-bit result, funct 2); 32 lb; 33 lh; 35 lw; 36 lbu; 37 lhu (lb/lh sign-extend, lbu/lhu zero-extend); 40 sb; 41 sh; 43 sw; 49 lwc1; 57 swc1 (the table prints its decimal as 56, but 111001 is 57). Patterns in the top three bits: 000 R-type, jumps and branches; 001 ALU with immediate; 010 coprocessors; 100 loads; 101 stores (a store's opcode = its load's + 8); 110/111 floating-point load/store. Unsigned versions are one more (addiu = addi + 1, sltiu = slti + 1); byte/half/word and unsigned loads differ in the low bits.",
    steps: [
      { k: "play", title: "Table B.1", b: [
        `<p>Click any row to see its format with the opcode filled in.</p>`,
        opTable,
      ]},
      { k: "learn", title: "The patterns", b: [
        `<ul><li>Top three bits <b>000</b>: R-type, jumps and branches. <b>001</b>: ALU with an immediate. <b>100</b>: loads. <b>101</b>: stores.</li>
          <li>A store is its load + 8: lw 100011, sw 101011.</li>
          <li>The unsigned twin is + 1: addi 8 / addiu 9, slti 10 / sltiu 11.</li></ul>`,
        `<p>Designers chose these codes so the decoder hardware stays small: one bit can say “this is a store”.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "lw is 100011 and sw is 101011. Which opcode bit (bit 0 on the right) says “store”?", opts: [["Bit 3", true, "100011 and 101011 differ only in bit 3 (worth 8). The same holds for lb/sb and lh/sh."], ["Bit 5", false, "Both have a 1 there: it marks memory access."], ["Bit 0", false, "Both have a 1 there."]] },
        { t: "mcq", q: "lb is 100000 and lbu is 100100. What does the operation column say is different?", opts: [["lb sign-extends the byte; lbu zero-extends it", true, "[rt] = SignExt([Address]₇:₀) vs ZeroExt."], ["lbu loads 4 bytes", false, "Both load one byte."], ["lbu can't take an offset", false, "Both use imm(rs)."]] },
      ]},
      { k: "bug", title: "Check the table", b: [
        `<p>Table B.1 gives every opcode in binary and in decimal. The last row reads: <code>111001 (56) swc1 ft, imm(rs)</code>.</p>`,
        { t: "num", q: "What is 111001 in decimal?", a: 57, tol: 0, why: "32 + 16 + 8 + 1 = 57. The binary is right (MIPS's swc1 is 57, which also fits lwc1 49 + 8, the store-is-load-plus-8 pattern); the decimal 56 is a typo. When a table gives the same thing twice, check one against the other." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Tables B.2 and B.3: funct codes", mins: 15,
    blurb: "R-type and floating-point instructions all share one opcode; the funct field picks the operation.",
    takeaway: "Table B.2, R-type (opcode 0) by funct: 0 sll, 2 srl, 3 sra (shift by shamt); 4 sllv, 6 srlv, 7 srav (shift by [rs]4:0); 8 jr; 9 jalr ($ra = PC + 4, PC = [rs]); 12 syscall; 13 break; 16 mfhi, 17 mthi, 18 mflo, 19 mtlo; 24 mult, 25 multu ({[hi], [lo]} = [rs] × [rt]); 26 div, 27 divu ([lo] = quotient, [hi] = remainder); 32 add, 33 addu, 34 sub, 35 subu, 36 and, 37 or, 38 xor, 39 nor; 42 slt, 43 sltu. Patterns: groups of four share the upper funct bits; the unsigned twin sets bit 0. Table B.3, F-type (opcode 17, fop/cop = 16 single .s, 17 double .d): 0 add, 1 sub, 2 mul, 3 div, 5 abs, 7 neg, 58 c.seq, 60 c.lt, 62 c.le (the compares set fpcond, which bc1t/bc1f test).",
    steps: [
      { k: "play", title: "The funct tables", b: [
        functTable,
      ]},
      { k: "learn", title: "Patterns again", b: [
        `<ul><li>Shifts in 0000xx (by shamt) and 0001xx (by a register).</li>
          <li>hi/lo moves in 0100xx; multiply and divide in 0110xx.</li>
          <li>Arithmetic 1000xx, logic 1001xx, set-less-than 10101x.</li>
          <li>The unsigned twin is always the odd one: add 32 / addu 33, mult 24 / multu 25, slt 42 / sltu 43.</li></ul>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "After <code>mult $s0, $s1</code>, where is the 64-bit product, and how do you get its low half into $t0?", opts: [["In {hi, lo}; mflo $t0", true, "mult writes hi:lo; mflo copies lo into a general register."], ["In $s0; it's already there", false, "mult has no rd."], ["In lo only; mfhi $t0", false, "hi holds the upper 32 bits; mfhi reads hi."]] },
        { t: "mcq", q: "Which instruction's operation uses only the low five bits of a register, and why?", opts: [["sllv: [rt] << [rs]<sub>4:0</sub>, because shifting a 32-bit word needs a count of 0–31", true, "Five bits cover 0–31."], ["jr: PC = [rs]<sub>4:0</sub>", false, "jr uses all 32 bits."], ["div: [lo] = [rs]<sub>4:0</sub> / [rt]", false, "Divide uses whole registers."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a MIPS decoder know which operation an R-type instruction performs, and why might the designers have used one opcode with a funct field rather than separate opcodes?", model: "An opcode of 000000 says the instruction is R-type, and the decoder then reads the 6-bit funct field at the bottom to find the operation. R-type instructions don't need an immediate, so the space where an I-type keeps its immediate is free for rd, shamt and funct. Packing all of them under one opcode leaves the other 63 opcodes for I-type and J-type instructions, which have no room for a funct field." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "hhB", eyebrow: "Harris & Harris · Appendix B", title: "MIPS Instructions",
    intro: `<p>Three parts on the book's MIPS reference tables: the notation, the opcode map (Table B.1), and the funct codes for R-type and floating-point instructions (Tables B.2 and B.3).</p><p>This is a lookup appendix. The goal is to read it quickly and to spot the patterns that make it easy to remember. Arrow keys ← → move between steps.</p>`,
    after: `<p>This appendix has no exercises. Use it as your reference for the Chapter 6 and 7 exercises that ask you to encode or decode machine code: keep the tables open and do the bit work by hand.</p><p>Stuck on an encoding? Tell Claude which instruction and the fields you got. You'll get a guiding question first.</p>`,
    parts: [p1, p2, p3],
    summary: `
      <h3>Notation</h3>
      <p>SignImm = {{16{imm[15]}}, imm} (addi, slti, sltiu, offsets); ZeroImm = {16'b0, imm} (andi, ori, xori). BTA = PC + 4 + (SignImm &lt;&lt; 2); JTA = {(PC + 4)[31:28], addr, 2'b0}. SPIM: BTA = PC + (SignImm &lt;&lt; 2).</p>
      <h3>Opcodes</h3>
      <p>0 R-type; 2 j, 3 jal; 4 beq, 5 bne; 8–15 immediates (addi … lui); 17 F-type; 28 mul; 32–37 loads; 40–43 stores (load + 8); 49 lwc1, 57 swc1.</p>
      <h3>Funct</h3>
      <p>0/2/3 sll/srl/sra; 8 jr; 12 syscall; 16–19 hi/lo; 24–27 mult/div; 32–35 add/sub; 36–39 and/or/xor/nor; 42/43 slt/sltu. F-type: 0–3 add/sub/mul/div, 5 abs, 7 neg, 58/60/62 compares.</p>`,
  };
  Course.start(window.CHAPTER);
})();
