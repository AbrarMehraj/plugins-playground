# @abrarmehraj/permission-kit

A developer-friendly permissions library for **Expo** and **React Native**.

One call handles the full workflow — check, request, wait for app resume, return final status.

```ts
const result = await PermissionKit.batteryOptimization();
// { status: 'granted' } or { status: 'denied' }
```

---

## Installation

```bash
npm install @abrarmehraj/permission-kit
# or
yarn add @abrarmehraj/permission-kit
# or
pnpm add @abrarmehraj/permission-kit
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
        "@abrarmehraj/permission-kit",
        {
          "permissions": ["batteryOptimization", "overlay", "exactAlarm"]
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
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
```

> **Note**: PermissionKit requires Expo Modules architecture. If you are on React Native 0.69+, you likely already have it. Make sure you run `npx pod-install` for iOS.

## API

### `PermissionKit.batteryOptimization()`

Checks if battery optimization is disabled for your app. If not, automatically opens the Android Settings dialog and waits for the user to return. Re-checks on resume.

```ts
import { PermissionKit } from '@abrarmehraj/permission-kit';

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

### `PermissionKit.overlay()`

Checks if the app is allowed to draw over other apps (System Alert Window). If not, automatically opens the Android Settings "Display over other apps" dialog, waits for the user to return, and re-checks on resume.

```ts
const result = await PermissionKit.overlay();

if (result.status === 'granted') {
  // App is allowed to draw over others
}
```

### `PermissionKit.checkOverlay()`

Check the current overlay status without opening settings.

```ts
const result = await PermissionKit.checkOverlay();
```

### `PermissionKit.exactAlarm()`

Checks if the app is allowed to schedule exact alarms (Android 14+ requirement). If not, automatically opens the Android Settings "Alarms & Reminders" dialog, waits for the user to return, and re-checks on resume.

```ts
const result = await PermissionKit.exactAlarm();

if (result.status === 'granted') {
  // App is allowed to schedule exact alarms
}
```

### `PermissionKit.checkExactAlarm()`

Check the current exact alarm status without opening settings.

```ts
const result = await PermissionKit.checkExactAlarm();
```

### `PermissionKit.accessibility({ androidServicePath })`

Checks if a specific Accessibility Service is enabled. If not, automatically opens the Android Accessibility Settings dialog, waits for the user to return, and re-checks on resume.

> **Note**: Your app must actually define an Accessibility Service in its `AndroidManifest.xml` to appear in the settings list!

```ts
const result = await PermissionKit.accessibility({
  androidServicePath: "com.myapp.MyAccessibilityService" // or ".MyAccessibilityService"
});

if (result.status === 'granted') {
  // Service is active
}
```

### `PermissionKit.checkAccessibility({ androidServicePath })`

Check the current accessibility service status without opening settings.

```ts
const result = await PermissionKit.checkAccessibility({
  androidServicePath: ".MyAccessibilityService"
});
```

### `PermissionKit.dndAccess()`

Checks if the app is allowed to modify Do Not Disturb (Notification Policy Access). If not, automatically opens the Android Settings "Do Not Disturb access" dialog, waits for the user to return, and re-checks on resume.

```ts
const result = await PermissionKit.dndAccess();

if (result.status === 'granted') {
  // App can now mute the phone or change DND rules
}
```

### `PermissionKit.checkDndAccess()`

Check the current DND access status without opening settings.

```ts
const result = await PermissionKit.checkDndAccess();
```

---

## Platform Support

| Feature               | Android | iOS              |
|-----------------------|---------|------------------|
| Battery Optimization  | ✅      | `unavailable` ⚠️ |
| Overlay Permission    | ✅      | `unavailable` ⚠️ |
| Exact Alarm           | ✅      | `unavailable` ⚠️ |
| Accessibility Service | ✅      | `unavailable` ⚠️ |
| Do Not Disturb Access | ✅      | `unavailable` ⚠️ |

> **iOS Note**: iOS does not have Android-style equivalents for these system-level permissions. Calling them on iOS immediately returns `{ status: 'unavailable' }` without showing any UI.

---

## Roadmap

- [x] Battery Optimization (Android)
- [x] Overlay Permission (Android)
- [x] Exact Alarm (Android)
- [x] Accessibility Service (Android)
- [x] Do Not Disturb Access (Android)
- [ ] Notifications (Android + iOS)
- [ ] Open Settings Helper
- [ ] ensure()
- [x] Expo Config Plugin
- [ ] Standalone Package

---

## License

MIT
