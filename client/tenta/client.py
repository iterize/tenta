import json
import time
from typing import Literal, Optional
import typing
import paho.mqtt.client


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
        self.client.connect(
            host=mqtt_host,
            port=mqtt_port,
            keepalive=60,
        )
        self.client.loop_start()

        self.sensor_identifier = sensor_identifier
        self.revision = revision
        self.active_message_ids: typing.Set[int] = set()

        def _on_publish(
            client: typing.Any,
            userdata: typing.Any,
            message_id: int,
        ) -> None:
            self.active_message_ids.remove(message_id)

        self.client.on_publish = _on_publish

    def publish_log(
        self,
        severity: Literal["info", "warning", "error"],
        message: str,
        wait_for_publish: bool = False,
        wait_for_publish_timeout: int = 60,
    ) -> int:
        """Publish a log to the MQTT broker and return the `message_id`.

        If `wait_for_publish` is `True`, waits until the message has been
        published or until `wait_for_publish_timeout` seconds have passed.
        Raises an exception if the timeout is reached."""

        return self._publish(
            topic=f"logs/{self.sensor_identifier}",
            body=[
                {
                    "revision": self.revision,
                    "timestamp": time.time(),
                    "severity": severity,
                    "message": message,
                }
            ],
            wait_for_publish=wait_for_publish,
            wait_for_publish_timeout=wait_for_publish_timeout,
        )

    def publish_measurement(
        self,
        value: typing.Dict[str, typing.Union[float, int]],
        wait_for_publish: bool = False,
        wait_for_publish_timeout: int = 60,
    ) -> int:
        """Publish a measurement to the MQTT broker and return the `message_id`.

        If `wait_for_publish` is `True`, waits until the message has been
        published or until `wait_for_publish_timeout` seconds have passed.
        Raises an exception if the timeout is reached."""

        return self._publish(
            topic=f"measurements/{self.sensor_identifier}",
            body=[
                {
                    "revision": self.revision,
                    "timestamp": time.time(),
                    "value": value,
                }
            ],
            wait_for_publish=wait_for_publish,
            wait_for_publish_timeout=wait_for_publish_timeout,
        )

    def _publish(
        self,
        topic: str,
        body: typing.Any,
        wait_for_publish: bool = False,
        wait_for_publish_timeout: int = 60,
    ) -> int:
        """Publish a message to the MQTT broker and return the `message_id`.

        If `wait_for_publish` is `True`, waits until the message has been
        published or until `wait_for_publish_timeout` seconds have passed.
        Raises an exception if the timeout is reached."""

        mqtt_message_info = self.client.publish(
            topic=topic,
            payload=json.dumps(body),
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

    def teardown(self) -> None:
        self.client.loop_stop()
        self.client.disconnect()
