import ExpoModulesCore

public class ExpoPermissionKitModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoPermissionKit")

    // iOS does not have Android-style battery optimization.
    // Low Power Mode is read-only and cannot be requested programmatically.
    // We return false to let the JS layer produce { status: 'unavailable' }.
    AsyncFunction("isBatteryOptimizationEnabled") { () -> Bool in
      return false
    }

    AsyncFunction("openBatteryOptimizationSettings") { () -> Void in
      // No-op on iOS — there is no equivalent settings screen.
    }
  }
}
