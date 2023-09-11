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

    def publish_log_message(
        self,
        severity: Literal["info", "warning", "error"],
        message: str,
    ) -> int:
        """Publish a log message to the MQTT broker and return the `message_id`."""

        mqtt_message_info = self.client.publish(
            topic=f"logs/{self.sensor_identifier}",
            payload=json.dumps(
                [
                    {
                        "revision": self.revision,
                        "timestamp": time.time(),
                        "severity": severity,
                        "message": message,
                    }
                ]
            ),
        )

        self.active_message_ids.add(mqtt_message_info.mid)
        return mqtt_message_info.mid

    def was_message_published(self, message_id: int) -> bool:
        """Check if the message with `message_id` was published."""

        return message_id in self.active_message_ids

    @property
    def active_message_count(self) -> int:
        """Return the number of messages that have not yet been published."""

        return len(self.active_message_ids)

    def wait_for_message_publishing(self, timeout: Optional[int] = 60) -> None:
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
