package app.ink.lockscreen.wallpaper

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

/** Copies the user's picked photo into app storage so background workers can read it without URI grants. */
class PhotoStore(private val context: Context) {

    private val dir: File get() = File(context.filesDir, "wallpapers").also { it.mkdirs() }

    suspend fun import(uri: Uri): File? = withContext(Dispatchers.IO) {
        val target = File(dir, "photo_${System.currentTimeMillis()}.img")
        val ok = runCatching {
            context.contentResolver.openInputStream(uri)?.use { input ->
                target.outputStream().use { input.copyTo(it) }
            } != null
        }.getOrDefault(false)
        if (ok) {
            dir.listFiles()?.filter { it != target }?.forEach { it.delete() }
            target
        } else {
            target.delete()
            null
        }
    }

    suspend fun clear() = withContext(Dispatchers.IO) { dir.listFiles()?.forEach { it.delete() } }
}
