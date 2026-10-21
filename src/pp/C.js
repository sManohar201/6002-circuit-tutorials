(function () {
  const { S, slider, toggle, el } = Course;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const seenHH = (html, href, where) => `<div class="key"><b>Also in Harris & Harris:</b> ${html} <a href="../hh/${href}">${where} →</a></div>`;
  const b6 = (n) => n.toString(2).padStart(6, "0");

  /* ---------- state paths (Figures C.2 and C.7, as described in the text) ---------- */
  const RTLS = {
    18: "MAR ← PC; PC ← PC + 1; set ACV; test INT", 33: "test ACV", 28: "MDR ← M[MAR] (repeat until R)", 30: "IR ← MDR", 32: "DECODE: BEN ← IR[11]·N + IR[10]·Z + IR[9]·P; branch on IR[15:12]",
    1: "DR ← SR1 + OP2; set CC", 5: "DR ← SR1 AND OP2; set CC", 9: "DR ← NOT(SR); set CC", 14: "DR ← PC + off9", 12: "PC ← BaseR",
    0: "test BEN", 22: "PC ← PC + off9", 4: "test IR[11]", 21: "R7 ← PC; PC ← PC + off11", 20: "R7 ← PC; PC ← BaseR",
    2: "MAR ← PC + off9; set ACV", 6: "MAR ← BaseR + off6; set ACV", 10: "MAR ← PC + off9; set ACV", 17: "test ACV", 24: "MDR ← M[MAR] (repeat until R)", 26: "MAR ← MDR; set ACV",
    35: "test ACV", 25: "MDR ← M[MAR] (repeat until R)", 27: "DR ← MDR; set CC",
    3: "MAR ← PC + off9; set ACV", 7: "MAR ← BaseR + off6; set ACV", 11: "MAR ← PC + off9; set ACV", 19: "test ACV", 29: "MDR ← M[MAR] (repeat until R)", 31: "MAR ← MDR; set ACV",
    23: "MDR ← SR; test ACV", 16: "M[MAR] ← MDR (repeat until R)",
    15: "Table ← x00; PC ← PC + 1; MDR ← PSR", 47: "Vector ← IR[7:0]; PSR[15] ← 0; test old privilege", 45: "Saved USP ← R6; R6 ← Saved SSP (user program only)",
    37: "MAR, SP ← SP − 1", 41: "M[MAR] ← MDR (push PSR; until R)", 43: "MDR ← PC − 1", 46: "MAR, SP ← SP − 1", 52: "M[MAR] ← MDR (push PC; until R)",
    54: "MAR ← Table ‖ Vector", 53: "MDR ← M[MAR] (until R)", 55: "PC ← MDR",
    8: "MAR ← SP; test PSR[15]", 36: "MDR ← M[MAR] (until R)", 38: "PC ← MDR", 39: "MAR, SP ← SP + 1", 40: "MDR ← M[MAR] (until R)", 42: "PSR ← MDR", 34: "SP ← SP + 1; test PSR[15]",
    51: "nothing (already supervisor)", 59: "Saved SSP ← R6; R6 ← Saved USP",
    49: "Table ← x01; Vector ← INTV; PSR[10:8] ← priority; MDR ← PSR; PSR[15] ← 0; test old privilege",
  };
  const FETCH = [18, 33, 28, 30, 32];
  const TRAPTAIL = [37, 41, 43, 46, 52, 54, 53, 55];
  const PATHS = {
    "ADD": [...FETCH, 1], "LD": [...FETCH, 2, 35, 25, 27], "LDI": [...FETCH, 10, 17, 24, 26, 35, 25, 27], "ST": [...FETCH, 3, 23, 16], "STI": [...FETCH, 11, 19, 29, 31, 23, 16],
    "BR (taken)": [...FETCH, 0, 22], "JSR": [...FETCH, 4, 21], "LEA": [...FETCH, 14],
    "TRAP (from user mode)": [...FETCH, 15, 47, 45, ...TRAPTAIL], "RTI (back to user mode)": [...FETCH, 8, 36, 38, 39, 40, 42, 34, 59],
    "Interrupt (user program)": [18, 49, 45, ...TRAPTAIL],
  };
  const MEMSTATES = new Set([28, 24, 25, 29, 16, 41, 52, 53, 36, 40]);
  let PSN = 0;
  function pathStepper(host, start = "ADD") {
    let name = start, lat = 1, k = 0, seq = [];
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`), bN = btn("Next clock cycle →", "primary"), bR = btn("Restart");
    const build = () => { seq = []; PATHS[name].forEach((s) => { const n = MEMSTATES.has(s) ? lat : 1; for (let i = 0; i < n; i++) seq.push([s, i, n]); }); seq.push([18, 0, 1, true]); k = 0; };
    const draw = () => {
      const [s, i, n, next] = seq[k];
      const chips = PATHS[name].map((x) => `<span class="mono" style="display:inline-block;padding:3px 8px;margin:2px;border-radius:8px;border:1px solid var(--line);background:${x === s && !next ? "var(--accent)" : "var(--card)"};color:${x === s && !next ? "var(--on-accent)" : "var(--ink)"}">${x}</span>`).join("→");
      out.innerHTML = `<p style="line-height:2">${chips} → <span class="mono">18</span></p>${next ? `<p><b>Done</b>: back to state 18 to fetch the next instruction. ${seq.length - 1} clock cycles in all.</p>` : `<p><b>Cycle ${k + 1}: state ${s}</b> (${b6(s)})${n > 1 ? `, memory cycle ${i + 1} of ${n}${i < n - 1 ? ": R = 0, stay" : ": R = 1, move on"}` : ""}</p><p class="mono" style="overflow-wrap:anywhere">${RTLS[s]}</p>`}`;
      bN.disabled = k >= seq.length - 1;
    };
    bN.addEventListener("click", () => { k++; draw(); }); bR.addEventListener("click", () => { k = 0; draw(); });
    row.append(bN, bR);
    host.append(toggle(Object.keys(PATHS), (j) => { name = Object.keys(PATHS)[j]; build(); draw(); }, Object.keys(PATHS).indexOf(start)),
      slider({ id: "ppCmem" + ++PSN, label: "Memory access time", min: 1, max: 5, step: 1, value: 1, show: (v) => Math.round(v) + " cycle" + (Math.round(v) > 1 ? "s" : "") }, (v) => { lat = Math.round(v); build(); draw(); }).el, row, out);
    build(); draw();
  }

  /* ---------- microsequencer (Figure C.5) on the text's four worked states ---------- */
  const MS = [
    { st: 18, J: 0b100001, COND: 0b101, sig: "INT", bit: 4, what: "interrupt test" },
    { st: 28, J: 0b011100, COND: 0b001, sig: "R", bit: 1, what: "memory ready" },
    { st: 49, J: 0b100101, COND: 0b100, sig: "PSR[15]", bit: 3, what: "privilege mode" },
    { st: 34, J: 0b110011, COND: 0b100, sig: "PSR[15]", bit: 3, what: "privilege mode" },
  ];
  function microseq(host) {
    let i = 0, v = 0;
    const out = el(`<div></div>`), tWrap = el(`<div></div>`);
    const draw = () => {
      const m = MS[i], nxt = m.J | (v << m.bit);
      out.innerHTML = `<div class="tbl"><table style="font-family:var(--mono)"><tbody>
        <tr><td>IRD</td><td>0 (don't use the opcode)</td></tr>
        <tr><td>COND</td><td>${m.COND.toString(2).padStart(3, "0")} (${m.what}: lets <b>${m.sig}</b> through its AND gate into J[${m.bit}])</td></tr>
        <tr><td>J</td><td>${b6(m.J)} (state ${m.J})</td></tr>
        <tr><td>${m.sig}</td><td>${v}</td></tr>
        <tr><td><b>next state</b></td><td><b>${b6(nxt)} = state ${nxt}</b></td></tr></tbody></table></div><p>${m.sig} = ${v}: ${{ 18: ["no interrupt, continue the fetch (33)", "start initiating an interrupt (49)"], 28: ["memory not done: repeat state 28", "memory done: go on to 30 (IR ← MDR)"], 49: ["already in supervisor mode: go straight to 37", "user program: switch stacks in 45 first"], 34: ["returning to supervisor code: 51 (nothing to do)", "returning to a user program: switch stacks in 59"] }[m.st][v]}.</p>`;
    };
    const mkSig = () => { tWrap.innerHTML = ""; tWrap.append(toggle([`${MS[i].sig} = 0`, `${MS[i].sig} = 1`], (j) => { v = j; draw(); }, v)); };
    host.append(toggle(MS.map((m) => `state ${m.st}`), (j) => { i = j; v = 0; mkSig(); draw(); }, 0), tWrap, out); mkSig(); draw();
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Data path plus control", mins: 15,
    blurb: "Every clock cycle, 52 control signals run the machine: 42 steer the data path, 10 help choose the next state.",
    takeaway: "A microarchitecture implements an ISA by carrying out the instruction cycle for every instruction. Two parts (Figure C.1): the data path (all components that process instructions) and the control (generates the control signals each clock cycle). Cycle time, e.g., 0.33 ns = 3 GHz. Each cycle 52 control signals: 42 control the data path, 10 (J[5:0], COND[2:0], IRD) help generate the next cycle's signals. The next cycle's signals depend on: (1) J, COND, IRD from the current cycle; (2) the instruction: IR[15:12] (opcode) and IR[11] (JSR vs JSRR); (3) privilege: PSR[15], and ACV (a User-mode access to privileged memory); (4) BEN (should a BR be taken); (5) INT (a higher-priority device requests an interrupt); (6) R (a memory operation completes this cycle).",
    steps: [
      { k: "learn", title: "Two halves", b: [
        `<div class="two"><div class="tile"><h3>Data path</h3><p>Registers, ALU, adders, muxes, buses, memory interface. Does the work.</p><p class="m">42 control signals per cycle</p></div><div class="tile"><h3>Control</h3><p>Decides, each cycle, which data-path signals to assert and what comes next.</p><p class="m">10 more signals pick the next state</p></div></div>`,
        seenPP("The LC-3 data path and the instruction cycle phases.", "05-lc3.html", "Chapter 5"),
      ]},
      { k: "learn", title: "What decides the next cycle", b: [
        `<div class="tbl"><table><tbody>
          <tr><td>J[5:0], COND[2:0], IRD</td><td>from the current cycle's control</td></tr>
          <tr><td>IR[15:12], IR[11]</td><td>the opcode; JSR vs JSRR</td></tr>
          <tr><td>PSR[15], ACV</td><td>privilege; access-control violation</td></tr>
          <tr><td>BEN</td><td>branch enable: is this BR taken?</td></tr>
          <tr><td>INT</td><td>an interrupt is requested</td></tr>
          <tr><td>R</td><td>memory is ready (finishes this cycle)</td></tr></tbody></table></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "A clock period of 0.25 ns corresponds to what frequency in GHz?", a: 4, tol: 0.01, why: "1 / 0.25 ns = 4 GHz." },
        { t: "mcq", q: "Why does the control need the R signal from memory?", opts: [["Memory may take several cycles, so the control must wait until the data is valid", true, "Otherwise garbage would be loaded into the IR."], ["To pick read or write", false, "That's R.W."], ["To check privilege", false, "That's PSR[15] and ACV."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What information does the LC-3's control use to decide the next state?", model: "It uses ten bits from the current microinstruction (the J field, the COND field and IRD) together with the opcode and IR[11] from the instruction register, the privilege bit PSR[15] and the ACV signal, BEN for branches, INT for interrupt requests, and R, which says whether a memory access completes this cycle." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "The state machine", mins: 25,
    blurb: "59 states, one per clock cycle. Fetch is 18 → 33 → 28 → 30 → 32; then the opcode chooses one of 16 paths back to 18.",
    takeaway: "The 52 control signals are the state of the control structure; the state machine (Figures C.2 and C.7) is a directed graph: one node per state (the data-path work done in that one clock cycle is written inside) and arcs to successor states. 59 states need six state variables; a state's number is the decimal value of its six bits (state 18 = 010010). FETCH: state 18: MAR ← PC, PC ← PC + 1, set ACV, test INT; state 33: test ACV (to 60 if violated); state 28: MDR ← M, repeated until R; state 30: IR ← MDR; state 32: DECODE, BEN ← IR[11]·N + IR[10]·Z + IR[9]·P, and 16 arcs selected by IR[15:12] (13 used here). Every instruction's last state returns to 18. Examples: ADD state 1 (DR ← SR1 + OP2, set CC); LD 2 → 35 → 25 → 27; LDI 10 → 17 → 24 → 26 → 35 → 25 → 27; ST 3 → 23 → 16; STI 11 → 19 → 29 → 31 → 23 → 16; BR 0 → 22 if BEN; JSR 4 → 21 (PC + off11) or 20 (BaseR), R7 ← PC; JMP 12; LEA 14 (no CC); the ACV-test states 17, 19, 23, 33, 35 branch to exception states on a violation.",
    steps: [
      { k: "learn", title: "Fetch and decode", b: [
        `<div class="tbl"><table style="font-family:var(--mono)"><tbody>
          <tr><td>18</td><td>MAR ← PC; PC ← PC + 1; set ACV; [INT]</td></tr>
          <tr><td>33</td><td>[ACV]</td></tr>
          <tr><td>28</td><td>MDR ← M (stay until R)</td></tr>
          <tr><td>30</td><td>IR ← MDR</td></tr>
          <tr><td>32</td><td>DECODE; BEN ← IR[11]·N + IR[10]·Z + IR[9]·P; [IR[15:12]]</td></tr></tbody></table></div>`,
        `<p>59 states need 6 state bits. The number on each state is its 6-bit code in decimal: state 18 is 010010.</p>`,
      ]},
      { k: "play", title: "Follow an instruction", b: [
        (host) => pathStepper(host),
        `<p class="aside">Pick an instruction and step. Then raise the memory access time: every memory state repeats until R = 1. Count the cycles.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "With 1-cycle memory, how many clock cycles does an ADD take, from state 18 through state 1?", a: 6, tol: 0.01, why: "18, 33, 28, 30, 32, 1." },
        { t: "mcq", q: "Why does LDI visit two ACV-test states (17 and 35) while LD visits only one?", opts: [["LDI reads memory twice: the pointer and then the data; each address must be checked", true, "Either address could be privileged."], ["LDI is privileged", false, "Any program may use it."], ["It's a design accident", false, "Every memory access gets an ACV check."]] },
        { t: "mcq", q: "After DECODE (state 32), how does the machine know which of 16 states to go to?", opts: [["The opcode IR[15:12] becomes the next state address", true, "ADD (0001) → state 1, TRAP (1111) → state 15…"], ["It tries each in turn", false, "One cycle, one next state."], ["The PC chooses", false, "The PC points at the next instruction, not a state."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe what the LC-3 does in states 18, 33, 28, 30 and 32.", model: "In 18 it loads MAR with the PC, increments the PC, checks whether the address is an access violation, and tests for an interrupt. In 33 it tests ACV. In 28 it reads the instruction from memory into MDR, repeating until memory signals ready. In 30 it copies MDR into the IR. In 32 it decodes: it computes BEN for a possible branch and uses the opcode to jump to the first state of that instruction's own path." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Microprogramming: control store and microsequencer", mins: 20,
    blurb: "Store each state's 52 control bits in a small memory. A microsequencer computes the address of the next one.",
    takeaway: "Data path (Figure C.3, expanded from Figure 5.18) with control signals per component; Table C.1 lists the 42: load enables (LD.MAR, LD.MDR, LD.IR, LD.BEN, LD.REG, LD.CC, LD.PC, LD.Priv, LD.Priority, LD.SavedSSP, LD.SavedUSP, LD.ACV, LD.Vector), bus gates (GatePC, GateMDR, GateALU, GateMARMUX, GateVector, GatePC−1, GatePSR, GateSP), mux selects (PCMUX: PC+1, BUS, ADDER; DRMUX: IR[11:9], R7, R6; SR1MUX: IR[11:9], IR[8:6], R6; ADDR1MUX: PC, BaseR; ADDR2MUX: ZERO, offset6, PCoffset9, PCoffset11; SPMUX; MARMUX: ZEXT IR[7:0], ADDER; TableMUX; VectorMUX; PSRMUX), ALUK (ADD, AND, NOT, PASSA), MIO.EN, R.W, Set.Priv. Microprogrammed control (Figure C.4): each state's 52 bits = one microinstruction, stored in the control store at the state's 6-bit address (2^6 × 52). Microsequencer (Figure C.5, Table C.2): IRD = 1 → next address = 00‖IR[15:12] (used in state 32); otherwise J[5:0] with one bit ORed in by COND: 000 unconditional, 001 memory ready (R → J[1]), 010 branch (BEN → J[2]), 011 addressing mode (IR[11] → J[0]), 100 privilege mode (PSR[15] → J[3]), 101 interrupt test (INT → J[4]), 110 ACV test (ACV → J[5]). Examples: state 28: COND 001, J 011100 → 28 until R = 1 → 011110 = 30. State 18: COND 101, J 100001 → 33, or 110001 = 49 if INT. Extra logic (Figure C.6) makes DR, SR1, BEN and ACV (ACV = PSR[15] AND (address < x3000 or ≥ xFE00)). The control store contents (Figure C.9) are left for the reader to fill in.",
    steps: [
      { k: "learn", title: "Microinstructions", b: [
        `<p>Each state's 52 control bits form a <b>microinstruction</b>, stored in a small <b>control store</b> at the state's 6-bit address. Running an LC-3 instruction = running a short sequence of microinstructions.</p>`,
        `<div class="tbl"><table><tbody><tr><td>LD.*</td><td>load a register this cycle (LD.MAR, LD.PC, LD.REG…)</td></tr><tr><td>Gate*</td><td>drive the bus (GatePC, GateMDR, GateALU…)</td></tr><tr><td>…MUX</td><td>choose a mux input (PCMUX, ADDR2MUX, DRMUX…)</td></tr><tr><td>ALUK</td><td>ADD, AND, NOT, PASSA</td></tr><tr><td>MIO.EN, R.W</td><td>start a memory/I/O read or write</td></tr></tbody></table></div>`,
        `<p class="aside">Figure C.9, the control store's actual bits, is left blank in the book for you to fill in. That's your exercise; these pages won't fill it in.</p>`,
      ]},
      { k: "learn", title: "The microsequencer", b: [
        `<p>Next state address:</p><ul><li><b>IRD = 1</b> (only in state 32): 00 ‖ IR[15:12]: the opcode picks the state.</li><li>Otherwise: <b>J[5:0]</b>, with one bit possibly ORed in, chosen by <b>COND</b>:</li></ul>`,
        `<div class="tbl"><table style="font-family:var(--mono)"><tbody><tr><td>000</td><td>unconditional</td></tr><tr><td>001</td><td>R → J[1]</td></tr><tr><td>010</td><td>BEN → J[2]</td></tr><tr><td>011</td><td>IR[11] → J[0]</td></tr><tr><td>100</td><td>PSR[15] → J[3]</td></tr><tr><td>101</td><td>INT → J[4]</td></tr><tr><td>110</td><td>ACV → J[5]</td></tr></tbody></table></div>`,
      ]},
      { k: "play", title: "The book's worked states", b: [
        microseq,
        `<p class="aside">These four are worked in the text. Notice the pattern: J names the “no” successor, and the condition bit turns it into the “yes” successor.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why are states 28 and 30 numbered 011100 and 011110?", opts: [["They differ only in J[1], the bit R can set, so R = 1 turns 28 into 30", true, "The numbering is chosen to make the microsequencer simple."], ["They're consecutive even numbers", false, "That's a coincidence of this pair."], ["Memory states must be even", false, "No such rule."]] },
        { t: "num", q: "How many words does a control store with 6-bit addresses hold?", a: 64, tol: 0.01, why: "2⁶ = 64 locations; 59 are used." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the microsequencer let a memory read take several cycles?", model: "The memory-read state, such as state 28, has COND set to the memory-ready condition and J set to its own address. While memory isn't finished, R is 0, so the next address is J and the same microinstruction runs again. In the cycle where memory completes, R is 1, which ORs a 1 into J[1], changing 28 into 30, so the machine moves on with valid data in MDR." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "TRAP, RTI and memory-mapped I/O, state by state", mins: 20,
    blurb: "TRAP pushes PSR and PC through a dozen states; RTI pops them back. The address control logic needs no new states at all.",
    takeaway: "TRAP (Figure C.7): 32 → 15: Table ← x00 (to form MAR[15:8] of the trap vector table entry), PC ← PC + 1 (so the later PC − 1 in state 43 gives the right return address), MDR ← PSR. 47: Vector ← IR[7:0], PSR[15] ← 0, test the old privilege: user → 45 (Saved USP ← R6, R6 ← Saved SSP) then 37; supervisor → 37 directly. 37, 41: push PSR (SP ← SP − 1, write). 43: MDR ← PC − 1; 46, 52: push PC. 54: MAR ← Table ‖ Vector; 53: read; 55: PC ← MDR; back to 18 (fetching the service routine's first instruction). RTI: 32 → 8 (MAR ← SP; test PSR[15]: User mode → privilege exception via 44); 36, 38: pop PC; 39, 40, 42: pop PSR (SP + 1, read, PSR ← MDR); 34: SP ← SP + 1, test PSR[15]: 51 (nothing) or 59 (Saved SSP ← R6, R6 ← Saved USP); → 18. Memory-mapped I/O needs no state changes: e.g., in state 25 with MAR = xFE02 the MDR is fed from KBDR. The address control logic (ADDR.CTL.LOGIC, Table C.3) takes MAR, MIO.EN and R.W and produces MEM.EN, the INMUX select (memory, KBSR, KBDR, DSR) and load enables (LD.KBSR, LD.DSR, LD.DDR).",
    steps: [
      { k: "learn", title: "TRAP in states", b: [
        `<div class="tbl"><table style="font-family:var(--mono);font-size:14px"><tbody>
          <tr><td>15</td><td>Table ← x00; PC ← PC + 1; MDR ← PSR</td></tr>
          <tr><td>47</td><td>Vector ← IR[7:0]; PSR[15] ← 0; [old privilege]</td></tr>
          <tr><td>45</td><td>(user only) Saved USP ← R6; R6 ← Saved SSP</td></tr>
          <tr><td>37, 41</td><td>push PSR</td></tr>
          <tr><td>43, 46, 52</td><td>MDR ← PC − 1; push it</td></tr>
          <tr><td>54, 53, 55</td><td>MAR ← Table ‖ Vector; read; PC ← MDR</td></tr></tbody></table></div>`,
        `<p>Why PC + 1 in 15 and PC − 1 in 43? States 43… are shared with interrupts, which need PC − 1 (the interrupted instruction never ran). TRAP pre-compensates so the pushed PC still points after the TRAP.</p>`,
        seenPP("TRAP, RTI and the supervisor stack from the programmer's side.", "09-io.html", "Chapter 9"),
      ]},
      { k: "learn", title: "RTI in states", b: [
        `<div class="tbl"><table style="font-family:var(--mono);font-size:14px"><tbody>
          <tr><td>8</td><td>MAR ← SP; [PSR[15]]: user mode → privilege exception</td></tr>
          <tr><td>36, 38</td><td>pop PC</td></tr>
          <tr><td>39, 40, 42</td><td>pop PSR</td></tr>
          <tr><td>34</td><td>SP ← SP + 1; [PSR[15]]</td></tr>
          <tr><td>51 / 59</td><td>nothing / Saved SSP ← R6, R6 ← Saved USP</td></tr></tbody></table></div>`,
        `<p class="aside">Use the stepper in part 2 to walk TRAP and RTI cycle by cycle.</p>`,
      ]},
      { k: "learn", title: "Memory-mapped I/O costs no states", b: [
        `<p>A load from xFE02 runs the same states as any LD. The <b>address control logic</b> looks at MAR, MIO.EN and R.W and either enables memory or selects a device register through INMUX (KBSR, KBDR, DSR), or asserts LD.KBSR, LD.DSR or LD.DDR on a store.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A TRAP from a program already in supervisor mode skips which state?", opts: [["45, the stack switch", true, "R6 already points at the supervisor stack."], ["47", false, "47 loads Vector and tests privilege; it always runs."], ["43", false, "The PC must still be pushed."]] },
        { t: "mcq", q: "In state 54, what goes into MAR for TRAP x23?", opts: [["x0023: Table (x00) concatenated with Vector (x23)", true, "The trap vector table entry."], ["x0123", false, "Table is x01 only for interrupts and exceptions."], ["x2300", false, "Table is the high byte, Vector the low byte."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the TRAP instruction's state sequence find the service routine's address?", model: "In state 15 it sets the Table register to x00, and in state 47 it loads the Vector register with the trap vector from IR[7:0]. After pushing PSR and PC, state 54 loads MAR with Table concatenated with Vector, which is the trap vector table entry; state 53 reads that word into MDR, and state 55 loads it into the PC." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Interrupts and exceptions in the state machine", mins: 20,
    blurb: "INT is tested in exactly one state. Interrupts and the three exceptions all funnel into the same push-and-vector sequence.",
    takeaway: "Interrupts and exceptions both stop the running program, push its PSR and PC onto the supervisor stack, fetch a service routine's start from the interrupt vector table (x0100–x01FF) and load the PC. Interrupts come from outside; exceptions from the program itself (privilege mode violation, illegal opcode, ACV). Figure C.8 adds Table, Vector, Saved SSP/USP, priority logic, PSRMUX, GatePSR, GateSP, GateVector, GatePC−1. Interrupt: INT is tested only in state 18 (COND = 101, J = 100001) so instructions are never interrupted midway; INT → state 49 (110001): MDR ← PSR, PSR[15] ← 0, PSR[10:8] ← device priority, Vector ← INTV, Table ← x01, test the old PSR[15] (COND = 100, J = 100101): 37 if supervisor, 45 (switch stacks) if user. Then 37, 41 push PSR; 43 MDR ← PC − 1 (undo state 18's increment); 46, 52 push PC; 54 MAR ← x01 ‖ Vector; 53 read; 55 PC ← start. Privilege mode exception: state 8 → 44 (Table ← x01, Vector ← x00, MDR ← PSR, PSR[15] ← 0) → 45 (it's known to be user mode); priority unchanged, no mode test. Illegal opcode: state 32 → 13 (Vector ← x01), may be in either mode → 37 or 45. ACV: tested in states 17, 19, 23, 33, 35 → 56, 61, 48, 60, 57 (Vector ← x02) → 45. Exceptions don't change the priority. Two stacks, R6 swapped with Saved SSP/Saved USP on each privilege change.",
    steps: [
      { k: "learn", title: "Only in state 18", b: [
        `<p>INT is tested only in state 18, at the very start of an instruction cycle. An instruction is never interrupted half-way, so nothing partial needs remembering.</p>`,
        `<div class="tbl"><table style="font-family:var(--mono);font-size:14px"><tbody>
          <tr><td>49</td><td>MDR ← PSR; PSR[15] ← 0; PSR[10:8] ← priority; Vector ← INTV; Table ← x01; [old PSR[15]]</td></tr>
          <tr><td>45</td><td>(user) switch to the supervisor stack</td></tr>
          <tr><td>37…52</td><td>push PSR, push PC − 1</td></tr>
          <tr><td>54, 53, 55</td><td>PC ← M[x01 ‖ Vector]</td></tr></tbody></table></div>`,
        `<p>Why PC − 1? State 18 already incremented the PC for an instruction that never got fetched.</p>`,
      ]},
      { k: "learn", title: "Three exceptions, three entry states", b: [
        `<div class="tbl"><table><thead><tr><th>Exception</th><th>Detected in</th><th>Entry state</th><th>Vector</th></tr></thead><tbody>
          <tr><td>Privilege (RTI in user mode)</td><td>8</td><td>44</td><td>x00</td></tr>
          <tr><td>Illegal opcode (1101)</td><td>32</td><td>13</td><td>x01</td></tr>
          <tr><td>ACV</td><td>17, 19, 23, 33, 35</td><td>56, 61, 48, 60, 57</td><td>x02</td></tr></tbody></table></div>`,
        `<p>Unlike state 49, these don't change the priority. The privilege exception also skips the mode test: it can only happen in user mode.</p>`,
        seenHH("The MIPS multicycle FSM, extended with exception states S12–S14.", "07-microarchitecture.html", "Chapter 7"),
      ]},
      { k: "play", title: "Step an interrupt", b: [
        `<p>The same stepper as part 2, set to an interrupt arriving while a user program runs:</p>`,
        (host) => pathStepper(host, "Interrupt (user program)"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why does state 13 (illegal opcode) test the privilege mode but state 44 (privilege exception) doesn't?", opts: [["An illegal opcode can occur in either mode; a privilege exception only happens in user mode", true, "So 44 always goes to 45 to switch stacks."], ["State 44 has no time", false, "Each state is one cycle regardless."], ["Illegal opcodes are always in user mode", false, "Supervisor code can contain one too."]] },
        { t: "mcq", q: "Which register supplies the interrupt vector, and which the trap vector?", opts: [["INTV from the device; IR[7:0] from the TRAP instruction", true, "Both end up in the Vector register."], ["Both come from IR[7:0]", false, "The interrupting device supplies INTV."], ["Both come from the PSR", false, "The PSR holds privilege, priority and CC."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Trace how the LC-3 initiates an interrupt for a program running in user mode.", model: "In state 18 INT is 1, so the microsequencer goes to state 49. There MDR gets the old PSR, PSR[15] becomes supervisor, the priority becomes the device's, Vector gets INTV and Table gets x01. Since the old PSR[15] was 1, the next state is 45, which saves R6 in Saved USP and loads R6 from Saved SSP. States 37 and 41 push the PSR, 43, 46 and 52 push PC − 1, then 54 forms the address x01 concatenated with Vector, 53 reads the service routine's address and 55 loads it into the PC before returning to state 18." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "ppC", eyebrow: "Patt & Patel · Appendix C", title: "The Microarchitecture of the LC-3",
    intro: `<p>Five parts: data path and control, the 59-state machine, microprogramming (control store and microsequencer), TRAP/RTI/I/O as state sequences, and interrupts and exceptions.</p><p>This is the bridge to Harris & Harris Chapter 7: the same ideas (a datapath, an FSM controller) for a different ISA. Arrow keys ← → move between steps.</p>`,
    after: `<p>The book leaves the control store (Figure C.9) for you to fill in: for each state, work out which load enables, gates and mux selects its RTL needs. Do it on paper, one state at a time, starting with 18, 33, 28, 30 and 32.</p><p>Stuck? Tell Claude which state and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5],
    summary: `
      <h3>Structure</h3>
      <p>Data path (42 control signals) + control (10 next-state signals). Inputs: J, COND, IRD; IR[15:11]; PSR[15], ACV; BEN; INT; R.</p>
      <h3>State machine</h3>
      <p>59 states, 6 bits. Fetch 18 → 33 → 28 → 30 → 32; IRD → 00‖opcode; each path ends at 18. Memory states repeat until R.</p>
      <h3>Microprogramming</h3>
      <p>Microinstruction = 52 bits at the state's address. Next = J with one bit ORed by COND (R, BEN, IR[11], PSR[15], INT, ACV).</p>
      <h3>TRAP, RTI, interrupts, exceptions</h3>
      <p>Push PSR, push PC (−1), PC ← M[Table‖Vector]. INT tested only in 18 → 49. Exceptions: 44 (x00), 13 (x01), ACV states (x02); priority unchanged.</p>`,
  };
  Course.start(window.CHAPTER);
})();
