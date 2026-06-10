export type PermissionStatus =
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'unavailable';

export interface PermissionResult {
  status: PermissionStatus;
}

export type MediaType = 'photo' | 'video' | 'audio' | 'all';

export type MediaOptions = {
  type: MediaType;
  requestMore?: boolean;
};

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
