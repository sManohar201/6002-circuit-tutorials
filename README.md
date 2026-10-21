# Circuits Library

Interactive tutorials for each chapter of six textbooks. Each tutorial covers one chapter, one idea per card: you play with something, predict, then see the idea. After a chapter's tutorial, go straight to that chapter's exercises and problems in the book.

| Book | Contents page | Chapter pages |
|---|---|---|
| Agarwal & Lang, *Foundations of Analog and Digital Electronic Circuits* (MIT 6.002) | `6002.html` | `chapters/` |
| Boylestad & Nashelsky, *Electronic Devices and Circuit Theory* | `edc.html` | `edc/` |
| Math Toolkit | `math.html` | `math/` |
| Patt & Patel, *Introduction to Computing Systems* | `pp.html` | `pp/` |
| Harris & Harris, *Digital Design and Computer Architecture* | `hh.html` | `hh/` |
| Weste & Harris, *CMOS VLSI Design* | `vlsi.html` | `vlsi/` |

## Read it

Open `index.html` in a browser. It's the library page and links to every book. Nothing to install, and it works offline (fonts fall back to system fonts without internet).

Progress saves in your browser's local storage, separately for each browser.

## Layout

```
index.html                  library page (built)
<book>.html                 each book's contents page (built)
chapters/ edc/ math/ pp/ hh/ vlsi/   chapter pages (built)
src/
  build.sh                  builds everything above
  book/                     per-book manifests (chapters, page ranges) and contents-page code
  engine/                   shared tutorial engine (cards, quizzes, sliders, schematics, simulators)
  chapters/ edc/ math/ pp/ hh/ vlsi/   one source file per chapter
archive/                    early experiments, not part of the library
```

## Build

Needs only `sh` (Git Bash on Windows works).

```sh
sh src/build.sh
```

The built HTML files are committed too, so the library opens without building.

## Add a chapter

1. Write the chapter's source file under `src/<book>/`.
2. Add a line for it to that book's list in `src/build.sh`.
3. Set `file` and `parts` for it in the book's manifest under `src/book/`.
4. Run `sh src/build.sh`.

## Not included

The book PDFs are copyrighted and are not part of this repo (`.gitignore` excludes `*.pdf`).
