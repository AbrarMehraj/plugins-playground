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

  await NativeModule.openBatteryOptimizationSettings();

  await waitForResume();

  return await checkBatteryOptimization();
}

function waitForResume(): Promise<void> {
  return new Promise(resolve => {
    const sub = AppState.addEventListener(
      'change',
      (state) => {
        if (state === 'active') {
          sub.remove();
          // Add a short delay to allow native settings to propagate
          setTimeout(resolve, 500);
        }
      }
    );
  });
}

export const PermissionKit = {
  batteryOptimization,
  checkBatteryOptimization,
};
