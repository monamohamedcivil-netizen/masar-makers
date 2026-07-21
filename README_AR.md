# Package 07 Fixed — Student Dashboard Data Layer

## طريقة التركيب
انسخي محتويات الحزمة إلى المجلد الرئيسي لمشروع `masar-makers` ووافقي على استبدال الملف الموجود.

## الإصلاحات
- إزالة الاعتماد على `enrollments.journey_id` و`enrollments.journey_type` لأنهما غير موجودين في قاعدة البيانات الحالية.
- تحميل بيانات الطالب عبر المسار الحقيقي:
  `profiles → enrollments → courses → course_stations → career_paths`.
- استخدام جدول `student_course_progress` مع دعم تلقائي لـ `course_progress` عند توفر المخطط الأحدث.
- تحميل الرحلات والدروس والتقدم والشهادات والاستبيانات والمشاريع دون أن يؤدي غياب الجداول الاختيارية إلى تعطل لوحة الطالب.
- حساب تصنيف الكورسات والإحصائيات من بيانات الكورس والمسار الفعلية.

## التحقق
- تم فحص الملف المعدل بواسطة ESLint بنجاح.
- فحص TypeScript للمشروع وصل إلى خطأ قديم غير متعلق بالحزمة في:
  `components/admin/lessons/LessonContentManager.tsx`.
- تعذر إكمال Production Build داخل بيئة الاختبار بسبب اعتماد المشروع على Google Fonts وحزمة Linux اختيارية غير موجودة في نسخة `node_modules` المرفقة، وليس بسبب ملف الحزمة.
