package com.scoreboard3x3.app

import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import java.net.Inet4Address
import java.net.NetworkInterface
import java.util.Collections

class MainActivity : AppCompatActivity() {

    private lateinit var server: LocalServer
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        server = LocalServer(applicationContext, PORT)
        server.start()

        webView = WebView(this)
        setContentView(webView)

        webView.webViewClient = WebViewClient()
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

        val host = localIpAddress() ?: "127.0.0.1"
        if (host == "127.0.0.1") {
            Toast.makeText(
                this,
                "تعذر تحديد عنوان الشبكة المحلية. تأكد من الاتصال بالواي فاي.",
                Toast.LENGTH_LONG
            ).show()
        }

        // Loading via the LAN IP (not 127.0.0.1) means links the control
        // page builds for the display device (window.location.href) are
        // correct out of the box.
        webView.loadUrl("http://$host:$PORT/index.html")
    }

    override fun onDestroy() {
        server.stop()
        super.onDestroy()
    }

    /** Finds this device's LAN IPv4 address (Wi-Fi or hotspot), skipping loopback. */
    private fun localIpAddress(): String? {
        return try {
            val interfaces = Collections.list(NetworkInterface.getNetworkInterfaces())
            for (intf in interfaces) {
                val addresses = Collections.list(intf.inetAddresses)
                for (addr in addresses) {
                    if (!addr.isLoopbackAddress && addr is Inet4Address) {
                        return addr.hostAddress
                    }
                }
            }
            null
        } catch (e: Exception) {
            null
        }
    }

    companion object {
        const val PORT = 8080
    }
}
