(function () {
  "use strict";
  const TYPES = ["LECTURE_QUIZ", "CHAPTER_QUIZ", "CHAPTER_TEST", "SUBJECT_TEST", "MOCK_TEST", "PRACTICE_SET", "PYQ_TEST"];
  const defaults = { id: "", title: "", course: "", subject: "", chapter: "", quizType: "CHAPTER_TEST", timeLimitMinutes: 10, passingScore: 33, negativeMarkingEnabled: false, negativeMarksPerQuestion: 0, shuffle: false };
  function parse(input) {
    if (typeof input === "string") {
      try { input = JSON.parse(input); } catch (e) { return result([], [{ row: 0, field: "json", message: `Invalid JSON: ${e.message}` }], [], null, false); }
    }
    const bare = Array.isArray(input), wrapper = bare ? null : input;
    if (!bare && (!wrapper || typeof wrapper !== "object" || !Array.isArray(wrapper.questions))) {
      return result([], [{ row: 0, field: "questions", message: "JSON must be a question array or wrapper with questions array." }], [], null, false);
    }
    const questions = bare ? input : wrapper.questions, errors = [], warnings = [], rows = [];
    questions.forEach((raw, i) => {
      const rowErrors = [], rowWarnings = [], row = normalizeQuestion(raw);
      if (!row.question) rowErrors.push("question is required");
      for (let n = 1; n <= 4; n++) if (!row[`option${n}`]) rowErrors.push(`option${n} is required`);
      if (!Number.isInteger(Number(row.correctOption)) || Number(row.correctOption) < 1 || Number(row.correctOption) > 4) rowErrors.push("correctOption must be 1..4");
      if (!Number.isFinite(Number(row.marks)) || Number(row.marks) <= 0) rowErrors.push("marks must be positive");
      const opts = [1, 2, 3, 4].map(n => row[`option${n}`].trim().toLowerCase()).filter(Boolean);
      if (new Set(opts).size < opts.length) rowWarnings.push("duplicate identical options");
      if (!row.explanation) rowWarnings.push("explanation is missing");
      rowErrors.forEach(message => errors.push({ row: i + 1, field: "question", message }));
      rowWarnings.forEach(message => warnings.push({ row: i + 1, message }));
      rows.push({ rowNumber: i + 1, valid: !rowErrors.length, errors: rowErrors, warnings: rowWarnings, data: row });
    });
    if (!bare) validateWrapper(wrapper, errors, warnings);
    return result(rows, errors, warnings, wrapper, bare);
  }
  function validateWrapper(w, errors, warnings) {
    [["timeLimitMinutes", 0, Infinity], ["passingScore", 0, 100], ["negativeMarksPerQuestion", 0, Infinity]].forEach(([field, min, max]) => {
      if (w[field] !== undefined && (!Number.isFinite(Number(w[field])) || Number(w[field]) < min || Number(w[field]) > max)) errors.push({ row: 0, field, message: `${field} must be between ${min} and ${max === Infinity ? "∞" : max}` });
    });
    if (w.quizType && !TYPES.includes(w.quizType)) errors.push({ row: 0, field: "quizType", message: `Unknown quizType: ${w.quizType}` });
    if (w.youtubeUrl) {
      const url = String(w.youtubeUrl).trim();
      if (url && !(window.BBWData && BBWData.videoOf({ youtubeUrl: url }))) errors.push({ row: 0, field: "youtubeUrl", message: "youtubeUrl must be an https YouTube watch, playlist, live, or youtu.be link." });
    }
    if (!w.title) warnings.push({ row: 0, message: "wrapper title is missing" });
  }
  function normalizeQuestion(q) {
    q = q && typeof q === "object" ? q : {};
    return { question: String(q.question || "").trim(), option1: String(q.option1 || "").trim(), option2: String(q.option2 || "").trim(), option3: String(q.option3 || "").trim(), option4: String(q.option4 || "").trim(), correctOption: String(q.correctOption == null ? "" : q.correctOption), explanation: String(q.explanation || "").trim(), marks: Number(q.marks == null ? 1 : q.marks) };
  }
  function result(rows, errors, warnings, wrapper, bare) {
    return { totalRows: rows.length, validRows: rows.filter(r => r.valid).length, invalidRows: rows.filter(r => !r.valid).length, rows, errors, warnings, wrapper, bareArray: bare };
  }
  function normalize(input, metadata) {
    const report = parse(input);
    if (report.errors.length) throw new Error("Fix validation errors before continuing.");
    const meta = Object.assign({}, defaults, report.wrapper || {}, metadata || {});
    meta.questions = report.rows.map(r => r.data);
    meta.id = meta.id || `${meta.subject}-${meta.chapter}-${meta.test || "test-1"}`;
    meta.timeLimitMinutes = Number(meta.timeLimitMinutes || 0);
    meta.passingScore = Number(meta.passingScore || 0);
    meta.negativeMarkingEnabled = Boolean(meta.negativeMarkingEnabled);
    meta.negativeMarksPerQuestion = Number(meta.negativeMarksPerQuestion || 0);
    meta.shuffle = Boolean(meta.shuffle);
    return meta;
  }
  window.BBWValidate = { parse, normalize, normalizeQuestion, quizTypes: TYPES, defaults };
})();
