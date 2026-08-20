package com.osint.breachshield.gateway.di

import android.content.Context
import androidx.room.Room
import com.google.gson.Gson
import com.osint.breachshield.gateway.data.api.BreachShieldApi
import com.osint.breachshield.gateway.data.db.GatewayDao
import com.osint.breachshield.gateway.data.db.GatewayDatabase
import com.osint.breachshield.gateway.data.prefs.PreferenceManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideGson(): Gson = Gson()

    @Provides
    @Singleton
    fun provideOkHttpClient(preferenceManager: PreferenceManager): OkHttpClient {
        val logging = HttpLoggingInterceptor { message ->
            android.util.Log.d("OkHttp", message)
        }.apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val dynamicHostInterceptor = Interceptor { chain ->
            var request = chain.request()
            val rawServerUrl = preferenceManager.getServerUrl()
            if (rawServerUrl.isNotBlank() && rawServerUrl.startsWith("http")) {
                val newUrl = rawServerUrl.toHttpUrlOrNull()
                if (newUrl != null) {
                    val updatedHttpUrl = request.url.newBuilder()
                        .scheme(newUrl.scheme)
                        .host(newUrl.host)
                        .port(newUrl.port)
                        .build()
                    request = request.newBuilder().url(updatedHttpUrl).build()
                }
            }
            chain.proceed(request)
        }

        return OkHttpClient.Builder()
            .addInterceptor(dynamicHostInterceptor)
            .addInterceptor(logging)
            .connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
            .writeTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): GatewayDatabase {
        return Room.databaseBuilder(
            context,
            GatewayDatabase::class.java,
            "breachshield_gateway.db"
        ).build()
    }

    @Provides
    fun provideGatewayDao(db: GatewayDatabase): GatewayDao = db.gatewayDao()

    @Provides
    @Singleton
    fun provideBreachShieldApi(okHttpClient: OkHttpClient): BreachShieldApi {
        return Retrofit.Builder()
            .baseUrl("http://localhost:5000/")
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(BreachShieldApi::class.java)
    }
}
