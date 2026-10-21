(function () {
  const { S, plot, slider, toggle, readout, fmt, el } = Course;
  const { sv, listing, truthTable } = Digital;
  const seenV = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const vhdl = (code) => listing(code, { comment: "--" });
  // SystemVerilog and VHDL side by side (stacks on narrow screens)
  const both = (s, v) => `<div class="two"><div class="tile" style="min-width:0"><h3>SystemVerilog</h3>${sv(s)}</div><div class="tile" style="min-width:0"><h3>VHDL</h3>${vhdl(v)}</div></div>`;

  /* ---------- widgets ---------- */
  function precedence(host) {
    const out = el(`<div></div>`);
    const rows = [];
    for (let i = 0; i < 8; i++) {
      const g = (i >> 2) & 1, p = (i >> 1) & 1, c = i & 1;
      const intended = g | (p & c), leftToRight = (g | p) & c;
      rows.push(`<tr${intended !== leftToRight ? ' style="background:var(--bad-soft)"' : ""}><td class="mono">${g}${p}${c}</td><td>${intended}</td><td>${leftToRight}</td></tr>`);
    }
    out.innerHTML = `<div class="tbl"><table><thead><tr><th>g p cin</th><th>g or (p and cin)</th><th>VHDL reads <code>g or p and cin</code> as (g or p) and cin</th></tr></thead><tbody>${rows.join("")}</tbody></table></div><p>Red rows: the unparenthesized VHDL gives the wrong carry. SystemVerilog's <code>g | p &amp; cin</code> is fine, because &amp; binds tighter than |.</p>`;
    host.append(out);
  }
  function stdLogicAnd(host) {
    const vals = ["0", "1", "Z", "X", "U"];
    const and = (a, b) => (a === "0" || b === "0" ? "0" : a === "U" || b === "U" ? "U" : a === "1" && b === "1" ? "1" : "X");
    host.append(el(`<div class="tbl"><table><thead><tr><th>A and B</th>${vals.map((v) => `<th>B = '${v}'</th>`).join("")}</tr></thead><tbody>${vals.map((a) => `<tr><th>A = '${a}'</th>${vals.map((b) => `<td style="text-align:center">'${and(a, b)}'</td>`).join("")}</tr>`).join("")}</tbody></table></div>`));
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Two languages for one job", mins: 20,
    blurb: "HDLs are shorthand for hardware, not programs. SystemVerilog modules and VHDL entities and architectures, side by side.",
    takeaway: "HDLs are best understood as shorthand for hardware: plan the hardware first (FSM controller + datapath of registers, adders, muxes…), then write the HDL that implies it; otherwise you get unwanted latches, slow or bloated logic. The appendix covers SystemVerilog and VHDL side by side; learn one first. 2007 survey: 73% mainly Verilog/SystemVerilog, 20% VHDL, 41% needed both (legacy code, IP, netlists). Learn by example: idioms for each kind of block; a synthesizable subset avoids simulation/synthesis mismatches. Verilog: Gateway Design Automation 1984, Cadence 1989, open 1990, IEEE 1995/2001/2005; SystemVerilog (IEEE 1800) adds conveniences and verification features. VHDL: VHSIC HDL, DoD 1981, Ada roots, IEEE 1987 and later; envisioned for documentation, adopted for simulation and synthesis; used by US military contractors, European companies and most universities. Module = hardware block with inputs and outputs; behavioral (what) vs structural (how, hierarchy). Example A.1 sillyfunction Y = ¬A¬B¬C + A¬B¬C + A¬BC: SV module with input/output logic and assign; VHDL needs library IEEE; use IEEE.<code>STD_LOGIC_1164</code>.all; an entity (ports of type <code>STD_LOGIC</code>) and an architecture body; parenthesize VHDL Boolean equations. logic replaces Verilog's reg. Example A.2 32-bit adder: assign y = a + b; VHDL <code>STD_LOGIC_VECTOR</code>(31 downto 0) and IEEE.<code>STD_LOGIC_UNSIGNED</code> for +. Simulation (waveforms) and synthesis (netlist; e.g., Synplify reduces three AND3s to a pair of AND2s).",
    steps: [
      { k: "learn", title: "Shorthand for hardware", b: [
        `<p>The book's first warning: an HDL is <b>not a programming language</b>. Sketch the hardware first (registers, adders, muxes, an FSM), then write the code that implies exactly that. Code written like software tends to produce unintended latches, or circuits that are slow and big.</p>`,
        `<p>Two languages: <b>SystemVerilog</b> (Verilog's modern form; most industry users) and <b>VHDL</b> (Ada-flavoured, strongly typed; defense, Europe, many universities). Many designers must read both.</p>`,
        seenV("SystemVerilog, step by step.", "../hh/04-hdl.html", "Harris & Harris Ch 4"),
      ]},
      { k: "learn", title: "Example A.1, in both languages", b: [
        both(`module sillyfunction(input  logic a, b, c,
                     output logic y);
  assign y = ~a & ~b & ~c |
              a & ~b & ~c |
              a & ~b &  c;
endmodule`, `library IEEE; use IEEE.STD_LOGIC_1164.all;

entity sillyfunction is
  port(a, b, c: in  STD_LOGIC;
       y:       out STD_LOGIC);
end;

architecture synth of sillyfunction is
begin
  y <= ((not a) and (not b) and (not c)) or
       (a and (not b) and (not c)) or
       (a and (not b) and c);
end;`),
        `<p>VHDL splits a block into an <b>entity</b> (the ports) and an <b>architecture</b> (what it does), and needs the IEEE library for its <code>STD_LOGIC</code> type.</p>`,
      ]},
      { k: "learn", title: "Buses and arithmetic", b: [
        both(`module adder(input  logic [31:0] a, b,
             output logic [31:0] y);
  assign y = a + b;
endmodule`, `library IEEE; use IEEE.STD_LOGIC_1164.all;
use IEEE.STD_LOGIC_UNSIGNED.all;

entity adder is
  port(a, b: in  STD_LOGIC_VECTOR(31 downto 0);
       y:    out STD_LOGIC_VECTOR(31 downto 0));
end;

architecture synth of adder is
begin
  y <= a + b;
end;`),
        `<p>One line replaces 32 full adders; synthesis chooses the adder architecture (Chapter 11). VHDL needs an extra library just to add vectors.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "SystemVerilog or VHDL?", bins: ["SystemVerilog", "VHDL"], items: [
          ["entity … end; architecture … begin … end;", 1, "VHDL's two-part block."],
          ["module … endmodule", 0, "SystemVerilog."],
          ["<code>STD_LOGIC_VECTOR</code>(7 downto 0)", 1, "VHDL bus type."],
          ["logic [7:0]", 0, "SystemVerilog bus."],
          ["Case-insensitive", 1, "VHDL. SystemVerilog is case-sensitive."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What goes wrong when you write HDL as if it were a program?", model: "A program describes steps executed one after another, but HDL code describes hardware that all operates at once. If you don't picture the circuit you're implying, the synthesis tool will still build something: perhaps latches where you forgot to specify an output, duplicated or oversized logic, or a slow chain where a fast structure was intended. Plan the hardware first, then write the idioms that imply it." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "Combinational logic: operators, numbers, Z and X", mins: 25,
    blurb: "Bitwise operators, the missing VHDL reduction operators, conditional assignment, internal signals, a precedence trap, number formats, five logic values, and concatenation.",
    takeaway: "Bitwise operators on single bits or buses: SV ~ & | ^ ~& ~|; VHDL not and or xor nand nor. SV continuous assignment (assign) vs VHDL concurrent signal assignment (<=): re-evaluated whenever right-hand inputs change: combinational logic; order of statements doesn't matter. Comments: SV // and /* */ (case-sensitive); VHDL -- per line (case-insensitive, but other tools may not be). Reduction: SV &a, |a, ^a (parity), ~&, ~|; VHDL has none: write a(7) and a(6) … or use generate. Conditional: SV y = s ? d1 : d0 (nested for 4:1); VHDL y <= d0 when s = '0' else d1; multiple else clauses, or selected signal assignment with s select y <= d0 when \"00\", … d3 when others. Internal signals: SV logic p, g; VHDL signal p, g: <code>STD_LOGIC</code>; declared before begin. Precedence: SV like C (~ highest; *, /, %; +, −; shifts; comparisons; &; ^; |; ?:); VHDL: not; * / mod rem; + − &; rotates/shifts; comparisons; then and/or/nand/nor/xor all EQUAL: g or p and cin means (g or p) and cin, so parenthesize. Arithmetic cost: subtraction ~ addition; multipliers and shifters bigger; division may not synthesize; equality = XORs + AND; relative comparison = subtraction. Numbers: SV N'Bvalue (3'b101, 8'hAB, 6'o42, 3'd6, '0/'1 fill; unsized defaults to decimal and context width); VHDL '0'/'1' for bits, \"101\", B\"101\", X\"AB\" for vectors. Z = floating (tristate: SV output tri, assign y = en ? a : 4'bz; VHDL y <= \"ZZZZ\" when en = '0' else a); X = contention/invalid; uninitialized flops x (SV) or 'U' (VHDL). AND truth tables: 0 dominates; z/x give x; u gives u in VHDL; x or u in simulation almost always means a bug. Swizzling: SV {c[2:1], {3{d[0]}}, c[0], 3'b101}; VHDL c(2 downto 1) & d(0) & d(0) & d(0) & c(0) & \"101\" (& is concatenation, not AND); size constants. Output splitting {upper, lower} = a*b; VHDL via a 16-bit signal; sign extension {{16{a[15]}}, a} vs X\"0000\" & a when a(15) = '0' else X\"ffff\" & a. Delays: SV `timescale 1ns/1ps and #n; VHDL after n ns; ignored by synthesis.",
    steps: [
      { k: "learn", title: "Operators and conditional assignment", b: [
        both(`assign y1 = a & b;      // AND
assign y4 = ~(a & b);   // NAND
assign y  = &a;         // 8-input AND (reduction)
assign m  = s ? d1 : d0;`, `y1 <= a and b;
y4 <= a nand b;
y  <= a(7) and a(6) and a(5) and a(4) and
      a(3) and a(2) and a(1) and a(0);   -- no reduction ops
m  <= d0 when s = '0' else d1;`),
        `<p>VHDL also has the <b>selected signal assignment</b>, a case statement outside any process:</p>`,
        vhdl(`with s select y <=
  d0 when "00",
  d1 when "01",
  d2 when "10",
  d3 when others;`),
        `<p>All of these are <b>concurrent</b>: re-evaluated whenever an input changes, in any order. That's combinational logic.</p>`,
      ]},
      { k: "learn", title: "Internal signals", b: [
        both(`module fulladder(input  logic a, b, cin,
                 output logic s, cout);
  logic p, g;
  assign p = a ^ b;
  assign g = a & b;
  assign s = p ^ cin;
  assign cout = g | (p & cin);
endmodule`, `architecture synth of fulladder is
  signal p, g: STD_LOGIC;
begin
  p <= a xor b;
  g <= a and b;
  s <= p xor cin;
  cout <= g or (p and cin);
end;`),
      ]},
      { k: "play", title: "A precedence trap", b: [
        `<p>In VHDL, <code>and</code>, <code>or</code>, <code>xor</code>… all have <b>equal</b> precedence and group left to right. Predict which inputs break <code>cout &lt;= g or p and cin</code>.</p>`,
        precedence,
      ]},
      { k: "learn", title: "Numbers", b: [
        `<div class="tbl"><table><thead><tr><th>SystemVerilog</th><th>VHDL</th><th>Value</th></tr></thead><tbody><tr><td class="mono">3'b101</td><td class="mono">"101"</td><td>5 in 3 bits</td></tr><tr><td class="mono">8'hAB</td><td class="mono">X"AB"</td><td>171</td></tr><tr><td class="mono">1'b1</td><td class="mono">'1'</td><td>one bit</td></tr><tr><td class="mono">'0, '1</td><td class="mono">(others =&gt; '0')</td><td>fill a whole bus</td></tr></tbody></table></div>`,
        `<p>Always give SystemVerilog constants a size; unsized ones get padded unpredictably.</p>`,
      ]},
      { k: "play", title: "Z, X and U", b: [
        `<p><b>Z</b> = floating (an undriven tristate bus). <b>X</b> = invalid or contention. VHDL adds <b>U</b> = uninitialized (a flop before reset). How do they combine in an AND gate?</p>`,
        stdLogicAnd,
        `<p>A 0 still forces the output to 0; otherwise unknowns spread. <b>Seeing X or U in simulation almost always means a bug</b> (a missing reset, a floating input, two drivers).</p>`,
      ]},
      { k: "learn", title: "Concatenation and delays", b: [
        both(`assign y = {c[2:1], {3{d[0]}}, c[0], 3'b101};
assign {upper, lower} = a * b;
assign y32 = {{16{a[15]}}, a};   // sign extend
assign #2 n1 = ab & bb & cb;     // 2 time units`, `y <= c(2 downto 1) & d(0) & d(0) & d(0) & c(0) & "101";
prod <= a * b;   -- then split prod(15 downto 8), prod(7 downto 0)
y32 <= X"0000" & a when a(15) = '0' else X"ffff" & a;
n1 <= ab and bb and cb after 2 ns;`),
        `<p>In VHDL, <code>&amp;</code> means <i>concatenate</i>, not AND. Delays are for simulation only; synthesis ignores them.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does the order of concurrent assignments not matter in an HDL?", model: "Each concurrent assignment describes a piece of hardware that is always active: its output is recomputed whenever any input on its right-hand side changes. Like gates on a board, they all operate at once, so their written order has no meaning. The simulator just keeps updating them until all the signals settle." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Structural modeling", mins: 15,
    blurb: "Build big blocks from small ones: instances in SystemVerilog, component declarations and port maps in VHDL.",
    takeaway: "Structural modeling describes a module as an interconnection of simpler modules (instances; regularity, e.g., three mux2 instances make a mux4). SV: mux2 lowmux(d0, d1, s[0], low); (module defined elsewhere). VHDL: declare the component (ports must match the entity; tools check), then label: mux2 port map(d0, d1, s(0), low); component declarations make VHDL verbose. VHDL allows several architectures per entity (names like struct/synth are just labels; synthesizable code normally has one). Tristate-based mux2 (not recommended for logic): SV output tri y, instances tristate t0(d0, ~s, y) (expressions allowed in port lists but discouraged); VHDL forbids expressions in port maps, so declare sbar <= not s. Parts of buses: SV d0[3:0], d0[7:4]; VHDL d0(3 downto 0). Design hierarchically: structural at the top, behavioral at the leaves; avoid mixing structural and behavioral in one module.",
    steps: [
      { k: "learn", title: "Instances", b: [
        both(`module mux4(input  logic [3:0] d0, d1, d2, d3,
            input  logic [1:0] s,
            output logic [3:0] y);
  logic [3:0] low, high;
  mux2 lowmux(d0, d1, s[0], low);
  mux2 highmux(d2, d3, s[0], high);
  mux2 finalmux(low, high, s[1], y);
endmodule`, `architecture struct of mux4 is
  component mux2
    port(d0, d1: in  STD_LOGIC_VECTOR(3 downto 0);
         s:      in  STD_LOGIC;
         y:      out STD_LOGIC_VECTOR(3 downto 0));
  end component;
  signal low, high: STD_LOGIC_VECTOR(3 downto 0);
begin
  lowmux:   mux2 port map(d0, d1, s(0), low);
  highmux:  mux2 port map(d2, d3, s(0), high);
  finalmux: mux2 port map(low, high, s(1), y);
end;`),
        `<p>VHDL makes you repeat the submodule's ports in a <b>component declaration</b> so the tools can check they match: safer, but wordy.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "In VHDL, can you write <code>t0: tristate port map(d0, not s, y);</code>?", opts: [["No: expressions aren't allowed in a port map; declare a signal sbar <= not s and connect that", true, "SystemVerilog would accept ~s in the port list (though it's discouraged)."], ["Yes", false, "VHDL rejects it."], ["Only inside a process", false, "Port maps are never inside processes."]] },
      ]},
      { k: "learn", title: "Slices and hierarchy", b: [
        `<p>Connect part of a bus: <code>d0[7:4]</code> in SystemVerilog, <code>d0(7 downto 4)</code> in VHDL (an 8-bit mux from two 4-bit ones, Example A.19).</p>`,
        `<p>Good style: describe big systems <b>structurally</b> (which blocks, how connected) down to pieces simple enough to describe <b>behaviorally</b>, and don't mix the two styles in one module.</p>`,
        seenV("Hierarchy and regularity.", "14-methodology.html", "Chapter 14"),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What is a VHDL component declaration for, and what does it cost?", model: "It restates the submodule's interface, its port names, directions and types, inside the architecture that uses it, so the tools can check that the instance matches the entity defined elsewhere and catch errors when an entity's ports change without updating its users. The cost is verbosity: every port list is written twice." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Sequential logic idioms", mins: 25,
    blurb: "Flip-flops, resets, enables, latches, counters and shift registers. And why a VHDL output can't be read inside its own block.",
    takeaway: "Synthesizers recognize idioms; other styles may simulate fine but synthesize wrongly. Register: SV <code>always_ff</code> @(posedge clk) q <= d; VHDL process(clk) begin if clk'event and clk = '1' then q <= d; end if; end process; (or <code>rising_edge</code>(clk)). always/process executes only on its sensitivity-list events; signals keep their values otherwise, so they imply memory; continuous/concurrent assignments always imply combinational logic. <code>always_ff</code>/<code>always_latch</code>/<code>always_comb</code> let SV tools warn about unintended hardware. Resettable registers: synchronous reset checked inside the clock edge (reset not in sensitivity list); asynchronous reset in the sensitivity list (SV posedge reset; VHDL process(clk, reset) with if reset = '1' … elsif rising edge); simulation starts at x/'U', so reset; synchronous reset uses fewer transistors and avoids trailing-edge timing problems, but beware clock gating at startup. Enabled register: else if (en) q <= d. One always/process can describe several registers (two-flop synchronizer: n1 <= d; q <= n1;). Latch: SV <code>always_latch</code> if (clk) q <= d; VHDL process(clk, d) if clk = '1'; avoid latches unless the tool supports them and you intend one; unexpected latch warnings mean bugs. Counter: behavioral (q <= q + 1) or structural (flopr + adder); VHDL can't read an out port, so use an internal <code>q_int</code> and q <= <code>q_int</code>. Shift register with parallel load: q <= {q[2:0], sin} / <code>q_int</code>(2 downto 0) & sin; sout = q[3].",
    steps: [
      { k: "learn", title: "The flip-flop", b: [
        both(`always_ff @(posedge clk)
  q <= d;`, `process(clk) begin
  if clk'event and clk = '1' then   -- or rising_edge(clk)
    q <= d;
  end if;
end process;`),
        `<p>A process (always block) runs only on the events in its sensitivity list; in between, signals <b>keep</b> their values. That's how these blocks imply memory. Concurrent assignments, by contrast, are always combinational.</p>`,
      ]},
      { k: "learn", title: "Reset: synchronous or asynchronous", b: [
        both(`// synchronous
always_ff @(posedge clk)
  if (reset) q <= 4'b0;
  else       q <= d;

// asynchronous
always_ff @(posedge clk, posedge reset)
  if (reset) q <= 4'b0;
  else       q <= d;`, `-- asynchronous
process(clk, reset) begin
  if reset = '1' then
    q <= "0000";
  elsif clk'event and clk = '1' then
    q <= d;
  end if;
end process;`),
        `<p>The difference is the sensitivity list: an asynchronous reset is listed, so it acts immediately. Simulation starts with flops at <b>x</b> (SV) or <b>'U'</b> (VHDL), so reset everything that matters.</p>`,
        seenV("Synchronous and asynchronous reset circuits.", "10-sequential.html", "Chapter 10"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "This SystemVerilog block intends a flop with synchronous reset: <code>always_ff @(posedge clk, posedge reset) if (reset) q &lt;= 0; else q &lt;= d;</code>. What did it actually describe?", opts: [["An asynchronous reset: reset is in the sensitivity list, so q clears as soon as reset rises", true, "Remove posedge reset for a synchronous reset."], ["A synchronous reset", false, "Not with reset in the sensitivity list."], ["A latch", false, "It's still edge-triggered."]] },
      ]},
      { k: "learn", title: "Counters, and VHDL's read-only outputs", b: [
        both(`always_ff @(posedge clk)
  if (reset) q <= 4'b0;
  else       q <= q + 1;`, `architecture synth of counter is
  signal q_int: STD_LOGIC_VECTOR(3 downto 0);
begin
  process(clk) begin
    if clk'event and clk = '1' then
      if reset = '1' then q_int <= "0000";
      else q_int <= q_int + "0001";
      end if;
    end if;
  end process;
  q <= q_int;
end;`),
        `<p>VHDL won't let you read an <code>out</code> port inside the architecture, so <code>q &lt;= q + 1</code> is illegal. The idiom: compute an internal signal and copy it to the output.</p>`,
      ]},
      { k: "learn", title: "Latches and shift registers", b: [
        both(`always_latch
  if (clk) q <= d;          // transparent while clk = 1

always_ff @(posedge clk)
  if (reset)     q <= 0;
  else if (load) q <= d;
  else           q <= {q[2:0], sin};
assign sout = q[3];`, `process(clk, d) begin
  if clk = '1' then q <= d;
  end if;
end process;

-- inside a clocked process:
elsif load = '1' then q_int <= d;
else q_int <= q_int(2 downto 0) & sin;`),
        `<p>Avoid latches unless your tools support them and you really want one. A latch you didn't intend is a bug.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does the same kind of block, an always or process statement, end up describing either a flip-flop or combinational logic?", model: "It depends on the sensitivity list and on whether every output is assigned in every case. If the block only wakes on a clock edge, outputs hold their values between edges, which is a flip-flop. If it responds to every input and assigns every output for every input combination, nothing is ever remembered, so it is combinational. If it responds to inputs but leaves an output unassigned in some case, the output must remember, which implies a latch." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Combinational processes, case and if", mins: 25,
    blurb: "Processes for complex combinational logic, VHDL variables versus signals, case/when others, if/elsif, casez, and the assignment guidelines.",
    takeaway: "always/process can describe combinational logic if the sensitivity list includes every input and every output is assigned for every input combination (SV <code>always_comb</code> ≡ always @(*), preferred). Blocking vs nonblocking: SV = (blocking, in order) vs <= (nonblocking, all right sides evaluated first); VHDL := to variables (declared in the process, blocking) vs <= to signals (nonblocking/concurrent). Full adder with blocking p, g (SV) or process variables p, g (VHDL; sensitivity list a, b, cin; omitting one may create sequential logic or a sim/synth mismatch). case: SV inside always; default guarantees combinational; VHDL case … when X\"0\" => … when others =>; seven-segment decoder (Synplify made a ROM); without default/others the decoder would remember its output for 10–15 (not combinational); 3:8 decoder: all cases covered in SV; VHDL tools may need others (<code>std_logic</code> has values like 'Z', 'X'); (others => 'X') fills a vector. if/elsif priority circuit; VHDL conditional/selected assignments make processes less necessary. SV casez with ? don't cares (VHDL users skip). Guidelines (both languages): (1) clocked process + nonblocking for sequential logic; (2) concurrent assignments for simple combinational logic; (3) <code>always_comb</code>/process with blocking (variables) for complex combinational logic; (4) assign each signal in only one always/process/concurrent statement (exception: tristate buses). Blocking in combinational logic computes in order using new values; nonblocking there needs extra evaluations and can give wrong results if the sensitivity list is incomplete; blocking in sequential logic can collapse a two-flop synchronizer into one flop. Each always/process implies separate hardware, so assigning a signal in two of them shorts outputs.",
    steps: [
      { k: "learn", title: "Two kinds of assignment", b: [
        `<div class="tbl"><table><thead><tr><th></th><th>SystemVerilog</th><th>VHDL</th></tr></thead><tbody><tr><td>Blocking (in order, like software)</td><td class="mono">p = a ^ b;</td><td class="mono">p := a xor b;  (variables)</td></tr><tr><td>Nonblocking (all right sides first, then update)</td><td class="mono">q &lt;= d;</td><td class="mono">q &lt;= d;  (signals)</td></tr></tbody></table></div>`,
        both(`always_comb
  begin
    p = a ^ b;        // blocking
    g = a & b;
    s = p ^ cin;
    cout = g | (p & cin);
  end`, `process(a, b, cin)
  variable p, g: STD_LOGIC;
begin
  p := a xor b;      -- blocking
  g := a and b;
  s <= p xor cin;
  cout <= g or (p and cin);
end process;`),
        `<p>The VHDL sensitivity list must name <b>every input</b>; leave one out and you may get sequential logic, or a design that simulates differently from how it synthesizes.</p>`,
        seenV("Blocking vs nonblocking, in depth.", "../hh/04-hdl.html", "Harris & Harris Ch 4"),
      ]},
      { k: "learn", title: "case", b: [
        both(`always_comb
  case (data)
    0: segments = 7'b111_1110;
    1: segments = 7'b011_0000;
    // … 2 to 9 …
    default: segments = 7'b000_0000;
  endcase`, `process(data) begin
  case data is
    when X"0" => segments <= "1111110";
    when X"1" => segments <= "0110000";
    -- … 2 to 9 …
    when others => segments <= "0000000";
  end case;
end process;`),
        `<p>The <code>default</code> / <code>others</code> branch makes sure every input gives an output. Without it, the decoder would <i>remember</i> its old output for inputs 10–15: not combinational logic.</p>`,
        `<p class="aside">VHDL may want <code>others</code> even when every 0/1 pattern is listed, because <code>STD_LOGIC</code> also has 'Z', 'X', 'U'…; <code>(others =&gt; 'X')</code> fills a vector.</p>`,
      ]},
      { k: "learn", title: "if / elsif, and casez", b: [
        both(`always_comb
  if      (a[3]) y = 4'b1000;
  else if (a[2]) y = 4'b0100;
  else if (a[1]) y = 4'b0010;
  else if (a[0]) y = 4'b0001;
  else           y = 4'b0000;

// or with don't cares:
casez (a)
  4'b1???: y = 4'b1000;
  4'b01??: y = 4'b0100;
  // …
endcase`, `process(a) begin
  if    a(3) = '1' then y <= "1000";
  elsif a(2) = '1' then y <= "0100";
  elsif a(1) = '1' then y <= "0010";
  elsif a(0) = '1' then y <= "0001";
  else                  y <= "0000";
  end if;
end process;`),
      ]},
      { k: "learn", title: "The four guidelines", b: [
        `<ol><li>Sequential logic: clocked block (<code>always_ff</code> / process(clk)) with <b>nonblocking</b> assignments.</li><li>Simple combinational logic: concurrent assignments.</li><li>Complicated combinational logic: <code>always_comb</code> or a full-sensitivity process with <b>blocking</b> assignments (VHDL: variables).</li><li>Assign each signal in <b>only one</b> block (two blocks = two pieces of hardware driving one wire). Exception: tristate buses.</li></ol>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "A two-flop synchronizer is written with blocking assignments: <code>always_ff @(posedge clk) begin n1 = d; q = n1; end</code>. What hardware results?", opts: [["One flip-flop: q gets the new n1 (= d) immediately, so n1 disappears", true, "Blocking assignments update in order. Use nonblocking for sequential logic."], ["Two flip-flops, as intended", false, "That's what nonblocking gives."], ["A latch", false, "It's still clocked."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why must a case statement describing combinational logic cover every input value?", model: "Combinational logic must produce a defined output for every input. If some input values aren't covered, the block says nothing about the output for them, so the hardware must keep the previous value, which requires memory: the synthesizer infers a latch. A default or others branch closes that gap." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Finite state machines", mins: 20,
    blurb: "State register, next-state logic, output logic: three blocks, in either language, with named states.",
    takeaway: "FSM = state register + next-state logic + output logic. Divide-by-3 FSM (S0 → S1 → S2 → S0, y = 1 in S0). Enumerated states: SV typedef enum logic [1:0] {S0, S1, S2} statetype; (default encodings 00, 01, 10; can set one-hot explicitly); VHDL type statetype is (S0, S1, S2); signal state, nextstate: statetype; (tool may choose encoding). State register: clocked with reset to S0. Next-state logic: SV <code>always_comb</code> case with default; VHDL concurrent when/else or a process with case … when others. Output: SV assign y = (state == S0); VHDL y <= '1' when state = S0 else '0'; (comparisons produce BOOLEAN). Mealy history FSM (Example A.38): input a, outputs x (same as last cycle) and y (same for two cycles); states S0–S4; next-state process(state, a); outputs depend on state and a. Each always/process implies separate hardware; assign each signal in only one.",
    steps: [
      { k: "learn", title: "Divide-by-3, in both languages", b: [
        both(`typedef enum logic [1:0] {S0, S1, S2} statetype;
statetype state, nextstate;

always_ff @(posedge clk)          // state register
  if (reset) state <= S0;
  else       state <= nextstate;

always_comb                       // next-state logic
  case (state)
    S0: nextstate = S1;
    S1: nextstate = S2;
    S2: nextstate = S0;
    default: nextstate = S0;
  endcase

assign y = (state == S0);         // output logic`, `type statetype is (S0, S1, S2);
signal state, nextstate: statetype;
begin
process(clk) begin                -- state register
  if clk'event and clk = '1' then
    if reset = '1' then state <= S0;
    else state <= nextstate;
    end if;
  end if;
end process;

nextstate <= S1 when state = S0 else   -- next-state
             S2 when state = S1 else
             S0;

y <= '1' when state = S0 else '0';     -- output`),
        `<p>Named states make the code readable and easy to change. SystemVerilog numbers them 00, 01, 10 unless you choose (e.g., one-hot); VHDL lets the synthesis tool choose.</p>`,
        seenV("FSMs in SystemVerilog and state diagrams.", "../hh/04-hdl.html", "Harris & Harris Ch 4"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Who decides the binary encoding of the states S0, S1, S2?", opts: [["In SystemVerilog the designer can (default 00, 01, 10, or set explicitly, e.g. one-hot); in VHDL the synthesis tool may choose", true, "VHDL enumerations are abstract; SystemVerilog enums carry a base type and values."], ["Always the designer, in both languages", false, "VHDL leaves it to the tool."], ["Always one-hot", false, "Only if you ask for it."]] },
      ]},
      { k: "learn", title: "A Mealy machine (Example A.38)", b: [
        `<p>Input a; output x = 1 when a equals its value last cycle, y = 1 when it has been the same for two cycles. Five states. Because the outputs depend on <i>a</i> as well as the state, it's a <b>Mealy</b> machine:</p>`,
        sv(`assign x = ((state == S1 | state == S2) & ~a) |
           ((state == S3 | state == S4) &  a);
assign y = (state == S2 & ~a) | (state == S4 & a);`),
        `<p>In VHDL the next-state logic is a <code>process(state, a)</code> with a case statement and an <code>if a = '1'</code> in each branch.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why split an FSM into a state register, next-state logic and output logic?", model: "Each part is a different kind of hardware: a clocked register, and two blocks of combinational logic. Writing them separately, each with its proper idiom, makes it obvious what hardware is implied, avoids accidental latches or extra registers, and makes the code read like the state diagram: one place for transitions and one for outputs." },
      ]},
    ],
  };

  /* =============== PART 7 =============== */
  const p7 = {
    id: "p7", title: "Types, and parameterized modules", mins: 25,
    blurb: "Verilog's reg/wire/logic/tri and net resolution; VHDL's strict types, BOOLEAN versus <code>STD_LOGIC</code>, integers as indices, read-only outputs. Then generics and generate.",
    takeaway: "Verilog: reg (left side in always blocks; may or may not be a register) and wire (everything else; ports default to wire). SystemVerilog logic replaces reg and can be used where wire was needed: nearly every signal can be logic; signals with multiple drivers (tristate buses) must be nets (tri; wire is the single-driver synonym), so tools flag accidental multiple drivers instead of producing x. Net resolution (Table A.7): tri (no driver z, conflict x), triand (0 if any 0), trior (1 if any 1), trireg (holds previous value), tri0, tri1 (pull to 0/1). Verilog nets unsigned by default; signed changes comparison, multiplication, arithmetic right shift. VHDL: strict typing; <code>STD_LOGIC</code> not built in (IEEE.<code>STD_LOGIC_1164</code> in every file); no arithmetic in 1164 → vendor libraries IEEE.<code>STD_LOGIC_UNSIGNED</code> and <code>STD_LOGIC_SIGNED</code>. BOOLEAN (true/false) from comparisons and used by conditions is not interchangeable with <code>STD_LOGIC</code> ('1'/'0'): y <= d1 when s else d0 and q <= (state = S2) are illegal; write s = '1' and '1' when … else '0'. INTEGER (at least −2³¹…2³¹−1) indexes buses; convert vectors with <code>CONV_INTEGER</code> (8:1 mux: y <= d(<code>CONV_INTEGER</code>(s))). out ports can't be read inside; buffer ports work but hurt hierarchy; use an internal signal (<code>v_int</code>). Parameterized modules: SV #(parameter width = 8) with default, override with mux2 #(12); VHDL generic(width: integer := 8), component with generic, override with generic map(12). Don't confuse #(…) parameters with # delays. Parameterized N:2^N decoder: y = 0; y[a] = 1; (blocking); VHDL variable tmp := <code>CONV_STD_LOGIC_VECTOR</code>(0, 2**N); tmp(<code>CONV_INTEGER</code>(a)) := '1' (<code>STD_LOGIC_ARITH</code>). generate: SV genvar, for/if with a labeled begin (andN as a chain of AND2s); VHDL label: for i in 1 to width−1 generate, if … generate; easy to create lots of hardware unintentionally.",
    steps: [
      { k: "learn", title: "SystemVerilog types", b: [
        `<p>Old Verilog had <b>reg</b> (anything assigned in an always block, register or not: endlessly confusing) and <b>wire</b>. SystemVerilog's <b>logic</b> replaces both for single-driver signals. Signals with <b>several drivers</b> (tristate buses) must be nets such as <b>tri</b>, so the tools can flag an accidental second driver as an error instead of silently producing x.</p>`,
        `<div class="tbl"><table><thead><tr><th>Net</th><th>No driver</th><th>Conflicting drivers</th></tr></thead><tbody><tr><td>tri</td><td>z</td><td>x</td></tr><tr><td>triand / trior</td><td>z</td><td>0 if any 0 / 1 if any 1</td></tr><tr><td>trireg</td><td>keeps previous value</td><td>x</td></tr><tr><td>tri0 / tri1</td><td>0 / 1</td><td>x</td></tr></tbody></table></div>`,
        `<p>Nets are unsigned unless declared <code>signed</code>, which changes comparison, multiplication and arithmetic right shift.</p>`,
      ]},
      { k: "learn", title: "VHDL's strict types", b: [
        `<ul><li><b><code>STD_LOGIC</code></b> isn't built in: every file needs the IEEE library. Arithmetic on vectors needs more libraries (<code>STD_LOGIC_UNSIGNED</code> or _SIGNED).</li><li><b>BOOLEAN</b> (true/false) comes out of comparisons and drives <code>when</code> and <code>if</code>. It is <i>not</i> <code>STD_LOGIC</code>: you can't write <code>when s</code> for a <code>STD_LOGIC</code> s; write <code>when s = '1'</code>. And a comparison can't be assigned straight to a <code>STD_LOGIC</code> signal; convert with <code>'1' when … else '0'</code>.</li><li><b>INTEGER</b> indexes buses. A <code>STD_LOGIC_VECTOR</code> index must be converted: <code>y &lt;= d(CONV_INTEGER(s));</code> (an 8:1 mux).</li><li><b>out</b> ports are write-only inside the architecture: compute an internal signal and copy it out.</li></ul>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Legal VHDL, or a type error? (a, b: <code>STD_LOGIC</code>; s: <code>STD_LOGIC_VECTOR</code>(2 downto 0); y: out <code>STD_LOGIC</code>; d: <code>STD_LOGIC_VECTOR</code>(7 downto 0))", bins: ["Legal", "Type error"], items: [
          ["y <= a when b = '1' else '0';", 0, "b = '1' is a BOOLEAN condition: correct."],
          ["y <= d(s);", 1, "An index must be an INTEGER: use <code>CONV_INTEGER</code>(s)."],
          ["y <= d(<code>CONV_INTEGER</code>(s));", 0, "Exactly Example A.39."],
          ["y <= a when b else '0';", 1, "b is <code>STD_LOGIC</code>, not BOOLEAN."],
        ]},
      ]},
      { k: "learn", title: "Parameterized modules", b: [
        both(`module mux2 #(parameter width = 8)
  (input  logic [width-1:0] d0, d1,
   input  logic             s,
   output logic [width-1:0] y);
  assign y = s ? d1 : d0;
endmodule

mux2 #(12) lowmux(d0, d1, s[0], low);   // 12-bit copy`, `entity mux2 is
  generic(width: integer := 8);
  port(d0, d1: in  STD_LOGIC_VECTOR(width-1 downto 0);
       s:      in  STD_LOGIC;
       y:      out STD_LOGIC_VECTOR(width-1 downto 0));
end;

lowmux: mux2 generic map(12)
             port map(d0, d1, s(0), low);`),
        `<p class="aside">In SystemVerilog, <code>#(…)</code> before an instance name sets parameters; <code>#5</code> in a statement is a delay. Don't mix them up.</p>`,
      ]},
      { k: "learn", title: "Decoders and generate", b: [
        both(`module decoder #(parameter N = 3)
  (input  logic [N-1:0]    a,
   output logic [2**N-1:0] y);
  always_comb begin
    y = 0;
    y[a] = 1;
  end
endmodule`, `process(a)
  variable tmp: STD_LOGIC_VECTOR(2**N-1 downto 0);
begin
  tmp := CONV_STD_LOGIC_VECTOR(0, 2**N);
  tmp(CONV_INTEGER(a)) := '1';
  y <= tmp;
end process;`),
        `<p><b>generate</b> repeats hardware a parameter-dependent number of times (a for loop or an if, evaluated at elaboration, not at run time). Example A.42 chains width − 1 AND2 gates into an N-input AND. Use with care: a small change can create a lot of hardware.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why are parameterized modules better than writing separate 4-bit, 8-bit and 12-bit versions?", model: "One parameterized description covers every width, so there is only one module to write, verify and fix, and a bug fixed once is fixed everywhere. Each instance chooses its width with a parameter or generic at instantiation, which keeps the design regular, and the synthesizer builds exactly the width needed." },
      ]},
    ],
  };

  /* =============== PART 8 =============== */
  const p8 = {
    id: "p8", title: "Memories, testbenches, netlists, and a whole processor", mins: 25,
    blurb: "RAMs, register files and ROMs; self-checking testbenches with vector files; transistor-level Verilog; and the MIPS example.",
    takeaway: "Memories model easily but usually aren't synthesized; use memory generators/libraries or custom design. RAM (64 × 32): SV logic [M−1:0] mem[2**N−1:0]; always @(posedge clk) if (we) mem[adr] <= din; assign dout = mem[adr]; VHDL type <code>mem_array</code> is array((2**N−1) downto 0) of <code>STD_LOGIC_VECTOR</code>(M−1 downto 0); signal mem; mem(<code>CONV_INTEGER</code>(adr)). Bidirectional data bus: inout tri data; assign data = we ? 'z : mem[adr]; VHDL (OTHERS => 'Z') when we = '1'; point-to-point usually preferred over tristate buses on chip. Three-ported register file: two combinational reads, one clocked write. ROM: case statement (4 × 3 example); small ROMs synthesize to logic. Testbench = HDL module that applies vectors to the device under test (DUT) and checks outputs; not synthesizable. Simple: SV initial with blocking assignments and #10; VHDL process with wait for 10 ns and a final wait. Self-checking: SV assert (y === 1) else $error(\"…\") (=== handles x/z; == does not); VHDL assert y = '1' report \"…\". Vector-file testbench (example.tv: 000_1 …): clock generator, $readmemb (SV) or TEXTIO (VHDL), apply inputs 1 time unit after the rising edge, check on the falling edge, count errors, stop at end ($finish; VHDL reports with severity failure). SystemVerilog netlists: gate primitives (and g1(y, a, b, c, d)); transistor primitives tranif1 (nMOS), tranif0 (pMOS), rtranif (resistive/weak), supply0/supply1; pseudo-nMOS NOR with rtranif0 pull-up and tri output; static latch with a trireg state node and weak feedback; tranif bidirectional preferred to unidirectional nmos/pmos primitives; simulation only. MIPS example: LB, SB, ADD, SUB, AND, OR, SLT, BEQ, J on an 8-bit datapath with eight registers; 32-bit instructions fetched in four bytes; testbench loads a 256-byte memory and expects 7 written to address 76 after ~100 cycles; listed in SV and VHDL.",
    steps: [
      { k: "learn", title: "Memories", b: [
        both(`logic [M-1:0] mem[2**N-1:0];
always @(posedge clk)
  if (we) mem[adr] <= din;
assign dout = mem[adr];`, `type mem_array is array((2**N-1) downto 0)
     of STD_LOGIC_VECTOR(M-1 downto 0);
signal mem: mem_array;
...
if we = '1' then
  mem(CONV_INTEGER(adr)) <= din;
end if;
...
dout <= mem(CONV_INTEGER(adr));`),
        `<p>Easy to model, but real memory circuits are so specialized that tools usually don't synthesize them: a <b>memory generator</b> or library builds the actual array (Chapter 12). A register file is the same idea with several read ports; a ROM is a case statement.</p>`,
        seenV("SRAM arrays and register files.", "12-arrays.html", "Chapter 12"),
      ]},
      { k: "learn", title: "Self-checking testbenches", b: [
        both(`initial begin
  a = 0; b = 0; c = 0; #10;
  assert (y === 1) else $error("000 failed.");
  c = 1; #10;
  assert (y === 0) else $error("001 failed.");
  // …
end`, `process begin
  a <= '0'; b <= '0'; c <= '0'; wait for 10 ns;
  assert y = '1' report "000 failed.";
  c <= '1'; wait for 10 ns;
  assert y = '0' report "001 failed.";
  -- …
  wait;   -- stop, or the process repeats forever
end process;`),
        `<p>In SystemVerilog use <code>===</code> in checks: plain <code>==</code> treats an x or z operand as a spurious match. Better still, read the vectors from a file (<code>000_1</code>, <code>001_0</code>, …): apply inputs just after each rising clock edge, check on the falling edge, count errors, report at the end.</p>`,
        seenV("Testbenches and test vectors.", "15-testing.html", "Chapter 15"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why does a VHDL stimulus process end with a bare <code>wait;</code>?", opts: [["A process with no sensitivity list loops forever; the final wait stops it from reapplying the vectors", true, "It waits forever."], ["To let the outputs settle", false, "That's what the wait for 10 ns statements do."], ["Synthesis requires it", false, "Testbenches aren't synthesized."]] },
      ]},
      { k: "learn", title: "Transistor-level Verilog", b: [
        `<p>Verilog (not VHDL) can describe circuits at the switch level: <code>tranif1</code> is an nMOS, <code>tranif0</code> a pMOS, <code>rtranif</code> a weak (resistive) one, <code>supply0</code>/<code>supply1</code> are GND and V<sub>DD</sub>. A pseudo-nMOS NOR:</p>`,
        sv(`module nor_pseudonmos(input logic a, b, output tri y);
  supply0 gnd;  supply1 vdd;
  tranif1  n1(y, gnd, a);
  tranif1  n2(y, gnd, b);
  rtranif0 p1(y, vdd, gnd);   // weak, always-on pull-up
endmodule`),
        `<p>A static latch needs a <code>trireg</code> state node (so it never floats) and weak feedback transistors (so they never cause contention). For simulation only: synthesis maps to gates.</p>`,
        seenV("Pseudo-nMOS gates.", "09-combinational.html", "Chapter 9"),
      ]},
      { k: "learn", title: "A whole processor", b: [
        `<p>The appendix ends with the Chapter 1 MIPS subset in both languages: LB, SB, ADD, SUB, AND, OR, SLT, BEQ and J, an 8-bit datapath, eight registers, and each 32-bit instruction fetched as four bytes. Its testbench loads a 256-byte memory and declares success if 7 is written to address 76, after about 100 cycles.</p>`,
        seenV("The MIPS microarchitecture in SystemVerilog.", "../hh/07-microarchitecture.html", "Harris & Harris Ch 7"),
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What makes a testbench “self-checking”, and why is that worth the effort?", model: "A self-checking testbench compares each output against an expected value, from code or from a test-vector file, and reports any mismatch and an error count, instead of relying on someone inspecting waveforms. That makes checking reliable and automatic, so the test can be rerun after every change, for example in a nightly regression, without anyone having to remember the right answers." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "vlsiA", eyebrow: "CMOS VLSI · Appendix A", title: "Hardware Description Languages",
    intro: `<p>Eight parts covering SystemVerilog and VHDL side by side: modules and entities, combinational operators, structural models, sequential idioms, processes and case statements, FSMs, types and parameters, then memories, testbenches and netlists.</p><p>If you did Harris & Harris Chapter 4, the SystemVerilog will be familiar; focus on the VHDL column and on the differences. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the appendix's exercises in the language of your choice, then try a couple in the other one. Before writing code for any block, sketch the hardware you intend; afterwards, run it through a simulator with a self-checking testbench.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6, p7, p8],
    summary: `
      <h3>Structure</h3>
      <p>SV: module/endmodule, logic. VHDL: library IEEE; entity (ports) + architecture; <code>STD_LOGIC</code>, <code>STD_LOGIC_VECTOR</code>(n downto 0). Instances vs component + port map (no expressions).</p>
      <h3>Combinational</h3>
      <p>assign / concurrent &lt;=; ?: vs when/else and with/select; VHDL logical operators have equal precedence (parenthesize); numbers 8'hAB vs X"AB"; 0/1/Z/X(/U); {…} vs &amp;.</p>
      <h3>Sequential</h3>
      <p><code>always_ff</code> @(posedge clk) vs process(clk) with clk'event and clk = '1'; reset in the sensitivity list = asynchronous; VHDL outputs can't be read (use an internal signal). Avoid unintended latches.</p>
      <h3>Processes and FSMs</h3>
      <p><code>always_comb</code> + blocking (VHDL variables :=) for complex combinational logic; nonblocking for sequential; default/others; assign each signal in one block. Enumerated states; register + next-state + output.</p>
      <h3>Types, parameters, testing</h3>
      <p>logic vs tri; BOOLEAN ≠ <code>STD_LOGIC</code>; <code>CONV_INTEGER</code> for indices; #(parameter) vs generic/generic map; generate. RAM/ROM models; assert (=== in SV) vs assert … report; vector files; transistor primitives.</p>`,
  };
  Course.start(window.CHAPTER);
})();
