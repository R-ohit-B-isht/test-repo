package app.ink.lockscreen.ui.wallpaper

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.ink.lockscreen.AppContainer
import app.ink.lockscreen.ui.components.PillRow
import app.ink.lockscreen.ui.inkViewModel
import app.ink.lockscreen.ui.theme.InkColors

@Composable
fun WallpaperEditorScreen(container: AppContainer, onBack: () -> Unit) {
    val vm = inkViewModel { WallpaperEditorViewModel(container) }
    val state by vm.state.collectAsStateWithLifecycle()
    val snackbar = remember { SnackbarHostState() }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri -> uri?.let(vm::pickPhoto) }

    LaunchedEffect(state.message) { state.message?.let { snackbar.showSnackbar(it); vm.consumeMessage() } }

    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = "Back", tint = InkColors.Navy) }
            Text("Lock screen", style = MaterialTheme.typography.titleMedium)
        }
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
            Box(
                Modifier
                    .padding(horizontal = 96.dp)
                    .fillMaxWidth()
                    .aspectRatio(540f / 1170f)
                    .clip(MaterialTheme.shapes.large)
                    .background(InkColors.Mist)
                    .align(Alignment.CenterHorizontally),
            ) {
                state.preview?.let {
                    Image(it.asImageBitmap(), contentDescription = "Lock screen preview", contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                    LockScreenChrome(use24Hour = state.use24Hour, textColor = Color(state.draft.textArgb))
                }
            }
            Spacer(Modifier.height(16.dp))
            PillRow(
                options = EditorTab.entries,
                selected = state.tab,
                label = { it.label },
                onSelect = vm::selectTab,
                modifier = Modifier.padding(horizontal = 20.dp),
            )
            Spacer(Modifier.height(12.dp))
            Box(Modifier.padding(horizontal = 20.dp)) {
                when (state.tab) {
                    EditorTab.BACKGROUND -> BackgroundPanel(
                        draft = state.draft,
                        onEdit = vm::edit,
                        onPickPhoto = { picker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) },
                        onClearPhoto = vm::clearPhoto,
                    )
                    EditorTab.CALENDAR -> CalendarPanel(draft = state.draft, onEdit = vm::edit)
                    EditorTab.STYLE -> StylePanel(draft = state.draft, onEdit = vm::edit)
                }
            }
            Spacer(Modifier.height(24.dp))
        }
        SnackbarHost(snackbar)
        Button(
            onClick = vm::setAsCurrent,
            enabled = state.loaded && !state.applying,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 12.dp).height(52.dp),
            colors = ButtonDefaults.buttonColors(containerColor = InkColors.Navy),
        ) {
            Text(if (state.applying) "Applying…" else "Set as current", style = MaterialTheme.typography.titleMedium)
        }
    }
}
