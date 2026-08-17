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
    // 1. Declare sharedPreferences FIRST so it is available to init block
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

    init {
        _registrationStatus.value = isRegistered()
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

    fun getServerUrl(): String? = sharedPreferences.getString(KEY_SERVER_URL, null)

    fun getGatewayToken(): String? = sharedPreferences.getString(KEY_GATEWAY_TOKEN, null)

    fun isRegistered(): Boolean = !sharedPreferences.getString(KEY_GATEWAY_TOKEN, null).isNullOrBlank()

    fun clear() {
        sharedPreferences.edit().clear().apply()
        _registrationStatus.value = false
    }

    companion object {
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_GATEWAY_TOKEN = "gateway_token"
    }
}
