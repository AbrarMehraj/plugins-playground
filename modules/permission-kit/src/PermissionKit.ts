import { Alert, AppState, Platform, ToastAndroid } from 'react-native';
import NativeModule from './ExpoPermissionKitModule';
import { MediaOptions, MediaResult } from './types';

// ─── Shared Types ──────────────────────────────────────────────────────────────

type AndroidSettingsResult = { status: 'granted' | 'denied' | 'unavailable' };

export interface AccessibilityOptions {
  androidServicePath: string;
}

export interface AlertConfig {
  title: string;
  description: string;
}

export interface NotificationOptions {
  /** If true, shows a native alert dialog when permission is permanently denied. */
  showAlertConfig?: boolean;
  /** Optional text for the native alert dialog. Uses defaults if not provided. */
  alertConfig?: AlertConfig;
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

export type LocationAccuracy = 'high' | 'balanced' | 'low';

export interface LocationOptions {
  /** GPS timeout in milliseconds. Default: 10000ms */
  timeout?: number;
  /**
   * Location accuracy level. Default: 'balanced'.
   * - 'high': GPS-level precision (~5m). Slower, uses more battery.
   * - 'balanced': Wi-Fi/Cell tower precision (~100m). Fast, battery-friendly.
   * - 'low': City-level precision (~1km). Fastest, minimal battery.
   */
  accuracy?: LocationAccuracy;
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
  /** If true, automatically shows native UI messages (Toast on Android, Alert on iOS) for common location errors like timeout or services disabled. Default: true */
  showErrorAlerts?: boolean;
  /** Custom messages to display when showErrorAlerts is true. */
  errorMessages?: {
    servicesDisabled?: string;
    timeout?: string;
    unavailable?: string;
  };
}

// ─── Internal Helpers ──────────────────────────────────────────────────────────

/** Fallback native message (Toast for Android, Alert for iOS) */
const showNativeMessage = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    Alert.alert('Notice', message, [{ text: 'OK' }]);
  }
};

/** Wait for the app to resume from background (e.g. after opening Settings). */
function waitForResume(): Promise<void> {
  return new Promise(resolve => {
    let wentToBackground = false;

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        wentToBackground = true;
      }

      if (state === 'active' && wentToBackground) {
        sub.remove();
        // Short delay to allow the OS to propagate permission changes
        setTimeout(resolve, 400);
      }
    });
  });
}

/**
 * Generic check for any Android settings-based permission.
 * Returns 'unavailable' on iOS, 'granted'/'denied' based on the native check.
 */
async function checkAndroidSettingsPermission(
  checkFn: () => Promise<boolean>,
): Promise<AndroidSettingsResult> {
  if (Platform.OS === 'ios' || !NativeModule) {
    return { status: 'unavailable' };
  }
  const enabled = await checkFn();
  return { status: enabled ? 'granted' : 'denied' };
}

/**
 * Generic request for any Android settings-based permission.
 * Handles: check → open settings → catch MISSING_PERMISSION → waitForResume → re-check.
 */
async function requestAndroidSettingsPermission(
  pluginName: string,
  checkFn: () => Promise<AndroidSettingsResult>,
  openSettingsFn: () => Promise<void>,
): Promise<AndroidSettingsResult> {
  if (Platform.OS === 'ios' || !NativeModule) {
    return { status: 'unavailable' };
  }

  const check = await checkFn();
  if (check.status === 'granted') return check;

  try {
    await openSettingsFn();
  } catch (error: any) {
    if (error?.message?.includes('MISSING_PERMISSION')) {
      console.warn(
        `[@abrarmehraj/permission-kit] Missing Permission: You forgot to add '${pluginName}' to your app.json plugin.`
      );
      return { status: 'denied' };
    }
    throw error;
  }

  await waitForResume();
  return await checkFn();
}

// ─── Android Settings-Based Permissions (DRY) ─────────────────────────────────

export const checkBatteryOptimization = () =>
  checkAndroidSettingsPermission(() => NativeModule!.isBatteryOptimizationEnabled());

export const batteryOptimization = () =>
  requestAndroidSettingsPermission('batteryOptimization', checkBatteryOptimization, () => NativeModule!.openBatteryOptimizationSettings());

export const checkOverlay = () =>
  checkAndroidSettingsPermission(() => NativeModule!.isOverlayPermissionEnabled());

export const overlay = () =>
  requestAndroidSettingsPermission('overlay', checkOverlay, () => NativeModule!.openOverlayPermissionSettings());

export const checkUsageStats = () =>
  checkAndroidSettingsPermission(() => NativeModule!.isUsageStatsPermissionEnabled());

export const usageStats = () =>
  requestAndroidSettingsPermission('usageStats', checkUsageStats, () => NativeModule!.openUsageStatsSettings());

export const checkExactAlarm = () =>
  checkAndroidSettingsPermission(() => NativeModule!.isExactAlarmPermissionEnabled());

export const exactAlarm = () =>
  requestAndroidSettingsPermission('exactAlarm', checkExactAlarm, () => NativeModule!.openExactAlarmSettings());

export const checkFullScreenIntent = () =>
  checkAndroidSettingsPermission(() => NativeModule!.isFullScreenIntentPermissionEnabled());

export const fullScreenIntent = () =>
  requestAndroidSettingsPermission('fullScreenIntent', checkFullScreenIntent, () => NativeModule!.openFullScreenIntentSettings());

export const checkDndAccess = () =>
  checkAndroidSettingsPermission(() => NativeModule!.isDndAccessPermissionEnabled());

export const dndAccess = () =>
  requestAndroidSettingsPermission('dndAccess', checkDndAccess, () => NativeModule!.openDndAccessSettings());

// ─── Accessibility (slightly different — takes runtime options, no MISSING_PERMISSION check) ───

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
  if (check.status === 'granted') return check;

  await NativeModule.openAccessibilitySettings();
  await waitForResume();

  return await checkAccessibility(options);
}

// ─── Notifications (cross-platform, runtime dialog, canAskAgain logic) ─────

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

// ─── Location (cross-platform, GPS fetch, services check, error alerts) ────

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

export async function location(opts?: LocationOptions): Promise<LocationResult> {
  if (!NativeModule) {
    return { status: 'unavailable' };
  }

  const timeoutMs = opts?.timeout ?? 10000;
  const accuracy = opts?.accuracy ?? 'balanced';
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
  const result = await NativeModule.requestLocation(timeoutMs, accuracy);

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
      showNativeMessage(opts?.errorMessages?.timeout ?? 'Could not determine your location in time. Please try again.');
    } else if (result.status === 'granted' && 'error' in result && result.error === 'LOCATION_UNAVAILABLE') {
      showNativeMessage(opts?.errorMessages?.unavailable ?? 'Location unavailable. Please check your device settings.');
    }
  }

  return result as LocationResult;
}

// ─── Media (cross-platform, fragmentation handling, limited picker) ────────

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

// ─── Public API ────────────────────────────────────────────────────────────────

export const PermissionKit = {
  batteryOptimization,
  checkBatteryOptimization,
  overlay,
  checkOverlay,
  usageStats,
  checkUsageStats,
  exactAlarm,
  checkExactAlarm,
  fullScreenIntent,
  checkFullScreenIntent,
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
