# Bihar Board Wala Test Series

Zero-server, no-build Class 10 MCQ test app. It uses plain HTML, CSS and JavaScript and can be hosted directly on GitHub Pages.

## Local preview

Do not double-click `index.html`. Browsers usually block JSON `fetch()` calls on `file://`.

```bash
cd bihar-board-wala-test-series
python -m http.server 8000
```

Open <http://localhost:8000>. The admin is at <http://localhost:8000/publisher-6cf926d795.html>.

The admin page is deliberately not linked from the student site and uses an unguessable
filename. Treat that URL as a secret; anyone who has it can open the publisher UI.

## GitHub Pages

1. Create/push a repository named `bihar-board-wala-test-series`.
2. In **Settings → Pages**, choose **Deploy from a branch**.
3. Select `main` and `/ (root)`, then save.
4. Open `https://YOUR-USERNAME.github.io/bihar-board-wala-test-series/`.

All app links and data URLs are relative, so deployment under this repository subpath works.

## Folder layout

Each chapter can hold many tests. Published JSON lives in a folder named after the chapter slug:

```
data/
  manifest.json
  hindi/dahi-wali-mangamma/test-1.json
  hindi/dahi-wali-mangamma/test-2.json
  science/light/test-1.json
```

`data/manifest.json` lists every BSEB Class 10 chapter. Only chapters that have a `tests` array with `questionCount > 0` appear as startable. Unpublished chapters stay **Coming soon**.

Students go **subject → chapter → test**. Example:

`chapter.html?subject=hindi&chapter=dahi-wali-mangamma` then `test.html?subject=hindi&chapter=dahi-wali-mangamma&test=test-1`

## Admin workflow

1. Open `publisher-6cf926d795.html`.
2. Choose a subject tab and click the chapter.
3. Pick an existing test, or click **+ New test** (next free `test-N` slug).
4. Drop or paste JSON. A bare question array is attached to that selected test automatically.
5. Fix errors, use the quick editor, then click **Practice test**.
6. Click **Download both files**.
7. Move the downloaded `test-N.json` into `data/<subject>/<chapter>/` (create the folder if needed) and replace `data/manifest.json`, then commit and push.

The browser cannot write into the repository. Downloads land in your Downloads folder as `test-1.json`, `test-2.json`, and so on — put them in the chapter folder shown on the admin page.

Admin drafts autosave only in that browser's local storage.

## Manifest `tests` array

Published chapters use a `tests` list instead of a single `file`:

```json
{
  "id": "chapter-dahi-wali-mangamma",
  "slug": "dahi-wali-mangamma",
  "title": { "en": "Dahi Wali Mangamma", "hi": "दही वाली मंगम्मा" },
  "section": "purak",
  "tests": [
    {
      "id": "hindi-dahi-wali-mangamma-test-1",
      "slug": "test-1",
      "title": "दही वाली मंगम्मा - अध्याय टेस्ट 1",
      "file": "data/hindi/dahi-wali-mangamma/test-1.json",
      "questionCount": 30,
      "timeLimitMinutes": 30,
      "quizType": "CHAPTER_TEST",
      "updatedAt": "2026-08-26T00:00:00.000Z"
    }
  ]
}
```

Empty chapters keep the old shape (`file` + `questionCount: 0`) until you publish the first test.

## JSON schema

Each test file is still one LMS-style wrapper (not a bundle of tests):

```json
{
  "id": "science-light-test-1",
  "title": "प्रकाश - अध्याय टेस्ट 1",
  "subject": "science",
  "chapter": "light",
  "quizType": "CHAPTER_TEST",
  "timeLimitMinutes": 10,
  "passingScore": 33,
  "negativeMarkingEnabled": false,
  "negativeMarksPerQuestion": 0,
  "shuffle": false,
  "questions": [
    {
      "question": "Question text",
      "option1": "First option",
      "option2": "Second option",
      "option3": "Third option",
      "option4": "Fourth option",
      "correctOption": "2",
      "explanation": "Why option 2 is correct",
      "marks": 1
    }
  ]
}
```

`correctOption` is **1-based** (`1` through `4`) and may be a JSON number or string. `marks` must be positive. A bare array containing rows in the question shape can also be imported; the admin form supplies wrapper metadata.

## Important privacy note

This is a static public app. Test JSON files contain `correctOption` and explanations, so the answer key is publicly downloadable. It is suitable for practice tests, not secure or proctored exams.

## Sharing

The result page uses the Web Share API on supported phones and falls back to the clipboard. Share the GitHub Pages chapter URL through WhatsApp, or generate a QR code for that URL with any trusted QR generator.

KaTeX is loaded from a CDN for `$...$` and `$$...$$` math. If the CDN is unavailable, the raw math remains readable.
