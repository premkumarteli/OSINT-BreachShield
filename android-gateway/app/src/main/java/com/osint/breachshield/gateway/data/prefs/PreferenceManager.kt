package com.osint.breachshield.gateway.data.prefs

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PreferenceManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val sharedPreferences: SharedPreferences by lazy {
        try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            EncryptedSharedPreferences.create(
                context,
                "breachshield_gateway_prefs",
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            Log.e("PreferenceManager", "Failed to initialize EncryptedSharedPreferences, falling back to plain", e)
            context.getSharedPreferences("breachshield_gateway_prefs_plain", Context.MODE_PRIVATE)
        }
    }

    private val _registrationStatus = MutableStateFlow(false)
    val registrationStatus = _registrationStatus.asStateFlow()

    private val _adminAuthStatus = MutableStateFlow(false)
    val adminAuthStatus = _adminAuthStatus.asStateFlow()

    init {
        _registrationStatus.value = isRegistered()
        _adminAuthStatus.value = isAdminLoggedIn()
    }

    fun getDeviceId(): String {
        var deviceId = sharedPreferences.getString(KEY_DEVICE_ID, null)
        if (deviceId.isNullOrBlank()) {
            deviceId = "BSHIELD-${UUID.randomUUID()}"
            sharedPreferences.edit().putString(KEY_DEVICE_ID, deviceId).apply()
        }
        return deviceId
    }

    fun saveRegistrationData(serverUrl: String, gatewayToken: String) {
        sharedPreferences.edit()
            .putString(KEY_SERVER_URL, serverUrl)
            .putString(KEY_GATEWAY_TOKEN, gatewayToken)
            .apply()
        _registrationStatus.value = true
    }

    fun saveAdminAuth(email: String, adminToken: String) {
        sharedPreferences.edit()
            .putString(KEY_ADMIN_EMAIL, email)
            .putString(KEY_ADMIN_TOKEN, adminToken)
            .apply()
        _adminAuthStatus.value = true
    }

    fun getServerUrl(): String = sharedPreferences.getString(KEY_SERVER_URL, "http://10.0.2.2:5000") ?: "http://10.0.2.2:5000"

    fun setServerUrl(url: String) {
        sharedPreferences.edit().putString(KEY_SERVER_URL, url).apply()
    }

    fun getGatewayToken(): String? = sharedPreferences.getString(KEY_GATEWAY_TOKEN, null)

    fun getAdminToken(): String? = sharedPreferences.getString(KEY_ADMIN_TOKEN, null)

    fun getAdminEmail(): String? = sharedPreferences.getString(KEY_ADMIN_EMAIL, null)

    fun isRegistered(): Boolean = !sharedPreferences.getString(KEY_GATEWAY_TOKEN, null).isNullOrBlank()

    fun isAdminLoggedIn(): Boolean = !sharedPreferences.getString(KEY_ADMIN_TOKEN, null).isNullOrBlank()

    fun clearAdminAuth() {
        sharedPreferences.edit()
            .remove(KEY_ADMIN_TOKEN)
            .remove(KEY_ADMIN_EMAIL)
            .apply()
        _adminAuthStatus.value = false
    }

    fun clear() {
        sharedPreferences.edit().clear().apply()
        _registrationStatus.value = false
        _adminAuthStatus.value = false
    }

    companion object {
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_GATEWAY_TOKEN = "gateway_token"
        private const val KEY_ADMIN_TOKEN = "admin_jwt_token"
        private const val KEY_ADMIN_EMAIL = "admin_email"
    }
}
