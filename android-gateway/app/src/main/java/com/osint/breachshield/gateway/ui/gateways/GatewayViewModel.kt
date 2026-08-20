package com.osint.breachshield.gateway.ui.gateways

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
class GatewayViewModel @Inject constructor(
    private val api: BreachShieldApi,
    private val preferenceManager: PreferenceManager
) : ViewModel() {

    private val _gateways = MutableStateFlow<List<GatewayItem>>(emptyList())
    val gateways = _gateways.asStateFlow()

    private val _smsMetrics = MutableStateFlow<SmsMetrics?>(null)
    val smsMetrics = _smsMetrics.asStateFlow()

    private val _recentSmsLogs = MutableStateFlow<List<SmsLogItem>>(emptyList())
    val recentSmsLogs = _recentSmsLogs.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading = _isLoading.asStateFlow()

    private val _actionMessage = MutableStateFlow<String?>(null)
    val actionMessage = _actionMessage.asStateFlow()

    init {
        refreshAll()
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

    fun clearActionMessage() {
        _actionMessage.value = null
    }
}
