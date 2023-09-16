TODO: screenshot/logo at the top

Tenta allows you to manage sensors remotely and in real-time.

With Tenta, you can:

- Collect and store measurements and logs from sensors
- Configure and update sensors remotely
- Supervise sensors in real-time in an intuitive dashboard

Tenta is lightweight and composable. It is designed to be used as a building block in your IoT stack, together with other awesome tools like [Grafana](https://grafana.com/), [DuckDB](https://duckdb.org/), or [polars](https://www.pola.rs/).

Tenta ships with a concise and language-independent MQTT interface and a client library for Python. Sensors that communicate over LoRaWAN or HTTP can connect to Tenta via translation gateways.

## Documentation

- To get up and running with Tenta, try our [Getting Started guide](https://tenta.pages.dev/).
- The full documentation is available at [tenta.pages.dev](https://tenta.pages.dev/).
- Our [REST API documentation](https://bump.sh/empicano/doc/tenta) provides a reference for the HTTP interface.

## Research

We are open for collaborations! Tenta evolved out of the [ACROPOLIS](https://mediatum.ub.tum.de/node?id=1690527) project at [TUM](https://www.tum.de/en/). If you are interested in using Tenta in your research, don't hesitate [to reach out](mailto:felix@felixboehm.dev). We are happy to help you get started and provide support.

## License

Tenta is licensed under the [MIT License](LICENSE).

## Versioning

Tenta's MQTT, HTTP and database interfaces adhere to Semantic Versioning. Changes will be tracked in release notes. Please expect breaking changes until we reach version 1.0.0.
