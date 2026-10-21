(function () {
  const { S, slider, toggle, readout, el } = Course;
  const { code } = CT;
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const fig = (s) => `<div class="fig">${s}</div>`;

  const COUNTDOWN = `//
//
// Countdown, our first C program
//
// Description: This program prompts the user to type in
// a positive number and counts down from that number to 0,
// displaying each number along the way.
//
//

// The next two lines are preprocessor directives
#include <stdio.h>
#define STOP 0

// Function : main
// Description : prompt for input, then countdown
int main(void)
{
   // Variable declarations
   int counter;    // Holds intermediate count values
   int startPoint; // Starting point for count down

   // Prompt the user for input
   printf("===== Countdown Program =====\\n");
   printf("Enter a positive integer: ");
   scanf("%d", &startPoint);

   // Count down from the input number to 0
   for (counter = startPoint; counter >= STOP; counter--)
      printf("%d\\n", counter);
}`;

  /* ---------- the anatomy of Figure 11.3 ---------- */
  function anatomy(host) {
    const PARTS = [
      ["Comments", [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 15, 16, 19, 23, 28], "Everything after // to the end of the line is for humans. The compiler ignores it. A header says what the file does; each function gets a short description."],
      ["Preprocessor", [12, 13], "Lines starting with # are directives for the preprocessor, which edits the source before the compiler sees it. No semicolons."],
      ["main", [17, 18, 31], "<code>int main(void)</code> starts the function definition; the braces enclose its body. Every C program starts executing at the first statement of main."],
      ["Declarations", [20, 21], "Create two variables, counter and startPoint, to hold integer values. You name the value; the compiler finds it a home in memory."],
      ["Statements", [24, 25, 26, 29, 30], "The actions: print a banner and a prompt, read a number, then a for loop prints each count. Each declaration and statement ends in a semicolon."],
    ];
    const out = el(`<div></div>`);
    const draw = (i) => { out.innerHTML = code(COUNTDOWN, { hl: PARTS[i][1] }) + `<p>${PARTS[i][2]}</p>`; };
    host.append(toggle(PARTS.map((p) => p[0]), draw, 0), out); draw(0);
  }

  /* ---------- run the countdown ---------- */
  function runCountdown(host) {
    let n = 5;
    const out = el(`<div></div>`);
    const draw = () => {
      const lines = ["===== Countdown Program =====", "Enter a positive integer: " + n];
      for (let c = n; c >= 0; c--) lines.push(String(c));
      out.innerHTML = `<pre class="code">${lines.join("\n")}</pre><p class="aside">The loop body ran ${n + 1} time${n ? "s" : ""}: counter took every value from ${n} down to STOP = 0.</p>`;
    };
    host.append(slider({ id: "pp11n", label: "You type", min: 0, max: 12, step: 1, value: n, show: (x) => String(x) }, (x) => { n = x; draw(); }).el, out); draw();
  }

  /* ---------- the stages of Figure 11.2 on the countdown ---------- */
  function stages(host) {
    const ST = [
      ["1. Source", "The file you wrote: comments, directives, code.", code(`#include <stdio.h>
#define STOP 0
int main(void)
{
   ...
   for (counter = startPoint; counter >= STOP; counter--)
      printf("%d\\n", counter);
}`, { nums: false })],
      ["2. Preprocessed", "The preprocessor has pasted in the contents of stdio.h (declarations of printf, scanf, …), replaced every STOP with 0, and dropped the comments. This text goes only from the preprocessor to the compiler; your file is unchanged.", code(`/* … hundreds of lines from stdio.h,
   including a declaration of printf … */
int main(void)
{
   ...
   for (counter = startPoint; counter >= 0; counter--)
      printf("%d\\n", counter);
}`, { nums: false })],
      ["3. Object module", "The compiler parses the code (analysis), records every name in its symbol table, and generates machine code (synthesis). printf isn't in this file, so its call is left as an unresolved reference.", `<div class="tbl"><table style="font-family:var(--mono);font-size:13px"><thead><tr><th>Symbol table</th><th>Kind</th><th>Where</th></tr></thead><tbody><tr><td>main</td><td>function</td><td>defined here</td></tr><tr><td>counter</td><td>int variable</td><td>in main's storage</td></tr><tr><td>startPoint</td><td>int variable</td><td>in main's storage</td></tr><tr><td>printf, scanf</td><td>functions</td><td><b>not here yet</b></td></tr></tbody></table></div>`],
      ["4. Executable image", "The linker joins your object module with the library's object code for printf and scanf, filling in their addresses. The result can be loaded into memory and run.", fig(S.svg(440, 120, S.box(20, 30, 150, 60, "") + S.t(95, 56, "your object") + S.t(95, 76, "module", { cls: "lab" }) + S.box(20, 95, 150, 22, "") + S.t(95, 111, "library: printf, scanf", { cls: "lab" }) + S.arrow(175, 75, 260, 75, "") + S.box(265, 30, 160, 80, "") + S.t(345, 66, "executable") + S.t(345, 86, "image", { cls: "lab" }) + S.t(218, 66, "linker", { cls: "lab" }), { max: 440, label: "The linker combines object modules into an executable image" }))],
    ];
    const out = el(`<div></div>`);
    const draw = (i) => { out.innerHTML = `<p>${ST[i][1]}</p>` + ST[i][2]; };
    host.append(toggle(ST.map((s) => s[0]), draw, 0), out); draw(0);
  }

  /* ---------- one bit pattern, three printouts ---------- */
  function formats(host) {
    const v = 102;
    const F = [["%d", "decimal", String(v)], ["%x", "hexadecimal", v.toString(16)], ["%c", "ASCII character", String.fromCharCode(v)]];
    const out = el(`<div></div>`);
    const draw = (i) => {
      out.innerHTML = `<pre class="code">printf("43 plus 59 is ${F[i][0]}.", 43 + 59);</pre>` +
        readout([["Bits handed to printf", "0000 0000 0110 0110"], ["Format", `<code>${F[i][0]}</code>: print as ${F[i][1]}`], ["Output", `43 plus 59 is ${F[i][2]}.`]]);
    };
    host.append(toggle(F.map((f) => f[0]), draw, 0), out); draw(0);
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Why high-level languages?", mins: 15,
    blurb: "The second half of the book: from LC-3 assembly up to C and C++. Software has grown to millions of lines; high-level languages are how we cope.",
    takeaway: "Second half of the book: high-level programming (variables, control structures, functions, arrays, pointers, recursion, simple data structures) in C, later C++, always connected down to the LC-3; plus a problem-solving method. Not complete coverage: the core subset for ~100-line single-file programs. Software animates devices; sizes grow: a phone app hundreds of thousands of lines, a browser several million, a modern car hundreds of millions (Figure 11.1). Languages exist to raise programmer productivity; code is automatically and unambiguously translated to the ISA (x86, ARM, LC-3). High-level languages (1) manage values for you (name a value; the language allocates storage and moves data), (2) express computation in a human-friendly way (area = 0.5 * base * height; if/else), (3) abstract the hardware: portable code, and operations the ISA lacks (e.g., multiply on the LC-3), (4) enhance maintainability (readable control structures), (5) provide safeguards against bugs (stricter rules checked during translation or execution).",
    steps: [
      { k: "learn", title: "Halfway up", b: [
        `<p>The first half built a computer bottom-up: transistors → gates → memory and datapath → the LC-3 → machine code → assembly. The second half climbs one more level: <b>C</b>, and later <b>C++</b>.</p>`,
        `<p>The rule stays the same: nothing is left mysterious. Every new C idea gets traced down to the LC-3 code that carries it out.</p>`,
        seenPP("The levels of transformation.", "01-welcome-aboard.html", "Chapter 1"),
      ]},
      { k: "learn", title: "Software got big", b: [
        `<div class="tbl"><table><tbody><tr><td>A typical phone app</td><td>hundreds of thousands of lines</td></tr><tr><td>A web browser</td><td>several million</td></tr><tr><td>A modern car (not self-driving)</td><td>hundreds of millions</td></tr></tbody></table></div>`,
        `<p>Nobody writes that in assembly. Languages like C exist for one reason: to make programmers more <b>productive</b>. The code is still translated, automatically and unambiguously, into the machine's ISA.</p>`,
      ]},
      { k: "learn", title: "What a high-level language does for you", b: [
        `<ol><li><b>Manages values.</b> Give a value a name; the language finds it storage and does the loads and stores.</li><li><b>Expresses computation naturally.</b> <code>area = 0.5 * base * height;</code></li><li><b>Abstracts the hardware.</b> The same code runs on different ISAs (portable), and you get operations the ISA lacks, like multiply on the LC-3.</li><li><b>Is easier to maintain.</b> Loops and decisions are visible at a glance.</li><li><b>Guards against bugs.</b> Stricter rules are checked as the program is translated or run.</li></ol>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which benefit is each?", bins: ["Manages values", "Abstracts the hardware", "Guards against bugs"], items: [
          ["You write total = total + price; and never pick a register or address", 0, "The language allocates storage and moves the data."],
          ["You write x * y even though the LC-3 has no multiply instruction", 1, "The language supplies operations the ISA doesn't have."],
          ["The translator stops with an error pointing at the line where you used an undeclared name", 2, "Stricter rules, checked during translation."],
          ["The same source builds for an x86 laptop and an ARM phone", 1, "Portability: no ISA details in the source."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "In your own words: what does a high-level language add on top of assembly language?", model: "It lets me name values without choosing registers or memory locations, write computations and decisions in a form close to how I think about them, use operations the hardware doesn't have, and write code that isn't tied to one ISA. The result is shorter, easier to read and fix, and checked for more mistakes, while a translator still turns it into machine code." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Interpreters and compilers", mins: 15,
    blurb: "Two ways to get a high-level program running: execute it line by line inside another program, or translate the whole thing into machine code first.",
    takeaway: "Hardware executes only machine code, so high-level programs must be translated. Interpretation: an interpreter program reads the high-level program as data and carries out its commands, often one line, command or subroutine at a time (e.g., Python); the interpreter is a virtual machine running the program in an isolated sandbox. Compilation: a compiler analyzes the program as a larger unit (usually a whole file) and translates it into machine code (an executable image) that runs directly on the hardware; compile once, run many times; C and C++ are compiled. The compiler does not run the program (though some optimizers do, to tune it). Both interpreters and compilers are themselves programs. Pros and cons: interpretation makes developing and debugging easier (run a line at a time, inspect intermediate results, change code on the fly) and is more easily portable, but runs slower because the interpreter is doing the work; compilation gives faster code that uses memory more efficiently, so most production software uses compiled languages.",
    steps: [
      { k: "learn", title: "Two strategies", b: [
        `<div class="two"><div class="tile"><h3>Interpretation</h3><p>An <b>interpreter</b> program reads your program as <i>data</i> and carries out each command, usually one line at a time. Your program never runs on the hardware directly; the interpreter is a virtual machine. Python works this way.</p></div><div class="tile"><h3>Compilation</h3><p>A <b>compiler</b> reads the whole file, then translates it into machine code: an <b>executable image</b> that runs directly on the hardware. Compile once, run many times. C and C++ work this way.</p></div></div>`,
        `<p>Both the interpreter and the compiler are themselves just programs.</p>`,
      ]},
      { k: "learn", title: "The trade-off", b: [
        `<div class="two"><div class="tile"><h3>Interpreters win at</h3><p>Developing and debugging: run one line, look at the results, change the code on the fly.</p></div><div class="tile"><h3>Compilers win at</h3><p>Speed and memory: the work happens once, ahead of time, so production software is usually compiled.</p></div></div>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "You compile countdown.c once and then run it 50 times. How many times does the compiler run?", opts: [["Once", true, "Compile once, run the executable image as often as you like."], ["50 times", false, "That would be interpretation."], ["Zero: C is interpreted", false, "C is a compiled language."]] },
        { t: "mcq", q: "Which of these does a compiler produce?", opts: [["An executable image of machine code", true, "Ready to load and run."], ["The program's output", false, "The compiler translates; it doesn't run the program."], ["A Python script", false, "No."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What's the key difference between how an interpreter and a compiler get a program to run?", model: "An interpreter is a program that reads the high-level program as input and carries out its commands itself, usually line by line, every time the program runs. A compiler translates the whole program ahead of time into machine code that the hardware then executes directly, so the translation happens once." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "C and C++", mins: 10,
    blurb: "Where C and C++ came from, why they are still everywhere, and how this book will use them.",
    takeaway: "C: early 1970s, Dennis Ritchie, Bell Labs, for the Unix operating system: powerful yet compact enough for a small compiler on small-memory machines to produce small, efficient code; still among the top languages ~50 years later. C++: from 1979, Bjarne Stroustrup (Bell Labs) added classes (and later templates) for organizing large programs; uses C's types, syntax and constructs, so it is as efficient as C. C → programs of hundreds of thousands of lines; C++ → hundreds of millions. The book: C in Chapters 11–19, core C++ in Chapter 20; the common core for programs of hundreds of lines in one file. ANSI C (latest standard 2018: C18), ISO/Standard C++. Examples are coupled with LC-3 code from a hypothetical LC-3 C compiler (your real compiler targets x86 or ARM). Incomplete examples are called code segments.",
    steps: [
      { k: "learn", title: "A little history", b: [
        `<div class="two"><div class="tile"><h3>C (early 1970s)</h3><p>Dennis Ritchie at Bell Labs, to write the <b>Unix</b> operating system. Machines had tiny memories, so it had to be compact enough for a small compiler to make small, fast code. Still a top language 50 years on.</p></div><div class="tile"><h3>C++ (1979 on)</h3><p>Bjarne Stroustrup, also at Bell Labs, added <b>classes</b> (later templates) to organize big programs. It keeps C's types and syntax, so it's just as efficient.</p></div></div>`,
      ]},
      { k: "learn", title: "How this book uses them", b: [
        `<ul><li>C in Chapters 11–19, core C++ in Chapter 20.</li><li>The common core of the language: enough for programs of a few hundred lines in a single file.</li><li>Standard <b>ANSI C</b> (the 2018 version, <b>C18</b>) and ISO C++, so the code is portable.</li><li>New ideas are shown as <b>LC-3 code from a hypothetical LC-3 C compiler</b>. Your real compiler makes x86 or ARM code, but the ideas carry over.</li><li>Incomplete examples are called <b>code segments</b>.</li></ul>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why is C++ as efficient as C?", opts: [["It uses C's basic types, syntax and constructs, adding features on top", true, "Classes and templates help organize code; the core compiles the same way."], ["It is interpreted", false, "C++ is compiled."], ["It has no classes", false, "Classes are exactly what it added."]] },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "The compilation process", mins: 20,
    blurb: "Preprocessor, compiler, linker: follow the countdown program through each stage of Figure 11.2.",
    takeaway: "C and C++ are compiled into an executable image (Section 7.4.1): machine code ready to load and run. 'Compilation' covers three components (Figure 11.2). Preprocessor: scans the source for directives starting with # (like pseudo-ops), e.g., substitute <code>DAYS_THIS_MONTH</code> with 30, insert the contents of stdio.h. Compiler: turns the preprocessed program into an object module (machine code for one section of the program, Section 7.4.2) in two phases: analysis (parse into parts, build an internal representation) and synthesis (generate machine code, optionally optimized); subphases such as parsing, register allocation, instruction scheduling; some compilers emit assembly and use an assembler. Its key bookkeeping is the symbol table of all names used, like the LC-3 assembler's. Linker: links all object modules (yours plus library routines like I/O) into the executable image, which the OS loads when you launch the app. Development: a text editor plus a command-line compiler suffices for small programs; an IDE combines editor, compiler and debugger for faster edit–compile–debug cycles.",
    steps: [
      { k: "learn", title: "Three stages, one name", b: [
        `<p>“Compiling” a C program really runs three programs in a row:</p>`,
        `<p class="eq">source → <b>preprocessor</b> → <b>compiler</b> → object module → <b>linker</b> → executable image</p>`,
        `<p>Predict before you step through: the countdown uses <code>printf</code> but never defines it. Which stage do you think supplies its code?</p>`,
      ]},
      { k: "play", title: "Follow the countdown", b: [
        stages,
        `<p>The compiler works in two phases: <b>analysis</b> (parse the program into its parts) and <b>synthesis</b> (generate machine code, optionally optimized). Some compilers write assembly and let an assembler finish the job.</p>`,
        seenPP("The assembler's symbol table, object files and linking.", "07-assembly.html", "Chapter 7"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Which stage does each job?", bins: ["Preprocessor", "Compiler", "Linker"], items: [
          ["Replaces every <code>MAX_LENGTH</code> with 80", 0, "A #define substitution, done before compilation."],
          ["Keeps a symbol table of every variable and function name", 1, "Its main bookkeeping, like the LC-3 assembler's."],
          ["Finds the machine code for scanf in the library", 2, "Combining object modules is the linker's job."],
          ["Chooses which register holds a value", 1, "Register allocation is part of synthesis."],
        ]},
      ]},
      { k: "learn", title: "Where you'll write code", b: [
        `<p>For short programs: any text editor plus a compiler run from the command line. For real projects: an <b>IDE</b>, which puts editor, compiler and debugger in one tool so the edit–compile–debug loop is fast.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does a C program that calls printf need a linker?", model: "The compiler only translates my file, and printf's code isn't in it, so the object module just has an unresolved reference to printf. The linker finds the already-compiled printf in the C library and combines it with my object module, filling in the address, to make an executable image that can actually run." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "A first C program", mins: 20,
    blurb: "Figure 11.3, piece by piece: comments, preprocessor directives, the function main, declarations and statements.",
    takeaway: "Figure 11.3 prompts for a positive number and counts down to 0. main (int main(void), lines 17–31) is a function definition; functions are C's subroutines (Chapter 14). Execution of every C program starts at main; ANSI C requires main to return an int. Its body: variable declarations (int counter; int startPoint;) that name values instead of registers or addresses, then statements, executed in order to the end of main: two printfs, a scanf, and a for loop (Chapter 13) printing from startPoint down to 0 (input 5 → 5 4 3 2 1 0). Semicolons terminate declarations and statements so the compiler can parse unambiguously.",
    steps: [
      { k: "play", title: "Take it apart", b: [
        `<p>Click each piece to see which lines it covers.</p>`,
        anatomy,
      ]},
      { k: "learn", title: "main and its body", b: [
        `<p><code>main</code> is a <b>function</b>: C's word for a subroutine (all of Chapter 14). Every complete C program has exactly one main, and execution <b>always starts there</b>. ANSI C says main returns an <code>int</code>, hence <code>int main(void)</code>.</p>`,
        `<p>Inside: first the <b>declarations</b> (create named variables), then the <b>statements</b> (the actions), run one after another until main ends. Declarations and statements end with <b>semicolons</b>, which is how the compiler knows where each one stops.</p>`,
      ]},
      { k: "play", title: "Run it", b: [
        `<p>Predict: if you type 3, how many numbers get printed?</p>`,
        runCountdown,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "If you change #define STOP 0 to #define STOP 2 and type 6, how many numbers does the countdown print?", a: 5, tol: 0, why: "6, 5, 4, 3, 2: the loop runs while counter >= 2." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Where does a C program begin executing, and what are the two kinds of things inside main in this example?", model: "It always begins at the first statement of the function main. Inside main there are declarations, which create named variables like counter and startPoint, followed by statements, the actions carried out in order, such as the printf calls, the scanf and the for loop." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Style, comments and the preprocessor", mins: 15,
    blurb: "Free-format code, comments that help, #define for named constants, and #include for header files.",
    takeaway: "C is free-format: whitespace between words and lines doesn't change meaning; use indentation and blank lines to show structure (the loop body indented; regions separated). Styles vary; aim to convey meaning. Comments: // to end of line (same in C++). Good practice: a file header (what it contains, last modified, by whom), a description of each function with its inputs and outputs, comments on the intent of code sections; avoid comments that only restate the obvious. Preprocessor (only #define and #include are used in the book): #define X Y substitutes the text Y for every X (STOP → 0), used for fixed values (<code>NUMBER_OF_STUDENTS</code> 25, <code>MAX_LENGTH</code> 80, <code>PRICE_OF_FUEL</code> 1.49) so one line changes them everywhere; it can substitute any text (<code>COLOR_OF_EYES</code> brown); names conventionally uppercase. #include inserts another file at that point: #include &lt;stdio.h&gt; (C's I/O header, needed by all programs doing I/O) uses angle brackets for a predefined system directory; #include \"program.h\" uses quotes for the source file's directory or another known one; header files hold #defines and declarations shared among source files. Directives are not C statements, so no semicolons.",
    steps: [
      { k: "learn", title: "Free format, so format for people", b: [
        `<p>C ignores extra spaces, tabs and line breaks. That freedom is for <b>readability</b>: indent the body of a loop, separate regions with blank lines.</p>`,
        `<p>Good comments: a header for the file (what, when, who), a description of each function and its inputs and outputs, and notes on the <i>intent</i> of each section. Bad comments repeat what the code already says:</p>`,
        `<pre class="code">counter = counter + 1;  <span class="cm">// add 1 to counter   ← tells you nothing</span></pre>`,
      ]},
      { k: "learn", title: "#define: named constants", b: [
        `<p><code>#define X Y</code> tells the preprocessor: replace every X with the text Y before compiling.</p>`,
        `<pre class="code">#define MAX_LENGTH     80
#define PRICE_OF_FUEL  1.49</pre>`,
        `<p>If the price changes, you edit one line, not every place it was used. By convention the names are UPPERCASE. It's pure text substitution: <code>#define COLOR_OF_EYES brown</code> is legal too.</p>`,
      ]},
      { k: "check", title: "Spot the mistake", b: [
        { t: "mcq", q: "A program has <code>#define PRICE_OF_FUEL 1.49</code>. Later, a line says <code>PRICE_OF_FUEL = 1.59;</code> and the compiler rejects it. Why?", opts: [["After substitution the line reads 1.49 = 1.59; and you can't assign to a number", true, "#define is text replacement before compiling. The name is not a variable, so it can't be changed while the program runs. Edit the #define line instead."], ["#define names must be lowercase", false, "Uppercase is the convention."], ["1.59 has too many digits", false, "Not the issue."]] },
      ]},
      { k: "learn", title: "#include: paste in a file", b: [
        `<p><code>#include</code> replaces itself with the entire contents of another file. Header files (<code>.h</code>) hold #defines and declarations that several source files share.</p>`,
        `<div class="two"><div class="tile"><h3>&lt;stdio.h&gt;</h3><p>Angle brackets: look in the <b>system</b> directory. stdio.h is C's standard I/O header; every program that uses printf or scanf includes it.</p></div><div class="tile"><h3>"program.h"</h3><p>Quotes: look in <b>your</b> source file's directory (or another one the compiler knows about). For headers you write yourself.</p></div></div>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is it better to write <code>#define MAX_LENGTH 80</code> than to type 80 everywhere?", model: "The name says what the number means, which makes the code easier to read, and if the limit ever changes I edit one line and the preprocessor updates every use. With bare 80s scattered around, I'd have to find each one and might change an unrelated 80 by mistake." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "printf and scanf", mins: 20,
    blurb: "C's formatted output and input: format strings, %d %x %c, \\n, and the & that scanf needs.",
    takeaway: "C does I/O with library functions, like the LC-3's IN and OUT traps (details in Chapter 18). printf (print formatted) writes to standard output (the display). Its format string holds text plus format specifications, which start with %: %d decimal, %x hexadecimal, %c ASCII character (also %f floating point). printf(\"%d is a prime number.\", 43); prints 43 is a prime number. The same bit pattern prints differently: 43 + 59 = 102 = 0110 0110 → %d 102, %x 66, %c f. printf converts the bits into ASCII characters. Values can be program variables (windSpeed). Line breaks must be explicit: \\n (backslash sequences for newline, tab, etc.). Any number of values per printf, but the number of format specifications must equal the number of values. scanf reads from standard input (the keyboard) with a format string and a list of variables to receive the converted values: %d expects ASCII digit keystrokes and converts them to an integer (automatic ASCII-to-integer conversion); also specs for a character, a floating-point value, a hex integer. Variables modified by scanf must be preceded by & (explained with pointers in Chapter 16): scanf(\"%c\", &nextChar); scanf(\"%f\", &radius); scanf(\"%d %d\", &length, &width);",
    steps: [
      { k: "learn", title: "printf", b: [
        `<p><code>printf</code> prints to the display, like the LC-3's OUT and PUTS traps but much more capable. Its first argument is a <b>format string</b>: ordinary text plus <b>format specifications</b> starting with <code>%</code>, each replaced by one of the values that follow.</p>`,
        `<pre class="code">printf("The wind speed is %d km/hr.\\n", windSpeed);</pre>`,
        `<p>With windSpeed = 2 that prints <code>The wind speed is 2 km/hr.</code> and then a new line. Nothing breaks the line unless you write <code>\\n</code>.</p>`,
        seenPP("The TRAP routines for keyboard input and display output.", "09-io.html", "Chapter 9"),
      ]},
      { k: "play", title: "Same bits, three printouts", b: [
        `<p>The book's example: 43 + 59. Before clicking, predict what <code>%x</code> and <code>%c</code> will show.</p>`,
        formats,
        `<p>The value handed to printf is identical every time. The format spec only decides <b>how to turn those bits into characters</b> on the screen.</p>`,
        seenPP("ASCII codes and hexadecimal.", "02-bits-data-types.html", "Chapter 2"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "What does <code>printf(\"%x\", 255);</code> print?", opts: [["ff", true, "255 = x00FF."], ["255", false, "That's %d."], ["0xff", false, "%x prints just the hex digits."]] },
        { t: "mcq", q: "<code>printf(\"%d + %d = %d\\n\", a, b);</code> What's wrong?", opts: [["Three format specifications but only two values", true, "The counts must match."], ["You can't print + signs", false, "Text in the format string prints as-is."], ["Nothing", false, "Look at the counts."]] },
      ]},
      { k: "learn", title: "scanf", b: [
        `<p><code>scanf</code> reads from the keyboard. Its format string says what to expect, and it converts the keystrokes for you: with <code>%d</code> it expects ASCII digits and stores the <b>integer</b> they spell. No more subtracting x30 by hand.</p>`,
        `<pre class="code">scanf("%d", &startPoint);         <span class="cm">// one integer</span>
scanf("%f", &radius);             <span class="cm">// a floating-point number</span>
scanf("%d %d", &length, &width);  <span class="cm">// two integers</span></pre>`,
        `<p>Every variable scanf fills in needs an <b>&amp;</b> in front. Why will make sense with pointers (Chapter 16).</p>`,
        seenPP("Converting typed ASCII digits to a binary integer by hand.", "10-calculator.html", "Chapter 10"),
      ]},
      { k: "check", title: "Spot the mistake", b: [
        { t: "mcq", q: "<code>scanf(\"%d\", startPoint);</code> compiles, but the program misbehaves. What's missing?", opts: [["The & before startPoint", true, "scanf has to be told where startPoint lives, which is what & provides."], ["A \\n in the format string", false, "That's about output."], ["A semicolon", false, "It has one."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a format specification like %d or %c tell printf to do?", model: "It marks the place in the output where the next value goes and says how to turn that value's bits into characters: %d writes it as a decimal number, %x as hexadecimal digits, %c as the ASCII character with that code. The value itself is the same; only its printed form changes." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp11", eyebrow: "Patt & Patel · Chapter 11", title: "Introduction to C/C++ Programming",
    intro: `<p>Seven parts: why high-level languages exist, interpreters vs compilers, where C and C++ came from, the preprocessor–compiler–linker pipeline, and a first C program, down to its printf and scanf.</p><p>This chapter is about orientation. You'll take Figure 11.3 apart, run it, and follow it through the compiler. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. For the printf questions, work out the bit pattern of each value first, then apply the format spec; for the compilation questions, sketch Figure 11.2 and label each arrow.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7],
    summary: `
      <h3>High-level languages</h3>
      <p>Manage values, express computation naturally, abstract the hardware (portability, extra operations), maintainability, safeguards. Translated by interpretation (line by line, easy debugging, slower) or compilation (whole program → executable image, faster).</p>
      <h3>C and C++</h3>
      <p>C: Ritchie, Bell Labs, early 1970s, Unix. C++: Stroustrup, 1979, classes. ANSI C18, ISO C++. Compilation = preprocessor (#directives) → compiler (analysis, synthesis, symbol table) → object module → linker (+ libraries) → executable image.</p>
      <h3>A first program</h3>
      <p>Execution starts at <code>int main(void)</code>: declarations, then statements, each ending in <code>;</code>. Comments <code>//</code>. <code>#define NAME text</code>, <code>#include &lt;stdio.h&gt;</code> / <code>"mine.h"</code>, no semicolons. <code>printf</code> format specs <code>%d %x %c %f</code>, <code>\\n</code>; <code>scanf("%d", &amp;x)</code>.</p>`,
  };
  Course.start(window.CHAPTER);
})();
