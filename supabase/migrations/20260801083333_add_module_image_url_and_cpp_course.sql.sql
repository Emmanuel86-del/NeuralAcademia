/*
# Add module thumbnails and normalize course categories to Computer Science

## Purpose
1. Add an `image_url` column to the `modules` table so each module can display
   a small thumbnail representing its topic.
2. Normalize all existing course categories to 'Computer Science' so every
   course in the catalog is strictly CS-related (Web Development, Data Structures,
   Database Systems, Python Programming, AI/ML, and the new C++ Systems course).
3. Add a new course: "C++ Systems Programming" so the catalog covers the
   core CS pillars requested (Python, Data Structures, Web Dev, C++ Systems).

## Schema changes
- `modules.image_url` (text, nullable) — optional thumbnail URL for the module.

## Data changes
- UPDATE courses SET category = 'Computer Science' for all existing rows.
- INSERT one new course row for "C++ Systems Programming" (id assigned by identity).

## Security
- No policy changes. The public SELECT / admin-write policies created in the
  previous migration already cover modules and courses, including the new column
  (policies are column-agnostic except for explicit grants, which remain "all").

## Notes
- The image_url column is nullable so existing modules are not affected.
- The new C++ course uses the same defaults (tier, level, is_published) as
  the other courses.
*/

ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS image_url text;

UPDATE public.courses SET category = 'Computer Science' WHERE category IS DISTINCT FROM 'Computer Science';

INSERT INTO public.courses (title, description, category, level, tier, is_pro, is_published, status)
SELECT 'C++ Systems Programming', 'Master low-level systems programming, memory management, and performance with C++.', 'Computer Science', 'Intermediate', 'free', false, true, 'published'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE title = 'C++ Systems Programming');
