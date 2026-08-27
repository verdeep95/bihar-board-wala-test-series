(function () {
  "use strict";
  const app = document.querySelector("#quiz-app"), params = new URLSearchParams(location.search);
  const practice = params.get("practice") === "1", subject = params.get("subject"), chapter = params.get("chapter"), test = params.get("test") || "test-1";
  const course = BBWData.currentCourseSlug();
  let quiz, key, state, timerId;
  init();
  async function init() {
    try {
      quiz = practice ? BBWData.getPractice() : await BBWData.loadTest(course, subject, chapter, test);
      if (!quiz || !Array.isArray(quiz.questions) || !quiz.questions.length) throw new Error(practice ? "Practice data नहीं मिला। Admin से फिर खोलें।" : "इस test में questions नहीं हैं।");
      key = BBWData.attemptKey(course, subject, chapter, test, practice);
      state = BBWData.getAttempt(key);
      if (state && state.quizId === quiz.id && !state.submitted) {
        state.remaining = remainingNow(state);
        renderAttempt();
      } else { state = null; renderStart(); }
    } catch (e) { app.innerHTML = `<div class="container" style="margin-top:2rem">${BBWUI.errorState(e.message)}</div>`; }
  }
  function renderStart() {
    const totalMarks = quiz.questions.reduce((s, q) => s + Number(q.marks || 1), 0);
    document.title = `${quiz.title} • Bihar Board Wala`;
    app.innerHTML = `<div class="container"><section class="card quiz-start"><div class="start-header"><div style="font-size:2rem">☑</div><h1>${BBWUI.escape(quiz.title)}</h1></div><div class="start-stats"><div class="stat"><strong>${quiz.questions.length}</strong><small>Questions</small></div><div class="stat"><strong>${quiz.timeLimitMinutes || "∞"}</strong><small>${quiz.timeLimitMinutes ? "Minutes" : "No limit"}</small></div><div class="stat"><strong>${totalMarks}</strong><small>Total marks</small></div></div><h3>Marking scheme</h3><div class="chips"><span class="chip good">+ Correct answer marks</span><span class="chip ${quiz.negativeMarkingEnabled ? "bad" : ""}">${quiz.negativeMarkingEnabled ? `−${quiz.negativeMarksPerQuestion} wrong` : "No negative marking"}</span><span class="chip">Pass: ${quiz.passingScore || 0}%</span></div><h3 style="margin-top:1.5rem">निर्देश / Instructions</h3><ol class="instructions"><li>हर प्रश्न का केवल एक सही उत्तर है।</li><li>उत्तर submit करने से पहले कभी भी बदल सकते हैं।</li><li>दोबारा देखने के लिए “Mark for review” चुनें।</li><li>Progress अपने-आप इस device पर save होती है।</li>${quiz.timeLimitMinutes ? "<li>Start दबाते ही timer शुरू होगा।</li>" : ""}</ol><button id="start-test" class="btn btn-saffron btn-block">Start Test • ${quiz.questions.length} Q</button></section></div>`;
    document.querySelector("#start-test").onclick = start;
  }
  function start() {
    let order = quiz.questions.map((_, i) => i);
    if (quiz.shuffle) for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const seconds = Math.max(0, Number(quiz.timeLimitMinutes || 0) * 60);
    state = { quizId: quiz.id, startedAt: Date.now(), updatedAt: Date.now(), remaining: seconds, duration: seconds, answers: {}, flags: [], current: 0, order, paused: false, pausedAt: null, submitted: false };
    save(); renderAttempt();
  }
  function remainingNow(s) {
    if (!s.duration) return 0;
    if (s.paused) return s.remaining;
    return Math.max(0, s.remaining - Math.floor((Date.now() - s.updatedAt) / 1000));
  }
  function save() { state.updatedAt = Date.now(); BBWData.saveAttempt(key, state); }
  function questions() { return state.order.map(i => quiz.questions[i]); }
  function qid(index) { return String(state.order[index]); }
  function renderAttempt() {
    clearInterval(timerId);
    app.innerHTML = `<div class="quiz-shell"><div class="quiz-top"><div class="quiz-top-row"><strong id="counter"></strong><span id="flag-count" class="badge badge-primary"></span><span id="timer" class="timer"></span><button id="pause" class="btn btn-outline"></button></div><div class="progress" style="margin-top:.55rem"><span id="progress"></span></div><div class="quiz-top-row muted" style="font-size:.72rem;margin-top:.25rem"><span id="answered"></span><span id="remaining-label" style="margin-left:auto"></span></div><div id="urgent"></div></div><div class="quiz-layout"><div><div id="question-area"></div><div class="quiz-actions"><button id="mark" class="btn btn-outline"></button><div class="button-row"><button id="prev" class="btn btn-outline">← Previous</button><button id="next" class="btn btn-outline">Next →</button><button id="submit-open" class="btn btn-saffron">Submit review</button></div></div></div><aside class="card palette-card"><h3>Question palette</h3><div id="palette" class="palette"></div><p id="legend" class="muted"></p></aside></div><div class="quiz-mobile-bar"><button id="mobile-prev" class="btn btn-outline">←</button><button id="mobile-palette" class="btn btn-outline">☷ <span id="mobile-count"></span></button><button id="mobile-next" class="btn btn-outline">→</button><button id="mobile-submit" class="btn btn-saffron">Submit</button></div></div>`;
    bindControls(); updateAll();
    if (quiz.timeLimitMinutes) timerId = setInterval(tick, 1000);
  }
  function bindControls() {
    ["prev", "mobile-prev"].forEach(id => document.querySelector(`#${id}`).onclick = () => go(-1));
    ["next", "mobile-next"].forEach(id => document.querySelector(`#${id}`).onclick = () => go(1));
    ["submit-open", "mobile-submit"].forEach(id => document.querySelector(`#${id}`).onclick = reviewSubmit);
    document.querySelector("#mark").onclick = toggleFlag;
    document.querySelector("#pause").onclick = togglePause;
    document.querySelector("#mobile-palette").onclick = () => BBWUI.openSheet("Question palette", `<div id="sheet-palette" class="palette">${paletteHtml()}</div>`).querySelectorAll("[data-q]").forEach(b => b.onclick = () => { state.current = Number(b.dataset.q); save(); BBWUI.closeSheet(); updateAll(); });
  }
  function tick() {
    if (state.paused) return;
    state.remaining = remainingNow(state); state.updatedAt = Date.now(); save(); updateTimer();
    if (state.remaining <= 0) { clearInterval(timerId); submit(true); }
  }
  function updateAll() {
    const qs = questions(), q = qs[state.current], id = qid(state.current), answered = Object.keys(state.answers).length;
    document.querySelector("#counter").textContent = `Q ${state.current + 1}/${qs.length}`;
    document.querySelector("#flag-count").textContent = state.flags.length ? `⚑ ${state.flags.length}` : "";
    document.querySelector("#answered").textContent = `${answered} answered`;
    document.querySelector("#remaining-label").textContent = `${qs.length - answered} remaining`;
    document.querySelector("#progress").style.width = `${answered / qs.length * 100}%`;
    document.querySelector("#mobile-count").textContent = `${state.current + 1}/${qs.length}`;
    document.querySelector("#prev").disabled = document.querySelector("#mobile-prev").disabled = state.paused || state.current === 0;
    document.querySelector("#next").disabled = document.querySelector("#mobile-next").disabled = state.paused || state.current === qs.length - 1;
    document.querySelector("#mark").disabled = state.paused;
    document.querySelector("#mark").textContent = state.flags.includes(id) ? "⚑ Marked for review" : "⚐ Mark for review";
    if (state.paused) document.querySelector("#question-area").innerHTML = `<div class="card paused"><h2>⏸ Quiz paused</h2><p class="muted">आपके उत्तर सुरक्षित हैं। Resume करके आगे बढ़ें।</p></div>`;
    else document.querySelector("#question-area").innerHTML = `<article class="card question-card"><div class="question-head"><div class="muted">Question ${state.current + 1} • ${Number(q.marks || 1)} mark</div><div class="question-text">${BBWMath.render(q.question)}</div></div><div class="options">${[1,2,3,4].map(n => `<label class="option ${String(state.answers[id]) === String(n) ? "selected" : ""}"><input type="radio" name="answer" value="${n}" ${String(state.answers[id]) === String(n) ? "checked" : ""}><span class="letter">${"ABCD"[n-1]}</span><span>${BBWMath.render(q[`option${n}`])}</span></label>`).join("")}</div></article>`;
    document.querySelectorAll('input[name="answer"]').forEach(input => input.onchange = () => { state.answers[id] = Number(input.value); save(); updateAll(); });
    document.querySelector("#palette").innerHTML = paletteHtml();
    document.querySelectorAll("#palette [data-q]").forEach(b => b.onclick = () => { state.current = Number(b.dataset.q); save(); updateAll(); });
    document.querySelector("#legend").textContent = `Answered ${answered} • Marked ${state.flags.length} • Left ${qs.length - answered}`;
    document.querySelector("#pause").textContent = state.paused ? "▶ Resume" : "⏸ Pause";
    updateTimer();
  }
  function paletteHtml() { return questions().map((_, i) => { const id = qid(i); return `<button data-q="${i}" class="${state.answers[id] ? "answered" : ""} ${state.flags.includes(id) ? "marked" : ""} ${i === state.current ? "current" : ""}">${i + 1}</button>`; }).join(""); }
  function updateTimer() {
    const timer = document.querySelector("#timer"); if (!timer) return;
    if (!quiz.timeLimitMinutes) { timer.textContent = "Untimed"; return; }
    const r = state.remaining, m = Math.floor(r / 60), s = r % 60;
    timer.textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    timer.className = `timer ${r <= 45 ? "danger" : r <= 120 ? "warn" : ""}`;
    document.querySelector("#urgent").innerHTML = r <= 30 && !state.paused ? `<div class="urgent">⚠ केवल ${r} सेकंड बाकी — submit करें!</div>` : "";
  }
  function go(delta) { if (!state.paused) { state.current = Math.max(0, Math.min(questions().length - 1, state.current + delta)); save(); updateAll(); scrollTo(0, 0); } }
  function toggleFlag() { const id = qid(state.current); state.flags = state.flags.includes(id) ? state.flags.filter(x => x !== id) : [...state.flags, id]; save(); updateAll(); }
  function togglePause() {
    if (state.paused) { state.paused = false; state.updatedAt = Date.now(); state.pausedAt = null; }
    else { state.remaining = remainingNow(state); state.paused = true; state.pausedAt = Date.now(); }
    save(); updateAll();
  }
  function reviewSubmit() {
    const answered = Object.keys(state.answers).length, left = questions().length - answered;
    const sheet = BBWUI.openSheet("Submit review", `<div class="review-summary"><div><strong class="success">${answered}</strong>Answered</div><div><strong class="warning">${left}</strong>Left</div><div><strong>${state.flags.length}</strong>Marked</div></div>${left ? `<p class="admin-status warning">⚠ ${left} questions unanswered हैं।</p>` : `<p class="admin-status success">✓ सभी questions answered हैं।</p>`}<div class="button-row"><button id="keep" class="btn btn-outline">Keep solving</button><button id="confirm-submit" class="btn btn-saffron">Submit quiz</button></div>`);
    sheet.querySelector("#keep").onclick = BBWUI.closeSheet;
    sheet.querySelector("#confirm-submit").onclick = () => submit(false);
  }
  function submit(auto) {
    if (state.submitted) return;
    state.remaining = quiz.timeLimitMinutes ? remainingNow(state) : 0; state.submitted = true; save(); clearInterval(timerId);
    const qs = questions(); let earned = 0, correct = 0, wrong = 0, skipped = 0;
    const review = qs.map((q, i) => {
      const selected = state.answers[qid(i)] == null ? null : Number(state.answers[qid(i)]), answer = Number(q.correctOption), status = selected == null ? "skipped" : selected === answer ? "correct" : "wrong";
      if (status === "correct") { correct++; earned += Number(q.marks || 1); } else if (status === "wrong") { wrong++; if (quiz.negativeMarkingEnabled) earned -= Number(quiz.negativeMarksPerQuestion || 0); } else skipped++;
      return { question: q.question, options: [q.option1,q.option2,q.option3,q.option4], selectedOption: selected, correctOption: answer, explanation: q.explanation || "", marks: Number(q.marks || 1), status };
    });
    const totalMarks = qs.reduce((s,q) => s + Number(q.marks || 1), 0), score = totalMarks ? Math.max(0, earned) / totalMarks * 100 : 0, attemptId = BBWData.uniqueId();
    const result = { attemptId, quizId: quiz.id, quizTitle: quiz.title, course: quiz.course || course, subject: quiz.subject || subject, chapter: quiz.chapter || chapter, test: quiz.test || test, startedAt: new Date(state.startedAt).toISOString(), submittedAt: new Date().toISOString(), timeTakenSeconds: quiz.timeLimitMinutes ? Math.max(0, state.duration - state.remaining) : Math.floor((Date.now() - state.startedAt) / 1000), totalQuestions: qs.length, correctAnswers: correct, wrongAnswers: wrong, skippedAnswers: skipped, earnedMarks: Number(earned.toFixed(2)), totalMarks, score: Number(score.toFixed(2)), passingScore: Number(quiz.passingScore || 0), passed: score >= Number(quiz.passingScore || 0), autoSubmitted: auto, review };
    BBWData.saveResult(result); BBWData.clearAttempt(key); location.href = `result.html?attempt=${encodeURIComponent(attemptId)}`;
  }
})();
