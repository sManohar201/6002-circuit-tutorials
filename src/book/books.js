/* Library registry. Each book manifest adds itself to window.BOOKS; this file (loaded after them)
   adds the shared helpers and sets window.BOOK to the book this page belongs to (window.BOOK_KEY). */
(function () {
  const all = window.BOOKS || {};
  Object.values(all).forEach((B) => {
    B.all = () => B.groups.flatMap((g) => g.items);
    B.chapters = () => B.all().filter((c) => typeof c.n === "number");
    B.find = (id) => B.all().find((c) => c.id === id);
    B.pdfName = (c) => B.pdfFile || B.pdfPrefix + c.pdf + ".pdf"; /* one-file books name the whole PDF */
    /* "pp. 26–75" for books whose file names are PDF pages, "pp. 1–54" (printed pages) when a chapter lists `pages`. */
    B.pagesLabel = (c) => (c.pages ? "book pp. " + c.pages : "pp. " + c.pdf).replace("-", "–") + (B.pdfFile && c.pages ? ", PDF pp. " + c.pdf.replace("-", "–") : "");
    B.probsLabel = (c) => (c.probs ? `page ${c.probs} of that PDF${c.probsBook && c.probsBook !== c.probs ? ` (book page ${c.probsBook})` : ""}` : "");
  });
  window.BOOK = all[window.BOOK_KEY] || null;
})();
