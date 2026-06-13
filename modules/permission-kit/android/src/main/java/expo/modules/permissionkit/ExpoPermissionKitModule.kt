package expo.modules.permissionkit

import android.content.Intent
import android.location.Location
import android.location.LocationManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.os.Environment
import android.provider.Settings

import com.google.android.gms.common.api.ResolvableApiException
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.LocationSettingsRequest
import com.google.android.gms.location.Priority
import android.app.Activity
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedButton
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.setViewTreeLifecycleOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner
import androidx.lifecycle.setViewTreeViewModelStoreOwner

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoPermissionKitModule : Module() {

  private var pendingLocationPromise: expo.modules.kotlin.Promise? = null
  private var pendingLocationTimeoutMs: Int = 10000
  private var pendingLocationAccuracy: String = "balanced"
  private val LOCATION_SETTINGS_REQUEST_CODE = 9991

  private fun fetchCoordinates(timeoutMs: Int, accuracy: String, promise: expo.modules.kotlin.Promise) {
    val context = appContext.reactContext ?: return
    var settled = false
    val handler = android.os.Handler(android.os.Looper.getMainLooper())

    val timeoutRunnable = Runnable {
      if (!settled) {
        settled = true
        promise.resolve(mapOf("status" to "granted", "error" to "TIMEOUT"))
      }
    }
    handler.postDelayed(timeoutRunnable, timeoutMs.toLong())

    // Map JS accuracy string to Google Play Services priority
    val priority = when (accuracy) {
      "high" -> Priority.PRIORITY_HIGH_ACCURACY
      "low" -> Priority.PRIORITY_LOW_POWER
      else -> Priority.PRIORITY_BALANCED_POWER_ACCURACY
    }

    try {
      val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)
      fusedLocationClient.getCurrentLocation(priority, null)
        .addOnSuccessListener { location: Location? ->
          if (settled) return@addOnSuccessListener
          settled = true
          handler.removeCallbacks(timeoutRunnable)
          if (location != null) {
            promise.resolve(mapOf(
              "status" to "granted",
              "latitude" to location.latitude,
              "longitude" to location.longitude,
              "accuracy" to location.accuracy.toDouble(),
              "altitude" to location.altitude,
              "timestamp" to location.time.toDouble()
            ))
          } else {
            promise.resolve(mapOf("status" to "granted", "error" to "LOCATION_UNAVAILABLE"))
          }
        }
        .addOnFailureListener {
          if (settled) return@addOnFailureListener
          settled = true
          handler.removeCallbacks(timeoutRunnable)
          promise.resolve(mapOf("status" to "granted", "error" to "LOCATION_UNAVAILABLE"))
        }
    } catch (e: SecurityException) {
      settled = true
      handler.removeCallbacks(timeoutRunnable)
      promise.resolve(mapOf("status" to "denied", "canAskAgain" to false))
    }
  }
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

    OnActivityResult { _, payload ->
      if (payload.requestCode == LOCATION_SETTINGS_REQUEST_CODE) {
        val promise = pendingLocationPromise
        val timeoutMs = pendingLocationTimeoutMs
        val accuracy = pendingLocationAccuracy
        pendingLocationPromise = null
        if (promise == null) return@OnActivityResult

        if (payload.resultCode == Activity.RESULT_OK) {
          fetchCoordinates(timeoutMs, accuracy, promise)
        } else {
          promise.resolve(mapOf("status" to "denied", "error" to "LOCATION_SERVICES_DISABLED"))
        }
      }
    }

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

    AsyncFunction("isUsageStatsPermissionEnabled") {
      val context = appContext.reactContext
        ?: throw Exception("Context unavailable")

      val appOpsManager = context.getSystemService(android.content.Context.APP_OPS_SERVICE) as android.app.AppOpsManager
      val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        appOpsManager.unsafeCheckOpNoThrow(android.app.AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.packageName)
      } else {
        @Suppress("DEPRECATION")
        appOpsManager.checkOpNoThrow(android.app.AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.packageName)
      }
      return@AsyncFunction mode == android.app.AppOpsManager.MODE_ALLOWED
    }

    AsyncFunction("openUsageStatsSettings") {
      val context = appContext.reactContext
        ?: throw Exception("Context unavailable")

      val packageName = context.packageName

      if (!hasManifestPermission(android.Manifest.permission.PACKAGE_USAGE_STATS)) {
        throw Exception("MISSING_PERMISSION: Add 'usageStats' to your app.json plugin")
      }

      val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
          intent.data = Uri.parse("package:$packageName")
      }
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
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

    AsyncFunction("isFullScreenIntentPermissionEnabled") {
      val context = appContext.reactContext
        ?: throw Exception("Context unavailable")

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        val notificationManager = context.getSystemService(android.content.Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
        return@AsyncFunction notificationManager.canUseFullScreenIntent()
      }
      return@AsyncFunction true
    }

    AsyncFunction("openFullScreenIntentSettings") {
      val context = appContext.reactContext
        ?: throw Exception("Context unavailable")

      val packageName = context.packageName

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        if (!hasManifestPermission(android.Manifest.permission.USE_FULL_SCREEN_INTENT)) {
          throw Exception("MISSING_PERMISSION: Add 'fullScreenIntent' to your app.json plugin")
        }

        val intent = Intent(
          Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
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

        AsyncFunction("requestLocation") { timeoutMs: Int, accuracy: String, promise: expo.modules.kotlin.Promise ->
      val context = appContext.reactContext ?: throw Exception("Context unavailable")
      
      // 1. Request runtime permission first
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

          // 2. Permission granted — check if Location Services are enabled
          val locationManager = context.getSystemService(android.content.Context.LOCATION_SERVICE) as LocationManager
          val servicesEnabled = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            locationManager.isLocationEnabled
          } else {
            locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
              locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
          }

          if (servicesEnabled) {
            // Already enabled, fetch directly
            fetchCoordinates(timeoutMs, accuracy, promise)
          } else {
            // 3. Location disabled — use Google Play Services to prompt the user
            val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 1000).build()
            val builder = LocationSettingsRequest.Builder().addLocationRequest(locationRequest)
            val client = LocationServices.getSettingsClient(context)
            
            client.checkLocationSettings(builder.build())
              .addOnSuccessListener {
                fetchCoordinates(timeoutMs, accuracy, promise)
              }
              .addOnFailureListener { exception ->
                if (exception is ResolvableApiException) {
                  try {
                    val activity = appContext.activityProvider?.currentActivity
                    if (activity != null) {
                      pendingLocationPromise = promise
                      pendingLocationTimeoutMs = timeoutMs
                      pendingLocationAccuracy = accuracy
                      activity.startIntentSenderForResult(
                        exception.resolution.intentSender,
                        LOCATION_SETTINGS_REQUEST_CODE,
                        null, 0, 0, 0
                      )
                    } else {
                      promise.resolve(mapOf("status" to "denied", "error" to "LOCATION_SERVICES_DISABLED"))
                    }
                  } catch (sendEx: Exception) {
                    promise.resolve(mapOf("status" to "denied", "error" to "LOCATION_SERVICES_DISABLED"))
                  }
                } else {
                  promise.resolve(mapOf("status" to "denied", "error" to "LOCATION_SERVICES_DISABLED"))
                }
              }
          }
        },
        android.Manifest.permission.ACCESS_FINE_LOCATION,
        android.Manifest.permission.ACCESS_COARSE_LOCATION
      )
    }

    AsyncFunction("requestLocationPermissionOnly") { promise: expo.modules.kotlin.Promise ->
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

          if (granted) {
            promise.resolve(mapOf("status" to "granted"))
          } else {
            promise.resolve(mapOf("status" to "denied", "canAskAgain" to canAskAgain))
          }
        },
        android.Manifest.permission.ACCESS_FINE_LOCATION,
        android.Manifest.permission.ACCESS_COARSE_LOCATION
      )
    }

    AsyncFunction("showPermissionAlertAndOpenSettings") { title: String, description: String, settingsType: String, promise: expo.modules.kotlin.Promise ->
      val context = appContext.reactContext ?: run {
        promise.resolve(null)
        return@AsyncFunction
      }
      val activity = appContext.activityProvider?.currentActivity ?: run {
        promise.resolve(null)
        return@AsyncFunction
      }

      android.os.Handler(android.os.Looper.getMainLooper()).post {
        var promiseResolved = false

        val dialog = android.app.Dialog(activity)
        dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)

        val resolveSafely = {
          if (!promiseResolved) {
            promiseResolved = true
            promise.resolve(null)
          }
        }

        dialog.setOnDismissListener { resolveSafely() }

        val composeView = ComposeView(activity).apply {
          setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
          setContent {
            MaterialTheme {
              Surface(
                shape = RoundedCornerShape(28.dp),
                tonalElevation = 6.dp,
                color = MaterialTheme.colorScheme.surface
              ) {
                Column(modifier = Modifier.padding(24.dp)) {
                  Text(
                    text = title,
                    style = MaterialTheme.typography.headlineSmall,
                    color = MaterialTheme.colorScheme.onSurface
                  )
                  Spacer(modifier = Modifier.height(16.dp))
                  Text(
                    text = description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                  )
                  Spacer(modifier = Modifier.height(24.dp))
                  Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                  ) {
                    OutlinedButton(onClick = { dialog.dismiss() }) {
                      Text("Cancel")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                      onClick = {
                        val intent = if (settingsType == "notifications" && android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                          Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                            putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, context.packageName)
                          }
                        } else {
                          Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                            data = android.net.Uri.fromParts("package", context.packageName, null)
                          }
                        }
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        context.startActivity(intent)
                        dialog.dismiss()
                      }
                    ) {
                      Text("Open Settings")
                    }
                  }
                }
              }
            }
          }
        }

        // Ensure lifecycle owners are set for Compose
        val lifecycleOwner = activity as? androidx.lifecycle.LifecycleOwner
        val savedStateRegistryOwner = activity as? androidx.savedstate.SavedStateRegistryOwner
        val viewModelStoreOwner = activity as? androidx.lifecycle.ViewModelStoreOwner

        composeView.setViewTreeLifecycleOwner(lifecycleOwner)
        composeView.setViewTreeSavedStateRegistryOwner(savedStateRegistryOwner)
        composeView.setViewTreeViewModelStoreOwner(viewModelStoreOwner)

        dialog.setContentView(composeView)
        dialog.show()
      }
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

    // ── Media ───────────────────────────────────────────────────────────────────

    AsyncFunction("checkMediaStatus") { type: String, promise: expo.modules.kotlin.Promise ->
      val permissionsManager = appContext.permissions
      val context = appContext.reactContext
      if (context == null || permissionsManager == null) {
        promise.resolve(mapOf("status" to "unavailable"))
        return@AsyncFunction
      }

      if (type == "all") {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
          promise.resolve(mapOf(
            "status" to if (Environment.isExternalStorageManager()) "granted" else "denied",
            "canAskAgain" to true
          ))
        } else {
          permissionsManager.getPermissions(
            { response ->
              val readStatus = response[android.Manifest.permission.READ_EXTERNAL_STORAGE]
              promise.resolve(mapOf(
                "status" to if (readStatus?.status == expo.modules.interfaces.permissions.PermissionsStatus.GRANTED) "granted" else "denied",
                "canAskAgain" to (readStatus?.canAskAgain ?: true)
              ))
            },
            android.Manifest.permission.READ_EXTERNAL_STORAGE
          )
        }
        return@AsyncFunction
      }

      val permissionsToRequest = getMediaPermissionsForType(type)
      if (permissionsToRequest.isEmpty()) {
        promise.resolve(mapOf("status" to "unavailable"))
        return@AsyncFunction
      }

      permissionsManager.getPermissions(
        { response ->
          val result = evaluateMediaPermissionsResponse(type, response)
          promise.resolve(result)
        },
        *permissionsToRequest.toTypedArray()
      )
    }

    AsyncFunction("requestMedia") { type: String, promise: expo.modules.kotlin.Promise ->
      val permissionsManager = appContext.permissions
      val context = appContext.reactContext
      if (context == null || permissionsManager == null) {
        promise.resolve(mapOf("status" to "unavailable"))
        return@AsyncFunction
      }

      if (type == "all") {
        promise.resolve(mapOf("status" to "denied", "canAskAgain" to true))
        return@AsyncFunction
      }

      val permissionsToRequest = getMediaPermissionsForType(type)
      if (permissionsToRequest.isEmpty()) {
        promise.resolve(mapOf("status" to "unavailable"))
        return@AsyncFunction
      }

      permissionsManager.askForPermissions(
        { response ->
          val result = evaluateMediaPermissionsResponse(type, response)
          promise.resolve(result)
        },
        *permissionsToRequest.toTypedArray()
      )
    }

    AsyncFunction("openMediaSettings") {
      val context = appContext.reactContext ?: throw Exception("Context unavailable")
      val intent = Intent(
        Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
        Uri.parse("package:${context.packageName}")
      ).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }

    AsyncFunction("openAllFilesSettings") {
      val context = appContext.reactContext ?: throw Exception("Context unavailable")
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION).apply {
          data = Uri.parse("package:${context.packageName}")
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
      } else {
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

  private fun getMediaPermissionsForType(type: String): List<String> {
    val perms = mutableListOf<String>()
    when (type) {
      "photo", "video" -> {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) { // API 34
          perms.add("android.permission.READ_MEDIA_VISUAL_USER_SELECTED")
          perms.add(if (type == "photo") "android.permission.READ_MEDIA_IMAGES" else "android.permission.READ_MEDIA_VIDEO")
        } else if (Build.VERSION.SDK_INT == Build.VERSION_CODES.TIRAMISU) { // API 33
          perms.add(if (type == "photo") "android.permission.READ_MEDIA_IMAGES" else "android.permission.READ_MEDIA_VIDEO")
        } else {
          perms.add(android.Manifest.permission.READ_EXTERNAL_STORAGE)
        }
      }
      "audio" -> {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          perms.add("android.permission.READ_MEDIA_AUDIO")
        } else {
          perms.add(android.Manifest.permission.READ_EXTERNAL_STORAGE)
        }
      }
    }
    return perms
  }

  private fun evaluateMediaPermissionsResponse(
    type: String, 
    response: Map<String, expo.modules.interfaces.permissions.PermissionsResponse>
  ): Map<String, Any> {
    var allGranted = true
    var isLimited = false
    var canAskAgain = true

    for ((perm, permResponse) in response) {
      android.util.Log.d("PermissionKit", "Perm: $perm, status: ${permResponse.status}, canAskAgain: ${permResponse.canAskAgain}")
      val granted = permResponse.status == expo.modules.interfaces.permissions.PermissionsStatus.GRANTED
      if (!granted) {
        if (!permResponse.canAskAgain) {
          canAskAgain = false
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE &&
            (perm == "android.permission.READ_MEDIA_IMAGES" || perm == "android.permission.READ_MEDIA_VIDEO")) {
          val userSelected = response["android.permission.READ_MEDIA_VISUAL_USER_SELECTED"]
          if (userSelected?.status == expo.modules.interfaces.permissions.PermissionsStatus.GRANTED) {
            isLimited = true
            allGranted = false
            continue
          }
        }
        allGranted = false
      }
    }

    return if (allGranted) {
      mapOf("status" to "granted")
    } else if (isLimited) {
      mapOf("status" to "limited")
    } else {
      mapOf("status" to "denied", "canAskAgain" to canAskAgain)
    }
  }
}
