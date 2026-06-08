package expo.modules.permissionkit

import android.content.Intent
import android.net.Uri
import android.os.Build
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
  }
}
