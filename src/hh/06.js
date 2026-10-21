(function () {
  const { S, slider, toggle, readout, el } = Course;
  const { sv, listing } = Digital;
  const { sim, fieldsHTML, disasm, hx, bin, RN } = MIPS;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const seenPP = (html, href, where) => `<div class="key"><b>Seen in Patt & Patel:</b> ${html} <a href="../pp/${href}">${where} →</a></div>`;
  const seenHH = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const pre = (t) => `<pre class="code">${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`;
  const two = (c, m) => `<div class="two"><div class="tile"><h3>C</h3>${pre(c)}</div><div class="tile"><h3>MIPS assembly</h3>${pre(m)}</div></div>`;

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Architecture and the four principles", mins: 20,
    blurb: "The programmer's view of a computer. RISC vs CISC. MIPS's design principles.",
    takeaway: "Architecture = the programmer's view: the instruction set and operand locations (registers, memory). Many microarchitectures (hardware arrangements) can implement one architecture (Intel and AMD x86 chips). Instructions are encoded as binary machine language; assembly language is the readable form. Dialects (x86, MIPS, SPARC, PowerPC) share basics: learn one, the rest come easily. MIPS (Hennessy, Stanford, 1980s) is clean. Four design principles (Patterson and Hennessy): 1 simplicity favors regularity (consistent formats: add a, b, c and sub a, b, c); 2 make the common case fast (few simple instructions; RISC: complex operations as sequences of simple ones; CISC like x86 has complex instructions such as string move whose hardware slows everything); 3 smaller is faster (32 registers); 4 good design demands good compromises (three instruction formats). Assembly: mnemonic, destination first, then sources; comments with #; multi-step expressions use temporaries.",
    steps: [
      { k: "learn", title: "Architecture vs microarchitecture", b: [
        `<p>The <b>architecture</b> is the programmer's view: the instructions and where operands live (registers and memory). The <b>microarchitecture</b> is the hardware that implements it (Chapter 7). Intel and AMD build very different chips that run the same x86 programs.</p>`,
        `<p>Computers read <b>machine language</b> (bits); people write <b>assembly language</b> (mnemonics). This chapter uses <b>MIPS</b>: a clean 32-bit architecture designed by John Hennessy at Stanford in the 1980s.</p>`,
        seenPP("The LC-3 is a much smaller ISA of the same kind.", "05-lc3.html#p1", "Chapter 5"),
      ]},
      { k: "learn", title: "Simple instructions", b: [
        two(`a = b + c;
a = b - c;
a = b + c - d;`, `add a, b, c
sub a, b, c
sub t, c, d     # t = c - d
add a, b, t     # a = b + t`),
        `<p>Mnemonic first, then the <b>destination</b>, then two sources. Every arithmetic instruction looks the same: <b>Principle 1: simplicity favors regularity</b>.</p>`,
        `<p>Complicated expressions become several simple instructions: <b>Principle 2: make the common case fast</b>. That makes MIPS a <b>RISC</b> (reduced instruction set computer). x86 is <b>CISC</b>: it even has a “string move” instruction, but every complex instruction adds decoding hardware that slows the simple ones.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "An ISA with 64 distinct instructions needs how many bits to encode the operation?", a: 6, tol: 0.01, why: "log₂ 64 = 6. With 256 instructions, 8." },
        { t: "mcq", q: "Which is an architecture-level fact rather than microarchitecture?", opts: [["MIPS has 32 registers", true, "Programs depend on it."], ["The adder is a carry-lookahead design", false, "Invisible to programs."], ["The chip runs at 2 GHz", false, "Implementation."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a RISC architecture avoid complex instructions even if they'd shorten programs?", model: "Every extra instruction type adds decoding and control hardware, and that overhead slows down all instructions, including the simple common ones. Rare complex operations can be done with sequences of simple instructions, so keeping the instruction set small and simple makes the common case fast." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Operands: registers and memory", mins: 30,
    blurb: "32 registers with conventions. Byte-addressable memory, lw and sw, endianness and alignment.",
    takeaway: "MIPS is a 32-bit architecture. 32 registers (Principle 3: smaller is faster; a small register file is a small fast SRAM): $0 (always 0), $at (assembler temporary), $v0–$v1 (return values), $a0–$a3 (arguments), $t0–$t9 (temporaries), $s0–$s7 (saved variables), $k0–$k1 (OS), $gp, $sp, $fp, $ra. Variables usually live in $s registers; intermediate values in $t. Memory: 32-bit addresses, byte-addressable; a word is 4 bytes, so word n is at byte address 4n. lw rt, offset(rs) and sw use base addressing: address = rs + sign-extended offset. Big-endian numbers bytes from the most significant end (PowerPC), little-endian from the least significant end (x86); word addresses are the same, byte addresses within a word differ (book: 0x23456789 stored at word 0, lb from byte 1 gives 0x45 big-endian, 0x67 little-endian). lw and sw must be word-aligned (address divisible by 4); lb and sb need not be.",
    steps: [
      { k: "learn", title: "The register set", b: [
        `<div class="tbl"><table><thead><tr><th>Name</th><th>Number</th><th>Use</th></tr></thead><tbody>
          <tr><td>$0</td><td>0</td><td>always 0</td></tr><tr><td>$at</td><td>1</td><td>assembler temporary</td></tr><tr><td>$v0–$v1</td><td>2–3</td><td>function return values</td></tr><tr><td>$a0–$a3</td><td>4–7</td><td>function arguments</td></tr><tr><td>$t0–$t7</td><td>8–15</td><td>temporaries</td></tr><tr><td>$s0–$s7</td><td>16–23</td><td>saved variables</td></tr><tr><td>$t8–$t9</td><td>24–25</td><td>temporaries</td></tr><tr><td>$k0–$k1</td><td>26–27</td><td>OS</td></tr><tr><td>$gp, $sp, $fp, $ra</td><td>28–31</td><td>global, stack, frame pointers; return address</td></tr></tbody></table></div>`,
        `<p><b>Principle 3: smaller is faster.</b> 32 registers can be read far faster than 1000, like books on your desk vs the library.</p>`,
        two(`a = b + c - d;
// a in $s0, b $s1, c $s2, d $s3`, `sub $t0, $s2, $s3   # t = c - d
add $s0, $s1, $t0   # a = b + t`),
      ]},
      { k: "learn", title: "Byte-addressable memory", b: [
        `<p>Each <b>byte</b> has an address; a 32-bit word spans 4 bytes, so word n lives at byte address <b>4n</b>.</p>`,
        `<div class="eq">lw rt, offset(rs):   rt ← Memory[rs + SEXT(offset)]     sw rt, offset(rs): the reverse</div>`,
        pre(`lw $s0, 0($0)      # word 0
lw $s1, 8($0)      # word 2
sw $s5, 400($0)    # word 100`),
        `<p class="aside">Word accesses must be <b>aligned</b>: the address divisible by 4. <code>lw $s0, 7($0)</code> is illegal.</p>`,
      ]},
      { k: "play", title: "Big- and little-endian", b: [
        (host) => {
          const f = el(`<div class="tbl"></div>`), ro = el(`<div></div>`);
          let v = 0x23456789, le = 1;
          function draw() {
            const bytes = [3, 2, 1, 0].map((k) => (v >>> (8 * k)) & 255); // MSB first
            const byAddr = le ? bytes.slice().reverse() : bytes; // byAddr[i] = byte at address i
            f.innerHTML = `<table style="text-align:center"><thead><tr><th>Byte address</th><th>0</th><th>1</th><th>2</th><th>3</th></tr></thead><tbody><tr><td>Contents</td>${byAddr.map((b) => `<td class="mono">${b.toString(16).toUpperCase().padStart(2, "0")}</td>`).join("")}</tr></tbody></table>`;
            ro.innerHTML = readout([["Word at address 0", hx(v)], ["lbu from byte address 1", "0x" + byAddr[1].toString(16).toUpperCase().padStart(2, "0")]]);
          }
          host.append(toggle(["Big-endian", "Little-endian"], (i) => { le = i; draw(); }, 1), f, ro);
          draw();
        },
        `<p>Both store the word at the same <b>word</b> address; they disagree on which byte gets byte-address 0. Big-endian starts at the most significant end (PowerPC); little-endian at the least significant end (x86). The names come from <i>Gulliver's Travels</i>: which end of an egg to break.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Little-endian machine: sw stores 0xA1B2C3D4 at address 0x100. Which byte is at 0x103?", opts: [["0xA1", true, "Little end (D4) at 0x100, so the most significant byte is at 0x103."], ["0xD4", false, "That's at 0x100."], ["0xB2", false, ""]] },
        { t: "num", q: "What byte address does lw use for word number 25?", a: 100, tol: 0.01, why: "4 × 25." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must the offset in lw be a multiple of 4 to read consecutive words?", model: "MIPS memory is byte-addressable and each word is four bytes, so consecutive words start four byte-addresses apart. Word n begins at byte address 4n, and lw requires the address to be word-aligned, divisible by 4." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Constants and the compromise", mins: 15,
    blurb: "Immediates, addi, and 32-bit constants with lui + ori.",
    takeaway: "Constants in the instruction are immediates: available immediately, no register or memory access. addi rt, rs, imm adds a 16-bit two's complement immediate (−32,768 to 32,767); there's no subi (add a negative). lw, sw and addi use two registers and a constant, breaking the add/sub format: Principle 4: good design demands good compromises: three formats (three registers; two registers + 16-bit immediate; 26-bit immediate). 16-bit constants: addi $s0, $0, 0x4f3c. 32-bit constants: lui (load upper immediate: 16 bits into the upper half, lower half 0) then ori to merge the lower 16 bits: lui $s0, 0x6d5e; ori $s0, $s0, 0x4f3c.",
    steps: [
      { k: "learn", title: "Immediates", b: [
        two(`a = a + 4;
b = a - 12;`, `addi $s0, $s0, 4     # a = a + 4
addi $s1, $s0, -12   # b = a - 12`),
        `<p>The immediate is a <b>16-bit two's complement</b> number: −32,768 to 32,767. No <code>subi</code>: just add a negative number.</p>`,
        `<p><b>Principle 4: good design demands good compromises.</b> One format would be simplest, but too limited. MIPS uses three.</p>`,
      ]},
      { k: "play", title: "Build a 32-bit constant", b: [
        (host) => sim(host, { src: `main:
 lui $s0, 0x6d5e        # upper half; lower half = 0
 ori $s0, $s0, 0x4f3c   # merge the lower half
 addi $s1, $0, 0x4f3c   # a 16-bit constant needs only addi
 addi $s2, $0, -1       # sign-extended: 0xFFFFFFFF`, regs: [16, 17, 18], listHeight: 200 }),
        `<p class="aside">lui writes the upper 16 bits and zeros the rest; ori fills in the lower 16 (zero-extending its immediate, so it can't disturb the upper half). Assemblers offer <code>li</code> as a shortcut that becomes this pair.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "To put 0x00012345 in $t0, the minimum is…", opts: [["lui then ori: 0x12345 doesn't fit in 16 bits", true, "Upper half 0x0001, lower 0x2345."], ["One addi", false, "0x12345 = 74,565 > 32,767."], ["One ori", false, "ori's immediate is only 16 bits."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does MIPS need two instructions to load an arbitrary 32-bit constant?", model: "Every MIPS instruction is 32 bits, and an I-type instruction has only 16 bits for its immediate after the opcode and registers. So a 32-bit constant has to be built in two halves: lui sets the upper 16 bits, and ori merges in the lower 16." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const EXW = [["add $s0, $s1, $s2", 0x02328020], ["sub $t0, $t3, $t5", 0x016d4022], ["addi $t0, $s3, -12", 0x2268fff4], ["lw $t2, 32($0)", 0x8c0a0020], ["sw $s1, 4($t1)", 0xad310004], ["sll $t0, $s1, 4", 0x00114100], ["jal 0x004000A0", 0x0c100028]];
  const p4 = {
    id: "p4", title: "Machine language: R, I, J", mins: 30,
    blurb: "Three 32-bit formats. Decode them field by field.",
    takeaway: "All MIPS instructions are 32 bits (regularity) in three formats (compromise). R-type: op (6) rs (5) rt (5) rd (5) shamt (5) funct (6): op = 0 for all R-type, funct picks the operation (add 32, sub 34); rs, rt sources, rd destination (first in assembly, third field in machine code); shamt only for shifts. Example: add $s0, $s1, $s2 → 0, 17, 18, 16, 0, 32 → 0x02328020. I-type: op (6) rs (5) rt (5) imm (16): op alone picks the operation (addi 8, lw 35, sw 43); rt is the destination for addi/lw but a source for sw; immediates are sign-extended to 32 bits (except andi/ori/xori, which zero-extend). J-type: op (6) addr (26). To interpret machine code, start with the opcode: 0 → R-type (then funct); otherwise I or J. Stored program: instructions are words in memory (MIPS text starts at 0x00400000), fetched as the PC advances by 4; the architectural state is the register file plus PC.",
    steps: [
      { k: "learn", title: "Three formats", b: [
        `<div class="tbl"><table style="text-align:center"><tbody>
          <tr><td><b>R</b></td><td style="background:var(--accent-soft)">op 6</td><td style="background:var(--cool-soft)">rs 5</td><td style="background:var(--cool-soft)">rt 5</td><td style="background:var(--cool-soft)">rd 5</td><td style="background:var(--good-soft)">shamt 5</td><td style="background:var(--accent-soft)">funct 6</td></tr>
          <tr><td><b>I</b></td><td style="background:var(--accent-soft)">op 6</td><td style="background:var(--cool-soft)">rs 5</td><td style="background:var(--cool-soft)">rt 5</td><td colspan="3" style="background:var(--good-soft)">imm 16</td></tr>
          <tr><td><b>J</b></td><td style="background:var(--accent-soft)">op 6</td><td colspan="5" style="background:var(--good-soft)">addr 26</td></tr></tbody></table></div>`,
        `<ul><li><b>R-type</b>: op = 0; <b>funct</b> picks the operation. The destination <b>rd</b> is written first in assembly but sits third in the bits.</li><li><b>I-type</b>: op alone picks the operation. <b>rt</b> is the destination for addi and lw, but a source for sw.</li><li><b>J-type</b>: jumps.</li></ul>`,
      ]},
      { k: "play", title: "Decode some instructions", b: [
        (host) => {
          const f = el(`<div></div>`);
          let k = 0;
          const sel = el(`<select aria-label="Instruction"></select>`);
          EXW.forEach(([a], i) => { const o = document.createElement("option"); o.value = i; o.textContent = a; sel.append(o); });
          const draw = () => { f.innerHTML = fieldsHTML(EXW[k][1]); };
          sel.addEventListener("change", () => { k = +sel.value; draw(); });
          host.append(sel, f);
          draw();
        },
        `<p class="aside">Examples from the chapter. Register numbers: $t0 = 8, $s0 = 16. Read each field and check it against the assembly.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Machine code 0x02F34022 (op 0, rs 23, rt 19, rd 8, funct 34) is…", opts: [["sub $t0, $s7, $s3", true, "funct 34 = sub; rd = 8 = $t0; rs = 23 = $s7; rt = 19 = $s3."], ["add $t0, $s7, $s3", false, "add is funct 32."], ["sub $s3, $s7, $t0", false, "rd is the destination."]] },
        { t: "mcq", q: "Why do I-type logical instructions (andi, ori) zero-extend their immediate instead of sign-extending?", opts: [["They treat the immediate as a bit pattern, not a number; sign extension would set the upper 16 bits to 1 for some patterns", true, "Masks need their upper bits 0."], ["Logical operations can't use negative numbers", false, "Bits don't have signs."], ["To save hardware", false, "Not the reason."]] },
      ]},
      { k: "learn", title: "The stored program", b: [
        `<p>A program is a list of 32-bit words in memory, normally from address <b>0x00400000</b>. The <b>PC</b> holds the current instruction's address and normally advances by <b>4</b> (byte addresses). The register file plus PC are the <b>architectural state</b>: save them and you can pause and resume a program.</p>`,
        seenPP("The same stored-program idea in the LC-3.", "04-von-neumann.html#p1", "Chapter 4"),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How do you start decoding an unknown MIPS machine word?", model: "Look at the top six bits, the opcode. If it's zero the instruction is R-type, so split the rest into rs, rt, rd, shamt and funct, and use funct to find the operation. Otherwise the opcode itself identifies the instruction, which tells you whether it's I-type, with rs, rt and a 16-bit immediate, or J-type with a 26-bit address." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const LOGIC = { and: (a, b) => a & b, or: (a, b) => a | b, xor: (a, b) => a ^ b, nor: (a, b) => ~(a | b), sll: (a, n) => a << n, srl: (a, n) => a >>> n, sra: (a, n) => a >> n };
  const nib = (v) => bin(v, 32).replace(/(.{4})/g, "$1 ").trim();
  const p5 = {
    id: "p5", title: "Logic, shifts, multiply", mins: 25,
    blurb: "and, or, xor, nor; masks; shifts as multiply and divide by powers of 2; hi and lo.",
    takeaway: "Logical R-type: and, or, xor, nor (bitwise). and masks bits (forces unwanted bits to 0); or combines bit fields; NOT A = A NOR $0. Immediate forms andi, ori, xori zero-extend the 16-bit immediate (no nori). Shifts: sll, srl (logical: 0s in), sra (arithmetic: sign bit in) by shamt (0–31); left shift by N multiplies by 2^N, arithmetic right shift divides by 2^N. Variable shifts sllv, srlv, srav take the amount from the low 5 bits of rs (note operand order rd, rt, rs). Multiply of 32-bit numbers gives 64 bits: mult puts the product in hi:lo; div puts quotient in lo and remainder in hi; mfhi/mflo copy them out; mul rd, rs, rt gives the low 32 bits directly.",
    steps: [
      { k: "play", title: "Bitwise operations", b: [
        (host) => {
          const ro = el(`<div class="tbl"></div>`);
          let op = "and", a = 0xffff0000 | 0, b = 0x46a1f0b7 | 0, n = 4;
          const ops = Object.keys(LOGIC);
          function draw() {
            const isS = op.startsWith("s"), r = LOGIC[op](a, isS ? n : b);
            ro.innerHTML = `<table><tbody><tr><td>A</td><td class="mono">${nib(a)}</td></tr>${isS ? `<tr><td>shamt</td><td class="mono">${n}</td></tr>` : `<tr><td>B</td><td class="mono">${nib(b)}</td></tr>`}<tr><td><b>${op}</b></td><td class="mono" style="background:var(--accent-soft)">${nib(r)}</td></tr><tr><td></td><td>${hx(r)} = ${r | 0}</td></tr></tbody></table>`;
          }
          host.append(toggle(ops, (i) => { op = ops[i]; draw(); }), toggle(["A = 0xFFFF0000", "A = 0xF30002A8", "A = 0x00000013"], (i) => { a = [0xffff0000, 0xf30002a8, 0x13][i] | 0; draw(); }),
            slider({ id: "hh6-sh", label: "Shift amount", min: 0, max: 31, step: 1, value: n, show: (x) => String(x) }, (x) => { n = x; draw(); }).el, ro);
          draw();
        },
        `<p class="aside">B = 0x46A1F0B7. <b>and</b> with 0xFFFF0000 keeps the top half (a mask). <b>sra</b> copies the sign bit in; <b>srl</b> brings 0s. Try A = 0x13 (19) with sll 2: ×4 = 76.</p>`,
        seenHH("Shifters as hardware.", "05-building-blocks.html#p4", "Chapter 5, Part 4"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "$s1 = −40. After sra $t0, $s1, 3, what's in $t0 (decimal)?", a: -5, tol: 0.01, why: "Arithmetic right shift by 3 divides by 8: −40/8 = −5." },
        { t: "mcq", q: "How do you compute NOT $t1 into $t0 in MIPS?", opts: [["nor $t0, $t1, $0", true, "A NOR 0 = NOT A."], ["not $t0, $t1", false, "There's no NOT instruction."], ["xori $t0, $t1, 0xFFFF", false, "That only flips the low 16 bits."]] },
      ]},
      { k: "learn", title: "Multiply and divide", b: [
        `<p>32 × 32 bits needs 64 bits of product, so <code>mult $s0, $s1</code> puts it in two special registers: <b>hi</b> (upper 32) and <b>lo</b> (lower 32). <code>div</code> puts the quotient in lo and the remainder in hi. Copy them out with <code>mfhi</code>/<code>mflo</code>. <code>mul $s1, $s2, $s3</code> gives just the low 32 bits in a normal register.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why are there two kinds of right shift but only one left shift?", model: "Shifting left always fills the vacated low bits with zeros, which correctly multiplies signed or unsigned numbers by a power of two. Shifting right must fill the high bits: zeros for unsigned values (logical shift), or copies of the sign bit for two's complement values so that negative numbers stay negative (arithmetic shift)." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const IFELSE = `main:
 addi $s1, $0, 5        # g = 5
 addi $s2, $0, 7        # h = 7
 addi $s3, $0, 3        # i = 3
 addi $s4, $0, 3        # j = 3
 addi $s0, $0, 100      # f = 100
 bne  $s3, $s4, else    # if (i != j) go to else
 add  $s0, $s1, $s2     # if block: f = g + h
 j    L2                # skip the else block
else:
 sub  $s0, $s0, $s3     # else block: f = f - i
L2:`;
  const p6 = {
    id: "p6", title: "Branches and conditionals", mins: 30,
    blurb: "beq, bne, j, jr. if and if/else test the opposite condition. switch is a chain of ifs.",
    takeaway: "Conditional branches: beq rs, rt, label (branch if equal) and bne (if not equal); taken branches skip to the label, otherwise execution falls through. Labels mark instruction addresses (followed by a colon; not mnemonics). Unconditional: j label (jump), jal label (jump and link, for functions), jr rs (jump to the address in a register; R-type). Real MIPS has a branch delay slot (the instruction after a branch always executes), ignored here. if: test the opposite condition and branch around the block: if (i == j) f = g + h; → bne $s3, $s4, L1; add … ; L1:. if/else: bne to else; if block ends with j past the else block. switch/case: a chain of compare (addi a constant into $t0) and bne to the next case, each case ending with j done; the default comes last.",
    steps: [
      { k: "learn", title: "Branch and jump", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><code>beq rs, rt, label</code></td><td>go to label if rs = rt</td></tr>
          <tr><td><code>bne rs, rt, label</code></td><td>go to label if rs ≠ rt</td></tr>
          <tr><td><code>j label</code></td><td>always go to label</td></tr>
          <tr><td><code>jal label</code></td><td>jump, saving the return address in $ra</td></tr>
          <tr><td><code>jr rs</code></td><td>go to the address in rs</td></tr></tbody></table></div>`,
        `<p class="aside">Real MIPS chips execute the instruction right after a branch anyway (the “branch delay slot”, a pipelining side effect). The book, and this simulator, ignore it.</p>`,
      ]},
      { k: "learn", title: "Test the opposite", b: [
        two(`if (i == j)
  f = g + h;
f = f - i;`, `  bne $s3, $s4, L1    # if i != j, skip
  add $s0, $s1, $s2   # f = g + h
L1:
  sub $s0, $s0, $s3   # f = f - i`),
        `<p>The assembly branches <b>around</b> the if block, so it tests the <b>opposite</b> condition.</p>`,
      ]},
      { k: "play", title: "if/else, running", b: [
        (host) => sim(host, { src: IFELSE, regs: [16, 17, 18, 19, 20], hex: false, listHeight: 300 }),
        `<p class="aside">i = j = 3, so the if block runs: f = 5 + 7 = 12. Edit nothing here, but predict: with j = 4 instead, what would f be? (100 − 3.)</p>`,
      ]},
      { k: "learn", title: "switch/case", b: [
        pre(`case20:  addi $t0, $0, 20
         bne  $s0, $t0, case50   # amount == 20?
         addi $s1, $0, 2         # fee = 2
         j    done
case50:  addi $t0, $0, 50
         bne  $s0, $t0, case100
         addi $s1, $0, 3
         j    done
case100: ...
default: add  $s1, $0, $0        # fee = 0
done:`),
        `<p>A switch is just a chain of if/else: compare, branch to the next case if different, otherwise do this case and jump to the end.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "To implement if (a != b) { … }, the assembly branch around the block uses…", opts: [["beq: skip the block when a == b", true, "Test the opposite."], ["bne", false, "That would skip the block exactly when it should run."], ["j", false, "Unconditional."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the if block in an if/else end with a jump?", model: "The else block sits right after the if block in memory. Without the jump, after finishing the if block the processor would fall through and execute the else block too. The j instruction skips over the else block to the code that follows." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const ARR = `.data
array: .word 1, 2, 3, 4, 5
.text
main:
 lui  $s0, 0x1000         # $s0 = base address 0x10000000
 addi $s1, $0, 0          # i = 0
 addi $t2, $0, 5          # $t2 = 5 (array size)
loop:
 slt  $t0, $s1, $t2       # i < 5 ?
 beq  $t0, $0, done       # if not, done
 sll  $t0, $s1, 2         # $t0 = i * 4 (byte offset)
 add  $t0, $t0, $s0       # address of array[i]
 lw   $t1, 0($t0)         # $t1 = array[i]
 sll  $t1, $t1, 3         # array[i] * 8
 sw   $t1, 0($t0)
 addi $s1, $s1, 1         # i = i + 1
 j    loop
done:`;
  const p7 = {
    id: "p7", title: "Loops, slt and arrays", mins: 35,
    blurb: "while, for, set-less-than. Index an array: base + 4i. Bytes, ASCII and strings.",
    takeaway: "while loops test the opposite condition at the top and exit with a branch; the body ends with j back (Code Example 6.19: pow doubles until 128, x = 7). for (init; condition; op): initialization before, condition at the top each time, loop operation at the end (sum 0..9). do/while tests after the body. slt rd, rs, rt sets rd = 1 if rs < rt (signed), else 0; combined with beq/bne for magnitude comparisons (sum of powers of 2 below 101 = 127). Arrays: elements at consecutive word addresses from a base address; element i of a word array is at base + 4i (sll by 2); load the 32-bit base with lui/ori; use lw with offset for constant indices (Code Example 6.21 multiplies array[0], array[1] by 8) and computed addresses in a loop for variable indices (Example 6.22: 1000 elements). Characters: ASCII bytes (upper and lower case differ by 0x20); lbu zero-extends a byte, lb sign-extends, sb stores the low byte. Strings end with a null byte (0x00) in C; character arrays step by 1 byte.",
    steps: [
      { k: "learn", title: "while and for", b: [
        two(`int pow = 1, x = 0;
while (pow != 128) {
  pow = pow * 2;
  x = x + 1;
}`, `  addi $s0, $0, 1      # pow = 1
  addi $s1, $0, 0      # x = 0
  addi $t0, $0, 128
while:
  beq  $s0, $t0, done  # exit when pow == 128
  sll  $s0, $s0, 1     # pow = pow * 2
  addi $s1, $s1, 1     # x = x + 1
  j    while
done:`),
        `<p>A <b>for</b> loop is a while loop with its pieces in fixed places: initialize before, test at the top, update at the bottom.</p>`,
        seenPP("The same loop shapes on the LC-3.", "06-programming.html#p2", "Chapter 6, Part 2"),
      ]},
      { k: "learn", title: "Set less than", b: [
        `<div class="eq">slt rd, rs, rt:   rd = (rs &lt; rt) ? 1 : 0</div>`,
        `<p>beq and bne only test equality. For &lt;, compute a 0/1 flag with <b>slt</b>, then branch on the flag with beq/bne against $0.</p>`,
      ]},
      { k: "play", title: "Multiply every array element by 8", b: [
        (host) => sim(host, { src: ARR, regs: [16, 17, 8, 9, 10], hex: false, watch: [0, 1, 2, 3, 4].map((i) => [`array[${i}]`, 0x10000000 + 4 * i]), maxSteps: 400, listHeight: 280 }),
        `<p class="aside">A 5-element version of the book's loop. The address of array[i] is base + 4i: sll by 2, then add. Step through one iteration, then Run.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A word array starts at 0x10007000. What's the byte address of array[6]?", a: 268464152, tol: 0.0001, hint: "0x10007000 + 6 × 4 = 0x10007018.", why: "0x10007018 = 268,464,152." },
        { t: "mcq", q: "Memory byte at address 2 is 0x8C. After lb $s2, 2($0), $s2 is…", opts: [["0xFFFFFF8C: lb sign-extends", true, "lbu would give 0x0000008C."], ["0x0000008C", false, "That's lbu."], ["0x8C000000", false, ""]] },
      ]},
      { k: "learn", title: "Characters and strings", b: [
        `<p>ASCII gives each character a byte: 'A' = 0x41, 'a' = 0x61 (upper and lower case differ by 0x20). <b>lbu</b> loads a byte with zeros above; <b>lb</b> sign-extends; <b>sb</b> stores the low byte. A C string ends with a <b>null byte</b> 0x00: “Hello!” is 7 bytes.</p>`,
        `<p class="aside">For a <i>character</i> array the index step is 1 byte, not 4.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the array loop shift i left by 2 before adding the base address?", model: "Each array element is a 32-bit word, four bytes, and MIPS memory is byte-addressable. Element i therefore starts 4 times i bytes after the base address, and shifting left by two is a cheap way to multiply by four." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const DOS = `main:
 addi $s0, $0, 99          # main's own variable
 addi $a0, $0, 2           # arguments f, g, h, i
 addi $a1, $0, 3
 addi $a2, $0, 4
 addi $a3, $0, 5
 jal  diffofsums           # call; $ra = return address
 add  $s1, $v0, $0         # y = returned value
 j    end
diffofsums:
 addi $sp, $sp, -4         # make room on the stack
 sw   $s0, 0($sp)          # save $s0 (preserved)
 add  $t0, $a0, $a1        # $t0 = f + g
 add  $t1, $a2, $a3        # $t1 = h + i
 sub  $s0, $t0, $t1        # result = (f+g) - (h+i)
 add  $v0, $s0, $0         # return value
 lw   $s0, 0($sp)          # restore $s0
 addi $sp, $sp, 4          # free the stack space
 jr   $ra                  # return
end:`;
  const p8 = {
    id: "p8", title: "Function calls and the stack", mins: 35,
    blurb: "jal and jr $ra. Arguments in $a0–$a3, result in $v0. Save preserved registers on the stack.",
    takeaway: "Functions (procedures) take arguments and return a value, with no other side effects. MIPS conventions: the caller puts up to four arguments in $a0–$a3 and calls with jal (jumps and saves the return address, the instruction after jal, in $ra); the callee puts the result in $v0 (and $v1 for 64-bit) and returns with jr $ra. Extra arguments go on the stack. The stack is LIFO memory growing down from 0x7FFFFFFC; $sp points to the top (lowest used address); a function allocates its stack frame by subtracting from $sp and must free it before returning. Preserved (callee-saved) registers: $s0–$s7, $ra, $sp, and the stack above $sp: a callee that uses them must save and restore them. Nonpreserved (caller-saved): $t0–$t9, $a0–$a3, $v0–$v1, the stack below $sp: the callee may change them freely, so the caller saves any it needs after the call. Book's diffofsums is shown first modifying $t0, $t1, $s0 (bad), then saving all three (12 bytes), then saving only $s0.",
    steps: [
      { k: "learn", title: "Calling convention", b: [
        `<ul><li>Caller: arguments in <b>$a0–$a3</b>, then <b>jal func</b>: jumps and puts the return address (the next instruction) in <b>$ra</b>.</li><li>Callee: result in <b>$v0</b>, then <b>jr $ra</b>.</li><li>The callee mustn't disturb anything the caller relies on.</li></ul>`,
        `<div class="tbl"><table><thead><tr><th>Preserved (callee saves if it uses them)</th><th>Not preserved (caller saves if it needs them)</th></tr></thead><tbody><tr><td>$s0–$s7, $ra, $sp, stack above $sp</td><td>$t0–$t9, $a0–$a3, $v0–$v1, stack below $sp</td></tr></tbody></table></div>`,
      ]},
      { k: "learn", title: "The stack", b: [
        `<p>Scratch memory that grows <b>down</b> from 0x7FFFFFFC. <b>$sp</b> points to the top (lowest used address). To save registers: subtract from $sp to make room, sw them, … lw them back, add to $sp, return. That chunk is the function's <b>stack frame</b>.</p>`,
        seenHH("Stacks as memory arrays.", "05-building-blocks.html#p8", "Chapter 5, Part 8"),
      ]},
      { k: "play", title: "Call diffofsums", b: [
        (host) => sim(host, { src: DOS, regs: [2, 4, 5, 6, 7, 8, 9, 16, 17, 29, 31], watch: [["stack word at $sp", (m) => m.r[29] >>> 0]], listHeight: 320 }),
        `<p class="aside">main keeps 99 in $s0. The function borrows $s0 but saves it on the stack first and restores it before returning, so main still has 99 afterwards. Watch $sp drop by 4 and come back, and $ra hold the address after jal.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Inside a function, you need a scratch register and don't call anything else. Cheapest choice?", opts: [["A $t register: not preserved, no need to save it", true, "That's why there are two kinds."], ["An $s register, saved and restored", false, "Works, but costs two memory accesses."], ["$ra", false, "You'd lose your way home."]] },
        { t: "mcq", q: "A function allocates 12 bytes with addi $sp, $sp, -12. Before returning it must…", opts: [["addi $sp, $sp, 12", true, "Leave $sp exactly as it found it."], ["Nothing: the caller cleans up", false, "MIPS convention: the callee frees its own frame."], ["Set $sp to 0x7FFFFFFC", false, "Other frames may be below that."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is the difference between preserved and nonpreserved registers?", model: "Preserved registers, like $s0 to $s7, $ra and $sp, must have the same values after a function call as before, so a callee that uses them saves them on the stack and restores them. Nonpreserved registers, like $t0 to $t9 and the argument registers, may be changed by the callee, so if the caller still needs their values it must save them itself before the call." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  const FACT = `main:
 addi $a0, $0, 3           # factorial(3)
 jal  factorial
 add  $s0, $v0, $0
 j    end
factorial:
 addi $sp, $sp, -8         # make room on stack
 sw   $a0, 4($sp)          # store $a0
 sw   $ra, 0($sp)          # store $ra
 addi $t0, $0, 2
 slt  $t0, $a0, $t0        # n <= 1 ?
 beq  $t0, $0, else        # no: go to else
 addi $v0, $0, 1           # yes: return 1
 addi $sp, $sp, 8          # restore $sp
 jr   $ra                  # return
else:
 addi $a0, $a0, -1         # n = n - 1
 jal  factorial            # recursive call
 lw   $ra, 0($sp)          # restore $ra
 lw   $a0, 4($sp)          # restore $a0
 addi $sp, $sp, 8          # restore $sp
 mul  $v0, $a0, $v0        # n * factorial(n-1)
 jr   $ra                  # return
end:`;
  const p9 = {
    id: "p9", title: "Recursion", mins: 30,
    blurb: "A function that calls itself must save $ra and its arguments. Watch the stack grow and shrink.",
    takeaway: "A leaf function calls no others; a nonleaf function does, so before calling it saves any nonpreserved registers it still needs ($a0–$a3, $t0–$t9), and as callee it saves preserved registers it modifies, including $ra (jal overwrites it). Recursive factorial (Code Example 6.27): allocate 8 bytes, save $a0 and $ra; if n < 2 return 1 (no need to restore what wasn't changed); else call factorial(n − 1), restore $ra and $a0, free the frame, return n × result (mul). For factorial(3) the stack holds three frames (n = 3, 2, 1) with saved return addresses; on the way back each frame multiplies and frees itself, ending with $sp restored and $v0 = 6. Extra arguments (more than four) go on the stack just above $sp, in the caller's frame; local arrays and extra locals live in the callee's frame.",
    steps: [
      { k: "learn", title: "Leaf and nonleaf", b: [
        `<p>A <b>leaf</b> function calls nothing. A <b>nonleaf</b> function calls others, and jal will overwrite <b>$ra</b>, so it must save $ra on the stack, plus any argument or $t registers it still needs after the call.</p>`,
        `<p>A <b>recursive</b> function is a nonleaf function that calls itself: factorial(n) = n × factorial(n − 1), with factorial(1) = 1.</p>`,
      ]},
      { k: "play", title: "factorial(3), step by step", b: [
        (host) => sim(host, { src: FACT, regs: [2, 4, 8, 16, 29, 31], watch: [5, 4, 3, 2, 1, 0].map((k) => ["stack", 0x7ffffffc - 24 + 4 * k]), maxSteps: 400, listHeight: 330 }),
        `<p class="aside">Each call pushes a frame of two words: n and the return address. Step until $sp is lowest (three frames), then watch them unwind: $v0 becomes 1, then 2, then 6.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "factorial(3) starting with $sp = 0x7FFFFFFC. What's the lowest value $sp reaches, minus 0x7FFFFFFC (in bytes)?", a: -24, tol: 0.01, why: "Three frames × 8 bytes." },
        { t: "mcq", q: "Why doesn't the n < 2 branch reload $a0 and $ra before returning?", opts: [["They weren't changed on that path, so the saved copies aren't needed; only $sp must be restored", true, "The book's optimization."], ["The caller restores them", false, ""], ["$ra isn't needed to return", false, "jr $ra needs it, unchanged."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must a recursive function save $ra on the stack?", model: "When it calls itself with jal, the call overwrites $ra with the address inside the function itself. Without a saved copy, it could never return to its original caller. Saving $ra in its stack frame before the call and restoring it afterwards lets every level return to the right place." },
      ]},
    ],
  };

  /* =============== PART 10 =============== */
  const p10 = {
    id: "p10", title: "Addressing modes and building a program", mins: 30,
    blurb: "Five modes; branch and jump targets. Memory map. Compile, assemble, link, load.",
    takeaway: "Five addressing modes: register-only (R-type), immediate (addi, lui), base (lw/sw: rs + SEXT(imm)), PC-relative (branches: BTA = PC + 4 + SEXT(imm) × 4, so imm counts instructions after the next one; book: beq at 0xA4 to 0xB4 has imm 3; bne at 0x54 back to 0x40 has imm −6), pseudo-direct (j/jal: JTA = (PC + 4)[31:28] : addr : 00; book: jal sum at 0x004000A0 → addr 0x0100028). jr jumps anywhere (R-type). Memory map (4 GB): reserved low; text from 0x00400000 (~256 MB; top 4 bits 0 so j reaches it all); global data 0x10000000–0x1000FFFF (64 KB) accessed with $gp = 0x10008000 ± 16-bit offsets; dynamic data: heap growing up from 0x10010000 and stack growing down from 0x7FFFFFFC; reserved above 0x80000000 for OS, exceptions, memory-mapped I/O. Toolchain: compiler (high-level → assembly), assembler (two passes: first assigns addresses and builds the symbol table; second emits machine code) → object file, linker (combines object files and libraries, relocating addresses) → executable (header with text and data sizes, text, data), loader (copies into memory, sets $gp and $sp, jal 0x00400000).",
    steps: [
      { k: "learn", title: "Five addressing modes", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>Register-only</b></td><td>R-type: all operands in registers</td></tr>
          <tr><td><b>Immediate</b></td><td>addi, lui: a 16-bit constant in the instruction</td></tr>
          <tr><td><b>Base</b></td><td>lw/sw: rs + SEXT(imm)</td></tr>
          <tr><td><b>PC-relative</b></td><td>beq/bne: target = PC + 4 + SEXT(imm) × 4</td></tr>
          <tr><td><b>Pseudo-direct</b></td><td>j/jal: target = top 4 bits of PC + 4, then the 26-bit addr, then 00</td></tr></tbody></table></div>`,
        `<p>The branch immediate counts <b>instructions</b> past the one after the branch (×4 makes bytes). The jump's 26 bits plus two implied zeros give 28 bits; the top 4 come from the PC.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A beq at 0x00400100 branches to 0x00400120. What's its immediate field?", a: 7, tol: 0.01, hint: "(target − (PC + 4)) / 4.", why: "(0x120 − 0x104)/4 = 0x1C/4 = 7." },
        { t: "num", q: "A bne at 0x60 branches back to 0x50. Immediate?", a: -5, tol: 0.01, why: "(0x50 − 0x64)/4 = −20/4 = −5." },
      ]},
      { k: "learn", title: "The memory map", b: [
        (host) => host.append(el(`<div class="fig">${S.svg(420, 250, (() => {
          let s = ""; const seg = [["Reserved (OS, I/O)", "0x80000000+", 10, 30, "var(--line)"], ["Stack ↓  ($sp = 0x7FFFFFFC)", "", 40, 50, "var(--accent-soft)"], ["Heap ↑", "0x10010000", 90, 40, "var(--good-soft)"], ["Global data ($gp = 0x10008000)", "0x10000000", 130, 35, "var(--cool-soft)"], ["Text (code)", "0x00400000", 165, 45, "var(--card)"], ["Reserved", "", 210, 30, "var(--line)"]];
          seg.forEach(([a, b, y, h, c]) => { s += `<rect x="130" y="${y}" width="280" height="${h}" style="fill:${c};stroke:var(--ink)"/>` + S.t(270, y + h / 2 + 4, a, { cls: "s" }) + (b ? S.t(124, y + h - 4, b, { a: "end", cls: "s m" }) : ""); });
          return s;
        })(), { max: 420, label: "MIPS memory map" })}</div>`)),
        `<p>Globals sit in a 64 KB area reached with <b>$gp ± 16-bit offsets</b>. The stack and heap share the big dynamic region, growing towards each other.</p>`,
      ]},
      { k: "learn", title: "Compile, assemble, link, load", b: [
        `<ol><li><b>Compiler:</b> C → assembly.</li><li><b>Assembler:</b> two passes. Pass 1 assigns an address to every instruction and label (the <b>symbol table</b>); pass 2 writes the machine code. → an object file.</li><li><b>Linker:</b> combines object files and libraries into one <b>executable</b>, relocating addresses so they don't collide.</li><li><b>Loader:</b> copies the program into memory, sets $gp = 0x10008000 and $sp = 0x7FFFFFFC, and jumps to 0x00400000.</li></ol>`,
        `<p class="aside">The book's example: globals f, g, y at 0x10000000–08 become <code>sw $a0, 0x8000($gp)</code>, because 0x10008000 + SEXT(0x8000) = 0x10000000. This chapter's simulator reproduces its 13 machine words exactly.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the assembler need two passes?", model: "An instruction can refer to a label that appears later in the program, such as a forward branch, so its address isn't known when the instruction is first read. The first pass assigns addresses to all instructions and labels and records them in a symbol table; the second pass can then encode every instruction, filling in label addresses and offsets." },
      ]},
    ],
  };

  /* =============== PART 11 =============== */
  const p11 = {
    id: "p11", title: "Odds and ends, and x86", mins: 25,
    blurb: "Pseudoinstructions, exceptions, signed vs unsigned, floating point, and a tour of x86.",
    takeaway: "Pseudoinstructions are assembler conveniences translated into real instructions: li (lui + ori), clear (add $t0, $0, $0), move (add rd, rs, $0), nop (sll $0, $0, 0 = 0x00000000); some use $at (beq with an immediate). Exceptions: unscheduled function calls caused by hardware (interrupts, e.g. a key press) or software (traps: undefined instruction, syscall, break, overflow, divide by zero); the processor records the cause in the Cause register and the PC in EPC, jumps to the handler at 0x80000180, which reads them with mfc0, handles it and returns with jr $k0 ($k0/$k1 reserved for this). Signed vs unsigned: add/addi/sub trap on overflow, addu/addiu/subu don't (C uses the unsigned forms); mult/div vs multu/divu; slt/slti vs sltu/sltiu (sltiu still sign-extends its immediate); lb/lh sign-extend, lbu/lhu zero-extend. Floating point: coprocessor 1, $f0–$f31 (doubles in even/odd pairs), F-type format (op 17, cop 16 single / 17 double), add.s/d, sub, mul, div, neg, abs; compare sets fpcond then bc1t/bc1f; lwc1/swc1. x86 (CISC): 8 registers with special roles, 2-operand instructions (one source is also the destination), operands in registers, immediates or memory (not memory-to-memory), rich addressing (base + displacement + scaled index), 8/16/32-bit data, status flags (CF, ZF, SF, OF) set by CMP and tested by Jcc, variable-length encoding 1–15 bytes (prefixes, opcode, ModR/M, SIB, displacement, immediate), segmentation, string instructions; extended to 64 bits as AMD64 (2003). Compatibility keeps it dominant.",
    steps: [
      { k: "learn", title: "Pseudoinstructions", b: [
        `<div class="tbl"><table><thead><tr><th>Pseudo</th><th>Becomes</th></tr></thead><tbody>
          <tr><td><code>li $s0, 0x1234AA77</code></td><td><code>lui $s0, 0x1234</code>; <code>ori $s0, $s0, 0xAA77</code></td></tr>
          <tr><td><code>move $s2, $s1</code></td><td><code>add $s2, $s1, $0</code></td></tr>
          <tr><td><code>clear $t0</code></td><td><code>add $t0, $0, $0</code></td></tr>
          <tr><td><code>nop</code></td><td><code>sll $0, $0, 0</code> = 0x00000000</td></tr></tbody></table></div>`,
        `<p class="aside">Some pseudoinstructions need a scratch register: that's what <b>$at</b> (assembler temporary) is for.</p>`,
      ]},
      { k: "learn", title: "Exceptions", b: [
        `<p>An <b>exception</b> is an unplanned function call: from hardware (an <b>interrupt</b>, e.g. a key press) or software (a <b>trap</b>: undefined instruction, system call, breakpoint, overflow).</p>`,
        `<p>The processor stores the cause in the <b>Cause</b> register and the PC in <b>EPC</b>, then jumps to the handler at <b>0x80000180</b>. The handler reads them with <code>mfc0</code>, does its work, and returns with <code>jr $k0</code> ($k0/$k1 are reserved for it, so they needn't be saved).</p>`,
      ]},
      { k: "learn", title: "Signed or unsigned?", b: [
        `<ul><li><b>add/addi/sub</b> raise an exception on signed overflow; <b>addu/addiu/subu</b> don't (C ignores overflow, so compilers use the u forms).</li><li><b>mult/div</b> vs <b>multu/divu</b>: different results.</li><li><b>slt</b> vs <b>sltu</b>: 0x80000000 is the smallest signed number but larger than 0x7FFFFFFF unsigned.</li><li><b>lb</b> sign-extends, <b>lbu</b> zero-extends.</li></ul>`,
        `<p class="aside">Floating point lives in coprocessor 1: 32 registers $f0–$f31, instructions like add.s and mul.d, compares that set a flag tested by bc1t/bc1f.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "$t0 = 0x7FFFFFFF. add $t1, $t0, $t0 does what?", opts: [["Raises an overflow exception (two positives gave a negative)", true, "addu would just wrap to 0xFFFFFFFE."], ["Gives 0xFFFFFFFE silently", false, "That's addu."], ["Gives 0x7FFFFFFF", false, ""]] },
      ]},
      { k: "learn", title: "x86 in one table", b: [
        `<div class="tbl"><table><thead><tr><th></th><th>MIPS</th><th>x86</th></tr></thead><tbody>
          <tr><td>Registers</td><td>32 general purpose</td><td>8, some with special roles</td></tr>
          <tr><td>Operands</td><td>3 (2 sources, 1 destination)</td><td>2 (one is source and destination)</td></tr>
          <tr><td>Operand locations</td><td>registers, immediates</td><td>registers, immediates, memory</td></tr>
          <tr><td>Data sizes</td><td>32 bits</td><td>8, 16 or 32 bits</td></tr>
          <tr><td>Condition codes</td><td>no</td><td>yes (CF, ZF, SF, OF)</td></tr>
          <tr><td>Instruction length</td><td>fixed 4 bytes</td><td>1–15 bytes</td></tr></tbody></table></div>`,
        `<p>x86 is CISC: denser programs, harder decoding, decades of quirks (segmentation, string instructions, operand-size prefixes). AMD extended it to 64 bits in 2003. It dominates because software compatibility is worth more than elegance.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What are the four key questions to ask when learning a new architecture?", model: "What is the data word length? What registers are there? How is memory organized? And what are the instructions? Once you know those for one architecture, picking up another is mostly learning a new dialect." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "hh6", eyebrow: "Harris & Harris · Chapter 6", title: "Architecture",
    intro: `<p>Eleven parts: architecture and design principles, operands, constants, machine-language formats, logic and shifts, branches, loops and arrays, function calls, recursion, addressing modes and the toolchain, then odds and ends with a look at x86.</p><p>MIPS programs run in a built-in simulator that matches the book's machine code exactly. If you've done Patt & Patel's LC-3, you'll recognise everything, just bigger. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. For translation exercises, work field by field on paper (look up register numbers in the table) and write the bits before converting to hex.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11],
    summary: `
      <h3>Principles</h3>
      <p>Simplicity favors regularity; make the common case fast; smaller is faster; good design demands good compromises. RISC vs CISC.</p>
      <h3>Operands</h3>
      <p>32 registers ($0, $at, $v, $a, $t, $s, $k, $gp, $sp, $fp, $ra). Byte-addressable memory, word = 4 bytes, aligned lw/sw with base + offset. Endianness. 16-bit immediates; lui + ori for 32 bits.</p>
      <h3>Formats</h3>
      <p>R: op rs rt rd shamt funct. I: op rs rt imm. J: op addr. Opcode 0 → R-type.</p>
      <h3>Programming</h3>
      <p>if/else test the opposite; loops end with j; slt for &lt;; array[i] at base + 4i; lb/lbu/sb, null-terminated strings. jal/jr $ra; $a0–$a3 in, $v0 out; stack grows down; preserved $s, $ra, $sp.</p>
      <h3>Addressing and tools</h3>
      <p>Register, immediate, base, PC-relative (PC + 4 + imm×4), pseudo-direct. Memory map; compiler → assembler (2 passes) → linker → loader. Pseudoinstructions, exceptions (Cause, EPC, 0x80000180), signed/unsigned, x86.</p>`,
  };
  Course.start(window.CHAPTER);
})();
