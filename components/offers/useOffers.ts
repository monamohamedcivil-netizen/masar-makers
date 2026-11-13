"use client";

import { useCallback, useEffect, useState } from "react";

import { buildHref } from "@/lib/links/destinations";
import { parseOfferPopup, type OfferPopupConfig } from "@/lib/offers/types";
import { createClient } from "@/lib/supabase/client";

export const OPEN_OFFERS_EVENT = "masar:open-offers";
const SEEN_KEY = "mm_offers_seen";

export type PopupOffer = {
  id: string;
  title: string;
  titleEn: string;
  popup: OfferPopupConfig;
  /** الرابط النهائي لزر «استفد بالعرض». */
  href: string;
};

function readSeen(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function writeSeen(ids: string[]) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
  } catch {
    /* التخزين محجوب: تُعرض الشاشة في كل زيارة فقط */
  }
}

/** يفتح شاشة العروض من أي مكان: window.dispatchEvent(new CustomEvent(OPEN_OFFERS_EVENT)). */
export function openOffersScreen() {
  window.dispatchEvent(new CustomEvent(OPEN_OFFERS_EVENT));
}

/*
 * عروض الشاشة المنبثقة: استعلام واحد خفيف (إعلانات العروض النشطة فقط) عند فتح الصفحة.
 * - تفتح تلقائيًا مرة واحدة، وبعد الإغلاق لا تظهر إلا إذا نزل عرض جديد.
 * - زر «جميع العروض» (علبة الهدايا) يفتحها دائمًا.
 * لو العمود غير موجود بعد أو فشل الاستعلام: لا عروض ولا أثر على باقي الصفحة.
 */
let offersPromise: Promise<PopupOffer[]> | null = null;

/** استعلام واحد مشترك بين شريط الإعلانات وقسم العروض في الرئيسية (لا يتكرر). */
function fetchOffers(): Promise<PopupOffer[]> {
  if (offersPromise) return offersPromise;
  offersPromise = (async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await createClient()
        .from("platform_announcements")
        .select("id,title,title_en,offer_popup,display_order")
        .eq("is_active", true)
        .not("offer_popup", "is", null)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) return [];
      const list: PopupOffer[] = [];
      for (const row of (data ?? []) as Array<Record<string, unknown>>) {
        const popup = parseOfferPopup(row.offer_popup);
        if (!popup.enabled || !popup.imageUrl.trim()) continue;
        list.push({
          id: String(row.id),
          title: String(row.title ?? ""),
          titleEn: String(row.title_en ?? ""),
          popup,
          href: buildHref(popup.link),
        });
      }
      return list;
    } catch {
      return [];
    }
  })();
  return offersPromise;
}

/** قائمة العروض فقط (بدون فتح تلقائي) لقسم العروض في الصفحة الرئيسية. */
export function useOfferList() {
  const [offers, setOffers] = useState<PopupOffer[]>([]);
  useEffect(() => {
    let cancelled = false;
    void fetchOffers().then((list) => {
      if (!cancelled) setOffers(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return offers;
}

export function useOffers() {
  const [offers, setOffers] = useState<PopupOffer[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchOffers().then((list) => {
      if (cancelled) return;
      setOffers(list);
      // فتح تلقائي: فقط لو فيه عرض لم يره الزائر من قبل.
      const seen = readSeen();
      if (list.some((offer) => !seen.includes(offer.id))) setOpen(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_OFFERS_EVENT, handler);
    return () => window.removeEventListener(OPEN_OFFERS_EVENT, handler);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    writeSeen([...new Set([...readSeen(), ...offers.map((offer) => offer.id)])]);
  }, [offers]);

  return { offers, open: open && offers.length > 0, close, show: () => setOpen(true) };
}
