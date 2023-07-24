import aiomqtt
import pytest

import app.mqtt as mqtt
import app.settings as settings


@pytest.fixture(scope="session")
async def mqtt_client():
    """Provide a external MQTT client that is properly closed after testing."""
    async with aiomqtt.Client(
        hostname=settings.MQTT_URL,
        port=settings.MQTT_PORT,
        protocol=aiomqtt.ProtocolVersion.V5,
        username=settings.MQTT_IDENTIFIER,
        password=settings.MQTT_PASSWORD,
    ) as mqtt_client:
        yield mqtt_client


@pytest.mark.anyio
async def test_receiving_measurements_message(mqtt_client):
    """Test receiving a measurements message.

    TODO We have to wait here somehow until the message is processed, otherwise the test
    is not really useful. Check with: ./scripts/test -o log_cli=true
    """
    await mqtt_client.publish(
        topic="measurements/sensor-identifier",
        payload=mqtt._encode_payload(
            {"measurements": [{"revision": 0, "timestamp": 0.0, "value": {}}]}
        ),
        qos=1,
    )
