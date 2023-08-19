# Design decisions

## Delegation of processing and (elaborate) visualization

We adhere to the Unix philosophy in that Tenta does only thing, and does it well: manage sensor networks. Tenta collects data from sensors and allows you to supervise and configure them remotely. Tenta does not process the data and does not allow you to visualize more elaborate things than real-time line charts over raw data.

There are multiple reasons why this is a good idea:

1. The open-source ecosystem already has excellent tools for processing and visualization, e.g. polars and Grafana. By not reinventing the wheel here, we can focus on the core functionality of Tenta. Additionally, processing and visualization vary immensely between projects, which means that we'd probably only end up with a very complex system that still doesn't work for everyone.
1. Tenta stores the raw data it receives from the sensors as is and does not modify it. You accidentally deleted all the data while processing it outside of Tenta? Don't worry, Tenta is your source of truth.
1. Analyzing data in real-time is often not possible, nor useful. You might want to try out and compare different processing methods, or you might want to reprocess all your data when you find a bug in your pipeline. Or you might depend on metadata or external sources that are only available at a later point in time, etc.
1. Processing can be expensive. Depending on your needs, processing can take hours or even days. Tenta, on the other hand, is designed to show you the status of your sensors in real-time.

Naturally, we designed Tenta's interfaces to work well with other tools and provide documentation and examples about e.g. how to get data out of Tenta to process it.

## PostgreSQL+TimescaleDB

Tenta stores all data in a PostgreSQL database with the TimescaleDB extension. TimescaleDB allows us to optimize certain tables for time-series data, while still being able to use most of the features of PostgreSQL (e.g. joins).

Apart from time-series data like measurements, we also need to store highly relational information e.g. about users, networks, or session tokens. The benefit of TimescaleDB over other time-series databases (e.g. InfluxDB) is that we can do all this in a single data store. This makes our setup simple and robust.

## MQTT over HTTP and LoRaWAN

Tenta uses MQTT to communicate with sensors. MQTT is a lightweight publish-subscribe protocol designed for resource-constrained devices and unreliable network connections.

HTTP would be a viable alternative to relay measurements from the sensors to Tenta. However, to configure the sensors in real-time, we need a bidirectional communication channel. Additionally, MQTT uses less bandwidth, which is important for remote sensors that are connected via the cellular network. Configurations are persisted on the MQTT broker, in case you prefer polling.

Tenta does not directly support LoRaWAN. You can use a LoRaWAN gateway to translate messages between the sensors and Tenta. This is a common setup that allows you to connect sensors communicating both over MQTT or LoRaWAN to a single Tenta instance.

## Structure of measurements

Measurements are stored in a single table in the database. This table has an `attribute` column (string) and a `value` column (double-precision floating-point). Measurements arrive as JSON documents at the server which stores each key-value pair as a separate row. If your measurements consist of values for temperature and humidity, for instance, the server will store them as two rows in the database.

This approach is simple and flexible. You can store any kind of measurement without having to define a schema beforehand, and you can change the structure of your measurements at any time. Similarly, sensors can send different types of measurements with different structures.

Despite this flexibility, the server can still perform queries and aggregations over the data, which allows Tenta to show you real-time charts and statistics about your sensors. This would not be possible if we stored the measurements directly as JSON documents. The minimal structure of this approach also makes exporting data to other tools easier.

The downside of this approach is that all measurements are stored as doubles. You can represent integers and booleans with doubles, but you cannot store strings or binary objects. We have not yet found this to be a problem in most cases, but it is something to keep in mind.

## Configuration as JSON documents

Configurations are JSON documents that are stored and relayed to the sensors as is. Similarly to the approach for measurements, this allows you to create any kind of configuration and to evolve the structure of your configurations over time.

On the flip side, this means that Tenta does not validate configurations before relaying them to the sensors (except that they are valid JSON documents). This is by design. What we actually want to know is whether the sensor successfully deploys the new configuration. Apart from an invalid configuration, there are several other things that can go wrong: the MQTT broker might be down, the sensor might have a bug in its firmware that makes the update fail, etc.

Instead, Tenta implements an acknowledgment cycle to provide real-time insights into any problems. When a sensor receives a new configuration, it sends an acknowledgment back to Tenta stating whether the update was successful or not. The validation of configurations is thus done on the sensors, which is the only place where it can be done reliably.

## Configuration revision numbers

Each configuration is assigned an incremental revision number. This allows us to know which configuration was active when a measurement was taken, which is also important during analysis. Revision numbers are managed by Tenta and are also used for the acknowledgment cycle.
