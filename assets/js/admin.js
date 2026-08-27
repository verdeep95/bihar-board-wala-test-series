(function () {
  "use strict";
  const DRAFT = "bbw:admin:draft";
  let questions = [], sourceWrapper = null, report = null;
  let courses = [], activeCourse = "", courseManifest = null, allSubjects = [], subjectChapters = [];
  let activeSubject = "", selectedSlug = "", selectedTestSlug = "test-1";
  let rootDirty = false;
  const $ = s => document.querySelector(s);
  const fields = { title:"#meta-title", course:"#meta-course", subject:"#meta-subject", chapter:"#meta-chapter", test:"#meta-test", hi:"#meta-hi", en:"#meta-en", quizType:"#meta-type", timeLimitMinutes:"#meta-time", passingScore:"#meta-pass", negativeMarkingEnabled:"#meta-negative", negativeMarksPerQuestion:"#meta-negative-value", shuffle:"#meta-shuffle" };
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
    $("#download-manifest").onclick = () => downloadManifests();
    $("#download-both").onclick = async () => { if (!ensureValid()) return; downloadTest(); setTimeout(() => downloadManifests(), 350); };
    $("#meta-subject").addEventListener("change", () => selectSubject($("#meta-subject").value, { keepChapter: false }));
    $("#chapter-search").addEventListener("input", renderChapterList);
  }

  async function initSyllabus() {
    try {
      courses = await BBWData.loadCourses();
      if (!courses.length) throw new Error("data/manifest.json में कोई course नहीं है।");
      const restored = restoreDraft();
      const wanted = $("#meta-course").value || BBWData.storedCourse() || courses[0].slug;
      await selectCourse(courses.some(c => c.slug === wanted) ? wanted : courses[0].slug, {
        subject: $("#meta-subject").value,
        chapter: $("#meta-chapter").value,
        test: $("#meta-test").value || selectedTestSlug,
        keepTitle: restored
      });
    } catch (error) {
      $("#admin-chapter-list").innerHTML = BBWUI.errorState(error.message);
    }
  }

  async function courseManifestFor(slug) {
    try { return await BBWData.loadCourse(slug); }
    catch (_) { return { version: 2, course: slug, sectionLabels: {}, subjects: [] }; }
  }

  function renderCourseTabs() {
    const strip = $("#admin-course-tabs");
    if (!strip) return;
    strip.innerHTML = courses.map(c => {
      const soon = c.status === "coming-soon" ? ' <small>soon</small>' : ` <small>${c.testCount || 0} T</small>`;
      return `<button type="button" class="${c.slug === activeCourse ? "active" : ""}" data-course="${BBWUI.escape(c.slug)}">${BBWUI.escape(BBWUI.localized(c.name, c.slug))}${soon}</button>`;
    }).join("") + `<button type="button" id="new-course" class="admin-test-item is-new">+ नया कोर्स</button>`;
    strip.querySelectorAll("[data-course]").forEach(btn => { btn.onclick = () => selectCourse(btn.dataset.course); });
    strip.querySelector("#new-course").onclick = newCourseSheet;
  }

  async function selectCourse(slug, options = {}) {
    activeCourse = slug;
    $("#meta-course").value = slug;
    courseManifest = await courseManifestFor(slug);
    allSubjects = Array.isArray(courseManifest.subjects) ? courseManifest.subjects : [];
    renderCourseTabs();
    populateSubjectSelect();
    const requested = options.subject || (options.keepSubject ? activeSubject : "");
    const subject = allSubjects.find(s => s.slug === requested) || allSubjects[0];
    if (subject) selectSubject(subject.slug, { chapter: options.chapter, test: options.test, keepTitle: options.keepTitle });
    else {
      activeSubject = ""; subjectChapters = []; selectedSlug = "";
      $("#meta-subject").value = ""; $("#meta-chapter").value = "";
      renderSubjectTabs(); renderChapterList(); renderTestStrip(); updateMetaUi();
      status(`${slug} में अभी कोई subject नहीं है। "+ नया विषय" से पहला subject बनाएँ।`);
    }
  }

  function populateSubjectSelect() {
    const select = $("#meta-subject");
    select.innerHTML = allSubjects.map(s => `<option value="${BBWUI.escape(s.slug)}">${BBWUI.escape(BBWUI.localized(s.name, s.slug))}</option>`).join("");
    if (!allSubjects.length) select.innerHTML = `<option value="">— कोई subject नहीं —</option>`;
  }

  function renderSubjectTabs() {
    $("#admin-subject-tabs").innerHTML = allSubjects.map(s => `<button type="button" class="${s.slug === activeSubject ? "active" : ""}" data-subject="${BBWUI.escape(s.slug)}">${BBWUI.escape(BBWUI.localized(s.name, s.slug))} <small>${s.chapters.length}</small></button>`).join("") + `<button type="button" id="new-subject" class="admin-test-item is-new">+ नया विषय</button>`;
    $("#admin-subject-tabs").querySelectorAll("[data-subject]").forEach(btn => {
      btn.onclick = () => selectSubject(btn.dataset.subject, { keepChapter: false });
    });
    $("#admin-subject-tabs").querySelector("#new-subject").onclick = newSubjectSheet;
  }

  function selectSubject(slug, options = {}) {
    activeSubject = slug;
    $("#meta-subject").value = slug;
    const subject = allSubjects.find(s => s.slug === slug);
    subjectChapters = subject ? subject.chapters : [];
    renderSubjectTabs();
    const requested = options.chapter || (options.keepChapter ? selectedSlug : "");
    const match = subjectChapters.find(c => c.slug === requested) || subjectChapters[0];
    if (match) selectChapter(match, { silent: true, test: options.test, keepTitle: options.keepTitle });
    else {
      selectedSlug = "";
      $("#meta-chapter").value = ""; $("#meta-hi").value = ""; $("#meta-en").value = "";
      $("#selected-chapter-badge").textContent = "No chapter selected";
      renderTestStrip(); updateMetaUi();
    }
    renderChapterList();
    updateAttachHint();
  }

  function selectedChapter() { return subjectChapters.find(c => c.slug === selectedSlug); }
  function testNumber(slug) { const m = /^test-(\d+)$/.exec(slug || ""); return m ? Number(m[1]) : 1; }
  function publishedTests(chapter) { return BBWData.chapterTests(chapter || selectedChapter(), { includeEmpty: true }); }

  function renderChapterList() {
    const query = ($("#chapter-search").value || "").trim().toLowerCase();
    const filtered = subjectChapters.filter(c => !query || [c.slug, c.title.hi, c.title.en, c.section].join(" ").toLowerCase().includes(query));
    const addButton = `<button type="button" id="new-chapter" class="admin-chapter-item" style="border-style:dashed;justify-content:center">+ नया अध्याय / टॉपिक</button>`;
    $("#admin-chapter-list").innerHTML = (filtered.length ? filtered.map((c, i) => {
      const tests = publishedTests(c);
      const questionTotal = BBWData.chapterQuestionCount(c);
      const ready = tests.length > 0;
      const label = BBWData.sectionLabel(courseManifest, c.section);
      const section = label ? `<span class="chip">${BBWUI.escape(label)}</span>` : "";
      const chip = ready ? `${tests.length} test${tests.length === 1 ? "" : "s"} • ${questionTotal} Q` : "Empty";
      return `<button type="button" class="admin-chapter-item ${c.slug === selectedSlug ? "is-selected" : ""}" data-slug="${BBWUI.escape(c.slug)}">
        <span class="chapter-number">${String(i + 1).padStart(2, "0")}</span>
        <span class="chapter-info"><strong>${BBWUI.escape(BBWUI.localized(c.title, c.slug))}</strong><small>${section} ${BBWUI.escape(BBWUI.secondary(c.title) || "")} • ${c.slug}</small></span>
        <span class="chip ${ready ? "good" : ""}">${chip}</span>
      </button>`;
    }).join("") : `<div class="empty-state">इस विषय में कोई chapter नहीं मिला।</div>`) + addButton;
    $("#admin-chapter-list").querySelectorAll("[data-slug]").forEach(btn => {
      btn.onclick = () => {
        const chapter = subjectChapters.find(c => c.slug === btn.dataset.slug);
        if (chapter) selectChapter(chapter);
      };
    });
    $("#admin-chapter-list").querySelector("#new-chapter").onclick = newChapterSheet;
  }

  function selectChapter(chapter, options = {}) {
    selectedSlug = chapter.slug;
    $("#meta-subject").value = activeSubject;
    $("#meta-chapter").value = chapter.slug;
    $("#meta-hi").value = chapter.title.hi || "";
    $("#meta-en").value = chapter.title.en || "";
    const tests = publishedTests(chapter);
    const requested = options.test;
    if (requested) selectedTestSlug = requested;
    else if (tests.length) selectedTestSlug = tests[tests.length - 1].slug;
    else selectedTestSlug = "test-1";
    $("#meta-test").value = selectedTestSlug;
    if (!options.keepTitle) {
      const existing = tests.find(t => t.slug === selectedTestSlug);
      $("#meta-title").value = existing && existing.title ? existing.title : `${chapter.title.hi || chapter.slug} - अध्याय टेस्ट ${testNumber(selectedTestSlug)}`;
    }
    $("#selected-chapter-badge").textContent = chapter.title.hi || chapter.slug;
    $("#selected-test-badge").textContent = selectedTestSlug;
    updateMetaUi();
    renderChapterList();
    renderTestStrip();
    updateAttachHint();
    if (!options.silent) {
      status(`${chapter.title.hi || chapter.slug} / ${selectedTestSlug} selected. JSON अब इसी test पर attach होगा।`);
      saveDraft();
    }
  }

  function renderTestStrip() {
    const list = $("#admin-test-list");
    if (!list) return;
    const tests = publishedTests();
    const known = tests.some(t => t.slug === selectedTestSlug);
    const buttons = tests.map(t => `<button type="button" class="admin-test-item ${t.slug === selectedTestSlug ? "is-selected" : ""}" data-test="${BBWUI.escape(t.slug)}">${BBWUI.escape(t.slug)} <small>${t.questionCount || 0} Q</small></button>`).join("");
    const pending = known || !selectedSlug ? "" : `<button type="button" class="admin-test-item is-selected" data-test="${BBWUI.escape(selectedTestSlug)}">${BBWUI.escape(selectedTestSlug)} <small>new</small></button>`;
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
    if (!requireChapter()) return;
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

  function sheetField(id, label, placeholder, value) {
    return `<label class="field"><span>${label}</span><input id="${id}" placeholder="${placeholder || ""}" value="${value || ""}"></label>`;
  }

  function newCourseSheet() {
    const sheet = BBWUI.openSheet("नया कोर्स", `<div class="form-grid">
      ${sheetField("nc-slug", "Course slug (a-z, 0-9, -)", "class-11")}
      ${sheetField("nc-hi", "Hindi name", "कक्षा 11")}
      ${sheetField("nc-en", "English name", "Class 11")}
      ${sheetField("nc-tagline", "Tagline (Hindi)", "बिहार बोर्ड इंटर टेस्ट सीरीज़")}
      ${sheetField("nc-icon", "Icon (text or emoji)", "11")}
      <label class="field"><span>Type</span><select id="nc-type"><option value="board">board</option><option value="competition">competition</option></select></label>
      ${sheetField("nc-unit", "Unit label (Hindi)", "अध्याय", "अध्याय")}
      ${sheetField("nc-accent", "Accent (HSL channels)", "160 84% 39%", "160 84% 39%")}
    </div><div class="button-row" style="margin-top:1rem"><button id="nc-cancel" class="btn btn-outline">Cancel</button><button id="nc-save" class="btn btn-primary">कोर्स जोड़ें</button></div>`);
    sheet.querySelector("#nc-cancel").onclick = BBWUI.closeSheet;
    sheet.querySelector("#nc-save").onclick = async () => {
      const slug = (sheet.querySelector("#nc-slug").value || "").trim().toLowerCase();
      if (!/^[a-z0-9-]+$/.test(slug)) return status("Course slug में सिर्फ lowercase letters, numbers, hyphen चलेंगे।", true);
      if (courses.some(c => c.slug === slug)) return status("यह course slug पहले से मौजूद है।", true);
      const hi = (sheet.querySelector("#nc-hi").value || "").trim() || slug;
      const en = (sheet.querySelector("#nc-en").value || "").trim() || slug;
      courses.push({
        id: slug, slug, type: sheet.querySelector("#nc-type").value, status: "live",
        order: courses.length + 1,
        icon: (sheet.querySelector("#nc-icon").value || "").trim() || "📘",
        accent: (sheet.querySelector("#nc-accent").value || "").trim() || "243 75% 59%",
        name: { en, hi },
        tagline: { en, hi: (sheet.querySelector("#nc-tagline").value || "").trim() || hi },
        unitLabel: { en: "Chapter", hi: (sheet.querySelector("#nc-unit").value || "").trim() || "अध्याय" },
        manifest: `data/${slug}/manifest.json`,
        subjectCount: 0, testCount: 0, questionCount: 0
      });
      rootDirty = true;
      BBWUI.closeSheet();
      await selectCourse(slug);
      status(`${hi} जोड़ा गया। अब "+ नया विषय" से subject बनाएँ, फिर test publish करें।`);
    };
  }

  function newSubjectSheet() {
    const sheet = BBWUI.openSheet("नया विषय", `<div class="form-grid">
      ${sheetField("ns-slug", "Subject slug", "physics")}
      ${sheetField("ns-hi", "Hindi name", "भौतिकी")}
      ${sheetField("ns-en", "English name", "Physics")}
    </div><div class="button-row" style="margin-top:1rem"><button id="ns-cancel" class="btn btn-outline">Cancel</button><button id="ns-save" class="btn btn-primary">विषय जोड़ें</button></div>`);
    sheet.querySelector("#ns-cancel").onclick = BBWUI.closeSheet;
    sheet.querySelector("#ns-save").onclick = () => {
      const slug = (sheet.querySelector("#ns-slug").value || "").trim().toLowerCase();
      if (!/^[a-z0-9-]+$/.test(slug)) return status("Subject slug में सिर्फ lowercase letters, numbers, hyphen चलेंगे।", true);
      if (allSubjects.some(s => s.slug === slug)) return status("यह subject पहले से मौजूद है।", true);
      const hi = (sheet.querySelector("#ns-hi").value || "").trim() || slug;
      const en = (sheet.querySelector("#ns-en").value || "").trim() || slug;
      allSubjects.push({ id: slug, slug, name: { en, hi }, chapters: [] });
      courseManifest.subjects = allSubjects;
      BBWUI.closeSheet();
      populateSubjectSelect();
      selectSubject(slug, { keepChapter: false });
      status(`${hi} जोड़ा गया। अब "+ नया अध्याय" से पहला chapter बनाएँ।`);
    };
  }

  function newChapterSheet() {
    if (!activeSubject) return status("पहले एक subject चुनें या बनाएँ।", true);
    const labels = Object.keys(courseManifest.sectionLabels || {});
    const sectionField = labels.length
      ? `<label class="field"><span>Section (optional)</span><select id="nch-section"><option value="">—</option>${labels.map(k => `<option value="${BBWUI.escape(k)}">${BBWUI.escape(courseManifest.sectionLabels[k])}</option>`).join("")}</select></label>`
      : "";
    const sheet = BBWUI.openSheet("नया अध्याय / टॉपिक", `<div class="form-grid">
      ${sheetField("nch-slug", "Chapter slug", "units-and-measurements")}
      ${sheetField("nch-hi", "Hindi title", "मात्रक एवं मापन")}
      ${sheetField("nch-en", "English title", "Units and Measurements")}
      ${sectionField}
    </div><div class="button-row" style="margin-top:1rem"><button id="nch-cancel" class="btn btn-outline">Cancel</button><button id="nch-save" class="btn btn-primary">अध्याय जोड़ें</button></div>`);
    sheet.querySelector("#nch-cancel").onclick = BBWUI.closeSheet;
    sheet.querySelector("#nch-save").onclick = () => {
      const slug = (sheet.querySelector("#nch-slug").value || "").trim().toLowerCase();
      if (!/^[a-z0-9-]+$/.test(slug)) return status("Chapter slug में सिर्फ lowercase letters, numbers, hyphen चलेंगे।", true);
      if (subjectChapters.some(c => c.slug === slug)) return status("यह chapter पहले से मौजूद है।", true);
      const hi = (sheet.querySelector("#nch-hi").value || "").trim() || slug;
      const en = (sheet.querySelector("#nch-en").value || "").trim() || slug;
      const section = sheet.querySelector("#nch-section") ? sheet.querySelector("#nch-section").value : "";
      const chapter = { id: `chapter-${slug}`, slug, title: { en, hi } };
      if (section) chapter.section = section;
      subjectChapters.push(chapter);
      BBWUI.closeSheet();
      selectChapter(chapter);
      status(`${hi} जोड़ा गया। अब इस chapter का JSON attach करें।`);
    };
  }

  function currentPath() {
    return BBWData.testPath(activeCourse || "<course>", $("#meta-subject").value || "<subject>", $("#meta-chapter").value || "<chapter>", selectedTestSlug || "<test>");
  }
  function updateAttachHint() {
    $("#attach-hint").innerHTML = `JSON <code>${BBWUI.escape(currentPath())}</code> पर attach होगा। Bare question array भी चल जाएगा — course/subject/chapter/test metadata अपने-आप भर जाएगी। Browser file को Downloads में <code>${BBWUI.escape(selectedTestSlug || "test-1")}.json</code> नाम से save करेगा।`;
  }
  function requireChapter() {
    if (!activeCourse) { status("पहले एक course चुनें।", true); return false; }
    if (!$("#meta-subject").value) { status("पहले एक subject चुनें या बनाएँ।", true); return false; }
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
      course: m.course,
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
    m.course = activeCourse || m.course;
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
      course: raw.course,
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
    $("#meta-course").value = activeCourse;
    $("#meta-test").value = selectedTestSlug;
    $("#selected-test-badge").textContent = selectedTestSlug;
    $("#target-path").textContent = currentPath();
    updateAttachHint();
  }
  function ensureValid() {
    if (!requireChapter()) return false;
    revalidate();
    if (!questions.length || report.errors.length) { status("Valid questions required before practice/download.", true); return false; }
    if (!/^[a-z0-9-]+$/.test(activeCourse)) { status("Course slug must use lowercase letters, numbers, hyphens.", true); return false; }
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

  function buildCourseManifest() {
    const m = metadata();
    const manifest = {
      version: 2,
      course: activeCourse,
      sectionLabels: courseManifest.sectionLabels || {},
      subjects: (courseManifest.subjects || []).map(s => Object.assign({}, s, { chapters: s.chapters.slice() }))
    };
    let subject = manifest.subjects.find(s => s.slug === m.subject);
    if (!subject) {
      subject = { id: m.subject, slug: m.subject, name: { en: m.subject, hi: m.subject }, chapters: [] };
      manifest.subjects.push(subject);
    }
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
      file: BBWData.testPath(activeCourse, m.subject, m.chapter, m.test),
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
    return { manifest, testEntry };
  }

  function buildRootManifest(counts) {
    const list = courses.map(c => {
      if (c.slug !== activeCourse) return Object.assign({}, c);
      return Object.assign({}, c, {
        status: counts.testCount > 0 ? "live" : c.status,
        subjectCount: counts.subjectCount,
        testCount: counts.testCount,
        questionCount: counts.questionCount
      });
    });
    return { version: 2, courses: list };
  }

  function downloadManifests() {
    if (!ensureValid()) return null;
    try {
      const { manifest, testEntry } = buildCourseManifest();
      const counts = BBWData.countCourse(manifest.subjects);
      const root = buildRootManifest(counts);
      const target = courses.find(c => c.slug === activeCourse);
      if (target) Object.assign(target, { status: root.courses.find(c => c.slug === activeCourse).status, subjectCount: counts.subjectCount, testCount: counts.testCount, questionCount: counts.questionCount });
      courseManifest = manifest;
      allSubjects = manifest.subjects;
      const subject = allSubjects.find(s => s.slug === $("#meta-subject").value);
      subjectChapters = subject ? subject.chapters : subjectChapters;
      BBWData.downloadJson(manifest, `data-${activeCourse}-manifest.json`);
      setTimeout(() => BBWData.downloadJson(root, "data-manifest.json"), 300);
      renderCourseTabs(); renderSubjectTabs(); renderChapterList(); renderTestStrip();
      rootDirty = false;
      status(`2 manifests downloaded. data-${activeCourse}-manifest.json → data/${activeCourse}/manifest.json, data-manifest.json → data/manifest.json. Test file: ${testEntry.file}`);
      return { manifest, root };
    } catch (e) { status(e.message, true); return null; }
  }

  async function loadExisting() {
    if (!requireChapter()) return;
    const s = $("#meta-subject").value, c = $("#meta-chapter").value, t = selectedTestSlug;
    try { loadInput(await BBWData.loadTest(activeCourse, s, c, t)); status(`Loaded ${BBWData.testPath(activeCourse, s, c, t)}`); }
    catch (e) { status(`${t} पर अभी published JSON नहीं है। नया JSON attach करें।`, true); }
  }
  function downloadTemplate() {
    const m = metadata();
    BBWData.downloadJson({ id: `${m.subject || "subject"}-${m.chapter || "chapter"}-${m.test || "test-1"}`, title: m.title || "अध्याय टेस्ट 1", course: activeCourse, subject: m.subject, chapter: m.chapter, quizType: "CHAPTER_TEST", timeLimitMinutes: 10, passingScore: 33, negativeMarkingEnabled: false, negativeMarksPerQuestion: 0, shuffle: false, questions: [{ question: "प्रश्न लिखें", option1: "विकल्प 1", option2: "विकल्प 2", option3: "विकल्प 3", option4: "विकल्प 4", correctOption: "1", explanation: "व्याख्या", marks: 1 }] }, `${m.test || "test-1"}-template.json`);
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
        $("#meta-course").value = d.metadata.course || "";
        $("#meta-subject").value = d.metadata.subject || "";
        $("#meta-chapter").value = d.metadata.chapter || "";
        selectedSlug = d.metadata.chapter || "";
        selectedTestSlug = d.metadata.test || d.test || "test-1";
        $("#meta-test").value = selectedTestSlug;
        populateQuizSettings(d.metadata);
      }
      $("#meta-hi").value = d.hi || "";
      $("#meta-en").value = d.en || "";
      if (questions.length) { revalidate(); renderQuestions(); status(`Restored draft with ${questions.length} questions.`); }
      return true;
    } catch (_) { return false; }
  }
  function status(message, error) { $("#import-status").className = `admin-status ${error ? "destructive" : ""}`; $("#import-status").textContent = message; }
})();
