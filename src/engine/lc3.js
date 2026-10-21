/* LC-3 (Patt & Patel 3rd edition) for the tutorials: an assembler, a machine that executes one
   instruction at a time and explains the instruction-cycle phases, field breakdowns, and a
   step-through widget. TRAPs x20-x25 run as built-in OS services; 3rd-edition LEA does not set
   condition codes, and TRAP does not change R7. */
(function () {
  const { el } = Course;
  const h4 = (v) => "x" + (v & 0xffff).toString(16).toUpperCase().padStart(4, "0");
  const bin = (v, k) => (v & ((1 << k) - 1)).toString(2).padStart(k, "0");
  const sext = (v, n) => (v & (1 << (n - 1)) ? v - (1 << n) : v);
  const s16 = (v) => sext(v & 0xffff, 16);
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const NAMES = ["BR", "ADD", "LD", "ST", "JSR", "AND", "LDR", "STR", "RTI", "NOT", "LDI", "STI", "JMP", "reserved", "LEA", "TRAP"];
  const TRAPS = { 0x20: "GETC", 0x21: "OUT", 0x22: "PUTS", 0x23: "IN", 0x24: "PUTSP", 0x25: "HALT" };
  const EXC = ["privilege mode exception", "illegal opcode exception", "access control violation (ACV)"];
  const DEV = { 0xfe00: "KBSR", 0xfe02: "KBDR", 0xfe04: "DSR", 0xfe06: "DDR", 0xfffc: "the PSR", 0xfffe: "the MCR" };

  /* ---------- fields and disassembly ---------- */
  function fields(w) {
    const op = w >> 12, f = (lab, hi, lo, cls) => ({ lab, bits: bin(w >> lo, hi - lo + 1), cls });
    const opf = f(NAMES[op], 15, 12, "op");
    switch (op) {
      case 1: case 5: return (w >> 5) & 1 ? [opf, f("DR", 11, 9, "r"), f("SR1", 8, 6, "r"), f("1", 5, 5, "m"), f("imm5", 4, 0, "i")] : [opf, f("DR", 11, 9, "r"), f("SR1", 8, 6, "r"), f("0", 5, 5, "m"), f("00", 4, 3, "m"), f("SR2", 2, 0, "r")];
      case 9: return [opf, f("DR", 11, 9, "r"), f("SR", 8, 6, "r"), f("111111", 5, 0, "m")];
      case 0: return [opf, f("n", 11, 11, "m"), f("z", 10, 10, "m"), f("p", 9, 9, "m"), f("PCoffset9", 8, 0, "i")];
      case 2: case 3: case 10: case 11: case 14: return [opf, f(op === 3 || op === 11 ? "SR" : "DR", 11, 9, "r"), f("PCoffset9", 8, 0, "i")];
      case 6: case 7: return [opf, f(op === 7 ? "SR" : "DR", 11, 9, "r"), f("BaseR", 8, 6, "r"), f("offset6", 5, 0, "i")];
      case 12: return [opf, f("000", 11, 9, "m"), f("BaseR", 8, 6, "r"), f("000000", 5, 0, "m")];
      case 4: return (w >> 11) & 1 ? [opf, f("1", 11, 11, "m"), f("PCoffset11", 10, 0, "i")] : [opf, f("0", 11, 11, "m"), f("00", 10, 9, "m"), f("BaseR", 8, 6, "r"), f("000000", 5, 0, "m")];
      case 15: return [opf, f("0000", 11, 8, "m"), f("trapvect8", 7, 0, "i")];
      default: return [opf, f("", 11, 0, "m")];
    }
  }
  const COL = { op: "var(--accent-soft)", r: "var(--cool-soft)", i: "var(--good-soft)", m: "var(--card)" };
  function fieldsHTML(w) {
    return `<div class="tbl"><table style="text-align:center;font-family:var(--mono)"><tbody><tr>${fields(w).map((x) => `<td style="background:${COL[x.cls]};letter-spacing:2px">${x.bits}</td>`).join("")}</tr><tr>${fields(w).map((x) => `<td style="font-size:13px">${x.lab}</td>`).join("")}</tr></tbody></table></div>`;
  }
  function disasm(w, addr) {
    const op = w >> 12, dr = (w >> 9) & 7, sr1 = (w >> 6) & 7, pc = addr + 1;
    const off9 = sext(w & 0x1ff, 9), tgt = (pc + off9) & 0xffff;
    switch (op) {
      case 1: case 5: return `${NAMES[op]} R${dr}, R${sr1}, ` + ((w >> 5) & 1 ? `#${sext(w & 31, 5)}` : `R${w & 7}`);
      case 9: return `NOT R${dr}, R${sr1}`;
      case 0: { const c = ((w >> 11) & 1 ? "n" : "") + ((w >> 10) & 1 ? "z" : "") + ((w >> 9) & 1 ? "p" : ""); return `BR${c} ${h4(tgt)}`; }
      case 2: case 3: case 10: case 11: case 14: return `${NAMES[op]} R${dr}, ${h4(tgt)}`;
      case 6: case 7: return `${NAMES[op]} R${dr}, R${sr1}, #${sext(w & 63, 6)}`;
      case 12: return sr1 === 7 ? "RET" : `JMP R${sr1}`;
      case 4: return (w >> 11) & 1 ? `JSR ${h4(pc + sext(w & 0x7ff, 11))}` : `JSRR R${sr1}`;
      case 15: return TRAPS[w & 255] ? `TRAP ${h4(w & 255).replace("x00", "x")} (${TRAPS[w & 255]})` : `TRAP ${h4(w & 255)}`;
      case 8: return "RTI";
      default: return "(reserved)";
    }
  }

  /* ---------- the machine ---------- */
  class Machine {
    constructor() { this.reset(); }
    reset() {
      this.mem = new Uint16Array(65536); this.R = new Uint16Array(8); this.PC = 0x3000; this.IR = 0; this.MAR = 0; this.MDR = 0; this.N = 0; this.Z = 1; this.P = 0; this.halted = false; this.out = ""; this.input = ""; this.count = 0; this.last = null; this.waiting = false;
      // devices and processor status (chapter 9): supervisor mode unless a widget asks for user mode
      this.priv = 0; this.PL = 0; this.savedSSP = 0x3000; this.savedUSP = 0; this.kb = null; this.kbLast = 0; this.kbIE = 0; this.dispBusy = 0; this.dispDelay = 0; this.ddr = 0; this.polls = 0; this.lost = 0;
    }
    load(img) { (img.segs || [{ origin: img.origin, words: img.words }]).forEach((s) => s.words.forEach((w, i) => { this.mem[(s.origin + i) & 0xffff] = w; })); this.PC = img.origin; }
    setcc(v) { const s = s16(v); this.N = s < 0 ? 1 : 0; this.Z = s === 0 ? 1 : 0; this.P = s > 0 ? 1 : 0; }
    cc() { return this.N ? "N" : this.Z ? "Z" : "P"; }
    psr() { return (this.priv << 15) | (this.PL << 8) | (this.N << 2) | (this.Z << 1) | this.P; }
    setPSR(v) { this.priv = (v >> 15) & 1; this.PL = (v >> 8) & 7; this.N = (v >> 2) & 1; this.Z = (v >> 1) & 1; this.P = v & 1; }
    kbReady() { if (this.kb === null && this.input.length) { this.kb = this.input.charCodeAt(0); this.kbLast = this.kb; this.input = this.input.slice(1); } return this.kb !== null; }
    readKey() { if (!this.kbReady()) return null; const c = this.kb; this.kb = null; return c; }
    // memory-mapped device registers (xFE00-xFFFF)
    devRead(a) {
      if (a === 0xfe00) { const r = this.kbReady(); if (!r) { this.polls++; this.waiting = true; } return (r ? 0x8000 : 0) | (this.kbIE << 14); }
      if (a === 0xfe02) { this.kbReady(); this.kb = null; return this.kbLast; }
      if (a === 0xfe04) { if (this.dispBusy) this.polls++; return this.dispBusy ? 0 : 0x8000; }
      if (a === 0xfe06) return this.ddr;
      if (a === 0xfffc) return this.psr();
      if (a === 0xfffe) return 0x8000;
      return 0;
    }
    devWrite(a, v, ph) {
      if (a === 0xfe00) { this.kbIE = (v >> 14) & 1; ph.push(["DEVICE", `KBSR[14] (interrupt enable) ← ${this.kbIE}`]); }
      else if (a === 0xfe06) {
        this.ddr = v & 255;
        if (this.dispBusy) { this.lost++; ph.push(["DEVICE", `DSR[15] was 0 (display busy): '${String.fromCharCode(v & 255)}' is lost`]); }
        else { this.out += String.fromCharCode(v & 255); this.dispBusy = this.dispDelay; ph.push(["DEVICE", `display shows '${String.fromCharCode(v & 255).replace("\n", "\\n")}'${this.dispDelay ? `; DSR[15] ← 0 while it draws` : ""}`]); }
      }
      else if (a === 0xfffc) { this.setPSR(v); ph.push(["DEVICE", `PSR ← ${h4(v)}`]); }
      else if (a === 0xfffe && !(v & 0x8000)) { this.halted = true; ph.push(["DEVICE", "MCR[15] ← 0: the RUN latch clears and the clock stops"]); }
    }
    push(v) { this.R[6] = (this.R[6] - 1) & 0xffff; this.mem[this.R[6]] = v & 0xffff; }
    pop() { const v = this.mem[this.R[6]]; this.R[6] = (this.R[6] + 1) & 0xffff; return v; }
    // TRAP and interrupts share this: switch to the supervisor stack, push PSR then PC
    enterOS(ph, ch) {
      if (this.priv) { this.savedUSP = this.R[6]; this.R[6] = this.savedSSP; ph.push(["SWITCH STACK", `user mode: Saved USP ← R6; R6 ← Saved SSP = ${h4(this.R[6])}`]); }
      const psr = this.psr(), pc = this.PC; this.push(psr); this.push(pc);
      ph.push(["PUSH", `M[${h4(this.R[6] + 1)}] ← PSR ${h4(psr)}; M[${h4(this.R[6])}] ← PC ${h4(pc)}`]);
      ch.add("R6").add("M" + this.R[6]).add("M" + ((this.R[6] + 1) & 0xffff)).add("PSR");
    }
    interrupt() {
      const ph = [], ch = new Set(["PC", "PSR"]), addr = this.PC, tgt = this.mem[0x0180];
      ph.push(["TEST FOR INT", `KBSR[15] = 1 and KBSR[14] = 1, keyboard PL4 > program PL${this.PL}: INT asserted at the instruction boundary`]);
      this.enterOS(ph, ch);
      this.priv = 0; this.PL = 4; this.N = 0; this.Z = 1; this.P = 0;
      this.PC = tgt; ph.push(["LOAD ISR STATE", `PSR ← supervisor, PL4, CC 010; INTV x80 → M[x0180] = ${h4(tgt)}; PC ← ${h4(tgt)}`]);
      this.last = { addr, w: 0, text: "INTERRUPT: keyboard (INTV x80)", ph, ch, intr: true };
      return this.last;
    }
    // Appendix A.3: vectors x00 privilege mode, x01 illegal opcode, x02 ACV; priority unchanged
    exception(vec, ph, ch, pc) {
      const tgt = this.mem[0x0100 + vec], name = EXC[vec];
      if (!tgt) { ph.push(["EXCEPTION", `${name}: no exception service routine installed (M[${h4(0x0100 + vec)}] = x0000), so the simulator stops`]); this.halted = true; return; }
      this.PC = pc; this.enterOS(ph, ch); this.priv = 0; this.PC = tgt; this.excFlag = true;
      ph.push(["EXCEPTION", `${name}: vector ${h4(vec).replace("x00", "x")} → M[${h4(0x0100 + vec)}] = ${h4(tgt)}; PSR[15] ← 0, priority unchanged; PC ← ${h4(tgt)}`]);
    }
    step() {
      if (this.halted) return null;
      const wasWaiting = this.waiting; this.waiting = false;
      if (this.dispBusy) this.dispBusy--;
      if (this.kbIE && this.PL < 4 && this.mem[0x0180] && this.kbReady()) return this.interrupt();
      const ph = [], ch = new Set(), addr = this.PC;
      if (this.priv && (addr < 0x3000 || addr >= 0xfe00)) { ph.push(["FETCH", `user mode cannot fetch from ${h4(addr)} (privileged memory)`]); this.exception(2, ph, ch, addr); this.last = { addr, w: 0, text: "ACCESS VIOLATION", ph, ch, exc: this.excFlag }; this.excFlag = false; return this.last; }
      this.MAR = this.PC; this.PC = (this.PC + 1) & 0xffff; this.MDR = this.mem[this.MAR]; this.IR = this.MDR;
      const w = this.IR, op = w >> 12, dr = (w >> 9) & 7, sr1 = (w >> 6) & 7, PCi = this.PC;
      ph.push(["FETCH", `MAR ← PC (${h4(addr)}), PC ← ${h4(PCi)}; MDR ← M[${h4(addr)}] = ${h4(w)}; IR ← MDR`]);
      ph.push(["DECODE", `opcode ${bin(op, 4)} = ${NAMES[op]}: ${disasm(w, addr)}`]);
      ch.add("PC").add("IR");
      const off = (n) => sext(w & ((1 << n) - 1), n);
      const ACV = {}, guard = (a) => { if (this.priv && (a < 0x3000 || a >= 0xfe00)) { ph.push(["ACCESS VIOLATION", `user mode cannot touch ${h4(a)}: ${a >= 0xfe00 ? "the I/O page" : "system space"} needs supervisor privilege`]); throw ACV; } };
      const rd = (a) => { a &= 0xffff; guard(a); this.MAR = a; this.MDR = a >= 0xfe00 ? this.devRead(a) : this.mem[a]; if (a >= 0xfe00) { ch.add((DEV[a] || "").replace("the ", "")); ph.push(["DEVICE", `address control logic: ${h4(a)} is ${DEV[a] || "a device register"}, not memory → MDR ← ${h4(this.MDR)}`]); } return this.MDR; };
      const wr = (a, v) => { a &= 0xffff; guard(a); this.MAR = a; this.MDR = v & 0xffff; if (a >= 0xfe00) { this.devWrite(a, v, ph); ch.add((DEV[a] || "").replace("the ", "")); } else { this.mem[a] = this.MDR; ch.add("M" + a); } };
      const setR = (r, v) => { this.R[r] = v & 0xffff; ch.add("R" + r); };
      try { switch (op) {
        case 1: case 5: {
          const a = this.R[sr1], b = (w >> 5) & 1 ? off(5) & 0xffff : this.R[w & 7], bs = (w >> 5) & 1 ? `#${off(5)}` : `R${w & 7} = ${s16(b)}`;
          ph.push(["FETCH OPERANDS", `R${sr1} = ${s16(a)}, ${bs}`]);
          const r = op === 1 ? (a + b) & 0xffff : a & b;
          ph.push(["EXECUTE", `ALU ${op === 1 ? "adds" : "ANDs"}: result ${h4(r)} (${s16(r)})`]);
          setR(dr, r); this.setcc(r); ph.push(["STORE RESULT", `R${dr} ← ${s16(r)}; condition code ${this.cc()}`]); ch.add("CC"); break;
        }
        case 9: { const r = ~this.R[sr1] & 0xffff; ph.push(["EXECUTE", `NOT ${h4(this.R[sr1])} = ${h4(r)}`]); setR(dr, r); this.setcc(r); ph.push(["STORE RESULT", `R${dr} ← ${h4(r)}; CC ${this.cc()}`]); ch.add("CC"); break; }
        case 0: {
          const n = (w >> 11) & 1, z = (w >> 10) & 1, p = (w >> 9) & 1, t = (PCi + off(9)) & 0xffff, take = (n && this.N) || (z && this.Z) || (p && this.P);
          ph.push(["EVALUATE ADDRESS", `target = PC + ${off(9)} = ${h4(t)}`]);
          ph.push(["EXECUTE", `test ${(n ? "n" : "") + (z ? "z" : "") + (p ? "p" : "") || "(none)"} against CC ${this.cc()}: ${take ? "taken, PC ← " + h4(t) : "not taken"}`]);
          if (take) this.PC = t; break;
        }
        case 2: case 10: {
          let a = (PCi + off(9)) & 0xffff; ph.push(["EVALUATE ADDRESS", `PC + ${off(9)} = ${h4(a)}`]);
          if (op === 10) { const p2 = rd(a); ph.push(["FETCH OPERANDS", `M[${h4(a)}] = ${h4(p2)} is a pointer`]); a = p2; }
          const v = rd(a); ph.push(["FETCH OPERANDS", `MAR ← ${h4(a)}; MDR ← M[${h4(a)}] = ${h4(v)}`]);
          setR(dr, v); this.setcc(v); ph.push(["STORE RESULT", `R${dr} ← ${s16(v)}; CC ${this.cc()}`]); ch.add("CC"); break;
        }
        case 6: { const a = (this.R[sr1] + off(6)) & 0xffff; ph.push(["EVALUATE ADDRESS", `R${sr1} + ${off(6)} = ${h4(a)}`]); const v = rd(a); ph.push(["FETCH OPERANDS", `M[${h4(a)}] = ${h4(v)}`]); setR(dr, v); this.setcc(v); ph.push(["STORE RESULT", `R${dr} ← ${s16(v)}; CC ${this.cc()}`]); ch.add("CC"); break; }
        case 14: { const a = (PCi + off(9)) & 0xffff; ph.push(["EVALUATE ADDRESS", `PC + ${off(9)} = ${h4(a)} (no memory read)`]); setR(dr, a); ph.push(["STORE RESULT", `R${dr} ← ${h4(a)}; CC unchanged`]); break; }
        case 3: case 11: {
          let a = (PCi + off(9)) & 0xffff; ph.push(["EVALUATE ADDRESS", `PC + ${off(9)} = ${h4(a)}`]);
          if (op === 11) { const p2 = rd(a); ph.push(["FETCH OPERANDS", `M[${h4(a)}] = ${h4(p2)} is a pointer`]); a = p2; }
          wr(a, this.R[dr]); ph.push(["STORE RESULT", `M[${h4(a)}] ← R${dr} = ${s16(this.R[dr])}`]); break;
        }
        case 7: { const a = (this.R[sr1] + off(6)) & 0xffff; ph.push(["EVALUATE ADDRESS", `R${sr1} + ${off(6)} = ${h4(a)}`]); wr(a, this.R[dr]); ph.push(["STORE RESULT", `M[${h4(a)}] ← R${dr} = ${s16(this.R[dr])}`]); break; }
        case 12: { this.PC = this.R[sr1]; ph.push(["EXECUTE", `PC ← R${sr1} = ${h4(this.PC)}`]); break; }
        case 4: { const t = (w >> 11) & 1 ? (PCi + off(11)) & 0xffff : this.R[sr1]; setR(7, PCi); this.PC = t; ph.push(["EXECUTE", `R7 ← ${h4(PCi)} (return address); PC ← ${h4(t)}`]); break; }
        case 8: {
          if (this.priv) { ph.push(["EXECUTE", "RTI in user mode"]); this.exception(0, ph, ch, PCi); break; }
          const pc = this.pop(), psr = this.pop(); this.PC = pc; this.setPSR(psr); ch.add("R6").add("CC").add("PSR");
          ph.push(["POP", `PC ← M[${h4(this.R[6] - 2)}] = ${h4(pc)}; PSR ← M[${h4(this.R[6] - 1)}] = ${h4(psr)}`]);
          if (this.priv) { this.savedSSP = this.R[6]; this.R[6] = this.savedUSP; ph.push(["SWITCH STACK", `back to user mode: Saved SSP ← R6; R6 ← Saved USP = ${h4(this.R[6])}`]); }
          else ph.push(["", `still supervisor mode (PL${this.PL}): R6 stays on the supervisor stack`]);
          break;
        }
        case 15: {
          const v = w & 255, name = TRAPS[v];
          if (this.mem[v]) {
            ph.push(["EXECUTE", `trap vector ${h4(v)} → Trap Vector Table entry M[${h4(v)}] = ${h4(this.mem[v])}`]);
            this.enterOS(ph, ch); this.priv = 0; this.PC = this.mem[v];
            ph.push(["", `PSR[15] ← 0 (supervisor), priority unchanged; PC ← ${h4(this.PC)}`]);
            break;
          }
          if (!name) { ph.push(["EXECUTE", `TRAP ${h4(v)}: no service routine in this simulator`]); this.halted = true; break; }
          if (name === "HALT") { this.halted = true; ph.push(["EXECUTE", "OS service HALT: clears the RUN latch, the clock stops"]); break; }
          if (name === "OUT") { this.out += String.fromCharCode(this.R[0] & 255); ph.push(["EXECUTE", `OS service OUT: prints '${String.fromCharCode(this.R[0] & 255)}' (R0 = ${h4(this.R[0])})`]); }
          if (name === "PUTS" || name === "PUTSP") { let a = this.R[0], s = ""; for (let i = 0; i < 2000 && this.mem[a]; i++, a = (a + 1) & 0xffff) { const m = this.mem[a]; s += String.fromCharCode(m & 255); if (name === "PUTSP" && m >> 8) s += String.fromCharCode(m >> 8); } this.out += s; ph.push(["EXECUTE", `OS service ${name}: prints the string at ${h4(this.R[0])}`]); }
          if (name === "GETC" || name === "IN") {
            if (name === "IN" && !wasWaiting) this.out += "\nInput a character>";
            const c = this.readKey();
            if (c === null) { this.PC = addr; this.waiting = true; ph.push(["EXECUTE", `OS service ${name}: waiting for a key (type into the input box)`]); break; }
            this.waiting = false; setR(0, c); if (name === "IN") this.out += String.fromCharCode(c) + "\n";
            ph.push(["EXECUTE", `OS service ${name}: R0 ← ${h4(c)} ('${String.fromCharCode(c)}')`]);
          }
          ph.push(["", "(TRAP runs an operating-system service routine and returns to the next instruction; simulated here in one step)"]);
          break;
        }
        default: ph.push(["EXECUTE", "opcode 1101 is reserved"]); this.exception(1, ph, ch, PCi);
      } } catch (e) { if (e !== ACV) throw e; this.exception(2, ph, ch, PCi); }
      this.count++;
      this.last = { addr, w, text: disasm(w, addr), ph, ch, exc: this.excFlag }; this.excFlag = false;
      return this.last;
    }
    run(max = 20000) { let n = 0; while (!this.halted && n < max) { this.step(); n++; if (this.waiting) break; } return n; }
  }

  /* ---------- assembler ---------- */
  const OPC = { ADD: 1, AND: 5, NOT: 9, LD: 2, LDI: 10, LDR: 6, LEA: 14, ST: 3, STI: 11, STR: 7, JMP: 12, RET: 12, JSR: 4, JSRR: 4, TRAP: 15, RTI: 8, GETC: 15, OUT: 15, PUTS: 15, IN: 15, PUTSP: 15, HALT: 15 };
  const isBR = (t) => /^BR(N?Z?P?)$/i.test(t);
  const isOp = (t) => !!OPC[t.toUpperCase()] || isBR(t) || /^\.(ORIG|FILL|BLKW|STRINGZ|END)$/i.test(t);
  function num(t) {
    if (t == null) return null;
    let m;
    if ((m = /^#?(-?\d+)$/.exec(t))) return parseInt(m[1], 10);
    if ((m = /^0?[xX](-?[0-9a-fA-F]+)$/.exec(t))) return parseInt(m[1], 16);
    if ((m = /^[bB](-?[01]+)$/.exec(t))) return parseInt(m[1], 2);
    return null;
  }
  function tokens(line) {
    const out = []; let i = 0, cur = "";
    while (i < line.length) {
      const c = line[i];
      if (c === ";") break;
      if (c === '"') { let j = i + 1, s = ""; while (j < line.length && line[j] !== '"') { if (line[j] === "\\" && j + 1 < line.length) { const e = line[j + 1]; s += e === "n" ? "\n" : e === "t" ? "\t" : e === "0" ? "\0" : e; j += 2; } else s += line[j++]; } out.push({ str: s }); i = j + 1; continue; }
      if (/[\s,]/.test(c)) { if (cur) out.push(cur); cur = ""; i++; continue; }
      cur += c; i++;
    }
    if (cur) out.push(cur);
    return out;
  }
  function assemble(src) {
    const lines = src.replace(/\r/g, "").split("\n"), errors = [], sym = {}, items = [], segStarts = [];
    let origin = null, lc = null, ended = false;
    lines.forEach((raw, ln) => {
      const t = tokens(raw); if (!t.length) return;
      if (ended) { if (String(t[0]).toUpperCase() !== ".ORIG") return; ended = false; }
      let label = null;
      if (typeof t[0] === "string" && !isOp(t[0])) { label = t.shift(); if (lc === null) { errors.push(`line ${ln + 1}: label before .ORIG`); return; } if (sym[label.toUpperCase()] !== undefined) errors.push(`line ${ln + 1}: label ${label} defined twice`); sym[label.toUpperCase()] = lc; }
      if (!t.length) return;
      const op = String(t[0]).toUpperCase(), args = t.slice(1);
      if (op === ".ORIG") { const v = num(args[0]); if (v === null) errors.push(`line ${ln + 1}: .ORIG needs an address`); lc = v & 0xffff; if (origin === null) origin = lc; segStarts.push(lc); return; }
      if (op === ".END") { ended = true; lc = null; return; }
      if (lc === null) { errors.push(`line ${ln + 1}: code before .ORIG`); return; }
      let size = 1;
      if (op === ".BLKW") { size = num(args[0]); if (size === null || size < 1) { errors.push(`line ${ln + 1}: .BLKW needs a count`); size = 1; } }
      if (op === ".STRINGZ") { if (!args[0] || args[0].str === undefined) errors.push(`line ${ln + 1}: .STRINGZ needs a "string"`); size = ((args[0] && args[0].str) || "").length + 1; }
      items.push({ ln, raw, lc, op, args, size, label });
      lc += size;
    });
    if (origin === null) errors.push("no .ORIG found");
    const words = [], listing = [];
    const reg = (a, ln) => { const m = /^R([0-7])$/i.exec(a || ""); if (!m) { errors.push(`line ${ln + 1}: expected a register, got '${a || ""}'`); return 0; } return +m[1]; };
    const val = (a, ln, bitsN, pcRel, addr) => {
      if (a === undefined) { errors.push(`line ${ln + 1}: missing operand`); return 0; }
      let v = num(a);
      if (v === null) { const s = sym[String(a).toUpperCase()]; if (s === undefined) { errors.push(`line ${ln + 1}: unknown label '${a}'`); return 0; } v = pcRel ? s - (addr + 1) : s; }
      if (bitsN) { const lo = -(1 << (bitsN - 1)), hi = (1 << (bitsN - 1)) - 1; if (v < lo || v > hi) errors.push(`line ${ln + 1}: '${a}' is out of range for ${bitsN} bits (${lo}..${hi})`); }
      return v;
    };
    items.forEach((it) => {
      const { ln, op, args, lc: a } = it, put = (w) => { words.push(w & 0xffff); };
      const start = words.length;
      if (op === ".FILL") put(val(args[0], ln, 0, false, a));
      else if (op === ".BLKW") for (let i = 0; i < it.size; i++) put(0);
      else if (op === ".STRINGZ") { const s = (args[0] && args[0].str) || ""; for (const ch of s) put(ch.charCodeAt(0)); put(0); }
      else if (isBR(op)) { let c = op.slice(2).toLowerCase(); if (!c) c = "nzp"; put(((c.includes("n") ? 4 : 0) | (c.includes("z") ? 2 : 0) | (c.includes("p") ? 1 : 0)) << 9 | (val(args[0], ln, 9, true, a) & 0x1ff)); }
      else {
        const o = OPC[op];
        if (op === "ADD" || op === "AND") { const d = reg(args[0], ln), s = reg(args[1], ln); if (/^R[0-7]$/i.test(args[2] || "")) put(o << 12 | d << 9 | s << 6 | reg(args[2], ln)); else put(o << 12 | d << 9 | s << 6 | 32 | (val(args[2], ln, 5, false, a) & 31)); }
        else if (op === "NOT") put(9 << 12 | reg(args[0], ln) << 9 | reg(args[1], ln) << 6 | 63);
        else if (["LD", "LDI", "LEA", "ST", "STI"].includes(op)) put(o << 12 | reg(args[0], ln) << 9 | (val(args[1], ln, 9, true, a) & 0x1ff));
        else if (op === "LDR" || op === "STR") put(o << 12 | reg(args[0], ln) << 9 | reg(args[1], ln) << 6 | (val(args[2], ln, 6, false, a) & 63));
        else if (op === "JMP") put(12 << 12 | reg(args[0], ln) << 6);
        else if (op === "RET") put(0xc1c0);
        else if (op === "JSR") put(4 << 12 | 1 << 11 | (val(args[0], ln, 11, true, a) & 0x7ff));
        else if (op === "JSRR") put(4 << 12 | reg(args[0], ln) << 6);
        else if (op === "RTI") put(0x8000);
        else if (op === "TRAP") put(0xf000 | (val(args[0], ln, 0, false, a) & 255));
        else { const tv = { GETC: 0x20, OUT: 0x21, PUTS: 0x22, IN: 0x23, PUTSP: 0x24, HALT: 0x25 }[op]; if (tv) put(0xf000 | tv); else errors.push(`line ${ln + 1}: unknown instruction '${op}'`); }
      }
      for (let k = start; k < words.length; k++) listing.push({ addr: (a + k - start) & 0xffff, word: words[k], src: k === start ? it.raw.trim() : "", ln });
    });
    // one segment per .ORIG block; words/origin stay the first block for older callers
    const segs = [];
    listing.forEach((r) => { const s = segs[segs.length - 1]; if (s && s.origin + s.words.length === r.addr) s.words.push(r.word); else segs.push({ origin: r.addr, words: [r.word] }); });
    return { origin: origin || 0, words: segs.length ? segs[0].words : [], segs, sym, listing, errors };
  }

  /* ---------- widget ---------- */
  function sim(host, o = {}) {
    const m = new Machine();
    let img = null, trace = [], note = "";
    const bps = new Set();
    const wrap = el(`<div class="lc3" style="min-width:0;max-width:100%;display:grid;gap:8px"></div>`);
    const ta = o.editable ? el(`<textarea spellcheck="false" rows="${(o.rows || 12) + 1}" style="font-family:var(--mono);font-size:14px;line-height:1.45;min-height:${((o.rows || 12) + 1) * 1.45}em;white-space:pre;overflow-x:auto"></textarea>`) : null;
    if (ta) ta.value = o.src.trim();
    const errBox = el(`<div></div>`), list = el(`<div class="tbl" style="max-height:${o.listHeight || 330}px;overflow:auto"></div>`), regs = el(`<div class="tbl"></div>`), phases = el(`<div></div>`), cons = el(`<pre class="code" style="min-height:2.4em;white-space:pre-wrap"></pre>`), memv = el(`<div class="tbl"></div>`), trv = el(`<div class="tbl" style="max-height:260px;overflow:auto"></div>`), noteBox = el(`<div></div>`), devs = el(`<div></div>`), stk = el(`<div class="tbl"></div>`);
    const field = 'font:inherit;font-family:var(--mono);padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--paper);color:var(--ink)';
    const inp = el(`<input type="text" placeholder="${o.inputLabel || "keyboard input (typed characters are read by GETC / IN)"}" style="${field};width:100%">`);
    const setBox = el(`<div class="row"></div>`), setInputs = (o.setRegs || []).map(([r, v]) => { const i = el(`<input type="text" value="${v}" aria-label="R${r}" style="${field};width:6.5em">`); const lab = el(`<label class="mono">R${r} = </label>`); lab.append(i); setBox.append(lab); return [r, i]; });
    const bStep = el(`<button type="button" class="btn primary">Step one instruction</button>`), bRun = el(`<button type="button" class="btn">${o.breakpoints ? "Run (to HALT or a breakpoint)" : "Run to HALT"}</button>`), bReset = el(`<button type="button" class="btn">Reset</button>`), bAsm = ta ? el(`<button type="button" class="btn primary">Assemble and load</button>`) : null;
    const row = el(`<div class="row"></div>`); row.append(bStep, bRun, bReset);
    const btn0 = (t) => el(`<button type="button" class="btn" style="justify-self:start">${t}</button>`);
    const parseNum = (t) => { t = String(t).trim(); const v = /^x/i.test(t) ? parseInt(t.slice(1), 16) : /^#/.test(t) ? parseInt(t.slice(1), 10) : parseInt(t, 10); return isNaN(v) ? 0 : v & 0xffff; };
    function logTrace() { if (o.trace) trace.push([m.PC, o.trace.map((r) => s16(m.R[r]))]); }
    function load() {
      img = assemble(ta ? ta.value : o.src);
      m.reset(); trace = []; note = "";
      errBox.innerHTML = img.errors.length ? `<span class="verdict no">${esc(img.errors.slice(0, 4).join(" · "))}</span>` : "";
      if (!img.errors.length) {
        m.load(img); m.dispDelay = o.dispDelay || 0;
        if (o.start !== undefined) m.PC = typeof o.start === "string" ? img.sym[o.start.toUpperCase()] : o.start;
        if (o.user) { m.priv = 1; m.R[6] = 0xfe00; }
        if (o.init) o.init(m); m.input = inp.value.replace(/⏎/g, "\n");
        setInputs.forEach(([r, i]) => { m.R[r] = parseNum(i.value); });
        bps.clear(); (o.breakpoints || []).forEach((b) => { const a = typeof b === "string" ? img.sym[b.toUpperCase()] : b; if (a !== undefined) bps.add(a); });
        logTrace();
      }
      draw();
    }
    function draw() {
      const ch = (m.last && m.last.ch) || new Set();
      list.innerHTML = img && !img.errors.length ? `<table><thead><tr>${o.breakpoints ? "<th>Brk</th>" : ""}<th>Addr</th><th>Bits</th><th>Source</th></tr></thead><tbody>${img.listing.map((r, i) => `${i && img.listing[i - 1].addr + 1 !== r.addr ? `<tr><td colspan="${o.breakpoints ? 4 : 3}" class="m" style="font-size:13px;text-align:center">⋮ next .ORIG block ⋮</td></tr>` : ""}<tr${r.addr === m.PC && !m.halted ? ' data-cur style="background:var(--accent-soft)"' : ""}>${o.breakpoints ? `<td data-bp="${r.addr}" style="cursor:pointer;text-align:center;color:var(--bad)" title="toggle breakpoint">${bps.has(r.addr) ? "●" : "○"}</td>` : ""}<td class="mono">${h4(r.addr)}</td><td class="mono" style="font-size:12px">${bin(m.mem[r.addr], 16).replace(/(.{4})/g, "$1 ").trim()}</td><td>${r.src ? `<code>${esc(r.src.replace(/;.*$/, "").trim())}</code>` : ""}</td></tr>`).join("")}</tbody></table>` : "";
      { const cur = list.querySelector("[data-cur]"); if (cur) list.scrollTop = Math.max(0, cur.offsetTop - list.clientHeight / 3); }
      const cell = (k, v) => `<td${ch.has(k) ? ' style="background:var(--accent-soft)"' : ""}>${v}</td>`;
      const chip = (k, lab, v, sub) => `<div style="border:1px solid var(--line);border-radius:8px;padding:4px 8px;min-width:76px;background:${ch.has(k) ? "var(--accent-soft)" : "var(--card)"}"><b>${lab}</b> <span class="mono">${v}</span>${sub !== undefined ? `<br><span class="m" style="font-size:13px">${sub}</span>` : ""}</div>`;
      regs.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:6px">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => chip("R" + i, "R" + i, h4(m.R[i]), s16(m.R[i]))).join("")}${chip("PC", "PC", h4(m.PC))}${chip("IR", "IR", h4(m.IR))}${chip("CC", "CC", m.cc())}<div style="padding:4px 8px" class="m">${m.count} instructions${m.halted ? " · halted" : ""}</div></div>`;
      phases.innerHTML = o.phases === false ? "" : m.last ? `<p><b>${esc(m.last.text)}</b> at ${h4(m.last.addr)}</p>` + `<div class="tbl"><table><tbody>${m.last.ph.map(([a, b]) => `<tr><td style="white-space:nowrap"><b>${a}</b></td><td style="font-size:15px;overflow-wrap:anywhere">${esc(b)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="aside">Press <b>Step</b> to run the instruction at the highlighted address.</p>`;
      cons.textContent = m.out || " ";
      if (o.devices) {
        const kbsr = (m.kb !== null || m.input.length ? 0x8000 : 0) | (m.kbIE << 14), dsr = m.dispBusy ? 0 : 0x8000;
        devs.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:6px">${chip("KBSR", "KBSR", h4(kbsr), `ready ${kbsr >> 15} · IE ${m.kbIE}`)}${chip("KBDR", "KBDR", h4(m.kbLast), m.kbLast ? `'${String.fromCharCode(m.kbLast)}'` : "")}${chip("DSR", "DSR", h4(dsr), `ready ${dsr >> 15}`)}${chip("DDR", "DDR", h4(m.ddr))}${chip("PSR", "PSR", h4(m.psr()), `${m.priv ? "user" : "supervisor"} · PL${m.PL}`)}<div style="padding:4px 8px" class="m">status-register reads that found "not ready": ${m.polls}${m.lost ? ` · characters lost: ${m.lost}` : ""}</div></div>`;
      }
      if (o.stack) {
        const sp = m.priv ? m.savedSSP : m.R[6], rows = [];
        for (let a = 0x2fff; a >= 0x2ffa; a--) rows.push(`<tr><td class="mono">${h4(a)}</td>${cell("M" + a, h4(m.mem[a]))}<td>${a === sp && a < 0x3000 ? (m.priv ? "← Saved SSP" : "← R6 (top)") : ""}</td></tr>`);
        stk.innerHTML = `<table><thead><tr><th>Address</th><th>Value</th><th></th></tr></thead><tbody>${rows.join("")}</tbody></table><p class="aside" style="margin:4px 0 0">${m.priv ? `User mode: R6 = ${h4(m.R[6])} is the user stack; Saved SSP = ${h4(m.savedSSP)}.` : `Supervisor mode: R6 = ${h4(m.R[6])}${m.savedUSP ? `; Saved USP = ${h4(m.savedUSP)}` : ""}.`} The supervisor stack starts at x3000 and grows toward x2FFF.</p>`;
      }
      noteBox.innerHTML = note ? `<span class="verdict mid">${esc(note)}</span>` : "";
      if (o.watch) memv.innerHTML = `<table><thead><tr><th>Address</th><th>Value</th></tr></thead><tbody>${o.watch.map(([lab, ad]) => { const a = typeof ad === "string" ? (img && img.sym[ad.toUpperCase()]) : ad; return a === undefined ? "" : `<tr><td>${lab} ${h4(a)}</td>${cell("M" + a, `${h4(m.mem[a])} = ${s16(m.mem[a])}`)}</tr>`; }).join("")}</tbody></table>`;
      if (o.trace) trv.innerHTML = `<table><thead><tr><th>PC</th>${o.trace.map((r) => `<th>R${r}</th>`).join("")}</tr></thead><tbody>${trace.map(([pc, vs]) => `<tr><td class="mono">${h4(pc)}</td>${vs.map((v) => `<td class="mono">${v}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    }
    list.addEventListener("click", (e) => { const t = e.target.closest("[data-bp]"); if (!t) return; const a = +t.dataset.bp; if (bps.has(a)) bps.delete(a); else bps.add(a); draw(); });
    bStep.addEventListener("click", () => { if (!img || img.errors.length || m.halted) return; m.input = inp.value.replace(/⏎/g, "\n"); m.step(); inp.value = m.input.replace(/\n/g, "⏎"); note = m.waiting && !m.last.text.startsWith("TRAP") ? "KBSR[15] = 0: no key yet. Type a character in the keyboard box." : ""; logTrace(); draw(); });
    bRun.addEventListener("click", () => {
      if (!img || img.errors.length || m.halted) return;
      m.input = inp.value.replace(/⏎/g, "\n"); const max = o.maxSteps || 20000; let n = 0;
      do { m.step(); n++; } while (!m.halted && !m.waiting && n < max && !bps.has(m.PC) && !m.last.intr && !m.last.exc);
      inp.value = m.input.replace(/\n/g, "⏎");
      note = m.last.intr ? "Stopped: an interrupt was just initiated. Step through the service routine." : m.last.exc ? "Stopped: an exception was just raised. Step through its service routine." : m.waiting ? `Waiting at ${h4(m.PC)}: ${m.last.text.startsWith("TRAP") ? "the OS input routine needs a key" : "the program polls the keyboard and no key has been typed"}. Type in the keyboard box, then Run again.` : n >= max && !m.halted ? (o.loopNote || `Stopped after ${n} instructions without reaching HALT. An infinite loop?`) : bps.has(m.PC) && !m.halted ? `Stopped at the breakpoint at ${h4(m.PC)}.` : "";
      logTrace(); draw();
    });
    bReset.addEventListener("click", load);
    if (bAsm) bAsm.addEventListener("click", load);
    if (ta) wrap.append(ta, bAsm, errBox);
    if (setInputs.length) wrap.append(el(`<p class="aside">Starting register values (applied on Reset):</p>`), setBox);
    wrap.append(list, row, noteBox, phases, el(`<p class="aside">Registers (changed ones highlighted):</p>`), regs);
    if (o.devices) wrap.append(el(`<p class="aside">Device registers (memory-mapped at xFE00–xFE06) and the PSR:</p>`), devs);
    if (o.stack) wrap.append(el(`<p class="aside">Supervisor stack (the top few words):</p>`), stk);
    if (o.watch) wrap.append(memv);
    if (o.trace) wrap.append(el(`<p class="aside">Trace (one row each time execution stops):</p>`), trv);
    if (o.io !== false) wrap.append(el(`<p class="aside">Monitor output:</p>`), cons);
    // ⏎ in the keyboard box stands for the Enter (line feed, x0A) key
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); inp.value += "⏎"; } });
    if (o.input) { inp.value = o.input.replace(/\n/g, "⏎"); } if (o.input !== undefined) wrap.append(inp);
    if (o.input !== undefined && o.enterKey) { const bE = btn0("Type ⏎ (Enter)"); bE.addEventListener("click", () => { inp.value += "⏎"; }); wrap.append(bE); }
    host.append(wrap);
    load();
    return { machine: m, reload: load };
  }

  window.LC3 = { assemble, disasm, fields, fieldsHTML, Machine, sim, h4, bin, sext, s16, NAMES, TRAPS };
})();
