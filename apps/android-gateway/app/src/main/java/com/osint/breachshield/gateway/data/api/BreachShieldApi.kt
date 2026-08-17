package com.osint.breachshield.gateway.data.api

import retrofit2.http.Body
import retrofit2.http.POST

interface BreachShieldApi {
    @POST("/api/gateway/register")
    suspend fun registerDevice(@Body request: RegistrationRequest): RegistrationResponse
}

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
