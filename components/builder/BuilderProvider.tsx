"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

export type BuilderMode =
  | "student"
  | "edit";

export type BuilderElementType =
  | "title"
  | "text"
  | "button"
  | "image"
  | "section"
  | "panel-item";

export type BuilderTable =
  | "course_learning_modes"
  | "course_result_tabs"
  | "course_stations";

export type BuilderSelectedElement = {
  id: string;

  type: BuilderElementType;

  label: string;

  value: string;

  originalValue?: string;

  pageType?: string;

  scope?: "page" | "template";

  table?: BuilderTable;

  recordId?: string;

  field?: string;

  group?:
    | "learning"
    | "result";

  icon?: string | null;

  displayOrder?: number;

  active?: boolean;
};

type BuilderContextValue = {
  mode: BuilderMode;

  isStudentMode: boolean;

  isEditMode: boolean;

  selectedElement:
    | BuilderSelectedElement
    | null;

  isPropertiesOpen: boolean;

  isDirty: boolean;

  isSaving: boolean;

  setMode: (
    mode: BuilderMode
  ) => void;

  selectElement: (
    element: BuilderSelectedElement
  ) => void;

  openPanelItemEditor: (input: {
    table: BuilderTable;
    recordId: string;
    group:
      | "learning"
      | "result";
    title: string;
    icon?: string | null;
    displayOrder?: number;
    active?: boolean;
  }) => void;

  closeProperties: () => void;

  updateSelectedValue: (
    value: string
  ) => void;

  updateSelectedElement: (
    changes: Partial<BuilderSelectedElement>
  ) => void;

  resetSelectedElement: () => void;

  setIsSaving: (
    value: boolean
  ) => void;
};

const BuilderContext =
  createContext<
    BuilderContextValue | undefined
  >(undefined);

type BuilderProviderProps = {
  children: React.ReactNode;

  initialMode?: BuilderMode;
};

export default function BuilderProvider({
  children,
  initialMode = "student",
}: BuilderProviderProps) {
  const [mode, setMode] =
    useState<BuilderMode>(
      initialMode
    );

  const [
    selectedElement,
    setSelectedElement,
  ] =
    useState<
      BuilderSelectedElement | null
    >(null);

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const selectElement = (
    element: BuilderSelectedElement
  ) => {
    setSelectedElement({
      ...element,

      originalValue:
        element.originalValue ??
        element.value,
    });
  };

  const openPanelItemEditor = ({
    table,
    recordId,
    group,
    title,
    icon,
    displayOrder,
    active,
  }: {
    table: BuilderTable;
    recordId: string;
    group:
      | "learning"
      | "result";
    title: string;
    icon?: string | null;
    displayOrder?: number;
    active?: boolean;
  }) => {
    selectElement({
      id: `panel-item-${recordId}`,

      type: "panel-item",

      label: "تعديل زر القائمة",

      value: title,

      originalValue: title,

      scope: "page",

      table,

      recordId,

      field: "title",

      group,

      icon,

      displayOrder,

      active,
    });
  };

  const closeProperties = () => {
    setSelectedElement(null);
  };

  const updateSelectedValue = (
    value: string
  ) => {
    setSelectedElement(
      (currentElement) => {
        if (!currentElement) {
          return null;
        }

        return {
          ...currentElement,

          value,
        };
      }
    );
  };

  const updateSelectedElement = (
    changes: Partial<BuilderSelectedElement>
  ) => {
    setSelectedElement(
      (currentElement) => {
        if (!currentElement) {
          return null;
        }

        return {
          ...currentElement,

          ...changes,
        };
      }
    );
  };

  const resetSelectedElement = () => {
    setSelectedElement(
      (currentElement) => {
        if (!currentElement) {
          return null;
        }

        return {
          ...currentElement,

          value:
            currentElement.originalValue ??
            currentElement.value,
        };
      }
    );
  };

  const isDirty =
    Boolean(
      selectedElement &&
        selectedElement.value !==
          selectedElement.originalValue
    );

  const contextValue =
    useMemo<BuilderContextValue>(
      () => ({
        mode,

        isStudentMode:
          mode === "student",

        isEditMode:
          mode === "edit",

        selectedElement,

        isPropertiesOpen:
          Boolean(selectedElement),

        isDirty,

        isSaving,

        setMode,

        selectElement,

        openPanelItemEditor,

        closeProperties,

        updateSelectedValue,

        updateSelectedElement,

        resetSelectedElement,

        setIsSaving,
      }),
      [
        mode,
        selectedElement,
        isDirty,
        isSaving,
      ]
    );

  return (
    <BuilderContext.Provider
      value={contextValue}
    >
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilder() {
  const context =
    useContext(BuilderContext);

  if (!context) {
    throw new Error(
      "useBuilder must be used inside BuilderProvider."
    );
  }

  return context;
}