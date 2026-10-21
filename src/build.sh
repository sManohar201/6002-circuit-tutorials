#!/usr/bin/env sh
# Builds the library into self-contained HTML pages:
#   index.html                   library page: one card per book (src/book/library.js)
#   6002.html, edc.html, math.html  each book's contents page (src/book/cover.js)
#   chapters/NN-<slug>.html      6.002 chapter pages (src/engine/* + src/chapters/chNN.js)
#   edc/NN-<slug>.html           Boylestad chapter pages (src/engine/* + src/edc/NN.js)
#   math.html, math/NN-<slug>.html  Math Toolkit (src/book/math.js manifest, src/math/NN.js modules)
#   pp.html, hh.html, vlsi.html + pp/, hh/, vlsi/  Patt & Patel, Harris & Harris, Weste & Harris (src/book/<key>.js, src/<key>/NN.js)
# Usage: sh src/build.sh            (run from anywhere)
# To add a chapter: write its source file, add a line to that book's list below,
# and set `file` and `parts` for it in the book's manifest (src/book/book.js or src/book/edc.js).
set -e
SRC="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$SRC")"

# 6.002 (Agarwal & Lang). source file | output file | page title
CHAPTERS="
ch01.js|01-circuit-abstraction.html|Ch 1 · The Circuit Abstraction
ch02.js|02-resistive-networks.html|Ch 2 · Resistive Networks
ch03.js|03-network-theorems.html|Ch 3 · Network Theorems
ch04.js|04-nonlinear-circuits.html|Ch 4 · Analysis of Nonlinear Circuits
ch05.js|05-digital-abstraction.html|Ch 5 · The Digital Abstraction
ch06.js|06-mosfet-switch.html|Ch 6 · The MOSFET Switch
ch07.js|07-mosfet-amplifier.html|Ch 7 · The MOSFET Amplifier
ch08.js|08-small-signal-model.html|Ch 8 · The Small-Signal Model
ch09.js|09-energy-storage.html|Ch 9 · Energy Storage Elements
ch10.js|10-first-order-transients.html|Ch 10 · First-Order Transients
ch11.js|11-energy-power-digital.html|Ch 11 · Energy and Power in Digital Circuits
ch12.js|12-second-order-transients.html|Ch 12 · Transients in Second-Order Circuits
ch13.js|13-sinusoidal-steady-state.html|Ch 13 · Sinusoidal Steady State: Impedance and Frequency Response
ch14.js|14-resonance.html|Ch 14 · Sinusoidal Steady State: Resonance
ch15.js|15-op-amp.html|Ch 15 · The Operational Amplifier Abstraction
ch16.js|16-diodes.html|Ch 16 · Diodes
appA.js|appA-lumped-matter.html|App A · Maxwell's Equations and the Lumped Matter Discipline
appB.js|appB-trig.html|App B · Trigonometric Functions and Identities
appC.js|appC-complex-numbers.html|App C · Complex Numbers
appD.js|appD-linear-equations.html|App D · Solving Simultaneous Linear Equations
"

head_tags() {
  printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
  printf '<title>%s</title>\n' "$1"
  printf '<meta name="claude:viewport-fit-sides" content="cover">\n'
  printf '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
  printf '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=JetBrains+Mono:wght@500;700&display=swap">\n'
  printf '<style>\n:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}\nbody{margin:0}\nimg{max-width:100%%}\n[hidden]{display:none!important}\n'
  cat "$SRC/engine/engine.css"
}

# Boylestad & Nashelsky. source file | output file | page title
EDC_CHAPTERS="
01.js|01-semiconductor-diodes.html|Boylestad Ch 1 · Semiconductor Diodes
02.js|02-diode-applications.html|Boylestad Ch 2 · Diode Applications
03.js|03-bjts.html|Boylestad Ch 3 · Bipolar Junction Transistors
04.js|04-dc-biasing-bjts.html|Boylestad Ch 4 · DC Biasing: BJTs
05.js|05-bjt-ac-analysis.html|Boylestad Ch 5 · BJT AC Analysis
06.js|06-fets.html|Boylestad Ch 6 · Field-Effect Transistors
07.js|07-fet-biasing.html|Boylestad Ch 7 · FET Biasing
08.js|08-fet-amplifiers.html|Boylestad Ch 8 · FET Amplifiers
09.js|09-frequency-response.html|Boylestad Ch 9 · BJT and JFET Frequency Response
10.js|10-op-amps.html|Boylestad Ch 10 · Operational Amplifiers
11.js|11-op-amp-applications.html|Boylestad Ch 11 · Op-Amp Applications
12.js|12-power-amplifiers.html|Boylestad Ch 12 · Power Amplifiers
13.js|13-linear-digital-ics.html|Boylestad Ch 13 · Linear-Digital ICs
14.js|14-feedback-oscillators.html|Boylestad Ch 14 · Feedback and Oscillator Circuits
15.js|15-power-supplies.html|Boylestad Ch 15 · Power Supplies
16.js|16-two-terminal-devices.html|Boylestad Ch 16 · Other Two-Terminal Devices
17.js|17-pnpn-devices.html|Boylestad Ch 17 · pnpn and Other Devices
A.js|appA-hybrid-parameters.html|Boylestad App A · Hybrid Parameters
B.js|appB-ripple.html|Boylestad App B · Ripple Factor and Voltage Calculations
C.js|appC-tables.html|Boylestad App C · Charts and Tables
"

# Math Toolkit. source file | output file | page title
MATH_CHAPTERS="
01.js|01-numbers-units.html|Math 1 · Numbers, Prefixes and Units
02.js|02-rearranging.html|Math 2 · Rearranging Formulas
03.js|03-ratios-percent.html|Math 3 · Fractions, Ratios and Percent
04.js|04-approximations.html|Math 4 · Approximations
05.js|05-lines.html|Math 5 · Lines, Graphs and Load Lines
07.js|07-quadratics.html|Math 7 · Quadratic Equations
08.js|08-exp-log.html|Math 8 · Exponentials and Logarithms
09.js|09-decibels.html|Math 9 · Decibels and Log Scales
10.js|10-sinusoids.html|Math 10 · Sinusoids
13.js|13-derivatives.html|Math 13 · Derivatives
14.js|14-integrals.html|Math 14 · Integrals and Averages
15.js|15-diff-eqs.html|Math 15 · Differential Equations
16.js|16-bode.html|Math 16 · Transfer Functions and Bode Plots
17.js|17-binary-boolean.html|Math 17 · Binary and Boolean Algebra
18.js|18-partial-fractions.html|Math 18 · Polynomials and Partial Fractions
19.js|19-laplace-intro.html|Math 19 · Laplace: the Idea and the Table
20.js|20-laplace-properties.html|Math 20 · Laplace Properties
21.js|21-inverse-laplace.html|Math 21 · Inverse Laplace Transforms
22.js|22-laplace-odes.html|Math 22 · Solving Differential Equations with Laplace
23.js|23-s-domain.html|Math 23 · Circuits in the s-Domain
24.js|24-matrices.html|Math 24 · Vectors and Matrices
25.js|25-circuit-matrices.html|Math 25 · Solving Circuits with Matrices
26.js|26-eigenvalues.html|Math 26 · Eigenvalues and Eigenvectors
27.js|27-sensitivity.html|Math 27 · Sensitivity and Error Budgets
28.js|28-numerical-methods.html|Math 28 · Numerical Methods: How Simulators Think
29.js|29-series.html|Math 29 · Series and Approximations
30.js|30-fourier-series.html|Math 30 · Fourier Series
31.js|31-fourier-transform.html|Math 31 · The Fourier Transform and Spectra
32.js|32-sampling.html|Math 32 · Sampling, Aliasing and Quantization
33.js|33-z-transform.html|Math 33 · Discrete-Time Systems and the z-Transform
34.js|34-probability.html|Math 34 · Probability and Random Variables
35.js|35-normal-yield.html|Math 35 · The Normal Distribution, Mismatch and Yield
36.js|36-noise.html|Math 36 · Random Signals and Noise
37.js|37-feedback.html|Math 37 · Feedback Systems
38.js|38-stability.html|Math 38 · Stability and Compensation
39.js|39-fields.html|Math 39 · Fields, Flux and Diffusion
"

# Patt & Patel. source file | output file | page title
PP_CHAPTERS="
01.js|01-welcome-aboard.html|Patt & Patel Ch 1 · Welcome Aboard
02.js|02-bits-data-types.html|Patt & Patel Ch 2 · Bits, Data Types, and Operations
03.js|03-digital-logic-structures.html|Patt & Patel Ch 3 · Digital Logic Structures
04.js|04-von-neumann.html|Patt & Patel Ch 4 · The von Neumann Model
05.js|05-lc3.html|Patt & Patel Ch 5 · The LC-3
06.js|06-programming.html|Patt & Patel Ch 6 · Programming
07.js|07-assembly.html|Patt & Patel Ch 7 · Assembly Language
08.js|08-data-structures.html|Patt & Patel Ch 8 · Data Structures
09.js|09-io.html|Patt & Patel Ch 9 · I/O
10.js|10-calculator.html|Patt & Patel Ch 10 · A Calculator
11.js|11-intro-c.html|Patt & Patel Ch 11 · Introduction to C/C++
12.js|12-variables-operators.html|Patt & Patel Ch 12 · Variables and Operators
13.js|13-control-structures.html|Patt & Patel Ch 13 · Control Structures
14.js|14-functions.html|Patt & Patel Ch 14 · Functions
15.js|15-testing-debugging.html|Patt & Patel Ch 15 · Testing and Debugging
16.js|16-pointers-arrays.html|Patt & Patel Ch 16 · Pointers and Arrays
17.js|17-recursion.html|Patt & Patel Ch 17 · Recursion
18.js|18-io-in-c.html|Patt & Patel Ch 18 · I/O in C
19.js|19-dynamic-data.html|Patt & Patel Ch 19 · Dynamic Data Structures in C
20.js|20-intro-cpp.html|Patt & Patel Ch 20 · Introduction to C++
A.js|appA-lc3-isa.html|Patt & Patel App A · The LC-3 ISA
B.js|appB-lc3-to-x86.html|Patt & Patel App B · From LC-3 to x86
C.js|appC-lc3-microarchitecture.html|Patt & Patel App C · The Microarchitecture of the LC-3
D.js|appD-c-language.html|Patt & Patel App D · The C Programming Language
E.js|appE-tables.html|Patt & Patel App E · Useful Tables
"

# Harris & Harris. source file | output file | page title
HH_CHAPTERS="
01.js|01-zero-to-one.html|Harris & Harris Ch 1 · From Zero to One
02.js|02-combinational-logic.html|Harris & Harris Ch 2 · Combinational Logic Design
03.js|03-sequential-logic.html|Harris & Harris Ch 3 · Sequential Logic Design
04.js|04-hdl.html|Harris & Harris Ch 4 · Hardware Description Languages
05.js|05-building-blocks.html|Harris & Harris Ch 5 · Digital Building Blocks
06.js|06-architecture.html|Harris & Harris Ch 6 · Architecture
07.js|07-microarchitecture.html|Harris & Harris Ch 7 · Microarchitecture
08.js|08-memory-systems.html|Harris & Harris Ch 8 · Memory and I/O Systems
A.js|appA-implementation.html|Harris & Harris App A · Digital System Implementation
B.js|appB-mips-instructions.html|Harris & Harris App B · MIPS Instructions
C.js|appC-c-programming.html|Harris & Harris App C · C Programming
"

# Weste & Harris. source file | output file | page title
VLSI_CHAPTERS="
01.js|01-introduction.html|CMOS VLSI Ch 1 · Introduction
02.js|02-mos-transistor.html|CMOS VLSI Ch 2 · MOS Transistor Theory
03.js|03-processing.html|CMOS VLSI Ch 3 · CMOS Processing Technology
04.js|04-delay.html|CMOS VLSI Ch 4 · Delay
05.js|05-power.html|CMOS VLSI Ch 5 · Power
06.js|06-interconnect.html|CMOS VLSI Ch 6 · Interconnect
07.js|07-robustness.html|CMOS VLSI Ch 7 · Robustness
08.js|08-simulation.html|CMOS VLSI Ch 8 · Circuit Simulation
09.js|09-combinational.html|CMOS VLSI Ch 9 · Combinational Circuit Design
10.js|10-sequential.html|CMOS VLSI Ch 10 · Sequential Circuit Design
11.js|11-datapath.html|CMOS VLSI Ch 11 · Datapath Subsystems
12.js|12-arrays.html|CMOS VLSI Ch 12 · Array Subsystems
13.js|13-special-purpose.html|CMOS VLSI Ch 13 · Special-Purpose Subsystems
14.js|14-methodology.html|CMOS VLSI Ch 14 · Design Methodology and Tools
15.js|15-testing.html|CMOS VLSI Ch 15 · Testing, Debugging, and Verification
A.js|appA-hdl.html|CMOS VLSI App A · Hardware Description Languages
"

# Every page carries every manifest (so lessons can link across books), then picks its own book.
scripts() {
  printf '<script>
window.BOOK_KEY = "%s";
</script>
' "$1"
  for f in book.js edc.js pp.js hh.js vlsi.js math.js books.js progress.js; do printf '<script>
'; cat "$SRC/book/$f"; printf '</script>
'; done
}

# build_chapters <book key> <source dir> <output dir> <list> ["extra engine files"]
build_chapters() {
  mkdir -p "$ROOT/$3"
  echo "$4" | while IFS='|' read -r js out title; do
    [ -z "$js" ] && continue
    [ -f "$SRC/$2/$js" ] || { echo "skipped $2/$js (not written yet)"; continue; }
    {
      head_tags "$title"
      printf '</style>
</head>
<body>
<div id="app"></div>
'
      scripts "$1"
      printf '<script>
'; cat "$SRC/engine/engine.js"; printf '</script>
'
      for extra in $5; do printf '<script>
'; cat "$SRC/engine/$extra"; printf '</script>
'; done
      printf '<script>
'; cat "$SRC/$2/$js"; printf '</script>
'
      printf '</body>
</html>
'
    } > "$ROOT/$3/$out"
    echo "built $3/$out"
  done
}

# page <output> <title> <book key> <script>
page() {
  {
    head_tags "$2"
    cat "$SRC/book/cover.css"
    printf '</style>
</head>
<body>
<div id="app"></div>
'
    scripts "$3"
    printf '<script>
'; cat "$SRC/book/$4"; printf '</script>
'
    printf '</body>
</html>
'
  } > "$ROOT/$1"
  echo "built $1"
}

build_chapters 6002 chapters chapters "$CHAPTERS"
build_chapters edc edc edc "$EDC_CHAPTERS"
build_chapters math math math "$MATH_CHAPTERS"
build_chapters pp pp pp "$PP_CHAPTERS" "digital.js lc3.js ctrace.js"
build_chapters hh hh hh "$HH_CHAPTERS" "digital.js mips.js"
build_chapters vlsi vlsi vlsi "$VLSI_CHAPTERS" digital.js
page 6002.html "6.002 Circuit Tutorials" 6002 cover.js
page edc.html "Electronic Devices Tutorials" edc cover.js
page math.html "Math Toolkit" math cover.js
page pp.html "Computing Systems Tutorials" pp cover.js
page hh.html "Digital Design Tutorials" hh cover.js
page vlsi.html "CMOS VLSI Tutorials" vlsi cover.js
page index.html "Circuits Library" "" library.js
