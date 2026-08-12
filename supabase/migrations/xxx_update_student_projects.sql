ALTER TABLE student_projects
ADD COLUMN IF NOT EXISTS student_job_title text;

ALTER TABLE student_projects
ADD COLUMN IF NOT EXISTS student_country text;

ALTER TABLE student_projects
ADD COLUMN IF NOT EXISTS project_images jsonb DEFAULT '[]'::jsonb;

ALTER TABLE student_projects
ADD COLUMN IF NOT EXISTS cover_image text;

ALTER TABLE student_projects
ADD COLUMN IF NOT EXISTS show_on_home boolean DEFAULT false;

ALTER TABLE student_projects
ADD COLUMN IF NOT EXISTS show_on_course boolean DEFAULT false;

ALTER TABLE student_projects
ADD COLUMN IF NOT EXISTS previous_show_on_home boolean DEFAULT false;

ALTER TABLE student_projects
ADD COLUMN IF NOT EXISTS previous_show_on_course boolean DEFAULT false;

ALTER TABLE student_projects
ADD COLUMN IF NOT EXISTS edited_by_student boolean DEFAULT false;

ALTER TABLE student_projects
ADD COLUMN IF NOT EXISTS student_last_edit_at timestamptz;

ALTER TABLE student_projects
ADD COLUMN IF NOT EXISTS source text DEFAULT 'admin_import';

ALTER TABLE student_projects
ADD COLUMN IF NOT EXISTS source_reference text;