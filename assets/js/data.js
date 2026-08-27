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
  function downloadJson(value, filename) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2) + "\n"], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  window.BBWData = { defaultCourse: DEFAULT_COURSE, loadCourses, getCourse, loadCourse, loadSubjects, courseParam, storedCourse, currentCourseSlug, rememberCourse, forgetCourse, sectionLabel, fetchJson, loadTest, testPath, chapterTests, chapterQuestionCount, countCourse, nextTestSlug, getHistory, clearHistory, getResult, saveResult, getAttempt, saveAttempt, clearAttempt, attemptKey, bestAttempt, courseProgress, savePractice, getPractice, uniqueId, downloadJson };
})();
