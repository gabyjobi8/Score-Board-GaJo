package com.scoreboard3x3.app

import android.content.Context
import fi.iki.elonen.NanoHTTPD
import java.io.IOException

/**
 * Serves everything under assets/web/ as static files, plus one dynamic
 * endpoint: /api/state. This is the entire "transport layer" the web
 * frontend was built to talk to — nothing else in the app (or in the
 * web JS) needs to know this server exists.
 */
class LocalServer(
    private val context: Context,
    port: Int
) : NanoHTTPD(port) {

    private val lock = Object()

    // In-memory match state, shared by the control screen (writer) and
    // the display screen (reader). Starts as "setup" so a fresh display
    // screen knows no match has been configured yet.
    private var currentStateJson: String = """{"status":"setup"}"""

    override fun serve(session: IHTTPSession): Response {
        val uri = session.uri

        if (uri == "/api/state") {
            return when (session.method) {
                Method.GET -> {
                    val body = synchronized(lock) { currentStateJson }
                    withCors(newFixedLengthResponse(Response.Status.OK, "application/json", body))
                }
                Method.POST -> {
                    val body = readRequestBody(session)
                    synchronized(lock) { currentStateJson = body }
                    withCors(newFixedLengthResponse(Response.Status.OK, "application/json", "{\"ok\":true}"))
                }
                Method.OPTIONS -> {
                    withCors(newFixedLengthResponse(Response.Status.OK, "text/plain", ""))
                }
                else -> newFixedLengthResponse(Response.Status.METHOD_NOT_ALLOWED, "text/plain", "Method not allowed")
            }
        }

        return serveStaticAsset(uri)
    }

    private fun readRequestBody(session: IHTTPSession): String {
        val contentLength = session.headers["content-length"]?.toIntOrNull() ?: 0
        if (contentLength <= 0) return "{}"
        val buffer = ByteArray(contentLength)
        var readTotal = 0
        while (readTotal < contentLength) {
            val read = session.inputStream.read(buffer, readTotal, contentLength - readTotal)
            if (read == -1) break
            readTotal += read
        }
        return String(buffer, 0, readTotal, Charsets.UTF_8)
    }

    private fun serveStaticAsset(requestUri: String): Response {
        val path = if (requestUri == "/" || requestUri.isEmpty()) "/index.html" else requestUri
        val assetPath = "web$path"
        return try {
            val stream = context.assets.open(assetPath)
            newChunkedResponse(Response.Status.OK, mimeTypeFor(assetPath), stream)
        } catch (e: IOException) {
            newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "Not found: $assetPath")
        }
    }

    private fun mimeTypeFor(path: String): String = when {
        path.endsWith(".html") -> "text/html; charset=utf-8"
        path.endsWith(".css") -> "text/css"
        path.endsWith(".js") -> "application/javascript"
        path.endsWith(".json") -> "application/json"
        path.endsWith(".png") -> "image/png"
        path.endsWith(".jpg") || path.endsWith(".jpeg") -> "image/jpeg"
        path.endsWith(".svg") -> "image/svg+xml"
        else -> "application/octet-stream"
    }

    private fun withCors(response: Response): Response {
        response.addHeader("Access-Control-Allow-Origin", "*")
        response.addHeader("Access-Control-Allow-Headers", "Content-Type")
        response.addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        return response
    }
}
