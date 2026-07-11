"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const THEME_EVENT = "theme-change";

function getSnapshot(): Theme {
  const stored = document.documentElement.getAttribute("data-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(callback: () => void) {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    mql.removeEventListener("change", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

function setTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-card-border text-foreground/60 hover:border-accent hover:text-accent"
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 14a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm8-6a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM4 10a1 1 0 01-1 1H2a1 1 0 110-2h1a1 1 0 011 1zm11.657-5.657a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM6.464 14.95a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zm9.193 2.121a1 1 0 01-1.414 0l-.707-.707a1 1 0 111.414-1.414l.707.707a1 1 0 010 1.414zM5.757 5.757a1 1 0 01-1.414 0l-.707-.707A1 1 0 015.05 3.636l.707.707a1 1 0 010 1.414zM10 6a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}
