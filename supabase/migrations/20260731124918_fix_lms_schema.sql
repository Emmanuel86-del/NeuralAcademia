/*
# Fix LMS schema: premium flag, enrollment progress, per-module progress, lesson seeds

1. Overview
Aligns the database with the LMS UI requirements:
- Adds `is_premium` to profiles so the paywall can check access.
- Adds `progress` + `status` to enrollments so course completion rolls up.
- Creates `module_progress` for per-module completion checkboxes (owner-scoped, RLS).
- Seeds `lessons` rows (content_markdown + code_snippet) for the first module of each
  course so the lesson area renders real markdown + code snippets without undefined.

2. Security
- module_progress: owner-scoped CRUD via auth.uid() = user_id, DEFAULT auth.uid().
- profiles/enrollments: existing tables, additive ALTER only (no data loss).

3. Notes
- courses/modules/lessons use bigint identity IDs. module_progress.module_id and
  course_id are bigint to match (NOT uuid) — this fixes the type mismatch that caused
  lesson fetches to return empty and throw undefined.
- module 1 of each course is the free preview; modules with order_index >= 2 are
  premium-locked in the UI.
*/

-- ===== profiles: add is_premium =====
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

-- ===== enrollments: add progress + status =====
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'not_started';
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- ===== module_progress =====
CREATE TABLE IF NOT EXISTS module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id bigint NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  course_id bigint NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  UNIQUE(user_id, module_id)
);

ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_module_progress" ON module_progress;
CREATE POLICY "select_own_module_progress" ON module_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_module_progress" ON module_progress;
CREATE POLICY "insert_own_module_progress" ON module_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_module_progress" ON module_progress;
CREATE POLICY "update_own_module_progress" ON module_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_module_progress" ON module_progress;
CREATE POLICY "delete_own_module_progress" ON module_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_module_progress_user ON module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_module ON module_progress(module_id);

-- ===== Seed lessons for module 1 of each course (free preview modules) =====
-- One rich lesson per first module so the lesson area has markdown + code to render.
INSERT INTO lessons (module_id, title, content_markdown, code_snippet, order_index)
SELECT m.id, l.title, l.content_markdown, l.code_snippet, l.order_index
FROM modules m
CROSS JOIN (VALUES
  (1, 'Getting Started with HTML5 & Semantic Structure',
   '## Why Semantic HTML Matters\n\nSemantic HTML gives **meaning** to your content. Instead of wrapping everything in a generic `<div>`, you use elements that describe their role:\n\n1. `<header>` — introductory content or navigation\n2. `<nav>` — a set of navigation links\n3. `<main>` — the dominant content of the page\n4. `<article>` — a self-contained composition\n5. `<section>` — a thematic grouping\n\n> **Tip:** Semantic tags improve **accessibility** for screen readers and **SEO** for search engines at the same time.\n\n### Responsive Design in One Rule\n\nThe single most important line for responsive layouts is the viewport meta tag. Without it, mobile browsers render the page at a desktop width and zoom out — making text tiny and unreadable.',
   '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <!-- This is the key line for mobile responsiveness -->\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Semantic Layout</title>\n</head>\n<body>\n  <header>\n    <nav><!-- navigation links --></nav>\n  </header>\n  <main>\n    <article>\n      <h1>Welcome</h1>\n      <p>Meaningful content goes here.</p>\n    </article>\n  </main>\n  <footer>&copy; 2025</footer>\n</body>\n</html>',
   1),
  (1, 'Flexbox Layout Essentials',
   '## Flexbox in 60 Seconds\n\nFlexbox is a one-dimensional layout model. It arranges items in a **row** or **column** and distributes space automatically.\n\n- `display: flex` — turn on flexbox on a container\n- `justify-content` — align items along the main axis\n- `align-items` — align items along the cross axis\n- `gap` — spacing between items\n\n### The Centering Trick\n\nCentering used to be hard. With flexbox it is three lines:',
   '.container {\n  display: flex;\n  justify-content: center; /* horizontal */\n  align-items: center;     /* vertical */\n  height: 100vh;\n}\n\n/* Responsive: stack vertically on narrow screens */\n@media (max-width: 768px) {\n  .container {\n    flex-direction: column;\n  }\n}',
   2),
  (1, 'CSS Grid for Two-Dimensional Layouts',
   '## When to Use Grid\n\nUse **Flexbox** for one-dimensional layouts (a row OR a column). Use **Grid** for two-dimensional layouts (rows AND columns at the same time).\n\nGrid lets you define columns with `grid-template-columns` and place items into specific cells.\n\n### The Holy Grail Layout\n\nA header, sidebar, main content, and footer — all responsive with zero JavaScript:',
   '.layout {\n  display: grid;\n  grid-template-areas:\n    "header header"\n    "sidebar main"\n    "footer footer";\n  grid-template-columns: 250px 1fr;\n  grid-template-rows: auto 1fr auto;\n  min-height: 100vh;\n}\n\n.header  { grid-area: header; }\n.sidebar { grid-area: sidebar; }\n.main    { grid-area: main; }\n.footer  { grid-area: footer; }\n\n@media (max-width: 768px) {\n  .layout { grid-template-areas: "header" "main" "sidebar" "footer"; }\n}',
   3)
) AS l(course_id, title, content_markdown, code_snippet, order_index)
WHERE m.order_index = 1
  AND NOT EXISTS (SELECT 1 FROM lessons WHERE lessons.module_id = m.id);

-- Seed one starter lesson for a couple of second modules (premium preview)
INSERT INTO lessons (module_id, title, content_markdown, code_snippet, order_index)
SELECT m.id, l.title, l.content_markdown, l.code_snippet, l.order_index
FROM modules m
CROSS JOIN (VALUES
  (1, 'JavaScript ES6: let, const, and Arrow Functions',
   '## Modern Variable Declarations\n\nPre-ES6 JavaScript only had `var`, which is **function-scoped** and hoisted — a common source of bugs.\n\n- `let` — block-scoped, reassignable\n- `const` — block-scoped, **cannot** be reassigned\n- `var` — avoid in modern code\n\n> **Rule of thumb:** Default to `const`. Use `let` only when you must reassign.\n\n### Arrow Functions\n\nArrow functions have a shorter syntax and inherit `this` from the surrounding scope:',
   '// Old syntax\nvar add = function (a, b) { return a + b; };\n\n// ES6 arrow function (concise)\nconst add = (a, b) => a + b;\n\n// Block body when you need multiple statements\nconst greet = (name) => {\n  const message = `Hello, ${name}!`;\n  return message;\n};\n\n// Arrow functions do NOT bind their own `this`\nconst timer = {\n  seconds: 0,\n  start() {\n    setInterval(() => this.seconds++, 1000); // `this` = timer\n  }\n};',
   1)
) AS l(course_id, title, content_markdown, code_snippet, order_index)
WHERE m.order_index = 2
  AND m.course_id = 1
  AND NOT EXISTS (SELECT 1 FROM lessons WHERE lessons.module_id = m.id);
