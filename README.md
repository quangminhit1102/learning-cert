# Certification Library

A static website for studying certifications on your phone: notes, quiz, flashcards, mock tests and
spaced repetition. Installable as a PWA and usable offline after the first open.

## Structure

```
index.html                 certificate library
assets/                    shared shell (CSS, JS, mock engine, icons, service worker)
<cert-slug>/               one folder per certificate
  index.html               dashboard (progress + study plan)
  chapters/                chapter pages
  data/                    book.js, chXX.js, glossary.js
  mock.html  wrong.html    mock test + missed-question review
docs/adding-a-cert.md      how to add a new certificate
```

## Run locally

```
python -m http.server 8123
```

Open `http://127.0.0.1:8123/`.

## Validate data

```
node tools/validate.js
```

## Deploy

Push to `main`; GitHub Pages builds automatically. Bump `VERSION` in `sw.js` when you change content.
