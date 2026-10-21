(function () {
  const { S, slider, toggle, el } = Course;
  const { sim, h4, bin, sext, disasm, fieldsHTML } = LC3;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const pre = (t) => `<pre class="code">${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`;
  const field = 'font:inherit;font-family:var(--mono);padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--paper);color:var(--ink)';

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "The machine at a glance", mins: 15,
    blurb: "Everything a programmer can see: memory, registers, condition codes, the PSR, two stacks, and which instructions change what.",
    takeaway: "LC-3 ISA overview (A.1): 16-bit address space, 2^16 locations of one 16-bit word each (x0000–xFFFF), used for memory and memory-mapped device registers. x0000–x2FFF privileged (system space: Trap Vector Table x0000–x00FF, Interrupt Vector Table x0100–x01FF, OS, supervisor stack); x3000–xFDFF user space (user stack); xFE00–xFFFF device and processor registers, also privileged (Table A.1: KBSR xFE00, KBDR xFE02, DSR xFE04, DDR xFE06, PSR xFFFC, MCR xFFFE whose bit 15 is the clock enable). Bits numbered right to left from 0. Instructions are 16 bits: opcode [15:12], the rest [11:0]; opcode 1101 is unspecified (illegal opcode exception). PC: address of the next instruction. Eight general-purpose registers R0–R7. Condition codes N, Z, P are set only by instructions that load a result into a general-purpose register: LD, LDI, LDR, ADD, AND, NOT; every other instruction leaves them alone (in this 3rd-edition ISA, that includes LEA). Eight priority levels PL0–PL7 in PSR[10:8]; PSR[15] privilege (0 = Supervisor); PSR[2:0] = N, Z, P. Exceptions: privilege mode (RTI in User mode), illegal opcode, ACV (User mode touching privileged memory). Supervisor stack via SSP, user stack via USP; R6 is whichever is active, the other is kept in Saved SSP or Saved USP.",
    steps: [
      { k: "learn", title: "The programmer's view", b: [
        `<div class="tbl"><table><tbody>
          <tr><td>Memory</td><td>2<sup>16</sup> words of 16 bits, x0000–xFFFF</td></tr>
          <tr><td>Registers</td><td>R0–R7, PC, and the PSR (privilege, priority, N Z P)</td></tr>
          <tr><td>Instructions</td><td>16 bits: opcode [15:12] + 12 more bits. 15 opcodes; 1101 is reserved.</td></tr>
          <tr><td>Stacks</td><td>Supervisor (SSP) and user (USP); R6 points to the active one</td></tr></tbody></table></div>`,
        seenPP("The memory map, device registers and the PSR.", "09-io.html", "Chapter 9"),
      ]},
      { k: "check", title: "Who sets the condition codes?", b: [
        { t: "sort", q: "Does this instruction set N, Z, P?", bins: ["Sets CC", "Leaves CC alone"], items: [
          ["ADD R1,R1,#-1", 0, "Operate instruction writing a register."],
          ["LDR R0,R6,#0", 0, "Loads write a register and set CC."],
          ["LEA R0,MSG", 1, "In this edition LEA computes an address and leaves CC alone."],
          ["ST R2,SAVE", 1, "Stores don't write a register."],
          ["NOT R3,R3", 0, "Operate instruction."],
          ["JSR SUB", 1, "Writes R7, but it's a control instruction: CC unchanged."],
        ]},
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A User-mode program executes LD R0, X where X is at x2FF0. What happens?", opts: [["An ACV exception", true, "x2FF0 is in system space, which is privileged."], ["R0 gets the value; loads are always allowed", false, "Privileged memory needs Supervisor mode."], ["An illegal opcode exception", false, "LD's opcode is fine; the address is the problem."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Which LC-3 instructions set the condition codes, and what rule explains the list?", model: "LD, LDI, LDR, ADD, AND and NOT. The rule is that the condition codes are set by instructions that load a result into one of the general-purpose registers, based on that result as a 2's complement number. Stores, branches, jumps, TRAP, RTI and LEA leave them unchanged." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const RTL = {
    0: () => "if ((n AND N) OR (z AND Z) OR (p AND P)) PC = PC† + SEXT(PCoffset9);",
    1: (w) => (w & 32 ? "DR = SR1 + SEXT(imm5); setcc();" : "DR = SR1 + SR2; setcc();"),
    2: () => "DR = mem[PC† + SEXT(PCoffset9)]; setcc();",
    3: () => "mem[PC† + SEXT(PCoffset9)] = SR;",
    4: (w) => (w & 0x800 ? "TEMP = PC†; PC = PC† + SEXT(PCoffset11); R7 = TEMP;" : "TEMP = PC†; PC = BaseR; R7 = TEMP;"),
    5: (w) => (w & 32 ? "DR = SR1 AND SEXT(imm5); setcc();" : "DR = SR1 AND SR2; setcc();"),
    6: () => "DR = mem[BaseR + SEXT(offset6)]; setcc();",
    7: () => "mem[BaseR + SEXT(offset6)] = SR;",
    8: () => "if (PSR[15] == 1) privilege mode exception; else { PC = pop; PSR = pop; if (PSR[15] == 1) { Saved SSP = R6; R6 = Saved USP; } }",
    9: () => "DR = NOT(SR); setcc();",
    10: () => "DR = mem[mem[PC† + SEXT(PCoffset9)]]; setcc();",
    11: () => "mem[mem[PC† + SEXT(PCoffset9)]] = SR;",
    12: (w) => (((w >> 6) & 7) === 7 ? "PC = R7;  (RET)" : "PC = BaseR;"),
    13: () => "illegal opcode exception",
    14: () => "DR = PC† + SEXT(PCoffset9);  (no memory read; CC unchanged)",
    15: () => "TEMP = PSR; if (PSR[15] == 1) { Saved USP = R6; R6 = Saved SSP; } PSR[15] = 0; push TEMP, PC†; PC = mem[ZEXT(trapvect8)];",
  };
  function decoder(host) {
    const inp = el(`<input type="text" value="x1283" aria-label="instruction in hex" style="${field};width:7em">`);
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`);
    const draw = () => {
      const t = inp.value.trim().replace(/^x/i, ""), w = parseInt(t, 16);
      if (!/^[0-9a-f]{1,4}$/i.test(t) || isNaN(w)) { out.innerHTML = `<p class="aside">Type four hex digits, like x1283.</p>`; return; }
      const op = w >> 12;
      out.innerHTML = `${fieldsHTML(w)}<p class="eq">${disasm(w, 0x3000)}</p><p class="mono" style="overflow-wrap:anywhere">${RTL[op](w)}</p><p class="aside">${[1, 2, 5, 6, 9, 10].includes(op) ? "Sets the condition codes." : op === 13 ? "Reserved opcode." : "Condition codes unchanged."} PC† = the incremented PC. Branch targets assume the instruction is at x3000.</p>`;
    };
    inp.addEventListener("input", draw);
    ["x1283", "x5260", "x0BFB", "x6F82", "xE1FE", "xC1C0", "x4802", "xF025", "x8000", "xD000"].forEach((h) => { const b = btn(h); b.addEventListener("click", () => { inp.value = h; draw(); }); row.append(b); });
    const lab = el(`<label>Instruction: </label>`); lab.append(inp);
    host.append(lab, row, out); draw();
  }
  const p2 = {
    id: "p2", title: "The whole instruction set on one card", mins: 25,
    blurb: "Figure A.2 is fifteen rows. Learn the field patterns and any instruction decodes itself.",
    takeaway: "Figure A.2: ADD/AND 0001/0101 DR SR1 0 00 SR2 or DR SR1 1 imm5; BR 0000 n z p PCoffset9; JMP 1100 000 BaseR 000000 (RET = BaseR 111); JSR 0100 1 PCoffset11; JSRR 0100 0 00 BaseR 000000; LD 0010, LDI 1010, LEA 1110: DR PCoffset9; LDR 0110 / STR 0111: DR|SR BaseR offset6; NOT 1001 DR SR 111111; RTI 1000 000000000000; ST 0011, STI 1011: SR PCoffset9; TRAP 1111 0000 trapvect8; 1101 reserved. Operations (A.2): ADD/AND: DR = SR1 op (SR2 or SEXT(imm5)), setcc. BR: if ((n AND N) OR (z AND Z) OR (p AND P)) PC = PC + SEXT(PCoffset9); BR alone = BRnzp. JMP: PC = BaseR. JSR/JSRR: TEMP = PC; PC = PC + SEXT(PCoffset11) or BaseR; R7 = TEMP (so JSRR R7 works). LD: DR = mem[PC + SEXT(PCoffset9)]; LDI: DR = mem[mem[…]]; LDR: DR = mem[BaseR + SEXT(offset6)], all setcc, all ACV-checked in User mode (LDI/STI: either address). LEA: DR = PC + SEXT(PCoffset9), no memory read. NOT: DR = NOT(SR), setcc. RTI: privilege mode exception if User mode, else pop PC, pop PSR, swap stacks back if the restored PSR is User mode. ST/STI/STR mirror the loads. TRAP: TEMP = PSR; if User mode swap to the supervisor stack; PSR[15] = 0; push TEMP and PC; PC = mem[ZEXT(trapvect8)]. All PC-relative offsets add to the incremented PC.",
    steps: [
      { k: "learn", title: "Field patterns", b: [
        `<div class="tbl"><table style="font-family:var(--mono);font-size:14px"><tbody>
          <tr><td>ADD / AND</td><td>0001 / 0101</td><td>DR SR1 0 00 SR2 &nbsp;or&nbsp; DR SR1 1 imm5</td></tr>
          <tr><td>NOT</td><td>1001</td><td>DR SR 111111</td></tr>
          <tr><td>LD LDI LEA ST STI</td><td>0010 1010 1110 0011 1011</td><td>DR/SR PCoffset9</td></tr>
          <tr><td>LDR / STR</td><td>0110 / 0111</td><td>DR/SR BaseR offset6</td></tr>
          <tr><td>BR</td><td>0000</td><td>n z p PCoffset9</td></tr>
          <tr><td>JMP / RET</td><td>1100</td><td>000 BaseR 000000 (RET: BaseR = 111)</td></tr>
          <tr><td>JSR / JSRR</td><td>0100</td><td>1 PCoffset11 &nbsp;or&nbsp; 0 00 BaseR 000000</td></tr>
          <tr><td>TRAP</td><td>1111</td><td>0000 trapvect8</td></tr>
          <tr><td>RTI</td><td>1000</td><td>000000000000</td></tr>
          <tr><td>reserved</td><td>1101</td><td>illegal opcode exception</td></tr></tbody></table></div>`,
        `<p>Three-bit register fields sit in fixed places: DR/SR at [11:9], SR1/BaseR at [8:6], SR2 at [2:0]. Offsets fill whatever bits are left.</p>`,
      ]},
      { k: "play", title: "Decode anything", b: [
        decoder,
        `<p class="aside">Type any 16-bit word. Try making one of each opcode yourself before clicking the samples.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "What is x5260?", opts: [["AND R1, R1, #0", true, "0101 001 001 1 00000: AND, DR = R1, SR1 = R1, immediate 0. It clears R1."], ["ADD R1, R1, #0", false, "ADD is 0001."], ["AND R1, R1, R0", false, "Bit 5 is 1, so it's the immediate form."]] },
        { t: "mcq", q: "Which instruction is xC1C0?", opts: [["RET", true, "1100 000 111 000000: JMP R7."], ["JSRR R7", false, "JSRR is 0100."], ["RTI", false, "RTI is 1000."]] },
        { t: "num", q: "LDR's offset6 field holds 111011. What offset (decimal) is added to BaseR?", a: -5, tol: 0.01, why: "Sign-extend: 111011 = −5." },
      ]},
      { k: "learn", title: "Two subtle definitions", b: [
        `<p><b>JSR/JSRR</b>: TEMP = PC; PC = target; R7 = TEMP. R7 is written <i>last</i>, so <code>JSRR R7</code> jumps to the old R7 and still saves the return address.</p>`,
        `<p><b>LDI/STI</b>: in User mode an ACV occurs if <i>either</i> address (the pointer's location or the data's location) is privileged.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe exactly what JSRR does, in order, and why the order matters.", model: "It saves the incremented PC in a temporary, loads the PC with the contents of the base register, and only then writes the temporary into R7. If R7 were written first, JSRR R7 would overwrite the target address before using it; doing it last means even JSRR R7 jumps to the right place and still leaves the return address in R7." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  function extWidget(host) {
    const out = el(`<div></div>`);
    let n = 6, v = 0b111011;
    const draw = () => {
      const k = Math.round(n), val = v & ((1 << k) - 1), s = sext(val, k), z = val;
      out.innerHTML = `<p class="mono">field (${k} bits) = ${bin(val, k)}</p><div class="tbl"><table><tbody><tr><td><b>SEXT</b></td><td class="mono">${bin(s & 0xffff, 16).replace(/(.{4})/g, "$1 ")}</td><td>${s}</td></tr><tr><td><b>ZEXT</b></td><td class="mono">${bin(z, 16).replace(/(.{4})/g, "$1 ")}</td><td>${z}</td></tr></tbody></table></div><p class="aside">SEXT copies the leftmost bit; ZEXT pads with zeros. Range as a signed field: ${-(1 << (k - 1))} … ${(1 << (k - 1)) - 1}.</p>`;
    };
    host.append(
      slider({ id: "ppAn", label: "Field width", min: 5, max: 11, step: 1, value: 6, show: (x) => Math.round(x) + " bits" }, (x) => { n = x; draw(); }).el,
      slider({ id: "ppAv", label: "Field value (unsigned)", min: 0, max: 2047, step: 1, value: v, show: (x) => Math.round(x) }, (x) => { v = Math.round(x); draw(); }).el,
      out);
    draw();
  }
  const p3 = {
    id: "p3", title: "Reading the notation", mins: 15,
    blurb: "SEXT, ZEXT, setcc(), PC-relative ranges. Table A.2 is the decoder ring for the definitions.",
    takeaway: "Table A.2 notation: xNumber hex, #Number decimal, bNumber binary; A[l:r] the field from bit l down to bit r (if PC = 0011001100111111, PC[15:9] = 0011001, PC[2] = 1). BaseR: register in [8:6] for LDR/STR/JMP/JSRR. DR: destination register. imm5: 5-bit 2's complement immediate, SEXT, range −16..15. offset6: 6-bit, −32..31, added to BaseR. PCoffset9: 9-bit, −256..255, added to the incremented PC. PCoffset11: 11-bit, −1024..1023 (JSR). trapvect8: 8-bit unsigned, ZEXT, 0..255. INTV: 8-bit vector from the interrupting event, an offset into the interrupt vector table, 0..255. mem[address]; PC = address of the next instruction (during execution of a non-control instruction at A, the PC holds A + 1). PSR, SSP, USP, Saved SSP/USP, SP = R6. setcc() sets N, Z, P from the value written to DR. SEXT(A) replicates the MSB to 16 bits (110000 → 1111 1111 1111 0000); ZEXT(A) pads with zeros (→ 0000 0000 0011 0000).",
    steps: [
      { k: "learn", title: "The key terms", b: [
        `<div class="tbl"><table><thead><tr><th>Field</th><th>Bits</th><th>Extension</th><th>Range</th></tr></thead><tbody>
          <tr><td>imm5</td><td>[4:0]</td><td>SEXT</td><td>−16 … 15</td></tr>
          <tr><td>offset6</td><td>[5:0]</td><td>SEXT</td><td>−32 … 31</td></tr>
          <tr><td>PCoffset9</td><td>[8:0]</td><td>SEXT</td><td>−256 … 255</td></tr>
          <tr><td>PCoffset11</td><td>[10:0]</td><td>SEXT</td><td>−1024 … 1023</td></tr>
          <tr><td>trapvect8</td><td>[7:0]</td><td>ZEXT</td><td>0 … 255</td></tr></tbody></table></div>`,
        `<p>PC-relative offsets are added to the <b>incremented</b> PC. <code>setcc()</code> means N, Z, P are set from the value written to DR.</p>`,
      ]},
      { k: "play", title: "SEXT vs ZEXT", b: [
        extWidget,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "BRz at x4000 with PCoffset9 = 1 1111 1110. Branch target address, as a decimal offset from x4000?", a: -1, tol: 0.01, why: "SEXT = −2; incremented PC x4001 − 2 = x3FFF, one before x4000." },
        { t: "mcq", q: "Why is trapvect8 zero-extended rather than sign-extended?", opts: [["It names a table entry x0000–x00FF; negative values would mean nothing", true, "ZEXT keeps it 0..255, exactly the Trap Vector Table."], ["Sign extension is slower", false, "Both are just wiring."], ["TRAP has no spare bits", false, "Bits [11:8] are zeros either way."]] },
        { t: "mcq", q: "PC = 0011 0011 0011 1111. What is PC[15:9]?", opts: [["0011001", true, "The seven leftmost bits."], ["0111111", false, "That's from the right end."], ["001100", false, "[15:9] is seven bits."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does LD R4, VALUE do, written in the appendix's notation, and what is “PC” there?", model: "DR = mem[PC + SEXT(PCoffset9)]; setcc(). The nine-bit offset is sign-extended to 16 bits and added to the PC, which by then is the incremented PC, the address of the instruction after the LD. The word at that address is loaded into R4, and N, Z, P are set from it." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  function packWidget(host) {
    const inp = el(`<input type="text" value="Hi!" maxlength="12" aria-label="string" style="${field};width:10em">`);
    const out = el(`<div></div>`);
    const draw = () => {
      const s = inp.value;
      const one = [...s].map((c) => c.charCodeAt(0) & 255).concat([0]);
      const two = []; for (let i = 0; i < s.length; i += 2) two.push(((i + 1 < s.length ? s.charCodeAt(i + 1) & 255 : 0) << 8) | (s.charCodeAt(i) & 255)); two.push(0);
      const col = (ws) => ws.map((w, i) => `<tr><td class="mono">+${i}</td><td class="mono">${h4(w)}</td></tr>`).join("");
      out.innerHTML = `<div class="two"><div><h3>PUTS (x22)</h3><div class="tbl"><table><tbody>${col(one)}</tbody></table></div><p class="m">${one.length} words</p></div><div><h3>PUTSP (x24)</h3><div class="tbl"><table><tbody>${col(two)}</tbody></table></div><p class="m">${two.length} words: bits [7:0] print first</p></div></div>`;
    };
    inp.addEventListener("input", draw);
    const lab = el(`<label>String: </label>`); lab.append(inp);
    host.append(lab, out); draw();
  }
  const p4 = {
    id: "p4", title: "The trap service routines", mins: 15,
    blurb: "Six system calls. Know what each expects in R0 and what it gives back.",
    takeaway: "Table A.3: x20 GETC: read one character, not echoed, ASCII into R0 with R0[15:8] cleared. x21 OUT: write R0[7:0] to the display. x22 PUTS: write a string, one character per word, starting at the address in R0, ending at a x0000 word. x23 IN: print a prompt, read one character, echo it, ASCII into R0 (high byte cleared). x24 PUTSP: string packed two characters per word: bits [7:0] written first, then bits [15:8]; an odd-length string has x00 in the last word's high byte; ends at a x0000 word. x25 HALT: halt execution and print a message. The TRAP instruction's definition (A.2): TEMP = PSR; if User mode, Saved USP = R6, R6 = Saved SSP; PSR[15] = 0; push TEMP, PC; PC = mem[ZEXT(trapvect8)]. Locations x0000–x00FF (256) hold the starting addresses.",
    steps: [
      { k: "learn", title: "Table A.3", b: [
        `<div class="tbl"><table><thead><tr><th>Vector</th><th>Name</th><th>In</th><th>Out</th></tr></thead><tbody>
          <tr><td>x20</td><td>GETC</td><td></td><td>R0 ← key (no echo)</td></tr>
          <tr><td>x21</td><td>OUT</td><td>R0[7:0]</td><td>one character shown</td></tr>
          <tr><td>x22</td><td>PUTS</td><td>R0 = string address</td><td>one char per word, until x0000</td></tr>
          <tr><td>x23</td><td>IN</td><td></td><td>prompt, R0 ← key, echoed</td></tr>
          <tr><td>x24</td><td>PUTSP</td><td>R0 = string address</td><td>two chars per word, low byte first</td></tr>
          <tr><td>x25</td><td>HALT</td><td></td><td>message, then stop</td></tr></tbody></table></div>`,
      ]},
      { k: "play", title: "PUTS vs PUTSP memory", b: [
        packWidget,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "For PUTSP, the string \"OK\" is stored as…", opts: [["x4B4F, then x0000", true, "'O' = x4F in bits [7:0] (printed first), 'K' = x4B in bits [15:8]."], ["x4F4B, then x0000", false, "The low byte prints first, so 'O' goes in [7:0]."], ["x004F, x004B, x0000", false, "That's the PUTS layout."]] },
        { t: "mcq", q: "Your program needs a key but must not show it on screen (a password). Which call?", opts: [["GETC (x20)", true, "No echo."], ["IN (x23)", false, "IN echoes the character."], ["OUT (x21)", false, "That writes, it doesn't read."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between PUTS and PUTSP?", model: "Both print a string whose address is in R0 and stop at a word containing x0000. PUTS expects one ASCII character per word. PUTSP expects two per word: it prints the character in bits [7:0] first, then the one in bits [15:8], so a string takes about half the memory." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const EXDEMO = `        .ORIG x3000       ; user program
        LEA  R0, HELLO
        PUTS
        .FILL xD000       ; opcode 1101: not an instruction!
        HALT
HELLO   .STRINGZ "Running... "
        .END
        .ORIG x0101       ; interrupt vector table entry x01
        .FILL x1200       ; illegal opcode exception routine
        .END
        .ORIG x1200       ; exception service routine (supervisor)
        LEA  R0, MSG
        PUTS
        HALT              ; catastrophic: remove the program
MSG     .STRINGZ "Illegal opcode! Program stopped by the OS."
        .END`;
  const p5 = {
    id: "p5", title: "Interrupts and exceptions", mins: 20,
    blurb: "One table at x0100–x01FF. The low half handles the program's own mistakes; the high half handles the outside world.",
    takeaway: "A.3: each event that can interrupt the processor supplies an 8-bit vector into the 256-entry interrupt vector table at x0100–x01FF, whose entries hold service-routine starting addresses (run in Supervisor mode). x0100–x017F: exception service routines (events caused by the running program); x0180–x01FF: interrupt service routines (external events). Interrupts: so far only the keyboard, PL4, vector x80. It interrupts if it wants service, its IE bit is set, and its priority beats any other request and the running program. Initiation, at the end of the current instruction: TEMP = PSR; PSR[15] = 0; PSR[10:8] = 100 (PL4); if User mode, Saved USP = R6, R6 = SSP; push TEMP and PC; vector x80 → x0180; PC = mem[x0180]. RTI pops PC and PSR and resets R6 according to the new PSR[15]. Exceptions (handled as soon as detected): privilege mode violation (RTI in User mode, vector x00), illegal opcode (1101, x01), ACV (User mode access to x0000–x2FFF or xFE00–xFFFF, x02). Initiated like interrupts but the priority level is not changed (the program's urgency hasn't changed). The service routine may fix the problem and RTI (the saved PC is the faulting instruction or the next, depending on whether it should re-execute), or it may remove the program if the problem is catastrophic.",
    steps: [
      { k: "learn", title: "One table, two halves", b: [
        `<div class="tbl"><table><tbody>
          <tr><td class="mono">x0100–x017F</td><td><b>Exceptions</b>: caused by the running program itself</td></tr>
          <tr><td class="mono">x0180–x01FF</td><td><b>Interrupts</b>: caused by events outside the program</td></tr></tbody></table></div>`,
        `<div class="tbl"><table><thead><tr><th>Event</th><th>Vector</th><th>Table entry</th></tr></thead><tbody>
          <tr><td>Privilege mode violation (RTI in User mode)</td><td>x00</td><td>x0100</td></tr>
          <tr><td>Illegal opcode (1101)</td><td>x01</td><td>x0101</td></tr>
          <tr><td>ACV (User mode touches privileged memory)</td><td>x02</td><td>x0102</td></tr>
          <tr><td>Keyboard interrupt (PL4)</td><td>x80</td><td>x0180</td></tr></tbody></table></div>`,
      ]},
      { k: "learn", title: "Same mechanism, one difference", b: [
        `<p>Both: save the PSR in TEMP, switch to Supervisor mode (and to the supervisor stack if needed), push TEMP and PC, PC ← mem[x0100 + vector].</p>`,
        `<p><b>Interrupt</b>: priority becomes the device's (PL4 for the keyboard). <b>Exception</b>: priority is <b>unchanged</b>; the program's urgency didn't change because it made a mistake.</p>`,
        `<p>An interrupt waits for the current instruction to finish. An exception is handled as soon as it's detected.</p>`,
      ]},
      { k: "play", title: "Raise an exception", b: [
        (host) => sim(host, { src: EXDEMO, user: true, stack: true, listHeight: 260 }),
        `<p class="aside">A User-mode program hits the word xD000. Run it: the processor stops at the exception. Step through the OS's exception routine. This one decides the problem is fatal and halts; another might fix things and RTI.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A PL0 User program executes RTI. Where does the processor look for the service routine's address?", opts: [["x0100", true, "Privilege mode violation, vector x00."], ["x0101", false, "That's illegal opcode."], ["Nowhere: RTI just returns", false, "In User mode RTI isn't allowed."]] },
        { t: "mcq", q: "During the ACV exception routine for that PL0 program, what is the priority level?", opts: [["PL0", true, "Exceptions don't change the priority."], ["PL4", false, "That's the keyboard interrupt's level."], ["PL7", false, "Nothing raises it."]] },
        { t: "sort", q: "Exception or interrupt?", bins: ["Exception", "Interrupt"], items: [
          ["Someone types a key", 1, "External to the program."],
          ["The program stores to xFE06 in User mode", 0, "Caused by the program: ACV."],
          ["The program runs into a data word whose top bits are 1101", 0, "Illegal opcode."],
          ["A timer marks one millisecond", 1, "External event."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do exceptions and interrupts differ in the LC-3, and how are they the same?", model: "Both are initiated the same way: the PSR is saved, the processor switches to Supervisor mode and, if needed, the supervisor stack, pushes the old PSR and PC, and loads the PC from the interrupt vector table at x0100 plus the eight-bit vector. Exceptions are caused by the running program itself (privilege violation, illegal opcode, ACV), use vectors in x0100–x017F, are handled as soon as detected, and leave the priority level unchanged. Interrupts come from outside events, use x0180–x01FF, are taken at the end of an instruction, and run at the device's priority." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ppA", eyebrow: "Patt & Patel · Appendix A", title: "The LC-3 ISA",
    intro: `<p>Five parts: the machine state, every instruction on one card (with a decoder), the notation, the six system calls, and interrupt and exception processing.</p><p>This appendix is a reference. Use these pages to learn to <i>read</i> it, then keep the book's pages open while you program. Arrow keys ← → move between steps.</p>`,
    after: `<p>There are no exercises in this appendix. Use it as your reference while doing the Chapter 4–10 exercises.</p><p>Stuck on a definition? Tell Claude which instruction and what you think it does. You'll get a guiding question first.</p>`,
    parts: [p1, p2, p3, p4, p5],
    summary: `
      <h3>State</h3>
      <p>64K words; R0–R7, PC, PSR ([15] privilege, [10:8] PL, [2:0] NZP). CC set only by LD, LDI, LDR, ADD, AND, NOT. Privileged: x0000–x2FFF and xFE00–xFFFF.</p>
      <h3>Instructions</h3>
      <p>Figure A.2: 15 opcodes + 1101 reserved. PC-relative offsets add to the incremented PC. imm5 −16..15, offset6 −32..31, PCoffset9 −256..255, PCoffset11 −1024..1023, trapvect8 0..255 (ZEXT).</p>
      <h3>System calls</h3>
      <p>x20 GETC, x21 OUT, x22 PUTS, x23 IN, x24 PUTSP (low byte first), x25 HALT.</p>
      <h3>Interrupts and exceptions</h3>
      <p>Vector table x0100–x01FF: exceptions x00 privilege, x01 illegal opcode, x02 ACV (priority unchanged); keyboard interrupt x80 at PL4.</p>`,
  };
  Course.start(window.CHAPTER);
})();
