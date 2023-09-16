import ssl
from typing import Any, Literal, Optional, Union, Dict


class ConfigurationMessage:
    """A configuration message published by the server. Used by the `TentaClient`
    class to produce a typed object for received configs."""

    def __init__(
        self,
        revision: int,
        configuration: Any,
    ) -> None:
        """Create a configuration message.

        Args:
            revision:       Config revision number.
            configuration:  The configuration object.
        """

        self.revision = revision
        self.configuration = configuration


class LogMessage:
    """A log message published by the client."""

    def __init__(
        self,
        severity: Literal["info", "warning", "error"],
        message: str,
        revision: Optional[int] = None,
        timestamp: Optional[float] = None,
    ) -> None:
        """Create a log message.

        Args:
            severity:   Severity of the log message.
            message:    The log message content.
            revision:   Config revision of the log.
            timestamp:  Timestamp of the measurement. If not provided, the `TentaClient` uses
                        the current time.
        """

        self.severity = severity
        self.message = message
        self.revision = revision
        self.timestamp = timestamp


class MeasurementMessage:
    """A measurement message published by the client."""

    def __init__(
        self,
        value: Dict[str, Union[float, int]],
        revision: Optional[int] = None,
        timestamp: Optional[float] = None,
    ) -> None:
        """Create a measurement message.

        Args:
            value:      Value of the measurement. E.g. `{"temperature": 20.0, "humidity": 45.4}`.
            revision:   Config revision of the measurement.
            timestamp:  Timestamp of the measurement. If not provided, the `TentaClient` uses
                        the current time.
        """

        self.revision = revision
        self.value = value
        self.timestamp = timestamp


class AcknowledgmentMessage:
    """An acknowledgment message published by the client."""

    def __init__(
        self,
        revision: int,
        success: bool,
        timestamp: Optional[float] = None,
    ) -> None:
        """Create an acknowledgment message.

        Args:
            revision:   The config revision to be acknowledged.
            success:    Whether the config was processed/accepted successfully.
            timestamp:  Timestamp of the acceptance. If not provided, the `TentaClient` uses
                        the current time.
        """

        self.revision = revision
        self.success = success
        self.timestamp = timestamp


class TLSParameters:
    """TLS parameters for the MQTT connection. Passed as
    is to `paho.mqtt.client.Client.tls_set`."""

    def __init__(
        self,
        ca_certs: Optional[str] = None,
        certfile: Optional[str] = None,
        keyfile: Optional[str] = None,
        cert_reqs: Optional[ssl.VerifyMode] = None,
        tls_version: Optional[ssl._SSLMethod] = None,
        ciphers: Optional[str] = None,
        # FIXME: I couldn't find a way to type this properly yet
        keyfile_password: Optional[Any] = None,
    ) -> None:
        """Create a new TLS parameters object."""

        self.ca_certs = ca_certs
        self.certfile = certfile
        self.keyfile = keyfile
        self.cert_reqs = cert_reqs
        self.tls_version = tls_version
        self.ciphers = ciphers
        self.keyfile_password = keyfile_password
