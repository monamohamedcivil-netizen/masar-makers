# ملفات محرر رحلة الاحتراف

انسخي مجلد:

components/course/editor

إلى نفس المسار داخل مشروع Masar Makers.

## الاستخدام الأساسي

```tsx
import {
  ProfessionalPanelEditor,
  createInitialProfessionalPanel,
  type ProfessionalPanelDraft,
} from "@/components/course/editor";
```

```tsx
const [professionalContent, setProfessionalContent] =
  useState<ProfessionalPanelDraft>(
    createInitialProfessionalPanel()
  );
```

```tsx
<ProfessionalPanelEditor
  value={professionalContent}
  onChange={setProfessionalContent}
  onSave={handleSave}
  isSaving={isSaving}
/>
```

يوجد ملف باسم:

INTEGRATION_EXAMPLE.tsx

يحتوي على مثال كامل للاستدعاء.

## ملاحظة مهمة

هذه الحزمة تحتوي على واجهة التحرير كاملة.

ربطها النهائي داخل CourseInteractiveDashboard.tsx
يحتاج مطابقة أسماء props الخاصة بدوال Supabase الموجودة في مشروعك.
