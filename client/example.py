import tenta

tenta_client = tenta.TentaClient(
    mqtt_host="localhost",
    mqtt_port=1883,
    mqtt_identifier="server",
    mqtt_password="password",
    sensor_identifier="81bf7042-e20f-4a97-ac44-c15853e3618f",
    revision=1,
)

tenta_client.publish_log_message(
    severity="info",
    message="Hello, world!",
)
tenta_client.wait_for_message_publishing()
print("Message published!")
