import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

/** Portrait lock in the native shell. Desktop browsers ignore this; the stage fills the pane. */
function lockPortrait() {
  const ori = screen.orientation as ScreenOrientation & {
    lock?: (orientation: "portrait" | "portrait-primary" | "portrait-secondary") => Promise<void>;
  };
  if (typeof ori.lock !== "function") return;
  void ori.lock("portrait").catch(() => {
    /* not allowed outside fullscreen / installed app */
  });
}

function bootPortrait() {
  lockPortrait();
  window.addEventListener("pointerdown", lockPortrait, { once: true, passive: true });
  window.addEventListener("orientationchange", lockPortrait);
  screen.orientation?.addEventListener("change", lockPortrait);
}

/** Portrait lock only in the iOS/Android shell. Desktop/Cursor must fill the window. */
export async function bootNative() {
  if (!Capacitor.isNativePlatform()) return;

  bootPortrait();
  document.documentElement.classList.add("native");

  try {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {
    /* web or unsupported */
  }

  try {
    await SplashScreen.hide();
  } catch {
    /* splash plugin missing */
  }

  void App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) window.history.back();
  });
}
