import { Alert, AppState, Platform, ToastAndroid } from 'react-native';
import NativeModule from './ExpoPermissionKitModule';
import { MediaOptions, MediaResult } from './types';

// Fallback native message (Toast for Android, Alert for iOS)
const showNativeMessage = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    Alert.alert('Notice', message, [{ text: 'OK' }]);
  }
};

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

export interface NotificationOptions {
  /** If true, shows a native alert dialog when permission is permanently denied. */
  showAlertConfig?: boolean;
  /** Optional text for the native alert dialog. Uses defaults if not provided. */
  alertConfig?: AlertConfig;
}

export async function notifications(opts?: NotificationOptions) {
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

  // Permanently denied — show native alert if caller opted in
  if (opts?.showAlertConfig === true) {
    const title = opts.alertConfig?.title ?? 'Notifications Required';
    const description = opts.alertConfig?.description ?? 'Please enable notifications in Settings to continue.';
    await NativeModule.showPermissionAlertAndOpenSettings(title, description, 'notifications');
  }

  return { status: 'denied' as const, canAskAgain: false };
}

export type LocationPermissionStatus =
  | { status: 'granted' }
  | { status: 'denied'; canAskAgain: boolean; error?: 'LOCATION_SERVICES_DISABLED' }
  | { status: 'restricted' }
  | { status: 'unavailable' };

export type LocationResult =
  | { status: 'granted'; latitude: number; longitude: number; accuracy: number; altitude: number; timestamp: number }
  | { status: 'granted'; error: 'TIMEOUT' | 'LOCATION_UNAVAILABLE' }
  | { status: 'denied'; canAskAgain?: boolean; error?: 'LOCATION_SERVICES_DISABLED' }
  | { status: 'restricted' }
  | { status: 'unavailable' };

export interface AlertConfig {
  title: string;
  description: string;
}

/**
 * Read-only permission status check. No prompts, no GPS hardware.
 * Use this to know the current state before calling location().
 */
export async function checkLocation(): Promise<LocationPermissionStatus> {
  if (!NativeModule) {
    return { status: 'unavailable' };
  }
  const s = await NativeModule.checkLocationStatus();
  if (s.restricted) return { status: 'restricted' };
  if (s.granted) {
    // Surface location services being off even when permission is granted
    if (!s.servicesEnabled) {
      return { status: 'denied', canAskAgain: false, error: 'LOCATION_SERVICES_DISABLED' };
    }
    return { status: 'granted' };
  }
  return {
    status: 'denied',
    canAskAgain: s.canAskAgain,
    ...(s.servicesEnabled === false ? { error: 'LOCATION_SERVICES_DISABLED' as const } : {}),
  };
}

export interface LocationOptions {
  /** GPS timeout in milliseconds. Default: 10000ms */
  timeout?: number;
  /**
   * If false, only requests the permission without fetching GPS coordinates.
   * Resolves with { status: 'granted' } immediately after permission is granted.
   * Default: true
   */
  fetchCoordinates?: boolean;
  /** If true, shows a native alert dialog when permission is permanently denied. */
  showAlertConfig?: boolean;
  /** Optional text for the native alert dialog. Uses defaults if not provided. */
  alertConfig?: AlertConfig;
  /** If true, automatically shows native UI messages (Toast on Android, Alert on iOS) for common location errors like timeout or services disabled. */
  showErrorAlerts?: boolean;
  /** Custom messages to display when showErrorAlerts is true. */
  errorMessages?: {
    servicesDisabled?: string;
    timeout?: string;
    unavailable?: string;
  };
}

export async function location(opts?: LocationOptions): Promise<LocationResult> {
  if (!NativeModule) {
    return { status: 'unavailable' };
  }

  const timeoutMs = opts?.timeout ?? 10000;
  const fetchCoordinates = opts?.fetchCoordinates ?? true;

  if (!fetchCoordinates) {
    // Permission-only mode: request the permission but skip GPS fetch
    const result = await NativeModule.requestLocationPermissionOnly();
    return result as LocationResult;
  }

  // The native layer handles the full lifecycle:
  //   - iOS: notDetermined → dialog → fetch | denied | restricted
  //   - Android: no permission → dialog → fetch | denied
  //   - Both: Location Services OFF → error
  const result = await NativeModule.requestLocation(timeoutMs);

  // Show alert modal if permanently denied and caller opted in
  if (
    result.status === 'denied' &&
    'canAskAgain' in result &&
    result.canAskAgain === false &&
    opts?.showAlertConfig === true
  ) {
    const title = opts.alertConfig?.title ?? 'Location Permission Required';
    const description = opts.alertConfig?.description ?? 'Please enable location access in Settings to continue.';
    await NativeModule.showPermissionAlertAndOpenSettings(title, description, 'location');
  }

  // Show native error toasts/alerts by default (unless explicitly opted out)
  const showErrorAlerts = opts?.showErrorAlerts ?? true;

  if (showErrorAlerts) {
    if (result.status === 'denied' && 'error' in result && result.error === 'LOCATION_SERVICES_DISABLED') {
      showNativeMessage(opts?.errorMessages?.servicesDisabled ?? 'Please turn on location services to continue.');
    } else if (result.status === 'granted' && 'error' in result && result.error === 'TIMEOUT') {
      showNativeMessage(opts?.errorMessages?.timeout ?? 'Taking too long to find your location. Make sure you have a clear view of the sky.');
    } else if (result.status === 'granted' && 'error' in result && result.error === 'LOCATION_UNAVAILABLE') {
      showNativeMessage(opts?.errorMessages?.unavailable ?? 'Location unavailable. Please check your device settings.');
    }
  }

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
