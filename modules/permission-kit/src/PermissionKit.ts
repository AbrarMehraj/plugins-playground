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
};
