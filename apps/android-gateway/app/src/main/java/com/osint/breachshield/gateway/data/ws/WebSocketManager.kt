package com.osint.breachshield.gateway.data.ws

import android.util.Log
import com.google.gson.Gson
import com.osint.breachshield.gateway.data.prefs.PreferenceManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.min
import kotlin.random.Random

@Singleton
class WebSocketManager @Inject constructor(
    private val client: OkHttpClient,
    private val preferenceManager: PreferenceManager,
    private val gson: Gson
) {
    private var webSocket: WebSocket? = null
    private val _connectionStatus = MutableStateFlow(ConnectionStatus.DISCONNECTED)
    val connectionStatus = _connectionStatus.asStateFlow()

    private val scope = CoroutineScope(Dispatchers.IO + Job())
    private var reconnectJob: Job? = null
    private var heartbeatJob: Job? = null
    private var pollingJob: Job? = null
    private var reconnectAttempts = 0

    var onSmsCommandReceived: ((SmsCommand) -> Unit)? = null

    fun connect() {
        val serverUrl = preferenceManager.getServerUrl() ?: return
        val gatewayToken = preferenceManager.getGatewayToken() ?: return
        val deviceId = preferenceManager.getDeviceId()

        if (_connectionStatus.value == ConnectionStatus.CONNECTED || _connectionStatus.value == ConnectionStatus.CONNECTING) return

        val cleanUrl = serverUrl.trimEnd('/')
        val wsUrl = if (cleanUrl.startsWith("https")) {
            cleanUrl.replace("https", "wss")
        } else if (cleanUrl.startsWith("http")) {
            cleanUrl.replace("http", "ws")
        } else {
            "ws://$cleanUrl"
        } + "/ws/gateway"

        Log.d(TAG, "Connecting to WebSocket: $wsUrl")
        val request = Request.Builder()
            .url(wsUrl)
            .build()

        val clientWithTimeouts = client.newBuilder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .build()

        _connectionStatus.value = ConnectionStatus.CONNECTING
        webSocket = clientWithTimeouts.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d(TAG, "WebSocket Opened. Response: $response")
                _connectionStatus.value = ConnectionStatus.CONNECTED
                
                // 1. Authenticate
                val authMessage = AuthMessage(deviceId, gatewayToken)
                val jsonAuth = gson.toJson(authMessage)
                Log.d(TAG, "Sending Auth Message: $jsonAuth")
                webSocket.send(jsonAuth)
                
                // 2. Fetch pending jobs right away
                fetchPendingJobs()
                
                startHeartbeat()
                startPollingSafetyNet()
                reconnectAttempts = 0
                reconnectJob?.cancel()
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                Log.d(TAG, "Message received: $text")
                val trimmedText = text.trim()
                if (!trimmedText.startsWith("{")) {
                    Log.d(TAG, "Ignoring non-JSON message: $trimmedText")
                    return
                }
                try {
                    val command = gson.fromJson(trimmedText, SmsCommand::class.java)
                    if (command != null && (command.action == "send_sms" || command.type == "SEND_SMS")) {
                        // Validate required fields
                        if (command.requestId != null && command.message != null) {
                             onSmsCommandReceived?.invoke(command)
                        } else {
                             Log.w(TAG, "SmsCommand missing required fields: $trimmedText")
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to parse message: $trimmedText", e)
                }
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                _connectionStatus.value = ConnectionStatus.DISCONNECTED
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket Failure", t)
                _connectionStatus.value = ConnectionStatus.DISCONNECTED
                stopHeartbeat()
                scheduleReconnect()
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                _connectionStatus.value = ConnectionStatus.DISCONNECTED
                stopHeartbeat()
            }
        })
    }

    fun disconnect() {
        webSocket?.close(1000, "User logout")
        webSocket = null
        stopHeartbeat()
        stopPollingSafetyNet()
        reconnectAttempts = 0
        reconnectJob?.cancel()
    }

    fun sendSmsStatus(requestId: String, status: String) {
        val update = SmsStatusUpdate(
            requestId = requestId,
            deviceId = preferenceManager.getDeviceId(),
            status = status,
            timestamp = System.currentTimeMillis()
        )
        webSocket?.send(gson.toJson(update))

        // Also post via HTTP as fallback
        scope.launch {
            try {
                val serverUrl = preferenceManager.getServerUrl() ?: return@launch
                val url = "${serverUrl.trimEnd('/')}/api/gateway/status"
                val json = gson.toJson(update)
                val mediaType = "application/json; charset=utf-8".toMediaTypeOrNull()
                val body = json.toRequestBody(mediaType)
                val req = Request.Builder().url(url).post(body).build()
                client.newCall(req).execute()
            } catch (e: Exception) {
                Log.w(TAG, "HTTP status sync failed: ${e.message}")
            }
        }
    }

    fun fetchPendingJobs() {
        scope.launch {
            try {
                val serverUrl = preferenceManager.getServerUrl() ?: return@launch
                val deviceId = preferenceManager.getDeviceId()
                val url = "${serverUrl.trimEnd('/')}/api/gateway/pending/$deviceId"
                Log.d(TAG, "Fetching pending jobs from: $url")

                val req = Request.Builder().url(url).get().build()
                val resp = client.newCall(req).execute()
                if (resp.isSuccessful) {
                    val respBody = resp.body?.string() ?: return@launch
                    if (!respBody.trim().startsWith("{")) {
                        Log.w(TAG, "Unexpected non-JSON response from pending jobs: $respBody")
                        return@launch
                    }
                    val pendingResponse = gson.fromJson(respBody, PendingJobsResponse::class.java)
                    pendingResponse?.jobs?.forEach { job ->
                        val requestId = job.requestId
                        val message = job.message
                        if (requestId != null && message != null) {
                            Log.d(TAG, "Found pending job: $requestId -> ${job.phone}")
                            onSmsCommandReceived?.invoke(
                                SmsCommand(
                                    action = "send_sms",
                                    type = "SEND_SMS",
                                    requestId = requestId,
                                    phone = job.phone,
                                    message = message
                                )
                            )
                        }
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Error fetching pending jobs: ${e.message}")
            }
        }
    }

    private fun startHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = scope.launch {
            while (true) {
                delay(30000)
                webSocket?.send("ping")
            }
        }
    }

    private fun stopHeartbeat() {
        heartbeatJob?.cancel()
    }

    private fun startPollingSafetyNet() {
        pollingJob?.cancel()
        pollingJob = scope.launch {
            while (true) {
                delay(10000) // Safety net poll every 10s
                fetchPendingJobs()
            }
        }
    }

    private fun stopPollingSafetyNet() {
        pollingJob?.cancel()
    }

    private fun scheduleReconnect() {
        reconnectJob?.cancel()
        reconnectJob = scope.launch {
            val delayMs = min(1000L * (1L shl min(reconnectAttempts, 5)), 30000L) + Random.nextLong(500L)
            Log.d(TAG, "Attempting to reconnect in ${delayMs}ms (attempt #${reconnectAttempts + 1})...")
            delay(delayMs)
            reconnectAttempts++
            connect()
        }
    }

    companion object {
        private const val TAG = "WebSocketManager"
    }
}

enum class ConnectionStatus {
    CONNECTED, DISCONNECTED, CONNECTING
}

data class AuthMessage(
    val deviceId: String,
    val gatewayToken: String
)

data class SmsCommand(
    val action: String? = "send_sms",
    val type: String? = "SEND_SMS",
    val requestId: String? = null,
    val phone: String? = null,
    val phoneNumber: String? = null,
    val message: String? = null
) {
    fun getTargetPhone(): String = phone ?: phoneNumber ?: ""
}

data class SmsStatusUpdate(
    val requestId: String,
    val deviceId: String,
    val status: String,
    val timestamp: Long
)

data class PendingJobsResponse(
    val success: Boolean,
    val deviceId: String,
    val count: Int,
    val jobs: List<PendingJobItem>?
)

data class PendingJobItem(
    val requestId: String? = null,
    val phone: String? = null,
    val message: String? = null
)
