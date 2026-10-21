(function () {
  const { S, slider, toggle, readout, el } = Course;
  const { code, esc } = CT;
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const fig = (s) => `<div class="fig">${s}</div>`;
  const lc3 = (t) => Digital.listing(t, { comment: ";" });
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);
  const cpp = (t, o = {}) => code(t, { nums: false, ...o });

  /* ---------- Figure 20.1 in pieces ---------- */
  const FIG201 = `#include <iostream>

void swap(int &x, int &y)
{
   int temp = x;
   x = y;
   y = temp;
}

void swap(char &x, char &y)
{
   char temp = x;
   x = y;
   y = temp;
}

void swap(double &x, double &y)
{
   double temp = x;
   x = y;
   y = temp;
}

int main(void)
{
   // Variable declarations
   int a = 4, b = 5;
   char c = 'c', d = 'd';
   double x = 3.14, y = 1.41;

   // Before the swaps
   std::cout << "a = " << a << " b = " << b << std::endl;
   std::cout << "c = " << c << " d = " << d << std::endl;
   std::cout << "x = " << x << " y = " << y << std::endl;

   swap(a, b);
   swap(c, d);
   swap(x, y);

   // After the swaps
   std::cout << "a = " << a << " b = " << b << std::endl;
   std::cout << "c = " << c << " d = " << d << std::endl;
   std::cout << "x = " << x << " y = " << y << std::endl;
}`;
  function fig201(host) {
    const P = [
      ["iostream", [1], "C++'s I/O header (instead of stdio.h). It defines the streams cin and cout."],
      ["std::cout <<", [32, 33, 34, 41, 42, 43], "<code>std::</code> says these names come from the standard library's namespace. <code>&lt;&lt;</code> inserts items into the output stream, each converted to text by its type. <code>std::endl</code> ends the line."],
      ["int &x", [3, 4, 5, 6, 7, 8], "The & in the parameter list makes x and y <b>references</b>: inside swap they <i>are</i> the caller's variables. No * anywhere."],
      ["three swaps", [3, 10, 17, 36, 37, 38], "Three functions share one name, told apart by their parameter types: <b>overloading</b>. Each call picks the version whose types match its arguments."],
    ];
    const out = el(`<div></div>`);
    const draw = (i) => { out.innerHTML = code(FIG201, { hl: P[i][1] }) + `<p>${P[i][2]}</p>`; };
    host.append(toggle(P.map((p) => p[0]), draw, 0), out); draw(0);
  }

  /* ---------- Triangle (Figures 20.3–20.6) ---------- */
  function triangle(host) {
    let a = 2, b = 2, c = 3;
    const out = el(`<div></div>`);
    const PRE = [["t1(2.0, 2.0, 3.0)", 2, 2, 3], ["t2 = new Triangle(4.2, 7.8, 10.2)", 4.2, 7.8, 10.2], ["Triangle(1, 2, 5)", 1, 2, 5]];
    let sliders = [];
    const draw = () => {
      const p = a + b + c, s = p / 2, q = s * (s - a) * (s - b) * (s - c), area = Math.sqrt(q);
      let svg = "";
      if (q > 0) {
        // place side c on the x axis
        const x = (a * a - b * b + c * c) / (2 * c), y = Math.sqrt(Math.max(0, a * a - x * x)), k = 200 / Math.max(c, a, b, 1);
        const P0 = [30, 170], P1 = [30 + c * k, 170], P2 = [30 + x * k, 170 - y * k];
        svg = fig(S.svg(280, 190, `<polygon points="${P0.join(",")} ${P1.join(",")} ${P2.join(",")}" style="fill:var(--accent-soft);stroke:var(--ink);stroke-width:2"/>` + S.t((P0[0] + P1[0]) / 2, 186, "sideC", { cls: "lab" }) + S.t((P0[0] + P2[0]) / 2 - 18, (P0[1] + P2[1]) / 2, "sideA", { cls: "lab", a: "end" }) + S.t((P1[0] + P2[0]) / 2 + 12, (P1[1] + P2[1]) / 2, "sideB", { cls: "lab", a: "start" }), { max: 280, label: "The triangle" }));
      }
      out.innerHTML = svg + readout([["perimeter()", p.toFixed(4)], ["s = perimeter() / 2", s.toFixed(4)], ["area() = sqrt(s(s−a)(s−b)(s−c))", q > 0 ? area.toFixed(4) : `<span style="color:var(--bad)">sqrt of ${q.toFixed(2)}: not a real triangle (nan)</span>`]]);
    };
    const mk = (id, lab, v, set) => slider({ id, label: lab, min: 0.5, max: 12, step: 0.1, value: v, show: (x) => x.toFixed(1) }, (x) => { set(x); draw(); });
    sliders = [mk("pp20a", "sideA", a, (x) => (a = x)), mk("pp20b", "sideB", b, (x) => (b = x)), mk("pp20c", "sideC", c, (x) => (c = x))];
    host.append(toggle(PRE.map((p) => p[0]), (i) => { sliders[0].set(PRE[i][1]); sliders[1].set(PRE[i][2]); sliders[2].set(PRE[i][3]); }, 0), ...sliders.map((s) => s.el), out); draw();
  }

  /* ---------- std::vector ---------- */
  function vectorWidget(host) {
    let v = [0, 1, 3, 6, 10];
    let msg = "<code>std::vector&lt;int&gt; intVector</code>: five elements to start.";
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`);
    const ops = [
      ["<code>push_back(42)</code>", () => { v.push(42); msg = "<code>push_back</code> adds an element at the end; the vector grows by one."; }],
      ["insert at 1: 7", () => { v.splice(1, 0, 7); msg = "insert puts 7 at position 1; the vector shifts the later elements for you."; }],
      ["erase position 0", () => { if (v.length) { v.splice(0, 1); msg = "erase removes the first element; the rest move down."; } }],
      ["resize(8)", () => { while (v.length < 8) v.push(0); v.length = 8; msg = "resize(8): grow (new ints are 0) or shrink to exactly 8."; }],
      ["resize(3)", () => { v.length = Math.min(v.length, 3); msg = "resize(3) keeps only the first three."; }],
      ["back() = 3", () => { if (v.length) { v[v.length - 1] = 3; msg = "back() is the last element; you can assign to it."; } }],
    ];
    const draw = () => {
      out.innerHTML = `<div class="tbl"><table style="font-family:var(--mono);text-align:center"><tbody><tr><th>index</th>${v.map((_, i) => `<td>${i}</td>`).join("")}</tr><tr><th>value</th>${v.map((x) => `<td>${x}</td>`).join("")}</tr></tbody></table></div>` + readout([["size()", v.length], ["front()", v.length ? v[0] : "—"], ["back()", v.length ? v[v.length - 1] : "—"]]) + `<p>${msg}</p>`;
    };
    ops.forEach(([lab, f]) => { const b = btn(lab); b.addEventListener("click", () => { f(); draw(); }); row.append(b); });
    const r = btn("Reset"); r.addEventListener("click", () => { v = [0, 1, 3, 6, 10]; msg = "Reset."; draw(); }); row.append(r);
    host.append(row, out); draw();
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Why C++?", mins: 10,
    blurb: "C gets messy at scale. C++ adds ways to organize code, and still compiles to the same machine model.",
    takeaway: "Languages exist for programmer productivity; C and C++ have endured for large-scale, performance-hungry system code. Big C programs become flat, messy collections of types, structures and functions with no systematic organization, a problem for teams. Bjarne Stroustrup (late 1970s) extended C with classes (originally \"C with Classes\"), the evolution of C structures; C++ projects reach tens of millions of lines. C++ is vast; this chapter covers the essentials. Nearly everything from Chapters 11–19 holds for C++. C++ compiles to the same execution model as C: functions starting at main, run-time stack for arguments and locals (or objects), heap for dynamic allocation, global section; the same binary representations. Much of C++'s convenience is extra work done by the compiler.",
    steps: [
      { k: "learn", title: "C with classes", b: [
        `<p>Large C programs become a flat soup of structures and functions with nothing tying related pieces together. In the late 1970s Bjarne Stroustrup extended C with <b>classes</b> (the language was first called “C with Classes”) to organize that soup. C++ projects now run to tens of millions of lines.</p>`,
        seenPP("Where C and C++ came from.", "11-intro-c.html", "Chapter 11"),
      ]},
      { k: "learn", title: "Same machine underneath", b: [
        `<p>Keep one idea in mind for this whole chapter: C++ compiles to <b>the same execution model as C</b>. Functions starting at main, the run-time stack for arguments and locals, the heap for dynamic data, the global section. Every C++ feature here is the compiler doing more of the bookkeeping for you.</p>`,
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "From C to C++: a first program", mins: 20,
    blurb: "Figure 20.1 piece by piece: iostream, namespaces, cout and cin, and three functions all called swap.",
    takeaway: "Most IDEs that compile C also compile C++ (ISO/Standard C++). Figure 20.1 swaps ints, chars and doubles with three swap functions and prints before and after. Namespaces: in large team projects names collide; a namespace makes identifiers distinct from other namespaces (similar to scope); beginners mostly use the global namespace (swap lives there); std:: picks a name from the C++ Standard Library's namespace; :: is the scope operator. I/O: iostream defines cin (like stdin) and cout (like stdout); >> extracts from an input stream, << inserts into an output stream, each item converted to ASCII by its type; std::endl adds a newline. std::cout << \"Provide an integer value: \"; std::cin >> input;. Underneath it's still function calls with arguments and eventually a TRAP.",
    steps: [
      { k: "play", title: "Figure 20.1", b: [
        `<p>You can probably guess what this does already. Click through the new pieces.</p>`,
        fig201,
      ]},
      { k: "learn", title: "Namespaces", b: [
        `<p>In a big project, two people will eventually both write a function called <code>init</code>. A <b>namespace</b> keeps their names apart, like scope for whole libraries. Your own code goes in the global namespace; the standard library lives in <code>std</code>, so you write <code>std::cout</code>. The <code>::</code> is the <b>scope operator</b>.</p>`,
      ]},
      { k: "learn", title: "Streams with << and >>", b: [
        cpp(`int input;
std::cout << "Provide an integer value: ";
std::cin >> input;`),
        `<p><code>&lt;&lt;</code> pushes items into an output stream; <code>&gt;&gt;</code> pulls a value out of an input stream into a variable. No format string: the compiler knows each item's type and converts accordingly. Underneath it's still function calls and, eventually, a TRAP.</p>`,
        seenPP("Streams, printf and scanf.", "18-io-in-c.html", "Chapter 18"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "What is the C++ equivalent of <code>printf(\"%d items\\n\", n);</code>?", opts: [["std::cout << n << \" items\" << std::endl;", true, "Insert n, then the text, then a newline."], ["std::cin >> n >> \" items\";", false, "cin and >> are for input."], ["std::cout >> n;", false, ">> extracts; output uses <<."]] },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "References, overloading, new and delete", mins: 25,
    blurb: "C++ smooths three rough edges of C: pass-by-reference without pointer syntax, one name for many types, and allocation operators.",
    takeaway: "Pass by reference in C needs pointers at the definition and & at every call site (Flight **list in Chapter 19). In C++, mark a parameter with & (void swap(int &x, int &y)) and use it like the original variable; the compiler generates the pointer code: x = y; (equivalent to *x = *y in C) → LDR R0, R5, 4 (x, a reference); LDR R1, R5, 5; LDR R2, R1, 0; STR R2, R0, 0. Only the function changes; call sites stay swap(a, b). Function overloading: functions may share a name if their parameter type lists differ; at each call the argument types select the version; think of the compiler renaming them <code>swap_int_int</code>, <code>swap_char_char</code>, <code>swap_double_double</code>. Templates (later) can replace near-identical overloads. Dynamic allocation: p = new int; … delete p; new and delete are operators (malloc/free are library functions) and also call the type's constructor/destructor. (The book says p is deallocated \"using free\" there; it means delete.) Figure 20.1 compiles to four functions (main plus three swaps) plus library calls.",
    steps: [
      { k: "learn", title: "References", b: [
        `<div class="two"><div class="tile" style="min-width:0"><h3>C (Chapter 16)</h3>${cpp(`void NewSwap(int *x, int *y)
{
   int temp = *x;
   *x = *y;
   *y = temp;
}
...
NewSwap(&a, &b);`)}</div><div class="tile" style="min-width:0"><h3>C++</h3>${cpp(`void swap(int &x, int &y)
{
   int temp = x;
   x = y;
   y = temp;
}
...
swap(a, b);`)}</div></div>`,
        `<p>Same machine code: the compiler still passes addresses. For <code>x = y;</code> it generates exactly the pointer version:</p>`,
        lc3(`LDR R0, R5, #4   ; load x, which is a reference (an address)
LDR R1, R5, #5   ; load y, which is a reference
LDR R2, R1, #0   ; load *y
STR R2, R0, #0   ; *x = *y`),
        `<p>The win: to make a parameter a reference you change only the function, not every call.</p>`,
        seenPP("Call by reference with pointers.", "16-pointers-arrays.html", "Chapter 16"),
      ]},
      { k: "learn", title: "Overloading", b: [
        `<p>Figure 20.1 has three functions named swap. C++ allows it as long as the <b>parameter types differ</b>. At each call, the argument types pick the version. Under the hood, think of the compiler renaming them:</p>`,
        `<div class="tbl"><table style="font-family:var(--mono)"><thead><tr><th>Source</th><th>Becomes (in spirit)</th></tr></thead><tbody><tr><td>swap(a, b) with ints</td><td><code>swap_int_int</code></td></tr><tr><td>swap(c, d) with chars</td><td><code>swap_char_char</code></td></tr><tr><td>swap(x, y) with doubles</td><td><code>swap_double_double</code></td></tr></tbody></table></div>`,
        `<p>So Figure 20.1 compiles into four ordinary functions (main plus three swaps) and some library calls.</p>`,
      ]},
      { k: "learn", title: "new and delete", b: [
        cpp(`int *p;

p = new int;     // allocate one int on the heap
...
delete p;        // give it back`),
        `<p>Operators instead of the library functions malloc and free, and they also run the type's constructor and destructor (next part). <span class="aside">(The book's sentence says p is deallocated “using free”; it means delete.)</span></p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does the C++ compiler actually do when a function takes int &x?", model: "It passes the address of the caller's variable, exactly like a C pointer parameter, and automatically dereferences it wherever x is used inside the function. The programmer writes x as if it were the original variable, and call sites don't need an &." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Classes and methods", mins: 25,
    blurb: "A class is a structure that also owns functions. Every method call quietly passes a pointer to its object: this.",
    takeaway: "Classes refine structures: they add functions as members, hierarchy, and well-defined interfaces; variables of class type are objects. They're primarily an organizational construct (Java and others followed). Figure 20.2: class Triangle { double sideA, sideB, sideC; }; Triangle t1; vs struct Triangle t2; in C. Methods are member functions callable only on an object of the class: double area(); double perimeter(); defined as double Triangle::perimeter() { return sideA + sideB + sideC; } and area using Heron's formula with s = perimeter() / 2: sqrt(s(s−a)(s−b)(s−c)) (needs math.h). Triangle t1; in main allocates exactly the three doubles, the same as the C struct. p1 = t1.perimeter(); compiles to an ordinary call (push, frame, JSR, RET); calling perimeter alone is a compile error. The object is passed implicitly as an extra first argument, the this pointer; members inside methods are accessed through it (Figure 20.5). (In Figure 20.5 the method loads this from R5 − 4; with the book's calling convention the first parameter is at R5 + 4.) Figure 20.6: t1(2.0, 2.0, 3.0) area ≈ 1.984, perimeter 7; t2 = new Triangle(4.2, 7.8, 10.2), accessed with t2->area().",
    steps: [
      { k: "learn", title: "A structure that can act", b: [
        `<div class="two"><div class="tile" style="min-width:0"><h3>C++</h3>${cpp(`class Triangle {
   double sideA;
   double sideB;
   double sideC;
};
Triangle t1;`)}</div><div class="tile" style="min-width:0"><h3>C</h3>${cpp(`struct Triangle {
   double sideA;
   double sideB;
   double sideC;
};
struct Triangle t2;`)}</div></div>`,
        `<p>In memory, t1 and t2 are identical: three doubles. A variable of a class type is called an <b>object</b>.</p>`,
        seenPP("C structures.", "19-dynamic-data.html", "Chapter 19"),
      ]},
      { k: "learn", title: "Methods (Figure 20.3)", b: [
        cpp(`class Triangle {
   double sideA;
   double sideB;
   double sideC;
public:
   double area();
   double perimeter();
};

double Triangle::perimeter()
{
   return sideA + sideB + sideC;
}

double Triangle::area()
{
   double s = perimeter() / 2;

   // Heron's Formula
   return sqrt(s*(s - sideA)*(s - sideB)*(s - sideC));
}`),
        `<p><code>Triangle::</code> says these functions belong to the class. But notice: perimeter adds sideA + sideB + sideC… of <i>which</i> triangle?</p>`,
      ]},
      { k: "learn", title: "The hidden argument: this", b: [
        cpp(`Triangle t1;
double p1;
...
p1 = t1.perimeter();`),
        `<p>A method call compiles to an ordinary function call, with one extra argument pushed automatically: the address of the object, called the <b>this pointer</b>. Inside the method, <code>sideA</code> really means <code>this->sideA</code>.</p>`,
        lc3(`; in main: p1 = t1.perimeter();
      ADD R0, R5, #0    ; address of t1
      ADD R6, R6, #-1   ; push &t1 (the this pointer)
      STR R0, R6, #0
      JSR perimeter
; in perimeter, after the usual preamble:
      LDR R0, R5, #4    ; load this (first parameter, R5 + 4)
      LDR R2, R0, #0    ; this->sideA
      LDR R2, R0, #1    ; this->sideB ... and so on`),
        `<p class="aside">Book slip: Figure 20.5 loads the this pointer with <code>LDR R0, R5, #-4</code>. With the Chapter 14 convention, the first parameter sits at R5 + 4.</p>`,
        seenPP("The calling convention and parameter offsets.", "14-functions.html", "Chapter 14"),
      ]},
      { k: "play", title: "Run Figure 20.6", b: [
        `<p>The program builds t1 and t2 and prints their areas and perimeters. Try the presets, then try to make the area impossible.</p>`,
        triangle,
        `<p>The class happily accepts sides 1, 2, 5, which can't form a triangle, and area() takes the square root of a negative number. A constructor (next part) is the natural place to check.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "Why can't you write <code>p1 = perimeter();</code> in main?", opts: [["perimeter is a method: it needs an object to supply the this pointer", true, "It must be called on a Triangle, like t1.perimeter()."], ["perimeter isn't declared", false, "It's declared in the class."], ["perimeter returns void", false, "It returns double."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a method know which object's members to use?", model: "Every method call passes the object's address as a hidden extra argument, the this pointer. Inside the method, member names like sideA are accessed through this, so the same compiled method works on whichever object it was called on." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Interfaces, constructors, inheritance", mins: 20,
    blurb: "Hide the internals behind public methods, initialize objects automatically, and derive new classes from old ones.",
    takeaway: "Classes formalize abstraction: hide complexity behind a well-defined interface (like transistors → NOT gate → adder, or functions in C). Access specifiers: private members are accessible only within the class (the default: sideA, sideB, sideC); public members from anywhere (area, perimeter after public:). They are compile-time checks, like scope, with no run-time effect: t1.sideA = 10; in main is a compile error. A constructor is a method with the class's name and no return type, called implicitly whenever an object is created (on the stack or via new): Triangle::Triangle(double a, double b, double c) { sideA = a; … }; Triangle t1(2.0, 2.0, 3.0); t2 = new Triangle(4.2, 7.8, 10.2);. Implicitly called functions depart from C's philosophy of explicit control. Destructors run when an object is deleted or goes out of scope. Inheritance: derive classes from a base class (Polygon → Triangle, Quadrilateral, Pentagon) sharing common data and methods, each supplying its own area and perimeter; also a compile-time construct: in the end it's a memory layout plus a JSR to the right method.",
    steps: [
      { k: "learn", title: "public and private", b: [
        `<p>Members are <b>private</b> by default: only the class's own methods can touch them. After <code>public:</code>, members form the class's <b>interface</b>, usable from anywhere. Users of Triangle see area and perimeter; the sides are an implementation detail.</p>`,
        cpp(`Triangle t1;
double a1;
...
t1.sideA = 10;   // This will generate an error
a1 = t1.area();`),
        `<p>It's purely a <b>compile-time</b> check, like scope. At run time nothing guards the memory.</p>`,
      ]},
      { k: "learn", title: "Constructors", b: [
        cpp(`class Triangle {
   double sideA;
   double sideB;
   double sideC;
public:
   Triangle(double a, double b, double c);
   double area();
   double perimeter();
};

Triangle::Triangle(double a, double b, double c)
{
   sideA = a;
   sideB = b;
   sideC = c;
}
...
Triangle t1(2.0, 2.0, 3.0);           // on the stack: constructor runs
Triangle *t2;
t2 = new Triangle(4.2, 7.8, 10.2);    // on the heap: constructor runs`),
        `<p>A method named after the class, with no return type, called <b>automatically</b> whenever an object is created. That's a real departure from C, where nothing happens unless you write the call. (Its partner, the <b>destructor</b>, runs when an object is destroyed.)</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "sort", q: "Does it compile, given the Triangle class above, in main?", bins: ["Compiles", "Compile error"], items: [
          ["double s = t1.area();", 0, "area is public."],
          ["t1.sideB = 4.0;", 1, "sideB is private."],
          ["Triangle t3(3.0, 4.0, 5.0);", 0, "Calls the public constructor."],
          ["double p = t2->perimeter();", 0, "Public method through a pointer."],
        ]},
      ]},
      { k: "learn", title: "Inheritance", b: [
        `<p>Add quadrilaterals and pentagons and you'd copy most of Triangle. Instead, put what's common in a base class <b>Polygon</b> and <b>derive</b> Triangle, Quadrilateral and Pentagon from it, each adding only what differs (its own area and perimeter). Again, a compile-time construct: in the end, a memory layout and a JSR to the right method.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why make a class's data members private and give access only through public methods?", model: "It separates the interface from the implementation. Users can only do what the public methods allow, so they can't put the object into an invalid state or depend on its internal details, and the class's author can change those internals later without breaking the code that uses it." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Containers and templates", mins: 15,
    blurb: "Separate the data type from the data structure: the Standard Template Library's vector holds anything.",
    takeaway: "Building links or storage into a type (like next in Flight) ties it to one data structure; containers separate the type from the structure that holds it. C++'s Standard Template Library (STL) provides prebuilt containers: resizable arrays, linked lists, stacks, queues, maps. vector is a dynamic array: std::vector&lt;Triangle&gt; triVector(10); std::vector&lt;int&gt; intVector(20); intVector[i], intVector.size(), intVector.resize(50); also insert(where, value), erase(where), <code>push_back</code>(value), front(), back() (Table 20.1; the table prints <code>push_back</code> as \"push back\"). Containers are built with templates: type-independent code from which the compiler stamps out versions per type (one template swap could replace Figure 20.1's three). Writing templates is advanced; using STL containers is everyday. Templates, containers and the STL are compiler features, translatable to equivalent C.",
    steps: [
      { k: "learn", title: "Type vs structure", b: [
        `<p>In Chapter 19, the Flight structure had a <code>next</code> pointer baked in, so it only worked in a linked list. A <b>container</b> keeps the data type separate from the structure that holds it. The <b>Standard Template Library (STL)</b> gives ready-made containers: resizable arrays, lists, stacks, queues, maps.</p>`,
      ]},
      { k: "play", title: "std::vector", b: [
        cpp(`std::vector<Triangle> triVector(10);   // Vector of 10 tris
std::vector<int> intVector(20);        // Vector of 20 ints
...
intVector.resize(50);`),
        `<p>A dynamic array that manages its own size. Try the methods from Table 20.1:</p>`,
        vectorWidget,
        `<p>Compare with Chapter 19, where growing an array meant realloc and moving elements by hand.</p>`,
      ]},
      { k: "learn", title: "Templates", b: [
        `<p>vector works for any type because it's a <b>template</b>: code written once with the type as a parameter. The compiler stamps out a version for each type you use, so one template swap could replace Figure 20.1's three overloads. Writing templates is advanced; <i>using</i> STL containers is everyday C++.</p>`,
        `<p>And like everything else in this chapter, it's the compiler's work: the result is the same kind of machine code C produces.</p>`,
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What advantage does <code>std::vector&lt;int&gt;</code> have over a plain C array of ints?", model: "It knows its own size and can grow or shrink with resize, <code>push_back</code>, insert and erase, without the programmer allocating memory or moving elements by hand. A plain C array has a fixed size chosen in advance and no built-in operations." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp20", eyebrow: "Patt & Patel · Chapter 20", title: "Introduction to C++",
    intro: `<p>Six parts: why C++, a first C++ program (namespaces and streams), references, overloading and new/delete, classes with methods and the this pointer, interfaces and constructors, and the STL's vector.</p><p>Through all of it, keep asking what the compiler turns each feature into. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book, ideally compiling them with a real C++ compiler. When a question asks about memory or LC-3 code, translate the C++ feature into the equivalent C first (references → pointers, methods → functions with a this argument).</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <h3>C to C++</h3>
      <p>Same execution model (functions, stack, heap, globals). <code>#include &lt;iostream&gt;</code>, <code>std::cout &lt;&lt; x &lt;&lt; std::endl;</code>, <code>std::cin &gt;&gt; x;</code>; namespaces and <code>::</code>. Reference parameters <code>int &amp;x</code> (pointers under the hood). Overloading by parameter types. <code>new</code>/<code>delete</code>.</p>
      <h3>Classes</h3>
      <p>Data members plus methods (<code>Triangle::area</code>); calls pass the hidden <code>this</code> pointer. <code>private</code> (default) vs <code>public</code> interface, checked at compile time. Constructors run automatically on creation (stack or <code>new</code>); destructors on destruction. Inheritance from base classes.</p>
      <h3>Containers</h3>
      <p>STL containers separate type from structure. <code>std::vector&lt;T&gt;</code>: size, resize, insert, erase, <code>push_back</code>, front, back. Built from templates.</p>`,
  };
  Course.start(window.CHAPTER);
})();
