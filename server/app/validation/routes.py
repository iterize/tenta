import functools
import json
import logging
import typing

import app.errors as errors
import app.validation.types as types


logger = logging.getLogger(__name__)


########################################################################################
# Route validation decorator
########################################################################################


def validate(schema):
    """Enforce request validation on a given starlette route."""

    def decorator(func):
        @functools.wraps(func)
        async def wrapper(request):
            body = await request.body()
            try:
                values = schema(
                    path=request.path_params,
                    query=dict(request.query_params),
                    body={} if len(body) == 0 else json.loads(body.decode()),
                )
            except (TypeError, ValueError) as e:
                logger.warning(
                    f"{request.method} {request.url.path} -- Request failed validation:"
                    f" {repr(e)}"
                )
                raise errors.BadRequestError()
            # TODO Requests are immutable, so we modify the scope and recreate one
            # TODO Integrate into request instead + remove frozen=False from StrictModel
            values.path = values.path.model_dump()
            values.query = values.query.model_dump()
            values.body = values.body.model_dump()
            return await func(request, values)

        return wrapper

    return decorator


########################################################################################
# Path models
########################################################################################


class _ReadStatusRequestPath(types.StrictModel):
    pass


class _CreateUserRequestPath(types.StrictModel):
    pass


class _CreateSessionRequestPath(types.StrictModel):
    pass


class _CreateNetworkRequestPath(types.StrictModel):
    pass


class _ReadNetworksRequestPath(types.StrictModel):
    pass


class _CreateSensorRequestPath(types.StrictModel):
    network_identifier: types.Identifier


class _ReadSensorsRequestPath(types.StrictModel):
    network_identifier: types.Identifier


class _UpdateSensorRequestPath(types.StrictModel):
    network_identifier: types.Identifier
    sensor_identifier: types.Identifier


class _CreateConfigurationRequestPath(types.StrictModel):
    network_identifier: types.Identifier
    sensor_identifier: types.Identifier


class _ReadConfigurationsRequestPath(types.StrictModel):
    network_identifier: types.Identifier
    sensor_identifier: types.Identifier


class _ReadMeasurementsRequestPath(types.StrictModel):
    network_identifier: types.Identifier
    sensor_identifier: types.Identifier


class _ReadLogsRequestPath(types.StrictModel):
    network_identifier: types.Identifier
    sensor_identifier: types.Identifier


class _ReadLogsAggregatesRequestPath(types.StrictModel):
    network_identifier: types.Identifier
    sensor_identifier: types.Identifier


########################################################################################
# Query models
########################################################################################


class _ReadStatusRequestQuery(types.LooseModel):
    pass


class _CreateUserRequestQuery(types.LooseModel):
    pass


class _CreateSessionRequestQuery(types.LooseModel):
    pass


class _CreateNetworkRequestQuery(types.LooseModel):
    pass


class _ReadNetworksRequestQuery(types.LooseModel):
    pass


class _CreateSensorRequestQuery(types.LooseModel):
    pass


class _ReadSensorsRequestQuery(types.LooseModel):
    pass


class _UpdateSensorRequestQuery(types.LooseModel):
    pass


class _CreateConfigurationRequestQuery(types.LooseModel):
    pass


class _ReadConfigurationsRequestQuery(types.LooseModel):
    revision: types.Revision = None
    direction: typing.Literal["next", "previous"] = "next"


class _ReadMeasurementsRequestQuery(types.LooseModel):
    creation_timestamp: types.Timestamp = None
    direction: typing.Literal["next", "previous"] = "next"
    aggregate: bool = False


class _ReadLogsRequestQuery(types.LooseModel):
    creation_timestamp: types.Timestamp = None
    direction: typing.Literal["next", "previous"] = "next"


class _ReadLogsAggregatesRequestQuery(types.LooseModel):
    pass


########################################################################################
# Body models
########################################################################################


class _ReadStatusRequestBody(types.StrictModel):
    pass


class _CreateUserRequestBody(types.StrictModel):
    user_name: types.Name
    password: types.Password


class _CreateSessionRequestBody(types.StrictModel):
    user_name: types.Name
    password: types.Password


class _CreateNetworkRequestBody(types.StrictModel):
    network_name: types.Name


class _ReadNetworksRequestBody(types.StrictModel):
    pass


class _CreateSensorRequestBody(types.StrictModel):
    sensor_name: types.Name


class _ReadSensorsRequestBody(types.StrictModel):
    pass


class _UpdateSensorRequestBody(types.StrictModel):
    sensor_name: types.Name


class _CreateConfigurationRequestBody(types.Configuration):
    pass


class _ReadConfigurationsRequestBody(types.StrictModel):
    pass


class _ReadMeasurementsRequestBody(types.StrictModel):
    pass


class _ReadLogsRequestBody(types.StrictModel):
    pass


class _ReadLogsAggregatesRequestBody(types.StrictModel):
    pass


########################################################################################
# Request models
# TODO Can we generate these automatically?
########################################################################################


class ReadStatusRequest(types.StrictModel):
    path: _ReadStatusRequestPath
    query: _ReadStatusRequestQuery
    body: _ReadStatusRequestBody


class CreateUserRequest(types.StrictModel):
    path: _CreateUserRequestPath
    query: _CreateUserRequestQuery
    body: _CreateUserRequestBody


class CreateSessionRequest(types.StrictModel):
    path: _CreateSessionRequestPath
    query: _CreateSessionRequestQuery
    body: _CreateSessionRequestBody


class CreateNetworkRequest(types.StrictModel):
    path: _CreateNetworkRequestPath
    query: _CreateNetworkRequestQuery
    body: _CreateNetworkRequestBody


class ReadNetworksRequest(types.StrictModel):
    path: _ReadNetworksRequestPath
    query: _ReadNetworksRequestQuery
    body: _ReadNetworksRequestBody


class CreateSensorRequest(types.StrictModel):
    path: _CreateSensorRequestPath
    query: _CreateSensorRequestQuery
    body: _CreateSensorRequestBody


class ReadSensorsRequest(types.StrictModel):
    path: _ReadSensorsRequestPath
    query: _ReadSensorsRequestQuery
    body: _ReadSensorsRequestBody


class UpdateSensorRequest(types.StrictModel):
    path: _UpdateSensorRequestPath
    query: _UpdateSensorRequestQuery
    body: _UpdateSensorRequestBody


class CreateConfigurationRequest(types.StrictModel):
    path: _CreateConfigurationRequestPath
    query: _CreateConfigurationRequestQuery
    body: _CreateConfigurationRequestBody


class ReadConfigurationsRequest(types.StrictModel):
    path: _ReadConfigurationsRequestPath
    query: _ReadConfigurationsRequestQuery
    body: _ReadConfigurationsRequestBody


class ReadMeasurementsRequest(types.StrictModel):
    path: _ReadMeasurementsRequestPath
    query: _ReadMeasurementsRequestQuery
    body: _ReadMeasurementsRequestBody


class ReadLogsRequest(types.StrictModel):
    path: _ReadLogsRequestPath
    query: _ReadLogsRequestQuery
    body: _ReadLogsRequestBody


class ReadLogsAggregatesRequest(types.StrictModel):
    path: _ReadLogsAggregatesRequestPath
    query: _ReadLogsAggregatesRequestQuery
    body: _ReadLogsAggregatesRequestBody
