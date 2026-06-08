# @abrarmehraj/permission-kit

A developer-friendly permissions library for **Expo** and **React Native**.

One call handles the full workflow — check, request, wait for app resume, return final status.

```ts
const result = await PermissionKit.notifications();
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
          "permissions": ["batteryOptimization", "overlay", "exactAlarm", "dndAccess", "notifications", "location"],
          "locationDescription": "Used to show your current position."
        }
      ]
    ]
  }
}
```

- **`permissions`**: Array of permissions you intend to use. Only the required ones will be injected into AndroidManifest.xml.
- **`locationDescription`**: (Optional) For iOS, this string is used as the `NSLocationWhenInUseUsageDescription` that Apple displays when asking for location permission. Defaults to `"$(PRODUCT_NAME) needs access to your location."`

Then run:
```bash
npx expo prebuild
```

### For Bare React Native Projects (Without Expo Prebuild)

If you are not using Expo Prebuild, you must manage your `AndroidManifest.xml` manually. 

Add the required permissions to your `android/app/src/main/AndroidManifest.xml` ONLY for the features you intend to use:

```xml
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.ACCESS_NOTIFICATION_POLICY" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
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

---

### `PermissionKit.overlay()`

Checks if the app is allowed to draw over other apps (System Alert Window). If not, automatically opens the Android "Display over other apps" settings, waits for the user to return, and re-checks on resume.

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

---

### `PermissionKit.exactAlarm()`

Checks if the app is allowed to schedule exact alarms (Android 14+ requirement). If not, automatically opens the Android "Alarms & Reminders" settings, waits for the user to return, and re-checks on resume.

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

---

### `PermissionKit.accessibility({ androidServicePath })`

Checks if a specific Accessibility Service is enabled. If not, automatically opens the Android Accessibility Settings, waits for the user to return, and re-checks on resume.

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

---

### `PermissionKit.dndAccess()`

Checks if the app is allowed to modify Do Not Disturb (Notification Policy Access). If not, automatically opens the Android "Do Not Disturb access" settings, waits for the user to return, and re-checks on resume.

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

### `PermissionKit.notifications()`

Requests notification permission from the user using the correct industry-standard flow:

- **First call**: Shows the native OS permission dialog (on both iOS and Android 13+).
- **User taps "Allow"**: Returns `{ status: 'granted' }`.
- **User taps "Don't Allow"**: Returns `{ status: 'denied', canAskAgain: true }`. The user's choice is respected — no forced redirect.
- **Subsequent call (after permanent denial)**: Automatically opens the system Notification Settings for your app, waits for the user to return, and re-checks.

```ts
const result = await PermissionKit.notifications();

if (result.status === 'granted') {
  // Notifications are enabled — schedule your push token registration here
} else if (result.status === 'denied') {
  // User denied — show an in-app explanation if you want
} else if (result.status === 'unavailable') {
  // Should not happen on iOS or Android 13+
}
```

### `PermissionKit.checkNotifications()`

Check the current notification permission status without showing any dialog.

```ts
const result = await PermissionKit.checkNotifications();
// { status: 'granted' | 'denied', canAskAgain: boolean }
```

---

### `PermissionKit.location({ timeout?: number })`

Requests precise location permission from the user and fetches the coordinates using the correct industry-standard flow:

- **First call**: Shows the native OS permission dialog (on both iOS and Android).
- **User taps "Allow"**: Fetches GPS signal and returns `{ status: 'granted', latitude: number, longitude: number, accuracy: number, timestamp: number, altitude: number }`.
- **User taps "Deny"**: Returns `{ status: 'denied', canAskAgain: true }`. The user's choice is respected — no forced redirect.
- **Subsequent call (after permanent denial)**: Automatically opens the system Location Settings for your app, waits for the user to return, and re-attempts the GPS fetch.
- **Location Services Off**: If global location services (GPS) are disabled, it automatically prompts the user natively to turn them on (via Google Play Services on Android). If they tap "No thanks", or if you're on a device without Play Services, it aborts and returns `{ status: 'denied', error: 'LOCATION_SERVICES_DISABLED' }`. This gives you full control to show a custom explanation dialog before manually calling `PermissionKit.openLocationSettings()`.

**Return Type:**
```ts
type LocationResult =
  | { status: 'granted'; latitude: number; longitude: number; accuracy: number; altitude: number; timestamp: number }
  | { status: 'denied'; canAskAgain?: boolean; error?: 'LOCATION_SERVICES_DISABLED' | 'TIMEOUT' | 'LOCATION_UNAVAILABLE' }
  | { status: 'restricted' }
  | { status: 'unavailable' };
```

```ts
const result = await PermissionKit.location({ timeout: 15000 });

if (result.status === 'granted') {
  console.log(`Lat: ${result.latitude}, Lng: ${result.longitude}`);
} else if (result.status === 'denied') {
  if (result.error === 'LOCATION_SERVICES_DISABLED') {
    // Show your custom dialog: "Please enable GPS to use this feature"
  } else {
    // User denied app permission
  }
} else if (result.status === 'restricted') {
  // Parental controls or MDM blocking location (iOS)
}
```

### `PermissionKit.checkLocation()`

Check the current location permission status without showing any dialog or fetching coordinates.

```ts
const result = await PermissionKit.checkLocation();
// { status: 'granted' | 'denied' | 'restricted', canAskAgain: boolean }
```

---

## Platform Support

| Feature               | Android | iOS |
|-----------------------|---------|-----|
| Battery Optimization  | ✅      | ⚠️ `unavailable` |
| Overlay Permission    | ✅      | ⚠️ `unavailable` |
| Exact Alarm           | ✅      | ⚠️ `unavailable` |
| Accessibility Service | ✅      | ⚠️ `unavailable` |
| Do Not Disturb Access | ✅      | ⚠️ `unavailable` |
| Notifications         | ✅      | ✅ |
| Location              | ✅      | ✅ |

> **iOS Note**: Battery Optimization, Overlay, Exact Alarm, Accessibility Service, and DND Access are Android-only concepts. Calling them on iOS immediately returns `{ status: 'unavailable' }` without showing any UI. Notifications are natively supported on both platforms.

---

## Roadmap

- [x] Battery Optimization (Android)
- [x] Overlay Permission (Android)
- [x] Exact Alarm (Android)
- [x] Accessibility Service (Android)
- [x] Do Not Disturb Access (Android)
- [x] Notifications (Android + iOS)
- [x] Expo Config Plugin
- [ ] Usage Access (Android)
- [ ] Write System Settings (Android)
- [ ] `ensure()` helper

---

## License

MIT
