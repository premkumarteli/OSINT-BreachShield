package com.osint.breachshield.gateway.data.db

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.RoomDatabase
import kotlinx.coroutines.flow.Flow

@Dao
interface GatewayDao {
    @Query("SELECT * FROM gateway_config WHERE id = 1")
    fun getConfig(): Flow<GatewayConfig?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveConfig(config: GatewayConfig)

    @Insert
    suspend fun insertSmsLog(log: SmsLog)

    @Query("UPDATE sms_logs SET status = :status WHERE requestId = :requestId")
    suspend fun updateSmsStatus(requestId: String, status: String)

    @Query("SELECT * FROM sms_logs ORDER BY timestamp DESC LIMIT 20")
    fun getRecentSmsLogs(): Flow<List<SmsLog>>

    @Query("SELECT COUNT(*) FROM sms_logs WHERE status = 'SENT' AND timestamp >= :todayStart")
    fun getSentCountToday(todayStart: Long): Flow<Int>

    @Query("SELECT COUNT(*) FROM sms_logs WHERE status = 'FAILED' AND timestamp >= :todayStart")
    fun getFailedCountToday(todayStart: Long): Flow<Int>

    @Insert
    suspend fun insertConnectionLog(log: ConnectionLog)

    @Query("SELECT * FROM connection_logs ORDER BY timestamp DESC LIMIT 1")
    fun getLastConnectionStatus(): Flow<ConnectionLog?>
}

@Database(entities = [GatewayConfig::class, SmsLog::class, ConnectionLog::class], version = 1)
abstract class GatewayDatabase : RoomDatabase() {
    abstract fun gatewayDao(): GatewayDao
}
