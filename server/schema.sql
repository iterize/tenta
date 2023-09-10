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
    PRIMARY KEY (user_identifier, network_identifier)
);


CREATE TABLE session (
    access_token_hash TEXT PRIMARY KEY,
    user_identifier UUID NOT NULL REFERENCES "user" (identifier) ON DELETE CASCADE,
    creation_timestamp TIMESTAMPTZ NOT NULL
);


-- Contains only values that are actually sent to the sensor, not metadata
CREATE TABLE configuration (
    sensor_identifier UUID NOT NULL REFERENCES sensor (identifier) ON DELETE CASCADE,
    value JSONB NOT NULL,
    revision INT NOT NULL,
    creation_timestamp TIMESTAMPTZ NOT NULL,
    publication_timestamp TIMESTAMPTZ,
    acknowledgment_timestamp TIMESTAMPTZ,
    receipt_timestamp TIMESTAMPTZ,
    success BOOLEAN
);

-- Defining the primary key manually with the sort order makes the query for the latest
-- revision faster
CREATE UNIQUE INDEX ON configuration (sensor_identifier ASC, revision DESC);


-- Measurements don't have a unique primary key. Enforcing that the combination of
-- (sensor_identifier, creation_timestamp, attribute) is unique filters out duplicates
-- but having these duplicates usually means that something is wrong on the sensor.
-- In this case, the server should store everything it receives and duplicates should be
-- filtered out during processing with manual oversight. The keyset pagination over the
-- measurements chooses arbitrarily between duplicates.
CREATE TABLE measurement (
    sensor_identifier UUID NOT NULL REFERENCES sensor (identifier) ON DELETE CASCADE,
    attribute TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    revision INT,
    creation_timestamp TIMESTAMPTZ NOT NULL,
    receipt_timestamp TIMESTAMPTZ NOT NULL
);

SELECT create_hypertable(
    relation => 'measurement',
    time_column_name => 'creation_timestamp');


CREATE MATERIALIZED VIEW measurement_aggregation_1_hour
WITH (timescaledb.continuous, timescaledb.materialized_only = true, timescaledb.create_group_indexes = false) AS
    SELECT
        sensor_identifier,
        attribute,
        avg(value)::DOUBLE PRECISION AS average,
        time_bucket('1 hour', creation_timestamp) AS bucket_timestamp
    FROM measurement
    GROUP BY sensor_identifier, attribute, bucket_timestamp
WITH DATA;


CREATE INDEX ON measurement_aggregation_1_hour (sensor_identifier ASC, bucket_timestamp ASC, attribute ASC);

SELECT add_continuous_aggregate_policy(
    continuous_aggregate => 'measurement_aggregation_1_hour',
    start_offset => '10 days',
    end_offset => '1 hour',
    schedule_interval => '1 hour');


-- Logs don't have a unique primary key. Enforcing uniqueness over the combination
-- of (sensor_identifier, creation_timestamp) could filter out duplicates, but also
-- incorrectly reject valid logs with the same timestamp. The keyset pagination's cursor
-- is thus not unique. This means that elements can potentially be skipped when they
-- are at the edges of a page. We accept this trade-off in favor of performance.
-- If this ever becomes a problem, we can generate a column that reliably makes the
-- combination unique and use that for the keyset pagination.
CREATE TABLE log (
    sensor_identifier UUID NOT NULL REFERENCES sensor (identifier) ON DELETE CASCADE,
    message TEXT NOT NULL,
    severity TEXT NOT NULL,
    revision INT,
    creation_timestamp TIMESTAMPTZ NOT NULL,
    receipt_timestamp TIMESTAMPTZ NOT NULL
);

SELECT create_hypertable(
    relation => 'log',
    time_column_name => 'creation_timestamp');

SELECT add_retention_policy(
    relation => 'log',
    drop_after => INTERVAL '8 weeks');
