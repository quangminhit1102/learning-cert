const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const errors = [];
const notes = [];

function fail(message) {
  errors.push(message);
}

function loadGlobal(file) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(file, "utf8"), sandbox, { filename: file });
  return sandbox.window;
}

function checkFile(rel, label) {
  if (!fs.existsSync(path.join(root, rel))) fail(label + ": missing " + rel);
}

checkFile("index.html", "library");
checkFile("manifest.webmanifest", "pwa");
checkFile("sw.js", "pwa");
checkFile("assets/shell.css", "shell");
checkFile("assets/shell.js", "shell");
checkFile("assets/quiz.js", "shell");
checkFile("assets/cards.js", "shell");
checkFile("assets/diagrams.js", "shell");
checkFile("assets/mock.js", "shell");
checkFile("assets/pwa.js", "shell");

const libraryPath = path.join(root, "assets", "data", "library.js");
if (!fs.existsSync(libraryPath)) fail("Missing assets/data/library.js");
const library = fs.existsSync(libraryPath) ? loadGlobal(libraryPath).LIBRARY || [] : [];
if (!Array.isArray(library)) fail("Library has an invalid format");

const seenIds = new Set();
let certCount = 0;
let chapterCount = 0;

library.forEach((entry) => {
  const label = "cert/" + entry.id;
  if (!entry.id || !entry.slug || !entry.title) fail(label + ": missing id/slug/title");
  const certDir = path.join(root, entry.slug);
  if (!fs.existsSync(certDir)) fail(label + ": missing folder " + entry.slug);
  checkFile(entry.slug + "/index.html", label);
  checkFile(entry.slug + "/data/book.js", label);
  if (entry.built === false) {
    notes.push(label + ": no content yet");
    return;
  }
  certCount += 1;

  const win = loadGlobal(path.join(root, entry.slug, "data", "book.js"));
  const book = win.BOOK;
  if (!book) {
    fail(label + ": data/book.js does not assign window.BOOK");
    return;
  }
  if (book.id !== entry.id) fail(label + ": BOOK.id differs from library.id");
  if (!Array.isArray(book.chapters) || book.chapters.length === 0) fail(label + ": BOOK.chapters is empty");

  const bookIndex = fs.readFileSync(path.join(root, entry.slug, "index.html"), "utf8");
  if (!bookIndex.includes('data-book="' + book.id + '"')) fail(label + ": book index missing data-book");

  book.chapters.forEach((ch, i) => {
    const chLabel = label + "/" + ch.id;
    if (ch.num !== i + 1) fail(chLabel + ": chapter numbers are not sequential");
    const htmlPath = path.join(root, entry.slug, book.chaptersDir || "chapters", ch.file);
    if (!fs.existsSync(htmlPath)) {
      fail(chLabel + ": missing file " + ch.file);
      return;
    }
    chapterCount += 1;
    const html = fs.readFileSync(htmlPath, "utf8");
    if (!html.includes('data-page="chapter"')) fail(chLabel + ": missing data-page=chapter");
    if (!html.includes('data-book="' + book.id + '"')) fail(chLabel + ": missing data-book");
    if (!html.includes('data-chapter="' + ch.id + '"')) fail(chLabel + ": missing data-chapter");
    if (!html.includes('data-data="' + ch.data + '"')) fail(chLabel + ": missing data-data=" + ch.data);
    if (!html.includes('id="cheat-sheet"')) fail(chLabel + ": missing #cheat-sheet");
    if (!html.includes('id="quiz-body"')) fail(chLabel + ": missing #quiz-body");
    if (!html.includes('id="cards-body"')) fail(chLabel + ": missing #cards-body");
    if (!html.includes("../../assets/shell.js")) fail(chLabel + ": does not load shell.js with the correct path");
    if (!html.includes("../../assets/pwa.js")) fail(chLabel + ": does not load pwa.js");

    const dataPath = path.join(root, entry.slug, "data", ch.id + ".js");
    if (!fs.existsSync(dataPath)) {
      fail(chLabel + ": missing data file " + ch.id + ".js");
      return;
    }
    const bank = loadGlobal(dataPath)[ch.data];
    if (!bank) {
      fail(chLabel + ": data file does not assign window." + ch.data);
      return;
    }

    const anchors = new Set(Array.from(html.matchAll(/id="([^"]+)"/g)).map((m) => m[1]));

    (bank.quiz || []).forEach((q) => {
      const qLabel = chLabel + "/" + q.id;
      if (!q.id || !q.q || !q.explain) fail(qLabel + ": missing id, q or explain");
      if (seenIds.has(q.id)) fail(qLabel + ": duplicate global id");
      seenIds.add(q.id);
      if (!["mcq", "fill", "fret", "multi"].includes(q.type)) fail(qLabel + ": invalid type");
      if (q.type === "mcq") {
        if (!Array.isArray(q.options) || q.options.length < 2) fail(qLabel + ": invalid options");
        if (typeof q.answer !== "number" || q.answer < 0 || q.answer >= q.options.length) fail(qLabel + ": answer out of range of options");
      }
      if (q.type === "multi") {
        if (!Array.isArray(q.options) || q.options.length < 2) fail(qLabel + ": invalid options");
        if (!Array.isArray(q.answer) || q.answer.length === 0) fail(qLabel + ": multi answer must be an array");
        else q.answer.forEach((idx) => {
          if (typeof idx !== "number" || idx < 0 || idx >= q.options.length) fail(qLabel + ": multi answer index out of range");
        });
      }
      if (q.type === "fill") {
        const answers = Array.isArray(q.answer) ? q.answer : [q.answer];
        if (answers.some((a) => typeof a !== "string" || !a.trim())) fail(qLabel + ": empty fill answer");
      }
      if (q.type === "fret") {
        if (!Array.isArray(q.answer) || q.answer.length === 0) fail(qLabel + ": missing fret coordinates");
        else q.answer.forEach((pair) => {
          if (!Array.isArray(pair) || pair.length !== 2) fail(qLabel + ": coordinates must be [string, fret]");
          else if (pair[0] < 1 || pair[0] > 6 || pair[1] < 0 || pair[1] > 12) fail(qLabel + ": coordinates outside the tappable range");
        });
      }
      if (q.ref) {
        const anchor = q.ref.replace(/^#/, "");
        if (!anchors.has(anchor)) fail(qLabel + ": ref #" + anchor + " not found in the HTML");
      }
    });

    (bank.cards || []).forEach((card) => {
      const cLabel = chLabel + "/" + card.id;
      if (!card.id || !card.front || !card.back) fail(cLabel + ": missing id, front or back");
      if (seenIds.has(card.id)) fail(cLabel + ": duplicate global id");
      seenIds.add(card.id);
    });

    if (!bank.quiz || bank.quiz.length < 12) fail(chLabel + ": needs at least 12 quiz questions");
    if (!bank.cards || bank.cards.length < 10) fail(chLabel + ": should have at least 10 flashcards");
  });

  const glossaryPath = path.join(root, entry.slug, "data", "glossary.js");
  if (fs.existsSync(glossaryPath)) {
    const glossary = loadGlobal(glossaryPath).GLOSSARY || [];
    glossary.forEach((item) => {
      if (!item.t || !item.vi) fail("glossary/" + item.t + ": missing term or meaning");
    });
    notes.push(label + " glossary: " + glossary.length + " terms");
  }
});

notes.forEach((line) => console.log("· " + line));
if (errors.length) {
  console.error("\n" + errors.length + " error(s):");
  errors.forEach((line) => console.error("  ✗ " + line));
  process.exit(1);
}
console.log("\nOK — " + certCount + "  certificate(s), " + chapterCount + " chapter(s), " + seenIds.size + " valid id(s).");
