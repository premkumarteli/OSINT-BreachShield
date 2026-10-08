package com.osint.breachshield.gateway.ui.landing

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.osint.breachshield.gateway.data.api.BreachShieldApi
import com.osint.breachshield.gateway.data.api.CitizenSendOtpRequest
import com.osint.breachshield.gateway.data.prefs.PreferenceManager
import com.osint.breachshield.gateway.util.NetworkErrorParser
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LandingViewModel @Inject constructor(
    private val api: BreachShieldApi,
    private val preferenceManager: PreferenceManager
) : ViewModel() {

    private val _identifierType = MutableStateFlow("EMAIL")
    val identifierType = _identifierType.asStateFlow()

    private val _targetInput = MutableStateFlow("")
    val targetInput = _targetInput.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading = _isLoading.asStateFlow()

    private val _statusMessage = MutableStateFlow<String?>(null)
    val statusMessage = _statusMessage.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage = _errorMessage.asStateFlow()

    private val _pingLatency = MutableStateFlow<Long?>(null)
    val pingLatency = _pingLatency.asStateFlow()

    val serverUrl = preferenceManager.getServerUrl()

    init {
        testServerPing()
    }

    fun setIdentifierType(type: String) {
        _identifierType.value = type
        _errorMessage.value = null
        _statusMessage.value = null
    }

    fun setTargetInput(input: String) {
        _targetInput.value = input
        _errorMessage.value = null
    }

    fun testServerPing() {
        viewModelScope.launch {
            try {
                val t0 = System.currentTimeMillis()
                val res = api.ping()
                val delta = System.currentTimeMillis() - t0
                if (res.status == "ok") {
                    _pingLatency.value = delta
                }
            } catch (e: Exception) {
                _pingLatency.value = null
            }
        }
    }

    fun checkCompromiseStatus() {
        val target = _targetInput.value.trim()
        if (target.isBlank()) {
            _errorMessage.value = if (_identifierType.value == "EMAIL") {
                "Please enter a valid email address."
            } else {
                "Please enter a valid phone number with country code."
            }
            return
        }

        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            _statusMessage.value = null
            try {
                val req = if (_identifierType.value == "EMAIL") {
                    CitizenSendOtpRequest(email = target.lowercase(), target = target.lowercase())
                } else {
                    val cleanPhone = target.replace(Regex("[\\s-]"), "")
                    CitizenSendOtpRequest(phone = cleanPhone, target = cleanPhone)
                }

                val res = api.sendCitizenOtp(req)
                if (res.success) {
                    _statusMessage.value = res.message ?: "Verification token dispatched to $target via GSM Relay!"
                } else {
                    _errorMessage.value = res.error ?: res.message ?: "Could not dispatch verification token."
                }
            } catch (e: Exception) {
                _errorMessage.value = NetworkErrorParser.parse(e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun clearMessages() {
        _statusMessage.value = null
        _errorMessage.value = null
    }
}
