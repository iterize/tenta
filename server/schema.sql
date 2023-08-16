CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb";


CREATE TABLE "user" (
    identifier UUID PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    creation_timestamp TIMESTAMPTZ NOT NULL,
    password_hash TEXT NOT NULL
);


CREATE TABLE network (
    identifier UUID PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    creation_timestamp TIMESTAMPTZ NOT NULL
);


CREATE TABLE sensor (
    identifier UUID PRIMARY KEY,
    name TEXT NOT NULL,
    network_identifier UUID NOT NULL REFERENCES network (identifier) ON DELETE CASCADE,
    creation_timestamp TIMESTAMPTZ NOT NULL,

    -- Add more parameters here? e.g. description (that do not get relayed to the sensor)

    UNIQUE (network_identifier, name)
);


CREATE TABLE permission (
    user_identifier UUID NOT NULL REFERENCES "user" (identifier) ON DELETE CASCADE,
    network_identifier UUID NOT NULL REFERENCES network (identifier) ON DELETE CASCADE,
    creation_timestamp TIMESTAMPTZ NOT NULL,
    -- Add permission levels here (e.g. owner, user, read-only)

    PRIMARY KEY (user_identifier, network_identifier)
);


CREATE TABLE session (
    access_token_hash TEXT PRIMARY KEY,
    user_identifier UUID NOT NULL REFERENCES "user" (identifier) ON DELETE CASCADE,
    creation_timestamp TIMESTAMPTZ NOT NULL
);


-- Should only contain things that are actually sent to the sensor, not metadata
CREATE TABLE configuration (
    sensor_identifier UUID NOT NULL REFERENCES sensor (identifier) ON DELETE CASCADE,
    value JSONB NOT NULL,
    revision INT NOT NULL,
    creation_timestamp TIMESTAMPTZ NOT NULL,
    publication_timestamp TIMESTAMPTZ,
    acknowledgement_timestamp TIMESTAMPTZ,
    receipt_timestamp TIMESTAMPTZ,
    success BOOLEAN

    -- Add new tag table for metadata? with start, end, and string value
    -- Timestamps should be nullable here, to represent open intervals
);

-- Defining the primary key manually with the sort order makes the query for the latest
-- revision faster
CREATE UNIQUE INDEX ON configuration (sensor_identifier ASC, revision DESC);


-- Measurements don't have a unique primary key. Enforcing that the combination of
-- sensor_identifier and creation_timestamp is unique could filter out duplicates
-- but could also incorrectly discard measurements that are actually different.
-- Instead, the server should store everything it receives and duplicates should be
-- filtered out during processing. Due to the missing primary key, the keyset pagination
-- can result in duplicates. We accept this trade-off in favor of performance.
-- If this ever becomes a problem, we can generate a column that reliably makes the
-- combination unique and use that for the keyset pagination. This way, we can
-- continue to do without an index. The same ideas apply to the logs table.
CREATE TABLE measurement (
    sensor_identifier UUID NOT NULL REFERENCES sensor (identifier) ON DELETE CASCADE,
    attribute TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    revision INT,
    creation_timestamp TIMESTAMPTZ NOT NULL,
    receipt_timestamp TIMESTAMPTZ NOT NULL

    -- Add lat/long parameters here? -> could then be visualized in the dashboard (in a map)
);

SELECT create_hypertable('measurement', 'creation_timestamp');


CREATE MATERIALIZED VIEW measurement_aggregation_4_hours
WITH (timescaledb.continuous, timescaledb.materialized_only = true) AS
    SELECT
        sensor_identifier,
        time_bucket('4 hours', creation_timestamp) AS bucket_timestamp,
        COUNT(*) AS measurement_count
    FROM measurement
    GROUP BY sensor_identifier, bucket_timestamp
WITH DATA;


SELECT add_continuous_aggregate_policy(
    continuous_aggregate => 'measurement_aggregation_4_hours',
    start_offset => '10 days',
    end_offset => '4 hours',
    schedule_interval => '2 hours'
);


CREATE TABLE log (
    sensor_identifier UUID NOT NULL REFERENCES sensor (identifier) ON DELETE CASCADE,
    severity TEXT NOT NULL,
    subject TEXT NOT NULL,
    revision INT,
    creation_timestamp TIMESTAMPTZ NOT NULL,
    receipt_timestamp TIMESTAMPTZ NOT NULL,
    details TEXT
);

SELECT create_hypertable('log', 'creation_timestamp');

SELECT add_retention_policy(
    relation => 'log',
    drop_after => INTERVAL '8 weeks'
);
