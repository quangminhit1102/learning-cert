# Thêm một chứng chỉ mới

Mỗi chứng chỉ là một mục trong thư viện, dùng chung shell. Chỉ cần dữ liệu và nội dung của nó.

## 1. Tạo thư mục

Đặt tên theo `tên-nhà-cung-cấp`, viết thường, gạch nối. Ví dụ:
`github-copilot-gh300/`

```
<slug>/
  index.html            dashboard (tiến độ + kế hoạch 7 ngày)
  chapters/ch01-....html
  data/book.js          window.BOOK
  data/chXX.js          window.CHXX
  data/glossary.js      window.GLOSSARY (tùy chọn)
  mock.html             mock test trộn câu
  wrong.html            ôn câu đã sai
```

## 2. Khai báo trong thư viện

Thêm entry vào `assets/data/library.js`:

```js
window.LIBRARY = [
  {
    id: "gh300",
    slug: "github-copilot-gh300",
    code: "GH3",
    title: "GitHub Copilot (GH-300)",
    author: "Microsoft",
    chapters: 8,
    built: true,
    keywords: ["copilot", "ai", "github"]
  }
];
```

## 3. Khai báo sách trong `data/book.js`

```js
window.BOOK = {
  id: "gh300",
  slug: "github-copilot-gh300",
  title: "GitHub Copilot (GH-300)",
  shortTitle: "GH-300",
  author: "Microsoft",
  chaptersDir: "chapters",
  chapters: [
    { id: "ch01", num: 1, title: "...", vi: "...", file: "ch01-....html", data: "CH01", built: true, keywords: [] }
  ]
};
```

## 4. Trang chương

Copy một chương mẫu rồi sửa:
- `<body data-page="chapter" data-book="gh300" data-chapter="ch01" data-data="CH01" data-root="../.." data-book-root="..">`
- Scripts: `../data/book.js`, `../data/chXX.js`, `../../assets/diagrams.js`, `../../assets/shell.js`,
  `../../assets/quiz.js`, `../../assets/cards.js`, `../../assets/pwa.js`.

## 5. Dữ liệu chương

```js
window.CH01 = {
  quiz: [ { id: "c1q1", type: "mcq", q, options, answer, explain, ref: "#..." } ],
  cards: [ { id: "c1f1", front, back, hint } ]
};
```

Mỗi chương ≥12 câu quiz, ≥12 thẻ; `ref` trỏ tới `id` có trong HTML.

## 6. PWA

Thêm file của chứng chỉ vào `PRECACHE` trong `sw.js` và tăng `VERSION`.

## 7. Kiểm tra

`node tools/validate.js`, rồi mở thư viện và chứng chỉ ở 375/390/430px để chắc không tràn ngang.
