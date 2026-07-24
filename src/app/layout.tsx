import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "뉴스 아카이브",
  description: "매일 아침 시사·경제·AI 뉴스를 요약하고 O/X 퀴즈로 이해도를 점검하세요.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "뉴스 아카이브",
  },
};

export const viewport: Viewport = {
  themeColor: "#4a87c6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          // 페인트 전에 저장된 테마를 적용해서 깜빡임(FOUC)을 방지
          dangerouslySetInnerHTML={{
            __html: `try {
              const t = localStorage.getItem("theme");
              if (t === "light" || t === "dark") {
                document.documentElement.setAttribute("data-theme", t);
              }
            } catch (e) {}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        <Header />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
