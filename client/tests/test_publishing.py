import os
import random
import string
import pytest
import tenta

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MQTT_HOST = "test.mosquitto.org"
MQTT_PORT = 1884
MQTT_IDENTIFIER = "rw"
MQTT_PASSWORD = "readwrite"
SENSOR_IDENTIFIER = "".join(
    random.choice(string.ascii_letters + string.digits) for i in range(32)
)


@pytest.mark.order(3)
def test_publishing() -> None:
    tenta_client = tenta.TentaClient(
        mqtt_host=MQTT_HOST,
        mqtt_port=MQTT_PORT,
        mqtt_identifier=MQTT_IDENTIFIER,
        mqtt_password=MQTT_PASSWORD,
        sensor_identifier=SENSOR_IDENTIFIER,
        connection_timeout=1,
    )

    # non-blocking send of logs

    message_ids = [
        tenta_client.publish(
            tenta.LogMessage(
                severity="info",
                message="Hello, world!",
            )
        ),
        tenta_client.publish(
            [
                tenta.LogMessage(
                    severity="warning",
                    message="Hello, to you too!",
                ),
                tenta.LogMessage(
                    severity="error",
                    message="Ok bye!",
                ),
            ]
        ),
    ]
    tenta_client.wait_for_publish()
    assert tenta_client.get_active_message_count() == 0
    assert all(
        [tenta_client.was_message_published(message_id) for message_id in message_ids]
    )

    # non-blocking send of measurements

    tenta_client.publish(
        tenta.MeasurementMessage(
            value={
                "temperature": 20.0,
                "humidity": 50.0,
                "pressure": 1013.25,
                "voltage": 3.3,
            },
        )
    )
    tenta_client.publish(
        tenta.MeasurementMessage(
            value={
                "temperature": 21.0,
                "humidity": 51.0,
                "pressure": 1014.25,
                "voltage": 3.4,
            },
            timestamp=1234567890,
            revision=17,
        )
    )
    tenta_client.wait_for_publish()
    assert tenta_client.get_active_message_count() == 0

    # non-blocking send of acknowledgements

    tenta_client.publish(
        tenta.AcknowledgmentMessage(
            revision=17,
            success=True,
        )
    )
    tenta_client.publish(
        tenta.AcknowledgmentMessage(
            revision=18,
            success=False,
        )
    )
    tenta_client.wait_for_publish()
    assert tenta_client.get_active_message_count() == 0

    # blocking send

    tenta_client.publish(
        tenta.AcknowledgmentMessage(
            revision=19,
            success=True,
        ),
        wait_for_publish=True,
    )
    assert tenta_client.get_active_message_count() == 0

    # teardown

    tenta_client.teardown()
