"use client";

import {
  useState,
} from "react";

import {
  ProfessionalPanelEditor,
  createInitialProfessionalPanel,
  type ProfessionalPanelDraft,
} from "@/components/course/editor";

export default function IntegrationExample() {
  const [professionalContent, setProfessionalContent] =
    useState<ProfessionalPanelDraft>(
      createInitialProfessionalPanel()
    );

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (
    value: ProfessionalPanelDraft
  ) => {
    setIsSaving(true);

    try {
      /*
        استبدلي هذا الجزء باستدعاء السيرفر الموجود عندك:

        await saveCourseScreenContent({
          courseId,
          panelKey: "professional",
          panelComponent: "professional",
          content: value,
        });
      */

      console.log("Professional content:", value);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProfessionalPanelEditor
      value={professionalContent}
      onChange={setProfessionalContent}
      onSave={handleSave}
      isSaving={isSaving}
    />
  );
}
