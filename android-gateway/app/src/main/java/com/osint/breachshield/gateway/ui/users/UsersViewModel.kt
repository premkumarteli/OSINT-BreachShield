package com.osint.breachshield.gateway.ui.users

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.osint.breachshield.gateway.data.api.ActiveUserItem
import com.osint.breachshield.gateway.data.api.BlacklistRequest
import com.osint.breachshield.gateway.data.api.BreachShieldApi
import com.osint.breachshield.gateway.data.api.UserHistoryItem
import com.osint.breachshield.gateway.data.prefs.PreferenceManager
import com.osint.breachshield.gateway.util.NetworkErrorParser
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
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

    val filteredActiveUsers = combine(_activeUsers, _searchQuery) { users, query ->
        if (query.isBlank()) users
        else users.filter {
            it.userTarget.contains(query, ignoreCase = true) ||
            it.maskedIp.contains(query, ignoreCase = true) ||
            it.browser.contains(query, ignoreCase = true) ||
            it.device.contains(query, ignoreCase = true)
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val filteredUserHistory = combine(_userHistory, _searchQuery) { history, query ->
        if (query.isBlank()) history
        else history.filter {
            it.userTarget.contains(query, ignoreCase = true) ||
            it.maskedIp.contains(query, ignoreCase = true) ||
            it.browser.contains(query, ignoreCase = true) ||
            it.device.contains(query, ignoreCase = true)
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

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
                } else {
                    _actionFeedback.value = res.error ?: res.message ?: "Failed to terminate session."
                }
            } catch (e: Exception) {
                _actionFeedback.value = "Failed to terminate: ${NetworkErrorParser.parse(e)}"
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
                } else {
                    _actionFeedback.value = res.error ?: res.message ?: "Failed to blacklist target."
                }
            } catch (e: Exception) {
                _actionFeedback.value = "Failed to blacklist: ${NetworkErrorParser.parse(e)}"
            }
        }
    }

    fun clearFeedback() {
        _actionFeedback.value = null
    }
}
