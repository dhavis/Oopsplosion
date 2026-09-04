# Oopsplosion

A rage-room game. Smash things. Feel better. Maybe a little too well.

**Official name:** Oopsplosion  
**Logo styling:** Oops-plosion is fine in art, but the title, domain, and package name stay one word.

## Platforms

One TypeScript + Three.js codebase.

- **Web** — iterate here every day
- **Android** — first native target (this Windows machine)
- **iOS** — same game, packaged later on a Mac with Xcode

Portrait, one thumb.

### Web

```
npm install
npm run dev
```

On a phone, open Vite’s Network URL (not `localhost`).

### Android (Windows — no Mac)

```
npm run doctor
npm run android:setup
npm run android:assemble
```

`android:setup` installs a portable Temurin **JDK 21** (no admin) and the Android SDK under `%LOCALAPPDATA%\Android\Sdk`, then writes `android/local.properties`.

`android:assemble` builds a debug APK:

`android/app/build/outputs/apk/debug/app-debug.apk`

Put it on a phone:

- USB debugging: `npm run android:run`
- Or copy the APK and install it
- Or `npm run android` to open Android Studio (optional, after [installing Studio](https://developer.android.com/studio))

After game-code changes: `npm run android:assemble` again (or `android:run`).

### iOS (later, on a Mac)

The `ios/` project stays in the repo. On Windows you can keep it current without Xcode:

```
npm run ios:sync
```

On a Mac, with Xcode and CocoaPods:

```
npm run ios:sync
npx cap open ios
```

Signing and TestFlight wait until you have that Mac.

### Store icons

`public/icon.svg` is a placeholder. Replace before Play / App Store submission.
