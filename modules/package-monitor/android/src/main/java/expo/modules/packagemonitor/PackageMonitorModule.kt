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
 * - Returns only package name, app name, and permission list.
 * - BroadcastReceiver is unregistered on module destroy to prevent leaks.
 */
class PackageMonitorModule : Module() {

    private var receiver: BroadcastReceiver? = null

    override fun definition() = ModuleDefinition {
        Name("OmnyxPackageMonitor")

        Events("onPackageInstalled")

        Function("startMonitoring") {
            val ctx = appContext.reactContext
            if (ctx != null && receiver == null) {
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
            null
        }

        Function("stopMonitoring") {
            val ctx = appContext.reactContext
            if (ctx != null) {
                receiver?.let { ctx.unregisterReceiver(it) }
                receiver = null
            }
            null
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
            val appInfo = info.applicationInfo
            val appName = if (appInfo != null) {
                try { pm.getApplicationLabel(appInfo).toString().trim() } catch (_: Exception) { packageName }
            } else {
                packageName
            }
            val permissions = info.requestedPermissions?.toList() ?: emptyList()
            val isSystemApp = if (appInfo != null) {
                (appInfo.flags and android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0
            } else {
                false
            }
            mapOf(
                "packageName" to packageName,
                "appName" to appName,
                "permissions" to permissions,
                "isUpdate" to isUpdate,
                "isSystemApp" to isSystemApp,
                "installTime" to info.firstInstallTime,
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
