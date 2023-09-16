from __future__ import annotations
import json
import ssl
import time
from typing import Any, List, Optional, Callable, Set, Union
import paho.mqtt.client
import threading
from tenta import (
    ConfigurationMessage,
    TLSParameters,
    MeasurementMessage,
    LogMessage,
    AcknowledgmentMessage,
)


class TentaClient:
    instance: Optional[TentaClient] = None

    # these variables are shared over all threads
    thread_lock = threading.Lock()
    connection_rc_code: Optional[int] = None
    active_message_ids: Set[int] = set()
    latest_received_config_message: Optional[ConfigurationMessage] = None

    def __init__(
        self,
        mqtt_host: str,
        mqtt_port: int,
        mqtt_identifier: str,
        mqtt_password: str,
        connection_timeout: int = 8,
        sensor_identifier: Optional[str] = None,
        receive_configs: bool = True,
        on_config_message: Optional[Callable[[ConfigurationMessage], None]] = None,
        on_publish: Optional[Callable[[int], None]] = None,
        tls_context: Optional[ssl.SSLContext] = None,
        tls_parameters: Optional[TLSParameters] = None,
        tls_insecure: Optional[bool] = None,
    ) -> None:
        """Create a new Tenta client. Prevents creating multiple instances.

        You can look at the [advanced example](/user-guide/python-client-example#advanced-example)
        in the documentation to see how to pass the TLS parameters.

        Args:
            mqtt_host:           The host of the MQTT broker.
            mqtt_port:           The port of the MQTT broker.
            mqtt_identifier:     The MQTT identifier.
            mqtt_password:       The MQTT password.
            connection_timeout:  How many seconds to wait for the initial connection to the MQTT
                                 broker until a `TimeoutError` is raised.
            sensor_identifier:   A sensor identifier. If this is `None`, the client will expect
                                 a sensor identifier with each individual message, you publish.
                                 It will raise a `ValueError` if you try to publish a message
                                 without a sensor identifier.
            receive_configs:     Whether to subscribe to the configuration topic. If this is set
                                 to `True` but no sensor identifier is specified, a `ValueError`
                                 is raised.
            on_config_message:   A callback that is called when a new configuration message is
                                 received. The function receives the `ConfigurationMessage` as
                                 an argument.
            on_publish:          A callback that is called when a message is published. The
                                 function receives the `message_id` of the published message as
                                 an argument.
            tls_context:         The TLS context to use for the connection. This will be passed as
                                 is to `paho.mqtt.client.Client.tls_set_context`.
            tls_parameters:      The TLS parameters to use for the connection. This will be passed
                                 as is to `paho.mqtt.client.Client.tls_set`.
            tls_insecure:        Whether to disable TLS verification. This will be passed as is to
                                 `paho.mqtt.client.Client.tls_insecure_set`.

        Raises:
            RuntimeError:     If there is already a Tenta client instance.
            ConnectionError:  If the client could not connect to the MQTT broker.
        """

        if TentaClient.instance is not None:
            raise RuntimeError("There can only be one TentaClient instance per process")

        TentaClient.instance = self

        self.client = paho.mqtt.client.Client()
        self.sensor_identifier = sensor_identifier
        self.receive_configs = receive_configs

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
            with TentaClient.thread_lock:
                TentaClient.connection_rc_code = rc

        # set TLS configuration if specified

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
            # when the host is correct but the port is wrong, this connection
            # will take some time (~ 6 seconds) but since it is inside a low
            # level routine, alarms from the python `signal` library will not
            # interrupt it, hence the `connection_timeout` argument does not
            # work in this case
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
                if TentaClient.connection_rc_code is None:
                    time.sleep(0.1)
                    continue
                else:
                    if TentaClient.connection_rc_code == 0:
                        break
                    raise Exception(
                        {
                            1: "incorrect protocol",
                            2: "invalid client id",
                            3: "server unavailable",
                            4: "bad username or password",
                            5: "not authorised",
                        }.get(
                            TentaClient.connection_rc_code,
                            f"unknown error code: {TentaClient.connection_rc_code}",
                        )
                    )
        except Exception as e:
            raise ConnectionError(
                f"Could not connect to MQTT broker at {mqtt_host}:{mqtt_port} ({e})"
            )

        # on message publish, the message id is removed from the set of
        # active message ids and the `on_publish` callback is called
        def _on_publish(
            client: Any,
            userdata: Any,
            message_id: int,
        ) -> None:
            with TentaClient.thread_lock:
                TentaClient.active_message_ids.remove(message_id)
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

            config_message = ConfigurationMessage(
                revision=payload["revision"],
                configuration=payload["configuration"],
            )
            with TentaClient.thread_lock:
                TentaClient.latest_received_config_message = config_message
            if on_config_message is not None:
                on_config_message(config_message)

        # subscribe to the configuration topic and set the callbacks
        # for successfully publishing and receiving messages
        self.client.on_publish = _on_publish

        # subscribe to the configuration topic if specified
        if self.receive_configs:
            if self.sensor_identifier is None:
                raise ValueError(
                    "You must specify a sensor identifier if "
                    + "you want to receive configurations"
                )
            self.client.subscribe(f"configurations/{self.sensor_identifier}")
            self.client.on_message = _on_config_message

    def publish(
        self,
        messages: Union[
            LogMessage,
            MeasurementMessage,
            AcknowledgmentMessage,
            List[LogMessage],
            List[MeasurementMessage],
            List[AcknowledgmentMessage],
        ],
        sensor_identifier: Optional[str] = None,
        wait_for_publish: bool = False,
        wait_for_publish_timeout: int = 60,
    ) -> int:
        """Publish a list of messages to the MQTT broker. All messages must be of the same type
        (`LogMessage`, `MeasurementMessage` or `AcknowledgmentMessage`). They will be published
        in a single MQTT message.

        Args:
            messages:                  A list of messages to publish.
            sensor_identifier:         A sensor identifier. If this is `None`, the client will
                                       use the sensor identifier that was specified when creating
                                       the client. If no sensor identifier was specified when
                                       creating the client, a `ValueError` is raised.
            wait_for_publish:          Whether to wait for the message to be published.
            wait_for_publish_timeout:  How many seconds to wait for the message to be published

        Returns:
            The `message_id` of the MQTT message.
        """

        used_sensor_identifier = self.sensor_identifier
        if sensor_identifier is not None:
            used_sensor_identifier = sensor_identifier
        if used_sensor_identifier is None:
            raise ValueError(
                "You either have to specify a sensor identifier when creating "
                + "the TentaClient or when publishing messages"
            )

        topic: str

        message_list: Union[
            List[LogMessage],
            List[MeasurementMessage],
            List[AcknowledgmentMessage],
        ] = (
            messages if isinstance(messages, list) else [messages]  # type: ignore
        )

        if all([isinstance(message, LogMessage) for message in message_list]):
            topic = f"logs/{self.sensor_identifier}"
        elif all([isinstance(message, MeasurementMessage) for message in message_list]):
            topic = f"measurements/{self.sensor_identifier}"
        elif all(
            [isinstance(message, AcknowledgmentMessage) for message in message_list]
        ):
            topic = f"acknowledgments/{self.sensor_identifier}"
        else:
            raise ValueError(
                "All messages must be of the same type (LogMessage, "
                + "MeasurementMessage or AcknowledgmentMessage)"
            )

        current_timestamp = time.time()

        with TentaClient.thread_lock:
            mqtt_message_info = self.client.publish(
                topic=topic,
                payload=json.dumps(
                    [
                        {
                            **m.__dict__,
                            "timestamp": (
                                m.timestamp
                                if (m.timestamp is not None)
                                else current_timestamp
                            ),
                        }
                        for m in message_list
                    ]
                ),
            )
            TentaClient.active_message_ids.add(mqtt_message_info.mid)

        if wait_for_publish:
            # FIXME: I don't know why the native paho method (below) does not work
            # mqtt_message_info.wait_for_publish(wait_for_publish_timeout)

            start_time = time.time()
            while not self.was_message_published(mqtt_message_info.mid):
                time.sleep(0.1)
                if time.time() > (start_time + wait_for_publish_timeout):
                    raise TimeoutError(
                        "Timed out while waiting for messages to be published"
                    )

        return mqtt_message_info.mid

    def was_message_published(self, message_id: int) -> bool:
        """Check if a message with a given id was published.

        Args:
            message_id:  The `message_id` of the message.

        Returns:
            Whether the message was published.
        """

        return message_id not in TentaClient.active_message_ids

    def get_active_message_count(self) -> int:
        """Get how many messages have not yet been published.

        Returns:
            The number of messages that have not yet been published.
        """

        return len(TentaClient.active_message_ids)

    def wait_for_publish(self, timeout: Optional[int] = 60) -> None:
        """Wait until all messages have been published.

        Args:
            timeout:  How many seconds to wait until a `TimeoutError` is raised.
        """

        start_time = time.time()

        while self.get_active_message_count() > 0:
            time.sleep(0.1)
            if (timeout is not None) and (time.time() > (start_time + timeout)):
                raise TimeoutError(
                    "Timed out while waiting for messages to be published"
                )

    def get_latest_received_config_message(
        self,
    ) -> Optional[ConfigurationMessage]:
        """Return the latest received configuration.

        Returns:
            The latest received configuration or `None` if no configuration has been received yet.
        """

        if not self.receive_configs:
            raise ValueError(
                "You have to set `receive_configs` to `True` when creating the client "
                + "to be able to receive configurations"
            )

        return TentaClient.latest_received_config_message

    def teardown(self) -> None:
        """Disconnect from the MQTT broker and stop the client loop."""

        self.client.loop_stop()
        self.client.disconnect()
        TentaClient.instance = None
        TentaClient.connection_rc_code = None
        TentaClient.active_message_ids = set()
        TentaClient.latest_received_config_message = None
