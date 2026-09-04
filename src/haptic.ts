import { Haptics, ImpactStyle } from "@capacitor/haptics";

export function pokeHaptic(kind: "light" | "medium" | "heavy" = "medium") {
  const style =
    kind === "heavy" ? ImpactStyle.Heavy : kind === "light" ? ImpactStyle.Light : ImpactStyle.Medium;
  void Haptics.impact({ style }).catch(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(kind === "light" ? 8 : kind === "heavy" ? 24 : 14);
    }
  });
}
