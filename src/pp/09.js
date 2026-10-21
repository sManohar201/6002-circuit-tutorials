(function () {
  const { S, slider, toggle, readout, el } = Course;
  const { sim, h4 } = LC3;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const pre = (t) => `<pre class="code">${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`;

  /* =============== PART 1 =============== */
  function psrBuilder(host) {
    let priv = 1, pl = 0, cc = 1;
    const out = el(`<div></div>`);
    const draw = () => {
      const v = (priv << 15) | (pl << 8) | ([4, 2, 1][cc]);
      const bits = v.toString(2).padStart(16, "0").split("");
      const col = (i) => (i === 0 ? "var(--accent-soft)" : i >= 5 && i <= 7 ? "var(--cool-soft)" : i >= 13 ? "var(--good-soft)" : "var(--card)");
      out.innerHTML = `<div class="tbl"><table style="text-align:center;font-family:var(--mono)"><tbody><tr>${bits.map((b, i) => `<td style="background:${col(i)};padding:4px 6px">${b}</td>`).join("")}</tr><tr>${bits.map((_, i) => `<td style="font-size:12px">${15 - i}</td>`).join("")}</tr></tbody></table></div>
        <p class="eq">PSR = ${h4(v)}</p><p>${priv ? "User mode (unprivileged)" : "Supervisor mode (privileged)"}, priority PL${pl}, condition code ${"NZP"[cc]}.</p>`;
    };
    const t1 = toggle(["User (PSR[15] = 1)", "Supervisor (PSR[15] = 0)"], (i) => { priv = i ? 0 : 1; draw(); }, 0);
    const s1 = slider({ id: "pp9pl", label: "Priority level PSR[10:8]", min: 0, max: 7, step: 1, value: 0, show: (v) => "PL" + v }, (v) => { pl = Math.round(v); draw(); });
    const t2 = toggle(["N", "Z", "P"], (i) => { cc = i; draw(); }, 1);
    host.append(t1, s1.el, el(`<p class="aside">Condition codes PSR[2:0]:</p>`), t2, out);
    draw();
  }
  const p1 = {
    id: "p1", title: "Privilege, priority, and the PSR", mins: 20,
    blurb: "Two separate ideas: the right to do something (privilege) and the urgency to do it now (priority). The PSR stores both.",
    takeaway: "Operating systems (Windows, MacOS, Linux) manage the computer's resources and keep programs from harming each other. Privilege = the right to execute an instruction or access a memory location: Supervisor mode (privileged) can do everything; User mode cannot (e.g. HALT, system memory). Priority = urgency: programs at a higher priority can interrupt programs at a lower one (e.g. user programs PL0, keyboard PL4, power failure PL6). The two are orthogonal: a physics-experiment user program has priority but no privilege; a 1 a.m. diagnostic has privilege but no priority; Bob and the executive men's room. Each program has a PC and a Processor Status Register: PSR[15] = 0 supervisor / 1 user; PSR[10:8] = priority level PL0 (lowest) to PL7 (highest); PSR[2:0] = N, Z, P.",
    steps: [
      { k: "learn", title: "Two different questions", b: [
        `<div class="two"><div class="tile"><h3>Privilege</h3><p><b>May</b> this program do it? Run every instruction, touch every memory location?</p><p class="m">Supervisor mode = yes. User mode = no.</p></div><div class="tile"><h3>Priority</h3><p><b>How urgent</b> is this program compared with others?</p><p class="m">PL0 (lowest) … PL7 (highest). Higher can interrupt lower.</p></div></div>`,
        `<p>They are <b>orthogonal</b>: knowing one tells you nothing about the other. Fire trucks have both, which fools our intuition. Computers don't tie them together.</p>`,
      ]},
      { k: "check", title: "Sort them", b: [
        { t: "sort", q: "Which does each program have?", bins: ["Privilege, low priority", "Priority, no privilege"], items: [
          ["A maintenance diagnostic that reads all of memory, run whenever convenient overnight", 0, "Needs supervisor rights, but nothing depends on it running at 1 a.m. rather than 2 a.m."],
          ["A user program that must record a physics experiment at an exact instant", 1, "It's an ordinary user program, so no privilege, but it can't wait."],
          ["A program that sets up the memory layout when nobody is waiting on it yet", 0, "Supervisor work, no urgency."],
          ["A user's music player that must hand the speaker its next samples on time", 1, "Ordinary user code that can't be late."],
        ]},
      ]},
      { k: "play", title: "Build a PSR", b: [
        psrBuilder,
        `<p class="aside">Bit 15 is privilege, bits 10–8 are the priority level, bits 2–0 are the condition codes. The other bits are not used yet.</p>`,
      ]},
      { k: "check", title: "Read a PSR", b: [
        { t: "mcq", q: "A program's PSR is x8402. What do you know about it?", opts: [["User mode, PL4, last result zero", true, "x8402 = 1000 0100 0000 0010: bit 15 = 1 (user), bits 10–8 = 100 = 4, bits 2–0 = 010 = Z."], ["Supervisor mode, PL4, last result zero", false, "Bit 15 = 1 means unprivileged."], ["User mode, PL2, last result positive", false, "Split the hex into bits: x84 is 1000 0100 for bits 15–8."]] },
        { t: "num", q: "What PSR (as a decimal number) has supervisor mode, PL7, and condition code P?", a: 0x0701, tol: 0.01, hint: "Bit 15 = 0, bits 10–8 = 111, bits 2–0 = 001.", why: "x0701 = 7 × 256 + 1 = 1793." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why do we say privilege and priority are orthogonal? Give one example of each without the other.", model: "Privilege is the right to execute every instruction and access all memory; priority is how urgently a program needs the processor. One does not imply the other. A system diagnostic needs supervisor privilege but can run whenever, so it has privilege without priority. A user program that must capture data from an experiment at an exact moment has high priority but runs in user mode, so it has priority without privilege." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  function addressProbe(host) {
    const regions = (a) => a < 0x0100 ? ["System space", "Trap Vector Table (x0000–x00FF)", false]
      : a < 0x0200 ? ["System space", "Interrupt Vector Table (x0100–x01FF)", false]
      : a < 0x3000 ? ["System space", "OS code and data, supervisor stack", false]
      : a < 0xfe00 ? ["User space", "user programs, data, user stack", true]
      : ["I/O page", { 0xfe00: "KBSR, keyboard status", 0xfe02: "KBDR, keyboard data", 0xfe04: "DSR, display status", 0xfe06: "DDR, display data", 0xfffc: "PSR, processor status", 0xfffe: "MCR, machine control" }[a] || "a device or processor register (not memory)", false];
    // not to scale: the 512-address I/O page gets a visible slice
    const y = (v) => v < 0x3000 ? 20 + (v / 0x3000) * 60 : v < 0xfe00 ? 80 + ((v - 0x3000) / (0xfe00 - 0x3000)) * 110 : 190 + ((v - 0xfe00) / 0x200) * 30;
    const bar = (a) => S.svg(420, 248, `
      <rect x="120" y="20" width="140" height="60" style="fill:var(--cool-soft);stroke:var(--ink)"/>
      <rect x="120" y="80" width="140" height="110" style="fill:var(--good-soft);stroke:var(--ink)"/>
      <rect x="120" y="190" width="140" height="30" style="fill:var(--bad-soft);stroke:var(--ink)"/>
      ${S.t(190, 55, "System space", {})}${S.t(190, 140, "User space", {})}${S.t(190, 210, "I/O page", { cls: "s" })}
      ${S.t(112, 25, "x0000", { a: "end", cls: "s" })}${S.t(112, 85, "x3000", { a: "end", cls: "s" })}${S.t(112, 195, "xFE00", { a: "end", cls: "s" })}${S.t(112, 225, "xFFFF", { a: "end", cls: "s" })}
      ${S.t(190, 236, "(not to scale)", { cls: "s m" })}
      <line x1="262" y1="${y(a)}" x2="300" y2="${y(a)}" style="stroke:var(--bad);stroke-width:2"/>${S.t(304, y(a) + 5, h4(a), { a: "start" })}`, { max: 420, label: "LC-3 memory map with the chosen address marked" });
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`);
    const show = (a) => { const [r, what, ok] = regions(a); out.innerHTML = `<div class="fig">${bar(a)}</div><p><b>${h4(a)}</b>: ${r}, ${what}.</p><p>${ok ? `<span class="verdict ok">a user-mode program may access it</span>` : `<span class="verdict no">needs supervisor privilege</span>`}</p>`; };
    [0x0021, 0x0180, 0x2fff, 0x3000, 0xfdff, 0xfe00, 0xfe06, 0xfffc].forEach((a) => { const b = btn(h4(a)); b.addEventListener("click", () => show(a)); row.append(b); });
    host.append(row, out); show(0x3000);
  }
  const p2 = {
    id: "p2", title: "The address space and memory-mapped I/O", mins: 20,
    blurb: "Three regions of addresses. The top 512 aren't memory at all: they name device registers, so LD and ST do I/O.",
    takeaway: "LC-3 memory map: x0000–x2FFF system space (privileged; OS code and data; Trap Vector Table x0000–x00FF; Interrupt Vector Table x0100–x01FF; supervisor stack); x3000–xFDFF user space (user programs and the user stack); xFE00–xFFFF the I/O page: not memory locations but device and processor registers (KBSR xFE00, KBDR xFE02, DSR xFE04, DDR xFE06, PSR xFFFC, MCR xFFFE; Table A.3); access needs supervisor privilege. Two stacks: supervisor (SSP) and user (USP). R6 is the stack pointer of whichever is active; the other is kept in Saved SSP or Saved USP and they swap when privilege changes. Every device needs at least a data register and a status register. Special I/O instructions (the PDP-8's opcode 110) vs memory-mapped I/O (most machines, including the LC-3 and the PDP-11, whose addresses with bits [15:13] = 111, i.e. 2^13 of them, were I/O): a load from a device register's address is input; a store to one is output. The address control logic looks at the MAR: for a memory address it enables memory; for a device address it selects that register through INMUX (load) or asserts its load enable, e.g. LD.DDR (store). The MIO.EN signal says whether a memory or I/O access happens this cycle; R.W says load or store.",
    steps: [
      { k: "learn", title: "Three regions", b: [
        `<div class="tbl"><table><thead><tr><th>Addresses</th><th>Region</th><th>Who may use it</th></tr></thead><tbody>
          <tr><td>x0000–x2FFF</td><td>System space: OS code, data, tables, supervisor stack</td><td>supervisor only</td></tr>
          <tr><td>x3000–xFDFF</td><td>User space: your programs, user stack</td><td>anyone</td></tr>
          <tr><td>xFE00–xFFFF</td><td>I/O page: device and processor registers, <b>not memory</b></td><td>supervisor only</td></tr></tbody></table></div>`,
        `<p>Two stacks: the <b>supervisor stack</b> (in system space) and the <b>user stack</b>. R6 points to whichever is active; the other pointer waits in <b>Saved SSP</b> or <b>Saved USP</b>.</p>`,
        seenPP("R6 as the stack pointer, push and pop.", "08-data-structures.html", "Chapter 8"),
      ]},
      { k: "play", title: "Probe an address", b: [
        addressProbe,
      ]},
      { k: "learn", title: "I/O with ordinary loads and stores", b: [
        `<p>Option 1: special I/O instructions (the old PDP-8 used opcode 110 for them).<br>Option 2, used by most machines and the LC-3: give each device register an <b>address</b>. Then:</p>`,
        `<div class="two"><div class="tile"><h3>Input</h3><p>A load (LD, LDI, LDR) from a device register's address.</p></div><div class="tile"><h3>Output</h3><p>A store (ST, STI, STR) to a device register's address.</p></div></div>`,
        `<p>This is <b>memory-mapped I/O</b>. The <b>address control logic</b> looks at the MAR. Memory address → enable memory. Device address → select that device register into the MDR through INMUX (load), or pulse its load enable such as LD.DDR (store).</p>`,
        `<p class="aside">The datapath barely changes: the same three steps as a memory load (MAR ← address, read into MDR, register ← MDR), only the source differs.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "How many addresses does the LC-3's I/O page (xFE00–xFFFF) contain?", a: 512, tol: 0.01, why: "x10000 − xFE00 = x200 = 512." },
        { t: "mcq", q: "A user-mode program executes LDI R0, PTR where PTR holds x3100. Is this I/O?", opts: [["No: x3100 is a user-space memory location", true, "Only xFE00–xFFFF are device registers."], ["Yes: LDI is an I/O instruction", false, "The LC-3 has no I/O instructions; the address decides."], ["Yes: indirect loads always reach devices", false, "LDI just adds one more memory read for the pointer."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What makes an LC-3 load instruction an input instruction?", model: "Only its address. The LC-3 uses memory-mapped I/O: device registers such as KBDR are assigned addresses in the I/O page, xFE00 to xFFFF. When a load's address is one of those, the address control logic selects the device register instead of memory to supply the MDR, so the same LD, LDI or LDR does input." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  function handshake(host) {
    let ready = 0, kbdr = 0, next = 0, log = [], got = "";
    const letters = "HELLO WORLD";
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`);
    const bType = btn("Typist strikes the next key"), bPoll = btn("CPU: LDI R1, KBSR (poll)"), bRead = btn("CPU: LDI R0, KBDR (read)", "primary"), bReset = btn("Reset");
    const draw = () => {
      out.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px;margin:6px 0">
        <div class="tile"><b>KBSR[15]</b> (ready) = <span class="mono">${ready}</span></div>
        <div class="tile"><b>KBDR</b> = <span class="mono">${kbdr ? `${h4(kbdr)} '${String.fromCharCode(kbdr)}'` : "x0000"}</span></div>
        <div class="tile"><b>Program has read</b>: <span class="mono">"${got}"</span></div></div>
        <div class="tbl" style="max-height:200px;overflow:auto"><table><tbody>${log.slice().reverse().map((l) => `<tr><td>${l}</td></tr>`).join("")}</tbody></table></div>`;
    };
    bType.addEventListener("click", () => {
      if (next >= letters.length) { log.push("No more keys in this demo. Press Reset."); }
      else if (ready) log.push(`<span class="verdict mid">keyboard disabled</span> KBSR[15] is still 1: the last key hasn't been read, so this key can't be struck yet.`);
      else { kbdr = letters.charCodeAt(next++); ready = 1; log.push(`Key '${String.fromCharCode(kbdr)}' struck: KBDR ← ${h4(kbdr)}, KBSR[15] ← 1.`); }
      draw();
    });
    bPoll.addEventListener("click", () => { log.push(ready ? "Poll: KBSR = x8000, negative, BRzp falls through → go read KBDR." : "Poll: KBSR = x0000, BRzp branches back → poll again."); draw(); });
    bRead.addEventListener("click", () => { got += String.fromCharCode(kbdr || 32); log.push(`Read KBDR = ${h4(kbdr)}; the keyboard clears KBSR[15] ← 0.${ready ? "" : ' <span class="verdict mid">ready was 0</span>'}`); ready = 0; draw(); });
    bReset.addEventListener("click", () => { ready = 0; kbdr = 0; next = 0; log = []; got = ""; draw(); });
    row.append(bType, bPoll, bRead, bReset); host.append(row, out); draw();
  }
  const p3 = {
    id: "p3", title: "Slow devices, fast processor: the ready bit", mins: 20,
    blurb: "A typist and a 2 GHz processor don't march in step. A one-bit flag lets them hand over characters safely.",
    takeaway: "I/O is usually much slower than the processor and not in lockstep with it: asynchronous. (A 2 GHz processor taking 10 cycles per read could read every 5 ns; no typist comes close, and typing speed varies moment to moment.) Synchronous I/O would require the device to deliver data at fixed, known intervals in lockstep with the clock. Asynchronous I/O needs a handshake; the simplest is a one-bit status flag, the ready bit. Keyboard: typing a key loads KBDR[7:0] and sets KBSR[15]; reading KBDR clears KBSR[15]; while KBSR[15] = 1 the keyboard is disabled. So each typed key is loaded exactly once: never read twice, never missed. Display: writing DDR clears DSR[15]; the monitor sets DSR[15] when it has finished the character. Who controls the interaction: polling (the processor repeatedly tests the ready bit) vs interrupt-driven (the device announces it needs service).",
    steps: [
      { k: "learn", title: "Asynchronous", b: [
        `<p>A 2 GHz processor could read the keyboard every few nanoseconds. A fast typist manages a few characters per <i>second</i>, at an irregular pace. The two are <b>asynchronous</b>: not in lockstep.</p>`,
        `<p>(If the typist could deliver exactly one character every N cycles, the processor could simply read at those moments: <b>synchronous</b>. People don't work that way.)</p>`,
        `<p>The fix is a one-bit <b>ready</b> flag in a status register.</p>`,
      ]},
      { k: "learn", title: "The keyboard's two registers", b: [
        `<div class="tbl"><table><thead><tr><th>Register</th><th>Address</th><th>Used bits</th></tr></thead><tbody>
          <tr><td>KBDR (data)</td><td>xFE02</td><td>[7:0] = ASCII of the key; [15:8] = 0</td></tr>
          <tr><td>KBSR (status)</td><td>xFE00</td><td>[15] = ready</td></tr></tbody></table></div>`,
        `<ul><li>Key struck → KBDR ← ASCII, KBSR[15] ← 1.</li><li>Processor reads KBDR → KBSR[15] ← 0.</li><li>While KBSR[15] = 1, the keyboard is disabled.</li></ul>`,
      ]},
      { k: "play", title: "Be the handshake", b: [
        handshake,
        `<p class="aside">Try striking two keys in a row without reading. Then do it properly: poll until ready, read, repeat.</p>`,
      ]},
      { k: "learn", title: "The display's two registers", b: [
        `<div class="tbl"><table><thead><tr><th>Register</th><th>Address</th><th>Used bits</th></tr></thead><tbody>
          <tr><td>DDR (data)</td><td>xFE06</td><td>[7:0] = ASCII to display</td></tr>
          <tr><td>DSR (status)</td><td>xFE04</td><td>[15] = ready for another character</td></tr></tbody></table></div>`,
        `<p>Same idea, reversed: writing DDR clears DSR[15]; the monitor sets DSR[15] again when the character is on the screen.</p>`,
        `<div class="two"><div class="tile"><h3>Polling</h3><p>The <b>processor</b> is in charge: it keeps asking “ready yet?”</p></div><div class="tile"><h3>Interrupt-driven</h3><p>The <b>device</b> is in charge: it says “I need you now.”</p></div></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "KBSR[15] is 1. What does the processor know?", opts: [["A key has been typed and not yet read", true, "The keyboard set the bit when the key was struck; reading KBDR will clear it."], ["The keyboard is ready for the processor to send it a character", false, "The keyboard is an input device; that's the display's DSR idea."], ["KBDR is empty", false, "The opposite: it holds a character that hasn't been read."]] },
        { t: "mcq", q: "The program writes a character to DDR. Right after, DSR[15] is…", opts: [["0, until the monitor finishes", true, "The write clears the ready bit; the monitor sets it again when done."], ["1, ready for more at once", false, "The monitor needs time to put the character on screen."], ["unchanged", false, "Writing DDR is exactly what clears it."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the single ready bit guarantee each key is read exactly once?", model: "Striking a key sets KBSR[15] and, while it is set, the keyboard accepts no new key. The processor reads KBDR only after seeing the bit set, and reading KBDR clears it. So the processor never reads the same character twice (the bit is clear after a read), and the typist can't overwrite a character that hasn't been read (the keyboard is disabled until then)." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const INPUT = `        .ORIG x3000
START   LDI  R1, A        ; test for character input
        BRzp START        ; bit 15 = 0: nothing yet
        LDI  R0, B        ; read the character
        HALT              ; (the book: BRnzp NEXT_TASK)
A       .FILL xFE00       ; address of KBSR
B       .FILL xFE02       ; address of KBDR
        .END`;
  const ECHO = `        .ORIG x3000
START   LDI  R1, KBSR     ; test for character input
        BRzp START
        LDI  R0, KBDR
ECHO    LDI  R1, DSR      ; test output register ready
        BRzp ECHO
        STI  R0, DDR
        BRnzp START       ; (the book: BRnzp NEXT_TASK)
KBSR    .FILL xFE00
KBDR    .FILL xFE02
DSR     .FILL xFE04
DDR     .FILL xFE06
        .END`;
  const PROMPT = `        .ORIG x3000
START   ST   R1,SaveR1    ; save registers needed
        ST   R2,SaveR2    ; by this routine
        ST   R3,SaveR3
        LD   R2,Newline
L1      LDI  R3,DSR
        BRzp L1           ; loop until monitor is ready
        STI  R2,DDR       ; move cursor to new clean line
        LEA  R1,Prompt    ; starting address of prompt string
Loop    LDR  R0,R1,#0     ; write the input prompt
        BRz  Input        ; end of prompt string
L2      LDI  R3,DSR
        BRzp L2           ; loop until monitor is ready
        STI  R0,DDR       ; write next prompt character
        ADD  R1,R1,#1     ; increment prompt pointer
        BRnzp Loop
Input   LDI  R3,KBSR
        BRzp Input        ; poll until a character is typed
        LDI  R0,KBDR      ; load input character into R0
L3      LDI  R3,DSR
        BRzp L3
        STI  R0,DDR       ; echo input character
L4      LDI  R3,DSR
        BRzp L4
        STI  R2,DDR       ; move cursor to new clean line
        LD   R1,SaveR1    ; restore registers
        LD   R2,SaveR2
        LD   R3,SaveR3
        HALT              ; (the book: BRnzp NEXT_TASK)
SaveR1  .BLKW 1
SaveR2  .BLKW 1
SaveR3  .BLKW 1
DSR     .FILL xFE04
DDR     .FILL xFE06
KBSR    .FILL xFE00
KBDR    .FILL xFE02
Newline .FILL x000A
Prompt  .STRINGZ "Input a character>"
        .END`;
  const p4 = {
    id: "p4", title: "Polling in code", mins: 25,
    blurb: "LDI the status register, BRzp back while it's not ready, then LDI or STI the data register. Run it and count the wasted polls.",
    takeaway: "Basic input routine (polling): START LDI R1,A (A = xFE00, KBSR); BRzp START (bit 15 is the sign bit: 0 means not ready, so loop); LDI R0,B (B = xFE02, KBDR); then go on. LDI is used because the device addresses are far from the code: the pointer word holds the full 16-bit address. Output: LDI R1,DSR (xFE04) / BRzp / STI R0,DDR (xFE06). Keyboard echo = the two routines combined. Figure 9.7, the more sophisticated input routine: save R1–R3; write a newline (x0A, a control character) after polling DSR; write the prompt string \"Input a character>\" (.STRINGZ: 18 characters + x0000, 19 words) one character at a time, each after polling DSR; poll KBSR, read KBDR, echo it; another newline; restore R1–R3. The full data path (Figure 9.8): the address control logic, driven by MAR, R.W and MIO.EN, picks memory or KBDR/KBSR/DSR/DDR for INMUX, or enables a memory write or a device register's load; the status registers must be writable too (for interrupt enables).",
    steps: [
      { k: "learn", title: "The input loop", b: [
        pre(`START LDI  R1, A     ; R1 <- KBSR
      BRzp START       ; bit 15 = 0? not ready: ask again
      LDI  R0, B       ; R0 <- KBDR (clears the ready bit)
A     .FILL xFE00      ; KBSR
B     .FILL xFE02      ; KBDR`),
        `<p><b>BRzp</b> works because bit 15 is the sign bit: ready = 1 makes the value negative, so the branch falls through.</p>`,
      ]},
      { k: "check", title: "Why LDI?", b: [
        { t: "mcq", q: "Why does the routine use LDI R1, A with A .FILL xFE00, rather than LD R1, xFE00 directly?", opts: [["LD's 9-bit PC offset can only reach about ±256 words from the code; xFE00 is far away", true, "The pointer word stores the full 16-bit address, so LDI can reach the I/O page from anywhere."], ["LD can't read device registers", false, "Any load can; it's only a question of forming the address."], ["LDI is faster", false, "It's slower: one extra memory access for the pointer."]] },
      ]},
      { k: "play", title: "Run the input routine", b: [
        (host) => sim(host, { src: INPUT, input: "", inputLabel: "keyboard: type a character here, then Step or Run", devices: true, listHeight: 220 }),
        `<p class="aside">Press <b>Run</b> with the keyboard box empty: the loop spins on KBSR. Type a letter, then Run again and watch R0 and KBSR.</p>`,
      ]},
      { k: "play", title: "Echo, with a slow display", b: [
        (host) => sim(host, { src: ECHO, input: "hi there", inputLabel: "keyboard: characters waiting to be typed", devices: true, dispDelay: 4, maxSteps: 400, listHeight: 240, loopNote: "The echo loop never ends; it's waiting for more keys. Type more, or Reset." }),
        `<p class="aside">This display takes a few instructions to draw each character, so the DSR loop spins. Watch the “not ready” counter: all that work is just waiting.</p>`,
      ]},
      { k: "play", title: "The prompt routine (Figure 9.7)", b: [
        (host) => sim(host, { src: PROMPT, input: "", inputLabel: "keyboard: type one character", devices: true, dispDelay: 2, listHeight: 260 }),
        `<p class="aside">Run it: newline, prompt, then it waits. Type a character and Run again: echo and a final newline.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "The prompt is .STRINGZ \"Input a character>\". How many memory words does it occupy?", a: 19, tol: 0.01, why: "18 characters, one per word, plus the x0000 terminator." },
        { t: "mcq", q: "In Figure 9.7, why does the routine poll DSR before writing every single character?", opts: [["The display may still be busy with the previous character", true, "A write while DSR[15] = 0 would not be displayed."], ["Reading DSR clears it", false, "Writing DDR clears it; reading doesn't."], ["To check the keyboard", false, "That's KBSR."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe the three instructions that output one character by polling.", model: "LDI loads the display status register DSR through a pointer to xFE04. BRzp branches back to that LDI while bit 15 is 0, meaning the display is still busy. When bit 15 is 1 the value is negative, the branch falls through, and STI stores the character from R0 into the display data register DDR through a pointer to xFE06." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const TRAPOUT = `        .ORIG x3000       ; user program
        LD   R0, CHAR
        TRAP x21          ; OUT: ask the OS to print R0
        ADD  R0, R0, #1
        TRAP x21
        HALT
CHAR    .FILL x0041       ; 'A'
        .END
        .ORIG x0021       ; Trap Vector Table entry x21
        .FILL x0420
        .END
        .ORIG x0420       ; OS output service routine (Fig 9.13)
        ST   R1, SaveR1   ; R1 will be used to poll the DSR
TryWrite LDI R1, DSR      ; get status
        BRzp TryWrite     ; bit 15 on says display is ready
WriteIt STI  R0, DDR      ; write character
Return  LD   R1, SaveR1   ; restore registers
        RTI               ; return from trap
DSR     .FILL xFE04
DDR     .FILL xFE06
SaveR1  .BLKW 1
        .END`;
  const EX91 = `        .ORIG x3000
        LD   R2,TERM      ; load -7
        LD   R3,ASCII     ; load ASCII difference
AGAIN   TRAP x23          ; request keyboard input
        ADD  R1,R2,R0     ; test for terminating
        BRz  EXIT         ; character
        ADD  R0,R0,R3     ; change to lowercase
        TRAP x21          ; output to the monitor
        BRnzp AGAIN       ; ... and do it again!
TERM    .FILL xFFC9       ; FFC9 is negative of ASCII 7
ASCII   .FILL x0020
EXIT    TRAP x25          ; halt
        .END`;
  const p5 = {
    id: "p5", title: "TRAP: asking the operating system", mins: 25,
    blurb: "User programs shouldn't need to know about KBSR, and mustn't touch it anyway. TRAP hands the job to the OS through a table of addresses.",
    takeaway: "Doing I/O directly means knowing the data and status registers of each device and handling asynchrony, which most programmers shouldn't need to know. Device registers are shared, so a buggy user program could wreck other programs; that's why they are in privileged address space. The solution is the system call (service call): TRAP. Elements: (1) service routines in system space, up to 256 (Table A.2); (2) the Trap Vector Table (System Control Block) at x0000–x00FF holding their starting addresses (x0020 → x03E0, x0021 → x0420 OUT, x0022 → x0460 PUTS, x0023 → x04A0 IN, x0024 → x04E0, x0025 → x0520 HALT); (3) the TRAP instruction: 1111 0000 trapvect8 (bits [11:8] must be 0); (4) a linkage back. TRAP's EXECUTE phase: push PSR and PC (already incremented) on the supervisor stack (if in user mode, first Saved USP ← R6 and R6 ← Saved SSP); PSR[15] ← 0, priority unchanged; zero-extend the trap vector to an address in the table and load the PC with that table entry. Example 9.1: a lowercase game: TRAP x23 to read, compare with −'7' (xFFC9), add x20 to lowercase, TRAP x21 to print, TRAP x25 to halt.",
    steps: [
      { k: "learn", title: "Why not do I/O yourself?", b: [
        `<ul><li>You'd need to know every device's data and status registers and its timing.</li><li>Device registers are <b>shared</b>: one buggy program could wreck I/O for everyone.</li></ul>`,
        `<p>So the I/O page is privileged, and user programs ask the operating system instead, with a <b>system call</b>: <code>TRAP</code>.</p>`,
      ]},
      { k: "learn", title: "The Trap Vector Table", b: [
        `<div class="two"><div class="tbl"><table><thead><tr><th>Address</th><th>Holds</th><th>Service</th></tr></thead><tbody>
          <tr><td>x0020</td><td>x03E0</td><td>GETC</td></tr><tr><td>x0021</td><td>x0420</td><td>OUT</td></tr><tr><td>x0022</td><td>x0460</td><td>PUTS</td></tr>
          <tr><td>x0023</td><td>x04A0</td><td>IN</td></tr><tr><td>x0024</td><td>x04E0</td><td>PUTSP</td></tr><tr><td>x0025</td><td>x0520</td><td>HALT</td></tr></tbody></table></div>
          <div><p>x0000–x00FF hold the <b>starting addresses</b> of up to 256 service routines. Other names: System Control Block.</p><p>The 8-bit trap vector is zero-extended into an address in this table.</p></div></div>`,
      ]},
      { k: "learn", title: "What TRAP does", b: [
        `<ol><li>If in user mode: Saved USP ← R6, R6 ← Saved SSP (switch to the supervisor stack).</li><li>Push the <b>PSR</b>, then the <b>PC</b> (already incremented: it points after the TRAP).</li><li>PSR[15] ← 0 (supervisor). The priority stays the same.</li><li>PC ← M[ZEXT(trapvect8)].</li></ol>`,
        `<p>Third edition: the return address goes on the supervisor stack, <b>not</b> in R7.</p>`,
        seenPP("TRAP as an opcode, with x21, x23, x25.", "05-lc3.html", "Chapter 5"),
      ]},
      { k: "play", title: "Trace a real system call", b: [
        (host) => sim(host, { src: TRAPOUT, user: true, devices: true, stack: true, dispDelay: 1, listHeight: 300 }),
        `<p class="aside">The user program runs in <b>user mode</b>. Step through the first TRAP: watch the PSR flip to supervisor, R6 switch to the supervisor stack, and two words appear at x2FFF and x2FFE. Keep stepping into the service routine and out through RTI.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "User mode, R6 = xFE00, Saved SSP = x3000. TRAP x21 executes at x3001. What is on top of the supervisor stack afterwards?", opts: [["x3002 at address x2FFE", true, "PSR is pushed first (x2FFF), then the incremented PC x3002 (x2FFE)."], ["x3001 at address x2FFF", false, "The PC was already incremented in FETCH, and the PSR goes in first."], ["The PSR at x2FFE", false, "PSR first, then PC on top."]] },
        { t: "mcq", q: "During TRAP, what happens to the priority level PSR[10:8]?", opts: [["Unchanged: the service routine has the caller's urgency", true, "Only privilege changes."], ["Set to PL7", false, "TRAP isn't more urgent than the program that asked for it."], ["Set to PL0", false, "It keeps the caller's level."]] },
      ]},
      { k: "play", title: "Example 9.1: the lowercase game", b: [
        pre(EX91),
        (host) => sim(host, { src: EX91, input: "HELLO7", inputLabel: "keyboard: capital letters, then 7 to stop", io: true, listHeight: 220 }),
        `<p class="aside">Here the OS services run as built-in shortcuts (one step each). Press Run. The book then asks: what if someone types $? Think about it, but that's an exercise, so it's yours to write.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Walk through what TRAP x23 does in user mode, ending with the first instruction of the service routine.", model: "Since the program is in user mode, R6 is saved in Saved USP and loaded from Saved SSP, switching to the supervisor stack. The PSR and then the incremented PC are pushed onto that stack. PSR[15] is cleared so the routine runs with supervisor privilege, with the priority unchanged. The vector x23 is zero-extended to x0023, and the PC is loaded with the contents of x0023, x04A0, the start of the keyboard input routine." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const PUTS = `        .ORIG x3000       ; user program
        LEA  R0, MSG
        PUTS              ; = TRAP x22
        HALT
MSG     .STRINGZ "Hi!"
        .END
        .ORIG x0022       ; Trap Vector Table entry x22
        .FILL x0460
        .END
        .ORIG x0460       ; PUTS service routine (Fig 9.16)
        ST   R0, SaveR0   ; save registers that
        ST   R1, SaveR1   ; are needed by this
        ST   R3, SaveR3   ; trap service routine
Loop    LDR  R1, R0, #0   ; retrieve the character
        BRz  Return       ; if it is 0, done
L2      LDI  R3,DSR
        BRzp L2
        STI  R1, DDR      ; write the character
        ADD  R0, R0, #1   ; increment pointer
        BRnzp Loop
Return  LD   R3, SaveR3
        LD   R1, SaveR1
        LD   R0, SaveR0
        RTI
DSR     .FILL xFE04
DDR     .FILL xFE06
SaveR0  .FILL x0000
SaveR1  .FILL x0000
SaveR3  .FILL x0000
        .END`;
  const p6 = {
    id: "p6", title: "Inside the service routines: RTI, PUTS, HALT", mins: 20,
    blurb: "A service routine saves what it uses, does the I/O by polling, and ends with RTI, which pops the PC and PSR back.",
    takeaway: "RTI (1000 0000 0000 0000) pops the PC, then the PSR, from the supervisor stack; if the restored PSR[15] says user mode, Saved SSP ← R6 and R6 ← Saved USP. Control resumes after the TRAP. Figure 9.12: the Figure 9.7 input routine made a service routine: .ORIG x04A0 (the address in x0023) and RTI instead of BR NEXT_TASK. Figure 9.13: output routine at x0420: save R1, poll DSR, STI R0 to DDR, restore, RTI. HALT (Figure 9.14, x0520): print a message using TRAP x21/x22, then clear MCR[15] (the RUN latch, MCR at xFFFE) by ANDing with x7FFF, which stops the clock (Section 4.5's RUN latch). Figure 9.15, the final keyboard routine: the repeated LDI DSR / BRzp / STI sequence becomes a subroutine WriteChar (JSR/RET inside the service routine), plus ReadChar, SaveReg, RestoreReg; the prompt characters are loaded into R2 and ADD R2,R0,#0 copies the key so R0 still holds it on return. PUTS (TRAP x22, Figure 9.16, x0460): R0 = address of a null-terminated string; loop LDR, BRz done, poll DSR, STI, increment.",
    steps: [
      { k: "learn", title: "RTI", b: [
        `<p><code>RTI</code> = 1000 0000 0000 0000. It pops <b>PC</b>, then <b>PSR</b>, from the supervisor stack.</p>`,
        `<p>If the restored PSR says user mode, the stacks swap back: Saved SSP ← R6, R6 ← Saved USP.</p>`,
        `<p>To turn the Figure 9.7 routine into the real IN service routine (Figure 9.12), the book makes two changes: <code>.ORIG x04A0</code> and <code>RTI</code> at the end.</p>`,
      ]},
      { k: "play", title: "PUTS, for real", b: [
        (host) => sim(host, { src: PUTS, user: true, devices: true, stack: true, listHeight: 300 }),
        `<p class="aside">R0 carries the string's address into the routine. Watch R0 count through the string, then RTI put it back (the routine saved and restores it).</p>`,
      ]},
      { k: "learn", title: "HALT stops the clock", b: [
        `<p>Remember the RUN latch ANDed with the clock (Chapter 4)? On the LC-3 it is <b>MCR[15]</b>, the Master Control Register at xFFFE. The HALT routine (x0520) prints “Halting the machine.” and then:</p>`,
        pre(`LDI R1, MCR    ; R1 <- MCR
LD  R0, MASK   ; R0 <- x7FFF
AND R0, R1, R0 ; clear bit 15, keep the rest
STI R0, MCR    ; the clock stops`),
        `<p class="aside">The book asks some sharp questions about this routine (what restarts the clock? where does it return?). They're exercises: try them on paper.</p>`,
      ]},
      { k: "learn", title: "Subroutines inside a service routine", b: [
        `<p>Figure 9.12 has the same three lines four times: <code>LDI R3,DSR / BRzp / STI ...,DDR</code>. Figure 9.15 makes them one subroutine, <code>WriteChar</code>, called with JSR and ended with RET. The catch: the original wrote R0 sometimes and R2 other times, so the book routes every character through R2 (and copies the key with <code>ADD R2,R0,#0</code> so R0 still holds it for the user).</p>`,
      ]},
      { k: "check", title: "Think it through", b: [
        { t: "mcq", q: "Figure 9.15 saves R1–R6 but uses JSR several times. In the third edition, TRAP doesn't use R7. What happens to the user program's R7?", opts: [["It is overwritten: every JSR in the routine writes R7", true, "SaveReg/RestoreReg don't include R7, so when the user program resumes, R7 holds a return address inside the service routine. A careful caller shouldn't rely on R7 across a TRAP."], ["Nothing: TRAP saved it on the stack", false, "TRAP pushes the PC and PSR, not R7."], ["RTI restores it", false, "RTI pops only the PC and PSR."]] },
        { t: "num", q: "The HALT routine ANDs the MCR with x7FFF. If MCR = xC123, what value is stored back? (Give it in decimal.)", a: 0x4123, tol: 0.01, why: "xC123 AND x7FFF = x4123 = 16675. Only bit 15 is cleared." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does control get back to the user program after a service routine, and in what mode does it continue?", model: "The service routine ends with RTI. RTI pops the saved PC, which points to the instruction after the TRAP, and then the saved PSR from the supervisor stack. Because the restored PSR says user mode, R6 is saved back into Saved SSP and reloaded from Saved USP, so the user program continues in user mode on its own stack, with its condition codes restored." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  function intSignal(host) {
    const devs = [["Keyboard", 4, 1, 1], ["Timer", 5, 0, 1], ["Power failure", 6, 0, 1]];
    let pl = 0;
    const out = el(`<div></div>`), box = el(`<div class="tbl"></div>`);
    const draw = () => {
      box.innerHTML = `<table><thead><tr><th>Device</th><th>PL</th><th>Ready [15]</th><th>IE [14]</th><th>Request</th></tr></thead><tbody>${devs.map(([n, p, r, e], i) => `<tr><td>${n}</td><td>PL${p}</td><td><button type="button" class="btn" data-i="${i}" data-f="2">${r}</button></td><td><button type="button" class="btn" data-i="${i}" data-f="3">${e}</button></td><td>${r && e ? "<b>yes</b>" : "no"}</td></tr>`).join("")}</tbody></table>`;
      const req = devs.filter((d) => d[2] && d[3]), top = req.reduce((a, d) => (!a || d[1] > a[1] ? d : a), null);
      const INT = top && top[1] > pl;
      out.innerHTML = `<p>Priority encoder output: ${top ? `<b>${top[0]}</b>, PL${top[1]}` : "no request"}. Running program: PL${pl}.</p><p>${INT ? `<span class="verdict ok">INT asserted</span> at the end of the current instruction, the ${top[0].toLowerCase()} gets the processor.` : `<span class="verdict no">INT not asserted</span> ${top ? `PL${top[1]} is not higher than PL${pl}.` : "No device both wants service and is allowed to ask."}`}</p>`;
    };
    box.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (!b) return; const d = devs[+b.dataset.i], f = +b.dataset.f; d[f] = d[f] ? 0 : 1; draw(); });
    const s = slider({ id: "pp9run", label: "Priority of the running program", min: 0, max: 7, step: 1, value: 0, show: (v) => "PL" + v }, (v) => { pl = Math.round(v); draw(); });
    host.append(box, s.el, out); draw();
  }
  function pollVsInt(host) {
    let n = 40, tc = 0.25, tp = 8, seqs = 200;
    const out = el(`<div></div>`);
    const fmtT = (s) => (s >= 3600 ? (s / 3600).toFixed(2) + " h" : s >= 60 ? (s / 60).toFixed(1) + " min" : s.toFixed(1) + " s");
    const draw = () => {
      const type = n * tc, poll = seqs * (type + tp), intr = seqs * Math.max(type, tp) + Math.min(type, tp);
      out.innerHTML = `<div class="two"><div class="tile"><h3>Polling</h3><p>Each batch: type ${fmtT(type)}, <i>then</i> process ${fmtT(tp)}.</p><p class="eq">${fmtT(poll)}</p></div><div class="tile"><h3>Interrupt-driven</h3><p>Typing the next batch overlaps processing the last one (reading each key costs microseconds).</p><p class="eq">≈ ${fmtT(intr)}</p></div></div><p class="aside">Saved: ${fmtT(poll - intr)}. The processor is only borrowed when a key actually arrives.</p>`;
    };
    host.append(
      slider({ id: "pp9n", label: "Characters per batch", min: 10, max: 200, step: 10, value: n, show: (v) => v }, (v) => { n = v; draw(); }).el,
      slider({ id: "pp9tc", label: "Seconds between keystrokes", min: 0.05, max: 1, step: 0.05, value: tc, show: (v) => v.toFixed(2) + " s" }, (v) => { tc = v; draw(); }).el,
      slider({ id: "pp9tp", label: "Processing time per batch", min: 1, max: 30, step: 1, value: tp, show: (v) => v + " s" }, (v) => { tp = v; draw(); }).el,
      slider({ id: "pp9sq", label: "Number of batches", min: 10, max: 1000, step: 10, value: seqs, show: (v) => v }, (v) => { seqs = v; draw(); }).el,
      out);
    draw();
  }
  const p7 = {
    id: "p7", title: "Interrupts, part I: causing one", mins: 20,
    blurb: "Stop spinning on ready bits. The device interrupts when it needs service, if it is allowed to and if it is urgent enough.",
    takeaway: "Interrupt-driven I/O: a device forces the running program to stop, the processor runs a program that services the device, then the stopped program resumes as if nothing happened (Figure 9.17). Why: polling wastes time re-executing LDI/BR; Example 9.2 (100 characters per sequence at 0.125 s each, 12.49999 s processing, 1000 sequences): polling ≈ 25 s per sequence (about 7 hours), interrupts ≈ 12.5 s (about 3.5 hours) since typing overlaps processing. Three conditions to interrupt: the device wants service (its ready bit), has the right to ask (interrupt enable IE = bit [14] of KBSR/DSR, set or cleared by the processor, usually the OS), and is more urgent than the running program. Interrupt request = ready AND IE. A priority encoder picks the highest-priority request; INT is asserted if its PL is higher than the running program's PL (Figure 9.19). INT is tested only at instruction boundaries: the last state of each instruction cycle checks INT and goes to the interrupt sequence instead of FETCH, so no instruction is ever half-done.",
    steps: [
      { k: "learn", title: "The idea", b: [
        `<div class="tbl"><table><tbody>
          <tr><td>Program A runs instructions n, n+1, n+2</td></tr>
          <tr><td style="background:var(--accent-soft)">1. Interrupt detected → A is suspended → PC ← start of program B</td></tr>
          <tr><td style="background:var(--accent-soft)">2. B services the device</td></tr>
          <tr><td style="background:var(--accent-soft)">3. A is brought back to life</td></tr>
          <tr><td>A continues with n+3, n+4… as if nothing happened</td></tr></tbody></table></div>`,
        `<p>No more spinning on LDI/BRzp: the processor does useful work until a device actually needs it.</p>`,
      ]},
      { k: "play", title: "How much time does it save?", b: [
        pollVsInt,
        `<p class="aside">These numbers are mine; the book's Example 9.2 uses 100 characters at 0.125 s and 12.49999 s of processing. Try making processing longer than typing: which one sets the pace now?</p>`,
      ]},
      { k: "learn", title: "Three conditions", b: [
        `<ol><li>The device <b>wants</b> service: its ready bit [15] is 1.</li><li>It <b>may</b> ask: its interrupt enable bit [14] is 1 (set by the OS).</li><li>It is <b>more urgent</b> than the running program: higher PL.</li></ol>`,
        `<p>Interrupt request = ready AND IE. A <b>priority encoder</b> picks the highest request; INT goes high only if that PL beats the running program's PL.</p>`,
      ]},
      { k: "play", title: "Make INT go high", b: [
        intSignal,
        `<p class="aside">Click the 0/1 buttons. Try raising the running program's priority above the keyboard's.</p>`,
      ]},
      { k: "learn", title: "Only between instructions", b: [
        `<p>INT can rise at any moment, even in the middle of FETCH OPERANDS. The processor only <b>tests</b> it in the last state of each instruction. So an instruction always finishes completely, and nothing half-done needs to be remembered.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "The keyboard (PL4) has KBSR = x8000 while a PL0 program runs. Interrupt?", opts: [["No: IE (bit 14) is 0, so the keyboard may not ask", true, "x8000 = ready only. The program must poll."], ["Yes: it's ready and higher priority", false, "Check bit 14."], ["Yes, but only after the program halts", false, "Without IE, never."]] },
        { t: "mcq", q: "Ready and IE are both 1 for the keyboard (PL4), but the running program is at PL6. What happens?", opts: [["The request waits until the processor's priority drops below PL5", true, "PL4 must beat the running PL."], ["The keyboard interrupts anyway", false, "It isn't urgent enough."], ["The key is lost", false, "KBSR[15] stays set; the key waits in KBDR."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "List the three things that must be true for the keyboard to interrupt the processor, and say which hardware checks each.", model: "The keyboard must want service, shown by its ready bit KBSR[15]. It must have the right to ask, shown by its interrupt enable bit KBSR[14], which the OS sets; an AND of these two bits forms its interrupt request. And its priority, PL4, must be higher than the running program's: a priority encoder picks the highest request and a comparator asserts INT only if that level beats the PSR's priority. INT is then acted on at the end of the current instruction." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const INTPROG = `        .ORIG x3000       ; main program (PL0, supervisor here)
        LD   R0, IE
        STI  R0, KBSRA    ; KBSR[14] <- 1: keyboard may interrupt
        AND  R2, R2, #0
LOOP    ADD  R2, R2, #1   ; busy with "useful work"
        BRnzp LOOP
IE      .FILL x4000
KBSRA   .FILL xFE00
        .END
        .ORIG x0180       ; Interrupt Vector Table entry x80
        .FILL x1000
        .END
        .ORIG x1000       ; keyboard interrupt service routine
        ST   R0, SV0
        ST   R1, SV1
        LDI  R0, KBDRA    ; read the key (clears KBSR[15])
POLL    LDI  R1, DSRA
        BRzp POLL
        STI  R0, DDRA     ; echo it
        LD   R1, COUNT
        ADD  R1, R1, #1
        ST   R1, COUNT    ; count keys served
        LD   R1, SV1
        LD   R0, SV0
        RTI
KBDRA   .FILL xFE02
DSRA    .FILL xFE04
DDRA    .FILL xFE06
SV0     .BLKW 1
SV1     .BLKW 1
COUNT   .FILL 0
        .END`;
  function nested(host) {
    const snaps = [
      { pc: "x3006", st: [], sp: -1, dead: [], cap: "(a) Program A is about to fetch x3006 (an ADD). The supervisor stack is empty; Saved SSP marks its top. R6 is on the user stack." },
      { pc: "x6200", st: ["PSR of program A", "x3007"], sp: 1, dead: [], cap: "(b) Device B interrupted after the ADD finished. R6 ← Saved SSP, push A's PSR (with the ADD's condition codes), push x3007. INTV xF1 → x01F1 → PC ← x6200." },
      { pc: "x6300", st: ["PSR of program A", "x3007", "PSR for device B", "x6203"], sp: 3, dead: [], cap: "(c) More urgent device C interrupted B after the AND at x6202. Push B's PSR and x6203. INTV xF2 → x01F2 → PC ← x6300." },
      { pc: "x6203", st: ["PSR of program A", "x3007", "PSR for device B", "x6203"], sp: 1, dead: [2, 3], cap: "(d) C's routine ends with RTI at x6315: pop PC (x6203) and PSR (B's, with the AND's condition codes). B resumes. The popped words are still in memory, just above the top." },
      { pc: "x3007", st: ["PSR of program A", "x3007", "PSR for device B", "x6203"], sp: -1, dead: [0, 1, 2, 3], cap: "(e) B's RTI at x6210 pops x3007 and A's PSR. A was in user mode, so Saved SSP ← R6 and R6 ← Saved USP. A continues at x3007." },
    ];
    let i = 0;
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`), bP = btn("← Previous"), bN = btn("Next →", "primary");
    const draw = () => {
      const s = snaps[i], W = 360, H = 220;
      let g = "";
      for (let k = 0; k < 4; k++) {
        const y = H - 30 - k * 40, txt = s.st[k] || "";
        g += `<rect x="60" y="${y - 30}" width="170" height="38" style="fill:${txt ? (s.dead.includes(k) ? "var(--paper)" : "var(--accent-soft)") : "var(--card)"};stroke:var(--ink)"/>` + (txt ? S.t(145, y - 6, txt, { cls: s.dead.includes(k) ? "s m" : "s" }) : "");
        if (k === s.sp) g += `<line x1="236" y1="${y - 11}" x2="270" y2="${y - 11}" style="stroke:var(--bad);stroke-width:2"/>` + S.t(276, y - 6, "R6", { a: "start" });
      }
      if (s.sp < 0) g += `<line x1="236" y1="${H - 30 + 8}" x2="270" y2="${H - 30 + 8}" style="stroke:var(--ink)"/>` + S.t(276, H - 30 + 13, "Saved SSP", { a: "start", cls: "s" });
      g += S.t(145, 20, "Supervisor stack (grows up the page)", { cls: "s" });
      out.innerHTML = `<div class="fig">${S.svg(W, H, g, { max: W, label: "Supervisor stack snapshot" })}</div><p class="eq">PC = ${s.pc}</p><p>${s.cap}</p>`;
      bP.disabled = i === 0; bN.disabled = i === snaps.length - 1;
    };
    bP.addEventListener("click", () => { i--; draw(); }); bN.addEventListener("click", () => { i++; draw(); });
    row.append(bP, bN); host.append(row, out); draw();
  }
  const p8 = {
    id: "p8", title: "Interrupts, part II: handling one", mins: 25,
    blurb: "Save just the PC and PSR, jump through the Interrupt Vector Table, service, RTI. Nested interrupts simply stack up.",
    takeaway: "Handling an interrupt has three stages. (1) Initiate: save the interrupted program's state: the LC-3 saves only PC and PSR (the PSR holds privilege, priority and condition codes, all needed to resume correctly); service routines must save any general-purpose registers they use. Same mechanism as TRAP: if in user mode, Saved USP ← R6, R6 ← Saved SSP; push PSR, push PC. Then load the routine's state: vectored interrupts: the device supplies an 8-bit interrupt vector INTV with its request; the processor expands it to an address in the Interrupt Vector Table x0100–x01FF and loads the PC from there (e.g. keyboard INTV x80 → x0180). PSR ← supervisor (PSR[15] = 0), PL = the request's priority, CC arbitrarily 010. (2) Service: run the interrupt service routine. (3) Return: RTI pops PC and PSR (condition codes come back for a later BR); if the program was in user mode, Saved SSP ← R6 and R6 ← Saved USP. Example 9.4.6/Figures 9.20–9.21: A (x3000–x3010) is interrupted after x3006 by B (INTV xF1, routine x6200–x6210); B is interrupted after x6202 by more urgent C (INTV xF2, routine x6300–x6315); the stack holds A's PSR, x3007, B's PSR, x6203; RTIs unwind in reverse. Not only I/O: timer, machine check and power failure interrupts work the same way.",
    steps: [
      { k: "learn", title: "Initiate: save, then load", b: [
        `<ol><li><b>Save</b> A's state: PC and PSR (privilege, priority, condition codes). If A was in user mode, switch R6 to the supervisor stack first. Push PSR, push PC.</li><li><b>Load</b> the service routine's state: the device sends an 8-bit <b>interrupt vector</b> INTV. The <b>Interrupt Vector Table</b> at x0100–x01FF holds the routines' starting addresses: PC ← M[x0100 + INTV]. PSR ← supervisor, the request's PL, CC = 010.</li></ol>`,
        `<p>General-purpose registers are <b>not</b> saved by hardware. The service routine saves whatever it uses.</p>`,
        `<p>The return is the same RTI as for TRAP.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "The LC-3 keyboard's interrupt vector is x80. Where does the processor find the service routine's starting address?", opts: [["In memory location x0180", true, "Interrupt Vector Table = x0100–x01FF; x0100 + x80 = x0180."], ["In x0080", false, "That's the Trap Vector Table region."], ["At x8000", false, "The vector indexes a table; it isn't an address itself."]] },
      ]},
      { k: "play", title: "Interrupt a busy loop", b: [
        (host) => sim(host, { src: INTPROG, init: (m) => { m.R[6] = 0x3000; }, devices: true, stack: true, input: "", inputLabel: "keyboard: type a key while the loop runs", dispDelay: 1, maxSteps: 60, watch: [["COUNT", "COUNT"]], listHeight: 280, loopNote: "The main loop runs forever by design. Type a key, then Run: the keyboard will interrupt it." }),
        `<p class="aside">Run a few times with no key: R2 keeps counting. Type a key and Run: it stops at the interrupt. Step through the routine and its RTI. Did R2 and the condition codes pick up exactly where they left off?</p>`,
        `<p class="aside">The OS has enabled the keyboard interrupt (only supervisor code can write KBSR), so this whole demo runs in supervisor mode at PL0.</p>`,
      ]},
      { k: "play", title: "Nested interrupts (Figures 9.20–9.21)", b: [
        nested,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "In snapshot (c), C's routine is running. Which RTI happens first?", opts: [["C's, at x6315, returning to x6203", true, "Last in, first out: the most recent interruption unwinds first."], ["B's, at x6210", false, "B was interrupted; it can't finish until C returns."], ["Both at once", false, "Each RTI pops exactly one PC and PSR."]] },
      ]},
      { k: "learn", title: "Not just I/O", b: [
        `<p>Any urgent outside event can interrupt the same way, supplying its INT request, vector and priority: a <b>timer</b> marking time, a <b>machine check</b> when hardware misbehaves, <b>power failure</b> when the cord is yanked.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must the condition codes be saved when a program is interrupted, and where are they saved?", model: "The interrupted program may be about to execute a conditional branch that depends on the condition codes set by the instruction just before the interrupt. The service routine will change them, so they must be restored before the program resumes. They live in PSR[2:0], and the PSR is pushed onto the supervisor stack when the interrupt is initiated and popped by RTI." },
      ]},
    ],
  };

  /* =============== PART 9 =============== */
  function raceDemo(host) {
    let guard = 0;
    const out = el(`<div></div>`);
    const draw = () => {
      const steps = guard
        ? [["STI R2, PSR", "interrupts off"], ["LDI R3, DSR", "ready = 1"], ["BRzp POLL", "falls through"], ["(key pressed: INT must wait)", ""], ["STI R0, DDR", "display shows the loop's character ✓"], ["STI R1, PSR", "interrupts back on"], ["keyboard routine runs", "polls DSR properly, echoes later ✓"]]
        : [["LDI R3, DSR", "ready = 1"], ["BRzp POLL", "falls through"], ["key pressed → interrupt", "keyboard routine echoes a key; DSR[15] ← 0"], ["RTI", "back in the loop"], ["STI R0, DDR", "display still busy: this character is lost ✗"]];
      out.innerHTML = `<div class="tbl"><table><tbody>${steps.map(([a, b]) => `<tr><td><code>${a}</code></td><td>${b}</td></tr>`).join("")}</tbody></table></div><p>${guard ? '<span class="verdict ok">10 of 10 characters printed</span> Interrupts were off for only three instructions at a time.' : '<span class="verdict no">9 of 10 characters printed</span> The loop “knew” the display was ready, but that knowledge went stale during the interrupt.'}</p>`;
    };
    host.append(toggle(["Interrupts allowed anywhere", "Interrupts off for LDI/BRzp/STI"], (i) => { guard = i; draw(); }, 0), out); draw();
  }
  const p9 = {
    id: "p9", title: "Polling revisited: when interrupts break it", mins: 15,
    blurb: "LDI/BRzp/STI must act as one unit. An interrupt in the middle makes the ready check stale.",
    takeaway: "With interrupts enabled, the polling sequence LDI (read DSR), BRzp, STI (write DDR) is not atomic. If an interrupt occurs after the check but before the STI, and its service routine writes DDR (e.g. a keyboard echo), the display becomes busy; the STI then writes while DSR[15] = 0 and the write doesn't happen (10 characters → only 9 printed). Disabling interrupts for the whole polling loop would delay urgent interrupts too long. Figure 9.22: disable interrupts only around the three-instruction sequence. PSR[14] is the interrupt enable for this program's interrupts; the PSR is memory-mapped at xFFFC. R1 ← PSR (original), R2 ← PSR AND xBFFF (interrupts off). POLL: STI R1,PSR (enable); STI R2,PSR (disable); LDI R3,DSR; BRzp POLL; STI R0,DDR; then STI R1,PSR restores. Registers saved and restored on the stack with R6.",
    steps: [
      { k: "learn", title: "The problem", b: [
        `<p>A loop prints a character 10 times by polling. Keyboard interrupts are on, and the keyboard routine echoes each key to the display.</p>`,
        `<p>The loop checks DSR (ready!), and <i>before</i> its STI, a key interrupts. The echo makes the display busy. Back in the loop, the STI writes anyway… and the write doesn't happen.</p>`,
      ]},
      { k: "play", title: "See both versions", b: [
        raceDemo,
      ]},
      { k: "learn", title: "The fix (Figure 9.22)", b: [
        pre(`        LDI R1, PSR      ; R1 = original PSR
        LD  R2, INTMASK  ; xBFFF
        AND R2, R1, R2   ; R2 = PSR with bit 14 cleared
POLL    STI R1, PSR      ; enable interrupts (if they were)
        STI R2, PSR      ; disable interrupts
        LDI R3, DSR
        BRzp POLL        ; not ready: re-enable and retry
        STI R0, DDR
        STI R1, PSR      ; restore original PSR`),
        `<p>PSR[14] enables this program's interrupts; the PSR is memory-mapped at <b>xFFFC</b>. Interrupts are off for three instructions at a time, never for the whole wait.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why not just disable interrupts for the entire polling loop?", opts: [["The wait could be long, and urgent interrupts would be delayed the whole time", true, "Figure 9.22 limits the blackout to three instructions."], ["Disabling interrupts is a privileged instruction", false, "It's a store to the PSR; the routine runs in supervisor mode anyway."], ["Polling needs interrupts to work", false, "Polling works fine without them."]] },
        { t: "mcq", q: "In Figure 9.22, if the display isn't ready, BRzp goes back to POLL. What's the first thing POLL does?", opts: [["Re-enables interrupts, giving any waiting interrupt a chance", true, "STI R1, PSR. Then it disables them again for the next check."], ["Reads DSR", false, "That's two instructions later."], ["Writes DDR", false, "Only after a successful check."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain how a character gets lost when polling and interrupts mix, and how Figure 9.22 prevents it.", model: "The loop reads DSR and sees ready, then an interrupt occurs before its STI. The service routine writes its own character to DDR, so the display becomes busy. When the loop resumes, it stores to DDR believing the display is ready, and that write is lost. Figure 9.22 clears PSR[14] just before the LDI, BRzp, STI sequence, so no interrupt can slip in between the check and the write, and enables interrupts again on every retry and at the end, so interrupts are delayed by at most three instructions." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp9", eyebrow: "Patt & Patel · Chapter 9", title: "I/O",
    intro: `<p>Nine parts: privilege and priority, the memory map and memory-mapped I/O, ready bits, polling, TRAP and the service routines, interrupts (causing and handling them), and why polling and interrupts must be careful together.</p><p>The simulator now has a real keyboard and display: KBSR, KBDR, DSR and DDR at xFE00–xFE06, the supervisor stack, TRAP through the vector table, RTI and keyboard interrupts. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. For TRAP and interrupt questions, draw the supervisor stack, R6, Saved SSP/USP and the PC after every step, like Figure 9.21.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8, p9],
    summary: `
      <h3>Privilege and priority</h3>
      <p>PSR[15] = 0 supervisor / 1 user; PSR[10:8] = PL0–PL7; PSR[2:0] = NZP. Orthogonal ideas. Memory: x0000–x2FFF system, x3000–xFDFF user, xFE00–xFFFF I/O page. Two stacks; R6 + Saved SSP/USP.</p>
      <h3>Memory-mapped I/O</h3>
      <p>KBSR xFE00, KBDR xFE02, DSR xFE04, DDR xFE06, PSR xFFFC, MCR xFFFE. Ready bit [15] synchronises asynchronous devices. Polling: LDI status / BRzp / LDI or STI data.</p>
      <h3>TRAP</h3>
      <p>Trap Vector Table x0000–x00FF. TRAP: (switch stack) push PSR, PC; supervisor; PC ← M[vector]. RTI pops PC, PSR (switch back). PUTS x22, HALT clears MCR[15].</p>
      <h3>Interrupts</h3>
      <p>Request = ready AND IE [14]; priority encoder; INT if PL higher; tested between instructions. Push PSR, PC; PC ← M[x0100 + INTV]; RTI. Polling with interrupts on: disable around LDI/BRzp/STI (PSR[14]).</p>`,
  };
  Course.start(window.CHAPTER);
})();
