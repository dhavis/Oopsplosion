import { createWriteStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { spawnSync } from "node:child_process";
import { findJavaHome, portableJdkHome, sdkHome, writeLocalProperties } from "./android-paths.mjs";

const android = join(import.meta.dirname, "..", "android");
const cmdZip = join(homedir(), "AppData", "Local", "Temp", "commandlinetools-win.zip");
const jdkZip = join(homedir(), "AppData", "Local", "Temp", "temurin21.zip");
const cmdUrl = "https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip";
const jdkUrl =
  "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk";
const wrapperUrl =
  "https://github.com/gradle/gradle/raw/v8.14.3/gradle/wrapper/gradle-wrapper.jar";

function pwsh(script) {
  const r = spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], {
    stdio: "inherit",
  });
  if (r.status !== 0) throw new Error(`powershell failed (${r.status})`);
}

async function download(url, dest) {
  if (existsSync(dest) && statSync(dest).size > 1_000_000) {
    console.log(`Using cached ${dest}`);
    return;
  }
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`download ${url} → ${res.status}`);
  mkdirSync(join(dest, ".."), { recursive: true });
  await pipeline(res.body, createWriteStream(dest));
}

async function ensureJava() {
  const existing = findJavaHome();
  if (existing) {
    const ver = spawnSync(join(existing, "bin", "java.exe"), ["-version"], { encoding: "utf8" });
    const text = `${ver.stderr || ""}${ver.stdout || ""}`;
    const major = Number(text.match(/version "(\d+)/)?.[1] || 0);
    if (major >= 21) {
      console.log(`JDK ${major} at ${existing}`);
      return;
    }
    console.log(`Found JDK ${major} at ${existing}; need 21 for Capacitor 8.`);
  }
  const extract = join(homedir(), "AppData", "Local", "Java");
  console.log("Downloading portable Temurin JDK 21 (no admin)…");
  mkdirSync(extract, { recursive: true });
  await download(jdkUrl, jdkZip);
  pwsh(
    `Expand-Archive -Force -Path '${jdkZip}' -DestinationPath '${extract}'; $d = Get-ChildItem '${extract}' -Directory | Where-Object { $_.Name -like 'jdk-21*' } | Select-Object -First 1; if (Test-Path '${portableJdkHome}') { Remove-Item -Recurse -Force '${portableJdkHome}' }; if ($d) { Move-Item $d.FullName '${portableJdkHome}' }`,
  );
  if (!existsSync(join(portableJdkHome, "bin", "java.exe"))) {
    throw new Error("Portable JDK extract failed");
  }
  console.log(`JDK at ${portableJdkHome}`);
}

async function ensureWrapperJar() {
  const jar = join(android, "gradle", "wrapper", "gradle-wrapper.jar");
  if (existsSync(jar) && statSync(jar).size > 10_000) return;
  console.log("Fetching gradle-wrapper.jar…");
  await download(wrapperUrl, jar);
}

async function ensureSdk() {
  const sm = join(sdkHome, "cmdline-tools", "latest", "bin", "sdkmanager.bat");
  if (!existsSync(sm)) {
    console.log("Downloading Android command-line tools…");
    mkdirSync(sdkHome, { recursive: true });
    await download(cmdUrl, cmdZip);
    const tmp = join(sdkHome, "cmdline-tools-tmp");
    const latest = join(sdkHome, "cmdline-tools", "latest");
    pwsh(
      `Expand-Archive -Force -Path '${cmdZip}' -DestinationPath '${tmp}'; New-Item -ItemType Directory -Force -Path '${join(sdkHome, "cmdline-tools")}' | Out-Null; if (Test-Path '${latest}') { Remove-Item -Recurse -Force '${latest}' }; Move-Item '${join(tmp, "cmdline-tools")}' '${latest}'; Remove-Item -Recurse -Force '${tmp}'`,
    );
  }

  const javaHome = findJavaHome();
  const env = {
    ...process.env,
    ANDROID_HOME: sdkHome,
    ANDROID_SDK_ROOT: sdkHome,
    ...(javaHome ? { JAVA_HOME: javaHome, PATH: `${join(javaHome, "bin")};${process.env.PATH}` } : {}),
  };
  const licenses = join(sdkHome, "licenses");
  mkdirSync(licenses, { recursive: true });
  writeFileSync(join(licenses, "android-sdk-license"), "24333f8a63b6825ea9c5514f83c2829b004d1fee\n");
  writeFileSync(join(licenses, "android-sdk-preview-license"), "84831b9409646161da1d19167f1b81d052d8\n");
  console.log("Installing platforms;android-36 build-tools;35.0.0 platform-tools…");
  const inst = spawnSync(
    "cmd.exe",
    [
      "/c",
      sm,
      `--sdk_root=${sdkHome}`,
      "platforms;android-36",
      "build-tools;35.0.0",
      "platform-tools",
    ],
    { stdio: "inherit", env },
  );
  if (inst.status !== 0) throw new Error("sdkmanager install failed");
  if (!existsSync(join(sdkHome, "platforms", "android-36"))) {
    throw new Error("SDK platform android-36 missing after sdkmanager");
  }
}

await ensureJava();
await ensureWrapperJar();
await ensureSdk();
const sdk = writeLocalProperties(android);
console.log(`Android SDK ready at ${sdk}`);
console.log("Next: npm run android:assemble");
