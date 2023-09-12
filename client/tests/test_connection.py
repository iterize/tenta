import tenta

MQTT_HOST = "test.mosquitto.org"
MQTT_PORT = 1884
MQTT_IDENTIFIER = "rw"
MQTT_PASSWORD = "readwrite"
CONNECTION_TIMEOUT = 3


def test_successful_connection() -> None:
    tenta_client = tenta.TentaClient(
        mqtt_host=MQTT_HOST,
        mqtt_port=MQTT_PORT,
        mqtt_identifier=MQTT_IDENTIFIER,
        mqtt_password=MQTT_PASSWORD,
        sensor_identifier="some-sensor-id",
        revision=1,
        connection_timeout=CONNECTION_TIMEOUT,
    )

    tenta_client.teardown()


def test_bad_connection_with_wrong_host() -> None:
    try:
        tenta_client = tenta.TentaClient(
            mqtt_host=f"notadomain.{MQTT_HOST}",
            mqtt_port=MQTT_PORT,
            mqtt_identifier=MQTT_IDENTIFIER,
            mqtt_password=MQTT_PASSWORD,
            sensor_identifier="some-sensor-id",
            revision=1,
            connection_timeout=CONNECTION_TIMEOUT,
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
            connection_timeout=CONNECTION_TIMEOUT,
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
            connection_timeout=CONNECTION_TIMEOUT,
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
            connection_timeout=CONNECTION_TIMEOUT,
        )
        tenta_client.teardown()
    except ConnectionError:
        return

    raise Exception("Should have raised a ConnectionError")
