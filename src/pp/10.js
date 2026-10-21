(function () {
  const { S, slider, toggle, el } = Course;
  const { sim, assemble, h4 } = LC3;
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const pre = (t) => `<pre class="code">${t.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`;
  const field = 'font:inherit;font-family:var(--mono);padding:6px 8px;border-radius:8px;border:1px solid var(--line);background:var(--paper);color:var(--ink)';

  /* The complete calculator: Figures 10.15, 10.16, 10.4, 10.5, 10.8, 10.10, 10.12, 10.13, 10.17–10.20 */
  const CALC = `        .ORIG x3000
; The Calculator, Main Algorithm (Figure 10.15)
        LEA  R6,StackBase ; initialize the stack pointer
        ADD  R6,R6,#1     ; R6 = StackBase + 1 --> empty stack
NewCommand LEA R0,PromptMsg
        PUTS
        GETC
        OUT
TestX   LD   R1,NegX      ; check for X
        ADD  R1,R1,R0
        BRnp TestC
        HALT
TestC   LD   R1,NegC      ; check for C
        ADD  R1,R1,R0
        BRnp TestAdd
        JSR  OpClear
        BRnzp NewCommand
TestAdd LD   R1,NegPlus   ; check for +
        ADD  R1,R1,R0
        BRnp TestMult
        JSR  OpAdd
        BRnzp NewCommand
TestMult LD  R1,NegMult   ; check for *
        ADD  R1,R1,R0
        BRnp TestMinus
        JSR  OpMult
        BRnzp NewCommand
TestMinus LD R1,NegMinus  ; check for -
        ADD  R1,R1,R0
        BRnp TestD
        JSR  OpNeg
        BRnzp NewCommand
TestD   LD   R1,NegD      ; check for D
        ADD  R1,R1,R0
        BRnp EnterNumber
        JSR  OpDisplay
        BRnzp NewCommand
EnterNumber JSR PushValue ; then we must be entering an integer
        BRnzp NewCommand
PromptMsg .FILL x000A
        .STRINGZ "Enter a command:"
NegX    .FILL xFFA8
NegC    .FILL xFFBD
NegPlus .FILL xFFD5
NegMinus .FILL xFFD3
NegMult .FILL xFFD6
NegD    .FILL xFFBC
; Globals
StackMax .BLKW #9
StackBase .BLKW #1
ASCIIBUFF .BLKW #4
        .FILL x0000       ; ASCIIBUFF sentinel
;
; PushValue (Figure 10.16)
PushValue ST R0,PushValue_Save0
        ST   R1,PushValue_Save1
        ST   R2,PushValue_Save2
        ST   R7,PushValue_Save7
        LD   R1,PushValue_ASCIIBUFF ; R1 points to string being
        LD   R2,MaxDigits ; generated
ValueLoop ADD R3,R0,x-0A  ; test for line feed, x0A
        BRz  GoodInput
        ADD  R2,R2,#0
        BRz  TooLargeInput
        LD   R3,NegASCII0
        ADD  R3,R0,R3
        BRn  NotInteger
        LD   R3,NegASCII9
        ADD  R3,R0,R3
        BRp  NotInteger
        ADD  R2,R2,#-1    ; still room for more digits
        STR  R0,R1,#0     ; store last character read
        ADD  R1,R1,#1
        GETC
        OUT               ; echo it
        BRnzp ValueLoop
GoodInput LD R2,PushValue_ASCIIBUFF
        NOT  R2,R2
        ADD  R2,R2,#1
        ADD  R1,R1,R2     ; R1 now contains no. of char.
        BRz  NoDigit
        JSR  ASCIItoBinary
        JSR  PUSH
        BRnzp PushValue_Done
NoDigit LEA  R0,NoDigitMsg
        PUTS
        BRnzp PushValue_Done
NotInteger GETC           ; spin until carriage return
        OUT
        ADD  R3,R0,x-0A   ; test for line feed, x0A
        BRnp NotInteger
        LEA  R0,NotIntegerMsg
        PUTS
        BRnzp PushValue_Done
TooLargeInput GETC        ; spin until carriage return
        OUT
        ADD  R3,R0,x-0A   ; test for line feed, x0A
        BRnp TooLargeInput
        LEA  R0,TooManyDigits
        PUTS
PushValue_Done LD R0,PushValue_Save0
        LD   R1,PushValue_Save1
        LD   R2,PushValue_Save2
        LD   R7,PushValue_Save7
        RET
TooManyDigits .FILL x000A
        .STRINGZ "Too many digits"
NoDigitMsg .FILL x000A
        .STRINGZ "No number entered"
NotIntegerMsg .FILL x000A
        .STRINGZ "Not an integer"
MaxDigits .FILL x0003
NegASCII0 .FILL x-30
NegASCII9 .FILL x-39
PushValue_ASCIIBUFF .FILL ASCIIBUFF
PushValue_Save0 .BLKW #1
PushValue_Save1 .BLKW #1
PushValue_Save2 .BLKW #1
PushValue_Save7 .BLKW #1
;
; ASCIItoBinary (Figure 10.4)
ASCIItoBinary ST R1,AtoB_Save1
        ST   R2,AtoB_Save2
        ST   R3,AtoB_Save3
        ST   R4,AtoB_Save4
        AND  R0,R0,#0     ; R0 will be used for our result
        ADD  R1,R1,#0     ; test number of digits
        BRz  AtoB_Done    ; there are no digits, result is 0
        LD   R2,AtoB_ASCIIBUFF ; R2 points to ASCIIBUFF
        ADD  R2,R2,R1
        ADD  R2,R2,#-1    ; R2 now points to "ones" digit
        LDR  R4,R2,#0     ; R4 <-- "ones" digit
        AND  R4,R4,x000F  ; strip off the ASCII template
        ADD  R0,R0,R4     ; add ones contribution
        ADD  R1,R1,#-1
        BRz  AtoB_Done    ; the original number had one digit
        ADD  R2,R2,#-1    ; R2 now points to "tens" digit
        LDR  R4,R2,#0     ; R4 <-- "tens" digit
        AND  R4,R4,x000F  ; strip off ASCII template
        LEA  R3,LookUp10  ; LookUp10 is BASE of tens values
        ADD  R3,R3,R4     ; R3 points to the right tens value
        LDR  R4,R3,#0
        ADD  R0,R0,R4     ; add tens contribution to total
        ADD  R1,R1,#-1
        BRz  AtoB_Done    ; the original number had two digits
        ADD  R2,R2,#-1    ; R2 now points to "hundreds" digit
        LDR  R4,R2,#0     ; R4 <-- "hundreds" digit
        AND  R4,R4,x000F  ; strip off ASCII template
        LEA  R3,LookUp100 ; LookUp100 is hundreds BASE
        ADD  R3,R3,R4     ; R3 points to hundreds value
        LDR  R4,R3,#0
        ADD  R0,R0,R4     ; add hundreds contribution to total
AtoB_Done LD R1,AtoB_Save1
        LD   R2,AtoB_Save2
        LD   R3,AtoB_Save3
        LD   R4,AtoB_Save4
        RET
AtoB_ASCIIBUFF .FILL ASCIIBUFF
AtoB_Save1 .BLKW #1
AtoB_Save2 .BLKW #1
AtoB_Save3 .BLKW #1
AtoB_Save4 .BLKW #1
LookUp10 .FILL #0
        .FILL #10
        .FILL #20
        .FILL #30
        .FILL #40
        .FILL #50
        .FILL #60
        .FILL #70
        .FILL #80
        .FILL #90
LookUp100 .FILL #0
        .FILL #100
        .FILL #200
        .FILL #300
        .FILL #400
        .FILL #500
        .FILL #600
        .FILL #700
        .FILL #800
        .FILL #900
;
; BinarytoASCII (Figure 10.5)
BinarytoASCII ST R0,BtoA_Save0
        ST   R1,BtoA_Save1
        ST   R2,BtoA_Save2
        ST   R3,BtoA_Save3
        LD   R1,BtoA_ASCIIBUFF ; R1 keeps track of output string
        ADD  R0,R0,#0     ; R0 contains the binary value
        BRn  NegSign
        LD   R2,ASCIIplus ; first store the ASCII plus sign
        STR  R2,R1,#0
        BRnzp Begin100
NegSign LD   R2,ASCIIminus ; first store ASCII minus sign
        STR  R2,R1,#0
        NOT  R0,R0        ; convert the number to absolute
        ADD  R0,R0,#1     ; value; it is easier to work with
Begin100 LD  R2,ASCIIoffset ; prepare for "hundreds" digit
        LD   R3,Neg100    ; determine the hundreds digit
Loop100 ADD  R0,R0,R3
        BRn  End100
        ADD  R2,R2,#1
        BRnzp Loop100
End100  STR  R2,R1,#1     ; store ASCII code for hundreds digit
        LD   R3,Pos100
        ADD  R0,R0,R3     ; correct R0 for one-too-many subtracts
        LD   R2,ASCIIoffset ; prepare for "tens" digit
Loop10  ADD  R0,R0,#-10   ; determine the tens digit
        BRn  End10
        ADD  R2,R2,#1
        BRnzp Loop10
End10   STR  R2,R1,#2     ; store ASCII code for tens digit
        ADD  R0,R0,#10    ; correct R0 for one-too-many subtracts
Begin1  LD   R2,ASCIIoffset ; prepare for "ones" digit
        ADD  R2,R2,R0
        STR  R2,R1,#3
        LD   R0,BtoA_Save0
        LD   R1,BtoA_Save1
        LD   R2,BtoA_Save2
        LD   R3,BtoA_Save3
        RET
ASCIIplus .FILL x002B
ASCIIminus .FILL x002D
ASCIIoffset .FILL x0030
Neg100  .FILL #-100
Pos100  .FILL #100
BtoA_Save0 .BLKW #1
BtoA_Save1 .BLKW #1
BtoA_Save2 .BLKW #1
BtoA_Save3 .BLKW #1
BtoA_ASCIIBUFF .FILL ASCIIBUFF
;
; OpAdd (Figure 10.8)
OpAdd   ST   R0,OpAdd_Save0
        ST   R1,OpAdd_Save1
        ST   R5,OpAdd_Save5
        ST   R7,OpAdd_Save7
        JSR  POP          ; get first source operand
        ADD  R5,R5,#0     ; test if POP was successful
        BRp  OpAdd_Exit   ; branch if not successful
        ADD  R1,R0,#0     ; make room for second operand
        JSR  POP          ; get second source operand
        ADD  R5,R5,#0     ; test if POP was successful
        BRp  OpAdd_Restore1 ; not successful, put back first
        ADD  R0,R0,R1     ; THE Add
        JSR  RangeCheck   ; check size of result
        ADD  R5,R5,#0     ; check R5 for success/failure
        BRp  OpAdd_Restore2 ; out of range, restore both
        JSR  PUSH         ; push sum on the stack
        BRnzp OpAdd_Exit  ; on to the next task...
OpAdd_Restore2 ADD R6,R6,#-1 ; decrement stack pointer
OpAdd_Restore1 ADD R6,R6,#-1 ; decrement stack pointer
OpAdd_Exit LD R0,OpAdd_Save0
        LD   R1,OpAdd_Save1
        LD   R5,OpAdd_Save5
        LD   R7,OpAdd_Save7
        RET
OpAdd_Save0 .BLKW #1
OpAdd_Save1 .BLKW #1
OpAdd_Save5 .BLKW #1
OpAdd_Save7 .BLKW #1
;
; RangeCheck (Figure 10.10)
RangeCheck LD R5,Neg999
        ADD  R5,R0,R5     ; recall that R0 contains the
        BRp  BadRange     ; result being checked
        LD   R5,Pos999
        ADD  R5,R0,R5
        BRn  BadRange
        AND  R5,R5,#0     ; R5 <-- success
        RET
BadRange ST  R0,RangeCheck_Save0
        LEA  R0,RangeErrorMsg
        TRAP x22          ; output character string
        AND  R5,R5,#0
        ADD  R5,R5,#1     ; R5 <-- failure
        LD   R0,RangeCheck_Save0
        RET
Neg999  .FILL #-999
Pos999  .FILL #999
RangeErrorMsg .FILL x000A
        .STRINGZ "Error: Number is out of range."
RangeCheck_Save0 .BLKW #1
;
; OpMult (Figure 10.12)
OpMult  ST   R0,OpMult_Save0
        ST   R1,OpMult_Save1
        ST   R2,OpMult_Save2
        ST   R3,OpMult_Save3
        ST   R5,OpMult_Save5
        ST   R7,OpMult_Save7
        AND  R3,R3,#0     ; R3 holds sign of multiplier
        JSR  POP          ; get first source from stack
        ADD  R5,R5,#0     ; test for successful POP
        BRp  OpMult_Exit  ; failure
        ADD  R1,R0,#0     ; make room for next POP
        JSR  POP          ; get second source operand
        ADD  R5,R5,#0     ; test for successful POP
        BRp  OpMult_Restore1 ; failure; restore first POP
        ADD  R2,R0,#0     ; moves multiplier, tests sign
        BRzp PosMultiplier
        ADD  R3,R3,#1     ; sets FLAG: multiplier is neg
        NOT  R2,R2
        ADD  R2,R2,#1     ; R2 contains -(multiplier)
PosMultiplier AND R0,R0,#0 ; clear product register
        ADD  R2,R2,#0
        BRz  PushMult     ; multiplier = 0, done
MultLoop ADD R0,R0,R1     ; THE actual "multiply"
        ADD  R2,R2,#-1    ; iteration control
        BRp  MultLoop
        JSR  RangeCheck
        ADD  R5,R5,#0     ; R5 contains success/failure
        BRp  OpMult_Restore2
        ADD  R3,R3,#0     ; test for negative multiplier
        BRz  PushMult
        NOT  R0,R0        ; adjust for
        ADD  R0,R0,#1     ; sign of result
PushMult JSR PUSH         ; push product on the stack
        BRnzp OpMult_Exit
OpMult_Restore2 ADD R6,R6,#-1 ; adjust stack pointer
OpMult_Restore1 ADD R6,R6,#-1 ; adjust stack pointer
OpMult_Exit LD R0,OpMult_Save0
        LD   R1,OpMult_Save1
        LD   R2,OpMult_Save2
        LD   R3,OpMult_Save3
        LD   R5,OpMult_Save5
        LD   R7,OpMult_Save7
        RET
OpMult_Save0 .BLKW #1
OpMult_Save1 .BLKW #1
OpMult_Save2 .BLKW #1
OpMult_Save3 .BLKW #1
OpMult_Save5 .BLKW #1
OpMult_Save7 .BLKW #1
;
; OpNeg (Figure 10.13)
OpNeg   ST   R0,OpNeg_Save0
        ST   R5,OpNeg_Save5
        ST   R7,OpNeg_Save7
        JSR  POP          ; get the source operand
        ADD  R5,R5,#0     ; test for successful pop
        BRp  OpNeg_Exit   ; branch if failure
        NOT  R0,R0
        ADD  R0,R0,#1     ; form the negative of source
        JSR  PUSH         ; push result onto the stack
OpNeg_Exit LD R0,OpNeg_Save0
        LD   R5,OpNeg_Save5
        LD   R7,OpNeg_Save7
        RET
OpNeg_Save0 .BLKW #1
OpNeg_Save5 .BLKW #1
OpNeg_Save7 .BLKW #1
;
; POP (Figure 10.17)
POP     LD   R0,POP_StackBase
        NOT  R0,R0        ; R0 = -(addr. of StackBase + 1)
        ADD  R0,R0,R6     ; R6 = StackPointer
        BRz  Underflow
        LDR  R0,R6,#0     ; the actual POP
        ADD  R6,R6,#1     ; adjust StackPointer
        AND  R5,R5,#0     ; R5 <-- success
        RET
Underflow LEA R0,UnderflowMsg
        PUTS              ; print error message
        AND  R5,R5,#0
        ADD  R5,R5,#1     ; R5 <-- failure
        RET
UnderflowMsg .FILL x000A
        .STRINGZ "Error: Too Few Values on the Stack."
POP_StackBase .FILL StackBase
;
; PUSH (Figure 10.18)
PUSH    ST   R1,PUSH_Save1 ; R1 is needed by this routine
        LD   R1,PUSH_StackMax
        NOT  R1,R1
        ADD  R1,R1,#1     ; R1 = - addr. of StackMax
        ADD  R1,R1,R6     ; R6 = StackPointer
        BRz  Overflow
        ADD  R6,R6,#-1    ; adjust StackPointer for PUSH
        STR  R0,R6,#0     ; the actual PUSH
        LD   R1,PUSH_Save1 ; restore R1
        AND  R5,R5,#0     ; R5 <-- success
        RET
Overflow LEA R0,OverflowMsg
        PUTS
        LD   R1,PUSH_Save1 ; restore R1
        AND  R5,R5,#0
        ADD  R5,R5,#1     ; R5 <-- failure
        RET
PUSH_Save1 .BLKW #1
OverflowMsg .FILL x000A
        .STRINGZ "Error: Stack is Full."
PUSH_StackMax .FILL StackMax
;
; OpDisplay (Figure 10.19)
OpDisplay ST R0,OpDisplay_Save0
        ST   R5,OpDisplay_Save5
        ST   R7,OpDisplay_Save7
        JSR  POP          ; R0 gets the value to be displayed
        ADD  R5,R5,#0
        BRp  OpDisplay_DONE ; POP failed, nothing on the stack
        JSR  BinarytoASCII
        LD   R0,NewlineChar
        OUT
        LD   R0,OpDisplay_ASCIIBUFF
        PUTS
        ADD  R6,R6,#-1    ; push displayed number back on stack
OpDisplay_DONE LD R0,OpDisplay_Save0
        LD   R5,OpDisplay_Save5
        LD   R7,OpDisplay_Save7
        RET
NewlineChar .FILL x000A
OpDisplay_ASCIIBUFF .FILL ASCIIBUFF
OpDisplay_Save0 .BLKW #1
OpDisplay_Save5 .BLKW #1
OpDisplay_Save7 .BLKW #1
;
; OpClear (Figure 10.20)
OpClear LD   R6,OpClear_StackBase ; initialize the stack pointer
        ADD  R6,R6,#1     ; R6 = StackBase + 1 --> empty stack
        RET
OpClear_StackBase .FILL StackBase
        .END`;
  const CIMG = assemble(CALC);
  const SB = CIMG.sym.STACKBASE, AB = CIMG.sym.ASCIIBUFF;
  // the driver programs below reuse one subroutine each, cut out of the full listing
  const cut = (from, to) => { const L = CALC.split("\n"), a = L.findIndex((l) => l.startsWith(from)), b = L.findIndex((l, i) => i > a && l.startsWith(to)); return L.slice(a, b).join("\n"); };

  /* =============== PART 1 =============== */
  const BOGUS = `        .ORIG x3000
        TRAP x23          ; input from the keyboard
        ADD  R1,R0,#0     ; make room for another input
        TRAP x23          ; input another character
        ADD  R0,R1,R0     ; add the two inputs
        TRAP x21          ; display result on the monitor
        TRAP x25          ; halt
        .END`;
  const p1 = {
    id: "p1", title: "Two data types: why 2 + 3 = e", mins: 15,
    blurb: "The keyboard and monitor speak ASCII. The ALU speaks 2's complement. Mix them up and 2 + 3 prints 'e'.",
    takeaway: "Chapter 10 pulls together everything so far in one well-documented program: a calculator simulator (a main program and eleven subroutines) that adds, subtracts and multiplies 2's complement integers, typed on the keyboard and shown on the monitor. Two new ideas are needed: converting integers between ASCII strings and 2's complement, and doing arithmetic with a stack. Every instruction must get operands of the data type it needs (an ALU ADD needs 2's complement; floating point would give garbage); compilers insert conversions like int → float in A = R + I. Chapter 5's count program could add x30 only because the count was a single digit (6 = x06, '6' = x36). 25 typed = x32 x35 = 0011001000110101, but 25 as an integer is 0000000000011001. Figure 10.1 (a bogus program): TRAP x23 twice, ADD, TRAP x21: '2' (x0032) + '3' (x0033) = x0065, which prints 'e', because it neither converted the inputs from ASCII nor converted the sum back.",
    steps: [
      { k: "learn", title: "Two representations", b: [
        `<div class="two"><div class="tile"><h3>For I/O</h3><p>ASCII codes: the key <b>2</b> arrives as <span class="mono">x0032</span>.</p></div><div class="tile"><h3>For arithmetic</h3><p>2's complement: the number 2 is <span class="mono">x0002</span>.</p></div></div>`,
        `<p>Each instruction needs operands in the data type it expects. Typed “25” is <span class="mono">x32 x35</span>; the integer 25 is <span class="mono">0000000000011001</span>. They aren't even the same number of words.</p>`,
        seenPP("The character count program added x30 to print a single-digit count.", "05-lc3.html", "Chapter 5"),
      ]},
      { k: "play", title: "Run the bogus program", b: [
        pre(BOGUS),
        (host) => sim(host, { src: BOGUS, input: "23", inputLabel: "keyboard: two digits", listHeight: 200 }),
        `<p class="aside">Press Run. x0032 + x0033 = x0065, and the monitor shows whatever ASCII x65 is.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Same program, but you type 4 then 5. What appears?", opts: [["i", true, "x34 + x35 = x69, the ASCII code for lowercase i."], ["9", false, "That needs conversion to and from ASCII, which this program skips."], ["e", false, "That was 2 + 3."]] },
        { t: "num", q: "Typing 7 gives R0 = x0037. To use it as the integer 7, which value (decimal) must be removed?", a: 48, tol: 0.01, why: "x30 = 48: x37 − x30 = 7. (Fixing Figure 10.1 properly is an exercise; try it in the book.)" },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the program print e when you type 2 and 3?", model: "TRAP x23 returns ASCII codes, x32 for 2 and x33 for 3. The ADD treats them as 2's complement integers and produces x65. TRAP x21 treats that result as an ASCII code, and x65 is lowercase e. The program never converted the inputs from ASCII to integers or the sum back to ASCII." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  function atobWidget(host) {
    const inp = el(`<input type="text" value="295" maxlength="3" aria-label="digits" style="${field};width:6em">`);
    const out = el(`<div></div>`);
    const draw = () => {
      const s = inp.value.replace(/[^0-9]/g, "").slice(0, 3);
      if (!s.length) { out.innerHTML = `<p>R1 = 0 digits: R0 = 0.</p>`; return; }
      const names = ["ones", "tens", "hundreds"], tables = ["(no table: just add it)", "LookUp10", "LookUp100"];
      let sum = 0;
      const rows = s.split("").reverse().map((c, k) => { const code = c.charCodeAt(0), d = code & 15, v = d * [1, 10, 100][k]; sum += v; return `<tr><td>${names[k]}</td><td class="mono">'${c}' = ${h4(code)}</td><td class="mono">${h4(code)} AND x000F = ${d}</td><td>${tables[k]}${k ? `[${d}] = ${v}` : ""}</td><td class="mono">R0 = ${sum}</td></tr>`; });
      out.innerHTML = `<div class="tbl"><table><thead><tr><th>Digit</th><th>In ASCIIBUFF</th><th>Strip template</th><th>Look up</th><th>Running total</th></tr></thead><tbody>${rows.join("")}</tbody></table></div><p class="eq">R0 = ${sum} = ${h4(sum)}</p>`;
    };
    inp.addEventListener("input", draw);
    const lab = el(`<label>Digits typed (R1 = how many): </label>`); lab.append(inp);
    host.append(lab, out); draw();
  }
  const ATOB_DRIVER = `        .ORIG x3000
        AND  R1,R1,#0
        ADD  R1,R1,#3     ; R1 = 3 digits in ASCIIBUFF
        JSR  ASCIItoBinary
        HALT              ; R0 = the integer
ASCIIBUFF .FILL x0032     ; '2'
        .FILL x0039       ; '9'
        .FILL x0035       ; '5'
        .FILL x0000
${cut("ASCIItoBinary", "; BinarytoASCII")}
        .END`;
  const p2 = {
    id: "p2", title: "ASCII to binary", mins: 20,
    blurb: "Strip each digit's ASCII template with AND x000F, then use the digit to index a table of ones, tens or hundreds.",
    takeaway: "Figure 10.2: the integer 295 typed in is the ASCII string x0032, x0039, x0035 in consecutive words starting at ASCIIBUFF, with R1 = the number of digits (3). The subroutine handles 0–999. ASCIIBUFF is four words (one ASCII code per word to keep the algorithm simple, rather than one per byte): three digits for input, and one more for the sign when a result is output. Algorithm (Figure 10.3 flowchart, Figure 10.4 code, ASCIItoBinary): R0 ← 0; if R1 = 0 done. Point R2 at the ones digit (ASCIIBUFF + R1 − 1); strip the ASCII template with AND R4,R4,x000F; add it. If digits remain, the tens digit indexes LookUp10 (0, 10, …, 90): LEA R3,LookUp10; ADD R3,R3,R4; LDR R4,R3,#0; add. Then the hundreds digit indexes LookUp100 (0, 100, …, 900); e.g. index 6 → #600 = 0000001001011000. R1–R4 are saved and restored; the result is in R0. The subroutines can't be assembled alone: AtoB_ASCIIBUFF .FILL ASCIIBUFF refers to a label in the main program (.EXTERNAL could fix that; the book assembles everything as one unit instead). So every label must be unique across all routines, hence prefixes like AtoB_.",
    steps: [
      { k: "learn", title: "The input buffer", b: [
        `<div class="tbl"><table><tbody><tr><td class="mono">ASCIIBUFF</td><td class="mono">x0032</td><td>'2'</td></tr><tr><td class="mono">+1</td><td class="mono">x0039</td><td>'9'</td></tr><tr><td class="mono">+2</td><td class="mono">x0035</td><td>'5'</td></tr></tbody></table></div><p>R1 = 3 (the number of digits). One ASCII code per word, to keep the code simple.</p>`,
        `<p>Plan: start at the <b>ones</b> digit (the last one) and work left. For each digit:</p><ol><li><b>AND x000F</b> keeps the low 4 bits: x0035 → 5.</li><li>Use that as an index into a table: LookUp10 holds 0, 10, …, 90; LookUp100 holds 0, 100, …, 900.</li><li>Add the table value to R0.</li></ol>`,
      ]},
      { k: "play", title: "Convert by hand", b: [
        atobWidget,
        `<p class="aside">Try 7, 40, 999, 007. The book asks: what about four digits, would you need a thousands table? That's a challenging exercise (10.4). Think about it, but don't look it up.</p>`,
      ]},
      { k: "play", title: "Run Figure 10.4", b: [
        (host) => sim(host, { src: ATOB_DRIVER, io: false, watch: [["ASCIIBUFF", "ASCIIBUFF"]], listHeight: 260 }),
        `<p class="aside">A tiny driver puts “295” in ASCIIBUFF and calls the book's subroutine. Step through and watch R2 walk backwards through the buffer, R3 index the tables, and R0 grow 5 → 95 → 295.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "The tens digit is '8' (x0038). After AND R4,R4,x000F, LEA R3,LookUp10 and ADD R3,R3,R4, R3 points at LookUp10 + ?", a: 8, tol: 0.01, why: "x38 AND x0F = 8, so R3 = LookUp10 + 8, which holds 80." },
        { t: "mcq", q: "Why can't Figure 10.4 be assembled on its own?", opts: [["It refers to ASCIIBUFF, a label defined in the main program", true, "AtoB_ASCIIBUFF .FILL ASCIIBUFF needs that symbol. The book assembles all twelve routines together."], ["It has no .ORIG", false, "That's easy to add; the missing symbol is the real problem."], ["LC-3 subroutines can never be assembled separately", false, ".EXTERNAL and a linker make that possible."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Explain how Figure 10.4 turns the characters 2, 9, 5 into the integer 295.", model: "It starts at the last character, the ones digit. AND with x000F strips the ASCII template, turning x35 into 5, which is added to R0. The tens character becomes 9 the same way, and 9 indexes the LookUp10 table, which holds 90, so 90 is added. The hundreds character becomes 2, which indexes LookUp100 to get 200. R0 ends up holding 5 + 90 + 200 = 295." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  function btoaWidget(host) {
    const out = el(`<div></div>`);
    const draw = (v) => {
      v = Math.round(v);
      let r = Math.abs(v), steps = [];
      const sign = v < 0 ? "-" : "+";
      let h = 0; while (r - 100 >= 0) { r -= 100; h++; }
      steps.push(`hundreds: subtract 100 ${h + 1} time${h ? "s" : ""} (the last one goes negative, so add 100 back) → '${h}'`);
      let t = 0; while (r - 10 >= 0) { r -= 10; t++; }
      steps.push(`tens: subtract 10 ${t + 1} time${t ? "s" : ""}, add 10 back → '${t}'`);
      steps.push(`ones: what's left is ${r}; add x30 → '${r}'`);
      const s = sign + h + t + r;
      out.innerHTML = `<ol>${steps.map((x) => `<li>${x}</li>`).join("")}</ol><div class="tbl"><table style="text-align:center"><tbody><tr>${s.split("").map((c) => `<td class="mono">'${c}'</td>`).join("")}</tr><tr>${s.split("").map((c) => `<td class="mono">${h4(c.charCodeAt(0))}</td>`).join("")}</tr></tbody></table></div><p class="aside">ASCIIBUFF to ASCIIBUFF + 3. PUTS can print it because a x0000 sentinel follows.</p>`;
    };
    const s = slider({ id: "pp10b", label: "R0 (2's complement)", min: -999, max: 999, step: 1, value: -47, show: (v) => Math.round(v) }, draw);
    host.append(s.el, out); draw(-47);
  }
  const BTOA_DRIVER = `        .ORIG x3000
        LD   R0,VALUE
        JSR  BinarytoASCII
        LEA  R0,ASCIIBUFF
        PUTS              ; print the 4-character string
        HALT
VALUE   .FILL #-47
ASCIIBUFF .BLKW #4
        .FILL x0000
${cut("BinarytoASCII", "; OpAdd")}
        .END`;
  const p3 = {
    id: "p3", title: "Binary to ASCII", mins: 20,
    blurb: "Sign first, then count how many 100s and 10s you can subtract. Each count becomes a digit character.",
    takeaway: "Figure 10.5 (BinarytoASCII) converts R0, restricted to −999…+999, into four ASCII characters at ASCIIBUFF: a sign ('+' x2B or '-' x2D), then hundreds, tens and ones digits. If R0 is negative, store '-' and replace R0 by its absolute value (NOT, ADD 1), which is easier to work with. Hundreds: R2 starts at the ASCII offset x30; repeatedly add −100 to R0, incrementing R2 each time the result is still ≥ 0; when it goes negative, store R2 at ASCIIBUFF+1 and add 100 back (one too many subtracts). Tens: the same with −10, stored at +2, add 10 back. Ones: x30 + what remains, stored at +3. Registers R0–R3 are saved and restored. It always produces four characters (e.g. +007); removing leading zeros and a leading + is an exercise.",
    steps: [
      { k: "learn", title: "The plan", b: [
        `<ol><li>Sign: store '+' or '-' at ASCIIBUFF. If negative, make R0 positive (NOT, +1).</li><li>Hundreds: keep subtracting 100 until R0 goes negative, counting in R2 (which started at x30, so the count is already ASCII). Store R2. Add 100 back.</li><li>Tens: same with 10.</li><li>Ones: x30 + what's left.</li></ol>`,
        `<p>Repeated subtraction is division without a divide instruction.</p>`,
      ]},
      { k: "play", title: "Convert by hand", b: [
        btoaWidget,
        `<p class="aside">The output always has four characters, even for 7 (+007). Getting rid of the extra ones is Exercise 10.6, so it stays in the book.</p>`,
      ]},
      { k: "play", title: "Run Figure 10.5", b: [
        (host) => sim(host, { src: BTOA_DRIVER, watch: [["ASCIIBUFF", "ASCIIBUFF"]], listHeight: 260 }),
        `<p class="aside">The driver converts −47 and prints the buffer. Run it, then Reset and step through Loop100 and Loop10.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "R0 = 295. How many times does the ADD R0,R0,R3 at Loop100 (subtracting 100) execute?", a: 3, tol: 0.01, why: "295 → 195 → 95 → −5. The third one goes negative, which ends the loop; R2 was incremented twice, giving '2'." },
        { t: "mcq", q: "R0 = −305. What four characters end up at ASCIIBUFF?", opts: [["- 3 0 5", true, "Sign first, then the digits of the absolute value 305."], ["- 6 9 5", false, "The routine converts the absolute value, not the 2's complement bits."], ["+ 3 0 5", false, "R0 is negative, so the sign is '-'."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does Figure 10.5 find the tens digit, and why does it add 10 back afterwards?", model: "R2 starts at x30, the ASCII code for 0. The loop subtracts 10 from R0 and, as long as the result isn't negative, adds 1 to R2. When the subtraction finally makes R0 negative, R2 holds the ASCII code of the tens digit and is stored at ASCIIBUFF + 2. That last subtraction went one step too far, so 10 is added back to leave the ones value in R0." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  function stackCalc(host) {
    const base = 0x3fff, cap = 5;
    let st = [], log = [], ghost = {};
    const out = el(`<div></div>`), num = el(`<input type="text" value="25" aria-label="value to push" style="${field};width:5em">`), row = el(`<div class="row"></div>`);
    const mk = (t, f, cls) => { const b = btn(t, cls); b.addEventListener("click", () => { f(); draw(); }); return b; };
    const pop = () => { const a = st.pop(); ghost[base - st.length] = a; return a; };
    const push = (v) => { if (st.length >= cap) { log.push("Stack full (x3FFB–x3FFF): push refused."); return false; } st.push(v); delete ghost[base - st.length + 1]; return true; };
    const need = (k) => { if (st.length < k) { log.push(`Need ${k} value${k > 1 ? "s" : ""} on the stack.`); return false; } return true; };
    const draw = () => {
      const sp = base + 1 - st.length;
      let g = "";
      for (let k = 0; k < cap; k++) {
        const a = base - k, y = 200 - k * 36, v = k < st.length ? st[k] : ghost[a];
        g += `<rect x="90" y="${y - 28}" width="110" height="34" style="fill:${k < st.length ? "var(--accent-soft)" : "var(--card)"};stroke:var(--ink)"/>` + S.t(82, y - 6, h4(a), { a: "end", cls: "s" }) + (v !== undefined ? S.t(145, y - 6, String(v), { cls: k < st.length ? "" : "s m" }) : "");
      }
      const ys = 200 - (st.length - 1) * 36 - 11;
      g += st.length ? `<line x1="206" y1="${ys}" x2="240" y2="${ys}" style="stroke:var(--bad);stroke-width:2"/>` + S.t(246, ys + 5, `SP = ${h4(sp)}`, { a: "start", cls: "s" }) : S.t(206, 222, `SP = x4000 (empty)`, { a: "start", cls: "s" });
      out.innerHTML = `<div class="fig">${S.svg(360, 232, g, { max: 360, label: "Five-word stack at x3FFB–x3FFF" })}</div><div class="tbl" style="max-height:150px;overflow:auto"><table><tbody>${log.slice().reverse().map((l) => `<tr><td>${l}</td></tr>`).join("")}</tbody></table></div>`;
    };
    row.append(num,
      mk("push", () => { const v = parseInt(num.value, 10); if (isNaN(v)) return; if (push(v)) log.push(`push ${v}`); }, "primary"),
      mk("add", () => { if (!need(2)) return; const a = pop(), b = pop(); push(a + b); log.push(`add: pop ${a}, pop ${b}, push ${a + b}`); }),
      mk("multiply", () => { if (!need(2)) return; const a = pop(), b = pop(); push(a * b); log.push(`multiply: pop ${a}, pop ${b}, push ${a * b}`); }),
      mk("negate", () => { if (!need(1)) return; const a = pop(); push(-a); log.push(`negate: pop ${a}, push ${-a}`); }),
      mk("pop", () => { if (!need(1)) return; const a = pop(); log.push(`pop → ${a}`); }),
      mk("clear", () => { st = []; ghost = {}; log = []; }));
    host.append(row, out); draw();
  }
  const p4 = {
    id: "p4", title: "Arithmetic on a stack", mins: 20,
    blurb: "Three-address, two-address, zero-address. A calculator pops its operands and pushes its result, so “+” needs no operands at all.",
    takeaway: "The LC-3 is a three-address machine: ADD R0,R1,R2 names both sources and the destination explicitly, in fast general-purpose registers. x86 is two-address (ADD EAX,EBX: EAX is a source and the destination, so it's overwritten). Stack machines (most calculators) use a stack for temporary storage instead of registers: sources are popped, the result pushed, so no addresses are needed: zero-address machines; the instruction is just ADD (press +). Push, pop and add here are control signals in the microarchitecture, not ISA instructions the programmer sees. Example (Figure 10.6): (A + B) × (C + D) with A = 25, B = 17, C = 3, D = 2: push 25, push 17, add (42), push 3, push 2, add (5), multiply (210), pop → E; stack at x3FFB–x3FFF, stack pointer initially x4000 (empty). With a register machine (if it had MUL): LD, LD, ADD, LD, LD, ADD, MUL, ST.",
    steps: [
      { k: "learn", title: "How many addresses?", b: [
        `<div class="tbl"><table><thead><tr><th>Kind</th><th>Example</th><th>Where operands live</th></tr></thead><tbody>
          <tr><td>Three-address</td><td><code>ADD R0,R1,R2</code> (LC-3)</td><td>sources and destination all named</td></tr>
          <tr><td>Two-address</td><td><code>ADD EAX,EBX</code> (x86)</td><td>EAX is a source <i>and</i> the destination</td></tr>
          <tr><td>Zero-address</td><td><code>ADD</code> (stack machine, calculator)</td><td>pop two, push the result</td></tr></tbody></table></div>`,
        `<p>A calculator is a stack machine: pressing <b>+</b> is the whole instruction.</p>`,
      ]},
      { k: "play", title: "Be the calculator", b: [
        stackCalc,
        `<p class="aside">Reproduce Figure 10.6: (25 + 17) × (3 + 2). Push 25, push 17, add, push 3, push 2, add, multiply. Faded numbers are old values left in memory above the top; they no longer count.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Starting empty: push 6, push 4, push 3, add, multiply. What's on top?", a: 42, tol: 0.01, why: "4 + 3 = 7, then 6 × 7 = 42." },
        { t: "mcq", q: "How many stack operations does (A + B) × (C + D) take, including the final pop into E?", opts: [["8", true, "4 pushes, 2 adds, 1 multiply, 1 pop."], ["7", false, "Don't forget popping the result."], ["5", false, "Each value is pushed separately."]] },
        { t: "sort", q: "Which kind of machine is this?", bins: ["Three-address", "Two-address", "Zero-address"], items: [
          ["ADD R3,R1,R2 leaves R1 and R2 intact", 0, "Destination named separately."],
          ["ADD EAX,EBX overwrites EAX", 1, "One operand doubles as the destination."],
          ["Pressing × on a calculator", 2, "Operands come off the stack."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why is a stack machine called a zero-address machine?", model: "Its arithmetic instructions always take their source operands by popping the top of the stack and put the result back by pushing it. Since the locations are always the top of the stack, the instruction doesn't have to name any register or memory address: it's just ADD." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "OpAdd, OpMult, OpNeg, RangeCheck", mins: 20,
    blurb: "Each operation pops, computes, range-checks and pushes. If anything fails, it puts the stack back exactly as it was.",
    takeaway: "OpAdd (Figures 10.7–10.8): save R0, R1, R5, R7 (R7 because it calls other subroutines); JSR POP; if R5 = 1 (failure) exit; move to R1; JSR POP; if failure, put the first value back (ADD R6,R6,#−1, OpAdd_Restore1); add; JSR RangeCheck; if out of range, put both back (Restore2 falls through into Restore1: two decrements); else JSR PUSH. Putting values back just moves the stack pointer, because popped values are still in memory. RangeCheck (Figures 10.9–10.10): result must be −999…+999 so it fits the display; adds −999 (BRp → bad) and +999 (BRn → bad); on failure prints \"Error: Number is out of range.\" with TRAP x22 and returns R5 = 1. OpMult (Figures 10.11–10.12): pops two; if the multiplier is negative, sets a flag in R3 and negates it; multiplies by repeated addition (MultLoop: ADD R0,R0,R1; ADD R2,R2,#−1; BRp); range check; if the flag was set, negate the product; push. OpNeg (Figure 10.13): pop, NOT and add 1, push. Subtraction B − A (A on top) = OpNeg then OpAdd.",
    steps: [
      { k: "learn", title: "OpAdd's shape", b: [
        `<ol><li>POP. Failed? Exit, nothing changed.</li><li>POP again. Failed? Put the first one back.</li><li>ADD, then RangeCheck. Out of range? Put both back.</li><li>PUSH the result.</li></ol>`,
        pre(`OpAdd_Restore2 ADD R6,R6,#-1  ; put back the second value
OpAdd_Restore1 ADD R6,R6,#-1  ; put back the first value
OpAdd_Exit     ...`),
        `<p>“Putting back” is just moving R6: the popped values are still sitting in memory. Restore2 <b>falls through</b> into Restore1, so it moves R6 twice.</p>`,
        seenPP("POP and PUSH reporting success or failure in R5.", "08-data-structures.html", "Chapter 8"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "OpAdd: both POPs succeed but the sum is out of range. How many ADD R6,R6,#-1 instructions execute?", a: 2, tol: 0.01, why: "Branch to Restore2, which falls through into Restore1." },
        { t: "mcq", q: "Why does OpAdd save R7 when it starts?", opts: [["It calls POP, RangeCheck and PUSH with JSR, which overwrite R7, its own return address", true, "Without it, OpAdd's RET would go to the wrong place."], ["TRAP changes R7", false, "OpAdd doesn't use TRAP directly, and in the 3rd edition TRAP leaves R7 alone."], ["The caller needs R7", false, "It's OpAdd's own way home that's at stake."]] },
      ]},
      { k: "learn", title: "RangeCheck, OpMult, OpNeg", b: [
        `<p><b>RangeCheck</b>: is R0 within −999…+999 (so it fits in four characters)? If not, print an error and return R5 = 1.</p>`,
        `<p><b>OpMult</b>: no MUL instruction, so multiply by repeated addition. A negative multiplier is negated first (flag in R3) and the product is negated at the end.</p>`,
        `<p><b>OpNeg</b>: pop, form the 2's complement negative (NOT, +1), push.</p>`,
        `<p><b>Subtraction</b> is OpNeg then OpAdd: with A on top and B under it, the result is B − A.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "Push 10, push 3, then press − (OpNeg) and + (OpAdd). What's on top?", a: 7, tol: 0.01, why: "3 becomes −3; then 10 + (−3) = 7. B − A with A = 3 on top." },
        { t: "mcq", q: "OpMult pops 40 and then 30. What happens?", opts: [["RangeCheck fails (1200 > 999): error message, and both values go back on the stack", true, "Restore2: R6 is decremented twice."], ["1200 is pushed", false, "Values must fit in −999…+999."], ["The stack is cleared", false, "Only OpClear does that."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "If OpAdd's second POP fails, how does it leave the stack exactly as it found it?", model: "The first POP already moved R6 up by one, but the value it popped is still in memory just below the new top. Since the second POP failed it didn't change anything, so OpAdd branches to OpAdd_Restore1, which decrements R6 once. That moves the top back to the first value, so the stack is just as it was." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Run the whole calculator", mins: 25,
    blurb: "Twelve routines, one program. Type the book's key sequence and watch (51 − 49) × (172 + 205) − (17 × 2) come out as 720.",
    takeaway: "Functionality: positive integers of at most three digits; + (add), * (multiply), − (negate); D display the top of the stack; C clear the stack; X exit; Enter or LF pushes the number typed. Values stay within −999…+999. Main algorithm (Figures 10.14–10.15): LEA R6,StackBase; ADD R6,R6,#1 (empty stack); NewCommand: PUTS the prompt \"Enter a command:\", GETC, OUT (echo); test the character against X, C, +, *, −, D by adding stored negatives (NegX = xFFA8 = −'X', etc.) and BRnp to the next test; JSR to the matching routine and BRnzp NewCommand; anything else → PushValue. Globals in the main program: StackMax .BLKW #9, StackBase .BLKW #1 (a ten-entry stack), ASCIIBUFF .BLKW #4 plus a x0000 sentinel. PushValue (Figure 10.16): collect up to 3 digits until LF, echoing; errors \"Too many digits\", \"No number entered\", \"Not an integer\" (after spinning to the LF); then ASCIItoBinary and PUSH. POP (Figure 10.17): underflow if R6 = StackBase + 1 (\"Error: Too Few Values on the Stack.\"). PUSH (Figure 10.18): overflow if R6 = StackMax (\"Error: Stack is Full.\"). OpDisplay (Figure 10.19): POP, BinarytoASCII, print newline and ASCIIBUFF with PUTS, then ADD R6,R6,#−1 to leave the value on the stack. OpClear (Figure 10.20): reset R6 to StackBase + 1. Key sequence for (51 − 49) × (172 + 205) − (17 × 2) = 720: 5,1,LF,4,9,LF,−,+,1,7,2,LF,2,0,5,LF,+,*,1,7,LF,2,LF,*,−,+,D.",
    steps: [
      { k: "learn", title: "The commands", b: [
        `<div class="tbl"><table><tbody>
          <tr><td>digits then ⏎</td><td>push the number (up to 3 digits)</td></tr>
          <tr><td>+ &nbsp; *</td><td>pop two, push the sum / product</td></tr>
          <tr><td>−</td><td>pop one, push its negative</td></tr>
          <tr><td>D</td><td>display the top of the stack</td></tr>
          <tr><td>C</td><td>clear the stack</td></tr>
          <tr><td>X</td><td>exit</td></tr></tbody></table></div>`,
        `<p>The main loop prompts, reads a key with GETC, echoes it with OUT, and tests it against each command by adding a stored negative (NegX = xFFA8 = −x58 = −'X'). No match? It must be a digit: PushValue.</p>`,
      ]},
      { k: "play", title: "720", b: [
        (host) => sim(host, { src: CALC, input: "51\n49\n-+172\n205\n+*17\n2\n*-+D", inputLabel: "keyboard (⏎ = Enter / line feed)", enterKey: true, phases: false, maxSteps: 200000, listHeight: 240, watch: Array.from({ length: 10 }, (_, k) => [k ? `StackBase − ${k}` : "StackBase", SB - k]) }),
        `<p class="aside">The keyboard box holds the book's sequence for (51 − 49) × (172 + 205) − (17 × 2). Press Run. It stops each time it needs a key; the last command is D. Then type your own, e.g. <span class="mono">12⏎3⏎*D</span>, and Run again. Press the ⏎ button or Enter for a line feed.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why does OpDisplay end with ADD R6,R6,#-1?", opts: [["To leave the displayed value on the stack: displaying shouldn't remove it", true, "It POPped the value to convert it; moving R6 back pushes it again (still in memory)."], ["To make room for the next number", false, "Moving R6 down puts a value back; it doesn't free space."], ["Because BinarytoASCII used R6", false, "BinarytoASCII doesn't touch R6."]] },
        { t: "num", q: "StackMax is .BLKW #9 and StackBase .BLKW #1. How many numbers can be pushed before “Error: Stack is Full.”?", a: 10, tol: 0.01, why: "Entries go from StackBase down to StackMax: 9 + 1 = 10 words. Try 11 pushes in the simulator." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Describe what happens when you type 4, 2, Enter.", model: "The main loop reads 4, echoes it, and finds it isn't X, C, +, *, − or D, so it calls PushValue with 4 in R0. PushValue checks it's a digit, stores it in ASCIIBUFF, then reads and echoes 2 and stores it too. The line feed ends the number: R1 is set to the digit count, 2, ASCIItoBinary converts '4','2' to 42, and PUSH puts 42 on the stack. Control returns to the main loop, which prompts for the next command." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Reading a big program", mins: 15,
    blurb: "How the calculator stays readable: one job per subroutine, unique label prefixes, shared globals, R5 for success, callee-saved registers.",
    takeaway: "Design lessons from the calculator: it's a main program plus eleven subroutines (PushValue, ASCIItoBinary, BinarytoASCII, OpAdd, OpMult, OpNeg, RangeCheck, POP, PUSH, OpDisplay, OpClear), each documented with a header comment. They're assembled as one unit, so labels must be unique across all routines; each routine uses its own prefix (AtoB_, BtoA_, OpAdd_…). Three global labels in the main program (StackMax, StackBase, ASCIIBUFF) supply the symbol-table entries that the subroutines reach through .FILL pointers (e.g. POP_StackBase .FILL StackBase), since PC-relative offsets can't reach far. Conventions: R6 is the stack pointer; R5 reports success (0) or failure (1); R0 carries the value; each subroutine saves and restores the registers it uses (callee save) and saves R7 if it calls another subroutine. Errors always leave the stack unchanged. The calculator trusts its user in places (anything that isn't a command is assumed to be a number): making it more robust is Exercises 10.8–10.9.",
    steps: [
      { k: "learn", title: "Conventions that hold it together", b: [
        `<div class="tbl"><table><tbody>
          <tr><td>R6</td><td>stack pointer</td></tr>
          <tr><td>R5</td><td>0 = success, 1 = failure (from POP, PUSH, RangeCheck)</td></tr>
          <tr><td>R0</td><td>the value being passed</td></tr>
          <tr><td>Prefixes</td><td>AtoB_, BtoA_, OpAdd_… so no label is defined twice</td></tr>
          <tr><td>Globals</td><td>StackMax, StackBase, ASCIIBUFF live in the main program; subroutines reach them through <code>.FILL</code> pointers</td></tr></tbody></table></div>`,
        `<p>Every subroutine saves the registers it uses, and saves R7 if it calls another subroutine.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "POP uses LD R0,POP_StackBase where POP_StackBase .FILL StackBase, instead of LEA R0,StackBase. Why might the book do that?", opts: [["StackBase may be too far away for a 9-bit PC offset; the .FILL holds the full address", true, "The globals sit in the main program, which can be hundreds of words from POP."], ["LEA can't load addresses", false, "LEA loads exactly an address."], ["LD is faster than LEA", false, "LD reads memory; LEA doesn't."]] },
        { t: "sort", q: "Which routine reports which error?", bins: ["POP", "PUSH", "RangeCheck", "PushValue"], items: [
          ["Error: Too Few Values on the Stack.", 0, "Underflow: R6 = StackBase + 1."],
          ["Error: Stack is Full.", 1, "Overflow: R6 = StackMax."],
          ["Error: Number is out of range.", 2, "Outside −999…+999."],
          ["Too many digits", 3, "More than three digits before the line feed."],
        ]},
      ]},
      { k: "learn", title: "What it doesn't check", b: [
        `<p>The main program assumes anything that isn't X, C, +, *, − or D is part of a number. In the simulator above, try typing a letter like <span class="mono">Q</span> or <span class="mono">?</span> and see how PushValue reacts.</p>`,
        `<p class="aside">Making the calculator more robust is Exercises 10.8 and 10.9. Read the code with that in mind, then do them in the book.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Name three conventions that let eleven separately written subroutines work together in one program.", model: "They all use R6 as the stack pointer, so any routine can push and pop. They report success or failure the same way, in R5, so callers can test it and undo partial work. And each routine saves and restores the registers it uses, including R7 when it calls other routines, so calling one never breaks the caller. Unique label prefixes and the three shared global labels let all twelve routines be assembled together." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp10", eyebrow: "Patt & Patel · Chapter 10", title: "A Calculator",
    intro: `<p>Seven parts: the ASCII-vs-2's-complement problem, converting each way, arithmetic on a stack, the operation subroutines, and the complete calculator, run on the simulator with your own keystrokes.</p><p>This chapter is one large worked example. Read code slowly: one routine at a time. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. Several ask you to modify the calculator's routines; write your version on paper first, then trace it by hand with a small input.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7],
    summary: `
      <h3>Data types</h3>
      <p>I/O uses ASCII, arithmetic uses 2's complement. '2' + '3' = x65 = 'e'. Convert on the way in and on the way out.</p>
      <h3>Conversions</h3>
      <p>ASCII → binary: AND x000F, then index LookUp10 / LookUp100 and add. Binary → ASCII: sign, then repeated subtraction of 100 and 10, counting up from x30.</p>
      <h3>Stack arithmetic</h3>
      <p>Three-, two-, zero-address machines. Pop operands, push the result. OpAdd/OpMult/OpNeg restore the stack on failure; RangeCheck keeps −999…+999.</p>
      <h3>The calculator</h3>
      <p>Main loop: prompt, GETC, test X C + * − D, else PushValue. Ten-entry stack, R5 success flag, unique label prefixes, globals via .FILL.</p>`,
  };
  Course.start(window.CHAPTER);
})();
