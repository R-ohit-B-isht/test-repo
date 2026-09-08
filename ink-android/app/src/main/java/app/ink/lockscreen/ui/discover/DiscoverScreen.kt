package app.ink.lockscreen.ui.discover

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.ink.lockscreen.AppContainer
import app.ink.lockscreen.domain.model.WallpaperLayout
import app.ink.lockscreen.ui.components.PillRow
import app.ink.lockscreen.ui.components.SectionHeader
import app.ink.lockscreen.ui.inkViewModel
import app.ink.lockscreen.ui.theme.InkColors
import app.ink.lockscreen.widget.WidgetUpdater

@Composable
fun DiscoverScreen(container: AppContainer, onOpenWallpaper: () -> Unit, onOpenSettings: () -> Unit) {
    val vm = inkViewModel { DiscoverViewModel(container) }
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }

    LaunchedEffect(Unit) { vm.renderPreviews() }
    LaunchedEffect(state.message) {
        state.message?.let { snackbar.showSnackbar(it); vm.consumeMessage() }
    }

    Column(Modifier.fillMaxSize()) {
        LazyColumn(Modifier.weight(1f), contentPadding = PaddingValues(bottom = 24.dp)) {
            item {
                Row(
                    Modifier.fillMaxWidth().padding(start = 20.dp, end = 8.dp, top = 16.dp, bottom = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Discover", style = MaterialTheme.typography.headlineLarge)
                    Spacer(Modifier.weight(1f))
                    IconButton(onClick = onOpenSettings) {
                        Icon(Icons.Outlined.Settings, contentDescription = "Settings", tint = InkColors.Navy)
                    }
                }
            }
            item {
                SetupBanner(
                    active = state.config.autoRefresh,
                    layoutLabel = state.config.layout.label,
                    onCustomize = onOpenWallpaper,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp),
                )
            }

            item { Spacer(Modifier.height(16.dp)); SectionHeader("Lockscreen", count = state.designs.size, action = "Customize", onAction = onOpenWallpaper) }
            item {
                PillRow(
                    options = listOf<WallpaperLayout?>(null) + WallpaperLayout.entries,
                    selected = state.filter,
                    label = { it?.label ?: "All" },
                    onSelect = vm::setFilter,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp),
                )
            }
            item {
                LazyRow(contentPadding = PaddingValues(horizontal = 20.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(state.designs, key = { it.id }) { design ->
                        DesignCard(
                            design = design,
                            preview = state.previews[design.id],
                            isCurrent = state.config.autoRefresh && state.config.layout == design.layout && state.config.preset == design.preset,
                            busy = state.applying,
                            onApply = { vm.applyDesign(design) },
                        )
                    }
                }
            }

            item { Spacer(Modifier.height(28.dp)); SectionHeader("Live schedule") }
            item {
                LiveScheduleCard(
                    enabled = state.settings.liveScheduleEnabled,
                    onToggle = vm::setLiveSchedule,
                    modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp),
                )
            }

            item { Spacer(Modifier.height(16.dp)); SectionHeader("Widgets", count = WidgetUpdater.Kind.entries.size) }
            item {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    items(WidgetUpdater.Kind.entries) { kind -> WidgetCard(kind, onAdd = { vm.pinWidget(kind) }) }
                }
            }
        }
        SnackbarHost(snackbar)
    }
}
