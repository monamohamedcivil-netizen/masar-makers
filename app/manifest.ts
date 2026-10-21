import type { MetadataRoute } from "next";

// Lets admins "Add to Home Screen" so WhatsApp-inbox notifications work on phones (required on iPhone).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Masar Makers",
    short_name: "Masar Makers",
    description: "منصة صناع المسار",
    start_url: "/admin/whatsapp-inbox",
    scope: "/",
    display: "standalone",
    dir: "rtl",
    lang: "ar",
    background_color: "#07152E",
    theme_color: "#07152E",
    icons: [
      { src: "/images/branding/masar-makers-video-logo.png", sizes: "900x900", type: "image/png" },
      { src: "/images/branding/masar-makers-email-logo.png", sizes: "200x200", type: "image/png" },
    ],
  };
}
