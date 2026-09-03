(function () {
  "use strict";
  const HISTORY = "bbw:history", RESULT = "bbw:result:", ATTEMPT = "bbw:attempt:", PRACTICE = "bbw:practice", COURSE = "bbw:course";
  const DEFAULT_COURSE = "class-10";
  const SLUG = /^[a-z0-9-]+$/i;
  const SECTION_FALLBACK = { gadya: "गद्य", padya: "पद्य", purak: "पूरक", prose: "Prose", poetry: "Poetry", supplementary: "Supplementary", history: "इतिहास", geography: "भूगोल", civics: "नागरिक शास्त्र", economics: "अर्थशास्त्र", disaster: "आपदा प्रबंधन" };
  let rootManifest = null;
  const courseCache = new Map();
  function isSlug(value) { return SLUG.test(value || ""); }
  async function fetchJson(url) {
    let response;
    try { response = await fetch(url, { cache: "no-store" }); }
    catch (_) { throw new Error(`डेटा लोड नहीं हुआ (${url}). Local HTTP server चलाएँ।`); }
    if (!response.ok) throw new Error(`${url} नहीं मिला (HTTP ${response.status}).`);
    try { return await response.json(); } catch (_) { throw new Error(`${url} में valid JSON नहीं है।`); }
  }
  async function loadCourses() {
    if (!rootManifest) rootManifest = await fetchJson("data/manifest.json");
    const courses = Array.isArray(rootManifest.courses) ? rootManifest.courses.slice() : [];
    return courses.sort((a, b) => Number(a.order || 99) - Number(b.order || 99));
  }
  async function getCourse(slug) {
    return (await loadCourses()).find(c => c.slug === slug) || null;
  }
  async function loadCourse(slug) {
    if (!isSlug(slug)) throw new Error("Invalid course.");
    if (!courseCache.has(slug)) courseCache.set(slug, await fetchJson(`data/${slug}/manifest.json`));
    return courseCache.get(slug);
  }
  async function loadSubjects(slug) {
    const manifest = await loadCourse(slug);
    return Array.isArray(manifest.subjects) ? manifest.subjects : [];
  }
  function courseParam() {
    const value = new URLSearchParams(location.search).get("course");
    return isSlug(value) ? value : null;
  }
  function storedCourse() {
    try { const value = localStorage.getItem(COURSE); return isSlug(value) ? value : null; } catch (_) { return null; }
  }
  function currentCourseSlug() { return courseParam() || storedCourse() || DEFAULT_COURSE; }
  function rememberCourse(slug) { try { if (isSlug(slug)) localStorage.setItem(COURSE, slug); } catch (_) {} }
  function forgetCourse() { try { localStorage.removeItem(COURSE); } catch (_) {} }
  function sectionLabel(manifest, key) {
    if (!key) return "";
    const labels = manifest && manifest.sectionLabels || {};
    return labels[key] || SECTION_FALLBACK[key] || key;
  }
  function testPath(course, subject, chapter, test) { return `data/${course}/${subject}/${chapter}/${test}.json`; }
  function chapterTests(chapter, options = {}) {
    if (!chapter) return [];
    if (Array.isArray(chapter.tests)) {
      return options.includeEmpty ? chapter.tests : chapter.tests.filter(t => Number(t.questionCount) > 0);
    }
    if (Number(chapter.questionCount) > 0) {
      const title = chapter.title && (chapter.title.hi || chapter.title.en) || chapter.slug;
      return [{
        id: chapter.id ? `${chapter.id}-test-1` : `${chapter.slug}-test-1`,
        slug: "test-1",
        title,
        file: chapter.file || "",
        questionCount: Number(chapter.questionCount) || 0,
        timeLimitMinutes: chapter.timeLimitMinutes,
        quizType: chapter.quizType,
        updatedAt: chapter.updatedAt
      }];
    }
    return [];
  }
  function chapterQuestionCount(chapter) {
    return chapterTests(chapter).reduce((sum, t) => sum + Number(t.questionCount || 0), 0);
  }
  function countCourse(subjects) {
    let tests = 0, questions = 0;
    (subjects || []).forEach(s => (s.chapters || []).forEach(c => {
      const list = chapterTests(c);
      tests += list.length;
      questions += list.reduce((sum, t) => sum + Number(t.questionCount || 0), 0);
    }));
    return { subjectCount: (subjects || []).length, testCount: tests, questionCount: questions };
  }
  function nextTestSlug(chapter, extra) {
    const used = new Set(chapterTests(chapter, { includeEmpty: true }).map(t => t.slug));
    (extra || []).forEach(slug => used.add(slug));
    let n = 1;
    while (used.has(`test-${n}`)) n++;
    return `test-${n}`;
  }
  const YT = /^https:\/\/(www\.youtube\.com\/(watch\?|playlist\?|live\/)|youtu\.be\/)[\w\-?=&%.\/]+$/;
  function isYoutubeUrl(value) { return YT.test(String(value || "").trim()); }
  function videoOf(source) {
    if (!source) return null;
    const url = String(source.youtubeUrl || "").trim();
    if (!isYoutubeUrl(url)) return null;
    return { url, title: String(source.youtubeTitle || "").trim() };
  }
  async function chapterVideo(course, subject, chapter) {
    try {
      const manifest = await loadCourse(course);
      const s = (manifest.subjects || []).find(x => x.slug === subject);
      return videoOf(s && (s.chapters || []).find(x => x.slug === chapter));
    } catch (_) { return null; }
  }
  async function loadTest(course, subject, chapter, test) {
    if (!isSlug(course)) throw new Error("Invalid course.");
    if (!isSlug(subject) || !isSlug(chapter)) throw new Error("Invalid subject or chapter.");
    if (!isSlug(test)) throw new Error("Invalid test.");
    return fetchJson(testPath(course, subject, chapter, test));
  }
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; } }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } }
  function getHistory() { return read(HISTORY, []).map(r => Object.assign({ course: DEFAULT_COURSE }, r)); }
  function clearHistory() { try { localStorage.removeItem(HISTORY); } catch (_) {} }
  function getResult(id) {
    const result = read(RESULT + id, null);
    return result ? Object.assign({ course: DEFAULT_COURSE }, result) : null;
  }
  function saveResult(result) {
    write(RESULT + result.attemptId, result);
    const history = [result, ...getHistory().filter(x => x.attemptId !== result.attemptId)].slice(0, 50);
    write(HISTORY, history);
    return result;
  }
  function getAttempt(id) { return read(ATTEMPT + id, null); }
  function saveAttempt(id, state) { return write(ATTEMPT + id, state); }
  function clearAttempt(id) { try { localStorage.removeItem(ATTEMPT + id); } catch (_) {} }
  function attemptKey(course, subject, chapter, test, practice) {
    return practice ? "practice" : `${course}:${subject}:${chapter}:${test || "test-1"}`;
  }
  function bestAttempt(course, subject, chapter, test) {
    const matches = getHistory().filter(r =>
      r.course === course &&
      r.subject === subject &&
      r.chapter === chapter &&
      (r.test ? r.test === test : test === "test-1")
    );
    if (!matches.length) return null;
    return matches.reduce((best, r) => Number(r.score) > Number(best.score) ? r : best);
  }
  function courseProgress(course) {
    const attempts = getHistory().filter(r => r.course === course);
    if (!attempts.length) return null;
    const best = attempts.reduce((top, r) => Number(r.score) > Number(top.score) ? r : top);
    return { attempts: attempts.length, bestScore: Math.round(Number(best.score) || 0) };
  }
  function savePractice(value) { sessionStorage.setItem(PRACTICE, JSON.stringify(value)); }
  function getPractice() { try { return JSON.parse(sessionStorage.getItem(PRACTICE)); } catch (_) { return null; } }
  function uniqueId() { return `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`; }
  const OPTION_LETTERS = "ABCDE";
  function optionCount(q) { return String((q && q.option5) || "").trim() ? 5 : 4; }
  function optionLetter(n) { return OPTION_LETTERS.charAt(Number(n) - 1) || ""; }
  function optionsOf(q) { return Array.from({ length: optionCount(q) }, (_, i) => q["option" + (i + 1)] || ""); }
  function usesTreMarking(quiz) {
    if (!quiz) return false;
    if (quiz._pattern) return true;
    const first = quiz.questions && quiz.questions[0];
    return Boolean(first && optionCount(first) === 5);
  }
  function formatMarksDelta(n) {
    const v = Number(n || 0);
    if (Math.abs(v) < 1e-9) return "0";
    const sign = v > 0 ? "+" : "−";
    const abs = Math.abs(v);
    if (Math.abs(abs * 3 - 1) < 1e-4) return sign + "1/3";
    const body = Number.isInteger(abs) ? String(abs) : String(Number(abs.toFixed(2)));
    return sign + body;
  }
  function negativeMarkLabel(quiz) {
    if (!quiz || !quiz.negativeMarkingEnabled) return "No negative marking";
    const n = Number(quiz.negativeMarksPerQuestion || 0);
    const frac = Math.abs(n - 1 / 3) < 1e-6 ? "1/3" : String(n);
    if (usesTreMarking(quiz) && quiz.negativeMarkingOnSkip) return `−${frac} wrong or blank · E = 0`;
    return quiz.negativeMarkingOnSkip ? `−${frac} wrong or unanswered` : `−${frac} wrong`;
  }
  function isMoreThanOneOption(text, pattern) {
    const label = String((pattern && pattern.moreThanOneLabel) || "More than one of the above").trim().toLowerCase();
    return String(text || "").trim().toLowerCase() === label;
  }
  function lockMoreThanOneAsD(q, pattern) {
    if (!pattern || pattern.lockMoreThanOneAsD === false) return q;
    const opts = [q.option1, q.option2, q.option3, q.option4];
    const idx = opts.findIndex(t => isMoreThanOneOption(t, pattern));
    if (idx < 0 || idx === 3) return q;
    const next = Object.assign({}, q);
    const moved = opts[idx];
    opts.splice(idx, 1);
    opts.push(moved);
    next.option1 = opts[0]; next.option2 = opts[1]; next.option3 = opts[2]; next.option4 = opts[3];
    const correct = Number(q.correctOption);
    if (correct === idx + 1) next.correctOption = "4";
    else if (correct > idx + 1 && correct <= 4) next.correctOption = String(correct - 1);
    return next;
  }
  function shuffleTreOptions(q, pattern) {
    if (!q) return q;
    let row = lockMoreThanOneAsD(Object.assign({}, q), pattern);
    const eLabel = (pattern && pattern.notAttemptedLabel) || "Not Attempted";
    if (!String(row.option5 || "").trim()) row.option5 = eLabel;
    if (pattern && pattern.shuffleOptionsAbcd === false) return row;
    const items = [1, 2, 3, 4].map(n => ({ text: row["option" + n], orig: n }));
    const moreAt = items.findIndex(x => isMoreThanOneOption(x.text, pattern));
    const locked = moreAt >= 0 ? items.splice(moreAt, 1)[0] : null;
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    if (locked) items.push(locked);
    const next = Object.assign({}, row);
    items.forEach((item, i) => { next["option" + (i + 1)] = item.text; });
    const correct = Number(row.correctOption);
    if (correct >= 1 && correct <= 4) next.correctOption = String(items.findIndex(x => x.orig === correct) + 1);
    next.option5 = eLabel;
    return next;
  }
  function applyExamPattern(quiz, pattern) {
    if (!quiz || !pattern) return quiz;
    const out = Object.assign({}, quiz);
    out.negativeMarkingEnabled = true;
    out.negativeMarksPerQuestion = Number(pattern.negativeMarksPerQuestion == null ? 1 / 3 : pattern.negativeMarksPerQuestion);
    out.negativeMarkingOnSkip = true;
    out.shuffle = true;
    const classTypes = pattern.classQuizTypes || ["LECTURE_QUIZ", "CHAPTER_QUIZ", "CHAPTER_TEST", "PRACTICE_SET", "PYQ_TEST"];
    if (classTypes.includes(out.quizType || "LECTURE_QUIZ") && pattern.classTimeLimitMinutes) {
      out.timeLimitMinutes = Number(pattern.classTimeLimitMinutes);
    }
    const eLabel = pattern.notAttemptedLabel || "Not Attempted";
    out.questions = (quiz.questions || []).map(q => {
      const row = lockMoreThanOneAsD(Object.assign({}, q), pattern);
      if (!String(row.option5 || "").trim()) row.option5 = eLabel;
      return row;
    });
    Object.defineProperty(out, "_pattern", { value: pattern, enumerable: false });
    return out;
  }
  function isNotAttemptedSelection(q, selected, pattern) {
    if (selected == null || selected === "") return false;
    const text = String((q && q["option" + Number(selected)]) || "").trim().toLowerCase();
    if (!text) return false;
    const labels = new Set(["not attempted", "प्रयास नहीं किया गया"]);
    if (pattern && pattern.notAttemptedLabel) labels.add(String(pattern.notAttemptedLabel).trim().toLowerCase());
    return labels.has(text);
  }
  function gradeResponse(q, selected, quiz) {
    const pattern = quiz && quiz._pattern;
    const marks = Number((q && q.marks) || 1);
    const penalty = quiz && quiz.negativeMarkingEnabled ? Number(quiz.negativeMarksPerQuestion || 0) : 0;
    const chosen = selected == null || selected === "" ? null : Number(selected);
    const answer = Number(q && q.correctOption);
    if (chosen == null || !Number.isFinite(chosen)) {
      const deduct = Boolean(quiz && quiz.negativeMarkingEnabled && quiz.negativeMarkingOnSkip);
      return { status: "blank", delta: deduct ? -penalty : 0 };
    }
    if (chosen === answer) return { status: "correct", delta: marks };
    if (isNotAttemptedSelection(q, chosen, pattern)) return { status: "skipped", delta: 0 };
    return { status: "wrong", delta: penalty ? -penalty : 0 };
  }
  function scoreAttempt(questions, getSelected, quiz) {
    let earned = 0, correct = 0, wrong = 0, skipped = 0, blank = 0;
    const review = (questions || []).map((q, i) => {
      const selected = getSelected(q, i);
      const graded = gradeResponse(q, selected, quiz);
      earned += graded.delta;
      if (graded.status === "correct") correct++;
      else if (graded.status === "wrong") wrong++;
      else if (graded.status === "skipped") skipped++;
      else blank++;
      return {
        question: q.question,
        options: optionsOf(q),
        selectedOption: selected,
        correctOption: Number(q.correctOption),
        explanation: q.explanation || "",
        marks: Number(q.marks || 1),
        marksDelta: graded.delta,
        status: graded.status
      };
    });
    return { earned, correct, wrong, skipped, blank, review };
  }
  function downloadJson(value, filename) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2) + "\n"], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  window.BBWData = { defaultCourse: DEFAULT_COURSE, loadCourses, getCourse, loadCourse, loadSubjects, courseParam, storedCourse, currentCourseSlug, rememberCourse, forgetCourse, sectionLabel, fetchJson, loadTest, testPath, chapterTests, chapterQuestionCount, countCourse, nextTestSlug, isYoutubeUrl, videoOf, chapterVideo, getHistory, clearHistory, getResult, saveResult, getAttempt, saveAttempt, clearAttempt, attemptKey, bestAttempt, courseProgress, savePractice, getPractice, uniqueId, downloadJson, optionCount, optionLetter, optionsOf, negativeMarkLabel, formatMarksDelta, usesTreMarking, applyExamPattern, shuffleTreOptions, lockMoreThanOneAsD, isNotAttemptedSelection, gradeResponse, scoreAttempt };
})();
