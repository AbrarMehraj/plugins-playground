package expo.modules.permissionkit

import android.content.Intent
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoPermissionKitModule : Module() {
  private fun hasManifestPermission(permission: String): Boolean {
    val context = appContext.reactContext ?: return false
    return try {
      val packageInfo = context.packageManager.getPackageInfo(context.packageName, android.content.pm.PackageManager.GET_PERMISSIONS)
      packageInfo.requestedPermissions?.contains(permission) == true
    } catch (e: Exception) {
      false
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoPermissionKit")

    AsyncFunction("isBatteryOptimizationEnabled") {
      val context = appContext.reactContext
        ?: throw Exception("Context unavailable")

      val powerManager =
        context.getSystemService(android.content.Context.POWER_SERVICE)
          as PowerManager

      val packageName = context.packageName

      val ignoring =
        powerManager.isIgnoringBatteryOptimizations(packageName)

      return@AsyncFunction ignoring
    }

    AsyncFunction("openBatteryOptimizationSettings") {
      val context = appContext.reactContext
        ?: throw Exception("Context unavailable")

      val packageName = context.packageName

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        if (!hasManifestPermission(android.Manifest.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)) {
          throw Exception("MISSING_PERMISSION: Add batteryOptimization to your app.json plugin")
        }

        val intent = Intent(
          Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
          Uri.parse("package:$packageName")
        )

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    }

    AsyncFunction("isOverlayPermissionEnabled") {
      val context = appContext.reactContext
        ?: throw Exception("Context unavailable")

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        return@AsyncFunction Settings.canDrawOverlays(context)
      }
      return@AsyncFunction true
    }

    AsyncFunction("openOverlayPermissionSettings") {
      val context = appContext.reactContext
        ?: throw Exception("Context unavailable")

      val packageName = context.packageName

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        if (!hasManifestPermission(android.Manifest.permission.SYSTEM_ALERT_WINDOW)) {
          throw Exception("MISSING_PERMISSION: Add 'overlay' to your app.json plugin")
        }

        val intent = Intent(
          Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:$packageName")
        )

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    }

    AsyncFunction("isExactAlarmPermissionEnabled") {
      val context = appContext.reactContext
        ?: throw Exception("Context unavailable")

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val alarmManager = context.getSystemService(android.content.Context.ALARM_SERVICE) as android.app.AlarmManager
        return@AsyncFunction alarmManager.canScheduleExactAlarms()
      }
      return@AsyncFunction true
    }

    AsyncFunction("openExactAlarmSettings") {
      val context = appContext.reactContext
        ?: throw Exception("Context unavailable")

      val packageName = context.packageName

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        if (!hasManifestPermission(android.Manifest.permission.SCHEDULE_EXACT_ALARM)) {
          throw Exception("MISSING_PERMISSION: Add 'exactAlarm' to your app.json plugin")
        }

        val intent = Intent(
          Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
          Uri.parse("package:$packageName")
        )

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    }

    AsyncFunction("isAccessibilityPermissionEnabled") { serviceName: String ->
      val context = appContext.reactContext
        ?: throw Exception("Context unavailable")

      val enabledServicesSetting = Settings.Secure.getString(
        context.contentResolver,
        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
      ) ?: return@AsyncFunction false

      val pkg = context.packageName
      val cls = if (serviceName.startsWith(".")) pkg + serviceName else serviceName
      val myServiceComponent = android.content.ComponentName(pkg, cls)
      
      val colonSplitter = android.text.TextUtils.SimpleStringSplitter(':')
      colonSplitter.setString(enabledServicesSetting)

      while (colonSplitter.hasNext()) {
        val componentNameString = colonSplitter.next()
        val enabledService = android.content.ComponentName.unflattenFromString(componentNameString)
        if (enabledService != null && enabledService == myServiceComponent) {
          return@AsyncFunction true
        }
      }
      return@AsyncFunction false
    }

    AsyncFunction("openAccessibilitySettings") {
      val context = appContext.reactContext
        ?: throw Exception("Context unavailable")

      val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    AsyncFunction("isDndAccessPermissionEnabled") {
      val context = appContext.reactContext
        ?: throw Exception("Context unavailable")

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val notificationManager = context.getSystemService(android.content.Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
        return@AsyncFunction notificationManager.isNotificationPolicyAccessGranted
      }
      return@AsyncFunction true
    }

    AsyncFunction("openDndAccessSettings") {
      val context = appContext.reactContext
        ?: throw Exception("Context unavailable")

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        if (!hasManifestPermission(android.Manifest.permission.ACCESS_NOTIFICATION_POLICY)) {
          throw Exception("MISSING_PERMISSION: Add 'dndAccess' to your app.json plugin")
        }

        val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    }

    AsyncFunction("checkNotificationsStatus") { promise: expo.modules.kotlin.Promise ->
      val context = appContext.reactContext ?: throw Exception("Context unavailable")
      val notificationManager = androidx.core.app.NotificationManagerCompat.from(context)
      val granted = notificationManager.areNotificationsEnabled()

      if (Build.VERSION.SDK_INT >= 33) {
        val permissionsManager = appContext.permissions
        if (permissionsManager != null) {
          permissionsManager.getPermissions(
            { response ->
              val perm = response[android.Manifest.permission.POST_NOTIFICATIONS]
              promise.resolve(mapOf(
                "granted" to granted,
                "canAskAgain" to (perm?.canAskAgain ?: true)
              ))
            },
            android.Manifest.permission.POST_NOTIFICATIONS
          )
          return@AsyncFunction
        }
      }
      promise.resolve(mapOf("granted" to granted, "canAskAgain" to !granted))
    }

    AsyncFunction("requestNotifications") { promise: expo.modules.kotlin.Promise ->
      val context = appContext.reactContext ?: throw Exception("Context unavailable")

      if (Build.VERSION.SDK_INT >= 33) { // Build.VERSION_CODES.TIRAMISU
        val permissionsManager = appContext.permissions
        if (permissionsManager == null) {
          promise.reject("E_NO_PERMISSIONS", "Permissions module is null", null)
          return@AsyncFunction
        }

        permissionsManager.askForPermissions(
          { response ->
            val perm = response[android.Manifest.permission.POST_NOTIFICATIONS]
            val granted = perm?.status == expo.modules.interfaces.permissions.PermissionsStatus.GRANTED
            promise.resolve(mapOf(
              "granted" to granted,
              "canAskAgain" to (perm?.canAskAgain ?: true)
            ))
          },
          android.Manifest.permission.POST_NOTIFICATIONS
        )
      } else {
        val notificationManager = androidx.core.app.NotificationManagerCompat.from(context)
        val granted = notificationManager.areNotificationsEnabled()
        promise.resolve(mapOf("granted" to granted, "canAskAgain" to !granted))
      }
    }

    AsyncFunction("openNotificationSettings") {
      val context = appContext.reactContext
        ?: throw Exception("Context unavailable")

      val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
        putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }

    // ── Location ────────────────────────────────────────────────────────────────

    AsyncFunction("checkLocationStatus") { promise: expo.modules.kotlin.Promise ->
      val context = appContext.reactContext ?: throw Exception("Context unavailable")
      val locationManager = context.getSystemService(android.content.Context.LOCATION_SERVICE) as LocationManager
      val servicesEnabled = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        locationManager.isLocationEnabled
      } else {
        locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
          locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
      }

      val permissionsManager = appContext.permissions
      if (permissionsManager == null) {
        promise.resolve(mapOf(
          "granted" to false,
          "canAskAgain" to true,
          "restricted" to false,
          "servicesEnabled" to servicesEnabled
        ))
        return@AsyncFunction
      }

      permissionsManager.getPermissions(
        { response ->
          val finePerm = response[android.Manifest.permission.ACCESS_FINE_LOCATION]
          val coarsePerm = response[android.Manifest.permission.ACCESS_COARSE_LOCATION]
          val granted = finePerm?.status == expo.modules.interfaces.permissions.PermissionsStatus.GRANTED ||
            coarsePerm?.status == expo.modules.interfaces.permissions.PermissionsStatus.GRANTED
          val canAskAgain = finePerm?.canAskAgain ?: true
          promise.resolve(mapOf(
            "granted" to granted,
            "canAskAgain" to canAskAgain,
            "restricted" to false,
            "servicesEnabled" to servicesEnabled
          ))
        },
        android.Manifest.permission.ACCESS_FINE_LOCATION,
        android.Manifest.permission.ACCESS_COARSE_LOCATION
      )
    }

    AsyncFunction("requestLocation") { timeoutMs: Int, promise: expo.modules.kotlin.Promise ->
      val context = appContext.reactContext ?: throw Exception("Context unavailable")
      val locationManager = context.getSystemService(android.content.Context.LOCATION_SERVICE) as LocationManager

      // 1. Check system-level Location Services
      val servicesEnabled = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        locationManager.isLocationEnabled
      } else {
        locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
          locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
      }

      if (!servicesEnabled) {
        promise.resolve(mapOf("status" to "denied", "error" to "LOCATION_SERVICES_DISABLED"))
        return@AsyncFunction
      }

      // 2. Request runtime permission
      val permissionsManager = appContext.permissions
      if (permissionsManager == null) {
        promise.reject("E_NO_PERMISSIONS", "Permissions module is null", null)
        return@AsyncFunction
      }

      permissionsManager.askForPermissions(
        { response ->
          val finePerm = response[android.Manifest.permission.ACCESS_FINE_LOCATION]
          val coarsePerm = response[android.Manifest.permission.ACCESS_COARSE_LOCATION]
          val granted = finePerm?.status == expo.modules.interfaces.permissions.PermissionsStatus.GRANTED ||
            coarsePerm?.status == expo.modules.interfaces.permissions.PermissionsStatus.GRANTED
          val canAskAgain = finePerm?.canAskAgain ?: true

          if (!granted) {
            promise.resolve(mapOf("status" to "denied", "canAskAgain" to canAskAgain))
            return@askForPermissions
          }

          // 3. Permission granted — fetch coordinates
          var settled = false
          val handler = android.os.Handler(android.os.Looper.getMainLooper())

          // Timeout runnable
          val timeoutRunnable = Runnable {
            if (!settled) {
              settled = true
              locationManager.removeUpdates(object : LocationListener {
                override fun onLocationChanged(l: Location) {}
              })
              promise.resolve(mapOf("status" to "granted", "error" to "TIMEOUT"))
            }
          }
          handler.postDelayed(timeoutRunnable, timeoutMs.toLong())

          val listener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
              if (settled) return
              settled = true
              handler.removeCallbacks(timeoutRunnable)
              locationManager.removeUpdates(this)
              promise.resolve(mapOf(
                "status" to "granted",
                "latitude" to location.latitude,
                "longitude" to location.longitude,
                "accuracy" to location.accuracy.toDouble(),
                "altitude" to location.altitude,
                "timestamp" to location.time.toDouble()
              ))
            }

            override fun onProviderDisabled(provider: String) {
              if (settled) return
              settled = true
              handler.removeCallbacks(timeoutRunnable)
              locationManager.removeUpdates(this)
              promise.resolve(mapOf("status" to "granted", "error" to "LOCATION_UNAVAILABLE"))
            }

            @Deprecated("Deprecated in Java")
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
          }

          // Try GPS first, fall back to network
          val provider = when {
            locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) -> LocationManager.GPS_PROVIDER
            locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER) -> LocationManager.NETWORK_PROVIDER
            else -> null
          }

          if (provider == null) {
            settled = true
            handler.removeCallbacks(timeoutRunnable)
            promise.resolve(mapOf("status" to "granted", "error" to "LOCATION_UNAVAILABLE"))
            return@askForPermissions
          }

          try {
            handler.post {
              locationManager.requestLocationUpdates(provider, 0L, 0f, listener)
            }
          } catch (e: SecurityException) {
            settled = true
            handler.removeCallbacks(timeoutRunnable)
            promise.resolve(mapOf("status" to "denied", "canAskAgain" to false))
          }
        },
        android.Manifest.permission.ACCESS_FINE_LOCATION,
        android.Manifest.permission.ACCESS_COARSE_LOCATION
      )
    }

    AsyncFunction("openLocationSettings") {
      // System-level Location Services toggle (for when GPS is OFF globally)
      val context = appContext.reactContext ?: throw Exception("Context unavailable")
      val intent = Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }

    AsyncFunction("openAppLocationSettings") {
      // App-specific Location permission (for when our app was permanently denied)
      val context = appContext.reactContext ?: throw Exception("Context unavailable")
      val intent = Intent(
        Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
        Uri.parse("package:${context.packageName}")
      ).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }
  }
}
