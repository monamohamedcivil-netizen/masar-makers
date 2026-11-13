import { DEFAULT_WHATSAPP_NUMBER, parseLinkConfig, type LinkConfig } from "@/lib/links/destinations";

/** إعداد ظهور الإعلان في شاشة العروض المنبثقة (مخزَّن jsonb في platform_announcements.offer_popup). */
export type OfferPopupConfig = {
  enabled: boolean;
  imageUrl: string;
  buttonEnabled: boolean;
  buttonText: string;
  buttonTextEn: string;
  link: LinkConfig;
};

export const EMPTY_OFFER_POPUP: OfferPopupConfig = {
  enabled: false,
  imageUrl: "",
  buttonEnabled: true,
  buttonText: "استفد بالعرض",
  buttonTextEn: "Get the offer",
  link: { kind: "whatsapp", number: DEFAULT_WHATSAPP_NUMBER, text: "" },
};

export function parseOfferPopup(value: unknown): OfferPopupConfig {
  if (!value || typeof value !== "object") return { ...EMPTY_OFFER_POPUP };
  const v = value as Record<string, unknown>;
  return {
    enabled: v.enabled === true,
    imageUrl: String(v.imageUrl ?? ""),
    buttonEnabled: v.buttonEnabled !== false,
    buttonText: String(v.buttonText ?? EMPTY_OFFER_POPUP.buttonText),
    buttonTextEn: String(v.buttonTextEn ?? EMPTY_OFFER_POPUP.buttonTextEn),
    link: parseLinkConfig(v.link) ?? EMPTY_OFFER_POPUP.link,
  };
}
