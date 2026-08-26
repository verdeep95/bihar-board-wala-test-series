(function () {
  "use strict";
  const DRAFT = "bbw:admin:draft";
  const SECTION_LABELS = { gadya: "गद्य", padya: "पद्य", purak: "पूरक", prose: "Prose", poetry: "Poetry", supplementary: "Supplementary", history: "इतिहास", geography: "भूगोल", civics: "नागरिक शास्त्र", economics: "अर्थशास्त्र", disaster: "आपदा प्रबंधन" };
  let questions = [], sourceWrapper = null, report = null, subjectChapters = [], allSubjects = [], activeSubject = "science", selectedSlug = "light", selectedTestSlug = "test-1";
  const $ = s => document.querySelector(s);
  const fields = { title:"#meta-title", subject:"#meta-subject", chapter:"#meta-chapter", test:"#meta-test", hi:"#meta-hi", en:"#meta-en", quizType:"#meta-type", timeLimitMinutes:"#meta-time", passingScore:"#meta-pass", negativeMarkingEnabled:"#meta-negative", negativeMarksPerQuestion:"#meta-negative-value", shuffle:"#meta-shuffle" };
  BBWValidate.quizTypes.forEach(t => $("#meta-type").add(new Option(t.replaceAll("_", " "), t)));
  $("#meta-type").value = "CHAPTER_TEST";
  bind();
  initSyllabus();
  function bind() {
    $("#json-file").onchange = e => loadFile(e.target.files[0]);
    const zone = $("#drop-zone");
    ["dragenter","dragover"].forEach(type => zone.addEventListener(type, e => { e.preventDefault(); zone.classList.add("drag"); }));
    ["dragleave","drop"].forEach(type => zone.addEventListener(type, e => { e.preventDefault(); zone.classList.remove("drag"); }));
    zone.addEventListener("drop", e => loadFile(e.dataTransfer.files[0]));
    $("#load-pasted").onclick = () => loadInput($("#paste-json").value);
    $("#template").onclick = downloadTemplate;
    $("#load-existing").onclick = loadExisting;
    $("#question-form").onsubmit = saveQuestion;
    $("#cancel-edit").onclick = clearEditor;
    Object.values(fields).forEach(sel => $(sel).addEventListener("input", () => { updateMetaUi(); saveDraft(); }));
    $("#meta-negative").onchange = () => { $("#meta-negative-value").disabled = !$("#meta-negative").checked; updateMetaUi(); saveDraft(); };
    $("#practice").onclick = practice;
    $("#download-test").onclick = downloadTest;
    $("#download-manifest").onclick = () => buildManifest(true);
    $("#download-both").onclick = async () => { if (!ensureValid()) return; downloadTest(); setTimeout(() => buildManifest(true), 350); };
    $("#meta-subject").addEventListener("change", () => selectSubject($("#meta-subject").value, { keepChapter: false }));
    $("#chapter-search").addEventListener("input", renderChapterList);
  }
  async function initSyllabus() {
    try {
      const manifest = await BBWData.loadManifest();
      allSubjects = manifest.classes[0].subjects;
      renderSubjectTabs();
      const restored = restoreDraft();
      const subject = $("#meta-subject").value || "science";
      const chapter = $("#meta-chapter").value || "light";
      const test = $("#meta-test").value || selectedTestSlug || "test-1";
      await selectSubject(subject, { chapter, test, keepTitle: restored });
    } catch (error) {
      $("#admin-chapter-list").innerHTML = BBWUI.errorState(error.message);
    }
  }
  function renderSubjectTabs() {
    $("#admin-subject-tabs").innerHTML = allSubjects.map(s => `<button type="button" class="${s.slug === activeSubject ? "active" : ""}" data-subject="${s.slug}">${BBWUI.escape(s.name.hi)} <small>${s.chapters.length}</small></button>`).join("");
    $("#admin-subject-tabs").querySelectorAll("[data-subject]").forEach(btn => {
      btn.onclick = () => selectSubject(btn.dataset.subject, { keepChapter: false });
    });
  }
  async function selectSubject(slug, options = {}) {
    activeSubject = slug;
    $("#meta-subject").value = slug;
    const subject = allSubjects.find(s => s.slug === slug);
    subjectChapters = subject ? subject.chapters : [];
    renderSubjectTabs();
    const requested = options.chapter || (options.keepChapter ? selectedSlug : "");
    const match = subjectChapters.find(c => c.slug === requested) || subjectChapters[0];
    if (match) selectChapter(match, { silent: true, test: options.test, keepTitle: options.keepTitle });
    renderChapterList();
    updateAttachHint();
  }
  function selectedChapter() { return subjectChapters.find(c => c.slug === selectedSlug); }
  function testNumber(slug) { const m = /^test-(\d+)$/.exec(slug || ""); return m ? Number(m[1]) : 1; }
  function publishedTests(chapter) { return BBWData.chapterTests(chapter || selectedChapter(), { includeEmpty: true }); }
  function renderChapterList() {
    const query = ($("#chapter-search").value || "").trim().toLowerCase();
    const filtered = subjectChapters.filter(c => !query || [c.slug, c.title.hi, c.title.en, c.section].join(" ").toLowerCase().includes(query));
    const selected = selectedSlug;
    $("#admin-chapter-list").innerHTML = filtered.length ? filtered.map((c, i) => {
      const tests = publishedTests(c);
      const questions = BBWData.chapterQuestionCount(c);
      const ready = tests.length > 0;
      const section = c.section ? `<span class="chip">${BBWUI.escape(SECTION_LABELS[c.section] || c.section)}</span>` : "";
      const chip = ready ? `${tests.length} test${tests.length === 1 ? "" : "s"} • ${questions} Q` : "Empty";
      return `<button type="button" class="admin-chapter-item ${c.slug === selected ? "is-selected" : ""}" data-slug="${BBWUI.escape(c.slug)}">
        <span class="chapter-number">${String(i + 1).padStart(2, "0")}</span>
        <span class="chapter-info"><strong>${BBWUI.escape(c.title.hi)}</strong><small>${section} ${BBWUI.escape(c.title.en)} • ${c.slug}</small></span>
        <span class="chip ${ready ? "good" : ""}">${chip}</span>
      </button>`;
    }).join("") : `<div class="empty-state">इस विषय में कोई chapter नहीं मिला।</div>`;
    $("#admin-chapter-list").querySelectorAll("[data-slug]").forEach(btn => {
      btn.onclick = () => {
        const chapter = subjectChapters.find(c => c.slug === btn.dataset.slug);
        if (chapter) selectChapter(chapter);
      };
    });
  }
  function selectChapter(chapter, options = {}) {
    selectedSlug = chapter.slug;
    $("#meta-subject").value = activeSubject;
    $("#meta-chapter").value = chapter.slug;
    $("#meta-hi").value = chapter.title.hi;
    $("#meta-en").value = chapter.title.en;
    const tests = publishedTests(chapter);
    const requested = options.test;
    if (requested) selectedTestSlug = requested;
    else if (tests.length) selectedTestSlug = tests[tests.length - 1].slug;
    else selectedTestSlug = "test-1";
    $("#meta-test").value = selectedTestSlug;
    if (!options.keepTitle) {
      const existing = tests.find(t => t.slug === selectedTestSlug);
      $("#meta-title").value = existing && existing.title ? existing.title : `${chapter.title.hi} - अध्याय टेस्ट ${testNumber(selectedTestSlug)}`;
    }
    $("#selected-chapter-badge").textContent = chapter.title.hi;
    $("#selected-test-badge").textContent = selectedTestSlug;
    updateMetaUi();
    renderChapterList();
    renderTestStrip();
    updateAttachHint();
    if (!options.silent) {
      status(`${chapter.title.hi} / ${selectedTestSlug} selected. JSON अब इसी test पर attach होगा।`);
      saveDraft();
    }
  }
  function renderTestStrip() {
    const list = $("#admin-test-list");
    if (!list) return;
    const tests = publishedTests();
    const known = tests.some(t => t.slug === selectedTestSlug);
    const buttons = tests.map(t => `<button type="button" class="admin-test-item ${t.slug === selectedTestSlug ? "is-selected" : ""}" data-test="${BBWUI.escape(t.slug)}">${BBWUI.escape(t.slug)} <small>${t.questionCount || 0} Q</small></button>`).join("");
    const pending = known ? "" : `<button type="button" class="admin-test-item is-selected" data-test="${BBWUI.escape(selectedTestSlug)}">${BBWUI.escape(selectedTestSlug)} <small>new</small></button>`;
    list.innerHTML = `${buttons}${pending}<button type="button" id="new-test" class="admin-test-item is-new">+ New test</button>`;
    list.querySelectorAll("[data-test]").forEach(btn => { btn.onclick = () => selectTest(btn.dataset.test); });
    const add = list.querySelector("#new-test");
    if (add) add.onclick = createNewTest;
  }
  function selectTest(slug, options = {}) {
    selectedTestSlug = slug;
    $("#meta-test").value = slug;
    $("#selected-test-badge").textContent = slug;
    const existing = publishedTests().find(t => t.slug === slug);
    if (!options.keepTitle) {
      $("#meta-title").value = existing && existing.title ? existing.title : `${$("#meta-hi").value} - अध्याय टेस्ट ${testNumber(slug)}`;
    }
    if (existing) {
      if (existing.timeLimitMinutes != null) $("#meta-time").value = existing.timeLimitMinutes;
      if (existing.quizType) $("#meta-type").value = existing.quizType;
    }
    renderTestStrip();
    updateMetaUi();
    if (!options.silent) {
      status(`${slug} selected. JSON ${currentPath()} पर attach होगा।`);
      saveDraft();
    }
  }
  function createNewTest() {
    const next = BBWData.nextTestSlug(selectedChapter(), [selectedTestSlug]);
    questions = [];
    sourceWrapper = null;
    report = null;
    selectedTestSlug = next;
    $("#meta-test").value = next;
    $("#meta-title").value = `${$("#meta-hi").value} - अध्याय टेस्ट ${testNumber(next)}`;
    populateQuizSettings({ quizType: "CHAPTER_TEST", timeLimitMinutes: 10, passingScore: 33, negativeMarkingEnabled: false, negativeMarksPerQuestion: 0, shuffle: false });
    $("#validation-stats").innerHTML = "";
    $("#issues").innerHTML = '<p class="muted">No data loaded.</p>';
    renderQuestions();
    renderPreview();
    renderTestStrip();
    updateMetaUi();
    saveDraft();
    status(`New ${next} — JSON को ${currentPath()} पर save करें।`);
  }
  function currentPath() {
    return BBWData.testPath($("#meta-subject").value, $("#meta-chapter").value || "<chapter>", selectedTestSlug || "<test>");
  }
  function updateAttachHint() {
    $("#attach-hint").innerHTML = `JSON <code>${BBWUI.escape(currentPath())}</code> पर attach होगा। Bare question array भी चल जाएगा — subject/chapter/test metadata अपने-आप भर जाएगी। Browser file को Downloads में <code>${BBWUI.escape(selectedTestSlug || "test-1")}.json</code> नाम से save करेगा।`;
  }
  function requireChapter() {
    if (!$("#meta-chapter").value) { status("पहले syllabus से chapter चुनें।", true); return false; }
    if (!selectedTestSlug) { status("पहले एक test चुनें या नया बनाएँ।", true); return false; }
    return true;
  }
  async function loadFile(file) {
    if (!requireChapter()) return;
    if (!file) return;
    if (!/\.json$/i.test(file.name)) return status("Only .json files are supported.", true);
    try { loadInput(await file.text()); } catch (e) { status(e.message, true); }
  }
  function loadInput(input, options = {}) {
    if (!requireChapter()) return;
    report = BBWValidate.parse(input);
    renderReport();
    if (report.wrapper) sourceWrapper = report.wrapper;
    else sourceWrapper = null;
    questions = report.rows.map(r => r.data);
    applySelectedChapterToQuestions();
    if (!options.fromRestore) populateQuizSettings(report.wrapper || {});
    renderQuestions(); renderPreview(); saveDraft();
    const chapterName = $("#meta-hi").value || $("#meta-chapter").value;
    status(report.errors.length ? "Validation errors ठीक करें।" : `${questions.length} questions ${chapterName} / ${selectedTestSlug} पर attach हो गए।`, !!report.errors.length);
  }
  function applySelectedChapterToQuestions() {
    const m = metadata();
    sourceWrapper = Object.assign({}, sourceWrapper || {}, {
      subject: m.subject,
      chapter: m.chapter,
      title: m.title,
      quizType: m.quizType,
      timeLimitMinutes: m.timeLimitMinutes,
      passingScore: m.passingScore,
      negativeMarkingEnabled: m.negativeMarkingEnabled,
      negativeMarksPerQuestion: m.negativeMarksPerQuestion,
      shuffle: m.shuffle,
      id: `${m.subject}-${m.chapter}-${m.test}`
    });
  }
  function populateQuizSettings(w) {
    if (w.quizType) $("#meta-type").value = w.quizType;
    if (w.timeLimitMinutes != null) $("#meta-time").value = w.timeLimitMinutes;
    if (w.passingScore != null) $("#meta-pass").value = w.passingScore;
    $("#meta-negative").checked = Boolean(w.negativeMarkingEnabled);
    $("#meta-negative-value").value = w.negativeMarksPerQuestion || 0;
    $("#meta-negative-value").disabled = !w.negativeMarkingEnabled;
    $("#meta-shuffle").checked = Boolean(w.shuffle);
    updateMetaUi();
  }
  function metadata() {
    const m = {};
    Object.entries(fields).forEach(([key, sel]) => { const el = $(sel); m[key] = el.type === "checkbox" ? el.checked : el.value; });
    m.test = selectedTestSlug || m.test || "test-1";
    m.timeLimitMinutes = Number(m.timeLimitMinutes);
    m.passingScore = Number(m.passingScore);
    m.negativeMarksPerQuestion = Number(m.negativeMarksPerQuestion);
    m.id = `${m.subject}-${m.chapter}-${m.test}`;
    return m;
  }
  function normalized() {
    const raw = BBWValidate.normalize(questions, metadata());
    return {
      id: raw.id,
      title: raw.title,
      subject: raw.subject,
      chapter: raw.chapter,
      quizType: raw.quizType,
      timeLimitMinutes: raw.timeLimitMinutes,
      passingScore: raw.passingScore,
      negativeMarkingEnabled: raw.negativeMarkingEnabled,
      negativeMarksPerQuestion: raw.negativeMarksPerQuestion,
      shuffle: raw.shuffle,
      questions: raw.questions
    };
  }
  function revalidate() { report = BBWValidate.parse(Object.assign({}, metadata(), { questions })); renderReport(); renderPreview(); }
  function renderReport() {
    if (!report) return;
    $("#validation-stats").innerHTML = `<span class="chip">${report.totalRows} rows</span><span class="chip good">${report.validRows} valid</span><span class="chip ${report.invalidRows ? "bad" : ""}">${report.invalidRows} invalid</span><span class="chip">${report.warnings.length} warnings</span>`;
    const all = [...report.errors.map(x => ({ x, t: "Error" })), ...report.warnings.map(x => ({ x, t: "Warning" }))];
    $("#issues").innerHTML = all.length ? all.map(({ x, t }) => `<p class="${t === "Error" ? "destructive" : "warning"}"><strong>${t}${x.row ? ` • Row ${x.row}` : ""}</strong>: ${BBWUI.escape(x.message)}</p>`).join("") : '<p class="success">✓ No validation issues.</p>';
  }
  function renderQuestions() {
    $("#editor-count").textContent = `${questions.length} questions`;
    $("#question-list").innerHTML = questions.map((q, i) => `<article class="question-editor"><div class="editor-toolbar"><button class="btn btn-outline" data-action="up" data-i="${i}" ${i === 0 ? "disabled" : ""}>↑</button><button class="btn btn-outline" data-action="down" data-i="${i}" ${i === questions.length - 1 ? "disabled" : ""}>↓</button><button class="btn btn-outline" data-action="edit" data-i="${i}">Edit</button><button class="btn btn-ghost destructive" data-action="delete" data-i="${i}">Delete</button></div><strong>Q${i + 1}. ${BBWMath.render(q.question)}</strong><p class="muted">Correct: ${q.correctOption} • ${q.marks} mark</p></article>`).join("");
    $("#question-list").querySelectorAll("[data-action]").forEach(b => b.onclick = () => act(b.dataset.action, Number(b.dataset.i)));
  }
  function act(action, i) {
    if (action === "delete" && confirm(`Question ${i + 1} delete करें?`)) questions.splice(i, 1);
    if (action === "up" && i > 0) [questions[i - 1], questions[i]] = [questions[i], questions[i - 1]];
    if (action === "down" && i < questions.length - 1) [questions[i + 1], questions[i]] = [questions[i], questions[i + 1]];
    if (action === "edit") {
      const q = questions[i];
      $("#edit-index").value = i;
      $("#q-question").value = q.question;
      [1, 2, 3, 4].forEach(n => $("#q-option" + n).value = q["option" + n]);
      $("#q-correct").value = q.correctOption;
      $("#q-explanation").value = q.explanation;
      $("#q-marks").value = q.marks;
      $("#question-form").scrollIntoView({ behavior: "smooth" });
      return;
    }
    clearEditor(); revalidate(); renderQuestions(); saveDraft();
  }
  function saveQuestion(e) {
    e.preventDefault();
    if (!requireChapter()) return;
    const q = { question: $("#q-question").value, option1: $("#q-option1").value, option2: $("#q-option2").value, option3: $("#q-option3").value, option4: $("#q-option4").value, correctOption: $("#q-correct").value, explanation: $("#q-explanation").value, marks: Number($("#q-marks").value || 1) };
    const one = BBWValidate.parse([q]); if (one.errors.length) { status(one.errors[0].message, true); return; }
    const i = $("#edit-index").value; if (i === "") questions.push(q); else questions[Number(i)] = q;
    clearEditor(); revalidate(); renderQuestions(); saveDraft(); status("Question saved.");
  }
  function clearEditor() { $("#question-form").reset(); $("#edit-index").value = ""; $("#q-marks").value = 1; $("#q-correct").value = 1; }
  function renderPreview() {
    if (!questions.length) { $("#answer-preview").innerHTML = "No questions loaded."; return; }
    $("#answer-preview").innerHTML = questions.map((q, i) => `<div class="answer-item"><strong>${i + 1}. ${BBWMath.render(q.question)}</strong><div class="success">✓ ${"ABCD"[Number(q.correctOption) - 1]}. ${BBWMath.render(q["option" + q.correctOption])}</div>${q.explanation ? `<small>${BBWMath.render(q.explanation)}</small>` : ""}</div>`).join("");
  }
  function updateMetaUi() {
    $("#meta-test").value = selectedTestSlug;
    $("#selected-test-badge").textContent = selectedTestSlug;
    $("#target-path").textContent = currentPath();
    updateAttachHint();
  }
  function ensureValid() {
    if (!requireChapter()) return false;
    revalidate();
    if (!questions.length || report.errors.length) { status("Valid questions required before practice/download.", true); return false; }
    if (!/^[a-z0-9-]+$/.test($("#meta-chapter").value)) { status("Chapter slug must use lowercase letters, numbers, hyphens.", true); return false; }
    if (!/^[a-z0-9-]+$/.test(selectedTestSlug)) { status("Test slug must use lowercase letters, numbers, hyphens.", true); return false; }
    if (!$("#meta-title").value.trim()) { status("Test title is required.", true); return false; }
    return true;
  }
  function practice() { if (!ensureValid()) return; BBWData.savePractice(normalized()); window.open("test.html?practice=1", "_blank"); }
  function downloadTest() {
    if (!ensureValid()) return;
    const path = currentPath();
    BBWData.downloadJson(normalized(), `${selectedTestSlug}.json`);
    status(`Downloaded as ${selectedTestSlug}.json — move it to ${path}`);
  }
  async function buildManifest(download) {
    if (!ensureValid()) return null;
    try {
      const manifest = await BBWData.loadManifest(), m = metadata(), subject = manifest.classes[0].subjects.find(s => s.slug === m.subject);
      if (!subject) throw new Error("Selected subject not found in manifest.");
      let i = subject.chapters.findIndex(c => c.slug === m.chapter);
      if (i < 0) {
        subject.chapters.push({ id: `chapter-${m.chapter}`, slug: m.chapter, title: { hi: $("#meta-hi").value || m.chapter, en: $("#meta-en").value || m.chapter }, tests: [] });
        i = subject.chapters.length - 1;
      }
      const chapter = Object.assign({}, subject.chapters[i]);
      chapter.title = { hi: $("#meta-hi").value || chapter.title && chapter.title.hi || m.chapter, en: $("#meta-en").value || chapter.title && chapter.title.en || m.chapter };
      const tests = Array.isArray(chapter.tests) ? chapter.tests.slice() : [];
      const testEntry = {
        id: m.id,
        slug: m.test,
        title: m.title,
        file: BBWData.testPath(m.subject, m.chapter, m.test),
        questionCount: questions.length,
        timeLimitMinutes: m.timeLimitMinutes,
        quizType: m.quizType,
        updatedAt: new Date().toISOString()
      };
      const ti = tests.findIndex(t => t.slug === m.test);
      if (ti >= 0) tests[ti] = Object.assign({}, tests[ti], testEntry);
      else tests.push(testEntry);
      chapter.tests = tests;
      delete chapter.file;
      delete chapter.questionCount;
      delete chapter.timeLimitMinutes;
      delete chapter.updatedAt;
      subject.chapters[i] = chapter;
      if (download) BBWData.downloadJson(manifest, "manifest.json");
      status(`Manifest updated with ${m.test} at ${testEntry.file}.`);
      return manifest;
    } catch (e) { status(e.message, true); return null; }
  }
  async function loadExisting() {
    if (!requireChapter()) return;
    const s = $("#meta-subject").value, c = $("#meta-chapter").value, t = selectedTestSlug;
    try { loadInput(await BBWData.loadTest(s, c, t)); status(`Loaded ${BBWData.testPath(s, c, t)}`); }
    catch (e) { status(`${t} पर अभी published JSON नहीं है। नया JSON attach करें।`, true); }
  }
  function downloadTemplate() {
    const m = metadata();
    BBWData.downloadJson({ id: `${m.subject}-${m.chapter || "chapter"}-${m.test || "test-1"}`, title: m.title || "अध्याय टेस्ट 1", subject: m.subject, chapter: m.chapter, quizType: "CHAPTER_TEST", timeLimitMinutes: 10, passingScore: 33, negativeMarkingEnabled: false, negativeMarksPerQuestion: 0, shuffle: false, questions: [{ question: "प्रश्न लिखें", option1: "विकल्प 1", option2: "विकल्प 2", option3: "विकल्प 3", option4: "विकल्प 4", correctOption: "1", explanation: "व्याख्या", marks: 1 }] }, `${m.test || "test-1"}-template.json`);
  }
  function saveDraft() { try { localStorage.setItem(DRAFT, JSON.stringify({ questions, metadata: metadata(), hi: $("#meta-hi").value, en: $("#meta-en").value, sourceWrapper, test: selectedTestSlug })); } catch (_) {} }
  function restoreDraft() {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT));
      if (!d) return false;
      questions = d.questions || [];
      sourceWrapper = d.sourceWrapper;
      if (d.metadata) {
        $("#meta-title").value = d.metadata.title || "";
        $("#meta-subject").value = d.metadata.subject || "science";
        $("#meta-chapter").value = d.metadata.chapter || "light";
        selectedSlug = d.metadata.chapter || "light";
        selectedTestSlug = d.metadata.test || d.test || "test-1";
        $("#meta-test").value = selectedTestSlug;
        populateQuizSettings(d.metadata);
      }
      $("#meta-hi").value = d.hi || "";
      $("#meta-en").value = d.en || "";
      if (questions.length) { revalidate(); renderQuestions(); status(`Restored draft with ${questions.length} questions.`); }
      updateMetaUi();
      return true;
    } catch (_) { return false; }
  }
  function status(message, error) { $("#import-status").className = `admin-status ${error ? "destructive" : ""}`; $("#import-status").textContent = message; }
})();
