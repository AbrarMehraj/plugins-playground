"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withPermissionKit = (config, props) => {
    var _a, _b, _c;
    const permissions = (props === null || props === void 0 ? void 0 : props.permissions) || [];
    const locationDescription = (_a = props === null || props === void 0 ? void 0 : props.locationDescription) !== null && _a !== void 0 ? _a : '$(PRODUCT_NAME) needs access to your location.';
    const photoDescription = (_b = props === null || props === void 0 ? void 0 : props.photoDescription) !== null && _b !== void 0 ? _b : '$(PRODUCT_NAME) needs access to your photos.';
    const appleMusicDescription = (_c = props === null || props === void 0 ? void 0 : props.appleMusicDescription) !== null && _c !== void 0 ? _c : '$(PRODUCT_NAME) needs access to your music.';
    // ─── Android Manifest permissions ───────────────────────────────────────────
    if (permissions.includes('batteryOptimization') ||
        permissions.includes('overlay') ||
        permissions.includes('exactAlarm') ||
        permissions.includes('fullScreenIntent') ||
        permissions.includes('dndAccess') ||
        permissions.includes('notifications') ||
        permissions.includes('location') ||
        permissions.includes('media')) {
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
            if (permissions.includes('exactAlarm') &&
                !existingPermissions.includes('android.permission.SCHEDULE_EXACT_ALARM')) {
                androidManifest.manifest['uses-permission'].push({
                    $: { 'android:name': 'android.permission.SCHEDULE_EXACT_ALARM' },
                });
            }
            if (permissions.includes('fullScreenIntent') &&
                !existingPermissions.includes('android.permission.USE_FULL_SCREEN_INTENT')) {
                androidManifest.manifest['uses-permission'].push({
                    $: { 'android:name': 'android.permission.USE_FULL_SCREEN_INTENT' },
                });
            }
            if (permissions.includes('dndAccess') &&
                !existingPermissions.includes('android.permission.ACCESS_NOTIFICATION_POLICY')) {
                androidManifest.manifest['uses-permission'].push({
                    $: { 'android:name': 'android.permission.ACCESS_NOTIFICATION_POLICY' },
                });
            }
            if (permissions.includes('notifications') &&
                !existingPermissions.includes('android.permission.POST_NOTIFICATIONS')) {
                androidManifest.manifest['uses-permission'].push({
                    $: { 'android:name': 'android.permission.POST_NOTIFICATIONS' },
                });
            }
            if (permissions.includes('location')) {
                if (!existingPermissions.includes('android.permission.ACCESS_FINE_LOCATION')) {
                    androidManifest.manifest['uses-permission'].push({
                        $: { 'android:name': 'android.permission.ACCESS_FINE_LOCATION' },
                    });
                }
                // Google Play requires ACCESS_COARSE_LOCATION alongside ACCESS_FINE_LOCATION
                if (!existingPermissions.includes('android.permission.ACCESS_COARSE_LOCATION')) {
                    androidManifest.manifest['uses-permission'].push({
                        $: { 'android:name': 'android.permission.ACCESS_COARSE_LOCATION' },
                    });
                }
            }
            if (permissions.includes('media')) {
                const mediaPerms = [
                    'android.permission.READ_EXTERNAL_STORAGE',
                    'android.permission.WRITE_EXTERNAL_STORAGE',
                    'android.permission.READ_MEDIA_IMAGES',
                    'android.permission.READ_MEDIA_VIDEO',
                    'android.permission.READ_MEDIA_AUDIO',
                    'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
                    'android.permission.MANAGE_EXTERNAL_STORAGE'
                ];
                for (const p of mediaPerms) {
                    if (!existingPermissions.includes(p)) {
                        androidManifest.manifest['uses-permission'].push({
                            $: { 'android:name': p },
                        });
                    }
                }
            }
            return config;
        });
    }
    // ─── iOS Info.plist ──────────────────────────────────────────────────────────
    if (permissions.includes('location') || permissions.includes('media')) {
        config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
            if (permissions.includes('location')) {
                config.modResults['NSLocationWhenInUseUsageDescription'] = locationDescription;
            }
            if (permissions.includes('media')) {
                config.modResults['NSPhotoLibraryUsageDescription'] = photoDescription;
                config.modResults['NSAppleMusicUsageDescription'] = appleMusicDescription;
            }
            return config;
        });
    }
    return config;
};
exports.default = withPermissionKit;
