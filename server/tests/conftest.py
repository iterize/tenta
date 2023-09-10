import contextlib
import json
import os

import asyncpg
import pytest

import app.database as database
import app.utils as utils


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


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
    """Return the unix timestamp from 24 hours ago rounded down to the nearest hour."""
    return utils.timestamp() // 3600 * 3600 - (24 * 60 * 60)


@pytest.fixture(scope="session")
def offset():
    """Provide the offset added to test timestamps in seconds."""
    return _offset()


async def _populate(connection, offset):
    """Populate the database with example data."""
    with open("tests/data.json") as file:
        for table_name, records in json.load(file).items():
            identifiers = ", ".join([f"${i+1}" for i in range(len(records[0]))])
            # Adapt the timestamps to now minus 24 hours
            for record in records:
                for key, value in record.items():
                    if key.endswith("_timestamp"):
                        record[key] = None if value is None else value + offset
            # Write to the database
            await connection.executemany(
                f'INSERT INTO "{table_name}" VALUES ({identifiers});',
                [tuple(record.values()) for record in records],
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
