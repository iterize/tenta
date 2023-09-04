import argparse
import asyncio

import tests.conftest


async def initialize(populate=False):
    """Initialize the database schema, optionally populate with example data."""
    async with tests.conftest._connection() as connection:
        with open("schema.sql") as file:
            for statement in file.read().split("\n\n\n"):
                await connection.execute(statement)
        if populate:
            await tests.conftest._populate(connection)
            await connection.execute("CALL refresh_continuous_aggregate('measurement_aggregation_1_hour', NULL, NULL);")  # fmt: skip


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--populate", action="store_true")
    args = parser.parse_args()
    asyncio.run(initialize(populate=args.populate))
