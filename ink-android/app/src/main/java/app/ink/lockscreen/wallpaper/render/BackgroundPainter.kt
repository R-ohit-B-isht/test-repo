package app.ink.lockscreen.wallpaper.render

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Shader
import app.ink.lockscreen.domain.model.WallpaperConfig
import java.io.File
import kotlin.math.max
import kotlin.math.roundToInt

/** Paints the photo/preset background, blur and dim layer underneath the calendar block. */
object BackgroundPainter {

    fun paint(canvas: Canvas, width: Int, height: Int, config: WallpaperConfig) {
        val photo = config.photoPath?.let { decodeCenterCropped(File(it), width, height, config.blur) }
        if (photo != null) {
            canvas.drawBitmap(photo, 0f, 0f, Paint(Paint.FILTER_BITMAP_FLAG))
            photo.recycle()
        } else {
            val shader = LinearGradient(
                0f, 0f, width * 0.3f, height.toFloat(),
                config.preset.startArgb, config.preset.endArgb, Shader.TileMode.CLAMP,
            )
            canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), Paint().apply { this.shader = shader })
        }
        if (config.dim > 0f) {
            canvas.drawColor(Color.argb((config.dim.coerceIn(0f, 0.9f) * 255).roundToInt(), 0, 0, 0))
        }
    }

    /**
     * Decodes at a size close to the target, center-crops, and applies a cheap blur by
     * downscale → upscale (no RenderScript, which is deprecated on API 31+).
     */
    private fun decodeCenterCropped(file: File, width: Int, height: Int, blur: Float): Bitmap? {
        if (!file.exists()) return null
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(file.path, bounds)
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null
        val sample = max(1, minOf(bounds.outWidth / width, bounds.outHeight / height))
        val src = BitmapFactory.decodeFile(file.path, BitmapFactory.Options().apply { inSampleSize = sample }) ?: return null

        val out = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val scale = max(width.toFloat() / src.width, height.toFloat() / src.height)
        val matrix = Matrix().apply {
            postScale(scale, scale)
            postTranslate((width - src.width * scale) / 2f, (height - src.height * scale) / 2f)
        }
        Canvas(out).drawBitmap(src, matrix, Paint(Paint.FILTER_BITMAP_FLAG))
        src.recycle()
        return if (blur > 0.02f) blurByResampling(out, blur) else out
    }

    private fun blurByResampling(bitmap: Bitmap, strength: Float): Bitmap {
        val factor = 1f / (1f + strength * 15f)
        val w = max(1, (bitmap.width * factor).toInt())
        val h = max(1, (bitmap.height * factor).toInt())
        var small = Bitmap.createScaledBitmap(bitmap, w, h, true)
        repeat(2) { small = Bitmap.createScaledBitmap(small, w, h, true) }
        val result = Bitmap.createScaledBitmap(small, bitmap.width, bitmap.height, true)
        small.recycle()
        bitmap.recycle()
        return result
    }
}
