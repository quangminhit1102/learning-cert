# Thư viện chứng chỉ

Web tĩnh để ôn thi chứng chỉ trên điện thoại: ghi chú, quiz, flashcard, mock test, ôn tập ngắt quãng.
Cài được lên màn hình chính (PWA) và dùng offline sau lần mở đầu tiên.

## Cấu trúc

```
index.html                 thư viện chứng chỉ
assets/                    shell dùng chung (CSS, JS, mock engine, icon, service worker)
<cert-slug>/               mỗi chứng chỉ một thư mục
  index.html               dashboard (tiến độ + kế hoạch ôn thi)
  chapters/                trang chương
  data/                    book.js, chXX.js, glossary.js
  mock.html  wrong.html    mock test + ôn câu sai
docs/adding-a-cert.md      cách thêm chứng chỉ mới
```

## Chạy tại máy

```
python -m http.server 8123
```

Mở `http://127.0.0.1:8123/`.

## Kiểm tra dữ liệu

```
node tools/validate.js
```

## Triển khai

Push lên `main`; GitHub Pages tự build. Tăng `VERSION` trong `sw.js` khi sửa nội dung.
