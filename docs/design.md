# Design decisions

## Delegation of processing and (elaborate) visualization to other tools

We adhere to the Unix philosophy in that Tenta does only thing, and does it well: manage sensor networks. Tenta collects data from sensors and allows you to supervise and configure them remotely. Tenta does not process the data and does not allow you to visualize more elaborate things than real-time line charts over raw data.

There are multiple reasons why this is a good idea:

1. The open-source ecosystem already has excellent tools for processing and visualization, e.g. polars and Grafana. By not reinventing the wheel here, we can focus on the core functionality of Tenta. Additionally, processing and visualization vary immensely between projects, which means that we'd probably only end up with a very complex system that still doesn't work for everyone.
1. Tenta stores the raw data it receives from the sensors as is. You accidentally deleted all the data while processing it outside of Tenta? Don't worry, Tenta is your source of truth.
1. Analyzing data in real-time is often not possible, nor useful. You might want to try out and compare different processing methods, or you might want to reprocess all your data when you find a bug in your pipeline. Or you might depend on metadata or external sources that are only available at a later point in time, etc.
1. Processing can be expensive. Depending on your needs, processing can take hours or even days. Tenta, on the other hand, is designed to show you the status of your sensors in real-time.

Naturally, we designed Tenta's interfaces to work well with other tools and provide documentation and examples about e.g. how to get data out of Tenta to process it.

## PostgreSQL+TimescaleDB

Tenta stores all data in a PostgreSQL database with the TimescaleDB extension. TimescaleDB allows us to optimize certain tables for time-series data, while still being able to use most of the features of PostgreSQL (e.g. joins).

Apart from time-series data like measurements, we also need to store highly relational information e.g. about users, networks, or session tokens. The benefit of TimescaleDB over other time-series databases (e.g. InfluxDB) is that we can do all this in a single data store. This makes our setup simple and robust.
