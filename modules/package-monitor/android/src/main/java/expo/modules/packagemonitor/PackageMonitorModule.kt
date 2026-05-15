package expo.modules.packagemonitor

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * PackageMonitorModule - watches for app installs and updates.
 *
 * Security notes:
 * - Only listens for ACTION_PACKAGE_ADDED and ACTION_PACKAGE_REPLACED.
 * - Does NOT listen for PACKAGE_REMOVED (not needed for threat detection).
 * - Returns only package name, app name, and permission list - same data
 *   available to any app via PackageManager. No PII.
 * - BroadcastReceiver is unregistered on module destroy to prevent leaks.
 * - Data is enriched from PackageManager after install, not from the Intent
 *   payload, to ensure consistency.
 */
class PackageMonitorModule : Module() {

    private var receiver: BroadcastReceiver? = null

    override fun definition() = ModuleDefinition {
        Name("OmnyxPackageMonitor")

        Events("onPackageInstalled")

        Function("startMonitoring") {
            val ctx = appContext.reactContext ?: return@Function
            if (receiver != null) return@Function

            receiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context, intent: Intent) {
                    val packageName = intent.data?.schemeSpecificPart ?: return
                    val isUpdate = intent.getBooleanExtra(Intent.EXTRA_REPLACING, false)

                    val appData = buildAppData(context, packageName, isUpdate)
                    sendEvent("onPackageInstalled", appData)
                }
            }

            val filter = IntentFilter().apply {
                addAction(Intent.ACTION_PACKAGE_ADDED)
                addAction(Intent.ACTION_PACKAGE_REPLACED)
                addDataScheme("package")
            }
            ctx.registerReceiver(receiver, filter)
        }

        Function("stopMonitoring") {
            val ctx = appContext.reactContext ?: return@Function
            receiver?.let { ctx.unregisterReceiver(it) }
            receiver = null
        }

        OnDestroy {
            val ctx = appContext.reactContext
            receiver?.let { ctx?.unregisterReceiver(it) }
            receiver = null
        }
    }

    private fun buildAppData(context: Context, packageName: String, isUpdate: Boolean): Map<String, Any> {
        return try {
            val pm = context.packageManager
            val info = pm.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS)
            val appName = try {
                pm.getApplicationLabel(info.applicationInfo).toString().trim()
            } catch (_: Exception) {
                packageName
            }
            val permissions = info.requestedPermissions?.toList() ?: emptyList<String>()
            val isSystemApp = (info.applicationInfo.flags and
                android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0

            mapOf(
                "packageName" to packageName,
                "appName" to appName,
                "permissions" to permissions,
                "isUpdate" to isUpdate,
                "isSystemApp" to isSystemApp,
                "installTime" to (info.firstInstallTime),
            )
        } catch (_: Exception) {
            mapOf(
                "packageName" to packageName,
                "appName" to packageName,
                "permissions" to emptyList<String>(),
                "isUpdate" to isUpdate,
                "isSystemApp" to false,
                "installTime" to System.currentTimeMillis(),
            )
        }
    }
}
