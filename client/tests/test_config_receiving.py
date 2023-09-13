import json
import os
import random
import string
import time
import typing
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


def publish_config_object(topic: str, config_object: typing.Any) -> None:
    config_object_string = json.dumps(config_object).replace('"', r"\"")
    command = (
        f"mosquitto_pub -h {MQTT_HOST} -p {MQTT_PORT} "
        + f" -t {topic} "
        + f"-u {MQTT_IDENTIFIER} -P {MQTT_PASSWORD} "
        + f'-m "{config_object_string}"'
    )
    print(f"Executing command: {repr(command)}")
    assert os.system(command) == 0


@pytest.mark.order(4)
def test_successful_connection() -> None:
    tenta_client = tenta.TentaClient(
        mqtt_host=MQTT_HOST,
        mqtt_port=MQTT_PORT,
        mqtt_identifier=MQTT_IDENTIFIER,
        mqtt_password=MQTT_PASSWORD,
        sensor_identifier=SENSOR_IDENTIFIER,
        config_revision=17,
        connection_timeout=1,
    )

    config_1 = tenta.ConfigMessage(
        revision=17,
        configuration={"some_value": 42},
    )
    config_2 = tenta.ConfigMessage(
        revision=18,
        configuration={"some_other_value": 43},
    )

    # send invalid config -> ignored by client
    publish_config_object(
        topic=f"configurations/{SENSOR_IDENTIFIER}",
        config_object={"nota": "config"},
    )
    time.sleep(1)
    received_config = tenta_client.get_latest_received_config_message()
    assert received_config is None

    # send valid config but invalid topic -> ignored by client
    publish_config_object(
        topic=f"some-other-topic/{SENSOR_IDENTIFIER}",
        config_object=config_1.__dict__,
    )
    time.sleep(1)
    received_config = tenta_client.get_latest_received_config_message()
    assert received_config is None

    # send valid config -> accepted by client
    publish_config_object(
        topic=f"configurations/{SENSOR_IDENTIFIER}",
        config_object=config_1.__dict__,
    )
    time.sleep(1)
    received_config = tenta_client.get_latest_received_config_message()
    assert received_config is not None
    assert received_config.revision == config_1.revision

    # send invalid config -> ignored by client
    publish_config_object(
        topic=f"configurations/{SENSOR_IDENTIFIER}",
        config_object={"nota": "config"},
    )
    time.sleep(1)
    received_config = tenta_client.get_latest_received_config_message()
    assert received_config is not None
    assert received_config.revision == config_1.revision

    # send valid config -> accepted by client
    publish_config_object(
        topic=f"configurations/{SENSOR_IDENTIFIER}",
        config_object=config_2.__dict__,
    )
    time.sleep(1)
    received_config = tenta_client.get_latest_received_config_message()
    assert received_config is not None
    assert received_config.revision == config_2.revision

    tenta_client.teardown()
