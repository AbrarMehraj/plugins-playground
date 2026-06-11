import ExpoModulesCore
import UserNotifications
import CoreLocation
import Photos
import PhotosUI
import MediaPlayer

// CLLocationManager must live on the main thread. We keep strong
// references here so the delegate isn't deallocated before it fires.
private var _locationManager: CLLocationManager?
private var _locationDelegate: (NSObject & CLLocationManagerDelegate)?

public class ExpoPermissionKitModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoPermissionKit")

    // iOS does not have Android-style battery optimization.
    AsyncFunction("isBatteryOptimizationEnabled") { () -> Bool in
      return false
    }

    AsyncFunction("openBatteryOptimizationSettings") { () -> Void in
      // No-op on iOS
    }

    // ── Notifications ────────────────────────────────────────────────────────

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
      UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
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

    // ── Location ─────────────────────────────────────────────────────────────

    AsyncFunction("checkLocationStatus") { () -> [String: Any] in
      let servicesEnabled = CLLocationManager.locationServicesEnabled()
      let status = CLLocationManager().authorizationStatus

      let granted: Bool
      let canAskAgain: Bool
      let restricted: Bool

      switch status {
      case .authorizedWhenInUse, .authorizedAlways:
        granted = true
        canAskAgain = false
        restricted = false
      case .denied:
        granted = false
        canAskAgain = false
        restricted = false
      case .restricted:
        granted = false
        canAskAgain = false
        restricted = true
      case .notDetermined:
        granted = false
        canAskAgain = true
        restricted = false
      @unknown default:
        granted = false
        canAskAgain = false
        restricted = false
      }

      return [
        "granted": granted,
        "canAskAgain": canAskAgain,
        "restricted": restricted,
        "servicesEnabled": servicesEnabled
      ]
    }

    AsyncFunction("requestLocation") { (timeoutMs: Int, promise: Promise) in
      // 1. Check system-level Location Services first
      guard CLLocationManager.locationServicesEnabled() else {
        promise.resolve([
          "status": "denied",
          "error": "LOCATION_SERVICES_DISABLED"
        ])
        return
      }

      // 2. Delegate handles the full lifecycle on the main thread
      DispatchQueue.main.async {
        let delegate = LocationDelegate(promise: promise, timeoutMs: timeoutMs)
        _locationDelegate = delegate
        _locationManager = CLLocationManager()
        _locationManager?.delegate = delegate
        _locationManager?.desiredAccuracy = kCLLocationAccuracyBest

        let status = _locationManager!.authorizationStatus

        switch status {
        case .notDetermined:
          // Trigger the native OS dialog
          _locationManager?.requestWhenInUseAuthorization()
          // The delegate will get called in locationManagerDidChangeAuthorization
        case .authorizedWhenInUse, .authorizedAlways:
          // Already granted — just fetch coordinates
          _locationManager?.requestLocation()
        case .denied:
          promise.resolve(["status": "denied", "canAskAgain": false])
          _locationManager = nil
          _locationDelegate = nil
        case .restricted:
          promise.resolve(["status": "restricted"])
          _locationManager = nil
          _locationDelegate = nil
        @unknown default:
          promise.resolve(["status": "denied", "canAskAgain": false])
          _locationManager = nil
          _locationDelegate = nil
        }
      }
    }

    AsyncFunction("requestLocationPermissionOnly") { (promise: Promise) in
      // Request permission only — no GPS fetch
      DispatchQueue.main.async {
        let manager = CLLocationManager()
        let status = manager.authorizationStatus

        switch status {
        case .authorizedWhenInUse, .authorizedAlways:
          promise.resolve(["status": "granted"])
        case .denied:
          promise.resolve(["status": "denied", "canAskAgain": false])
        case .restricted:
          promise.resolve(["status": "restricted"])
        case .notDetermined:
          // Need to request — use a one-shot delegate just for the dialog
          let delegate = PermissionOnlyDelegate(promise: promise)
          let newManager = CLLocationManager()
          newManager.delegate = delegate
          delegate.manager = newManager
          _locationDelegate = delegate
          _locationManager = newManager
          newManager.requestWhenInUseAuthorization()
        @unknown default:
          promise.resolve(["status": "denied", "canAskAgain": false])
        }
      }
    }

    AsyncFunction("showPermissionAlertAndOpenSettings") { (title: String, description: String, settingsType: String, promise: Promise) in
      DispatchQueue.main.async {
        guard let windowScene = UIApplication.shared.connectedScenes
          .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene,
          let rootVC = windowScene.windows.first?.rootViewController else {
          promise.resolve(nil)
          return
        }
        var topVC = rootVC
        while let presented = topVC.presentedViewController {
          topVC = presented
        }

        let alert = UIAlertController(title: title, message: description, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in
          promise.resolve(nil)
        })
        alert.addAction(UIAlertAction(title: "Open Settings", style: .default) { _ in
          // Explicitly dismiss the alert and wait for the completion
          // before opening the URL to avoid transition race conditions.
          topVC.dismiss(animated: true) {
            var urlString = UIApplication.openSettingsURLString
            if settingsType == "notifications" {
              if #available(iOS 16.0, *) {
                urlString = UIApplication.openNotificationSettingsURLString
              }
            }
            if let url = URL(string: urlString) {
              UIApplication.shared.open(url, options: [:], completionHandler: nil)
            }
            promise.resolve(nil)
          }
        })
        topVC.present(alert, animated: true)
      }
    }

    AsyncFunction("openLocationSettings") { () -> Void in
      // Opens app-specific Settings on iOS (there's no separate system Location page)
      if let url = URL(string: UIApplication.openSettingsURLString) {
        DispatchQueue.main.async {
          UIApplication.shared.open(url)
        }
      }
    }

    AsyncFunction("openAppLocationSettings") { () -> Void in
      // Same as openLocationSettings on iOS — both go to the app's Settings page
      if let url = URL(string: UIApplication.openSettingsURLString) {
        DispatchQueue.main.async {
          UIApplication.shared.open(url)
        }
      }
    }

    // ── Media ───────────────────────────────────────────────────────────────────

    AsyncFunction("checkMediaStatus") { (type: String, promise: Promise) in
      if type == "all" {
        promise.resolve(["status": "unavailable"])
        return
      }

      if type == "audio" {
        let status = MPMediaLibrary.authorizationStatus()
        switch status {
        case .authorized:
          promise.resolve(["status": "granted", "canAskAgain": false])
        case .denied:
          promise.resolve(["status": "denied", "canAskAgain": false])
        case .restricted:
          promise.resolve(["status": "restricted", "canAskAgain": false])
        case .notDetermined:
          promise.resolve(["status": "denied", "canAskAgain": true])
        @unknown default:
          promise.resolve(["status": "denied", "canAskAgain": false])
        }
        return
      }

      // photo or video
      if #available(iOS 14, *) {
        let status = PHPhotoLibrary.authorizationStatus(for: .readWrite)
        switch status {
        case .authorized:
          promise.resolve(["status": "granted", "canAskAgain": false])
        case .limited:
          promise.resolve(["status": "limited", "canAskAgain": false])
        case .denied:
          promise.resolve(["status": "denied", "canAskAgain": false])
        case .restricted:
          promise.resolve(["status": "restricted", "canAskAgain": false])
        case .notDetermined:
          promise.resolve(["status": "denied", "canAskAgain": true])
        @unknown default:
          promise.resolve(["status": "denied", "canAskAgain": false])
        }
      } else {
        let status = PHPhotoLibrary.authorizationStatus()
        switch status {
        case .authorized:
          promise.resolve(["status": "granted", "canAskAgain": false])
        case .denied:
          promise.resolve(["status": "denied", "canAskAgain": false])
        case .restricted:
          promise.resolve(["status": "restricted", "canAskAgain": false])
        case .notDetermined:
          promise.resolve(["status": "denied", "canAskAgain": true])
        default:
          promise.resolve(["status": "denied", "canAskAgain": false])
        }
      }
    }

    AsyncFunction("requestMedia") { (type: String, promise: Promise) in
      if type == "all" {
        promise.resolve(["status": "unavailable"])
        return
      }

      if type == "audio" {
        MPMediaLibrary.requestAuthorization { status in
          switch status {
          case .authorized:
            promise.resolve(["status": "granted", "canAskAgain": false])
          case .denied:
            promise.resolve(["status": "denied", "canAskAgain": false])
          case .restricted:
            promise.resolve(["status": "restricted", "canAskAgain": false])
          case .notDetermined:
            promise.resolve(["status": "denied", "canAskAgain": true])
          @unknown default:
            promise.resolve(["status": "denied", "canAskAgain": false])
          }
        }
        return
      }

      // photo or video
      if #available(iOS 14, *) {
        PHPhotoLibrary.requestAuthorization(for: .readWrite) { status in
          switch status {
          case .authorized:
            promise.resolve(["status": "granted", "canAskAgain": false])
          case .limited:
            promise.resolve(["status": "limited", "canAskAgain": false])
          case .denied:
            promise.resolve(["status": "denied", "canAskAgain": false])
          case .restricted:
            promise.resolve(["status": "restricted", "canAskAgain": false])
          case .notDetermined:
            promise.resolve(["status": "denied", "canAskAgain": true])
          @unknown default:
            promise.resolve(["status": "denied", "canAskAgain": false])
          }
        }
      } else {
        PHPhotoLibrary.requestAuthorization { status in
          switch status {
          case .authorized:
            promise.resolve(["status": "granted", "canAskAgain": false])
          case .denied:
            promise.resolve(["status": "denied", "canAskAgain": false])
          case .restricted:
            promise.resolve(["status": "restricted", "canAskAgain": false])
          case .notDetermined:
            promise.resolve(["status": "denied", "canAskAgain": true])
          default:
            promise.resolve(["status": "denied", "canAskAgain": false])
          }
        }
      }
    }

    AsyncFunction("openMediaSettings") { () -> Void in
      if let url = URL(string: UIApplication.openSettingsURLString) {
        DispatchQueue.main.async {
          UIApplication.shared.open(url)
        }
      }
    }

    AsyncFunction("openAllFilesSettings") { () -> Void in
      // No-op on iOS
    }

    AsyncFunction("presentLimitedLibraryPicker") { () -> Void in
      if #available(iOS 14, *) {
        DispatchQueue.main.async {
          guard let windowScene = UIApplication.shared.connectedScenes
            .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene,
            let rootVC = windowScene.windows.first?.rootViewController else { return }
          var topVC = rootVC
          while let presented = topVC.presentedViewController {
              topVC = presented
          }
          PHPhotoLibrary.shared().presentLimitedLibraryPicker(from: topVC)
        }
      }
    }
  }
}

// ── CLLocationManagerDelegate ─────────────────────────────────────────────────

private class LocationDelegate: NSObject, CLLocationManagerDelegate {
  private let promise: Promise
  private var settled = false
  private var timer: Timer?

  init(promise: Promise, timeoutMs: Int) {
    self.promise = promise
    super.init()
    // Start timeout timer
    let seconds = Double(timeoutMs) / 1000.0
    timer = Timer.scheduledTimer(withTimeInterval: seconds, repeats: false) { [weak self] _ in
      self?.resolve(["status": "granted", "error": "TIMEOUT"])
    }
  }

  // Called when the user responds to the permission dialog
  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    switch manager.authorizationStatus {
    case .authorizedWhenInUse, .authorizedAlways:
      // Permission just granted — now fetch
      manager.requestLocation()
    case .denied:
      resolve(["status": "denied", "canAskAgain": false])
    case .restricted:
      resolve(["status": "restricted"])
    case .notDetermined:
      break // waiting
    @unknown default:
      resolve(["status": "denied", "canAskAgain": false])
    }
  }

  // Location fetched successfully
  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let loc = locations.last else { return }
    resolve([
      "status": "granted",
      "latitude": loc.coordinate.latitude,
      "longitude": loc.coordinate.longitude,
      "accuracy": loc.horizontalAccuracy,
      "altitude": loc.altitude,
      "timestamp": loc.timestamp.timeIntervalSince1970 * 1000
    ])
  }

  // Location fetch failed
  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    let clError = error as? CLError
    if clError?.code == .denied {
      resolve(["status": "denied", "canAskAgain": false])
    } else {
      resolve(["status": "granted", "error": "LOCATION_UNAVAILABLE"])
    }
  }

  private func resolve(_ result: [String: Any]) {
    guard !settled else { return }
    settled = true
    timer?.invalidate()
    timer = nil
    _locationManager?.stopUpdatingLocation()
    _locationManager = nil
    _locationDelegate = nil
    promise.resolve(result)
  }
}

// ── PermissionOnlyDelegate ────────────────────────────────────────────────────
// A lightweight delegate used by requestLocationPermissionOnly — shows the
// OS dialog but never calls requestLocation() afterward.

private class PermissionOnlyDelegate: NSObject, CLLocationManagerDelegate {
  private let promise: Promise
  private var settled = false
  var manager: CLLocationManager?

  init(promise: Promise) {
    self.promise = promise
    super.init()
  }

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    switch manager.authorizationStatus {
    case .authorizedWhenInUse, .authorizedAlways:
      resolve(["status": "granted"])
    case .denied:
      resolve(["status": "denied", "canAskAgain": false])
    case .restricted:
      resolve(["status": "restricted"])
    case .notDetermined:
      break // still waiting for user to tap
    @unknown default:
      resolve(["status": "denied", "canAskAgain": false])
    }
  }

  private func resolve(_ result: [String: Any]) {
    guard !settled else { return }
    settled = true
    self.manager = nil
    _locationManager = nil
    _locationDelegate = nil
    promise.resolve(result)
  }
}
