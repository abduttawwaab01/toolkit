"use client";

export function isPWAInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function canInstallPWA(): boolean {
  if (typeof window === "undefined") return false;
  return "BeforeInstallPromptEvent" in window;
}

export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") return;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    } catch {
      // Service worker registration failed
    }
  });
}

export function subscribeToPushNotifications(): Promise<boolean> {
  return Promise.resolve(false);
}
