- Screenshot/Logo at the top

## Pitch

Wireless sensor networks provide the necessary data for effective measures to reduce emissions and combat climate change. However, these networks are prone to failure and failures often go undetected since it’s prohibitively time-consuming to physically check on the sensors.

- collect and store data from sensors
- provide a dashboard to supervise sensors in real-time
- remote configuration / software updates
- wide range of sensor networks: LoRaWAN, MQTT, static, mobile, ... (modularity)

Tenta is **lightweight** and **composable**. We only do sensor management, no processing and no (fancy) visualization. There are already great tools that do that (e.g. Grafana, polars). This allows us to focus on the basics and get those perfect: Collecting measurements and a real-time dashboard to manage and configure sensors.

## Roadmap

1. Real-time charts of the incoming data on the dashboard
1. Compress data in the database to use less storage
1. Indicator if sensors are currently connected to the MQTT broker
1. Tagging system to record metadata (e.g. nearby construction work, changes to the hardware, ...)
1. Demo instance to make Tenta easy to try out

## Versioning

This project adheres to [Semantic Versioning](https://semver.org). Please expect breaking changes until we reach version 1.0.0. Note that only the MQTT and database interfaces are subject to semantic versioning. Although changes will be tracked in release notes, Tenta's REST API is considered internal and may change at any time.
