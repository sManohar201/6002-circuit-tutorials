(function () {
  const { S, toggle, readout, el } = Course;
  const { sim, h4 } = LC3;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const pre = (t) => `<pre class="code">${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`;

  /* =============== PART 1 =============== */
  function construct(k) {
    let s = "";
    const box = (x, y, w, h, t) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" style="fill:var(--card);stroke:var(--ink)"/>` + S.t(x + w / 2, y + h / 2 + 5, t, { cls: "s" });
    const dia = (x, y, t) => `<path d="M${x} ${y - 22} L${x + 60} ${y} L${x} ${y + 22} L${x - 60} ${y} Z" style="fill:var(--card);stroke:var(--ink)"/>` + S.t(x, y + 5, t, { cls: "s" });
    const ar = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:var(--ink);stroke-width:1.5"/>`;
    s += ar(210, 4, 210, 24);
    if (k === 0) { s += box(150, 24, 120, 40, "first subtask") + ar(210, 64, 210, 90) + box(150, 90, 120, 40, "second subtask") + ar(210, 130, 210, 190); }
    if (k === 1) { s += dia(210, 50, "condition?") + ar(150, 50, 90, 50) + ar(90, 50, 90, 90) + ar(270, 50, 330, 50) + ar(330, 50, 330, 90) + box(40, 90, 100, 40, "subtask 1") + box(280, 90, 100, 40, "subtask 2") + ar(90, 130, 90, 160) + ar(330, 130, 330, 160) + ar(90, 160, 330, 160) + ar(210, 160, 210, 190) + S.t(108, 44, "true", { cls: "s g" }) + S.t(312, 44, "false", { cls: "s b" }); }
    if (k === 2) { s += dia(210, 50, "condition?") + ar(210, 72, 210, 100) + box(150, 100, 120, 40, "subtask") + ar(210, 140, 210, 160) + ar(210, 160, 110, 160) + ar(110, 160, 110, 30) + ar(110, 30, 210, 30) + ar(270, 50, 330, 50) + ar(330, 50, 330, 180) + ar(330, 180, 210, 180) + ar(210, 180, 210, 190) + S.t(222, 92, "true", { a: "start", cls: "s g" }) + S.t(290, 44, "false", { cls: "s b" }); }
    s += S.t(210, 206, "one way in at the top, one way out at the bottom", { cls: "s m" });
    return S.svg(420, 214, s, { max: 420, label: "Structured programming construct" });
  }
  const p1 = {
    id: "p1", title: "Systematic decomposition", mins: 20,
    blurb: "Break a task into smaller ones using only three constructs: sequential, conditional, iterative.",
    takeaway: "An algorithm is a step-by-step procedure with definiteness (each step precisely stated), effective computability (each step can be done by a computer) and finiteness (it terminates). Structured programming (late 1960s), also called systematic decomposition or stepwise refinement, repeatedly replaces a task that's still too complex with one of three constructs, each having exactly one entrance and one exit: sequential (do subtask 1 completely, then subtask 2, never returning), conditional (test a condition once; do subtask 1 if true, subtask 2 if false, either possibly empty), iterative (test; while true, do the subtask and test again; when false, go on). Because each construct has one entry and one exit, any box can be replaced by any decomposition.",
    steps: [
      { k: "learn", title: "What an algorithm needs", b: [
        `<ul><li><b>Definiteness:</b> each step is precisely stated.</li><li><b>Effective computability:</b> a computer can actually do each step.</li><li><b>Finiteness:</b> it finishes.</li></ul>`,
        `<p><b>Systematic decomposition</b> (stepwise refinement): take a task that's too big, replace it with smaller tasks arranged in one of three ways, and repeat until every box is small enough to write as a few instructions.</p>`,
        seenPP("Levels of transformation from problem to electrons.", "01-welcome-aboard.html", "Chapter 1"),
      ]},
      { k: "play", title: "The three constructs", b: [
        (host) => {
          const f = el(`<div class="fig"></div>`), ro = el(`<div></div>`);
          const txt = ["Do one subtask completely, then the other. Never go back.", "Test once. Do one of two subtasks (either may be empty), then continue. Never retest.", "Test. While true: do the subtask, then test again. The first time it's false, continue."];
          let k = 0;
          const draw = () => { f.innerHTML = construct(k); ro.innerHTML = readout([["Meaning", txt[k]]]); };
          host.append(toggle(["Sequential", "Conditional", "Iterative"], (i) => { k = i; draw(); }), f, ro);
          draw();
        },
        `<p>Each construct has <b>one entrance and one exit</b>, just like the box it replaces. That's why decompositions can be nested freely, and why the result stays easy to reason about.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which construct fits?", bins: ["Sequential", "Conditional", "Iterative"], items: [
          ["Read a number, then print its square", 0, ""], ["If the temperature is above 30, turn on the fan", 1, ""], ["Keep reading keys until the user presses Enter", 2, "Repeat while a condition holds."], ["Add up all the numbers in a list", 2, ""], ["Print 'even' or 'odd'", 1, "One of two subtasks."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does it matter that each construct has exactly one entrance and one exit?", model: "Because then a construct can replace any box in a flowchart without changing how the rest of the program connects to it. You can keep refining boxes independently, and control never jumps into the middle of something, which makes the program much easier to understand, test and debug." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "The constructs in LC-3", mins: 25,
    blurb: "Sequential needs no branches. Conditional needs two. Iterative needs two, one of them backwards.",
    takeaway: "Figure 6.2. Sequential: no control instructions; the PC just increments from the first subtask into the second. Conditional: generate the condition (set N, Z, P), then BR at B2 tests it: if true, jump to subtask 1, skipping subtask 2 (offset x = 1 + the number of instructions in subtask 2); if false, fall through into subtask 2, which ends with an unconditional BR (0000 111) over subtask 1 (offset y = number of instructions in subtask 1). Iterative: generate the condition, BR at B3 branches out of the loop when the condition is false (offset z = 1 + instructions in the subtask); otherwise fall into the subtask, which ends with an unconditional BR back to the condition generation (negative offset w covering the whole construct).",
    steps: [
      { k: "learn", title: "Conditional", b: [
        pre(`        ...generate condition (sets N, Z, P)
B2      BRcond  SUB1         ; true: skip subtask 2
        ...subtask 2         ; false: fall through
C2      BRnzp   NEXT         ; jump over subtask 1
SUB1    ...subtask 1
NEXT    ...`),
        `<p>The first branch jumps <b>1 + (size of subtask 2)</b> instructions forward; the unconditional one at the end of subtask 2 jumps <b>(size of subtask 1)</b> forward.</p>`,
      ]},
      { k: "learn", title: "Iterative", b: [
        pre(`TOP     ...generate condition
B3      BRnotcond NEXT       ; condition false: leave
        ...subtask
D3      BRnzp   TOP          ; back to the test
NEXT    ...`),
        `<p>The exit branch tests the <i>opposite</i> of the loop condition. The loop body ends with an unconditional branch back to where the condition is generated, never directly to B3.</p>`,
        seenPP("The counter loop from Chapter 5 has exactly this shape.", "05-lc3.html#p7", "Chapter 5, Part 7"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Conditional construct: subtask 1 has 4 instructions, subtask 2 has 3 (plus its closing BRnzp). What PCoffset goes in the branch at B2?", a: 4, tol: 0.01, hint: "Skip subtask 2's 3 instructions and its BRnzp.", why: "1 + 3 = 4." },
        { t: "num", q: "Iterative construct: the loop body has 5 instructions plus the closing BRnzp. Offset of the exit branch at B3?", a: 6, tol: 0.01, why: "Skip the 5 body instructions and the BRnzp: 1 + 5 = 6." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the loop's exit branch test the opposite of the loop condition?", model: "The branch is placed before the loop body and jumps out of the loop. We want to leave when the condition is false and fall through into the body when it's true, so the branch must be taken exactly when the condition fails." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const REFINE = [
    ["(a) The problem", "Input a character, scan a file counting occurrences of it, display the count (up to 9)."],
    ["(b) Sequential", "A: initialize (count, pointer, input char, first file char). B: scan the file, counting matches. C: display the count."],
    ["(c) B becomes iterative", "Loop while not at end of file (EOT sentinel): B1 = test the character and get the next one. Registers chosen: R0 input char, R1 file char, R2 count, R3 pointer."],
    ["(d) More sequential", "B1 = B2 (test; increment on match) then B3 (get next char). C = C1 (prepare ASCII) then C2 (display)."],
    ["(e) B2 becomes conditional", "If R1 = R0, R2 ← R2 + 1. B3 = R3 ← R3 + 1, then R1 ← M[R3]. Each box is now 1–3 instructions: write the code (Chapter 5's program)."],
  ];
  const p3 = {
    id: "p3", title: "Refining the character counter", mins: 15,
    blurb: "Where Chapter 5's program came from: five rounds of refinement.",
    takeaway: "Figure 6.3 refines the character-count problem: (a) the English statement; (b) sequential: A initialize (input char, pointer to file, first char, count = 0), B scan and count, C display; (c) B as an iteration controlled by the EOT sentinel (you can't know a random file's length), registers assigned (R0 input char, R1 current char, R2 count, R3 pointer); (d) B1 = test-and-count then get-next; C = form ASCII then output; (e) the test becomes a conditional construct and get-next a sequence; then code each box. Initialization is the first step of every algorithm: values don't appear in registers by magic. If you can't understand everything at first, understand a piece and expand; then restart the decomposition from the top.",
    steps: [
      { k: "play", title: "Five rounds", b: [
        (host) => {
          const ro = el(`<div></div>`);
          let k = 0;
          const draw = () => { ro.innerHTML = readout([[REFINE[k][0], REFINE[k][1]]]); };
          const nx = btn("Refine →", "primary"), bk = btn("← Back");
          nx.addEventListener("click", () => { k = Math.min(REFINE.length - 1, k + 1); draw(); });
          bk.addEventListener("click", () => { k = Math.max(0, k - 1); draw(); });
          const row = el(`<div class="row"></div>`); row.append(bk, nx);
          host.append(row, ro);
          draw();
        },
        `<p class="aside">Why a sentinel and not a counter? You don't know how long a random file is, but every file ends with EOT.</p>`,
        seenPP("The finished program, running.", "05-lc3.html#p8", "Chapter 5, Part 8"),
      ]},
      { k: "learn", title: "Initialization first", b: [
        `<p>Every algorithm starts by giving its variables initial values. Registers don't start at 0 by magic: they hold whatever the last program left there.</p>`,
        `<p class="aside">The book's advice for hard problems: you rarely understand everything at the start. Make sense of one piece, expand from there, then go back to step (a) and decompose properly.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In the refinement of the character counter, why does B become an iterative construct?", model: "Scanning the file means doing the same work, test a character and move to the next, once per character, an unknown number of times. That's repetition controlled by a condition, whether the end-of-file sentinel has been reached, which is exactly the iterative construct." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const EX1 = `        .ORIG x3200
        AND  R2, R2, #0   ; R2 <- 0
LOOP    ADD  R2, R2, R4   ; R2 <- R2 + R4
        ADD  R5, R5, #-1  ; R5 <- R5 - 1
        BRzp LOOP         ; repeat while R5 >= 0 ?
        HALT
        .END`;
  const p4 = {
    id: "p4", title: "Debugging: trace, step, breakpoint", mins: 30,
    blurb: "Set values, run, single-step, stop at breakpoints, display. Then find a real bug.",
    takeaway: "Debugging is applied common sense: get back to a known position and compare where you are with where you should be. Trace the program: record which instructions ran and what each produced; differences in flow reveal control errors, differences in results reveal logic errors. Partition into modules and check results at module boundaries (structured programming tells you where). Elementary interactive operations: set values in registers and memory (to test a module in isolation), execute (Run until HALT or a breakpoint; Step n instructions, single-stepping when n = 1; Set/Clear Breakpoint: stop when the PC equals a listed address, checked at FETCH), and display memory and registers. Annotate each instruction precisely: eyeballing misleads. Example 1: multiply R4 × R5 into R2 with BRzp at the bottom gives 40 for 10 × 3: the loop ran 4 times because the branch also takes Z; fix: BRp. A breakpoint at the branch gives one trace line per iteration. Test with corner cases (0, negatives), the values most likely to fail.",
    steps: [
      { k: "learn", title: "Your debugging tools", b: [
        `<div class="tbl"><table><tbody>
          <tr><td><b>Set values</b></td><td>put values in registers or memory, to test one module without the ones before it</td></tr>
          <tr><td><b>Run</b></td><td>until HALT or a breakpoint</td></tr>
          <tr><td><b>Step</b></td><td>one instruction (or n), then stop</td></tr>
          <tr><td><b>Breakpoint</b></td><td>stop whenever the PC reaches an address you chose</td></tr>
          <tr><td><b>Display</b></td><td>look at registers and memory</td></tr></tbody></table></div>`,
        `<p>The method: <b>trace</b> the program, comparing what each instruction did with what it was supposed to do. Write the intended effect next to each instruction; eyeballing code misleads.</p>`,
      ]},
      { k: "play", title: "Example 1: 10 × 3 = 40?", b: [
        (host) => sim(host, { src: EX1, editable: true, rows: 7, setRegs: [[4, 10], [5, 3]], breakpoints: [0x3203], trace: [2, 4, 5], io: false, phases: false, listHeight: 220 }),
        `<p class="aside">The program should leave R4 × R5 in R2. A breakpoint (●) is set on the branch: press Run repeatedly and read the trace, one row per loop iteration. How many times does the loop run? Find the bug, fix it in the editor, Assemble, and check. (Click ○ to set more breakpoints.)</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "What's the bug?", opts: [["BRzp also branches when R5 reaches 0, so the body runs one extra time: it should be BRp", true, "The book's fix: BRp."], ["R2 isn't initialized", false, "AND R2, R2, #0 does that."], ["ADD R5, R5, #-1 should come after the branch", false, "Then the branch would test R2's ADD."]] },
        { t: "mcq", q: "This multiply only promises to work for positive integers. If it had to work for all integers, which test value is most important to include?", opts: [["0", true, "Corner cases are where bugs hide."], ["10", false, "Ordinary values usually work."], ["A large positive number", false, ""]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why set a breakpoint on the loop's branch instead of single-stepping every instruction?", model: "The breakpoint stops execution once per iteration, so the trace shows the state at the end of each pass, enough to see how many times the loop ran and how the registers evolved, without the tedium of stepping through every instruction of every iteration." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const EX2 = `        .ORIG x3000
        AND  R1, R1, #0   ; R1 <- 0 (sum)
        AND  R4, R4, #0
        ADD  R4, R4, #10  ; R4 <- 10 (count)
        LD   R2, #252     ; R2 <- x3100 ?
LOOP    LDR  R3, R2, #0   ; R3 <- M[R2]
        ADD  R2, R2, #1
        ADD  R1, R1, R3
        ADD  R4, R4, #-1
        BRp  LOOP
        HALT
        .END`;
  const EX2DATA = [0x3107, 0x2819, 0x0110, 0x0310, 0x0110, 0x1110, 0x11b1, 0x0019, 0x0007, 0x0004];
  const EX3 = `        .ORIG x3000
        AND  R0, R0, #0
        ADD  R0, R0, #1   ; R0 <- 1 (assume found)
        AND  R1, R1, #0
        ADD  R1, R1, #-5  ; R1 <- -5
        AND  R3, R3, #0
        ADD  R3, R3, #10  ; R3 <- 10 (count)
        LD   R4, ADDR     ; R4 <- x3100
        LDR  R2, R4, #0
TEST    ADD  R2, R2, R1   ; R2 - 5
        BRz  DONE         ; found a 5
        ADD  R4, R4, #1
        ADD  R3, R3, #-1  ; one fewer to test
        LDR  R2, R4, #0   ; next value
        BRp  TEST         ; more to test?
        AND  R0, R0, #0   ; R0 <- 0 (not found)
DONE    HALT
ADDR    .FILL x3100
        .END`;
  const EX3DATA = [12, 7, 32, 0, 9, 5, 3, 8, 1, 2];
  const p5 = {
    id: "p5", title: "Two classic bugs", mins: 30,
    blurb: "LD where you meant LEA. A load sneaking between the instruction that sets the codes and the branch.",
    takeaway: "Example 2: adding the 10 numbers at x3100 gave x0024 instead of x8135. Tracing the first four instructions shows R2 = x3107 after x3003: LD (0010) loaded the contents of x3100, not its address; the fix is LEA (1110). Example 3: searching 10 locations for a 5 reported 'no 5' because the loop's BRp followed LDR, which reset the condition codes from the loaded value instead of the counter; it worked by coincidence while the loaded values were positive and failed when a 0 was loaded. Rule: a conditional branch is the second instruction of a pair: instruction A sets the codes, then BR; never put another code-setting instruction between them (fix: swap the counter decrement and the load). Bugs often hide for several iterations.",
    steps: [
      { k: "play", title: "Example 2: summing ten numbers", b: [
        (host) => sim(host, { src: EX2, editable: true, rows: 11, init: (m) => EX2DATA.forEach((v, i) => { m.mem[0x3100 + i] = v; }), breakpoints: [0x3004], trace: [1, 2, 4], io: false, phases: false, maxSteps: 2000, listHeight: 260 }),
        `<p class="aside">It should add M[x3100…x3109] (sum x8135) into R1, but gives x0024. Run once to the breakpoint at x3004 and look at R2. Expected: x3100. What is it, and why? Fix it and re-run.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why was R2 wrong?", opts: [["LD loads the contents of x3100 (x3107); LEA would load the address x3100", true, "Opcode 0010 vs 1110."], ["The offset was miscounted", false, "The address is right; the opcode is wrong."], ["LDR reads the wrong register", false, ""]] },
      ]},
      { k: "play", title: "Example 3: is there a 5?", b: [
        (host) => sim(host, { src: EX3, editable: true, rows: 12, init: (m) => EX3DATA.forEach((v, i) => { m.mem[0x3100 + i] = v; }), breakpoints: ["TEST"], trace: [0, 2, 3, 4], io: false, phases: false, maxSteps: 2000, listHeight: 280 }),
        `<p class="aside">The data at x3100 is 12, 7, 32, 0, 9, 5, … so there <b>is</b> a 5, but the program ends with R0 = 0. Run to the breakpoint repeatedly and watch R2 and R3. Which instruction set the codes that BRp tests?</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why did it stop early?", opts: [["BRp tested the codes from LDR (the value 0 just loaded), not from the counter R3", true, "A load sets condition codes too."], ["The counter started at 9", false, ""], ["The 5 was beyond the 10 locations", false, "It's at x3105."]] },
        { t: "mcq", q: "The simplest fix?", opts: [["Swap ADD R3, R3, #-1 and LDR R2, R4, #0, so the counter sets the codes right before BRp", true, "Keep the code-setting instruction and its branch together."], ["Change BRp to BRnzp", false, "Then it never exits."], ["Remove the LDR", false, "Then it re-tests the same value."]] },
      ]},
      { k: "learn", title: "The instruction pair rule", b: [
        pre(`Instruction A   ; sets the condition codes
BR              ; branches on them`),
        `<p>Treat a conditional branch as the second half of a <b>pair</b>. Never put another code-setting instruction (operate or load) between them.</p>`,
        `<p class="aside">Notice that example 3 worked for the first two iterations: the loaded values happened to be positive. Bugs don't always show up the first time.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why did Example 3's bug only appear on the third iteration?", model: "The branch was testing the condition codes from the load, not from the counter. For the first two iterations the loaded values were positive, so BRp happened to branch, just as the counter would have required. The third value loaded was 0, so the branch fell through and the program wrongly concluded there was no 5." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const EX4 = `        .ORIG x3000
        AND  R1, R1, #0
        ADD  R1, R1, #15  ; R1 <- 15 (leftmost bit number)
        LDI  R2, PTR      ; R2 <- M[x3400]
        BRn  DONE         ; bit 15 set?
LOOP    ADD  R1, R1, #-1  ; next bit number
        ADD  R2, R2, R2   ; shift left one place
        BRn  DONE         ; new bit 15 set?
        BRnzp LOOP
DONE    HALT
PTR     .FILL x3400
        .END`;
  const p6 = {
    id: "p6", title: "Corner cases and infinite loops", mins: 25,
    blurb: "A program that works almost always. Find the input that hangs it.",
    takeaway: "Example 4: find the leftmost 1 in the word at x3400 and put its bit number in R1 (or −1 if none). R1 starts at 15; LDI fetches the word (x3400 is out of LD's range, so its address sits at x3009); BRn tests bit 15; the loop decrements R1, doubles R2 (shifting left; ADD R2, R2, R2), and branches out when the new bit 15 is 1, else branches back. It works for every word with at least one 1, but for x0000 the exit branch is never taken: an infinite loop (R1 goes 14, 13, … 0, −1, −2…). The programmer assumed at least one bit was set. Corner cases (zero, all ones, most negative, empty input) are the hardest bugs because ordinary testing passes; a program must work for all valid inputs, not most of them.",
    steps: [
      { k: "play", title: "Find the first 1", b: [
        (host) => {
          let word = 0x2180;
          const words = [["x2180 (bits 13, 8, 7)", 0x2180], ["x0006 (bits 2, 1)", 0x0006], ["x8000 (bit 15)", 0x8000], ["x0000 (no bits)", 0x0000]];
          const box = el(`<div></div>`);
          let h = null;
          host.append(toggle(words.map((w) => w[0]), (i) => { word = words[i][1]; if (h) h.reload(); }), box);
          h = sim(box, { src: EX4, init: (m) => { m.mem[0x3400] = word; }, breakpoints: ["LOOP"], trace: [1, 2], io: false, phases: false, maxSteps: 3000, watch: [["word", 0x3400]], listHeight: 240 });
        },
        `<p class="aside">The answer should be the bit number of the leftmost 1 (13 for x2180, 2 for x0006). Try each word with Run. Then try x0000. (The simulator gives up after 3000 instructions.)</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why does x0000 hang?", opts: [["Shifting zeros left never produces a 1 in bit 15, so the exit branch is never taken", true, "An infinite loop: no way out."], ["LDI fails on zero", false, "It loads 0 just fine."], ["R1 overflows", false, "It counts down forever, but that's a symptom."]] },
        { t: "mcq", q: "Which test plan would have caught this before shipping?", opts: [["Include corner cases: x0000, xFFFF, x8000, x0001", true, "Unusual values break programs."], ["Ten random words", false, "The odds of hitting x0000 are 10 in 65,536."], ["Words with exactly one bit set", false, "Still always has a 1."]] },
      ]},
      { k: "learn", title: "Test like a skeptic", b: [
        `<ul><li>A program must work for <b>every</b> valid input, not most of them.</li><li>Choose test values the programmer may not have thought about: <b>0</b>, the largest and smallest values, negatives, empty lists, the sentinel itself.</li><li>Breakpoints at module boundaries tell you <i>where</i> things go wrong; single-stepping there tells you <i>what</i>.</li></ul>`,
        `<p class="aside">Chapter 15 uses the same ideas (breakpoints, stepping, examining state) on C programs.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is a corner case, and why are corner-case bugs hard to find?", model: "A corner case is an unusual but valid input, like zero, the largest or smallest value, or an empty list, that the programmer may not have considered. Ordinary tests pass because the program works for typical data, so the bug stays hidden until that rare input appears, often after the program is in use." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp6", eyebrow: "Patt & Patel · Chapter 6", title: "Programming",
    intro: `<p>Six parts: systematic decomposition, the three constructs in LC-3 code, refining a real program, then debugging with traces, breakpoints and corner cases on the book's four buggy programs.</p><p>The simulator now has breakpoints (click ○ beside an address), starting-register boxes and a trace table. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. For each program you write, draw the decomposition first (boxes, then refined boxes), then code each box. Trace your code by hand on a corner case before you trust it.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <h3>Problem solving</h3>
      <p>Algorithm: definite, effectively computable, finite. Stepwise refinement with three one-entry, one-exit constructs: sequential, conditional, iterative.</p>
      <h3>In LC-3</h3>
      <p>Conditional: BR to subtask 1 (offset 1 + |subtask 2|), subtask 2 ends with BRnzp over subtask 1. Iterative: BR out when false (offset 1 + |body|), body ends with BRnzp back to the condition.</p>
      <h3>Debugging</h3>
      <p>Set values, run, step, breakpoints, display. Trace and compare intended vs actual. Classic bugs: wrong branch condition (BRzp vs BRp), LD vs LEA, a load between the code-setting instruction and its branch, missing corner cases (infinite loop on x0000).</p>`,
  };
  Course.start(window.CHAPTER);
})();
