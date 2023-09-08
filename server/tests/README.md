- The `data.json` file contains the example data that is loaded into the database during tests. It is also used to populate the database when you run the `./scripts/develop` script. Editing this file will break the tests but can be useful during development.
- The tests expect available PostgreSQL+TimescaleDB and Mosquitto instances. This is consistent with the production environment. These services are automatically spun up locally inside the `./scripts/test` and `./scripts/develop` scripts.