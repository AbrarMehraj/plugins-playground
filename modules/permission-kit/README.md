# @abrar/permission-kit

A developer-friendly permissions library for **Expo** and **React Native**.

One call handles the full workflow — check, request, wait for app resume, return final status.

```ts
const result = await PermissionKit.batteryOptimization();
// { status: 'granted' } or { status: 'denied' }
```

---

## Installation

```bash
npm install @abrar/permission-kit
# or
yarn add @abrar/permission-kit
# or
pnpm add @abrar/permission-kit
```

## Setup

### For Expo Projects (Recommended)

Use the built-in Config Plugin to automatically handle Android permissions. This ensures you only request the permissions you actually use!

In your `app.json`, add the plugin and specify the permissions you want:

```json
{
  "expo": {
    "plugins": [
      [
        "@abrar/permission-kit",
        {
          "permissions": ["batteryOptimization"]
        }
      ]
    ]
  }
}
```

Then run:
```bash
npx expo prebuild
```

### For Bare React Native Projects (Without Expo Prebuild)

If you are not using Expo Prebuild, you must manage your `AndroidManifest.xml` manually. 

Add the required permission to your `android/app/src/main/AndroidManifest.xml` ONLY IF you intend to use it:

```xml
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
```

> **Note**: PermissionKit requires Expo Modules architecture. If you are on React Native 0.69+, you likely already have it. Make sure you run `npx pod-install` for iOS.

## API

### `PermissionKit.batteryOptimization()`

Checks if battery optimization is disabled for your app. If not, automatically opens the Android Settings dialog and waits for the user to return. Re-checks on resume.

```ts
import { PermissionKit } from '@abrar/permission-kit';

const result = await PermissionKit.batteryOptimization();

if (result.status === 'granted') {
  // App is excluded from battery optimization
} else if (result.status === 'denied') {
  // User denied
} else if (result.status === 'unavailable') {
  // Platform doesn't support this (e.g., iOS)
}
```

### `PermissionKit.checkBatteryOptimization()`

Check the current status without showing any dialog or opening settings.

```ts
const result = await PermissionKit.checkBatteryOptimization();
// Use on app start to know the current state
```

---

## Platform Support

| Feature               | Android | iOS              |
|-----------------------|---------|------------------|
| Battery Optimization  | ✅      | `unavailable` ⚠️ |

> **iOS Note**: iOS does not have Android-style battery optimization. Calling `batteryOptimization()` on iOS immediately returns `{ status: 'unavailable' }` without showing any UI.

---

## Roadmap

- [x] Battery Optimization (Android)
- [ ] Notifications (Android + iOS)
- [ ] Exact Alarm (Android)
- [ ] DND Access (Android)
- [ ] Overlay Permission (Android)
- [x] Expo Config Plugin
- [ ] Standalone Package

---

## License

MIT
