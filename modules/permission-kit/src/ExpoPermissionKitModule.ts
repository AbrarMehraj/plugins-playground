import { requireNativeModule } from 'expo';

export interface PermissionKitNativeModule {
  isBatteryOptimizationEnabled(): Promise<boolean>;
  openBatteryOptimizationSettings(): Promise<void>;
}

export default requireNativeModule<PermissionKitNativeModule>(
  'ExpoPermissionKit'
);
