# MQTT communication

The communication between the sensors and the server runs over four MQTT topics:

- `configurations/<sensor-identifier>`: Configurations **to** sensors
- `acknowledgments/<sensor-identifier>`: Configuration acknowledgments **from** sensors
- `measurements/<sensor-identifier>`: Measurements **from** sensors
- `logs/<sensor-identifier>`: Logs **from** sensors

## Payloads

The payloads are JSON encoded and have the following structure:

**`configurations/<sensor-identifier>`:**

```json
{
  "revision": 0,
  "configuration": {} // Can be any valid JSON object
}
```

**`acknowledgments/<sensor-identifier>`:**

```json
// Array structure allows to batch messages
[
  {
    "revision": 0,
    "timestamp": 1683645000.0,
    "success": true // Did the sensor successfully process the configuration?
  }
]
```

**`measurements/<sensor-identifier>`:**

```json
// Array structure allows to batch messages
[
  {
    "revision": 0, // Optional
    "timestamp": 1683645000.0,
    "value": {
      // Data points have type double
      "temperature": 23.1,
      "humidity": 0.62
    }
  }
]
```

**`logs/<sensor-identifier>`:**

```json
// Array structure allows to batch messages
[
  {
    "severity": "error", // One of: info, warning, error
    "revision": 0, // Optional
    "timestamp": 1683645000.0,
    "message": "The CPU is burning; Please call the fire department."
  }
]
```