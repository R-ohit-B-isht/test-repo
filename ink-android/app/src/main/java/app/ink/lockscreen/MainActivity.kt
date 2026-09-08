package app.ink.lockscreen

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import app.ink.lockscreen.ui.InkApp
import app.ink.lockscreen.ui.theme.InkTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            InkTheme {
                InkApp(container = (application as InkApplication).container)
            }
        }
    }
}
