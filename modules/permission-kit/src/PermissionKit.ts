import { AppState, Platform } from 'react-native';
import NativeModule from './ExpoPermissionKitModule';
import { MediaOptions, MediaResult } from './types';

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

  // Permanently denied - return so developer can show a custom UI
  return { status: 'denied' as const, canAskAgain: false };
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

  return result as LocationResult;
}

export async function checkMedia(opts: MediaOptions): Promise<MediaResult> {
  if (!NativeModule) return { status: 'unavailable' };
  
  try {
    return await NativeModule.checkMediaStatus(opts.type);
  } catch (error) {
    return { status: 'unavailable' };
  }
}

export async function media(opts: MediaOptions): Promise<MediaResult> {
  if (!NativeModule) return { status: 'unavailable' };

  // First, check if already granted
  const check = await checkMedia(opts);
  if (!opts.requestMore && (check.status === 'granted' || check.status === 'limited' || check.status === 'restricted')) {
    return check;
  }
  
  if (opts.requestMore && check.status === 'limited' && Platform.OS === 'ios') {
    await NativeModule.presentLimitedLibraryPicker();
    // Re-check status after they potentially interacted with the picker.
    // (Note: on iOS the picker is an out-of-process system UI, but it doesn't background the app, 
    // so we return immediately. The developer can check status again later if needed)
    return await checkMedia(opts);
  }

  // If it's the "all" files permission, we must go straight to settings on Android
  if (opts.type === 'all' && Platform.OS === 'android') {
    await NativeModule.openAllFilesSettings();
    await waitForResume();
    return await checkMedia(opts);
  }

  // Request runtime permission
  let result;
  try {
    result = await NativeModule.requestMedia(opts.type);
  } catch (error: any) {
    if (error?.message?.includes('MISSING_PERMISSION')) {
      console.warn(
        `[@abrarmehraj/permission-kit] Missing Permission: You forgot to add 'media' to your app.json plugin.`
      );
      return { status: 'denied' };
    }
    throw error;
  }

  // Denied (whether canAskAgain is true or false) or granted
  return result;
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
  media,
  checkMedia,
};
