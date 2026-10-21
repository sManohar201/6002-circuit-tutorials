/* A small MIPS (Harris & Harris subset) for the tutorials: assembler (with .text/.data, labels,
   li/la/move/nop pseudoinstructions), a byte-addressable little-endian machine, field breakdowns,
   and a step-through widget. Branch delay slots are ignored, as in the book. */
(function () {
  const { el } = Course;
  const hx = (v, n = 8) => "0x" + ((v >>> 0).toString(16).toUpperCase().padStart(n, "0"));
  const bin = (v, k) => ((v >>> 0) & (k === 32 ? 0xffffffff : (1 << k) - 1)).toString(2).padStart(k, "0");
  const s32 = (v) => v | 0;
  const sx16 = (v) => (v & 0x8000 ? v - 0x10000 : v & 0xffff);
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const RN = ["$0", "$at", "$v0", "$v1", "$a0", "$a1", "$a2", "$a3", "$t0", "$t1", "$t2", "$t3", "$t4", "$t5", "$t6", "$t7", "$s0", "$s1", "$s2", "$s3", "$s4", "$s5", "$s6", "$s7", "$t8", "$t9", "$k0", "$k1", "$gp", "$sp", "$fp", "$ra"];
  const regNum = (t) => { t = String(t || "").trim().toLowerCase(); if (t === "$zero") return 0; const i = RN.indexOf(t); if (i >= 0) return i; const m = /^\$(\d+)$/.exec(t); return m && +m[1] < 32 ? +m[1] : -1; };
  const R = { add: 32, addu: 33, sub: 34, subu: 35, and: 36, or: 37, xor: 38, nor: 39, slt: 42, sltu: 43, sll: 0, srl: 2, sra: 3, sllv: 4, srlv: 6, srav: 7, jr: 8, mult: 24, div: 26, mfhi: 16, mflo: 18 };
  const I = { addi: 8, addiu: 9, slti: 10, sltiu: 11, andi: 12, ori: 13, xori: 14, lui: 15, lw: 35, sw: 43, lb: 32, lbu: 36, sb: 40, beq: 4, bne: 5 };
  const J = { j: 2, jal: 3 };
  const FN = Object.fromEntries(Object.entries(R).map(([k, v]) => [v, k])), OP = Object.fromEntries(Object.entries(I).concat(Object.entries(J)).map(([k, v]) => [v, k]));

  function fields(w) {
    const op = w >>> 26, f = (lab, hi, lo, cls) => ({ lab, bits: bin(w >>> lo, hi - lo + 1), val: (w >>> lo) & ((1 << (hi - lo + 1)) - 1), cls });
    if (op === 0 || op === 0x1c) return { type: "R", f: [f("op", 31, 26, "op"), f("rs", 25, 21, "r"), f("rt", 20, 16, "r"), f("rd", 15, 11, "r"), f("shamt", 10, 6, "i"), f("funct", 5, 0, "op")] };
    if (op === 2 || op === 3) return { type: "J", f: [f("op", 31, 26, "op"), f("addr", 25, 0, "i")] };
    return { type: "I", f: [f("op", 31, 26, "op"), f("rs", 25, 21, "r"), f("rt", 20, 16, "r"), f("imm", 15, 0, "i")] };
  }
  const COL = { op: "var(--accent-soft)", r: "var(--cool-soft)", i: "var(--good-soft)" };
  function fieldsHTML(w) {
    const { type, f } = fields(w);
    return `<div class="tbl"><table style="text-align:center;font-family:var(--mono)"><tbody><tr>${f.map((x) => `<td style="background:${COL[x.cls]};font-size:13px;letter-spacing:1px">${x.bits}</td>`).join("")}</tr><tr>${f.map((x) => `<td style="font-size:13px">${x.lab} = ${x.lab === "imm" ? sx16(x.val) : x.lab === "addr" ? hx(x.val, 7) : x.val}</td>`).join("")}</tr></tbody></table></div><p class="aside">${type}-type · ${hx(w)}</p>`;
  }
  function disasm(w, pc) {
    const op = w >>> 26, rs = (w >>> 21) & 31, rt = (w >>> 16) & 31, rd = (w >>> 11) & 31, sh = (w >>> 6) & 31, fn = w & 63, imm = sx16(w & 0xffff);
    if (w === 0) return "nop";
    if (op === 0) { const n = FN[fn]; if (!n) return "?"; if (n === "jr") return `jr ${RN[rs]}`; if (["sll", "srl", "sra"].includes(n)) return `${n} ${RN[rd]}, ${RN[rt]}, ${sh}`; if (["sllv", "srlv", "srav"].includes(n)) return `${n} ${RN[rd]}, ${RN[rt]}, ${RN[rs]}`; if (n === "mult" || n === "div") return `${n} ${RN[rs]}, ${RN[rt]}`; if (n === "mfhi" || n === "mflo") return `${n} ${RN[rd]}`; return `${n} ${RN[rd]}, ${RN[rs]}, ${RN[rt]}`; }
    if (op === 0x1c && fn === 2) return `mul ${RN[rd]}, ${RN[rs]}, ${RN[rt]}`;
    const n = OP[op]; if (!n) return "?";
    if (n === "j" || n === "jal") return `${n} ${hx(((pc + 4) & 0xf0000000) | ((w & 0x3ffffff) << 2))}`;
    if (n === "beq" || n === "bne") return `${n} ${RN[rs]}, ${RN[rt]}, ${hx(pc + 4 + imm * 4)}`;
    if (n === "lui") return `lui ${RN[rt]}, ${hx(w & 0xffff, 4)}`;
    if (["lw", "sw", "lb", "lbu", "sb"].includes(n)) return `${n} ${RN[rt]}, ${imm}(${RN[rs]})`;
    if (["andi", "ori", "xori"].includes(n)) return `${n} ${RN[rt]}, ${RN[rs]}, ${hx(w & 0xffff, 4)}`;
    return `${n} ${RN[rt]}, ${RN[rs]}, ${imm}`;
  }

  /* ---------- assembler ---------- */
  function num(t) { t = String(t).trim(); if (/^-?0x[0-9a-f]+$/i.test(t)) return parseInt(t, 16); if (/^-?\d+$/.test(t)) return parseInt(t, 10); if (/^'.'$/.test(t)) return t.charCodeAt(1); return null; }
  function assemble(src, o = {}) {
    const TEXT = o.text ?? 0x00400000, DATA = o.data ?? 0x10000000, GP = 0x10008000;
    const errors = [], sym = {}, items = [], dataBytes = [];
    let seg = "text", pc = TEXT, dp = DATA;
    const lines = src.replace(/\r/g, "").split("\n");
    const size = (op, args) => (op === "li" ? (num(args[1]) !== null && num(args[1]) >= -32768 && num(args[1]) <= 32767 ? 1 : 2) : op === "la" ? 2 : 1);
    lines.forEach((raw, ln) => {
      let s = raw.replace(/#.*$/, "");
      const strm = /"((?:[^"\\]|\\.)*)"/.exec(s); let str = null; if (strm) { str = strm[1].replace(/\\n/g, "\n").replace(/\\0/g, "\0"); s = s.replace(strm[0], ""); }
      let m;
      while ((m = /^\s*([A-Za-z_][\w.]*):/.exec(s))) { sym[m[1]] = seg === "text" ? pc : dp; s = s.slice(m[0].length); }
      s = s.trim(); if (!s) return;
      const parts = s.split(/[\s,]+/).filter(Boolean), op = parts[0].toLowerCase(), args = parts.slice(1);
      if (op === ".text") { seg = "text"; return; }
      if (op === ".data") { seg = "data"; return; }
      if (seg === "data") {
        if (op === ".word") args.forEach((a) => { const v = num(a) ?? 0; for (let k = 0; k < 4; k++) dataBytes.push([dp++, (v >>> (8 * k)) & 255]); });
        else if (op === ".space") { const n = num(args[0]) || 0; for (let k = 0; k < n; k++) dataBytes.push([dp++, 0]); }
        else if (op === ".asciiz") { for (const ch of str || "") dataBytes.push([dp++, ch.charCodeAt(0)]); dataBytes.push([dp++, 0]); }
        else if (op === ".align") { while (dp % 4) dp++; }
        else errors.push(`line ${ln + 1}: unknown data directive ${op}`);
        return;
      }
      const n = size(op, args);
      items.push({ ln, raw: raw.trim(), op, args, pc, n });
      pc += 4 * n;
    });
    const words = [], listing = [];
    const reg = (a, ln) => { const r = regNum(a); if (r < 0) errors.push(`line ${ln + 1}: bad register '${a}'`); return Math.max(0, r); };
    const val = (a, ln) => { const v = num(a); if (v !== null) return v; if (sym[a] !== undefined) return sym[a]; errors.push(`line ${ln + 1}: unknown '${a}'`); return 0; };
    items.forEach((it) => {
      const { ln, op, args, pc: a } = it, out = [];
      const rt = (o2, rs, r, imm) => out.push(((o2 << 26) | (rs << 21) | (r << 16) | (imm & 0xffff)) >>> 0);
      if (op === "nop") out.push(0);
      else if (op === "move") out.push(((reg(args[1], ln) << 21) | (0 << 16) | (reg(args[0], ln) << 11) | 32) >>> 0);
      else if (op === "li" || op === "la") { const d = reg(args[0], ln), v = val(args[1], ln); if (it.n === 1) rt(8, 0, d, v); else { rt(15, 0, d, v >>> 16); rt(13, d, d, v & 0xffff); } }
      else if (op === "mul") out.push(((0x1c << 26) | (reg(args[1], ln) << 21) | (reg(args[2], ln) << 16) | (reg(args[0], ln) << 11) | 2) >>> 0);
      else if (R[op] !== undefined) {
        const f = R[op];
        if (op === "jr") out.push(((reg(args[0], ln) << 21) | 8) >>> 0);
        else if (["sll", "srl", "sra"].includes(op)) out.push(((reg(args[1], ln) << 16) | (reg(args[0], ln) << 11) | ((val(args[2], ln) & 31) << 6) | f) >>> 0);
        else if (["sllv", "srlv", "srav"].includes(op)) out.push(((reg(args[2], ln) << 21) | (reg(args[1], ln) << 16) | (reg(args[0], ln) << 11) | f) >>> 0);
        else if (op === "mult" || op === "div") out.push(((reg(args[0], ln) << 21) | (reg(args[1], ln) << 16) | f) >>> 0);
        else if (op === "mfhi" || op === "mflo") out.push(((reg(args[0], ln) << 11) | f) >>> 0);
        else out.push(((reg(args[1], ln) << 21) | (reg(args[2], ln) << 16) | (reg(args[0], ln) << 11) | f) >>> 0);
      } else if (I[op] !== undefined) {
        const o2 = I[op];
        if (op === "beq" || op === "bne") { const t = val(args[2], ln); rt(o2, reg(args[0], ln), reg(args[1], ln), (t - (a + 4)) >> 2); }
        else if (op === "lui") rt(o2, 0, reg(args[0], ln), val(args[1], ln));
        else if (["lw", "sw", "lb", "lbu", "sb"].includes(op)) {
          const mm = /^(-?[\w]+)?\((\$\w+)\)$/.exec(args[1] || "");
          if (mm) rt(o2, reg(mm[2], ln), reg(args[0], ln), mm[1] ? val(mm[1], ln) : 0);
          else rt(o2, 28, reg(args[0], ln), val(args[1], ln) - GP);
        } else rt(o2, reg(args[1], ln), reg(args[0], ln), val(args[2], ln));
      } else if (J[op] !== undefined) out.push(((J[op] << 26) | ((val(args[0], ln) >>> 2) & 0x3ffffff)) >>> 0);
      else errors.push(`line ${ln + 1}: unknown instruction '${op}'`);
      out.forEach((w, k) => { words.push(w); listing.push({ addr: a + 4 * k, word: w, src: k === 0 ? it.raw : "" }); });
    });
    return { text: TEXT, words, listing, sym, dataBytes, errors };
  }

  /* ---------- machine ---------- */
  class Machine {
    constructor() { this.reset(); }
    reset() { this.mem = new Map(); this.r = new Int32Array(32); this.pc = 0x00400000; this.hi = 0; this.lo = 0; this.count = 0; this.halted = false; this.last = null; this.r[28] = 0x10008000; this.r[29] = 0x7ffffffc; this.r[31] = 0; }
    rb(a) { return this.mem.get(a >>> 0) || 0; }
    wb(a, v) { this.mem.set(a >>> 0, v & 255); }
    rw(a) { return (this.rb(a) | (this.rb(a + 1) << 8) | (this.rb(a + 2) << 16) | (this.rb(a + 3) << 24)) | 0; }
    ww(a, v) { for (let k = 0; k < 4; k++) this.wb(a + k, (v >>> (8 * k)) & 255); }
    load(img) { img.words.forEach((w, i) => this.ww(img.text + 4 * i, w)); img.dataBytes.forEach(([a, b]) => this.wb(a, b)); this.pc = img.sym.main ?? img.text; this.end = img.text + 4 * img.words.length; }
    step() {
      if (this.halted) return null;
      const pc = this.pc, w = this.rw(pc) >>> 0, op = w >>> 26, rs = (w >>> 21) & 31, rt = (w >>> 16) & 31, rd = (w >>> 11) & 31, sh = (w >>> 6) & 31, fn = w & 63, imm = sx16(w & 0xffff), ch = new Set();
      let next = pc + 4, note = "";
      const set = (r, v) => { if (r !== 0) { this.r[r] = v | 0; ch.add(r); } };
      const A = this.r[rs], B = this.r[rt];
      if (op === 0) {
        switch (FN[fn]) {
          case "add": case "addu": set(rd, A + B); break; case "sub": case "subu": set(rd, A - B); break;
          case "and": set(rd, A & B); break; case "or": set(rd, A | B); break; case "xor": set(rd, A ^ B); break; case "nor": set(rd, ~(A | B)); break;
          case "slt": set(rd, A < B ? 1 : 0); break; case "sltu": set(rd, (A >>> 0) < (B >>> 0) ? 1 : 0); break;
          case "sll": set(rd, B << sh); break; case "srl": set(rd, B >>> sh); break; case "sra": set(rd, B >> sh); break;
          case "sllv": set(rd, B << (A & 31)); break; case "srlv": set(rd, B >>> (A & 31)); break; case "srav": set(rd, B >> (A & 31)); break;
          case "jr": next = A >>> 0; note = `jump to ${hx(next)}`; break;
          case "mult": { const p = BigInt(A) * BigInt(B); this.lo = Number(BigInt.asIntN(32, p)); this.hi = Number(BigInt.asIntN(32, p >> 32n)); break; }
          case "div": if (B) { this.lo = (A / B) | 0; this.hi = A % B; } break;
          case "mfhi": set(rd, this.hi); break; case "mflo": set(rd, this.lo); break;
          default: note = "unsupported";
        }
      } else if (op === 0x1c && fn === 2) set(rd, Math.imul(A, B));
      else switch (OP[op]) {
        case "addi": case "addiu": set(rt, A + imm); break; case "slti": set(rt, A < imm ? 1 : 0); break; case "sltiu": set(rt, (A >>> 0) < (imm >>> 0) ? 1 : 0); break;
        case "andi": set(rt, A & (w & 0xffff)); break; case "ori": set(rt, A | (w & 0xffff)); break; case "xori": set(rt, A ^ (w & 0xffff)); break;
        case "lui": set(rt, (w & 0xffff) << 16); break;
        case "lw": { const a = (A + imm) >>> 0; set(rt, this.rw(a)); note = `read ${hx(a)}`; break; }
        case "lb": { const a = (A + imm) >>> 0, b = this.rb(a); set(rt, b & 128 ? b - 256 : b); note = `read byte ${hx(a)}`; break; }
        case "lbu": { const a = (A + imm) >>> 0; set(rt, this.rb(a)); note = `read byte ${hx(a)}`; break; }
        case "sw": { const a = (A + imm) >>> 0; this.ww(a, B); ch.add("m" + a); note = `write ${hx(a)}`; break; }
        case "sb": { const a = (A + imm) >>> 0; this.wb(a, B); ch.add("m" + (a & ~3)); note = `write byte ${hx(a)}`; break; }
        case "beq": if (A === B) { next = pc + 4 + imm * 4; note = "taken"; } else note = "not taken"; break;
        case "bne": if (A !== B) { next = pc + 4 + imm * 4; note = "taken"; } else note = "not taken"; break;
        case "j": next = ((pc + 4) & 0xf0000000) | ((w & 0x3ffffff) << 2); break;
        case "jal": set(31, pc + 4); next = ((pc + 4) & 0xf0000000) | ((w & 0x3ffffff) << 2); break;
        default: note = "unsupported";
      }
      this.pc = next >>> 0; this.count++;
      if (this.pc === 0 || (this.pc >= this.end && this.pc < 0x10000000) || note === "unsupported") this.halted = true;
      this.last = { pc, w, text: disasm(w, pc), ch, note };
      return this.last;
    }
  }

  /* ---------- widget ---------- */
  function sim(host, o = {}) {
    const m = new Machine();
    let img = null, trace = [];
    const wrap = el(`<div class="lc3" style="min-width:0;max-width:100%;display:grid;gap:8px"></div>`);
    const list = el(`<div class="tbl" style="max-height:${o.listHeight || 320}px;overflow:auto"></div>`), regs = el(`<div></div>`), info = el(`<div></div>`), memv = el(`<div class="tbl"></div>`), trv = el(`<div class="tbl" style="max-height:240px;overflow:auto"></div>`);
    const bStep = el(`<button type="button" class="btn primary">Step</button>`), bRun = el(`<button type="button" class="btn">Run</button>`), bReset = el(`<button type="button" class="btn">Reset</button>`);
    const row = el(`<div class="row"></div>`); row.append(bStep, bRun, bReset);
    const shown = o.regs || [2, 4, 5, 8, 9, 16, 17, 29, 31];
    function load() { img = assemble(o.src, o); m.reset(); if (!img.errors.length) { m.load(img); if (o.init) o.init(m); } trace = []; draw(); }
    function draw() {
      if (img.errors.length) { list.innerHTML = `<span class="verdict no">${esc(img.errors.slice(0, 3).join(" · "))}</span>`; return; }
      const ch = (m.last && m.last.ch) || new Set();
      list.innerHTML = `<table><thead><tr><th>Address</th><th>Machine code</th><th>Assembly</th></tr></thead><tbody>${img.listing.map((r) => `<tr${r.addr === m.pc && !m.halted ? ' data-cur style="background:var(--accent-soft)"' : ""}><td class="mono">${hx(r.addr)}</td><td class="mono">${hx(r.word)}</td><td><code>${esc(r.src.replace(/#.*$/, "").trim() || disasm(r.word, r.addr))}</code></td></tr>`).join("")}</tbody></table>`;
      { const cur = list.querySelector("[data-cur]"); if (cur) list.scrollTop = Math.max(0, cur.offsetTop - list.clientHeight / 3); }
      regs.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:6px">${shown.map((r) => `<div style="border:1px solid var(--line);border-radius:8px;padding:4px 8px;background:${ch.has(r) ? "var(--accent-soft)" : "var(--card)"}"><b>${RN[r]}</b> <span class="mono">${o.hex === false ? m.r[r] : hx(m.r[r])}</span>${o.hex === false ? "" : `<br><span class="m" style="font-size:13px">${m.r[r]}</span>`}</div>`).join("")}<div style="border:1px solid var(--line);border-radius:8px;padding:4px 8px"><b>PC</b> <span class="mono">${hx(m.pc)}</span></div><div class="m" style="padding:4px 8px">${m.count} instructions${m.halted ? " · done" : ""}</div></div>`;
      info.innerHTML = m.last ? `<p><b>${esc(m.last.text)}</b> at ${hx(m.last.pc)}${m.last.note ? ` · ${esc(m.last.note)}` : ""}</p>` : `<p class="aside">Press <b>Step</b> to run the highlighted instruction.</p>`;
      if (o.watch) memv.innerHTML = `<table><thead><tr><th>Memory</th><th>Word</th></tr></thead><tbody>${o.watch.map(([lab, ad]) => { const a = typeof ad === "string" ? img.sym[ad] : typeof ad === "function" ? ad(m) : ad; return `<tr><td>${lab} <span class="mono">${hx(a)}</span></td><td class="mono"${ch.has("m" + a) ? ' style="background:var(--accent-soft)"' : ""}>${hx(m.rw(a))} = ${m.rw(a)}</td></tr>`; }).join("")}</tbody></table>`;
      if (o.trace) trv.innerHTML = `<table><thead><tr><th>PC</th>${o.trace.map((r) => `<th>${RN[r]}</th>`).join("")}</tr></thead><tbody>${trace.map(([p, v]) => `<tr><td class="mono">${hx(p)}</td>${v.map((x) => `<td class="mono">${x}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    }
    const log = () => { if (o.trace) trace.push([m.pc, o.trace.map((r) => m.r[r])]); };
    bStep.addEventListener("click", () => { if (m.halted || img.errors.length) return; m.step(); log(); draw(); });
    bRun.addEventListener("click", () => { if (m.halted || img.errors.length) return; let n = 0; const bp = new Set((o.breakpoints || []).map((b) => (typeof b === "string" ? img.sym[b] : b))); do { m.step(); n++; } while (!m.halted && n < (o.maxSteps || 5000) && !bp.has(m.pc)); log(); draw(); });
    bReset.addEventListener("click", load);
    wrap.append(list, row, info, regs);
    if (o.watch) wrap.append(memv);
    if (o.trace) wrap.append(el(`<p class="aside">Trace:</p>`), trv);
    host.append(wrap);
    load();
    return { machine: m, reload: load };
  }

  window.MIPS = { assemble, disasm, fields, fieldsHTML, Machine, sim, hx, bin, RN, regNum };
})();
