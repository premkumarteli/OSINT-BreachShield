package com.osint.breachshield.gateway.ui.gateways

import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.osint.breachshield.gateway.data.api.*
import com.osint.breachshield.gateway.data.prefs.PreferenceManager
import com.osint.breachshield.gateway.service.GatewayForegroundService
import com.osint.breachshield.gateway.util.DeviceUtils
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class GatewayViewModel @Inject constructor(
    private val api: BreachShieldApi,
    private val preferenceManager: PreferenceManager,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val _gateways = MutableStateFlow<List<GatewayItem>>(emptyList())
    val gateways = _gateways.asStateFlow()

    private val _smsMetrics = MutableStateFlow<SmsMetrics?>(null)
    val smsMetrics = _smsMetrics.asStateFlow()

    private val _recentSmsLogs = MutableStateFlow<List<SmsLogItem>>(emptyList())
    val recentSmsLogs = _recentSmsLogs.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading = _isLoading.asStateFlow()

    private val _isRegisteringDevice = MutableStateFlow(false)
    val isRegisteringDevice = _isRegisteringDevice.asStateFlow()

    private val _actionMessage = MutableStateFlow<String?>(null)
    val actionMessage = _actionMessage.asStateFlow()

    val isThisDeviceRegistered = preferenceManager.registrationStatus

    init {
        // Auto-register this device if not registered yet
        if (!preferenceManager.isRegistered()) {
            registerThisDeviceAsGateway()
        } else {
            startService()
        }
        refreshAll()
    }

    fun registerThisDeviceAsGateway() {
        val serverUrl = preferenceManager.getServerUrl()
        val deviceId = preferenceManager.getDeviceId()

        viewModelScope.launch {
            _isRegisteringDevice.value = true
            _actionMessage.value = "Registering device hardware node..."
            try {
                val req = RegistrationRequest(
                    deviceId = deviceId,
                    deviceName = "${DeviceUtils.getManufacturer()} ${DeviceUtils.getModel()}",
                    manufacturer = DeviceUtils.getManufacturer(),
                    model = DeviceUtils.getModel(),
                    androidVersion = DeviceUtils.getAndroidVersion(),
                    androidId = DeviceUtils.getAndroidId(context),
                    simReady = DeviceUtils.isSimReady(context)
                )
                val res = api.registerDevice(req)
                if (res.success && !res.gatewayToken.isNullOrBlank()) {
                    preferenceManager.saveRegistrationData(serverUrl, res.gatewayToken)
                    startService()
                    _actionMessage.value = "Device registered as active SMS Gateway!"
                    refreshAll()
                } else {
                    _actionMessage.value = res.message ?: "Failed to register gateway."
                }
            } catch (e: Exception) {
                _actionMessage.value = "Registration error: ${e.localizedMessage}"
            } finally {
                _isRegisteringDevice.value = false
            }
        }
    }

    fun refreshAll() {
        val token = preferenceManager.getAdminToken() ?: return
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val gwRes = api.getGateways("Bearer $token")
                if (gwRes.success) {
                    _gateways.value = gwRes.gateways
                }

                val smsRes = api.getSmsTelemetry("Bearer $token")
                if (smsRes.success) {
                    _smsMetrics.value = smsRes.metrics
                    _recentSmsLogs.value = smsRes.recentLogs
                }
            } catch (e: Exception) {
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun sendAction(deviceId: String, action: String = "PING") {
        val token = preferenceManager.getAdminToken() ?: return
        viewModelScope.launch {
            try {
                val res = api.sendGatewayAction("Bearer $token", deviceId, GatewayActionRequest(action))
                _actionMessage.value = res.message ?: "Command sent to gateway."
            } catch (e: Exception) {
                _actionMessage.value = e.localizedMessage ?: "Action failed."
            }
        }
    }

    private fun startService() {
        try {
            val intent = Intent(context, GatewayForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        } catch (e: Exception) {
            android.util.Log.e("GatewayVM", "Error starting Gateway service", e)
        }
    }

    fun clearActionMessage() {
        _actionMessage.value = null
    }
}
