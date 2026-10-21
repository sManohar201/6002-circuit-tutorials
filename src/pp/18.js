(function () {
  const { S, toggle, readout, el } = Course;
  const { code, esc } = CT;
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const fig = (s) => `<div class="fig">${s}</div>`;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const show = (c) => (c === "\n" ? "\\n" : c === " " ? "␣" : c === "\t" ? "\\t" : c);

  /* ---------- Figure 18.1: buffered keyboard input ---------- */
  function keyBuffer(host) {
    let buffer = "", stream = "", vars = { inChar1: null, inChar2: null }, pc = 0;
    const out = el(`<div></div>`), keys = el(`<div class="row"></div>`);
    const run = () => { // the program consumes the stream as far as it can
      while (pc < 2 && stream.length) { const c = stream[0]; stream = stream.slice(1); vars[pc ? "inChar2" : "inChar1"] = c; pc++; }
    };
    const draw = () => {
      const lines = ["Input character 1:"]; if (pc >= 1) lines.push("Input character 2:");
      if (pc >= 2) lines.push(`Character 1 is ${vars.inChar1 === "\n" ? "\n" : vars.inChar1}`, `Character 2 is ${vars.inChar2 === "\n" ? "\n" : vars.inChar2}`);
      out.innerHTML = `<div class="two"><div class="tile"><h3>Keyboard buffer</h3><p class="mono" style="font-size:18px;min-height:1.4em">${[...buffer].map(show).join(" ") || "(empty)"}</p><p class="aside">Held by the system until Enter. Backspace edits here.</p></div><div class="tile"><h3>stdin stream</h3><p class="mono" style="font-size:18px;min-height:1.4em">${[...stream].map(show).join(" ") || "(empty)"}</p><p class="aside">What getchar actually reads.</p></div></div>` +
        readout([["inChar1", vars.inChar1 == null ? (pc === 0 ? "getchar() waiting…" : "?") : `'${show(vars.inChar1)}' = ${vars.inChar1.charCodeAt(0)}`], ["inChar2", vars.inChar2 == null ? (pc === 1 ? "getchar() waiting…" : "?") : `'${show(vars.inChar2)}' = ${vars.inChar2.charCodeAt(0)}`]]) +
        `<pre class="code">${esc(lines.join("\n"))}</pre>`;
    };
    ["A", "z", "7"].forEach((ch) => { const b = btn(`type '${ch}'`); b.addEventListener("click", () => { buffer += ch; draw(); }); keys.append(b); });
    const bs = btn("Backspace"); bs.addEventListener("click", () => { buffer = buffer.slice(0, -1); draw(); });
    const en = btn("Enter", "primary"); en.addEventListener("click", () => { stream += buffer + "\n"; buffer = ""; run(); draw(); });
    const rs = btn("Restart program"); rs.addEventListener("click", () => { buffer = ""; stream = ""; vars = { inChar1: null, inChar2: null }; pc = 0; draw(); });
    keys.append(bs, en, rs); host.append(keys, out); draw();
  }

  /* ---------- Figure 18.2: buffered output ---------- */
  function outBuffer(host) {
    let fixed = false;
    const out = el(`<div></div>`);
    const draw = () => {
      const ev = fixed ? [[0, "a⏎", "putchar('a'); putchar('\\n') flushes: a appears now"], [5, "b⏎", "after sleep(5): b, then \\n flushes"]] : [[0, "", "putchar('a') goes into the output buffer: nothing on screen"], [5, "ab⏎", "after sleep(5): b, then putchar('\\n') flushes everything"]];
      let s = `<line class="w" x1="30" y1="60" x2="400" y2="60"/>` + [0, 1, 2, 3, 4, 5].map((t) => `<line class="w" x1="${40 + t * 60}" y1="55" x2="${40 + t * 60}" y2="65"/>` + S.t(40 + t * 60, 82, t + " s", { cls: "lab" })).join("");
      ev.forEach(([t, txt]) => { if (txt) s += `<rect x="${40 + t * 60 - 22}" y="18" width="44" height="26" rx="5" style="fill:var(--accent-soft);stroke:var(--ink)"/>` + S.t(40 + t * 60, 36, txt); });
      out.innerHTML = fig(S.svg(420, 92, s, { max: 420, label: "When the characters reach the screen" })) + `<ul>${ev.map((e) => `<li>${e[1] ? "" : ""}t = ${e[0]} s: ${e[2]}</li>`).join("")}</ul>`;
    };
    host.append(toggle(["Figure 18.2 as written", "with putchar('\\n') after line 6"], (i) => { fixed = !!i; draw(); }, 0), out); draw();
  }

  /* ---------- printf walking its format string ---------- */
  function printfWalk(host) {
    const FMT = "Char %c.\\t String %s\\n Float %f\\n";
    const ARGS = [["c", "'z'", "z"], ["banner", "\"Hola!\"", "Hola!"], ["pi", "3.14159", "3.141590"]];
    const toks = []; // [display, output, kind, argIndex]
    let a = 0;
    for (let i = 0; i < FMT.length; i++) {
      const ch = FMT[i];
      if (ch === "%") { toks.push([FMT.slice(i, i + 2), ARGS[a][2], "spec", a]); a++; i++; }
      else if (ch === "\\") { const n = FMT[i + 1]; toks.push(["\\" + n, n === "n" ? "\n" : "\t", "esc"]); i++; }
      else toks.push([ch, ch, "text"]);
    }
    let k = 0;
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`);
    const bNext = btn("Next character", "primary"), bAll = btn("Finish"), bReset = btn("Start over");
    const draw = () => {
      const fmtHTML = toks.map((t, j) => `<span style="${j === k - 1 ? "background:var(--accent);color:var(--paper)" : j < k ? "opacity:.5" : ""}">${esc(t[0])}</span>`).join("");
      const used = toks.slice(0, k).filter((t) => t[2] === "spec").length;
      const outText = toks.slice(0, k).map((t) => t[1]).join("");
      const cur = toks[k - 1];
      out.innerHTML = `<p class="mono" style="font-size:16px">"${fmtHTML}"</p><div class="tbl"><table style="font-family:var(--mono);font-size:13px"><thead><tr><th>argument</th><th>value</th><th></th></tr></thead><tbody>${ARGS.map((r, j) => `<tr style="${j < used ? "opacity:.5" : j === used ? "background:var(--cool-soft)" : ""}"><td>${r[0]}</td><td>${esc(r[1])}</td><td>${j < used ? "used" : j === used ? "next pending" : ""}</td></tr>`).join("")}</tbody></table></div>` +
        `<p>${!cur ? "printf looks at the format string one character at a time." : cur[2] === "spec" ? `<b>${cur[0]}</b>: convert the next pending argument and write it.` : cur[2] === "esc" ? `<b>${esc(cur[0])}</b>: a special character (${cur[0] === "\\n" ? "newline" : "tab"}).` : "Ordinary text: copied straight to the output stream."}</p><pre class="code" style="min-height:3em">${esc(outText)}</pre>`;
      bNext.disabled = bAll.disabled = k === toks.length;
    };
    bNext.addEventListener("click", () => { k++; draw(); }); bAll.addEventListener("click", () => { k = toks.length; draw(); }); bReset.addEventListener("click", () => { k = 0; draw(); });
    row.append(bNext, bAll, bReset);
    host.append(code(`char c = 'z';
char banner[10] = "Hola!";
double pi = 3.14159;
printf("Char %c.\\t String %s\\n Float %f\\n", c, banner, pi);`, { nums: false }), row, out); draw();
  }

  /* ---------- scanf on the book's three input lines ---------- */
  function scanfMudd(host) {
    const CASES = [
      ["Mudd 02/16/69 3.02", { name: "Mudd", month: 2, day: 16, year: 69, gpa: "3.02" }, 5, "", "Every field matched."],
      ["Mudd 02\n/\n16 / 69 3.02", { name: "Mudd", month: 2, day: 16, year: 69, gpa: "3.02" }, 5, "", "White space (including newlines) around the fields doesn't matter."],
      ["Mudd 02 16 69 3.02", { name: "Mudd", month: 2, day: "unchanged", year: "unchanged", gpa: "unchanged" }, 2, " 16 69 3.02", "After 02, scanf expects a '/' but finds a space and then 1: mismatch. It stops; name and month were assigned, so it returns 2."],
    ];
    const out = el(`<div></div>`);
    const draw = (i) => {
      const [inp, v, ret, left, why] = CASES[i];
      out.innerHTML = `<p class="aside" style="margin:0">Input typed:</p><pre class="code">${esc(inp)}</pre>` +
        readout([["name", v.name], ["month", v.month], ["day", v.day], ["year", v.year], ["gpa", v.gpa], ["scanf returns", ret]]) + `<p>${why}</p>` +
        (left ? `<p>The unread input <code>${esc(left).replace(/ /g, "␣")}</code> stays in the stream. The book asks: what would two following <code>getchar()</code> calls return? <b>' '</b> and <b>'1'</b>.</p>` : "");
    };
    host.append(code(`char name[100];
int month, day, year;
double gpa;

scanf("%s %d/%d/%d %lf", name, &month, &day, &year, &gpa);`, { nums: false }), toggle(["first input", "second input", "third input"], draw, 0), out); draw(0);
  }

  /* ---------- Figure 18.3: argument order ---------- */
  function argOrder(host) {
    const out = el(`<div></div>`);
    const draw = (i) => {
      const items = i === 0 ? ["ptr to format string", "x", "y", "z"] : ["z", "y", "x", "ptr to format string"];
      let s = "";
      items.forEach((t, k) => { s += `<rect x="90" y="${20 + k * 36}" width="190" height="32" style="fill:${t.startsWith("ptr") ? "var(--accent-soft)" : "var(--card)"};stroke:var(--ink)"/>` + S.t(185, 41 + k * 36, t); });
      s += S.arrow(340, 28, 284, 28, "") + S.t(346, 32, "R6", { a: "start" }) + S.t(185, 180, "stack frame of the caller below", { cls: "lab" });
      out.innerHTML = fig(S.svg(400, 192, s, { max: 400, label: "printf's arguments on the stack" })) + `<p>${i === 0 ? "Right to left (the LC-3 convention): the format string is always at R6 + 0, however many values follow. printf reads it first and learns how many more to fetch." : "Left to right: the format string's offset from R6 depends on how many arguments there are, which printf can't know until it has read the format string. Chicken and egg."}</p>`;
    };
    host.append(el(`<p class="mono">printf("%d %d %d\\n", x, y, z);</p>`), toggle(["(a) pushed right to left", "(b) pushed left to right"], draw, 0), out); draw(0);
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "The C standard library", mins: 15,
    blurb: "C has no I/O built in. It comes from a library of pretested functions: header files for the declarations, the linker for the code.",
    takeaway: "I/O isn't part of the C language; it comes from standard library functions precisely defined by the ANSI standard: putchar and printf write output, getchar and scanf read input, fprintf and fscanf do file I/O. The standard library also covers strings, math, file access and system utilities; similar libraries exist for C++, Java, Python. Summary in Appendix D.9. Library functions are typically written by the system's designers and optimized for it. Use one by including its header: math.h (sin, tan), stdio.h (I/O). Headers hold declarations and macros, not source code. Static linking: the linker copies library object code into the executable image. Dynamically linked libraries (DLLs) are linked on demand at run time: smaller executables, one copy in memory shared by several programs, and the library can be upgraded independently of the application.",
    steps: [
      { k: "learn", title: "I/O comes from a library", b: [
        `<p>The C language itself has no input or output statements. Instead the <b>standard library</b>, defined by the ANSI standard, supplies functions: <code>putchar</code>, <code>printf</code>, <code>getchar</code>, <code>scanf</code>, and file versions <code>fprintf</code>, <code>fscanf</code>. It also has string, math and file functions.</p>`,
        `<p>To use a group of them, <code>#include</code> its header: <code>stdio.h</code> for I/O, <code>math.h</code> for sin and tan. A header holds <b>declarations</b> and macros, not the code.</p>`,
      ]},
      { k: "learn", title: "Where the code comes from", b: [
        `<div class="two"><div class="tile"><h3>Static linking</h3><p>The linker copies the library's object code for printf etc. into your executable image.</p></div><div class="tile"><h3>Dynamic linking (DLLs)</h3><p>The code is linked on demand while the program runs. Smaller executables, one shared copy in memory for all programs, and the library can be upgraded without rebuilding the apps.</p></div></div>`,
        seenPP("The compiler–linker pipeline.", "11-intro-c.html", "Chapter 11"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A security fix is released for a library that 40 programs on your computer use. Which kind of linking makes this easiest?", opts: [["Dynamic: replace the one shared library file", true, "Every program picks up the new version next time it runs."], ["Static: each program already has the code", false, "Each of the 40 would have to be relinked with the fixed library."], ["Neither: headers must be edited", false, "Headers don't contain the code."]] },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Streams, putchar, getchar, buffering", mins: 25,
    blurb: "Characters flow through streams. See why getchar seems to ignore your keystroke until Enter, and why output can show up late.",
    takeaway: "All character I/O is done with streams: typed characters are appended to the end of the input stream and a program reads from its beginning; printed characters are appended to the output stream. Streams decouple producer and consumer, which run at different rates (Chapter 8). stdin is mapped to the keyboard, stdout to the display. putchar (like the OUT trap) writes the ASCII value of its argument to stdout with no conversion: putchar(c) with c = 'h', putchar('h'), putchar(104) all print h. getchar (like IN) returns the ASCII value of the next character in stdin. Buffering: keystrokes are held by system software in a buffer (a small array/queue) and released into the stream when Enter is pressed; Enter itself enters the stream as newline. Figure 18.1: typing A and Enter gives inChar1 = 65 ('A') and inChar2 = 10 (newline); buffering lets the user edit with Backspace/Delete and confirm with Enter. Output is buffered too: Figure 18.2 putchar('a'); sleep(5) (unistd.h); putchar('b'); putchar('\\n'): the a appears only after the delay, when the newline flushes the buffer; adding putchar('\\n') after line 6 changes that. Underneath, the LC-3's IN/OUT routines and interrupt service routines implement the buffering.",
    steps: [
      { k: "learn", title: "Streams", b: [
        `<p>Think of input as a <b>stream</b> of characters: typing adds to the end, the program reads from the front. Output is a stream too. The producer and consumer can run at their own speeds (Chapter 8's idea, again). In C: <code>stdin</code> (keyboard) and <code>stdout</code> (display).</p>`,
        `<pre class="code">char c = 'h';
putchar(c);       <span class="cm">// all three print h</span>
putchar('h');
putchar(104);
c = getchar();    <span class="cm">// next character from stdin, as ASCII</span></pre>`,
        seenPP("The IN and OUT trap routines and keyboard interrupts.", "09-io.html", "Chapter 9"),
      ]},
      { k: "play", title: "Figure 18.1: where did my keystroke go?", b: [
        code(`printf("Input character 1:\\n");
inChar1 = getchar();

printf("Input character 2:\\n");
inChar2 = getchar();

printf("Character 1 is %c\\n", inChar1);
printf("Character 2 is %c\\n", inChar2);`, { nums: false }),
        `<p>Type A, then press Enter. Before you press Enter, predict what inChar2 will be.</p>`,
        keyBuffer,
        `<p>The Enter key is itself a character: newline, ASCII 10. So one A + Enter fills <i>both</i> getchar calls.</p>`,
      ]},
      { k: "play", title: "Output is buffered too (Figure 18.2)", b: [
        code(`putchar('a');

sleep(5);

putchar('b');
putchar('\\n');`, { nums: false }),
        outBuffer,
        `<p>Writing a newline <b>flushes</b> the output buffer. That's why a program that prints a prompt without <code>\\n</code> can seem to hang without showing it.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In Figure 18.1, why does typing a single character and Enter give values to both inChar1 and inChar2?", model: "Keystrokes sit in a buffer until Enter releases them into the input stream, and Enter itself goes into the stream as a newline character. So the stream contains the typed character followed by '\\n'. The first getchar reads the character and the second reads the newline, ASCII 10." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "printf in detail", mins: 20,
    blurb: "How printf walks its format string, consuming one argument per conversion specification, and what happens when you give it too few.",
    takeaway: "printf writes formatted text to the output stream, doing the type conversions (e.g., an int to ASCII digits). Its first parameter is the format string (a char *) containing text and zero or more conversion specifications, all starting with %: %d decimal, %x hex, %b binary (the book lists it; it isn't in older C standards, only C23), %c ASCII, %s string (parameter is a char *), %f floating point, %% a literal %. Special characters start with \\: \\n newline, \\t tab, \\\\ backslash (Table D.1). printf scans the format string one character at a time: ordinary characters go straight to the (buffered) output stream; \\ starts a special character; % takes the next pending parameter and converts it: bit pattern 0000000001101000 prints as 104 with %d and as h with %c. There's no link between a specification and the parameter's actual type: the programmer decides the interpretation. printf(\"The value of nothing is %d\\n\"); with no argument blindly reads a value off the stack and prints garbage.",
    steps: [
      { k: "learn", title: "Conversion specs and special characters", b: [
        `<div class="two"><div class="tile"><h3>% conversions</h3><p><code>%d</code> decimal · <code>%x</code> hex · <code>%c</code> character · <code>%s</code> string · <code>%f</code> floating point · <code>%%</code> a % sign</p></div><div class="tile"><h3>\\ special characters</h3><p><code>\\n</code> newline · <code>\\t</code> tab · <code>\\\\</code> a backslash</p></div></div>`,
        `<p class="aside">The book also lists <code>%b</code> for binary. Most compilers didn't support it until the 2023 C standard, so don't count on it.</p>`,
      ]},
      { k: "play", title: "Watch printf work", b: [
        `<p>Step through the format string. Predict what each % will do with the next pending argument.</p>`,
        printfWalk,
      ]},
      { k: "learn", title: "printf trusts you", b: [
        `<p>printf has no idea what types the arguments really are: the spec decides how the bits are shown. And it can't tell how many arguments you passed. The book's example:</p>`,
        `<pre class="code">printf("The value of nothing is %d\\n");</pre>`,
        `<p>There's no argument, but printf reads a value off the stack anyway and prints whatever garbage is there.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "How would you print <code>Score: 97%</code> with the value in an int called score?", opts: [["printf(\"Score: %d%%\\n\", score);", true, "%% prints a literal percent sign."], ["printf(\"Score: %d%\\n\", score);", false, "A lone % starts a new conversion spec."], ["printf(\"Score: %d\\%\\n\", score);", false, "Backslash doesn't escape %."]] },
        { t: "mcq", q: "With <code>int k = 72;</code>, what does <code>printf(\"%c%c\", k, k + 33);</code> print?", opts: [["Hi", true, "72 is 'H' and 105 is 'i'."], ["72105", false, "That would be %d%d."], ["H!", false, "33 alone is '!', but this prints 72 + 33 = 105."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does printf do when it meets a % in the format string?", model: "It looks at the next character to see which conversion is wanted, takes the next argument that hasn't been used yet off the stack, converts its bits according to that conversion (decimal digits, hex digits, a character, a string, a floating-point number) and writes the resulting characters to the output stream." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "scanf, and variable argument lists", mins: 25,
    blurb: "scanf's format string describes the input; it skips white space, matches literal text, and returns how many fields it filled. Then: why arguments are pushed right to left.",
    takeaway: "scanf reads formatted ASCII from the input stream; like printf it takes a format string and a variable number of arguments, but all arguments after the format string must be pointers (Chapter 16). The format string describes the input: %d expects a sequence of ASCII digits (after skipping white space: spaces, tabs, newlines, carriage returns, vertical tabs, form feeds), converts it to an integer and stores it. Plain text in the format is matched against the input and discarded. Example: scanf(\"%s %d/%d/%d %lf\", name, &month, &day, &year, &gpa): %s reads a word into name and appends \\0 (an array, so already an address); %lf reads a double. Returns the number of conversions successfully scanned (5 here). Input \"Mudd 02/16/69 3.02\" or the same split across lines works identically; \"Mudd 02 16 69 3.02\" mismatches at the missing /: returns 2, day/year/gpa unmodified; the unused input stays buffered, so two getchar() calls then return ' ' and '1'. Variable argument lists: printf and scanf take one argument per conversion spec plus the format string. Pushing arguments right to left (the LC-3 convention) puts the format string pointer at the top of the stack at offset 0 from R6, whatever the count (Figure 18.3a); left to right its offset would depend on the number of arguments (b). Format strings, like all literal strings, live in a memory region for constants.",
    steps: [
      { k: "learn", title: "The format string describes the input", b: [
        `<ul><li>Every argument after the format string is a <b>pointer</b>, so scanf can store into it.</li><li><code>%d</code>: skip white space, read digits, convert to an int.</li><li><code>%s</code>: read one word, add the <code>'\\0'</code>.</li><li><code>%lf</code>: read a double.</li><li>Plain characters like <code>/</code> must appear in the input; they're matched and thrown away.</li><li>It <b>returns how many</b> conversions succeeded.</li></ul>`,
      ]},
      { k: "play", title: "The book's three inputs", b: [
        `<p>Predict scanf's return value for each before clicking.</p>`,
        scanfMudd,
      ]},
      { k: "check", title: "Think critically", b: [
        { t: "mcq", q: "The book's example ignores scanf's return value. What's the risk?", opts: [["After a mismatch, the program carries on using day, year and gpa that were never set", true, "Checking that it returned 5 would catch bad input."], ["The return value fills up the stack", false, "Ignoring it costs nothing."], ["None: scanf retries until it succeeds", false, "It stops at the mismatch."]] },
      ]},
      { k: "play", title: "Why arguments go on right to left (Figure 18.3)", b: [
        argOrder,
        seenPP("Pushing arguments right to left in the calling convention.", "14-functions.html", "Chapter 14"),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does pushing arguments right to left let printf handle any number of arguments?", model: "The format string is the leftmost argument, so it is pushed last and always sits at the top of the stack, at a fixed offset from R6. printf reads it there first; counting its conversion specifications tells it how many more arguments to read, which lie at the next locations down the stack in order." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "I/O from files", mins: 20,
    blurb: "printf and scanf are special cases: fprintf and fscanf work on any stream, including files you open with fopen.",
    takeaway: "C streams are all conceptually bound to files; printf and scanf work on the special files stdout and stdin. General versions: fprintf and fscanf, which take a file pointer first. Declare FILE *infile; (FILE is defined in stdio.h), then infile = fopen(\"<code>aapl_stock_prices</code>\", \"r\"); modes \"r\" read, \"w\" write (previous contents lost), \"a\" append, \"r+\" read and write. fopen returns NULL on failure (e.g., file not found): always check. Figure 18.4 reads up to LIMIT = 10000 doubles with while ((fscanf(infile, \"%lf\", &prices[i]) != EOF) && i < LIMIT) i++; fscanf returns EOF at end of file; then writes an answer with fprintf(outfile, \"%s\", answer). printf(...) is fprintf(stdout, ...), scanf(...) is fscanf(stdin, ...).",
    steps: [
      { k: "learn", title: "Open, check, use", b: [
        code(`FILE *infile;

infile = fopen("ibm_stock_prices", "r");
if (infile == NULL)
   printf("fopen unsuccessful!\\n");`, { nums: false }),
        `<div class="tbl"><table><thead><tr><th>Mode</th><th>Meaning</th></tr></thead><tbody><tr><td><code>"r"</code></td><td>read</td></tr><tr><td><code>"w"</code></td><td>write: <b>erases</b> what was there</td></tr><tr><td><code>"a"</code></td><td>append to the end</td></tr><tr><td><code>"r+"</code></td><td>read and write</td></tr></tbody></table></div>`,
        `<p>Then <code>fscanf(infile, …)</code> and <code>fprintf(outfile, …)</code> work exactly like scanf and printf, with the file pointer first. In fact <code>printf(…)</code> is just <code>fprintf(stdout, …)</code>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which fopen mode?", bins: ["\"r\"", "\"w\"", "\"a\""], items: [
          ["Load yesterday's saved settings", 0, "Just reading."],
          ["Add today's entry to the end of a log file without losing old entries", 2, "Append keeps the old contents."],
          ["Write a brand-new report, replacing any old one", 1, "\"w\" starts the file empty."],
        ]},
      ]},
      { k: "learn", title: "Figure 18.4", b: [
        code(`infile = fopen("aapl_stock_prices", "r");
outfile = fopen("buy_hold_or_sell", "w");

if (infile != NULL && outfile != NULL) {
   // Read the input data
   while ((fscanf(infile, "%lf", &prices[i]) != EOF) && i < LIMIT)
      i++;
   ...
   fprintf(outfile, "%s", answer);
}
else
   printf("fopen unsuccessful!\\n");`, { nums: false }),
        `<p><code>fscanf</code> returns the special value <code>EOF</code> when the file has no more data.</p>`,
      ]},
      { k: "check", title: "Think critically", b: [
        { t: "mcq", q: "Suppose the file holds more than 10,000 prices. Look at the order of the two tests in the while condition. What goes wrong?", opts: [["When i reaches 10,000, fscanf still runs first and writes into prices[10000], past the end of the array", true, "&& evaluates left to right. Swap them: (i < LIMIT) && (fscanf(…) != EOF) checks the bound before reading."], ["Nothing: the i < LIMIT test stops it", false, "Only after fscanf has already stored the value."], ["fscanf can't read doubles", false, "%lf reads a double."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why should a program always check what fopen returned?", model: "fopen returns NULL if it couldn't open the file, for example because it doesn't exist or can't be created. Using a NULL file pointer in fscanf or fprintf would crash or misbehave, so the program should test for NULL and report the problem instead." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp18", eyebrow: "Patt & Patel · Chapter 18", title: "I/O in C",
    intro: `<p>Five parts: the standard library and linking, character I/O and buffering, printf and scanf in detail (with variable argument lists), and file I/O.</p><p>You'll type into a keyboard buffer, watch printf walk its format string, and see why arguments are pushed right to left. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. For scanf questions, write the input stream out character by character (mark spaces and newlines) and move a pointer along it as each conversion consumes characters.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5],
    summary: `
      <h3>Library and streams</h3>
      <p>I/O comes from the standard library (stdio.h); headers declare, the linker supplies code (static or dynamic). stdin/stdout streams. putchar/getchar ≈ OUT/IN. Input is buffered until Enter (which adds '\\n'); output until a newline flushes it.</p>
      <h3>printf and scanf</h3>
      <p>Format string + one argument per spec (%d %x %c %s %f %%; \\n \\t \\\\). printf trusts the specs blindly. scanf takes pointers, skips white space, matches literal text, returns the number of fields read; leftovers stay in the stream. Right-to-left argument pushing puts the format string at R6.</p>
      <h3>Files</h3>
      <p><code>FILE *f = fopen(name, "r"/"w"/"a"/"r+")</code>, check for NULL; fscanf/fprintf; EOF. printf = fprintf(stdout, …).</p>`,
  };
  Course.start(window.CHAPTER);
})();
