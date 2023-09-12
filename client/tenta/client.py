import json
import time
from typing import Literal, Optional
import typing
import paho.mqtt.client


class ConfigurationDict(typing.TypedDict):
    revision: int
    configuration: typing.Any


class TentaClient:
    def __init__(
        self,
        mqtt_host: str,
        mqtt_port: int,
        mqtt_identifier: str,
        mqtt_password: str,
        sensor_identifier: str,
        revision: Optional[int] = None,
    ) -> None:
        self.client = paho.mqtt.client.Client()
        self.client.username_pw_set(
            username=mqtt_identifier,
            password=mqtt_password,
        )

        connection_rc_code: typing.Optional[int] = None

        def _on_connect(
            client: paho.mqtt.client.Client,
            userdata: typing.Any,
            flags: typing.Any,
            rc: int,
        ) -> None:
            nonlocal connection_rc_code
            connection_rc_code = rc

        self.client.on_connect = _on_connect

        try:
            self.client.connect(
                host=mqtt_host,
                port=mqtt_port,
                keepalive=60,
            )
            start_time = time.time()

            while True:
                time.sleep(0.1)
                if connection_rc_code is not None:
                    if connection_rc_code == 0:
                        break
                    if connection_rc_code == 1:
                        raise ConnectionError("Connection refused - incorrect protocol")
                    if connection_rc_code == 2:
                        raise ConnectionError("Connection refused - invalid client id")
                    if connection_rc_code == 3:
                        raise ConnectionError("Connection refused - server unavailable")
                    if connection_rc_code == 4:
                        raise ConnectionError(
                            "Connection refused - bad username or password"
                        )
                    if connection_rc_code == 5:
                        raise ConnectionError("Connection refused - not authorised")
                    raise ConnectionError(
                        f"Connection refused - unknown error ({connection_rc_code})"
                    )
                if time.time() > (start_time + 8):
                    raise TimeoutError("Timed out while connecting")

        except Exception as e:
            raise ConnectionError(
                f"Could not connect to MQTT broker at {mqtt_host}:{mqtt_port} ({e})"
            )

        try:
            self.client.loop_start()
        except Exception as e:
            raise RuntimeError(f"Could not start MQTT background loop ({e})")

        self.sensor_identifier = sensor_identifier
        self.revision = revision
        self.active_message_ids: typing.Set[int] = set()

        self.latest_received_configuration: typing.Optional[ConfigurationDict] = None

        def _set_latest_received_configuration(
            configuration_dict: ConfigurationDict,
        ) -> None:
            self.latest_received_configuration = configuration_dict

        def _on_publish(
            client: typing.Any,
            userdata: typing.Any,
            message_id: int,
        ) -> None:
            self.active_message_ids.remove(message_id)

        def _on_config_message(
            client: typing.Any,
            userdata: typing.Any,
            message: paho.mqtt.client.MQTTMessage,
        ) -> None:
            # decode the message
            try:
                payload = json.loads(message.payload.decode())
            except:
                return

            # check whether the message is in a valid format
            try:
                assert isinstance(payload, dict)
                assert "revision" in payload.keys()
                assert "configuration" in payload.keys()
                assert isinstance(payload["revision"], int)
            except:
                return

            # update the latest received configuration
            _set_latest_received_configuration(payload)  # type: ignore

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
                "revision": self.revision,
                "severity": severity,
                "message": message,
            },
            timestamp=timestamp,
            wait_for_publish=wait_for_publish,
            wait_for_publish_timeout=wait_for_publish_timeout,
        )

    def publish_measurement(
        self,
        value: typing.Dict[str, typing.Union[float, int]],
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
                "revision": self.revision,
                "value": value,
            },
            timestamp=timestamp,
            wait_for_publish=wait_for_publish,
            wait_for_publish_timeout=wait_for_publish_timeout,
        )

    def publish_acknowledgement(
        self,
        success: bool,
        revision: Optional[int] = None,
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
                "revision": self.revision if revision is None else revision,
                "success": success,
            },
            timestamp=timestamp,
            wait_for_publish=wait_for_publish,
            wait_for_publish_timeout=wait_for_publish_timeout,
        )

    def _publish(
        self,
        topic: str,
        body: typing.Dict[str, typing.Any],
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

    @property
    def active_message_count(self) -> int:
        """Return the number of messages that have not yet been published."""

        return len(self.active_message_ids)

    def wait_for_publish(self, timeout: Optional[int] = 60) -> None:
        """Wait until all messages have been published. Raise a
        `TimeoutError` if the timeout is reached."""

        start_time = time.time()

        while self.active_message_count > 0:
            time.sleep(0.1)
            if (timeout is not None) and (time.time() > (start_time + timeout)):
                raise TimeoutError(
                    "Timed out while waiting for messages to be published"
                )

    def get_latest_received_configuration(self) -> Optional[ConfigurationDict]:
        """Return the latest received configuration or `None` if no
        configuration has been received yet."""

        return self.latest_received_configuration

    def teardown(self) -> None:
        self.client.loop_stop()
        self.client.disconnect()
