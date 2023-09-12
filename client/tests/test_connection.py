import tenta

MQTT_HOST = "127.0.0.1"
MQTT_PORT = 1883
MQTT_IDENTIFIER = "client"
MQTT_PASSWORD = "password"


def test_bad_connection_with_wrong_host() -> None:
    try:
        tenta_client = tenta.TentaClient(
            mqtt_host=f"notadomain.{MQTT_HOST}",
            mqtt_port=MQTT_PORT,
            mqtt_identifier=MQTT_IDENTIFIER,
            mqtt_password=MQTT_PASSWORD,
            sensor_identifier="some-sensor-id",
            revision=1,
            connection_timeout=1,
        )
        tenta_client.teardown()
    except Exception:
        return

    raise Exception("Should have raised an exception")


def test_bad_connection_with_wrong_port() -> None:
    try:
        tenta_client = tenta.TentaClient(
            mqtt_host=MQTT_HOST,
            mqtt_port=MQTT_PORT + 1,
            mqtt_identifier=MQTT_IDENTIFIER,
            mqtt_password=MQTT_PASSWORD,
            sensor_identifier="some-sensor-id",
            revision=1,
            connection_timeout=1,
        )
        tenta_client.teardown()
    except ConnectionError:
        return

    raise Exception("Should have raised a ConnectionError")


def test_bad_connection_with_wrong_identifier() -> None:
    try:
        tenta_client = tenta.TentaClient(
            mqtt_host=MQTT_HOST,
            mqtt_port=MQTT_PORT,
            mqtt_identifier=MQTT_IDENTIFIER + "...",
            mqtt_password=MQTT_PASSWORD,
            sensor_identifier="some-sensor-id",
            revision=1,
            connection_timeout=1,
        )
        tenta_client.teardown()
    except ConnectionError:
        return

    raise Exception("Should have raised a ConnectionError")


def test_bad_connection_with_wrong_password() -> None:
    try:
        tenta_client = tenta.TentaClient(
            mqtt_host=MQTT_HOST,
            mqtt_port=MQTT_PORT,
            mqtt_identifier=MQTT_IDENTIFIER,
            mqtt_password=MQTT_PASSWORD + "...",
            sensor_identifier="some-sensor-id",
            revision=1,
            connection_timeout=1,
        )
        tenta_client.teardown()
    except ConnectionError:
        return

    raise Exception("Should have raised a ConnectionError")


def test_successful_connection() -> None:
    tenta_client = tenta.TentaClient(
        mqtt_host=MQTT_HOST,
        mqtt_port=MQTT_PORT,
        mqtt_identifier=MQTT_IDENTIFIER,
        mqtt_password=MQTT_PASSWORD,
        sensor_identifier="some-sensor-id",
        revision=1,
        connection_timeout=1,
    )

    tenta_client.teardown()
