package com.osint.breachshield.gateway.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "gateway_config")
data class GatewayConfig(
    @PrimaryKey val id: Int = 1,
    val serverUrl: String,
    val gatewayToken: String,
    val deviceId: String,
    val deviceName: String
)

@Entity(tableName = "sms_logs")
data class SmsLog(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val requestId: String,
    val phoneNumber: String,
    val message: String,
    val status: String, // SENT, DELIVERED, FAILED
    val timestamp: Long = System.currentTimeMillis(),
    val error: String? = null
)

@Entity(tableName = "connection_logs")
data class ConnectionLog(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val status: String, // CONNECTED, DISCONNECTED, ERROR
    val message: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)
