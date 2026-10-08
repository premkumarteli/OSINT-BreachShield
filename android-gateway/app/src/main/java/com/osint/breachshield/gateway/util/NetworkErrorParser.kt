package com.osint.breachshield.gateway.util

import org.json.JSONObject
import retrofit2.HttpException
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

object NetworkErrorParser {

    fun parse(throwable: Throwable): String {
        return when (throwable) {
            is HttpException -> {
                val errorBody = try {
                    throwable.response()?.errorBody()?.string()
                } catch (_: Exception) {
                    null
                }

                if (!errorBody.isNullOrBlank()) {
                    try {
                        val json = JSONObject(errorBody)
                        if (json.has("error")) {
                            return json.getString("error")
                        }
                        if (json.has("message")) {
                            return json.getString("message")
                        }
                    } catch (_: Exception) {
                        return errorBody.take(120)
                    }
                }
                when (throwable.code()) {
                    401 -> "Unauthorized session. Please re-authenticate."
                    403 -> "Access forbidden: administrative credentials required."
                    404 -> "Resource or endpoint not found on server."
                    429 -> "Rate limit reached. Please wait before retrying."
                    500 -> "Backend server internal error (500)."
                    502, 503 -> "Backend server is unavailable or starting up."
                    else -> "Server error (${throwable.code()}): ${throwable.message()}"
                }
            }
            is UnknownHostException -> {
                "Unable to resolve server address. Check your Wi-Fi network and Server URL."
            }
            is ConnectException -> {
                "Connection refused. Ensure the BreachShield backend server is running on port 5000."
            }
            is SocketTimeoutException -> {
                "Connection timed out. The backend server took too long to respond."
            }
            else -> {
                throwable.localizedMessage ?: "An unexpected network error occurred."
            }
        }
    }
}
