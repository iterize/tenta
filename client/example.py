import tenta

# Create the client instance and connect to the MQTT broker

tenta_client = tenta.TentaClient(
    mqtt_host="localhost",
    mqtt_port=1883,
    mqtt_identifier="server",
    mqtt_password="password",
    sensor_identifier="81bf7042-e20f-4a97-ac44-c15853e3618f",
    revision=1,
)

# Publish logs asynchronously
# -> your code continues to run while the message is being published

tenta_client.publish_log(
    severity="info",
    message="Hello, world!",
)
tenta_client.wait_for_publish()
print("Log 1 published!")

# Publish logs synchronously
# -> the code waits until the message has been published

tenta_client.publish_log(
    severity="warning",
    message="Hello, to you too!",
    wait_for_publish=True,
    wait_for_publish_timeout=5,
)
print("Log 2 published!")

# Publish measurements asynchronously
# -> your code continues to run while the message is being published

tenta_client.publish_measurement(
    value={
        "temperature": 20.0,
        "humidity": 50.0,
        "pressure": 1013.25,
    },
)
tenta_client.wait_for_publish()
print("Measurement 1 published!")

# tear down MQTT connection

tenta_client.teardown()
