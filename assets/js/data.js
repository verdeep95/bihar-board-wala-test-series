(function () {
  "use strict";
  const HISTORY = "bbw:history", RESULT = "bbw:result:", ATTEMPT = "bbw:attempt:", PRACTICE = "bbw:practice";
  const SLUG = /^[a-z0-9-]+$/i;
  function isSlug(value) { return SLUG.test(value || ""); }
  async function fetchJson(url) {
    let response;
    try { response = await fetch(url, { cache: "no-store" }); }
    catch (_) { throw new Error(`डेटा लोड नहीं हुआ (${url}). Local HTTP server चलाएँ।`); }
    if (!response.ok) throw new Error(`${url} नहीं मिला (HTTP ${response.status}).`);
    try { return await response.json(); } catch (_) { throw new Error(`${url} में valid JSON नहीं है।`); }
  }
  async function loadManifest() { return fetchJson("data/manifest.json"); }
  function testPath(subject, chapter, test) { return `data/${subject}/${chapter}/${test}.json`; }
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
  function nextTestSlug(chapter, extra) {
    const used = new Set(chapterTests(chapter, { includeEmpty: true }).map(t => t.slug));
    (extra || []).forEach(slug => used.add(slug));
    let n = 1;
    while (used.has(`test-${n}`)) n++;
    return `test-${n}`;
  }
  async function loadTest(subject, chapter, test) {
    if (!isSlug(subject) || !isSlug(chapter)) throw new Error("Invalid subject or chapter.");
    if (test) {
      if (!isSlug(test)) throw new Error("Invalid test.");
      return fetchJson(testPath(subject, chapter, test));
    }
    return fetchJson(`data/${subject}/${chapter}.json`);
  }
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; } }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } }
  function getHistory() { return read(HISTORY, []); }
  function clearHistory() { try { localStorage.removeItem(HISTORY); } catch (_) {} }
  function getResult(id) { return read(RESULT + id, null); }
  function saveResult(result) {
    write(RESULT + result.attemptId, result);
    const history = [result, ...getHistory().filter(x => x.attemptId !== result.attemptId)].slice(0, 50);
    write(HISTORY, history);
    return result;
  }
  function getAttempt(id) { return read(ATTEMPT + id, null); }
  function saveAttempt(id, state) { return write(ATTEMPT + id, state); }
  function clearAttempt(id) { try { localStorage.removeItem(ATTEMPT + id); } catch (_) {} }
  function attemptKey(subject, chapter, test, practice) {
    return practice ? "practice" : `${subject}:${chapter}:${test || "test-1"}`;
  }
  function bestAttempt(subject, chapter, test) {
    const matches = getHistory().filter(r =>
      r.subject === subject &&
      r.chapter === chapter &&
      (r.test ? r.test === test : test === "test-1")
    );
    if (!matches.length) return null;
    return matches.reduce((best, r) => Number(r.score) > Number(best.score) ? r : best);
  }
  function savePractice(value) { sessionStorage.setItem(PRACTICE, JSON.stringify(value)); }
  function getPractice() { try { return JSON.parse(sessionStorage.getItem(PRACTICE)); } catch (_) { return null; } }
  function uniqueId() { return `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`; }
  function downloadJson(value, filename) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2) + "\n"], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  window.BBWData = { loadManifest, loadTest, fetchJson, chapterTests, chapterQuestionCount, nextTestSlug, testPath, getHistory, clearHistory, getResult, saveResult, getAttempt, saveAttempt, clearAttempt, attemptKey, bestAttempt, savePractice, getPractice, uniqueId, downloadJson };
})();
