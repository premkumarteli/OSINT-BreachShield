package com.osint.breachshield.gateway.ui.more

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.osint.breachshield.gateway.ui.components.GlassCard
import com.osint.breachshield.gateway.ui.components.StatusBadge
import com.osint.breachshield.gateway.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BreachIntelligenceScreen(
    onBack: () -> Unit,
    viewModel: MoreViewModel = hiltViewModel()
) {
    val breachData by viewModel.breachData.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Breach Intelligence", color = SlateTextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace) },
                navigationIcon = { TextButton(onClick = onBack) { Text("← Back", color = AccentCyan) } },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ObsidianBg)
            )
        },
        containerColor = ObsidianBg
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = 40.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Index Status Card
            item {
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("INDEX STATUS", color = SlateTextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            Text("Operational", color = MatrixGreen, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                        }
                        StatusBadge(status = breachData?.indexStatus ?: "HEALTHY")
                    }
                }
            }

            // Datasets List
            item {
                Text("DATASETS & REPOSITORIES", color = SlateTextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
            }

            val datasets = breachData?.datasets ?: emptyList()
            items(datasets) { ds ->
                GlassCard(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(ds.name, color = SlateTextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("Discovery Year: ${ds.year}", color = SlateTextSecondary, fontSize = 11.sp)
                            if (ds.records != null) {
                                Text("Records: ${ds.records}", color = AccentCyan, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                            }
                        }
                        StatusBadge(status = ds.status)
                    }
                }
            }
        }
    }
}
