ALTER TABLE enrollments
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE certificates
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE student_projects
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS student_name_en text;

ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS source text DEFAULT 'platform';

ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS source_reference text;

ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS student_email text;

ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS source text DEFAULT 'platform';

ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS source_reference text;

CREATE INDEX IF NOT EXISTS idx_enrollments_student_email
ON enrollments (lower(student_email));

CREATE INDEX IF NOT EXISTS idx_certificates_student_email
ON certificates (lower(student_email));

CREATE INDEX IF NOT EXISTS idx_student_surveys_student_email
ON student_surveys (lower(student_email));

CREATE INDEX IF NOT EXISTS idx_student_projects_student_email
ON student_projects (lower(student_email));