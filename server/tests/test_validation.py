import pydantic
import pytest

import app.validation as validation


########################################################################################
# Test data
########################################################################################


@pytest.fixture(scope="session")
def identifier():
    return "00000000-0000-4000-8000-000000000000"


########################################################################################
# Type models
########################################################################################


def test_validate_type_name_pass():
    """Test that Name type passes some valid values."""
    pydantic.TypeAdapter(validation.types.Name).validate_python("x")
    pydantic.TypeAdapter(validation.types.Name).validate_python("x-x")
    pydantic.TypeAdapter(validation.types.Name).validate_python("x-x-x")
    pydantic.TypeAdapter(validation.types.Name).validate_python("x" * 64)
    pydantic.TypeAdapter(validation.types.Name).validate_python("12345678")
    pydantic.TypeAdapter(validation.types.Name).validate_python("example")
    pydantic.TypeAdapter(validation.types.Name).validate_python("12345678-abc")
    pydantic.TypeAdapter(validation.types.Name).validate_python("un1c0rn")


def test_validate_type_name_fail():
    """Test that Name type fails some invalid values."""
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Name).validate_python("")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Name).validate_python("-")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Name).validate_python("--")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Name).validate_python("x-")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Name).validate_python("-x")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Name).validate_python("x--x")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Name).validate_python("x--")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Name).validate_python("-x-x--")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Name).validate_python("x_x")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Name).validate_python("xxx?x")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Name).validate_python("x" * 65)
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Name).validate_python("x" * 256)
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Name).validate_python("^")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Name).validate_python("🔥")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Name).validate_python("饭")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Name).validate_python('"')
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Name).validate_python(".;")


def test_validate_type_key_pass():
    """Test that Key type passes some valid values."""
    pydantic.TypeAdapter(validation.types.Key).validate_python("x")
    pydantic.TypeAdapter(validation.types.Key).validate_python("x_x")
    pydantic.TypeAdapter(validation.types.Key).validate_python("x_x_x")
    pydantic.TypeAdapter(validation.types.Key).validate_python("x" * 64)
    pydantic.TypeAdapter(validation.types.Key).validate_python("12345678")
    pydantic.TypeAdapter(validation.types.Key).validate_python("example")
    pydantic.TypeAdapter(validation.types.Key).validate_python("example_abc")
    pydantic.TypeAdapter(validation.types.Key).validate_python("un1c0rn")


def test_validate_type_key_fail():
    """Test that Key type fails some invalid values."""
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Key).validate_python("")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Key).validate_python("_")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Key).validate_python("__")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Key).validate_python("x_")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Key).validate_python("_x")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Key).validate_python("x__x")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Key).validate_python("x__")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Key).validate_python("_x_x__")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Key).validate_python("x-x")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Key).validate_python("xxx?x")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Key).validate_python("x" * 65)
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Key).validate_python("x" * 256)
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Key).validate_python("^")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Key).validate_python("🔥")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Key).validate_python("饭")
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Key).validate_python('"')
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Key).validate_python(".;")


########################################################################################
# Route models
########################################################################################


def test_validate_route_create_configuration_body_pass(identifier):
    """Test that CreateConfigurationRequest model passes some valid values."""
    validation.routes.CreateConfigurationRequest(
        path={"network_identifier": identifier, "sensor_identifier": identifier},
        query={},
        body={},
    )
    validation.routes.CreateConfigurationRequest(
        path={"network_identifier": identifier, "sensor_identifier": identifier},
        query={},
        body={"measurement_interval": 8.5, "cache": True, "strategy": "default"},
    )


def test_validate_route_create_configuration_body_fail(identifier):
    """Test that CreateConfigurationRequest model fails some invalid values."""
    with pytest.raises(pydantic.ValidationError):
        validation.routes.CreateConfigurationRequest(
            path={"network_identifier": identifier, "sensor_identifier": identifier},
            query={},
            body=list(),
        )
    with pytest.raises(pydantic.ValidationError):
        validation.routes.CreateConfigurationRequest(
            path={"network_identifier": identifier, "sensor_identifier": identifier},
            query={},
            body=42,
        )
    with pytest.raises(pydantic.ValidationError):
        validation.routes.CreateConfigurationRequest(
            path={"network_identifier": identifier},
            query={},
            body={},
        )
    with pytest.raises(pydantic.ValidationError):
        validation.routes.CreateConfigurationRequest(
            path={"network_identifier": identifier, "example": identifier},
            query={},
            body={},
        )
    with pytest.raises(pydantic.ValidationError):
        validation.routes.CreateConfigurationRequest(
            path={},
            query={"example": 42},
            body={},
        )


########################################################################################
# MQTT models
########################################################################################


def test_validate_mqtt_acknowledgments_pass():
    """Test that AcknowledgmentsValidator passes some valid values."""
    validation.mqtt.AcknowledgmentsValidator.validate_python(
        [{"success": True, "timestamp": 0, "revision": 0}]
    )
    validation.mqtt.AcknowledgmentsValidator.validate_python(
        [
            {"success": True, "timestamp": 0, "revision": 0},
            {"success": True, "timestamp": 0, "revision": 0},
        ]
    )
    validation.mqtt.AcknowledgmentsValidator.validate_python(
        [
            {
                "success": False,
                "timestamp": -9999999999999999.9999999999999999,
                "revision": validation.constants.Limit.MAXINT4 - 1,
            }
        ]
    )


def test_validate_mqtt_acknowledgments_fail():
    """Test that AcknowledgmentsValidator fails some invalid values."""
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.AcknowledgmentsValidator.validate_python([])
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.AcknowledgmentsValidator.validate_python(
            {"success": True, "timestamp": 0, "revision": 0}
        )
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.AcknowledgmentsValidator.validate_python(
            [{"success": True, "timestamp": 0}]
        )
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.AcknowledgmentsValidator.validate_python(
            [{"success": 1, "timestamp": 0, "revision": 0}]
        )
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.AcknowledgmentsValidator.validate_python(
            [
                {
                    "success": True,
                    "timestamp": 0,
                    "revision": -1,
                }
            ]
        )


def test_validate_mqtt_measurements_pass():
    """Test that MeasurementsValidator passes some valid values."""
    validation.mqtt.MeasurementsValidator.validate_python(
        [{"value": {"temperature": 0}, "timestamp": 0}]
    )
    validation.mqtt.MeasurementsValidator.validate_python(
        [{"value": {"temperature": 0}, "timestamp": 0, "revision": None}]
    )
    validation.mqtt.MeasurementsValidator.validate_python(
        [
            {"value": {"temperature": 0}, "timestamp": 0},
            {"value": {"temperature": 0}, "timestamp": 0},
        ]
    )
    validation.mqtt.MeasurementsValidator.validate_python(
        [{"value": {"temperature": 0}, "timestamp": 0, "revision": 0}]
    )
    validation.mqtt.MeasurementsValidator.validate_python(
        [
            {
                "value": {"temperature": -9999999999999999.9999999999999999},
                "timestamp": 9999999999999999.9999999999999999,
                "revision": validation.constants.Limit.MAXINT4 - 1,
            }
        ]
    )


def test_validate_mqtt_measurements_fail():
    """Test that MeasurementsValidator fails some invalid values."""
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.MeasurementsValidator.validate_python([])
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.MeasurementsValidator.validate_python(
            {"value": {"temperature": 0}, "timestamp": 0}
        )
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.MeasurementsValidator.validate_python(
            [{"value": {}, "timestamp": 0, "revision": 0}]
        )
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.MeasurementsValidator.validate_python(
            [{"value": {"temperature": True}, "timestamp": 0}]
        )
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.MeasurementsValidator.validate_python(
            [{"timestamp": 0, "revision": 0}]
        )
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.MeasurementsValidator.validate_python(
            [{"value": {"temperature": 0}}]
        )
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.MeasurementsValidator.validate_python(
            [
                {
                    "value": {"temperature": 0},
                    "timestamp": 0,
                    "revision": validation.constants.Limit.MAXINT4,
                }
            ]
        )
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.MeasurementsValidator.validate_python(
            [
                {
                    "value": {"temperature": 0},
                    "timestamp": 0,
                    "revision": 0,
                    "humidity": 0,
                }
            ]
        )


def test_validate_mqtt_logs_pass():
    """Test that LogsValidator passes some valid values."""
    validation.mqtt.LogsValidator.validate_python(
        [{"message": "", "severity": "info", "timestamp": 0}]
    )
    validation.mqtt.LogsValidator.validate_python(
        [{"message": "", "severity": "warning", "timestamp": 0}]
    )
    validation.mqtt.LogsValidator.validate_python(
        [{"message": "", "severity": "info", "timestamp": 0, "revision": None}]
    )
    validation.mqtt.LogsValidator.validate_python(
        [{"message": "", "severity": "info", "timestamp": 0, "revision": 0}]
    )
    validation.mqtt.LogsValidator.validate_python(
        [
            {"message": "", "severity": "info", "timestamp": 0},
            {"message": "", "severity": "info", "timestamp": 0},
        ]
    )
    validation.mqtt.LogsValidator.validate_python(
        [
            {
                "message": "x" * validation.constants.Limit.LARGE + "x",
                "severity": "info",
                "timestamp": 9999999999999999.9999999999999999,
                "revision": validation.constants.Limit.MAXINT4 - 1,
            }
        ]
    )


def test_validate_mqtt_logs_fail():
    """Test that LogsValidator fails some invalid values."""
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.LogsValidator.validate_python([])
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.LogsValidator.validate_python(
            {"message": "", "severity": "info", "timestamp": 0}
        )
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.LogsValidator.validate_python(
            [{"message": None, "severity": "info", "timestamp": 0}]
        )
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.LogsValidator.validate_python([{"message": "", "timestamp": 0}])
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.LogsValidator.validate_python(
            [{"message": "", "severity": "example", "timestamp": 0}]
        )
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.LogsValidator.validate_python(
            [{"message": "", "severity": "info", "timestamp": 0, "revision": -1}]
        )
    with pytest.raises(pydantic.ValidationError):
        validation.mqtt.LogsValidator.validate_python(
            [{"message": "", "severity": "info", "timestamp": 0, "revision": 0.0}]
        )
