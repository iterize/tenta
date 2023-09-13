# fmt: off
# ## Basic Example
#
# **Create the client** and connect to the MQTT broker.


import time
import typing
import tenta
import json
import ssl

tenta_client = tenta.TentaClient(
    mqtt_host="test.mosquitto.org", mqtt_port=1884,
    mqtt_identifier="rw", mqtt_password="readwrite",
    sensor_identifier="81b...", config_revision=17,
)


# **Publish logs asynchronously**, i.e., your code continues to
# run while the message is being published.


tenta_client.publish_log(
    severity="info", message="Hello, world!"
)
tenta_client.publish_log(
    severity="info", message="Hello, to you too!"
)
tenta_client.wait_for_publish()
print("Logs 1-2 published!")


# **Publish logs synchronously**, i.e., your code waits until the
# message has been published successfully.


tenta_client.publish_log(
    severity="warning", message="Hello, to you too!",
    wait_for_publish=True, wait_for_publish_timeout=5,
)
print("Log 3 published!")


# **Publish measurements asynchronously**.


tenta_client.publish_measurement(
    value={
        "temperature": 20.0, "humidity": 50.0,
        "pressure": 1013.25, "voltage": 3.3,
    },
)
tenta_client.wait_for_publish()
print("Measurements published!")


# **Publish acknowledgment asynchronously**, i.e., "did the sensor successfully
# process a new config revision?" -> `True`/`False`.


tenta_client.publish_acknowledgment(
    success=False, revision=20,
)
tenta_client.wait_for_publish()
print("Acknowledgment published!")


# Get the **latest received config** on demand.


config_message: typing.Optional[
    tenta.ConfigMessage
] = tenta_client.get_latest_received_config_message()


# **Tear down** the MQTT connection and the client.


tenta_client.teardown()


# ## Advanced Example
#
# You can pass **callbacks** to the client to get notified when a message has
# been published successfully or when the client receives a new config message.
# 
# You can also check the current **length of the clients message queue** =
# number of messages that have not been published yet. When offline, a full
# queue might raise Exceptions.


tenta_client = tenta.TentaClient(
    mqtt_host="localhost", mqtt_port=1884,
    mqtt_identifier="server", mqtt_password="password",
    sensor_identifier="81b...", config_revision=17,

    # callbacks are optional
    on_config_message=lambda config_message: print(
        f"New config message: {json.dumps(config_message)}"
    ),
    on_publish=lambda message_id: print(
        f"Message with id {message_id} has been published!"
    ),
)

current_queue_length = tenta_client.get_active_message_count()


# By default, all published messages will be tagged by the current timestamp.
# However, by **passing a timestamp** to the functions `publish_log`/
# `publish_measurement`/`publish_acknowledgement`, you can override this behaviour.


tenta_client.publish_log(
    severity="info", message="Hello, world!",
    timestamp=time.time() - 3600,
)
tenta_client.teardown()


# You can communicate using **TLS encryption**.


tenta_client_with_tls = tenta.TentaClient(
    mqtt_host="test.mosquitto.org", mqtt_port=8885,
    mqtt_identifier="rw", mqtt_password="readwrite",
    sensor_identifier="81b...", config_revision=17,

    # tls settings are optional
    # this server certificate is only valid for the MQTT
    # broker hosted at test.mosquitto.org:8885
    tls_parameters=tenta.TLSParameters(
        ca_certs=".../tests/mosquitto.org.crt",
        cert_reqs=ssl.CERT_REQUIRED,
        tls_version=ssl.PROTOCOL_TLS_CLIENT,
    ),
)
tenta_client_with_tls.teardown()


# Finally, if the client does not precisely fit your needs, you can also
# inherit from it and only override the methods that require changes or
# take the client as a starting point for your own implementation since
# this code is open-source in the end.
