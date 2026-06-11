import { requireNativeModule } from 'expo';

export interface PermissionKitNativeModule {
  isBatteryOptimizationEnabled(): Promise<boolean>;
  openBatteryOptimizationSettings(): Promise<void>;
  isOverlayPermissionEnabled(): Promise<boolean>;
  openOverlayPermissionSettings(): Promise<void>;
  isExactAlarmPermissionEnabled(): Promise<boolean>;
  openExactAlarmSettings(): Promise<void>;
  isAccessibilityPermissionEnabled(serviceName: string): Promise<boolean>;
  openAccessibilitySettings(): Promise<void>;
  isDndAccessPermissionEnabled(): Promise<boolean>;
  openDndAccessSettings(): Promise<void>;
  checkNotificationsStatus(): Promise<{ granted: boolean; canAskAgain: boolean }>;
  requestNotifications(): Promise<{ granted: boolean; canAskAgain: boolean }>;
  openNotificationSettings(): Promise<void>;
  checkLocationStatus(): Promise<{
    granted: boolean;
    canAskAgain: boolean;
    restricted: boolean;
    servicesEnabled: boolean;
  }>;
  requestLocation(timeoutMs: number): Promise<
    | { status: 'granted'; latitude: number; longitude: number; accuracy: number; altitude: number; timestamp: number }
    | { status: 'granted'; error: 'TIMEOUT' | 'LOCATION_UNAVAILABLE' }
    | { status: 'denied'; canAskAgain: boolean }
    | { status: 'denied'; error: 'LOCATION_SERVICES_DISABLED' }
    | { status: 'restricted' }
  >;
  /** Request location permission only — no GPS fetch. */
  requestLocationPermissionOnly(): Promise<
    | { status: 'granted' }
    | { status: 'denied'; canAskAgain: boolean }
    | { status: 'restricted' }
  >;
  /** Show a native alert dialog guiding the user to Settings. Resolves when dismissed. */
  showPermissionAlertAndOpenSettings(title: string, description: string, settingsType: string): Promise<void>;
  openLocationSettings(): Promise<void>;
  openAppLocationSettings(): Promise<void>;
  checkMediaStatus(type: string): Promise<{
    status: 'granted' | 'limited' | 'denied' | 'restricted' | 'unavailable';
    canAskAgain?: boolean;
  }>;
  requestMedia(type: string): Promise<{
    status: 'granted' | 'limited' | 'denied' | 'restricted' | 'unavailable';
    canAskAgain?: boolean;
  }>;
  openMediaSettings(): Promise<void>;
  openAllFilesSettings(): Promise<void>;
  presentLimitedLibraryPicker(): Promise<void>;
}

let _nativeModule: PermissionKitNativeModule | null = null;
try {
  _nativeModule = requireNativeModule<PermissionKitNativeModule>('ExpoPermissionKit');
} catch {
  // Native module not available on this platform (e.g., iOS simulator, web)
}

export default _nativeModule;
