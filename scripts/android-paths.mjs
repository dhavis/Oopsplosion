import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const sdkHome =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  join(homedir(), "AppData", "Local", "Android", "Sdk");

export const portableJdkHome = join(homedir(), "AppData", "Local", "Java", "jdk-21");

export function findJavaHome() {
  if (process.env.JAVA_HOME && existsSync(join(process.env.JAVA_HOME, "bin", "java.exe"))) {
    return process.env.JAVA_HOME;
  }
  if (existsSync(join(portableJdkHome, "bin", "java.exe"))) return portableJdkHome;
  const prefer21 = join(homedir(), "AppData", "Local", "Java", "jdk-21");
  if (existsSync(join(prefer21, "bin", "java.exe"))) return prefer21;
  const roots = [
    join(process.env.ProgramFiles || "C:\\Program Files", "Microsoft"),
    join(process.env.ProgramFiles || "C:\\Program Files", "Eclipse Adoptium"),
    join(process.env.ProgramFiles || "C:\\Program Files", "Java"),
    join(homedir(), "AppData", "Local", "Java"),
  ];
  for (const root of roots) {
    if (existsSync(join(root, "bin", "java.exe"))) return root;
    if (!existsSync(root)) continue;
    const found = [];
    for (const name of readdirSync(root)) {
      const candidate = join(root, name);
      if (existsSync(join(candidate, "bin", "java.exe"))) found.push(candidate);
    }
    const jdk21 = found.find((p) => /21/.test(p));
    if (jdk21) return jdk21;
    if (found[0]) return found[0];
  }
  return null;
}

export function writeLocalProperties(androidRoot) {
  const sdk = sdkHome.replace(/\\/g, "/");
  writeFileSync(join(androidRoot, "local.properties"), `sdk.dir=${sdk}\n`);
  return sdk;
}
