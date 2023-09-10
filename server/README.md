The server exposes a REST API. You can find the documentation at [https://bump.sh/empicano/doc/tenta](https://bump.sh/empicano/doc/tenta).

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
