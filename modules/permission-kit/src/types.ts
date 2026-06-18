export type PermissionStatus =
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'unavailable';

export interface PermissionResult {
  status: PermissionStatus;
}

export type AndroidSettingsResult = { status: 'granted' | 'denied' | 'unavailable' };

export interface AccessibilityOptions {
  androidServicePath: string;
}

export interface NotificationOptions extends BaseAlertOptions {}

export type LocationPermissionStatus =
  | { status: 'granted' }
  | { status: 'denied'; canAskAgain: boolean; error?: 'LOCATION_SERVICES_DISABLED' }
  | { status: 'restricted' }
  | { status: 'unavailable' };

export type LocationResult =
  | { status: 'granted'; latitude: number; longitude: number; accuracy: number; altitude: number; timestamp: number }
  | { status: 'granted'; error: 'TIMEOUT' | 'LOCATION_UNAVAILABLE' }
  | { status: 'denied'; canAskAgain?: boolean; error?: 'LOCATION_SERVICES_DISABLED' }
  | { status: 'restricted' }
  | { status: 'unavailable' };

export type LocationAccuracy = 'high' | 'balanced' | 'low';

export interface LocationOptions extends BaseAlertOptions {
  /** GPS timeout in milliseconds. Default: 10000ms */
  timeout?: number;
  /**
   * Location accuracy level. Default: 'balanced'.
   * - 'high': GPS-level precision (~5m). Slower, uses more battery.
   * - 'balanced': Wi-Fi/Cell tower precision (~100m). Fast, battery-friendly.
   * - 'low': City-level precision (~1km). Fastest, minimal battery.
   */
  accuracy?: LocationAccuracy;
  /**
   * If false, only requests the permission without fetching GPS coordinates.
   * Resolves with { status: 'granted' } immediately after permission is granted.
   * Default: true
   */
  fetchCoordinates?: boolean;
  /** If true, automatically shows native UI messages (Toast on Android, Alert on iOS) for common location errors like timeout or services disabled. Default: true */
  showErrorAlerts?: boolean;
  /** Custom messages to display when showErrorAlerts is true. */
  errorMessages?: {
    servicesDisabled?: string;
    timeout?: string;
    unavailable?: string;
  };
}

export interface BaseAlertOptions {
  /** If true, shows a native alert dialog when permission is permanently denied. Default: true */
  showAlert?: boolean;
  /** Custom title for the native alert dialog. */
  alertTitle?: string;
  /** Custom description for the native alert dialog. */
  alertDescription?: string;
}

export type MediaType = 'photo' | 'video' | 'audio' | 'all';

export interface MediaOptions extends BaseAlertOptions {
  type: MediaType;
  requestMore?: boolean;
}

export type MediaStatus =
  | 'granted'
  | 'limited'
  | 'denied'
  | 'restricted'
  | 'unavailable';

export interface MediaResult {
  status: MediaStatus;
  canAskAgain?: boolean;
}
