/*
# Make created_by nullable for platform-level seed content

1. Overview
Courses and assessments have a created_by column that was NOT NULL. Platform-level seed
content (default catalog) has no specific admin creator, so created_by must allow NULL.

2. Changes
- ALTER TABLE courses: created_by DROP NOT NULL
- ALTER TABLE assessments: created_by DROP NOT NULL

3. Security
No security changes. RLS policies remain the same. NULL created_by means the row was
seeded by the platform and is readable by all authenticated users via is_published = true.
*/

ALTER TABLE courses ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE assessments ALTER COLUMN created_by DROP NOT NULL;
