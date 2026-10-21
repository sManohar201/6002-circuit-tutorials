(function () {
  const { S, slider, toggle, readout, fmt, el } = Course;
  const { bitButtons, fsm } = Digital;
  const { sim, fieldsHTML, disasm, h4, bin, s16 } = LC3;
  const fig = (svg) => `<div class="fig">${svg}</div>`;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const c = (t) => `<code>${t}</code>`;
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const seenHH = (html, href, where) => `<div class="key"><b>More in Harris & Harris:</b> ${html} <a href="../hh/${href}">${where} →</a></div>`;

  const MULT = `        .ORIG x3000
        LD   R1, A       ; R1 <- M[A]
        LD   R2, B       ; R2 <- M[B]
        AND  R3, R3, #0  ; R3 <- 0
LOOP    ADD  R3, R3, R1  ; R3 <- R3 + R1
        ADD  R2, R2, #-1 ; R2 <- R2 - 1
        BRnp LOOP        ; repeat while R2 is not 0
        HALT
A       .FILL #5
B       .FILL #4
        .END`;

  /* =============== PART 1 =============== */
  function vonNeumann(hi) {
    const box = (x, y, w, h, lab, k, sub = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" style="fill:${hi === k ? "var(--accent-soft)" : "var(--card)"};stroke:var(--ink)"/>` + S.t(x + w / 2, y + 20, lab, { cls: "s" }) + (sub ? S.t(x + w / 2, y + 38, sub, { cls: "s m" }) : "");
    let s = box(130, 10, 160, 50, "MEMORY", 0, "MAR · MDR");
    s += box(10, 90, 100, 60, "INPUT", 2, "keyboard");
    s += box(140, 90, 140, 60, "PROCESSING", 1, "ALU · registers");
    s += box(310, 90, 100, 60, "OUTPUT", 3, "monitor");
    s += box(140, 180, 140, 50, "CONTROL UNIT", 4, "PC · IR · FSM");
    s += `<line x1="210" y1="60" x2="210" y2="90" style="stroke:var(--ink);stroke-width:2"/><line x1="110" y1="120" x2="140" y2="120" style="stroke:var(--ink);stroke-width:2"/><line x1="280" y1="120" x2="310" y2="120" style="stroke:var(--ink);stroke-width:2"/><line x1="210" y1="150" x2="210" y2="180" style="stroke:var(--ink);stroke-width:2;stroke-dasharray:4 3"/>`;
    return S.svg(420, 240, s, { max: 420, label: "The von Neumann model: memory, processing unit, input, output, control unit" });
  }
  const PARTS = [
    ["Memory", "Holds the program and its data. Each location has an address and contents."],
    ["Processing unit", "Does the work: an ALU (add, AND, NOT…) plus a few registers for values needed soon."],
    ["Input", "Gets information in: keyboard, mouse, scanner, disk."],
    ["Output", "Gets results out: monitor, printer, disk."],
    ["Control unit", "The conductor: keeps track of which instruction is next (PC) and which is being done (IR), and steps through each one."],
  ];
  const p1 = {
    id: "p1", title: "The von Neumann model", mins: 15,
    blurb: "Five parts, and the big idea: the program lives in memory, right next to the data.",
    takeaway: "To get a task done you need a program (a sequence of instructions, the smallest units of work, done completely or not at all) and a computer to carry it out. John von Neumann's 1946 model has five parts: memory (holds program and data), processing unit (ALU and temporary registers), input, output, and control unit (directs everything; keeps the PC and IR). The central idea: program and data are both stored as bits in memory, and the program is executed one instruction at a time under the direction of the control unit.",
    steps: [
      { k: "play", title: "Five parts", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          let k = 0;
          const draw = () => { f.innerHTML = vonNeumann(k); ro.innerHTML = readout([[PARTS[k][0], PARTS[k][1]]]); };
          host.append(toggle(PARTS.map((p) => p[0]), (i) => { k = i; draw(); }), f, ro);
          draw();
        },
        `<p>The <b>stored-program</b> idea: the program is just bits in memory, like the data. To run a different program, load different bits. No rewiring.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which part of the von Neumann model?", bins: ["Memory", "Processing", "Input/Output", "Control"], items: [
          ["The ALU", 1, "It computes."], ["The program counter", 3, "It tracks the next instruction."], ["The keyboard", 2, ""], ["Your program's instructions", 0, "Stored in memory, like data."], ["Register R3", 1, "Temporary storage right next to the ALU."], ["The instruction register", 3, ""],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does it mean that a von Neumann computer is a 'stored-program' computer?", model: "The program's instructions are stored in memory as bits, just like the data. The control unit fetches them from memory one at a time and carries them out, so changing what the computer does only requires loading different bits into memory, not rebuilding the hardware." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Memory: address and contents", mins: 20,
    blurb: "Address space, addressability, MAR and MDR. Location 4 holding 6 is not location 6 holding 4.",
    takeaway: "A memory of 2^k locations needs k-bit addresses; its address space is 2^k and its addressability is the number of bits per location. Example: 2³⁴ × 8 bits = 16 GB (16 = 2⁴, giga = 2³⁰; a byte = 8 bits). The LC-3 has address space 2¹⁶ and is 16-bit addressable. Reading: put the address in the memory address register (MAR), interrogate memory, the value arrives in the memory data register (MDR). Writing: address in MAR, value in MDR, interrogate with write enable asserted. A location's address never changes; its contents can. Like post-office boxes: the box number is the address, the letters are the contents.",
    steps: [
      { k: "learn", title: "Two numbers per location", b: [
        `<p>Every memory location has an <b>address</b> (which box) and <b>contents</b> (what's in it). Don't mix them up: location 4 containing 6 is a different situation from location 6 containing 4.</p>`,
        `<ul><li><b>Address space:</b> how many locations. k address bits → 2<sup>k</sup> locations.</li><li><b>Addressability:</b> how many bits in each location.</li></ul>`,
        `<p>A 2<sup>34</sup> × 8-bit memory is <b>16 GB</b> (2<sup>4</sup> × 2<sup>30</sup> bytes). The LC-3: 2<sup>16</sup> locations of 16 bits each.</p>`,
        seenPP("Building a small memory from latches and a decoder.", "03-digital-logic-structures.html#p8", "Chapter 3, Part 8"),
      ]},
      { k: "play", title: "Read and write through MAR and MDR", b: [
        (host) => {
          const mem = [0x50, 0xf1, 0x83, 0x15, 0xc6, 0xab, 0x39, 0x62];
          let MAR = 0, MDR = 0, last = "";
          const tb = el(`<div class="tbl"></div>`), ro = el(`<div></div>`);
          const marB = bitButtons("000", (b) => { MAR = parseInt(b, 2); draw(); }, { label: "MAR" });
          const mdrB = bitButtons("00000000", (b) => { MDR = parseInt(b, 2); draw(); }, { label: "MDR" });
          function draw() {
            tb.innerHTML = `<table><thead><tr><th>Address</th><th>Contents</th></tr></thead><tbody>${mem.map((v, i) => `<tr${i === MAR ? ' style="background:var(--accent-soft)"' : ""}><td class="mono">${bin(i, 3)}</td><td class="mono">${bin(v, 8)}</td></tr>`).join("")}</tbody></table>`;
            ro.innerHTML = readout([["MAR", bin(MAR, 3)], ["MDR", bin(MDR, 8)], ["Last access", last || "none yet"]]);
          }
          const rd = btn("Read (WE = 0)", "primary"), wr = btn("Write (WE = 1)");
          rd.addEventListener("click", () => { MDR = mem[MAR]; mdrB.set(bin(MDR, 8)); last = `read M[${bin(MAR, 3)}] into MDR`; draw(); });
          wr.addEventListener("click", () => { mem[MAR] = MDR; last = `wrote MDR into M[${bin(MAR, 3)}]`; draw(); });
          const row = el(`<div class="row"></div>`); row.append(rd, wr);
          host.append(el(`<p class="aside">MAR (address):</p>`), marB.el, el(`<p class="aside">MDR (data):</p>`), mdrB.el, row, tb, ro);
          draw();
        },
        `<p class="aside">An 8-location, 8-bit memory. To <b>read</b>: set MAR, press Read: the contents appear in MDR. To <b>write</b>: set MAR and MDR, press Write. Memory only ever talks through these two registers.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A memory has 2²⁰ locations, each 8 bits. How many bytes is that, in MB (1 MB = 2²⁰ bytes)?", a: 1, tol: 0.01, unit: "MB", why: "2²⁰ locations × 1 byte = 1 MB." },
        { t: "num", q: "How many address bits does a memory with 4096 locations need?", a: 12, tol: 0.01, unit: "bits", why: "2¹² = 4096." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe the steps to write a value into a memory location.", model: "Put the location's address into the memory address register, put the value to store into the memory data register, then access memory with the write enable signal asserted. Memory copies the MDR into the location whose address is in the MAR." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Processing, I/O, and control", mins: 15,
    blurb: "ALU and word length, registers, peripherals, and the PC and IR. The LC-3 as a von Neumann machine.",
    takeaway: "The processing unit's simplest form is the ALU (arithmetic and logic unit): the LC-3's can ADD, AND and NOT. It processes words of fixed size, the word length (LC-3: 16 bits; PCs today 64 bits; cheap microcontrollers 8 or 16). Registers hold values needed soon because memory access is slow compared with an ALU operation: the LC-3 has eight 16-bit registers R0–R7 (modern processors ~32 of 32 or 64 bits, plus wide special registers). Input and output devices are peripherals; the LC-3 uses a keyboard (KBDR data, KBSR status) and a monitor (DDR, DSR). The control unit keeps the instruction register (IR: the instruction being processed) and the program counter (PC: address of the next instruction; better named instruction pointer, as Intel does), and a finite state machine that directs everything clock cycle by clock cycle. In data-path drawings, filled arrowheads carry data, open arrowheads carry control signals (e.g. ALUK selects the ALU operation, GateALU puts the ALU output on the bus).",
    steps: [
      { k: "learn", title: "Processing unit", b: [
        `<p>The <b>ALU</b> does arithmetic and logic on fixed-size <b>words</b>. LC-3: 16-bit words; its ALU can ADD, AND and NOT.</p>`,
        `<p><b>Registers</b> sit right next to the ALU because memory is slow. Computing (A + B) × C, you keep A + B in a register rather than writing it to memory and reading it back. The LC-3 has eight: <b>R0–R7</b>, 16 bits each.</p>`,
      ]},
      { k: "learn", title: "Input, output, control", b: [
        `<p>LC-3 I/O: a <b>keyboard</b> (KBDR holds the key's ASCII code; KBSR says whether a new key arrived) and a <b>monitor</b> (DDR, DSR). Chapter 9 uses them.</p>`,
        `<p>The <b>control unit</b>: the <b>IR</b> holds the instruction being processed; the <b>PC</b> holds the address of the next one (“instruction pointer” would be a better name); a <b>finite state machine</b> steps everything along, one clock cycle per state.</p>`,
        seenPP("Finite state machines and the LC-3 data path.", "03-digital-logic-structures.html#p9", "Chapter 3, Part 9"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why have registers at all, if memory can hold everything?", opts: [["Memory access takes far longer than an ALU operation; registers keep soon-needed values close", true, "That's the whole point."], ["Memory can't store intermediate results", false, "It can, just slowly."], ["The ALU can only read registers in every computer", false, "Some ISAs (x86) can use memory operands directly."]] },
        { t: "mcq", q: "In a data-path drawing, the line labelled ALUK has an open arrowhead. It carries…", opts: [["A control signal: which operation the ALU performs", true, "Open arrowheads = control; filled = data."], ["Data to be added", false, "Data lines have filled arrowheads."], ["The clock", false, "The clock goes into the FSM."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What do the PC and IR each hold?", model: "The instruction register holds the instruction currently being processed. The program counter holds the address of the next instruction to fetch, so it really points to an instruction rather than counting anything." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Instructions: opcode and operands", mins: 25,
    blurb: "Every LC-3 instruction is 16 bits: a 4-bit opcode and 12 bits of operands. ADD and AND.",
    takeaway: "An instruction has an opcode (what to do) and operands (to what). Three kinds: operate (ADD, AND, NOT), data movement (six in the LC-3: between memory/I/O and registers), and control (change the sequence). LC-3 instructions are one 16-bit word: bits [15:12] opcode (up to 16 opcodes; 15 used, one reserved), bits [11:0] locate the operands. ADD (0001) and AND (0101): DR in [11:9], SR1 in [8:6]; bit 5 = 0 → second source is register SR2 in [2:0]; bit 5 = 1 → second source is the 5-bit 2's complement immediate in [4:0], sign-extended to 16 bits (range −16..15). AND with immediate 0 clears a register (initializing).",
    steps: [
      { k: "learn", title: "Three kinds of instruction", b: [
        `<div class="tbl"><table><tbody><tr><td><b>Operate</b></td><td>compute on data: ADD, AND, NOT</td></tr><tr><td><b>Data movement</b></td><td>move data between memory (or I/O) and registers: LD and five others</td></tr><tr><td><b>Control</b></td><td>change which instruction comes next: BR, TRAP…</td></tr></tbody></table></div>`,
        `<p>An LC-3 instruction is one 16-bit word: <b>bits [15:12] = opcode</b>, bits [11:0] say where the operands are.</p>`,
      ]},
      { k: "play", title: "Decode an instruction", b: [
        (host) => {
          const f = el(`<div></div>`), ro = el(`<div></div>`);
          const b = bitButtons("0001110010000110", (x) => { const w = parseInt(x, 2); f.innerHTML = fieldsHTML(w); ro.innerHTML = readout([["Assembly", disasm(w, 0x3000)], ["Hex", h4(w)]]); }, { label: "instruction bits" });
          const presets = [["ADD R6, R2, R6", "0001110010000110"], ["ADD R6, R2, #6", "0001110010100110"], ["AND R2, R3, #0", "0101010011100000"], ["NOT R1, R1", "1001001001111111"]];
          host.append(toggle(presets.map((p) => p[0]), (i) => b.set(presets[i][1])), b.el, f, ro);
          b.set("0001110010000110");
        },
        `<p class="aside">Click bits to flip them. Orange: opcode. Blue: registers. Green: the immediate. Flip bit 5 of an ADD and watch [4:0] change meaning from “00 + register” to a 5-bit number.</p>`,
      ]},
      { k: "learn", title: "ADD and AND", b: [
        `<div class="eq">ADD DR, SR1, SR2   or   ADD DR, SR1, #imm5</div>`,
        `<ul><li>Bit 5 = 0: second source is a register.</li><li>Bit 5 = 1: second source is <b>imm5</b>, a 5-bit 2's complement number (−16…15) sign-extended to 16 bits.</li></ul>`,
        `<p><b>AND R2, R3, #0</b> always gives 0: the standard way to <b>clear</b> a register before using it.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Which instruction is 0001 011 011 1 11111?", opts: [["ADD R3, R3, #−1", true, "Opcode ADD, DR = SR1 = R3, bit 5 = 1, imm5 = 11111 = −1."], ["ADD R3, R3, #31", false, "imm5 is 2's complement."], ["AND R3, R3, #−1", false, "Opcode 0001 is ADD."]] },
        { t: "mcq", q: "Which instruction puts 0 into R5, whatever it held before?", opts: [["AND R5, R5, #0", true, "Every bit ANDed with 0 is 0."], ["ADD R5, R5, #0", false, "That leaves R5 unchanged."], ["NOT R5, R5", false, "That flips every bit."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the LC-3 know whether ADD's second source is a register or a number?", model: "It looks at bit 5 of the instruction. If bit 5 is 0, bits 2 to 0 name a register to use. If bit 5 is 1, bits 4 to 0 are a 5-bit two's complement number, which is sign-extended to 16 bits and used directly." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "LD and PC-relative addressing", mins: 20,
    blurb: "Load from memory: the address is the incremented PC plus a 9-bit offset.",
    takeaway: "LD (opcode 0010) loads a register from memory: DR in [11:9], a 9-bit 2's complement PCoffset9 in [8:0]. Each formula for computing an operand's address is an addressing mode; LD uses PC+offset: address = (incremented PC) + SEXT(PCoffset9). The incremented PC is used because FETCH already added 1. The offset range is −256..255, so LD reaches data within about ±256 locations of the instruction. E.g. offset 111111001 = −7.",
    steps: [
      { k: "learn", title: "PC + offset", b: [
        `<div class="eq">LD DR, PCoffset9:   DR ← M[ PC<sub>incremented</sub> + SEXT(PCoffset9) ]</div>`,
        `<p>The formula for an operand's address is called an <b>addressing mode</b>. LD's is <b>PC+offset</b>. The PC has <i>already been incremented</i> during FETCH, so the offset counts from the instruction <b>after</b> the LD.</p>`,
        `<p class="aside">Nine offset bits: −256 to +255. Data must sit near the code that loads it.</p>`,
      ]},
      { k: "play", title: "Where does it load from?", b: [
        (host, id) => {
          const ro = el(`<div></div>`), f = el(`<div></div>`);
          let at = 0x3000, offb = "000000110";
          const b = bitButtons(offb, (x) => { offb = x; draw(); }, { label: "PCoffset9" });
          function draw() { const w = (0b0010 << 12) | (1 << 9) | parseInt(offb, 2), off = LC3.sext(parseInt(offb, 2), 9); f.innerHTML = fieldsHTML(w); ro.innerHTML = readout([["Instruction at", h4(at)], ["Incremented PC", h4(at + 1)], ["Offset", String(off)], ["Address loaded from", h4(at + 1 + off)]]); }
          host.append(slider({ id: id + "-a", label: "Address of the LD instruction", min: 0x3000, max: 0x30ff, step: 1, value: at, show: (x) => h4(x) }, (x) => { at = x; draw(); }).el, el(`<p class="aside">PCoffset9 bits:</p>`), b.el, f, ro);
          draw();
        },
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "An LD at x4018 has PCoffset9 = 1 1111 1100 (−4). It loads from…", opts: [["x4015", true, "x4019 − 4."], ["x4014", false, "Use the incremented PC, x4019."], ["x401C", false, "The offset is negative."]] },
        { t: "num", q: "An LD at x3000 must read x3007. What offset goes in [8:0], in decimal?", a: 6, tol: 0.01, why: "x3001 + 6 = x3007." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does LD's offset count from the instruction after the LD?", model: "By the time the address is computed, the FETCH phase has already incremented the PC so it points to the next instruction. The addressing mode adds the sign-extended offset to that incremented PC." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const PHASES = [
    ["FETCH", "MAR ← PC and PC ← PC + 1; MDR ← M[MAR]; IR ← MDR. Every instruction does this."],
    ["DECODE", "A 4-to-16 decoder looks at IR[15:12] and steers to the right sequence of steps."],
    ["EVALUATE ADDRESS", "Compute a memory address if the instruction needs one (LD: PC + offset)."],
    ["FETCH OPERANDS", "Get the source operands, from registers or memory."],
    ["EXECUTE", "Do it: the ALU adds, ANDs…"],
    ["STORE RESULT", "Write the result to its destination."],
  ];
  const p6 = {
    id: "p6", title: "The instruction cycle", mins: 30,
    blurb: "FETCH, DECODE, EVALUATE ADDRESS, FETCH OPERANDS, EXECUTE, STORE RESULT. Step through a real program.",
    takeaway: "The instruction cycle (not the clock cycle!) has six phases, and not every instruction needs all of them. FETCH: MAR ← PC and PC incremented (1 clock), MDR ← M[MAR] (one or more clocks), IR ← MDR (1 clock). DECODE: a 4-to-16 decoder on IR[15:12]. EVALUATE ADDRESS: compute the memory address (LD: PC + offset); not needed for ADD/AND. FETCH OPERANDS: from registers or memory (LD: MAR ← address, read memory). EXECUTE: the ALU operation. STORE RESULT: write the destination; in the LC-3, ADD fetches, executes and stores in one clock. LD needs no EXECUTE. An x86 instruction like ADD [eax], edx uses all six. A 3.1 GHz processor has a 0.322 ns clock cycle; each phase takes one or more clock cycles.",
    steps: [
      { k: "learn", title: "Six phases", b: [
        `<div class="tbl"><table><tbody>${PHASES.map(([a, b]) => `<tr><td><b>${a}</b></td><td>${b}</td></tr>`).join("")}</tbody></table></div>`,
        `<p>Not every instruction needs every phase. LC-3 ADD has no EVALUATE ADDRESS, and does fetch-operands, execute and store in one clock. LD has no EXECUTE. Intel's <code>ADD [eax], edx</code> (add a register into memory) needs all six.</p>`,
        `<p class="aside">The <b>instruction</b> cycle is the whole six-phase process. Each phase takes one or more <b>clock</b> cycles. At 3.1 GHz, one clock cycle is 0.322 ns.</p>`,
      ]},
      { k: "play", title: "Step the multiply program", b: [
        (host) => sim(host, { src: MULT, watch: [["A", "A"], ["B", "B"]], io: false }),
        `<p class="aside">This is the chapter's program: it multiplies 5 × 4 by adding 5 four times. Each Step runs one whole instruction cycle and lists what each phase did. Watch the PC jump back at <code>BRnp</code>, and the condition code change after each ADD.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which phases does each LC-3 instruction need (besides FETCH and DECODE)?", bins: ["Needs EVALUATE ADDRESS", "Doesn't"], items: [["LD R1, A", 0, "PC + offset."], ["ADD R3, R3, R1", 1, "Operands come from registers."], ["AND R3, R3, #0", 1, "Register and immediate."], ["LD R2, B", 0, ""]] },
        { t: "num", q: "The multiply program (5 × 4) runs how many instructions in total, including HALT?", a: 16, tol: 0.01, hint: "3 setup + 4 × (ADD, ADD, BR) + HALT.", why: "3 + 12 + 1 = 16. Check with Run to HALT." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What happens in the FETCH phase, and why does it increment the PC?", model: "The address in the PC goes to the MAR, memory returns that location's contents into the MDR, and the MDR is copied into the instruction register. At the same time the PC is incremented, so that when this instruction finishes, the next FETCH automatically gets the instruction in the next memory location, unless the instruction changes the PC." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Changing the sequence: BR", mins: 25,
    blurb: "Control instructions overwrite the PC. Conditional branches test the last result.",
    takeaway: "Normally instructions run in address order because FETCH increments the PC. Control instructions change the sequence by loading the PC during EXECUTE, overwriting the incremented value. BR (opcode 0000): bits [11:9] = n, z, p conditions tested against the condition codes set by the most recent result; bits [8:0] PCoffset9 (same PC+offset formula as LD). If the test passes, PC ← incremented PC + SEXT(offset); otherwise nothing happens and the next sequential instruction runs. Example: BR with nzp = 101 (not zero) and offset −6 at x36C9: goes to x36C4 if the last result was nonzero, else x36CA. The control unit is a synchronous FSM: State 1 (MAR ← PC, PC ← PC + 1), State 2 (MDR ← M[MAR]), State 3 (IR ← MDR), State 4 (decode: branch on opcode), then states for each instruction, returning to State 1; BR's taken path loads the PC in state 63. FSM control signals such as GatePC and LD.MAR move values over the bus; registers load at the end of the clock cycle.",
    steps: [
      { k: "learn", title: "How to change the PC", b: [
        `<p>Each FETCH increments the PC, so instructions run in order. A <b>control instruction</b> changes the order by loading a new value into the PC during EXECUTE, overwriting the incremented one.</p>`,
        `<div class="eq">BR nzp, PCoffset9:   if (n·N + z·Z + p·P) then PC ← PC + SEXT(PCoffset9)</div>`,
        `<p>N, Z, P are the <b>condition codes</b>: set by each instruction that writes a register (ADD, AND, NOT, LD…), telling whether the result was negative, zero or positive. <code>BRnp</code> = “branch if not zero”.</p>`,
      ]},
      { k: "play", title: "Taken or not?", b: [
        (host) => {
          const ro = el(`<div></div>`);
          let cond = [1, 0, 1], cc = 2;
          const b = bitButtons("101", (x) => { cond = x.split("").map(Number); draw(); }, { label: "n z p" });
          function draw() { const take = cond[cc]; ro.innerHTML = readout([["Branch tests", (cond[0] ? "n" : "") + (cond[1] ? "z" : "") + (cond[2] ? "p" : "") || "(no bits set)"], ["Last result was", ["negative", "zero", "positive"][cc]], ["Next PC (BR at x36C9, offset −6)", take ? "x36C4 (taken)" : "x36CA (not taken)"]]); }
          host.append(el(`<p class="aside">The n, z, p bits of the BR instruction:</p>`), b.el, toggle(["Last result negative", "zero", "positive"], (i) => { cc = i; draw(); }, 2), ro);
          draw();
        },
        `<p class="aside">nzp = 111 tests all three, and exactly one of N, Z, P is always set, so it always branches: an unconditional branch.</p>`,
      ]},
      { k: "play", title: "The control FSM", b: [
        (host) => {
          const nodes = [{ id: "s1", x: 210, y: 30, label: "1: MAR←PC, PC+1" }, { id: "s2", x: 210, y: 95, label: "2: MDR←M[MAR]" }, { id: "s3", x: 210, y: 160, label: "3: IR←MDR" }, { id: "s4", x: 210, y: 225, label: "4: DECODE" }, { id: "add", x: 70, y: 300, label: "ADD" }, { id: "ld", x: 210, y: 300, label: "LD…" }, { id: "br", x: 350, y: 300, label: "BR test" }];
          host.append(el(`<div class="fig">${S.svg(420, 330, (() => {
            let s = "";
            const bx = (n) => `<rect x="${n.x - 66}" y="${n.y - 16}" width="132" height="32" rx="8" style="fill:var(--card);stroke:var(--ink)"/>` + S.t(n.x, n.y + 5, n.label, { cls: "s" });
            const ln = (a, b2, lab) => `<line x1="${a.x}" y1="${a.y + 16}" x2="${b2.x}" y2="${b2.y - 16}" style="stroke:var(--ink)"/>` + (lab ? S.t((a.x + b2.x) / 2 + 6, (a.y + b2.y) / 2 + 4, lab, { a: "start", cls: "s m" }) : "");
            s += ln(nodes[0], nodes[1]) + ln(nodes[1], nodes[2]) + ln(nodes[2], nodes[3]) + ln(nodes[3], nodes[4], "opcode") + ln(nodes[3], nodes[5]) + ln(nodes[3], nodes[6]);
            s += `<path d="M 10 300 L 4 300 L 4 30 L 144 30" style="fill:none;stroke:var(--muted);stroke-dasharray:4 3"/>` + S.t(12, 160, "back to 1", { a: "start", cls: "s m" });
            nodes.forEach((n) => { s += bx(n); });
            return s;
          })(), { max: 420, label: "Abbreviated LC-3 control state machine" })}</div>`));
        },
        `<p>Each state is one clock cycle. State 1 asserts <b>GatePC</b> (PC onto the bus) and <b>LD.MAR</b> (load MAR at the end of the cycle), and selects PC + 1 through the PCMUX with <b>LD.PC</b>. Decode branches on the opcode; every instruction's last state returns to State 1.</p>`,
        seenHH("Building this kind of controller in hardware.", "03-sequential-logic.html#p6", "Chapter 3"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A BRz at x4000 with offset +5. The previous ADD produced 3. Next instruction comes from…", opts: [["x4001: the branch isn't taken", true, "z tests for zero; 3 is positive."], ["x4006", false, "That's if taken."], ["x4005", false, "Taken target would be x4001 + 5 = x4006 anyway."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a conditional branch decide where the next instruction comes from?", model: "It checks its n, z and p bits against the condition codes set by the most recent result. If any requested condition matches, it overwrites the PC with the incremented PC plus its sign-extended offset, so the next fetch comes from there. Otherwise it does nothing and the already-incremented PC fetches the next sequential instruction." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Halting, and your first program", mins: 30,
    blurb: "The clock, the RUN latch and TRAP x25. Then multiply without a multiplier, and break it.",
    takeaway: "The instruction cycle runs forever unless the clock stops. The clock circuit is a crystal oscillator ANDed with a RUN latch: clearing the RUN latch stops the clock. User programs normally end by returning control to the operating system; to stop, the program asks the OS with TRAP (opcode 1111) and an 8-bit trap vector: x25 = HALT. First program (Figure 4.7): multiply two positive integers by repeated addition: LD R1 and R2 from memory, AND R3 ← 0, loop {ADD R3 ← R3 + R1; ADD R2 ← R2 − 1; BRnp back}, then TRAP x25. Flowcharts express the algorithm before the code.",
    steps: [
      { k: "learn", title: "Stopping the conductor", b: [
        `<p>The instruction cycle goes on forever unless the clock stops. The clock circuit is a crystal oscillator gated by a <b>RUN latch</b>: when RUN = 0, the clock output stays 0 and nothing happens.</p>`,
        `<p>User programs don't clear it directly; they ask the operating system with <b>TRAP</b> (opcode 1111) and an 8-bit <b>trap vector</b>. <b>TRAP x25</b> means “I'm done: halt”. (Assemblers let you write <code>HALT</code>.)</p>`,
        `<p class="aside">The book asks a trick question here about restarting the machine. Think about it before you look it up.</p>`,
      ]},
      { k: "learn", title: "The algorithm", b: [
        `<ol><li>R1 ← M[A] (the number to add), R2 ← M[B] (how many times).</li><li>R3 ← 0.</li><li>Repeat: R3 ← R3 + R1; R2 ← R2 − 1; until R2 = 0.</li><li>Halt. R3 holds A × B.</li></ol>`,
        `<pre class="code">${MULT.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`,
        `<p class="aside">Labels (LOOP, A, B) and <code>.ORIG</code>/<code>.FILL</code> are assembly language, coming in Chapter 7. The book writes this program directly in bits; the assembler produces exactly the same 9 words.</p>`,
      ]},
      { k: "play", title: "Change it, run it", b: [
        (host) => sim(host, { src: MULT, editable: true, watch: [["A", "A"], ["B", "B"]], io: false, rows: 12, maxSteps: 300000 }),
        `<p class="aside">Edit the <code>.FILL</code> values (e.g. 7 and 3), press <b>Assemble and load</b>, then <b>Run to HALT</b>.</p>`,
      ]},
      { k: "predict", title: "Predict before you run", b: [
        { t: "mcq", q: "Set B to #0 and run. What happens?", opts: [["The loop runs 65,536 times: R2 goes 0 → −1 and keeps going until it wraps back to 0", true, "The test comes after the decrement, so B = 0 isn't caught. R3 ends as 5 × 65,536 mod 2¹⁶ = 0, by luck."], ["R3 = 0 immediately", false, "The ADD happens before any test."], ["It halts with an error", false, "The LC-3 has no such check."]] },
        `<p class="aside">Try it with Run to HALT and look at the instruction count. A good programmer handles the edge case: test R2 before the loop.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "With A = 6 and B = 3, what's in R3 when the program halts?", a: 18, tol: 0.01 },
        { t: "mcq", q: "Why does the program clear R3 with AND R3, R3, #0 before the loop?", opts: [["Registers start with unknown values; the sum must start at 0", true, "Initialization."], ["AND makes the loop faster", false, ""], ["It sets the condition codes for BR", false, "BR tests the ADD R2 result."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't a user program simply stop the clock itself?", model: "Programs run under an operating system, and stopping the machine is a privileged, system-level action. The program instead executes a TRAP instruction with vector x25, asking the operating system's halt service to clear the RUN latch, which gates off the clock and stops the instruction cycle." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp4", eyebrow: "Patt & Patel · Chapter 4", title: "The von Neumann Model",
    intro: `<p>Eight parts: the five components, memory, processing and control, instruction formats, PC-relative loads, the instruction cycle, branches and the control FSM, and halting plus your first program.</p><p>From here on you'll run real LC-3 code in a built-in simulator: step one instruction at a time and see every register change. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. Write out each instruction cycle phase by hand before checking anything in a simulator.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8],
    summary: `
      <h3>The model</h3>
      <p>Memory, processing unit (ALU + registers), input, output, control unit (PC, IR, FSM). Program and data both live in memory.</p>
      <h3>Memory</h3>
      <p>k address bits → 2<sup>k</sup> locations; addressability = bits per location. Read: MAR ← address, MDR ← M[MAR]. Write: MAR, MDR, write enable. LC-3: 2<sup>16</sup> × 16 bits.</p>
      <h3>Instructions</h3>
      <p>16 bits: opcode [15:12]. ADD 0001 / AND 0101: DR, SR1, then SR2 or imm5 (bit 5). LD 0010: DR ← M[PC<sub>inc</sub> + SEXT(PCoffset9)]. BR 0000: nzp, PCoffset9. TRAP 1111: x25 = HALT.</p>
      <h3>Instruction cycle</h3>
      <p>FETCH (MAR ← PC, PC ← PC+1; MDR ← M[MAR]; IR ← MDR), DECODE, EVALUATE ADDRESS, FETCH OPERANDS, EXECUTE, STORE RESULT. Control instructions overwrite the PC.</p>`,
  };
  Course.start(window.CHAPTER);
})();
