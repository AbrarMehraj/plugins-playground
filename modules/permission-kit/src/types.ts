export type PermissionStatus =
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'unavailable';

export interface PermissionResult {
  status: PermissionStatus;
}
