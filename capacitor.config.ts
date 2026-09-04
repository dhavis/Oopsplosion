import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.oopsplosion.app",
  appName: "Oopsplosion",
  webDir: "dist",
  ios: {
    contentInset: "never",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      backgroundColor: "#0b0b0c",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
    },
  },
};

export default config;
