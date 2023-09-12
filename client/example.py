import time
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
    # uses current time
)
tenta_client.publish_log(
    severity="info",
    message="Hello, world!",
    timestamp=time.time() - 3600,
)
tenta_client.wait_for_publish()
print("Logs 1-2 published!")

# Publish logs synchronously
# -> the code waits until the message has been published

tenta_client.publish_log(
    severity="warning",
    message="Hello, to you too!",
    wait_for_publish=True,
    wait_for_publish_timeout=5,
)
print("Log 3 published!")

# Publish measurements asynchronously

tenta_client.publish_measurement(
    value={
        "temperature": 20.0,
        "humidity": 50.0,
        "pressure": 1013.25,
    },
)
tenta_client.wait_for_publish()
print("Measurements published!")

# Publish acknowledgements asynchronously
# -> "did the sensor successfully process a new revision?" -> true/false

tenta_client.publish_acknowledgement(
    success=False,
    revision=20,
)
tenta_client.publish_acknowledgement(
    success=True,
    # uses the revision given to the client on initialization (line 11)
)
tenta_client.wait_for_publish()
print("Acknowledgements published!")

# tear down MQTT connection

tenta_client.teardown()
