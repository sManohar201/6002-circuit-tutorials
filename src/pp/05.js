(function () {
  const { S, slider, toggle, readout, fmt, el } = Course;
  const { bitButtons } = Digital;
  const { sim, fieldsHTML, disasm, h4, bin, s16, sext } = LC3;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const seenHH = (html, href, where) => `<div class="key"><b>More in Harris & Harris:</b> ${html} <a href="../hh/${href}">${where} →</a></div>`;
  const pre = (t) => `<pre class="code">${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`;

  /* =============== PART 1 =============== */
  const OPS = [
    ["ADD", "0001 DR SR1 0 00 SR2  /  0001 DR SR1 1 imm5", 0x1283, "Operate", true],
    ["AND", "0101 DR SR1 0 00 SR2  /  0101 DR SR1 1 imm5", 0x5260, "Operate", true],
    ["NOT", "1001 DR SR 111111", 0x967f, "Operate", true],
    ["LEA", "1110 DR PCoffset9", 0xea02, "(computes an address)", false],
    ["LD", "0010 DR PCoffset9", 0x2405, "Data movement (PC-relative)", true],
    ["LDI", "1010 DR PCoffset9", 0xa605, "Data movement (indirect)", true],
    ["LDR", "0110 DR BaseR offset6", 0x6283, "Data movement (Base+offset)", true],
    ["ST", "0011 SR PCoffset9", 0x3405, "Data movement (PC-relative)", false],
    ["STI", "1011 SR PCoffset9", 0xb605, "Data movement (indirect)", false],
    ["STR", "0111 SR BaseR offset6", 0x7283, "Data movement (Base+offset)", false],
    ["BR", "0000 n z p PCoffset9", 0x0bfc, "Control", false],
    ["JMP", "1100 000 BaseR 000000", 0xc080, "Control", false],
    ["JSR / JSRR", "0100 1 PCoffset11  /  0100 0 00 BaseR 000000", 0x4810, "Control (Chapter 8)", false],
    ["TRAP", "1111 0000 trapvect8", 0xf025, "Control: OS service call", false],
    ["RTI", "1000 000000000000", 0x8000, "Control (Chapter 9)", false],
  ];
  const p1 = {
    id: "p1", title: "The ISA at a glance", mins: 20,
    blurb: "Memory, registers, 15 opcodes, data types, addressing modes, condition codes.",
    takeaway: "The ISA specifies everything a machine-language programmer (or compiler writer) must know: memory organization, register set, and instruction set (opcodes, data types, addressing modes). LC-3 memory: 2¹⁶ locations, 16-bit addressable; a 16-bit word, so word-addressable. Registers: eight general-purpose registers (GPRs) R0–R7, the register file, each one word, accessible in one clock. 15 opcodes in bits [15:12] (1101 reserved); ISAs range from a handful to x86's 200+ (special ones: multiply-add, MMX multimedia, VAX context switch). Three kinds: operate, data movement, control. Five addressing modes: immediate (literal), register, and three memory modes: PC-relative, indirect, Base+offset. Condition codes N, Z, P: single-bit registers set by every instruction that writes a GPR as an operate or load (ADD, AND, NOT, LD, LDI, LDR): exactly one is 1 (negative, zero, positive).",
    steps: [
      { k: "learn", title: "What the ISA specifies", b: [
        `<p>The ISA is the contract between software and hardware: everything a machine-language programmer, or a compiler writer, needs to know.</p>`,
        `<div class="tbl"><table><tbody>
          <tr><td><b>Memory</b></td><td>2<sup>16</sup> locations × 16 bits. One word per location: <b>word-addressable</b>.</td></tr>
          <tr><td><b>Registers</b></td><td>8 general-purpose registers, R0–R7, 16 bits each: the <b>register file</b>.</td></tr>
          <tr><td><b>Instructions</b></td><td>15 opcodes, their data types, and their addressing modes.</td></tr>
          <tr><td><b>Condition codes</b></td><td>N, Z, P: set when an operate or load instruction writes a register.</td></tr></tbody></table></div>`,
        seenPP("ISA vs microarchitecture.", "01-welcome-aboard.html", "Chapter 1"),
      ]},
      { k: "play", title: "All 15 instructions", b: [
        (host) => {
          const f = el(`<div></div>`), ro = el(`<div></div>`);
          let k = 0;
          const draw = () => { const [n, fmtS, w, kind, cc] = OPS[k]; f.innerHTML = fieldsHTML(w); ro.innerHTML = readout([["Format", fmtS], ["Example", disasm(w, 0x3000) + " (at x3000)"], ["Kind", kind], ["Sets N, Z, P?", cc ? "yes" : "no"]]); };
          const sel = el(`<select aria-label="Instruction"></select>`);
          OPS.forEach((o, i) => { const op = document.createElement("option"); op.value = i; op.textContent = o[0]; sel.append(op); });
          sel.addEventListener("change", () => { k = +sel.value; draw(); });
          host.append(sel, f, ro);
          draw();
        },
        `<p class="aside">Only six instructions set the condition codes: the three operates and the three loads, all of which write a value from the ALU or memory into a register. Opcode 1101 is reserved for the future.</p>`,
      ]},
      { k: "learn", title: "Five addressing modes", b: [
        `<p>An <b>addressing mode</b> says where an operand is. It can be in the instruction, a register, or memory:</p>`,
        `<ul><li><b>Immediate</b> (literal): the bits are in the instruction (ADD's imm5).</li><li><b>Register</b>: in R0–R7.</li><li><b>PC-relative</b>: memory at PC + offset (LD, ST).</li><li><b>Indirect</b>: memory at the address stored at PC + offset (LDI, STI).</li><li><b>Base+offset</b>: memory at register + offset (LDR, STR).</li></ul>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Does it set the condition codes?", bins: ["Sets N, Z, P", "Leaves them alone"], items: [["NOT R1, R2", 0, "Operate."], ["LDR R0, R6, #0", 0, "Load."], ["ST R2, X", 1, "Stores write memory, not a register."], ["LEA R0, MSG", 1, "3rd edition: computes an address only."], ["BRz LOOP", 1, "Branches read the codes."], ["LDI R3, P", 0, "Load."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What are the condition codes, and which instructions set them?", model: "N, Z and P are three one-bit registers recording whether the last value written to a general-purpose register by an operate or load instruction was negative, zero or positive; exactly one is set. ADD, AND, NOT, LD, LDI and LDR set them; stores, LEA and control instructions leave them unchanged. Conditional branches test them." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Data types: the opcode decides", mins: 15,
    blurb: "The same 16 bits are a number, two characters, or a bit vector. ADD always sees 2's complement.",
    takeaway: "A data type is a representation for which the ISA has opcodes. The same value can have many representations (3 as fingers, '3', 0000000000000011, 3.0 × 10⁰), and the same bits many meanings: 0011000100110000 is the 2's complement integer 12,592, the ASCII characters '1','0', or a bit vector. Each opcode interprets its operands according to the data type it supports: ADD treats them as 2's complement integers, so ADD R4, R3, #10 on ASCII '10' gives 12,602, not ASCII '20'.",
    steps: [
      { k: "play", title: "One pattern, many meanings", b: [
        (host) => {
          const ro = el(`<div></div>`);
          const b = bitButtons("0011000100110000", (x) => { const v = parseInt(x, 2), hi = v >> 8, lo = v & 255, ch = (c) => (c >= 32 && c < 127 ? `'${String.fromCharCode(c)}'` : `(code ${c})`); ro.innerHTML = readout([["2's complement integer", String(s16(v))], ["Unsigned integer", String(v)], ["Two ASCII characters", `${ch(hi)} ${ch(lo)}`], ["Bit vector: bits that are 1", x.split("").map((c, i) => (c === "1" ? "b" + (15 - i) : "")).filter(Boolean).join(", ") || "none"], ["After ADD #10 (the ALU's view)", String(s16(v + 10))]]); }, { label: "16 bits" });
          host.append(b.el, ro);
          b.set("0011000100110000");
        },
        `<p>The bits don't know what they mean. The <b>opcode</b> decides: ADD interprets them as 2's complement integers, even if you meant them as the characters “10”. Adding 10 gives 12,602, not the characters “20”.</p>`,
        seenPP("2's complement, ASCII and bit vectors.", "02-bits-data-types.html", "Chapter 2"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "R3 holds x0037 (the ASCII code for '7'). After ADD R3, R3, #1, R3 holds…", opts: [["x0038, which happens to be ASCII '8'", true, "ADD just adds the integers; digits 0–8 happen to work."], ["'71'", false, "ADD has no idea it's a character."], ["An error", false, "ADD never checks."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "If the bits in a register were written as ASCII text, what does an ADD instruction do with them?", model: "It treats them as a two's complement integer and adds, exactly as it would any number. The hardware has no record of what the programmer intended; each opcode interprets its operands according to its own data type." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const REGS_INIT = (m) => { [1, 3, 5, 7, -2, -4, -6, -8].forEach((v, i) => { m.R[i] = v & 0xffff; }); };
  const p3 = {
    id: "p3", title: "Operate instructions", mins: 25,
    blurb: "NOT, ADD, AND. Immediates, clearing, incrementing, and subtracting with no subtract instruction.",
    takeaway: "Operate instructions process data: ADD, AND (binary) and NOT (unary). NOT (1001): DR [11:9] ← bitwise complement of SR [8:6]; bits [5:0] all 1s; only the ALU's A input is used. ADD/AND: DR, SR1 in register mode; second source is register SR2 (bit 5 = 0, bits [4:3] = 0) or imm5 sign-extended (bit 5 = 1); results set N, Z, P. A register may be both source and destination. Idioms: AND R2, R2, #0 clears R2; ADD R6, R6, #1 increments R6. With no subtract instruction, A − B = A + (NOT B + 1): NOT, ADD #1, ADD (the book's Example 5.3, which has an unpleasant side effect worth spotting). In the data path, bit 5 of the IR selects the SR2MUX input to the ALU's B side.",
    steps: [
      { k: "learn", title: "NOT, ADD, AND", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>NOT</b> DR, SR</td><td>1001 DR SR 111111</td><td>bitwise complement (one source)</td></tr>
          <tr><td><b>ADD</b> DR, SR1, SR2/#imm5</td><td>0001 …</td><td>2's complement add</td></tr>
          <tr><td><b>AND</b> DR, SR1, SR2/#imm5</td><td>0101 …</td><td>bitwise AND</td></tr></tbody></table></div>`,
        `<p>All three write DR and set N, Z, P. In the data path, IR bit 5 is the select line of the mux feeding the ALU's second input: register SR2, or the sign-extended immediate.</p>`,
      ]},
      { k: "play", title: "Run some operates", b: [
        (host) => sim(host, { src: `        .ORIG x3000
        ADD  R2, R0, R1   ; 1 + 3
        NOT  R3, R5       ; complement of -4
        AND  R4, R4, #0   ; clear R4
        ADD  R6, R6, #1   ; increment R6
        ADD  R1, R4, #-2  ; R1 <- 0 + (-2)
        HALT
        .END`, init: REGS_INIT, io: false, listHeight: 240 }),
        `<p class="aside">Registers start as in the book's Figure 5.1: R0…R7 = 1, 3, 5, 7, −2, −4, −6, −8. Predict each result before you press Step.</p>`,
      ]},
      { k: "learn", title: "Subtracting without SUB", b: [
        `<p>−B = NOT B + 1 (2's complement). So with A in R0 and B in R1:</p>`,
        pre(`NOT R1, R1       ; R1 <- NOT B
ADD R2, R1, #1   ; R2 <- -B
ADD R2, R0, R2   ; R2 <- A + (-B)`),
        `<p class="aside">The book asks what unpleasant side effect this sequence has, and how to avoid it. Look carefully at what happens to R1.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "0001 110 110 1 00001 does what?", opts: [["R6 ← R6 + 1 (increment)", true, "Same register as source and destination."], ["R6 ← 1", false, "That would need SR1 cleared first."], ["R1 ← R6 + R6", false, "Bit 5 = 1: immediate."]] },
        { t: "num", q: "R4 = 6, R5 = −18. After ADD R1, R4, R5, what's in R1?", a: -12, tol: 0.01 },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you compute A − B on a machine with only ADD, AND and NOT?", model: "Form the negative of B in two's complement by complementing it with NOT and adding 1, then add that to A. That takes three instructions: NOT, ADD with immediate 1, and ADD of the two registers." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "LEA: compute an address", mins: 15,
    blurb: "Like LD's address calculation, but it keeps the address instead of reading memory.",
    takeaway: "LEA (1110): DR ← incremented PC + SEXT(PCoffset9). It doesn't access memory and (3rd edition) doesn't set condition codes; a better name would be CEA, compute effective address. Useful to put into a register the address of something near the instruction (a string, an array) before using it with Base+offset or a TRAP. Example: LEA R5, #−3 at x4018 gives R5 = x4016 (x4019 − 3).",
    steps: [
      { k: "learn", title: "Address, not data", b: [
        `<div class="eq">LEA DR, PCoffset9:   DR ← PC<sub>incremented</sub> + SEXT(PCoffset9)</div>`,
        `<p>Same address calculation as LD, but <b>no memory read</b>: the address itself goes into DR. And in the 3rd edition, LEA doesn't touch N, Z, P (an address being “negative” means nothing).</p>`,
        `<p>Typical use: point a register at a nearby table or string, then walk through it with LDR, or hand it to the PUTS service.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "LEA R5, #−3 is at x4018. R5 becomes…", opts: [["x4016", true, "x4019 − 3."], ["x4015", false, "Offsets count from the incremented PC."], ["The value stored at x4016", false, "That would be LD."]] },
        { t: "mcq", q: "Right after LEA R0, MSG, you write BRz SKIP. What does the branch test?", opts: [["The condition codes from whatever instruction last wrote a register before the LEA", true, "LEA doesn't set them (3rd edition)."], ["Whether MSG's address is zero", false, "LEA leaves N, Z, P alone."], ["Whether MSG's contents are zero", false, "LEA doesn't read memory."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between LD R0, X and LEA R0, X?", model: "Both compute the address of X as the incremented PC plus the offset. LD then reads memory at that address and puts the contents of X into R0, setting the condition codes. LEA puts the address of X itself into R0, without reading memory or changing the condition codes." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const FIG510 = `        .ORIG x30F6
        LEA  R1, #-3      ; x30F6
        ADD  R2, R1, #14  ; x30F7
        ST   R2, #-5      ; x30F8
        AND  R2, R2, #0   ; x30F9
        ADD  R2, R2, #5   ; x30FA
        STR  R2, R1, #14  ; x30FB
        LDI  R3, #-9      ; x30FC
        HALT
        .END`;
  const p5 = {
    id: "p5", title: "Loads and stores: three memory modes", mins: 35,
    blurb: "PC-relative, indirect, Base+offset. Where each can reach, and the book's tour through all three.",
    takeaway: "Data movement instructions move information between registers and memory (or I/O): a load copies memory into a register (LD, LDI, LDR; they set N, Z, P), a store copies a register into memory (ST, STI, STR). The source is unchanged; the destination is overwritten. Bits [11:9] name DR or SR; bits [8:0] are address-generation bits interpreted by the opcode's mode. PC-relative (LD 0010, ST 0011): address = incremented PC + SEXT(PCoffset9): only within −256..+255 of the instruction. Indirect (LDI 1010, STI 1011): PC + offset gives the address of the address: two memory reads; reaches anywhere. Base+offset (LDR 0110, STR 0111): address = BaseR [8:6] + SEXT(offset6 [5:0]): anywhere, and ideal for walking through arrays. Book examples: LD at x4018 with x1AF → x3FC8; LDI at x4A1B with x1CC → pointer at x49E8 → x2110; LDR with R2 = x2345 and x1D → x2362.",
    steps: [
      { k: "learn", title: "Three ways to find memory", b: [
        `<div class="tbl"><table><thead><tr><th>Mode</th><th>Load / store</th><th>Address</th><th>Reach</th></tr></thead><tbody>
          <tr><td>PC-relative</td><td>LD / ST</td><td>PC<sub>inc</sub> + SEXT(off9)</td><td>±256 of the instruction</td></tr>
          <tr><td>Indirect</td><td>LDI / STI</td><td>M[PC<sub>inc</sub> + SEXT(off9)]</td><td>anywhere (2 memory reads)</td></tr>
          <tr><td>Base+offset</td><td>LDR / STR</td><td>BaseR + SEXT(off6)</td><td>anywhere</td></tr></tbody></table></div>`,
        `<p>Loads set N, Z, P; stores don't. A load or store overwrites its destination and leaves its source alone.</p>`,
      ]},
      { k: "play", title: "Compute the address", b: [
        (host, id) => {
          const ro = el(`<div></div>`);
          let mode = 0, pc = 0x4018, off = -81, base = 0x2345, ptr = 0x2110;
          function draw() {
            const pci = pc + 1;
            let rows;
            if (mode === 0) rows = [["Incremented PC", h4(pci)], ["+ offset", String(off)], ["Operand address", h4(pci + off)], ["Memory reads", "1"]];
            else if (mode === 1) rows = [["PC + offset", h4(pci + off) + " (holds a pointer)"], ["Pointer found there", h4(ptr)], ["Operand address", h4(ptr)], ["Memory reads", "2"]];
            else { const o6 = Math.max(-32, Math.min(31, off)); rows = [["Base register", h4(base)], ["+ offset6", String(o6)], ["Operand address", h4(base + o6)], ["Memory reads", "1"]]; }
            ro.innerHTML = readout(rows);
          }
          host.append(toggle(["PC-relative (LD)", "Indirect (LDI)", "Base+offset (LDR)"], (i) => { mode = i; draw(); }),
            slider({ id: id + "-o", label: "Offset in the instruction (LDR clips to −32…31)", min: -256, max: 255, step: 1, value: off, show: (x) => String(x) }, (x) => { off = x; draw(); }).el,
            slider({ id: id + "-p", label: "Address of the instruction", min: 0x3000, max: 0x4fff, step: 1, value: pc, show: (x) => h4(x) }, (x) => { pc = x; draw(); }).el,
            slider({ id: id + "-b", label: "Base register (LDR)", min: 0, max: 0xffff, step: 1, value: base, show: (x) => h4(x) }, (x) => { base = x; draw(); }).el, ro);
          draw();
        },
      ]},
      { k: "play", title: "The book's tour of all three modes", b: [
        (host) => sim(host, { src: FIG510, io: false, watch: [["", 0x30f4], ["", 0x3102]], listHeight: 300 }),
        `<p class="aside">The seven instructions of Figure 5.10, written in assembly. Step through: LEA points R1 at x30F4; ST (PC-relative) stores x3102 there; STR (Base+offset) stores 5 at x3102; LDI (indirect) follows the pointer in x30F4 to fetch that 5. (HALT added at the end.)</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "LDI R3, #−20 at x5000; M[x4FED] = x8000; M[x8000] = 7. R3 gets…", opts: [["7", true, "x5001 − 20 = x4FED holds the pointer x8000; M[x8000] = 7."], ["x8000", false, "That's the pointer; LDI follows it."], ["Whatever is at x4FED + 1", false, "No."]] },
        { t: "mcq", q: "You need to load 10 consecutive array elements in a loop. Best mode?", opts: [["Base+offset (LDR), incrementing the base register", true, "That's what it's for."], ["PC-relative: one LD per element", false, "Each LD has a fixed offset; a loop can't vary it."], ["Indirect", false, "Possible but clumsy."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the LC-3 need indirect and Base+offset modes when it already has PC-relative?", model: "PC-relative addressing only reaches about 256 locations either side of the instruction, because the offset has nine bits. Indirect addressing stores a full 16-bit address in a nearby location, and Base+offset uses a full 16-bit register, so both can reach any location in memory; Base+offset also lets a loop step through an array by changing the register." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Control: BR, JMP, TRAP", mins: 20,
    blurb: "The branch logic is three ANDs and an OR. JMP goes anywhere. TRAP asks the OS.",
    takeaway: "Five control opcodes: BR (conditional branch), JMP, JSR/JSRR (subroutines, Chapter 8), TRAP, RTI (Chapter 9). Only BR decides each time. During EXECUTE it examines each condition code whose bit [11], [10], [9] is 1: three AND gates (n·N, z·Z, p·P) into an OR; if 1, PC ← PC + SEXT(PCoffset9) (computed in a separate adder, not the ALU, and selected through PCMUX); else the incremented PC stands. nzp = 111 is unconditional (one code is always set). Example: BRz at x4027 with offset x0D9 and last result 0 → PC = x4101. BR reaches only −255..+256; JMP (1100) loads the PC with a register (BaseR [8:6]): anywhere. TRAP (1111, trapvect8 in [7:0]) invokes an OS service call and returns to the next instruction: x23 input a character, x21 output a character, x25 halt (others in Table A.2: x20 GETC, x22 PUTS, x24 PUTSP).",
    steps: [
      { k: "learn", title: "How BR decides", b: [
        (host) => host.append(el(`<div class="fig">${S.svg(420, 150, (() => {
          let s = "";
          [["n", "N", 30], ["z", "Z", 75], ["p", "P", 120]].forEach(([a, b, y]) => { s += S.t(20, y - 6, `IR bit ${a}`, { a: "start", cls: "s" }) + S.t(20, y + 12, `CC ${b}`, { a: "start", cls: "s" }) + `<line x1="90" y1="${y - 10}" x2="150" y2="${y - 4}" style="stroke:var(--ink)"/><line x1="90" y1="${y + 8}" x2="150" y2="${y + 4}" style="stroke:var(--ink)"/>` + `<path d="M150 ${y - 12} h18 a12 12 0 0 1 0 24 h-18 z" style="fill:var(--card);stroke:var(--ink)"/><line x1="180" y1="${y}" x2="230" y2="75" style="stroke:var(--ink)"/>`; });
          s += `<path d="M230 55 q30 0 50 20 q-20 20 -50 20 q12 -20 0 -40 z" style="fill:var(--card);stroke:var(--ink)"/><line x1="280" y1="75" x2="300" y2="75" style="stroke:var(--ink)"/>` + S.t(306, 72, "load PC with", { a: "start", cls: "s" }) + S.t(306, 88, "PC + offset", { a: "start", cls: "s" });
          return s;
        })(), { max: 420, label: "Branch condition logic: three AND gates into an OR" })}</div>`)),
        `<p>Each condition-code bit in the instruction is ANDed with the matching code; any 1 means “taken”. The target is computed by a separate adder (not the ALU) and steered into the PC through the PCMUX.</p>`,
        `<p class="aside">The book asks what happens if all three of bits [11:9] are 0. Work it out from this circuit.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "BRz at x4027 with PCoffset9 = x0D9 (217). The last value written was 0. Next PC?", opts: [["x4101", true, "x4028 + x00D9 = x4101."], ["x4028", false, "Z is set, so it's taken."], ["x4100", false, "Start from the incremented PC."]] },
      ]},
      { k: "learn", title: "JMP and TRAP", b: [
        `<p><b>JMP BaseR</b> (1100 000 BaseR 000000): PC ← the register. A register holds 16 bits, so JMP can go <b>anywhere</b>, unlike BR's ±256.</p>`,
        `<p><b>TRAP vector</b> (1111 0000 trapvect8): asks the operating system to do something, then continues with the next instruction. For now:</p>`,
        `<div class="tbl"><table><tbody><tr><td>x23 (IN)</td><td>prompt and read one character into R0</td></tr><tr><td>x21 (OUT)</td><td>print the character in R0</td></tr><tr><td>x25 (HALT)</td><td>stop</td></tr><tr><td>x20 (GETC), x22 (PUTS)</td><td>read a key silently; print a string (Chapter 9)</td></tr></tbody></table></div>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the LC-3 need JMP if it already has an unconditional branch?", model: "A branch's target is the PC plus a nine-bit offset, so it can only reach instructions within about 256 locations. JMP loads the PC from a 16-bit register, so it can transfer control to any address in memory." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const SUM12 = `        .ORIG x3000
        LEA  R1, #255     ; R1 <- x3100 (x3001 + 255)
        AND  R3, R3, #0   ; sum <- 0
        AND  R2, R2, #0
        ADD  R2, R2, #12  ; count <- 12
TEST    BRz  DONE         ; count reached 0?
        LDR  R4, R1, #0   ; next number
        ADD  R3, R3, R4   ; add it
        ADD  R1, R1, #1   ; advance pointer
        ADD  R2, R2, #-1  ; one fewer left (sets CC)
        BRnzp TEST
DONE    HALT
        .END`;
  const SENT = `        .ORIG x3000
        LEA  R1, #255     ; R1 <- x3100
        AND  R3, R3, #0   ; sum <- 0
        LDR  R4, R1, #0   ; first value
TEST    BRn  DONE         ; negative = sentinel
        ADD  R3, R3, R4
        ADD  R1, R1, #1
        LDR  R4, R1, #0   ; next value (sets CC)
        BRnzp TEST
DONE    HALT
        .END`;
  const DATA = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8];
  const p7 = {
    id: "p7", title: "Loops: counter or sentinel", mins: 30,
    blurb: "Add 12 numbers two ways. Watch which instruction sets the codes that the branch tests.",
    takeaway: "A loop body executes repeatedly; each pass is an iteration. Two ways to control the count: a counter (initialize to N, decrement each time, exit when zero: Figure 5.13 adds the 12 integers at x3100–x310B: LEA R1 ← x3100, clear R3, R2 ← 12, BRz exit at the top, LDR R4, add, increment R1, decrement R2, BRnzp back to the test) and a sentinel (a value that can't occur in the data, e.g. −1 after positive numbers; loop until it's loaded: Figure 5.15). Key subtlety: the branch at the top tests the condition codes set by the last register-writing instruction, which may be earlier than the instruction just before it (BRnzp doesn't change them). Moving the test to the bottom (BRnp) saves an instruction but breaks structured programming (Chapter 6): don't. Without control instructions, 12 additions would need 35 instructions; 100 would need 299.",
    steps: [
      { k: "learn", title: "Two ways to stop", b: [
        `<div class="two"><div class="tile"><h3>Counter</h3><p>You know how many: start a register at N, decrement each pass, stop at 0.</p></div><div class="tile"><h3>Sentinel</h3><p>You don't know how many: end the data with a value that can't be real data (e.g. −1 after positive numbers), stop when you load it.</p></div></div>`,
      ]},
      { k: "play", title: "Counter loop (Figure 5.13)", b: [
        (host) => sim(host, { src: SUM12, io: false, init: (m) => DATA.forEach((v, i) => { m.mem[0x3100 + i] = v; }), maxSteps: 2000 }),
        `<p class="aside">The 12 numbers at x3100 are 3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8. Step a few iterations, then Run.</p>`,
      ]},
      { k: "predict", title: "Which instruction set the codes?", b: [
        { t: "mcq", q: "The BRz at the top of the loop runs right after BRnzp. Whose result does it test?", opts: [["ADD R2, R2, #-1: BRnzp doesn't change the codes", true, "The last register-writing instruction wins."], ["BRnzp's", false, "Branches never set condition codes."], ["LDR R4's", false, "ADD R2 came after it."]] },
      ]},
      { k: "play", title: "Sentinel loop (Figure 5.15)", b: [
        (host) => sim(host, { src: SENT, io: false, init: (m) => { DATA.forEach((v, i) => { m.mem[0x3100 + i] = v; }); m.mem[0x310c] = 0xffff; }, maxSteps: 2000 }),
        `<p class="aside">Same numbers, followed by −1 at x310C. Here the codes for BRn come from LDR. Same sum, R3 = 52.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "In the counter version, how many instructions run in total (including HALT)?", a: 78, tol: 0.01, hint: "4 setup + 12 × (BRz, LDR, ADD, ADD, ADD, BRnzp) + final BRz + HALT.", why: "4 + 72 + 1 + 1 = 78. Check with Run." },
        { t: "mcq", q: "The data might include negative numbers. Which loop breaks?", opts: [["The sentinel loop: it would stop at the first negative value", true, "A sentinel must be a value that can't occur."], ["The counter loop", false, "It doesn't look at values."], ["Both", false, ""]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "When would you choose a sentinel over a counter?", model: "When you don't know in advance how many items there are, for example text typed by a user or a list of unknown length. You mark the end with a special value that can never be valid data, and the loop runs until it reads that value." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const COUNT = `        .ORIG x3000
        AND  R2, R2, #0   ; count <- 0
        LD   R3, PTR      ; R3 <- address of the file
        IN                ; R0 <- character to look for (TRAP x23)
        LDR  R1, R3, #0   ; R1 <- first character of file
TEST    ADD  R4, R1, #-4  ; EOT (x04) ends the file
        BRz  OUTPUT
        NOT  R1, R1       ; R1 <- -R1 ...
        ADD  R1, R1, #1
        ADD  R1, R1, R0   ; ... + R0: zero means a match
        BRnp GETCHAR
        ADD  R2, R2, #1   ; match: count it
GETCHAR ADD  R3, R3, #1   ; next character
        LDR  R1, R3, #0
        BRnzp TEST
OUTPUT  LD   R0, ASCII    ; '0'
        ADD  R0, R0, R2   ; turn the count into a digit
        OUT               ; TRAP x21
        HALT              ; TRAP x25
PTR     .FILL x4000
ASCII   .FILL x0030
        .END`;
  const p8 = {
    id: "p8", title: "A real program: count a character", mins: 35,
    blurb: "Read a key, scan a file to its EOT sentinel, print how many times the key appears.",
    takeaway: "Section 5.5's program: read a character from the keyboard (TRAP x23), count its occurrences in a file that ends with EOT (ASCII x04) as a sentinel, and display the count (assumed ≤ 9) with TRAP x21, then halt (x25). Registers: R2 count (cleared), R3 pointer to the file (loaded from a memory word, so the file can be anywhere, e.g. x9000), R0 the target character, R1 each file character. Each iteration: R1 − 4 = 0? exit; compute R0 − R1 via NOT/ADD #1/ADD; zero → increment count; advance pointer, load next, branch back. Output: '0' (x30) + count gives the digit's ASCII code (decimal digits are x30–x39). Flowcharts annotate each step with its LC-3 implementation. The book asks how to make it run fewer instructions: look at what's recomputed every iteration.",
    steps: [
      { k: "learn", title: "The plan", b: [
        `<ol><li>Count ← 0; pointer ← start of file; R0 ← a typed character.</li><li>Get a character from the file. If it's EOT (x04), go to 4.</li><li>If it equals R0, count + 1. Advance the pointer, get the next character, back to 2.</li><li>Print '0' + count. Halt.</li></ol>`,
        `<p>Equality test without a compare instruction: compute R0 − R1; it's zero exactly when they match.</p>`,
        `<p class="aside">'0' is x30, and the digits follow in order, so x30 + 3 = x33 = '3'. That's why the count must stay below 10 here; Chapter 10 does real conversions.</p>`,
      ]},
      { k: "play", title: "Run it", b: [
        (host) => sim(host, { src: COUNT, input: "a", init: (m) => { const s = "banana bread"; for (let i = 0; i < s.length; i++) m.mem[0x4000 + i] = s.charCodeAt(i); m.mem[0x4000 + s.length] = 4; }, maxSteps: 5000, listHeight: 300 }),
        `<p class="aside">The file at x4000 is “banana bread” then EOT. The keyboard box holds the character IN will read. Try other letters, then Reset and Run.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "With the file “banana bread” and input 'b', what digit does it print?", a: 2, tol: 0.01 },
        { t: "mcq", q: "Why does the program keep the file's address in a memory word (PTR) instead of using LEA?", opts: [["So the file can be anywhere in memory, far beyond LEA's ±256 reach", true, "LD of a full 16-bit address."], ["LEA can't load addresses", false, "It can, but only nearby ones."], ["To set the condition codes", false, ""]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the program test whether two characters are equal?", model: "It negates one character in two's complement, with NOT and then adding 1, and adds the other. The result is zero exactly when the two codes are equal, so the condition codes after that ADD tell a branch whether there was a match." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const LDRWALK = [
    ["FETCH 1", "GatePC, LD.MAR; PCMUX = PC+1, LD.PC", "MAR ← x3456, PC ← x3457"],
    ["FETCH 2", "MEM.EN, R.W = read, LD.MDR", "MDR ← 0110 011 010 000100"],
    ["FETCH 3", "GateMDR, LD.IR", "IR ← MDR"],
    ["DECODE", "FSM branches on IR[15:12] = 0110", "it's LDR"],
    ["EVALUATE ADDRESS", "ADDR1MUX = SR1 (R2), ADDR2MUX = SEXT[5:0], GateMARMUX, LD.MAR", "MAR ← R2 + 4"],
    ["FETCH OPERAND", "MEM.EN, read, LD.MDR", "MDR ← M[MAR]"],
    ["EXECUTE", "(none for LDR)", ""],
    ["STORE RESULT", "GateMDR, DR = R3, LD.REG, LD.CC", "R3 ← MDR; set N, Z, P"],
  ];
  const p9 = {
    id: "p9", title: "The data path, revisited", mins: 25,
    blurb: "One global bus, tri-state drivers, MARMUX, PCMUX, and an LDR walked through clock by clock.",
    takeaway: "The LC-3 data path: filled arrowheads carry data, open ones control signals from the FSM. The global bus is 16 wires; exactly one supplier drives it at a time, chosen by tri-state devices (GatePC, GateMDR, GateALU, GateMARMUX); a destination captures it by asserting its load enable (LD.MAR, LD.IR, LD.REG…). Memory through MAR/MDR (read, or write with WE). ALU: source 1 from SR1, source 2 from SR2 or the sign-extended immediate (mux selected by IR[5]); its output can go to the bus and on to DR; the bus value also feeds N, Z, P logic (LD.CC). PC via the 3-input PCMUX: PC + 1 (fetch), branch adder output (PC + offset, a separate adder), or the bus. MARMUX: address adder (ADDR1MUX: PC or base register; ADDR2MUX: zero or SEXT of [5:0], [8:0] or [10:0]) or the zero-extended trap vector. LDR R3, R2, #4 at x3456: fetch (3 cycles), decode, evaluate address (R2 + 4 → MAR), operand fetch (MDR ← memory), no execute, store result (R3 ← MDR, set CC).",
    steps: [
      { k: "learn", title: "The pieces", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>Global bus</b></td><td>16 wires. Exactly one source drives it per cycle, through a <b>tri-state</b> gate (GatePC, GateMDR, GateALU, GateMARMUX). A destination grabs it with its load enable (LD.MAR, LD.IR…).</td></tr>
          <tr><td><b>Memory</b></td><td>via MAR and MDR; read, or write with WE.</td></tr>
          <tr><td><b>ALU + register file</b></td><td>source 1 = SR1; source 2 = SR2 or SEXT(imm5), chosen by IR[5]. Results go to the bus, to DR, and to the N/Z/P logic.</td></tr>
          <tr><td><b>PCMUX</b></td><td>PC + 1, or the branch adder's PC + offset, or the bus.</td></tr>
          <tr><td><b>MARMUX</b></td><td>the address adder (PC or BaseR, plus 0 or a sign-extended offset), or a trap vector.</td></tr></tbody></table></div>`,
        seenPP("The data path first appeared at the end of Chapter 3.", "03-digital-logic-structures.html#p11", "Chapter 3"),
      ]},
      { k: "play", title: "LDR R3, R2, #4, clock by clock", b: [
        (host) => {
          const ro = el(`<div></div>`);
          let k = 0;
          const draw = () => { ro.innerHTML = readout([[`${k + 1}/${LDRWALK.length}: ${LDRWALK[k][0]}`, LDRWALK[k][2] || "nothing to do"], ["Control signals asserted", LDRWALK[k][1]]]); };
          const nx = btn("Next cycle →", "primary"), bk = btn("← Back");
          nx.addEventListener("click", () => { k = Math.min(LDRWALK.length - 1, k + 1); draw(); });
          bk.addEventListener("click", () => { k = Math.max(0, k - 1); draw(); });
          const row = el(`<div class="row"></div>`); row.append(bk, nx);
          host.append(row, ro);
          draw();
        },
        `<p class="aside">The instruction is at x3456. One row per state of the control FSM (assuming memory answers in one cycle). LDR has no EXECUTE phase.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why can't GatePC and GateALU both be asserted in the same cycle?", opts: [["Two sources would drive the bus at once: only one tri-state driver may be enabled", true, "The bus carries one value per cycle."], ["The PC and ALU are on different buses", false, "There's one global bus."], ["It would slow the clock", false, "It would produce garbage, or worse."]] },
        { t: "mcq", q: "During a taken BR, where is PC + offset computed?", opts: [["In the separate address adder, then through PCMUX into the PC", true, "The ALU isn't used."], ["In the ALU", false, "The ALU handles ADD/AND/NOT."], ["In the MAR", false, "MAR is a register."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a value get from the MDR into a register over the bus?", model: "The control FSM asserts GateMDR, enabling the MDR's tri-state driver so the MDR's value is on the global bus, and asserts LD.REG with DR selecting the destination register, so that register loads the bus value at the end of the clock cycle. For loads it also asserts LD.CC so the condition codes are set from that value." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp5", eyebrow: "Patt & Patel · Chapter 5", title: "The LC-3",
    intro: `<p>Nine parts: the ISA overview, data types, operate instructions, LEA, the three memory addressing modes, control instructions, loops, a complete character-counting program, and the data path.</p><p>Every program here runs in the built-in simulator. Predict each register before you press Step. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book <b>by hand</b> first: trace registers on paper. Only then, if you like, type a program into a simulator to check.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9],
    summary: `
      <h3>ISA</h3>
      <p>2<sup>16</sup> × 16-bit memory; R0–R7; 15 opcodes; modes: immediate, register, PC-relative, indirect, Base+offset. N, Z, P set by ADD, AND, NOT, LD, LDI, LDR.</p>
      <h3>Operate</h3>
      <p>NOT 1001 DR SR; ADD 0001 / AND 0101 with SR2 or imm5 (bit 5). Clear: AND #0. Increment: ADD #1. A − B: NOT, ADD #1, ADD.</p>
      <h3>Data movement</h3>
      <p>LEA 1110: DR ← PC + off9 (no memory, no CC). LD/ST: PC + off9. LDI/STI: M[PC + off9] is the address. LDR/STR: BaseR + off6.</p>
      <h3>Control</h3>
      <p>BR 0000 nzp off9 (three ANDs into an OR); 111 = always. JMP 1100 BaseR: anywhere. TRAP 1111 vect8: x23 IN, x21 OUT, x25 HALT.</p>
      <h3>Programming</h3>
      <p>Loops by counter or sentinel; the branch tests the last register-writing instruction. Data path: one bus, tri-state gates, load enables, PCMUX, MARMUX.</p>`,
  };
  Course.start(window.CHAPTER);
})();
