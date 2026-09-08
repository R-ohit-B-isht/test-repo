package app.ink.lockscreen.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.StickyNote2
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import app.ink.lockscreen.AppContainer
import app.ink.lockscreen.ui.calendar.CalendarScreen
import app.ink.lockscreen.ui.discover.DiscoverScreen
import app.ink.lockscreen.ui.notes.NotesScreen
import app.ink.lockscreen.ui.settings.SettingsScreen
import app.ink.lockscreen.ui.tasks.TasksScreen
import app.ink.lockscreen.ui.theme.InkColors
import app.ink.lockscreen.ui.wallpaper.WallpaperEditorScreen

sealed class Route(val path: String) {
    data object Discover : Route("discover")
    data object Calendar : Route("calendar")
    data object Tasks : Route("tasks")
    data object Notes : Route("notes")
    data object Wallpaper : Route("wallpaper")
    data object Settings : Route("settings")
}

private data class Tab(val route: Route, val label: String, val icon: ImageVector)

private val tabs = listOf(
    Tab(Route.Discover, "Discover", Icons.Outlined.Explore),
    Tab(Route.Calendar, "Calendar", Icons.Outlined.CalendarMonth),
    Tab(Route.Tasks, "Tasks", Icons.Outlined.CheckCircle),
    Tab(Route.Notes, "Notes", Icons.Outlined.StickyNote2),
)

@Composable
fun InkApp(container: AppContainer) {
    val nav = rememberNavController()
    val backStack by nav.currentBackStackEntryAsState()
    val current = backStack?.destination?.route
    val showBar = tabs.any { it.route.path == current }

    Scaffold(
        containerColor = InkColors.Paper,
        bottomBar = {
            if (showBar) {
                NavigationBar(containerColor = InkColors.Card, tonalElevation = 0.dp) {
                    tabs.forEach { tab ->
                        NavigationBarItem(
                            selected = current == tab.route.path,
                            onClick = {
                                nav.navigate(tab.route.path) {
                                    popUpTo(nav.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { Text(tab.label) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = InkColors.Navy,
                                selectedTextColor = InkColors.Navy,
                                indicatorColor = InkColors.Mist,
                                unselectedIconColor = InkColors.Muted,
                                unselectedTextColor = InkColors.Muted,
                            ),
                        )
                    }
                }
            }
        },
    ) { padding ->
        NavHost(nav, startDestination = Route.Discover.path, modifier = Modifier.padding(padding)) {
            composable(Route.Discover.path) {
                DiscoverScreen(
                    container = container,
                    onOpenWallpaper = { nav.navigate(Route.Wallpaper.path) },
                    onOpenSettings = { nav.navigate(Route.Settings.path) },
                )
            }
            composable(Route.Calendar.path) { CalendarScreen(container) }
            composable(Route.Tasks.path) { TasksScreen(container) }
            composable(Route.Notes.path) { NotesScreen(container) }
            composable(Route.Wallpaper.path) { WallpaperEditorScreen(container, onBack = { nav.popBackStack() }) }
            composable(Route.Settings.path) { SettingsScreen(container, onBack = { nav.popBackStack() }) }
        }
    }
}
