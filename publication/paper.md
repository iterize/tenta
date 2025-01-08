---
title: "Tenta: Remote and Real-Time Sensor Network Management"
tags:
  - Internet of Things
  - IoT
  - TimescaleDB
  - MQTT
  - Sensor network
  - Wireless sensor network
  - Monitoring
  - REST
  - Python
  - PostgreSQL
  - Sensor management
  - Real-time
  - Measurement
  - HTTP
  - Aggregation
  - Sensor
  - Reproducible research
  - WSN
  - Geospatial data
  - AsyncIO
  - SQL
  - Automation
  - Time series data
  - Publish-Subscribe
  - Pub/Sub
  - Remote sensing
  - Environmental sensing
  - Server
  - Configuration
authors:
  - name: Felix Böhm
    orcid: 0009-0002-2179-9934
    corresponding: true
    affiliation: 1
  - name: Moritz Makowski
    orcid: 0000-0002-2948-2993
    affiliation: 1
  - name: Patrick Aigner
    orcid: 0000-0002-1530-415X
    affiliation: 1
  - name: Jia Chen
    orcid: 0000-0002-6350-6610
    corresponding: true
    affiliation: 1
affiliations:
  - name: Professorship of Environmental Sensing and Modeling, Technical University of Munich (TUM), Munich, Germany
    index: 1
date: 25 March 2024
bibliography: paper.bib
---

# Summary

In many domains, sensor networks have become indispensable to drive effective decisions: They monitor greenhouse gases and air pollutants [@dietrich2021muccnet; @wenzel2021stand], record volcanic activity [@werner2006deploying], and track animal migrations [@zhang2004hardware]. However, when these networks are more than a few sensors in scale and/or their locations are difficult to access, manual inspection of sensors to retrieve their data and check their status gets prohibitively time-intensive. Simultaneously, scale renders the occurrence of sensor failures practically unavoidable. Failures that stay undetected lead to data loss [@bart2014high; @tolle2005design] and skewed results, and thus, potentially, to erroneous conclusions.

Tenta is a lightweight server application to manage sensor networks remotely and in real-time. The system receives and stores measurements transmitted by sensors and allows users to monitor sensors via an intuitive dashboard. Additionally, Tenta uses versionized configurations to adapt sensors to changes in requirements. Configurations are schemaless JSON documents that represent a sensor's state. They allow requests to sensors e.g. to update their measurement interval or even their software, as for instance implemented in Ivy [@ivy]. Tenta associates each measurement with the sensor's currently active configuration, which results in highly reproducible datasets. Sensors communicate with Tenta over the widely adopted MQTT protocol. The system exposes a REST API for straightforward task automation. Data is stored in a time series-optimized PostgreSQL+TimescaleDB [@postgres; @timescale] database.

\begin{figure}
\makebox[\textwidth][c]{\includegraphics[width=1.025\textwidth]{images/architecture.png}}%
\caption{Tenta communicates with sensors via the MQTT protocol and exposes an intuitive dashboard and a REST API to manage them remotely. The time series-optimized database can be accessed directly to allow for elaborate processing and visualization e.g. with Polars or Grafana.}
\label{fig:architecture}
\end{figure}

Starting in 2022, our research group deployed a network of 20 mid-precision CO\textsubscript{2} sensors on rooftops in and around Munich [@midcost]. To date, Tenta has reliably processed half a billion of this network's measurements as well as hundreds of configuration updates. Tenta's test suite currently stands at a statement coverage of 94%.

# Statement of need

The IoT space is dominated by proprietary cloud services, e.g., from Amazon Web Services and Microsoft Azure. These platforms offer a holistic suite of message brokers, monitoring, device management, data storage, and analytics. Several research projects [@muller2020integration; @zweifel2021trees; @burri2019did] use the sensors and infrastructure of the Swiss company Decentlab. Measurements are transmitted via LoRaWAN to gateways that relay them to Decentlab's infrastructure over the Internet. Other projects [@werner2006deploying; @zhang2004hardware] implement custom solutions e.g. based on flooding protocols. Smaller networks sometimes forgo connectivity entirely and instead rely on physical visits to the sites.

ThingsBoard [@thingsboard] is an IoT platform to collect and visualize data and configure sensors via remote procedure calls. Multiple communication protocols are supported, including HTTP, MQTT, and CoAP. Furthermore, ThingsBoard allows data manipulation via so-called rule chains. A subset of ThingsBoard's functionality is available under an open-source license. Other open-source projects communicate only unidirectionally — from sensor to server — without the possibility of managing devices remotely: ThingSpeak [@thingspeak] provides an HTTP API to store and retrieve data from IoT devices. Users can analyze and visualize data via the integrated MATLAB environment. The FROST Server [@frost] implements the OGC SensorThings API and provides both HTTP and MQTT interfaces to collect and query IoT data. ThingDirectory [@tavakolizadeh2021thing] allows storing and querying IoT metadata (e.g. location, measurement type) via its REST API.

# System design

Tenta follows the Unix philosophy and aims to be fast, flexible, and scalable. The project focuses on real-time sensor management and reliable data collection and storage. Tenta provides seamless interfaces, such that related tasks like data processing and custom visualizations can be accomplished with the array of great existing tools e.g. Polars [@polars] or Grafana [@grafana]. Each of Tenta's features is designed to be optional. This makes it easy to connect the first sensor and allows Tenta to be used solely as a data sink for measurements on the one extreme or solely as a management system on the other. \autoref{fig:screenshot} shows Tenta's dashboard with real-time charts of collected measurements.

\begin{figure}
\makebox[\textwidth][c]{\includegraphics[width=1.093\textwidth]{images/screenshot.png}}%
\caption{Tenta's dashboard shows real-time charts of collected measurements, here with data from our research group's CO\textsubscript{2} sensor network. Users can furthermore manage configurations and inspect measurements, logs, and status metrics via the dashboard.}
\label{fig:screenshot}
\end{figure}

Tenta imposes minimal restrictions on measurements and configurations. Their format can differ between sensors and can change over time without needing to notify the server beforehand, which allows Tenta to support sensor networks of almost arbitrary structure and simplifies software and hardware migrations on the sensor side. Individual sensors can even operate multiple different measurement formats at the same time. Despite this flexibility, Tenta persists measurements in a relational way, which keeps further processing straightforward.

\begin{figure}
\makebox[\textwidth][c]{\includegraphics[width=1.025\textwidth]{images/configurations.png}}%
\caption{When a new configuration is created, it is assigned a unique identifier and relayed to the sensor over MQTT. The sensor positively or negatively acknowledges the configuration and can subsequently associate outgoing messages (e.g. measurements) with that identifier.}
\label{fig:configurations}
\end{figure}

Configurations are schemaless JSON documents that represent sensor state. \autoref{fig:configurations} shows how Tenta assigns each configuration an incremental revision number before relaying it to the sensor. To increase observability, configurations are positively or negatively acknowledged. Subsequently, sensors can associate their outgoing messages (e.g. measurements) with the revision number of the relevant configuration.

Sensors communicate with Tenta over the widely adopted MQTT protocol. MQTT is designed for resource-constrained devices and consumes little bandwidth, which is vital for sensors connected via the mobile network. Client libraries are available in most programming languages, which maximizes flexibility with regard to sensor software and hardware.

Tenta leverages concurrency to achieve high throughput. Database and HTTP requests as well as MQTT message sending and receiving execute asynchronously. Tenta supports multiple sensor networks on a single instance as well as multiple users with different permissions.

# Author contributions

FB: Designed and developed the server software, wrote the tests, wrote the documentation, wrote the manuscript; MM: Developed the dashboard, developed the client library running on the sensors, reviewed the manuscript; PA: Supervised the project, extracted the requirements, reviewed the manuscript; JC: Principle investigator, supervised the project, reviewed the manuscript;

# Acknowledgment of financial support

This work was financially supported by the European Union’s Horizon 2020 Programme as part of the ICOS Cities project (Pilot Applications in Urban Landscapes - Towards integrated city observatories for greenhouse gases - PAUL): Grant Agreement ID 101037319.

# References
