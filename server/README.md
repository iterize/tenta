The server exposes a REST API. You can find the documentation at [https://bump.sh/empicano/doc/tenta](https://bump.sh/empicano/doc/tenta).

## MQTT communication

The communication between the sensors and the server runs over four MQTT topics:

- `configurations/<sensor-identifier>` for configurations from the server
- `acknowledgments/<sensor-identifier>` for configuration acknowledgments from sensors
- `measurements/<sensor-identifier>` for measurements from sensors
- `logs/<sensor-identifier>` for logs from sensors

### Payloads

The payloads are JSON encoded and have the following structure:

**`configurations/<sensor-identifier>`:**

```json
{
  "revision": 0,
  "configuration": {} // this can be any valid JSON
}
```

**`acknowledgments/<sensor-identifier>`:**

```json
{
  // the array structure allows to batch messages
  "acknowledgments": [
    {
      "revision": 0,
      "timestamp": 1683645000.0,
      "success": true // did the sensor successfully process the configuration?
    }
  ]
}
```

**`measurements/<sensor-identifier>`:**

```json
{
  // the array structure allows to batch messages
  "measurements": [
    {
      "revision": 0, // optional parameter
      "timestamp": 1683645000.0,
      "value": {} // this contains data points with type double
    }
  ]
}
```

**`logs/<sensor-identifier>`:**

```json
{
  // the array structure allows to batch messages
  "logs": [
    {
      "severity": "error", // one of info, warning, error
      "revision": 0, // optional parameter
      "timestamp": 1683645000.0,
      "subject": "The CPU is burning",
      "details": "Please call the fire department" // optional parameter
    }
  ]
}
```

## Development Setup

- Install the Python version noted in `.python-version` via `pyenv`
- Install the dependencies via `./scripts/setup`
- Run the tests via `./scripts/test`
- Format and lint the code via `./scripts/check`
- Start a development instance with pre-populated example data via `./scripts/develop`

## Deployment

The server is backed by PostgreSQL and an MQTT broker. During development and testing these services are automatically spun up locally for you. In production, it's better to deploy them independently from the server. Cloud providers can help with this.

When you have your PostgreSQL instance and the MQTT broker ready:

- specify your environment variables in a `.env` file (see `.env.example`)
- initialize the database via `(set -a && source .env && ./scripts/initialize)`
- build the Docker image via `./scripts/build`
