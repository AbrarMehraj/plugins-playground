"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withPermissionKit = (config, props) => {
    const permissions = (props === null || props === void 0 ? void 0 : props.permissions) || [];
    if (permissions.includes('batteryOptimization') || permissions.includes('overlay')) {
        config = (0, config_plugins_1.withAndroidManifest)(config, (config) => {
            const androidManifest = config.modResults;
            if (!androidManifest.manifest['uses-permission']) {
                androidManifest.manifest['uses-permission'] = [];
            }
            const existingPermissions = androidManifest.manifest['uses-permission'].map((p) => p.$['android:name']);
            if (permissions.includes('batteryOptimization') &&
                !existingPermissions.includes('android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS')) {
                androidManifest.manifest['uses-permission'].push({
                    $: { 'android:name': 'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS' },
                });
            }
            if (permissions.includes('overlay') &&
                !existingPermissions.includes('android.permission.SYSTEM_ALERT_WINDOW')) {
                androidManifest.manifest['uses-permission'].push({
                    $: { 'android:name': 'android.permission.SYSTEM_ALERT_WINDOW' },
                });
            }
            return config;
        });
    }
    return config;
};
exports.default = withPermissionKit;
