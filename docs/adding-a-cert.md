# Add a new certificate

Each certificate is an entry in the library and shares the shell. Only its own data and content are needed.

## 1. Create a folder

Name it after the provider, lowercase, hyphenated. Example: `github-copilot-gh300/`

```
<slug>/
  index.html            dashboard (progress + 7-day plan)
  chapters/ch01-....html
  data/book.js          window.BOOK
  data/chXX.js          window.CHXX
  data/glossary.js      window.GLOSSARY (optional)
  mock.html             mixed mock test
  wrong.html            review missed questions
```

## 2. Register in the library

Add an entry to `assets/data/library.js`:

```js
window.LIBRARY = [
  {
    id: "gh300",
    slug: "github-copilot-gh300",
    code: "GH-300",
    title: "GitHub Copilot (GH-300)",
    author: "Microsoft",
    version: "1.0",
    chapters: 8,
    built: true,
    keywords: ["copilot", "ai", "github"]
  }
];
```

`version` is shown on the library card and drives the per-cert Install / Update controls. Bump it (and
bump `VERSION` in `sw.js`) whenever you change that certificate's content.

## 3. Declare the book in `data/book.js`

```js
window.BOOK = {
  id: "gh300",
  slug: "github-copilot-gh300",
  title: "GitHub Copilot (GH-300)",
  shortTitle: "GH-300",
  author: "Microsoft",
  hasGlossary: false,
  chaptersDir: "chapters",
  chapters: [
    { id: "ch01", num: 1, title: "...", vi: "...", file: "ch01-....html", data: "CH01", built: true, keywords: [] }
  ]
};
```

## 4. Chapter pages

Copy a sample chapter, then change:
- `<body data-page="chapter" data-book="gh300" data-chapter="ch01" data-data="CH01" data-root="../.." data-book-root="..">`
- Scripts: `../data/book.js`, `../data/chXX.js`, `../../assets/shell.js`, `../../assets/quiz.js`,
  `../../assets/cards.js`, `../../assets/pwa.js`.

## 5. Chapter data

```js
window.CH01 = {
  quiz: [ { id: "c1q1", type: "mcq", q, options, answer, explain, ref: "#..." } ],
  cards: [ { id: "c1f1", front, back, hint } ]
};
```

Each chapter needs at least 12 quiz questions and 10 cards; `ref` must point to an existing `id` in the HTML.

## 6. PWA

Add the certificate's files to `PRECACHE` in `sw.js` and bump `VERSION`.

## 7. Validate

Run `node tools/validate.js`, then open the library and the certificate at 375/390/430px to confirm no horizontal overflow.
