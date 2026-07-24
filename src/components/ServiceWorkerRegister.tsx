"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // 설치 가능 여부에만 영향, 나머지 기능에는 영향 없음
      });
    }
  }, []);

  return null;
}
