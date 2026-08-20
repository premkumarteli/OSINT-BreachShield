package com.osint.breachshield.gateway.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.osint.breachshield.gateway.data.db.GatewayDao
import com.osint.breachshield.gateway.data.db.SmsLog
import com.osint.breachshield.gateway.data.prefs.PreferenceManager
import com.osint.breachshield.gateway.data.ws.ConnectionStatus
import com.osint.breachshield.gateway.data.ws.WebSocketManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import java.util.*
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val gatewayDao: GatewayDao,
    private val webSocketManager: WebSocketManager,
    private val preferenceManager: PreferenceManager
) : ViewModel() {

    val deviceId = preferenceManager.getDeviceId()
    val serverUrl = preferenceManager.getServerUrl() ?: ""
    
    val connectionStatus = webSocketManager.connectionStatus
    
    val recentSmsLogs = gatewayDao.getRecentSmsLogs()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val sentCountToday = gatewayDao.getSentCountToday(getStartOfDay())
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val failedCountToday = gatewayDao.getFailedCountToday(getStartOfDay())
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    private fun getStartOfDay(): Long {
        val calendar = Calendar.getInstance()
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        return calendar.timeInMillis
    }

    fun logout() {
        preferenceManager.clear()
        webSocketManager.disconnect()
    }
}
