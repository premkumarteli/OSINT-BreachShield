package com.osint.breachshield.gateway.ui.navigation

object NavRoutes {
    const val AUTH = "admin_auth"
    const val HOME = "admin_home"
    const val USERS = "admin_users"
    const val GATEWAYS = "admin_gateways"
    const val GATEWAY_DETAIL = "admin_gateway_detail/{deviceId}"
    const val MORE = "admin_more"
    const val ALERTS = "admin_alerts"
    const val ACTIVITY = "admin_activity"
    const val BREACHES = "admin_breaches"
    const val SETTINGS = "admin_settings"

    fun gatewayDetail(deviceId: String) = "admin_gateway_detail/$deviceId"
}
