import asyncio
import contextlib
import logging

import asyncpg
import starlette.applications
import starlette.middleware
import starlette.middleware.cors
import starlette.responses
import starlette.routing

import app.auth as auth
import app.database as database
import app.errors as errors
import app.logs as logs
import app.mqtt as mqtt
import app.settings as settings
import app.validation as validation


@validation.validate(schema=validation.ReadStatusRequest)
async def read_status(request, values):
    return starlette.responses.JSONResponse(
        status_code=200,
        content={
            "environment": settings.ENVIRONMENT,
            "commit_sha": settings.COMMIT_SHA,
            "branch_name": settings.BRANCH_NAME,
            "start_timestamp": settings.START_TIMESTAMP,
        },
    )


@validation.validate(schema=validation.CreateUserRequest)
async def create_user(request, values):
    password_hash = auth.hash_password(values.body["password"])
    access_token = auth.generate_token()
    access_token_hash = auth.hash_token(access_token)
    async with request.state.dbpool.acquire() as connection:
        async with connection.transaction():
            # Create new user
            query, arguments = database.parametrize(
                identifier="create-user",
                arguments={
                    "user_name": values.body["user_name"],
                    "password_hash": password_hash,
                },
            )
            try:
                elements = await connection.fetch(query, *arguments)
            except asyncpg.exceptions.UniqueViolationError:
                logger.warning(
                    f"{request.method} {request.url.path} -- Uniqueness violation"
                )
                raise errors.ConflictError
            user_identifier = database.dictify(elements)[0]["user_identifier"]
            # Create new session
            query, arguments = database.parametrize(
                identifier="create-session",
                arguments={
                    "access_token_hash": access_token_hash,
                    "user_identifier": user_identifier,
                },
            )
            await connection.execute(query, *arguments)
    # Return successful response
    return starlette.responses.JSONResponse(
        status_code=201,
        content={"user_identifier": user_identifier, "access_token": access_token},
    )


@validation.validate(schema=validation.CreateSessionRequest)
async def create_session(request, values):
    # Read the user
    query, arguments = database.parametrize(
        identifier="read-user", arguments={"user_name": values.body["user_name"]}
    )
    elements = await request.state.dbpool.fetch(query, *arguments)
    elements = database.dictify(elements)
    if len(elements) == 0:
        logger.warning(f"{request.method} {request.url.path} -- User not found")
        raise errors.NotFoundError
    user_identifier = elements[0]["user_identifier"]
    password_hash = elements[0]["password_hash"]
    # Check if password hashes match
    if not auth.verify_password(values.body["password"], password_hash):
        logger.warning(f"{request.method} {request.url.path} -- Invalid password")
        raise errors.UnauthorizedError
    access_token = auth.generate_token()
    # Create new session
    query, arguments = database.parametrize(
        identifier="create-session",
        arguments={
            "access_token_hash": auth.hash_token(access_token),
            "user_identifier": user_identifier,
        },
    )
    await request.state.dbpool.execute(query, *arguments)
    # Return successful response
    return starlette.responses.JSONResponse(
        status_code=201,
        content={"user_identifier": user_identifier, "access_token": access_token},
    )


@validation.validate(schema=validation.CreateNetworkRequest)
async def create_network(request, values):
    relationship = await auth.authorize(request, auth.User(request.state.identity))
    if relationship < auth.Relationship.DEFAULT:
        # We don't check for < OWNER because a user is always it's own owner
        raise errors.UnauthorizedError
    async with request.state.dbpool.acquire() as connection:
        async with connection.transaction():
            # Create new network
            query, arguments = database.parametrize(
                identifier="create-network",
                arguments={"network_name": values.body["network_name"]},
            )
            try:
                elements = await request.state.dbpool.fetch(query, *arguments)
            except asyncpg.exceptions.UniqueViolationError:
                logger.warning(
                    f"{request.method} {request.url.path} -- Uniqueness violation"
                )
                raise errors.ConflictError
            network_identifier = database.dictify(elements)[0]["network_identifier"]
            # Create new permission
            query, arguments = database.parametrize(
                identifier="create-permission",
                arguments={
                    "user_identifier": request.state.identity,
                    "network_identifier": network_identifier,
                },
            )
            try:
                await connection.execute(query, *arguments)
            except asyncpg.ForeignKeyViolationError:
                # This can happen if the user is deleted after the permissions check
                logger.warning(f"{request.method} {request.url.path} -- User not found")
                raise errors.UnauthorizedError
    # Return successful response
    return starlette.responses.JSONResponse(
        status_code=201,
        content={"network_identifier": network_identifier},
    )


@validation.validate(schema=validation.ReadNetworksRequest)
async def read_networks(request, values):
    """Read the networks the user has permissions for."""
    relationship = await auth.authorize(request, auth.User(request.state.identity))
    if relationship < auth.Relationship.DEFAULT:
        # We don't check for < OWNER because a user is always it's own owner
        raise errors.UnauthorizedError
    query, arguments = database.parametrize(
        identifier="read-networks",
        arguments={"user_identifier": request.state.identity},
    )
    elements = await request.state.dbpool.fetch(query, *arguments)
    return starlette.responses.JSONResponse(
        status_code=200, content=database.dictify(elements)
    )


@validation.validate(schema=validation.CreateSensorRequest)
async def create_sensor(request, values):
    relationship = await auth.authorize(
        request, auth.Network(values.path["network_identifier"])
    )
    if relationship < auth.Relationship.DEFAULT:
        logger.warning(
            f"{request.method} {request.url.path} -- Insufficient authorization"
        )
        raise errors.UnauthorizedError
    if relationship < auth.Relationship.OWNER:
        logger.warning(
            f"{request.method} {request.url.path} -- Insufficient permissions"
        )
        raise errors.ForbiddenError
    query, arguments = database.parametrize(
        identifier="create-sensor",
        arguments={
            "network_identifier": values.path["network_identifier"],
            "sensor_name": values.body["sensor_name"],
        },
    )
    try:
        elements = await request.state.dbpool.fetch(query, *arguments)
    except asyncpg.ForeignKeyViolationError:
        # This can happen if the network is deleted after the permissions check
        logger.warning(f"{request.method} {request.url.path} -- Network not found")
        raise errors.NotFoundError
    except asyncpg.exceptions.UniqueViolationError:
        logger.warning(f"{request.method} {request.url.path} -- Uniqueness violation")
        raise errors.ConflictError
    sensor_identifier = database.dictify(elements)[0]["sensor_identifier"]
    # Return successful response
    return starlette.responses.JSONResponse(
        status_code=201,
        content={"sensor_identifier": sensor_identifier},
    )


@validation.validate(schema=validation.ReadSensorsRequest)
async def read_sensors(request, values):
    relationship = await auth.authorize(
        request, auth.Network(values.path["network_identifier"])
    )
    if relationship < auth.Relationship.DEFAULT:
        raise errors.UnauthorizedError
    if relationship < auth.Relationship.OWNER:
        raise errors.ForbiddenError
    query, arguments = database.parametrize(
        identifier="read-sensors",
        arguments={"network_identifier": values.path["network_identifier"]},
    )
    elements = await request.state.dbpool.fetch(query, *arguments)
    return starlette.responses.JSONResponse(
        status_code=200, content=database.dictify(elements)
    )


@validation.validate(schema=validation.UpdateSensorRequest)
async def update_sensor(request, values):
    relationship = await auth.authorize(
        request,
        auth.Sensor(
            {
                "network_identifier": values.path["network_identifier"],
                "sensor_identifier": values.path["sensor_identifier"],
            }
        ),
    )
    if relationship < auth.Relationship.DEFAULT:
        logger.warning(
            f"{request.method} {request.url.path} -- Insufficient authorization"
        )
        raise errors.UnauthorizedError
    if relationship < auth.Relationship.OWNER:
        logger.warning(
            f"{request.method} {request.url.path} -- Insufficient permissions"
        )
        raise errors.ForbiddenError
    query, arguments = database.parametrize(
        identifier="update-sensor",
        arguments={
            "sensor_identifier": values.path["sensor_identifier"],
            "sensor_name": values.body["sensor_name"],
        },
    )
    try:
        response = await request.state.dbpool.execute(query, *arguments)
    except asyncpg.exceptions.UniqueViolationError:
        logger.warning(f"{request.method} {request.url.path} -- Uniqueness violation")
        raise errors.ConflictError
    if response != "UPDATE 1":
        logger.warning(f"{request.method} {request.url.path} -- Sensor not found")
        raise errors.NotFoundError
    # Return successful response
    return starlette.responses.JSONResponse(status_code=200, content={})


@validation.validate(schema=validation.CreateConfigurationRequest)
async def create_configuration(request, values):
    relationship = await auth.authorize(
        request,
        auth.Sensor(
            {
                "network_identifier": values.path["network_identifier"],
                "sensor_identifier": values.path["sensor_identifier"],
            }
        ),
    )
    if relationship < auth.Relationship.DEFAULT:
        raise errors.UnauthorizedError
    if relationship < auth.Relationship.OWNER:
        raise errors.ForbiddenError
    query, arguments = database.parametrize(
        identifier="create-configuration",
        arguments={
            "sensor_identifier": values.path["sensor_identifier"],
            "configuration": values.body,
        },
    )
    try:
        elements = await request.state.dbpool.fetch(query, *arguments)
    except asyncpg.ForeignKeyViolationError:
        logger.warning(f"{request.method} {request.url.path} -- Sensor not found")
        raise errors.NotFoundError
    revision = database.dictify(elements)[0]["revision"]
    # Send MQTT message with configuration
    await mqtt.publish_configuration(
        sensor_identifier=values.path["sensor_identifier"],
        revision=revision,
        configuration=values.body,
        mqttc=request.state.mqttc,
        dbpool=request.state.dbpool,
    )
    # Return successful response
    return starlette.responses.JSONResponse(
        status_code=201,
        content={"revision": revision},
    )


@validation.validate(schema=validation.ReadConfigurationsRequest)
async def read_configurations(request, values):
    relationship = await auth.authorize(
        request,
        auth.Sensor(
            {
                "network_identifier": values.path["network_identifier"],
                "sensor_identifier": values.path["sensor_identifier"],
            }
        ),
    )
    if relationship < auth.Relationship.DEFAULT:
        raise errors.UnauthorizedError
    if relationship < auth.Relationship.OWNER:
        raise errors.ForbiddenError
    query, arguments = database.parametrize(
        identifier="read-configurations",
        arguments={
            "sensor_identifier": values.path["sensor_identifier"],
            "revision": values.query["revision"],
            "direction": values.query["direction"],
        },
    )
    elements = await request.state.dbpool.fetch(query, *arguments)
    # Return successful response
    return starlette.responses.JSONResponse(
        status_code=200,
        content=database.dictify(
            elements if values.query["direction"] == "next" else reversed(elements)
        ),
    )


@validation.validate(schema=validation.ReadMeasurementsRequest)
async def read_measurements(request, values):
    relationship = await auth.authorize(
        request,
        auth.Sensor(
            {
                "network_identifier": values.path["network_identifier"],
                "sensor_identifier": values.path["sensor_identifier"],
            }
        ),
    )
    if relationship < auth.Relationship.DEFAULT:
        raise errors.UnauthorizedError
    if relationship < auth.Relationship.OWNER:
        raise errors.ForbiddenError
    # Aggregate measurements
    if values.query["aggregate"]:
        query, arguments = database.parametrize(
            identifier="aggregate-measurements",
            arguments={"sensor_identifier": values.path["sensor_identifier"]},
        )
        elements = await request.state.dbpool.fetch(query, *arguments)
        # Return successful response
        return starlette.responses.JSONResponse(
            status_code=200,
            content={
                element["attribute"]: element["values"]
                for element in database.dictify(elements)
            },
        )
    # Page through measurements
    query, arguments = database.parametrize(
        identifier="read-measurements",
        arguments={
            "sensor_identifier": values.path["sensor_identifier"],
            "creation_timestamp": values.query["creation_timestamp"],
            "direction": values.query["direction"],
        },
    )
    elements = await request.state.dbpool.fetch(query, *arguments)
    # Return successful response
    return starlette.responses.JSONResponse(
        status_code=200,
        content=database.dictify(
            elements if values.query["direction"] == "next" else reversed(elements)
        ),
    )


@validation.validate(schema=validation.ReadLogsRequest)
async def read_logs(request, values):
    relationship = await auth.authorize(
        request,
        auth.Sensor(
            {
                "network_identifier": values.path["network_identifier"],
                "sensor_identifier": values.path["sensor_identifier"],
            }
        ),
    )
    if relationship < auth.Relationship.DEFAULT:
        raise errors.UnauthorizedError
    if relationship < auth.Relationship.OWNER:
        raise errors.ForbiddenError
    query, arguments = database.parametrize(
        identifier="read-logs",
        arguments={
            "sensor_identifier": values.path["sensor_identifier"],
            "creation_timestamp": values.query["creation_timestamp"],
            "direction": values.query["direction"],
        },
    )
    elements = await request.state.dbpool.fetch(query, *arguments)
    # Return successful response
    return starlette.responses.JSONResponse(
        status_code=200,
        content=database.dictify(
            elements if values.query["direction"] == "next" else reversed(elements)
        ),
    )


@validation.validate(schema=validation.ReadLogsAggregatesRequest)
async def read_logs_aggregates(request, values):
    relationship = await auth.authorize(
        request,
        auth.Sensor(
            {
                "network_identifier": values.path["network_identifier"],
                "sensor_identifier": values.path["sensor_identifier"],
            }
        ),
    )
    if relationship < auth.Relationship.DEFAULT:
        raise errors.UnauthorizedError
    if relationship < auth.Relationship.OWNER:
        raise errors.ForbiddenError
    query, arguments = database.parametrize(
        identifier="aggregate-logs",
        arguments={"sensor_identifier": values.path["sensor_identifier"]},
    )
    elements = await request.state.dbpool.fetch(query, *arguments)
    # Return successful response
    return starlette.responses.JSONResponse(
        status_code=200,
        content=database.dictify(elements),
    )


ROUTES = [
    # fmt: off
    starlette.routing.Route(
        path="/status",
        endpoint=read_status,
        methods=["GET"],
    ),
    starlette.routing.Route(
        path="/users",
        endpoint=create_user,
        methods=["POST"],
    ),
    starlette.routing.Route(
        path="/authentication",
        endpoint=create_session,
        methods=["POST"],
    ),
    starlette.routing.Route(
        path="/networks",
        endpoint=create_network,
        methods=["POST"],
    ),
    starlette.routing.Route(
        path="/networks",
        endpoint=read_networks,
        methods=["GET"],
    ),
    starlette.routing.Route(
        path="/networks/{network_identifier}/sensors",
        endpoint=create_sensor,
        methods=["POST"],
    ),
    starlette.routing.Route(
        path="/networks/{network_identifier}/sensors",
        endpoint=read_sensors,
        methods=["GET"],
    ),
    starlette.routing.Route(
        path="/networks/{network_identifier}/sensors/{sensor_identifier}",
        endpoint=update_sensor,
        methods=["PUT"],
    ),
    starlette.routing.Route(
        path="/networks/{network_identifier}/sensors/{sensor_identifier}/configurations",
        endpoint=create_configuration,
        methods=["POST"],
    ),
    starlette.routing.Route(
        path="/networks/{network_identifier}/sensors/{sensor_identifier}/configurations",
        endpoint=read_configurations,
        methods=["GET"],
    ),
    starlette.routing.Route(
        path="/networks/{network_identifier}/sensors/{sensor_identifier}/measurements",
        endpoint=read_measurements,
        methods=["GET"],
    ),
    starlette.routing.Route(
        path="/networks/{network_identifier}/sensors/{sensor_identifier}/logs",
        endpoint=read_logs,
        methods=["GET"],
    ),
    starlette.routing.Route(
        path="/networks/{network_identifier}/sensors/{sensor_identifier}/logs/aggregates",
        endpoint=read_logs_aggregates,
        methods=["GET"],
    ),
    # fmt: on
]


@contextlib.asynccontextmanager
async def lifespan(app):
    """Manage the lifetime of the database client and the MQTT client."""
    async with database.pool() as dbpool, mqtt.client() as mqttc:
        # Start MQTT listener in (unawaited) asyncio task
        loop = asyncio.get_event_loop()
        task = loop.create_task(mqtt.listen(mqttc, dbpool))
        # Yield clients to application state
        yield {"dbpool": dbpool, "mqttc": mqttc}
        # Wait for the MQTT listener task to be cancelled when the app exits
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


logger = logging.getLogger(__name__)
logs.configure()

app = starlette.applications.Starlette(
    routes=ROUTES,
    lifespan=lifespan,
    middleware=[
        starlette.middleware.Middleware(
            starlette.middleware.cors.CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["*"],
            allow_headers=["*"],
        ),
        starlette.middleware.Middleware(auth.AuthenticationMiddleware),
    ],
    exception_handlers={
        starlette.exceptions.HTTPException: errors.handler,
        500: errors.panic,
    },
)
