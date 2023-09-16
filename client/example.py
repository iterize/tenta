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

    # the sensor identifier is optional; if you do not specify it here you
    # will have to specify it when publishing messages (see below)
    sensor_identifier="81b...",

    # receive_configs is set to true by default a `ValueError` will be raised
    # if this is `True` but `sensor_identifier` has not been specified
    receive_configs=True,
)


# **Publish logs asynchronously**, i.e., your code continues to
# run while the message is being published. You can send them one
# by one or in batches.


tenta_client.publish(
    tenta.LogMessage(severity="info", message="Hello, world!")
)
tenta_client.publish(
    tenta.LogMessage(severity="info", message="Hello, to you too!")
)
tenta_client.publish(
    [
        tenta.LogMessage(severity="warning", message="Excepteur voluptate proident"),
        tenta.LogMessage(severity="error", message="esse aliqua nisi elit"),
    ]
)
tenta_client.wait_for_publish()
print("Logs 1-4 published!")


# **Publish logs synchronously**, i.e., your code waits until the
# message has been published successfully.


tenta_client.publish(
    tenta.LogMessage(severity="warning", message="do incididunt"),
    wait_for_publish=True, wait_for_publish_timeout=5,
)
print("Log 5 published!")

tenta_client.publish(
    [
        tenta.LogMessage(severity="warning", message="dolor elit laboris ipsum"),
        tenta.LogMessage(severity="warning", message="Consequat laboris incididunt")
    ],
    wait_for_publish=True, wait_for_publish_timeout=5,
)
print("Log 6-7 published!")


# You can specify the `sensor_identifier` either for the whole client
# on creation (as seen above) or pass the `sensor_identifier` to the
# `publish` function directly which will override the client's value.
# A `ValueError` will be raised if the `sensor_identifier` is not
# specified anywhere.


tenta_client.publish(
    tenta.LogMessage(severity="warning", message="Hello, to you too!"),
    sensor_identifier="not-81b...",
    wait_for_publish=True, wait_for_publish_timeout=5,
)


# **Publish measurements asynchronously**.


tenta_client.publish(
    tenta.MeasurementMessage(
        value={
            "temperature": 20.0, "humidity": 50.0,
            "pressure": 1013.25, "voltage": 3.3,
        },
    )
)
tenta_client.wait_for_publish()


# You can give log messages and measurements a **timestamp**.
# If you do not specify a timestamp, the current time will be used.


tenta_client.publish(
    tenta.MeasurementMessage(
        value={
            "coolness": 80.0, "swagg": 9001,
        },
        timestamp=time.time() - 3600,
    )
)
tenta_client.wait_for_publish()


# **Publish acknowledgment asynchronously**, i.e., "did the sensor successfully
# process a new config revision?" -> `True`/`False`.


tenta_client.publish(
    tenta.AcknowledgmentMessage(success=False, revision=20)
)
tenta_client.wait_for_publish()


# Get the **latest received config** on demand. This will raise a `ValueError`
# if `receive_configs` has not been set to `True` on client creation.


config_message: typing.Optional[
    tenta.ConfigurationMessage
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
    sensor_identifier="81c...",

    # callbacks are optional
    on_config_message=lambda config_message: print(
        f"New config message: {json.dumps(config_message)}"
    ),
    on_publish=lambda message_id: print(
        f"Message with id {message_id} has been published!"
    ),
)
tenta_client.teardown()


# You can communicate using **TLS encryption**.


tenta_client_with_tls = tenta.TentaClient(
    mqtt_host="test.mosquitto.org", mqtt_port=8885,
    mqtt_identifier="rw", mqtt_password="readwrite",
    sensor_identifier="81b...",

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
