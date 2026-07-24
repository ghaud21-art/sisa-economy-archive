// 최소 서비스워커: 설치 가능(installable) 요건 충족용.
// 뉴스 콘텐츠가 매일 바뀌므로 별도 캐싱 없이 항상 네트워크로 요청을 전달한다.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
