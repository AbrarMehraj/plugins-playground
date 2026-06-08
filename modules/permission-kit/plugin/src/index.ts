import { ConfigPlugin, withAndroidManifest } from 'expo/config-plugins';

export type PermissionKitPluginProps = {
  permissions?: string[];
};

const withPermissionKit: ConfigPlugin<PermissionKitPluginProps> = (
  config,
  props
) => {
  const permissions = props?.permissions || [];

  if (
    permissions.includes('batteryOptimization') ||
    permissions.includes('overlay') ||
    permissions.includes('exactAlarm') ||
    permissions.includes('dndAccess') ||
    permissions.includes('notifications')
  ) {
    config = withAndroidManifest(config, (config) => {
      const androidManifest = config.modResults;
      if (!androidManifest.manifest['uses-permission']) {
        androidManifest.manifest['uses-permission'] = [];
      }
      
      const existingPermissions = androidManifest.manifest['uses-permission'].map(
        (p: any) => p.$['android:name']
      );

      if (
        permissions.includes('batteryOptimization') &&
        !existingPermissions.includes('android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS')
      ) {
        androidManifest.manifest['uses-permission'].push({
          $: { 'android:name': 'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS' },
        });
      }

      if (
        permissions.includes('overlay') &&
        !existingPermissions.includes('android.permission.SYSTEM_ALERT_WINDOW')
      ) {
        androidManifest.manifest['uses-permission'].push({
          $: { 'android:name': 'android.permission.SYSTEM_ALERT_WINDOW' },
        });
      }

      if (
        permissions.includes('exactAlarm') &&
        !existingPermissions.includes('android.permission.SCHEDULE_EXACT_ALARM')
      ) {
        androidManifest.manifest['uses-permission'].push({
          $: { 'android:name': 'android.permission.SCHEDULE_EXACT_ALARM' },
        });
      }

      if (
        permissions.includes('dndAccess') &&
        !existingPermissions.includes('android.permission.ACCESS_NOTIFICATION_POLICY')
      ) {
        androidManifest.manifest['uses-permission'].push({
          $: { 'android:name': 'android.permission.ACCESS_NOTIFICATION_POLICY' },
        });
      }

      if (
        permissions.includes('notifications') &&
        !existingPermissions.includes('android.permission.POST_NOTIFICATIONS')
      ) {
        androidManifest.manifest['uses-permission'].push({
          $: { 'android:name': 'android.permission.POST_NOTIFICATIONS' },
        });
      }

      return config;
    });
  }

  return config;
};

export default withPermissionKit;
