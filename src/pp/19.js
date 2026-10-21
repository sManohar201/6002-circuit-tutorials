(function () {
  const { S, toggle, readout, el } = Course;
  const { code, esc } = CT;
  const seenPP = (html, href, where) => `<div class="key"><b>Seen earlier:</b> ${html} <a href="${href}">${where} →</a></div>`;
  const fig = (s) => `<div class="fig">${s}</div>`;
  const lc3 = (t) => Digital.listing(t, { comment: ";" });
  const btn = (label, cls = "") => el(`<button type="button" class="btn ${cls}">${label}</button>`);

  const FLIGHT = `struct flightType {
   char ID[7];       // Max 6 characters
   int altitude;     // in meters
   int longitude;    // in tenths of degrees
   int latitude;     // in tenths of degrees
   int heading;      // in tenths of degrees
   double airSpeed;  // in kilometers/hour
};`;

  /* ---------- Figure 19.1: a structure on the stack ---------- */
  function structLayout(host) {
    const F = [...Array.from({ length: 7 }, (_, i) => `plane.ID[${i}]`), "plane.altitude", "plane.longitude", "plane.latitude", "plane.heading", "plane.airSpeed"];
    let pick = 7;
    const out = el(`<div></div>`);
    const draw = () => {
      let s = "";
      const rows = [["y", "R5 − 13"], ...F.map((f, i) => [f, `R5 − ${12 - i}`]), ["x", "R5 + 0"]];
      rows.forEach(([n, a], k) => {
        const isPlane = n.startsWith("plane"), sel = isPlane && F.indexOf(n) === pick;
        s += `<rect x="110" y="${8 + k * 19}" width="170" height="18" style="fill:${sel ? "var(--accent)" : isPlane ? "var(--accent-soft)" : "var(--card)"};stroke:var(--ink);stroke-width:1"/>` + S.t(195, 21 + k * 19, n, { cls: "lab" }) + S.t(100, 21 + k * 19, a, { a: "end", cls: "lab" });
      });
      s += S.t(290, 21 + 1 * 19, "← base of plane", { a: "start", cls: "lab" });
      out.innerHTML = fig(S.svg(470, 8 + rows.length * 19 + 8, s, { max: 470, label: "Run-time stack with int x; Flight plane; int y;" })) +
        readout([["Member", F[pick]], ["Offset from the base of plane", pick], ["Address", `(R5 − 12) + ${pick}`]]);
    };
    const names = ["ID[0]", "altitude", "longitude", "latitude", "heading", "airSpeed"], idx = [0, 7, 8, 9, 10, 11];
    host.append(el(`<p class="mono">int x;  struct flightType plane;  int y;</p>`), toggle(names, (i) => { pick = idx[i]; draw(); }, 1), out); draw();
  }

  /* ---------- stack vs heap lifetime ---------- */
  function lifetime(host) {
    const out = el(`<div></div>`);
    const ST = [
      ["1. f() is running", { stack: "f's frame: int local; Flight *p", heap: "block from malloc (p points here)" }, "Inside f: <code>p = (Flight *) malloc(sizeof(Flight));</code>"],
      ["2. f() returns p", { stack: "(f's frame popped)", heap: "block still allocated" }, "f's locals are gone. The heap block survives, and its address was returned to the caller."],
      ["3. caller uses it", { stack: "main's frame: Flight *q = the address", heap: "block, being used through q" }, "Any function holding the address can use the block."],
      ["4. free(q)", { stack: "main's frame", heap: "(block returned to the heap)" }, "Only an explicit free gives it back. Forget to, and the memory stays reserved (a leak)."],
    ];
    const draw = (i) => {
      const [, z, note] = ST[i];
      const box = (y, title, text, col) => `<rect x="20" y="${y}" width="380" height="54" rx="6" style="fill:${col};stroke:var(--ink)"/>` + S.t(30, y + 20, title, { a: "start", cls: "lab" }) + S.t(210, y + 42, text, { cls: "lab" });
      out.innerHTML = fig(S.svg(420, 140, box(10, "heap", z.heap, z.heap.startsWith("(") ? "var(--card)" : "var(--good-soft)") + box(76, "run-time stack", z.stack, z.stack.startsWith("(") ? "var(--card)" : "var(--cool-soft)"), { max: 420, label: "Stack versus heap lifetime" })) + `<p>${note}</p>`;
    };
    host.append(toggle(ST.map((s) => s[0]), draw, 0), out); draw(0);
  }

  /* ---------- linked list: traversal ---------- */
  function listSVG(ids, opt = {}) {
    const W = 120, y = 40;
    let s = S.t(20, 18, "head", { a: "start", cls: "lab" }) + S.arrow(30, 24, 52, y - 2, "");
    ids.forEach((id, i) => {
      const x = 50 + i * W, hl = opt.cur === i, pv = opt.prev === i, nw = opt.isNew === i;
      s += `<rect x="${x}" y="${y}" width="80" height="34" rx="5" style="fill:${nw ? "var(--good-soft)" : hl ? "var(--accent-soft)" : "var(--card)"};stroke:${pv || hl ? "var(--accent)" : "var(--ink)"};stroke-width:${pv || hl ? 3 : 1}"/><line class="w" x1="${x + 56}" y1="${y}" x2="${x + 56}" y2="${y + 34}"/>` + S.t(x + 28, y + 22, id) + S.t(x + 68, y + 22, "•", { cls: "lab" });
      if (i < ids.length - 1) s += S.arrow(x + 68, y + 17, x + W, y + 17, "");
      else s += S.arrow(x + 68, y + 17, x + 100, y + 17, "") + S.t(x + 104, y + 21, "NULL", { a: "start", cls: "lab" });
      if (hl) s += S.t(x + 40, y + 52, "current", { cls: "lab" });
      if (pv) s += S.t(x + 40, y + 52, "previous", { cls: "lab" });
    });
    if (!ids.length) s += S.t(60, y + 22, "NULL (empty list)", { a: "start", cls: "lab" });
    return S.svg(Math.max(300, 80 + ids.length * W + 60), 100, s, { max: Math.max(300, 80 + ids.length * W + 60), label: "Linked list" });
  }
  function traverse(host) {
    const ids = ["AA21", "DL50", "UA77", "ZA123"];
    let k = 0;
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`);
    const bNext = btn("list = list->next", "primary"), bReset = btn("Start over");
    const draw = () => {
      out.innerHTML = fig(listSVG(ids, { cur: k < ids.length ? k : -1 })) + `<pre class="code">${ids.slice(0, k + 1).filter((_, i) => i < ids.length).map((id, i) => `Aircraft : ${i + 1}\nID    : ${id}`).join("\n")}</pre><p>${k < ids.length ? `list points at node ${k}. Print it, then follow its next pointer.` : "list == NULL: the while loop ends."}</p>`;
      bNext.disabled = k >= ids.length;
    };
    bNext.addEventListener("click", () => { k++; draw(); }); bReset.addEventListener("click", () => { k = 0; draw(); });
    row.append(bNext, bReset); host.append(row, out); draw();
  }

  /* ---------- AddFlight / DeleteFlight, the five cases ---------- */
  function addDelete(host) {
    let list = ["B", "D"];
    const out = el(`<div></div>`), row = el(`<div class="row"></div>`), row2 = el(`<div class="row"></div>`);
    let msg = "Start: the list holds B and D, sorted by ID.", last = {};
    const add = (id) => {
      const before = list.slice(); let i = 0;
      while (i < list.length && list[i] < id) i++;
      if (list[i] === id) { msg = `<b>B Exists</b> case: ${id} is already there. AddFlight returns −1 and changes nothing.`; last = { cur: i }; return; }
      list.splice(i, 0, id);
      const kase = !before.length ? "Empty List" : i === 0 ? "Add at Head" : i === before.length ? "Add at Tail" : "Add to Middle";
      const ptr = !before.length ? "*list = newPlane; newPlane->next = NULL" : i === 0 ? `newPlane->next = ${before[0]}; *list = newPlane (the head pointer changes)` : i === before.length ? `${before[i - 1]}->next = newPlane; newPlane->next = NULL` : `newPlane->next = ${before[i]}; ${before[i - 1]}->next = newPlane`;
      msg = `<b>${kase}</b>: ${ptr}. Two pointers change; no other node moves.`; last = { isNew: i };
    };
    const del = (id) => {
      const i = list.indexOf(id);
      if (!list.length) { msg = "<b>Empty List</b>: nothing to delete, return −1."; last = {}; return; }
      if (i < 0) { msg = `<b>Doesn't Exist</b>: ${id} isn't in the list, return −1.`; last = {}; return; }
      const kase = i === 0 ? "Delete from Head" : i === list.length - 1 ? "Delete from Tail" : "Delete from Middle";
      const ptr = i === 0 ? `*list = ${id}->next` : `${list[i - 1]}->next = ${id}->next`;
      list.splice(i, 1); msg = `<b>${kase}</b>: ${ptr}; free(${id}).`; last = {};
    };
    const draw = () => { out.innerHTML = fig(listSVG(list, last)) + `<p>${msg}</p>`; };
    ["A", "C", "E", "B"].forEach((id) => { const b = btn(`AddFlight ${id}`); b.addEventListener("click", () => { add(id); draw(); }); row.append(b); });
    ["A", "C", "E", "B", "D"].forEach((id) => { const b = btn(`DeleteFlight ${id}`); b.addEventListener("click", () => { del(id); draw(); }); row2.append(b); });
    const r = btn("Reset"); r.addEventListener("click", () => { list = ["B", "D"]; msg = "Start: the list holds B and D."; last = {}; draw(); }); row2.append(r);
    host.append(row, row2, out); draw();
  }

  /* =============== PART 1 =============== */
  const p1 = {
    id: "p1", title: "Structures", mins: 25,
    blurb: "Group several values into one new type: an aircraft's ID, position, heading and speed as a single variable.",
    takeaway: "C natively has ints, floats, chars, bools, plus arrays of and pointers to them; real problems need richer types. A structure is a new type that is a collection of members of simpler types (including pointers, arrays and other structures). Aircraft tracker: char ID[7]; int altitude, longitude, latitude, heading; double airSpeed. Separate arrays per value would be cumbersome. Define struct flightType { … }; then declare struct flightType plane; and access members with the dot: plane.airSpeed = 800.00; plane.altitude = 10000;. General form: struct tag { type1 member1; … } identifiers; (optional variables after the brace). A structure variable is allocated contiguously like any local: with each basic type one LC-3 location, plane takes 12 locations (7 + 4 + 1). Figure 19.1 (int x; plane; int y;): x at R5, plane below it, y above. The compiler's symbol table records each variable's offset from R5 and each member's offset within the structure: plane.altitude = 0; → AND R1, R1, #0; ADD R0, R5, #-12 (base of plane); STR R1, R0, #7.",
    steps: [
      { k: "learn", title: "Why a new type?", b: [
        `<p>To track aircraft over Urbana you need, per aircraft: an ID string, altitude, longitude, latitude, heading and airspeed. Six separate arrays kept in step would be a nightmare. A <b>structure</b> bundles them into one type:</p>`,
        code(FLIGHT),
        `<pre class="code">struct flightType plane;
plane.airSpeed = 800.00;    <span class="cm">// member access with a dot</span>
plane.altitude = 10000;</pre>`,
      ]},
      { k: "play", title: "How it sits in memory (Figure 19.1)", b: [
        `<p>A structure variable is one contiguous block, members in order. With each basic type taking one LC-3 location, plane needs 12. Pick a member and see where the compiler finds it.</p>`,
        structLayout,
        `<p>The compiler knows both offsets from its symbol table, so <code>plane.altitude = 0;</code> becomes:</p>`,
        lc3(`AND R1, R1, #0    ; zero out R1
ADD R0, R5, #-12  ; R0 contains base address of plane
STR R1, R0, #7    ; plane.altitude = 0;`),
        seenPP("The symbol table and offsets from R5.", "12-variables-operators.html", "Chapter 12"),
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "In the same layout, plane.heading is how many locations past the base of plane?", a: 10, tol: 0, why: "ID takes 0–6, then altitude 7, longitude 8, latitude 9, heading 10." },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does the compiler need to know to generate code for plane.altitude?", model: "Where plane starts, as an offset from the frame pointer R5 (from its symbol table), and where the member altitude sits inside the structure, as an offset from the structure's base (from the structure definition). It adds the two to find the location." },
      ]},
    ],
  };

  /* =============== PART 2 =============== */
  const p2 = {
    id: "p2", title: "typedef, arrays of structures, pointers to structures", mins: 25,
    blurb: "Name your types, keep many aircraft in an array, and reach members through a pointer with ->.",
    takeaway: "typedef type name; makes name a synonym for type (typedef int Color; Color pixels[200][100];); typedef struct flightType Flight; lets you write Flight plane;. No new functionality, just clarity. Flight aircraft[100]; is a contiguous array of 100 structures (the size is a guess: what if it's wrong?); aircraft[12] is the 13th; aircraft[0].heading accesses a member. Averaging airspeed loops over all 100 (the book's loop says plane[i]; it means aircraft[i]); tracking how many are real needs extra work. Pointers to structures: Flight *aircraftPtr = &aircraft[34]; (*aircraftPtr).longitude is the same as aircraftPtr->longitude. Figure 19.2 NearestNeighbor calls AirDistance(Flight *, Flight *): passing two pointers pushes 2 locations instead of 24 for two whole structures. (The listing has inconsistencies: <code>TOTAL_FLIGHTS</code> vs <code>TOTAL_AIRCRAFT</code>, closest vs closestAircraft, flightNum vs ID, and minD is never updated.)",
    steps: [
      { k: "learn", title: "typedef", b: [
        `<pre class="code">typedef struct flightType Flight;

Flight plane;          <span class="cm">// same as: struct flightType plane;</span>
typedef int Color;
Color pixels[200][100];</pre>`,
        `<p>A <b>synonym</b>, not a new type: it adds no capability, only readability.</p>`,
      ]},
      { k: "learn", title: "Arrays of structures and ->", b: [
        `<pre class="code">Flight aircraft[100];
aircraft[0].heading                <span class="cm">// element 0, member heading</span>

Flight *aircraftPtr;
aircraftPtr = &aircraft[34];
(*aircraftPtr).longitude           <span class="cm">// follow the pointer, then the member</span>
aircraftPtr->longitude             <span class="cm">// the same thing, shorter</span></pre>`,
        `<p><code>-></code> is so common that C gave it its own operator: “the member of the structure this points to”. The parentheses in the long form are needed because <code>.</code> binds tighter than <code>*</code>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "<code>Flight *p = &aircraft[5];</code> Which expression is aircraft[5]'s altitude?", opts: [["p->altitude", true, "Follow p to the structure, take its altitude member."], ["p.altitude", false, "p is a pointer, not a structure."], ["*p.altitude", false, ". binds first, so this means *(p.altitude): an error."]] },
        { t: "mcq", q: "Why does AirDistance take <code>Flight *</code> parameters instead of whole <code>Flight</code> structures?", opts: [["Pushing two pointers costs 2 locations; pushing two structures would copy 24", true, "Pointers are cheaper to pass."], ["C can't pass structures", false, "It can; it's just costly."], ["So AirDistance can change the aircraft", false, "It only reads them; efficiency is the reason here."]] },
      ]},
      { k: "check", title: "Spot the bug (Figure 19.2)", b: [
        code(`for (int i = 0; i < TOTAL_AIRCRAFT; i++) {
   closest = NULL;          // Initialize
   minD = MAX_DISTANCE;     // Initialize
   for (int j = 0; j < TOTAL_AIRCRAFT; j++) {
      if (i != j) {
         if (AirDistance(&aircraft[i], &aircraft[j]) < minD)
            closest = &aircraft[j];
      }
   }
   printf("The closest aircraft to %s is %s.\\n", ...);
}`, { nums: false }),
        { t: "mcq", q: "Ignoring the naming slips in the listing, what's logically wrong with this search for the nearest aircraft?", opts: [["minD is never updated, so closest ends up as the last aircraft within <code>MAX_DISTANCE</code>, not the nearest", true, "Inside the if it also needs minD = (that distance)."], ["i != j should be i == j", false, "Skipping the aircraft itself is right."], ["closest should be an int", false, "A pointer to the Flight is fine."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does p->member mean?", model: "p is a pointer to a structure. p->member follows the pointer to the structure it points to and then selects that member. It's shorthand for (*p).member." },
      ]},
    ],
  };

  /* =============== PART 3 =============== */
  const p3 = {
    id: "p3", title: "Dynamic memory allocation", mins: 25,
    blurb: "malloc and free: memory that lives on the heap until you say so, sized at run time.",
    takeaway: "A fixed array of Flight is brittle: its size must be guessed (too big wastes space and needs bookkeeping of which slots are real; too small breaks), and inserting or removing in the middle moves lots of data. Memory objects live in one of three places: the run-time stack (locals, freed when their block exits), the global data section, or the heap (dynamically allocated, lifetime controlled by the program's logic). The allocator malloc (C library) manages the heap: asked for a block of some number of bytes, it finds a contiguous block, marks it allocated and returns a pointer; it stays allocated until free returns it. Heap and stack grow toward each other (Figure 19.3). planes = malloc(24 * numAircraft); (Flight = 12 two-byte LC-3 locations = 24 bytes; on a PC maybe 31) is better written with sizeof (a compile-time operator giving an object's or type's size in bytes on the target) and a cast, since malloc returns a generic void *: planes = (Flight *) malloc(sizeof(Flight) * numAircraft); then check for NULL (heap exhausted). The block is contiguous, so planes[29] works. free(ptr) deallocates. Also calloc (zero-initialized) and realloc (grow or shrink, e.g., double the array when full); include stdlib.h. Dynamic arrays live on the heap (usable across functions, resizable) unlike stack-based variable-length arrays.",
    steps: [
      { k: "learn", title: "Three homes for data", b: [
        `<div class="tbl"><table><thead><tr><th>Where</th><th>What lives there</th><th>Freed when</th></tr></thead><tbody><tr><td>run-time stack</td><td>locals</td><td>the function returns</td></tr><tr><td>global data section</td><td>globals</td><td>the program ends</td></tr><tr><td><b>heap</b></td><td>blocks from malloc</td><td>you call <b>free</b></td></tr></tbody></table></div>`,
        `<p>The heap and the stack grow toward each other in the memory map.</p>`,
        seenPP("The LC-3 memory map with the heap.", "12-variables-operators.html", "Chapter 12"),
      ]},
      { k: "play", title: "Outliving a function", b: [
        lifetime,
      ]},
      { k: "learn", title: "malloc done properly", b: [
        code(`int numAircraft;
Flight *planes;

printf("Total number of aircraft?");
scanf("%d", &numAircraft);

planes = (Flight *) malloc(sizeof(Flight) * numAircraft);
if (planes == NULL) {
   printf("Error in malloc...\\n");
   ...`, { nums: false }),
        `<ul><li><b>sizeof(Flight)</b>: its size in bytes on <i>this</i> machine (24 on the LC-3, different on a PC), so the code stays portable.</li><li><b>(Flight *)</b>: malloc returns a generic <code>void *</code>; cast it to the type you're assigning.</li><li><b>Check for NULL</b>: the heap can run out.</li></ul>`,
        `<p>Then <code>planes[29]</code> works like any array. <code>free(planes)</code> gives it back. <code>calloc</code> also zeroes the block; <code>realloc</code> grows or shrinks it. All need <code>stdlib.h</code>.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "num", q: "On the LC-3 (2 bytes per location), how many bytes does malloc(sizeof(int) * 50) request?", a: 100, tol: 0, why: "An int is one 2-byte location: 2 × 50 = 100 bytes." },
        { t: "mcq", q: "A function creates an array that the rest of the program will keep using after the function returns. Where must it live?", opts: [["On the heap, via malloc", true, "Stack storage disappears when the function returns."], ["In a local array", false, "It's popped with the frame."], ["In a variable-length array", false, "Also on the stack, so also gone."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why use sizeof rather than writing the number of bytes yourself?", model: "Because a type's size depends on the machine and compiler: a Flight is 24 bytes on the LC-3 but could be 31 on a PC. sizeof is computed by the compiler for the target machine, so the same code requests the right amount of memory everywhere." },
      ]},
    ],
  };

  /* =============== PART 4 =============== */
  const p4 = {
    id: "p4", title: "Linked lists", mins: 20,
    blurb: "Nodes scattered anywhere in memory, each pointing to the next. Walk one, and see how nodes are created.",
    takeaway: "A linked list is a sequence of nodes (data plus a pointer to the next node) that need not be adjacent in memory; the pointers reconstruct the order. Add Flight *next; to the structure (typedef placed first so the member can say Flight *). The head pointer gives the first node; the tail's next is NULL (like a string's null). Figure 19.4: abstract boxes and arrows vs scattered nodes in memory. Arrays allow random access by index; a simple list must be traversed sequentially from the head. Benefit: nodes are added or deleted by rearranging links, without moving data. Figure 19.5 support code: Flight *airspace = NULL; (empty); CreateFlight mallocs sizeof(Flight), copies the ID with strcpy and fills the members (the listing forgets to return newFlight and to set next); PrintAirspace walks with while (list != NULL) { …; list = list->next; } (the linked-list analog of a for loop over an array). Needs stdlib.h (malloc, free) and string.h (strcpy, strcmp).",
    steps: [
      { k: "learn", title: "Nodes and links", b: [
        code(`typedef struct flightType Flight;
struct flightType {
   char ID[7];       // Max 6 characters
   ...
   double airSpeed;  // in kilometers/hour
   Flight *next;     // Pointer to next element
};`),
        `<p>Each node carries a pointer to the next. The list is reached through a <b>head pointer</b>; the last node's next is <b>NULL</b>. The nodes can be anywhere in the heap: the pointers, not the addresses, give the order.</p>`,
        `<p>The typedef comes first so that the member can be declared as <code>Flight *next</code>.</p>`,
      ]},
      { k: "play", title: "Walking a list", b: [
        code(`while (list != NULL) {
   printf("ID    : %s\\n", list->ID);
   ...
   list = list->next;
}`, { nums: false }),
        `<p>No index and no count: keep following next until NULL. Predict the output order.</p>`,
        traverse,
      ]},
      { k: "check", title: "Spot the bug (Figure 19.5)", b: [
        code(`Flight *CreateFlight(char *ID, int altitude, int longitude,
                     int latitude, int heading, double airspeed)
{
   Flight *newFlight;

   newFlight = (Flight *)malloc(sizeof(Flight));
   strcpy(newFlight->ID, ID);
   newFlight->altitude = altitude;
   newFlight->longitude = longitude;
   newFlight->latitude = latitude;
   newFlight->heading = heading;
   newFlight->airSpeed = airspeed;
}`, { nums: false }),
        { t: "mcq", q: "The book's CreateFlight, as printed, has a serious omission. Which?", opts: [["It never returns newFlight, so the caller gets garbage instead of the node's address", true, "It needs return newFlight; at the end. (Setting next = NULL and checking malloc's result for NULL would be wise too.)"], ["strcpy can't copy into a member", false, "It can: newFlight->ID is a char array."], ["malloc can't allocate structures", false, "sizeof(Flight) bytes is fine."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "How does a program know where a linked list ends?", model: "The last node's next pointer is NULL. A traversal follows next pointers from the head and stops when it reaches NULL, just as string functions stop at the null character." },
      ]},
    ],
  };

  /* =============== PART 5 =============== */
  const p5 = {
    id: "p5", title: "Adding and deleting nodes", mins: 30,
    blurb: "Insert into a sorted list and delete from it by changing a couple of pointers, handling every case: empty, head, middle, tail, duplicate.",
    takeaway: "The list is kept sorted by ID; strcmp(x, y) returns 0 if equal, < 0 if x comes first, > 0 if after. Insert B between A and C: B->next = C; A->next = B (only two values change; compare with shifting a sorted array). Traverse with current and a previous pointer lagging one node. Cases (Figure 19.7): Add to Middle, Empty List (head pointer changes to B, B->next = NULL), Add at Tail (A->next = B, B->next = NULL), Add at Head (head pointer changes to B, B->next = C), B Exists (return −1). Changing the head pointer requires passing it by reference: Flight **list (a pointer to a pointer), as int *x lets *x = *x + 1. (The book writes *list = *list->next; -> binds tighter than *, so it should be *list = (*list)->next.) Figure 19.8: full AddFlight with previous == NULL meaning the head (it has a stray } after return -1). DeleteFlight (Figure 19.9) mirrors it: found → if previous == NULL *list = current->next (delete at head) else previous->next = current->next (middle or tail), then free(current), return 0; reaching a larger ID or the end → doesn't exist, return −1. Empty List and Doesn't Exist behave the same; Middle and Tail are the same since NULL is just another pointer value.",
    steps: [
      { k: "learn", title: "Two pointers, one insertion", b: [
        `<p>To put B between A and C: <code>B->next = C;</code> then <code>A->next = B;</code>. To find A and C, walk with <b>current</b> and a <b>previous</b> pointer one node behind, comparing IDs with <code>strcmp</code> (0 = equal, &lt; 0 = comes first).</p>`,
        `<p>But A or C might not exist. The book lists five cases: <b>Add to Middle</b>, <b>Empty List</b>, <b>Add at Tail</b>, <b>Add at Head</b>, and <b>B Exists</b>.</p>`,
      ]},
      { k: "learn", title: "Changing the head: Flight **list", b: [
        `<p>Adding at the head (or to an empty list) must change the caller's head pointer itself. To change a caller's variable you pass its address, and the variable is a pointer, so the parameter is a <b>pointer to a pointer</b>:</p>`,
        `<pre class="code">int AddFlight(Flight *newPlane, Flight **list);
...
AddFlight(newPlane, &airspace);   <span class="cm">// address of the head pointer</span>
*list = newPlane;                 <span class="cm">// inside: change the caller's head</span></pre>`,
        `<p class="aside">The book writes <code>*list = *list->next;</code>. Since <code>-></code> binds tighter than <code>*</code>, that parses as <code>*(list->next)</code>. The intended code is <code>*list = (*list)->next;</code>.</p>`,
        seenPP("Passing a variable's address so a function can change it.", "16-pointers-arrays.html", "Chapter 16"),
      ]},
      { k: "learn", title: "Figure 19.8: AddFlight", b: [
        code(`int AddFlight(Flight *newPlane, Flight **list)
{
   Flight *previous = NULL;
   Flight *current = *list;
   int IDcompare;

   while (current != NULL) {
      IDcompare = strcmp(newPlane->ID, current->ID);

      if (IDcompare == 0)
         return -1;                      // Exists!
      else if (IDcompare < 0) {
         // Add newPlane in between previous and current nodes
         newPlane->next = current;
         if (previous == NULL)
            *list = newPlane;            // Add At Head
         else
            previous->next = newPlane;   // Add to Middle
         return 0;
      }
      else {
         // Continue traversing thru the list
         previous = current;
         current = current->next;
      }
   }
   newPlane->next = NULL;
   if (previous == NULL)
      *list = newPlane;                  // Empty List
   else
      previous->next = newPlane;         // Add At Tail
   return 0;
}`),
        `<p class="aside">(The printed listing has a stray closing brace after <code>return -1;</code>.)</p>`,
      ]},
      { k: "play", title: "Try every case", b: [
        `<p>The list starts as B, D. Before each click, name the case and the pointers that will change.</p>`,
        addDelete,
        `<p>Deleting (Figure 19.9) mirrors adding: find the node, make the previous node (or the head pointer) skip over it, then <code>free</code> it.</p>`,
      ]},
      { k: "check", title: "Your turn", b: [
        { t: "mcq", q: "In DeleteFlight, why must <code>free(current)</code> come <i>after</i> <code>previous->next = current->next;</code>?", opts: [["After free, current's memory may be reused, so current->next can't be trusted any more", true, "Read what you need from the node, then free it."], ["free changes previous", false, "It doesn't touch previous."], ["The order doesn't matter", false, "Using freed memory is a classic bug."]] },
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "Why does AddFlight need a Flight ** parameter instead of Flight *?", model: "In the Add at Head and Empty List cases it must change the caller's head pointer to point to the new node. To change a caller's variable, a function needs its address; the variable is itself a Flight *, so its address is a Flight **, and the function writes *list = newPlane." },
      ]},
    ],
  };

  /* =============== PART 6 =============== */
  const p6 = {
    id: "p6", title: "Arrays vs. linked lists", mins: 10,
    blurb: "Two ends of a spectrum: each wins at something the other is bad at.",
    takeaway: "Memory: arrays are compact (just the elements, small allocation overhead even on the heap) but must be sized for the worst case; linked lists add a pointer per node plus per-node allocation overhead (significant for small nodes) but use exactly as many nodes as needed. Add/delete: lists rearrange links; arrays need free space and must shift elements to keep data contiguous. Search: arrays allow random access and binary search of sorted data; lists need sequential traversal. Lists improve add/delete at the expense of random access. Many structures in between (hash tables, trees, graphs) come in later courses.",
    steps: [
      { k: "check", title: "Which wins?", b: [
        { t: "sort", q: "Which structure is better at each?", bins: ["Array", "Linked list"], items: [
          ["Jump straight to element 911", 0, "Random access by index."],
          ["Insert in the middle without moving anything", 1, "Just relink two pointers."],
          ["Binary search a sorted collection", 0, "Needs random access to the middle."],
          ["Grow one element at a time with no guess at the maximum size", 1, "Allocate a node whenever one is needed."],
          ["Least memory per element for tiny elements like single ints", 0, "A list spends a pointer (and allocation overhead) per node."],
        ]},
      ]},
      { k: "say", title: "Say it back", b: [
        { t: "say", q: "What does a linked list give up in exchange for cheap insertions and deletions?", model: "Random access. To reach the 29th node you have to start at the head and follow 28 next pointers, so you can't jump to an element or binary search; you also pay a pointer and allocation overhead in every node." },
      ]},
    ],
  };

  window.CHAPTER = {
    id: "pp19", eyebrow: "Patt & Patel · Chapter 19", title: "Dynamic Data Structures in C",
    intro: `<p>Six parts: structures, typedef and pointers to structures, dynamic memory with malloc and free, linked lists, adding and deleting nodes in every case, and how arrays and lists compare.</p><p>The running example is the book's aircraft tracker. Arrow keys ← → move between steps.</p>`,
    after: `<p>Do the chapter's exercises in the book. For linked-list and pointer questions, draw every node as a box with an arrow for each pointer, and redraw the arrows after each statement.</p><p>Stuck? Tell Claude which exercise and what you've tried. You'll get a guiding question first, not the answer.</p>`,
    parts: [p1, p2, p3, p4, p5, p6],
    summary: `
      <h3>Structures</h3>
      <p><code>struct tag { members };</code>, <code>plane.member</code>, contiguous layout with member offsets. <code>typedef struct tag Name;</code>. Arrays of structures; <code>p->member</code> ≡ <code>(*p).member</code>; pass pointers to avoid copying.</p>
      <h3>Dynamic memory</h3>
      <p>Stack (locals), globals, heap (until <code>free</code>). <code>p = (T *) malloc(sizeof(T) * n);</code> check for NULL; <code>free(p)</code>; calloc, realloc; stdlib.h.</p>
      <h3>Linked lists</h3>
      <p>Nodes with a <code>next</code> pointer, a head pointer, NULL at the tail. Traverse with <code>list = list->next</code>. Sorted insert/delete with current and previous; cases: empty, head, middle, tail, exists/doesn't. <code>Flight **list</code> to change the head. Lists: cheap add/delete; arrays: random access, compact.</p>`,
  };
  Course.start(window.CHAPTER);
})();
