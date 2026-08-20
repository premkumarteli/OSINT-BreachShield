package com.osint.breachshield.gateway.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.osint.breachshield.gateway.data.api.BreachShieldApi
import com.osint.breachshield.gateway.data.api.OverviewData
import com.osint.breachshield.gateway.data.api.OverviewMetrics
import com.osint.breachshield.gateway.data.prefs.PreferenceManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val api: BreachShieldApi,
    private val preferenceManager: PreferenceManager
) : ViewModel() {

    private val _overview = MutableStateFlow<OverviewData?>(null)
    val overview = _overview.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing = _isRefreshing.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage = _errorMessage.asStateFlow()

    init {
        fetchOverview()
        startPeriodicRefresh()
    }

    fun fetchOverview() {
        val token = preferenceManager.getAdminToken() ?: return
        viewModelScope.launch {
            _isRefreshing.value = true
            _errorMessage.value = null
            try {
                val res = api.getOverview("Bearer $token")
                if (res.success) {
                    _overview.value = res.data
                }
            } catch (e: Exception) {
                _errorMessage.value = e.localizedMessage
            } finally {
                _isRefreshing.value = false
            }
        }
    }

    private fun startPeriodicRefresh() {
        viewModelScope.launch {
            while (true) {
                delay(15000)
                val token = preferenceManager.getAdminToken()
                if (!token.isNullOrBlank()) {
                    try {
                        val res = api.getOverview("Bearer $token")
                        if (res.success) {
                            _overview.value = res.data
                        }
                    } catch (e: Exception) {}
                }
            }
        }
    }
}
