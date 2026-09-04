import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { findJavaHome, sdkHome } from "./android-paths.mjs";

const root = join(import.meta.dirname, "..");
const android = join(root, "android");
const ok = (label, pass, detail) => {
  console.log(`${pass ? "ok  " : "need"}  ${label}${detail ? ` — ${detail}` : ""}`);
  return pass;
};

const javaHome = findJavaHome();
const java = spawnSync("java", ["-version"], { encoding: "utf8" });
const javaOk = java.status === 0 || Boolean(javaHome);

ok("Node", true, process.version);
ok("Web build (Vite)", existsSync(join(root, "package.json")), "npm run dev / npm run build");
ok("Capacitor Android project", existsSync(join(android, "app", "build.gradle")));
ok("Capacitor iOS project (sync only on Windows)", existsSync(join(root, "ios", "App", "App", "Info.plist")));
ok("JDK 21+", javaOk, javaHome || "install: npm run android:setup");
ok(
  "Android SDK",
  existsSync(join(sdkHome, "platform-tools")) || existsSync(join(sdkHome, "platforms")),
  sdkHome,
);
ok("local.properties", existsSync(join(android, "local.properties")), "written by android:setup / android:assemble");
ok(
  "Gradle wrapper jar",
  existsSync(join(android, "gradle", "wrapper", "gradle-wrapper.jar")),
  "fetched by android:setup",
);

console.log("");
console.log("Windows path (now):  npm run android:setup   then   npm run android:assemble");
console.log("Phone/emulator:      npm run android:run     (USB debugging or an AVD)");
console.log("iOS later:           on a Mac, npm run ios");
