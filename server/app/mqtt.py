import asyncio
import contextlib
import json
import logging
import ssl

import aiomqtt
import asyncpg
import pydantic

import app.database as database
import app.settings as settings
import app.validation as validation
import app.utils as utils


def _encode_payload(payload):
    """Encode python dict into utf-8 JSON bytestring."""
    return json.dumps(payload).encode()


logger = logging.getLogger(__name__)
task_references = set()


@contextlib.asynccontextmanager
async def client():
    """Context manager to manage aiomqtt client with custom settings."""
    async with aiomqtt.Client(
        hostname=settings.MQTT_HOSTNAME,
        port=settings.MQTT_PORT,
        protocol=aiomqtt.ProtocolVersion.V5,
        username=settings.MQTT_IDENTIFIER,
        password=settings.MQTT_PASSWORD,
        # TODO it would be nicer to use TLS here for local development as well
        tls_params=(
            aiomqtt.TLSParameters(tls_version=ssl.PROTOCOL_TLS)
            if settings.ENVIRONMENT == "production"
            else None
        ),
        # Make the MQTT connection persistent. The broker will retain messages on
        # topics we subscribed to in case we disconnect.
        clean_start=False,
        identifier="server",
    ) as x:
        yield x


async def publish_configuration(
    sensor_identifier, revision, configuration, client, dbpool
):
    """Publish a configuration to the specified sensor."""

    async def helper(sensor_identifier, revision, configuration):
        query, arguments = database.parametrize(
            identifier="update-configuration-on-publication",
            arguments={
                "sensor_identifier": sensor_identifier,
                "revision": revision,
            },
        )
        for boff in utils.backoff():
            try:
                # Try to publish the configuration
                await client.publish(
                    topic=f"configurations/{sensor_identifier}",
                    payload=_encode_payload(
                        {"revision": revision, "configuration": configuration}
                    ),
                    qos=1,
                    retain=True,
                )
                # Try to set the publication timestamp in the database
                await dbpool.execute(query, *arguments)
                logger.info(f"Published configuration {sensor_identifier}#{revision}")
                break
            except Exception as e:  # pragma: no cover
                # Retry if something fails. Duplicate messages are not a problem,
                # the sensor can ignore them based on the revision number.
                # The revision number only increases, never decreases.
                logger.warning(
                    f"Failed to publish configuration {sensor_identifier}#{revision},"
                    f" retrying in {boff} seconds: {repr(e)}"
                )
                await asyncio.sleep(boff)

    # Fire-and-forget the retry task, save the reference, and return immediately
    task = asyncio.create_task(helper(sensor_identifier, revision, configuration))
    task_references.add(task)
    task.add_done_callback(task_references.remove)


async def _handle_acknowledgments(sensor_identifier, payload, dbpool):
    query, arguments = database.parametrize(
        identifier="update-configuration-on-acknowledgment",
        arguments=[
            {
                "sensor_identifier": sensor_identifier,
                "success": element.success,
                "acknowledgment_timestamp": element.timestamp,
                "revision": element.revision,
            }
            for element in payload
        ],
    )
    # Ignores when the sensor or revision does not exist, because it's an UPDATE query
    await dbpool.executemany(query, arguments)


async def _handle_measurements(sensor_identifier, payload, dbpool):
    query, arguments = database.parametrize(
        identifier="create-measurement",
        arguments=[
            {
                "sensor_identifier": sensor_identifier,
                "attribute": attribute,
                "value": value,
                "creation_timestamp": element.timestamp,
                "revision": element.revision,
            }
            for element in payload
            for attribute, value in element.value.items()
        ],
    )
    try:
        await dbpool.executemany(query, arguments)
    except asyncpg.ForeignKeyViolationError:
        logger.warning(f"Failed to handle; Sensor not found: {sensor_identifier}")


async def _handle_logs(sensor_identifier, payload, dbpool):
    query, arguments = database.parametrize(
        identifier="create-log",
        arguments=[
            {
                "sensor_identifier": sensor_identifier,
                "message": element.message,
                "severity": element.severity,
                "creation_timestamp": element.timestamp,
                "revision": element.revision,
            }
            for element in payload
        ],
    )
    try:
        await dbpool.executemany(query, arguments)
    except asyncpg.ForeignKeyViolationError:
        logger.warning(f"Failed to handle; Sensor not found: {sensor_identifier}")


SUBSCRIPTIONS = {
    "acknowledgments/+": (
        _handle_acknowledgments,
        validation.AcknowledgmentsValidator,
    ),
    "measurements/+": (
        _handle_measurements,
        validation.MeasurementsValidator,
    ),
    "logs/+": (
        _handle_logs,
        validation.LogsValidator,
    ),
}


async def handle(client, dbpool):
    """Subscribe and handle incoming MQTT messages from sensors."""
    for wildcard in SUBSCRIPTIONS.keys():
        # Subscribe to all our topics
        await client.subscribe(wildcard, qos=1, timeout=10)
        logger.info(f"Subscribed to: {wildcard}")
    while True:
        try:
            async for message in client._messages():
                logger.debug(f"Received: {message.payload!r} on topic: {message.topic}")
                # Get sensor identifier from the topic
                # TODO validate that identifier is a valid UUID format
                sensor_identifier = str(message.topic).split("/")[-1]
                # Call the appropriate handler; First match wins
                for wildcard, (handle, validator) in SUBSCRIPTIONS.items():
                    if message.topic.matches(wildcard):
                        try:
                            payload = validator.validate_json(message.payload)
                            await handle(sensor_identifier, payload, dbpool)
                        # Errors are logged and ignored as we can't give feedback
                        except pydantic.ValidationError:
                            logger.warning(f"Malformed message: {message.payload!r}")
                        except Exception as e:  # pragma: no cover
                            logger.error(e, exc_info=True)
                        break
                else:  # Executed if no break is called
                    logger.warning(f"Failed to match topic: {message.topic}")
        except aiomqtt.MqttError:
            # Reconnect on error
            logger.error("Lost connection to the MQTT broker")
            for boff in utils.backoff():
                logger.info(f"Reconnecting to the MQTT broker in {boff:.2f} seconds")
                await asyncio.sleep(boff)
                with contextlib.suppress(aiomqtt.MqttError):
                    await client.__aexit__(None, None, None)
                with contextlib.suppress(aiomqtt.MqttError):
                    await client.__aenter__()
                    logger.info("Successfully reconnected to the MQTT broker")
                    break
