(function () {
  const { toggle, readout, el } = Course;
  const { sim, assemble, h4, bin } = LC3;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const seenHH = (html, href, where) => `<div class="key"><b>Also in Harris & Harris:</b> ${html} <a href="../hh/${href}">${where} →</a></div>`;
  const pre = (t) => `<pre class="code">${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`;

  const MUL6 = `;
; Program to multiply an integer by the constant 6.
; Before execution, an integer must be stored in NUMBER.
;
        .ORIG x3050
        LD   R1,SIX
        LD   R2,NUMBER
        AND  R3,R3,#0     ; Clear R3. It will
                          ; contain the product.
; The inner loop
;
AGAIN   ADD  R3,R3,R2
        ADD  R1,R1,#-1    ; R1 keeps track of
        BRp  AGAIN        ; the iterations
;
        HALT
;
NUMBER  .BLKW 1
SIX     .FILL x0006
;
        .END`;
  const COUNT = `        .ORIG x3000
        AND  R2,R2,#0     ; R2 is counter, initialize to 0
        LD   R3,PTR       ; R3 is pointer to characters
        TRAP x23          ; R0 gets character input
        LDR  R1,R3,#0     ; R1 gets the next character
;
; Test character for end of file
;
TEST    ADD  R4,R1,#-4    ; Test for EOT
        BRz  OUTPUT       ; If done, prepare the output
;
; Test character for match. If a match, increment count.
;
        NOT  R1,R1
        ADD  R1,R1,#1     ; R1 <-- -R1
        ADD  R1,R1,R0     ; R1 <-- R0-R1. If R1=0, a match!
        BRnp GETCHAR      ; If no match, do not increment
        ADD  R2,R2,#1
;
; Get next character from the file
;
GETCHAR ADD  R3,R3,#1     ; Increment the pointer
        LDR  R1,R3,#0     ; R1 gets the next character to test
        BRnzp TEST
;
; Output the count.
;
OUTPUT  LD   R0,ASCII     ; Load the ASCII template
        ADD  R0,R0,R2     ; Convert binary to ASCII
        TRAP x21          ; ASCII code in R0 is displayed
        TRAP x25          ; Halt machine
;
; Storage for pointer and ASCII template
;
ASCII   .FILL x0030
PTR     .FILL x4000
        .END`;

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Moving up a level", mins: 15,
    blurb: "Assembly language: mnemonics and symbolic addresses, still one line per machine instruction.",
    takeaway: "A program is in machine language if every instruction is from the computer's ISA. Mechanical languages are high-level (C, C++, Java, Python…: English-like, ISA-independent; each statement becomes several machine instructions) or low-level. Assembly language is a low-level language one small step above the ISA: usually one assembly instruction per ISA instruction, and very ISA-dependent (normally one assembly language per ISA). It keeps the programmer's detailed control while replacing bit patterns with mnemonics (ADD for 0001) and memory addresses with meaningful symbolic addresses (SUM, PRODUCT). Higher-level languages (Chapter 11 onwards) give up some control for convenience.",
    steps: [
      { k: "learn", title: "Why not just write bits?", b: [
        `<p>Writing 0001 for ADD and keeping track of which address holds what is miserable. <b>Assembly language</b> fixes that while keeping you in full control:</p>`,
        `<ul><li><b>Mnemonics</b> instead of opcodes: ADD, NOT, LDR.</li><li><b>Symbolic addresses</b> (labels) instead of 16-bit numbers: SUM, PRODUCT, LOOP.</li></ul>`,
        `<div class="two"><div class="tile"><h3>Low-level (assembly)</h3><p>One line ≈ one machine instruction. Tied to one ISA. Full control.</p></div><div class="tile"><h3>High-level (C, Python…)</h3><p>One statement → many instructions. Mostly ISA-independent. Less control, much less effort.</p></div></div>`,
        seenPP("The levels of transformation.", "01-welcome-aboard.html", "Chapter 1"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "You learn LC-3 assembly. Can you now write x86 assembly?", opts: [["Not directly: each ISA has its own assembly language, though the ideas carry over", true, "Low-level languages are ISA-dependent."], ["Yes, assembly is universal", false, "That's the big difference from C."], ["Only for programs without branches", false, ""]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does assembly language give you that machine language doesn't, and what does it keep?", model: "It gives readable mnemonics for opcodes and symbolic names for memory locations, plus comments and directives to help the translation. It keeps the one-to-one correspondence with machine instructions, so the programmer still controls exactly which instructions the computer executes." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Anatomy of an assembly line", mins: 25,
    blurb: "Label, opcode, operands, comment. Number bases. What makes a legal label, and a useful comment.",
    takeaway: "An instruction line: Label Opcode Operands ; Comment. Opcode and operands are required (number of operands depends on the operation: ADD needs three); label and comment are optional. Registers are written R0–R7. Literals need a base prefix: # decimal, x hex, b binary (x1000 = 4096, b1000 = 8, #1000 = 1000). Labels: 1–20 alphanumeric characters starting with a letter; reserved words (ADD, NOT, x1000, R4…) can't be labels (NOW, Under21, R2D2, R785, C3PO are fine). Label a location only if the program refers to it: as a branch target (AGAIN) or as data loaded or stored (NUMBER, SIX). Comments start with ';' (whole line if first). Good comments add insight, not restating the obvious ('Decrement R1' is clutter); blank comment lines and aligned columns make structure visible.",
    steps: [
      { k: "learn", title: "Four fields", b: [
        `<div class="eq">Label   Opcode   Operands   ; Comment</div>`,
        pre(`AGAIN   ADD  R3,R3,R2
        AND  R3,R3,#0     ; Clear R3. It will contain the product.
        LD   R2,NUMBER`),
        `<ul><li><b>Opcode, operands</b>: required. Registers are R0–R7.</li><li><b>Label</b>: optional; names this location.</li><li><b>Comment</b>: optional; everything after ‘;’.</li></ul>`,
      ]},
      { k: "learn", title: "Literals", b: [
        `<p>Every number needs its base: <b>#</b> decimal, <b>x</b> hex, <b>b</b> binary.</p>`,
        `<div class="tbl"><table><tbody><tr><td><code>#1000</code></td><td>1000</td></tr><tr><td><code>x1000</code></td><td>4096</td></tr><tr><td><code>b1000</code></td><td>8</td></tr></tbody></table></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Legal LC-3 label?", bins: ["Legal", "Not legal"], items: [
          ["LOOP", 0, ""], ["R2D2", 0, "Starts with a letter; isn't a register name."], ["2FAST", 1, "Must start with a letter."], ["ADD", 1, "Reserved: an opcode."], ["R5", 1, "Reserved: a register."], ["x100", 1, "Reads as a hex number."], ["Under21", 0, ""],
        ]},
      ]},
      { k: "learn", title: "When to label, how to comment", b: [
        `<p>Give a location a label only if the program <b>refers</b> to it: a branch target, or data that's loaded or stored.</p>`,
        `<p>Good comments explain <i>why</i>, for a reader two years from now (maybe someone else). “Decrement R1” next to <code>ADD R1,R1,#-1</code> is clutter; “R1 counts remaining iterations” helps. Use blank comment lines and aligned columns to show structure.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why can't ADD or R4 be used as labels?", model: "They're reserved words with fixed meanings in the language: ADD is an opcode and R4 is a register. If they could also be labels, the assembler couldn't tell which meaning was intended, and programs can't tolerate that ambiguity." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const SNIPS = [
    [".ORIG and .FILL", `        .ORIG x3050
SIX     .FILL x0006
PTR     .FILL SIX       ; a label as the value: its address`],
    [".BLKW", `        .ORIG x3000
TABLE   .BLKW 4         ; four words, filled in later
NEXT    .FILL #-1`],
    [".STRINGZ", `        .ORIG x3010
HELLO   .STRINGZ "Hello, World!"`],
  ];
  const p3 = {
    id: "p3", title: "Pseudo-ops", mins: 20,
    blurb: ".ORIG, .FILL, .BLKW, .STRINGZ, .END: messages to the assembler, not instructions.",
    takeaway: "Pseudo-ops (assembler directives; pseudo = false) are messages to the assembler; they don't execute. .ORIG address: where to put the program (x3050 → first instruction there, the rest in sequence). .FILL value: one word initialized to a number or a label's address. .BLKW n: reserve n words (useful for values computed or input later). .STRINGZ \"…\": n characters' zero-extended ASCII codes plus a terminating x0000 (a sentinel): \"Hello, World!\" at x3010 occupies x3010–x301D. .END: the end of the source text; it doesn't stop execution (it doesn't exist at run time) — HALT does.",
    steps: [
      { k: "learn", title: "Five directives", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><code>.ORIG x3050</code></td><td>put the program starting at x3050</td></tr>
          <tr><td><code>.FILL value</code></td><td>one word, initialized (a number or a label's address)</td></tr>
          <tr><td><code>.BLKW n</code></td><td>reserve n words (filled in later)</td></tr>
          <tr><td><code>.STRINGZ "text"</code></td><td>one word per character, then x0000</td></tr>
          <tr><td><code>.END</code></td><td>end of the source text</td></tr></tbody></table></div>`,
        `<p>They're “pseudo” (false) operations: messages to the assembler, gone once it's done. <b>.END doesn't stop the program</b>; it marks where the text ends. HALT stops the program.</p>`,
      ]},
      { k: "play", title: "What lands in memory", b: [
        (host) => {
          const out = el(`<div></div>`);
          let k = 0;
          function draw() {
            const img = assemble(SNIPS[k][1]);
            out.innerHTML = pre(SNIPS[k][1]) + `<div class="tbl" style="max-height:300px;overflow:auto"><table><thead><tr><th>Address</th><th>Contents</th><th>Meaning</th></tr></thead><tbody>${img.words.map((w, i) => `<tr><td class="mono">${h4(img.origin + i)}</td><td class="mono">${h4(w)}</td><td>${w >= 32 && w < 127 ? `'${String.fromCharCode(w)}'` : w === 0 ? "0" : String(w)}</td></tr>`).join("")}</tbody></table></div>`;
          }
          host.append(toggle(SNIPS.map((s) => s[0]), (i) => { k = i; draw(); }), out);
          draw();
        },
        `<p class="aside">“Hello, World!” is 13 characters, so it takes 14 words: the final x0000 marks the end, ready to be used as a sentinel.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: ".ORIG x4000, then MSG .STRINGZ \"LC-3\". What address holds the terminating x0000?", a: 16388, tol: 0.0001, hint: "4 characters at x4000–x4003.", why: "x4004 = 16388." },
        { t: "mcq", q: "A program's last lines are HALT then .END. If you delete HALT, what happens when it runs?", opts: [["The processor keeps fetching whatever words follow (data!) as instructions", true, ".END doesn't exist at run time."], ["It stops at .END", false, ".END only tells the assembler where the text ends."], ["The assembler refuses", false, "It's legal, just wrong."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the difference between .BLKW 1 and .FILL #0?", model: "Both reserve one word of memory. .FILL #0 deliberately initializes it to zero, a value the program relies on. .BLKW 1 just sets aside the word for a value that will be filled in later, for example by another module or by input, so its initial contents shouldn't be relied on." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Two complete programs", mins: 25,
    blurb: "Multiply by 6, and the character counter, now written in assembly.",
    takeaway: "Figure 7.1 multiplies NUMBER by 6 by repeated addition: LD R1, SIX (loop count), LD R2, NUMBER, clear R3, then AGAIN: ADD R3, R3, R2; ADD R1, R1, #−1; BRp AGAIN; HALT; NUMBER .BLKW 1 (filled by other code); SIX .FILL x0006; placed at x3050. Figure 7.2 rewrites Chapter 5's character counter in assembly: TRAP x23 inputs a character, TRAP x21 outputs one, TRAP x25 halts; digit-to-ASCII conversion adds x30 (ASCII template); the file address is in PTR (.FILL x4000), which in practice would be .BLKW 1 filled by another module. Comments, blank comment lines and aligned columns make it readable.",
    steps: [
      { k: "play", title: "Multiply by 6 (Figure 7.1)", b: [
        (host) => sim(host, { src: MUL6, init: (m) => { m.mem[0x3057] = 123; }, watch: [["NUMBER", "NUMBER"], ["SIX", "SIX"]], io: false, listHeight: 260, maxSteps: 500 }),
        `<p class="aside">NUMBER is reserved with .BLKW, so some other code must put a value there first; here it's preset to 123. Run it: R3 should be 738.</p>`,
      ]},
      { k: "play", title: "Count a character (Figure 7.2)", b: [
        (host) => sim(host, { src: COUNT, input: "e", init: (m) => { const s = "assemble the elements"; for (let i = 0; i < s.length; i++) m.mem[0x4000 + i] = s.charCodeAt(i); m.mem[0x4000 + s.length] = 4; }, listHeight: 300, maxSteps: 5000 }),
        `<p class="aside">The file at x4000 is “assemble the elements” then EOT. Compare this listing with the bits you'd have written by hand in Chapter 5: same program, far easier to read.</p>`,
        seenPP("The same program in machine language.", "05-lc3.html#p8", "Chapter 5, Part 8"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "With “assemble the elements” and input 'e', what digit is printed?", a: 6, tol: 0.01, why: "assEmblE thE ElEmEnts: 6." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does Figure 7.1 reserve NUMBER with .BLKW instead of .FILL?", model: "Because the number to multiply isn't known when the program is written. Another piece of code, perhaps reading the keyboard, will store it there before this code runs, so the program only needs a location set aside, not an initial value." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "How the assembler works: two passes", mins: 30,
    blurb: "Pass 1 builds the symbol table with a location counter. Pass 2 translates, computing every offset.",
    takeaway: "One pass fails on forward references (LD R3, PTR before PTR is defined). So: pass 1 walks the program with a location counter (LC, starting at the .ORIG address, +1 per instruction or .FILL, +n for .BLKW n, +length+1 for .STRINGZ), entering each label with the current LC into the symbol table (Figure 7.2: TEST x3004, GETCHAR x300B, OUTPUT x300E, ASCII x3012, PTR x3013). Pass 2 translates each line using the table: LD R3, PTR at x3001: PCoffset = x3013 − x3002 = x0011 → 0010 011 000010001. If the target is beyond −256..+255 of the incremented PC, it's an assembly error. The output (object file) starts with the .ORIG address followed by the words.",
    steps: [
      { k: "learn", title: "Why one pass isn't enough", b: [
        `<p>Line 2 of the counter is <code>LD R3,PTR</code>, but PTR is defined at the very end. On a single pass the assembler doesn't know PTR's address yet, so it can't compute the offset. Hence:</p>`,
        `<ol><li><b>Pass 1:</b> assign an address to every line; record each label's address in the <b>symbol table</b>.</li><li><b>Pass 2:</b> translate each line, looking up labels in the table.</li></ol>`,
        seenHH("MIPS assemblers work the same way.", "06-architecture.html#p10", "Chapter 6, Part 10"),
      ]},
      { k: "play", title: "Watch both passes", b: [
        (host) => {
          const img = assemble(COUNT);
          const items = img.listing.filter((r) => r.src && !/^\s*;/.test(r.src));
          const syms = Object.entries(img.sym).sort((a, b) => a[1] - b[1]);
          const ro = el(`<div></div>`), tb = el(`<div class="tbl"></div>`);
          let pass = 1, k = 0;
          function draw() {
            const r = items[k], lab = syms.find(([, a]) => a === r.addr);
            if (pass === 1) {
              const known = syms.filter(([, a]) => a <= r.addr);
              ro.innerHTML = readout([["Pass 1, LC", h4(r.addr)], ["Line", r.src.replace(/;.*$/, "").trim()], ["Action", lab ? `label ${lab[0]} → symbol table gets ${lab[0]} = ${h4(r.addr)}` : "no label: just advance LC"]]);
              tb.innerHTML = `<table><thead><tr><th>Symbol</th><th>Address</th></tr></thead><tbody>${known.map(([s, a]) => `<tr><td>${s}</td><td class="mono">${h4(a)}</td></tr>`).join("") || "<tr><td colspan=2>(empty so far)</td></tr>"}</tbody></table>`;
            } else {
              const src = r.src.replace(/;.*$/, "").trim(), toks = src.split(/[\s,]+/), names = syms.map(([x]) => x);
              if (names.includes(toks[0])) toks.shift();
              const refName = toks.slice(1).find((t) => names.includes(t)), ref = refName ? syms.find(([x]) => x === refName) : null;
              const off = ref ? ref[1] - (r.addr + 1) : null;
              ro.innerHTML = readout([["Pass 2, address", h4(r.addr)], ["Line", src], ["Label used", ref ? `${ref[0]} = ${h4(ref[1])}; offset = ${h4(ref[1])} − ${h4(r.addr + 1)} = ${off}` : "none"], ["Machine code", bin(r.word, 16).replace(/(.{4})/g, "$1 ").trim()]]);
              tb.innerHTML = `<table><thead><tr><th>Symbol</th><th>Address</th></tr></thead><tbody>${syms.map(([s, a]) => `<tr><td>${s}</td><td class="mono">${h4(a)}</td></tr>`).join("")}</tbody></table>`;
            }
          }
          const nx = btn("Next line →", "primary"), bk = btn("← Back");
          nx.addEventListener("click", () => { if (k < items.length - 1) k++; else if (pass === 1) { pass = 2; k = 0; } draw(); });
          bk.addEventListener("click", () => { if (k > 0) k--; else if (pass === 2) { pass = 1; k = items.length - 1; } draw(); });
          const row = el(`<div class="row"></div>`); row.append(bk, nx);
          host.append(row, ro, tb);
          draw();
        },
        `<p class="aside">The character counter of Figure 7.2. Pass 1 only tracks the location counter and labels; pass 2 can then compute every PC offset. Final table: TEST x3004, GETCHAR x300B, OUTPUT x300E, ASCII x3012, PTR x3013.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "An LD at x3020 refers to a label at x3010. What PCoffset9 does pass 2 encode (decimal)?", a: -17, tol: 0.01, why: "x3010 − x3021 = −17." },
        { t: "mcq", q: "A label is 400 locations after an LD that uses it. What happens?", opts: [["Assembly error: the offset doesn't fit in 9 bits (−256..255)", true, "Use LDI with a nearby pointer, or LDR."], ["It wraps around", false, ""], ["Run-time error", false, "The assembler catches it."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does the location counter do in pass 1?", model: "It tracks the address each line of the program will occupy, starting from the .ORIG address and advancing by one for each instruction or .FILL, by n for .BLKW n, and by the string length plus one for .STRINGZ. Whenever a line has a label, the assembler records the label with the current location counter value in the symbol table." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Beyond one program: objects and linking", mins: 15,
    blurb: "Modules, object files, the executable image, and labels defined somewhere else.",
    takeaway: "The executable image is what actually runs. It's built from modules, often written separately (some by users, some library routines from the OS, some compiled from C); each is translated separately into an object file (ISA instructions plus data); the linker combines them into one executable image. If a module refers to a label in another module (the character counter's file address, STARTofFILE), the assembler alone can't resolve it; with an .EXTERNAL pseudo-op (not in the LC-3 assembler, but common), the assembler marks the symbol as belonging to another module, and the linker fills in the address when combining.",
    steps: [
      { k: "learn", title: "From modules to an executable", b: [
        `<ol><li>Several <b>modules</b> are written separately (yours, a teammate's, library routines, compiled C).</li><li>Each is translated into an <b>object file</b>: machine code plus data, plus its symbol table.</li><li>The <b>linker</b> combines them into one <b>executable image</b>, which is loaded and run.</li></ol>`,
        `<p>Suppose the counter's file lives in another module: <code>PTR .FILL STARTofFILE</code>. Alone, this won't assemble: STARTofFILE isn't in the symbol table. With a directive like <code>.EXTERNAL STARTofFILE</code>, the assembler marks it as “defined elsewhere” and the linker fills in the address.</p>`,
        seenHH("Compiling, assembling, linking and loading MIPS.", "06-architecture.html#p10", "Chapter 6, Part 10"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Who resolves a reference to a label defined in a different module?", opts: [["The linker, using the other module's symbol table", true, "The assembler only sees one module."], ["The assembler", false, "It can't see other modules."], ["The processor at run time", false, "Addresses must be fixed before running."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why are programs built from separately assembled modules instead of one big file?", model: "Large programs are written by many people and use library code that rarely changes. Assembling or compiling each module separately means only changed modules need retranslating, teams can work independently, and libraries can be reused; the linker then combines the object files and resolves references between them." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp7", eyebrow: "Patt & Patel · Chapter 7", title: "Assembly Language",
    intro: `<p>Six parts: why assembly, the parts of an assembly line, pseudo-ops, two complete programs, the two-pass assembler, and object files and linking.</p><p>The simulator from earlier chapters has been reading assembly all along; now you'll see exactly what the assembler does. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. For symbol-table exercises, keep a written location counter down the margin of the program, line by line.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <h3>Assembly language</h3>
      <p>Low-level, ISA-specific, ~one line per instruction. Line = Label Opcode Operands ; Comment. Literals # decimal, x hex, b binary. Labels: 1–20 alphanumerics, start with a letter, not reserved words; label only branch targets and data.</p>
      <h3>Pseudo-ops</h3>
      <p>.ORIG (start address), .FILL (one word), .BLKW n (n words), .STRINGZ (characters + x0000), .END (end of text, not of execution).</p>
      <h3>Assembler</h3>
      <p>Pass 1: location counter + symbol table. Pass 2: translate, offset = label − (LC + 1), must fit. Object files → linker (.EXTERNAL symbols) → executable image.</p>`,
  };
  Course.start(window.CHAPTER);
})();
