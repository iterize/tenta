"""The Tenta Python client library

This library provides statically typed classes for all message types
used by Tenta: `MeasurementMessage`, `LogMessage`, `AcknowledgmentMessage`,
`ConfigurationMessage`, and `TLSParameters`.

The `TentaClient` class provides a simple interface for sending messages
to the Tenta server using Paho MQTT."""

from .types import (
    MeasurementMessage,
    LogMessage,
    AcknowledgmentMessage,
    ConfigurationMessage,
    TLSParameters,
)

from .client import TentaClient
