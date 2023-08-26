import typing

import pydantic

import app.validation.constants as constants
import app.validation.types as types


########################################################################################
# Base types
########################################################################################


class Acknowledgment(types.StrictModel):
    timestamp: types.Timestamp
    revision: types.Revision
    success: bool  # Records if the configuration was processed successfully


class Measurement(types.StrictModel):
    timestamp: types.Timestamp
    revision: types.Revision | None = None
    value: types.Measurement


class Log(types.StrictModel):
    timestamp: types.Timestamp
    revision: types.Revision | None = None
    severity: typing.Literal["info", "warning", "error"]
    subject: str
    details: str | None = None

    @pydantic.field_validator("subject")
    def trim_subject(cls, v):
        return v[: constants.Limit.MEDIUM]

    @pydantic.field_validator("details")
    def trim_details(cls, v):
        return v[: constants.Limit.LARGE]


########################################################################################
# Validators for the batched messages
########################################################################################

AcknowledgmentsValidator = pydantic.TypeAdapter(
    pydantic.conlist(item_type=Acknowledgment, min_length=1),
)
MeasurementsValidator = pydantic.TypeAdapter(
    pydantic.conlist(item_type=Measurement, min_length=1),
)
LogsValidator = pydantic.TypeAdapter(
    pydantic.conlist(item_type=Log, min_length=1),
)
