package com.osint.breachshield.gateway.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.navArgument
import com.osint.breachshield.gateway.ui.auth.AdminLoginScreen
import com.osint.breachshield.gateway.ui.components.FloatingBottomBar
import com.osint.breachshield.gateway.ui.gateways.GatewayDetailScreen
import com.osint.breachshield.gateway.ui.gateways.GatewaysScreen
import com.osint.breachshield.gateway.ui.home.HomeScreen
import com.osint.breachshield.gateway.ui.more.*
import com.osint.breachshield.gateway.ui.users.UsersScreen

@Composable
fun AppNavigation(
    navController: NavHostController,
    isLoggedIn: Boolean,
    onLogout: () -> Unit
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val isMainTab = currentRoute in listOf(
        NavRoutes.HOME,
        NavRoutes.USERS,
        NavRoutes.GATEWAYS,
        NavRoutes.MORE
    )

    Box(modifier = Modifier.fillMaxSize()) {
        NavHost(
            navController = navController,
            startDestination = if (isLoggedIn) NavRoutes.HOME else NavRoutes.AUTH,
            modifier = Modifier.fillMaxSize()
        ) {
            composable(NavRoutes.AUTH) {
                AdminLoginScreen(
                    onAuthSuccess = {
                        navController.navigate(NavRoutes.HOME) {
                            popUpTo(NavRoutes.AUTH) { inclusive = true }
                        }
                    }
                )
            }

            composable(NavRoutes.HOME) {
                HomeScreen(
                    onNavigateToUsers = { navController.navigate(NavRoutes.USERS) },
                    onNavigateToGateways = { navController.navigate(NavRoutes.GATEWAYS) },
                    onNavigateToAlerts = { navController.navigate(NavRoutes.ALERTS) }
                )
            }

            composable(NavRoutes.USERS) {
                UsersScreen()
            }

            composable(NavRoutes.GATEWAYS) {
                GatewaysScreen(
                    onSelectGateway = { deviceId ->
                        navController.navigate(NavRoutes.gatewayDetail(deviceId))
                    }
                )
            }

            composable(
                route = NavRoutes.GATEWAY_DETAIL,
                arguments = listOf(navArgument("deviceId") { type = NavType.StringType })
            ) { backStack ->
                val deviceId = backStack.arguments?.getString("deviceId") ?: ""
                GatewayDetailScreen(
                    deviceId = deviceId,
                    onBack = { navController.popBackStack() }
                )
            }

            composable(NavRoutes.MORE) {
                MoreScreen(
                    onNavigateToAlerts = { navController.navigate(NavRoutes.ALERTS) },
                    onNavigateToActivity = { navController.navigate(NavRoutes.ACTIVITY) },
                    onNavigateToBreaches = { navController.navigate(NavRoutes.BREACHES) },
                    onNavigateToSettings = { navController.navigate(NavRoutes.SETTINGS) },
                    onLogout = {
                        onLogout()
                        navController.navigate(NavRoutes.AUTH) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }

            composable(NavRoutes.ALERTS) {
                AlertsScreen(onBack = { navController.popBackStack() })
            }

            composable(NavRoutes.ACTIVITY) {
                ActivityScreen(onBack = { navController.popBackStack() })
            }

            composable(NavRoutes.BREACHES) {
                BreachIntelligenceScreen(onBack = { navController.popBackStack() })
            }

            composable(NavRoutes.SETTINGS) {
                SettingsScreen(onBack = { navController.popBackStack() })
            }
        }

        // Floating Bottom Nav Bar visible only on primary 4 destinations
        if (isMainTab) {
            FloatingBottomBar(
                currentRoute = currentRoute,
                onNavigate = { route ->
                    navController.navigate(route) {
                        popUpTo(NavRoutes.HOME) { saveState = true }
                        launchSingleTop = true
                        restoreState = true
                    }
                },
                modifier = Modifier.align(Alignment.BottomCenter)
            )
        }
    }
}
