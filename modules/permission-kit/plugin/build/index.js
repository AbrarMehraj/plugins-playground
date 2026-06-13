"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
// ─── Permission Maps ───────────────────────────────────────────────────────────
/** Simple 1-to-1 mapping: plugin key → single Android manifest permission. */
const SIMPLE_PERMISSION_MAP = {
    batteryOptimization: 'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
    overlay: 'android.permission.SYSTEM_ALERT_WINDOW',
    usageStats: 'android.permission.PACKAGE_USAGE_STATS',
    exactAlarm: 'android.permission.SCHEDULE_EXACT_ALARM',
    useExactAlarm: 'android.permission.USE_EXACT_ALARM',
    fullScreenIntent: 'android.permission.USE_FULL_SCREEN_INTENT',
    dndAccess: 'android.permission.ACCESS_NOTIFICATION_POLICY',
    notifications: 'android.permission.POST_NOTIFICATIONS',
};
/** Location requires both fine and coarse (Google Play requirement). */
const LOCATION_PERMISSIONS = [
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
];
/**
 * Granular media permission mapping.
 * - 'media' (bare) = ALL media permissions (backward compatible)
 * - 'media:photo' = only photo-related permissions
 * - 'media:video' = only video-related permissions
 * - 'media:audio' = only audio-related permissions
 * - 'media:all' = MANAGE_EXTERNAL_STORAGE (full file manager access)
 *
 * Legacy READ/WRITE_EXTERNAL_STORAGE are shared across photo/video/audio for pre-API 33 devices.
 */
const MEDIA_BASE_PERMISSIONS = [
    'android.permission.READ_EXTERNAL_STORAGE',
    'android.permission.WRITE_EXTERNAL_STORAGE',
];
const MEDIA_TYPE_MAP = {
    photo: [
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
    ],
    video: [
        'android.permission.READ_MEDIA_VIDEO',
        'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
    ],
    audio: [
        'android.permission.READ_MEDIA_AUDIO',
    ],
    all: [
        'android.permission.MANAGE_EXTERNAL_STORAGE',
    ],
};
/** Full set of all media permissions (for backward-compatible bare 'media' key). */
const ALL_MEDIA_PERMISSIONS = [
    ...MEDIA_BASE_PERMISSIONS,
    ...new Set(Object.values(MEDIA_TYPE_MAP).reduce((acc, val) => acc.concat(val), [])),
];
// ─── Helpers ───────────────────────────────────────────────────────────────────
/** Safely adds a list of Android permissions, skipping any that already exist. */
function addPermissions(usesPermission, existingPermissions, permissionsToAdd) {
    for (const perm of permissionsToAdd) {
        if (!existingPermissions.includes(perm)) {
            usesPermission.push({ $: { 'android:name': perm } });
        }
    }
}
/**
 * Parses 'media', 'media:photo', 'media:video', 'media:audio', 'media:all'
 * from the permissions array and returns the Android permissions to inject.
 */
function resolveMediaPermissions(permissions) {
    // Check for bare 'media' (backward compatible — adds everything)
    if (permissions.includes('media')) {
        return ALL_MEDIA_PERMISSIONS;
    }
    // Check for granular 'media:photo', 'media:video', etc.
    const mediaTypes = permissions
        .filter((p) => p.startsWith('media:'))
        .map((p) => p.split(':')[1]);
    if (mediaTypes.length === 0)
        return [];
    // Collect the unique permissions needed for the requested types
    const perms = new Set(MEDIA_BASE_PERMISSIONS); // always include legacy
    for (const type of mediaTypes) {
        const typePerms = MEDIA_TYPE_MAP[type];
        if (typePerms) {
            typePerms.forEach((p) => perms.add(p));
        }
    }
    return [...perms];
}
/** Returns true if any media-related permission key is present. */
function hasMediaPermission(permissions) {
    return permissions.some((p) => p === 'media' || p.startsWith('media:'));
}
// ─── Plugin ────────────────────────────────────────────────────────────────────
const withPermissionKit = (config, props) => {
    var _a, _b, _c;
    const permissions = (props === null || props === void 0 ? void 0 : props.permissions) || [];
    const locationDescription = (_a = props === null || props === void 0 ? void 0 : props.locationDescription) !== null && _a !== void 0 ? _a : '$(PRODUCT_NAME) needs access to your location.';
    const photoDescription = (_b = props === null || props === void 0 ? void 0 : props.photoDescription) !== null && _b !== void 0 ? _b : '$(PRODUCT_NAME) needs access to your photos.';
    const appleMusicDescription = (_c = props === null || props === void 0 ? void 0 : props.appleMusicDescription) !== null && _c !== void 0 ? _c : '$(PRODUCT_NAME) needs access to your music.';
    // ─── Android Manifest permissions ─────────────────────────────────────────
    const hasAnyAndroidPermission = permissions.some((p) => p in SIMPLE_PERMISSION_MAP || p === 'location' || p === 'media' || p.startsWith('media:'));
    if (hasAnyAndroidPermission) {
        config = (0, config_plugins_1.withAndroidManifest)(config, (config) => {
            const androidManifest = config.modResults;
            if (!androidManifest.manifest['uses-permission']) {
                androidManifest.manifest['uses-permission'] = [];
            }
            const usesPermission = androidManifest.manifest['uses-permission'];
            const existingPermissions = usesPermission.map((p) => p.$['android:name']);
            // Simple 1-to-1 permissions
            for (const [key, androidPermission] of Object.entries(SIMPLE_PERMISSION_MAP)) {
                if (permissions.includes(key)) {
                    addPermissions(usesPermission, existingPermissions, [androidPermission]);
                }
            }
            // Location (1-to-many)
            if (permissions.includes('location')) {
                addPermissions(usesPermission, existingPermissions, LOCATION_PERMISSIONS);
            }
            // Media — supports both bare 'media' and granular 'media:photo', 'media:video', etc.
            const mediaPerms = resolveMediaPermissions(permissions);
            if (mediaPerms.length > 0) {
                addPermissions(usesPermission, existingPermissions, mediaPerms);
            }
            return config;
        });
    }
    // ─── iOS Info.plist ───────────────────────────────────────────────────────
    const needsMediaPlist = hasMediaPermission(permissions);
    if (permissions.includes('location') || needsMediaPlist) {
        config = (0, config_plugins_1.withInfoPlist)(config, (config) => {
            if (permissions.includes('location')) {
                config.modResults['NSLocationWhenInUseUsageDescription'] = locationDescription;
            }
            if (needsMediaPlist) {
                // Determine which iOS plist entries are needed
                const mediaTypes = permissions.includes('media')
                    ? ['photo', 'video', 'audio'] // bare 'media' = all types
                    : permissions.filter((p) => p.startsWith('media:')).map((p) => p.split(':')[1]);
                if (mediaTypes.includes('photo') || mediaTypes.includes('video')) {
                    config.modResults['NSPhotoLibraryUsageDescription'] = photoDescription;
                }
                if (mediaTypes.includes('audio')) {
                    config.modResults['NSAppleMusicUsageDescription'] = appleMusicDescription;
                }
            }
            return config;
        });
    }
    return config;
};
exports.default = withPermissionKit;
