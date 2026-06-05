import { ConfigPlugin, withAndroidManifest } from 'expo/config-plugins';

export type PermissionKitPluginProps = {
  permissions?: string[];
};

const withPermissionKit: ConfigPlugin<PermissionKitPluginProps> = (
  config,
  props
) => {
  const permissions = props?.permissions || [];

  if (permissions.includes('batteryOptimization')) {
    config = withAndroidManifest(config, (config) => {
      const androidManifest = config.modResults;
      if (!androidManifest.manifest['uses-permission']) {
        androidManifest.manifest['uses-permission'] = [];
      }
      
      const existingPermissions = androidManifest.manifest['uses-permission'].map(
        (p: any) => p.$['android:name']
      );

      if (
        !existingPermissions.includes(
          'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS'
        )
      ) {
        androidManifest.manifest['uses-permission'].push({
          $: {
            'android:name':
              'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
          },
        });
      }
      return config;
    });
  }

  return config;
};

export default withPermissionKit;
