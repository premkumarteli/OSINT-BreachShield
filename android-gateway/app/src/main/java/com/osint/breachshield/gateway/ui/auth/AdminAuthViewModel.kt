package com.osint.breachshield.gateway.ui.auth

import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.osint.breachshield.gateway.data.api.AdminSendOtpRequest
import com.osint.breachshield.gateway.data.api.AdminVerifyOtpRequest
import com.osint.breachshield.gateway.data.api.BreachShieldApi
import com.osint.breachshield.gateway.data.api.RegistrationRequest
import com.osint.breachshield.gateway.data.prefs.PreferenceManager
import com.osint.breachshield.gateway.service.GatewayForegroundService
import com.osint.breachshield.gateway.util.DeviceUtils
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class AuthUiState {
    object EmailEntry : AuthUiState()
    object OtpEntry : AuthUiState()
    object Success : AuthUiState()
}

@HiltViewModel
class AdminAuthViewModel @Inject constructor(
    private val api: BreachShieldApi,
    private val preferenceManager: PreferenceManager,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.EmailEntry)
    val uiState = _uiState.asStateFlow()

    private val _email = MutableStateFlow(preferenceManager.getAdminEmail() ?: "admin@breachshield.io")
    val email = _email.asStateFlow()

    private val _otp = MutableStateFlow("")
    val otp = _otp.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage = _errorMessage.asStateFlow()

    private val _cooldownSeconds = MutableStateFlow(0)
    val cooldownSeconds = _cooldownSeconds.asStateFlow()

    private val _serverUrl = MutableStateFlow(preferenceManager.getServerUrl())
    val serverUrl = _serverUrl.asStateFlow()

    fun onServerUrlChange(newUrl: String) {
        _serverUrl.value = newUrl
        preferenceManager.setServerUrl(newUrl.trim())
    }

    fun onEmailChange(newEmail: String) {
        _email.value = newEmail
        _errorMessage.value = null
    }

    fun onOtpChange(newOtp: String) {
        if (newOtp.length <= 6) {
            _otp.value = newOtp
            _errorMessage.value = null
        }
    }

    fun sendOtp() {
        if (_email.value.isBlank() || !_email.value.contains("@")) {
            _errorMessage.value = "Please enter a valid administrator email address."
            return
        }

        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            try {
                val res = api.sendAdminOtp(AdminSendOtpRequest(_email.value.trim()))
                if (res.success) {
                    _uiState.value = AuthUiState.OtpEntry
                    startCooldown(30)
                } else {
                    _errorMessage.value = res.error ?: "Failed to dispatch admin OTP."
                }
            } catch (e: Exception) {
                _errorMessage.value = e.localizedMessage ?: "Failed to connect to backend server."
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun verifyOtp() {
        if (_otp.value.length != 6) {
            _errorMessage.value = "Please enter the complete 6-digit numeric OTP."
            return
        }

        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            try {
                val res = api.verifyAdminOtp(AdminVerifyOtpRequest(_email.value.trim(), _otp.value.trim()))
                if (res.success && !res.token.isNullOrBlank()) {
                    preferenceManager.saveAdminAuth(_email.value.trim(), res.token)

                    // Auto-register this phone as SMS Gateway if not registered yet
                    if (!preferenceManager.isRegistered()) {
                        try {
                            val regReq = RegistrationRequest(
                                deviceId = preferenceManager.getDeviceId(),
                                deviceName = "${DeviceUtils.getManufacturer()} ${DeviceUtils.getModel()}",
                                manufacturer = DeviceUtils.getManufacturer(),
                                model = DeviceUtils.getModel(),
                                androidVersion = DeviceUtils.getAndroidVersion(),
                                androidId = DeviceUtils.getAndroidId(context),
                                simReady = DeviceUtils.isSimReady(context)
                            )
                            val regRes = api.registerDevice(regReq)
                            if (regRes.success && !regRes.gatewayToken.isNullOrBlank()) {
                                preferenceManager.saveRegistrationData(preferenceManager.getServerUrl(), regRes.gatewayToken)
                            }
                        } catch (e: Exception) {}
                    }

                    // Start Gateway background service
                    try {
                        val intent = Intent(context, GatewayForegroundService::class.java)
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                            context.startForegroundService(intent)
                        } else {
                            context.startService(intent)
                        }
                    } catch (e: Exception) {}

                    _uiState.value = AuthUiState.Success
                } else {
                    _errorMessage.value = res.error ?: "Invalid or expired admin verification code."
                }
            } catch (e: Exception) {
                _errorMessage.value = e.localizedMessage ?: "Verification failed. Check network connection."
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun resendOtp() {
        if (_cooldownSeconds.value == 0) {
            sendOtp()
        }
    }

    fun backToEmail() {
        _uiState.value = AuthUiState.EmailEntry
        _otp.value = ""
        _errorMessage.value = null
    }

    private fun startCooldown(seconds: Int) {
        viewModelScope.launch {
            _cooldownSeconds.value = seconds
            while (_cooldownSeconds.value > 0) {
                delay(1000)
                _cooldownSeconds.value -= 1
            }
        }
    }
}
