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


def keys(response, keys):
    """Check that a httpx request body contains a specific set of keys.

    If the request body is an array, check that each element contains the keys.
    """
    if isinstance(response.json(), dict):
        return set(response.json().keys()) == set(keys)
    return all([set(element.keys()) == set(keys) for element in response.json()])


def sorts(response, key):
    """Check that a https request body array is sorted by the given key."""
    return response.json() == sorted(response.json(), key=key)


def returns(response, check):
    """Check that a httpx request returns with a specific status code or error."""
    if isinstance(check, int):
        return response.status_code == check
    return (
        response.status_code == check.STATUS_CODE
        and keys(response, {"details"})
        and response.json()["details"] == check.DETAILS
    )


########################################################################################
# Test data
########################################################################################


@pytest.fixture(scope="session")
def identifier():
    return "00000000-0000-4000-8000-000000000000"


@pytest.fixture(scope="session")
def user_identifier():
    return "575a7328-4e2e-4b88-afcc-e0b5ed3920cc"


@pytest.fixture(scope="session")
def network_identifier():
    return "1f705cc5-4242-458b-9201-4217455ea23c"


@pytest.fixture(scope="session")
def sensor_identifier():
    return "81bf7042-e20f-4a97-ac44-c15853e3618f"


@pytest.fixture(scope="session")
def token():
    return "0000000000000000000000000000000000000000000000000000000000000000"


@pytest.fixture(scope="session")
def access_token():
    return "c59805ae394cceea937163877ca31375183650586137170a69652b6d8543e869"


########################################################################################
# Route: GET /status
########################################################################################


@pytest.mark.anyio
async def test_read_status(client):
    """Test reading the server status."""
    response = await client.get("/status")
    assert returns(response, 200)
    assert keys(
        response, {"environment", "commit_sha", "branch_name", "start_timestamp"}
    )


########################################################################################
# Route: POST /users
########################################################################################


@pytest.mark.anyio
async def test_create_user(setup, client):
    """Test creating a user."""
    response = await client.post(
        url="/users", json={"user_name": "example", "password": "12345678"}
    )
    assert returns(response, 201)
    assert keys(response, {"user_identifier", "access_token"})


@pytest.mark.anyio
async def test_create_user_with_existent_user_name(setup, client):
    """Test creating a user that already exists."""
    response = await client.post(
        url="/users", json={"user_name": "happy-un1c0rn", "password": "12345678"}
    )
    assert returns(response, errors.ConflictError)


########################################################################################
# Route: POST /authentication
########################################################################################


@pytest.mark.anyio
async def test_create_session(setup, client, user_identifier):
    """Test authenticating an existing user with a valid password."""
    response = await client.post(
        url="/authentication",
        json={"user_name": "happy-un1c0rn", "password": "12345678"},
    )
    assert returns(response, 201)
    assert keys(response, {"user_identifier", "access_token"})
    assert response.json()["user_identifier"] == user_identifier


@pytest.mark.anyio
async def test_create_session_with_invalid_password(setup, client):
    """Test authenticating an existing user with an invalid password."""
    response = await client.post(
        url="/authentication",
        json={"user_name": "happy-un1c0rn", "password": "00000000"},
    )
    assert returns(response, errors.UnauthorizedError)


@pytest.mark.anyio
async def test_create_session_with_nonexistent_user(setup, client):
    """Test authenticating a user that doesn't exist."""
    response = await client.post(
        url="/authentication",
        json={"user_name": "example", "password": "12345678"},
    )
    assert returns(response, errors.NotFoundError)


########################################################################################
# Route: GET /networks
########################################################################################


@pytest.mark.anyio
async def test_read_networks(setup, client, access_token):
    """Test reading the networks the user has permissions for."""
    response = await client.get(
        url="/networks", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert returns(response, 200)
    assert isinstance(response.json(), list)
    assert len(response.json()) == 2
    assert keys(response, {"network_identifier", "network_name"})


@pytest.mark.anyio
async def test_read_networks_with_invalid_authentication(setup, client, token):
    """Test reading the networks with an invalid access token."""
    response = await client.get(
        url="/networks", headers={"Authorization": f"Bearer {token}"}
    )
    assert returns(response, errors.UnauthorizedError)


########################################################################################
# Route: POST /networks/<network_identifier>/sensors
########################################################################################


@pytest.mark.anyio
async def test_create_sensor(setup, client, network_identifier, access_token):
    """Test creating a sensor."""
    response = await client.post(
        url=f"/networks/{network_identifier}/sensors",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"sensor_name": "pikachu"},
    )
    assert returns(response, 201)
    assert keys(response, {"sensor_identifier"})


@pytest.mark.anyio
async def test_create_sensor_with_existent_sensor_name(
    setup, client, network_identifier, access_token
):
    """Test creating a sensor that already exists."""
    response = await client.post(
        url=f"/networks/{network_identifier}/sensors",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"sensor_name": "bulbasaur"},
    )
    assert returns(response, errors.ConflictError)


@pytest.mark.anyio
async def test_create_sensor_with_nonexistent_network(
    setup, client, identifier, access_token
):
    """Test creating a sensor in a network that does not exist."""
    response = await client.post(
        url=f"/networks/{identifier}/sensors",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"sensor_name": "pikachu"},
    )
    assert returns(response, errors.NotFoundError)


########################################################################################
# Route: GET /networks/<network_identifier>/sensors
########################################################################################


@pytest.mark.anyio
async def test_read_sensors(setup, client, network_identifier, access_token):
    """Test reading the sensors that are part of a network."""
    response = await client.get(
        url=f"/networks/{network_identifier}/sensors",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert returns(response, 200)
    assert isinstance(response.json(), list)
    assert len(response.json()) == 3
    assert keys(response, {"sensor_identifier", "sensor_name"})


@pytest.mark.anyio
async def test_read_sensors_with_nonexistent_network(
    setup, client, identifier, access_token
):
    """Test reading the sensors of a network that does not exist."""
    response = await client.get(
        url=f"/networks/{identifier}/sensors",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert returns(response, errors.NotFoundError)


@pytest.mark.anyio
async def test_read_sensors_with_invalid_authentication(
    setup, client, network_identifier, token
):
    """Test reading the sensors with an invalid access token."""
    response = await client.get(
        url=f"/networks/{network_identifier}/sensors",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert returns(response, errors.UnauthorizedError)


@pytest.mark.anyio
async def test_read_sensors_with_invalid_authorization(
    setup, client, network_identifier, access_token
):
    """Test reading the sensors having unsufficient permissions."""
    response = await client.get(
        url="/networks/2f9a5285-4ce1-4ddb-a268-0164c70f4826/sensors",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert returns(response, errors.ForbiddenError)


########################################################################################
# Route: PUT /networks/<network_identifier>/sensors/<sensor_identifier>
########################################################################################


@pytest.mark.anyio
async def test_update_sensor(
    setup, client, network_identifier, sensor_identifier, access_token
):
    """Test updating a sensor's name and configuration."""
    response = await client.put(
        url=f"/networks/{network_identifier}/sensors/{sensor_identifier}",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"sensor_name": "pikachu"},
    )
    assert returns(response, 200)
    assert keys(response, {})


@pytest.mark.anyio
async def test_update_sensor_with_nonexistent_sensor(
    setup, client, network_identifier, identifier, access_token
):
    """Test updating a sensor that does not exist."""
    response = await client.put(
        url=f"/networks/{network_identifier}/sensors/{identifier}",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"sensor_name": "pikachu"},
    )
    assert returns(response, errors.NotFoundError)


@pytest.mark.anyio
async def test_update_sensor_with_existent_sensor_name(
    setup, client, network_identifier, sensor_identifier, access_token
):
    """Test updating a sensor to a name that is already taken in that network."""
    response = await client.put(
        url=f"/networks/{network_identifier}/sensors/{sensor_identifier}",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"sensor_name": "charmander"},
    )
    assert returns(response, errors.ConflictError)


########################################################################################
# Route: POST /networks/<network_identifier>/sensors/<sensor_identifier>/configurations
########################################################################################


@pytest.mark.anyio
async def test_create_configuration(
    setup, client, network_identifier, sensor_identifier, access_token
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
    assert keys(response, {"revision"})


@pytest.mark.anyio
async def test_create_configuration_with_no_values(
    setup, client, network_identifier, sensor_identifier, access_token
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
    assert keys(response, {"revision"})


@pytest.mark.anyio
async def test_create_configuration_with_nonexistent_sensor(
    setup, client, network_identifier, identifier, access_token
):
    """Test creating a configuration for a sensor that does not exist."""
    response = await client.post(
        url=f"/networks/{network_identifier}/sensors/{identifier}/configurations",
        headers={"Authorization": f"Bearer {access_token}"},
        json={},
    )
    assert returns(response, errors.NotFoundError)


########################################################################################
# Route: GET /networks/<network_identifier>/sensors/<sensor_identifier>/configurations
########################################################################################


@pytest.mark.anyio
async def test_read_configurations(
    setup, client, network_identifier, sensor_identifier
):
    """Test reading the oldest configurations."""
    response = await client.get(
        url=(
            f"/networks/{network_identifier}/sensors/{sensor_identifier}/configurations"
        ),
    )
    assert returns(response, 200)
    assert isinstance(response.json(), list)
    assert len(response.json()) == 3
    assert keys(
        response,
        {
            "value",
            "revision",
            "creation_timestamp",
            "publication_timestamp",
            "acknowledgment_timestamp",
            "receipt_timestamp",
            "success",
        },
    )
    assert sorts(response, lambda x: x["revision"])


@pytest.mark.anyio
async def test_read_configurations_with_next_page(
    setup, client, network_identifier, sensor_identifier
):
    """Test reading configurations after a given timestamp."""
    response = await client.get(
        url=(
            f"/networks/{network_identifier}/sensors/{sensor_identifier}/configurations"
        ),
        params={"direction": "next", "revision": 0},
    )
    assert returns(response, 200)
    assert isinstance(response.json(), list)
    assert len(response.json()) == 2
    assert keys(
        response,
        {
            "value",
            "revision",
            "creation_timestamp",
            "publication_timestamp",
            "acknowledgment_timestamp",
            "receipt_timestamp",
            "success",
        },
    )
    assert sorts(response, lambda x: x["revision"])


########################################################################################
# Route: GET /networks/<network_identifier>/sensors/<sensor_identifier>/measurements
########################################################################################


@pytest.mark.anyio
async def test_read_measurements(setup, client, network_identifier, sensor_identifier):
    """Test reading the oldest measurements."""
    response = await client.get(
        url=f"/networks/{network_identifier}/sensors/{sensor_identifier}/measurements",
    )
    assert returns(response, 200)
    assert isinstance(response.json(), list)
    assert len(response.json()) == 4
    assert keys(response, {"value", "revision", "creation_timestamp"})
    assert sorts(response, lambda x: x["creation_timestamp"])


@pytest.mark.anyio
async def test_read_measurements_with_next_page(
    setup, client, network_identifier, sensor_identifier
):
    """Test reading measurements after a given timestamp."""
    response = await client.get(
        url=f"/networks/{network_identifier}/sensors/{sensor_identifier}/measurements",
        params={"direction": "next", "creation_timestamp": 100},
    )
    assert returns(response, 200)
    assert isinstance(response.json(), list)
    assert len(response.json()) == 2
    assert keys(response, {"value", "revision", "creation_timestamp"})
    assert sorts(response, lambda x: x["creation_timestamp"])


@pytest.mark.anyio
async def test_read_measurements_with_previous_page(
    setup, client, network_identifier, sensor_identifier
):
    """Test reading measurements before a given timestamp."""
    response = await client.get(
        url=f"/networks/{network_identifier}/sensors/{sensor_identifier}/measurements",
        params={"direction": "previous", "creation_timestamp": 200},
    )
    assert returns(response, 200)
    assert isinstance(response.json(), list)
    assert len(response.json()) == 2
    assert keys(response, {"value", "revision", "creation_timestamp"})
    assert sorts(response, lambda x: x["creation_timestamp"])


# TODO check logs
# TODO check log aggregation
# TODO check create sensor when network exists but user does not have permission
# TODO check missing/wrong authentication
# TODO differences between 401 and 404
# TODO test validation of measurements with 1.5, 1.0, 0.0, True
