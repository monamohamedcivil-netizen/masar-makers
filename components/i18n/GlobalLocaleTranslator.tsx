"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import LanguageSwitch from "@/components/i18n/LanguageSwitch";
import {
  translateUiText,
  type MasarLocale,
} from "@/lib/i18n/ui-translations";

const TRANSLATABLE_ATTRIBUTES = [
  "placeholder",
  "title",
  "aria-label",
  "aria-description",
] as const;

const SKIP_SELECTOR = [
  "script",
  "style",
  "code",
  "pre",
  "textarea",
  '[contenteditable="true"]',
  "[data-masar-no-translate]",
].join(",");

const AUTH_OR_LANDING_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/confirmed",
]);

function shouldSkipNode(node: Node) {
  const parent =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;

  return Boolean(parent?.closest(SKIP_SELECTOR));
}

export default function GlobalLocaleTranslator() {
  const pathname = usePathname();
  const [locale, setLocale] = useState<MasarLocale>("ar");

  const originalTextsRef = useRef<Map<Text, string>>(new Map());
  const originalAttributesRef = useRef<
    Map<Element, Map<string, string>>
  >(new Map());
  const originalDirectionsRef = useRef<Map<HTMLElement, string | null>>(
    new Map(),
  );

  const excludedRoute = useMemo(
    () =>
      pathname.startsWith("/admin") ||
      pathname.includes("/certificates/") ||
      pathname.startsWith("/verify/"),
    [pathname],
  );

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("masar-locale");

    if (savedLocale === "ar" || savedLocale === "en") {
      setLocale(savedLocale);
      document.documentElement.lang = savedLocale;
      document.documentElement.dir = savedLocale === "ar" ? "rtl" : "ltr";
    }

    const handleLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        locale?: MasarLocale;
      }>;

      if (
        customEvent.detail?.locale === "ar" ||
        customEvent.detail?.locale === "en"
      ) {
        setLocale(customEvent.detail.locale);
      }
    };

    window.addEventListener("masar:locale-change", handleLocaleChange);

    return () => {
      window.removeEventListener("masar:locale-change", handleLocaleChange);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";

    if (excludedRoute) {
      return;
    }

    const originalTexts = originalTextsRef.current;
    const originalAttributes = originalAttributesRef.current;
    const originalDirections = originalDirectionsRef.current;

    const translateTextNode = (node: Text) => {
      if (shouldSkipNode(node)) return;

      const current = node.nodeValue ?? "";
      if (!current.trim()) return;

      if (locale === "en") {
        if (/[\u0600-\u06FF]/.test(current)) {
          originalTexts.set(node, current);
          const translated = translateUiText(current, "en");
          if (translated !== current) {
            node.nodeValue = translated;
          }
        }
        return;
      }

      const original = originalTexts.get(node);
      if (original !== undefined && node.nodeValue !== original) {
        node.nodeValue = original;
      }
    };

    const translateElement = (element: Element) => {
      if (element.matches(SKIP_SELECTOR) || element.closest(SKIP_SELECTOR)) {
        return;
      }

      for (const attributeName of TRANSLATABLE_ATTRIBUTES) {
        const current = element.getAttribute(attributeName);
        if (!current) continue;

        if (locale === "en" && /[\u0600-\u06FF]/.test(current)) {
          let originals = originalAttributes.get(element);
          if (!originals) {
            originals = new Map<string, string>();
            originalAttributes.set(element, originals);
          }

          originals.set(attributeName, current);

          const translated = translateUiText(current, "en");
          if (translated !== current) {
            element.setAttribute(attributeName, translated);
          }
        } else if (locale === "ar") {
          const original = originalAttributes.get(element)?.get(attributeName);
          if (original !== undefined && current !== original) {
            element.setAttribute(attributeName, original);
          }
        }
      }

      if (element instanceof HTMLElement && element.hasAttribute("dir")) {
        if (locale === "en") {
          if (!originalDirections.has(element)) {
            originalDirections.set(element, element.getAttribute("dir"));
          }

          if (element.getAttribute("dir") === "rtl") {
            element.setAttribute("dir", "ltr");
          }
        } else if (originalDirections.has(element)) {
          const original = originalDirections.get(element);
          if (original === null) {
            element.removeAttribute("dir");
          } else {
            element.setAttribute("dir", original);
          }
        }
      }
    };

    const processRoot = (root: ParentNode) => {
      if (root instanceof Element) {
        translateElement(root);
      }

      const elementWalker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT,
      );

      let elementNode = elementWalker.nextNode();
      while (elementNode) {
        translateElement(elementNode as Element);
        elementNode = elementWalker.nextNode();
      }

      const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let textNode = textWalker.nextNode();
      while (textNode) {
        translateTextNode(textNode as Text);
        textNode = textWalker.nextNode();
      }
    };

    processRoot(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          translateTextNode(mutation.target as Text);
          continue;
        }

        if (mutation.type === "attributes") {
          translateElement(mutation.target as Element);
          continue;
        }

        for (const addedNode of mutation.addedNodes) {
          if (addedNode.nodeType === Node.TEXT_NODE) {
            translateTextNode(addedNode as Text);
          } else if (addedNode.nodeType === Node.ELEMENT_NODE) {
            processRoot(addedNode as Element);
          }
        }
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRIBUTES, "dir"],
    });

    return () => {
      observer.disconnect();
    };
  }, [locale, excludedRoute, pathname]);

  const showFloatingSwitch =
    !excludedRoute && AUTH_OR_LANDING_PATHS.has(pathname);

  return (
    <>
      <style>{`
        html[dir="ltr"] .text-right,
        html[dir="ltr"] [class~="sm:text-right"],
        html[dir="ltr"] [class~="md:text-right"],
        html[dir="ltr"] [class~="lg:text-right"] {
          text-align: left !important;
        }

        html[dir="ltr"] body {
          overflow-wrap: anywhere;
        }

        html[dir="ltr"] button,
        html[dir="ltr"] a,
        html[dir="ltr"] label,
        html[dir="ltr"] p,
        html[dir="ltr"] h1,
        html[dir="ltr"] h2,
        html[dir="ltr"] h3,
        html[dir="ltr"] h4 {
          text-wrap: pretty;
        }
      `}</style>

      {showFloatingSwitch ? (
        <div className="fixed end-3 top-3 z-[9998] sm:end-5 sm:top-5">
          <LanguageSwitch
            floating
            compact
            light={pathname !== "/"}
          />
        </div>
      ) : null}
    </>
  );
}
