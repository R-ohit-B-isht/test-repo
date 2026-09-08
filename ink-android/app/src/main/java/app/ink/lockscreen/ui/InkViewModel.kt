package app.ink.lockscreen.ui

import androidx.compose.runtime.Composable
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel

/** Creates a ViewModel from the manual [app.ink.lockscreen.AppContainer] graph. */
@Composable
inline fun <reified VM : ViewModel> inkViewModel(crossinline create: () -> VM): VM = viewModel(
    factory = object : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T = create() as T
    },
)
