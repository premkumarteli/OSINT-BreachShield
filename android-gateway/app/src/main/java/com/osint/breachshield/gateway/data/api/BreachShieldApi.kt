package com.osint.breachshield.gateway.data.api

import retrofit2.http.*

interface BreachShieldApi {

    // Gateway Registration
    @POST("/api/gateway/register")
    suspend fun registerDevice(@Body request: RegistrationRequest): RegistrationResponse

    // Admin Authentication
    @POST("/api/admin/auth/send-otp")
    suspend fun sendAdminOtp(@Body request: AdminSendOtpRequest): AdminApiResponse<Unit>

    @POST("/api/admin/auth/verify-otp")
    suspend fun verifyAdminOtp(@Body request: AdminVerifyOtpRequest): AdminVerifyOtpResponse

    // Admin Dashboard Overview
    @GET("/api/admin/overview")
    suspend fun getOverview(@Header("Authorization") token: String): AdminOverviewResponse

    // Active & History Users
    @GET("/api/admin/users/active")
    suspend fun getActiveUsers(@Header("Authorization") token: String): ActiveUsersResponse

    @GET("/api/admin/users/history")
    suspend fun getUserHistory(@Header("Authorization") token: String, @Query("limit") limit: Int = 50): UserHistoryResponse

    // Gateways & Devices
    @GET("/api/admin/gateways")
    suspend fun getGateways(@Header("Authorization") token: String): GatewaysResponse

    @POST("/api/admin/gateways/{id}/action")
    suspend fun sendGatewayAction(
        @Header("Authorization") token: String,
        @Path("id") deviceId: String,
        @Body request: GatewayActionRequest
    ): AdminApiResponse<Unit>

    // SMS Telemetry
    @GET("/api/admin/sms")
    suspend fun getSmsTelemetry(@Header("Authorization") token: String): SmsTelemetryResponse

    // Alerts, Activity & Breaches
    @GET("/api/admin/alerts")
    suspend fun getAlerts(@Header("Authorization") token: String): AlertsResponse

    @GET("/api/admin/activity")
    suspend fun getActivity(@Header("Authorization") token: String): ActivityResponse

    @GET("/api/admin/breaches")
    suspend fun getBreaches(@Header("Authorization") token: String): BreachesResponse

    // System Settings
    @GET("/api/admin/settings")
    suspend fun getSettings(@Header("Authorization") token: String): SettingsResponse
}

// ----------------- Data Models -----------------

data class RegistrationRequest(
    val deviceId: String,
    val deviceName: String,
    val manufacturer: String,
    val model: String,
    val androidVersion: String,
    val androidId: String,
    val simReady: Boolean
)

data class RegistrationResponse(
    val success: Boolean,
    val gatewayToken: String?,
    val message: String? = null
)

data class AdminSendOtpRequest(val email: String)

data class AdminVerifyOtpRequest(val email: String, val otp: String)

data class AdminVerifyOtpResponse(
    val success: Boolean,
    val token: String?,
    val adminUser: AdminUserDto?,
    val error: String? = null
)

data class AdminUserDto(val email: String, val role: String)

data class AdminApiResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val error: String? = null,
    val data: T? = null
)

data class AdminOverviewResponse(
    val success: Boolean,
    val data: OverviewData
)

data class OverviewData(
    val systemStatus: String,
    val metrics: OverviewMetrics,
    val activitySparkline: List<Int>? = null
)

data class OverviewMetrics(
    val activeUsersCount: Int,
    val gatewaysOnline: Int,
    val gatewaysTotal: Int,
    val smsSentToday: Int,
    val smsSuccessRate: String,
    val activeAlertsCount: Int,
    val breachesCount: Int
)

data class ActiveUsersResponse(
    val success: Boolean,
    val count: Int,
    val users: List<ActiveUserItem>
)

data class ActiveUserItem(
    val sessionId: String,
    val userTarget: String,
    val maskedIp: String,
    val device: String,
    val browser: String,
    val os: String,
    val currentPage: String,
    val startTime: Long,
    val lastActivity: Long,
    val state: String
)

data class UserHistoryResponse(
    val success: Boolean,
    val count: Int,
    val history: List<UserHistoryItem>
)

data class UserHistoryItem(
    val sessionId: String,
    val userTarget: String,
    val maskedIp: String,
    val device: String,
    val browser: String,
    val os: String,
    val startTime: Long,
    val endTime: Long,
    val durationSeconds: Int
)

data class GatewaysResponse(
    val success: Boolean,
    val count: Int,
    val gateways: List<GatewayItem>
)

data class GatewayItem(
    val deviceId: String,
    val gatewayId: String,
    val deviceName: String,
    val model: String,
    val manufacturer: String,
    val androidVersion: String,
    val appVersion: String,
    val status: String,
    val lastSeenSecondsAgo: Int,
    val battery: Int,
    val signal: String,
    val simState: String,
    val smsSentCount: Int
)

data class GatewayActionRequest(val action: String)

data class SmsTelemetryResponse(
    val success: Boolean,
    val metrics: SmsMetrics,
    val recentLogs: List<SmsLogItem>
)

data class SmsMetrics(
    val totalSent: Int,
    val delivered: Int,
    val failed: Int,
    val successRate: String
)

data class SmsLogItem(
    val requestId: String,
    val phone: String,
    val status: String,
    val timestamp: Long,
    val gatewayId: String
)

data class AlertsResponse(
    val success: Boolean,
    val count: Int,
    val alerts: List<AlertItem>
)

data class AlertItem(
    val id: String,
    val severity: String,
    val title: String,
    val description: String,
    val source: String,
    val timestamp: Long
)

data class ActivityResponse(
    val success: Boolean,
    val count: Int,
    val activity: List<ActivityItem>
)

data class ActivityItem(
    val id: String,
    val actor: String,
    val action: String,
    val target: String,
    val result: String,
    val timestamp: Long
)

data class BreachesResponse(
    val success: Boolean,
    val indexStatus: String,
    val lastSync: String,
    val datasets: List<DatasetItem>
)

data class DatasetItem(
    val name: String,
    val year: String,
    val records: Int? = null,
    val status: String
)

data class SettingsResponse(
    val success: Boolean,
    val settings: AppSettingsDto
)

data class AppSettingsDto(
    val serverUrl: String,
    val environment: String,
    val heartbeatIntervalSec: Int,
    val sessionTimeoutMin: Int,
    val appVersion: String
)
