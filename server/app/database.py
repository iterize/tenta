import contextlib
import json
import os
import string

import asyncpg
import pendulum

import app.settings as settings


def prepare():
    """Load SQL queries from `queries.sql` file."""
    with open(os.path.join(os.path.dirname(__file__), "queries.sql"), "r") as file:
        statements = file.read().split("\n\n\n")
        # Validate format
        assert all(statement.startswith("-- name: ") for statement in statements)
        assert not any("\n-- name: " in statement for statement in statements)
        return {
            statement.split("\n", 1)[0][9:]: statement.split("\n", 1)[1]
            for statement in statements
        }


queries = prepare()


def parametrize(identifier, arguments):
    """Return the query and translate named arguments into valid PostgreSQL."""
    template = string.Template(queries[identifier])
    single = isinstance(arguments, dict)
    # Get a list of the query argument names from the template
    keys = template.get_identifiers()
    # Raise an error if unknown arguments are passed
    if diff := set(arguments.keys() if single else arguments[0].keys()) - set(keys):
        raise ValueError(f"Unknown query arguments: {diff}")
    # Replace named arguments with native numbered arguments
    query = template.substitute({key: f"${i+1}" for i, key in enumerate(keys)})
    # Build argument tuple and fill missing arguments with None
    arguments = (
        tuple(arguments.get(key) for key in keys)
        if single
        else [tuple(x.get(key) for key in keys) for x in arguments]
    )
    return query, arguments


def dictify(elements):
    """Cast a asyncpg SELECT query result into a list of dictionaries."""
    # TODO: implement this as a custom asyncpg record_class on pool?
    # see https://magicstack.github.io/asyncpg/current/api/index.html#connection-pools
    return [dict(record) for record in elements]


async def initialize(connection):
    # Automatically encode/decode TIMESTAMPTZ fields to/from unix timestamps
    await connection.set_type_codec(
        typename="timestamptz",
        schema="pg_catalog",
        encoder=lambda x: pendulum.from_timestamp(x).isoformat(),
        decoder=lambda x: pendulum.parse(x).float_timestamp,
    )
    # Automatically encode/decode JSONB fields to/from str
    await connection.set_type_codec(
        typename="jsonb",
        schema="pg_catalog",
        encoder=json.dumps,
        decoder=json.loads,
    )
    # Automatically encode/decode UUID fields to/from str
    await connection.set_type_codec(
        typename="uuid",
        schema="pg_catalog",
        encoder=str,
        decoder=str,
    )


@contextlib.asynccontextmanager
async def pool():
    """Context manager for asyncpg database pool with custom settings."""
    async with asyncpg.create_pool(
        host=settings.POSTGRESQL_HOSTNAME,
        port=settings.POSTGRESQL_PORT,
        user=settings.POSTGRESQL_IDENTIFIER,
        password=settings.POSTGRESQL_PASSWORD,
        database=settings.POSTGRESQL_DATABASE,
        min_size=2,
        max_size=4,
        max_queries=16384,
        max_inactive_connection_lifetime=300,
        init=initialize,
    ) as x:
        yield x
