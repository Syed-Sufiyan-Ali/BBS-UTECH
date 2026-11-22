package com.example.location

import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Looper
import androidx.core.content.ContextCompat
import com.example.data.model.UserLocation
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlin.math.abs

class LocationHelper(private val context: Context) : LocationListener, SensorEventListener {

    private val locationManager: LocationManager? by lazy {
        try {
            context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        } catch (_: Exception) {
            null
        }
    }

    private val sensorManager: SensorManager? by lazy {
        try {
            context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
        } catch (_: Exception) {
            null
        }
    }

    // Real GPS location only — null until a real device fix is received
    private val _currentLocation = MutableStateFlow<UserLocation?>(null)
    val currentLocation: StateFlow<UserLocation?> = _currentLocation.asStateFlow()

    private val _compassAzimuth = MutableStateFlow(0f)
    val compassAzimuth: StateFlow<Float> = _compassAzimuth.asStateFlow()

    private val _isGpsActive = MutableStateFlow(false)
    val isGpsActive: StateFlow<Boolean> = _isGpsActive.asStateFlow()

    private var lastEmittedAzimuth = 0f
    private var lastSensorUpdateTime = 0L

    private fun isPermissionGranted(): Boolean {
        return try {
            val fine = ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
            val coarse = ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.ACCESS_COARSE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
            fine || coarse
        } catch (_: Exception) {
            false
        }
    }

    private val _hasLocationPermission = MutableStateFlow(isPermissionGranted())
    val hasLocationPermission: StateFlow<Boolean> = _hasLocationPermission.asStateFlow()

    private val rotationMatrix = FloatArray(9)
    private val orientationAngles = FloatArray(3)
    private var isListeningToLocation = false
    private var isListeningToSensor = false

    fun checkHasPermission(): Boolean {
        val has = isPermissionGranted()
        _hasLocationPermission.value = has
        return has
    }

    @SuppressLint("MissingPermission")
    fun startLocationUpdates() {
        if (!checkHasPermission() || locationManager == null) {
            _isGpsActive.value = false
            return
        }

        try {
            // Pull freshest last-known real fix immediately
            val lastGps = try { locationManager?.getLastKnownLocation(LocationManager.GPS_PROVIDER) } catch (_: Exception) { null }
            val lastNetwork = try { locationManager?.getLastKnownLocation(LocationManager.NETWORK_PROVIDER) } catch (_: Exception) { null }
            val lastPassive = try { locationManager?.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER) } catch (_: Exception) { null }

            val best = listOfNotNull(lastGps, lastNetwork, lastPassive)
                .maxByOrNull { it.time }

            if (best != null && _currentLocation.value == null) {
                _currentLocation.value = UserLocation(
                    latitude = best.latitude,
                    longitude = best.longitude,
                    isSimulated = false,
                    label = "Live GPS Location",
                    accuracyMeters = if (best.hasAccuracy()) best.accuracy else null
                )
            }

            if (!isListeningToLocation) {
                val isGpsEnabled = try { locationManager?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true } catch (_: Exception) { false }
                val isNetEnabled = try { locationManager?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true } catch (_: Exception) { false }

                val providersToListen = mutableListOf<String>()
                if (isGpsEnabled) providersToListen.add(LocationManager.GPS_PROVIDER)
                if (isNetEnabled) providersToListen.add(LocationManager.NETWORK_PROVIDER)
                if (providersToListen.isEmpty()) providersToListen.add(LocationManager.PASSIVE_PROVIDER)

                for (prov in providersToListen) {
                    try {
                        locationManager?.requestLocationUpdates(
                            prov,
                            2000L, // 2 seconds interval for smooth live GPS tracking
                            1f,    // 1 meter displacement
                            this,
                            Looper.getMainLooper()
                        )
                        isListeningToLocation = true
                        _isGpsActive.value = true
                    } catch (_: Exception) { }
                }
            }
        } catch (_: Exception) {
            _isGpsActive.value = false
        }

        if (!isListeningToSensor) {
            try {
                sensorManager?.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR)?.let { sensor ->
                    sensorManager?.registerListener(this, sensor, SensorManager.SENSOR_DELAY_NORMAL)
                    isListeningToSensor = true
                }
            } catch (_: Exception) { }
        }
    }

    fun stopLocationUpdates() {
        try {
            if (isListeningToLocation) {
                locationManager?.removeUpdates(this)
                isListeningToLocation = false
            }
            if (isListeningToSensor) {
                sensorManager?.unregisterListener(this)
                isListeningToSensor = false
            }
            _isGpsActive.value = false
        } catch (_: Exception) { }
    }

    fun setSimulatedLocation(userLocation: UserLocation) {
        _currentLocation.value = userLocation
    }

    fun switchToLiveGps() {
        if (checkHasPermission()) {
            startLocationUpdates()
        }
    }

    override fun onLocationChanged(location: Location) {
        try {
            _currentLocation.value = UserLocation(
                latitude = location.latitude,
                longitude = location.longitude,
                isSimulated = false,
                label = "Live GPS Location",
                accuracyMeters = if (location.hasAccuracy()) location.accuracy else null
            )
            _isGpsActive.value = true
        } catch (_: Exception) { }
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event == null) return
        try {
            val now = System.currentTimeMillis()
            if (now - lastSensorUpdateTime < 150) return

            if (event.sensor.type == Sensor.TYPE_ROTATION_VECTOR && event.values.isNotEmpty()) {
                SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values)
                SensorManager.getOrientation(rotationMatrix, orientationAngles)
                val azimuthDegrees = Math.toDegrees(orientationAngles[0].toDouble()).toFloat()
                val normalized = (azimuthDegrees + 360) % 360

                if (abs(normalized - lastEmittedAzimuth) >= 4f) {
                    lastEmittedAzimuth = normalized
                    lastSensorUpdateTime = now
                    _compassAzimuth.value = normalized
                }
            }
        } catch (_: Exception) { }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
    override fun onProviderEnabled(provider: String) {
        startLocationUpdates()
    }
    override fun onProviderDisabled(provider: String) {}
    @Deprecated("Deprecated in Java")
    override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
}
