package expo.modules.permissionkit

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoPermissionKitModule : Module() {
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
        val intent = Intent(
          Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
          Uri.parse("package:$packageName")
        )

        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    }
  }
}
