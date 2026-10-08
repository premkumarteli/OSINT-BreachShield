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
import com.osint.breachshield.gateway.ui.dashboard.DashboardScreen
import com.osint.breachshield.gateway.ui.gateways.GatewayDetailScreen
import com.osint.breachshield.gateway.ui.gateways.GatewaysScreen
import com.osint.breachshield.gateway.ui.home.HomeScreen
import com.osint.breachshield.gateway.ui.landing.LandingScreen
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
            startDestination = if (isLoggedIn) NavRoutes.HOME else NavRoutes.LANDING,
            modifier = Modifier.fillMaxSize()
        ) {
            // Page 1: Public Citizen Landing Portal
            composable(NavRoutes.LANDING) {
                LandingScreen(
                    onNavigateToAdminAuth = {
                        navController.navigate(NavRoutes.AUTH)
                    }
                )
            }

            // Page 2: Administrator Gateway Login
            composable(NavRoutes.AUTH) {
                AdminLoginScreen(
                    onAuthSuccess = {
                        navController.navigate(NavRoutes.HOME) {
                            popUpTo(NavRoutes.LANDING) { inclusive = true }
                        }
                    },
                    onBackToLanding = {
                        navController.popBackStack()
                    }
                )
            }

            // Page 3: SOC Overview / Command Center (Figma Design)
            composable(NavRoutes.HOME) {
                HomeScreen(
                    onNavigateToUsers = { navController.navigate(NavRoutes.USERS) },
                    onNavigateToGateways = { navController.navigate(NavRoutes.GATEWAYS) },
                    onNavigateToAlerts = { navController.navigate(NavRoutes.ALERTS) }
                )
            }

            // Page 4: Citizen Forensics & Active Sessions (Figma Design)
            composable(NavRoutes.USERS) {
                UsersScreen()
            }

            // Page 5: Gateways & Physical SIM Relay (Figma Design)
            composable(NavRoutes.GATEWAYS) {
                GatewaysScreen(
                    onSelectGateway = { deviceId ->
                        navController.navigate(NavRoutes.gatewayDetail(deviceId))
                    },
                    onNavigateToConsole = {
                        navController.navigate(NavRoutes.GATEWAY_CONSOLE)
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

            // Hardware SIM Relay Console
            composable(NavRoutes.GATEWAY_CONSOLE) {
                DashboardScreen(
                    onBack = { navController.popBackStack() },
                    onLogout = {
                        onLogout()
                        navController.navigate(NavRoutes.LANDING) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }

            // Navigation Hub (Security, System, Settings)
            composable(NavRoutes.MORE) {
                MoreScreen(
                    onNavigateToAlerts = { navController.navigate(NavRoutes.ALERTS) },
                    onNavigateToActivity = { navController.navigate(NavRoutes.ACTIVITY) },
                    onNavigateToBreaches = { navController.navigate(NavRoutes.BREACHES) },
                    onNavigateToSettings = { navController.navigate(NavRoutes.SETTINGS) },
                    onNavigateToGatewayConsole = { navController.navigate(NavRoutes.GATEWAY_CONSOLE) },
                    onLogout = {
                        onLogout()
                        navController.navigate(NavRoutes.LANDING) {
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

        // Floating Bottom Nav Bar visible on primary 4 SOC destinations
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
