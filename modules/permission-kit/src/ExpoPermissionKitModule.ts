import { requireNativeModule } from 'expo';

export interface PermissionKitNativeModule {
  isBatteryOptimizationEnabled(): Promise<boolean>;
  openBatteryOptimizationSettings(): Promise<void>;
  isOverlayPermissionEnabled(): Promise<boolean>;
  openOverlayPermissionSettings(): Promise<void>;
}

let _nativeModule: PermissionKitNativeModule | null = null;
try {
  _nativeModule = requireNativeModule<PermissionKitNativeModule>('ExpoPermissionKit');
} catch {
  // Native module not available on this platform (e.g., iOS simulator, web)
}

export default _nativeModule;
