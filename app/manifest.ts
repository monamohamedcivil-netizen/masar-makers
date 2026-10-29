import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Masar Makers",
    short_name: "Masar Makers",
    description: "منصة صناع المسار",
    start_url: "/",
    scope: "/",
    display: "standalone",
    dir: "rtl",
    lang: "ar",
    background_color: "#07152E",
    theme_color: "#07152E",
    icons: [
      // "any": الشعار الدائري يملأ الأيقونة تقريبًا كلها
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // "maskable": خلفية كحلية للحافة وشعار داخل المنطقة الآمنة — يملأ مربع/دائرة أيقونة أندرويد
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
