import pydantic
import pytest

import app.validation as validation


# TODO test validation of measurements with 1.5, 1.0, 0.0, True


########################################################################################
# Types
########################################################################################


@pytest.mark.parametrize(
    "value", ["x", "x-x", "x-x-x", "x" * 64, "12345678", "example", "12345678-abc"]
)
def test_validate_type_name_pass(value):
    pydantic.TypeAdapter(validation.types.Name).validate_python(value)


@pytest.mark.parametrize(
    "value",
    [
        "",
        "-",
        "--",
        "x-",
        "-x",
        "x--x",
        "x--",
        "-x-x--",
        "x_x",
        "xxxxx#",
        "x" * 65,
        "x" * 256,
        "^",
        "🔥",
        "饭",
        '"',
        ".;",
    ],
)
def test_validate_type_name_fail(value):
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Name).validate_python(value)


@pytest.mark.parametrize("value", ["x", "x_x", "x_x_x", "x" * 64, "abc", "example_abc"])
def test_validate_type_key_pass(value):
    pydantic.TypeAdapter(validation.types.Key).validate_python(value)


@pytest.mark.parametrize(
    "value",
    [
        "",
        "_",
        "__",
        "x_",
        "_x",
        "x__x",
        "x__",
        "_x_x__",
        "x-x",
        "xxxxx#",
        "x" * 65,
        "x" * 256,
        "^",
        "🔥",
        "饭",
        '"',
        ".;",
        "12345678",
        "example_123",
    ],
)
def test_validate_type_key_fail(value):
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(validation.types.Key).validate_python(value)


########################################################################################
# Routes
########################################################################################


@pytest.mark.parametrize(
    "value", [{}, {"somewhere": 8.5, "what": True, "tomorrow": "value"}]
)
def test_validate_route_create_configuration_body_pass(value):
    pydantic.TypeAdapter(
        validation.routes._CreateConfigurationRequestBody
    ).validate_python(value)


@pytest.mark.parametrize("value", [42, "example", True, None, []])
def test_validate_route_create_configuration_body_fail(value):
    with pytest.raises(pydantic.ValidationError):
        pydantic.TypeAdapter(
            validation.routes._CreateConfigurationRequestBody
        ).validate_python(value)
