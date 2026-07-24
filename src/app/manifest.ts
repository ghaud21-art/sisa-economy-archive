import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "뉴스 아카이브",
    short_name: "뉴스 아카이브",
    description: "매일 아침 시사·경제·AI 뉴스를 요약하고 O/X 퀴즈로 이해도를 점검하세요.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7fbff",
    theme_color: "#4a87c6",
    lang: "ko",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
