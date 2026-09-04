import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { findJavaHome, sdkHome, writeLocalProperties } from "./android-paths.mjs";

const root = join(import.meta.dirname, "..");
const android = join(root, "android");
const wrapperJar = join(android, "gradle", "wrapper", "gradle-wrapper.jar");

if (!existsSync(wrapperJar) || !existsSync(join(sdkHome, "platform-tools"))) {
  console.error("Android toolchain missing. Run: npm run android:setup");
  process.exit(1);
}

const javaHome = findJavaHome();
const env = {
  ...process.env,
  ANDROID_HOME: sdkHome,
  ANDROID_SDK_ROOT: sdkHome,
};
if (javaHome) env.JAVA_HOME = javaHome;

writeLocalProperties(android);

const r = spawnSync(join(android, "gradlew.bat"), ["assembleDebug"], {
  cwd: android,
  stdio: "inherit",
  env,
  shell: true,
});
if (r.status === 0) {
  const apk = join(android, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
  console.log(existsSync(apk) ? `APK ${apk}` : "assembleDebug finished");
}
process.exit(r.status ?? 1);
