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

# Publish messages asynchronously
# -> your code continues to run while the message is being published

tenta_client.publish_log_message(
    severity="info",
    message="Hello, world!",
)
tenta_client.wait_for_message_publishing()
print("Message 1 published!")

# Publish messages synchronously
# -> the code waits until the message has been published

tenta_client.publish_log_message(
    severity="warning",
    message="Hello, to you too!",
    blocking=True,
    blocking_timeout=5,
)
print("Message 2 published!")

# tear down MQTT connection

tenta_client.teardown()
