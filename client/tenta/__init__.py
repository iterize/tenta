import dataclasses
import json
import ssl
import time
from typing import Any, Literal, Optional, Callable, Set, Union, Dict
import paho.mqtt.client


@dataclasses.dataclass(frozen=True)
class ConfigMessage:
    revision: int
    configuration: Any


@dataclasses.dataclass(frozen=True)
class TLSParameters:
    ca_certs: Optional[str] = None
    certfile: Optional[str] = None
    keyfile: Optional[str] = None
    cert_reqs: Optional[ssl.VerifyMode] = None
    tls_version: Optional[ssl._SSLMethod] = None
    ciphers: Optional[str] = None

    # I couldn't find a way to type this properly yet
    keyfile_password: Optional[Any] = None


class TentaClient:
    def __init__(
        self,
        # --- Required args
        mqtt_host: str,
        mqtt_port: int,
        mqtt_identifier: str,
        mqtt_password: str,
        sensor_identifier: str,
        # --- Optional args
        config_revision: Optional[int] = None,
        on_config_message: Optional[Callable[[ConfigMessage], None]] = None,
        on_publish: Optional[Callable[[int], None]] = None,
        connection_timeout: int = 8,
        # --- TLS parameters
        tls_context: Optional[ssl.SSLContext] = None,
        tls_parameters: Optional[TLSParameters] = None,
        tls_insecure: Optional[bool] = None,
    ) -> None:
        """Create a new Tenta client.

        Args:
            mqtt_host: The host of the MQTT broker.
            mqtt_port: The port of the MQTT broker.
            mqtt_identifier: The MQTT identifier.
            mqtt_password: The MQTT password.
            sensor_identifier: The sensor identifier.
            config_revision: The current revision of the sensor.
            on_config_message: A callback that is called when a new
                configuration message is received.
            on_publish: A callback that is called when a message is
                published.
            connection_timeout: How many seconds to wait for the initial
                connection to the MQTT broker until a `TimeoutError` is
                raised.
            tls_context: The TLS context to use for the connection. This
                will be passed as is to `paho.mqtt.client.Client.tls_set_context`.
            tls_parameters: The TLS parameters to use for the connection.
                This will be passed as is to `paho.mqtt.client.Client.tls_set`.
            tls_insecure: Whether to disable TLS verification. This will
                be passed as is to `paho.mqtt.client.Client.tls_insecure_set`.

        Raises:
            ConnectionError: If the client could not connect to the
                MQTT broker.
        """

        self.client = paho.mqtt.client.Client()
        connection_rc_code: Optional[int] = None

        # on connect, the connection rc code is set:
        # (0 = success, 1 = incorrect protocol, 2 = invalid client id,
        #  3 = server unavailable, 4 = bad username or password,
        #  5 = not authorised)
        def _on_connect(
            client: paho.mqtt.client.Client,
            userdata: Any,
            flags: Any,
            rc: int,
        ) -> None:
            nonlocal connection_rc_code
            connection_rc_code = rc

        # set TLS parameters if specified

        if tls_context is not None:
            self.client.tls_set_context(tls_context)
        if tls_parameters is not None:
            self.client.tls_set(**tls_parameters.__dict__)
        if tls_insecure is not None:
            self.client.tls_insecure_set(tls_insecure)

        # connect to the MQTT broker and raise a `ConnectionError` if
        # the connection fails or times out (default: after 8 seconds)
        self.client.on_connect = _on_connect
        self.client.username_pw_set(username=mqtt_identifier, password=mqtt_password)
        try:
            self.client.connect(
                host=mqtt_host,
                port=mqtt_port,
                keepalive=60,
            )
            self.client.loop_start()
            start_time = time.time()
            while True:
                if time.time() > (start_time + connection_timeout):
                    raise TimeoutError("timed out while connecting")
                if connection_rc_code is None:
                    time.sleep(0.1)
                    continue
                else:
                    if connection_rc_code == 0:
                        break
                    raise Exception(
                        {
                            1: "incorrect protocol",
                            2: "invalid client id",
                            3: "server unavailable",
                            4: "bad username or password",
                            5: "not authorised",
                        }.get(
                            connection_rc_code,
                            f"unknown error code: {connection_rc_code}",
                        )
                    )
        except Exception as e:
            raise ConnectionError(
                f"Could not connect to MQTT broker at {mqtt_host}:{mqtt_port} ({e})"
            )

        self.sensor_identifier = sensor_identifier
        self.config_revision = config_revision
        self.active_message_ids: Set[int] = set()
        self.latest_received_config_message: Optional[ConfigMessage] = None

        # on message publish, the message id is removed from the set of
        # active message ids and the `on_publish` callback is called
        def _on_publish(
            client: Any,
            userdata: Any,
            message_id: int,
        ) -> None:
            self.active_message_ids.remove(message_id)
            if on_publish is not None:
                on_publish(message_id)

        # on receiving a configuration message, the structure of the
        # message is validated, the `latest_received_config_message`
        # is updated and the `on_config_message` callback is called
        def _on_config_message(
            client: Any,
            userdata: Any,
            message: paho.mqtt.client.MQTTMessage,
        ) -> None:
            try:
                payload = json.loads(message.payload.decode())
            except:
                return

            try:
                assert isinstance(payload, dict)
                assert "revision" in payload.keys()
                assert "configuration" in payload.keys()
                assert isinstance(payload["revision"], int)
            except:
                return

            config_message = ConfigMessage(
                revision=payload["revision"],
                configuration=payload["configuration"],
            )
            self.latest_received_config_message = config_message
            if on_config_message is not None:
                on_config_message(config_message)

        # subscribe to the configuration topic and set the callbacks
        # for successfully publishing and receiving messages
        self.client.on_publish = _on_publish
        self.client.subscribe(f"configurations/{self.sensor_identifier}")
        self.client.on_message = _on_config_message

    def publish_log(
        self,
        severity: Literal["info", "warning", "error"],
        message: str,
        timestamp: Optional[float] = None,
        wait_for_publish: bool = False,
        wait_for_publish_timeout: int = 60,
    ) -> int:
        """Publish a log to the MQTT broker and return the `message_id`.

        If `wait_for_publish` is `True`, waits until the message has been
        published or until `wait_for_publish_timeout` seconds have passed.
        Raises an exception if the timeout is reached.

        If `timestamp` is not specified, the current time is used."""

        return self._publish(
            topic=f"logs/{self.sensor_identifier}",
            body={
                "revision": self.config_revision,
                "severity": severity,
                "message": message,
            },
            timestamp=timestamp,
            wait_for_publish=wait_for_publish,
            wait_for_publish_timeout=wait_for_publish_timeout,
        )

    def publish_measurement(
        self,
        value: Dict[str, Union[float, int]],
        timestamp: Optional[float] = None,
        wait_for_publish: bool = False,
        wait_for_publish_timeout: int = 60,
    ) -> int:
        """Publish a measurement to the MQTT broker and return the `message_id`.

        If `wait_for_publish` is `True`, waits until the message has been
        published or until `wait_for_publish_timeout` seconds have passed.
        Raises an exception if the timeout is reached.

        If `timestamp` is not specified, the current time is used."""

        return self._publish(
            topic=f"measurements/{self.sensor_identifier}",
            body={
                "revision": self.config_revision,
                "value": value,
            },
            timestamp=timestamp,
            wait_for_publish=wait_for_publish,
            wait_for_publish_timeout=wait_for_publish_timeout,
        )

    def publish_acknowledgement(
        self,
        success: bool,
        revision: Optional[int],
        timestamp: Optional[float] = None,
        wait_for_publish: bool = False,
        wait_for_publish_timeout: int = 60,
    ) -> int:
        """Publish an acknowledgement to the MQTT broker and return the `message_id`.

        If `wait_for_publish` is `True`, waits until the message has been
        published or until `wait_for_publish_timeout` seconds have passed.
        Raises an exception if the timeout is reached.

        If `timestamp` is not specified, the current time is used."""

        return self._publish(
            topic=f"acknowledgments/{self.sensor_identifier}",
            body={
                "revision": revision,
                "success": success,
            },
            timestamp=timestamp,
            wait_for_publish=wait_for_publish,
            wait_for_publish_timeout=wait_for_publish_timeout,
        )

    def _publish(
        self,
        topic: str,
        body: Dict[str, Any],
        timestamp: Optional[float] = None,
        wait_for_publish: bool = False,
        wait_for_publish_timeout: int = 60,
    ) -> int:
        """Publish a message to the MQTT broker and return the `message_id`.

        If `wait_for_publish` is `True`, waits until the message has been
        published or until `wait_for_publish_timeout` seconds have passed.
        Raises an exception if the timeout is reached.

        If `timestamp` is not specified, the current time is used."""

        mqtt_message_info = self.client.publish(
            topic=topic,
            payload=json.dumps(
                [
                    {
                        **body,
                        "timestamp": (
                            timestamp if timestamp is not None else time.time()
                        ),
                    }
                ]
            ),
        )
        self.active_message_ids.add(mqtt_message_info.mid)

        if wait_for_publish:
            mqtt_message_info.wait_for_publish(wait_for_publish_timeout)

        return mqtt_message_info.mid

    def was_message_published(self, message_id: int) -> bool:
        """Check if the message with `message_id` was published."""

        return message_id in self.active_message_ids

    def get_active_message_count(self) -> int:
        """Return the number of messages that have not yet been published."""

        return len(self.active_message_ids)

    def wait_for_publish(self, timeout: Optional[int] = 60) -> None:
        """Wait until all messages have been published. Raise a
        `TimeoutError` if the timeout is reached."""

        start_time = time.time()

        while self.get_active_message_count() > 0:
            time.sleep(0.1)
            if (timeout is not None) and (time.time() > (start_time + timeout)):
                raise TimeoutError(
                    "Timed out while waiting for messages to be published"
                )

    def get_latest_received_config_message(self) -> Optional[ConfigMessage]:
        """Return the latest received configuration or `None` if no
        configuration has been received yet."""

        return self.latest_received_config_message

    def teardown(self) -> None:
        self.client.loop_stop()
        self.client.disconnect()
