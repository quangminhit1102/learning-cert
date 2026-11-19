(function () {
  const body = document.body;
  const chapterId = body.dataset.chapter;
  const dataVar = body.dataset.data;
  const host = document.getElementById("quiz-body");
  if (!chapterId || !dataVar || !host) return;

  const bank = window[dataVar];
  const metaEl = document.getElementById("quiz-meta");
  if (!bank || !Array.isArray(bank.quiz) || bank.quiz.length === 0) {
    host.innerHTML = '<div class="empty">Could not load practice data for this chapter.</div>';
    return;
  }

  const questions = bank.quiz;
  let index = 0;
  let results = [];
  let answered = false;
  let board = null;
  let currentAnswer = null;

  function normalize(value) {
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/\u266f/g, "#")
      .replace(/\u266d/g, "b")
      .replace(/\s+/g, " ");
  }

  function shuffleOrder(n) {
    const order = [];
    for (let i = 0; i < n; i += 1) order.push(i);
    for (let i = n - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }
    if (n > 1) {
      let same = true;
      for (let i = 0; i < n; i += 1) { if (order[i] !== i) { same = false; break; } }
      if (same) { const tmp = order[0]; order[0] = order[n - 1]; order[n - 1] = tmp; }
    }
    return order;
  }

  function isCorrect(question, answer) {
    if (question.type === "mcq") return answer === question.answer;
    if (question.type === "fill") {
      const accepted = Array.isArray(question.answer) ? question.answer : [question.answer];
      return accepted.some((item) => normalize(item) === normalize(answer));
    }
    if (question.type === "fret") {
      const expected = question.answer.map((pair) => pair[0] + ":" + pair[1]).sort().join("|");
      const actual = (answer || []).map((pair) => pair[0] + ":" + pair[1]).sort().join("|");
      return expected === actual;
    }
    if (question.type === "multi") {
      const expected = question.answer.slice().sort().join(",");
      const actual = (answer || []).slice().sort().join(",");
      return expected === actual;
    }
    return false;
  }

  function progressBar() {
    return '<div class="q-progress">' + questions.map((_, i) => {
      const item = results[i];
      const cls = item ? (item.correct ? "done" : "bad") : "";
      return '<i class="' + cls + '"></i>';
    }).join("") + "</div>";
  }

  function refLink(question) {
    if (!question.ref) return "";
    return ' <a href="' + question.ref + '">Review theory</a>';
  }

  function showFeedback(question, correct) {
    const box = document.getElementById("q-feedback");
    if (!box) return;
    box.className = "feedback " + (correct ? "ok" : "no");
    box.innerHTML = "<strong>" + (correct ? "Correct." : "Incorrect.") + "</strong> " +
      '<span class="explain">' + question.explain + "</span>" + refLink(question);
    box.hidden = false;
  }

  function markAnswer(correct) {
    if (answered) return;
    answered = true;
    results[index] = { correct: correct, question: questions[index] };
    showFeedback(questions[index], correct);
    const next = document.getElementById("q-next");
    if (next) {
      next.hidden = false;
      next.textContent = index === questions.length - 1 ? "See results" : "Next";
      next.focus();
    }
  }

  function renderMcq(question) {
    const wrap = document.createElement("div");
    wrap.innerHTML = '<p class="q-text">' + question.q + "</p>";
    const opts = document.createElement("div");
    opts.className = "opts";
    const order = shuffleOrder(question.options.length);
    const answerPos = order.indexOf(question.answer);
    for (let i = 0; i < question.options.length; i += 1) {
      const original = order[i];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "opt";
      btn.innerHTML = '<span class="key">' + (i + 1) + "</span><span>" + question.options[original] + "</span>";
      btn.addEventListener("click", () => {
        if (answered) return;
        const correct = i === answerPos;
        if (correct) btn.classList.add("correct");
        else {
          btn.classList.add("wrong");
          opts.children[answerPos].classList.add("correct");
        }
        Array.from(opts.children).forEach((node) => { node.disabled = true; });
        markAnswer(correct);
      });
      opts.appendChild(btn);
    }
    wrap.appendChild(opts);
    host.innerHTML = progressBar();
    host.appendChild(wrap);
  }

  function renderMulti(question) {
    const wrap = document.createElement("div");
    wrap.innerHTML = '<p class="q-text">' + question.q + '</p><div class="read-note" style="margin:0 0 10px">Select all that apply.</div>';
    const opts = document.createElement("div");
    opts.className = "opts";
    const selected = new Set();
    const order = shuffleOrder(question.options.length);
    const expectedPositions = question.answer.map((a) => order.indexOf(a));
    for (let i = 0; i < question.options.length; i += 1) {
      const original = order[i];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "opt";
      btn.innerHTML = '<span class="key">' + (i + 1) + "</span><span>" + question.options[original] + "</span>";
      btn.addEventListener("click", () => {
        if (answered) return;
        if (selected.has(i)) { selected.delete(i); btn.classList.remove("selected"); }
        else { selected.add(i); btn.classList.add("selected"); }
      });
      opts.appendChild(btn);
    }
    wrap.appendChild(opts);
    const checkRow = document.createElement("div");
    checkRow.className = "quiz-foot";
    checkRow.innerHTML = '<span class="spacer"></span><button class="btn primary" type="button" id="q-check">Check</button>';
    wrap.appendChild(checkRow);
    host.innerHTML = progressBar();
    host.appendChild(wrap);
    document.getElementById("q-check").addEventListener("click", () => {
      const chosen = Array.from(selected);
      const correct = chosen.slice().sort().join(",") === expectedPositions.slice().sort().join(",");
      Array.from(opts.children).forEach((node, i) => {
        const isSel = selected.has(i);
        const isExp = expectedPositions.indexOf(i) !== -1;
        if (isExp) node.classList.add("correct");
        else if (isSel) node.classList.add("wrong");
        node.disabled = true;
      });
      markAnswer(correct);
    });
  }

  function renderFill(question) {
    const wrap = document.createElement("div");
    wrap.innerHTML = '<p class="q-text">' + question.q + "</p>" +
      '<div class="fill-row"><input id="q-fill" type="text" autocomplete="off" spellcheck="false" placeholder="Type answer...">' +
      '<button class="btn primary" type="button" id="q-check">Check</button></div>';
    host.innerHTML = progressBar();
    host.appendChild(wrap);
    const input = document.getElementById("q-fill");
    const check = document.getElementById("q-check");
    function submit() {
      const correct = isCorrect(question, input.value);
      input.disabled = true;
      check.hidden = true;
      markAnswer(correct);
    }
    check.addEventListener("click", submit);
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") submit();
    });
    input.focus();
  }

  function renderFret(question) {
    const wrap = document.createElement("div");
    wrap.innerHTML = '<p class="q-text">' + question.q + "</p>" +
      '<div class="fret-board"></div>' +
      '<div class="quiz-foot"><span class="read-note">Tap a string/fret to mark it, tap again to clear.</span>' +
      '<span class="spacer"></span><button class="btn ghost small" type="button" id="q-clear">Clear all</button>' +
      '<button class="btn primary" type="button" id="q-check">Check</button></div>';
    host.innerHTML = progressBar();
    host.appendChild(wrap);
    board = window.Diagrams.interactiveFretboard(wrap.querySelector(".fret-board"), { frets: 12 });
    document.getElementById("q-clear").addEventListener("click", () => board.clear());
    document.getElementById("q-check").addEventListener("click", () => {
      const correct = isCorrect(question, board.getMarks());
      markAnswer(correct);
    });
  }

  function render() {
    answered = false;
    board = null;
    const question = questions[index];
    const meta = document.getElementById("quiz-meta");
    if (meta) meta.textContent = "Q" + (index + 1) + "/" + questions.length;
    if (question.type === "fill") renderFill(question);
    else if (question.type === "fret") renderFret(question);
    else if (question.type === "multi") renderMulti(question);
    else renderMcq(question);

    const foot = document.createElement("div");
    foot.className = "quiz-foot";
    foot.innerHTML = '<span class="read-note" id="q-hint">' + (question.type === "mcq" ? "Pick an answer or press 1-4." : "") + "</span>" +
      '<span class="spacer"></span>' +
      '<div id="q-feedback" class="feedback" hidden></div>' +
      '<button class="btn primary" type="button" id="q-next" hidden>Next</button>';
    host.appendChild(foot);

    document.getElementById("q-next").addEventListener("click", () => {
      index += 1;
      if (index < questions.length) render();
      else finish();
    });
  }

  function finish() {
    const total = questions.length;
    const right = results.filter((item) => item && item.correct).length;
    const pct = Math.round((right / total) * 100);
    const wrong = results.filter((item) => item && !item.correct);
    window.GT.progress.saveQuiz(chapterId, pct);
    document.dispatchEvent(new CustomEvent("gt:progress"));

    let verdict = "You should review this chapter.";
    if (pct === 100) verdict = "Perfect. Move on to flashcards to retain it.";
    else if (pct >= 80) verdict = "Good. Review the missed ones and continue.";
    else if (pct >= 60) verdict = "Okay. Re-read the related theory.";

    host.innerHTML = '<div class="result">' +
      '<div class="score">' + pct + '<small>%</small></div>' +
      '<p><strong>' + right + "/" + total + " correct.</strong> " + verdict + "</p>" +
      '<div class="quiz-foot"><span class="spacer"></span><button class="btn primary" type="button" id="q-retry">Retry</button></div>' +
      "</div>" +
      (wrong.length ? '<div class="wrong-list"><h3>Questions to review</h3>' + wrong.map((item) =>
        '<details><summary>' + item.question.q + '</summary><div class="feedback no" style="margin-top:8px">' +
        item.question.explain + refLink(item.question) + "</div></details>").join("") + "</div>" : "");

    const meta = document.getElementById("quiz-meta");
    if (meta) meta.textContent = "Result";
    document.getElementById("q-retry").addEventListener("click", () => {
      index = 0;
      results = [];
      render();
    });
  }

  document.addEventListener("keydown", (ev) => {
    if (document.getElementById("q-retry")) return;
    const tag = (ev.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    const question = questions[index];
    if (!answered && question && question.type === "mcq" && /^[1-4]$/.test(ev.key)) {
      const btn = host.querySelectorAll(".opt")[Number(ev.key) - 1];
      if (btn) btn.click();
    }
    if (ev.key === "Enter") {
      const next = document.getElementById("q-next");
      if (next && !next.hidden) {
        ev.preventDefault();
        next.click();
      }
    }
  });

  render();
})();
