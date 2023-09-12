#!/bin/bash

# Safety first
set -o errexit -o pipefail -o nounset
# Change into the project's directory
cd "$(dirname "$0")/.."

# Set our environment variables
MQTT_HOST="127.0.0.1"
MQTT_PORT="1883"
MQTT_IDENTIFIER="client"
MQTT_PASSWORD="password"

# Path to our Mosquitto configuation
MOSQUITTO_CONFIGURATION="$(pwd)/tests/mosquitto.conf"

# generate the password file
echo "Generating Mosquitto password file"
MOSQUITTO_PASSWORDS="$(pwd)/tests/mosquitto.pass"
touch "$MOSQUITTO_PASSWORDS"
chmod 700 "$MOSQUITTO_PASSWORDS"
mosquitto_passwd -b "$MOSQUITTO_PASSWORDS" "$MQTT_IDENTIFIER" "$MQTT_PASSWORD"

# Quit any ongoing Mosquitto instances
echo "Stopping any running Mosquitto instances"
docker stop mosquitto > /dev/null || true

# Start the Mosquitto MQTT broker via docker in the background
echo "Starting Mosquitto with Docker"
docker run -td --rm --name mosquitto -p "$MQTT_HOST:$MQTT_PORT:$MQTT_PORT" \
    --volume "${MOSQUITTO_CONFIGURATION}:/mosquitto/config/mosquitto.conf" \
    --volume "${MOSQUITTO_PASSWORDS}:/mosquitto/config/mosquitto.pass" \
    eclipse-mosquitto:latest > /dev/null

# Wait for Mosquitto to be ready
echo "Waiting for Mosquitto to be ready"
until docker exec mosquitto mosquitto_sub -u "$MQTT_IDENTIFIER" -P "$MQTT_PASSWORD" -E --topic "#"; do sleep 0.1; done
