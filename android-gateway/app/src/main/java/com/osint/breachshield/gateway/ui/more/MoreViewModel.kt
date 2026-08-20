package com.osint.breachshield.gateway.ui.more

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.osint.breachshield.gateway.data.api.*
import com.osint.breachshield.gateway.data.prefs.PreferenceManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MoreViewModel @Inject constructor(
    private val api: BreachShieldApi,
    private val preferenceManager: PreferenceManager
) : ViewModel() {

    private val _alerts = MutableStateFlow<List<AlertItem>>(emptyList())
    val alerts = _alerts.asStateFlow()

    private val _activity = MutableStateFlow<List<ActivityItem>>(emptyList())
    val activity = _activity.asStateFlow()

    private val _breachData = MutableStateFlow<BreachesResponse?>(null)
    val breachData = _breachData.asStateFlow()

    private val _settings = MutableStateFlow<AppSettingsDto?>(null)
    val settings = _settings.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading = _isLoading.asStateFlow()

    private val _pingResult = MutableStateFlow<String?>(null)
    val pingResult = _pingResult.asStateFlow()

    private val _statusMessage = MutableStateFlow<String?>(null)
    val statusMessage = _statusMessage.asStateFlow()

    init {
        loadAll()
    }

    fun loadAll() {
        val token = preferenceManager.getAdminToken() ?: return
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val alertsRes = api.getAlerts("Bearer $token")
                if (alertsRes.success) _alerts.value = alertsRes.alerts

                val actRes = api.getActivity("Bearer $token")
                if (actRes.success) _activity.value = actRes.activity

                val breachRes = api.getBreaches("Bearer $token")
                if (breachRes.success) _breachData.value = breachRes

                val setRes = api.getSettings("Bearer $token")
                if (setRes.success) _settings.value = setRes.settings
            } catch (e: Exception) {
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun updateSetting(
        enableTelegramScraper: Boolean? = null,
        fallbackToEmail: Boolean? = null,
        maintenanceMode: Boolean? = null,
        otpExpiryMinutes: Int? = null,
        sessionTimeoutMin: Int? = null,
        heartbeatIntervalSec: Int? = null,
        smsOtpTemplate: String? = null
    ) {
        val token = preferenceManager.getAdminToken() ?: return
        viewModelScope.launch {
            _isLoading.value = true
            _statusMessage.value = null
            try {
                val req = UpdateSettingsRequest(
                    enableTelegramScraper = enableTelegramScraper,
                    fallbackToEmail = fallbackToEmail,
                    maintenanceMode = maintenanceMode,
                    otpExpiryMinutes = otpExpiryMinutes,
                    sessionTimeoutMin = sessionTimeoutMin,
                    heartbeatIntervalSec = heartbeatIntervalSec,
                    smsOtpTemplate = smsOtpTemplate
                )
                val res = api.updateSettings("Bearer $token", req)
                if (res.success) {
                    _settings.value = res.settings
                    _statusMessage.value = "Settings updated successfully!"
                }
            } catch (e: Exception) {
                _statusMessage.value = "Failed: ${e.localizedMessage}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun testConnection() {
        viewModelScope.launch {
            _pingResult.value = "Testing latency..."
            val start = System.currentTimeMillis()
            try {
                val res = api.ping()
                val latency = System.currentTimeMillis() - start
                if (res.success) {
                    _pingResult.value = "● Connected! Latency: ${latency}ms (Uptime: ${res.uptime}s)"
                } else {
                    _pingResult.value = "Server returned error."
                }
            } catch (e: Exception) {
                _pingResult.value = "Failed to connect: ${e.localizedMessage}"
            }
        }
    }

    fun resolveAlert(alertId: String) {
        val token = preferenceManager.getAdminToken() ?: return
        viewModelScope.launch {
            try {
                val res = api.resolveAlert("Bearer $token", alertId)
                if (res.success) {
                    loadAll()
                }
            } catch (e: Exception) {}
        }
    }

    fun triggerBreachSync() {
        val token = preferenceManager.getAdminToken() ?: return
        viewModelScope.launch {
            _statusMessage.value = "Synchronizing breach datasets..."
            try {
                val res = api.syncBreaches("Bearer $token")
                if (res.success) {
                    _statusMessage.value = res.message ?: "Index synchronized successfully."
                    loadAll()
                }
            } catch (e: Exception) {
                _statusMessage.value = "Sync failed: ${e.localizedMessage}"
            }
        }
    }

    fun saveServerUrl(url: String) {
        preferenceManager.setServerUrl(url.trim())
        _statusMessage.value = "Server URL saved."
    }

    fun logout(onLogoutSuccess: () -> Unit) {
        preferenceManager.clearAdminAuth()
        onLogoutSuccess()
    }

    fun clearStatusMessage() {
        _statusMessage.value = null
    }
}
