Masar Makers — Enrollment Workflow Fix

Replace these project files:

1) lib/actions/enroll.ts
2) lib/actions/admin/enrollments.ts
3) components/course/CourseActionButton.tsx
4) components/course/PlatformActionButton.tsx

No SQL migration is required for this version.

Flow:
- Student clicks "ابدأ الرحلة"
- A pending row is created in enrollments using user_id + course_id + status
- WhatsApp opens with a prepared message
- Admin request page reads station_id and journey_type from courses
- Admin approves the pending request
- The course becomes available in the student's dashboard
