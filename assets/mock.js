(function () {
  const body = document.body;
  if (body.dataset.page !== "mock" && body.dataset.page !== "wrong") return;
  const host = document.getElementById("mock-body");
  if (!host || !window.BOOK) return;

  const bookId = window.BOOK.id;
  const WRONG_KEY = "gt.wrong.v2." + bookId;
  const MOCK_KEY = "gt.mock.v2." + bookId;

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {}
  }

  function pool() {
    const out = [];
    window.BOOK.chapters.forEach((ch) => {
      const bank = window[ch.data];
      if (!bank || !bank.quiz) return;
      bank.quiz.forEach((q) => {
        if (q.type !== "fret") out.push({ question: q, chapter: ch });
      });
    });
    return out;
  }

  function shuffle(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function normalize(value) {
    return String(value).toLowerCase().trim();
  }

  function isCorrect(q, answer) {
    if (q.type === "fill") {
      const accepted = Array.isArray(q.answer) ? q.answer : [q.answer];
      return accepted.some((a) => normalize(a) === normalize(answer));
    }
    return answer === q.answer;
  }

  const wrongPage = body.dataset.page === "wrong";
  const savedWrong = readJSON(WRONG_KEY, []);
  let deck = [];
  let index = 0;
  let answered = false;
  let correctCount = 0;
  let sessionWrong = [];

  if (wrongPage) {
    if (savedWrong.length === 0) {
      host.innerHTML = '<div class="empty">Chưa có câu sai nào. Làm quiz hoặc mock test để hệ thống tự ghi lại câu bạn sai.</div>';
      return;
    }
    const all = pool();
    const map = new Map(all.map((item) => [item.question.id, item]));
    deck = savedWrong.map((entry) => map.get(entry.id)).filter(Boolean);
    if (deck.length === 0) {
      host.innerHTML = '<div class="empty">Danh sách câu sai đã lỗi thời. Hãy làm quiz hoặc mock test mới.</div>';
      return;
    }
    deck = shuffle(deck);
  } else {
    const all = pool();
    const count = Math.min(Number(body.dataset.count) || 20, all.length);
    deck = shuffle(all).slice(0, count);
  }

  const total = deck.length;

  function renderList() {
    host.innerHTML = '<div class="wrong-head"><h2>Câu đã sai</h2><span class="badge">' + deck.length + " câu</span>" +
      '<button class="btn primary" type="button" id="wrong-retry">Ôn lại các câu sai</button></div>' +
      '<div class="wrong-list">' + deck.map((item, i) => {
        const q = item.question;
        return '<details><summary><span class="w-num">' + (i + 1) + "</span> " + q.q + "</summary>" +
          '<div class="feedback no"><strong>' + (q.type === "mcq" ? q.options[q.answer] : (Array.isArray(q.answer) ? q.answer[0] : q.answer)) + "</strong> · " + q.explain + "</div></details>";
      }).join("") + "</div>";
    document.getElementById("wrong-retry").addEventListener("click", () => {
      index = 0;
      correctCount = 0;
      sessionWrong = [];
      deck = shuffle(deck);
      renderQuestion();
    });
  }

  function renderQuestion() {
    if (index >= deck.length) {
      renderResult();
      return;
    }
    answered = false;
    const item = deck[index];
    const q = item.question;
    document.getElementById("mock-meta").textContent = (index + 1) + "/" + total;

    let html = '<p class="q-text">' + q.q + "</p>";
    if (q.type === "mcq") {
      html += '<div class="opts">' + q.options.map((opt, i) =>
        '<button type="button" class="opt" data-i="' + i + '"><span class="key">' + (i + 1) + "</span><span>" + opt + "</span></button>").join("") + "</div>";
    } else {
      html += '<div class="fill-row"><input id="q-fill" type="text" autocomplete="off" spellcheck="false" placeholder="Nhập đáp án..."><button class="btn primary" type="button" id="q-check">Kiểm tra</button></div>';
    }
    html += '<div class="quiz-foot"><span class="spacer"></span><div id="q-feedback" class="feedback" hidden></div>' +
      '<button class="btn primary" type="button" id="q-next" hidden>Câu tiếp</button></div>';
    host.innerHTML = html;

    const opts = host.querySelectorAll(".opt");
    opts.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (answered) return;
        const i = Number(btn.dataset.i);
        const correct = isCorrect(q, i);
        if (correct) btn.classList.add("correct");
        else {
          btn.classList.add("wrong");
          opts[q.answer].classList.add("correct");
        }
        opts.forEach((node) => { node.disabled = true; });
        markAnswer(correct, q);
      });
    });

    const fillInput = document.getElementById("q-fill");
    if (fillInput) {
      const check = document.getElementById("q-check");
      check.addEventListener("click", () => markAnswer(isCorrect(q, fillInput.value), q));
      fillInput.addEventListener("keydown", (ev) => { if (ev.key === "Enter") markAnswer(isCorrect(q, fillInput.value), q); });
      fillInput.focus();
    }
  }

  function markAnswer(correct, q) {
    if (answered) return;
    answered = true;
    if (correct) correctCount += 1;
    else sessionWrong.push({ id: q.id, chapter: deck[index].chapter.id });
    const box = document.getElementById("q-feedback");
    if (box) {
      box.className = "feedback " + (correct ? "ok" : "no");
      box.innerHTML = "<strong>" + (correct ? "Đúng." : "Chưa đúng.") + "</strong> <span class='explain'>" + q.explain + "</span>";
      box.hidden = false;
    }
    const next = document.getElementById("q-next");
    if (next) {
      next.hidden = false;
      next.textContent = index === total - 1 ? "Xem kết quả" : "Câu tiếp";
      next.focus();
    }
  }

  function renderResult() {
    const pct = Math.round((correctCount / total) * 100);
    const history = readJSON(MOCK_KEY, {});
    history.best = Math.max(history.best || 0, pct);
    history.last = pct;
    history.attempts = (history.attempts || 0) + 1;
    writeJSON(MOCK_KEY, history);
    if (sessionWrong.length) {
      const ids = new Set(savedWrong.map((e) => e.id));
      sessionWrong.forEach((e) => { if (!ids.has(e.id)) { savedWrong.push(e); ids.add(e.id); } });
      writeJSON(WRONG_KEY, savedWrong);
    }
    document.getElementById("mock-meta").textContent = "Kết quả";
    host.innerHTML = '<div class="result"><div class="score">' + pct + '<small>%</small></div>' +
      '<p><strong>' + correctCount + "/" + total + " câu đúng.</strong> Câu sai đã được ghi vào mục \"Ôn câu sai\".</p>" +
      '<div class="quiz-foot"><span class="spacer"></span>' +
      (sessionWrong.length ? '<a class="btn" href="wrong.html">Ôn câu sai (' + sessionWrong.length + ")</a>" : "") +
      '<button class="btn primary" type="button" id="q-retry">Làm lại</button></div></div>';
    document.getElementById("q-retry").addEventListener("click", () => {
      index = 0;
      correctCount = 0;
      sessionWrong = [];
      if (wrongPage) deck = shuffle(deck);
      else deck = shuffle(pool()).slice(0, total);
      renderQuestion();
    });
  }

  if (wrongPage) {
    renderList();
  } else {
    renderQuestion();
  }
})();
