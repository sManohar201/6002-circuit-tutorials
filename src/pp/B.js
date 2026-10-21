(function () {
  const { slider, toggle, readout, el } = Course;
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const asm = (t) => Digital.listing(t, { comment: ";" });
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const hx = (v, n) => v.toString(16).toUpperCase().padStart(n, "0");
  const box = (txt, on, w = 46) => `<span style="display:inline-block;min-width:${w}px;padding:6px 4px;margin:2px;text-align:center;border-radius:6px;border:1px solid var(--line);font-family:var(--mono);${on ? "background:var(--accent);color:var(--paper);font-weight:700" : "background:var(--paper)"}">${txt}</span>`;

  /* ---------- widgets ---------- */
  // Figure B.1, as bar lengths: how wide each x86 data type is next to the LC-3's one 16-bit type
  function typeBars(host) {
    const rows = [
      ["LC-3: 2's complement integer", 16, true],
      ["x86: integer / unsigned (8, 16, 32 bits)", 32],
      ["x86: BCD and packed BCD", 32],
      ["x86: floating point (32, 64, 80 bits)", 80],
      ["x86: MMX (64-bit vector)", 64],
      ["x86: SSE / AVX vectors", 512],
    ];
    host.append(el(`<div style="display:grid;gap:6px">${rows.map(([lab, b, lc]) => `<div><div class="aside" style="margin:0 0 2px">${lab}: up to ${b} bits</div><div style="height:14px;border-radius:4px;width:${Math.max(4, (b / 512) * 100)}%;background:${lc ? "var(--accent)" : "var(--muted)"}"></div></div>`).join("")}</div>`));
  }

  // Saturating vs normal arithmetic on the book's 0-9 grayness scale
  function saturate(host) {
    const out = el(`<div></div>`);
    let a = 7, b = 5;
    const sw = (d, lab) => `<div style="text-align:center"><div style="width:56px;height:56px;border-radius:8px;border:1px solid var(--line);background:hsl(0 0% ${100 - d * 10}%)"></div><div class="aside" style="margin:4px 0 0">${lab}<br><b>${d}</b></div></div>`;
    const draw = () => {
      const wrap = (a + b) % 10, sat = Math.min(9, a + b);
      out.innerHTML = `<div class="row" style="gap:14px;align-items:flex-start;flex-wrap:wrap">${sw(a, "start")}${sw(b, "add")}${sw(wrap, "normal")}${sw(sat, "saturating")}</div>` +
        readout([["normal arithmetic", `${a} + ${b} = ${wrap}${a + b > 9 ? " (carry 1)" : ""}`], ["saturating", `${a} + ${b} = ${sat}`]]) +
        (a + b > 9 ? `<p>The normal sum wrapped around and came out <b>lighter</b> than either input. Saturating arithmetic sticks at 9.</p>` : `<p>No overflow, so both kinds of arithmetic agree.</p>`);
    };
    host.append(slider({ id: "satA", label: "grayness of the pixel", min: 0, max: 9, step: 1, value: a, show: (v) => Math.round(v) }, (v) => { a = Math.round(v); draw(); }).el,
      slider({ id: "satB", label: "darkness to add", min: 0, max: 9, step: 1, value: b, show: (v) => Math.round(v) }, (v) => { b = Math.round(v); draw(); }).el, out);
    draw();
  }

  // Three-address vs two-address, load-store vs memory operands
  function twoAddr(host) {
    const jobs = [
      ["A = A + B", `ADD R1, R1, R2`, `ADD AX, BX`, "Same count. The x86 form names AX once; it's both a source and the destination."],
      ["C = A + B, keep A", `ADD R3, R1, R2`, `MOV CX, AX     ; copy A first
ADD CX, BX`, "x86 would overwrite a source, so it copies A first: one extra instruction."],
      ["X = X + B  (X in memory)", `LD  R1, X
ADD R1, R1, R2
ST  R1, X`, `ADD [X], BX`, "The LC-3 is load-store: it must load X into a register, add, and store. The x86 reads memory, adds and writes memory in one instruction."],
    ];
    const out = el(`<div></div>`);
    const draw = (i) => {
      const [, l, x, note] = jobs[i], n = (s) => s.split("\n").length;
      out.innerHTML = `<div class="two"><div class="tile" style="min-width:0"><h3>LC-3 · ${n(l)} instr.</h3>${asm(l)}</div><div class="tile" style="min-width:0"><h3>x86 · ${n(x)} instr.</h3>${asm(x)}</div></div><p>${note}</p>`;
    };
    host.append(toggle(jobs.map((j) => j[0]), draw), out);
    draw(0);
    host.append(el(`<p class="aside">A sketch, not the book's code: A, B and C sit in R1, R2, R3 on the LC-3 and in AX, BX, CX on the x86.</p>`));
  }

  // A 32-bit value in byte-addressable memory
  function bytesWidget(host) {
    const V = 0x12345678, out = el(`<div></div>`);
    const draw = (sel) => {
      const rows = [3, 2, 1, 0].map((k) => {
        const by = (V >>> (8 * k)) & 255;
        return `<tr style="${sel === k ? "background:var(--accent);color:var(--paper)" : ""}"><td>X+${k}</td><td>x${hx(by, 2)}</td><td>bits [${8 * k + 7}:${8 * k}]</td></tr>`;
      }).join("");
      out.innerHTML = `<div class="tbl"><table style="font-family:var(--mono)"><thead><tr><th>Address</th><th>Byte</th><th>Holds</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    };
    host.append(el(`<p>The 32-bit value <b>x12345678</b> stored at address X. Click a byte:</p>`));
    const r = el(`<div class="row"></div>`);
    [0, 1, 2, 3].forEach((k) => { const b = btn(`X+${k}`); b.addEventListener("click", () => draw(k)); r.append(b); });
    host.append(r, out);
    draw(0);
  }

  // Segmentation: offset + segment base, checked against the limit
  function segWidget(host) {
    const BASE = 0x40000, LIMIT = 0xFFF, out = el(`<div></div>`);
    let off = 0x200;
    const draw = () => {
      const ok = off <= LIMIT;
      out.innerHTML = readout([["offset from the addressing mode", "x" + hx(off, 4)], ["segment base (from DS's descriptor)", "x" + hx(BASE, 5)], ["segment limit", "x" + hx(LIMIT, 4)], ["memory address", ok ? "x" + hx(BASE + off, 5) : "—"]]) +
        `<div style="position:relative;height:26px;border-radius:6px;background:var(--line);margin:8px 0"><div style="position:absolute;left:0;top:0;bottom:0;width:${(LIMIT / 0x1FFF) * 100}%;background:var(--muted);opacity:.45;border-radius:6px"></div><div style="position:absolute;top:-3px;bottom:-3px;width:4px;left:calc(${(off / 0x1FFF) * 100}% - 2px);background:${ok ? "var(--accent)" : "var(--bad,#c33)"}"></div></div>` +
        `<p>${ok ? "Inside the segment: the access goes ahead at base + offset." : "<b>Past the limit.</b> The hardware refuses the access, protecting whatever lies beyond this segment."}</p>`;
    };
    host.append(slider({ id: "segOff", label: "offset", min: 0, max: 0x1FFF, step: 16, value: off, show: (v) => "x" + hx(Math.round(v), 4) }, (v) => { off = Math.round(v); draw(); }).el, out);
    draw();
    host.append(el(`<p class="aside">Made-up base and limit; the real ones live in the segment descriptor, which DS selects.</p>`));
  }

  // The register nest: RAX ⊃ EAX ⊃ AX ⊃ AH, AL
  function regNest(host) {
    const B = ["11", "22", "33", "44", "55", "66", "77", "88"]; // RAX = x1122334455667788, byte 7 first
    const names = [["RAX", [0, 8], "all 64 bits"], ["EAX", [4, 8], "bits [31:0]"], ["AX", [6, 8], "bits [15:0]"], ["AH", [6, 7], "bits [15:8]"], ["AL", [7, 8], "bits [7:0]"]];
    const out = el(`<div></div>`);
    const draw = (i) => {
      const [n, [a, b], what] = names[i];
      out.innerHTML = `<div style="display:flex;flex-wrap:wrap">${B.map((x, k) => box(x, k >= a && k < b, 40)).join("")}</div>` + readout([[n, "x" + B.slice(a, b).join("")], ["which bits", what]]);
    };
    host.append(el(`<p>RAX holds <b>x1122334455667788</b>. Pick a name:</p>`), toggle(names.map((x) => x[0]), draw), out);
    draw(0);
  }

  // Click through the bytes of Figures B.6 and B.7
  const REG = ["EAX", "ECX", "EDX", "EBX", "ESP", "EBP", "ESI", "EDI"];
  const b2 = (v, n) => v.toString(2).padStart(n, "0");
  function decoder(host) {
    const INS = [
      ["Figure B.6: ADD with ES override", [
        ["x26", "Prefix", "Segment override: use ES instead of the default DS."],
        ["x03", "Opcode", "ADD r32, r/m32: a 32-bit register gets register + (register or memory)."],
        ["x84", "ModR/M", null, 0x84],
        ["x99", "SIB", null, 0x99, "sib"],
        ["disp32", "Displacement", "Four bytes, added in because Mod = 10."],
      ]],
      ["Figure B.7: ADD EAX, $5", [
        ["x83", "Opcode", "ADD r/m32, imm8: an 8-bit immediate, sign-extended to 32 bits."],
        ["xC0", "ModR/M", null, 0xC0],
        ["x05", "Immediate", "imm8 = 5, sign-extended to 32 bits before the add."],
      ]],
    ];
    const out = el(`<div></div>`), strip = el(`<div style="display:flex;flex-wrap:wrap"></div>`);
    let cur = 0;
    const explain = (f) => {
      if (f[2]) return `<p><b>${f[1]}.</b> ${f[2]}</p>`;
      const v = f[3];
      if (f[4] === "sib") {
        const sc = v >> 6, ix = (v >> 3) & 7, bs = v & 7;
        return `<p><b>SIB = ${b2(sc, 2)} ${b2(ix, 3)} ${b2(bs, 3)}</b></p>` + readout([["scale", `${b2(sc, 2)} → ×${1 << sc}`], ["index", `${b2(ix, 3)} → ${REG[ix]}`], ["base", `${b2(bs, 3)} → ${REG[bs]}`]]) + `<p>Address part: ${REG[ix]} × ${1 << sc} + ${REG[bs]}.</p>`;
      }
      const md = v >> 6, rg = (v >> 3) & 7, rm = v & 7;
      const rmTxt = md === 3 ? `register ${REG[rm]}` : rm === 4 ? "an SIB byte follows" : `memory at [${REG[rm]}]`;
      const dispTxt = md === 0 ? "no displacement" : md === 1 ? "8-bit displacement" : md === 2 ? "32-bit displacement" : "no memory operand";
      const regTxt = cur === 1 ? `${b2(rg, 3)}: not a register here. Opcode x83 uses these bits as a sub-opcode, and 000 means ADD.` : `${b2(rg, 3)} → ${REG[rg]}, the register operand (and the destination).`;
      return `<p><b>ModR/M = ${b2(md, 2)} ${b2(rg, 3)} ${b2(rm, 3)}</b></p>` + readout([["Mod", `${b2(md, 2)} → ${dispTxt}`], ["Reg", regTxt], ["R/M", `${b2(rm, 3)} → ${rmTxt}`]]);
    };
    const draw = (k) => {
      const parts = INS[cur][1];
      strip.innerHTML = "";
      parts.forEach((f, i) => {
        const b = el(`<button type="button" class="btn" aria-pressed="${i === k}" style="font-family:var(--mono)">${f[0]}<br><span class="aside" style="font-size:11px">${f[1]}</span></button>`);
        b.addEventListener("click", () => draw(i));
        strip.append(b);
      });
      out.innerHTML = explain(parts[k]);
    };
    host.append(toggle(INS.map((x) => x[0]), (i) => { cur = i; draw(0); }), strip, out);
    draw(0);
  }

  /* ---------- listings ---------- */
  const FIGB8 = `#include <stdio.h>
void UpcaseString(char inputString[]);
int main (void)
{
  char string[8];
  scanf("%s", string);
  UpcaseString(string);
}
void UpcaseString(char inputString[])
{
  int i = 0;
  while(inputString[i]) {
    if (('a' <= inputString[i]) && (inputString[i] <= 'z'))
      inputString[i] = inputString[i] - ('a' - 'A');
    i++;
  }
}`;
  const LOOP_LC3 = `CONVERT ADD   R3, R1, R2 ; base + i
        LDR   R4, R3, #0
        BRz   DONE       ; NULL?
        LD    R5, a
        ADD   R5, R5, R4 ; < 'a'?
        BRn   NEXT
        LD    R5, z
        ADD   R5, R4, R5 ; > 'z'?
        BRp   NEXT
        LD    R5, asubA
        ADD   R4, R4, R5 ; -32
        STR   R4, R3, #0
NEXT    ADD   R1, R1, #1 ; i++
        STR   R1, R6, #4
        BRnzp CONVERT
  ...
a       .FILL #-97
z       .FILL #-122
asubA   .FILL #-32`;
  const LOOP_X86 = `$L403: mov al, BYTE PTR [ecx]
       cmp al, 97     ; 'a'
       jl  SHORT $L405
       cmp al, 122    ; 'z'
       jg  SHORT $L405
       sub al, 32
       mov BYTE PTR [ecx], al
$L405: inc ecx        ; i++
       mov al, BYTE PTR [ecx]
       test al, al
       jne SHORT $L403`;

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Same ingredients, bigger menu", mins: 15,
    blurb: "The x86 is built from the same parts as the LC-3: data types, opcodes, addressing modes. It just has far more of each.",
    takeaway: "An ISA specifies address space and addressability, number and size of registers, instruction format, opcodes, data types and addressing modes. The PC's ISA is the x86: the 8086 (1979) used 16-bit addresses and data like the LC-3; today 64 bits (32-bit mode for old programs), with vector extensions of 128, 256 and 512 bits. Implementations: 386, 486, Pentium … Nehalem (2008), Haswell (2013), Coffee Lake (2018). LC-3: 1 data type (16-bit 2's complement), 15 opcodes, 3 memory addressing modes (PC-relative LD/ST, indirect LDI/STI, register+offset LDR/STR). x86: more than a dozen data types (8/16/32-bit integers and unsigned, BCD and packed BCD, 32/64/80-bit floating point, bit strings, MMX 64-bit vectors, SSE/AVX up to 512 bits), more than a thousand opcodes, more than two dozen addressing modes. Instruction categories: operate, data movement, control, plus system instructions (security, system management, performance monitoring). Operates: SUB, MUL, DIV, INC, DEC, ADC (add with carry, for integers longer than the hardware supports), OR, XOR, AND-NOT, shifts and rotates, conversions; per-type opcodes (FADD, FMUL, FSIN, FSQRT for floating point; MMX PADDS, PANDN). Data movement: MOV, XCHG, PUSHA, PUSH, POP, string moves (MOVS, REP MOVS, LODS), IN/OUT, CMOVcc, LEA; no LDI/STI. Control: Jcc, JMP, CALL, RET, LOOP, INT n (like TRAP). (Table B.3 describes LOOP as also testing ZF = 1; that's LOOPE. Plain LOOP only decrements ECX and branches while ECX ≠ 0.)",
    steps: [
      { k: "learn", title: "Same ingredients", b: [
        `<p>An ISA always specifies the same things: memory (address space, addressability), registers, instruction format, <b>opcodes</b>, <b>data types</b> and <b>addressing modes</b>. The x86 in your PC has all the LC-3's ingredients, in much larger quantities.</p>`,
        `<div class="tbl"><table><thead><tr><th></th><th>LC-3</th><th>x86</th></tr></thead><tbody>
          <tr><td>Data types</td><td>1</td><td>more than a dozen</td></tr>
          <tr><td>Opcodes</td><td>15</td><td>more than a thousand</td></tr>
          <tr><td>Addressing modes</td><td>3</td><td>more than two dozen</td></tr>
          <tr><td>Normal data size</td><td>16 bits</td><td>16 (8086, 1979) → 64 bits today</td></tr></tbody></table></div>`,
        `<p>The 8086 of 1979 was a 16-bit machine, like the LC-3. Intel kept every later chip (386, Pentium, Core i7…) able to run its programs, which is why a 64-bit x86 still has a 32-bit mode.</p>`,
      ]},
      { k: "play", title: "Data types", b: [
        `<p>A data type exists in an ISA when there are opcodes that operate on it. Figure B.1 shows a sample. Here is how wide each one gets:</p>`,
        typeBars,
        `<p>Scientific code needs floating point; multimedia needs short vectors; old business programs need decimal (BCD).</p>`,
      ]},
      { k: "learn", title: "Opcodes: four kinds", b: [
        `<p>The LC-3's three kinds of instruction are still there: <b>operate</b>, <b>data movement</b> and <b>control</b>. The x86 adds a fourth kind for the operating system (security, system management, performance counters), which this appendix ignores.</p>`,
        `<div class="tbl"><table><thead><tr><th>LC-3 has</th><th>x86 adds, for example</th></tr></thead><tbody>
          <tr><td>ADD, AND, NOT</td><td>SUB, MUL, DIV, INC, DEC, ADC, OR, XOR, shifts; FADD, FSIN; PADDS</td></tr>
          <tr><td>LD, LDR, ST, STR, LDI, STI</td><td>MOV, XCHG, PUSH, POP, PUSHA, MOVS, IN, OUT, CMOVcc (no LDI/STI)</td></tr>
          <tr><td>BR, JMP, JSR, TRAP, RTI</td><td>Jcc, CALL, RET, LOOP, INT n (≈ TRAP)</td></tr></tbody></table></div>`,
        `<p>Why bother, when the LC-3 can multiply with a loop of ADDs? Because a real processor can't afford to be that slow.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Does the LC-3 have an opcode for this?", bins: ["LC-3 has it", "x86 only"], items: [
          ["Subtract", 1, "The LC-3 negates (NOT, ADD 1) and then adds."],
          ["Indirect load (LDI)", 0, "The x86 has no LDI/STI."],
          ["Push all registers at once", 1, "PUSHA."],
          ["Call an OS service routine", 0, "TRAP; the x86 calls it INT n."],
          ["Copy only if a condition holds", 1, "CMOVcc."],
        ]},
        `<p class="aside">One slip to notice: Table B.3 says LOOP branches when ECX ≠ 0 <i>and</i> ZF = 1. That's the LOOPE variant. Plain LOOP only counts ECX down.</p>`,
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Arithmetic that fits the job", mins: 10,
    blurb: "Saturating arithmetic for pixels, and ADC for integers longer than the hardware.",
    takeaway: "Each x86 data type has its own opcodes. Multimedia (MMX) instructions often need saturating arithmetic: with grayness 0 (white) to 9 (black), 7 + 5 = 2 with a carry in normal arithmetic, lighter than either input, which is wrong for an image; saturating arithmetic sticks at the maximum: 7 + 5 = 9 and 9 + n = 9. PADDS adds packed MMX values with saturation. ADC adds two operands plus the carry from the previous add (kept in the CF flag), which lets software build integers longer than the ISA supports: add the low parts with ADD, then the high parts with ADC.",
    steps: [
      { k: "predict", title: "Darker plus darker", b: [
        `<p>Grayness runs from 0 (white) to 9 (black). A pixel at 7 gets 5 more units of darkness. With ordinary one-digit addition, what is the result?</p>`,
        { t: "reveal", label: "Show me", html: `<p>7 + 5 = 12: the digit is <b>2</b>, with a carry. The pixel got <i>lighter</i>. For pictures and sound, wrapping around is the wrong answer.</p>` },
      ]},
      { k: "play", title: "Saturating arithmetic", b: [
        saturate,
        `<p>With saturating arithmetic, results stick at the top: 7 + 5 = 9, and 9 + anything = 9. The x86's MMX instruction PADDS adds packed values this way.</p>`,
      ]},
      { k: "learn", title: "ADC: longer integers", b: [
        `<p>To add two numbers twice as wide as a register, add the low halves with ADD. The carry out is kept in a flag, CF. Then add the high halves <b>plus that carry</b> with ADC (add with carry). Repeat for even longer numbers.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "On the 0–9 scale with saturating arithmetic, what is 6 + 6?", a: 9, tol: 0, why: "12 is past the top, so the result sticks at 9." },
        { t: "mcq", q: "Adding two 64-bit numbers on a 32-bit machine, why must the second add be ADC rather than ADD?", opts: [["The low halves may produce a carry that belongs in the high half", true, "ADC adds the carry kept in CF from the first add."], ["ADC is faster", false, "It's about correctness, not speed."], ["ADD can't use 32-bit registers", false, "It can; it just ignores the earlier carry."]] },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Two addresses and memory operands", mins: 15,
    blurb: "The LC-3 names three operands and only computes on registers. The x86 names two and can compute straight on memory.",
    takeaway: "The LC-3 is a three-address ISA: ADD R1,R1,R2 states both sources and the destination explicitly, even when one register plays two roles. The x86 is mostly two-address (except SSE/AVX instructions): ADD AX,BX adds AX and BX and puts the result in AX, so that source is lost; if it is needed later it must be saved first. The LC-3 operate instructions take sources from registers and write a register: a load-store ISA, needing LD before and ST after to work on memory. An x86 instruction can read one source from memory and/or write the result to memory, all in one instruction; the x86 is not a load-store ISA.",
    steps: [
      { k: "learn", title: "Three addresses vs two", b: [
        `<p>The LC-3 is a <b>three-address</b> ISA: ADD names two sources and a destination, even when they're the same register.</p>`,
        asm(`ADD R1, R1, R2   ; LC-3: R1 = R1 + R2`),
        `<p>The x86 is mostly <b>two-address</b>. One operand is both a source and the destination:</p>`,
        asm(`ADD AX, BX       ; x86: AX = AX + BX`),
        `<p>The old value of AX is gone afterwards. If you still need it, copy it somewhere first.</p>`,
      ]},
      { k: "learn", title: "Load-store or not", b: [
        `<p>LC-3 operate instructions only work on registers. To change a value in memory you load it, operate, and store it back. That's a <b>load-store</b> ISA.</p>`,
        `<p>An x86 instruction can take one operand straight from memory and write the result back to memory. Not load-store.</p>`,
      ]},
      { k: "play", title: "Count the instructions", b: [
        twoAddr,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "After the x86 instruction <code>ADD AX, BX</code>, which original value is no longer available?", opts: [["AX's", true, "AX was overwritten with the sum."], ["BX's", false, "BX is only read."], ["Both", false, "BX is unchanged."]] },
        { t: "mcq", q: "Which statement is true of a load-store ISA like the LC-3?", opts: [["Arithmetic reads and writes only registers; memory is reached only by loads and stores", true, "That's the definition."], ["Every instruction must load and then store", false, "Branches, for example, do neither."], ["It has no memory operands at all", false, "Loads and stores have them."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does it cost the x86 programmer that ADD has only two operands, and what does the x86 gain by not being load-store?", model: "With two operands, one source is also the destination, so its old value is destroyed; if it's needed later, it must be copied first, which takes an extra instruction. In return, an x86 instruction can read an operand from memory, operate on it and write the result to memory in a single instruction, where the LC-3 needs a load, the operation and a store." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Memory: bytes and segments", mins: 15,
    blurb: "Every x86 address names one byte, a 32-bit value spans four of them, and addresses are checked against a segment.",
    takeaway: "LC-3 memory: 2^16 locations of 16 bits each (16-bit address space, 16-bit addressability). x86: a 64-bit address space and 8-bit addressability (byte-addressable); a 32-bit value takes four consecutive locations X, X+1, X+2, X+3 and its address is X; X holds bits [7:0], X+1 [15:8], X+2 [23:16], X+3 [31:24] (the least significant byte at the lowest address: little-endian). More than two dozen addressing modes. Segmentation protects memory: the address an instruction computes is an offset within a segment. Figure B.2: LC-3 LDR adds Base register + SEXT(offset6). x86 MOV computes register + displacement; the DS segment register holds a 16-bit selector that indexes the segment descriptor table (located by GDTR), giving a descriptor with segment base, segment limit and protection information; memory address = segment base + offset.",
    steps: [
      { k: "learn", title: "Addressability", b: [
        `<p>An LC-3 address names a 16-bit word: <b>16-bit addressability</b>. An x86 address names one <b>byte</b>: 8-bit addressability, or <b>byte-addressable</b>.</p>`,
        `<p>So a 32-bit x86 value occupies four addresses, X to X+3, and we call X its address.</p>`,
      ]},
      { k: "play", title: "Which byte is where?", b: [
        bytesWidget,
        `<p>The lowest address holds the least significant byte. (Harris & Harris call this <b>little-endian</b>.)</p>`,
        seenPP("Words and bytes in memory.", "../hh/06-architecture.html#p2", "Harris & Harris Ch 6"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A 32-bit value is stored at address X on the x86. Which bits are in location X+2?", opts: [["[23:16]", true, "X: [7:0], X+1: [15:8], X+2: [23:16], X+3: [31:24]."], ["[15:8]", false, "That's X+1."], ["[31:24]", false, "That's X+3."]] },
      ]},
      { k: "learn", title: "Segments", b: [
        `<p>On the x86, the address an instruction computes is only an <b>offset inside a segment</b>. Figure B.2 compares the two paths for register + offset:</p>`,
        `<div class="tbl"><table><tbody>
          <tr><td>LC-3 LDR</td><td>Base register + SEXT(offset6) → address</td></tr>
          <tr><td>x86 MOV</td><td>register + displacement → offset; DS selects a <b>segment descriptor</b> (base, limit, protection); address = base + offset</td></tr></tbody></table></div>`,
      ]},
      { k: "play", title: "Stay inside the segment", b: [
        segWidget,
        `<p>The limit is what makes segments a protection mechanism: an access past it isn't allowed. The full rules come later in your studies.</p>`,
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Registers and flags", mins: 15,
    blurb: "Sixteen 64-bit registers with nested names, a 64-bit instruction pointer, and flags where the LC-3 has N, Z, P.",
    takeaway: "LC-3 internal state: R0–R7 (16 bits), a 16-bit PC, a 16-bit PSR (privilege, priority, N Z P). x86 user-visible state: 64-bit application-visible registers, a 64-bit instruction pointer RIP, a 64-bit RFLAGS register, and 16-bit segment registers. In 64-bit mode, 16 general-purpose registers: RAX, RBX, RCX, RDX, RSP, RBP, RSI, RDI, R8–R15 (the text misprints RSI/ESI as RCI/ECI; Figure B.3 has it right). 32-bit mode uses EAX… = bits [31:0]; 16-bit AX… = bits [15:0]; 8-bit AL, BL, CL, DL = bits [7:0] and AH, BH, CH, DH = bits [15:8]. SIMD registers: XMM0–31 (128), YMM0–31 (256), ZMM0–31 (512). RIP ≈ PC (EIP = RIP[31:0] in 32-bit mode). SF and ZF match N and Z; there is no P flag, because P is redundant (P = not N and not Z). CF: carry of the last relevant operation (with ADC, longer integers). OF: overflow. DF: direction of string operations (the book has it reversed: DF = 0 means the string pointer is incremented, from low addresses up; DF = 1 decrements). IF ≈ the IE bit (interrupt enable; IF = 0 disables external interrupts). TF ≈ single-step mode, but in the ISA (trap after every instruction). Segment registers (protected mode): CS code, SS stack, DS, ES, FS, GS data; each points to a segment descriptor in the segment descriptor table.",
    steps: [
      { k: "learn", title: "The register file", b: [
        `<p>In 64-bit mode the x86 has <b>16 general-purpose registers</b> of 64 bits: RAX, RBX, RCX, RDX, RSP, RBP, RSI, RDI and R8–R15. The LC-3 has eight of 16 bits.</p>`,
        `<p>Older code still works because smaller pieces of each register have their own names.</p>`,
      ]},
      { k: "play", title: "Names inside names", b: [
        regNest,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "With RAX = x1122334455667788, what is in AH?", opts: [["x77", true, "AH is bits [15:8]: the second byte from the right."], ["x88", false, "That's AL, bits [7:0]."], ["x11", false, "That's the top byte of RAX; AH is inside AX."]] },
      ]},
      { k: "learn", title: "Flags vs condition codes", b: [
        `<div class="tbl"><table><thead><tr><th>x86 flag</th><th>LC-3 counterpart</th></tr></thead><tbody>
          <tr><td>SF (sign), ZF (zero)</td><td>N, Z</td></tr>
          <tr><td>none</td><td>P: redundant, since P = not N and not Z</td></tr>
          <tr><td>CF (carry)</td><td>none (used by ADC)</td></tr>
          <tr><td>OF (overflow)</td><td>none (Section 2.5.3's overflow, as a bit)</td></tr>
          <tr><td>IF (interrupt enable)</td><td>like the IE bit in KBSR/DSR</td></tr>
          <tr><td>TF (trap)</td><td>like the simulator's single-step, but built into the ISA</td></tr></tbody></table></div>`,
        `<p>The instruction pointer RIP plays the PC's role. CS, SS, DS, ES, FS and GS select the six active segments.</p>`,
      ]},
      { k: "bug", title: "Spot the mistake", b: [
        `<p>The book says: “If DF = 0, the string is processed from the high-address byte down (the pointer is decremented). If DF = 1, … from the low-address byte up.”</p>`,
        { t: "mcq", q: "Compare with Table B.2's description of MOVS. What's wrong?", opts: [["It's reversed: with DF = 0 the pointers are incremented (low addresses up); DF = 1 decrements", true, "Table B.2 says that after MOVS “ESI and EDI are both incremented”, which is the DF = 0 default. The paragraph swapped the two cases."], ["Nothing: DF = 0 means decrement", false, "Then MOVS's default behaviour in Table B.2 would be wrong."], ["DF doesn't affect string instructions", false, "That's exactly its job."]] },
        `<p class="aside">A smaller slip: the text lists the 64-bit registers as “RCI” and “ECI”. Figure B.3 has them right: RSI and ESI (source index).</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can the x86 do without a P flag?", model: "Because P carries no new information: a result is positive exactly when it is neither negative nor zero, so P can always be worked out from the sign flag and the zero flag. The LC-3 includes P only for the convenience of programmers and compilers." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Decoding an x86 instruction", mins: 20,
    blurb: "An LC-3 instruction is always 16 bits with the opcode on top. An x86 instruction is 1 to 15 bytes, built from up to six parts.",
    takeaway: "LC-3: always 16 bits, opcode in [15:12]. x86 (Figure B.5): prefixes (0–4 one-byte), opcode (1 or 2 bytes), ModR/M (if needed), SIB (if needed), displacement (0, 1, 2 or 4 bytes, sized by ModR/M), immediate (0, 1, 2 or 4 bytes, sized by the opcode, always last). The book says 1 to 16 bytes; the architectural limit is 15 (Harris & Harris 6.8.5). Prefixes override defaults: LOCK xF0 (exclusive use of shared memory), REP/REPE/REPNE xF2/xF3 (repeat string instruction, count in ECX), segment override x2E CS, x36 SS, x3E DS, x26 ES, x64 FS, x65 GS, operand size x66, address size x67. The opcode gives the operation, register vs memory operands, operand size, whether there's an immediate and its size; some opcodes use ModR/M bits [5:3] as extra opcode bits. ModR/M: Mod [7:6] and R/M [2:0] pick the addressing mode of a memory operand (Mod = 11: R/M is a register); Reg [5:3] is the other register operand or a sub-opcode. Table B.5: 00 011 000 = [EAX] with EBX; 01 010 000 = disp8[EAX] with EDX; 10 000 100 = disp32 plus SIB, with EAX; 11 001 110 = registers ESI and ECX. SIB = scale × index + base (Table B.6: 00 011 000 EBX + EAX; 01 000 001 2·EAX + ECX; 01 100 001 ECX; 10 110 010 4·ESI + EDX). Register numbers: 000 EAX, 001 ECX, 010 EDX, 011 EBX, 100 ESP, 101 EBP, 110 ESI, 111 EDI. Figure B.6: x26 x03 x84 x99 disp32 = ES-override ADD r32, m32: EAX + mem[ES: 4·EBX + ECX + disp32]. Figure B.7: x83 xC0 x05 = ADD EAX, $5 (imm8 sign-extended), like LC-3 ADD R0,R0,#5.",
    steps: [
      { k: "learn", title: "Six possible parts", b: [
        `<p>Every LC-3 instruction is 16 bits with the opcode in [15:12]. An x86 instruction (Figure B.5) is built from up to six parts:</p>`,
        `<div class="tbl"><table><thead><tr><th>Part</th><th>Size</th><th>Job</th></tr></thead><tbody>
          <tr><td>Prefixes</td><td>0–4 bytes</td><td>override defaults: LOCK, REP, segment, operand size, address size</td></tr>
          <tr><td>Opcode</td><td>1–2 bytes</td><td>operation, operand size, register or memory, immediate size</td></tr>
          <tr><td>ModR/M</td><td>0–1</td><td>where the operands are</td></tr>
          <tr><td>SIB</td><td>0–1</td><td>scale × index + base, for fancier addresses</td></tr>
          <tr><td>Displacement</td><td>0, 1, 2, 4</td><td>constant added into the address</td></tr>
          <tr><td>Immediate</td><td>0, 1, 2, 4</td><td>constant operand, always last</td></tr></tbody></table></div>`,
        `<p class="aside">The book says an instruction can be up to 16 bytes. The real limit is <b>15</b>, as Harris & Harris Section 6.8.5 says.</p>`,
      ]},
      { k: "learn", title: "The ModR/M byte", b: [
        `<p>Three fields: <b>Mod</b> [7:6], <b>Reg</b> [5:3], <b>R/M</b> [2:0].</p>`,
        `<ul><li>Mod = 00, 01 or 10: Mod and R/M together pick a memory addressing mode (no displacement, 8-bit, or 32-bit). R/M = 100 means “an SIB byte follows”.</li><li>Mod = 11: no memory operand; R/M names a register.</li><li>Reg names the other register. If the opcode needs only one operand, Reg becomes three extra opcode bits.</li></ul>`,
        `<p>Register numbers: 000 EAX, 001 ECX, 010 EDX, 011 EBX, 100 ESP, 101 EBP, 110 ESI, 111 EDI.</p>`,
      ]},
      { k: "play", title: "Take two instructions apart", b: [
        `<p class="aside">Pick an instruction, then click each byte.</p>`,
        decoder,
        `<p>Figure B.6 adds the memory word at ES:(4 × EBX + ECX + disp32) into EAX. Figure B.7 is the x86 version of LC-3 <code>ADD R0, R0, #5</code>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "How many bytes long is Figure B.6's instruction (prefix, opcode, ModR/M, SIB and a 4-byte displacement)?", a: 8, tol: 0, why: "1 + 1 + 1 + 1 + 4 = 8 bytes. Compare: every LC-3 instruction is 2 bytes." },
        { t: "mcq", q: "Why must an x86 processor partly decode an instruction before it even knows where the next one starts, when the LC-3 never has to?", opts: [["x86 lengths vary from 1 to 15 bytes; every LC-3 instruction is one 16-bit word", true, "So the x86 must parse prefixes, opcode and ModR/M to find the length. That's one reason x86 decoders are big."], ["The LC-3 has no labels", false, "It does."], ["x86 instructions are always 32 bits", false, "That's MIPS."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In the ModR/M byte, what decides whether an operand comes from memory or a register?", model: "The Mod field, bits [7:6]. If Mod is 11, there is no memory operand and the R/M field names a register. If Mod is 00, 01 or 10, Mod and R/M together pick a memory addressing mode, with no, an 8-bit or a 32-bit displacement, and R/M = 100 means an SIB byte follows. The Reg field names the other register operand, or extends the opcode when only one operand is needed." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "One program, two ISAs", mins: 15,
    blurb: "The book's uppercase converter in C, then as LC-3 and x86 assembly. Compare the loops line by line.",
    takeaway: "Figure B.8: C program; main reads a string with scanf and calls UpcaseString, which loops while inputString[i] != 0 and subtracts ('a' − 'A') from lowercase letters. Figure B.9: LC-3 code a compiler would generate: reads characters with IN until linefeed (ADD R2,R0,x-A tests for x0A) and stores a null; the loop computes base + index each time, loads the character, compares with 'a' and 'z' by adding constants −97 and −122 loaded from memory (.FILL, because they don't fit in imm5's −16..15), adds −32, stores, and writes i back to the stack frame. Figure B.10: x86 (32-bit mode): main reserves stack space with sub esp, 8, pushes arguments for scanf and UpcaseString (call), releases with add esp, 20; UpcaseString keeps a pointer in ECX instead of an index, compares bytes with immediates (cmp al, 97; jl; cmp al, 122; jg), sub al, 32, stores the byte, inc ecx, and tests the next byte (test al, al; jne). Per lowercase letter the x86 loop runs 11 instructions, the LC-3 loop 15.",
    steps: [
      { k: "learn", title: "The C program (Figure B.8)", b: [
        CT.code(FIGB8),
        seenPP("The same string loop and the run-time stack.", "16-pointers-arrays.html", "Chapter 16"),
      ]},
      { k: "play", title: "The two loops", b: [
        `<div class="two"><div class="tile" style="min-width:0"><h3>LC-3 (Figure B.9)</h3>${asm(LOOP_LC3)}</div><div class="tile" style="min-width:0"><h3>x86 (Figure B.10)</h3>${asm(LOOP_X86)}</div></div>`,
        `<p>Same algorithm, different tools. Look for three differences before you go on.</p>`,
        { t: "reveal", label: "Show three", html: `<ul><li><b>Constants.</b> x86 compares with an immediate (<code>cmp al, 97</code>). The LC-3 loads −97 from memory and adds, because its immediates are only 5 bits.</li><li><b>Index vs pointer.</b> The LC-3 adds the index to the base address every time (and stores i back to the stack frame). The x86 compiler just walks a pointer: <code>inc ecx</code>.</li><li><b>Bytes.</b> x86 loads and stores one byte (<code>BYTE PTR</code>, register AL). Each LC-3 character occupies a whole 16-bit word.</li></ul>` },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "For one lowercase letter, how many instructions does the LC-3 loop execute, from CONVERT through BRnzp CONVERT?", a: 15, tol: 0, why: "Every line from CONVERT to BRnzp runs: 15. The x86 loop runs 11 for the same letter." },
        { t: "mcq", q: "Why can't the LC-3 code just write <code>ADD R5, R4, #-97</code>?", opts: [["imm5 only holds −16 to 15", true, "So the compiler keeps −97 in memory (.FILL) and loads it."], ["ADD can't take negative immediates", false, "It can, within −16..15."], ["R4 holds an address, not a character", false, "R4 holds the character just loaded."]] },
      ]},
      { k: "why", title: "Why does the messy ISA win?", b: [
        `<p>The x86 is far more complicated to describe and to build than the LC-3, or than MIPS. It dominates anyway: four decades of programs still run on it, and each new chip kept them running. Every quirk you met today (segments, variable lengths, AH inside AX) is there because some old program depends on it.</p>`,
        { t: "say", q: "Name two ways the x86 loop is shorter than the LC-3 loop, and the ISA feature behind each.", model: "It compares the character with 'a' and 'z' using immediate operands directly in the compare instructions, because x86 immediates can be 8 or 32 bits, while the LC-3's 5-bit immediates force it to load the constants from memory. And it steps through the string with a pointer (inc ecx) and loads bytes directly, instead of recomputing base plus index and storing the index back to the stack frame each time." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ppB", eyebrow: "Patt & Patel · Appendix B", title: "From LC-3 to x86",
    intro: `<p>Seven parts. Everything you learned on the LC-3, held up against the x86 inside your PC: data types and opcodes, special arithmetic, two-address and memory operands, byte memory and segments, registers and flags, instruction encoding, and one program in both.</p><p>Nothing here needs memorizing; the goal is to see that a “real” ISA is the same ideas, scaled up. Arrow keys ← → move between steps.</p>`,
    after: `<p>This appendix has no exercises. If you want practice, take any small LC-3 program from Chapters 7–10 and sketch what its x86 version would look like: which instructions disappear, which constants become immediates, where bytes replace words.</p><p>Want to check a sketch? Paste it to Claude and ask for questions, not corrections.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7],
    summary: `
      <h3>Scale</h3>
      <p>LC-3: 1 data type, 15 opcodes, 3 addressing modes, 16-bit words. x86: a dozen+ types, 1000+ opcodes, two dozen+ modes, 64-bit (8086 of 1979 was 16-bit).</p>
      <h3>Style</h3>
      <p>Two-address (ADD AX, BX overwrites AX); memory operands (not load-store); byte-addressable, little-endian; segment base + offset, checked against a limit.</p>
      <h3>State</h3>
      <p>RAX…R15 with EAX/AX/AH/AL inside; RIP; RFLAGS: SF, ZF (no P), CF, OF, DF (0 = increment), IF, TF; CS SS DS ES FS GS.</p>
      <h3>Encoding</h3>
      <p>Prefixes, opcode, ModR/M (Mod Reg R/M), SIB (scale × index + base), displacement, immediate: 1 to 15 bytes.</p>`,
  };
  Course.start(window.CHAPTER);
})();
