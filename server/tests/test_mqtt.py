import app.mqtt as mqtt
import app.validation as validation


########################################################################################
# Acknowledgments
########################################################################################


async def test_handle_acknowledgments(reset, connection, sensor_identifier):
    """Test handling an acknowledgments message."""
    await mqtt._handle_acknowledgments(
        sensor_identifier,
        [validation.Acknowledgment(success=True, timestamp=0, revision=0)],
        connection,
    )


async def test_handle_acknowledgments_with_multiple(
    reset, connection, sensor_identifier
):
    """Test handling a batched acknowledgments message."""
    await mqtt._handle_acknowledgments(
        sensor_identifier,
        [validation.Acknowledgment(success=True, timestamp=0, revision=0)] * 2,
        connection,
    )


async def test_handle_acknowledgments_with_nonexistent_sensor(
    reset, connection, identifier
):
    """Test handling an acknowledgments message for a nonexistent sensor."""
    await mqtt._handle_acknowledgments(
        identifier,
        [validation.Acknowledgment(success=True, timestamp=0, revision=0)],
        connection,
    )


########################################################################################
# Measurements
########################################################################################


async def test_handle_measurements(reset, connection, sensor_identifier):
    """Test handling a measurements message."""
    await mqtt._handle_measurements(
        sensor_identifier,
        [validation.Measurement(value={"temperature": 0}, timestamp=0)],
        connection,
    )


async def test_handle_measurements_with_multiple(reset, connection, sensor_identifier):
    """Test handling a batched measurements message."""
    await mqtt._handle_measurements(
        sensor_identifier,
        [validation.Measurement(value={"temperature": 0}, timestamp=0)] * 2,
        connection,
    )


async def test_handle_measurements_with_nonexistent_sensor(
    reset, connection, identifier
):
    """Test handling a measurements message for a nonexistent sensor."""
    await mqtt._handle_measurements(
        identifier,
        [validation.Measurement(value={"temperature": 0}, timestamp=0)],
        connection,
    )


########################################################################################
# Logs
########################################################################################


async def test_handle_logs(reset, connection, sensor_identifier):
    """Test handling a logs message."""
    await mqtt._handle_logs(
        sensor_identifier,
        [validation.Log(message="", severity="info", timestamp=0)],
        connection,
    )


async def test_handle_logs_with_multiple(reset, connection, sensor_identifier):
    """Test handling a batched logs message."""
    await mqtt._handle_logs(
        sensor_identifier,
        [validation.Log(message="", severity="info", timestamp=0)] * 2,
        connection,
    )


async def test_handle_logs_with_nonexistent_sensor(reset, connection, identifier):
    """Test handling a logs message for a nonexistent sensor."""
    await mqtt._handle_logs(
        identifier,
        [validation.Log(message="", severity="info", timestamp=0)],
        connection,
    )
