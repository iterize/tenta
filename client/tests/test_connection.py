import os
import ssl
import typing
import tenta

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MQTT_BROKERS: typing.List[typing.Dict[str, typing.Any]] = [
    {
        "mqtt_host": "test.mosquitto.org",
        "mqtt_port": 8885,
        "mqtt_identifier": "rw",
        "mqtt_password": "readwrite",
        "tls_parameters": tenta.TLSParameters(
            ca_certs=os.path.join(PROJECT_DIR, "tests/mosquitto.org.crt"),
            cert_reqs=ssl.CERT_REQUIRED,
            tls_version=ssl.PROTOCOL_TLSv1_2,
        ),
    },
    {
        "mqtt_host": "test.mosquitto.org",
        "mqtt_port": 1884,
        "mqtt_identifier": "rw",
        "mqtt_password": "readwrite",
    },
]
DEFAULTS: typing.Dict[str, typing.Any] = {
    "sensor_identifier": "some-sensor-id",
    "revision": 17,
    "connection_timeout": 1,
}


def test_successful_connection() -> None:
    for broker in MQTT_BROKERS:
        tenta.TentaClient(
            **broker,
            **DEFAULTS,
        ).teardown()


def test_bad_connection_with_wrong_host() -> None:
    for broker in MQTT_BROKERS:
        try:
            tenta.TentaClient(
                **{**broker, "mqtt_host": "notadomain"},
                **DEFAULTS,
            ).teardown()
        except Exception:
            return

        raise Exception("Should have raised an exception")


def test_bad_connection_with_wrong_port() -> None:
    for broker in MQTT_BROKERS:
        try:
            tenta.TentaClient(
                **{**broker, "mqtt_port": 1234},
                **DEFAULTS,
            ).teardown()
        except ConnectionError:
            return

        raise Exception("Should have raised a ConnectionError")


def test_bad_connection_with_wrong_identifier() -> None:
    for broker in MQTT_BROKERS:
        try:
            tenta.TentaClient(
                **{**broker, "mqtt_identifier": "..."},
                **DEFAULTS,
            ).teardown()
        except ConnectionError:
            return

        raise Exception("Should have raised a ConnectionError")


def test_bad_connection_with_wrong_password() -> None:
    for broker in MQTT_BROKERS:
        try:
            tenta.TentaClient(
                **{**broker, "mqtt_password": "..."},
                **DEFAULTS,
            ).teardown()
        except ConnectionError:
            return

        raise Exception("Should have raised a ConnectionError")