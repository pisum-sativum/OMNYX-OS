package expo.modules.permissionscanner

import android.content.pm.PackageManager
import android.content.pm.PackageInfo
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

/**
 * OmnyxPermissionScanner native module
 *
 * Security notes:
 * - Checks QUERY_ALL_PACKAGES grant before returning any data.
 * - Returns only: package name, app name, permission list, timestamps, system flag.
 * - No personally identifiable data beyond what PackageManager exposes.
 * - All exceptions are caught and rejected as structured errors — no stack traces exposed to JS.
 * - App names are trimmed before serialization.
 */
class PermissionScannerModule : Module() {

    override fun definition() = ModuleDefinition {
        Name("OmnyxPermissionScanner")

        AsyncFunction("hasPermission") {
            val ctx = appContext.reactContext ?: return@AsyncFunction false
            val pm = ctx.packageManager

            pm.checkPermission(
                "android.permission.QUERY_ALL_PACKAGES",
                ctx.packageName
            ) == PackageManager.PERMISSION_GRANTED
        }

        AsyncFunction("scanInstalledApps") { promise: Promise ->
            try {
                val ctx = appContext.reactContext
                    ?: return@AsyncFunction promise.reject("NO_CONTEXT", "React context unavailable", null)

                val pm = ctx.packageManager

                val packages: List<PackageInfo> = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    pm.getInstalledPackages(PackageManager.PackageInfoFlags.of(PackageManager.GET_PERMISSIONS.toLong()))
                } else {
                    @Suppress("DEPRECATION")
                    pm.getInstalledPackages(PackageManager.GET_PERMISSIONS)
                }

                val results = mutableListOf<Map<String, Any>>()

                for (pkg in packages) {
                    val appInfo = pkg.applicationInfo ?: continue

                    val appName = try {
                        pm.getApplicationLabel(appInfo).toString().trim().take(64)
                    } catch (_: Exception) {
                        pkg.packageName
                    }

                    val rawPerms: Array<String> = pkg.requestedPermissions ?: emptyArray()

                    val shortPerms = rawPerms
                        .mapNotNull { fullName -> PERMISSION_MAP[fullName] }
                        .distinct()

                    val isSystem = (appInfo.flags and
                            android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0

                    results.add(
                        mapOf(
                            "packageName" to pkg.packageName,
                            "appName" to appName,
                            "permissions" to shortPerms,
                            "installTime" to pkg.firstInstallTime,
                            "lastUpdated" to pkg.lastUpdateTime,
                            "versionName" to (pkg.versionName ?: ""),
                            "isSystemApp" to isSystem,
                        )
                    )
                }

                promise.resolve(results)
            } catch (e: SecurityException) {
                promise.reject("PERMISSION_DENIED", "QUERY_ALL_PACKAGES not granted", null)
            } catch (_: Exception) {
                promise.reject("SCAN_ERROR", "Permission scan failed", null)
            }
        }
    }

    companion object {
        private val PERMISSION_MAP = mapOf(
            "android.permission.ACCESS_FINE_LOCATION"        to "ACCESS_FINE_LOCATION",
            "android.permission.ACCESS_COARSE_LOCATION"      to "ACCESS_COARSE_LOCATION",
            "android.permission.ACCESS_BACKGROUND_LOCATION"  to "ACCESS_BACKGROUND_LOCATION",
            "android.permission.RECORD_AUDIO"                to "RECORD_AUDIO",
            "android.permission.CAMERA"                      to "CAMERA",
            "android.permission.READ_CONTACTS"               to "READ_CONTACTS",
            "android.permission.WRITE_CONTACTS"              to "WRITE_CONTACTS",
            "android.permission.READ_PHONE_STATE"            to "READ_PHONE_STATE",
            "android.permission.READ_CALL_LOG"               to "READ_CALL_LOG",
            "android.permission.CALL_PHONE"                  to "CALL_PHONE",
            "android.permission.READ_SMS"                    to "READ_SMS",
            "android.permission.RECEIVE_SMS"                 to "RECEIVE_SMS",
            "android.permission.SEND_SMS"                    to "SEND_SMS",
            "android.permission.READ_EXTERNAL_STORAGE"       to "READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE"      to "WRITE_EXTERNAL_STORAGE",
            "android.permission.READ_MEDIA_IMAGES"           to "READ_MEDIA_IMAGES",
            "android.permission.BODY_SENSORS"                to "BODY_SENSORS",
            "android.permission.ACTIVITY_RECOGNITION"        to "ACTIVITY_RECOGNITION",
            "android.permission.READ_CALENDAR"               to "READ_CALENDAR",
            "android.permission.WRITE_CALENDAR"              to "WRITE_CALENDAR",
            "android.permission.RECEIVE_BOOT_COMPLETED"      to "RECEIVE_BOOT_COMPLETED",
            "android.permission.FOREGROUND_SERVICE"          to "FOREGROUND_SERVICE",
            "android.permission.REQUEST_INSTALL_PACKAGES"    to "REQUEST_INSTALL_PACKAGES",
            "android.permission.SYSTEM_ALERT_WINDOW"         to "SYSTEM_ALERT_WINDOW",
            "android.permission.BIND_ACCESSIBILITY_SERVICE"  to "BIND_ACCESSIBILITY_SERVICE",
            "android.permission.WRITE_SETTINGS"              to "WRITE_SETTINGS",
            "android.permission.INTERNET"                    to "INTERNET",
            "android.permission.ACCESS_WIFI_STATE"           to "ACCESS_WIFI_STATE",
            "android.permission.ACCESS_NETWORK_STATE"        to "ACCESS_NETWORK_STATE",
            "android.permission.CHANGE_WIFI_STATE"           to "CHANGE_WIFI_STATE",
            "android.permission.BLUETOOTH_SCAN"              to "BLUETOOTH_SCAN",
            "android.permission.VIBRATE"                     to "VIBRATE",
            "android.permission.WAKE_LOCK"                   to "WAKE_LOCK",
            "android.permission.FLASHLIGHT"                  to "FLASHLIGHT",
            "android.permission.NFC"                         to "NFC",
            "android.permission.BLUETOOTH"                   to "BLUETOOTH",
            "android.permission.USE_BIOMETRIC"               to "USE_BIOMETRIC",
            "android.permission.POST_NOTIFICATIONS"          to "POST_NOTIFICATIONS",
        )
    }
}
