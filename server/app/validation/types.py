import pydantic
import typing

import app.validation.constants as constants


########################################################################################
# Base model
########################################################################################


class StrictModel(pydantic.BaseModel):
    # TODO Set frozen=True, see routes.py for details
    model_config = pydantic.ConfigDict(strict=True, frozen=False, extra="forbid")


class LooseModel(pydantic.BaseModel):
    model_config = pydantic.ConfigDict(strict=False, frozen=True, extra="forbid")


class Configuration(StrictModel, extra="allow"):
    # TODO Validate the values more thoroughly for min and max limits/lengths
    # number of JSON fields or nesting depth could be interesting as well
    # Or, check the actual size of the JSON / length of the JSON string
    pass


########################################################################################
# Types
########################################################################################


Name = pydantic.constr(max_length=64, pattern=constants.Pattern.NAME.value)
Identifier = pydantic.constr(pattern=constants.Pattern.IDENTIFIER.value)
Password = pydantic.constr(min_length=8, max_length=constants.Limit.MEDIUM)
Key = pydantic.constr(max_length=64, pattern=constants.Pattern.KEY.value)

# PostgreSQL errors if an integer is out of range, so we must validate
Revision = pydantic.conint(ge=0, lt=constants.Limit.MAXINT4)

# PostgreSQL rounds if it cannot store a float in full precision, so we do not need to
# validate min/max values here
Timestamp = float
Measurement = typing.Annotated[dict[Key, float], pydantic.Field(min_length=1)]
