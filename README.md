# Bihar Board Wala Test Series

Zero-server, no-build MCQ test app. Plain HTML, CSS and JavaScript, hostable directly on GitHub Pages.

It is organised around **courses**. Class 10 (BSEB) ships with content today; Class 11, Class 12, Bihar Police and SSC CGL are listed as "coming soon" placeholders. Adding a real course is a data change, not a code change.

## Local preview

Do not double-click `index.html`. Browsers block JSON `fetch()` calls on `file://`.

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

## How students move through the app

```
index.html          course picker (tiles, grouped by board / competition)
course.html         subjects in one course
subject.html        chapters in one subject
chapter.html        tests in one chapter
test.html           the attempt
result.html         score, review and share
```

The chosen course is saved in `localStorage` under `bbw:course`. After the first pick,
`index.html` redirects straight to that course, so returning students never see the picker
again. `index.html?pick=1` forces the picker to show; that is where the course pill in the
header points.

Every page accepts a `course` query parameter and falls back to `class-10` when it is
missing, so links shared before the multi-course change still work.

## Folder layout

Data is split per course so that page weight does not grow as courses are added. The root
manifest is the only file the picker fetches, and a student only ever downloads the manifest
for their own course.

```
data/
  manifest.json                       course index only (~3 KB)
  class-10/
    manifest.json                     subjects + chapters + tests for this course
    hindi/dahi-wali-mangamma/test-1.json
    science/light/test-1.json
    mathematics/arithmetic-progressions/test-1.json
    mathematics/arithmetic-progressions/test-2.json
  class-11/
    manifest.json
    physics/units-and-measurements/test-1.json
```

Test files live at `data/<course>/<subject>/<chapter>/<test>.json`.

Only chapters with a `tests` array containing `questionCount > 0` become startable. Everything
else renders as **Coming soon**.

## Root manifest (`data/manifest.json`)

```json
{
  "version": 2,
  "courses": [
    {
      "id": "class-10",
      "slug": "class-10",
      "type": "board",
      "status": "live",
      "order": 1,
      "icon": "10",
      "accent": "243 75% 59%",
      "name": { "en": "Class 10", "hi": "कक्षा 10" },
      "tagline": { "en": "BSEB Board Test Series", "hi": "बिहार बोर्ड टेस्ट सीरीज़" },
      "unitLabel": { "en": "Chapter", "hi": "अध्याय" },
      "manifest": "data/class-10/manifest.json",
      "subjectCount": 6,
      "testCount": 4,
      "questionCount": 65
    }
  ]
}
```

- `type` groups the tiles: `board` renders under "बोर्ड परीक्षा", `competition` under "प्रतियोगी परीक्षा".
- `status` is `live` or `coming-soon`. A `coming-soon` course shows a greyed, non-tappable tile and needs no manifest file on disk.
- `accent` holds raw HSL channels (no `hsl(...)` wrapper) and colours the tile stripe, icon and course pill.
- `unitLabel` lets competition courses say "टॉपिक" where board courses say "अध्याय".
- `order` controls tile order.
- `subjectCount`, `testCount` and `questionCount` are cached here so the picker can show live numbers from a single fetch. The publisher recalculates them.

## Course manifest (`data/<course>/manifest.json`)

```json
{
  "version": 2,
  "course": "class-10",
  "sectionLabels": { "gadya": "गद्य", "padya": "पद्य", "purak": "पूरक" },
  "subjects": [
    {
      "id": "hindi",
      "slug": "hindi",
      "name": { "en": "Hindi", "hi": "हिन्दी" },
      "chapters": [
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
              "file": "data/class-10/hindi/dahi-wali-mangamma/test-1.json",
              "questionCount": 30,
              "timeLimitMinutes": 30,
              "quizType": "CHAPTER_TEST",
              "updatedAt": "2026-08-26T00:00:00.000Z"
            }
          ]
        },
        {
          "id": "chapter-maa",
          "slug": "maa",
          "title": { "en": "Mother", "hi": "माँ" },
          "section": "purak"
        }
      ]
    }
  ]
}
```

`sectionLabels` is per course, so each course defines its own section vocabulary. A chapter with
no `tests` key (like `chapter-maa` above) is simply unpublished.

## Test JSON schema

Each test file is one LMS-style wrapper, not a bundle of tests:

```json
{
  "id": "science-light-test-1",
  "title": "प्रकाश - अध्याय टेस्ट 1",
  "course": "class-10",
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

`correctOption` is **1-based** (`1` through `4`) and may be a JSON number or string. `marks` must be
positive. A bare array of rows in the question shape can also be imported; the admin form supplies
the wrapper metadata.

## Admin workflow

1. Open `publisher-6cf926d795.html`.
2. Pick a course from the top pill row, then a subject tab, then a chapter.
3. Pick an existing test, or click **+ New test** (next free `test-N` slug).
4. Drop or paste JSON. A bare question array is attached to the selected test automatically.
5. Fix errors, use the quick editor, then click **Practice test**.
6. Click **Download all files**.
7. Place the three downloads (see below), then commit and push.

The three files, and where each one goes:

| Download | Destination |
| --- | --- |
| `test-N.json` | `data/<course>/<subject>/<chapter>/test-N.json` |
| `data-<course>-manifest.json` | `data/<course>/manifest.json` |
| `data-manifest.json` | `data/manifest.json` |

The two manifests are given distinct download names so they do not collide in your Downloads
folder. The root manifest is included because the per-course counts shown on the picker tiles
change whenever you publish.

The browser cannot write into the repository, so create any missing folders yourself.
Admin drafts autosave only in that browser's local storage.

## Adding a new course

Everything can be done from the publisher, without hand-editing JSON:

1. Click **+ नया कोर्स** in the course pill row. Fill in the slug, names, type, icon, accent and unit label.
2. Click **+ नया विषय** to create the course's first subject.
3. Click **+ नया अध्याय / टॉपिक** to create the first chapter or topic.
4. Attach the questions and click **Download all files**.
5. Place the three files as per the table above. The new course's manifest lands at `data/<slug>/manifest.json`.

The publisher flips a course from `coming-soon` to `live` automatically once it has at least one
test with questions.

To advertise a course before it exists, add an entry to `data/manifest.json` with
`"status": "coming-soon"` and no manifest file. It will render as a greyed tile, and
`course.html?course=<slug>` shows a friendly "जल्द आ रहा है" page rather than an error.

## Saved progress

Results and in-progress attempts live in `localStorage`, scoped by course:

- `bbw:course` — the remembered course slug
- `bbw:history` — the last 50 results, each carrying a `course` field
- `bbw:result:<attemptId>` — one full result with its answer review
- `bbw:attempt:<course>:<subject>:<chapter>:<test>` — a resumable in-progress attempt

Results saved before the multi-course change have no `course` field and are read as `class-10`.

## Important privacy note

This is a static public app. Test JSON files contain `correctOption` and explanations, so the
answer key is publicly downloadable. It is suitable for practice tests, not secure or proctored
exams.

## Sharing

The result page uses the Web Share API on supported phones and falls back to the clipboard. Share
the GitHub Pages chapter URL through WhatsApp, or generate a QR code for that URL with any trusted
QR generator. Shared links carry the `course` parameter, so recipients land directly in the right
course and skip the picker.

KaTeX is loaded from a CDN for `$...$` and `$$...$$` math. If the CDN is unavailable, the raw math
remains readable.
