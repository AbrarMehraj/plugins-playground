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
  openLocationSettings(): Promise<void>;
  openAppLocationSettings(): Promise<void>;
}

let _nativeModule: PermissionKitNativeModule | null = null;
try {
  _nativeModule = requireNativeModule<PermissionKitNativeModule>('ExpoPermissionKit');
} catch {
  // Native module not available on this platform (e.g., iOS simulator, web)
}

export default _nativeModule;
