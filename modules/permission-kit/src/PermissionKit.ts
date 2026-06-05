import { AppState } from 'react-native';
import NativeModule from './ExpoPermissionKitModule';

export async function batteryOptimization() {
  const enabled = await NativeModule.isBatteryOptimizationEnabled();

  if (enabled) {
    return {
      status: 'granted',
    };
  }

  await NativeModule.openBatteryOptimizationSettings();

  await waitForResume();

  const recheck = await NativeModule.isBatteryOptimizationEnabled();

  return {
    status: recheck ? 'granted' : 'denied',
  };
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
};
