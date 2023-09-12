import asgi_lifespan
import httpx
import pytest

import app.errors as errors
import app.main as main


@pytest.fixture(scope="session")
async def client():
    """Provide a HTTPX AsyncClient without spinning up the server."""
    async with asgi_lifespan.LifespanManager(main.app) as manager:
        async with httpx.AsyncClient(app=manager.app, base_url="http://test") as client:
            yield client


def keys(body, keys):
    """Check that a httpx response body has a specific set of keys."""
    if isinstance(body, dict):
        return set(body.keys()) == set(keys)
    # If the response is an array, check that each element satisfies the condition
    return all([set(element.keys()) == set(keys) for element in body])


def order(body, key):
    """Check that a httpx response body array is sorted by the given key."""
    return body == sorted(body, key=key)


def returns(response, check):
    """Check that a httpx request returns with a specific status code or error."""
    if isinstance(check, int):
        return response.status_code == check
    return (
        response.status_code == check.STATUS_CODE
        and keys(response.json(), {"details"})
        and response.json()["details"] == check.DETAILS
    )


########################################################################################
# Test data
########################################################################################


@pytest.fixture(scope="session")
def token():
    return "0000000000000000000000000000000000000000000000000000000000000000"


@pytest.fixture(scope="session")
def access_token():
    return "c59805ae394cceea937163877ca31375183650586137170a69652b6d8543e869"


########################################################################################
# Route: GET /status
########################################################################################


async def test_read_status(client):
    """Test reading the server status."""
    response = await client.get("/status")
    assert returns(response, 200)
    body = response.json()
    assert keys(
        body,
        {
            "environment",
            "start_timestamp",
            "commit_sha",
            "branch_name",
            "mqtt_hostname",
            "mqtt_port",
        },
    )


########################################################################################
# Route: POST /users
########################################################################################


async def test_create_user(reset, client):
    """Test creating a user."""
    response = await client.post(
        url="/users", json={"user_name": "example", "password": "12345678"}
    )
    assert returns(response, 201)
    body = response.json()
    assert keys(body, {"user_identifier", "access_token"})


async def test_create_user_with_existent_user_name(reset, client):
    """Test creating a user that already exists."""
    response = await client.post(
        url="/users", json={"user_name": "happy-un1c0rn", "password": "12345678"}
    )
    assert returns(response, errors.ConflictError)


########################################################################################
# Route: POST /authentication
########################################################################################


async def test_create_session(reset, client, user_identifier):
    """Test authenticating an existing user with a valid password."""
    response = await client.post(
        url="/authentication",
        json={"user_name": "happy-un1c0rn", "password": "12345678"},
    )
    assert returns(response, 201)
    body = response.json()
    assert keys(body, {"user_identifier", "access_token"})
    assert body["user_identifier"] == user_identifier


async def test_create_session_with_invalid_password(reset, client):
    """Test authenticating an existing user with an invalid password."""
    response = await client.post(
        url="/authentication",
        json={"user_name": "happy-un1c0rn", "password": "00000000"},
    )
    assert returns(response, errors.UnauthorizedError)


async def test_create_session_with_nonexistent_user(reset, client):
    """Test authenticating a user that doesn't exist."""
    response = await client.post(
        url="/authentication",
        json={"user_name": "example", "password": "12345678"},
    )
    assert returns(response, errors.NotFoundError)


########################################################################################
# Route: POST /networks
########################################################################################


async def test_create_network(reset, client, access_token):
    """Test creating a network."""
    response = await client.post(
        url="/networks",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"network_name": "something"},
    )
    assert returns(response, 201)
    body = response.json()
    assert keys(body, {"network_identifier"})


async def test_create_network_with_existent_network_name(reset, client, access_token):
    """Test creating a network with a name that's already taken."""
    response = await client.post(
        url="/networks",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"network_name": "example"},
    )
    assert returns(response, errors.ConflictError)


async def test_create_network_with_invalid_request(reset, client, access_token):
    """Test creating a network with invalid request values."""
    response = await client.post(
        url="/networks",
        headers={"Authorization": f"Bearer {access_token}"},
        json={},
    )
    assert returns(response, errors.BadRequestError)


async def test_create_network_with_invalid_authentication(reset, client, token):
    """Test creating a network with an invalid access token."""
    response = await client.post(
        url="/networks",
        headers={"Authorization": f"Bearer {token}"},
        json={"network_name": "something"},
    )
    assert returns(response, errors.UnauthorizedError)


async def test_create_network_with_invalid_header(reset, client):
    """Test creating a network with a malformed header."""
    response = await client.post(
        url="/networks",
        headers={"Authorization": "Bearer"},
        json={"network_name": "something"},
    )
    assert returns(response, errors.UnauthorizedError)


async def test_create_network_with_invalid_scheme(reset, client, access_token):
    """Test creating a network with a wrong authentication scheme."""
    response = await client.post(
        url="/networks",
        headers={"Authorization": f"Basic {access_token}"},
        json={"network_name": "something"},
    )
    assert returns(response, errors.UnauthorizedError)


########################################################################################
# Route: GET /networks
########################################################################################


async def test_read_networks(reset, client, access_token):
    """Test reading the networks the user has permissions for."""
    response = await client.get(
        url="/networks", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert returns(response, 200)
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 2
    assert keys(body, {"network_identifier", "network_name"})


async def test_read_networks_with_invalid_authentication(reset, client, token):
    """Test reading the networks with an invalid access token."""
    response = await client.get(
        url="/networks", headers={"Authorization": f"Bearer {token}"}
    )
    assert returns(response, errors.UnauthorizedError)


########################################################################################
# Route: POST /networks/+/sensors
########################################################################################


async def test_create_sensor(reset, client, network_identifier, access_token):
    """Test creating a sensor."""
    response = await client.post(
        url=f"/networks/{network_identifier}/sensors",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"sensor_name": "charmander"},
    )
    assert returns(response, 201)
    body = response.json()
    assert keys(body, {"sensor_identifier"})


async def test_create_sensor_with_existent_sensor_name(
    reset, client, network_identifier, access_token
):
    """Test creating a sensor that already exists."""
    response = await client.post(
        url=f"/networks/{network_identifier}/sensors",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"sensor_name": "bulbasaur"},
    )
    assert returns(response, errors.ConflictError)


async def test_create_sensor_with_nonexistent_network(
    reset, client, identifier, access_token
):
    """Test creating a sensor in a network that does not exist."""
    response = await client.post(
        url=f"/networks/{identifier}/sensors",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"sensor_name": "charmander"},
    )
    assert returns(response, errors.NotFoundError)


async def test_create_sensor_with_invalid_authorization(
    reset, client, network_identifier, access_token
):
    """Test creating a sensor in a network with an insufficient relationship."""
    response = await client.post(
        url="/networks/2f9a5285-4ce1-4ddb-a268-0164c70f4826/sensors",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"sensor_name": "charmander"},
    )
    assert returns(response, errors.ForbiddenError)


########################################################################################
# Route: GET /networks/+/sensors
########################################################################################


async def test_read_sensors(reset, client, network_identifier, access_token):
    """Test reading the sensors that are part of a network."""
    response = await client.get(
        url=f"/networks/{network_identifier}/sensors",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert returns(response, 200)
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 2
    assert keys(body, {"sensor_identifier", "sensor_name"})


async def test_read_sensors_with_nonexistent_network(
    reset, client, identifier, access_token
):
    """Test reading the sensors of a network that does not exist."""
    response = await client.get(
        url=f"/networks/{identifier}/sensors",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert returns(response, errors.NotFoundError)


async def test_read_sensors_with_invalid_authentication(
    reset, client, network_identifier, token
):
    """Test reading the sensors with an invalid access token."""
    response = await client.get(
        url=f"/networks/{network_identifier}/sensors",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert returns(response, errors.UnauthorizedError)


async def test_read_sensors_with_invalid_authorization(
    reset, client, network_identifier, access_token
):
    """Test reading the sensors having unsufficient permissions."""
    response = await client.get(
        url="/networks/2f9a5285-4ce1-4ddb-a268-0164c70f4826/sensors",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert returns(response, errors.ForbiddenError)


########################################################################################
# Route: PUT /networks/+/sensors/+
########################################################################################


async def test_update_sensor(
    reset, client, network_identifier, sensor_identifier, access_token
):
    """Test updating a sensor's name and configuration."""
    response = await client.put(
        url=f"/networks/{network_identifier}/sensors/{sensor_identifier}",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"sensor_name": "charmander"},
    )
    assert returns(response, 200)
    body = response.json()
    assert keys(body, {})


async def test_update_sensor_with_nonexistent_sensor(
    reset, client, network_identifier, identifier, access_token
):
    """Test updating a sensor that does not exist."""
    response = await client.put(
        url=f"/networks/{network_identifier}/sensors/{identifier}",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"sensor_name": "charmander"},
    )
    assert returns(response, errors.NotFoundError)


async def test_update_sensor_with_existent_sensor_name(
    reset, client, network_identifier, sensor_identifier, access_token
):
    """Test updating a sensor to a name that is already taken in that network."""
    response = await client.put(
        url=f"/networks/{network_identifier}/sensors/{sensor_identifier}",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"sensor_name": "squirtle"},
    )
    assert returns(response, errors.ConflictError)


########################################################################################
# Route: POST /networks/+/sensors/+/configurations
########################################################################################


async def test_create_configuration(
    reset, client, network_identifier, sensor_identifier, access_token
):
    """Test creating a configuration."""
    response = await client.post(
        url=(
            f"/networks/{network_identifier}/sensors/{sensor_identifier}/configurations"
        ),
        headers={"Authorization": f"Bearer {access_token}"},
        json={"measurement_interval": 8.5, "cache": True, "strategy": "default"},
    )
    assert returns(response, 201)
    body = response.json()
    assert keys(body, {"revision"})


async def test_create_configuration_with_no_values(
    reset, client, network_identifier, sensor_identifier, access_token
):
    """Test creating a configuration that contains no values."""
    response = await client.post(
        url=(
            f"/networks/{network_identifier}/sensors/{sensor_identifier}/configurations"
        ),
        headers={"Authorization": f"Bearer {access_token}"},
        json={},
    )
    assert returns(response, 201)
    body = response.json()
    assert keys(body, {"revision"})


async def test_create_configuration_with_nonexistent_sensor(
    reset, client, network_identifier, identifier, access_token
):
    """Test creating a configuration for a sensor that does not exist."""
    response = await client.post(
        url=f"/networks/{network_identifier}/sensors/{identifier}/configurations",
        headers={"Authorization": f"Bearer {access_token}"},
        json={},
    )
    assert returns(response, errors.NotFoundError)


########################################################################################
# Route: GET /networks/+/sensors/+/configurations
########################################################################################


async def test_read_configurations(
    reset, client, network_identifier, sensor_identifier, access_token
):
    """Test reading the oldest configurations."""
    response = await client.get(
        url=(
            f"/networks/{network_identifier}/sensors/{sensor_identifier}/configurations"
        ),
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert returns(response, 200)
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 3
    assert keys(
        body,
        {
            "value",
            "revision",
            "creation_timestamp",
            "publication_timestamp",
            "acknowledgment_timestamp",
            "success",
        },
    )
    assert order(body, lambda x: x["revision"])


async def test_read_configurations_with_next_page(
    reset, client, network_identifier, sensor_identifier, access_token
):
    """Test reading configurations after a given revision."""
    response = await client.get(
        url=(
            f"/networks/{network_identifier}/sensors/{sensor_identifier}/configurations"
        ),
        headers={"Authorization": f"Bearer {access_token}"},
        params={"direction": "next", "revision": 0},
    )
    assert returns(response, 200)
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 2
    assert keys(
        body,
        {
            "value",
            "revision",
            "creation_timestamp",
            "publication_timestamp",
            "acknowledgment_timestamp",
            "success",
        },
    )
    assert order(body, lambda x: x["revision"])


########################################################################################
# Route: GET /networks/+/sensors/+/measurements
########################################################################################


async def test_read_measurements(
    reset, client, network_identifier, sensor_identifier, access_token
):
    """Test reading the oldest measurements."""
    response = await client.get(
        url=f"/networks/{network_identifier}/sensors/{sensor_identifier}/measurements",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert returns(response, 200)
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 4
    assert keys(body, {"value", "revision", "creation_timestamp"})
    assert order(body, lambda x: x["creation_timestamp"])


async def test_read_measurements_with_next_page(
    reset, client, network_identifier, sensor_identifier, access_token, offset
):
    """Test reading measurements after a given timestamp."""
    response = await client.get(
        url=f"/networks/{network_identifier}/sensors/{sensor_identifier}/measurements",
        headers={"Authorization": f"Bearer {access_token}"},
        params={"direction": "next", "creation_timestamp": offset - 7200},
    )
    assert returns(response, 200)
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 3
    assert keys(body, {"value", "revision", "creation_timestamp"})
    assert order(body, lambda x: x["creation_timestamp"])


async def test_read_measurements_with_previous_page(
    reset, client, network_identifier, sensor_identifier, access_token, offset
):
    """Test reading measurements before a given timestamp."""
    response = await client.get(
        url=f"/networks/{network_identifier}/sensors/{sensor_identifier}/measurements",
        headers={"Authorization": f"Bearer {access_token}"},
        params={"direction": "previous", "creation_timestamp": offset - 3600},
    )
    assert returns(response, 200)
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 3
    assert keys(body, {"value", "revision", "creation_timestamp"})
    assert order(body, lambda x: x["creation_timestamp"])


async def test_read_measurements_with_aggregation(
    reset, client, network_identifier, sensor_identifier, access_token, offset
):
    """Test reading measurements with aggregate query parameter."""
    response = await client.get(
        url=f"/networks/{network_identifier}/sensors/{sensor_identifier}/measurements",
        headers={"Authorization": f"Bearer {access_token}"},
        params={"aggregate": True},
    )
    assert returns(response, 200)
    body = response.json()
    assert keys(body, {"temperature", "humidity"})
    assert body["temperature"] == [
        {"bucket_timestamp": offset - 7200, "average": 8000.0},
        {"bucket_timestamp": offset - 3600, "average": 6000.0},
    ]
    assert body["humidity"] == [{"bucket_timestamp": offset - 7200, "average": -0.2}]


########################################################################################
# Route: GET /networks/+/sensors/+/logs
########################################################################################


async def test_read_logs(
    reset, client, network_identifier, sensor_identifier, access_token
):
    """Test reading the oldest logs."""
    response = await client.get(
        url=f"/networks/{network_identifier}/sensors/{sensor_identifier}/logs",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert returns(response, 200)
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 5
    assert keys(body, {"message", "severity", "revision", "creation_timestamp"})
    assert order(body, lambda x: x["creation_timestamp"])


async def test_read_logs_with_next_page(
    reset, client, network_identifier, sensor_identifier, access_token, offset
):
    """Test reading logs after a given timestamp."""
    response = await client.get(
        url=f"/networks/{network_identifier}/sensors/{sensor_identifier}/logs",
        headers={"Authorization": f"Bearer {access_token}"},
        params={"direction": "next", "creation_timestamp": offset - 3600},
    )
    assert returns(response, 200)
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 2
    assert keys(body, {"message", "severity", "revision", "creation_timestamp"})
    assert order(body, lambda x: x["creation_timestamp"])


async def test_read_logs_with_previous_page(
    reset, client, network_identifier, sensor_identifier, access_token, offset
):
    """Test reading logs before a given timestamp."""
    response = await client.get(
        url=f"/networks/{network_identifier}/sensors/{sensor_identifier}/logs",
        headers={"Authorization": f"Bearer {access_token}"},
        params={"direction": "previous", "creation_timestamp": offset - 1800},
    )
    assert returns(response, 200)
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 3
    assert keys(body, {"message", "severity", "revision", "creation_timestamp"})
    assert order(body, lambda x: x["creation_timestamp"])


########################################################################################
# Route: GET /networks/+/sensors/+/logs/aggregates
########################################################################################


async def test_read_log_aggregates(
    reset, client, network_identifier, sensor_identifier, access_token
):
    """Test reading the log aggregation."""
    response = await client.get(
        url=f"/networks/{network_identifier}/sensors/{sensor_identifier}/logs/aggregates",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert returns(response, 200)
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 2
    assert keys(
        body,
        {
            "message",
            "severity",
            "min_revision",
            "max_revision",
            "min_creation_timestamp",
            "max_creation_timestamp",
            "count",
        },
    )
    assert order(body, lambda x: x["max_creation_timestamp"])
