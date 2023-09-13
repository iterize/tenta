# ## Basic Example
#
# **Create the client** and connect to the MQTT broker


import time
import typing
import tenta
import json

tenta_client = tenta.TentaClient(
    mqtt_host="localhost",
    mqtt_port=1883,
    mqtt_identifier="server",
    mqtt_password="password",
    sensor_identifier="81bf7042-e20f-4a97-ac44-c15853e3618f",
    revision=17,
)


# **Publish logs asynchronously**, i.e. your code continues to
# run while the message is being published


tenta_client.publish_log(
    severity="info",
    message="Hello, world!",
)
tenta_client.publish_log(
    severity="info",
    message="Hello, to you too!",
)
tenta_client.wait_for_publish()
print("Logs 1-2 published!")


# **Publish logs synchronously**, i.e. ypur code waits until the
# message has been published successfully


tenta_client.publish_log(
    severity="warning",
    message="Hello, to you too!",
    wait_for_publish=True,
    wait_for_publish_timeout=5,
)
print("Log 3 published!")


# **Publish measurements asynchronously**


tenta_client.publish_measurement(
    value={
        "temperature": 20.0,
        "humidity": 50.0,
        "pressure": 1013.25,
    },
)
tenta_client.wait_for_publish()
print("Measurements published!")


# **Publish acknowledgements asynchronously**, i.e. "did the sensor successfully
# process a new config revision?" -> true/false


tenta_client.publish_acknowledgement(success=False, revision=20)
tenta_client.wait_for_publish()
print("Acknowledgements published!")


# Get the **latest received config** on demand


config_message: typing.Optional[
    tenta.ConfigMessageDict
] = tenta_client.get_latest_received_config_message()


# **Tear down** the MQTT connection and the client


tenta_client.teardown()


# ## Advanced Example
#
# You can gice **callbacks** to the client to get notified when a message has
# been published successfully or when the client receives a new config message.
#
# You can also check the current **length of the clients message queue** =
# number of messages that have not been published yet. When offline, a full
# queue might raise Exceptions.
#
# By default, all published messages will be tagged by the current timestamp.
# However, by **passing a timestamp** to the functions `publish_log`/
# `publish_measurement`/`publish_acknowledgement`, you can override this behaviour.


tenta_client = tenta.TentaClient(
    mqtt_host="localhost",
    mqtt_port=1883,
    mqtt_identifier="server",
    mqtt_password="password",
    sensor_identifier="81bf7042-e20f-4a97-ac44-c15853e3618f",
    revision=1,
    on_config_message=lambda config_message: print(
        f"New config message: {json.dumps(config_message)}"
    ),
    on_publish=lambda message_id: print(
        f"Message with id {message_id} has been published!"
    ),
)

current_queue_length = tenta_client.get_active_message_count()

# Do not use the current timestamp in messages
# same applies to `publish_measurement` and `publish_acknowledgement`
tenta_client.publish_log(
    severity="info",
    message="Hello, world!",
    timestamp=time.time() - 3600,
)

tenta_client.teardown()


# Finally, if the client does not exactly fit your needs, you can also
# inherit from it and only override the methods you need to change or
# take the client as a starting point for your own implementation since
# this code is open-source.