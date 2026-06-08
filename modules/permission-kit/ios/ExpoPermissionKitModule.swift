import ExpoModulesCore
import UserNotifications

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

    AsyncFunction("checkNotificationsStatus") { (promise: Promise) in
      UNUserNotificationCenter.current().getNotificationSettings { settings in
        let status = settings.authorizationStatus
        promise.resolve([
          "granted": status == .authorized,
          "canAskAgain": status == .notDetermined
        ])
      }
    }

    AsyncFunction("requestNotifications") { (promise: Promise) in
      UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
        promise.resolve([
          "granted": granted,
          "canAskAgain": false
        ])
      }
    }

    AsyncFunction("openNotificationSettings") { () -> Void in
      if let url = URL(string: UIApplication.openSettingsURLString) {
        DispatchQueue.main.async {
          UIApplication.shared.open(url)
        }
      }
    }
  }
}
