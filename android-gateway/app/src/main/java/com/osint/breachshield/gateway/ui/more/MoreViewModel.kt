package com.osint.breachshield.gateway.ui.more

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.osint.breachshield.gateway.data.api.*
import com.osint.breachshield.gateway.data.prefs.PreferenceManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MoreViewModel @Inject constructor(
    private val api: BreachShieldApi,
    private val preferenceManager: PreferenceManager
) : ViewModel() {

    private val _alerts = MutableStateFlow<List<AlertItem>>(emptyList())
    val alerts = _alerts.asStateFlow()

    private val _activity = MutableStateFlow<List<ActivityItem>>(emptyList())
    val activity = _activity.asStateFlow()

    private val _breachData = MutableStateFlow<BreachesResponse?>(null)
    val breachData = _breachData.asStateFlow()

    private val _settings = MutableStateFlow<AppSettingsDto?>(null)
    val settings = _settings.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading = _isLoading.asStateFlow()

    init {
        loadAll()
    }

    fun loadAll() {
        val token = preferenceManager.getAdminToken() ?: return
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val alertsRes = api.getAlerts("Bearer $token")
                if (alertsRes.success) _alerts.value = alertsRes.alerts

                val actRes = api.getActivity("Bearer $token")
                if (actRes.success) _activity.value = actRes.activity

                val breachRes = api.getBreaches("Bearer $token")
                if (breachRes.success) _breachData.value = breachRes

                val setRes = api.getSettings("Bearer $token")
                if (setRes.success) _settings.value = setRes.settings
            } catch (e: Exception) {
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun logout(onLogoutSuccess: () -> Unit) {
        preferenceManager.clearAdminAuth()
        onLogoutSuccess()
    }
}
