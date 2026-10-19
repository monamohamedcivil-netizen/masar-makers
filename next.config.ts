import type { NextConfig } from "next";

// اسم سيرفر Supabase (يُقرأ من الإعدادات) للسماح بتحسين صور التخزين العامة.
const supabaseHostname = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    ).hostname;
  } catch {
    return "";
  }
})();

const nextConfig: NextConfig = {
  // الصور العامة من Supabase تُحمَّل مرة واحدة، تُصغَّر، وتُحفظ نسخة جاهزة
  // لتقليل استهلاك نقل البيانات (Egress).
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
    formats: ["image/webp"],
    minimumCacheTTL: 31536000,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "60mb",
    },
  },

  // رؤوس أمان أساسية (بدون CSP حتى لا نكسر Bunny/Supabase/الخطوط).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;