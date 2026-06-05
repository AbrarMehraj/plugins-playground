import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoPermissionKitModule extends NativeModule<{}> {}

export default requireNativeModule<ExpoPermissionKitModule>('ExpoPermissionKit');
