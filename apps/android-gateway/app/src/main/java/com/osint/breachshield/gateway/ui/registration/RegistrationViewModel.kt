package com.osint.breachshield.gateway.ui.registration

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.osint.breachshield.gateway.data.api.BreachShieldApi
import com.osint.breachshield.gateway.data.api.RegistrationRequest
import com.osint.breachshield.gateway.data.prefs.PreferenceManager
import com.osint.breachshield.gateway.util.DeviceUtils
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RegistrationViewModel @Inject constructor(
    private val preferenceManager: PreferenceManager,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val _uiState = MutableStateFlow<RegistrationUiState>(RegistrationUiState.Idle)
    val uiState = _uiState.asStateFlow()

    fun register(serverUrlInput: String, deviceName: String) {
        viewModelScope.launch {
            _uiState.value = RegistrationUiState.Loading
            
            val trimmedUrl = serverUrlInput.trim()
            val serverUrl = if (!trimmedUrl.startsWith("http")) "http://$trimmedUrl" else trimmedUrl
            
            android.util.Log.d("Registration", "Starting registration at: $serverUrl")
            
            try {
                // 1. Validate URL before Retrofit
                val uri = try {
                    java.net.URI(serverUrl)
                } catch (e: Exception) {
                    throw IllegalArgumentException("Invalid Server URL format")
                }
                if (uri.host == null) throw IllegalArgumentException("Server URL missing host")

                val baseUrl = if (serverUrl.endsWith("/")) serverUrl else "$serverUrl/"
                android.util.Log.d("Registration", "Base URL for Retrofit: $baseUrl")

                // 2. Prepare client with logging
                val logging = okhttp3.logging.HttpLoggingInterceptor { message ->
                    android.util.Log.d("RegistrationAPI", message)
                }.apply {
                    level = okhttp3.logging.HttpLoggingInterceptor.Level.BODY
                }

                val client = okhttp3.OkHttpClient.Builder()
                    .addInterceptor(logging)
                    .connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
                    .readTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
                    .build()

                // 3. Create Retrofit
                android.util.Log.d("Registration", "Building Retrofit...")
                val tempApi = try {
                    retrofit2.Retrofit.Builder()
                        .baseUrl(baseUrl)
                        .client(client)
                        .addConverterFactory(retrofit2.converter.gson.GsonConverterFactory.create())
                        .build()
                        .create(BreachShieldApi::class.java)
                } catch (e: Exception) {
                    android.util.Log.e("Registration", "Failed to build Retrofit", e)
                    throw e
                }

                // 4. Collect metadata
                android.util.Log.d("Registration", "Collecting device metadata...")
                val request = try {
                    RegistrationRequest(
                        deviceId = preferenceManager.getDeviceId(),
                        deviceName = deviceName,
                        manufacturer = DeviceUtils.getManufacturer(),
                        model = DeviceUtils.getModel(),
                        androidVersion = DeviceUtils.getAndroidVersion(),
                        androidId = DeviceUtils.getAndroidId(context),
                        simReady = DeviceUtils.isSimReady(context)
                    )
                } catch (e: Exception) {
                    android.util.Log.e("Registration", "Failed to collect metadata", e)
                    throw e
                }

                android.util.Log.d("Registration", "Payload: $request")

                // 5. Execute Request
                android.util.Log.d("Registration", "Sending request to backend...")
                val response = tempApi.registerDevice(request)
                android.util.Log.d("Registration", "Response received: $response")

                if (response.success && response.gatewayToken != null) {
                    android.util.Log.d("Registration", "Registration SUCCESS. Saving data...")
                    preferenceManager.saveRegistrationData(serverUrl, response.gatewayToken)
                    _uiState.value = RegistrationUiState.Success
                } else {
                    val errorMsg = response.message ?: "Registration rejected by server"
                    android.util.Log.w("Registration", "Registration FAILED: $errorMsg")
                    _uiState.value = RegistrationUiState.Error(errorMsg)
                }
            } catch (e: retrofit2.HttpException) {
                val errorBody = try { e.response()?.errorBody()?.string() } catch(ex: Exception) { null }
                android.util.Log.e("Registration", "HTTP Error ${e.code()}: $errorBody", e)
                _uiState.value = RegistrationUiState.Error("Server Error (${e.code()}): ${errorBody ?: e.message()}")
            } catch (e: java.net.UnknownHostException) {
                android.util.Log.e("Registration", "DNS Error: Unknown Host", e)
                _uiState.value = RegistrationUiState.Error("Cannot find server. Check URL and Network.")
            } catch (e: java.net.ConnectException) {
                android.util.Log.e("Registration", "Connection Refused", e)
                _uiState.value = RegistrationUiState.Error("Connection refused. Check if server is running.")
            } catch (e: Throwable) {
                android.util.Log.e("Registration", "Unexpected error during registration", e)
                _uiState.value = RegistrationUiState.Error("${e.javaClass.simpleName}: ${e.localizedMessage}")
            }
        }
    }
}

sealed class RegistrationUiState {
    object Idle : RegistrationUiState()
    object Loading : RegistrationUiState()
    object Success : RegistrationUiState()
    data class Error(val message: String) : RegistrationUiState()
}
