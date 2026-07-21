# Package 06 — Student Workspace Engine

## طريقة التركيب
انسخي محتويات الحزمة إلى جذر المشروع مع الموافقة على الاستبدال.

## ما تم تنفيذه
- فصل واجهة مساحة الطالب عن StudentJourneyDashboard.
- إنشاء تعريف مركزي للشاشات داخل workspaceConfig.ts.
- إنشاء Sidebars ديناميكية من نفس التعريف.
- إنشاء Renderer مركزي للوحة الوسطى.
- الإبقاء على بيانات الإحصائيات والكورسات الحالية كما هي.
- تجهيز نقطة استبدال واحدة لربط Supabase في Package 07.

## إضافة لوحة مؤقتًا
أضيفي تعريفًا جديدًا داخل studentWorkspaceDefinition ثم أضيفي نوع عرضه داخل WorkspacePanelContent.
لا حاجة لتعديل StudentJourneyDashboard أو الـ Sidebars.
