package com.osint.breachshield.gateway.ui.users

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.osint.breachshield.gateway.data.api.ActiveUserItem
import com.osint.breachshield.gateway.data.api.BlacklistRequest
import com.osint.breachshield.gateway.data.api.BreachShieldApi
import com.osint.breachshield.gateway.data.api.UserHistoryItem
import com.osint.breachshield.gateway.data.prefs.PreferenceManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class UserTab { ACTIVE, HISTORY }

@HiltViewModel
class UsersViewModel @Inject constructor(
    private val api: BreachShieldApi,
    private val preferenceManager: PreferenceManager
) : ViewModel() {

    private val _currentTab = MutableStateFlow(UserTab.ACTIVE)
    val currentTab = _currentTab.asStateFlow()

    private val _activeUsers = MutableStateFlow<List<ActiveUserItem>>(emptyList())
    val activeUsers = _activeUsers.asStateFlow()

    private val _userHistory = MutableStateFlow<List<UserHistoryItem>>(emptyList())
    val userHistory = _userHistory.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading = _isLoading.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery = _searchQuery.asStateFlow()

    private val _actionFeedback = MutableStateFlow<String?>(null)
    val actionFeedback = _actionFeedback.asStateFlow()

    init {
        fetchUsers()
    }

    fun selectTab(tab: UserTab) {
        _currentTab.value = tab
    }

    fun onSearchQueryChange(query: String) {
        _searchQuery.value = query
    }

    fun fetchUsers() {
        val token = preferenceManager.getAdminToken() ?: return
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val activeRes = api.getActiveUsers("Bearer $token")
                if (activeRes.success) {
                    _activeUsers.value = activeRes.users
                }

                val historyRes = api.getUserHistory("Bearer $token", limit = 50)
                if (historyRes.success) {
                    _userHistory.value = historyRes.history
                }
            } catch (e: Exception) {
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun terminateSession(sessionId: String) {
        val token = preferenceManager.getAdminToken() ?: return
        viewModelScope.launch {
            try {
                val res = api.terminateUserSession("Bearer $token", sessionId)
                if (res.success) {
                    _actionFeedback.value = "User session $sessionId terminated."
                    fetchUsers()
                }
            } catch (e: Exception) {
                _actionFeedback.value = "Failed to terminate: ${e.localizedMessage}"
            }
        }
    }

    fun blacklistTarget(target: String) {
        val token = preferenceManager.getAdminToken() ?: return
        viewModelScope.launch {
            try {
                val res = api.blacklistUserTarget("Bearer $token", BlacklistRequest(target, "Administrative block"))
                if (res.success) {
                    _actionFeedback.value = "Target $target blacklisted."
                    fetchUsers()
                }
            } catch (e: Exception) {
                _actionFeedback.value = "Failed to blacklist: ${e.localizedMessage}"
            }
        }
    }

    fun clearFeedback() {
        _actionFeedback.value = null
    }
}
