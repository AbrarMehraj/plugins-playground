import { AppState, Platform } from 'react-native';
import NativeModule from './ExpoPermissionKitModule';

export async function checkBatteryOptimization() {
  if (Platform.OS === 'ios' || !NativeModule) {
    return { status: 'unavailable' as const };
  }
  const enabled = await NativeModule.isBatteryOptimizationEnabled();
  return {
    status: (enabled ? 'granted' : 'denied') as 'granted' | 'denied',
  };
}

export async function batteryOptimization() {
  if (Platform.OS === 'ios' || !NativeModule) {
    return { status: 'unavailable' as const };
  }

  const check = await checkBatteryOptimization();

  if (check.status === 'granted') {
    return check;
  }

  try {
    await NativeModule.openBatteryOptimizationSettings();
  } catch (error: any) {
    if (error?.message?.includes('MISSING_PERMISSION')) {
      console.warn(
        "[@abrarmehraj/permission-kit] Missing Permission: You forgot to add 'batteryOptimization' to your app.json plugin."
      );
      return { status: 'denied' as const };
    }
    throw error;
  }

  await waitForResume();

  return await checkBatteryOptimization();
}

function waitForResume(): Promise<void> {
  return new Promise(resolve => {
    let wentToBackground = false;

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        // App left foreground (went to Settings or permission dialog dismissed)
        wentToBackground = true;
      }

      if (state === 'active' && wentToBackground) {
        // App came back from background/settings — this is a genuine resume
        sub.remove();
        // Short delay to allow the OS to propagate permission changes
        setTimeout(resolve, 400);
      }
    });
  });
}

export async function checkOverlay() {
  if (Platform.OS === 'ios' || !NativeModule) {
    return { status: 'unavailable' as const };
  }
  const enabled = await NativeModule.isOverlayPermissionEnabled();
  return {
    status: (enabled ? 'granted' : 'denied') as 'granted' | 'denied',
  };
}

export async function overlay() {
  if (Platform.OS === 'ios' || !NativeModule) {
    return { status: 'unavailable' as const };
  }

  const check = await checkOverlay();

  if (check.status === 'granted') {
    return check;
  }

  try {
    await NativeModule.openOverlayPermissionSettings();
  } catch (error: any) {
    if (error?.message?.includes('MISSING_PERMISSION')) {
      console.warn(
        "[@abrarmehraj/permission-kit] Missing Permission: You forgot to add 'overlay' to your app.json plugin."
      );
      return { status: 'denied' as const };
    }
    throw error;
  }

  await waitForResume();

  return await checkOverlay();
}

export async function checkExactAlarm() {
  if (Platform.OS === 'ios' || !NativeModule) {
    return { status: 'unavailable' as const };
  }
  const enabled = await NativeModule.isExactAlarmPermissionEnabled();
  return {
    status: (enabled ? 'granted' : 'denied') as 'granted' | 'denied',
  };
}

export async function exactAlarm() {
  if (Platform.OS === 'ios' || !NativeModule) {
    return { status: 'unavailable' as const };
  }

  const check = await checkExactAlarm();

  if (check.status === 'granted') {
    return check;
  }

  try {
    await NativeModule.openExactAlarmSettings();
  } catch (error: any) {
    if (error?.message?.includes('MISSING_PERMISSION')) {
      console.warn(
        "[@abrarmehraj/permission-kit] Missing Permission: You forgot to add 'exactAlarm' to your app.json plugin."
      );
      return { status: 'denied' as const };
    }
    throw error;
  }

  await waitForResume();

  return await checkExactAlarm();
}

export interface AccessibilityOptions {
  androidServicePath: string;
}

export async function checkAccessibility(options: AccessibilityOptions) {
  if (Platform.OS === 'ios' || !NativeModule) {
    return { status: 'unavailable' as const };
  }
  const enabled = await NativeModule.isAccessibilityPermissionEnabled(options.androidServicePath);
  return {
    status: (enabled ? 'granted' : 'denied') as 'granted' | 'denied',
  };
}

export async function accessibility(options: AccessibilityOptions) {
  if (Platform.OS === 'ios' || !NativeModule) {
    return { status: 'unavailable' as const };
  }

  const check = await checkAccessibility(options);

  if (check.status === 'granted') {
    return check;
  }

  await NativeModule.openAccessibilitySettings();
  await waitForResume();

  return await checkAccessibility(options);
}

export async function checkDndAccess() {
  if (Platform.OS === 'ios' || !NativeModule) {
    return { status: 'unavailable' as const };
  }
  const enabled = await NativeModule.isDndAccessPermissionEnabled();
  return {
    status: (enabled ? 'granted' : 'denied') as 'granted' | 'denied',
  };
}

export async function dndAccess() {
  if (Platform.OS === 'ios' || !NativeModule) {
    return { status: 'unavailable' as const };
  }

  const check = await checkDndAccess();

  if (check.status === 'granted') {
    return check;
  }

  try {
    await NativeModule.openDndAccessSettings();
  } catch (error: any) {
    if (error?.message?.includes('MISSING_PERMISSION')) {
      console.warn(
        "[@abrarmehraj/permission-kit] Missing Permission: You forgot to add 'dndAccess' to your app.json plugin."
      );
      return { status: 'denied' as const };
    }
    throw error;
  }

  await waitForResume();

  return await checkDndAccess();
}

export async function checkNotifications() {
  if (!NativeModule) {
    return { status: 'unavailable' as const };
  }
  const result = await NativeModule.checkNotificationsStatus();
  return {
    status: (result.granted ? 'granted' : 'denied') as 'granted' | 'denied',
    canAskAgain: result.canAskAgain,
  };
}

export async function notifications() {
  if (!NativeModule) {
    return { status: 'unavailable' as const };
  }

  const check = await checkNotifications();

  // Already granted — nothing to do
  if (check.status === 'granted') {
    return { status: 'granted' as const };
  }

  if (check.canAskAgain) {
    // OS dialog CAN be shown — request it and let the user decide
    const requested = await NativeModule.requestNotifications();
    return {
      status: (requested.granted ? 'granted' : 'denied') as 'granted' | 'denied',
      canAskAgain: requested.canAskAgain,
    };
  }

  // OS dialog is permanently blocked — only option is to open Settings
  // (This is exactly what WhatsApp, Spotify, etc. do)
  await NativeModule.openNotificationSettings();
  await waitForResume();

  return await checkNotifications();
}

export type LocationResult =
  | { status: 'granted'; latitude: number; longitude: number; accuracy: number; altitude: number; timestamp: number }
  | { status: 'granted'; error: 'TIMEOUT' | 'LOCATION_UNAVAILABLE' }
  | { status: 'denied'; canAskAgain?: boolean; error?: 'LOCATION_SERVICES_DISABLED' }
  | { status: 'restricted' }
  | { status: 'unavailable' };

export async function checkLocation(): Promise<LocationResult> {
  if (!NativeModule) {
    return { status: 'unavailable' };
  }
  const s = await NativeModule.checkLocationStatus();
  if (s.restricted) return { status: 'restricted' };
  if (s.granted) return {
    status: 'granted',
    latitude: 0, longitude: 0, accuracy: 0, altitude: 0, timestamp: 0,
  };
  return { status: 'denied', canAskAgain: s.canAskAgain };
}

export async function location(opts?: { timeout?: number }): Promise<LocationResult> {
  if (!NativeModule) {
    return { status: 'unavailable' };
  }

  const timeoutMs = opts?.timeout ?? 10000;

  // The native layer handles the full lifecycle:
  //   - iOS: notDetermined → dialog → fetch | denied | restricted
  //   - Android: no permission → dialog → fetch | denied
  //   - Both: Location Services OFF → error
  const result = await NativeModule.requestLocation(timeoutMs);

  // Granted or restricted — return immediately
  if (result.status === 'granted' || result.status === 'restricted') {
    return result as LocationResult;
  }

  // First denial (canAskAgain: true) — respect the user's choice, return immediately
  if ('canAskAgain' in result && result.canAskAgain !== false) {
    return result as LocationResult;
  }

  // Permanently denied — open the app's own location settings screen
  const openSettings =
    NativeModule.openAppLocationSettings ?? NativeModule.openLocationSettings;
  await openSettings.call(NativeModule);
  await waitForResume();

  // One final attempt after the user returns from Settings
  return (await NativeModule.requestLocation(timeoutMs)) as LocationResult;
}

export const PermissionKit = {
  batteryOptimization,
  checkBatteryOptimization,
  overlay,
  checkOverlay,
  exactAlarm,
  checkExactAlarm,
  accessibility,
  checkAccessibility,
  dndAccess,
  checkDndAccess,
  notifications,
  checkNotifications,
  location,
  checkLocation,
};
