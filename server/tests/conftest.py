import asyncio
import contextlib
import json
import os

import asyncpg
import pytest

import app.database as database
import app.utils as utils


########################################################################################
# Configure pytest-asyncio
########################################################################################


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


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


########################################################################################
# Database setup
########################################################################################


@contextlib.asynccontextmanager
async def _connection():
    """Provide a connection to the database that's properly closed afterwards."""
    try:
        connection = await asyncpg.connect(
            host=os.environ["POSTGRESQL_URL"],
            port=os.environ["POSTGRESQL_PORT"],
            user=os.environ["POSTGRESQL_IDENTIFIER"],
            password=os.environ["POSTGRESQL_PASSWORD"],
            database=os.environ["POSTGRESQL_DATABASE"],
        )
        await database.initialize(connection)
        yield connection
    finally:
        await connection.close()


@pytest.fixture(scope="session")
async def connection():
    """Provide a database connection (persistent across tests)."""
    async with _connection() as connection:
        yield connection


def _offset():
    """Return the current unix timestamp rounded down to the nearest hour."""
    return utils.timestamp() // 3600 * 3600


@pytest.fixture(scope="session")
def offset():
    """Provide the offset added to test timestamps in seconds."""
    return _offset()


async def _populate(connection, offset):
    """Populate the database with example data."""
    with open("tests/data.json") as file:
        for table_name, elements in json.load(file).items():
            # Get the keys from the first record
            keys = tuple(elements[0].keys())
            # Generate the column names and identifiers for the query
            columns = ", ".join([f"{key}" for key in keys])
            identifiers = ", ".join([f"${i+1}" for i in range(len(keys))])
            # Adapt all timestamps with the offset
            for element in elements:
                for key, value in element.items():
                    if key.endswith("_timestamp"):
                        element[key] = None if value is None else value + offset
            # Write to the database
            await connection.executemany(
                f'INSERT INTO "{table_name}" ({columns}) VALUES ({identifiers});',
                [tuple(element[key] for key in keys) for element in elements],
            )
    # Refresh the materialized views
    await connection.execute("CALL refresh_continuous_aggregate('measurement_aggregation_1_hour', NULL, NULL);")  # fmt: skip


@pytest.fixture(scope="function")
async def reset(connection, offset):
    """Reset the database to contain the initial test data for each test."""
    async with connection.transaction():
        # Delete all the data in the database but keep the structure
        await connection.execute('DELETE FROM "user";')
        await connection.execute("DELETE FROM network;")
    # Populate with the initial test data again
    await _populate(connection, offset)
