/*
# Add image_url to courses and seed cover images

1. Changes
- Adds `image_url` (text, nullable) to the `courses` table so each course can
  display a cover photo in the catalog and the Course Player header.
- Sets cover images for the 5 existing courses using real, license-free Pexels
  photos matched to each course's topic.

2. Security
- No new tables. No RLS or policy changes — `courses` already has read policies
  for `anon` and `authenticated`.

3. Notes
- This is additive only: one new nullable column + UPDATE on existing rows.
  No data is dropped or retyped.
*/

ALTER TABLE courses ADD COLUMN IF NOT EXISTS image_url text;

UPDATE courses SET image_url = 'https://images.pexels.com/photos/574077/pexels-photo-574077.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE title = 'Full-Stack Web Development';
UPDATE courses SET image_url = 'https://images.pexels.com/photos/97080/pexels-photo-97080.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE title = 'Data Structures & Algorithms';
UPDATE courses SET image_url = 'https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' WHERE title = 'Database Management Systems & SQL';
UPDATE courses SET image_url = 'https://images.pexels.com/photos/1102797/pexels-photo-1102797.png?auto=compress&cs=tinysrgb&h=650&w=940' WHERE title = 'Object-Oriented Programming in Python';
UPDATE courses SET image_url = 'https://images.pexels.com/photos/17483874/pexels-photo-17483874.png?auto=compress&cs=tinysrgb&h=650&w=940' WHERE title = 'Applied Artificial Intelligence & Machine Learning';
