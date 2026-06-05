import { registerWebModule, NativeModule } from 'expo';

// ExpoPermissionKitModule is not available on the web platform.
class ExpoPermissionKitModule extends NativeModule<{}> {}

export default registerWebModule(ExpoPermissionKitModule, 'ExpoPermissionKitModule');
